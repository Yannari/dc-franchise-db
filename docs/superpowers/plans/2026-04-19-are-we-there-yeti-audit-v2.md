# Are We There Yeti — Audit V2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address all 20+ audit items across technical bugs, gameplay depth, drama, VP interactivity, and visual polish — in priority order.

**Architecture:** All changes target `js/chal/are-we-there-yeti.js` (2008 lines). Gameplay changes go in the phase functions (`_phaseDropOff`, `_phaseNavigation`, etc.) and orchestrator (`simulateAreWeThereYeti`). VP changes go in the `rpBuild*` functions. One new text constant block for Chef mid-challenge commentary. No new files — the challenge is already self-contained.

**Tech Stack:** Vanilla JS ES modules, CSS-in-JS via template literals, no build step.

**Priority Order:**
1. Technical bugs (break things if not fixed)
2. Drama improvements (weakest audit dimension at 6/10)
3. Gameplay depth (7/10 → 9/10)
4. VP interactivity (7/10 → 9/10)
5. VP visual polish (8/10 → 9/10)

**Key Rules (from CLAUDE.md):**
- Stats are ALWAYS proportional (`stat * factor`), never `if (stat >= X)` for gameplay
- Archetype behavior: villains scheme, nice NEVER scheme, neutrals need strategic≥6 AND loyalty≤4
- Every feature needs VP + text backlog
- Popularity changes for heroic/villain/coward moments
- `pronouns(name)` for all gendered text
- `romanticCompat(a, b)` before any romance events

---

## Chunk 1: Technical Bugs + Core Gameplay Fixes

### Task 1: Fix romance spark event filter (Bug #1)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js:1545-1546`

The romance spark check filters on `e.type === 'quicksand'` but events have `type: 'navEvent'` with `subtype: 'quicksand'`. Sparks never fire for navigation sub-events.

- [ ] **Step 1: Fix the filter**

At line 1545-1546, change:
```js
const sparkEvents = timeline.filter(e =>
    (e.type === 'quicksand' || e.type === 'partnerInjury') && e.players?.length >= 2);
```
To:
```js
const sparkEvents = timeline.filter(e =>
    ((e.subtype === 'quicksand' || e.subtype === 'partnerInjury') || 
     e.type === 'quicksand' || e.type === 'partnerInjury') && e.players?.length >= 2);
```

- [ ] **Step 2: Verify syntax**

Run: `node -e "try { new Function(require('fs').readFileSync('js/chal/are-we-there-yeti.js','utf8')); } catch(e) { console.log(e.message); }"`
Expected: `Cannot use import statement outside a module` (ES module — means no syntax errors)

- [ ] **Step 3: Commit**

```bash
git add js/chal/are-we-there-yeti.js
git commit -m "fix(yeti): romance spark filter checks subtype not just type"
```

---

### Task 2: Fix torchSnuffFx timing (Bug #2)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js:2176-2179`

The `setTimeout` fires during HTML string building (inside `rpBuildYetiVerdict`). The element won't exist when the timeout fires because `renderVPScreen()` hasn't run yet. Need to use `requestAnimationFrame` + querySelector after DOM insertion.

- [ ] **Step 1: Replace setTimeout with post-render approach**

At lines 2176-2179, the code is:
```js
      setTimeout(() => {
        const snuffEl = document.querySelector('#yeti-torch-snuff-' + ep.num + ' .torch-snuffed');
        if (snuffEl && typeof window.torchSnuffFx === 'function') window.torchSnuffFx(snuffEl);
      }, 600);
```

Replace with a pattern that fires after the VP renders. Add a global hook that runs when any yeti verdict screen is displayed. In the beat HTML generation, instead of setTimeout, register a post-render callback:

```js
      // Register post-render hook via global
      if (typeof window !== 'undefined') {
        window._yetiPostRender = () => {
          requestAnimationFrame(() => {
            const snuffEl = document.querySelector('#yeti-torch-snuff-' + ep.num + ' .torch-snuffed');
            if (snuffEl && typeof window.torchSnuffFx === 'function') window.torchSnuffFx(snuffEl);
          });
        };
      }
```

Then in the return HTML of `rpBuildYetiVerdict`, add an inline script trigger:
```html
<img src="" onerror="if(window._yetiPostRender){window._yetiPostRender();delete window._yetiPostRender;}" style="display:none">
```

This fires after the HTML is inserted into the DOM because the `onerror` runs after insertion.

- [ ] **Step 2: Verify syntax**
- [ ] **Step 3: Commit**

```bash
git commit -m "fix(yeti): torchSnuffFx fires after DOM insertion via onerror hook"
```

---

### Task 3: Bond-aware pair formation (Depth #1)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js:1454-1468`

Current pair formation is pure random shuffle. The audit calls this "a big miss for a pair-based challenge." Implement bond-aware pairing that considers bonds, rivalries, and showmances.

- [ ] **Step 1: Replace random shuffle with bond-aware algorithm**

