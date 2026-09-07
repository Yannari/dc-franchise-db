// ══════════════════════════════════════════════════════════════════════
// dr-rankings.test.js — the board, and what it is allowed to charge for
// ══════════════════════════════════════════════════════════════════════
//
// The rule this file enforces is one this project learned the hard way: a
// count of anything a longer run accumulates is placement measured twice, and
// the base already spends 26 points on placement. So every column is measured
// against final placement BEFORE it is priced, and its DENSITY is printed
// beside the correlation, because a column nobody ever scores is decoration
// however independent it looks.
import { describe, expect, it } from 'vitest';
import { BOARD_FILES } from '../js/ranking-boards.js';
import { RU_SHOW, computeScore, placementPct } from '../js/rankings-update.js';
import { buildDragSeasonDocument, dragBoardStats } from '../js/dr/export.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 12, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

describe('the board', () => {
  it("has its own file, never another show's", () => {
    expect(BOARD_FILES['drag-race']).toBe('rankings_dr.json');
    for (const other of ['total-drama', 'big-brother', 'traitors']) {
      expect(BOARD_FILES['drag-race']).not.toBe(BOARD_FILES[other]);
    }
  });

  it("prices the show's own currencies and no advantage lifecycle", () => {
    const c = RU_SHOW['drag-race'];
    expect(c.comp1.label).toMatch(/maxi/i);
    expect(c.comp2.label).toMatch(/lip sync/i);
    // Highs is the most placement-shaped of the three and must stay cheapest.
    expect(c.comp3.weight).toBeLessThan(c.comp2.weight);
    expect(c.comp2.weight).toBeLessThan(c.comp1.weight);
    expect(c.adv).toBeFalsy();
  });

  it('DECLARES a social column, so the wrong default cannot fire', () => {
    /* `_ruScore` falls back to Total Drama's `social` when a show declares
       none, and that fallback is the votes curve: it reads the column as
       votes cast against, finds zero, and hands every queen a bonus for votes
       she was never eligible to receive. Declaring it is the whole point;
       the weight is zero because comp2 already prices the same event. */
    const c = RU_SHOW['drag-race'];
    expect(c.social, 'no social column — the votes curve would fire').toBeTruthy();
    expect(c.social.kind).toBe('survived');
    expect(c.social.kind).not.toBe('votes');
    expect(c.social.weight).toBe(0);
    expect(c.social.prose.zero).not.toMatch(/vote/i);
  });

  it('reads its numbers from its own block, never another show\'s field', () => {
    const read = RU_SHOW['drag-race'].read;
    const got = read({ dr: { wins: 3, lipsyncWins: 2, highs: 4, bottoms: 5 } });
    expect(got).toMatchObject({ comp1: 3, comp2: 2, comp3: 4, social: 5 });
    // A row from another show must score nothing here rather than borrowing
    // whatever field happens to share a name.
    expect(read({ bb: { hohWins: 9 }, immunityWins: 9 }).comp1).toBe(0);
  });
});

describe('the currencies, measured', () => {
  const rows = [];
  for (let s = 0; s < 60; s++) {
    const doc = buildDragSeasonDocument(
      playDragSeason({ cast: cast(12, 300 + s), seed: s }).rows, { seasonNumber: s + 1 });
    for (const p of doc.placements) {
      rows.push({ placement: p.placement, finalist: p.placement <= 4, ...dragBoardStats(doc, p.name) });
    }
  }
  const corr = (key, pool = rows) => {
    const xs = pool.map(r => r[key]); const ys = pool.map(r => r.placement);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const my = ys.reduce((a, b) => a + b, 0) / ys.length;
    const cov = xs.reduce((t, x, i) => t + (x - mx) * (ys[i] - my), 0);
    const sx = Math.sqrt(xs.reduce((t, x) => t + (x - mx) ** 2, 0));
    const sy = Math.sqrt(ys.reduce((t, y) => t + (y - my) ** 2, 0));
    return sx && sy ? cov / (sx * sy) : 0;
  };
  const density = key => rows.filter(r => r[key] > 0).length / rows.length;

  it('reports correlation AND density for each column', () => {
    for (const k of ['maxiWins', 'lipsyncWins', 'highs', 'bottoms']) {
      // eslint-disable-next-line no-console
      console.log(`${k.padEnd(12)} r=${corr(k).toFixed(3)}  density=${(density(k) * 100).toFixed(0)}%`);
    }
    // Nothing may be placement measured twice: the -0.924 case from the manual.
    for (const k of ['maxiWins', 'lipsyncWins', 'highs']) {
      expect(Math.abs(corr(k)), `${k} is placement wearing a hat`).toBeLessThan(0.85);
    }
    // A column nobody ever scores is decoration.
    for (const k of ['maxiWins', 'lipsyncWins', 'bottoms']) {
      expect(density(k), `${k} fires for nobody`).toBeGreaterThan(0.05);
    }
  });

  it('HIGHS IS CHEAPEST BECAUSE IT IS THE MOST PLACEMENT-SHAPED', () => {
    // Measured -0.518 against maxi wins' -0.451: the opposite way round from
    // the intuition that the biggest achievement is the most placement-like.
    // If this ever flips, the weights below it are being justified by a
    // sentence that is no longer true.
    expect(Math.abs(corr('highs'))).toBeGreaterThan(Math.abs(corr('maxiWins')));
    expect(Math.abs(corr('lipsyncWins'))).toBeLessThan(Math.abs(corr('maxiWins')));
  });

  it('BOTTOMS IS SURVIVORSHIP, WHICH IS WHY IT IS NOT CHARGED FOR', () => {
    /* Pooled it reads ~0, and that zero is NOT independence — it is two
       effects at different levels cancelling. Finalists average about one
       bottom and everyone else about one and a half, so across groups more
       bottoms looks worse; within the non-finalists more bottoms runs clearly
       negative, because being in the bottom four times means you were there
       for four more episodes.
       The plan for this board specified a -0.5 penalty on exactly this
       column. Charging it would have charged 79% of the board for surviving. */
    const rest = rows.filter(r => !r.finalist);
    const top = rows.filter(r => r.finalist);
    expect(Math.abs(corr('bottoms')), 'pooled bottoms should read near zero').toBeLessThan(0.1);
    expect(corr('bottoms', rest), 'within the non-finalists it must run negative').toBeLessThan(-0.15);
    const meanOf = pool => pool.reduce((t, r) => t + r.bottoms, 0) / pool.length;
    expect(meanOf(top), 'finalists should average fewer bottoms than the rest')
      .toBeLessThan(meanOf(rest));
    expect(RU_SHOW['drag-race'].social.weight, 'the survivorship column is being charged for').toBe(0);
  });
});

