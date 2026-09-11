// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-chart.test.js — the signature screen, and the one grid behind it
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it, beforeEach } from 'vitest';
import { GRID_RESULTS, gridRows, buildTrackRecordGrid } from '../js/dr/grid.js';
import { rpBuildChart, drChartRevealNext, drChartRevealAll } from '../js/vp-dr/chart.js';
import { buildDragSeasonDocument } from '../js/dr/export.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 11, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}
const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
const season = playDragSeason({
  cast: cast(11, 2), seed: 7,
  bond: (a, b) => bonds[key(a, b)] || 0,
  addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
});
const doc = buildDragSeasonDocument(season.rows, { seasonNumber: 1 });
const episodes = doc.dr.episodes;

beforeEach(() => { window._tvState = {}; window._drSidebar = {}; window._drSeasonRows = season.rows; });

describe('the grid builder', () => {
  it("knows the results with the community's colours, BTM2 among them", () => {
    expect(Object.keys(GRID_RESULTS).sort()).toEqual(
      ['BTM', 'BTM2', 'ELIM', 'FINALIST', 'HIGH', 'LOW', 'OUT', 'SAFE', 'WIN', 'WINNER'].sort());
    for (const [k, v] of Object.entries(GRID_RESULTS)) {
      expect(v.color, k).toBeTruthy();
      expect(v.short.length, k).toBeLessThanOrEqual(4);
    }
    // The two bottoms must be distinguishable, or the split is decorative.
    expect(GRID_RESULTS.BTM.color).not.toBe(GRID_RESULTS.BTM2.color);
    expect(GRID_RESULTS.BTM.title).not.toBe(GRID_RESULTS.BTM2.title);
  });

  it('READS A PUBLISHED DOCUMENT AND LIVE ROWS THE SAME WAY', () => {
    /* The season page holds the first shape and the viewing party the second.
       A builder that knew only one would work perfectly on one screen and
       draw nothing on the other — this project's most-repeated failure, and
       one that takes a played season to notice. */
    const a = gridRows(doc); const b = gridRows(season.rows);
    expect(a.length).toBe(b.length);
    expect(new Set(a.map(r => r.name))).toEqual(new Set(b.map(r => r.name)));
    expect(a[0].cells.length).toBe(b[0].cells.length);
    expect(a[0].name).toBe(doc.winner.name);
    expect(b[0].name).toBe(doc.winner.name);

    /* CELL BY CELL, NOT JUST SHAPE BY SHAPE. The first version of this
       compared row counts, names and widths — all of which matched while the
       two paths disagreed about every lip sync in the season: the exporter
       wrote BTM2 and `state.record` still wrote BTM. Both were internally
       consistent, so nothing failed; it was visible only by rendering the
       live chart and noticing BTM2 appeared nowhere on it. */
    const byName = new Map(b.map(r => [r.name, r]));
    for (const rowA of a) {
      const rowB = byName.get(rowA.name);
      expect(rowB, rowA.name).toBeTruthy();
      expect(rowB.cells.map(c => c.result), `${rowA.name}: the two paths disagree`)
        .toEqual(rowA.cells.map(c => c.result));
    }
  });

  it('orders best first and gives everybody a full row', () => {
    const rows = gridRows(doc);
    expect(rows[0].name).toBe(doc.winner.name);
    expect(rows.map(r => r.placement)).toEqual([...rows.map(r => r.placement)].sort((x, y) => x - y));
    for (const r of rows) expect(r.cells.length, r.name).toBe(episodes.length);
  });

  it('carries the panel rank beside the final rank in the cell', () => {
    // The chart's most interesting hover: where the host moved somebody.
    const cells = gridRows(doc).flatMap(r => r.cells).filter(c => c.panelRank != null);
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.some(c => c.panelRank !== c.finalRank), 'the host never bent anything').toBe(true);
  });

  it('renders one cell per queen per episode, each with a data-result', () => {
    const html = buildTrackRecordGrid(doc, {});
    expect((html.match(/data-result="/g) || []).length)
      .toBe(doc.placements.length * episodes.length);
    expect(html).toMatch(/dr-tr-legend/);
  });

  it('the legend names only what this season actually produced', () => {
    const html = buildTrackRecordGrid(doc, {});
    const legend = html.slice(html.indexOf('dr-tr-legend'));
    const drawn = new Set((html.match(/data-result="([A-Z2]+)"/g) || [])
      .map(m => m.match(/"([A-Z2]+)"/)[1]));
    for (const k of Object.keys(GRID_RESULTS)) {
      if (k === 'OUT') continue;
      const inLegend = legend.includes(`>${GRID_RESULTS[k].label} —`);
      expect(inLegend, `${k}: legend and chart disagree`).toBe(drawn.has(k));
    }
  });

  it('THE BOTTOM REACHES A REAL CHART', () => {
    // A legend entry no season can produce is the dead-code class this was
    // written to end. If BTM2 vanishes, `callWeek` has regressed.
    const drawn = new Set(gridRows(doc).flatMap(r => r.cells).map(c => c.result));
    expect(drawn.has('BTM2'), 'nobody lip synced and survived').toBe(true);
  });

  it('never draws a BTM, because the chart does not have one', () => {
    /* This used to assert the opposite: that both BTM and BTM2 reach a chart,
       on the reading that "named in the bottom and saved" and "lip synced and
       survived" are different facts needing different cells. They are
       different facts. The chart has one word for the first of them and that
       word is LOW.

       Checked against the season 16 wikitext rather than reasoned about:

         {{LOW}}            11
         {{BTM|tomato|2}}   10     <- this is BTM2
         {{BTM}}             1

       and the legend block lists no BTM at all. Its lightpink line reads "The
       contestant was in the bottom, but was not up for elimination" -- which
       is the sentence the engine had been using to define BTM.

       So the set is WIN / HIGH / SAFE / LOW / BTM2 / ELIM. The CALL still
       names three queens on a bottom-three night and still saves one of them
       on the stage; it is only the chart that has one word for her. */
    const drawn = new Set(gridRows(doc).flatMap(r => r.cells).map(c => c.result));
    expect(drawn.has('BTM'), 'a bottom-three night produced a seventh result')
      .toBe(false);
    for (const r of drawn) {
      expect(['WIN', 'HIGH', 'SAFE', 'LOW', 'BTM2', 'ELIM', 'OUT', 'WINNER', 'FINALIST'],
        `${r} is not a result the fandom chart has`).toContain(r);
    }
  });
});

describe('the chart screen', () => {
  it('NEVER DRAWS PAST TONIGHT', () => {
    /* The columns after this episode are not in the DOM at all. Hiding them
       with CSS would put the rest of the season one "view source" away, and
       on THIS screen that is the entire result. */
    const early = rpBuildChart(season.rows[2]);
    const drawn = (early.match(/data-episode="(\d+)"/g) || []).map(m => Number(m.match(/\d+/)[0]));
    expect(drawn.length).toBeGreaterThan(0);
    expect(Math.max(...drawn)).toBeLessThanOrEqual(3);
    // And the later queens' results are not in the markup under any guise.
    expect(early).not.toMatch(/data-result="WINNER"/);
  });

  it('HOLDS THE CROWNING COLUMN BACK, then gives it up on a click', () => {
    /* The finale screen opens one column short on purpose. Every other
       episode's chart opens on last week so tonight is the thing being
       revealed, and the finale is the strongest case for it: the last column
       IS the crowning, and drawing it the moment the screen paints would
       spoil the season on the screen built to withhold it. */
    const finaleRow = season.rows[season.rows.length - 1];
    const atRest = rpBuildChart(finaleRow);
    const drawn = (atRest.match(/data-episode="(\d+)"/g) || []).map(m => Number(m.match(/\d+/)[0]));
    expect(Math.max(...drawn)).toBe(season.rows.length - 1);
    expect(atRest, 'the crown was on the page before anybody clicked')
      .not.toMatch(/data-result="WINNER"/);

    document.body.innerHTML = '<div id="dr-chart-mount"></div>'
      + '<span id="dr-counter-chart"></span><div id="dr-controls-chart"></div>';
    drChartRevealAll('chart', season.rows.length, finaleRow.num);
    const filled = document.getElementById('dr-chart-mount').innerHTML;
    const after = [...document.querySelectorAll('[data-episode]')].map(e => Number(e.dataset.episode));
    expect(Math.max(...after)).toBe(season.rows.length);
    expect(filled).toMatch(/data-result="WINNER"/);
  });

  it('steps episode by episode, not card by card', () => {
    const html = rpBuildChart(season.rows[4]);
    expect(html).toMatch(/drChartRevealNext\('chart', *5/);
    expect(html).toMatch(/Next episode/);
  });

  it('opens on last week, so the screen is never blank and tonight is the reveal', () => {
    const html = rpBuildChart(season.rows[4]);
    const drawn = (html.match(/data-episode="(\d+)"/g) || []).map(m => Number(m.match(/\d+/)[0]));
    expect(Math.max(...drawn)).toBe(4);
  });

  it('a click fills one more column, and reveal-all fills the rest', () => {
    document.body.innerHTML = '<div id="dr-chart-mount"></div>'
      + '<span id="dr-counter-chart"></span><div id="dr-controls-chart"></div>';
    const epNum = 5;
    drChartRevealNext('chart', epNum, epNum);
    let drawn = [...document.querySelectorAll('[data-episode]')].map(e => Number(e.dataset.episode));
    expect(Math.max(...drawn)).toBe(5);
    expect(document.getElementById('dr-counter-chart').textContent).toMatch(/5 \/ 5/);
    expect(document.getElementById('dr-controls-chart').className).toMatch(/dr-done/);

    window._tvState = {};
    document.getElementById('dr-chart-mount').innerHTML = '';
    drChartRevealAll('chart', epNum, epNum);
    drawn = [...document.querySelectorAll('[data-episode]')].map(e => Number(e.dataset.episode));
    expect(Math.max(...drawn)).toBe(5);
  });

  it('draws nothing rather than throwing on a row with no record', () => {
    window._drSeasonRows = null;
    expect(() => rpBuildChart({ num: 1, dr: {} })).not.toThrow();
    expect(rpBuildChart({ num: 1, dr: {} })).toBe('');
  });
});
