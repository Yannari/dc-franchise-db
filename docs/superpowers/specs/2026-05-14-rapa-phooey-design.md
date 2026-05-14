# Rapa Phooey! — Challenge Design Spec

**Source:** Total Drama World Tour S3E22 "Rapa Phooey!"
**Phase:** post-merge
**Style:** hunt
**Series:** world-tour
**File:** `js/chal/rapa-phooey.js`

---

## Overview

Easter Island egg hunt. Players search carved rock heads of eliminated contestants for eggs of their assigned color, traverse an underground cave gauntlet where eggs can break, then climb a pillar to nest their eggs while a giant condor attacks. First to nest 3 eggs wins immunity. Heavy social layer — players find each other's eggs and choose to help, trade, extort, or destroy them. Cross-zone race where players progress at different speeds; some backtrack after egg breaks while others push ahead.

---

## World Layout

Three zones, one continuous race. Players occupy different zones simultaneously and interact with whoever shares their zone.

| Zone | Name | Primary Activity | Key Stats |
|------|------|-----------------|-----------|
| 1 | Rock Head Field | Search for colored eggs, social manipulation | mental, intuition, social |
| 2 | Underground Cave | Hazard gauntlet, eggs break on failures | physical, endurance, boldness |
| 3 | Nest Pillar | Climb + nest eggs, dodge condor | physical, endurance, boldness |

### Tick Processing Order

Each tick processes all players simultaneously regardless of zone:
1. Zone 3 actions (climb, nest, condor)
2. Zone 2 actions (cave segments)
3. Zone 1 actions (search, basket weave)
4. Social events for all zone groups
5. Condor AI state update
6. Check win condition (3 eggs nested)

Zone 3 first so a winning nest delivery ends the race before lower-zone players act.

---

## Player State

```
{
  zone: 1|2|3,
  carrying: [{ color, fragile }],     // eggs currently held
  nested: 0,                           // eggs delivered to the summit nest
  basket: false,                       // woven basket protects eggs
  awareness: 0,                        // intel about own egg locations (0-10)
  caveSegment: 0,                      // progress through cave (0-4)
  pillarTier: 0,                       // progress up pillar (0-3)
  catcherMask: false,                  // one free condor dodge
  pacts: [],                           // pre-race alliance commitments
  ticksInZone: 0,                      // time spent in current zone
}
```

---

## Pre-Race: Alliance Auction

Before the race starts, one social round fires. High-strategic players make deals:

- **Egg pact**: "I'll hand you your eggs if I find them" — mutual commitment
  - Kept pact: +1.5 bond when fulfilled during the race
  - Broken pact: -3.0 bond + heat (3 ep) + camp event "Broken Promise"
- **Candy bribe** (Alejandro mechanic): High-social player offers a favor to a weaker player in exchange for a tribal vote commitment
  - social * 0.4 + strategic * 0.3 + noise(2) vs target's mental * 0.3 + intuition * 0.3 + noise(2)
  - Success: pact formed, target gets +0.5 awareness head start
  - Archetype filter: only villain/mastermind/schemer/social-butterfly initiate bribes

Social events fire based on existing bonds and archetypes. 1-3 events depending on cast composition.

---

## Zone 1: Rock Head Field

### Rock Head Setup

- Each eliminated player this season gets a carved moai rock head
- If fewer than 6 eliminated, generic moai fill remaining slots (minimum 8 heads)
- Each active player's 3 colored eggs are randomly distributed among the heads
- Other players' eggs are also scattered — finding someone else's egg triggers a choice

### Search Mechanic

Per tick, a player in Zone 1 either searches a head or weaves a basket.

**Search roll:** `mental * 0.3 + intuition * 0.3 + awareness * 0.15 + noise(2.5)`
- Threshold: 5.5 (easy heads) to 7.5 (hidden spots)
- Success: find an egg. Could be yours or someone else's
- Fail: nothing, but +0.5 awareness (narrowing it down)

**Finding your own egg:** add to `carrying`.

**Finding someone else's egg — choice moment:**
Decision driven by archetype + bonds + strategic situation.

