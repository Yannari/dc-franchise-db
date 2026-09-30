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
import { standardBlocking, applyBlock, runVisit, atRiskOf, saveOne } from './blocking.js';
import { blockScore, deliberate } from './hangout.js';
import { makeClaim, learn } from './claims.js';
import { feel } from './mind.js';

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
  instant: { removes: 1, seats: 0, can: () => true, run: instantBlock },
  // US 6 Ep 3: rank from most to least human; the most human blocks alone.
  'most-human': { removes: 1, seats: 1, human: true, can: ctx => ctx.position !== 'last',
    run: (state, rng, rating) => standardBlocking(state, rng, rating, { format: 'most-human' }) },
  'public-super': { removes: 1, seats: 1, hidden: true, can: ctx => ctx.position === 'late' || ctx.position === 'last',
    // UK 2 Ep 17: the audience's choice, handed in by season.js (public.js
    // is the only reader of the audience; the engine never reads it itself).
    pick: (res, state) => [res.map(r => r.profile).includes(state.publicChoice) ? state.publicChoice : res[0].profile],
    run: (state, rng, rating) => standardBlocking(state, rng, rating, { format: 'public-super', inPerson: true, mark: { public: true } }) },
  none: { removes: 0, seats: 2, can: ctx => ctx.position === 'early' || ctx.position === 'middle', run: noBlocking },
  mission: { removes: 1, seats: 2, quiet: true, can: ctx => ctx.position !== 'first' && ctx.position !== 'last',
    canNow: state => state.active.length >= 6, before: (state, rng) => missionBefore(state, rng), run: missionNight },
  antivirus: { removes: 1, seats: 0, can: ctx => ctx.position === 'middle' || ctx.position === 'late',
    canNow: state => newcomersIn(state).length >= 2 && state.active.length >= 5, run: antivirus },
  double: { removes: 2, seats: 2, can: ctx => ctx.position !== 'first' && ctx.position !== 'last', run: doubleBlock },
  'save-two': { removes: 1, seats: 2, can: () => true, canNow: state => state.active.length >= 5, run: saveTwoEach },
  plead: { removes: 1, seats: 2, can: () => true, canNow: state => state.active.length >= 6, run: saveThenPlead },
  'room-vote': { removes: 1, seats: 2, can: () => true, canNow: state => state.active.length >= 5, run: roomVote },
  forced: { removes: 1, seats: 2, can: ctx => ctx.position === 'first' || ctx.position === 'early',
    before: (state, rng) => forcedStatements(state, rng), run: forcedBlock },
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

// ── Public formats (Plan 3b Task 4) ──────────────────────────────────

// The Influencers take turns saving one player each, in the Circle Chat,
// until `leave` are left unsaved.
function savesUntil(state, rng, infl, leave) {
  let atRisk = atRiskOf(state, infl);
  for (let turn = 0; atRisk.length > leave; turn++) {
    const saved = saveOne(state, rng, infl[turn % infl.length], atRisk);
    atRisk = atRisk.filter(t => t !== saved);
  }
  return atRisk;
}

function finish(state, rng, target, by, channel, data) {
  const sc = addScene(state, 'blocking', by.length ? [by[0], target] : [target], { by, target, channel, ...data }, [...state.active]);
  applyBlock(state, target, channel, by, sc);
  const visit = runVisit(state, rng, target, by);
  state.pendingGoodbyes.push(target);
  return { target, announcement: sc, visit };
}

// US 1 Ep 7: whoever is never saved is blocked. No Hangout.
function saveTwoEach(state, rng, rating) {
  const infl = rating.influencers.slice(0, 2);
  const [left] = savesUntil(state, rng, infl, 1);
  for (const h of state.active) delete state.immuneNext[h];
  return finish(state, rng, left, infl, 'unsaved', { reason: 'unsaved', format: 'save-two' });
}

// US 4 Ep 10: saves until two are left; they plead face to face; then the
// Influencers decide between them. A plea lands as much as the pleader can
// talk (social, nerve) and the listener already feels for them.
export const PLEA = { scale: 0.25 };
function saveThenPlead(state, rng, rating) {
  const infl = rating.influencers.slice(0, 2);
  const pleaders = savesUntil(state, rng, infl, 2);
  const sc = addScene(state, 'plead', [...pleaders, ...infl], { pleaders, by: infl }, [...state.active]);
  for (const p of pleaders) {
    const pull = (S(state, p, 'social') + S(state, p, 'boldness')) / 20 + rng() * 0.3;
    for (const i of infl) bump(i, p, 'affection', pull * (1 + Math.max(0, rel(i, p, 'affection')) / 10) * PLEA.scale * 4);
    feel(state, p, 'stress', 2);
  }
  return standardBlocking(state, rng, { ...rating, influencers: infl }, { format: 'plead', atRisk: pleaders });
}

