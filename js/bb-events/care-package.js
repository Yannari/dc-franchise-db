// ══════════════════════════════════════════════════════════════════════
// bb-events/care-package.js — a public gift is a public verdict
// ══════════════════════════════════════════════════════════════════════
//
// Every other twist family in this folder is about not knowing. The Hacker,
// Roadkill, the Coin, America's Nominee — a hand moves, the house hunts, and
// the material is the hunting.
//
// This family has no hunt in it at all, and that is the whole reason it exists
// alongside them. The audience's choice is announced, the box is handed over
// on camera, and the only new information in the room is a ranking: the
// country has now told this house, out loud, who its favourite is. Everybody
// else is standing there having been told they are not.
//
// So the beats point in the opposite direction from the secret twists. Instead
// of "who did this to me" they run on "why not me", which is a grievance with
// nobody to aim at and therefore ends up aimed at the person holding the box.
//
// Rules: everything here is nameable — there is nothing to protect. The only
// hidden fact in the family is who took the bribe, and that one stays hidden.
import { gs } from '../core.js';
import { pStats, band, perceived, closestTo, furthestFrom } from './_read.js';
import { makeScene } from '../bb/script/scene.js';
import { numberWord } from '../bb/script/inject.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

const _cp = ctx => ctx?.week?.carePackage || null;

/**
 * The package as it stood at the eviction.
 *
 * Super Safety and the Co-HOH key are facts from the moment the box is handed
 * over, so those beats read the live week. The vote block and the bribe do not
 * EXIST until the ballots are in — they fire after the last campaign act — so
 * their reactions belong to the following week's house life, the way the
 * Halting Hex's do.
 */
function _spentCp(ctx) {
  const weeks = gs?.bb?.weeks || [];
  const now = ctx?.week?.num || 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i];
    if (!w || w.num > now || now - w.num > 1) continue;
    const c = w.carePackage;
    if (c && (c.blocked?.length || c.bribe)) return c;
  }
  // The live week too, for a re-run that reaches house life after the vote.
  const live = _cp(ctx);
  return (live && (live.blocked?.length || live.bribe)) ? live : null;
}

const _favouriteCast = (house, ctx) => {
  const c = _cp(ctx);
  if (!c || !house.includes(c.recipient)) return null;
  // Whoever takes a public ranking worst: the person who has been playing for
  // the cameras hardest and still did not get called.
  const stung = _others(house, c.recipient)
    .sort((a, b) => (pStats(b).social + pStats(b).boldness - pStats(b).temperament)
      - (pStats(a).social + pStats(a).boldness - pStats(a).temperament))[0];
  return stung ? { c, who: c.recipient, stung } : null;
};
const _passedOverCast = (house, ctx) => {
  const c = _cp(ctx);
  const had = new Set((gs?.bb?.carePackages || []).map(d => d.recipient));
  const never = house.filter(n => !had.has(n));
  // Only interesting once the house has watched a few of these land.
  if (!c || (gs?.bb?.carePackages || []).length < 2 || never.length < 2) return null;
  const who = [...never].sort((a, b) => pStats(b).social - pStats(a).social)[0];
  const friend = closestTo(who, _others(house, who));
  return who ? { c, who, friend } : null;
};
const _costumeCast = (house, ctx) => {
  const c = _cp(ctx);
  if (c?.effect !== 'super-safety' || !house.includes(c.recipient)) return null;
  const watcher = _others(house, c.recipient)
    .sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
  return watcher ? { c, who: c.recipient, watcher } : null;
};
const _coHohCast = (house, ctx) => {
  const c = _cp(ctx);
  const hoh = ctx?.week?.hohSecret ? null : (ctx?.week?.hoh || ctx?.hoh);
  if (c?.effect !== 'co-hoh' || !hoh || c.recipient === hoh
    || !house.includes(hoh) || !house.includes(c.recipient)) return null;
  return { c, hoh, co: c.recipient };
};
const _silencedCast = (house, ctx) => {
  const c = _spentCp(ctx);
  const blocked = (c?.blocked || []).filter(n => house.includes(n));
  if (c?.effect !== 'vote-block' || !blocked.length || !house.includes(c.recipient)) return null;
  return { c, who: blocked[0], all: blocked };
};
const _moneyCast = (house, ctx) => {
  const c = _spentCp(ctx);
  if (c?.effect !== 'bribe' || !c.bribe || !house.includes(c.recipient)) return null;
  // The house knows the money exists. Somebody with a nose is going to try to
  // work out where it went, and will be wrong as often as not.
  const hunter = _others(house, c.recipient, c.bribe.mark)
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return hunter ? { c, hunter } : null;
};

