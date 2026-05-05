# Rock the Dock — Challenge Design Spec

**ID:** `rock-the-dock`  
**Phase:** Pre-merge (tribe challenge)  
**Style:** `physical`  
**Series:** `world-tour`  
**File:** `js/chal/rock-the-dock.js`  
**Min tribes:** 2

## Overview

Two-phase coastal relay. Tribes swim from a drop point to a fishing village dock, then race through a 4-leg relay on the dock. Captain election drives relay assignments — archetype determines assignment quality. Social events fire inline during each beat, not between phases.

No real-world references — the setting is a generic rugged coastal fishing village. No mentions of Newfoundland, Canada, or any real location.

---

## Phase 1: Ocean Swim Race

Every tribe swims from the ocean drop point to the dock. A quick formation debate precedes individual swim rolls.

### Formation Debate

Each tribe votes on a swim formation. One champion per formation advocates, persuasion roll picks winner. Bond consequences for winner/losers.

| Formation | Modifier | Best For |
|-----------|----------|----------|
| V-Formation | +0.1 to all if avg physical > 5, else -0.05 | Athletic tribes |
| Buddy System | +0.15 to weakest swimmer, -0.05 to strongest | Balanced tribes |
| Every Player for Themselves | +0.1 to top 2 physical, -0.1 to bottom 2 | Top-heavy tribes |

### Swim Roll

```
swimScore = physical * 0.06 + intuition * 0.04 + formationMod + noise(2.5)
pass = swimScore > 0.25
```

- **Strong swim:** +2 chalMemberScores, popDelta(+1), fast narration
- **Struggle:** -1 chalMemberScores, popDelta(-1), slow/panic narration
- **Rescued (lowest roll in tribe if < 0.1):** -2 chalMemberScores, teammate with highest physical auto-rescues (+2 rescuer, addBond(rescuer, rescued, +0.5), popDelta(rescuer, +1))

**Tribe swim time** = sum of individual penalties (struggles add time). Fastest tribe gets +3 tribe bonus.

### Swim Events (~35% per player)

| Event | Trigger | Modifier | Consequence |
|-------|---------|----------|-------------|
| Panic/water fear | Low boldness < 4 | -0.1 to roll | popDelta(-1) |
| Teammate encouragement | Nice archetype, bond > 1 | +0.1 to target's roll | addBond(+0.3), popDelta(encourager, +1) |
| Showoff stroke | Challenge-beast, high physical | +0.1 to own roll | popDelta(+1) |
| Cross-tribe splash war | Boldness > 6, cross-tribe | -0.05 to both | addBond(-0.3), popDelta(-1) |

### Between Phase 1-2

2-3 social events fire as tribes arrive at the dock:
- Arrival banter (faster tribes mock slower ones)
- Swim performance bonding/friction
- Captain election setup (foreshadowing who wants to lead)
- Showmance moment (~20% if active pair)

---

## Phase 2: Dock Relay

### Captain Election

One debate per tribe. Candidates self-nominate or get pushed forward by archetype:

- **Hothead/chaos-agent:** grabs leadership, may assign poorly (uses boldness over strategy)
- **Mastermind/schemer:** volunteers strategically, may sabotage a rival's assignment (assign enemy to their worst leg)
- **Hero/loyal-soldier:** steps up if nobody else does, assigns fairly by stats
- **Social-butterfly:** campaigns for it, assigns based on bonds (friends get easy legs)
- **Goat/floater:** gets volunteered by others ("you do it"), panics, semi-random assignments

Captain persuasion roll:
```
captainScore = social * 0.05 + strategic * 0.04 + noise(2.5)
```

Winner becomes captain. Bond friction if someone wanted it and lost.

### Assignment Quality

Captain assigns tribe members to 4 legs. Assignment fitness depends on captain archetype:

- **Good captain** (hero, mastermind, perceptive-player): matches members to their best stat leg ~80% of the time
- **Okay captain** (social-butterfly, loyal-soldier, challenge-beast): ~60% good matches
- **Bad captain** (hothead, chaos-agent, goat, floater): ~40% good matches
- **Scheming captain** (villain/schemer with bond < 0 toward a member): assigns rival to hardest leg on purpose, addBond(-0.5), popDelta(-1)

Mis-assigned players get a stat penalty on their leg roll (-0.1).

### The 4 Relay Legs

Each leg: one assigned member per tribe races simultaneously. 1-2 social events fire per leg (during or immediately after).

