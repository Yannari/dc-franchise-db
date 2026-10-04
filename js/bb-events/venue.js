// ══════════════════════════════════════════════════════════════════════
// bb-events/venue.js — the building the season is played in
// ══════════════════════════════════════════════════════════════════════
//
// A season SETTING was a dropdown that changed nothing in a house: the profile
// existed, the vocabulary existed, and no house event ever read either. These
// are the events that make the venue matter.
//
// The rule is the same as everywhere else — nothing here is scenery. Where two
// houseguests end up talking is a fact about the building, and the building
// decides how often that happens and how private it is. A compound with one
// room pushes people together and lets everybody watch; a manor with thirty
// rooms lets a pair disappear, and disappearing is itself a statement the rest
// of the house reads.

import { houseProfile, houseVocab, houseSetting } from '../settings.js';
import {
  pStats, bond, band, closestTo, sharesAlliance, trusts, dislikes,
  romanceOf, threat, beatsInvolving, spotlightOrder,
} from './_read.js';
import { makeScene } from '../bb/script/scene.js';

// ── helpers ───────────────────────────────────────────────────────────

/** Which room a scene happens in: by hash, never a die. */
function _room(rooms, ctx, ...people) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${people.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return rooms[hash % rooms.length];
}

const _v = token => houseVocab(token);

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));

/** Least-seen first, so the forgotten are actually reachable. */
/** Least-seen first, weighted toward whoever this week is about. */
const _quiet = pool => spotlightOrder(pool);

/** Whichever pair has been on screen least — the venue is where they meet. */
function _quietPair(house, ctx) {
  const pool = [...house].filter(Boolean).sort((a, b) => beatsInvolving(a) - beatsInvolving(b));
  const a = pool[0];
  if (!a) return null;
  const b = closestTo(a, pool.filter(n => n !== a)) || pool[1];
  return b ? { a, b } : null;
}

/**
 * How exposed a conversation is here.
 *
 * The compound has one room and no corners; the manor has more rooms than
 * people. This is the number the venue actually contributes to the game: how
 * likely a private conversation is to stay private.
 */
const _EXPOSURE = {
  'bb-compound': 1.0,   // one room, no corners, everything is seen
  'bb-house': 0.6,
  'bb-resort': 0.45,    // noise and open space cover a lot
  'bb-manor': 0.25,     // more rooms than people
};
const _exposure = () => _EXPOSURE[houseSetting()] ?? 0.6;

// ── events ────────────────────────────────────────────────────────────

/**
 * Two houseguests end up in the room the building pushes everybody into.
 *
 * Proximity is not neutral: people who already like each other get closer,
 * and people who do not are forced to be civil in public, which is its own
 * kind of pressure.
 */
const sharedSpace = {
  id: 'venue-shared-space',
  category: 'house-life',
  weight(house, ctx) {
    if (house.length < 3) return 0;
    if (ctx?.act === 'eviction') return 0;
    return _quietPair(house, ctx) ? band(4 + _exposure() * 3) : 0;
  },
  fire(house, ctx, api) {
    const { a, b } = _quietPair(house, ctx);
    const warm = bond(a, b) >= 1 || sharesAlliance(a, b) || !!romanceOf(a, b);
    const scene = makeScene('venue.shared', { a, b }, { ending: warm ? 'warm' : 'cold' }, [],
      _room(['living-room', 'kitchen', 'backyard'], ctx, a, b));
    api.addBond(a, b, warm ? 0.8 : -0.3);
    if (warm) api.remember(a, b, 'kindness', 1, { about: _v('place') });
    // In an exposed building, everybody sees who is spending time with whom.
    if (_exposure() >= 0.6) {
      house.filter(n => n !== a && n !== b).forEach(w => api.suspicion(w, a, warm ? 0.25 : 0));
    }
    return {
      scene, players: [a, b],
      badgeText: warm ? 'SAME ROOM' : 'FORCED CIVILITY',
      badgeClass: warm ? 'green' : 'grey',
    };
  },
};

/**
 * A pair uses the building to get out of sight.
 *
 * Only worth doing where there is somewhere to go. In a manor it is easy and
 * effective; in a compound it is conspicuous, and being seen trying to be
 * unseen is worse than not trying.
 */
