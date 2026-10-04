// ══════════════════════════════════════════════════════════════════════
// bb-events/punishments.js — a week of not being taken seriously
// ══════════════════════════════════════════════════════════════════════
//
// The costume already costs votes: `socialDrag` comes off every pitch the
// wearer makes, at both persuasion sites in the vote operation. This file is
// the other half — the reason it costs votes, shown rather than asserted.
//
// A punishment that only appeared in the announcement and then vanished would
// be a number in a formula. These fire every day it is on, so the viewer
// watches the tax being collected: a serious conversation ruined by a horn, a
// pitch nobody can hear over the suit, a tether that makes privacy impossible
// for two people instead of one.
//
// The tone is the point too. The house is not cruel about it — being sent into
// the capsule was an honour that went wrong, and the reaction that beats mockery
// is PITY, which is worse for the wearer's game than laughter and much worse
// for their jury résumé.
import { gs } from '../core.js';
import { BB_PUNISHMENTS, punishmentFor, activePunishments } from '../bb/punishments.js';
import { pStats, band, closestTo, furthestFrom } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

/** Whoever is serving something this week, and still in the house. */
const _wearers = (house, ctx) => activePunishments(ctx?.week?.num || 0)
  .filter(p => house.includes(p.name))
  .map(p => ({ p, def: BB_PUNISHMENTS[p.id] }))
  .filter(x => x.def);

const _wornCast = (house, ctx) => {
  const wearable = new Set(['egg-detective', 'red-unitard', 'lord-of-the-latrine', 'adam-and-eve']);
  const worn = _wearers(house, ctx).filter(x => wearable.has(x.p.id));
  if (!worn.length) return null;
  const { p, def } = worn[0];
  // The person who most needs this conversation to go well is the one it costs.
  const other = _others(house, p.name, p.partner)
    .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return other ? { p, def, who: p.name, other } : null;
};
const _tetherCast = (house, ctx) => {
  const worn = _wearers(house, ctx).filter(x => x.def.tether && x.p.partner
    && house.includes(x.p.partner));
  if (!worn.length) return null;
  const { p, def } = worn[0];
  return { p, def, who: p.name, partner: p.partner };
};
const _hornCast = (house, ctx) => {
  // The punishments that physically remove you from the room.
  const worn = _wearers(house, ctx).filter(x => ['hamazon', 'camp-guide', 'lord-of-the-latrine']
    .includes(x.p.id));
  if (!worn.length) return null;
  const { p, def } = worn[0];
  const mid = _others(house, p.name).sort((a, b) => pStats(b).social - pStats(a).social)[0];
  return mid ? { p, def, who: p.name, mid } : null;
};
const _pityCast = (house, ctx) => {
  const worn = _wearers(house, ctx);
  if (!worn.length) return null;
  const { p, def } = worn[0];
  const kind = closestTo(p.name, _others(house, p.name))
    || _others(house, p.name)[0];
  return kind ? { p, def, who: p.name, kind } : null;
};

// ── nobody negotiates with an egg ─────────────────────────────────────
const notTakenSeriously = {
  id: 'punish-not-taken-seriously',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _wornCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _wornCast(house, ctx);
    if (!cast) return null;
    const { def, who, other } = cast;
    const scene = makeScene('punish.serious', { a: who, b: other }, { ending: 'scene' }, [], 'living-room');
    api.popDelta(who, 1);
    api.suspicion(other, who, -0.4);
    return { scene, players: [who, other],
      badgeText: 'NOT TAKEN SERIOUSLY', badgeClass: 'red' };
  },
};

// ── the horn, at the worst possible moment ────────────────────────────
const theHorn = {
  id: 'punish-the-horn',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _hornCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _hornCast(house, ctx);
    if (!cast) return null;
    const { def, who, mid } = cast;
    const scene = makeScene('punish.horn', { a: who, b: mid }, { ending: 'scene' }, [], 'living-room');
    api.popDelta(who, 0.5);
    api.addBond(who, mid, -0.3);
    return { scene, players: [who, mid], badgeText: 'SUMMONED, AGAIN', badgeClass: 'red' };
  },
};

// ── two people, one punishment ────────────────────────────────────────
const theTether = {
  id: 'punish-the-tether',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _tetherCast(house, ctx) ? band(12, 15) : 0;
  },
  fire(house, ctx, api) {
    const cast = _tetherCast(house, ctx);
    if (!cast) return null;
    const { who, partner } = cast;
    const scene = makeScene('punish.tether', { a: who, b: partner }, { ending: 'scene' }, [], 'kitchen');
    api.addBond(who, partner, -0.8);
    api.suspicion(partner, who, 0.6);
    api.popDelta(partner, 1);
    return { scene, players: [who, partner], badgeText: 'TETHERED', badgeClass: 'red' };
  },
};

// ── pity, which is worse than mockery ─────────────────────────────────
const thePity = {
  id: 'punish-pity',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _pityCast(house, ctx) ? band(9, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _pityCast(house, ctx);
    if (!cast) return null;
    const { def, who, kind } = cast;
    const scene = makeScene('punish.pity', { a: who, b: kind }, { ending: 'scene' }, [], 'kitchen');
    api.addBond(who, kind, 0.6);
    api.popDelta(who, 1.5);
    return { scene, players: [who, kind], badgeText: 'PITIED', badgeClass: 'grey' };
  },
};

export const PUNISHMENT_EVENTS = [notTakenSeriously, theHorn, theTether, thePity];
