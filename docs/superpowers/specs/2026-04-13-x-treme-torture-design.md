# X-Treme Torture Challenge Twist — Design Spec

## Overview

A 3-event extreme sports challenge (Sofa Bed Skydiving, Rodeo Moose Riding, Mud Skiing) with deep individual drama, injury potential, cross-tribe sabotage, and social events woven throughout. Pre-merge only, 2+ tribes.

**Engine ID:** `x-treme-torture`
**Flag:** `ep.isXtremeTorture`
**Data key:** `ep.xtremeTorture`

---

## Challenge Structure

### 8 Phases

| # | Phase | Type | VP Reveals |
|---|---|---|---|
| 1 | The Briefing | Selection + psyche-out | 1 step |
| 2 | Sofa Bed Skydiving | Event 1 — per-substage reveals | 3-4 steps per tribe |
| 3 | Sideline Social 1 | Social events from Event 1 | 1 step |
| 4 | Rodeo Moose Riding | Event 2 — per-substage reveals | 3-4 steps per tribe |
| 5 | Sideline Social 2 | Social events from Event 2 | 1 step |
| 6 | The Sabotage Setup | Driver assignments + trash talk | 1 step per matchup |
| 7 | Mud Skiing | Event 3 — dual-actor sabotage | 4-5 steps per matchup |
| 8 | Results | Final scores + fallout | 1 step |

---

## Phase 1: The Briefing

Chris lands the dilapidated plane, announces all 3 events.

### Player Selection
- Each tribe assigns 1 player per event (3 players compete, rest are ground crew/spectators)
- **No repeats** unless tribe has fewer than 3 available (injured players cannot be selected)
- Selection is **archetype-biased random**:
  - Heroes/physical types: higher weight for all events
  - Bold players: +weight for skydiving
  - High-endurance: +weight for moose riding
  - High-strategic: +weight for mud skiing (flag collection is tactical)
  - Schemers/villains: may try to dodge dangerous events (low boldness + low loyalty = refuse chance)
- **Refusal mechanic**: `refuseChance = max(0, 0.08 + (5 - boldness) * 0.03 + (5 - loyalty) * 0.02)`
  - If refused: next eligible player is forced in, refuser gets +0.8 heat from tribe
  - Generates confessional text explaining the refusal

### Selection Drama Text
Composable: `[VOLUNTEER/ASSIGNED/FORCED] + [REACTION] + [CONFESSIONAL]`
- Keyed by archetype + boldness tier
- Examples: "Chase steps up immediately. No hesitation." / "MK is volunteered by the tribe. Her expression says everything."

---

## Phase 2: Sofa Bed Skydiving

One player per tribe jumps from 5,000 feet. Ground team positions the sofa bed.

### Sub-stages (each a composable text segment)

**2a. In the Plane**
- Jumper's mental state based on boldness:
  - High (7+): Calm, ready, maybe excited
  - Mid (4-6): Nervous but determined
  - Low (1-3): Visibly terrified, considering backing out
- Text: `[PLANE_MOOD] + [DIALOGUE_WITH_COPILOT]`

**2b. The Jump Decision**
- `jumpWillingly = boldness * 0.08 + physical * 0.02 + 0.15`
- Outcomes:
  - **Willing jump** (highest roll): Steps off confidently
  - **Hesitant jump**: Takes a moment, then goes
  - **Pushed by copilot/teammate**: Gets a "comforting pat" that sends them out (like DJ to Trent)
  - **Refuses** (very low boldness, ~5% base): Chicken, team gets 0 for this event
- Text: `[APPROACH_EDGE] + [DECISION_MOMENT] + [EXIT_TEXT]`

**2c. The Fall**
- Parachute deployment check: `deployChance = physical * 0.06 + mental * 0.04 + 0.30`
- Outcomes:
  - **Perfect deploy**: Smooth controlled descent
  - **Late deploy** (partial fail): Deploys last second, fast descent
  - **Tangled chute**: Spinning, chaotic descent
  - **Forgot to pull cord**: Free-fall until auto-deploy (if physical > 4) or crash
- Text: `[FALL_START] + [CHUTE_EVENT] + [DESCENT_QUALITY]`

