// js/social/personas.js
// The people watching.
//
// A recurring cast, not a fresh crowd every episode. You learn a handle, and then
// it means something when that account changes its mind — a stan who has defended
// somebody since season 4 reacting to her blindside is a different post from a
// stranger reacting to it.
//
// PLAYERS ARE REFERENCED BY SLUG (`anne-maria`), the key players_database.json
// uses. voice-profiles.json keys the same people by display name (`Anne Maria`);
// anything needing that must map, never assume.

/** The kinds of fan. Every one of these must be represented in PERSONAS. */
export const ARCHETYPES = ['stan', 'hater', 'analyst', 'livefeeder', 'casual', 'chaos', 'shipper'];

/**
 * How a fan feels about one player — TWO independent numbers, not one.
 *
 *   affection    -1..1  do they like this person
 *   gameRespect  -1..1  do they rate how this person is playing
 *
 * They move from different causes and in different directions. A brilliant
 * blindside raises respect and can lower affection. Kindness on a bad night
 * raises affection and does nothing to respect. A steamroll raises respect while
 * draining affection from everyone watching — which is how a dominant winner
 * becomes hated, and it cannot be said with a single like/dislike value.
 */
export function feelingsToward(persona, slug) {
  const f = (persona?.feelings || {})[slug];
  return {
    affection: Number(f?.affection) || 0,
    gameRespect: Number(f?.gameRespect) || 0,
  };
}

/**
 * Where affection turns into a standing position.
 *
 * These are the ONLY thresholds in this library and they are narrative, not
 * gameplay: they answer "would this account describe itself as a fan of / done
 * with this player", which is a yes or no question. Everything that affects a
 * post — topic weight, posture, engagement — reads the raw -1..1 affection
 * proportionally instead. Symmetric on purpose, so loyalty and a grudge cost the
 * same distance from indifference.
 */
const LOYAL_AT = 0.5;
const GRUDGE_AT = -0.5;

/** Who this fan defends. Derived from affection, never stored separately. */
export function loyaltiesOf(persona) {
  return Object.entries(persona?.feelings || {})
    .filter(([, f]) => (Number(f.affection) || 0) >= LOYAL_AT)
    .map(([slug]) => slug);
}

/**
 * Who this fan has never forgiven.
 *
 * Affection only. Respecting somebody's game is not liking them — half this
 * fandom rates a villain's play and still wants them gone.
 */
export function grudgesOf(persona) {
  return Object.entries(persona?.feelings || {})
    .filter(([, f]) => (Number(f.affection) || 0) <= GRUDGE_AT)
    .map(([slug]) => slug);
}

/**
 * The regulars.
 *
 * `since`      the season they started watching — an account that has been here
 *              since season 2 talks about the old days; a new one does not.
 * `voice.caps` 0..1, how often they shout. PROPORTIONAL: it scales frequency,
 *              it is never a threshold that flips.
 * `voice.emoji` 0..1, same.
 * `voice.length` 'short' | 'medium' | 'long'
 * `voice.punctuation` 'none' | 'normal' | 'heavy'
 * `platforms`  'timeline' (public, hostile) and/or 'chat' (hosted, insider)
 * `volatility` 0..1, how LOUD this account is when something happens. Today its
 *              only effect is a likes multiplier in the sampler: a volatile
 *              account posts the reaction everybody else is feeling, so it
 *              collects engagement. It does NOT currently turn any opinion —
 *              nothing in this library mutates `feelings`, so a persona's post
 *              about their favourite reads identically before and after that
 *              favourite is evicted. Stance-turning is PROJECT 2's: it needs real
 *              episode data (who did what to whom) to move affection and
 *              gameRespect, and this field is the rate that mutation will use
 *              when it exists. Do not go looking for the behaviour here.
 * `feelings`   slug -> { affection, gameRespect }, both -1..1. Static in this
 *              project — see `volatility` above.
 */
