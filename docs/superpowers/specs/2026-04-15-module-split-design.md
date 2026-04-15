# Module Split Design: simulator.html -> ES Modules

**Date:** 2026-04-15
**Goal:** Split the 81,622-line `simulator.html` into ES modules with no build step. Reduce AI token cost 3-5x per task while preserving the open-in-browser workflow.

## Approach

- `index.html` becomes a shell: CSS + `<script type="module" src="js/main.js">`
- All JS moves into `js/` as ES modules with `import`/`export`
- No bundler, no npm, no dev server. Open `index.html` in a browser, it works.
- Shared state (`gs`, `players`, helpers) exported from `core.js`, imported where needed.

## Shared State Pattern

```js
// js/core.js
export let gs = {};
export let players = [];
export function setGs(newGs) { gs = newGs; }
export function setPlayers(newPlayers) { players = newPlayers; }

// js/some-module.js
import { gs, players } from './core.js';
// gs and players are live bindings — always current
```

ES module `export let` gives live bindings. When `core.js` mutates `gs.bonds`, every importer sees it. No global namespace pollution.

For DOM globals (`document.getElementById` etc.), modules access them directly — no import needed.

## File Structure

```
dc-franchise-db/
  index.html              # CSS + <script type="module" src="js/main.js">
  js/
    main.js               # imports everything, wires up init(), event listeners
    core.js               # gs, players, config, save/load, serialization
    players.js            # pStats, pronouns, romanticCompat, threat, challengeWeakness
    bonds.js              # getBond, addBond, perceivedBond, updateBonds, recoverBonds
    alliances.js          # formAlliances, pickTarget, wRandom, betrayals, heat, trust decay
    voting.js             # buildVoteReason, simulateVotes, resolveVotes, revote, SITD
    advantages.js         # findAdvantages, idol plays, non-idol plays, inheritance
    romance.js            # sparks, first move, showmance, love triangle, affair pipeline
    episode.js            # simulateEpisode, updatePlayerStates, survival, popularity
    camp-events.js        # allCampEvents, generateCampEventsForGroup, social politics, mole
    social-manipulation.js # forge note, spread lies, kiss trap, whisper, rally, expose, comfort
    twists.js             # applyTwist, dock arrivals, first impressions, journey, exile
    rescue-island.js      # RI choice, duel, reentry, life events
    finale.js             # simulateFinale, jury vote, FTC, fan campaign, fire-making
    challenges-core.js    # pickChallenge, simulateTribe/Individual, selectSitOuts, updateChalRecord
    text-backlog.js       # non-challenge _text* functions, summaryText, storylines, coldOpen
    aftermath.js          # generateAftermathShow + aftermath VP screens
    vp-screens.js         # buildVPScreens, non-challenge rpBuild* (tribes, camp, tribal, votes)
    vp-finale.js          # finale rpBuild* (FTC, jury, winner, reunion, stats)
    vp-ui.js              # VP navigation, reveal mechanics, particles, search
    cast-ui.js            # cast builder, sliders, roster, presets, config, relationships, alliances UI
    run-ui.js             # run tab, timeline, twist catalog, episode map, episode history
    chal/
      cliff-dive.js       # simulate + rpBuild + _text for Cliff Dive
      awake-a-thon.js     # simulate + rpBuild + _text for Awake-A-Thon
      dodgebrawl.js       # simulate + rpBuild + _text for Dodgebrawl
      talent-show.js      # simulate + rpBuild + _text for Talent Show
      sucky-outdoors.js   # simulate + rpBuild + _text for Sucky Outdoors
      up-the-creek.js     # simulate + rpBuild + _text for Up the Creek
      paintball-hunt.js   # simulate + rpBuild + _text for Paintball Hunt
      hells-kitchen.js    # simulate + rpBuild + _text for Hell's Kitchen
      trust.js            # simulate + rpBuild + _text for Who Can You Trust?
      basic-straining.js  # simulate + rpBuild + _text for Basic Straining
      x-treme-torture.js  # simulate + rpBuild + _text for X-Treme Torture
      phobia-factor.js    # simulate + rpBuild + _text for Phobia Factor
      brunch.js           # simulate + rpBuild + _text for Brunch of Disgustingness
      lucky-hunt.js       # simulate + rpBuild + _text for Lucky Hunt
      say-uncle.js        # simulate + rpBuild + _text for Say Uncle
      triple-dog-dare.js  # simulate + rpBuild + _text for Triple Dog Dare
      slasher-night.js    # simulate + rpBuild + _text for Slasher Night
```

**Total: 37 modules + index.html**

## Module Details

### core.js (~800 lines)
Owns all mutable shared state. Single source of truth.

