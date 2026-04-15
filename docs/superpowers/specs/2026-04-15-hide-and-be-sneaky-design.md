# Hide and Be Sneaky — Challenge Design Spec

**Date:** 2026-04-15
**Phase:** Post-merge only
**ID:** `hide-and-be-sneaky`
**File:** `js/chal/hide-and-be-sneaky.js`
**Immunity:** 1-2 winners (tightly controlled)
**Engine:** Sequential round-by-round simulation
**VP Theme:** Night-vision surveillance (dark greens, scanlines, tactical HUD)

---

## Overview

Post-merge hide-and-seek manhunt. Players hide across the island, Chef Hatchet hunts them with a water gun. Found players can attempt to escape to home base or betray remaining hiders by feeding Chef intel. If 2+ players survive the hunt, a cat-and-mouse showdown determines the immunity winner.

Based on Total Drama Island S1E17 "Hide and Be Sneaky."

---

## Phase 1: Hide (Setup)

Each player picks a hiding spot. Spot quality is stat-driven:

**Hiding Quality** = `mental * 0.3 + intuition * 0.25 + physical * 0.2 + social * 0.15 + boldness * 0.1 + noise(-1.5, 1.5)`

- Mental: clever spot selection (camouflage, breathing straw tricks)
- Intuition: reading the environment, anticipating Chef's search pattern
- Physical: accessing hard-to-reach spots (rooftop, tree, underwater)
- Social: knowing where others WON'T go, avoiding crowded areas
- Boldness: willingness to pick a risky high-reward spot (low boldness = safe but obvious)

### Observable Intel

Each player generates an `observedBy` map during the scramble — how much other players noticed about where they hid:

`observationScore = intuition * 0.5 + mental * 0.3 + noise`

This feeds Phase 3 betrayal intel quality.

### Hiding Spot Locations (15+ templates)

Assigned based on stat profile:

**Physical-oriented spots:**
- Rooftop of the main lodge (climb required)
- Top of a tall tree (swaying in wind)
- Underwater near the dock (breathing straw)
- Hanging from bridge underside
- Up in the rock climbing wall
- Inside a canoe flipped on the beach

**Mental-oriented spots:**
- Grass camouflage (lying flat, covered in foliage)
- Inside a hollowed-out log
- Behind the waterfall curtain
- Buried under sand at the beach
- Disguised as part of a totem pole display
- Inside a supply crate with breathing holes

**Social/stealth-oriented spots:**
- Chef's own kitchen (hiding in plain sight)
- Behind the confessional outhouse
- Inside the communal shower stalls
- Under the dock in the stilts
- Tucked inside the campfire pit (cold ashes)

