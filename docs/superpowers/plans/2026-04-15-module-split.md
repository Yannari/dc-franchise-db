# Module Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the 81,622-line `simulator.html` into ~37 ES modules with no build step, reducing AI token cost 3-5x per task.

**Architecture:** `simulator.html` keeps its CSS and HTML markup but all JS moves to `js/` as ES modules. A thin `js/main.js` imports everything and exposes functions to `window` for the 226 inline `onclick` handlers. Shared state (`gs`, `players`) lives in `core.js` with live ES module bindings.

**Tech Stack:** Vanilla ES modules (`<script type="module">`), no bundler, no npm.

**Key constraint:** Every task produces a working app. Open `simulator.html` in a browser, it works. No big-bang migration.

**File structure reference:** See `docs/superpowers/specs/2026-04-15-module-split-design.md` for the full module map and dependency graph.

---

## The `window` Problem

ES modules don't put exports on `window`. But `simulator.html` has 226 `onclick="functionName()"` handlers (94 in static HTML, 132 generated dynamically in JS). Two-part solution:

1. **Static HTML handlers (94):** `main.js` assigns every referenced function to `window` after importing.
2. **Dynamic JS handlers (132):** Each module that generates `onclick` strings already has the function in scope — just add `window.functionName = functionName` at the bottom of that module.

This is ugly but correct. It's also the migration path — once all modules work, a future cleanup pass could replace `onclick` attributes with `addEventListener`, but that's out of scope.

---

### Task 1: Create js/ directory and scaffolding

**Files:**
- Create: `js/main.js`
- Create: `js/core.js`

This task sets up the foundation. `core.js` gets the state variables and constants. `main.js` imports core and calls `init()`. `simulator.html` gets the module script tag. After this task, the app works identically — all other JS remains inline in `simulator.html` as a classic `<script>` that runs first.

- [ ] **Step 1: Create js/ directory**

```bash
mkdir -p js
```

- [ ] **Step 2: Create js/core.js with state and constants**

Extract from `simulator.html` lines 2687-3420 (CONSTANTS section + STATE section):
- All `const` declarations: `STATS`, `THREAT_TIERS`, `ARCHETYPES`, `ADV_OPTIONS`, etc.
- All `let` state variables: `players`, `editingId`, `activeTab`, `seasonConfig`, `relationships`, `editingRelId`, `activeRelType`, `gs`, `gsCheckpoints`, `viewingEpNum`, `selectedEpisodes`, `currentTwistFilter`
- Season preset data: `S9_CAST_PRESET`, `S9_ALLIANCES_PRESET`, `S9_RELS_PRESET`, `S9_BONDS_PRESET`, `S10_CAST_PRESET`, `S10_ALLIANCES_PRESET`, `S10_RELS_PRESET`, `S10_BONDS_PRESET`
- Functions: `defaultConfig()`, `repairGsSets()`, `prepGsForSave()`, `loadAll()`

Add `export` to every declaration that other modules will need. For mutable state (`let players`, `let gs`, etc.), export setter functions too:

```js
// js/core.js — top of file
// State
export let players = [];
export let editingId = null;
export let activeTab = 'cast';
export let seasonConfig = defaultConfig();
// ... all other let declarations

// Setters for full replacement
export function setPlayers(p) { players = p; }
export function setGs(g) { gs = g; }
export function setSeasonConfig(c) { seasonConfig = c; }
// ... setters for each mutable let

// Constants
export const STATS = [ ... ];  // copy exact content from simulator.html
// ... all other constants

// Functions
export function defaultConfig() { ... }
export function repairGsSets(g) { ... }
export function prepGsForSave(g) { ... }
export function loadAll() { ... }
```

- [ ] **Step 3: Create js/main.js as the entry point**

```js
// js/main.js
import * as core from './core.js';

// Expose everything to window for onclick handlers
Object.entries(core).forEach(([name, val]) => {
  if (typeof val === 'function') window[name] = val;
});

// Also expose state variables as getters so onclick handlers see current values
// (window.gs would be stale — use a getter)
Object.defineProperty(window, 'gs', { get: () => core.gs, set: v => core.setGs(v) });
Object.defineProperty(window, 'players', { get: () => core.players, set: v => core.setPlayers(v) });
Object.defineProperty(window, 'seasonConfig', { get: () => core.seasonConfig, set: v => core.setSeasonConfig(v) });
Object.defineProperty(window, 'relationships', { get: () => core.relationships, set: v => core.setRelationships(v) });
Object.defineProperty(window, 'editingId', { get: () => core.editingId, set: v => core.setEditingId(v) });
Object.defineProperty(window, 'activeTab', { get: () => core.activeTab, set: v => core.setActiveTab(v) });
```

- [ ] **Step 4: Update simulator.html**

Add the module script BEFORE the existing `<script>` block. The classic script runs after modules load (modules are deferred by default).

At line 2685 (just before `<script>`), insert:

```html
<script type="module" src="js/main.js"></script>
```

Then in the existing `<script>` block, DELETE the lines that were moved to `core.js` (constants, state, `defaultConfig`, `repairGsSets`, `prepGsForSave`, `loadAll`). The remaining functions still reference `gs`, `players`, etc. — those now come from `window` (set up by main.js).

**CRITICAL:** Module scripts are deferred — they run after the DOM loads but their exports are on `window` before the classic `<script>` executes only if you use `defer` on the classic script too. To be safe, add `defer` to the remaining classic script tag:

```html
<script defer>
```

Actually, simpler approach: just move the classic `<script>` content to execute after modules load by wrapping it in a function called from `main.js`. But that's a bigger change. 

**Simplest safe approach for Task 1:** Don't split yet. Just create the files and verify they load without errors. The actual extraction starts in Task 2.

Replace this step with:

In `simulator.html`, add at line 2685 (before `<script>`):
```html
<script type="module" src="js/main.js"></script>
```

`main.js` for now just does:
```js
import './core.js';
console.log('[module-split] main.js loaded');
```

`core.js` for now just does:
```js
console.log('[module-split] core.js loaded');
```

- [ ] **Step 5: Test in browser**

Open `simulator.html`. Check browser console for:
- `[module-split] core.js loaded`
- `[module-split] main.js loaded`
- No errors
- App works exactly as before (all JS still inline)

- [ ] **Step 6: Commit**

```bash
git add js/main.js js/core.js simulator.html
git commit -m "feat: scaffold js/ module structure with entry point"
```

---

### Task 2: Extract core.js (state + constants + serialization)

