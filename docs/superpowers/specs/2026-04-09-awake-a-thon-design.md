# Awake-A-Thon Challenge

## Overview

Schedulable pre-merge tribe challenge (`awake-a-thon` in TWIST_CATALOG, category `challenge`). Three phases: 20km run, feast trap, endurance sleep-off. Last team with someone awake wins immunity. Mid-challenge social events fire between dropouts.

Inspired by Total Drama Island "The Big Sleep" — the Awake-A-Thon.

## Phase 1 — The Run

Each player rolls to finish the 20km run:

```
finishChance = physical * 0.06 + endurance * 0.05 + 0.20
```

Examples:
- Physical 8, endurance 8: 0.48 + 0.40 + 0.20 = 1.08 → capped ~95%, almost certain
- Physical 5, endurance 5: 0.30 + 0.25 + 0.20 = 0.75 → 75%, likely
- Physical 2, endurance 2: 0.12 + 0.10 + 0.20 = 0.42 → 42%, coin flip
- Physical 2, endurance 2: weakest players struggle to finish

- Players who finish: advance to the feast
- Players who don't finish: skip the feast, join the awake-a-thon without food coma debuff

## Phase 2 — The Feast

All players who finished the run eat the feast. This is the trap — eating makes Phase 3 harder.

- Ran + ate feast: `-0.15` stay-awake penalty (food coma)
- Didn't finish run: `+0.00` no penalty, no feast

No player choice here — if you finished the run, you eat. The trap is that the "reward" for running well is actually a handicap.

## Phase 3 — The Awake-A-Thon

Sequential dropout rounds. Each round, every awake player rolls:

```
stayAwakeChance = endurance * 0.07 + mental * 0.04 + physical * 0.02 + 0.10 + feastDebuff
```

Where `feastDebuff = -0.15` for feast eaters, `0.0` for non-eaters.

Examples (feast eater):
- Endurance 8, mental 8, physical 6: 0.56 + 0.32 + 0.12 + 0.10 - 0.15 = 0.95 → very resilient
- Endurance 5, mental 5, physical 5: 0.35 + 0.20 + 0.10 + 0.10 - 0.15 = 0.60 → moderate
- Endurance 2, mental 2, physical 2: 0.14 + 0.08 + 0.04 + 0.10 - 0.15 = 0.21 → drops fast

Each round, the lowest-rolling awake player falls asleep. If multiple players fail their roll, the lowest roll drops first. Rounds continue until one tribe has zero awake players — the other tribe wins.

If exactly tied (both tribes lose their last player in the same round), the player who rolled higher stays awake — their tribe wins.

## Mid-Challenge Social Events

Between dropout rounds, 1-2 social events can fire among awake players. Max 1-2 per round. Events dedup (same pair can't bond twice, same player can't scheme twice).

### Bonding (~40% per round)
Two awake players with bond >= 1.0 talk to stay awake. Bond +0.3.
- Badge: `STAYING AWAKE TOGETHER` / gold
- Camp event with players array

### Alliance Pitch (~15% per round)
Strategic player (strategic >= 6) pitches an alliance to another awake player. Same genuine/bond check as social politics side deals.
- Badge: `LATE NIGHT DEAL` / blue
- Creates actual `gs.namedAlliances` entry or `gs.sideDeals` entry (using existing formation logic)

### Showmance Spark (~10% per round)
Two compatible awake players connect romantically. Uses existing `romanticCompat`. Only fires if showmance cap not reached.
- Badge: `SLEEPLESS ROMANCE` / pink
- Triggers showmance formation via existing system

### Cheating (~8% per round)
Bold + low-loyalty player attempts to fake staying awake.
- Trigger: `boldness * 0.04 + (10 - loyalty) * 0.03`
- Detection: each awake player rolls `intuition * 0.05`. Any success = caught.
- **Caught**: disqualified (falls asleep immediately). Bond -0.5 from all teammates. +1.0 heat.
  - Badge: `CAUGHT CHEATING` / red
- **Uncaught**: survives one extra round (skips next dropout check). No badge (hidden).

### Scheming (~10% per round)
Villain/schemer awake player sabotages a sleeping opponent from the OTHER tribe.
- Adds +0.8 heat to target via `gs._awakeAThonBlame`
- Bond -0.3 if witnessed by an awake teammate of the target
- Badge: `SABOTAGE` / red-orange

## Phase Markers (VP display)

Based on dropout percentage, not actual time:
- First 30% of dropouts: **12 HOURS** phase
- Next 40% of dropouts: **24 HOURS — FAIRY TALES** (host reads fairy tales to lull players to sleep)
- Final 30% of dropouts: **85 HOURS — HISTORY OF CANADA** (host reads the most boring book ever)

Phase markers appear as visual dividers in the VP timeline.

## Winner Determination

- Last tribe with at least one awake player wins immunity
- Losing tribe (first tribe to have all members asleep) goes to tribal
- With 3 tribes: last tribe with someone awake wins, first tribe to lose all members = losing tribe, middle tribe is safe

## Challenge Record

`ep.chalMemberScores` set for all players:
- Score = round number they fell asleep (higher = lasted longer)
- Players who never fell asleep (on winning tribe) get `totalRounds + 1` score
- Cheaters caught get score `0` (worst possible)
- Feeds into `updateChalRecord` — pre-merge top 3 podium, bottom 3 bomb

## Consequences

