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
import { avatarUrl } from '../avatar-registry.js';

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
  /* SAFE IS THE EMPTY CELL, and it was the heaviest thing on the chart. Half
     a season is SAFE, so a dark slate fill put a wall of grey behind every
     result worth seeing. Real progress tables leave it white for exactly
     this reason: the colours are supposed to be the exceptions. */
  SAFE: { label: 'SAFE', short: 'SAFE', title: 'Safe', color: '#f8f6f1', ink: '#3d3730' },
  LOW: { label: 'LOW', short: 'LOW', title: 'Safe, but the panel had a note', color: '#fb923c', ink: '#2b1400' },
  BTM: { label: 'BTM', short: 'BTM', title: 'Named in the bottom, and saved', color: '#fca5a5', ink: '#2b0000' },
  BTM2: { label: 'BTM2', short: 'BTM2', title: 'The bottom two — lip synced, and survived', color: '#f87171', ink: '#2b0000' },
  ELIM: { label: 'ELIM', short: 'ELIM', title: null, color: '#7f1d1d', ink: '#fecaca' },
  OUT: { label: '', short: '', title: 'Already gone', color: 'transparent', ink: 'transparent' },
};

/**
 * How good a call is, for sorting an episode's column.
 *
 * Best first. Distinct from PPE_POINTS because these are ranks, not scores:
 * BTM and BTM2 both score 1 as points, but being saved before the song and
 * having to lip sync for it are not the same week, and a sort should put
 * them in the right order.
 */
const ORDER_OF = {
  WINNER: 0, WIN: 1, FINALIST: 2, HIGH: 3, SAFE: 4, LOW: 5, BTM: 6, BTM2: 7, ELIM: 8, OUT: 9,
};

/**
 * PPE — points per episode, the number the fandom ranks queens by.
 *
 * NOT INVENTED HERE. The scale was derived from a real progress table and
 * checked against it: every one of its eight rows reproduces the published
 * PPE to the cent under WIN 5 / HIGH 4 / SAFE 3 / LOW 2 / BTM 1 / ELIM 0.
 * (WIN+SAFE+WIN = 13/3 = 4.33; BTM2+HIGH+WIN = 10/3 = 3.33; HIGH+LOW+LOW =
 * 8/3 = 2.67, and so on for the other five.) A made-up scale would have
 * produced a column of numbers that looked right and matched nothing.
 *
 * WINNER and FINALIST are finale results the source table has no column for,
 * and they take the value of the call they most resemble.
 *
 * The divisor is episodes SHE COMPETED IN, not episodes the season ran, so a
 * queen who went home in week two is not punished for the weeks she was not
 * there. That is what makes the number comparable across a cast.
 */
export const PPE_POINTS = {
  WINNER: 5, WIN: 5, FINALIST: 4, HIGH: 4, SAFE: 3, LOW: 2, BTM: 1, BTM2: 1, ELIM: 0,
};

/** Her points per episode, to two decimals, or null if she has not competed. */
export function ppeFor(cells) {
  const played = (cells || []).filter(c => c && c.result && c.result !== 'OUT');
  if (!played.length) return null;
  const total = played.reduce((sum, c) => sum + (PPE_POINTS[c.result] ?? 0), 0);
  return Math.round((total / played.length) * 100) / 100;
}

/* The name the first readers were written against. Kept rather than renamed
   across four files for the sake of one word. `colour` is aliased onto each
   entry for the same reason. */
export const RESULT_LABELS = GRID_RESULTS;
for (const v of Object.values(GRID_RESULTS)) v.colour = v.color;

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slugOf = n => String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cap = t => String(t || '').replace(/^./, c => c.toUpperCase());
/** A row's episode number, from either shape a row comes in. */
const epOf = r => Number(r?.num ?? r?.dr?.ep) || 0;

/**
 * What to head that episode's column with.
 *
 * A night that is not a maxi challenge still has a name, and reading only
 * `dr.challenge.name` left those columns blank — the header said "Ep. 9" over
 * a column and nothing else, which is the state the chart was built to end.
 */
const challengeName = r => r?.dr?.challenge?.name
  || (r?.dr?.finale ? 'The Finale' : '')
  || (r?.dr?.smackdown ? 'The Lip Sync Smackdown' : '')
  || (r?.dr?.reunion ? 'The Reunion' : '')
  || '';