Replace lines 1454-1468 with:
```js
  // ── PAIR FORMATION ── Bond-aware: maximize drama (mix rivals + allies, keep showmances together)
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
  
  // Second pass: pair rivals (highest negative bond pairs — forces drama)
  const unassigned = shuffled.filter(n => !assigned.has(n));
  const rivalPairs = [];
  for (let i = 0; i < unassigned.length; i++) {
    for (let j = i + 1; j < unassigned.length; j++) {
      const bond = getBond(unassigned[i], unassigned[j]);
      if (bond < -2) rivalPairs.push({ a: unassigned[i], b: unassigned[j], bond });
    }
  }
  rivalPairs.sort((a, b) => a.bond - b.bond); // Most negative first
  rivalPairs.forEach(({ a, b }) => {
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
```

- [ ] **Step 2: Add pair formation timeline events that mention WHY pairs were formed**

After pair formation, before `_phaseDropOff`:
```js
  // Pair assignment narrative — mention bond dynamics
  pairs.forEach(p => {
    if (p.members.length === 2) {
      const bond = getBond(p.members[0], p.members[1]);
      if (bond < -2) {
        timeline.push({ type: 'pairAssign', phase: 0, players: [...p.members],
          text: `Pair ${p.label}: ${p.members[0]} and ${p.members[1]}. They don't look happy about it.`,
          badgeText: 'RIVALS PAIRED', badgeClass: 'red' });
      } else if (gs.showmances?.some(sm => sm.players.includes(p.members[0]) && sm.players.includes(p.members[1]) && sm.phase !== 'broken-up')) {
        timeline.push({ type: 'pairAssign', phase: 0, players: [...p.members],
          text: `Pair ${p.label}: ${p.members[0]} and ${p.members[1]}. The lovebirds stick together.`,
          badgeText: '💕 COUPLE', badgeClass: 'pink' });
      }
    }
  });
```

- [ ] **Step 3: Verify and commit**

```bash
git commit -m "feat(yeti): bond-aware pair formation — showmances together, rivals paired"
```

---

### Task 4: Guaranteed food temptation (Drama #6)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js:1300-1318`

The iconic Owen moment currently fires at 35% for low-temperament players. It should ALWAYS happen to someone. Find the player with the lowest willpower (temperament * 0.4 + mental * 0.3 + strategic * 0.3) and guarantee the event for them.

- [ ] **Step 1: Refactor food temptation to guarantee one event**

Replace lines 1300-1318:
```js
  // Food temptation — guaranteed for weakest-willed player (the Owen moment)
  const willScores = activePlayers.map(n => {
    const s = pStats(n);
    return { name: n, will: s.temperament * 0.4 + s.mental * 0.3 + s.strategic * 0.3 + _noise(-1, 1) };
  }).sort((a, b) => a.will - b.will);
  
  const temptedPlayer = willScores[0].name;
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
  
  // Secondary temptation: 25% chance for another low-willpower player
  if (willScores.length > 1 && Math.random() < 0.25) {
    const second = willScores[1].name;
    const s2 = pStats(second);
    const resist2 = s2.mental * 0.1 + s2.strategic * 0.08 + _noise(-0.5, 0.5);
    if (resist2 > 0.8) {
      sprintScores[second] += 0.5; chefGrudge[second] -= 0.3;
      timeline.push({ type: 'foodTemptation', phase: 4, player: second, players: [second],
        text: _rp(SPRINT_TEXTS.foodTemptation.resist)(second, pronouns(second)),
        badgeText: 'RESISTED', badgeClass: 'green' });
    } else {
      sprintScores[second] -= 2.0; chefGrudge[second] += 2.0; popDelta(second, -1);
      const myPairLabel = pairs.find(p => p.members.includes(second))?.label;
      if (myPairLabel) firedEvents[myPairLabel].add('foodTemptation_' + second);
      timeline.push({ type: 'foodTemptation', phase: 4, player: second, players: [second],
        text: _rp(SPRINT_TEXTS.foodTemptation.fail)(second, pronouns(second)),
        badgeText: 'ATE CHEF\'S FOOD', badgeClass: 'red', grudgeType: 'foodTheft' });
    }
  }
```

- [ ] **Step 2: Verify and commit**

```bash
git commit -m "feat(yeti): guaranteed food temptation for weakest-willed player"
```

---

### Task 5: Chef mid-challenge commentary (Drama #2)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js` — add text pool + inject into phases 1, 2, 4

Chef is invisible during phases 1-4. Add 2-3 walkie-talkie interjections that also seed grudge. These inject into navigation, traps, and sprint phases.

- [ ] **Step 1: Add CHEF_INTERJECT text pools**

