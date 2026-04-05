## Project
DC Franchise Simulator — a Survivor-style franchise simulator.
Everything lives in a single file: `simulator.html` (~20,000+ lines).
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
- VP Viewer: `rpBuild*()` functions for each screen

## Core State
- `gs` — global game state (tribes, players, alliances, bonds, advantages)
- `gs.episodeHistory[]` — full episode log, used by VP viewer
- `getBond(a,b)` / `addBond(a,b,delta)` — symmetric bond system
- `getPerceivedBond(a,b)` — returns what player A *thinks* the bond is (overlay or real)
- `gs.perceivedBonds` — directional perception gaps (`"A→B": { perceived, reason, correctionRate }`)
- `gs.advantages[]` — active idols and advantages with holder/type
- `gs.namedAlliances[]` — named alliance objects with members, betrayals, formed ep, active flag
- `gs.showmances[]` — objects: `{ players:[a,b], phase, sparkEp, episodesActive, jealousPlayer, tested }`
- `gs.skippedEliminationEps[]` — episodes where Team Swap advantage cancelled elimination (shifts twist schedule)
- `gs.sideDeals[]` — F2/F3 pacts: `{ players, initiator, madeEp, type, active, genuine }`
- `gs.loyaltyTests[]` — planted false info: `{ tester, target, falseInfo, plantedEp, resolved }`
- `gs._falseInfoPlanted[]` — false idol info for blowup detection
- `gs._blowupPlayers[]` — players who had fights/meltdowns/social bombs (cleared after recovery check)

## Patterns
- New camp event types: push into `ep.campEvents[campKey].pre` directly; add badge
  handling in `rpBuildCampTribe()` `badgeText`/`badgeClass` block; events MUST have
  consequences (addBond, state changes) — text-only events are cosmetic and waste screentime
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
- Correction: intuition-based (`intuition * 0.07`), modifiers for receiving votes (+0.3), witnessing betrayal (+0.2).
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

## Archetype Mechanics
- Villain: bond formation 0.7x, loss 0.8x. +1.5 heat. False info trades. Camp events.
- Hero: bond formation 1.15x. -1.0 heat. Camp events.
- Floater: 0.85x heat (invisibility). 0.9x vote gravity (follows majority). FTC: penalized if 0 big moves (behavior-based, not archetype-specific).
- FTC passenger penalty: 0 big moves = -0.6 jury score. 1 move = 0. 2+ = bonus up to +0.8.

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

## Backlog Files
- `DATA_SEASON/ideas_probabilistic_moments.txt` — feature ideas with priority order
- `DATA_SEASON/ideas.txt` — larger feature designs
- `DATA_SEASON/viewer_improvements.txt` — VP viewer gap list
