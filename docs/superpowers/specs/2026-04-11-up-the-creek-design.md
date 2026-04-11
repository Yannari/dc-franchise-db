# Up the Creek Design

**Date:** 2026-04-11
**Inspired by:** Total Drama Island S1E8 "Up the Creek"
**Type:** Schedulable challenge twist (pre-merge, tribe vs tribe)

---

## Overview

4-phase canoe race challenge. Players self-select canoe partners (social drama), paddle to an island, portage through obstacles, build rescue fires, and race back. Partner chemistry affects paddle speed. Burning paddles in the fire creates a Phase 4 handicap. Every event feeds personal scoring for top 3/bottom 3.

## TWIST_CATALOG Entry

```
id: 'up-the-creek'
emoji: '🛶'
name: 'Up the Creek'
category: 'challenge'
phase: 'pre-merge'
engineType: 'up-the-creek'
minTribes: 2
incompatible: [all other challenge twists]
```

## Phase 0: Canoe Partner Selection

Players self-select partners within their tribe. Boldest picks first.

**Most wanted partner per player:** Highest `bond * 0.5 + (physical + endurance) * 0.1` among tribemates.

**Pick order:** Sorted by boldness descending (boldest picks first).

**Drama scenarios:**

| Scenario | Trigger | Effect | Reaction Text |
|---|---|---|---|
| Mutual pick | Both wanted each other | +0.3 bond, great chemistry | "[A] and [B] grab the same canoe. No words needed. They both knew." |
| One-sided pick | A picks B, but B wanted C | -0.2 bond A↔B, B resentful | "[B] glances at [C] one last time before getting in the canoe with [A]. This wasn't the plan." |
| Rejected | A wanted B, but B taken | -0.3 bond with whoever took B | "[A] watches [B] climb into a canoe with [taker]. [A] stands on the dock, jaw tight." |
| Last pick | Odd player out, no partner | -0.5 feeling excluded, solo canoe | "[solo] is the last one on the dock. No partner. Just a canoe and the water. The tribe doesn't look back." |
| Showmance pair | Existing showmance | +0.2 bond reinforcement | "[A] and [B] don't even discuss it. Same canoe. Obviously." |
| Rivals forced | Last two with bond <= -1 | -0.3 bond, comedy + conflict | "[A] and [B] stare at the last canoe, then at each other. This is going to be a long paddle." |

**Reaction text pool (3-5 per scenario):**

Mutual:
- "[A] and [B] grab the same canoe. No words needed. They both knew."
- "[A] nods at [B]. [B] nods back. They're already in the water before anyone else has picked."
- "[B] grins when [A] walks over. 'I was hoping you'd ask.' 'I wasn't asking.'"

One-sided:
- "[B] hesitates. Looks at [C]. Then at [A]. Gets in the canoe. Says nothing."
- "[A] is thrilled. [B] is... managing expectations."
- "'Come on, it'll be fun,' [A] says. [B]'s face says it will not be fun."

Rejected:
- "[A] watches [B] paddle off with [taker]. [A] pretends it doesn't sting. It stings."
- "[A] stood there a second too long. By the time [sub] moved, [B] was already gone."
- "'Whatever,' [A] mutters, grabbing the next available canoe. [Sub] [sub==='they'?'don\'t':'doesn\'t'] look back."

Last pick:
- "[solo] is the last one standing on the dock. Solo canoe. The tribe is already in the water."
- "Nobody picked [solo]. [Sub] [sub==='they'?'drag':'drags'] the canoe into the water alone. Quiet."
- "[solo] pushes off solo. The others are paired up and laughing. [Sub] [sub==='they'?'paddle':'paddles'] harder."

Showmance:
- "[A] and [B] don't even hesitate. Same canoe. The tribe rolls their eyes."
- "[A] holds the canoe steady for [B]. The tenderness is visible. Someone gags."
- "'You and me?' 'Always.' The canoe practically launched itself."

Rivals forced:
- "[A] and [B] stare at the last canoe, then at each other. This is going to be a long paddle."
- "'Absolutely not.' 'You don't have a choice.' They get in. Neither sits comfortably."
- "[A] takes the front. [B] takes the back. They haven't looked at each other once."

**Odd tribe member:** If tribe has odd number, lowest boldness player gets the solo canoe.

**Stored:** `ep.upTheCreek.canoePairs[tribeName] = [{ a, b, mutual, chemistry }, ...]` and `ep.upTheCreek.soloCanoe[tribeName] = name || null`

