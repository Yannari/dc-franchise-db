# I Triple Dog Dare You! — Overdrive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Triple Dog Dare from a functional-but-flat challenge into a distinct "Playground Chaos" experience with chalk-on-blacktop identity + meaningful dare-category consequences + archetype-driven dare preferences + chicken-streak pressure mechanics + public reactions that shift popularity. No new persisted state schema.

**Architecture:** All simulation changes in `js/chal/triple-dog-dare.js`. VP identity built into the same file (consolidated rpBuild replacing 3 legacy screens in `vp-screens.js`). `core.js` gains ~70 new dare-pool entries across 4 categories with a `severity` field. No changes to `episode.js` or `twists.js`.

**Tech Stack:** Vanilla ES modules, no build step. Verification: `node --check` + manual browser smoke test via `simulator.html` served on `python -m http.server 8765`.

**Design spec:** `docs/superpowers/specs/2026-04-17-triple-dog-dare-overdrive-design.md`

---

## Setup

Before starting:

1. Read the design spec end-to-end, especially §Identity and §Gameplay depth changes.
2. Serve `simulator.html` via `python -m http.server 8765` from repo root.
3. Reference regions in `js/chal/triple-dog-dare.js`:
   - `simulateTripleDogDare(ep)` — line 7, full simulation
   - Willingness calculation — around line 54 (the `freebieComfort` block)
   - Freebie-sharing helper — around line 94
   - Round loop — around line 259
4. Reference `js/core.js`:
   - `DARE_POOL` constant and `DARE_CATEGORIES` — grep for them
5. Reference `js/vp-screens.js`:
   - Current 3-screen TDD block at line 10484-10487
   - Legacy `rpBuildTripleDogDareAnnouncement`/`Rounds`/`Elimination` functions (to be deleted)

**Commit convention:** `feat(tdd): <description>` for features. `fix(tdd): <description>` for bug fixes.

---

## Task 1: Expand `DARE_POOL` with severity tiers + named-target templates

**Files:**
- Modify: `js/core.js` — `DARE_POOL` constant.

- [ ] **Step 1: Locate the current pool**

```bash
grep -n "DARE_POOL" js/core.js | head -5
```

Find the `DARE_POOL` export. Note the current shape — likely `{ gross: [...], physical: [...], truth: [...], public: [...] }` with string entries.

- [ ] **Step 2: Convert entries to objects with severity + optional metadata**

Each dare becomes:

```js
{
  text: 'eat a worm',
  severity: 'mild' | 'harsh',
  target?: 'named'   // if the dare requires a named target (truth dares), uses {target} placeholder
  needsArch?: 'hothead'  // optional — only pull this dare if at least one active player matches
}
```

Transform the existing pool to this shape. The current plain-string entries become `{ text: '<string>', severity: 'mild' }` by default.

- [ ] **Step 3: Add ~70 new entries, split across categories**

Aim for final counts per category: **30 gross, 30 physical, 30 truth, 30 public** (120 total). Per category, split roughly 60/40 mild/harsh.

Example new entries (write 15-20 per category matching this pattern):

```js
gross: [
  // existing entries...
  { text: 'lick the log in the firepit', severity: 'harsh' },
  { text: 'eat a handful of dirt', severity: 'mild' },
  { text: 'drink whatever is in that mystery jar', severity: 'harsh' },
  { text: 'chew a piece of gum you find on the ground', severity: 'harsh' },
  { text: 'lick somebody else\'s shoe', severity: 'mild' },
  // ... add more
],
physical: [
  { text: 'do 30 push-ups right now', severity: 'mild' },
  { text: 'arm-wrestle Chef', severity: 'harsh', needsArch: 'challenge-beast' },
  { text: 'run a full lap around camp in under 90 seconds', severity: 'mild' },
  { text: 'hold a plank until the next dare', severity: 'harsh' },
  // ...
],
truth: [
  { text: 'admit who you would vote for tonight', severity: 'harsh', target: 'named' },
  { text: 'confess your biggest fear to {target}', severity: 'mild', target: 'named' },
  { text: 'tell {target} the real reason you\'re here', severity: 'harsh', target: 'named' },
  { text: 'rate every player 1-10 and commit to your rankings', severity: 'harsh' },
  // ...
],
public: [
  { text: 'stand on the dining table and recite a love poem', severity: 'mild' },
  { text: 'sing the national anthem to the whole camp', severity: 'mild' },
  { text: 'propose marriage to a tree, with witnesses', severity: 'harsh' },
  { text: 'do a victory dance and dedicate it to {target}', severity: 'mild', target: 'named' },
  // ...
],
```

Write in small batches of 10-15 per category, re-reading each for voice consistency. Match Total Drama Island's comic register (Chris McLean would approve).

- [ ] **Step 4: Validate + commit**

```bash
node --check js/core.js
git add js/core.js
git commit -m "feat(tdd): expand DARE_POOL with severity + named-target metadata"
```

---

## Task 2: Archetype dare preferences table + helper

**Files:**
- Modify: `js/chal/triple-dog-dare.js` — add new helper near top of the file.

- [ ] **Step 1: Insert the archetype bias table**

At module-scope, after the existing imports/state, insert:

```js
// ── Archetype × Category willingness modifiers (overdrive) ──
const TDD_ARCHETYPE_BIAS = {
  'hothead':            { gross:  0.00, physical:  0.15, truth: -0.10, public:  0.05 },
  'challenge-beast':    { gross: -0.05, physical:  0.20, truth: -0.05, public:  0.00 },
  'villain':            { gross:  0.00, physical:  0.00, truth:  0.12, public: -0.08 },
  'mastermind':         { gross: -0.05, physical: -0.05, truth:  0.12, public: -0.05 },
  'schemer':            { gross: -0.05, physical: -0.05, truth:  0.10, public: -0.05 },
  'social-butterfly':   { gross: -0.05, physical:  0.00, truth:  0.05, public:  0.15 },
  'showmancer':         { gross: -0.05, physical:  0.00, truth:  0.05, public:  0.15 },
  'hero':               { gross:  0.05, physical:  0.05, truth:  0.05, public:  0.05 },
  'loyal-soldier':      { gross:  0.05, physical:  0.05, truth:  0.05, public:  0.05 },
  'underdog':           { gross:  0.10, physical:  0.10, truth:  0.00, public:  0.00 },
  'goat':               { gross:  0.15, physical:  0.05, truth:  0.00, public:  0.10 },
  'perceptive-player':  { gross: -0.05, physical: -0.05, truth:  0.10, public: -0.05 },
  'wildcard':           { gross:  0.10, physical:  0.10, truth:  0.05, public:  0.10 },
  'chaos-agent':        { gross:  0.15, physical:  0.10, truth:  0.00, public:  0.10 },
  'floater':            { gross: -0.05, physical: -0.05, truth: -0.05, public: -0.05 },
};

function _tddArchBias(name, category) {
  const players = (globalThis.players || []);
  const p = players.find(p => p.name === name);
  const arch = p?.archetype || '';
  const row = TDD_ARCHETYPE_BIAS[arch];
  if (!row) return 0;
  return row[category] || 0;
}
```

Replace `globalThis.players` with the actual imported `players` reference — this already exists from `import { ..., players } from '../core.js';` at the top of the file. The helper just uses that module import:

```js
function _tddArchBias(name, category) {
  const p = players.find(pp => pp.name === name);
  const arch = p?.archetype || '';
  const row = TDD_ARCHETYPE_BIAS[arch];
  if (!row) return 0;
  return row[category] || 0;
}
```

- [ ] **Step 2: Wire into willingness calculation**

Find the existing willingness roll (around line 54-62 where `chance = s.boldness * 0.07 + ...`). Add `_tddArchBias(player, category)` into the `chance` calculation:

```js
const chance = s.boldness * 0.07
  + secondary
  - fatigue
  + freebieComfort
  + earlyBoost
  + _tddArchBias(player, category);  // NEW
```

The `category` variable needs to be in scope at this point — check the callsite. If not, pass it in as a parameter to whatever function this willingness logic lives inside.

- [ ] **Step 3: Validate + commit**

```bash
node --check js/chal/triple-dog-dare.js
git add js/chal/triple-dog-dare.js
git commit -m "feat(tdd): archetype × category dare willingness modifiers"
```

---

## Task 3: Chicken-streak tracking + pressure mechanic