**2d. Team Positioning (Ground Crew)**
- `positionScore = avgPhysical * 0.4 + avgSocial * 0.3 + avgMental * 0.3`
- Complications (random, one per team):
  - Someone fell asleep on the sofa bed (low endurance member)
  - Sofa bed is stuck in mud
  - Two members argue about direction (low bond pair)
  - Everything goes smoothly
- Text: `[GROUND_SETUP] + [COMPLICATION_OR_SMOOTH] + [FINAL_POSITION]`

**2e. The Landing**
- Score determined by fall quality + team positioning:
  - Both good → 8-10 pts (safe landing on sofa)
  - One bad → 4-7 pts (rough landing, partial miss)
  - Both bad → 1-3 pts (crash, deep impression in sand)
  - Refused → 0 pts
- **Injury check on crash**: `injuryChance = 0.15 + (10 - physical) * 0.04`
  - If injured: `gs.lingeringInjuries[name] = { ep, duration: 2+random(2), penalty: 1.5+random(1.0) }`
  - Injury narrative: body cast, "Nurse Hatchet" moment
  - Injured player removed from future event eligibility this episode
- Text: `[LANDING_MOMENT] + [OUTCOME_REACTION] + [INJURY_OR_CELEBRATION]`

### Scoring
`skyScore = clamp(0, 10, fallQuality * 5 + positionQuality * 5)`

---

## Phase 3: Sideline Social 1

2-3 social events fire based on Phase 2 outcomes. Each has **real consequences** — bond shifts, heat, targeting info, or romance progression. Selected probabilistically from this pool:

### Injury Consequences (if someone got hurt)
| Event | Trigger | Consequences | Badge |
|---|---|---|---|
| **Injury Sympathy** | Teammate injured, sympathizer loyalty ≥ 6 | Sympathizer +0.4 bond to injured. If sympathizer is in named alliance with injured, alliance cohesion +0.2. Generates targeting info: "X is protective of Y" flows to rival alliances. | gold: SUPPORT |
| **Injury Blame** | Teammate injured, blamer loyalty ≤ 4 OR strategic ≥ 7 | Blamer −0.4 bond to injured. Injured gets +0.5 heat from blamer's perspective. If blamer is in an alliance, injured becomes a soft target — `info: {target: injured, reason: 'liability', source: blamer}` flows into vote pitches. | red: BLAME |
| **Strategic Targeting** | Teammate injured, strategist present (strategic ≥ 7) | No immediate bond change but generates side deal: strategist quietly pitches to 1-2 allies that injured player is "the easy vote." `addBond(strategist, pitchTarget, +0.2)` (conspiracy bond). Injured gets +0.3 heat from each pitch target. | blue: SIDE DEAL |

### Performance Consequences
| Event | Trigger | Consequences | Badge |
|---|---|---|---|
| **Underdog Moment** | Low-stat player (overall ≤ 5) scored ≥ 7 | +0.5 bond from every tribe member (genuine respect). Underdog's threat perception drops −0.3 (seen as less threatening despite the performance). Generates camp event: "X proved everyone wrong." | gold: UNDERDOG |
| **Cross-Tribe Taunt** | Winning tribe member (boldness ≥ 6) to losing tribe | Taunter −0.3 bond with ALL members of losing tribe. But +0.2 bond with own tribe (rallying effect). If taunter targets a specific rival (negative bond), that rival gets +0.4 heat toward taunter — grudge that carries forward. | red-orange: TAUNT |

### Romance Consequences
| Event | Trigger | Consequences | Badge |
|---|---|---|---|
| **Showmance Worry** | Existing showmance, partner just jumped/crashed | +0.5 intensity between pair. If partner was injured: generates a "bedside" moment — intensity +0.8, both players' social game takes a hit (−0.2 bond with strategic tribemates who see them as distracted). If partner scored well: "proud partner" moment, +0.3 intensity. | pink: WORRIED / pink: PROUD |
| **Showmance Tension** | Existing showmance, one partner refused to jump | −0.4 intensity. "You wouldn't even do it for the team?" Potential showmance fracture if intensity drops below 2.0. | pink: TENSION |
| **New Spark — Danger Bond** | Two non-showmance players, opposite genders (if romance enabled), one comforted the other after scary/failed jump. Bond ≥ 1, no existing spark. | `_challengeRomanceSpark()` fires. Spark created with context "danger bonding." +0.3 bond. If one was injured: spark intensity starts higher (shared vulnerability). | pink: SPARK |
| **New Spark — Admiration** | Player watched another's impressive performance (score ≥ 8), compatible orientation, bond ≥ 0. | `_challengeRomanceSpark()` fires with context "admiration." Lower intensity than danger bond but still viable. | pink: IMPRESSED |

