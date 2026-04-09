## Project
DC Franchise Simulator — a Survivor-style franchise simulator.
Everything lives in a single file: `simulator.html` (~49,000+ lines).
Do not split it into separate files. This is intentional.

## Architecture
- `simulator.html` — the entire app: CSS in <style>, engine in <script>
- `franchise_roster.json` — player database (name, stats, archetype, slug)
- `DATA_SEASON/` — ideas backlog, viewer improvement notes, season planning
- `assets/avatars/` — player portrait images (slug-named PNGs)
- `season*-data.json` — per-season statistics
- `seasons_database.json` — franchise-level metadata across all seasons

## Key Engine Functions
- `simulateVotes()` — tribal vote logic, alliance loyalty, defection
- `checkIdolPlays()` — idol auto-play + Legacy auto-activation + amulet-as-idol
- `checkNonIdolAdvantageUse()` — extra votes, vote steals, amulet coordinated play, team swap, vote block
- `generateCampEvents()` / `generateCampEventsForGroup()` — camp narrative
- `formAlliances()` — pre-tribal alliance formation (5 triggers)
- `computeHeat()` — vote targeting pressure
- `resolveVotes()` — determines elimination; handles all-votes-cancelled deadlock
- `handleAdvantageInheritance()` — called BEFORE stripping advantages on elimination
- `simulateFinale()` — handles finaleSize 2/3/4, all finale formats
- `patchEpisodeHistory(ep)` — universal helper patching missing fields after every history push
- `executeFirstImpressions()` — episode 1 mock vote → round-robin tribe swap (fires before all other twists)
- `checkPerceivedBondTriggers(ep)` — creates perception gaps after vote resolution
- `updatePerceivedBonds(ep)` — closes gaps each episode via intuition-based correction
- `checkSocialPolitics(ep)` — side deals, info trades, loyalty tests (3-5 per episode)
- `checkSideDealBreaks(ep)` — detects broken F2/F3 deals after votes
- `checkConflictingDeals(ep)` — discovers double-dealing via intuition rolls
- `checkFalseInfoBlowup(ep)` — exposes lies when false idol info is acted on
- `checkLoveTriangleFormation(ep)` — detect triangles (dual showmance or one-sided), personality fork to affairs
- `updateLoveTrianglePhases(ep)` — triangle lifecycle: tension → escalation → ultimatum
- `updateAffairExposure(ep)` — affair exposure tiers: hidden → rumors → caught → exposed
- `_resolveAffairExposure(af, ep, ...)` — confrontation + choice when affair is exposed
- `checkMoleSabotage(ep)` — Mole twist: bond sabotage, info leaks, vote disruption flags, advantage sabotage, laying low
- `_checkMoleExposure(mole, ep, tribeName)` — fires when any observer's suspicion reaches 3.0
- `rpBuildMoleExposed(ep)` — dedicated VP screen for Mole exposure moment
- `simulateMultipleEpisodes(count)` — Sim All / +5 Eps buttons, chains `simulateNext()` via setTimeout
- `simulatePhobiaFactor(ep)` — pre-merge fear challenge (tribe scoring, blame, clutch)
- `simulateSayUncle(ep)` — post-merge endurance challenge (dominator picks, backfire)
- `simulateTripleDogDare(ep)` — post-merge sudden death (spinner accept/pass, freebie economy)
- VP Viewer: `rpBuild*()` functions for each screen

