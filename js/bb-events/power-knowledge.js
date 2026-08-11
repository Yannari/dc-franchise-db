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
import { pronouns } from '../players.js';
import { pStats, band, closestTo, furthestFrom } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
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
    const p = pronouns(holder);
    const text = _variant([
      `${counter} keeps coming back to the same sum: ${holder} is holding something everybody has been told about, `
        + `and every week ${p.sub} ${p.sub === 'they' ? 'keep' : 'keeps'} it is a week it can go off.`,
      `"We know. That's the whole point — we KNOW." ${counter} cannot let it go, because a power you can see `
        + 'is the one kind you are allowed to plan around.',
      `${counter} would rather spend a nomination on ${holder} than spend a season wondering when it lands. `
        + 'It is not personal and it will absolutely be taken personally.',
      `${holder} has not done anything. ${counter} points out that this is precisely the argument for going now, `
        + 'while the doing has not happened yet.',
    ], ctx, holder, counter);
    api.suspicion(counter, holder, 1.4);
    try { api.setTarget(counter, holder, 'holding a power everybody can see'); } catch { /* texture */ }
    return { text, players: [holder, counter],
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
    const p = pronouns(holder);
    const weeks = left === 1 ? 'one more week' : `${left} more weeks`;
    const text = _variant([
      `${patient} does the other sum, the one nobody likes: ${weeks} and the thing in ${holder}'s pocket `
        + `stops existing on its own. Nominating ${holder} costs a week. Waiting costs nothing but nerve.`,
      `"It expires." ${patient} says it like a man refusing to panic, and is right, and will be unbearable about it if it works.`,
      `${patient} would rather outlast the power than spend a nomination on it, which is correct and requires `
        + `${weeks} of everybody else agreeing not to lose their heads.`,
      `The fuse is public too, so ${patient} has been counting it down out loud, which is doing more for `
        + `${holder}'s safety than ${p.posAdj} own campaigning has.`,
    ], ctx, holder, patient);
    api.suspicion(patient, holder, 0.5);
    return { text, players: [holder, patient],
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
    const p = pronouns(holder);
    const bait = furthestFrom(holder, _others(house, holder, counter))
      || _others(house, holder, counter)[0];
    const text = _variant([
      `${counter} does not want ${holder} gone this week. ${counter} wants that power SPENT, and is arranging `
        + `a week where using it is the only thing ${holder} can do.`,
      `The plan is to make the power worth less than the moment: put ${holder} somewhere ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} `
        + 'to burn it to get out, and then deal with an ordinary houseguest next week.',
      `"Force it out of ${p.obj}." ${counter} has said it three times today and each time it has sounded more like a plan.`,
      `${counter} floats a week aimed at ${bait} for no reason other than to see whether ${holder} moves to protect ${bait} `
        + 'and spends the thing doing it.',
    ], ctx, holder, counter);
    api.suspicion(counter, holder, 1.1);
    api.addBond(counter, holder, -0.5);
    return { text, players: [holder, counter, bait].filter(Boolean),
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
    const p = pronouns(holder);
    const text = _variant([
      `${holder} no longer has the power, but ${watcher} still checks every conversation for signs `
        + `${p.sub} ${p.sub === 'they' ? 'have' : 'has'} found something else. Once somebody produces one advantage, `
        + `the house starts imagining a second.`,
      `${holder} is carrying nothing now. ${watcher} keeps checking anyway, which is what a spent power actually costs you.`,
      `"They had one. Why would they only have one?" ${watcher} cannot prove it, cannot forget it, and cannot stop saying it.`,
      `Using it in public bought ${holder} a week and sold ${p.obj} the rest of the season as somebody to watch.`,
    ], ctx, holder, watcher);
    api.suspicion(watcher, holder, 1.2);
    return { text, players: [holder, watcher],
      badgeText: 'THEY HAD ONE ONCE', badgeClass: 'grey' };
  },
};

export const POWER_KNOWLEDGE_EVENTS = [theArithmetic, waitItOut, flushIt, theMarkItLeaves];
