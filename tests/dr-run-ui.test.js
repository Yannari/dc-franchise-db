// ══════════════════════════════════════════════════════════════════════
// dr-run-ui.test.js — the run tab's pills, and the words on them
// ══════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
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

// ══════════════════════════════════════════════════════════════════════
// The hub is this show's hub, and the viewing party actually renders
// ══════════════════════════════════════════════════════════════════════
describe('the live tab', () => {
  it('declares a venue in the registry rather than a boolean in the hub', async () => {
    const { SHOWS, showWords } = await import('../js/shows.js');
    /* The season hub keyed its venue on `format === 'traitors'` plus a
       `tr-castle` entry duplicating that show's accent, so a show with no
       boolean fell through to `config.setting` — which on a runway season
       still says whatever the season was built as. It printed "HOSTED CAMP"
       in Total Drama's yellow across a drag hub. */
    expect(SHOWS['drag-race'].venue?.label).toBe('The Werk Room');
    expect(SHOWS.traitors.venue?.label).toBe('The Castle');
    // A show whose venue is a season CHOICE must NOT declare one.
    expect(SHOWS['total-drama'].venue).toBeUndefined();
    expect(SHOWS['big-brother'].venue).toBeUndefined();
    // And every show says what an ordinary round is called.
    for (const f of Object.keys(SHOWS)) {
      expect(showWords(f).quietRound, `${f} has no quietRound`).toBeTruthy();
    }
  });

  it('the hub reads no hardcoded show name for a drag season', async () => {
    const src = readFileSync('js/run-ui.js', 'utf8');
    expect(src, 'the castle boolean is back').not.toMatch(/const _castle\s*=/);
    expect(src, 'a tr-castle venue entry is back').not.toMatch(/'tr-castle':/);
  });

  /* THE BUG THAT MADE THE VIEWING PARTY BLANK. `buildVPScreens` sets the
     module-level `vpScreens`, and every caller ignores the return value —
     `buildVPScreens(ep); renderVPScreen();` is the shape at all of them. The
     drag branch only RETURNED, so opening a drag episode left `vpScreens`
     holding whatever the previous episode put there. Nothing failed, because
     the returned value was correct; it simply never reached the renderer. */
  it('populates the module-level vpScreens the renderer reads', async () => {
    const { playDragSeason } = await import('../js/dr/season.js');
    const vps = await import('../js/vp-screens.js');
    const { rngFor } = await import('../js/dr/rng.js');
    const S = ['physical', 'endurance', 'mental', 'social', 'strategic',
      'loyalty', 'boldness', 'intuition', 'temperament'];
    const g = rngFor(9); const r = () => 1 + Math.floor(g() * 10);
    const cast = Array.from({ length: 12 }, (_, i) => ({
      name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
      archetype: 'hero', age: 22 + i,
      stats: Object.fromEntries(S.map(k => [k, r()])),
      drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
    }));
    const { rows } = playDragSeason({ cast, seed: 4, config: { drReunion: true } });
    for (const row of rows) {
      window.vpEpNum = row.num;
      vps.buildVPScreens(row);
      expect(vps.vpScreens.length, `episode ${row.num} drew nothing`).toBeGreaterThan(0);
    }
  });
});