**Files:**
- Modify: `js/chal/triple-dog-dare.js` — extend state init + round loop.

- [ ] **Step 1: Initialize chicken-streak state**

Find the block where `freebies`, `freebieGifts`, etc. are initialized (around line 14-17). Add:

```js
const chickenStreak = {};
activePlayers.forEach(p => chickenStreak[p] = 0);
const chickenStreakAnnounced = {};  // tracks which players have had their first "start" event emit
activePlayers.forEach(p => chickenStreakAnnounced[p] = false);
```

- [ ] **Step 2: Increment streak on redirect, reset on accept**

Find where redirect/pass events are pushed into the chain (look for `action: 'redirect'` or similar). After the redirect is applied, increment:

```js
chickenStreak[player] = (chickenStreak[player] || 0) + 1;
```

Find where acceptance events fire (action: 'accept' + completed: true). After acceptance:

```js
if (chickenStreak[player] >= 3) {
  // Broken streak — narrative event
  chain.push({ type: 'chickenStreakBroken', player, priorStreak: chickenStreak[player], round: roundNum });
  popDelta(player, 1);
}
chickenStreak[player] = 0;
chickenStreakAnnounced[player] = false;
```

- [ ] **Step 3: Emit streak-start + escalate events**

After each round's action resolves, check each active player's streak. Emit:

```js
activePlayers.forEach(p => {
  const streak = chickenStreak[p] || 0;
  if (streak >= 3 && !chickenStreakAnnounced[p]) {
    chain.push({ type: 'chickenStreakStart', player: p, streak, round: roundNum });
    chickenStreakAnnounced[p] = true;
  } else if (streak >= 4 && chickenStreakAnnounced[p]) {
    // Only emit escalate if streak went up since the last round
    chain.push({ type: 'chickenStreakEscalate', player: p, streak, round: roundNum });
  }
});
```

Cap to one `chickenStreakEscalate` event per round (risk mitigation per spec). Sort by streak descending, take first.

- [ ] **Step 4: Apply streak pressure to willingness**

In the willingness roll, add:

```js
const streakPressure = chickenStreak[player] >= 3 ? -0.03 * chickenStreak[player] : 0;
const chance = s.boldness * 0.07 + secondary - fatigue + freebieComfort + earlyBoost + _tddArchBias(player, category) + streakPressure;
```

Note: negative `streakPressure` makes acceptance LESS likely — but that's counter-intuitive. Peer pressure should make them MORE likely to crack and accept. Invert the sign:

```js
const streakPressure = chickenStreak[player] >= 3 ? 0.03 * chickenStreak[player] : 0;
```

So streak=3 gives +0.09 willingness, streak=5 gives +0.15 willingness. They eventually can't chicken out anymore.

- [ ] **Step 5: Popularity tick per round**

After each round, decrement popularity for players on active streaks:

```js
activePlayers.forEach(p => {
  const streak = chickenStreak[p] || 0;
  if (streak >= 3) popDelta(p, -0.5);
});
```

- [ ] **Step 6: Targeted-dare biasing at streak 5+**

Find the dare-drawing block (around line 279 where `_rp(DARE_POOL[category])` is called). Wrap it with streak logic:

```js
let darePool = DARE_POOL[category] || [];
if (chickenStreak[targetPlayer] >= 5) {
  // Bias toward harsh dares when the target is a chronic chicken
  const harsh = darePool.filter(d => d.severity === 'harsh');
  if (harsh.length >= 3) darePool = harsh;
}
const dareObj = _rp(darePool);
```

- [ ] **Step 7: Validate + commit**

```bash
node --check js/chal/triple-dog-dare.js
git add js/chal/triple-dog-dare.js
git commit -m "feat(tdd): chicken-streak tracking with pressure + targeted-dare biasing"
```

---

## Task 4: Dare-category consequences (mishap / fatigue / truth bond / public swing)

**Files:**
- Modify: `js/chal/triple-dog-dare.js` — extend the accept-and-complete branch.

- [ ] **Step 1: Initialize fatigue tracker**

In the state init block (same place as `chickenStreak` from Task 3), add:

```js
const dareFatigue = {};
activePlayers.forEach(p => dareFatigue[p] = 0);
```

Hook `dareFatigue[player]` into the willingness roll's existing `fatigue` term — OR add it as a separate subtraction:

```js
const physicalFatigue = dareFatigue[player] > 0 ? 0.05 * dareFatigue[player] : 0;
const chance = s.boldness * 0.07 + secondary - fatigue - physicalFatigue + freebieComfort + earlyBoost + _tddArchBias(player, category) + streakPressure;
```

Each round, decrement `dareFatigue` for all players:

```js
activePlayers.forEach(p => {
  if (dareFatigue[p] > 0) dareFatigue[p]--;
});
```

- [ ] **Step 2: Write the consequence-dispatch helper**

Add near the bottom of the file (or near the other helpers):

```js
// ── Dare-category post-accept consequences ──
function _applyDareConsequence(player, category, dareObj, triState, timeline, activePlayers) {
  if (category === 'gross') {
    // 25% mishap roll
    if (Math.random() < 0.25) {
      // Mishap fires
      const freebies = triState.freebies;
      if (freebies[player] > 0) freebies[player]--;
      popDelta(player, -1);
      timeline.push({
        type: 'dareMishap', player, category, round: triState.roundNum,
        text: `The dare goes sideways. ${player} gags, recoils, and loses control.`,
        badgeText: 'MISHAP', badgeClass: 'red',
      });
    } else {
      popDelta(player, 1); // +guts rep for clean completion
      timeline.push({
        type: 'dareConsequence', player, category, round: triState.roundNum,
        text: `${player} pulls it off. Crowd is impressed.`,
      });
    }
  }

  if (category === 'physical') {
    triState.dareFatigue[player] = 2; // 2 rounds of debuff
    popDelta(player, 2); // bold physical dare = big rep
    timeline.push({
      type: 'dareConsequence', player, category, round: triState.roundNum,
      text: `${player} is wiped out. Two rounds of recovery needed.`,
    });
  }

  if (category === 'truth') {
    // Resolve named target if dare uses {target} placeholder
    const targetMatch = dareObj.text.match(/\{target\}/);
    let namedTarget = null;
    if (targetMatch) {
      const candidates = activePlayers.filter(p => p !== player);
      namedTarget = candidates[Math.floor(Math.random() * candidates.length)];
    }
    if (namedTarget) {
      const bondDelta = dareObj.severity === 'harsh' ? -3 : -2;
      addBond(player, namedTarget, bondDelta);
      popDelta(namedTarget, -1); // exposed = rep hit
      popDelta(player, 1); // honesty rep
      timeline.push({
        type: 'dareConsequence', player, namedTarget, category, round: triState.roundNum,
        text: `${player} tells the truth about ${namedTarget}. The room gets quiet.`,
        bondDelta, players: [player, namedTarget],
      });
    } else {
      popDelta(player, 1);
      timeline.push({
        type: 'dareConsequence', player, category, round: triState.roundNum,
        text: `${player} reveals something the crowd didn't know.`,
      });
    }
  }

  if (category === 'public') {
    const swing = dareObj.severity === 'harsh' ? 3 : 2;
    popDelta(player, swing);
    timeline.push({
      type: 'dareConsequence', player, category, round: triState.roundNum,
      text: `${player} goes all in. The crowd is LOUD.`,
      popDelta: swing,
    });
  }
}
```

Note: the helper expects `triState` to include `freebies`, `dareFatigue`, `roundNum`. Consolidate your loop-local state into a `triState` object before calling — or pass individual refs. Pick whichever matches the existing style.

- [ ] **Step 3: Wire the helper into the accept-and-complete branch**

Find the block in the round loop where a dare is marked completed (around line 290 where `chain.push({ player: activeSpinner, action: 'accept', completed: true, freebieEarned: true, ...})`). After that push, call:

```js
_applyDareConsequence(activeSpinner, category, dareObj, triState, timeline, activePlayers);
```

(Use `timeline` if that's your accumulator, or `chain` — match the existing name.)

Do the same for any other "dare completed" branches in the round logic.

- [ ] **Step 4: Extend dare-text template resolution for {target} placeholder**

When a truth dare with `{target}` is drawn, the text must be replaced with a named player before it's displayed. Find the block that renders the dare text into the timeline event (around line 279-290). Wrap with:

```js
let dareText = dareObj.text;
if (dareText.includes('{target}')) {
  const candidates = activePlayers.filter(p => p !== activeSpinner);
  const target = candidates[Math.floor(Math.random() * candidates.length)];
  dareText = dareText.replace(/\{target\}/g, target);
  dareObj._resolvedTarget = target;  // for consequence lookup
}
```

- [ ] **Step 5: Validate + commit**

```bash
node --check js/chal/triple-dog-dare.js
git add js/chal/triple-dog-dare.js
git commit -m "feat(tdd): dare-category consequences (mishap/fatigue/truth-bond/public-swing)"
```

---

## Task 5: Public-reaction events per round

**Files:**
- Modify: `js/chal/triple-dog-dare.js` — add at end of each round loop iteration.

- [ ] **Step 1: Add reaction generator after each round resolves**

At the end of each round's loop body (inside `for (let roundNum = 1; roundNum <= maxRounds; roundNum++) { ... }`), add:

```js
// Public reaction generator
const roundReactions = [];