const privateCorner = {
  id: 'venue-private-corner',
  category: 'deals',
  weight(house, ctx) {
    if (ctx?.week?._privateCornerAired) return 0;
    if (house.length < 4) return 0;
    const pair = _quietPair(house, ctx);
    if (!pair || bond(pair.a, pair.b) < 1) return 0;
    // The rarer privacy is, the more valuable and the more suspicious.
    return band(6 - _exposure() * 3);
  },
  fire(house, ctx, api) {
    if (ctx?.week) ctx.week._privateCornerAired = true;
    const { a, b } = _quietPair(house, ctx);
    const exposed = _exposure() >= 0.8;
    const watchers = house.filter(n => n !== a && n !== b);
    api.addBond(a, b, 1.2);
    api.remember(a, b, 'trust', 2, { about: 'a private conversation' });
    // Getting away with it is the venue's doing. Being seen is too.
    const witnesses = exposed ? watchers.slice(0, 4) : watchers.slice(0, 1);
    const scene = makeScene('venue.corner', { a, b, c: witnesses[0] || null }, { ending: exposed ? 'exposed' : 'hidden' }, [],
      _room(['bedroom', 'backyard'], ctx, a, b));
    witnesses.forEach(w => api.suspicion(w, a, exposed ? 0.8 : 0.35));
    if (exposed) api.popDelta(a, -1);
    return {
      scene, players: [a, b, ...witnesses].filter(Boolean),
      badgeText: exposed ? 'NOWHERE TO HIDE' : 'OUT OF SIGHT',
      badgeClass: exposed ? 'red' : 'blue',
    };
  },
};

/**
 * The building itself does something to everybody.
 *
 * Drawn from the setting's own atmosphere pool, so a compound reads like a
 * compound. Small effect, wide reach — this is the texture layer, and it still
 * moves a number rather than merely describing the room.
 */
const houseAtmosphere = {
  id: 'venue-atmosphere',
  category: 'house-life',
  weight(house, ctx) {
    if (house.length < 3) return 0;
    if (ctx?.act === 'eviction' || ctx?.act === 'hoh') return 0;
    return (houseProfile()?.atmosphere || []).length ? 3.5 : 0;
  },
  fire(house, ctx, api) {
    const pair = _quietPair(house, ctx) || { a: house[0], b: house[1] };
    const { a, b } = pair;
    const scene = makeScene('venue.atmos', { a, b }, { ending: houseSetting().replace(/^bb-/, '') }, [],
      _room(['living-room', 'kitchen', 'backyard', 'bedroom'], ctx, a, b));
    api.addBond(a, b, 0.4);
    return {
      scene, players: [a, b],
      badgeText: (houseProfile()?.label || 'THE HOUSE').toUpperCase(),
      badgeClass: 'grey',
    };
  },
};

export const VENUE_EVENTS = [sharedSpace, privateCorner, houseAtmosphere];

export default VENUE_EVENTS;

/**
 * The houseguest nobody has spoken to.
 *
 * A structural fix for a structural problem. The Head of Household and the
 * nominees are in a dozen events by definition, so a week can legitimately
 * revolve around three or four people — and in a house of eighteen that left
 * others with nine beats out of a hundred and ten. Invisible for a week is
 * not a story, it is an absence.
 *
 * This fires harder the further somebody has fallen below their share of the
 * week, and it puts them at the centre of the beat. Being overlooked is also
 * a real position in this game: it is how a floater survives to the end, and
 * how somebody arrives at the final five with no allies and no enemies.
 */
const overlooked = {
  id: 'venue-overlooked',
  category: 'house-life',
  weight(house, ctx) {
    if (house.length < 5) return 0;
    const counts = house.map(beatsInvolving);
    const average = counts.reduce((sum, n) => sum + n, 0) / counts.length;
    if (average < 3) return 0;                 // too early in the week to tell
    const quietest = Math.min(...counts);
    const shortfall = (average - quietest) / average;
    // Recalibrated after ten HOH-room and pre-ceremony events joined the
    // library and spread the feed out: the worst shortfall in a measured season
    // fell from over half to 42%, so a 45% gate made this unreachable. Somebody
    // on nineteen beats where the average is thirty-two is still being
    // overlooked, which is the whole point of the event.
    if (shortfall < 0.3) return 0;            // nobody is actually being missed
    return band(shortfall * 14);
  },
  fire(house, ctx, api) {
    const forgotten = _quiet(house)[0];
    const rest = _others(house, forgotten);
    // Whoever notices is the person most likely to: high social, or already fond.
    const noticer = rest.slice().sort((a, b) =>
      (bond(b, forgotten) + pStats(b).social * 0.3) - (bond(a, forgotten) + pStats(a).social * 0.3))[0];
    const noticed = !!noticer && (pStats(noticer).social >= 6 || bond(noticer, forgotten) >= 1);
    const scene = makeScene('venue.overlooked', { a: forgotten, b: noticed ? noticer : null },
      { ending: noticed ? 'noticed' : 'missed' }, [], _room(['living-room', 'kitchen', 'bedroom'], ctx, forgotten));
    if (noticed && noticer) {
      api.addBond(forgotten, noticer, 0.9);
      api.remember(forgotten, noticer, 'kindness', 2, { about: 'noticed me when nobody had' });
    } else {
      // Being invisible is safety and a dead end at the same time.
      _others(house, forgotten).forEach(w => api.suspicion(w, forgotten, -0.2));
      api.popDelta(forgotten, 1);
    }
    return {
      scene, players: [forgotten, noticed ? noticer : null].filter(Boolean),
      badgeText: noticed ? 'SOMEBODY NOTICES' : 'NOBODY IS LOOKING',
      badgeClass: noticed ? 'green' : 'grey',
    };
  },
};

VENUE_EVENTS.push(overlooked);