## Core State
- `gs` — global game state (tribes, players, alliances, bonds, advantages)
- `gs.episodeHistory[]` — full episode log, used by VP viewer
- `getBond(a,b)` / `addBond(a,b,delta)` — symmetric bond system
- `getPerceivedBond(a,b)` — returns what player A *thinks* the bond is (overlay or real)
- `gs.perceivedBonds` — directional perception gaps (`"A→B": { perceived, reason, correctionRate }`)
- `gs.advantages[]` — active idols and advantages with holder/type
- `gs.namedAlliances[]` — named alliance objects with members, betrayals, formed ep, active flag
- `gs.showmances[]` — objects: `{ players:[a,b], phase, sparkEp, episodesActive, jealousPlayer, tested, breakupEp, breakupVoter, breakupType }`
- `gs.loveTriangles[]` — `{ center, suitors:[A,C], phase, formedEp, episodesActive, jealousyLevel, resolved, resolution }`
- `gs.affairs[]` — `{ cheater, partner, secretPartner, exposure (hidden/rumors/caught/exposed), complicit, rumorSources[], caughtBy, resolved, resolution }`
- `gs.skippedEliminationEps[]` — episodes where Team Swap advantage cancelled elimination (shifts twist schedule)
- `gs.sideDeals[]` — F2/F3 pacts: `{ players, initiator, madeEp, type, active, genuine }`
- `gs.loyaltyTests[]` — planted false info: `{ tester, target, falseInfo, plantedEp, resolved }`
- `gs._falseInfoPlanted[]` — false idol info for blowup detection
- `gs._blowupPlayers[]` — players who had fights/meltdowns/social bombs (cleared after recovery check)
- `gs.moles[]` — Mole twist state: `{ player, exposed, exposedEp, exposedBy, suspicion, sabotageCount, sabotageLog, leaks, layingLow, resistance }`

## Patterns
- New camp event types: push into `ep.campEvents[campKey].pre` directly; add badge
  handling in `rpBuildCampTribe()` `badgeText`/`badgeClass` block; events MUST have
  consequences (addBond, state changes) — text-only events are cosmetic and waste screentime
- Camp events MUST include `players: [name1, name2]` array (not `player: name`) for VP portrait rendering
- All camp event types MUST have explicit badge text + badge color entries
- Save episode-level data to history: `gs.episodeHistory[gs.episodeHistory.length-1].key = value`
  Fields on the live `ep` object are NOT auto-saved — must explicitly copy after push
- `pronouns(name)` returns `{sub, obj, pos, posAdj, ref, Sub, Obj, PosAdj}` for any player
- `pStats(name)` returns player stats object; `threatScore(name)` returns numeric threat
- Interactive reveals use `_tvState[key]` pattern: `tvRevealNext(key)` / `tvRevealAll(key)`
- Revote cards tagged with `data-revote="1"` — Live Tally ignores them
- `ep.isRockDraw` MUST be set for every rock draw path
- VP screens use `ep.gsSnapshot` (from episodeHistory) not live `gs`
- VP advantage displays use `ep.advantagesPreTribal` to prevent spoiling eliminations
- Alliance acceptance is relationship-driven (bond with recruiter + group avg bond), not stat-driven
- Advantages force-play at top 5 (`activePlayers.length <= 5`)
- `handleAdvantageInheritance(eliminatedName, ep)` must be called BEFORE stripping advantages on every elimination path

## Advantage System
- `ADVANTAGES` array: idol, beware, voteSteal, extraVote, kip, legacy, amulet, secondLife, teamSwap, voteBlock, safetyNoPower, soleVote
- `findAdvantages()` handles camp discovery; `checkIdolPlays()` handles idol/KiP/legacy use at tribal
- `checkNonIdolAdvantageUse()` handles extra votes, vote steals, amulet coordinated play, team swap, vote block, sole vote
- Sole vote suppresses redundant plays: `ep._soleVoteHolder` pre-check skips idol/extra vote/vote steal for the holder
- `handleAdvantageInheritance()` — Legacy wills to highest-bond active player; Amulet upgrades remaining holders
- Super Idol: `superIdol` flag on idol, plays AFTER votes read (post-`resolveVotes`)
- Team Swap advantage cancelling elimination → shifts twist schedule forward by 1 via `gs.skippedEliminationEps`

## Redemption Island / Rescue Island
- Two return systems (mutually exclusive, `cfg.riFormat`): `'redemption'` (1v1 duels) or `'rescue'` (all eliminees, social game)
- `isRIStillActive()` checks if RI still accepting players
- EVERY elimination path checks `isRIStillActive()` before sending to RI vs permanent elimination

## Scope Gotchas
- `ep` is NOT available in: `generateCampEventsForGroup`, `simulateIndividualChallenge`,
  `simulateTribeChallenge`, `computeHeat`. Use `(gs.episode || 0) + 1` for episode number.
- `_pick` is scoped to `applyTwist` — not available in `simulateEpisode` or event generators.
- Pre-merge (`ep.challengeType === 'tribe'`) and post-merge (`individual`) are separate branches.
  Features for BOTH must be placed AFTER the if/else block.
