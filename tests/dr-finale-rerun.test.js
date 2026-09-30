// ══════════════════════════════════════════════════════════════════════
// dr-finale-rerun.test.js — re-running the finale re-runs the finale
// ══════════════════════════════════════════════════════════════════════
//
// The user: "i try rerun the finale but the winner never change and it add
// an episode". Two causes, both in playDragSeason's resume:
//   - the finale drew from the season's base dice, which ignore the re-run
//     counter, so every press replayed the same coin flips;
//   - the Smackdown and the Reunion were booked again ahead of it, having
//     already aired, so every press grew the season.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n, seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    // Even craft, so the crown is genuinely open and a re-roll can move it.
    drag: { acting: 6, comedy: 6, dance: 6, design: 6, runway: 6, lipsync: 6, singing: 6 },
  }));
}
const config = { drSmackdown: true, drReunion: true };

describe('re-running the finale', () => {
  it('keeps the season the same length and can crown somebody else', () => {
    let moved = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const c = cast(12, seed * 11);
      const first = playDragSeason({ cast: c, seed, config }).rows;
      // The reunion comes AFTER the crowning now (the user's call).
      const fi = first.findIndex(r => r.dr?.finale);
      const finale = first[fi];
      expect(finale?.dr?.finale, `seed ${seed}`).toBeTruthy();
      expect(first[fi + 1]?.dr?.reunion, 'the season booked no reunion after the finale').toBeTruthy();
      const before = first.slice(0, fi);
      expect(before.some(r => r.dr?.smackdown), 'the season booked a smackdown').toBe(true);
      // The room as the last elimination week left it — what the viewer resumes from.
      const lastWeek = [...before].reverse().find(r => r.dr?.state);
      const winners = new Set([finale.dr.finale.winner]);
      for (let nonce = 1; nonce <= 6; nonce++) {
        const again = playDragSeason({
          cast: c, seed,
          config: { ...config, drReroll: { from: finale.num, nonce } },
          resume: { state: lastWeek.dr.state, num: finale.num, episodes: before },
        }).rows;
        // The finale comes back, then its reunion — no second Smackdown before it.
        expect(again.map(r => r.num), `seed ${seed} nonce ${nonce}`).toEqual([finale.num, finale.num + 1]);
        expect(again[0].dr.finale).toBeTruthy();
        expect(again[1].dr.reunion).toBeTruthy();
        winners.add(again[0].dr.finale.winner);
      }
      if (winners.size > 1) moved++;
    }
    // Six presses of an open crown, on six seasons: it has to move somewhere.
    expect(moved).toBeGreaterThan(2);
  });
});
