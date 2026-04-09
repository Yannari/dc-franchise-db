# Cliff Dive Challenge

## Overview

Schedulable pre-merge tribe challenge (`cliff-dive` in TWIST_CATALOG, category `challenge`). Three phases: jump willingness check, crate haul, hot tub build. Team with best combined score wins immunity. Replaces normal immunity challenge for that episode.

Inspired by Total Drama Island "Not So Happy Campers Part 2" — the iconic cliff diving challenge.

## Phase 1 — The Jump

Each player rolls against their willingness score:

```
jumpChance = boldness * 0.06 + physical * 0.02 + loyalty * 0.03 + 0.10
```

Examples:
- Boldness 8, physical 6, loyalty 8: 94% — very likely but not guaranteed
- Boldness 5, physical 5, loyalty 5: 65% — decent chance
- Boldness 3, physical 4, loyalty 4: 48% — real coin flip
- Boldness 2, physical 2, loyalty 2: 32% — probably chickens out

- Players who jump: contribute 1 point to tribe jump count
- Players who chicken out: get chicken hat, contribute nothing

### Standout (one per tribe)

The first player to volunteer to jump. Selection:

- Score each jumper: `boldness * 0.07 + 0.3 + Math.random() * 0.2`
- Highest score volunteers first
- ~15% chance the lowest-boldness jumper gets the volunteer slot instead (underdog courage moment — the "Owen" moment)
- Standout gets positive camp event + bond boost

### Jump Order VP

Rendered sequentially in VP (click-to-reveal, same pattern as Phobia Factor). Each player shown with portrait + JUMPED or CHICKENED OUT + reaction text.

## Phase 2 — Haul Crates

Team score:
```
haulScore = (avgPhysical * 0.5 + avgEndurance * 0.5) * wagonMult * manpowerMult
```

- **Wagon advantage**: team with most jumpers gets `wagonMult = 1.3`. Others get `1.0`. If tied on jumpers, all teams haul without wagons (`1.0`).
- **Manpower penalty**: `manpowerMult = jumpersCount / totalMembers` — chickens reduce your workforce. A team where 8/9 jumped gets 0.89x. A team where 5/9 jumped gets 0.56x.

## Phase 3 — Build Hot Tub

Team score:
```
buildScore = (avgMental * 0.5 + avgSocial * 0.5) * manpowerMult
```

- Same manpower penalty as Phase 2: `jumpersCount / totalMembers`
- No additional advantage from Phase 2 — each phase is independent except for the manpower penalty

## Winner Determination

```
totalScore = haulScore + buildScore
```

- Winner: tribe with highest total score
- Tiebreaker: tribe with more jumpers in Phase 1
- Second tiebreaker: random

## Consequences

### Chickens on Losing Tribe
- **Blame heat**: `+1.0` temporary heat via `gs._cliffDiveBlame` (cleared after tribal, same pattern as `gs._phobiaBlame`)
- **Bond damage**: `-0.3` from each teammate who jumped
- **Camp event**: type `cliffDiveChicken`, badge `CHICKEN`, red
- **Challenge record**: +0.5 bomb at half weight