// ── the country has a favourite, and it is not you ────────────────────
const countryHasAFavourite = {
  id: 'care-country-favourite',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _favouriteCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _favouriteCast(house, ctx);
    if (!cast) return null;
    const { c, who, stung } = cast;
    const weekNum = Math.max(1, Number(ctx?.week?.num) || 1);
    const scene = makeScene('care.favourite', { a: stung, b: who }, { ending: 'scene', weeks: `${numberWord(weekNum)} ${weekNum === 1 ? 'week' : 'weeks'}` }, [], 'kitchen');
    api.suspicion(stung, who, 0.9);
    api.addBond(stung, who, -1);
    api.popDelta(who, 1.5);
    return { scene, players: [who, stung], badgeText: 'A RANKING NOBODY ASKED FOR', badgeClass: 'gold' };
  },
};

// ── never once called ─────────────────────────────────────────────────
const passedOverAgain = {
  id: 'care-passed-over',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _passedOverCast(house, ctx) ? band(9, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _passedOverCast(house, ctx);
    if (!cast) return null;
    const { who, friend } = cast;
    const count = (gs?.bb?.carePackages || []).length;
    const scene = makeScene('care.passed', { a: who, b: friend || null }, { ending: 'scene', intent: friend ? 'told' : 'alone', packages: numberWord(count) }, [], 'bedroom');
    api.popDelta(who, -0.5);
    if (friend) api.addBond(who, friend, 0.4);
    return { scene, players: [who, friend].filter(Boolean),
      badgeText: 'NEVER ONCE CALLED', badgeClass: 'grey' };
  },
};

// ── safe, and dressed like it ─────────────────────────────────────────
const theCostume = {
  id: 'care-the-costume',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _costumeCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _costumeCast(house, ctx);
    if (!cast) return null;
    const { who, watcher } = cast;
    const scene = makeScene('care.costume', { a: who, b: watcher }, { ending: 'scene' }, [], 'kitchen');
    api.suspicion(watcher, who, 0.8);
    api.popDelta(who, 1);
    try { api.setTarget(watcher, who, 'untouchable all week and visible about it'); } catch { /* texture */ }
    return { scene, players: [who, watcher], badgeText: 'SAFE, AND DRESSED LIKE IT', badgeClass: 'gold' };
  },
};

// ── half a week, given away ───────────────────────────────────────────
const theAppointedCoHoh = {
  id: 'care-appointed-co-hoh',
  category: 'ceremonies',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _coHohCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _coHohCast(house, ctx);
    if (!cast) return null;
    const { hoh, co } = cast;
    const scene = makeScene('care.cohoh', { a: hoh, b: co }, { ending: 'scene' }, [], 'hoh-room');
    api.suspicion(hoh, co, 1.1);
    api.addBond(hoh, co, -0.9);
    api.popDelta(co, 1);
    return { scene, players: [hoh, co], badgeText: 'HALF A WEEK, GIVEN AWAY', badgeClass: 'red' };
  },
};

// ── struck by name ────────────────────────────────────────────────────
const silencedInPublic = {
  id: 'care-silenced-in-public',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _silencedCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _silencedCast(house, ctx);
    if (!cast) return null;
    const { c, who, all } = cast;
    const scene = makeScene('care.silenced', { a: who, b: c.recipient }, { ending: 'scene', intent: all.length > 1 ? 'pair' : 'solo', other: all[1] || '' }, [], 'living-room');
    for (const name of all) {
      api.suspicion(name, c.recipient, 1.6);
      api.addBond(name, c.recipient, -1.2);
      try { api.setTarget(name, c.recipient, 'took my vote in front of everybody'); } catch { /* texture */ }
    }
    return { scene, players: [...all, c.recipient],
      badgeText: 'STRUCK BY NAME', badgeClass: 'red' };
  },
};

// ── five thousand dollars, somewhere in this building ─────────────────
const publicMoney = {
  id: 'care-public-money',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _moneyCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _moneyCast(house, ctx);
    if (!cast) return null;
    const { c, hunter } = cast;
    // The hunter is guessing. Being right is possible and never confirmed.
    const guess = furthestFrom(hunter, _others(house, hunter, c.recipient))
      || _others(house, hunter, c.recipient)[0];
    const right = guess === c.bribe.mark && c.bribe.taken;
    const scene = makeScene('care.money', { a: hunter, b: guess }, { ending: 'scene' }, [], 'kitchen');
    api.suspicion(hunter, guess, 1.2);
    if (!right) api.addBond(hunter, guess, -0.6);
    return { scene, players: [hunter, guess, c.recipient].filter(Boolean),
      badgeText: right ? 'THE RIGHT NAME, UNPROVABLE' : 'PRICING THE ROOM',
      badgeClass: right ? 'gold' : 'blue' };
  },
};

export const CARE_PACKAGE_EVENTS = [
  countryHasAFavourite, passedOverAgain, theCostume, theAppointedCoHoh,
  silencedInPublic, publicMoney,
];