### Alliance Dynamics
| Event | Trigger | Consequences | Badge |
|---|---|---|---|
| **Alliance Whisper** | Tribe losing, 2+ alliance members present | Alliance members discuss vote target. `getPerceivedBond` determines who they blame — lowest-bond non-alliance member with worst challenge contribution becomes target. Information stored: `{alliance, target, reason}`. This flows into tribal vote pitches. | blue: SCHEMING |
| **Rival Respect** | Two players with bond ≤ −2 both survived dangerous event | +0.5 bond between rivals (grudging respect). "Okay, I'll give them that." Doesn't erase rivalry but softens it — may prevent a vote this cycle. | gold: RESPECT |

Text: composable `[CONTEXT_FROM_EVENT1] + [SOCIAL_ACTION] + [REACTION] + [CONSEQUENCE_HINT]`

---

## Phase 4: Rodeo Moose Riding

One player per tribe rides a bucking moose.

### Sub-stages

**4a. Approaching the Moose**
- Moose personality (random per tribe): `aggressive` / `lazy` / `chaotic` / `terrified`
  - Aggressive: -0.10 stay chance per round
  - Lazy: +0.05 stay chance, lower max score
  - Chaotic: random ±0.08 per round
  - Terrified: starts bucking before rider is ready
- Rider reaction based on boldness + moose personality
- Text: `[SEE_MOOSE] + [MOOSE_PERSONALITY_HINT] + [APPROACH_REACTION]`

**4b. Mounting**
- `mountChance = physical * 0.07 + boldness * 0.03 + 0.30`
- Fail = comedic failed mount (falls off immediately, moose walks away)
- Success = ride begins
- Text: `[MOUNT_ATTEMPT] + [SUCCESS_OR_FAIL]`

**4c. The Ride — 5 Buck Rounds**
- Each round: `stayChance = endurance * 0.07 + physical * 0.03 + 0.15 - (round * 0.08) + mooseMod`
- Score = rounds survived × 2 (max 10 at 5 rounds)
- Each round generates text: `[BUCK_ACTION] + [RIDER_RESPONSE]`
  - Buck actions vary by moose personality
  - Rider response keyed by stat tier + rounds survived
  - Later rounds have increasingly desperate text

**4d. The Dismount**
- Held all 5 rounds → graceful dismount (controlled)
- Thrown early → comedic launch trajectory:
  - Into pile of smelly socks
  - Into lake
  - Into bush
  - Into Chris's craft services table
  - Lands on a bear
- Text: `[THROW_MOMENT] + [TRAJECTORY] + [LANDING_LOCATION] + [AFTERMATH]`

**4e. Injury Check**
- Thrown in rounds 1-2: `injuryChance = 0.12 + (10 - endurance) * 0.03`
- Thrown in rounds 3-5: `injuryChance = 0.06 + (10 - endurance) * 0.02` (less momentum)
- Held all 5: no injury risk
- If injured: same lingering injury system, player cannot compete in Event 3

### Scoring
`mooseScore = roundsSurvived * 2` (max 10)
- Failed mount = 0
- Bonus +1 if held all 5 rounds

---

## Phase 5: Sideline Social 2

All Phase 3 social events can re-fire (contextualized to moose riding). Additionally, the **accumulated pressure of 2 events** unlocks higher-stakes social dynamics:

### Moose-Specific Events
| Event | Trigger | Consequences | Badge |
|---|---|---|---|
| **Comedy Bond** | Comedic dismount (thrown into socks/lake/bush), high-social (≥6) witnesses | +0.4 bond between player and every laughing witness. Reduces the sting — thrown player's heat drops −0.3 if tribe won the round. If tribe lost, comedy doesn't save them — heat stays. Generates camp event: tribe's inside joke. | gold: COMEDY |
| **Moose Trauma Comfort** | Player visibly terrified (boldness ≤ 3), teammate with loyalty ≥ 6 comforts | +0.5 bond between pair. If opposite gender + romance enabled + compatible: `_challengeRomanceSpark()` with "protective comfort" context — highest-intensity spark type. Even if same-gender or incompatible: strong loyalty bond that affects future vote protection. | pink: COMFORT |

