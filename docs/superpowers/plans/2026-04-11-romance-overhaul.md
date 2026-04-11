# Romance System Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace instant showmance sparks with a slow-burn system (spark→intensity→first move→showmance), add challenge romance moments, villain sabotage weapon, romance toggle, and asexual orientation.

**Architecture:** New `gs.romanticSparks[]` state. Modify `_challengeRomanceSpark` to create sparks instead of showmances. New functions: `updateRomanticSparks(ep)`, `checkFirstMove(ep)`, `checkShowmanceSabotage(ep)`, `_checkShowmanceChalMoment(...)`. Romance toggle guards on all entry points. Asexual in `romanticCompat`.

**Tech Stack:** Pure JS in `simulator.html`. No external dependencies.

---

### Task 1: Asexual Orientation + Romance Toggle Config

**Files:**
- Modify: `simulator.html` — `romanticCompat` (line ~2226), season config UI, default config

- [ ] **Step 1: Add asexual to romanticCompat**

In `romanticCompat` (line 2226), inside the `attracted` function, add before the straight check:

```javascript
    if (sex === 'asexual') return false;
```

- [ ] **Step 2: Add romance toggle to season config**

Find `defaultConfig()` function and add `romance: 'enabled'` to the default config object.

Find the season config UI (search for the sexuality dropdown or cast builder settings area) and add a romance toggle dropdown: `enabled` / `disabled`.

- [ ] **Step 3: Add romance guards to all existing romance functions**

Add this line at the top of each function (after the opening `{`):

```javascript
  if (seasonConfig.romance === 'disabled') return;
```

Functions to guard:
- `checkShowmanceFormation(ep)` (line ~24074)
- `updateShowmancePhases(ep)` (line ~24139)
- `checkLoveTriangleFormation(ep)` (line ~24390)
- `updateLoveTrianglePhases(ep)` (line ~24585)
- `updateAffairExposure(ep)` (line ~24918)
- `_challengeRomanceSpark(a, b, ...)` (line ~9371) — add `if (seasonConfig.romance === 'disabled') return false;`

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: asexual orientation + romance toggle (enabled/disabled)"
```

---

### Task 2: Slow Burn Spark System (`gs.romanticSparks`)

**Files:**
- Modify: `simulator.html` — `_challengeRomanceSpark` (line ~9371), new `updateRomanticSparks(ep)`, modify `checkShowmanceFormation`

- [ ] **Step 1: Modify `_challengeRomanceSpark` to create sparks instead of showmances**

Replace the section in `_challengeRomanceSpark` that creates a `gs.showmances` entry (the `gs.showmances.push(...)` block) with:

```javascript
  // Create a romantic spark — not a showmance yet (slow burn)
  if (!gs.romanticSparks) gs.romanticSparks = [];
  // Don't duplicate sparks for the same pair
  if (gs.romanticSparks.some(sp => sp.players.includes(a) && sp.players.includes(b))) return false;
  
  gs.romanticSparks.push({
    players: [a, b],
    sparkEp: (gs.episode || 0) + 1,
    context: context,
    intensity: 0.3,
    fake: false,
    saboteur: null,
  });
