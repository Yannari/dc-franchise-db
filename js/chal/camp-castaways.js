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
    : ['underdog', 'goat', 'floater'].includes(arch) ? 'underdog'
    : ['hothead', 'chaos-agent'].includes(arch) ? 'hothead'
    : arch === 'wildcard' ? 'wildcard' : 'default';
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
    const eventCount = Math.max(3, group.length + 1 + (Math.random() < 0.3 ? 1 : 0));
    let fired = 0;

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
        subject !== defender && (wText = wText); // use defender as subject for display
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
          personalScores[sleeper] -= 1.0;
          gs._castawaysHeat = gs._castawaysHeat || [];
          gs._castawaysHeat.push({ target: sleeper, amount: 1.0, expiresEp: (gs.episode || 1) + 2 });
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
  });

  // ══ MR. COCONUT BREAKDOWN ══
  const candidates = activePlayers.map(n => ({ name: n, score: pStats(n).mental + pStats(n).temperament }))
    .sort((a, b) => a.score - b.score);
  const breakdowns = [];
  if (Math.random() < 0.30) {
    const bd = _fireBreakdown(candidates[0].name, groups, timeline, cameraFlags, personalScores);
    if (bd) breakdowns.push(bd);
  }
  if (candidates.length > 1 && Math.random() < 0.15) {
    const bd = _fireBreakdown(candidates[1].name, groups, timeline, cameraFlags, personalScores);
    if (bd) breakdowns.push(bd);
  }

  // ══ PHASE 3 — REGROUPING ══
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
      if (bond >= 3 && Math.random() < 0.70) {
        regroupedPairs.add(pairKey);
        const text = _rp(REUNION_TEXTS.emotional)(a, b, pronouns(a), pronouns(b));
        personalScores[a] += 0.5; personalScores[b] += 0.5; addBond(a, b, 0.3);
        if (bond >= 4) { popDelta(a, 1); popDelta(b, 1); }
        timeline.push({ type: 'reunion', subtype: 'emotional', phase: 3, players: [a, b], text, badgeText: 'REUNION', badgeClass: 'green' });
      } else if (bond <= -1 && Math.random() < 0.60) {
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
    const nearby = activePlayers.filter(p => p !== rafter).slice(0, 3);
    nearby.forEach(p => addBond(p, rafter, 0.3));
    timeline.push({ type: 'reunion', subtype: 'raftCircles', phase: 3, player: rafter, players: [rafter, ...nearby], text, badgeText: 'RAFT CIRCLES BACK', badgeClass: 'yellow' });
    cameraFlags.push({ player: rafter, type: 'raftCircles', text: `${rafter}'s heroic raft returns to exactly where it started.`, reactionType: 'entertained' });
  }

  // War paint preparation (boldness ≥ 7)
  const warPainters = activePlayers.filter(p => pStats(p).boldness >= 7);
  if (warPainters.length > 0) {
    warPainters.forEach(p => { personalScores[p] += 1.0; });
    activePlayers.filter(p => !warPainters.includes(p)).forEach(p => { personalScores[p] += 0.2; });
    timeline.push({ type: 'reunion', subtype: 'warPaint', phase: 3, players: warPainters, text: _rp(REUNION_TEXTS.warPaint)(warPainters), badgeText: 'WAR PARTY', badgeClass: 'red' });
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

  // Discovery beat
  const discoverer = activePlayers.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
  const discText = _rp(STORM_TEXTS.discovery)(discoverer, pronouns(discoverer));
  personalScores[discoverer] += 1.0;
  cameraFlags.push({ player: discoverer, type: 'discovery', text: `${discoverer} spots the smoke first.`, reactionType: 'impressed' });
  timeline.push({ type: 'stormEvent', subtype: 'discovery', phase: 4, player: discoverer, players: [discoverer], text: discText, badgeText: 'SMOKE SPOTTED', badgeClass: 'gold' });

  // The Charge
  activePlayers.forEach(name => {
    const s = pStats(name);
    if (s.boldness >= 7) {
      personalScores[name] += 2.0; popDelta(name, 1);
    } else if (s.boldness >= 4) {
      personalScores[name] += 0.5;
    }
  });
  const chargeLeaders = activePlayers.filter(p => pStats(p).boldness >= 7);
  if (chargeLeaders.length > 0) {
    timeline.push({ type: 'stormEvent', subtype: 'charge', phase: 4, players: chargeLeaders, text: `${chargeLeaders.join(', ')} ${chargeLeaders.length === 1 ? 'leads' : 'lead'} the charge through the jungle. The war paint was a good call.`, badgeText: 'THE CHARGE', badgeClass: 'red' });
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
  // Prioritize breakdown playback
  const breakdownFlag = cameraFlags.find(f => f.type === 'breakdown');
  if (breakdownFlag && !playbackFlags.includes(breakdownFlag)) {
    playbackFlags[0] = breakdownFlag;
  }
  playbackFlags.forEach(flag => {
    const subject = flag.player;
    const sPr = pronouns(subject);
    const playText = _rp(STORM_TEXTS.playback)(subject, sPr, flag.text);
    personalScores[subject] -= 0.5; // embarrassing
    if (flag.type === 'breakdown') personalScores[subject] -= 0.5; // extra penalty
    if (['wildlifeBrave', 'foodSuccess', 'treehouse', 'calledIt'].includes(flag.type)) {
      personalScores[subject] += 0.5; // pride, net neutral
    }
    timeline.push({ type: 'stormEvent', subtype: 'playback', phase: 4, player: subject, players: [subject], text: playText + ` [PLAYBACK: ${flag.text}]`, badgeText: '▶ PLAYBACK', badgeClass: 'purple', isPlayback: true, flagType: flag.type, reactionType: flag.reactionType });
    timeline.push({ type: 'chrisReaction', phase: 4, reactionType: flag.reactionType, text: _rp(CHRIS_REACTIONS[flag.reactionType] || CHRIS_REACTIONS.entertained) });
  });

  // The Reveal
  const revealText = _rp(STORM_TEXTS.reveal);
  timeline.push({ type: 'stormEvent', subtype: 'reveal', phase: 4, players: activePlayers, text: revealText, badgeText: 'THE REVEAL', badgeClass: 'gold' });
  activePlayers.forEach(name => {
    if (pStats(name).intuition >= 7) {
      personalScores[name] += 0.5;
    } else {
      personalScores[name] -= 0.3;
    }
  });

  // Endurance Bonus
  activePlayers.forEach(name => {
    if (personalScores[name] >= 5.0) {
      personalScores[name] += 1.0;
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

const _tvState = {};

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

// ── MODE TRANSITION GLITCH ──
function _glitchTransition(label) {
  return `<div style="position:relative;height:18px;overflow:hidden;margin:6px 0;background:${SV_BG}">
    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:9px;letter-spacing:4px;color:${SV_GREEN};opacity:0.6">▓▒░ ${label} ░▒▓</div>
    <div style="position:absolute;top:0;left:0;right:0;height:1px;background:${SV_GREEN};opacity:0.3"></div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:1px;background:${SV_GREEN};opacity:0.3"></div>
  </div>`;
}

// ── SURVEILLANCE CARD ──
function _svCard(evt, camId, ts) {
  const isBad = ['floodReaction', 'breakdown'].includes(evt.type) && !['emotionalReunion', 'soloResolve', 'stargazing'].includes(evt.subtype);
  const isPlayback = evt.isPlayback;
  const accentColor = isPlayback ? '#a78bfa' : SV_DIM;
  const borderColor = isPlayback ? '#a78bfa' : SV_DIM;
  let html = `<div style="position:relative;margin-bottom:5px;padding:8px 10px;background:${SV_BG};border:1px solid ${borderColor}33;border-left:2px solid ${borderColor};font-family:monospace">`;
  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">`;
  html += `<span style="font-size:8px;color:${accentColor};letter-spacing:1px">${camId || 'CAM-01 · ISLAND EAST'}</span>`;
  html += `<span style="font-size:8px;color:${SV_DIM};letter-spacing:1px">${ts || '00:00:00'}</span>`;
  html += `</div>`;
  if (isPlayback) {
    html += `<div style="display:inline-block;padding:1px 6px;background:#a78bfa22;border:1px solid #a78bfa;font-size:7px;letter-spacing:2px;color:#a78bfa;margin-bottom:4px">▶ PLAYBACK</div>`;
  }
  if (evt.player) {
    const port = (typeof rpPortrait === 'function') ? rpPortrait(evt.player, 'xs') : '';
    html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">${port}<span style="font-size:9px;color:${SV_GREEN};font-weight:700">${evt.player}</span></div>`;
  } else if (evt.players?.length === 1) {
    const port = (typeof rpPortrait === 'function') ? rpPortrait(evt.players[0], 'xs') : '';
    html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">${port}<span style="font-size:9px;color:${SV_GREEN};font-weight:700">${evt.players[0]}</span></div>`;
  }
  html += `<div style="font-size:11px;color:${SV_TEXT};line-height:1.5">${evt.text || ''}</div>`;
  if (evt.badgeText) html += `<div style="margin-top:4px"><span style="font-size:8px;padding:1px 5px;border:1px solid ${SV_DIM};color:${SV_DIM};letter-spacing:1px">${evt.badgeText}</span></div>`;
  html += `</div>`;
  return html;
}

// ── DIARY PANEL ──
function _diaryPanel(evt, rotIdx) {
  const rots = [-2, 1.5, -1, 2, -0.5, 1, -1.5, 0.5];
  const rot = rots[rotIdx % rots.length];
  const badgeColors = { green: DI_STAMP, red: '#8b1a1a', yellow: '#7a5200', blue: '#1a3a7a', gold: '#6a4a00', pink: '#6a1a3a', grey: '#4a4a4a', purple: '#3a1a6a' };
  const badgeColor = badgeColors[evt.badgeClass || 'grey'] || DI_STAMP;
  let html = `<div style="transform:rotate(${rot}deg);transform-origin:center;margin:6px 4px;padding:10px 12px;background:${DI_BG};border:2px solid ${DI_BORDER};box-shadow:2px 2px 4px rgba(0,0,0,0.2);position:relative">`;
  // Ink texture
  html += `<div style="position:absolute;inset:0;background:repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,0.02) 4px,rgba(0,0,0,0.02) 5px);pointer-events:none"></div>`;
  if (evt.badgeText) {
    html += `<div style="position:absolute;top:6px;right:6px;transform:rotate(${-rot * 2}deg);font-family:monospace;font-size:7px;font-weight:700;letter-spacing:1px;color:${badgeColor};border:1px solid ${badgeColor};padding:1px 4px;opacity:0.85">${evt.badgeText}</div>`;
  }
  if (evt.player || (evt.players?.length === 1)) {
    const pName = evt.player || evt.players[0];
    const port = (typeof rpPortrait === 'function') ? rpPortrait(pName, 'xs') : '';
    html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">${port}<span style="font-family:serif;font-size:10px;font-weight:700;color:${DI_INK}">${pName}</span></div>`;
  } else if (evt.players?.length > 1) {
    const ports = evt.players.map(p => (typeof rpPortrait === 'function') ? rpPortrait(p, 'xs') : '').join('');
    html += `<div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;flex-wrap:wrap">${ports}<span style="font-family:serif;font-size:9px;color:${DI_INK}">${evt.players.join(', ')}</span></div>`;
  }
  html += `<div style="font-family:serif;font-size:12px;color:${DI_INK};line-height:1.6">${evt.text || ''}</div>`;
  html += `</div>`;
  return html;
}

// ── BROADCAST CARD ──
function _bcCard(evt) {
  const isSignal = evt.subtype === 'immunityReveal';
  const accentColor = isSignal ? BC_SIGNAL : BC_TEXT;
  let html = `<div style="margin-bottom:5px;padding:8px 12px;background:${BC_BG};border:1px solid ${accentColor}22;border-left:2px solid ${accentColor};font-family:monospace">`;
  html += `<div style="font-size:8px;letter-spacing:2px;color:${accentColor};margin-bottom:3px">${isSignal ? '▲ SIGNAL FOUND' : '● TRANSMISSION'}</div>`;
  if (evt.player || (evt.players?.length === 1)) {
    const pName = evt.player || evt.players[0];
    const port = (typeof rpPortrait === 'function') ? rpPortrait(pName, 'xs') : '';
    html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">${port}<span style="font-size:10px;color:${isSignal ? BC_SIGNAL : BC_TEXT};font-weight:700">${pName}</span></div>`;
  }
  html += `<div style="font-size:12px;color:${BC_TEXT};line-height:1.5">${evt.text || ''}</div>`;
  if (evt.score !== undefined) {
    const barPct = Math.max(5, Math.min(100, ((evt.score + 5) / 20) * 100));
    html += `<div style="margin-top:5px;height:4px;background:#ffffff11;border-radius:2px;overflow:hidden"><div style="width:${barPct}%;height:100%;background:${BC_SIGNAL};border-radius:2px"></div></div>`;
  }
  if (evt.badgeText) html += `<div style="margin-top:3px"><span style="font-size:8px;color:${accentColor};letter-spacing:1px">[ ${evt.badgeText} ]</span></div>`;
  html += `</div>`;
  return html;
}

// ── CLICK-TO-REVEAL HELPERS ──
function _revealBtn(stateKey, step, total) {
  return `<div onclick="window._ccReveal('${stateKey}',${step},${total})" style="cursor:pointer;padding:8px 14px;margin-bottom:5px;border-radius:4px;border:1px dashed ${SV_GREEN}44;background:${SV_GREEN}08;text-align:center;font-family:monospace;font-size:10px;color:${SV_DIM}">▶ NEXT ENTRY</div>`;
}

// ══ SECTION BUILDERS ══

function _buildColdOpen(cc, ep, stateKey) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];
  const events = cc.timeline.filter(e => e.phase === 0);

  let html = `<div style="background:${SV_BG};padding:14px 12px;border:1px solid ${SV_GREEN}22;position:relative">`;
  // Scanlines
  html += `<div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,255,65,0.025) 0px,transparent 2px);pointer-events:none"></div>`;
  // Header
  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">`;
  html += `<span style="font-family:monospace;font-size:9px;color:${SV_DIM};letter-spacing:2px">◉ CAM-00 · CAMP WAWANAKWA OVERVIEW</span>`;
  html += `<span style="font-family:monospace;font-size:9px;color:${SV_DIM};letter-spacing:1px">00:00:00 ▶ LIVE</span>`;
  html += `</div>`;
  html += `<div style="font-family:monospace;font-size:14px;font-weight:700;color:${SV_GREEN};letter-spacing:3px;margin-bottom:2px">📡 CAMP CASTAWAYS</div>`;
  html += `<div style="font-family:monospace;font-size:9px;color:${SV_DIM};letter-spacing:1px;margin-bottom:10px">PHASE 0 — THE FLOOD</div>`;

  let shown = 0;
  events.forEach((evt, i) => {
    if (i > st.idx + 1) return;
    if (i <= st.idx) { html += _svCard(evt, 'CAM-00', `00:${String(i * 4).padStart(2, '0')}:${String(i * 7 % 60).padStart(2, '0')}`); shown++; }
    else if (i === st.idx + 1) { html += _revealBtn(stateKey, i, events.length - 1); }
  });

  if (st.idx >= events.length - 1 && events.length > 0) {
    html += `<div style="text-align:center;font-family:monospace;font-size:9px;color:${SV_DIM};padding:6px;letter-spacing:1px">▼ END PHASE 0 — GROUPS FORMING</div>`;
  }
  html += `</div>`;
  return html;
}

function _buildGroupScreen(cc, groupObj, ep, stateKey) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];
  const events = cc.timeline.filter(e => e.phase === 1 && e.group === groupObj.label);

  let html = `<div style="background:${DI_BG};padding:14px 12px;border:2px solid ${DI_BORDER};position:relative;overflow:hidden">`;
  // Paper texture
  html += `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 20% 80%,rgba(139,82,48,0.06) 0%,transparent 70%);pointer-events:none"></div>`;
  // Header
  html += `<div style="font-family:serif;font-size:14px;font-weight:700;color:${DI_INK};margin-bottom:2px">📓 GROUP ${groupObj.label}</div>`;
  html += `<div style="font-family:monospace;font-size:9px;color:${DI_BORDER};letter-spacing:1px;margin-bottom:4px">PHASE 1 — SCATTERED</div>`;
  // Members with portraits
  html += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;padding:6px;background:${DI_BG};border:1px solid ${DI_BORDER}22">`;
  groupObj.members.forEach(m => {
    const port = (typeof rpPortrait === 'function') ? rpPortrait(m, 'sm') : '';
    html += `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">${port}<span style="font-family:serif;font-size:9px;color:${DI_INK}">${m}</span></div>`;
  });
  html += `</div>`;

  let panelIdx = 0;
  events.forEach((evt, i) => {
    if (i > st.idx + 1) return;
    if (i <= st.idx) { html += _diaryPanel(evt, panelIdx++); }
    else if (i === st.idx + 1) { html += `<div onclick="window._ccReveal('${stateKey}',${i},${events.length - 1})" style="cursor:pointer;padding:8px 12px;border:1px dashed ${DI_BORDER};background:rgba(45,26,14,0.04);text-align:center;font-family:serif;font-size:10px;color:${DI_BORDER};margin:4px">▷ Turn the page</div>`; }
  });

  if (st.idx >= events.length - 1 && events.length > 0) {
    html += `<div style="text-align:right;font-family:serif;font-size:8px;color:${DI_BORDER};margin-top:6px;font-style:italic">— Night falls on Group ${groupObj.label} —</div>`;
  }
  html += `</div>`;
  return html;
}

function _buildNightScreen(cc, ep, stateKey) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];
  const events = cc.timeline.filter(e => e.phase === 2);

  let html = `<div style="background:${DI_BG};padding:14px 12px;border:2px solid ${DI_BORDER};position:relative">`;
  html += `<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 60%,rgba(45,26,14,0.08) 100%);pointer-events:none"></div>`;
  html += `<div style="font-family:serif;font-size:14px;font-weight:700;color:${DI_INK};margin-bottom:2px">🌙 THE NIGHT</div>`;
  html += `<div style="font-family:monospace;font-size:9px;color:${DI_BORDER};letter-spacing:1px;margin-bottom:10px">PHASE 2 — DARKNESS, HUNGER, TRUTH</div>`;

  let panelIdx = 0;
  events.forEach((evt, i) => {
    if (i > st.idx + 1) return;
    if (i <= st.idx) {
      if (evt.type === 'chrisReaction') {
        // Surveillance interrupt during diary
        html += `<div style="margin:6px 0;padding:6px 10px;background:${SV_BG};border-left:2px solid ${SV_DIM};font-family:monospace;font-size:10px;color:${SV_DIM}">`;
        html += `<span style="color:${SV_GREEN};font-size:8px;letter-spacing:1px">◉ CAM INTERRUPTS · SURVEILLANCE</span><br>${evt.text}`;
        html += `</div>`;
      } else if (evt.type === 'breakdown') {
        // Special breakdown card
        html += `<div style="transform:rotate(-1deg);margin:8px 4px;padding:12px;background:${DI_BG};border:3px solid ${DI_STAMP};box-shadow:3px 3px 8px rgba(139,26,26,0.25);position:relative">`;
        html += `<div style="position:absolute;top:4px;right:6px;font-family:monospace;font-size:8px;color:${DI_STAMP};letter-spacing:2px;font-weight:700">${evt.badgeText}</div>`;
        if (evt.player) {
          const port = (typeof rpPortrait === 'function') ? rpPortrait(evt.player, 'sm') : '';
          html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">${port}<span style="font-family:serif;font-size:11px;font-weight:700;color:${DI_STAMP}">${evt.player}</span></div>`;
        }
        html += `<div style="font-family:serif;font-size:12px;color:${DI_INK};line-height:1.6">${evt.text}</div>`;
        if (evt.objectName) html += `<div style="margin-top:4px;font-family:serif;font-size:9px;color:${DI_STAMP};font-style:italic">"${evt.objectName}"</div>`;
        html += `</div>`;
      } else {
        html += _diaryPanel(evt, panelIdx++);
      }
    } else if (i === st.idx + 1) {
      html += `<div onclick="window._ccReveal('${stateKey}',${i},${events.length - 1})" style="cursor:pointer;padding:8px 12px;border:1px dashed ${DI_BORDER};background:rgba(45,26,14,0.04);text-align:center;font-family:serif;font-size:10px;color:${DI_BORDER};margin:4px">▷ Turn the page</div>`;
    }
  });

  if (st.idx >= events.length - 1 && events.length > 0) {
    html += `<div style="text-align:right;font-family:serif;font-size:8px;color:${DI_BORDER};margin-top:6px;font-style:italic">— Dawn approaches —</div>`;
  }
  html += `</div>`;
  return html;
}