// Look at events that fired this round
const thisRoundEvents = timeline.filter(e => e.round === roundNum);

// Gross mishap → disgust reaction
const grossMishap = thisRoundEvents.find(e => e.type === 'dareMishap' && e.category === 'gross');
if (grossMishap) {
  roundReactions.push({
    type: 'publicReaction', subtype: 'disgust', round: roundNum,
    players: [grossMishap.player],
    text: `The crowd GAGS. ${grossMishap.player} just lost a bit of respect.`,
    popDelta: -1,
  });
  popDelta(grossMishap.player, -1);
}

// Bold physical completion → cheer reaction
const physicalSuccess = thisRoundEvents.find(e => e.type === 'dareConsequence' && e.category === 'physical');
if (physicalSuccess) {
  roundReactions.push({
    type: 'publicReaction', subtype: 'cheer', round: roundNum,
    players: [physicalSuccess.player],
    text: `The crowd WHOOPS for ${physicalSuccess.player}. That was solid.`,
    popDelta: 1,
  });
  popDelta(physicalSuccess.player, 1);
}

// Public dare → amplified
const publicEvent = thisRoundEvents.find(e => e.type === 'dareConsequence' && e.category === 'public');
if (publicEvent) {
  roundReactions.push({
    type: 'publicReaction', subtype: 'spotlight', round: roundNum,
    players: [publicEvent.player],
    text: `${publicEvent.player} has the whole camp's attention. They're either going to love or hate what they see.`,
  });
}

// Truth dare → lingering tension
const truthEvent = thisRoundEvents.find(e => e.type === 'dareConsequence' && e.category === 'truth');
if (truthEvent && truthEvent.namedTarget) {
  roundReactions.push({
    type: 'publicReaction', subtype: 'tension', round: roundNum,
    players: [truthEvent.player, truthEvent.namedTarget],
    text: `${truthEvent.namedTarget} didn't see that coming. The game just changed.`,
  });
}

// Chicken streak → crowd turning
const chickenAt3Plus = activePlayers.filter(p => (chickenStreak[p] || 0) >= 3);
if (chickenAt3Plus.length) {
  const worst = chickenAt3Plus.sort((a, b) => chickenStreak[b] - chickenStreak[a])[0];
  roundReactions.push({
    type: 'publicReaction', subtype: 'turning', round: roundNum,
    players: [worst],
    text: `The crowd is starting to turn on ${worst}. Every pass-off makes it worse.`,
    popDelta: -0.5,
  });
}

