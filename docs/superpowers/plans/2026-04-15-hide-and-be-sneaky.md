# Hide and Be Sneaky Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Hide and Be Sneaky post-merge hide-and-seek challenge with 5-phase simulation, betrayal mechanics, night-vision VP theme, and full integration.

**Architecture:** Single challenge module (`js/chal/hide-and-be-sneaky.js`) exporting `simulateHideAndBeSneaky`, `rpBuildHideAndBeSneaky`, and `_textHideAndBeSneaky`. Wired into the existing challenge dispatch system via 7 integration points (main.js, episode.js, twists.js, vp-screens.js, text-backlog.js, alliances.js, savestate.js).

**Tech Stack:** Vanilla ES modules, no build step. Browser-only.

**Spec:** `docs/superpowers/specs/2026-04-15-hide-and-be-sneaky-design.md`

---

### Task 1: Create Challenge Module — Simulation Constants & Helpers

**Files:**
- Create: `js/chal/hide-and-be-sneaky.js`

This task creates the file with imports, constants (hiding spot templates, event pools), and helper functions. No exports yet — just the foundation.

- [ ] **Step 1: Create the file with imports and hiding spot templates**

```javascript
// js/chal/hide-and-be-sneaky.js — Hide and Be Sneaky challenge
import { gs, players } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';

// ── HIDING SPOT TEMPLATES ──
// Each spot has: id, name, category (physical/mental/social/boldness), indoor/outdoor,
// statBias (which stat gives bonus for this spot), riskReward (high-risk spots)
const HIDING_SPOTS = [
  // Physical-oriented
  { id:'rooftop',       name:'the lodge rooftop',                cat:'physical', indoor:false, statBias:'physical',  risk:0 },
  { id:'treetop',       name:'the top of a tall tree',           cat:'physical', indoor:false, statBias:'physical',  risk:0 },
  { id:'underwater',    name:'underwater near the dock',         cat:'physical', indoor:false, statBias:'endurance', risk:0 },
  { id:'bridge',        name:'hanging from the bridge underside',cat:'physical', indoor:false, statBias:'physical',  risk:0 },
  { id:'climbing-wall', name:'up on the rock climbing wall',     cat:'physical', indoor:false, statBias:'physical',  risk:0 },
  { id:'canoe',         name:'inside a flipped canoe on the beach',cat:'physical',indoor:false,statBias:'endurance', risk:0 },
  // Mental-oriented
  { id:'grass-camo',    name:'under grass camouflage',           cat:'mental',   indoor:false, statBias:'mental',    risk:0 },
  { id:'hollow-log',    name:'inside a hollowed-out log',        cat:'mental',   indoor:false, statBias:'mental',    risk:0 },
  { id:'waterfall',     name:'behind the waterfall curtain',     cat:'mental',   indoor:false, statBias:'mental',    risk:0 },
  { id:'buried-sand',   name:'buried under sand at the beach',   cat:'mental',   indoor:false, statBias:'endurance', risk:0 },
  { id:'totem-pole',    name:'disguised among the totem poles',  cat:'mental',   indoor:false, statBias:'mental',    risk:0 },
  { id:'supply-crate',  name:'inside a supply crate',            cat:'mental',   indoor:true,  statBias:'mental',    risk:0 },
  // Social/stealth-oriented
  { id:'kitchen',       name:"Chef's own kitchen",               cat:'social',   indoor:true,  statBias:'social',    risk:0 },
  { id:'confessional',  name:'behind the confessional outhouse', cat:'social',   indoor:false, statBias:'social',    risk:0 },
  { id:'shower-stalls', name:'inside the communal shower stalls',cat:'social',   indoor:true,  statBias:'social',    risk:0 },
  { id:'dock-stilts',   name:'under the dock in the stilts',     cat:'social',   indoor:false, statBias:'intuition', risk:0 },
  { id:'firepit',       name:'tucked inside the cold campfire pit',cat:'social', indoor:false, statBias:'intuition', risk:0 },
  // Boldness-oriented (high-risk/high-reward)
  { id:'stalker',       name:'stalking Chef Izzy-style',         cat:'boldness', indoor:false, statBias:'boldness',  risk:1 },
  { id:'chris-trailer', name:"inside Chris's private trailer",   cat:'boldness', indoor:true,  statBias:'boldness',  risk:1 },
  { id:'elim-dock',     name:'on the elimination dock itself',   cat:'boldness', indoor:false, statBias:'boldness',  risk:1 },
  { id:'outhouse-roof', name:'perched on the outhouse roof',     cat:'boldness', indoor:false, statBias:'boldness',  risk:1 },
];

// ── EVENT POOLS ──
// Each event: id, type (detection/evasion/environmental/social), applies (function to check eligibility),
// effect (function returning { targets: [{name, delta}], text, bonds?, popularity? })

// Detection events — blow cover (hiding quality MALUS)
const DETECTION_EVENTS = [
  { id:'sneeze',         weight:1.0, text: (p, pr) => `${pr.Sub} let out a sneeze that echoed across camp!` },
  { id:'trip-wire',      weight:0.8, text: (p, pr) => `${p} tripped over a loose wire, sending cans clattering!` },
  { id:'animal-skunk',   weight:0.7, text: (p, pr) => `A family of skunks found ${pr.obj} hiding — and sprayed!` },
  { id:'animal-squirrel',weight:0.7, text: (p, pr) => `A squirrel attacked ${pr.obj}, and ${pr.sub} couldn't stay quiet!` },
  { id:'animal-bird',    weight:0.7, text: (p, pr) => `A bird landed on ${pr.posAdj} head and started pecking!` },
  { id:'item-drop',      weight:0.8, text: (p, pr) => `Something fell out of ${pr.posAdj} pocket with a loud clang!` },
  { id:'panic-breath',   weight:0.6, text: (p, pr) => `${pr.Sub} started hyperventilating — the pressure was getting to ${pr.obj}!` },
  { id:'shared-spot',    weight:0.5, text: (a, aPr, b) => `${a} and ${b} found each other at the same spot — their arguing drew attention!` },
  { id:'cramp',          weight:0.6, text: (p, pr) => `${p} got a terrible cramp from staying still too long!` },
  { id:'bug-swarm',      weight:0.7, text: (p, pr) => `A swarm of bugs descended on ${pr.obj} — ${pr.sub} couldn't stop swatting!` },
  { id:'stomach-growl',  weight:0.6, text: (p, pr) => `${pr.PosAdj} stomach growled loud enough for Chef to hear!` },
  { id:'spot-decay',     weight:0.5, text: (p, pr) => `${pr.PosAdj} hiding spot started falling apart — the branch cracked under ${pr.obj}!` },
];

// Evasion events — help hiders (hiding quality BONUS)
const EVASION_EVENTS = [
  { id:'reposition',     weight:1.0, text: (p, pr) => `${p} sensed Chef approaching and silently relocated!` },
  { id:'distraction',    weight:0.8, text: (p, pr) => `A raccoon knocked over trash cans, drawing Chef away from ${pr.posAdj} area!` },
  { id:'camo-improve',   weight:0.7, text: (p, pr) => `${p} improved ${pr.posAdj} camouflage with nearby materials!` },
  { id:'buddy-system',   weight:0.5, text: (a, aPr, b) => `${a} created a distraction so ${b} could stay hidden!` },
  { id:'perfect-still',  weight:0.6, text: (p, pr) => `${p} achieved perfect stillness — ${pr.sub} was practically invisible!` },
  { id:'env-cover',      weight:0.7, text: (p, pr) => `Falling leaves provided extra cover for ${pr.posAdj} position!` },
  { id:'chef-distracted',weight:0.4, text: () => `Chef stopped to argue with Chris on the walkie-talkie — everyone breathed easier!` },
  { id:'decoy-works',    weight:0.3, text: (p, pr) => `${pr.PosAdj} earlier decoy worked — Chef wasted time searching an empty area!` },
];

// Environmental events — chaos (variable BONUS/MALUS)
const ENVIRONMENTAL_EVENTS = [
  { id:'rain',           weight:0.3, text: () => `Rain started falling — outdoor hiders scrambled, but indoor hiders relaxed!`, persists:true },
  { id:'wind',           weight:0.4, text: () => `A strong wind picked up, rattling the treetops and rooftops!` },
  { id:'chef-decoy',     weight:0.5, text: () => `Chef investigated a suspicious rustling — but it was just a deer!` },
  { id:'power-outage',   weight:0.3, text: () => `The camp power went out — indoor hiders disappeared into darkness!` },
  { id:'stampede',       weight:0.3, text: () => `A group of raccoons stampeded through camp, causing chaos everywhere!` },
  { id:'sunset',         weight:0.2, text: () => `The sun dipped below the trees — shadows stretched across the island!`, persists:true },
  { id:'fog',            weight:0.2, text: () => `A thick fog rolled in from the lake, blanketing the campgrounds!`, persists:true },
  { id:'loudspeaker',    weight:0.4, text: () => `Chris blasted the loudspeaker: "HOW'S EVERYONE DOING?!" — startling every hider!` },
];

// Social events — bond/heat + hiding quality
const SOCIAL_EVENTS = [
  { id:'spot-another',   weight:0.7, text: (a, aPr, b) => `${a} spotted ${b} from ${aPr.posAdj} hiding place — useful intel for later...` },
  { id:'taunt',          weight:0.4, text: (a, aPr, b) => `${a} taunted ${b}'s general area from the caught pool: "Over there, Chef!"` },
  { id:'solidarity',     weight:0.6, text: (a, aPr, b) => `${a} and ${b} locked eyes from their hiding spots — and stayed silent.` },
  { id:'showmance',      weight:0.5, text: (a, aPr, b) => `${a} whispered comfort to ${b} from a nearby spot — risky, but sweet.` },
  { id:'rivalry',        weight:0.4, text: (a, aPr, b) => `${a} deliberately rustled the bushes near ${b}'s spot!` },
  { id:'caught-cheer',   weight:0.3, text: (a, aPr, b) => `${a} shouted encouragement to ${b} from the caught pool!` },
];