function _buildRegroupScreen(cc, ep, stateKey) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];
  const events = cc.timeline.filter(e => e.phase === 3);

  let html = `<div style="background:${DI_BG};padding:14px 12px;border:2px solid ${DI_BORDER};position:relative">`;
  html += `<div style="font-family:serif;font-size:14px;font-weight:700;color:${DI_INK};margin-bottom:2px">🧭 REGROUPING</div>`;
  html += `<div style="font-family:monospace;font-size:9px;color:${DI_BORDER};letter-spacing:1px;margin-bottom:10px">PHASE 3 — FINDING EACH OTHER</div>`;

  let panelIdx = 0;
  events.forEach((evt, i) => {
    if (i > st.idx + 1) return;
    if (i <= st.idx) {
      if (evt.type === 'chrisReaction') {
        html += `<div style="margin:6px 0;padding:6px 10px;background:${SV_BG};border-left:2px solid ${SV_DIM};font-family:monospace;font-size:10px;color:${SV_DIM}"><span style="color:${SV_GREEN};font-size:8px;letter-spacing:1px">◉ SURVEILLANCE FLASH</span><br>${evt.text}</div>`;
      } else { html += _diaryPanel(evt, panelIdx++); }
    } else if (i === st.idx + 1) {
      html += `<div onclick="window._ccReveal('${stateKey}',${i},${events.length - 1})" style="cursor:pointer;padding:8px 12px;border:1px dashed ${DI_BORDER};background:rgba(45,26,14,0.04);text-align:center;font-family:serif;font-size:10px;color:${DI_BORDER};margin:4px">▷ Turn the page</div>`;
    }
  });
  html += `</div>`;
  return html;
}

