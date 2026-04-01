# Survival Mechanics — Design Spec

## Overview

Food & water survival system. Per-tribe food reserves decay each episode. Players contribute as providers or drag as slackers. Low survival creates challenge stat penalties, emotional pressure, camp conflict, and at high difficulty, medevac risk via a two-episode collapse → medevac arc. Reward challenges become mechanically meaningful.

Requires `seasonConfig.foodWater === 'enabled'`. Difficulty set by `seasonConfig.survivalDifficulty` (casual/realistic/brutal).

## Core State

### Per-player
`gs.survival[name]` — 0 to 100, starts at 80. Trends toward tribe food level each episode.

### Per-tribe
`gs.tribeFood[tribeName]` — 0 to 100, starts at 60. Shared resource pool. After merge, single pool under merge tribe name.

### Difficulty Decay (tribe food per episode)
- **Casual**: -3 to -5 (survival is flavor, rarely dangerous)
- **Realistic**: -6 to -10 (food matters, rewards are important)
- **Brutal**: -10 to -16 (harsh, Koh-Lanta style, medevacs possible)

Decay formula: `-(baseDecay + Math.random() * variance)` where baseDecay/variance scale with difficulty.

### Player Survival Sync
Each episode, player survival trends toward their tribe's food level:
```
shift = (tribeFood - playerSurvival) * 0.3 + endurance * 0.2
playerSurvival = clamp(playerSurvival + shift, 0, 100)
```
High endurance players resist decline. Low endurance players deteriorate faster.

## Provider / Slacker System

Each player contributes to the tribe food pool each episode. Contribution is driven by **willingness** (personality) + **ability** (physical stats):

```
willingness = loyalty * 0.3 + social * 0.3 + (10 - boldness) * 0.1
ability = endurance * 0.3 + physical * 0.2
contribution = (willingness + ability) * 0.5 + (Math.random() * 1.5 - 0.75)
```

**Why these stats:**
- **High loyalty + high social** = cares about the tribe, puts in effort
- **Low loyalty + low social** = doesn't care, won't help ("not my problem")
- **High boldness** = "I'm saving my energy for the game, not for camp"
- **High endurance + high physical** = CAN deliver when they try
- A player with low loyalty/social but high physical CAN help but CHOOSES not to — that's a personality-driven slacker, not a random roll

Calculate tribe average contribution. Players above avg = **provider**, below = **slacker**.

### Provider Effects
- Tribe food: `+(contribution - avg) * 0.5` bonus to pool
- **Energy cost:** providers lose survival from the work: `survivalCost = contribution * 0.3` per episode. A top provider (contribution ~7) burns ~2.1 survival/ep. Over 10 episodes = -21 survival. Providing is physically taxing.
- Bond: +0.15 with each tribemate per episode (proportional, `(contribution - avg) * 0.03`)
- Heat: -0.3 in `computeHeat` (tribe needs them, non-villains protect)
- Jury: `+endurance * 0.04` camp workhorse bonus in jury scoring, cap 0.4
- Camp events: praised, thanked, relied upon