// UK 1 Ep 15: the bottom two are named, and everyone else votes in public.
// A tie goes to the top-rated player. Every vote is a claim the room learns.
function roomVote(state, rng, rating) {
  const bottom = rating.results.map(r => r.profile).filter(h => state.active.includes(h) && !state.immuneNext[h]).slice(-2);
  const voters = state.active.filter(h => !bottom.includes(h));
  const votes = {};
  for (const v of voters) votes[v] = bottom.map(t => [t, blockScore(state, v, t).total + rng() * 0.5]).sort((a, b) => b[1] - a[1])[0][0];
  const sc = addScene(state, 'vote', [...bottom], { bottom, votes }, [...state.active]);
  for (const [v, t] of Object.entries(votes)) {
    const c = makeClaim(state, { kind: 'targeting', holder: v, about: t, truth: true, secrecy: 'public', by: v });
    for (const o of state.active) if (o !== v) learn(state, o, c, v, sc);
  }
  const tally = Object.fromEntries(bottom.map(t => [t, Object.values(votes).filter(x => x === t).length]));
  const top = rating.results[0].profile;
  const target = tally[bottom[0]] === tally[bottom[1]] ? votes[top] || bottom[0]
    : bottom.sort((a, b) => tally[b] - tally[a])[0];
  sc.data.tally = tally;
  for (const h of state.active) delete state.immuneNext[h];
  return finish(state, rng, target, voters.filter(v => votes[v] === target), 'vote', { reason: 'vote', format: 'room-vote', tally });
}

// US 5 Ep 1: before the ratings, everyone says in public who they would
// block, and the top-rated player's answer becomes the block. Saying it is a
// claim: the named resent the namer before a single ballot is cast.
function forcedStatements(state, rng) {
  const picks = {};
  for (const h of state.active) {
    picks[h] = state.active.filter(t => t !== h).map(t => [t, blockScore(state, h, t).total + rng() * 0.5])
      .sort((a, b) => b[1] - a[1])[0][0];
  }
  const sc = addScene(state, 'statement', [...state.active], { picks }, [...state.active]);
  for (const [h, t] of Object.entries(picks)) {
    const c = makeClaim(state, { kind: 'targeting', holder: h, about: t, truth: true, secrecy: 'public', by: h });
    for (const o of state.active) if (o !== h) learn(state, o, c, h, sc);
  }
  return sc;
}
function forcedBlock(state, rng, rating) {
  const st = state.scenes.filter(s => s.kind === 'statement' && s.day === state.day).at(-1);
  const top = rating.results[0].profile;
  const target = st?.data.picks[top];
  if (!target || !state.active.includes(target)) return standardBlocking(state, rng, rating, { format: 'forced' });
  for (const h of state.active) delete state.immuneNext[h];
  return finish(state, rng, target, [top], 'statement', { reason: 'statement', format: 'forced' });
}

// ── Removals (Plan 3b Task 5) ────────────────────────────────────────

// US 1 Ep 9 (Bill), UK 1 Ep 10, 17: the lowest-rated player is blocked at
// once, by nobody, and sometimes leaves without a visit.
export const INSTANT = { noVisit: 0.4 };
function blockLowest(state, rng, target, format) {
  const visit = rng() >= INSTANT.noVisit;
  const sc = addScene(state, 'blocking', [target], { by: [], target, channel: 'instant', reason: 'instant', format,
    ...(visit ? {} : { noVisit: true }) }, [...state.active]);
  applyBlock(state, target, 'instant', [], sc);
  const v = visit ? runVisit(state, rng, target, []) : null;
  state.pendingGoodbyes.push(target);
  return { target, announcement: sc, visit: v };
}
function instantBlock(state, rng, rating) {
  for (const h of state.active) delete state.immuneNext[h];
  // A given immunity holds even here: the lowest who is not immune.
  const lowest = rating.results.map(r => r.profile).filter(h => state.active.includes(h) && !state.immuneNext[h]);
  for (const h of state.active) delete state.immuneNext[h];
  return blockLowest(state, rng, lowest.at(-1) || rating.results.at(-1).profile, 'instant');
}

// Two in one night, three ways the real seasons did it: the lowest at once
// and then a Hangout (US 1 Ep 9), each Influencer blocking one alone (US 3
// Ep 9), or the lowest two together (US 2 Ep 8). The timeline gave a later
// blocking day back for the extra one.
export const DOUBLE_VARIANTS = [['instant-then-hangout', 2], ['each', 1.5], ['lowest-two', 1]];
function doubleBlock(state, rng, rating) {
  const total = DOUBLE_VARIANTS.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total, variant = DOUBLE_VARIANTS[0][0];
  for (const [v, w] of DOUBLE_VARIANTS) { if ((r -= w) <= 0) { variant = v; break; } }
  const infl = rating.influencers.slice(0, 2);
  if (variant === 'each' && infl.length < 2) variant = 'instant-then-hangout';
  const night = state.nights?.at(-1);
  if (night) night.variant = variant;
  const lowest = rating.results.map(r => r.profile).filter(h => !infl.includes(h) && !state.immuneNext[h]);
  if (variant === 'lowest-two') {
    for (const h of state.active) delete state.immuneNext[h];
    const [a, b] = [lowest.at(-1), lowest.at(-2)];
    return [blockLowest(state, rng, a, 'double'), blockLowest(state, rng, b, 'double')];
  }
  if (variant === 'instant-then-hangout') {
    const first = blockLowest(state, rng, lowest.at(-1), 'double');
    return [first, standardBlocking(state, rng, rating, { format: 'double' })];
  }
  // Each Influencer alone; neither can block the other.
  return infl.map(i => standardBlocking(state, rng, { ...rating, influencers: [i] }, { format: 'double', atRisk: atRiskOf(state, infl) }));
}

