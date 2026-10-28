// ══════════════════════════════════════════════════════════════════════
// ss/split.js — the split: two houses, two clans, the bears
// ══════════════════════════════════════════════════════════════════════
//
// Twist family 4 (docs/superpowers/specs/2026-10-28-secret-story-split-design.md): S4's second house, which parted
// couples and alliances on purpose; S9 and S11's clans (Eagles against Tigers); S12's Pink Bears against the main
// house. An era of two or three weeks: every week a duel on averages makes one side immune, life on each side moves
// the friendships, the parted talk through the glass once, the Voice tries to buy a traitor once, and the era ends
// with the reunion. Pure: returns events with `effects` for the adapter (js/bb/secret-story.js).

import { mint } from './kitty.js';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const SPLIT_KINDS = ['second-house', 'clans', 'bears'];
const CLAN_NAMES = [['The Eagles', 'The Tigers'], ['The Suns', 'The Moons'], ['The Pinks', 'The Blues']];
// the duel's game, and the stats it asks for (the side's AVERAGE, never its sum)
export const DUELS = [
  { game: 'a relay with buckets of water across the garden', stats: ['physical', 'endurance'] },
  { game: 'a quiz about everything that happened in the house', stats: ['mental', 'intuition'] },
  { game: 'a tug of war over the pool', stats: ['physical'] },
  { game: 'a blind taste test', stats: ['intuition', 'temperament'] },
  { game: 'holding on to a giant spinning cube', stats: ['endurance', 'temperament'] },
  { game: 'building the tallest tower of plastic cups', stats: ['mental', 'temperament'] },
];

/** Is a split running in week `wk`? */
export const splitActive = (state, wk) => !!state?.split && !state.split.over && wk >= state.split.from && wk <= state.split.until;

/**
 * Opens the split. `kind`: 'second-house' | 'clans' | 'bears'. Returns state.split.
 * @param {any} state @param {any} ctx @param {{ house?: string[], kind?: string }} o
 */
export function startSplit(state, ctx, { house = [], kind = 'second-house' } = {}) {
  const rng = ctx.rng || Math.random;
  const wk = ctx.week ?? 0;
  const S = (n, k) => Number(ctx.stat(n, k)) || 5;
  const B = (a, b) => Number(ctx.bond(a, b)) || 0;
  const room = house.slice();
  const pairs = room.flatMap((a, i) => room.slice(i + 1).map(b => [a, b, B(a, b)]));
  /** @type {string[][]} */ let sides = [[], []];
  /** @type {string[][]} */ const parted = [];
  let names = ['The House', 'The Other House'], apart = true, captains = null;
  // everybody left goes to the smaller side, or to the side of more friends when they are even
  const place = (n, avoid = null) => {
    const pull = sides.map(sd => sd.reduce((t, m) => t + B(n, m), 0));
    let i = sides[0].length === sides[1].length ? (pull[0] >= pull[1] ? 0 : 1) : sides[0].length < sides[1].length ? 0 : 1;
    if (avoid != null && sides[i].includes(avoid) && sides[1 - i].length <= sides[i].length) i = 1 - i;
    sides[i].push(n);
  };
  if (kind === 'clans') {
    // two captains: the two strongest characters who like each other least; each drafts by friendship
    const caps = room.slice().sort((a, b) => (S(b, 'social') + S(b, 'boldness')) - (S(a, 'social') + S(a, 'boldness'))).slice(0, 4);
    let best = null;
    for (const a of caps) for (const b of caps) if (a < b && (!best || B(a, b) < B(best[0], best[1]))) best = [a, b];
    captains = best || [room[0], room[1]];
    sides = [[captains[0]], [captains[1]]];
    const left = room.filter(n => !captains.includes(n));
    while (left.length) {
      const i = sides[0].length <= sides[1].length ? 0 : 1;
      left.sort((x, y) => B(captains[i], y) - B(captains[i], x) + (rng() - 0.5) * 0.4);
      sides[i].push(/** @type {string} */ (left.shift()));
    }
    names = CLAN_NAMES[Math.floor(rng() * CLAN_NAMES.length) % CLAN_NAMES.length];
    apart = false;
  } else if (kind === 'bears') {
    // the few who move out: the least settled in the house (the weakest ties to everybody else)
    const size = room.length >= 11 ? 4 : 3;
    const ties = n => room.filter(m => m !== n).reduce((t, m) => t + B(n, m), 0);
    const bears = room.slice().sort((a, b) => ties(a) - ties(b) + (rng() - 0.5) * 0.4).slice(0, size);
    sides = [room.filter(n => !bears.includes(n)), bears];
    names = ['The House', 'The Pink Bears'];
  } else {
    // the second house: the Voice parts the closest pairs on purpose, then balances the sides
    const k = Math.max(1, Math.floor(room.length / 5));
    const used = new Set();
    for (const [a, b] of pairs.slice().sort((x, y) => y[2] - x[2])) {
      if (parted.length >= k) break;
      if (used.has(a) || used.has(b)) continue;
      used.add(a); used.add(b);
      const i = parted.length % 2;
      sides[i].push(a); sides[1 - i].push(b);
      parted.push([a, b]);
    }
    for (const n of room.filter(x => !used.has(x)).sort(() => rng() - 0.5)) place(n);
  }
  const weeks = room.length >= 12 ? 3 : 2;
  state.split = { kind, names, sides, apart, captains, parted, from: wk, until: wk + weeks - 1, window: false, offered: false, over: null, duels: [] };
  (state.splits ||= []).push({ kind, from: wk });
  return state.split;
}