- `ep.extraImmune` is written by multiple systems. Always MERGE, never overwrite.

## Serialization
- Sets don't survive `JSON.stringify` — use `prepGsForSave()` before save, `repairGsSets()` on load.
  New Set fields must be added to `SET_FIELDS` array in both functions.
- JSON in `onclick` attributes breaks HTML. Use `data-*` attributes instead.
- `forEach` + `splice` skips entries — use reverse for-loop when removing during iteration.

## Stat Philosophy

### Rule 1: ALWAYS Proportional
**NEVER use `if (stat >= X)` threshold checks for gameplay effects.** Every stat effect MUST
use `stat * factor` so that every point matters. Stat 10 > stat 9 > stat 8, always.
- Threshold checks (`>= X`) are ONLY acceptable for selecting narrative TEXT variants, never for gameplay values

### Rule 2: Behavior > Stats
**Stats set tendency, actions define reputation.** A loyalty 10 player who betrayed 3 times
is NOT actually loyal. Always check behavioral track record alongside raw stats.

## Bond System
- Full range: -10 to +10. 11 tiers in `REL_TYPES`.
- Use proportional formulas (`bond * 0.10`) not binary thresholds (`bond >= 3`).
- Perceived bond overlay: `getPerceivedBond(a,b)` for decision systems (votes, alliances, heat).
  `getBond(a,b)` for everything else (decay, VP display, jury, addBond).
- 8 triggers create perception gaps: low-loyalty betrayal, villain manipulation, goat-keeping,
  alliance blindspot, post-betrayal denial, showmance blindspot, provider entitlement, swap loyalty.
- Correction: intuition+mental-based (`intuition * 0.07 + mental * 0.025`), modifiers for receiving votes (+0.3), witnessing betrayal (+0.2).
- Positive bond cooling: bonds above +4.0 drift down each episode unless reinforced by positive camp events. Floor at +3.0. Showmance pairs exempt.
- `recoverBonds`: softens bonds below -3.0 toward -2.0 floor. Rate: 0.05-0.20/ep. Social stat slows recovery.
- VP: ONE-SIDED badge when gap exists, split per-player tier display. WAKE-UP CALL badge on realization.

## Threat System
- `threatScore(name)`: `(physical*0.8 + endurance*0.3 + strategic + social + boldness*0.5 + (intuition+mental)/2 - loyalty*0.15) / 4`
- Cast builder `threat(stats)` matches the engine formula
- `computeHeat`: scramble effect (social+strategic reduce heat when >3), floater invisibility (0.85x heat)
- Shield network removed — replaced by vote pitches in social politics system
- Challenge category frequency: physical 1.4x, endurance 1.3x, puzzle 1.25x via `CATEGORY_FREQ`

## Social Politics
- `checkSocialPolitics(ep)`: 3-5 actions per episode (side deals, info trades, loyalty tests)
- Vote pitches inline in `simulateVotes`: 1-2 pitchers per tribal, can flip 0-2 voters
- `gs.sideDeals[]`: F2/F3 pacts with genuine check (loyalty + bond - existing deals). VP shows F2/F3 DEAL tags.
- Info trades: true info = knowledge shared, false info = only villains/schemers/masterminds. Lie exposed on blowup.
- Loyalty tests: 2-episode resolution. Spread = trust broken. No spread = trust earned.
- Temperament recovery: after fights/meltdowns, social players can apologize next episode (social * 0.07 chance)
- Per-pair bond dedup: max 2 bond events per pair per camp phase. Bond deltas normalized to +0.5.
- Camp event weight ratio: ~60/40 positive/negative. WAKE-UP CALL capped at 3 per episode per tribe.

## Archetype Mechanics
- Villain: bond formation 0.7x, loss 0.8x. +1.5 heat. False info trades. Camp events.
- Hero: bond formation 1.15x. -1.0 heat. Camp events.
- Floater: 0.85x heat (invisibility). 0.9x vote gravity (follows majority). FTC: penalized if 0 big moves (behavior-based, not archetype-specific).
- FTC passenger penalty: 0 big moves = -0.6 jury score. 1 move = 0. 2+ = bonus up to +0.8.

