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
