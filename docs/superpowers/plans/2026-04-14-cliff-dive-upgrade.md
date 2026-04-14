# Cliff Dive Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the cliff dive challenge from a jump-phase-only narrative to a full 3-phase narrative challenge with host commentary, tiered chicken reactions, teammate dynamics, per-player phase scoring, and a reworked wagon advantage.

**Architecture:** All changes are in `simulator.html`. Text pools go near existing `CLIFF_DIVE_JUMPED`/`CLIFF_DIVE_CHICKEN` constants (~line 7980). Engine changes go in `simulateCliffDive()` (~line 8453). VP screen changes go in `rpBuildCliffDive()` (~line 72577). Text backlog changes go in `_textCliffDive()` (~line 49372). Debug tab changes go near ~line 58783.

**Tech Stack:** Vanilla JS, single-file HTML app.

**Key patterns to follow:**
- `const host = seasonConfig.host || 'Chris';` at function top
- `_rp(arr)` for random pool picks — already defined in function
- Host lines are embedded in narrative text strings, not stored separately
- `pStats(name)` for stats, `pronouns(name)` for pronouns
- `addBond(a, b, delta)` for bond changes
- Camp events: `{ type, players:[], text, consequences, badgeText, badgeClass }`
- `chalMemberScores` accumulates across phases (see dodgebrawl pattern)

---

### Task 1: Host Commentary Text Pools

**Files:**
- Modify: `simulator.html:~8003-8011` (after `CLIFF_DIVE_CHICKEN`, before X-Treme Torture pools)

Add host commentary pools right after `CLIFF_DIVE_CHICKEN`. These are arrays of template strings keyed by moment.

- [ ] **Step 1: Add host commentary pools**

Insert after the closing `];` of `CLIFF_DIVE_CHICKEN` (line ~8010), before the X-Treme Torture comment block:

```javascript
const CLIFF_DIVE_HOST = {
  intro: [
    h => `${h} gestures at the cliff. "Okay, campers. One thousand feet. Shark-infested waters. Tiny safe zone. Survivors ready?"`,
    h => `"Welcome to your first challenge!" ${h} grins. "All you have to do is jump off this cliff. Into the lake. Past the sharks. No big deal."`,
    h => `${h} peers over the edge. "I wouldn't do it. But that's why I'm the host."`,
    h => `"See that cliff?" ${h} points. "See that water? See those sharks? Yeah. You're jumping."`,
  ],
  afterChicken: [
    (h, n) => `${h} tosses the chicken hat at ${n}. "Wear it with shame."`,
    (h, n) => `"That's... disappointing." ${h} slaps the chicken hat on ${n}'s head.`,
    (h, n) => `${h} shakes his head. "Chicken hat. Size large. Looks great on you, ${n}."`,
    (h, n) => `${h} doesn't even look at ${n}. Just holds out the hat.`,
  ],
  afterBoldJump: [
    (h, n) => `"Okay, ${n}! Didn't even flinch!" ${h} slow-claps from the cliff.`,
    (h, n) => `${h} raises an eyebrow. "Show-off." He's impressed.`,
    (h, n) => `"That's how it's done, people." ${h} gestures at ${n}'s splash.`,
  ],
  afterScaredJump: [
    (h, n) => `${h} winces. "That scream is gonna haunt my dreams. But ${n} jumped."`,
    (h, n) => `"Respect." ${h} nods. "${n} looked like death walking up there. Still jumped."`,
    (h, n) => `${h} cups his hands. "YOU'RE ALIVE, ${n}! Probably!"`,
  ],
  phase2Intro: [
    h => `"Phase two!" ${h} announces. "Your jumpers haul crates to the beach. Chickens? You sit and watch."`,
    h => `${h} points at the crates. "Haul 'em. More jumpers means more hands. Chickens get to think about their choices."`,
    h => `"Alright, crate haul. If your team chickened out, you're short-handed. Tough luck." ${h} shrugs.`,
  ],
  phase3Intro: [
    h => `"Final phase! Open those crates — with your teeth — and build me the best hot tub you can." ${h} grins.`,
    h => `${h} settles into a lawn chair. "Build. Me. A hot tub. Best one wins immunity."`,
    h => `"Last phase. You've got crates full of parts, and hopefully enough teammates to build something." ${h} checks his watch.`,
  ],
  winnerReveal: [
    (h, w) => `${h} inspects both hot tubs. "And immunity goes to... ${w}!"`,
    (h, w) => `"Not even close." ${h} points at ${w}'s hot tub. "${w} wins immunity!"`,
    (h, w) => `${h} climbs into ${w}'s hot tub. "Yep. This one's a winner. ${w} gets immunity."`,
  ],
  loserDig: [
    (h, l) => `${h} glances at ${l}'s hot tub. "That's not a hot tub. That's a crime scene. See you at tribal."`,
    (h, l) => `"${l}, I wouldn't put my worst enemy in that thing. Tribal council tonight."`,
    (h, l) => `${h} kicks ${l}'s hot tub. Something falls off. "Yeah. Tribal."`,
  ],
};
```

- [ ] **Step 2: Verify no syntax errors**

The pools should follow the same pattern as `CLIFF_DIVE_JUMPED` — objects/arrays of arrow functions. Double-check all template literals are properly closed.

---

### Task 2: Tiered Chicken Reactions

**Files:**
- Modify: `simulator.html:~8004-8010` (replace flat `CLIFF_DIVE_CHICKEN` array with tiered object)

- [ ] **Step 1: Replace flat chicken array with tiered object**

Replace the existing `CLIFF_DIVE_CHICKEN` array (lines ~8004-8010):

```javascript
const CLIFF_DIVE_CHICKEN = {
  high: [
    (n,pr) => `Everyone turns to look at ${n}. ${pr.Sub} was supposed to go first. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} move.`,
    (n,pr) => `${n} locks up. The team stares. This wasn't supposed to happen.`,
    (n,pr) => `${n} — the one who said "I'll go first" at camp — backs away from the edge. Silence.`,
    (n,pr) => `${n} walks to the edge. Looks down. Turns around. "${pr.Sub === 'They' ? 'They' : (pr.sub === 'he' ? 'He' : 'She')} was all talk," someone mutters.`,
  ],
  mid: [
    (n,pr) => `${n} looks over the edge, shakes ${pr.posAdj} head, and steps back. Not happening.`,
    (n,pr) => `${n} crosses ${pr.posAdj} arms. "I'm not doing this." The chicken hat goes on.`,
    (n,pr) => `${n} peers down at the water. At the sharks. Back at the water. "No." Chicken hat.`,
    (n,pr) => `${n} starts walking toward the edge, stops, and walks back. "Sorry." Chicken hat.`,
  ],
  low: [
    (n,pr) => `${n} sits down on the cliff. ${pr.Sub} ${pr.sub==='they'?'aren\'t':'isn\'t'} going anywhere. Nobody's surprised.`,
    (n,pr) => `${n} looks at the cliff and laughs nervously. "Absolutely not." At least ${pr.sub} ${pr.sub==='they'?'know':'knows'} ${pr.ref}.`,
    (n,pr) => `${n} doesn't even look over the edge. "I already know." Chicken hat, accepted with dignity.`,
    (n,pr) => `${n} shakes ${pr.posAdj} head before anyone asks. The chicken hat was always going to be ${pr.pos}.`,
  ],
};
```

- [ ] **Step 2: Update the chicken text selection in `simulateCliffDive`**

In `simulateCliffDive` (line ~8480-8482), change the chicken text selection from flat array to tiered:

Old:
```javascript
        chickens.push(name);
        const text = _rp(CLIFF_DIVE_CHICKEN)(name, pr);
        reactions.push({ name, jumped: false, text, boldness: s.boldness });
