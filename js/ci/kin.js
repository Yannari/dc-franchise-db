// ══════════════════════════════════════════════════════════════════════
// ci/kin.js — family, partners and old friends in the same season
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-10-02): "how does it work when the new player is in the family
// or friends of one of the players, do we have special conversations, and if
// hid behind a profile?" Before this, two separate players who were sisters,
// exes or best friends never knew it.
//
// Who is what to whom comes from the franchise (the cast's Relationships tab,
// the roster's ties, life after the show: ci-run.js passes it as `kin`, by
// person). Each pair:
//   open      a profile with their own face: recognised at a glance, the day
//             both are in. Then they choose: keep it secret (a quiet pact) or
//             tell their friends (and the room starts to see a bloc).
//   hidden    behind a catfish: the more they have chatted and the better
//             they know each other, the likelier the relative clocks it ("I'd
//             know that laugh anywhere"), then tests them in a chat with
//             something only family would know. The catfish owns up or dodges.
//   tense     exes, estranged family, ex-best-friends: recognised the same
//             way, and it is a grudge, not a pact.
//   blocked   the one leaving speaks to their relative in the goodbye video,
//             and the relative takes it out on whoever blocked them.
//   visit     a blocked player can go to their relative; one who didn't know
//             finds out at the door.
// Proportional throughout: closeness and stats scale every chance and cost.
import { rel, bump, S, clamp, addScene, makePact } from './state.js';
import { setBelief, nudgeBelief } from './beliefs.js';
import { feel } from './mind.js';
import { makeClaim, learn } from './claims.js';

// How well they know each other (recognising them, protecting them).
export const KIN = {
  twins: 1, siblings: 0.9, 'step-siblings': 0.7, 'parent-child': 0.9, grandparent: 0.6, 'aunt-uncle': 0.5, cousins: 0.6, 'in-laws': 0.4,
  married: 0.95, engaged: 0.9, partners: 0.9, dating: 0.8,
  'best-friends': 0.85, 'childhood-friends': 0.75, 'old-friends': 0.5, roommates: 0.6, colleagues: 0.35, teammates: 0.35,
  estranged: 0.6, exes: 0.8, 'ex-friends': 0.7,
};
export const TENSE = new Set(['estranged', 'exes', 'ex-friends']);
export const TOGETHER = new Set(['married', 'engaged', 'partners', 'dating']);
const FAMILY = new Set(['twins', 'siblings', 'step-siblings', 'parent-child', 'grandparent', 'aunt-uncle', 'cousins', 'in-laws']);
export const kinGroup = k => (TENSE.has(k) ? 'tense' : TOGETHER.has(k) ? 'together' : FAMILY.has(k) ? 'family' : 'friends');

export const KIN_SPOT = 0.35;        // a day's chance to clock a relative behind a catfish, at most
export const KIN_VISIT = 9;          // how strongly a blocked player goes to a relative they know is in
export const KIN_ADMIT = 0.75;       // how readily a catfish owns up to family who has clocked them

const peopleIn = (state, h) => state.profiles[h]?.players || [];
/** What the people behind two profiles are to each other, or null. */
export function kinBetween(state, h1, h2) {
  if (h1 === h2) return null;
  for (const e of state.kin || []) {
    for (const [x, y] of [[e.a, e.b], [e.b, e.a]]) {
      if (peopleIn(state, h1).includes(x) && peopleIn(state, h2).includes(y) && KIN[e.kin] != null) return { kin: e.kin, me: x, them: y };
    }
  }
  return null;
}
export const knowsKin = (state, obs, h) => !!state.kinKnown?.[obs]?.[h];

