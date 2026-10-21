// An Either/Or's lines say which side the team took, so they have to be for the side it took. The user's Home City
// episode (2026-10-21): "Stairs. Please. Stairs." / "The elevator's faster. We're doing the deck." aired for a team
// that then climbed the stairs.
import { describe, it, expect } from 'vitest';
import { POOLS } from '../js/rr/script/lines/index.js';
import { PLACES } from '../js/rr/places.js';

const EITHER = new Map();
for (const p of Object.values(PLACES)) for (const s of p.stretches) if (s.kind === 'either') EITHER.set(s.id, s.sides.map(x => x.id));

describe('rr lines: an Either/Or side is named only for the team on it', () => {
  it('gates every challenge\'s own decide-side line on the side it picks', () => {
    const bad = [];
    for (const [k, list] of Object.entries(POOLS)) {
      if (!k.startsWith('decide-side')) continue;
      for (const e of list) {
        const sides = EITHER.get(e.when?.taskId);
        if (!sides) continue;
        if (!sides.includes(e.when.side)) bad.push(`${e.id} (${e.when.taskId}: ${e.when.side ?? 'no side'})`);
      }
    }
    expect(bad).toEqual([]);
  });
});
