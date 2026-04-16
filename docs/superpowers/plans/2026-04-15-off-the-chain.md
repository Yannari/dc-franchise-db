# That's Off the Chain! Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "That's Off the Chain!" post-merge bike-building and racing challenge with build phase, swap mechanic, two-part race, obstacle gauntlet with bike destruction, elimination reactions, and motocross demolition derby VP theme.

**Architecture:** Single challenge module (`js/chal/off-the-chain.js`) exporting `simulateOffTheChain`, `rpBuildOffTheChain`, and `_textOffTheChain`. Wired into the existing challenge dispatch system via the same 12 integration points as Hide and Be Sneaky (main.js, episode.js, twists.js, core.js, vp-screens.js, text-backlog.js, alliances.js, savestate.js, run-ui.js, plus pre-twist exclusion, debug tab, badge registration).

**Tech Stack:** Vanilla ES modules, CSS animations, no build step.

**Spec:** `docs/superpowers/specs/2026-04-15-off-the-chain-design.md`

---

### Task 1: Create Challenge Module — Constants, Helpers, Bike Names

**Files:**
- Create: `js/chal/off-the-chain.js`

- [ ] **Step 1: Create the file with imports, constants, and helpers**

```javascript
// js/chal/off-the-chain.js — That's Off the Chain! bike race challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

// ── BIKE NAME TEMPLATES ──
// Personality-based cosmetic names for bikes
const BIKE_NAMES = {
  'villain':          ['The Backstabber', 'Dark Ride', 'Venom Wheels'],
  'mastermind':       ['The Masterstroke', 'Chess Piece', 'Shadow Cruiser'],
  'schemer':          ['The Double Cross', 'Sneak Cycle', 'Plot Twist'],
  'hothead':          ['Rage Machine', 'The Burnout', 'Fury Rider'],
  'challenge-beast':  ['The Dominator', 'Beast Mode', 'Iron Horse'],
  'social-butterfly': ['Sunshine Cruiser', 'The Charmer', 'Social Cycle'],
  'loyal-soldier':    ['Old Faithful', 'The Steady', 'Shield Rider'],
  'wildcard':         ['The ???', 'Chaos Wheels', 'Mystery Machine'],
  'chaos-agent':      ['The Wrecking Ball', 'Anarchy Bike', 'Boom Cycle'],
  'floater':          ['The Drifter', 'Coast-Along', 'Breeze Rider'],
  'underdog':         ['Little Engine', 'The Scrapper', 'Long Shot'],
  'hero':             ['Justice Rider', 'The Guardian', 'Hero Cycle'],
  'goat':             ['The Wobbler', 'Hot Mess Express', 'Duct Tape Dream'],
  'perceptive-player':['The Observer', 'Eagle Eye', 'Sixth Sense Cycle'],
  'showmancer':       ['The Heartbreaker', 'Love Ride', 'Cupid Cruiser'],
};

// ── BUILD EVENT POOL ──
const BUILD_EVENTS = [
  { id:'sabotage',     weight:0.8, villainsOnly:true },
  { id:'help',         weight:0.7, niceOnly:true },
  { id:'parts-theft',  weight:0.5, villainsOnly:true },
  { id:'showmance-distract', weight:0.6 },
  { id:'manual-drama', weight:0.7 },
  { id:'wildcard-speed', weight:0.4 },
];

// ── PART 1 RACE EVENT POOL ──
const RACE1_EVENTS = [
  { id:'near-crash',    weight:0.8 },
  { id:'drafting',      weight:0.6 },
  { id:'handlebar-wobble', weight:0.7 },
  { id:'unfamiliar-quirks', weight:0.6 },
  { id:'bike-falls-apart', weight:0.3 },
  { id:'trash-talk',    weight:0.5 },
];

// ── PART 2 OBSTACLE EVENT POOL ──
const OBSTACLE_EVENTS = [
  { id:'close-call',     weight:0.8 },
  { id:'showmance-cheer', weight:0.4 },
  { id:'rivalry-push',   weight:0.5 },
  { id:'bike-smoking',   weight:0.7 },
  { id:'clutch-save',    weight:0.5 },
  { id:'spectacular-wipeout', weight:0.4 },
];

// ── CHRIS COMMENTARY ──
const CHRIS_BIKE_QUIPS = {
  buildJudge: [
    `"Excellent aerodynamics!" — Chris McLean`,
    `"Spooky, yet practical. Well done." — Chris McLean`,
    `"Wicked Mad Max mobile, dude!" — Chris McLean`,
    `"Dude, seriously? This is lame." — Chris McLean`,
    `"I call that 'abstract'... and by abstract I mean terrible." — Chris McLean`,
    `"Not bad! I mean, it'll probably kill you, but not bad!" — Chris McLean`,
  ],
  buildJudgeBad: [
    `"Is... is that even a bike?" — Chris McLean`,
    `"I've seen better engineering from a toddler with Legos." — Chris McLean`,
    `"Wow. Just... wow." — Chris McLean`,
  ],
  buildJudgeGood: [
    `"Now THAT is a machine!" — Chris McLean`,
    `"Chef's gonna be jealous of this one." — Chris McLean`,
    `"Somebody actually read the manual!" — Chris McLean`,
  ],
  swapReveal: [
    `"Oh, this is gonna be GOOD." — Chris McLean`,
    `"I love this part. The look on their faces!" — Chris McLean`,
    `"Surprise! You're not riding your own bike!" — Chris McLean`,
  ],
  race1Start: [
    `"Riders, start your... well, someone else's engines!" — Chris McLean`,
    `"Remember, if the bike breaks, blame the builder!" — Chris McLean`,
  ],
  race1Finish: [
    `"And they cross the line!" — Chris McLean`,
    `"That bike made it! Barely." — Chris McLean`,
  ],
  race1Fail: [
    `"And that's a DNF! Tough break for the builder." — Chris McLean`,
    `"Ooh, not gonna make it." — Chris McLean`,
  ],
  obstacleStart: [
    `"Land mines, oil slicks, and piranhas. Good luck!" — Chris McLean`,
    `"This is the part where things get REALLY interesting." — Chris McLean`,
  ],
  bikeDestroyed: [
    `"And BOOM goes the bike!" — Chris McLean`,
    `"That's... not gonna buff out." — Chris McLean`,
    `"Well, on the bright side, you can't finish last if you don't finish at all!" — Chris McLean`,
  ],
  immunityWin: [
    `"First across the line! Invincibility is YOURS!" — Chris McLean`,
    `"Winner winner! You're safe tonight!" — Chris McLean`,
  ],
  lastPlace: [
    `"And that means... you're out. Sorry, not sorry." — Chris McLean`,
    `"Last place. The Dock of Shame awaits." — Chris McLean`,
  ],
};

// ── ELIMINATION REACTION TEMPLATES ──
const REACTION_TEMPLATES = {
  betrayalCallout: [
    (victim, saboteur) => `${victim} whipped around: "YOU sabotaged my bike!"`,
    (victim, saboteur) => `${victim} pointed straight at ${saboteur}: "I KNOW what you did!"`,
  ],
  betrayerSmirk: [
    (sab, pr) => `${sab} just shrugged. "Prove it."`,
    (sab, pr) => `${sab} smirked. "It's a competition, not a friendship circle."`,
  ],
  betrayerGuilty: [
    (sab, pr) => `${sab} looked away, guilt written all over ${pr.posAdj} face.`,
    (sab, pr) => `${sab}'s eyes dropped. "I... I'm sorry. I had to."`,
  ],
  bffExplosion: [
    (victim, betrayer) => `${victim}'s voice cracked: "I thought we were FRIENDS!"`,
    (victim, betrayer) => `${victim} stared at ${betrayer} in disbelief. "After everything?!"`,
  ],
  bffCallout: [
    (victim, betrayer) => `"You used me! This WHOLE time!" ${victim}'s hands were shaking.`,
    (victim, betrayer) => `${victim} got right in ${betrayer}'s face. The other campers backed up.`,
  ],
  crowdCheer: [
    (victim) => `The other campers erupted. Someone started a slow clap for ${victim}.`,
    (victim) => `"YEAH!" Leshawna pumped her fist. The whole camp rallied behind ${victim}.`,
  ],
  showmanceGoodbye: [
    (victim, partner, pr) => `${partner} grabbed ${victim}'s hand. "I'll win this for both of us."`,
    (victim, partner, pr) => `${victim} pulled ${partner} into a hug. Neither wanted to let go.`,
  ],
  gracefulExit: [
    (victim) => `${victim} took a breath. "It's been real, guys."`,
    (victim) => `${victim} waved to everyone. "No hard feelings. Mostly."`,
  ],
  wrongNames: [
    (victim, target, wrongName) => `${victim} hugged ${target}: "I'll miss you, ${wrongName}!"`,
  ],
};

