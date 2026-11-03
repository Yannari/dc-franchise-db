// ══════════════════════════════════════════════════════════════════════
// pm/runner.js — the episode's light story: one bit, set up in the morning,
// getting out of hand in the day, paid off at night
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-11-03: Perfect Match is "boring … I'm not a fan of couple
// shows, so they really have to sell me with constant entertainment". A real
// Love Island hour (USA S8E12) runs its main story from every side and keeps a
// lighter one going round it — the Hideaway couple's night, the girls on the
// daybeds watching the boys work out ("my show is on"). Ours had a one-line
// comedy note that rarely aired.
//
// A RUNNER is one bit with three beats, each a scene of its own (kind
// 'villa-bit', `bit` and `step` for the lines, pm/talk/runner.js):
//   setup     the morning: the bet is made, the prank is planned, the sunbeds
//   escalate  the day: it gets out of hand, somebody else is pulled in
//   payoff    the evening: who lost, what it cost, who laughed
// Its people come from outside the stretch's two stories (pm/stretch.js): the
// episode's light side is somebody else's day. Every beat moves something
// (CLAUDE.md): bonds between the ones in it, a little of the public's warmth
// and fame for whoever carried it. How it ends is the islanders' own: their
// stats, proportionally, on the runner's own dice — no other draw moves.
import { makeEvent } from './events.js';
import { addBond, getBond } from '../bonds.js';
import { nudgeAttraction, attr } from './chemistry.js';
import { storyRoleOf } from './stretch.js';
import { streamFor } from '../dr/rng.js';