### Slacker Effects
- Tribe food: `-(avg - contribution) * 0.3` drag on pool
- **Energy conservation:** slackers gain survival from resting: `survivalBonus = (avg - contribution) * 0.2` per episode. A lazy player gains ~1.0 survival/ep. Keeps them healthier for challenges.
- Bond: -0.1 with each non-slacker tribemate per episode (resentment builds)
- Heat: +0.2 in `computeHeat` from non-slackers only (other slackers don't resent slackers)
- Camp events: called out, confronted, resented

### The Provider/Slacker Trade-Off
This creates a genuine strategic dilemma:
- **Providers** are loved, build jury resume, feed the tribe — but burn out physically. Late-game providers may be weaker in challenges because they've been working themselves ragged.
- **Slackers** are resented, targeted socially — but conserve energy. A slacker might be the STRONGEST challenge performer late in the season because they rested while providers burned out.
- A slacker who keeps winning immunity is the ultimate frustration: the tribe hates them but can't vote them out. Classic Survivor tension.

### Slacker Targeting
Slackers are targeted through **social pressure, not challenge weakness:**
- Bond decay with non-slackers (-0.1/ep) accumulates → negative bonds → `pickTarget` uses `(-avgBond) * 0.35` (pre-merge) / `(-avgBond) * 0.4` (post-merge) → targeted through bad relationships
- Slacker camp events (called out, confrontation) damage bonds further, accelerating the targeting
- But their conserved energy means better challenge stats, which can counteract weak-link pressure
- A slacker CAN save themselves by winning immunity — which makes the tribe even more frustrated

### Slacker Bonding
Two slackers at the same camp: +0.2 bond per episode via `'slackerBonding'` camp event. Max one event per episode between the two worst slackers. Creates a natural "lazy alliance" dynamic.

### Targeting Providers
- **Villain** archetype: +0.5 heat toward providers ("remove the threat the tribe depends on")
- **Schemer** archetype: +0.3 heat toward providers ("chaos when the food stops")
- **Strategist**: no bonus (values the provider's contribution)
- Voting out a provider triggers `'providerVotedOut'` camp event next episode: tribe food -15, morale drop

### Vote Reasoning for Provider/Slacker
Provider targeted by villain: "the tribe worships [name] — that's power I need to break" / "[name] has everyone fooled into thinking [sub] [sub==='they'?'are':'is'] indispensable. Nobody is."
Provider targeted by schemer: "everyone depends on [name] for food. Take [obj] out and watch the camp fall apart. That's an opening."
Slacker targeted (via bad bonds): "[name] sits around all day while the rest of us work. I'm done carrying dead weight." / "[name] hasn't lifted a finger since day one. At some point you have to earn your spot."

## Effects of Low Survival

Low survival does NOT directly increase heat — the challenge system handles that naturally:
```
low survival → stat penalties → worse challenge performance → weak link → heat
```

| Player Survival | Effect |
|-----------------|--------|
| < 70 | Mild challenge penalty: all stat rolls -0.5 |
| < 50 | Moderate: -1.0 stats, emotional push toward desperate/paranoid |
| < 35 | Severe: -1.5 stats, food conflict camp events fire |
| < 20 | Critical: -2.0 stats. Collapse warning event fires (realistic + brutal) |

### Collapse Warning (Two-Episode Arc — Part 1)
**Trigger:** player survival < 25, one-time per player
**Fires on:** realistic and brutal difficulty (never casual)

Camp event: `'survivalCollapse'`, red badge "COLLAPSE"
- Text: player physically breaks down — shaking, dizzy, can't stand up
- Tribe reacts: empathetic players bond (+0.5), strategic players recalculate
- `gs.collapseWarning[name] = epNum` — tracks for medevac check next episode
- 3-4 text variants based on player personality (tough player fights it, social player apologizes, etc.)

### Medevac (Two-Episode Arc — Part 2)
**Trigger:** player survival < 15, AND `gs.collapseWarning[name]` was set previous episode
**Roll:** Brutal: 12%. Realistic: 5%. Casual: never.

**Pre-merge medevac:**
- Player removed from game completely, does NOT go to jury
- If KL-3 replacement enabled: last voted-out player returns to the game
- Tribe loses a member

**Post-merge medevac:**
- Player goes to jury (they've played enough to have opinions)
- If KL-3 replacement enabled: last voted-out player returns

**Camp event:** `'medevac'`, red badge "MEDEVAC"
- Dramatic medical team scene, player's reaction, tribe impact
- Tribe morale: all tribemate bonds with each other +0.5 (shared trauma)
- `gs.medevacs` array tracks for season stats

**Provider medevac:** If the medevaced player was a provider, also triggers `'providerVotedOut'` food crisis event (tribe food -15).

## What Restores Tribe Food / Player Survival

| Source | Tribe Food | Player Survival |
|--------|-----------|-----------------|
| Reward: Feast | +25 (winning tribe) | +15 (all winners) |
| Reward: Supplies | +15 (winning tribe) | +8 |
| Reward: Overnight | +20 (winning tribe) | +12 |
| Merge feast | +30 (all) | +20 (all) |
| Fishing camp event (provider) | +8 (tribe) | +5 (fisher) |
| Foraging camp event (provider) | +5 (tribe) | +3 (forager) |
| Comfort reward | +10 (winning tribe) | +8 |
| Food rationing event (strategic player) | +3 (tribe) | — |

## Camp Events (Survival-Specific)

All fire based on tribe food level and provider/slacker dynamics. All have gameplay consequences.

### Provider Events
- `'providerFishing'` — provider catches food. Tribe food +8, provider bond +0.5 with tribe. Gold badge "PROVIDER". Trigger: provider at camp, tribe food < 70.
- `'providerPraised'` — tribe acknowledges provider. Bond +0.3 with all tribemates. Gold badge "PRAISED". Trigger: provider at camp, tribe food < 60, ~30% per episode.
- `'providerForaging'` — provider finds fruit/coconuts. Tribe food +5, +0.3 bond. Gold badge "FORAGING". Trigger: provider at camp, ~25% per episode.

### Slacker Events
- `'slackerCalledOut'` — someone confronts a slacker about not contributing. Bond -1.0 between them. Red badge "CALLED OUT". Trigger: slacker at camp, tribe food < 50, caller has boldness >= 5 or temperament <= 5.
- `'slackerConfrontation'` — escalated confrontation. Bond -1.5, tribe tension. Red badge "CONFRONTATION". Trigger: slacker already called out, caller boldness >= 7 OR temperament <= 3.
- `'slackerBonding'` — two slackers bond over shared laziness. Bond +0.2 between them. Green badge "LAZY ALLIANCE". Trigger: 2+ slackers at same camp.

### Food Crisis Events
- `'foodConflict'` — two hungry players fight over rations. Bond -1.5 between both. Red badge "FOOD FIGHT". Trigger: tribe food < 40, two players with bond < 0.
- `'foodHoarding'` — player caught stashing food. Bond -2.0 with discoverer, -1.0 with tribe. Red badge "HOARDING". Trigger: tribe food < 50, hoarder loyalty <= 4, discoverer intuition >= 6.
- `'starvationBond'` — two players bond over shared suffering. Bond +1.0. Green badge "SHARED SUFFERING". Trigger: tribe food < 35, two players with bond >= 1.
- `'foodRationing'` — strategic player manages food distribution. Bond +0.5 with tribe, tribe food +3. Gold badge "RATIONING". Trigger: tribe food < 50, player strategic >= 7.
- `'foodCrisis'` — tribe food < 20: desperation narrative, everyone suffers. Red badge "FOOD CRISIS". All tribemates emotional push toward desperate.
- `'providerVotedOut'` — aftermath of losing a provider. Tribe food -15, morale drop. Red badge "FOOD CRISIS". Fires the episode after a provider is eliminated.

### Medical Events
- `'survivalCollapse'` — player physically breaks down. Red badge "COLLAPSE". Warning for medevac.
- `'medevac'` — player medically evacuated. Red badge "MEDEVAC". Dramatic scene.

## VP Display — Tribe Status Bar

Shown on **camp screens only** (pre-challenge and post-TC). A horizontal bar per tribe showing current food level.

| Tribe Food | Label | Color |
|-----------|-------|-------|
| 80-100 | Well-Fed | Green `#3fb950` |
| 60-79 | Comfortable | Blue `#58a6ff` |
| 40-59 | Hungry | Yellow `#e3b341` |
| 20-39 | Starving | Orange `#f0883e` |
| 0-19 | Critical | Red `#da3633` |

Bar updates between pre and post camp screens to reflect events (fishing, hoarding, rewards, decay).

### Individual Player Survival — Hover Tooltip

On camp screens, hovering over a player portrait shows their individual survival level:
```
[Portrait]
Alex — Survival: 42 (Hungry)
```
Same color scheme as tribe food. No clutter — only visible on hover. No other screen shows individual survival.

## Jury Scoring Integration

In `simulateJuryVote` and `projectJuryVotes`, add provider bonus:
```js
const _providerBonus = gs.providerHistory?.[f] ? Math.min(0.4, (gs.providerHistory[f] || 0) * 0.04) : 0;
```
`gs.providerHistory[name]` counts how many episodes this player was a provider. 5 episodes = +0.2, 10 = +0.4. Cap 0.4. Added to `personal`.

## computeHeat Integration

```js
// Provider protection: non-villains/non-schemers protect providers
if (gs.currentProviders?.includes(name)) {
  // Villains see providers as threats to remove
  if (voterArch === 'villain') heat += 0.5;
  else if (voterArch === 'schemer') heat += 0.3;
  else heat -= 0.3;
}
// Slacker: non-slackers resent freeloaders
if (gs.currentSlackers?.includes(name) && !gs.currentSlackers?.includes(voter)) {
  heat += 0.2;
}
```

Note: `computeHeat` doesn't have a `voter` parameter — it computes heat for a single player. The provider/slacker heat modifiers need to be applied as averages or based on tribe composition:
- Provider: `heat -= 0.3` (net tribe protection, unless majority villains/schemers)
- Slacker: `heat += 0.2 * (nonSlackerRatio)` where nonSlackerRatio is % of camp that aren't slackers

## State Summary

```js
gs.survival[name]           // 0-100, per-player survival
gs.tribeFood[tribeName]     // 0-100, per-tribe food reserve
gs.currentProviders         // array of provider names this episode
gs.currentSlackers          // array of slacker names this episode
gs.providerHistory[name]    // count of episodes as provider (for jury)
gs.collapseWarning[name]    // episode number of collapse (for medevac)
gs.medevacs                 // array of medevac records for season stats
```

## Episode History

```js
ep.survivalSnapshot = { ...gs.survival };
ep.tribeFoodSnapshot = { ...gs.tribeFood };
ep.survivalEvents = [];
ep.providerSlackerData = { providers: [...gs.currentProviders], slackers: [...gs.currentSlackers] };
```

## Config

Existing UI — no new fields needed:
- `seasonConfig.foodWater` — `'disabled'` | `'enabled'`
- `seasonConfig.survivalDifficulty` — `'casual'` | `'realistic'` | `'brutal'`

## Scope Note

This spec covers the core survival engine + provider/slacker system. Reward challenge integration (making rewards restore food/survival) is a follow-up spec — it depends on this core engine being in place first.