| Choice | Who does it | Consequence |
|--------|------------|-------------|
| **Help** — give it to them | Nice archetypes, bond ≥ 3 | +1.5 bond, +1 popularity, camp event "Egg Delivery" |
| **Hostage** — hold it for leverage | Strategic ≥ 6, any archetype except nice | Egg held until deal made or destroyed. +3 heat (3 ep) if destroyed later. Camp event "Egg Hostage" |
| **Sabotage** — destroy immediately | Villain/schemer/mastermind only | -2.0 bond, +4 heat (3 ep), -3 popularity, camp event "Egg Destroyer" |
| **Hide** — re-hide in different head | Neutral archetypes, strategic ≥ 5 | Delays rival, no direct heat. -0.5 bond if discovered. Camp event if caught |
| **Trade** — offer swap for intel/alliance | Social ≥ 5 | Both players benefit. +1.0 bond, +1.0 awareness each |

### Basket Weaving

Instead of searching, spend a tick weaving a grass basket:
- Basket protects eggs: cave hazard break chance drops from ~40% to ~10%
- Climb break chance drops from ~30% to ~8%
- +0.5 climb bonus (hands-free storage vs juggling)
- **Social play**: weave a basket FOR an ally (costs your tick, +1.5 bond, camp event "Basket Gift")
  - Triggered by: bond ≥ 5, showmance, or loyalty ≥ 7

### Zone 1 Social Events

Fire between players sharing Zone 1. Minimum 1 per tick when 2+ players present, probability for bonus events.

| Event | Trigger | Consequence |
|-------|---------|-------------|
| **Egg trade** | Both have each other's eggs | +1.5 bond each, both save a search tick. Camp event |
| **Intel share** | Bond ≥ 3, one knows where ally's egg is | +1.0 awareness for recipient, +1.0 bond. Camp event |
| **Egg extortion** | Holding rival's egg, strategic ≥ 5 | Target must agree to vote deal or lose egg. +3 heat if egg destroyed. Bond/camp event |
| **Sabotage discovery** | High intuition player (≥ 7) nearby when sabotage happens | Confrontation: saboteur exposed, -2 bond with all witnesses, +5 heat. Camp event "Caught Red-Handed" |
| **Basket gift** | Showmance or bond ≥ 5, ally has no basket | Weave for them. +1.5 bond, +1 popularity. Camp event |
| **Trash talk** | Rivalry (bond ≤ -3) | Temperament check — low = rattled (-1 on next search). Camp event |
| **Alliance search** | Bond ≥ 4, same zone | Coordinate: both get +1.0 awareness. +0.5 bond |
| **Rock head reaction** | Player searches an eliminated player they had strong bond with | Emotional moment: +/- popularity based on whether they kick it (bond ≤ -3) or touch it gently (bond ≥ 3). Camp event |

### Zone 1→2 Transition

Decision AI based on personality:
- `readiness = (carrying.length * 2) + (basket ? 3 : 0) + strategic * 0.3 + boldness * 0.3 + noise(1.5)`
- Threshold 6.0: advance to cave
- Challenge-beast archetype: -1.5 threshold (rush strategy)
- Carrying 3+ eggs: always advance
- Carrying 0: never advance

---

## Zone 2: Underground Cave

### Cave Segments

4 segments to traverse. Each tick, player attempts one segment.

| # | Segment | Primary Stats | Hazard | Base Break Chance |
|---|---------|--------------|--------|-------------------|
| 1 | Boulder Corridor | physical * 0.35 + endurance * 0.25 | Rolling boulder — dodge or get pinned | 45% (no basket) / 12% (basket) |
| 2 | Narrow Squeeze | physical * 0.3 + boldness * 0.3 | Tight passage — panic drops eggs | 35% / 8% |
| 3 | Dark Chamber | intuition * 0.35 + mental * 0.25 | Wrong turn — loops back one segment | 15% (but wastes a tick) |
| 4 | Exit Passage | endurance * 0.3 + physical * 0.3 | Male condor guards exit | 40% / 10% |

**Segment roll:** `primaryStat * weight + secondaryStat * weight + noise(2.5)` vs threshold (5.5-7.0)
- Success: advance to next segment
- Failure: hazard fires. Egg break roll per egg carried (break chance from table, per egg)
- Dark Chamber failure: no egg break but player loops back to segment 2

**Male condor (Exit Passage):**
- Aggression scales with eggs carried:
  - 1 egg: threshold 5.5 (wary)
  - 2 eggs: threshold 6.5 (swoops)
  - 3+ eggs: threshold 7.5 (attacks aggressively, break chance +15%)

### Cave Social Events

Fire between players sharing the cave (same or adjacent segments).

