## Project
DC Franchise Simulator — a Survivor-style franchise simulator.
ES modules, no build step. Open `simulator.html` in a browser.

**Four shows run on this engine**: Total Drama (`total-drama`), Big Brother
(`big-brother`), The Traitors (`traitors`) and Drag Race (`drag-race`).
`js/shows.js` is the ONLY source of truth for slugs, prefixes, names and
per-show vocabulary — 66 non-test files import it, 100 counting tests. A bare
integer in a URL, filename or storage key is Total Drama, permanently; every
other show is prefixed (`bb-1`, `tr-1`, `dr-1`, `bb_episode_s1_e1`).

`roundShape(format)` says what a round IS — `'ballots'`, `'weeks'` or
`'placements'` — and replaces "which array is non-empty?" everywhere. A reader
built on a ballot does not fail on a show without one; it returns empty and
flattens silently.

**Before adding a show, changing a format, or writing any sentence a screen
generates about a season, read `docs/ADDING-A-SHOW.md`.** It lists every file
that branches on show, the eight that still hold their own copy of the show
list, and §13 has the commands to re-derive all of it when this drifts.

**The recurring bug class it exists for:** one show's vocabulary printed over
the other. "Reached the end without ever being nominated" over a Total Drama
season (no nominations); "was evicted" over a camp (it votes people out). Any
generated sentence must take its words from that show's registry entry.

**§11.5 of that document is worth reading before touching ANY simulation
feature, not only when adding a show.** It is the catalogue of bug classes found
by playing seasons and reading the output — a system that runs and reaches no
screen, a screen showing live state on a replayed episode, a speech that knows
what the character does not, an average that hides the one event it should
show, a constant calibrated for a different season length, and three ways a
test has passed against the bug it was written for. Each entry carries the
measurement that found it.

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

### Valid Stats
`physical`, `endurance`, `mental`, `social`, `strategic`, `loyalty`, `boldness`, `intuition`, `temperament`. These are the ONLY stats that exist. Do NOT invent stats that don't exist (no `speed`, `luck`, `agility`, `charisma`, `strength`, `intelligence`, `charm`, `dexterity`, `stamina`, `courage`, `wisdom`). Every stat reference in code MUST use one of the 9 valid keys above.

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

### SVG for Visual Elements — Never CSS Divs
When creating decorative or illustrative visuals (animals, objects, scenery, icons beyond simple geometric shapes), always use inline SVG. Never attempt to build images out of CSS div hacks — they produce unrecognizable shapes. SVG gives precise control over paths, curves, and proportions. CSS is for layout, styling, and simple geometric indicators (dots, bars, borders) only.

### Serialization
Functions don't survive `JSON.stringify`. Pre-render text as strings. Sets need `prepGsForSave()`/`repairGsSets()`.

### Popularity System
Every challenge event that's heroic, villainous, cowardly, or selfless must affect `gs.popularity[name]`. Pattern: `if (!gs.popularity) gs.popularity = {}; gs.popularity[name] = (gs.popularity[name] || 0) + delta;`

## Challenge Rules

### Every Challenge Must Explain How It Works
`desc` is not flavour text — it is drawn on the challenge/competition screen and is the ONLY place the viewer is told what the players are physically doing. The narration says what happened, not what the rules were, so a one-line desc leaves a result nobody can follow.

Every `desc` states four things, in order:
1. **The set-up** — what is in the yard, what each player has.
2. **The mechanic** — what they actually do, step by step, including anything that repeats.
3. **What goes wrong** — the failure that costs you (a restart, a penalty, a re-zip, a lost ball).
4. **The win condition** — said outright ("the highest total after five frames wins").

The worked example is Bowlerina:

> Each houseguest gets a lane with a spinning station at one end and a row of pin targets at the other. Holding an overhead metal bar, they spin in circles until the barrier blocking the lane drops — then they let go, stagger to their ball and try to roll it into a target while the room is still turning. The barrier soon rises again and sends them back to the bar before their next roll. The harder targets are worth the most and sit exactly where the room is blurriest, and the highest total after five frames wins.

Rules of thumb: two sentences minimum, ~200 characters minimum, and a comp that serves BOTH the HOH and veto slots must never name a prize (the same static text runs on both nights). `tests/bb-comp-descriptions.test.js` enforces all of this.

### Required Per Challenge
- `updateChalRecord(ep)` with `ep.chalMemberScores`
- Debug challenge tab + VP screen + text backlog + cold open + timeline tag
- Badge text/class for all event types
- `patchEpisodeHistory` + all challenge twists mutually incompatible
- Skip main `updateChalRecord` (add to skip list)
- Showmance moments if challenge has downtime/partner interaction/danger
- Popularity changes for heroic/villain/coward moments
- `chalSeries` in TWIST_CATALOG entry — every challenge from a specific show MUST have an origin series (`'island'`, `'action'`, `'world-tour'`, `'revenge'`, `'all-stars'`, `'pahkitew'`, `'ridonculous'`, `'dc1'`–`'dc5'`). If a challenge is an original mechanic with no show origin, omit `chalSeries`.
- **World Tour challenges**: NEVER mention the real-world country name in narration, VP text, or challenge descriptions. Reference the setting indirectly (e.g. "ancient pyramids" not "Egypt", "neon-lit game show studio" not "Japan"). The simulator is its own universe — no real geography.
- `chalStyle` in TWIST_CATALOG entry — every challenge MUST have a style tag for the randomizer's category-aware pacing. Valid values: `'physical'`, `'endurance'`, `'hunt'`, `'social'`, `'puzzle'`, `'adventure'`, `'chaos'`. The randomizer avoids placing two consecutive episodes with the same style.
- Live-updating sidebar — every twist challenge VP MUST have an interactive sidebar that rebuilds on every reveal click. Sidebar must be gated by `_tvState` (never spoil ahead), show phase-specific data, and store phase data on `window` (not globals that get overwritten). Call the rebuild function from both `revealNext` AND `revealAll`.

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
- Temporary heat: `gs._*Heat` keys — shape is `{ amount, expiresEp }` or `{ target, amount, expiresEp }` or `{ [playerName]: { amount, expiresEp } }`. Grep `_.*Heat` in core.js for the full list.

