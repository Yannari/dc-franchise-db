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
  const cap = upTo(row);
  const mine = r => r && (r.dr || r.format === 'drag-race')
    && (Number(r.num ?? r.dr?.ep) || 0) <= cap;

  // An explicit season wins — that is how a test or a preview pins one.
  const pinned = (typeof window !== 'undefined' && window._drSeasonRows) || null;
  if (Array.isArray(pinned) && pinned.length) return pinned.filter(mine);

  /* ── AND OTHERWISE THE SEASON THAT HAS ACTUALLY AIRED ──
     `window._drSeasonRows` was READ here and WRITTEN NOWHERE in the whole
     application, so this fell through to `[row]` every single time the chart
     was drawn in the simulator: one row, for tonight.
     That is invisible in the results themselves, because the last row's
     `dr.record` carries the entire season's calls — the grid was full and
     looked right. What it silently lost was everything held per EPISODE:
     the challenge that produced each column, who won that week's mini, who
     captained a team. All of those resolve by looking up the row for that
     episode, and there was only ever one row to find, so every column except
     tonight's came back blank.
     js/dr-run.js pushes each played row onto gs.episodeHistory, so that is
     the season, and it is the same list the rest of the viewing party reads. */
  const hist = (typeof window !== 'undefined' && window.gs?.episodeHistory) || null;
  if (Array.isArray(hist) && hist.length) {
    const played = hist.filter(mine);
    if (played.length) return played;
  }
  return [row];
}

const SUFFIX = 'chart';

export function rpBuildChart(row) {
  const ep = { num: upTo(row), format: 'drag-race', dr: row?.dr || {} };
  const source = sourceFor(row);
  const rows = gridRows(source);
  if (!rows.length) return '';

  /* ── COLUMNS ARE NOT EPISODES, AND THIS SCREEN COUNTS IN COLUMNS ──
     The reveal steps one COLUMN at a time, but the grid cuts by EPISODE, and
     the two stop agreeing the moment a night judges nobody. Reading a column
     count as an episode number cut the finale off the end of a finished
     season: nine columns, but the last of them is episode ten.
     So the reveal counts columns and hands the grid the episode that column
     belongs to. */
  const colEps = rows[0].cells
    .map(c => c.episode)
    .filter(e => e <= upTo(row));
  const total = colEps.length;
  if (!total) return '';
  const { idx } = _state({ num: ep.num }, SUFFIX);
  // Before the first click the chart shows the season up to LAST week, so the
  // screen is never blank and tonight is the thing being revealed.
  const shown = idx < 0 ? Math.max(1, total - 1) : Math.min(idx + 1, total);

  const grid = buildTrackRecordGrid(source, {
    upToEpisode: colEps[shown - 1],
    interactive: true,
    title: `Through episode ${colEps[shown - 1]}`,
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
      /* NO EPISODE HERE. The shell's subtitle is drawn once and the chart
         repaints under it, so an episode number in it goes stale the first
         time the reader fills a column — it read "through episode 8" over a
         chart showing episode 10. The <h3> inside the mount carries it and
         is repainted with the grid. */
      subtitle: `${rows.length} queens`,
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
  const rows = gridRows(source);
  const colEps = rows.length
    ? rows[0].cells.map(c => c.episode).filter(e => e <= epNum) : [];
  const total = colEps.length;
  const upToEpisode = colEps[Math.min(shown, total) - 1];
  mount.innerHTML = buildTrackRecordGrid(source, {
    upToEpisode, interactive: true, title: `Through episode ${upToEpisode ?? shown}`,
  });
  const counter = document.getElementById(`dr-counter-${SUFFIX}`);
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