After the existing text pool constants (around line 345), add:
```js
const CHEF_INTERJECTS = {
  lost: [
    (name) => `Static crackles. Chef's voice: "I can see you from up here, ${name}. You're going the WRONG WAY."`,
    (name) => `The walkie buzzes. "That's not north, ${name}. That's embarrassing."`,
  ],
  slow: [
    (name) => `Chef radios in: "The other pair just passed the second checkpoint. Where are YOU, ${name}?"`,
    (pair) => `"Pair ${pair}, I've seen snails move faster. DOUBLE TIME."`,
  ],
  taunt: [
    () => `The walkie crackles with laughter. Just laughter. Then silence.`,
    () => `Chef's voice, almost bored: "At this rate, I'll eliminate ALL of you."`,
  ],
  grudge: [
    (name) => `Chef: "I saw what you did back there, ${name}. You think I wasn't watching? I'm ALWAYS watching."`,
  ],
};
```

- [ ] **Step 2: Inject one Chef interject into phase 1 (navigation)**

In `_phaseNavigation`, after the event loop ends, add:
```js
  // Chef walkie-talkie — targets the worst-performing pair
  const pairProgress = pairs.map(p => ({
    label: p.label,
    avg: p.members.reduce((s, n) => s + personalScores[n], 0) / p.members.length
  }));
  const worstPair = pairProgress.sort((a, b) => a.avg - b.avg)[0];
  const target = _rp(pairs.find(p => p.label === worstPair.label).members);
  chefGrudge[target] += 0.3;
  timeline.push({ type: 'chefInterject', phase: 1, player: target, players: [target],
    text: _rp(CHEF_INTERJECTS.lost)(target),
    badgeText: '📻 CHEF', badgeClass: 'grey', grudgeType: 'taunt', grudgeDelta: 0.3 });
```

- [ ] **Step 3: Inject one Chef interject into phase 2 (traps)**

In `_phaseTrapsTheft`, at the end:
```js
  // Chef taunts after theft events
  if (timeline.some(e => e.phase === 2 && (e.type === 'trap' || e.type === 'trapTriggered'))) {
    timeline.push({ type: 'chefInterject', phase: 2, players: activePlayers,
      text: _rp(CHEF_INTERJECTS.taunt)(),
      badgeText: '📻 CHEF', badgeClass: 'grey' });
  }
```

- [ ] **Step 4: Inject one Chef interject into phase 4 (sprint) — targets grudge leader**

In `_phaseSprint`, after food temptation:
```js
  // Chef notices the player he hates most
  const grudgeLeader = activePlayers.reduce((worst, n) => 
    !worst || chefGrudge[n] > chefGrudge[worst] ? n : worst, null);
  if (chefGrudge[grudgeLeader] > 1.5) {
    chefGrudge[grudgeLeader] += 0.5;
    timeline.push({ type: 'chefInterject', phase: 4, player: grudgeLeader, players: [grudgeLeader],
      text: _rp(CHEF_INTERJECTS.grudge)(grudgeLeader),
      badgeText: '📻 CHEF WATCHING', badgeClass: 'red', grudgeType: 'surveillance', grudgeDelta: 0.5 });
  }
```

- [ ] **Step 5: Verify and commit**

```bash
git commit -m "feat(yeti): Chef walkie-talkie interjections in phases 1/2/4"
```

---

### Task 6: Losing pair desperation arc (Drama #1)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js` — in `_phaseSprint`

The winning pair gets a climax. The losing pair gets nothing. Add a "realization + desperation" beat where the trailing pair knows they're behind and tries something risky.

- [ ] **Step 1: Add desperation mechanic after sprint scoring**

In `_phaseSprint`, after sprintScores are calculated but before the function ends, add:
```js
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
      // Trailing pair realizes they're losing
      const desperatePlayer = trailingPair.members.reduce((best, n) =>
        !best || pStats(n).boldness > pStats(best).boldness ? n : best, null);
      const pr = pronouns(desperatePlayer);
      const partner = trailingPair.members.find(n => n !== desperatePlayer) || desperatePlayer;
      
      // Desperation: bold shortcut attempt
      const boldRoll = pStats(desperatePlayer).boldness * 0.12 + pStats(desperatePlayer).physical * 0.08 + _noise(-1.5, 1.5);
      
      if (boldRoll > 1.2) {
        // Shortcut works — closes the gap
        sprintScores[desperatePlayer] += 2.0;
        sprintScores[partner] += 1.5;
        chefGrudge[desperatePlayer] -= 0.5;
        popDelta(desperatePlayer, 2);
        timeline.push({ type: 'desperationPlay', phase: 4, player: desperatePlayer, players: [...trailingPair.members],
          text: `${desperatePlayer} spots a gap in the treeline. "${pr.Sub}'s getting away! Come on!" ${pr.Sub} grabs ${partner} and crashes through the brush. Branches everywhere. But when they emerge — they're ahead. Barely.`,
          badgeText: 'CLUTCH SHORTCUT', badgeClass: 'gold' });
      } else if (boldRoll > 0.3) {
        // Partial — narrows gap but doesn't close it
        sprintScores[desperatePlayer] += 0.8;
        timeline.push({ type: 'desperationPlay', phase: 4, player: desperatePlayer, players: [...trailingPair.members],
          text: `${desperatePlayer} veers off the trail, looking for a shortcut. ${partner} hesitates, then follows. They don't gain ground — but they don't lose any either. It was worth the try.`,
          badgeText: 'RISKY MOVE', badgeClass: 'blue' });
      } else {
        // Backfires — makes it worse
        sprintScores[desperatePlayer] -= 1.0;
        sprintScores[partner] -= 0.5;
        chefGrudge[desperatePlayer] += 0.5;
        addBond(partner, desperatePlayer, -0.5);
        timeline.push({ type: 'desperationPlay', phase: 4, player: desperatePlayer, players: [...trailingPair.members],
          text: `${desperatePlayer} panics. "This way! I know a shortcut!" ${partner}: "That's a cliff." It was a cliff. They lose even more time.`,
          badgeText: 'BAD CALL', badgeClass: 'red', grudgeType: 'foolishness', grudgeDelta: 0.5 });
      }
    }
  }
