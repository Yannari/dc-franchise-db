import { gs, players } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { getBond, addBond, getPerceivedBond } from '../bonds.js';
import { computeHeat } from '../alliances.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// Safety guard: _tvState may not be initialized yet if this module loads before main.js
if (typeof window !== 'undefined' && !window._tvState) window._tvState = {};

// ══════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════

function _rp(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}

// Archetype classification (per CLAUDE.md rules)
function _isVillain(name) {
  const arch = (players || []).find(p => p.name === name)?.archetype;
  return ['villain', 'mastermind', 'schemer'].includes(arch);
}
function _isNice(name) {
  const arch = (players || []).find(p => p.name === name)?.archetype;
  return ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(arch);
}
function _isNeutral(name) { return !_isVillain(name) && !_isNice(name); }
function _canScheme(name) {
  if (_isVillain(name)) return true;
  if (_isNice(name)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}
function _archOf(name) {
  return (players || []).find(p => p.name === name)?.archetype || 'floater';
}
function _noise(lo, hi) { return lo + Math.random() * (hi - lo); }

// ══════════════════════════════════════════════════════
// TEXT POOLS
// ══════════════════════════════════════════════════════

const CHEF_INTRO = [
  `Chef steps off the helicopter in full camo. "Listen up, maggots. Chris is at some award show. I'm in charge. Your challenge: get back to camp. First pair to tag the totem pole wins. Questions? Good. I didn't ask."`,
  `The helicopter kicks up dust. Chef throws two bags on the ground. "Find camp. Tag the pole. Don't die. Chris says hi. He doesn't, but I'm supposed to say that."`,
  `Chef lands hard, surveys the group like he's selecting a firing squad. "North. Camp is north. You've got a map, a compass, and each other. That last one's the worst tool in the bag."`,
];

const CHEF_DEPART = [
  `Chef boards the helicopter. "Don't die. The paperwork is BRUTAL."`,
  `"I'll be at camp. Reading. In French." Chef disappears into the sky.`,
  `"One more thing—" The helicopter is already gone. Nobody heard the rest.`,
];

const CONFESSIONAL_TEXTS = {
  villain: [
    (n, pr) => `Confessional — ${n}: "${pr.Sub} ${pr.sub==='they'?'are':'is'} already calculating. Partner? Useful until ${pr.sub} ${pr.sub==='they'?'aren\'t':'isn\'t'}."`,
    (n, pr) => `Confessional — ${n}: "Pairs? Fine. I'll let ${pr.posAdj} partner do the heavy lifting. Literally."`,
  ],
  hothead: [
    (n, pr) => `Confessional — ${n}: "A MONSTER? In the WOODS? Let's GO. I've been waiting for this."`,
    (n, pr) => `Confessional — ${n}: "Finally, something worth getting angry about."`,
  ],
  social: [
    (n, pr) => `Confessional — ${n}: "Sleeping outside? In the DIRT? With BUGS? This is a human rights violation."`,
    (n, pr) => `Confessional — ${n}: "${pr.Sub} ${pr.sub==='they'?'are':'is'} already thinking about who to talk to when the pairs merge at the cave."`,
  ],
  hero: [
    (n, pr) => `Confessional — ${n}: "I don't care about winning. I care about making sure my partner gets through this."`,
    (n, pr) => `Confessional — ${n}: "${pr.Sub} ${pr.sub==='they'?'look':'looks'} at ${pr.posAdj} partner. 'We've got this. Together.'"`,
  ],
  underdog: [
    (n, pr) => `Confessional — ${n}: "Nobody expects me to make it back first. Good."`,
    (n, pr) => `Confessional — ${n}: "I've been underestimated my whole life. The woods don't scare me."`,
  ],
  beast: [
    (n, pr) => `Confessional — ${n}: "Cardio day. Love it."`,
    (n, pr) => `Confessional — ${n}: "This is basically a workout with extra steps. I'm ready."`,
  ],
  wildcard: [
    (n, pr) => `Confessional — ${n}: "${pr.Sub} ${pr.sub==='they'?'pick':'picks'} up a stick, sniffs it, and nods. 'The forest has accepted us.'"`,
    (n, pr) => `Confessional — ${n}: "I've never been lost in my life. I have, however, been aggressively somewhere else."`,
  ],
  perceptive: [
    (n, pr) => `Confessional — ${n}: "${pr.Sub} ${pr.sub==='they'?'are':'is'} already watching the other pair. Reading posture, checking who's nervous."`,
    (n, pr) => `Confessional — ${n}: "I don't need to be fastest. I need to know what they're planning."`,
  ],
  goat: [
    (n, pr) => `Confessional — ${n}: "We're going to DIE out here. We're ALL going to DIE."`,
    (n, pr) => `Confessional — ${n}: "${n} stares at the trees like they're closing in. They might be."`,
  ],
  default: [
    (n, pr) => `Confessional — ${n}: "${pr.Sub} ${pr.sub==='they'?'take':'takes'} a breath and looks around. The forest is huge. Camp is somewhere in it."`,
  ],
};

// Grudge-gated Chef elimination confessionals
const CHEF_ELIM_REASONS = {
  foodTheft: [
    (n) => `"You ate my buns. MY buns. Get on the boat."`,
    (n) => `"Those sticky buns had my NAME on them. Literally. I wrote it in icing. Get out."`,
  ],
  cowardice: [
    (n) => `"You screamed at a squirrel. I can't even look at you."`,
    (n) => `"In my kitchen, we don't run. In my woods, we don't run. You ran. Goodbye."`,
  ],
  weakness: [
    (n) => `"You let them take your map while you were SLEEPING. Pathetic."`,
    (n) => `"You got robbed, tricked, and outplayed. I expected more. I was wrong."`,
  ],
  abandonment: [
    (n) => `"You left your partner. In MY woods. Unforgivable."`,
    (n) => `"A team is a team. You broke that. Done."`,
  ],
  lowScore: [
    (n) => `"You were the worst out there. Simple as that."`,
    (n) => `"I've seen recruits with more fight. Pack your bags."`,
  ],
  multiple: [
    (n) => `"Where do I even START with you?"`,
    (n) => `"You ate my food, abandoned your partner, AND cried on camera. Pick a struggle."`,
  ],
};

// Sasquatchanakwa encounter texts — indexed by encounter type to prevent reuse
const SASQUATCH_TEXTS = {
  footprints: [
    (pair) => `${pair[0]} spots something in the mud. Footprints. Big ones. ${pair[1]} looks at them. Neither says anything for a moment.`,
    (pair) => `The trail has markings — claw marks, dragged brush, something heavy that passed through recently. ${pair[0]} and ${pair[1]} exchange a look.`,
  ],
  roar: [
    (pair) => `Something roars in the distance. Not a bear. Not anything ${pair[0]} or ${pair[1]} can identify. They walk faster.`,
    (pair) => `A sound cuts through the trees — guttural, low, wrong. ${pair[0]} freezes. ${pair[1]} grabs ${pronouns(pair[0]).posAdj} arm.`,
  ],
  shadow: [
    (pair) => `Movement between the trees. Too tall. Too fast. ${pair[0]} saw it. ${pair[1]} didn't. Or won't admit it.`,
    (pair) => `A shadow crosses their path — upright, broad, gone before either can focus. ${pair[0]} and ${pair[1]} don't discuss it.`,
  ],
  proximity: [
    (name, pr) => `Branches snap twenty feet behind ${name}. Then ten. Then five. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} turn around.`,
    (name, pr) => `${name} can smell it now — wet fur, something rotten, something alive. It's close.`,
  ],
  standGround: [
    (name, pr) => `${name} turns around. Stares into the dark. Whatever is there stares back. Neither blinks. It leaves first.`,
    (name, pr) => `${name} picks up the biggest stick in reach and holds ${pr.posAdj} ground. The sound stops. Recedes. Respects.`,
  ],
  chase: [
    (names) => `It bursts through the treeline. Sasquatchanakwa — eight feet of fur, fury, and territorial rage. ${names.join(', ')} RUN.`,
    (names) => `The roar is behind them. Then beside them. Then everywhere. ${names.join(' and ')} crash through brush, branches, each other.`,
  ],
  grabbed: [
    (name, pr) => `${name} goes down — backpack snagged on a root. Dragged three feet before ${pr.sub} ${pr.sub==='they'?'kick':'kicks'} free. Comedy of terror.`,
    (name, pr) => `Sasquatchanakwa grabs ${name}'s pack strap. For one eternal second, ${pr.sub} ${pr.sub==='they'?'are':'is'} going backward. Then the strap snaps.`,
  ],
  cave: [
    `All four pile into the cave. Gasping. The entrance darkens — Sasquatchanakwa sniffs, considers, sits down. It's not leaving. Neither are they.`,
    `The cave is small, cold, and full of bats. But it doesn't have a Sasquatchanakwa in it. For now, that's enough.`,
  ],
  finalChase: [
    (name, pr) => `Sasquatchanakwa emerges from the treeline one last time. It remembers ${name}. ${pr.Sub} ${pr.sub==='they'?'are':'is'} running before ${pr.sub} even ${pr.sub==='they'?'process':'processes'} it.`,
    (name, pr) => `A roar from behind. ${name} doesn't look. Just runs. The totem pole is visible. So is the thing chasing ${pr.obj}.`,
  ],
  avoids: [
    (name, pr) => `Sasquatchanakwa sees ${name} and... hesitates. It remembers last night. It chooses a different target.`,
  ],
};

// Navigation event texts (phase 1) — keyed to prevent repetition
const NAV_TEXTS = {
  riverCross: {
    success: [
      (n, pr) => `${n} wades in without flinching. Current's strong but ${pr.sub} ${pr.sub==='they'?'are':'is'} stronger. Across in under a minute.`,
      (n, pr) => `${n} finds the narrowest point, tests the depth with a stick, and crosses clean. Textbook.`,
    ],
    fail: [
      (n, pr) => `${n} misjudges the current. ${pr.Sub} ${pr.sub==='they'?'go':'goes'} under for two seconds that feel like twenty. Supplies: soaked.`,
      (n, pr) => `${n} slips on the riverbed. The map goes downstream. ${pr.Sub} ${pr.sub==='they'?'go':'goes'} after it. The map wins.`,
    ],
  },
  cliffClimb: {
    success: [
      (n, pr) => `${n} reaches the top. From up here, the camp's direction is obvious. Worth every bruised knuckle.`,
      (n, pr) => `${n} scales it methodically — three points of contact, never rushing. The vantage point reveals the river they need to follow.`,
    ],
    fail: [
      (n, pr) => `${n} gets halfway up and freezes. The way down takes longer than the way up. Nothing gained.`,
      (n, pr) => `${n} slips at the crux. No injury, but the confidence hit is worse than the bruise.`,
    ],
  },
  getLost: [
    (pair) => `Twenty minutes of confident walking. Then the same fallen tree. They've been going in circles. ${pair[0]} blames ${pair[1]}. ${pair[1]} blames the compass.`,
    (pair) => `"We passed that rock already." "No we didn't." They did.`,
  ],
  mapUpsideDown: [
    (n, pr) => `${n} has been reading the map upside down for the last hour. ${pr.Sub} ${pr.sub==='they'?'realize':'realizes'} this when the river is on the wrong side. The confessional is brutal.`,
  ],
  quicksand: {
    escape: [
      (n, pr, helper) => `${n} sinks to the knees. ${helper} grabs a branch, hauls ${pr.obj} out. Teamwork. Filthy, panicked teamwork.`,
    ],
    stuck: [
      (n, pr) => `${n} sinks and sinks and panics and sinks more. Finally crawls out coated in mud. Dignity: gone.`,
    ],
  },
  animalEncounter: {
    brave: [
      (n, pr, animal) => `${n} faces down the ${animal}. Doesn't flinch. The ${animal} reconsiders its life choices and leaves.`,
    ],
    flee: [
      (n, pr, animal) => `The ${animal} appears. ${n} appears to teleport backward. ${pr.Sub} ${pr.sub==='they'?'deny':'denies'} running. The footage disagrees.`,
    ],
  },
  supplyFind: [
    (n, item) => `${n} finds a ${item} wedged under a log. Small advantage. Big morale boost.`,
    (n, item) => `Hidden in the underbrush: a ${item}. ${n} pockets it quietly.`,
  ],
  pairArgument: {
    fight: [
      (a, b) => `${a} and ${b} disagree on the path. The argument gets personal. Three minutes of walking in silence follows.`,
    ],
    strategize: [
      (a, b) => `${a} and ${b} stop, check the map together, and actually agree on a plan. Rare. Effective.`,
    ],
  },
  compassMalfunction: {
    notice: [
      (n, pr) => `${n} taps the compass. The needle spins. "This is broken." Quick switch to landmarks. Smart.`,
    ],
    miss: [
      (pair) => `The compass has been pointing east this whole time. Neither ${pair[0]} nor ${pair[1]} noticed. They're now very far from where they should be.`,
    ],
  },
  landmark: [
    (n, pr) => `${n} recognizes the rock formation from the map. "This way." ${pr.Sub} ${pr.sub==='they'?'are':'is'} right.`,
    (n, pr) => `${n} spots smoke on the horizon — Chef's fire. Camp is that direction. Shortcut found.`,
  ],
  partnerInjury: {
    help: [
      (helper, victim, hPr) => `${victim} rolls an ankle. ${helper} is there immediately — shoulder under arm, pace adjusted. No hesitation.`,
    ],
    abandon: [
      (abandoner, victim, aPr) => `${victim} goes down hard. ${abandoner} looks back, calculates, keeps walking. The camera catches everything.`,
    ],
  },
  forage: {
    success: [
      (n, pr) => `${n} finds edible berries. Actually edible. The group eats something other than regret for the first time today.`,
    ],
    fail: [
      (n, pr) => `${n} eats something from a bush. It was not food. The next hour is unpleasant.`,
    ],
  },
};

// Trap texts (phase 2)
const TRAP_TEXTS = {
  snare: {
    set: [(setter) => `${setter} rigs a vine snare across the trail. Quick, efficient, nasty.`],
    caught: [(victim, pr) => `${victim} walks right into it. Yanked off ${pr.posAdj} feet. Hangs for eight seconds before cutting free.`],
    detected: [(detector, pr) => `${detector} spots the tripwire. Steps over it. Files it away mentally.`],
  },
  falseTrail: {
    set: [(setter) => `${setter} creates a false trail — broken branches pointing the wrong way, footprints leading to nothing.`],
    fooled: [(pair) => `${pair[0]} and ${pair[1]} follow the trail for twenty minutes before realizing it ends at a cliff face. They've been played.`],
    detected: [(detector) => `${detector} examines the broken branches. "These were snapped by hand, not by weight. It's fake." They go the other way.`],
  },
  supplySteal: {
    success: [(thief, victim) => `${thief} lifts the ${victim}'s compass while they're distracted. Clean. Professional. Gone before anyone notices.`],
    fail: [(thief, victim) => `${thief} reaches for ${victim}'s bag. ${victim} turns around. Eye contact. Silence. The attempt is over.`],
  },
  pitTrap: {
    success: [(victim) => `${victim} steps forward and the ground gives way. A pit. Shallow enough to be embarrassing, deep enough to cost time.`],
    backfire: [(setter) => `${setter} walks into their own pit trap. The camera crew tries not to laugh. They fail.`],
  },
  decoyCamp: {
    fooled: [(pair) => `${pair[0]} and ${pair[1]} find an abandoned campsite. Spend fifteen minutes searching it. It was fake. Someone set this up.`],
  },
  tripWire: {
    set: [(setter) => `${setter} strings a line between two trees. Low. Hard to see in the dark. Defensive, not aggressive.`],
    triggered: [(pair) => `Something trips the alarm. ${pair[0]} and ${pair[1]} are awake instantly. The rival pair is close.`],
  },
  guard: {
    active: [(guard, pr) => `${guard} stays by the supplies. Arms crossed. Nobody's taking anything on ${pr.posAdj} watch.`],
    blocked: [(thief, guard) => `${thief} approaches the supplies. ${guard} is right there. Watching. The attempt dies before it starts.`],
  },
};

// Overnight texts (phase 3)
const OVERNIGHT_TEXTS = {
  bats: {
    panic: [(n, pr) => `Bats pour out of the cave ceiling. ${n} LOSES it. Screaming, flailing, running in circles.`],
    calm: [(n, pr) => `Bats erupt from above. ${n} ducks, waits, doesn't move. They pass.`],
  },
  theft: {
    success: [(thief, victim) => `${thief} waits until ${victim}'s breathing slows. Then moves. Silent. The map changes hands.`],
    partial: [(thief, victim, item) => `${thief} gets the ${item} but knocks something over reaching for the rest. Freezes. ${victim} stirs but doesn't wake.`],
    caught: [(thief, victim) => `${thief}'s hand is in ${victim}'s bag when ${victim}'s eyes open. Nobody moves. Then everybody moves.`],
  },
  guard: [(guard, pr) => `${guard} volunteers for watch. Sits at the cave mouth. The fire reflects in ${pr.posAdj} eyes. Nobody's getting past.`],
  sleepThrough: [(n, pr) => `${n} snores through the entire theft. Wakes up to find ${pr.posAdj} supplies gone and everyone avoiding eye contact.`],
  nightmare: [(n, pr) => `${n} thrashes awake at 3 AM. Something about the Sasquatchanakwa. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} go back to sleep.`],
  campfireStory: [
    (teller, listeners) => `${teller} tells a story. It's actually good. ${listeners.join(' and ')} forget where they are for a moment.`,
  ],
  vulnerability: [
    (n, pr, listener) => `${n} says something real. Quiet. About home, about why ${pr.sub} ${pr.sub==='they'?'are':'is'} here. ${listener} listens.`,
  ],
  morningTheft: [
    (victim, pr) => `Morning. ${victim} reaches for ${pr.posAdj} bag. Empty. The map, the compass — gone. ${pr.Sub} ${pr.sub==='they'?'know':'knows'} exactly who did it.`,
  ],
  confrontation: [
    (victim, thief) => `"You TOOK it." ${victim} is in ${thief}'s face before anyone can intervene. The alliance is over. The gloves are off.`,
  ],
};

// Sprint texts (phase 4)
const SPRINT_TEXTS = {
  foodTemptation: {
    resist: [(n, pr) => `The smell of Chef's cooking hits ${n}. ${pr.Sub} ${pr.sub==='they'?'hesitate':'hesitates'}. Keeps running. Willpower over hunger.`],
    fail: [(n, pr) => `${n} smells sticky buns. The totem pole is RIGHT THERE. But the buns. ${pr.Sub} ${pr.sub==='they'?'veer':'veers'} off course. Gone.`],
  },
  tantrum: [(n, pr) => `${n} stops running. Just stops. Rage-quit in the middle of the sprint. ${pr.Sub} ${pr.sub==='they'?'kick':'kicks'} a tree.`],
  shortcut: {
    success: [(n, pr) => `${n} spots a gap in the brush and GOES. Through the brambles, over a ditch, out ahead. Bold. Effective.`],
    fail: [(n, pr) => `${n} dives through what looked like a shortcut. It was a thorn bush. ${pr.Sub} ${pr.sub==='they'?'emerge':'emerges'} bloody and behind.`],
  },
  partnerBoost: [(fast, slow) => `${fast} grabs ${slow}'s arm. "Come ON." The pace picks up. Partnership pays off.`],
  exhaustionCollapse: [(n, pr) => `${n}'s legs give out fifty yards from the pole. Face in the dirt. The finish line might as well be a mile away.`],
  partnerCarry: [(carrier, carried) => `${carrier} doesn't even break stride. Throws ${carried} over one shoulder. Sprints. Absolute unit.`],
  finalDash: [(n, pr) => `${n} lunges. Fingertips on the totem pole. Everything — the forest, the monster, the night — was for this.`],
};

// Chef verdict texts
const VERDICT_TEXTS = {
  immuneAnnounce: [
    (pair) => `Chef nods at ${pair[0]} and ${pair[1]}. "You two. First to the pole. You're safe."`,
    (pair) => `"${pair[0]}. ${pair[1]}. Invincibility." Chef says it like he's reading a shopping list.`,
  ],
  elimAnnounce: [
    (name, reason) => `Chef turns to ${name}. ${reason} "Boat of Losers. Now."`,
    (name, reason) => `"${name}." Chef pauses. ${reason} "You're done."`,
  ],
};

// Chef walkie-talkie interjections — 2-3 per challenge, seed grudge
const CHEF_INTERJECTS = {
  lost: [
    (name) => `Static crackles. Chef's voice: "I can see you from up here, ${name}. You're going the WRONG WAY."`,
    (name) => `The walkie buzzes. "That's not north, ${name}. That's embarrassing."`,
    (name) => `"${name}. I've seen cub scouts navigate better than this. You're a DISGRACE to hiking."`,
  ],
  slow: [
    (pair) => `Chef radios in: "Pair ${pair}, I've seen snails move faster. DOUBLE TIME."`,
    (pair) => `"Pair ${pair}. The other team just passed the second checkpoint. Where. Are. You."`,
  ],
  taunt: [
    () => `The walkie crackles with laughter. Just laughter. Then silence.`,
    () => `Chef's voice, almost bored: "At this rate, I'll eliminate ALL of you."`,
    () => `"I'm timing this. It's embarrassing for everyone involved."`,
  ],
  grudge: [
    (name) => `Chef: "I saw what you did back there, ${name}. You think I wasn't watching? I'm ALWAYS watching."`,
    (name) => `"${name}." Long pause. "We're going to have a conversation later. You and me."`,
  ],
};

// Sasquatchanakwa face reveal — full-description terrifying encounter
const SASQUATCH_REVEAL = [
  (name, pr) => `${name} hears breathing behind ${pr.obj}. Slowly, ${pr.sub} turns. It's there. Eight feet of matted brown fur. Arms like tree trunks. Teeth — too many teeth. And eyes. Orange. Burning. Intelligent. It tilts its head and looks at ${name} like it's deciding something. Then it's gone. Just rustling branches and the smell of pine and something worse.`,
  (name, pr) => `The branches part. ${name} sees it clearly for the first time. Sasquatchanakwa. It's real. It's enormous. The body is ape-like but the face — the face is almost human. Almost. It stares at ${name}. ${pr.Sub} can't move. Can't breathe. It raises one massive hand, points at ${name}, and disappears into the darkness.`,
  (name, pr) => `${name} freezes. Ten feet away, standing in a shaft of moonlight: Sasquatchanakwa. Not a shadow. Not a sound in the bushes. The actual creature. It's bigger than ${name} imagined. Its eyes catch the light — twin embers in a wall of dark fur. For three seconds, nobody moves. Then it turns, unhurried, and walks into the trees. ${name} doesn't sleep for the rest of the night.`,
];

// ══════════════════════════════════════════════════════
// VP STYLES
// ══════════════════════════════════════════════════════
const YETI_STYLES = `
<style>
/* ── BASE FOREST CONTAINER ── */
.yeti-forest{--forest-deep:#1a2e1a;--amber:#d4850a;--moon:#c8d0dc;--shadow:#0d1117;--yeti-glow:#ff4d00;--bark:#5c3a1e;--parchment:rgba(245,235,220,0.06);color:var(--moon);padding:24px 16px 40px;font-family:Georgia,'Times New Roman',serif;position:relative;min-height:100vh;overflow:hidden}

/* ── FOREST DEPTH LAYERS ── */
.yeti-forest::before,.yeti-forest::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;transition:background 0.6s}
/* Phase 0: Twilight clearing */
.yeti-forest[data-phase="0"]{background:linear-gradient(180deg,#1e3c50 0%,#2a4a3a 30%,#1a3a28 60%,#2a4a2a 100%)}
.yeti-forest[data-phase="0"]::before{background:radial-gradient(ellipse at 50% 15%,rgba(140,180,200,0.12) 0%,transparent 50%),linear-gradient(180deg,transparent 70%,rgba(60,120,60,0.08) 100%)}
.yeti-forest[data-phase="0"]::after{background:repeating-linear-gradient(90deg,transparent 0px,transparent 80px,rgba(30,60,30,0.06) 82px,transparent 84px)}
/* Phase 1: Forest entry */
.yeti-forest[data-phase="1"]{background:linear-gradient(180deg,#1a2e3a 0%,#1e3828 25%,#142a18 60%,#1a2e1a 100%)}
.yeti-forest[data-phase="1"]::before{background:linear-gradient(180deg,rgba(180,100,40,0.06) 0%,transparent 30%),radial-gradient(ellipse at 50% 100%,rgba(80,60,30,0.08) 0%,transparent 40%)}
.yeti-forest[data-phase="1"]::after{background:repeating-linear-gradient(90deg,transparent 0px,transparent 40px,rgba(20,40,20,0.1) 42px,transparent 44px),repeating-linear-gradient(90deg,transparent 0px,transparent 60px,rgba(15,30,15,0.08) 62px,transparent 66px)}
/* Phase 2: Deep woods */
.yeti-forest[data-phase="2"]{background:linear-gradient(180deg,#1a1a30 0%,#141e28 20%,#0f1a14 55%,#0a120a 100%)}
.yeti-forest[data-phase="2"]::before{background:radial-gradient(circle at 30% 8%,rgba(200,200,255,0.04) 0%,transparent 3%),radial-gradient(circle at 70% 5%,rgba(200,200,255,0.03) 0%,transparent 2%),radial-gradient(circle at 50% 12%,rgba(200,200,255,0.03) 0%,transparent 2%)}
.yeti-forest[data-phase="2"]::after{background:repeating-linear-gradient(90deg,transparent 0px,transparent 25px,rgba(10,20,10,0.15) 27px,transparent 30px),repeating-linear-gradient(90deg,transparent 0px,transparent 50px,rgba(8,16,8,0.12) 52px,transparent 56px),linear-gradient(180deg,transparent 80%,rgba(20,40,15,0.1) 100%)}
/* Phase 3: Cave mouth */
.yeti-forest[data-phase="3"]{background:linear-gradient(180deg,#050508 0%,#0a0a10 20%,#080810 100%)}
.yeti-forest[data-phase="3"]::before{background:radial-gradient(ellipse at 50% 10%,rgba(200,208,220,0.06) 0%,transparent 25%)}
.yeti-forest[data-phase="3"]::after{background:linear-gradient(90deg,rgba(40,30,25,0.7) 0%,transparent 20%,transparent 80%,rgba(40,30,25,0.7) 100%)}
/* Phase 4: Dawn breaking */
.yeti-forest[data-phase="4"]{background:linear-gradient(180deg,#2a2040 0%,#3a3050 15%,#504838 35%,#2a3a20 70%,#1e3018 100%)}
.yeti-forest[data-phase="4"]::before{background:radial-gradient(ellipse at 80% 20%,rgba(255,180,80,0.1) 0%,transparent 40%),radial-gradient(ellipse at 60% 10%,rgba(255,140,160,0.06) 0%,transparent 30%)}
.yeti-forest[data-phase="4"]::after{background:repeating-linear-gradient(90deg,transparent 0px,transparent 50px,rgba(30,50,25,0.06) 52px,transparent 54px)}
/* Phase 5: Full dawn */
.yeti-forest[data-phase="5"]{background:linear-gradient(180deg,#4a3828 0%,#5a4830 20%,#3a4a28 50%,#2a3a1e 100%)}
.yeti-forest[data-phase="5"]::before{background:radial-gradient(ellipse at 50% 25%,rgba(255,200,100,0.12) 0%,transparent 50%)}
.yeti-forest[data-phase="5"]::after{background:none}

/* ── TYPOGRAPHY ── */
.yeti-eyebrow{font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--amber);margin-bottom:8px;text-align:center;position:relative;z-index:2}
.yeti-title{font-size:24px;text-align:center;color:var(--moon);margin-bottom:4px;letter-spacing:1px;text-shadow:0 0 20px rgba(200,208,220,0.1);position:relative;z-index:2}
.yeti-sub{font-size:11px;color:rgba(200,208,220,0.5);text-align:center;margin-bottom:20px;position:relative;z-index:2}
.yeti-text{font-size:12px;line-height:1.6;color:rgba(200,208,220,0.85)}
.yeti-pair-header{font-size:14px;font-weight:700;color:var(--amber);margin:20px 0 8px;letter-spacing:1px}

/* ── TRAIL MAP ── */
.yeti-trail-map{position:relative;height:120px;background:rgba(245,235,220,0.03);border:1px solid rgba(245,235,220,0.08);border-radius:8px;margin-bottom:20px;overflow:hidden;z-index:2}
.yeti-trail-track{position:absolute;top:0;left:40px;right:40px;height:100%;display:flex;flex-direction:column;justify-content:center;gap:12px}
.yeti-trail-line{position:relative;height:4px;border-radius:2px;background:rgba(200,208,220,0.06)}
.yeti-trail-fill{position:absolute;top:0;left:0;height:100%;border-radius:2px;transition:width 0.5s ease}
.yeti-trail-fill.amber{background:linear-gradient(90deg,var(--amber),#e8a020)}
.yeti-trail-fill.silver{background:linear-gradient(90deg,#8899aa,#aabbcc)}
.yeti-trail-fill.green{background:linear-gradient(90deg,#3a8a4a,#5cb870)}
.yeti-trail-dot{position:absolute;top:50%;transform:translate(-50%,-50%);width:10px;height:10px;border-radius:50%;border:2px solid var(--moon);z-index:3;transition:left 0.5s ease}
.yeti-trail-dot.amber{background:var(--amber)}
.yeti-trail-dot.silver{background:#8899aa}
.yeti-trail-dot.green{background:#3a8a4a}
.yeti-trail-landmark{position:absolute;top:50%;transform:translate(-50%,-50%);font-size:10px;z-index:2;opacity:0.7}
.yeti-trail-label{position:absolute;left:0;top:50%;transform:translateY(-50%);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--amber);width:36px;text-align:right}
.yeti-trail-dest{position:absolute;right:0;top:50%;transform:translateY(-50%);font-size:12px}

/* ── SASQUATCH ── */
.sasquatch-presence{position:absolute;z-index:1;transition:all 0.8s ease;pointer-events:none}
.sasquatch-presence .sq-body{background:rgba(20,15,10,0.9);border-radius:40% 40% 30% 30%;position:relative}
.sasquatch-presence .sq-eye{position:absolute;width:4px;height:4px;border-radius:50%;background:#ff4d00;box-shadow:0 0 6px #ff4d00}
.sasquatch-presence .sq-eye.left{top:25%;left:30%}
.sasquatch-presence .sq-eye.right{top:25%;right:30%}
.sasquatch-presence[data-proximity="far"]{right:10%;top:15%;opacity:0.3;animation:sq-flicker 3s ease-in-out infinite}
.sasquatch-presence[data-proximity="far"] .sq-body{width:30px;height:40px}
.sasquatch-presence[data-proximity="mid"]{right:8%;top:12%;opacity:0.6}
.sasquatch-presence[data-proximity="mid"] .sq-body{width:60px;height:80px}
.sasquatch-presence[data-proximity="mid"] .sq-eye{box-shadow:0 0 10px #ff4d00,0 0 20px rgba(255,77,0,0.3)}
.sasquatch-presence[data-proximity="close"]{right:5%;top:8%;opacity:1}
.sasquatch-presence[data-proximity="close"] .sq-body{width:120px;height:160px}
.sasquatch-presence[data-proximity="eyes"]{left:50%;top:5%;transform:translateX(-50%);opacity:0.8}
.sasquatch-presence[data-proximity="eyes"] .sq-body{width:0;height:0;background:none}
.sasquatch-presence[data-proximity="eyes"] .sq-eye{width:8px;height:8px;position:relative;display:inline-block;animation:sq-pulse 2s ease-in-out infinite;box-shadow:0 0 12px #ff4d00,0 0 24px rgba(255,77,0,0.4)}
.sasquatch-presence[data-proximity="eyes"] .sq-eye.left{margin-right:20px}
.sasquatch-presence[data-proximity="chasing"]{right:15%;top:20%;opacity:0.8;animation:sq-chase 2s ease-in-out infinite}
.sasquatch-presence[data-proximity="chasing"] .sq-body{width:60px;height:80px}
.sasquatch-presence[data-proximity="gone"]{display:none}
@keyframes sq-flicker{0%,100%{opacity:0.3}30%{opacity:0}60%{opacity:0.35}80%{opacity:0}}
@keyframes sq-pulse{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}
@keyframes sq-chase{0%{transform:translateX(0)}50%{transform:translateX(-30px)}100%{transform:translateX(0)}}
@keyframes sq-drift{0%{transform:translateX(-15px)}50%{transform:translateX(15px)}100%{transform:translateX(-15px)}}

/* ── EVENT CARDS (torn notebook) ── */
.yeti-card{background:var(--parchment);border:1px solid rgba(200,208,220,0.08);border-left:4px solid rgba(200,208,220,0.12);padding:14px;margin-bottom:12px;position:relative;z-index:2;border-radius:2px 6px 6px 2px;display:flex;gap:12px;align-items:flex-start;animation:yeti-card-in 0.3s ease-out}
.yeti-card.sasquatch{border-left-color:#ff4d00;animation:yeti-card-in 0.3s ease-out,yeti-shake 0.4s 0.1s ease-out}
.yeti-card.grudge{border-left-color:rgba(255,60,60,0.5)}
.yeti-card.brave{border-left-color:var(--amber);box-shadow:0 0 12px rgba(212,133,10,0.08)}
.yeti-card.theft .yeti-text{text-decoration:line-through;text-decoration-color:rgba(255,60,60,0.3)}
.yeti-card .card-portrait{flex-shrink:0}
.yeti-card .card-content{flex:1;min-width:0}
.yeti-card::after{content:'';position:absolute;top:0;right:0;width:12px;height:12px;background:linear-gradient(135deg,transparent 50%,rgba(0,0,0,0.1) 50%)}
@keyframes yeti-card-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes yeti-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(1px)}}

/* ── BADGES (ink stamps) ── */
.yeti-badge{display:inline-block;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:2px 8px;border-radius:3px;margin-bottom:8px;transform:rotate(-3deg);transform-origin:left center}
.yeti-badge.gold{background:rgba(212,133,10,0.15);color:var(--amber)}
.yeti-badge.red{background:rgba(255,60,60,0.12);color:#f85149}
.yeti-badge.green{background:rgba(63,185,80,0.12);color:#3fb950}
.yeti-badge.blue{background:rgba(56,139,253,0.12);color:#388bfd}
.yeti-badge.yellow{background:rgba(210,153,34,0.12);color:#d29922}
.yeti-badge.grey{background:rgba(200,208,220,0.08);color:rgba(200,208,220,0.5)}
.yeti-badge.pink{background:rgba(219,112,147,0.12);color:#db7093}
.yeti-grudge-stamp{position:absolute;top:8px;right:16px;font-size:11px;font-weight:900;color:rgba(255,60,60,0.5);transform:rotate(-8deg);letter-spacing:3px;font-family:'Courier New',monospace;text-transform:uppercase;z-index:3}

/* ── FOOTSTEP REVEAL ── */
.yeti-reveal-main{display:inline-block;padding:8px 24px;background:rgba(92,58,30,0.25);color:var(--amber);border:2px solid rgba(92,58,30,0.5);border-radius:4px;cursor:pointer;font-size:12px;font-family:Georgia,serif;letter-spacing:1px;transform:rotate(-1deg);transition:background 0.2s,transform 0.15s}
.yeti-reveal-main:hover{background:rgba(92,58,30,0.4);transform:rotate(0deg) scale(1.02)}
.yeti-reveal-all{display:inline-block;padding:4px 14px;background:rgba(200,208,220,0.04);color:rgba(200,208,220,0.4);border:1px solid rgba(200,208,220,0.08);border-radius:4px;cursor:pointer;font-size:10px;margin-top:6px;transition:color 0.2s}
.yeti-reveal-all:hover{color:rgba(200,208,220,0.7)}

/* ── CAVE MOUTH SCENE ── */
.yeti-cave{position:relative;min-height:80vh;overflow:hidden}
.yeti-cave-walls{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:1}
.yeti-cave-walls::before{content:'';position:absolute;top:0;left:0;width:25%;height:100%;background:linear-gradient(90deg,rgba(40,30,20,0.95) 0%,rgba(30,25,18,0.6) 60%,transparent 100%)}
.yeti-cave-walls::after{content:'';position:absolute;top:0;right:0;width:25%;height:100%;background:linear-gradient(270deg,rgba(40,30,20,0.95) 0%,rgba(30,25,18,0.6) 60%,transparent 100%)}
.yeti-cave-mouth{position:absolute;top:0;left:30%;width:40%;height:35%;background:radial-gradient(ellipse at 50% 60%,rgba(15,20,35,0.9) 0%,rgba(5,5,10,0.95) 100%);border-radius:0 0 50% 50%;z-index:0;overflow:hidden}
.yeti-cave-moon{position:absolute;top:15%;left:60%;width:20px;height:20px;border-radius:50%;background:radial-gradient(circle,rgba(200,208,220,0.9) 0%,rgba(200,208,220,0.4) 60%,transparent 100%);box-shadow:0 0 15px rgba(200,208,220,0.2)}
.yeti-cave-eyes{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;gap:24px;z-index:2;animation:sq-drift 4s ease-in-out infinite}
.yeti-cave-eye{width:8px;height:8px;border-radius:50%;background:#ff4d00;box-shadow:0 0 12px #ff4d00,0 0 24px rgba(255,77,0,0.4);animation:sq-pulse 2s ease-in-out infinite}

/* ── CAMPFIRE ── */
.yeti-campfire{position:relative;width:60px;height:50px;margin:0 auto}
.yeti-campfire-base{position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:40px;height:8px;background:rgba(60,30,10,0.8);border-radius:50%;box-shadow:0 0 30px rgba(212,133,10,0.15)}
.yeti-flame{position:absolute;bottom:6px;left:50%;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;animation:flame-flicker 0.8s ease-in-out infinite alternate}
.yeti-flame.f1{width:16px;height:28px;background:rgba(255,120,20,0.8);transform:translateX(-50%);z-index:3}
.yeti-flame.f2{width:22px;height:22px;background:rgba(255,80,10,0.5);transform:translateX(-55%);z-index:2;animation-delay:0.15s}
.yeti-flame.f3{width:12px;height:18px;background:rgba(255,200,60,0.7);transform:translateX(-45%);z-index:4;animation-delay:0.3s}
.yeti-campfire.dim .yeti-flame{opacity:0.3;height:12px !important;transition:all 0.5s}
.yeti-campfire.bright .yeti-flame{opacity:1;transform:translateX(-50%) scale(1.3);transition:all 0.5s}
.yeti-campfire.embers .yeti-flame{opacity:0.15;height:6px !important;transition:all 0.8s}
.yeti-campfire-glow{position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);width:120px;height:60px;background:radial-gradient(ellipse,rgba(212,133,10,0.1) 0%,transparent 70%);pointer-events:none}
@keyframes flame-flicker{0%{transform:translateX(-50%) scaleY(1) scaleX(1)}50%{transform:translateX(-50%) scaleY(1.15) scaleX(0.9)}100%{transform:translateX(-50%) scaleY(0.95) scaleX(1.05)}}

/* ── CAMPFIRE CIRCLE ── */
.yeti-fire-circle{display:flex;justify-content:center;gap:16px;margin:12px 0;flex-wrap:wrap}
.yeti-fire-seat{text-align:center;position:relative}
.yeti-fire-seat.active{filter:drop-shadow(0 0 6px rgba(212,133,10,0.3))}

/* ── TOTEM POLE ── */
.yeti-totem{position:relative;width:40px;margin:0 auto 20px;z-index:2}
.yeti-totem-seg{width:40px;height:18px;border-radius:4px;border:1px solid rgba(92,58,30,0.4);position:relative}
.yeti-totem-seg:nth-child(1){background:linear-gradient(180deg,#6b3a20,#5a3018)}
.yeti-totem-seg:nth-child(2){background:linear-gradient(180deg,#7a4828,#6b3a20)}
.yeti-totem-seg:nth-child(3){background:linear-gradient(180deg,#8a5a30,#7a4828)}
.yeti-totem-seg:nth-child(4){background:linear-gradient(180deg,#7a4828,#6b3a20)}
.yeti-totem-face{width:40px;height:24px;background:linear-gradient(180deg,#5a3018,#4a2810);border-radius:6px 6px 2px 2px;border:1px solid rgba(92,58,30,0.5);position:relative}
.yeti-totem-face::before{content:'◉ ◉';position:absolute;top:4px;left:50%;transform:translateX(-50%);font-size:8px;color:var(--amber);letter-spacing:6px}
.yeti-totem-face::after{content:'▽';position:absolute;bottom:2px;left:50%;transform:translateX(-50%);font-size:7px;color:var(--amber)}
.yeti-totem.glow{animation:totem-glow 1.5s ease-in-out infinite}
@keyframes totem-glow{0%,100%{filter:drop-shadow(0 0 4px rgba(212,133,10,0.2))}50%{filter:drop-shadow(0 0 12px rgba(212,133,10,0.5))}}

/* ── VERDICT SPECIFICS ── */
.yeti-verdict-beat{position:relative;z-index:2;margin-bottom:16px;animation:yeti-card-in 0.4s ease-out}
.yeti-grudge-bar{display:flex;align-items:center;gap:8px;margin:6px 0}
.yeti-grudge-bar-fill{height:8px;border-radius:4px;background:linear-gradient(90deg,#d29922,#f85149);transition:width 0.8s ease-out;min-width:2px}
.yeti-grudge-bar-track{flex:1;height:8px;background:rgba(200,208,220,0.06);border-radius:4px;overflow:hidden}
.yeti-grudge-sources{font-size:9px;color:rgba(200,208,220,0.4);margin-top:2px;padding-left:68px}
.yeti-heli{position:absolute;top:10px;right:-60px;font-size:28px;z-index:3;animation:heli-descend 1.5s ease-out forwards}
@keyframes heli-descend{from{top:-40px;right:-60px;opacity:0}to{top:10px;right:20px;opacity:1}}
.yeti-elim-portrait{filter:grayscale(100%);transition:filter 1s ease}
.yeti-elim-stamp{font-size:10px;font-weight:900;letter-spacing:3px;color:#f85149;text-transform:uppercase;font-family:'Courier New',monospace;animation:stamp-in 0.3s ease-out}
@keyframes stamp-in{from{transform:scale(2);opacity:0}to{transform:scale(1);opacity:1}}
.yeti-golden-ring{box-shadow:0 0 0 3px rgba(212,133,10,0.5),0 0 12px rgba(212,133,10,0.2);border-radius:50%}

/* ── SCORE BAR ── */
.yeti-score-bar{display:flex;align-items:center;gap:8px;margin:4px 0}
.yeti-score-fill{height:6px;border-radius:3px;background:var(--amber);transition:width 0.3s}

/* ── STICKY REVEAL BUTTONS ── */
.yeti-sticky-btns{text-align:center;padding:20px 0 12px;position:relative;z-index:20}

/* ── SPECIAL CARD TYPES ── */
.yeti-card.food-temptation{background:linear-gradient(135deg,rgba(60,30,10,0.3),rgba(40,20,5,0.2));border-left-color:#d29922;box-shadow:0 0 20px rgba(210,153,34,0.08)}
.yeti-card.food-temptation::before{content:'🍗';position:absolute;top:8px;right:12px;font-size:20px;opacity:0.3}
.yeti-card.chef-radio{background:rgba(20,15,10,0.4);border-left-color:#8b949e;border-left-style:dashed}
.yeti-card.chef-radio::before{content:'📻';position:absolute;top:8px;right:12px;font-size:16px;opacity:0.4}
.yeti-card.sasquatch-reveal{background:linear-gradient(180deg,rgba(30,10,0,0.4),rgba(15,5,0,0.3));border-left-color:#ff4d00;box-shadow:0 0 30px rgba(255,77,0,0.1);animation:yeti-card-in 0.3s ease-out,yeti-shake 0.6s 0.2s ease-out}
.yeti-card.sasquatch-reveal::before{content:'👁️';position:absolute;top:8px;right:12px;font-size:20px;opacity:0.5;animation:yeti-glow-pulse 2s infinite}
@keyframes yeti-glow-pulse{0%,100%{opacity:0.3}50%{opacity:0.7}}
.yeti-card.desperation{border-left-color:var(--amber);background:linear-gradient(90deg,rgba(212,133,10,0.06),transparent)}

/* ── STATUS BAR ── */
.yeti-status-bar{display:flex;justify-content:space-between;align-items:center;padding:6px 12px;margin-bottom:12px;background:rgba(0,0,0,0.25);border-radius:6px;font-size:10px;position:relative;z-index:2;border:1px solid rgba(200,208,220,0.06)}

/* ── UTILITIES ── */
.yeti-hidden{display:none}
.yeti-z2{position:relative;z-index:2}
</style>`;

// ══════════════════════════════════════════════════════
// PHASE FUNCTIONS
// ══════════════════════════════════════════════════════

function _phaseDropOff(pairs, activePlayers, timeline, chefGrudge, sasquatch, firedEvents) {
  // Chef intro
  timeline.push({ type: 'chefIntro', phase: 0, players: activePlayers,
    text: _rp(CHEF_INTRO), badgeText: 'CHEF HATCHET', badgeClass: 'red' });

  // Pair assignment reveal
  pairs.forEach(p => {
    timeline.push({ type: 'pairReveal', phase: 0, players: [...p.members],
      text: `Pair ${p.label}: ${p.members.join(' & ')}. Chef tosses them a supply bag.`,
      badgeText: `PAIR ${p.label}`, badgeClass: 'blue' });
  });

  // Per-player confessional
  activePlayers.forEach(name => {
    const pr = pronouns(name);
    const arch = _archOf(name);
    const bucket =
      ['villain', 'mastermind', 'schemer'].includes(arch) ? 'villain'
      : ['hothead', 'chaos-agent'].includes(arch) ? 'hothead'
      : ['social-butterfly', 'showmancer'].includes(arch) ? 'social'
      : ['hero', 'loyal-soldier'].includes(arch) ? 'hero'
      : ['underdog', 'floater'].includes(arch) ? 'underdog'
      : arch === 'challenge-beast' ? 'beast'
      : arch === 'wildcard' ? 'wildcard'
      : arch === 'perceptive-player' ? 'perceptive'
      : arch === 'goat' ? 'goat'
      : 'default';

    // Anti-repetition: if bucket already used, fall back to default
    const useBucket = firedEvents.confessionalBuckets.has(bucket) && bucket !== 'default' ? 'default' : bucket;
    firedEvents.confessionalBuckets.add(bucket);

    const text = _rp(CONFESSIONAL_TEXTS[useBucket] || CONFESSIONAL_TEXTS.default)(name, pr);
    timeline.push({ type: 'confessional', phase: 0, player: name, players: [name],
      text, badgeText: 'CONFESSIONAL', badgeClass: 'grey' });
  });

  // Grudge seed — sass vs respect based on temperament + boldness
  activePlayers.forEach(name => {
    const s = pStats(name);
    if (s.boldness * 0.1 + s.temperament * -0.05 + _noise(-0.3, 0.3) > 0.5) {
      chefGrudge[name] += 1.0;
      timeline.push({ type: 'grudgeEvent', phase: 0, player: name, players: [name],
        text: `${name} mouths off to Chef. Chef's eye twitches. He will remember this.`,
        badgeText: 'DISRESPECT', badgeClass: 'red', grudgeType: 'sass', grudgeDelta: 1.0 });
    } else if (s.loyalty * 0.08 + s.temperament * 0.05 + _noise(-0.2, 0.2) > 0.6) {
      chefGrudge[name] -= 0.5;
      timeline.push({ type: 'grudgeEvent', phase: 0, player: name, players: [name],
        text: `${name} nods at Chef. "Yes sir." Chef doesn't smile. But he notices.`,
        badgeText: 'RESPECT', badgeClass: 'green', grudgeType: 'respect', grudgeDelta: -0.5 });
    }
  });

  // Chef departs
  timeline.push({ type: 'chefDepart', phase: 0, players: activePlayers,
    text: _rp(CHEF_DEPART), badgeText: 'HELICOPTER OUT', badgeClass: 'grey' });

  sasquatch.aggression = 1;
}

function _phaseNavigation(pairs, activePlayers, timeline, personalScores, chefGrudge, sasquatch, supplies, firedEvents) {
  // Navigation approach per pair
  pairs.forEach(pair => {
    const label = pair.label;
    const group = pair.members;
    const eventsForPair = firedEvents[label];
    const targetEventCount = group.length <= 2 ? 4 : 5; // 3-4 for pair, 4-5 for trio
    let eventsFired = 0;

    // Navigation method — highest stat determines approach
    const navigator = group.reduce((best, n) => {
      const s = pStats(n);
      const mapScore = s.mental * 0.15 + s.intuition * 0.1;
      const compassScore = s.endurance * 0.12 + s.mental * 0.08;
      const boldScore = s.boldness * 0.15 + s.physical * 0.1;
      const bestScore = Math.max(mapScore, compassScore, boldScore);
      if (!best || bestScore > best.score) return { name: n, score: bestScore, method: mapScore >= compassScore && mapScore >= boldScore ? 'map' : compassScore >= boldScore ? 'compass' : 'bold' };
      return best;
    }, null);

    const navResult = navigator.score + _noise(-1.5, 1.5);
    if (navResult > 1.2) {
      personalScores[navigator.name] += 1.0;
      chefGrudge[navigator.name] -= 0.3;
      timeline.push({ type: 'navigation', phase: 1, group: label, player: navigator.name, players: group,
        text: navigator.method === 'map' ? `${navigator.name} reads the map correctly on the first try. The pair heads north with confidence.`
            : navigator.method === 'compass' ? `${navigator.name} sets a steady compass bearing. Slow, reliable, correct.`
            : `${navigator.name} spots a ridge and charges toward it. Reckless, but it works.`,
        badgeText: 'GOOD NAVIGATION', badgeClass: 'green', grudgeType: 'navigation', grudgeDelta: -0.3 });
      eventsForPair.add('navigation_success');
    } else if (navResult < 0.6) {
      personalScores[navigator.name] -= 1.0;
      chefGrudge[navigator.name] += 0.5;
      const lostText = navigator.method === 'map'
        ? _rp(NAV_TEXTS.mapUpsideDown)(navigator.name, pronouns(navigator.name))
        : _rp(NAV_TEXTS.getLost)(group);
      timeline.push({ type: 'navigation', phase: 1, group: label, player: navigator.name, players: group,
        text: lostText, badgeText: 'LOST', badgeClass: 'red', grudgeType: 'navigation', grudgeDelta: 0.5 });
      eventsForPair.add('navigation_fail');
    } else {
      personalScores[navigator.name] += 0.3;
      timeline.push({ type: 'navigation', phase: 1, group: label, player: navigator.name, players: group,
        text: `${navigator.name} finds a reasonable path. Not optimal, but moving in the right direction.`,
        badgeText: 'NAVIGATING', badgeClass: 'blue' });
    }
    eventsFired++;

    // Event pool — draw without replacement (per-pair only)
    const eventPool = [
      'riverCross', 'cliffClimb', 'quicksand', 'animalEncounter',
      'supplyFind', 'pairArgument', 'compassMalfunction', 'landmark',
      'partnerInjury', 'forage',
    ].filter(e => !eventsForPair.has(e));

    // Shuffle and pick
    const shuffledEvents = eventPool.sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffledEvents.length && eventsFired < targetEventCount; i++) {
      const evt = shuffledEvents[i];
      eventsForPair.add(evt);
      const subject = group[Math.floor(Math.random() * group.length)];
      const sPr = pronouns(subject);
      const s = pStats(subject);

      switch (evt) {
        case 'riverCross': {
          const roll = s.physical * 0.1 + s.boldness * 0.06 + _noise(-1.5, 1.5);
          if (roll > 1.0) {
            personalScores[subject] += 0.8; chefGrudge[subject] -= 0.3;
            timeline.push({ type: 'navEvent', subtype: 'riverCross', phase: 1, group: label, player: subject, players: group,
              text: _rp(NAV_TEXTS.riverCross.success)(subject, sPr),
              badgeText: 'RIVER CROSSED', badgeClass: 'green', grudgeDelta: -0.3 });
          } else {
            personalScores[subject] -= 0.8;
            if (Math.random() < 0.4) { supplies[label].map = false; } // lost map in river
            chefGrudge[subject] += 0.5;
            timeline.push({ type: 'navEvent', subtype: 'riverCross', phase: 1, group: label, player: subject, players: group,
              text: _rp(NAV_TEXTS.riverCross.fail)(subject, sPr),
              badgeText: 'RIVER FAIL', badgeClass: 'red', grudgeType: 'cowardice', grudgeDelta: 0.5 });
          }
          break;
        }
        case 'cliffClimb': {
          const roll = s.physical * 0.08 + s.mental * 0.06 + _noise(-1.5, 1.5);
          if (roll > 1.0) {
            personalScores[subject] += 1.0; chefGrudge[subject] -= 0.3; popDelta(subject, 1);
            timeline.push({ type: 'navEvent', subtype: 'cliffClimb', phase: 1, group: label, player: subject, players: group,
              text: _rp(NAV_TEXTS.cliffClimb.success)(subject, sPr),
              badgeText: 'SUMMIT', badgeClass: 'gold' });
          } else {
            personalScores[subject] -= 0.5; chefGrudge[subject] += 0.5;
            timeline.push({ type: 'navEvent', subtype: 'cliffClimb', phase: 1, group: label, player: subject, players: group,
              text: _rp(NAV_TEXTS.cliffClimb.fail)(subject, sPr),
              badgeText: 'CLIMB FAIL', badgeClass: 'red', grudgeType: 'cowardice' });
          }
          break;
        }
        case 'quicksand': {
          const victim = group.reduce((worst, n) => !worst || pStats(n).physical < pStats(worst).physical ? n : worst, null);
          const helper = group.find(n => n !== victim);
          if (helper) {
            const helpRoll = pStats(helper).physical * 0.08 + pStats(helper).loyalty * 0.05 + _noise(-0.5, 0.5);
            if (helpRoll > 0.5) {
              personalScores[helper] += 0.5; addBond(victim, helper, 0.4); chefGrudge[helper] -= 0.5;
              timeline.push({ type: 'navEvent', subtype: 'quicksand', phase: 1, group: label, player: victim, players: group,
                text: _rp(NAV_TEXTS.quicksand.escape)(victim, pronouns(victim), helper),
                badgeText: 'RESCUED', badgeClass: 'green' });
            } else {
              personalScores[victim] -= 0.5;
              timeline.push({ type: 'navEvent', subtype: 'quicksand', phase: 1, group: label, player: victim, players: group,
                text: _rp(NAV_TEXTS.quicksand.stuck)(victim, pronouns(victim)),
                badgeText: 'STUCK', badgeClass: 'yellow' });
            }
          }
          break;
        }
        case 'animalEncounter': {
          const animals = ['bear', 'skunk', 'porcupine', 'raccoon', 'moose'];
          const animal = _rp(animals);
          const roll = s.boldness * 0.1 + s.physical * 0.05 + _noise(-1.0, 1.0);
          if (roll > 0.8) {
            personalScores[subject] += 0.7; chefGrudge[subject] -= 0.5; popDelta(subject, 1);
            timeline.push({ type: 'navEvent', subtype: 'animalEncounter', phase: 1, group: label, player: subject, players: group,
              text: _rp(NAV_TEXTS.animalEncounter.brave)(subject, sPr, animal),
              badgeText: `${animal.toUpperCase()} (BRAVE)`, badgeClass: 'gold' });
          } else {
            personalScores[subject] -= 0.5; chefGrudge[subject] += 0.5;
            timeline.push({ type: 'navEvent', subtype: 'animalEncounter', phase: 1, group: label, player: subject, players: group,
              text: _rp(NAV_TEXTS.animalEncounter.flee)(subject, sPr, animal),
              badgeText: `${animal.toUpperCase()} (FLED)`, badgeClass: 'red', grudgeType: 'cowardice' });
          }
          break;
        }
        case 'supplyFind': {
          const items = ['rope', 'flare', 'granola bar', 'first aid kit', 'tarp'];
          const item = _rp(items);
          personalScores[subject] += 0.5;
          supplies[label].extras.push(item);
          timeline.push({ type: 'navEvent', subtype: 'supplyFind', phase: 1, group: label, player: subject, players: [subject],
            text: _rp(NAV_TEXTS.supplyFind)(subject, item),
            badgeText: 'SUPPLY FOUND', badgeClass: 'green' });
          break;
        }
        case 'pairArgument': {
          if (group.length < 2) break;
          const [a, b] = group.slice(0, 2);
          const bond = getBond(a, b);
          if (bond < 1) {
            personalScores[a] -= 0.3; personalScores[b] -= 0.3; addBond(a, b, -0.2);
            chefGrudge[a] += 0.3; chefGrudge[b] += 0.3;
            timeline.push({ type: 'navEvent', subtype: 'pairArgument', phase: 1, group: label, players: [a, b],
              text: _rp(NAV_TEXTS.pairArgument.fight)(a, b),
              badgeText: 'ARGUMENT', badgeClass: 'red' });
          } else {
            personalScores[a] += 0.3; personalScores[b] += 0.3; addBond(a, b, 0.2);
            timeline.push({ type: 'navEvent', subtype: 'pairArgument', phase: 1, group: label, players: [a, b],
              text: _rp(NAV_TEXTS.pairArgument.strategize)(a, b),
              badgeText: 'TEAMWORK', badgeClass: 'green' });
          }
          break;
        }
        case 'compassMalfunction': {
          const checker = group.reduce((best, n) => !best || pStats(n).intuition > pStats(best).intuition ? n : best, null);
          const roll = pStats(checker).intuition * 0.1 + _noise(-0.5, 0.5);
          if (roll > 0.6) {
            personalScores[checker] += 0.5;
            timeline.push({ type: 'navEvent', subtype: 'compassMalfunction', phase: 1, group: label, player: checker, players: group,
              text: _rp(NAV_TEXTS.compassMalfunction.notice)(checker, pronouns(checker)),
              badgeText: 'COMPASS CAUGHT', badgeClass: 'green' });
          } else {
            group.forEach(n => personalScores[n] -= 0.3);
            supplies[label].compass = false;
            timeline.push({ type: 'navEvent', subtype: 'compassMalfunction', phase: 1, group: label, players: group,
              text: _rp(NAV_TEXTS.compassMalfunction.miss)(group),
              badgeText: 'COMPASS BROKEN', badgeClass: 'red' });
          }
          break;
        }
        case 'landmark': {
          const roll = s.mental * 0.08 + s.intuition * 0.06 + _noise(-1.0, 1.0);
          if (roll > 0.8) {
            personalScores[subject] += 0.8;
            timeline.push({ type: 'navEvent', subtype: 'landmark', phase: 1, group: label, player: subject, players: group,
              text: _rp(NAV_TEXTS.landmark)(subject, sPr),
              badgeText: 'SHORTCUT', badgeClass: 'gold' });
          }
          break;
        }
        case 'partnerInjury': {
          if (group.length < 2) break;
          const victim = group.reduce((worst, n) => !worst || pStats(n).endurance < pStats(worst).endurance ? n : worst, null);
          const helper = group.find(n => n !== victim);
          personalScores[victim] -= 0.3;
          if (pStats(helper).loyalty * 0.08 + _noise(-0.3, 0.3) > 0.4) {
            personalScores[helper] += 0.5; addBond(victim, helper, 0.4); chefGrudge[helper] -= 0.5;
            timeline.push({ type: 'navEvent', subtype: 'partnerInjury', phase: 1, group: label, player: helper, players: [victim, helper],
              text: _rp(NAV_TEXTS.partnerInjury.help)(helper, victim, pronouns(helper)),
              badgeText: 'PARTNER HELP', badgeClass: 'green' });
          } else {
            chefGrudge[helper] += 1.0; addBond(victim, helper, -0.5);
            timeline.push({ type: 'navEvent', subtype: 'partnerInjury', phase: 1, group: label, player: helper, players: [victim, helper],
              text: _rp(NAV_TEXTS.partnerInjury.abandon)(helper, victim, pronouns(helper)),
              badgeText: 'ABANDONED', badgeClass: 'red', grudgeType: 'abandonment' });
          }
          break;
        }
        case 'forage': {
          const roll = s.endurance * 0.06 + s.intuition * 0.06 + _noise(-1.0, 1.0);
          if (roll > 0.7) {
            personalScores[subject] += 0.5;
            supplies[label].extras.push('food');
            timeline.push({ type: 'navEvent', subtype: 'forage', phase: 1, group: label, player: subject, players: [subject],
              text: _rp(NAV_TEXTS.forage.success)(subject, sPr),
              badgeText: 'FOOD FOUND', badgeClass: 'green' });
          } else {
            personalScores[subject] -= 0.5;
            timeline.push({ type: 'navEvent', subtype: 'forage', phase: 1, group: label, player: subject, players: [subject],
              text: _rp(NAV_TEXTS.forage.fail)(subject, sPr),
              badgeText: 'BAD BERRIES', badgeClass: 'red' });
          }
          break;
        }
      }
      eventsFired++;
    }

    // Sasquatchanakwa hint events (1-2 per pair, phase 1)
    const hintTypes = ['footprints', 'roar'].filter(t => !firedEvents.sasquatchTypes.has(t));
    const hintCount = 1 + (Math.random() < 0.4 ? 1 : 0);
    for (let h = 0; h < Math.min(hintCount, hintTypes.length); h++) {
      const hType = hintTypes[h];
      firedEvents.sasquatchTypes.add(hType);
      const hText = _rp(SASQUATCH_TEXTS[hType])(group);
      timeline.push({ type: 'sasquatchHint', subtype: hType, phase: 1, group: label, players: group,
        text: hText, badgeText: 'SOMETHING IN THE WOODS', badgeClass: 'yellow' });
      // Spook check for low boldness
      group.forEach(n => {
        if (pStats(n).boldness * 0.08 + _noise(-0.3, 0.3) < 0.4) {
          personalScores[n] -= 0.2;
        }
      });
    }
  });

  // Cross-pair awareness — trailing pair hears the leaders ahead
  if (pairs.length >= 2) {
    const [pA, pB] = [pairs[0], pairs[1]];
    const scoreA = pA.members.reduce((s, n) => s + personalScores[n], 0) / pA.members.length;
    const scoreB = pB.members.reduce((s, n) => s + personalScores[n], 0) / pB.members.length;
    const leader = scoreA > scoreB ? pA : pB;
    const trailer = scoreA > scoreB ? pB : pA;
    const trailerPlayer = _rp(trailer.members);

    timeline.push({ type: 'crossPairAwareness', phase: 1, group: trailer.label, players: [trailerPlayer],
      text: `${trailerPlayer} freezes. Through the trees: voices. Pair ${leader.label}. They sound close. Too close. They're ahead.`,
      badgeText: 'OVERHEARD', badgeClass: 'blue' });

    const reactionRoll = pStats(trailerPlayer).temperament * 0.1 + _noise(-0.3, 0.3);
    if (reactionRoll > 0.5) {
      personalScores[trailerPlayer] += 0.3;
      timeline.push({ type: 'crossPairReaction', phase: 1, group: trailer.label, players: trailer.members,
        text: `"They're ahead of us." ${trailerPlayer} picks up the pace. The pair doubles their speed.`,
        badgeText: 'MOTIVATED', badgeClass: 'green' });
    } else {
      personalScores[trailerPlayer] -= 0.3;
      timeline.push({ type: 'crossPairReaction', phase: 1, group: trailer.label, players: trailer.members,
        text: `"We're already behind?" ${trailerPlayer}'s shoulders drop. Morale takes a hit.`,
        badgeText: 'DEMORALIZED', badgeClass: 'grey' });
    }
  }

  // Chef walkie-talkie — targets the worst-performing pair
  if (pairs.length >= 2) {
    const pairProgress = pairs.map(p => ({
      label: p.label,
      avg: p.members.reduce((s, n) => s + personalScores[n], 0) / p.members.length
    }));
    const worstPair = pairProgress.sort((a, b) => a.avg - b.avg)[0];
    const target = _rp(pairs.find(p => p.label === worstPair.label).members);
    const targetPair = pairs.find(p => p.members.includes(target));
    chefGrudge[target] += 0.3;
    timeline.push({ type: 'chefInterject', phase: 1, group: targetPair.label, player: target, players: [target],
      text: _rp(CHEF_INTERJECTS.lost)(target),
      badgeText: '📻 CHEF', badgeClass: 'grey', grudgeType: 'taunt', grudgeDelta: 0.3 });
  }
}