function _buildStormScreen(cc, ep, stateKey) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];
  const events = cc.timeline.filter(e => e.phase === 4);

  let html = `<div style="background:${SV_BG};padding:14px 12px;border:1px solid ${SV_GREEN}22;position:relative">`;
  html += `<div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,255,65,0.025) 0px,transparent 2px);pointer-events:none"></div>`;
  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">`;
  html += `<span style="font-family:monospace;font-size:9px;color:${SV_DIM};letter-spacing:2px">◉ CAM-04 · CHRIS'S CAMP</span>`;
  html += `<span style="font-family:monospace;font-size:9px;color:${SV_DIM};letter-spacing:1px">DAYLIGHT ▶ RECORDING</span>`;
  html += `</div>`;
  html += `<div style="font-family:monospace;font-size:14px;font-weight:700;color:${SV_GREEN};letter-spacing:3px;margin-bottom:2px">⚡ STORMING THE CAMP</div>`;
  html += `<div style="font-family:monospace;font-size:9px;color:${SV_DIM};letter-spacing:1px;margin-bottom:10px">PHASE 4 — CLIMAX</div>`;

  const camIds = ['CAM-04', 'CAM-05', 'CAM-06', 'CAM-07', 'CAM-08', 'CAM-09'];
  events.forEach((evt, i) => {
    if (i > st.idx + 1) return;
    if (i <= st.idx) {
      const camId = camIds[i % camIds.length];
      const ts = `0${Math.floor(8 + i * 0.3)}:${String(i * 7 % 60).padStart(2, '0')}:${String(i * 11 % 60).padStart(2, '0')}`;
      html += _svCard(evt, camId, ts);
    } else if (i === st.idx + 1) {
      html += _revealBtn(stateKey, i, events.length - 1);
    }
  });

  if (st.idx >= events.length - 1 && events.length > 0) {
    html += `<div style="text-align:center;font-family:monospace;font-size:9px;color:${SV_DIM};padding:6px;letter-spacing:1px">▼ TRANSMISSION COMPLETE</div>`;
  }
  html += `</div>`;
  return html;
}

