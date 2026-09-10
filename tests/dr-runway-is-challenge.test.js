// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-runway-is-challenge.test.js — a design night has one look, judged once
// ══════════════════════════════════════════════════════════════════════
//
// On a Ball, a Design challenge and a Runway challenge the thing she presents
// on the main stage IS the thing the challenge set her to make. The week ran
// `runwayScore` on top of the challenge anyway, so the same garment was scored
// twice on two independent dice — and could disagree with itself, marking a
// queen down on the walk she had just won the challenge with. The screen drew
// a Runway section narrating a look the challenge had narrated a moment
// earlier.
//
// `runwayIsChallenge` in js/dr/data/challenges.js says which challenges
// deliver a look. Set it on a new one and the second walk goes away with it.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { dragScreens } from '../js/vp-dr/screens.js';
import { MAXI_TYPES } from '../js/dr/data/challenges.js';

const STATS = ['physical','endurance','mental','social','strategic','loyalty','boldness','intuition','temperament'];
const DRAG = ['acting','comedy','dance','design','runway','lipsync','singing'];
const CAST = Array.from({ length: 10 }, (_, i) => ({
  name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'wildcard', age: 25,
  stats: Object.fromEntries(STATS.map((s, j) => [s, 3 + ((i * 7 + j * 3) % 7)])),
  drag: Object.fromEntries(DRAG.map((s, j) => [s, 3 + ((i * 5 + j * 4) % 7)])),
}));

const week = (maxiId, seed = 99) => playDragSeason({
  cast: CAST, seed,
  config: { drSchedule: [{ episode: 2, maxiId }], drFinale: 'top4' },
}).rows[1];

const look = row => ({
  section: dragScreens(row).map(s => s.id).includes('dr-runway'),
  marker: (row.dr.scenes || []).some(s => s.kind === 'runway'),
  walks: (row.dr.scenes || []).filter(s => /^stage:walk/.test(s.kind)).length,
});

const DESIGN = MAXI_TYPES.filter(m => m.runwayIsChallenge).map(m => m.id);

describe('a challenge whose deliverable is the look', () => {
  it('is exactly the three that build one', () => {
    // Not an arbitrary list: if a fourth design challenge is added and the
    // flag is forgotten, this is where that shows up.
    expect(DESIGN.sort()).toEqual(['ball', 'design', 'runway-challenge']);
  });

  it('walks no second runway', () => {
    for (const id of DESIGN) {
      const row = week(id);
      expect(row.dr.challenge.id, `${id} did not run`).toBe(id);
      const l = look(row);
      expect(l.section, `${id} still draws a Runway section`).toBe(false);
      expect(l.marker, `${id} still calls a runway category`).toBe(false);
      expect(l.walks, `${id} still narrates ${l.walks} walk beats`).toBe(0);
    }
  });

  it('scores the look once — the walk IS the challenge result', () => {
    for (const id of DESIGN) {
      const row = week(id);
      for (const n of row.dr.living) {
        const r = row.dr.runway[n];
        expect(r.isChallenge, `${id}/${n}`).toBe(true);
        // The panel and the chart read runway[n].score, so it still has to be
        // there — it just is not a second opinion any more.
        expect(typeof r.score).toBe('number');
      }
    }
  });

  it('leaves every other challenge with its runway — the control arm', () => {
    /* WITHOUT THIS the assertions above pass on a build that removed the
       runway from the whole show. */
    for (const id of ['acting', 'talent-show', 'snatch-game']) {
      const row = week(id);
      const l = look(row);
      expect(l.section, `${id} lost its runway`).toBe(true);
      expect(l.marker, `${id} lost its category call`).toBe(true);
      expect(l.walks, `${id} narrates no walks`).toBeGreaterThan(0);
    }
  });

  it('still separates the two on a night the panel disagrees about', () => {
    // Across several seeds, because one seed agreeing proves nothing.
    for (const seed of [7, 21, 44]) {
      const row = week('design', seed);
      expect(dragScreens(row).map(s => s.id)).not.toContain('dr-runway');
      const first = row.dr.living[0];
      expect(row.dr.runway[first].walks.length).toBe(1);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════
// The panel stays a second reading, and the screen stops contradicting it
// ══════════════════════════════════════════════════════════════════════
describe('what folding the runway did to the panel', () => {
  it('does not let one number carry two weights', async () => {
    /* With `runway === perf`, `t.challenge * perf + t.runway * perf` points
       about 70% of a seat at a single number, and the panel stops being a
       reading of the night — it becomes the challenge score restated, and the
       middle step of CLAUDE.md's three-step rule disappears.
       Measured at the seam so no season rng can drift between the two arms:
       the same entries, judged twice, differing only in the fold. */
    const { judgeViews, panelRanking } = await import('../js/dr/judging.js');
    const { JUDGES } = await import('../js/dr/data/judges.js');
    const { rngFor } = await import('../js/dr/rng.js');

    const drift = fold => {
      let moved = 0; let places = 0;
      for (let s = 0; s < 60; s++) {
        const rng = rngFor(900 + s);
        const entries = Array.from({ length: 12 }, (_, i) => {
          const perf = 1 + rng() * 9;
          return { name: `Q${i + 1}`, style: 'camp', perf,
            runway: perf, runwayIsChallenge: fold,
            risk: rng(), polish: 1 + rng() * 9, form: (rng() - 0.5) * 2 };
        });
        const order = panelRanking(judgeViews(JUDGES.slice(0, 4), entries, {}, rng))
          .map(r => r.name);
        const byPerf = [...entries].sort((a, b) => b.perf - a.perf).map(e => e.name);
        order.forEach((n, i) => { places++; if (byPerf.indexOf(n) !== i) moved++; });
      }
      return moved / places;
    };
    const echoed = drift(false);
    const reweighted = drift(true);
    // 71% -> 82% when this was written. The direction is the assertion; the
    // exact figures move whenever a judge's taste is retuned.
    expect(reweighted, `re-weighted ${reweighted} vs echoed ${echoed}`)
      .toBeGreaterThan(echoed);
  });

  it('prints the score the placement list is actually about', () => {
    /* The row showed `perf` beside a position taken from the panel ranking --
       two different quantities -- so the column never sorted and a queen could
       sit fifth on 8.5 above a second place on 7.2. */
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..',
      'js', 'vp-dr', 'challenge.js'), 'utf8');
    /* Anchored on the heading, not on a class name: `ball-board` and
       `ball-final` both appear in the CSS far earlier in the file, so slicing
       between them ran backwards and matched nothing — the first version of
       this test passed on an empty string. */
    const at = src.indexOf('Panel placement');
    expect(at, 'the placement list is gone').toBeGreaterThan(-1);
    const block = src.slice(at, at + 1200);
    expect(block).toContain('paddleTotals[r.name]');
    expect(block, 'the placement list is printing perf again')
      .not.toMatch(/ball-final-sc">\$\{n1\(p\?\.perf\)/);
  });
});
