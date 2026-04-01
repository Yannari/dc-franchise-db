# Fire-Making Finale — Design

**Date:** 2026-03-31
**Status:** Approved

## Overview
Fire-making is a separate boolean toggle (`seasonConfig.firemaking = true`) that forces a Final 4 finale with a fire-making duel. The immunity winner picks one person to save, the remaining two make fire, the loser is eliminated 4th. The surviving F3 enters whatever `finaleFormat` is configured.

## Toggle
- `seasonConfig.firemaking` — boolean, separate from `finaleFormat`
- When enabled: overrides `finaleSize` to 4 in the engine
- Compatible with ALL finale formats (traditional, jury-cut, fan-vote, final-challenge)

## Flow

1. **F4 Immunity Challenge** — standard individual challenge, one winner
2. **The Decision** — immunity winner picks one person to save
3. **Fire-Making Duel** — the two NOT saved compete head-to-head
4. **F3 enters finaleFormat** — whatever is configured runs normally with 3 players

## The Decision — Who to Save

The immunity winner chooses based on personality:

**Strategic players** (`strategic * 0.1` chance, so stat 5 = 50%, stat 8 = 80%, stat 10 = 100%):
- Run `projectJuryVotes` for all 3 opponents
- Save the person the winner projects they can BEAT at FTC (weakest jury threat)
- Send the biggest jury threat to fire — risky, they might survive

**Everyone else** (bond-based):
- Save the person with the highest bond
- Emotional, loyal decision — save your ride-or-die

This creates divergent narratives: a mastermind saves a goat over their best friend because the math says so. A loyal soldier saves their ally even if it's a bad jury move.

## Fire-Making Duel

**Stat formula:** `physical * 0.4 + endurance * 0.4 + temperament * 0.2`
- Fire-making rewards physical ability (building the fire), endurance (maintaining composure under pressure), and temperament (steady hands, not panicking)
- Random noise: `± 1.5` — upsets happen. A calm, focused player can beat a physical beast.

**Result:** Higher score wins. Loser = 4th place, eliminated.

## VP Screens

### "The Decision" Screen
- Immunity winner's portrait center stage
- The three other players shown
- Who was saved + why (strategic read: "projected jury votes and chose to save the person they can beat" OR bond: "saved their closest ally")
- The two fire-making competitors highlighted

### "Fire-Making" Screen
- Two competitors side by side
- Stat comparison relevant to fire (physical, endurance, temperament)
- Duel narrative text (building fire, one pulls ahead, tension)
- Winner/Loser reveal with placement

Both screens inserted between F4 immunity challenge and the FTC/finale format screens.

## Episode Data

- `ep.firemaking = true` — flag that fire-making happened this finale
- `ep.firemakingDecision = { immunityWinner, saved, savedReason: 'strategic'|'bond', competitors: [a, b], juryProjection: {...} }`
- `ep.firemakingResult = { winner, loser, winnerScore, loserScore, duelType: 'fire' }`

## Engine Integration

- In `simulateFinale()`: when `seasonConfig.firemaking === true`, override `finaleSize` to 4
- After F4 immunity challenge resolves: run the Decision + Fire-Making before entering the finale format
- The eliminated player goes to jury (4th place juror)
- `handleAdvantageInheritance` called for the loser before elimination
- F3 proceeds to the configured `finaleFormat` with 3 players

## Implementation Notes

- Reuse existing `simulateFinaleChallenge` for the F4 immunity challenge
- New function: `simulateFiremakingDecision(immunityWinner, others)` — returns who to save
- New function: `simulateFiremakingDuel(playerA, playerB)` — returns winner/loser
- New VP functions: `rpBuildFiremakingDecision(ep)`, `rpBuildFiremakingDuel(ep)`
- Add fire-making screens to finale VP screen flow between immunity and FTC