/**
 * One week of the split: the duel, life on each side, the window, the traitor's offer, and at the end the reunion.
 * @param {any} state @param {any} ctx @param {{ house?: string[] }} o
 */
export function splitWeek(state, ctx, { house = [] } = {}) {
  const s = state.split;
  const wk = ctx.week ?? 0;
  if (!s || s.over || wk < s.from) return null;
  const rng = ctx.rng || Math.random;
  const S = (n, k) => Number(ctx.stat(n, k)) || 5;
  const B = (a, b) => Number(ctx.bond(a, b)) || 0;
  s.sides = s.sides.map(sd => sd.filter(n => house.includes(n)));
  const fx = { bond: [], pub: [] };
  // THE DUEL: the side's average on the game's stats (a side of three plays a side of nine on equal terms)
  const D = DUELS[Math.floor(rng() * DUELS.length) % DUELS.length];
  const avg = sd => (sd.length ? sd.reduce((t, n) => t + D.stats.reduce((u, k) => u + S(n, k), 0) / D.stats.length, 0) / sd.length : 0);
  const score = s.sides.map(sd => avg(sd) + rng() * 1.5);
  const w = score[0] >= score[1] ? 0 : 1;
  const winners = s.sides[w].slice(), losers = s.sides[1 - w].slice();
  for (const n of winners) mint(state, n, 500, 'won the duel of the split', wk);
  state.nextImmune ||= {};
  for (const n of winners) (state.nextImmune[wk] ||= []).includes(n) || state.nextImmune[wk].push(n);
  const best = winners.slice().sort((a, b) => D.stats.reduce((t, k) => t + S(b, k) - S(a, k), 0))[0];
  if (best) fx.pub.push([best, 'game', 0.15, `carried ${s.names[w]} in the duel`]);
  const duel = { game: D.game, winners, losers, w, scores: score.map(x => Math.round(x * 10) / 10) };
  s.duels.push({ week: wk, w });
  // LIFE ON EACH SIDE: a few pairs grow closer; apart, the friendships across the wall fade
  for (const sd of s.sides) {
    const ps = sd.flatMap((a, i) => sd.slice(i + 1).map(b => [a, b])).sort(() => rng() - 0.5).slice(0, 3);
    for (const [a, b] of ps) fx.bond.push([a, b, 0.3]);
  }
  if (s.apart) for (const a of s.sides[0]) for (const b of s.sides[1]) if (B(a, b) > 2) fx.bond.push([a, b, -0.25]);
  // THE WINDOW (apart, once an era): the closest of the parted talk through the glass
  let window = null;
  const last = wk >= s.until;
  if (s.apart && !s.window && (rng() < 0.6 || last)) {
    const cand = (s.parted.length ? s.parted : s.sides[0].flatMap(a => s.sides[1].map(b => [a, b])))
      .filter(([a, b]) => house.includes(a) && house.includes(b)).sort((x, y) => B(y[0], y[1]) - B(x[0], x[1]))[0];
    if (cand) { s.window = true; window = { a: cand[0], b: cand[1] }; fx.bond.push([cand[0], cand[1], 0.6]); }
  }
  // THE TRAITOR'S OFFER (once an era, half the time): the member of the losing side least attached to it
  let traitor = null;
  if (!s.offered && losers.length >= 3 && rng() < 0.5) {
    s.offered = true;
    const tie = n => losers.filter(m => m !== n).reduce((t, m) => t + B(n, m), 0) / Math.max(1, losers.length - 1);
    const who = losers.slice().sort((a, b) => tie(a) - tie(b))[0];
    const took = rng() < clamp(0.25 + (10 - S(who, 'loyalty')) * 0.05 - tie(who) * 0.05, 0.05, 0.85);
    const from = 1 - w, to = w;
    if (took) {
      mint(state, who, 3000, 'changed sides for the Voice', wk);
      s.sides[from] = s.sides[from].filter(n => n !== who);
      s.sides[to].push(who);
      for (const m of losers.filter(n => n !== who)) fx.bond.push([m, who, -1]);
      for (const m of winners) fx.bond.push([m, who, 0.2]);
      fx.pub.push([who, 'heat', 0.3, 'sold out their side for $3,000']);
    } else {
      for (const m of losers.filter(n => n !== who)) fx.bond.push([m, who, 0.4]);
      fx.pub.push([who, 'warmth', 0.2, 'turned down $3,000 to stay with their side']);
    }
    traitor = { who, took, from, to, money: took ? 3000 : 0 };
  }
  // THE REUNION: the wall comes down
  let reunion = null;
  if (last) {
    s.over = wk;
    const back = s.parted.filter(([a, b]) => house.includes(a) && house.includes(b));
    for (const [a, b] of back) fx.bond.push([a, b, 0.8]);
    reunion = { parted: back.map(p => p.slice()), names: s.names.slice() };
  }
  return { kind: s.kind, names: s.names.slice(), sides: s.sides.map(sd => sd.slice()), apart: s.apart, captains: s.captains, parted: s.parted.map(p => p.slice()),
    week: wk, from: s.from, until: s.until, duel, window, traitor, reunion, effects: fx };
}