function _phaseTrapsTheft(pairs, activePlayers, timeline, personalScores, chefGrudge, sasquatch, supplies, firedEvents) {
  sasquatch.aggression = 2;
  const targetEventsPerPair = 4;

  pairs.forEach(pair => {
    const label = pair.label;
    const group = pair.members;
    const rivalPair = pairs.find(p => p.label !== label);
    const eventsForPair = firedEvents[label];
    let eventsFired = 0;

    // Trap/defense setting based on archetype
    group.forEach(name => {
      if (eventsFired >= targetEventsPerPair) return;
      const s = pStats(name);

      if (_canScheme(name)) {
        // Set a trap
        const trapTypes = ['snare', 'falseTrail', 'pitTrap', 'decoyCamp'].filter(t => !eventsForPair.has('trap_' + t));
        if (trapTypes.length === 0) return;
        const trapType = _rp(trapTypes);
        eventsForPair.add('trap_' + trapType);

        const setRoll = s.strategic * 0.1 + s.mental * 0.08 + _noise(-1.0, 1.0);

        // Backfire check for pit trap
        if (trapType === 'pitTrap' && s.mental * 0.06 + _noise(0, 1) < 0.4) {
          personalScores[name] -= 0.5; chefGrudge[name] += 0.5;
          timeline.push({ type: 'trap', subtype: trapType, phase: 2, group: label, setter: name, players: [name],
            text: _rp(TRAP_TEXTS.pitTrap.backfire)(name), result: 'backfire', trapType,
            badgeText: 'TRAP BACKFIRE', badgeClass: 'red' });
          eventsFired++;
          return;
        }

        timeline.push({ type: 'trap', subtype: trapType, phase: 2, group: label, setter: name, players: [name],
          text: _rp(TRAP_TEXTS[trapType]?.set || TRAP_TEXTS.snare.set)(name),
          badgeText: 'TRAP SET', badgeClass: 'yellow', trapType, result: 'set' });

        // Trap resolution — does rival pair trigger it?
        const victim = _rp(rivalPair.members);
        const victimS = pStats(victim);
        const detectRoll = victimS.intuition * 0.12 + _noise(-0.5, 0.5);
        const isPerceptive = _archOf(victim) === 'perceptive-player' && !eventsForPair.has('perceptiveDetect');

        if (isPerceptive || detectRoll > 1.0) {
          if (isPerceptive) eventsForPair.add('perceptiveDetect');
          personalScores[victim] += 0.5;
          const detectText = TRAP_TEXTS[trapType]?.detected
            ? _rp(TRAP_TEXTS[trapType].detected)(victim, pronouns(victim))
            : `${victim} spots the trap and steps around it. Filed under "things to remember."`;
          timeline.push({ type: 'trapDetect', subtype: trapType, phase: 2, group: rivalPair.label, player: victim, players: [victim],
            text: detectText, badgeText: 'TRAP DETECTED', badgeClass: 'green', trapType, result: 'detected' });
        } else if (TRAP_TEXTS[trapType]?.caught || TRAP_TEXTS[trapType]?.fooled) {
          const penalty = trapType === 'falseTrail' ? -1.0 : trapType === 'snare' ? -0.8 : trapType === 'pitTrap' ? -1.0 : -0.5;
          personalScores[victim] += penalty;
          personalScores[name] += 0.8; addBond(victim, name, -0.5);
          const caughtTexts = TRAP_TEXTS[trapType].caught || TRAP_TEXTS[trapType].fooled;
          const caughtText = _rp(caughtTexts)(trapType === 'falseTrail' || trapType === 'decoyCamp' ? rivalPair.members : victim, pronouns(victim));
          timeline.push({ type: 'trapTriggered', subtype: trapType, phase: 2, player: victim, players: [victim, name],
            text: caughtText, badgeText: 'TRAPPED!', badgeClass: 'red', trapType, result: 'triggered', target: victim, setter: name });
        }
        eventsFired++;
      } else if (_isNice(name)) {
        // Defensive measure
        const defTypes = ['tripWire', 'guard', 'encourage'].filter(t => !eventsForPair.has('def_' + t));
        if (defTypes.length === 0) return;
        const defType = _rp(defTypes);
        eventsForPair.add('def_' + defType);
        personalScores[name] += 0.3;

        let defText;
        if (defType === 'encourage') {
          const partner = group.find(n => n !== name) || name;
          addBond(partner, name, 0.3);
          personalScores[partner] += 0.2;
          defText = `${name} puts a hand on ${partner}'s shoulder. "We got this." It's not strategy. It's genuine.`;
        } else {
          defText = TRAP_TEXTS[defType]?.set
          ? _rp(TRAP_TEXTS[defType].set)(name, pronouns(name))
          : TRAP_TEXTS[defType]?.active
            ? _rp(TRAP_TEXTS[defType].active)(name, pronouns(name))
            : `${name} sets up a defensive perimeter. Nobody's sneaking past.`;
        }
        timeline.push({ type: 'defense', subtype: defType, phase: 2, group: label, player: name, players: [name],
          text: defText, badgeText: defType === 'encourage' ? 'ENCOURAGED' : 'DEFENSE SET', badgeClass: 'blue' });
        eventsFired++;
      } else if (_isNeutral(name)) {
        // Neutral: scout for intel
        if (!eventsForPair.has('scout') && eventsFired < targetEventsPerPair) {
          eventsForPair.add('scout');
          const scoutRoll = s.intuition * 0.1 + s.mental * 0.08 + _noise(-0.5, 0.5);
          if (scoutRoll > 0.7) {
            personalScores[name] += 0.5; chefGrudge[name] -= 0.2;
            timeline.push({ type: 'scout', phase: 2, group: label, player: name, players: [name],
              text: `${name} climbs a tree and spots the rival pair's position. Intel acquired.`,
              badgeText: 'SCOUTED', badgeClass: 'blue' });
          } else {
            timeline.push({ type: 'scout', phase: 2, group: label, player: name, players: [name],
              text: `${name} tries to spot the other pair but the canopy is too thick. Wasted effort.`,
              badgeText: 'SCOUT FAIL', badgeClass: 'grey' });
          }
          eventsFired++;
        }
      }
    });

    // Supply steal attempt (cross-pair)
    if (eventsFired < targetEventsPerPair) {
      const stealers = group.filter(n => _canScheme(n));
      if (stealers.length > 0) {
        const thief = _rp(stealers);
        const target = _rp(rivalPair.members);
        const thiefS = pStats(thief);
        const targetS = pStats(target);

        // Check if target's pair has guard active
        const hasGuard = firedEvents[rivalPair.label].has('def_guard');
        if (hasGuard) {
          const guard = rivalPair.members.find(n => _isNice(n)) || rivalPair.members[0];
          timeline.push({ type: 'stealBlocked', phase: 2, player: thief, players: [thief, guard],
            text: _rp(TRAP_TEXTS.guard.blocked)(thief, guard),
            badgeText: 'STEAL BLOCKED', badgeClass: 'blue' });
        } else {
          const atkRoll = thiefS.social * 0.1 + thiefS.strategic * 0.08 + _noise(-1.0, 1.0);
          const defRoll = targetS.intuition * 0.1 + targetS.mental * 0.06 + _noise(-1.0, 1.0);

          if (atkRoll > defRoll + 0.3) {
            // Steal success — take a supply
            const stealable = ['map', 'compass', 'binoculars'].filter(k => supplies[rivalPair.label][k]);
            if (stealable.length > 0) {
              const item = _rp(stealable);
              supplies[rivalPair.label][item] = false;
              supplies[label][item] = true;
              personalScores[thief] += 1.0; personalScores[target] -= 1.0;
              chefGrudge[thief] += 0.5; addBond(target, thief, -0.7);
              timeline.push({ type: 'theft', phase: 2, thief, victim: target, item, success: true, players: [thief, target],
                text: _rp(TRAP_TEXTS.supplySteal.success)(thief, target),
                badgeText: `STOLE ${item.toUpperCase()}`, badgeClass: 'red' });
            }
          } else {
            addBond(target, thief, -0.3);
            timeline.push({ type: 'theft', phase: 2, thief, victim: target, success: false, players: [thief, target],
              text: _rp(TRAP_TEXTS.supplySteal.fail)(thief, target),
              badgeText: 'STEAL FAILED', badgeClass: 'yellow' });
          }
        }
        eventsFired++;
      }
    }
  });

  // Sasquatchanakwa stalking — one pair gets proximity event
  const eligibleTargetPairs = pairs.filter(p => p.label !== sasquatch.lastTarget);
  const targetPair = _rp(eligibleTargetPairs);
  sasquatch.lastTarget = targetPair.label;
  firedEvents.sasquatchTypes.add('shadow');

  timeline.push({ type: 'sasquatchStalking', subtype: 'shadow', phase: 2, group: targetPair.label, players: targetPair.members,
    text: _rp(SASQUATCH_TEXTS.shadow)(targetPair.members),
    badgeText: 'IT\'S CLOSE', badgeClass: 'yellow' });

  // Stand ground opportunity
  const bravest = targetPair.members.reduce((best, n) => !best || pStats(n).boldness > pStats(best).boldness ? n : best, null);
  const standRoll = pStats(bravest).boldness * 0.08 + pStats(bravest).physical * 0.05 + _noise(-1.0, 1.0);

  if (standRoll > 0.8) {
    personalScores[bravest] += 1.0; chefGrudge[bravest] -= 0.8; popDelta(bravest, 1);
    sasquatch.isProvoked = true; sasquatch.provokedBy = bravest;
    firedEvents.sasquatchTypes.add('standGround');
    timeline.push({ type: 'sasquatchStandGround', phase: 2, player: bravest, players: [bravest],
      text: _rp(SASQUATCH_TEXTS.standGround)(bravest, pronouns(bravest)),
      badgeText: 'STOOD GROUND', badgeClass: 'gold' });
  } else {
    personalScores[bravest] -= 0.3; chefGrudge[bravest] += 0.5;
    targetPair.members.forEach(n => personalScores[n] -= 0.2);
    sasquatch.chasesTriggered++;
    timeline.push({ type: 'sasquatchFlee', phase: 2, players: targetPair.members,
      text: `${targetPair.members.join(' and ')} break into a sprint. It follows. Not fast enough to catch them. Fast enough to terrify.`,
      badgeText: 'FLED', badgeClass: 'red', grudgeType: 'cowardice' });
  }

  // Chef taunts after trap/theft phase
  if (timeline.some(e => e.phase === 2 && (e.type === 'trap' || e.type === 'trapTriggered' || e.type === 'theft'))) {
    timeline.push({ type: 'chefInterject', phase: 2, players: activePlayers,
      text: _rp(CHEF_INTERJECTS.taunt)(),
      badgeText: '📻 CHEF', badgeClass: 'grey' });
  }
}

