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

// ── FLOOD REACTIONS (Phase 0) ──
const FLOOD_REACTIONS = {
  villain: [
    (n, pr) => `${n} sits up in the water, completely calm. "This is a challenge. Has to be." ${pr.Sub} ${pr.sub==='they'?'start':'starts'} calculating immediately.`,
    (n, pr) => `The flood barely registers on ${n}'s face. "Interesting." ${pr.Sub} ${pr.sub==='they'?'look':'looks'} around to see how the others are reacting. Information is power, even now.`,
  ],
  hothead: [
    (n, pr) => `"FINALLY something interesting!" ${n} shouts from the floating bed. ${pr.Sub} ${pr.sub==='they'?'sound':'sounds'} almost excited.`,
    (n, pr) => `${n} punches the water with both fists. "LET'S GO." This might be the best day of ${pr.posAdj} life.`,
  ],
  social: [
    (n, pr) => `"MY HAIR." ${n}'s first words. ${pr.Sub} ${pr.sub==='they'?'look':'looks'} around wildly. "WHO is going to be in my group?!"`,
    (n, pr) => `${n} gasps when the cold water hits. "Okay. OKAY. We can work with this." ${pr.Sub} ${pr.sub==='they'?'are':'is'} already thinking about who to partner with.`,
  ],
  hero: [
    (n, pr) => `${n}'s first instinct is to check on the others. "${pr.Sub} ${pr.sub==='they'?'look':'looks'} around. "Is everyone okay?!" The answer is not great, but ${pr.sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} stop moving.`,
    (n, pr) => `"Everyone stay calm!" ${n} yells. Nobody is staying calm. But ${pr.sub} ${pr.sub==='they'?'try':'tries'}.`,
  ],
  underdog: [
    (n, pr) => `${n} takes a breath. Looks at the sky. "Okay," ${pr.sub} ${pr.sub==='they'?'say':'says'} quietly. Quiet determination. This won't break ${pr.obj}.`,
    (n, pr) => `${n} floats for a moment, staring up. "I've had worse mornings." ${pr.Sub} ${pr.sub==='they'?'paddle':'paddles'} toward the nearest tree and hold on.`,
  ],
  wildcard: [
    (n, pr) => `${n} immediately begins to sing. Nobody asks why. This is just who ${pr.sub} ${pr.sub==='they'?'are':'is'}.`,
    (n, pr) => `${n} ducks under the surface for a full ten seconds, comes back up, wipes ${pr.posAdj} face, and announces: "The water speaks to me." ${pr.Sub} ${pr.sub==='they'?'paddle':'paddles'} away.`,
  ],
  default: [
    (n, pr) => `${n} wakes up floating and takes a moment to process this information. "...Sure," ${pr.sub} ${pr.sub==='they'?'say':'says'}, and ${pr.sub} ${pr.sub==='they'?'start':'starts'} swimming.`,
    (n, pr) => `${n} blinks at the flooded cabin. Looks down. Looks up. "I hate this island," ${pr.sub} ${pr.sub==='they'?'say':'says'}, and ${pr.sub} ${pr.sub==='they'?'mean':'means'} it.`,
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
  const badges = {};
  const cameraFlags = [];

  // ══ PHASE 0 — THE FLOOD ══
  timeline.push({ type: 'chrisAnnounce', phase: 0, text: `"Good morning, campers! Production had absolutely nothing to do with last night's flood. That's our story and we're sticking to it." — Chris McLean` });

  activePlayers.forEach(name => {
    const arch = getArchetype(name);
    const pr = pronouns(name);
    const bucket = VILLAIN_ARCHETYPES.includes(arch) ? 'villain'
      : ['hothead', 'chaos-agent'].includes(arch) ? 'hothead'
      : ['social-butterfly', 'showmancer'].includes(arch) ? 'social'
      : ['hero', 'loyal-soldier'].includes(arch) ? 'hero'
      : ['underdog', 'floater', 'goat'].includes(arch) ? 'underdog'
      : arch === 'wildcard' ? 'wildcard' : 'default';
    const text = _rp(FLOOD_REACTIONS[bucket])(name, pr);
    timeline.push({ type: 'floodReaction', phase: 0, player: name, archBucket: bucket, text, badgeText: 'REACTION', badgeClass: 'grey' });
  });

  // ══ PHASE 1 — SCATTERED ══
  const groups = formGroups(activePlayers);
  const groupLabels = groups.map((_, i) => String.fromCharCode(65 + i));
  const usedWildlife = new Set();

  groups.forEach((group, gi) => {
    const label = groupLabels[gi];
    const eventCount = Math.max(10, group.length * 2 + 4);
    let fired = 0;

    // ── Individual Confessionals (always fire — no fired guard) ──
    group.forEach(name => {
      const arch = getArchetype(name);
      const pr = pronouns(name);
      const bucket = VILLAIN_ARCHETYPES.includes(arch) ? 'villain'
        : arch === 'mastermind' ? 'mastermind'
        : ['hothead', 'chaos-agent'].includes(arch) ? 'hothead'
        : ['social-butterfly', 'showmancer'].includes(arch) ? 'social'
        : ['hero', 'loyal-soldier'].includes(arch) ? 'hero'
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
      let text, badge, bClass = 'grey';
      if (s.physical >= 7 && s.boldness >= 6) {
        text = _rp([
          `${name} scales a coconut palm barefoot and clears the top in under two minutes. Nobody is surprised. Everyone is watching.`,
          `${name} builds a rope harness from vines in about thirty seconds. Doesn't say how ${pr.sub} ${pr.sub==='they'?'know':'knows'} how to do that. Just does it.`,
        ]); badge = 'PHYSICAL FEAT'; bClass = 'gold'; personalScores[name] += 0.5;
      } else if (s.mental >= 7) {
        text = _rp([
          `${name} assesses the terrain in under two minutes and has already formed three opinions about the optimal path forward.`,
          `${name} identifies the edible plants in a twenty-foot radius with unsettling confidence. Maybe from a book. Maybe not.`,
        ]); badge = 'ASSESSMENT'; bClass = 'blue'; personalScores[name] += 0.3;
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
        ]); badge = 'RELENTLESS'; bClass = 'green'; personalScores[name] += 0.3;
      } else {
        text = _rp([
          `${name} is managing. Not thriving, not falling apart — managing, which in these conditions might actually be the right call.`,
          `${name} finds ${pr.posAdj} rhythm eventually. Slower than some. Still moving. Still here.`,
        ]); badge = 'SURVIVING'; personalScores[name] += 0.1;
      }
      timeline.push({ type: 'survivalActivity', phase: 1, group: label, player: name, players: [name], text, badgeText: badge, badgeClass: bClass });
    });

    // ── Food Finding (~60%) ──
    if (Math.random() < 0.60 && fired < eventCount) {
      fired++;
      const forager = group.slice().sort((a, b) => {
        const sa = pStats(a), sb = pStats(b);
        return (sb.intuition * 0.04 + sb.mental * 0.03 + sb.endurance * 0.02) - (sa.intuition * 0.04 + sa.mental * 0.03 + sa.endurance * 0.02);
      })[0];
      const pr = pronouns(forager);
      const successChance = pStats(forager).intuition * 0.04 + pStats(forager).mental * 0.03 + pStats(forager).endurance * 0.02 + Math.random() * 0.2;
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
    if (group.length >= 2 && Math.random() < 0.50 && fired < eventCount) {
      fired++;
      const builder = group.slice().sort((a, b) => (pStats(b).endurance * 0.05 + pStats(b).mental * 0.04) - (pStats(a).endurance * 0.05 + pStats(a).mental * 0.04))[0];
      const pr = pronouns(builder);
      const buildScore = pStats(builder).endurance * 0.05 + pStats(builder).mental * 0.04 + Math.random() * 0.3;
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
    for (let w = 0; w < wildCount && fired < eventCount; w++) {
      const available = WILDLIFE.filter(wi => !usedWildlife.has(wi.id) && (wi.soloOnly ? group.length === 1 : true));
      if (!available.length) break;
      fired++;
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
    if (Math.random() < 0.40 && fired < eventCount) {
      fired++;
      const expert = group.slice().sort((a, b) => pStats(a).mental - pStats(b).mental)[0]; // worst mental tries first
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
    if (Math.random() < 0.25 && fired < eventCount) {
      fired++;
      const victim = group.slice().sort((a, b) => pStats(a).intuition - pStats(b).intuition)[0];
      const vPr = pronouns(victim);
      const text = _rp(LOST_TEXTS)(victim, vPr);
      personalScores[victim] -= 1.5; popDelta(victim, -1);
      timeline.push({ type: 'gettingLost', phase: 1, group: label, player: victim, players: [victim], text, badgeText: 'LOST', badgeClass: 'red' });
      cameraFlags.push({ player: victim, type: 'lost', text: `${victim} has been walking in circles.`, reactionType: 'entertained' });
    }

    // ── Water Gathering (~70%) ──
    if (Math.random() < 0.70 && fired < eventCount) {
      fired++;
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
    for (let pi = 0; pi < group.length && pairBondFired < 2 && fired < eventCount; pi++) {
      for (let pj = pi + 1; pj < group.length && pairBondFired < 2 && fired < eventCount; pj++) {
        const a = group[pi], b = group[pj];
        if (getBond(a, b) > -2 && Math.random() < 0.45) {
          fired++; pairBondFired++;
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
    if (group.length >= 2 && fired < eventCount) {
      const strategists = group.filter(p => pStats(p).strategic >= 6);
      if (strategists.length >= 2 && Math.random() < 0.50) {
        fired++;
        const [a, b] = strategists.slice(0, 2);
        const text = `${a} and ${b} are quiet for a while. Then, without ceremony: "We should talk." Four words that change the shape of the next tribal council.`;
        personalScores[a] += 0.5; personalScores[b] += 0.5;
        addBond(a, b, 0.3);
        timeline.push({ type: 'unexpectedAlliance', phase: 1, group: label, players: [a, b], text, badgeText: 'STRATEGY TALK', badgeClass: 'yellow' });
      }
    }

    // Vulnerability Confession (highest temperament player)
    if (fired < eventCount && Math.random() < 0.45) {
      fired++;
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
  });

  // ══ PHASE 2 — THE NIGHT ══
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
  groups.forEach((group, gi) => {
    const reporter = group.slice().sort((a, b) =>
      (pStats(b).social * 0.6 + pStats(b).strategic * 0.4) - (pStats(a).social * 0.6 + pStats(a).strategic * 0.4)
    )[0];
    const rPr = pronouns(reporter);
    const text = _rp(PHASE3_INTEL_TEXTS)(reporter, rPr);
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

  // Strategy consolidation — strategic ≥ 6 players refocus on the game (~65%)
  const strategicPlayers = activePlayers.filter(p => pStats(p).strategic >= 6);
  if (strategicPlayers.length > 0 && Math.random() < 0.65) {
    const pivot = _rp(strategicPlayers);
    const pivotPr = pronouns(pivot);
    const text = _rp(PHASE3_STRATEGY_TEXTS)(pivot, pivotPr);
    personalScores[pivot] += 0.5;
    timeline.push({ type: 'reunion', subtype: 'strategyConsolidation', phase: 3, player: pivot, players: [pivot], text, badgeText: 'STRATEGY MODE', badgeClass: 'purple' });
  }

  // War paint preparation (boldness ≥ 7) — fires ~55%; excludes discoverer to prevent double-dip
  const warPainters = activePlayers.filter(p => pStats(p).boldness >= 7);
  if (warPainters.length > 0 && Math.random() < 0.55) {
    const painters = warPainters.filter(p => p !== discoverer);
    const actualPainters = painters.length > 0 ? painters : warPainters;
    actualPainters.forEach(p => { personalScores[p] += 1.0; });
    activePlayers.filter(p => !actualPainters.includes(p)).forEach(p => { personalScores[p] += 0.2; });
    timeline.push({ type: 'reunion', subtype: 'warPaint', phase: 3, players: actualPainters, text: _rp(REUNION_TEXTS.warPaint)(actualPainters), badgeText: 'WAR PARTY', badgeClass: 'red' });
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
    timeline.push({ type: 'stormEvent', subtype: 'charge', phase: 4, players: chargeLeaders, text: `${chargeLeaders.join(', ')} ${chargeLeaders.length === 1 ? 'leads' : 'lead'} the charge through the jungle. The war paint was a good call.`, badgeText: 'THE CHARGE', badgeClass: 'red' });
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
    // Store original event ref for VHS replay panel in VP
    const origEvent = flag.type === 'breakdown'
      ? timeline.find(e => e.type === 'breakdown' && e.player === subject)
      : timeline.find(e => (e.player === subject || (e.players && e.players.includes(subject))) && e.phase < 4);
    timeline.push({ type: 'stormEvent', subtype: 'playback', phase: 4, player: subject, players: [subject], text: playText, badgeText: '▶ PLAYBACK', badgeClass: 'purple', isPlayback: true, flagType: flag.type, reactionType: flag.reactionType, origEventText: origEvent?.text || flag.text });
    timeline.push({ type: 'chrisReaction', phase: 4, reactionType: flag.reactionType, text: _rp(CHRIS_REACTIONS[flag.reactionType] || CHRIS_REACTIONS.entertained) });
  });

  // The Reveal — Skeptic bonus: mental ≥ 7 gets expanded reward; intuition ≥ 7 gets partial
  const revealText = _rp(STORM_TEXTS.reveal);
  timeline.push({ type: 'stormEvent', subtype: 'reveal', phase: 4, players: activePlayers, text: revealText, badgeText: 'THE REVEAL', badgeClass: 'gold' });
  activePlayers.forEach(name => {
    const s = pStats(name);
    if (s.mental >= 7) {
      personalScores[name] += 1.0; popDelta(name, 1);
    } else if (s.intuition >= 7) {
      personalScores[name] += 0.5;
    } else {
      personalScores[name] -= 0.3;
    }
  });

  // Finisher — endurance ≥ 7 (gated on stat, not raw accumulated score)
  activePlayers.forEach(name => {
    if (pStats(name).endurance >= 7) {
      personalScores[name] += 0.8;
      timeline.push({ type: 'stormEvent', subtype: 'enduranceBonus', phase: 4, player: name, players: [name], text: `Chris grudgingly notes ${name}'s consistent performance. "Fine. You earned it."`, badgeText: 'ENDURANCE BONUS', badgeClass: 'green' });
    }
  });

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
  timeline.push({ type: 'immunityReveal', phase: 4, player: immunityWinner, score: personalScores[immunityWinner], players: activePlayers, text: `${immunityWinner} outlasted, outsmarted, and out-survived them all. Individual immunity goes to ${immunityWinner}.`, badgeText: '🏆 IMMUNITY', badgeClass: 'gold' });

  // ══ EP FIELDS ══
  ep.challengeType = 'individual';
  ep.challengeLabel = 'Camp Castaways';
  ep.challengeCategory = 'survival';
  ep.challengeDesc = 'Survive the night on a deserted island. Best survivor wins immunity.';
  ep.isCampCastaways = true;
  ep.immunityWinner = immunityWinner;
  ep.tribalPlayers = gs.activePlayers.filter(p => p !== immunityWinner && !(ep.extraImmune || []).includes(p) && p !== gs.exileDuelPlayer);

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
    badges,
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

// ── COLOUR PALETTE ──
const SV_BG = '#0a0e0a';        // Surveillance background
const SV_GREEN = '#00ff41';     // NV green
const SV_DIM = '#00a028';       // Dim green
const SV_TEXT = '#c8ffd8';      // Text
const DI_BG = '#f5e6c8';        // Diary background
const DI_INK = '#2d1a0e';       // Ink
const DI_STAMP = '#8b1a1a';     // Stamp red
const DI_BORDER = '#7a5230';    // Border
const BC_BG = '#0a0f1e';        // Broadcast background
const BC_SIGNAL = '#00cfff';    // Signal blue
const BC_TEXT = '#e8f4ff';      // Broadcast text
const BC_ALERT = '#ff4444';     // Alert red

// ══ CAMP CASTAWAYS — INJECTED STYLESHEET ══
const CC_STYLES = `
  /* ═══ CAMP CASTAWAYS · THREE-MODE VP ═══
     Mode 1 Surveillance  — night-vision green / CRT / dark
     Mode 2 Castaway Diary — aged paper / ink stamp / rotated panels
     Mode 3 Emergency Broadcast — navy / signal pulse / ticker
  */

  /* ── SURVEILLANCE ── */
  .cc-sv { background:#0a0e0a; color:#c8ffd8; font-family:'Courier New',monospace; position:relative; overflow:hidden; padding:14px 12px; }
  .cc-sv::before { content:''; position:absolute; inset:0;
    background:repeating-linear-gradient(0deg,rgba(0,255,65,0.025) 0px,transparent 2px);
    animation:cc-scan 6s linear infinite; pointer-events:none; z-index:0; }
  @keyframes cc-scan { 0%{background-position:0 0} 100%{background-position:0 20px} }
  .cc-sv--nv { filter:brightness(1.08) saturate(0.5) hue-rotate(75deg); }

  .cc-sv-cam { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; position:relative; z-index:2; }
  .cc-sv-camid { font-size:9px; color:#00a028; letter-spacing:2px; }
  .cc-sv-ts { font-size:9px; color:#00a028; letter-spacing:1px; animation:cc-ts-pulse 2s ease-in-out infinite; }
  @keyframes cc-ts-pulse { 0%,100%{opacity:1} 50%{opacity:0.55} }
  .cc-rec { display:inline-block; width:7px; height:7px; border-radius:50%; background:#c33;
    margin-right:5px; animation:cc-rec-blink 1.2s step-end infinite; vertical-align:middle; }
  @keyframes cc-rec-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }

  .cc-sv-card { position:relative; z-index:2; margin-bottom:5px; padding:8px 10px;
    background:#0a0e0a; border:1px solid #00a02833; border-left:2px solid #00a028;
    animation:cc-sv-slide 0.4s ease-out both; }
  @keyframes cc-sv-slide { 0%{opacity:0;transform:translateX(-14px)} 100%{opacity:1;transform:translateX(0)} }
  .cc-sv-card--playback { border-color:#a78bfa44; border-left-color:#a78bfa; }
  .cc-sv-card--chris { border-left-color:#c33; background:#c3300608; }
  .cc-sv-card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
  .cc-sv-card-cam  { font-size:8px; color:#00a028; letter-spacing:1px; }
  .cc-sv-card-time { font-size:8px; color:#00a028; letter-spacing:1px; }
  .cc-sv-playback-label { display:inline-block; padding:1px 6px; background:#a78bfa22;
    border:1px solid #a78bfa; font-size:7px; letter-spacing:2px; color:#a78bfa; margin-bottom:4px; }
  .cc-sv-player { display:flex; align-items:center; gap:6px; margin-bottom:3px; }
  .cc-sv-player-name { font-size:9px; color:#00ff41; font-weight:700; }
  .cc-sv-card-body { font-size:11px; color:#c8ffd8; line-height:1.5; position:relative; z-index:1; }
  .cc-sv-badge span { font-size:8px; padding:1px 5px; border:1px solid #00a028; color:#00a028; letter-spacing:1px; }

  .cc-vhs-label { margin:4px 0; padding:5px 8px; background:#000; border-left:3px solid #c33;
    font-family:'Courier New',monospace; font-size:10px; color:#fff; letter-spacing:0.5px;
    animation:cc-vhs-in 0.35s ease-out both; }
  @keyframes cc-vhs-in { 0%{opacity:0;transform:translateY(10px)} 100%{opacity:1;transform:translateY(0)} }

  .cc-sv-reveal-btn { cursor:pointer; padding:8px 14px; margin-bottom:5px; border-radius:4px;
    border:1px dashed #00ff4144; background:#00ff4108; text-align:center;
    font-family:'Courier New',monospace; font-size:10px; color:#00a028; transition:background 0.2s; }
  .cc-sv-reveal-btn:hover { background:#00ff4114; }
  .cc-sv-phase-end { text-align:center; font-family:'Courier New',monospace; font-size:9px;
    color:#00a028; padding:6px; letter-spacing:1px; position:relative; z-index:2; }

  /* ── CASTAWAY DIARY ── */
  .cc-diary { background:#f5e6c8; color:#2d1a0e; font-family:Georgia,'Times New Roman',serif;
    position:relative; overflow:hidden; padding:14px 12px; border:2px solid #7a5230; }
  .cc-diary::before { content:''; position:absolute; inset:0;
    background:radial-gradient(ellipse at 20% 80%,rgba(139,82,48,0.07) 0%,transparent 70%);
    pointer-events:none; z-index:0; }
  .cc-diary-header { font-size:14px; font-weight:700; color:#2d1a0e; margin-bottom:2px; position:relative; z-index:2; }
  .cc-diary-sub { font-family:'Courier New',monospace; font-size:9px; color:#7a5230;
    letter-spacing:1px; margin-bottom:10px; position:relative; z-index:2; }
  .cc-diary-members { display:flex; flex-wrap:wrap; gap:4px; margin-bottom:10px; padding:6px;
    background:#f5e6c8; border:1px solid #7a523022; position:relative; z-index:2; }
  .cc-diary-member { display:flex; flex-direction:column; align-items:center; gap:2px; }
  .cc-diary-member-name { font-family:Georgia,serif; font-size:9px; color:#2d1a0e; }

  .cc-diary-panel { position:relative; z-index:2; margin:6px 4px; padding:10px 12px;
    background:#f5e6c8; border:2px solid #7a5230; box-shadow:2px 2px 4px rgba(0,0,0,0.2);
    transform:var(--p-rot,rotate(0deg));
    animation:cc-panel-drop 0.5s ease-out both; }
  .cc-diary-panel::before { content:''; position:absolute; inset:0;
    background:repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,0.018) 4px,rgba(0,0,0,0.018) 5px);
    pointer-events:none; }
  @keyframes cc-panel-drop {
    0%   { opacity:0; transform:var(--p-rot-from,rotate(-4deg)) translateY(-18px); }
    60%  { transform:var(--p-rot-over,rotate(0.8deg)) translateY(2px); }
    100% { opacity:1; transform:var(--p-rot,rotate(0deg)) translateY(0); }
  }
  .cc-diary-player { display:flex; align-items:center; gap:6px; margin-bottom:4px; }
  .cc-diary-player-name { font-family:Georgia,serif; font-size:10px; font-weight:700; color:#2d1a0e; }
  .cc-diary-body { font-family:Georgia,serif; font-size:12px; color:#2d1a0e; line-height:1.6; position:relative; z-index:1; }

  .cc-stamp { position:absolute; top:6px; right:6px;
    font-family:'Courier New',monospace; font-size:7px; font-weight:700; letter-spacing:1px;
    border:1px solid currentColor; padding:1px 4px; opacity:0.85;
    transform:var(--stamp-rot,rotate(5deg));
    animation:cc-stamp-slam 0.45s ease-out both; }
  @keyframes cc-stamp-slam {
    0%  { transform:var(--stamp-rot,rotate(5deg)) scale(2.8); opacity:0; }
    55% { transform:var(--stamp-rot,rotate(5deg)) scale(0.92); opacity:1; }
    80% { transform:var(--stamp-rot,rotate(5deg)) scale(1.04); }
    100%{ transform:var(--stamp-rot,rotate(5deg)) scale(1); opacity:0.85; }
  }

  .cc-breakdown { position:relative; z-index:2; margin:8px 4px; padding:12px;
    background:#f5e6c8; border:3px solid #8b1a1a; box-shadow:3px 3px 8px rgba(139,26,26,0.25);
    animation:cc-panel-drop 0.5s ease-out both, cc-breakdown-pulse 3s ease-in-out 0.5s infinite; }
  @keyframes cc-breakdown-pulse {
    0%,100%{ box-shadow:3px 3px 8px rgba(139,26,26,0.25); }
    50%    { box-shadow:3px 3px 20px rgba(139,26,26,0.55); }
  }
  .cc-breakdown-badge { position:absolute; top:4px; right:6px;
    font-family:'Courier New',monospace; font-size:8px; color:#8b1a1a; letter-spacing:2px; font-weight:700; }
  .cc-breakdown-player { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
  .cc-breakdown-name { font-family:Georgia,serif; font-size:11px; font-weight:700; color:#8b1a1a; }
  .cc-breakdown-body { font-family:Georgia,serif; font-size:12px; color:#2d1a0e; line-height:1.6; }
  .cc-breakdown-obj  { margin-top:4px; font-family:Georgia,serif; font-size:9px; color:#8b1a1a; font-style:italic; }

  .cc-pageturn { cursor:pointer; padding:8px 12px; border:1px dashed #7a5230;
    background:rgba(45,26,14,0.04); text-align:center;
    font-family:Georgia,serif; font-size:10px; color:#7a5230; margin:4px;
    transition:background 0.2s; position:relative; z-index:2; }
  .cc-pageturn:hover { background:rgba(45,26,14,0.1); }
  .cc-sv-interrupt { margin:6px 0; padding:6px 10px; background:#0a0e0a;
    border-left:2px solid #00a028; font-family:'Courier New',monospace; font-size:10px; color:#00a028;
    animation:cc-sv-slide 0.3s ease-out both; position:relative; z-index:2; }
  .cc-sv-interrupt-label { color:#00ff41; font-size:8px; letter-spacing:1px; display:block; margin-bottom:2px; }
  .cc-diary-phase-end { text-align:right; font-family:Georgia,serif; font-size:8px;
    color:#7a5230; margin-top:6px; font-style:italic; position:relative; z-index:2; }

  /* ── EMERGENCY BROADCAST ── */
  .cc-bc { background:#0a0f1e; color:#e8f4ff; font-family:'Courier New',monospace;
    position:relative; overflow:hidden; padding:14px 12px; border:1px solid #00cfff33; }
  .cc-bc-signal-bar { height:4px; background:linear-gradient(90deg,#ff4444 0%,#00cfff 100%);
    margin-bottom:10px; animation:cc-signal-pulse 2s ease-in-out infinite; }
  @keyframes cc-signal-pulse { 0%,100%{opacity:1;filter:brightness(1)} 50%{opacity:0.65;filter:brightness(1.5)} }
  .cc-bc-header-label { font-size:9px; color:#00cfff; letter-spacing:2px; margin-bottom:4px; }
  .cc-bc-header-title { font-size:14px; font-weight:700; color:#e8f4ff; letter-spacing:2px; margin-bottom:2px; }
  .cc-bc-header-sub   { font-size:9px; color:#00cfff; margin-bottom:10px; }
  .cc-bc-card { margin-bottom:5px; padding:8px 12px; background:#0a0f1e;
    border:1px solid #00cfff22; border-left:2px solid #00cfff;
    animation:cc-sv-slide 0.35s ease-out both; }
  .cc-bc-card--winner { border-left-color:#00cfff; background:#00cfff0a;
    animation:cc-sv-slide 0.35s ease-out both, cc-winner-glow 2.5s ease-in-out 0.4s infinite; }
  @keyframes cc-winner-glow {
    0%,100%{ box-shadow:0 0 4px rgba(0,207,255,0.1); }
    50%    { box-shadow:0 0 22px rgba(0,207,255,0.4); }
  }
  .cc-bc-transmission-label { font-size:8px; letter-spacing:2px; color:#00cfff; margin-bottom:3px; }
  .cc-bc-player { display:flex; align-items:center; gap:6px; margin-bottom:3px; }
  .cc-bc-player-name { font-size:10px; font-weight:700; color:#e8f4ff; }
  .cc-bc-player-name--winner { color:#00cfff; }
  .cc-bc-card-body { font-size:12px; color:#e8f4ff; line-height:1.5; }
  .cc-bc-score-bar-wrap { margin-top:5px; height:4px; background:#ffffff11; border-radius:2px; overflow:hidden; }
  .cc-bc-score-bar { height:100%; background:#00cfff; border-radius:2px; animation:cc-fill-bar 0.8s ease-out both; }
  @keyframes cc-fill-bar { 0%{width:0%} 100%{width:var(--bar-pct,0%)} }
  .cc-bc-badge { margin-top:3px; font-size:8px; color:#00cfff; letter-spacing:1px; }
  .cc-bc-reveal-btn { cursor:pointer; padding:8px 12px; border:1px solid #00cfff33;
    background:#00cfff08; text-align:center; font-family:'Courier New',monospace;
    font-size:10px; color:#00cfff; margin-bottom:4px; transition:background 0.2s; }
  .cc-bc-reveal-btn:hover { background:#00cfff16; }
  .cc-ticker-wrap { overflow:hidden; background:#000; border-top:1px solid #00cfff33;
    padding:3px 0; margin-top:10px; white-space:nowrap; }
  .cc-ticker { display:inline-block; padding-left:100%;
    animation:cc-ticker-scroll 22s linear infinite;
    font-family:'Courier New',monospace; font-size:9px; color:#00cfff99; letter-spacing:1px; }
  @keyframes cc-ticker-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-100%)} }
  .cc-bc-phase-end { text-align:center; font-family:'Courier New',monospace;
    font-size:9px; color:#00cfff; padding:6px; letter-spacing:1px; }

  /* ── GLITCH TRANSITION ── */
  .cc-glitch-wrap { position:relative; height:22px; overflow:hidden; margin:6px 0;
    background:#0a0e0a; animation:cc-glitch-play 0.5s ease-out both; }
  @keyframes cc-glitch-play {
    0%  { opacity:0; }
    12% { opacity:1; filter:invert(1) brightness(4); }
    24% { filter:invert(0) brightness(1); clip-path:inset(30% 0 35% 0); }
    36% { clip-path:inset(0 0 0 0); filter:hue-rotate(180deg) brightness(1.5); }
    50% { filter:none; }
    100%{ opacity:1; }
  }
  .cc-glitch-label { position:absolute; inset:0; display:flex; align-items:center;
    justify-content:center; font-family:'Courier New',monospace; font-size:9px;
    letter-spacing:4px; color:#00ff41; opacity:0.6; }
  .cc-glitch-line { position:absolute; left:0; right:0; height:1px; background:#00ff41; opacity:0.3; }
  .cc-glitch-line--top { top:0; } .cc-glitch-line--bot { bottom:0; }

  /* ── MONITOR WALL FRAME (persistent across all CC screens) ── */
  .cc-monitor-frame { display:flex; align-items:center; justify-content:space-between;
    padding:4px 8px; margin-bottom:8px; border-bottom:1px solid currentColor;
    font-family:'Courier New',monospace; font-size:8px; letter-spacing:1px; }
  .cc-monitor-frame--sv  { color:#00a028; opacity:0.75; }
  .cc-monitor-frame--diary { color:#7a5230; border-bottom-color:#7a523055; }
  .cc-monitor-frame--bc  { color:#00cfff; opacity:0.85; }
  .cc-monitor-mode { font-weight:700; }
  .cc-monitor-tape { opacity:0.7; }
  .cc-monitor-clock { animation:cc-ts-pulse 2s ease-in-out infinite; }

  /* ── MODE ENTRY ANIMATIONS ── */
  .cc-sv  { animation:cc-sv-enter 0.45s ease-out both; }
  @keyframes cc-sv-enter {
    0%  { opacity:0; filter:brightness(3) saturate(0); }
    30% { filter:brightness(1.5) saturate(0.2); }
    100%{ opacity:1; filter:none; }
  }
  .cc-diary { animation:cc-diary-enter 0.5s ease-out both; }
  @keyframes cc-diary-enter {
    0%  { opacity:0; transform:translateY(18px) rotate(-0.4deg); }
    65% { transform:translateY(-2px) rotate(0.15deg); }
    100%{ opacity:1; transform:translateY(0) rotate(0); }
  }
  .cc-bc { animation:cc-bc-enter 0.6s ease-out both; }
  @keyframes cc-bc-enter {
    0%  { opacity:0; filter:brightness(6) saturate(0); }
    20% { opacity:1; filter:brightness(2); }
    100%{ opacity:1; filter:none; }
  }

  /* ── VHS REPLAY PANEL (Phase 4 playback cites earlier diary moment) ── */
  .cc-vhs-replay { position:relative; margin:6px 0; padding:8px 10px;
    background:#d8eedd; border:2px solid #a78bfa44; border-left:3px solid #a78bfa;
    filter:sepia(0.3) hue-rotate(70deg) saturate(0.55) brightness(0.92); overflow:hidden; }
  .cc-vhs-replay::before { content:''; position:absolute; inset:0;
    background:repeating-linear-gradient(0deg,rgba(0,255,65,0.06) 0px,transparent 3px);
    pointer-events:none; z-index:0; }
  .cc-vhs-replay-tag { font-family:'Courier New',monospace; font-size:8px; color:#6a50cc;
    letter-spacing:2px; margin-bottom:4px; position:relative; z-index:1; }
  .cc-vhs-tracking { position:absolute; top:0; left:0; right:0; height:3px;
    background:linear-gradient(90deg,transparent,#a78bfa88,transparent);
    animation:cc-vhs-track 1.8s ease-in-out infinite; }
  @keyframes cc-vhs-track { 0%,100%{opacity:0.3;transform:translateX(-30%)} 50%{opacity:1;transform:translateX(30%)} }
  .cc-vhs-replay-body { font-size:11px; color:#1a2e1a; line-height:1.5; position:relative; z-index:1; font-family:Georgia,serif; }

  /* ── STEALTH APPROACH badge uses blue ── */
  .cc-sv-badge--blue span { border-color:#4fa3e0; color:#4fa3e0; }

  /* ── prefers-reduced-motion: collapse all mode animations ── */
  @media (prefers-reduced-motion: reduce) {
    .cc-sv, .cc-diary, .cc-bc, .cc-sv-card, .cc-diary-panel,
    .cc-vhs-replay, .cc-glitch-wrap { animation-duration:0.01ms !important; }
  }
`;

// ── MODE TRANSITION GLITCH ──
function _glitchTransition(label) {
  return `<div class="cc-glitch-wrap">
    <div class="cc-glitch-label">▓▒░ ${label} ░▒▓</div>
    <div class="cc-glitch-line cc-glitch-line--top"></div>
    <div class="cc-glitch-line cc-glitch-line--bot"></div>
  </div>`;
}

// ── SURVEILLANCE CARD ──
function _svCard(evt, camId, ts) {
  const isPlayback = evt.isPlayback;
  const wrapCls = `cc-sv-card${isPlayback ? ' cc-sv-card--playback' : ''}${evt.type === 'chrisReaction' ? ' cc-sv-card--chris' : ''}`;
  let html = `<div class="${wrapCls}">`;
  html += `<div class="cc-sv-card-header">`;
  html += `<span class="cc-sv-card-cam">${camId || 'CAM-01 · ISLAND EAST'}</span>`;
  html += `<span class="cc-sv-card-time">${ts || '00:00:00'}</span>`;
  html += `</div>`;
  if (isPlayback) html += `<div class="cc-sv-playback-label">▶ PLAYBACK</div>`;
  const pName = evt.player || (evt.players?.length === 1 ? evt.players[0] : null);
  if (pName) {
    const port = (typeof rpPortrait === 'function') ? rpPortrait(pName, 'xs') : '';
    html += `<div class="cc-sv-player">${port}<span class="cc-sv-player-name">${pName}</span></div>`;
  } else if (evt.players?.length > 1) {
    const ports = evt.players.map(p => (typeof rpPortrait === 'function') ? rpPortrait(p, 'xs') : '').join('');
    html += `<div class="cc-sv-player">${ports}<span class="cc-sv-player-name">${evt.players.join(', ')}</span></div>`;
  }
  html += `<div class="cc-sv-card-body">${evt.text || ''}</div>`;
  if (evt.badgeText) html += `<div class="cc-sv-badge"><span>${evt.badgeText}</span></div>`;
  html += `</div>`;
  return html;
}

// ── DIARY PANEL ──
function _diaryPanel(evt, rotIdx) {
  const rots     = [-2, 1.5, -1, 2, -0.5, 1, -1.5, 0.5];
  const rotsFrom = [-5, 3,   -3, 4, -2,   2, -3,    1.5];
  const rotsOver = [-1.5, 1, -0.5, 1.5, -0.2, 0.6, -0.8, 0.3];
  const ri = rotIdx % rots.length;
  const rot = rots[ri]; const rotFrom = rotsFrom[ri]; const rotOver = rotsOver[ri];
  const badgeColors = { green:'#3a5a00', red:'#8b1a1a', yellow:'#7a5200', blue:'#1a3a7a', gold:'#6a4a00', pink:'#6a1a3a', grey:'#4a4a4a', purple:'#3a1a6a' };
  const badgeColor = badgeColors[evt.badgeClass || 'grey'] || '#4a4a4a';
  const stampRot = -rot * 2;
  let html = `<div class="cc-diary-panel" style="--p-rot:rotate(${rot}deg);--p-rot-from:rotate(${rotFrom}deg);--p-rot-over:rotate(${rotOver}deg)">`;
  if (evt.badgeText) {
    html += `<div class="cc-stamp" style="color:${badgeColor};--stamp-rot:rotate(${stampRot}deg)">${evt.badgeText}</div>`;
  }
  const pName = evt.player || (evt.players?.length === 1 ? evt.players[0] : null);
  if (pName) {
    const port = (typeof rpPortrait === 'function') ? rpPortrait(pName, 'xs') : '';
    html += `<div class="cc-diary-player">${port}<span class="cc-diary-player-name">${pName}</span></div>`;
  } else if (evt.players?.length > 1) {
    const ports = evt.players.map(p => (typeof rpPortrait === 'function') ? rpPortrait(p, 'xs') : '').join('');
    html += `<div class="cc-diary-player">${ports}<span class="cc-diary-player-name">${evt.players.join(', ')}</span></div>`;
  }
  html += `<div class="cc-diary-body">${evt.text || ''}</div>`;
  html += `</div>`;
  return html;
}

// ── BROADCAST CARD ──
function _bcCard(evt) {
  const isSignal = evt.subtype === 'immunityReveal';
  const isWinner = evt.badgeClass === 'gold' || isSignal;
  let html = `<div class="cc-bc-card${isWinner ? ' cc-bc-card--winner' : ''}">`;
  html += `<div class="cc-bc-transmission-label">${isSignal ? '▲ SIGNAL FOUND' : '● TRANSMISSION'}</div>`;
  const pName = evt.player || (evt.players?.length === 1 ? evt.players[0] : null);
  if (pName) {
    const port = (typeof rpPortrait === 'function') ? rpPortrait(pName, 'xs') : '';
    html += `<div class="cc-bc-player">${port}<span class="cc-bc-player-name${isWinner ? ' cc-bc-player-name--winner' : ''}">${pName}</span></div>`;
  }
  html += `<div class="cc-bc-card-body">${evt.text || ''}</div>`;
  if (evt.score !== undefined) {
    const barPct = Math.max(5, Math.min(100, ((evt.score + 5) / 20) * 100));
    html += `<div class="cc-bc-score-bar-wrap"><div class="cc-bc-score-bar" style="--bar-pct:${barPct}%"></div></div>`;
  }
  if (evt.badgeText) html += `<div class="cc-bc-badge">[ ${evt.badgeText} ]</div>`;
  html += `</div>`;
  return html;
}

// ── CLICK-TO-REVEAL — inline onclick (Lucky Hunt pattern) ──
function _ccInlineReveal(stateKey, targetIdx, screenId, epNum) {
  return `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};` +
    `_tvState['${stateKey}'].idx=${targetIdx};` +
    `const _cep=gs.episodeHistory.find(e=>e.num===${epNum});` +
    `if(_cep){const _cm=document.querySelector('.rp-main');const _cs=_cm?_cm.scrollTop:0;` +
    `buildVPScreens(_cep);const _ci=vpScreens.findIndex(s=>s.id==='${screenId}');` +
    `if(_ci>=0)vpCurrentScreen=_ci;renderVPScreen();if(_cm)_cm.scrollTop=_cs;}`;
}

// ── MONITOR WALL FRAME ──
function _monitorWall(mode, phaseLabel, tapeNum, tapeTotal) {
  const cls = mode === 'sv' ? 'cc-monitor-frame--sv' : mode === 'diary' ? 'cc-monitor-frame--diary' : 'cc-monitor-frame--bc';
  const modeLabel = mode === 'sv' ? '📡 SURVEILLANCE' : mode === 'diary' ? '📓 CASTAWAY DIARY' : '📻 EMERGENCY BROADCAST';
  return `<div class="cc-monitor-frame ${cls}"><span class="cc-monitor-mode">${modeLabel}</span><span>${phaseLabel}</span><span class="cc-monitor-tape">TAPE ${tapeNum}/${tapeTotal}</span></div>`;
}

// ══ SECTION BUILDERS ══

// ── Proper phase-0 timestamp: 30s spacing, starts at 00:02:00 ──
function _floodTs(i) {
  const secs = 120 + i * 30;
  return `00:${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
}

function _buildColdOpen(cc, ep, stateKey, screenId) {
  const _tvState = window._tvState;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];
  const events = cc.timeline.filter(e => e.phase === 0);
  const epNum = ep.num || 0;

  let html = `<div class="cc-sv cc-sv--nv">`;
  html += _monitorWall('sv', 'PHASE 0 — THE FLOOD', 1, 6);
  html += `<div class="cc-sv-cam">`;
  html += `<span class="cc-sv-camid"><span class="cc-rec"></span>CAM-00 · CAMP WAWANAKWA OVERVIEW</span>`;
  html += `<span class="cc-sv-ts">00:00:00 ▶ LIVE</span>`;
  html += `</div>`;
  html += `<div style="font-family:'Courier New',monospace;font-size:14px;font-weight:700;color:#00ff41;letter-spacing:3px;margin-bottom:2px;position:relative;z-index:2">📡 CAMP CASTAWAYS</div>`;
  html += `<div style="font-family:'Courier New',monospace;font-size:9px;color:#00a028;letter-spacing:1px;margin-bottom:10px;position:relative;z-index:2">PHASE 0 — THE FLOOD</div>`;

  events.forEach((evt, i) => {
    if (i > st.idx + 1) return;
    if (i <= st.idx) { html += _svCard(evt, 'CAM-00', _floodTs(i)); }
    else if (i === st.idx + 1) {
      html += `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">`;
      html += `<div class="cc-sv-reveal-btn" onclick="${_ccInlineReveal(stateKey, i, screenId, epNum)}">▶ NEXT ENTRY</div>`;
      html += `<div class="cc-sv-reveal-btn" style="opacity:0.55;font-size:9px;padding:6px 12px;letter-spacing:1px" onclick="${_ccInlineReveal(stateKey, events.length - 1, screenId, epNum)}">⏩ REVEAL ALL</div>`;
      html += `</div>`;
    }
  });

  if (st.idx >= events.length - 1 && events.length > 0) {
    html += `<div class="cc-sv-phase-end">▼ END PHASE 0 — GROUPS FORMING</div>`;
  }
  html += `</div>`;
  return html;
}

function _buildGroupScreen(cc, groupObj, ep, stateKey, screenId, tapeNum, tapeTotal) {
  const _tvState = window._tvState;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];
  const events = cc.timeline.filter(e => e.phase === 1 && e.group === groupObj.label);
  const epNum = ep.num || 0;

  let html = `<div class="cc-diary">`;
  html += _monitorWall('diary', `PHASE 1 — GROUP ${groupObj.label}`, tapeNum, tapeTotal);
  html += `<div class="cc-diary-header">📓 GROUP ${groupObj.label}</div>`;
  html += `<div class="cc-diary-sub">PHASE 1 — SCATTERED</div>`;
  html += `<div class="cc-diary-members">`;
  groupObj.members.forEach(m => {
    const port = (typeof rpPortrait === 'function') ? rpPortrait(m, 'sm') : '';
    html += `<div class="cc-diary-member">${port}<span class="cc-diary-member-name">${m}</span></div>`;
  });
  html += `</div>`;

  let panelIdx = 0;
  events.forEach((evt, i) => {
    if (i > st.idx + 1) return;
    if (i <= st.idx) { html += _diaryPanel(evt, panelIdx++); }
    else if (i === st.idx + 1) {
      html += `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">`;
      html += `<div class="cc-pageturn" onclick="${_ccInlineReveal(stateKey, i, screenId, epNum)}">▷ Turn the page</div>`;
      html += `<div class="cc-pageturn" style="opacity:0.55;font-size:10px;padding:5px 10px" onclick="${_ccInlineReveal(stateKey, events.length - 1, screenId, epNum)}">⏩ Reveal all</div>`;
      html += `</div>`;
    }
  });

  if (st.idx >= events.length - 1 && events.length > 0) {
    html += `<div class="cc-diary-phase-end">— Night falls on Group ${groupObj.label} —</div>`;
  }
  html += `</div>`;
  return html;
}

function _buildNightScreen(cc, ep, stateKey, screenId, tapeNum, tapeTotal) {
  const _tvState = window._tvState;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];
  const events = cc.timeline.filter(e => e.phase === 2);
  const epNum = ep.num || 0;

  let html = `<div class="cc-diary">`;
  html += _monitorWall('diary', 'PHASE 2 — THE NIGHT', tapeNum, tapeTotal);
  html += `<div class="cc-diary-header">🌙 THE NIGHT</div>`;
  html += `<div class="cc-diary-sub">PHASE 2 — DARKNESS, HUNGER, TRUTH</div>`;

  let panelIdx = 0;
  events.forEach((evt, i) => {
    if (i > st.idx + 1) return;
    if (i <= st.idx) {
      if (evt.type === 'chrisReaction') {
        html += `<div class="cc-sv-interrupt"><span class="cc-sv-interrupt-label">◉ CAM INTERRUPTS · SURVEILLANCE</span>${evt.text}</div>`;
      } else if (evt.type === 'breakdown') {
        const pName = evt.player;
        const port = pName && typeof rpPortrait === 'function' ? rpPortrait(pName, 'sm') : '';
        html += `<div class="cc-breakdown">`;
        html += `<div class="cc-breakdown-badge">${evt.badgeText || 'BREAKDOWN'}</div>`;
        if (pName) html += `<div class="cc-breakdown-player">${port}<span class="cc-breakdown-name">${pName}</span></div>`;
        html += `<div class="cc-breakdown-body">${evt.text || ''}</div>`;
        if (evt.objectName) html += `<div class="cc-breakdown-obj">"${evt.objectName}"</div>`;
        html += `</div>`;
      } else {
        html += _diaryPanel(evt, panelIdx++);
      }
    } else if (i === st.idx + 1) {
      html += `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">`;
      html += `<div class="cc-pageturn" onclick="${_ccInlineReveal(stateKey, i, screenId, epNum)}">▷ Turn the page</div>`;
      html += `<div class="cc-pageturn" style="opacity:0.55;font-size:10px;padding:5px 10px" onclick="${_ccInlineReveal(stateKey, events.length - 1, screenId, epNum)}">⏩ Reveal all</div>`;
      html += `</div>`;
    }
  });

  if (st.idx >= events.length - 1 && events.length > 0) {
    html += `<div class="cc-diary-phase-end">— Dawn approaches —</div>`;
  }
  html += `</div>`;
  return html;
}

function _buildRegroupScreen(cc, ep, stateKey, screenId, tapeNum, tapeTotal) {
  const _tvState = window._tvState;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];
  const events = cc.timeline.filter(e => e.phase === 3);
  const epNum = ep.num || 0;

  let html = `<div class="cc-diary">`;
  html += _monitorWall('diary', 'PHASE 3 — REGROUPING', tapeNum, tapeTotal);
  html += `<div class="cc-diary-header">🧭 REGROUPING</div>`;
  html += `<div class="cc-diary-sub">PHASE 3 — FINDING EACH OTHER</div>`;

  let panelIdx = 0;
  events.forEach((evt, i) => {
    if (i > st.idx + 1) return;
    if (i <= st.idx) {
      if (evt.type === 'chrisReaction') {
        html += `<div class="cc-sv-interrupt"><span class="cc-sv-interrupt-label">◉ SURVEILLANCE FLASH</span>${evt.text}</div>`;
      } else { html += _diaryPanel(evt, panelIdx++); }
    } else if (i === st.idx + 1) {
      html += `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">`;
      html += `<div class="cc-pageturn" onclick="${_ccInlineReveal(stateKey, i, screenId, epNum)}">▷ Turn the page</div>`;
      html += `<div class="cc-pageturn" style="opacity:0.55;font-size:10px;padding:5px 10px" onclick="${_ccInlineReveal(stateKey, events.length - 1, screenId, epNum)}">⏩ Reveal all</div>`;
      html += `</div>`;
    }
  });
  html += `</div>`;
  return html;
}

function _buildStormScreen(cc, ep, stateKey, screenId, tapeNum, tapeTotal) {
  const _tvState = window._tvState;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];
  const events = cc.timeline.filter(e => e.phase === 4);
  const epNum = ep.num || 0;

  let html = `<div class="cc-sv">`;
  html += _monitorWall('sv', 'PHASE 4 — STORMING THE CAMP', tapeNum, tapeTotal);
  html += `<div class="cc-sv-cam">`;
  html += `<span class="cc-sv-camid"><span class="cc-rec"></span>CAM-04 · CHRIS'S CAMP</span>`;
  html += `<span class="cc-sv-ts">DAYLIGHT ▶ RECORDING</span>`;
  html += `</div>`;
  html += `<div style="font-family:'Courier New',monospace;font-size:14px;font-weight:700;color:#00ff41;letter-spacing:3px;margin-bottom:2px;position:relative;z-index:2">⚡ STORMING THE CAMP</div>`;
  html += `<div style="font-family:'Courier New',monospace;font-size:9px;color:#00a028;letter-spacing:1px;margin-bottom:10px;position:relative;z-index:2">PHASE 4 — CLIMAX</div>`;

  const camIds = ['CAM-04', 'CAM-05', 'CAM-06', 'CAM-07', 'CAM-08', 'CAM-09'];
  events.forEach((evt, i) => {
    if (i > st.idx + 1) return;
    if (i <= st.idx) {
      const camId = camIds[i % camIds.length];
      const secBase = 8 * 3600;
      const s = secBase + i * 37;
      const ts = `${String(Math.floor(s / 3600) % 24).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      if (evt.isPlayback && evt.origEventText) {
        // VHS replay panel cites the original diary moment, tinted surveillance-green
        html += `<div class="cc-vhs-replay">`;
        html += `<div class="cc-vhs-tracking"></div>`;
        html += `<div class="cc-vhs-replay-tag">⏪ VHS RECALL — ${(evt.callbackType || 'FOOTAGE').toUpperCase()}</div>`;
        html += `<div class="cc-vhs-replay-body">${evt.origEventText}</div>`;
        html += `</div>`;
      } else if (evt.isPlayback) {
        html += `<div class="cc-vhs-replay"><div class="cc-vhs-tracking"></div><div class="cc-vhs-replay-tag">⏪ PLAYBACK — ${(evt.callbackType || 'FOOTAGE').toUpperCase()}</div></div>`;
      }
      html += _svCard(evt, camId, ts);
    } else if (i === st.idx + 1) {
      html += `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">`;
      html += `<div class="cc-sv-reveal-btn" onclick="${_ccInlineReveal(stateKey, i, screenId, epNum)}">▶ NEXT ENTRY</div>`;
      html += `<div class="cc-sv-reveal-btn" style="opacity:0.55;font-size:9px;padding:6px 12px;letter-spacing:1px" onclick="${_ccInlineReveal(stateKey, events.length - 1, screenId, epNum)}">⏩ REVEAL ALL</div>`;
      html += `</div>`;
    }
  });

  if (st.idx >= events.length - 1 && events.length > 0) {
    html += `<div class="cc-sv-phase-end">▼ TRANSMISSION COMPLETE</div>`;
  }
  html += `</div>`;
  return html;
}

function _buildImmunityScreen(cc, ep, stateKey, screenId, tapeNum, tapeTotal) {
  const _tvState = window._tvState;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];
  const epNum = ep.num || 0;

  const sortedAsc = Object.entries(cc.personalScores)
    .sort(([, a], [, b]) => a - b)
    .map(([name, score]) => ({ name, score, isWinner: name === cc.immunityWinner }));

  const tickerItems = sortedAsc.map(e => `${e.name} — ${e.score.toFixed(1)}`).join('  ·  ');

  let html = `<div class="cc-bc">`;
  html += _monitorWall('bc', 'PHASE 5 — IMMUNITY RESULTS', tapeNum, tapeTotal);
  html += `<div class="cc-bc-signal-bar"></div>`;
  html += `<div class="cc-bc-header-label">▲ SIGNAL FOUND — EMERGENCY BROADCAST</div>`;
  html += `<div class="cc-bc-header-title">📡 IMMUNITY RESULTS</div>`;
  html += `<div class="cc-bc-header-sub">SCORES TRANSMITTED SECURELY</div>`;

  sortedAsc.forEach((entry, i) => {
    if (i > st.idx + 1) return;
    if (i <= st.idx) {
      const evt = { type: 'immunityScore', subtype: entry.isWinner ? 'immunityReveal' : 'score', player: entry.name, score: entry.score,
        text: entry.isWinner ? `${entry.name} — TOP SCORE: ${entry.score.toFixed(1)} — IMMUNITY WINNER` : `${entry.name} — ${entry.score.toFixed(1)}`,
        badgeText: entry.isWinner ? '🏆 IMMUNE' : `RANK #${sortedAsc.length - i}`, badgeClass: entry.isWinner ? 'gold' : '' };
      html += _bcCard(evt);
    } else if (i === st.idx + 1) {
      html += `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">`;
      html += `<div class="cc-bc-reveal-btn" onclick="${_ccInlineReveal(stateKey, i, screenId, epNum)}">▶ NEXT TRANSMISSION</div>`;
      html += `<div class="cc-bc-reveal-btn" style="opacity:0.55;font-size:9px;padding:6px 12px;letter-spacing:1px" onclick="${_ccInlineReveal(stateKey, sortedAsc.length - 1, screenId, epNum)}">⏩ REVEAL ALL</div>`;
      html += `</div>`;
    }
  });

  if (st.idx >= sortedAsc.length - 1 && sortedAsc.length > 0) {
    html += `<div class="cc-bc-phase-end">▲ END TRANSMISSION — TRIBAL COUNCIL FOLLOWS</div>`;
    html += `<div class="cc-ticker-wrap"><div class="cc-ticker">${tickerItems}  ·  ${tickerItems}</div></div>`;
  }
  html += `</div>`;
  return html;
}

// ── PER-SCREEN EXPORTS (consumed by vp-screens.js) ──

export function rpBuildCCFlood(ep) {
  const cc = ep.campCastaways;
  if (!cc?.timeline?.length) return '';
  const epNum = ep.num || 0;
  const stateKey = `cc_cold_${epNum}`;
  const tapeTotal = 3 + (cc.groups?.length || 2);
  return `<style>${CC_STYLES}</style><div class="rp-page">` + _buildColdOpen(cc, ep, stateKey, 'cc-flood', tapeTotal) + `</div>`;
}

export function rpBuildCCGroup(ep, groupObj) {
  const cc = ep.campCastaways;
  if (!cc?.timeline?.length) return '';
  const epNum = ep.num || 0;
  const gLabel = groupObj.label;
  const stateKey = `cc_grp_${gLabel}_${epNum}`;
  const groupIdx = (cc.groups || []).findIndex(g => g.label === gLabel);
  const tapeNum = 2 + groupIdx;
  const tapeTotal = 3 + (cc.groups?.length || 2);
  const screenId = `cc-group-${gLabel}`;
  return `<style>${CC_STYLES}</style><div class="rp-page">` + _buildGroupScreen(cc, groupObj, ep, stateKey, screenId, tapeNum, tapeTotal) + `</div>`;
}

export function rpBuildCCNight(ep) {
  const cc = ep.campCastaways;
  if (!cc?.timeline?.length) return '';
  const epNum = ep.num || 0;
  const stateKey = `cc_night_${epNum}`;
  const nGroups = cc.groups?.length || 2;
  const tapeNum = 2 + nGroups;
  const tapeTotal = 3 + nGroups;
  return `<style>${CC_STYLES}</style><div class="rp-page">` + _buildNightScreen(cc, ep, stateKey, 'cc-night', tapeNum, tapeTotal) + `</div>`;
}

export function rpBuildCCRegroup(ep) {
  const cc = ep.campCastaways;
  if (!cc?.timeline?.length) return '';
  const epNum = ep.num || 0;
  const stateKey = `cc_regroup_${epNum}`;
  const nGroups = cc.groups?.length || 2;
  const tapeNum = 3 + nGroups;
  const tapeTotal = 3 + nGroups;
  return `<style>${CC_STYLES}</style><div class="rp-page">` + _buildRegroupScreen(cc, ep, stateKey, 'cc-regroup', tapeNum, tapeTotal) + `</div>`;
}

export function rpBuildCCStorm(ep) {
  const cc = ep.campCastaways;
  if (!cc?.timeline?.length) return '';
  const epNum = ep.num || 0;
  const stateKey = `cc_storm_${epNum}`;
  const nGroups = cc.groups?.length || 2;
  const tapeNum = 4 + nGroups;
  const tapeTotal = 5 + nGroups;
  return `<style>${CC_STYLES}</style><div class="rp-page">` + _buildStormScreen(cc, ep, stateKey, 'cc-storm', tapeNum, tapeTotal) + `</div>`;
}

export function rpBuildCCImmunity(ep) {
  const cc = ep.campCastaways;
  if (!cc?.timeline?.length) return '';
  const epNum = ep.num || 0;
  const stateKey = `cc_imm_${epNum}`;
  const nGroups = cc.groups?.length || 2;
  const tapeNum = 5 + nGroups;
  const tapeTotal = 5 + nGroups;
  return `<style>${CC_STYLES}</style><div class="rp-page">` + _buildImmunityScreen(cc, ep, stateKey, 'cc-immunity', tapeNum, tapeTotal) + `</div>`;
}

// Legacy single-screen export kept for backward compat
export function rpBuildCampCastaways(ep) {
  return rpBuildCCFlood(ep);
}
