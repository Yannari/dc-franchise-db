// js/settings.js — SEASON SETTING profiles.
// A season's SETTING (hosted camp, survival island, carnival, film lot, world
// tour) shapes the camp-event feed three ways:
//   1. GATE — setting-exclusive events only fire in their venue (Chef's slop on
//      a survival island makes no sense; a foraging haul makes no sense at a
//      catered film lot). See SETTING_EXCLUSIVE.
//   2. REWEIGHT — each setting boosts the everyday events that fit it (survival
//      leans on shelter-building + shared meals; film lot leans on ego/drama).
//   3. RESKIN — a VOCAB dictionary + per-setting text pools let shared "texture"
//      events (meals, camp improvement, weather, atmosphere) read like the venue.
// core.js stays a leaf — it only holds the `setting` string; all the flavor lives
// here and is consumed by camp-events.js.
import { seasonConfig } from './core.js';

export const SETTING_LIST = ['hosted-camp', 'survival-island', 'carnival', 'film-lot', 'world-tour'];

export const SEASON_SETTINGS = {
  'hosted-camp': {
    label: 'Hosted Camp', emoji: '🏕️',
    blurb: 'A summer camp run by the host — cabins, a mess hall, and Chef doing the cooking.',
    vocab: { place: 'camp', shelter: 'the cabins', gather: 'the campfire', water: 'the washroom',
             sleep: 'the bunks', downtime: 'the mess hall', foodSource: 'the mess hall' },
    weightMods: {},
    atmosphere: [
      `The dinner bell clangs across {place} and everyone files toward {downtime} whether they're hungry or not.`,
      `Lights-out is called over the camp speakers. Nobody's actually asleep — {a} and {b} keep whispering across the bunks.`,
      `A wasp gets into {shelter} and the whole cabin evacuates in their pajamas. {a} and {b} can't stop laughing about it after.`,
      `The camp flag hangs limp in the dead air. {a} and {b} lie in the grass watching it, talking about nothing.`,
      `Someone finds an old canoe behind {shelter}. {a} and {b} spend the afternoon failing to make it float.`,
      `The morning announcement crackles over the PA with another pointless rule. {a} and {b} share a look.`,
    ],
  },
  'survival-island': {
    label: 'Survival Island', emoji: '🏝️',
    blurb: 'Survivor-style: the cast builds their own shelter, forages and fishes for food, and rides out the weather. No host catering.',
    vocab: { place: 'camp', shelter: 'the shelter', gather: 'the fire', water: 'the well',
             sleep: 'the shelter floor', downtime: 'the beach', foodSource: 'the fishing spot' },
    weightMods: { campImprovement: 1.7, sharedMeal: 1.4, idolSearch: 1.25, injury: 1.2, sharedStruggle: 1.3, homesick: 1.2 },
    atmosphere: [
      `The tide creeps up the beach overnight and soaks the edge of {shelter}. {a} and {b} drag everything to higher ground in the dark.`,
      `Smoke from {gather} won't draw right and the whole {place} smells like wet ash. {a} and {b} take turns fanning it.`,
      `A rat gets into what's left of the rice. {a} and {b} salvage what they can and don't tell the others how little is left.`,
      `The sun is brutal by midday. {a} and {b} crowd into the only shade {shelter} offers and wait it out.`,
      `Nobody's eaten properly in two days. {a} and {b} sit at {downtime} too tired to talk, just keeping each other company.`,
      `A coconut finally cracks open clean and {a} splits it with {b}. Out here, that's a feast.`,
    ],
  },
  'carnival': {
    label: 'Carnival of Chaos', emoji: '🎪',
    blurb: 'A run-down travelling funfair — midway games, rickety rides, a funhouse, and greasy carnival food.',
    vocab: { place: 'the carnival', shelter: 'the striped tents', gather: 'the ticket booth', water: 'the soda fountain',
             sleep: 'the cots', downtime: 'the midway', foodSource: 'the snack stand' },
    weightMods: { groupLaugh: 1.2, prank: 1.15, weirdMoment: 1.3 },
    atmosphere: [
      `The carousel organ plays the same eight bars all night long. {a} and {b} lie awake reciting it and slowly losing their minds.`,
      `The Ferris wheel lights flicker on at dusk, half the bulbs dead. {a} and {b} watch it groan to life from {downtime}.`,
      `A stray balloon animal drifts through {place}. {a} chases it down and presents it to {b} with great ceremony.`,
      `The funhouse mirrors distort everyone who walks past. {a} and {b} pose in them until they're wheezing.`,
      `The smell of stale popcorn hangs over {place}. {a} and {b} split a bag from {foodSource} that's mostly kernels.`,
      `Somewhere a game barker is still shouting to no one at midnight. {a} and {b} start heckling back from {shelter}.`,
    ],
  },
  'film-lot': {
    label: 'Film Lot', emoji: '🎬',
    blurb: 'An abandoned movie studio — leftover sets, star trailers, craft-services catering, and stunts gone wrong.',
    vocab: { place: 'the lot', shelter: 'the trailers', gather: 'the sound stage', water: 'the water cooler',
             sleep: 'the trailers', downtime: 'craft services', foodSource: 'the craft-services table' },
    weightMods: { showboat: 1.3, overplay: 1.15, jealousy: 1.2, confessional: 1.2 },
    atmosphere: [
      `The set from last week's monster-movie shoot still looms over {shelter}. {a} dares {b} to sleep facing it.`,
      `A fog machine kicks on at 2 a.m. for no reason anyone can find. {a} and {b} wander {place} looking for the off switch.`,
      `Craft services restocks the donut table. {a} and {b} stake it out like it's a heist.`,
      `Someone left a director's megaphone on the sound stage. {a} narrates {b}'s every move through it until they both crack up.`,
      `The prop room is unlocked. {a} and {b} come back to {shelter} in ridiculous costumes and refuse to explain.`,
      `Stage lights flare on across {place} and nobody knows who tripped them. {a} and {b} take a mock bow in the glare.`,
    ],
  },
  'world-tour': {
    label: 'World Tour', emoji: '✈️',
    blurb: 'A globe-hopping show run out of a beat-up plane — first class for the winners, economy for everyone else, a new set at every stop.',
    vocab: { place: 'the plane', shelter: 'economy class', gather: 'the aisle', water: 'the galley',
             sleep: 'the economy seats', downtime: 'the cabin', foodSource: 'the drink cart' },
    weightMods: { confessional: 1.25, homesick: 1.3, exclusion: 1.15, celebrateTogether: 1.1 },
    atmosphere: [
      `Turbulence rattles {place} at 3 a.m. {a} grabs the nearest armrest, which turns out to be {b}'s arm. Neither mentions it after.`,
      `First class gets warm towels and a hot meal. {shelter} gets a glare from the curtain. {a} and {b} split a stale roll and plot.`,
      `The plane touches down at a brand-new set and the door hisses open on somewhere none of them recognize. {a} and {b} step off together.`,
      `The cabin lights never fully dim. {a} and {b} give up on sleep and talk across the aisle until landing.`,
      `The drink cart runs out three rows early. {a} flags down nothing and {b} laughs at the sheer futility.`,
      `Somewhere over the ocean the engines drone on. {a} and {b} press their faces to the window at the same cloud and don't say why.`,
    ],
  },
};