/** Her initials, for the photo cell when she has no portrait on file. */
const initials = n => String(n || '').trim().split(/\s+/).slice(0, 2)
  .map(x => x[0] || '').join('').toUpperCase();

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
    // A published season is finished by definition, so its ranks are real.
    ranked: true,
    cells: eps.map(e => {
      const cell = (e.placements || []).find(x => x.name === p.name) || {};
      const exit = (e.exits || []).find(x => x.name === p.name) || null;
      return {
        episode: Number(e.episode) || 0,
        result: cell.result || 'OUT',
        challenge: e.challenge?.name || (e.finale ? 'The Finale' : ''),
        mini: (e.mini?.winner || null) === p.name,
        role: e.assignment?.roles?.[p.name] || null,
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

  const byEp = new Map(list.map(r => [epOf(r), r]));

  /* ── WHICH EPISODE EACH ENTRY CAME FROM ──
     THE RECORD'S INDEX IS NOT THE EPISODE NUMBER, and treating it as one is
     an off-by-one waiting for any episode that judges nobody. Two of them
     exist already:

       · A LIP SYNC SMACKDOWN or any night with no call pushes nothing, so
         every column after it slid one episode to the left. Measured on a
         played season: the FINALE's result was being drawn under the
         Smackdown's name, and the finale had no column at all.
       · A SPLIT PREMIERE is worse, because it shifts PER QUEEN. Each half of
         the room plays its own night, so the second half's first entry is
         episode two while the first half's is episode one. There is no
         single offset that fixes that — index 0 genuinely means different
         episodes for different queens.

     So the mapping is derived instead of assumed. Every row carries its own
     `dr.record` snapshot, so a queen's record growing between two rows says
     exactly which episode produced the new entry. This is the same failure
     the Big Brother ledger had, and it stays invisible until you read a
     chart against the episodes it claims to describe. */
  const epsFor = new Map(names.map(n => [n, []]));
  const seen = new Map(names.map(n => [n, 0]));
  for (const r of [...list].sort((x, y) => epOf(x) - epOf(y))) {
    const snap = r?.dr?.record || {};
    for (const n of names) {
      const had = seen.get(n) || 0;
      const now = (snap[n] || []).length;
      for (let i = had; i < now; i++) epsFor.get(n).push(epOf(r));
      if (now > had) seen.set(n, now);
    }
  }
  /* A queen whose entries could not be placed — a chart built from one row,
     or a season with no per-row snapshots — falls back to the old reading, so
     a partial source still draws something rather than nothing. */
  for (const n of names) {
    const got = epsFor.get(n);
    const want = (record[n] || []).length;
    if (got.length !== want) epsFor.set(n, Array.from({ length: want }, (_, k) => k + 1));
  }

  // The columns are the episodes that actually judged somebody, in order.
  const columnEps = [...new Set([...epsFor.values()].flat())].sort((x, y) => x - y);

  return ordered.map((n, i) => {
    const mine = new Map((epsFor.get(n) || []).map((e, k) => [e, (record[n] || [])[k]]));
    return {
      name: n,
      slug: slugOf(n),
      placement: i + 1,
      /* MID-SEASON THERE IS NO RANK. The order above is "longest record
         first", which is the honest reading order and is NOT a placement —
         the queen sitting at the top of the chart in week four has not won
         anything. The chart says TBA until a finale exists, exactly as the
         fandom's own tables do, rather than printing a number that will
         change under the reader. */
      ranked: finalOrder.length > 0,
      cells: columnEps.map(epNum => {
        const r = byEp.get(epNum);
        const bend = (r?.dr?.bend || []).find(b => b.name === n) || {};
        const arc = (r?.dr?.storylines || []).find(s => (s.players || []).includes(n));
        const exit = (r?.exits || []).find(x => x.name === n) || null;
        return {
          episode: epNum,
          result: mine.get(epNum) || 'OUT',
          challenge: challengeName(r),
          mini: (r?.dr?.mini?.winner || null) === n,
          role: r?.dr?.assignment?.roles?.[n] || null,
          panelRank: bend.panelRank ?? null,
          finalRank: bend.finalRank ?? null,
          storyline: arc?.variantName || arc?.arc || null,
          lipsync: r?.dr?.lipsync?.song || null,
          exitVerb: exit?.verb || null,
        };
      }),
    };
  });
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
  /* Rank, photo and PPE are the reference table's own columns and default on
     for all three readers, because all three are drawing the same artefact.
     A reader that genuinely wants the bare grid can switch them off. */
  columns = {},
} = {}) {
  const cols = { rank: true, photo: true, ppe: true, ...columns };
  const rows = gridRows(source, { format });
  if (!rows.length) return '';
  const w = showWords(format);
  /* CUT BY EPISODE, NOT BY COLUMN COUNT. The two are not the same number the
     moment a night judges nobody: taking the first N columns of a season with
     a Smackdown in it showed one episode too many, and on a split premiere it
     cut a different week for every queen. A column is in if the episode it
     belongs to has aired. */
  const lastEp = Number.isFinite(upToEpisode) ? upToEpisode : Infinity;
  const keep = rows[0].cells.map((c, i) => (c.episode || i + 1) <= lastEp);
  const width = keep.filter(Boolean).length;
  if (!width) return '';
  const shownOf = cells => cells.filter((_, i) => keep[i]);

  /* ── SORTING, THE WAY A SPREADSHEET DOES IT ──
     A track record is a table people interrogate: who has the best average,
     who went out first, who was in the bottom that week. Sorting is done in
     the DOM by `drGridSort` below — rows are reordered, never rebuilt, so it
     costs nothing and cannot disagree with what was drawn.
     Every column sorts, including each episode's: sorting by a week orders
     the cast by how that week went for them, best call first. */
  const sortTh = (key, label) => `<th scope="col" rowspan="2" class="dr-tr-h dr-tr-sort"`
    + ` data-sort="${esc(key)}" tabindex="0" role="button"`
    + ` title="Sort by ${esc(label)}"><span>${esc(label)}</span><i></i></th>`;

  /* ── TWO HEADER ROWS, BECAUSE THE COLUMN NEEDS A NAME ──
     A column headed "3" tells the reader nothing about why the calls in it
     went the way they did. The challenge was already on every cell and was
     only ever reachable by hovering one, which is not a thing a reader of a
     reference table does. Now the episode number sits above the challenge
     that produced it, so the chart can be read for what kind of week each
     one was. */
  const headEps = shownOf(rows[0].cells)
    .map(c => `<th scope="col" class="dr-tr-ep dr-tr-sort" data-sort="ep:${c.episode}"`
      + ` tabindex="0" role="button" title="Sort by ${esc(w.round)} ${c.episode}">`
      + `<span>Ep. ${c.episode}</span><i></i></th>`).join('');
  const headChals = shownOf(rows[0].cells)
    .map(c => `<th scope="col" class="dr-tr-chal">${esc(c.challenge || '')}</th>`).join('');

  const body = rows.map(p => {
    const shownCells = shownOf(p.cells);
    const cells = shownCells.map(c => {
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
      /* ── WHAT ELSE HAPPENED TO HER THAT WEEK ──
         The call is not the only thing a week does to a queen, and the two
         that change how a call reads were on the row already and drawn
         nowhere: winning the mini, and being handed a team to lead. "SAFE"
         and "SAFE, and she ran the team that lost" are different weeks.
         Sub-notes only, in italic under the call, so the chart still scans
         as a grid of results. */
      const notes = [
        c.mini ? 'Mini Chall. Winner' : '',
        c.role === 'lead' ? 'Team Captain' : '',
      ].filter(Boolean);
      const body = esc(meta.label)
        + (c.result !== 'OUT' && notes.length
          ? `<i class="dr-tr-note">${notes.map(esc).join('<br>')}</i>` : '');
      return `<td class="dr-tr-cell" data-result="${esc(c.result)}" data-episode="${c.episode}"`
        + ` style="background:${meta.color};color:${meta.ink}"`
        + (label ? ` title="${esc(label)}"` : '')
        + (tip ? ` data-tip="${esc(tip)}"` : '')
        + `>${body}</td>`;
    }).join('');

    /* ── RANK AND PHOTO ──
       The reference table this chart is modelled on leads with both, and
       they do real work: the rank is the answer the whole table is building
       toward, and the photo is how a reader finds their queen's row without
       reading twelve names. */
    const rankCell = cols.rank
      ? `<td class="dr-tr-rank">${p.ranked ? p.placement : 'TBA'}</td>` : '';
    const url = cols.photo ? avatarUrl({ playerSlug: p.slug, show: format }) : '';
    const photoCell = cols.photo
      ? `<td class="dr-tr-photo">${url
        ? `<img src="${esc(url)}" alt="${esc(p.name)}" loading="lazy" width="52" height="52">`
        : `<span class="dr-tr-noface">${esc(initials(p.name))}</span>`}</td>`
      : '';
    const ppe = cols.ppe ? ppeFor(shownCells) : null;
    const ppeCell = cols.ppe
      ? `<td class="dr-tr-ppe" title="Points per episode: ${esc(w.round)}s she competed in only"`
        + `>${ppe == null ? '—' : ppe.toFixed(2)}</td>` : '';

    /* The sort keys travel ON the row, so sorting never needs the data that
       built it — the table is self-contained wherever it is dropped. */
    const epKeys = shownCells
      .map(c => `${c.episode}:${ORDER_OF[c.result] ?? 99}`).join(',');
    return `<tr data-rank="${p.placement}" data-name="${esc(p.name)}"`
      + ` data-ppe="${ppe == null ? -1 : ppe}" data-eps="${esc(epKeys)}">`
      + `${rankCell}<th scope="row" class="dr-tr-name">${esc(p.name)}</th>`
      + `${photoCell}${cells}${ppeCell}</tr>`;
  }).join('');

  // The legend names only what this season produced. A key listing a result
  // nothing on the chart uses is a reader hunting for a colour that is not there.
  const used = new Set();
  for (const p of rows) for (const c of shownOf(p.cells)) used.add(c.result);
  const legend = Object.entries(GRID_RESULTS)
    .filter(([k]) => used.has(k) && k !== 'OUT')
    .map(([k, m]) => `<span class="dr-tr-key"><i style="background:${m.color}"></i>`
      + `${esc(m.label)} — ${esc(k === 'ELIM' ? cap(w.exit) : m.title)}</span>`)
    .join('');

  return `<div class="dr-track-record">
    ${title ? `<h3 class="dr-tr-title">${esc(title)}</h3>` : ''}
    <div class="sr-scroll"><table class="track-record">
      <thead>
        <tr>
          ${cols.rank ? sortTh('rank', 'Rank') : ''}
          ${sortTh('name', cap(w.player))}
          ${cols.photo ? '<th scope="col" rowspan="2" class="dr-tr-h">Photo</th>' : ''}
          ${headEps}
          ${cols.ppe ? sortTh('ppe', 'PPE') : ''}
        </tr>
        <tr>${headChals}</tr>
      </thead>
      <tbody>${body}</tbody>
    </table></div>
    <div class="dr-tr-legend">${legend}</div>
  </div>`;
}

/**
 * Sort a drawn chart, in the DOM.
 *
 * Bound once per document rather than per table, and it reorders the <tr>s
 * that are already there — nothing is rebuilt, so a sorted chart cannot
 * disagree with the chart it was sorted from, and the reveal state, the
 * tooltips and the images all survive.
 *
 * Clicking the same header twice reverses it, exactly as a spreadsheet does.
 * The default direction is the useful one per column: rank and episode
 * ascend (best first), PPE descends (best first), name ascends.
 */
export function drGridSort(th) {
  const table = th?.closest('table.track-record');
  const key = th?.getAttribute('data-sort');
  if (!table || !key) return;
  const body = table.querySelector('tbody');
  if (!body) return;

  const wasKey = table.getAttribute('data-sorted-by');
  const wasDir = table.getAttribute('data-sorted-dir') === 'desc' ? -1 : 1;
  const base = key === 'ppe' ? -1 : 1;
  const dir = wasKey === key ? -wasDir : base;

  const epNum = key.startsWith('ep:') ? key.slice(3) : null;
  const valueOf = tr => {
    if (key === 'name') return tr.getAttribute('data-name') || '';
    if (key === 'ppe') return Number(tr.getAttribute('data-ppe'));
    if (key === 'rank') return Number(tr.getAttribute('data-rank'));
    /* An episode's column. A queen with no cell that week — she had already
       gone, or the split premiere put her in the other half — sorts to the
       bottom whichever way the column is pointed, because "no result" is not
       a good result or a bad one. */
    const hit = (tr.getAttribute('data-eps') || '').split(',')
      .find(x => x.startsWith(`${epNum}:`));
    return hit ? Number(hit.split(':')[1]) : 99;
  };

  const rows = [...body.querySelectorAll('tr')];
  rows.sort((a, b) => {
    const x = valueOf(a); const y = valueOf(b);
    let cmp = typeof x === 'string' ? x.localeCompare(y) : x - y;
    // A stable tiebreak, so equal cells never shuffle between clicks.
    if (!cmp) cmp = Number(a.getAttribute('data-rank')) - Number(b.getAttribute('data-rank'));
    return cmp * dir;
  });
  for (const tr of rows) body.appendChild(tr);

  table.setAttribute('data-sorted-by', key);
  table.setAttribute('data-sorted-dir', dir === -1 ? 'desc' : 'asc');
  for (const el of table.querySelectorAll('th.dr-tr-sort')) {
    const on = el === th;
    el.classList.toggle('dr-on', on);
    el.classList.toggle('dr-desc', on && dir === -1);
    el.setAttribute('aria-sort', on ? (dir === -1 ? 'descending' : 'ascending') : 'none');
  }
}

if (typeof document !== 'undefined' && !document._drGridSortBound) {
  document._drGridSortBound = true;
  document.addEventListener('click', e => {
    const th = e.target?.closest?.('th.dr-tr-sort');
    if (th) drGridSort(th);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const th = e.target?.closest?.('th.dr-tr-sort');
    if (th) { e.preventDefault(); drGridSort(th); }
  });
}

/** The CSS the chart needs, so a page that draws it does not invent its own. */
export const TRACK_RECORD_CSS = `
.dr-track-record{margin:12px 0}
.dr-track-record .sr-scroll{overflow-x:auto}
.dr-tr-title{margin:0 0 8px;font-size:16px}
table.track-record{border-collapse:collapse;font-size:12px;width:max-content;min-width:100%}
table.track-record th,table.track-record td{border:1px solid rgba(255,255,255,.14);padding:4px 6px;text-align:center;white-space:nowrap}
table.track-record th[scope=row]{text-align:left;position:sticky;left:0;background:#111827;z-index:1;font-weight:600}
td.dr-tr-cell{font-weight:700;letter-spacing:.03em;font-size:11px;min-width:56px;position:relative;
  line-height:1.25;vertical-align:middle}
/* ── THE REFERENCE TABLE'S OWN COLUMNS ── */
.dr-tr-h{font-weight:700;font-size:11px;letter-spacing:.06em;text-transform:uppercase}
/* ── SORTABLE HEADERS ──
   The arrow is drawn always but faint, so a reader can see WHICH columns
   sort before clicking one, rather than discovering it by accident. */
th.dr-tr-sort{cursor:pointer;user-select:none;position:relative;white-space:nowrap}
th.dr-tr-sort:hover,th.dr-tr-sort:focus-visible{background:rgba(255,255,255,.10);outline:none}
.dr-phase-chart th.dr-tr-sort:hover,.dr-phase-chart th.dr-tr-sort:focus-visible{
  background:#E0D6C2}
th.dr-tr-sort>i{display:inline-block;width:0;height:0;margin-left:5px;vertical-align:middle;
  border-left:4px solid transparent;border-right:4px solid transparent;
  border-top:5px solid currentColor;opacity:.28;transition:opacity .15s,transform .15s}
th.dr-tr-sort.dr-on>i{opacity:1}
th.dr-tr-sort.dr-on.dr-desc>i{transform:rotate(180deg)}
th.dr-tr-sort:focus-visible{box-shadow:inset 0 0 0 2px #FF2D8B}
th.dr-tr-ep{font-weight:700;font-size:11px;letter-spacing:.05em}
/* The challenge name is a caption for the column, not a heading competing
   with the episode number above it. */
/* Specificity has to beat the nowrap on table.track-record th above, or the
   long names overflow their column instead of wrapping inside it. NO
   BACKTICKS IN HERE: this block is a template literal and a backtick in a
   comment ends it, which has broken this repo five times now. */
table.track-record th.dr-tr-chal{font-weight:600;font-size:10px;line-height:1.3;
  white-space:normal;padding:3px 6px;min-width:74px;max-width:112px;opacity:.9}
td.dr-tr-rank{font-weight:700;font-size:12px;min-width:44px;letter-spacing:.04em}
td.dr-tr-photo{padding:0;width:56px}
td.dr-tr-photo img{display:block;width:52px;height:52px;object-fit:cover;margin:1px auto}
.dr-tr-noface{display:flex;align-items:center;justify-content:center;width:52px;height:52px;
  margin:1px auto;font-weight:700;font-size:15px;letter-spacing:.04em;opacity:.7}
/* PPE is a number read down a column, so it lines up on the decimal. */
td.dr-tr-ppe{font-weight:700;font-size:12px;min-width:52px;
  font-variant-numeric:tabular-nums;font-family:'Space Mono',ui-monospace,monospace}
/* A sub-note is a footnote inside the cell — it must never out-shout the
   call it is qualifying. */
.dr-tr-note{display:block;margin-top:2px;font-style:italic;font-weight:600;
  font-size:9px;letter-spacing:0;opacity:.82;white-space:normal;text-transform:none}
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
.dr-phase-chart table.track-record thead th{background:#EDE6D8;color:#1a1a1a}
.dr-phase-chart td.dr-tr-rank,.dr-phase-chart td.dr-tr-ppe{background:#E4DCCB;color:#1a1a1a}
.dr-phase-chart td.dr-tr-photo{background:#F4EFE4}
.dr-phase-chart .dr-tr-noface{color:#6b6152}
.dr-phase-chart .dr-tr-legend{opacity:1;color:#443c33}
@media(prefers-reduced-motion:reduce){table.track-record *{transition:none!important}}
`;
