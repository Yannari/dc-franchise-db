// ══════════════════════════════════════════════════════════════════════
// ci/formats.js — how a ratings night ends (spec §10, Plan 3b)
// ══════════════════════════════════════════════════════════════════════
//
// A format is the rule that turns a ratings night into a blocking. Each
// entry says how many it removes, how many Influencers it seats, whether it
// can run tonight, and runs. The timeline (ci/timeline.js) draws only
// formats registered here, so nothing half-built can be booked. A format
// that cannot run when its night comes falls back to standard, on record.
import { addScene, rel, bump, S, clamp, schemeEligible } from './state.js';
import { belief } from './beliefs.js';
import { standardBlocking, applyBlock, runVisit, atRiskOf } from './blocking.js';

export const FORMATS = {
  // Every season: the top two meet in the Hangout and block one.
  standard: { removes: 1, seats: 2, can: () => true,
    run: (state, rng, rating) => standardBlocking(state, rng, rating, { format: 'standard' }) },
  // US 3 Ep 1, UK 3 Ep 1: the top-rated player alone.
  sole: { removes: 1, seats: 1, can: () => true,
    run: (state, rng, rating) => standardBlocking(state, rng, rating, { format: 'sole' }) },
  // UK 1 Ep 6: the top three, who must agree (a majority decides).
  trio: { removes: 1, seats: 3, pick: res => res.slice(0, 3).map(r => r.profile), can: () => true,
    canNow: state => state.active.length >= 6,
    run: (state, rng, rating) => standardBlocking(state, rng, rating, { format: 'trio' }) },
  // US 5 Ep 4, US 2: each Influencer saves one in public, then they block from the rest.
  'save-first': { removes: 1, seats: 2, can: () => true,
    canNow: state => state.active.length >= 7,
    run: (state, rng, rating) => standardBlocking(state, rng, rating, { format: 'save-first', saves: true }) },
  // US 3 Ep 10, 12: nobody knows who the Influencers are, or where they placed.
  secret: { removes: 1, seats: 2, hidden: true, can: () => true,
    run: (state, rng, rating) => standardBlocking(state, rng, rating, { format: 'secret', secret: true }) },
  // US 1 Ep 10, US 4 Ep 12, US 7 Ep 12: the top player alone, ratings hidden,
  // the block delivered at the blocked player's door.
  super: { removes: 1, seats: 1, hidden: true, can: ctx => ctx.position !== 'first',
    run: (state, rng, rating) => standardBlocking(state, rng, rating, { format: 'super', inPerson: true }) },
  // UK 3 Ep 16: the Influencers may block each other first.
  mutual: { removes: 1, seats: 2, can: () => true,
    canNow: state => state.active.length >= 5,
    run: (state, rng, rating) => {
      const infl = rating.influencers.slice(0, 2);
      if (infl.length < 2) return standardBlocking(state, rng, rating, { format: 'mutual' });
      const out = blockEachOther(state, rng, infl);
      if (!out.target) return standardBlocking(state, rng, rating, { format: 'mutual' });
      const by = infl.filter(i => i !== out.target);
      const sc = addScene(state, 'blocking', [by[0], out.target],
        { by, target: out.target, reason: 'offer', channel: 'offer', format: 'mutual' }, [...state.active]);
      applyBlock(state, out.target, 'offer', by, sc);
      const visit = runVisit(state, rng, out.target, by);
      state.pendingGoodbyes.push(out.target);
      return { target: out.target, announcement: sc, visit };
    } },
};

// Would an Influencer take the chance to block the other one? Only a player
// who may scheme (the archetype rule), and then as much as they resent and
// fear the other, against what they feel for them, scaled by nerve.
export const MUTUAL = { scale: 0.12 };
export function blockEachOther(state, rng, [A, B]) {
  const wants = (x, y) => schemeEligible(state, x)
    && rng() < clamp((rel(x, y, 'resentment') + belief(state, x, y).threat * 0.5 - rel(x, y, 'affection'))
      * S(state, x, 'boldness') / 10 * MUTUAL.scale, 0, 0.9);
  const answers = { [A]: wants(A, B), [B]: wants(B, A) };
  let target = null;
  if (answers[A] && !answers[B]) target = B;
  else if (answers[B] && !answers[A]) target = A;
  else if (answers[A] && answers[B]) target = S(state, A, 'boldness') >= S(state, B, 'boldness') ? B : A;
  // The offer is made in front of everyone: taking it is a betrayal all can see.
  const sc = addScene(state, 'offer', [A, B], { answers, target }, [...state.active]);
  for (const [x, y] of [[A, B], [B, A]]) {
    if (!answers[x]) continue;
    bump(y, x, 'resentment', 4);
    for (const o of state.active) if (o !== x && o !== y) bump(o, x, 'trust', -1);
  }
  if (!target) for (const [x, y] of [[A, B], [B, A]]) bump(x, y, 'trust', 1);
  return { answers, target, scene: sc };
}

/** Before the ratings: settle tonight's format (a booking that cannot run
 *  tonight falls back to standard, on record) and, if it is not the usual
 *  Hangout, the Circle tells the players the rule before it happens (§16.4). */
export function prepareNight(state, night = { format: 'standard' }) {
  let format = night.format || 'standard';
  if (!FORMATS[format] || !(FORMATS[format].canNow?.(state) ?? true)) {
    night.fellBack = format; format = 'standard';
  }
  night.format = format;
  if (format !== 'standard') addScene(state, 'alert', [...state.active], { format }, [...state.active]);
  (state.nights ||= []).push({ day: state.day, format, ...(night.fellBack ? { fellBack: night.fellBack } : {}) });
  return night;
}

/** After the ratings: tonight's blocking. */
export function runBlocking(state, rng, rating, night = { format: 'standard' }) {
  return FORMATS[night.format || 'standard'].run(state, rng, rating);
}
