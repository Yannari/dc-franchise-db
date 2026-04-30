## Project
DC Franchise Simulator — a Survivor-style franchise simulator.
ES modules, no build step. Open `simulator.html` in a browser.

## Architecture
- `simulator.html` — CSS + HTML shell (no JS, loads `js/main.js`)
- `js/main.js` — entry point, imports all modules, exposes on window for onclick handlers
- `js/core.js` — shared state (`gs`, `players`), constants, config, serialization
- `js/players.js` — `pStats`, `pronouns`, `romanticCompat`, threat utilities
- `js/bonds.js` — bond system + perceived bonds
- `js/alliances.js` — alliance formation, targeting, heat, betrayals
- `js/voting.js` — vote simulation, resolution, SITD
- `js/advantages.js` — advantage finding, idol/non-idol plays
- `js/romance.js` — full romance pipeline (sparks -> showmance -> breakup)
- `js/episode.js` — `simulateEpisode` orchestrator, player state, survival, popularity
- `js/camp-events.js` — camp events, social politics, mole, hero/villain
- `js/social-manipulation.js` — forge note, lies, kiss trap, whisper, rally
- `js/twists.js` — `applyTwist`, dock arrivals, first impressions, journey
- `js/rescue-island.js` — RI choice, duel, reentry, life events
- `js/finale.js` — finale simulation, jury vote, FTC, fan campaign
- `js/challenges-core.js` — `pickChallenge`, tribe/individual challenge dispatch
- `js/chal/*.js` — one file per challenge (simulate + rpBuild + _text)
- `js/text-backlog.js` — non-challenge text generation, summaries, storylines
- `js/aftermath.js` — aftermath show generation + VP
- `js/vp-screens.js` — `buildVPScreens`, non-challenge/non-finale rpBuild*
- `js/vp-finale.js` — finale rpBuild* screens
- `js/vp-ui.js` — VP navigation, reveals, particles, search
- `js/cast-ui.js` — cast builder, roster, presets, config, relationships UI
- `js/run-ui.js` — run tab, timeline, twist catalog, episode history
- `js/savestate.js` — save/load, snapshots, `patchEpisodeHistory`
- `franchise_roster.json` — player database (name, stats, archetype, slug)
- `assets/avatars/` — player portrait PNGs

### Module Pattern
- `core.js` exports mutable state with setter functions (`setGs()`, `setPlayers()`)
- `main.js` uses `Object.defineProperty` to expose state on `window` as getters/setters
- All exported functions are exposed on `window` for onclick handlers
- Modules import from each other; no circular dependencies
- `core.js` is a leaf — imports nothing from the project

## Non-Negotiable Rules

### Stats are ALWAYS Proportional
`stat * factor` — never `if (stat >= X)` for gameplay. Thresholds ONLY for narrative text selection.

### Archetype Access
`pStats(name)` = stats ONLY. `players.find(p => p.name === name)?.archetype` for archetype.

### Valid Archetypes
`mastermind`, `schemer`, `hothead`, `challenge-beast`, `social-butterfly`, `loyal-soldier`, `wildcard`, `chaos-agent`, `floater`, `underdog`, `hero`, `villain`, `goat`, `perceptive-player`, `showmancer`. Do NOT invent archetypes that don't exist (no `brainiac`, `nerd`, `protector`, `loyal`, `black-widow`).

### Archetype Behavior Rules
- **Villain archetypes** (villain, mastermind, schemer): can scheme, sabotage, steal, ambush, taunt
- **Nice archetypes** (hero, loyal-soldier, social-butterfly, showmancer, underdog, goat): NEVER scheme, sabotage, steal, or ambush. CAN encourage, guard, bond, help.
- **Neutral archetypes** (hothead, challenge-beast, wildcard, chaos-agent, floater, perceptive-player): can scheme/sabotage only with strategic >= 6 AND loyalty <= 4

### Pronouns
`pronouns(name)` → `{sub, obj, pos, posAdj, ref, Sub, Obj, PosAdj}`. `posAdj` before nouns, `pos` standalone. NO `Pos` property.

### Behavior > Stats
Check behavioral track record alongside raw stats.

### Every Feature Needs VP + Text Backlog
VP screens (`rpBuild*`) + text backlog. Neither optional. For twist challenges, prefer `_textTwistChallenge()` which renders VP screens as plain text automatically — no custom `_text` function needed. The text backlog must be a complete retranscription of the VP narration, placed BEFORE `_textCampPost` in `generateSummaryText()`.