**Files:**
- Modify: `js/core.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

This is the critical migration step. Move all state, constants, and config functions out of the inline script into `core.js`. The inline script becomes a consumer of `window.*` globals set up by `main.js`.

**The timing problem:** ES `<script type="module">` is always deferred. A classic `<script>` without `defer` runs immediately. So if the classic script runs first, `window.gs` etc. won't exist yet. Solution: make the classic script also deferred, or better — use the `load` event.

**Chosen approach:** Convert the remaining inline `<script>` to `<script type="module">` too. This makes it deferred and able to import from `core.js` directly. But then all functions need explicit `window.X = X` for onclick handlers.

**Actually, simplest approach:** Keep the inline script as classic but wrap the init call in `DOMContentLoaded`. The module script runs during deferred phase (after parsing, before DOMContentLoaded). So by the time `DOMContentLoaded` fires, `window.*` globals from `main.js` are available. Functions defined in the classic script that reference `gs`/`players` through `window` will work because they're called at runtime (not at parse time).

Wait — classic scripts without `defer` execute synchronously when the parser encounters them. Module scripts are deferred. If the module `<script>` tag is BEFORE the classic `<script>` tag, parsing order is:
1. Parser sees `<script type="module">` — schedules for deferred execution
2. Parser sees `<script>` — executes immediately (blocks)
3. Classic script runs — but module hasn't set up `window.*` yet!

**Fix:** Put the module script tag AFTER the classic script. Or use `defer` on the classic script. Or just make the classic script a module too.

**Final approach:** Make the inline script a module. This is the cleanest path:
1. Change `<script>` to `<script type="module">`
2. Add `import { gs, players, ... } from './js/core.js';` at top of inline script
3. Every function referenced by `onclick` gets `window.X = X` at the bottom

This is a lot of `window.X = X` lines, but it's mechanical and correct.

**Better final approach for incremental migration:** Keep classic `<script>` but `defer` it. Module runs first (also deferred, but modules before deferred classic scripts in spec order). Then classic script sees `window.*`.

Actually, per HTML spec: deferred scripts (both modules and `defer` classic) execute in document order. So if the module tag comes first in the HTML, it runs first.

- [ ] **Step 1: Move constants and state to core.js**

Copy the following sections from `simulator.html` (lines 2687-3420) into `js/core.js`:

```js
// js/core.js

// ══════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════

export const STATS = [
  { key: 'physical',  label: 'PHY', name: 'Physical',  color: '#f97316', desc: 'Strength & speed challenges' },
  // ... exact copy from simulator.html
];

// ... ALL other constants (THREAT_TIERS, ARCHETYPES, ADV_OPTIONS, etc.)
// ... ALL preset data (S9_CAST_PRESET, S10_CAST_PRESET, etc.)

// ══════════════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════════════

export let players = [];
export let editingId = null;
export let activeTab = 'cast';
export let seasonConfig = defaultConfig();
export let relationships = [];
export let editingRelId = null;
export let activeRelType = 'neutral';
export let gs = null;
export let gsCheckpoints = {};
export let viewingEpNum = null;
export let selectedEpisodes = new Set();
export let currentTwistFilter = 'all';
export let preGameAlliances = [];
export let editingAllianceId = null;
// ... any other top-level let/var declarations

// Setters (needed because ES module exports are read-only bindings for importers)
export function setPlayers(v) { players = v; }
export function setEditingId(v) { editingId = v; }
export function setActiveTab(v) { activeTab = v; }
export function setSeasonConfig(v) { seasonConfig = v; }
export function setRelationships(v) { relationships = v; }
export function setEditingRelId(v) { editingRelId = v; }
export function setActiveRelType(v) { activeRelType = v; }
export function setGs(v) { gs = v; }
export function setGsCheckpoints(v) { gsCheckpoints = v; }
export function setViewingEpNum(v) { viewingEpNum = v; }
export function setSelectedEpisodes(v) { selectedEpisodes = v; }
export function setCurrentTwistFilter(v) { currentTwistFilter = v; }
export function setPreGameAlliances(v) { preGameAlliances = v; }
export function setEditingAllianceId(v) { editingAllianceId = v; }

// ══════════════════════════════════════════════════════════════════════
// CONFIG + SERIALIZATION
// ══════════════════════════════════════════════════════════════════════

export function defaultConfig() { /* exact copy */ }
export function repairGsSets(g) { /* exact copy */ }
export function prepGsForSave(g) { /* exact copy */ }
export function loadAll() { /* exact copy */ }
```

- [ ] **Step 2: Update main.js to expose state on window**

```js
// js/main.js
import * as core from './core.js';

// Expose all exported functions on window for onclick handlers
for (const [key, val] of Object.entries(core)) {
  if (typeof val === 'function') {
    window[key] = val;
  }
}

// Expose mutable state as window getters/setters
const stateProps = [
  'players', 'editingId', 'activeTab', 'seasonConfig', 'relationships',
  'editingRelId', 'activeRelType', 'gs', 'gsCheckpoints', 'viewingEpNum',
  'selectedEpisodes', 'currentTwistFilter', 'preGameAlliances', 'editingAllianceId'
];

for (const prop of stateProps) {
  const setter = 'set' + prop[0].toUpperCase() + prop.slice(1);
  Object.defineProperty(window, prop, {
    get: () => core[prop],
    set: (v) => core[setter](v),
    configurable: true
  });
}

// Expose constants
window.STATS = core.STATS;
window.THREAT_TIERS = core.THREAT_TIERS;
window.ARCHETYPES = core.ARCHETYPES;
window.ADV_OPTIONS = core.ADV_OPTIONS;
// ... all other constants
```

- [ ] **Step 3: Update simulator.html**

1. Add `defer` to the inline classic script:
```html
<script defer>
```

2. Delete lines 2687-3420 from the script (the constants, state, and config functions now in core.js).

3. Ensure the module tag is BEFORE the deferred script:
```html
<script type="module" src="js/main.js"></script>
<script defer>
// remaining functions start here (showTab, buildStatSliders, etc.)
```

- [ ] **Step 4: Test in browser**

Open `simulator.html`. Verify:
- Cast builder loads, can add/edit players
- Season setup works
- Can simulate an episode
- VP screens render
- Save/load works
- No console errors

- [ ] **Step 5: Commit**

```bash
git add js/core.js js/main.js simulator.html
git commit -m "feat: extract core state and constants to js/core.js"
```

---

### Task 3: Extract players.js

**Files:**
- Create: `js/players.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

- [ ] **Step 1: Create js/players.js**

Extract these functions from `simulator.html`:
- `romanticCompat(a, b)` (line ~3634)
- `pronouns(nameOrPlayer)` (line ~3652)
- `Pronouns(name)` (line ~3660)
- `pStats(name)` (line ~5159)
- `threatScore(name, detailed)` (line ~5165)
- `overall(stats)` (line ~3539)
- `threat(stats)` (line ~3540)
- `threatTier(score)` (line ~3547)
- `tribeColor(tribe)` (line ~3548)
- `getPlayerState(name)` (line ~5367)
- `isAllianceBottom(name, allianceMembers)` (line ~5372)
- `challengeWeakness(name, challengeCategory)` (line ~5320)
- `updateChalRecord(ep)` (line ~5216)
- `miniAvatar(name, size)` (line ~4469)

