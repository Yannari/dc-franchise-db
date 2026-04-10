# Dodgebrawl Design

**Date:** 2026-04-10
**Inspired by:** Total Drama Island S1E4 "Dodgebrawl"
**Type:** Schedulable challenge twist (pre-merge, tribe vs tribe)

---

## Overview

Multi-round dodgeball challenge. All tribes play simultaneously on the court. First tribe to 3 round wins gets immunity. Losing tribe (fewest wins, tiebreaker: lowest cumulative score) goes to tribal. Each round generates a short narrative paragraph with 1-3 highlight moments. Post-challenge, 2 camp events per tribe (1 positive, 1 negative).

## TWIST_CATALOG Entry

```
id: 'dodgebrawl'
emoji: '🏐'
name: 'Dodgebrawl'
category: 'challenge'
phase: 'pre-merge'
engineType: 'dodgebrawl'
minTribes: 2
```

## Core Mechanics

### Court Size
- Default: 5 players per tribe on court
- If the smallest tribe has fewer than 5 active members, court size = smallest tribe's member count
- Minimum: 2v2 (tribe with 1 member = twist blocked)

### Sit-Outs
- Tribes with more members than court size must sit players out
- **Rotation enforced:** everyone plays before anyone sits twice
- **Refusal exception:** 1 player per tribe may refuse to play at all (sits every round)
  - Refusal chance: `(10 - boldness) * 0.03 + (10 - loyalty) * 0.02`
  - Boldness 2 / loyalty 2 = ~40% chance. Capped at 1 refuser per tribe.
  - Refuser gets score 0 for all rounds (automatic bomb candidate)

### Scoring
Per player per round:
```
score = physical * 0.35 + intuition * 0.30 + endurance * 0.20 + mental * 0.15 + random(0, 2.0)
```
- Physical = throwing power
- Intuition = reading throws / dodging
- Endurance = lasting in rounds
- Mental = trick shots / strategy

### Round Resolution
- All tribes on the court simultaneously (works for 2, 3, or more tribes)
- Each tribe's round score = sum of their players' individual scores
- Highest-scoring tribe wins the round
- First tribe to 3 round wins gets immunity
- Minimum 3 rounds, maximum 5 (first to 3)

### Winner / Loser Determination
- **2 tribes:** Head-to-head, first to 3. Loser goes to tribal.
- **3+ tribes:** All on court together, first to 3. Tribe with fewest round wins goes to tribal. Tiebreaker: lowest cumulative score across all rounds.

### chalMemberScores
Per-round scores aggregate across all rounds into `ep.chalMemberScores`. Feeds into `updateChalRecord` for standard podium/bomb tracking (pre-merge: top 3 / bottom 3).

## Highlight Moments

Each round generates 1-3 highlights from the pool below. Checked in order, capped at 3.

### Trick Shot
- **Trigger:** Round's top scorer on either tribe has mental >= 7 (narrative text selection)
- **Effect:** +0.3 bond from teammates
- **Narrative:** Creative throw — boomerang ball, static electricity, skip shot

### Rage Mode
- **Trigger:** A player scores 2x the round average
- **Effect:** +1.0 heat for 1 episode
- **Narrative:** Goes berserk, eliminates multiple opponents solo

### Clutch Dodge
- **Trigger:** Losing tribe's top scorer has score > 60% of their tribe's round total (carried but still lost)
- **Effect:** +0.3 bond from teammates, underdog moment
- **Narrative:** Last one standing, dodges multiple throws before going down

### Rush Strategy
- **Trigger:** Winning tribe has a player with strategic >= 7 (narrative text selection)
- **Effect:** +bigMoves credit for the strategic player
- **Narrative:** Coordinates team to focus-fire one opponent. "Everyone throw at [target]. Now."

### Friendly Fire
- **Trigger:** Round's bottom scorer has physical <= 4 AND their tribe lost (15% chance)
- **Effect:** -0.5 bond with a random teammate (losing tribe) or -0.3 (winning tribe)
- **Narrative:** Accidentally hits own teammate. Comedy moment.

