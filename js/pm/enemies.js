// ══════════════════════════════════════════════════════════════════════
// pm/enemies.js — the islanders who can't stand each other, every day
// ══════════════════════════════════════════════════════════════════════
//
// User, 2026-10-26: "we need more enemies events too, day events are mostly
// lighthearted". Measured over 8 seasons: 5 to 12 pairs of islanders who
// can't stand each other at the end of every season, and 3% of the day's
// scenes between two people who aren't a couple were hostile — the blow-ups
// (pm/blowup.js) and the storylines, about four a season, and nothing in
// between. The villa's grudges lived in the numbers and never on screen.
//
// An enemy is somebody a has a real reason to dislike, read off the record
// (`grudgeOf`): b stole a's partner, voted a's friend out, told on a, wants
// the same person, said something about a on Movie Night, took the other
// side in a fight — or, with none of those, something about b that a can
// name (fake, loud, moody, full of it). Every scene says which. Two a day at
// most, in proportion to how much they dislike each other and how bold a is.
//
//   enemy-snipe   [a, b, (c)]  a has a go at b in front of people. `of`: bites · ignores
//   enemy-bitch   [a, f, b]    a on b, to a friend, behind b's back (Movie Night can show it)
//   enemy-clash   [a, b, (c)]  it comes out properly, and c gets between them.
//                              `of`: walks · stays · pulled-apart
//   enemy-freeze  [a, b, c]    a freezes b out, and c sees it
//   enemy-truce   [a, b]       they talk it out. `of`: peace · refused
//
// Nice archetypes don't snipe or talk behind backs much (CLAUDE.md: they
// never scheme); they still clash when there's a reason, and make peace.
import { addBond, getBond } from '../bonds.js';
import { getRelationshipDimension, addRelationshipDimension } from '../relationships.js';
import { makeEvent, partnerOf, roomMates } from './events.js';
import { attr } from './chemistry.js';
import { feel } from './emotions.js';

const MAX_A_DAY = 2;
const LOOKBACK = 8;
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN = new Set(['villain', 'mastermind', 'schemer']);
const S = (state, n) => state.profiles[n]?.stats || {};
const st = (state, n, k) => (S(state, n)[k] ?? 5) / 10;
const res = (a, b) => getRelationshipDimension(a, b, 'resentment') || 0;
const pop = (...rows) => Object.fromEntries(rows.filter(r => r && r[0]).map(([n, approval, fame]) => [n, { approval, fame }]));
function weighted(rng, opts) {
  const total = opts.reduce((t, o) => t + Math.max(0, o[1]), 0);
  if (total <= 0) return opts[0][0];
  let r = rng() * total;
  for (const o of opts) if ((r -= Math.max(0, o[1])) < 0) return o[0];
  return opts[opts.length - 1][0];
}

/** How much a can't stand b: the friendship gone below zero, and what a holds against b. */
export const hostility = (state, a, b) => Math.max(0, -getBond(a, b)) * 0.6 + res(a, b);

/**
 * What a has against b, by name: the thing that happened, read off the record,
 * or — with nothing on it — what a can't stand about b. `about`: who it was
 * over, when somebody (named in the scene as {x}).
 */
