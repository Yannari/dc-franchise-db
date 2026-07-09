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
    // how contestants show up in episode 1
    arrival: { vehicle: 'boat', verb: 'steps off the boat', point: 'the dock', onPoint: 'on the dock',
               headline: 'One camp. No idea what they signed up for.', groupCall: 'Everybody on the dock!' },
    // setting-appropriate text for otherwise-universal "texture" events
    reskin: {
      meal: [ `{a} snags an extra tray in the mess hall and slides it to {b}. Small thing. It counts.`,
              `{a} and {b} split whatever Chef called "lunch" and rate it cruelly. Bonding over bad cafeteria food.`,
              `{a} saves {b} a seat and the last decent roll at the mess table. {b} notices.` ],
      improve: [ `{p} sweeps out {shelter} and claims the good bunk for the cabin. Everyone benefits; nobody thanks {po}.`,
                 `{p} rigs a clothesline and tidies {shelter} while the others laze at {downtime}. Quiet, useful work.`,
                 `{p} fixes the busted screen door on {shelter} so the bugs stop getting in. The cabin sleeps better for it.` ],
      wildlife: [ `A raccoon raids {downtime} and makes off with someone's snack. Half the camp gives chase; nobody wins.`,
                  `A loon calls out over the lake at dusk and the whole camp goes quiet to listen. Just for a second.`,
                  `A frog gets loose in {shelter} and the cabin loses its collective mind at 2 a.m.` ],
      weather: [ `Rain drums on {shelter}'s tin roof all afternoon. Everyone's stuck inside, and conversations start that wouldn't have otherwise.`,
                 `A perfect sunset over the lake. The camp drifts to {gather} to watch it without anyone suggesting it.`,
                 `The temperature drops after dark and the whole camp clusters at {gather} closer than they have all season.` ],
    },
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
    arrival: { vehicle: 'boat', verb: 'wades ashore', point: 'the beach', onPoint: 'on the beach',
               headline: 'Marooned with nothing but each other.', groupCall: 'Gather on the beach!' },
    reskin: {
      meal: [ `{a} catches a fish and brings it straight to {b}. They eat it by {downtime} without saying much. The silence is comfortable.`,
              `{a} notices {b} hasn't eaten all day and hands over the last of the coconut. No words. Just the offering.`,
              `{a} and {b} split a meager ration of rice at {gather}, grain for grain, and somehow it's enough.` ],
      improve: [ `{p} rebuilds the shelter support structure in an afternoon. The tribe sleeps better tonight. Nobody questions {po} value.`,
                 `{p} reinforces the fire pit with rocks hauled up from {downtime}. Hours of work — but the fire holds through the wind now.`,
                 `{p} digs a drainage channel around {sleep} so it stays dry when the rain comes. The tribe takes note.` ],
      wildlife: [ `A group of fish jump near the shore mid-conversation. Everyone stops to watch. For thirty seconds nothing else exists.`,
                  `Something rustles in the trees above camp. Silence. It's a monkey — it throws a coconut, misses, and camp erupts.`,
                  `Crabs scuttle across {sleep} in the night. Half the tribe is up shrieking; the other half is too tired to care.` ],
      weather: [ `The rain comes sideways and doesn't stop. The tribe huddles under {shelter}, and things get said that daylight wouldn't allow.`,
                 `A clear night after days of cloud. The tribe lies out on {downtime} looking up. For a moment it doesn't feel like a game.`,
                 `The tide creeps higher than usual and everyone watches the waterline, half-nervous, half-mesmerized.` ],
    },
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
    arrival: { vehicle: 'bus', verb: 'steps off the bus', point: 'the front gates', onPoint: 'at the gates',
               headline: 'One rickety carnival. Step right up.', groupCall: 'Everyone through the turnstiles!' },
    reskin: {
      meal: [ `{a} blows the last tickets on a funnel cake and splits it with {b} at {downtime}. Powdered sugar everywhere, zero regrets.`,
              `{a} grabs two corn dogs of dubious origin from {foodSource} and hands one to {b}. They rate it far too highly.`,
              `{a} wins a candy apple at the ring toss and gives it straight to {b}. {b} keeps the stick.` ],
      improve: [ `{p} restrings the lights on {shelter} and sweeps the sawdust out. The tents almost look inviting. Almost.`,
                 `{p} claims the least-broken cot in {shelter} for the team and props up the sagging tent pole. Small kingdom, well run.`,
                 `{p} oils the squeaky flaps on {shelter} so the tent stops screaming in the wind. Everyone sleeps better.` ],
      wildlife: [ `A midway pigeon struts off with someone's popcorn like it owns {place}. Nobody argues with it.`,
                  `The carousel horses creak in the wind and, just for a second, everyone swears one of them moved.`,
                  `A stray carnival cat adopts the team and parks itself on the warmest cot in {shelter}. It is now in charge.` ],
      weather: [ `Rain turns {downtime} to mud and the neon smears in the puddles. The team crowds under an awning and waits it out.`,
                 `The Ferris wheel lights flicker on against a purple dusk. The team drifts to {gather} to watch it groan to life.`,
                 `Wind kicks up and sends ticket stubs swirling across {place}. Everyone chases their hats and laughs.` ],
    },
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
    arrival: { vehicle: 'studio shuttle', verb: 'steps off the shuttle', point: 'the studio gates', onPoint: 'on the lot',
               headline: 'Lights, camera — no idea what they signed up for.', groupCall: 'Everyone to the sound stage!' },
    reskin: {
      meal: [ `{a} raids {foodSource} before anyone's up and saves {b} the good snacks. On a film lot, that's a blood oath.`,
              `{a} builds an absurd sandwich from {downtime} and splits it with {b}. Best either has felt all week.`,
              `{a} guards the last real coffee at {foodSource} and pours {b} a cup. Loyalty, catered.` ],
      improve: [ `{p} tidies {shelter} and rewires the busted lamp so the trailer isn't a fire hazard anymore. Nobody asked; everybody benefits.`,
                 `{p} drags the good couch from an old set into {shelter} and claims it for the team. Instant morale.`,
                 `{p} sorts the prop clutter out of {shelter} until it's actually livable. The trailers feel less like storage now.` ],
      wildlife: [ `A pigeon has gotten into the rafters of {gather} and no one can coax it down. It watches every take, judging.`,
                  `A lot cat naps in a spotlight on {gather} and refuses to move for anyone. Filming works around it.`,
                  `Something skitters behind the old monster-movie set. Everyone insists it's a raccoon. Nobody checks.` ],
      weather: [ `The lot's ancient A/C dies and {shelter} turns into an oven. Everyone melts at {downtime} and gets punchy.`,
                 `Studio fog machines kick on across {place} for no reason and turn dusk cinematic. The team poses in it.`,
                 `Rain hammers the sound-stage roof so loud they can't film. The team waits it out at {downtime}, restless.` ],
    },
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
    arrival: { vehicle: 'plane', verb: 'boards the plane', point: 'the boarding stairs', onPoint: 'aboard',
               headline: 'One beat-up plane. Destination: anywhere.', groupCall: 'Everyone find a seat!' },
    reskin: {
      meal: [ `Economy gets a foil tray of something beige. {a} trades the edible bits back and forth with {b} and makes a bit of it.`,
              `The cart skips their row. {a} and {b} split one warm soda from {foodSource} and toast to better days up front.`,
              `{a} saves {b} the only roll that isn't rock-hard. On this flight, that's romance-adjacent.` ],
      improve: [ `{p} tidies the wreck of {shelter} — stows the bags, claims the exit row's legroom for the team. Small mercies at altitude.`,
                 `{p} rigs a curtain from a blanket so {shelter} gets a little privacy from first class. Genius, petty, appreciated.`,
                 `{p} organizes the overhead chaos in {shelter} and finds two forgotten snacks. Instant hero.` ],
      wildlife: [ `A bug — an actual bug, at 30,000 feet — appears in {shelter}. Its origin is a mystery nobody wants solved.`,
                  `Someone's emotional-support hamster gets loose in {downtime} and the whole cabin joins the hunt.`,
                  `A bird got into the terminal before takeoff and, somehow, onto {place}. It rides in the overhead like a stowaway.` ],
      weather: [ `Turbulence rattles {place} and everyone grabs the nearest armrest — or arm. Nobody mentions it after.`,
                 `The cabin depressurizes just enough to pop everyone's ears at once. Shared misery, shared laughter.`,
                 `The plane banks over a storm and lightning flickers past the windows. The whole cabin presses to the glass.` ],
    },
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
export function settingArrival() { return settingProfile().arrival || SEASON_SETTINGS['hosted-camp'].arrival; }
// Pull a setting-appropriate line for a "texture" category (meal/improve/wildlife/weather).
// Falls back to hosted-camp so a setting missing a pool never breaks. Returns raw
// text with {a}/{b}/{p}/{po}/vocab tokens still in place — caller fills names, then fillVocab().
export function settingReskin(category) {
  const pool = settingProfile().reskin?.[category] || SEASON_SETTINGS['hosted-camp'].reskin?.[category] || [];
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : '';
}
