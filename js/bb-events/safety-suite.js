// ══════════════════════════════════════════════════════════════════════
// bb-events/safety-suite.js — you only get one, and everybody is counting
// ══════════════════════════════════════════════════════════════════════
//
// The Safety Suite is the only twist in this catalogue whose material is
// ARITHMETIC. Nothing is hidden and nothing is anonymous; the whole house can
// see exactly who swiped and exactly who has an entry left, and by the third
// week that list is the most useful document in the building.
//
// Which gives this family four things nothing else here has:
//
//   · spending it early is a public confession that you cannot survive a
//     normal week, and the house files that
//   · holding it is a bet, and a nominee holding an unspent pass is somebody
//     whose read on the week was wrong in front of everybody
//   · running out is permanent — from then on every week is played with no
//     net, and everybody knows it
//   · the Plus One is a gift with a bill attached: safe, and punished for it,
//     with one person's name on both halves
//
// Nothing here needs protecting. Every fact in this twist is public, which is
// exactly why the pressure lands where it does.
import { gs } from '../core.js';
import { pStats, band, perceived, closestTo, furthestFrom } from './_read.js';
import { makeScene } from '../bb/script/scene.js';
import { numberWord } from '../bb/script/inject.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

const _suite = ctx => ctx?.week?.safetySuite || null;
const _spent = house => (gs?.bb?.safetySuiteUsed || []).filter(n => house.includes(n));

const _plusOneCast = (house, ctx) => {
  const s = _suite(ctx);
  if (!s?.plusOne || !house.includes(s.plusOne) || !house.includes(s.winner)) return null;
  const watcher = _others(house, s.plusOne, s.winner)
    .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return watcher ? { s, who: s.plusOne, giver: s.winner, watcher } : null;
};
const _wastedCast = (house, ctx) => {
  const s = _suite(ctx);
  if (!s) return null;
  const wasted = (s.entrants || []).filter(n => n !== s.winner && house.includes(n));
  if (!wasted.length) return null;
  const who = wasted[0];
  const watcher = _others(house, who).sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { s, who, watcher } : null;
};
const _heldWrongCast = (house, ctx) => {
  const s = _suite(ctx);
  const noms = ctx?.week?.finalNominees || ctx?.week?.initialNominees || ctx?.nominees || [];
  if (!s) return null;
  // Somebody who kept the pass and is on the block anyway, which is the bet
  // losing in the most public way available.
  const who = (s.held || []).find(n => house.includes(n) && noms.includes(n));
  if (!who) return null;
  const watcher = _others(house, who).sort((a, b) => pStats(b).social - pStats(a).social)[0];
  return { s, who, watcher };
};
const _exhaustedCast = (house, ctx) => {
  const s = _suite(ctx);
  const spent = _spent(house);
  const left = house.filter(n => !spent.includes(n));
  if (!s || spent.length < 2 || !left.length) return null;
  const counter = [...house].sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  const bare = spent.find(n => n !== counter) || spent[0];
  return counter ? { s, counter, bare, spent, left } : null;
};
const _timingCast = (house, ctx) => {
  const s = _suite(ctx);
  const spent = _spent(house);
  const holders = house.filter(n => !spent.includes(n) && n !== (ctx?.week?.hoh));
  if (!s || holders.length < 2) return null;
  const who = [...holders].sort((a, b) => pStats(b).temperament - pStats(a).temperament)[0];
  const pressed = closestTo(who, _others(holders, who)) || _others(holders, who)[0];
  return pressed ? { s, who, pressed } : null;
};

// ── safe, and paying for it ───────────────────────────────────────────
const thePlusOne = {
  id: 'suite-plus-one',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _plusOneCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _plusOneCast(house, ctx);
    if (!cast) return null;
    const { s, who, giver, watcher } = cast;
    const scene = makeScene('suite.plusone', { a: who, b: giver, c: watcher }, { ending: 'scene', bill: s.punishmentLabel || 'a punishment' }, [], 'kitchen');
    api.addBond(who, giver, 1.4);
    api.suspicion(watcher, giver, 1.2);
    try { api.remember(watcher, giver, 'named-a-plus-one', 1, { twist: 'bb-safety-suite', plusOne: who }); } catch { /* texture */ }
    return { scene, players: [who, giver, watcher], badgeText: 'SAFE, AND PAYING FOR IT', badgeClass: 'gold' };
  },
};

// ── spent it for nothing ──────────────────────────────────────────────
const spentForNothing = {
  id: 'suite-spent-for-nothing',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _wastedCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _wastedCast(house, ctx);
    if (!cast) return null;
    const { who, watcher } = cast;
    const scene = makeScene('suite.wasted', { a: who, b: watcher }, { ending: 'scene' }, [], 'living-room');
    api.popDelta(who, -0.5);
    try { api.setTarget(watcher, who, 'no entry left and no protection'); } catch { /* texture */ }
    return { scene, players: [who, watcher], badgeText: 'NOTHING LEFT TO SPEND', badgeClass: 'red' };
  },
};

// ── the bet, lost in public ───────────────────────────────────────────
const heldItAndLost = {
  id: 'suite-held-it-and-lost',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _heldWrongCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _heldWrongCast(house, ctx);
    if (!cast) return null;
    const { who, watcher } = cast;
    const scene = makeScene('suite.held', { a: who, b: watcher || null }, { ending: 'scene', intent: watcher ? 'seen' : 'alone' }, [], 'living-room');
    api.popDelta(who, 1);
    if (watcher) api.suspicion(watcher, who, 0.6);
    return { scene, players: [who, watcher].filter(Boolean),
      badgeText: 'THE BET, LOST IN PUBLIC', badgeClass: 'red' };
  },
};

// ── the count everybody is keeping ────────────────────────────────────
const countingTheEntries = {
  id: 'suite-counting-entries',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _exhaustedCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _exhaustedCast(house, ctx);
    if (!cast) return null;
    const { counter, bare, spent, left } = cast;
    const scene = makeScene('suite.count', { a: counter, b: bare }, { ending: 'scene', intent: left.length > 1 ? 'many' : 'one', spent: numberWord(spent.length), left: numberWord(left.length) }, [], 'kitchen');
    api.suspicion(counter, bare, 1.1);
    try { api.setTarget(counter, bare, 'no safety left to buy'); } catch { /* texture */ }
    return { scene, players: [counter, bare], badgeText: 'THE COUNT', badgeClass: 'blue' };
  },
};

// ── when to spend it ──────────────────────────────────────────────────
const whenToSpendIt = {
  id: 'suite-when-to-spend',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _timingCast(house, ctx) ? band(9, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _timingCast(house, ctx);
    if (!cast) return null;
    const { who, pressed } = cast;
    const scene = makeScene('suite.when', { a: who, b: pressed }, { ending: 'scene' }, [], 'backyard');
    api.addBond(who, pressed, 0.5);
    api.suspicion(pressed, who, 0.5);
    return { scene, players: [who, pressed], badgeText: 'NOT WHETHER — WHEN', badgeClass: 'blue' };
  },
};

export const SAFETY_SUITE_EVENTS = [
  thePlusOne, spentForNothing, heldItAndLost, countingTheEntries, whenToSpendIt,
];
