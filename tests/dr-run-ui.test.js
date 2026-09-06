// ══════════════════════════════════════════════════════════════════════
// dr-run-ui.test.js — the run tab's pills, and the words on them
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { DR_BADGES, dragBadges } from '../js/dr/badges.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const CAST = Array.from({ length: 12 }, (_, i) => ({
  name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 3 + (i % 7), comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5 },
}));

describe('badges', () => {
  const { rows } = playDragSeason({ cast: CAST, seed: 2, config: { drDoubleShantay: true } });

  it('every ordinary episode carries a win badge, and the finale its own', () => {
    for (const r of rows.slice(0, -1)) expect(dragBadges(r), `episode ${r.num}`).toContain('Win');
    expect(dragBadges(rows[rows.length - 1])).toContain('Finale');
  });

  it('speaks no other show\'s words', () => {
    for (const r of rows) {
      expect(foreignWordsIn(dragBadges(r).replace(/<[^>]+>/g, ' '), 'drag-race')).toEqual([]);
    }
  });

  it('robbed fires only when the host moved somebody two places', () => {
    const robbed = DR_BADGES.find(b => b.id === 'robbed');
    expect(robbed.when({ dr: { bend: [{ name: 'A', panelRank: 1, finalRank: 3 }] } })).toBe(true);
    expect(robbed.when({ dr: { bend: [{ name: 'A', panelRank: 1, finalRank: 2 }] } })).toBe(false);
    // And the other way is not a robbery: being lifted is not being robbed.
    expect(robbed.when({ dr: { bend: [{ name: 'A', panelRank: 4, finalRank: 1 }] } })).toBe(false);
  });

  it('never throws on a malformed or ancient row', () => {
    for (const bad of [null, undefined, {}, { dr: null }, { dr: {} }, { dr: { call: null } },
      { dr: { bend: 'nonsense' } }, { dr: { performances: null } }]) {
      expect(() => dragBadges(bad), JSON.stringify(bad)).not.toThrow();
    }
  });

  it('each badge is distinct and legible', () => {
    expect(new Set(DR_BADGES.map(b => b.id)).size).toBe(DR_BADGES.length);
    for (const b of DR_BADGES) {
      expect(b.text.length).toBeGreaterThan(2);
      expect(b.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