| Leg | Task | Roll | Pass |
|-----|------|------|------|
| 1. Chug | Drink jug of fish vinegar | physical * 0.05 + endurance * 0.05 + noise(2.5) | > 0.25 |
| 2. Decipher | Understand thick-accent local's sentence | mental * 0.06 + intuition * 0.05 + noise(2.5) | > 0.3 |
| 3. Stunt | Dock obstacle (rope climb, barrel haul) | physical * 0.06 + boldness * 0.04 + noise(2.5) | > 0.25 |
| 4. Fish Kiss | Kiss a cod "like you mean it" | social * 0.05 + boldness * 0.06 + noise(2.5) | > 0.25 |

**Per-leg scoring:**
- Pass (fast, score > threshold + 0.15): +3 chalMemberScores, popDelta(+1)
- Pass (slow, score > threshold but <= threshold + 0.15): +1 chalMemberScores
- Fail (score <= threshold): -2 chalMemberScores, popDelta(-1), tribe time penalty

### Per-Leg Social Events (1-2 per leg, ~50% each)

| Event | Trigger | Consequence |
|-------|---------|-------------|
| Teammate heckle | Hothead/chaos, any bond | addBond(-0.3), popDelta(heckler, -1) |
| Teammate cheer | Nice archetype, bond > 0 | +0.05 to performer's roll, addBond(+0.3) |
| Captain blame | Captain + performer failed | addBond(captain, performer, -0.5), popDelta(performer, -1) |
| Captain pride | Captain + performer passed fast | addBond(captain, performer, +0.3), popDelta(captain, +1) |
| Cross-tribe taunt | Bond < 0 across tribes | addBond(-0.3), popDelta(-1) |
| Showmance moment | Active pair, one performing | +0.1 to roll, addBond(+0.5) |
| Sabotage | canScheme + neg bond with performer | -0.1 to target's roll, addBond(-0.5), popDelta(saboteur, -1) |
| Vomit chain (Chug only) | Failed chug, ~30% | -1 to 1-2 nearby teammates, comedy narration |
| Refusal (Fish Kiss only) | Low boldness < 4, ~25% | Auto-fail, -2 chalMemberScores, popDelta(-2), teammates react by archetype |
| Crowd disgust (Fish Kiss only) | After kiss attempt | Social reactions from teammates, comedy narration |

### Fish Kiss Crowd Reactions

After the kisser performs (pass or fail), 2-3 teammates react based on archetype. Small bond consequences:

- Villain mocks: addBond(villain, kisser, -0.2)
- Hero encourages: addBond(hero, kisser, +0.2)
- Hothead gags dramatically: popDelta(hothead, -1)
- Social-butterfly cheers: popDelta(kisser, +1)

### Tribe Time

Each leg adds time based on performance. Final tribe ranking = Phase 1 swim time + Phase 2 relay time (lower is better). Immunity goes to fastest tribe.

---

## Scoring Summary

### Individual (chalMemberScores)

| Action | Points |
|--------|--------|
| Strong swim | +2 |
| Struggle swim | -1 |
| Rescued (drowning) | -2 |
| Rescuer | +2 |
| Relay leg pass (fast) | +3 |
| Relay leg pass (slow) | +1 |
| Relay leg fail | -2 |
| Fish kiss refusal | -2 |
| Captain (winning tribe) | +2 |
| Captain (losing tribe) | -1 |
| Sabotage/help/blame | per existing pattern |

### Tribe Score

Per-member average as always. Components:
- Phase 1: swim time ranking + fastest tribe bonus
- Phase 2: relay leg results + time penalties

**Immunity winner bonus:** `Math.max(currentScore, maxOther) + active.length + 5`

---

## Camp Events

| Trigger | Camp Event | Badge |
|---------|-----------|-------|
| Fastest swimmer | "{player} blazed through the ocean swim" | badge-positive |
| Rescued teammate | "{player} saved {target} from drowning" | badge-positive |
| Relay leg fast pass | "{player} crushed the {leg} leg for {tribe}" | badge-positive |
| Fish kiss refusal | "{player} refused to kiss the fish" | badge-negative |
| Bad captain assignments | "{player}'s assignments cost {tribe} the relay" | badge-negative |
| Vomit chain | "{player} started a vomit chain during the chug" | badge-negative |
| Captain sabotage | "{player} deliberately mis-assigned {target}" | badge-negative |
| Clam punishment | "{tribe} had to shuck clams for the host after finishing last" | badge-negative |

### Clam Punishment (Last-Place Tribe)

The last-place tribe gets a post-challenge punishment: shucking giant clams for the host. This fires as a camp event with social consequences:
- All members of last-place tribe: popDelta(-1)
- ~40% chance of internal blame event: lowest-performing member gets blamed by hothead/villain teammate, addBond(blamer, target, -0.5)
- ~30% chance of sabotage revenge: a schemer on the losing tribe tampers with the winning tribe's clam chowder dinner (comedy camp event, addBond cross-tribe -0.3)

