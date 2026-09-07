// ══════════════════════════════════════════════════════════════════════
// dr/grid.js — the track record chart
// ══════════════════════════════════════════════════════════════════════
//
// The single most recognisable artefact this show's fandom produces: a row
// per queen, a column per episode, and a coloured cell saying what she was
// called that week. It is not a voting grid with different words — there is
// no vote in it at all. What it records is the CALL.
//
// ── ONE BUILDER, THREE READERS ────────────────────────────────────────
//
// The viewing party's chart screen, the season page's Competition History,
// and the per-season row on a queen's own article. Three copies of a grid is
// three places for the columns to stop lining up, and this repo has already
// shipped that: `_weekRowsFromDoc` and season_ref.html each grew their own
// idea of what a round looks like and disagreed about who had left.
//
// ── AND IT READS BOTH SHAPES OF A SEASON ──────────────────────────────
//
// The season page has a PUBLISHED DOCUMENT (`doc.dr.episodes`: one entry per
// episode, a result per queen). The viewing party has LIVE ROWS
// (`row.dr.record`: one array of results per queen). They are the same chart,
// and `gridRows` folds both to it — because a builder that knew only one
// would work perfectly on one screen and draw nothing on the other, which is
// this project's most-repeated failure and takes a played season to notice.
//
// ── WHY EVERY QUEEN HAS A CELL IN EVERY COLUMN ────────────────────────
//
// A row that stops when she goes home cannot be drawn: the columns after it
// have nothing to sit above, and the chart loses the alignment that is its
// entire reason for existing. A queen already gone is `OUT`: blank, present.
import { seasonRounds, showWords, DRAG_FORMAT } from '../shows.js';

/**
 * The results, with the community's own colours and codes.
 *
 * BTM2 IS NOT BTM. Checked against the season 16 wikitext, where
 * `{{BTM|tomato|2}}` appears ten times and a plain `{{BTM}}` once:
 *
 *   BTM2   the bottom TWO — she lip synced, and survived it
 *   BTM    named in the bottom, and saved before the lip sync
 *   LOW    safe, but the panel had a note
 *   ELIM   she lip synced and lost
 *
 * The engine used to emit one `BTM` meaning the first under the second's
 * name, which left BTM unreachable in every season ever played. See
 * `callWeek` in js/dr/judging.js for the split.
 */
export const GRID_RESULTS = {
  WINNER: { label: 'WINNER', short: 'WIN★', title: 'Winner of the season', color: '#facc15', ink: '#1a1a1a' },
  FINALIST: { label: 'FINAL', short: 'FIN', title: 'Made the finale', color: '#c4b5fd', ink: '#1a1a1a' },
  WIN: { label: 'WIN', short: 'WIN', title: 'Won the maxi challenge', color: '#38bdf8', ink: '#08283b' },
  HIGH: { label: 'HIGH', short: 'HIGH', title: 'Among the top queens', color: '#7dd3fc', ink: '#08283b' },
  SAFE: { label: 'SAFE', short: 'SAFE', title: 'Safe', color: '#4b5563', ink: '#f3f4f6' },
  LOW: { label: 'LOW', short: 'LOW', title: 'Safe, but the panel had a note', color: '#fb923c', ink: '#2b1400' },
  BTM: { label: 'BTM', short: 'BTM', title: 'Named in the bottom, and saved', color: '#fca5a5', ink: '#2b0000' },
  BTM2: { label: 'BTM2', short: 'BTM2', title: 'The bottom two — lip synced, and survived', color: '#f87171', ink: '#2b0000' },
  ELIM: { label: 'ELIM', short: 'ELIM', title: null, color: '#7f1d1d', ink: '#fecaca' },
  OUT: { label: '', short: '', title: 'Already gone', color: 'transparent', ink: 'transparent' },
};

/* The name the first readers were written against. Kept rather than renamed
   across four files for the sake of one word. `colour` is aliased onto each
   entry for the same reason. */
export const RESULT_LABELS = GRID_RESULTS;
for (const v of Object.values(GRID_RESULTS)) v.colour = v.color;

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slugOf = n => String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cap = t => String(t || '').replace(/^./, c => c.toUpperCase());