**Boldness-oriented (high-risk/high-reward):**
- Stalking Chef Izzy-style (following his movements, hiding when he turns)
- Inside Chris's trailer (risky but comfortable)
- On the elimination dock itself (who'd look there?)
- Perched on the outhouse roof

### Archetype Touches

- **Wildcard/chaos-agent:** chance of the "stalking Chef" Izzy-style strategy. Bonus hiding quality if successful (`boldness * 0.4 + intuition * 0.3 + physical * 0.3` check), auto-found on failure.
- **Challenge-beast:** gravitates toward physical spots (rooftop, tree, underwater)
- **Schemer/mastermind:** picks spots near other players to gather intel (boosted `observedBy` for others)
- **Social-butterfly:** finds a spot where they can monitor traffic, high observation scores
- **Underdog:** finds a surprisingly good spot despite expectations — underdog bonus to hiding quality
- **Loyal-soldier:** picks a spot near their strongest ally, buddy potential
- **Hothead:** impatient, may pick a spot too quickly — small hiding quality penalty but fast setup
- **Floater:** blends in, unremarkable spot but solid — consistent middle-tier hiding quality
- **Perceptive-player:** excellent at reading the environment — bonus to hiding quality from intuition
- **Hero:** picks a spot where they can see others in danger — high observation, average hiding
- **Villain:** strategic spot selection aimed at watching rivals — high observation, moderate hiding
- **Goat:** poor spot selection, easily found — hiding quality penalty
- **Showmancer:** tries to hide near their partner — if both nearby, bond moment but shared risk

---

## Phase 2: Hunt

Chef searches in rounds. Round count: `Math.ceil(playerCount * 0.7)` — enough to find most but not all players.

### Round Structure

Each round:
1. Chef's detection roll = `baseDetection + (roundNumber * escalationBonus)`
2. Compare against each hidden player's current hiding quality
3. Lowest quality hider vs threshold — found or safe this round
4. 3-4 events fire with gameplay effects (hiding quality bonuses/maluses)
5. If a player is found: immediate escape check

### Events (3-4 per round)

Events directly modify hiding quality, creating meaningful swings.

**Detection Events (blow cover — hiding quality MALUS):**
- **Sneeze/cough:** hiding quality -1.5. Chef redirects toward that area.
- **Trip a wire / knock something over:** hiding quality -2.0. Immediate disadvantaged detection check.
- **Animal encounter** (skunks spray, bird nests on head, squirrel attacks): hiding quality -1.0 to -2.5 depending on severity.
- **Phone/item drops:** hiding quality -1.5. Noise alert.
- **Panic breathing:** low boldness players, hiding quality -0.5 per round (cumulative pressure).
- **Argument at shared spot:** two hiders too close, both take -1.5 penalty.
- **Cramp/discomfort:** physical check or -1.0 penalty. Long hiders in awkward positions.
- **Bug swarm:** hiding quality -1.0. Hider swatting at bugs draws attention.
- **Stomach growl:** hiding quality -1.0. Comedy beat.
- **Hiding spot deteriorates:** branch cracks, sand shifts, crate lid loosens — hiding quality -1.5.

**Evasion Events (help hiders — hiding quality BONUS):**
- **Reposition:** high intuition player senses Chef's path, moves to a new spot. Re-roll hiding quality with +1.5 bonus.
- **Distraction:** wildlife or environmental noise draws Chef away. Skip one detection check for nearest hider. +1.0 temporary.
- **Camouflage improve:** mental check success = +1.5 hiding quality. Player enhances their spot.
- **Buddy system:** two nearby hiders coordinate, one creates noise to draw Chef elsewhere. Helper takes -1.0, partner gets +2.0. Bond boost +1.
- **Perfect stillness:** high mental + intuition. Player achieves zen calm. +1.0 hiding quality.
- **Environmental cover:** rain puddle, falling leaves, shadow shift. +1.0 to outdoor hiders.
- **Chef gets distracted:** Chef checks his phone, argues with Chris on walkie — all hiders get +0.5 this round.
- **Decoy works:** a previously set-up decoy (mental check at hide phase) draws Chef to empty area. +1.5 to the planner.

**Environmental Events (chaos — variable BONUS/MALUS):**
- **Rain starts:** outdoor spots -1.0, indoor spots +1.0. Persists.
- **Wind picks up:** tree/rooftop spots -1.5, physical check or forced relocation. Ground spots unaffected.
- **Chef checks a decoy location:** wastes round. All hiders +0.5 temporary relief.
- **Power outage:** indoor hiders +1.5 (darkness), outdoor unaffected.
- **Animal stampede:** multiple hiders in one area all take -1.0, Chef drawn to commotion.
- **Sunset/darkness falling:** late-round global +1.0 to all hiding quality (harder to see).
- **Fog rolls in:** +1.0 to all hiding quality. Atmospheric.
- **Chris announces over loudspeaker:** startles everyone, all hiders -0.5. Comedy.

**Social Events (bond/heat consequences + hiding quality shifts):**
- **Hider spots another hider:** information gained for potential Phase 3 betrayal. No quality shift but intel boost.
- **Caught player taunts hider:** reveals general area, target takes -1.5 hiding quality. Bond damage -1.
- **Silent solidarity:** two hiders make eye contact, stay quiet. Bond +1. Both get +0.5 hiding quality (mutual awareness).
- **Showmance moment:** partners near each other, whispered comfort. Bond +1, romance intensity +1. Risky — both -0.5 hiding quality from noise.
- **Rivalry flare:** enemies near each other, one considers sabotage. Villain/schemer may actively worsen rival's spot — target -1.5. Bond damage -2.
- **Caught player cheers for hider:** from the caught pool, shouts encouragement. Target gets small hiding quality boost +0.5 but Chef now knows the general area -1.0. Net -0.5 but bond +1.

**Round pacing:** Early rounds lean evasion/environmental. Later rounds shift toward detection/social as pressure mounts.

### Escape Check (When Found)

`escapeScore = physical * 0.35 + boldness * 0.3 + endurance * 0.2 + noise(-1.5, 1.5)` vs Chef's spray accuracy.

- Success (~15-20% chance): dash to home base, win immunity.
- Failure: soaked, eliminated, enters caught pool for Phase 3.
- 2-3 narrative beats per escape attempt: dodge spray, sprint, slide into base / get hit.

---

## Phase 3: Betrayal

Caught players decide whether to rat out remaining hiders to Chef.

### Willingness to Betray (Archetype-Driven)

Per CLAUDE.md archetype behavior rules:

- **Villain/mastermind/schemer:** always willing. Pick lowest-bond target among remaining hiders.
- **Nice archetypes** (hero, loyal-soldier, social-butterfly, showmancer, underdog, goat): refuse. Small popularity boost (+1) for loyalty.
- **Neutral archetypes** (hothead, challenge-beast, wildcard, chaos-agent, floater, perceptive-player): willing only if `strategic >= 6 AND loyalty <= 4`. Target based on rivalry/lowest bond.

### Intel Quality (Stat-Driven)

Uses Phase 1's `observedBy` data:

`intelScore = intuition * 0.4 + mental * 0.3 + strategic * 0.3`

- **High intel (score > 7):** accurate info — target takes -3.0 hiding quality penalty. Chef goes straight to them.
- **Medium intel (score 4-7):** vague direction — target takes -1.5 penalty.
- **Low intel (score < 4):** bad lead — target takes -0.5 penalty. Chef wastes partial round.

### Betrayal Consequences

- **Target's hiding quality** reduced by intel-proportional amount.
- **Bond damage:** betrayer → target: -2 to -4.
- **If target survives anyway:** target learns who ratted. Extra -2 bond damage. Revenge heat: `gs._hideSeekHeat = { betrayer, target, amount, expiresEp: currentEp + 3 }`.
- **If target found because of rat-out:** caught player gets "tracker" badge. Narrative blame moment.
- **Popularity:** betrayers take popularity hit proportional to target's likability. Villains take reduced hit (expected behavior), neutrals take full hit.
- **Expose moment:** high-intuition hider still hidden may overhear the betrayal. Gains intel on betrayer's true loyalties. Feeds into future camp events / social manipulation.

### Refusal Bonus

Players who refuse to betray get:
- "Loyal" badge
- Bond boost +1 with all remaining hiders (discovered post-challenge)
- Popularity +1

---

## Phase 4: Escape (Fight-or-Flight)

When a hider's hiding quality drops below a danger threshold (from hunt events + betrayal maluses), they face a fight-or-flight decision.

### Decision Trigger

`dangerThreshold = Chef's current detection - 1.5`

When `currentHidingQuality < dangerThreshold`, the player must choose.

### Stay Hidden

- Gamble that Chef misses them: `survivalChance = currentHidingQuality / chefDetection`
- Success: hiding quality stabilizes with +1.0 adrenaline focus boost
- Failure: caught, straight to caught pool (no escape attempt)

### Break for Home Base

`escapeScore = physical * 0.3 + boldness * 0.25 + endurance * 0.25 + intuition * 0.2 + noise`

vs Chef's spray accuracy (increases with fewer remaining targets).

- Success: immunity win
- Failure: soaked, caught pool

**Chase beats** (2-3 per runner):
- Dodge a spray
- Vault an obstacle
- Slide into base / get hit at the last second
- High boldness = flashier moves (Izzy-style window jumps, combat rolls)

### Decision AI

- High boldness + high physical → break for it
- High mental + good hiding quality → stay hidden
- Low boldness → stay hidden even when it's the wrong call (freezing under pressure)
- **Challenge-beast:** prefers the run
- **Mastermind:** prefers to wait
- **Wildcard:** coin flip — unpredictable

### Multiple Runners

If 2+ players break cover in the same round, Chef prioritizes highest threat (best escape score) first. Second runner gets a better chance — natural "sacrifice" dynamic.

---

## Phase 5: Showdown (Cat-and-Mouse Chase)

**Trigger:** Hunt rounds end with 2+ players still hidden.
**Skip:** If only 1 remains, they win immunity automatically.

### Setup

Chef deploys a final sweep — smoke bombs, noise makers — flushing all remaining hiders simultaneously. Everyone must run.

### Per-Player Chase Sequence (3-4 beats each)

**Beat types:**

- **Dodge:** Chef fires, player evades. `physical * 0.3 + intuition * 0.3 + boldness * 0.2 + noise` vs spray accuracy.
- **Obstacle:** Fence, fallen tree, muddy creek. `physical * 0.4 + boldness * 0.3 + noise`. Fail = stumble, lose ground.
- **Shortcut gamble:** Risky path (through kitchen, across rooftop). `mental * 0.3 + boldness * 0.4 + noise`. Success = big distance gain. Fail = dead end, Chef closes in.
- **Last stand:** Cornered, one final move. Izzy-style combat, window dive, fake-out juke. `boldness * 0.4 + physical * 0.3 + social * 0.15 + noise`. Highest drama beat.
- **Teammate interference:** Caught player in Chef's entourage helps or blocks runner based on bond.
  - Positive bond: "accidentally" trips Chef. Bond boost +2.
  - Negative bond: points Chef the right way. Bond damage -2 to -3.

### Scoring

Each beat adds or subtracts from a running escape score. After all beats resolve, **highest total escape score wins immunity**. Only the best performer wins — rest get caught.

### Special Moments

- **Showmance sacrifice:** If two showmance partners are both in the showdown, one may sacrifice their run to buy the other time (loyalty + romance intensity check). Huge bond +3 / popularity +3 moment.
- **Rivalry sabotage:** If two rivals are both running, they sabotage each other mid-chase — shove, trip, cut off path. Both take escape score penalties. Bond damage -2.

---

## Immunity, Heat & Consequences

### Immunity Winners (1-2 max)

- Last hider standing (if only 1 survives hunt without showdown)
- Showdown winner (best chase performance)
- Rare: home base escape during Phase 2 or Phase 4 (~15-20% per attempt, tuned so 0-1 typically succeed)

### Heat: `gs._hideSeekHeat`

```javascript
gs._hideSeekHeat = { betrayer, target, amount, expiresEp: currentEp + 3 }
```

- Betrayers accumulate heat with their targets
- Ratted-out-and-eliminated players get extra targeting motivation
- Feeds into `computeHeat` for vote targeting

### Bond Changes

| Event | Bond Change |
|---|---|
| Betrayal | -2 to -4 (betrayer → target) |
| Survived despite betrayal | additional -2 (target learns) |
| Silent solidarity | +1 |
| Buddy system | +1 |
| Showmance moment | +1 to +2 (romance intensity) |
| Teammate interference (positive) | +2 |
| Teammate interference (negative) | -2 to -3 |
| Loyalty refusal | +1 with all remaining hiders |
| Showmance sacrifice | +3 |
| Rivalry sabotage | -2 |

### Popularity Changes

| Event | Popularity Delta |
|---|---|
| Immunity winner | +2 |
| Loyal refusal to betray | +1 |
| Flashy Izzy-style escape/combat | +2 |
| Betraying a well-liked player | -1 to -3 |
| Embarrassing catch (animal, sneeze) | -1 |
| Heroic showmance sacrifice | +3 |
| Stalker strategy (success) | +2 |
| Stalker strategy (failure) | -1 |

### Badges

| Badge ID | Meaning |
|---|---|
| `hideSeekImmune` | Immunity winner |
| `hideSeekTracker` | Betrayed someone who got found because of it |
| `hideSeekLoyal` | Refused to betray |
| `hideSeekStalker` | Izzy-style "stalking Chef" strategy |
| `hideSeekFlush` | Caught in an embarrassing way |
| `hideSeekClutch` | Escaped to home base under pressure |

---

## VP Screen — Night-Vision Surveillance Theme

### Visual Identity

- Dark background: `#0a0f0a`
- Primary green: `#00ff41`
- Accent green: `#33ff66`
- Scanline overlay: CSS repeating-gradient
- "SURVEILLANCE FEED" header with blinking REC dot
- Player status tags: `[HIDDEN]` `[FOUND]` `[SOAKED]` `[IMMUNE]` `[TRACKING]`
- Tactical/monospace font for status readouts

### Screen Structure (Click-to-Reveal)

Uses `_tvState['hideSeek']` with `idx: -1` pattern.

1. **Mission Briefing** — challenge rules, player count, Chef's threat level
2. **Phase 1: Deployment** — each player's hiding spot with location flavor text. Reveal one at a time.
3. **Phase 2: Hunt Rounds** — round-by-round reveals:
   - "SCANNING SECTOR [area]..." header
   - 3-4 event cards with hiding quality shift indicators (green ↑ / red ↓)
   - Found/escape resolution with spray animation text
   - Running status board: hidden / caught / escaped
4. **Phase 3: Intel Report** — betrayal decisions revealed one at a time. "INTEL UPLOAD" or "SIGNAL REFUSED" badges. Bond damage shown.
5. **Phase 4: Perimeter Breach** — fight-or-flight decisions and escape attempts. Chase beats with outcomes.
6. **Phase 5: Final Pursuit** — showdown chase sequences beat by beat. Dramatic reveals per runner.
7. **Debrief** — final status board. Immunity winners: "OPERATIVE EXTRACTED" tag. Heat/bond summary.

### Status Tracker Sidebar

Persistent across reveals. Player list with live status icons updating as reveals progress. Hidden count, caught count, immune count.

---

## Text Backlog

### `_textHideAndBeSneaky(ep, ln, sec)`

1. **"Hide and Be Sneaky"** — opening. Player count, Chef's briefing, stakes.
2. **"The Hiding Phase"** — notable spot picks. Clever spots, bad spots, stalkers. 3-4 lines.
3. **"The Hunt"** — round highlights. First found, close calls, animal chaos, biggest quality swings. Key moments only.
4. **"Betrayal and Loyalty"** — who ratted, who stayed loyal, consequences. Bond/heat changes.
5. **"The Chase"** — escape attempts and showdown. Beat-by-beat for winner. Flashy moments.
6. **"Immunity Results"** — who won, how. Final status.

### Cold Open

One dramatic moment previewed at episode start — close call, betrayal reveal, or clutch escape.

### Timeline Tag

`"Hide and Be Sneaky"` in episode timeline.

### Episode History

Stored in `ep.hideAndBeSneaky` with full phase data for save/load serialization.

---

## Integration Points

- **Challenge dispatch:** register in `CHALLENGE_DISPATCH` in `main.js`
- **Episode trigger:** `if (ep.isHideAndBeSneaky) simulateHideAndBeSneaky(ep)` in `episode.js`
- **VP screens:** push to `vpScreens` in `vp-screens.js`
- **Heat:** `gs._hideSeekHeat` consumed by `computeHeat` in `alliances.js`
- **Showmance moments:** `_checkShowmanceChalMoment()` integration
- **Romance sparks:** `_challengeRomanceSpark()` for proximity-based sparks during hiding
- **Social manipulation:** betrayal data feeds camp event targeting (expose schemer, comfort victim)
- **`updateChalRecord`:** skip main scoring, handle internally
- **`patchEpisodeHistory`:** register for save/load
- **Popularity:** all events that are heroic/villainous/embarrassing update `gs.popularity`
