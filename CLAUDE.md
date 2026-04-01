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
- `checkIdolPlays()` — idol auto-play threshold + Legacy Advantage auto-activation + amulet-as-idol
- `checkNonIdolAdvantageUse()` — extra votes, vote steals, amulet coordinated play (post-idol)
- `generateCampEvents()` / `generateCampEventsForGroup()` — camp narrative
- `updatePlayerStates()` — emotional state machine (paranoid/comfortable/etc)
- `formAlliances()` — pre-tribal alliance formation (5 triggers: strategic pitch, power couple, mutual enemy, survival pact, shared struggle)
- `checkAllianceRecruitment()` — post-tribal recruitment (scenarios A-G: swap-outsider, post-quit, blindside-swing, free-agent, emergency-pair, post-betrayal)
- `computeHeat()` — vote targeting pressure on a player
- `resolveVotes()` — determines elimination from vote tallies; handles all-votes-cancelled deadlock
- `decayAllianceTrust()` — alliance bond decay + auto-dissolve (1 member left, avg bond <= -1, or 2+ betrayals with low bond)
- `handleAdvantageInheritance()` — called before stripping advantages on elimination. Handles Legacy willing + Amulet power upgrade.
- `buildVoteReason()` — generates vote reasoning text, includes amulet/legacy/KiP-specific reasons
- `checkParanoiaSpiral()` — paranoid + strategic player turns on closest ally (self-fulfilling prophecy)
- `checkInformationBroker()` — double agent in 2+ alliances, escalating exposure risk, bond collapse on blowup
- `checkStolenCredit()` — bold player steals credit for another's big move (once per game). Confrontation next episode if architect is bold/hothead enough.
- `updateSurvival()` — per-episode tribe food decay, provider/slacker calculation (willingness + ability), energy cost/savings, player survival sync
- `generateSurvivalEvents()` — survival camp events: provider fishing/foraging/praised, slacker callout/confrontation/bonding, food conflict/hoarding/rationing/crisis, collapse warning, medevac
- `checkShowmanceFormation()` — detects new showmances (bond + archetype compatibility)
- `updateShowmancePhases()` — progresses showmance lifecycle (spark → honeymoon → target → ride-or-die/broken-up)
- `checkShowmanceBreakup()` — detects partner elimination (betrayal breakup vs grief separation)
- `getShowmance(name)` / `getShowmancePartner(name)` — helper functions for showmance lookups
- `patchEpisodeHistory(ep)` — universal helper patching missing fields after every history push

Slasher Night (post-merge):
- `simulateSlasherNight()` — horror survival challenge, replaces challenge + tribal
- `SLASHER_EVENTS` — 19 positive + 20 negative event types with stat triggers and bond effects
- `SLASHER_CAUGHT_SCENES` / `SLASHER_ATMOSPHERE` / `SLASHER_FINAL_WIN` / `SLASHER_FINAL_LOSE`
- Round-by-round: events → catch targeting → score tracking → final showdown (last 2)
- Last standing = immunity, lowest score = auto-eliminated (no vote)
- VP: 6 screens (Announcement, Rounds, Showdown, Immunity, Elimination, Leaderboard)
- Particle profile: `'slasher'` (dark fog/mist)

Finale engine:
- `simulateFinale()` — finale episode (handles finaleSize 2/3/4, jury + final-challenge formats)
- `projectJuryVotes()` — deterministic jury vote projection (no random noise)
- `generateBenchAssignments()` — eliminated players pick finalist benches by bond
- `selectAssistants()` — heart-vs-brain decision model for picking challenge helpers
- `simulateFinaleChallenge()` — 3-stage challenge (endurance/physical/puzzle) with assistant boost + sabotage
- `applyFTCSwingVotes()` — hesitating jurors influenced by FTC performance + ally support
- `generateFinaleCampOverride()` — replaces generic camp events with "last day" themed events
- Koh-Lanta finale: orienteering race (F4→F3) → perch endurance (F3→immunity) → choice (winner picks F2) → FTC
- Fire-making finale: immunity → decision (save one) → fire duel (other two) → F3 FTC
- Winner's Cut format (`jury-cut`): immunity winner cuts one player at any finaleSize (F3 or F4)
- Fan Vote finale: fans crown the winner via popularity (no jury vote)
  - `generateFanCampaign()` — broadcast-style campaign data: speeches (bold/social/strategic), pulse reactions, fan reaction pills, bond-based jury commentary per finalist
  - `simulateFanVote()` — popularity * 1.0 + campaign boost (social * 0.3 + boldness * 0.2 + strategic * 0.1) + variance. F2/F3 margin thresholds.
  - F2: no immunity, straight to fan campaign. F3: immunity + cut → F2. F4: immunity + cut → F3.
  - `rpBuildFanVoteCampLife()` — lobbying scene before Decision (fan-vote-specific pitches about popularity/audience)
  - Requires `popularityEnabled`. `hidePopularity` option hides Fan Pulse during season.

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