| Event | Trigger | Consequence |
|-------|---------|-------------|
| **Shield** | Bond ≥ 3, both in Boulder Corridor | Blocker takes -1 on own next roll but ally auto-passes. +2.0 bond, +2 popularity. Camp event "Boulder Shield" |
| **Shove** | Villain/schemer, bond ≤ -2 | Target gets -1.5 on current segment + extra egg break chance. -2.0 bond, +2 heat (2 ep), -2 popularity. Camp event |
| **Panic chain** | Both in Dark Chamber, one fails | Temperament check for both. Low (≤ 4) = both lose a tick. High = calmer player steadies the other (+1.0 bond). Camp event |
| **Egg rescue** | Player's egg cracks, ally in same segment | intuition * 0.3 + physical * 0.3 + noise(2) vs 6.0. Success = egg saved. +2.5 bond, +3 popularity. Camp event "Egg Catch" |
| **Condor distraction** | Both at Exit Passage, bond ≥ 2 | Distracter: boldness * 0.4 + endurance * 0.3. Success = ally skips condor check entirely. +2.0 bond, +2 popularity. Failure = both face condor. Camp event |
| **Stampede** | 3+ players in same segment when hazard fires | Worst roller gets knocked back one segment + egg break. Blame dynamics based on who triggered it. Camp event |

### Cave Backtracking

- All eggs broken → forced back to Zone 1 (1 tick to return)
- Voluntary retreat: player can choose to go back if below 2 eggs (strategic ≥ 5 more likely to retreat and restock)
- Backtracking preserves basket and awareness

---

## Zone 3: Nest Pillar

### Pillar Structure

3 tiers to climb: Base → Mid-Pillar → Summit. Each tick, player attempts one tier.

**Climb roll:** `physical * 0.3 + endurance * 0.25 + boldness * 0.2 + noise(2.5) - (carrying.length * 0.5)`
- Basket: +0.5 bonus (hands-free)
- Threshold: 5.5 (Base→Mid), 6.5 (Mid→Summit)
- Failure: slide back one tier. Egg break chance: 30% per egg (8% with basket)

**Egg nesting at Summit:**
- Each tick at the summit, player nests ONE egg
- Safe from condor while actually placing (condor confused)
- But reaching summit with eggs intact is the challenge
- **3 eggs nested = immunity winner, race ends immediately**

### Female Condor — Active AI

Larger and more aggressive than the cave male. Targets the highest climber carrying the most eggs.

**Target selection:** highest tier first, then most eggs carried, then random among ties.

**Escalating aggression** (tracked per tick anyone is on the pillar):

| Pillar Tick | Behavior | Dodge Threshold | On Failure |
|-------------|----------|----------------|------------|
| 1-2 | Warning swoops | boldness * 0.4 ≥ 4.0 | Lose a tick flinching, no egg break |
| 3-4 | Talon strikes | physical * 0.3 + endurance * 0.3 ≥ 5.5 | Knocked back one tier + egg break |
| 5+ | Full dive-bomb | physical * 0.3 + endurance * 0.3 + boldness * 0.2 ≥ 7.0 | Knocked to pillar base + guaranteed egg break |

**Condor split attention:** If 2+ players on the pillar, condor can only target ONE per tick. Others get a safe window — incentivizes group climbing.

**Catcher's mask:** First player to exit the cave receives a catcher's mask. One free condor dodge (single use). Consumed on first condor attack that would hit.

### Pillar Social Events

| Event | Trigger | Consequence |
|-------|---------|-------------|
| **Boost** | Bond ≥ 3, booster one tier below | Booster loses their climb tick, boosted player auto-succeeds tier. +2.0 bond, +2 popularity. Camp event "Hoisted Up" |
| **Knock down** | Villain/schemer, bond ≤ -2 | Attacker physical vs target physical. Loser falls one tier + egg break. -2.5 bond, +3 heat (2 ep), -3 popularity. Camp event |
| **Egg catch** | Player above drops egg, ally below | intuition * 0.3 + physical * 0.3 + noise(2) vs 6.5. Success = egg saved, returned. +3.0 bond, +4 popularity. Camp event "Mid-Air Save" |
| **Condor bait** | Bond ≥ 2, both on pillar | boldness * 0.4 + endurance * 0.3 vs 6.0. Success = condor targets bait, ally climbs free. +2.5 bond, +3 popularity. Potential showmance moment. Camp event |
| **Summit showdown** | Two players at summit same tick | Both place eggs simultaneously. If one already has 2 nested and the other has fewer, trailing player can attempt knock (villain only, strategic ≥ 6): target's placed egg falls. Massive heat (+5, 3 ep), -4 bond, -4 popularity. Camp event "Nest Sabotage" |
| **Desperate throw** | Player at Mid-Pillar, 1 egg left, behind in race | mental * 0.2 + physical * 0.3 + noise(3) vs 7.5. Success = egg nests from distance, +5 popularity, +5 score. Failure = egg shatters, back to Zone 1. Camp event "Hail Mary" |

