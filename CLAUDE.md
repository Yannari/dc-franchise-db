## Project
DC Franchise Simulator — a Survivor-style franchise simulator.
Everything lives in a single file: `simulator.html` (~15,000+ lines).
Do not split it into separate files. This is intentional.

## Architecture
- `simulator.html` — the entire app: CSS in <style>, engine in <script>
- `franchise_roster.json` — player database (name, stats, archetype, slug)
- `DATA_SEASON/` — ideas backlog, viewer improvement notes, season planning
- `assets/avatars/` — player portrait images (slug-named PNGs)

## Key Engine Functions
Simulation core:
- `simulateVotes()` — tribal vote logic, alliance loyalty, defection
- `checkIdolPlays()` — idol auto-play threshold
- `generateCampEvents()` / `generateCampEventsForGroup()` — camp narrative
- `updatePlayerStates()` — emotional state machine (paranoid/comfortable/etc)
- `formAlliances()` — pre-tribal alliance formation
- `computeHeat()` — vote targeting pressure on a player
- `resolveVotes()` — determines elimination from vote tallies

VP Viewer (Visual Player):
- `rpBuildCampTribe()` — camp life screen builder
- `rpBuildTribal()` — tribal council screen
- `rpBuildVotes()` — interactive vote reveal screen
- Camp event types render with badges via `badgeText`/`badgeClass` logic in `rpBuildCampTribe()`

## State
- `gs` — global game state object (tribes, players, alliances, bonds, advantages)
- `gs.playerStates[name].emotional` — emotional state per player
- `gs.episodeHistory[]` — full episode log, used by VP viewer
- `getBond(a,b)` / `addBond(a,b,delta)` — symmetric bond system
- `gs.advantages[]` — active idols and advantages with holder/type

## Patterns
- New camp event types: push into `ep.campEvents[campKey].pre` directly; add badge
  handling in `rpBuildCampTribe()` `badgeText`/`badgeClass` block
- Save episode-level data to history: `gs.episodeHistory[gs.episodeHistory.length-1].key = value`
- Probabilistic checks follow the idol confession pattern: roll fires or it doesn't,
  consequences cascade naturally from there
- `pronouns(name)` returns `{sub, obj, pos, posAdj, ref, Sub, Obj, PosAdj}` for any player
- `pStats(name)` returns player stats object; `threatScore(name)` returns numeric threat

## Backlog Files
- `DATA_SEASON/ideas_probabilistic_moments.txt` — feature ideas with priority order
- `DATA_SEASON/viewer_improvements.txt` — VP viewer gap list
