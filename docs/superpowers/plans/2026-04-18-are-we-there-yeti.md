# Are We There Yeti? — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Post-merge forest navigation race challenge with Sasquatchanakwa AI, Chef grudge meter, pair immunity, Chef-picked elimination.

**Architecture:** Single file `js/chal/are-we-there-yeti.js` with internal phase functions. Integration via twists.js (flag), episode.js (dispatch + early return), vp-screens.js (7 screens), main.js (import), core.js (catalog), run-ui.js (tag).

**Tech Stack:** Vanilla ES modules, no build step.

---

## File Map

| Action | File | What |
|--------|------|------|
| Create | `js/chal/are-we-there-yeti.js` | Simulate + 7 VP builders + text backlog |
| Modify | `js/twists.js:~1323` | Add `are-we-there-yeti` engine type flag |
| Modify | `js/episode.js:~2057` | Add dispatch branch, early return with elimination |
| Modify | `js/vp-screens.js:~10279` | Add VP screen push for 7 screens |
| Modify | `js/vp-screens.js:~2004` | Add to debug challenge tab flag list |
| Modify | `js/vp-screens.js:~10288` | Add to generic challenge exclusion list |
| Modify | `js/vp-screens.js:~2702` | Add to challenge scores debug section |
| Modify | `js/vp-screens.js:~1062` | Add cold open twist text |
| Modify | `js/vp-screens.js:~634` | Add prev-episode cold open reference |
| Modify | `js/main.js:~34,~206` | Import module + register in challenge map |
| Modify | `js/core.js:~129` | Add twist catalog entry |
| Modify | `js/run-ui.js:~255` | Add episode history tag |

---

### Task 1: Scaffold — Exports, Imports, Constants, Text Pool

Create `js/chal/are-we-there-yeti.js` with all exports stubbed, imports, text constants, and helper utilities.

**Files:**
- Create: `js/chal/are-we-there-yeti.js`

- [ ] **Step 1: Create file with imports, constants, and stub exports**

```js
import { gs, pStats, pronouns, getBond, addBond, getPerceivedBond, updateChalRecord } from '../core.js';
import { computeHeat } from '../alliances.js';

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
  const arch = (window.players || []).find(p => p.name === name)?.archetype;
  return ['villain', 'mastermind', 'schemer'].includes(arch);
}
function _isNice(name) {
  const arch = (window.players || []).find(p => p.name === name)?.archetype;
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
  return (window.players || []).find(p => p.name === name)?.archetype || 'floater';
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

// ══════════════════════════════════════════════════════
// STUB EXPORTS (filled in subsequent tasks)
// ══════════════════════════════════════════════════════

export function simulateAreWeThereYeti(ep) {
  // Task 2-6 fill this
}

export function rpBuildYetiDropOff(ep) { return ''; }
export function rpBuildYetiTrail(ep, pair) { return ''; }
export function rpBuildYetiTraps(ep) { return ''; }
export function rpBuildYetiNight(ep) { return ''; }
export function rpBuildYetiSprint(ep) { return ''; }
export function rpBuildYetiVerdict(ep) { return ''; }
export function _textAreWeThereYeti(ep, ln, sec) {}
```

- [ ] **Step 2: Commit scaffold**

```bash
git add js/chal/are-we-there-yeti.js
git commit -m "feat(yeti): scaffold file with text pools and stub exports"
```

---

### Task 2: simulateAreWeThereYeti — Main Orchestrator + Pair Formation

Wire up the main simulate function: pair formation, state init, phase dispatch, resolution, ep fields.

**Files:**
- Modify: `js/chal/are-we-there-yeti.js` (replace stub `simulateAreWeThereYeti`)

- [ ] **Step 1: Implement main simulate function**

Replace the stub `simulateAreWeThereYeti` with:

