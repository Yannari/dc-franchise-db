// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-vp-results.test.js — the call, the lip sync, the exit, the crown
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it, beforeEach } from 'vitest';
import { rpBuildResults, rpBuildLipSync, rpBuildExit } from '../js/vp-dr/results.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 12, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}
const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
const { rows } = playDragSeason({
  cast: cast(12, 6), seed: 3,
  bond: (a, b) => bonds[key(a, b)] || 0,
  addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
});
const ordinary = rows.filter(r => !r.dr.finale);
const finale = rows[rows.length - 1];
const strip = h => h.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');

beforeEach(() => { window._tvState = {}; window._drSidebar = {}; });

describe('the call', () => {
  it('gives every queen a stamp, and the safe ones share one card', () => {
    /* THE SAFE QUEENS ARE ONE CARD, not one row each, and that is the
       design rather than a shortcut: they share a single spoken line
       between them — "you are safe, you may leave the stage" is said to the
       group — so a row each produced a column of portraits with a rank
       arrow, a rubber stamp and no words. Eight of thirteen rows silent on
       the call that found this.
       So the count is: one card for the safe, one row for everybody the
       panel actually placed. */
    for (const row of ordinary) {
      const c = row.dr.call;
      const placed = ['win', 'high', 'low', 'atRisk', 'bottom']
        .reduce((n, k) => n + (c[k] || []).length, 0);
      const expected = placed + ((c.safe || []).length ? 1 : 0);
      const html = rpBuildResults(row);
      const steps = (html.match(/id="dr-step-results-\d+"/g) || []);
      expect(steps.length, `episode ${row.num}`).toBe(expected);
      // AND EVERY SAFE QUEEN IS STILL NAMED, on that one card.
      for (const n of c.safe || []) expect(html, `${n} is not on the safe card`).toContain(n);
    }
  });

  it('IS WHERE THE HOST\'S DECISION FINALLY SHOWS', () => {
    /* The critiques screen deliberately withholds `finalRank` — at that
       point she has not decided. This is the screen where she has, so it is
       the one place the two ranks appear together and a queen the host moved
       is marked as moved. */
    const bentRow = ordinary.find(r => (r.dr.bend || []).some(b => b.panelRank !== b.finalRank));
    expect(bentRow, 'the host never moved anybody all season').toBeTruthy();
    const html = rpBuildResults(bentRow);
    expect(html).toMatch(/the host moved her/);
    expect(html).toMatch(/panel \d+ → \d+/);
  });

  it('shows BTM2 and BTM as different calls', () => {
    const row = ordinary.find(r => (r.dr.call.atRisk || []).length);
    if (!row) return;
    const html = rpBuildResults(row);
    expect(html).toContain('BTM2');
    expect(html).toMatch(/>BTM</);
  });
});

describe('the lip sync', () => {
  it('is a versus, with both queens and the song', () => {
    const row = ordinary.find(r => r.dr.lipsync?.queens?.length);
    const html = rpBuildLipSync(row);
    for (const q of row.dr.lipsync.queens) expect(html).toContain(q);
    expect(html).toContain(row.dr.lipsync.song);
    expect(html).toMatch(/dr-bolt/);
    expect(html).toMatch(/dr-energy/);
  });
});

describe('the exit and the crown', () => {
  it('stamps the queen who left, in the round\'s own verb', () => {
    const row = ordinary.find(r => (r.exits || []).length);
    const html = rpBuildExit(row);
    expect(html).toContain(row.exits[0].name);
    expect(html).toContain(row.exits[0].verb);
    expect(html).toMatch(/dr-bigstamp/);
  });

  it('THE FINALE DRAWS THE BRACKET AND THE CROWN', () => {
    // `dr.finale` is structured data on no scene at all; built from scenes
    // alone this screen loses the entire result of the season.
    const html = rpBuildExit(finale);
    expect(html).toContain(finale.dr.finale.winner);
    for (const r of finale.dr.finale.rounds) {
      expect(html, `${r.a} vs ${r.b}`).toContain(r.a);
      expect(html).toContain(r.b);
    }
    expect(html).toMatch(/dr-crown/);
  });

  it('ANNOUNCES MISS CONGENIALITY, and skips it when there is none', () => {
    /* Plan 6 computes the award. Without an announcement it is a number
       nothing ever says out loud — the "written but unreachable" class. The
       word comes from the registry, never a hardcoded string. */
    const withAward = { ...finale, dr: { ...finale.dr, congeniality: finale.dr.living[1] } };
    const html = rpBuildExit(withAward);
    expect(html).toContain('Miss Congeniality');
    expect(html).toContain(finale.dr.living[1]);
    expect(html).toMatch(/dr-sash/);
    /* A blank sash is worse than no sash. The no-award row has to drop the
       ANNOUNCING SCENE as well as the field: a finale that named nobody never
       had one, because `insertCongenialityScene` only runs when the vote
       returns a winner. Nulling the field alone builds a row real data cannot
       produce, and then tests the screen against it. */
    const noAward = { ...finale, dr: { ...finale.dr, congeniality: null,
      scenes: (finale.dr.scenes || []).filter(s => s.kind !== 'finale:finale-congeniality') } };
    expect(rpBuildExit(noAward)).not.toContain('Miss Congeniality');
  });
});

describe('all three', () => {
  it('build or decline on every episode, and speak this show', () => {
    for (const row of rows) {
      for (const [name, fn] of [['results', rpBuildResults], ['lipsync', rpBuildLipSync],
        ['exit', rpBuildExit]]) {
        let html;
        expect(() => { html = fn(row); }, `${name} on episode ${row.num}`).not.toThrow();
        if (html) {
          expect(html.length, `${name} on episode ${row.num}`).toBeGreaterThan(300);
          expect(foreignWordsIn(strip(html), 'drag-race'), `${name} ep ${row.num}`).toEqual([]);
        }
      }
    }
  });
});
