# Broadway Baby — Challenge Design Spec

**Date:** 2026-05-02
**Series:** World Tour (`chalSeries: 'world-tour'`)
**Style:** Adventure (`chalStyle: 'adventure'`)
**Phase:** Pre-merge (`phase: 'pre-merge'`)
**ID:** `broadway-baby`
**Inspired by:** Total Drama World Tour S3E5 "Broadway, Baby!"

> **No real-world geography.** No "New York", no country names, no Statue of Liberty.
> The Chris McLean statue replaces the Statue of Liberty. The setting is fictional.

---

## Overview

A 3-phase pre-merge tribe challenge. Teams climb a giant narcissistic Chris McLean statue, race through underground tunnels with an alligator chase, then bob for apples and race baby carriages to the finish. Normal elimination challenge (losing tribe goes to tribal council), but also compatible with the reward challenge system when selected.

---

## Phase 1: The Chris Colossus

A massive golden Chris McLean statue towers over the challenge area. Three baby carriages dangle from the statue's outstretched hand. Teams must climb steel wool ropes to the top, retrieve their carriage, and slide down a fireman's pole.

### Climb Mechanics (per player, sequential within tribe)

- Each player attempts the climb in rounds. Climb score: `physical * 0.07 + endurance * 0.04 + noise(2.5)`
- **Success** (score > 0): player advances one segment (3 segments to reach the top)
- **Fail**: player slips, loses grip. Rope burn event: `-0.5 morale equivalent`, small time penalty
- Once a player reaches the top, they can **pull up** the next teammate: bonus `+0.15 * physical` added to the next climber's roll. Bond +0.5 between puller and pulled.
- First tribe to get all members up = first pick of carriage (best carriage = lightest = faster in Phase 3)

### Possible Events During Climb

| Event | Chance | Mechanic | Consequence |
|---|---|---|---|
| **Rope burn** | ~30% on fail | — | Player's hands hurt, endurance penalty carries to next attempt |
| **Stuck in statue** | ~12% per fail, weighted by inverse physical + noise | Teammate rescue costs a full round | Hero moment: rescuer pop +2, bond +1 with stuck player |
| **Teammate boost** | ~25% when 2+ at top | — | Small speed bonus to current climber |
| **Steel wool snap** | ~8% | — | Rope partially breaks. Next climber on that rope gets penalty |
| **Showoff moment** | ~15% for challenge-beasts/hotheads with physical >= 7 | — | Player scales dramatically fast, skipping a segment. Pop +1 |
| **Social events between rounds** | — | — | Rivalry taunts cross-tribe, encouragement within tribe, villain trash-talking |

### Pole Slide (after retrieval)

- Quick event per player: `boldness * 0.06 + physical * 0.04 + noise(2.5)`
- **Good slide** (score > 0): clean descent, small time bonus
- **Bad slide**: player hesitates or crashes at the bottom. Time penalty. Funny narration.
- **Spectacular crash** (~10% on bad slide): player wipes out hard. Pop +1 (entertaining), but time penalty doubles

### Carriage Assignment

- First tribe to complete = lightest carriage (speed bonus Phase 3, x1.15)
- Second = standard carriage (x1.00)
- Last = heavy carriage (speed penalty Phase 3, x0.85)

---

## Phase 2: The Underground Gauntlet

Teams load into boats and race through a network of underground tunnels beneath the challenge area. Dark, cramped, unpredictable. The tunnels converge and split — tribes can encounter each other.

### Race Structure

- 6-8 segments per tribe, processed in interleaved rounds (like Frozen Crossing Phase 2). All tribes racing simultaneously, sorted by current time. Tribe header cards on POV switch.
- **Navigation score per segment**: `mental * 0.06 + intuition * 0.04 + noise(2.5)` — good roll = faster path, bad roll = wrong turn (time penalty)
- One player per tribe designated as **navigator** (highest mental picks it, or captain assigns). Navigator's stats drive the path rolls.

### Non-Navigator Crew Contributions

| Event | Chance | Stat Check | Consequence |
|---|---|---|---|
| **Paddling** | ~guaranteed 1/segment | `physical * 0.06 + endurance * 0.04 + noise(2.5)` | Good roll = small time bonus. Bad roll = splashes uselessly, funny narration |
| **Lookout call** | ~20% | `intuition * 0.08 + noise(2.5)` | Success = tribe avoids hazard entirely (skips the roll). Fail = false alarm, small time cost |
| **Boat stabilizer** | ~15% after any fail | `physical * 0.05 + endurance * 0.05 + noise(2.5)` | Success = reduces time penalty by half. Fail = falls overboard, teammates pull back (bond +0.5, extra time) |
| **Morale driver** | ~20% | `social * 0.08 + noise(2.5)` | Success = speed boost next segment + bond +0.3. Fail = no effect |