```js
export function simulateAreWeThereYeti(ep) {
  const activePlayers = [...gs.activePlayers];
  const personalScores = {};
  const chefGrudge = {};
  activePlayers.forEach(n => { personalScores[n] = 0; chefGrudge[n] = 0; });

  const timeline = [];
  const firedEvents = { A: new Set(), B: new Set(), sasquatchTypes: new Set(), confessionalBuckets: new Set() };

  // Supply tracking per pair
  const supplies = {};

  // Sasquatchanakwa state
  const sasquatch = { aggression: 0, lastTarget: null, chasesTriggered: 0, isProvoked: false, provokedBy: null };

  // ── PAIR FORMATION ──
  const shuffled = [...activePlayers].sort(() => Math.random() - 0.5);
  const pairs = [];
  const pairLabels = ['A', 'B'];
  if (shuffled.length % 2 === 0) {
    pairs.push({ label: 'A', members: shuffled.slice(0, shuffled.length / 2) });
    pairs.push({ label: 'B', members: shuffled.slice(shuffled.length / 2) });
  } else {
    // Odd: first group is trio, second is pair
    const mid = Math.ceil(shuffled.length / 2);
    pairs.push({ label: 'A', members: shuffled.slice(0, mid) });
    pairs.push({ label: 'B', members: shuffled.slice(mid) });
  }
  // Init supplies per pair
  pairs.forEach(p => {
    supplies[p.label] = { map: true, compass: true, binoculars: true, bugSpray: true, sleepingBag: true, extras: [] };
  });

  // ── PHASES ──
  _phaseDropOff(pairs, activePlayers, timeline, chefGrudge, sasquatch, firedEvents);
  _phaseNavigation(pairs, activePlayers, timeline, personalScores, chefGrudge, sasquatch, supplies, firedEvents);
  _phaseTrapsTheft(pairs, activePlayers, timeline, personalScores, chefGrudge, sasquatch, supplies, firedEvents);
  _phaseOvernight(pairs, activePlayers, timeline, personalScores, chefGrudge, sasquatch, supplies, firedEvents);
  _phaseSprint(pairs, activePlayers, timeline, personalScores, chefGrudge, sasquatch, supplies, firedEvents);

  // ── RESOLUTION ──
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
    score: personalScores[n] * 0.4 - chefGrudge[n] * 0.6 + _noise(-0.5, 0.5),
  })).sort((a, b) => a.score - b.score);

  const chefPick = elimScored[0].name;

  // Determine Chef's reason — highest single grudge category
  const grudgeCategories = {
    foodTheft: chefGrudge[chefPick] >= 2.0 && firedEvents.A.has('foodTemptation_' + chefPick) ? 3 : 0,
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
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/are-we-there-yeti.js
git commit -m "feat(yeti): main simulate orchestrator with pair formation and resolution"
```

---

### Task 3: Phase Functions — Drop Off + Navigation

Implement `_phaseDropOff` and `_phaseNavigation`.

**Files:**
- Modify: `js/chal/are-we-there-yeti.js`

- [ ] **Step 1: Implement _phaseDropOff**

Add before the stub exports (or replace them as the function body grows):

```js
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
```

- [ ] **Step 2: Implement _phaseNavigation**

```js
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
      const otherPair = pairs.find(p => p.label !== label);
      // Use map-upside-down or getLost depending on method
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

    // Event pool — draw without replacement, cross-pair distinct
    const otherPairLabel = pairs.find(p => p.label !== label).label;
    const otherPairEvents = firedEvents[otherPairLabel];

    const eventPool = [
      'riverCross', 'cliffClimb', 'quicksand', 'animalEncounter',
      'supplyFind', 'pairArgument', 'compassMalfunction', 'landmark',
      'partnerInjury', 'forage',
    ].filter(e => !eventsForPair.has(e) && !otherPairEvents.has(e));

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
}
```

- [ ] **Step 3: Commit**

```bash
git add js/chal/are-we-there-yeti.js
git commit -m "feat(yeti): phase 0 drop-off + phase 1 navigation with events"
```

---

### Task 4: Phase Functions — Traps & Theft + Overnight

Implement `_phaseTrapsTheft` and `_phaseOvernight`.

**Files:**
- Modify: `js/chal/are-we-there-yeti.js`

- [ ] **Step 1: Implement _phaseTrapsTheft**

```js
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
        const defTypes = ['tripWire', 'guard'].filter(t => !eventsForPair.has('def_' + t));
        if (defTypes.length === 0) return;
        const defType = _rp(defTypes);
        eventsForPair.add('def_' + defType);
        personalScores[name] += 0.3;

        const defText = TRAP_TEXTS[defType]?.set
          ? _rp(TRAP_TEXTS[defType].set)(name, pronouns(name))
          : TRAP_TEXTS[defType]?.active
            ? _rp(TRAP_TEXTS[defType].active)(name, pronouns(name))
            : `${name} sets up a defensive perimeter. Nobody's sneaking past.`;
        timeline.push({ type: 'defense', subtype: defType, phase: 2, group: label, player: name, players: [name],
          text: defText, badgeText: 'DEFENSE SET', badgeClass: 'blue' });
        eventsFired++;
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
  const targetPairIdx = sasquatch.lastTarget === pairs[0].label ? 1 : 0;
  const targetPair = pairs[targetPairIdx];
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
}
```

- [ ] **Step 2: Implement _phaseOvernight**

```js
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

  // ── Beat 3: Social manipulation / theft ──
  const schemers = activePlayers.filter(n => _canScheme(n));
  const guards = activePlayers.filter(n => _isNice(n) && pStats(n).loyalty >= 6);

  if (schemers.length > 0) {
    const thief = schemers[0]; // primary schemer attempts
    // Pick target from rival pair
    const thiefPair = pairs.find(p => p.members.includes(thief));
    const rivalPair = pairs.find(p => !p.members.includes(thief));
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
  }

  // ── Beat 4: Sleep watch ──
  activePlayers.forEach(name => {
    if (firedEvents.A.has('watch_' + name) || firedEvents.B.has('watch_' + name)) return;
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
      if (activePlayers.includes(sm.a) && activePlayers.includes(sm.b)) {
        addBond(sm.a, sm.b, 0.3);
        timeline.push({ type: 'showmanceMoment', phase: 3, players: [sm.a, sm.b],
          text: `In the firelight, ${sm.a} and ${sm.b} share a quiet look. The cave feels smaller. Warmer.`,
          badgeText: 'SHOWMANCE', badgeClass: 'pink' });
      }
    });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add js/chal/are-we-there-yeti.js
