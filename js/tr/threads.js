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
//
// The id is `kind:sortedParties:openedEp` and stays fixed for the thread's
// whole life — it is NOT recomputed from the current episode. If it were,
// an episode-7 event about the same pair could never find the episode-2
// thread to advance (the ids would differ), and the season's back half would
// silently stop obeying "advance a live story before starting a new one" —
// continuity would survive only through residue, never through the thread
// itself. `findOpenThread` is the parties-keyed route that keeps a cooled
// thread reachable so it can be REVIVED ("she never let it go") instead of
// fragmented into an unreachable duplicate.
import { gs } from '../core.js';

/**
 * Deterministic id: same parties, same kind, same opening episode → same id.
 *
 * WHICH IS A COLLISION, NOT AN IDENTITY, IF THAT STORY HAPPENS TWICE IN ONE
 * ROUND (whole-plan review, finding 8). Close a suspicion thread on A and B at
 * episode 5 and open another one on A and B at episode 5 — two same-family
 * events landing on the same pair in the same round, where the first resolves
 * — and both entries key `suspicion:A|B:5`. `advanceThread`, `closeThread` and
 * `abandonThread` all resolve an id with `threads.find(x => x.id === id)`,
 * which hits the CLOSED one first and bails on `state !== 'open'`, so the new
 * thread is unadvanceable from the moment it is created: every later beat that
 * tried to continue it silently did nothing. Reachable in a real season, and
 * the test that reopens a thread deliberately did it at episode 9, stepping
 * round the one case that breaks.
 *
 * `taken` is the set of ids already in play. A second thread with the same
 * natural key gets `#2`, a third `#3`. Still deterministic — it depends only
 * on how many such threads already exist, which is itself deterministic — and
 * the ordinary case, one thread per (kind, parties, ep), is untouched, so no
 * existing id changes shape.
 */
function _id(kind, parties, ep, taken) {
  const base = `${kind}:${[...parties].sort().join('|')}:${ep}`;
  if (!taken || !taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}#${n}`)) n++;
  return `${base}#${n}`;
}

function _partyKey(parties) {
  return [...parties].sort().join('|');
}

/**
 * Most recent OPEN thread for this kind + party-set, regardless of how cold
 * it has gone. This is the lookup `openThread` must consult first — without
 * it, an ep-scoped id makes a cooled thread permanently unreachable, and
 * only `abandonThread`/direct array iteration could ever touch it again.
 */
export function findOpenThread(kind, parties) {
  const key = _partyKey(parties);
  const matches = (gs.tr?.threads || [])
    .filter(t => t.state === 'open' && t.kind === kind && _partyKey(t.parties) === key);
  if (!matches.length) return null;
  return matches.reduce((a, b) => (b.lastEp > a.lastEp ? b : a));
}

export function openThread(kind, parties, ep, seed = '') {
  if (!gs.tr) return null;

  const existing = findOpenThread(kind, parties);
  if (existing) {
    // Calling openThread twice with the exact same (kind, parties, ep, seed)
    // is a re-announcement of the same beat, not a new one — don't grow the
    // beat log or residue on every redundant call.
    const last = existing.beats[existing.beats.length - 1];
    const isRedundant = last && last.ep === ep && last.note === seed;
    if (!isRedundant) {
      existing.beats.push({ ep, eventId: seed, note: seed });
      existing.heat = Math.min(4, existing.heat + 1);
      existing.lastEp = ep;
      _writeResidue(existing, ep, seed);
    }
    return existing;
  }

  const id = _id(kind, parties, ep, new Set(gs.tr.threads.map(t => t.id)));
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

/**
 * Retire a thread nobody ever picked back up. Distinct from `closeThread`:
 * there is no narrative payoff, just the housekeeping that keeps
 * `findOpenThread`/`openThreadsFor` from ever surfacing a dead story again.
 * The array entry stays (it is 100 bytes against a multi-MB `gs` — noise);
 * only reachability changes.
 */
export function abandonThread(id, ep) {
  const t = gs.tr?.threads?.find(x => x.id === id);
  if (!t || t.state !== 'open') return null;
  t.state = 'abandoned';
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

/**
 * Every OPEN thread, hot or cold. `ep` is accepted for call-site symmetry with
 * `heatAt(t, ep)` and is deliberately NOT used as a filter: a thread whose heat
 * has decayed to zero is exactly the "she never let it go" revival case that
 * `findOpenThread`'s parties-keyed lookup exists to keep reachable. Filtering
 * on heat here would make a cold thread unreachable by scene selection and
 * quietly delete revivals from the season — the opposite of what this query is
 * for. Contrast `openThreadsFor`, which DOES filter on heat because it answers
 * "what is live for this person right now", a different question.
 */
export function openThreads(ep) { // eslint-disable-line no-unused-vars
  return (gs.tr?.threads || []).filter(t => t.state === 'open');
}