### Chickens on Winning Tribe
- **Camp event**: type `cliffDiveChicken`, badge `CHICKEN`, muted (mild shame)
- **Bond damage**: `-0.15` from teammates (noticed but didn't cost anything)
- No blame heat — team won

### Standouts
- **Camp event**: type `cliffDiveStandout`, badge `STANDOUT`, gold
- **Bond boost**: `+0.3` from all teammates
- **Challenge record**: +0.5 podium at half weight

## Reaction Text Pools

Not archetype-specific — stat-driven flavor based on boldness level of the player.

### Jumped Reactions (4-5 options per boldness tier)

**High boldness (>= 7) — barely hesitated:**
- `"${name} doesn't even pause. ${pr.Sub} ${pr.sub==='they'?'walk':'walks'} to the edge and jumps."`
- `"${name} takes one look down and grins. ${pr.Sub} ${pr.sub==='they'?'are':'is'} already in the air."`
- `"No hesitation from ${name}. Off the cliff like it's nothing."`
- `"${name} cracks ${pr.posAdj} neck, backs up for a running start, and launches."`

**Mid boldness (4-6) — nervous but did it:**
- `"${name} takes a deep breath. Closes ${pr.posAdj} eyes. Jumps."`
- `"${name} looks down, looks at ${pr.posAdj} team, looks down again. Then jumps."`
- `"It takes ${name} a moment. But ${pr.sub} ${pr.sub==='they'?'do':'does'} it."`
- `"${name} whispers something to ${pr.ref}, backs up, and goes for it."`

**Low boldness (<= 3) — terrified but jumped anyway:**
- `"${name} is visibly shaking. But ${pr.sub} ${pr.sub==='they'?'jump':'jumps'} anyway. The scream echoes off the cliff."`
- `"Nobody expected ${name} to jump. ${name} didn't expect it either. But there ${pr.sub} ${pr.sub==='they'?'go':'goes'}."`
- `"${name} closes ${pr.posAdj} eyes, plugs ${pr.posAdj} nose, and falls forward. It counts."`
- `"${name}'s legs are shaking so hard the cliff might crumble. ${pr.Sub} ${pr.sub==='they'?'jump':'jumps'} before ${pr.sub} can change ${pr.posAdj} mind."`

### Chicken Reactions (4-5 options)
- `"${name} looks over the edge, shakes ${pr.posAdj} head, and steps back. Not happening."`
- `"${name} crosses ${pr.posAdj} arms. 'I'm not doing this.' The chicken hat goes on."`
- `"${name} peers down at the water. At the sharks. Back at the water. 'No.' Chicken hat."`
- `"${name} starts walking toward the edge, stops, and walks back. 'Sorry.' Chicken hat."`
- `"${name} sits down on the cliff. ${pr.Sub} ${pr.sub==='they'?'aren\'t':'isn\'t'} going anywhere."`

## VP Screen

`rpBuildCliffDive(ep)` — registered in `buildVPScreens()` when cliff-dive twist is active.

### Layout
1. **Challenge description card**: cliff, sharks, safe zone description. TDI-style dramatic intro.
2. **Per-tribe section** with sequential click-to-reveal (NEXT / REVEAL ALL):
   - Each player: portrait + `JUMPED` (green) or `CHICKENED OUT` (red) badge + reaction text
   - Standout highlighted with gold border and `FIRST TO JUMP` label
3. **Jump tally card**: per-tribe count, wagon advantage announced
4. **Phase 2 result card**: haul scores, wagon multiplier shown
5. **Phase 3 result card**: build scores
6. **Winner announcement card**: winning tribe name, combined scores
7. **Chicken hat gallery**: portraits of all chickens with chicken hat overlay/badge

### Click-to-reveal Pattern
Uses `_tvState['cliff_dive_' + ep.num]` pattern. Global reveal functions: `cdRevealNext(uid)`, `cdRevealAll(uid)`.

## Camp Events

Push to `ep.campEvents[tribeName].post`:

### `cliffDiveChicken`
```javascript
{
  type: 'cliffDiveChicken',
  players: [chickenName, ...jumpedTeammates],
  text: `${chickenName} is wearing the chicken hat. ${teammates} jumped. ${pr.Sub} didn't.`,
  consequences: `Bond -0.3 from teammates. ${isLosingTribe ? 'Heat +1.0.' : ''}`,
  badgeText: 'CHICKEN', badgeClass: 'red'
}
```

### `cliffDiveStandout`
```javascript
{
  type: 'cliffDiveStandout',
  players: [standoutName],
  text: standoutIsUnderdog
    ? `Nobody expected ${standoutName} to go first. ${pr.Sub} surprised everyone — including ${pr.ref}.`
    : `${standoutName} stepped up when nobody else would. First off the cliff. The team needed that.`,
  consequences: `Bond +0.3 from teammates.`,
  badgeText: 'FIRST TO JUMP', badgeClass: 'gold'
}
```

## Badge Registration

In `rpBuildCampTribe` badge block:

| Type | Badge Text | Badge Class |
|------|-----------|-------------|
| `cliffDiveChicken` | CHICKEN | red |
| `cliffDiveStandout` | FIRST TO JUMP | gold |

## Episode History

Stored on twist object:
```javascript
twistObj.cliffDive = {
  tribes: [{
    name: 'TribeName',
    members: [...],
    jumpers: [...],
    chickens: [...],
    standout: 'PlayerName',
    standoutIsUnderdog: true/false,
    jumpCount: N,
    haulScore: N,
    buildScore: N,
    totalScore: N,
  }],
  wagonWinner: 'TribeName',  // tribe name or null if tied
  winner: 'TribeName',
  reactions: [{ name, jumped: true/false, text: '...' }],
};
```

## Text Backlog

`_textCliffDive(ep, ln, sec)` wired into `generateSummaryText`:

```
=== CLIFF DIVE ===
Phase 1 — The Jump:
  TribeName (7/9 jumped):
    JUMPED: Player1, Player2, ...
    CHICKENED OUT: Player8, Player9
    First to jump: Player3 (standout)
  ...
Phase 2 — Haul Crates:
  TribeName: 6.4 (wagons)
  TribeName2: 4.2
Phase 3 — Build Hot Tub:
  TribeName: 5.8
  TribeName2: 4.0
RESULT: TribeName wins immunity (total: 12.2 vs 8.2)
```

## TWIST_CATALOG Entry

```javascript
{ id: 'cliff-dive', emoji: '🏔️', name: 'Cliff Dive', category: 'challenge', phase: 'pre-merge',
  desc: 'Three-phase tribe challenge: cliff jump (willingness), crate haul (physical), hot tub build (mental). Chickens get blame + heat on losing tribe.',
  engineType: 'cliff-dive' }
```

## Scope

### Included
- `simulateCliffDive(ep)` engine function
- Jump willingness formula (boldness + physical + loyalty)
- Three-phase scoring (jump → haul → build)
- Chicken blame heat system (`gs._cliffDiveBlame`)
- Standout per tribe (with underdog chance)
- Reaction text pools (stat-driven, not archetype-specific)
- VP screen with click-to-reveal per-tribe jumps
- Camp events (chicken + standout) with badges
- Episode history + text backlog
- TWIST_CATALOG entry

### Not Included
- Mole interaction (YAGNI)
- Reward/food effects (immunity only)
- Post-merge version (pre-merge only)
- Per-player custom reactions in roster (generic stat-driven is enough)