function _phaseOvernight(pairs, activePlayers, timeline, personalScores, chefGrudge, sasquatch, supplies, firedEvents) {
  sasquatch.aggression = 3;

  // ── Beat 1: Sasquatchanakwa attack → cave convergence ──
  // Chase — pair with lower avg (physical + boldness) first
  const pairThreat = pairs.map(p => ({
    ...p,
    avg: p.members.reduce((s, n) => s + pStats(n).physical + pStats(n).boldness, 0) / p.members.length,
  })).sort((a, b) => a.avg - b.avg);

  const firstChased = pairThreat[0];
  const secondChased = pairThreat[1];

  firedEvents.sasquatchTypes.add('chase');
  timeline.push({ type: 'sasquatchChase', phase: 3, players: firstChased.members,
    text: _rp(SASQUATCH_TEXTS.chase)(firstChased.members),
    badgeText: 'SASQUATCHANAKWA!', badgeClass: 'red' });

  // Individual flee checks
  const allFlee = [];
  [...firstChased.members, ...secondChased.members].forEach(name => {
    const s = pStats(name);
    const fleeRoll = s.physical * 0.05 + s.endurance * 0.03 + _noise(-0.5, 0.5);
    allFlee.push({ name, roll: fleeRoll });
    if (fleeRoll > 0.5) {
      personalScores[name] += fleeRoll;
    } else {
      personalScores[name] -= 0.3;
    }
  });

  // Slowest gets grabbed
  allFlee.sort((a, b) => a.roll - b.roll);
  const grabbed = allFlee[0].name;
  personalScores[grabbed] -= 1.0; chefGrudge[grabbed] += 0.5;
  firedEvents.sasquatchTypes.add('grabbed');
  timeline.push({ type: 'sasquatchGrabbed', phase: 3, player: grabbed, players: [grabbed],
    text: _rp(SASQUATCH_TEXTS.grabbed)(grabbed, pronouns(grabbed)),
    badgeText: 'GRABBED!', badgeClass: 'red', grudgeType: 'cowardice' });

  // Cave convergence
  timeline.push({ type: 'caveConvergence', phase: 3, players: activePlayers,
    text: _rp(SASQUATCH_TEXTS.cave),
    badgeText: 'CAVE', badgeClass: 'blue' });

  // ── Beat 2: Bats + tension ──
  activePlayers.forEach(name => {
    const batRoll = pStats(name).temperament * 0.05 + _noise(-0.3, 0.3);
    if (batRoll < 0.3) {
      personalScores[name] -= 0.3; chefGrudge[name] += 0.3;
      timeline.push({ type: 'bats', phase: 3, player: name, players: [name],
        text: _rp(OVERNIGHT_TEXTS.bats.panic)(name, pronouns(name)),
        badgeText: 'BAT PANIC', badgeClass: 'red' });
    }
  });

  // Cross-pair tension beat
  const crossPairs = [];
  pairs[0].members.forEach(a => {
    pairs[1].members.forEach(b => {
      crossPairs.push({ a, b, bond: getBond(a, b) });
    });
  });
  crossPairs.sort((x, y) => Math.abs(y.bond) - Math.abs(x.bond));
  if (crossPairs.length > 0) {
    const top = crossPairs[0];
    if (top.bond >= 2) {
      addBond(top.a, top.b, 0.3);
      timeline.push({ type: 'caveTension', phase: 3, players: [top.a, top.b],
        text: `${top.a} and ${top.b} find each other in the cave. A nod. They're still good.`,
        badgeText: 'ALLIES REUNITE', badgeClass: 'green' });
    } else if (top.bond <= -2) {
      timeline.push({ type: 'caveTension', phase: 3, players: [top.a, top.b],
        text: `${top.a} and ${top.b} end up on opposite sides of the cave. Neither speaks. The silence says everything.`,
        badgeText: 'RIVALS', badgeClass: 'red' });
    }
  }

  // ── Beat 2.5: Fire politics — who sleeps closest? ──
  const fireRanking = activePlayers.map(n => ({
    name: n,
    assertiveness: pStats(n).social * 0.1 + pStats(n).boldness * 0.1 + _noise(-0.5, 0.5)
  })).sort((a, b) => b.assertiveness - a.assertiveness);
  const fireKing = fireRanking[0].name;
  const fireOutcast = fireRanking[fireRanking.length - 1].name;
  if (fireKing !== fireOutcast) {
    addBond(fireOutcast, fireKing, -0.3); chefGrudge[fireOutcast] += 0.2;
    timeline.push({ type: 'firePolitics', phase: 3, players: [fireKing, fireOutcast],
      text: `${fireKing} claims the spot closest to the fire. ${fireOutcast} ends up at the edge, shivering. Nobody objects.`,
      badgeText: 'FIRE POLITICS', badgeClass: 'grey' });
  }

  // ── Beat 2.75: Information trading ──
  if (pairs.length >= 2) {
    const socialPlayer = activePlayers.reduce((best, n) =>
      !best || pStats(n).social > pStats(best).social ? n : best, null);
    const socialPair = pairs.find(p => p.members.includes(socialPlayer));
    const otherPair = pairs.find(p => p !== socialPair);
    if (otherPair) {
      const otherTarget = _rp(otherPair.members);
      const socialRoll = pStats(socialPlayer).social * 0.1 + pStats(socialPlayer).strategic * 0.05 + _noise(-0.5, 0.5);
      if (socialRoll > 0.8) {
        personalScores[socialPlayer] += 0.5;
        addBond(socialPlayer, otherTarget, 0.5);
        timeline.push({ type: 'intelTrade', phase: 3, players: [socialPlayer, otherTarget],
          text: `By the fire, ${socialPlayer} chats up ${otherTarget}. Friendly questions. Casual tone. By morning, ${socialPlayer} knows their route, their supply status, their plan. ${otherTarget} knows nothing they didn't already.`,
          badgeText: 'INTEL EXTRACTED', badgeClass: 'blue' });
      } else {
        addBond(socialPlayer, otherTarget, 0.8);
        timeline.push({ type: 'intelTrade', phase: 3, players: [socialPlayer, otherTarget],
          text: `${socialPlayer} and ${otherTarget} talk honestly by the fire. Tomorrow they're opponents again. Tonight, they're just cold.`,
          badgeText: 'SHARED INFO', badgeClass: 'green' });
      }
    }
  }

  // ── Beat 3: Social manipulation / theft ──
  const schemers = activePlayers.filter(n => _canScheme(n));
  const guards = activePlayers.filter(n => _isNice(n) && pStats(n).loyalty >= 6);

  // Allow up to 2 schemers to attempt theft
  const thiefCandidates = schemers.slice(0, 2);

  if (thiefCandidates.length > 0) {
    thiefCandidates.forEach(thief => {
    // Pick target from rival pair
    const thiefPair = pairs.find(p => p.members.includes(thief));
    const rivalPairs = pairs.filter(p => !p.members.includes(thief));
    const rivalPair = _rp(rivalPairs);
    const target = rivalPair.members.reduce((worst, n) =>
      !worst || pStats(n).intuition < pStats(worst).intuition ? n : worst, null);

    // Check if target has a guard
    const targetGuard = rivalPair.members.find(n => guards.includes(n) && n !== target);
    if (targetGuard) {
      const guardQuality = pStats(targetGuard).loyalty * 0.1 + pStats(targetGuard).endurance * 0.05;
      timeline.push({ type: 'overnightGuard', phase: 3, player: targetGuard, players: [targetGuard],
        text: _rp(OVERNIGHT_TEXTS.guard)(targetGuard, pronouns(targetGuard)),
        badgeText: 'ON WATCH', badgeClass: 'blue' });
      personalScores[targetGuard] += 0.3; chefGrudge[targetGuard] -= 0.3;

      // Theft blocked
      timeline.push({ type: 'theftBlocked', phase: 3, players: [thief, targetGuard],
        text: `${thief} waits for an opening. ${targetGuard} never gives one. The attempt dies.`,
        badgeText: 'BLOCKED', badgeClass: 'blue' });
    } else {
      // Theft attempt with perceived bond gap
      const thiefS = pStats(thief);
      const targetS = pStats(target);
      const percBondGap = getPerceivedBond(target, thief) - getBond(target, thief);
      const atkRoll = thiefS.social * 0.12 + thiefS.strategic * 0.08 + _noise(-1.0, 1.0);
      const defRoll = targetS.intuition * 0.12 + targetS.mental * 0.08 - percBondGap * 0.15 + _noise(-1.0, 1.0);

      if (atkRoll > defRoll + 0.5) {
        // Full success
        const stealable = ['map', 'compass', 'binoculars'].filter(k => supplies[rivalPair.label][k]);
        if (stealable.length > 0) {
          stealable.forEach(item => {
            supplies[rivalPair.label][item] = false;
            supplies[thiefPair.label][item] = true;
          });
          personalScores[thief] += 1.5; personalScores[target] -= 1.5;
          chefGrudge[thief] += 1.0; chefGrudge[target] += 0.5;
          addBond(target, thief, -2.0);
          timeline.push({ type: 'theft', phase: 3, thief, victim: target, item: 'all supplies', success: true,
            players: [thief, target],
            text: _rp(OVERNIGHT_TEXTS.theft.success)(thief, target),
            badgeText: 'HEIST', badgeClass: 'red', grudgeType: 'weakness' });

          // Victim sleep-through
          timeline.push({ type: 'sleepThrough', phase: 3, player: target, players: [target],
            text: _rp(OVERNIGHT_TEXTS.sleepThrough)(target, pronouns(target)),
            badgeText: 'SLEPT THROUGH IT', badgeClass: 'grey', grudgeType: 'weakness' });
        }
      } else if (atkRoll > defRoll) {
        // Partial
        const stealable = ['map', 'compass', 'binoculars'].filter(k => supplies[rivalPair.label][k]);
        if (stealable.length > 0) {
          const item = stealable[0];
          supplies[rivalPair.label][item] = false;
          supplies[thiefPair.label][item] = true;
          personalScores[thief] += 0.8; personalScores[target] -= 0.8;
          chefGrudge[thief] += 0.5; addBond(target, thief, -1.0);
          timeline.push({ type: 'theft', phase: 3, thief, victim: target, item, success: true,
            players: [thief, target],
            text: _rp(OVERNIGHT_TEXTS.theft.partial)(thief, target, item),
            badgeText: `STOLE ${item.toUpperCase()}`, badgeClass: 'yellow' });
        }
      } else {
        // Caught
        personalScores[thief] -= 1.0; chefGrudge[thief] += 1.0;
        addBond(target, thief, -2.0); popDelta(target, 1);
        timeline.push({ type: 'theft', phase: 3, thief, victim: target, success: false,
          players: [thief, target],
          text: _rp(OVERNIGHT_TEXTS.theft.caught)(thief, target),
          badgeText: 'CAUGHT!', badgeClass: 'red' });
      }
    }
    }); // end thiefCandidates.forEach
  } else {
    // No schemers — fallback cave events
    const tensePair = activePlayers.filter(n => activePlayers.some(o => o !== n && getBond(n, o) < 0));
    if (tensePair.length >= 2) {
      const a = tensePair[0], b = activePlayers.find(o => o !== a && getBond(a, o) < 0) || tensePair[1];
      timeline.push({ type: 'caveTension', phase: 3, players: [a, b],
        text: `${a} and ${b} share a wall of the cave. The silence between them could crush stone.`,
        badgeText: 'TENSION', badgeClass: 'yellow' });
    } else if (activePlayers.length >= 2) {
      const [a, b] = activePlayers.slice(0, 2);
      addBond(a, b, 0.2);
      timeline.push({ type: 'caveChat', phase: 3, players: [a, b],
        text: `${a} and ${b} stay up talking. No strategy. Just two people in a cave, waiting for sunrise.`,
        badgeText: 'LATE NIGHT CHAT', badgeClass: 'green' });
    }
  }

  // ── Beat 4: Sleep watch ──
  activePlayers.forEach(name => {
    if (pairs.some(p => firedEvents[p.label]?.has('watch_' + name))) return;
    const s = pStats(name);
    if (s.loyalty * 0.08 + _noise(-0.3, 0.3) > 0.5) {
      personalScores[name] += 0.3; chefGrudge[name] -= 0.3;
      const pairLabel = pairs.find(p => p.members.includes(name)).label;
      firedEvents[pairLabel].add('watch_' + name);
    }
  });

  // Nightmare event (1 random low-temperament player)
  const nightmareCandidate = activePlayers
    .filter(n => pStats(n).temperament <= 4)
    .sort(() => Math.random() - 0.5)[0];
  if (nightmareCandidate && Math.random() < 0.5) {
    personalScores[nightmareCandidate] -= 0.3;
    timeline.push({ type: 'nightmare', phase: 3, player: nightmareCandidate, players: [nightmareCandidate],
      text: _rp(OVERNIGHT_TEXTS.nightmare)(nightmareCandidate, pronouns(nightmareCandidate)),
      badgeText: 'NIGHTMARE', badgeClass: 'grey' });
  }

  // ── Additional overnight events (campfire, vulnerability, Sasquatchanakwa sounds) ──
  // Campfire story
  if (Math.random() < 0.6) {
    const teller = activePlayers.reduce((best, n) => !best || pStats(n).social > pStats(best).social ? n : best, null);
    const listeners = activePlayers.filter(n => n !== teller);
    listeners.forEach(n => { addBond(n, teller, 0.2); personalScores[n] += 0.2; });
    personalScores[teller] += 0.3;
    timeline.push({ type: 'campfireStory', phase: 3, player: teller, players: activePlayers,
      text: _rp(OVERNIGHT_TEXTS.campfireStory)(teller, listeners),
      badgeText: 'CAMPFIRE', badgeClass: 'green' });
  }

  // Vulnerability confession
  if (Math.random() < 0.4) {
    const confessor = activePlayers.filter(n => pStats(n).social >= 5 && pStats(n).temperament <= 5)
      .sort(() => Math.random() - 0.5)[0];
    if (confessor) {
      const listener = activePlayers.filter(n => n !== confessor).sort((a, b) => getBond(confessor, b) - getBond(confessor, a))[0];
      if (listener) {
        personalScores[confessor] += 0.3; personalScores[listener] += 0.2;
        addBond(confessor, listener, 0.4); addBond(listener, confessor, 0.3);
        timeline.push({ type: 'vulnerability', phase: 3, player: confessor, players: [confessor, listener],
          text: _rp(OVERNIGHT_TEXTS.vulnerability)(confessor, pronouns(confessor), listener),
          badgeText: 'VULNERABLE', badgeClass: 'green' });
      }
    }
  }

  // ── Sasquatch face reveal — fires once when aggression is high ──
  if (sasquatch.aggression >= 3 && !firedEvents.sasquatchTypes.has('faceReveal')) {
    firedEvents.sasquatchTypes.add('faceReveal');
    const revealTarget = sasquatch.provokedBy && activePlayers.includes(sasquatch.provokedBy)
      ? sasquatch.provokedBy
      : activePlayers.reduce((worst, n) => !worst || pStats(n).boldness < pStats(worst).boldness ? n : worst, null);
    const pr = pronouns(revealTarget);

    timeline.push({ type: 'sasquatchReveal', phase: 3, player: revealTarget, players: [revealTarget],
      text: _rp(SASQUATCH_REVEAL)(revealTarget, pr),
      badgeText: '🐾 FACE TO FACE', badgeClass: 'red' });

    const nearby = activePlayers.filter(n => n !== revealTarget);
    if (nearby.length > 0) {
      const witness = _rp(nearby);
      addBond(revealTarget, witness, 1.0);
      timeline.push({ type: 'sharedTerror', phase: 3, players: [revealTarget, witness],
        text: `${witness} saw it too. Neither says a word. They just move closer to the fire.`,
        badgeText: 'SHARED TERROR', badgeClass: 'grey' });
    }

    popDelta(revealTarget, 2);
    sasquatch.aggression += 1;
  }

  // Sasquatchanakwa circling sounds
  timeline.push({ type: 'sasquatchCircling', phase: 3, players: activePlayers,
    text: `Outside the cave: footsteps. Heavy. Circling. It hasn't left. Nobody sleeps well.`,
    badgeText: 'IT\'S STILL THERE', badgeClass: 'yellow' });
  activePlayers.forEach(n => {
    if (pStats(n).boldness * 0.05 + _noise(-0.2, 0.2) < 0.3) {
      personalScores[n] -= 0.2;
    }
  });

  // ── Beat 5: Morning aftermath ──
  const thefts = timeline.filter(e => e.type === 'theft' && e.phase === 3 && e.success);
  thefts.forEach(t => {
    timeline.push({ type: 'morningDiscovery', phase: 3, player: t.victim, players: [t.victim, t.thief],
      text: _rp(OVERNIGHT_TEXTS.morningTheft)(t.victim, pronouns(t.victim)),
      badgeText: 'MORNING RECKONING', badgeClass: 'red' });
    timeline.push({ type: 'confrontation', phase: 3, players: [t.victim, t.thief],
      text: _rp(OVERNIGHT_TEXTS.confrontation)(t.victim, t.thief),
      badgeText: 'CONFRONTATION', badgeClass: 'red' });
  });

  // Showmance moment — if any showmance pair is in the cave together
  if (gs.showmances?.length) {
    gs.showmances.forEach(sm => {
      const [smA, smB] = sm.players || [];
      if (smA && smB && activePlayers.includes(smA) && activePlayers.includes(smB)) {
        if (sm.phase === 'broken-up') return;
        if (!romanticCompat(smA, smB)) return;
        addBond(smA, smB, 0.3);
        timeline.push({ type: 'showmanceMoment', phase: 3, players: [smA, smB],
          text: `In the firelight, ${smA} and ${smB} share a quiet look. The cave feels smaller. Warmer.`,
          badgeText: '💕 SHOWMANCE', badgeClass: 'pink' });
      }
    });
  }
}

