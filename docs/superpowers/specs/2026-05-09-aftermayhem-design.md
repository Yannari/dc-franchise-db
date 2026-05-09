# Aftermath Aftermayhem — Gameplay Spec

## Overview

A standalone twist (`aftermayhem` in TWIST_CATALOG) that fires during an aftermath episode. 6 eliminated players compete in a board game gauntlet for the chance to return to the competition. Players race across a 15-square game board — roll dice, face challenges on each square, manage their energy bar. Run out of energy = eliminated. First player to reach the trophy case (square 15) wins and returns to the game. Alternative return path to the existing fan vote — both can exist in the same season but not the same episode.

**Source**: TDW S3E18 "Aftermath Aftermayhem" — renamed to avoid real-world geography. The episode's board game, peanut can lottery, and escalating mini-challenges are the core inspiration.

**Files**: `js/chal/aftermayhem.js` (simulation + VP). Integration across the standard 7 files plus aftermath.js hooks.

---

## TWIST_CATALOG Entry

```javascript
{ id: 'aftermayhem', emoji: '🎲', name: 'Aftermath Aftermayhem',
  category: 'returns', phase: 'any',
  chalSeries: 'world-tour', chalStyle: 'chaos',
  desc: '6 eliminated players race across a board game gauntlet. Manage your energy or get KO'd — first to the trophy case returns!',
  engineType: 'aftermayhem',
  incompatible: ['second-chance'] }
```

Note: `incompatible` only lists `second-chance` because this is a return-category twist, not a challenge-category twist. It doesn't compete for the challenge slot — it fires DURING the aftermath show. No need to list all challenge twist IDs. Do NOT call `updateChalRecord(ep)` — these are eliminated players, not active challenge participants.

---

## Eligibility Gate

The twist fires only when ALL conditions are met:

1. An aftermath episode is scheduled (or auto-fires via `cfg.aftermath === 'enabled'`)
2. `gs.eliminated.filter(n => !gs.riPlayers?.includes(n)).length >= 6` — at least 6 eliminated players not in Redemption Island
3. No `second-chance` twist on the same episode
4. `!gs._aftermayhemUsed` — one Aftermayhem per season

If conditions aren't met when the twist is scheduled, it defers to the next aftermath episode. If no valid aftermath fires before the finale, the twist is skipped.

---

## Phase 0: Golden Can Lottery (all eliminated → 6 selected)

All eligible eliminated players (excluding RI players) receive a "peanut can." 6 cans contain Golden Chris heads.

### Selection Weights

Each eliminated player gets a weighted score:

```
weight = popularity * 0.4 + recencyScore * 0.3 + random(0, 1) * 0.3
```

- **Popularity**: `gs.popularity[name] || 0` — fan favorites get better odds
- **Recency**: `(eliminationIndex / totalEliminated)` — later eliminations score higher (0.0 for first boot, 1.0 for most recent). More dramatic returns.
- **Noise**: `Math.random()` — upsets happen

Top 6 by weight are selected. No replacement draws.

### Lottery Events

Each eliminated player gets a reaction event:
- **Winners** (found Golden Chris): archetype-driven elation. Villains gloat, heroes are grateful, underdogs are stunned.
- **Losers** (empty can): archetype-driven disappointment. 2-3 losers get featured reactions (highest popularity among losers get screen time). Rest get a group reaction.

### Lottery Output

```javascript
lottery: {
  pool: [{ name, weight, popularity, recency, selected: bool }],
  winners: [name, name, name, name, name, name],  // the 6
  loserReactions: [{ name, text, archetype }]
}
```

---

## Energy System

Every player starts with **100 energy**. Energy is the survival resource — lose it all and you're out.

### Energy Drains

| Source | Drain |
|--------|-------|
| Challenge failure (scored below threshold) | -15 to -25 (scales with how badly they failed) |
| Challenge mediocre (mid-range score) | -5 to -10 |
| Booby trap square | -20 instant drain |
| Social attack (trash talk target) | -5 |
| (No bad luck roll — dice range is only 1-3) | — |

