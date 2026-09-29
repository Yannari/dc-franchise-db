// The finale interview is ONE conversation per queen. Its four beats used to
// be drawn independently, so Michelle asked a heart queen whether she was a
// competitor and she answered "I lift myself up" — the answer to a different
// question in the same pool. Line i of every beat is now one thread.
import { describe, it, expect } from 'vitest';
import { FINALE_BEATS, INTERVIEW_NEEDS } from '../js/dr/data/finale-beats.js';
import { renderFinaleBeats } from '../js/dr/finale.js';
import { rngFor } from '../js/dr/rng.js';

const BEATS = ['finale-interview-ask', 'finale-interview-answer', 'finale-interview-follow', 'finale-interview-close'];
const byId = id => FINALE_BEATS.find(b => b.id === id);

describe('the finale interview', () => {
  it('has one need per thread, and every beat has the same number of threads', () => {
    for (const [tier, needs] of Object.entries(INTERVIEW_NEEDS)) {
      for (const id of BEATS) {
        const t = byId(id).tiers.find(x => x.id === tier);
        expect(t?.lines?.length, `${id}/${tier}`).toBe(needs.length);
      }
    }
  });

  it('draws all four beats for a queen from the same thread, and only threads true of her', () => {
    const archs = { A: 'hero', B: 'challenge-beast', C: 'mastermind', D: 'wildcard' };
    const players = Object.fromEntries(Object.entries(archs).map(([n, archetype]) =>
      [n, { archetype, drag: { comedy: 8, design: 3 } }]));
    // A has no wins and no bottoms; B has the most wins.
    const record = { A: ['SAFE', 'HIGH', 'SAFE'], B: ['WIN', 'WIN', 'BTM2'], C: ['WIN', 'SAFE', 'LOW'], D: ['SAFE', 'SAFE', 'SAFE'] };
    for (let seed = 1; seed <= 40; seed++) {
      const scenes = renderFinaleBeats({
        finalists: ['A', 'B', 'C', 'D'], showcase: { A: 5, B: 6, C: 7, D: 4 },
        cut: ['C', 'D'], rounds: [{ a: 'A', b: 'B', winner: 'B', loser: 'A', scores: { A: 4, B: 6 } }],
        winner: 'B', runnerUp: 'A', placements: ['B', 'A', 'C', 'D'],
        rng: rngFor(seed), players, record, strength: { A: 0.3, B: 1.1, C: 0.5, D: 0 },
      });
      for (const n of ['A', 'B', 'C', 'D']) {
        const mine = scenes.filter(s => BEATS.includes(s.data?.beat) && s.data.players[0] === n);
        expect(mine.map(s => s.data.beat)).toEqual(BEATS);
        const threads = new Set(mine.map(s => s.data.thread));
        expect(threads.size, `${n} seed ${seed}`).toBe(1);
        const need = INTERVIEW_NEEDS[mine[0].data.tier][[...threads][0]];
        if (n === 'A') expect(need).not.toMatch(/wins|bottoms/);
        if (n === 'B') expect(need).not.toMatch(/notTop/);
        // No "0 wins" and no unfilled placeholder in anything she says.
        for (const s of mine) expect(s.text).not.toMatch(/\{|\b0 wins|no wins/);
      }
    }
  });
});
