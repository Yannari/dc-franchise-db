// ══════════════════════════════════════════════════════════════════════
// ci/chat.js — who opens a chat with whom, and why (spec §7.3)
// ══════════════════════════════════════════════════════════════════════
//
// Every reason on this list is one the real players had, with its example in
// the spec. A player's day has a small budget of chats; they spend it where
// their feelings, their beliefs and their mood point. Who you reach out to —
// and who does not reach out to you — is itself news (US 1 Ep 2: "Antonio
// didn't even bring up anything about last night. They're jerks.").
import { rel, bump, S, clamp, isActive, schemeEligible } from './state.js';
import { belief } from './beliefs.js';
import { mood } from './mind.js';
import { contradictions } from './claims.js';
import { isPair, SHARED_PACE } from './shared.js';

export const INTENTS = ['bond', 'ally', 'flirt', 'probe', 'pump', 'compare', 'plant', 'credit',
  'repair', 'confront', 'checkin', 'pitch', 'confess', 'jealous'];
export const SPARK = 6;
// A persona is chosen to be liked: "online, hot girls get more likes" (US 1
// Ep 1, Seaburn on why he played Rebecca). Catfish draw first sparks higher.
export const PERSONA_APPEAL = 1.4;

export function attractionOk(state, me, you) {
  const t = state.people[state.profiles[me].players[0]];
  // The AI cannot flirt (US 6): it has no attraction to anyone.
  if (t.ai) return false;
  const g = state.profiles[you].shown.gender;
  if (t.sexuality === 'bi') return true;
  if (t.sexuality === 'gay') return g === t.gender;
  return g !== t.gender;
}

// A profile shows an orientation: a persona's, or the player's own. Who a
// person is DRAWN to stays with the real person (attractionOk); the profile's
// orientation decides who looks like they would be into you, and who a
// catfish flirts with in character.
const into = (sexuality, own, other) => sexuality === 'bi' || (sexuality === 'gay' ? own === other : own !== other);
/** Does `you`'s profile look like it would be into `me`'s profile? */
export function wouldReturn(state, me, you) {
  const m = state.profiles[me]?.shown, y = state.profiles[you]?.shown;
  if (!m || !y) return true;
  return into(y.sexuality || 'straight', y.gender, m.gender);
}
/** Would the profile `me` shows (for a catfish, the character) be into `you`? */
export function personaInto(state, me, you) {
  const m = state.profiles[me]?.shown, y = state.profiles[you]?.shown;
  if (!m || !y) return true;
  return into(m.sexuality || 'straight', m.gender, y.gender);
}
// Flirting with a profile that is not into you: rarely worth it.
export const CHASE_OFF = 0.35;
// A catfish flirting against the persona's orientation breaks character.
export const OUT_OF_CHARACTER = 0.3;
// A catfish flirting in character with someone who likes the persona, with no
// real attraction: strategy (Seaburn as "Rebecca", US 1).
export const PERFORMED = 0.8;
/** A flirt a catfish performs as the persona, with no attraction behind it. */
export const performedFlirt = (state, me, you) => state.profiles[me]?.mode === 'catfish'
  && !attractionOk(state, me, you) && personaInto(state, me, you);

/** First sparks: every compatible pair gets 0..SPARK attraction, one way at a time. */
export function seedAttraction(state, rng) {
  const all = Object.keys(state.profiles);
  for (const a of all) for (const b of all) {
    if (a !== b && attractionOk(state, a, b)) {
      bump(a, b, 'attraction', rng() * SPARK * (state.profiles[b].mode === 'catfish' ? PERSONA_APPEAL : 1));
    }
  }
}