// Push at most 2 reactions per round (keep the narrative tight)
roundReactions.slice(0, 2).forEach(r => timeline.push(r));
```

- [ ] **Step 2: Validate + commit**

```bash
node --check js/chal/triple-dog-dare.js
git add js/chal/triple-dog-dare.js
git commit -m "feat(tdd): public-reaction events per round (disgust/cheer/spotlight/tension/turning)"
```

---

## Task 6: CSS infrastructure — Playground Chaos identity

**Files:**
- Modify: `js/chal/triple-dog-dare.js` — add `TDD_STYLES` template literal.

- [ ] **Step 1: Insert the full CSS block**

Add at module-scope, near the top of the file after the imports:

```js
const TDD_STYLES = `
  /* ═══ I TRIPLE DOG DARE YOU — PLAYGROUND CHAOS ═══
     Identity: chalk on blacktop + sharpie scrawl on notebook paper.
     Hand-drawn wobbly SVGs, childlike energy. Distinct from every
     other challenge in the codebase (motocross orange, ranger tan,
     dungeon stone, cafeteria slime, night-vision green, tournament
     black, ranger khaki).
  */

  .tdd-page {
    background:#2a2a2a;
    color:#f0ece2;
    font-family:'Kalam','Patrick Hand','Chalkboard SE','Comic Sans MS',cursive;
    position:relative; overflow:hidden; padding:30px 20px; min-height:600px;
  }
  .tdd-page::before {
    content:''; position:absolute; inset:0; pointer-events:none; z-index:0;
    background:
      radial-gradient(circle at 15% 25%, rgba(240,236,226,0.08) 0%, transparent 8%),
      radial-gradient(circle at 75% 40%, rgba(240,236,226,0.05) 0%, transparent 10%),
      radial-gradient(circle at 45% 70%, rgba(240,236,226,0.07) 0%, transparent 9%),
      radial-gradient(circle at 85% 85%, rgba(240,236,226,0.04) 0%, transparent 7%);
    animation: tdd-chalk-dust-drift 12s ease-in-out infinite alternate;
  }
  @keyframes tdd-chalk-dust-drift {
    0%,100% { transform:translate(0,0) }
    50% { transform:translate(3px,-4px) }
  }

  /* Header — sharpie scrawl on chalkboard */
  .tdd-header {
    position:relative; z-index:2; text-align:center; padding:20px 12px 16px;
    border-bottom:3px solid rgba(240,236,226,0.25);
    border-bottom-style:dashed; margin-bottom:16px;
  }
  .tdd-title {
    font-family:'Permanent Marker','Kalam',cursive;
    font-size:38px; font-weight:900; letter-spacing:2px;
    color:#f0ece2; text-transform:uppercase;
    text-shadow:2px 3px 0 rgba(0,0,0,0.4);
    transform:rotate(-1.5deg); display:inline-block;
  }
  .tdd-subtitle {
    font-size:13px; color:#ffd447; letter-spacing:1px;
    margin-top:10px; font-family:'Kalam',cursive;
  }
  .tdd-chalk-stars {
    font-size:18px; color:#ffd447; letter-spacing:8px; margin-top:6px; opacity:0.7;
  }

  /* Recess-wall scoreboard (sidebar) */
  .tdd-scoreboard {
    position:relative; z-index:2; margin-bottom:20px;
    padding:14px 18px; border-radius:6px;
    background:rgba(0,0,0,0.25);
    border:2px dashed rgba(240,236,226,0.25);
  }
  .tdd-scoreboard-title {
    font-family:'Permanent Marker',cursive; font-size:14px; letter-spacing:2px;
    color:#f0ece2; text-transform:uppercase; margin-bottom:10px;
    transform:rotate(-0.5deg); display:inline-block;
  }
  .tdd-scoreboard-row {
    display:flex; align-items:center; gap:10px;
    padding:6px 4px; font-family:'Kalam',cursive; font-size:15px;
    border-bottom:1px dotted rgba(240,236,226,0.15);
  }
  .tdd-scoreboard-row:last-child { border-bottom:none; }
  .tdd-scoreboard-name { flex:1; color:#f0ece2; }
  .tdd-scoreboard-name--eliminated { text-decoration:line-through; text-decoration-color:#d92424; text-decoration-thickness:3px; opacity:0.6; }

  /* Friendship bracelet tokens */
  .tdd-bracelet-stack { display:inline-flex; gap:2px; }
  .tdd-bracelet {
    width:8px; height:16px; border-radius:3px;
    background:repeating-linear-gradient(90deg,
      var(--b-color-a,#ff2d87) 0 2px,
      var(--b-color-b,#3ef0ff) 2px 4px);
    border:1px solid rgba(0,0,0,0.3);
  }
  /* Multiple color variants */
  .tdd-bracelet:nth-child(1) { --b-color-a:#ff2d87; --b-color-b:#ffe83a; }
  .tdd-bracelet:nth-child(2) { --b-color-a:#3ef0ff; --b-color-b:#3aff7a; }
  .tdd-bracelet:nth-child(3) { --b-color-a:#ffd447; --b-color-b:#ff2d87; }
  .tdd-bracelet:nth-child(4) { --b-color-a:#3aff7a; --b-color-b:#3ef0ff; }
  .tdd-bracelet:nth-child(5) { --b-color-a:#ff2d87; --b-color-b:#3ef0ff; }
  .tdd-bracelet:nth-child(6) { --b-color-a:#ffe83a; --b-color-b:#3aff7a; }

  /* Chicken meter */
  .tdd-chicken { display:inline-block; font-size:18px; margin-left:4px; transition:transform 0.3s cubic-bezier(0.2,1.5,0.5,1); }
  .tdd-chicken[data-streak="3"] { transform:scale(1.0); }
  .tdd-chicken[data-streak="4"] { transform:scale(1.35); }
  .tdd-chicken[data-streak="5"] { transform:scale(1.7); }
  .tdd-chicken[data-streak="6"] { transform:scale(2.0); }

  /* Cards (general) */
  .tdd-card {
    position:relative; z-index:2; margin-bottom:10px;
    padding:14px 18px; border-radius:4px;
    font-family:'Kalam',cursive; font-size:14px; line-height:1.5;
    animation: tdd-card-fade 0.5s ease-out both;
  }
  @keyframes tdd-card-fade { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }

  .tdd-card--chalk {
    background:rgba(0,0,0,0.3);
    color:#f0ece2;
    border:2px dashed rgba(240,236,226,0.2);
  }
  .tdd-card--paper {
    background:#f4e8c8;
    color:#1a1a1a;
    border:1px solid rgba(139,90,43,0.3);
    box-shadow:2px 3px 6px rgba(0,0,0,0.35);
  }
  .tdd-card--chris {
    background:rgba(40,40,40,0.6);
    border-left:4px solid #ffd447;
  }

  /* Category highlighter stripes */
  .tdd-cat { display:inline-block; padding:2px 8px; border-radius:3px;
    font-family:'Permanent Marker',cursive; font-size:11px; letter-spacing:2px;
    text-transform:uppercase; font-weight:700; transform:rotate(-2deg);
  }
  .tdd-cat--gross    { background:#ff2d87; color:#f0ece2; }
  .tdd-cat--physical { background:#ffe83a; color:#1a1a1a; }
  .tdd-cat--truth    { background:#3ef0ff; color:#1a1a1a; }
  .tdd-cat--public   { background:#3aff7a; color:#1a1a1a; }

  /* Dare text on paper — sharpie */
  .tdd-dare-text {
    font-family:'Permanent Marker','Kalam',cursive;
    font-size:22px; line-height:1.35; color:#1a1a1a;
    transform:rotate(-0.3deg); margin:10px 0;
  }
  /* Notebook lines */
  .tdd-card--paper::before {
    content:''; position:absolute; inset:10px 16px;
    background:repeating-linear-gradient(to bottom,
      transparent 0 24px, rgba(100,120,150,0.12) 24px 25px);
    pointer-events:none;
  }
  .tdd-card--paper > * { position:relative; z-index:1; }

  /* Spinner */
  .tdd-spinner-wrap {
    display:flex; flex-direction:column; align-items:center; gap:10px;
    padding:20px 0; margin:10px auto;
  }
  .tdd-spinner-svg { width:220px; height:220px; overflow:visible; }
  .tdd-spinner-circle {
    fill:none; stroke:#f0ece2; stroke-width:4;
    stroke-dasharray:5 3 7 4 6 2 9 3;
    stroke-linecap:round;
  }
  .tdd-spinner-arrow {
    stroke:#1a1a1a; stroke-width:5; stroke-linecap:round;
    fill:#1a1a1a;
    transform-origin:center;
    transition:transform 0.1s linear;
  }
  .tdd-spinner-result {
    font-family:'Permanent Marker',cursive; font-size:26px;
    color:#ffd447; letter-spacing:2px; transform:rotate(-2deg);
    opacity:0; transition:opacity 0.4s ease-out 0.2s;
  }
  .tdd-spinner-result--visible { opacity:1; }

  /* Chalk-burst particles (on dare accept) */
  .tdd-burst-wrap { position:relative; display:inline-block; }
  .tdd-burst { position:absolute; top:50%; left:50%; width:2px; height:14px;
    background:#f0ece2; transform-origin:center bottom;
    animation: tdd-burst 0.4s ease-out forwards;
  }
  @keyframes tdd-burst {
    0% { opacity:0; transform:translate(-50%,-50%) rotate(var(--a,0deg)) scaleY(0); }
    30% { opacity:1; transform:translate(-50%,-50%) rotate(var(--a,0deg)) scaleY(1); }
    100% { opacity:0; transform:translate(-50%,-50%) rotate(var(--a,0deg)) scaleY(1.5) translateY(-8px); }
  }

  /* Chicken-meter setpiece */
  .tdd-chicken-setpiece {
    text-align:center; padding:26px;
    background:radial-gradient(ellipse at center,
      rgba(255,212,71,0.12) 0%, rgba(0,0,0,0.3) 70%);
    border-radius:6px; margin:12px 0;
  }
  .tdd-chicken-big {
    font-size:72px; line-height:1; display:inline-block;
    animation: tdd-chicken-grow 0.6s cubic-bezier(0.2,1.5,0.5,1) both;
  }
  @keyframes tdd-chicken-grow {
    0% { transform:scale(0.2) rotate(-10deg); opacity:0; }
    70% { transform:scale(1.2) rotate(4deg); opacity:1; }
    100% { transform:scale(1) rotate(0deg); }
  }
  .tdd-chicken-caption {
    font-family:'Permanent Marker',cursive; font-size:18px;
    color:#ffd447; letter-spacing:2px; margin-top:10px; text-transform:uppercase;
  }
  .tdd-crowd-figures {
    font-family:'Kalam',cursive; font-size:22px; color:#f0ece2;
    letter-spacing:10px; margin-top:12px; opacity:0.6;
    animation: tdd-crowd-fade 0.8s ease-out 0.4s both;
  }
  @keyframes tdd-crowd-fade { 0%{opacity:0} 100%{opacity:0.6} }

  /* Bracelet-gift card */
  .tdd-gift-card {
    display:flex; align-items:center; gap:16px;
    padding:16px; border-radius:6px;
    background:rgba(62,240,255,0.08);
    border:2px dashed rgba(62,240,255,0.35);
  }
  .tdd-gift-from, .tdd-gift-to { flex:0 0 auto; text-align:center; }
  .tdd-gift-pass {
    flex:1; text-align:center; position:relative;
    font-family:'Permanent Marker',cursive; font-size:13px;
    color:#3ef0ff; letter-spacing:3px;
  }
  .tdd-gift-bracelet {
    display:inline-block; width:30px; height:10px; border-radius:4px;
    background:repeating-linear-gradient(90deg,
      #ff2d87 0 3px, #3ef0ff 3px 6px, #3aff7a 6px 9px);
    animation: tdd-bracelet-slide 0.8s cubic-bezier(0.4,0.1,0.3,1) both;
  }
  @keyframes tdd-bracelet-slide {
    0% { transform:translateX(-60px); opacity:0; }
    50% { opacity:1; }
    100% { transform:translateX(60px); opacity:1; }
  }

  /* Public reaction card */
  .tdd-reaction {
    padding:12px 16px; margin:8px 0;
    background:rgba(0,0,0,0.25);
    border-left:3px solid #ffd447;
    font-style:italic; font-size:13px;
  }
  .tdd-reaction-crowd {
    font-size:20px; letter-spacing:8px; color:#f0ece2;
    opacity:0.5; margin-top:6px;
  }

  /* Elimination setpiece */
  .tdd-elim {
    text-align:center; padding:32px 20px; margin:20px 0;
    background:repeating-linear-gradient(45deg,
      rgba(217,36,36,0.1) 0 30px, rgba(0,0,0,0.4) 30px 60px);
    border:3px solid #d92424; border-radius:6px;
    animation: tdd-card-fade 0.6s ease-out both;
  }
  .tdd-elim-name {
    font-family:'Permanent Marker',cursive; font-size:42px;
    color:#f0ece2; letter-spacing:3px; transform:rotate(-2deg);
    display:inline-block; position:relative;
  }
  .tdd-elim-slash {
    position:absolute; top:50%; left:-6%; right:-6%; height:6px;
    background:#d92424; transform:rotate(-6deg);
    animation: tdd-slash 0.8s cubic-bezier(0.6,0.1,0.3,1) 0.3s both;
    transform-origin:left center;
  }
  @keyframes tdd-slash {
    0% { transform:rotate(-6deg) scaleX(0); }
    100% { transform:rotate(-6deg) scaleX(1); }
  }
  .tdd-elim-caption {
    margin-top:18px; font-family:'Kalam',cursive; font-size:16px;
    color:#f4e8c8; font-style:italic;
  }

  /* Reveal button */
  .tdd-btn-reveal {
    display:block; margin:20px auto; padding:10px 28px;
    background:transparent;
    border:3px dashed #ffd447; color:#ffd447;
    font-family:'Permanent Marker',cursive; font-size:14px;
    letter-spacing:3px; text-transform:uppercase;
    cursor:pointer; border-radius:4px;
    transition:transform 0.2s;
  }
  .tdd-btn-reveal:hover { transform:rotate(-1deg) scale(1.03); }
  .tdd-btn-reveal-all {
    display:block; text-align:center; font-family:'Kalam',cursive;
    font-size:12px; color:#ffd447; opacity:0.6;
    cursor:pointer; text-decoration:underline;
    margin-top:4px;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .tdd-page::before, .tdd-card, .tdd-chicken-big, .tdd-crowd-figures,
    .tdd-gift-bracelet, .tdd-elim, .tdd-elim-slash, .tdd-burst,
    .tdd-spinner-arrow, .tdd-chicken { animation:none !important; transition:none !important; }
    .tdd-spinner-result--visible { opacity:1 !important; }
  }
`;
```

- [ ] **Step 2: Validate + commit**

```bash
node --check js/chal/triple-dog-dare.js
git add js/chal/triple-dog-dare.js
git commit -m "feat(tdd): CSS infrastructure — Playground Chaos identity (~300 lines)"
```

---

## Task 7: Consolidated `rpBuildTripleDogDare` + reveal engine

**Files:**
- Modify: `js/chal/triple-dog-dare.js` — add `rpBuildTripleDogDare` + `_tddReveal` + `_tddRevealAll`.

- [ ] **Step 1: Add the reveal engine**

Near the bottom of the file:

```js
const _tvState = {};

