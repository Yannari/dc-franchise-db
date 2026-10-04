// ══════════════════════════════════════════════════════════════════════
// bb-events/whacktivity.js — everybody saw which door you walked through
// ══════════════════════════════════════════════════════════════════════
//
// Every other secret twist in this house hides the ACT. The Whacktivity hides
// the outcome and makes the WANTING public: three labelled doors, and you walk
// through one of them across a room full of people who are all watching which
// one. There is no version of playing this that is quiet.
//
// So this family is the only one that gets to work with facts. The house
// legitimately knows:
//
//   who walked through which door — and therefore which power they wanted
//   who refused to walk at all, which is its own announcement
//   which room opened, and so who the five suspects are
//
// And it does not know the one thing that matters: whether anybody won, or
// who. The suspect list is published in advance and is still wrong most of the
// time, which is a completely different flavour of paranoia from the Hacker's
// blind hunt — this one is concentrated, justified, and aimed at four innocent
// people and one guilty one.
//
// The rule: the winner is never named as the winner, and no beat may say a
// power changed hands. Everything else about that night is fair game, because
// the house was standing there.
import { gs } from '../core.js';
import { pStats, band, perceived, closestTo, furthestFrom, isVillainous } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));

const _whack = ctx => ctx?.week?.whacktivity || null;
const _rooms = ctx => (_whack(ctx)?.rooms || []).filter(Boolean);
const _openRoom = ctx => _rooms(ctx).find(r => r.opened) || null;
const _shutRooms = ctx => _rooms(ctx).filter(r => !r.opened && (r.entrants || []).length);
/** Internal casting only — never narrated as having won anything. */
const _winner = ctx => _openRoom(ctx)?.winner || null;

// Casting shared by weight() and fire(), because a positive weight is a
// promise the scheduler holds the event to.
const _declaredCast = (house, ctx) => {
  const rooms = _rooms(ctx).filter(r => (r.entrants || []).length);
  for (const r of rooms) {
    const who = (r.entrants || []).find(n => house.includes(n));
    if (!who) continue;
    const watcher = _others(house, who)
      .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
    if (watcher) return { room: r, who, watcher };
  }
  return null;
};
const _crowdCast = (house, ctx) => {
  const room = _rooms(ctx)
    .filter(r => (r.entrants || []).filter(n => house.includes(n)).length >= 3)
    .sort((a, b) => b.entrants.length - a.entrants.length)[0];
  if (!room) return null;
  const inIt = room.entrants.filter(n => house.includes(n));
  return { room, a: inIt[0], b: inIt[1], rest: inIt.slice(2) };
};
const _shutCast = (house, ctx) => {
  const room = _shutRooms(ctx).find(r => (r.entrants || []).some(n => house.includes(n)));
  if (!room) return null;
  const who = room.entrants.find(n => house.includes(n));
  const watcher = _others(house, who)[0] || null;
  return who ? { room, who, watcher } : null;
};
const _satOutCast = (house, ctx) => {
  const sat = (_whack(ctx)?.satOut || []).filter(n => house.includes(n));
  if (!sat.length) return null;
  const who = [...sat].sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  const reader = _others(house, who).sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return reader ? { who, reader } : null;
};
const _suspectCast = (house, ctx) => {
  const room = _openRoom(ctx);
  const inIt = (room?.entrants || []).filter(n => house.includes(n));
  if (!room || inIt.length < 2) return null;
  const watcher = _others(house, ...inIt)
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { room, inIt, watcher } : null;
};
const _hohCast = (house, ctx) => {
  const w = _whack(ctx);
  const hoh = w?.hoh;
  if (!hoh || !house.includes(hoh) || ctx?.week?.hohSecret) return null;
  const walkers = _rooms(ctx).flatMap(r => r.entrants || []).filter(n => house.includes(n) && n !== hoh);
  if (!walkers.length) return null;
  const mark = furthestFrom(hoh, walkers) || walkers[0];
  return { hoh, mark, count: walkers.length };
};
const _performCast = (house, ctx) => {
  const who = _winner(ctx);
  if (!who || !house.includes(who)) return null;
  const room = _openRoom(ctx);
  const watcher = _others(house, ...(room?.entrants || []))
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { who, watcher, room } : null;
};

