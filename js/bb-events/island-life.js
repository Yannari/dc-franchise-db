// ══════════════════════════════════════════════════════════════════════
// bb-events/island-life.js — things that happen AT a place on the island
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-13: "fully use this island", then "the spots are underutilized", and the agreed #8 of
// 2026-10-16: events tied to a place, the way Total Drama's are. Until now a spot was only somewhere a private
// talk was moved to (bb/story/places.js spotFor). These happen because of the place: never have I ever at the
// bonfire, two people slipping down the pier at night, a dare at the volcano rocks, the rope swing at the east
// pond, two people in the gym at once, a drink at the beach bar. Each one plays on its own plate (`spot`, read by
// bb/story/write.js writeEngineScene) and each one moves something (CLAUDE.md: camp events must have consequences).
//
// One or two a week across all of them, never the same one twice, so the island is a place the house goes, not a
// second house.

import { pStats, band, firedThisWeek, spotlightOrder, alliancesOf, sharesAlliance, isNice, willScheme } from './_read.js';
import { getBond } from '../bonds.js';
import { makeScene } from '../bb/script/scene.js';

const IDS = ['island-bonfire', 'island-pier', 'island-volcano', 'island-swing', 'island-gym', 'island-bar'];
// one a week, two every other week (any weight at all fills the week's quota: the house acts have room to spare)
const perWeek = w => 1 + (w % 2);
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';
const weekNum = ctx => Number(ctx?.week?.num) || 0;
const others = (house, ...ex) => house.filter(n => n && !ex.includes(n));
// one of the first three who fit, by the week, so the same person is not at the same spot every week
const rotate = (list, week) => list[week % Math.max(1, Math.min(3, list.length))];
function open(id, house, ctx, min) {
  if (!_reactable(ctx) || house.length < min) return false;
  const w = weekNum(ctx);
  if (firedThisWeek(id, w)) return false;
  return IDS.filter(x => firedThisWeek(x, w)).length < perWeek(w);
}
const scene = (key, who, ending, seenBy, room = 'backyard') => makeScene(key, who, { ending }, seenBy, room);

// ── the bonfire: never have I ever ─────────────────────────────────────
// Warm, unless the one asking turns the game into the game: then somebody drinks (or does not) at the wrong moment,
// and the third person at the fire notices.
const bonfire = {
  id: 'island-bonfire',
  category: 'house-life',
  weight(house, ctx) { return open('island-bonfire', house, ctx, 4) ? band(3) : 0; },
  fire(house, ctx, api) {
    const order = spotlightOrder(house);
    const a = rotate(order.slice(0, 5).sort((x, y) => pStats(y).boldness - pStats(x).boldness), weekNum(ctx));
    const [b, c] = others(order, a);
    if (!a || !b || !c) return null;
    // a nice houseguest never weaponises a party game (CLAUDE.md archetype rules)
    const pointed = !isNice(a) && willScheme(a) && pStats(a).strategic >= pStats(a).social;
    if (pointed) {
      api.suspicion(c, b, 0.8);
      api.addBond(a, b, -0.4);
    } else {
      api.addBond(a, b, 0.4); api.addBond(a, c, 0.4); api.addBond(b, c, 0.4);
    }
    return { scene: scene('island.bonfire', { a, b, c }, pointed ? 'pointed' : 'warm', [a, b, c]), players: [a, b, c],
      spot: 'beach-bonfire', badgeText: pointed ? 'NEVER HAVE I EVER' : 'BONFIRE', badgeClass: pointed ? 'red' : 'green' };
  },
};

// ── the pier, after dark ───────────────────────────────────────────────
// Two people who trust each other go as far from the house as the island allows. Whether anybody saw them go is
// the sharpest watcher's eye against how good the pair are at not being watched.
const pier = {
  id: 'island-pier',
  category: 'social',
  weight(house, ctx) { return open('island-pier', house, ctx, 4) ? band(3) : 0; },
  fire(house, ctx, api) {
    const pairs = [];
    for (let i = 0; i < house.length; i++) for (let j = i + 1; j < house.length; j++) pairs.push([house[i], house[j], getBond(house[i], house[j])]);
    pairs.sort((x, y) => y[2] - x[2]);
    const pair = rotate(pairs.filter(p => p[2] > 0 && p[2] < 9), weekNum(ctx)) || pairs[0];
    if (!pair) return null;
    const [a, b] = pair;
    // the watcher: one of the sharper eyes in the house, the one with the least screen time (not the same face every week)
    const c = spotlightOrder(others(house, a, b).sort((x, y) => pStats(y).intuition - pStats(x).intuition).slice(0, 4))[0];
    if (!c) return null;
    const seen = pStats(c).intuition >= (pStats(a).social + pStats(b).social) / 2;
    api.addBond(a, b, 0.6);
    if (seen) {
      api.suspicion(c, a, 0.8); api.suspicion(c, b, 0.8);
      api.remember(c, a, 'they-are-a-pair', 1, { about: b });
    }
    return { scene: scene('island.pier', { a, b, c }, seen ? 'seen' : 'unseen', seen ? [a, b, c] : [a, b]), players: seen ? [a, b, c] : [a, b],
      spot: 'pier-east', badgeText: seen ? 'SEEN ON THE PIER' : 'THE PIER', badgeClass: seen ? 'red' : 'grey' };
  },
};