```

Keep the bond boost, popularity, and event push — just change what gets created.

- [ ] **Step 2: Add `updateRomanticSparks(ep)` function**

Place after `_challengeRomanceSpark`. This runs each episode to grow/decay spark intensity:

```javascript
function updateRomanticSparks(ep) {
  if (seasonConfig.romance === 'disabled') return;
  if (!gs.romanticSparks) gs.romanticSparks = [];
  
  // Grow or decay each spark
  gs.romanticSparks.forEach(spark => {
    if (spark.fake) return; // fake sparks don't grow
    const [a, b] = spark.players;
    if (!gs.activePlayers.includes(a) || !gs.activePlayers.includes(b)) return;
    
    const bond = getBond(a, b);
    
    // Passive growth if bond above threshold
    const aArch = players.find(p => p.name === a)?.archetype || '';
    const bArch = players.find(p => p.name === b)?.archetype || '';
    const isShowmancer = aArch === 'showmancer' || bArch === 'showmancer';
    const bondThreshold = isShowmancer ? 3.0 : 4.0;
    if (bond > bondThreshold) spark.intensity += 0.1;
    
    // Bond grew this episode → boost
    // (Approximation: if bond is high, assume positive interactions happened)
    if (bond >= 3) spark.intensity += 0.05;
    
    // Negative decay: if bond dropped or they voted against each other
    if (bond < 2.0) spark.intensity -= 0.3;
    
    // Same tribe camp event boost (proportional to bond)
    const sameTribe = gs.tribes.some(t => t.members.includes(a) && t.members.includes(b));
    if (sameTribe && bond >= 3) spark.intensity += 0.1;
  });
  
  // Remove dead sparks (bond too low or intensity gone negative)
  gs.romanticSparks = gs.romanticSparks.filter(spark => {
    const [a, b] = spark.players;
    if (!gs.activePlayers.includes(a) || !gs.activePlayers.includes(b)) return false;
    if (getBond(a, b) < 2.0) return false;
    if (spark.intensity < 0) return false;
    return true;
  });
}
```

- [ ] **Step 3: Modify `checkShowmanceFormation` to use sparks**

In `checkShowmanceFormation` (line ~24074), after the `romanticCompat` check and before the bond threshold check, add:

```javascript
      // Spark bonus: if a romantic spark exists for this pair, lower the threshold
      const existingSpark = (gs.romanticSparks || []).find(sp => sp.players.includes(a) && sp.players.includes(b) && !sp.fake);
      const sparkBonus = existingSpark ? 1.5 : 0;
```

Then modify the threshold line to subtract the spark bonus:

```javascript
      const threshold = ((aIsShowmancer || bIsShowmancer) ? 5 : 6) - sparkBonus;
```

- [ ] **Step 4: Wire `updateRomanticSparks` into simulateEpisode**

Find line ~28281 (`checkShowmanceFormation(ep);`) and add before it:

```javascript
  updateRomanticSparks(ep);