```

New:
```javascript
        chickens.push(name);
        const cTier = s.boldness >= 7 ? 'high' : s.boldness <= 3 ? 'low' : 'mid';
        const text = _rp(CLIFF_DIVE_CHICKEN[cTier])(name, pr);
        reactions.push({ name, jumped: false, text, boldness: s.boldness });
```

- [ ] **Step 3: Scale chicken blame by boldness tier**

In the blame section (lines ~8547-8556), replace flat blame with scaled blame:

Old:
```javascript
  if (!gs._cliffDiveBlame) gs._cliffDiveBlame = {};
  loser.chickens.forEach(chicken => {
    gs._cliffDiveBlame[chicken] = 1.0;
    loser.jumpers.forEach(jumper => addBond(jumper, chicken, -0.3));
  });
  tribeResults.filter(t => t.name !== loser.name).forEach(t => {
    t.chickens.forEach(chicken => {
      t.jumpers.forEach(jumper => addBond(jumper, chicken, -0.15));
    });
  });
```

New:
```javascript
  if (!gs._cliffDiveBlame) gs._cliffDiveBlame = {};
  loser.chickens.forEach(chicken => {
    const cBold = pStats(chicken).boldness;
    const blameMult = cBold >= 7 ? 1.5 : cBold <= 3 ? 0.5 : 1.0;
    gs._cliffDiveBlame[chicken] = 1.0 * blameMult;
    const bondHit = cBold >= 7 ? -0.5 : cBold <= 3 ? -0.15 : -0.3;
    loser.jumpers.forEach(jumper => addBond(jumper, chicken, bondHit));
  });
  tribeResults.filter(t => t.name !== loser.name).forEach(t => {
    t.chickens.forEach(chicken => {
      const cBold = pStats(chicken).boldness;
      const bondHit = cBold >= 7 ? -0.3 : cBold <= 3 ? -0.08 : -0.15;
      t.jumpers.forEach(jumper => addBond(jumper, chicken, bondHit));
    });
  });
