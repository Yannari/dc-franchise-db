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
- VP Viewer: `rpBuild*()` functions for each screen

## Core State
- `gs` — global game state (tribes, players, alliances, bonds, advantages)
- `gs.episodeHistory[]` — full episode log, used by VP viewer
- `getBond(a,b)` / `addBond(a,b,delta)` — symmetric bond system
- `gs.advantages[]` — active idols and advantages with holder/type
- `gs.namedAlliances[]` — named alliance objects with members, betrayals, formed ep, active flag
- `gs.showmances[]` — objects: `{ players:[a,b], phase, sparkEp, episodesActive, jealousPlayer, tested }`
- `gs.skippedEliminationEps[]` — episodes where Team Swap advantage cancelled elimination (shifts twist schedule)

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
- `ADVANTAGES` array: idol, beware, voteSteal, extraVote, kip, legacy, amulet, secondLife, teamSwap, voteBlock
- `findAdvantages()` handles camp discovery; `checkIdolPlays()` handles idol/KiP/legacy use at tribal
- `checkNonIdolAdvantageUse()` handles extra votes, vote steals, amulet coordinated play, team swap, vote block
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