```

- [ ] **Step 5: Add `gs.romanticSparks` to serialization**

Find `SET_FIELDS` or `prepGsForSave`/`repairGsSets` — `romanticSparks` is a plain array so it survives JSON. No special handling needed. But add it to `snapshotGameState()` if that function exists, so VP can see it.

- [ ] **Step 6: Commit**

```bash
git add simulator.html
git commit -m "feat: slow burn spark system — gs.romanticSparks with intensity growth"
```

---

### Task 3: First Move Events (`checkFirstMove`)

**Files:**
- Modify: `simulator.html` — new function after `updateRomanticSparks`

- [ ] **Step 1: Add the First Move function**

```javascript
function checkFirstMove(ep) {
  if (seasonConfig.romance === 'disabled') return;
  if (!gs.romanticSparks?.length) return;
  
  const FIRST_MOVE_THRESHOLDS = {
    'showmancer': 0.5, 'chaos-agent': 0.6, 'villain': 0.8, 'schemer': 0.8,
    'mastermind': 0.8, 'hero': 1.0, 'loyal': 1.2, 'loyal-soldier': 1.2,
    'protector': 1.2, 'social-butterfly': 0.7, 'wildcard': 0.7, '_default': 0.8,
  };
  
  const FIRST_MOVE_TEXTS = {
    'showmancer': [
      (a, b, pr) => `${a} doesn't hesitate. Crosses the distance. Kisses ${b}. The tribe goes dead silent — then erupts.`,
      (a, b, pr) => `${a} takes ${b}'s face in ${pr.posAdj} hands. No words needed. The first kiss lands and the game changes.`,
      (a, b, pr) => `It's been building for days. ${a} finally goes for it. ${b} doesn't pull away. The tribe watches, stunned.`,
    ],
    'chaos-agent': [
      (a, b, pr) => `Mid-argument. ${a} grabs ${b} and kisses ${pr.obj}. Everyone stares. ${a} shrugs. "What? It was obvious."`,
      (a, b, pr) => `${a} kisses ${b} during the challenge. In front of everyone. At the worst possible moment. Nobody saw it coming.`,
      (a, b, pr) => `${a} interrupts ${b} mid-sentence with a kiss. The timing is insane. The tribe doesn't know whether to cheer or cringe.`,
    ],
    'villain': [
      (a, b, pr) => `What started as strategy is on ${a}'s face now — something ${pr.sub} didn't plan. The way ${pr.sub} ${pr.sub === 'they' ? 'look' : 'looks'} at ${b} isn't calculated anymore.`,
      (a, b, pr) => `${a} leans in close to whisper something strategic. Stops. The gap between them disappears. This wasn't the plan.`,
      (a, b, pr) => `${a} was playing ${b}. Everyone knows it. The problem is, somewhere along the way, ${a} stopped pretending.`,
    ],
    'hero': [
      (a, b, pr) => `${a} pulls ${b} out of harm's way. They're close. Too close. ${a}: "I couldn't let anything happen to you." Neither of them moves.`,
      (a, b, pr) => `After the danger passes, ${a} is still holding ${b}. The adrenaline fades. What's left isn't relief — it's something else.`,
      (a, b, pr) => `${a} doesn't say it with words. ${pr.Sub} just ${pr.sub === 'they' ? 'stand' : 'stands'} between ${b} and everything that could hurt ${pr.obj}. ${b} finally understands.`,
    ],
    'loyal': [
      (a, b, pr) => `${a} can't make eye contact. Stares at the ground. "I, um. I think I..." ${b} waits. ${a} can't finish. ${b} closes the distance instead.`,
      (a, b, pr) => `${a} has been trying to say it for three episodes. Finally: "I really like you." It comes out like an apology. ${b} smiles.`,
      (a, b, pr) => `${a} leaves a note. Handwritten. Awful penmanship. ${b} reads it alone. Finds ${a} by the fire. Doesn't say anything. Just sits closer.`,
    ],
    '_default': [
      (a, b, pr) => `They're alone. The fire is low. ${a} says something real. ${b} responds with something realer. When they look at each other after, everything is different.`,
      (a, b, pr) => `${a} reaches for ${b}'s hand. ${b} lets ${pr.obj}. They sit in silence. The tribe finds them like that in the morning.`,
      (a, b, pr) => `One of them says "I trust you." The other one means it when they say it back. That's the moment it becomes real.`,
    ],
  };
  
  gs.romanticSparks = gs.romanticSparks.filter(spark => {
    if (spark.fake) return true; // fake sparks don't get first moves
    const [a, b] = spark.players;
    if (!gs.activePlayers.includes(a) || !gs.activePlayers.includes(b)) return false;
    
    // Get slower archetype threshold
    const aArch = players.find(p => p.name === a)?.archetype || '_default';
    const bArch = players.find(p => p.name === b)?.archetype || '_default';
    const aThresh = FIRST_MOVE_THRESHOLDS[aArch] || FIRST_MOVE_THRESHOLDS._default;
    const bThresh = FIRST_MOVE_THRESHOLDS[bArch] || FIRST_MOVE_THRESHOLDS._default;
    const threshold = Math.max(aThresh, bThresh); // slower one sets the pace
    
    if (spark.intensity < threshold) return true; // not ready yet, keep spark
    
    // FIRST MOVE! Determine who makes the move (faster archetype)
    const mover = aThresh <= bThresh ? a : b;
    const receiver = mover === a ? b : a;
    const moverArch = mover === a ? aArch : bArch;
    const pr = pronouns(mover);
    
    // Pick text based on mover's archetype
    const textPool = FIRST_MOVE_TEXTS[moverArch] || FIRST_MOVE_TEXTS._default;
    const text = textPool[Math.floor(Math.random() * textPool.length)](mover, receiver, pr);
    
    // Create the actual showmance
    if (!gs.showmances) gs.showmances = [];
    // Check cap again
    const activeShowmances = gs.showmances.filter(sh => sh.phase !== 'broken-up' && sh.players.every(p => gs.activePlayers.includes(p)));
    if (activeShowmances.length >= 2) return true; // cap hit, keep spark alive
    
    gs.showmances.push({
      players: [a, b], phase: 'spark', sparkEp: spark.sparkEp,
      episodesActive: 0, tested: false, breakupEp: null, breakupVoter: null, breakupType: null,
      firstMoveEp: (gs.episode || 0) + 1, firstMoveBy: mover,
    });
    
    addBond(a, b, 0.5);
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[a] = (gs.popularity[a] || 0) + 3;
    gs.popularity[b] = (gs.popularity[b] || 0) + 3;
    
    // Camp event
    const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(mover))?.name || 'merge');
    if (!ep.campEvents) ep.campEvents = {};
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
    if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];
    ep.campEvents[campKey].post.push({
      type: 'firstMove', players: [mover, receiver],
      text: text, badgeText: 'FIRST MOVE', badgeClass: 'gold'
    });
    
    return false; // remove spark — it became a showmance
  });
}
```

- [ ] **Step 2: Wire into simulateEpisode**

After `updateRomanticSparks(ep);` add:

```javascript
  checkFirstMove(ep);
