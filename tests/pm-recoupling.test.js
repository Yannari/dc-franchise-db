import { describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { setRelationshipDimension } from '../js/relationships.js';
import { streamFor } from '../js/dr/rng.js';
import { resolveIslander } from '../js/pm/profile.js';
import { seedAttraction } from '../js/pm/chemistry.js';
import { createLedger, noteArrival } from '../js/pm/ledger.js';
import { runRecoupling } from '../js/pm/recoupling.js';
import { makeIslanders } from './helpers/pm-cast.js';

function villa(n) {
  const cast = makeIslanders(n, 5);
  setPlayers(cast);
  setGs({ bonds: {}, perceivedBonds: {}, relationshipDimensions: {}, activePlayers: cast.map(p => p.name) });
  const state = { ep: 2, day: 5, villa: [], casa: [], split: false, couples: [], profiles: {},
    ledger: createLedger(), secrets: [], seq: 0, shows: {}, believes: {} };
  for (const p of cast) {
    state.profiles[p.name] = resolveIslander(p, {}, streamFor(1, `profile:${p.name}`));
    state.villa.push(p.name); noteArrival(state.ledger, p.name, 1); seedAttraction(state, p.name, 1);
  }
  return state;
}

describe('recoupling', () => {
  it('everybody is either in a couple or single, never both, and picks are ballots', () => {
    const s = villa(11);
    const r = runRecoupling(s, { rng: streamFor(1, 'rc'), pickerGender: 'f' });
    const coupled = r.couples.flat();
    expect(new Set(coupled).size).toBe(coupled.length);
    expect([...coupled, ...r.single].sort()).toEqual([...s.villa].sort());
    expect(r.single.length).toBeGreaterThanOrEqual(1);   // 6 f and 5 m
    expect(r.ballots.every(b => b.channel === 'recoupling')).toBe(true);
  });

  it('a couple in love picks each other back', () => {
    const s = villa(10);
    const [f, m] = [s.villa[0], s.villa[1]];
    s.couples = [[f, m]];
    s.profiles[f].stats.loyalty = 10; s.profiles[f].intent = 'love';
    for (const [a, b] of [[f, m], [m, f]]) {
      setRelationshipDimension(a, b, 'attraction', 9);
      setRelationshipDimension(a, b, 'love', 8);
      setRelationshipDimension(a, b, 'affection', 8);
    }
    let kept = 0;
    for (let i = 0; i < 20; i++) {
      const r = runRecoupling(s, { rng: streamFor(i * 7919 + 13, 'rc'), pickerGender: 'f' });
      if (r.couples.some(c => c.includes(f) && c.includes(m))) kept++;
    }
    expect(kept).toBeGreaterThanOrEqual(16);
  });

  it('nobody decides from what the other person REALLY feels', () => {
    // The chooser reads their own feelings and what they believe; a partner
    // secretly in love with somebody else does not pull them back (spec §7).
    const s = villa(10);
    const [f, m, m2] = [s.villa[0], s.villa[1], s.villa[3]];
    setRelationshipDimension(f, m, 'attraction', 9);
    setRelationshipDimension(m2, f, 'attraction', 10);   // m2 is secretly mad about f
    s.believes = {};                                      // f has been told nothing
    const picks = new Set();
    for (let i = 0; i < 12; i++) {
      const r = runRecoupling(s, { rng: streamFor(i * 7919 + 13, 'rc'), pickerGender: 'f' });
      const c = r.couples.find(x => x.includes(f));
      if (c) picks.add(c[0] === f ? c[1] : c[0]);
    }
    expect([...picks]).toContain(m);
  });
});