---

## Cross-Zone Interactions

Players in different zones can still interact:

| Event | Zones | Consequence |
|-------|-------|-------------|
| **Shout warning** | Cave→Field | intuition check. Recipient gets +1.0 on first cave segment. +1.0 bond. Camp event |
| **Taunt from above** | Pillar→Field or Cave | Target temperament check. Fail = -1 on next action. Rivalry + heat. Camp event |
| **Backtrack encounter** | Retreating player passes advancer | Can share intel (+1 awareness each, +0.5 bond), trade eggs, or trash talk. Based on bond |

---

## Race Pacing

**Target:** 8-14 ticks total.

| Milestone | Fast (lucky+skilled) | Average | Slow (bad luck+sabotaged) |
|-----------|---------------------|---------|--------------------------|
| Leave Zone 1 | Tick 2-3 | Tick 3-5 | Tick 5-7 |
| Exit cave | Tick 4-5 | Tick 6-8 | Tick 8-10 (with backtrack) |
| First egg nested | Tick 5-6 | Tick 7-9 | Tick 9-11 |
| Race winner | Tick 7-8 | Tick 10-12 | Tick 12-14 |

**Backtrack cost:** 1 tick return + 1-2 ticks re-search + 3-4 ticks cave re-traverse = 5-7 tick penalty. Devastating but not impossible to recover from.

**Decision AI — zone transitions:**

| Decision | Aggressive (challenge-beast, boldness ≥ 7) | Conservative (strategic ≥ 6, loyalty ≥ 5) |
|----------|---------------------------------------------|---------------------------------------------|
| Enter cave with N eggs? | 1-2 eggs, no basket | 3 eggs + basket |
| Retreat after egg break? | Push with 1 egg | Retreat below 2 |
| Climb timing | Immediately | Wait for others to draw condor |
| Help or sabotage? | Ignore (focused on winning) | Help allies, sabotage threats |

---

## Scoring

### `chalMemberScores`

| Action | Points |
|--------|--------|
| Egg found (own color) | +3 |
| Egg nested at summit | +8 |
| Won immunity | +maxOther + active.length + 5 |
| Cave segment cleared | +2 |
| Pillar tier climbed | +3 |
| Social help (shield, boost, catch, basket gift) | +1 |
| Social sabotage (shove, destroy, knock down) | +1 |
| Egg broken (own) | -2 |
| Backtracked to Zone 1 | -3 |
| Desperate throw success | +5 |
| Condor dodge success | +2 |

`chalPlacements` ordered by `chalMemberScores` descending. Immunity winner guaranteed #1.

### Heat: `gs._rapaHeat`

Per-target keyed: `gs._rapaHeat[playerName] = { amount, expiresEp }`

| Action | Heat | Duration |
|--------|------|----------|
| Egg destruction | +4 | 3 episodes |
| Egg extortion/hostage destroyed | +3 | 3 episodes |
| Shove/knock down | +2 | 2 episodes |
| Broken pact | +3 | 3 episodes |
| Nest sabotage (summit) | +5 | 3 episodes |

Consumed in `alliances.js` `computeHeat`.

### Popularity

| Action | Delta |
|--------|-------|
| Shield / egg rescue / egg catch / condor bait | +2 to +4 |
| Sabotage / shove / egg destroy | -2 to -4 |
| Desperate throw success | +5 |
| Nest sabotage | -4 |
| Immunity win | +2 |

### Camp Events

Every social event injects a camp event with `players[]` + `badgeText`/`badgeClass`:

| Badge Key | Text | Class |
|-----------|------|-------|
| `rapaImmune` | Won the Egg Race | `win` |
| `rapaHeroic` | Heroic Save | `green` |
| `rapaSaboteur` | Egg Destroyer | `bad` |
| `rapaExtortion` | Egg Hostage | `bad` |
| `rapaClutch` | Desperate Throw! | `win` |
| `rapaBacktrack` | Sent Back | `` |
| `rapaBasket` | Basket Weaver | `green` |
| `rapaShield` | Boulder Shield | `green` |
| `rapaNestSabotage` | Nest Sabotage | `bad` |
| `rapaCatch` | Mid-Air Save | `green` |

