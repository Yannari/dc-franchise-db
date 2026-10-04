// ══════════════════════════════════════════════════════════════════════
// ci/blocking.js — the block, the visit, the goodbye (spec §9.4, §11)
// ══════════════════════════════════════════════════════════════════════
//
// Plan 1 plays the STANDARD format only (two influencers, the Hangout). The
// other formats of spec §10 are Plan 3 and plug in beside standardBlocking.
//
// The visit is the one time two players share a room before the final. Both
// learn each other's truth. The visited player now holds private knowledge
// — and a schemer may lie about it later (US 7: Madelyn invented what Heather
// said at her visit, and it steered the next blocking).
import { onBlocked } from './alliances.js';
import { rel, bump, S, clamp, addScene, isActive, schemeEligible } from './state.js';
import { belief } from './beliefs.js';
import { feel, mood } from './mind.js';
import { makeClaim, learn } from './claims.js';
import { revealTo } from './reveal.js';
import { attractionOk } from './chat.js';
import { deliberate } from './hangout.js';
import { THEORY_LINE } from './slips.js';
import { handOver } from './powers.js';
import { rideOrDieTarget } from './twists.js';
import { kinVisit, kinGoodbye, kinAtDoor } from './kin.js';
import { focusDamp, noteKiss, romanticPair } from './twotiming.js';
import { streamFor } from '../dr/rng.js';

export function atRiskOf(state, influencers) {
  const pool = state.active.filter(h => !influencers.includes(h));
  const exposed = pool.filter(h => !state.immuneNext[h]);
  return exposed.length ? exposed : pool;
}

export function applyBlock(state, h, channel, by, scene, { secret = false } = {}) {
  state.active = state.active.filter(x => x !== h);
  state.blocked.push({ handle: h, day: state.day, channel, by: [...by], ...(secret ? { secret: true } : {}) });
  for (const i of by) {
    // A secret Influencer is nobody the blocked player can resent: they don't know.
    if (!secret) bump(h, i, 'resentment', 3);
    const aff = rel(i, h, 'affection');
    if (aff > 0) feel(state, i, 'guilt', aff / 3);
  }
  for (const o of state.active) if (rel(o, h, 'affection') > 3) feel(state, o, 'stress', 1);
  // Their alliances lose them; one of their own blocking them breaks it.
  onBlocked(state, h, secret ? [] : by, scene);
}

// A public save before the Hangout (US 5 Ep 4): each Influencer takes the
// player they owe most off the list, in front of everyone. The saved player
// owes them, and the room knows who stood by whom.
export function saveOne(state, rng, i, pool) {
  const pick = pool.map(t => [t, rel(i, t, 'affection') + rel(i, t, 'obligation') * 1.5 + rel(i, t, 'trust') * 0.5
    + (state.pacts.some(p => (p.a === i && p.b === t) || (p.a === t && p.b === i)) ? 4 : 0) + rng()])
    .sort((a, b) => b[1] - a[1])[0][0];
  // `waiting`: who was still unsaved when this save came (who can feel passed over).
  const sc = addScene(state, 'save', [i, pick], { by: i, saved: pick, waiting: pool.filter(t => t !== pick) }, [...state.active]);
  bump(pick, i, 'obligation', 2); bump(pick, i, 'affection', 1);
  const c = makeClaim(state, { kind: 'saved', holder: i, about: pick, truth: true, secrecy: 'public', by: i });
  for (const o of state.active) if (o !== i) learn(state, o, c, i, sc);
  // Not being picked, in public, stings those who hoped to be.
  for (const o of pool.filter(t => t !== pick)) if (rel(o, i, 'affection') > 3) bump(o, i, 'resentment', 0.5);
  return pick;
}

export function publicSaves(state, rng, infl, atRisk) {
  const saved = [];
  for (const i of infl) {
    const pool = atRisk.filter(t => !saved.includes(t));
    if (pool.length <= 2) break;
    saved.push(saveOne(state, rng, i, pool));
  }
  return saved;
}