// ── a dare at the volcano rocks ────────────────────────────────────────
const volcano = {
  id: 'island-volcano',
  category: 'house-life',
  weight(house, ctx) { return open('island-volcano', house, ctx, 4) ? band(3) : 0; },
  fire(house, ctx, api) {
    const a = rotate([...house].sort((x, y) => pStats(y).boldness - pStats(x).boldness), weekNum(ctx));
    const b = spotlightOrder(others(house, a))[0];
    if (!a || !b) return null;
    // the dared one's nerve against the dare's: a bold dare takes a bolder answer
    const did = pStats(b).boldness + pStats(b).physical / 2 >= pStats(a).boldness;
    if (did) { api.popDelta(b, 1); api.addBond(a, b, 0.5); } else { api.addBond(b, a, -0.6); api.popDelta(a, -1); }
    return { scene: scene('island.volcano', { a, b }, did ? 'did' : 'balked', house), players: [a, b],
      spot: 'beach-volcano', badgeText: did ? 'DARE TAKEN' : 'CHICKEN', badgeClass: did ? 'green' : 'red' };
  },
};

// ── the rope swing at the east pond ────────────────────────────────────
const swing = {
  id: 'island-swing',
  category: 'house-life',
  weight(house, ctx) { return open('island-swing', house, ctx, 3) ? band(3) : 0; },
  fire(house, ctx, api) {
    const a = spotlightOrder(house)[weekNum(ctx) % 2];
    // a friend, but not one the bond can no longer move (two people at +10 have nothing left for a pond to change)
    const near = others(house, a).sort((x, y) => getBond(a, y) - getBond(a, x));
    const b = near.find(x => getBond(a, x) < 9) || near[0];
    if (!a || !b) return null;
    // the less physical of the two is the one who ends up in the reeds, and the house loves it
    const splash = pStats(a).physical <= pStats(b).physical;
    // (a bond near the top barely moves for an afternoon: the memory of it is what lasts)
    if (splash) { api.popDelta(a, 1); api.addBond(a, b, 0.5); } else { api.addBond(a, b, 0.7); api.remember(b, a, 'kindness', 2, { about: 'an afternoon at the rope swing' }); }
    return { scene: scene('island.swing', { a, b }, splash ? 'splash' : 'together', [a, b]), players: [a, b],
      spot: 'pond-east', badgeText: splash ? 'SPLASH' : 'THE ROPE SWING', badgeClass: 'green' };
  },
};

// ── the gym, two people at once ────────────────────────────────────────
// Two of the strongest in the same room: friends spot each other, everybody else sizes each other up for the next
// physical competition.
const gym = {
  id: 'island-gym',
  category: 'social',
  weight(house, ctx) { return open('island-gym', house, ctx, 4) ? band(3) : 0; },
  fire(house, ctx, api) {
    const strong = [...house].sort((x, y) => pStats(y).physical - pStats(x).physical);
    const a = strong[weekNum(ctx) % 2];
    const b = rotate(others(strong.slice(0, 5), a), weekNum(ctx));
    if (!a || !b) return null;
    const rivals = getBond(a, b) < 2;
    if (rivals) { api.addBond(a, b, -0.3); api.suspicion(a, b, 0.4); api.suspicion(b, a, 0.4); } else { api.addBond(a, b, 0.7); api.remember(a, b, 'kindness', 2, { about: 'spotted me in the gym' }); }
    return { scene: scene('island.gym', { a, b }, rivals ? 'rivals' : 'spotters', [a, b]), players: [a, b],
      spot: 'gym-racks', badgeText: rivals ? 'SIZING UP' : 'SPOTTERS', badgeClass: rivals ? 'red' : 'green' };
  },
};

// ── a drink at the beach bar ───────────────────────────────────────────
// Somebody with an alliance, a drink, and a friendly face from outside it says more than they meant to; or two
// people just have a nice evening.
const bar = {
  id: 'island-bar',
  category: 'social',
  weight(house, ctx) { return open('island-bar', house, ctx, 3) ? band(3) : 0; },
  fire(house, ctx, api) {
    const a = spotlightOrder(house)[(weekNum(ctx) + 1) % 2];
    const near = others(house, a).sort((x, y) => getBond(a, y) - getBond(a, x));
    const movable = near.filter(x => getBond(a, x) < 9);
    const b = movable[weekNum(ctx) % 2] || movable[0] || near[0];
    if (!a || !b) return null;
    // only somebody with an alliance can let one slip, only to somebody outside it, and only when the listener is
    // sharper than the talker is careful
    const slip = alliancesOf(a).length > 0 && !sharesAlliance(a, b) && pStats(a).strategic < pStats(b).intuition;
    if (slip) {
      api.suspicion(b, a, 1.0); api.addBond(a, b, 0.3);
      api.remember(b, a, 'confidence', 1, { about: 'said too much at the beach bar' });
    } else { api.addBond(a, b, 0.7); api.remember(b, a, 'kindness', 2, { about: 'a drink at the beach bar' }); }
    return { scene: scene('island.bar', { a, b }, slip ? 'slip' : 'toast', [a, b]), players: [a, b],
      spot: 'beach-hutbar', badgeText: slip ? 'SAID TOO MUCH' : 'CHEERS', badgeClass: slip ? 'red' : 'green' };
  },
};

export const ISLAND_LIFE_EVENTS = [bonfire, pier, volcano, swing, gym, bar];
