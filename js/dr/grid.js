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
// The season page draws it, the character article draws its own row out of
// it, and the viewing party draws it at the end of a season. Three copies of
// a grid is three places for the columns to stop lining up, and this repo has
// already shipped that: `_weekRowsFromDoc` and season_ref.html each grew
// their own idea of what a round looks like, and they disagreed about who had
// left. So the chart is built here and imported.
//
// ── WHY EVERY QUEEN HAS A CELL IN EVERY COLUMN ────────────────────────
//
// A row that stops when she goes home cannot be drawn: the columns after it
// have nothing to sit above, and the chart loses the alignment that is its
// entire reason for existing. js/dr/export.js therefore marks her `OUT` in
// every later episode, and this reads that mark rather than inferring one.
import { seasonRounds, showWords, DRAG_FORMAT } from '../shows.js';

/**
 * What each cell says, and the colour it says it in.
 *
 * The words are the show's own and are NOT abbreviations of anything else:
 * "BTM" is the bottom two, which is a place a queen can survive from, and
 * calling it "Nominated" would be the house's word for a thing the house
 * does. `ELIM` is the exit and takes the registry's verb in its tooltip.
 */
export const RESULT_LABELS = {
  WINNER: { label: 'WINNER', title: 'Winner of the season', colour: '#facc15', ink: '#1a1a1a' },
  FINALIST: { label: 'FINAL', title: 'Made the finale', colour: '#c4b5fd', ink: '#1a1a1a' },
  WIN: { label: 'WIN', title: 'Won the maxi challenge', colour: '#38bdf8', ink: '#0b2b3d' },
  HIGH: { label: 'HIGH', title: 'Among the top queens', colour: '#7dd3fc', ink: '#0b2b3d' },
  SAFE: { label: 'SAFE', title: 'Safe', colour: '#374151', ink: '#e5e7eb' },
  LOW: { label: 'LOW', title: 'Among the bottom queens', colour: '#fb923c', ink: '#2b1400' },
  // Two bottoms, because the show has two. BTM2 lip synced and survived it;
  // BTM was named in the bottom and saved before the lip sync started.
  BTM2: { label: 'BTM2', title: 'The bottom two — lip synced, and survived', colour: '#f87171', ink: '#2b0000' },
  BTM: { label: 'BTM', title: 'Named in the bottom, and saved', colour: '#fca5a5', ink: '#2b0000' },
  ELIM: { label: 'ELIM', title: null, colour: '#7f1d1d', ink: '#fecaca' },
  OUT: { label: '', title: 'Already gone', colour: 'transparent', ink: 'transparent' },
};

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * The chart, as HTML.
 *
 * `doc` is a published season document. The episodes are found through the
 * registry's `roundsPath`, so the live state and the published file are read
 * by one rule, and the cast order is the placement order — the chart's whole
 * shape is "the further down you are, the earlier you left".
 */
export function buildTrackRecordGrid(doc, { format = DRAG_FORMAT } = {}) {
  const eps = seasonRounds(doc, format);
  if (!eps.length) return '';
  const w = showWords(format);
  const cast = (doc.placements || []).slice().sort((a, b) => a.placement - b.placement);
  if (!cast.length) return '';

  // A cell is looked up by name rather than by index: the exporter guarantees
  // one entry per queen per episode, and reading by position would turn a
  // future ordering change into a chart that is silently wrong rather than
  // obviously empty.
  const cellFor = (ep, name) => (ep.placements || []).find(p => p.name === name) || null;

  const head = eps.map(e => `<th scope="col" title="${esc(w.round)} ${esc(e.episode)}">${esc(e.episode)}</th>`).join('');

  const body = cast.map(p => {
    const cells = eps.map(e => {
      const cell = cellFor(e, p.name);
      const key = cell?.result || 'OUT';
      const meta = RESULT_LABELS[key] || RESULT_LABELS.SAFE;
      // The exit's tooltip is the verb the ROUND recorded, not a default:
      // one word per season is how a departure comes to be described by
      // whichever door the code happened to look at first.
      const exit = (e.exits || []).find(x => x.name === p.name);
      const title = key === 'ELIM'
        ? `${p.name} ${exit?.verb || w.exit}`
        : (meta.title ? `${p.name}: ${meta.title}` : '');
      return `<td class="dr-tr-cell" data-result="${esc(key)}"`
        + ` style="background:${meta.colour};color:${meta.ink}"`
        + (title ? ` title="${esc(title)}"` : '')
        + `>${esc(meta.label)}</td>`;
    }).join('');
    return `<tr><th scope="row" class="dr-tr-name">${esc(p.name)}</th>${cells}</tr>`;
  }).join('');

  // The legend names only the results this season actually produced. A key
  // listing a result nothing on the chart uses is a reader hunting for a
  // colour that is not there.
  const used = new Set();
  for (const e of eps) for (const p of e.placements || []) used.add(p.result);
  const legend = Object.entries(RESULT_LABELS)
    .filter(([k]) => used.has(k) && k !== 'OUT')
    .map(([k, m]) => `<span class="dr-tr-key"><i style="background:${m.colour}"></i>`
      + `${esc(m.label)} — ${esc(k === 'ELIM' ? cap(w.exit) : m.title)}</span>`)
    .join('');

  return `<div class="dr-track-record">
    <div class="sr-scroll"><table class="track-record">
      <thead><tr><th scope="col">${esc(cap(w.player))}</th>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table></div>
    <div class="dr-tr-legend">${legend}</div>
  </div>`;
}

const cap = t => String(t || '').replace(/^./, c => c.toUpperCase());

/** The CSS the chart needs, so a page that draws it does not invent its own. */
export const TRACK_RECORD_CSS = `
.dr-track-record{margin:12px 0}
.dr-track-record .sr-scroll{overflow-x:auto}
table.track-record{border-collapse:collapse;font-size:12px;width:max-content;min-width:100%}
table.track-record th,table.track-record td{border:1px solid rgba(255,255,255,.12);padding:4px 6px;text-align:center;white-space:nowrap}
table.track-record th[scope=row]{text-align:left;position:sticky;left:0;background:#111827;z-index:1;font-weight:600}
td.dr-tr-cell{font-weight:700;letter-spacing:.03em;font-size:11px;min-width:44px}
.dr-tr-legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;font-size:11px;opacity:.85}
.dr-tr-key{display:inline-flex;align-items:center;gap:5px}
.dr-tr-key i{width:11px;height:11px;border-radius:3px;display:inline-block}
@media(prefers-reduced-motion:reduce){table.track-record *{transition:none!important}}
`;