```

---

### Task 3: Teammate Pressure, Encouragement & Peer Cascade

**Files:**
- Modify: `simulator.html:~8462-8498` (the per-tribe member loop in `simulateCliffDive`)

This adds three dynamics: (1) encouragement from a jumped ally, (2) pressure reactions after chickens, (3) momentum cascade based on early results.

- [ ] **Step 1: Add peer cascade and encouragement to the jump loop**

Replace the current per-tribe `members.forEach` block (lines ~8462-8498) with a version that processes members sequentially with momentum:

```javascript
  tribes.forEach(tribe => {
    const members = [...tribe.members];
    const jumpers = [];
    const chickens = [];
    const reactions = [];
    let momentum = 0; // positive = courage cascade, negative = cowardice cascade

    // Process members in random order (they don't choose a fixed sequence)
    const shuffled = [...members].sort(() => Math.random() - 0.5);

    shuffled.forEach((name, orderIdx) => {
      const s = pStats(name);
      const pr = pronouns(name);
      const baseChance = s.boldness * 0.06 + s.physical * 0.02 + s.loyalty * 0.03 + 0.10;

      // ── Peer cascade: earlier jumps/chickens shift the vibe ──
      const cascadeBoost = momentum * 0.04; // ±0.04 per net jump/chicken

      // ── Encouragement: close ally who already jumped calls out ──
      let encouragement = null;
      const jumpedAllies = jumpers.filter(j => getBond(j, name) >= 3);
      if (jumpedAllies.length > 0 && baseChance < 0.7) {
        const bestAlly = jumpedAllies.reduce((a, b) => getBond(a, name) > getBond(b, name) ? a : b);
        encouragement = { from: bestAlly, boost: 0.08 };
      }

      const finalChance = Math.min(0.95, Math.max(0.05,
        baseChance + cascadeBoost + (encouragement ? encouragement.boost : 0)
      ));
      const jumped = Math.random() < finalChance;

      if (jumped) {
        jumpers.push(name);
        momentum++;
        const tier = s.boldness >= 7 ? 'high' : s.boldness <= 3 ? 'low' : 'mid';
        let text = _rp(CLIFF_DIVE_JUMPED[tier])(name, pr);
        if (encouragement) {
          const ePr = pronouns(encouragement.from);
          text += ` (${encouragement.from} shouted from the water: "Just go!")`;
        }
        reactions.push({ name, jumped: true, text, boldness: s.boldness, encouraged: !!encouragement });
      } else {
        chickens.push(name);
        momentum--;
        const cTier = s.boldness >= 7 ? 'high' : s.boldness <= 3 ? 'low' : 'mid';
        let text = _rp(CLIFF_DIVE_CHICKEN[cTier])(name, pr);

        // ── Teammate pressure reaction: a frustrated jumper speaks up ──
        if (jumpers.length > 0) {
          const frustratedJumper = jumpers[Math.floor(Math.random() * jumpers.length)];
          const fPr = pronouns(frustratedJumper);
          const pressureLines = [
            `${frustratedJumper} throws ${fPr.posAdj} hands up.`,
            `${frustratedJumper} stares at ${name}. Says nothing. Doesn't need to.`,
            `"Are you serious?" ${frustratedJumper} mutters.`,
            `${frustratedJumper} turns away. Not even worth the argument.`,
          ];
          text += ' ' + _rp(pressureLines);
          addBond(frustratedJumper, name, -0.1); // micro-hit beyond the main blame
        }
        reactions.push({ name, jumped: false, text, boldness: s.boldness, pressured: jumpers.length > 0 });
      }
    });

    // Standout detection (unchanged logic)
    let standout = null, standoutIsUnderdog = false;
    if (jumpers.length) {
      if (Math.random() < 0.15) {
        standout = jumpers.reduce((a, b) => pStats(a).boldness < pStats(b).boldness ? a : b);
        standoutIsUnderdog = true;
      } else {
        const scored = jumpers.map(name => ({
          name, score: pStats(name).boldness * 0.07 + 0.3 + Math.random() * 0.2
        })).sort((a, b) => b.score - a.score);
        standout = scored[0].name;
        standoutIsUnderdog = pStats(standout).boldness <= 4;
      }
    }
```

Note: The `standout` detection stays the same, the block just moves down slightly. Everything after standout detection (haul/build scoring) will be replaced in Task 4.

---

### Task 4: Phase 2 & 3 Per-Player Scoring + Narrative

**Files:**
- Modify: `simulator.html:~8500-8516` (replace tribe-average-only haul/build with per-player scoring)
- Modify: `simulator.html:~8596-8601` (update `chalMemberScores` to accumulate across phases)

Add text pool constants near the other cliff dive pools (~line 8010, after `CLIFF_DIVE_HOST`).

- [ ] **Step 1: Add haul and build narrative text pools**

Insert after `CLIFF_DIVE_HOST` (from Task 1):

```javascript
const CLIFF_DIVE_HAUL = {
  dominant: [
    t => `${t} is moving crates like furniture on move-in day. Two at a time. Nobody's struggling.`,
    t => `${t} hits the beach at a dead run. Crates are stacking up before the other team leaves the water.`,
    t => `Full manpower, full speed. ${t} makes this look easy.`,
  ],
  scrappy: [
    t => `Short-handed but scrappy. ${t} is making up for missing bodies with pure grit.`,
    t => `${t} doesn't have the numbers, but the ones hauling are hauling hard.`,
    t => `${t} is doing more with less. Every jumper pulling double duty.`,
  ],
  struggling: [
    t => `${t} is in trouble. Too many chickens watching from the cliff while two people drag crates through sand.`,
    t => `This is painful. ${t} barely has enough hands. Crates are slipping. Sand is everywhere.`,
    t => `${t}'s chickens sit on the cliff, watching their team fall behind. Nobody's making eye contact.`,
  ],
};

const CLIFF_DIVE_HAUL_STANDOUT = [
  (n, pr) => `${n} is carrying the team. Literally. ${pr.Sub} ${pr.sub==='they'?'have':'has'} moved more crates than anyone.`,
  (n, pr) => `${n} doesn't stop. Crate after crate. ${pr.posAdj} teammates are winded. ${pr.Sub} ${pr.sub==='they'?'aren\'t':'isn\'t'}.`,
  (n, pr) => `${n} puts ${pr.posAdj} head down and hauls. The strongest back on the beach right now.`,
];

const CLIFF_DIVE_HAUL_WEAKEST = [
  (n, pr) => `${n} is falling behind. ${pr.Sub} ${pr.sub==='they'?'drop':'drops'} a crate in the sand and has to go back for it.`,
  (n, pr) => `${n} is trying, but ${pr.posAdj} arms give out halfway to the pile. Teammates pass ${pr.obj}.`,
  (n, pr) => `${n} drags a single crate across the beach while everyone else carries two.`,
];

const CLIFF_DIVE_BUILD = {
  efficient: [
    t => `${t} reads the instructions once and gets to work. Parts click together. This team knows what they're doing.`,
    t => `Organized. Efficient. ${t} has someone reading plans, someone bolting, someone fitting pipes. Like a machine.`,
    t => `${t}'s hot tub takes shape fast. The mental game pays off here.`,
  ],
  chaotic: [
    t => `${t} is arguing about the instructions. Three people holding the same plank. One person looking for a piece that's already installed.`,
    t => `"That doesn't go there!" "Yes it does!" ${t} is building a hot tub and a grudge match simultaneously.`,
    t => `${t}'s hot tub looks like modern art. Not in a good way. The instructions are in the sand somewhere.`,
  ],
};

const CLIFF_DIVE_BUILD_LEADER = [
  (n, pr) => `${n} takes charge. "I'll read, you build." The team falls in line. ${pr.Sub} ${pr.sub==='they'?'have':'has'} the highest IQ on the beach right now.`,
  (n, pr) => `${n} steps up as build captain. Calm, focused, directing. The hot tub starts making sense.`,
  (n, pr) => `"Give me the instructions." ${n} takes over. Nobody argues. ${pr.Sub} ${pr.sub==='they'?'are':'is'} right.`,
];

const CLIFF_DIVE_BUILD_FRUSTRATION = [
  (sitting, working, pr) => `${sitting} watches from the sideline while ${working} struggles with a pipe. ${pr.Sub} could help. ${pr.Sub} ${pr.sub==='they'?'can\'t':'can\'t'}. Chicken rules.`,
  (sitting, working, pr) => `${sitting} opens ${pr.posAdj} mouth to give advice. ${working} glares. ${sitting} closes it.`,
];
```

- [ ] **Step 2: Replace haul/build scoring with per-player + narrative**

Replace the current haul/build scoring block (lines ~8500-8516). The new version goes right after the standout detection block, replacing everything from `const manpowerMult` through the `tribeResults.push(...)`:

```javascript
    // ── Phase 2: Haul Crates (per-player) ──
    const haulIndiv = {};
    const haulNarrative = [];
    jumpers.forEach(name => {
      const s = pStats(name);
      haulIndiv[name] = s.physical * 0.5 + s.endurance * 0.4 + Math.random() * 1.0;
    });
    chickens.forEach(name => { haulIndiv[name] = 0; }); // sitting out

    const haulTotal = Object.values(haulIndiv).reduce((s, v) => s + v, 0);
    const manpowerPct = members.length > 0 ? jumpers.length / members.length : 0;
    const haulScore = members.length > 0 ? (haulTotal / members.length) * (0.5 + manpowerPct * 0.5) : 0;

    // Haul narrative: tribe-level flavor
    const haulTier = manpowerPct >= 0.8 && haulScore > 3 ? 'dominant'
      : manpowerPct < 0.5 ? 'struggling' : 'scrappy';
    haulNarrative.push(_rp(CLIFF_DIVE_HAUL[haulTier])(tribe.name));

    // Haul standout + weakest (among jumpers only)
    let haulStandout = null, haulWeakest = null;
    if (jumpers.length >= 2) {
      const sorted = jumpers.map(n => ({ name: n, score: haulIndiv[n] })).sort((a, b) => b.score - a.score);
      haulStandout = sorted[0].name;
      haulWeakest = sorted[sorted.length - 1].name;
      const hsPr = pronouns(haulStandout);
      haulNarrative.push(_rp(CLIFF_DIVE_HAUL_STANDOUT)(haulStandout, hsPr));
      if (haulWeakest !== haulStandout) {
        const hwPr = pronouns(haulWeakest);
        haulNarrative.push(_rp(CLIFF_DIVE_HAUL_WEAKEST)(haulWeakest, hwPr));
      }
    }

    // ── Phase 3: Build Hot Tub (per-player) ──
    const buildIndiv = {};
    const buildNarrative = [];
    jumpers.forEach(name => {
      const s = pStats(name);
      buildIndiv[name] = s.mental * 0.5 + s.social * 0.3 + Math.random() * 1.0;
    });
    chickens.forEach(name => { buildIndiv[name] = 0; }); // sitting out

    const buildTotal = Object.values(buildIndiv).reduce((s, v) => s + v, 0);
    const buildScore = members.length > 0 ? (buildTotal / members.length) * (0.5 + manpowerPct * 0.5) : 0;

    // Build narrative: tribe-level flavor
    const avgMental = jumpers.length > 0 ? jumpers.reduce((s, n) => s + pStats(n).mental, 0) / jumpers.length : 0;
    const buildTier = avgMental >= 6 ? 'efficient' : 'chaotic';
    buildNarrative.push(_rp(CLIFF_DIVE_BUILD[buildTier])(tribe.name));

    // Build leader: highest mental among jumpers
    let buildLeader = null;
    if (jumpers.length >= 2) {
      buildLeader = jumpers.reduce((a, b) => pStats(a).mental > pStats(b).mental ? a : b);
      const blPr = pronouns(buildLeader);
      buildNarrative.push(_rp(CLIFF_DIVE_BUILD_LEADER)(buildLeader, blPr));
      // Bond boost for leading the build
      jumpers.filter(m => m !== buildLeader).forEach(m => addBond(m, buildLeader, 0.15));
    }

    // Frustration: chicken watching their struggling team
    if (chickens.length > 0 && jumpers.length > 0 && manpowerPct < 0.7) {
      const sitter = chickens[Math.floor(Math.random() * chickens.length)];
      const worker = jumpers[Math.floor(Math.random() * jumpers.length)];
      const sPr = pronouns(sitter);
      buildNarrative.push(_rp(CLIFF_DIVE_BUILD_FRUSTRATION)(sitter, worker, sPr));
    }

    const totalScore = haulScore + buildScore;

    tribeResults.push({
      name: tribe.name, members, jumpers, chickens, standout, standoutIsUnderdog,
      jumpCount: jumpers.length,
      haulScore: Math.round(haulScore * 100) / 100,
      buildScore: Math.round(buildScore * 100) / 100,
      totalScore: Math.round(totalScore * 100) / 100,
      reactions,
      haulIndiv, buildIndiv, haulNarrative, buildNarrative,
      haulStandout, haulWeakest, buildLeader,
    });
  });