### Camp Events Must Have Consequences
Bond/state/information changes. `players: []` array + `badgeText`/`badgeClass` required.

### ALL Social Events Must Have Consequences
Every social event inside a challenge — collisions, taunts, helps, steals, encouragement, trash talk, rivalry, banter — MUST have gameplay consequences (`addBond`, `popDelta`, camp event injection, or state changes). No event should be purely cosmetic text. If a player does something to another player, it must affect their relationship or reputation.

### Serialization
Functions don't survive `JSON.stringify`. Pre-render text as strings. Sets need `prepGsForSave()`/`repairGsSets()`.

### Popularity System
Every challenge event that's heroic, villainous, cowardly, or selfless must affect `gs.popularity[name]`. Pattern: `if (!gs.popularity) gs.popularity = {}; gs.popularity[name] = (gs.popularity[name] || 0) + delta;`

## Challenge Rules

### Required Per Challenge
- `updateChalRecord(ep)` with `ep.chalMemberScores`
- Debug challenge tab + VP screen + text backlog + cold open + timeline tag
- Badge text/class for all event types
- `patchEpisodeHistory` + all challenge twists mutually incompatible
- Skip main `updateChalRecord` (add to skip list)
- Showmance moments if challenge has downtime/partner interaction/danger
- Popularity changes for heroic/villain/coward moments
- `chalSeries` in TWIST_CATALOG entry — every challenge from a specific show MUST have an origin series (`'island'`, `'action'`, `'world-tour'`, `'revenge'`, `'all-stars'`, `'pahkitew'`, `'ridonculous'`, `'dc1'`–`'dc5'`). If a challenge is an original mechanic with no show origin, omit `chalSeries`.
- `chalStyle` in TWIST_CATALOG entry — every challenge MUST have a style tag for the randomizer's category-aware pacing. Valid values: `'physical'`, `'endurance'`, `'hunt'`, `'social'`, `'puzzle'`, `'adventure'`, `'chaos'`. The randomizer avoids placing two consecutive episodes with the same style.

### Scoring Balance
Tribe scores: averages per member, NEVER raw sums.

### VP Pattern
`_tvState[key]` with `idx: -1` for click-to-reveal. Save/restore scrollTop. When rebuilding VP screens from a reveal handler, preserve `vpCurrentScreen` by finding the screen index after `buildVPScreens`.

## Core State
- `gs` — global state. `gs.episodeHistory[]` for VP.
- `getBond(a,b)` / `addBond(a,b,delta)` — symmetric, -10 to +10
- `getPerceivedBond(a,b)` — for votes/alliances/heat decisions
- `gs.advantages[]`, `gs.namedAlliances[]`, `gs.showmances[]`, `gs.romanticSparks[]`
- `gs.popularity` — per-player popularity tracking, affects fan perception
- Temporary heat: `gs._emissaryHeat`, `gs._dodgebrawlHeat`, `gs._talentShowHeat`, `gs._suckyOutdoorsHeat`, `gs._upTheCreekHeat`, `gs._paintballHeat`, `gs._cookingHeat`, `gs._trustHeat` (`{ amount, expiresEp }`), `gs._basicStrainingHeat` (`{ target, amount, expiresEp }`), `gs._cliffDiveBlame`, `gs._luckyHuntHeat`, `gs._schemeHeat`, `gs._hideSeekHeat` (`{ target, amount, expiresEp }`), `gs._bikeRaceHeat` (`{ amount, expiresEp }`), `gs._monsterCashHeat` (`{ target, amount, expiresEp }`)

## Scope Gotchas
- `ep` NOT available in: `generateCampEventsForGroup` (camp-events.js), `simulateIndividualChallenge`/`simulateTribeChallenge` (challenges-core.js), `computeHeat` (alliances.js)
- `ep.extraImmune` — always MERGE, never overwrite
- `applyTwist` (twists.js) fires BEFORE challenge — set flags there, run logic after
- Merge camp key: `gs.mergeName || 'merge'`
- `romanticCompat(a, b)` (players.js) — check before any romance/kiss events (real or fake)
- Module state mutations: use setter functions (`setGs()`, `setPlayers()`) from core.js, not direct assignment on imports
- Cross-module function calls: functions on `window` work as bare calls in module code; for explicit imports use `import { fn } from './module.js'`