const S = (state, n) => state.profiles[n]?.stats || {};
const st = (state, n, k) => (S(state, n)[k] ?? 5) / 10;
const pop = (...rows) => Object.fromEntries(rows.filter(Boolean).map(([n, approval, fame]) => [n, { approval, fame }]));
function weighted(rng, opts) {
  const total = opts.reduce((s, [, w]) => s + Math.max(0, w), 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (const [v, w] of opts) { r -= Math.max(0, w); if (r < 0) return v; }
  return opts[opts.length - 1][0];
}

/**
 * The bits. `cast` picks who plays it from the villa's free islanders (a
 * leads; b is with a; c is the other side of it); `ends` decides how it ends
 * from what they're like. Who leads is weighted by what the bit needs.
 */
export const BITS = {
  // a and b bet; the loser pays a forfeit in front of everyone.
  bet: { topics: ['heat', 'babe'], lead: n => ['boldness', 'social'], second: 'friend', third: null,
    ends: (state, rng, [a, b]) => (rng() < 0.5 + 0.3 * (st(state, a, 'temperament') - st(state, b, 'temperament')) ? 'b-lost' : 'a-lost') },
  // a and b plan a harmless prank on c; c catches them, or doesn't, and gets even, or laughs.
  // (A folded bed is found at bedtime: only on a day that ends in bed.)
  prank: { topics: ['shoes', 'bed'], night: ['bed'], lead: n => ['boldness', 'boldness', 'social'], second: 'friend', third: 'any',
    ends: (state, rng, [a, b, c]) => {
      const caught = rng() < 0.25 + 0.5 * st(state, c, 'intuition');
      const even = rng() < 0.3 + 0.5 * st(state, c, 'boldness');
      return caught ? (even ? 'caught-even' : 'caught-laugh') : (even ? 'landed-even' : 'landed-laugh');
    } },
  // a and b on the daybeds watching c work out; c notices, and makes them join in.
  show: { lead: n => ['social', 'social', 'boldness'], second: 'friend', third: 'other-side',
    ends: (state, rng, [a, b, c]) => (rng() < 0.4 + 0.4 * st(state, c, 'physical') ? 'shown-up' : 'all-in') },
  // a cooks the villa's dinner with b's help; it's saved, or it's a disaster.
  cook: { lead: n => ['social', 'loyalty'], second: 'friend', third: null,
    ends: (state, rng, [a, b]) => (rng() < 0.3 + 0.25 * (st(state, a, 'mental') + st(state, b, 'mental')) ? 'saved' : 'disaster') },
  // c snores; a, who hasn't slept, finds out who it is with b's help.
  snore: { lead: n => ['temperament', 'intuition'], second: 'friend', third: 'roommate',
    ends: (state, rng, [a, b, c]) => (rng() < 0.4 + 0.4 * st(state, c, 'temperament') ? 'owns-it' : 'denies') },
  // a and c both want the best sunbed; b is roped in.
  sunbed: { lead: n => ['boldness', 'strategic'], second: 'friend', third: 'any',
    ends: (state, rng, [a, , c]) => { const r = rng(); const edge = 0.5 + 0.3 * (st(state, a, 'endurance') - st(state, c, 'endurance')); return r < 0.25 ? 'share' : r < 0.25 + 0.75 * edge ? 'a-won' : 'c-won'; } },
  // a has lost something that matters; b helps look; it turns up with c.
  lost: { lead: n => ['loyalty', 'temperament'], second: 'friend', third: 'any',
    ends: (state, rng, [a, b, c]) => (rng() < 0.5 ? 'c-had-it' : 'b-found-it') },
  // a challenges c to a match at the table by the pool; b commentates.
  match: { lead: n => ['boldness', 'physical'], second: 'friend', third: 'any',
    ends: (state, rng, [a, , c]) => (rng() < 0.5 + 0.35 * (st(state, a, 'physical') - st(state, c, 'physical')) ? 'a-won' : 'c-won') },
};

// What each beat moves (CLAUDE.md: every scene has a consequence).
function effects(state, bit, step, players, out) {
  const [a, b, c] = players;
  if (step === 'setup') {
    if (b) addBond(a, b, 0.3);
    return pop([a, 0.1, 0.6], b && [b, 0.05, 0.3]);
  }
  if (step === 'escalate') {
    if (b) addBond(a, b, 0.2);
    if (c) addBond(a, c, bit === 'sunbed' || bit === 'snore' ? -0.2 : 0.2);
    return pop([a, 0.1, 0.8], c && [c, 0.1, 0.6]);
  }
  // The payoff: who it was about comes out of it warmer with the villa, mostly.
  if (b) addBond(a, b, 0.5);
  if (c) addBond(a, c, /even/.test(out) ? -0.1 : 0.4);
  if (c && b) addBond(b, c, 0.2);
  // A laugh at the show can start something (the watched one, the watchers).
  if (bit === 'show' && c && attr(state, a, c) != null) nudgeAttraction(state, a, c, 0.3);
  const loser = { 'a-lost': a, 'b-lost': b, 'a-won': c, 'c-won': a, disaster: a, denies: c }[out] || null;
  return pop([a, 0.5, 1.6], b && [b, 0.3, 0.8], c && [c, 0.3, 1], loser && [loser, 0.3, 0.6]);
}

/** The runner's people: free islanders, weighted by what the bit needs. */
function castFor(state, rng, bit, free) {
  const def = BITS[bit];
  const want = def.lead();
  const a = weighted(rng, free.map(n => [n, 0.2 + want.reduce((s, k) => s + st(state, n, k), 0)]));
  if (!a) return null;
  const others = free.filter(n => n !== a);
  // b: a friend of a's, by how close they are.
  const close = n => Math.max(0.1, 1 + getBond(a, n));
  const b = def.second ? weighted(rng, others.map(n => [n, close(n)])) : null;
  if (def.second && !b) return null;
  let c = null;
  if (def.third) {
    const pool = others.filter(n => n !== b);
    const g = n => state.profiles[n]?.gender;
    const fits = def.third === 'other-side' ? pool.filter(n => g(n) !== g(a)) : pool;
    c = weighted(rng, (fits.length ? fits : pool).map(n => [n, 0.3 + st(state, n, 'social')]));
    if (!c) return null;
  }
  return [a, b, c].filter(Boolean);
}

/** Who is free for it today: in the villa, not in the stretch's A or B story, not split up by Casa. */
function freeToday(state) {
  return state.villa.filter(n => !['a', 'b'].includes(storyRoleOf(state, n)) && !(state.split && state.casa?.includes(n)));
}

/**
 * The beat of today's runner for this part of the day, or nothing. Started on
 * the morning's call, played once a part of the day, paid off in the evening.
 * A bit doesn't come back for four episodes, nor does its lead.
 */
export function runnerBeat(state, phase, entry = null) {
  const step = phase === 'morning' ? 'setup' : phase === 'day' ? 'escalate' : phase === 'evening' || phase === 'night' ? 'payoff' : null;
  if (!step || state.split) return [];
  const rng = streamFor(state.seed ?? 1, `runner:${state.ep}${state.epSalt || ''}:${phase}`);
  let r = state._runner?.ep === state.ep ? state._runner : null;
  if (!r) {
    if (step !== 'setup') return [];
    const free = freeToday(state);
    if (free.length < 3) return [];
    const recent = (state.runners || []).filter(x => state.ep - x.ep < 4);
    const bits = Object.keys(BITS).filter(k => !recent.some(x => x.bit === k));
    const bit = bits[Math.floor(rng() * bits.length)] || Object.keys(BITS)[0];
    const lead = free.filter(n => !recent.some(x => x.players[0] === n));
    const players = castFor(state, rng, bit, lead.length >= 3 ? lead : free);
    if (!players) return [];
    // Which bet, which prank: one that can end today (a bed prank needs a bedtime).
    const endsInBed = ['villa', 'casa-nights'].includes(entry?.moment);
    const topics = (BITS[bit].topics || []).filter(t => endsInBed || !(BITS[bit].night || []).includes(t));
    const topic = topics.length ? topics[Math.floor(rng() * topics.length)] : null;
    r = state._runner = { ep: state.ep, bit, players, done: [], topic };
    (state.runners ||= []).push({ ep: state.ep, bit, players: [...players] });
  }
  if (r.done.includes(step)) return [];
  // A night payoff waits for the night; every other one is the evening's.
  const atNight = (BITS[r.bit].night || []).includes(r.topic);
  if (step === 'payoff' && atNight !== (phase === 'night')) return [];
  // Everyone in it is still here and still in this villa.
  if (!r.players.every(n => state.villa.includes(n))) return [];
  r.done.push(step);
  const out = step === 'payoff' ? BITS[r.bit].ends(state, rng, r.players) : null;
  if (out) r.out = out;
  const ev = makeEvent(state, rng, { phase, kind: 'villa-bit', players: r.players, aired: true,
    extra: { bit: r.bit, step, ...(r.topic ? { topic: r.topic } : {}), ...(out ? { out } : {}), runner: true, pop: effects(state, r.bit, step, r.players, out) } });
  return [ev];
}
