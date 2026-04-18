// js/chal/camp-castaways.js — Camp Castaways survival-scoring challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── ARCHETYPE HELPERS ──
const VILLAIN_ARCHETYPES = ['villain', 'mastermind', 'schemer'];
const NICE_ARCHETYPES = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];

function _rp(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function getArchetype(name) { return players.find(p => p.name === name)?.archetype || ''; }
function isVillainArch(name) { return VILLAIN_ARCHETYPES.includes(getArchetype(name)); }
function isNiceArch(name) { return NICE_ARCHETYPES.includes(getArchetype(name)); }
function isSchemeEligible(name) {
  if (isVillainArch(name)) return true;
  const s = pStats(name);
  return !isNiceArch(name) && s.strategic >= 6 && s.loyalty <= 4;
}
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}

// ── MR. COCONUT OBJECT POOL ──
const BREAKDOWN_OBJECTS = [
  { id: 'coconut',    name: 'coconut',                 namePool: { villain: 'Mr. Coconut', hero: 'Coco', wildcard: 'Dr. Coconut', default: 'Mr. Coconut' } },
  { id: 'stick',      name: 'stick',                   namePool: { villain: 'Chief', hero: 'Sticky', wildcard: 'The Colonel', default: 'Sticky' } },
  { id: 'rock',       name: 'rock',                    namePool: { villain: 'Big Guy', hero: 'Rocky', wildcard: 'Professor Stone', default: 'Rocky' } },
  { id: 'shell',      name: 'shell',                   namePool: { villain: 'Shelly', hero: 'Shelly', wildcard: 'Admiral Shell', default: 'Shelly' } },
  { id: 'driftwood',  name: 'driftwood',               namePool: { villain: 'The Captain', hero: 'Woody', wildcard: 'Lord Plank', default: 'The Captain' } },
  { id: 'can',        name: 'empty can',               namePool: { villain: 'Cannie', hero: 'Tin', wildcard: 'El Cano', default: 'Cannie' } },
  { id: 'volleyball', name: 'volleyball-shaped prop',  namePool: { villain: 'Wilson', hero: 'Wilson', wildcard: 'Señor Wilson', default: 'Wilson' } },
];

// ── CHRIS REACTION TEXT POOLS ──
const CHRIS_REACTIONS = {
  entertained:  [`"AND THAT'S the shot I needed." — Chris McLean`, `"THIS is why we do this show." — Chris McLean`, `"Intern expense: JUSTIFIED." — Chris McLean`],
  horrified:    [`"That was NOT in the budget." — Chris McLean`, `"I need legal on line one." — Chris McLean`],
  impressed:    [`"And THAT is why I signed this cast." — Chris McLean`, `"I love this job." — Chris McLean`],
  vindicated:   [`"Worth every penny." — Chris McLean`, `"I told you the flood idea would work." — Chris McLean`],
  confused:     [`"Was that... real? Check the budget for therapy interns." — Chris McLean`, `"My villain is BONDING with the underdog? Reshoot." — Chris McLean`],
};

// ── WILDLIFE POOL ──
const WILDLIFE = [
  { id: 'shark',       name: 'Shark Sighting',        nearWater: true },
  { id: 'pterodactyl', name: 'Pterodactyl',           nearWater: false },
  { id: 'python',      name: 'Python',                nearWater: false },
  { id: 'raccoon',     name: 'Raccoon Raid',          nearWater: false },
  { id: 'mosquito',    name: 'Mosquito Swarm',        nearWater: false },
  { id: 'crab',        name: 'Crab Attack',           nearWater: true },
  { id: 'boar',        name: 'Wild Boar',             nearWater: false, soloOnly: false },
  { id: 'seagull',     name: 'Seagull Steals Food',   nearWater: false },
  { id: 'trex-skull',  name: 'T-Rex Skull',           nearWater: false },
];

// ── FLOOD OPEN / CHAOS / SEPARATION TEXT POOLS ──
const FLOOD_OPEN_TEXTS = [
  `It started at 3 AM. The island's drainage system — such as it was — gave up sometime after midnight. By 4 AM, half the camp was underwater. Production insists this was a natural event. The insurance waiver everyone signed last Tuesday suggests otherwise.`,
  `The flood hit Wawanakwa fast. By the time the first camper woke up, the lower cabins were already gone. Chris was already in a helicopter. The interns were already filming. Production had been monitoring the dam controls since 2 AM. Nobody said anything.`,
  `Nobody saw the flood coming. Well — someone saw it coming. The dam upstream had been "mildly compromised" since episode one. Chris described it to his assistant as "a content opportunity." His assistant forwarded that email directly to legal.`,
  `Camp Wawanakwa's lowest point is six feet below its highest point. In a flood, this matters. The sleeping arrangements had put the newest, most exhausted players in the lowest cabins. Production called this "serendipity."`,
];
const FLOOD_CHAOS_TEXTS = [
  (n, pr) => `${n} was first. ${pr.Sub} ${pr.sub==='they'?'woke':'woke'} up with ${pr.posAdj} face six inches above the waterline and ${pr.posAdj} bag already floating toward the door. ${pr.Sub} ${pr.sub==='they'?'had':'had'} about two seconds before ${pr.sub} ${pr.sub==='they'?'started':'started'} screaming. ${pr.Sub} ${pr.sub==='they'?'used':'used'} them well.`,
  (n, pr) => `${n} was the first one awake — ${pr.posAdj} shoes were floating past ${pr.posAdj} face before ${pr.sub} ${pr.sub==='they'?'opened':'opened'} ${pr.posAdj} eyes. ${pr.Sub} ${pr.sub==='they'?'had':'had'} about three seconds to process this before the current started moving everyone.`,
  (n, pr) => `A crab landed on ${n}'s face. Not the flood — the crab. The flood was secondary. By the time ${pr.sub} ${pr.sub==='they'?'processed':'processed'} the flood, half the camp was already in motion.`,
  (n, pr) => `The first sound was ${n}'s voice cutting through the dark: "WATER — WATER — EVERYONE UP." The second sound was everyone waking up. The third sound was chaos.`,
];
const FLOOD_SWEEP_TEXTS = [
  (names, loc) => `${names} — carried by the same current — washed up at ${loc} before dawn. The flood chose their group for them. Whatever alliances they'd planned: restart.`,
  (names, loc) => `${names} made landfall at ${loc} together. Shared terror is the world's worst icebreaker. It is also, occasionally, the world's most effective one.`,
  (names, loc) => `The water swept ${names} toward ${loc}. Three seconds of chaos decided who they'd be living with for the next forty-eight hours.`,
  (names, loc) => `${names} washed up at ${loc} — confused, soaked, and oddly intact. The flood doesn't care about strategy. It just picks people and throws them together.`,
  (names, loc) => `${names} surfaced at ${loc}. The current had carried them here without consulting anyone. This is their group now. They have opinions about that.`,
];
const FLOOD_LOCATIONS = [
  'the eastern shore', 'the northern ridge', 'the old docks', 'the mangrove flats',
  'the waterfall basin', 'the rocky plateau', 'the south beach', 'the jungle clearing',
  'the tidal pools', 'the cliff base', 'the palm grove', 'the ravine mouth',
];

// ── FLOOD REACTIONS (Phase 0) ──
const FLOOD_REACTIONS = {
  villain: [
    (n, pr) => `${n} sits up in the water, completely calm. "This is a challenge. Has to be." ${pr.Sub} ${pr.sub==='they'?'start':'starts'} calculating immediately.`,
    (n, pr) => `The flood barely registers on ${n}'s face. "Interesting." ${pr.Sub} ${pr.sub==='they'?'look':'looks'} around to see how the others are reacting. Information is power, even now.`,
    (n, pr) => `${n} doesn't panic. ${pr.Sub} ${pr.sub==='they'?'catalogue':'catalogues'} the chaos around ${pr.obj} with the quiet focus of someone who already knew this was coming.`,
    (n, pr) => `"Flood." ${n} says it like a news report. Not scared. Just noting a fact. ${pr.Sub} ${pr.sub==='they'?'are':'is'} already three moves ahead.`,
    (n, pr) => `${n} wades to higher ground methodically, assessing who looks scared, who looks capable. Information flows toward ${pr.obj} even when the island floods.`,
  ],
  hothead: [
    (n, pr) => `"FINALLY something interesting!" ${n} shouts from the floating bed. ${pr.Sub} ${pr.sub==='they'?'sound':'sounds'} almost excited.`,
    (n, pr) => `${n} punches the water with both fists. "LET'S GO." This might be the best day of ${pr.posAdj} life.`,
    (n, pr) => `${n} doesn't run from the flood. ${pr.Sub} ${pr.sub==='they'?'charge':'charges'} it headfirst.`,
    (n, pr) => `"THAT'S WHAT I'M TALKING ABOUT!" ${n} screams to no one in particular. Everyone near ${pr.obj} edges away slightly.`,
    (n, pr) => `${n} has been complaining this game wasn't exciting enough. ${pr.Sub} ${pr.sub==='they'?'have':'has'} gone very, very quiet.`,
  ],
  social: [
    (n, pr) => `"MY HAIR." ${n}'s first words. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} around wildly. "WHO is going to be in my group?!"`,
    (n, pr) => `${n} gasps when the cold water hits. "Okay. OKAY. We can work with this." ${pr.Sub} ${pr.sub==='they'?'are':'is'} already thinking about who to partner with.`,
    (n, pr) => `${n}'s priority isn't survival. It's making sure ${pr.sub} ${pr.sub==='they'?'end':'ends'} up in the right group. ${pr.Sub} ${pr.sub==='they'?'are':'is'} scanning the chaos for ${pr.posAdj} people.`,
    (n, pr) => `The flood separated ${n} from ${pr.posAdj} allies. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} genuinely more upset about that than the flood itself.`,
    (n, pr) => `${n} immediately starts calling names into the darkness. Not distress calls. Alliance maintenance.`,
  ],
  hero: [
    (n, pr) => `${n}'s first instinct is to check on the others. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} around. "Is everyone okay?!" The answer is not great, but ${pr.sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} stop moving.`,
    (n, pr) => `"Everyone stay calm!" ${n} yells. Nobody is staying calm. But ${pr.sub} ${pr.sub==='they'?'try':'tries'}.`,
    (n, pr) => `${n} doesn't think. ${pr.Sub} ${pr.sub==='they'?'move':'moves'} toward the sound of someone panicking before ${pr.sub} ${pr.sub==='they'?'are':'is'} even fully awake.`,
    (n, pr) => `${n} finds the person who's most scared and stays with ${pr.obj}. It costs ${n} time. ${n} doesn't care.`,
    (n, pr) => `"LEAVE EVERYTHING, JUST MOVE!" That's ${n}. ${pr.Sub} ${pr.sub==='they'?'help':'helps'} three people reach dry ground before ${pr.sub} ${pr.sub==='they'?'find':'finds'} any for ${pr.ref}.`,
  ],
  loyal: [
    (n, pr) => `${n} thinks about ${pr.posAdj} alliance. Not where they rank in it — just whether they're okay. ${pr.Sub} ${pr.sub==='they'?'feel':'feels'} the distance.`,
    (n, pr) => `${n}'s first words in the flood are someone else's name. ${pr.Sub} ${pr.sub==='they'?'are':'is'} looking for ${pr.posAdj} people before anything else.`,
    (n, pr) => `${n} swims toward the voice ${pr.sub} ${pr.sub==='they'?'recognize':'recognizes'}, not the shore ${pr.sub} ${pr.sub==='they'?'can':'can'} see. That's ${n}.`,
    (n, pr) => `The chaos separates ${n} from half the people ${pr.sub} ${pr.sub==='they'?'trust':'trust'}. The flood is bad. That part is worse.`,
    (n, pr) => `${n} gets to higher ground and immediately turns around to see who's still in the water.`,
  ],
  underdog: [
    (n, pr) => `${n} takes a breath. Looks at the sky. "Okay," ${pr.sub} ${pr.sub==='they'?'say':'says'} quietly. Quiet determination. This won't break ${pr.obj}.`,
    (n, pr) => `${n} floats for a moment, staring up. "I've had worse mornings." ${pr.Sub} ${pr.sub==='they'?'paddle':'paddles'} toward the nearest tree and hold on.`,
    (n, pr) => `Everyone else is panicking. ${n} has been in worse situations. Not recently — but ${pr.posAdj} face is calm.`,
    (n, pr) => `${n} gets knocked over twice by the current. Gets up twice. No commentary. Just gets up.`,
    (n, pr) => `"Okay," ${n} says quietly, to no one. That one word carries a lot. ${pr.Sub} ${pr.sub==='they'?'start':'starts'} moving.`,
  ],
  wildcard: [
    (n, pr) => `${n} immediately begins to sing. Nobody asks why. This is just who ${pr.sub} ${pr.sub==='they'?'are':'is'}.`,
    (n, pr) => `${n} ducks under the surface for a full ten seconds, comes back up, wipes ${pr.posAdj} face, and announces: "The water speaks to me." ${pr.Sub} ${pr.sub==='they'?'paddle':'paddles'} away.`,
    (n, pr) => `${n} seems genuinely delighted by the flood. This is concerning to observe.`,
    (n, pr) => `Nobody can account for ${n}'s whereabouts during the initial chaos. ${pr.Sub} ${pr.sub==='they'?'reappear':'reappears'} twenty minutes later with something ${pr.sub} ${pr.sub==='they'?'refuse':'refuses'} to explain.`,
    (n, pr) => `${n} floats past three terrified contestants, completely serene. "This is actually really nice," ${pr.sub} ${pr.sub==='they'?'say':'says'}. Nobody agrees with ${pr.obj}.`,
  ],
  default: [
    (n, pr) => `${n} wakes up floating and takes a moment to process this information. "...Sure," ${pr.sub} ${pr.sub==='they'?'say':'says'}, and ${pr.sub} ${pr.sub==='they'?'start':'starts'} swimming.`,
    (n, pr) => `${n} blinks at the flooded cabin. Looks down. Looks up. "I hate this island," ${pr.sub} ${pr.sub==='they'?'say':'says'}, and ${pr.sub} ${pr.sub==='they'?'mean':'means'} it.`,
    (n, pr) => `${n} moves with the current instead of against it. Not graceful, but practical.`,
    (n, pr) => `"Nope," ${n} says, and starts swimming. Not a panic reaction — just a quiet, firm refusal of the situation.`,
    (n, pr) => `${n} grabs the two most useful things they can find — their bag and someone's elbow — and pulls toward dry land.`,
  ],
};

// ── SURVIVAL EVENT TEXT POOLS ──
const FOOD_TEXTS = {
  success: [
    (n, pr) => `${n} spots coconuts high in a palm and figures out how to knock them down. ${pr.Sub} ${pr.sub==='they'?'crack':'cracks'} the first one open on a rock. Food.`,
    (n, pr) => `${n} finds tide pools teeming with crabs and shellfish. It takes an hour to catch enough for the group, but ${pr.sub} ${pr.sub==='they'?'do':'does'} it.`,
    (n, pr) => `Wild fruit, maybe half-ripe. ${n} declares it fine. ${pr.Sub} ${pr.sub==='they'?'eat':'eats'} two and ${pr.sub==='they'?'are':'is'} fine. Three others follow cautiously.`,
  ],
  fail: [
    (n, pr) => `${n} tries to fish with ${pr.posAdj} bare hands. The fish are unimpressed. ${pr.Sub} ${pr.sub==='they'?'come':'comes'} back soaking wet and empty-handed.`,
    (n, pr) => `The coconut ${n} found is completely hollow. The bird's nest is occupied and angry. ${pr.Sub} ${pr.sub==='they'?'return':'returns'} with nothing.`,
  ],
  mishap: [
    (n, pr) => `${n} eats what ${pr.sub} ${pr.sub==='they'?'think':'thinks'} is a wild berry. It is not a pleasant experience. ${pr.Sub} ${pr.sub==='they'?'are':'is'} fine, eventually, but not for a while.`,
    (n, pr) => `A seagull dive-bombs ${n} and makes off with ${pr.posAdj} entire haul. ${pr.Sub} ${pr.sub==='they'?'watch':'watches'} it fly away. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} speak for a full minute.`,
  ],
};

const SHELTER_TEXTS = {
  build: [
    (n, pr) => `${n} builds a lean-to out of palm fronds in about twenty minutes. It's not pretty, but it'll hold.`,
    (n, pr) => `${n} insists on engineering a proper shelter. Three hours later: something that defies both physics and aesthetics, but stands.`,
  ],
  collapse: [
    (n, pr) => `${n} finishes the shelter with a flourish. It collapses immediately. Completely. One gust of wind and it's gone.`,
    (n, pr) => `The shelter ${n} built holds for exactly four minutes before gravity wins. ${pr.Sub} ${pr.sub==='they'?'stare':'stares'} at the rubble.`,
  ],
  treehouse: [
    (n, pr) => `${n} discovers a fully intact treehouse deep in the jungle. How long has this been here? ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} question it. ${pr.Sub} ${pr.sub==='they'?'climb':'climbs'} up and claim it.`,
  ],
};

const FIRE_TEXTS = [
  (n, pr) => `${n} attempts to start a fire by rubbing two sticks together. Forty minutes later, ${pr.sub} ${pr.sub==='they'?'have':'has'} produced impressive forearms and zero sparks.`,
  (n, pr) => `"I know how to do this," ${n} insists. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'}.`,
];

const FIRE_FIX_TEXTS = [
  (fixer, n, fPr) => `${fixer} watches ${n}'s fire attempt for about thirty seconds, sighs, and demonstrates the correct technique. Fire in two minutes.`,
];

const LOST_TEXTS = [
  (n, pr) => `${n} has been walking for forty-five minutes and just found ${pr.posAdj} own footprints. ${pr.Sub} ${pr.sub==='they'?'have':'has'} been walking in a complete circle.`,
  (n, pr) => `The trees all look the same to ${n}. All of them. Every single tree on this island is identical. ${pr.Sub} ${pr.sub==='they'?'are':'is'} completely lost.`,
];

const WATER_TEXTS = [
  (n, pr) => `${n} follows the terrain downhill and finds a freshwater spring. ${pr.Sub} ${pr.sub==='they'?'return':'returns'} with water cupped in broad leaves — enough for everyone.`,
  (n, pr) => `"Water first," ${n} says, and vanishes into the trees. ${pr.Sub} ${pr.sub==='they'?'come':'comes'} back twenty minutes later. Nobody asks how ${pr.sub} ${pr.sub==='they'?'found':'found'} it.`,
  (n, pr) => `${n} finds a rain-collected pool in the rocks and clears the surface debris. Clean water. ${pr.Sub} ${pr.sub==='they'?'drink':'drinks'} first, then signals the others.`,
  (n, pr) => `The stream ${n} locates is narrow and fast-moving. Close enough to clean. ${pr.Sub} ${pr.sub==='they'?'collect':'collects'} what ${pr.sub} ${pr.sub==='they'?'can':'can'} in a coconut shell and starts back.`,
];