```

- [ ] **Step 3: Add badge types**

Add to badge text chain:
```javascript
: evt.type === 'firstMove' ? (evt.badgeText || 'FIRST MOVE')
```

Add to badge class chain (gold group).

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: first move events — archetype-flavored kiss/confession triggers showmance"
```

---

### Task 4: Challenge Showmance Moments (`_checkShowmanceChalMoment`)

**Files:**
- Modify: `simulator.html` — new helper function, wire into Sucky Outdoors + Up the Creek + Talent Show + Phobia Factor

- [ ] **Step 1: Add the shared helper**

Place near `_challengeRomanceSpark`:

```javascript
function _checkShowmanceChalMoment(ep, phaseKey, phases, personalScores, triggerType, tribeMembers) {
  if (seasonConfig.romance === 'disabled') return;
  if (!gs.showmances?.length) return;
  
  const activeShowmances = gs.showmances.filter(sh =>
    sh.phase !== 'broken-up' && sh.players.every(p => gs.activePlayers.includes(p))
  );
  if (!activeShowmances.length) return;
  
  // Max 1 showmance moment per challenge call
  let fired = false;
  
  activeShowmances.forEach(sh => {
    if (fired) return;
    const [a, b] = sh.players;
    // Both must be in the challenge (in tribeMembers)
    const allMembers = tribeMembers ? tribeMembers.flatMap(t => t.members || []) : gs.activePlayers;
    if (!allMembers.includes(a) || !allMembers.includes(b)) return;
    
    const prA = pronouns(a), prB = pronouns(b);
    const bond = getBond(a, b);
    
    // Select moment based on trigger type
    let moment = null;
    
    if (triggerType === 'danger' && Math.random() < 0.4) {
      // Protective Instinct
      const protector = pStats(a).boldness >= pStats(b).boldness ? a : b;
      const protected_ = protector === a ? b : a;
      const prP = pronouns(protector);
      const _texts = [
        `${protector} drops everything and grabs ${protected_}. "Stay behind me." The tribe loses a few seconds. ${protector} doesn't care.`,
        `${protector} puts ${prP.posAdj} body between ${protected_} and the danger. Instinct, not strategy. The tribe notices.`,
        `${protector} reaches for ${protected_} first. Not the canoe. Not the supplies. ${protected_}. That says everything.`,
      ];
      personalScores[protector] = (personalScores[protector] || 0) - 0.5;
      addBond(a, b, 0.4);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[protector] = (gs.popularity[protector] || 0) + 1;
      moment = { type: 'showmanceProtective', players: [protector, protected_],
        text: _texts[Math.floor(Math.random() * _texts.length)],
        personalScores: { [protector]: -0.5 }, badge: 'PROTECTIVE', badgeClass: 'gold' };
    
    } else if (triggerType === 'partner-interaction' && Math.random() < 0.3) {
      // Jealousy Flare
      const jealous = Math.random() < 0.5 ? a : b;
      const other = jealous === a ? b : a;
      const prJ = pronouns(jealous);
      const _texts = [
        `${jealous} sees ${other} laughing with someone else. ${prJ.PosAdj} jaw tightens. ${prJ.Sub} ${prJ.sub === 'they' ? 'say' : 'says'} nothing. The silence is loud.`,
        `${jealous} watches ${other} from across the camp. When ${other} finally comes back, the conversation is clipped. Something's wrong.`,
        `"Who was that?" ${jealous} tries to sound casual. ${prJ.Sub} ${prJ.sub === 'they' ? 'don\'t' : 'doesn\'t'}. ${other} notices.`,
      ];
      addBond(a, b, -0.3);
      moment = { type: 'showmanceJealousy', players: [jealous, other],
        text: _texts[Math.floor(Math.random() * _texts.length)],
        personalScores: {}, badge: 'JEALOUSY', badgeClass: 'red' };
    
    } else if (triggerType === 'teamwork' && Math.random() < 0.3) {
      // Sacrifice Play
      const sacrificer = pStats(a).loyalty >= pStats(b).loyalty ? a : b;
      const beneficiary = sacrificer === a ? b : a;
      const prS = pronouns(sacrificer);
      const _texts = [
        `${sacrificer} gives up ${prS.posAdj} share to ${beneficiary}. The tribe sees it. Some think it's sweet. Others think it's a liability.`,
        `${sacrificer} takes the harder task so ${beneficiary} doesn't have to. ${prS.Sub} ${prS.sub === 'they' ? 'don\'t' : 'doesn\'t'} even hesitate.`,
        `"Take mine." ${sacrificer} hands ${prS.posAdj} advantage to ${beneficiary}. The tribe is split between admiration and concern.`,
      ];
      personalScores[sacrificer] = (personalScores[sacrificer] || 0) - 1.0;
      addBond(a, b, 0.5);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[sacrificer] = (gs.popularity[sacrificer] || 0) + 2;
      const _bmState = gs.playerStates?.[sacrificer] || {};
      _bmState.bigMoves = (_bmState.bigMoves || 0) + 1;
      if (!gs.playerStates) gs.playerStates = {};
      gs.playerStates[sacrificer] = _bmState;
      moment = { type: 'showmanceSacrifice', players: [sacrificer, beneficiary],
        text: _texts[Math.floor(Math.random() * _texts.length)],
        personalScores: { [sacrificer]: -1.0 }, badge: 'SACRIFICE', badgeClass: 'gold' };
    
    } else if (Math.random() < 0.25) {
      // PDA Reaction (default fallback)
      const _texts = [
        `${a} and ${b} are not being subtle. The tribe has opinions. Some smile. Some roll their eyes. One person starts planning how to use it.`,
        `Everyone can see ${a} and ${b}. The looks. The whispered conversations. The tribe is watching and taking notes.`,
        `${a} and ${b} forget there are cameras. And a tribe. And a game. Someone coughs loudly. They don't notice.`,
      ];
      // Tribe reactions — bond shifts from observers
      allMembers.filter(m => m !== a && m !== b).forEach(m => {
        const mArch = players.find(p => p.name === m)?.archetype || '';
        if (['hero', 'loyal', 'social-butterfly'].includes(mArch)) addBond(m, a, 0.1);
        else if (['villain', 'schemer'].includes(mArch)) addBond(m, a, -0.1); // target forming
      });
      moment = { type: 'showmancePDA', players: [a, b],
        text: _texts[Math.floor(Math.random() * _texts.length)],
        personalScores: {}, badge: 'PDA', badgeClass: 'gold' };
    }
    
    if (moment) {
      phases[phaseKey].push({ ...moment, phase: phaseKey });
      fired = true;
    }
  });
}
```

- [ ] **Step 2: Wire into Sucky Outdoors**

After bear encounter events in Phase 4 (`theNight`), add:
```javascript
    _checkShowmanceChalMoment(ep, 'theNight', phases, personalScores, 'danger', tribeMembers);