function _phaseSprint(pairs, activePlayers, timeline, personalScores, chefGrudge, sasquatch, supplies, firedEvents) {
  // Base sprint score (delta only — added to personalScores at end)
  const sprintScores = {};
  activePlayers.forEach(name => {
    const s = pStats(name);
    let sprint = s.physical * 0.1 + s.endurance * 0.08 + _noise(-1.0, 1.0);

    // Supply advantages — major impact for missing items
    const myPair = pairs.find(p => p.members.includes(name));
    if (supplies[myPair.label].map) sprint += 1.5; else sprint -= 1.0;
    if (supplies[myPair.label].compass) sprint += 1.0; else sprint -= 0.5;
    if (supplies[myPair.label].binoculars) sprint += 0.3;

    sprintScores[name] = sprint;
  });

  // ── Distraction events ──

  // Food temptation — guaranteed for weakest-willed player (the Owen moment)
  const willScores = activePlayers.map(n => {
    const s = pStats(n);
    return { name: n, will: s.temperament * 0.4 + s.mental * 0.3 + s.strategic * 0.3 + _noise(-1, 1) };
  }).sort((a, b) => a.will - b.will);

  const _fireTemptation = (temptedPlayer) => {
    const temptedS = pStats(temptedPlayer);
    const resistRoll = temptedS.mental * 0.1 + temptedS.strategic * 0.08 + _noise(-0.5, 0.5);
    if (resistRoll > 0.8) {
      sprintScores[temptedPlayer] += 0.5; chefGrudge[temptedPlayer] -= 0.3;
      timeline.push({ type: 'foodTemptation', phase: 4, player: temptedPlayer, players: [temptedPlayer],
        text: _rp(SPRINT_TEXTS.foodTemptation.resist)(temptedPlayer, pronouns(temptedPlayer)),
        badgeText: 'RESISTED', badgeClass: 'green' });
    } else {
      sprintScores[temptedPlayer] -= 2.0; chefGrudge[temptedPlayer] += 2.0; popDelta(temptedPlayer, -1);
      const myPairLabel = pairs.find(p => p.members.includes(temptedPlayer))?.label;
      if (myPairLabel) firedEvents[myPairLabel].add('foodTemptation_' + temptedPlayer);
      timeline.push({ type: 'foodTemptation', phase: 4, player: temptedPlayer, players: [temptedPlayer],
        text: _rp(SPRINT_TEXTS.foodTemptation.fail)(temptedPlayer, pronouns(temptedPlayer)),
        badgeText: 'ATE CHEF\'S FOOD', badgeClass: 'red', grudgeType: 'foodTheft' });
    }
  };

  // 35% base chance per player, proportionally higher for low mental/intuition
  for (const { name: n } of willScores) {
    const s = pStats(n);
    // mental 5 + intuition 5 → multiplier ~1.0; mental 1 → ~1.8; mental 10 → ~0.4
    const mentalFactor = 1.5 - s.mental * 0.1;
    const intuitionFactor = 1.3 - s.intuition * 0.06;
    const chance = 0.35 * mentalFactor * intuitionFactor;
    if (Math.random() < chance) _fireTemptation(n);
  }

  // Chef sprint interject — calls out the player he hates most
  const grudgeLeader = activePlayers.reduce((worst, n) =>
    !worst || chefGrudge[n] > chefGrudge[worst] ? n : worst, null);
  if (grudgeLeader && chefGrudge[grudgeLeader] > 1.5) {
    chefGrudge[grudgeLeader] += 0.5;
    timeline.push({ type: 'chefInterject', phase: 4, player: grudgeLeader, players: [grudgeLeader],
      text: _rp(CHEF_INTERJECTS.grudge)(grudgeLeader),
      badgeText: '📻 CHEF WATCHING', badgeClass: 'red', grudgeType: 'surveillance', grudgeDelta: 0.5 });
  }

  // Tantrum slowdown
  const robbed = timeline.filter(e => e.type === 'theft' && e.phase === 3 && e.success).map(e => e.victim);
  robbed.forEach(name => {
    if (!activePlayers.includes(name)) return;
    if (pStats(name).temperament * 0.1 + _noise(-0.3, 0.3) < 0.35) {
      sprintScores[name] -= 1.0;
      timeline.push({ type: 'tantrum', phase: 4, player: name, players: [name],
        text: _rp(SPRINT_TEXTS.tantrum)(name, pronouns(name)),
        badgeText: 'TANTRUM', badgeClass: 'red' });
    }
  });

  // Risky shortcut
  activePlayers.forEach(name => {
    const s = pStats(name);
    if (s.boldness * 0.1 + _noise(-0.3, 0.3) > 0.65 && Math.random() < 0.4) {
      const roll = s.physical * 0.1 + s.boldness * 0.08 + _noise(-1.0, 1.0);
      if (roll > 1.0) {
        sprintScores[name] += 1.5; popDelta(name, 1);
        timeline.push({ type: 'shortcut', phase: 4, player: name, players: [name],
          text: _rp(SPRINT_TEXTS.shortcut.success)(name, pronouns(name)),
          badgeText: 'SHORTCUT!', badgeClass: 'gold' });
      } else {
        sprintScores[name] -= 1.0;
        timeline.push({ type: 'shortcut', phase: 4, player: name, players: [name],
          text: _rp(SPRINT_TEXTS.shortcut.fail)(name, pronouns(name)),
          badgeText: 'SHORTCUT FAIL', badgeClass: 'red' });
      }
    }
  });

  // Partner boost
  pairs.forEach(pair => {
    if (pair.members.length < 2) return;
    const [a, b] = pair.members;
    if (getBond(a, b) >= 3) {
      const faster = sprintScores[a] >= sprintScores[b] ? a : b;
      const slower = faster === a ? b : a;
      sprintScores[slower] += 0.5;
      timeline.push({ type: 'partnerBoost', phase: 4, players: [faster, slower],
        text: _rp(SPRINT_TEXTS.partnerBoost)(faster, slower),
        badgeText: 'PARTNER BOOST', badgeClass: 'green' });
    }
  });

  // Exhaustion collapse
  activePlayers.forEach(name => {
    const s = pStats(name);
    if (s.endurance * 0.1 + _noise(-0.3, 0.3) < 0.35 && Math.random() < 0.3) {
      sprintScores[name] -= 1.0;
      // Partner carry?
      const myPair = pairs.find(p => p.members.includes(name));
      const partner = myPair.members.find(n => n !== name);
      if (partner && pStats(partner).physical >= 7) {
        sprintScores[partner] += 0.5; chefGrudge[partner] -= 0.3;
        addBond(name, partner, 0.5);
        timeline.push({ type: 'partnerCarry', phase: 4, players: [partner, name],
          text: _rp(SPRINT_TEXTS.partnerCarry)(partner, name),
          badgeText: 'CARRIED!', badgeClass: 'gold' });
      } else {
        timeline.push({ type: 'exhaustion', phase: 4, player: name, players: [name],
          text: _rp(SPRINT_TEXTS.exhaustionCollapse)(name, pronouns(name)),
          badgeText: 'COLLAPSED', badgeClass: 'red' });
      }
    }
  });

  // Sasquatchanakwa final chase — targets bottom 2
  const sorted = [...activePlayers].sort((a, b) => sprintScores[a] - sprintScores[b]);
  const targets = sorted.slice(0, 2).filter(n => n !== sasquatch.provokedBy);
  targets.forEach(name => {
    const s = pStats(name);
    const fleeRoll = s.physical * 0.1 + s.endurance * 0.08 + _noise(-0.5, 0.5);
    if (fleeRoll > 0.8) {
      sprintScores[name] += 0.5;
      timeline.push({ type: 'sasquatchFinalFlee', phase: 4, player: name, players: [name],
        text: `Sasquatchanakwa bursts from the trees. ${name} runs. Faster than before. Adrenaline.`,
        badgeText: 'OUTRAN IT', badgeClass: 'green' });
    } else {
      sprintScores[name] -= 1.5; chefGrudge[name] += 0.5;
      timeline.push({ type: 'sasquatchFinalCaught', phase: 4, player: name, players: [name],
        text: _rp(SASQUATCH_TEXTS.finalChase)(name, pronouns(name)),
        badgeText: 'CAUGHT BY YETI', badgeClass: 'red' });
    }
  });

  // Provoked player avoided
  if (sasquatch.provokedBy && activePlayers.includes(sasquatch.provokedBy)) {
    timeline.push({ type: 'sasquatchAvoids', phase: 4, player: sasquatch.provokedBy, players: [sasquatch.provokedBy],
      text: _rp(SASQUATCH_TEXTS.avoids)(sasquatch.provokedBy, pronouns(sasquatch.provokedBy)),
      badgeText: 'REMEMBERED', badgeClass: 'gold' });
  }

  // ── Losing pair desperation arc ──
  const pairAvgs = pairs.map(p => ({
    label: p.label, members: p.members,
    avg: p.members.reduce((s, n) => s + personalScores[n] + sprintScores[n], 0) / p.members.length
  })).sort((a, b) => b.avg - a.avg);

  if (pairAvgs.length >= 2) {
    const trailingPair = pairAvgs[pairAvgs.length - 1];
    const leadPair = pairAvgs[0];
    const gap = leadPair.avg - trailingPair.avg;

    if (gap > 1.0) {
      const desperatePlayer = trailingPair.members.reduce((best, n) =>
        !best || pStats(n).boldness > pStats(best).boldness ? n : best, null);
      const pr = pronouns(desperatePlayer);
      const partner = trailingPair.members.find(n => n !== desperatePlayer) || desperatePlayer;

      const boldRoll = pStats(desperatePlayer).boldness * 0.12 + pStats(desperatePlayer).physical * 0.08 + _noise(-1.5, 1.5);

      if (boldRoll > 1.2) {
        sprintScores[desperatePlayer] += 2.0; sprintScores[partner] += 1.5;
        chefGrudge[desperatePlayer] -= 0.5; popDelta(desperatePlayer, 2);
        timeline.push({ type: 'desperationPlay', phase: 4, player: desperatePlayer, players: [...trailingPair.members],
          text: `${desperatePlayer} spots a gap in the treeline. "${pr.Sub === 'He' ? "He's" : pr.Sub === 'She' ? "She's" : "They're"} getting away! Come on!" ${pr.Sub} grabs ${partner} and crashes through the brush. Branches everywhere. But when they emerge — they're ahead. Barely.`,
          badgeText: 'CLUTCH SHORTCUT', badgeClass: 'gold' });
      } else if (boldRoll > 0.3) {
        sprintScores[desperatePlayer] += 0.8;
        timeline.push({ type: 'desperationPlay', phase: 4, player: desperatePlayer, players: [...trailingPair.members],
          text: `${desperatePlayer} veers off the trail, looking for a shortcut. ${partner} hesitates, then follows. They don't gain ground — but they don't lose any either. It was worth the try.`,
          badgeText: 'RISKY MOVE', badgeClass: 'blue' });
      } else {
        sprintScores[desperatePlayer] -= 1.0; sprintScores[partner] -= 0.5;
        chefGrudge[desperatePlayer] += 0.5; addBond(partner, desperatePlayer, -0.5);
        timeline.push({ type: 'desperationPlay', phase: 4, player: desperatePlayer, players: [...trailingPair.members],
          text: `${desperatePlayer} panics. "This way! I know a shortcut!" ${partner}: "That's a cliff." It was a cliff. They lose even more time.`,
          badgeText: 'BAD CALL', badgeClass: 'red', grudgeType: 'foolishness', grudgeDelta: 0.5 });
      }
    }
  }

  // ── False finish — one pair mistakes something for the totem pole ──
  if (pairs.length >= 2 && Math.random() < 0.6) {
    const falseFinisher = _rp(pairs);
    const spotter = _rp(falseFinisher.members);
    const pr = pronouns(spotter);
    sprintScores[spotter] -= 0.3; chefGrudge[spotter] += 0.3; popDelta(spotter, -1);
    timeline.push({ type: 'falseFinish', phase: 4, player: spotter, players: [...falseFinisher.members],
      text: `"THERE! I see it!" ${spotter} sprints toward a shape in the clearing. ${pr.Sub} skids to a stop. It's a dead tree. Not the totem pole. Not even close. ${pr.Sub} stands there, chest heaving, while ${pr.pos} partner catches up.`,
      badgeText: 'FALSE FINISH', badgeClass: 'grey' });
  }

  // ── Partner carry/abandon decision — when one partner is much stronger ──
  pairs.forEach(pair => {
    if (pair.members.length < 2) return;
    const [a, b] = pair.members;
    const gapAB = sprintScores[a] - sprintScores[b];
    const strongPlayer = gapAB > 2.0 ? a : gapAB < -2.0 ? b : null;
    if (!strongPlayer) return;

    const weakPlayer = strongPlayer === a ? b : a;
    const s = pStats(strongPlayer);
    const pr = pronouns(strongPlayer);
    const carryRoll = s.loyalty * 0.1 + getBond(strongPlayer, weakPlayer) * 0.05 + _noise(-0.3, 0.3);

    if (carryRoll > 0.5) {
      sprintScores[strongPlayer] -= 0.8; sprintScores[weakPlayer] += 1.5;
      addBond(weakPlayer, strongPlayer, 1.5); chefGrudge[strongPlayer] -= 0.5; popDelta(strongPlayer, 2);
      timeline.push({ type: 'partnerCarryChoice', phase: 4, players: [strongPlayer, weakPlayer],
        text: `${weakPlayer} stumbles. Can barely stand. ${strongPlayer} looks at the trail ahead, then back at ${pr.pos} partner. ${pr.Sub} turns around. "Get on my back." They're slower now. But they're together.`,
        badgeText: 'CARRIED', badgeClass: 'gold' });
    } else {
      sprintScores[strongPlayer] += 0.5; addBond(weakPlayer, strongPlayer, -2.0);
      chefGrudge[strongPlayer] += 0.5; popDelta(strongPlayer, -2);
      timeline.push({ type: 'partnerAbandoned', phase: 4, players: [strongPlayer, weakPlayer],
        text: `${weakPlayer} calls out for help. ${strongPlayer} glances back. Keeps running. The gap widens.`,
        badgeText: 'ABANDONED', badgeClass: 'red', grudgeType: 'abandonment', grudgeDelta: 0.5 });
    }
  });

  // Final dash — merge sprint deltas into personalScores
  activePlayers.forEach(name => {
    personalScores[name] += sprintScores[name];
  });

  // Final dash beat for last 2
  const finalTwo = [...activePlayers].sort((a, b) => sprintScores[a] - sprintScores[b]).slice(0, 2);
  finalTwo.forEach(name => {
    timeline.push({ type: 'finalDash', phase: 4, player: name, players: [name],
      text: _rp(SPRINT_TEXTS.finalDash)(name, pronouns(name)),
      badgeText: 'FINAL DASH', badgeClass: 'yellow' });
  });

  // Endurance silent bonus — high temperament + endurance players who didn't complain
  activePlayers.forEach(name => {
    const s = pStats(name);
    if (s.temperament * 0.05 + s.endurance * 0.05 > 0.7) {
      chefGrudge[name] -= 0.3;
    }
  });
}