function _tddReveal(stateKey, totalSteps) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];
  if (st.idx >= totalSteps - 1) return;
  st.idx++;
  const el = document.getElementById(`tdd-step-${stateKey}-${st.idx}`);
  if (el) {
    el.style.display = '';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Typewriter for dare-reveal
    if (el.dataset.typewriter === '1') {
      const target = el.querySelector('.tdd-dare-text');
      if (target) {
        const fullText = target.dataset.fullText || target.textContent;
        target.dataset.fullText = fullText;
        target.textContent = '';
        const speed = fullText.length > 60 ? 30 : 50;
        let i = 0;
        const tick = () => {
          if (i > fullText.length) return;
          target.textContent = fullText.slice(0, i);
          i++;
          if (i <= fullText.length) setTimeout(tick, speed);
        };
        tick();
      }
    }

    // Spinner physics rotation
    if (el.dataset.spinnerTarget) {
      const arrow = el.querySelector('.tdd-spinner-arrow');
      const resultLabel = el.querySelector('.tdd-spinner-result');
      const targetAngle = parseFloat(el.dataset.spinnerTarget);
      if (arrow) {
        const start = performance.now();
        const duration = 1400;
        const totalRotation = 360 * 3 + targetAngle;
        const spin = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3); // cubic-out
          arrow.style.transform = `rotate(${totalRotation * eased}deg)`;
          if (t < 1) requestAnimationFrame(spin);
          else {
            // Scritch-settle
            let osc = 0;
            const settle = () => {
              const jitter = (osc % 2 === 0 ? 4 : -3) - osc * 0.8;
              arrow.style.transform = `rotate(${totalRotation + jitter}deg)`;
              osc++;
              if (osc < 4) setTimeout(settle, 100);
              else {
                arrow.style.transform = `rotate(${totalRotation}deg)`;
                if (resultLabel) resultLabel.classList.add('tdd-spinner-result--visible');
              }
            };
            setTimeout(settle, 80);
          }
        };
        requestAnimationFrame(spin);
      }
    }
  }

  // Update button
  const btn = document.getElementById(`tdd-btn-${stateKey}`);
  if (btn) {
    if (st.idx >= totalSteps - 1) {
      const ctrl = document.getElementById(`tdd-controls-${stateKey}`);
      if (ctrl) ctrl.style.display = 'none';
    } else {
      btn.textContent = `▶ NEXT DARE (${st.idx + 2}/${totalSteps})`;
    }
  }
}