```

- [ ] **Step 3: Update `chalMemberScores` to accumulate across all 3 phases**

Replace the existing `chalMemberScores` block (lines ~8596-8601):

```javascript
  ep.chalMemberScores = {};
  tribeResults.forEach(t => {
    t.members.forEach(m => {
      const jumpScore = t.jumpers.includes(m) ? (m === t.standout ? 30 : 10) : 0;
      const haulPts = (t.haulIndiv[m] || 0) * 3; // scale to ~0-30 range
      const buildPts = (t.buildIndiv[m] || 0) * 3;
      const leaderBonus = m === t.buildLeader ? 5 : 0;
      const standoutBonus = m === t.haulStandout ? 5 : 0;
      ep.chalMemberScores[m] = Math.round(jumpScore + haulPts + buildPts + leaderBonus + standoutBonus);
    });
  });
```

- [ ] **Step 4: Add build leader camp event**

Insert after the existing standout camp event block (after line ~8591), inside the `tribeResults.forEach` that generates camp events:

```javascript
    if (t.buildLeader) {
      const blPr = pronouns(t.buildLeader);
      ep.campEvents[t.name].post.push({
        type: 'cliffDiveBuildLeader',
        players: [t.buildLeader, ...t.jumpers.filter(m => m !== t.buildLeader).slice(0, 2)],
        text: `${t.buildLeader} took charge of the hot tub build. ${blPr.Sub} read the plans, directed the team, and kept everyone on task.`,
        consequences: 'Bond +0.15 from teammates.',
        badgeText: 'BUILD CAPTAIN', badgeClass: 'blue'
      });
    }