```js
// js/players.js
import { gs, players, STATS, THREAT_TIERS, ARCHETYPES, seasonConfig } from './core.js';

export function pStats(name) { /* exact copy */ }
export function pronouns(nameOrPlayer) { /* exact copy */ }
export function Pronouns(name) { /* exact copy */ }
export function romanticCompat(a, b) { /* exact copy */ }
// ... all other functions
```

- [ ] **Step 2: Update main.js**

Add at top:
```js
import * as playerMod from './players.js';
```

Add to the window exposure loop, or after it:
```js
for (const [key, val] of Object.entries(playerMod)) {
  if (typeof val === 'function') window[key] = val;
}
```

- [ ] **Step 3: Remove extracted functions from simulator.html**

Delete the function bodies from the inline `<script defer>` block for every function now in `players.js`.

- [ ] **Step 4: Test in browser**

- Add a player from roster, verify stats display
- Simulate an episode, verify challenge records update
- Check VP pronouns render correctly
- No console errors

- [ ] **Step 5: Commit**

```bash
git add js/players.js js/main.js simulator.html
git commit -m "feat: extract player utilities to js/players.js"
```

---

### Task 4: Extract bonds.js

**Files:**
- Create: `js/bonds.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

- [ ] **Step 1: Create js/bonds.js**

Extract from `simulator.html`:
- `bKey(a, b)` (line ~4665)
- `getBond(a, b)` (line ~4666)
- `setBond(a, b, val)` (line ~4667)
- `addBond(a, b, d)` (line ~4668)
- `getPerceivedBond(a, b)` (line ~4692)
- `addPerceivedBond(a, b, perceived, reason)` (line ~4700)
- `removePerceivedBondsFor(name)` (line ~4706)
- `updatePerceivedBonds(ep)` (line ~4714)
- `checkPerceivedBondTriggers(ep)` (line ~4824)
- `updateBonds(votingLog, eliminated, alliances)` (line ~32484)
- `recoverBonds(ep)` (line ~6489)
- `bondLabel(val)` (line ~50550)
- `bondFeeling(val)` (line ~50566)

```js
// js/bonds.js
import { gs } from './core.js';
import { pStats, pronouns } from './players.js';

export function bKey(a, b) { /* exact copy */ }
export function getBond(a, b) { /* exact copy */ }
// ... all bond functions
```

- [ ] **Step 2: Update main.js**

```js
import * as bondMod from './bonds.js';
for (const [key, val] of Object.entries(bondMod)) {
  if (typeof val === 'function') window[key] = val;
}
```

- [ ] **Step 3: Remove from simulator.html**

- [ ] **Step 4: Test** — Simulate episode, check bond changes in debug tab, verify VP relationship screens

- [ ] **Step 5: Commit**

```bash
git add js/bonds.js js/main.js simulator.html
git commit -m "feat: extract bond system to js/bonds.js"
```

---

### Task 5: Extract alliances.js

**Files:**
- Create: `js/alliances.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

- [ ] **Step 1: Create js/alliances.js**

Extract:
- `computeHeat(name, tribalPlayers, alliances)` (line ~5385)
- `wRandom(pool, weightFn)` (line ~6625)
- `detectBetrayals(ep)` (line ~6642)
- `formAlliances(members, tribeLabel, challengeLabel)` (line ~6717)
- `pickTarget(attackers, victims, challengeLabel)` (line ~6999)
- `decayAllianceTrust(epNum)` (line ~6334)
- `nameNewAlliance(size)` (line ~37496)

```js
// js/alliances.js
import { gs, players, seasonConfig } from './core.js';
import { pStats, pronouns, getPlayerState } from './players.js';
import { getBond, getPerceivedBond, addBond } from './bonds.js';

export function computeHeat(name, tribalPlayers, alliances) { /* exact copy */ }
// ... all alliance functions
```

- [ ] **Step 2: Update main.js**
- [ ] **Step 3: Remove from simulator.html**
- [ ] **Step 4: Test** — Simulate 3+ episodes, verify alliances form, targets chosen, heat displayed in debug
- [ ] **Step 5: Commit**

```bash
git add js/alliances.js js/main.js simulator.html
git commit -m "feat: extract alliance system to js/alliances.js"
```

---

### Task 6: Extract voting.js

**Files:**
- Create: `js/voting.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

- [ ] **Step 1: Create js/voting.js**

Extract:
- `buildVoteReason(voter, target, type, ctx)` (line ~30974)
- `simulateVotes(tribalPlayers, immuneName, alliances, lostVotes, openVote)` (line ~31360)
- `resolveVotes(votes)` (line ~31915)
- `checkShotInDark(tribalPlayers, votes, log, ep)` (line ~31928)
- `simulateRevote(tribalPlayers, tiedPlayers, lostVotes, originalLog, immunePlayers)` (line ~31968)

```js
// js/voting.js
import { gs, players, seasonConfig } from './core.js';
import { pStats, pronouns, getPlayerState } from './players.js';
import { getBond, getPerceivedBond } from './bonds.js';
import { computeHeat, wRandom } from './alliances.js';

export function buildVoteReason(voter, target, type, ctx = {}) { /* exact copy */ }
// ...
```

- [ ] **Step 2-5:** Same pattern (update main.js, remove from simulator.html, test, commit)

```bash
git commit -m "feat: extract voting system to js/voting.js"
```

---

### Task 7: Extract advantages.js

**Files:**
- Create: `js/advantages.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

- [ ] **Step 1: Create js/advantages.js**

Extract:
- `findAdvantages(ep)` (line ~32556)
- `checkIdolPreTribal(ep, tribalPlayers)` (line ~32772)
- `checkIdolPlays(tribalPlayers, votesObj, ep, voteLog)` (line ~32882)
- `checkNonIdolAdvantageUse(tribalPlayers, votesObj, ep, voteLog)` (line ~33275)
- `handleAdvantageInheritance(eliminatedName, ep)` (line ~31885)
- `pickNomineeWithDrama(pool, weightFn)` (line ~33602)

```js
// js/advantages.js
import { gs, players, seasonConfig } from './core.js';
import { pStats, pronouns } from './players.js';
import { getBond, addBond } from './bonds.js';
import { wRandom } from './alliances.js';
```

- [ ] **Step 2-5:** Same pattern

```bash
git commit -m "feat: extract advantage system to js/advantages.js"
```

---

### Task 8: Extract romance.js

**Files:**
- Create: `js/romance.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

- [ ] **Step 1: Create js/romance.js**

Extract all romance/showmance/love triangle/affair functions (lines ~11733-12154, ~41238-42664):
- `_challengeRomanceSpark()`, `updateRomanticSparks()`, `checkFirstMove()`, `checkShowmanceSabotage()`, `_checkShowmanceChalMoment()`, `getShowmance()`, `getShowmancePartner()`, `checkShowmanceFormation()`, `updateShowmancePhases()`, `checkShowmanceTest()`, `checkShowmanceBreakup()`, `checkLoveTriangleFormation()`, `checkLoveTriangleBreakup()`, `updateLoveTrianglePhases()`, `updateAffairExposure()`, `_resolveAffairExposure()`

```js
// js/romance.js
import { gs, players, seasonConfig } from './core.js';
import { pStats, pronouns, romanticCompat } from './players.js';
import { getBond, addBond } from './bonds.js';
import { wRandom } from './alliances.js';
```

- [ ] **Step 2-5:** Same pattern

```bash
git commit -m "feat: extract romance system to js/romance.js"
```

---

### Task 9: Extract challenges-core.js

**Files:**
- Create: `js/challenges-core.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