function _buildImmunityScreen(cc, ep, stateKey) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];

  // Build score cards: sorted lowest to highest (reveal order, winner last)
  const sortedAsc = Object.entries(cc.personalScores)
    .sort(([, a], [, b]) => a - b)
    .map(([name, score]) => ({ name, score, isWinner: name === cc.immunityWinner }));

  let html = `<div style="background:${BC_BG};padding:14px 12px;border:1px solid ${BC_SIGNAL}33;position:relative">`;
  // Signal bar
  html += `<div style="height:4px;background:linear-gradient(90deg,${BC_ALERT} 0%,${BC_SIGNAL} 100%);margin-bottom:10px;animation:pulse 2s infinite"></div>`;
  html += `<div style="font-family:monospace;font-size:9px;color:${BC_SIGNAL};letter-spacing:2px;margin-bottom:4px">▲ SIGNAL FOUND — EMERGENCY BROADCAST</div>`;
  html += `<div style="font-family:monospace;font-size:14px;font-weight:700;color:${BC_TEXT};letter-spacing:2px;margin-bottom:2px">📡 IMMUNITY RESULTS</div>`;
  html += `<div style="font-family:monospace;font-size:9px;color:${BC_SIGNAL};margin-bottom:10px">SCORES TRANSMITTED SECURELY</div>`;

  sortedAsc.forEach((entry, i) => {
    if (i > st.idx + 1) return;
    if (i <= st.idx) {
      const evt = { type: 'immunityScore', subtype: entry.isWinner ? 'immunityReveal' : 'score', player: entry.name, score: entry.score, text: entry.isWinner ? `${entry.name} — TOP SCORE: ${entry.score.toFixed(1)} — IMMUNITY WINNER` : `${entry.name} — ${entry.score.toFixed(1)}`, badgeText: entry.isWinner ? '🏆 IMMUNE' : `RANK #${sortedAsc.length - i}` };
      html += _bcCard(evt);
    } else if (i === st.idx + 1) {
      html += `<div onclick="window._ccReveal('${stateKey}',${i},${sortedAsc.length - 1})" style="cursor:pointer;padding:8px 12px;border:1px solid ${BC_SIGNAL}33;background:${BC_SIGNAL}08;text-align:center;font-family:monospace;font-size:10px;color:${BC_SIGNAL};margin-bottom:4px">▶ NEXT TRANSMISSION</div>`;
    }
  });

  if (st.idx >= sortedAsc.length - 1 && sortedAsc.length > 0) {
    html += `<div style="text-align:center;font-family:monospace;font-size:9px;color:${BC_SIGNAL};padding:6px;letter-spacing:1px">▲ END TRANSMISSION — TRIBAL COUNCIL FOLLOWS</div>`;
  }
  html += `</div>`;
  return html;
}

