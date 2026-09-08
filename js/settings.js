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

/**
 * Settings belong to a show, not to the franchise.
 *
 * A survival island is not a place Big Brother can happen and a house is not a
 * place Total Drama can happen, so the setting list is scoped by format. The
 * config screen was offering a house season a choice between a camp and a
 * film lot, which is a question with no correct answer.
 */
export const SETTINGS_BY_FORMAT = {
  'total-drama': SETTING_LIST,
  'big-brother': ['bb-house', 'bb-compound', 'bb-resort', 'bb-manor'],
  // One venue, because the show has one. A list of one still goes through the
  // same scoping so the dropdown draws the right thing and `defaultSettingFor`
  // has an answer that is not a summer camp.
  'drag-race': ['dr-werkroom'],
};

export function settingsForFormat(fmt) {
  return SETTINGS_BY_FORMAT[fmt] || SETTING_LIST;
}

/** The default setting for a show — the first one it has. */
export function defaultSettingFor(fmt) {
  return settingsForFormat(fmt)[0];
}

/**
 * The venue a house season is actually in.
 *
 * A season carried over from Total Drama can still be pointing at a summer
 * camp, and house events must never describe one. Resolves to a real house
 * whatever the config says.
 */
export function houseSetting() {
  const current = seasonConfig?.setting;
  return settingsForFormat('big-brother').includes(current) ? current : 'bb-house';
}
export function houseProfile() { return SEASON_SETTINGS[houseSetting()]; }
export function houseVocab(token) { return houseProfile().vocab[token] || token; }