- [ ] **Step 1: Create js/challenges-core.js**

Extract:
- `pickChallenge(mode)` (line ~30645)
- `pickReward()` (line ~30690)
- `selectSitOuts(tribe, chal, count)` (line ~30698)
- `simulateTribeChallenge(tribes)` (line ~30720)
- `simulateLastChance(a, b)` (line ~30827)
- `simulateIndividualChallenge(pool, immune)` (line ~30843)

```js
// js/challenges-core.js
import { gs, players, seasonConfig } from './core.js';
import { pStats } from './players.js';
```

- [ ] **Step 2-5:** Same pattern

```bash
git commit -m "feat: extract challenge core to js/challenges-core.js"
```

---

### Task 10: Extract first challenge module (lucky-hunt.js)

**Files:**
- Create: `js/chal/lucky-hunt.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

This is the template for all 17 challenge extractions. Do Lucky Hunt first since it was the most recently written and is fresh in memory.

- [ ] **Step 1: Create js/chal/ directory**

```bash
mkdir -p js/chal
```

- [ ] **Step 2: Create js/chal/lucky-hunt.js**

Extract from `simulator.html`:
- All `_lh*` helper functions (lines ~28061-28465)
- `simulateLuckyHunt(ep)` (line ~28466)
- `rpBuildLuckyHunt(ep)` (line ~77358)
- `_textLuckyHunt(ep, ln, sec)` (line ~52037)

```js
// js/chal/lucky-hunt.js
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, romanticCompat } from '../players.js';
import { getBond, addBond } from '../bonds.js';
import { wRandom } from '../alliances.js';
import { _checkShowmanceChalMoment, _challengeRomanceSpark } from '../romance.js';

// Private helpers (not exported)
function _lhSuccessChance(playerName, location, huntState) { /* exact copy */ }
function _lhHelpAlly(helper, target, huntState, ep, _rp) { /* exact copy */ }
// ... all other _lh* functions

// Public exports
export function simulateLuckyHunt(ep) { /* exact copy */ }
export function rpBuildLuckyHunt(ep) { /* exact copy */ }
export function _textLuckyHunt(ep, ln, sec) { /* exact copy */ }
```

- [ ] **Step 3: Create challenge registry in main.js**

Add to `main.js`:
```js
import { simulateLuckyHunt, rpBuildLuckyHunt, _textLuckyHunt } from './chal/lucky-hunt.js';

// Challenge registry — episode.js will use this to dispatch by twist ID
export const CHALLENGES = {
  'lucky-hunt': {
    simulate: simulateLuckyHunt,
    rpBuild: rpBuildLuckyHunt,
    text: _textLuckyHunt
  },
};

// Expose to window
window.simulateLuckyHunt = simulateLuckyHunt;
window.rpBuildLuckyHunt = rpBuildLuckyHunt;
window._textLuckyHunt = _textLuckyHunt;
window.CHALLENGES = CHALLENGES;
```

- [ ] **Step 4: Remove from simulator.html**

Delete `_lhSuccessChance` through end of `simulateLuckyHunt`, `rpBuildLuckyHunt`, and `_textLuckyHunt` from the inline script.

- [ ] **Step 5: Test in browser**

- Configure an episode with Lucky Hunt twist
- Simulate the episode
- Verify Lucky Hunt plays out (check text backlog for hunt narrative)
- Open VP, verify Lucky Hunt screens render
- No console errors

- [ ] **Step 6: Commit**

```bash
git add js/chal/lucky-hunt.js js/main.js simulator.html
git commit -m "feat: extract Lucky Hunt challenge to js/chal/lucky-hunt.js"
```

---

### Task 11: Extract remaining 16 challenge modules

**Files:**
- Create: `js/chal/cliff-dive.js`
- Create: `js/chal/awake-a-thon.js`
- Create: `js/chal/dodgebrawl.js`
- Create: `js/chal/talent-show.js`
- Create: `js/chal/sucky-outdoors.js`
- Create: `js/chal/up-the-creek.js`
- Create: `js/chal/paintball-hunt.js`
- Create: `js/chal/hells-kitchen.js`
- Create: `js/chal/trust.js`
- Create: `js/chal/basic-straining.js`
- Create: `js/chal/x-treme-torture.js`
- Create: `js/chal/phobia-factor.js`
- Create: `js/chal/brunch.js`
- Create: `js/chal/say-uncle.js`
- Create: `js/chal/triple-dog-dare.js`
- Create: `js/chal/slasher-night.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

Follow the exact same pattern as Task 10 for each challenge. Each module:
1. Imports from `core.js`, `players.js`, `bonds.js`, and any other needed modules
2. Contains its `simulate*`, `rpBuild*`, and `_text*` functions
3. Keeps internal helpers as non-exported functions

**Function-to-file mapping:**