const CONFESSIONAL_TEXTS = {
  villain: [
    (n, pr) => `Confessional — ${n}: "I already know who I'm voting out next. I decided before I hit the water. Everything since has been confirmation."`,
    (n, pr) => `${n} finds a quiet patch of shoreline. From a distance, ${pr.sub} ${pr.sub==='they'?'look':'looks'} meditative. ${pr.Sub} ${pr.sub==='they'?'are':'is'} running threat assessments.`,
  ],
  mastermind: [
    (n, pr) => `Confessional — ${n}: "They think this is a survival test. It's a targeting window. I've been watching who panics, who leads, who's dispensable."`,
    (n, pr) => `${n} takes inventory: group dynamics, who bonded with whom, supply locations. ${pr.Sub} ${pr.sub==='they'?'are':'is'} already building a map to tribal council.`,
  ],
  hothead: [
    (n, pr) => `${n} has been doing things all day and is too busy to have feelings about it. The crab situation was not fine. Everything else is fine.`,
    (n, pr) => `Confessional — ${n}: "I found food, fixed the fire, and chased off a raccoon. Nobody said thank you. I don't need it. But I noticed."`,
  ],
  social: [
    (n, pr) => `${n} has checked in with everyone at least twice. Not for strategy — ${pr.sub} ${pr.sub==='they'?'just':'just'} ${pr.sub==='they'?'want':'wants'} to know how everyone is holding up.`,
    (n, pr) => `Confessional — ${n}: "Social maintenance: complete. I know exactly where everyone stands. Now I just need to not die from dehydration."`,
  ],
  hero: [
    (n, pr) => `${n} spent the last hour helping people ${pr.sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} even need to impress. That's not the game. That's just ${pr.obj}.`,
    (n, pr) => `Confessional — ${n}: "I know I'm supposed to be thinking about strategy. I can't stop thinking about whether everyone has enough water."`,
  ],
  loyal: [
    (n, pr) => `${n} thinks about ${pr.posAdj} alliance. Not where they rank in it — just whether they're okay. ${pr.Sub} ${pr.sub==='they'?'feel':'feels'} the distance.`,
    (n, pr) => `Confessional — ${n}: "I don't care about the score. I care about finding my people and making sure they made it through the night."`,
  ],
  challenge: [
    (n, pr) => `This is, technically, a challenge. ${n} treats it as one. ${pr.Sub} ${pr.sub==='they'?'log':'logs'} terrain, distance, variables. ${pr.Sub} ${pr.sub==='they'?'have':'has'} trained in worse.`,
    (n, pr) => `Confessional — ${n}: "The flood was inconvenient. The jungle is manageable. I've done harder warmups than this."`,
  ],
  wildcard: [
    (n, pr) => `Nobody knows what ${n} has been doing for the last two hours. The look on ${pr.posAdj} face suggests ${pr.sub} ${pr.sub==='they'?'prefer':'prefers'} it that way.`,
    (n, pr) => `Confessional — ${n}: "I found something in the tree line. I'm not saying what. But I found it. And I'm keeping it."`,
  ],
  floater: [
    (n, pr) => `${n} has been quietly watching everything. ${pr.Sub} ${pr.sub==='they'?'know':'knows'} more about this group's dynamics than some people inside the alliances do.`,
    (n, pr) => `Confessional — ${n}: "I don't need to win today. I need to still exist tomorrow. That is the entire strategy."`,
  ],
  default: [
    (n, pr) => `${n} finds a quiet moment. Something has clarified out here — why ${pr.sub} ${pr.sub==='they'?'came':'came'} and what ${pr.sub} ${pr.sub==='they'?'want':'wants'} from it. It's not what ${pr.sub} ${pr.sub==='they'?'expected':'expected'}.`,
    (n, pr) => `Confessional — ${n}: "This is the most uncomfortable I've ever been. And I'm still here. That means something."`,
  ],
};

const PAIR_BOND_TEXTS = [
  (a, b) => `${a} and ${b} work the same stretch of jungle for an hour without talking. By the end, they've established something efficient and wordless.`,
  (a, b) => `"You've done something like this before," ${b} says to ${a}. Not a question. ${a} doesn't confirm or deny — but ${pronouns(a).sub} ${pronouns(a).sub==='they'?'don\'t':'doesn\'t'} deny it either.`,
  (a, b) => `${a} and ${b} bicker about the best approach, discover they're both wrong, and arrive at the right answer together. Neither acknowledges this.`,
  (a, b) => `${b} is struggling with something physical. ${a} notices without being asked and offers a quiet, specific assist. Neither of them makes it a big deal.`,
];

const PHASE3_INTEL_TEXTS = [
  (n, pr) => `${n} catches the group up: what the terrain looked like, what ${pr.sub} ${pr.sub==='they'?'found':'found'}, who did what. Everyone listens. The information starts shifting threat readings.`,
  (n, pr) => `"Our group found water and built a lean-to." ${n} gives a short, efficient debrief. Several people are taking mental notes.`,
  (n, pr) => `${n} reports in like it's a briefing: what worked, what didn't, what ${pr.sub} ${pr.sub==='they'?'observed':'observed'}. Free information — for now.`,
  (n, pr) => `${n} keeps the debrief short: who panicked, who stepped up, where the resources are. ${pr.Sub} ${pr.sub==='they'?'leave':'leaves'} out the part about ${pr.posAdj} own breakdown.`,
  (n, pr) => `"We almost died three times," ${n} says flatly. "But we found coconuts." The group processes this in silence.`,
  (n, pr) => `${n} lays out the survival highlights: shelter location, water source, wildlife threats. It's the most useful sixty seconds of the entire regrouping.`,
];

const PHASE3_STRATEGY_TEXTS = [
  (n, pr) => `The island is behind ${n}. The game is ahead. ${pr.Sub} ${pr.sub==='they'?'start':'starts'} counting votes before ${pr.sub} ${pr.sub==='they'?'have':'has'} even cleaned off the mud.`,
  (n, pr) => `${n} pulls someone close and says something quiet. Whatever it was, the listener nods slowly and looks across camp at someone who doesn't know they're being watched.`,
];

// ── NIGHT EVENT TEXT POOLS ──
const NIGHT_COMEDY = {
  sleepTalk: [
    (n, pr) => `In ${pr.posAdj} sleep, ${n} mutters something about voting alliances. Specifically, names. The group goes very quiet.`,
    (n, pr) => `${n} talks in ${pr.posAdj} sleep. Nothing strategic — just something deeply embarrassing about a childhood pet named "Princess Fluffernutter." The group tries not to laugh.`,
  ],
  am2Breakfast: [
    (n, pr) => `${n} wakes everyone at 2am to announce ${pr.sub} ${pr.sub==='they'?'are':'is'} making a "snack." The snack is raw coconut, shredded with fingers, served with suspicion.`,
  ],
  nightmare: [
    (n, pr) => `${n} sits bolt upright screaming. The group scrambles. It was a nightmare about jellyfish. ${pr.Sub} ${pr.sub==='they'?'can\'t':'can\'t'} explain why jellyfish. Nobody asks.`,
  ],
  seagull: [
    (grp) => `A seagull has gotten into the shelter. It has found the food. It is winning. Three people give chase in the dark. The seagull escapes. The food does not.`,
  ],
};

const NIGHT_DRAMA = {
  oldWounds: [
    (a, b, aPr, bPr) => `The dark brings out what the daylight was holding back. ${a} and ${b} have unfinished business, and the island is too small to pretend otherwise.`,
    (a, b, aPr, bPr) => `${a} says something. ${b} goes still. Whatever it was, it cuts deep. The fire crackles between them.`,
  ],
  hungerBreakdown: [
    (n, pr) => `${n} doesn't say much. Just sits with ${pr.posAdj} knees pulled up and ${pr.posAdj} eyes somewhere far away. The hunger and exhaustion and everything else have converged. ${pr.Sub} ${pr.sub==='they'?'are':'is'} done, for now.`,
  ],
  survivorsGuilt: [
    (n, pr) => `${n} thinks about the people who aren't here anymore. Not all of them deserved what they got. ${pr.Sub} ${pr.sub==='they'?'know':'knows'} that. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} know what to do with it.`,
  ],
};

const NIGHT_HEARTFELT = {
  stargazing: [
    (a, b, aPr, bPr) => `${a} and ${b} end up lying on their backs looking at the same stars. No strategy. No game. Just two people being honest about something for once.`,
  ],
  comfort: [
    (helper, target, hPr, tPr) => `${helper} doesn't say anything. Just sits down next to ${target} in the dark and doesn't leave. Sometimes that's the whole thing.`,
  ],
  unlikelyFriends: [
    (a, b, aPr, bPr) => `${a} and ${b} find out they hate the same thing. Deeply, specifically hate it. The conversation that follows is weirdly normal. Neither of them expected this.`,
  ],
  soloResolve: [
    (n, pr) => `Alone in the dark, ${n} makes a decision. Not about strategy — about ${pr.posAdj}self. What ${pr.sub} ${pr.sub==='they'?'are':'is'} willing to do. What ${pr.sub} ${pr.sub==='they'?'aren\'t':'isn\'t'}. The game comes back into focus.`,
    (n, pr) => `${n} sits with the silence for a long time. When ${pr.sub} ${pr.sub==='they'?'come':'comes'} back to the group, something in ${pr.posAdj} posture has shifted. Not harder. Cleaner.`,
  ],
};

// ── MR. COCONUT TEXT POOLS ──
const BREAKDOWN_TEXTS = {
  breakingPoint: [
    (n, pr, objName) => `It's not the hunger. Or the cold. Or the bugs. It's the not knowing. ${n} sits with that for a long time. Then ${pr.sub} ${pr.sub==='they'?'find':'finds'} the ${objName.toLowerCase()}. It's just there.`,
    (n, pr, objName) => `${n} has been holding it together for days. Nobody sees the seam. Nobody knows it exists. But alone out here, in the dark, something gives — quietly, without fanfare. ${pr.Sub} ${pr.sub==='they'?'pick':'picks'} up the ${objName.toLowerCase()}.`,
  ],
  introVillain:  (n, pr, objName, assignedName) => `"You're my secret weapon," ${n} tells the ${objName}. "I'm going to call you ${assignedName}. You're the only one I can actually trust in this game."`,
  introHero:     (n, pr, objName, assignedName) => `"You don't judge me, do you, ${assignedName}?" ${n} holds the ${objName}. "Everyone else is watching to see if I crack. Not you."`,
  introUnderdog: (n, pr, objName, assignedName) => `${n} looks at the ${objName} for a long time. "You know what? I'm naming you ${assignedName}. You've been sitting here this whole time, and nobody noticed you either."`,
  introHothead:  (n, pr, objName, assignedName) => `"You're ${assignedName}," ${n} announces, holding the ${objName} up. "I'm naming you after someone I need to beat. And I am going to outlast you too."`,
  introWildcard: (n, pr, objName, assignedName) => `${n} examines the ${objName} from seventeen angles. "Your name is ${assignedName}," ${pr.sub} ${pr.sub==='they'?'decide':'decides'}. The logic is not available for review.`,
  introDefault:  (n, pr, objName, assignedName) => `"${assignedName}," ${n} says quietly, like a name they've always known. "I'm ${n}. I know. It's a lot to process."`,
  convo: [
    (n, pr, assignedName) => `"I'm not even sure I'm still playing the game, ${assignedName}. I'm just... existing here." ${n} pauses. "${assignedName}... you're right. I am still playing. Thank you."`,
    (n, pr, assignedName) => `${n} tells ${assignedName} everything: the alliances, the votes, the things ${pr.sub} ${pr.sub==='they'?'said':'said'} to people ${pr.sub} ${pr.sub==='they'?'didn\'t':'didn\'t'} mean. ${assignedName} listens without judgment.`,
    (n, pr, assignedName) => `"I miss home," ${n} admits to ${assignedName}. "Not in a soft way. In a sharp, specific way." ${assignedName} holds this without comment. It helps, somehow.`,
  ],
  reactAmused:   (watcher, n, wPr) => `${watcher} wakes up and sees ${n} having an earnest conversation with an inanimate object. ${wPr.Sub} ${wPr.sub==='they'?'watch':'watches'} for a while, decide not to intervene, and go back to sleep.`,
  reactConcerned: (watcher, n, wPr) => `${watcher} sits up and watches ${n} quietly. After a moment, ${wPr.sub} ${wPr.sub==='they'?'move':'moves'} closer. "Hey. You okay?" ${n} looks up. Something in ${n}'s expression makes ${watcher} stay.`,
  reactJudging:  (watcher, n, wPr) => `${watcher} raises an eyebrow. Files this under "game information" and goes back to sleep. ${n} doesn't notice.`,
  reactJoining:  (joiner, n, jPr) => `${joiner} watches ${n} for a moment. Then, slowly, picks up a nearby stick. "I'm going to call mine Gerald," ${jPr.sub} ${jPr.sub==='they'?'announce':'announces'}.`,
};

// ── ESCAPE ATTEMPT TEXT POOLS (Phase 1 — per group) ──
const ESCAPE_TEXTS = {
  raftCircle: [
    (n, pr) => `${n} paddles heroically in what ${pr.sub} ${pr.sub==='they'?'are':'is'} absolutely certain is the right direction. It is not. ${pr.Sub} ${pr.sub==='they'?'return':'returns'} to the same stretch of shore forty-five minutes later. The crab that witnessed ${pr.posAdj} departure is still there.`,
    (n, pr) => `${n}'s raft completes a perfect arc and deposits ${pr.obj} exactly where it started. The current is indifferent to ${pr.posAdj} feelings about this. ${pr.Sub} ${pr.sub==='they'?'sit':'sits'} in it for a moment before getting out.`,
    (n, pr) => `Against all odds ${n} constructs a raft. With the current, it goes sideways, then backwards, and comes to rest eight feet from where ${pr.sub} ${pr.sub==='they'?'launched':'launched'}. Progress, technically.`,
  ],
  raftNearMiss: [
    (n, pr, other) => `${n}'s raft drifts close enough to ${other}'s shoreline that they can hear each other shouting — but the current pulls ${pr.obj} away before they can reach each other. The smoke from ${other}'s fire is visible, though. That's a direction.`,
    (n, pr, other) => `${n} spots a figure on a distant shore that might be ${other}. Too far to reach, but ${pr.sub} ${pr.sub==='they'?'know':'knows'} now — the island isn't empty. ${pr.Sub} ${pr.sub==='they'?'start':'starts'} paddling toward the nearest landmass.`,
  ],
  climbSpot: [
    (n, pr) => `${n} climbs the tallest tree on this stretch of shore. From up there, ${pr.sub} ${pr.sub==='they'?'can':'can'} see smoke rising from at least two other parts of the island. Nobody's lost — they're just scattered. ${pr.Sub} ${pr.sub==='they'?'mark':'marks'} the directions and come down. "That way."`,
    (n, pr) => `${n} shinnies up a palm tree and gets a sightline. Smoke to the northeast. What might be a campfire further in. ${pr.Sub} ${pr.sub==='they'?'memorize':'memorizes'} the layout, then climb down. "I know where they are."`,
  ],
  climbFail: [
    (n, pr) => `${n} attempts to climb a coconut palm to get a sightline. ${pr.Sub} ${pr.sub==='they'?'make':'makes'} it halfway before reconsidering gravity. The landing is not graceful. The coconut that falls after is also not graceful.`,
    (n, pr) => `${n} makes a genuine effort to climb the tallest available tree. The tree has other opinions. They negotiate briefly and reach a settlement: halfway up, directly back down.`,
  ],
  signalFire: [
    (n, pr) => `${n} disassembles part of the shelter to build a signal fire. The smoke column is enormous and visible from half the island. ${pr.Sub} ${pr.sub==='they'?'have':'has'} no regrets about any of this.`,
    (n, pr) => `${n} stacks the driest wood ${pr.sub==='they'?'they':'they'} can find and gets it blazing within minutes. The smoke is visible for miles. Whether this brings help or Chef with a hose, ${pr.sub} ${pr.sub==='they'?'are':'is'} willing to find out.`,
  ],
  trackFollow: [
    (n, pr) => `${n} follows a set of tracks through the jungle expecting food. What ${pr.sub} ${pr.sub==='they'?'find':'finds'} instead is the edge of another part of the island — and footprints that aren't animal. Someone else was here recently.`,
    (n, pr) => `${n} trails a set of prints through the undergrowth. The trail splits. ${pr.Sub} ${pr.sub==='they'?'follow':'follows'} the one that looks more recent. It leads to a different inlet. Not lost — somewhere new, and clearly not alone.`,
  ],
};

// ── CROSS-GROUP ENCOUNTER TEXT POOLS (Phase 1.5) ──
const CROSS_ENCOUNTER_TEXTS = {
  shouting: [
    (a, b) => `${a} hears ${b} before seeing ${pronouns(b).obj}. The shouting is mutual, the relief is enormous, and a lot of it is being said at the same time.`,
    (a, b) => `"${a}?!" and "${b}?!" — both at once, from opposite sides of a thicket. A pause. Then: "YOU'RE ALIVE." It comes from both of them simultaneously.`,
    (a, b) => `${a}'s group hears voices in the undergrowth. Nobody moves. Then ${a} shouts a name. ${b}'s voice comes back. The distance between them closes fast.`,
  ],
  signalFound: [
    (a, b) => `${b}'s smoke column draws ${a}'s group like a lighthouse. They arrive to find ${b} completely prepared to lecture everyone about fire safety. Nobody minds.`,
    (a, b) => `The fire ${b} built pulls ${a}'s group toward it for the better part of an hour. "I knew someone would build one," ${a} says. "I didn't know it'd be you, but still."`,
  ],
  pterodactylDelivery: [
    (carried, finder) => `The pterodactyl deposits ${carried} unceremoniously in the clearing where ${finder}'s group has been sheltering. Everyone stares. ${carried} stands up slowly. "I'm fine." A beat. "Pterodactyl." ${finder} nods. The island is what it is.`,
    (carried, finder) => `${carried} lands in a tangle of branches ten feet from ${finder} with a thud that communicates a lot about the last twenty minutes. The bird is already gone. "Where did you come from?" ${carried} points upward.`,
  ],
  lostPlayerFound: [
    (lost, finder) => `${lost} has been walking confidently in the wrong direction for an hour when ${finder}'s group's campfire comes into view. ${lost} doesn't mention the hour. Nobody asks.`,
    (lost, finder) => `${finder} hears movement in the undergrowth and nearly panics before recognizing ${lost}. "You have no idea where you are, do you." It's not a question. ${lost} sits down without answering.`,
  ],
  accidental: [
    (a, b) => `${a} and ${b} round the same ridge from opposite sides and nearly collide. Neither was looking for the other. Both are glad they found each other.`,
    (a, b) => `${a}'s group and ${b}'s group have been circling the same hill from opposite directions for an hour. They meet at the top. The moment is anticlimactic and completely welcome.`,
    (a, b) => `Two groups, two sets of footprints, one muddy trail. ${a} and ${b} arrive at the same clearing from opposite ends at almost exactly the same moment and just stare at each other.`,
  ],
};

// ── FINAL ASSEMBLY TEXT POOLS (Phase 3 opening) ──
const FINAL_ASSEMBLY_TEXTS = [
  (names) => `And then all at once, they're all here. The clearing fills with mud-caked, exhausted, slightly sunburned people who survived the night on this island. Someone does a headcount. Everyone made it.`,
  (names) => `One by one, then all at once. ${names[0]} does a count. Correct. Somehow, after everything, correct. For a moment nobody moves. Then everyone starts talking at the same time.`,
  (names) => `The last group emerges from the treeline. The clearing goes quiet. Then someone laughs — for no specific reason, just because they're here and alive and together. Then everyone does.`,
];

// ── CONFESSION CIRCLE TEXT POOLS (Phase 3) ──
const CONFESSION_CIRCLE_TEXTS = {
  prompt: [
    (n, pr) => `${n} suggests they say one honest thing before the group moves on. "Clear the air. Before we go back to trying to vote each other out." The clearing goes quiet.`,
    (n, pr) => `"Before we go back to the game," ${n} says, "I want to know who everyone actually is. One true thing." Nobody has a good reason to refuse.`,
    (n, pr) => `${n} looks around at the exhausted, mud-covered group and something about the absurdity cuts through the strategy. "Tell us something real," ${pr.sub} ${pr.sub==='they'?'say':'says'}. "Just one thing."`,
  ],
  confession: [
    (n, pr) => `${n} pauses for a long time, then says something ${pr.posAdj} alliance would not want shared here. ${pr.Sub} ${pr.sub==='they'?'say':'says'} it anyway.`,
    (n, pr) => `${n}'s confession is brief and completely unexpected. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} elaborate. It lands differently for every person in the circle.`,
    (n, pr) => `What ${n} admits here is the kind of thing that would have changed tribal. Instead it's just true, shared in the open, and received without comment.`,
    (n, pr) => `${n} talks about home. Not strategy, not the game — just what ${pr.sub} ${pr.sub==='they'?'miss':'misses'}. The specific detail ${pr.sub} ${pr.sub==='they'?'choose':'chooses'} hits harder than any of them expected.`,
    (n, pr) => `${n} says something that makes two people look at each other. Whatever it was, it rearranged something in the group's understanding of ${pr.obj}.`,
    (n, pr) => `${n} goes last and keeps it short. Three sentences. The third one is the one that matters. Nobody moves for a few seconds after.`,
    (n, pr) => `"I almost quit on day three," ${n} says. The group is quiet. ${pr.Sub} ${pr.sub==='they'?'didn\'t':'didn\'t'} quit. That's the point.`,
  ],
};