## Romance System (Showmances, Love Triangles, Secret Affairs)
- `checkShowmanceFormation(ep)` — pair formation: bond >= 5-6 + `romanticCompat` + archetype multiplier
- `updateShowmancePhases(ep)` — lifecycle: spark → honeymoon → target → ride-or-die (or broken-up/faded)
- **Natural breakup**: bond drops below -1.0 → phase `broken-up`, breakupType `faded`. Shows `💔 It's Over` badge.
- **Rekindle**: broken-up partner returns to game → chance to restart (separated: 70%/40%/15%, betrayal: 25%/8%)
- Showmance cap: 2 active at a time. Triangles and affairs don't count toward cap.
- **Love Triangles** (`gs.loveTriangles[]`): one-sided crush or dual showmance → public drama
  - Formation: bond >= 4 + romanticCompat + partner bond >= 1.0 (prevents instant resolution)
  - Same trio can't reform. Personality fork: low-loyalty/villain types → affair instead of triangle.
  - Phases: tension (2 eps) → escalation (2 eps) → ultimatum (forced choice)
  - Resolution: chose (center picks), organic (bond decay), eliminated
  - Winner becomes showmance with center if compatible + bond high enough
- **Secret Affairs** (`gs.affairs[]`): hidden romance for low-loyalty/villain/schemer/chaos-agent/showmancer types
  - 4 exposure tiers: hidden → rumors → caught → exposed. Pressure cooker: +6% detection/episode.
  - Complicit check: does secret partner know about the showmance?
  - Caught tier: catcher decides to tell or stay silent (leverage mechanic)
  - Exposure: cheater chooses partner or secret partner (same formula as triangle ultimatum)
  - If cheater leaves → old showmance breaks up, new one forms with secret partner
- **Popularity**: showmance betrayal -3 like/+3 drama. Triangle center -2 like. Affair cheater -4 like.
  Rejected/betrayed players get sympathy (+2-3 like, +3-4 underdog).
- **Aftermath**: all romance events feed into Truth or Anvil (drama 7-9), interviews (role-specific),
  Fan Call, Unseen Footage, Host Roast. Affair is drama 9 (highest romance event).
- **VP**: Romance debug tab shows showmances (with breakup type), triangles, affairs + event log.
  All camp events have explicit badges.
- **Merge tribe key**: always use `gs.mergeName || 'merge'` for post-merge camp event pushes, never just `'merge'`

## The Mole
- Season-level twist (not archetype): 1-2 secret saboteurs assigned via config (`cfg-mole`)
- Config: `disabled` / `1-random` / `2-random` / `choose` + coordination mode (`independent` / `coordinated`)
- 5 sabotage types: bond sabotage (30%), challenge throw/sabotage (30% immunity, 25% reward), info leak (30%), vote disruption (30%), advantage sabotage (35%)
- Guaranteed 1-2 sabotage acts per episode (random type selection + independent rolls for remaining)
- Pre-merge = Owen mode (random chaos), post-merge = Scott mode (strategic targeting)
- Challenge sabotage: pre-merge targets easy-blame players, post-merge targets threats/suspicious players
- Laying low: triggers at heat >= 4 OR suspicion >= 2.0 OR 4+ acts in last 2 episodes. Max 1 consecutive episode.
- Suspicion: per-observer tracking, `(intuition * 0.04 + mental * 0.015) * (1.1 - resistance)`. Threshold 3.0 = exposure.
- Resistance erodes: `Math.max(0.15, 0.5 - sabotageCount * 0.03)`. Formula flipped: low resistance = easier to detect.
- Suspicion events: >= 2.0 GROWING SUSPICION (talks to others), >= 2.5 CONFRONTATION (direct challenge)
- Exposure: -1.5 bond with all, +3.0 heat for 2 eps, advantages revealed, no more sabotage. Detective gets +0.5 bonds, -1.5 heat, +6 popularity.
- Mole targets suspicious players: bond sabotage prefers their pairs, vote disruption targets them, info leak fabricates rumors about them
- VP: dedicated "The Mole Exposed" screen, MOLE badges on sabotage events, undiscovered reveal on votes screen after torch snuff, debug tab with full sabotage log + suspicion levels