## Challenge Twists

### Pre-Merge
| ID | Name | Key Mechanic |
|---|---|---|
| `phobia-factor` | Phobia Factor | Fear completion %, clutch triple points |
| `cliff-dive` | Cliff Dive | 3-phase: jump/haul/build. Host commentary, tiered chickens (bold choke vs timid acceptance), peer cascade + convince/force interventions, per-player scoring, build captain, wagon advantage (100% rate or 20% gap) |
| `awake-a-thon` | Awake-A-Thon | 3-phase: run/feast/awake, sequential dropout |
| `dodgebrawl` | Dodgebrawl | Multi-round dodgeball, per-player elimination |
| `talent-show` | Talent Show | Auditions → backstage → show, Chef-O-Meter |
| `sucky-outdoors` | Sucky Outdoors | 5-phase overnight survival. Food/hunger system (tribeFood tracker), living campQuality across phases (shelter/fire/rain/bear modify it), multi-beat bear setpiece, morning race with fatigue/stumble/rally/carry, camp reinforcement at nightfall |
| `up-the-creek` | Up the Creek | 4-phase canoe race, partner chemistry |
| `paintball-hunt` | Paintball Hunt | Hunter/deer split, round elimination |
| `hells-kitchen` | Hell's Kitchen | 3-course cooking, sabotage, food fights |
| `trust-challenge` | Who Can You Trust? | 3-round pair trust, narrative arc per round |
| `basic-straining` | Basic Straining | 6-phase boot camp, defiance, food raid, boathouse elimination |
| `x-treme-torture` | X-Treme Torture | 3 extreme sport events (skydiving, moose rodeo, mud skiing). One player per tribe per event. |

### Post-Merge
| ID | Name | Key Mechanic |
|---|---|---|
| `say-uncle` | Say Uncle | 4-phase Dungeon of Misfortune: Wheel→Gauntlet→Rack→Final Sentence. Pillory spectators, showmance moments, host commentary. Dominator pick + backfire. |
| `brunch-of-disgustingness` | Brunch of Disgustingness | Boys vs girls merge split. Cabin dynamics (7-8 events/team). 9-course eating: refusals, pressure-to-eat, chain vomit. Eat-off tiebreaker. Winning team immunity. |
| `triple-dog-dare` | Triple Dog Dare | Sudden death, freebie economy |
| `sudden-death` | Sudden Death | Last place auto-eliminated |
| `slasher-night` | Slasher Night | Round-by-round hunt, lowest eliminated |
| `lucky-hunt` | Lucky Hunt | Post-merge scavenger hunt. 28 unique locations (4 tiers). Timeline-based engine with interleaved attempts + events. Hunt events: help, sabotage, steal, ambush, taunt, intel trade, discovery, panic, showoff, encouragement, guard, bonding, alliance moment, rivalry. Chest ceremony: immunity, booby trap, shareable, advantage, food items. Dud keys (15%). VP: quest board clue draw + live status tracker + pirate theme. |
| `hide-and-be-sneaky` | Hide and Be Sneaky | 5-phase: hide/hunt/betray/escape/showdown. Chef hunts with water gun. Archetype-driven betrayal (villains rat, nice stay loyal, neutrals need strategic>=6+loyalty<=4). 3-4 events per hunt round with hiding quality bonuses/maluses. Cat-and-mouse showdown. 1-2 immunity winners. Night-vision surveillance VP. |
| `off-the-chain` | That's Off the Chain! | Post-merge bike build + race. Build phase with sabotage/help events, Chris judges bikes, swap mechanic (ride rival's bike). Two-part race: sprint + obstacle gauntlet. Bikes fall apart mid-race. Elimination reactions, rivalry heat. Motocross demolition derby VP theme. |
| `super-hero-ld` | Super Hero-ld | Battle royale. 6 power types (Fire>Earth>Tech>Psychic>Shadow>Water), stat-pair assignment, priority draft. Costume contest (top 3 prizes: shield/momentum/zone pick). Multi-round zone fights with momentum system (3-5 exchanges). Between-fight micro-events. Mega Pythonicus boss fight with kill-steal. Comic book VP. |
| `princess-pride` | The Princess Pride | Fairy tale quest. Glass slipper crowns Princess/Prince (gender-adaptive). 6 knight classes (Knight/Ranger/Mage/Rogue/Bard/Barbarian) with priority draft. 4 phases (Forest/Bridge/Dragon/Tower), 3 beats each. Class advantages per beat. Princess gives sword+armor advantages, has 1 save. Top knight duels Princess for immunity. Happy ending possible (showmance/high bond = both get immunity). Storybook VP with phase-specific environments. |

