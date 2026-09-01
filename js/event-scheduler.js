// ══════════════════════════════════════════════════════════════════════
// event-scheduler.js — the format-neutral weighted scene/event scheduler
// ══════════════════════════════════════════════════════════════════════
//
// Extracted from js/bb/house-events.js (Task 3 of the Traitors-full-
// experience plan) once The Traitors needed the exact same selection
// mechanics Big Brother's house already used — fresh-first weighted picking,
// a hard cap on how many times one event may repeat, and an optional
// screen-time boost so an underfeatured player has a real path onto screen —
// without running Big Brother's ninety-six events or touching `gs.bb`.
//
// WHAT LIVES HERE: pick-one-then-fire-it, repeated per beat. Given a pool of
// `{ id, weight(), fire() }` candidates, decide which one wins THIS beat
// against the world as it stands right now, fire it, and only then score the
// next beat. That ordering is not a style choice: several Big Brother events
// (e.g. js/bb-events/social.js's alliance-pair events) read the CURRENT state
// of bonds/alliances in weight() and again in fire(), and earlier beats in
// the same act mutate exactly that state. Scoring every beat up front against
// a frozen snapshot and firing them all afterwards — which an earlier version
// of this module did — let beat 3's fire() run against a world beat 3's own
// weight() never saw, and it crashed reaching for an alliance pair that beat
// 1's firing had already dissolved. So the kernel calls `fire()`, one pick at
// a time, interleaved with the next beat's scoring — it just does not know or
// care WHAT firing means.
//
// WHAT DOES NOT LIVE HERE, on purpose: any format-specific MEANING of
// firing. Big Brother's beats need a state API, a ledger, room assignment and
// prose validation around every firing; The Traitors' scenes need cooldown
// scopes, thread continuation and an emotional-state snapshot. Both of those
// are FORMAT vocabulary — if a mechanic needs a format's words to describe
// it, it does not belong in a kernel shared by two formats. A caller whose
// `fire()` needs different arguments than `(context, meta, rng)` supplies
// `options.fireEvent` to adapt the call; a caller whose weight needs more
// than `(context, meta)` supplies `options.scoreEvent` the same way. Big
// Brother uses both hooks (js/bb/house-events.js); neither hook's body lives
// here.
//
// R4 (controller ruling, load-bearing): this module takes randomness ONLY by
// injection and never calls Math.random() itself. A bare Math.random() in a
// scheduling path is exactly the defect class that has previously broken this
// project's seeded-replay guards for Big Brother weeks — see
// project_bb_seeded_season.md. `scheduleWeightedEvents` throws if `rng` is
// missing rather than silently defaulting, so a caller who forgets to wire a
// seed fails loudly at the call site instead of quietly drifting off-seed.
// (Big Brother's own `scheduleHouseBeats` keeps its pre-existing
// `options.rng || Math.random` default for backward compatibility — that
// fallback lives in js/bb/house-events.js, not here, so this kernel's own
// source is provably free of the call.)

/**
 * Weighted-random pick among scored entries, consuming exactly one `rng()`
 * call. Shared by `scheduleWeightedEvents` below (entries keyed on
 * `.weight`) and by The Traitors' `pickEvent` (js/tr/events.js), whose
 * entries carry a `.score` instead — hence the configurable accessor rather
 * than a hardcoded property name.
 *
 * @param {Array} entries
 * @param {Function} rng - () => number in [0, 1)
 * @param {Function} [getWeight] - entry => number, defaults to entry.weight
 * @returns {*} the picked entry, or null if the list is empty or every
 *   weight is zero/negative.
 */
export function weightedPick(entries, rng, getWeight = entry => entry.weight) {
  if (!entries || !entries.length) return null;
  const total = entries.reduce((sum, entry) => sum + getWeight(entry), 0);
  if (total <= 0) return null;
  let roll = rng() * total;
  for (const entry of entries) {
    roll -= getWeight(entry);
    if (roll <= 0) return entry;
  }
  return entries.at(-1) || null;
}

/**
 * How much an event's weight is multiplied for the participants it declares,
 * given how many beats/scenes they have already appeared in this season
 * (`participantCounts`). An event with no declared participants (the whole
 * of Big Brother's catalogue, today — screen-time balancing there lives
 * inside individual events' own `weight()` via `beatsInvolving()`) gets
 * exactly 1x, so this is a no-op unless a caller opts in by declaring
 * `participants` on its events.
 *
 * Deliberately additive per participant rather than multiplicative: a scene
 * with two people, one heavily featured and one never seen, should still get
 * a meaningful boost from the person who needs the screen time, not have it
 * diluted to nothing by their heavily-featured scene partner.
 */
function screenTimeBoost(participants, participantCounts) {
  if (!participants || !participants.length) return 1;
  let sum = 0;
  for (const name of participants) {
    const seen = Number(participantCounts[name]) || 0;
    sum += Math.max(0, 1 - seen / 10);
  }
  return 1 + (sum / participants.length);
}