```

Also register `cliffDiveBuildLeader` in the badge rendering switch (near line ~60916):

Find the line:
```javascript
                     : evt.type === 'cliffDiveStandout'        ? (evt.badgeText || 'FIRST TO JUMP')
```

Insert after it:
```javascript
                     : evt.type === 'cliffDiveBuildLeader'     ? (evt.badgeText || 'BUILD CAPTAIN')
```

---

### Task 5: Wagon Advantage Rework

**Files:**
- Modify: `simulator.html:~8519-8526` (wagon advantage logic in `simulateCliffDive`)

- [ ] **Step 1: Replace wagon advantage trigger**

Replace the current wagon logic (lines ~8519-8526):

Old:
```javascript
  const maxJumps = Math.max(...tribeResults.map(t => t.jumpCount));
  const wagonCandidates = tribeResults.filter(t => t.jumpCount === maxJumps);
  const wagonWinner = wagonCandidates.length === 1 ? wagonCandidates[0].name : null;
  if (wagonWinner) {
    const wt = tribeResults.find(t => t.name === wagonWinner);
    wt.haulScore = Math.round(wt.haulScore * 1.3 * 100) / 100;
    wt.totalScore = Math.round((wt.haulScore + wt.buildScore) * 100) / 100;
  }
```

New:
```javascript
  // Wagon advantage: 100% jump rate OR highest jump% with 20%+ gap over second
  const jumpPcts = tribeResults.map(t => ({
    name: t.name, pct: t.members.length > 0 ? t.jumpers.length / t.members.length : 0
  })).sort((a, b) => b.pct - a.pct);
  let wagonWinner = null;
  if (jumpPcts[0].pct >= 1.0) {
    // Perfect jump rate — always earns wagons
    wagonWinner = jumpPcts[0].name;
  } else if (jumpPcts.length >= 2 && jumpPcts[0].pct - jumpPcts[1].pct >= 0.20) {
    // 20%+ gap over second place
    wagonWinner = jumpPcts[0].name;
  }
  if (wagonWinner) {
    const wt = tribeResults.find(t => t.name === wagonWinner);
    wt.haulScore = Math.round(wt.haulScore * 1.3 * 100) / 100;
    wt.totalScore = Math.round((wt.haulScore + wt.buildScore) * 100) / 100;
  }
