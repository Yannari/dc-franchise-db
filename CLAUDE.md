## Project
DC Franchise Simulator — a Survivor-style franchise simulator.
Everything lives in a single file: `simulator.html` (~20,000+ lines).
Do not split it into separate files. This is intentional.

## Architecture
- `simulator.html` — the entire app: CSS in <style>, engine in <script>
- `franchise_roster.json` — player database (name, stats, archetype, slug)
- `DATA_SEASON/` — ideas backlog, viewer improvement notes, season planning
- `assets/avatars/` — player portrait images (slug-named PNGs)
- `season*-data.json` — per-season statistics (placements, keyMoments, strategicRank, etc.)
- `seasons_database.json` — franchise-level metadata across all seasons

## Key Engine Functions
Simulation core:
- `simulateVotes()` — tribal vote logic, alliance loyalty, defection
- `checkIdolPlays()` — idol auto-play threshold
- `generateCampEvents()` / `generateCampEventsForGroup()` — camp narrative
- `updatePlayerStates()` — emotional state machine (paranoid/comfortable/etc)
- `formAlliances()` — pre-tribal alliance formation (5 triggers: strategic pitch, power couple, mutual enemy, survival pact, shared struggle)
- `checkAllianceRecruitment()` — post-tribal recruitment (scenarios A-G: swap-outsider, post-quit, blindside-swing, free-agent, emergency-pair, post-betrayal)
- `computeHeat()` — vote targeting pressure on a player
- `resolveVotes()` — determines elimination from vote tallies
- `decayAllianceTrust()` — alliance bond decay + auto-dissolve (1 member left, avg bond <= -1, or 2+ betrayals with low bond)

Finale engine:
- `simulateFinale()` — finale episode (handles finaleSize 2/3/4, jury + final-challenge formats)
- `projectJuryVotes()` — deterministic jury vote projection (no random noise)
- `generateBenchAssignments()` — eliminated players pick finalist benches by bond
- `selectAssistants()` — heart-vs-brain decision model for picking challenge helpers
- `simulateFinaleChallenge()` — 3-stage challenge (endurance/physical/puzzle) with assistant boost + sabotage
- `applyFTCSwingVotes()` — hesitating jurors influenced by FTC performance + ally support
- `generateFinaleCampOverride()` — replaces generic camp events with "last day" themed events

Jury elimination twist:
- Twist `jury-elimination` — all eliminated players vote to boot one non-immune active player
- `rpBuildJuryLife()` — jury house dynamics (grudges, friendships, feuds, rooting, processing)
- `rpBuildJuryConvenes()` — jury power announcement
- `rpBuildJuryVotes()` — interactive card-by-card jury vote reveal

VP Viewer (Visual Player):
- `rpBuildColdOpen()` — episode opening: cast grid, alliances, fan pulse
- `rpBuildCampTribe()` — camp life screen builder
- `rpBuildChallenge()` — interactive challenge reveal with placement reasons
- `rpBuildTribal()` — tribal council screen
- `rpBuildVotes()` — interactive vote reveal screen
- `rpBuildAftermath()` — post-vote analysis with Threads to Watch
- Camp event types render with badges via `badgeText`/`badgeClass` logic in `rpBuildCampTribe()`

VP Finale screens (10 screens):
- `rpBuildFinaleCampLife()` — last morning reflections + confessionals
- `rpBuildFinaleChallenge()` — final immunity (jury format, finaleSize >= 3)
- `rpBuildFinalCut()` — the Decision (immunity winner cuts someone)
- `rpBuildBenches()` — interactive bench walk (eliminated pick sides)
- `rpBuildFTC()` — 5-phase FTC (walk-in, speeches, Q&A, fireworks, final plea)
- `rpBuildFinaleGrandChallenge()` — 3-stage challenge with stage-by-stage reveal
- `rpBuildWinnerCeremony()` — confetti, trophy, final confessional
- `rpBuildReunion()` — interactive awards reveal, season story, drama highlights
- `rpBuildSeasonStats()` — full statistics + Copy JSON button
- `rpBuildJuryVoteReveal()` — interactive jury vote card reveal

## State
- `gs` — global game state object (tribes, players, alliances, bonds, advantages)
- `gs.playerStates[name].emotional` — emotional state per player (paranoid/comfortable/desperate/uneasy/calculating/confident/content)
- `gs.episodeHistory[]` — full episode log, used by VP viewer
- `getBond(a,b)` / `addBond(a,b,delta)` — symmetric bond system
- `gs.advantages[]` — active idols and advantages with holder/type
- `gs.namedAlliances[]` — named alliance objects with members, betrayals, formed ep, active flag
- `gs.jury[]` — jury member names
- `gs.popularity[name]` — fan popularity score (if enabled)