## Mental Stat — Social Role
- Mental is primarily a challenge stat but has a secondary social role: **information processing**
- Boosts all intuition-based detection checks at ~35% of intuition's weight
- `intuition * X + mental * X * 0.35` pattern across: Mole suspicion, perceived bond correction, info broker exposure, fake idol detection, advantage snooping, false info early detection

## Schoolyard Pick
- Schedulable pre-merge twist: `schoolyard-pick` in TWIST_CATALOG, category `team`
- Captain selection: top 2 individual challenge performers (fallback random)
- Alternating draft with mix-based pick logic (strategic/social/bold captain personalities)
- Bond consequences: +0.4 first picks → -0.5 last pick; pick position proportional
- Odd count: unpicked player sent to Exile Island (wires into exile island system for advantage search)
- Exile return: next episode, joins smallest tribe; `ep.tribesAtStart` refreshed after return
- Camp events: LAST PICKED badge (shame/anger/fire), EXILE RETURN + PROVING GROUND badges
- `gs._schoolyardExiled` persists across episodes for return; suppresses `handleExileFormat` + `exile-island` twist
- VP: `rpBuildSchoolyardPick(ep)` — click-to-reveal draft with per-pick reactions (archetype + stat + position)
- Text backlog: `_textSchoolyardPick(ep, ln, sec)`

## Aftermath Show
- `generateAftermathShow(ep)` — full aftermath data generation
- **Truth or Anvil**: confrontation scene per interviewee. 12 contradiction types (vote-lie, fake-deal, bond-gap, double-agent, hidden-advantage, mole, betrayal, hidden-hatred, showmance, showmance-betrayal, love-triangle, affair). Full dialogue with archetype-flavored responses. Clean game = quick acknowledgment, no forced confrontation. Real bond consequences (-0.3 truth, -1.0 anvil).
- **Unseen Footage**: 10+ sources (mole sabotage, fake deals, showmance spark/jealousy/breakup, perception gaps, undetected betrayals, challenge throws, secret idol finds, alliance collapse, loyalty tests). Scored by drama, top 3 shown.
- **Fan Call**: 20+ game-data-driven question templates. Fan types (superfan/drama/hater/supporter) filter from shared pool. Category dedup prevents repeat topics.
- **Host Roast**: 60+ unique templates from game data (betrayals, challenge wins/bombs, alliance count, votes received, side deals, showmances, big moves, popularity, archetype, stats). Dedup via Set.
- **Reunion**: finale-format-aware (jury/challenge/fan-vote). Winner + runner-up interviews adapt language to match how the season was decided.
- Active players do NOT watch the Aftermath — consequence text says "word gets back" or "when this airs", not "watching from camp"

## First Impressions
- `executeFirstImpressions()` — Episode 1 gut-feeling vote (NOT full `simulateVotes`)
- No alliances, no split votes, no idol coverage, no jury references
- Scoring: threat level, social warmth, archetype snap-judgments, bond factor, random variance
- Vote reasons: "bad energy", "something feels calculated", "biggest physical threat", "hasn't connected", gut reads
- Round-robin swap: voted-out players switch tribes

## Final Challenge (finale format)
- `simulateFinaleChallenge(finalists, assistants)` — 3-stage challenge
- Stages: The Perch (endurance), The Gauntlet (physical), The Cipher (puzzle)
- **All 3 stages fully randomized** — puzzle can come first, making mental assistants valuable
- Last stage always solo (no assistant boost); assistants help first 2 stages only
- Each stage has a dramatic finale name when it's the closer (Last One Standing / The Final Sprint / The Final Code)
- `assistantDropoff` fires after second-to-last stage: "ASSISTANTS STEP BACK"

## Pronouns — NEVER hardcode
- Always use `pronouns(name)` → `{sub, obj, pos, posAdj, ref, Sub, Obj, PosAdj}`
- Never write literal "he/she/him/her" in player-describing template literals

## Collaboration Style
- Think independently — brainstorm improvements and propose them, don't just copy exact words.
- Always propose ideas before implementing — never silently add features.
- **Stats are ALWAYS proportional.** Non-negotiable.
- **Behavior > stats.** Check actions alongside raw stat numbers.
- Camp events MUST have gameplay consequences (bond changes, state changes, knowledge tracking).
- When a mechanic creates information (leak, snoop, confession), it must flow into targeting (computeHeat, simulateVotes) or it's cosmetic.