```

---

### Task 6: Integrate Host Lines into Engine

**Files:**
- Modify: `simulator.html` — `simulateCliffDive()` function

Host lines get embedded into the data stored on `ep.cliffDive` so the VP screen and text backlog can render them.

- [ ] **Step 1: Add host variable and host lines to simulateCliffDive**

At the very top of `simulateCliffDive` (after `const _rp = ...`, line ~8455), add:

```javascript
  const host = seasonConfig.host || 'Chris';
```

- [ ] **Step 2: Store host intro line on ep.cliffDive**

In the `ep.cliffDive = { ... }` assignment (line ~8603), expand it to include host lines:

```javascript
  // Generate host lines
  const hostIntro = _rp(CLIFF_DIVE_HOST.intro)(host);
  const hostPhase2 = _rp(CLIFF_DIVE_HOST.phase2Intro)(host);
  const hostPhase3 = _rp(CLIFF_DIVE_HOST.phase3Intro)(host);
  const hostWinner = _rp(CLIFF_DIVE_HOST.winnerReveal)(host, winner.name);
  const hostLoserDig = _rp(CLIFF_DIVE_HOST.loserDig)(host, loser.name);

  // Per-reaction host lines (chicken mockery / jump acknowledgment)
  tribeResults.forEach(t => {
    t.reactions.forEach(r => {
      if (!r.jumped) {
        r.hostLine = _rp(CLIFF_DIVE_HOST.afterChicken)(host, r.name);
      } else if (r.boldness <= 3) {
        r.hostLine = _rp(CLIFF_DIVE_HOST.afterScaredJump)(host, r.name);
      } else if (r.boldness >= 7 && Math.random() < 0.5) {
        r.hostLine = _rp(CLIFF_DIVE_HOST.afterBoldJump)(host, r.name);
      }
      // Mid-boldness jumpers: no host line (not every jump needs commentary)
    });
  });

  ep.cliffDive = {
    tribes: tribeResults,
    wagonWinner,
    winner: winner.name,
    hostIntro, hostPhase2, hostPhase3, hostWinner, hostLoserDig,
  };
