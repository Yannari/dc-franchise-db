# Paintball Deer Hunter Design

**Date:** 2026-04-11
**Inspired by:** Total Drama Island S1E9 "Paintball Deer Hunter"
**Type:** Schedulable challenge twist (pre-merge, tribe vs tribe)

---

## Overview

Paintball hunt challenge. Each tribe is randomly split into hunters and deer. Hunters track and shoot opposing tribes' deer with paintball guns. Hunt runs until only 1 tribe has unpainted deer remaining. Social drama fires during the hunt — alliance rebellion, obsessive chases, paintball wars between feuding teammates, bear encounters. Personal scoring for podium/bomb tracking.

## TWIST_CATALOG Entry

```
id: 'paintball-hunt'
emoji: '🎯'
name: 'Paintball Deer Hunter'
category: 'challenge'
phase: 'pre-merge'
engineType: 'paintball-hunt'
minTribes: 2
incompatible: [all other challenge twists]
```

## Role Assignment

Random split per tribe: `Math.ceil(members.length / 2)` deer, rest are hunters. If odd number, extra player is deer (more targets = harder for that tribe).

Stored: `ep.paintballHunt.roles[tribeName] = { hunters: [names], deer: [names] }`

## Hunt Mechanics

### Round Flow

Each round, for each hunter:
1. **Search check** — `intuition * 0.06 + random(0, 0.2)`. If < 0.4, hunter finds nothing.
2. **Target found** — weighted random from opposing unpainted deer (lower survival = easier to find)
3. **Rare double find** — `intuition * 0.02` chance of spotting 2 deer (two shot attempts)
4. **Shot attempt** — hunter score vs deer score

Hunter score: `physical * 0.03 + intuition * 0.04 + random(0, 0.2)`
Deer dodge score: `endurance * 0.04 + intuition * 0.03 + boldness * 0.02 + random(0, 0.15)`

If hunter > deer → HIT (deer painted out)
If deer > hunter → MISS (deer escapes)

After all hunters have attempted → round ends. Check: any tribe with 0 unpainted deer? → hunt continues until only 1 tribe has deer left.

### Personal Scoring

**Hunters:**
| Action | Score |
|---|---|
| Hit a deer | +2.0 |
| Miss | -0.5 |
| Found nothing | -0.3 |
| Special event bonus (ambush, sneak attack) | +1.5 on top of hit |
| Negative event (friendly fire, misfire) | -2.0 |
| Alliance standoff (refuses to shoot) | -1.0 |

**Deer:**
| Action | Score |
|---|---|
| Dodge (survived a shot) | +2.0 |
| Per round survived | +1.0 |
| Survived entire hunt (last standing) | +4.0 |
| Painted out | -1.5 |
| Special event bonus (camouflage, rebellion, decoy) | +1.5 |

## Special Events (18 types)

3-5 fire per round, interleaved between matchups.

### Hunt Events

| Event | Trigger | Effect |
|---|---|---|
| Epic chase | Hunter and deer scores within 10% | Drama card, +1.0 both |
| Ambush | strategic * 0.04 per hunter | Guaranteed hit, +1.5 bonus on top |
| Sneak attack | intuition * 0.05 per hunter | Catches deer off guard, +1.5 bonus |
| Camouflage | Deer intuition * 0.04 | Can't be targeted this round, +1.5 deer |
| Rebellion | Deer boldness * 0.03 | Steals hunter's gun, shoots back |
| Decoy | Deer strategic * 0.03 | Lures hunter wrong direction, wasted turn |
| Taunt | Deer boldness * 0.03 + (10-loyalty) * 0.02 | Mocks hunter, -0.5 hunter, +1.0 deer |
| Mud slide | (10-endurance) * 0.02 per deer | Slips, easier target next round |
| Tree climb | physical * 0.03 per deer | Climbs to hide, safe this round but stuck |
| Paintball misfire | (10-mental) * 0.02 per hunter | Gun jams, wasted turn |
| Hunter rivalry | Two hunters targeting same deer, both high boldness | Compete against each other, drama |
| Deer stampede | 3+ deer alive same tribe, social * 0.03 | Run together, harder to hit (-0.2 each dodge bonus) |
| Bear encounter | 5% per deer per round (rare) | Deer mauled — wires into injury system: +heat, -performance |
| Antlers locked | Two deer different tribes, random low chance | Stuck together 1 round, easy targets, comedy + bond |
| Sympathy shot | Hunter shoots already-painted deer | Piling on, bond damage |

