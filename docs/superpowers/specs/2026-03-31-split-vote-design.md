# Split Vote System — Design

**Date:** 2026-03-31
**Status:** Approved

## Overview
Alliances can split their votes between a primary and secondary target to flush hidden immunity idols. The split is an alliance-level decision driven by idol knowledge and strategic ability. Voting the secondary target as part of the agreed plan is NOT a betrayal.

## When to Split

### Confirmed Idol (auto-split)
- Target is in `gs.knownIdolHoldersThisEp` or `gs.knownIdolHoldersPersistent`
- Alliance always splits — no roll needed, it's the rational play

### Suspected Idol (strategic roll)
- Target has high threat + no confirmed idol, OR alliance members have intuition-based suspicion
- Split chance: `max(strategic among alliance members) * 0.06` (stat 5=30%, stat 8=48%, stat 10=60%)

### Minimum Size
- Alliance must have **4+ members at tribal** to split
- 3-person alliance can't split effectively (2-1 is too thin)

## Choosing the Secondary Target

1. **Primary target's closest ally** — highest bond with primary among non-immune, non-alliance players at tribal. Must have bond >= 2 (real connection, not random).
2. **Fallback** — if no ally qualifies, pick the lowest-threat non-immune player outside the alliance. The safe vote.

## Assigning the Split

- Divide alliance into two groups, **majority on primary** (the real vote)
  - 4 members: 3 primary, 1 secondary
  - 5 members: 3 primary, 2 secondary
  - 6 members: 4 primary, 2 secondary
- **Bond protection**: if a voter has bond >= 3 with the secondary target, swap them to the primary group. They won't write their friend's name even for a split plan.
- Assignment stored: `alliance.splitTarget`, `alliance.splitPrimary: []`, `alliance.splitSecondary: []`

## Integration with formAlliances

In `formAlliances()`, after picking the alliance target:
1. Check split conditions (confirmed idol OR strategic roll passes)
2. If splitting: pick secondary target, assign voters to primary/secondary groups
3. Set `alliance.splitTarget = secondaryName` on the alliance object
4. Set `alliance.splitPrimary` and `alliance.splitSecondary` voter arrays

## Integration with simulateVotes

- Loyal voters check which group they're in:
  - If in `splitPrimary`: vote `alliance.target` (primary)
  - If in `splitSecondary`: vote `alliance.splitTarget` (secondary)
- Both are "following the plan" — `isLoyal = true` for both paths
- Vote reason text indicates split: "split vote — assigned to [target]" or "split vote — covering the idol"

## Betrayal Exemption

**Critical:** `decayAllianceTrust` must recognize split-vote secondaries.

- When checking if a voter betrayed their alliance, compare their vote against BOTH `alliance.target` AND `alliance.splitTarget`
- Voting the secondary target when assigned to the secondary group is NOT a betrayal
- Save `ep.splitVotePlan = { alliance: name, primary: target, secondary: splitTarget, primaryVoters: [], secondaryVoters: [] }` so betrayal detection can check it

## Integration with checkIdolPlays

No changes needed — idol plays already delete votes from `votesObj[name]`. If the primary target plays an idol:
- Their votes are negated (removed from tally)
- Secondary target's votes remain
- `resolveVotes` naturally picks the secondary as the new top vote-getter
- The split worked

If nobody plays an idol:
- Primary has more votes (majority assigned there)
- Primary goes home as normal
- Secondary's votes are harmless

## Camp Events

### Pre-Tribal (~40% when split fires)
- `splitVotePlan` event: the alliance discusses the plan
- Text: "The alliance huddled. Two names. One plan. If the idol comes out, they're covered."
- Badge: gold "Split Vote"
- Players: alliance members

### Post-Idol-Catch (next episode, guaranteed when split catches an idol)
- `splitVoteSuccess` event: the split worked
- Text: "[Primary] played the idol — but the split was already in place. [Secondary]'s votes held."
- Badge: gold "The Split Worked"

## VP Display

- Vote cards for secondary-group voters: reason text includes "split vote" indicator
- WHY section: if the split changed the outcome, bullet explaining the split caught the idol
- Voting Plans screen: if split is active, show "SPLIT VOTE" indicator with both target names

## WHY Section Integration

When the eliminated player is the secondary target (idol caught the primary):
- "X votes for [primary] were wiped out by a played idol. [Secondary] was the split target — the backup plan worked."
- Credit the alliance's strategic decision

## Implementation Notes

- All split logic lives in `formAlliances()` (decision) and `simulateVotes()` (execution)
- `ep.splitVotePlan` saved to episode history via `patchEpisodeHistory`
- No new global state needed — split is per-episode, computed fresh each tribal
- `decayAllianceTrust` reads `ep.splitVotePlan` to exempt secondary voters from betrayal