```

---

### Task 7: Update Text Backlog

**Files:**
- Modify: `simulator.html:~49372-49406` (replace `_textCliffDive`)

- [ ] **Step 1: Replace `_textCliffDive` with enriched version**

```javascript
function _textCliffDive(ep, ln, sec) {
  if (!ep.cliffDive?.tribes?.length) return;
  const cd = ep.cliffDive;
  sec('CLIFF DIVE');
  if (cd.hostIntro) ln(cd.hostIntro);
  ln('One thousand feet. Shark-infested waters. A tiny safe zone.');
  ln('');
  ln('Phase 1 — The Jump:');
  cd.tribes.forEach(t => {
    ln(`  ${t.name}:`);
    (t.reactions || []).forEach(r => {
      const badge = r.jumped ? 'JUMPED' : 'CHICKENED OUT';
      const standoutTag = r.name === t.standout ? ' [★ FIRST TO JUMP]' : '';
      ln(`    [${badge}]${standoutTag} ${r.text}`);
      if (r.hostLine) ln(`      Host: ${r.hostLine}`);
    });
    ln(`    Score: ${t.jumpCount}/${t.members.length} jumped`);
  });
  if (cd.wagonWinner) ln(`Wagon advantage: ${cd.wagonWinner}`);
  ln('');
  if (cd.hostPhase2) ln(cd.hostPhase2);
  ln('Phase 2 — Haul Crates:');
  cd.tribes.forEach(t => {
    const manpower = t.members.length > 0 ? Math.round(t.jumpers.length / t.members.length * 100) : 0;
    ln(`  ${t.name}: ${t.haulScore} (${manpower}% manpower${t.name === cd.wagonWinner ? ', wagons 1.3x' : ''})`);
    (t.haulNarrative || []).forEach(line => ln(`    ${line}`));
    if (t.haulStandout) ln(`    ★ Haul MVP: ${t.haulStandout}`);
    if (t.haulWeakest && t.haulWeakest !== t.haulStandout) ln(`    ▽ Struggling: ${t.haulWeakest}`);
  });
  ln('');
  if (cd.hostPhase3) ln(cd.hostPhase3);
  ln('Phase 3 — Build Hot Tub:');
  cd.tribes.forEach(t => {
    const manpower = t.members.length > 0 ? Math.round(t.jumpers.length / t.members.length * 100) : 0;
    ln(`  ${t.name}: ${t.buildScore} (${manpower}% manpower)`);
    (t.buildNarrative || []).forEach(line => ln(`    ${line}`));
    if (t.buildLeader) ln(`    ★ Build Captain: ${t.buildLeader}`);
  });
  ln('');
  if (cd.hostWinner) ln(cd.hostWinner);
  ln(`RESULT: ${cd.winner} wins immunity`);
  if (cd.hostLoserDig) ln(cd.hostLoserDig);
  cd.tribes.forEach(t => ln(`  ${t.name}: Jump ${t.jumpCount} · Haul ${t.haulScore} · Build ${t.buildScore} · Total ${t.totalScore}${t.name === cd.winner ? ' ★ WINNER' : ''}`));
  const allChickens = cd.tribes.flatMap(t => t.chickens);
  if (allChickens.length) ln(`Chicken hats: ${allChickens.join(', ')}`);
}
```

---

### Task 8: Update VP Screen — Host Lines + Phase Narrative

**Files:**
- Modify: `simulator.html:~72577-72794` (`rpBuildCliffDive`)

This task adds host commentary to the VP screen and enriches phases 2 and 3 with narrative text and per-player breakdowns.

- [ ] **Step 1: Add host intro to VP header**

In `rpBuildCliffDive`, after the "hat of shame" subtitle line (line ~72617), before the cliff edge div, add:

```javascript
    ${cd.hostIntro ? `<div style="text-align:center;font-size:12px;color:#c9d1d9;font-style:italic;margin-bottom:8px;padding:6px 12px;background:rgba(0,0,0,0.3);border-radius:6px">"${cd.hostIntro}"</div>` : ''}
```

- [ ] **Step 2: Add host line to jump reactions**

In the jump reaction rendering (both standout and normal blocks), after the reaction text `<div>`, add a host line if present. Inside the standout block (after the `r.text` italic div, ~line 72666):

```javascript
              ${r.hostLine ? `<div style="font-size:10px;color:#6e7681;margin-top:4px">🎙️ ${r.hostLine}</div>` : ''}
```

And in the normal jump/chicken block (after the `r.text` italic div, ~line 72679):

```javascript
              ${r.hostLine ? `<div style="font-size:10px;color:#6e7681;margin-top:3px">🎙️ ${r.hostLine}</div>` : ''}
```

- [ ] **Step 3: Enrich Phase 2 VP with narrative + per-player bars**

Replace the Phase 2 rendering block (the `step.type === 'phase2'` section, lines ~72685-72717). After the tribe score bars, add narrative text and individual breakdowns:

After each tribe's score bar div (inside the `hSorted.forEach` loop), before the closing `</div>` of each tribe entry, add:

```javascript
          ${(() => {
            const indiv = t.haulIndiv || {};
            const topTwo = Object.entries(indiv).filter(([,v]) => v > 0).sort((a,b) => b[1] - a[1]).slice(0, 2);
            return topTwo.length ? `<div style="font-size:9px;color:#484f58;margin-top:2px">Top haulers: ${topTwo.map(([n,v]) => `${n} (${v.toFixed(1)})`).join(', ')}</div>` : '';
          })()}
```

After the tribe bars loop, before the closing `</div>` of the phase card, add narrative:

```javascript
      ${(() => {
        const narratives = cd.tribes.map(t => (t.haulNarrative || []).join(' ')).filter(n => n);
        return narratives.length ? narratives.map(n =>
          `<div style="font-size:11px;color:#8b949e;font-style:italic;margin-top:8px;padding:6px 10px;background:rgba(0,0,0,0.2);border-radius:6px">${n}</div>`
        ).join('') : '';
      })()}
      ${cd.hostPhase2 ? `<div style="font-size:11px;color:#6e7681;font-style:italic;margin-top:6px;text-align:center">🎙️ ${cd.hostPhase2}</div>` : ''}
```

- [ ] **Step 4: Enrich Phase 3 VP with narrative + leader callout**

Same pattern as Phase 2. After the tribe score bars in the Phase 3 block, add individual breakdown and narrative:

After each tribe's score bar (inside `bSorted.forEach`), before the closing `</div>`:

```javascript
          ${t.buildLeader ? `<div style="font-size:9px;color:#d2a8ff;margin-top:2px">Build captain: ${t.buildLeader}</div>` : ''}