### Both Phases
| ID | Name | Key Mechanic |
|---|---|---|
| `basic-straining` | Basic Straining | Pre: first tribe to zero loses. Post: last standing wins immunity. |
| `monster-cash` | Monster Cash | Monster movie hunt. Chef's animatronic prowls the film lot. Monster escalates through 5 threat levels (Awakening→Final Form). Capture events, rescues, sabotage. Pre-merge: tribe immunity by avg survival. Post-merge: last standing wins, normal tribal council follows. |

## Social Manipulation Camp Events (Standalone)
Fires in ANY episode (not tied to a challenge). Rate: ~15% per eligible schemer per episode, boosted to ~40% during Lucky Hunt.

**Schemer eligibility:** villain/mastermind/schemer archetypes always. Neutral archetypes need strategic >= 6 + loyalty <= 4. Nice archetypes NEVER scheme.

| Event | Mechanic |
|---|---|
| Forge Note | Schemer plants fake note. Belief check: noteQuality vs mental+intuition. 3 outcomes: believed/skeptical/detected. |
| Spread Lies | Face-to-face. Social persuasion vs resistance. Can trigger confrontation sub-event. |
| Kiss Trap | Rarest. Needs showmance + accomplice + romantic compatibility. Showmance destruction possible. |
| Whisper Campaign | Subtle. Seeds doubt with 5-6 individuals. Hard to trace. |
| Campaign Rally | Social player rallies votes against a target. Heat applied. |
| Expose Schemer | Reaction event. High-intuition player catches a scheme. Schemer takes massive heat. |
| Comfort Victim | Reaction event. Loyal player comforts scheme victim. Bond boost + potential alliance. |

## Returning Player Twist
Configurable 1-3 returnees per episode. Each slot has a "reason for returning" that drives selection weights:
- `random` — baseline strategic + noise
- `unfinished-business` — bond strength with active players, was blindsided
- `entertainment` — showmance involvement, social stat, boldness
- `strategic-threat` — strategic stat, alliance membership, enemy count
- `underdog` — eliminated early, low threat

UI: count dropdown (1-3) + per-slot reason dropdown in Episode Format Designer.

## Key Systems

### Romance
Toggle: `seasonConfig.romance`. Pipeline: spark → intensity → first move → showmance → love triangle → affair. `_challengeRomanceSpark()` for challenges. `_checkShowmanceChalMoment()` for existing showmances. Always check `romanticCompat(a, b)` before romance events — including fake/sabotage kisses.

### The Mole
Season twist. 5 sabotage types. Suspicion tracking. Exposure at 3.0.

### Social Politics
3-5 actions/ep: side deals, info trades, loyalty tests. Vote pitches at tribal. Social manipulation events (forge note, lies, kiss trap, etc.) fire based on cast composition.

## Collaboration Style
- Think independently — brainstorm and propose
- Always propose before implementing
- Camp events MUST have gameplay consequences
- Information from mechanics must flow into targeting
- Skip spec/plan for challenge designs — go straight from brainstorm to implementation

## How to Create a New Twist Challenge (Complete Guide)

### Step 1: File Creation
Create `js/chal/<challenge-id>.js`. Use an existing challenge (e.g., `super-hero-ld.js` or `princess-pride.js`) as a template. Standard imports:
```javascript
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';
```

### Step 2: Integration Points (ALL required)
**5 files must be updated:**

1. **`js/core.js`** — Add TWIST_CATALOG entry:
   ```javascript
   { id:'challenge-id', emoji:'🎯', name:'Challenge Name', category:'challenge',
     chalSeries:'action', chalStyle:'adventure', phase:'post-merge',
     desc:'Description...', engineType:'challenge-id',
     incompatible:[...all other challenge IDs...] }
   ```

2. **`js/twists.js`** — Add `engineType` → flag mapping in `applyTwist()`:
   ```javascript
   } else if (engineType === 'challenge-id') {
     ep.isChallengeId = true;
   ```
   No merge/phase checks here — let episode.js handle that.

