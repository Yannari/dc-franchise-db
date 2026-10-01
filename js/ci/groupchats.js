// ══════════════════════════════════════════════════════════════════════
// ci/groupchats.js — the group chats that are not alliances
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-10-01): "I feel there's not enough group chat. Is it normal, or
// a symptom of a lack of strategic gameplay?" Before this every group chat
// was an alliance's. The transcripts have three more kinds:
//
//   squad   a friend group, named by whoever opens it: "start a group chat
//           with the girls only. I would like to call it the Skinny Queens"
//           (1x01), "Momma's Boys" (1x03), "Girls Just Wanna Have Fun"
//           (2x01), "my homies, as we are by far the funniest people here"
//           (3x02). Closer, and the gossip goes round.
//   peace   somebody both sides like brings two feuding players into one
//           chat: "Circle, open a group chat with Olivia and Lauren. This
//           is sticky" (6x12). It cools the feud, or blows it up.
//   plan    before the ratings, a strategic player gathers two people:
//           "It's game time" (2x12); "I need to make sure I'm on their good
//           side" (3x12). They agree who goes to the bottom, and whoever
//           says no now knows there is a plan.
//
// Every one is a scene with consequences; all proportional (stats scale the
// chances and the outcomes, never a threshold on a stat).
import { rel, bump, S, clamp, addScene } from './state.js';
import { feel } from './mind.js';
import { belief } from './beliefs.js';
import { makeClaim, learn, passOnWeight } from './claims.js';
import { allied } from './alliances.js';

export const SQUAD_CHANCE = 0.22;   // a day on which a friend group is started (early days more)
export const PEACE_CHANCE = 0.45;   // a day on which a feud gets a peacemaker, if it has one
export const PLAN_CHANCE = 0.5;     // a ratings day on which a strategist gathers people
export const FEUD_AT = 3;           // resentment one way that makes two players a feud

// What friend groups call themselves (jokes and in-jokes, like the show's).
const SQUAD_NAMES = {
  female: ['The Girls', 'Girls Just Wanna Have Fun', 'Queens Only', 'The Glam Squad', 'Sisterhood', 'The Besties', 'Hot Girl Chat'],
  male: ['The Guys', 'The Boys', 'Bros Only', 'The Homies', 'Dudes Night', 'The Wolf Pack', 'Gym Buddies'],
  any: ['The Funny Ones', 'Breakfast Club', 'Good Vibes Only', 'Late Night Crew', 'The Couch Potatoes', 'The Main Characters'],
};

const bond = (state, a, b) => rel(a, b, 'trust') + rel(a, b, 'affection');
const genderOf = (state, h) => state.profiles[h]?.shown?.gender;
const pickW = (rng, list, w) => {
  const tot = list.reduce((n, x) => n + Math.max(0, w(x)), 0);
  if (!tot) return null;
  let r = rng() * tot;
  for (const x of list) if ((r -= Math.max(0, w(x))) <= 0) return x;
  return list.at(-1);
};

/** A friend group, named by whoever starts it. */
export function squadChat(state, rng) {
  if (state.active.length < 5) return null;
  const early = state.day <= 4 ? 1.5 : 0.6;
  if (rng() >= SQUAD_CHANCE * early) return null;
  const options = state.active.map(f => {
    // The same-profile-gender friends they like most; a mixed group otherwise.
    const g = genderOf(state, f);
    const liked = state.active.filter(o => o !== f && rel(f, o, 'affection') > 1).sort((a, b) => rel(f, b, 'affection') - rel(f, a, 'affection'));
    const same = liked.filter(o => genderOf(state, o) === g);
    const gendered = g === 'f' || g === 'm';
    const pick = (same.length >= 2 && gendered ? same : liked).slice(0, rng() < 0.5 ? 2 : 3);
    return { f, pick, kind: gendered && pick.every(o => genderOf(state, o) === g) ? (g === 'f' ? 'female' : 'male') : 'any',
      w: S(state, f, 'social') / 10 * pick.reduce((n, o) => n + rel(f, o, 'affection'), 0) };
  }).filter(o => o.pick.length >= 2 && !(state.squads || []).some(s => s.members.includes(o.f) && o.pick.every(p => s.members.includes(p))));
  const o = pickW(rng, options, x => x.w);
  if (!o) return null;
  const used = new Set((state.squads || []).map(s => s.name));
  const pool = SQUAD_NAMES[o.kind].filter(n => !used.has(n));
  const name = (pool.length ? pool : SQUAD_NAMES.any)[Math.floor(rng() * (pool.length || SQUAD_NAMES.any.length))];
  const members = [o.f, ...o.pick];
  (state.squads ||= []).push({ name, members, day: state.day });
  for (const a of members) { feel(state, a, 'loneliness', -1); for (const b of members) if (a !== b) bump(a, b, 'affection', 0.6); }
  const sc = addScene(state, 'group-chat', members, { name, squad: true, event: 'squad', shared: [] }, members);
  // The gossip goes round: each passes on the juiciest thing the others haven't heard.
  for (const x of members) {
    const best = state.claims.filter(c => state.know[x]?.[c.id] && !members.includes(c.about))
      .map(c => [c, Math.max(...members.filter(y => y !== x).map(y => passOnWeight(state, x, c, y)))]).sort((p, q) => q[1] - p[1])[0];
    if (!best || best[1] < 0.3) continue;
    for (const y of members) if (y !== x) learn(state, y, best[0], x, sc);
    sc.data.shared.push({ by: x, about: best[0].about });
    break;
  }
  return sc;
}