```

After the tribe bars, before closing `</div>`:

```javascript
      ${(() => {
        const narratives = cd.tribes.map(t => (t.buildNarrative || []).join(' ')).filter(n => n);
        return narratives.length ? narratives.map(n =>
          `<div style="font-size:11px;color:#8b949e;font-style:italic;margin-top:8px;padding:6px 10px;background:rgba(0,0,0,0.2);border-radius:6px">${n}</div>`
        ).join('') : '';
      })()}
      ${cd.hostPhase3 ? `<div style="font-size:11px;color:#6e7681;font-style:italic;margin-top:6px;text-align:center">🎙️ ${cd.hostPhase3}</div>` : ''}
```

- [ ] **Step 5: Add host winner/loser lines to results**

In the results section (step.type === 'results', ~line 72746), after the final standings, before the Wall of Shame, add:

```javascript
      ${cd.hostWinner ? `<div style="font-size:13px;color:#3fb950;font-style:italic;text-align:center;margin-top:10px;padding:8px 12px;background:rgba(63,185,80,0.05);border-radius:6px">🎙️ ${cd.hostWinner}</div>` : ''}
      ${cd.hostLoserDig ? `<div style="font-size:11px;color:#f85149;font-style:italic;text-align:center;margin-top:6px;padding:6px 10px;background:rgba(248,81,73,0.04);border-radius:6px">🎙️ ${cd.hostLoserDig}</div>` : ''}
```

---

### Task 9: Update Debug Challenge Tab

**Files:**
- Modify: `simulator.html:~58783-58789` (cliff dive debug section)

- [ ] **Step 1: Enrich debug tab with per-player scores and new data**

Replace the current cliff dive debug block:

```javascript
    if (ep.cliffDive?.tribes?.length) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#f0883e;margin:16px 0 8px">Cliff Dive — Per Tribe</div>`;
      ep.cliffDive.tribes.forEach(t => {
        const tc = tribeColor(t.name);
        html += `<div style="font-size:10px;padding:2px 0"><span style="color:${tc};font-weight:700">${t.name}</span> — Jumpers: ${t.jumpCount}/${t.reactions.length}, Haul: ${(t.haulScore||0).toFixed(1)}, Build: ${(t.buildScore||0).toFixed(1)}${t.standout ? ', Standout: '+t.standout : ''}${t.buildLeader ? ', Build Capt: '+t.buildLeader : ''}</div>`;
        // Per-player breakdown
        t.members.forEach(m => {
          const jumped = t.jumpers.includes(m);
          const hScore = (t.haulIndiv?.[m] || 0).toFixed(1);
          const bScore = (t.buildIndiv?.[m] || 0).toFixed(1);
          const total = ep.chalMemberScores?.[m] || 0;
          html += `<div style="font-size:9px;padding:1px 0 1px 12px;color:#6e7681">${m}: ${jumped ? 'JUMPED' : 'CHICKEN'} · Haul:${hScore} · Build:${bScore} · Total:${total}</div>`;
        });
      });
      if (ep.cliffDive.wagonWinner) {
        html += `<div style="font-size:9px;color:#3fb950;padding:2px 0">Wagon advantage: ${ep.cliffDive.wagonWinner}</div>`;
      }
    }
```

---

### Task 10: Smoke Test & Commit

- [ ] **Step 1: Open simulator in browser**

Open `simulator.html` in a browser. Configure an episode with the Cliff Dive twist. Run the episode.

- [ ] **Step 2: Verify VP screen**

Click through the Cliff Dive VP screen step by step:
- Host intro appears in header
- Jump reactions show tiered text (bold chickens get different text than timid ones)
- Host lines appear after chickens and scared/bold jumpers
- Encouragement text appears when an ally helped
- Pressure reactions appear when teammates are frustrated
- Phase 2 shows tribe bars + narrative text + top haulers + host line
- Phase 3 shows tribe bars + narrative text + build captain + host line
- Results show host winner line + host loser dig
- Wall of Shame still renders

- [ ] **Step 3: Verify text backlog**

Open the text backlog. Confirm:
- Host intro line at top
- Per-reaction host lines appear
- Phase 2 has narrative lines + haul MVP + struggling player
- Phase 3 has narrative lines + build captain
- Host winner/loser lines at bottom

- [ ] **Step 4: Verify debug tab**

Open the debug challenge tab. Confirm per-player rows show individual haul/build/total scores.

- [ ] **Step 5: Verify camp events**

Check camp events for:
- `cliffDiveChicken` events (still present)
- `cliffDiveStandout` events (still present)
- `cliffDiveBuildLeader` events (new — appears with BUILD CAPTAIN badge)

- [ ] **Step 6: Run 5+ episodes to check variance**

Run several cliff dive episodes to make sure:
- Momentum cascade doesn't make everyone always jump or always chicken (check for variety)
- Wagon advantage fires sometimes but not always
- Different tribes get different narrative text
- No console errors

- [ ] **Step 7: Commit**

```bash
git add simulator.html
git commit -m "feat(cliff-dive): upgrade with host commentary, tiered chickens, peer dynamics, phase narrative"
```
