import { describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { resolveIslander } from '../js/pm/profile.js';
import { seedAttraction } from '../js/pm/chemistry.js';
import { createLedger, noteArrival } from '../js/pm/ledger.js';
import { syncLadder } from '../js/pm/ladder.js';
import { emo } from '../js/pm/emotions.js';
import { arriveBombshell, bombshellSteal, eyesOnFor, openCasa } from '../js/pm/arrivals.js';
import { stickOrTwist } from '../js/pm/casa.js';
import { makeIslanders } from './helpers/pm-cast.js';

function villa(total, inside) {
  const cast = makeIslanders(total, 11);
  setPlayers(cast);
  setGs({ bonds: {}, perceivedBonds: {}, relationshipDimensions: {} });
  const state = { ep: 3, day: 8, villa: [], casa: [], split: false, couples: [], profiles: {},
    ledger: createLedger(), secrets: [], seq: 0, shows: {}, believes: {} };
  for (const p of cast) state.profiles[p.name] = resolveIslander(p, {}, streamFor(1, `profile:${p.name}`));
  for (const p of cast.slice(0, inside)) {
    state.villa.push(p.name); noteArrival(state.ledger, p.name, 1); seedAttraction(state, p.name, 1);
  }
  for (let i = 0; i + 1 < inside; i += 2) state.couples.push([cast[i].name, cast[i + 1].name]);
  syncLadder(state);
  return { state, cast };
}

describe('bombshells', () => {
  it('honours an authored eyes-on list and otherwise fills one', () => {
    const { state, cast } = villa(12, 10);
    const b = cast[10].name;
    state.profiles[b].eyesOn = [cast[1].name];
    arriveBombshell(state, b, { ep: 3, seed: 1, rng: streamFor(1, 'b') });
    expect(eyesOnFor(state, b)).toEqual([cast[1].name]);
    const c = cast[11].name;
    arriveBombshell(state, c, { ep: 3, seed: 1, rng: streamFor(2, 'b') });
    expect(eyesOnFor(state, c).length).toBeGreaterThan(0);
  });

  it('a steal leaves the old partner single and is a major moment for all three', () => {
    const { state, cast } = villa(11, 10);
    const b = cast[10].name;
    arriveBombshell(state, b, { ep: 3, seed: 1, rng: streamFor(3, 'b') });
    const r = bombshellSteal(state, b, { rng: streamFor(4, 'b') });
    expect(r).toBeTruthy();
    expect(state.couples.some(c => c.includes(b) && c.includes(r.stole))).toBe(true);
    expect(state.couples.some(c => c.includes(r.leftSingle))).toBe(false);
    expect(r.events[0].major.sort()).toEqual([b, r.stole, r.leftSingle].sort());
  });
});

describe('Casa Amor', () => {
  it('ends with every islander in at most one couple and unpicked arrivals dumped', () => {
    const { state, cast } = villa(16, 10);
    const casaNames = cast.slice(10).map(p => p.name);
    openCasa(state, casaNames, { ep: 8, seed: 1, rng: streamFor(5, 'c'), movingGender: 'f' });
    expect(state.split).toBe(true);
    const r = stickOrTwist(state, { rng: streamFor(6, 'c') });
    expect(state.split).toBe(false);
    const coupled = state.couples.flat();
    expect(new Set(coupled).size).toBe(coupled.length);
    for (const n of r.dumped) {
      expect(casaNames).toContain(n);
      expect(state.villa).not.toContain(n);
    }
    expect(r.ballots.every(b => b.channel === 'casa')).toBe(true);
  });

  it('being stuck with while your partner twisted breaks your heart', () => {
    const { state, cast } = villa(16, 10);
    openCasa(state, cast.slice(10).map(p => p.name), { ep: 8, seed: 1, rng: streamFor(7, 'c'), movingGender: 'f' });
    const r = stickOrTwist(state, { rng: streamFor(8, 'c') });
    for (const n of r.singleSafe) expect(emo(state, n).heartbreak).toBeGreaterThan(0);
  });
});