// ── REUNION TEXT POOLS ──
const REUNION_TEXTS = {
  emotional: [
    (a, b, aPr) => `${a} sees ${b} emerge from the trees and relief hits them both at once. Something unspoken gets said anyway — not in words, just in the way they move toward each other.`,
  ],
  tense: [
    (a, b) => `${a} and ${b} lock eyes across the clearing. Neither looks exactly thrilled. "You're alive," one says. The tone does not carry warmth.`,
  ],
  raftCircles: [
    (n, pr) => `${n} has been paddling heroically for what ${pr.sub} ${pr.sub==='they'?'believe':'believes'} is hours. The raft has returned to exactly where it started. The camp is three feet away.`,
  ],
  pterodactylCarry: [
    (victim, rescuer, vPr, rPr) => `The large bird has ${victim} in its grip and is ascending rapidly. ${rescuer} grabs a vine and ties it to ${vPr.posAdj} ankle. ${victim} is lowered to the ground. The bird is upset about this.`,
  ],
  warPaint: [
    (leaders) => `The war party has convened. War paint, improvised weapons, and the kind of absolute conviction that only works when you have no idea what you're walking into.`,
  ],
  calledIt: [
    (n, pr) => `"I KNEW IT," ${n} shouts, finding the camp exactly where ${pr.sub} ${pr.sub==='they'?'said':'said'} it would be. "I have been saying this since this morning." Nobody admits ${pr.sub} ${pr.sub==='they'?'were':'was'} right.`,
  ],
  sharedSuffering: [
    (a, b) => `${a} and ${b} find each other, and the first thing they do is reference the exact terrible thing that happened to both of them. There's something healing in that.`,
  ],
};

// ── STORM THE CAMP TEXT POOLS ──
const STORM_TEXTS = {
  discovery: [
    (n, pr) => `${n} spots smoke above the treeline. ${pr.Sub} ${pr.sub==='they'?'stop':'stops'} walking. Points. "There."`,
    (n, pr) => `${n} was right about the smoke. Not for the first time today. Maybe not for the last.`,
  ],
  chefScared: [
    (leader, pr) => `Chef sees the war party coming through the trees — improvised weapons, war paint, genuine fury — and does the sensible thing. He backs up against a tree and stays there.`,
  ],
  chrisUnbothered: [
    `Chris McLean is sitting in a camp chair. There is lemonade. He raises it in a toast. "Took you long enough."`,
    `Chris barely looks up. "You found it. Congratulations. Sit down, you're all covered in mud." He sounds almost proud.`,
  ],
  reveal: [
    `"Did production engineer the flood?" Chris considers this. "Define 'engineer.'" He takes a sip of his drink.`,
    `"Yes, I flooded the camp. The production cost was unreasonable and I regret nothing." — Chris McLean, entirely unbothered.`,
  ],
  playback: [
    (subject, pr, desc) => `Chris pulls up the footage. There's ${subject} on the screen. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} at the monitor. The color drains.`,
    (subject, pr, desc) => `"Oh, this one's my favorite," Chris says, and hits play. ${subject} closes ${pr.posAdj} eyes.`,
  ],
};

// ── GROUP FORMATION ──
function formGroups(playerList) {
  const shuffled = [...playerList].sort(() => Math.random() - 0.5);
  const groups = [];
  let i = 0;
  while (i < shuffled.length) {
    const remaining = shuffled.length - i;
    let size;
    if (remaining <= 3) { size = remaining; }
    else if (remaining === 4) { size = 2; }
    else { size = Math.random() < 0.6 ? 2 : (Math.random() < 0.5 ? 3 : 1); }
    if (size === 1 && remaining > 3 && Math.random() < 0.7) size = 2;
    groups.push(shuffled.slice(i, i + size));
    i += size;
  }
  return groups;
}

// ── MR. COCONUT BREAKDOWN ──
function _fireBreakdown(name, groups, timeline, cameraFlags, personalScores) {
  const pr = pronouns(name);
  const arch = getArchetype(name);
  const obj = _rp(BREAKDOWN_OBJECTS);
  const archKey = VILLAIN_ARCHETYPES.includes(arch) ? 'villain'
    : arch === 'hero' ? 'hero'
    : ['underdog', 'floater'].includes(arch) ? 'underdog'
    : ['hothead', 'chaos-agent'].includes(arch) ? 'hothead'
    : arch === 'wildcard' ? 'wildcard' : 'default'; // goat intentionally falls to 'default'
  const assignedName = obj.namePool[archKey] || obj.namePool.default;

  // Beat 1 — Breaking Point
  const breakText = _rp(BREAKDOWN_TEXTS.breakingPoint)(name, pr, obj.name);
  timeline.push({ type: 'breakdown', subtype: 'breakingPoint', phase: 2, player: name, object: obj.name, objectName: assignedName, text: breakText, badgeText: 'BREAKING POINT', badgeClass: 'yellow' });

  // Beat 2 — Introduction
  const introFn = BREAKDOWN_TEXTS[`intro${archKey.charAt(0).toUpperCase() + archKey.slice(1)}`] || BREAKDOWN_TEXTS.introDefault;
  const introText = introFn(name, pr, obj.name, assignedName);
  timeline.push({ type: 'breakdown', subtype: 'introduction', phase: 2, player: name, object: obj.name, objectName: assignedName, text: introText, badgeText: `MEET ${assignedName.toUpperCase()}`, badgeClass: 'yellow' });

  // Beat 3 — Conversation (reveals game secret)
  const convoText = _rp(BREAKDOWN_TEXTS.convo)(name, pr, assignedName);
  timeline.push({ type: 'breakdown', subtype: 'conversation', phase: 2, player: name, object: obj.name, objectName: assignedName, text: convoText, badgeText: 'CONVERSATION', badgeClass: 'yellow' });

  // Beat 4 — Others React
  const groupWithPlayer = groups.find(g => g.includes(name));
  const watchers = groupWithPlayer ? groupWithPlayer.filter(p => p !== name) : [];
  if (watchers.length > 0) {
    const watcher = _rp(watchers);
    const wPr = pronouns(watcher);
    const wStats = pStats(watcher);
    // Reaction based on watcher's mental + social
    const reactScore = wStats.mental * 0.4 + wStats.temperament * 0.3 + Math.random() * 2;
    let reactText, reactType;
    if (reactScore > 7) {
      reactText = BREAKDOWN_TEXTS.reactConcerned(watcher, name, wPr);
      reactType = 'concerned';
      addBond(watcher, name, 0.2);
    } else if (reactScore < 4 && !isNiceArch(watcher)) {
      reactText = BREAKDOWN_TEXTS.reactJudging(watcher, name, wPr);
      reactType = 'judging';
    } else if (wStats.mental + wStats.temperament <= 12 && Math.random() < 0.20) {
      reactText = BREAKDOWN_TEXTS.reactJoining(watcher, name, pronouns(watcher));
      reactType = 'joining';
    } else {
      reactText = BREAKDOWN_TEXTS.reactAmused(watcher, name, wPr);
      reactType = 'amused';
    }
    timeline.push({ type: 'breakdown', subtype: 'reaction', phase: 2, player: watcher, about: name, object: obj.name, objectName: assignedName, reactType, text: reactText, badgeText: `${reactType.toUpperCase()} REACTION`, badgeClass: reactType === 'concerned' ? 'green' : reactType === 'judging' ? 'red' : 'yellow' });
  }

  // Score impact
  personalScores[name] = (personalScores[name] || 0) - 2.0;
  popDelta(name, -1);

  // Camera flag
  cameraFlags.push({ player: name, type: 'breakdown', text: `Chris watches ${name} name an inanimate object and have a full conversation with it.`, reactionType: 'entertained' });
  timeline.push({ type: 'chrisReaction', phase: 2, reactionType: 'entertained', text: `"THIS is the content I was born to produce." — Chris McLean` });

  return { player: name, object: obj.name, objectName: assignedName };
}