// Events that ONLY fire in the listed settings. Anything not in this map is
// universal (people-driven) and fires everywhere, subject to weightMods.
export const SETTING_EXCLUSIVE = {
  // ── host / catering / venue-food beats ──
  chefSlop:        ['hosted-camp'],                                            // Chef literally cooks here
  rudeWakeup:      ['hosted-camp', 'carnival', 'film-lot', 'world-tour'],       // any hosted venue (not survival)
  hostFavoritism:  ['hosted-camp', 'carnival', 'film-lot', 'world-tour'],
  fakeReward:      ['hosted-camp', 'carnival', 'film-lot', 'world-tour'],
  // ── survival-island exclusives ──
  forage:          ['survival-island'],
  shelterStorm:    ['survival-island'],
  fireStruggle:    ['survival-island'],
  rationLow:       ['survival-island'],
  // ── carnival exclusives ──
  midwayGames:     ['carnival'],
  rideDare:        ['carnival'],
  funhouse:        ['carnival'],
  carnivalTreat:   ['carnival'],
  // ── film-lot exclusives ──
  craftServices:   ['film-lot'],
  stuntWrong:      ['film-lot'],
  trailerEnvy:     ['film-lot'],
  // ── world-tour exclusives ──
  classDivide:     ['world-tour'],
  jetLag:          ['world-tour'],
  planeFood:       ['world-tour'],
};

export function currentSetting() {
  const s = seasonConfig?.setting;
  return (s && SEASON_SETTINGS[s]) ? s : 'hosted-camp';
}
export function settingProfile() { return SEASON_SETTINGS[currentSetting()]; }
export function settingVocab(token) { return settingProfile().vocab[token] || token; }
export function fillVocab(str) {
  const v = settingProfile().vocab;
  return String(str).replace(/\{(place|shelter|gather|water|sleep|downtime|foodSource)\}/g, (_, k) => v[k] || k);
}
export function eventAllowedInSetting(id) {
  const allowed = SETTING_EXCLUSIVE[id];
  return !allowed || allowed.includes(currentSetting());
}
export function settingWeightMod(id) { return settingProfile().weightMods?.[id] ?? 1; }