**Exports:**
- `gs`, `players`, `relationships`, `preGameAlliances`, `seasonConfig`
- `setGs()`, `setPlayers()` — for full replacement (load/reset)
- `defaultConfig()`, `repairGsSets()`, `prepGsForSave()`
- `loadAll()`, `saveGameState()`, `snapshotGameState()`
- `initGameState()`, `resetSeason()`
- `patchEpisodeHistory()`
- Constants: `STATS`, `THREAT_TIERS`, `ARCHETYPES`, etc.

**Why it's one module:** Everything that touches `gs` initialization/serialization belongs together. Prevents circular deps — other modules import state from here, never the reverse.

### players.js (~600 lines)
Pure functions that read player data. No state mutation.

**Exports:** `pStats()`, `pronouns()`, `Pronouns()`, `romanticCompat()`, `threat()`, `threatTier()`, `overall()`, `getPlayerState()`, `challengeWeakness()`, `updateChalRecord()`

**Imports from:** `core.js` (gs, players)

### bonds.js (~500 lines)
Bond math and perceived bond tracking.

**Exports:** `bKey()`, `getBond()`, `setBond()`, `addBond()`, `getPerceivedBond()`, `addPerceivedBond()`, `removePerceivedBondsFor()`, `updatePerceivedBonds()`, `checkPerceivedBondTriggers()`, `updateBonds()`, `recoverBonds()`

**Imports from:** `core.js` (gs), `players.js` (pStats, pronouns)

### alliances.js (~800 lines)
Alliance formation, targeting logic, heat computation.

**Exports:** `formAlliances()`, `pickTarget()`, `wRandom()`, `detectBetrayals()`, `decayAllianceTrust()`, `nameNewAlliance()`, `computeHeat()`, `isAllianceBottom()`

**Imports from:** `core.js` (gs), `players.js` (pStats), `bonds.js` (getBond, getPerceivedBond)

### voting.js (~1100 lines)
Vote simulation and resolution.

**Exports:** `buildVoteReason()`, `simulateVotes()`, `resolveVotes()`, `simulateRevote()`, `checkShotInDark()`

**Imports from:** `core.js`, `players.js`, `bonds.js`, `alliances.js`

### advantages.js (~1100 lines)
Advantage finding, idol plays, non-idol plays.

**Exports:** `findAdvantages()`, `checkIdolPreTribal()`, `checkIdolPlays()`, `checkNonIdolAdvantageUse()`, `handleAdvantageInheritance()`

**Imports from:** `core.js`, `players.js`, `bonds.js`

### romance.js (~1500 lines)
Full romance pipeline from spark to breakup.

**Exports:** `_challengeRomanceSpark()`, `updateRomanticSparks()`, `checkFirstMove()`, `checkShowmanceSabotage()`, `_checkShowmanceChalMoment()`, `getShowmance()`, `getShowmancePartner()`, `checkShowmanceFormation()`, `updateShowmancePhases()`, `checkShowmanceTest()`, `checkShowmanceBreakup()`, `checkLoveTriangleFormation()`, `checkLoveTriangleBreakup()`, `updateLoveTrianglePhases()`, `updateAffairExposure()`

**Imports from:** `core.js`, `players.js`, `bonds.js`

### episode.js (~4500 lines)
The main simulation loop and state update functions.

**Exports:** `simulateEpisode()`, `updatePlayerStates()`, `updateSurvival()`, `generateSurvivalEvents()`, `updatePopularity()`, `applyPostTribalConsequences()`, `checkTribalBlowup()`, `applyCrashoutEffects()`, `handleExileFormat()`

**Imports from:** Nearly everything — this is the orchestrator. It calls into challenges, voting, camp events, twists, etc.

### camp-events.js (~5000 lines)
Camp event generation and social systems.

**Exports:** `allCampEvents()`, `generateCampEventsForGroup()`, `generateCampEvents()`, `checkAllianceRecruitment()`, `checkParanoiaSpiral()`, `checkInformationBroker()`, `checkStolenCredit()`, `checkSocialBomb()`, `checkGoatTargeting()`, `checkAllianceQuitting()`, `checkFakeIdolPlant()`, `generateFakeIdolTipOffEvents()`, `generateBlackVoteGuessEvents()`, `checkIdolConfessions()`, `checkTeamSwapConfessions()`, `checkSafetyNoPowerConfessions()`, `checkSoleVoteConfessions()`, `checkSocialIntel()`, `checkSecondLifeAmuletEvents()`, `checkLegacyCampEvents()`, `checkTacticalAdvantageSnoop()`, `checkHeroVillainEvents()`, `checkMoleSabotage()`, `checkVolunteerExileDuel()`, `checkSocialPolitics()`, `checkSideDealBreaks()`, `checkConflictingDeals()`, `checkFalseInfoBlowup()`, `checkComfortBlindspot()`