export function grudgeOf(state, a, b) {
  const recent = state.history.filter(e => e.aired && state.ep - e.ep <= LOOKBACK).reverse();
  for (const e of recent) {
    const p = e.players;
    if (e.kind === 'debrief' && p[0] === a && p[2] === b) {
      if (e.extra?.of === 'robbed') return { grudge: 'steal', about: partnerOf(state, b) && partnerOf(state, b) !== a ? partnerOf(state, b) : null };
      if (e.extra?.of === 'blame') return { grudge: 'vote', about: e.extra?.gone || null };
    }
    if ((e.kind === 'stirrer-confront' || e.kind === 'told-confront') && p[0] === a && p.includes(b)) return { grudge: 'told', about: null };
    if (e.kind === 'movie-callout' && p[0] === a && p[1] === b) return { grudge: 'said', about: null };
    if (e.kind === 'enemy-bitch' && p[0] === b && p[2] === a && e.extra?.heard) return { grudge: 'said', about: null };
    if (e.kind === 'pile-in' && p[0] === b && p[2] === a) return { grudge: 'sided', about: p[1] !== a && p[1] !== b ? p[1] : null };
  }
  // Both after the same person: the one a wants, who b wants too (or has).
  const rival = state.villa.find(x => x !== a && x !== b && (attr(state, a, x) ?? 0) >= 5
    && ((attr(state, b, x) ?? 0) >= 5 || partnerOf(state, b) === x) && partnerOf(state, a) !== x);
  if (rival) return { grudge: 'rival', about: rival };
  // Nothing happened: what a can't stand about b, from who b is — b's most
  // marked trait (narration only: it picks the words, never an outcome). The
  // same pair always has the same reason, so the story holds.
  const arch = state.profiles[b]?.archetype;
  const sb = S(state, b);
  const traits = [
    ['fake', ((sb.strategic ?? 5) - 5) + (VILLAIN.has(arch) ? 2 : 0)],
    ['loud', (sb.boldness ?? 5) - 5],
    ['moody', 5 - (sb.temperament ?? 5)],
    ['cocky', ((sb.social ?? 5) - 5) * 0.8 + (arch === 'challenge-beast' ? 1.5 : 0)],
  ].sort((x, y) => y[1] - x[1]);
  return { grudge: traits[0][1] > 0 ? traits[0][0] : 'cocky', about: null };
}

/** The day's enemies: two scenes at most, between people who mean it. */
export function enemies(state, rng, entry = null) {
  if (entry && ['final', 'reunion', 'first-coupling'].includes(entry.moment)) return [];
  const here = new Set(state.villa);
  const pairs = [];
  for (const a of state.villa) for (const b of roomMates(state, a)) {
    if (a === b || !here.has(b) || partnerOf(state, a) === b) continue;
    const h = hostility(state, a, b);
    if (h < 1.2) continue;
    pairs.push({ a, b, h });
  }
  // The angriest first, each on its own chance: in proportion to how much,
  // and to how bold the one who starts it is.
  pairs.sort((x, y) => y.h - x.h);
  const out = [], used = new Set();
  const truceDone = new Set();
  state.enemyLast ||= {};
  for (const { a, b, h } of pairs) {
    if (out.length >= MAX_A_DAY) break;
    if (used.has(a) || used.has(b)) continue;
    // The same two, every other episode at most: the same pair three episodes
    // running, with the same line, was a loop and not a story (probe 2026-10-26).
    const pk = [a, b].sort().join('|');
    if (state.enemyLast[pk] != null && state.ep - state.enemyLast[pk].ep < 2) continue;
    const p = Math.min(0.55, (h - 1) / 7) * (0.6 + 0.8 * st(state, a, 'boldness'));
    if (rng() >= p) continue;
    used.add(a); used.add(b);
    const e = scene(state, rng, a, b, h, truceDone.has(pk), state.enemyLast[pk]?.kind);
    state.enemyLast[pk] = { ep: state.ep, kind: e.kind };
    out.push(e);
    truceDone.add(pk);
  }
  return out;
}