```

- [ ] **Step 2: Verify and commit**

```bash
git commit -m "feat(yeti): losing pair desperation arc with shortcut gamble"
```

---

### Task 7: Sasquatchanakwa face reveal (Drama #5)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js` — in `_phaseOvernight` (phase 3)

The Sasquatch escalates but never has a full-description encounter card. Add a terrifying full-reveal moment when aggression is high enough.

- [ ] **Step 1: Add Sasquatch face reveal text pool**

Add to text constants:
```js
const SASQUATCH_REVEAL = [
  (name, pr) => `${name} hears breathing behind ${pr.obj}. Slowly, ${pr.sub} turns. It's there. Eight feet of matted brown fur. Arms like tree trunks. Teeth — too many teeth. And eyes. Orange. Burning. Intelligent. It tilts its head and looks at ${name} like it's deciding something. Then it's gone. Just rustling branches and the smell of pine and something worse.`,
  (name, pr) => `The branches part. ${name} sees it clearly for the first time. Sasquatchanakwa. It's real. It's enormous. The body is ape-like but the face — the face is almost human. Almost. It stares at ${name}. ${pr.Sub} can't move. Can't breathe. It raises one massive hand, points at ${name}, and disappears into the darkness.`,
  (name, pr) => `${name} freezes. Ten feet away, standing in a shaft of moonlight: Sasquatchanakwa. Not a shadow. Not a sound in the bushes. The actual creature. It's bigger than ${name} imagined. Its eyes catch the light — twin embers in a wall of dark fur. For three seconds, nobody moves. Then it turns, unhurried, and walks into the trees. ${name} doesn't sleep for the rest of the night.`,
];
```

- [ ] **Step 2: Inject face reveal into overnight when aggression ≥ 3**

In `_phaseOvernight`, after existing Sasquatch cave convergence events, add:
```js
  // Sasquatch full reveal — fires once when aggression is high enough
  if (sasquatch.aggression >= 3 && !firedEvents.sasquatchTypes.has('faceReveal')) {
    firedEvents.sasquatchTypes.add('faceReveal');
    // Target: the bravest player (stood ground earlier) OR the most scared (lowest boldness)
    const revealTarget = sasquatch.provokedBy && activePlayers.includes(sasquatch.provokedBy)
      ? sasquatch.provokedBy
      : activePlayers.reduce((worst, n) => !worst || pStats(n).boldness < pStats(worst).boldness ? n : worst, null);
    const pr = pronouns(revealTarget);
    
    timeline.push({ type: 'sasquatchReveal', phase: 3, player: revealTarget, players: [revealTarget],
      text: _rp(SASQUATCH_REVEAL)(revealTarget, pr),
      badgeText: '🐾 FACE TO FACE', badgeClass: 'red' });
    
    // Bond impact: nearby players bond through shared terror
    const nearby = activePlayers.filter(n => n !== revealTarget);
    if (nearby.length > 0) {
      const witness = _rp(nearby);
      addBond(revealTarget, witness, 1.0);
      timeline.push({ type: 'sharedTerror', phase: 3, players: [revealTarget, witness],
        text: `${witness} saw it too. Neither says a word. They just move closer to the fire.`,
        badgeText: 'SHARED TERROR', badgeClass: 'grey' });
    }
    
    popDelta(revealTarget, 2); // Horror survivor gets fan sympathy
    sasquatch.aggression += 1; // Escalates further
  }
```

- [ ] **Step 3: Verify and commit**

```bash
git commit -m "feat(yeti): Sasquatchanakwa face reveal encounter at high aggression"
```

---

## Chunk 2: Gameplay Depth + VP Interactivity

### Task 8: Cross-pair awareness in navigation (Depth #2)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js` — in `_phaseNavigation`

Navigation events play like two solo adventures. Add 1-2 "other pair awareness" moments where pairs hear/see each other.

- [ ] **Step 1: Add cross-pair awareness events**

