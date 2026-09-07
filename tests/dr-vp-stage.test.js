// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-vp-stage.test.js — the stage, the runway, the critiques, Untucked
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it, beforeEach } from 'vitest';
import {
  rpBuildMainStage, rpBuildRunway, rpBuildCritiques, rpBuildUntucked,
} from '../js/vp-dr/stage.js';
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
const strip = h => h.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');

beforeEach(() => { window._tvState = {}; window._drSidebar = {}; });

describe('the main stage', () => {
  it('seats every judge, and the host in drag', () => {
    const row = ordinary[2];
    const html = rpBuildMainStage(row);
    for (const id of row.dr.judges) expect(html, id).toContain(id === 'rupaul' ? 'rupaul-drag' : id);
  });
});

describe('the runway', () => {
  it('names the category and walks every queen, with her score', () => {
    for (const row of ordinary) {
      const html = rpBuildRunway(row);
      expect(html).toContain(row.dr.runway.category);
      const walkers = Object.keys(row.dr.runway).filter(k => row.dr.runway[k]?.score !== undefined);
      const steps = (html.match(/id="dr-step-runway-\d+"/g) || []);
      expect(steps.length, `episode ${row.num}`).toBe(walkers.length);
    }
  });

  it('THE LEADERBOARD ONLY SHOWS QUEENS WHO HAVE WALKED', () => {
    const row = ordinary[1];
    rpBuildRunway(row);
    const panels = window._drSidebar.runway;
    const order = (row.dr.assignment?.order || []).filter(n => row.dr.runway[n]);
    const walkers = order.length ? order : Object.keys(row.dr.runway).filter(k => row.dr.runway[k]?.score !== undefined);
    for (const later of walkers.slice(1)) {
      expect(panels[0], `${later} was on the board before she walked`).not.toContain(`>${later}<`);
    }
  });
});

describe('the critiques', () => {
  it('gives every critiqued queen a card, with every judge who spoke', () => {
    const row = ordinary.find(r => (r.dr.critiques || []).length);
    const html = rpBuildCritiques(row);
    const queens = [...new Set(row.dr.critiques.map(c => c.queen))];
    for (const q of queens) expect(html, q).toContain(q);
    expect((html.match(/id="dr-step-critiques-\d+"/g) || []).length).toBe(queens.length);
  });

  it('THE FINAL RANK IS NOT ON THIS SCREEN', () => {
    /* The panel ranks, and THEN the host decides. Those are two moments and
       this screen only knows the first: at this point in the night the host
       has not decided, and putting the answer on the screen where the
       question is asked is the whole spoiler. The rail says so out loud. */
    const row = ordinary.find(r => (r.dr.critiques || []).length);
    rpBuildCritiques(row);
    const rail = window._drSidebar.critiques.at(-1);
    expect(rail).toMatch(/has not decided/i);
    // And no cell carries a finalRank that differs from the panel's.
    const bent = (row.dr.bend || []).filter(b => b.panelRank !== b.finalRank);
    const html = rpBuildCritiques(row);
    for (const b of bent) {
      expect(html, `${b.name}'s final rank leaked onto the critiques screen`)
        .not.toContain(`final ${b.finalRank}`);
    }
  });

  it('shows a real disagreement as a real disagreement', () => {
    // Tone comes from each judge's own view, never the call — so a MIXED
    // plate beside a PRAISE plate is not decoration.
    const split = ordinary.find(r => {
      const by = {};
      for (const c of r.dr.critiques || []) (by[c.queen] ||= new Set()).add(c.tone);
      return Object.values(by).some(s => s.size > 1);
    });
    expect(split, 'the panel never disagreed all season').toBeTruthy();
    expect(rpBuildCritiques(split)).toMatch(/the panel is split/);
  });
});

describe('untucked', () => {
  it('builds, and shakes when the room does', () => {
    const any = ordinary.map(rpBuildUntucked).filter(Boolean);
    expect(any.length).toBeGreaterThan(0);
    for (const h of any) expect(h).toMatch(/dr-phase-untucked/);
  });
});

describe('all four', () => {
  it('build or decline on every ordinary episode, and speak this show', () => {
    for (const row of ordinary) {
      for (const [name, fn] of [['stage', rpBuildMainStage], ['runway', rpBuildRunway],
        ['critiques', rpBuildCritiques], ['untucked', rpBuildUntucked]]) {
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
