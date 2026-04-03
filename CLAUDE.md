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
- `checkIdolPlays()` — idol auto-play + Legacy auto-activation + amulet-as-idol
- `checkNonIdolAdvantageUse()` — extra votes, vote steals, amulet coordinated play (post-idol)
- `generateCampEvents()` / `generateCampEventsForGroup()` — camp narrative
- `updatePlayerStates()` — emotional state machine
- `formAlliances()` — pre-tribal alliance formation (5 triggers)
- `checkAllianceRecruitment()` — post-tribal recruitment (scenarios A-G)
- `computeHeat()` — vote targeting pressure
- `resolveVotes()` — determines elimination; handles all-votes-cancelled deadlock
- `decayAllianceTrust()` — alliance bond decay + auto-dissolve
- `handleAdvantageInheritance()` — called BEFORE stripping advantages on elimination
- `buildVoteReason()` — vote reasoning text
- `checkParanoiaSpiral()` — paranoid+strategic player turns on closest ally
- `checkInformationBroker()` — double agent, escalating exposure risk
- `checkStolenCredit()` — bold player steals credit for big move (once per game)
- `updateSurvival()` — tribe food decay, provider/slacker, injury→survival drain
- `generateSurvivalEvents()` — survival camp events
- `checkShowmanceFormation/updateShowmancePhases/checkShowmanceBreakup()` — showmance lifecycle
- `getShowmance(name)` / `getShowmancePartner(name)` — showmance helpers
- `patchEpisodeHistory(ep)` — universal helper patching missing fields after every history push
- `simulateSlasherNight()` — horror survival challenge, replaces challenge + tribal
- `checkFakeIdolPlant()` — strategic player crafts fake idol (once per game)
- `checkSocialBomb(ep)` — temperament/boldness faux pas with bond+heat consequences

Finale engine:
- `simulateFinale()` — handles finaleSize 2/3/4, all finale formats
- `projectJuryVotes()` — deterministic jury vote projection
- Formats: traditional, fire-making, jury-cut, fan-vote, final-challenge, koh-lanta

VP Viewer: `rpBuild*()` functions for each screen. See code for full list.

## Core State
- `gs` — global game state (tribes, players, alliances, bonds, advantages)
- `gs.episodeHistory[]` — full episode log, used by VP viewer
- `getBond(a,b)` / `addBond(a,b,delta)` — symmetric bond system
- `gs.advantages[]` — active idols and advantages with holder/type
- `gs.namedAlliances[]` — named alliance objects with members, betrayals, formed ep, active flag
- `gs.showmances[]` — objects: `{ players:[a,b], phase, sparkEp, episodesActive, jealousPlayer, tested }`

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
- Legacy: auto-fires at configured player count. Confession/leak/Sarah Play camp events.
- Amulet: 3 holders, power scales (3=ExtraVote, 2=VoteSteal, 1=Idol). Coordinated play.
- Second Life Amulet: auto-activates on elimination → duel. Can play for ally.
- Super Idol: `superIdol` flag on idol, plays AFTER votes read (post-`resolveVotes`)
- Team Swap: swap a player to another tribe before tribal (pre-merge useful). Basic find+play implemented.
- Vote Block: silence one player's vote at tribal. Basic find+play implemented.
- **Team Swap + Vote Block need full lifecycle:** confession/leak, known holder tracking, bigMoves credit, heat, ally-play consequences, VP camp events.

## Redemption Island / Rescue Island
- Two return systems (mutually exclusive, `cfg.riFormat`): `'redemption'` (1v1 duels) or `'rescue'` (all eliminees, social game)
- `isRIStillActive()` checks if RI still accepting players
- RI re-entry fires FIRST in episode (before twists/challenge/camp)
- EVERY elimination path checks `isRIStillActive()` before sending to RI vs permanent elimination
- New alliance grace period: alliances formed this episode get +0.20 loyalty boost

## Scope Gotchas
- `ep` is NOT available in: `generateCampEventsForGroup`, `simulateIndividualChallenge`,
  `simulateTribeChallenge`, `computeHeat`. Use `(gs.episode || 0) + 1` for episode number.
- `_pick` is scoped to `applyTwist` — not available in `simulateEpisode` or event generators.
  Use `arr[Math.floor(Math.random() * arr.length)]` or hash-based selection instead.
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

### Track Record Systems:
- `gs.playerStates[name].bigMoves` — counts idol plays, KiP steals, alliance breaks, surviving as top target
- Betrayal count: total betrayals across all alliances via `gs.namedAlliances`
- Per-alliance betrayals: `alliance.betrayals.filter(b => b.player === name)`

## Bond System
- Full range: -10 to +10. 11 tiers in `REL_TYPES`.
- Use proportional formulas (`bond * 0.10`) not binary thresholds (`bond >= 3`).

## Pronouns — NEVER hardcode
- Always use `pronouns(name)` → `{sub, obj, pos, posAdj, ref, Sub, Obj, PosAdj}`
- Never write literal "he/she/him/her" in player-describing template literals

## Settings
Key config fields in `seasonConfig`:
- `finaleSize` (2/3/4), `finaleFormat` (traditional/fire-making/jury-cut/fan-vote/final-challenge/koh-lanta)
- `popularityEnabled`, `hidePopularity`, `autoRewardChallenges`
- `replacementOnMedevac`, `rewardSharing`, `blackVote` (Off/Classic/Modern)
- `ri` (boolean), `riFormat` ('redemption'|'rescue'), `riReentryAt`, `riReturnPoints` (1|2)
- `legacyActivatesAt`, `advExpire` (default: 4)

## Twist System
- `TWIST_CATALOG` entries can have `incompatible: ['twist-id']`
- `tribesAtStart` must be refreshed after team-changing twists (swap, mutiny, abduction, dissolve)
  but NOT after kidnapping (temporary)

## VP Screen Order
Normal: Cold Open → (Returns) → (Merge) → Camp (pre) → Challenge → Twists → Camp (post) → Voting Plans → Tribal → Votes → (RI screens) → Camp Overview → Aftermath
Finale: own 10-screen sequence. Fan Vote Finale: own sequence ending in Fan Campaign → Fan Vote → Winner.

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
- `docs/superpowers/specs/` — approved design specs
- `docs/superpowers/plans/` — implementation plans