// ── Antivirus (Plan 3b Task 6; US 4 Ep 8-9, "Data Breach") ────────────
// The newest arrivals hold the antivirus and pass it on; every receiver is
// safe and passes it again; whoever never gets it is blocked. Every pass is
// public: a debt for the receiver, a sting for whoever hoped to be next.
const newcomersIn = state => state.active.filter(h => (state.joinedDay[h] || 1) > 1)
  .sort((a, b) => (state.joinedDay[b] || 1) - (state.joinedDay[a] || 1));
function antivirus(state, rng, rating) {
  const holders = newcomersIn(state).slice(0, 2);
  let unsafe = state.active.filter(h => !holders.includes(h) && !state.immuneNext[h]);
  const queue = [...holders], passes = [];
  while (unsafe.length > 1 && queue.length) {
    const from = queue.shift();
    const to = unsafe.map(t => [t, rel(from, t, 'affection') + rel(from, t, 'obligation') * 1.5 + rel(from, t, 'trust') * 0.5 + rng()])
      .sort((a, b) => b[1] - a[1])[0][0];
    passes.push({ from, to });
    unsafe = unsafe.filter(t => t !== to);
    queue.push(to);
  }
  const sc = addScene(state, 'antivirus', [...holders], { holders, passes, left: unsafe }, [...state.active]);
  for (const { from, to } of passes) {
    bump(to, from, 'obligation', 2); bump(to, from, 'affection', 1);
    const c = makeClaim(state, { kind: 'saved', holder: from, about: to, truth: true, secrecy: 'public', by: from });
    for (const o of state.active) if (o !== from) learn(state, o, c, from, sc);
  }
  for (const h of unsafe) feel(state, h, 'stress', 3);
  for (const h of state.active) delete state.immuneNext[h];
  return finish(state, rng, unsafe[0], [], 'antivirus', { reason: 'antivirus', format: 'antivirus', order: passes.map(p => p.to) });
}

// ── Circle-wide twists (Plan 3b Task 9a) ─────────────────────────────


// US 7 Ep 1: no blocking tonight. The timeline makes a later night take two.
function noBlocking(state, rng, rating) {
  addScene(state, 'no-block', [...rating.influencers], { influencers: rating.influencers }, [...state.active]);
  for (const h of state.active) { feel(state, h, 'stress', -1.5); feel(state, h, 'elation', 0.5); }
  for (const h of state.active) delete state.immuneNext[h];
  return null;
}

// UK 3 Ep 8: before the ratings the Circle gives one player a secret target.
// If the target is blocked tonight, the mission succeeds; if not, the one on
// the mission is blocked instead. They lobby their friends quietly.
function missionBefore(state, rng) {
  const holder = state.active[Math.floor(rng() * state.active.length)];
  const others = state.active.filter(o => o !== holder);
  const target = others[Math.floor(rng() * others.length)];
  const sc = addScene(state, 'mission', [holder], { holder, target }, [holder]);
  for (const o of others) if (o !== target && rel(o, holder, 'affection') > 2 && rng() < S(state, holder, 'social') / 10) {
    bump(o, target, 'trust', -0.8); bump(o, holder, 'obligation', -0.3);
  }
  feel(state, holder, 'stress', 2);
  state.mission = { holder, target, scene: sc.id };
}
function missionNight(state, rng, rating) {
  const m = state.mission; state.mission = null;
  if (!m || !state.active.includes(m.holder)) return standardBlocking(state, rng, rating, { format: 'mission' });
  return standardBlocking(state, rng, rating, { format: 'mission', mark: { mission: m },
    decide: d => (d.target === m.target ? { target: d.target } : { target: m.holder, channel: 'mission' }) });
}

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
export function prepareNight(state, night = { format: 'standard' }, rng = null) {
  // A power the blocked player will hand over at tonight's visit.
  state.nightPower = night.power || null;
  let format = night.format || 'standard';
  if (!FORMATS[format] || !(FORMATS[format].canNow?.(state) ?? true)) {
    night.fellBack = format; format = 'standard';
  }
  night.format = format;
  // A secret format (a mission) is not announced: only its holder knows.
  if (format !== 'standard' && !FORMATS[format].quiet) addScene(state, 'alert', [...state.active], { format }, [...state.active]);
  (state.nights ||= []).push({ day: state.day, format, ...(night.fellBack ? { fellBack: night.fellBack } : {}) });
  // Some formats act before a ballot is cast (a forced statement).
  if (FORMATS[format].before && rng) FORMATS[format].before(state, rng, night);
  return night;
}

/** After the ratings: tonight's blocking. */
export function runBlocking(state, rng, rating, night = { format: 'standard' }) {
  return FORMATS[night.format || 'standard'].run(state, rng, rating);
}
