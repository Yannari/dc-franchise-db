# That's Off the Chain! — Challenge Design Spec

**Date:** 2026-04-15
**Phase:** Post-merge only
**ID:** `off-the-chain`
**File:** `js/chal/off-the-chain.js`
**Immunity:** 1 winner (first place finisher in Part 2)
**Elimination:** Last place finisher auto-eliminated (if sudden death active) OR normal tribal with heat
**VP Theme:** Motocross demolition derby (orange flame, hazard stripes, mud splatter, explosions)

---

## Overview

Build-a-bike + swap + two-part race challenge. Players build bikes, swap randomly, race someone else's bike in Part 1 (qualifying). If your bike crosses the finish line, you advance to Part 2 riding your own bike through a 3-obstacle gauntlet (land mines, oil slick, piranha pool jump). Bikes can be destroyed mid-race — which paradoxically saves you from last-place elimination. First place wins immunity, last place is eliminated or targeted.

Based on Total Drama Island S1E18 "That's Off the Chain!"

---

## Phase 1: Build

Each player builds a bike. Quality is stat-driven:

**Bike Quality** = `mental * 0.3 + physical * 0.25 + intuition * 0.2 + strategic * 0.15 + boldness * 0.1 + noise(-1.5, 1.5)`

- Mental: reading the manual, engineering the frame
- Physical: hammering, welding, tightening bolts
- Intuition: knowing which parts are good vs junk
- Strategic: planning the design for race advantage
- Boldness: willingness to try unconventional builds (high risk/reward)

**Archetype bonuses/penalties:**
- Challenge-beast: +1.5
- Mastermind/schemer: +1.0
- Hothead: -1.0 (rushes the build)
- Goat: -2.0 (terrible build)
- Wildcard/chaos-agent: extra noise +/-2.0 (high variance)
- Underdog: +0.5
- Floater: +0.3
- Perceptive-player: +0.5
- Social-butterfly: -0.5 (too busy socializing)
- Showmancer: -0.5 (distracted by partner)

**Bike HP** = `bikeQuality * 10` (range ~20-100)

**Bike cosmetic label:** Each player gets a personality-based bike name (flavor text). Generated from archetype + personality.

### Build Events (2-3 per challenge, with gameplay effects)

**Sabotage** (villain/schemer archetypes only):
- Saboteur loosens bolts / swaps bad parts on a target's bike
- Damage: target bike quality -1.5 to -2.5 (based on `saboteur strategic * 0.4 + mental * 0.3 + noise`)
- Hidden damage — owner doesn't know until the race
- Detection chance: target or nearby player with high intuition may catch it (`intuition * 0.4 + noise > 6`). If caught: sabotage partially undone (-0.5 instead of full penalty), saboteur exposed, bond damage -2, popularity -1.
- Archetype rules: villains/schemers always eligible. Neutrals need strategic >= 6 + loyalty <= 4. Nice archetypes never.

**Help** (nice archetypes):
- Hero/loyal-soldier helps a struggling builder (lowest quality bike so far)
- Target bike quality +1.0 to +1.5
- Bond +2 between helper and target

**Parts theft:**
- Schemer/villain grabs the best parts before others
- Saboteur bike quality +0.5, one random other player -0.5

**Showmance distraction:**
- If player is in a showmance, partner keeps visiting. Bike quality -0.5 but romance intensity +1.

**Manual drama:**
- One player gets the moldy bike manual. Mental check to decipher it. Success: +1.0 bike quality. Fail: +0.0 (wasted time).

**Wildcard speed build:**
- Wildcard/chaos-agent finishes impossibly fast (like Izzy). Bike quality uses double noise (could be amazing or terrible).

**Chris judging:** After build, Chris comments on each bike. Stored for VP flavor.

---

## Phase 2: Swap & Part 1 Race

### The Swap

Random draw — each player gets assigned someone else's bike. No one rides their own.

`riderAssignments = { rider: bikeOwner }` — random permutation with no fixed points (derangement).

### Part 1: Qualifying Race

Riders race on someone else's bike. Score determines who crosses the finish line.

**Race Score** = `rider physical * 0.3 + rider endurance * 0.25 + rider boldness * 0.2 + bikeQuality * 0.25 + noise(-2, 2)`

**Finish threshold:** Sort all riders by score. Use gap detection to find the natural break point around 50-60% of the field. The biggest score gap in the middle of the pack determines the cut line. Minimum 3 advance, maximum `n - 2` advance.

**Riders above threshold:** Cross the finish line. The bike's OWNER advances to Part 2.
**Riders below threshold:** Fail to finish. The bike's OWNER is eliminated from the challenge (doesn't race in Part 2).

**Part 1 damage:** Bikes that cross the finish line take minor wear damage: `bikeHP -= (10 - riderScore) * 2` (better riders preserve the bike). Bikes that fail to finish take heavy damage but it doesn't matter — they're out.

### Part 1 Events (2-3 per race)

