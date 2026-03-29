# Open Vote Overhaul — Design Spec

**Date:** 2026-03-28
**Status:** Approved
**Replaces:** Current open-vote twist (flat +0.1 loyalty boost, generic bond damage)

---

## Overview

A public voting format where votes are cast sequentially in an order chosen by the immunity winner. Each vote is announced face-to-face. Cascade pressure builds as the tally becomes visible. Bond consequences are amplified — you watch someone say your name, and you know exactly who betrayed you.

## When

Any phase (pre-merge or post-merge). Scheduled via format designer.

## Episode Flow

1. Normal challenge + camp events run
2. At tribal: immunity winner announces the voting order
3. Votes cast one at a time — each voter sees the running tally
4. Each vote triggers a micro-reaction from the target
5. Cascade pressure may cause later voters to switch from their plan
6. Idol plays / SitD / vote steal still fire pre-vote (before the open sequence)
7. Bond consequences amplified — all vote damage doubled vs secret ballot
8. Post-tribal fallout: exact voter identities known, grudge targeting next episode

## Voting Order Selection

The immunity winner picks the full order. Strategy depends on personality:

| Personality | Order strategy |
|-------------|---------------|
| Strategic 7+ | Target first (pressure), ally second (sets plan), self last (max info) |
| Bold 7+ | Self first (leads by example), target second |
| Social 7+ | Swing votes early (forces commitment from undecideds) |
| Default | Threat score descending (biggest threats vote first) |

**State:** `ep.openVoteOrder = [name1, name2, ...]` — full sequence.
`ep.openVoteOrderedBy = immunityWinner`

If no immunity winner (pre-merge tribe challenge), order is determined by the alliance hub (highest social+strategic in the majority).

## Cascade Mechanic

Each voter at position 2+ checks whether to stick with their original plan or switch to the leading target:

```
cascadePressure = (votesForLeader / votersSoFar) * 0.4
                + (leaderIsMyAllianceTarget ? 0.2 : 0)
                - (bondWithLeadingTarget >= 4 ? 0.3 : 0)
                - (boldness >= 7 ? 0.15 : 0)
                + (intimidatedByEarlyVoter ? 0.15 : 0)
```

If `cascadePressure + random(0, 0.1) > loyaltyThreshold` → voter switches to leading target.

### Intimidation

A voter with `physical >= 8` or `boldness >= 8` who votes in positions 1-3 and votes for a specific target creates an intimidation flag. Later voters with `boldness <= 4` get +0.15 cascade pressure toward that target.

### Cascade Switch Tracking

When a player switches:
```js
ep.cascadeSwitches.push({
  voter, originalTarget, newTarget, position, reason: 'cascade'
})
```
- Alliance betrayal detection picks this up as a defection
- Camp event next episode exposes the flip
- VP shows amber "SWITCHED" badge on their vote card

## Giving a Vote — Consequences

| Situation | Trigger | Consequence |
|-----------|---------|-------------|
| Voting against a friend | Bond >= 3 with target | -0.5 extra bond (on top of normal). Voter emotional → uneasy |
| Voting against an enemy | Bond <= -2 with target | +0.3 bond with all co-voters (shared conviction, solidarity) |
| First voter, target eliminated | Position 1, target = boot | +1.0 bond with everyone who followed (set the plan, tribe respected it) |
| First voter, target survives | Position 1, target survives | -0.5 bond with target (showed your hand and failed) |
| Last voter, pile-on | Last position, voted with majority | -0.3 bond with strategic players (cowardice noted) |
| Last voter, defiance | Last position, voted against majority | +0.5 bond with person protected, +0.3 with bold players (respect) |
| Cascade switcher | Changed from original plan | Alliance betrayal entry. -0.5 bond with original alliance members. Camp event exposing the flip |

## Receiving a Vote — Consequences

| Situation | Trigger | Consequence |
|-----------|---------|-------------|
| Friend votes against you | Bond >= 3 with voter | -2.0 bond (double normal). Emotional → desperate or paranoid |
| Enemy votes against you | Bond <= -2 with voter | -0.5 bond (rivalry deepens). Expected, no surprise |
| Watching the pile grow | 3+ votes against them | Each vote after 3rd: emotional pressure compounds. If survive → paranoid next ep guaranteed |
| Nobody votes for them | 0 votes received | +0.3 bond with everyone (relief + gratitude). Comfort blindspot risk |
| Survived with visible votes | 2+ votes, not eliminated | Exact voter identities known. Grudge targeting next episode. Bond damage is permanent — no ambiguity |

