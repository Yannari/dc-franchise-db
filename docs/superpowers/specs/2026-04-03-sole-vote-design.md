# Sole Vote Advantage — Design Spec

**Date:** 2026-04-03
**Inspiration:** Total Drama: Grand Chef Auto — Scott's Sole Vote
**Drama tier:** Medium-High (same tier as Safety Without Power)

## Overview

One-shot advantage. When played, the holder casts the ONLY valid vote at tribal — all other players' votes are cancelled. The holder's single vote determines the elimination. Idols still counter it.

## Engine Mechanics

### Advantage Type
- Key: `soleVote`
- Added to `ADVANTAGES` array
- One per season max (`oncePer: 'season'`)
- Camp discovery only — NOT in journey pool, NOT in auction pool
- Rare discovery rate: `baseChance: 0.001, epScaleCap: 0.005` (same as Safety Without Power)
- Expires via standard `advExpire` (default 4 episodes). Works pre-merge and post-merge.

### Play Trigger
- Location: `checkNonIdolAdvantageUse`, after Vote Block section
- Fires pre-vote — before `simulateVotes` runs
- Play decision: proportional formula matching Vote Block pattern
  - `effectiveHeat * (0.05 + strategic * 0.005) + boldness * 0.02`
  - Factor in actual votes: `+ actualVotes * 0.5` (from `votesObj`)
  - Force-play at top 5 (`ep._forceAdvantages`)
- Consumed on play regardless of outcome

### Mechanic
- Every other player at tribal is pushed into `gs.lostVotes`
- `simulateVotes` runs normally — holder picks target via standard `buildVoteReason` logic
- Only one vote appears in the tally
- Holder's vote is a real vote — defection tracking, alliance betrayal detection all work naturally

### Idol Interaction
- `checkIdolPlays` fires after votes, so the target can idol out
- If idol cancels the sole vote: all votes are cancelled (only the holder's existed), triggers the all-votes-cancelled deadlock path — revote where everyone votes normally
- Sole Vote is consumed either way

### SITD Interaction
- Players with `soleVote` advantage skip SITD (sole vote is strictly better protection)
- Target can't anticipate the sole vote to play SITD reactively — SITD only fires based on independent heat assessment

## Bond Consequences on Play

All proportional:
- Everyone whose vote was silenced: `-(0.5 + bond * 0.05)` with holder (allies feel more betrayed)
- Target (if they survive via idol): `-1.5` with holder
- Popularity: `-0.3` (dictatorial move)

## Heat

- Known holder: `+1.5` in `computeHeat` (everyone wants it flushed)
- Post-play heat: `+1.0` next episode via `gs.soleVoteHeat` (same pattern as SNP's `gs.safetyNoPowerHeat`)

## Camp Lifecycle

### Discovery
- `findAdvantages()` camp discovery with rare baseChance
- Discovery camp event with 3 narrative variants
- Badge: `ADVANTAGE FOUND` (gold)

### Confession
- Proportional chance: `loyalty * 0.06 + bond(holder, confidant) * 0.04`
- Confess to closest ally (highest bond active player)
- Confidant added to `gs.knownSoleVoteHolders`
- Camp event with badge: `CONFESSION` (gold)

### Leak
- Standard leak system: `(10 - strategic) * 0.02` chance
- Adds holder to `gs.knownSoleVoteHolders`
- Camp event with badge: `LEAKED` (red)

### Snoop
- Intuition-scaled detection: `0.02` base chance
- Adds holder to `gs.knownSoleVoteHolders`
- Camp event with badge: `SNOOPED` (red)

### Known Holder Tracking
- `gs.knownSoleVoteHolders` — Set
- Added to `SET_FIELDS` in both `prepGsForSave` and `repairGsSets`
- Cleaned up when advantage is consumed: `gs.knownSoleVoteHolders?.delete(holder)`

### bigMoves
- `+1` on play (massive power move regardless of outcome)

## Post-Play Camp Events (Next Episode)

Stored in `gs.soleVotePlayed = { holder, target, survived, warnedAlly }`. Fires in `generateCampEventsForGroup` next episode, then cleaned up.

### Variant A: Target Eliminated
Fallout event. Tribe processes that one person dictated the entire vote. Players with high bonds to the eliminated player react with anger/fear toward the holder.
- Bond consequence: players bonded to the eliminated (`bond >= 2`): additional `-0.5` with holder
- Badge: `DICTATOR'S FALLOUT` (red)

### Variant B: Target Idol'd Out
Humiliation event. Holder wasted the nuclear option and everyone knows it. The failed dictator becomes a bigger target.
- Bond consequence: general `-0.3` from group (wasted a scary advantage = relief + contempt)
- Badge: `WASTED POWER` (red)

### Variant C: Warned Ally Noticed
If the holder confessed to an ally before playing, others notice the ally wasn't surprised. Suspicion toward the ally.
- Bond consequence: group `-0.3` with the warned ally (complicity suspicion)
- Badge: `ACCOMPLICE?` (red)
- Fires alongside Variant A or B (not exclusive)

## VP Rendering

### Votes Screen (both rpBuildVotes locations)
- Holder's vote card: "SOLE VOTE" banner, highlighted/gold treatment
- All other players' cards: greyed out with "VOTE SILENCED" text
- Explicit type check: `if (type === 'soleVote')` in both rendering locations

### Voting Plans
- `typeLabels` entry: `soleVote: 'Sole Vote'`

### Camp Event Badges
- Discovery: `ADVANTAGE FOUND` / gold
- Confession: `CONFESSION` / gold
- Leak: `LEAKED` / red
- Snoop: `SNOOPED` / red
- Post-play: `DICTATOR'S FALLOUT` or `WASTED POWER` or `ACCOMPLICE?` / red

## What This Does NOT Do

- No ally-play — holder can only use it for themselves
- Not in journey or auction pools — camp discovery only
- No inheritance on elimination — stripped with other advantages
- No team swap interaction — Sole Vote is about voting, not swapping