## Scope Gotchas
- `ep` NOT available in: `generateCampEventsForGroup` (camp-events.js), `simulateIndividualChallenge`/`simulateTribeChallenge` (challenges-core.js), `computeHeat` (alliances.js)
- `ep.extraImmune` — always MERGE, never overwrite
- `applyTwist` (twists.js) fires BEFORE challenge — set flags there, run logic after
- Merge camp key: `gs.mergeName || 'merge'`
- `romanticCompat(a, b)` (players.js) — check before any romance/kiss events (real or fake)
- Module state mutations: use setter functions (`setGs()`, `setPlayers()`) from core.js, not direct assignment on imports
- Cross-module function calls: functions on `window` work as bare calls in module code; for explicit imports use `import { fn } from './module.js'`

## Challenge Twists
IDs live in `TWIST_CATALOG` in `js/core.js`. Pre-merge: `phobia-factor`, `cliff-dive`, `awake-a-thon`, `dodgebrawl`, `talent-show`, `sucky-outdoors`, `up-the-creek`, `paintball-hunt`, `hells-kitchen`, `trust-challenge`, `basic-straining`, `x-treme-torture`. Post-merge: `say-uncle`, `brunch-of-disgustingness`, `triple-dog-dare`, `sudden-death`, `slasher-night`, `lucky-hunt`, `hide-and-be-sneaky`, `off-the-chain`, `super-hero-ld`, `princess-pride`. Both: `basic-straining`, `monster-cash`.

## Key Systems

### Romance
Toggle: `seasonConfig.romance`. Pipeline: spark → intensity → first move → showmance → love triangle → affair. Always check `romanticCompat(a, b)` before romance events — including fake/sabotage kisses. **Max 4 active showmances.** NEVER create sparks/showmances via inline `gs.romanticSparks.push()` or `gs.showmances.push()` — always use `_challengeRomanceSpark()` (enforces the cap + all guards internally).

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

## Creating a New Twist Challenge
**Read `docs/CREATING-A-CHALLENGE.md` before building any twist challenge.** It covers the 7-step integration (core.js, twists.js, episode.js x7 spots, vp-screens.js, text-backlog.js, main.js, run-ui.js), simulation structure, VP reveal pattern, scoring rules, common bugs, aesthetic identity requirements, and design rules (scoring balance, sidebar live-updating, narration quality, social events, phase environments, fight/climb/race mechanics).

## Drag Race (`drag-race`)

Fourth show. Full map: **`docs/drag-race.md`**. The rules that bite:

### THERE IS NO VOTE
No ballot, no jury, no alliance that can deliver numbers, and the queens have
no say in who leaves. The panel ranks; the host decides alone. Any sentence,
prompt or reader that implies otherwise is a bug — a model or a module carrying
the other two formats will supply a vote unasked.

### The two bottom calls are different nights
`BTM2` lip synced and survived. `BTM` was named in the bottom and saved
**before** the song. `LOW` was safe but critiqued. Collapsing BTM2 into BTM
writes a lip sync that never happened; it has shipped twice and been caught
twice.

### Valid drag craft stats
`acting`, `comedy`, `dance`, `design`, `runway`, `lipsync`, `singing` — on
`player.drag`, alongside the nine shared stats. Do NOT invent more (no `charm`,
`polish`, `stage presence`, `sewing`). A challenge asks for a *blend*;
`blendScore` answers it.

`player.drag.style` and `player.drag.voice` are AUTHORED. Used only when a
human set them, never inferred — an inferred voice is a character the rest of
the franchise has never met.

### The three-step rule
1. what she did (`perform.js`, `lipsync.js`) — reaches for no judge, no arc
2. what the panel thought (`judging.js`)
3. what the host decided (`hostBend`, max two places, bounded)

**An engine change that lets the text layer decide a result is a bug.** Prose
renders what already happened. A second opinion in the narration is how a
screen crowns somebody the chart does not.

### Scene and event shapes
- A werk room event needs `players`, `when(facts)`, `effects` and `lines`.
  `applyWerkScene` THROWS on a scene with no consequence — no cosmetic events.
- Every scene is `{ step, kind, data, text }`. `sceneSections` opens a VP
  section on a marker `kind`, so **a scene must be pushed after its own
  marker** or it lands in the previous section (this left "Elimination Day"
  empty on eight episodes of nine).
- `{a}` and `{b}` are filled at render time. Never write a name into a pool.

### Archetypes here
The franchise rules apply unchanged — nice archetypes never scheme or sabotage;
neutrals need `strategic >= 6 && loyalty <= 4`. Drag's schemes are reads,
shade and idea theft rather than votes, but the eligibility rule is the same.

### Before shipping a change
`npm run audit:dr-spec` — a hundred seasons, ten measurements, every rate
printed beside its chance line. Every real defect on this show came from that
or from printing output and reading it; not one came from a passing suite going
red. The known-hot number is domination (top queen takes ~50% of maxi wins vs
~30% on the real show) — documented, diagnosed, and a design decision.