### Accumulated Pressure Events (2 events in, stakes rising)
| Event | Trigger | Consequences | Badge |
|---|---|---|---|
| **Pressure Talk** | Tribe losing after 2 events, strategist (≥7) pressures Event 3 skier | Skier gets −0.3 bond to pressurer AND a `pressured` flag that affects Event 3 performance: −0.05 to all flag collection chances (nerves). If skier then performs well despite pressure: +0.6 bond reversal (respect). If poorly: pressurer gains ammunition for tribal. | red-orange: PRESSURE |
| **Desperation Alliance** | Tribe losing badly (both events lost), 2 non-allied players | Temporary "survival pact" — +0.3 bond, both players implicitly agree to vote together if they go to tribal. Not a named alliance but functions as one for this vote. Tracked as `{type: 'pact', members: [a, b], ep: num}`. | blue: PACT |
| **Showmance Argument** | Existing showmance, partner performed poorly or got hurt, other partner is frustrated (strategic ≥ 6) | −0.6 intensity. "Are you even trying?" Public argument witnessed by tribe — both players lose −0.2 bond from witnesses (seen as drama). If intensity drops below 1.5: showmance fractures. | pink: ARGUMENT |
| **Showmance Rally** | Existing showmance, partner about to compete in Event 3, partner gives encouragement | +0.4 intensity AND the competing partner gets a `motivated` flag: +0.08 to all Event 3 checks. The encouragement text references their relationship history. | pink: RALLY |
| **Cross-Tribe Showmance Moment** | `_checkShowmanceChalMoment()` — existing cross-tribe showmance during challenge downtime | Conflicted loyalty moment. If showmance intensity > 5: one partner subtly helps the other's tribe (less sabotage if they're the driver, or leaked info). Bond +0.3 but −0.2 from suspicious same-tribe members who notice. | pink: TORN |

---

## Phase 6: The Sabotage Setup

Driver assignments for Mud Skiing.

### Assignment Logic
- 2 tribes: A drives B, B drives A
- 3 tribes: rotation (A drives B, B drives C, C drives A)
- **Driver selection within tribe** (who volunteers to drive the opponent):
  - Villains/schemers: +weight to volunteer (want control)
  - High-strategic: +weight
  - Cross-tribe bond affects intent: negative bond = high sabotage intent, positive = may go easy
- `saboIntent = strategic * 0.05 + (10 - loyalty) * 0.03 - perceivedBond * 0.02 + (isVillain ? 0.10 : 0)`

### Pre-Race Confessionals
- Driver confessional: reveals sabotage plan (or reluctance if positive bond)
- Skier confessional: whether they trust the driver
- Text: `[DRIVER_ASSIGNMENT] + [DRIVER_CONFESSIONAL] + [SKIER_REACTION]`

---

## Phase 7: Mud Skiing

Skier collects flags while opponent drives. Most complex event.

### Sub-stages

**7a. The Start**
- Driver launches jet ski
- **Jolt sabotage check**: if saboIntent > 0.3, driver may try to jolt skier off at start
  - `joltChance = saboIntent * 0.6`
  - Skier resistance: `physical * 0.06 + endurance * 0.04`
  - If jolted off: skier dragged through mud (like Harold), but can still collect flags while being dragged
- Text: `[START_LAUNCH] + [JOLT_OR_CLEAN] + [SKIER_STATUS]`

**7b. Flag Run — 5 Flags**
- Each flag: `collectChance = physical * 0.05 + mental * 0.03 + 0.20`
- Driver swerve sabotage per flag: if saboIntent > 0.2, `-0.12` to collect chance
- Being dragged (from jolt): `-0.08` to collect chance but not impossible (Harold caught all 5 while being dragged)
- Skill modifiers:
  - Acrobatic flag grabs for high physical (ramp backflip like Lindsay)
  - Desperate lunges for mid-range
  - Lucky catches for low-stat