### Tunnel Hazards

| Event | Chance | Stat Check | Consequence |
|---|---|---|---|
| **Low pipe** | ~20% | `physical * 0.06 + noise(2.5)` | Fail: bonks head, time penalty. Pass: dramatic duck |
| **Rats on boat** | ~15% | `boldness * 0.08 + noise(2.5)` | Fail: panic, boat wobbles, time penalty. Pass: kicks rats off, pop +1 |
| **Water current** | ~25% | `endurance * 0.07 + noise(2.5)` | Fail: boat spun around, big time penalty. Pass: ride the current, time bonus |
| **Tunnel fork** | ~20% | `mental * 0.08 + noise(2.5)` | Navigator chooses. Wrong = dead end + backtrack. Right = shortcut |
| **Boat leak** | ~10% | `physical * 0.05 + noise(2.5)` | Fail: slow leak, cumulative time drain. Comic narration |
| **Cross-tribe collision** | ~15% when close | physical comparison | Slower tribe knocked back. Bond -0.5 cross-tribe, trash talk |

### Social Events Between Segments

- Encouragement/whipping/bonding (same pattern as Frozen Crossing sled race)
- **Navigator blame**: if a wrong turn happens, low-loyalty teammates blame the navigator. Bond -0.5, camp event.
- **Panic bonding**: after a scare (rats, current), nearby players huddle. Bond +0.5.

### The Alligator — Climax Event

- Fires in the final 2 segments. The gator appears behind the last-place tribe first, then chases everyone.
- **Gator attack** (~40% for last place, ~20% for others): `physical * 0.06 + boldness * 0.05 + noise(2.5)`
  - **Dodge**: team swerves past. Pop +1 for the player who steered. Time bonus from adrenaline rush.
  - **Hit**: gator rams the boat. Massive time penalty. Players scramble. One player can attempt a **hero move** (push the gator away): `physical * 0.08 + noise(2.5)`. Success = pop +3, bond +1 with whole tribe, camp event "fought off the gator." Fail = boat capsizes briefly, even more time lost.
- **Gator ramp** (~15%): the gator surfaces under a boat and launches it into the air. Time penalty but spectacular. Pop +1 for everyone on board (the audience loved it).
- Teams exit the tunnels in race order.

---

## Phase 3: Central Park Dash

Two sub-phases combined: the Apple Bob and the Baby Carriage Race. All tribes arrive at a pond area.

### Role Assignment (auto-assigned by stat weighting + noise)

- **Bobber**: highest `endurance * 0.5 + physical * 0.3 + boldness * 0.2 + noise(2.5)`. Dives in for the apple.
- **Baby**: lowest `physical * 0.5 + endurance * 0.3 + noise(2.5)`. Weakest player rides in the carriage. Active role (see below).
- **Pushers**: everyone else. Push the carriage after the apple is loaded.

### Sub-Phase A: Apple Bobbing

Each tribe's bobber enters the pond simultaneously. Interleaved rounds.

**Bobbing Mechanics — 3 attempts to grab the apple:**

Each attempt: `physical * 0.06 + endurance * 0.05 + boldness * 0.04 + noise(2.5)`
- **Success** (score > 0.3): Grabs the apple. Time based on attempts (1 = fast, 3 = slow).
- **Fail**: Apple slips. Bobber submerges, comes up sputtering. Time penalty per failed attempt.
- **Critical success** (score > 0.7): Spectacular grab — dives under the apple, balances on head. Pop +2, time bonus.
- **Critical fail** (score < -0.3): Bobber chokes on water. Big time penalty. Teammates react (encouragement or frustration depending on bonds).

**Pond Hazards:**

| Event | Chance | Mechanic | Consequence |
|---|---|---|---|
| **Turtle attack** | ~25% per attempt | `physical * 0.07 + noise(2.5)` | Fail: turtle clings, lose next attempt. Pass: flings turtle away |
| **Cross-tribe splash war** | ~15% when two bobbers present | `boldness * 0.06 + noise(2.5)` for victim | Fail: distracted, next attempt penalized. Intentional (villain): pop -1, +2 score. Bond -0.5 |
| **Bobber sinks** | ~8% on 2nd/3rd fail | — | Replacement jumps in from pushers. Massive time cost but fresh attempts |

**Shore Events While Waiting:**

| Event | Chance | Mechanic | Consequence |
|---|---|---|---|
| **Coaching from shore** | ~30% | `social * 0.07 + noise(2.5)` | Success: bobber's next attempt +0.1 bonus. Fail: bad advice |
| **Baby complains** | ~20% | — | Archetype-driven narration flavor. No gameplay effect |
| **Sabotage setup** | ~10% for villain/schemer/mastermind | — | Sets `carriageSwapReady = true` for the schemer. Enables swap in carriage race |
| **Rivalry moment** | ~15% | Bond check | Negative bond = trash talk (bond -0.3, pop -1). Positive = respectful nod (+0.3) |
| **Encouragement/whipping** | ~25% | Bond check | High bond = encourage (bond +0.5). Low bond = whipping (bond -1.0, pop -1, but +attempt bonus) |