describe('the scorer, end to end on a real season', () => {
  /* The config being right is not the same as the board being right: every
     previous show that broke here broke in the LOADER, not the rubric, and
     the symptom both times was a board ranked on placement alone with every
     column reading zero — which looks exactly like a working board. So this
     runs the real scorer over a real season and checks the columns move it. */
  const doc = buildDragSeasonDocument(
    playDragSeason({ cast: cast(12, 311), seed: 11 }).rows, { seasonNumber: 1 });
  const rub = RU_SHOW['drag-race'];
  const scored = doc.placements.map(p => {
    const cols = rub.read({ dr: p.dr });
    return {
      p, cols,
      // The scorer's own field names: `immWins`/`rewWins`/`comp3Wins` are what
      // it calls the three competition columns whatever the show calls them,
      // and `format` is how it finds this show's rubric.
      score: computeScore({
        format: 'drag-race',
        allPcts: [placementPct(p.placement, doc.castSize)],
        placement: p.placement, castSize: doc.castSize,
        wins: p.placement === 1 ? 1 : 0, coWin: false,
        nonWinFinals: p.placement === 2 ? 1 : 0, numSeasons: 1,
        isFinalist: p.placement <= 2,
        immWins: cols.comp1, rewWins: cols.comp2, comp3Wins: cols.comp3,
        socialCol: cols.social,
        advFound: 0, advPlayed: 0, advWasted: 0, advHeld: 0,
        alliances: 0, strategicScore: 0, quit: false, override: 0, fanFav: false,
      }),
    };
  });

  it('reads non-zero columns for somebody', () => {
    // The Big Brother and Traitors failure, both times: every column loaded
    // zero because the loader was reading another show's field names.
    for (const k of ['comp1', 'comp2', 'comp3']) {
      expect(scored.some(x => x.cols[k] > 0), `${k} is zero for the entire cast`).toBe(true);
    }
  });

  it('produces a score in range for every queen', () => {
    for (const x of scored) {
      expect(x.score, x.p.name).toBeGreaterThan(0);
      expect(x.score, x.p.name).toBeLessThanOrEqual(100);
    }
  });

  it('IS NOT THE FINISH ORDER WITH EXTRA STEPS', () => {
    /* The whole point of the columns. If the board's order matches the
       placement order on every season, the columns are decoration and the
       base is doing all the work — which is exactly what happened to Big
       Brother for a season and to the castle before that.

       MEASURED OVER 40 SEASONS rather than asserted on one, because a single
       season coming out in finish order is ordinary: the first one tried
       did, and a one-season assertion would have failed on a working board.
       What matters is the rate. */
    let reordered = 0;
    for (let s = 0; s < 40; s++) {
      const d = buildDragSeasonDocument(
        playDragSeason({ cast: cast(12, 700 + s), seed: s }).rows, { seasonNumber: 1 });
      const rows = d.placements.map(p => {
        const cols = rub.read({ dr: p.dr });
        return {
          placement: p.placement,
          score: computeScore({
            format: 'drag-race',
            allPcts: [placementPct(p.placement, d.castSize)],
            placement: p.placement, castSize: d.castSize,
            wins: p.placement === 1 ? 1 : 0, coWin: false,
            nonWinFinals: p.placement === 2 ? 1 : 0, numSeasons: 1,
            isFinalist: p.placement <= 2,
            immWins: cols.comp1, rewWins: cols.comp2, comp3Wins: cols.comp3,
            socialCol: cols.social,
            advFound: 0, advPlayed: 0, advWasted: 0, advHeld: 0,
            alliances: 0, strategicScore: 0, quit: false, override: 0, fanFav: false,
          }),
        };
      });
      const byScore = [...rows].sort((a, b) => b.score - a.score);
      if (byScore.some((x, i) => x.placement !== rows[i].placement)) reordered++;
    }
    // eslint-disable-next-line no-console
    console.log(`the columns reorder the board in ${reordered}/40 seasons`);
    expect(reordered, 'the columns never move anybody — they are decoration')
      .toBeGreaterThan(12);
  });
});
