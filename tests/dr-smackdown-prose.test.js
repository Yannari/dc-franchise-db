// The Smackdown's prose has to belong to the duel it is drawn under.
// Read from a played season: a three-way was narrated from the pair pool
// ("neither of them", "two queens") with the third queen in nobody's
// sentence, and a close duel at 3.2 against 1.9 was "the best thing either of
// them has done all season".
import { describe, it, expect } from 'vitest';
import { smackdownScenes } from '../js/dr/smackdown.js';
import { rngFor } from '../js/dr/rng.js';

const duel = (a, b, sa, sb, extra = {}) => ({
  round: 1, a, b, song: 'Song', winner: sa >= sb ? a : b, loser: sa >= sb ? b : a,
  scores: { [a]: sa, [b]: sb }, adjusted: { [a]: sa, [b]: sb }, ...extra,
});

describe('the smackdown, narrated', () => {
  it('narrates a three-way as three queens', () => {
    const triple = {
      round: 1, triple: true, contestants: ['A', 'B', 'C'], a: 'A', b: 'C', song: 'Song',
      winner: 'A', loser: 'C', scores: { A: 8, B: 7, C: 6 }, adjusted: { A: 8, B: 7, C: 6 },
    };
    for (let seed = 1; seed <= 10; seed++) {
      const sc = smackdownScenes({ field: ['A', 'B', 'C'], duels: [triple], rng: rngFor(seed) })
        .find(s => s.kind === 'smackdown-duel');
      expect(sc.data.tier).toBe('triple');
      expect(sc.data.players).toEqual(['A', 'B', 'C']);
      expect(sc.text).toContain('B');
      expect(sc.text).toContain('C');
      // The pair pool's tells. ("Neither of them" is fine about the two who lost.)
      expect(sc.text).not.toMatch(/two queens|either of them has done|neither of them gives/i);
    }
  });

  it('does not call a duel between two exhausted queens their best work', () => {
    const sc = smackdownScenes({ field: ['A', 'B'], duels: [duel('A', 'B', 3.2, 1.9)], rng: rngFor(3) })
      .find(s => s.kind === 'smackdown-duel');
    expect(sc.data.tier).toBe('scrappy');
    expect(sc.text).not.toMatch(/best thing either/);
  });

  it('emits one duel scene per duel, in bracket order', () => {
    const duels = [duel('A', 'B', 7, 6), duel('C', 'D', 8, 5), { ...duel('A', 'C', 6, 7), round: 2 }];
    const scenes = smackdownScenes({ field: ['A', 'B', 'C', 'D'], duels, rng: rngFor(1) })
      .filter(s => s.kind === 'smackdown-duel');
    expect(scenes.map(s => s.data.players)).toEqual([['A', 'B'], ['C', 'D'], ['A', 'C']]);
  });
});