// ══════════════════════════════════════════════════════
// SIMULATE
// ══════════════════════════════════════════════════════
export function simulateCampCastaways(ep) {
  const activePlayers = [...gs.activePlayers];
  const personalScores = {};
  activePlayers.forEach(n => { personalScores[n] = 0; });

  const timeline = [];
  const cameraFlags = [];

  // ══ GROUP FORMATION (needed before Phase 0 so separation events know who's together) ══
  const groups = formGroups(activePlayers);
  const groupLabels = groups.map((_, i) => String.fromCharCode(65 + i));
  const usedWildlife = new Set();

  // ══ PHASE 0 — THE FLOOD ══

  // Opening narration — atmospheric, no player
  timeline.push({ type: 'floodNarrative', phase: 0, players: [],
    text: _rp(FLOOD_OPEN_TEXTS), badgeText: '● NIGHT CAM', badgeClass: 'grey' });

  // Chaos beat — one player first awake
  const chaosFirst = _rp(activePlayers);
  const chaosPr = pronouns(chaosFirst);
  timeline.push({ type: 'floodNarrative', phase: 0, player: chaosFirst, players: [chaosFirst],
    text: _rp(FLOOD_CHAOS_TEXTS)(chaosFirst, chaosPr), badgeText: '⚠ CHAOS', badgeClass: 'red' });

  // Chris from helicopter
  const CHRIS_FLOOD_QUIPS = [
    `"Good morning, campers! Production had absolutely nothing to do with last night's flood. That's our story and we're sticking to it." — Chris McLean`,
    `"Beautiful. This is genuinely beautiful television. Interns — are you getting this? GET THIS." — Chris McLean, from a helicopter`,
    `"For legal reasons I cannot confirm or deny whether the dam was 'managed.' What I CAN confirm is that this is great content." — Chris McLean`,
    `"The good news: everyone survived. The better news: I got it all on camera." — Chris McLean`,
  ];
  timeline.push({ type: 'chrisAnnounce', phase: 0, players: [],
    text: _rp(CHRIS_FLOOD_QUIPS), badgeText: 'CHRIS', badgeClass: 'red' });

  // Per-group wash-up / separation events
  const usedLocations = new Set();
  groups.forEach((group, gi) => {
    const loc = _rp(FLOOD_LOCATIONS.filter(l => !usedLocations.has(l)));
    usedLocations.add(loc);
    const label = groupLabels[gi];
    const nameList = group.length === 1 ? group[0]
      : group.length === 2 ? group.join(' and ')
      : group.slice(0, -1).join(', ') + ' and ' + group[group.length - 1];
    const text = _rp(FLOOD_SWEEP_TEXTS)(nameList, loc);
    timeline.push({ type: 'groupLands', phase: 0, group: label, players: [...group], location: loc,
      text, badgeText: `▲ GROUP ${label} · ${loc.toUpperCase()}`, badgeClass: 'green' });
  });

  // Per-player reactions — deduped per bucket
  const usedReactionIdx = {};
  activePlayers.forEach(name => {
    const arch = getArchetype(name);
    const pr = pronouns(name);
    const bucket = arch === 'mastermind' ? 'villain'
      : VILLAIN_ARCHETYPES.includes(arch) ? 'villain'
      : ['hothead', 'chaos-agent'].includes(arch) ? 'hothead'
      : ['social-butterfly', 'showmancer'].includes(arch) ? 'social'
      : arch === 'loyal-soldier' ? 'loyal'
      : arch === 'hero' ? 'hero'
      : ['underdog', 'floater', 'goat'].includes(arch) ? 'underdog'
      : arch === 'wildcard' ? 'wildcard' : 'default';
    const pool = FLOOD_REACTIONS[bucket] || FLOOD_REACTIONS.default;
    if (!usedReactionIdx[bucket]) usedReactionIdx[bucket] = new Set();
    let idx = Math.floor(Math.random() * pool.length);
    for (let t = 0; t < pool.length; t++) {
      if (!usedReactionIdx[bucket].has(idx)) break;
      idx = (idx + 1) % pool.length;
    }
    usedReactionIdx[bucket].add(idx);
    const text = pool[idx](name, pr);
    timeline.push({ type: 'floodReaction', phase: 0, player: name, archBucket: bucket,
      text, badgeText: 'REACTION', badgeClass: 'grey' });
  });

  const escapeAttempts = []; // tracks per-group escape events for cross-encounter logic

  groups.forEach((group, gi) => {
    const label = groupLabels[gi];

    // ── Individual Confessionals (always fire — no fired guard) ──
    group.forEach(name => {
      const arch = getArchetype(name);
      const pr = pronouns(name);
      const bucket = arch === 'mastermind' ? 'mastermind'
        : VILLAIN_ARCHETYPES.includes(arch) ? 'villain'
        : ['hothead', 'chaos-agent'].includes(arch) ? 'hothead'
        : ['social-butterfly', 'showmancer'].includes(arch) ? 'social'
        : arch === 'loyal-soldier' ? 'loyal'
        : ['hero'].includes(arch) ? 'hero'
        : arch === 'wildcard' ? 'wildcard'
        : arch === 'floater' ? 'floater'
        : ['challenge-beast'].includes(arch) ? 'challenge'
        : 'default';
      const text = _rp(CONFESSIONAL_TEXTS[bucket] || CONFESSIONAL_TEXTS.default)(name, pr);
      timeline.push({ type: 'confessional', phase: 1, group: label, player: name, players: [name], text, badgeText: 'CONFESSIONAL', badgeClass: 'grey' });
    });

    // ── Survival Activities (always fire — no fired guard) ──
    group.forEach(name => {
      const pr = pronouns(name);
      const s = pStats(name);
      // Proportional score — physical feat + courage + awareness + stamina
      personalScores[name] += s.physical * 0.04 + s.boldness * 0.02 + s.mental * 0.02 + s.endurance * 0.02;
      // Text selection: thresholds OK for narrative only
      let text, badge, bClass = 'grey';
      if (s.physical >= 7 && s.boldness >= 6) {
        text = _rp([
          `${name} scales a coconut palm barefoot and clears the top in under two minutes. Nobody is surprised. Everyone is watching.`,
          `${name} builds a rope harness from vines in about thirty seconds. Doesn't say how ${pr.sub} ${pr.sub==='they'?'know':'knows'} how to do that. Just does it.`,
        ]); badge = 'PHYSICAL FEAT'; bClass = 'gold';
      } else if (s.mental >= 7) {
        text = _rp([
          `${name} assesses the terrain in under two minutes and has already formed three opinions about the optimal path forward.`,
          `${name} identifies the edible plants in a twenty-foot radius with unsettling confidence. Maybe from a book. Maybe not.`,
        ]); badge = 'ASSESSMENT'; bClass = 'blue';
      } else if (s.social >= 7) {
        text = _rp([
          `${name} is keeping group morale up through sheer force of personality. It is working, somewhat. The group is less miserable than it was.`,
          `${name} checks in with each group member with a specific, personalized comment. It lands differently for each of them.`,
        ]); badge = 'MORALE BOOST'; bClass = 'green';
        group.filter(p => p !== name).forEach(p => addBond(p, name, 0.1));
      } else if (s.endurance >= 7) {
        text = _rp([
          `${name} hasn't stopped moving since the flood started. The others rest. ${pr.Sub} ${pr.sub==='they'?'keep':'keeps'} going.`,
          `${name}'s pace hasn't wavered. Four hours in, ${pr.sub} ${pr.sub==='they'?'look':'looks'} exactly the same as hour one.`,
        ]); badge = 'RELENTLESS'; bClass = 'green';
      } else {
        text = _rp([
          `${name} is managing. Not thriving, not falling apart — managing, which in these conditions might actually be the right call.`,
          `${name} finds ${pr.posAdj} rhythm eventually. Slower than some. Still moving. Still here.`,
        ]); badge = 'SURVIVING';
      }
      timeline.push({ type: 'survivalActivity', phase: 1, group: label, player: name, players: [name], text, badgeText: badge, badgeClass: bClass });
    });

    // ── Food Finding (~60%) ──
    if (Math.random() < 0.60) {
      // Weighted-random: intuition + endurance + physical (survival instincts, not book smarts)
      const _foragW = n => { const s = pStats(n); return Math.max(0.01, s.intuition * 0.04 + s.endurance * 0.03 + s.physical * 0.02); };
      const _foragTotal = group.reduce((t, n) => t + _foragW(n), 0);
      let _foragR = Math.random() * _foragTotal;
      const forager = group.find(n => { _foragR -= _foragW(n); return _foragR <= 0; }) || group[group.length - 1];
      const pr = pronouns(forager);
      const successChance = pStats(forager).intuition * 0.04 + pStats(forager).endurance * 0.03 + pStats(forager).physical * 0.02 + Math.random() * 0.2;
      if (successChance >= 0.35) {
        const text = _rp(FOOD_TEXTS.success)(forager, pr);
        personalScores[forager] += 1.5;
        timeline.push({ type: 'foodFinding', phase: 1, group: label, player: forager, players: [forager], outcome: 'success', text, badgeText: 'FOOD FOUND', badgeClass: 'green' });
        cameraFlags.push({ player: forager, type: 'foodSuccess', text: `${forager} finds food for the group.`, reactionType: 'impressed' });
      } else if (Math.random() < 0.35) {
        const text = _rp(FOOD_TEXTS.mishap)(forager, pr);
        personalScores[forager] -= 1.0;
        group.forEach(p => { if (p !== forager) addBond(p, forager, -0.2); });
        timeline.push({ type: 'foodFinding', phase: 1, group: label, player: forager, players: group, outcome: 'mishap', text, badgeText: 'FOOD MISHAP', badgeClass: 'red' });
        cameraFlags.push({ player: forager, type: 'foodMishap', text: `${forager}'s food attempt goes spectacularly wrong.`, reactionType: 'entertained' });
      } else {
        const text = _rp(FOOD_TEXTS.fail)(forager, pr);
        personalScores[forager] -= 0.5;
        timeline.push({ type: 'foodFinding', phase: 1, group: label, player: forager, players: [forager], outcome: 'fail', text, badgeText: 'NOTHING', badgeClass: 'grey' });
      }
    }

    // ── Shelter Building (~50%, groups ≥ 2) ──
    if (group.length >= 2 && Math.random() < 0.50) {
      // Weighted-random: physical + endurance (manual labor, no mental)
      const _buildW = n => { const s = pStats(n); return Math.max(0.01, s.physical * 0.04 + s.endurance * 0.05); };
      const _buildTotal = group.reduce((t, n) => t + _buildW(n), 0);
      let _buildR = Math.random() * _buildTotal;
      const builder = group.find(n => { _buildR -= _buildW(n); return _buildR <= 0; }) || group[group.length - 1];
      const pr = pronouns(builder);
      const buildScore = pStats(builder).physical * 0.04 + pStats(builder).endurance * 0.05 + Math.random() * 0.3;
      // Check for treehouse (first group to roll it)
      const treehouseAvail = !timeline.some(e => e.type === 'shelterBuild' && e.outcome === 'treehouse');
      if (treehouseAvail && Math.random() < 0.15) {
        const text = _rp(SHELTER_TEXTS.treehouse)(builder, pr);
        personalScores[builder] += 2.0;
        timeline.push({ type: 'shelterBuild', phase: 1, group: label, player: builder, players: group, outcome: 'treehouse', text, badgeText: 'TREEHOUSE!', badgeClass: 'gold' });
        cameraFlags.push({ player: builder, type: 'treehouse', text: `${builder} finds a treehouse and claims it.`, reactionType: 'impressed' });
      } else if (buildScore < 0.30) {
        const text = _rp(SHELTER_TEXTS.collapse)(builder, pr);
        personalScores[builder] -= 1.5;
        group.forEach(p => { if (p !== builder) personalScores[p] -= 0.2; });
        timeline.push({ type: 'shelterBuild', phase: 1, group: label, player: builder, players: group, outcome: 'collapse', text, badgeText: 'COLLAPSE', badgeClass: 'red' });
        cameraFlags.push({ player: builder, type: 'shelterCollapse', text: `${builder}'s shelter collapses immediately.`, reactionType: 'entertained' });
      } else {
        const text = _rp(SHELTER_TEXTS.build)(builder, pr);
        personalScores[builder] += 1.0;
        group.forEach(p => { if (p !== builder) personalScores[p] += 0.3; });
        timeline.push({ type: 'shelterBuild', phase: 1, group: label, player: builder, players: group, outcome: 'success', text, badgeText: 'SHELTER UP', badgeClass: 'green' });
      }
    }

    // ── Wildlife Encounter (1-2 per group) ──
    const wildCount = Math.min(2, 1 + (Math.random() < 0.4 ? 1 : 0));
    for (let w = 0; w < wildCount; w++) {
      const available = WILDLIFE.filter(wi => !usedWildlife.has(wi.id) && (wi.soloOnly ? group.length === 1 : true));
      if (!available.length) break;
      const wildlife = _rp(available);
      usedWildlife.add(wildlife.id);
      const subject = _rp(group);
      const pr = pronouns(subject);
      const s = pStats(subject);
      let wText = '', wBadge = '', wBadgeClass = 'grey';

      if (wildlife.id === 'shark') {
        const brave = s.boldness * 0.06 + Math.random() * 0.3;
        if (brave > 0.4) {
          wText = `${subject} spots the fin in the water and doesn't move. The shark circles. ${pr.Sub} ${pr.sub==='they'?'hold':'holds'} ${pr.posAdj} ground. The shark leaves.`;
          personalScores[subject] += 2.0; popDelta(subject, 2); wBadge = 'SHARK! (BRAVE)'; wBadgeClass = 'gold';
          cameraFlags.push({ player: subject, type: 'wildlifeBrave', text: `${subject} faces down a shark without flinching.`, reactionType: 'impressed' });
        } else {
          wText = `${subject} sees the fin and ${pr.sub==='they'?'scramble':'scrambles'} out of the water in record time. Loudly.`;
          personalScores[subject] -= 1.5; wBadge = 'SHARK! (PANIC)'; wBadgeClass = 'red';
          cameraFlags.push({ player: subject, type: 'wildlifePanic', text: `${subject} panics at the shark sighting.`, reactionType: 'entertained' });
        }
      } else if (wildlife.id === 'pterodactyl') {
        const rescuer = group.find(p => p !== subject && pStats(p).boldness >= 6);
        if (rescuer) {
          wText = _rp(REUNION_TEXTS.pterodactylCarry)(subject, rescuer, pr, pronouns(rescuer));
          personalScores[subject] += s.boldness >= 6 ? 1.0 : -0.5;
          personalScores[rescuer] += 1.5; addBond(subject, rescuer, 0.4); popDelta(rescuer, 1);
          wBadge = 'PTERODACTYL CARRY'; wBadgeClass = 'yellow';
        } else {
          wText = `The large bird swoops at ${subject}. ${pr.Sub} ${pr.sub==='they'?'run':'runs'}. The bird loses interest eventually.`;
          personalScores[subject] -= 0.5; wBadge = 'PTERODACTYL'; wBadgeClass = 'yellow';
        }
      } else if (wildlife.id === 'python') {
        if (s.boldness >= 6) {
          wText = `${subject} finds the python, stares it down, and makes it very clear who the apex predator is here. The python disagrees, but eventually retreats.`;
          personalScores[subject] += 1.5; popDelta(subject, 1); wBadge = 'PYTHON (BRAVE)'; wBadgeClass = 'gold';
        } else {
          wText = `${subject} and the python reach an understanding: ${pr.sub} ${pr.sub==='they'?'leave':'leaves'}, it stays. ${pr.Sub} ${pr.sub==='they'?'leave':'leaves'} very quickly.`;
          personalScores[subject] -= 1.0; wBadge = 'PYTHON (FLED)'; wBadgeClass = 'red';
        }
      } else if (wildlife.id === 'raccoon') {
        const defender = group.slice().sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
        const defPr = pronouns(defender);
        if (pStats(defender).intuition >= 6) {
          wText = `${defender} spots the raccoon raiding the food supply before it can do real damage and chases it off.`;
          personalScores[defender] += 0.5; wBadge = 'RACCOON REPELLED'; wBadgeClass = 'green';
        } else {
          wText = `The raccoon makes off with half the group's food. ${defender} is left looking at an empty coconut shell.`;
          personalScores[defender] -= 1.0; wBadge = 'RACCOON RAID'; wBadgeClass = 'red';
        }
      } else if (wildlife.id === 'mosquito') {
        const victim = group.slice().sort((a, b) => pStats(a).endurance - pStats(b).endurance)[0];
        wText = `The mosquito swarm finds ${victim} with unerring precision. ${pronouns(victim).Sub} ${pronouns(victim).sub==='they'?'suffer':'suffers'} considerably while everyone else suffers moderately.`;
        personalScores[victim] -= 0.5; wBadge = 'MOSQUITO SWARM'; wBadgeClass = 'grey';
        cameraFlags.push({ player: victim, type: 'mosquitoSuffering', text: `${victim} is destroyed by mosquitoes.`, reactionType: 'entertained' });
      } else if (wildlife.id === 'crab') {
        wText = `The crab chases ${subject} into the water. ${pr.Sub} ${pr.sub==='they'?'emerge':'emerges'} soaking wet to the sound of ${pr.posAdj} group's laughter. Group morale improves.`;
        personalScores[subject] -= 0.5; group.forEach(p => { if (p !== subject) addBond(p, subject, 0.2); }); wBadge = 'CRAB ATTACK'; wBadgeClass = 'yellow';
      } else if (wildlife.id === 'boar') {
        if (s.physical >= 6 && s.boldness >= 6) {
          wText = `${subject} sees the boar, sizes it up, and somehow wrangles it. It escapes. But only barely. The group watches with a mix of admiration and genuine alarm.`;
          personalScores[subject] += 2.0; popDelta(subject, 1); wBadge = 'BOAR WRANGLED!'; wBadgeClass = 'gold';
          cameraFlags.push({ player: subject, type: 'wildlifeBrave', text: `${subject} wrestles a boar.`, reactionType: 'impressed' });
        } else {
          wText = `${subject} hears the boar coming and makes the correct decision: run. ${pr.Sub} ${pr.sub==='they'?'are':'is'} not proud of it, but ${pr.sub} ${pr.sub==='they'?'are':'is'} safe.`;
          personalScores[subject] -= 1.0; popDelta(subject, -1); wBadge = 'BOAR CHASE'; wBadgeClass = 'red';
        }
      } else if (wildlife.id === 'seagull') {
        wText = `A seagull swoops and takes ${subject}'s food directly out of ${pr.posAdj} hand. Eye contact was maintained throughout. The seagull felt nothing.`;
        personalScores[subject] -= 0.5; wBadge = 'SEAGULL THEFT'; wBadgeClass = 'grey';
      } else if (wildlife.id === 'trex-skull') {
        if (s.mental >= 7) {
          wText = `${subject} spots the prop skull immediately. "That's a prop skull." ${pr.Sub} ${pr.sub==='they'?'kick':'kicks'} it over. "We're fine."`;
          personalScores[subject] += 0.5; wBadge = 'CALLED THE SKULL'; wBadgeClass = 'green';
        } else {
          wText = `${subject} finds the skull and stops completely. The silence is long. Others in the group are concerned — less about the skull and more about ${pr.obj}.`;
          personalScores[subject] -= 0.5; wBadge = 'T-REX SKULL?!'; wBadgeClass = 'red';
          cameraFlags.push({ player: subject, type: 'skullPanic', text: `${subject} is convinced the T-Rex skull is real.`, reactionType: 'entertained' });
        }
      }

      if (wText) timeline.push({ type: 'wildlife', phase: 1, group: label, wildlife: wildlife.name, player: subject, players: group, text: wText, badgeText: wBadge, badgeClass: wBadgeClass });
    }

    // ── Fire Starting (~40%) ──
    if (Math.random() < 0.40) {
      const expert = group.slice().sort((a, b) => pStats(a).mental - pStats(b).mental)[0];// worst mental tries first
      const fixer = group.find(p => p !== expert && pStats(p).mental + pStats(p).endurance >= 12);
      const ePr = pronouns(expert);
      const text = _rp(FIRE_TEXTS)(expert, ePr);
      personalScores[expert] -= 0.5;
      timeline.push({ type: 'fireFail', phase: 1, group: label, player: expert, players: group, text, badgeText: 'FIRE FAIL', badgeClass: 'red' });
      if (fixer) {
        const fText = _rp(FIRE_FIX_TEXTS)(fixer, expert, pronouns(fixer));
        personalScores[fixer] += 1.0; addBond(fixer, expert, -0.5);
        timeline.push({ type: 'fireFix', phase: 1, group: label, player: fixer, players: [fixer, expert], text: fText, badgeText: 'FIRE LIT', badgeClass: 'green' });
      }
    }

    // ── Getting Lost (~25%) ──
    if (Math.random() < 0.25) {
      const victim = group.slice().sort((a, b) => pStats(a).intuition - pStats(b).intuition)[0];
      const vPr = pronouns(victim);
      const text = _rp(LOST_TEXTS)(victim, vPr);
      personalScores[victim] -= 1.5; popDelta(victim, -1);
      timeline.push({ type: 'gettingLost', phase: 1, group: label, player: victim, players: [victim], text, badgeText: 'LOST', badgeClass: 'red' });
      cameraFlags.push({ player: victim, type: 'lost', text: `${victim} has been walking in circles.`, reactionType: 'entertained' });
    }

    // ── Water Gathering (~70%) ──
    if (Math.random() < 0.70) {
      const scout = group.slice().sort((a, b) => {
        const sa = pStats(a), sb = pStats(b);
        return (sb.intuition * 0.05 + sb.endurance * 0.03) - (sa.intuition * 0.05 + sa.endurance * 0.03);
      })[0];
      const sPr = pronouns(scout);
      const text = _rp(WATER_TEXTS)(scout, sPr);
      personalScores[scout] += 1.0;
      group.forEach(p => { if (p !== scout) personalScores[p] += 0.2; });
      timeline.push({ type: 'waterGathering', phase: 1, group: label, player: scout, players: group, text, badgeText: 'WATER FOUND', badgeClass: 'blue' });
    }

    // ── Pair Bonding (~45% per eligible pair, max 2 per group) ──
    let pairBondFired = 0;
    for (let pi = 0; pi < group.length && pairBondFired < 2; pi++) {
      for (let pj = pi + 1; pj < group.length && pairBondFired < 2; pj++) {
        const a = group[pi], b = group[pj];
        if (getBond(a, b) > -2 && Math.random() < 0.45) {
          pairBondFired++;
          const text = _rp(PAIR_BOND_TEXTS)(a, b);
          addBond(a, b, 0.3);
          personalScores[a] += 0.2; personalScores[b] += 0.2;
          timeline.push({ type: 'pairBonding', phase: 1, group: label, players: [a, b], text, badgeText: 'PAIR MOMENT', badgeClass: 'blue' });
        }
      }
    }

    // ── Social Events ──

    // Forced Proximity — Enemies (auto if bond ≤ −2)
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (getBond(group[i], group[j]) <= -2) {
          const a = group[i], b = group[j];
          const aS = pStats(a), bS = pStats(b);
          const severity = (aS.temperament + bS.temperament) * 0.05;
          const text = severity > 0.8
            ? `${a} and ${b} haven't spoken. Until now. The things being said to each other echo across this entire stretch of island.`
            : `${a} and ${b} find ways to take tiny shots at each other. Passive-aggressive, cold, and continuous.`;
          personalScores[a] -= 0.5; personalScores[b] -= 0.5;
          addBond(a, b, -0.4);
          timeline.push({ type: 'forcedProximity', subtype: 'enemies', phase: 1, group: label, players: [a, b], text, badgeText: 'FRICTION', badgeClass: 'red' });
          cameraFlags.push({ player: a, type: 'enemyProximity', text: `${a} and ${b} are stuck together and hating every moment.`, reactionType: 'entertained' });
        }
      }
    }

    // Unexpected Alliance (~50% if both strategic ≥ 6)
    if (group.length >= 2) {
      const strategists = group.filter(p => pStats(p).strategic >= 6);
      if (strategists.length >= 2 && Math.random() < 0.50) {
        const [a, b] = strategists.slice(0, 2);
        const text = `${a} and ${b} are quiet for a while. Then, without ceremony: "We should talk." Four words that change the shape of the next tribal council.`;
        personalScores[a] += 0.5; personalScores[b] += 0.5;
        addBond(a, b, 0.3);
        timeline.push({ type: 'unexpectedAlliance', phase: 1, group: label, players: [a, b], text, badgeText: 'STRATEGY TALK', badgeClass: 'yellow' });
      }
    }

    // Vulnerability Confession (highest temperament player)
    if (Math.random() < 0.45) {
      const confessor = group.slice().sort((a, b) => pStats(b).temperament - pStats(a).temperament)[0];
      const cPr = pronouns(confessor);
      const listener = group.find(p => p !== confessor);
      const confessions = [
        `${confessor} talks about why ${cPr.sub} ${cPr.sub==='they'?'came':'came'} here. Not the official version. The real one.`,
        `${confessor} says something honest. Not strategic — just honest. It stops everyone around ${cPr.obj} cold.`,
        `"I'm scared I'm going to lose," ${confessor} says. Not to anyone in particular. Just to the island.`,
      ];
      const text = _rp(confessions);
      personalScores[confessor] += 0.3;
      if (listener) {
        const lS = pStats(listener);
        if (lS.social >= 6) {
          personalScores[listener] += 0.5; personalScores[confessor] += 0.5;
          addBond(confessor, listener, 0.5);
          timeline.push({ type: 'vulnerabilityConfession', phase: 1, group: label, player: confessor, players: [confessor, listener], text: text + ` ${listener} listens. Really listens.`, badgeText: 'CONFESSION', badgeClass: 'blue' });
        } else {
          timeline.push({ type: 'vulnerabilityConfession', phase: 1, group: label, player: confessor, players: [confessor, listener], text: text + ` ${listener} doesn't know what to do with that.`, badgeText: 'CONFESSION', badgeClass: 'grey' });
        }
      } else {
        timeline.push({ type: 'vulnerabilityConfession', phase: 1, group: label, player: confessor, players: [confessor], text, badgeText: 'CONFESSION', badgeClass: 'grey' });
      }
      cameraFlags.push({ player: confessor, type: 'confession', text: `${confessor} opens up about something real.`, reactionType: 'confused' });
    }

    // ── Small Group Density Floor (groups ≤ 2 get guaranteed extra events) ──
    if (group.length === 1) {
      const solo = group[0]; const soloPr = pronouns(solo); const soloS = pStats(solo);
      // Solo monologue — always fires
      const soloTexts = [
        `${solo} talks to ${soloPr.ref}. Out loud. Full sentences. It's therapeutic until it isn't.`,
        `${solo} has been narrating ${soloPr.posAdj} own survival like a nature documentary for the last twenty minutes. The island does not care. ${solo} presses on.`,
        `${solo} sits down, takes a breath, and says: "Okay. I'm alone. This is fine." The second sentence is debatable.`,
        `"Day one, I find food. Day two, I find people. Day three, I find a way home," ${solo} announces to nobody. Step one goes poorly.`,
      ];
      timeline.push({ type: 'soloMonologue', phase: 1, group: label, player: solo, players: [solo], text: _rp(soloTexts), badgeText: 'SOLO', badgeClass: 'grey' });
      // Solo resource gamble — always fires
      const gambleSuccess = soloS.intuition * 0.05 + soloS.mental * 0.04 + Math.random() * 0.3 > 0.4;
      if (gambleSuccess) {
        const text = `${solo} makes a risky call: ${soloPr.sub} ${soloPr.sub==='they'?'wade':'wades'} into unfamiliar territory alone, following a hunch. The hunch pays off — fresh water, dry ground, and a vantage point.`;
        personalScores[solo] += 1.0; popDelta(solo, 1);
        timeline.push({ type: 'soloGamble', phase: 1, group: label, player: solo, players: [solo], text, badgeText: 'HUNCH PAID OFF', badgeClass: 'gold' });
      } else {
        const text = `${solo} follows ${soloPr.posAdj} gut into the interior. The gut was wrong. ${soloPr.Sub} ${soloPr.sub==='they'?'end':'ends'} up in a dead-end ravine and ${soloPr.sub==='they'?'have':'has'} to backtrack everything.`;
        personalScores[solo] -= 0.8;
        timeline.push({ type: 'soloGamble', phase: 1, group: label, player: solo, players: [solo], text, badgeText: 'DEAD END', badgeClass: 'red' });
      }
      // Solo determination beat
      const detTexts = [
        `${solo} hasn't spoken to another human in hours. ${soloPr.Sub} ${soloPr.sub==='they'?'are':'is'} getting sharper, not duller. Something about total isolation is clarifying.`,
        `Night is coming and ${solo} is still alone. ${soloPr.Sub} ${soloPr.sub==='they'?'build':'builds'} a fire that's bigger than it needs to be. Not for warmth. For visibility. Someone will see it.`,
      ];
      personalScores[solo] += 0.3;
      timeline.push({ type: 'soloDetermination', phase: 1, group: label, player: solo, players: [solo], text: _rp(detTexts), badgeText: 'DETERMINATION', badgeClass: 'green' });
    } else if (group.length === 2) {
      const [p1, p2] = group;
      const bond = getBond(p1, p2);
      // Duo argument or duo teamwork — always fires
      if (bond <= 0) {
        const argTexts = [
          `${p1} and ${p2} disagree about which direction to go. The argument lasts fifteen minutes. Neither of them is right. They compromise on a third direction, which is also wrong, but at least they're wrong together.`,
          `${p1} wants to stay put. ${p2} wants to move. The resulting negotiation involves raised voices, pointed silences, and eventually a coin flip with a flat rock. The rock lands on its edge.`,
          `"You're not listening." "I'm listening — I just don't agree." ${p1} and ${p2} have this exchange four times with minor variations. Each time it gets slightly more personal.`,
        ];
        personalScores[p1] -= 0.3; personalScores[p2] -= 0.3; addBond(p1, p2, -0.2);
        timeline.push({ type: 'duoArgument', phase: 1, group: label, players: [p1, p2], text: _rp(argTexts), badgeText: 'FRICTION', badgeClass: 'red' });
      } else {
        const teamTexts = [
          `${p1} and ${p2} fall into a rhythm without discussing it. One gathers, one builds. One scouts, one secures. It's efficient in a way that surprises both of them.`,
          `There's no strategy meeting. ${p1} and ${p2} just start working. ${p1} handles the structure; ${p2} handles the perimeter. By the end of the hour, they've got more done than groups three times their size.`,
          `${p1} and ${p2} develop a shorthand over the course of the afternoon. By sundown, a head nod means "check that," a shrug means "not worth it," and a pointed look means "we need to talk about this later."`,
        ];
        personalScores[p1] += 0.4; personalScores[p2] += 0.4; addBond(p1, p2, 0.3);
        timeline.push({ type: 'duoTeamwork', phase: 1, group: label, players: [p1, p2], text: _rp(teamTexts), badgeText: 'DUO SYNERGY', badgeClass: 'green' });
      }
      // Resource competition or cooperation — always fires
      const compTexts = [
        `${p1} finds a coconut. ${p2} also finds a coconut. They stare at each other's coconuts for a moment. "Mine's bigger," ${p1} says. It isn't. Both of them know.`,
        `${p2} discovers a freshwater stream. ${p1} discovers a fruit tree. They negotiate a trade without ever using the word "trade." Diplomacy in its purest form.`,
        `With only two people, every resource decision is a negotiation. ${p1} and ${p2} work out a system: finder gets first pick, other gets second. It works until someone finds something actually good.`,
      ];
      timeline.push({ type: 'duoResource', phase: 1, group: label, players: [p1, p2], text: _rp(compTexts), badgeText: 'RESOURCE SPLIT', badgeClass: 'grey' });
    }

    // ── Escape Attempt (~85%) — each group tries something to find help or escape ──
    if (Math.random() < 0.85) {
      const escaper = group.slice().sort((a, b) =>
        (pStats(b).boldness * 0.4 + pStats(b).physical * 0.3) - (pStats(a).boldness * 0.4 + pStats(a).physical * 0.3)
      )[0];
      const ePr = pronouns(escaper);
      const eS = pStats(escaper);
      // Type selection weighted by stats
      const typeRoll = Math.random();
      const attemptType = eS.mental >= 7 ? (typeRoll < 0.45 ? 'climb' : 'tracks')
        : eS.boldness >= 7 ? (typeRoll < 0.45 ? 'raft' : 'signalFire')
        : ['raft', 'climb', 'signalFire', 'tracks'][Math.floor(typeRoll * 4)];
      let eText = '', eBadge = '', eBadgeClass = 'grey', eOutcome = 'fail';

      if (attemptType === 'raft') {
        const successChance = eS.physical * 0.05 + eS.endurance * 0.03 + Math.random() * 0.3;
        if (successChance > 0.7 && groups.length > 1) {
          const otherGroupOptions = groups.filter((_, i) => i !== gi);
          const targetGrp = _rp(otherGroupOptions);
          const otherPlayer = _rp(targetGrp);
          eText = _rp(ESCAPE_TEXTS.raftNearMiss)(escaper, ePr, otherPlayer);
          eOutcome = 'raftNearMiss'; eBadge = 'RAFT: NEAR MISS'; eBadgeClass = 'yellow';
          escapeAttempts.push({ player: escaper, group: gi, outcome: 'raftNearMiss', targetPlayer: otherPlayer, targetGroup: groups.indexOf(targetGrp) });
          personalScores[escaper] -= 0.3;
        } else {
          eText = _rp(ESCAPE_TEXTS.raftCircle)(escaper, ePr);
          eOutcome = 'raftCircle'; eBadge = 'RAFT CIRCLES BACK'; eBadgeClass = 'yellow';
          escapeAttempts.push({ player: escaper, group: gi, outcome: 'raftCircle' });
          personalScores[escaper] -= 0.5;
          cameraFlags.push({ player: escaper, type: 'raftCircles', text: `${escaper}'s raft returns to exactly where it started.`, reactionType: 'entertained' });
        }
      } else if (attemptType === 'climb') {
        const climbChance = eS.physical * 0.06 + eS.boldness * 0.03 + Math.random() * 0.2;
        if (climbChance > 0.5) {
          eText = _rp(ESCAPE_TEXTS.climbSpot)(escaper, ePr);
          eOutcome = 'climbSpot'; eBadge = 'SMOKE SPOTTED'; eBadgeClass = 'green';
          personalScores[escaper] += 0.7;
          cameraFlags.push({ player: escaper, type: 'climbSpot', text: `${escaper} climbs a tree and spots other groups' smoke.`, reactionType: 'impressed' });
        } else {
          eText = _rp(ESCAPE_TEXTS.climbFail)(escaper, ePr);
          eOutcome = 'climbFail'; eBadge = 'CLIMB FAIL'; eBadgeClass = 'grey';
          personalScores[escaper] -= 0.3;
        }
        escapeAttempts.push({ player: escaper, group: gi, outcome: eOutcome });
      } else if (attemptType === 'signalFire') {
        eText = _rp(ESCAPE_TEXTS.signalFire)(escaper, ePr);
        eOutcome = 'signalFire'; eBadge = 'SIGNAL FIRE'; eBadgeClass = 'orange';
        escapeAttempts.push({ player: escaper, group: gi, outcome: 'signalFire' });
        personalScores[escaper] += 0.5;
      } else {
        // tracks
        eText = _rp(ESCAPE_TEXTS.trackFollow)(escaper, ePr);
        eOutcome = 'trackFollow'; eBadge = 'TRACKS FOUND'; eBadgeClass = 'blue';
        escapeAttempts.push({ player: escaper, group: gi, outcome: 'trackFollow' });
        personalScores[escaper] += 0.4;
      }
      if (eText) timeline.push({ type: 'escapeAttempt', subtype: attemptType, phase: 1, group: label, player: escaper, players: [escaper], text: eText, badgeText: eBadge, badgeClass: eBadgeClass });
    }
  });

  // ══ CROSS-GROUP ENCOUNTERS (Phase 1.5) ══
  // Groups find each other through escape misadventures — 1-3 encounters max
  const usedEncounterPairs = new Set();
  let encounterCount = 0;

  // Pterodactyl cross-delivery — if ptero wildlife fired, bird drops player near another group
  const pteroEvt = timeline.find(e => e.type === 'wildlife' && e.wildlife === 'Pterodactyl' && e.phase === 1);
  if (pteroEvt && groups.length > 1 && Math.random() < 0.60) {
    const carried = pteroEvt.player;
    const carriedGi = groups.findIndex(g => g.includes(carried));
    const targetGrp = _rp(groups.filter((_, i) => i !== carriedGi));
    const finder = _rp(targetGrp);
    const pairKey = [carried, finder].sort().join('__');
    usedEncounterPairs.add(pairKey);
    encounterCount++;
    const text = _rp(CROSS_ENCOUNTER_TEXTS.pterodactylDelivery)(carried, finder);
    addBond(carried, finder, 0.4); personalScores[carried] += 0.5; personalScores[finder] += 0.3;
    timeline.push({ type: 'crossEncounter', subtype: 'pterodactylDelivery', phase: 1, players: [carried, finder], text, badgeText: 'DELIVERED BY PTERODACTYL', badgeClass: 'yellow' });
    cameraFlags.push({ player: carried, type: 'pterodactylDelivered', text: `${carried} arrives via pterodactyl at ${finder}'s camp.`, reactionType: 'entertained' });
  }

  // Signal fire draws a nearby group
  const sigAttempt = escapeAttempts.find(e => e.outcome === 'signalFire');
  if (sigAttempt && groups.length > 1 && encounterCount < 2 && Math.random() < 0.65) {
    const sigPlayer = sigAttempt.player;
    const otherGrp = _rp(groups.filter((_, i) => i !== sigAttempt.group));
    const drawPlayer = _rp(otherGrp);
    const pairKey = [sigPlayer, drawPlayer].sort().join('__');
    if (!usedEncounterPairs.has(pairKey)) {
      usedEncounterPairs.add(pairKey); encounterCount++;
      const text = _rp(CROSS_ENCOUNTER_TEXTS.signalFound)(drawPlayer, sigPlayer);
      addBond(sigPlayer, drawPlayer, 0.3); personalScores[sigPlayer] += 0.5; personalScores[drawPlayer] += 0.3;
      timeline.push({ type: 'crossEncounter', subtype: 'signalFound', phase: 1, players: [drawPlayer, sigPlayer], text, badgeText: 'SIGNAL FIRE FOUND', badgeClass: 'green' });
    }
  }

  // Raft near-miss: player shouted back and forth, knows direction
  const nearMissAttempt = escapeAttempts.find(e => e.outcome === 'raftNearMiss' && e.targetPlayer);
  if (nearMissAttempt && encounterCount < 2 && Math.random() < 0.70) {
    const a = nearMissAttempt.player, b = nearMissAttempt.targetPlayer;
    const pairKey = [a, b].sort().join('__');
    if (!usedEncounterPairs.has(pairKey)) {
      usedEncounterPairs.add(pairKey); encounterCount++;
      const text = _rp(CROSS_ENCOUNTER_TEXTS.shouting)(a, b);
      addBond(a, b, 0.3); personalScores[a] += 0.3; personalScores[b] += 0.3;
      timeline.push({ type: 'crossEncounter', subtype: 'shouting', phase: 1, players: [a, b], text, badgeText: 'CONTACT!', badgeClass: 'blue' });
    }
  }

  // Track-follower wanders into another group's camp
  const trackAttempt = escapeAttempts.find(e => e.outcome === 'trackFollow');
  if (trackAttempt && groups.length > 1 && encounterCount < 3 && Math.random() < 0.55) {
    const tracker = trackAttempt.player;
    const otherGrp = _rp(groups.filter((_, i) => i !== trackAttempt.group));
    const foundPlayer = _rp(otherGrp);
    const pairKey = [tracker, foundPlayer].sort().join('__');
    if (!usedEncounterPairs.has(pairKey)) {
      usedEncounterPairs.add(pairKey); encounterCount++;
      const text = _rp(CROSS_ENCOUNTER_TEXTS.lostPlayerFound)(tracker, foundPlayer);
      addBond(tracker, foundPlayer, 0.2); personalScores[tracker] += 0.2;
      timeline.push({ type: 'crossEncounter', subtype: 'lostPlayerFound', phase: 1, players: [tracker, foundPlayer], text, badgeText: 'FOUND CAMP', badgeClass: 'blue' });
    }
  }

  // Random accidental meeting (~25% chance per cross-group pair, cap at 2 total)
  if (groups.length > 1 && encounterCount < 2 && Math.random() < 0.25) {
    for (let gi2 = 0; gi2 < groups.length && encounterCount < 2; gi2++) {
      for (let gj2 = gi2 + 1; gj2 < groups.length && encounterCount < 2; gj2++) {
        const a2 = _rp(groups[gi2]), b2 = _rp(groups[gj2]);
        const pairKey2 = [a2, b2].sort().join('__');
        if (!usedEncounterPairs.has(pairKey2) && Math.random() < 0.30) {
          usedEncounterPairs.add(pairKey2); encounterCount++;
          const text = _rp(CROSS_ENCOUNTER_TEXTS.accidental)(a2, b2);
          addBond(a2, b2, 0.2); personalScores[a2] += 0.2; personalScores[b2] += 0.2;
          timeline.push({ type: 'crossEncounter', subtype: 'accidental', phase: 1, players: [a2, b2], text, badgeText: 'ACCIDENTAL MEETING', badgeClass: 'grey' });
        }
      }
    }
  }

  // Guarantee at least one cross-encounter if multiple groups exist
  if (groups.length > 1 && encounterCount === 0) {
    const gi0 = 0, gj0 = 1;
    const a0 = _rp(groups[gi0]), b0 = _rp(groups[gj0]);
    usedEncounterPairs.add([a0, b0].sort().join('__')); encounterCount++;
    const text = _rp(CROSS_ENCOUNTER_TEXTS.accidental)(a0, b0);
    addBond(a0, b0, 0.2); personalScores[a0] += 0.2; personalScores[b0] += 0.2;
    timeline.push({ type: 'crossEncounter', subtype: 'accidental', phase: 1, players: [a0, b0], text, badgeText: 'ACCIDENTAL MEETING', badgeClass: 'grey' });
  }


  const usedNightBuckets = {}; // { groupLabel: Set<bucket> }
  groups.forEach((group, gi) => {
    const label = groupLabels[gi];
    usedNightBuckets[label] = new Set();

    // Comedy bucket
    if (Math.random() < 0.65 && !usedNightBuckets[label].has('comedy')) {
      usedNightBuckets[label].add('comedy');
      const roll = Math.random();
      if (roll < 0.30) {
        // Sleep talking
        const sleeper = group.slice().sort((a, b) => pStats(a).mental - pStats(b).mental)[0];
        const sText = _rp(NIGHT_COMEDY.sleepTalk)(sleeper, pronouns(sleeper));
        const isStrategic = pStats(sleeper).strategic >= 7 && Math.random() < 0.5;
        if (isStrategic) {
          // Sleeper exposed a groupmate — that person now has a target on their back
          const named = group.find(p => p !== sleeper) || sleeper;
          personalScores[sleeper] -= 1.0;
          gs._castawaysHeat = gs._castawaysHeat || [];
          gs._castawaysHeat.push({ target: named, amount: 1.0, expiresEp: (gs.episode || 1) + 2 });
        }
        group.forEach(p => { if (p !== sleeper) addBond(p, sleeper, 0.2); });
        timeline.push({ type: 'nightEvent', subtype: 'sleepTalk', phase: 2, group: label, player: sleeper, players: group, text: sText, badgeText: isStrategic ? 'EXPOSED!' : 'SLEEP TALKING', badgeClass: isStrategic ? 'red' : 'yellow' });
        if (isStrategic) cameraFlags.push({ player: sleeper, type: 'sleepTalkExposed', text: `${sleeper} reveals strategy in their sleep.`, reactionType: 'entertained' });
      } else if (roll < 0.55) {
        // 2am breakfast
        const cook = group.slice().sort((a, b) => pStats(a).endurance - pStats(b).endurance)[0];
        const cText = _rp(NIGHT_COMEDY.am2Breakfast)(cook, pronouns(cook));
        personalScores[cook] -= 0.5; group.forEach(p => { if (p !== cook) addBond(p, cook, -0.2); });
        timeline.push({ type: 'nightEvent', subtype: 'am2Breakfast', phase: 2, group: label, player: cook, players: group, text: cText, badgeText: '2AM BREAKFAST', badgeClass: 'yellow' });
        cameraFlags.push({ player: cook, type: 'am2Breakfast', text: `${cook} wakes everyone at 2am to cook.`, reactionType: 'entertained' });
      } else if (roll < 0.75 && group.length >= 2) {
        // Nightmare scream
        const screamer = group.slice().sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
        const nText = _rp(NIGHT_COMEDY.nightmare)(screamer, pronouns(screamer));
        personalScores[screamer] -= 0.3; group.forEach(p => { if (p !== screamer) addBond(p, screamer, 0.2); });
        timeline.push({ type: 'nightEvent', subtype: 'nightmare', phase: 2, group: label, player: screamer, players: group, text: nText, badgeText: 'NIGHTMARE', badgeClass: 'yellow' });
      } else {
        // Seagull in shelter
        const sText = NIGHT_COMEDY.seagull[0](group);
        const victim = _rp(group);
        personalScores[victim] -= 0.5; group.forEach(p => { if (p !== victim) addBond(p, victim, 0.2); });
        timeline.push({ type: 'nightEvent', subtype: 'seagull', phase: 2, group: label, players: group, text: sText, badgeText: 'SEAGULL CHAOS', badgeClass: 'yellow' });
        cameraFlags.push({ player: victim, type: 'seagullChaos', text: `A seagull raids the shelter.`, reactionType: 'entertained' });
      }
    }

    // Drama bucket
    if (Math.random() < 0.55 && !usedNightBuckets[label].has('drama')) {
      usedNightBuckets[label].add('drama');
      // Old wounds (if enemy pair)
      let foundDrama = false;
      if (group.length >= 2) {
        for (let i = 0; i < group.length && !foundDrama; i++) {
          for (let j = i + 1; j < group.length && !foundDrama; j++) {
            if (getBond(group[i], group[j]) <= -1 && Math.random() < 0.6) {
              foundDrama = true;
              const a = group[i], b = group[j];
              const aS = pStats(a), bS = pStats(b);
              const escalate = (aS.temperament + bS.temperament) * 0.05 > 0.7;
              const text = _rp(NIGHT_DRAMA.oldWounds)(a, b, pronouns(a), pronouns(b));
              if (escalate) {
                personalScores[a] -= 1.0; personalScores[b] -= 1.0; addBond(a, b, -0.7);
              } else {
                personalScores[a] -= 0.2; personalScores[b] -= 0.2; addBond(a, b, 0.3);
              }
              timeline.push({ type: 'nightEvent', subtype: 'oldWounds', phase: 2, group: label, players: [a, b], text, badgeText: escalate ? 'OLD WOUNDS (BLOWUP)' : 'OLD WOUNDS', badgeClass: escalate ? 'red' : 'yellow' });
            }
          }
        }
      }
      if (!foundDrama) {
        // Hunger breakdown
        const struggling = group.slice().sort((a, b) => pStats(a).endurance - pStats(b).endurance)[0];
        const sPr = pronouns(struggling);
        const text = _rp(NIGHT_DRAMA.hungerBreakdown)(struggling, sPr);
        personalScores[struggling] -= 0.5;
        const comforter = group.find(p => p !== struggling && (isNiceArch(p) || pStats(p).social >= 7));
        if (comforter) {
          personalScores[comforter] += 0.3; addBond(comforter, struggling, 0.4);
          timeline.push({ type: 'nightEvent', subtype: 'hungerBreakdown', phase: 2, group: label, player: struggling, players: [struggling, comforter], text: text + ` ${comforter} notices and sits closer.`, badgeText: 'HUNGER BREAKDOWN', badgeClass: 'blue' });
        } else {
          timeline.push({ type: 'nightEvent', subtype: 'hungerBreakdown', phase: 2, group: label, player: struggling, players: [struggling], text, badgeText: 'HUNGER BREAKDOWN', badgeClass: 'grey' });
        }
      }
    }

    // Heartfelt bucket
    if (Math.random() < 0.60 && !usedNightBuckets[label].has('heartfelt')) {
      usedNightBuckets[label].add('heartfelt');
      if (group.length === 1) {
        // Solo resolve
        const solo = group[0];
        const text = _rp(NIGHT_HEARTFELT.soloResolve)(solo, pronouns(solo));
        personalScores[solo] += 0.5; popDelta(solo, 1);
        timeline.push({ type: 'nightEvent', subtype: 'soloResolve', phase: 2, group: label, player: solo, players: [solo], text, badgeText: 'SOLO RESOLVE', badgeClass: 'green' });
      } else if (group.length >= 2) {
        // Find best pair for stargazing (bond ≥ 1)
        let gazers = null;
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            if (getBond(group[i], group[j]) >= 1) { gazers = [group[i], group[j]]; break; }
          }
          if (gazers) break;
        }
        if (gazers) {
          const [a, b] = gazers;
          const text = _rp(NIGHT_HEARTFELT.stargazing)(a, b, pronouns(a), pronouns(b));
          personalScores[a] += 0.5; personalScores[b] += 0.5; addBond(a, b, 0.5);
          if (romanticCompat(a, b)) _challengeRomanceSpark(a, b, ep, 'challenge');
          timeline.push({ type: 'nightEvent', subtype: 'stargazing', phase: 2, group: label, players: [a, b], text, badgeText: 'STARGAZING', badgeClass: 'pink' });
        } else {
          // Unlikely friends (bond between -1 and 1)
          let friendPair = null;
          for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
              const b = getBond(group[i], group[j]);
              if (b >= -1 && b <= 1) { friendPair = [group[i], group[j]]; break; }
            }
            if (friendPair) break;
          }
          if (friendPair) {
            const [a, b] = friendPair;
            const text = _rp(NIGHT_HEARTFELT.unlikelyFriends)(a, b, pronouns(a), pronouns(b));
            personalScores[a] += 0.3; personalScores[b] += 0.3; addBond(a, b, 0.4);
            timeline.push({ type: 'nightEvent', subtype: 'unlikelyFriends', phase: 2, group: label, players: [a, b], text, badgeText: 'UNLIKELY FRIENDS', badgeClass: 'blue' });
            cameraFlags.push({ player: a, type: 'unlikelyFriends', text: `${a} and ${b} find unexpected common ground.`, reactionType: 'confused' });
            timeline.push({ type: 'chrisReaction', phase: 2, reactionType: 'confused', text: _rp(CHRIS_REACTIONS.confused) });
          }
        }
      }
    }

    // Second comedy pass — snoring or paranoia (distinct from first pass)
    if (Math.random() < 0.45) {
      const snorer = group.slice().sort((a, b) => pStats(a).endurance - pStats(b).endurance)[0];
      const snorerPr = pronouns(snorer);
      const snoreTexts = [
        `${snorer} is snoring. Loudly. Rhythmically. With the energy of someone who has been doing this for years and has never once been told about it.`,
        `The sound ${snorer} makes while sleeping is a conversation-stopper even in sleep. The others give ${snorerPr.obj} more and more space over the course of the night.`,
      ];
      const text = _rp(snoreTexts);
      group.filter(p => p !== snorer).forEach(p => addBond(p, snorer, -0.1));
      timeline.push({ type: 'nightEvent', subtype: 'snoring', phase: 2, group: label, player: snorer, players: group, text, badgeText: 'SNORING', badgeClass: 'yellow' });
    }

    // Second heartfelt pass — quiet moment / homesick
    if (group.length >= 2 && Math.random() < 0.40) {
      const thinker = _rp(group);
      const tPr = pronouns(thinker);
      const quietTexts = [
        `${thinker} goes quiet for a long time. Not scared — just absent in a way that reads like homesickness. The others leave ${tPr.obj} to it.`,
        `${thinker} stares up through the tree canopy. Whatever ${tPr.sub} ${tPr.sub==='they'?'are':'is'} thinking about, ${tPr.sub} ${tPr.sub==='they'?'keep':'keeps'} it to ${tPr.ref}. The game can wait.`,
      ];
      personalScores[thinker] += 0.2;
      timeline.push({ type: 'nightEvent', subtype: 'quietMoment', phase: 2, group: label, player: thinker, players: group, text: _rp(quietTexts), badgeText: 'QUIET MOMENT', badgeClass: 'blue' });
    }

    // Late night strategy whisper
    const strategizers = group.filter(p => pStats(p).strategic >= 6);
    if (strategizers.length >= 2 && Math.random() < 0.55) {
      const [pl1, pl2] = strategizers.slice(0, 2);
      const text = `The others are asleep. ${pl1} and ${pl2} aren't. Something is being decided in the dark — what exactly, the cameras can see but the others can't hear.`;
      personalScores[pl1] += 0.3; personalScores[pl2] += 0.3;
      addBond(pl1, pl2, 0.4);
      timeline.push({ type: 'nightEvent', subtype: 'strategyWhisper', phase: 2, group: label, players: [pl1, pl2], text, badgeText: 'LATE NIGHT SCHEMING', badgeClass: 'purple' });
    } else if (strategizers.length === 1 && Math.random() < 0.50) {
      const lone = strategizers[0];
      const lonePr = pronouns(lone);
      const text = `${lone} lies awake running scenarios. ${lonePr.Sub} ${lonePr.sub==='they'?'go':'goes'} through names, numbers, loyalties. The island sleeps. ${lonePr.Sub} ${lonePr.sub==='they'?'don\'t':'doesn\'t'}.`;
      personalScores[lone] += 0.3;
      timeline.push({ type: 'nightEvent', subtype: 'soloStrategy', phase: 2, group: label, player: lone, players: [lone], text, badgeText: 'LONE STRATEGIST', badgeClass: 'purple' });
    }

    // Night sounds / fright — low endurance player startles (~40%)
    if (Math.random() < 0.40) {
      const startled = group.slice().sort((a, b) => pStats(a).endurance - pStats(b).endurance)[0];
      const sPr = pronouns(startled);
      const frightTexts = [
        `Something moves in the trees near camp. ${startled} is the only one who hears it, and ${sPr.sub} ${sPr.sub==='they'?'don\'t':'doesn\'t'} sleep again for an hour.`,
        `A branch cracks. ${startled} sits bolt upright. The group cycles through alarm, then sleepy irritation, then silence. Nothing was there.`,
      ];
      timeline.push({ type: 'nightEvent', subtype: 'nightFright', phase: 2, group: label, player: startled, players: group, text: _rp(frightTexts), badgeText: 'NIGHT FRIGHT', badgeClass: 'yellow' });
      personalScores[startled] -= 0.2;
    }

    // Conspiracy theory — mental player starts processing the challenge setup (~45%)
    if (Math.random() < 0.45) {
      const theorist = group.slice().sort((a, b) => pStats(b).mental + pStats(b).strategic - pStats(a).mental - pStats(a).strategic)[0];
      const tPr = pronouns(theorist);
      const theoryTexts = [
        `${theorist} lies awake working through the logistics. "Production flooded the cabins on purpose. There's no way that was random." ${tPr.Sub} ${tPr.sub==='they'?'have':'has'} seventeen supporting points. The group listens for four minutes, then goes to sleep.`,
        `${theorist} has a theory about why this happened, what it means for tomorrow, and how it connects to three things that happened on day one. ${tPr.Sub} ${tPr.sub==='they'?'share':'shares'} the whole thing. None of it is wrong.`,
      ];
      timeline.push({ type: 'nightEvent', subtype: 'conspiracy', phase: 2, group: label, player: theorist, players: group, text: _rp(theoryTexts), badgeText: 'CONSPIRACY THEORY', badgeClass: 'purple' });
      personalScores[theorist] += 0.2;
    }

    // Dawn watch — endurance player keeps the fire alive
    if (Math.random() < 0.50) {
      const dawner = group.slice().sort((a, b) => pStats(b).endurance - pStats(a).endurance)[0];
      const dawnerPr = pronouns(dawner);
      const dawnTexts = [
        `${dawner} is up before the light is. ${dawnerPr.Sub} ${dawnerPr.sub==='they'?'keep':'keeps'} the fire alive and watches the island wake up. Something resolves in the quiet that couldn't resolve in the noise.`,
        `While the group sleeps, ${dawner} does a quiet perimeter check. The island is loud at dawn. ${dawnerPr.Sub} ${dawnerPr.sub==='they'?'note':'notes'} three things and ${dawnerPr.sub==='they'?'tell':'tells'} nobody.`,
      ];
      personalScores[dawner] += 0.4;
      timeline.push({ type: 'nightEvent', subtype: 'dawnWatch', phase: 2, group: label, player: dawner, players: [dawner], text: _rp(dawnTexts), badgeText: 'DAWN WATCH', badgeClass: 'green' });
    }
  });
  // Cooldown: skip players who broke down within the last 2 episodes
  if (!gs._lastCoconutEp) gs._lastCoconutEp = {};
  const currentEp = gs.episode || 1;
  const candidates = activePlayers
    .filter(n => !gs._lastCoconutEp[n] || currentEp - gs._lastCoconutEp[n] >= 2)
    .map(n => ({ name: n, score: pStats(n).mental + pStats(n).temperament }))
    .sort((a, b) => a.score - b.score);
  const breakdowns = [];
  if (candidates.length > 0 && Math.random() < 0.30) {
    const bd = _fireBreakdown(candidates[0].name, groups, timeline, cameraFlags, personalScores);
    if (bd) { breakdowns.push(bd); gs._lastCoconutEp[candidates[0].name] = currentEp; }
  }
  if (candidates.length > 1 && Math.random() < 0.15) {
    const bd = _fireBreakdown(candidates[1].name, groups, timeline, cameraFlags, personalScores);
    if (bd) { breakdowns.push(bd); gs._lastCoconutEp[candidates[1].name] = currentEp; }
  }

  // ══ PHASE 3 — REGROUPING ══
  // Pre-compute discoverer (Phase 4) here so Phase 3 war-paint can exclude them
  const _discovererScore = n => pStats(n).boldness * 0.4 + pStats(n).intuition * 0.3 + pStats(n).strategic * 0.3;
  const discoverer = activePlayers.slice().sort((a, b) => _discovererScore(b) - _discovererScore(a))[0];
  const regroupedPairs = new Set();

  // Final Assembly — the moment everyone is together; opens the regroup screen
  timeline.push({ type: 'finalAssembly', phase: 3, players: [...activePlayers],
    text: FINAL_ASSEMBLY_TEXTS[Math.floor(Math.random() * FINAL_ASSEMBLY_TEXTS.length)](activePlayers),
    badgeText: '✓ ALL ACCOUNTED FOR', badgeClass: 'green' });

  // Emotional/Tense reunions
  for (let i = 0; i < activePlayers.length; i++) {
    for (let j = i + 1; j < activePlayers.length; j++) {
      const a = activePlayers[i], b = activePlayers[j];
      const bond = getBond(a, b);
      const pairKey = [a, b].sort().join('__');
      // Check different groups
      const groupA = groups.findIndex(g => g.includes(a));
      const groupB = groups.findIndex(g => g.includes(b));
      if (groupA === groupB || regroupedPairs.has(pairKey)) continue;
      if (bond >= 1.5 && Math.random() < 0.70) {
        regroupedPairs.add(pairKey);
        const text = _rp(REUNION_TEXTS.emotional)(a, b, pronouns(a), pronouns(b));
        personalScores[a] += 0.5; personalScores[b] += 0.5; addBond(a, b, 0.3);
        if (bond >= 4) { popDelta(a, 1); popDelta(b, 1); }
        timeline.push({ type: 'reunion', subtype: 'emotional', phase: 3, players: [a, b], text, badgeText: 'REUNION', badgeClass: 'green' });
      } else if (bond <= -0.5 && Math.random() < 0.60) {
        regroupedPairs.add(pairKey);
        const text = _rp(REUNION_TEXTS.tense)(a, b, pronouns(a), pronouns(b));
        personalScores[a] -= 0.3; personalScores[b] -= 0.3; addBond(a, b, -0.2);
        timeline.push({ type: 'reunion', subtype: 'tense', phase: 3, players: [a, b], text, badgeText: 'TENSE REUNION', badgeClass: 'red' });
      }
    }
  }

  // Raft circles back (~20%)
  if (Math.random() < 0.20) {
    const rafter = _rp(activePlayers);
    const rPr = pronouns(rafter);
    const text = _rp(REUNION_TEXTS.raftCircles)(rafter, rPr);
    personalScores[rafter] -= 0.5;
    const rafterGroup = groups.find(g => g.includes(rafter)) || [];
    const nearby = rafterGroup.filter(p => p !== rafter);
    nearby.forEach(p => addBond(p, rafter, 0.3));
    timeline.push({ type: 'reunion', subtype: 'raftCircles', phase: 3, player: rafter, players: [rafter, ...nearby], text, badgeText: 'RAFT CIRCLES BACK', badgeClass: 'yellow' });
    cameraFlags.push({ player: rafter, type: 'raftCircles', text: `${rafter}'s heroic raft returns to exactly where it started.`, reactionType: 'entertained' });
  }

  // Intel share — one reporter per group catches the full cast up on what happened
  const usedIntelIdx = new Set();
  groups.forEach((group, gi) => {
    const reporter = group.slice().sort((a, b) =>
      (pStats(b).social * 0.6 + pStats(b).strategic * 0.4) - (pStats(a).social * 0.6 + pStats(a).strategic * 0.4)
    )[0];
    const rPr = pronouns(reporter);
    // Dedup: pick an unused text index
    let idx = Math.floor(Math.random() * PHASE3_INTEL_TEXTS.length);
    for (let t = 0; t < PHASE3_INTEL_TEXTS.length; t++) {
      if (!usedIntelIdx.has(idx)) break;
      idx = (idx + 1) % PHASE3_INTEL_TEXTS.length;
    }
    usedIntelIdx.add(idx);
    const text = PHASE3_INTEL_TEXTS[idx](reporter, rPr);
    personalScores[reporter] += 0.4;
    timeline.push({ type: 'reunion', subtype: 'intelShare', phase: 3, player: reporter, players: group, text, badgeText: 'INTEL SHARE', badgeClass: 'blue' });
  });

  // Shared suffering — cross-group pairs commiserate (~25% per pair, cap 2)
  let sharedSufferingFired = 0;
  for (let i = 0; i < activePlayers.length && sharedSufferingFired < 2; i++) {
    for (let j = i + 1; j < activePlayers.length && sharedSufferingFired < 2; j++) {
      const a = activePlayers[i], b = activePlayers[j];
      const pairKey = [a, b].sort().join('__');
      const groupA = groups.findIndex(g => g.includes(a));
      const groupB = groups.findIndex(g => g.includes(b));
      if (groupA !== groupB && !regroupedPairs.has(pairKey) && Math.random() < 0.25) {
        sharedSufferingFired++;
        regroupedPairs.add(pairKey);
        const text = _rp(REUNION_TEXTS.sharedSuffering)(a, b, pronouns(a), pronouns(b));
        addBond(a, b, 0.3); personalScores[a] += 0.2; personalScores[b] += 0.2;
        timeline.push({ type: 'reunion', subtype: 'sharedSuffering', phase: 3, players: [a, b], text, badgeText: 'SHARED SUFFERING', badgeClass: 'green' });
      }
    }
  }

  // Confession circle (~50%) — the TDI "confess sins" moment
  if (Math.random() < 0.50 && activePlayers.length >= 3) {
    const prompter = activePlayers.slice().sort((a, b) =>
      (pStats(b).social * 0.5 + pStats(b).temperament * 0.5) - (pStats(a).social * 0.5 + pStats(a).temperament * 0.5)
    )[0];
    const pPr = pronouns(prompter);
    timeline.push({ type: 'reunion', subtype: 'confessionPrompt', phase: 3, player: prompter, players: [prompter],
      text: _rp(CONFESSION_CIRCLE_TEXTS.prompt)(prompter, pPr), badgeText: 'ONE TRUE THING', badgeClass: 'blue' });
    const confessors = activePlayers.filter(p => p !== prompter).sort(() => Math.random() - 0.5).slice(0, Math.min(3, activePlayers.length - 1));
    const usedConfessionIdx = new Set();
    confessors.forEach(confessor => {
      const cPr = pronouns(confessor);
      personalScores[confessor] += 0.3; addBond(confessor, prompter, 0.2);
      // Dedup confession text
      let cIdx = Math.floor(Math.random() * CONFESSION_CIRCLE_TEXTS.confession.length);
      for (let t = 0; t < CONFESSION_CIRCLE_TEXTS.confession.length; t++) {
        if (!usedConfessionIdx.has(cIdx)) break;
        cIdx = (cIdx + 1) % CONFESSION_CIRCLE_TEXTS.confession.length;
      }
      usedConfessionIdx.add(cIdx);
      timeline.push({ type: 'reunion', subtype: 'confession', phase: 3, player: confessor, players: [confessor, prompter],
        text: CONFESSION_CIRCLE_TEXTS.confession[cIdx](confessor, cPr), badgeText: 'CONFESSION', badgeClass: 'blue' });
    });
  }

  // Strategy consolidation— strategic ≥ 6 players refocus on the game (~65%)
  const strategicPlayers = activePlayers.filter(p => pStats(p).strategic >= 6);
  if (strategicPlayers.length > 0 && Math.random() < 0.65) {
    const pivot = _rp(strategicPlayers);
    const pivotPr = pronouns(pivot);
    const text = _rp(PHASE3_STRATEGY_TEXTS)(pivot, pivotPr);
    personalScores[pivot] += 0.5;
    timeline.push({ type: 'reunion', subtype: 'strategyConsolidation', phase: 3, player: pivot, players: [pivot], text, badgeText: 'STRATEGY MODE', badgeClass: 'purple' });
  }

  // War paint preparation (boldness ≥ 7) — fires ~55%; excludes discoverer to prevent double-dip
  let warPaintFired = false;
  const warPainters = activePlayers.filter(p => pStats(p).boldness >= 7);
  if (warPainters.length > 0 && Math.random() < 0.55) {
    const painters = warPainters.filter(p => p !== discoverer);
    const actualPainters = painters.length > 0 ? painters : warPainters;
    actualPainters.forEach(p => { personalScores[p] += 1.0; });
    activePlayers.filter(p => !actualPainters.includes(p)).forEach(p => { personalScores[p] += 0.2; });
    timeline.push({ type: 'reunion', subtype: 'warPaint', phase: 3, players: actualPainters, text: _rp(REUNION_TEXTS.warPaint)(actualPainters), badgeText: 'WAR PARTY', badgeClass: 'red' });
    warPaintFired = true;
  } else {
    // Stealth approach — rewards intuition players when war party doesn't fire
    const stealthers = activePlayers.filter(p => pStats(p).intuition >= 6);
    if (stealthers.length > 0) {
      const stealthLeader = stealthers.slice().sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
      personalScores[stealthLeader] += 0.8;
      stealthers.forEach(p => { if (p !== stealthLeader) personalScores[p] += 0.3; });
      timeline.push({ type: 'reunion', subtype: 'stealthApproach', phase: 3, player: stealthLeader, players: stealthers, text: `${stealthLeader} signals the group to move quietly. No paint, no war cry — just angles and patience. They arrive at the camp perimeter before anyone knows they're there.`, badgeText: 'STEALTH APPROACH', badgeClass: 'blue' });
    }
  }

  // "Called It" — high strategic/intuition predicted the challenge
  const calledIt = activePlayers.filter(p => pStats(p).intuition >= 7 || pStats(p).strategic >= 7);
  if (calledIt.length > 0 && Math.random() < 0.60) {
    const prophet = calledIt[0];
    const text = _rp(REUNION_TEXTS.calledIt)(prophet, pronouns(prophet));
    personalScores[prophet] += 1.0; popDelta(prophet, 1);
    timeline.push({ type: 'reunion', subtype: 'calledIt', phase: 3, player: prophet, players: [prophet], text, badgeText: 'CALLED IT', badgeClass: 'gold' });
  }

  // Breakdown player still carrying object (if fired)
  breakdowns.forEach(bd => {
    const grp = activePlayers.filter(p => p !== bd.player).slice(0, 3);
    const reacters = grp.filter(p => pStats(p).temperament + pStats(p).social >= 12);
    if (reacters.length > 0) {
      const watcher = reacters[0];
      const wPr = pronouns(watcher);
      const text = `${watcher} spots ${bd.player} still carrying ${bd.objectName}. ${wPr.Sub} ${wPr.sub==='they'?'decide':'decides'} not to comment. Everyone decides not to comment. They walk forward together.`;
      addBond(watcher, bd.player, 0.2);
      timeline.push({ type: 'reunion', subtype: 'coconutCarried', phase: 3, player: bd.player, players: [bd.player, watcher], text, badgeText: `${bd.objectName.toUpperCase()} LIVES`, badgeClass: 'yellow' });
    }
  });

  // ══ PHASE 4 — STORMING THE CAMP ══

  // Discovery beat — multi-stat composite (boldness + intuition + strategic); discoverer pre-computed in Phase 3
  const discText = _rp(STORM_TEXTS.discovery)(discoverer, pronouns(discoverer));
  personalScores[discoverer] += 0.7;
  cameraFlags.push({ player: discoverer, type: 'discovery', text: `${discoverer} spots the smoke first.`, reactionType: 'impressed' });
  timeline.push({ type: 'stormEvent', subtype: 'discovery', phase: 4, player: discoverer, players: [discoverer], text: discText, badgeText: 'SMOKE SPOTTED', badgeClass: 'gold' });

  // Navigator — high-intuition player routes the war party (not the discoverer)
  const navCandidates = activePlayers.filter(p => p !== discoverer && pStats(p).intuition >= 7);
  if (navCandidates.length > 0) {
    const nav = navCandidates.slice().sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
    const navPr = pronouns(nav);
    personalScores[nav] += 1.0; popDelta(nav, 1);
    timeline.push({ type: 'stormEvent', subtype: 'navigator', phase: 4, player: nav, players: [nav], text: `${nav} studies the terrain and routes the group through the blind spot in Chef's sightlines. ${navPr.Sub} ${navPr.sub==='they'?'have':'has'} been mapping this island since day one.`, badgeText: 'NAVIGATOR', badgeClass: 'blue' });
  }

  // Tactician — strategic player anticipated the whole thing
  const tacCandidates = activePlayers.filter(p => pStats(p).strategic >= 7);
  if (tacCandidates.length > 0 && Math.random() < 0.65) {
    const tac = _rp(tacCandidates);
    const tacPr = pronouns(tac);
    personalScores[tac] += 1.0;
    timeline.push({ type: 'stormEvent', subtype: 'tactician', phase: 4, player: tac, players: [tac], text: `${tac} had already figured out this was a challenge. The flood was too convenient. ${tacPr.Sub} ${tacPr.sub==='they'?'arrive':'arrives'} at the camp perimeter with a plan already in ${tacPr.posAdj} head.`, badgeText: 'TACTICIAN', badgeClass: 'purple' });
  }

  // The Charge — capped at +1.5 (was +2.0) to reduce boldness dominance
  activePlayers.forEach(name => {
    const s = pStats(name);
    if (s.boldness >= 7) {
      personalScores[name] += 1.5; popDelta(name, 1);
    } else if (s.boldness >= 4) {
      personalScores[name] += 0.5;
    }
  });
  const chargeLeaders = activePlayers.filter(p => pStats(p).boldness >= 7);
  if (chargeLeaders.length > 0) {
    const chargeText = warPaintFired
      ? `${chargeLeaders.join(', ')} ${chargeLeaders.length === 1 ? 'leads' : 'lead'} the charge through the jungle. The war paint was a good call.`
      : `${chargeLeaders.join(', ')} ${chargeLeaders.length === 1 ? 'leads' : 'lead'} the charge through the jungle — no paint, no warning, just speed and intent.`;
    timeline.push({ type: 'stormEvent', subtype: 'charge', phase: 4, players: chargeLeaders, text: chargeText, badgeText: 'THE CHARGE', badgeClass: 'red' });
  }

  // Negotiator — social player talks Chef down
  const negCandidates = activePlayers.filter(p => pStats(p).social >= 7);
  if (negCandidates.length > 0 && Math.random() < 0.60) {
    const neg = _rp(negCandidates);
    const negPr = pronouns(neg);
    personalScores[neg] += 1.0; popDelta(neg, 1);
    timeline.push({ type: 'stormEvent', subtype: 'negotiator', phase: 4, player: neg, players: [neg], text: `${neg} steps forward when Chef raises the spatula. "Hey. Let's talk about this." Chef lowers it. Everyone is surprised, especially ${neg}.`, badgeText: 'NEGOTIATOR', badgeClass: 'green' });
  }

  // Chef Scared
  if (chargeLeaders.length > 0) {
    const text = _rp(STORM_TEXTS.chefScared)(chargeLeaders[0], pronouns(chargeLeaders[0]));
    timeline.push({ type: 'stormEvent', subtype: 'chefScared', phase: 4, players: chargeLeaders, text, badgeText: 'CHEF INTIMIDATED', badgeClass: 'red' });
    timeline.push({ type: 'chrisReaction', phase: 4, reactionType: 'vindicated', text: _rp(CHRIS_REACTIONS.vindicated) });
  }

  // Chris Unbothered
  const chrisText = _rp(STORM_TEXTS.chrisUnbothered);
  timeline.push({ type: 'stormEvent', subtype: 'chrisUnbothered', phase: 4, players: activePlayers, text: chrisText, badgeText: 'CHRIS UNBOTHERED', badgeClass: 'grey' });

  // Player reactions to Chris
  activePlayers.forEach(name => {
    const s = pStats(name);
    if (s.temperament >= 7 && Math.random() < 0.5) {
      personalScores[name] -= 0.5; popDelta(name, 1);
      const text = `${name} confronts Chris directly. The dismissal stings. But the audience approves.`;
      timeline.push({ type: 'stormEvent', subtype: 'playerConfront', phase: 4, player: name, players: [name], text, badgeText: 'CONFRONTATION', badgeClass: 'yellow' });
    }
  });

  // Surveillance Playback (2-3 events from cameraFlags)
  const playbackCount = Math.min(cameraFlags.length, 2 + (Math.random() < 0.5 ? 1 : 0));
  const playbackFlags = [...cameraFlags].sort(() => Math.random() - 0.5).slice(0, playbackCount);
  // Prioritize breakdown — unshift instead of clobber slot-0
  const breakdownFlag = cameraFlags.find(f => f.type === 'breakdown');
  if (breakdownFlag && !playbackFlags.includes(breakdownFlag)) {
    playbackFlags.unshift(breakdownFlag);
    if (playbackFlags.length > playbackCount + 1) playbackFlags.pop();
  }
  playbackFlags.forEach(flag => {
    const subject = flag.player;
    const sPr = pronouns(subject);
    const playText = _rp(STORM_TEXTS.playback)(subject, sPr, flag.text);
    personalScores[subject] -= 0.5;
    if (flag.type === 'breakdown') personalScores[subject] -= 0.5;
    if (['wildlifeBrave', 'foodSuccess', 'treehouse', 'calledIt'].includes(flag.type)) {
      personalScores[subject] += 0.5;
    }
    // Store original event ref for VHS replay panel in VP — match by flag type
    const _flagTypeMap = {
      foodSuccess: 'foodFinding', foodMishap: 'foodFinding',
      treehouse: 'shelterBuild', shelterCollapse: 'shelterBuild',
      lost: 'gettingLost', raftCircles: 'escapeAttempt',
      wildlifeBrave: 'wildlife', wildlifePanic: 'wildlife',
      skullPanic: 'wildlife', mosquitoSuffering: 'wildlife',
      sleepTalkExposed: 'nightEvent', am2Breakfast: 'nightEvent', seagullChaos: 'nightEvent',
      confession: 'vulnerabilityConfession', climbSpot: 'escapeAttempt',
      pterodactylDelivered: 'crossEncounter',
      enemyProximity: 'forcedProximity',
      breakdown: 'breakdown',
    };
    const _matchType = _flagTypeMap[flag.type] || flag.type;
    const origEvent = flag.type === 'breakdown'
      ? timeline.find(e => e.type === 'breakdown' && e.player === subject)
      : timeline.find(e => e.type === _matchType && (e.player === subject || (e.players && e.players.includes(subject))) && e.phase < 4);
    timeline.push({ type: 'stormEvent', subtype: 'playback', phase: 4, player: subject, players: [subject], text: playText, badgeText: '▶ PLAYBACK', badgeClass: 'purple', isPlayback: true, flagType: flag.type, callbackType: flag.type, reactionType: flag.reactionType, origEventText: origEvent?.text || flag.text });
    timeline.push({ type: 'chrisReaction', phase: 4, reactionType: flag.reactionType, text: _rp(CHRIS_REACTIONS[flag.reactionType] || CHRIS_REACTIONS.entertained) });
  });

  // The Reveal — proportional: mental drives perception, intuition drives read speed; pop boost for high-mental (narrative only)
  const revealText = _rp(STORM_TEXTS.reveal);
  timeline.push({ type: 'stormEvent', subtype: 'reveal', phase: 4, players: activePlayers, text: revealText, badgeText: 'THE REVEAL', badgeClass: 'gold' });
  activePlayers.forEach(name => {
    const s = pStats(name);
    personalScores[name] += s.mental * 0.10 + s.intuition * 0.03;
    if (s.mental >= 7) popDelta(name, 1);
  });

  // Finisher — proportional endurance bonus for all; narrative card for notable finishers (threshold OK for text)
  activePlayers.forEach(name => { personalScores[name] += pStats(name).endurance * 0.08; });
  const finishers = activePlayers.filter(n => pStats(n).endurance >= 7);
  if (finishers.length === 1) {
    timeline.push({ type: 'stormEvent', subtype: 'enduranceBonus', phase: 4, player: finishers[0], players: finishers, text: `Chris grudgingly notes ${finishers[0]}'s consistent performance. "Fine. You earned it."`, badgeText: 'ENDURANCE BONUS', badgeClass: 'green' });
  } else if (finishers.length > 1) {
    const names = finishers.length === 2 ? finishers.join(' and ') : finishers.slice(0, -1).join(', ') + ', and ' + finishers[finishers.length - 1];
    timeline.push({ type: 'stormEvent', subtype: 'enduranceBonus', phase: 4, players: finishers, text: `Chris reluctantly nods at ${names}. "You kept pace. All of you. Don't make it weird."`, badgeText: 'ENDURANCE BONUS', badgeClass: 'green' });
  }

  // ══ RESOLUTION ══
  const sorted = [...activePlayers].sort((a, b) => {
    const diff = personalScores[b] - personalScores[a];
    if (Math.abs(diff) > 0.01) return diff;
    const sBold = pStats(b).boldness - pStats(a).boldness;
    if (sBold !== 0) return sBold;
    return pStats(b).mental - pStats(a).mental;
  });

  const immunityWinner = sorted[0];
  const lowestScorer = sorted[sorted.length - 1];

  popDelta(immunityWinner, 2);
  // phase: 5 keeps this out of _buildStormScreen (phase===4 filter) — Immunity screen reads it directly
  timeline.push({ type: 'immunityReveal', phase: 5, player: immunityWinner, score: personalScores[immunityWinner], players: activePlayers, text: `${immunityWinner} outlasted, outsmarted, and out-survived them all. Individual immunity goes to ${immunityWinner}.`, badgeText: '🏆 IMMUNITY', badgeClass: 'gold' });

  // ══ EP FIELDS ══
  ep.challengeType = 'individual';
  ep.challengeLabel = 'Camp Castaways';
  ep.challengeCategory = 'survival';
  ep.challengeDesc = 'Survive the night on a deserted island. Best survivor wins immunity.';
  ep.isCampCastaways = true;
  ep.immunityWinner = immunityWinner;
  ep.tribalPlayers = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);

  ep.chalMemberScores = { ...personalScores };
  updateChalRecord(ep);

  ep.challengePlacements = sorted.map((name, i) => ({ name, place: i + 1, score: personalScores[name] }));

  ep.campCastaways = {
    timeline,
    groups: groups.map((g, i) => ({ label: groupLabels[i], members: [...g] })),
    personalScores: { ...personalScores },
    immunityWinner,
    lowestScorer,
    breakdowns: breakdowns.filter(Boolean),
    cameraFlags: [...cameraFlags],
  };
  ep.castawaysGroups = groups.map((g, i) => ({ label: groupLabels[i], members: [...g] }));
  ep.castawaysBreakdowns = breakdowns.filter(Boolean);

  // ══ CAMP EVENTS ══
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };

  // SURVIVOR: top scorer
  const winPr = pronouns(immunityWinner);
  ep.campEvents[campKey].post.push({
    type: 'cc-survivor',
    text: `${immunityWinner} made it through everything — the flood, the night, the chaos — and came out on top. The others notice. ${winPr.Sub} ${winPr.sub==='they'?'notice':'notices'} them noticing.`,
    players: [immunityWinner], badgeText: 'SURVIVOR', badgeClass: 'green',
  });

  // THE BREAKDOWN (if fired)
  breakdowns.filter(Boolean).forEach(bd => {
    const bdPr = pronouns(bd.player);
    ep.campEvents[campKey].post.push({
      type: 'cc-breakdown-aftermath',
      text: `${bd.player} still has ${bd.objectName}. Nobody has technically said anything about it. The silence is polite, fragile, and probably temporary.`,
      players: [bd.player], badgeText: `${bd.objectName.toUpperCase()} LIVES`, badgeClass: 'yellow',
    });
  });

  // THE DISASTER: lowest scorer
  const losPr = pronouns(lowestScorer);
  if (lowestScorer !== immunityWinner) {
    ep.campEvents[campKey].post.push({
      type: 'cc-disaster',
      text: `${lowestScorer} had a rough twenty-four hours. The kind of rough that doesn't wash off when the flood does. ${losPr.Sub} ${losPr.sub==='they'?'are':'is'} on the board.`,
      players: [lowestScorer], badgeText: 'LOWEST SCORER', badgeClass: 'red',
    });
    gs._castawaysHeat = gs._castawaysHeat || [];
    gs._castawaysHeat.push({ target: lowestScorer, amount: 0.5, expiresEp: (gs.episode || 1) + 1 });
  }

  // UNEXPECTED BOND: biggest bond gain
  let bestBondPair = null, bestBondGain = -99;
  for (let i = 0; i < activePlayers.length; i++) {
    for (let j = i + 1; j < activePlayers.length; j++) {
      const cur = getBond(activePlayers[i], activePlayers[j]);
      if (cur > bestBondGain && cur > 0) { bestBondGain = cur; bestBondPair = [activePlayers[i], activePlayers[j]]; }
    }
  }
  if (bestBondPair) {
    ep.campEvents[campKey].post.push({
      type: 'cc-unexpected-bond',
      text: `Nobody saw ${bestBondPair[0]} and ${bestBondPair[1]} coming. They were in the same group. The island did something to them. The question is: is it an alliance, a friendship, or something else?`,
      players: bestBondPair, badgeText: 'UNEXPECTED BOND', badgeClass: 'blue',
    });
  }

  // Heat
  gs._castawaysHeat = gs._castawaysHeat || [];

  // Romance
  _checkShowmanceChalMoment(ep, activePlayers);
}

