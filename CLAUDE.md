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
VP screens (`rpBuild*`) + text backlog (`_text*`). Neither optional.

### Camp Events Must Have Consequences
Bond/state/information changes. `players: []` array + `badgeText`/`badgeClass` required.

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
- Temporary heat: `gs._emissaryHeat`, `gs._dodgebrawlHeat`, `gs._talentShowHeat`, `gs._suckyOutdoorsHeat`, `gs._upTheCreekHeat`, `gs._paintballHeat`, `gs._cookingHeat`, `gs._trustHeat` (`{ amount, expiresEp }`), `gs._basicStrainingHeat` (`{ target, amount, expiresEp }`), `gs._cliffDiveBlame`, `gs._luckyHuntHeat`, `gs._schemeHeat`

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

### Both Phases
| ID | Name | Key Mechanic |
|---|---|---|
| `basic-straining` | Basic Straining | Pre: first tribe to zero loses. Post: last standing wins immunity. |

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
