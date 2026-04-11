# Romance System Overhaul Design

**Date:** 2026-04-11
**Type:** Enhancement to existing romance + challenge systems

---

## Overview

Five changes to the romance system:
1. **Slow burn sparks** — replace instant showmance creation with a multi-episode spark→first move→showmance pipeline
2. **First Move events** — archetype-flavored kiss/confession moments that define the showmance start
3. **Challenge moments for active showmances** — protective instinct, jealousy, sacrifice, PDA, distraction
4. **Showmance sabotage** — villain weaponizes romance to destroy a couple (the Heather move)
5. **Romance toggle + asexual orientation** — season config to disable romance; new sexuality option

## 1. Slow Burn Spark System

### New State: `gs.romanticSparks[]`

```javascript
{
  players: [a, b],
  sparkEp: number,      // episode the spark fired
  context: string,       // "stargazing", "canoe ride", etc.
  intensity: number,     // starts at 0.3, grows each episode
  fake: boolean,         // true if villain sabotage (not a real spark)
  saboteur: string|null  // who engineered the fake spark
}
```

### Spark Creation

`_challengeRomanceSpark` no longer creates a `gs.showmances` entry. Instead:
- Creates a `gs.romanticSparks` entry with intensity 0.3
- Boosts bond +0.5
- +2 popularity each
- VP shows ROMANCE SPARK badge

### Intensity Growth

New function `updateRomanticSparks(ep)` runs each episode (after `checkShowmanceFormation`):
- Positive interaction this episode (same tribe camp event): +0.2
- Challenge moment together: +0.3
- Bond increased this episode: +0.1
- Negative events (argument, votes against each other): -0.2
- Passive growth if bond > threshold: +0.1 per episode

### Spark Death

If bond drops below 2.0 OR intensity goes negative → spark removed. It fizzled.

### Archetype Speed

| Archetype | First Move threshold | Typical episodes |
|---|---|---|
| Showmancer | 0.5 | 1-2 |
| Chaos-agent | 0.6 | 1-2 |
| Villain/schemer | 0.8 | 2-3 |
| Hero | 1.0 | 3-4 |
| Loyal/shy types | 1.2 | 3-5 |
| Default | 0.8 | 2-3 |

Threshold based on the SLOWER archetype of the pair (the shy one sets the pace).

### `checkShowmanceFormation` Integration

When checking formation, if a spark exists for the pair:
- Bond threshold drops by 1.5 (e.g., 6 → 4.5)
- Formation chance boosted proportionally to spark intensity

## 2. First Move Events

### `checkFirstMove(ep)`

Runs each episode after `updateRomanticSparks`. Checks each spark — if intensity >= archetype threshold, fires the First Move event.

### First Move Types

| Archetype | Move | Text flavor |
|---|---|---|
| Showmancer | The Kiss | Direct. Goes for it. The tribe gasps. |
| Chaos-agent | Impulsive Kiss | Worst possible timing. Mid-argument. In front of everyone. |
| Villain/schemer | Strategic Flirt Turns Real | Started as manipulation. Their face says it stopped being fake. |
| Hero | Protective Confession | Saves them, locks eyes. "I couldn't let anything happen to you." |
| Loyal/shy | Awkward Confession | Stammers. Looks at feet. The other person closes the gap. |
| Wildcard | Unexpected Gesture | Something weird that's somehow romantic. |
| Default | Quiet Moment | Alone together. Someone says something real. |

3-4 text templates per type.

### After First Move

- Creates `gs.showmances[]` entry with phase `'spark'`
- Removes the spark from `gs.romanticSparks`
- +0.5 bond, +3 popularity each
- Camp event: FIRST MOVE badge, gold
- Can fire during camp events OR during challenges (whichever comes first)

## 3. Challenge Moments for Active Showmances

### `_checkShowmanceChalMoment(ep, phaseKey, phases, personalScores, triggerType)`

Shared helper called inside challenge functions. Max 1-2 per challenge.

### Moment Pool (6 types)

| Moment | Trigger | Score | Bond | Other |
|---|---|---|---|---|
| Protective Instinct | Danger event + partner nearby | Partner: -0.5 | +0.4 mutual | +1 popularity |
| Jealousy Flare | Partner interacts with attractive player | — | -0.3 showmance pair | Jealousy flag |
| Sacrifice Play | One gives up advantage for other | Sacrificer: -1.0 | +0.5 mutual | +2 popularity, +bigMoves |
| PDA Reaction | Couple is being obvious | — | Tribe reactions by archetype | Mixed |
| Strategic Tension | Help each other vs help tribe | Both: -0.5 if chose each other | +0.3 mutual, -0.2 tribe | Tribe notices |
| Distraction | Too focused on each other | Both: -1.0 | +0.2 mutual | -0.3 from tribemates |