## Phase 1: Paddle to Boney Island (3-4 events per tribe)

**Pair paddle speed:** `bond * 0.15 + avg(physical + endurance) * 0.25 + random(0, 1.5)`
- Bond >= 2: +0.5 bonus (great sync)
- Bond <= -1: -0.5 penalty (fighting the whole way)
- Solo canoe: `physical * 0.3 + endurance * 0.25` (no bond bonus, harder)

**Event pool (3-4 per tribe):**

| Event | Stat Driver | Score | Bond |
|---|---|---|---|
| Fast pair leads the way | top paddle speed pair | +1.5 both | +0.2 mutual |
| Slow pair holds tribe back | bottom paddle speed pair | -1.0 both | -0.2 mutual |
| Argument in canoe | pairs with bond <= 0 | -0.5 both | -0.3 mutual |
| Bonding in canoe | pairs with bond >= 2 | +0.5 both | +0.3 mutual |
| Capsized on the way | (10-endurance) proportional | -1.5 both | comedy event |
| Wildlife spotted (dolphins, fish) | intuition * 0.04 | +0.5 spotter | +0.2 partner |
| Solo canoe struggles | solo player exists | -0.5 solo | sympathy from tribe |
| Solo canoe impresses | solo player physical * 0.04 | +1.5 solo | +0.3 from tribe (respect) |
| Race between pairs | boldness * 0.03 | +1.0 winner pair | +0.2 competitive bond |

## Phase 2: Portage (3-5 encounters per tribe)

All tribe runs together carrying canoes over their heads. 15 encounter types:

| Encounter | Stat Driver | Score | Bond |
|---|---|---|---|
| Wildlife attack (beavers, geese, bears) | boldness brave, endurance running | +1.5 brave, -1.0 panicker | +0.3 brave→panicker |
| Quicksand trap | intuition avoid, physical+loyalty rescue | +2.0 rescuer, -1.5 trapped | +0.5 rescued→rescuer |
| Injury/splinter | (10-endurance) proportional | -1.0 injured | +0.3 carrier→injured |
| Shortcut found | intuition + mental | +2.0 finder | +0.2 from tribe |
| Dangerous crossing (river, cliff, swamp) | physical + boldness | +1.5 success, -1.0 fail | — |
| Someone drops the canoe | (10-physical) proportional | -1.5 dropper | -0.2 from annoyed tribe |
| Creepy ruins/cave | boldness explore, intuition discover | +1.0 explorer or -0.5 scared | — |
| Swarm of insects | temperament stay calm | +0.5 calm, -0.5 panicker | — |
| Dense fog | navigator mental + intuition | +1.5 navigator or -1.5 lost | — |
| Rival tribe spotted | strategic + social | cross-tribe bond changes | ±0.3 |
| Someone falls behind | (10-endurance) + (10-physical) | -1.0 straggler | +0.3 helper→straggler |
| Mysterious animal sounds | boldness brave, social comforter | +0.5 brave, +0.5 comforter | +0.3 comforter→scared |
| Steep hill climb | physical + endurance (whole tribe) | tribe avg score, worst highlighted | -0.2 weakest |
| Food discovery (berries, fruit) | intuition spot, mental ID | +1.0 good find or -1.0 sick | +0.2 from tribe |
| Creek crossing with canoes | physical + loyalty (teamwork) | +1.0 coordinated, -1.0 uncoordinated | — |

## Phase 3: Build Fire

**Fire score per tribe:** Best fire-builder's `mental * 0.04 + boldness * 0.03 + random(0, 1.5)`

**Bonus methods (proportional chance):**

| Method | Trigger | Effect |
|---|---|---|
| Has a lighter | villain/schemer/wildcard + boldness proportional | +3.0 tribe fire score. "No rule against it." |
| Homemade fire-starter | mental * 0.04 + boldness * 0.03 (chaos-agent, wildcard) | +4.0 on success, -2.0 on explosion (50/50 risk) |
| Throws paddles in fire | (10-mental) * 0.02 + boldness proportional | +2.0 fire score BUT paddles destroyed → Phase 4 penalty |
| Traditional method | endurance * 0.03 + mental * 0.02 (default) | Steady score, no risk |
| Gives advice to other tribe | social * 0.04 + (10-strategic) * 0.03 (the Izzy move) | +2.0 to OTHER tribe's fire. Own tribe furious (-0.5 bond from all). |

**Fire winner:** Tribe with highest fire score gets +3.0 time bonus for Phase 4.