// ══════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════
export function _textCampCastaways(ep, ln, sec) {
  if (!ep.isCampCastaways || !ep.campCastaways) return;
  const cc = ep.campCastaways;
  sec('CAMP CASTAWAYS');
  ln('A flash flood scatters the camp. Personal scores determine individual immunity.');
  ln('');

  ln('GROUPS:');
  cc.groups.forEach(g => { ln(`  Group ${g.label}: ${g.members.join(', ')}`); });
  ln('');

  ln('PERSONAL SCORES:');
  const sorted = Object.entries(cc.personalScores).sort(([, a], [, b]) => b - a);
  sorted.forEach(([name, score]) => {
    const tag = name === cc.immunityWinner ? ' ★ IMMUNE' : name === cc.lowestScorer ? ' ⚠ LOWEST' : '';
    ln(`  ${name}: ${score.toFixed(1)}${tag}`);
  });
  ln('');

  if (cc.breakdowns?.length) {
    ln('MR. COCONUT BREAKDOWN:');
    cc.breakdowns.forEach(b => { ln(`  ${b.player} bonded with ${b.objectName} (${b.object})`); });
    ln('');
  }

  ln(`CAMERA FLAGS: ${cc.cameraFlags?.length || 0} events flagged by Chris`);
  ln('');

  ln('TIMELINE:');
  cc.timeline.forEach(evt => {
    const phaseTag = evt.phase !== undefined ? `P${evt.phase}` : '';
    const groupTag = evt.group ? ` G${evt.group}` : '';
    ln(`  [${phaseTag}${groupTag} ${(evt.type || '').toUpperCase()}${evt.subtype ? '/' + evt.subtype.toUpperCase() : ''}] ${evt.text || ''}`);
  });
  ln('');

  ln(`IMMUNITY: ${cc.immunityWinner || 'None'}`);
  ln(`LOWEST SCORER: ${cc.lowestScorer || 'None'}`);
}