3. **`js/episode.js`** — SEVEN places to update:
   - **Import**: `import { simulateChallengeId } from './chal/challenge-id.js';`
   - **Dispatch block** (near other post-merge challenges ~line 1475):
     ```javascript
     if (ep.isChallengeId && gs.isMerged) {
       simulateChallengeId(ep);
       ep.immunityWinner = ep.challengeData?.immunityWinner || ep.immunityWinner;
       ep.challengeType = 'challenge-id';
     }
     ```
   - **Generic challenge skip** (~line 2221): add `|| ep.isChallengeId` to the `isMonsterCash || isOperationClassified || ...` condition
   - **Generic updateChalRecord guard** (~line 2545): add `&& !ep.isChallengeId` — prevents double-calling. The twist challenge's `simulate` function already calls `updateChalRecord(ep)` internally; this guard stops the GENERIC catch-all from calling it a second time (which would double-count wins/podiums/bombs).
   - **`_hasTwistChallenge` list** (~line 1640): add `|| ep.isChallengeId` — THIS IS CRITICAL for sudden-death compatibility. Without it, sudden death runs its own generic challenge instead of using the twist challenge results to eliminate last place.
   - **`handleExileFormat` guard** (~line 991): add `|| ep.isChallengeId` — prevents exile format from interfering with the twist challenge.
   - **Episode history save** — add `isChallengeId: ep.isChallengeId || false, challengeData: ep.challengeData || null` to ALL `gs.episodeHistory.push` calls in episode.js (there are 4+: main ~line 5400, no-tribal ~line 2918, sudden-death ~line 1715, sudden-death+twist ~line 2417). Missing any one = VP screens show nothing on replay for that episode type.

4. **`js/vp-screens.js`** — Add import + screen registration:
   ```javascript
   import { rpBuild..., revealNext, revealAll } from './chal/challenge-id.js';
   // In buildVPScreens(), add:
   } else if ((ep.isChallengeId || ep.challengeType === 'challenge-id') && ep.challengeData) {
     vpScreens.push({ id:'xx-title', label:'Title', html: rpBuildTitleCard(ep) });
     // ... more screens
   }
   ```

5. **`js/text-backlog.js`** — Two options for text backlog:

   **Option A (recommended): VP-rendered text backlog** — uses `_textTwistChallenge()` to call VP builder functions and strip HTML. This automatically outputs the exact narration from the VP screens with zero manual work:
   ```javascript
   // In text-backlog.js — import VP builders:
   import { rpBuildChallengeTitleCard, rpBuildChallengePhase1, ... } from './chal/challenge-id.js';
   // In generateSummaryText() — call generic renderer:
   if (ep.challengeData) {
     _textTwistChallenge(ep, ln, sec, 'challengeData', 'CHALLENGE NAME', [
       rpBuildChallengeTitleCard, rpBuildChallengePhase1, ...
     ]);
   }
   ```
   Place the call in the twist challenges block (BEFORE `_textCampPost`).

   **Option B: Custom `_text` function** — export `_textChallengeId(ep, ln, sec)` from the challenge file and call it manually. Use this only if you need a different format than the VP output. Must include ALL narration text from the VP — every player action, every event, every score. The text backlog should be a complete retranscription of what the VP shows.

6. **`js/main.js`** — Add `import * as challengeMod from './chal/challenge-id.js';` and add `challengeMod` to the module spread array.

7. **`js/run-ui.js`** — Add episode history badge tag (colored pill in episode timeline).

### Step 3: Simulation Structure
```javascript
export function simulateChallengeId(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  const result = { /* challenge data */ };

  // ... simulation logic ...

  // Romance hooks (pass null for phases/phaseKey to avoid push errors)
  const _romActive = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'challenge context');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'challenge', _romActive);

  // Finalize
  ep.challengeData = result;
  ep.isChallengeId = true;
  ep.challengeType = 'challenge-id';
  ep.challengeLabel = 'Challenge Name';
  ep.challengeCategory = 'mixed';
  ep.immunityWinner = result.immunityWinner;
  ep.chalPlacements = [...];
  // Immunity winner MUST be #1 in chalMemberScores
  const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores).filter(([n]) => n !== result.immunityWinner).map(([,s]) => s));
  ep.chalMemberScores[result.immunityWinner] = Math.max(ep.chalMemberScores[result.immunityWinner] || 0, maxOther) + active.length + 5;
  ep.tribalPlayers = active;
  updateChalRecord(ep);
  return ep;
}
```