**Paddle burning consequence:** Tribe must find alternative in Phase 4. Someone swims and pushes canoes (hero moment or disaster).

## Phase 4: Paddle Back (3-5 events per tribe)

**Race score per tribe:**
- Sum of pair paddle speeds (same formula as Phase 1)
- Fire winner bonus: +3.0
- Paddle penalty: if burned, no normal paddling. Must use swimmer:
  - Swimmer score: `physical * 0.06 + endurance * 0.05 + random(0, 2.0)`
  - Success: swimmer carries the tribe, massive personal score +3.0
  - Fail: tribe crawls home, big time penalty

**Canoe partner bond effect:**
- Bond >= 2: +0.5 speed bonus per pair
- Bond <= -1: -0.5 speed penalty per pair

**Event pool (3-5 per tribe, 13 types):**

| Event | Trigger | Effect |
|---|---|---|
| Strong current | random | All slowed. High physical pairs less affected. |
| Capsized canoe | (10-endurance) proportional weakest pair | Time loss. Bond damage. |
| Sprint finish | top physical+endurance player | +2.0 score. Hero moment. |
| Partner swap mid-race | strategic * 0.03 | Optimize chemistry. +bond new partner. |
| Paddling argument | pairs with bond <= 0 | Time penalty. -0.3 bond. |
| Wildlife in the water | boldness brave, (10-boldness) panicker | +1.0 brave, -0.5 panicker. |
| Wave hits canoe | random + (10-endurance) | Soaked. Morale drop. Bail water. |
| Cheating — cutting restricted zone | (10-loyalty) * 0.02 + strategic * 0.03 | Time save if undetected. Penalty if caught. |
| Canoe springs a leak | random low chance | One bails, partner solos. Physical determines pace. |
| Motivational speech from canoe | social * 0.04 + boldness * 0.03 | All tribe pairs get speed boost. |
| Exhaustion hits | (10-endurance) proportional late race | Weakest gives out. Partner solos. Time penalty. |
| Drafting behind rival | strategic * 0.03 | Speed advantage. Rivals notice → trash talk. |
| Photo finish | top 2 tribes within 10% score | Dramatic close. Random tiebreaker. |

## Winner Determination

Total tribe score = Phase 1 paddle + Phase 2 portage + Phase 3 fire + Phase 4 race.
Highest total wins immunity. Lowest goes to tribal.
Tiebreaker: fire phase winner, then higher portage score.

## Personal Scoring

Every event awards personal scores → `chalMemberScores` → `updateChalRecord` for podium/bomb.

## Camp Events (2 positive + 1-2 negative per tribe)

**Positive:** MVP paddler, fire hero, portage survivor, rescue moment, canoe chemistry
**Negative:** canoe dropper, paddle burner, gave advice to enemy, capsized, slowed the tribe

## VP Screen

**`rpBuildUpTheCreek(ep)`** — single screen, click-to-reveal per phase.

**Phase 0 (Partner Selection):** Click-to-reveal each pair forming. Portrait A → Portrait B with reaction text. Rejected/last pick shown dramatically.

**Ambiance per phase:**
- Phase 1 (Paddle Out): Water blue `#58a6ff`, morning light
- Phase 2 (Portage): Jungle green `#3fb950`, danger vibes
- Phase 3 (Build Fire): Amber `#f0a500`, campfire warmth
- Phase 4 (Paddle Back): Sunset orange `#e06030`, sprint energy

## Episode History

- `ep.isUpTheCreek = true`
- `ep.upTheCreek = { canoePairs, soloCanoe, phases, fireScores, paddlesBurned, swimmerHero, winner, loser }`

## Text Backlog

`_textUpTheCreek(ep, ln, sec)` — partner picks, per-phase events, fire results, race results.

## Cold Open Recap

Winner, partner drama highlights, fire method used, swimmer hero if applicable.

## Timeline Tag

`utcTag` — "Up the Creek" in blue.

## Debug Challenge Tab

Full personal scores, canoe pair chemistry values, fire scores, race breakdown.

## Edge Cases

- **3+ tribes:** All race. Same 4 phases. Highest total wins.
- **2-member tribe:** Only 1 canoe pair. No solo. No partner drama.
- **Paddles burned + low physical tribe:** Near-guaranteed loss. The consequence is real.
- **Advice giver:** Can't give advice to your own tribe. Only fires for social+low-strategic players.
- **Photo finish:** Only fires when scores are within 10%. Creates dramatic ending.