git commit -m "feat(yeti): phase 2 traps/theft + phase 3 overnight with deception"
```

---

### Task 5: Phase Function — Sprint + Resolution

Implement `_phaseSprint`.

**Files:**
- Modify: `js/chal/are-we-there-yeti.js`

- [ ] **Step 1: Implement _phaseSprint**

```js
function _phaseSprint(pairs, activePlayers, timeline, personalScores, chefGrudge, sasquatch, supplies, firedEvents) {
  // Base sprint score
  const sprintScores = {};
  activePlayers.forEach(name => {
    const s = pStats(name);
    let sprint = personalScores[name] + s.physical * 0.1 + s.endurance * 0.08 + _noise(-1.0, 1.0);

    // Supply advantages
    const myPair = pairs.find(p => p.members.includes(name));
    if (supplies[myPair.label].map) sprint += 0.8;
    if (supplies[myPair.label].compass) sprint += 0.5;
    if (supplies[myPair.label].binoculars) sprint += 0.3;

    sprintScores[name] = sprint;
  });

  // ── Distraction events ──

  // Food temptation (the Owen moment)
  activePlayers.forEach(name => {
    const s = pStats(name);
    if (s.temperament * 0.1 + s.endurance * 0.05 < 0.7 && Math.random() < 0.35) {
      const resistRoll = s.mental * 0.1 + s.strategic * 0.08 + _noise(-0.5, 0.5);
      if (resistRoll > 0.8) {
        sprintScores[name] += 0.5; chefGrudge[name] -= 0.3;
        timeline.push({ type: 'foodTemptation', phase: 4, player: name, players: [name],
          text: _rp(SPRINT_TEXTS.foodTemptation.resist)(name, pronouns(name)),
          badgeText: 'RESISTED', badgeClass: 'green' });
      } else {
        sprintScores[name] -= 2.0; chefGrudge[name] += 2.0; popDelta(name, -1);
        firedEvents.A.add('foodTemptation_' + name);
        timeline.push({ type: 'foodTemptation', phase: 4, player: name, players: [name],
          text: _rp(SPRINT_TEXTS.foodTemptation.fail)(name, pronouns(name)),
          badgeText: 'ATE CHEF\'S FOOD', badgeClass: 'red', grudgeType: 'foodTheft' });
      }
    }
  });

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

  // Final dash — update personalScores from sprint
  activePlayers.forEach(name => {
    personalScores[name] = sprintScores[name];
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
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/are-we-there-yeti.js
git commit -m "feat(yeti): phase 4 sprint with distractions + Sasquatchanakwa finale"
```

---

### Task 6: Text Backlog

Implement `_textAreWeThereYeti`.

**Files:**
- Modify: `js/chal/are-we-there-yeti.js`

- [ ] **Step 1: Implement text backlog**

```js
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

  ln(`IMMUNITY: Pair ${yt.immunityPair} (${yt.immunityWinners.join(', ')})`);
  ln(`ELIMINATED: ${yt.chefEliminated} (Chef's choice — ${yt.chefReasonKey})`);
}
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/are-we-there-yeti.js
git commit -m "feat(yeti): text backlog"
```

---

### Task 7: Integration — twists.js, episode.js, core.js, main.js, run-ui.js

Wire challenge into engine. This is the critical integration task.

**Files:**
- Modify: `js/twists.js:~1323`
- Modify: `js/episode.js:~2057`
- Modify: `js/main.js:~34,~206`
- Modify: `js/core.js:~129`
- Modify: `js/run-ui.js:~255`

- [ ] **Step 1: Add twist flag in twists.js**

After the `camp-castaways` block (~line 1323), add:

```js
  } else if (engineType === 'are-we-there-yeti') {
    if (!gs.isMerged) {
      const _yMerging = gs.activePlayers.length <= (seasonConfig.mergeAt || 12);
      if (!_yMerging) return;
    }
    if (gs.activePlayers.length < 4) return;
    ep.isAreWeThereYeti = true;
```

- [ ] **Step 2: Add episode.js dispatch**

After the `isCampCastaways` block (~line 2060), add:

```js
  } else if (ep.isAreWeThereYeti) {
    // ── ARE WE THERE YETI: forest nav race, Chef eliminates ──
    simulateAreWeThereYeti(ep);

    // Chef eliminates directly — handle all state mutations here and return early
    const _ytElim = ep.chefEliminated;
    if (_ytElim) {
      handleAdvantageInheritance(_ytElim, ep);
      gs.activePlayers = gs.activePlayers.filter(p => p !== _ytElim);
      gs.eliminated.push(_ytElim);
      if (gs.isMerged) gs.jury.push(_ytElim);
      gs.advantages = gs.advantages.filter(a => a.holder !== _ytElim);

      // Provider tracking
      if (seasonConfig.foodWater === 'enabled' && gs.currentProviders?.includes(_ytElim)) {
        const _ytTribe = gs.isMerged ? (gs.mergeName || 'merge') : '';
        gs.providerVotedOutLastEp = { name: _ytElim, tribeName: _ytTribe };
      }
    }

    // Challenge record + camp events + bookkeeping
    updateChalRecord(ep);
    generateCampEvents(ep, 'post');
    updatePlayerStates(ep); checkPerceivedBondTriggers(ep); decayAllianceTrust(ep.num); recoverBonds(ep);
    updateSurvival(ep);
    gs.episode = epNum;
    if (gs.activePlayers.length <= seasonConfig.finaleSize) gs.phase = 'finale';

    gs.episodeHistory.push({
      num: epNum, eliminated: _ytElim || null, riChoice: null,
      immunityWinner: ep.immunityWinner || null,
      challengeType: ep.challengeType || 'individual',
      challengeLabel: ep.challengeLabel,
      challengeCategory: ep.challengeCategory,
      challengeDesc: ep.challengeDesc,
      chalPlacements: ep.challengePlacements || [],
      chalMemberScores: ep.chalMemberScores || {},
      isMerge: ep.isMerge, isAreWeThereYeti: true, noTribal: true,
      chefEliminated: _ytElim,
      votes: {}, alliances: [],
      twists: (ep.twists || []).map(t => ({...t})),
      tribesAtStart: (ep.tribesAtStart || []).map(t => ({ name: t.name, members: [...t.members] })),
      campEvents: ep.campEvents || null,
      journey: ep.journey || null,
      idolFinds: ep.idolFinds || [],
      advantagesPreTribal: ep.advantagesPreTribal || null,
      areWeThereYeti: ep.areWeThereYeti || null,
      summaryText: '', gsSnapshot: window.snapshotGameState(),
    });
    const stYT = generateSummaryText(ep);
    gs.episodeHistory[gs.episodeHistory.length - 1].summaryText = stYT;
    ep.summaryText = stYT;
    window.patchEpisodeHistory(ep);
    window.saveGameState();
    return ep;
```

- [ ] **Step 3: Add import in episode.js**

Near top imports, add:
```js
import { simulateAreWeThereYeti } from './chal/are-we-there-yeti.js';
```

- [ ] **Step 4: Add to main.js**

Import line (~line 34):
```js
import * as areWeThereYetiMod from './chal/are-we-there-yeti.js';
```

Challenge map entry (~line 206):
```js
  'are-we-there-yeti': { simulate: areWeThereYetiMod.simulateAreWeThereYeti, rpBuild: areWeThereYetiMod.rpBuildYetiDropOff, text: areWeThereYetiMod._textAreWeThereYeti },
```

- [ ] **Step 5: Add twist catalog entry in core.js**

After the `camp-castaways` entry (~line 129):
```js
  { id:'are-we-there-yeti', emoji:'🦶', name:'Are We There Yeti?', category:'challenge', phase:'post-merge', desc:'Post-merge forest navigation race. Random pairs dropped in woods. Sasquatchanakwa hunts. Overnight deception. Winning pair gets immunity. Chef picks elimination. No tribal vote.', engineType:'are-we-there-yeti', incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','brunch-of-disgustingness','lucky-hunt','hide-and-be-sneaky','off-the-chain','wawanakwa-gone-wild','tri-armed-triathlon','camp-castaways'] },
```

- [ ] **Step 6: Add episode history tag in run-ui.js**

After the Camp Castaways tag (~line 255):
```js
    const ytTag = ep.isAreWeThereYeti ? `<span class="ep-hist-tag" style="background:rgba(212,133,10,0.10);color:#d4850a">Are We There Yeti?</span>` : '';
```

And add `${ytTag}` to the tag concatenation in that section (find where ccTag is joined with other tags).

- [ ] **Step 7: Commit**

```bash
git add js/twists.js js/episode.js js/main.js js/core.js js/run-ui.js
git commit -m "feat(yeti): engine integration — twists, episode dispatch, catalog, tags"
```

---

### Task 8: VP Screens — CSS + Drop Off + Trail

Build first 3 VP screens with forest survival horror theme.

**Files:**
- Modify: `js/chal/are-we-there-yeti.js`
- Modify: `js/vp-screens.js:~10279,~2004,~10288,~1062,~2702`

- [ ] **Step 1: Add VP CSS constant**

At top of are-we-there-yeti.js, after text pools:

```js
// ══════════════════════════════════════════════════════
// VP STYLES
// ══════════════════════════════════════════════════════
const YETI_STYLES = `
<style>
.yeti-forest{--forest-deep:#1a2e1a;--amber:#d4850a;--moon:#c8d0dc;--shadow:#0d1117;--yeti-glow:#ff4d00;background:linear-gradient(180deg,var(--shadow) 0%,var(--forest-deep) 40%,#0f1f0f 100%);color:var(--moon);padding:24px 16px;min-height:100vh;font-family:Georgia,'Times New Roman',serif;position:relative;overflow:hidden}
.yeti-forest::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 50% 20%,rgba(200,208,220,0.06) 0%,transparent 60%);pointer-events:none}
.yeti-forest[data-phase="0"],.yeti-forest[data-phase="1"]{--sky:rgba(30,60,90,0.15)}
.yeti-forest[data-phase="2"]{--sky:rgba(50,30,70,0.15)}
.yeti-forest[data-phase="3"]{--sky:rgba(0,0,0,0.3)}
.yeti-forest[data-phase="4"]{--sky:rgba(80,60,20,0.1)}
.yeti-eyebrow{font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--amber);margin-bottom:8px;text-align:center}
.yeti-title{font-size:24px;text-align:center;color:var(--moon);margin-bottom:4px;letter-spacing:1px;text-shadow:0 0 20px rgba(200,208,220,0.1)}
.yeti-sub{font-size:11px;color:rgba(200,208,220,0.5);text-align:center;margin-bottom:20px}
.yeti-card{background:rgba(200,208,220,0.03);border:1px solid rgba(200,208,220,0.08);border-radius:8px;padding:14px;margin-bottom:12px;position:relative}
.yeti-card.sasquatch{border-color:rgba(255,77,0,0.3);animation:yeti-pulse 2s ease-in-out infinite}
.yeti-card.grudge{border-color:rgba(255,60,60,0.3)}
.yeti-card.brave{border-color:rgba(212,133,10,0.3)}
.yeti-badge{display:inline-block;font-size:9px;font-weight:700;letter-spacing:1.5px;padding:2px 8px;border-radius:3px;margin-bottom:8px}
.yeti-badge.gold{background:rgba(212,133,10,0.15);color:var(--amber)}
.yeti-badge.red{background:rgba(255,60,60,0.12);color:#f85149}
.yeti-badge.green{background:rgba(63,185,80,0.12);color:#3fb950}
.yeti-badge.blue{background:rgba(56,139,253,0.12);color:#388bfd}
.yeti-badge.yellow{background:rgba(210,153,34,0.12);color:#d29922}
.yeti-badge.grey{background:rgba(200,208,220,0.08);color:rgba(200,208,220,0.5)}
.yeti-badge.pink{background:rgba(219,112,147,0.12);color:#db7093}
.yeti-grudge-stamp{position:absolute;top:8px;right:12px;font-size:10px;font-weight:900;color:rgba(255,60,60,0.4);transform:rotate(-8deg);letter-spacing:2px;font-family:'Courier New',monospace}
.yeti-text{font-size:12px;line-height:1.6;color:rgba(200,208,220,0.85)}
.yeti-pair-header{font-size:14px;font-weight:700;color:var(--amber);margin:20px 0 8px;letter-spacing:1px}
@keyframes yeti-pulse{0%,100%{box-shadow:0 0 0 rgba(255,77,0,0)}50%{box-shadow:0 0 15px rgba(255,77,0,0.1)}}
.yeti-reveal-btn{display:inline-block;padding:6px 16px;background:rgba(212,133,10,0.12);color:var(--amber);border:1px solid rgba(212,133,10,0.25);border-radius:6px;cursor:pointer;font-size:11px;margin:4px}
.yeti-reveal-btn:hover{background:rgba(212,133,10,0.2)}
.yeti-score-bar{display:flex;align-items:center;gap:8px;margin:4px 0}
.yeti-score-fill{height:6px;border-radius:3px;background:var(--amber);transition:width 0.3s}
</style>`;
```

- [ ] **Step 2: Implement rpBuildYetiDropOff**

```js
export function rpBuildYetiDropOff(ep) {
  if (!ep.areWeThereYeti) return '';
  const yt = ep.areWeThereYeti;
  const events = yt.timeline.filter(e => e.phase === 0);

  let items = events.map(evt => {
    const cardClass = evt.grudgeType ? 'grudge' : '';
    const stamp = evt.grudgeDelta > 0 ? `<div class="yeti-grudge-stamp">NOTED.</div>` : '';
    return `<div class="yeti-card ${cardClass}">
      ${stamp}
      <div class="yeti-badge ${evt.badgeClass || 'grey'}">${evt.badgeText || ''}</div>
      <div class="yeti-text">${evt.text}</div>
      ${evt.players?.length ? `<div style="display:flex;gap:4px;margin-top:8px">${evt.players.map(p => typeof window.rpPortrait === 'function' ? window.rpPortrait(p, 32) : `<span>${p}</span>`).join('')}</div>` : ''}
    </div>`;
  }).join('');

  const stateKey = `yeti_dropoff_${ep.num}`;
  const screenId = 'yeti-dropoff';
  return YETI_STYLES + `<div class="yeti-forest" data-phase="0">
    <div class="yeti-eyebrow">Episode ${ep.num}</div>
    <div class="yeti-title">The Drop Off</div>
    <div class="yeti-sub">Chef Hatchet takes command.</div>
    <div style="display:flex;justify-content:center;gap:8px;margin-bottom:16px">
      ${yt.pairs.map(p => `<div style="text-align:center;padding:8px 12px;background:rgba(200,208,220,0.04);border-radius:6px;border:1px solid rgba(200,208,220,0.08)">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:var(--amber)">PAIR ${p.label}</div>
        <div style="display:flex;gap:4px;margin-top:6px">${p.members.map(n => typeof window.rpPortrait === 'function' ? window.rpPortrait(n, 40) : `<span style="color:var(--moon)">${n}</span>`).join('')}</div>
        <div style="font-size:10px;color:rgba(200,208,220,0.5);margin-top:4px">${p.members.join(' & ')}</div>
      </div>`).join('')}
    </div>
    ${items}
  </div>`;
}
```

- [ ] **Step 3: Implement rpBuildYetiTrail**

```js
export function rpBuildYetiTrail(ep, pair) {
  if (!ep.areWeThereYeti) return '';
  const yt = ep.areWeThereYeti;
  const events = yt.timeline.filter(e => e.phase === 1 && e.group === pair.label);

  const items = events.map(evt => {
    const cardClass = evt.subtype?.startsWith('sasquatch') ? 'sasquatch' : evt.grudgeType ? 'grudge' : evt.badgeClass === 'gold' ? 'brave' : '';
    const stamp = evt.grudgeDelta > 0 ? `<div class="yeti-grudge-stamp">STRIKE.</div>` : '';
    return `<div class="yeti-card ${cardClass}">
      ${stamp}
      <div class="yeti-badge ${evt.badgeClass || 'grey'}">${evt.badgeText || ''}</div>
      <div class="yeti-text">${evt.text}</div>
      ${evt.player ? `<div style="display:flex;gap:4px;margin-top:8px">${typeof window.rpPortrait === 'function' ? window.rpPortrait(evt.player, 32) : evt.player}</div>` : ''}
    </div>`;
  }).join('');

  return YETI_STYLES + `<div class="yeti-forest" data-phase="1">
    <div class="yeti-eyebrow">Episode ${ep.num}</div>
    <div class="yeti-title">The Trail — Pair ${pair.label}</div>
    <div class="yeti-sub">${pair.members.join(' & ')} navigate the forest.</div>
    ${items}
  </div>`;
}
```

- [ ] **Step 4: Wire VP screens in vp-screens.js**

Add import at top of vp-screens.js:
```js
import { rpBuildYetiDropOff, rpBuildYetiTrail, rpBuildYetiTraps, rpBuildYetiNight, rpBuildYetiSprint, rpBuildYetiVerdict } from './chal/are-we-there-yeti.js';
```

In the challenge screen push chain (~line 10279), after `isCampCastaways` block:
```js
  } else if (ep.isAreWeThereYeti && ep.areWeThereYeti) {
    vpScreens.push({ id:'yeti-dropoff', label:'The Drop Off', html: rpBuildYetiDropOff(ep) });
    (ep.areWeThereYeti.pairs || []).forEach(p => {
      vpScreens.push({ id:`yeti-trail-${p.label}`, label:`Trail: Pair ${p.label}`, html: rpBuildYetiTrail(ep, p) });
    });
    vpScreens.push({ id:'yeti-traps', label:'Traps & Tricks', html: rpBuildYetiTraps(ep) });
    vpScreens.push({ id:'yeti-night', label:'The Night', html: rpBuildYetiNight(ep) });
    vpScreens.push({ id:'yeti-sprint', label:'The Sprint', html: rpBuildYetiSprint(ep) });
    vpScreens.push({ id:'yeti-verdict', label:"Chef's Verdict", html: rpBuildYetiVerdict(ep) });
```

Add `ep.isAreWeThereYeti` to:
- Debug challenge tab flag list (~line 2004)
- Generic challenge exclusion (~line 10288)

Add cold open twist text (~line 1062):
```js
    case 'are-we-there-yeti': L.push('Are We There Yeti? Chef drops the players in the woods. Race back to camp in pairs. Watch out for the Sasquatchanakwa.'); break;
```

Add to debug challenge scores (~line 2702) — add `ep.isAreWeThereYeti` to the condition checking for personalScores display.

- [ ] **Step 5: Commit**

```bash
git add js/chal/are-we-there-yeti.js js/vp-screens.js
git commit -m "feat(yeti): VP screens — CSS, drop off, trail + vp-screens integration"
```

---

### Task 9: VP Screens — Traps, Night, Sprint, Verdict

Build remaining 4 VP screens.

**Files:**
- Modify: `js/chal/are-we-there-yeti.js`

- [ ] **Step 1: Implement rpBuildYetiTraps**

```js
export function rpBuildYetiTraps(ep) {
  if (!ep.areWeThereYeti) return '';
  const yt = ep.areWeThereYeti;
  const events = yt.timeline.filter(e => e.phase === 2);

  const items = events.map(evt => {
    const cardClass = evt.type.includes('sasquatch') ? 'sasquatch' : evt.grudgeType ? 'grudge' : '';
    const stamp = evt.grudgeDelta > 0 ? `<div class="yeti-grudge-stamp">UNACCEPTABLE.</div>` : '';
    return `<div class="yeti-card ${cardClass}">
      ${stamp}
      <div class="yeti-badge ${evt.badgeClass || 'grey'}">${evt.badgeText || ''}</div>
      <div class="yeti-text">${evt.text}</div>
    </div>`;
  }).join('');

  return YETI_STYLES + `<div class="yeti-forest" data-phase="2">
    <div class="yeti-eyebrow">Episode ${ep.num}</div>
    <div class="yeti-title">Traps & Tricks</div>
    <div class="yeti-sub">The pairs become aware of each other.</div>
    ${items}
  </div>`;
}
```

- [ ] **Step 2: Implement rpBuildYetiNight**

```js
export function rpBuildYetiNight(ep) {
  if (!ep.areWeThereYeti) return '';
  const yt = ep.areWeThereYeti;
  const events = yt.timeline.filter(e => e.phase === 3);

  const items = events.map(evt => {
    const cardClass = evt.type.includes('sasquatch') || evt.type === 'caveConvergence' ? 'sasquatch'
      : evt.type === 'theft' || evt.type === 'confrontation' ? 'grudge'
      : evt.type === 'showmanceMoment' ? 'brave' : '';
    const stamp = evt.type === 'theft' && evt.success ? `<div class="yeti-grudge-stamp">NOTED.</div>` : '';
    return `<div class="yeti-card ${cardClass}">
      ${stamp}
      <div class="yeti-badge ${evt.badgeClass || 'grey'}">${evt.badgeText || ''}</div>
      <div class="yeti-text">${evt.text}</div>
      ${evt.players?.length ? `<div style="display:flex;gap:4px;margin-top:8px">${evt.players.map(p => typeof window.rpPortrait === 'function' ? window.rpPortrait(p, 28) : p).join('')}</div>` : ''}
    </div>`;
  }).join('');

  return YETI_STYLES + `<div class="yeti-forest" data-phase="3">
    <div class="yeti-eyebrow">Episode ${ep.num}</div>
    <div class="yeti-title">The Night</div>
    <div class="yeti-sub">Sasquatchanakwa drives them together. What happens in the cave stays on camera.</div>
    ${items}
  </div>`;
}
```

- [ ] **Step 3: Implement rpBuildYetiSprint**

```js
export function rpBuildYetiSprint(ep) {
  if (!ep.areWeThereYeti) return '';
  const yt = ep.areWeThereYeti;
  const events = yt.timeline.filter(e => e.phase === 4);

  const items = events.map(evt => {
    const cardClass = evt.type.includes('sasquatch') ? 'sasquatch'
      : evt.type === 'foodTemptation' && evt.badgeClass === 'red' ? 'grudge'
      : evt.badgeClass === 'gold' ? 'brave' : '';
    return `<div class="yeti-card ${cardClass}">
      <div class="yeti-badge ${evt.badgeClass || 'grey'}">${evt.badgeText || ''}</div>
      <div class="yeti-text">${evt.text}</div>
    </div>`;
  }).join('');

  // Supply status for each pair
  const supplyHtml = yt.pairs.map(p => {
    const s = yt.supplies[p.label];
    return `<div style="margin-bottom:12px;padding:8px;background:rgba(200,208,220,0.03);border-radius:6px">
      <div style="font-size:10px;font-weight:700;color:var(--amber);letter-spacing:1px">PAIR ${p.label} SUPPLIES</div>
      <div style="font-size:11px;color:var(--moon);margin-top:4px">
        Map: ${s.map ? '✓' : '✗'} | Compass: ${s.compass ? '✓' : '✗'} | Binoculars: ${s.binoculars ? '✓' : '✗'}
      </div>
    </div>`;
  }).join('');

  return YETI_STYLES + `<div class="yeti-forest" data-phase="4">
    <div class="yeti-eyebrow">Episode ${ep.num}</div>
    <div class="yeti-title">The Sprint</div>
    <div class="yeti-sub">Race to the totem pole. Everything comes down to this.</div>
    ${supplyHtml}
    ${items}
  </div>`;
}
```

- [ ] **Step 4: Implement rpBuildYetiVerdict**

```js
export function rpBuildYetiVerdict(ep) {
  if (!ep.areWeThereYeti) return '';
  const yt = ep.areWeThereYeti;
  const events = yt.timeline.filter(e => e.phase === 5);

  // Immunity pair
  const winPair = yt.pairs.find(p => p.label === yt.immunityPair);
  const elimName = yt.chefEliminated;
  const elimPr = pronouns(elimName);

  // Grudge meter visualization
  const grudgeEntries = Object.entries(yt.chefGrudge)
    .filter(([n]) => !yt.immunityWinners.includes(n))
    .sort(([, a], [, b]) => b - a);
  const maxGrudge = Math.max(...grudgeEntries.map(([, g]) => Math.abs(g)), 1);

  const grudgeHtml = grudgeEntries.map(([name, grudge]) => {
    const width = Math.min(100, Math.abs(grudge) / maxGrudge * 100);
    const color = grudge > 1 ? '#f85149' : grudge > 0 ? '#d29922' : '#3fb950';
    return `<div class="yeti-score-bar">
      <div style="width:60px;font-size:11px;color:var(--moon)">${name}</div>
      <div style="flex:1;height:6px;background:rgba(200,208,220,0.06);border-radius:3px">
        <div class="yeti-score-fill" style="width:${width}%;background:${color}"></div>
      </div>
      <div style="width:40px;text-align:right;font-size:10px;color:${color}">${grudge > 0 ? '+' : ''}${grudge.toFixed(1)}</div>
    </div>`;
  }).join('');

  let html = YETI_STYLES + `<div class="yeti-forest" data-phase="3">
    <div class="yeti-eyebrow">Episode ${ep.num}</div>
    <div class="yeti-title">Chef's Verdict</div>
    <div class="yeti-sub">No tribal. No vote. Chef decides.</div>

    <div class="yeti-card brave">
      <div class="yeti-badge gold">🏆 PAIR IMMUNITY</div>
      <div style="display:flex;justify-content:center;gap:12px;margin:8px 0">
        ${winPair.members.map(n => `<div style="text-align:center">
          ${typeof window.rpPortrait === 'function' ? window.rpPortrait(n, 56) : n}
          <div style="font-size:11px;color:var(--amber);margin-top:4px">${n}</div>
        </div>`).join('')}
      </div>
      <div class="yeti-text" style="text-align:center">First pair to tag the totem pole. Both safe tonight.</div>
    </div>

    <div style="margin:20px 0 12px">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#f85149;margin-bottom:8px">CHEF'S GRUDGE METER</div>
      ${grudgeHtml}
    </div>

    <div class="yeti-card grudge" style="border-color:rgba(255,60,60,0.4)">
      <div class="yeti-grudge-stamp">ELIMINATED.</div>
      <div class="yeti-badge red">CHEF'S CHOICE</div>
      <div style="text-align:center;margin:8px 0">
        ${typeof window.rpPortrait === 'function' ? window.rpPortrait(elimName, 64) : elimName}
        <div style="font-size:16px;color:#f85149;margin-top:8px">${elimName}</div>
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f85149;margin-top:2px">ELIMINATED BY CHEF</div>
      </div>
      <div class="yeti-text" style="text-align:center;font-style:italic;margin-top:8px">${yt.chefReason}</div>
    </div>
  </div>`;

  return html;
}
```

- [ ] **Step 5: Commit**

```bash
git add js/chal/are-we-there-yeti.js
git commit -m "feat(yeti): VP screens — traps, night, sprint, verdict with grudge meter"
```

---

### Task 10: Smoke Test + Polish

Run in browser, verify all screens render, check for runtime errors.

**Files:**
- Possibly modify: `js/chal/are-we-there-yeti.js` (bug fixes)

- [ ] **Step 1: Open simulator.html in browser**

Open the simulator, configure a season with 6+ players, add "Are We There Yeti?" twist to a post-merge episode. Run the episode.

- [ ] **Step 2: Verify checklist**

Check all of:
- [ ] Challenge fires without console errors
- [ ] Pair formation works (2 pairs shown)
- [ ] All 7 VP screens render with content
- [ ] Chef's Verdict shows grudge meter + elimination
- [ ] Text backlog shows scores, grudge, stolen items
- [ ] Episode history shows "Are We There Yeti?" tag
- [ ] Debug challenge tab shows member scores
- [ ] Eliminated player removed from active players
- [ ] Cold open mentions the twist
- [ ] No archetype rule violations (nice archetypes not scheming)

- [ ] **Step 3: Fix any issues found**

- [ ] **Step 4: Commit fixes**

```bash
git add -A
git commit -m "fix(yeti): smoke test fixes"
```

---

### Task 11: Add Are We There Yeti to other challenges' incompatible lists

Every existing post-merge challenge needs `'are-we-there-yeti'` in its incompatible array.

**Files:**
- Modify: `js/core.js:~124-129`

- [ ] **Step 1: Add to incompatible lists**

Add `'are-we-there-yeti'` to the `incompatible` array of these entries in the twist catalog:
- `lucky-hunt`
- `hide-and-be-sneaky`
- `off-the-chain`
- `wawanakwa-gone-wild`
- `tri-armed-triathlon`
- `camp-castaways`

- [ ] **Step 2: Commit**

```bash
git add js/core.js
git commit -m "feat(yeti): add to other challenges' incompatible lists"
```