export function utilities(state, me, you, ctx = {}, who = null) {
  // Two people want different chats; the one who wants it more pushes it.
  if (!who && isPair(state, me)) {
    const each = state.profiles[me].players.map(n => utilities(state, me, you, ctx, n));
    return Object.fromEntries(Object.keys(each[0]).map(k => [k, Math.max(...each.map(u => u[k]))]));
  }
  const aff = rel(me, you, 'affection'), tr = rel(me, you, 'trust'), res = rel(me, you, 'resentment');
  const att = rel(me, you, 'attraction');
  const b = belief(state, me, you);
  const st = k => S(state, me, k, { who }) / 10;
  const lonely = mood(state, me, 'loneliness') / 10, para = mood(state, me, 'paranoia') / 10;
  const guilt = mood(state, me, 'guilt') / 10;
  const catfish = state.profiles[me].mode === 'catfish';
  return {
    bond: st('social') * (1 - Math.abs(aff) / 10) + lonely * 0.25,
    ally: aff > 0 && tr > 0 ? st('strategic') * (aff + tr) / 8 : 0,
    flirt: Math.max(
      (attractionOk(state, me, you) ? att / 10 * (0.5 + st('boldness') * 0.5) : 0)
        * (wouldReturn(state, me, you) ? 1 : CHASE_OFF) * (catfish && !personaInto(state, me, you) ? OUT_OF_CHARACTER : 1),
      performedFlirt(state, me, you) && !state.people[state.profiles[me].players[0]]?.ai
        ? rel(you, me, 'attraction') / 10 * st('strategic') * PERFORMED * (wouldReturn(state, me, you) ? 1 : CHASE_OFF) : 0),
    probe: (1 - b.real) * st('intuition') * (1 + para),
    pump: ctx.newsOf?.includes(you) ? st('strategic') * 0.8 : 0,
    compare: ctx.contradictionWith?.[me]?.[you] ? 1.5 : 0,
    plant: schemeEligible(state, me) && ctx.rivalOf?.[me] && ctx.rivalOf[me] !== you
      ? st('strategic') * (aff + 10) / 20 : 0,
    // Claiming credit you did not earn is manipulation: a nice player only
    // says "I had your back" when it is true (spec §4.4).
    credit: ctx.creditable?.[me]?.includes(you)
      && (schemeEligible(state, me) || ctx.protectedBy?.[you]?.includes(me)) ? 1 - st('loyalty') : 0,
    repair: b.likesMe < -2 ? st('temperament') * 0.8 : 0,
    confront: res > 4 ? st('boldness') * res / 10 : 0,
    checkin: ctx.hurting?.includes(you) && aff > 2 ? st('social') : 0,
    pitch: ctx.ratingSoon && aff > 3 ? st('strategic') : 0,
    confess: catfish && aff > 5 ? guilt * st('loyalty') : 0,
    // The morning after watching the crush flirt with somebody else at the
    // party (party.js jealous): the bolder, and the bigger the crush, the more
    // they need to ask.
    jealous: ctx.jealousOf?.[me]?.of === you ? (0.5 + st('boldness') * 0.7) * (0.4 + att / 10) : 0,
  };
}

export function planChats(state, rng, ctx) {
  const plans = [];
  const order = state.active.map(h => [h, rng()]).sort((a, b) => a[1] - b[1]).map(([h]) => h);
  for (const me of order) {
    let budget = clamp(Math.round(1 + S(state, me, 'social') / 4 - mood(state, me, 'stress') / 6), 1, 4);
    // Every message is an argument: a shared profile is slow.
    if (isPair(state, me)) budget = Math.max(1, Math.round(budget * SHARED_PACE - 0.01));
    const options = [];
    for (const you of state.active) {
      if (you === me) continue;
      const u = utilities(state, me, you, ctx);
      const [intent, w] = Object.entries(u).sort((a, b) => b[1] - a[1])[0];
      if (w > 0) options.push({ from: me, to: you, intent, w: w * (0.7 + 0.6 * rng()) });
    }
    options.sort((a, b) => b.w - a.w);
    for (const o of options.slice(0, budget)) plans.push({ from: o.from, to: o.to, intent: o.intent });
  }
  return plans;
}

/** What each player can act on today, built only from what happened yesterday. */
export function contextFor(state, day) {
  const y = state.day - 1;
  const live = h => isActive(state, h);
  const lastRating = [...state.ratings].reverse().find(r => r.day === y && !r.final);
  const hurting = lastRating ? lastRating.results.slice(-3).map(r => r.profile).filter(live) : [];
  const newsOf = [...new Set([
    ...state.scenes.filter(s => s.day === y && s.kind === 'visit').flatMap(s => s.who),
    ...(lastRating?.influencers || []),
  ])].filter(live);
  // Who watched their crush flirt with somebody else yesterday (party.js).
  const jealousOf = {};
  for (const j of state.jealous || []) if (j.day === y && live(j.by) && live(j.of)) jealousOf[j.by] = { of: j.of, rival: j.rival };
  const creditable = {}, protectedBy = {};
  const hang = state.scenes.find(s => s.day === y && s.kind === 'hangout');
  if (hang?.data?.views) {
    for (const i of hang.who) creditable[i] = hang.data.atRisk.filter(live);
    for (const i of hang.who) {
      const scores = hang.data.views.map(v => v.by[i]).sort((a, b) => a - b);
      const median = scores[scores.length >> 1];
      for (const v of hang.data.views) if (v.by[i] < median) (protectedBy[v.handle] ||= []).push(i);
    }
  }
  const rivalOf = {};
  for (const h of state.active) {
    let best = null, top = 3;
    for (const o of state.active) {
      if (o === h) continue;
      const score = rel(h, o, 'resentment') + belief(state, h, o).threat * 0.5;
      if (score > top) { top = score; best = o; }
    }
    rivalOf[h] = best;
  }
  const contradictionWith = {};
  for (const h of state.active) {
    for (const { a, b } of contradictions(state, h)) {
      const other = [a.origin.by, b.origin.by].find(x => x !== h && live(x));
      if (other) (contradictionWith[h] ||= {})[other] = true;
    }
  }
  return { day: day?.day ?? day, ratingSoon: !!(day?.block || day?.final), party: false,
    hurting, newsOf, creditable, protectedBy, rivalOf, contradictionWith, jealousOf };
}