| File | simulate* | rpBuild* | _text* | Helpers |
|------|-----------|----------|--------|---------|
| `cliff-dive.js` | `simulateCliffDive` | `rpBuildCliffDive` | `_textCliffDive` | — |
| `awake-a-thon.js` | `simulateAwakeAThon` | `rpBuildAwakeAThon` | `_textAwakeAThon` | — |
| `dodgebrawl.js` | `simulateDodgebrawl` | `rpBuildDodgebrawl` | `_textDodgebrawl` | — |
| `talent-show.js` | `simulateTalentShow` | `rpBuildTalentAuditions`, `rpBuildTalentBackstage`, `rpBuildTalentShowStage` | `_textTalentShow` | — |
| `sucky-outdoors.js` | `simulateSuckyOutdoors` | `rpBuildSuckyOutdoors` | `_textSuckyOutdoors` | — |
| `up-the-creek.js` | `simulateUpTheCreek` | `rpBuildUpTheCreek` | `_textUpTheCreek` | — |
| `paintball-hunt.js` | `simulatePaintballHunt` | `rpBuildPaintballHunt` | `_textPaintballHunt` | — |
| `hells-kitchen.js` | `simulateHellsKitchen` | `rpBuildHellsKitchen` | `_textHellsKitchen` | — |
| `trust.js` | `simulateTrustChallenge` | `rpBuildTrustChallenge` | `_textTrustChallenge` | — |
| `basic-straining.js` | `simulateBasicStraining` | `rpBuildBasicStraining` | `_textBasicStraining` | — |
| `x-treme-torture.js` | `simulateXtremeTorture` | `rpBuildXtremeTorture` | `_textXtremeTorture` | — |
| `phobia-factor.js` | `simulatePhobiaFactor` | `rpBuildPhobiaConfessions`, `rpBuildPhobiaAnnouncement`, `rpBuildPhobiaChallenge`, `rpBuildPhobiaClutch`, `rpBuildPhobiaResults` | `_textPhobiaFactor` | — |
| `brunch.js` | `simulateBrunchOfDisgustingness` | `rpBuildBrunchSplit`, `rpBuildBrunchCabins`, `rpBuildBrunchCourses`, `rpBuildBrunchResults` | `_textBrunchOfDisgustingness` | — |
| `say-uncle.js` | `simulateSayUncle` | `rpBuildSayUncleAnnouncement`, `rpBuildSayUncleRounds`, `rpBuildSayUncleImmunity` | `_textSayUncle` | `_rp_hostPhaseIntro` |
| `triple-dog-dare.js` | `simulateTripleDogDare` | `rpBuildTripleDogDareAnnouncement`, `rpBuildTripleDogDareRounds`, `rpBuildTripleDogDareElimination` | `_textTripleDogDare` | — |
| `slasher-night.js` | `simulateSlasherNight` | `rpBuildSlasherAnnouncement`, `rpBuildSlasherRounds`, `rpBuildSlasherShowdown`, `rpBuildSlasherImmunity`, `rpBuildSlasherElimination`, `rpBuildSlasherLeaderboard` | `_textSlasherNight` | `_slasherResolveText`, `_slasherPickEvents`, `_slasherCatchTargeting`, `_slasherFinalShowdown`, `slasherRevealNextRound`, `slasherRevealAllRounds` |

**For each challenge file, update main.js:**
```js
import { simulateCliffDive, rpBuildCliffDive, _textCliffDive } from './chal/cliff-dive.js';
// ... register in CHALLENGES and expose on window
```

- [ ] **Step 1: Extract all 16 challenge modules** (can be done in parallel by subagents — each challenge is independent)

- [ ] **Step 2: Update main.js with all imports and CHALLENGES registry**

- [ ] **Step 3: Remove all extracted challenge functions from simulator.html**

- [ ] **Step 4: Test each challenge**

For each challenge:
- Assign it to an episode in Episode Format Designer
- Simulate that episode
- Verify text backlog has challenge narrative
- Verify VP screens render for that challenge
- No console errors

- [ ] **Step 5: Commit**

```bash
git add js/chal/*.js js/main.js simulator.html
git commit -m "feat: extract all 17 challenge modules to js/chal/"
```

---

### Task 12: Extract social-manipulation.js

**Files:**
- Create: `js/social-manipulation.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

- [ ] **Step 1: Create js/social-manipulation.js**

Extract:
- `generateSocialManipulationEvents(group, ep, boostRate)` (line ~38132)
- `_generateExposeSchemer()` (line ~37737)
- `_generateComfortVictim()` (line ~37766)
- `_generateForgeNote()` (line ~37796)
- `_generateSpreadLies()` (line ~37873)
- `_generateKissTrap()` (line ~37956)
- `_generateWhisperCampaign()` (line ~38062)
- `_generateCampaignRally()` (line ~38097)

```js
// js/social-manipulation.js
import { gs, players } from './core.js';
import { pStats, pronouns, romanticCompat } from './players.js';
import { getBond, addBond } from './bonds.js';
import { wRandom } from './alliances.js';
import { getShowmance, getShowmancePartner } from './romance.js';
```

- [ ] **Step 2-5:** Same pattern

```bash
git commit -m "feat: extract social manipulation events to js/social-manipulation.js"
```

---

### Task 13: Extract camp-events.js

**Files:**
- Create: `js/camp-events.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

This is the largest non-challenge extraction (~5000 lines). Contains:
- `allCampEvents(ep)` (line ~37554)
- `generateCampEventsForGroup(group, finds, twistBoosts, maxEvents, ep)` (line ~38245)
- `generateCampEvents(ep, phase)` (line ~44351)
- All `check*` social politics functions (~40057-44351)
- `checkMoleSabotage(ep)` (line ~43322)
- `_checkMoleExposure(mole, ep, tribeName)` (line ~43760)
- `checkHeroVillainEvents(ep)` (line ~43198)
- All idol/advantage confession functions
- `checkVolunteerExileDuel(ep)` (line ~43828)

```js
// js/camp-events.js
import { gs, players, seasonConfig } from './core.js';
import { pStats, pronouns, getPlayerState, romanticCompat } from './players.js';
import { getBond, addBond, getPerceivedBond } from './bonds.js';
import { wRandom, computeHeat, formAlliances } from './alliances.js';
import { getShowmance, getShowmancePartner } from './romance.js';
import { generateSocialManipulationEvents } from './social-manipulation.js';
```

- [ ] **Step 2-5:** Same pattern

```bash
git commit -m "feat: extract camp events to js/camp-events.js"
```

---

### Task 14: Extract twists.js

**Files:**
- Create: `js/twists.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

- [ ] **Step 1: Create js/twists.js**

Extract:
- `applyTwist(ep, twist, isPrimary)` (line ~34431) — the big one
- `generateDockArrivals(ep)` (line ~34140)
- `executeFirstImpressions(ep, twistObj)` (line ~34255)
- `simulateJourney(ep)` (line ~33650)
- `generateTwistScenes(ep)` (line ~50808)
- `handleExileFormat(ep)` (line ~46029)

```js
// js/twists.js
import { gs, players, seasonConfig } from './core.js';
import { pStats, pronouns } from './players.js';
import { getBond, addBond } from './bonds.js';
import { wRandom } from './alliances.js';
```

- [ ] **Step 2-5:** Same pattern

```bash
git commit -m "feat: extract twist system to js/twists.js"
```

---

### Task 15: Extract rescue-island.js

**Files:**
- Create: `js/rescue-island.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

Extract:
- `isRIStillActive()` (line ~32057)
- `simulateRIChoice(name)` (line ~32063)
- `simulateRIDuel(riPlayers)` (line ~32076)
- `simulateRIReentry(riPlayers)` (line ~32101)
- `generateRILifeEvents(ep)` (line ~32108)
- `generateRIPostDuelEvents(ep)` (line ~32209)
- `generateRescueIslandLife(ep)` (line ~32252)

- [ ] **Step 1-5:** Same pattern

```bash
git commit -m "feat: extract Rescue Island to js/rescue-island.js"
```

---

### Task 16: Extract episode.js

