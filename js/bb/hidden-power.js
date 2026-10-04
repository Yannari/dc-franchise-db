// ══════════════════════════════════════════════════════════════════════
// bb/hidden-power.js — something in this house
// ══════════════════════════════════════════════════════════════════════
//
// The last channel, and the only one where the power does not come to you.
//
// Every other distributor HANDS a power over. You win a competition, you open
// a box, a country votes for you, you buy it, you are offered it in a red
// room. In all six the object arrives. Here it is already in the house, in a
// specific place, and the only way to hold it is to go and look — which means
// this is the one channel whose mechanic is a BEHAVIOUR rather than an event.
//
// HONEST ABOUT THE SOURCE: this is wiki-adjacent rather than a transcription.
// The lineage is the secret room — BB18's coded phone booth, BB Canada's
// hidden powers — and the phone booth itself is already spoken for by the
// Round Trip Ticket. So the rules below are built for the channel's promise
// ("hidden in the house, found by looking") rather than copied off one season.
//
// The whole design turns on one thing the format gives us free: THE HOUSE HAS
// NO PRIVACY. Searching is not a hidden action. Somebody rummaging behind the
// bins at four in the morning is a houseguest visibly behaving like a person
// who thinks there is something to find, and that produces the loop nothing
// else in this simulator has:
//
//   - looking is a tell, so the searcher pays for searching
//   - being seen looking makes OTHER people look, because now they believe
//   - the near miss: somebody searched the right room a day too late
//   - and if nobody ever finds it, nobody ever learns it was there
//
// Two ways to lose it, both good: somebody else gets there first, or the fuse
// runs out with it still sitting in the wall.

import { gs, players } from '../core.js';
import { pStats } from '../players.js';
import { addBond, getPerceivedBond } from '../bonds.js';
import { clamp } from '../bb-comps/_shared.js';
import { BB_POWER_DEFINITIONS, grantPower } from './powers.js';

/** How many evictions it stays findable for before it is gone for good. */
export const HIDDEN_WEEKS = 4;

/**
 * Where a thing can be hidden in a house with cameras in every room.
 *
 * Deliberately ordinary places. The joke of the twist is that it is in the
 * kind of spot anybody could have looked in on day one and nobody did.
 */
export const HIDING_PLACES = Object.freeze([
  { id: 'pantry', name: 'behind the cereal in the pantry', traffic: 0.9 },
  { id: 'have-not', name: 'taped under a have-not bed', traffic: 0.35 },
  { id: 'diary', name: 'down the side of the Diary Room chair', traffic: 0.8 },
  { id: 'hoh-bath', name: 'in the HOH bathroom cistern', traffic: 0.25 },
  { id: 'storage', name: 'inside a spare pillowcase in storage', traffic: 0.7 },
  { id: 'yard', name: 'under a loose board by the hammock', traffic: 0.4 },
  { id: 'laundry', name: 'in the lint trap of the dryer', traffic: 0.5 },
  { id: 'memory', name: 'behind the memory wall itself', traffic: 0.15 },
]);

const beat = (text, players, badgeText, badgeClass = 'twist', part = null, extra = {}) =>
  ({ type: 'hidden-power', text, players: [...players].filter(Boolean), badgeText, badgeClass, ...(part ? { part } : {}), ...extra });

const noise = (rng, amt = 2.5) => (rng() - 0.5) * amt * 2;





// The near miss NEVER names the place. The viewer is being told somebody was
// one day late; telling them WHERE would hand over the hiding spot on a public
// surface, which is the one thing this twist keeps back — and the transcript
// prints these, so a leak here is a leak everywhere.



function store() { gs.bb ||= {}; return gs.bb; }

/** The live hidden power, if there is one. */
export function hiddenPowerState() { return store().hiddenPower || null; }

/**
 * Hide it. Runs once, on the week the twist is scheduled.
 *
 * The house is told it exists and nothing else — an announcement with no
 * information in it, which is the most destabilising thing you can hand a
 * group of people who already suspect each other.
 */
export function hidePower({ week, house, rng = Math.random, powerId = 'the-cloud' } = {}) {
  if (hiddenPowerState() || (house || []).length < 4) return null;
  const def = BB_POWER_DEFINITIONS[powerId] || BB_POWER_DEFINITIONS['the-cloud'];
  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  // The words are written by bb/script/ceremony.js (lines/huntact.js); `rng()`
  // stands where a wording was drawn, so the week rolls as it did.
  const spot = HIDING_PLACES[Math.floor(rng() * HIDING_PLACES.length)];
  rng();   // the draw that picked the announcement's wording

  store().hiddenPower = {
    powerId: def.id, place: spot.id, placeName: spot.name, traffic: spot.traffic,
    hiddenWeek: weekNum, expiresAfterWeek: weekNum + HIDDEN_WEEKS - 1,
    found: false, finder: null, gone: false,
    // Who has looked, and where. The house cannot see this list; the Debug
    // panel can, and the near-miss reads off it.
    searched: [], heat: 0,
  };

  return {
    type: 'hidden-power', phase: 'hidden', week: weekNum, secret: true,
    // Never where: the act is what the transcripts and screens are built from.
    power: def.name, weeksLeft: HIDDEN_WEEKS,
    beats: [beat(`Big Brother tells the house that ${def.name} is hidden somewhere inside.`, [], 'SOMETHING IN THIS HOUSE', 'gold', 'announce')],
  };
}

