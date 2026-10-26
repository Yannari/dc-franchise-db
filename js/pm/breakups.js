// ══════════════════════════════════════════════════════════════════════
// pm/breakups.js — every break-up: why, how fair, how it was taken, after
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-26: "stay as friends is often the decision of one person,
// it doesn't mean it was consensual and the person on the receiving end took
// it well; jealousy could still be there, especially if it's recent, and the
// public could take the side of the one being dumped or not, depending on
// whether it's a justified break-up or a selfish one. Do that for all
// break-ups, and not all of them should be friendly: cheating, 'I don't want
// to be in a triangle', 'you're playing me'."
//
// recordSplit is called wherever a couple ends (threads.js doubt-end,
// events.js haveItOut, movie-night.js, casa.js, moments.js recoupling,
// triangle.js, game.js, arrivals.js stand-up). It weighs:
//   fair    what each of them did, in proportion: the one left cheated or was
//           playing (fair); the one ending it had closed off, said "I love
//           you", or is leaving for somebody else (selfish)
//   mood    how it lands, drawn in proportion to what the one left still
//           feels, their temper and the cause: friends · hurt · bitter
//   holder  who still has the feelings
// and the record (just-friends.js) decides what follows: who is taken, who is
// jealous of whom, which scenes the two of them get, the public's verdict.
import { splitRecords, setSplit, exOf, rawness } from './just-friends.js';
import { romance } from './feelings.js';
import { feel, jealousOf } from './emotions.js';
import { closedness } from './ladder.js';
import { addBond } from '../bonds.js';
import { addRelationshipDimension } from '../relationships.js';
import { streamFor } from '../dr/rng.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const T = (state, n) => (state.profiles[n]?.stats?.temperament ?? 5) / 10;
function weighted(rng, opts) {
  const live = opts.filter(([, w]) => w > 0);
  const total = live.reduce((t, [, w]) => t + w, 0);
  let r = rng() * total;
  for (const [v, w] of live) { r -= w; if (r <= 0) return v; }
  return live.length ? live[live.length - 1][0] : opts[0][0];
}

// How fair a cause is before anything else is weighed (0 selfish .. 1 fair).
const BASE_FAIR = { cooling: 0.55, clash: 0.6, triangle: 0.7, played: 0.85, cheated: 0.9, 'moved-on': 0.3 };
// The causes that come with somebody wronged: these rarely end calmly.
const HEATED = new Set(['cheated', 'played', 'moved-on']);
export const SPLIT_CAUSES = Object.keys(BASE_FAIR);

/** What one did to the other that the other knows about: their known secrets, in severity. */
const knownWrong = (state, who, to) => (state.secrets || []).filter(s => s.known && s.who === who && s.partner === to)
  .reduce((t, s) => t + (s.severity || 1), 0);

/**
 * A couple ends. {by} ended it (or walked away from it), {left} was left;
 * `about` is the somebody else in it, if there is one (who {by} left for,
 * who {left} cheated with). Returns the record; it draws on its own dice,
 * so no other draw in the episode moves.
 */
export function recordSplit(state, { by, left, cause, about = null }) {
  if (!by || !left || by === left) return null;
  const rng = streamFor(state.seed ?? 1, `split:${by}>${left}:${state.ep}`);
  const selfishCause = cause !== 'cheated' && cause !== 'played';
  const promised = closedness(state, by, left);
  const saidLove = state.loveSaid?.[`${by}→${left}`] != null ? 1 : 0;
  const fair = clamp((BASE_FAIR[cause] ?? 0.5)
    + 0.15 * Math.min(2, knownWrong(state, left, by))                  // they had it coming
    - 0.2 * Math.min(2, knownWrong(state, by, left))                   // pot, kettle
    - (selfishCause ? 0.2 * promised + 0.1 * saidLove : 0),            // a promise broken
  0.03, 0.97);
  const rl = clamp(romance(left, by) / 10, 0, 1), rb = clamp(romance(by, left) / 10, 0, 1);
  const heated = HEATED.has(cause);
  const wronged = cause === 'cheated' || cause === 'played';
  // How it lands. The one left, unless {by} is the one wronged (they caught
  // the other cheating or playing them): then the anger is {by}'s.
  const mood = weighted(rng, [
    // Cheated on or played almost never ends calmly (user); leaving for somebody else rarely does.
    ['friends', (wronged ? 0.04 : 0.1) + (1 - Math.max(rl, wronged ? rb : 0)) * (wronged ? 0.18 : heated ? 0.35 : 1.1)],
    ['hurt', Math.max(rl, wronged ? rb : 0) * (0.4 + 0.6 * T(state, wronged ? by : left))],
    ['bitter', rl * (1.1 - T(state, left)) * (1.6 - fair) * (heated ? 1.3 : 0.7)
      + (wronged ? (0.5 + 0.5 * rb) * (1.1 - T(state, by)) * 1.2 : 0)],
  ]);
  const holder = rl >= rb ? left : by;
  const rec = setSplit(state, { by, left, cause, ep: state.ep, fair: Math.round(fair * 100) / 100, mood, holder,
    torch: Math.round(Math.max(rl, rb) * 100) / 100, about: about || null });
  // What it does now, by how it landed.
  if (mood === 'friends') { addRelationshipDimension(by, left, 'affection', 0.8); addRelationshipDimension(left, by, 'affection', 0.8); }
  if (mood === 'hurt') feel(state, holder, 'loneliness', 0.6);
  if (mood === 'bitter') {
    const angry = wronged ? by : left, other = angry === by ? left : by;
    addRelationshipDimension(angry, other, 'resentment', 1.2); addRelationshipDimension(other, angry, 'resentment', 0.4);
    addBond(by, left, -1);
  }
  // A copy for the scene to keep: the record itself moves on (time heals, scenes are counted).
  return { ...rec };
}

