// ══════════════════════════════════════════════════════════════════════
// dr-smackdown.test.js — the night that belongs to the queens who lost
// ══════════════════════════════════════════════════════════════════════
//
// Checked on the wiki before building: the reunion Smackdown is a SEPARATE
// thing from the LaLaPaRuZa that runs as a maxi challenge during the season.
// It happens one episode before the crowning and it is exclusive to
// non-finalists. Those two facts are most of what these tests assert, because
// they are the two that make it a different feature rather than a repeat.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];

function cast(n = 12, seed = 1) {
  const rng = rngFor(seed);
  const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: i % 2 ? 'villain' : 'hero', age: 22 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}
const season = (seed, config = {}) => playDragSeason({ cast: cast(12, 100 + seed), seed, config });

describe('the reunion Smackdown', () => {
  it('only happens when the season books one', () => {
    expect(season(1).rows.some(r => r.dr?.smackdown), 'fired unasked').toBe(false);
    expect(season(1, { drSmackdown: true }).rows.some(r => r.dr?.smackdown)).toBe(true);
  });

  it('is EXCLUSIVE TO NON-FINALISTS', () => {
    // The rule that makes it a different feature from the LaLaPaRuZa.
    for (let s = 0; s < 10; s++) {
      const out = season(s, { drSmackdown: true });
      const sm = out.rows.find(r => r.dr?.smackdown).dr.smackdown;
      for (const n of sm.field) {
        expect(out.state.living, `seed ${s}: a finalist was in the field`).not.toContain(n);
        expect(out.state.out, `seed ${s}`).toContain(n);
      }
    }
  });

  it('runs one episode before the crowning', () => {
    const out = season(2, { drSmackdown: true });
    const i = out.rows.findIndex(r => r.dr?.smackdown);
    expect(i).toBeGreaterThan(0);
    expect(out.rows[i + 1]?.dr?.finale, 'the finale did not follow it').toBeTruthy();
  });

  it('brackets down to exactly one champion and gives her the title', () => {
    for (let s = 0; s < 10; s++) {
      const sm = season(s, { drSmackdown: true }).rows.find(r => r.dr?.smackdown).dr.smackdown;
      expect(sm.winner, `seed ${s}`).toBeTruthy();
      expect(sm.field, `seed ${s}`).toContain(sm.winner);
      expect(sm.title).toBe('Queen of She Done Already Done Had Herses');
      // A knockout bracket: one duel fewer than the field.
      expect(sm.duels.length, `seed ${s}`).toBe(sm.field.length - 1);
      for (const d of sm.duels) expect(d.song, `seed ${s}`).toBeTruthy();
    }
  });

  it('decides nothing about the crown', () => {
    // It is the one night the eliminated queens are the show, and it must not
    // reach into the competition it is standing outside of.
    for (let s = 0; s < 8; s++) {
      const withIt = season(s, { drSmackdown: true });
      const without = season(s, {});
      expect(withIt.winner, `seed ${s}`).toBe(without.winner);
      expect(withIt.runnerUp, `seed ${s}`).toBe(without.runnerUp);
      expect(withIt.rows.find(r => r.dr?.smackdown).exits).toEqual([]);
    }
  });

  it('is worth something to the queen who wins it', () => {
    // The DELTA, not the total. A queen can win the Smackdown and still end
    // the season net-negative — she was eliminated, and reactions to her
    // critiques cost her popularity on the way. Asserting the total was
    // positive measured the season rather than the Smackdown, and it went red
    // the moment reactions started costing anything.
    const out = season(3, { drSmackdown: true });
    const sm = out.rows.find(r => r.dr?.smackdown).dr.smackdown;
    expect(out.smackdownWinner).toBe(sm.winner);
    const without = season(3, {});
    const gained = (out.state.popularity[sm.winner] || 0)
      - (without.state.popularity[sm.winner] || 0);
    expect(gained, 'winning it changed nothing for her').toBeGreaterThan(0);
  });

  it('does not run when nobody has gone home', () => {
    const out = playDragSeason({ cast: cast(4, 7), seed: 7, config: { drSmackdown: true, drFinale: 'top4' } });
    expect(out.rows.some(r => r.dr?.smackdown)).toBe(false);
  });
});