- **Near-crash:** Low-score rider wobbles dangerously. Race score -0.5.
- **Drafting:** Two riders near each other in score, one drafts behind. Follower gets +0.5.
- **Handlebar wobble:** Sabotaged/low-quality bike acting up. Race score -1.0.
- **Unfamiliar quirks:** Rider confused by bike's unconventional build. Race score -0.5 to -1.0 based on bike builder's boldness (weirder bike = more confusing).
- **Bike falls apart mid-race:** Very low HP bike has a chance of catastrophic failure. Dramatic moment — wheel flies off, chain snaps.
- **Competitive trash talk:** Two rivals riding near each other. Bond -1, but winner gets +0.5 score from motivation.
- **Chris commentary:** Chris calls the action from his ATV.

---

## Phase 3: Part 2 — Obstacle Gauntlet

Players who advanced ride **their own bikes** through 3 obstacles. Familiarity bonus: +1.5 to all checks.

Bike HP carries over from Part 1 (including sabotage damage and Part 1 wear).

### Obstacle 1: Land Mines

**Dodge Score** = `intuition * 0.35 + boldness * 0.25 + (bikeHP/100) * 0.2 + noise(-2, 2) + familiarityBonus`

Outcomes:
- Score >= 7: clean weave, no damage, +0 time penalty
- Score 4-7: clip 1-2 mines, 10-20 HP damage, moderate time penalty
- Score < 4: hit multiple mines, 25-35 HP damage, big time penalty

**Catastrophic breakdown chance** after damage: `(100 - bikeHP) * 0.008 + noise(0, 0.1)`. If triggered: bike destroyed, rider is OUT but SAFE.

### Obstacle 2: Oil Slick

**Control Score** = `physical * 0.3 + endurance * 0.25 + (bikeHP/100) * 0.2 + noise(-2, 2) + familiarityBonus`

Outcomes:
- Score >= 7: power through, minimal slide, 0-5 HP damage
- Score 4-7: fishtail and recover, 15-25 HP damage, time penalty
- Score < 4: full wipeout, 30-40 HP damage, massive time penalty

**Cascading failure:** If bike HP is below 40% before this obstacle, breakdown chance doubled.

### Obstacle 3: Piranha Pool Jump

**Jump Score** = `physical * 0.3 + boldness * 0.35 + (bikeHP/100) * 0.2 + noise(-2, 2) + familiarityBonus`

Outcomes:
- Score >= 7: clear the jump, dramatic landing, 0-5 HP damage
- Score 4-7: barely clear, bike lands hard, 15-25 HP damage
- Score < 4: don't clear the jump, land in piranhas, bike destroyed (rider safe)

**Bike weight penalty:** Damaged bikes (low HP) have reduced jump distance. `jumpPenalty = (100 - bikeHP) * 0.02`.

### Per-Obstacle Events (1-2 per obstacle)

- **Close call:** Rider barely dodges/clears, dramatic slow-mo moment
- **Showmance moment:** Partner watching from sideline, cheering or gasping
- **Rivalry push:** Two riders neck-and-neck, one tries to edge the other toward danger
- **Bike smoking/rattling:** Damaged bike showing signs of imminent failure
- **Clutch save:** Rider recovers from near-disaster (high boldness check)
- **Spectacular wipeout:** Dramatic crash sequence (2-3 narrative beats)
- **Chris play-by-play:** Host commentary on close moments

### Destruction & Finishing

After each obstacle, check bike HP:
- **HP <= 0:** Bike destroyed. Rider is OUT of race but SAFE from elimination. Explosion/crash VP card.
- **HP > 0:** Continues to next obstacle.

After all 3 obstacles, surviving riders get a **final race time**:

**Race Time** = base time - (`rider physical * 0.2 + rider endurance * 0.2 + bikeHP * 0.01 + obstacle bonuses - obstacle penalties`)

Lower time = better placement. Ranking determines immunity and elimination.

---

## Phase 4: Elimination Reactions

When the last-place finisher is determined, generate reaction events.

### Betrayal Confrontation
If eliminated player's bike was sabotaged:
- Eliminated player calls out the saboteur (2-3 beats: shock → accusation → response)
- Saboteur reaction by archetype: villain smirks, nice feels guilty, neutral deflects
- Bond damage -3 to -5
- Other players react: allies side with eliminated, rivals stay quiet
- Popularity: eliminated +2 (sympathy), saboteur -2

### BFF Betrayal (Lindsay/Heather moment)
If eliminated player had high bond (6+) with someone who contributed to elimination (sabotaged their bike, or rode their bike poorly in Part 1):
- Multi-beat confrontation: shock → denial → anger → epic callout (3-4 beats)
- Callout intensity scales with bond strength
- Other players cheer for the underdog
- Popularity: eliminated +3, betrayer -3
- Bond: drops to -5 (complete relationship destruction)

### Alliance Fracture
If eliminated player was in a named alliance with the person responsible:
- Alliance may dissolve
- "I thought we were in this together!" moment
- All alliance members react

### Showmance Heartbreak
If eliminated player is in a showmance:
- Tearful goodbye moment
- Partner rages at whoever caused it, or grieves
- Bond +2 (bittersweet goodbye)
- Romance intensity check: might survive as long-distance or break

