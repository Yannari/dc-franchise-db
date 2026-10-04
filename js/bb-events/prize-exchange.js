// ══════════════════════════════════════════════════════════════════════
// bb-events/prize-exchange.js — what a trade is remembered as
// ══════════════════════════════════════════════════════════════════════
//
// The exchange produces the most legible act in this game — everybody watched
// every trade, nothing was hidden, and the ledger is public — and until now
// all of it died inside the act. Nobody in the house ever mentioned it again.
//
// What makes this family different from the rest of the folder is that there
// is nothing to suspect. Every other twist here runs on incomplete information;
// this one runs on total information and a decision everybody saw you make. So
// the beats are not hunts, they are verdicts:
//
//   the sell-out     somebody chose money over the only thing that could have
//                    saved them, in public, and a jury will hear about it
//   the robbery      taking the veto off a nominee is not a trade, it is a
//                    declaration — and the person it was taken from has to
//                    campaign for their life afterwards
//   the mercy        somebody could have taken it and did not. That is either
//                    loyalty or cowardice and the house cannot tell which
//   the costume      two people spend the week in something ridiculous, and it
//                    costs them every conversation
//
// The act carries `steals` with `kind` and `gave`, so which of these fired is
// a fact about the week rather than a guess.
import { pStats, band, closestTo } from './_read.js';
import { BB_PUNISHMENTS } from '../bb/punishments.js';
import { makeScene } from '../bb/script/scene.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

/**
 * The live exchange. These scenes refer to the current block, current veto and
 * punishments just assigned, so joining last week's exchange to this week's
 * nominees creates a convincing but entirely false story.
 */
const _exchange = ctx => ctx?.week?.prizeExchange || null;

/** Somebody who was on the block and walked away holding a prize instead. */
const _soldOutCast = (house, ctx) => {
  const ex = _exchange(ctx);
  if (!ex) return null;
  const noms = ctx?.week?.finalNominees || ctx?.week?.initialNominees || [];
  const who = (ex.held || []).find(h => h.kind === 'prize' && noms.includes(h.name)
    && house.includes(h.name));
  if (!who) return null;
  const judge = _others(house, who.name)
    .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return judge ? { ex, who: who.name, item: who.item, judge } : null;
};
/** The veto taken off somebody who was sitting on the block. */
const _robbedCast = (house, ctx) => {
  const ex = _exchange(ctx);
  const steal = (ex?.steals || []).find(s => s.kind === 'veto');
  if (!steal || !house.includes(steal.victim) || !house.includes(steal.thief)) return null;
  const noms = ctx?.week?.finalNominees || ctx?.week?.initialNominees || [];
  return { ex, victim: steal.victim, thief: steal.thief,
    onBlock: noms.includes(steal.victim), gave: steal.gave };
};
/** Somebody who traded the veto AWAY for a prize. */
const _gaveItAwayCast = (house, ctx) => {
  const ex = _exchange(ctx);
  const steal = (ex?.steals || []).find(s => s.gaveKind === 'veto');
  if (!steal || !house.includes(steal.thief)) return null;
  const watcher = _others(house, steal.thief)
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { ex, who: steal.thief, took: steal.item, watcher } : null;
};
/** Who is wearing what, out of the boxes. */
const _costumeCast = (house, ctx) => {
  const ex = _exchange(ctx);
  const worn = (ex?.punished || []).filter(p => house.includes(p.name));
  if (!worn.length) return null;
  const who = worn[0];
  const other = _others(house, who.name)
    .sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
  const def = BB_PUNISHMENTS[who.id] || null;
  return other ? { ex, who: who.name, item: who.punishment, def, other, all: worn } : null;
};

// ── the money, in front of a jury ─────────────────────────────────────
const choseTheMoney = {
  id: 'exchange-chose-the-money',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _soldOutCast(house, ctx) ? band(12, 15) : 0;
  },
  fire(house, ctx, api) {
    const cast = _soldOutCast(house, ctx);
    if (!cast) return null;
    const { who, item, judge } = cast;
    const scene = makeScene('swap.money', { a: who, b: judge }, { ending: 'scene', item }, [], 'living-room');
    api.popDelta(who, -1);
    api.suspicion(judge, who, 0.8);
    try { api.remember(judge, who, 'chose-a-prize-over-the-veto', 2, { twist: 'bb-prizes-and-punishments', item }); } catch { /* texture */ }
    return { scene, players: [who, judge], badgeText: 'A JURY WILL HEAR THIS', badgeClass: 'red' };
  },
};

// ── taking a lifeline is a declaration ────────────────────────────────
const theRobbery = {
  id: 'exchange-the-robbery',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    const cast = _robbedCast(house, ctx);
    return cast && cast.onBlock ? band(13, 16) : 0;
  },
  fire(house, ctx, api) {
    const cast = _robbedCast(house, ctx);
    if (!cast) return null;
    const { victim, thief, gave } = cast;
    const scene = makeScene('swap.robbery', { a: victim, b: thief }, { ending: 'scene', gave }, [], 'living-room');
    api.addBond(victim, thief, -2.2);
    api.suspicion(victim, thief, 1.8);
    api.popDelta(victim, 1.5);
    try { api.setTarget(victim, thief, 'took the veto off me on the block'); } catch { /* texture */ }
    try { api.remember(victim, thief, 'robbed-me-of-the-veto', 3, { twist: 'bb-prizes-and-punishments' }); } catch { /* texture */ }
    return { scene, players: [victim, thief], badgeText: 'NOT A TRADE', badgeClass: 'red' };
  },
};

// ── letting it go ─────────────────────────────────────────────────────
const gaveItAway = {
  id: 'exchange-gave-it-away',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _gaveItAwayCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _gaveItAwayCast(house, ctx);
    if (!cast) return null;
    const { who, took, watcher } = cast;
    const scene = makeScene('swap.gave', { a: who, b: watcher }, { ending: 'scene', took }, [], 'kitchen');
    api.suspicion(watcher, who, 0.9);
    return { scene, players: [who, watcher], badgeText: 'LET IT GO', badgeClass: 'blue' };
  },
};

// ── and the ones in the costumes ──────────────────────────────────────
const outOfTheBoxes = {
  id: 'exchange-out-of-the-boxes',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _costumeCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _costumeCast(house, ctx);
    if (!cast) return null;
    const { who, item, other, all } = cast;
    const scene = makeScene('swap.boxes', { a: who, b: other }, { ending: 'scene', item }, [], 'kitchen');
    api.popDelta(who, 1);
    api.suspicion(other, who, -0.3);
    // The trailing slot is "somebody else still serving it" and was taken
    // straight off the list, so when that happened to be `other` the card
    // showed the same face twice.
    const alsoWearing = all.slice(1, 3).map(x => x.name).filter(n => n !== who && n !== other);
    return { scene, players: [who, other, alsoWearing[0]].filter(Boolean),
      badgeText: 'STILL WEARING IT', badgeClass: 'red' };
  },
};

export const PRIZE_EXCHANGE_EVENTS = [choseTheMoney, theRobbery, gaveItAway, outOfTheBoxes];
