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

/**
 * What has been written down about this person, oldest first.
 *
 * `opts` narrows it to ONE story and to what was written strictly BEFORE a
 * given episode, which is what a citing event actually needs: an accusation in
 * episode 7 may name episode 2, and must not name the beat it is itself in the
 * middle of writing. Both filters are optional — `residueFor(name)` is
 * unchanged and still returns everything.
 */
export function residueFor(name, { threadId = null, beforeEp = null } = {}) {
  let out = (gs.tr?.residue?.[name] || []);
  if (threadId != null) out = out.filter(r => r.threadId === threadId);
  if (beforeEp != null) out = out.filter(r => r.ep < beforeEp);
  return out;
}

/**
 * The earlier moments of one thread, oldest first, as `{ ep, note }`.
 *
 * Read through `residueFor` on purpose rather than off `t.beats`: residue is
 * the durable record spec §5.4.4 says later events cite, and a citation that
 * silently fell back to the beat log would keep working with residue deleted —
 * which is exactly the unfailable-guard shape this project keeps finding.
 * Parties share the story, so one party's residue IS the thread's residue.
 */
export function priorMoments(thread, ep) {
  if (!thread?.parties?.length) return [];
  const seen = new Set();
  const out = [];
  // ONE MOMENT PER DAY. A thread can take two beats in the same round — the
  // runner draws several scenes per round and `openThread` folds a second one
  // into the first thread — and a citation is written in days, so two beats on
  // day 4 would print "day 4 and day 4". The earliest note of that day wins.
  for (const r of residueFor(thread.parties[0], { threadId: thread.id, beforeEp: ep })) {
    if (!r.note || seen.has(r.ep)) continue;
    seen.add(r.ep);
    out.push(r);
  }
  return out;
}

/**
 * One sentence that names the earlier moments of `thread` BY DAY and, for the
 * one it leads with, by what actually happened.
 *
 * DEGRADES DOWNWARD BY DESIGN, and the one-moment form is the important one.
 * 73.9% of threads still die at their first beat and only 3.96% reach a
 * payoff, so a citation mechanism that needs the spec's six-episode thread
 * would be unreachable content. The common case is a two-beat thread with
 * exactly one earlier moment; that is the form written first, and the
 * three-moment form (spec §5.2's "naming all three moments") is the rare
 * flourish on top of it.
 *
 * IT LEADS WITH THE OPENING BEAT, never the most recent one. The opening beat
 * is the only note guaranteed to carry no citation of its own — quoting a
 * later note would splice a citation inside a citation and the text of a long
 * thread would grow with every beat.
 */
export function citeMoments(thread, ep, max = 3) {
  const prior = priorMoments(thread, ep).slice(0, max);
  if (!prior.length) return '';
  const first = prior[0];
  if (prior.length === 1) return `It went back to day ${first.ep}: ${first.note}`;
  const days = prior.slice(1).map(p => `day ${p.ep}`);
  const tail = days.length === 1
    ? days[0]
    : `${days.slice(0, -1).join(', ')} and ${days[days.length - 1]}`;
  return `It went back to day ${first.ep} — ${first.note} — and it had not stopped since: ${tail}.`;
}

/**
 * Advance the open thread these parties already have, or open a fresh one —
 * and when there IS one, splice its earlier moments into the note by day and
 * by name before writing it.
 *
 * This is the shape every citing event uses, and it exists as one function
 * because the ORDER is easy to get wrong in a way nothing would catch: the
 * citation has to be built from the thread as it stood BEFORE this beat is
 * appended, or every note ends by citing itself.
 *
 * Returns `{ thread, note, cited }` — `cited` is the episode numbers named, so
 * a caller can put them in its consequences and a test can assert on them
 * without parsing prose.
 */
export function continueThread(kind, parties, ep, note, { cite = true, max = 3 } = {}) {
  const existing = findOpenThread(kind, parties);
  if (!existing) return { thread: openThread(kind, parties, ep, note), note, cited: [] };
  return advanceCiting(existing, ep, note, { cite, max });
}

/**
 * The same thing for an event that already HAS the thread in hand — several
 * events look one up in `weight()` and would otherwise pay for a second
 * `findOpenThread`, which on a party set holding two open threads of one kind
 * could resolve to a different one than the event decided it was continuing.
 */
export function advanceCiting(thread, ep, note, { cite = true, max = 3 } = {}) {
  if (!thread) return { thread: null, note, cited: [] };
  const prior = cite ? priorMoments(thread, ep).slice(0, max) : [];
  const citation = prior.length ? citeMoments(thread, ep, max) : '';
  const full = citation ? `${note} ${citation}` : note;
  return { thread: advanceThread(thread.id, ep, full), note: full, cited: prior.map(p => p.ep) };
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