/**
 * Run up to `max` (at least `min`) beats: each beat scores every eligible
 * candidate in `events` against the world AS IT STANDS RIGHT NOW, picks one
 * with the same fresh-first weighted algorithm Big Brother's house has always
 * used (an event that has not yet fired this call is always preferred over
 * one that has; no event may fire more than `maxUses` times regardless of how
 * much it is favoured), fires it, and only then moves to the next beat — so a
 * later beat's scoring sees whatever the winner just changed, exactly as a
 * hand-written per-beat loop would.
 *
 * Firing itself is a black box to this module: by default it calls
 * `event.fire(context, meta, rng)` and records whatever comes back, but a
 * caller whose events need a different call shape (Big Brother's take
 * `(house, beatCtx, api, rng)`, not `(context, meta, rng)`) supplies
 * `options.fireEvent` to adapt it. Likewise `options.scoreEvent` adapts the
 * weight call. Neither hook's body belongs in this file — see the module doc.
 *
 * @param {Array<{id:string, weight:Function, fire:Function, participants?:(string[]|Function)}>} events
 * @param {*} context - opaque; passed through to weight()/fire()/scoreEvent/fireEvent/participantsOf
 * @param {object} options
 * @param {Function} options.rng - REQUIRED. () => number in [0, 1).
 * @param {number} [options.min=1]
 * @param {number} [options.max=3]
 * @param {number} [options.maxUses=2] - cap on how many times one event id may fire
 * @param {Function} [options.repetitionPenalty] - (uses, event) => multiplier,
 *   applied only once `uses > 0` (i.e. never on an event's first, fresh pick).
 *   Defaults to a no-op (1x) — the fresh-first-then-capped-repeat rule alone
 *   is Big Brother's existing repetition penalty, and a caller that wants a
 *   steeper one opts in explicitly.
 * @param {Object<string,number>} [options.participantCounts] - name -> beats
 *   already seen this season; feeds the underfeatured-participant boost.
 * @param {Object<string,string[]>} [options.incompatibilities] - id -> ids
 *   that, once fired earlier in this same call, exclude this event entirely.
 * @param {Function} [options.scoreEvent] - (event, context, meta) => number,
 *   overrides the default `event.weight(context, meta)` call. Big Brother
 *   uses this to fold in per-beat context (the beat index, HOH alternation)
 *   and its drinks-night modifier without teaching the kernel about either.
 * @param {Function} [options.fireEvent] - (event, context, meta, rng) => result,
 *   overrides the default `event.fire(context, meta, rng)` call. Big Brother
 *   uses this to supply `(house, beatCtx, api, rng)`, drain its ledger, diff
 *   the world, validate the returned beat and record it — none of which this
 *   module knows anything about.
 * @param {Function} [options.participantsOf] - (event, context) => string[],
 *   overrides `event.participants`.
 * @returns {Array<{event, id, participants, weight, uses, result}>}
 */
export function scheduleWeightedEvents(events, context, options = {}) {
  if (!Array.isArray(events) || !events.length) return [];
  const rng = options.rng;
  if (typeof rng !== 'function') {
    throw new Error('scheduleWeightedEvents requires options.rng — this kernel never falls back to an unseeded default');
  }
  const min = Math.max(0, options.min ?? 1);
  const max = Math.max(min, options.max ?? 3);
  const maxUses = Math.max(1, options.maxUses ?? 2);
  const repetitionPenalty = options.repetitionPenalty || (() => 1);
  const participantCounts = options.participantCounts || {};
  const incompatibilities = options.incompatibilities || {};
  const desired = Math.min(max, min + Math.floor(rng() * (max - min + 1)));

  const fired = [];
  const uses = new Map();
  const firedIds = new Set();

  for (let index = 0; index < desired; index++) {
    const meta = { index, uses };
    const usable = events
      .filter(ev => ev?.id && typeof ev.weight === 'function' && typeof ev.fire === 'function')
      .filter(ev => !(incompatibilities[ev.id] || []).some(id => firedIds.has(id)))
      .map(ev => {
        const u = uses.get(ev.id) || 0;
        const participants = options.participantsOf ? (options.participantsOf(ev, context) || [])
          : (typeof ev.participants === 'function' ? (ev.participants(context) || []) : (ev.participants || []));
        const raw = options.scoreEvent ? options.scoreEvent(ev, context, meta) : ev.weight(context, meta);
        const weight = Math.max(0, Number(raw) || 0)
          * (u > 0 ? repetitionPenalty(u, ev) : 1)
          * screenTimeBoost(participants, participantCounts);
        return { event: ev, id: ev.id, uses: u, participants, weight };
      })
      .filter(entry => entry.weight > 0);

    // Fresh candidates are exhausted first. Only once nothing unpicked is
    // eligible does an event get a repeat, capped at maxUses.
    const fresh = usable.filter(entry => entry.uses === 0);
    const eligible = fresh.length ? fresh : usable.filter(entry => entry.uses < maxUses);
    const picked = weightedPick(eligible, rng, entry => entry.weight);
    if (!picked) break;

    uses.set(picked.id, (uses.get(picked.id) || 0) + 1);
    firedIds.add(picked.id);
    // Fired immediately, before the next beat is ever scored — see the
    // module doc for why deferring every firing to the end is a correctness
    // bug, not a style choice.
    const result = options.fireEvent ? options.fireEvent(picked.event, context, meta, rng)
      : picked.event.fire(context, meta, rng);
    fired.push({ event: picked.event, id: picked.id, participants: picked.participants,
      weight: picked.weight, uses: picked.uses, result });
  }
  return fired;
}