**Files:**
- Create: `js/episode.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

The orchestrator. This imports from nearly everything.

- [ ] **Step 1: Create js/episode.js**

Extract:
- `simulateEpisode()` (line ~46091) — the main loop
- `updatePlayerStates(ep)` (line ~5695)
- `updateSurvival(ep)` (line ~5916)
- `generateSurvivalEvents(ep)` (line ~6016)
- `updatePopularity(ep)` (line ~50230)
- `checkTribalBlowup(ep)` (line ~45761)
- `applyCrashoutEffects(ep)` (line ~45861)
- `applyPostTribalConsequences(ep)` (line ~45903)
- `simulateJuryRoundtable(ep)` (line ~48738)

```js
// js/episode.js
import { gs, players, seasonConfig, gsCheckpoints, setGs, setGsCheckpoints } from './core.js';
import { pStats, pronouns, updateChalRecord, getPlayerState } from './players.js';
import { getBond, addBond, updateBonds, recoverBonds, updatePerceivedBonds, checkPerceivedBondTriggers } from './bonds.js';
import { formAlliances, pickTarget, detectBetrayals, decayAllianceTrust, computeHeat, wRandom } from './alliances.js';
import { simulateVotes, resolveVotes, simulateRevote, checkShotInDark, buildVoteReason } from './voting.js';
import { findAdvantages, checkIdolPreTribal, checkIdolPlays, checkNonIdolAdvantageUse, handleAdvantageInheritance } from './advantages.js';
import { updateRomanticSparks, checkFirstMove, checkShowmanceSabotage, checkShowmanceFormation, updateShowmancePhases, checkShowmanceBreakup, checkLoveTriangleFormation, checkLoveTriangleBreakup, updateLoveTrianglePhases, updateAffairExposure } from './romance.js';
import { generateCampEvents } from './camp-events.js';
import { applyTwist, generateDockArrivals, executeFirstImpressions, simulateJourney, handleExileFormat } from './twists.js';
import { simulateRIChoice, simulateRIDuel, simulateRIReentry, generateRILifeEvents, generateRIPostDuelEvents, generateRescueIslandLife, isRIStillActive } from './rescue-island.js';
import { pickChallenge, simulateTribeChallenge, simulateIndividualChallenge, simulateLastChance } from './challenges-core.js';

// Use challenge registry for twist-specific challenges
// (window.CHALLENGES is set by main.js)
```

- [ ] **Step 2-5:** Same pattern

```bash
git commit -m "feat: extract episode simulation to js/episode.js"
```

---

### Task 17: Extract finale.js

**Files:**
- Create: `js/finale.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

Extract all finale functions (lines ~57275-59190):
- `simulateFinale()`, `generateFinaleSummaryText()`, `simulateJuryVote()`, `projectJuryVotes()`, `generateFinalChallengeStages()`, `generateBenchAssignments()`, `selectAssistants()`, `simulateFinaleChallenge()`, `applyFTCSwingVotes()`, `generateFTCData()`, `generateFanCampaign()`, `simulateFanVote()`, `generateFinaleCampOverride()`, `ordinal()`

- [ ] **Step 1-5:** Same pattern

```bash
git commit -m "feat: extract finale system to js/finale.js"
```

---

### Task 18: Extract text-backlog.js

**Files:**
- Create: `js/text-backlog.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

Extract all non-challenge `_text*` functions (lines ~51416-53990) plus:
- `generateSummaryText(ep)` (line ~55357)
- `buildStorylines(ep)` (line ~55433)
- `buildColdOpen(ep)` (line ~55591)
- `buildNextEpQs(ep)` (line ~55748)
- `_textStripHtml(s)` (line ~51416)
- Helper functions: `_textExileFound`, `_textBetrayReasonNote`, `_textTribeGroups`, `_textMeta`, `_textCast`, `_textColdOpen`, `_textReturns`, `_textMerge`, `_textCampPre`, `_textRewardChallenge`, `_textImmunityChallenge`, `_textTwists`, `_textExile`, `_textCampPost`, `_textVotingPlans`, `_textTribalCouncil`, `_textTheVotes`, `_textWhyVote`, `_textAmbassadors`, `_textRIDuel`, `_textJuryLife`, `_textCampOverview`, `_textAftermath`, `_textGrandChallenge`, `_textFinalCut`, `_textFTCQA`, `_textJuryConvenes`, `_textJuryVotes`, `_textFanCampaign`, `_textFanVote`, `_textWinnerCeremony`, `_textReunion`, `_textSeasonStats`, `_textTiedDestinies`, `_textMoleExposed`, `_textMoleDisruption`, `_textMoleReveal`, `_textSchoolyardPick`, `_textVolunteerDuel`, `_textDockArrivals`, `_textFirstImpressions`, `_textSecondChanceVote`, `_textFeast`, `_textFanVoteReturn`, `_textWriterContext`

- [ ] **Step 1-5:** Same pattern

```bash
git commit -m "feat: extract text backlog to js/text-backlog.js"
```

---

### Task 19: Extract aftermath.js

**Files:**
- Create: `js/aftermath.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

Extract:
- `generateAftermathShow(ep)` (line ~54036)
- `rpBuildAftermathOpening(ep)` through `rpBuildAftermathFanVote(ep)` (lines ~61195-61686)
- `aftermathFVRevealNext(key)`, `aftermathFVRevealAll(key)`
- `rpBuildAftermath(ep)` (line ~69461)

- [ ] **Step 1-5:** Same pattern

```bash
git commit -m "feat: extract aftermath system to js/aftermath.js"
```

---

### Task 20: Extract vp-screens.js

**Files:**
- Create: `js/vp-screens.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

Extract `buildVPScreens(ep)` and all non-challenge, non-finale `rpBuild*` functions:
- `buildVPScreens(ep)` (line ~79886)
- `rpBuildColdOpen(ep)`, `rpBuildTribes(ep)`, `rpBuildCampTribe(ep)`, `rpBuildChallenge(ep)`, `rpBuildRewardChallenge(ep)`, `rpBuildVotingPlans(ep)`, `rpBuildTribal(ep)`, `rpBuildVotes(ep)`, `rpBuildRelationships(ep)`, `rpBuildDebug(ep)`
- Twist VP screens: `rpBuildPreTwist(ep)`, `rpBuildPostElimTwist(ep)`, `rpBuildEmissaryScouting(ep)`, `rpBuildEmissaryChoice(ep)`, `rpBuildAmbassadors(ep)`, `rpBuildMergeAnnouncement(ep)`, `rpBuildTiedDestinies(ep)`, `rpBuildSchoolyardPick(ep)`, `rpBuildMoleExposed(ep)`, `rpBuildFanVoteReturn(ep)`, `rpBuildFirstImpressions(ep)`, `rpBuildRIDuel(ep)`, `rpBuildRILife(ep)`, `rpBuildRIReturn(ep)`, `rpBuildRescueIslandLife(ep)`, `rpBuildRescueReturnChallenge(ep)`, `rpBuildSpiritIsland(ep)`, `rpBuildFanVote(ep)`, `rpBuildFeast(ep)`, `rpBuildSecondChanceVote(ep)`, `rpBuildSurprise(ep)`
- Helper functions: `rpPortrait()`, `rpDuoImg()`, `vpArchLabel()`, `vpConfessionalMood()`, `vpGenerateQuote()`, `vpGetConfessionalRole()`, `_rpBuildDockArrival()`, `parseSummaryText()`, `getTwistPlayers()`, `buildTwistDesc()`, `_renderTwistScene()`, `_buildPostTwistBlocks()`, `buildSignalCards()`, `buildTribalQA()`, `buildCrashout()`, `vpWhyBullets()`, `vpWhyCard()`
- Reveal functions: `tdRevealNext()`, `tdRevealAll()`, `tvRevealNext()`, `_tvFireVoteFly()`, `tvShowResults()`, `torchSnuffFx()`, `tvRevealAll()`, `_tvUpdateTally()`, `_tvUpdateRevoteTally()`, `_tvCheckThresholds()`, `_tvGetElimOrdinal()`
- VP helper: `getTribeRelationshipHighlights()`, `getTribeAdvantageStatus()`, `deriveTargetReason()`, `getIndividualTargets()`, `generateChallengeNotes()`

- [ ] **Step 1-5:** Same pattern

```bash
git commit -m "feat: extract VP screens to js/vp-screens.js"
```

---

### Task 21: Extract vp-finale.js

**Files:**
- Create: `js/vp-finale.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