**Imports from:** `core.js`, `players.js`, `bonds.js`, `alliances.js`, `romance.js`

### social-manipulation.js (~600 lines)
Standalone social manipulation camp events.

**Exports:** `generateSocialManipulationEvents()`, `_generateForgeNote()`, `_generateSpreadLies()`, `_generateKissTrap()`, `_generateWhisperCampaign()`, `_generateCampaignRally()`, `_generateExposeSchemer()`, `_generateComfortVictim()`

**Imports from:** `core.js`, `players.js`, `bonds.js`

### twists.js (~3500 lines)
Twist application and special episode events.

**Exports:** `applyTwist()`, `generateDockArrivals()`, `executeFirstImpressions()`, `simulateJourney()`, `generateTwistScenes()`

**Imports from:** `core.js`, `players.js`, `bonds.js`, `alliances.js`

### rescue-island.js (~500 lines)
Rescue Island / Redemption Island system.

**Exports:** `isRIStillActive()`, `simulateRIChoice()`, `simulateRIDuel()`, `simulateRIReentry()`, `generateRILifeEvents()`, `generateRIPostDuelEvents()`, `generateRescueIslandLife()`

**Imports from:** `core.js`, `players.js`, `bonds.js`

### finale.js (~2000 lines)
Full finale simulation.

**Exports:** `simulateFinale()`, `simulateJuryVote()`, `projectJuryVotes()`, `generateFinaleCampOverride()`, `generateFinalChallengeStages()`, `generateBenchAssignments()`, `selectAssistants()`, `simulateFinaleChallenge()`, `applyFTCSwingVotes()`, `generateFTCData()`, `generateFanCampaign()`, `simulateFanVote()`, `simulateJuryRoundtable()`

**Imports from:** `core.js`, `players.js`, `bonds.js`, `alliances.js`

### challenges-core.js (~500 lines)
Challenge infrastructure shared by all challenges.

**Exports:** `pickChallenge()`, `pickReward()`, `selectSitOuts()`, `simulateTribeChallenge()`, `simulateIndividualChallenge()`, `simulateLastChance()`

**Imports from:** `core.js`, `players.js`

### chal/*.js (17 modules, 500-3000 lines each)
Each challenge module exports its simulate, rpBuild, and _text functions.

**Pattern:**
```js
// js/chal/lucky-hunt.js
import { gs, players } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond, addBond } from '../bonds.js';

export function simulateLuckyHunt(ep) { ... }
export function rpBuildLuckyHunt(ep) { ... }
export function _textLuckyHunt(ep, ln, sec) { ... }
// + all _lh* helper functions (private to module, not exported)
```

**Imports from:** `core.js`, `players.js`, `bonds.js`, `romance.js` (for `_checkShowmanceChalMoment`)

### text-backlog.js (~2000 lines)
Non-challenge text generation.

**Exports:** All `_text*` functions not owned by a challenge module (meta, cast, cold open, merge, camp, votes, tribal, etc.), `generateSummaryText()`, `buildStorylines()`, `buildColdOpen()`, `buildNextEpQs()`

**Imports from:** `core.js`, `players.js`

### aftermath.js (~1500 lines)
Aftermath show system.

**Exports:** `generateAftermathShow()`, all `rpBuildAftermath*()` functions

**Imports from:** `core.js`, `players.js`, `bonds.js`

### vp-screens.js (~5000 lines)
VP screen builders for non-challenge, non-finale content.

**Exports:** `buildVPScreens()`, `rpBuildColdOpen()`, `rpBuildTribes()`, `rpBuildCampTribe()`, `rpBuildChallenge()`, `rpBuildRewardChallenge()`, `rpBuildVotingPlans()`, `rpBuildTribal()`, `rpBuildVotes()`, `rpBuildRelationships()`, twist/merge/RI screens, etc.

**Imports from:** `core.js`, `players.js`, `bonds.js`, all `chal/*.js` (to call their rpBuild functions)

### vp-finale.js (~2000 lines)
Finale VP screens.

**Exports:** All finale `rpBuild*()` functions (FTC, jury, winner, reunion, season stats, fan vote)

**Imports from:** `core.js`, `players.js`

### vp-ui.js (~800 lines)
VP interaction layer.

**Exports:** `renderVPScreen()`, `openVisualPlayer()`, `closeVisualPlayer()`, `vpNext()`, `vpPrev()`, `vpGoTo()`, `vpToggleSection()`, `vpToggleSearch()`, `vpSearchHighlight()`, all reveal functions, particle system

**Imports from:** `core.js`