### Sub-Phase B: Baby Carriage Race

Pushers sprint the carriage (carrying baby + apple) to the finish line. 4 segments.

**Race Mechanics:**

Each segment, team speed = average of all pushers' `physical * 0.07 + endurance * 0.04 + noise(2.5)`, modified by:
- **Carriage weight** from Phase 1: Light = x1.15, Standard = x1.00, Heavy = x0.85
- **Accumulated fatigue**: Small penalty per segment. Endurance-heavy teams degrade slower.

**The Baby's Role — Active Passenger:**

Each segment, baby auto-selects one action (based on highest stat + noise):
- **Navigator call** (`mental * 0.07 + noise(2.5)`): Spots shortcut/obstacle. Success = time bonus. Fail = bad call, slight penalty.
- **Apple balance** (`endurance * 0.06 + noise(2.5)`): Keeps apple steady over bumps. Fail = wobble, pushers slow. Critical fail = apple falls out, full stop.
- **Morale boost** (`social * 0.07 + noise(2.5)`): Cheers pushers. Success = speed boost. Fail = whining, bond -0.3.

**Carriage Race Events:**

| Event | Chance | Mechanic | Consequence |
|---|---|---|---|
| **Carriage swap sabotage** | ~30% if `carriageSwapReady` | `intuition * 0.07 + noise(2.5)` to detect | **Undetected**: Chris rejects at finish, run back to swap. Saboteur: +5 score, pop -2, bond -1 with ALL victims. Camp event. **Detected**: Small time penalty only. Saboteur: pop -3, bond -2 with detector, "caught cheating" camp event |
| **Pothole** | ~20%/segment | `physical * 0.06 + noise(2.5)` | Fail: carriage jolts, baby emergency balance check. Time penalty |
| **Wheel falls off** | ~8% | `physical * 0.07 + noise(2.5)` | Fail: full stop, 2-segment equivalent penalty. Pass: quick fix, pop +1 |
| **Cross-tribe collision** | ~15% when close | Speed comparison + noise | Slower tribe knocked aside. Bond -0.5 |
| **Baby drops apple** | ~10% | `endurance * 0.06 + noise(2.5)` | Apple rolls away. Big time penalty. Baby blamed: bond -0.5 with pushers |
| **Final sprint** | Guaranteed, last segment | `physical * 0.05 + endurance * 0.05 + boldness * 0.03 + noise(2.5)` averaged | Determines final burst |
| **Overtake** | Auto on position change | Narrative only | Tribe header + dramatic narration |

**Social Events During Race:**
- Pusher encouragement/whipping (1-2 per segment)
- Baby-pusher bickering (~15%): Baby criticizes speed. Bond -0.5. Archetype-driven tone.
- Team bonding under pressure (~15%): Pushers sync up. Bond +0.5.
- Cross-tribe trash talk (~10%): Taunts. Bond -0.5, pop -1.

---

## Results & Scoring

- **Tribe placement**: Total accumulated time across all 3 phases. Fastest wins.
- **Bridgette Rule**: Not applicable (no one gets left behind).
- **`chalMemberScores`**: Accumulated from all events — climb successes, paddle contributions, bobbing attempts, push speed, hero moments, sabotage points.
- **Immunity winner**: None (tribe challenge). Winning tribe gets immunity.
- **Losing tribe**: Goes to tribal council.
- **Popularity**: Hero moments (gator fight, stuck rescue, spectacular bob) = pop +1 to +3. Dirty play (splash war, carriage swap, whipping) = pop -1 to -3.
- **Heat from carriage swap**: `gs._broadwayBabyHeat` stores `{ target, amount: 3, expiresEp: epNum + 3 }`. Flows into vote targeting.
- **Camp events injected**: Hero saves, sabotage (caught/uncaught), gator fight, whipping, navigator blame — all with `players[]` and badge text.

---

## VP Identity

TBD — to be designed during implementation. Should be thematically distinct from all existing challenges. No real-world geography in any narration or visual text.

---

## Integration

Standard 7-file integration per CLAUDE.md:
1. `core.js` — TWIST_CATALOG entry
2. `twists.js` — `ep.isBroadwayBaby = true` flag
3. `episode.js` — 7+ edits (import, dispatch, skip, guard, hasTwist, exile, all history pushes)
4. `vp-screens.js` — import VP builders + screen registration
5. `text-backlog.js` — import + `_textTwistChallenge()` call
6. `main.js` — import module + spread
7. `run-ui.js` — badge tag