// ── CHASE BEAT TEMPLATES (Phase 4/5) ──
const CHASE_BEATS = [
  { id:'dodge',     text: (p, pr, win) => win ? `${p} ducked under Chef's spray at the last second!` : `Chef's water blast caught ${p} mid-stride!` },
  { id:'obstacle',  text: (p, pr, win) => win ? `${p} vaulted a fallen log without breaking stride!` : `${p} tripped over a log and went sprawling!` },
  { id:'shortcut',  text: (p, pr, win) => win ? `${p} cut through the kitchen — brilliant shortcut!` : `${p} tried a shortcut and hit a dead end!` },
  { id:'last-stand',text: (p, pr, win) => win ? `${p} pulled off an incredible fake-out juke on Chef!` : `Chef cornered ${p} — nowhere left to run!` },
  { id:'combat',    text: (p, pr, win) => win ? `${p} went full Izzy — dropkicked the water gun out of Chef's hands!` : `${p} tried to fight Chef... it didn't go well.` },
  { id:'slide',     text: (p, pr, win) => win ? `${p} dove headfirst and slid into home base!` : `${p} dove for home base but got blasted inches short!` },
  { id:'window',    text: (p, pr, win) => win ? `${p} leapt through a window and landed in a perfect roll!` : `${p} jumped through a window and landed face-first in mud!` },
];

// ── HELPER: weighted random pick ──
function wPick(arr) {
  const total = arr.reduce((s, e) => s + (e.weight || 1), 0);
  let r = Math.random() * total;
  for (const item of arr) {
    r -= (item.weight || 1);
    if (r <= 0) return item;
  }
  return arr[arr.length - 1];
}

// ── HELPER: hiding quality formula ──
function calcHidingQuality(name, spot) {
  const s = pStats(name);
  let q = s.mental * 0.3 + s.intuition * 0.25 + s.physical * 0.2 + s.social * 0.15 + s.boldness * 0.1;
  // Spot stat bias bonus
  if (spot.statBias && s[spot.statBias]) q += s[spot.statBias] * 0.1;
  // Risk/reward for bold spots
  if (spot.risk) q += s.boldness * 0.15 - 1.0; // high boldness needed to offset penalty
  // Noise
  q += (Math.random() * 3) - 1.5;
  return q;
}

// ── HELPER: observation score (how well a player observes others hiding) ──
function calcObservation(observerName) {
  const s = pStats(observerName);
  return s.intuition * 0.5 + s.mental * 0.3 + (Math.random() * 2 - 1);
}

// ── HELPER: escape score ──
function calcEscapeScore(name) {
  const s = pStats(name);
  return s.physical * 0.35 + s.boldness * 0.3 + s.endurance * 0.2 + (Math.random() * 3 - 1.5);
}

// ── HELPER: intel quality for betrayal ──
function calcIntelScore(name) {
  const s = pStats(name);
  return s.intuition * 0.4 + s.mental * 0.3 + s.strategic * 0.3;
}

// ── HELPER: archetype category ──
const VILLAIN_ARCHETYPES = ['villain', 'mastermind', 'schemer'];
const NICE_ARCHETYPES = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
// Neutral = everything else: hothead, challenge-beast, wildcard, chaos-agent, floater, perceptive-player

function getArchetype(name) {
  return players.find(p => p.name === name)?.archetype || '';
}

function isVillainArch(name) { return VILLAIN_ARCHETYPES.includes(getArchetype(name)); }
function isNiceArch(name) { return NICE_ARCHETYPES.includes(getArchetype(name)); }
function isNeutralArch(name) { return !isVillainArch(name) && !isNiceArch(name); }