// ── HELPERS ──
const VILLAIN_ARCHETYPES = ['villain', 'mastermind', 'schemer'];
const NICE_ARCHETYPES = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];

function getArchetype(name) { return players.find(p => p.name === name)?.archetype || ''; }
function isVillainArch(name) { return VILLAIN_ARCHETYPES.includes(getArchetype(name)); }
function isNiceArch(name) { return NICE_ARCHETYPES.includes(getArchetype(name)); }
function neutralWouldScheme(name) { const s = pStats(name); return s.strategic >= 6 && s.loyalty <= 4; }

function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}

function wPick(arr) {
  const total = arr.reduce((s, e) => s + (e.weight || 1), 0);
  let r = Math.random() * total;
  for (const item of arr) { r -= (item.weight || 1); if (r <= 0) return item; }
  return arr[arr.length - 1];
}

function calcBikeQuality(name) {
  const s = pStats(name);
  const arch = getArchetype(name);
  let q = s.mental * 0.3 + s.physical * 0.25 + s.intuition * 0.2 + s.strategic * 0.15 + s.boldness * 0.1;
  q = (q - 5.0) * 1.5 + 5.0; // spread around 5
  // Archetype bonuses
  if (arch === 'challenge-beast') q += 1.5;
  else if (arch === 'mastermind' || arch === 'schemer') q += 1.0;
  else if (arch === 'hothead') q -= 1.0;
  else if (arch === 'goat') q -= 2.0;
  else if (arch === 'wildcard' || arch === 'chaos-agent') q += (Math.random() * 4) - 2.0;
  else if (arch === 'underdog') q += 0.5;
  else if (arch === 'floater') q += 0.3;
  else if (arch === 'perceptive-player') q += 0.5;
  else if (arch === 'social-butterfly') q -= 0.5;
  else if (arch === 'showmancer') {
    const inShowmance = (gs.showmances || []).some(sh => sh.phase !== 'broken-up' && sh.players.includes(name));
    if (inShowmance) q -= 0.5;
  }
  q += (Math.random() * 3) - 1.5;
  return Math.max(1, Math.min(10, q));
}