/** A Whacktivity that already happened, for the suspicion it leaves behind. */
function _lastWhack(ctx) {
  const weeks = gs?.bb?.weeks || [];
  const now = ctx?.week?.num || 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i];
    if (w && w.num < now && now - w.num <= 1
      && w.whacktivity?.rooms?.some(r => r.opened && (r.entrants || []).length)) return w;
  }
  return null;
}
const _afterCast = (house, ctx) => {
  if (_whack(ctx)) return null;                       // not the same week
  const last = _lastWhack(ctx);
  const room = (last?.whacktivity?.rooms || []).find(r => r.opened && (r.entrants || []).length);
  const inIt = (room?.entrants || []).filter(n => house.includes(n));
  if (!inIt.length) return null;
  const watcher = _others(house, ...inIt)
    .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return watcher ? { room, inIt, watcher } : null;
};

// ── you told everybody what you wanted ────────────────────────────────
const declaredIt = {
  id: 'whack-declared-it',
  category: 'social',
  weight(house, ctx) {
    if (!_whack(ctx) || ctx.act !== 'house') return 0;
    return _declaredCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _declaredCast(house, ctx);
    if (!cast) return null;
    const { room, who, watcher } = cast;
    const scene = makeScene('whack.declared', { a: who, b: watcher }, { ending: 'scene', power: room.power }, [], 'living-room');
    api.suspicion(watcher, who, 1.1);
    try { api.remember(watcher, who, 'wanted-power', 1, { twist: 'bb-whacktivity', door: room.power }); } catch { /* texture */ }
    return { scene, players: [who, watcher], badgeText: 'SAID IT OUT LOUD', badgeClass: 'gold' };
  },
};

// ── the crowded door ──────────────────────────────────────────────────
const crowdedRoom = {
  id: 'whack-crowded-room',
  category: 'social',
  weight(house, ctx) {
    if (!_whack(ctx) || ctx.act !== 'house') return 0;
    return _crowdCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _crowdCast(house, ctx);
    if (!cast) return null;
    const { room, a, b, rest } = cast;
    const others = rest.length ? ` (and ${rest.slice(0, 2).join(', ')})` : '';
    const scene = makeScene('whack.crowd', { a, b, c: rest[0] || null }, { ending: 'scene', power: room.power }, [], 'living-room');
    api.addBond(a, b, -0.6);
    api.suspicion(a, b, 0.7);
    api.suspicion(b, a, 0.7);
    return { scene, players: [a, b, ...rest.slice(0, 2)], badgeText: 'A CROWDED DOOR', badgeClass: 'red' };
  },
};

// ── the door that never opened ────────────────────────────────────────
const stayedShut = {
  id: 'whack-stayed-shut',
  category: 'social',
  weight(house, ctx) {
    if (!_whack(ctx) || ctx.act !== 'house') return 0;
    return _shutCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _shutCast(house, ctx);
    if (!cast) return null;
    const { room, who, watcher } = cast;
    const scene = makeScene('whack.shut', { a: who, b: watcher || null }, { ending: 'scene', intent: watcher ? 'seen' : 'alone', power: room.power }, [], 'living-room');
    // The cost lands even though the room stayed shut, which is the twist.
    if (watcher) api.suspicion(watcher, who, 0.9);
    api.popDelta(who, 0.5);
    return { scene, players: [who, watcher].filter(Boolean),
      badgeText: 'PAID FOR NOTHING', badgeClass: 'red' };
  },
};

// ── the people who would not walk ─────────────────────────────────────
const satItOut = {
  id: 'whack-sat-it-out',
  category: 'social',
  weight(house, ctx) {
    if (!_whack(ctx) || ctx.act !== 'house') return 0;
    return _satOutCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _satOutCast(house, ctx);
    if (!cast) return null;
    const { who, reader } = cast;
    const safe = pStats(who).strategic >= 6;
    const scene = makeScene('whack.satout', { a: who, b: reader }, { ending: safe ? 'safe' : 'scared' }, [], 'living-room');
    api.suspicion(reader, who, safe ? 0.8 : 0.4);
    if (!safe) api.popDelta(who, -0.5);
    return { scene, players: [who, reader],
      badgeText: safe ? 'TOO COMFORTABLE TO PLAY' : 'DID NOT MOVE',
      badgeClass: safe ? 'gold' : 'grey' };
  },
};

