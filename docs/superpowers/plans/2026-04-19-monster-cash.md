# Monster Cash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Monster Cash twist challenge — a Godzilla/monster movie hunt where Chef's animatronic captures contestants round by round, with escalating threat levels, film lot events, and escalating capture animations. Works pre-merge (tribe immunity) and post-merge (individual, auto-elimination).

**Architecture:** Single challenge file `js/chal/monster-cash.js` containing simulation, text backlog, and VP builders. Integration touches: `js/core.js` (TWIST_CATALOG), `js/twists.js` (engine), `js/episode.js` (episode flow), `js/main.js` (imports/registry), `js/text-backlog.js` (dispatcher), `js/vp-screens.js` (VP registration), `js/run-ui.js` (timeline tag + elim count), `js/alliances.js` (heat), `simulator.html` (CSS).

**Tech Stack:** Vanilla JS ES modules, CSS keyframe animations, no build step.

**Spec:** `docs/superpowers/specs/2026-04-19-monster-cash-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `js/chal/monster-cash.js` | Create | All simulation, text backlog, VP builders, helpers |
| `js/core.js` | Modify | Add `monster-cash` to `TWIST_CATALOG` |
| `js/twists.js` | Modify | Add `monster-cash` engine branch in `applyTwist` |
| `js/episode.js` | Modify | Add pre-merge + post-merge episode flow branches, skip list |
| `js/main.js` | Modify | Import module, expose on window, add to challenge registry |
| `js/text-backlog.js` | Modify | Import + call `_textMonsterCash` in dispatcher |
| `js/vp-screens.js` | Modify | Import VP builders, register screens |
| `js/run-ui.js` | Modify | Add timeline tag + elim count |
| `js/alliances.js` | Modify | Wire `gs._monsterCashHeat` into `computeHeat` |
| `simulator.html` | Modify | Add Monster Cash CSS (animations, shell, theme) |

---

### Task 1: TWIST_CATALOG Entry + Twist Engine

**Files:**
- Modify: `js/core.js` (~line 122, after basic-straining entry)
- Modify: `js/twists.js` (~line 1412, after basic-straining branch)

- [ ] **Step 1: Add TWIST_CATALOG entry in `js/core.js`**

Find the line with `basic-straining` in the TWIST_CATALOG array (around line 122). Add the monster-cash entry after it:

```js
  { id:'monster-cash', emoji:'🦎', name:'Monster Cash', category:'challenge', phase:'any', desc:"Chef's animatronic monster prowls the film lot. Players are captured round by round as the monster escalates from clumsy to unstoppable. Last one standing wins. Pre-merge: tribe with best survival average wins immunity. Post-merge: lowest scorer auto-eliminated.", engineType:'monster-cash', incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','lucky-hunt','hide-and-be-sneaky','off-the-chain','brunch-of-disgustingness','wawanakwa-gone-wild','tri-armed-triathlon','camp-castaways','are-we-there-yeti'] },
```

- [ ] **Step 2: Add `monster-cash` to the incompatible lists of ALL other challenge twists**

Every existing challenge twist in TWIST_CATALOG that has an `incompatible` array must also include `'monster-cash'`. Find each of these entries and add `'monster-cash'` to their incompatible arrays:
- `sudden-death`, `slasher-night`, `triple-dog-dare`, `say-uncle`, `brunch-of-disgustingness`, `basic-straining`, `x-treme-torture`, `lucky-hunt`, `hide-and-be-sneaky`, `off-the-chain`, `wawanakwa-gone-wild`, `tri-armed-triathlon`, `camp-castaways`, `are-we-there-yeti`

And also add `'monster-cash'` to: `phobia-factor`, `cliff-dive`, `awake-a-thon`, `dodgebrawl`, `talent-show`, `sucky-outdoors`, `up-the-creek`, `paintball-hunt`, `hells-kitchen`, `trust-challenge`

- [ ] **Step 3: Add twist engine branch in `js/twists.js`**

Find the `basic-straining` branch (around line 1408). Add the monster-cash branch after it:

```js
  } else if (engineType === 'monster-cash') {
    // Both phases: pre-merge = tribe immunity, post-merge = individual auto-elimination
    if (!gs.isMerged && gs.tribes.length < 2) return;
    if (gs.activePlayers.length < 4) return;
    ep.isMonsterCash = true;
```

- [ ] **Step 4: Add twist narrative text in `js/twists.js`**

Find the slasher-night narrative case (around line 3950). Add a monster-cash case nearby:

```js
    case 'monster-cash': {
      const _mcAll = gs.activePlayers;
      sc.push({ text: 'A mechanical roar echoes across the film lot. Chef\'s animatronic monster is loose — and it\'s hunting.', players: _mcAll });
      if (gs.isMerged) {
        sc.push({ text: 'Survive round by round as the monster escalates. Last one standing wins immunity. The weakest performer is eliminated on the spot. No tribal council tonight.', players: [] });
      } else {
        sc.push({ text: 'All tribes scatter across the film lot. The tribe with the best survival average wins immunity. The losers go to tribal council.', players: [] });
      }
      break;
    }
```

- [ ] **Step 5: Commit**

```bash
git add js/core.js js/twists.js
git commit -m "feat(monster-cash): add TWIST_CATALOG entry + twist engine branch"
```

---

### Task 2: Simulation — Constants, Helpers, Event Pool

**Files:**
- Create: `js/chal/monster-cash.js`

- [ ] **Step 1: Create file with imports and constants**

```js
// ══════════════════════════════════════════════════════════════════════
// monster-cash.js — Monster Cash challenge (TDA S2E1)
// Chef's animatronic monster hunts contestants on a film lot.
// Pre-merge: tribe immunity. Post-merge: individual, auto-elimination.
// ══════════════════════════════════════════════════════════════════════
import { gs, seasonConfig, players } from '../core.js';
import { pStats, pronouns, romanticCompat } from '../players.js';
import { getBond, addBond } from '../bonds.js';
import { _checkShowmanceChalMoment } from '../romance.js';

// ── Threat Levels ──
const THREAT_LEVELS = [
  { level: 1, name: 'Awakening', baseCatch: 0.15, riskBonus: 3, hideMultiplier: 1 },
  { level: 2, name: 'Prowling',  baseCatch: 0.30, riskBonus: 1, hideMultiplier: 1 },
  { level: 3, name: 'Rampaging', baseCatch: 0.50, riskBonus: 0, hideMultiplier: 2 },
  { level: 4, name: 'Unstoppable', baseCatch: 0.70, riskBonus: 0, hideMultiplier: 2 },
  { level: 5, name: 'Final Form', baseCatch: 1.00, riskBonus: 0, hideMultiplier: 2 },
];

// ── Film Lot Locations ──
const LOCATIONS = [
  { id: 'stage-5',         name: 'Stage 5 — Monster Movie Set', sprintBonus: 0, hideBonus: 1, climbBonus: 1, pyroBonus: 0 },
  { id: 'back-lot',        name: 'Back Lot — Outdoor Streets',  sprintBonus: 2, hideBonus: -1, climbBonus: 0, pyroBonus: 0 },
  { id: 'prop-warehouse',  name: 'Prop Warehouse',              sprintBonus: -1, hideBonus: 2, climbBonus: 0, pyroBonus: 0 },
  { id: 'main-street',     name: 'Main Street Set',             sprintBonus: 0, hideBonus: 0, climbBonus: 0, pyroBonus: 2 },
  { id: 'craft-services',  name: 'Craft Services Tent',         sprintBonus: 0, hideBonus: 0, climbBonus: -1, pyroBonus: 0 },
  { id: 'parking-structure', name: 'Parking Structure',          sprintBonus: -1, hideBonus: 1, climbBonus: 2, pyroBonus: 0 },
];

// ── Positive Events ──
const POSITIVE_EVENTS = [
  { id: 'duck-behind-props', name: 'Duck Behind Prop Building', basePoints: 2, maxPoints: 3, stat: 'mental', type: 'hide' },
  { id: 'climb-scaffolding', name: 'Climb Set Scaffolding',     basePoints: 2, maxPoints: 4, stat: 'physical', stat2: 'endurance', type: 'risk' },
  { id: 'pyro-distraction',  name: 'Pyrotechnics Distraction',  basePoints: 3, maxPoints: 3, stat: 'boldness', type: 'risk' },
  { id: 'rally-survivors',   name: 'Rally Survivors',           basePoints: 2, maxPoints: 2, stat: 'social', type: 'social' },
  { id: 'read-pattern',      name: "Read Monster's Pattern",    basePoints: 3, maxPoints: 3, stat: 'strategic', stat2: 'intuition', type: 'hide' },
  { id: 'sprint-back-lot',   name: 'Sprint Through Back Lot',   basePoints: 2, maxPoints: 2, stat: 'physical', type: 'risk' },
  { id: 'guard-ally',        name: 'Guard an Ally',             basePoints: 2, maxPoints: 2, stat: 'loyalty', type: 'heroic', needsTarget: true },
  { id: 'sacrifice-cover',   name: 'Sacrifice Hiding Spot',     basePoints: 3, maxPoints: 3, stat: 'loyalty', type: 'heroic', needsTarget: true },
];

// ── Negative Events ──
const NEGATIVE_EVENTS = [
  { id: 'lure-monster',    name: 'Lure Monster Toward Rival',  points: -1, selfDamage: true, stat: 'strategic', stat2: 'boldness', type: 'sabotage', needsTarget: true, catchBoost: 0.2, heat: 1.5 },
  { id: 'trip-someone',    name: 'Trip Someone While Running', points: -2, selfDamage: false, stat: 'physical', type: 'sabotage', needsTarget: true, catchBoost: 0, heat: 1.5 },
  { id: 'use-decoy',       name: 'Use Someone as Decoy',       points: -1, selfDamage: true, stat: 'strategic', type: 'sabotage', needsTarget: true, catchBoost: 0.1, heat: 2.0 },
  { id: 'shove-from-cover', name: 'Shove Someone Out of Cover', points: -2, selfDamage: false, stat: 'physical', stat2: 'boldness', type: 'sabotage', needsTarget: true, catchBoost: 0.15, heat: 2.0 },
  { id: 'panic-freeze',    name: 'Panic Freeze',               points: -2, selfDamage: true, stat: 'temperament', type: 'self', invertStat: true },
  { id: 'debris-hit',      name: 'Knocked Over by Debris',     points: -1, selfDamage: true, type: 'luck' },
  { id: 'cover-destroyed', name: 'Monster Destroys Your Cover', points: -1, selfDamage: true, type: 'environment', minThreat: 4 },
];

// ── Monster Movie Titles ──
const FILM_TITLES = [
  'ATTACK OF THE 50-FOOT INTERN', 'MONSTER ISLAND MELTDOWN', 'THE CREATURE FROM STAGE 5',
  'GODZILLA VS THE CONTESTANTS', 'WHEN ANIMATRONICS ATTACK', 'REVENGE OF THE MECHANICAL BEAST',
  'TOTAL DRAMA: MONSTER MAYHEM', 'THE THING FROM THE PROP WAREHOUSE', 'DESTROY ALL CONTESTANTS',
  'ROBO-MONSTER UNLEASHED', 'ESCAPE FROM FILM LOT', 'THE LAST SURVIVOR',
];

// ── Chris Director Lines ──
const CHRIS_OPENERS = [
  "Lights! Camera! Destruction! Welcome to the most dangerous challenge yet!",
  "Today's challenge is brought to you by questionable safety standards and Chef's engineering skills!",
  "Hope everyone signed their waivers, because Chef's monster is OFF the leash!",
  "Welcome to the film lot! Today you're starring in a monster movie. The twist? The monster is REAL. Well, real-ish.",
];

const CHRIS_ROUND_LINES = [
  "The monster's getting angry! And by angry, I mean Chef just turned up the speed dial!",
  "Ooh, that's gonna leave a mark! On the set, I mean. That was expensive.",
  "Remember, the monster can't actually eat you! Probably.",
  "This is GREAT television! Destructive, terrifying, and someone might cry!",
  "Chef, easy on the hydraulics! That thing cost the network a fortune!",
  "The monster's learning! It's like Jurassic Park but with worse special effects!",
  "Anyone else smell smoke? No? Just me? Cool.",
  "And THAT is why we have insurance! We DO have insurance, right?",
];

const CHRIS_CLOSERS = [
  "And CUT! That's a wrap on the most destructive challenge in franchise history!",
  "Someone call the set department. And the fire department. And maybe a therapist.",
  "Chef, park the monster. And maybe don't leave the keys in it this time.",
];

const THREAT_NAMES = ['Awakening', 'Prowling', 'Rampaging', 'Unstoppable', 'Final Form'];
```

- [ ] **Step 2: Add archetype helpers and event selection**

Append to `js/chal/monster-cash.js`:

```js
// ── Helpers ──
function _pick(arr, seed) {
  const h = typeof seed === 'string' ? [...seed].reduce((a, c) => a + c.charCodeAt(0), 0) : (seed || 0);
  return arr[(h + Math.floor(Math.random() * arr.length)) % arr.length];
}

function _canSabotage(name) {
  const s = pStats(name);
  const arch = players.find(p => p.name === name)?.archetype || '';
  const villains = ['villain', 'mastermind', 'schemer'];
  const nice = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
  if (villains.includes(arch)) return true;
  if (nice.includes(arch)) return false;
  return s.strategic >= 6 && s.loyalty <= 4;
}

function _getThreatLevel(roundIndex, totalRounds) {
  const raw = Math.ceil((roundIndex + 1) / totalRounds * 5);
  return Math.min(5, Math.max(1, raw));
}

function _getThreatData(level) {
  return THREAT_LEVELS[Math.min(level, 5) - 1];
}

function _pickLocation(usedLocations) {
  const available = LOCATIONS.filter(l => !usedLocations.includes(l.id));
  if (available.length === 0) return LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  return available[Math.floor(Math.random() * available.length)];
}

function _selectEvents(name, survivors, threatLevel, location, roundFlags) {
  const s = pStats(name);
  const threat = _getThreatData(threatLevel);
  const canSab = _canSabotage(name);
  const events = [];
  const eventCount = 1 + (Math.random() < 0.4 ? 1 : 0); // 1-2 events

  // Build weighted pool
  const pool = [];

  // Positive events — always available
  for (const ev of POSITIVE_EVENTS) {
    if (ev.type === 'heroic' && s.loyalty < 5) continue;
    let weight = (s[ev.stat] || 5) * 0.5;
    if (ev.stat2) weight += (s[ev.stat2] || 5) * 0.3;
    // Location bonuses
    if (ev.id === 'sprint-back-lot') weight += location.sprintBonus;
    if (ev.id === 'duck-behind-props' || ev.id === 'read-pattern') weight += location.hideBonus;
    if (ev.id === 'climb-scaffolding') weight += location.climbBonus;
    if (ev.id === 'pyro-distraction') weight += location.pyroBonus;
    // Threat adjustments
    if (ev.type === 'hide') weight *= threat.hideMultiplier;
    if (ev.type === 'risk') weight += threat.riskBonus;
    // Heroic events weighted by loyalty and bonds
    if (ev.type === 'heroic') {
      const allies = survivors.filter(p => p !== name && getBond(name, p) >= 3);
      if (allies.length === 0) continue;
      weight += s.loyalty * 0.3;
    }
    pool.push({ ...ev, weight: Math.max(0.1, weight), negative: false });
  }

  // Negative events — conditional
  for (const ev of NEGATIVE_EVENTS) {
    if (ev.type === 'sabotage' && !canSab) continue;
    if (ev.minThreat && threatLevel < ev.minThreat) continue;
    let weight = 0;
    if (ev.type === 'sabotage') {
      const enemies = survivors.filter(p => p !== name && getBond(name, p) <= -2);
      if (enemies.length === 0 && Math.random() > 0.3) continue;
      weight = (s[ev.stat] || 5) * 0.3;
      if (ev.stat2) weight += (s[ev.stat2] || 5) * 0.2;
    } else if (ev.type === 'self') {
      // Panic — more likely with low temperament
      weight = ev.invertStat ? (10 - (s[ev.stat] || 5)) * 0.3 : (s[ev.stat] || 5) * 0.3;
      weight *= (threatLevel >= 4 ? 1.5 : 1); // more panic at high threat
    } else if (ev.type === 'luck') {
      weight = 0.8 + (threatLevel * 0.2);
    } else if (ev.type === 'environment') {
      weight = 1.0 + (threatLevel - 3) * 0.5;
    }
    pool.push({ ...ev, weight: Math.max(0.1, weight), negative: true });
  }

  // Weighted selection
  for (let i = 0; i < eventCount; i++) {
    if (pool.length === 0) break;
    const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
    let r = Math.random() * totalWeight;
    let chosen = pool[0];
    for (const e of pool) {
      r -= e.weight;
      if (r <= 0) { chosen = e; break; }
    }
    // Calculate points
    let pts;
    if (chosen.negative) {
      pts = chosen.points;
    } else {
      const statVal = s[chosen.stat] || 5;
      pts = chosen.basePoints + Math.floor((statVal / 10) * (chosen.maxPoints - chosen.basePoints));
    }

    // Target selection for targeted events
    let target = null;
    if (chosen.needsTarget) {
      if (chosen.type === 'sabotage') {
        const enemies = survivors.filter(p => p !== name && getBond(name, p) <= 0);
        const candidates = enemies.length ? enemies : survivors.filter(p => p !== name);
        target = candidates[Math.floor(Math.random() * candidates.length)] || null;
      } else if (chosen.type === 'heroic') {
        const allies = survivors.filter(p => p !== name && getBond(name, p) >= 2);
        const candidates = allies.length ? allies : survivors.filter(p => p !== name);
        target = candidates[Math.floor(Math.random() * candidates.length)] || null;
      }
    }

    events.push({
      id: chosen.id, name: chosen.name, points: pts, player: name,
      target, negative: chosen.negative, type: chosen.type,
      catchBoost: chosen.catchBoost || 0, heat: chosen.heat || 0,
    });

    // Remove chosen from pool to avoid duplicates
    const idx = pool.indexOf(chosen);
    if (idx !== -1) pool.splice(idx, 1);
  }

  return events;
}
```

- [ ] **Step 3: Commit**

```bash
git add js/chal/monster-cash.js
git commit -m "feat(monster-cash): add constants, event pool, and selection helpers"
```

---

### Task 3: Simulation — Main Loop + Capture Resolution

**Files:**
- Modify: `js/chal/monster-cash.js` (append)

- [ ] **Step 1: Add the main simulation function**

Append to `js/chal/monster-cash.js`:

```js
// ══════════════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════════════
export function simulateMonsterCash(ep) {
  const active = [...gs.activePlayers];
  const isMerged = gs.isMerged;
  const totalRounds = Math.max(3, active.length - 2); // leave 2 for final showdown (post) or finish (pre)
  const minSurvivors = isMerged ? 2 : 1; // post-merge: need 2 for showdown

  // Overdrive flavor
  const filmTitle = _pick(FILM_TITLES, ep.num + active.join(''));
  const chrisOpener = _pick(CHRIS_OPENERS, ep.num);
  const chrisCloser = _pick(CHRIS_CLOSERS, ep.num);

  const scores = {};
  active.forEach(p => { scores[p] = 0; });
  const capturedOrder = [];
  const rounds = [];
  const usedLocations = [];
  const monsterLevels = [];
  let survivors = [...active];
  const catchBoosts = {}; // accumulated catch boosts from sabotage
  active.forEach(p => { catchBoosts[p] = 0; });

  // Act breaks — first capture and when 3 remain
  const actBreaks = [];

  for (let r = 0; r < totalRounds && survivors.length > minSurvivors; r++) {
    const threatLevel = _getThreatLevel(r, totalRounds);
    const threat = _getThreatData(threatLevel);
    const location = _pickLocation(usedLocations);
    usedLocations.push(location.id);
    if (usedLocations.length >= LOCATIONS.length) usedLocations.length = 0;

    monsterLevels.push({ round: r + 1, level: threatLevel, name: THREAT_NAMES[threatLevel - 1] });

    // Event selection for each survivor
    const roundEvents = [];
    const roundFlags = {};
    for (const name of survivors) {
      const playerEvents = _selectEvents(name, survivors, threatLevel, location, roundFlags);
      roundEvents.push(...playerEvents);

      // Accumulate scores
      for (const ev of playerEvents) {
        if (ev.negative && !ev.selfDamage && ev.target) {
          scores[ev.target] = (scores[ev.target] || 0) + ev.points;
        } else {
          scores[name] = (scores[name] || 0) + ev.points;
        }
        // Catch boosts from sabotage
        if (ev.catchBoost && ev.target) {
          catchBoosts[ev.target] = (catchBoosts[ev.target] || 0) + ev.catchBoost;
        }
        // Heat tracking
        if (ev.heat && ev.target) {
          if (!gs._monsterCashHeat) gs._monsterCashHeat = {};
          gs._monsterCashHeat[ev.target] = { target: ev.target, amount: (gs._monsterCashHeat[ev.target]?.amount || 0) + ev.heat, expiresEp: (gs.episode || 0) + 3 };
        }
        // Heroic heat reduction
        if (ev.type === 'heroic' && ev.target) {
          const reduction = ev.id === 'sacrifice-cover' ? -1.5 : -1.0;
          if (gs._monsterCashHeat?.[name]) {
            gs._monsterCashHeat[name].amount = Math.max(0, gs._monsterCashHeat[name].amount + reduction);
          }
          // Bond boost
          addBond(name, ev.target, ev.id === 'sacrifice-cover' ? 2 : 1);
        }
        // Popularity
        if (!gs.popularity) gs.popularity = {};
        if (ev.type === 'heroic') {
          gs.popularity[name] = (gs.popularity[name] || 0) + (ev.id === 'sacrifice-cover' ? 2 : 1);
        } else if (ev.type === 'sabotage') {
          const delta = (ev.id === 'use-decoy' || ev.id === 'shove-from-cover') ? -2 : -1;
          gs.popularity[name] = (gs.popularity[name] || 0) + delta;
        }
      }
    }

    // Survival bonus
    for (const name of survivors) {
      scores[name] = (scores[name] || 0) + 2;
    }

    // Showmance moments
    if (seasonConfig.romance) {
      for (const sm of (gs.showmances || [])) {
        if (survivors.includes(sm.pair[0]) && survivors.includes(sm.pair[1])) {
          _checkShowmanceChalMoment(sm.pair[0], sm.pair[1], ep);
        }
      }
    }

    // ── Catch resolution ──
    let captured = null;
    let rescueAttempt = null;

    if (survivors.length > minSurvivors) {
      // Calculate catch scores (higher = more likely to be caught)
      const catchScores = {};
      for (const name of survivors) {
        const roundScore = roundEvents.filter(e => e.player === name && !e.negative).reduce((s, e) => s + e.points, 0);
        catchScores[name] = threat.baseCatch - (roundScore * 0.1) + (catchBoosts[name] || 0);
      }

      // Sort by catch score descending — highest catch score = most vulnerable
      const sorted = [...survivors].sort((a, b) => {
        if (catchScores[b] !== catchScores[a]) return catchScores[b] - catchScores[a];
        // Tiebreak: most negative events
        const aNeg = roundEvents.filter(e => e.player === a && e.negative).length;
        const bNeg = roundEvents.filter(e => e.player === b && e.negative).length;
        if (bNeg !== aNeg) return bNeg - aNeg;
        // Tiebreak: fewer positive events
        const aPos = roundEvents.filter(e => e.player === a && !e.negative).length;
        const bPos = roundEvents.filter(e => e.player === b && !e.negative).length;
        if (aPos !== bPos) return aPos - bPos;
        return Math.random() - 0.5;
      });

      captured = sorted[0];

      // Rescue attempt (disabled at threat 5)
      if (captured && threatLevel < 5) {
        const potentialRescuers = survivors.filter(p => {
          if (p === captured) return false;
          const s = pStats(p);
          return s.loyalty >= 7 && getBond(p, captured) >= 4;
        });
        if (potentialRescuers.length > 0) {
          const rescuer = potentialRescuers[Math.floor(Math.random() * potentialRescuers.length)];
          const rs = pStats(rescuer);
          const rescueChance = rs.loyalty * 0.1 + getBond(rescuer, captured) * 0.05;
          const success = Math.random() < rescueChance;
          rescueAttempt = { rescuer, target: captured, success };
          if (success) {
            scores[rescuer] = (scores[rescuer] || 0) - 2;
            addBond(rescuer, captured, 2);
            captured = null; // freed!
          }
        }
      }

      if (captured) {
        survivors = survivors.filter(p => p !== captured);
        capturedOrder.push(captured);
        catchBoosts[captured] = 0; // reset
      }
    }

    // Act break tracking
    if (capturedOrder.length === 1 && !actBreaks.includes('act1')) actBreaks.push(r);
    if (survivors.length === 3 && !actBreaks.some(a => typeof a === 'number' && a > 0)) actBreaks.push(r);

    const chrisLine = _pick(CHRIS_ROUND_LINES, r + ep.num);

    rounds.push({
      roundNum: r + 1,
      threatLevel,
      threatName: THREAT_NAMES[threatLevel - 1],
      location: location.name,
      locationId: location.id,
      events: roundEvents,
      captured,
      rescueAttempt,
      survivors: [...survivors],
      chrisLine,
    });
  }

  // ── Final showdown (post-merge only) ──
  let finalShowdown = null;
  let immunityWinner = null;
  if (isMerged && survivors.length === 2) {
    const [s1, s2] = survivors;
    const s1s = pStats(s1), s2s = pStats(s2);
    const s1Score = scores[s1] + (s1s.physical + s1s.mental + s1s.endurance) * 0.3 + Math.random() * 3;
    const s2Score = scores[s2] + (s2s.physical + s2s.mental + s2s.endurance) * 0.3 + Math.random() * 3;
    immunityWinner = s1Score >= s2Score ? s1 : s2;
    const methods = ['outlasted', 'outran', 'outsmarted', 'outmaneuvered'];
    finalShowdown = {
      survivor1: s1, survivor2: s2, winner: immunityWinner,
      method: `${immunityWinner} ${_pick(methods, immunityWinner)} ${immunityWinner === s1 ? s2 : s1} in the final showdown`,
    };
  } else if (isMerged && survivors.length === 1) {
    immunityWinner = survivors[0];
  } else if (!isMerged) {
    // Pre-merge: determine winning tribe by average capture round
    const tribeScores = {};
    for (const tribe of gs.tribes) {
      const members = tribe.members.filter(m => active.includes(m));
      if (members.length === 0) continue;
      let totalSurvival = 0;
      for (const m of members) {
        const capturedRound = capturedOrder.indexOf(m);
        totalSurvival += capturedRound === -1 ? rounds.length + 1 : capturedRound + 1;
      }
      tribeScores[tribe.name] = totalSurvival / members.length;
    }
    // Tribe with highest average wins
    const sortedTribes = Object.entries(tribeScores).sort(([,a],[,b]) => b - a);
    if (sortedTribes.length > 0) {
      const winnerTribe = gs.tribes.find(t => t.name === sortedTribes[0][0]);
      const loserTribe = gs.tribes.find(t => t.name === sortedTribes[sortedTribes.length - 1][0]);
      ep.winner = winnerTribe;
      ep.loser = loserTribe;
      ep.safeTribes = gs.tribes.filter(t => t !== loserTribe && t !== winnerTribe);
      ep.challengePlacements = sortedTribes.map(([name]) => {
        const t = gs.tribes.find(tr => tr.name === name);
        return { name, members: [...(t?.members || [])] };
      });
      ep.tribalPlayers = [...(loserTribe?.members || [])];
    }
    ep.challengeType = 'monster-cash';
    immunityWinner = null; // tribe immunity, no individual winner
  }

  // ── Determine eliminated (post-merge only) ──
  let eliminated = null;
  if (isMerged) {
    // Lowest scorer excluding immunity winner
    const candidates = active.filter(p => p !== immunityWinner);
    eliminated = candidates.sort((a, b) => (scores[a] || 0) - (scores[b] || 0))[0] || null;
    // Immunity winner popularity boost
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[immunityWinner] = (gs.popularity[immunityWinner] || 0) + 3;
  }

  // Build leaderboard
  const leaderboard = active.map(name => ({
    name, score: scores[name] || 0,
    capturedRound: capturedOrder.indexOf(name) === -1 ? null : capturedOrder.indexOf(name) + 1,
    events: rounds.flatMap(r => r.events.filter(e => e.player === name)),
  })).sort((a, b) => b.score - a.score);

  ep.monsterCash = {
    rounds, scores, capturedOrder, finalShowdown, immunityWinner, eliminated, leaderboard, monsterLevels,
    filmTitle, chrisOpener, chrisCloser, actBreaks, locations: rounds.map(r => r.location),
    tribeScores: !isMerged ? (() => { const ts = {}; for (const tribe of gs.tribes) { const members = tribe.members.filter(m => active.includes(m)); if (!members.length) continue; let total = 0; for (const m of members) { const ci = capturedOrder.indexOf(m); total += ci === -1 ? rounds.length + 1 : ci + 1; } ts[tribe.name] = total / members.length; } return ts; })() : null,
  };

  if (isMerged) {
    ep.immunityWinner = immunityWinner;
    ep.eliminated = eliminated;
    ep.challengeType = 'monster-cash';
    ep.noTribal = true;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/monster-cash.js
git commit -m "feat(monster-cash): add main simulation loop with capture resolution"
```

---

### Task 4: Text Backlog

**Files:**
- Modify: `js/chal/monster-cash.js` (append)
- Modify: `js/text-backlog.js` (import + dispatcher call)

- [ ] **Step 1: Add text backlog function to `js/chal/monster-cash.js`**

Append to `js/chal/monster-cash.js`:

```js
// ══════════════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════════════
export function _textMonsterCash(ep, ln, sec) {
  const mc = ep.monsterCash;
  if (!mc) return;
  sec('MONSTER CASH');

  ln(`Film Lot Challenge — ${mc.filmTitle}`);
  ln(`Monster Escalation: ${mc.monsterLevels.map(l => l.name).filter((v, i, a) => a.indexOf(v) === i).join(' → ')}`);
  ln(`Chris: "${mc.chrisOpener}"`);
  ln('');

  for (const round of mc.rounds) {
    ln(`ROUND ${round.roundNum} (Threat: ${round.threatName}) — ${round.location}`);
    // Top positive event
    const topPos = round.events.filter(e => !e.negative).sort((a, b) => b.points - a.points)[0];
    if (topPos) ln(`  ${topPos.player}: ${topPos.name} (+${topPos.points})`);
    // Sabotage events
    const sabs = round.events.filter(e => e.type === 'sabotage');
    sabs.forEach(s => ln(`  ${s.player} → ${s.target}: ${s.name} (${s.points})`));
    // Heroic events
    const heroic = round.events.filter(e => e.type === 'heroic');
    heroic.forEach(h => ln(`  ${h.player} → ${h.target}: ${h.name} (+${h.points})`));
    // Rescue attempt
    if (round.rescueAttempt) {
      const ra = round.rescueAttempt;
      ln(`  RESCUE: ${ra.rescuer} tried to save ${ra.target} — ${ra.success ? 'SUCCESS!' : 'FAILED'}`);
    }
    // Capture
    if (round.captured) ln(`  CAPTURED: ${round.captured}`);
    ln(`  Chris: "${round.chrisLine}"`);
    ln(`  Survivors: ${round.survivors.join(', ')}`);
    ln('');
  }

  if (mc.finalShowdown) {
    ln('FINAL SHOWDOWN:');
    ln(`  ${mc.finalShowdown.survivor1} vs ${mc.finalShowdown.survivor2}`);
    ln(`  ${mc.finalShowdown.method}`);
    ln('');
  }

  ln(`CAPTURE ORDER: ${mc.capturedOrder.join(' → ')}`);
  if (mc.immunityWinner) ln(`IMMUNITY: ${mc.immunityWinner}`);
  if (mc.eliminated) ln(`ELIMINATED: ${mc.eliminated} (score: ${(mc.scores[mc.eliminated] || 0).toFixed(1)})`);

  // Tribe scores (pre-merge)
  if (mc.tribeScores) {
    ln('');
    ln('TRIBE SCORES (avg survival round):');
    Object.entries(mc.tribeScores).sort(([,a],[,b]) => b - a).forEach(([name, score]) => {
      ln(`  ${name}: ${score.toFixed(1)}`);
    });
  }

  ln('');
  ln(`Chris: "${mc.chrisCloser}"`);
}
```

- [ ] **Step 2: Add import and dispatcher call in `js/text-backlog.js`**

Find the imports at the top of `js/text-backlog.js`. Near the existing slasher import (around line 23), add:

```js
import { _textMonsterCash } from './chal/monster-cash.js';
```

Find the dispatcher section where `_textSlasherNight` is called (around line 1991). Add nearby:

```js
  _textMonsterCash(ep, ln, sec);
```

- [ ] **Step 3: Commit**

```bash
git add js/chal/monster-cash.js js/text-backlog.js
git commit -m "feat(monster-cash): add text backlog function + dispatcher integration"
```

---

### Task 5: Episode Flow Integration

**Files:**
- Modify: `js/episode.js`

- [ ] **Step 1: Add import**

Find the imports at the top of `js/episode.js`. Near the slasher import (around line 38), add:

```js
import { simulateMonsterCash } from './chal/monster-cash.js';
```

- [ ] **Step 2: Add Monster Cash to the pre-merge challenge branch**

Find the basic-straining pre-merge branch (around line 1813):
```js
  } else if (ep.isBasicStraining && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
```

Add the Monster Cash pre-merge branch right before it:

```js
  } else if (ep.isMonsterCash && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateMonsterCash(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateMonsterCash
```

- [ ] **Step 3: Add Monster Cash to the post-merge auto-elimination branch**

Find the slasher-night post-merge block (around line 1368). Add a Monster Cash block after it (before the triple-dog-dare block):

```js
  // ── MONSTER CASH — round-by-round monster hunt, replaces immunity + tribal (post-merge) ──
  if (ep.isMonsterCash && gs.isMerged) {
    simulateJourney(ep); findAdvantages(ep);
    if (gs._scrambleActivations) ep._debugScramble = { ...gs._scrambleActivations };
    generateCampEvents(ep, 'pre');
    checkMoleSabotage(ep);
    updatePerceivedBonds(ep);

    simulateMonsterCash(ep);

    ep.eliminated = ep.monsterCash.eliminated;
    ep.immunityWinner = ep.monsterCash.immunityWinner;
    ep.challengeType = 'monster-cash';

    generateCampEvents(ep, 'post');

    // Handle elimination — with RI check
    if (ep.eliminated) {
      if (isRIStillActive()) {
        if (cfg.riFormat === 'rescue') {
          ep.riChoice = 'RESCUE ISLAND';
          gs.riPlayers.push(ep.eliminated);
          if (!gs.riArrivalEp) gs.riArrivalEp = {};
          gs.riArrivalEp[ep.eliminated] = epNum;
        } else {
          const _mcRiC = simulateRIChoice(ep.eliminated);
          ep.riChoice = _mcRiC;
          if (_mcRiC === 'REDEMPTION ISLAND') gs.riPlayers.push(ep.eliminated);
          else { gs.eliminated.push(ep.eliminated); if (gs.isMerged) gs.jury.push(ep.eliminated); }
        }
      } else {
        gs.eliminated.push(ep.eliminated);
        if (gs.isMerged) gs.jury.push(ep.eliminated);
      }
      gs.activePlayers = gs.activePlayers.filter(p => p !== ep.eliminated);
      gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p !== ep.eliminated)}));
      handleAdvantageInheritance(ep.eliminated, ep);
      gs.advantages = gs.advantages.filter(a => a.holder !== ep.eliminated);
    }

    ep.bondChanges = updateBonds([], ep.eliminated, []);
    detectBetrayals(ep);
    updatePlayerStates(ep); checkPerceivedBondTriggers(ep); decayAllianceTrust(ep.num); recoverBonds(ep);
    updateSurvival(ep);
    gs.episode = epNum;
    if (gs.activePlayers.length <= cfg.finaleSize) gs.phase = 'finale';

    gs.episodeHistory.push({
      num: epNum, eliminated: ep.eliminated || null, riChoice: ep.riChoice || null,
      immunityWinner: ep.immunityWinner || null,
      challengeType: 'monster-cash', isMerge: ep.isMerge,
      isMonsterCash: true,
      votes: {}, alliances: [],
      twists: (ep.twists || []).map(t => ({...t})),
      tribesAtStart: (ep.tribesAtStart || []).map(t => ({ name: t.name, members: [...t.members] })),
      campEvents: ep.campEvents || null,
      monsterCash: ep.monsterCash,
      journey: ep.journey || null,
      idolFinds: ep.idolFinds || [],
      bewareLostVotes: ep.bewareLostVotes || [],
      riDuel: ep.riDuel || null,
      riPlayersPreDuel: ep.riPlayersPreDuel || null,
      riLifeEvents: ep.riLifeEvents || [],
      riReentry: ep.riReentry || null,
      rescueIslandEvents: ep.rescueIslandEvents || [],
      rescueReturnChallenge: ep.rescueReturnChallenge || null,
      riArrival: ep.riArrival || null,
      riQuit: ep.riQuit || null,
      advantagesPreTribal: ep.advantagesPreTribal || null, summaryText: '', gsSnapshot: window.snapshotGameState()
    });
    const stMC = generateSummaryText(ep);
    gs.episodeHistory[gs.episodeHistory.length-1].summaryText = stMC; ep.summaryText = stMC;
    window.patchEpisodeHistory(ep); window.saveGameState(); return ep;
  }