export const SEASON_SETTINGS = {
  /**
   * The house.
   *
   * Big Brother has exactly one venue and it never changes, which is the
   * point of it: the same rooms, the same cameras and the same people for
   * three months. More house themes can be added here the way Total Drama
   * added venues; the format only needs one to be correct.
   */
  'bb-house': {
    label: 'The House', emoji: '🏠',
    blurb: 'One house, sealed from the outside. Cameras in every room, a live feed that never stops, and an HOH suite somebody new sleeps in every week.',
    vocab: { place: 'the house', shelter: 'the bedrooms', gather: 'the living room', water: 'the washroom',
             sleep: 'the beds', downtime: 'the lounge', foodSource: 'the kitchen' },
    arrival: { vehicle: 'front door', verb: 'walks through the front door', point: 'the living room',
               onPoint: 'in the living room', headline: 'One house. No way out but a vote.',
               groupCall: 'Everybody to the living room!' },
    reskin: {
      meal: [ `{a} cooks enough for two and leaves a plate out where {b} will find it.`,
              `{a} and {b} eat standing at the kitchen counter at 2 a.m., which is when the honest conversations happen.`,
              `{a} saves {b} the last of the good coffee. In here that is a gesture with weight.` ],
      improve: [ `{p} cleans {shelter} without being asked. The house notices, which was the idea.`,
                 `{p} reorganises the kitchen and quietly makes {po}self useful to people who were not thinking about {po}.`,
                 `{p} does everybody's dishes at midnight. It is a strategy as much as a chore.` ],
      wildlife: [ `A wasp gets into {gather} through the vent and the whole house evacuates in pyjamas.`,
                  `Something is living behind the storage room wall. The house has named it and taken sides.` ],
      weather: [ `Rain hammers the backyard all day. Nobody can go outside, and the conversations turn sharper for it.`,
                 `The air conditioning is set to freezing again. {a} and {b} end up sharing a blanket in {gather} and talking longer than either meant to.` ],
    },
    atmosphere: [
      `The feeds cut to fish. Whatever was said in {gather} is not on the record.`,
      `Lockdown is called and the whole house is herded into {shelter} for an hour with nothing to do but talk.`,
      `The house lights come up at 8 a.m. whether anybody is ready or not. {a} and {b} are already whispering in {sleep}.`,
      `Somebody has been in the diary room a long time. {a} and {b} both notice, and both pretend not to.`,
      `The backyard opens after two days shut. {a} and {b} take the first lap together, out of earshot.`,
      `The HOH suite door closes upstairs. Downstairs, {a} and {b} do the arithmetic on who went in with {po}.`,
    ],
  },

  /**
   * The compound — concrete, industrial, deliberately uncomfortable.
   *
   * The house as a pressure cooker rather than a home. Nothing here is soft,
   * the lights are too bright, and there is nowhere to have a private
   * conversation that does not look like a private conversation.
   */
  'bb-compound': {
    label: 'The Compound', emoji: '🏭',
    blurb: 'Concrete, steel bunks and strip lighting. Built to be endured rather than lived in, with nowhere to hide a conversation.',
    vocab: { place: 'the compound', shelter: 'the bunk room', gather: 'the mess hall', water: 'the wash block',
             sleep: 'the bunks', downtime: 'the yard', foodSource: 'the ration store' },
    arrival: { vehicle: 'steel door', verb: 'is buzzed through the steel door', point: 'the mess hall',
               onPoint: 'in the mess hall', headline: 'No comforts. No corners. No way out but a vote.',
               groupCall: 'Everybody to the mess hall!' },
    reskin: {
      meal: [ `{a} and {b} eat rations off metal trays and rank them, which takes under a minute.`,
              `{a} gives {b} half a portion without making a thing of it. In here that is enormous.`,
              `The ration store opens for four minutes. {a} grabs enough for {b} too.` ],
      improve: [ `{p} scrubs {shelter} because the alternative is sitting still with {po}wn thoughts.`,
                 `{p} rigs a curtain across a corner of {shelter}. It is the only privacy in the building and everybody wants it.`,
                 `{p} fixes the flickering strip light over {gather}. Nobody asked; everybody notices.` ],
      wildlife: [ `Something is nesting in the vent above {sleep} and the whole bunk room has opinions about it.`,
                  `A bird gets into {gather} and the room is briefly, genuinely delighted.` ],
      weather: [ `The heating fails overnight. {a} and {b} end up back to back in {sleep} and neither mentions it again.`,
                 `Rain on a steel roof is unbelievably loud. Nobody sleeps, and by 3 a.m. everybody is talking.` ],
    },
    atmosphere: [
      `A klaxon calls a lockdown and the compound files into {shelter} without being told twice.`,
      `The strip lights come up at six. There is no arguing with them. {a} is already awake and watching {b} pretend to be asleep.`,
      `{a} and {b} walk laps of {downtime} because it is the only place a conversation is not overheard, and everybody can see them doing it.`,
      `The wash block runs cold again. The queue outside it is where half this season's deals get made.`,
      `Somebody has scratched a tally into the wall by {sleep}. It is longer than anybody wants to look at.`,
      `The ration store is bare by Thursday. {a} and {b} split what is left and call it a strategy meeting.`,
    ],
  },

  /**
   * The resort — a luxury house with a backyard nobody wants to leave.
   *
   * Comfort makes people careless. Everything here is pleasant, which is
   * exactly why nobody notices the game being played around the pool.
   */
  'bb-resort': {
    label: 'The Resort', emoji: '🌴',
    blurb: 'A luxury house with a pool, a bar and a backyard in permanent summer. Comfortable enough that people forget they are playing.',
    vocab: { place: 'the resort', shelter: 'the cabanas', gather: 'the poolside', water: 'the pool',
             sleep: 'the loungers', downtime: 'the backyard bar', foodSource: 'the outdoor kitchen' },
    arrival: { vehicle: 'gate', verb: 'comes through the gate into the sun', point: 'the poolside',
               onPoint: 'by the pool', headline: 'Paradise, with one door and a jury.',
               groupCall: 'Everybody to the pool!' },
    reskin: {
      meal: [ `{a} grills for the house and makes sure {b} eats first. Everybody sees it.`,
              `{a} and {b} eat by the pool long after everyone else has gone in, and the conversation drifts somewhere useful.`,
              `The outdoor kitchen turns into a production line. {a} and {b} work it together and talk the whole time.` ],
      improve: [ `{p} skims the pool every morning before anybody is up. It is a small kingdom and {p} runs it.`,
                 `{p} restocks {downtime} without being asked and banks the goodwill.`,
                 `{p} drags the loungers into the shade for everybody. Cheap, effective, remembered.` ],
      wildlife: [ `A lizard takes up residence by {gather} and is named, adopted and argued over within a day.`,
                  `Something enormous flies through {downtime} at dusk and the whole yard ducks in unison.` ],
      weather: [ `The heat is unbearable by two. Nobody moves, everybody talks, and {a} says more to {b} than {a} meant to.`,
                 `A warm night, no wind, and half the house sleeps outside. Conversations happen that would not happen indoors.` ],
    },
    atmosphere: [
      `The pool is loud all afternoon and the quietest people in the house are the ones getting things done.`,
      `{a} and {b} float at opposite ends of the pool having the most important conversation of the week at a volume nobody can hear.`,
      `The bar opens. Somebody says something honest, and it is not clear yet whether that was a mistake.`,
      `Sunset on the backyard and the whole house stops for it. {a} watches {b} instead.`,
      `The cabanas are the only shade left. Who is sitting in them, and with whom, is the entire map of this season.`,
      `Music from {downtime} covers everything, which is exactly why {a} picked it for this conversation.`,
    ],
  },

  /**
   * The manor — an old house that was never meant to be a set.
   *
   * Cold, creaking and full of rooms, which is the opposite problem to the
   * compound: there are too many places to disappear to, and disappearing is
   * itself a statement.
   */
  'bb-manor': {
    label: 'The Manor', emoji: '🕯️',
    blurb: 'A cold, creaking old house with far too many rooms. Plenty of places to disappear to — and disappearing is itself a statement.',
    vocab: { place: 'the manor', shelter: 'the east wing', gather: 'the drawing room', water: 'the bathhouse',
             sleep: 'the four-posters', downtime: 'the library', foodSource: 'the pantry' },
    arrival: { vehicle: 'front steps', verb: 'climbs the front steps and is let in', point: 'the drawing room',
               onPoint: 'in the drawing room', headline: 'An old house, a locked door, and thirteen strangers.',
               groupCall: 'Everybody to the drawing room!' },
    reskin: {
      meal: [ `{a} and {b} eat at opposite ends of a table built for thirty, and end up shouting friendly things down it.`,
              `{a} raids the pantry at midnight and finds {b} already there, which becomes a standing arrangement.`,
              `{a} lays the long table properly for everybody. It is theatre, and it works.` ],
      improve: [ `{p} gets a fire going in {gather} and instantly becomes the centre of the house.`,
                 `{p} sweeps out {shelter}, which nobody had been into for a week, and finds something worth knowing.`,
                 `{p} shuts the draughty windows in {downtime}. The room becomes the warmest in the manor and {p} is in it.` ],
      wildlife: [ `Something moves in the walls of {shelter} at night. Half the house refuses to sleep there now.`,
                  `A crow watches {gather} through the window every morning and the house has decided it means something.` ],
      weather: [ `The manor is freezing. {a} and {b} end up sharing the fire in {gather} and talking until it goes out.`,
                 `Wind all night in the chimneys. Nobody sleeps, and by dawn three separate deals have been made.` ],
    },
    atmosphere: [
      `A door closes somewhere in the east wing. Everybody in {gather} hears it and everybody pretends not to count who is missing.`,
      `{a} and {b} take the long way round through {downtime} because it is the only route nobody else uses.`,
      `The fire in {gather} is the only warm thing in the manor, so the whole game is played in one room whether anybody likes it or not.`,
      `Floorboards upstairs. {a} looks at the ceiling, then at {b}, and neither says the name they are both thinking.`,
      `The manor has too many rooms. Disappearing into one is the loudest thing a houseguest can do here.`,
      `Candles in {downtime} because the lights went again. {a} and {b} say things in that light they would not say under bulbs.`,
    ],
  },
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

  // ── DRAG RACE ──────────────────────────────────────────────────────
  //
  // One venue, because the show has one: a workroom with a mirror station per
  // queen and a stage through the far door. This entry exists so the setting
  // dropdown has something true to offer and the vocabulary dictionary has a
  // place to resolve; the drag engine writes its own scenes and does not draw
  // on the shared camp-event reskin pools.
  'dr-werkroom': {
    label: 'The Werk Room', emoji: '💄',
    blurb: 'A workroom of lit mirrors and sewing machines, a rack per queen, and a door at the end that opens onto the main stage.',
    vocab: { place: 'the werk room', shelter: 'the mirror stations', gather: 'the werk room',
             water: 'the sinks', sleep: 'the hotel', downtime: 'the lounge', foodSource: 'the craft table' },
    arrival: { vehicle: 'werk room door', verb: 'walks through the werk room door', point: 'the werk room',
               onPoint: 'in the werk room', headline: 'One workroom. One crown.',
               groupCall: 'Ladies, to the main stage!' },
    reskin: {},
    atmosphere: [],
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
  // ── hosted-camp exclusives ──
  messHallDrama:   ['hosted-camp'],
  cabinRaid:       ['hosted-camp'],
  campfireStory:   ['hosted-camp'],
  // ── survival-island exclusives ──
  forage:          ['survival-island'],
  shelterStorm:    ['survival-island'],
  fireStruggle:    ['survival-island'],
  rationLow:       ['survival-island'],
  waterRun:        ['survival-island'],
  exhaustion:      ['survival-island'],
  wildlifeScare:   ['survival-island'],
  // ── carnival exclusives ──
  midwayGames:     ['carnival'],
  rideDare:        ['carnival'],
  funhouse:        ['carnival'],
  carnivalTreat:   ['carnival'],
  dunkTank:        ['carnival'],
  prizeBooth:      ['carnival'],
  // ── film-lot exclusives ──
  craftServices:   ['film-lot'],
  stuntWrong:      ['film-lot'],
  trailerEnvy:     ['film-lot'],
  wardrobeVanity:  ['film-lot'],
  divaFit:         ['film-lot'],
  bloopers:        ['film-lot'],
  // ── world-tour exclusives ──
  classDivide:     ['world-tour'],
  jetLag:          ['world-tour'],
  planeFood:       ['world-tour'],
  layover:         ['world-tour'],
  souvenirGrab:    ['world-tour'],
};

// ── Survival-mechanic narration, per venue. When the food/water survival system
// (seasonConfig.foodWater) is on, episode.js draws its provider/slacker/hunger/
// collapse beats from here so they read native to the venue instead of always
// assuming a forage-and-fish island. Templates use {a}/{b} (two players),
// {p} (featured player), {po} (possessive) — venue nouns are written inline
// (no vocab tokens needed; each pool is venue-specific by construction).
// episode.js fills the tokens (it has pronouns + fillVocab). Any event type a
// venue omits falls back to survival-island, then hosted-camp, so nothing breaks.
export const SETTING_SURVIVAL = {
  'hosted-camp': {
    providerFood: [
      `{p} sweet-talks Chef out of an extra tray and hauls it back to the cabins. The camp eats better tonight — and everyone knows who to thank.`,
      `While the others argue strategy, {p} pulls kitchen duty in the mess hall in exchange for seconds. {po} plate feeds three people. Nobody forgets that.`,
      `{p} finds the pantry Chef forgot to lock and quietly restocks the cabin. Not stealing, exactly — redistributing. The camp eats.`,
    ],
    providerPraised: [
      `"I don't know what we'd do without {p}," someone says at the campfire. Nobody disagrees. {po} kitchen runs have been keeping the whole camp fed.`,
      `The camp's running on cafeteria scraps — but {p} keeps talking Chef into extra rations. {po} doesn't make a thing of it. The camp notices anyway.`,
    ],
    slackerCalledOut: [
      `{a} pulls {b} aside by the mess hall: "People notice you skip every chore. It's going to be a problem." {b} shrugs. That shrug costs {b} more than {b} knows.`,
      `"Hey {b}, when's the last time you did a dish?" {a} asks it light, but the message lands. The camp's keeping score of who works and who coasts.`,
    ],
    slackerConfrontation: [
      `{a} finally snaps. "We're all pulling chores and {b} is napping in the cabin. I'm done covering for {b}." The mess hall goes dead silent.`,
      `{a} slams a tray down on the table. "Sweep, haul, dishes — anything. {b} does NOTHING." {b} doesn't look up. Somehow that's worse.`,
    ],
    slackerBonding: [
      `While the rest of the camp hauls firewood, {a} and {b} are sprawled on the good bunks comparing mosquito bites. Nobody says anything. Everyone notices.`,
      `{a} and {b} have a rhythm: sleep through chores, show up for meals, avoid eye contact with the people working. It's not a strategy. It's a lifestyle.`,
    ],
    foodConflict: [
      `The good snacks are almost gone. {a} catches {b} taking a second helping in the mess hall. "That's not yours." What follows isn't pretty.`,
      `{a} and {b} argue over who finished the last of the camp rations. It's not about the food. It's about everything. Hunger makes it all worse.`,
    ],
    foodHoarding: [
      `{a} finds a stash of snacks hidden under {b}'s bunk. The look on {a}'s face says everything. {b}'s been skimming from the whole cabin.`,
      `{a} catches {b} sneaking food from the mess-hall stores after lights-out. Word's all over camp by breakfast. The cabin is furious.`,
    ],
    starvationBond: [
      `{a} and {b} sit at the empty mess table splitting one sad ration between them. Nobody speaks. Hunger has a way of stripping everything down to what matters.`,
      `It's been two days of thin camp meals. {a} and {b} share the last decent roll in silence. The game feels very far away right now.`,
    ],
    foodRationing: [
      `{p} takes charge of the camp stores. "We portion this out or we're eating pine needles by Friday." Nobody argues. {po} counts every packet.`,
      `{p} sets up a rationing board on the mess-hall wall. Equal shares, no exceptions. The camp doesn't love it — but they're still eating.`,
    ],
    foodCrisis: [
      `The mess hall's locked and Chef's "gone home." The camp sits in the dark cabins, too tired to scheme, too hungry to sleep. This is the game when the host stops feeding you.`,
      `No rations left, and the fire in the pit's gone cold. Eyes are hollow. Conversation's stopped. The game is secondary now — getting fed is the game.`,
    ],
    survivalCollapse: [
      `{p} goes down at the washroom taps, legs buckling. The camp rushes over. {po} tries to wave them off — "I'm fine" — but {p} isn't fine. The body's had enough.`,
      `Mid-sentence, {p} goes pale and sits down hard at the mess table, breathing heavy. This isn't strategy. This isn't the game. This is the camp running {p} into the ground.`,
    ],
    medevac: [
      `Medical rolls a cart into camp at dawn. {p} is pulled from the game. {po} fights it — of course {p} does — but the call's been made. The camp watches {p} go.`,
      `{p} can't stand this morning. The medics check vitals as the camp gathers. The verdict comes fast: "{p} is done." Tears all around. Nobody wanted it to end like this.`,
    ],
    providerVotedOut: [
      `The camp feels different without {p}. Nobody's charming Chef for extras. Nobody's covering kitchen duty. The tribe voted out the one person keeping them fed — and now the bill's due.`,
      `First morning without {p}. The rations are thin and nobody knows how to stretch them. "We really messed up," someone mutters. The silence after is deafening.`,
    ],
  },
  'survival-island': {
    providerFood: [
      `{p} is up before dawn, waist-deep in the surf with a makeshift spear. Two hours later {po} haul is three fish. The tribe eats tonight.`,
      `{p} disappears into the treeline and comes back with an armful of coconuts and wild fruit. Not glamorous — but it keeps the tribe going.`,
      `Nobody asked {p} to fish. {p} just went. Came back with enough to feed the shelter and didn't say a word about it. Everyone saw.`,
    ],
    providerPraised: [
      `"I don't know what we'd do without {p}," someone says at the fire. Nobody disagrees. {po} has been carrying this camp on {po} back.`,
      `The tribe's running on fumes — but {p} keeps showing up. Fishing, firewood, water runs. {po} doesn't complain. The tribe notices.`,
    ],
    slackerCalledOut: [
      `{a} pulls {b} aside: "People are noticing you don't help around camp. It's going to be a problem." {b} shrugs. That shrug costs {b} more than {b} knows.`,
      `"Hey {b}, when's the last time you went to the well?" {a} asks it casually, but the message is clear. The tribe is watching who works and who doesn't.`,
    ],
    slackerConfrontation: [
      `{a} finally snaps. "We're out here starving and {b} is lying in the shelter doing NOTHING. I'm done carrying {b}." The whole camp goes still.`,
      `{a} throws a coconut shell at the shelter wall. "Get up. We need water. We need firewood. We need someone who actually DOES something." {b} doesn't move.`,
    ],
    slackerBonding: [
      `While the rest of the tribe hauls water, {a} and {b} are sitting in the shelter comparing bug bites. Nobody says anything. But everyone notices.`,
      `{a} and {b} have found a rhythm: wake up late, eat whatever's left, avoid the people working. It's not a strategy. It's a lifestyle. And somehow it's working.`,
    ],
    foodConflict: [
      `The rice is almost gone. {a} catches {b} taking a second scoop. "That's not yours." What follows isn't pretty.`,
      `{a} and {b} argue over who ate the last of the coconut. It's not about the coconut. It's about everything. The hunger makes everything worse.`,
    ],
    foodHoarding: [
      `{a} finds a stash of coconut meat hidden under {b}'s sleeping mat. The look on {a}'s face says everything. {b} has been stealing from the tribe.`,
      `{a} catches {b} sneaking food from the supply at night. Word spreads by morning. The tribe is furious.`,
    ],
    starvationBond: [
      `{a} and {b} sit by a dying fire, splitting the last handful of rice between them. Nobody speaks. Hunger strips everything down to what matters.`,
      `It's been two days since a real meal. {a} and {b} share a coconut in silence. The game feels very far away right now.`,
    ],
    foodRationing: [
      `{p} takes charge of the food. "We portion this out or we starve in three days." Nobody argues. {po} counts every grain of rice.`,
      `{p} sets up a rationing system. Equal portions, no exceptions. The tribe doesn't love it — but they're still eating.`,
    ],
    foodCrisis: [
      `The rice is gone. The coconuts are gone. The tribe sits in silence, too tired to strategize, too hungry to sleep. This is what it looks like when the island wins.`,
      `No food left. The fire went out and nobody has the energy to relight it. Eyes are hollow. Conversation's stopped. Survival is the game now.`,
    ],
    survivalCollapse: [
      `{p} collapses at the water well, legs buckling. The tribe rushes over. {po} tries to stand — "I'm fine" — but {p} isn't fine. The body is giving out.`,
      `Mid-conversation, {p} goes pale and sits down hard, staring at the ground, breathing heavy. This isn't the game. This is the island saying: you're running out of time.`,
    ],
    medevac: [
      `The medical team arrives at dawn. {p} is pulled from the game. {po} fights it — of course {p} does — but the decision is made. The stretcher. The boat. The game goes on without {p}.`,
      `{p} can't stand up this morning. The tribe gathers as the medics check vitals. The verdict comes fast: "{p} is done." {po} cries. The tribe cries. Nobody wanted to see this.`,
    ],
    providerVotedOut: [
      `The camp feels different without {p}. Nobody's fishing. Nobody's starting the fire at dawn. The tribe voted out the one person who kept them fed — and now the island is collecting the debt.`,
      `First morning without {p}. The rice is almost gone and nobody knows how to catch fish. "We really messed up," someone mutters. The silence that follows is deafening.`,
    ],
  },
  'carnival': {
    providerFood: [
      `{p} gets the deep-fryer at the abandoned snack stand sputtering back to life and fries up a batch of questionable corn dogs. The crew eats tonight — nobody asks about the expiration date.`,
      `{p} jimmies the padlock on the stockroom behind the funnel-cake truck and hauls out enough stale mix to feed the tents. Grease never tasted so much like loyalty.`,
      `{p} works the ring-toss booth solo until {po} wins the whole shelf of candy prizes, then splits the haul at the tents. Dinner is entirely sugar. Nobody complains.`,
    ],
    providerPraised: [
      `"I don't know what we'd do without {p}," someone says by the ticket booth. Nobody disagrees. {po} keeps getting the dead snack stands running again.`,
      `The crew's living on prize candy and fryer scraps — but {p} keeps the food coming out of the empty midway. {po} doesn't brag. The crew notices.`,
    ],
    slackerCalledOut: [
      `{a} pulls {b} aside by the carousel: "People notice you never help scrounge. It's going to be a problem." {b} shrugs. That shrug costs {b} more than {b} knows.`,
      `"Hey {b}, when's the last time you cranked a fryer?" {a} asks it light, but the message lands. The crew's tracking who scavenges and who just eats.`,
    ],
    slackerConfrontation: [
      `{a} finally snaps. "We're all out prying open stands and {b} is asleep on the bumper cars. I'm done covering for {b}." The midway goes dead quiet.`,
      `{a} kicks over an empty popcorn tub. "Fry something. Scrounge something. Do ANYTHING." {b} doesn't move. Somehow that's worse.`,
    ],
    slackerBonding: [
      `While the rest of the crew pries open snack stands, {a} and {b} are riding the carousel in slow circles. Nobody says anything. Everyone notices.`,
      `{a} and {b} have a rhythm: sleep in the funhouse, eat whatever the others scrounge, avoid the work entirely. It's not a strategy. It's a lifestyle.`,
    ],
    foodConflict: [
      `The prize candy is almost gone. {a} catches {b} pocketing a second candy apple. "That's not yours." What follows isn't pretty.`,
      `{a} and {b} argue over the last bag of fryer corn dogs. It's not about the corn dogs. It's about everything. The hunger makes it all worse.`,
    ],
    foodHoarding: [
      `{a} finds a stash of candy apples hidden under {b}'s cot in the tents. The look on {a}'s face says everything. {b}'s been skimming the scrounge.`,
      `{a} catches {b} sneaking off to the funnel-cake stockroom alone at night. Word's all over the midway by morning. The crew is furious.`,
    ],
    starvationBond: [
      `{a} and {b} sit under the dead Ferris wheel splitting one cold corn dog between them. Nobody speaks. Hunger strips everything down to what matters.`,
      `Two days of nothing but prize candy. {a} and {b} share the last funnel cake in silence. The game feels very far away right now.`,
    ],
    foodRationing: [
      `{p} takes over the scrounge. "We ration what we pull from these stands or we're licking cotton-candy sticks by Friday." Nobody argues. {po} counts every corn dog.`,
      `{p} sets up a share-out at the ticket booth. Equal portions of whatever the midway coughs up. The crew doesn't love it — but they're still eating.`,
    ],
    foodCrisis: [
      `Every stand is stripped bare and the last candy apple's long gone. The crew slumps around the dead midway, too drained to talk. The carnival always takes more than it gives.`,
      `Nothing left in any booth. The Ferris wheel's gone dark and nobody has the energy to scrounge again. Eyes are hollow. The game is secondary now — getting fed is the game.`,
    ],
    survivalCollapse: [
      `{p} goes down by the soda fountain, legs buckling. The crew rushes over. {po} waves them off — "I'm fine" — but {p} isn't fine. The body's had enough.`,
      `Mid-sentence, {p} goes pale and sinks onto the carousel platform, breathing heavy. This isn't strategy. This isn't the game. This is the carnival wearing {p} down.`,
    ],
    medevac: [
      `Medical arrives through the front gates at dawn. {p} is pulled from the game. {po} fights it — of course {p} does — but the call's been made. The crew watches {p} go.`,
      `{p} can't stand this morning. The medics check vitals as the crew gathers by the tents. The verdict comes fast: "{p} is done." Tears all around. Nobody wanted this.`,
    ],
    providerVotedOut: [
      `The midway feels emptier without {p}. Nobody's cranking the fryers. Nobody's picking padlocks for food. The crew voted out the one person keeping them fed — and now the bill's due.`,
      `First morning without {p}. The scrounge is thin and nobody else knows how to work the stands. "We really messed up," someone mutters. The silence after is deafening.`,
    ],
  },
  'film-lot': {
    providerFood: [
      `{p} raids craft services the second the caterers turn their backs and comes back to the trailers with real food. On a film lot, that's heroism.`,
      `{p} sweet-talks the catering crew into the leftover craft-services spread. {po} pile of sandwiches feeds the team for a day. The others finally learn {po} name.`,
      `{p} stakes out the craft-services table until the donuts restock, then hauls an armful back to the trailers. Not glamorous — but the team eats.`,
    ],
    providerPraised: [
      `"I don't know what we'd do without {p}," someone says at craft services. Nobody disagrees. {po} craft-services runs have been feeding the whole cast.`,
      `The team's living on stale donuts — but {p} keeps charming the caterers for the good stuff. {po} doesn't make a thing of it. The cast notices.`,
    ],
    slackerCalledOut: [
      `{a} pulls {b} aside behind the sound stage: "People notice you never help haul the catering. It's going to be a problem." {b} shrugs. That shrug costs {b} more than {b} knows.`,
      `"Hey {b}, when's the last time you made a coffee run?" {a} asks it light, but the message lands. The cast's tracking who works and who just poses.`,
    ],
    slackerConfrontation: [
      `{a} finally snaps. "We're all running catering and hauling gear and {b} is napping in a trailer. I'm done covering for {b}." The sound stage goes dead quiet.`,
      `{a} slams a clipboard down. "Fetch, haul, ANYTHING. {b} does nothing but hit {po} marks for the camera." {b} doesn't look up. Somehow that's worse.`,
    ],
    slackerBonding: [
      `While the rest of the cast hauls gear off the sound stage, {a} and {b} are lounging in the star trailer eating the good snacks. Nobody says anything. Everyone notices.`,
      `{a} and {b} have a rhythm: sleep in the trailers, raid craft services, avoid every call sheet. It's not a strategy. It's a lifestyle.`,
    ],
    foodConflict: [
      `The real food at craft services is almost gone. {a} catches {b} taking a second sandwich. "That's not yours." What follows isn't pretty.`,
      `{a} and {b} argue over the last decent coffee at the catering table. It's not about the coffee. It's about everything. The hunger makes it all worse.`,
    ],
    foodHoarding: [
      `{a} finds a stash of craft-services snacks hidden in {b}'s trailer. The look on {a}'s face says everything. {b}'s been skimming the catering.`,
      `{a} catches {b} sneaking back to craft services after wrap to load up alone. Word's all over the lot by morning. The cast is furious.`,
    ],
    starvationBond: [
      `{a} and {b} sit on the edge of a dead set splitting the last real sandwich between them. Nobody speaks. Hunger strips everything down to what matters.`,
      `Two days of nothing but stale donuts. {a} and {b} share the last edible thing at craft services in silence. The game feels very far away right now.`,
    ],
    foodRationing: [
      `{p} takes over craft services. "We ration the real food or we're eating prop fruit by Friday." Nobody argues. {po} counts every sandwich.`,
      `{p} sets up a share-out at the catering table. Equal portions, no exceptions. The cast doesn't love it — but they're still eating.`,
    ],
    foodCrisis: [
      `Craft services is picked clean — not a stale donut left. The cast sprawls across the empty sound stage, too hungry to fake a smile for the camera. Even the show has to eat.`,
      `The catering's gone and the caterers with it. The lot goes quiet, everyone too wrung-out to move. The game is secondary now — getting fed is the game.`,
    ],
    survivalCollapse: [
      `{p} goes down by the water cooler, legs buckling. The cast rushes over. {po} waves them off — "I'm fine" — but {p} isn't fine. The body's had enough.`,
      `Mid-take, {p} goes pale and drops onto an apple box, breathing heavy. This isn't strategy. This isn't the game. This is the shoot grinding {p} down.`,
    ],
    medevac: [
      `Medical drives onto the lot at dawn. {p} is pulled from the game. {po} fights it — of course {p} does — but the call's been made. The cast watches {p} go.`,
      `{p} can't stand this morning. The medics check vitals as the cast gathers by the trailers. The verdict comes fast: "{p} is done." Tears all around. Nobody wanted this.`,
    ],
    providerVotedOut: [
      `The lot feels different without {p}. Nobody's charming the caterers. Nobody's stocking the trailers. The cast voted out the one person keeping them fed — and now the bill's due.`,
      `First morning without {p}. Craft services is thin and nobody else can work the catering crew. "We really messed up," someone mutters. The silence after is deafening.`,
    ],
  },
  'world-tour': {
    providerFood: [
      `{p} corners the flight attendant and talks the cart into a second pass through economy. {po} stack of foil trays feeds the back rows. Small mercy at altitude.`,
      `The cart skipped their rows again, so {p} raids the galley when no one's looking and comes back with pretzels and warm sodas. Economy eats tonight because of {p}.`,
      `{p} charms the crew out of the untouched first-class leftovers and smuggles them back to the cheap seats. Nobody in economy asks how. They just eat.`,
    ],
    providerPraised: [
      `"I don't know what we'd do without {p}," someone says across the aisle. Nobody disagrees. {po} galley runs have been feeding the whole back of the plane.`,
      `Economy's living on pretzel dust — but {p} keeps talking the crew into extra trays. {po} doesn't make a thing of it. The cabin notices.`,
    ],
    slackerCalledOut: [
      `{a} pulls {b} aside by the galley: "People notice you never help pass the trays back. It's going to be a problem." {b} shrugs. That shrug costs {b} more than {b} knows.`,
      `"Hey {b}, when's the last time you flagged down the cart for anyone but yourself?" {a} asks it light, but the message lands. The cabin's tracking who shares and who hoards.`,
    ],
    slackerConfrontation: [
      `{a} finally snaps. "We're all rationing trays and {b} is reclined across three seats. I'm done covering for {b}." The whole cabin goes dead quiet.`,
      `{a} smacks the tray table shut. "Pass something back. Save someone a roll. Do ANYTHING." {b} doesn't stir. Somehow that's worse.`,
    ],
    slackerBonding: [
      `While the rest of the cabin rations the cart, {a} and {b} are stretched across the exit row swapping the good snacks. Nobody says anything. Everyone notices.`,
      `{a} and {b} have a rhythm: sleep through the drink service, eat whatever's passed back, avoid every chore in the cabin. It's not a strategy. It's a lifestyle.`,
    ],
    foodConflict: [
      `The edible trays are almost gone. {a} catches {b} grabbing a second roll off the cart. "That's not yours." What follows isn't pretty.`,
      `{a} and {b} argue over the last warm soda in the galley. It's not about the soda. It's about everything. The hunger makes it all worse.`,
    ],
    foodHoarding: [
      `{a} finds a stash of galley snacks jammed in {b}'s seat-back pocket. The look on {a}'s face says everything. {b}'s been skimming the cart.`,
      `{a} catches {b} slipping up to the galley mid-flight to load up alone. Word's all down the aisle by the next meal service. The cabin is furious.`,
    ],
    starvationBond: [
      `{a} and {b} share one foil tray between them, seat to seat, splitting the beige mystery meal. Nobody speaks. Hunger strips everything down to what matters.`,
      `Two flights with nothing but pretzels. {a} and {b} split the last stale roll in silence. The game feels very far away right now.`,
    ],
    foodRationing: [
      `{p} takes charge of the cart. "We ration these trays or we're chewing seat cushions by the next city." Nobody argues. {po} counts every roll.`,
      `{p} organizes a share-out down the aisle. Equal trays, no exceptions. The cabin doesn't love it — but they're still eating.`,
    ],
    foodCrisis: [
      `The cart's empty, the galley's bare, no next city for hours. The back of the plane goes quiet, everyone too wrung-out to move. Economy always runs out first.`,
      `Nothing left to serve and the crew's stopped pretending otherwise. The cabin lights buzz over rows of hollow stares. The game is secondary now — getting fed is the game.`,
    ],
    survivalCollapse: [
      `{p} goes down in the aisle, legs buckling. The cabin crowds in. {po} waves them off — "I'm fine" — but {p} isn't fine. The body's had enough.`,
      `Mid-sentence, {p} goes gray and slumps against the window, breathing heavy. This isn't strategy. This isn't the game. This is the endless flight grinding {p} down.`,
    ],
    medevac: [
      `The plane diverts and medical boards at the gate. {p} is pulled from the game. {po} fights it — of course {p} does — but the call's been made. The cabin watches {p} go.`,
      `{p} can't get up this morning. The medics check vitals as the cabin gathers in the aisle. The verdict comes fast: "{p} is done." Tears all around. Nobody wanted this.`,
    ],
    providerVotedOut: [
      `The cabin feels different without {p}. Nobody's charming the crew for extra trays. Nobody's raiding the galley for the back rows. They voted out the one person keeping them fed — and now the bill's due.`,
      `First morning without {p}. The trays are thin and nobody else can work the cart. "We really messed up," someone mutters. The silence after is deafening.`,
    ],
  },
};

// Pick a venue-appropriate survival narration line for an event type. Returns a
// raw template ({a}/{b}/{p}/{po} + optional vocab tokens) for the caller to fill.
// Falls back survival-island → hosted-camp so a missing entry never breaks.
export function survivalFlavor(eventType) {
  const s = currentSetting();
  const pool = SETTING_SURVIVAL[s]?.[eventType]
    || SETTING_SURVIVAL['survival-island']?.[eventType]
    || SETTING_SURVIVAL['hosted-camp']?.[eventType]
    || [];
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : '';
}

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

// ── Inline-SVG hero art for the themed key screens (arrival / cold open / results).
// viewBox 0 0 800 150; `ac` = the setting accent. Stylized icons, not scenes. ──
const _SETTING_HERO = {
  'hosted-camp': (ac) => `
    <rect x="0" y="96" width="800" height="54" fill="#12324a"/>
    <path d="M0 104 Q200 96 400 104 T800 104 V150 H0 Z" fill="#164a63" opacity=".6"/>
    <circle cx="690" cy="40" r="26" fill="${ac}" opacity=".85"/>
    <rect x="120" y="92" width="150" height="9" rx="2" fill="#6b4a22"/>
    <rect x="140" y="100" width="6" height="30" fill="#4a3216"/><rect x="244" y="100" width="6" height="30" fill="#4a3216"/>
    <g transform="translate(430 46)"><path d="M0 46 L96 46 L84 66 L12 66 Z" fill="#7a5a2e"/><rect x="44" y="-2" width="5" height="50" fill="#caa"/><path d="M49 0 L92 34 L49 34 Z" fill="${ac}"/></g>`,
  'survival-island': (ac) => `
    <rect x="0" y="100" width="800" height="50" fill="#0f3b40"/>
    <path d="M0 108 Q200 100 400 108 T800 108 V150 H0 Z" fill="${ac}" opacity=".28"/>
    <path d="M520 130 Q560 128 640 132 Q600 118 560 120 Q540 122 520 130 Z" fill="#c9a86a"/>
    <g transform="translate(150 40)"><rect x="26" y="0" width="8" height="86" rx="3" fill="#6b4a2a"/>
      <path d="M30 4 Q-20 -8 -34 18 Q-4 6 30 14 Z" fill="${ac}"/><path d="M30 4 Q80 -8 94 18 Q64 6 30 14 Z" fill="${ac}"/>
      <path d="M30 6 Q6 -28 -18 -30 Q14 -14 30 16 Z" fill="${ac}" opacity=".85"/><path d="M30 6 Q54 -28 78 -30 Q46 -14 30 16 Z" fill="${ac}" opacity=".85"/></g>
    <g transform="translate(470 78)"><path d="M0 40 L110 40 L96 60 L14 60 Z" fill="#8a6a3a"/><rect x="50" y="2" width="5" height="40" fill="#bbb"/><path d="M55 4 L96 34 L55 34 Z" fill="#e8e0d0"/></g>`,
  'carnival': (ac) => `
    <g transform="translate(120 20)" stroke="${ac}" stroke-width="3" fill="none" opacity=".9">
      <circle cx="60" cy="60" r="52"/><circle cx="60" cy="60" r="6" fill="${ac}"/>
      ${[0,45,90,135].map(a=>`<line x1="60" y1="60" x2="${60+52*Math.cos(a*Math.PI/180)}" y2="${60+52*Math.sin(a*Math.PI/180)}"/><line x1="60" y1="60" x2="${60-52*Math.cos(a*Math.PI/180)}" y2="${60-52*Math.sin(a*Math.PI/180)}"/>`).join('')}
      ${[0,45,90,135,180,225,270,315].map(a=>`<circle cx="${60+52*Math.cos(a*Math.PI/180)}" cy="${60+52*Math.sin(a*Math.PI/180)}" r="6" fill="${ac}" stroke="none"/>`).join('')}</g>
    <g transform="translate(430 40)"><path d="M0 100 L0 20 Q90 -14 180 20 L180 100" fill="none" stroke="${ac}" stroke-width="6"/>
      ${[0,1,2,3,4,5,6,7,8].map(i=>`<path d="M${i*20} ${20+Math.abs(i-4.5)*3} l10 16 l-20 0 Z" fill="${i%2?ac:'#ffcf40'}" opacity=".9"/>`).join('')}
      <text x="90" y="70" text-anchor="middle" fill="${ac}" font-family="Bungee,sans-serif" font-size="22">FUN</text></g>
    <rect x="0" y="120" width="800" height="30" fill="#2a1830"/>`,
  'film-lot': (ac) => `
    <rect x="0" y="0" width="800" height="150" fill="none"/>
    <g transform="translate(120 30)"><rect x="0" y="26" width="150" height="70" rx="4" fill="#1a1e28" stroke="${ac}" stroke-width="2"/>
      <rect x="0" y="8" width="150" height="22" rx="3" fill="#242a36" stroke="${ac}" stroke-width="2"/>
      ${[0,1,2,3,4,5].map(i=>`<path d="M${6+i*24} 8 l14 22 l-14 0 Z" fill="${i%2?ac:'#e6ebf5'}"/>`).join('')}</g>
    <g transform="translate(560 20)" stroke="${ac}" stroke-width="3" fill="none">
      <circle cx="40" cy="30" r="20" fill="${ac}" opacity=".3"/><path d="M40 30 L-30 120 M40 30 L110 120" opacity=".35" stroke-width="10" stroke-linecap="round"/></g>
    <text x="400" y="140" text-anchor="middle" fill="${ac}" font-family="Anton,sans-serif" font-size="16" letter-spacing="4" opacity=".5">SCENE 1 · TAKE 1</text>`,
  'world-tour': (ac) => `
    <path d="M0 90 Q120 70 260 88 Q360 60 470 86 Q600 66 800 84" fill="none" stroke="${ac}" stroke-width="2" stroke-dasharray="3 10" opacity=".7"/>
    <ellipse cx="150" cy="52" rx="60" ry="20" fill="#ffffff" opacity=".10"/><ellipse cx="620" cy="40" rx="70" ry="22" fill="#ffffff" opacity=".10"/>
    <g transform="translate(360 40)" fill="${ac}"><path d="M120 30 L40 40 L-30 34 L-30 46 L40 52 L20 84 L34 84 L74 54 L110 56 L96 78 L108 78 L140 52 Q150 46 140 40 Z"/>
      <circle cx="150" cy="46" r="4" fill="#fff" opacity=".8"/></g>`,
};

// Slim decorative banner strip for cold-open / results headers (viewBox 0 0 800 26).
const _SETTING_BANNER = {
  'hosted-camp': (ac) => `<g fill="${ac}">${[...Array(20)].map((_,i)=>`<path d="M${i*40} 22 l12 -16 l12 16 Z" opacity=".5"/>`).join('')}</g>`,
  'survival-island': (ac) => `<path d="M0 16 Q100 6 200 16 T400 16 T600 16 T800 16" fill="none" stroke="${ac}" stroke-width="3" opacity=".7"/>`,
  'carnival': (ac) => `<g>${[...Array(27)].map((_,i)=>`<rect x="${i*30}" y="0" width="15" height="26" fill="${i%2?ac:'#ffcf40'}" opacity=".55"/>`).join('')}</g>`,
  'film-lot': (ac) => `<g fill="${ac}" opacity=".6">${[...Array(32)].map((_,i)=>`<rect x="${i*25+4}" y="7" width="14" height="12" rx="2"/>`).join('')}</g>`,
  'world-tour': (ac) => `<line x1="0" y1="13" x2="800" y2="13" stroke="${ac}" stroke-width="2" stroke-dasharray="4 14" opacity=".7"/>`,
};

export function settingHeroSVG(kind = 'arrival', setting = currentSetting()) {
  const ac = (SEASON_SETTINGS[setting]?.accentHex) || _SETTING_ACCENT[setting] || '#f0c040';
  if (kind === 'banner') {
    const b = (_SETTING_BANNER[setting] || _SETTING_BANNER['hosted-camp'])(ac);
    return `<svg viewBox="0 0 800 26" preserveAspectRatio="none" style="width:100%;height:18px;display:block">${b}</svg>`;
  }
  const h = (_SETTING_HERO[setting] || _SETTING_HERO['hosted-camp'])(ac);
  return `<svg viewBox="0 0 800 150" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;max-height:150px;display:block">${h}</svg>`;
}
// accent hex per setting (mirrors the CSS .rp-set-* --set-accent values)
const _SETTING_ACCENT = { 'hosted-camp':'#f0c040', 'survival-island':'#46c7b4', 'carnival':'#ff5a7a', 'film-lot':'#cdd2df', 'world-tour':'#57a6e8' };
export function settingAccent(setting = currentSetting()) { return _SETTING_ACCENT[setting] || '#f0c040'; }
// Pull a setting-appropriate line for a "texture" category (meal/improve/wildlife/weather).
// Falls back to hosted-camp so a setting missing a pool never breaks. Returns raw
// text with {a}/{b}/{p}/{po}/vocab tokens still in place — caller fills names, then fillVocab().
export function settingReskin(category) {
  const pool = settingProfile().reskin?.[category] || SEASON_SETTINGS['hosted-camp'].reskin?.[category] || [];
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : '';
}
