// ══════════════════════════════════════════════════════════════════════
// rr-view.js — a Ridonculous Race leg in the simulator: the transcript and the viewer
// ══════════════════════════════════════════════════════════════════════
//
// A run-tab row carries what aired (js/rr-run.js raceRows: `rr.aired`, the director's segments with their lines),
// so the transcript is derived from the row and never disagrees with what the screens show. The Visual Player embeds
// the stepped viewer (rr.html?sim=1, js/vp-rr-ep): it replays the race the run tab built, the same teams, seed and
// history, from this page's `gs.rr`, and opens on the leg asked for.
import { RACE_FORMAT, SHOWS } from './shows.js';

const hhmm = m => { const d = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(d / 60)).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function lineText(l) {
  if (l.kind === 'beat') return `(${l.text})`;
  return `${l.clip ? '> ' : ''}${l.by}${l.kind === 'conf' ? ' [interview]' : ''}: ${l.text}`;
}

/** The leg as the viewer hears it, top to bottom: the recap, every scene's lines, the Chill Zone's order. */
export function raceEpisodeText(row) {
  const r = row?.rr;
  if (!r) return '';
  const out = [`LEG ${row.num} · ${r.placeName || '?'}${r.kind === 'final' ? ' · THE FINALE' : r.kind === 'non' ? ' · non-elimination' : ''}`];
  for (const l of r.aired?.previously?.lines || []) out.push(lineText(l));
  for (const seg of r.aired?.segments || []) {
    out.push('');
    out.push(`[${hhmm((seg.t || 0) + 420)}]`);
    for (const l of seg.lines || []) out.push(lineText(l));
  }
  out.push('');
  out.push('THE CHILL ZONE: ' + (r.order || []).map(o => `${o.place}. ${o.name}`).join(' · '));
  if (row.exits?.length) out.push('OUT: ' + [...new Set(row.exits.map(x => x.team))].map(t => {
    const x = row.exits.find(e => e.team === t);
    return `${t} (${x.verb})`;
  }).join(', '));
  if (r.final?.winners?.length) out.push(`WINNERS: ${r.final.winners.join(' and ')}`);
  return out.join('\n');
}

/** The Visual Player's screens for a leg: the stepped viewer, and the transcript one tab away. */
export function raceVpScreens(row) {
  const r = row?.rr || {};
  const accent = SHOWS[RACE_FORMAT]?.accent || '#f2b705';
  const src = `rr.html?sim=1&ep=${encodeURIComponent(row?.num || 1)}`;
  const watch = `<div class="rr-vp-watch" style="display:flex;flex-direction:column;gap:8px;height:100%">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
      <div style="font-weight:800;color:${accent};letter-spacing:.5px">LEG ${esc(row?.num)} · ${esc((r.placeName || '').toUpperCase())}</div>
      <a href="${esc(src)}" target="_blank" rel="opener" style="color:${accent};font-size:12px">Open in its own window ↗</a>
    </div>
    <iframe src="${esc(src)}" title="The Ridonculous Race, leg ${esc(row?.num)}" style="width:100%;height:calc(100vh - 150px);min-height:420px;border:0;border-radius:12px;background:#0b1020" allow="fullscreen"></iframe>
  </div>`;
  const read = `<pre style="white-space:pre-wrap;font:13px/1.5 ui-monospace,Consolas,monospace;margin:0">${esc(raceEpisodeText(row))}</pre>`;
  return [
    { id: 'rr-watch', label: 'Watch', html: watch },
    { id: 'rr-transcript', label: 'Transcript', html: read },
  ];
}