```

- [ ] **Step 4: Add Monster Cash to skip lists**

Find the `updateChalRecord` skip list (around line 2406). Add `!ep.isMonsterCash &&` to the condition.

Find the exile skip line (around line 972) that checks `ep.isSlasherNight`. Add `|| ep.isMonsterCash` to that condition.

Find the `_hasTwistChallenge` variable (around line 1549). Add `|| ep.isMonsterCash` to it.

- [ ] **Step 5: Commit**

```bash
git add js/episode.js
git commit -m "feat(monster-cash): add episode flow integration (pre-merge + post-merge)"
```

---

### Task 6: Main Module Registration + Run UI

**Files:**
- Modify: `js/main.js`
- Modify: `js/run-ui.js`
- Modify: `js/alliances.js`

- [ ] **Step 1: Add import and window exposure in `js/main.js`**

Find the slasher import (around line 29). Add nearby:

```js
import * as monsterCashMod from './chal/monster-cash.js';
```

Find where `slasherNightMod` is in the module list exposure (around line 123). Add `monsterCashMod` to the same array.

Find the challenge registry (around line 202, where `'slasher-night'` is mapped). Add:

```js
  'monster-cash': { simulate: monsterCashMod.simulateMonsterCash, rpBuild: monsterCashMod.rpBuildMonsterCashTitleCard, text: monsterCashMod._textMonsterCash },