/** A published document's episodes, normalised. */
function fromDocument(doc, format) {
  const eps = seasonRounds(doc, format);
  if (!eps.length) return null;
  const cast = (doc.placements || []).slice().sort((a, b) => a.placement - b.placement);
  if (!cast.length) return null;
  return cast.map(p => ({
    name: p.name,
    slug: p.playerSlug || slugOf(p.name),
    placement: p.placement,
    cells: eps.map(e => {
      const cell = (e.placements || []).find(x => x.name === p.name) || {};
      const exit = (e.exits || []).find(x => x.name === p.name) || null;
      return {
        episode: Number(e.episode) || 0,
        result: cell.result || 'OUT',
        challenge: e.challenge?.name || '',
        panelRank: cell.panelRank ?? null,
        finalRank: cell.finalRank ?? null,
        storyline: cell.storyline || null,
        lipsync: e.lipsync?.song || null,
        exitVerb: exit?.verb || null,
      };
    }),
  }));
}

/**
 * Live played rows, normalised.
 *
 * `dr.record` is per-queen and grows as the season runs, so row order is not
 * a placement order mid-season: the queen with the longest record lasted
 * longest, and that is the honest ordering until a finale exists. When one
 * does its placements win outright.
 */
function fromRows(rows, format) {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  if (!list.length) return null;
  const last = list[list.length - 1];
  const record = last?.dr?.record || {};
  const names = Object.keys(record);
  if (!names.length) return null;

  const finalOrder = last?.dr?.finale?.placements || [];
  const lengthOf = n => (record[n] || []).filter(r => r && r !== 'OUT').length;
  const ordered = [...names].sort((a, b) => {
    const ia = finalOrder.indexOf(a); const ib = finalOrder.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return lengthOf(b) - lengthOf(a);
  });

  const width = Math.max(...names.map(n => (record[n] || []).length));
  const byEp = new Map(list.map(r => [Number(r.num ?? r.dr?.ep) || 0, r]));
  return ordered.map((n, i) => ({
    name: n,
    slug: slugOf(n),
    placement: i + 1,
    cells: Array.from({ length: width }, (_, k) => {
      const epNum = k + 1;
      const r = byEp.get(epNum);
      const bend = (r?.dr?.bend || []).find(b => b.name === n) || {};
      const arc = (r?.dr?.storylines || []).find(s => (s.players || []).includes(n));
      const exit = (r?.exits || []).find(x => x.name === n) || null;
      return {
        episode: epNum,
        result: (record[n] || [])[k] || 'OUT',
        challenge: r?.dr?.challenge?.name || '',
        panelRank: bend.panelRank ?? null,
        finalRank: bend.finalRank ?? null,
        storyline: arc?.variantName || arc?.arc || null,
        lipsync: r?.dr?.lipsync?.song || null,
        exitVerb: exit?.verb || null,
      };
    }),
  }));
}

/**
 * The chart's rows, from a published document OR live played rows.
 *
 * Ordered best-first, one full-width row each. Returns [] rather than
 * throwing on something it cannot read: a season with no record yet is a
 * normal state, and a chart is never worth taking a screen down for.
 */
export function gridRows(source, { format = DRAG_FORMAT } = {}) {
  if (!source) return [];
  return (Array.isArray(source) ? fromRows(source, format) : fromDocument(source, format)) || [];
}

/**
 * The chart, as HTML.
 *
 * `upToEpisode` is how the viewing party keeps it from spoiling: mid-season
 * the columns after tonight are not in the DOM at all, so nothing renders a
 * result the viewer has not been shown. Not hidden — absent.
 */