```

After fireside bonding in Phase 3 (`nightfall`), add:
```javascript
    _checkShowmanceChalMoment(ep, 'nightfall', phases, personalScores, 'teamwork', tribeMembers);
```

- [ ] **Step 3: Wire into Up the Creek**

After portage danger encounters (Phase 2), add:
```javascript
    _checkShowmanceChalMoment(ep, 'portage', phases, personalScores, 'danger', tribeMembers);
```

After canoe bonding events (Phase 1), add:
```javascript
    _checkShowmanceChalMoment(ep, 'paddleOut', phases, personalScores, 'partner-interaction', tribeMembers);
```

- [ ] **Step 4: Wire into Talent Show**

After backstage events, add:
```javascript
    _checkShowmanceChalMoment(ep, 'backstage', backstageEvents, personalScores || {}, 'partner-interaction', tribeMembers);
```

(Note: Talent Show uses `backstageEvents` array, not `phases` — adjust the push target.)

- [ ] **Step 5: Add badge types**

Badge text:
```javascript
: evt.type === 'showmanceProtective' ? (evt.badgeText || 'PROTECTIVE')
: evt.type === 'showmanceJealousy' ? (evt.badgeText || 'JEALOUSY')
: evt.type === 'showmanceSacrifice' ? (evt.badgeText || 'SACRIFICE')
: evt.type === 'showmancePDA' ? (evt.badgeText || 'PDA')
```

Badge classes: protective/sacrifice/PDA = gold, jealousy = red.

- [ ] **Step 6: Commit**

```bash
git add simulator.html
git commit -m "feat: challenge showmance moments — protective, jealousy, sacrifice, PDA"
```

---

### Task 5: Showmance Sabotage (`checkShowmanceSabotage`)

**Files:**
- Modify: `simulator.html` — new function, wire into simulateEpisode

- [ ] **Step 1: Add the sabotage function**

Place near the other romance functions:

```javascript
function checkShowmanceSabotage(ep) {
  if (seasonConfig.romance === 'disabled') return;
  if (!gs.showmances?.length) return;
  
  const NICE_ARCHS = new Set(['hero', 'loyal', 'loyal-soldier', 'protector', 'social-butterfly', 'showmancer']);
  const activeShowmances = gs.showmances.filter(sh =>
    sh.phase !== 'broken-up' && sh.players.every(p => gs.activePlayers.includes(p))
  );
  if (!activeShowmances.length) return;
  
  // Find potential saboteurs
  gs.activePlayers.forEach(saboteur => {
    const arch = players.find(p => p.name === saboteur)?.archetype || '';
    if (!['villain', 'schemer', 'mastermind'].includes(arch)) return;
    const sS = pStats(saboteur);
    
    // Proportional chance
    const chance = (10 - sS.loyalty) * 0.02 + sS.strategic * 0.015;
    if (Math.random() >= chance) return;
    
    // Find a showmance where saboteur hates one member
    const targetShowmance = activeShowmances.find(sh => {
      return sh.players.some(p => getBond(saboteur, p) <= -2) &&
        !sh.players.includes(saboteur);
    });
    if (!targetShowmance) return;
    
    // Target = the one the saboteur hates. Partner = the one they'll kiss.
    const target = targetShowmance.players.find(p => getBond(saboteur, p) <= -2);
    const partner = targetShowmance.players.find(p => p !== target);
    if (!target || !partner) return;
    
    // Must be accessible (same tribe or post-merge)
    const accessible = gs.isMerged || gs.tribes.some(t => t.members.includes(saboteur) && t.members.includes(partner));
    if (!accessible) return;
    
    const prS = pronouns(saboteur);
    const prP = pronouns(partner);
    const prT = pronouns(target);
    
    const _sabTexts = [
      `${saboteur} corners ${partner} alone. What follows looks romantic from a distance — and that's exactly what ${saboteur} wanted. By the time ${target} walks around the corner, the damage is done.`,
      `${saboteur} kisses ${partner}. It's calculated. ${partner} is confused. ${target} sees everything. The showmance will never be the same.`,
      `${saboteur} engineers a private moment with ${partner}. A touch, a whisper, a look that lasts too long. ${target} doesn't catch them — but someone else does, and word travels fast.`,
      `"I just thought you should know what your partner is really like." ${saboteur} doesn't need to lie. ${prS.Sub} just needs to create doubt. The kiss was the weapon. The rumor is the bullet.`,
    ];
    
    // Consequences
    addBond(target, partner, -2.0);
    addBond(partner, saboteur, -1.5);
    addBond(partner, target, -1.0);
    
    // Partner gets heat (looks like cheater)
    if (!gs._upTheCreekHeat) gs._upTheCreekHeat = {};
    gs._upTheCreekHeat[partner] = { amount: 1.0, expiresEp: ((gs.episode || 0) + 1) + 1 };
    // Saboteur gets heat
    gs._upTheCreekHeat[saboteur] = { amount: 1.5, expiresEp: ((gs.episode || 0) + 1) + 2 };
    
    // Popularity
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[target] = (gs.popularity[target] || 0) + 3; // sympathy
    gs.popularity[partner] = (gs.popularity[partner] || 0) - 1; // looks bad
    
    // BigMoves for saboteur
    if (!gs.playerStates) gs.playerStates = {};
    if (!gs.playerStates[saboteur]) gs.playerStates[saboteur] = {};
    gs.playerStates[saboteur].bigMoves = (gs.playerStates[saboteur].bigMoves || 0) + 1;
    
    // People who disliked the target warm to saboteur
    gs.activePlayers.forEach(m => {
      if (m === saboteur || m === target || m === partner) return;
      if (getBond(m, target) <= -1) addBond(m, saboteur, 0.2);
    });
    
    // Witness bond damage to saboteur
    gs.activePlayers.filter(m => m !== saboteur && m !== target && m !== partner).forEach(m => {
      addBond(m, saboteur, -0.5);
    });
    
    // Showmance enters tested phase — 30% instant breakup
    targetShowmance.tested = true;
    if (Math.random() < 0.30) {
      targetShowmance.phase = 'broken-up';
      targetShowmance.breakupEp = (gs.episode || 0) + 1;
      targetShowmance.breakupType = 'sabotaged';
    }
    
    // Create fake spark (never becomes real)
    if (!gs.romanticSparks) gs.romanticSparks = [];
    gs.romanticSparks.push({
      players: [saboteur, partner], sparkEp: (gs.episode || 0) + 1,
      context: 'sabotage', intensity: 0, fake: true, saboteur: saboteur,
    });
    
    // Camp event
    const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(saboteur))?.name || 'merge');
    if (!ep.campEvents) ep.campEvents = {};
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
    if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];
    ep.campEvents[campKey].post.push({
      type: 'showmanceSabotage', players: [saboteur, partner, target],
      text: _sabTexts[Math.floor(Math.random() * _sabTexts.length)],
      badgeText: 'SHOWMANCE SABOTAGE', badgeClass: 'red'
    });
  });
}
```

- [ ] **Step 2: Wire into simulateEpisode**

After `checkFirstMove(ep);` add:

```javascript
  checkShowmanceSabotage(ep);