function getBikeName(name) {
  const arch = getArchetype(name) || 'floater';
  const pool = BIKE_NAMES[arch] || BIKE_NAMES['floater'];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Generate a derangement (no one gets their own bike)
function derangement(arr) {
  for (let attempts = 0; attempts < 100; attempts++) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    if (shuffled.every((v, i) => v !== arr[i])) return shuffled;
  }
  // Fallback: swap first two if stuck
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  if (shuffled[0] === arr[0]) { const tmp = shuffled[0]; shuffled[0] = shuffled[1]; shuffled[1] = tmp; }
  return shuffled;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/off-the-chain.js
git commit -m "feat(off-chain): scaffold module with constants, bike names, event pools, helpers"
```

---

### Task 2: Simulation — Phase 1 (Build) & Phase 2 (Swap + Part 1 Race)

**Files:**
- Modify: `js/chal/off-the-chain.js`

- [ ] **Step 1: Add simulateOffTheChain with Phase 1 and Phase 2**

Append to `js/chal/off-the-chain.js`:

```javascript

// ══════════════════════════════════════════════════════════════
// SIMULATE
// ══════════════════════════════════════════════════════════════
export function simulateOffTheChain(ep) {
  const activePlayers = [...gs.activePlayers];
  const n = activePlayers.length;
  const badges = {};
  const chrisQuips = {};

  // ══ PHASE 1: BUILD ══
  const bikeQuality = {};   // { name: number 1-10 }
  const bikeHP = {};        // { name: number }
  const bikeNames = {};     // { name: string }
  const buildEvents = [];   // [{ id, players, text, effect }]

  // Build bikes
  activePlayers.forEach(name => {
    bikeQuality[name] = calcBikeQuality(name);
    bikeNames[name] = getBikeName(name);
  });

  // Build events (2-3)
  const buildEventCount = 2 + (Math.random() < 0.5 ? 1 : 0);
  for (let i = 0; i < buildEventCount; i++) {
    // Pick event type
    const eligible = BUILD_EVENTS.filter(e => {
      if (e.villainsOnly && !activePlayers.some(p => isVillainArch(p) || neutralWouldScheme(p))) return false;
      if (e.niceOnly && !activePlayers.some(p => isNiceArch(p))) return false;
      if (e.id === 'showmance-distract' && !(gs.showmances || []).some(s => s.phase !== 'broken-up' && s.players.some(p => activePlayers.includes(p)))) return false;
      if (e.id === 'wildcard-speed' && !activePlayers.some(p => ['wildcard', 'chaos-agent'].includes(getArchetype(p)))) return false;
      return true;
    });
    if (!eligible.length) continue;
    const template = wPick(eligible);
    const evt = { id: template.id, players: [], text: '', effect: {} };

    if (template.id === 'sabotage') {
      const saboteurs = activePlayers.filter(p => isVillainArch(p) || neutralWouldScheme(p));
      if (!saboteurs.length) continue;
      const saboteur = saboteurs[Math.floor(Math.random() * saboteurs.length)];
      const targets = activePlayers.filter(p => p !== saboteur);
      const target = [...targets].sort((a, b) => getBond(saboteur, a) - getBond(saboteur, b))[0]; // lowest bond
      const s = pStats(saboteur);
      const sabotageStrength = s.strategic * 0.4 + s.mental * 0.3 + (Math.random() - 0.5);
      let penalty = 1.5 + sabotageStrength * 0.15;
      penalty = Math.min(2.5, Math.max(1.5, penalty));
      // Detection check
      const detector = activePlayers.find(p => p !== saboteur && p !== target && pStats(p).intuition * 0.4 + Math.random() > 6);
      const targetDetects = pStats(target).intuition * 0.4 + Math.random() > 6;
      let detected = false;
      if (detector || targetDetects) {
        detected = true;
        penalty = 0.5; // partially undone
        addBond(saboteur, target, -2);
        popDelta(saboteur, -1);
        const detectPr = pronouns(detector || target);
        evt.text = `${saboteur} tried to sabotage ${target}'s bike — but ${detector || target} caught ${pronouns(saboteur).obj} in the act! Damage partially undone.`;
      } else {
        addBond(saboteur, target, -2);
        evt.text = `${saboteur} loosened the bolts on ${target}'s bike when no one was looking. The damage is hidden... for now.`;
      }
      bikeQuality[target] -= penalty;
      bikeQuality[target] = Math.max(1, bikeQuality[target]);
      evt.players = [saboteur, target];
      evt.effect = { saboteur, target, penalty, detected };
      if (!detected) badges[saboteur] = 'bikeRaceSaboteur';
    } else if (template.id === 'help') {
      const helpers = activePlayers.filter(p => isNiceArch(p));
      if (!helpers.length) continue;
      const helper = helpers[Math.floor(Math.random() * helpers.length)];
      const weakest = activePlayers.filter(p => p !== helper).sort((a, b) => bikeQuality[a] - bikeQuality[b])[0];
      const bonus = 1.0 + Math.random() * 0.5;
      bikeQuality[weakest] += bonus;
      bikeQuality[weakest] = Math.min(10, bikeQuality[weakest]);
      addBond(helper, weakest, 2);
      const hPr = pronouns(helper);
      evt.text = `${helper} noticed ${weakest} struggling and helped ${pronouns(weakest).obj} fix the frame. ${hPr.Sub} even shared some spare parts.`;
      evt.players = [helper, weakest];
      evt.effect = { helper, target: weakest, bonus };
    } else if (template.id === 'parts-theft') {
      const thieves = activePlayers.filter(p => isVillainArch(p) || neutralWouldScheme(p));
      if (!thieves.length) continue;
      const thief = thieves[Math.floor(Math.random() * thieves.length)];
      const victim = activePlayers.filter(p => p !== thief)[Math.floor(Math.random() * (activePlayers.length - 1))];
      bikeQuality[thief] += 0.5;
      bikeQuality[victim] -= 0.5;
      evt.text = `${thief} snagged the best parts from the depot before ${victim} could get to them.`;
      evt.players = [thief, victim];
      evt.effect = { thief, victim };
    } else if (template.id === 'showmance-distract') {
      const sh = (gs.showmances || []).find(s => s.phase !== 'broken-up' && s.players.some(p => activePlayers.includes(p)));
      if (!sh) continue;
      const distracted = sh.players.find(p => activePlayers.includes(p));
      if (!distracted) continue;
      bikeQuality[distracted] -= 0.5;
      const partner = sh.players.find(p => p !== distracted);
      evt.text = `${partner || 'Their partner'} kept visiting ${distracted}'s workstation. Sweet, but distracting.`;
      evt.players = [distracted];
      evt.effect = { distracted, penalty: 0.5 };
    } else if (template.id === 'manual-drama') {
      const reader = activePlayers[Math.floor(Math.random() * n)];
      const s = pStats(reader);
      const success = s.mental + Math.random() * 2 > 6;
      if (success) {
        bikeQuality[reader] += 1.0;
        evt.text = `${reader} found the moldy bike manual and actually deciphered it. Bike quality improved!`;
      } else {
        evt.text = `${reader} tried to read the moldy bike manual but couldn't make sense of it. Wasted time.`;
      }
      evt.players = [reader];
      evt.effect = { reader, success, bonus: success ? 1.0 : 0 };
    } else if (template.id === 'wildcard-speed') {
      const wc = activePlayers.find(p => ['wildcard', 'chaos-agent'].includes(getArchetype(p)));
      if (!wc) continue;
      const extraNoise = (Math.random() * 4) - 2.0;
      bikeQuality[wc] += extraNoise;
      bikeQuality[wc] = Math.max(1, Math.min(10, bikeQuality[wc]));
      const wcPr = pronouns(wc);
      evt.text = extraNoise > 0
        ? `${wc} finished ${wcPr.posAdj} bike in record time — and somehow it actually looks... good?!`
        : `${wc} "finished" ${wcPr.posAdj} bike in five minutes flat. It looks like modern art. Broken modern art.`;
      evt.players = [wc];
      evt.effect = { player: wc, delta: extraNoise };
    }
    buildEvents.push(evt);
  }

  // Compute bike HP from final quality
  activePlayers.forEach(name => {
    bikeHP[name] = Math.round(bikeQuality[name] * 10);
  });

  // Chris judging quips
  const bestBuilder = activePlayers.reduce((best, p) => bikeQuality[p] > bikeQuality[best] ? p : best, activePlayers[0]);
  const worstBuilder = activePlayers.reduce((worst, p) => bikeQuality[p] < bikeQuality[worst] ? p : worst, activePlayers[0]);
  badges[bestBuilder] = 'bikeRaceBuilder';
  popDelta(bestBuilder, 1);
  popDelta(worstBuilder, -1);

  activePlayers.forEach(name => {
    const q = bikeQuality[name];
    const pool = q >= 7 ? CHRIS_BIKE_QUIPS.buildJudgeGood : q <= 3 ? CHRIS_BIKE_QUIPS.buildJudgeBad : CHRIS_BIKE_QUIPS.buildJudge;
    chrisQuips[`judge-${name}`] = pool[Math.floor(Math.random() * pool.length)];
  });

  const phase1 = { bikeQuality: { ...bikeQuality }, bikeHP: { ...bikeHP }, bikeNames: { ...bikeNames }, buildEvents, bestBuilder, worstBuilder };

  // ══ PHASE 2: SWAP + PART 1 RACE ══
  // Derangement: no one rides their own bike
  const riderOrder = [...activePlayers];
  const bikeOwnerOrder = derangement(riderOrder);
  const riderAssignments = {}; // { rider: bikeOwner }
  riderOrder.forEach((rider, i) => { riderAssignments[rider] = bikeOwnerOrder[i]; });

  chrisQuips['swap'] = CHRIS_BIKE_QUIPS.swapReveal[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.swapReveal.length)];

  // Part 1: Race on someone else's bike
  const race1Scores = {};
  const race1Events = [];

  activePlayers.forEach(rider => {
    const bikeOwner = riderAssignments[rider];
    const bq = bikeQuality[bikeOwner];
    const s = pStats(rider);
    race1Scores[rider] = s.physical * 0.3 + s.endurance * 0.25 + s.boldness * 0.2 + bq * 0.25 + (Math.random() * 4 - 2);
  });

  // Race 1 events (2-3)
  const race1EventCount = 2 + (Math.random() < 0.5 ? 1 : 0);
  for (let i = 0; i < race1EventCount; i++) {
    const template = wPick(RACE1_EVENTS);
    const evt = { id: template.id, players: [], text: '' };
    const riders = [...activePlayers].sort((a, b) => race1Scores[a] - race1Scores[b]); // worst to best

    if (template.id === 'near-crash') {
      const rider = riders[0]; // worst rider
      const rPr = pronouns(rider);
      const bikeOwner = riderAssignments[rider];
      race1Scores[rider] -= 0.5;
      evt.text = `${rider} nearly crashed on ${bikeOwner}'s bike — ${rPr.sub} barely kept control!`;
      evt.players = [rider];
    } else if (template.id === 'drafting') {
      if (riders.length < 2) continue;
      const leader = riders[riders.length - 1];
      const follower = riders[riders.length - 2];
      race1Scores[follower] += 0.5;
      evt.text = `${follower} drafted behind ${leader}, picking up speed!`;
      evt.players = [follower, leader];
    } else if (template.id === 'handlebar-wobble') {
      // Target rider on a low-quality bike
      const riderOnBadBike = riders.find(r => bikeQuality[riderAssignments[r]] <= 4);
      if (!riderOnBadBike) continue;
      const bikeOwner = riderAssignments[riderOnBadBike];
      race1Scores[riderOnBadBike] -= 1.0;
      evt.text = `${riderOnBadBike}'s handlebars started wobbling on ${bikeOwner}'s poorly-built bike!`;
      evt.players = [riderOnBadBike];
    } else if (template.id === 'unfamiliar-quirks') {
      const rider = riders[Math.floor(Math.random() * riders.length)];
      const bikeOwner = riderAssignments[rider];
      const builderBoldness = pStats(bikeOwner).boldness;
      const penalty = builderBoldness >= 7 ? -1.0 : -0.5; // weirder bike = more confusing
      race1Scores[rider] += penalty;
      evt.text = `${rider} couldn't figure out ${bikeOwner}'s unconventional bike design — what even IS that gear shift?`;
      evt.players = [rider];
    } else if (template.id === 'bike-falls-apart') {
      const riderOnJunk = riders.find(r => bikeQuality[riderAssignments[r]] <= 3);
      if (!riderOnJunk) continue;
      const bikeOwner = riderAssignments[riderOnJunk];
      race1Scores[riderOnJunk] -= 2.0;
      bikeHP[bikeOwner] -= 20;
      evt.text = `The wheel flew right off ${bikeOwner}'s bike! ${riderOnJunk} went tumbling!`;
      evt.players = [riderOnJunk, bikeOwner];
    } else if (template.id === 'trash-talk') {
      if (riders.length < 2) continue;
      const pair = [...riders].sort(() => Math.random() - 0.5).slice(0, 2);
      const [a, b] = pair;
      if (getBond(a, b) > 2) continue; // friends don't trash talk
      addBond(a, b, -1);
      const winner = race1Scores[a] > race1Scores[b] ? a : b;
      race1Scores[winner] += 0.5;
      evt.text = `${a} and ${b} traded insults mid-race. ${winner} channeled the anger into speed!`;
      evt.players = [a, b];
    }
    if (evt.text) race1Events.push(evt);
  }

  // Determine who crosses the finish line — gap detection
  const sortedRiders = [...activePlayers].sort((a, b) => race1Scores[b] - race1Scores[a]);
  let cutIndex = Math.ceil(n * 0.5); // default: top 50%
  // Find biggest gap in middle 40-70% range
  let biggestGap = 0, gapIdx = cutIndex;
  for (let i = Math.floor(n * 0.3); i < Math.ceil(n * 0.7); i++) {
    if (i >= sortedRiders.length - 1) break;
    const gap = race1Scores[sortedRiders[i]] - race1Scores[sortedRiders[i + 1]];
    if (gap > biggestGap) { biggestGap = gap; gapIdx = i + 1; }
  }
  cutIndex = Math.max(3, Math.min(n - 2, gapIdx)); // min 3 advance, max n-2

  const finishers = sortedRiders.slice(0, cutIndex); // riders who crossed
  const failures = sortedRiders.slice(cutIndex); // riders who didn't

  // Map back to bike owners who advance to Part 2
  const advancingOwners = finishers.map(rider => riderAssignments[rider]);
  const eliminatedOwners = failures.map(rider => riderAssignments[rider]);

  // Part 1 wear damage on surviving bikes
  finishers.forEach(rider => {
    const owner = riderAssignments[rider];
    const wear = Math.max(0, (10 - race1Scores[rider]) * 2);
    bikeHP[owner] = Math.max(1, bikeHP[owner] - Math.round(wear));
  });

  // Popularity: good bike = +1, bad bike = -1
  advancingOwners.forEach(owner => { if (bikeQuality[owner] >= 7) popDelta(owner, 1); });
  eliminatedOwners.forEach(owner => { popDelta(owner, -1); });

  // Chris quips for finishers/failures
  finishers.forEach(r => { chrisQuips[`race1-${r}`] = CHRIS_BIKE_QUIPS.race1Finish[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.race1Finish.length)]; });
  failures.forEach(r => { chrisQuips[`race1-${r}`] = CHRIS_BIKE_QUIPS.race1Fail[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.race1Fail.length)]; });

  const phase2 = {
    riderAssignments, race1Scores, race1Events,
    sortedRiders, cutIndex, finishers, failures,
    advancingOwners, eliminatedOwners,
  };
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/off-the-chain.js
git commit -m "feat(off-chain): Phase 1 (build) + Phase 2 (swap + Part 1 race) simulation"
```

---

### Task 3: Simulation — Phase 3 (Obstacle Gauntlet) & Phase 4 (Elimination Reactions) & Results

**Files:**
- Modify: `js/chal/off-the-chain.js`

- [ ] **Step 1: Add Phase 3 obstacle gauntlet**

Continue inside `simulateOffTheChain` after `const phase2 = { ... };`:

```javascript

  // ══ PHASE 3: PART 2 — OBSTACLE GAUNTLET ══
  const racers = [...advancingOwners]; // these players ride their own bikes
  const familiarityBonus = 1.5;
  const obstacleResults = {}; // { playerName: { mines:{}, oil:{}, piranhas:{}, destroyed:bool, finishTime:number } }
  const destroyed = []; // players whose bikes were destroyed
  const obstacleEvents = []; // per-obstacle events
  let stillRacing = [...racers];

  chrisQuips['obstacle-start'] = CHRIS_BIKE_QUIPS.obstacleStart[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.obstacleStart.length)];

  racers.forEach(name => {
    obstacleResults[name] = { obstacles: [], destroyed: false, totalPenalty: 0, bikeHPStart: bikeHP[name] };
  });

  // --- Obstacle 1: Land Mines ---
  const mineEvents = [];
  stillRacing.forEach(name => {
    const s = pStats(name);
    const hpFactor = bikeHP[name] / 100;
    const score = s.intuition * 0.35 + s.boldness * 0.25 + hpFactor * 0.2 + (Math.random() * 4 - 2) + familiarityBonus;
    let damage = 0, timePenalty = 0, outcome = '';
    if (score >= 7) { damage = 0; timePenalty = 0; outcome = 'clean'; }
    else if (score >= 4) { damage = 10 + Math.floor(Math.random() * 11); timePenalty = 1; outcome = 'clipped'; }
    else { damage = 25 + Math.floor(Math.random() * 11); timePenalty = 3; outcome = 'hit'; }
    bikeHP[name] -= damage;
    obstacleResults[name].obstacles.push({ id: 'mines', score, damage, timePenalty, outcome });
    obstacleResults[name].totalPenalty += timePenalty;
    // Catastrophic breakdown check
    if (bikeHP[name] <= 0 || ((100 - bikeHP[name]) * 0.008 + Math.random() * 0.1 > 0.5 && bikeHP[name] < 50)) {
      bikeHP[name] = 0;
      obstacleResults[name].destroyed = true;
      destroyed.push(name);
      badges[name] = 'bikeRaceWreck';
      popDelta(name, -1);
      chrisQuips[`destroyed-${name}`] = CHRIS_BIKE_QUIPS.bikeDestroyed[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.bikeDestroyed.length)];
    }
  });
  stillRacing = stillRacing.filter(p => !destroyed.includes(p));

  // 1-2 mine events
  if (stillRacing.length >= 2) {
    const evtTemplate = wPick(OBSTACLE_EVENTS);
    const worst = [...stillRacing].sort((a, b) => bikeHP[a] - bikeHP[b])[0];
    const best = [...stillRacing].sort((a, b) => bikeHP[b] - bikeHP[a])[0];
    if (evtTemplate.id === 'close-call') {
      obstacleEvents.push({ obstacle: 'mines', text: `${worst} swerved at the last second — a mine exploded inches behind ${pronouns(worst).obj}!`, players: [worst] });
    } else if (evtTemplate.id === 'bike-smoking') {
      const lowHP = stillRacing.find(p => bikeHP[p] < 40);
      if (lowHP) obstacleEvents.push({ obstacle: 'mines', text: `${lowHP}'s bike is trailing smoke — it won't last much longer!`, players: [lowHP] });
    } else {
      obstacleEvents.push({ obstacle: 'mines', text: `${best} weaved through the mines like a pro!`, players: [best] });
    }
  }

  // --- Obstacle 2: Oil Slick ---
  stillRacing.forEach(name => {
    const s = pStats(name);
    const hpFactor = bikeHP[name] / 100;
    const score = s.physical * 0.3 + s.endurance * 0.25 + hpFactor * 0.2 + (Math.random() * 4 - 2) + familiarityBonus;
    let damage = 0, timePenalty = 0, outcome = '';
    if (score >= 7) { damage = Math.floor(Math.random() * 6); timePenalty = 0; outcome = 'power-through'; }
    else if (score >= 4) { damage = 15 + Math.floor(Math.random() * 11); timePenalty = 2; outcome = 'fishtail'; }
    else { damage = 30 + Math.floor(Math.random() * 11); timePenalty = 4; outcome = 'wipeout'; }
    bikeHP[name] -= damage;
    obstacleResults[name].obstacles.push({ id: 'oil', score, damage, timePenalty, outcome });
    obstacleResults[name].totalPenalty += timePenalty;
    // Cascading failure: doubled breakdown chance if HP < 40%
    const breakdownMult = bikeHP[name] < 40 ? 2 : 1;
    if (bikeHP[name] <= 0 || ((100 - bikeHP[name]) * 0.008 * breakdownMult + Math.random() * 0.1 > 0.5 && bikeHP[name] < 50)) {
      bikeHP[name] = 0;
      obstacleResults[name].destroyed = true;
      destroyed.push(name);
      badges[name] = 'bikeRaceWreck';
      popDelta(name, -1);
      chrisQuips[`destroyed-${name}`] = CHRIS_BIKE_QUIPS.bikeDestroyed[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.bikeDestroyed.length)];
    }
  });
  stillRacing = stillRacing.filter(p => !destroyed.includes(p));

  // 1-2 oil events
  if (stillRacing.length) {
    const evtTemplate = wPick(OBSTACLE_EVENTS);
    const target = stillRacing[Math.floor(Math.random() * stillRacing.length)];
    if (evtTemplate.id === 'clutch-save') {
      obstacleEvents.push({ obstacle: 'oil', text: `${target} fishtailed wildly but pulled off an incredible recovery!`, players: [target] });
    } else if (evtTemplate.id === 'spectacular-wipeout') {
      const wiped = stillRacing.find(p => obstacleResults[p].obstacles.find(o => o.id === 'oil' && o.outcome === 'wipeout'));
      if (wiped) obstacleEvents.push({ obstacle: 'oil', text: `${wiped} hit the oil slick and went FLYING — bike and rider separated mid-air!`, players: [wiped] });
    } else {
      obstacleEvents.push({ obstacle: 'oil', text: `Bikes sliding everywhere on the oil slick — pure chaos!`, players: stillRacing.slice(0, 2) });
    }
  }

  // --- Obstacle 3: Piranha Pool Jump ---
  stillRacing.forEach(name => {
    const s = pStats(name);
    const hpFactor = bikeHP[name] / 100;
    const weightPenalty = (100 - bikeHP[name]) * 0.02;
    const score = s.physical * 0.3 + s.boldness * 0.35 + hpFactor * 0.2 + (Math.random() * 4 - 2) + familiarityBonus - weightPenalty;
    let damage = 0, timePenalty = 0, outcome = '';
    if (score >= 7) { damage = Math.floor(Math.random() * 6); timePenalty = 0; outcome = 'clear'; }
    else if (score >= 4) { damage = 15 + Math.floor(Math.random() * 11); timePenalty = 2; outcome = 'hard-landing'; }
    else { damage = 100; timePenalty = 0; outcome = 'piranha-splash'; } // destroyed
    bikeHP[name] -= damage;
    obstacleResults[name].obstacles.push({ id: 'piranhas', score, damage, timePenalty, outcome });
    obstacleResults[name].totalPenalty += timePenalty;
    if (bikeHP[name] <= 0) {
      bikeHP[name] = 0;
      obstacleResults[name].destroyed = true;
      destroyed.push(name);
      badges[name] = 'bikeRaceWreck';
      popDelta(name, -1);
      chrisQuips[`destroyed-${name}`] = CHRIS_BIKE_QUIPS.bikeDestroyed[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.bikeDestroyed.length)];
    } else if (bikeHP[name] < 20 && !destroyed.includes(name)) {
      badges[name] = badges[name] || 'bikeRaceClutch';
      popDelta(name, 1);
    }
  });
  stillRacing = stillRacing.filter(p => !destroyed.includes(p));

  // Piranha events
  if (destroyed.some(p => obstacleResults[p].obstacles.find(o => o.id === 'piranhas' && o.outcome === 'piranha-splash'))) {
    const splashed = destroyed.find(p => obstacleResults[p].obstacles.find(o => o.id === 'piranhas' && o.outcome === 'piranha-splash'));
    if (splashed) obstacleEvents.push({ obstacle: 'piranhas', text: `${splashed} didn't clear the jump — SPLASH! Right into the piranha pool!`, players: [splashed] });
  }
  if (stillRacing.length) {
    const jumper = stillRacing.find(p => obstacleResults[p].obstacles.find(o => o.id === 'piranhas' && o.outcome === 'clear'));
    if (jumper) obstacleEvents.push({ obstacle: 'piranhas', text: `${jumper} launched over the piranha pool with room to spare!`, players: [jumper] });
  }

  // Final ranking of finishers
  const finishRanking = [...stillRacing].sort((a, b) => {
    const aTime = -(pStats(a).physical * 0.2 + pStats(a).endurance * 0.2 + bikeHP[a] * 0.01 - obstacleResults[a].totalPenalty);
    const bTime = -(pStats(b).physical * 0.2 + pStats(b).endurance * 0.2 + bikeHP[b] * 0.01 - obstacleResults[b].totalPenalty);
    return aTime - bTime; // lower time = better
  });

  const immunityWinner = finishRanking[0] || null;
  const lastPlace = finishRanking.length >= 2 ? finishRanking[finishRanking.length - 1] : null;

  const phase3 = { racers, obstacleResults, destroyed, obstacleEvents, finishRanking, bikeHP: { ...bikeHP } };