// ══════════════════════════════════════════════════════
// VP SCREEN BUILDER
// ══════════════════════════════════════════════════════

// _tvState is shared with vp-screens.js via window._tvState (set by main.js)
// Each builder accesses it as a local alias: const _tvState = window._tvState;
// DO NOT declare a module-scoped _tvState here — it would shadow the shared one.

// ══ CAMP CASTAWAYS — DRIFTWOOD SHORE VP ══

/* ---------- CSS: Driftwood Shore theme ---------- */
const CC_SHORE_STYLES = `
<style>
/* ── Phase sky palettes ── */
.cc-shore { --sky-top:#87CEEB; --sky-mid:#B0E0E6; --ocean:#1E90FF; --ocean-foam:#E0F7FA;
  --wet-sand:#C2B280; --sand:#D2B48C; --sand-deep:#A0855B;
  --artifact-bg:#FFF8E7; --artifact-border:#8B7355; --artifact-shadow:rgba(0,0,0,.18);
  --driftwood:#6B4226; --driftwood-light:#8B6914; --palm:#228B22;
  --coconut-brown:#5C3317; --coconut-face:#2F1A0A; --shell-pink:#FFB6C1;
  --conch:#E8A87C; --conch-dark:#C4764E; --sos-red:#DC143C;
  --night-sky:#0B1026; --night-mid:#1A1A3E; --star:#FFD700;
  --storm-sky:#2C2C54; --storm-mid:#3D3D6B; --lightning:#FFF44F;
  font-family: 'Georgia', 'Times New Roman', serif; font-display: swap; }

.cc-shore[data-phase="flood"]  { --sky-top:#4A90D9; --sky-mid:#6BB3E0; }
.cc-shore[data-phase="group"]  { --sky-top:#87CEEB; --sky-mid:#B0E0E6; }
.cc-shore[data-phase="night"]  { --sky-top:var(--night-sky); --sky-mid:var(--night-mid);
  --ocean:#0A1628; --ocean-foam:#1A2A4A; --sand:#3A3520; --wet-sand:#2A2818; }
.cc-shore[data-phase="regroup"]{ --sky-top:#FFA07A; --sky-mid:#FFD700; --ocean:#2980B9; }
.cc-shore[data-phase="storm"]  { --sky-top:var(--storm-sky); --sky-mid:var(--storm-mid);
  --ocean:#1A1A3E; --ocean-foam:#2C2C54; }
.cc-shore[data-phase="immunity"]{ --sky-top:#FF6347; --sky-mid:#FF8C00; --ocean:#FF4500; --ocean-foam:#FFB347; }

/* ── Beach scene ── */
.cc-shore-scene { position:relative; min-height:100vh; overflow-x:hidden;
  background: linear-gradient(180deg, var(--sky-top) 0%, var(--sky-mid) 30%, var(--ocean) 50%,
    var(--ocean-foam) 55%, var(--wet-sand) 60%, var(--sand) 75%, var(--sand-deep) 100%);
  transition: background 0.8s ease; padding-bottom:2rem; }

/* Ocean wave animation */
.cc-shore-scene::before { content:''; position:absolute; top:48%; left:0; right:0; height:8%;
  background: repeating-linear-gradient(90deg, transparent 0%, var(--ocean-foam) 25%,
    transparent 50%); opacity:0.4; animation: cc-wave 4s ease-in-out infinite; }

@keyframes cc-wave { 0%,100%{transform:translateX(-5%)} 50%{transform:translateX(5%)} }

/* Sand drift */
.cc-shore-scene::after { content:''; position:absolute; bottom:0; left:0; right:0; height:25%;
  background: radial-gradient(ellipse at 30% 80%, rgba(210,180,140,0.3) 0%, transparent 60%),
    radial-gradient(ellipse at 70% 90%, rgba(210,180,140,0.2) 0%, transparent 50%);
  animation: cc-sand-drift 6s ease-in-out infinite alternate; pointer-events:none; }

@keyframes cc-sand-drift { 0%{opacity:0.6} 100%{opacity:1} }

/* ── Torn-paper artifact (diary / surveillance / general) ── */
.cc-artifact { position:relative; z-index:1; background:var(--artifact-bg);
  border:1px solid var(--artifact-border); border-radius:2px;
  padding:1.2rem 1.4rem; margin:0.8rem auto; max-width:600px;
  box-shadow:3px 4px 8px var(--artifact-shadow);
  transform:rotate(calc(var(--tilt,0) * 1deg)); transition:transform 0.3s ease; }
.cc-artifact::before { content:''; position:absolute; top:-4px; left:10%; right:15%;
  height:6px; background:linear-gradient(90deg, transparent 0%, var(--artifact-bg) 20%,
    var(--artifact-bg) 80%, transparent 100%);
  clip-path:polygon(0 100%, 5% 0, 12% 100%, 18% 20%, 25% 100%, 33% 0, 40% 100%,
    48% 30%, 55% 100%, 62% 0, 70% 100%, 78% 20%, 85% 100%, 92% 0, 100% 100%); }

.cc-artifact .cc-wax-seal { position:absolute; top:-10px; right:16px; width:32px; height:32px;
  background:radial-gradient(circle, #8B0000 60%, #5C0000 100%); border-radius:50%;
  display:flex; align-items:center; justify-content:center; color:#FFD700; font-size:14px;
  font-weight:bold; box-shadow:1px 2px 4px rgba(0,0,0,0.3); }

.cc-artifact .cc-tape-num { font-size:0.75rem; color:#8B7355; font-style:italic;
  margin-bottom:0.3rem; }
.cc-artifact .cc-artifact-title { font-size:1rem; font-weight:bold; margin-bottom:0.6rem;
  border-bottom:1px dashed #8B7355; padding-bottom:0.3rem; }
.cc-artifact .cc-artifact-body { font-size:0.9rem; line-height:1.5; color:#3E2723; }
.cc-artifact .cc-artifact-body p { margin:0.4rem 0; }

/* ── Palm-cam surveillance card ── */
.cc-palm-cam { position:relative; z-index:1; background:rgba(0,0,0,0.85); color:#00FF41;
  font-family:'Courier New',monospace; border:2px solid #228B22;
  border-radius:8px; padding:1rem 1.2rem; margin:0.8rem auto; max-width:600px;
  box-shadow:0 0 12px rgba(34,139,34,0.3); }
.cc-palm-cam .cc-cam-header { display:flex; justify-content:space-between; align-items:center;
  font-size:0.75rem; opacity:0.7; margin-bottom:0.5rem; border-bottom:1px solid #228B22;
  padding-bottom:0.3rem; }
.cc-palm-cam .cc-cam-body { font-size:0.85rem; line-height:1.5; }
.cc-palm-cam .cc-cam-body p { margin:0.3rem 0; }

/* ── Coconut breakdown card ── */
.cc-coconut-card { position:relative; z-index:1; background:var(--sand);
  border:3px solid var(--coconut-brown); border-radius:50% 50% 8px 8px;
  padding:2rem 1.4rem 1.2rem; margin:1rem auto; max-width:500px; text-align:center;
  box-shadow:4px 6px 12px rgba(0,0,0,0.25); }
.cc-coconut-card .cc-coconut-face { font-size:2.5rem; margin-bottom:0.5rem; }
.cc-coconut-card .cc-coconut-says { font-style:italic; color:var(--coconut-face);
  font-size:0.95rem; line-height:1.4; position:relative; padding:0.8rem;
  background:rgba(255,255,255,0.6); border-radius:8px; margin-top:0.5rem; }

/* ── Signal / broadcast card ── */
.cc-signal-card { position:relative; z-index:1; background:linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color:#E0E0E0; border:2px solid #0F3460; border-radius:4px;
  padding:1rem 1.2rem; margin:0.8rem auto; max-width:600px;
  box-shadow:0 0 8px rgba(15,52,96,0.4); }
.cc-signal-card .cc-signal-header { display:flex; align-items:center; gap:0.5rem;
  font-size:0.8rem; color:#E94560; font-weight:bold; margin-bottom:0.5rem;
  border-bottom:1px solid #0F3460; padding-bottom:0.3rem; }
.cc-signal-card .cc-signal-body { font-size:0.9rem; line-height:1.5; }
.cc-signal-card .cc-signal-body p { margin:0.3rem 0; }

/* ── Conch shell next/reveal buttons ── */
.cc-conch-next { display:inline-flex; align-items:center; gap:0.4rem; cursor:pointer;
  background:linear-gradient(135deg, var(--conch) 0%, var(--conch-dark) 100%);
  color:#FFF; border:none; border-radius:20px; padding:0.5rem 1.2rem;
  font-family:inherit; font-size:0.85rem; font-weight:bold;
  box-shadow:2px 3px 6px rgba(0,0,0,0.25); transition:transform 0.2s, box-shadow 0.2s;
  margin:0.6rem auto; }
.cc-conch-next:hover { transform:scale(1.05); box-shadow:3px 4px 8px rgba(0,0,0,0.3); }

.cc-conch-reveal-all { display:block; text-align:center; cursor:pointer;
  font-size:0.7rem; color:#8B7355; letter-spacing:1px; padding:0.3rem 0.8rem;
  margin:0.2rem auto 0.6rem; opacity:0.6; transition:opacity 0.2s; }
.cc-conch-reveal-all:hover { opacity:1; color:var(--conch-dark); }

/* ── Sand-write immunity ── */
.cc-sand-write { position:relative; z-index:1; text-align:center; padding:2rem;
  margin:1rem auto; max-width:600px; }
.cc-sand-write .cc-sos-rocks { font-size:2rem; font-weight:bold; color:var(--sos-red);
  text-shadow:2px 2px 4px rgba(0,0,0,0.3); letter-spacing:0.5rem; margin-bottom:1rem; }
.cc-sand-write .cc-sand-name { font-size:1.8rem; font-style:italic;
  color:var(--sand-deep); text-shadow:1px 1px 2px rgba(0,0,0,0.2);
  font-family:'Georgia',serif; }
.cc-sand-write .cc-sand-name.reveal-pending { filter:blur(8px); cursor:pointer;
  transition:filter 0.5s ease; }
.cc-sand-write .cc-sand-name.revealed { filter:none; }

/* ── Night stars ── */
.cc-night-stars { position:absolute; top:0; left:0; right:0; height:50%; z-index:0; pointer-events:none; }
.cc-night-stars .cc-star { position:absolute; width:3px; height:3px; background:var(--star);
  border-radius:50%; animation:cc-twinkle 2s ease-in-out infinite; }
@keyframes cc-twinkle { 0%,100%{opacity:0.3} 50%{opacity:1} }

/* ── Storm lightning ── */
.cc-lightning-overlay { position:absolute; inset:0; z-index:0; pointer-events:none;
  animation:cc-lightning 5s ease-in-out infinite; }
@keyframes cc-lightning { 0%,90%,100%{background:transparent} 92%{background:rgba(255,244,79,0.15)} 94%{background:transparent} 96%{background:rgba(255,244,79,0.1)} }

/* ── Portrait in artifact ── */
.cc-artifact .rp-portrait-wrap { display:inline-block; margin:0.3rem 0.5rem 0.3rem 0;
  border:3px solid #FFF; box-shadow:2px 2px 6px rgba(0,0,0,0.2); transform:rotate(-2deg);
  background:#FFF; padding:3px; }

/* ── Section header on sand ── */
.cc-shore-header { position:relative; z-index:1; text-align:center; padding:0.8rem;
  font-size:1.2rem; font-weight:bold; color:var(--driftwood);
  text-shadow:1px 1px 2px rgba(255,248,231,0.8); }

/* ── All-revealed footer ── */
.cc-shore-done { position:relative; z-index:1; text-align:center; padding:1rem;
  font-style:italic; color:var(--driftwood); opacity:0.7; font-size:0.85rem; }

/* ── Responsive ── */
@media(max-width:640px) {
  .cc-artifact, .cc-palm-cam, .cc-coconut-card, .cc-signal-card { margin:0.5rem 0.3rem; padding:0.8rem; }
  .cc-shore-header { font-size:1rem; }
  .cc-sand-write .cc-sos-rocks { font-size:1.4rem; }
  .cc-sand-write .cc-sand-name { font-size:1.3rem; }
}

/* ── Reduced motion ── */
@media(prefers-reduced-motion:reduce) {
  .cc-shore-scene::before, .cc-shore-scene::after { animation:none !important; }
  .cc-night-stars .cc-star { animation:none !important; opacity:0.6; }
  .cc-lightning-overlay { animation:none !important; }
  .cc-sand-write .cc-sand-name.reveal-pending { filter:none; opacity:0.3; }
  .cc-sand-write .cc-sand-name.revealed { opacity:1; transition:opacity 0.1s; }
  .cc-artifact, .cc-conch-next { transition:none !important; }
}
</style>`;