// ══════════════════════════════════════════════════════
// MAIN SIMULATE FUNCTION
// ══════════════════════════════════════════════════════

export function simulateAreWeThereYeti(ep) {
  const activePlayers = [...gs.activePlayers];
  const personalScores = {};
  const chefGrudge = {};
  activePlayers.forEach(n => { personalScores[n] = 0; chefGrudge[n] = 0; });

  const timeline = [];

  // Supply tracking per pair
  const supplies = {};

  // Sasquatchanakwa state
  const sasquatch = { aggression: 0, lastTarget: null, chasesTriggered: 0, isProvoked: false, provokedBy: null };

  // ── PAIR FORMATION ── Bond-aware: showmances together, rivals paired, rest random
  const shuffled = [...activePlayers].sort(() => Math.random() - 0.5);
  const pairs = [];
  const pairLabels = 'ABCDEFGH'.split('');
  const assigned = new Set();

  // First pass: pair showmance partners (if both active)
  if (gs.showmances?.length) {
    gs.showmances.forEach(sm => {
      if (sm.phase === 'broken-up') return;
      const [a, b] = sm.players || [];
      if (a && b && shuffled.includes(a) && shuffled.includes(b) && !assigned.has(a) && !assigned.has(b)) {
        pairs.push({ label: pairLabels[pairs.length], members: [a, b] });
        assigned.add(a); assigned.add(b);
      }
    });
  }

  // Second pass: pair rivals (highest negative bond — forces drama)
  const unassigned = shuffled.filter(n => !assigned.has(n));
  const rivalCandidates = [];
  for (let i = 0; i < unassigned.length; i++) {
    for (let j = i + 1; j < unassigned.length; j++) {
      const bond = getBond(unassigned[i], unassigned[j]);
      if (bond < -2) rivalCandidates.push({ a: unassigned[i], b: unassigned[j], bond });
    }
  }
  rivalCandidates.sort((a, b) => a.bond - b.bond);
  rivalCandidates.forEach(({ a, b }) => {
    if (!assigned.has(a) && !assigned.has(b) && pairs.length < Math.floor(activePlayers.length / 2)) {
      pairs.push({ label: pairLabels[pairs.length], members: [a, b] });
      assigned.add(a); assigned.add(b);
    }
  });

  // Third pass: remaining players paired randomly
  const remaining = shuffled.filter(n => !assigned.has(n));
  for (let i = 0; i < remaining.length; i += 2) {
    if (i + 1 < remaining.length) {
      pairs.push({ label: pairLabels[pairs.length], members: [remaining[i], remaining[i + 1]] });
    } else {
      // Odd player out — merge into last pair to form trio
      pairs[pairs.length - 1].members.push(remaining[i]);
    }
  }

  // Init firedEvents + supplies per pair (AFTER pair formation)
  const firedEvents = { sasquatchTypes: new Set(), confessionalBuckets: new Set() };
  pairs.forEach(p => {
    firedEvents[p.label] = new Set();
    supplies[p.label] = { map: true, compass: true, binoculars: true, bugSpray: true, sleepingBag: true, extras: [] };
  });

  // ── PHASES ──
  _phaseDropOff(pairs, activePlayers, timeline, chefGrudge, sasquatch, firedEvents);
  _phaseNavigation(pairs, activePlayers, timeline, personalScores, chefGrudge, sasquatch, supplies, firedEvents);
  _phaseTrapsTheft(pairs, activePlayers, timeline, personalScores, chefGrudge, sasquatch, supplies, firedEvents);
  _phaseOvernight(pairs, activePlayers, timeline, personalScores, chefGrudge, sasquatch, supplies, firedEvents);
  _phaseSprint(pairs, activePlayers, timeline, personalScores, chefGrudge, sasquatch, supplies, firedEvents);

  // ── RESOLUTION ──
  // Clamp grudge floor at -2 to prevent gaming
  activePlayers.forEach(n => { if (chefGrudge[n] < -2) chefGrudge[n] = -2; });

  // Pair with highest avg personalScore wins immunity
  const pairScores = pairs.map(p => ({
    label: p.label,
    members: p.members,
    avg: p.members.reduce((sum, n) => sum + personalScores[n], 0) / p.members.length,
  }));
  pairScores.sort((a, b) => {
    if (Math.abs(b.avg - a.avg) > 0.01) return b.avg - a.avg;
    // Tiebreaker: avg (boldness + endurance)
    const tieA = a.members.reduce((s, n) => s + pStats(n).boldness + pStats(n).endurance, 0) / a.members.length;
    const tieB = b.members.reduce((s, n) => s + pStats(n).boldness + pStats(n).endurance, 0) / b.members.length;
    return tieB - tieA;
  });

  const winPair = pairScores[0];
  const losePair = pairScores[1];

  // Both winners immune
  winPair.members.forEach(n => popDelta(n, 2));
  timeline.push({ type: 'immunityReveal', phase: 5, players: winPair.members,
    text: _rp(VERDICT_TEXTS.immuneAnnounce)(winPair.members),
    badgeText: '🏆 PAIR IMMUNITY', badgeClass: 'gold' });

  // Chef picks elimination from non-immune
  const elimCandidates = activePlayers.filter(n => !winPair.members.includes(n));
  const elimScored = elimCandidates.map(n => ({
    name: n,
    score: personalScores[n] * 0.4 - chefGrudge[n] * 0.6 + _noise(-1.0, 1.0),
  })).sort((a, b) => a.score - b.score);

  const chefPick = elimScored[0].name;

  // Determine Chef's reason — highest single grudge category
  const grudgeCategories = {
    foodTheft: chefGrudge[chefPick] >= 2.0 && pairs.some(p => firedEvents[p.label]?.has('foodTemptation_' + chefPick)) ? 3 : 0,
    cowardice: 0, weakness: 0, abandonment: 0, lowScore: 0, multiple: 0,
  };
  // Check timeline for grudge-specific events
  timeline.forEach(e => {
    if (e.player !== chefPick) return;
    if (e.grudgeType === 'cowardice') grudgeCategories.cowardice++;
    if (e.grudgeType === 'weakness') grudgeCategories.weakness++;
    if (e.grudgeType === 'abandonment') grudgeCategories.abandonment++;
  });
  if (personalScores[chefPick] <= 0) grudgeCategories.lowScore = 2;
  const topGrudge = Object.entries(grudgeCategories).sort((a, b) => b[1] - a[1]);
  let chefReasonKey = topGrudge[0][1] > 0 ? topGrudge[0][0] : 'lowScore';
  if (topGrudge[0][1] > 0 && topGrudge[1][1] > 0 && topGrudge[0][1] - topGrudge[1][1] <= 1) chefReasonKey = 'multiple';
  const chefReason = _rp(CHEF_ELIM_REASONS[chefReasonKey])(chefPick);

  popDelta(chefPick, -2);
  timeline.push({ type: 'chefElimination', phase: 5, player: chefPick, players: elimCandidates,
    text: _rp(VERDICT_TEXTS.elimAnnounce)(chefPick, chefReason),
    badgeText: 'CHEF\'S CHOICE', badgeClass: 'red', chefReason });

  // ── ROMANCE INTEGRATION ──
  // Fire sparks for bonding moments: quicksand rescue, partner injury help, vulnerability
  const sparkEvents = timeline.filter(e =>
    (e.subtype === 'quicksand' || e.subtype === 'partnerInjury' ||
     e.type === 'quicksand' || e.type === 'partnerInjury') && e.players?.length >= 2);
  sparkEvents.forEach(evt => {
    const [a, b] = evt.players;
    if (a && b && romanticCompat(a, b)) {
      _challengeRomanceSpark(a, b, ep, null, null, personalScores, 'danger');
    }
  });
  // Vulnerability confession → spark
  const vulnEvents = timeline.filter(e => e.type === 'vulnerability' && e.players?.length >= 2);
  vulnEvents.forEach(evt => {
    const [a, b] = evt.players;
    if (a && b && romanticCompat(a, b)) {
      _challengeRomanceSpark(a, b, ep, null, null, personalScores, 'emotional');
    }
  });
  // Check existing showmances for advancement
  _checkShowmanceChalMoment(ep, 'yeti', null, personalScores, 'danger',
    [{ name: gs.mergeName || 'merge', members: activePlayers }]);

  // ── EP FIELDS ──
  ep.challengeType = 'individual';
  ep.challengeLabel = 'Are We There Yeti?';
  ep.challengeCategory = 'survival';
  ep.challengeDesc = 'Navigate the forest in pairs. First pair to tag the totem pole wins immunity. Chef eliminates one player.';
  ep.isAreWeThereYeti = true;
  ep.noTribal = true;
  ep.immunityWinner = winPair.members[0]; // Primary for compatibility
  ep.immunityWinners = [...winPair.members];
  ep.extraImmune = [...winPair.members];
  ep.eliminated = chefPick;
  ep.chefEliminated = chefPick;

  ep.chalMemberScores = { ...personalScores };
  updateChalRecord(ep);

  ep.challengePlacements = [...activePlayers]
    .sort((a, b) => personalScores[b] - personalScores[a])
    .map((name, i) => ({ name, place: i + 1, score: personalScores[name] }));

  ep.areWeThereYeti = {
    timeline,
    pairs: pairs.map(p => ({ label: p.label, members: [...p.members] })),
    personalScores: { ...personalScores },
    chefGrudge: { ...chefGrudge },
    sasquatch: { ...sasquatch },
    supplies: JSON.parse(JSON.stringify(supplies)),
    immunityPair: winPair.label,
    immunityWinners: [...winPair.members],
    chefEliminated: chefPick,
    chefReason,
    chefReasonKey,
    lowestScorer: elimScored[0].name,
    stolenItems: timeline.filter(e => e.type === 'theft' && e.success).map(e => ({ thief: e.thief, victim: e.victim, item: e.item, phase: e.phase })),
    trapsSet: timeline.filter(e => e.type === 'trap').map(e => ({ setter: e.setter, trapType: e.trapType, target: e.target, result: e.result, phase: e.phase })),
  };
}