- Text per flag: `[APPROACH_FLAG] + [DRIVER_ACTION] + [COLLECTION_ATTEMPT] + [RESULT]`

**7c. Mid-Course Sabotage**
- If saboIntent > 0.4 and driver hasn't given up: deliberate crash attempt
  - `crashAttemptChance = saboIntent * 0.5`
  - **Backfire chance**: `0.20 + (10 - driverPhysical) * 0.03`
  - Backfire: driver crashes, skier may keep going on momentum
  - Success: both crash, flags collected so far still count
- Text: `[SABOTAGE_SETUP] + [ATTEMPT] + [OUTCOME_OR_BACKFIRE]`

**7d. The Finish Line**
- Driver may refuse to cross: `refuseChance = (10 - loyalty) * 0.03 + saboIntent * 0.2`
  - If refused: skier momentum check (`physical * 0.08 + 0.15`)
  - Success = crosses anyway, driver embarrassed
  - Fail = stops short, flags collected but -2 penalty
- Text: `[APPROACH_FINISH] + [DRIVER_DECISION] + [FINAL_MOMENT]`

**7e. Injury Check**
- Crash (any kind): `injuryChance = 0.10 + (10 - physical) * 0.03`
- Both skier AND driver can be injured
- Backfire crash: driver injury chance is HIGHER (`0.15 + (10 - driverPhysical) * 0.04`)

### Scoring
`skiScore = flagsCollected * 2` (max 10)
- Clean finish bonus: +1
- Driver sabotage backfire bonus: +2 (crowd sympathy, like Lindsay getting respect)
- Driver refused finish penalty: -2 (unless skier had momentum to cross)

---

## Phase 8: Results

### Total Scoring
`tribeTotal = skyScore + mooseScore + skiScore` (max 30 per tribe)

### Rankings
- Highest total = **IMMUNITY**
- Lowest total = **GOES TO TRIBAL**
- Middle (3 tribes) = SAFE
- Tiebreaker: Event 3 score, then Event 2, then Event 1

### Social Fallout — Heat System
Heat is proportional, not flat:
- Worst performer on losing tribe: `+1.0` base heat, `+0.3` per additional failure (refused, injured through recklessness)
- Refusers: `+0.8` heat from every tribe member. If tribe loses: `+1.2` instead ("we lost because you wouldn't compete")
- Injured players: split heat — `loyalty * 0.1` of tribe gives sympathy (reduces heat by −0.3), rest gives blame (+0.3 heat). Net effect depends on tribe composition.
- Sabotage fallout: blatant saboteurs get −0.4 bond from own tribe if sabotage backfired. But if sabotage was subtle and successful: +0.2 from strategic allies, −0.3 from loyal tribemates who disapprove.
- MVP: +0.4 bond from whole tribe, threat perception +0.2 (double-edged — respect now, target later)
- `gs._xtremeTortureHeat = { target, amount, expiresEp: ep.num + 2 }`

### Camp Events Generated (3-4 per tribe, 1-2 positive, 1-2 negative)

**Positive pool:**
| Event | Trigger | Consequences | Badge |
|---|---|---|---|
| **Underdog Hero** | Low-stat player outperformed (score ≥ 7, overall ≤ 5) | +0.5 bond from tribe. Underdog gains social capital — less likely to be targeted next vote. Camp event text: tribe celebrates them. | gold: HERO |
| **Team Player** | Ground crew member made critical difference in sofa positioning | +0.3 bond from tribe. Player's social game improves — perceived as "reliable." Text references specific moment. | gold: TEAM PLAYER |
| **Injury Support** | Player helped injured teammate after challenge | +0.5 bond with injured. If they're in same alliance: alliance cohesion +0.3. If romance-compatible + no existing spark: `_challengeRomanceSpark()` with "caretaker" context. | gold: SUPPORT |
| **Comedy Relief** | Comedic wipeout that became tribe's inside joke | +0.3 bond from whole tribe. Reduces any heat from poor performance by −0.5 (hard to vote out the person who made everyone laugh). | gold: COMIC RELIEF |
| **Showmance Deepening** | Existing showmance had a positive challenge moment (worry→relief, rally→success) | +0.6 intensity. If first move hasn't happened and intensity ≥ 4: triggers first move. Camp event shows the private moment after the challenge. | pink: CLOSER |