## Challenge System (Total Drama-Inspired)
Three schedulable challenge twists replace the normal immunity challenge. Each has its own
dare/fear pool, VP screens (sequential click-to-reveal), camp events, and episode history.
Twist category: `challenge` in TWIST_CATALOG. Separate from immunity modifiers.

### Phobia Factor (`phobia-factor`) — Pre-merge tribe challenge
- `simulatePhobiaFactor(ep)` — assigns random fears, campfire confessions, tribe scoring
- Each player faces a randomly assigned phobia (60 fears across 4 categories: pain/fear/gross/humiliation)
- Tribe with best completion % wins immunity. Worst tribe goes to tribal.
- Campfire confessions fire after Cold Open (VP screen 1b)
- **Triple Points Clutch**: if losing tribe is 20%+ behind, one player gets a triple-points dare
- **Blame system**: `gs._phobiaBlame` adds temporary heat to players who failed on losing tribe
  - Clutch pass cancels blame (redemption). Clutch fail adds +3.0 extra heat.
  - Blame cleared after tribal via `delete gs._phobiaBlame`
- Conquered fears = no camp event (expected outcome). Only failures, blame, shared fears, clutch shown.
- `PHOBIA_POOL` / `PHOBIA_CATEGORIES` constants (separate from Say Uncle / TDD pools)

### Say Uncle (`say-uncle`) — Post-merge individual endurance
- `simulateSayUncle(ep)` — survival rolls, dominator picks, backfire rule, placements
- Players endure tortures — survive 10 seconds or you're out. Last standing wins immunity.
- **Dominator pick**: rare dominant performance → pick next victim + choose dare category
  - Only random-turn dominators can pick (picked victims cannot pick even if they dominate)
  - Backfire: if victim passes, picker is OUT
- Normal tribal follows. Sets `ep.immunityWinner`, `ep.challengeType = 'individual'`.
- Rotation-based turns (everyone gets one before repeats, picks count as turns)
- `SAY_UNCLE_POOL` / `SAY_UNCLE_CATEGORIES` constants (80 dares, 4 categories)

### Triple Dog Dare (`triple-dog-dare`) — Post-merge sudden death elimination
- `simulateTripleDogDare(ep)` — spinner accept/pass model, freebie economy, pacts
- **Replaces BOTH challenge AND tribal** — one player eliminated directly, no vote
- Flow: spinner spins → accept own dare (earn freebie) OR pass to someone
  - Passed target: use freebie to skip, push through (willingness roll), or refuse (eliminated if 0 freebies)
- Freebie sharing: bond/loyalty/strategy-driven (not alliance-locked)
- Temporary pacts: strategic players form in-challenge deals
- `DARE_POOL` / `DARE_CATEGORIES` constants (80 dares, 4 categories with titles + descriptions)
- VP: sequential click-to-reveal with live freebie counter bar

### Challenge VP Pattern
All three use the same VP approach:
- Sequential click-to-reveal (NEXT button + REVEAL ALL)
- Global reveal functions: `tddRevealNext(uid)`, `suRevealNext(uid)`, `pfRevealNext(uid)`
- Data stored in `data-*` attributes on container (innerHTML doesn't execute scripts)
- Registered in `buildVPScreens()` — replace normal challenge screen when active

### Camp Event Integration
- Challenge-system events push to `ep.campEvents[tribeName].post` BEFORE `generateCampEvents`
- `generateCampEvents(ep, 'post')` preserves existing `.post` events (appends, doesn't overwrite)
- `generateCampEvents(ep, 'pre')` preserves existing `.post` events (fixed — was resetting to [])

## Cold Open — "Previously On"
- `rpBuildColdOpen(ep)` — dynamic narrative threads from previous episode
- Shows: last tribal recap, close vote, betrayals, romance, mole, side deals, fights, challenge throws
- Triple Dog Dare / Say Uncle / Phobia Factor recap cards
- Uses `prevSnap` (previous episode snapshot) to avoid spoilers

## Backlog Files
- `DATA_SEASON/ideas_probabilistic_moments.txt` — feature ideas with priority order
- `DATA_SEASON/ideas.txt` — larger feature designs
- `DATA_SEASON/viewer_improvements.txt` — VP viewer gap list