After both pairs have their navigation events, add:
```js
  // Cross-pair awareness — pairs sense each other
  if (pairs.length >= 2) {
    const [pA, pB] = [pairs[0], pairs[1]];
    const scoreA = pA.members.reduce((s, n) => s + personalScores[n], 0) / pA.members.length;
    const scoreB = pB.members.reduce((s, n) => s + personalScores[n], 0) / pB.members.length;
    const leader = scoreA > scoreB ? pA : pB;
    const trailer = scoreA > scoreB ? pB : pA;
    
    const trailerPlayer = _rp(trailer.members);
    const leaderPlayer = _rp(leader.members);
    
    timeline.push({ type: 'crossPairAwareness', phase: 1, players: [trailerPlayer],
      text: `${trailerPlayer} freezes. Through the trees: voices. Pair ${leader.label}. They sound close. Too close. They're ahead.`,
      badgeText: 'OVERHEARD', badgeClass: 'blue' });
    
    // Trailing pair reacts — faster pace or panic
    const reactionRoll = pStats(trailerPlayer).temperament * 0.1 + _noise(-0.3, 0.3);
    if (reactionRoll > 0.5) {
      personalScores[trailerPlayer] += 0.3;
      timeline.push({ type: 'crossPairReaction', phase: 1, players: trailer.members,
        text: `"They're ahead of us." ${trailerPlayer} picks up the pace. The pair doubles their speed.`,
        badgeText: 'MOTIVATED', badgeClass: 'green' });
    } else {
      personalScores[trailerPlayer] -= 0.3;
      timeline.push({ type: 'crossPairReaction', phase: 1, players: trailer.members,
        text: `"We're already behind?" ${trailerPlayer}'s shoulders drop. Morale takes a hit.`,
        badgeText: 'DEMORALIZED', badgeClass: 'grey' });
    }
  }
```

- [ ] **Step 2: Verify and commit**

```bash
git commit -m "feat(yeti): cross-pair awareness events in navigation"
```

---

### Task 9: Enhanced supply loss consequences (Depth #3)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js` — in `_phaseNavigation` and `_phaseSprint`

Losing your map/compass currently only costs +0.8 in the sprint. It should cause extra wrong-turn events during navigation and larger sprint penalties.

- [ ] **Step 1: In navigation, check supply loss for wrong-turn events**

After the event loop in `_phaseNavigation`, for each pair that lost a supply during overnight:
```js
  // Supply loss consequences — if pair lost map, add a wrong-turn event
  pairs.forEach(pair => {
    if (!supplies[pair.label].map && eventsFired < targetEventCount + 1) {
      const lost = _rp(pair.members);
      personalScores[lost] -= 0.5;
      timeline.push({ type: 'wrongTurn', phase: 1, group: pair.label, player: lost, players: pair.members,
        text: `Without the map, ${pair.members.join(' and ')} take a wrong turn. They lose valuable time backtracking.`,
        badgeText: 'WRONG TURN', badgeClass: 'red' });
    }
    if (!supplies[pair.label].compass) {
      const lost = _rp(pair.members);
      personalScores[lost] -= 0.3;
      timeline.push({ type: 'disoriented', phase: 1, group: pair.label, player: lost, players: pair.members,
        text: `No compass. ${_rp(pair.members)} squints at the sun. "I think north is... that way?"`,
        badgeText: 'DISORIENTED', badgeClass: 'grey' });
    }
  });
```

Note: Supply theft happens in phase 3 (overnight), which is AFTER phase 1 (navigation). So this only fires if supplies were lost from a PREVIOUS episode's state. For within-episode supply theft, the effect already flows to sprint. This is fine for now — it means supply tracking becomes meaningful across the challenge's sprint phase with larger bonuses/penalties.

- [ ] **Step 2: Increase sprint supply bonuses/penalties**

In `_phaseSprint`, lines 1291-1293, increase impact:
```js
    if (supplies[myPair.label].map) sprint += 1.5;      // was 0.8
    if (supplies[myPair.label].compass) sprint += 1.0;   // was 0.5
    if (supplies[myPair.label].binoculars) sprint += 0.5; // unchanged
    // Penalty for missing critical supplies
    if (!supplies[myPair.label].map) sprint -= 1.0;
    if (!supplies[myPair.label].compass) sprint -= 0.5;
```

- [ ] **Step 3: Verify and commit**

```bash
git commit -m "feat(yeti): supply loss has larger sprint penalties and wrong-turn events"
```

---

### Task 10: Cave politics expansion (Depth #4)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js` — in `_phaseOvernight`

The cave forces all 4 into one space but only has one cross-pair event. Add "who sleeps closest to the fire" politics and information trading.

- [ ] **Step 1: Add fire-position politics and info trading**

