// ══════════════════════════════════════════════════════════════════════
// bb-events/temptation.js — somebody said yes, and somebody else is paying
// ══════════════════════════════════════════════════════════════════════
//
// The Den's shape is the cruellest in the catalogue: one houseguest is offered
// real power for nothing, the price is paid by a houseguest drawn at random,
// and the house is told a curse landed without ever being told who caused it.
// The twist already models the mechanism and the blame — week.temptation
// carries `guesses`, the house's verdict, right or wrong.
//
// What it did not have was the days around it. A houseguest is sitting in a
// chair nobody chose for them. The room is hunting somebody it cannot find.
// Whoever the room settled on has to keep living here. And the person who
// actually said yes has to look sympathetic about it for a week.
//
// Two rules, both tested.
//
// The ENTRANT is never named as the entrant. Not in text, not in a badge, not
// as "whoever went in". The house knows a curse happened; it does not know a
// Den exists with a specific person's name on it. Everything the family says
// about blame goes through week.temptation.guesses — the room's own verdict,
// which is allowed to be wrong and frequently is.
//
// And the POWER is never named either. The house cannot see what was taken.
import { gs } from '../core.js';
import { pStats, band, perceived, closestTo, furthestFrom, isVillainous, isNice } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));

const _den = ctx => ctx?.week?.temptation || null;
const _taken = ctx => { const t = _den(ctx); return t && t.accepted ? t : null; };
const _refused = ctx => { const t = _den(ctx); return t && t.accepted === false ? t : null; };
/** Internal casting only — never narrated as the person who went in. */
const _entrant = ctx => _den(ctx)?.entrant || null;
const _guesses = ctx => (_taken(ctx)?.guesses || []).filter(g => g && g.who && g.guess);

// Casting shared by weight() and fire(): a positive weight is a promise.
const _cursedCast = (house, ctx) => {
  const t = _taken(ctx);
  const cursed = t?.cursed;
  if (!cursed || !house.includes(cursed)) return null;
  const witness = closestTo(cursed, _others(house, cursed));
  return { t, cursed, witness };
};
const _huntCast = (house, ctx) => {
  const g = _guesses(ctx).find(x => house.includes(x.who) && house.includes(x.guess) && x.who !== x.guess);
  if (!g) return null;
  const bystander = _others(house, g.who, g.guess)[0] || null;
  return { g, bystander };
};
const _innocentCast = (house, ctx) => {
  const g = _guesses(ctx).find(x => !x.correct && house.includes(x.who) && house.includes(x.guess));
  if (!g) return null;
  const ally = closestTo(g.guess, _others(house, g.guess, g.who));
  return { g, ally };
};
const _debateCast = (house, ctx) => {
  const t = _den(ctx);
  if (!t) return null;
  // The person who actually said yes does not get to be the one loudly
  // announcing they would say yes. It reads as a wink and it IS one: casting
  // them here puts their name in the same breath as accepting, which is the
  // one sentence this family is not allowed to write.
  const pool = _others(house, _entrant(ctx));
  if (pool.length < 2) return null;
  const taker = pool.filter(isVillainous).sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0]
    || [...pool].sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
  const refuser = pool.filter(n => n !== taker && isNice(n))[0]
    || _others(pool, taker).sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
  return taker && refuser && taker !== refuser ? { taker, refuser } : null;
};
const _performCast = (house, ctx) => {
  const t = _taken(ctx);
  const who = _entrant(ctx);
  if (!t || !who || !house.includes(who) || !t.cursed || t.cursed === who) return null;
  const watcher = _others(house, who, t.cursed)
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { t, who, watcher } : null;
};
const _refusedCast = (house, ctx) => {
  const t = _refused(ctx);
  const who = t?.entrant;
  if (!who || !house.includes(who)) return null;
  return { t, who };
};

/** A den that already happened, for the wariness it leaves behind. */
function _lastDen(ctx) {
  const weeks = gs?.bb?.weeks || [];
  const now = ctx?.week?.num || 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i];
    if (w && w.num < now && now - w.num <= 1
      && w.temptation?.accepted && w.temptation.cursed) return w;
  }
  return null;
}
const _afterCast = (house, ctx) => {
  const last = _lastDen(ctx);
  const cursed = last?.temptation?.cursed;
  if (!cursed || !house.includes(cursed) || _den(ctx)) return null;
  const wary = _others(house, cursed).sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return wary ? { cursed, wary } : null;
};

// ── the chair nobody chose ────────────────────────────────────────────
const carriesIt = {
  id: 'temptation-carries-it',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _cursedCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _cursedCast(house, ctx);
    if (!cast) return null;
    const { cursed, witness } = cast;
    const st = pStats(cursed);
    // A volatile houseguest does not take this quietly; a composed one banks
    // it, which is worse for everybody later.
    const loud = st.temperament <= 5;
    const scene = makeScene('tempt.carries', { a: cursed, b: witness || null }, { ending: loud ? 'loud' : 'banking', intent: witness ? 'told' : 'alone' }, [], 'kitchen');
    // Being cursed is sympathy, and sympathy is a resource.
    api.popDelta(cursed, 1);
    if (witness) api.addBond(cursed, witness, 0.4);
    return { scene, players: [cursed, witness].filter(Boolean),
      badgeText: loud ? 'NOMINATED BY NOBODY' : 'BANKING IT', badgeClass: loud ? 'red' : 'grey' };
  },
};