/** What `me` calls `them`: "sister", "best friend", "ex" (the lines' {q}). */
export function kinWord(state, kin, me, them) {
  return kinWordOf(kin, state.people[me] || {}, state.people[them] || {});
}
/** The same word from two people's gender and age (a catfish face is not in the cast). */
export function kinWordOf(kin, q = {}, p = {}) {
  const g = p.gender, older = (p.age ?? 0) > (q.age ?? 0);
  const by = (f, m, n) => (g === 'f' ? f : g === 'm' ? m : n);
  switch (kin) {
    case 'twins': return by('twin sister', 'twin brother', 'twin');
    case 'siblings': return by('sister', 'brother', 'sibling');
    case 'step-siblings': return by('stepsister', 'stepbrother', 'stepsibling');
    case 'parent-child': return older ? by('mom', 'dad', 'parent') : by('daughter', 'son', 'kid');
    case 'grandparent': return older ? by('grandma', 'grandpa', 'grandparent') : by('granddaughter', 'grandson', 'grandkid');
    case 'aunt-uncle': return older ? by('aunt', 'uncle', 'aunt') : by('niece', 'nephew', 'niece');
    case 'cousins': return 'cousin';
    case 'in-laws': return by('sister-in-law', 'brother-in-law', 'in-law');
    case 'married': return by('wife', 'husband', 'spouse');
    case 'engaged': return by('fiancée', 'fiancé', 'fiancé');
    case 'partners': return 'partner';
    case 'dating': return by('girlfriend', 'boyfriend', 'partner');
    case 'best-friends': return 'best friend';
    case 'childhood-friends': return 'oldest friend';
    case 'old-friends': return 'friend';
    case 'roommates': return 'old roommate';
    case 'colleagues': return 'coworker';
    case 'teammates': return 'teammate';
    case 'estranged': return 'family';
    case 'exes': return 'ex';
    case 'ex-friends': return 'ex-best friend';
    default: return 'friend';
  }
}

/** Shows their own face: a relative knows it at a glance. */
const openFace = (state, h) => state.profiles[h]?.mode !== 'catfish';
const chatsBetween = (state, a, b) => state.scenes.filter(s => s.kind === 'chat' && s.who.includes(a) && s.who.includes(b)).length;

function know(state, obs, h, sc) {
  ((state.kinKnown ||= {})[obs] ||= {})[h] = state.day;
  const k = kinBetween(state, obs, h);
  const c = KIN[k.kin];
  setBelief(state, obs, h, 'real', openFace(state, h) ? 1 : 0.05, sc);
  if (!openFace(state, h)) setBelief(state, obs, h, 'guessOf', k.them, sc);
  if (TENSE.has(k.kin)) { bump(obs, h, 'resentment', 2 * c); bump(obs, h, 'trust', -2 * c); }
  else { bump(obs, h, 'affection', 3 * c); bump(obs, h, 'trust', 3 * c); }
  feel(state, obs, 'loneliness', -1);
}

/**
 * Each day: relatives recognise each other. An open face at once, the day
 * both are in (one scene for the pair); a catfish slowly, the more they talk.
 */
export function kinRecognise(state, rng) {
  if (!(state.kin || []).length) return [];
  const out = [];
  const act = state.active;
  for (const obs of act) for (const h of act) {
    if (obs === h || knowsKin(state, obs, h)) continue;
    const k = kinBetween(state, obs, h);
    if (!k) continue;
    const c = KIN[k.kin];
    if (openFace(state, h)) {
      const mutual = openFace(state, obs) && !knowsKin(state, h, obs);
      const sc = addScene(state, 'recognise', mutual ? [obs, h] : [obs], { profile: h, kin: k.kin, group: kinGroup(k.kin), mutual }, mutual ? [obs, h] : [obs]);
      know(state, obs, h, sc);
      if (mutual) { know(state, h, obs, sc); out.push(pactOrTell(state, rng, obs, h)); }
      continue;
    }
    // Behind someone else's face: the more they have talked, the likelier.
    const talked = clamp(chatsBetween(state, obs, h) / 3, 0, 1);
    if (rng() >= KIN_SPOT * c * (S(state, obs, 'intuition') / 10) * (0.25 + talked)) continue;
    const sc = addScene(state, 'recognise', [obs], { profile: h, kin: k.kin, group: kinGroup(k.kin), hidden: true }, [obs]);
    know(state, obs, h, sc);
    out.push(kinTest(state, rng, obs, h));
  }
  return out.filter(Boolean);
}

/**
 * Two who know each other in the open: a quiet pact (protect each other in
 * the ratings) or tell their friends (who then see a bloc). Strategists keep
 * it quiet. A grudge is neither: they keep their distance.
 */
function pactOrTell(state, rng, a, b) {
  const k = kinBetween(state, a, b);
  if (TENSE.has(k.kin)) return null;
  const strat = (S(state, a, 'strategic') + S(state, b, 'strategic')) / 20;
  const tell = rng() < clamp(0.75 - strat * 0.7, 0.1, 0.8);
  const sc = addScene(state, 'chat', [a, b], { intent: 'kin', ending: 'warm', kin: k.kin, outcome: tell ? 'tell' : 'secret', turns: [], claims: [], pact: null });
  sc.data.pact = makePact(state, 'protect', a, b);
  if (tell) {
    // Each tells the friend they trust most; from there it is gossip.
    const toldTo = [];
    for (const [x, y] of [[a, b], [b, a]]) {
      // Each tells their own most trusted friend (not the one the other already told).
      const friend = state.active.filter(o => o !== a && o !== b && !toldTo.includes(o)).sort((p, q) => rel(x, q, 'trust') - rel(x, p, 'trust'))[0];
      if (friend) toldTo.push(friend);
      if (!friend) continue;
      // Told in a chat of its own: the friend only knows what they were told, where.
      const told = addScene(state, 'chat', [x, friend], { intent: 'kintold', ending: 'warm', about: y, turns: [], claims: [], pact: null });
      const cl = makeClaim(state, { kind: 'ally', holder: x, about: y, truth: true, by: x, to: friend });
      learn(state, friend, cl, x, told); told.data.claims.push(cl.id);
    }
  }
  return sc;
}