**Negative pool:**
| Event | Trigger | Consequences | Badge |
|---|---|---|---|
| **Refusal Resentment** | Player refused to compete | −0.4 bond from every tribe member. Refuser becomes top vote target. Even allies distance themselves (−0.2 from alliance members). Camp text: confrontation scene. | red: COWARD |
| **Sabotage Confrontation** | Cross-tribe sabotage was blatant (backfire or caught) | Saboteur's tribe: −0.3 bond from loyal members. Victim's tribe: −0.5 bond with saboteur's entire tribe (collective grudge that affects future cross-tribe interactions). Text: public confrontation. | red: CONFRONTATION |
| **Blame Game** | Losing tribe, worst performer identified | Target gets +1.0 heat. If target is in a minority alliance: alliance bond stress-tested. Strategic members of majority may pitch "easy vote" using challenge as ammunition. Text: overheard conversation. | red: BLAME |
| **Injury Liability** | Injured player + strategic tribemate (≥7) + losing tribe | Strategist pitches injured player as "the smart vote — they can't compete anyway." Generates vote pitch info that flows into tribal: `{pitcher, target, reason: 'injury-liability'}`. −0.3 bond between strategist and injured. | blue: CALCULATING |
| **Driver Fallout** | Own tribe's driver either failed to sabotage or sabotaged too obviously | If driver failed: −0.3 bond from strategic tribemates ("you had one job"). If driver was too obvious: −0.4 from loyal tribemates ("you made us look bad"). Either way generates camp drama. | red-orange: DRIVER DRAMA |
| **Showmance Fracture** | Existing showmance had negative challenge moment (argument, refusal, failed when partner was watching) | −0.8 intensity. If intensity drops below 1.0: showmance ends. Camp event shows the fallout — cold shoulder, separate sleeping, tribe notices. Tribe members with strategic ≥ 6 may exploit the fracture. | pink: FRACTURE |
| **Love Triangle Fuel** | Existing showmance + new spark fired during challenge for one of the pair | Third party's spark exists alongside the showmance. If other showmance partner notices (intuition ≥ 6): −0.5 intensity with original showmance, +0.3 heat toward the new spark target. Drama triangle established. | pink: TRIANGLE |

Each camp event: `{ type, text, players: [], badgeText, badgeClass, bondChanges: [{a, b, delta}], heatChanges: [{target, amount}] }`

---

## Composable Text System

All narrative text uses the `[SEGMENT_A] + [SEGMENT_B] + [SEGMENT_C]` pattern from Trust Challenge.

### Context Injection
Previous event outcomes feed as context prefixes into later text:
- Event 1 crash → Event 2 text opens with "Still rattled from the skydiving disaster, ..."
- Event 2 perfect score → Event 3 text opens with "Riding the high from the moose round, ..."
- Injury in Event 1 → sideline text references the injury

### Text Pool Structure
```javascript
const XT_SKY_PLANE = {
  high: [(name, pr) => `...`, (name, pr) => `...`],
  mid:  [(name, pr) => `...`, (name, pr) => `...`],
  low:  [(name, pr) => `...`, (name, pr) => `...`]
};
```

Each pool: 3-5 templates per tier, using `name` and `pr` (pronouns object) parameters.

---

## Data Structure

```javascript
ep.xtremeTorture = {
  // Selection
  selections: { tribeName: { sky: name, moose: name, ski: name, driver: name } },
  refusals: [{ name, tribe, event, replacement }],

  // Event 1: Skydiving
  skydiving: [{
    tribe, jumper, jumpDecision, fallQuality, teamPosition,
    score, injured, text: { plane, jump, fall, ground, landing }
  }],

  // Event 2: Moose Riding
  mooseRiding: [{
    tribe, rider, moosePersonality, mounted, roundsSurvived,
    dismountType, dismountLocation, score, injured,
    text: { approach, mount, rounds: [], dismount }
  }],

  // Event 3: Mud Skiing
  mudSkiing: [{
    tribe, skier, driver, driverTribe, saboIntent,
    joltedOff, flagsCollected, sabotageAttempt, sabotageBackfire,
    driverRefusedFinish, skierMomentum, score, skierInjured, driverInjured,
    text: { start, flags: [], sabotage, finish }
  }],

  // Social events during challenge
  sidelineEvents: [{ type, text, players: [], badgeText, badgeClass, bondChanges: [] }],

  // Results
  tribeScores: { tribeName: { sky, moose, ski, total } },
  winner, loser, mvp,

  // Camp events to inject
  campEvents: { tribeName: [{ type, text, players: [], badgeText, badgeClass }] }
}
```