### Step 4: VP Pattern
- Each screen is an exported function: `rpBuildChallengeTitleCard(ep)`, `rpBuildChallengePhase1(ep)`, etc.
- Use `_tvState[stateKey]` with `idx: -1` for click-to-reveal
- Export `challengeRevealNext(screenKey, totalSteps)` and `challengeRevealAll(screenKey, totalSteps)`
- Shell wrapper function with CSS + theme: `_shellWrapper(content, ep, theme)`
- Sidebar should NOT spoil future results — show state from BEFORE current phase, update progressively
- Each screen needs its own `stateKey` for independent reveal state

### Step 5: Scoring Rules
- `chalMemberScores` accumulates across all phases — used for challenge tab ranking
- Immunity winner gets massive bonus to guarantee #1 position
- Survivors/top performers get intermediate bonuses
- `chalPlacements` array: best-to-worst order for podium/bomb tracking
- `updateChalRecord(ep)` reads `ep.immunityWinner` to credit the win (1W)

### Step 6: Common Bugs to Avoid
- **Episode history not saving challenge data**: MUST add `challengeData: ep.challengeData || null` to the episode history object in `episode.js` (~line 5400) or VP screens show nothing on replay
- **Romance hook crash**: pass `null` for `phases` and `phaseKey` params to `_challengeRomanceSpark` and `_checkShowmanceChalMoment` — they try to push to `phases[phaseKey]` array which doesn't exist
- **Immunity winner not #1 in scores**: add massive bonus AFTER all other scoring
- **Generic challenge overwriting results**: must add to BOTH skip conditions in episode.js (generic challenge dispatch + updateChalRecord)
- **VP sidebar spoiling results**: build sidebar from state BEFORE current phase, not after
- **Camp events spoiling VP reveals**: don't push "X was crowned/eliminated" camp events that appear in Cold Open before the challenge VP screens
- **Same text repetition**: have 4+ text options per narration category minimum
- **Class/type assignment clustering**: use priority draft + cap system to ensure diversity
- **No-tribal / sudden-death missing challenge data in history**: episode.js has MULTIPLE early-return history pushes (no-tribal ~line 2918, sudden-death ~line 1715, sudden-death+twist ~line 2417, off-the-chain+SD ~line 2140). ALL of these must include the twist challenge data fields (`isHouston`, `houston`, `isTopDog`, `topDog`, etc.) or VP screens show nothing on replay. When adding a new twist challenge, grep for ALL `gs.episodeHistory.push` calls and add the new fields to every one.

### Step 7: VP Aesthetic Identity — OVERDRIVE IS THE BASELINE
Every challenge VP must feel like a standalone immersive experience with its own **unique visual identity**. The goal is wow factor — the user should feel transported into the challenge's world. Never settle for plain cards with emoji icons on a flat background.

**EVERY CHALLENGE IS DIFFERENT.** Do NOT copy another challenge's visual language. A pyramid expedition should not look like a space station. A fairy tale quest should not look like a spy thriller. Study the challenge's theme and invent visual primitives that belong to THAT world. No two challenges should share layout patterns, ambient effects, or HUD styles.

**Required foundations (adapt the form to the theme):**
- Unique CSS class prefix per challenge (e.g., `sh-` for Super Hero-ld, `eg-` for Walk Like an Egyptian)
- Unique font family + color palette — at least 2 fonts (display + body)
- `max-width:1100px;margin:0 auto` on the shell — never full-screen
- Phase-specific background themes that shift atmosphere (color temperature, mood)
- `@media(prefers-reduced-motion:reduce)` fallback on ALL animations
- CSS-only animated icons (no emoji) via `_icon(type)` helper — each challenge invents its own icon set
- Persistent background animations fitting the theme (particles, environmental effects)
- Phase-specific card physics — cards MOVE differently per zone
- Atmospheric flavor text between cards (comm chatter, announcer, ambient narration) — 8-10 per zone
- Sticky reveal controls (`position:fixed;bottom:0`) with counter + auto-scroll
- Interactive sidebar: live-updating on every reveal, zone-specific, gated by `_tvState`
- Store phase data on `window`, read from DOM `data-phase` (not globals that get overwritten)

