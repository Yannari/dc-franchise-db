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

/**
 * ep -> act. THE ONE DEFINITION (spec 5.2 gives a thread an `act`; 5.4.3 gives
 * an event `acts` multipliers keyed by the same three names). It lives here and
 * not in events.js because a thread has to be stamped with the act it OPENED in
 * and events.js already imports this module - the other direction would be a
 * cycle, and two copies of a three-way split is exactly the drift this project
 * keeps finding.
 */
export function actFor(ep) {
  return ep <= 3 ? 'early' : ep <= 7 ? 'middle' : 'late';
}

/**
 * How a beat REFERS to an act out loud. A thread still open two acts after it
 * opened is a different sentence from one opened this morning, and "the early
 * act" is production vocabulary, not something a person in the castle would say.
 */
const ACT_PHRASE = {
  early: 'the first days in the castle',
  middle: 'the middle of the season',
  late: 'the back half',
};
export function actPhrase(act) { return ACT_PHRASE[act] || null; }

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
  // `act` is the act the thread OPENED in (spec 5.2), stamped once and never
  // recomputed - the whole point of the field is that an episode-9 beat can ask
  // whether this story started in a different part of the season, which a value
  // derived from "now" could never answer.
  const t = { id, kind, parties: [...parties], openedEp: ep, lastEp: ep, act: actFor(ep),
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
 * WHAT A CLOSED OUTCOME MEANS, coarsely (spec 5.5: a fork writes different
 * residue and opens different downstream events). Events do not branch on the
 * eleven literal strings - that would be a list of known cases, and the
 * twelfth close site would silently fall off the end of every one of them.
 * They branch on the SENSE, and a source rule in tr-threads.test.js fails when
 * a `closeThread` call in js/tr/castle/ passes an outcome this map has never
 * heard of.
 *
 *   walked  - scrutiny arrived and they came out the other side of it
 *   cracked - scrutiny arrived and something came out of them
 *   coupled - the story was a romance and it resolved as one
 */
const OUTCOME_SENSE = {
  'denied-convincingly': 'walked',
  'passed-clean': 'walked',
  'defended-by-history': 'walked',
  'turned-back': 'walked',
  'buried': 'walked',
  'confessed-unrelated': 'cracked',
  'test-exposed': 'cracked',
  'failed-maliciously': 'cracked',
  'exposed': 'cracked',
  'became-showmance': 'coupled',
  'broken-up': 'coupled',
};

/** The sense of a closed thread's outcome, or null if the string is unknown. */
export function outcomeSense(outcome) { return OUTCOME_SENSE[outcome] ?? null; }

/** Every outcome string this module knows how to read. For the source rule. */
export function knownOutcomes() { return Object.keys(OUTCOME_SENSE); }

/**
 * The most recently CLOSED thread this person was a party to.
 *
 * KEYED ON THE PERSON, NOT ON THE PAIR, and that is a reachability decision
 * rather than a taste one. Measured over 200 seasons at the shipped operating
 * point: 24.0 threads open per season and 0.84 CLOSE - 3.5% - so a scene whose
 * exact party set has a closed thread of the matching family occurs in 1.1% of
 * scenes, and a branch gated on that would be content nobody ever sees. The
 * same closure reaches an ACTOR in 8.0% of scenes, because a payoff is a thing
 * the castle remembers about a PERSON: they talked their way out of it once,
 * and the next person to look at them sideways knows that.
 */
export function lastClosedThread(name, { kind = null, beforeEp = null } = {}) {
  let best = null;
  for (const t of (gs.tr?.threads || [])) {
    if (t.state !== 'closed' || !t.outcome) continue;
    if (!t.parties.includes(name)) continue;
    if (kind != null && t.kind !== kind) continue;
    if (beforeEp != null && !(t.lastEp < beforeEp)) continue;
    if (!best || t.lastEp >= best.lastEp) best = t;
  }
  return best;
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
 * IT USED TO LEAD WITH THE OPENING BEAT, ALWAYS, and that was a bug at length
 * (round 2, R4). The stated reason was that the opening beat is the only note
 * guaranteed to carry no citation of its own — but `_head()` already solves
 * that, since it takes only the first SENTENCE of a note, which is the part an
 * event authored and never the citation appended after it. What the rule
 * actually produced was one sentence quoted verbatim in up to eight beats of a
 * single thread: found in a dump as four consecutive beats of one cover thread
 * repeating `cover-road-rehearsal`'s opener, twice sitting directly underneath
 * "X told the same story again, word for word. Nobody clocked the repetition."
 * The engine narrated its own bug.
 *
 * SO THE LEAD IS THE OLDEST PRIOR MOMENT NOT ALREADY QUOTED IN THIS THREAD,
 * and when every one of them has been quoted the citation drops to naming days
 * only. Deterministic — it reads the thread's own beat log, no rng — so replay
 * is unaffected.
 */
/**
 * The first sentence of a note, without its full stop, which is the unit two
 * beats are compared on. Notes accumulate citations, so the whole string is not
 * comparable — the head sentence is the part an event actually authored.
 */
function _head(note) {
  const first = String(note || '').split(/(?<=[.!?])[ ]/)[0];
  return first.trim().replace(/[.!?]+$/, '');
}

/**
 * Has this head sentence already been quoted somewhere in the thread?
 *
 * A head occurs once in its OWN beat by construction, so "quoted" means a
 * second occurrence. Counted over the thread's beat log rather than tracked on
 * the thread, because the beat log is the durable record and a counter would
 * be one more thing to keep in sync with it.
 */
function _alreadyQuoted(thread, head) {
  if (!head) return true;
  let n = 0;
  for (const b of (thread.beats || [])) {
    if (String(b.note || '').includes(head)) n++;
    if (n > 1) return true;
  }
  return false;
}

export function citeMoments(thread, ep, max = 3, against = null) {
  const prior = priorMoments(thread, ep).slice(0, max);
  if (!prior.length) return '';

  // TWO DIFFERENT MOMENTS, AND CONFLATING THEM IS A BUG I SHIPPED AND THEN
  // READ IN A DUMP (round 2, R4 follow-up).
  //
  //   EARLIEST — the day the story started. It is the only day the word
  //              "since" may ever name. `priorMoments` returns oldest-first,
  //              so it is prior[0], always.
  //   LEAD     — the moment worth QUOTING. Since R4 this is no longer the
  //              earliest, and the first version of that fix left "since"
  //              pointing at the lead: a thread produced "It went back to day 7
  //              ... and it had not stopped since: day 5", and another produced
  //              "It had been going on since day 2, and again on day 1." Both
  //              name real beats, in an order that cannot have happened.
  //
  // So "since" is anchored to EARLIEST, the quote is taken from LEAD, and every
  // other day is listed in ascending order with a connective that does not
  // claim an ordering ("it did not stop there").
  const earliest = prior[0];
  const headAgainst = against != null ? _head(against) : null;
  // Never quote the sentence we are appending to (review R2), and never quote
  // one this thread has already quoted (R4).
  const lead = prior.find((m) => {
    const h = _head(m.note);
    return h !== headAgainst && !_alreadyQuoted(thread, h);
  }) || null;

  const _days = (list) => {
    const d = list.map((m) => `day ${m.ep}`);
    return d.length === 1 ? d[0] : `${d.slice(0, -1).join(', ')} and ${d[d.length - 1]}`;
  };

  // NOTHING LEFT WORTH QUOTING — every prior moment is either the sentence
  // being written or one this thread has already quoted. Naming the days is
  // still true and still worth saying; a fifth copy of the same sentence is not.
  if (!lead) {
    const rest = prior.filter((m) => m !== earliest).sort((a, b) => a.ep - b.ep);
    // R2's original ruling, kept: with nothing else to name, say nothing. A
    // bare "It had been going on since day 1." appended to the day-1 sentence
    // itself is accounting, not a beat.
    if (!rest.length) return '';
    return `It had been going on since day ${earliest.ep}, and again on ${_days(rest)}.`;
  }

  const others = prior.filter((m) => m !== lead).sort((a, b) => a.ep - b.ep);
  // ONE MOMENT ONLY. `_head` and not the whole note, so a citation is never
  // spliced inside a citation — which is the guarantee the old "always lead
  // with the opening beat" rule used to provide and R4 removed.
  const quoted = _head(lead.note);
  if (!others.length) return `It went back to day ${lead.ep}: ${quoted}.`;

  // The quoted note is spliced INSIDE an em-dash parenthetical, so its own full
  // stop has to come off (review R3) or every multi-moment citation reads
  // "...anyone else. — and it did not stop there: day 5 and day 6."
  //
  // AND THE PARENTHETICAL CANNOT BE AN EM-DASH PAIR IF EITHER SIDE OF THE
  // SPLICE ALREADY HOLDS ONE — the quoted moment OR the host note it is being
  // appended to (round 2, R3; the first version of this checked only the quoted
  // half and 15 of 3703 beats still shipped three dashes).
  // `cover-feign-fear` writes "X performed the exact right amount of fear at
  // breakfast — no more, no less than anyone else.", and whichever end of the
  // splice that sentence lands on, the result is three or four dashes in one
  // sentence with no way to tell which pair is the aside. Nothing upstream
  // could catch it: both halves are well-formed alone and only the JOIN breaks.
  // The guard for this is written from that description — "more than one
  // em-dash pair in a note" — and not from the shape of this fix.
  if (quoted.includes('—') || String(against || '').includes('—')) {
    return `It went back to day ${lead.ep}: ${quoted}. It did not stop there: ${_days(others)}.`;
  }
  return `It went back to day ${lead.ep} — ${quoted} — and it did not stop there: ${_days(others)}.`;
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
  // LOUD, NOT SILENT (review R5). This replaced `advanceThread(t.id, ...)`,
  // which threw on a missing thread. Every call site today guarantees one in
  // its own `weight()`, so a null here means a weight/fire disagreement — the
  // exact class validateRegistry() exists to catch — and returning a tidy
  // `{ thread: null }` would drop the beat and let the season carry on looking
  // fine. `continueThread` never reaches this path: it opens instead.
  if (!thread) throw new Error('advanceCiting: no thread to advance — weight() and fire() disagree');
  const prior = cite ? priorMoments(thread, ep).slice(0, max) : [];
  const citation = prior.length ? citeMoments(thread, ep, max, note) : '';
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