/**
 * A relative clocked behind a catfish: they test them with something only
 * family (or an old friend) would know. A loyal, warm relative owns up and
 * they team up; a strategic one dodges — and the one asking still knows.
 */
function kinTest(state, rng, obs, h) {
  const k = kinBetween(state, obs, h);
  const tense = TENSE.has(k.kin);
  const admit = !tense && rng() < KIN_ADMIT * (0.4 + S(state, h, 'loyalty') / 10 * 0.6) * (1.2 - S(state, h, 'strategic') / 10 * 0.5);
  const sc = addScene(state, 'chat', [obs, h], { intent: 'kintest', ending: admit ? 'warm' : 'neutral', kin: k.kin, outcome: admit ? 'admit' : 'dodge',
    turns: [], claims: [], pact: null });
  if (admit) { know(state, h, obs, sc); sc.data.pact = makePact(state, 'protect', obs, h); }
  else feel(state, h, 'paranoia', 1.2);
  return sc;
}

/** The visit (blocking.js chooseVisit): going to a relative they know is still in. */
export function kinVisit(state, h, c) {
  const k = knowsKin(state, h, c) && kinBetween(state, h, c);
  if (!k || TENSE.has(k.kin)) return {};
  return { family: KIN[k.kin] * KIN_VISIT };
}

/** The goodbye video (blocking.js): who it speaks to, and what it costs whoever blocked them. */
export function kinGoodbye(state, h, blockers = [], sc = null) {
  // (A profile swap can move who is behind a handle: only a relation that still holds.)
  const to = state.active.filter(o => knowsKin(state, h, o) && kinBetween(state, h, o) && !TENSE.has(kinBetween(state, h, o).kin))
    .sort((x, y) => KIN[kinBetween(state, h, y).kin] - KIN[kinBetween(state, h, x).kin])[0];
  if (!to) return null;
  const k = kinBetween(state, h, to);
  // The one still in, if they knew too, takes it out on whoever did it.
  if (knowsKin(state, to, h)) for (const b of blockers) if (state.active.includes(b) && b !== to) bump(to, b, 'resentment', 2 * KIN[k.kin]);
  feel(state, to, 'stress', 1);
  // Said out loud in the video, the whole room now knows they had somebody: a bigger threat.
  if (openFace(state, to)) for (const o of state.active) if (o !== to) nudgeBelief(state, o, to, 'threat', 0.4 * KIN[k.kin], sc);
  return { to, kin: k.kin, open: openFace(state, to) };
}

/** A relative at the door who did not know (blocking.js runVisit, after the reveal). */
export function kinAtDoor(state, h, to, sc) {
  const out = [];
  for (const [x, y] of [[h, to], [to, h]]) {
    if (!kinBetween(state, x, y) || knowsKin(state, x, y)) continue;
    know(state, x, y, sc);
    out.push(x);
  }
  if (out.length) sc.data.kinDoor = { kin: kinBetween(state, h, to).kin, surprised: out };
  return out;
}

/** How taken by someone else in the cast (twotiming.js): married, engaged, partners 1; dating 0.8. */
export function togetherInCast(state, h) {
  let t = 0;
  for (const e of state.kin || []) if (TOGETHER.has(e.kin) && peopleIn(state, h).some(n => n === e.a || n === e.b)) t = Math.max(t, e.kin === 'dating' ? 0.8 : 1);
  return t;
}
/** The profiles of the people this player is together with, in the cast (blocked or not). */
export function partnersOf(state, h) {
  const out = [];
  for (const e of state.kin || []) {
    if (!TOGETHER.has(e.kin)) continue;
    for (const [x, y] of [[e.a, e.b], [e.b, e.a]]) if (peopleIn(state, h).includes(x) && state.handleOf[y] && state.handleOf[y] !== h) out.push(state.handleOf[y]);
  }
  return [...new Set(out)];
}