### Which Challenges Get Moments

| Challenge | Showmance moments | Why |
|---|---|---|
| Sucky Outdoors | Full (all 6 types) | Overnight — danger, intimacy, downtime |
| Up the Creek | Full (all 6 types) | Partner selection, portage danger, canoe intimacy |
| Talent Show | Mild (PDA, jealousy only) | Backstage + audience reactions |
| Phobia Factor | Mild (protective only) | Comforting after fear |
| Awake-A-Thon | Already has showmance events | Mid-challenge social system |
| Dodgebrawl | No | Too competitive |
| Cliff Dive | No | Too short |
| Say Uncle | No | Torture. Not romantic. |
| Triple Dog Dare | No | Sudden death. No. |
| Slasher Night | No | Horror. No. |

## 4. Showmance Sabotage (Villain Romance Weapon)

### `checkShowmanceSabotage(ep)`

**Trigger:**
- Saboteur is villain/schemer/mastermind
- Bond <= -2 with one member of an active showmance (the target)
- The showmance partner is accessible (same tribe or post-merge)
- Proportional chance: `(10 - loyalty) * 0.02 + strategic * 0.015`

**Flow:**
1. Saboteur engineers romantic moment with the partner (kiss/flirtation)
2. Target discovers → showmance enters "tested" phase
3. 30% immediate breakup, 70% tested phase (1-2 episodes)

**Consequences:**

| Who | Bond | Heat | Popularity |
|---|---|---|---|
| Target (being hurt) | -2.0 with partner | — | +3 sympathy |
| Partner (kissed) | -1.5 with saboteur, -1.0 with target | +1.0 for 1 ep | -1 |
| Saboteur | -0.5 from witnesses | +1.5 for 2 eps | — |
| People who disliked the target | +0.2 with saboteur | — | — |

**Stored as:** fake spark in `gs.romanticSparks` with `{ fake: true, saboteur }` — never progresses to a real showmance.

**Camp event:** SHOWMANCE SABOTAGE badge, red. Three portraits: saboteur → partner ← target.

## 5. Romance Toggle + Asexual

### Season Config Toggle

`seasonConfig.romance = 'enabled' | 'disabled'` (default: `'enabled'`)

**Guard added to:**
- `checkShowmanceFormation(ep)`
- `updateShowmancePhases(ep)`
- `checkLoveTriangleFormation(ep)`
- `updateLoveTrianglePhases(ep)`
- `updateAffairExposure(ep)`
- `_challengeRomanceSpark(a, b, ...)`
- `checkFirstMove(ep)` (new)
- `checkShowmanceSabotage(ep)` (new)
- `updateRomanticSparks(ep)` (new)
- `_checkShowmanceChalMoment(...)` (new)

**When disabled:**
- Bonding events still fire with platonic text (friendship versions)
- Bond boosts stay
- No sparks, no showmances, no first moves, no triangles, no affairs, no sabotage
- Existing showmances freeze

### Asexual Orientation

Add `'asexual'` to sexuality options. In `romanticCompat`:
```javascript
if (sex === 'asexual') return false;
```

Cast builder sexuality dropdown gets new option. Asexual players get all bonding events but zero romantic triggers.

## Data Changes

- New: `gs.romanticSparks[]`
- Modified: `_challengeRomanceSpark` → creates spark, not showmance
- New functions: `updateRomanticSparks(ep)`, `checkFirstMove(ep)`, `checkShowmanceSabotage(ep)`, `_checkShowmanceChalMoment(...)`
- Modified: `checkShowmanceFormation` → checks sparks for threshold reduction
- New config: `seasonConfig.romance`
- New sexuality: `'asexual'`

## VP / Camp Events

- ROMANCE SPARK badge (gold) — when spark fires
- FIRST MOVE badge (gold) — when first move happens, archetype-flavored text
- SHOWMANCE SABOTAGE badge (red) — villain weapon, three-portrait card
- Challenge showmance moments use existing badge system per challenge
- Romance toggle in season config UI (dropdown: enabled/disabled)
