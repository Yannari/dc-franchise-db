// ══════════════════════════════════════════════════════════════════════
// vp-dr/chart.js — the track record screen
// ══════════════════════════════════════════════════════════════════════
//
// The signature screen, and the one the community actually reads. Everything
// else in the viewing party is a room with an atmosphere; this is flat,
// editorial, ink on paper — deliberately the opposite, because it is the
// only screen that is a REFERENCE rather than a scene.
//
// ── IT REVEALS BY COLUMN, NOT BY CARD ─────────────────────────────────
//
// Every other screen steps through cards. This one fills the chart an
// EPISODE at a time, because the column arriving is the thing worth
// watching: a queen's whole season lands one week at a time, and a chart
// that appeared all at once would be a table rather than a reveal.
//
// ── AND IT CANNOT SPOIL ───────────────────────────────────────────────
//
// The columns after tonight are not in the DOM at all — `upToEpisode` cuts
// them before the HTML is built, so nothing on the page carries a result the
// viewer has not been shown. Hiding them with CSS would put the whole season
// one "view source" away, which for THIS screen is the entire result.
import { _shell } from './style.js';
import { _state } from './reveal.js';
import { buildTrackRecordGrid, gridRows, TRACK_RECORD_CSS } from '../dr/grid.js';

/** How many episodes this row can honestly show. */
function upTo(row) {
  return Number(row?.num ?? row?.dr?.ep) || 1;
}

/**
 * The rows a chart screen is built from.
 *
 * The VP holds the SEASON so far on `window._drSeasonRows` — the played rows
 * — because a single episode row carries only its own `dr.record` snapshot
 * and that is enough. Falling back to the row itself keeps the screen honest
 * when the season is not on the window (a replayed episode, a test).
 */
function sourceFor(row) {
  const season = (typeof window !== 'undefined' && window._drSeasonRows) || null;
  if (Array.isArray(season) && season.length) {
    // Never past tonight, even if the window holds a finished season.
    return season.filter(r => (Number(r?.num ?? r?.dr?.ep) || 0) <= upTo(row));
  }
  return [row];
}

const SUFFIX = 'chart';

export function rpBuildChart(row) {
  const ep = { num: upTo(row), format: 'drag-race', dr: row?.dr || {} };
  const source = sourceFor(row);
  const rows = gridRows(source);
  if (!rows.length) return '';

  const total = Math.min(rows[0].cells.length, upTo(row));
  const { idx } = _state({ num: ep.num }, SUFFIX);
  // Before the first click the chart shows the season up to LAST week, so the
  // screen is never blank and tonight is the thing being revealed.
  const shown = idx < 0 ? Math.max(1, total - 1) : Math.min(idx + 1, total);

  const grid = buildTrackRecordGrid(source, {
    upToEpisode: shown,
    interactive: true,
    title: `Through ${ep.dr?.challenge?.name ? `episode ${shown}` : `episode ${shown}`}`,
  });

  const controls = `<!--dr-chrome--><div class="dr-controls" id="dr-controls-${SUFFIX}">
    <button type="button" class="dr-btn dr-ghost"
      onclick="drChartRevealAll('${SUFFIX}', ${total}, ${ep.num})">Fill the chart</button>
    <button type="button" class="dr-btn"
      onclick="drChartRevealNext('${SUFFIX}', ${total}, ${ep.num})">Next episode &rsaquo;</button>
    <span class="dr-counter" id="dr-counter-${SUFFIX}">${shown} / ${total}</span>
  </div><!--/dr-chrome-->`;

  return `<style>${TRACK_RECORD_CSS}</style>${_shell(
    `<div id="dr-chart-mount">${grid}</div>`, ep,
    {
      phase: 'chart',
      title: 'The Track Record',
      subtitle: `${rows.length} queens · through episode ${shown}`,
      hud: false,
    },
  )}${controls}`;
}

/**
 * Redraw the chart at a given width.
 *
 * A DOM swap of one mount, not a page rebuild — the same rule every other
 * screen follows. The grid is rebuilt rather than un-hidden because the
 * hidden columns were never in the DOM to begin with; that is the anti-spoil
 * design and it costs one innerHTML.
 */
function _paint(epNum, shown) {
  const mount = document.getElementById('dr-chart-mount');
  if (!mount) return;
  const row = { num: epNum, dr: {} };
  const source = sourceFor(row);
  mount.innerHTML = buildTrackRecordGrid(source, {
    upToEpisode: shown, interactive: true, title: `Through episode ${shown}`,
  });
  const counter = document.getElementById(`dr-counter-${SUFFIX}`);
  const rows = gridRows(source);
  const total = rows.length ? Math.min(rows[0].cells.length, epNum) : 0;
  if (counter) counter.textContent = `${shown} / ${total}`;
  const controls = document.getElementById(`dr-controls-${SUFFIX}`);
  if (controls) controls.classList.toggle('dr-done', shown >= total);
}

/** One more episode of the season. */
export function drChartRevealNext(suffix, total, epNum) {
  const st = _state({ num: epNum }, suffix);
  const start = st.idx < 0 ? Math.max(1, total - 1) : st.idx + 1;
  if (start >= total) { st.idx = total - 1; _paint(epNum, total); return; }
  st.idx = start;
  _paint(epNum, Math.min(st.idx + 1, total));
}

/** The whole season this row is allowed to show. */
export function drChartRevealAll(suffix, total, epNum) {
  const st = _state({ num: epNum }, suffix);
  st.idx = total - 1;
  _paint(epNum, total);
}