---

## VP Identity: "Final Four Field Log"

### Visual Theme

Easter Island archaeological expedition field log. Stone-carved panels, tropical foliage borders, parchment/sandy tan backgrounds. Moai silhouettes as recurring motifs.

Reference: `mockup/Rapa Phooey _standalone_.html` and provided screenshot.

### Layout: 3-Column

| Left Sidebar | Center Panel | Right Sidebar |
|-------------|-------------|---------------|
| **Contestant Status** | **Scene + Narration Log** | **Challenge Standings** |
| Avatar with egg-color border | Tick-by-tick event cards | Egg progress per player: colored egg icon + "X/3" + moai icons for searched heads |
| Name in bold serif | Player avatar icons on each card | |
| Status pill: zone + current action | Chris/host commentary interleaved | **Elimination Tracker** |
| | Social event cards (dashed border, distinct bg) | Vote risk prediction based on performance |

### Sidebar Updates

- **Left sidebar**: rebuilds every reveal. Shows each player's current zone, action, and status. Status pill colors: green (progressing), yellow (searching), red (backtracking/in danger), gold (WINNER).
- **Right sidebar**: egg standings rebuild every reveal. Each player row: colored egg swatch, "nested/3" count, small moai icons showing which heads they've searched. Progressive — gated by `_tvState[key].idx`.

### CSS Identity

- Prefix: `rp-` (rapa phooey)
- Fonts: display serif (Impact/Bungee) for headers, system sans-serif for body
- Colors: sandy tan `#ecdfc8` backgrounds, stone gray `#6b7c6e` borders, ocean blue `#2a7a8c` accents, sunset orange `#e87654` highlights
- Moai silhouette CSS icons via `_icon('moai')`, condor via `_icon('condor')`, egg via `_icon('egg')`
- Vine/leaf border decorations on left and right edges
- Background: subtle parallax stone texture with floating dust particles
- Phase-specific atmosphere: Zone 1 = daylight blue sky, Zone 2 = dark underground amber, Zone 3 = sunset orange/red (climbing at golden hour)

### VP Screens

| Screen | Content |
|--------|---------|
| Title Card | "RAPA PHOOEY!" header, Easter Island scene SVG, challenge rules summary |
| Alliance Auction | Pre-race social deals, pact cards |
| Race Ticks (1 per tick) | All zone actions interleaved, social events, condor attacks. Click-to-reveal per event card |
| Results | Winner card with egg animation, final standings, race stats |

### Reveal System

Standard `_tvState[key]` with `idx: -1`. Each tick screen has N event cards revealed sequentially. Sidebar rebuilds on every reveal via `_updateSidebar(screenKey)` from both `revealNext` and `revealAll`. DOM-only updates via `_reapplyVisibility()`.

---

## Integration Points

Standard 7-file integration per CLAUDE.md "How to Create a New Twist Challenge":

1. **`js/core.js`** — TWIST_CATALOG entry: `id:'rapa-phooey'`, `chalSeries:'world-tour'`, `chalStyle:'hunt'`, `phase:'post-merge'`
2. **`js/twists.js`** — `engineType` → `ep.isRapaPhooey = true` in `applyTwist()` + add to `_engineFlagMap`
3. **`js/episode.js`** — 7 places: import, dispatch (`ep.isRapaPhooey && gs.isMerged`), generic skip, updateChalRecord guard, `_hasTwistChallenge`, handleExileFormat guard, all episodeHistory.push calls
4. **`js/vp-screens.js`** — import VP builders + screen registration
5. **`js/text-backlog.js`** — `_textTwistChallenge()` with VP builder array
6. **`js/main.js`** — import module + spread
7. **`js/run-ui.js`** — episode history badge tag
8. **`js/alliances.js`** — `_rapaHeat` consumption in `computeHeat`
9. **`js/core.js`** — add `_rapaHeat` to reward-twist-challenge incompatible list + CLAUDE.md heat list

---

## Anti-Reuse Clause

This challenge's VP primitives — moai silhouette icons, vine border decorations, stone-carved panel frames, egg-color progress tracker, field log narration style — belong exclusively to Rapa Phooey. No future challenge may reuse these visual elements.
