// ══════════════════════════════════════════════════════════════════════
// bb-events/power-knowledge.js — what the house does about what it knows
// ══════════════════════════════════════════════════════════════════════
//
// The secret twists each run their own hunt: the Hacker, Roadkill, the Coin and
// the Den all have families about a house trying to work out who did something.
// This one is the opposite case, and it had nothing at all.
//
// When a power is PUBLIC, there is no mystery and no hunt. The room has been
// told exactly who is holding a game-changer, which turns a puzzle into
// arithmetic — and the arithmetic is genuinely interesting, because there are
// three correct answers and the house has to pick one:
//
//   take them out now      before it can be used, at the cost of a week spent
//                          on somebody who was not otherwise a problem
//   wait it out            powers expire, and a fuse is a thing you can simply
//                          outlast if you can afford the weeks
//   make them spend it     force them into a position where burning it is the
//                          only move, and then they are ordinary again
//
// And a power that has already gone off leaves a mark that outlasts it: the
// house has learned who ends up holding things, which is not a fact about this
// week at all.
import { gs } from '../core.js';
import { pStats, band, closestTo, furthestFrom } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

/** Which room a scene happens in: by hash, never a die. */
function _room(rooms, ctx, ...people) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${people.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return rooms[hash % rooms.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

const _store = () => { try { return gs.bb?.powers || []; } catch { return []; } };

/** Live, public, unspent — the only kind the house may act on by name. */
const _knownHolders = (house, week) => _store()
  .filter(p => p.visibility === 'public' && !p.used && !p.disposed
    && (!week || week <= p.expiresAfterWeek) && house.includes(p.holder));
/** Fired in front of everybody, whatever it was before. */
const _spent = (house, week) => _store()
  .filter(p => p.used && house.includes(p.holder) && (!week || p.usedWeek <= week));

const _knownCast = (house, ctx) => {
  const week = ctx?.week?.num || 0;
  const known = _knownHolders(house, week);
  if (!known.length) return null;
  const inst = known[0];
  const counter = _others(house, inst.holder)
    .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return counter ? { inst, holder: inst.holder, counter, week } : null;
};
const _waitCast = (house, ctx) => {
  const week = ctx?.week?.num || 0;
  const known = _knownHolders(house, week).filter(p => p.expiresAfterWeek > week);
  if (!known.length) return null;
  const inst = known[0];
  const patient = _others(house, inst.holder)
    .sort((a, b) => pStats(b).temperament - pStats(a).temperament)[0];
  return patient ? { inst, holder: inst.holder, patient,
    left: inst.expiresAfterWeek - week } : null;
};
const _spentCast = (house, ctx) => {
  const week = ctx?.week?.num || 0;
  const gone = _spent(house, week);
  if (!gone.length) return null;
  const inst = gone[gone.length - 1];
  const watcher = _others(house, inst.holder)
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { inst, holder: inst.holder, watcher } : null;
};

// ── the arithmetic on a known holder ──────────────────────────────────
const theArithmetic = {
  id: 'powerknown-arithmetic',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _knownCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _knownCast(house, ctx);
    if (!cast) return null;
    const { holder, counter } = cast;
    const scene = makeScene('known.target', { a: holder, b: counter }, { ending: 'scene' }, [], _room(['kitchen', 'living-room', 'backyard', 'bedroom'], ctx, holder, counter));
    api.suspicion(counter, holder, 1.4);
    try { api.setTarget(counter, holder, 'holding a power everybody can see'); } catch { /* texture */ }
    return { scene, players: [holder, counter],
      badgeText: 'BEFORE IT GOES OFF', badgeClass: 'red' };
  },
};

// ── or simply outlasting it ───────────────────────────────────────────
const waitItOut = {
  id: 'powerknown-wait',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _waitCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _waitCast(house, ctx);
    if (!cast) return null;
    const { holder, patient, left } = cast;
    const weeks = left === 1 ? 'one more week' : `${left} more weeks`;
    const scene = makeScene('known.wait', { a: holder, b: patient }, { ending: 'scene', weeks }, [], _room(['kitchen', 'living-room', 'backyard', 'bedroom'], ctx, holder, patient));
    api.suspicion(patient, holder, 0.5);
    return { scene, players: [holder, patient],
      badgeText: 'OUTLAST IT', badgeClass: 'blue' };
  },
};

// ── make them burn it ─────────────────────────────────────────────────
const flushIt = {
  id: 'powerknown-flush',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    const cast = _knownCast(house, ctx);
    // The aggressive answer, and only the aggressive players reach for it.
    return cast && pStats(cast.counter).boldness >= 6 ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _knownCast(house, ctx);
    if (!cast) return null;
    const { holder, counter } = cast;
    const bait = furthestFrom(holder, _others(house, holder, counter))
      || _others(house, holder, counter)[0];
    const scene = makeScene('known.flush', { a: holder, b: counter }, { ending: 'scene', target: bait || null }, [], _room(['kitchen', 'living-room', 'backyard', 'bedroom'], ctx, holder, counter));
    api.suspicion(counter, holder, 1.1);
    api.addBond(counter, holder, -0.5);
    return { scene, players: [holder, counter, bait].filter(Boolean),
      badgeText: 'FLUSH IT OUT', badgeClass: 'gold' };
  },
};

// ── the mark a spent power leaves ─────────────────────────────────────
const theMarkItLeaves = {
  id: 'powerknown-spent-mark',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _spentCast(house, ctx) ? band(9, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _spentCast(house, ctx);
    if (!cast) return null;
    const { holder, watcher } = cast;
    const scene = makeScene('known.spent', { a: holder, b: watcher }, { ending: 'scene' }, [], _room(['kitchen', 'living-room', 'backyard', 'bedroom'], ctx, holder, watcher));
    api.suspicion(watcher, holder, 1.2);
    return { scene, players: [holder, watcher],
      badgeText: 'THEY HAD ONE ONCE', badgeClass: 'grey' };
  },
};

export const POWER_KNOWLEDGE_EVENTS = [theArithmetic, waitItOut, flushIt, theMarkItLeaves];