export const PERSONAS = [
  {
    handle: '@vetokween', name: 'jules', since: 4, archetype: 'stan',
    voice: { caps: 0.35, emoji: 0.6, length: 'short', punctuation: 'none' },
    platforms: ['timeline'], volatility: 0.7,
    feelings: { heather: { affection: 0.9, gameRespect: -0.3 },
                alejandro: { affection: -0.8, gameRespect: 0.8 } },
  },
  {
    handle: '@blindsidebrain', name: 'marcus', since: 1, archetype: 'analyst',
    voice: { caps: 0.05, emoji: 0.05, length: 'long', punctuation: 'normal' },
    platforms: ['timeline', 'chat'], volatility: 0.2,
    feelings: { alejandro: { affection: 0.1, gameRespect: 0.95 },
                beth: { affection: 0.4, gameRespect: -0.6 } },
  },
  {
    handle: '@feedsat3am', name: 'ro', since: 7, archetype: 'livefeeder',
    voice: { caps: 0.5, emoji: 0.3, length: 'medium', punctuation: 'none' },
    platforms: ['timeline'], volatility: 0.5,
    feelings: { scott: { affection: -0.6, gameRespect: 0.7 } },
  },
  {
    handle: '@notthatdeep', name: 'dee', since: 12, archetype: 'casual',
    voice: { caps: 0.1, emoji: 0.8, length: 'short', punctuation: 'normal' },
    platforms: ['timeline'], volatility: 0.8,
    feelings: {},
  },
  {
    handle: '@ruinedmylife', name: 'kai', since: 3, archetype: 'hater',
    voice: { caps: 0.7, emoji: 0.2, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline'], volatility: 0.4,
    feelings: { alejandro: { affection: -0.95, gameRespect: 0.2 },
                heather: { affection: -0.7, gameRespect: -0.5 } },
  },
  {
    handle: '@twoofthemnow', name: 'sam', since: 9, archetype: 'shipper',
    voice: { caps: 0.4, emoji: 0.9, length: 'short', punctuation: 'none' },
    platforms: ['timeline'], volatility: 0.6,
    feelings: { gwen: { affection: 0.8, gameRespect: 0.2 },
                duncan: { affection: 0.7, gameRespect: 0.1 } },
  },
  {
    handle: '@burnitdown', name: 'pip', since: 6, archetype: 'chaos',
    voice: { caps: 0.6, emoji: 0.5, length: 'short', punctuation: 'heavy' },
    platforms: ['timeline'], volatility: 0.95,
    feelings: {},
  },
  {
    handle: '@quietgamer', name: 'noor', since: 2, archetype: 'analyst',
    voice: { caps: 0.0, emoji: 0.1, length: 'long', punctuation: 'normal' },
    platforms: ['chat'], volatility: 0.15,
    feelings: { courtney: { affection: 0.3, gameRespect: 0.8 } },
  },
  {
    handle: '@justiceforher', name: 'tam', since: 8, archetype: 'stan',
    voice: { caps: 0.55, emoji: 0.4, length: 'medium', punctuation: 'heavy' },
    platforms: ['timeline'], volatility: 0.75,
    feelings: { courtney: { affection: 0.85, gameRespect: 0.1 } },
  },
  {
    handle: '@compbeastwatch', name: 'ezra', since: 5, archetype: 'livefeeder',
    voice: { caps: 0.2, emoji: 0.2, length: 'medium', punctuation: 'normal' },
    platforms: ['timeline', 'chat'], volatility: 0.3,
    feelings: { scott: { affection: 0.2, gameRespect: 0.85 } },
  },
  {
    handle: '@casualviewer99', name: 'bex', since: 14, archetype: 'casual',
    voice: { caps: 0.15, emoji: 0.7, length: 'short', punctuation: 'normal' },
    platforms: ['timeline'], volatility: 0.9,
    feelings: {},
  },
  {
    handle: '@theeditlies', name: 'wren', since: 3, archetype: 'hater',
    voice: { caps: 0.45, emoji: 0.15, length: 'medium', punctuation: 'heavy' },
    platforms: ['timeline', 'chat'], volatility: 0.35,
    feelings: { beth: { affection: -0.55, gameRespect: -0.7 },
                gwen: { affection: 0.6, gameRespect: 0.3 } },
  },
  {
    handle: '@juryforeperson', name: 'imani', since: 1, archetype: 'analyst',
    voice: { caps: 0.02, emoji: 0.05, length: 'long', punctuation: 'normal' },
    platforms: ['chat'], volatility: 0.12,
    feelings: { leshawna: { affection: 0.75, gameRespect: 0.65 },
                duncan: { affection: -0.55, gameRespect: 0.45 } },
  },
  {
    handle: '@greenroomgrace', name: 'celeste', since: 5, archetype: 'stan',
    voice: { caps: 0.08, emoji: 0.35, length: 'medium', punctuation: 'normal' },
    platforms: ['chat'], volatility: 0.28,
    feelings: { jasmine: { affection: 0.9, gameRespect: 0.55 },
                sugar: { affection: -0.7, gameRespect: -0.2 } },
  },
  {
    handle: '@thirdplacetruth', name: 'dev', since: 2, archetype: 'hater',
    voice: { caps: 0.18, emoji: 0.08, length: 'medium', punctuation: 'heavy' },
    platforms: ['chat'], volatility: 0.32,
    feelings: { courtney: { affection: -0.65, gameRespect: 0.7 },
                harold: { affection: 0.6, gameRespect: 0.15 } },
  },
  {
    handle: '@aftershowreceipts', name: 'mina', since: 6, archetype: 'livefeeder',
    voice: { caps: 0.12, emoji: 0.12, length: 'long', punctuation: 'normal' },
    platforms: ['timeline', 'chat'], volatility: 0.38,
    feelings: { scott: { affection: -0.75, gameRespect: 0.8 },
                dawn: { affection: 0.8, gameRespect: -0.1 } },
  },
  {
    handle: '@couchsidecoach', name: 'omar', since: 8, archetype: 'analyst',
    voice: { caps: 0.03, emoji: 0.03, length: 'long', punctuation: 'normal' },
    platforms: ['chat'], volatility: 0.18,
    feelings: { bowie: { affection: 0.35, gameRespect: 0.92 },
                ripper: { affection: -0.8, gameRespect: -0.45 } },
  },
  {
    handle: '@snacksandshade', name: 'liv', since: 10, archetype: 'casual',
    voice: { caps: 0.22, emoji: 0.55, length: 'short', punctuation: 'normal' },
    platforms: ['timeline', 'chat'], volatility: 0.68,
    feelings: { zee: { affection: 0.85, gameRespect: -0.35 },
                julia: { affection: -0.6, gameRespect: 0.85 } },
  },
  {
    handle: '@messmanagement', name: 'rhea', since: 4, archetype: 'chaos',
    voice: { caps: 0.4, emoji: 0.28, length: 'medium', punctuation: 'heavy' },
    platforms: ['chat'], volatility: 0.82,
    feelings: { izzy: { affection: 0.9, gameRespect: -0.25 },
                blaineley: { affection: -0.85, gameRespect: 0.1 } },
  },
  {
    handle: '@showmancemedic', name: 'andie', since: 7, archetype: 'shipper',
    voice: { caps: 0.1, emoji: 0.48, length: 'medium', punctuation: 'normal' },
    platforms: ['chat'], volatility: 0.42,
    feelings: { carrie: { affection: 0.8, gameRespect: 0.2 },
                chase: { affection: -0.9, gameRespect: -0.65 } },
  },
];

/** One regular, by handle. Null rather than undefined, so a miss is obvious. */
export function personaByHandle(handle) {
  return PERSONAS.find(p => p.handle === handle) || null;
}