/**
 * The public's verdict on a break-up, as a scene's pop: a fair one costs the
 * one who ended it little or nothing, a selfish one costs them and wins the
 * one left some sympathy, in proportion to what they lost.
 */
export function verdictPop(rec, k = 1) {
  if (!rec) return {};
  return {
    [rec.by]: { approval: Math.round(3 * (rec.fair - 0.5) * k * 100) / 100, fame: 1.5 },
    [rec.left]: { approval: Math.round(Math.max(0, 0.6 - rec.fair) * 3 * (0.4 + rec.torch) * k * 100) / 100, fame: 1.5 },
  };
}

// What counts as moving on, and how much: a kiss is a kiss, a chat half one.
const ACTS = { kiss: 1, 'challenge-kiss': 0.6, 'game-kiss': 0.6, 'snogger-kiss': 0.5, 'icebreaker': 0.5, pull: 0.5,
  'bed-share': 1, 'recouple-pick': 1.2, 'stand-up-pick': 1, steal: 1, date: 0.8, 'casa-return': 1.2, hideaway: 1 };

/**
 * Somebody who broke up with somebody is with somebody new (any scene in
 * ACTS). The one still holding a torch feels it — in proportion to what they
 * feel and how raw it still is — and the scene is remembered for them to
 * react to (events.js 'ex-sting'). The one who ended it pays with the public
 * for moving on fast, more for a selfish break-up. Returns the extra pop.
 */
export function exReact(state, ev) {
  let w = ACTS[ev.kind];
  if (!w || (ev.players || []).length < 2) return null;
  if (ev.kind === 'pull' && ev.extra?.kissed) w = 1;
  if (ev.kind === 'casa-return' && ev.extra?.choice !== 'twist') return null;
  if (ev.kind === 'recouple-pick' && ev.extra?.reclaim) return null;
  const [p0, p1] = ev.players;
  const apart = (a, b) => !!state.split && (state.casa || []).includes(a) !== (state.casa || []).includes(b);
  const pop = {};
  for (const [actor, other] of [[p0, p1], [p1, p0]]) {
    for (const rec of splitRecords(state)) {
      if (rec.by !== actor && rec.left !== actor) continue;
      const x = exOf(rec, actor);
      if (x === other || !state.villa.includes(x)) continue;
      const raw = rawness(state, rec);
      // The one still holding a torch, and not over it: it stings, and it shows.
      if (rec.holder === x && rec.mood !== 'friends' && !apart(x, actor)) {
        const amount = 2.5 * w * raw * clamp(romance(x, actor) / 10, 0, 1);
        if (amount > 0.05) {
          jealousOf(state, x, other, amount);
          feel(state, x, 'stress', 0.4 * w * raw);
          (state._exStings ||= []).push({ holder: x, ex: actor, other, ep: state.ep, kind: ev.kind });
        }
      }
      // Moving on fast, after ending it: the public notices, more for a selfish break-up.
      if (rec.by === actor && rec.mood !== 'friends') {
        const cost = 1.5 * w * raw * (1 - rec.fair) * (rec.holder === x ? 1 : 0.5);
        if (cost > 0.05) (pop[actor] ||= { approval: 0, fame: 0 }).approval -= Math.round(cost * 100) / 100;
      }
    }
  }
  return Object.keys(pop).length ? pop : null;
}

/** The scenes a still-hurting ex gets: the freshest sting, once. */
export function takeSting(state, ok) {
  const list = (state._exStings || []).filter(s => s.ep >= state.ep - 1 && ok(s));
  if (!list.length) return null;
  const s = list.sort((a, b) => b.ep - a.ep)[0];
  state._exStings = (state._exStings || []).filter(x => x !== s && x.ep >= state.ep - 1);
  return s;
}

