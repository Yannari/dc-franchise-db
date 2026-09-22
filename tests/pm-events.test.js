import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { getBond } from '../js/bonds.js';
import { streamFor } from '../js/dr/rng.js';
import { resolveIslander } from '../js/pm/profile.js';
import { seedAttraction } from '../js/pm/chemistry.js';
import { createLedger, noteArrival } from '../js/pm/ledger.js';
import { generateEpisodeEvents, makeEvent, partnerOf, airLater, PHASE_BUDGETS, KINDS }
  from '../js/pm/events.js';
import { makeIslanders } from './helpers/pm-cast.js';

function villa(n = 10) {
  const cast = makeIslanders(n, 3);
  setPlayers(cast);
  setGs({ bonds: {}, perceivedBonds: {}, relationshipDimensions: {}, activePlayers: cast.map(p => p.name) });
  const state = { ep: 2, day: 5, villa: [], casa: [], split: false, couples: [], profiles: {},
    ledger: createLedger(), secrets: [], seq: 0, shows: {}, believes: {} };
  for (const p of cast) {
    state.profiles[p.name] = resolveIslander(p, {}, streamFor(1, `profile:${p.name}`));
    state.villa.push(p.name); noteArrival(state.ledger, p.name, 1); seedAttraction(state, p.name, 1);
  }
  for (let i = 0; i + 1 < n; i += 2) state.couples.push([cast[i].name, cast[i + 1].name]);
  return state;
}

describe('an episode of villa events', () => {
  let state;
  beforeEach(() => { state = villa(); });

  it('fills about a hundred events across the four phases', () => {
    const evs = generateEpisodeEvents(state, streamFor(1, 'ep:2'));
    const total = Object.values(PHASE_BUDGETS).reduce((a, b) => a + b, 0);
    expect(evs.length).toBeGreaterThanOrEqual(total * 0.9);
    expect(new Set(evs.map(e => e.phase))).toEqual(new Set(['morning', 'day', 'event', 'evening']));
  });

  it('every event is a known kind, names real islanders and keeps names out of the template', () => {
    for (const ev of generateEpisodeEvents(state, streamFor(2, 'ep:2'))) {
      expect(KINDS[ev.kind]).toBeTruthy();
      expect(ev.players.every(n => state.villa.includes(n))).toBe(true);
      for (const n of state.villa) expect(ev.tpl.includes(n)).toBe(false);
    }
  });

  it('about a quarter of events carry a beach-hut cutaway', () => {
    const evs = generateEpisodeEvents(state, streamFor(3, 'ep:2'));
    const huts = evs.filter(e => e.hut).length / evs.length;
    expect(huts).toBeGreaterThan(0.15);
    expect(huts).toBeLessThan(0.35);
  });

  it('only aired events write the public ledger', () => {
    const hidden = makeEvent(state, streamFor(4, 'x'), { phase: 'day', kind: 'comedy',
      players: [state.villa[0]], aired: false });
    expect(state.ledger.raw[state.villa[0]] || 0).toBe(0);
    airLater(state, hidden);
    expect(state.ledger.raw[state.villa[0]]).toBeGreaterThan(0);
    expect(state.ledger.major[state.villa[0]]).toBe(true);
  });

  it('a couple chat raises the bond and a pull on a coupled islander leaves a secret', () => {
    const [a, b] = state.couples[0];
    const before = getBond(a, b);
    makeEvent(state, streamFor(5, 'x'), { phase: 'day', kind: 'chat', players: [a, b] });
    expect(getBond(a, b)).toBeGreaterThan(before);
    const [c] = state.couples[1];
    makeEvent(state, streamFor(6, 'x'), { phase: 'day', kind: 'pull', players: [a, c] });
    expect(state.secrets.some(s => s.who === a && s.partner === partnerOf(state, a))).toBe(true);
  });
});