Extract all finale VP screens:
- `rpBuildFinaleCampLife(ep)`, `rpBuildFinaleChallenge(ep)`, `rpBuildKLOrienteering(ep)`, `rpBuildKLPerch(ep)`, `rpBuildKLCampLife(ep)`, `rpBuildKLChoice(ep)`, `rpBuildFiremakingCampLife(ep)`, `rpBuildFiremakingDecision(ep)`, `rpBuildFiremakingDuel(ep)`, `rpBuildFinalCut(ep)`, `rpBuildBenches(ep)`, `rpBuildFinaleGrandChallenge(ep)`, `rpBuildFTC(ep)`, `rpBuildFanVoteCampLife(ep)`, `rpBuildFanCampaign(ep)`, `rpBuildFanVoteReveal(ep)`, `rpBuildJuryVoteReveal(ep)`, `rpBuildWinnerCeremony(ep)`, `rpBuildWinner(ep)`, `rpBuildReunion(ep)`, `rpBuildSeasonStats(ep)`, `rpBuildJuryLife(ep)`, `rpBuildJuryConvenes(ep)`, `rpBuildJuryVotes(ep)`, `rpBuildFanFavorite(ep)`, `copySeasonJSON()`
- Reveal functions: `reunionRevealNext()`, `reunionRevealAll()`, `gcRevealNext()`, `gcRevealAll()`, `ftcRevealNext()`, `ftcRevealAll()`, `_ftcHighlightWinner()`

- [ ] **Step 1-5:** Same pattern

```bash
git commit -m "feat: extract finale VP screens to js/vp-finale.js"
```

---

### Task 22: Extract vp-ui.js

**Files:**
- Create: `js/vp-ui.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

Extract VP navigation and interaction:
- `vpAnimateTallies()`, `vpRevealNextPlacement()`, `vpRevealAllPlacements()`, `vpRevealTribe()`, `vpRevealAllTribes()`, `vpRevealAllTribesFromData()`, `rcIndRevealNext()`, `rcIndRevealAll()`, `ambNarAdvance()`, `ambNarRevealAll()`, `tddRevealNext()`, `tddRevealAll()`, `suRevealNext()`, `suRevealAll()`, `pfRevealNext()`, `pfRevealAll()`, `vpToggleSection()`, `vpGoTo()`
- Particle system: `_vpaScreenProfile()`, `_vpaSpawn()`, `_vpaTick()`, `_vpaResize()`, `vpStartParticles()`, `vpStopParticles()`, `vpUpdateParticleProfile()`
- VP shell: `renderVPScreen()`, `openVisualPlayer()`, `vpToggleSearch()`, `vpSearchClear()`, `vpSearchHighlight()`, `vpSearchNext()`, `vpSearchPrev()`, `closeVisualPlayer()`, `vpNext()`, `vpPrev()`

- [ ] **Step 1-5:** Same pattern

```bash
git commit -m "feat: extract VP UI to js/vp-ui.js"
```

---

### Task 23: Extract cast-ui.js

**Files:**
- Create: `js/cast-ui.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

Extract all cast builder UI functions:
- `showTab()`, `buildStatSliders()`, `setSlider()`, `applyArchetype()`, `getStats()`, `putStats()`, `renderTribeBuilder()`, `renderTribeSelect()`, `addTribe()`, `removeTribe()`, `updateTribeName()`, `cycleTribeColor()`, `setGender()`, `getGender()`, `submitPlayer()`, `editPlayer()`, `cancelEdit()`, `deleteCurrentEdit()`, `resetForm()`, `filterRoster()`, `rosterKeyNav()`, `highlightRosterItem()`, `fillFromRoster()`, `saveCast()`, `clearCast()`, `renderCast()`, `renderCard()`, `exportCast()`, `importCast()`, `exportRoster()`, `importRoster()`, `syncCastToRoster()`, `_buildPresetData()`, `_applyPreset()`, `exportPreset()`, `importPreset()`, `_getPresets()`, `_savePresets()`, `savePreset()`, `loadPreset()`, `deletePreset()`, `renderPresetList()`, `_buildSeasonSaveData()`, `_applySeasonSave()`, `exportSeason()`, `importSeason()`, `_getSeasonSaves()`, `_saveSeasonSaves()`, `saveSeasonToStorage()`, `loadSeasonFromStorage()`, `deleteSeasonSave()`, `renderSeasonSaveList()`
- Config UI: `buildAdvantageList()`, `toggleAdv()`, `onFinaleFormatChange()`, `toggleRI()`, `toggleSID()`, `saveConfig()`, `renderConfig()`
- Relationship UI: `saveRels()`, `populateRelDropdowns()`, `updateRelAvatars()`, `openRelForm()`, `closeRelForm()`, `setRelType()`, `submitRel()`, `deleteRel()`, `clearRelationships()`, `renderRelList()`
- Alliance UI: `savePreAlliances()`, `openAllianceForm()`, `closeAllianceForm()`, `setAlliancePerm()`, `toggleAllianceMember()`, `submitAlliance()`, `deletePreAlliance()`, `clearPreAlliances()`, `renderAllianceList()`

- [ ] **Step 1-5:** Same pattern

```bash
git commit -m "feat: extract cast builder UI to js/cast-ui.js"
```

---

### Task 24: Extract run-ui.js