// ══════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════

export function _textAreWeThereYeti(ep, ln, sec) {
  if (!ep.isAreWeThereYeti || !ep.areWeThereYeti) return;
  const yt = ep.areWeThereYeti;
  sec('ARE WE THERE YETI?');
  ln('Forest navigation race. Pairs race to camp totem pole. Chef eliminates one player.');
  ln('');

  ln('PAIRS:');
  yt.pairs.forEach(p => { ln(`  Pair ${p.label}: ${p.members.join(', ')}`); });
  ln('');

  ln('PERSONAL SCORES:');
  const sorted = Object.entries(yt.personalScores).sort(([, a], [, b]) => b - a);
  sorted.forEach(([name, score]) => {
    const isImmune = yt.immunityWinners.includes(name);
    const isElim = name === yt.chefEliminated;
    const tag = isImmune ? ' ★ IMMUNE' : isElim ? ' ✘ ELIMINATED' : '';
    ln(`  ${name}: ${score.toFixed(1)}${tag}`);
  });
  ln('');

  ln('CHEF GRUDGE:');
  Object.entries(yt.chefGrudge).sort(([, a], [, b]) => b - a).forEach(([name, grudge]) => {
    if (Math.abs(grudge) > 0.1) ln(`  ${name}: ${grudge > 0 ? '+' : ''}${grudge.toFixed(1)}`);
  });
  ln('');

  if (yt.stolenItems.length) {
    ln('STOLEN ITEMS:');
    yt.stolenItems.forEach(s => { ln(`  ${s.thief} stole ${s.item} from ${s.victim} (phase ${s.phase})`); });
    ln('');
  }

  if (yt.trapsSet.length) {
    ln('TRAPS:');
    yt.trapsSet.forEach(t => { ln(`  ${t.setter} set ${t.trapType} → ${t.result}`); });
    ln('');
  }

  const chefInterjections = yt.timeline.filter(e => e.type === 'chefInterject');
  if (chefInterjections.length) {
    ln('CHEF COMMENTARY:');
    chefInterjections.forEach(e => { ln(`  Phase ${e.phase}: ${e.text.replace(/<[^>]*>/g, '')}`); });
    ln('');
  }

  const despPlays = yt.timeline.filter(e => e.type === 'desperationPlay');
  if (despPlays.length) {
    ln('DESPERATION PLAYS:');
    despPlays.forEach(e => { ln(`  ${e.player}: ${e.badgeText}`); });
    ln('');
  }

  const reveals = yt.timeline.filter(e => e.type === 'sasquatchReveal');
  if (reveals.length) {
    ln('SASQUATCH ENCOUNTER:');
    reveals.forEach(e => { ln(`  ${e.player}: Face to face with Sasquatchanakwa`); });
    ln('');
  }

  const carryEvents = yt.timeline.filter(e => e.type === 'partnerCarryChoice' || e.type === 'partnerAbandoned');
  if (carryEvents.length) {
    ln('PARTNER DECISIONS:');
    carryEvents.forEach(e => { ln(`  ${e.players.join(' & ')}: ${e.badgeText}`); });
    ln('');
  }

  ln(`IMMUNITY: Pair ${yt.immunityPair} (${yt.immunityWinners.join(', ')})`);
  ln(`ELIMINATED: ${yt.chefEliminated} (Chef's choice — ${yt.chefReasonKey})`);
}