/* ---------- Helpers ---------- */

/** Night stars (absolute positioned in scene) */
function _nightStars(count = 30) {
  let stars = '';
  for (let i = 0; i < count; i++) {
    const x = Math.random() * 100;
    const y = Math.random() * 45;
    const delay = (Math.random() * 3).toFixed(1);
    const size = 2 + Math.random() * 2;
    stars += `<div class="cc-star" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;animation-delay:${delay}s"></div>`;
  }
  return `<div class="cc-night-stars">${stars}</div>`;
}

/** Torn-paper artifact card */
function _shoreArtifact(title, bodyHtml, opts = {}) {
  const tilt = opts.tilt ?? (Math.random() * 4 - 2).toFixed(1);
  const tapeNum = opts.tapeNum ? `<div class="cc-tape-num">Tape ${opts.tapeNum}</div>` : '';
  const seal = opts.seal ? `<div class="cc-wax-seal">${opts.seal}</div>` : '';
  return `<div class="cc-artifact" style="--tilt:${tilt}">
    ${seal}${tapeNum}
    <div class="cc-artifact-title">${title}</div>
    <div class="cc-artifact-body">${bodyHtml}</div>
  </div>`;
}

/** Coconut breakdown card */
function _shoreBreakdown(faceEmoji, dialogue) {
  return `<div class="cc-coconut-card">
    <div class="cc-coconut-face">${faceEmoji || '\u{1F965}'}</div>
    <div class="cc-coconut-says">${dialogue}</div>
  </div>`;
}