All camp events must have `players: []` array, `badgeText`, and `badgeClass`.

---

## Romance Hooks

- Call `_challengeRomanceSpark()` for all active player pairs at end of simulation (pass null for phases/phaseKey)
- Call `_checkShowmanceChalMoment()` at end (pass null for phases/phaseKey)
- Showmance moment opportunities: swim encouragement, relay cheering, fish kiss comfort
- Always check `romanticCompat(a, b)` before any romance event
- Max 2 active showmances enforced by `_challengeRomanceSpark()` internally

---

## Integration Checklist (7 files)

1. **core.js** — TWIST_CATALOG entry: `{ id:'rock-the-dock', emoji:'⚓', name:'Rock the Dock', category:'challenge', chalSeries:'world-tour', chalStyle:'physical', phase:'pre-merge', minTribes:2, engineType:'rock-the-dock', desc:'Coastal relay. Swim to shore, elect a captain, race through a 4-leg dock relay.', incompatible:[...all other challenge IDs...] }`

2. **twists.js** — In `applyTwist()`: `} else if (engineType === 'rock-the-dock') { if (gs.isMerged || gs.tribes.length < 2) return; ep.isRockTheDock = true; }`

3. **episode.js** — 7+ edits:
   - Import `simulateRockTheDock`
   - Dispatch block (pre-merge, tribes >= 2)
   - Generic challenge skip condition: add `|| ep.isRockTheDock`
   - Generic updateChalRecord guard: add `&& !ep.isRockTheDock`
   - `_hasTwistChallenge` list: add `|| ep.isRockTheDock`
   - `handleExileFormat` guard: add `|| ep.isRockTheDock`
   - ALL `gs.episodeHistory.push` calls (8+): add `isRockTheDock: ep.isRockTheDock || false, rockTheDock: ep.rockTheDock || null`

4. **vp-screens.js** — Import VP builders + screen registration (Title, Swim, Relay, Results)

5. **text-backlog.js** — Import + `_textTwistChallenge()` call with VP builders (BEFORE `_textCampPost`)

6. **main.js** — `import * as rockTheDockMod from './chal/rock-the-dock.js';` + add to spread array

7. **run-ui.js** — Badge tag for episode timeline

---

## VP Screens

| Screen | Function | Content |
|--------|----------|---------|
| Title Card | `rpBuildRTDTitleCard` | Cold open, coastal village intro, tribe blocks, host quote |
| Ocean Swim | `rpBuildRTDSwim` | Formation debate → individual swim rolls → rescue events → arrival |
| Dock Relay | `rpBuildRTDRelay` | Captain election → 4 legs with inline social events → fish kiss reactions |
| Results | `rpBuildRTDResults` | Per-tribe breakdown, time totals, final standings |

Each screen: own `screenKey`, `_tvState[key]` with `idx: -1`, `_reapplyVisibility()` in both revealNext/revealAll, try-catch wrapped sidebar/map updates, DOM-only reveals (never rebuild page).

---

## VP Identity

**Theme:** Rugged coastal fishing village at dawn. Weathered wood, rope textures, salt-sprayed docks, grey-blue ocean, lobster crates, fishing nets. Shifts from open ocean spray (Phase 1) to crowded wooden dock (Phase 2).

**CSS prefix:** `rtd-`

**Unique visual primitives (NO reuse from other challenges):**
- CSS-only wave animation on ocean backgrounds
- Weathered plank card backgrounds with rope-knot borders
- Dock post dividers between relay legs
- Fish silhouette icons (CSS clip-path)
- Splash/spray particle effects during swim
- Relay leg progress tracker (4 dock posts, tribe flags advance)

**Fonts:** Rugged display font for headers (slab serif), monospace for timers/scores

**Sidebar:** Live-updating per reveal. Shows:
- Swim times per tribe (Phase 1)
- Relay leg progress per tribe (Phase 2)
- Captain + assignments display
- Running time totals

---

## Non-Negotiable Rules Compliance

- Stats ALWAYS proportional: `stat * factor + noise()`, never `stat >= X`
- noise(2.5) minimum on all gameplay rolls
- Archetype behavior enforced via `canScheme()` helper
- `pronouns(name)` for all gendered text — `posAdj` before nouns, `pos` standalone
- All social events have consequences (addBond, popDelta, or score)
- Popularity changes for all heroic/villainous/cowardly moments
- Camp events with `players: []`, `badgeText`, `badgeClass`
- No real-world location references in narration
- `updateChalRecord(ep)` called at end with populated `chalMemberScores`
- Immunity winner gets massive bonus to guarantee #1 in scores
- Tribe scores averaged per member
- `_challengeRomanceSpark()` and `_checkShowmanceChalMoment()` with null phases