export function buildTrackRecordGrid(source, {
  format = DRAG_FORMAT, upToEpisode = Infinity, interactive = true, title = '',
} = {}) {
  const rows = gridRows(source, { format });
  if (!rows.length) return '';
  const w = showWords(format);
  const width = Math.max(0, Math.min(rows[0].cells.length,
    Number.isFinite(upToEpisode) ? upToEpisode : Infinity));
  if (!width) return '';

  const head = rows[0].cells.slice(0, width)
    .map(c => `<th scope="col" title="${esc(w.round)} ${c.episode}">${c.episode}</th>`).join('');

  const body = rows.map(p => {
    const cells = p.cells.slice(0, width).map(c => {
      const meta = GRID_RESULTS[c.result] || GRID_RESULTS.SAFE;
      /* The exit's word is the ROUND's, never a default. One `exitWord` per
         season is how a departure comes to be described by whichever door the
         code happened to look at first. */
      const label = c.result === 'ELIM'
        ? `${p.name} ${c.exitVerb || w.exit}`
        : (meta.title ? `${p.name}: ${meta.title}` : '');
      const tip = interactive ? [
        c.challenge ? `${cap(w.round)} ${c.episode} · ${c.challenge}` : `${cap(w.round)} ${c.episode}`,
        c.panelRank != null && c.finalRank != null
          ? `panel ${c.panelRank} → final ${c.finalRank}${
            c.panelRank !== c.finalRank ? ' · THE HOST BENT IT' : ''}`
          : '',
        c.result === 'BTM2' && c.lipsync ? `lip synced to "${c.lipsync}"` : '',
        c.storyline || '',
      ].filter(Boolean).join('\n') : '';
      return `<td class="dr-tr-cell" data-result="${esc(c.result)}" data-episode="${c.episode}"`
        + ` style="background:${meta.color};color:${meta.ink}"`
        + (label ? ` title="${esc(label)}"` : '')
        + (tip ? ` data-tip="${esc(tip)}"` : '')
        + `>${esc(meta.label)}</td>`;
    }).join('');
    return `<tr><th scope="row" class="dr-tr-name">${esc(p.name)}</th>${cells}</tr>`;
  }).join('');

  // The legend names only what this season produced. A key listing a result
  // nothing on the chart uses is a reader hunting for a colour that is not there.
  const used = new Set();
  for (const p of rows) for (const c of p.cells.slice(0, width)) used.add(c.result);
  const legend = Object.entries(GRID_RESULTS)
    .filter(([k]) => used.has(k) && k !== 'OUT')
    .map(([k, m]) => `<span class="dr-tr-key"><i style="background:${m.color}"></i>`
      + `${esc(m.label)} — ${esc(k === 'ELIM' ? cap(w.exit) : m.title)}</span>`)
    .join('');

  return `<div class="dr-track-record">
    ${title ? `<h3 class="dr-tr-title">${esc(title)}</h3>` : ''}
    <div class="sr-scroll"><table class="track-record">
      <thead><tr><th scope="col">${esc(cap(w.player))}</th>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table></div>
    <div class="dr-tr-legend">${legend}</div>
  </div>`;
}

/** The CSS the chart needs, so a page that draws it does not invent its own. */
export const TRACK_RECORD_CSS = `
.dr-track-record{margin:12px 0}
.dr-track-record .sr-scroll{overflow-x:auto}
.dr-tr-title{margin:0 0 8px;font-size:16px}
table.track-record{border-collapse:collapse;font-size:12px;width:max-content;min-width:100%}
table.track-record th,table.track-record td{border:1px solid rgba(255,255,255,.14);padding:4px 6px;text-align:center;white-space:nowrap}
table.track-record th[scope=row]{text-align:left;position:sticky;left:0;background:#111827;z-index:1;font-weight:600}
td.dr-tr-cell{font-weight:700;letter-spacing:.03em;font-size:11px;min-width:46px;position:relative}
td.dr-tr-cell[data-tip]{cursor:help}
td.dr-tr-cell[data-tip]:hover::after{content:attr(data-tip);position:absolute;left:50%;bottom:120%;
  transform:translateX(-50%);background:#161011;color:#F4EFE4;padding:9px 11px;white-space:pre;
  font:400 11px/1.5 'Helvetica Neue',Arial,sans-serif;letter-spacing:0;z-index:30;text-align:left;
  box-shadow:0 8px 24px rgba(0,0,0,.5)}
.dr-tr-legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;font-size:11px;opacity:.85}
.dr-tr-key{display:inline-flex;align-items:center;gap:5px}
.dr-tr-key i{width:11px;height:11px;display:inline-block}
.dr-phase-chart table.track-record th,.dr-phase-chart table.track-record td{border-color:#cfc6b6}
.dr-phase-chart table.track-record th[scope=row]{background:#F4EFE4;color:#1a1a1a}
.dr-phase-chart .dr-tr-legend{opacity:1;color:#443c33}
@media(prefers-reduced-motion:reduce){table.track-record *{transition:none!important}}
`;