In `_phaseOvernight`, after existing cross-pair events:
```js
  // ── Beat 4: Fire politics — who sleeps closest? ──
  const fireRanking = activePlayers.map(n => ({
    name: n,
    assertiveness: pStats(n).social * 0.1 + pStats(n).boldness * 0.1 + _noise(-0.5, 0.5)
  })).sort((a, b) => b.assertiveness - a.assertiveness);
  
  const fireKing = fireRanking[0].name;
  const fireOutcast = fireRanking[fireRanking.length - 1].name;
  
  if (fireKing !== fireOutcast) {
    addBond(fireOutcast, fireKing, -0.3);
    chefGrudge[fireOutcast] += 0.2; // Chef sees weakness
    timeline.push({ type: 'firePolitics', phase: 3, players: [fireKing, fireOutcast],
      text: `${fireKing} claims the spot closest to the fire. ${fireOutcast} ends up at the edge, shivering. Nobody objects.`,
      badgeText: 'FIRE POLITICS', badgeClass: 'grey' });
  }
  
  // ── Beat 5: Information trading ──
  // Players from different pairs share (or withhold) intel
  if (pairs.length >= 2) {
    const socialPlayer = activePlayers.reduce((best, n) =>
      !best || pStats(n).social > pStats(best).social ? n : best, null);
    const socialPair = pairs.find(p => p.members.includes(socialPlayer));
    const otherPair = pairs.find(p => p !== socialPair);
    
    if (otherPair) {
      const otherTarget = _rp(otherPair.members);
      const socialRoll = pStats(socialPlayer).social * 0.1 + pStats(socialPlayer).strategic * 0.05 + _noise(-0.5, 0.5);
      
      if (socialRoll > 0.8) {
        // Extracts info without giving any
        personalScores[socialPlayer] += 0.5;
        addBond(socialPlayer, otherTarget, 0.5); // Target thinks they bonded
        timeline.push({ type: 'intelTrade', phase: 3, players: [socialPlayer, otherTarget],
          text: `By the fire, ${socialPlayer} chats up ${otherTarget}. Friendly questions. Casual tone. By morning, ${socialPlayer} knows their route, their supply status, their plan. ${otherTarget} knows nothing they didn't already.`,
          badgeText: 'INTEL EXTRACTED', badgeClass: 'blue' });
      } else {
        // Mutual exchange
        addBond(socialPlayer, otherTarget, 0.8);
        timeline.push({ type: 'intelTrade', phase: 3, players: [socialPlayer, otherTarget],
          text: `${socialPlayer} and ${otherTarget} talk honestly by the fire. Tomorrow they're opponents again. Tonight, they're just cold.`,
          badgeText: 'SHARED INFO', badgeClass: 'green' });
      }
    }
  }
```

- [ ] **Step 2: Verify and commit**

```bash
git commit -m "feat(yeti): cave fire politics + cross-pair intel trading"
```

---

### Task 11: Persistent supply/grudge tracker in VP (Interactive #1)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js` — VP helper functions + all rpBuild* screens

Add a persistent header bar to all VP screens showing pair supplies and Chef's mood.

- [ ] **Step 1: Add _statusBar helper function**

After existing VP helpers (around line 1700):
```js
function _statusBar(yt, phase) {
  // Supply status per pair
  const supplyIcons = (s) => [
    s.map ? '📍' : '<s style="opacity:0.2">📍</s>',
    s.compass ? '🧭' : '<s style="opacity:0.2">🧭</s>',
    s.binoculars ? '🔭' : '<s style="opacity:0.2">🔭</s>',
  ].join('');
  
  const pairStatus = yt.pairs.map(p => 
    `<span style="margin-right:12px"><span style="font-weight:700;color:var(--amber);font-size:9px;letter-spacing:1px">PAIR ${p.label}</span> ${supplyIcons(yt.supplies[p.label])}</span>`
  ).join('');
  
  // Chef mood based on highest grudge so far
  const maxGrudge = Math.max(...Object.values(yt.chefGrudge));
  const mood = maxGrudge > 4 ? '😤 FURIOUS' : maxGrudge > 2 ? '😠 ANNOYED' : maxGrudge > 0.5 ? '😐 WATCHING' : '😶 NEUTRAL';
  const moodColor = maxGrudge > 4 ? '#f85149' : maxGrudge > 2 ? '#d29922' : '#8b949e';
  
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 12px;margin-bottom:12px;background:rgba(0,0,0,0.25);border-radius:6px;font-size:10px;position:relative;z-index:2;border:1px solid rgba(200,208,220,0.06)">
    <div>${pairStatus}</div>
    <div style="color:${moodColor};font-weight:700;letter-spacing:1px">CHEF: ${mood}</div>
  </div>`;
}
```

- [ ] **Step 2: Add _statusBar to all 6 VP screens**

In each `rpBuild*` function, after the title/sub elements, insert `${_statusBar(yt, N)}` where N is the phase number. For example in `rpBuildYetiDropOff`:
```js
    <div class="yeti-sub">Chef Hatchet takes command. Helicopter clearing. Twilight.</div>
    ${_statusBar(yt, 0)}
```

Repeat for all 6 screens (trail, traps, night, sprint, verdict).

- [ ] **Step 3: Verify and commit**

```bash
git commit -m "feat(yeti): persistent supply/grudge status bar across all VP screens"
```

---

### Task 12: False finish dramatic beat (Drama #4)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js` — in `_phaseSprint`

Add a "that's not the totem pole!" moment where one pair thinks they've arrived but hasn't.

- [ ] **Step 1: Add false finish event**