### Social Events During Hunt

| Event | Trigger | Effect |
|---|---|---|
| Alliance rebellion | Hunter bond <= -1 with own team deer | Refuses orders, argues, wastes turn. Beth vs Heather. |
| Obsessive chase | Hunter targets same deer twice | Tunnel vision narrative. +1.0 if hit, -1.5 if miss again |
| Deer-to-deer bonding | Two deer hiding together, bond >= 2 | +0.3 bond, +0.5 score. Romance spark check if compatible. |
| Alliance meeting | Villain/schemer + alliance member during hunt | Strategic plotting, bond reinforcement, distraction = wasted turn |
| Hunter protects deer | Hunter showmance with opposing deer | Refuses to shoot, sabotages own team. -1.5 hunter. |
| Cross-tribe encounter | Two deer different tribes, both hiding | Peace or rivalry moment. Bond driven. |
| Deer-to-deer pact | Two deer hiding together, strategic proportional | Side deal formed. "If we survive, we look out for each other." |
| Hunter-to-hunter scheming | Two hunters same area, strategic proportional | Pre-vote targeting. "After this, we target [name]." |
| Cross-role whisper | Hunter finds own team's deer, bond >= 2 | Strategic exchange while no one's watching. +bond. |

### Friendly Fire & Paintball War

**Accidental friendly fire:**
- Trigger: `(10-intuition) * 0.015 + (10-mental) * 0.01`
- Hunter mistakes own deer for enemy
- -2.0 hunter, -0.5 deer, comedy, bond -0.4

**Deliberate friendly fire:**
- Trigger: Bond <= -2 with own deer, `(10-loyalty) * 0.02 + boldness * 0.015`
- Hunter "accidentally" shoots own deer on purpose
- -2.0 hunter, -1.0 deer, alliance breaks, bond -1.0 both, +heat, camp event

**Retaliation:**
- Trigger: Deer who got deliberately shot, boldness proportional
- Deer grabs gun and shoots BACK at own hunter
- Both lose score, bond crashes

**Paintball war escalation:**
1. Hunter deliberately shoots own deer (feud trigger)
2. Deer retaliates (boldness check)
3. Nearby witnesses can join in (`boldness * 0.02`)
4. While feuding, opposing hunters get free shots at the feuding tribe's OTHER deer
5. Massive bond damage, heat on instigator

### Alliance Events

| Event | Trigger | Effect |
|---|---|---|
| Deer-to-deer pact | Two deer hiding, strategic proportional | Side deal → gs.sideDeals |
| Hunter-to-hunter scheming | Two hunters, strategic proportional | Pre-vote targeting, bond boost |
| Cross-role whisper | Hunter + own deer, bond >= 2 | Intel sharing, bond boost |
| Rebellion alliance | Hunter rebels against bossy tribemate | Alliance shift, bond damage with boss |

Max 1-2 alliance events per hunt.

### Showmance Moments (3 touchpoints)

Only fires if romance enabled:
- **Deer-to-deer hiding** — spark check if showmance/spark pair hiding together
- **Antlers locked** — cross-tribe showmance spark if antlers locked pair is compatible
- **Hunter protects deer** — refuses to shoot showmance partner on opposing tribe

## Winner Determination