// ══════════════════════════════════════════════════════
// VP SCREEN BUILDERS
// ══════════════════════════════════════════════════════

// ── Shared helpers ──

let _stylesInjectedForRender = false;
function _yetiStylesOnce() {
  if (_stylesInjectedForRender) return '';
  _stylesInjectedForRender = true;
  setTimeout(() => { _stylesInjectedForRender = false; }, 0);
  return YETI_STYLES;
}

function _portrait(name, size) {
  return typeof window.rpPortrait === 'function' ? window.rpPortrait(name, size) : `<span style="color:var(--moon)">${name}</span>`;
}

function _ytRevealFn(stateKey, idx, epNum) {
  return `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${idx};const ep=gs.episodeHistory.find(e=>e.num===${epNum});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;
}

function _ytRevealAllFn(stateKey, total, epNum) {
  return `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${total - 1};const ep=gs.episodeHistory.find(e=>e.num===${epNum});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;
}

function _revealBtns(stateKey, nextIdx, total, epNum) {
  if (nextIdx >= total) return '';
  return `<div class="yeti-sticky-btns">
    <div class="yeti-reveal-main" onclick="${_ytRevealFn(stateKey, nextIdx, epNum)}">Keep moving → <span style="font-size:9px;opacity:0.6;margin-left:4px">${nextIdx + 1}/${total}</span></div>
    <div class="yeti-reveal-all" onclick="${_ytRevealAllFn(stateKey, total, epNum)}" style="margin-top:6px">Run to the end ▸▸</div>
  </div>`;
}

function _sasquatchHtml(proximity) {
  if (proximity === 'gone') return '';
  if (proximity === 'eyes') {
    return `<div class="sasquatch-presence" data-proximity="eyes"><div class="sq-body"><div class="sq-eye left"></div><div class="sq-eye right" style="display:inline-block;margin-left:20px"></div></div></div>`;
  }
  return `<div class="sasquatch-presence" data-proximity="${proximity}"><div class="sq-body"><div class="sq-eye left"></div><div class="sq-eye right"></div></div></div>`;
}

function _cardClass(evt) {
  if (evt.type === 'foodTemptation') return 'food-temptation';
  if (evt.type === 'chefInterject') return 'chef-radio';
  if (evt.type === 'sasquatchReveal') return 'sasquatch-reveal';
  if (evt.type === 'desperationPlay') return 'desperation';
  if (evt.subtype?.startsWith('sasquatch') || evt.type?.includes('sasquatch') || evt.type === 'caveConvergence') return 'sasquatch';
  if (evt.grudgeType || evt.type === 'theft' || evt.type === 'confrontation') return 'grudge';
  if (evt.type === 'theft' && evt.success) return 'grudge theft';
  if (evt.badgeClass === 'gold' || evt.type === 'showmanceMoment') return 'brave';
  return '';
}

function _cardStamp(evt) {
  if (evt.grudgeDelta > 0 || (evt.type === 'theft' && evt.success)) {
    const stamps = ['NOTED.', 'STRIKE.', 'UNACCEPTABLE.'];
    const s = evt.grudgeDelta >= 1.5 ? stamps[2] : evt.grudgeDelta >= 0.5 ? stamps[1] : stamps[0];
    return `<div class="yeti-grudge-stamp">${s}</div>`;
  }
  return '';
}

function _eventCard(evt, stateKey, i, epNum, revealed) {
  if (!revealed) return '';
  const cls = _cardClass(evt);
  const stamp = _cardStamp(evt);
  const portraitHtml = evt.players?.length
    ? `<div class="card-portrait" style="display:flex;gap:4px">${evt.players.map(p => _portrait(p, 32)).join('')}</div>`
    : evt.player ? `<div class="card-portrait">${_portrait(evt.player, 32)}</div>` : '';
  return `<div class="yeti-card ${cls}">
    ${portraitHtml}
    <div class="card-content">
      ${stamp}
      <div class="yeti-badge ${evt.badgeClass || 'grey'}">${evt.badgeText || ''}</div>
      <div class="yeti-text">${evt.text}</div>
    </div>
  </div>`;
}

function _trailMap(pairs, progress, landmarks, singleLine) {
  const pairColors = { A: 'amber', B: 'silver', C: 'green', D: 'amber', E: 'silver' };
  if (singleLine) {
    // Sprint: single race line
    const lines = pairs.map(p => {
      const clr = pairColors[p.label] || 'amber';
      const pct = Math.min(100, (progress[p.label] || 0));
      return `<div style="position:relative;height:20px;margin:6px 0">
        <div class="yeti-trail-label">PAIR ${p.label}</div>
        <div class="yeti-trail-line" style="position:absolute;left:40px;right:40px;top:8px">
          <div class="yeti-trail-fill ${clr}" style="width:${pct}%"></div>
          <div class="yeti-trail-dot ${clr}" style="left:${pct}%"></div>
        </div>
        <div class="yeti-trail-dest">🗿</div>
      </div>`;
    }).join('');
    return `<div class="yeti-trail-map" style="height:${40 + pairs.length * 32}px">${lines}</div>`;
  }
  // Multi-line trail map with landmarks
  const lmkIcons = { cliff: '⛰', river: '🌊', trap: '✕', sasquatch: '🐾', cave: '◖', totem: '🗿', start: '🚁' };
  const lines = pairs.map(p => {
    const clr = pairColors[p.label] || 'amber';
    const pct = Math.min(100, (progress[p.label] || 0));
    const lmHtml = (landmarks || []).filter(l => l.pair === p.label || !l.pair).map(l => {
      const lPct = Math.min(100, l.pct || 50);
      return `<div class="yeti-trail-landmark" style="left:${lPct}%">${lmkIcons[l.type] || '•'}</div>`;
    }).join('');
    return `<div style="position:relative;height:24px;margin:4px 0">
      <div class="yeti-trail-label">PAIR ${p.label}</div>
      <div class="yeti-trail-line" style="position:absolute;left:40px;right:40px;top:10px">
        <div class="yeti-trail-fill ${clr}" style="width:${pct}%;border-top:2px dashed rgba(200,208,220,0.15)"></div>
        <div class="yeti-trail-dot ${clr}" style="left:${pct}%"></div>
        ${lmHtml}
      </div>
      <div class="yeti-trail-dest">🗿</div>
    </div>`;
  }).join('');
  return `<div class="yeti-trail-map">${lines}</div>`;
}

function _campfireHtml(state) {
  const cls = state === 'bright' ? 'bright' : state === 'dim' ? 'dim' : state === 'embers' ? 'embers' : '';
  return `<div class="yeti-campfire ${cls}">
    <div class="yeti-flame f1"></div>
    <div class="yeti-flame f2"></div>
    <div class="yeti-flame f3"></div>
    <div class="yeti-campfire-base"></div>
    <div class="yeti-campfire-glow"></div>
  </div>`;
}

function _totemHtml(glow) {
  return `<div class="yeti-totem ${glow ? 'glow' : ''}">
    <div class="yeti-totem-face"></div>
    <div class="yeti-totem-seg"></div>
    <div class="yeti-totem-seg"></div>
    <div class="yeti-totem-seg"></div>
    <div class="yeti-totem-seg"></div>
  </div>`;
}

function _statusBar(yt) {
  const supplyIcons = (s) => [
    s.map ? '📍' : '<s style="opacity:0.2">📍</s>',
    s.compass ? '🧭' : '<s style="opacity:0.2">🧭</s>',
    s.binoculars ? '🔭' : '<s style="opacity:0.2">🔭</s>',
  ].join('');
  const pairStatus = yt.pairs.map(p =>
    `<span style="margin-right:12px"><span style="font-weight:700;color:var(--amber);font-size:9px;letter-spacing:1px">PAIR ${p.label}</span> ${supplyIcons(yt.supplies[p.label])}</span>`
  ).join('');
  const maxGrudge = Math.max(...Object.values(yt.chefGrudge));
  const mood = maxGrudge > 4 ? '😤 FURIOUS' : maxGrudge > 2 ? '😠 ANNOYED' : maxGrudge > 0.5 ? '😐 WATCHING' : '😶 NEUTRAL';
  const moodColor = maxGrudge > 4 ? '#f85149' : maxGrudge > 2 ? '#d29922' : '#8b949e';
  return `<div class="yeti-status-bar"><div>${pairStatus}</div><div style="color:${moodColor};font-weight:700;letter-spacing:1px">CHEF: ${mood}</div></div>`;
}

// ── Phase 0: Drop Off ──

export function rpBuildYetiDropOff(ep) {
  if (!ep.areWeThereYeti) return '';
  const yt = ep.areWeThereYeti;
  const events = yt.timeline.filter(e => e.phase === 0);

  const stateKey = `yeti_dropoff_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // Trail map: all pairs at start
  const progress = {};
  yt.pairs.forEach(p => { progress[p.label] = 0; });
  const mapHtml = _trailMap(yt.pairs, progress, [{ type: 'start', pct: 0 }, { type: 'totem', pct: 98 }]);

  const items = events.map((evt, i) => _eventCard(evt, stateKey, i, ep.num, i <= state.idx)).join('');
  const btns = _revealBtns(stateKey, state.idx + 1, events.length, ep.num);

  // Pair assignment cards
  const pairCards = yt.pairs.map(p => `<div style="text-align:center;padding:10px 14px;background:rgba(200,208,220,0.04);border-radius:6px;border:1px solid rgba(200,208,220,0.08)">
    <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:var(--amber)">PAIR ${p.label}</div>
    <div style="display:flex;gap:4px;margin-top:6px;justify-content:center">${p.members.map(n => _portrait(n, 40)).join('')}</div>
    <div style="font-size:10px;color:rgba(200,208,220,0.5);margin-top:4px">${p.members.join(' & ')}</div>
  </div>`).join('');

  const sceneIntro = `<div class="yeti-card" style="border-color:rgba(212,133,10,0.15);margin-bottom:16px">
    <div class="yeti-text" style="font-style:italic;text-align:center;line-height:1.8">
      The helicopter banks hard over black pines. Below, a clearing — torches, supply crates, Chef Hatchet waiting with crossed arms.
      The wilderness stretches in every direction. No roads. No signal. Just forest.
      <br><br>"Welcome to <strong>Are We There Yeti?</strong>" Chef grins. "You're not."
    </div>
  </div>`;

  return _yetiStylesOnce() + `<div class="rp-page yeti-forest" data-phase="0">
    <div class="yeti-eyebrow">Episode ${ep.num}</div>
    <div class="yeti-title">The Drop Off</div>
    <div class="yeti-sub">Chef Hatchet takes command. Helicopter clearing. Twilight.</div>
    ${_statusBar(yt)}
    ${sceneIntro}
    ${mapHtml}
    <div style="display:flex;justify-content:center;gap:8px;margin-bottom:16px;flex-wrap:wrap;position:relative;z-index:2">${pairCards}</div>
    ${items}${btns}
  </div>`;
}

// ── Phase 1: Trail (per pair) ──

export function rpBuildYetiTrail(ep, pair) {
  if (!ep.areWeThereYeti) return '';
  const yt = ep.areWeThereYeti;
  const events = yt.timeline.filter(e => e.phase === 1 && e.group === pair.label);

  const stateKey = `yeti_trail_${pair.label}_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // Trail progress: advance per revealed event
  const progress = {};
  yt.pairs.forEach(p => { progress[p.label] = 5; });
  if (events.length > 0 && state.idx >= 0) {
    progress[pair.label] = 5 + Math.min(((state.idx + 1) / events.length) * 35, 35);
  }

  // Landmarks from revealed events
  const landmarks = [];
  events.forEach((evt, i) => {
    if (i > state.idx) return;
    if (evt.subtype === 'quicksand' || evt.subtype === 'cliffClimb') landmarks.push({ type: 'cliff', pair: pair.label, pct: 5 + ((i + 1) / events.length) * 35 });
    if (evt.subtype === 'riverCross' || evt.subtype === 'waterCrossing') landmarks.push({ type: 'river', pair: pair.label, pct: 5 + ((i + 1) / events.length) * 35 });
    if (evt.type?.includes('sasquatch') || evt.subtype?.includes('sasquatch')) landmarks.push({ type: 'sasquatch', pair: pair.label, pct: 5 + ((i + 1) / events.length) * 35 });
  });
  landmarks.push({ type: 'totem', pct: 98 });

  const mapHtml = _trailMap([{ label: pair.label, members: pair.members }], progress, landmarks);

  // Sasquatch: far background, appears on sasquatch events
  const hasSasquatch = events.some((e, i) => i <= state.idx && (e.subtype?.startsWith('sasquatch') || e.type?.includes('sasquatch')));
  const sqHtml = hasSasquatch ? _sasquatchHtml('far') : '';

  const items = events.map((evt, i) => _eventCard(evt, stateKey, i, ep.num, i <= state.idx)).join('');
  const btns = _revealBtns(stateKey, state.idx + 1, events.length, ep.num);

  return _yetiStylesOnce() + `<div class="rp-page yeti-forest" data-phase="1">
    ${sqHtml}
    <div class="yeti-eyebrow">Episode ${ep.num}</div>
    <div class="yeti-title">The Trail — Pair ${pair.label}</div>
    <div class="yeti-sub">${pair.members.join(' & ')} navigate the darkening forest.</div>
    ${_statusBar(yt)}
    ${mapHtml}
    ${items}${btns}
  </div>`;
}