In `_phaseSprint`, after the shortcut events but before final scoring:
```js
  // False finish — one pair thinks they see the camp
  if (pairs.length >= 2 && Math.random() < 0.6) {
    const falseFinisher = _rp(pairs);
    const spotter = _rp(falseFinisher.members);
    const pr = pronouns(spotter);
    
    timeline.push({ type: 'falseFinish', phase: 4, player: spotter, players: [...falseFinisher.members],
      text: `"THERE! I see it!" ${spotter} sprints toward a shape in the clearing. ${pr.Sub} skids to a stop. It's a dead tree. Not the totem pole. Not even close. ${pr.Sub} stands there, chest heaving, while ${pr.pos} partner catches up.`,
      badgeText: 'FALSE FINISH', badgeClass: 'grey' });
    
    chefGrudge[spotter] += 0.3;
    popDelta(spotter, -1);
  }
```

- [ ] **Step 2: Verify and commit**

```bash
git commit -m "feat(yeti): false finish dramatic beat in sprint"
```

---

### Task 13: Partner carry dramatic choice (Drama #3)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js` — in `_phaseSprint`

If one partner is much stronger than the other, add a "carry or leave" decision with bond consequences.

- [ ] **Step 1: Add partner carry decision**

In `_phaseSprint`, after existing partnerCarry or tantrum logic:
```js
  // Partner carry decision — when one player is significantly stronger
  pairs.forEach(pair => {
    if (pair.members.length < 2) return;
    const [a, b] = pair.members;
    const gapAB = sprintScores[a] - sprintScores[b];
    const strongPlayer = gapAB > 2.0 ? a : gapAB < -2.0 ? b : null;
    if (!strongPlayer) return;
    
    const weakPlayer = strongPlayer === a ? b : a;
    const s = pStats(strongPlayer);
    const pr = pronouns(strongPlayer);
    
    // Decision based on loyalty + bond
    const carryRoll = s.loyalty * 0.1 + getBond(strongPlayer, weakPlayer) * 0.05 + _noise(-0.3, 0.3);
    
    if (carryRoll > 0.5) {
      // Carries partner — slows self but helps pair average
      sprintScores[strongPlayer] -= 0.8;
      sprintScores[weakPlayer] += 1.5;
      addBond(weakPlayer, strongPlayer, 1.5);
      chefGrudge[strongPlayer] -= 0.5;
      popDelta(strongPlayer, 2);
      timeline.push({ type: 'partnerCarry', phase: 4, players: [strongPlayer, weakPlayer],
        text: `${weakPlayer} stumbles. Can barely stand. ${strongPlayer} looks at the trail ahead, then back at ${pr.pos} partner. ${pr.Sub} turns around. "Get on my back." They're slower now. But they're together.`,
        badgeText: 'CARRIED', badgeClass: 'gold' });
    } else {
      // Leaves partner behind — faster but bond damage
      sprintScores[strongPlayer] += 0.5;
      addBond(weakPlayer, strongPlayer, -2.0);
      chefGrudge[strongPlayer] += 0.5;
      popDelta(strongPlayer, -2);
      timeline.push({ type: 'partnerAbandoned', phase: 4, players: [strongPlayer, weakPlayer],
        text: `${weakPlayer} calls out for help. ${strongPlayer} glances back. Keeps running. The gap widens.`,
        badgeText: 'ABANDONED', badgeClass: 'red', grudgeType: 'abandonment', grudgeDelta: 0.5 });
    }
  });
```

- [ ] **Step 2: Verify and commit**

```bash
git commit -m "feat(yeti): partner carry/abandon decision with bond consequences"
```

---

## Chunk 3: VP Visual Polish

### Task 14: Food temptation special visual treatment (Wow #3)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js` — in `_eventCard` and CSS

The food temptation is visually just another card. Give it a special "Chef's Kitchen" card style.

- [ ] **Step 1: Add food temptation CSS**

In YETI_STYLES:
```css
.yeti-card.food-temptation{background:linear-gradient(135deg,rgba(60,30,10,0.3),rgba(40,20,5,0.2));border-left-color:#d29922;box-shadow:0 0 20px rgba(210,153,34,0.08)}
.yeti-card.food-temptation::before{content:'🍗';position:absolute;top:8px;right:12px;font-size:20px;opacity:0.3}
```

- [ ] **Step 2: Update `_cardClass` to detect food temptation**

```js
  if (evt.type === 'foodTemptation') return 'food-temptation';
```

- [ ] **Step 3: Verify and commit**

```bash
git commit -m "feat(yeti): special visual treatment for food temptation card"
```

---

### Task 15: Chef interject card visual (Wow + matching Task 5)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js` — CSS + `_cardClass`

- [ ] **Step 1: Add Chef interject CSS**

```css
.yeti-card.chef-radio{background:rgba(20,15,10,0.4);border-left-color:#8b949e;border-left-style:dashed}
.yeti-card.chef-radio::before{content:'📻';position:absolute;top:8px;right:12px;font-size:16px;opacity:0.4}
```

- [ ] **Step 2: Update `_cardClass`**