VP Finale screens:
- `rpBuildFinaleCampLife()` — last morning reflections + confessionals (uses `ep.finaleEntrants` for full F4 cast)
- `rpBuildFinaleChallenge()` — final immunity (NOT shown for koh-lanta or fire-making)
- `rpBuildFinalCut()` — the Decision (immunity winner cuts someone, handles `brought` as string or array)
- `rpBuildBenches()` — interactive bench walk (eliminated pick sides)
- `rpBuildFTC()` — 5-phase FTC (walk-in, speeches, Q&A, fireworks, final plea)
- `rpBuildFinaleGrandChallenge()` — 3-stage challenge with stage-by-stage reveal
- `rpBuildWinnerCeremony()` — confetti, trophy, final confessional
- `rpBuildReunion()` — interactive awards reveal, season story, drama highlights
- `rpBuildSeasonStats()` — full statistics + Copy JSON button
- `rpBuildJuryVoteReveal()` — interactive jury vote card reveal
- `rpBuildKLOrienteering()` — 8-stage orienteering race (start → waiting → jungle → horns → race for last)
- `rpBuildKLPerch()` — perch endurance with interlude beats (time, pain, jury reactions)
- `rpBuildKLCampLife()` — after the perch: lobbying scene (like fire-making's After Immunity)
- `rpBuildKLChoice()` — winner picks F2 opponent, betrayal detection + context-specific exit quotes
- `rpBuildFiremakingCampLife()` — lobbying the immunity winner before fire-making
- `rpBuildFiremakingDecision()` — who gets saved, who makes fire
- `rpBuildFiremakingDuel()` — 4-beat staged fire-making duel with context-specific exit quotes
- `rpBuildFanVoteCampLife()` — lobbying before the Decision in fan-vote finale (popularity-focused pitches)
- `rpBuildFanCampaign()` — interactive phased broadcast: spotlight → speech + animated pulse bars + fan pills → jury reaction per finalist
- `rpBuildFanVoteReveal()` — interactive percentage reveal (F2 head-to-head bars, F3 vertical bars, 10-step progressive)

## State
- `gs` — global game state object (tribes, players, alliances, bonds, advantages)
- `gs.playerStates[name].emotional` — emotional state per player (paranoid/comfortable/desperate/uneasy/calculating/confident/content)
- `gs.episodeHistory[]` — full episode log, used by VP viewer
- `getBond(a,b)` / `addBond(a,b,delta)` — symmetric bond system
- `gs.advantages[]` — active idols and advantages with holder/type
- `gs.namedAlliances[]` — named alliance objects with members, betrayals, formed ep, active flag
- `gs.jury[]` — jury member names
- `gs.popularity[name]` — fan popularity score (if enabled)
- `gs.kipStealLastEp` — KiP steal data from last episode (holder, victim, success)
- `gs.spiritIntel` — jury intel from Spirit Island visitor, keyed by recipient
- `gs.legacyConfessedTo` — maps legacy holder → person they confessed to (the potential heir)
- `gs.knownLegacyHolders` (Set) — who knows about a legacy holder
- `gs.amuletHolders` — original group of amulet holders (all 3)
- `gs.amuletPlanted` — boolean, whether amulets have been distributed
- `gs.kipStealLastEp` — carries KiP steal data for next-episode camp events
- `gs.showmances[]` — showmance objects: `{ players:[a,b], phase, sparkEp, episodesActive, jealousPlayer, tested }`
  - Phases: `'spark'` → `'honeymoon'` → `'target'` → `'ride-or-die'` or `'broken-up'`
- `gs.paranoiaNudges` — `{ [target]: { accusedBy, ep } }` — paranoia spiral vote nudge (expires after 1 ep)
- `gs.broker` — `{ player, alliances:[name1,name2], startEp, episodesActive, exposed, exposedEp, exposer }` — information broker state (once per game)
- `gs.brokerExposedHeat` / `gs.brokerExposedEp` — heat spike tracking after broker exposure (2 episodes)
- `gs.stolenCredit` — `{ stealer, architect, ep, confronted }` — active stolen credit tracking (once per game)
- `gs.stolenCreditFired` — boolean, once-per-game flag
- `gs.stolenCreditHeat` — `{ player, ep }` — heat boost for stealer after losing confrontation
- `gs.bigMoveEarnersThisEp` — array of player names who earned bigMoves this episode
- `gs.survival[name]` — 0-100, per-player survival level (foodWater system)
- `gs.tribeFood[tribeName]` — 0-100, per-tribe food reserve
- `gs.currentProviders` / `gs.currentSlackers` — arrays of player names this episode
- `gs.providerHistory[name]` — count of episodes as provider (feeds jury scoring)
- `gs.collapseWarning[name]` — episode number of collapse event (medevac fires next episode)
- `gs.medevacs` — array of medevac records for season stats
- `gs.providerVotedOutLastEp` — `{ name, tribeName }` — triggers food crisis camp event next episode

Finale-specific ep fields:
- `ep.finaleEntrants` — snapshot of ALL players entering the finale (before any eliminations)
- `ep.benchAssignments` — `{ [finalist]: [supporter1, ...] }`
- `ep.benchReasons` — `{ [supporter]: { finalist, reason, bond } }`
- `ep.assistants` — `{ [finalist]: { name, stats, bond, heartPick, brainPick, decision } }`
- `ep.finaleChallengeStages/Scores/Winner` — multi-stage challenge data
- `ep.ftcSwings` — `[{ juror, originalVote, finalVote, reason }]`
- `ep.finalCut.reasoning` — jury vote projection data for the Decision
- `ep.klOrienteering` — `{ placements, eliminated, scores, stages[] }` — orienteering race data
- `ep.klPerch` — `{ phases[], dropOrder, winner, scores }` — perch endurance (phases include interludes with `isInterlude: true`)
- `ep.klChoice` — `{ winner, chosen, eliminated, reason, betrayal?, preBond? }` — the choice + betrayal tracking
- `ep.firemakingDecision` — `{ immunityWinner, saved, savedReason, competitors[] }`
- `ep.firemakingResult` — `{ winner, loser, winnerScore, loserScore }`
- `gs.playerStates[name].perchWinner` — true if won the koh-lanta perch (jury bonus in FTC scoring)
- `ep.fanCampaign` — `{ finalists, phases: [{ finalist, style, speech, pulseReaction, fanReactions, juryReactions }] }` — fan vote campaign data
- `ep.fanVoteResult` — `{ scores, percentages, rankings, winner, margin, breakdown }` — fan vote outcome

Episode-level advantage fields:
- `ep.kipSteal` — `{ holder, victim, stolenType, wasAlly, success }`
- `ep.idolShares` — `[{ from, to, bond, sharedAlliance, veryClose }]`
- `ep.spiritIslandEvents` — Spirit Island visitor events array
- `ep.amuletCoordination` — `{ holders, votes, agreed, power }` — coordinated play result
- `ep.advantagesPreTribal` — snapshot of advantages BEFORE tribal (prevents spoiling eliminations)
- `ep.riPlayersPreDuel` — snapshot of RI players before duel fires
- `ep.superIdolPlayed` — `{ holder, savedPlayer, votesNegated }` — Super Idol play data
- `ep.votesBeforeSuperIdol` — vote snapshot before Super Idol negation (for VP tally display)
- `ep.paranoiaSpirals` — `[{ paranoid, target, bondDrop, campKey }]`
- `ep.showmanceEvents` — `[{ type, players, phase }]` — showmance lifecycle events this ep
- `ep.showmanceBreakup` — `{ voter, eliminated, bond }` — partner voted them out
- `ep.showmanceSeparation` — `{ survivor, eliminated, bond }` — partner eliminated but tried to save

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
- Revote cards tagged with `data-revote="1"` — Live Tally ignores them (separate Live Tally #2 panel)
- `ep.isRockDraw` MUST be set for every rock draw path — VP rock draw card and WHY section depend on it
- Tie display: "Final Tally — Tied" header + TIE badges on tied players (no ELIMINATED badge)
- Revote tally: "FINAL TALLY #2 — [NAMES] ONLY" with portraits + vote counts + DEADLOCKED banner if still tied
- VP screens use `ep.gsSnapshot` (from episodeHistory) not live `gs` — prevents old episodes showing current-state data
- VP advantage displays use `ep.advantagesPreTribal` to prevent spoiling eliminations
- Alliance acceptance is relationship-driven (bond with recruiter + group avg bond), not stat-driven
- Advantages force-play at top 5 (`activePlayers.length <= 5`)
- `handleAdvantageInheritance(eliminatedName, ep)` must be called BEFORE stripping advantages on every elimination path

## Redemption Island / Rescue Island
Two return systems (mutually exclusive, configured via `cfg.riFormat`):
- **Redemption Island** (`'redemption'`): 1v1 duels on arrival. Loser goes home. Winner stays.
  `RI_DUEL_CHALLENGES` — 6 challenge types. `simulateRIDuel()`, `simulateRIChoice()`, `simulateRIReentry()`
  - Duel fires post-elimination in the SAME episode (not next episode)
  - 3-way duel is a rare edge case (double elimination sends 2+ to RI at once)
  - VP order: RI Life → RI Duel (after votes)
- **Rescue Island** (`'rescue'`): ALL eliminees go. Full social game. Big return challenge.
  `generateRescueIslandLife()` — processing/social/survival/quit events per episode
  - Life events generated both at start of episode AND post-elimination
- `isRIStillActive()` — checks if RI is still accepting players (returns used < return points)
- `cfg.riReturnPoints` (1 or 2), `cfg.riReentryAt` (active count to trigger return)
- RI re-entry fires FIRST in episode (before twists/challenge/camp) so returnee participates
- EVERY elimination path checks `isRIStillActive()` before sending to RI vs permanent elimination
- VP: `rpBuildRILife()`, `rpBuildRIDuel()`, `rpBuildRIReturn()`, `rpBuildRescueIslandLife()`, `rpBuildRescueReturnChallenge()`
- RI Return / Rescue Return: only ONE shows based on `seasonConfig.riFormat` (no duplicates)
- New alliance grace period: alliances formed this episode get +0.20 loyalty boost, grudge mechanic suppressed

## Open Vote System
- `ep.openVote = true` — votes cast sequentially in order chosen by immunity winner
- `ep.openVoteOrder` — voter sequence, personality-driven (enemies first, allies last, self last)
- Cascade mechanic: later voters see running tally, may switch under pressure
- Per-vote consequences: friend betrayal (-2.0 bond face-to-face), enemy solidarity (+0.3)
- First voter: intimidation flag, target emotional hit, leadership credit if target eliminated
- Last voter: cowardice tag (pile-on) or defiance respect (against majority)
- `ep.cascadeSwitches` tracks who changed vote under pressure (alliance betrayal)
- VP: "OPEN VOTE" banner, "SETS THE TONE"/"FINAL WORD" badges, micro-reactions per vote

## Cultural Reset Twist
- Exposes all alliances publicly, tests each: survive (bond >= 3) / crack / dissolve (bond < 1)
- Double-dippers exposed: conflicting (-2.5 bond) vs overlapping (-1.0 bond)
- Per-player personality reaction (ONE per player, priority order):
  explodes > owns-it > devastated > pivots > vindicated > withdrawn > composed
- Camp events with typed badges (culturalResetExposure, culturalResetSurvived, etc.)

## Spirit Island Twist
- Post-merge only. Jury member visits camp for one day. Tribal still runs normally.
- Visitor selection: weighted by story potential (strongest bonds, unfinished betrayal business, time on jury)
- Personal connection: reunion (bond ≥ 2), tension (bond ≤ -2), or neutral observation
- Confrontation: personality-driven (bold → explosive, strategic → quiet warning, else → avoidance)
- Intel drop: visitor shares one piece of jury sentiment to closest player ("jury respects X" / "jury resents X" / "jury is split")
- `gs.spiritIntel` feeds into `computeHeat`: jury-respects = +heat (FTC threat), jury-resents = -heat (goat), expires after 3 episodes
- VP: dedicated `rpBuildSpiritIsland()` screen (purple/indigo theme), replaces generic twist scene
- Camp events: arrival, reunion/tension, observation, confrontation, intel, departure

## Second Chance Vote
- Fan vote to return an eliminated player. Popularity-driven (requires `popularityEnabled`).
- Incompatible with RI/Rescue Island (greyed out in UI)
- `gs.popularity[name]` IS the fan vote — most popular eliminated player returns
- VP: dedicated `rpBuildSecondChanceVote()` with interactive last-to-first reveal + percentages
- Shows right after Cold Open in VP flow
- `buildEpisodeMap` counts second-chance as +1 return (net zero with elimination)
- Merge check subtracts twist returns so second-chance at merge episode doesn't delay merge

## Knowledge is Power (KiP)
- Found at camp post-merge. One-shot advantage.
- Holder picks a target and asks "Do you have an idol?" — can FAIL if target has nothing
- Target selection: known holders (+10 score), intuition senses real holders, rivals preferred
- Bold/paranoid players in danger may guess even with no confirmed targets (25% chance)
- KiP skips entirely if holder just received an idol via sharing (no point stealing what you already have)
- KiP targeting excludes players who just shared their idol to the holder (you know they don't have it)
- Success: steal the advantage. Fail: KiP consumed, wasted, embarrassment.
- Bond consequences: ally steal -4.0, enemy steal -2.5, fail -1.0
- `gs.kipStealLastEp` carries data for next-episode camp events (aftermath, power shift)
- VP: purple "KNOWLEDGE IS POWER" banner (success) or red "FAILED" banner on votes screen
- Camp events: kipAftermath (success: victim reaction + tribe awareness), kipFailed (embarrassment)
- Heat: +0.3 for KiP holder in `computeHeat`

## Advantage System
- `ADVANTAGES` array: idol, beware, voteSteal, extraVote, kip, legacy, amulet, secondLife
- `findAdvantages()` handles camp discovery; `checkIdolPlays()` handles idol/KiP/legacy use at tribal
- `checkNonIdolAdvantageUse()` handles extra votes, vote steals, amulet coordinated play (post-idol)
- `handleAdvantageInheritance()` — MUST be called before stripping advantages on elimination:
  - Legacy: willed to highest-bonded active player. Camp event next episode.
  - Amulet: holder's amulet removed, remaining holders' power upgrades. Camp event next episode.

### Legacy Advantage
- Found at camp. Stores `activatesAt` (configurable: F5, F6, F7, or F13+F6).
- Auto-fires as idol in `checkIdolPlays()` when `gs.activePlayers.length` matches `activatesAt`
- On elimination: willed to highest-bonded active player via `handleAdvantageInheritance()`
- Camp events (25% per episode): confession (→ ally knows → potential leak), the Sarah Play
  (heir schemes to vote out holder to inherit), weight (counting tribals to activation),
  heir watching (strategic players observe the heir dynamic)
- `gs.legacyConfessedTo[holder]` — the person told about the legacy (potential schemer)
- `gs.knownLegacyHolders` (Set) — who knows about legacy holders
- Heat: +0.8 if known, +1.2 from the heir (Sarah Play targeting)
- VP: gold "LEGACY ADVANTAGE" banner on votes screen. Display shows activation point (F5/F6).

### Amulet Advantage
- 3 amulets planted simultaneously in episode 1 (one per tribe). Works with 2+ tribes.
- All holders know each other from day 1 (mutual +0.5 bond from shared secret)
- Power scales by remaining holders: 3 = Extra Vote, 2 = Vote Steal, 1 = Hidden Immunity Idol
- Coordinated play (2-3 holders): ALL holders must be at same tribal AND agree to play.
  Agreement based on danger, bonds, strategic position. Disagreement = amulet stays.
- 1 holder: plays as regular idol in `checkIdolPlays()` (no coordination needed)
- Camp events: alliance-vs-betrayal tension (temptation to eliminate other holders for upgrade),
  rivalry (hostile holders targeting each other), reunion at merge/same tribe,
  upgrade events when a holder is eliminated
- Heat: +1.0-1.6 from other holders, +0.5 from players who know.
  Bounty awareness: with 2 holders left, strategic non-holders AVOID targeting (-0.5 heat)
  to prevent creating an idol for the other holder.
- Display shows current power level: "Amulet — Vote Steal"
- Vote reasons: "amulet holder targeting amulet holder — upgrade too tempting"
- WHY bullets: "Emmah was an amulet holder (Extra Vote). With her gone, holders now hold Vote Steal"

### Second Life Amulet
- Auto-activates on elimination → holder picks opponent → random duel type
- Can be played for an ally (bond >= 3, loyalty-scaled chance)
- `gs.knownAmuletHoldersThisEp` / `gs.knownAmuletHoldersPersistent` tracks who knows
- Known holders get personality-driven targeting: challenge beasts want to flush (+1.5),
  strategic players avoid (-2.0), weak players terrified of being picked for the duel (-3.0)
- Camp events: confession, leak, false security, dilemma, weight, snooping — all with consequences

### Beware Advantage
- Pre-merge only. Finder loses vote until all tribes find theirs.
- At merge: all found bewares auto-activate into idols, votes restored.
- `_willMerge` check prevents vote-loss on the merge episode.

### Super Idol
- Created via Idol Wager twist: holder risks idol in a challenge, wins → `adv.superIdol = true`
- Type remains `'idol'` with `superIdol` flag — NOT a separate advantage type
- Plays AFTER votes are read (post-`resolveVotes`), not before like regular idols
- Excluded from regular idol play logic (`checkIdolPlays` skips `superIdol` advs)
- Self-play: always fires when holder is the elimination target (perfect info, can't misplay)
- Ally-play: checks if saving the ally would make the holder the new target (won't suicide)
- `ep.votesBeforeSuperIdol` snapshot saved for VP tally display
- VP: golden "Final Tally — Before Super Idol" with target badge, then dramatic reveal banner
- Camp events: unique super-idol-specific morning-after reactions

### Idol Sharing
- `checkIdolPreTribal()`: holders may share idol with closest ally before tribal
- Saved in `ep.idolShares`, displayed as "IDOL SHARED" banner on votes screen
- Betrayal path: schemer tricks holder into surrendering idol
- Flush plant: schemer convinces paranoid holder to waste idol

### Idol Misplays
- 5 triggers (flush plant, bottom dweller, paranoid spiral, overconfident read,
  last-second vote shift) — capped at 30%, each produces a unique VP reason
- `ep.fireMaking` object: `{ player, opponent, winner, loser, reason, duelType, duelName,
  duelDesc, fromAmulet, allyPlayer }` — used by both twist and amulet paths

## Showmance Lifecycle
- `gs.showmances[]` are objects (NOT simple arrays): `{ players:[a,b], phase, sparkEp, episodesActive, jealousPlayer, tested }`
- 6 phases: `spark` → `honeymoon` (ep 2+) → `target` (ep 4+) → `ride-or-die` (ep 7+, bond ≥ 6) or `broken-up`
- `getShowmance(name)` / `getShowmancePartner(name)` — use these helpers, never search the array directly
- Honeymoon: +0.3 bond/ep, couple camp events, tribe starts noticing
- Target: strategists plot to split them, `computeHeat` scales by phase (spark +0.2, target +1.2, ride-or-die +1.5)
- Jealousy/Third Wheel: ~20%/ep, 3rd player close to one partner feels excluded (-0.5 bond each)
- The Test: `checkShowmanceTest()` fires when alliance targets showmance partner (loyalty check)
- Breakup: partner votes to eliminate → bond collapses -5.0. Separation: partner eliminated but didn't vote → grief
- Camp events: showmanceSpark, showmanceHoneymoon, showmanceNoticed, showmanceTarget, showmanceJealousy, showmanceRideOrDie

## Paranoia Spiral
- `checkParanoiaSpiral(ep)` — fires in 'post' and 'both' camp event phases
- Trigger: emotional='paranoid', roll `strategic * 0.03` (stat 5=15%, stat 10=30%)
- Picks closest ally (bond ≥ 2), bond drop -(0.8 + strategic×0.1)
- Self-fulfilling prophecy: `gs.paranoiaNudges[target]` → -0.15 loyalty in `simulateVotes` that episode
- Two tonal variants: bold (public confrontation) vs strategic (quiet campaign)
- VP badge: red "⚠ Paranoia Spiral", +3 drama, -1 likability

## Information Broker
- `checkInformationBroker(ep)` — called in `generateCampEvents` post-phase after paranoia spiral
- **Trigger:** Player in 2+ active alliances, `social >= 5`, `loyalty <= 5`. Once per game.
- **State:** `gs.broker = { player, alliances:[name1,name2], startEp, episodesActive, exposed, exposedEp, exposer }`
- **Active phase:** +0.15 bond/ep with both alliances, eavesdrop intel, -0.5 heat in `computeHeat`
- **Exposure risk:** `episodesActive * 0.08` + merge/swap spike (+0.30), cap 85%
- **Detector:** Highest `intuition * 0.04` among alliance members — named exposer in narrative
- **Bond collapse:** `-(1.0 + episodesActive * 0.4)` with all alliance members. Light -0.3 between members.
- **Heat spike:** `gs.brokerExposedHeat` → +2.0 heat for 2 episodes post-exposure
- **Camp events:** brokerWhisper, brokerManipulate, brokerConfidence, brokerClose (active); brokerExposed, brokerFallout, brokerDefense (exposure)
- **VP:** gold "Double Agent" badges while active, red "EXPOSED"/"Trust Shattered" on blowup

## Split Vote System
- Alliances with 4+ members at tribal can split votes to flush idols
- **Confirmed idol** (target in `knownIdolHolders`): auto-split, no roll
- **Suspected idol** (high threat, no confirmation): `max(strategic) * 0.06` roll
- Secondary target: primary's closest ally (bond ≥ 2), fallback = lowest-threat outsider
- Assignment: majority on primary, minority on secondary. Bond protection: bond ≥ 3 with secondary → primary group
- `alliance.splitTarget` / `alliance.splitPrimary` / `alliance.splitSecondary` on the alliance object
- `ep.splitVotePlans` saved for betrayal exemption + VP WHY section
- Voting the split secondary is NOT a betrayal in `detectBetrayals` — the plan was agreed on
- Vote reason: "split vote — covering the idol" / "split vote — assigned to the backup target"

## Vote Miscommunication
- Inline in `simulateVotes` — fires AFTER the loyal vote is determined
- Trigger: alliance 3+ members, voter has mental ≤ 4 OR social ≤ 3
- Roll: `(5 - mental) * 0.025 + (4 - social) * 0.03` (~5-15%)
- Wrong target: if split active → votes wrong half. Else: personal grudge (bond ≤ -2), or 2nd-highest-heat player
- Tagged `[MISCOMMUNICATION]` in vote log. `ep.voteMiscommunications` saved to history
- WHY section explains if the misfire changed the outcome

## Alliance Betrayal Costs
Bond damage scales by severity:
- Voted for alliance MEMBER (personal betrayal): -3.0 (plan survived) / -4.0 (plan failed)
- Rogue outsider vote, their target went home: -0.75
- Rogue outsider vote, plan survived anyway: -1.0
- Rogue outsider vote, plan failed: -2.0

## VP Screen Order
Normal episode: Cold Open → (Second Chance Vote) → (RI/Rescue Return) → (Merge) → Camp (pre) →
  Challenge → Twists → (Spirit Island) → Camp (post) → Voting Plans → Tribal → Votes →
  (Surprise Double Boot) → (RI Life) → (RI Duel) → (Rescue Island Life) → Camp Overview → Aftermath
No-tribal episode: same up to Camp (post) → No Tribal Council → (RI screens) → Camp Overview → Aftermath
Slasher Night: Cold Open → Camp (pre) → Announcement → Rounds → Showdown →
  Immunity → Elimination → Leaderboard → (RI screens) → Camp Overview → Aftermath
Open Vote: same as normal but Votes screen has sequential reveal with cascade badges
Spirit Island: Cold Open → Camp → Challenge → Twists (teaser) → Spirit Island (reveal) →
  Camp (post) → Voting Plans → Tribal → Votes → Camp Overview → Aftermath
Finale: has its own 10-screen sequence (see VP Finale screens above)
Fan Vote Finale: Last Morning → (Final Immunity, if F3+) → (After Immunity lobbying) →
  (The Decision) → Fan Campaign → The Fan Vote → Winner → Reunion → Statistics

## Settings
Key config fields in `seasonConfig`:
- `finaleSize` (2/3/4) — how many enter finale
- `finaleFormat` (traditional/fire-making/jury-cut/fan-vote/final-challenge/koh-lanta)
  - `jury-cut` = "Winner's Cut" in UI — immunity winner picks who goes to FTC (works with F3 and F4)
  - `koh-lanta` and `fire-making` lock finaleSize to 4
  - `fan-vote` — fans crown winner via popularity. Requires `popularityEnabled`. F2: no immunity. F3: cut to F2. F4: cut to F3.
- `finaleAssistants` (boolean) — enable assistant selection for final challenge
- `popularityEnabled` — fan popularity system
- `hidePopularity` — hides Fan Pulse rankings during season (no spoilers for fan-vote finale)
- `ri` (boolean) — enable 2nd Chance Isle
- `riFormat` ('redemption'|'rescue') — duel format vs edge of extinction
- `riReentryAt` — active player count that triggers return
- `riReturnPoints` (1|2) — how many returns per season
- `legacyActivatesAt` — array of player counts where Legacy fires (default: [5])
- `advExpire` — player count where all advantages are removed (default: 4)

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
- New Set fields: `knownLegacyHolders`, `knownAmuletHoldersThisEp`, `knownAmuletHoldersPersistent`

## Stat Philosophy

### Rule 1: ALWAYS Proportional
**NEVER use `if (stat >= X)` threshold checks for gameplay effects.** Every stat effect MUST
use `stat * factor` so that every point matters. Stat 10 > stat 9 > stat 8, always.
- Pattern: `stat * 0.03` not `stat >= 7 ? 0.15 : 0`
- No floors needed — `stat * factor` at stat 1 produces a near-zero effect naturally
- Threshold checks (`>= X`) are ONLY acceptable for selecting narrative TEXT variants
  (confessional lines, vote reason flavor), never for gameplay values
- When adding new stat-driven mechanics, always ask: "does stat 6 behave differently from stat 7?"

### Rule 2: Behavior > Stats
**Stats set tendency, actions define reputation.** A loyalty 10 player who betrayed 3 times
is NOT actually loyal. Always check behavioral track record alongside raw stats:
- `loyalty` stat influences defection CHANCE, but betrayal history modifies the threshold
- FTC jury honor bonus is based on ACTUAL betrayal count (0 betrayals = +0.6), not loyalty stat
- Alliance bond glue is based on clean record (0 betrayals of THIS alliance), not loyalty stat
- Betrayal cost multiplier scales with victim's actual loyalty record, not their stat

### Stat Roles (all proportional):
- **Strategic** — alliance initiation (`strategic * 0.08`), coalition cap (`2 + floor(strategic * 0.3)`),
  cascade flip resistance (`-(strategic * 0.03)`), information control (`-(strategic * 0.007)`),
  alliance bond floor override (`0.5 - strategic * 0.15`), confidant scoring (`strategic * 0.04 * loyalty`),
  self-preservation (`strategic * 0.05`)
- **Social** — tribe cohesion (`social * 0.02 + social * 0.01`), bond event boost (`social * 0.01` per player),
  alliance recruitment charm (`social * 0.05`), social intel gathering (`social * 0.03`),
  idol discovery through conversation (`social * 0.05`), comfort event weighting (`social * 0.4`)
- **Intuition** — idol finding (`intuition * 0.001`), preemptive strikes (`intuition * 0.03`),
  tip-off ally (`intuition * 0.08`), KiP targeting (`intuition * 0.4`), snooping (`intuition * 0.04`),
  eavesdrop events (`intuition * 0.015`)
- **Loyalty** — defection threshold base (`loyalty / 11`), grudge modifier (`(10 - loyalty) * 0.006`),
  ally-save bias (`(loyalty - 5) * 0.06`), track record penalty (`-0.03 to -0.15` per betrayal count),
  FTC honor (behavioral, not stat), alliance bond glue (behavioral)
- **Boldness** — counteracts loyalty (`-(boldness - 5) * 0.3 / 11`), heat reduction (`-(boldness * 0.04)`),
  chaos dividend (`boldness * 0.03`), advantage play (`boldness * 0.015`),
  KiP guess (`max(boldness, intuition) * 0.03`), grudge vote (`boldness * 0.008`),
  big moves FTC resume (`bigMoves * 0.15`, capped at 0.8)
- **Temperament** — bond swing scaling (`1.0 + (5 - temperament) * 0.04`),
  emotional resistance (`temperament * 0.08` resist, `(10 - temperament) * 0.05` escalate),
  tribal disruption (`(10 - temperament) * 0.04 + boldness * 0.03`),
  social bomb (`(10 - temperament) * 1.5 + boldness * 0.8`)
- **Physical/Endurance/Mental** — challenge performance (already proportional in formulas),
  threat score, Rescue Island survival events (`stat * factor`), Slasher Night mechanics

### Track Record Systems:
- `gs.playerStates[name].bigMoves` — counts idol plays, KiP steals, alliance breaks, surviving as top target
- Betrayal count: `(gs.namedAlliances || []).reduce(...)` — total betrayals across all alliances
- Per-alliance betrayals: `alliance.betrayals.filter(b => b.player === name)` — clean record in THIS alliance

## Bond System
- Full range: -10 (Pure Hatred) to +10 (Unbreakable). 11 tiers in `REL_TYPES`.
- Use proportional formulas (`bond * 0.10`) not binary thresholds (`bond >= 3`).
- `gs.knownIdolHoldersPersistent` survives across episodes; `gs.knownIdolHoldersThisEp` resets.
- `gs.lingeringInjuries[name]` — challenge penalty that decays over 2-3 episodes.
- `recoverBonds(ep)` — extreme negative bonds (< -1.5) soften toward -1.0 over time if not actively fighting
- Tribe cohesion: +0.10 to +0.30 per episode for tribemates who don't fight (social-scaled)
- Alliance loyalty glue: +0.05 to +0.12 per episode for members with clean betrayal records
  - Only fires when the alliance DID something together: coordinated vote (2+ voted same target) OR survived tribal together
  - Alliances that coast through no-tribal episodes get nothing

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
- Removed twists: `legacy-awakens` (now auto-activates), `amulet-activate` (now auto-scales)
- Second Chance Vote: incompatible with RI AND requires `popularityEnabled`

## Collaboration Style
- Think independently when implementing — brainstorm improvements and propose them, don't just
  copy the user's exact words. Add nuance, better reasons, edge cases they didn't think of.
- Always propose ideas before implementing — never silently add features.
- **Stats are ALWAYS proportional.** Never write `if (stat >= 7)` for gameplay effects.
  Use `stat * factor` so every point matters. This is non-negotiable.
- **Behavior is as important as stats.** When checking if a player is "loyal" or "strategic,"
  always consider their ACTIONS (betrayal count, big moves, actual alliances) alongside the raw
  stat number. A stat is a tendency; actions are proof.
- Camp events MUST have gameplay consequences (bond changes, state changes, knowledge tracking).
  Text-only events waste screentime and don't affect the simulation.
- When a mechanic creates information (leak, snoop, confession), that information must flow
  into the targeting system (computeHeat, pickTarget, simulateVotes) or it's cosmetic.

## Backlog Files
- `DATA_SEASON/ideas_probabilistic_moments.txt` — feature ideas with priority order
- `DATA_SEASON/ideas.txt` — larger feature designs (survival mechanics, popularity system)
- `DATA_SEASON/viewer_improvements.txt` — VP viewer gap list
- `docs/superpowers/specs/` — approved design specs (slasher night, cultural reset, open vote, RI, rescue island)
- `docs/superpowers/plans/` — implementation plans