## VP Display — Per-Vote Micro-Reactions

Each vote in the VP shows the voter's declaration AND the target's reaction:

| Target's personality | Reaction text |
|---------------------|---------------|
| Temperament 7+ | "{target} doesn't react. Just watches." |
| Temperament 4-6 | "{target} nods slowly." |
| Temperament <= 3 | "{target} looks away." |
| Bond >= 3 with voter | "{target}'s eyes widen. Didn't expect that from {voter}." |
| Bond <= -2 with voter | "{target} nods. Knew it was coming." |

Multiple variants per category for replayability. Reaction overrides: betrayal shock (bond >= 3) takes priority over temperament-based reaction.

## VP Screen Changes

The Votes screen for open vote episodes:

- **Header:** "Open Vote — order chosen by {immunityWinner}"
- **Voting order display** at the top: all player portraits in sequence with position numbers
- **Vote cards revealed one at a time** (interactive, same pattern as normal vote reveal):
  - Voter portrait + declaration: "{voter} stands up. '{target}.'"
  - Target reaction text (italic, muted)
  - Running tally updates after each card (animated)
- **Cascade switch:** amber highlight on card + "Originally planned {original} — switched" note
- **First voter badge:** "SETS THE TONE" (gold)
- **Last voter badge:** "FINAL WORD" (gold if defiance, grey if pile-on)
- **Final tally** shown after all votes revealed (same as normal)

## Post-Tribal Consequences

All open-vote bond damage is **doubled** compared to secret votes. The voter saw your face when they said your name. There's no "maybe it wasn't them."

Next episode camp events:
- "{target} hasn't spoken to {voter} since tribal. The open vote made it personal."
- "{voter} voted first and set the plan. The tribe either respects the leadership or marks the target."
- "{switcher} was supposed to vote {original}. When the pressure mounted, they switched. {alliance} noticed."
- "{defiant} went last and voted against everyone. That took guts. The tribe is still deciding if it was brave or stupid."
- "The open vote left no room for plausible deniability. Everyone knows exactly who said whose name."

## Compatibility with Existing Systems

- **Idol plays:** Fire BEFORE the open vote sequence (pre-vote, as normal). Idol holder stands up before voting starts.
- **Shot in the Dark:** Top target can still play SitD when they see 2+ votes coming. Fires between votes — dramatic interruption.
- **Vote Steal:** The stolen vote redirect happens during the sequence — everyone sees it live. The stolen player's turn is skipped, the stealer casts the extra vote in sequence.
- **Extra Vote:** The holder casts their extra vote at the end of the sequence (additional turn).
- **Second Life / Fire Making:** Still fires after the vote resolves. The open vote just changes HOW votes are cast, not what happens after.
- **Overplaying:** Can still fire — whispering at an open tribal is even MORE visible.

## Engine Integration

### In `applyTwist`
- Set `ep.openVote = true` (already exists)
- No other changes needed here — the order and cascade run inside `simulateVotes`

### In `simulateVotes` (when `openVote = true`)
- Generate `ep.openVoteOrder` based on immunity winner personality
- Run votes sequentially instead of all-at-once
- After each vote: check cascade pressure for next voter
- Track cascade switches in `ep.cascadeSwitches`
- Apply per-vote bond consequences (friend/enemy/first/last)
- Generate per-vote reaction text for VP

### In `updateBonds` (post-tribal)
- Double all vote-related bond damage when `ep.openVote`

### Episode History Save
```js
openVote: true,
openVoteOrder: [...],
openVoteOrderedBy: name,
cascadeSwitches: [...],
openVoteReactions: [{ voter, target, reactionText }]
```

## Priority

HIGH — the twist exists but is mechanically empty. This transforms it into one of the most dramatic tribal formats in the game. Every vote is a face-to-face confrontation. The cascade creates emergent drama. The consequences ripple for episodes.