export function standardBlocking(state, rng, ratingRow, { format = 'standard', saves = false, secret = false, inPerson = false, atRisk: only = null, mark = {}, decide = null } = {}) {
  // A tie that makes everybody left an influencer would leave nobody at risk:
  // then only the top two decide.
  let infl = ratingRow.influencers;
  if (!atRiskOf(state, infl).length) infl = infl.slice(0, 2);
  let atRisk = only || atRiskOf(state, infl);
  if (saves) { const saved = publicSaves(state, rng, infl, atRisk); atRisk = atRisk.filter(t => !saved.includes(t)); }
  for (const h of atRisk) feel(state, h, 'stress', 2);
  const hangout = addScene(state, 'hangout', infl, { atRisk, format, ...(secret ? { secret: true } : {}) }, infl);
  const d = deliberate(state, rng, infl, atRisk);
  // A mission can overrule the Hangout (UK 3 Ep 8): it names who actually goes.
  let channel = 'influencers';
  const pick = d.target;
  if (decide) { const r = decide(d); if (r.target !== d.target || r.channel) { d.target = r.target; channel = r.channel || channel; } }
  // Ride or Die (US 6): a blocked player's partner may go in their place.
  { const r = rideOrDieTarget(state, rng, d.target); if (r.target !== d.target) { d.target = r.target; channel = r.channel || channel; } }
  // The Hangout scene keeps the Influencers' own pick: a twist that overrules
  // it (the audience, a mission, Ride or Die) airs as its own scene.
  Object.assign(hangout.data, d, { target: pick });
  for (const h of state.active) delete state.immuneNext[h];
  const announcement = addScene(state, 'blocking', [d.announcer, d.target],
    { by: infl, target: d.target, reason: d.reason, channel, format,
      ...(secret ? { secret: true } : {}), ...(inPerson ? { inPerson: true } : {}), ...mark }, [...state.active]);
  applyBlock(state, d.target, channel, channel === 'influencers' ? infl : [], announcement, { secret });
  // A super influencer delivers it in person, and that meeting is the visit
  // (US 1 Ep 10). A secret one is nobody the blocked player can go and ask.
  const visit = inPerson ? runVisit(state, rng, d.target, infl, { to: infl[0], inPerson: true })
    : runVisit(state, rng, d.target, secret ? [] : infl);
  state.pendingGoodbyes.push(d.target);
  return { target: d.target, hangout, announcement, visit };
}

// A visit that turns into an argument (user, 2026-10-02: "is it possible we
// have an argument during a visit?"). A blocked player who resents the
// Influencer who did it goes to have it out: how much they resent them, times
// how bold and how short-fused they are. A calm player still only wants
// answers; the same grudge in a hothead is a fight.
export const CONFRONT = { base: 2.2, heat: 1.0 };
export const heatOf = (state, h) => S(state, h, 'boldness') / 10 * (1.6 - S(state, h, 'temperament') / 10);
export function confrontWeight(state, h, c) {
  return CONFRONT.base + Math.max(0, rel(h, c, 'resentment')) * heatOf(state, h) * CONFRONT.heat;
}

// Who a blocked player goes to see (user, 2026-10-02: "why the visit is always
// someone that blocked you ... can they go see someone else like a flirt or
// friend or someone they're suspicious of?"). Every reason is weighed by the
// person: the strategic want answers, the social go to a friend, the bold to
// a crush, the sharp to the profile they never believed, the guilty to
// someone they wronged. Before this: 55% to an Influencer, 35% a friend, a
// suspect once in 237 visits, an apology never, a crush never.
export const VISIT_W = { friend: 1.0, crush: 0.62, answers: 2.4, truth: 1.8, apology: 1.6 };
export function chooseVisit(state, rng, h, blockers) {
  const guilt = mood(state, h, 'guilt') / 10 + (state.profiles[h]?.mode === 'catfish' ? 0.25 : 0);
  const st = k => S(state, h, k) / 10;
  return state.active.map(c => {
    const m = {
      friend: Math.max(0, rel(h, c, 'affection')) * (0.5 + st('social') * 0.5) * VISIT_W.friend,
      crush: attractionOk(state, h, c) ? Math.max(0, rel(h, c, 'attraction')) * (0.4 + st('boldness') * 0.6)
        * (rel(c, h, 'attraction') >= 3 ? 1.2 : 0.7) * VISIT_W.crush : 0,
      answers: blockers.includes(c) ? (Math.max(0, rel(h, c, 'resentment')) * 0.8 + VISIT_W.answers) * (0.6 + st('strategic') * 0.6) : 0,
      confront: blockers.includes(c) ? confrontWeight(state, h, c) : 0,
      truth: (1 - belief(state, h, c).real) * (2 + st('intuition') * 8) * VISIT_W.truth,
      apology: guilt * (Math.max(0, rel(h, c, 'affection')) + Math.max(0, rel(c, h, 'resentment')) * 0.8) * VISIT_W.apology,
      ...kinVisit(state, h, c),
    };
    const [motive, w] = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
    return { to: c, motive, w: w + rng() * 1.5 };
  }).sort((a, b) => b.w - a.w)[0];
}

