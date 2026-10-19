// ══════════════════════════════════════════════════════════════════════
// rr-view.js — a Ridonculous Race leg in the simulator: the transcript and the viewer
// ══════════════════════════════════════════════════════════════════════
//
// A run-tab row carries what aired (js/rr-run.js raceRows: `rr.aired`, the director's segments with their lines),
// so the transcript is derived from the row and never disagrees with what the screens show. The Visual Player shows
// the stepped viewer's chapters (js/vp-rr-ep/vp.js) of the race the run tab built, played again here (rr-run.js
// racePlayed); the transcript is the other mode, one button away.
import { RACE_FORMAT, SHOWS } from './shows.js';
import { racePlayed } from './rr-run.js';
import { raceStepVpScreens, raceViewerMode } from './vp-rr-ep/vp.js';

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

/** The Visual Player's screens for a leg: the stepped viewer, a screen per chapter of the leg (js/vp-rr-ep/vp.js),
 *  or the transcript when the viewer chose it (its button on every stepped screen; one button back). */
export function raceVpScreens(row) {
  const aired = (typeof window !== 'undefined' ? window.gs?.episodeHistory : null)?.filter(r => r && r.format === RACE_FORMAT) || [];
  if (raceViewerMode() === 'stepped') {
    try {
      const screens = raceStepVpScreens(row, { played: racePlayed(), aired });
      if (screens?.length) return screens;
    } catch (e) { console.warn('Ridonculous Race stepped viewer fell back to the transcript:', e); }
  }
  const accent = SHOWS[RACE_FORMAT]?.accent || '#f2b705';
  const back = `<div style="display:flex;justify-content:flex-end;margin:0 0 8px"><button type="button" onclick="rrxSwitchViewer('stepped')" style="border:1px solid ${accent};background:#14110a;color:${accent};padding:7px 12px;font:700 12px system-ui,sans-serif;letter-spacing:1px;text-transform:uppercase;cursor:pointer">&#9654; Stepped viewer</button></div>`;
  const read = `${back}<pre style="white-space:pre-wrap;font:13px/1.5 ui-monospace,Consolas,monospace;margin:0">${esc(raceEpisodeText(row))}</pre>`;
  return [{ id: 'rr-transcript', label: 'Transcript', html: read, phase: { id: 'rr-leg', label: `Leg ${row?.num} · ${row?.rr?.placeName || ''}`, icon: '🏁' } }];
}