### Graceful Exit
If no drama applies (clean elimination):
- Hugs, goodbyes, "I'll miss you most" moment
- Gets names wrong (Lindsay-style)
- Final words / confessional moment
- General fondness: bond +1 with highest-bond active player

Stored as `ep.bikeRace.eliminationReaction = { type, players, beats: [] }`.

---

## Immunity, Heat & Consequences

### Immunity
1 winner — first place finisher in Part 2.

### Sudden Death Mode (twist active)
- Last place finisher in Part 2 is auto-eliminated. No tribal council.
- Destroyed bikes = safe (didn't finish, didn't place last)
- If only 1 finisher: wins immunity, no elimination (can't be last alone)

### Normal Mode (no sudden death)
- Normal tribal council
- Last place gets heat: `gs._bikeRaceHeat = { target: lastPlace, amount: 3.0, expiresEp: currentEp + 3 }`
- Destroyed bikes get mild heat: amount 1.5 (looked weak)

### Bond Changes

| Event | Bond Change |
|---|---|
| Sabotage | -2 (saboteur → target) |
| Sabotage detected | additional -2 (target learns) |
| Build help | +2 |
| Showmance distraction | +1 romance intensity |
| Competitive trash talk | -1 |
| BFF betrayal confrontation | drops to -5 |
| Showmance goodbye | +2 |
| Graceful exit | +1 with closest ally |

### Popularity Changes

| Event | Popularity Delta |
|---|---|
| Immunity winner | +2 |
| Built the best bike | +1 |
| Bad bike failed Part 1 rider | -1 |
| Bike destroyed (embarrassing) | -1 |
| Last place finish | -2 |
| Saboteur exposed | -1 |
| BFF betrayal victim (sympathy) | +3 |
| BFF betrayer | -3 |
| Clutch save moment | +1 |

### Badges

| Badge ID | Text | Color |
|---|---|---|
| `bikeRaceImmune` | Won the Race | gold |
| `bikeRaceBuilder` | Best Bike | green |
| `bikeRaceWreck` | Bike Destroyed | gray |
| `bikeRaceLast` | Finished Last | red |
| `bikeRaceSaboteur` | Sabotaged a Bike | red |
| `bikeRaceClutch` | Survived on Fumes | gold |

---

## VP Theme: Motocross Demolition Derby

### Visual Identity

- Dark background: `#1a1008` (dark mud brown)
- Primary: `#ff6b00` (orange flame)
- Accent: `#ffd700` (gold checkered flag)
- Danger: `#ffcc00` hazard yellow + `#1a1a1a` black stripes
- Destruction: `#ff3333` (explosion red)
- Mud splatter: CSS radial gradients with brown splotches
- Checkered flag pattern on headers
- Speed lines on race events (diagonal CSS stripes)
- Explosion burst on bike destruction cards
- Font: bold/condensed for race feel

### Screen Structure (Click-to-Reveal)

1. **Starting Grid** — bike builds with quality ratings, cosmetic labels, Chris judging quips. Build events revealed one at a time.
2. **The Swap** — "Draw names out of a helmet" dramatic reveal. Each assignment revealed one at a time.
3. **Part 1: Qualifying Race** — per-rider results with events. Finishers vs failures revealed.
4. **The Cut** — who advances to Part 2. Bikes that survived listed with remaining HP shown as a damage bar.
5. **Part 2: Obstacle Gauntlet** — per-obstacle rounds. Each obstacle header + per-rider results revealed. Destruction cards with explosion effects. Catastrophic breakdowns as dramatic moments.
6. **Finish Line** — final ranking. Immunity winner highlighted. Last place fate revealed.
7. **Aftermath** — elimination reaction beats revealed one at a time. BFF betrayal confrontation, alliance fracture, showmance heartbreak, or graceful exit.
8. **Wreckage Report** — debrief with all badges, bond changes, damage summary.

### Status Tracker
Persistent header: `RACING: X | WRECKED: Y | FINISHED: Z`
Updates as reveals progress.

---

## Integration Points

- **Challenge dispatch:** register in `CHALLENGE_DISPATCH` in `main.js`
- **Episode trigger:** `if (ep.isOffTheChain) simulateOffTheChain(ep)` in `episode.js`
- **VP screens:** push to `vpScreens` in `vp-screens.js`
- **Heat:** `gs._bikeRaceHeat` consumed by `computeHeat` in `alliances.js`
- **Twist catalog:** add to `TWIST_CATALOG` in `core.js` with `phase: 'post-merge'`
- **Sudden death compatibility:** check `ep.isSuddenDeath` or equivalent twist flag for auto-elimination vs tribal
- **Showmance moments:** `_checkShowmanceChalMoment()` integration
- **`updateChalRecord`:** skip main scoring, handle internally
- **`patchEpisodeHistory`:** register for save/load
- **Popularity:** all events update `gs.popularity`
- **Pre-twist screen exclusion:** add to filter in `rpBuildPreTwist`
- **Episode history tag:** add tag in `run-ui.js`
- **Debug tab:** add to challenge debug condition in `vp-screens.js`
- **Badge registration:** inject as camp events