export const REPORT_LIE = 1.2;

/**
 * The argument: how the visited Influencer meets it, and how it ends.
 *   fire    bold and short-fused: they give it right back, and it escalates
 *   take    guilty or even-tempered: they let the blocked player say it all
 *   defend  in between: they explain, and the two talk past each other
 * It ends with a walk-out (no hug) or cooled down (a hug at the door). The
 * style is a read of the host for the script; what it costs is proportional.
 */
export function clash(state, rng, h, to) {
  const fire = heatOf(state, to);
  const take = mood(state, to, 'guilt') / 10 + S(state, to, 'temperament') / 10 * 0.8;
  const style = fire > take + 0.2 ? 'fire' : take > fire + 0.2 ? 'take' : 'defend';
  const grudge = Math.max(0, rel(h, to, 'resentment')) / 10;
  const walk = clamp(0.25 + grudge * 0.4 + fire * 0.35 - take * 0.3, 0.05, 0.9);
  const end = rng() < walk ? 'walkout' : 'cooled';
  // The host comes out of it shaken, more so after a shouting match.
  feel(state, to, 'stress', 1 + fire * 1.5);
  feel(state, to, 'paranoia', 0.8);
  if (style === 'take') feel(state, to, 'guilt', 1.5);
  bump(h, to, 'resentment', end === 'walkout' ? 1.5 : -0.5);
  bump(to, h, 'resentment', fire * 1.5);
  if (end === 'cooled') { bump(h, to, 'affection', 0.8); bump(to, h, 'affection', 0.8); }
  return { style, end };
}

export function runVisit(state, rng, h, blockers, { to: forced = null, inPerson = false } = {}) {
  if (!state.active.length) return null;
  // A night with a power to give: they visit someone they trust, to hand it over.
  const power = !forced && state.nightPower;
  const friend = power && state.active.filter(c => !blockers.includes(c))
    .sort((x, y) => rel(h, y, 'affection') + rel(h, y, 'trust') - rel(h, x, 'affection') - rel(h, x, 'trust'))[0];
  const chosen = forced ? { to: forced, motive: 'answers' } : friend ? { to: friend, motive: 'power' } : chooseVisit(state, rng, h, blockers);
  const { to, motive } = chosen;
  const sc = addScene(state, 'visit', [h, to], { motive, kiss: false, handed: null, by: [...blockers],
    ...(inPerson ? { inPerson: true } : {}) });
  if (motive === 'confront') sc.data.clash = clash(state, rng, h, to);
  revealTo(state, to, h, sc);
  revealTo(state, h, to, sc);
  // A relative behind the door, and one of them didn't know (ci/kin.js).
  kinAtDoor(state, h, to, sc);
  if (friend) { handOver(state, rng, h, to, power, sc); state.nightPower = null; }
  const suspect = state.active.filter(o => o !== to).map(o => [o, belief(state, h, o).real])
    .sort((a, b) => a[1] - b[1])[0];
  if (suspect && suspect[1] < 0.5) {
    const c = makeClaim(state, { kind: 'catfish', holder: h, about: suspect[0],
      truth: state.profiles[suspect[0]].mode === 'catfish', by: h, to });
    learn(state, to, c, h, sc);
    sc.data.handed = c.id;
  }
  // A kiss at the door: both want it, and somebody who is taken holds back as
  // much as they are loyal (twotiming.js focusDamp). If they kiss anyway with a
  // partner in the building, it is cheating, and it can come out (noteKiss).
  // A couple sharing one profile never kisses at the door: the other one is standing right there.
  if (!sc.data.clash && !romanticPair(state, h) && !romanticPair(state, to) && attractionOk(state, h, to) && attractionOk(state, to, h)
    && rel(h, to, 'attraction') > 6 && rel(to, h, 'attraction') > 6
    && streamFor(state.seed, `kiss:${sc.id}`)() < focusDamp(state, h, to)) {
    sc.data.kiss = true;
    noteKiss(state, sc, h, to);
  }
  if (schemeEligible(state, to)
    && rng() < clamp(S(state, to, 'strategic') / 10 * (REPORT_LIE - S(state, to, 'loyalty') / 10), 0, 0.9)) {
    state.pendingReports.push({ by: to, blocked: h, day: state.day });
  }
  return sc;
}