/**
 * A week of looking for it.
 *
 * `heat` is the house's collective belief that there is anything to find, and
 * it is the contagion: it rises every time somebody is SEEN searching, and a
 * believing house searches far harder than a sceptical one. That is why the
 * twist accelerates — the first searcher is the expensive one.
 */
export function searchForPower({ week, house, nominees = [], rng = Math.random } = {}) {
  const hp = hiddenPowerState();
  if (!hp || hp.found || hp.gone) return null;
  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  const room = (house || []).filter(Boolean);
  if (!room.length) return null;

  // Out of time. Nobody is told, because nobody ever knew.
  if (weekNum > hp.expiresAfterWeek) {
    hp.gone = true;
    rng();
    return {
      type: 'hidden-power', phase: 'expired', week: weekNum, secret: true,
      power: BB_POWER_DEFINITIONS[hp.powerId]?.name || 'it', place: hp.place, placeName: hp.placeName,
      beats: [beat(`Nobody found ${BB_POWER_DEFINITIONS[hp.powerId]?.name || 'it'}. It was ${hp.placeName}.`,
        [], 'NEVER FOUND', 'grey', 'expired')],
    };
  }

  const beats = [];
  const searchers = [];
  const heatBefore = hp.heat;

  for (const name of room) {
    const st = pStats(name);
    const onBlock = nominees.includes(name);
    // Curiosity, nerve, need, and how much the house currently believes.
    const pull = 0.10
      + st.intuition * 0.020
      + st.boldness * 0.015
      + (onBlock ? 0.16 : 0)
      + hp.heat * 0.09;
    if (rng() < clamp(pull, 0, 0.75)) searchers.push(name);
  }
  if (!searchers.length) return null;

  // Does anybody look in the right place? A quiet corner is harder to think of
  // and easier to search unseen; a high-traffic one is the opposite.
  let finder = null;
  for (const name of searchers) {
    const st = pStats(name);
    const chance = clamp(0.06 + st.intuition * 0.022 + (1 - hp.traffic) * 0.05
      + (hp.searched.includes(name) ? 0.07 : 0), 0, 0.5);
    // A fruitless search is narrated with a place that is NOT the real one.
    //
    // This used to draw from the whole list, so roughly one search in eight
    // named the true hiding place in a public beat — and the transcript then
    // read "X spends twenty minutes <exactly where it is> and comes out with
    // nothing", which hands the reader the secret the twist is built on. It
    // failed only when the dice landed there, which is why it presented as a
    // flaky test rather than as the leak it is.
    //
    // Excluding it is also the better scene: the tension of this twist is the
    // house searching everywhere EXCEPT the one place that matters.
    const decoys = HIDING_PLACES.filter(p => p.id !== hp.place);
    const where = decoys[Math.floor(rng() * decoys.length)] || HIDING_PLACES[0];
    if (!hp.searched.includes(name)) hp.searched.push(name);

    if (!finder && rng() < chance) { finder = name; continue; }
    rng();
    beats.push(beat(`${name} searches ${where.name} and finds nothing.`, [name], 'LOOKING', 'grey', 'search', { place: where.id }));
  }

  // ── being seen ──
  //
  // The cost, and the engine of the whole twist. Searching in a house with no
  // privacy is a public statement that you believe there is something to find,
  // and it makes everybody else believe it too.
  const watchers = room.filter(n => !searchers.includes(n));
  for (const who of searchers) {
    if (!watchers.length) break;
    const by = watchers[Math.floor(rng() * watchers.length)];
    if (rng() > 0.55) continue;
    rng();
    beats.push(beat(`${by} sees ${who} searching.`, [by, who], 'SEEN LOOKING', 'red', 'seen'));
    addBond(by, who, -0.4);
    hp.heat = Math.min(4, hp.heat + 1);
    gs.popularity ||= {};
    gs.popularity[who] = (gs.popularity[who] || 0) + 1;
    if (rng() < 0.45) {
      const joiner = watchers.find(n => n !== by && !searchers.includes(n));
      if (joiner) { rng(); beats.push(beat(`${joiner} starts searching too.`, [joiner], 'IT SPREADS', 'grey', 'spread')); }
    }
  }

  if (!finder) {
    return { type: 'hidden-power', phase: 'search', week: weekNum, secret: true,
      searchers: [...searchers], found: false, heat: hp.heat, heatBefore,
      weeksLeft: hp.expiresAfterWeek - weekNum + 1, beats };
  }

  hp.found = true;
  hp.finder = finder;
  const def = BB_POWER_DEFINITIONS[hp.powerId];
  grantPower(hp.powerId, finder, { week: weekNum, visibility: 'secret', source: 'bb-hidden-power' });
  rng();
  beats.push(beat(`${finder} finds ${def.name} ${hp.placeName} and tells nobody.`, [finder], 'FOUND IT', 'gold', 'found', { place: hp.place }));

  // The near miss. Somebody who had been looking all along and got there late
  // — they do not know how close it was, and the viewer does.
  const late = searchers.filter(n => n !== finder);
  if (late.length) {
    const unlucky = late[Math.floor(rng() * late.length)];
    rng();
    beats.push(beat(`${unlucky} was looking, but too late.`, [unlucky], 'A DAY TOO LATE', 'grey', 'near'));
  }

  return {
    type: 'hidden-power', phase: 'found', week: weekNum, secret: true,
    searchers: [...searchers], found: true, finder, power: def.name,
    place: hp.place, placeName: hp.placeName, heat: hp.heat, heatBefore, weeksLeft: hp.expiresAfterWeek - weekNum + 1, beats,
  };
}
