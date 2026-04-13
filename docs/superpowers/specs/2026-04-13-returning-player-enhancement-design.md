# Returning Player Twist Enhancement

## Summary

Enhance the existing `returning-player` twist to support 1-3 returnees per episode, each with a configurable "reason for returning" that drives selection weights. No new systems — this extends the existing twist config, UI, and engine logic.

## Twist Config Changes

Add two fields to the twist object when assigned to an episode:

- `returnCount` (number, 1-3, default 1)
- `returnReasons` (string array, one per slot, default `['random']`)

Backward compatible: existing configs without these fields behave identically to current behavior.

## Reason Categories

Each returnee slot gets one reason that determines selection weights from the eligible pool (`gs.eliminated` minus `gs.riPlayers` and `gs.jury`):

| Reason | ID | Weight Factors |
|---|---|---|
| Unfinished Business | `unfinished-business` | Absolute bond strength with active players, was blindsided (vote didn't match their vote), held advantage at elimination |
| Entertainment Value | `entertainment` | Showmance involvement, social stat, camp event participation history |
| Strategic Threat | `strategic-threat` | Strategic stat, alliance membership count, disruption potential vs current dominant alliance |
| Underdog | `underdog` | Eliminated early (low episode number), low threat perception, few alliances |
| Random | `random` | Current behavior: `strategic * 0.3 + Math.random() * 3` |

All weight functions produce a positive float passed to `wRandom`. Each must have a minimum floor (e.g., 0.1) so no eligible player has zero chance.

## Selection Loop

1. Build eligible pool from `gs.eliminated` (excluding `gs.riPlayers` and `gs.jury`)
2. For each slot (0 to `returnCount - 1`):
   a. Get the reason from `returnReasons[i]`
   b. Apply the corresponding weight function to the eligible pool
   c. Select via `wRandom`
   d. Remove selected player from eligible pool
   e. Push to `twistObj.returnees[]`
3. If eligible pool empties before all slots filled, fill as many as possible and note partial return

Store results in `twistObj.returnees` (array of `{ name, reason }` objects). Keep `twistObj.returnee` as alias to `returnees[0].name` for backward compat.

## Pre-Merge Tribe Placement

Distribute returnees across tribes sequentially. For each returnee:
1. Find the tribe with the fewest members (at time of placement)
2. Add the returnee to that tribe
3. Recalculate before placing the next returnee

Post-merge: returnees simply join `gs.activePlayers`. No tribe placement needed.

## Bond Adjustments

Apply the existing bond logic per returnee (unchanged):
- Cap extreme negative bonds at -1
- Allies (bond >= 4): +1 reunion warmth
- Enemies (bond <= -3): -0.5 reinforced wariness

## Camp Event Boosts

Scale existing boosts with count. Current boosts (for 1 returnee):
- tdStrategy +30, dispute +25, eavesdrop +20, leadershipClash +15, rumor +15

For multiple returnees, apply per returnee (stacking). This makes multi-return episodes highly disruptive, which is intentional.

## Tribal Council

One tribal still happens regardless of returnee count. Net gain = `returnCount - 1` players. Merge calculation must subtract all returnees from active count (existing `_twistReturns` logic, just needs to count the array length instead of 1).

## UI (Episode Format Designer)

When "Returning Player" twist is assigned to an episode:
1. Show a **count dropdown** (1 / 2 / 3)
2. For each slot, show a **reason dropdown** with the 5 categories
3. Fits inside the existing twist card — compact layout

## Downstream Updates (VP, Text, Timeline, History)

All locations that currently read `twistObj.returnee` (single string) must iterate `twistObj.returnees[]` (array):

### Tribal Display (line ~45718)
- List each returnee with their reason: "RETURNING PLAYER - [name] is back ([reason])."
- Handle `noReturn` and partial returns

### Episode Summary Narrative (line ~49207)
- Scale text for 1 vs 2 vs 3 returnees
- Expanded text pool for multi-return scenarios

### Timeline Tags
- One tag per returnee, or a combined tag showing count

### Text Backlog
- Entry per returnee with reason-flavored narrative

### VP Screen (rpBuild*)
- List all returnees with click-to-reveal if using `_tvState` pattern

### Episode History
- `ep.twists[].returnees[]` array persisted, replaces single `returnee` field

### Twist Narrative Events
- One narrative event per returnee (currently creates one "rumor" event)
- Each flavored by the returnee's reason category

## Backward Compatibility

- `returnCount` defaults to 1 if absent
- `returnReasons` defaults to `['random']` if absent
- `twistObj.returnee` kept as alias to `returnees[0].name`
- Existing saved seasons with the old format continue to work