Finale-specific ep fields:
- `ep.benchAssignments` — `{ [finalist]: [supporter1, ...] }`
- `ep.benchReasons` — `{ [supporter]: { finalist, reason, bond } }`
- `ep.assistants` — `{ [finalist]: { name, stats, bond, heartPick, brainPick, decision } }`
- `ep.finaleChallengeStages/Scores/Winner` — multi-stage challenge data
- `ep.ftcSwings` — `[{ juror, originalVote, finalVote, reason }]`
- `ep.finalCut.reasoning` — jury vote projection data for the Decision

## Patterns
- New camp event types: push into `ep.campEvents[campKey].pre` directly; add badge
  handling in `rpBuildCampTribe()` `badgeText`/`badgeClass` block; events MUST have
  consequences (addBond, state changes) — text-only events are cosmetic and waste screentime
- Save episode-level data to history: `gs.episodeHistory[gs.episodeHistory.length-1].key = value`
  Fields on the live `ep` object are NOT auto-saved — must explicitly copy after push
- Probabilistic checks follow the idol confession pattern: roll fires or it doesn't,
  consequences cascade naturally from there
- `pronouns(name)` returns `{sub, obj, pos, posAdj, ref, Sub, Obj, PosAdj}` for any player
- `pStats(name)` returns player stats object; `threatScore(name)` returns numeric threat
- Interactive reveals use `_tvState[key]` pattern: `tvRevealNext(key)` / `tvRevealAll(key)` for vote cards, `gcRevealNext` for challenge stages, `reunionRevealNext` for reunion sections
- VP screens use `ep.gsSnapshot` (from episodeHistory) not live `gs` — prevents old episodes showing current-state data
- Alliance acceptance is relationship-driven (bond with recruiter + group avg bond), not stat-driven
- Advantages force-play at top 5 (`activePlayers.length <= 5`)

## Settings
Key config fields in `seasonConfig`:
- `finaleSize` (2/3/4) — how many enter finale
- `finaleFormat` (traditional/fire-making/jury-cut/fan-vote/final-challenge)
- `finaleAssistants` (boolean) — enable assistant selection for final challenge
- `popularityEnabled` — fan popularity system

## Scope Gotchas
- `ep` is NOT available in: `generateCampEventsForGroup`, `simulateIndividualChallenge`,
  `simulateTribeChallenge`, `computeHeat`. Use `(gs.episode || 0) + 1` for episode number.
- `_pick` is scoped to `applyTwist` — not available in `simulateEpisode` or event generators.
  Use `arr[Math.floor(Math.random() * arr.length)]` or hash-based selection instead.
- Pre-merge code path (`ep.challengeType === 'tribe'`) and post-merge (`individual`) are
  separate branches. Features that should run for BOTH must be placed AFTER the if/else block.
- `ep.extraImmune` is written by multiple systems (hero duel, shared immunity, double safety).
  Always MERGE (`[...new Set([...existing, ...new])]`), never overwrite.

## Serialization
- Sets don't survive `JSON.stringify` — use `prepGsForSave()` before save, `repairGsSets()`
  on load. New Set fields must be added to `SET_FIELDS` array in both functions.
- JSON in `onclick` attributes breaks HTML (double quotes). Use `data-*` attributes instead.
- `forEach` + `splice` skips entries — use reverse for-loop when removing during iteration.

## Bond System
- Full range: -10 (Pure Hatred) to +10 (Unbreakable). 11 tiers in `REL_TYPES`.
- Use proportional formulas (`bond * 0.10`) not binary thresholds (`bond >= 3`).
- `gs.knownIdolHoldersPersistent` survives across episodes; `gs.knownIdolHoldersThisEp` resets.
- `gs.lingeringInjuries[name]` — challenge penalty that decays over 2-3 episodes.

## Pronouns — NEVER hardcode
- Always use `pronouns(name)` → `{sub, obj, pos, posAdj, ref, Sub, Obj, PosAdj}`
- Never write literal "he/she/him/her" in player-describing template literals
- Ternary branching on `.sub` is acceptable for contractions (e.g. `they're` vs `he's`)

## Twist System
- `TWIST_CATALOG` entries can have `incompatible: ['twist-id']` — enforced at both UI
  scheduling (greyed out) and engine execution (first scheduled wins)
- Pre-game alliances: `preGameAlliances` array (localStorage), injected into
  `gs.namedAlliances` at init with `preGame: true`, `permanence: 'permanent'|'normal'|'fragile'`
- `tribesAtStart` must be refreshed after team-changing twists (swap, mutiny, abduction, dissolve)
  but NOT after kidnapping (temporary, not a real tribe change)

## Backlog Files
- `DATA_SEASON/ideas_probabilistic_moments.txt` — feature ideas with priority order
- `DATA_SEASON/viewer_improvements.txt` — VP viewer gap list
- `docs/superpowers/specs/2026-03-25-finale-vp-overhaul-design.md` — finale VP overhaul spec
- `docs/superpowers/plans/2026-03-25-finale-engine-mechanics.md` — finale engine plan (sub-plan 1/6)