```js
  if (evt.type === 'chefInterject') return 'chef-radio';
```

- [ ] **Step 3: Verify and commit**

```bash
git commit -m "feat(yeti): Chef walkie-talkie radio card visual"
```

---

### Task 16: Sasquatch reveal card visual (Wow + matching Task 7)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js` — CSS + `_cardClass`

- [ ] **Step 1: Add Sasquatch reveal CSS**

```css
.yeti-card.sasquatch-reveal{background:linear-gradient(180deg,rgba(30,10,0,0.4),rgba(15,5,0,0.3));border-left-color:#ff4d00;box-shadow:0 0 30px rgba(255,77,0,0.1);animation:yeti-card-in 0.3s ease-out,yeti-shake 0.6s 0.2s ease-out}
.yeti-card.sasquatch-reveal::before{content:'👁️';position:absolute;top:8px;right:12px;font-size:20px;opacity:0.5;animation:yeti-glow-pulse 2s infinite}
@keyframes yeti-glow-pulse{0%,100%{opacity:0.3}50%{opacity:0.7}}
```

- [ ] **Step 2: Update `_cardClass`**

```js
  if (evt.type === 'sasquatchReveal') return 'sasquatch-reveal';
```

- [ ] **Step 3: Verify and commit**

```bash
git commit -m "feat(yeti): Sasquatch face reveal card with glow pulse animation"
```

---

### Task 17: Desperation play card visual (matching Task 6)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js` — CSS + `_cardClass`

- [ ] **Step 1: Add desperation CSS and card class**

```css
.yeti-card.desperation{border-left-color:var(--amber);background:linear-gradient(90deg,rgba(212,133,10,0.06),transparent);animation:yeti-card-in 0.3s ease-out}
```

- [ ] **Step 2: Update `_cardClass`**

```js
  if (evt.type === 'desperationPlay') return 'desperation';
```

- [ ] **Step 3: Verify and commit**

```bash
git commit -m "feat(yeti): desperation play card visual"
```

---

### Task 18: _yetiStylesOnce duplicate injection cleanup (Tech #4)

**Files:**
- Modify: `js/chal/are-we-there-yeti.js` — `_yetiStylesOnce`

Currently injects the full `<style>` block on every screen. We previously found that DOM-check approaches race with innerHTML. Instead, use a simple module-level flag:

- [ ] **Step 1: Use module-level flag**

```js
let _stylesInjectedForRender = false;
function _yetiStylesOnce() {
  if (_stylesInjectedForRender) return '';
  _stylesInjectedForRender = true;
  // Reset flag after current task completes (next render cycle)
  setTimeout(() => { _stylesInjectedForRender = false; }, 0);
  return YETI_STYLES;
}
```

This ensures: within a single `buildVPScreens` call (synchronous), only the first screen gets styles. On next render, the flag resets.

- [ ] **Step 2: Verify and commit**

```bash
git commit -m "fix(yeti): inject styles once per render cycle via module flag"
```

---

### Task 19: Final verification + text backlog updates

**Files:**
- Modify: `js/chal/are-we-there-yeti.js` — `_textAreWeThereYeti`

Update the text backlog to include new event types.

- [ ] **Step 1: Add new event types to text backlog**

In `_textAreWeThereYeti`, add sections for:
- Chef interjections
- Desperation plays
- Sasquatch face reveal
- Partner carry/abandon
- False finish
- Fire politics
- Intel trading

```js
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
```

- [ ] **Step 2: Full syntax check**

Run: `node -e "try { new Function(require('fs').readFileSync('js/chal/are-we-there-yeti.js','utf8')); } catch(e) { console.log(e.message); }"`

- [ ] **Step 3: Commit all remaining changes**

```bash
git commit -m "feat(yeti): text backlog covers all new event types"
```

---

## Summary

| Task | Category | Audit Item | Priority |
|------|----------|------------|----------|
| 1 | Tech Bug | Romance spark filter wrong field | P0 |
| 2 | Tech Bug | torchSnuffFx timing | P0 |
| 3 | Depth | Bond-aware pair formation | P1 |
| 4 | Drama | Guaranteed food temptation | P1 |
| 5 | Drama | Chef mid-challenge commentary | P1 |
| 6 | Drama | Losing pair desperation arc | P1 |
| 7 | Drama | Sasquatch face reveal | P1 |
| 8 | Depth | Cross-pair navigation awareness | P2 |
| 9 | Depth | Enhanced supply consequences | P2 |
| 10 | Depth | Cave politics expansion | P2 |
| 11 | Interactive | Persistent supply/grudge tracker | P2 |
| 12 | Drama | False finish beat | P2 |
| 13 | Drama | Partner carry decision | P2 |
| 14 | Wow | Food temptation visual | P3 |
| 15 | Wow | Chef radio card visual | P3 |
| 16 | Wow | Sasquatch reveal card visual | P3 |
| 17 | Wow | Desperation card visual | P3 |
| 18 | Tech | Style injection cleanup | P3 |
| 19 | Polish | Text backlog updates | P3 |