**Noise & Unpredictability (simulation, not VP):**
- All stat checks use `noise(2.5)` minimum — outcomes should surprise
- Never guarantee results from stats alone — upsets must happen regularly
- Elimination thresholds should let ~20-30% of players fail naturally

## Twist Challenge Design Rules (Learned from Get a Clue, Rock n' Rule, Way of the Warrior)

### Scoring Balance
- All phases should score in similar ranges (10-15 max per phase). One phase dominating = one player dominates.
- Don't use the same stat in every phase — spread stat requirements so different archetypes shine in different phases.
- No immunity score inflation (`maxOther + active.length + 5`) for challenges where the winner is already the highest scorer.
- Phase advantages (VIP, backstage pass) should give a meaningful edge but NOT guarantee the win.

### Sidebar / Honor Board
- Must live-update on every reveal click (call a rebuild function from `revealNext` AND `revealAll`).
- Store phase data on `window` via the shell wrapper, read phase from DOM `data-phase` attribute (not global variable — globals get overwritten when multiple screens pre-build).
- Show different data per phase (e.g., fight wins in fight phase, water levels in climb phase).
- Gate ALL data by reveal index — never spoil results before the corresponding card is revealed.
- The initial `_buildBoard`/`_buildMeter`/`_buildHonor` render must also read `_tvState` and gate data.

### VP Narration Quality
- Minimum 4 text variants per narration category to avoid repetition.
- Text must be archetype-driven — a villain, hero, and goat should react differently to the same event.
- Every narration should reference the SPECIFIC player, their personality, and what happened — no generic "Player did well."
- Use `pick()` with large pools, or `_pickUnique()` to prevent duplicate text in the same game.
- Player cards inside manila/parchment folders need `color:var(--coffee)` or `rgba(26,26,26,0.8)` — light text on light backgrounds is INVISIBLE.

### Social Events Between Beats
- Fire social events BETWEEN each beat/round/phase, not just at the end.
- Guarantee at least 1 social event per beat — use probability for bonus events, not for the base event.
- Social event types: showmance, rivalry, bond, respect, blame, paranoia — each with distinct visual card.
- Social cards need player portrait icons (hanko/polaroid) and visually distinct styling from regular cards (dashed border, different background).
- Social events must have gameplay consequences (`addBond`, `popDelta`, camp events).

### Phase-Specific Environments
- Each phase needs its own distinct background/atmosphere — not the same background for all phases.
- Use the `_shell` wrapper's `phaseCls` parameter to set CSS class per phase.
- Environments should shift in color temperature: warm (training) → intense (fight) → cold/outdoor (climb).

### Fight / Competition Mechanics
- Round-robin for 3 players, bracket for 4+. Never leave someone with a bye in small groups.
- Show both fighter AND trainer in VS cards and KO cards — they win as a PAIR.
- Fight exchanges need: move icon + name + damage number + narration + HP bars for BOTH fighters.
- Each fight should generate 2-4 social events (trainer pride, respect, showmance comfort, blame).

### Climb / Endurance Mechanics
- Water loss formula must be tested at scale — `* 100` is death, `* 20-25` is reasonable.
- Players eliminated mid-stage should get elimination text, not just disappear next stage.
- If a boss fight at the summit results in a prize (bonsai), only ONE player grabs it first. Others who pass the boss can chase.
- Descent/steal mechanics: only players who passed the boss can intercept. Failed boss = no chase.

### VP Reveal System
- `<script>` tags in innerHTML don't execute — set `window` data directly in the VP build function.
- Use CSS classes (`step-hidden`/`step-revealing`/`step-visible`) not just `display:none`.
- Fight exchanges should trigger impact animations (screen shake, move burst, KO slam).
- Betrayal/steal events should trigger screen shake on the entire shell.

### Integration Checklist (7 files)
Every twist challenge must update ALL of these:
1. `core.js` — TWIST_CATALOG entry with incompatible list
2. `twists.js` — `ep.isChallengeName = true` flag
3. `episode.js` — import, dispatch block, generic challenge skip, generic updateChalRecord guard (prevent double-call), `_hasTwistChallenge` list, `handleExileFormat` guard, ALL episode history pushes (4+ locations) (7+ edits)
4. `vp-screens.js` — import VP builders + screen registration
5. `text-backlog.js` — import + `_textTwistChallenge()` call with VP builders (placed BEFORE `_textCampPost`)
6. `main.js` — import module + add to spread array
7. `run-ui.js` — badge tag + add to tag display line