### cast-ui.js (~2500 lines)
Cast builder and configuration UI.

**Exports:** `renderCast()`, `renderCard()`, `buildStatSliders()`, `submitPlayer()`, `editPlayer()`, roster functions, preset functions, season save functions, `renderConfig()`, `buildAdvantageList()`, relationship UI, alliance UI

**Imports from:** `core.js`, `players.js`

### run-ui.js (~1500 lines)
Run tab and episode management UI.

**Exports:** `initRunTab()`, `renderRunTab()`, `renderGameState()`, `renderEpisodeView()`, `renderEpisodeHistory()`, `simulateNext()`, `simulateMultipleEpisodes()`, `replayEpisode()`, `buildEpisodeMap()`, `renderTimeline()`, twist catalog functions

**Imports from:** `core.js`, `episode.js`, `finale.js`, `vp-screens.js`

### main.js (~100 lines)
Entry point. Imports all modules, registers challenge functions in a lookup table, calls `init()`.

```js
import { loadAll, init } from './core.js';
import { simulateCliffDive, rpBuildCliffDive, _textCliffDive } from './chal/cliff-dive.js';
// ... all other imports

// Challenge registry so episode.js can look up by twist ID
export const CHALLENGES = {
  'cliff-dive': { simulate: simulateCliffDive, rpBuild: rpBuildCliffDive, text: _textCliffDive },
  // ...
};

init();
```

## Dependency Graph (simplified)

```
main.js
  -> core.js (state, config, save/load)
  -> players.js -> core
  -> bonds.js -> core, players
  -> alliances.js -> core, players, bonds
  -> voting.js -> core, players, bonds, alliances
  -> advantages.js -> core, players, bonds
  -> romance.js -> core, players, bonds
  -> camp-events.js -> core, players, bonds, alliances, romance
  -> social-manipulation.js -> core, players, bonds
  -> twists.js -> core, players, bonds, alliances
  -> rescue-island.js -> core, players, bonds
  -> challenges-core.js -> core, players
  -> chal/*.js -> core, players, bonds, romance
  -> episode.js -> (orchestrates everything above)
  -> finale.js -> core, players, bonds, alliances
  -> text-backlog.js -> core, players
  -> aftermath.js -> core, players, bonds
  -> vp-screens.js -> core, players, bonds, chal/*
  -> vp-finale.js -> core, players
  -> vp-ui.js -> core
  -> cast-ui.js -> core, players
  -> run-ui.js -> core, episode, finale, vp-screens
```

No circular dependencies. `core.js` is a leaf — it imports nothing from the project.

## Challenge Registry Pattern

`episode.js` currently calls `simulateCliffDive(ep)` etc. directly. After the split, it needs to find the right function by twist ID. Solution: a registry object in `main.js`.

```js
// main.js builds the registry
export const CHALLENGES = { ... };

// episode.js imports it
import { CHALLENGES } from './main.js';
// Then: CHALLENGES[twistId].simulate(ep);
```

This avoids `episode.js` importing all 17 challenge modules directly.

## Migration Strategy

1. **Create `js/` directory and `main.js`**
2. **Extract `core.js` first** — the foundation everything imports from
3. **Extract leaf modules next** — `players.js`, `bonds.js` (few dependencies)
4. **Extract challenge modules** — each is self-contained, biggest token win
5. **Extract remaining systems** — voting, advantages, romance, camp-events, etc.
6. **Extract UI modules last** — cast-ui, run-ui, vp-screens (most DOM coupling)
7. **Convert `index.html`** — strip all JS, keep CSS, add `<script type="module">`
8. **Test each extraction** — open in browser, simulate an episode, verify VP works

Each step produces a working app. No big-bang migration.

## Token Cost Impact

| Scenario | Before (single file) | After (modules) |
|----------|---------------------|-----------------|
| Fix Lucky Hunt bug | ~15-20K tokens reading | ~3K (chal/lucky-hunt.js) |
| Add new camp event | ~10-15K tokens | ~5K (camp-events.js) |
| Adjust vote logic | ~8-12K tokens | ~3K (voting.js) |
| New challenge | ~20K+ tokens | ~2K (challenges-core.js + template) |
| Full season debug | ~30K+ tokens | ~10K (episode.js + relevant module) |

Estimated **3-5x reduction** in per-task token cost.

## What Changes for the User

- Open `index.html` in browser — same as before
- File structure is now `js/` with named modules instead of one mega-file
- Git diffs are cleaner and scoped to the system that changed
- AI agents can work on different modules in parallel

## What Doesn't Change

- No build step, no npm, no dev server
- All game mechanics identical
- Save/load compatibility (same localStorage format)
- Same CSS (stays in index.html)