// ── five suspects, published in advance ───────────────────────────────
const suspectList = {
  id: 'whack-suspect-list',
  category: 'social',
  weight(house, ctx) {
    if (!_whack(ctx) || ctx.act !== 'house') return 0;
    return _suspectCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _suspectCast(house, ctx);
    if (!cast) return null;
    const { room, inIt, watcher } = cast;
    const named = inIt.slice(0, 3).join(', ');
    const scene = makeScene('whack.suspect', { a: watcher, b: inIt[0], c: inIt[1] }, { ending: 'scene', power: room.power }, [], 'living-room');
    inIt.forEach(n => api.suspicion(watcher, n, 0.9));
    return { scene, players: [watcher, ...inIt.slice(0, 3)],
      badgeText: 'THE SUSPECTS ARE KNOWN', badgeClass: 'gold' };
  },
};

// ── the Head of Household watched all of it ───────────────────────────
const hohWatched = {
  id: 'whack-hoh-watched',
  category: 'ceremonies',
  weight(house, ctx) {
    if (!_whack(ctx) || ctx.act !== 'house') return 0;
    return _hohCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _hohCast(house, ctx);
    if (!cast) return null;
    const { hoh, mark, count } = cast;
    const scene = makeScene('whack.hoh', { a: hoh, b: mark }, { ending: 'scene' }, [], 'living-room');
    api.suspicion(hoh, mark, 1.2);
    try { api.remember(hoh, mark, 'went-for-power', 1, { twist: 'bb-whacktivity' }); } catch { /* texture */ }
    return { scene, players: [hoh, mark], badgeText: 'THE HOH KEPT A LIST', badgeClass: 'red' };
  },
};

// ── somebody being very normal ────────────────────────────────────────
const beingNormal = {
  id: 'whack-being-normal',
  category: 'social',
  weight(house, ctx) {
    if (!_whack(ctx) || ctx.act !== 'house') return 0;
    return _performCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _performCast(house, ctx);
    if (!cast) return null;
    const { who, watcher, room } = cast;
    const st = pStats(who);
    const overplayed = pStats(watcher).intuition >= 7 && st.strategic <= 6;
    const scene = makeScene('whack.normal', { a: who, b: watcher }, { ending: overplayed ? 'overplayed' : 'fine', power: room?.power || 'that room' }, [], 'kitchen');
    if (overplayed) {
      api.suspicion(watcher, who, 1.5);
      try { api.remember(watcher, who, 'came-out-with-something', 1, { twist: 'bb-whacktivity' }); } catch { /* texture */ }
    }
    return { scene, players: [who, watcher],
      badgeText: overplayed ? 'TOO KEEN TO DROP IT' : 'AS VAGUE AS EVERYBODY',
      badgeClass: overplayed ? 'gold' : 'grey' };
  },
};

// ── the week after ────────────────────────────────────────────────────
const stillWatching = {
  id: 'whack-still-watching',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _afterCast(house, ctx) ? band(7, 11) : 0;
  },
  fire(house, ctx, api) {
    const cast = _afterCast(house, ctx);
    if (!cast) return null;
    const { room, inIt, watcher } = cast;
    const scene = makeScene('whack.after', { a: watcher, b: inIt[0], c: inIt[1] || null }, { ending: 'scene', power: room.power }, [], 'kitchen');
    inIt.slice(0, 2).forEach(n => api.suspicion(watcher, n, 0.5));
    return { scene, players: [watcher, ...inIt.slice(0, 2)],
      badgeText: 'STILL ON THE LIST', badgeClass: 'grey' };
  },
};

export const WHACKTIVITY_EVENTS = [
  declaredIt, crowdedRoom, stayedShut, satItOut,
  suspectList, hohWatched, beingNormal, stillWatching,
];