### Refusal
- **Trigger:** Refuser's tribe loses this round
- **Effect:** +1.5 heat, -0.5 bond from all tribemates
- **Narrative:** Sat on the bench giving sarcastic commentary while team got destroyed

## Camp Events (2 per tribe)

After all rounds, generate 1 positive + 1 negative camp event per tribe.

### Positive Events (pick best candidate per tribe)

**Team Player**
- Candidate: Highest `social * 0.5 + loyalty * 0.5` among non-MVP players
- Effect: +0.4 bond with 1-2 tribemates
- Text: "Set up kills, fed balls to teammates, selfless play."

**Dodgeball Hero**
- Candidate: Tribe's top overall scorer across all rounds
- Effect: +0.5 bond from tribemates, +2 popularity
- Text: "Carried the team."

**Redemption**
- Candidate: Player who scored bottom-half in round 1 but top-scored in a later round
- Effect: +0.3 bond from tribemates
- Text: "Came back when it mattered."

### Negative Events (pick worst candidate per tribe)

**Refusal Fallout** (priority — always takes the slot if a refuser exists)
- Candidate: The refuser
- Effect: -0.5 bond from all tribemates, +1.5 heat
- Text: "Gave the team nothing but attitude."

**Choked Under Pressure**
- Candidate: Player whose actual score was furthest below their expected score (stat-based average)
- Effect: -0.3 bond from tribemates, +0.5 heat
- Text: "Talked big, delivered nothing."

**Liability**
- Candidate: Tribe's worst overall scorer (excluding refusers)
- Effect: -0.3 bond, +0.5 heat (stronger on losing tribe)
- Text: "Worst performer on the court."

Selection: Refusal Fallout always wins the negative slot. Otherwise, pick Choked if the underperformance gap is larger, else Liability.

All camp events use `players: []` array, `badgeText`, `badgeClass`.

## VP Screen

### `rpBuildDodgebrawl(ep)` — click-to-reveal per round

Structure:
1. **Header:** "DODGEBRAWL" title + court size + tribe matchup
2. **Scoreboard bar:** persistent, updates as rounds reveal (e.g., `Red 1 — Yellow 2`)
3. **Per round (click to reveal):**
   - Round number + winning tribe
   - Narrative paragraph with highlights woven in
   - MVP portrait (round's top scorer)
4. **Final:** Winning tribe celebration, losing tribe blame moment

Pattern: `_tvState['dodgebrawl_${ep.num}']` with `idx: -1`. NEXT / REVEAL ALL. Scroll position preserved.

Registered in `buildVPScreens()` — replaces normal challenge screen when `ep.isDodgebrawl`.

## Text Backlog

### `_textDodgebrawl(ep, ln, sec)`
- Section: "DODGEBRAWL"
- Per round: "Round N: [Tribe] wins. [Highlight summary]"
- Final score
- Refusal noted if applicable
- Camp event summaries

## Cold Open Recap
- Recap card: winner, final score, MVP, refuser if any

## Episode History Fields
- `ep.isDodgebrawl = true`
- `ep.dodgebrawl = { rounds: [...], courtSize, refusers: [], finalScore: {}, winner, loser, highlights: [...] }`
- `ep.chalMemberScores` — aggregated per-player scores

## Edge Cases
- **Tribe with 1 member:** Twist blocked.
- **Refuser on a 3-person tribe:** Court drops to 2v2. Brutal handicap — that's the consequence.
- **Same player MVP every round:** Allowed. Heat scales proportionally.
- **Friendly fire on winning tribe:** Lighter bond damage (-0.3 vs -0.5). Comedy tone.
- **3+ tribes, tie for worst:** Lowest cumulative score breaks it.
- **All rounds won by same tribe (3-0):** Other tribes' loser determined by cumulative score.