```

- [ ] **Step 3: Add badge types**

Badge text:
```javascript
: evt.type === 'showmanceSabotage' ? (evt.badgeText || 'SHOWMANCE SABOTAGE')
```

Badge class: red.

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: showmance sabotage — villain kisses partner to destroy the couple"
```

---

### Task 6: Platonic Text Variants for Disabled Romance

**Files:**
- Modify: `simulator.html` — challenge bonding events in Sucky Outdoors + Up the Creek

- [ ] **Step 1: Add platonic variants to stargazing, cuddling, canoe moments**

For each romantic-coded event (stargazing, cuddling, canoe moment), check `seasonConfig.romance` and swap text:

In the stargazing event:
```javascript
const isRomanceOn = seasonConfig.romance !== 'disabled';
const _starTexts = isRomanceOn ? [/* romantic versions */] : [
  `${a} and ${b} lie on their backs looking at the sky. Talking about home, about life after the game. It's a friendship that'll last.`,
  `${a} and ${b} share a quiet moment under the stars. No strategy. Just two people who get each other.`,
];
```

Similarly for cuddling ("huddling for warmth" platonic version) and canoe moments ("paddling in perfect sync" friendship version).

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: platonic text variants when romance is disabled"
```

---

### Task 7: CLAUDE.md + Serialization

**Files:**
- Modify: `CLAUDE.md`, `simulator.html` (snapshotGameState if needed)

- [ ] **Step 1: Update CLAUDE.md**

Add to Core State:
```
- `gs.romanticSparks[]` — slow-burn romance sparks: `{ players, sparkEp, intensity, fake, saboteur }`
```

Add a Romance System section or update existing references to mention:
- Slow burn pipeline: spark → intensity → first move → showmance
- Romance toggle: `seasonConfig.romance`
- Asexual orientation blocks all romantic triggers
- Challenge showmance moments in applicable challenges

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md simulator.html
git commit -m "docs: update CLAUDE.md for romance overhaul"
```