### First to fall asleep on losing tribe
- Blame camp event, +1.0 heat via `gs._awakeAThonBlame` (cleared after tribal, same pattern as phobia/cliff dive blame)

### Last awake (winner)
- `IRON WILL` camp event (gold badge), +0.4 bond from all teammates

### Cheater caught
- `CAUGHT CHEATING` camp event, -0.5 bond from teammates, +1.0 heat

### Social events
- Bonding, alliance, showmance, scheming — each has own consequences as described in social events section

## VP Screen

`rpBuildAwakeAThon(ep)` — single timeline with click-to-reveal:

### Layout
1. **Challenge description card**: run, feast, the real challenge reveal
2. **Phase 1 results**: who finished the run / who didn't (grid with FINISHED / DNF badges)
3. **Phase 2 feast card**: flavor text — "The real challenge hasn't started yet."
4. **Sequential timeline** with click-to-reveal (sticky NEXT / REVEAL ALL):
   - **Phase markers**: "12 HOURS", "24 HOURS — FAIRY TALES", "85 HOURS — HISTORY OF CANADA" appear as gold divider cards at the thresholds
   - **Dropout cards**: portrait + "falls asleep" + tribe color + round number
   - **Social event cards**: badge + description + player portraits
   - Interleaved chronologically
5. **Winner announcement**: last player standing + tribe immunity card
6. **Sticky NEXT / REVEAL ALL buttons** at bottom (same pattern as cliff dive)

### Click-to-reveal pattern
Uses `_tvState['aat_reveal_' + ep.num]`. Steps include both dropouts and social events in chronological order.

## Camp Events

Push to `ep.campEvents[tribeName].post`:

| Type | Badge | Badge Class | Description |
|------|-------|-------------|-------------|
| `awakeAThonBond` | STAYING AWAKE TOGETHER | gold | Two players bonded during the challenge |
| `awakeAThonDeal` | LATE NIGHT DEAL | blue | Alliance/deal formed during the challenge |
| `awakeAThonRomance` | SLEEPLESS ROMANCE | pink | Showmance spark during the challenge |
| `awakeAThonCheat` | CAUGHT CHEATING | red | Player caught faking, disqualified |
| `awakeAThonScheme` | SABOTAGE | red-orange | Awake player sabotaged sleeping opponent |
| `awakeAThonIronWill` | IRON WILL | gold | Last player standing on winning tribe |
| `awakeAThonFirstOut` | FIRST OUT | red | First player to fall asleep on losing tribe |

All events have `players[]` array + explicit `badgeText`/`badgeClass`.

## Episode History

```javascript
ep.awakeAThon = {
  runResults: [{ name, finished: true/false }],
  feastEaters: [...],
  rounds: [{
    round: N,
    dropout: { name, tribe, roll },
    socialEvents: [{ type, players: [...], text, badge }],
  }],
  phaseMarkers: { fairyTales: roundN, historyOfCanada: roundN },
  winner: 'TribeName',
  lastAwake: 'PlayerName',
  lastAwakeIsUnderdog: true/false,
  cheaters: [{ name, caught: true/false, caughtBy: 'Name' | null }],
  firstOut: { name, tribe },
};
```

## Text Backlog

`_textAwakeAThon(ep, ln, sec)` wired into `generateSummaryText`:

```
=== AWAKE-A-THON ===
Phase 1 — The Run:
  FINISHED: Player1, Player2, ...
  DNF: Player8, Player9
Phase 2 — The Feast (the trap):
  Feast eaters: Player1, Player2, ... (-0.15 stay-awake penalty)
Phase 3 — The Awake-A-Thon:
  [12 HOURS]
  Round 1: PlayerX falls asleep (TribeName)
    [STAYING AWAKE TOGETHER] Player1 and Player2 bond (+0.3)
  Round 2: PlayerY falls asleep (TribeName)
  ...
  [24 HOURS — FAIRY TALES]
  Round 5: PlayerZ falls asleep (TribeName)
    [LATE NIGHT DEAL] Player3 pitches alliance to Player4
  ...
  [85 HOURS — HISTORY OF CANADA]
  Round 10: PlayerW falls asleep (TribeName)
RESULT: TribeName wins immunity. Last awake: PlayerName (IRON WILL)
First out: PlayerName (TribeName)
```

## Cold Open Recap

In `rpBuildColdOpen`, after cliff dive recap: show last awake player + who fell asleep first on losing tribe.

## TWIST_CATALOG Entry

```javascript
{ id: 'awake-a-thon', emoji: '😴', name: 'Awake-A-Thon', category: 'challenge', phase: 'pre-merge',
  desc: 'Three-phase endurance: 20km run, feast trap, then stay awake. Last team standing wins. Mid-challenge social events fire between dropouts.',
  engineType: 'awake-a-thon' }
```

## Scope

### Included
- `simulateAwakeAThon(ep)` engine function
- 3 phases: run, feast trap, endurance dropout
- 5 mid-challenge social event types (bonding, alliance, showmance, cheating, scheming)
- VP timeline screen with click-to-reveal + phase markers
- Camp events (7 types) with badges
- Episode history + text backlog
- Cold open recap
- Challenge record via `ep.chalMemberScores` → `updateChalRecord`
- `gs._awakeAThonBlame` temporary heat (same pattern as cliff dive/phobia)
- TWIST_CATALOG entry

### Not Included
- Mole interaction (YAGNI)
- Survival/food effects from the feast (YAGNI)
- Post-merge individual version (pre-merge only)
- Per-player custom reactions (generic stat-driven)