export function deliverReports(state, rng) {
  for (const r of state.pendingReports.splice(0)) {
    if (!isActive(state, r.by)) continue;
    const rival = state.active.filter(o => o !== r.by)
      .map(o => [o, rel(r.by, o, 'resentment') + belief(state, r.by, o).threat * 0.5])
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    const allies = state.active.filter(o => o !== r.by && o !== rival)
      .map(o => [o, rel(r.by, o, 'affection')]).filter(([, a]) => a > 2)
      .sort((a, b) => b[1] - a[1]).slice(0, 2).map(([o]) => o);
    if (!rival || !allies.length) continue;
    for (const ally of allies) {
      const sc = addScene(state, 'report', [r.by, ally], { blocked: r.blocked, rival, claim: null });
      const c = makeClaim(state, { kind: 'visitSaid', holder: rival, about: ally,
        truth: rel(rival, ally, 'trust') < 0, by: r.by, to: ally });
      learn(state, ally, c, r.by, sc);
      sc.data.claim = c.id;
    }
  }
}

// A goodbye names a catfish only when the player leaving has a real theory
// (below the theory line); short of that it is a grievance, as most real
// goodbyes are ("the real snake was not taken out of the game", US 2). And
// the room hears a blocked player's parting shot as partly sour grapes. At a
// flat 0.5 line every goodbye accusation in 60 seasons (172 of 172) was
// right, and it was most of the doubt a catfish finalist carried.
export const SOUR_GRAPES = 0.6;
export function goodbyeVideo(state, rng, h) {
  const all = [...state.active];
  const sc = addScene(state, 'goodbye', [h], { mode: state.profiles[h].mode, warning: null }, all);
  for (const o of all) revealTo(state, o, h, sc);
  const top = all.map(o => [o, rel(h, o, 'resentment') + (1 - belief(state, h, o).real) * 3])
    .sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] > 3) {
    const o = top[0];
    // Played by them (twotiming.js): the goodbye says so, in front of everyone.
    const played = state.claims.some(x => x.kind === 'playing' && x.holder === o && state.know[h]?.[x.id]);
    const c = played
      ? makeClaim(state, { kind: 'playing', holder: o, about: o, truth: true, secrecy: 'public', by: h, weight: SOUR_GRAPES })
      : belief(state, h, o).real < THEORY_LINE
      ? makeClaim(state, { kind: 'catfish', holder: h, about: o, truth: state.profiles[o].mode === 'catfish', secrecy: 'public', by: h, weight: SOUR_GRAPES })
      : makeClaim(state, { kind: 'distrusts', holder: h, about: o, truth: rel(h, o, 'trust') < 0, secrecy: 'public', by: h, weight: SOUR_GRAPES });
    for (const x of all) if (x !== o) learn(state, x, c, h, sc);
    feel(state, o, 'paranoia', 2);
    feel(state, o, 'stress', 2);
    sc.data.warning = { about: o, kind: c.kind, claim: c.id };
  }
  const b = state.blocked.find(x => x.handle === h);
  if (b && state.profiles[h].mode !== 'catfish') for (const i of b.by) if (isActive(state, i)) feel(state, i, 'guilt', 1.5);
  // A word for a relative still in (ci/kin.js).
  const kg = kinGoodbye(state, h, b?.by || [], sc);
  if (kg) sc.data.kin = kg;
  return sc;
}