```

- [ ] **Step 2: Add timeline tag and elim count in `js/run-ui.js`**

Find the slasher timeline tag (around line 233). Add after it:

```js
    const monsterCashTag = ep.isMonsterCash ? `<span class="ep-hist-tag" style="background:rgba(76,175,80,0.15);color:#4caf50">Monster Cash</span>` : '';
```

Find where `slasherTag` is used in the HTML template nearby. Add `${monsterCashTag}` next to the other tags.

Find the elim count for slasher (around line 566). Add after it:

```js
    if (_allTypes.includes('monster-cash')) elims = Math.max(elims, 1);
```

- [ ] **Step 3: Wire heat into `computeHeat` in `js/alliances.js`**

Find where `gs._slasherHeat` is processed in `computeHeat`. Add a similar block for Monster Cash heat right after it:

```js
  // Monster Cash heat
  if (gs._monsterCashHeat) {
    for (const [victim, data] of Object.entries(gs._monsterCashHeat)) {
      if (data.expiresEp <= (gs.episode || 0)) { delete gs._monsterCashHeat[victim]; continue; }
      if (victim === voterName) continue;
      heat[victim] = (heat[victim] || 0) + (data.amount || 0);
    }
  }
```

- [ ] **Step 4: Commit**

```bash
git add js/main.js js/run-ui.js js/alliances.js
git commit -m "feat(monster-cash): add module registration, timeline tag, heat integration"
```

---

### Task 7: VP Screens — Shell + Title Card

**Files:**
- Modify: `js/chal/monster-cash.js` (append)
- Modify: `simulator.html` (add CSS)

- [ ] **Step 1: Add CSS to `simulator.html`**

Find the slasher CSS section (around line 82). Add the Monster Cash CSS block after it:

```css
    /* ── Monster Cash ── */
    .mc-shell { position:relative; background:#0a0a0a; border:2px solid #2d2d2d; border-radius:8px; overflow:hidden; min-height:400px; }
    .mc-cityscape { position:absolute; bottom:0; left:0; right:0; height:80px; background:linear-gradient(transparent, rgba(20,20,20,0.9)); pointer-events:none; z-index:1; }
    .mc-cityscape-svg { position:absolute; bottom:0; left:0; right:0; opacity:0.3; }
    .mc-monster-silhouette { position:absolute; top:10px; right:10px; opacity:0.08; font-size:80px; z-index:0; transition:opacity 0.5s, font-size 0.5s; }
    .mc-monster-silhouette.threat-3 { opacity:0.15; font-size:100px; }
    .mc-monster-silhouette.threat-4 { opacity:0.25; font-size:120px; }
    .mc-monster-silhouette.threat-5 { opacity:0.4; font-size:150px; top:0; }
    .mc-ticker { position:absolute; bottom:0; left:0; right:0; background:rgba(200,0,0,0.85); color:#fff; font-size:11px; font-family:'Courier New',monospace; padding:3px 0; z-index:2; overflow:hidden; white-space:nowrap; }
    .mc-ticker-text { display:inline-block; animation:mcTickerScroll 20s linear infinite; }
    @keyframes mcTickerScroll { 0% { transform:translateX(100%); } 100% { transform:translateX(-100%); } }
    .mc-rubble-pile { position:absolute; bottom:25px; right:10px; display:flex; flex-wrap:wrap; gap:2px; max-width:80px; z-index:2; }
    .mc-rubble-portrait { width:24px; height:24px; border-radius:50%; border:1px solid #555; opacity:0.6; filter:grayscale(1); position:relative; }
    .mc-rubble-portrait::after { content:'✕'; position:absolute; top:-2px; right:-2px; font-size:10px; color:#f44; }
    .mc-title-card { text-align:center; padding:40px 20px; position:relative; z-index:3; }
    .mc-film-title { font-size:28px; font-weight:900; color:#e8e8e8; text-transform:uppercase; letter-spacing:3px; text-shadow:0 0 20px rgba(255,60,60,0.5), 2px 2px 0 #333; font-family:'Impact','Arial Black',sans-serif; }
    .mc-now-playing { font-size:11px; color:#888; letter-spacing:4px; text-transform:uppercase; margin-bottom:8px; }
    .mc-film-grain { position:absolute; top:0; left:0; right:0; bottom:0; opacity:0.03; background:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); pointer-events:none; z-index:4; }
    .mc-threat-bar { display:flex; align-items:center; gap:6px; margin:8px 0; }
    .mc-threat-label { font-size:10px; color:#aaa; text-transform:uppercase; letter-spacing:1px; min-width:70px; }
    .mc-threat-fill { height:6px; border-radius:3px; transition:width 0.5s, background 0.5s; }
    .mc-threat-1 { width:20%; background:#4caf50; }
    .mc-threat-2 { width:40%; background:#ff9800; }
    .mc-threat-3 { width:60%; background:#ff5722; }
    .mc-threat-4 { width:80%; background:#f44336; }
    .mc-threat-5 { width:100%; background:#b71c1c; box-shadow:0 0 8px rgba(183,28,28,0.5); }
    .mc-location-header { font-size:12px; color:#ff9800; text-transform:uppercase; letter-spacing:2px; border-bottom:1px solid rgba(255,152,0,0.2); padding-bottom:4px; margin:12px 0 8px; }
    .mc-event-card { display:flex; align-items:center; gap:8px; padding:6px 8px; margin:4px 0; border-radius:6px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); }
    .mc-event-portrait { width:32px; height:32px; border-radius:50%; border:2px solid #444; }
    .mc-event-text { flex:1; font-size:12px; color:#ccc; }
    .mc-event-pts { font-size:11px; font-weight:700; padding:2px 6px; border-radius:4px; font-family:'Courier New',monospace; }
    .mc-pts-pos { color:#4caf50; background:rgba(76,175,80,0.12); }
    .mc-pts-neg { color:#f44336; background:rgba(244,67,54,0.12); }
    .mc-capture-card { border:2px solid rgba(244,67,54,0.4); background:rgba(244,67,54,0.08); padding:10px; border-radius:8px; margin:8px 0; text-align:center; }
    .mc-captured-label { font-size:14px; font-weight:900; color:#f44336; letter-spacing:3px; text-transform:uppercase; }
    .mc-survivors-count { font-size:13px; color:#ff9800; font-weight:700; text-align:center; margin:8px 0; }
    .mc-chris-line { font-size:11px; color:#888; font-style:italic; padding:4px 8px; border-left:2px solid #555; margin:6px 0; }
    /* Capture animations */
    @keyframes mcShakeLight { 0%,100% { transform:translateX(0); } 25% { transform:translateX(-2px); } 75% { transform:translateX(2px); } }
    @keyframes mcShakeMedium { 0%,100% { transform:translateX(0); } 20% { transform:translate(-4px,-2px); } 40% { transform:translate(3px,1px); } 60% { transform:translate(-3px,2px); } 80% { transform:translate(4px,-1px); } }
    @keyframes mcShakeHeavy { 0%,100% { transform:translate(0); } 10% { transform:translate(-6px,-3px); } 20% { transform:translate(5px,2px); } 30% { transform:translate(-4px,4px); } 40% { transform:translate(6px,-2px); } 50% { transform:translate(-5px,3px); } 60% { transform:translate(4px,-4px); } 70% { transform:translate(-3px,5px); } 80% { transform:translate(6px,-1px); } 90% { transform:translate(-2px,3px); } }
    .mc-capture-comedy { animation:mcShakeLight 0.4s ease-out; }
    .mc-capture-tense { animation:mcShakeMedium 0.5s ease-out; }
    .mc-capture-terror { animation:mcShakeHeavy 0.6s ease-out; }
    @keyframes mcStampWobble { 0% { transform:scale(3) rotate(-15deg); opacity:0; } 50% { transform:scale(1.2) rotate(5deg); opacity:1; } 100% { transform:scale(1) rotate(-2deg); opacity:1; } }
    .mc-stamp-comedy .mc-captured-label { animation:mcStampWobble 0.6s ease-out; }
    @keyframes mcCrack { 0% { clip-path:polygon(0 0, 100% 0, 100% 100%, 0 100%); } 100% { clip-path:polygon(0 0, 48% 0, 50% 45%, 52% 0, 100% 0, 100% 100%, 55% 100%, 50% 55%, 45% 100%, 0 100%); } }
    .mc-portrait-cracked { animation:mcCrack 0.3s ease-out forwards; }
    @keyframes mcShatter { 0% { transform:scale(1); opacity:1; filter:brightness(1); } 30% { transform:scale(1.1); filter:brightness(2); } 100% { transform:scale(0.8); opacity:0; filter:brightness(0.3); } }
    .mc-portrait-shatter { animation:mcShatter 0.8s ease-out forwards; }
    @keyframes mcShadowGrow { 0% { transform:scaleY(0); opacity:0; } 100% { transform:scaleY(1); opacity:0.6; } }
    .mc-shadow-overlay { position:absolute; bottom:0; left:0; right:0; height:100%; background:linear-gradient(transparent 30%, rgba(0,0,0,0.8)); animation:mcShadowGrow 1s ease-out forwards; pointer-events:none; }
    @keyframes mcRubbleFall { 0% { transform:translateY(-20px); opacity:0; } 100% { transform:translateY(0); opacity:0.4; } }
    .mc-rubble-particle { position:absolute; width:4px; height:4px; background:#666; border-radius:1px; animation:mcRubbleFall 0.8s ease-out forwards; }
    .mc-screen-crack { position:absolute; top:0; left:0; right:0; bottom:0; pointer-events:none; z-index:5; opacity:0; transition:opacity 0.3s; }
    .mc-screen-crack.active { opacity:1; }
    .mc-emergency-flash { position:absolute; top:0; left:0; right:0; bottom:0; background:rgba(255,0,0,0.1); pointer-events:none; z-index:3; animation:mcEmergencyPulse 2s ease-in-out infinite; }
    @keyframes mcEmergencyPulse { 0%,100% { opacity:0; } 50% { opacity:1; } }
    .mc-clapperboard { text-align:center; padding:12px; background:#1a1a1a; border:2px solid #333; margin:8px 0; border-radius:4px; font-family:'Courier New',monospace; font-size:11px; color:#aaa; letter-spacing:2px; text-transform:uppercase; }
    .mc-credits-scroll { max-height:300px; overflow-y:auto; text-align:center; }
    .mc-credit-line { font-size:12px; color:#888; margin:3px 0; }
    .mc-credit-name { color:#e8e8e8; font-weight:700; }
```

- [ ] **Step 2: Add VP shell helper and title card builder in `js/chal/monster-cash.js`**

Append to `js/chal/monster-cash.js`:

```js
// ══════════════════════════════════════════════════════════════════════
// VP SCREENS
// ══════════════════════════════════════════════════════════════════════

const _mcState = {};

function _mcPortrait(name, size = 32) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;border:2px solid #444;" onerror="this.style.display='none'">`;
}

function _mcShell(content, ep, threatLevel) {
  const mc = ep.monsterCash;
  const threatClass = `threat-${Math.min(threatLevel || 1, 5)}`;
  const tickerMessages = [
    'MONSTER SIGHTED IN SECTOR 7', 'ALL CONTESTANTS PROCEED TO SHELTER', 'THIS IS NOT A DRILL',
    'EVACUATION ROUTE BLOCKED', 'STRUCTURAL DAMAGE REPORTED ON STAGE 5', 'CHEF HAS LOST CONTROL OF THE ANIMATRONIC',
    'MONSTER HEADING TOWARD BACK LOT', 'EMERGENCY BROADCAST — STAY HIDDEN', 'PROP WAREHOUSE COMPROMISED',
  ];
  const ticker = tickerMessages.sort(() => Math.random() - 0.5).slice(0, 4).join('  ///  ');

  // Rubble pile of captured players
  const rubble = (mc?.capturedOrder || []).map(name =>
    `<div class="mc-rubble-portrait">${_mcPortrait(name, 24)}</div>`
  ).join('');

  return `
    <div class="mc-shell">
      <div class="mc-film-grain"></div>
      <div class="mc-monster-silhouette ${threatClass}">🦎</div>
      ${threatLevel >= 4 ? '<div class="mc-emergency-flash"></div>' : ''}
      <div style="position:relative;z-index:3;padding:16px;">
        ${content}
      </div>
      <div class="mc-rubble-pile">${rubble}</div>
      <div class="mc-ticker"><span class="mc-ticker-text">/// EMERGENCY BROADCAST /// ${ticker} ///</span></div>
      <div class="mc-screen-crack ${threatLevel >= 4 ? 'active' : ''}" style="background:url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><line x1="180" y1="0" x2="200" y2="200" stroke="rgba(255,255,255,0.15)" stroke-width="1"/><line x1="200" y1="200" x2="220" y2="400" stroke="rgba(255,255,255,0.1)" stroke-width="1"/><line x1="200" y1="200" x2="280" y2="300" stroke="rgba(255,255,255,0.08)" stroke-width="1"/></svg>`)}') center/cover no-repeat;"></div>
    </div>`;
}

function _mcThreatBar(level) {
  return `
    <div class="mc-threat-bar">
      <span class="mc-threat-label">Threat: ${THREAT_NAMES[level - 1]}</span>
      <div style="flex:1;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">
        <div class="mc-threat-fill mc-threat-${level}"></div>
      </div>
    </div>`;
}

export function rpBuildMonsterCashTitleCard(ep) {
  const mc = ep.monsterCash;
  if (!mc) return '';
  const content = `
    <div class="mc-title-card">
      <div class="mc-now-playing">▶ NOW PLAYING</div>
      <div class="mc-film-title">${mc.filmTitle}</div>
      <div style="margin:16px 0;font-size:12px;color:#666;">A Chris McLean Production</div>
      <div style="font-size:12px;color:#aaa;max-width:400px;margin:0 auto;">
        "${mc.chrisOpener}"
      </div>
      <div style="margin-top:20px;font-size:11px;color:#555;letter-spacing:1.5px;text-transform:uppercase;">
        ${mc.rounds.length} Rounds · ${gs.activePlayers.length + mc.capturedOrder.length} Contestants · 1 Monster
      </div>
    </div>`;
  return _mcShell(content, ep, 1);
}
```

- [ ] **Step 3: Commit**

```bash
git add js/chal/monster-cash.js simulator.html
git commit -m "feat(monster-cash): add CSS animations + VP shell + title card builder"
```

---

### Task 8: VP Screens — Rounds + Capture Animations

**Files:**
- Modify: `js/chal/monster-cash.js` (append)

- [ ] **Step 1: Add rounds VP builder with escalating capture animations**

Append to `js/chal/monster-cash.js`:

```js
function _mcBuildEventCard(ev) {
  const portrait = _mcPortrait(ev.player);
  const ptsClass = ev.negative ? 'mc-pts-neg' : 'mc-pts-pos';
  const ptsLabel = ev.negative ? `${ev.points}` : `+${ev.points}`;
  const targetText = ev.target ? ` → ${ev.target}` : '';
  return `
    <div class="mc-event-card">
      ${portrait}
      <div class="mc-event-text"><strong>${ev.player}</strong>${targetText}: ${ev.name}</div>
      <span class="mc-event-pts ${ptsClass}">${ptsLabel}</span>
    </div>`;
}

function _mcBuildCaptureCard(name, threatLevel) {
  const portrait = _mcPortrait(name, 48);
  const animClass = threatLevel <= 2 ? 'mc-stamp-comedy' : threatLevel === 3 ? '' : '';
  const portraitClass = threatLevel <= 2 ? '' : threatLevel === 3 ? 'mc-portrait-cracked' : 'mc-portrait-shatter';
  const shakeClass = threatLevel <= 2 ? 'mc-capture-comedy' : threatLevel <= 3 ? 'mc-capture-tense' : 'mc-capture-terror';

  let captureNarrative = '';
  if (threatLevel <= 2) {
    const comedic = [
      `The monster stumbled around a corner and bumped right into ${name}. Not exactly graceful.`,
      `${name} tried to hide behind a cardboard tree. The monster wasn't fooled.`,
      `The monster tripped over a cable, fell forward, and accidentally scooped up ${name}.`,
      `${name} was so busy watching the monster they backed into the bounce house themselves.`,
    ];
    captureNarrative = _pick(comedic, name);
  } else if (threatLevel === 3) {
    const tense = [
      `The monster's shadow crept over ${name}'s hiding spot. By the time they looked up, it was too late.`,
      `${name} ran. The monster was faster. The ground shook with every step closing in.`,
      `A wall collapsed beside ${name}. The monster reached through the rubble.`,
    ];
    captureNarrative = _pick(tense, name);
  } else {
    const terror = [
      `The monster tore through the set wall. ${name} had nowhere left to run. The claw came down.`,
      `Buildings crumbled. Sirens wailed. ${name} was lifted off the ground like a ragdoll.`,
      `The monster found ${name} in the last standing structure — and brought it down around them.`,
      `${name} made a final sprint. The monster's claw slammed down in front of them, cutting off every escape.`,
    ];
    captureNarrative = _pick(terror, name);
  }

  return `
    <div class="mc-capture-card ${shakeClass} ${animClass}" style="position:relative;overflow:hidden;">
      ${threatLevel >= 3 ? '<div class="mc-shadow-overlay"></div>' : ''}
      <div style="position:relative;z-index:1;">
        <div style="margin-bottom:8px;" class="${portraitClass}">${portrait}</div>
        <div class="mc-captured-label">⛌ CAPTURED</div>
        <div style="font-size:12px;color:#ccc;margin-top:6px;">${captureNarrative}</div>
      </div>
    </div>`;
}

function _mcBuildRound(round, ep) {
  let html = '';
  html += `<div class="mc-location-header">${round.location}</div>`;
  html += _mcThreatBar(round.threatLevel);

  // Events
  for (const ev of round.events) {
    html += _mcBuildEventCard(ev);
  }

  // Rescue attempt
  if (round.rescueAttempt) {
    const ra = round.rescueAttempt;
    const color = ra.success ? '#4caf50' : '#f44336';
    html += `
      <div class="mc-event-card" style="border-color:${color}40;background:${color}08;">
        ${_mcPortrait(ra.rescuer)}
        <div class="mc-event-text" style="color:${color};">
          <strong>${ra.rescuer}</strong> attempted to rescue <strong>${ra.target}</strong> — ${ra.success ? 'SUCCESS!' : 'The monster was too fast.'}
        </div>
      </div>`;
  }

  // Capture
  if (round.captured) {
    html += _mcBuildCaptureCard(round.captured, round.threatLevel);
  }

  // Survivor count
  html += `<div class="mc-survivors-count">${round.survivors.length} REMAIN</div>`;

  // Chris line
  html += `<div class="mc-chris-line">📢 ${round.chrisLine}</div>`;

  return html;
}

export function rpBuildMonsterCashRounds(ep) {
  const mc = ep.monsterCash;
  if (!mc) return '';

  // State for click-to-reveal
  if (!_mcState.roundIdx) _mcState.roundIdx = -1;

  let html = '<div class="mc-clapperboard">🎬 THE HUNT — CLICK TO REVEAL EACH ROUND</div>';

  for (let i = 0; i < mc.rounds.length; i++) {
    const round = mc.rounds[i];
    const isRevealed = i <= _mcState.roundIdx;
    const isActBreak = mc.actBreaks.includes(i) && i > 0;

    if (isActBreak) {
      html += `<div class="mc-clapperboard" style="margin-top:16px;">— ACT BREAK —</div>`;
    }

    html += `<div id="mc-round-${i}" style="display:${isRevealed ? 'block' : 'none'};">`;
    html += `<div style="font-size:11px;color:#666;margin-top:12px;letter-spacing:1px;">ROUND ${round.roundNum}</div>`;
    html += _mcBuildRound(round, ep);
    html += '</div>';
  }

  // Reveal button
  html += `<div id="mc-reveal-btn" style="text-align:center;margin-top:16px;">
    <button onclick="window.monsterCashRevealNext()" style="padding:8px 24px;background:#ff5722;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700;letter-spacing:1px;">
      NEXT ROUND ▶
    </button>
    <button onclick="window.monsterCashRevealAll()" style="padding:8px 16px;background:#333;color:#aaa;border:1px solid #555;border-radius:6px;cursor:pointer;margin-left:8px;font-size:11px;">
      Reveal All
    </button>
  </div>`;

  const maxThreat = mc.rounds.reduce((max, r) => Math.max(max, r.threatLevel), 1);
  return _mcShell(html, ep, maxThreat);
}

export function monsterCashRevealNext() {
  _mcState.roundIdx = (_mcState.roundIdx || -1) + 1;
  const el = document.getElementById(`mc-round-${_mcState.roundIdx}`);
  if (el) {
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  // Hide button when all revealed
  const mc = gs.episodeHistory[gs.episodeHistory.length - 1]?.monsterCash;
  if (mc && _mcState.roundIdx >= mc.rounds.length - 1) {
    const btn = document.getElementById('mc-reveal-btn');
    if (btn) btn.style.display = 'none';
  }
}

export function monsterCashRevealAll() {
  const mc = gs.episodeHistory[gs.episodeHistory.length - 1]?.monsterCash;
  if (!mc) return;
  for (let i = 0; i < mc.rounds.length; i++) {
    const el = document.getElementById(`mc-round-${i}`);
    if (el) el.style.display = 'block';
  }
  _mcState.roundIdx = mc.rounds.length - 1;
  const btn = document.getElementById('mc-reveal-btn');
  if (btn) btn.style.display = 'none';
}
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/monster-cash.js
git commit -m "feat(monster-cash): add rounds VP builder with escalating capture animations"
```

---

### Task 9: VP Screens — Showdown, Immunity, Elimination, Leaderboard

**Files:**
- Modify: `js/chal/monster-cash.js` (append)

- [ ] **Step 1: Add remaining VP builders**

Append to `js/chal/monster-cash.js`:

```js
export function rpBuildMonsterCashShowdown(ep) {
  const mc = ep.monsterCash;
  if (!mc?.finalShowdown) return '';

  const fs = mc.finalShowdown;
  const wp = pronouns(fs.winner);
  const lp = pronouns(fs.winner === fs.survivor1 ? fs.survivor2 : fs.survivor1);
  const loser = fs.winner === fs.survivor1 ? fs.survivor2 : fs.survivor1;

  const content = `
    <div style="text-align:center;padding:20px;">
      <div class="mc-clapperboard">🦎 FINAL SHOWDOWN</div>
      <div style="display:flex;justify-content:center;align-items:center;gap:20px;margin:20px 0;">
        <div style="text-align:center;">
          ${_mcPortrait(fs.survivor1, 64)}
          <div style="font-size:13px;color:#e8e8e8;margin-top:6px;font-weight:700;">${fs.survivor1}</div>
          <div style="font-size:11px;color:#888;">Score: ${(mc.scores[fs.survivor1] || 0).toFixed(1)}</div>
        </div>
        <div style="font-size:24px;color:#ff5722;font-weight:900;">VS</div>
        <div style="text-align:center;">
          ${_mcPortrait(fs.survivor2, 64)}
          <div style="font-size:13px;color:#e8e8e8;margin-top:6px;font-weight:700;">${fs.survivor2}</div>
          <div style="font-size:11px;color:#888;">Score: ${(mc.scores[fs.survivor2] || 0).toFixed(1)}</div>
        </div>
      </div>
      <div style="font-size:13px;color:#ccc;margin-top:12px;max-width:400px;margin-left:auto;margin-right:auto;">
        The monster bears down on the last two survivors. Only one can escape.
      </div>
      <div style="font-size:14px;color:#ff9800;margin-top:16px;font-weight:700;">
        ${fs.method}
      </div>
    </div>`;
  return _mcShell(content, ep, 5);
}

export function rpBuildMonsterCashImmunity(ep) {
  const mc = ep.monsterCash;
  if (!mc) return '';
  const winner = mc.immunityWinner;
  if (!winner) return '';

  const ws = pStats(winner);
  const wp = pronouns(winner);
  let flavorText = '';
  if (ws.physical >= 8) flavorText = `${winner} powered through the destruction like it was nothing. The monster couldn't keep up.`;
  else if (ws.mental >= 8) flavorText = `${winner} read every move the monster made. ${wp.Sub} was always two steps ahead.`;
  else if (ws.endurance >= 8) flavorText = `${winner} outlasted everyone. When the monster came, ${wp.sub} just kept running.`;
  else if (ws.strategic >= 8) flavorText = `${winner} played the film lot like a chess board. Every hiding spot, every escape route — calculated.`;
  else flavorText = `${winner} survived the monster's rampage. Sometimes that's all it takes.`;

  const content = `
    <div style="text-align:center;padding:30px;">
      <div style="font-size:11px;color:#4caf50;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">IMMUNITY WINNER</div>
      <div style="display:inline-block;position:relative;">
        ${_mcPortrait(winner, 80)}
        <div style="position:absolute;bottom:-4px;right:-4px;background:#4caf50;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:14px;">🛡️</div>
      </div>
      <div style="font-size:20px;color:#e8e8e8;font-weight:900;margin-top:12px;">${winner}</div>
      <div style="font-size:12px;color:#888;margin-top:4px;">Score: ${(mc.scores[winner] || 0).toFixed(1)}</div>
      <div style="font-size:13px;color:#aaa;margin-top:16px;max-width:400px;margin-left:auto;margin-right:auto;">
        ${flavorText}
      </div>
    </div>`;
  return _mcShell(content, ep, 1);
}

export function rpBuildMonsterCashElimination(ep) {
  const mc = ep.monsterCash;
  if (!mc?.eliminated) return '';

  const elim = mc.eliminated;
  const es = pStats(elim);
  const ep2 = pronouns(elim);
  const score = (mc.scores[elim] || 0).toFixed(1);
  const capturedRound = mc.capturedOrder.indexOf(elim);
  const capturedText = capturedRound !== -1 ? `Captured in round ${capturedRound + 1}` : 'Never captured, but scored lowest';

  const content = `
    <div style="text-align:center;padding:30px;">
      <div style="font-size:11px;color:#f44336;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">ELIMINATED</div>
      <div style="display:inline-block;position:relative;">
        <div class="mc-portrait-cracked">${_mcPortrait(elim, 80)}</div>
      </div>
      <div style="font-size:20px;color:#e8e8e8;font-weight:900;margin-top:12px;">${elim}</div>
      <div style="font-size:12px;color:#f44336;margin-top:4px;">Score: ${score} — ${capturedText}</div>
      <div style="font-size:13px;color:#aaa;margin-top:16px;max-width:400px;margin-left:auto;margin-right:auto;">
        ${elim} walks through the rubble of the destroyed film lot. The Walk of Shame has never looked this dramatic.
      </div>
    </div>`;
  return _mcShell(content, ep, 5);
}

export function rpBuildMonsterCashLeaderboard(ep) {
  const mc = ep.monsterCash;
  if (!mc) return '';

  let rows = '';
  mc.leaderboard.forEach((entry, i) => {
    const isWinner = entry.name === mc.immunityWinner;
    const isElim = entry.name === mc.eliminated;
    const capturedText = entry.capturedRound ? `Rd ${entry.capturedRound}` : '—';
    const statusIcon = isWinner ? '🛡️' : isElim ? '💀' : '';
    const rowColor = isWinner ? 'rgba(76,175,80,0.1)' : isElim ? 'rgba(244,67,54,0.1)' : 'transparent';

    rows += `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:${rowColor};border-radius:4px;margin:2px 0;">
        <span style="font-size:11px;color:#666;width:20px;text-align:right;">${i + 1}.</span>
        ${_mcPortrait(entry.name, 28)}
        <span style="flex:1;font-size:13px;color:#ccc;font-weight:${isWinner || isElim ? '700' : '400'};">${entry.name} ${statusIcon}</span>
        <span style="font-size:12px;color:#888;width:50px;text-align:center;">${capturedText}</span>
        <span style="font-size:12px;font-weight:700;color:${entry.score >= 0 ? '#4caf50' : '#f44336'};width:50px;text-align:right;">${entry.score.toFixed(1)}</span>
      </div>`;
  });

  // Tribe scores for pre-merge
  let tribeSection = '';
  if (mc.tribeScores) {
    tribeSection = `<div style="margin-top:16px;"><div class="mc-clapperboard">TRIBE SCORES</div>`;
    Object.entries(mc.tribeScores).sort(([,a],[,b]) => b - a).forEach(([name, score], i) => {
      const color = i === 0 ? '#4caf50' : '#f44336';
      tribeSection += `<div style="font-size:13px;color:${color};text-align:center;margin:4px 0;">${i === 0 ? '🏆' : '📛'} ${name}: ${score.toFixed(1)} avg</div>`;
    });
    tribeSection += '</div>';
  }

  const content = `
    <div style="padding:16px;">
      <div class="mc-clapperboard" style="margin-bottom:12px;">🎬 FINAL SCORES — CREDITS ROLL</div>
      <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;">
        <span style="width:20px;"></span>
        <span style="width:32px;"></span>
        <span style="flex:1;">Name</span>
        <span style="width:50px;text-align:center;">Caught</span>
        <span style="width:50px;text-align:right;">Score</span>
      </div>
      ${rows}
      ${tribeSection}
      <div style="text-align:center;margin-top:20px;font-size:11px;color:#555;font-style:italic;">
        "${mc.chrisCloser}"
      </div>
    </div>`;
  return _mcShell(content, ep, 1);
}
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/monster-cash.js
git commit -m "feat(monster-cash): add showdown, immunity, elimination, leaderboard VP screens"
```

---

### Task 10: VP Screen Registration

**Files:**
- Modify: `js/vp-screens.js`

- [ ] **Step 1: Add imports**

Find the slasher imports at the top of `js/vp-screens.js` (around line 12). Add nearby:

```js
import { rpBuildMonsterCashTitleCard, rpBuildMonsterCashRounds, rpBuildMonsterCashShowdown, rpBuildMonsterCashImmunity, rpBuildMonsterCashElimination, rpBuildMonsterCashLeaderboard, monsterCashRevealNext, monsterCashRevealAll } from './chal/monster-cash.js';
```

- [ ] **Step 2: Add VP screen registration**

Find the slasher VP screen registration block (around line 10558). Add a Monster Cash block after it:

```js
  // ── Monster Cash — monster movie hunt ──
  if (ep.isMonsterCash && ep.monsterCash) {
    vpScreens.push({ id:'mc-title', label:'🦎 Monster Cash', html: rpBuildMonsterCashTitleCard(ep) });
    vpScreens.push({ id:'mc-rounds', label:'The Hunt', html: rpBuildMonsterCashRounds(ep) });
    if (ep.monsterCash.finalShowdown) {
      vpScreens.push({ id:'mc-showdown', label:'Final Showdown', html: rpBuildMonsterCashShowdown(ep) });
    }
    if (ep.monsterCash.immunityWinner) {
      vpScreens.push({ id:'mc-immunity', label:'Immunity', html: rpBuildMonsterCashImmunity(ep) });
    }
    if (ep.monsterCash.eliminated) {
      vpScreens.push({ id:'mc-elimination', label:'Eliminated', html: rpBuildMonsterCashElimination(ep) });
    }
    vpScreens.push({ id:'mc-leaderboard', label:'Credits', html: rpBuildMonsterCashLeaderboard(ep) });
    // RI screens
    if (ep.riLifeEvents?.length || ep.riDuel) {
      const _mcRiLife = rpBuildRILife(ep);
      if (_mcRiLife) vpScreens.push({ id:'ri-life', label:'Redemption Island', html: _mcRiLife });
    }
    if (ep.riDuel) {
      const _mcRiDuel = rpBuildRIDuel(ep);
      if (_mcRiDuel) vpScreens.push({ id:'ri-duel', label:'RI Duel', html: _mcRiDuel });
    }
    if (ep.rescueIslandEvents?.length) {
      const _mcRescLife = rpBuildRescueIslandLife(ep);
      if (_mcRescLife) vpScreens.push({ id:'rescue-life', label:'Rescue Island', html: _mcRescLife });
    }
    const _mcRelHtml = rpBuildRelationships(ep);
    if (_mcRelHtml) vpScreens.push({ id:'relationships', label:'Relationships', html: _mcRelHtml });
    const _mcCampHtml = rpBuildCampOverview(ep);
    if (_mcCampHtml) vpScreens.push({ id:'camp-overview', label:'Camp', html: _mcCampHtml });
    return vpScreens;
  }
```

- [ ] **Step 3: Commit**

```bash
git add js/vp-screens.js
git commit -m "feat(monster-cash): register VP screens in buildVPScreens"
```

---

### Task 11: Manual Smoke Test

- [ ] **Step 1: Start dev server and load the simulator**

```bash
npx http-server . -p 8092 -c-1
```

Open `http://localhost:8092/simulator.html` in a browser. Hard refresh (Ctrl+Shift+R) to clear module cache.

- [ ] **Step 2: Test post-merge Monster Cash**

1. Click "S9 Cast" to load players
2. Go to Season Setup → Episode Format Designer
3. Add a twist: set an episode after merge to type `monster-cash`
4. Run episodes up to that episode
5. Verify:
   - Text backlog shows "=== MONSTER CASH ===" section with rounds, captures, scores
   - VP viewer shows title card, rounds with reveal, capture animations, showdown, immunity, elimination, leaderboard
   - Timeline tag shows "Monster Cash" label
   - Episode history records `isMonsterCash: true`
   - Player is auto-eliminated (no tribal council)

- [ ] **Step 3: Test pre-merge Monster Cash**

1. Reset season
2. Add a twist: set episode 2 to type `monster-cash`
3. Run episodes 1–2
4. Verify:
   - Tribe immunity is awarded (winning tribe based on avg survival)
   - Losing tribe goes to tribal council
   - Text backlog shows tribe scores
   - VP leaderboard shows tribe scores section

- [ ] **Step 4: Test edge cases**

- Run with sudden-death + monster-cash on same episode — verify they're incompatible (only one fires)
- Check that `gs._monsterCashHeat` is populated after sabotage events
- Verify popularity changes show in popularity tracking
- Check rescue mechanic works (may need to run multiple times)

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix(monster-cash): smoke test fixes"
```

---

### Task 12: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (project root)

- [ ] **Step 1: Add Monster Cash to the challenge twist tables**

Find the "Post-Merge" challenge twists table in CLAUDE.md. Add Monster Cash to the "Both Phases" table (since it works pre-merge and post-merge):

```markdown
| `monster-cash` | Monster Cash | Monster movie hunt. Chef's animatronic prowls the film lot. Monster escalates through 5 threat levels (Awakening→Final Form). Capture events, rescues, sabotage. Pre-merge: tribe immunity by avg survival. Post-merge: last standing wins, lowest scorer auto-eliminated. |
```

Find the `gs._` heat tracking list and add:

```markdown
`gs._monsterCashHeat` (`{ target, amount, expiresEp }`)
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add Monster Cash to CLAUDE.md challenge tables + heat tracking"
```
