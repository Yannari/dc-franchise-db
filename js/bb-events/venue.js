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
  romanceOf, threat, beatsInvolving,
} from './_read.js';

// ── helpers ───────────────────────────────────────────────────────────

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

const _v = token => houseVocab(token);

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
    const text = warm ? _variant([
      `${a} and ${b} end up in ${_v('gather')} with nowhere else to be, and stay there long after the reason to.`,
      `Everybody drifts out of ${_v('gather')} except ${a} and ${b}, which neither of them engineered and both of them notice.`,
      `${a} finds ${b} already in ${_v('downtime')}. Neither leaves. That is the whole event and it matters.`,
      `${a} and ${b} talk in ${_v('gather')} about nothing for an hour, which in here is how trust is actually built.`,
    ], ctx, a, b) : _variant([
      `${a} and ${b} are stuck in ${_v('gather')} together being scrupulously polite, and the whole house can feel it.`,
      `There is one room and both of them are in it. ${a} and ${b} talk about ${_v('foodSource')} for ten minutes rather than the obvious.`,
      `${a} and ${b} share ${_v('downtime')} without sharing anything else. Everybody watching learns something anyway.`,
      `${b} waits for ${a} to leave ${_v('gather')} first. ${a} does not. Neither of them will admit that was the game being played.`,
    ], ctx, a, b);

    api.addBond(a, b, warm ? 0.8 : -0.3);
    if (warm) api.remember(a, b, 'kindness', 1, { about: _v('place') });
    // In an exposed building, everybody sees who is spending time with whom.
    if (_exposure() >= 0.6) {
      house.filter(n => n !== a && n !== b).forEach(w => api.suspicion(w, a, warm ? 0.25 : 0));
    }
    return {
      text, players: [a, b],
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
    if (house.length < 4) return 0;
    const pair = _quietPair(house, ctx);
    if (!pair || bond(pair.a, pair.b) < 1) return 0;
    // The rarer privacy is, the more valuable and the more suspicious.
    return band(6 - _exposure() * 3);
  },
  fire(house, ctx, api) {
    const { a, b } = _quietPair(house, ctx);
    const exposed = _exposure() >= 0.8;
    const text = exposed ? _variant([
      `${a} and ${b} try to talk quietly in ${_v('shelter')}. There is nowhere in ${_v('place')} that is actually out of sight, and four people clock it.`,
      `${a} walks ${b} to ${_v('water')} to say something private. In this building that is a public announcement.`,
      `There are no corners here. ${a} and ${b} have their conversation anyway and spend the rest of the day managing what it looked like.`,
    ], ctx, a, b) : _variant([
      `${a} and ${b} disappear into ${_v('downtime')} for twenty minutes. Nobody sees what was said; everybody sees that they were gone.`,
      `There are more rooms in ${_v('place')} than there are people. ${a} and ${b} use one, and come out having decided something.`,
      `${a} takes ${b} through to ${_v('shelter')} where the cameras are the only company, and says the thing out loud at last.`,
      `Twenty minutes unaccounted for. ${a} and ${b} return separately, which fools precisely nobody and protects them anyway.`,
    ], ctx, a, b);

    api.addBond(a, b, 1.2);
    api.remember(a, b, 'trust', 2, { about: 'a private conversation' });
    // Getting away with it is the venue's doing. Being seen is too.
    const watchers = house.filter(n => n !== a && n !== b);
    watchers.forEach(w => api.suspicion(w, a, exposed ? 0.8 : 0.35));
    if (exposed) api.popDelta(a, -1);
    return {
      text, players: [a, b],
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
    const pool = houseProfile()?.atmosphere || [];
    const line = _variant(pool, ctx, a, b)
      .replace(/\{a\}/g, a).replace(/\{b\}/g, b)
      .replace(/\{place\}/g, _v('place')).replace(/\{shelter\}/g, _v('shelter'))
      .replace(/\{gather\}/g, _v('gather')).replace(/\{water\}/g, _v('water'))
      .replace(/\{sleep\}/g, _v('sleep')).replace(/\{downtime\}/g, _v('downtime'))
      .replace(/\{foodSource\}/g, _v('foodSource'))
      .replace(/\{po\}/g, 'them').replace(/\{p\}/g, a);

    api.addBond(a, b, 0.4);
    return {
      text: line, players: [a, b],
      badgeText: (houseProfile()?.label || 'THE HOUSE').toUpperCase(),
      badgeClass: 'grey',
    };
  },
};

export const VENUE_EVENTS = [sharedSpace, privateCorner, houseAtmosphere];

export default VENUE_EVENTS;