// ── MASTER BUILDER ──
export function rpBuildCampCastaways(ep) {
  const cc = ep.campCastaways;
  if (!cc?.timeline?.length) return '';

  const epNum = ep.num || 0;
  const keys = {
    coldOpen: `cc_cold_${epNum}`,
    groups: cc.groups.map((g, i) => `cc_grp_${g.label}_${epNum}`),
    night: `cc_night_${epNum}`,
    regroup: `cc_regroup_${epNum}`,
    storm: `cc_storm_${epNum}`,
    immunity: `cc_imm_${epNum}`,
  };

  // Initialize all states
  [keys.coldOpen, ...keys.groups, keys.night, keys.regroup, keys.storm, keys.immunity].forEach(k => {
    if (!_tvState[k]) _tvState[k] = { idx: -1 };
  });

  let html = `<div class="cc-wrap" style="display:flex;flex-direction:column;gap:4px">`;

  // Screen 1: Flood Cold Open (Surveillance)
  html += _buildColdOpen(cc, ep, keys.coldOpen);
  html += _glitchTransition('SWITCHING TO FIELD NOTES');

  // Screens 2-N: Scattered Groups (Diary)
  cc.groups.forEach((group, i) => {
    html += _buildGroupScreen(cc, group, ep, keys.groups[i]);
    if (i < cc.groups.length - 1) html += `<div style="height:4px;background:${DI_BG};margin:2px 0"></div>`;
  });
  html += _glitchTransition('SWITCHING TO NIGHT LOG');

  // Screen: The Night (Diary + Surveillance interrupts)
  html += _buildNightScreen(cc, ep, keys.night);
  html += _glitchTransition('SWITCHING TO FIELD NOTES');

  // Screen: Regrouping (Diary → Surveillance blend)
  html += _buildRegroupScreen(cc, ep, keys.regroup);
  html += _glitchTransition('SWITCHING TO SURVEILLANCE FEED');

  // Screen: Storming the Camp (Surveillance)
  html += _buildStormScreen(cc, ep, keys.storm);
  html += _glitchTransition('SIGNAL FOUND — EMERGENCY BROADCAST');

  // Screen: Immunity Results (Broadcast)
  html += _buildImmunityScreen(cc, ep, keys.immunity);

  html += `</div>`;

  // Expose reveal handler
  window._ccReveal = function (stateKey, idx, total) {
    const scrollEl = document.querySelector('.vp-content') || document.querySelector('.episode-vp') || window;
    const scrollTop = scrollEl?.scrollTop || 0;
    _tvState[stateKey] = _tvState[stateKey] || { idx: -1 };
    _tvState[stateKey].idx = idx;
    if (typeof buildVPScreens === 'function') {
      buildVPScreens(ep);
      const screens = document.querySelectorAll('[data-vp-screen-id]');
      screens.forEach((el, i) => { if (el.dataset.vpScreenId && el.dataset.vpScreenId.includes('camp-castaways')) { if (typeof setVPScreen === 'function') setVPScreen(i); } });
    }
    if (scrollEl && scrollEl !== window) scrollEl.scrollTop = scrollTop;
  };

  window._ccRevealAll = function (epN) {
    Object.keys(_tvState).filter(k => k.includes(`_${epN}`)).forEach(k => {
      const evts = cc.timeline;
      _tvState[k].idx = evts.length;
    });
    if (typeof buildVPScreens === 'function') buildVPScreens(ep);
  };

  return html;
}
