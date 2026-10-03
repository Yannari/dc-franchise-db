// ══════════════════════════════════════════════════════════════════════
// bb-events/americas-nominee.js — nominated by a room nobody can see
// ══════════════════════════════════════════════════════════════════════
//
// BB15's third chair, and the only anonymous nomination in this game where the
// culprit may genuinely not be in the building.
//
// That is the whole flavour, and it is different from Roadkill and the Hacker
// in one specific way: those twists hide a houseguest, so hunting is at least
// pointed at somebody real. Here the house is told a third nominee exists and
// is left to work out whether one of them did it or whether the country did —
// and in the direct variant the honest answer is that nobody in that room is
// guilty of anything. They will still find somebody.
//
// The MVP variant does hide a real person: the audience votes a houseguest
// Most Valuable Player and only that houseguest is told. So the same family
// covers a hunt with a right answer and a hunt without one, and the difference
// is invisible from inside the house, which is the joke.
//
// Rules: the MVP is never named as the MVP, and no beat may state that the
// audience chose a particular name — the house does not get to see the vote.
import { gs } from '../core.js';
import { pStats, band, perceived, closestTo, furthestFrom } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));

const _an = ctx => ctx?.week?.americasNominee || null;
/** Internal casting only — never narrated as the person who holds the vote. */
const _mvp = ctx => _an(ctx)?.mvp || null;

const _chairCast = (house, ctx) => {
  const a = _an(ctx);
  if (!a || !house.includes(a.nominee)) return null;
  const confidant = closestTo(a.nominee, _others(house, a.nominee));
  return { a, who: a.nominee, confidant };
};
const _huntCast = (house, ctx) => {
  const a = _an(ctx);
  if (!a) return null;
  const pool = _others(house, a.nominee);
  if (pool.length < 2) return null;
  const accuser = [...pool].sort((x, y) => pStats(x).temperament - pStats(y).temperament)[0];
  const accused = furthestFrom(accuser, _others(pool, accuser));
  return accuser && accused ? { a, accuser, accused } : null;
};
const _outsideCast = (house, ctx) => {
  const a = _an(ctx);
  if (!a || !house.length) return null;
  const reader = [...house].sort((x, y) => pStats(y).intuition - pStats(x).intuition)[0];
  const mark = _others(house, reader)[0] || null;
  return reader ? { a, reader, mark } : null;
};
const _cameraCast = (house, ctx) => {
  const a = _an(ctx);
  if (!a) return null;
  const pool = _others(house, a.nominee);
  const performer = [...pool].sort((x, y) => pStats(y).social - pStats(x).social)[0];
  const watcher = _others(pool, performer)[0] || null;
  return performer ? { a, performer, watcher } : null;
};
const _mvpCast = (house, ctx) => {
  const a = _an(ctx);
  const mvp = _mvp(ctx);
  if (!a || a.style !== 'mvp' || !mvp || !house.includes(mvp)) return null;
  const watcher = _others(house, mvp, a.nominee)
    .sort((x, y) => pStats(y).intuition - pStats(x).intuition)[0];
  return watcher ? { a, mvp, watcher } : null;
};

// ── the chair nobody in the room filled ───────────────────────────────
const theChair = {
  id: 'americas-chair',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _chairCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _chairCast(house, ctx);
    if (!cast) return null;
    const { who, confidant } = cast;
    const scene = makeScene('an.chair', { a: who, b: confidant || null }, { ending: 'scene', intent: confidant ? 'told' : 'alone' }, [], 'kitchen');
    api.popDelta(who, 1.5);
    if (confidant) api.addBond(who, confidant, 0.4);
    return { scene, players: [who, confidant].filter(Boolean),
      badgeText: 'NOBODY TO CAMPAIGN TO', badgeClass: 'red' };
  },
};

// ── they hunt anyway ──────────────────────────────────────────────────
const huntAnyway = {
  id: 'americas-hunt',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _huntCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _huntCast(house, ctx);
    if (!cast) return null;
    const { a, accuser, accused } = cast;
    // In the direct variant there is genuinely nobody to catch, which does not
    // slow the house down at all.
    const guiltyExists = a.style === 'mvp';
    const scene = makeScene('an.hunt', { a: accuser, b: accused }, { ending: 'scene' }, [], 'kitchen');
    api.suspicion(accuser, accused, 1.3);
    api.addBond(accused, accuser, -0.7);
    try { api.remember(accused, accuser, 'grudge', 1, { twist: 'bb-americas-nominee', guiltyExists }); } catch { /* texture */ }
    return { scene, players: [accuser, accused],
      badgeText: guiltyExists ? 'A NAME, PROBABLY WRONG' : 'GUILTY OF NOTHING, NECESSARILY',
      badgeClass: 'red' };
  },
};

// ── the room they cannot see ──────────────────────────────────────────
const theOutsideRoom = {
  id: 'americas-outside-room',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _outsideCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _outsideCast(house, ctx);
    if (!cast) return null;
    const { reader, mark } = cast;
    const scene = makeScene('an.outside', { a: reader, b: mark || null }, { ending: 'scene', intent: mark ? 'heard' : 'alone' }, [], 'living-room');
    return { scene, players: [reader, mark].filter(Boolean),
      badgeText: 'A ROOM THEY CANNOT SEE', badgeClass: 'blue' };
  },
};

// ── playing to the cameras ────────────────────────────────────────────
const playingToCamera = {
  id: 'americas-playing-to-camera',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _cameraCast(house, ctx) ? band(9, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _cameraCast(house, ctx);
    if (!cast) return null;
    const { performer, watcher } = cast;
    const scene = makeScene('an.camera', { a: performer, b: watcher || null }, { ending: 'scene', intent: watcher ? 'seen' : 'alone' }, [], 'living-room');
    api.popDelta(performer, 1.5);
    if (watcher) api.suspicion(watcher, performer, 0.6);
    return { scene, players: [performer, watcher].filter(Boolean),
      badgeText: 'PLAYING TO THE ROOM OUTSIDE', badgeClass: 'gold' };
  },
};

// ── the MVP, being no more curious than anybody else ──────────────────
const theMvp = {
  id: 'americas-mvp-quiet',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _mvpCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _mvpCast(house, ctx);
    if (!cast) return null;
    const { a, mvp, watcher } = cast;
    const st = pStats(mvp);
    const overplayed = pStats(watcher).intuition >= 7 && st.strategic <= 6;
    const scene = makeScene('an.mvp', { a: mvp, b: watcher }, { ending: overplayed ? 'overplayed' : 'quiet', nominee: a.nominee }, [], 'kitchen');
    if (overplayed) {
      api.suspicion(watcher, mvp, 1.4);
      try { api.remember(watcher, mvp, 'suspected-mvp', 1, { twist: 'bb-americas-nominee' }); } catch { /* texture */ }
    }
    return { scene, players: [mvp, watcher],
      badgeText: overplayed ? 'A LITTLE TOO INVESTED' : 'AS BAFFLED AS ANYBODY',
      badgeClass: overplayed ? 'gold' : 'grey' };
  },
};

export const AMERICAS_NOMINEE_EVENTS = [
  theChair, huntAnyway, theOutsideRoom, playingToCamera, theMvp,
];