**Files:**
- Create: `js/run-ui.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

Extract:
- `initRunTab()`, `renderRunTab()`, `renderGameState()`, `renderEpisodeView()`, `toggleSpoilerFree()`, `renderEpisodeHistory()`, `viewEpisode()`, `simulateNext()`, `simulateMultipleEpisodes()`, `replayEpisode()`, `copyOutput()`, `exportToEpisodePipeline()`, `showSetupPanel()`, `toggleAccordion()`, `updateSlider()`, `updateCastSizeDisplay()`, `setGameMode()`, `saveAdvantage()`, `updateSurvivalDesc()`, `updateMoleUI()`, `toggleMolePlayer()`, `runFanVote()`, `buildEpisodeMap()`, `renderTimeline()`, `toggleEpisode()`, `clearEpisodeSelection()`, `updateSelectedCount()`, `setTwistFilter()`, `renderTwistCatalog()`, `assignTwist()`, `removeTwistFromEpisode()`, `renderTwistList()`, `addTwist()`, `removeTwist()`, `updateTwist()`, `_updateReturnReason()`
- Results tab: `renderResultsTab()`

- [ ] **Step 1-5:** Same pattern

```bash
git commit -m "feat: extract run tab UI to js/run-ui.js"
```

---

### Task 25: Extract savestate.js and wire up init

**Files:**
- Create: `js/savestate.js`
- Modify: `js/main.js`
- Modify: `simulator.html`

Extract state management functions that don't fit cleanly in core.js:
- `saveGameState()` (line ~55844)
- `patchEpisodeHistory(ep)` (line ~55863)
- `snapshotGameState()` (line ~56210)
- `initGameState()` (line ~56263)
- `resetSeason()` (line ~56400)

- [ ] **Step 1-5:** Same pattern

```bash
git commit -m "feat: extract save state management to js/savestate.js"
```

---

### Task 26: Wire init() in main.js and remove inline script

**Files:**
- Modify: `js/main.js`
- Modify: `simulator.html`

This is the final task. At this point, all functions have been extracted. The inline `<script defer>` in `simulator.html` should be empty (or nearly so).

- [ ] **Step 1: Move init() to main.js**

```js
// js/main.js — at the bottom, after all imports and window assignments

import { loadAll } from './core.js';
import { buildStatSliders, buildAdvantageList, renderCast, renderConfig, renderRelList, renderAllianceList, renderPresetList, renderSeasonSaveList } from './cast-ui.js';
import { showTab } from './cast-ui.js';

function init() {
  buildStatSliders();
  buildAdvantageList();
  loadAll();
  renderCast();
  renderConfig();
  renderRelList();
  renderAllianceList();
  renderPresetList();
  renderSeasonSaveList();

  const _sfSaved2 = localStorage.getItem('simulator_spoilerFree') === 'true';
  const _sfCb2 = document.getElementById('cfg-spoiler-free');
  if (_sfCb2) _sfCb2.checked = _sfSaved2;
  window._spoilerFree = _sfSaved2;

  const _savedTab = localStorage.getItem('simulator_activeTab');
  if (_savedTab && ['cast','setup','run','results'].includes(_savedTab)) {
    showTab(_savedTab);
  }
}

init();
```

- [ ] **Step 2: Remove the inline script from simulator.html**

Delete the entire `<script defer>...</script>` block. All that remains is:
```html
<script type="module" src="js/main.js"></script>
```

- [ ] **Step 3: Full regression test**

Test every major flow:
1. **Cast builder:** Add player from roster, edit stats, change tribe, save
2. **Season setup:** Configure tribes, advantages, twists, episode format
3. **Simulate:** Run 5+ episodes, verify no errors in console
4. **VP:** Open visual player for each episode, navigate screens, click reveals
5. **Challenges:** Test at least 3 different challenge twists
6. **Finale:** Simulate through to finale, verify jury vote + winner
7. **Save/load:** Save season, refresh page, load season, verify state restored
8. **Text backlog:** Check output text for each episode
9. **Results tab:** Verify results render

- [ ] **Step 4: Commit**

```bash
git add js/ simulator.html
git commit -m "feat: complete module split — all JS extracted from simulator.html"
```

---

### Task 27: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update project architecture section**

Replace the current architecture description:

```markdown
## Architecture
- `simulator.html` — CSS + HTML shell (opens in browser, no build step)
- `js/main.js` — entry point, imports all modules, exposes to window
- `js/core.js` — shared state (gs, players), constants, config, serialization
- `js/players.js` — pStats, pronouns, romanticCompat, threat utilities
- `js/bonds.js` — bond system + perceived bonds
- `js/alliances.js` — alliance formation, targeting, heat, betrayals
- `js/voting.js` — vote simulation, resolution, SITD
- `js/advantages.js` — advantage finding, idol/non-idol plays
- `js/romance.js` — full romance pipeline (sparks → showmance → breakup)
- `js/episode.js` — simulateEpisode orchestrator, player state, survival, popularity
- `js/camp-events.js` — camp events, social politics, mole, hero/villain
- `js/social-manipulation.js` — forge note, lies, kiss trap, whisper, rally
- `js/twists.js` — applyTwist, dock arrivals, first impressions, journey
- `js/rescue-island.js` — RI choice, duel, reentry, life events
- `js/finale.js` — finale simulation, jury vote, FTC, fan campaign
- `js/challenges-core.js` — pickChallenge, tribe/individual challenge dispatch
- `js/chal/*.js` — one file per challenge (simulate + rpBuild + _text)
- `js/text-backlog.js` — non-challenge text generation, summaries, storylines
- `js/aftermath.js` — aftermath show generation + VP
- `js/vp-screens.js` — buildVPScreens, non-challenge/non-finale rpBuild*
- `js/vp-finale.js` — finale rpBuild* screens
- `js/vp-ui.js` — VP navigation, reveals, particles, search
- `js/cast-ui.js` — cast builder, roster, presets, config, relationships UI
- `js/run-ui.js` — run tab, timeline, twist catalog, episode history
- `js/savestate.js` — save/load, snapshots, patchEpisodeHistory
- `franchise_roster.json` — player database
- `assets/avatars/` — player portrait PNGs
```

- [ ] **Step 2: Update "Do not split" rule**

Remove the "Single file: `simulator.html` (~80,000+ lines). Do not split." line since it's now split.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for modular architecture"
```

---

## Execution Notes

**Parallelization opportunities:**
- Tasks 10-11 (challenge extractions) can all run in parallel — each challenge is independent
- Tasks 12-15 (social-manipulation, camp-events, twists, rescue-island) can run in parallel after Tasks 3-8
- Tasks 18-22 (text-backlog, aftermath, vp-screens, vp-finale, vp-ui) can run in parallel after Task 16

**Risk areas:**
- **Task 2 (core.js extraction):** The timing between module and classic script is the trickiest part. Test carefully.
- **Task 16 (episode.js):** Has the most imports — if any dependency is missing, the simulation breaks.
- **Task 20 (vp-screens.js):** `buildVPScreens` references every challenge's rpBuild function. It needs access to the CHALLENGES registry.
- **Task 26 (final wiring):** The full regression test is critical. Budget extra time.

**If something breaks:** The most common issue will be a function that's called from an onclick handler but wasn't exposed on `window`. Check the browser console — it'll say `functionName is not defined`. Fix: add `window.functionName = functionName` in the module that exports it, or in `main.js`.