/** Palm-cam surveillance card */
function _shoreSurveillance(headerLeft, headerRight, bodyHtml) {
  return `<div class="cc-palm-cam">
    <div class="cc-cam-header"><span>${headerLeft}</span><span>${headerRight}</span></div>
    <div class="cc-cam-body">${bodyHtml}</div>
  </div>`;
}

/** Signal broadcast card */
function _shoreBroadcast(headerText, bodyHtml) {
  return `<div class="cc-signal-card">
    <div class="cc-signal-header">${headerText}</div>
    <div class="cc-signal-body">${bodyHtml}</div>
  </div>`;
}

/** Flood timestamp helper */
function _floodTs(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── CLICK-TO-REVEAL — inline onclick (Lucky Hunt pattern) ──
function _ccInlineReveal(stateKey, targetIdx, screenId, epNum) {
  return `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};` +
    `_tvState['${stateKey}'].idx=${targetIdx};` +
    `(function(){` +
      `var ep=gs.episodeHistory.find(function(e){return e.num===${epNum}});` +
      `if(ep){var m=document.querySelector('.rp-main');var st=m?m.scrollTop:0;` +
      `buildVPScreens(ep);` +
      `var ss=vpScreens||[];var si=ss.findIndex(function(s){return s.id==='${screenId}'});` +
      `if(si>=0){vpCurrentScreen=si;}renderVPScreen();` +
      `var m2=document.querySelector('.rp-main');if(m2)m2.scrollTop=st;}` +
    `})()`;
}

/** Conch-themed next + reveal-all buttons */
function _shoreNextBtns(stateKey, nextIdx, totalLen, screenId, epNum) {
  let html = '';
  html += `<div style="text-align:center;position:relative;z-index:1">`;
  html += `<div class="cc-conch-next" onclick="${_ccInlineReveal(stateKey, nextIdx, screenId, epNum)}">\u{1F41A} Next</div>`;
  html += `<div class="cc-conch-reveal-all" onclick="${_ccInlineReveal(stateKey, totalLen - 1, screenId, epNum)}">\u{1F50E} Reveal all</div>`;
  html += `</div>`;
  return html;
}

/* ---------- Screen Builders ---------- */

/** Map a timeline event to a shore-themed card */
function _eventToCard(evt, opts = {}) {
  const badge = evt.badgeText ? `<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:0.75rem;font-weight:bold;background:${
    evt.badgeClass === 'gold' ? '#FFD700' : evt.badgeClass === 'green' ? '#4CAF50' :
    evt.badgeClass === 'red' ? '#E53935' : evt.badgeClass === 'blue' ? '#2196F3' :
    evt.badgeClass === 'purple' ? '#9C27B0' : evt.badgeClass === 'yellow' ? '#FFC107' : '#888'
  };color:${evt.badgeClass === 'gold' || evt.badgeClass === 'yellow' ? '#333' : '#fff'};margin-bottom:6px">${evt.badgeText}</span>` : '';

  const portrait = evt.player && typeof window.rpPortrait === 'function' ? window.rpPortrait(evt.player, 40) : '';
  const body = `${badge}<div style="display:flex;gap:0.6rem;align-items:flex-start;margin-top:4px">${portrait}<div><p>${evt.text || ''}</p></div></div>`;

  // Chris quotes → surveillance card
  if (evt.type === 'chrisAnnounce' || evt.type === 'chrisReaction') {
    return _shoreSurveillance('PALM CAM \u2014 CHRIS', opts.timestamp || '', body);
  }
  // Breakdowns → coconut card
  if (evt.type === 'breakdown') {
    const face = evt.subtype === 'breakingPoint' ? '\u{1F62D}' :
                 evt.subtype === 'introduction' ? '\u{1F965}' :
                 evt.subtype === 'conversation' ? '\u{1F917}' : '\u{1F440}';
    return _shoreBreakdown(face, `${badge}<p>${evt.text || ''}</p>`);
  }
  // Confessionals → journal artifact
  if (evt.type === 'confessional') {
    return _shoreArtifact(
      `\u{1F4DD} ${evt.player || 'Unknown'}'s Journal`,
      body,
      { seal: '\u2709', tilt: (Math.random() * 3 - 1.5).toFixed(1) }
    );
  }
  // Camera playback → surveillance
  if (evt.isPlayback) {
    return _shoreSurveillance('PALM CAM \u2014 PLAYBACK', opts.timestamp || '', body);
  }
  // Immunity reveal → broadcast
  if (evt.type === 'immunityReveal') {
    return _shoreBroadcast('\u{1F3C6} IMMUNITY WINNER', body);
  }
  // Default → torn-paper artifact
  const title = evt.badgeText || opts.title || 'Shore Log';
  return _shoreArtifact(title, body, { tilt: (Math.random() * 4 - 2).toFixed(1), ...opts });
}

/** Standard reveal loop: items array + _tvState gate */
function _revealLoop(items, st, stateKey, screenId, epNum) {
  let html = '';
  items.forEach((card, i) => {
    if (i > st.idx + 1) return;
    if (i <= st.idx) {
      html += card;
    } else if (i === st.idx + 1) {
      html += card;
      if (i < items.length - 1) {
        html += _shoreNextBtns(stateKey, i + 1, items.length, screenId, epNum);
      }
    }
  });
  return html;
}

function _buildColdOpen(ep, stateKey, screenId) {
  const _tvState = window._tvState;
  const cc = ep.campCastaways;
  if (!cc || !cc.timeline) return '';
  const epNum = ep.num || 0;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];

  const events = cc.timeline.filter(e => e.phase === 0);
  const items = events.map((evt, i) => _eventToCard(evt, { timestamp: _floodTs(i * 3) }));

  let html = _revealLoop(items, st, stateKey, screenId, epNum);

  if (st.idx >= items.length - 1 && items.length > 0) {
    html += `<div class="cc-shore-done">\u{1F30A} All flood logs recovered.</div>`;
  }
  return html;
}

function _buildGroupScreen(ep, groupIdx, stateKey, screenId) {
  const _tvState = window._tvState;
  const cc = ep.campCastaways;
  if (!cc || !cc.groups || !cc.groups[groupIdx]) return '';
  const grp = cc.groups[groupIdx];
  const label = grp.label || `Group ${groupIdx + 1}`;
  const epNum = ep.num || 0;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];

  // Members card (always visible)
  let membersCard = '';
  if (grp.members && grp.members.length) {
    const mHtml = grp.members.map(m => {
      const port = typeof window.rpPortrait === 'function' ? window.rpPortrait(m, 36) : '';
      return `<span style="display:inline-flex;align-items:center;gap:3px;margin:2px 4px">${port}${m}</span>`;
    }).join('');
    membersCard = _shoreArtifact(`${label} \u2014 Members`, mHtml, { tilt: 0.8 });
  }

  const events = (cc.timeline || []).filter(e => e.phase === 1 && e.group === label);
  const items = events.map(evt => _eventToCard(evt));

  let html = `<div class="cc-shore-header">\u{1F334} ${label}</div>`;
  html += membersCard;
  html += _revealLoop(items, st, stateKey, screenId, epNum);

  if (st.idx >= items.length - 1 && items.length > 0) {
    html += `<div class="cc-shore-done">\u{1F334} All group logs recovered.</div>`;
  }
  return html;
}

function _buildNightScreen(ep, stateKey, screenId) {
  const _tvState = window._tvState;
  const cc = ep.campCastaways;
  if (!cc) return '';
  const epNum = ep.num || 0;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];

  const events = (cc.timeline || []).filter(e => e.phase === 2);
  const items = events.map(evt => _eventToCard(evt));

  let html = _nightStars(35);
  html += `<div class="cc-shore-header">\u{1F319} Night Falls</div>`;
  html += _revealLoop(items, st, stateKey, screenId, epNum);

  if (st.idx >= items.length - 1 && items.length > 0) {
    html += `<div class="cc-shore-done">\u{1F319} The night passes.</div>`;
  }
  return html;
}

function _buildRegroupScreen(ep, stateKey, screenId) {
  const _tvState = window._tvState;
  const cc = ep.campCastaways;
  if (!cc) return '';
  const epNum = ep.num || 0;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];

  const events = (cc.timeline || []).filter(e => e.phase === 3);
  const items = events.map(evt => _eventToCard(evt));

  let html = `<div class="cc-shore-header">\u{1F305} Regroup at Dawn</div>`;
  html += _revealLoop(items, st, stateKey, screenId, epNum);

  if (st.idx >= items.length - 1 && items.length > 0) {
    html += `<div class="cc-shore-done">\u{1F305} Camp reassembled.</div>`;
  }
  return html;
}

function _buildStormScreen(ep, stateKey, screenId) {
  const _tvState = window._tvState;
  const cc = ep.campCastaways;
  if (!cc) return '';
  const epNum = ep.num || 0;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];

  const events = (cc.timeline || []).filter(e => e.phase === 4 && e.type !== 'immunityReveal');
  const items = events.map(evt => _eventToCard(evt));

  let html = `<div class="cc-lightning-overlay"></div>`;
  html += `<div class="cc-shore-header">\u26A1 The Storm</div>`;
  html += _revealLoop(items, st, stateKey, screenId, epNum);

  if (st.idx >= items.length - 1 && items.length > 0) {
    html += `<div class="cc-shore-done">\u26A1 The storm passes.</div>`;
  }
  return html;
}

function _buildImmunityScreen(ep, stateKey, screenId) {
  const _tvState = window._tvState;
  const cc = ep.campCastaways;
  if (!cc) return '';
  const epNum = ep.num || 0;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];

  const items = [];

  // Build score entries from personalScores (sorted ascending — worst to best)
  if (cc.personalScores) {
    const sorted = Object.entries(cc.personalScores)
      .map(([name, score]) => ({ name, score, isWinner: name === cc.immunityWinner }))
      .sort((a, b) => a.score - b.score);
    sorted.forEach((entry, i) => {
      const port = typeof window.rpPortrait === 'function' ? window.rpPortrait(entry.name, 48) : '';
      const badge = entry.isWinner
        ? `<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:0.75rem;font-weight:bold;background:#FFD700;color:#333;margin-bottom:6px">\u{1F3C6} IMMUNE</span>`
        : `<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:0.75rem;font-weight:bold;background:#888;color:#fff;margin-bottom:6px">RANK #${sorted.length - i}</span>`;
      const title = entry.isWinner ? `\u{1F3C6} ${entry.name} \u2014 IMMUNITY` : entry.name;
      items.push(_shoreArtifact(title,
        `${badge}<div style="display:flex;gap:0.8rem;align-items:center;margin-top:4px">${port}<div>` +
        `<p><b>Score:</b> ${typeof entry.score === 'number' ? entry.score.toFixed(1) : entry.score}</p>` +
        `</div></div>`,
        { seal: entry.isWinner ? '\u{1F3C6}' : null, tilt: entry.isWinner ? 0 : (Math.random() * 2 - 1).toFixed(1) }
      ));
    });
  }

  // Immunity reveal event from timeline (if present)
  const revealEvt = (cc.timeline || []).find(e => e.type === 'immunityReveal');
  if (revealEvt) {
    items.push(_eventToCard(revealEvt));
  }

  // Fallback: just show winner as SOS rocks
  if (items.length === 0 && cc.immunityWinner) {
    const port = typeof window.rpPortrait === 'function' ? window.rpPortrait(cc.immunityWinner, 64) : '';
    items.push(`<div class="cc-sand-write">
      <div class="cc-sos-rocks">S \u00B7 O \u00B7 S</div>
      ${port}
      <div class="cc-sand-name revealed">${cc.immunityWinner}</div>
    </div>`);
  }

  let html = `<div class="cc-shore-header">\u{1F3C6} Immunity</div>`;
  html += _revealLoop(items, st, stateKey, screenId, epNum);

  if (st.idx >= items.length - 1 && items.length > 0) {
    html += `<div class="cc-shore-done">\u{1F3C6} Immunity decided.</div>`;
  }
  return html;
}

/* ---------- Exports (rpBuildCC*) ---------- */

function rpBuildCCFlood(ep) {
  const cc = ep.campCastaways;
  if (!cc) return null;
  const epNum = ep.num || 0;
  const stateKey = `cc_cold_${epNum}`;
  const screenId = 'cc-flood';
  const inner = _buildColdOpen(ep, stateKey, screenId);
  if (!inner) return null;
  return CC_SHORE_STYLES + `<div class="cc-shore" data-phase="flood"><div class="cc-shore-scene">${inner}</div></div>`;
}

function rpBuildCCGroup(ep, groupObj) {
  const cc = ep.campCastaways;
  if (!cc || !cc.groups) return null;
  const groupIdx = cc.groups.indexOf(groupObj);
  if (groupIdx < 0) return null;
  const grp = groupObj;
  const label = grp.label || grp.name || `Group ${groupIdx + 1}`;
  const epNum = ep.num || 0;
  const screenId = `cc-group-${label}`;
  const stateKey = `cc_group_${groupIdx}_${epNum}`;
  const inner = _buildGroupScreen(ep, groupIdx, stateKey, screenId);
  if (!inner) return null;
  return CC_SHORE_STYLES + `<div class="cc-shore" data-phase="group"><div class="cc-shore-scene">${inner}</div></div>`;
}

function rpBuildCCNight(ep) {
  const cc = ep.campCastaways;
  if (!cc) return null;
  const epNum = ep.num || 0;
  const stateKey = `cc_night_${epNum}`;
  const screenId = 'cc-night';
  const inner = _buildNightScreen(ep, stateKey, screenId);
  if (!inner) return null;
  return CC_SHORE_STYLES + `<div class="cc-shore" data-phase="night"><div class="cc-shore-scene">${inner}</div></div>`;
}

function rpBuildCCRegroup(ep) {
  const cc = ep.campCastaways;
  if (!cc) return null;
  const epNum = ep.num || 0;
  const stateKey = `cc_regroup_${epNum}`;
  const screenId = 'cc-regroup';
  const inner = _buildRegroupScreen(ep, stateKey, screenId);
  if (!inner) return null;
  return CC_SHORE_STYLES + `<div class="cc-shore" data-phase="regroup"><div class="cc-shore-scene">${inner}</div></div>`;
}

function rpBuildCCStorm(ep) {
  const cc = ep.campCastaways;
  if (!cc) return null;
  const epNum = ep.num || 0;
  const stateKey = `cc_storm_${epNum}`;
  const screenId = 'cc-storm';
  const inner = _buildStormScreen(ep, stateKey, screenId);
  if (!inner) return null;
  return CC_SHORE_STYLES + `<div class="cc-shore" data-phase="storm"><div class="cc-shore-scene">${inner}</div></div>`;
}

function rpBuildCCImmunity(ep) {
  const cc = ep.campCastaways;
  if (!cc) return null;
  const epNum = ep.num || 0;
  const stateKey = `cc_immunity_${epNum}`;
  const screenId = 'cc-immunity';
  const inner = _buildImmunityScreen(ep, stateKey, screenId);
  if (!inner) return null;
  return CC_SHORE_STYLES + `<div class="cc-shore" data-phase="immunity"><div class="cc-shore-scene">${inner}</div></div>`;
}

function rpBuildCampCastaways(ep) {
  return rpBuildCCFlood(ep);
}

export { rpBuildCCFlood, rpBuildCCGroup, rpBuildCCNight, rpBuildCCRegroup, rpBuildCCStorm, rpBuildCCImmunity, rpBuildCampCastaways };