// ── the hunt ──────────────────────────────────────────────────────────
const hunting = {
  id: 'temptation-hunting',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _huntCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _huntCast(house, ctx);
    if (!cast) return null;
    const { g, bystander } = cast;
    const scene = makeScene('tempt.hunt', { a: g.who, b: g.guess, c: bystander || null }, { ending: 'scene' }, [], 'living-room');
    api.suspicion(g.who, g.guess, 1.2);
    if (bystander) api.suspicion(bystander, g.guess, 0.5);
    return { scene, players: [g.who, g.guess, bystander].filter(Boolean),
      badgeText: g.correct ? 'CLOSING IN' : 'THE WRONG NAME',
      badgeClass: g.correct ? 'gold' : 'red' };
  },
};

// ── the innocent, paying ──────────────────────────────────────────────
const innocentPays = {
  id: 'temptation-innocent-pays',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _innocentCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _innocentCast(house, ctx);
    if (!cast) return null;
    const { g, ally } = cast;
    const scene = makeScene('tempt.innocent', { a: g.guess, b: g.who, c: ally || null }, { ending: 'scene' }, [], 'living-room');
    api.addBond(g.guess, g.who, -0.9);
    try { api.remember(g.guess, g.who, 'grudge', 2, { twist: 'bb-den-of-temptation', accusedOf: 'the curse' }); } catch { /* texture */ }
    if (ally) api.addBond(g.guess, ally, 0.5);
    return { scene, players: [g.guess, g.who, ally].filter(Boolean),
      badgeText: 'GUILTY OF NOTHING', badgeClass: 'red' };
  },
};

// ── would you have taken it ───────────────────────────────────────────
const wouldYouTake = {
  id: 'temptation-would-you-take-it',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _debateCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _debateCast(house, ctx);
    if (!cast) return null;
    const { taker, refuser } = cast;
    const scene = makeScene('tempt.debate', { a: taker, b: refuser }, { ending: 'scene' }, [], 'kitchen');
    // Saying you would take it is a thing the house remembers about you.
    api.suspicion(refuser, taker, 0.8);
    api.popDelta(taker, 0.5);
    api.addBond(taker, refuser, -0.3);
    return { scene, players: [taker, refuser], badgeText: 'WOULD YOU TAKE IT', badgeClass: 'grey' };
  },
};

// ── the one who said yes, being sorry about it ────────────────────────
const performingSympathy = {
  id: 'temptation-performing-sympathy',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _performCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _performCast(house, ctx);
    if (!cast) return null;
    const { t, who, watcher } = cast;
    const st = pStats(who);
    // The tell is doing too much for the person you put in that chair.
    const overplayed = pStats(watcher).intuition >= 7 && st.strategic <= 6;
    const scene = makeScene('tempt.perform', { a: who, b: watcher }, { ending: overplayed ? 'overplayed' : 'quiet', cursed: t.cursed }, [], 'kitchen');
    if (overplayed) {
      api.suspicion(watcher, who, 1.5);
      try { api.remember(watcher, who, 'suspected-the-den', 1, { twist: 'bb-den-of-temptation', correct: true }); } catch { /* texture */ }
    }
    return { scene, players: [who, watcher],
      badgeText: overplayed ? 'A LOT OF SYMPATHY' : 'NOTHING TO SEE',
      badgeClass: overplayed ? 'gold' : 'grey' };
  },
};

// ── the offer nobody knows was refused ────────────────────────────────
const refusedIt = {
  id: 'temptation-refused',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _refusedCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _refusedCast(house, ctx);
    if (!cast) return null;
    const { who } = cast;
    const confidant = closestTo(who, _others(house, who));
    const scene = makeScene('tempt.refused', { a: who, b: confidant || null }, { ending: 'scene', intent: confidant ? 'told' : 'alone' }, [], 'bedroom');
    // Nothing public happens. What changes is what they think of themselves.
    api.popDelta(who, 0.5);
    return { scene, players: [who, confidant].filter(Boolean), badgeText: 'NOBODY WILL EVER KNOW', badgeClass: 'blue' };
  },
};

// ── the week after ────────────────────────────────────────────────────
const afterwards = {
  id: 'temptation-afterwards',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _afterCast(house, ctx) ? band(7, 11) : 0;
  },
  fire(house, ctx, api) {
    const cast = _afterCast(house, ctx);
    if (!cast) return null;
    const { cursed, wary } = cast;
    const scene = makeScene('tempt.after', { a: wary, b: cursed }, { ending: 'scene' }, [], 'backyard');
    api.popDelta(cursed, 0.5);
    return { scene, players: [wary, cursed], badgeText: 'AFTER THE CURSE', badgeClass: 'grey' };
  },
};

export const TEMPTATION_EVENTS = [
  carriesIt, hunting, innocentPays, wouldYouTake,
  performingSympathy, refusedIt, afterwards,
];