// ── HELPER: would this neutral player betray? ──
function neutralWouldBetray(name) {
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

// ── HELPER: popularity update ──
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/hide-and-be-sneaky.js
git commit -m "feat(hide-seek): scaffold module with constants, spots, event pools, helpers"
```

---

### Task 2: Simulation — Phase 1 (Hide) & Phase 2 (Hunt)

**Files:**
- Modify: `js/chal/hide-and-be-sneaky.js`

Adds the `simulateHideAndBeSneaky` export with Phase 1 (hiding spot assignment, observable intel) and Phase 2 (hunt rounds with 3-4 events per round, escape checks).

- [ ] **Step 1: Add Phase 1 — Hide**

Append to `js/chal/hide-and-be-sneaky.js`:

```javascript
// ══════════════════════════════════════════════════════════════
// SIMULATE
// ══════════════════════════════════════════════════════════════
export function simulateHideAndBeSneaky(ep) {
  const activePlayers = [...gs.activePlayers];
  const n = activePlayers.length;

  // ── PHASE 1: HIDE ──
  // Assign hiding spots based on stat profile + archetype
  const spotAssignments = {}; // { name: spotObj }
  const hidingQuality = {};   // { name: number } — mutable throughout hunt
  const observedBy = {};      // { name: { [observer]: score } }
  const usedSpots = new Set();

  // Sort available spots by category preference per player
  activePlayers.forEach(name => {
    const s = pStats(name);
    const arch = getArchetype(name);

    // Archetype-driven spot preference
    let preferredCat = 'mental'; // default
    if (['challenge-beast'].includes(arch)) preferredCat = 'physical';
    if (['schemer', 'mastermind', 'villain'].includes(arch)) preferredCat = 'social';
    if (['wildcard', 'chaos-agent'].includes(arch) && s.boldness >= 6) preferredCat = 'boldness';
    if (['social-butterfly', 'hero'].includes(arch)) preferredCat = 'social';
    if (['underdog', 'floater', 'perceptive-player'].includes(arch)) preferredCat = 'mental';
    if (s.physical >= 8) preferredCat = 'physical';

    // Stalker strategy: wildcards/chaos-agents with high boldness+intuition
    if (['wildcard', 'chaos-agent'].includes(arch) && s.boldness >= 7 && s.intuition >= 6 && Math.random() < 0.4) {
      const stalkerSpot = HIDING_SPOTS.find(sp => sp.id === 'stalker');
      spotAssignments[name] = stalkerSpot;
      hidingQuality[name] = calcHidingQuality(name, stalkerSpot);
      // Stalker check: high risk
      const stalkerCheck = s.boldness * 0.4 + s.intuition * 0.3 + s.physical * 0.3 + (Math.random() * 2 - 1);
      if (stalkerCheck < 6) {
        hidingQuality[name] -= 3; // auto-found penalty
      } else {
        hidingQuality[name] += 2; // bonus for pulling it off
      }
      usedSpots.add('stalker');
      return;
    }

    // Pick best available spot from preferred category, fallback to any
    const available = HIDING_SPOTS.filter(sp => !usedSpots.has(sp.id) && sp.id !== 'stalker');
    const preferred = available.filter(sp => sp.cat === preferredCat);
    const spotPool = preferred.length ? preferred : available;
    const spot = spotPool[Math.floor(Math.random() * spotPool.length)] || available[0];
    spotAssignments[name] = spot;
    usedSpots.add(spot.id);
    hidingQuality[name] = calcHidingQuality(name, spot);

    // Archetype bonuses/penalties
    if (arch === 'underdog') hidingQuality[name] += 1.0; // surprising spot
    if (arch === 'goat') hidingQuality[name] -= 1.0;     // poor choice
    if (arch === 'hothead') hidingQuality[name] -= 0.5;  // picked too quickly
    if (arch === 'floater') hidingQuality[name] += 0.3;  // unremarkable but solid
    if (arch === 'perceptive-player') hidingQuality[name] += 0.5; // reads environment
    if (arch === 'showmancer') {
      // Try to hide near partner
      const showmance = (gs.showmances || []).find(sh =>
        sh.phase !== 'broken-up' && sh.players.includes(name) &&
        sh.players.some(p => p !== name && activePlayers.includes(p))
      );
      if (showmance) hidingQuality[name] -= 0.5; // shared risk
    }
  });

  // Build observable intel: how much each player noticed about others during the scramble
  activePlayers.forEach(observer => {
    observedBy[observer] = {};
    activePlayers.forEach(target => {
      if (target === observer) return;
      observedBy[observer][target] = calcObservation(observer);
    });
    // Schemer/mastermind bonus: picked spots to watch others
    if (['schemer', 'mastermind'].includes(getArchetype(observer))) {
      Object.keys(observedBy[observer]).forEach(t => { observedBy[observer][t] += 1.5; });
    }
    // Hero: high observation
    if (getArchetype(observer) === 'hero') {
      Object.keys(observedBy[observer]).forEach(t => { observedBy[observer][t] += 0.5; });
    }
  });

  // ── PHASE 1 RESULT ──
  const phase1 = {
    spots: { ...spotAssignments },
    initialQuality: { ...hidingQuality },
  };
```

- [ ] **Step 2: Add Phase 2 — Hunt rounds**

Continue in the same function:

```javascript
  // ── PHASE 2: HUNT ──
  const totalRounds = Math.ceil(n * 0.7);
  const baseDetection = 4.5;
  const escalation = 0.6;
  let hidden = [...activePlayers];
  const caught = [];          // [{ name, round, method:'found'|'escape-fail', escapeAttempted:bool }]
  const escaped = [];         // [{ name, round }] — escaped to home base
  const rounds = [];
  const persistingEffects = { rain:false, fog:false, sunset:false }; // environmental persists
  const badges = {};          // { name: badgeId }

  for (let r = 1; r <= totalRounds; r++) {
    if (hidden.length <= 1) break; // last hider wins automatically
    const chefDetection = baseDetection + r * escalation;
    const roundData = { num: r, events: [], found: null, escaped: null, hiddenCount: hidden.length };

    // ── Generate 3-4 events ──
    const eventCount = 3 + (Math.random() < 0.5 ? 1 : 0);
    const roundBonuses = {}; // { name: totalDelta } for this round

    for (let e = 0; e < eventCount; e++) {
      // Pick event category: early rounds favor evasion/environmental, later detection/social
      const lateGame = r / totalRounds;
      const catRoll = Math.random();
      let pool;
      if (catRoll < 0.25 + lateGame * 0.15) pool = DETECTION_EVENTS;
      else if (catRoll < 0.5) pool = EVASION_EVENTS;
      else if (catRoll < 0.7) pool = ENVIRONMENTAL_EVENTS;
      else pool = SOCIAL_EVENTS;

      const template = wPick(pool);
      const evt = { id: template.id, type: pool === DETECTION_EVENTS ? 'detection' : pool === EVASION_EVENTS ? 'evasion' : pool === ENVIRONMENTAL_EVENTS ? 'environmental' : 'social' };

      // Resolve event target(s)
      if (pool === ENVIRONMENTAL_EVENTS) {
        // Environmental: affects groups
        evt.text = template.text();
        if (template.persists) persistingEffects[template.id] = true;

        if (template.id === 'rain') {
          hidden.forEach(h => {
            const spot = spotAssignments[h];
            const delta = spot.indoor ? 1.0 : -1.0;
            hidingQuality[h] += delta;
            roundBonuses[h] = (roundBonuses[h] || 0) + delta;
          });
        } else if (template.id === 'wind') {
          hidden.forEach(h => {
            const spot = spotAssignments[h];
            if (['treetop', 'rooftop', 'outhouse-roof'].includes(spot.id)) {
              const s = pStats(h);
              const physCheck = s.physical + (Math.random() * 2 - 1);
              const delta = physCheck >= 6 ? -0.5 : -1.5;
              hidingQuality[h] += delta;
              roundBonuses[h] = (roundBonuses[h] || 0) + delta;
            }
          });
        } else if (template.id === 'power-outage') {
          hidden.forEach(h => {
            if (spotAssignments[h].indoor) {
              hidingQuality[h] += 1.5;
              roundBonuses[h] = (roundBonuses[h] || 0) + 1.5;
            }
          });
        } else if (template.id === 'chef-decoy') {
          hidden.forEach(h => {
            hidingQuality[h] += 0.5;
            roundBonuses[h] = (roundBonuses[h] || 0) + 0.5;
          });
        } else if (template.id === 'stampede') {
          hidden.forEach(h => {
            hidingQuality[h] -= 1.0;
            roundBonuses[h] = (roundBonuses[h] || 0) - 1.0;
          });
        } else if (template.id === 'sunset' || template.id === 'fog') {
          hidden.forEach(h => {
            hidingQuality[h] += 1.0;
            roundBonuses[h] = (roundBonuses[h] || 0) + 1.0;
          });
        } else if (template.id === 'loudspeaker') {
          hidden.forEach(h => {
            hidingQuality[h] -= 0.5;
            roundBonuses[h] = (roundBonuses[h] || 0) - 0.5;
          });
        }
        evt.targets = [...hidden];
      } else if (pool === SOCIAL_EVENTS) {
        // Social: need two players
        if (template.id === 'taunt' || template.id === 'caught-cheer') {
          // Need a caught player and a hidden player
          if (!caught.length || !hidden.length) continue;
          const caughtP = caught[Math.floor(Math.random() * caught.length)].name;
          const cPr = pronouns(caughtP);
          // Taunt: pick lowest bond hidden player. Cheer: pick highest bond.
          const sorted = [...hidden].sort((a, b) =>
            template.id === 'taunt' ? getBond(caughtP, a) - getBond(caughtP, b) : getBond(caughtP, b) - getBond(caughtP, a)
          );
          const target = sorted[0];
          evt.text = template.text(caughtP, cPr, target);
          evt.targets = [caughtP, target];

          if (template.id === 'taunt') {
            hidingQuality[target] -= 1.5;
            roundBonuses[target] = (roundBonuses[target] || 0) - 1.5;
            addBond(caughtP, target, -1);
          } else {
            // Caught player cheers: +0.5 morale but -1.0 position revealed
            hidingQuality[target] += 0.5;
            hidingQuality[target] -= 1.0;
            roundBonuses[target] = (roundBonuses[target] || 0) - 0.5;
            addBond(caughtP, target, 1);
          }
        } else {
          // Two hidden players
          if (hidden.length < 2) continue;
          let a, b;
          if (template.id === 'showmance') {
            const sh = (gs.showmances || []).find(s =>
              s.phase !== 'broken-up' && s.players.every(p => hidden.includes(p))
            );
            if (!sh) continue;
            [a, b] = sh.players;
          } else if (template.id === 'rivalry') {
            // Pick lowest bond pair among hidden
            let worstBond = Infinity, bestPair = null;
            for (let i = 0; i < hidden.length; i++) {
              for (let j = i + 1; j < hidden.length; j++) {
                const bond = getBond(hidden[i], hidden[j]);
                if (bond < worstBond) { worstBond = bond; bestPair = [hidden[i], hidden[j]]; }
              }
            }
            if (!bestPair || worstBond >= 0) continue; // need actual rivals
            [a, b] = bestPair;
          } else {
            // Random pair of hidden players
            const shuffled = [...hidden].sort(() => Math.random() - 0.5);
            a = shuffled[0]; b = shuffled[1];
          }
          const aPr = pronouns(a);
          evt.text = template.text(a, aPr, b);
          evt.targets = [a, b];

          if (template.id === 'solidarity') {
            hidingQuality[a] += 0.5; hidingQuality[b] += 0.5;
            roundBonuses[a] = (roundBonuses[a] || 0) + 0.5;
            roundBonuses[b] = (roundBonuses[b] || 0) + 0.5;
            addBond(a, b, 1);
          } else if (template.id === 'showmance') {
            hidingQuality[a] -= 0.5; hidingQuality[b] -= 0.5;
            roundBonuses[a] = (roundBonuses[a] || 0) - 0.5;
            roundBonuses[b] = (roundBonuses[b] || 0) - 0.5;
            addBond(a, b, 1);
          } else if (template.id === 'rivalry') {
            // Villain/schemer sabotages rival's spot
            if (isVillainArch(a)) {
              hidingQuality[b] -= 1.5;
              roundBonuses[b] = (roundBonuses[b] || 0) - 1.5;
              addBond(a, b, -2);
            } else if (isVillainArch(b)) {
              hidingQuality[a] -= 1.5;
              roundBonuses[a] = (roundBonuses[a] || 0) - 1.5;
              addBond(b, a, -2);
            }
          } else if (template.id === 'spot-another') {
            // Observer gains intel
            if (observedBy[a]) observedBy[a][b] = (observedBy[a][b] || 0) + 2.0;
          }
        }
      } else {
        // Detection or Evasion: single player (or pair for buddy-system/shared-spot)
        if (template.id === 'shared-spot' || template.id === 'buddy-system') {
          if (hidden.length < 2) continue;
          const shuffled = [...hidden].sort(() => Math.random() - 0.5);
          const a = shuffled[0], b = shuffled[1];
          const aPr = pronouns(a);
          evt.text = template.text(a, aPr, b);
          evt.targets = [a, b];
          if (template.id === 'shared-spot') {
            hidingQuality[a] -= 1.5; hidingQuality[b] -= 1.5;
            roundBonuses[a] = (roundBonuses[a] || 0) - 1.5;
            roundBonuses[b] = (roundBonuses[b] || 0) - 1.5;
          } else {
            // Buddy system: helper -1.0, partner +2.0
            hidingQuality[a] -= 1.0; hidingQuality[b] += 2.0;
            roundBonuses[a] = (roundBonuses[a] || 0) - 1.0;
            roundBonuses[b] = (roundBonuses[b] || 0) + 2.0;
            addBond(a, b, 1);
          }
        } else {
          // Single target
          const target = hidden[Math.floor(Math.random() * hidden.length)];
          const tPr = pronouns(target);
          evt.text = template.text(target, tPr);
          evt.targets = [target];

          // Apply effect
          let delta = 0;
          if (pool === DETECTION_EVENTS) {
            if (template.id === 'trip-wire') delta = -2.0;
            else if (template.id === 'animal-skunk') delta = -2.5;
            else if (template.id === 'animal-squirrel' || template.id === 'animal-bird') delta = -1.5;
            else if (template.id === 'panic-breath') {
              // Worse for low boldness
              delta = pStats(target).boldness >= 6 ? -0.5 : -1.5;
            } else if (template.id === 'spot-decay') delta = -1.5;
            else if (template.id === 'cramp') {
              delta = pStats(target).physical >= 6 ? -0.5 : -1.0;
            } else delta = -1.0; // sneeze, item-drop, bug-swarm, stomach-growl
          } else {
            // Evasion
            if (template.id === 'reposition') {
              delta = 1.5;
              // Only high intuition players can reposition
              if (pStats(target).intuition < 5) delta = 0.5;
            } else if (template.id === 'camo-improve') {
              delta = pStats(target).mental >= 6 ? 1.5 : 0.5;
            } else if (template.id === 'perfect-still') {
              delta = pStats(target).mental >= 6 && pStats(target).intuition >= 6 ? 1.5 : 0.5;
            } else if (template.id === 'decoy-works') {
              delta = pStats(target).mental >= 7 ? 1.5 : 0.5;
            } else if (template.id === 'chef-distracted') {
              // Global — apply to all
              hidden.forEach(h => {
                hidingQuality[h] += 0.5;
                roundBonuses[h] = (roundBonuses[h] || 0) + 0.5;
              });
              delta = 0; // already applied
            } else delta = 1.0; // distraction, env-cover
          }
          hidingQuality[target] += delta;
          roundBonuses[target] = (roundBonuses[target] || 0) + delta;
          evt.delta = delta;
        }
      }
      roundData.events.push(evt);
    }

    // ── Apply persisting environmental effects ──
    if (persistingEffects.rain) {
      hidden.forEach(h => {
        const spot = spotAssignments[h];
        hidingQuality[h] += spot.indoor ? 0.3 : -0.3;
      });
    }
    if (persistingEffects.fog || persistingEffects.sunset) {
      hidden.forEach(h => { hidingQuality[h] += 0.2; });
    }

    // ── Detection: find lowest quality hider ──
    const sortedByQuality = [...hidden].sort((a, b) => hidingQuality[a] - hidingQuality[b]);
    const weakest = sortedByQuality[0];
    const weakestQ = hidingQuality[weakest];

    if (weakestQ < chefDetection) {
      // Found! Escape check
      const escScore = calcEscapeScore(weakest);
      const sprayAccuracy = 5 + r * 0.3; // Chef gets more accurate
      const didEscape = escScore > sprayAccuracy && Math.random() < 0.18; // ~15-20% tuning

      if (didEscape) {
        escaped.push({ name: weakest, round: r });
        roundData.escaped = { name: weakest, escapeScore: escScore };
        badges[weakest] = 'hideSeekClutch';
        popDelta(weakest, 2);
      } else {
        caught.push({ name: weakest, round: r, method: 'found', escapeAttempted: true });
        roundData.found = { name: weakest, escaped: false };
        // Embarrassing catch?
        const lastEvt = roundData.events.find(e => e.targets?.includes(weakest) && e.type === 'detection');
        if (lastEvt && ['animal-skunk', 'sneeze', 'stomach-growl', 'bug-swarm'].includes(lastEvt.id)) {
          badges[weakest] = 'hideSeekFlush';
          popDelta(weakest, -1);
        }
      }
      hidden = hidden.filter(h => h !== weakest);
    } else {
      // Chef searched but found nobody — tension beat
      roundData.found = null;
    }

    roundData.hiddenAfter = hidden.length;
    rounds.push(roundData);
  }

  const phase2 = { rounds, caught: [...caught], escaped: [...escaped] };
```

- [ ] **Step 3: Commit**

```bash
git add js/chal/hide-and-be-sneaky.js
git commit -m "feat(hide-seek): Phase 1 (hide) + Phase 2 (hunt rounds) simulation"
```

---

### Task 3: Simulation — Phase 3 (Betrayal), Phase 4 (Escape), Phase 5 (Showdown)

**Files:**
- Modify: `js/chal/hide-and-be-sneaky.js`

Continues the `simulateHideAndBeSneaky` function with the remaining three phases and the result/state packaging.

- [ ] **Step 1: Add Phase 3 — Betrayal**

Continue inside `simulateHideAndBeSneaky`:

```javascript
  // ── PHASE 3: BETRAYAL ──
  const betrayals = []; // [{ betrayer, target, intelQuality, effect, targetFound }]
  const loyals = [];    // [name] — players who refused to betray

  caught.forEach(({ name }) => {
    const arch = getArchetype(name);
    let willing = false;

    if (isVillainArch(name)) {
      willing = true;
    } else if (isNiceArch(name)) {
      willing = false;
      loyals.push(name);
      popDelta(name, 1);
    } else if (isNeutralArch(name)) {
      willing = neutralWouldBetray(name);
      if (!willing) loyals.push(name);
    }

    if (willing && hidden.length > 0) {
      // Pick target: lowest bond among hidden players
      const target = [...hidden].sort((a, b) => getBond(name, a) - getBond(name, b))[0];
      const intel = calcIntelScore(name);
      // Use observedBy data for accuracy
      const observationData = observedBy[name]?.[target] || 0;
      const effectiveIntel = intel * 0.6 + observationData * 0.4;

      let penalty;
      if (effectiveIntel > 7) penalty = 3.0;
      else if (effectiveIntel > 4) penalty = 1.5;
      else penalty = 0.5;

      hidingQuality[target] -= penalty;

      // Bond damage
      const bondDmg = -(2 + Math.floor(penalty));
      addBond(name, target, bondDmg);

      // Popularity hit for betrayer
      const targetLikability = (gs.popularity?.[target] || 0);
      let popHit = targetLikability > 0 ? -Math.min(3, Math.ceil(targetLikability / 2)) : -1;
      if (isVillainArch(name)) popHit = Math.ceil(popHit / 2); // expected behavior
      popDelta(name, popHit);

      betrayals.push({
        betrayer: name, target, intelQuality: effectiveIntel > 7 ? 'high' : effectiveIntel > 4 ? 'medium' : 'low',
        penalty, targetFound: false, // updated later
      });

      badges[name] = 'hideSeekTracker';

      // Expose moment: high-intuition hidden player may overhear
      hidden.forEach(h => {
        if (h === target) return;
        const s = pStats(h);
        if (s.intuition >= 7 && Math.random() < 0.4) {
          // Overheard the betrayal — bond damage toward betrayer
          addBond(h, name, -1);
        }
      });
    }
  });

  // Loyalty bonus: all loyals get bond boost with hidden players post-challenge
  loyals.forEach(l => {
    hidden.forEach(h => { addBond(l, h, 1); });
    badges[l] = badges[l] || 'hideSeekLoyal';
  });

  const phase3 = { betrayals: [...betrayals], loyals: [...loyals] };
```

- [ ] **Step 2: Add Phase 4 — Escape (fight-or-flight)**

```javascript
  // ── PHASE 4: ESCAPE (fight-or-flight) ──
  const escapeAttempts = []; // [{ name, decision, beats, success }]
  const dangerThreshold = baseDetection + totalRounds * escalation - 1.5;

  // Check each remaining hider — are they in danger?
  const atRisk = hidden.filter(h => hidingQuality[h] < dangerThreshold);
  const safe = hidden.filter(h => hidingQuality[h] >= dangerThreshold);

  atRisk.forEach(name => {
    const s = pStats(name);
    const arch = getArchetype(name);

    // Decision AI
    let runsForIt = false;
    if (s.boldness >= 7 && s.physical >= 6) runsForIt = true;
    else if (s.mental >= 7 && hidingQuality[name] >= dangerThreshold - 1) runsForIt = false;
    else if (s.boldness <= 4) runsForIt = false; // freezes
    else if (arch === 'challenge-beast') runsForIt = true;
    else if (arch === 'mastermind') runsForIt = false;
    else if (arch === 'wildcard') runsForIt = Math.random() < 0.5;
    else runsForIt = s.physical + s.boldness > s.mental + s.intuition;

    if (runsForIt) {
      // Break for home base
      const escScore = calcEscapeScore(name);
      const sprayAcc = 5 + totalRounds * 0.3 + (1 / Math.max(1, hidden.length)); // fewer targets = harder
      const success = escScore > sprayAcc;

      // Generate 2-3 chase beats
      const beatCount = 2 + (Math.random() < 0.4 ? 1 : 0);
      const beats = [];
      const availBeats = [...CHASE_BEATS].sort(() => Math.random() - 0.5);
      for (let i = 0; i < beatCount && i < availBeats.length; i++) {
        const bt = availBeats[i];
        const pr = pronouns(name);
        const isLastBeat = i === beatCount - 1;
        const beatWin = isLastBeat ? success : Math.random() < 0.6; // intermediate beats mostly succeed
        beats.push({ id: bt.id, text: bt.text(name, pr, beatWin), win: beatWin });
      }

      if (success) {
        escaped.push({ name, round: 'phase4' });
        badges[name] = 'hideSeekClutch';
        popDelta(name, 2);
      } else {
        caught.push({ name, round: 'phase4', method: 'escape-fail', escapeAttempted: true });
      }
      hidden = hidden.filter(h => h !== name);
      escapeAttempts.push({ name, decision: 'run', beats, success });
    } else {
      // Stay hidden — gamble
      const survivalChance = hidingQuality[name] / dangerThreshold;
      const survived = Math.random() < Math.min(0.8, survivalChance);
      if (!survived) {
        caught.push({ name, round: 'phase4', method: 'found', escapeAttempted: false });
        hidden = hidden.filter(h => h !== name);
      } else {
        hidingQuality[name] += 1.0; // adrenaline focus
      }
      escapeAttempts.push({ name, decision: 'stay', beats: [], success: survived });
    }
  });

  const phase4 = { attempts: escapeAttempts, safeHiders: [...safe] };
```

- [ ] **Step 3: Add Phase 5 — Showdown**

```javascript
  // ── PHASE 5: SHOWDOWN (cat-and-mouse chase) ──
  let showdown = null;
  let immunityWinners = [...escaped.map(e => e.name)]; // already escaped players

  if (hidden.length === 1) {
    // Last hider wins automatically
    immunityWinners.push(hidden[0]);
    badges[hidden[0]] = 'hideSeekImmune';
    popDelta(hidden[0], 2);
  } else if (hidden.length >= 2) {
    // Showdown: all hiders flushed, cat-and-mouse chase
    const chaseResults = {};
    const showdownBeats = {};

    hidden.forEach(name => {
      const s = pStats(name);
      let totalScore = 0;
      const beats = [];
      const beatCount = 3 + (Math.random() < 0.3 ? 1 : 0);
      const availBeats = [...CHASE_BEATS].sort(() => Math.random() - 0.5);

      for (let i = 0; i < beatCount && i < availBeats.length; i++) {
        const bt = availBeats[i];
        let beatScore;
        if (bt.id === 'dodge') beatScore = s.physical * 0.3 + s.intuition * 0.3 + s.boldness * 0.2 + (Math.random() * 2 - 1);
        else if (bt.id === 'obstacle') beatScore = s.physical * 0.4 + s.boldness * 0.3 + (Math.random() * 2 - 1);
        else if (bt.id === 'shortcut') beatScore = s.mental * 0.3 + s.boldness * 0.4 + (Math.random() * 2 - 1);
        else if (bt.id === 'last-stand' || bt.id === 'combat') beatScore = s.boldness * 0.4 + s.physical * 0.3 + s.social * 0.15 + (Math.random() * 2 - 1);
        else beatScore = s.physical * 0.3 + s.boldness * 0.3 + (Math.random() * 2 - 1);

        const beatWin = beatScore >= 4.5;
        totalScore += beatWin ? beatScore : -1;

        const pr = pronouns(name);
        beats.push({ id: bt.id, text: bt.text(name, pr, beatWin), win: beatWin, score: beatScore });
      }

      // Teammate interference: caught players can help or hinder
      caught.forEach(({ name: caughtP }) => {
        const bond = getBond(caughtP, name);
        if (bond >= 3 && Math.random() < 0.3) {
          totalScore += 1.5;
          addBond(caughtP, name, 2);
          beats.push({ id:'interference', text: `${caughtP} "accidentally" tripped Chef, buying ${name} precious seconds!`, win: true, score: 1.5 });
        } else if (bond <= -3 && Math.random() < 0.3) {
          totalScore -= 1.5;
          addBond(caughtP, name, -2);
          beats.push({ id:'interference', text: `${caughtP} pointed Chef right at ${name}!`, win: false, score: -1.5 });
        }
      });

      // Showmance sacrifice check
      const showmance = (gs.showmances || []).find(sh =>
        sh.phase !== 'broken-up' && sh.players.includes(name) &&
        sh.players.some(p => p !== name && hidden.includes(p))
      );
      if (showmance) {
        const partner = showmance.players.find(p => p !== name);
        const s2 = pStats(name);
        if (s2.loyalty >= 7 && Math.random() < 0.3) {
          // Sacrifice: this player tanks their score to boost partner
          totalScore -= 3;
          chaseResults[partner] = (chaseResults[partner] || 0) + 3;
          addBond(name, partner, 3);
          popDelta(name, 3);
          beats.push({ id:'sacrifice', text: `${name} drew Chef's fire to protect ${partner} — a heroic sacrifice!`, win: false, score: -3 });
        }
      }

      // Rivalry sabotage check
      hidden.forEach(rival => {
        if (rival === name) return;
        if (getBond(name, rival) <= -4 && Math.random() < 0.25) {
          totalScore -= 0.5;
          chaseResults[rival] = (chaseResults[rival] || 0) - 1.5;
          addBond(name, rival, -2);
          beats.push({ id:'rivalry', text: `${name} shoved ${rival} into Chef's path!`, win: false, score: -0.5 });
        }
      });

      chaseResults[name] = (chaseResults[name] || 0) + totalScore;
      showdownBeats[name] = beats;
    });

    // Determine winner: highest chase score
    const showdownRanking = Object.entries(chaseResults).sort(([,a], [,b]) => b - a);
    const winner = showdownRanking[0][0];
    immunityWinners.push(winner);
    badges[winner] = 'hideSeekImmune';
    popDelta(winner, 2);

    // Flashy escape bonus
    const winnerBeats = showdownBeats[winner];
    if (winnerBeats.some(b => b.id === 'combat' && b.win)) {
      popDelta(winner, 2); // Izzy-style combat bonus
    }

    showdown = {
      participants: [...hidden],
      results: chaseResults,
      ranking: showdownRanking.map(([name, score]) => ({ name, score })),
      beats: showdownBeats,
      winner,
    };
  }
  // If hidden.length === 0, only escaped players (if any) have immunity

  // Stalker badge
  activePlayers.forEach(name => {
    if (spotAssignments[name]?.id === 'stalker') {
      if (immunityWinners.includes(name) || hidden.includes(name)) {
        badges[name] = 'hideSeekStalker';
        popDelta(name, 2);
      } else {
        badges[name] = badges[name] || 'hideSeekStalker';
        popDelta(name, -1);
      }
    }
  });

  const phase5 = showdown;
```

- [ ] **Step 4: Add result packaging, immunity, and heat**

```javascript
  // ── RESULTS ──
  // Cap at 2 immunity winners
  if (immunityWinners.length > 2) immunityWinners = immunityWinners.slice(0, 2);
  if (immunityWinners.length === 0 && hidden.length === 1) {
    immunityWinners.push(hidden[0]);
    badges[hidden[0]] = 'hideSeekImmune';
  }

  // Update betrayal records — was target found because of betrayal?
  betrayals.forEach(b => {
    if (caught.some(c => c.name === b.target)) b.targetFound = true;
  });

  // Heat: betrayers get heat with targets
  if (!gs._hideSeekHeat) gs._hideSeekHeat = {};
  betrayals.forEach(b => {
    gs._hideSeekHeat[b.target] = {
      target: b.betrayer,
      amount: b.penalty * 1.5,
      expiresEp: (gs.episode || 0) + 4,
    };
  });

  // Set episode fields
  const primaryWinner = immunityWinners[0] || null;
  ep.immunityWinner = primaryWinner;
  if (immunityWinners.length > 1) {
    ep.extraImmune = [...new Set([...(ep.extraImmune || []), ...immunityWinners.slice(1)])];
  }
  ep.challengeType = 'individual';
  ep.challengeLabel = 'Hide and Be Sneaky';
  ep.challengeCategory = 'mixed';
  ep.challengeDesc = 'An extreme hide-and-seek game with a water gun-wielding Chef Hatchet.';
  ep.tribalPlayers = gs.activePlayers.filter(p => !immunityWinners.includes(p) && p !== gs.exileDuelPlayer);

  // Challenge record: immunity winner(s) get wins, everyone else gets participation
  immunityWinners.forEach(w => updateChalRecord(w, 'win'));
  // Bottom performers: caught first
  if (caught.length) {
    updateChalRecord(caught[0].name, 'loss');
  }

  // Store full state for VP/text
  ep.hideAndBeSneaky = {
    phase1,
    phase2,
    phase3,
    phase4,
    phase5,
    immunityWinners,
    badges,
    spotAssignments,
    hidingQuality, // final values
    activePlayers,
  };
}
```

- [ ] **Step 5: Commit**

```bash
git add js/chal/hide-and-be-sneaky.js
git commit -m "feat(hide-seek): Phase 3 (betrayal), Phase 4 (escape), Phase 5 (showdown) + results"
```

---

### Task 4: Text Backlog

**Files:**
- Modify: `js/chal/hide-and-be-sneaky.js`

Adds the `_textHideAndBeSneaky` export.

- [ ] **Step 1: Add text backlog function**

Append to `js/chal/hide-and-be-sneaky.js`:

```javascript
// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════
export function _textHideAndBeSneaky(ep, ln, sec) {
  if (!ep.isHideAndBeSneaky || !ep.hideAndBeSneaky) return;
  const hs = ep.hideAndBeSneaky;

  sec('HIDE AND BE SNEAKY');
  ln(`${hs.activePlayers.length} players scattered across Wawanakwa Island as Chef Hatchet loaded his water cannon.`);

  // Notable hiding spots
  sec('The Hiding Phase');
  const spotEntries = Object.entries(hs.spotAssignments);
  // Highlight best and worst spots
  const sortedByQuality = [...hs.activePlayers].sort((a, b) => hs.phase1.initialQuality[b] - hs.phase1.initialQuality[a]);
  const best = sortedByQuality[0];
  const worst = sortedByQuality[sortedByQuality.length - 1];
  const bestPr = pronouns(best);
  const worstPr = pronouns(worst);
  ln(`${best} found an incredible hiding spot — ${hs.spotAssignments[best]?.name || 'somewhere clever'}. ${bestPr.Sub} was practically invisible.`);
  ln(`${worst}, on the other hand, hid ${hs.spotAssignments[worst]?.name ? 'at ' + hs.spotAssignments[worst].name : 'poorly'}. ${worstPr.Sub} wouldn't last long.`);
  // Stalker?
  const stalker = hs.activePlayers.find(p => hs.spotAssignments[p]?.id === 'stalker');
  if (stalker) {
    const stPr = pronouns(stalker);
    ln(`${stalker} went full Izzy — stalking Chef around the island, hiding behind ${stPr.obj} at every turn!`);
  }

  // Hunt highlights
  sec('The Hunt');
  const huntRounds = hs.phase2.rounds;
  if (huntRounds.length) {
    // First player found
    const firstFound = huntRounds.find(r => r.found);
    if (firstFound?.found) {
      ln(`${firstFound.found.name} was the first player found — discovered in round ${firstFound.num}.`);
    }
    // Key events (biggest quality swings)
    const bigEvents = huntRounds.flatMap(r => r.events).filter(e => e.delta && Math.abs(e.delta) >= 1.5);
    bigEvents.slice(0, 3).forEach(e => { if (e.text) ln(e.text); });
    // Escapes
    hs.phase2.escaped.forEach(({ name }) => {
      const pr = pronouns(name);
      ln(`${name} broke free and sprinted to home base — ${pr.sub} made it!`);
    });
  }

  // Betrayal
  if (hs.phase3.betrayals.length || hs.phase3.loyals.length) {
    sec('Betrayal and Loyalty');
    hs.phase3.betrayals.forEach(b => {
      const pr = pronouns(b.betrayer);
      const quality = b.intelQuality === 'high' ? 'with pinpoint accuracy' : b.intelQuality === 'medium' ? 'with a rough idea' : 'with bad info';
      ln(`${b.betrayer} ratted out ${b.target} to Chef ${quality}!${b.targetFound ? ` It worked — ${b.target} was found.` : ` But ${b.target} survived anyway.`}`);
    });
    if (hs.phase3.loyals.length) {
      ln(`${hs.phase3.loyals.join(', ')} refused to betray anyone — earning respect from the remaining hiders.`);
    }
  }

  // Chase / showdown
  if (hs.phase4.attempts.length || hs.phase5) {
    sec('The Chase');
    hs.phase4.attempts.filter(a => a.decision === 'run').forEach(a => {
      const lastBeat = a.beats[a.beats.length - 1];
      if (lastBeat) ln(lastBeat.text);
    });
    if (hs.phase5) {
      ln(`${hs.phase5.participants.length} players were flushed from hiding for the final showdown!`);
      const winner = hs.phase5.winner;
      const winBeats = hs.phase5.beats[winner];
      if (winBeats?.length) {
        const flashiest = winBeats.find(b => b.win && ['combat', 'window', 'last-stand'].includes(b.id)) || winBeats[winBeats.length - 1];
        if (flashiest) ln(flashiest.text);
      }
    }
  }

  // Results
  sec('Immunity Results');
  if (hs.immunityWinners.length === 1) {
    ln(`${hs.immunityWinners[0]} won immunity!`);
  } else if (hs.immunityWinners.length > 1) {
    ln(`${hs.immunityWinners.join(' and ')} both won immunity!`);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/hide-and-be-sneaky.js
git commit -m "feat(hide-seek): text backlog (_textHideAndBeSneaky)"
```

---

### Task 5: VP Screen — Night-Vision Surveillance Theme

**Files:**
- Modify: `js/chal/hide-and-be-sneaky.js`

Adds the `rpBuildHideAndBeSneaky` export with full night-vision surveillance VP.

- [ ] **Step 1: Add VP screen function**

Append to `js/chal/hide-and-be-sneaky.js`:

```javascript
// ══════════════════════════════════════════════════════════════
// VP SCREEN — NIGHT-VISION SURVEILLANCE THEME
// ══════════════════════════════════════════════════════════════

// Night-vision CSS (injected once)
const NV_STYLES = `
  .nv-page { background:#0a0f0a; color:#00ff41; font-family:'Courier New',monospace; position:relative; overflow:hidden; padding:24px; }
  .nv-page::before { content:''; position:absolute; top:0; left:0; right:0; bottom:0; background:repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.03) 2px, rgba(0,255,65,0.03) 4px); pointer-events:none; z-index:1; }
  .nv-header { display:flex; align-items:center; gap:8px; margin-bottom:20px; position:relative; z-index:2; }
  .nv-rec { display:inline-block; width:8px; height:8px; border-radius:50%; background:#f00; animation:nv-blink 1.5s infinite; }
  @keyframes nv-blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
  .nv-title { font-size:20px; font-weight:800; letter-spacing:4px; text-transform:uppercase; color:#00ff41; text-shadow:0 0 10px rgba(0,255,65,0.5); }
  .nv-subtitle { font-size:11px; color:#33ff66; letter-spacing:2px; text-transform:uppercase; opacity:0.7; }
  .nv-card { background:rgba(0,255,65,0.05); border:1px solid rgba(0,255,65,0.15); border-radius:6px; padding:10px 14px; margin-bottom:8px; position:relative; z-index:2; }
  .nv-status { display:inline-block; padding:2px 8px; border-radius:3px; font-size:10px; font-weight:700; letter-spacing:1px; }
  .nv-hidden { background:rgba(0,255,65,0.15); color:#00ff41; }
  .nv-found { background:rgba(255,100,50,0.2); color:#ff6432; }
  .nv-soaked { background:rgba(100,100,100,0.2); color:#666; }
  .nv-immune { background:rgba(255,215,0,0.2); color:#ffd700; }
  .nv-tracking { background:rgba(255,50,50,0.2); color:#f55; }
  .nv-loyal { background:rgba(0,200,100,0.2); color:#0c6; }
  .nv-delta-up { color:#00ff41; font-weight:700; }
  .nv-delta-down { color:#ff6432; font-weight:700; }
  .nv-sector { font-size:11px; font-weight:800; letter-spacing:3px; color:#33ff66; text-transform:uppercase; margin:20px 0 12px; border-top:1px solid rgba(0,255,65,0.15); padding-top:16px; }
  .nv-reveal-btn { background:rgba(0,255,65,0.1); border:1px solid rgba(0,255,65,0.3); color:#00ff41; padding:8px 20px; border-radius:4px; cursor:pointer; font-family:'Courier New',monospace; font-size:12px; letter-spacing:2px; text-transform:uppercase; margin:12px 0; }
  .nv-reveal-btn:hover { background:rgba(0,255,65,0.2); }
  .nv-sidebar { position:sticky; top:0; background:#0a0f0a; border:1px solid rgba(0,255,65,0.15); border-radius:6px; padding:12px; margin-bottom:16px; z-index:3; }
`;

export function rpBuildHideAndBeSneaky(ep) {
  const hs = ep.hideAndBeSneaky;
  if (!hs) return '';
  const stateKey = String(ep.num) + '_hideSeek';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };

  // Build all steps
  const steps = [];

  // Mission Briefing
  steps.push({
    type: 'briefing',
    html: `
      <div class="nv-card" style="text-align:center;max-width:500px;margin:0 auto 20px">
        <div style="font-size:36px;margin-bottom:8px">🔫</div>
        <div class="nv-title" style="font-size:16px;margin-bottom:8px">HIDE AND BE SNEAKY</div>
        <div style="font-size:12px;color:#33ff66;line-height:1.8">
          ${hs.activePlayers.length} operatives deployed. Chef Hatchet is armed and hunting.<br>
          <strong style="color:#00ff41">Stay hidden, escape to home base, or betray your allies.</strong><br>
          <span style="color:#ffd700">1-2 operatives will earn immunity.</span>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:16px">
        ${hs.activePlayers.map(n => rpPortrait(n, 'sm')).join('')}
      </div>
    `
  });

  // Phase 1: Deployment — each player's spot
  hs.activePlayers.forEach(name => {
    const spot = hs.spotAssignments[name];
    const q = hs.phase1.initialQuality[name];
    const qLabel = q >= 7 ? 'EXCELLENT' : q >= 5 ? 'GOOD' : q >= 3 ? 'FAIR' : 'POOR';
    const qColor = q >= 7 ? '#00ff41' : q >= 5 ? '#33ff66' : q >= 3 ? '#ffa500' : '#ff6432';
    const badge = hs.badges[name];
    const badgeTag = badge === 'hideSeekStalker' ? ' <span class="nv-status nv-tracking">STALKER</span>' : '';
    steps.push({
      type: 'deployment',
      html: `
        <div class="nv-card" style="display:flex;align-items:center;gap:12px">
          ${rpPortrait(name, 'sm')}
          <div style="flex:1">
            <div style="font-size:13px;color:#cdd9e5;font-weight:600">${name}${badgeTag}</div>
            <div style="font-size:11px;color:#33ff66;margin-top:2px">Location: ${spot?.name || 'unknown'}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:10px;color:${qColor};font-weight:700;letter-spacing:1px">${qLabel}</div>
            <div style="font-size:11px;color:#33ff66;opacity:0.7">${q.toFixed(1)}</div>
          </div>
        </div>
      `
    });
  });

  // Phase 2: Hunt Rounds
  hs.phase2.rounds.forEach(round => {
    let roundHtml = `<div class="nv-sector">SCANNING SECTOR ${round.num} &mdash; ${round.hiddenCount} OPERATIVES REMAIN</div>`;

    round.events.forEach(evt => {
      if (!evt.text) return;
      const delta = evt.delta || 0;
      const deltaTag = delta > 0 ? `<span class="nv-delta-up">+${delta.toFixed(1)}</span>` :
                        delta < 0 ? `<span class="nv-delta-down">${delta.toFixed(1)}</span>` : '';
      roundHtml += `
        <div class="nv-card" style="display:flex;align-items:center;gap:10px">
          <div style="flex:1;font-size:12px;color:#cdd9e5">${evt.text}</div>
          ${deltaTag ? `<div>${deltaTag}</div>` : ''}
        </div>`;
    });

    if (round.found) {
      const f = round.found;
      roundHtml += `
        <div class="nv-card" style="border-color:rgba(255,100,50,0.4);background:rgba(255,100,50,0.06);display:flex;align-items:center;gap:12px">
          ${rpPortrait(f.name, 'sm')}
          <div style="flex:1;font-size:12px;color:#cdd9e5">${f.name} was discovered by Chef!</div>
          <span class="nv-status nv-found">${f.escaped ? 'ESCAPED' : 'SOAKED'}</span>
        </div>`;
    }
    if (round.escaped) {
      const e = round.escaped;
      roundHtml += `
        <div class="nv-card" style="border-color:rgba(255,215,0,0.4);background:rgba(255,215,0,0.06);display:flex;align-items:center;gap:12px">
          ${rpPortrait(e.name, 'sm')}
          <div style="flex:1;font-size:12px;color:#ffd700;font-weight:600">${e.name} escaped to home base!</div>
          <span class="nv-status nv-immune">IMMUNE</span>
        </div>`;
    }

    steps.push({ type: 'hunt-round', html: roundHtml });
  });

  // Phase 3: Intel Report (betrayals)
  if (hs.phase3.betrayals.length || hs.phase3.loyals.length) {
    let intelHtml = `<div class="nv-sector">INTEL REPORT — LOYALTY ASSESSMENT</div>`;
    hs.phase3.betrayals.forEach(b => {
      intelHtml += `
        <div class="nv-card" style="border-color:rgba(255,50,50,0.3);display:flex;align-items:center;gap:12px">
          ${rpPortrait(b.betrayer, 'sm')}
          <div style="flex:1;font-size:12px;color:#cdd9e5">
            <strong>${b.betrayer}</strong> uploaded intel on <strong>${b.target}</strong>
            <div style="font-size:10px;color:#ff6432;margin-top:2px">Quality: ${b.intelQuality.toUpperCase()} &mdash; hiding penalty: -${b.penalty.toFixed(1)}</div>
          </div>
          <span class="nv-status nv-tracking">INTEL UPLOAD</span>
        </div>`;
    });
    hs.phase3.loyals.forEach(name => {
      intelHtml += `
        <div class="nv-card" style="border-color:rgba(0,200,100,0.3);display:flex;align-items:center;gap:12px">
          ${rpPortrait(name, 'sm')}
          <div style="flex:1;font-size:12px;color:#cdd9e5"><strong>${name}</strong> refused to betray anyone.</div>
          <span class="nv-status nv-loyal">SIGNAL REFUSED</span>
        </div>`;
    });
    steps.push({ type: 'intel', html: intelHtml });
  }

  // Phase 4: Perimeter Breach
  if (hs.phase4.attempts.length) {
    let breachHtml = `<div class="nv-sector">PERIMETER BREACH — FIGHT OR FLIGHT</div>`;
    hs.phase4.attempts.forEach(a => {
      const icon = a.decision === 'run' ? '🏃' : '🫣';
      const outcomeTag = a.success
        ? `<span class="nv-status ${a.decision === 'run' ? 'nv-immune' : 'nv-hidden'}">${a.decision === 'run' ? 'EXTRACTED' : 'STILL HIDDEN'}</span>`
        : `<span class="nv-status nv-soaked">COMPROMISED</span>`;
      let beatTexts = a.beats.map(b => `<div style="font-size:11px;color:#aaa;margin-top:4px;padding-left:12px;border-left:2px solid ${b.win ? 'rgba(0,255,65,0.3)' : 'rgba(255,100,50,0.3)'}">${b.text}</div>`).join('');
      breachHtml += `
        <div class="nv-card">
          <div style="display:flex;align-items:center;gap:12px">
            ${rpPortrait(a.name, 'sm')}
            <div style="flex:1">
              <div style="font-size:12px;color:#cdd9e5"><strong>${a.name}</strong> chose to ${a.decision === 'run' ? 'BREAK FOR HOME BASE' : 'STAY HIDDEN'} ${icon}</div>
            </div>
            ${outcomeTag}
          </div>
          ${beatTexts}
        </div>`;
    });
    steps.push({ type: 'breach', html: breachHtml });
  }

  // Phase 5: Final Pursuit (showdown)
  if (hs.phase5) {
    let pursuitHtml = `<div class="nv-sector">FINAL PURSUIT — ALL OPERATIVES FLUSHED</div>`;
    hs.phase5.ranking.forEach(({ name, score }, i) => {
      const beats = hs.phase5.beats[name] || [];
      const isWinner = name === hs.phase5.winner;
      const borderColor = isWinner ? 'rgba(255,215,0,0.4)' : 'rgba(0,255,65,0.15)';
      let beatTexts = beats.map(b => `<div style="font-size:11px;color:#aaa;margin-top:4px;padding-left:12px;border-left:2px solid ${b.win ? 'rgba(0,255,65,0.3)' : 'rgba(255,100,50,0.3)'}">${b.text}</div>`).join('');
      pursuitHtml += `
        <div class="nv-card" style="border-color:${borderColor}${isWinner ? ';background:rgba(255,215,0,0.04)' : ''}">
          <div style="display:flex;align-items:center;gap:12px">
            ${rpPortrait(name, 'sm')}
            <div style="flex:1">
              <div style="font-size:13px;color:#cdd9e5;font-weight:600">${name}</div>
              <div style="font-size:10px;color:#33ff66">Chase score: ${score.toFixed(1)}</div>
            </div>
            ${isWinner ? '<span class="nv-status nv-immune">OPERATIVE EXTRACTED</span>' : '<span class="nv-status nv-soaked">CAUGHT</span>'}
          </div>
          ${beatTexts}
        </div>`;
    });
    steps.push({ type: 'pursuit', html: pursuitHtml });
  }

  // Debrief
  let debriefHtml = `<div class="nv-sector">DEBRIEF — FINAL STATUS</div>`;
  debriefHtml += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">`;
  hs.activePlayers.forEach(name => {
    const isImmune = hs.immunityWinners.includes(name);
    const badge = hs.badges[name];
    const statusClass = isImmune ? 'nv-immune' : badge === 'hideSeekTracker' ? 'nv-tracking' : badge === 'hideSeekLoyal' ? 'nv-loyal' : 'nv-soaked';
    const statusText = isImmune ? 'IMMUNE' : badge === 'hideSeekTracker' ? 'TRACKER' : badge === 'hideSeekLoyal' ? 'LOYAL' : badge === 'hideSeekClutch' ? 'CLUTCH' : badge === 'hideSeekStalker' ? 'STALKER' : badge === 'hideSeekFlush' ? 'FLUSHED' : 'SOAKED';
    debriefHtml += `
      <div style="text-align:center;width:80px">
        ${rpPortrait(name, 'sm')}
        <span class="nv-status ${statusClass}" style="margin-top:4px;display:block;font-size:9px">${statusText}</span>
      </div>`;
  });
  debriefHtml += `</div>`;

  if (hs.immunityWinners.length) {
    debriefHtml += `<div class="nv-card" style="text-align:center;border-color:rgba(255,215,0,0.3);background:rgba(255,215,0,0.05)">
      <div style="font-size:14px;color:#ffd700;font-weight:700">${hs.immunityWinners.length === 1 ? hs.immunityWinners[0] + ' wins immunity!' : hs.immunityWinners.join(' and ') + ' win immunity!'}</div>
    </div>`;
  }
  steps.push({ type: 'debrief', html: debriefHtml });

  // ── Build final HTML with click-to-reveal ──
  const state = _tvState[stateKey];
  let html = `<style>${NV_STYLES}</style><div class="nv-page rp-page">
    <div class="nv-header">
      <span class="nv-rec"></span>
      <span style="font-size:10px;letter-spacing:2px;color:#33ff66">SURVEILLANCE FEED</span>
      <span style="margin-left:auto;font-size:10px;color:#33ff66;opacity:0.5">EP ${ep.num}</span>
    </div>`;

  steps.forEach((step, i) => {
    const visible = i <= state.idx;
    html += `<div id="hs-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">${step.html}</div>`;
  });

  // Reveal button
  if (state.idx < steps.length - 1) {
    html += `<button class="nv-reveal-btn" onclick="window._hsReveal('${stateKey}', ${steps.length})">▶ NEXT SCAN</button>`;
  }

  html += `</div>`;
  return html;
}

// Reveal handler (exposed on window by main.js)
export function _hsReveal(stateKey, totalSteps) {
  const state = _tvState[stateKey];
  if (!state) return;
  state.idx = Math.min(state.idx + 1, totalSteps - 1);
  // Show next step
  const el = document.getElementById(`hs-step-${stateKey}-${state.idx}`);
  if (el) el.style.display = '';
  // Rebuild VP to update button
  if (typeof buildVPScreens === 'function') {
    const currentScreen = window.vpCurrentScreen;
    buildVPScreens();
    // Restore screen position
    if (currentScreen !== undefined) {
      const screens = document.querySelectorAll('.vp-screen');
      for (let i = 0; i < screens.length; i++) {
        if (screens[i].dataset?.id?.includes('hide-seek')) {
          window.vpCurrentScreen = i;
          break;
        }
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/hide-and-be-sneaky.js
git commit -m "feat(hide-seek): VP screen with night-vision surveillance theme"
```

---

### Task 6: Integration — main.js, episode.js, twists.js

**Files:**
- Modify: `js/main.js` (lines 25, 174-193)
- Modify: `js/episode.js` (lines 22-38, 1941-1944, 2141)
- Modify: `js/twists.js` (lines 1279-1365)

Wires up the challenge module to the dispatch system.

- [ ] **Step 1: Add import in main.js**

After line 25 (`import * as slasherNightMod from './chal/slasher-night.js';`), add:

```javascript
import * as hideAndBeSneakyMod from './chal/hide-and-be-sneaky.js';
```

- [ ] **Step 2: Add to window.CHALLENGES in main.js**

In the `window.CHALLENGES` object (around line 191), add a new entry:

```javascript
  'hide-and-be-sneaky': { simulate: hideAndBeSneakyMod.simulateHideAndBeSneaky, rpBuild: hideAndBeSneakyMod.rpBuildHideAndBeSneaky, text: hideAndBeSneakyMod._textHideAndBeSneaky },
```

- [ ] **Step 3: Expose _hsReveal on window in main.js**

Find where other challenge UI functions are exposed on window (search for `_slReveal` or similar onclick handlers exposed). Add:

```javascript
window._hsReveal = hideAndBeSneakyMod._hsReveal;
```

- [ ] **Step 4: Add import in episode.js**

After the existing challenge imports (around line 38), add:

```javascript
import { simulateHideAndBeSneaky } from './chal/hide-and-be-sneaky.js';
```

- [ ] **Step 5: Add post-merge dispatch in episode.js**

In the post-merge challenge dispatch chain (after the `} else if (ep.isLuckyHunt) {` block around line 1944), add:

```javascript
  } else if (ep.isHideAndBeSneaky) {
    // ── HIDE AND BE SNEAKY: post-merge hide-and-seek manhunt ──
    simulateHideAndBeSneaky(ep);
    // immunityWinner and extraImmune already set by simulation
    if (!ep.tribalPlayers) {
      ep.tribalPlayers = gs.activePlayers.filter(p => p !== ep.immunityWinner && !(ep.extraImmune || []).includes(p) && p !== gs.exileDuelPlayer);
    }
```

- [ ] **Step 6: Add to updateChalRecord skip list in episode.js**

On line 2141, add `&& !ep.isHideAndBeSneaky` to the skip condition:

Find:
```javascript
&& !ep.isLuckyHunt) {
```
Replace with:
```javascript
&& !ep.isLuckyHunt && !ep.isHideAndBeSneaky) {
```

- [ ] **Step 7: Add twist registration in twists.js**

In the `applyTwist` function's engineType dispatch (after the `} else if (engineType === 'lucky-hunt') {` block), add:

```javascript
  } else if (engineType === 'hide-and-be-sneaky') {
    // Post-merge only, need at least 6 players
    if (!gs.isMerged) {
      const _hsMerging = gs.activePlayers.length <= (seasonConfig.mergeAt || 12);
      if (!_hsMerging) return;
    }
    if (gs.activePlayers.length < 6) return;
    ep.isHideAndBeSneaky = true;
```

- [ ] **Step 8: Commit**

```bash
git add js/main.js js/episode.js js/twists.js
git commit -m "feat(hide-seek): wire up challenge dispatch in main, episode, twists"
```

---

### Task 7: Integration — core.js, vp-screens.js, text-backlog.js, savestate.js, alliances.js

**Files:**
- Modify: `js/core.js` (TWIST_CATALOG)
- Modify: `js/vp-screens.js` (VP screen push)
- Modify: `js/text-backlog.js` (import + call)
- Modify: `js/savestate.js` (patchEpisodeHistory)
- Modify: `js/alliances.js` (computeHeat)

- [ ] **Step 1: Add to TWIST_CATALOG in core.js**

In the TWIST_CATALOG array (around line 77-155), add a new entry after the lucky-hunt entry:

```javascript
  { id:'hide-and-be-sneaky', emoji:'🔫', name:'Hide and Be Sneaky', category:'challenge', phase:'post-merge', desc:'Post-merge hide-and-seek. Chef hunts with a water gun. Stay hidden, escape to home base, or betray allies. 1-2 immunity winners. Betrayal mechanics, archetype-driven loyalty decisions.', engineType:'hide-and-be-sneaky', incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','brunch-of-disgustingness','lucky-hunt'] },
```

- [ ] **Step 2: Add VP screen push in vp-screens.js**

In the challenge VP dispatch chain (after the Lucky Hunt block, before the default `ep.challengeType` check), add:

```javascript
  } else if (ep.isHideAndBeSneaky && ep.hideAndBeSneaky) {
    vpScreens.push({ id:'hide-seek', label:'Hide and Be Sneaky', html: rpBuildHideAndBeSneaky(ep) });
```

Also add the import at the top of vp-screens.js (if needed — the rpBuild function is exposed via window through main.js, so check if other challenges import directly or use global). Based on the pattern, rpBuild functions are called as bare function names (globals via window). Confirm the function is exposed by main.js's namespace pattern. If `window.CHALLENGES['hide-and-be-sneaky'].rpBuild` is set, the function name `rpBuildHideAndBeSneaky` should be available as a global since main.js does `import * as hideAndBeSneakyMod`.

Actually, checking the pattern: vp-screens.js calls functions like `rpBuildLuckyHunt(ep)` as bare globals. These work because main.js imports the module with `import * as mod` and then the `window.CHALLENGES` object holds references. But the bare function name is NOT automatically on window — it needs to be explicitly exposed. Check if main.js has a pattern that exposes all exports.

Looking at the existing code, main.js uses `import * as modName` and the functions are called as bare names in vp-screens.js. This works because vp-screens.js also imports them directly. Let me add the import:

At the top of `js/vp-screens.js`, after existing challenge imports, add:

```javascript
import { rpBuildHideAndBeSneaky } from './chal/hide-and-be-sneaky.js';
```

- [ ] **Step 3: Add text backlog integration in text-backlog.js**

At the top of `js/text-backlog.js`, after existing challenge imports, add:

```javascript
import { _textHideAndBeSneaky } from './chal/hide-and-be-sneaky.js';
```

In the `generateSummaryText` function (around line 1920), add the call:

```javascript
_textHideAndBeSneaky(ep, ln, sec);
```

- [ ] **Step 4: Add savestate patching in savestate.js**

In `patchEpisodeHistory` (around line 128), add:

```javascript
  if (ep.isHideAndBeSneaky) h.isHideAndBeSneaky = true;
  if (!h.hideAndBeSneaky && ep.hideAndBeSneaky) h.hideAndBeSneaky = ep.hideAndBeSneaky;
```

- [ ] **Step 5: Add heat consumption in alliances.js**

In `computeHeat` (after the existing challenge heat checks, around line 290), add:

```javascript
  // Hide and Be Sneaky: betrayal heat — betrayed players target their betrayer
  if (gs._hideSeekHeat?.[name] && ((gs.episode || 0) + 1) < gs._hideSeekHeat[name].expiresEp) heat += gs._hideSeekHeat[name].amount;
```

Note: The heat shape in simulation stores `{ target: betrayer, amount, expiresEp }` keyed by victim name. The computeHeat receives the `name` of the player being evaluated for heat. So `gs._hideSeekHeat[name]` gets the heat entry where `name` is the victim, and `.target` is the betrayer. But in computeHeat, `name` is the person we're computing heat FOR (i.e., "should this person be targeted?"). We need the betrayer to accumulate heat — meaning the betrayer should be targeted. So we need to iterate:

```javascript
  // Hide and Be Sneaky: betrayal targets seek revenge on their betrayer
  if (gs._hideSeekHeat) {
    Object.entries(gs._hideSeekHeat).forEach(([victim, data]) => {
      if (data.target === name && tribalPlayers.includes(victim) && ((gs.episode || 0) + 1) < data.expiresEp) heat += data.amount;
    });
  }
```

This matches the Basic Straining heat pattern exactly.

- [ ] **Step 6: Add `isHideAndBeSneaky` to the vp-screens exclusion check**

In vp-screens.js, the final fallback check at line 10203 has conditions like `!ep.isSlasherNight && !ep.isTripleDogDare`. Add `!ep.isHideAndBeSneaky` to prevent the default challenge screen from showing:

Find:
```javascript
} else if (ep.challengeType && !ep.isFinale && !ep.isSlasherNight && !ep.isTripleDogDare && !ep.isPhobiaFactor) {
```
Add `&& !ep.isHideAndBeSneaky` before the closing `)`.

- [ ] **Step 7: Commit**

```bash
git add js/core.js js/vp-screens.js js/text-backlog.js js/savestate.js js/alliances.js
git commit -m "feat(hide-seek): integrate with core, VP, text, savestate, alliances"
```

---

### Task 8: Smoke Test in Browser

**Files:** none (testing only)

- [ ] **Step 1: Start a local server**

```bash
npx http-server . -p 8080 -c-1
```

Or simply open `simulator.html` in a browser (ES modules require a server or file:// with CORS relaxed).

- [ ] **Step 2: Configure a season with Hide and Be Sneaky**

1. Open simulator in browser
2. Go to Episode Format Designer
3. Add "Hide and Be Sneaky" twist to a post-merge episode
4. Run a full season simulation

- [ ] **Step 3: Verify challenge fires**

Check:
- [ ] Challenge triggers in post-merge episodes when configured
- [ ] 1-2 immunity winners produced
- [ ] No console errors during simulation
- [ ] VP screen renders with night-vision theme
- [ ] Click-to-reveal advances through all phases
- [ ] Text backlog includes Hide and Be Sneaky sections
- [ ] Save/load preserves challenge state
- [ ] Episode timeline shows "Hide and Be Sneaky" tag

- [ ] **Step 4: Fix any issues found during testing**

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix(hide-seek): smoke test fixes"
```

---

### Task 9: Update CLAUDE.md Challenge Tables

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add to Post-Merge challenge table**

In the `### Post-Merge` challenge twists table, add:

```markdown
| `hide-and-be-sneaky` | Hide and Be Sneaky | 5-phase: hide/hunt/betray/escape/showdown. Chef hunts with water gun. Archetype-driven betrayal, 3-4 events per hunt round with hiding quality bonuses/maluses. Cat-and-mouse showdown. 1-2 immunity winners. Night-vision surveillance VP. |
```

- [ ] **Step 2: Add heat variable to Core State**

In the `## Core State` section, add to the temporary heat list:

```markdown
`gs._hideSeekHeat` (`{ victim: { target, amount, expiresEp } }`)
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add Hide and Be Sneaky to CLAUDE.md challenge tables"
```