function _tddRevealAll(stateKey, totalSteps) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  _tvState[stateKey].idx = totalSteps - 1;
  for (let i = 0; i < totalSteps; i++) {
    const el = document.getElementById(`tdd-step-${stateKey}-${i}`);
    if (el) {
      el.style.display = '';
      // Snap typewriter to final state
      if (el.dataset.typewriter === '1') {
        const target = el.querySelector('.tdd-dare-text');
        if (target && target.dataset.fullText) target.textContent = target.dataset.fullText;
      }
      // Snap spinner to final angle
      if (el.dataset.spinnerTarget) {
        const arrow = el.querySelector('.tdd-spinner-arrow');
        const resultLabel = el.querySelector('.tdd-spinner-result');
        if (arrow) arrow.style.transform = `rotate(${parseFloat(el.dataset.spinnerTarget)}deg)`;
        if (resultLabel) resultLabel.classList.add('tdd-spinner-result--visible');
      }
    }
  }
  const ctrl = document.getElementById(`tdd-controls-${stateKey}`);
  if (ctrl) ctrl.style.display = 'none';
}
```

- [ ] **Step 2: Add `rpBuildTripleDogDare`**

```js
export function rpBuildTripleDogDare(ep) {
  const tdd = ep.tripleDogDare;
  if (!tdd) return '';

  const stateKey = `tdd_reveal_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const timeline = tdd.timeline || tdd.chain || []; // match whatever field the sim uses

  // Pre-compute per-step render
  const steps = timeline.map((evt, i) => ({ evt, html: _renderTDDStep(evt, tdd) }));

  let html = `<style>${TDD_STYLES}</style>`;
  html += `<div class="tdd-page rp-page">`;

  // Header
  html += `<div class="tdd-header">`;
  html += `<div class="tdd-title">I Triple Dog Dare You!</div>`;
  html += `<div class="tdd-chalk-stars">★ ★ ★</div>`;
  html += `<div class="tdd-subtitle">The last one standing wins immunity · The first one to chicken out goes home</div>`;
  html += `</div>`;

  // Scoreboard (static snapshot — uses final state)
  html += _renderTDDScoreboard(tdd);

  // Steps
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const visible = i <= state.idx;
    const dataAttrs = _tddStepDataAttrs(s.evt);
    html += `<div id="tdd-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}"${dataAttrs}>${s.html}</div>`;
  }

  // Controls
  const allRevealed = state.idx >= steps.length - 1;
  html += `<div id="tdd-controls-${stateKey}" style="${allRevealed ? 'display:none' : 'text-align:center;margin-top:20px'}">`;
  html += `<button class="tdd-btn-reveal" id="tdd-btn-${stateKey}" onclick="window._tddReveal('${stateKey}',${steps.length})">▶ NEXT DARE (${state.idx + 2}/${steps.length})</button>`;
  html += `<span class="tdd-btn-reveal-all" onclick="window._tddRevealAll('${stateKey}',${steps.length})">reveal all</span>`;
  html += `</div>`;

  window._tddReveal = _tddReveal;
  window._tddRevealAll = _tddRevealAll;

  html += `</div>`;
  return html;
}

function _tddStepDataAttrs(evt) {
  const attrs = [];
  if (evt.type === 'dareReveal') attrs.push('data-typewriter="1"');
  if (evt.type === 'spinnerLand' && evt._spinnerAngle != null) attrs.push(`data-spinner-target="${evt._spinnerAngle}"`);
  return attrs.length ? ' ' + attrs.join(' ') : '';
}
```

- [ ] **Step 3: Validate + commit**

```bash
node --check js/chal/triple-dog-dare.js
git add js/chal/triple-dog-dare.js
git commit -m "feat(tdd): rpBuildTripleDogDare consolidated + reveal engine with spinner physics"
```

---

## Task 8: Event renderers (`_renderTDDStep` + helpers)

**Files:**
- Modify: `js/chal/triple-dog-dare.js` — add `_renderTDDStep` and small sub-renderers.

- [ ] **Step 1: Write `_renderTDDStep` dispatching on event type**

```js
function _renderTDDStep(evt, tdd) {
  if (evt.type === 'tddIntro') return _renderIntro(evt);
  if (evt.type === 'spinnerLand') return _renderSpinner(evt);
  if (evt.type === 'dareReveal') return _renderDareCard(evt);
  if (evt.type === 'dareAccept' || evt.type === 'dareAttempt' || evt.type === 'accept') return _renderAccept(evt);
  if (evt.type === 'dareRedirect' || evt.type === 'redirect') return _renderRedirect(evt);
  if (evt.type === 'freebieGift') return _renderFreebieGift(evt);
  if (evt.type === 'dareMishap') return _renderMishap(evt);
  if (evt.type === 'dareConsequence') return _renderConsequence(evt);
  if (evt.type === 'chickenStreakStart' || evt.type === 'chickenStreakEscalate') return _renderChickenMeter(evt);
  if (evt.type === 'chickenStreakBroken') return _renderChickenBroken(evt);
  if (evt.type === 'publicReaction') return _renderPublicReaction(evt);
  if (evt.type === 'dareElimination' || evt.type === 'elimination') return _renderElimination(evt, tdd);
  return `<div class="tdd-card tdd-card--chalk">${evt.text || ''}</div>`;
}

function _renderIntro(evt) {
  return `<div class="tdd-card tdd-card--chris">
    <span class="tdd-chris-tag">📢 CHRIS</span>
    <div style="margin-top:6px">${evt.text || ''}</div>
  </div>`;
}

function _renderSpinner(evt) {
  const angle = evt._spinnerAngle ?? 0;
  return `<div class="tdd-spinner-wrap">
    <svg class="tdd-spinner-svg" viewBox="0 0 220 220">
      <circle class="tdd-spinner-circle" cx="110" cy="110" r="90"/>
      <g class="tdd-spinner-arrow-group">
        <path class="tdd-spinner-arrow" d="M 110 110 L 110 20 L 105 30 M 110 20 L 115 30" fill="none"/>
      </g>
    </svg>
    <div class="tdd-spinner-result">▸ ${evt.player || '?'}</div>
  </div>`;
}

function _renderDareCard(evt) {
  const category = evt.category || 'gross';
  const dareText = evt.text || evt.dareText || '';
  return `<div class="tdd-card tdd-card--paper">
    <span class="tdd-cat tdd-cat--${category}">${category}</span>
    <div class="tdd-dare-text" data-full-text="${_htmlEscape(dareText)}">${_htmlEscape(dareText)}</div>
    <div style="font-family:'Kalam',cursive;font-size:11px;color:#8b5a2b;letter-spacing:1px;margin-top:6px">— for ${evt.player || '?'} —</div>
  </div>`;
}

function _renderAccept(evt) {
  const burst = [0,45,90,135,180,225,270,315].map(a =>
    `<div class="tdd-burst" style="--a:${a}deg"></div>`
  ).join('');
  return `<div class="tdd-card tdd-card--chalk">
    <div class="tdd-burst-wrap">${burst}<strong>${evt.player || '?'}</strong></div>
    accepts. ${evt.text || ''}
  </div>`;
}

function _renderRedirect(evt) {
  return `<div class="tdd-card tdd-card--chalk">
    <strong>${evt.player || '?'}</strong> chickens — redirects to <strong>${evt.target || '?'}</strong>. ${evt.text || ''}
  </div>`;
}

function _renderFreebieGift(evt) {
  return `<div class="tdd-gift-card">
    <div class="tdd-gift-from">${evt.from || evt.donor || '?'}</div>
    <div class="tdd-gift-pass">
      <div>PASS →</div>
      <span class="tdd-gift-bracelet"></span>
    </div>
    <div class="tdd-gift-to">${evt.to || evt.requester || '?'}</div>
    <div style="flex-basis:100%;text-align:center;font-size:12px;color:#f0ece2;margin-top:8px">${evt.text || ''}</div>
  </div>`;
}

function _renderMishap(evt) {
  return `<div class="tdd-card tdd-card--chalk" style="border-color:#d92424">
    <span class="tdd-cat tdd-cat--gross">MISHAP</span>
    <div style="margin-top:6px"><strong>${evt.player}</strong> — ${evt.text || ''}</div>
  </div>`;
}

function _renderConsequence(evt) {
  const category = evt.category || 'gross';
  return `<div class="tdd-card tdd-card--chalk">
    <span class="tdd-cat tdd-cat--${category}">${category} result</span>
    <div style="margin-top:6px">${evt.text || ''}</div>
  </div>`;
}

function _renderChickenMeter(evt) {
  const streak = evt.streak || 3;
  const chicken = streak <= 3 ? '🐣' : streak === 4 ? '🐔' : '🐓';
  const crowdCount = Math.min(8, 2 + streak);
  const crowd = '𖨆 '.repeat(crowdCount).trim();
  return `<div class="tdd-chicken-setpiece">
    <div class="tdd-chicken-big" data-streak="${streak}">${chicken}</div>
    <div class="tdd-chicken-caption">CHICKEN METER · ${evt.player} · ${streak} passes</div>
    <div class="tdd-crowd-figures">${crowd}</div>
  </div>`;
}

function _renderChickenBroken(evt) {
  return `<div class="tdd-card tdd-card--chalk" style="border-color:#3aff7a">
    <strong>${evt.player}</strong> finally accepts. Streak broken at ${evt.priorStreak || '?'}. The crowd respects it a little more.
  </div>`;
}

function _renderPublicReaction(evt) {
  const crowd = '𖨆 '.repeat(5).trim();
  return `<div class="tdd-reaction">
    <div>${evt.text || ''}</div>
    <div class="tdd-reaction-crowd">${crowd}</div>
  </div>`;
}

function _renderElimination(evt, tdd) {
  return `<div class="tdd-elim">
    <div class="tdd-elim-name">
      ${evt.player || '?'}
      <span class="tdd-elim-slash"></span>
    </div>
    <div class="tdd-elim-caption">${evt.text || 'Chickens out. Eliminated.'}</div>
  </div>`;
}

function _htmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function _renderTDDScoreboard(tdd) {
  const players = tdd.activePlayers || Object.keys(tdd.finalFreebies || {});
  const freebies = tdd.finalFreebies || tdd.freebies || {};
  const chickens = tdd.finalChickens || tdd.chickenStreak || {};
  const eliminated = tdd.eliminated || tdd.eliminatedPlayer || null;

  let html = `<div class="tdd-scoreboard">`;
  html += `<div class="tdd-scoreboard-title">· THE RECESS WALL ·</div>`;
  players.forEach(p => {
    const n = freebies[p] || 0;
    const bracelets = Array.from({ length: Math.min(6, n) }, () => `<span class="tdd-bracelet"></span>`).join('');
    const streak = chickens[p] || 0;
    const chicken = streak >= 3 ? `<span class="tdd-chicken" data-streak="${streak}">🐔</span>` : '';
    const elimClass = p === eliminated ? ' tdd-scoreboard-name--eliminated' : '';
    html += `<div class="tdd-scoreboard-row">
      <span class="tdd-scoreboard-name${elimClass}">${p}</span>
      <span class="tdd-bracelet-stack">${bracelets}</span>
      ${chicken}
    </div>`;
  });
  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Add spinner-angle computation to the sim**

In `simulateTripleDogDare`, where you emit `spinnerLand` events, compute the target angle so the arrow lands on the correct player visually. Add to the event object:

```js
// Compute angle: each player gets an equal wedge of 360deg
const idx = activePlayers.indexOf(landedPlayer);
const wedge = 360 / activePlayers.length;
const spinnerAngle = idx * wedge + wedge / 2; // center of their wedge
timeline.push({ type: 'spinnerLand', player: landedPlayer, round: roundNum, _spinnerAngle: spinnerAngle });
```

- [ ] **Step 3: Validate + commit**

```bash
node --check js/chal/triple-dog-dare.js
git add js/chal/triple-dog-dare.js
git commit -m "feat(tdd): per-event renderers + scoreboard + spinner-angle wiring"
```

---

## Task 9: Text pools for new event types + Chris commentary

**Files:**
- Modify: `js/chal/triple-dog-dare.js` — add text-pool constants + integrate into renderers.

- [ ] **Step 1: Add text pools**

```js
const TDD_CHRIS_INTRO_TEXTS = [
  '"Final few, let\'s play a game. I Triple Dog Dare You!"',
  '"Rules are simple: spin, accept or pass. Refuse three times in a row and the crowd turns on you."',
  '"Last one standing wins immunity. First one to chicken out? Going home. Let\'s spin."',
];

const TDD_MISHAP_TEXTS = {
  gross: [
    (player, dareText) => `${player} tries to ${dareText}. Gags halfway. Full retreat.`,
    (player, dareText) => `${player} commits to it. Body does not. Everyone looks away.`,
    (player, dareText) => `${player} swallows wrong. Chef hands them water. They don't drink it.`,
  ],
};

const TDD_CONSEQUENCE_TEXTS = {
  gross_success: [
    (p) => `${p} pulls it off clean. The crowd respects it grudgingly.`,
    (p) => `${p} does NOT flinch. The rep tick is earned.`,
  ],
  physical_success: [
    (p) => `${p} is drained. Two rounds to recover.`,
    (p) => `${p} collapses after. Still counts.`,
  ],
  truth_resolved: [
    (p, t) => `${p} looks ${t} in the eye and tells the truth. ${t} does not move.`,
    (p, t) => `${p} admits it. ${t} nods slowly. This will come back.`,
  ],
  public_accepted: [
    (p) => `${p} commits fully. The whole camp stops what they're doing to watch.`,
    (p) => `${p} is the spectacle. Everyone is in on it. Even the raccoons.`,
  ],
};

const TDD_PUBLIC_REACTION_TEXTS = {
  disgust: [
    (p) => `The crowd gags. ${p} loses a bit of respect.`,
    (p) => `Several onlookers turn green. ${p} does not.`,
  ],
  cheer: [
    (p) => `The crowd whoops. ${p} earned that.`,
    (p) => `Heather actually claps. Heather. ${p} is stunned.`,
  ],
  spotlight: [
    (p) => `${p} has the whole camp watching. This is either going in the highlight reel or the lowlight reel.`,
  ],
  tension: [
    (p, t) => `${t} doesn't say anything. ${t} will remember this.`,
    (p, t) => `The room holds its breath. ${p} and ${t} stare at each other.`,
  ],
  turning: [
    (p) => `The crowd is starting to turn on ${p}. Every pass makes it worse.`,
    (p) => `Eyes narrow. ${p} can feel the shift.`,
  ],
};

const TDD_CHICKEN_ESCALATE_TEXTS = [
  (p, s) => `${p} passes again. That's ${s} in a row. The chicken is growing.`,
  (p, s) => `${s} passes. ${p} is starting to look the part.`,
];

const TDD_CHICKEN_BROKEN_TEXTS = [
  (p, s) => `${p} finally accepts after ${s} passes. Streak broken. Some respect reclaimed.`,
  (p, s) => `${s} passes — and ${p} steps up. The crowd murmurs approval.`,
];

const TDD_AFTERMATH_TEXTS = [
  (elim) => `${elim} walks to the Dock of Shame. The crowd doesn't boo. They already got their show.`,
  (elim) => `${elim} hands back the last freebie. Nobody knows what to do with it.`,
];
```

- [ ] **Step 2: Wire into emitter sites**

Find every place in the sim where a new event is pushed (`tddIntro`, `dareMishap`, `chickenStreakEscalate`, etc.). Replace the plain fallback text with `_rp(POOL)(args)` calls.

- [ ] **Step 3: Validate + commit**

```bash
node --check js/chal/triple-dog-dare.js
git add js/chal/triple-dog-dare.js
git commit -m "feat(tdd): text pools for all new event types"
```

---

## Task 10: Replace legacy VP screens

**Files:**
- Modify: `js/vp-screens.js` — replace 3 screens with 1.

- [ ] **Step 1: Find the TDD block**

```bash
grep -n "rpBuildTripleDogDare" js/vp-screens.js
```

- [ ] **Step 2: Replace the block**

Current (around line 10484-10487):

```js
if (ep.isTripleDogDare && ep.tripleDogDare) {
  vpScreens.push({ id:'tdd-announce', label:'Triple Dog Dare', html: rpBuildTripleDogDareAnnouncement(ep) });
  vpScreens.push({ id:'tdd-rounds', label:'The Dares', html: rpBuildTripleDogDareRounds(ep) });
  vpScreens.push({ id:'tdd-elimination', label:'Eliminated', html: rpBuildTripleDogDareElimination(ep) });
}
```

Replace with:

```js
if (ep.isTripleDogDare && ep.tripleDogDare) {
  vpScreens.push({ id: 'tdd', label: 'Triple Dog Dare', html: rpBuildTripleDogDare(ep) });
}
```

- [ ] **Step 3: Remove the legacy imports + function definitions**

Grep for `rpBuildTripleDogDareAnnouncement`, `rpBuildTripleDogDareRounds`, `rpBuildTripleDogDareElimination`:

```bash
grep -n "rpBuildTripleDogDareAnnouncement\|rpBuildTripleDogDareRounds\|rpBuildTripleDogDareElimination" js/vp-screens.js
```

Delete the three legacy functions (wherever they live — likely in `vp-screens.js` itself near the bottom, or in a separate legacy rpBuild file). Remove their imports too.

- [ ] **Step 4: Add the new import**

Near the other challenge imports at the top of `js/vp-screens.js`:

```js
import { rpBuildTripleDogDare } from './chal/triple-dog-dare.js';
```

- [ ] **Step 5: Validate + commit**

```bash
node --check js/vp-screens.js
git add js/vp-screens.js js/chal/triple-dog-dare.js
git commit -m "feat(tdd): replace 3 legacy VP screens with consolidated rpBuildTripleDogDare"
```

---

## Task 11: Text backlog integration

**Files:**
- Modify: `js/text-backlog.js` — add/replace `_textTripleDogDare`.

- [ ] **Step 1: Grep for existing implementation**

```bash
grep -n "TripleDogDare\|tdd\|triple.*dog" js/text-backlog.js
```

- [ ] **Step 2: Replace or add `_textTripleDogDare`**

Implement in `triple-dog-dare.js`:

```js
export function _textTripleDogDare(ep, ln, sec) {
  const tdd = ep.tripleDogDare;
  if (!tdd) return;

  sec('I TRIPLE DOG DARE YOU!');
  ln('Post-merge dare challenge. Spinner picks a target, dare is drawn, target accepts or redirects. Freebies to burn. Chicken out = targeted. Last one standing wins immunity; first to break, goes home.');
  ln('');

  const timeline = tdd.timeline || tdd.chain || [];
  let curRound = null;
  timeline.forEach(evt => {
    if (evt.round && evt.round !== curRound) {
      curRound = evt.round;
      ln('');
      sec(`ROUND ${curRound}`);
    }
    if (evt.type === 'tddIntro' || evt.type === 'chrisQuip') ln(`  [CHRIS] ${evt.text}`);
    else if (evt.type === 'spinnerLand') ln(`  [SPIN] → ${evt.player}`);
    else if (evt.type === 'dareReveal') ln(`  [DARE · ${(evt.category || '').toUpperCase()}] ${evt.text}`);
    else if (evt.type === 'dareAccept' || evt.type === 'accept' || evt.type === 'dareAttempt') ln(`  [ACCEPT] ${evt.player}${evt.completed ? ' — completed' : ' — failed'}`);
    else if (evt.type === 'dareRedirect' || evt.type === 'redirect') ln(`  [REDIRECT] ${evt.player} → ${evt.target}`);
    else if (evt.type === 'freebieGift') ln(`  [GIFT] ${evt.from || evt.donor} → ${evt.to || evt.requester}`);
    else if (evt.type === 'dareMishap') ln(`  [MISHAP] ${evt.player}: ${evt.text}`);
    else if (evt.type === 'dareConsequence') ln(`  [CONSEQUENCE · ${(evt.category || '').toUpperCase()}] ${evt.text}`);
    else if (evt.type === 'chickenStreakStart') ln(`  [CHICKEN STREAK START] ${evt.player} at ${evt.streak}`);
    else if (evt.type === 'chickenStreakEscalate') ln(`  [CHICKEN STREAK ESCALATES] ${evt.player} at ${evt.streak}`);
    else if (evt.type === 'chickenStreakBroken') ln(`  [STREAK BROKEN] ${evt.player} after ${evt.priorStreak} passes`);
    else if (evt.type === 'publicReaction') ln(`  [CROWD · ${evt.subtype || '?'}] ${evt.text}`);
    else if (evt.type === 'dareElimination' || evt.type === 'elimination') {
      ln('');
      sec('ELIMINATION');
      ln(`  ${evt.player} is eliminated. ${evt.text || ''}`);
    }
  });

  ln('');
  if (tdd.eliminated || tdd.eliminatedPlayer) {
    sec('AFTERMATH');
    const elim = tdd.eliminated || tdd.eliminatedPlayer;
    ln(`  ${elim} walks to the Dock of Shame.`);
  }
}
```

- [ ] **Step 3: Register in `js/text-backlog.js`**

Ensure the function is imported and called for TDD episodes:

```js
import { _textTripleDogDare } from './chal/triple-dog-dare.js';
// ...
if (ep.isTripleDogDare) _textTripleDogDare(ep, ln, sec);
```

- [ ] **Step 4: Validate + commit**

```bash
node --check js/chal/triple-dog-dare.js
node --check js/text-backlog.js
git add js/chal/triple-dog-dare.js js/text-backlog.js
git commit -m "feat(tdd): text backlog with all new event types"
```

---

## Task 12: Manual verification

**Files:** none.

- [ ] **Step 1: Serve simulator**

```bash
cd <repo root>
python -m http.server 8765
```

Open `http://localhost:8765/simulator.html`. Load or build a post-merge season with ≥ 5 active players. Force-trigger Triple Dog Dare.

- [ ] **Step 2: Visual identity check**

1. Asphalt-gray background with chalk-dust drift.
2. Title in scrawled sharpie, rotated -1.5deg.
3. Subtitle in yellow chalk.
4. Recess Wall scoreboard: every player's name + bracelet stack. Chicken icon appears for streak ≥ 3.

- [ ] **Step 3: Spinner physics**

Click through the first few reveals. Verify:

1. Spinner renders as chalked circle with irregular dashed stroke.
2. Sharpie-arrow rotates with cubic-out easing over ~1.4s.
3. After landing, 3-4 scritch-settle oscillations before final rest.
4. Result player name fades in below the spinner.

- [ ] **Step 4: Dare card typewriter**

1. Dare card has notebook-paper background with horizontal rules.
2. Category tag in corner shows correct neon color (pink/yellow/cyan/green).
3. Dare text types out letter-by-letter in sharpie font.
4. Long dares (60+ chars) type faster.

- [ ] **Step 5: Mechanical consequences**

1. Run a few rounds with a gross dare — mishap should fire ~25% of the time with visible `dareMishap` event.
2. Physical dare acceptance → next round's willingness for that player should visibly drop.
3. Truth dare with `{target}` → resolves to a named player, emits `dareConsequence` with bond delta.
4. Public dare → popularity swing should be larger than non-public dares.

- [ ] **Step 6: Chicken streak**

1. Find a round where a player redirects 3+ times in a row.
2. Verify chicken meter setpiece appears at streak 3 (chick emoji).
3. At streak 4, hen. At streak 5+, rooster.
4. Streak eventually breaks (high willingness bonus pushes them to accept).
5. Streak-broken event renders with green border.

- [ ] **Step 7: Public reactions**

1. Each round with a notable event should have 0-1 `publicReaction` cards.
2. Card uses italic chalk font with a 5-stick-figure crowd line at the bottom.

- [ ] **Step 8: Bracelet gifts**

1. Freebie gift events render with the donor on left, recipient on right.
2. Bracelet slides across the middle with "PASS →" text.

- [ ] **Step 9: Elimination setpiece**

1. Final eliminated player's name renders large, rotated -2deg.
2. Sharpie-red slash animates across the name over 0.8s.
3. Repeating-diagonal warning pattern background with red border.

- [ ] **Step 10: Reduced motion**

Enable `prefers-reduced-motion: reduce` in browser settings. Reload VP:

1. No animations fire.
2. Spinner is pre-rotated to final angle on first render.
3. Typewriter shows full dare text immediately.
4. Chicken meter at final size with no grow animation.
5. Slash on elimination is fully drawn.

- [ ] **Step 11: Text backlog**

Open backlog / export view. Verify:

1. `I TRIPLE DOG DARE YOU!` section header.
2. Round-by-round structure.
3. All new event types present: `[CHICKEN STREAK ESCALATES]`, `[CONSEQUENCE · TRUTH]`, `[CROWD · disgust]`, etc.
4. Elimination section.

- [ ] **Step 12: Console hygiene**

DevTools console open during click-through. Confirm no errors.

- [ ] **Step 13: Balance sanity check**

Run 20 TDD episodes back-to-back. Verify:

1. Not every episode ends by chicken-streak (should be 15-25% of eliminations are chicken-dominant).
2. Archetype preferences visible: hotheads accept physical ≥ 60% of the time; floaters accept anything ≤ 30%.
3. Dare distribution across categories is roughly uniform (±15% per category).

- [ ] **Step 14: Fix any bugs surfaced**

Commit with `fix(tdd): <description>`.

- [ ] **Step 15: Update project memory**

Create `C:\Users\yanna\.claude\projects\C--Users-yanna-OneDrive-Documents-GitHub-dc-franchise-db\memory\project_triple_dog_dare_overdrive.md`:

```markdown
---
name: I Triple Dog Dare You — Overdrive
description: Playground Chaos identity pass + mechanical gameplay depth (dare consequences, archetype biases, chicken streaks, public reactions)
type: project
---

Shipped 2026-04-17.

**Identity:** Playground Chaos — chalk on asphalt + sharpie on notebook paper. Handwritten fonts, wobbly SVGs, friendship-bracelet freebies, chalked spinner with sharpie arrow, chicken-meter that grows with pass streak. Distinct from every other challenge theme.

**Gameplay depth:**
- Dare category now has mechanical consequences (gross→mishap, physical→fatigue, truth→bond-shift, public→amplified popularity)
- Archetype × category willingness modifiers (hothead loves physical, perceptive loves truth, floater avoids all)
- Chicken-streak mechanic (3+ passes = visible meter, pressure effect, targeted harsher dares at 5+)
- Public reactions per round (disgust/cheer/spotlight/tension/turning) with real popularity deltas
- DARE_POOL expanded to ~120 entries with severity tiers + named-target placeholders

**File:** `js/chal/triple-dog-dare.js` (~2000 lines, grew from 802). All VP identity + reveal engine + renderers + text pools live here. `vp-screens.js` 3-screen block collapsed to 1.

**Spec:** `docs/superpowers/specs/2026-04-17-triple-dog-dare-overdrive-design.md`
**Plan:** `docs/superpowers/plans/2026-04-17-triple-dog-dare-overdrive.md`

**Not done:** no sound, no View Transitions, no WebGL. Deeper mechanics (dare-crafting, alliance-protected freebies) were the overhaul tier — out of scope.
```

---

## Files touched at completion

- `js/chal/triple-dog-dare.js` — from ~800 → ~2000 lines. Added: TDD_STYLES, rpBuildTripleDogDare, reveal engine, event renderers, text pools, archetype bias table, chicken-streak tracking, dare-category consequences, public reactions, text backlog export.
- `js/core.js` — DARE_POOL expanded by ~70 entries with severity/target metadata.
- `js/vp-screens.js` — 3 TDD screens collapsed into 1 rpBuild call. 3 legacy rpBuild functions deleted.
- `js/text-backlog.js` — new _textTripleDogDare registered.

## Files NOT touched

- No changes to `js/episode.js` or `js/twists.js` — twist dispatch already works.
- No changes to other `js/chal/*.js` challenges.
- No changes to `js/players.js`, `js/bonds.js`, `js/romance.js`, `js/alliances.js`, `js/voting.js`, `js/advantages.js`, `js/finale.js`, `js/challenges-core.js`, `js/aftermath.js`, `js/vp-ui.js`, `js/cast-ui.js`, `js/run-ui.js`, `js/savestate.js`.
- No asset changes.
