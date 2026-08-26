// ══════════════════════════════════════════════════════════════════════
// tr/threads.js — the reason a season is a story and not a list
// ══════════════════════════════════════════════════════════════════════
//
// Repetition does not come from reusing an event. It comes from every firing
// being UNCONNECTED, so nothing accumulates and each episode restarts from
// zero. A thread is the accumulator: it is opened by one event, fed by others,
// and eventually paid off or abandoned.
//
// `heat` is what makes a live story beat a stale one when the runner picks. It
// decays on purpose — a suspicion nobody has mentioned in four rounds should
// stop steering the castle, or the season's second half is decided by its first.
import { gs } from '../core.js';

/** Deterministic id: same parties, same kind, same episode → same thread. */
function _id(kind, parties, ep) {
  return `${kind}:${[...parties].sort().join('|')}:${ep}`;
}

export function openThread(kind, parties, ep, seed = '') {
  if (!gs.tr) return null;
  const id = _id(kind, parties, ep);
  const existing = gs.tr.threads.find(t => t.id === id);
  if (existing) return existing;
  const t = { id, kind, parties: [...parties], openedEp: ep, lastEp: ep,
    state: 'open', beats: [{ ep, eventId: seed, note: seed }], heat: 1, outcome: null };
  gs.tr.threads.push(t);
  _writeResidue(t, ep, seed);
  return t;
}

export function advanceThread(id, ep, note = '', eventId = '') {
  const t = gs.tr?.threads?.find(x => x.id === id);
  if (!t || t.state !== 'open') return null;
  t.beats.push({ ep, eventId, note });
  t.lastEp = ep;
  t.heat = Math.min(4, t.heat + 1);
  _writeResidue(t, ep, note);
  return t;
}

export function closeThread(id, ep, outcome) {
  const t = gs.tr?.threads?.find(x => x.id === id);
  if (!t) return null;
  t.state = 'closed';
  t.outcome = outcome;
  t.lastEp = ep;
  return t;
}

/** Heat as it stands at `ep` — one point of decay per round of silence. */
export function heatAt(t, ep) {
  return Math.max(0, t.heat - Math.max(0, ep - t.lastEp) * 0.5);
}

export function openThreadsFor(name, ep) {
  return (gs.tr?.threads || [])
    .filter(t => t.state === 'open' && t.parties.includes(name) && heatAt(t, ep) > 0);
}

/** The story most worth continuing for this person right now. */
export function hottest(name, ep) {
  const open = openThreadsFor(name, ep)
    .map(t => ({ ...t, heat: heatAt(t, ep) }))
    .sort((a, b) => b.heat - a.heat);
  return open[0] || null;
}

/** What has been written down about this person, oldest first. */
export function residueFor(name) {
  return (gs.tr?.residue?.[name] || []);
}

function _writeResidue(t, ep, note) {
  if (!note) return;
  for (const p of t.parties) {
    (gs.tr.residue[p] ||= []).push({ ep, note, threadId: t.id });
  }
}