Hunt ends when only 1 tribe has unpainted deer. That tribe wins immunity.
- **3+ tribes:** First tribe fully painted = loser → tribal. Hunt continues for remaining tribes.
- **2 tribes:** First tribe fully painted = loser.
- **Last deer standing** on winning tribe = MVP. +4.0 score, +2 popularity.
- Tiebreaker (shouldn't happen but): fewer total paint hits on deer.

## Bear Injury Integration

Bear encounter during hunt wires into existing injury system:
- `gs.lingeringInjuries[name] = { ep, duration: 2, type: 'bear-mauled' }`
- +2.0 heat for 2 episodes
- -performance in future challenges
- Camp event: BEAR MAULED badge
- The Cody moment — dramatically injured, wheelchair confessional

## VP Screen

### `rpBuildPaintballHunt(ep)` — click-to-reveal per round, overdrive treatment

**Ambiance:** Deep forest with paintball aesthetic
- Background: `linear-gradient(180deg, #0a1a0a 0%, #0f150a 50%, #0a0f05 100%)`
- Canopy overlay at top (dark green gradient)
- Leaf particles (tiny green dots drifting, CSS animation)

**CSS animations for hits/misses:**
```css
@keyframes paintSplat {
  0% { transform: scale(0); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.8; }
  100% { transform: scale(1); opacity: 0.6; }
}
@keyframes paintDrip {
  0% { height: 0; }
  100% { height: 20px; }
}
@keyframes dodgeSlide {
  0% { transform: translateX(0); opacity: 1; }
  30% { transform: translateX(-20px); opacity: 0.5; }
  100% { transform: translateX(0); opacity: 1; }
}
```

**HIT cards:**
- Paint splatter in the hunter's tribe color (radial gradient burst behind the deer portrait)
- "PAINTED OUT" stamp in tribe color
- Drip effect below the splatter (CSS animated)
- Deer portrait fades to greyscale

**MISS cards:**
- Deer portrait slides sideways (dodgeSlide animation)
- "DODGED" in green
- Paintball whoosh line (thin tribe-color streak that misses)

**NOT FOUND cards:**
- Hunter portrait with question marks
- Faded forest background
- "Found nothing..." text

**Special event cards:**
- Bear encounter: red danger glow, bear emoji, dramatic
- Antlers locked: comedy gold border, tangled emoji
- Paintball war: rapid-fire splatter effects, multiple portraits, chaos
- Rebellion: deer holding gun backwards, role reversal glow

**Paint counter per tribe:**
- Row of deer portraits, painted ones get tribe-color splatter overlay + greyscale
- Unpainted = full color + "STILL RUNNING" pulse animation
- When a tribe is fully painted: "ELIMINATED" banner in red

**Round headers:**
- "ROUND 1 — THE HUNT BEGINS" / "ROUND 2 — THEY'RE GETTING CLOSER" / "ROUND 3 — DOWN TO THE WIRE"
- Dynamic round names based on how many deer are left

**Final result:**
- Last deer standing gets a spotlight MVP card
- Winner tribe celebration
- Loser tribe = fully painted, all portraits splattered

## Camp Events (2 positive + 1-2 negative per tribe)

**Positive:**
- MVP Hunter (most hits)
- Last Deer Standing (survived entire hunt)
- Rebellion Hero (stood up to bossy tribemate during hunt)

**Negative:**
- Friendly Fire culprit
- First Deer Painted (easy target)
- Paintball War instigator
- Bear Mauled (injured player)

## Episode History

- `ep.isPaintballHunt = true`
- `ep.paintballHunt = { roles, rounds, paintCounter, friendlyFire, paintballWar, bearMauled, winner, loser, mvp }`

## Text Backlog

`_textPaintballHunt(ep, ln, sec)` — role assignments, per-round events, paint status, special events, final result.

## Cold Open Recap

Winner, MVP hunter/last deer, bear mauled if any, paintball war if any.

## Timeline Tag

`phTag` — "Paintball Hunt" in forest green.

## Debug Challenge Tab

Full personal scores, per-round breakdown, role assignments, hit/miss ratios, special event log.

## Edge Cases

- **3+ tribes:** Hunt continues until 1 tribe remains with deer. First fully painted = loser.
- **All hunters find nothing in a round:** Round passes, deer all get +1.0 survival bonus. Next round.
- **Paintball war eliminates most of a tribe's hunters:** Fewer shots per round = slower hunt for that tribe's opponents.
- **Bear mauls last deer of a tribe:** Tribe auto-loses (0 deer = fully painted equivalent).
- **Balanced scoring:** Deer and hunters both average ~3.0 in personal score, neither role dominates podium.