function scene(state, rng, a, b, h, noTruce, lastKind = null) {
  const g = grudgeOf(state, a, b);
  const { grudge } = g;
  // Somebody a scene shows walking past is in the room: across Casa's two
  // villas they are only named where they can be (a vote's {x} has gone home).
  const about = g.about && (grudge === 'vote' || roomMates(state, a).includes(g.about)) ? g.about : null;
  const nice = NICE.has(state.profiles[a]?.archetype);
  const bold = st(state, a, 'boldness'), calm = st(state, a, 'temperament');
  const friend = state.villa.filter(n => n !== a && n !== b && roomMates(state, a).includes(n))
    .sort((x, y) => getBond(a, y) - getBond(a, x))[0] || null;
  const bystander = state.villa.filter(n => n !== a && n !== b && n !== friend && roomMates(state, a).includes(n))
    .sort((x, y) => (getBond(x, a) + getBond(x, b)) - (getBond(y, a) + getBond(y, b)))[0] || friend;
  // A long one between two calm people ends in a truce, sometimes; most days it doesn't.
  const truceW = noTruce ? 0 : (calm + st(state, b, 'temperament')) / 2 * (h < 3 ? 0.5 : 0.15);
  // Not the same kind of scene twice running for the same two.
  const again = k => (lastKind === `enemy-${k}` ? 0.15 : 1);
  const kind = weighted(rng, [
    ['snipe', again('snipe') * (nice ? 0.2 : 1) * (0.4 + bold)],
    ['bitch', again('bitch') * (friend ? (nice ? 0.25 : 1) * (0.6 + (1 - bold) * 0.6) : 0)],
    ['clash', again('clash') * (0.3 + bold) * (1.2 - calm) * Math.min(1, h / 3)],
    ['freeze', again('freeze') * (bystander ? 0.3 + 0.5 * (1 - bold) : 0)],
    ['truce', truceW],
  ]);
  const extra = { grudge, ...(about ? { about } : {}) };
  const ev = (k, players, more, major = []) => makeEvent(state, rng, { phase: k === 'enemy-clash' || k === 'enemy-truce' ? 'evening' : 'day',
    kind: k, players, aired: true, major, extra: { ...extra, ...more } });
  if (kind === 'snipe') {
    const bites = rng() < 0.3 + 0.6 * (1 - st(state, b, 'temperament'));
    addBond(a, b, -0.4); addBond(b, a, -0.4);
    if (bites) { addRelationshipDimension(b, a, 'resentment', 0.4); addRelationshipDimension(a, b, 'resentment', 0.2); }
    return ev('enemy-snipe', bystander ? [a, b, bystander] : [a, b], { of: bites ? 'bites' : 'ignores',
      pop: pop([a, VILLAIN.has(state.profiles[a]?.archetype) ? 0 : -0.3, 1], [b, bites ? -0.1 : 0.4, 0.6]) });
  }
  if (kind === 'bitch') {
    // Said to a friend: it stays between them, mostly; the friend's view of b
    // moves, and the camera has it (movie-night.js can play it back to b).
    addBond(a, friend, 0.3); addBond(friend, b, -0.4);
    const heard = rng() < 0.12;   // overheard, or the friend lets it slip
    if (heard) { addBond(b, a, -0.8); addRelationshipDimension(b, a, 'resentment', 0.8); }
    return ev('enemy-bitch', [a, friend, b], { heard, pop: pop([a, -0.2, 0.6]) });
  }
  if (kind === 'clash') {
    const of = weighted(rng, [['walks', 0.4 + calm], ['stays', 0.3 + bold], ['pulled-apart', bystander ? 0.5 + (1 - calm) : 0]]);
    addBond(a, b, -1); addBond(b, a, -1);
    addRelationshipDimension(a, b, 'resentment', 0.6); addRelationshipDimension(b, a, 'resentment', 0.6);
    feel(state, a, 'stress', 0.8); feel(state, b, 'stress', 0.8);
    if (bystander) { addBond(bystander, a, -0.2); addBond(bystander, b, -0.2); }
    // The public on it: a fight with a reason is easier to watch than one without.
    const reason = ['steal', 'vote', 'told', 'said', 'sided'].includes(grudge);
    return ev('enemy-clash', bystander && of === 'pulled-apart' ? [a, b, bystander] : [a, b], { of,
      pop: pop([a, reason ? 0.3 : -0.5, 1.8], [b, reason ? -0.5 : 0, 1.5]) }, [a, b]);
  }
  if (kind === 'freeze') {
    addBond(b, a, -0.3); feel(state, b, 'stress', 0.4); addBond(bystander, a, -0.15);
    return ev('enemy-freeze', [a, b, bystander], { pop: pop([a, -0.3, 0.6], [b, 0.3, 0.6]) });
  }
  // The truce: b's temper and how far it has gone decide it.
  const peace = rng() < 0.35 + 0.4 * st(state, b, 'temperament') - 0.05 * h;
  if (peace) {
    addBond(a, b, 2); addBond(b, a, 2);
    addRelationshipDimension(a, b, 'resentment', -1.5); addRelationshipDimension(b, a, 'resentment', -1.5);
  } else { addBond(b, a, -0.3); }
  return ev('enemy-truce', [a, b], { of: peace ? 'peace' : 'refused', pop: pop([a, 0.6, 1], [b, peace ? 0.6 : -0.3, 1]) });
}