### Energy Gains

| Source | Gain |
|--------|------|
| Challenge success (scored above threshold) | +5 to +10 |
| Challenge domination (top score this turn) | +15 |
| Social boost (encouragement received) | +5 |
| Showmance moment | +5 to both partners |
| Dice roll of 3 (best roll) | +5 |

### Elimination Trigger

When a player's energy hits 0 or below, they are **immediately eliminated** — dramatic KO animation, token goes grey, archetype-driven reaction. This can happen at ANY point during a turn (after a challenge, after a trap, etc.). No rounds/cuts — players drop out organically.

### Energy Formula

After each challenge:
```
energyDelta = (score - threshold) * 2.5
```
Where `threshold` = average expected score for that challenge type (based on primary stat median ~5). A score of 8 might give +7.5 energy, a score of 3 might drain -5 energy. Booby trap damage stacks on top.

### Energy Caps

- Maximum: 100 (can't overheal)
- Minimum: 0 (eliminated)
- Starting: 100 for all players

---

## The Game Board

A 15-square winding track. Each square has a challenge type. The board is built once at the start. **The goal is to reach square 15 (the Trophy Case) first while keeping your energy above 0.**

### Win Condition

**First player to land on or pass square 15 wins and returns to the game.** If all remaining players are eliminated before anyone reaches the finish, the player who was closest to the finish (highest square position) among the last 2 eliminated gets a "last chance" sudden-death challenge to still win.

### Board Generation

Squares 1-14 are assigned challenge types from the pool below. No two adjacent squares share a type. Square 15 is the TROPHY CASE (finish line). 

### Challenge Types — Season Callback Pool

**CRITICAL**: Challenges on the board reference past challenges from the current season (or involve active players). This creates narrative continuity — "You failed the cooking challenge in Episode 3. Now Chef wants a rematch."

The board draws from a pool of 10 challenge archetypes. During board generation, the simulation checks `gs.episodeHistory` for past challenge types and flavors each square with a callback:

| ID | Name | Primary Stat | Secondary Stat | Season Callback Flavor |
|----|------|-------------|----------------|------------------------|
| `obstacle` | Obstacle Remix | physical | endurance | References a past physical challenge from the season. "Remember the obstacle course from Episode X? Here's the speed round." |
| `trivia` | Season Trivia | mental | intuition | Questions about events from THIS season — who was voted out when, which tribe won what, alliance drama |
| `feast` | Chef's Revenge | boldness | endurance | Chef recreates a dish from a past cooking/eating challenge. If no cooking challenge happened, Chef invents "mystery slop" |
| `laser` | Laser Callback | physical | intuition | References a past stealth/dodge challenge. "The laser grid is back — but HARDER" |
| `crowd` | Crowd Convince | social | strategic | An active player from the main game sits as judge. The eliminated player must convince them they deserve a second chance |
| `puzzle` | Puzzle Bomb | mental | strategic | Puzzle references a past mental challenge. Timer is shorter than the original |
| `memory` | Memory Maze | intuition | mental | Navigate a maze of season memories — boot order, challenge wins, alliance names |
| `roast` | Improv Roast | social | boldness | Roast the host OR an active player who appears as a guest. Crowd (peanut gallery) judges |
| `creature` | Creature Brawl | physical | boldness | Box an animatronic creature themed after a past challenge mascot or hazard |
| `trap` | Trap Sprint | endurance | intuition | Run a course with trapdoors. References a past endurance challenge — "You lasted 3 hours in the Awake-A-Thon. Can you last 30 seconds here?" |

### Active Player Cameos

For `crowd` and `roast` squares, an active player is pulled from `gs.activePlayers` as a guest judge/target:
- Selection: random from active players, weighted by bond strength with the current competitor (rivals and allies create better TV)
- The active player's bond with the competitor affects the challenge: positive bond = slightly easier social check, negative bond = harder
- Bond changes: `addBond(competitor, activePlayer, ±0.5)` based on the outcome
- Camp event injected: `aftermayhem-cameo` — the active player remembers this interaction

### Booby Trap Squares

2 random squares (not square 1 or 15) are marked as booby traps. A player landing on a trapped square takes **-20 energy** instantly. The trap is hidden until landed on — the VP reveals it dramatically. Traps persist (same board for all players).

---

## Turn Structure

The game is played in **rounds**. Each round, all surviving players take one turn in sequence. Rounds continue until someone reaches the finish or all but one are eliminated.

### Turn Order

Randomized at the start of Round 1. Same order persists across rounds (eliminated players are just skipped).

### Each Turn

1. **Dice roll**: `1 + Math.floor(Math.random() * 3)` — 1, 2, or 3 squares forward. Small range = every square matters, game lasts 5-8 rounds.
2. **Energy roll modifier**: Roll of 3 (best) = +5 energy (momentum boost). Roll of 1 = no modifier. Applied immediately.
3. **Land on square**: Challenge type determined by the square
4. **Booby trap check**: If the square is trapped, -20 energy BEFORE the challenge. If this KOs the player, they're eliminated before even facing the challenge.
5. **Face challenge**: Score calculated, energy adjusted based on performance
6. **Elimination check**: If energy ≤ 0 after the challenge, player is eliminated with dramatic KO
7. **Win check**: If player's position ≥ 15, they WIN — game over immediately

### Scoring Per Challenge

```
score = primaryStat * 0.6 + secondaryStat * 0.3 + noise(2.5)
```

Energy delta:
```
threshold = 5.0  // average expected
delta = (score - threshold) * 2.5
energy = clamp(energy + delta, 0, 100)
```

A strong performance (score 8) gives +7.5 energy. A poor one (score 3) drains -5 energy. Combined with trap damage, a bad turn can drain 25+ energy in one go.

### Pacing

Expected game length: 5-8 rounds (30-48 individual turns for 6 players). With dice range 1-3, reaching square 15 takes ~5-8 rolls on average. By design:
- Round 1-2: establishing positions, few eliminations. 0-1 players KO'd.
- Round 3-5: trap encounters + accumulated drain start KO'ing weaker players. 2-3 eliminations.
- Round 5-8: front-runners approach the finish. Race tension peaks.
- If the game drags past round 8, energy drains increase by 50% per round ("the board is getting impatient").

### Escalation (Anti-Stall)

Starting round 9: all energy drains are multiplied by `1.0 + (round - 8) * 0.5`. This prevents infinite stalling if stats/noise keep everyone alive. By round 11, drains are 2.5x — someone's going down.

---

## Social Events

After every 3 turns (not per round — per individual turn count), one social event fires:

- **Trash talk**: villain/schemer taunts another competitor. `addBond(a, b, -1)`. Target loses 5 energy. 30% chance.
- **Encouragement**: hero/loyal-soldier encourages a struggling player (lowest energy). `addBond(a, b, +1)`. Target gains 5 energy. 25% chance.
- **Peanut gallery reaction**: a specific eliminated spectator reacts to the current state. No bond change, pure flavor. 25% chance.
- **Showmance moment**: if a competitor has a showmance partner in active players, brief interaction. `addBond` +1. Both gain 5 energy. 20% chance, requires active showmance.

### Archetype Flavor

Each challenge generates narration text based on the player's archetype:
- Challenge-beast on Obstacle Remix: confident, dominant text
- Goat on Season Trivia: fumbling, comedic text
- Villain on Improv Roast: cruel, crowd-pleasing text

Minimum 4 text variants per challenge type per outcome (pass/struggle).

---

## The Finish — Trophy Case

When a player reaches square 15:

1. **Trophy Case arrival**: dramatic entrance narration
2. **Game halted**: all other players stop
3. **Winner ceremony**: confetti, spotlight, peanut gallery erupts
4. **Return announcement**: "[Winner] has earned a second chance!"

### Last-Standing Rule

If only 1 player remains (all others KO'd), that player automatically wins regardless of board position — they're the last one standing. No need to reach the finish.

### Nobody-Reaches-Finish Failsafe

If all players are eliminated (theoretically possible with simultaneous energy drain), the player who was eliminated LAST and had the highest board position wins. The board game always produces exactly 1 winner.

---

## Return Integration

The winner follows the existing returning-player pipeline from `twists.js`:

1. Remove from `gs.eliminated`
2. Add to `gs.activePlayers`
3. Pre-merge: join smallest tribe. Post-merge: join merge pool
4. Bond adjustments:
   - Extreme negatives (< -1) softened to -1
   - Strong allies (bond >= 4): +1.0 bonus
   - Enemies (bond <= -3): -0.5 wariness penalty
5. Camp event: `aftermayhem-return` with archetype-driven narrative text
6. Set `gs._aftermayhemUsed = true`
7. Popularity boost: `popDelta(winner, +3)` — they earned it

### Episode Data Storage

```javascript
ep.aftermath.aftermayhem = {
  lottery: { ... },
  board: { squares: [...], traps: [idx, idx], cameos: { squareIdx: activePlayerName, ... } },
  rounds: [
    {
      roundNum: 1,
      turns: [{ player, diceRoll, square, challengeType, score, energyDelta, energyAfter, isTrap, trapDamage, text, cameo }],
      socialEvents: [{ type, players, text, bondDelta, energyDelta }],
      eliminations: [{ name, square, energy: 0, text }]
    },
    // ... more rounds
  ],
  winner: name,
  winCondition: 'finish' | 'last-standing' | 'failsafe',
  returnedTo: tribeName || 'merge'
}
```

---

## Scoring Summary (chalMemberScores)

Since these are eliminated players, `chalMemberScores` is used for VP ranking display only (not challenge records). Accumulates across all turns:

| Action | Score |
|--------|-------|
| Complete a challenge (any result) | +3 |
| Challenge domination (top score that turn) | +5 bonus |
| Survive a booby trap | +3 |
| KO'd by booby trap | +1 (participation) |
| Last standing (all others KO'd) | +10 |
| Reach the Trophy Case | +15 |
| Social event (trash talk aggressor) | -1 |
| Social event (encouragement giver) | +2 |
| Per round survived | +2 |

---

## Popularity Changes

| Event | Delta |
|-------|-------|
| Selected in lottery (Golden Chris) | +1 |
| Challenge domination | +1 |
| KO'd (eliminated) | -1 |
| Survive a booby trap dramatically | +1 |
| Win the game (reach trophy) | +3 |
| Last standing win | +2 |
| Trash talk (villain) | -1 to target's sympathy, +1 to villain's notoriety |
| Encouragement (hero) | +1 |

---

## Bond Changes

| Event | Bond Delta |
|-------|-----------|
| Trash talk | -1 between players |
| Encouragement | +1 between players |
| Showmance moment | +1 between partners |
| Active player cameo (competitor wins) | +0.5 competitor → active player |
| Active player cameo (competitor loses) | -0.5 competitor → active player |

---

## Integration Points (7 files + aftermath.js)

### 1. core.js — TWIST_CATALOG entry
```javascript
{ id: 'aftermayhem', emoji: '🎲', name: 'Aftermath Aftermayhem',
  category: 'returns', phase: 'any',
  chalSeries: 'world-tour', chalStyle: 'chaos',
  desc: '6 eliminated players race across a board game gauntlet. Manage your energy or get KO'd — first to the trophy case returns!',
  engineType: 'aftermayhem',
  incompatible: ['second-chance'] }
```

### 2. twists.js — engine flag
```javascript
} else if (engineType === 'aftermayhem') {
  ep.isAftermayhem = true;
```

### 3. aftermath.js — hook into aftermath flow
Insert Aftermayhem board game AFTER interviews, BEFORE fan vote/awards. When `ep.isAftermayhem` is true:
- Run `simulateAftermayhem(ep)` from aftermayhem.js
- Skip fan vote screen for this episode
- Store results in `ep.aftermath.aftermayhem`
- Execute return pipeline

### 4. episode.js — standard integration
- Import
- Dispatch: check `ep.isAftermayhem` during aftermath flow
- Episode history: add `isAftermayhem: ep.isAftermayhem || false, aftermayhem: ep.aftermath?.aftermayhem || null` to ALL history push calls
- `_hasTwistChallenge` list addition
- Generic challenge skip
- `handleExileFormat` guard

### 5. vp-screens.js — screen registration
Insert aftermayhem VP screens into the aftermath VP flow:
- `rpBuildAftermathAftermayhemLottery(ep)` — Golden Can lottery
- `rpBuildAftermathAftermayhemBoard(ep)` — Board game (all rounds, live map, energy bars)
- `rpBuildAftermathAftermayhemFinish(ep)` — Trophy Case arrival + return announcement

### 6. text-backlog.js — text summary
Use `_textTwistChallenge()` with the VP builders for automatic text backlog.

### 7. main.js — module import
```javascript
import * as aftermayhemMod from './chal/aftermayhem.js';
```

### 8. run-ui.js — badge tag
```javascript
const amTag = ep.isAftermayhem ? `<span class="ep-hist-tag" style="background:rgba(255,200,0,0.15);color:#ffc800">Aftermayhem</span>` : '';
```

---

## VP Identity (gameplay-relevant notes only)

Full VP visual design to be specced separately. Key gameplay-affecting VP elements:

- **Live game board map**: sticky tracker showing all 6 player tokens (actual avatar images from `assets/avatars/`) on a 15-square winding track. Tokens animate forward on dice rolls, go grey + crack on elimination. Updates on every reveal click via DOM manipulation.
- **Animated dice**: SVG dice that visually tumble to show the rolled number. Connected to the actual dice result from simulation.
- **Energy bars**: each player has a visible energy bar (green→yellow→red gradient) that drains/fills on every reveal. Dramatic low-energy warnings (flashing, screen shake).
- **Booby trap reveal**: hidden skull marker appears with dramatic animation + screen shake when a player lands on a trap square. Energy bar visibly chunks down.
- **Season callback labels**: each board square shows which past challenge it references ("Ep3: Cooking" or "Ep7: Obstacle Course").
- **Active player cameos**: when an active player appears as judge/target, their portrait appears with a guest badge.
- **Sidebar scoreboard**: all 6 players with energy bars, board positions, status (RACING/KO/WINNER). Live-updates on reveal.
- **Peanut gallery strip**: row of eliminated spectator portraits with archetype-driven reaction indicators.
- **Confetti + particle chaos**: game show energy — spotlight sweeps, ticker tape, crowd noise indicators, dramatic eliminations.

---

## Edge Cases

- **Fewer than 6 eligible eliminated**: twist defers to next aftermath. If no valid aftermath before finale, twist is skipped entirely.
- **Returnee is immediately voted out the same episode**: normal — aftermath still runs tribal council. The returnee can be targeted.
- **Returnee has existing advantages**: advantages found before elimination are gone (consumed or expired). Clean slate.
- **Multiple return twists in same season**: allowed. Fan vote and Aftermayhem can fire on different aftermath episodes. A season could have 2 returnees via different mechanisms.
- **RI active**: RI players excluded from the eligible pool. They have their own return path.
- **Showmance partner in active players**: generates a showmance moment event during the board game. If returnee has active showmance, it resumes.
- **Jury member returning**: jury members CAN be in the eliminated pool and CAN win Aftermayhem. On return, they're removed from `gs.jury`.
- **Two players reach square 15 same round**: first in turn order wins. The game stops immediately on the first finish.
- **Player KO'd on booby trap before challenge**: eliminated immediately, skip the challenge. Dramatic "didn't even get to compete" moment.
- **No past challenges to reference**: if the season has no episode history yet (shouldn't happen — aftermath fires mid-season), use generic challenge flavors without callbacks.