/** Two players who resent each other, brought into one chat by someone they both like. */
export function peaceChat(state, rng) {
  const act = state.active;
  const feuds = [];
  for (const x of act) for (const y of act) {
    if (x >= y) continue;
    const heat = Math.max(rel(x, y, 'resentment'), rel(y, x, 'resentment'));
    if (heat >= FEUD_AT && !(state.peace || []).some(p => p.pair.includes(x) && p.pair.includes(y) && state.day - p.day < 4)) feuds.push({ x, y, heat });
  }
  if (!feuds.length || rng() >= PEACE_CHANCE) return null;
  const feud = feuds.sort((a, b) => b.heat - a.heat)[0];
  const { x, y, heat } = feud;
  // The peacemaker: liked by both and liking both; the warmer and steadier, the likelier.
  const m = pickW(rng, act.filter(h => h !== x && h !== y && rel(h, x, 'affection') > 0.5 && rel(h, y, 'affection') > 0.5
    && rel(x, h, 'affection') > -0.5 && rel(y, h, 'affection') > -0.5),
  h => (S(state, h, 'social') + S(state, h, 'temperament')) / 20 * (rel(h, x, 'affection') + rel(h, y, 'affection')));
  if (!m) return null;
  const calm = (S(state, x, 'temperament') + S(state, y, 'temperament')) / 40;
  const pWarm = clamp(0.15 + calm * 0.5 + S(state, m, 'social') / 40 - (heat - FEUD_AT) / 12, 0.1, 0.8);
  const pCold = clamp(0.35 - calm * 0.3, 0.08, 0.5);
  const r = rng();
  const ending = r < pWarm ? 'warm' : r < pWarm + pCold ? 'cold' : 'neutral';
  if (ending === 'warm') {
    for (const [a, b] of [[x, y], [y, x]]) { bump(a, b, 'resentment', -2); bump(a, b, 'trust', 0.5); bump(a, m, 'affection', 1); bump(a, m, 'obligation', 0.5); }
    feel(state, m, 'elation', 1);
  } else if (ending === 'neutral') {
    for (const [a, b] of [[x, y], [y, x]]) { bump(a, b, 'resentment', -0.6); bump(a, m, 'affection', 0.3); }
  } else {
    for (const [a, b] of [[x, y], [y, x]]) bump(a, b, 'resentment', 1);
    // Whoever started it holds it against the one who set them up.
    const sorer = rel(x, y, 'resentment') >= rel(y, x, 'resentment') ? x : y;
    bump(sorer, m, 'resentment', 0.6);
    feel(state, m, 'stress', 1);
  }
  (state.peace ||= []).push({ pair: [x, y], by: m, day: state.day, ending });
  return addScene(state, 'group-chat', [m, x, y], { name: null, event: 'peace', mediator: m, pair: [x, y], ending }, [m, x, y]);
}

/** Before the ratings: a strategist gathers two people and names who goes to the bottom. */
export function planChat(state, rng) {
  const act = state.active;
  if (act.length < 6) return null;
  // Who is likeliest to: the strategic, with people they trust outside their alliances.
  const options = act.map(f => {
    // People they trust, and who don't hold a grudge either way (no plan with yesterday's feud).
    const asked = act.filter(o => o !== f && !allied(state, f, o) && bond(state, f, o) > 2
      && rel(f, o, 'resentment') < 2.5 && rel(o, f, 'resentment') < 2.5)
      .sort((a, b) => bond(state, f, b) - bond(state, f, a)).slice(0, 2);
    return { f, asked, w: (S(state, f, 'strategic') / 10) ** 2 };
  }).filter(o => o.asked.length === 2);
  if (!options.length || rng() >= PLAN_CHANCE) return null;
  const o = pickW(rng, options, x => x.w);
  if (!o) return null;
  const { f, asked } = o;
  // The one they want gone: resented and feared, and not in the chat.
  const target = act.filter(t => t !== f && !asked.includes(t))
    .map(t => [t, rel(f, t, 'resentment') + belief(state, f, t).threat * 0.5 - rel(f, t, 'affection') * 0.3])
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!target) return null;
  const agreed = [], declined = [];
  for (const a of asked) {
    const p = clamp(0.42 + bond(state, a, f) / 20 - rel(a, target, 'affection') / 12 + rel(a, target, 'resentment') / 15
      + S(state, a, 'strategic') / 40, 0.05, 0.92);
    (rng() < p ? agreed : declined).push(a);
  }
  const sc = addScene(state, 'group-chat', [f, ...asked], { name: null, event: 'plan', by: f, target, agreed, declined }, [f, ...asked]);
  if (agreed.length) {
    (state.ratingPlans ||= []).push({ members: [f, ...agreed], target, day: state.day });
    for (const a of agreed) { bump(a, f, 'trust', 0.6); bump(f, a, 'trust', 0.6); }
  }
  // Whoever said no now knows the plan, and may pass it on (to the target, even).
  const c = makeClaim(state, { kind: 'targeting', holder: f, about: target, truth: true, by: f });
  for (const d of declined) { learn(state, d, c, f, sc); bump(f, d, 'trust', -0.5); }
  return sc;
}

/** Is `voter` in a group-chat plan against `target` made today or yesterday? (ratings.js) */
export function inPlanAgainst(state, voter, target) {
  return (state.ratingPlans || []).some(p => p.target === target && p.members.includes(voter) && state.day - p.day <= 1);
}

/** The day's group chats that are not an alliance's (season.js). */
export function groupChats(state, rng, { ratingSoon = false } = {}) {
  squadChat(state, rng);
  peaceChat(state, rng);
  if (ratingSoon) planChat(state, rng);
}