// ── Phase 2: Traps ──

export function rpBuildYetiTraps(ep) {
  if (!ep.areWeThereYeti) return '';
  const yt = ep.areWeThereYeti;
  const events = yt.timeline.filter(e => e.phase === 2);

  const stateKey = `yeti_traps_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // Trail map: all pairs in mid progress, trap markers appear
  const progress = {};
  yt.pairs.forEach(p => { progress[p.label] = 40; });
  if (events.length > 0 && state.idx >= 0) {
    // Advance based on revealed events
    yt.pairs.forEach(p => {
      const pEvts = events.filter(e => e.group === p.label || e.players?.some(n => p.members.includes(n)));
    progress[p.label] = 40 + Math.min(20, (pEvts.filter((_, i) => i <= state.idx).length / Math.max(1, pEvts.length)) * 20);
    });
  }
  const landmarks = [];
  events.forEach((evt, i) => {
    if (i > state.idx) return;
    if (evt.type === 'trap') landmarks.push({ type: 'trap', pct: 40 + ((i + 1) / events.length) * 15 });
    if (evt.type?.includes('sasquatch')) landmarks.push({ type: 'sasquatch', pct: 40 + ((i + 1) / events.length) * 15 });
  });
  landmarks.push({ type: 'cave', pct: 60 }, { type: 'totem', pct: 98 });
  const mapHtml = _trailMap(yt.pairs, progress, landmarks);

  // Sasquatch: mid-ground
  const hasSasquatch = events.some((e, i) => i <= state.idx && e.type?.includes('sasquatch'));
  const sqHtml = hasSasquatch ? _sasquatchHtml('mid') : _sasquatchHtml('far');

  const items = events.map((evt, i) => _eventCard(evt, stateKey, i, ep.num, i <= state.idx)).join('');
  const btns = _revealBtns(stateKey, state.idx + 1, events.length, ep.num);

  return _yetiStylesOnce() + `<div class="rp-page yeti-forest" data-phase="2">
    ${sqHtml}
    <div class="yeti-eyebrow">Episode ${ep.num}</div>
    <div class="yeti-title">Traps & Tricks</div>
    <div class="yeti-sub">Deep woods. Purple dusk. First stars appear through the canopy.</div>
    ${_statusBar(yt)}
    ${mapHtml}
    ${items}${btns}
  </div>`;
}

// ── Phase 3: The Night — Cave Mouth POV ──

export function rpBuildYetiNight(ep) {
  if (!ep.areWeThereYeti) return '';
  const yt = ep.areWeThereYeti;
  const events = yt.timeline.filter(e => e.phase === 3);

  const stateKey = `yeti_night_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // Determine scene state from revealed events
  let fireState = '';
  let sqProximity = 'far';
  let lastRevealedType = '';
  let sqEventCount = 0;
  events.forEach((evt, i) => {
    if (i > state.idx) return;
    lastRevealedType = evt.type;
    if (evt.type === 'campfireStory' || evt.type === 'vulnerability' || evt.type === 'showmanceMoment') fireState = 'bright';
    else if (evt.type === 'theft' && evt.success) fireState = 'dim';
    else if (evt.type === 'morningWake' || evt.type === 'dawn') fireState = 'embers';
    // Sasquatch proximity progression: far → mid → close → eyes
    if (evt.type?.includes('sasquatch') || evt.type === 'caveConvergence') {
      sqEventCount++;
      if (sqEventCount >= 3) sqProximity = 'eyes';
      else if (sqEventCount >= 2) sqProximity = 'close';
      else sqProximity = 'mid';
    }
  });
  const isMorning = lastRevealedType === 'morningWake' || lastRevealedType === 'dawn';
  if (isMorning) sqProximity = 'gone';

  // Player portraits in semicircle around fire
  const activePlayers = yt.pairs.flatMap(p => p.members);
  const fireCircle = activePlayers.map(name => {
    const isActive = events.some((e, i) => i === state.idx && (e.player === name || e.players?.includes(name)));
    return `<div class="yeti-fire-seat ${isActive ? 'active' : ''}">${_portrait(name, 36)}</div>`;
  }).join('');

  // Cave mouth with eyes
  const caveEyes = sqProximity !== 'gone'
    ? `<div class="yeti-cave-eyes"><div class="yeti-cave-eye"></div><div class="yeti-cave-eye"></div></div>` : '';
  const moonEl = !isMorning
    ? `<div class="yeti-cave-moon"></div>` : '';
  const morningGlow = isMorning
    ? `<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 50% 10%,rgba(255,200,100,0.12) 0%,transparent 50%);pointer-events:none;z-index:0"></div>` : '';

  const items = events.map((evt, i) => {
    if (i > state.idx) return '';
    const cls = _cardClass(evt);
    const stamp = _cardStamp(evt);
    const portraitHtml = evt.players?.length
      ? `<div class="card-portrait" style="display:flex;gap:4px">${evt.players.map(p => _portrait(p, 28)).join('')}</div>` : '';
    return `<div class="yeti-card ${cls}" style="background:rgba(10,10,15,0.5);backdrop-filter:blur(1px)">
      ${portraitHtml}
      <div class="card-content">
        ${stamp}
        <div class="yeti-badge ${evt.badgeClass || 'grey'}">${evt.badgeText || ''}</div>
        <div class="yeti-text">${evt.text}</div>
      </div>
    </div>`;
  }).join('');

  const btns = _revealBtns(stateKey, state.idx + 1, events.length, ep.num);

  return _yetiStylesOnce() + `<div class="rp-page yeti-forest" data-phase="3">
    <div class="yeti-cave">
      <div class="yeti-cave-walls"></div>
      <div class="yeti-cave-mouth">
        ${moonEl}
        ${caveEyes}
        ${morningGlow}
      </div>
      <div style="position:relative;z-index:2;padding-top:min(38%, 240px)">
        <div class="yeti-eyebrow">Episode ${ep.num}</div>
        <div class="yeti-title">The Night</div>
        <div class="yeti-sub">Cave mouth. Sasquatchanakwa is out there. What happens here stays on camera.</div>
        ${_statusBar(yt)}
        ${_campfireHtml(fireState)}
        <div class="yeti-fire-circle" style="margin:16px 0">${fireCircle}</div>
        ${items}${btns}
      </div>
    </div>
  </div>`;
}

// ── Phase 4: Sprint ──

export function rpBuildYetiSprint(ep) {
  if (!ep.areWeThereYeti) return '';
  const yt = ep.areWeThereYeti;
  const events = yt.timeline.filter(e => e.phase === 4);

  const stateKey = `yeti_sprint_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // Trail map: single race line, cave to totem
  const progress = {};
  yt.pairs.forEach(p => {
    const pEvts = events.filter(e => e.group === p.label || e.players?.some(n => p.members.includes(n)));
    const revealed = pEvts.filter((_, i) => i <= state.idx).length;
    progress[p.label] = 60 + Math.min(38, (revealed / Math.max(1, pEvts.length)) * 38);
  });
  const mapHtml = _trailMap(yt.pairs, progress, [], true);

  // Sasquatch behind stragglers
  const hasSqEvent = events.some((e, i) => i <= state.idx && e.type?.includes('sasquatch'));
  const sqHtml = hasSqEvent ? _sasquatchHtml('chasing') : _sasquatchHtml('far');

  // Supply status
  const supplyHtml = yt.pairs.map(p => {
    const s = yt.supplies[p.label];
    const items = [
      s.map ? '📍 Map' : '<s style="opacity:0.3">📍 Map</s>',
      s.compass ? '🧭 Compass' : '<s style="opacity:0.3">🧭 Compass</s>',
      s.binoculars ? '🔭 Binos' : '<s style="opacity:0.3">🔭 Binos</s>',
    ].join(' · ');
    return `<div style="margin-bottom:8px;padding:6px 10px;background:rgba(200,208,220,0.03);border-radius:4px;font-size:10px;position:relative;z-index:2">
      <span style="font-weight:700;color:var(--amber);letter-spacing:1px">PAIR ${p.label}</span> ${items}
    </div>`;
  }).join('');

  const items = events.map((evt, i) => _eventCard(evt, stateKey, i, ep.num, i <= state.idx)).join('');
  const btns = _revealBtns(stateKey, state.idx + 1, events.length, ep.num);

  return _yetiStylesOnce() + `<div class="rp-page yeti-forest" data-phase="4">
    ${sqHtml}
    <div class="yeti-eyebrow">Episode ${ep.num}</div>
    <div class="yeti-title">The Sprint</div>
    <div class="yeti-sub">Dawn breaks. Golden light. Race to the totem pole.</div>
    ${_statusBar(yt)}
    ${mapHtml}
    ${supplyHtml}
    ${items}${btns}
  </div>`;
}

// ── Phase 5: Chef's Verdict — Dawn at Totem Pole ──

export function rpBuildYetiVerdict(ep) {
  if (!ep.areWeThereYeti) return '';
  const yt = ep.areWeThereYeti;
  const elimName = yt.chefEliminated;
  const elimPr = pronouns(elimName);
  const winPair = yt.pairs.find(p => p.label === yt.immunityPair);

  // Build verdict beats for click-to-reveal
  const grudgeEntries = Object.entries(yt.chefGrudge)
    .filter(([n]) => !yt.immunityWinners.includes(n))
    .sort(([, a], [, b]) => b - a);
  const maxGrudge = Math.max(...grudgeEntries.map(([, g]) => Math.abs(g)), 1);

  // Beats: immunity, grudge bars (one per player), helicopter, chef points, reaction, torch snuff
  const beats = [];
  // Beat 0: Winning pair arrives
  beats.push({ type: 'immunity' });
  // Beat 1-N: Grudge bars
  grudgeEntries.forEach(([name, grudge]) => { beats.push({ type: 'grudge', name, grudge }); });
  // Helicopter
  beats.push({ type: 'helicopter' });
  // Chef points
  beats.push({ type: 'elimination' });
  // Reaction
  beats.push({ type: 'reaction' });
  // Torch snuff
  beats.push({ type: 'torchSnuff' });

  const stateKey = `yeti_verdict_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // Determine grudge sources per player from timeline
  const grudgeSources = {};
  yt.timeline.forEach(e => {
    if (!e.player && !e.players?.length) return;
    const names = e.player ? [e.player] : (e.players || []);
    names.forEach(n => {
      if (!grudgeSources[n]) grudgeSources[n] = [];
      if (e.grudgeType) grudgeSources[n].push(`${e.grudgeType} +${(e.grudgeDelta || 0).toFixed(1)}`);
    });
  });

  let beatHtml = '';
  beats.forEach((beat, i) => {
    if (i > state.idx) return;
    if (beat.type === 'immunity') {
      beatHtml += `<div class="yeti-verdict-beat">
        <div class="yeti-card brave" style="text-align:center">
          <div class="yeti-badge gold">🏆 PAIR IMMUNITY</div>
          <div style="display:flex;justify-content:center;gap:16px;margin:12px 0">
            ${winPair.members.map(n => `<div style="text-align:center">
              <div class="yeti-golden-ring" style="display:inline-block">${_portrait(n, 56)}</div>
              <div style="font-size:11px;color:var(--amber);margin-top:6px">${n}</div>
            </div>`).join('')}
          </div>
          <div class="yeti-text">First pair to tag the totem pole. Both safe tonight.</div>
        </div>
      </div>`;
    } else if (beat.type === 'grudge') {
      const width = Math.min(100, Math.abs(beat.grudge) / maxGrudge * 100);
      const isElim = beat.name === elimName;
      const sources = (grudgeSources[beat.name] || []).join(' | ') || 'baseline';
      beatHtml += `<div class="yeti-verdict-beat">
        <div class="yeti-grudge-bar">
          <div style="width:60px;font-size:11px;color:${isElim ? '#f85149' : 'var(--moon)'};font-weight:${isElim ? '700' : '400'}">${beat.name}</div>
          <div class="yeti-grudge-bar-track">
            <div class="yeti-grudge-bar-fill" style="width:${width}%"></div>
          </div>
          <div style="width:45px;text-align:right;font-size:10px;color:${beat.grudge > 1 ? '#f85149' : beat.grudge > 0 ? '#d29922' : '#3fb950'}">${beat.grudge > 0 ? '+' : ''}${beat.grudge.toFixed(1)}</div>
        </div>
        <div class="yeti-grudge-sources">${sources}</div>
      </div>`;
    } else if (beat.type === 'helicopter') {
      beatHtml += `<div class="yeti-verdict-beat" style="position:relative;min-height:50px;overflow:hidden">
        <div class="yeti-heli">🚁</div>
        <div class="yeti-card" style="background:rgba(0,0,0,0.3);border-color:rgba(255,60,60,0.15);text-align:center">
          <div style="font-size:14px;font-weight:900;letter-spacing:3px;color:var(--moon);font-family:'Courier New',monospace">"Listen up."</div>
        </div>
      </div>`;
    } else if (beat.type === 'elimination') {
      beatHtml += `<div class="yeti-verdict-beat">
        <div class="yeti-card grudge" style="border-left-color:#f85149;text-align:center;padding:20px">
          <div style="display:inline-block" class="yeti-elim-portrait">${_portrait(elimName, 72)}</div>
          <div style="font-size:18px;color:#f85149;margin-top:10px;font-weight:700">${elimName}</div>
          <div class="yeti-elim-stamp" style="margin-top:6px">ELIMINATED BY CHEF</div>
          <div class="yeti-text" style="text-align:center;font-style:italic;margin-top:10px">${yt.chefReason}</div>
        </div>
      </div>`;
    } else if (beat.type === 'reaction') {
      const arch = _archOf(elimName);
      const finalScore = yt.personalScores[elimName] || 0;
      // Find an elimination event confessional from timeline
      const elimEvt = yt.timeline.find(e => e.type === 'chefElimination' && e.player === elimName);
      const quote = elimEvt?.text || `${elimName} has been eliminated by Chef Hatchet.`;
      beatHtml += `<div class="yeti-verdict-beat">
        <div class="yeti-card" style="background:rgba(200,208,220,0.03);border-left-color:rgba(200,208,220,0.15)">
          <div style="display:flex;gap:12px;align-items:center">
            <div style="filter:grayscale(100%);opacity:0.7">${_portrait(elimName, 48)}</div>
            <div>
              <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:rgba(200,208,220,0.4);text-transform:uppercase">${arch}</div>
              <div class="yeti-text" style="font-style:italic;margin-top:4px">${quote}</div>
              <div style="font-size:10px;color:rgba(200,208,220,0.4);margin-top:6px">Final Score: ${finalScore.toFixed(1)}</div>
            </div>
          </div>
        </div>
      </div>`;
    } else if (beat.type === 'torchSnuff') {
      beatHtml += `<div class="yeti-verdict-beat" style="text-align:center">
        <div id="yeti-torch-snuff-${ep.num}" style="min-height:120px">
          <div class="torch-snuffed">${_portrait(elimName, 64)}</div>
        </div>
        <div style="font-size:13px;font-style:italic;color:rgba(200,208,220,0.5);margin-top:12px;letter-spacing:1px">Chef has spoken.</div>
      </div>`;
      // Fire after DOM insert via onerror hook (runs after innerHTML insertion)
      if (typeof window !== 'undefined') {
        window._yetiPostRender = () => {
          requestAnimationFrame(() => {
            const snuffEl = document.querySelector('#yeti-torch-snuff-' + ep.num + ' .torch-snuffed');
            if (snuffEl && typeof window.torchSnuffFx === 'function') window.torchSnuffFx(snuffEl);
          });
        };
      }
    }
  });

  // Unrevealed beats
  const nextIdx = state.idx + 1;
  let unrevealedHtml = '';
  // Unrevealed beats hidden — "Keep moving" button handles reveals

  const firstGrudgeIdx = beats.findIndex(b => b.type === 'grudge');
  const showGrudgeHeader = firstGrudgeIdx >= 0 && state.idx >= firstGrudgeIdx;

  const btns = _revealBtns(stateKey, nextIdx, beats.length, ep.num);

  return _yetiStylesOnce() + `<div class="rp-page yeti-forest" data-phase="5">
    ${_totemHtml(state.idx >= 0)}
    <div class="yeti-eyebrow">Episode ${ep.num}</div>
    <div class="yeti-title">Chef's Verdict</div>
    <div class="yeti-sub">Dawn. No tribal council. No vote. Chef decides.</div>
    ${_statusBar(yt)}
    <div style="position:relative;z-index:2">
      ${showGrudgeHeader ? '<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#f85149;margin-bottom:12px;text-align:center">CHEF\'S GRUDGE METER</div>' : ''}
      ${beatHtml}
      ${unrevealedHtml}
      ${btns}
    </div>
    <img src="" onerror="if(window._yetiPostRender){window._yetiPostRender();delete window._yetiPostRender;}" style="display:none">
  </div>`;
}