```

- [ ] **Step 2: Add Phase 4 elimination reactions + results**

Continue:

```javascript

  // ══ PHASE 4: ELIMINATION REACTIONS ══
  let eliminationReaction = null;
  const eliminatedPlayer = lastPlace; // might be null if <= 1 finisher

  if (eliminatedPlayer) {
    const elimPr = pronouns(eliminatedPlayer);
    const beats = [];

    // Check for sabotage betrayal
    const sabotageEvt = buildEvents.find(e => e.id === 'sabotage' && e.effect?.target === eliminatedPlayer && !e.effect.detected);
    // Check for BFF betrayal (high bond with someone who hurt them)
    const highBondBetrayer = activePlayers.find(p => p !== eliminatedPlayer && getBond(eliminatedPlayer, p) >= 6 &&
      (buildEvents.some(e => e.id === 'sabotage' && e.effect?.saboteur === p && e.effect?.target === eliminatedPlayer) ||
       (riderAssignments[p] === eliminatedPlayer && failures.includes(p)) // they rode eliminated player's bike badly
      ));
    // Check for showmance
    const showmance = (gs.showmances || []).find(sh => sh.phase !== 'broken-up' && sh.players.includes(eliminatedPlayer) && sh.players.some(p => p !== eliminatedPlayer && activePlayers.includes(p)));

    if (highBondBetrayer) {
      // BFF Betrayal — Lindsay/Heather moment
      eliminationReaction = { type: 'bff-betrayal', players: [eliminatedPlayer, highBondBetrayer], beats: [] };
      const tmpl = REACTION_TEMPLATES;
      eliminationReaction.beats.push(tmpl.bffExplosion[Math.floor(Math.random() * tmpl.bffExplosion.length)](eliminatedPlayer, highBondBetrayer));
      eliminationReaction.beats.push(tmpl.bffCallout[Math.floor(Math.random() * tmpl.bffCallout.length)](eliminatedPlayer, highBondBetrayer));
      eliminationReaction.beats.push(tmpl.crowdCheer[Math.floor(Math.random() * tmpl.crowdCheer.length)](eliminatedPlayer));
      addBond(eliminatedPlayer, highBondBetrayer, -(getBond(eliminatedPlayer, highBondBetrayer) + 5)); // drop to -5
      popDelta(eliminatedPlayer, 3);
      popDelta(highBondBetrayer, -3);
    } else if (sabotageEvt) {
      // Sabotage confrontation
      const saboteur = sabotageEvt.effect.saboteur;
      eliminationReaction = { type: 'sabotage-confrontation', players: [eliminatedPlayer, saboteur], beats: [] };
      const tmpl = REACTION_TEMPLATES;
      eliminationReaction.beats.push(tmpl.betrayalCallout[Math.floor(Math.random() * tmpl.betrayalCallout.length)](eliminatedPlayer, saboteur));
      if (isVillainArch(saboteur)) {
        eliminationReaction.beats.push(tmpl.betrayerSmirk[Math.floor(Math.random() * tmpl.betrayerSmirk.length)](saboteur, pronouns(saboteur)));
      } else {
        eliminationReaction.beats.push(tmpl.betrayerGuilty[Math.floor(Math.random() * tmpl.betrayerGuilty.length)](saboteur, pronouns(saboteur)));
      }
      addBond(eliminatedPlayer, saboteur, -3);
      popDelta(eliminatedPlayer, 2);
      popDelta(saboteur, -2);
    } else if (showmance) {
      // Showmance heartbreak
      const partner = showmance.players.find(p => p !== eliminatedPlayer);
      eliminationReaction = { type: 'showmance-heartbreak', players: [eliminatedPlayer, partner], beats: [] };
      const tmpl = REACTION_TEMPLATES;
      eliminationReaction.beats.push(tmpl.showmanceGoodbye[Math.floor(Math.random() * tmpl.showmanceGoodbye.length)](eliminatedPlayer, partner, pronouns(partner)));
      addBond(eliminatedPlayer, partner, 2);
    } else {
      // Graceful exit
      eliminationReaction = { type: 'graceful-exit', players: [eliminatedPlayer], beats: [] };
      const tmpl = REACTION_TEMPLATES;
      eliminationReaction.beats.push(tmpl.gracefulExit[Math.floor(Math.random() * tmpl.gracefulExit.length)](eliminatedPlayer));
      // Closest ally
      const closestAlly = activePlayers.filter(p => p !== eliminatedPlayer).sort((a, b) => getBond(eliminatedPlayer, b) - getBond(eliminatedPlayer, a))[0];
      if (closestAlly) {
        addBond(eliminatedPlayer, closestAlly, 1);
        eliminationReaction.beats.push(`${eliminatedPlayer} hugged ${closestAlly}. "I'll miss you the most."`);
      }
    }
  }

  const phase4 = { eliminatedPlayer, eliminationReaction };

  // ══ RESULTS ══
  if (immunityWinner) {
    badges[immunityWinner] = 'bikeRaceImmune';
    popDelta(immunityWinner, 2);
    chrisQuips['immunity'] = CHRIS_BIKE_QUIPS.immunityWin[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.immunityWin.length)];
  }
  if (lastPlace) {
    badges[lastPlace] = badges[lastPlace] || 'bikeRaceLast';
    popDelta(lastPlace, -2);
    chrisQuips['lastPlace'] = CHRIS_BIKE_QUIPS.lastPlace[Math.floor(Math.random() * CHRIS_BIKE_QUIPS.lastPlace.length)];
  }

  // Set episode fields
  ep.immunityWinner = immunityWinner;
  ep.challengeType = 'individual';
  ep.challengeLabel = "That's Off the Chain!";
  ep.challengeCategory = 'mixed';
  ep.challengeDesc = 'Build a bike, swap, race, survive obstacles. First place wins immunity. Last place pays the price.';

  // Sudden death: auto-eliminate last place. Normal: tribal with heat.
  const isSuddenDeath = ep.isSuddenDeath || (ep.twists || []).some(t => t.type === 'sudden-death');
  if (isSuddenDeath && lastPlace) {
    ep.eliminated = lastPlace;
    ep.tribalPlayers = [];
  } else {
    ep.tribalPlayers = activePlayers.filter(p => p !== immunityWinner && p !== gs.exileDuelPlayer);
    if (lastPlace) {
      if (!gs._bikeRaceHeat) gs._bikeRaceHeat = {};
      gs._bikeRaceHeat[lastPlace] = { target: lastPlace, amount: 3.0, expiresEp: (gs.episode || 0) + 4 };
    }
    destroyed.forEach(p => {
      if (!gs._bikeRaceHeat) gs._bikeRaceHeat = {};
      if (!gs._bikeRaceHeat[p]) gs._bikeRaceHeat[p] = { target: p, amount: 1.5, expiresEp: (gs.episode || 0) + 4 };
    });
  }

  // Challenge record
  if (immunityWinner) updateChalRecord(immunityWinner, 'win');
  if (lastPlace) updateChalRecord(lastPlace, 'loss');

  // chalMemberScores for debug
  ep.chalMemberScores = {};
  activePlayers.forEach(name => {
    let score = bikeQuality[name] * 0.5;
    if (advancingOwners.includes(name)) score += 3;
    if (stillRacing.includes(name)) score += 3;
    const rank = finishRanking.indexOf(name);
    if (rank >= 0) score += (finishRanking.length - rank) * 2;
    if (immunityWinner === name) score += 5;
    ep.chalMemberScores[name] = score;
  });
  ep.chalPlacements = Object.entries(ep.chalMemberScores).sort(([,a],[,b]) => b - a).map(([n]) => n);

  // Badge camp events
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  const badgeLabels = {
    bikeRaceImmune: { text: 'Won the Race', cls: 'win' },
    bikeRaceBuilder: { text: 'Best Bike', cls: 'green' },
    bikeRaceWreck: { text: 'Bike Destroyed', cls: '' },
    bikeRaceLast: { text: 'Finished Last', cls: 'bad' },
    bikeRaceSaboteur: { text: 'Sabotaged a Bike', cls: 'bad' },
    bikeRaceClutch: { text: 'Survived on Fumes', cls: 'win' },
  };
  Object.entries(badges).forEach(([name, badge]) => {
    const label = badgeLabels[badge];
    if (label) {
      ep.campEvents[campKey].post.push({ type: 'bike-race-badge', text: `${name}: ${label.text}`, players: [name], badgeText: label.text, badgeClass: label.cls });
    }
  });

  ep.bikeRace = { phase1, phase2, phase3, phase4, badges, chrisQuips, activePlayers, isSuddenDeath };
}
```

- [ ] **Step 3: Commit**

```bash
git add js/chal/off-the-chain.js
git commit -m "feat(off-chain): Phase 3 (obstacle gauntlet) + Phase 4 (elimination reactions) + results"
```

---

### Task 4: Text Backlog

**Files:**
- Modify: `js/chal/off-the-chain.js`

- [ ] **Step 1: Add _textOffTheChain**

Append:

```javascript

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════
export function _textOffTheChain(ep, ln, sec) {
  if (!ep.isOffTheChain || !ep.bikeRace) return;
  const br = ep.bikeRace;

  sec("THAT'S OFF THE CHAIN!");
  ln(`${br.activePlayers.length} campers were tasked with building their own bikes — then racing them through a deadly obstacle course.`);

  sec('The Build Phase');
  ln(`${br.phase1.bestBuilder} built the best bike ("${br.phase1.bikeNames[br.phase1.bestBuilder]}") while ${br.phase1.worstBuilder} struggled.`);
  br.phase1.buildEvents.forEach(e => { if (e.text) ln(e.text); });

  sec('The Swap');
  ln(`In a cruel twist, campers drew names and raced someone else's bike.`);
  const escorted = br.phase2.finishers.map(r => `${r} crossed on ${br.phase2.riderAssignments[r]}'s bike`);
  if (escorted.length) ln(escorted.slice(0, 3).join('. ') + '.');
  ln(`${br.phase2.failures.length} riders failed to finish — their bike owners were eliminated from Part 2.`);

  sec('The Obstacle Gauntlet');
  const { finishRanking, destroyed } = br.phase3;
  if (destroyed.length) {
    ln(`${destroyed.join(', ')} had ${destroyed.length === 1 ? 'their bike' : 'their bikes'} destroyed — out of the race but safe from elimination.`);
  }
  br.phase3.obstacleEvents.forEach(e => { if (e.text) ln(e.text); });

  sec('The Finish Line');
  if (br.phase3.finishRanking.length) {
    const winner = br.phase3.finishRanking[0];
    ln(`${winner} crossed the finish line first and won immunity!`);
    if (br.phase4.eliminatedPlayer) {
      const last = br.phase4.eliminatedPlayer;
      if (br.bikeRace?.isSuddenDeath) {
        ln(`${last} finished last and was automatically eliminated.`);
      } else {
        ln(`${last} finished last — a target heading into tribal council.`);
      }
    }
  }

  if (br.phase4.eliminationReaction?.beats?.length) {
    sec('The Aftermath');
    br.phase4.eliminationReaction.beats.forEach(b => ln(b));
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/off-the-chain.js
git commit -m "feat(off-chain): text backlog"
```

---

### Task 5: VP Screen — Motocross Demolition Derby Theme

**Files:**
- Modify: `js/chal/off-the-chain.js`

This is the largest task. The VP builds all 8 screen sections as click-to-reveal steps.

- [ ] **Step 1: Add VP styles and rpBuild function**

Append the full VP to `js/chal/off-the-chain.js`. Due to length, the implementer should follow the pattern from `js/chal/hide-and-be-sneaky.js` rpBuild function but with:

**MX_STYLES constant** with:
- Background: `#1a1008`, primary: `#ff6b00`, accent: `#ffd700`, danger: `#ff3333`
- Checkered flag header pattern (repeating-conic-gradient)
- Mud splatter texture (radial-gradient brown splotches)
- Speed lines on race events (diagonal stripe animation)
- Explosion burst keyframe for bike destruction
- Hazard stripes (repeating-linear-gradient yellow/black) on danger elements
- Status classes: `.mx-safe`, `.mx-wrecked`, `.mx-immune`, `.mx-last`, `.mx-dnf`

**`rpBuildOffTheChain(ep)` function** building steps array:

1. **Starting Grid** — per-player bike card: portrait, bike name, quality bar (color-coded), Chris judging quip. Build events as individual steps.
2. **The Swap** — Chris swap quip header, then each assignment revealed: "Player draws... [bike owner]'s bike!" One step per assignment.
3. **Part 1: Qualifying** — race start quip, then per-rider results: portrait, score, finish/fail badge, Chris quip. Race events interspersed. One step per rider result.
4. **The Cut** — who advances with bike HP damage bars. One summary step.
5. **Part 2: Obstacles** — per-obstacle section header + per-racer outcome card with damage, HP bar, destruction explosion if applicable. One step per racer per obstacle. Obstacle events between.
6. **Finish Line** — final ranking with immunity winner highlight + last place fate. Chris quips.
7. **Aftermath** — elimination reaction beats, one per step.
8. **Wreckage Report** — debrief with all badges and status.

**Status tracker:** `RACING: X | WRECKED: Y | FINISHED: Z` persistent header.

**`_mxReveal` and `_mxRevealAll`** functions — same pattern as `_hsReveal`/`_hsRevealAll` from hide-and-be-sneaky.

**`_chrisQuip(quips, key)`** helper — same as hide-and-be-sneaky.

The full implementation should follow the exact VP patterns established in `js/chal/hide-and-be-sneaky.js` — the implementer should read that file's rpBuild section for reference.

- [ ] **Step 2: Commit**

```bash
git add js/chal/off-the-chain.js
git commit -m "feat(off-chain): VP screen with motocross demolition derby theme"
```

---

### Task 6: Integration — All Files

**Files:**
- Modify: `js/main.js` (import + CHALLENGES + extractedModules + window._mxReveal/_mxRevealAll)
- Modify: `js/episode.js` (import + post-merge dispatch + skip list)
- Modify: `js/twists.js` (engineType registration)
- Modify: `js/core.js` (TWIST_CATALOG entry)
- Modify: `js/vp-screens.js` (import + VP push + pre-twist exclusion + debug tab + fallback exclusion)
- Modify: `js/text-backlog.js` (import + call)
- Modify: `js/savestate.js` (patchEpisodeHistory)
- Modify: `js/alliances.js` (computeHeat for gs._bikeRaceHeat)
- Modify: `js/run-ui.js` (episode history tag)

All integration follows the EXACT same pattern as Hide and Be Sneaky. The implementer should grep for `hideAndBeSneaky` or `hide-and-be-sneaky` in each file and add parallel entries for `offTheChain` / `off-the-chain`.

- [ ] **Step 1: main.js**

Add after hide-and-be-sneaky import:
```javascript
import * as offTheChainMod from './chal/off-the-chain.js';
```

Add to `window.CHALLENGES`:
```javascript
  'off-the-chain': { simulate: offTheChainMod.simulateOffTheChain, rpBuild: offTheChainMod.rpBuildOffTheChain, text: offTheChainMod._textOffTheChain },
```

Add to `extractedModules` array: `offTheChainMod,`

Add window exposure:
```javascript
window._mxReveal = offTheChainMod._mxReveal;
window._mxRevealAll = offTheChainMod._mxRevealAll;
```

- [ ] **Step 2: episode.js**

Add import:
```javascript
import { simulateOffTheChain } from './chal/off-the-chain.js';
```

Add to post-merge dispatch chain (after hide-and-be-sneaky block):
```javascript
  } else if (ep.isOffTheChain) {
    simulateOffTheChain(ep);
    if (!ep.tribalPlayers) {
      ep.tribalPlayers = gs.activePlayers.filter(p => p !== ep.immunityWinner && !(ep.extraImmune || []).includes(p) && p !== gs.exileDuelPlayer);
    }
```

Add to updateChalRecord skip list: `&& !ep.isOffTheChain`

- [ ] **Step 3: twists.js**

Add engineType registration:
```javascript
  } else if (engineType === 'off-the-chain') {
    if (!gs.isMerged) {
      const _otcMerging = gs.activePlayers.length <= (seasonConfig.mergeAt || 12);
      if (!_otcMerging) return;
    }
    if (gs.activePlayers.length < 6) return;
    ep.isOffTheChain = true;
```

- [ ] **Step 4: core.js**

Add to TWIST_CATALOG:
```javascript
  { id:'off-the-chain', emoji:'🚲', name:"That's Off the Chain!", category:'challenge', phase:'post-merge', desc:"Build a bike, swap with another player, race. Obstacle gauntlet with land mines, oil slick, piranhas. Bike destruction = safety. First place immunity, last place eliminated (or tribal heat).", engineType:'off-the-chain', incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','brunch-of-disgustingness','lucky-hunt','hide-and-be-sneaky'] },
```

- [ ] **Step 5: vp-screens.js**

Add import:
```javascript
import { rpBuildOffTheChain } from './chal/off-the-chain.js';
```

Add VP push (before fallback):
```javascript
  } else if (ep.isOffTheChain && ep.bikeRace) {
    vpScreens.push({ id:'off-the-chain', label:"Off the Chain!", html: rpBuildOffTheChain(ep) });
```

Add to fallback exclusion: `&& !ep.isOffTheChain`

Add to pre-twist exclusion filter: `&& t.type !== 'off-the-chain'`

Add to debug tab condition: `|| ep.isOffTheChain`

Add to _chalType ternary: `ep.isOffTheChain ? "That's Off the Chain!" :`

- [ ] **Step 6: text-backlog.js**

Add import:
```javascript
import { _textOffTheChain } from './chal/off-the-chain.js';
```

Add call:
```javascript
_textOffTheChain(ep, ln, sec);
```

- [ ] **Step 7: savestate.js**

Add:
```javascript
  if (ep.isOffTheChain) h.isOffTheChain = true;
  if (!h.bikeRace && ep.bikeRace) h.bikeRace = ep.bikeRace;
```

- [ ] **Step 8: alliances.js**

Add to computeHeat (after _hideSeekHeat):
```javascript
  // Bike Race: last place and destroyed bikes get heat
  if (gs._bikeRaceHeat?.[name] && ((gs.episode || 0) + 1) < gs._bikeRaceHeat[name].expiresEp) heat += gs._bikeRaceHeat[name].amount;
```

- [ ] **Step 9: run-ui.js**

Add episode history tag:
```javascript
    const otcTag = ep.isOffTheChain ? `<span class="ep-hist-tag" style="background:rgba(255,107,0,0.15);color:#ff6b00">Off Chain</span>` : '';
```

Add `${otcTag}` to the tag rendering template.

- [ ] **Step 10: CLAUDE.md**

Add to post-merge challenge table:
```markdown
| `off-the-chain` | That's Off the Chain! | Build bike (stat-driven quality), random swap, 2-part race. Part 1: ride someone else's bike to qualify yours. Part 2: obstacle gauntlet (mines/oil/piranhas) with bike destruction = safety. 1 immunity winner, last place eliminated (sudden death) or tribal heat. Motocross demolition derby VP. |
```

Add heat variable: `gs._bikeRaceHeat`

- [ ] **Step 11: Commit**

```bash
git add js/main.js js/episode.js js/twists.js js/core.js js/vp-screens.js js/text-backlog.js js/savestate.js js/alliances.js js/run-ui.js CLAUDE.md
git commit -m "feat(off-chain): full integration — dispatch, twist catalog, VP, text, save, heat, debug, tags"
```

---

### Task 7: Smoke Test

**Files:** none (testing only)

- [ ] **Step 1: Open http://localhost:8092/simulator.html (hard refresh)**
- [ ] **Step 2: Configure a season with "That's Off the Chain!" twist**
- [ ] **Step 3: Run a full season and verify:**
  - [ ] Challenge fires in post-merge
  - [ ] Bike build phase produces varied quality
  - [ ] Swap assigns each player someone else's bike (no one rides their own)
  - [ ] Part 1 race produces finishers and failures
  - [ ] Part 2 obstacles deal damage, some bikes get destroyed
  - [ ] Destruction = safe from elimination
  - [ ] Immunity winner is first place finisher
  - [ ] Last place gets eliminated (sudden death) or heat (normal)
  - [ ] Elimination reactions fire with narrative beats
  - [ ] VP renders with motocross theme, click-to-reveal works
  - [ ] Status tracker updates
  - [ ] Text backlog has all sections
  - [ ] Episode history tag shows "Off Chain"
  - [ ] Debug tab shows challenge rankings
  - [ ] No console errors
- [ ] **Step 4: Fix any issues**
- [ ] **Step 5: Commit fixes**