---

## VP Overdrive Design

### Aesthetic: Extreme Sports Broadcast + Vertigo

Background: high-altitude gradient (similar to Cliff Dive but with more orange/red adrenaline tones). Each event gets its own color identity:
- Skydiving: **sky blue → deep blue** (altitude feel)
- Moose Riding: **dust brown → arena orange** (rodeo feel)
- Mud Skiing: **muddy brown → racing red** (motor sport feel)

### VP Screen Structure
Single screen, click-to-reveal steps:

1. **Title card**: "X-TREME TORTURE" in bold display font, adrenaline red
2. **Briefing**: Selection reveals per tribe (confessional cards)
3. **Event 1 header**: "SOFA BED SKYDIVING" title card with sky gradient shift
4. **Per-tribe skydiving**: each sub-stage revealed individually (plane → jump → fall → landing)
   - Player portrait large and centered before their attempt ("ON THE EDGE" spotlight)
   - Score appears after landing
5. **Sideline Social 1**: social event cards between events
6. **Event 2 header**: "RODEO MOOSE RIDING" with dust/arena shift
7. **Per-tribe moose riding**: approach → mount → round-by-round buck reveals → dismount
   - Round-by-round reveals for the ride (like Dodgebrawl per-event)
   - Moose personality badge displayed
8. **Sideline Social 2**: social events
9. **Sabotage Setup**: driver confessionals
10. **Event 3 header**: "MUD SKIING" with racing aesthetic
11. **Per-matchup mud skiing**: start → per-flag reveals → sabotage → finish
    - Flag counter updating with each collection
    - Driver intent meter (hidden until sabotage attempt)
12. **Results**: animated score bars per tribe, winner announcement

### Key VP Features
- **Running scoreboard** (sticky, updates after each event like Dodgebrawl)
- **Event title cards** with color-shift backgrounds (animated transition)
- **Spotlight portraits** before each competitor's turn
- **Score cards** after each event showing tribe standings
- **Injury overlay** when injury fires (dramatic red flash, body cast icon)
- **Sabotage reveal** — driver's intent shown retrospectively after the event
- **Flag counter** for mud skiing (5 slots that fill as flags are collected)

### Animations
- `xtSlideIn` — competitor spotlight entrance
- `xtScoreReveal` — score number scales in
- `xtInjuryFlash` — red flash on injury
- `xtFlagCollect` — flag slot fills with green
- `xtSaboBackfire` — shake + red flash when sabotage backfires
- `xtEventTransition` — color gradient shifts between events
- All with `prefers-reduced-motion` fallbacks

---

## Integration Checklist

Per the challenge twist pattern (from codebase analysis):

- [ ] Registration: `engineType === 'x-treme-torture'` → `ep.isXtremeTorture = true`
- [ ] Dispatch: `ep.isXtremeTorture && gs.phase === 'pre-merge'` → `simulateXtremeTorture(ep)`
- [ ] VP registration: `vpScreens.push({ id:'xtreme-torture', label:'X-Treme Torture', html: rpBuildXtremeTorture(ep) })`
- [ ] Episode history: `patchEpisodeHistory` saves flag + data
- [ ] Badge: orange/red tag in episode history display
- [ ] Debug tab: add to challenge tab visibility + `_chalType` chain
- [ ] `updateChalRecord` skip: add `&& !ep.isXtremeTorture`
- [ ] Text backlog: `_textXtremeTorture(ep, ln, sec)`
- [ ] Camp events: generate 2-3 per tribe with `players[]` + badge
- [ ] Heat: `gs._xtremeTortureHeat = { target, amount, expiresEp }`
- [ ] Showmance: call `_challengeRomanceSpark()` during sideline socials
- [ ] Injury: use `gs.lingeringInjuries` system
- [ ] Timeline tag: add to cold open / timeline
- [ ] `ep.chalMemberScores`: generate per-player scores for challenge record
