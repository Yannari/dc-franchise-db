# Night at the Museum — Challenge Design Spec

**ID:** `night-at-museum`  
**Phase:** Pre-merge (tribe challenge)  
**Style:** `adventure`  
**Series:** `world-tour`  
**File:** `js/chal/night-at-museum.js`  
**Min tribes:** 2

## Overview

Three-phase museum heist. Tribes break into a grand museum, search themed galleries for scattered statue pieces, and race to assemble their chosen statue while animals escalate from background threat to full siege. Animal alarm count carries forward between phases.

No real-world references — the museum is a generic grand art museum. No mentions of Paris, Louvre, France, or any real location.

---

## Phase 1: Security Breach

Every tribe member individually navigates the museum security gauntlet (laser grids, pressure floors, camera sweeps). Any player can trigger alarms — not just one designated runner.

### Pre-Attempt Events

Before each player's attempt, a micro-event can fire (~40% chance) that modifies their roll:

| Event | Trigger | Modifier | Consequence |
|-------|---------|----------|-------------|
| Teammate tip | Any teammate, bond > 1 | +0.15 to roll | addBond(tipper, player, +0.3) |
| Showmance calms nerves | Active showmance pair | +0.2 to roll | addBond(a, b, +0.5) |
| Animal startle | Random, more likely with high alarm count | -0.15 to roll | popDelta(player, -1) |
| Villain guinea pig | Villain/schemer archetype, bond < 0 with target | -0.1 to target's roll | addBond(target, villain, -0.5), popDelta(villain, -1) |
| Hero scouts first | Hero/loyal-soldier, goes before others | +0.1 to all subsequent teammates | addBond(teammates, hero, +0.3), popDelta(hero, +1) |
| Self-psyche-out | boldness * 0.05 + noise(2.5) < 0.2 | -0.1 to roll | — |
| Rival distraction | Cross-tribe, canScheme check | -0.1 to target's roll | addBond(target, rival, -0.3), popDelta(rival, -1) |

### Security Roll

```
securityScore = physical * 0.05 + intuition * 0.06 + eventModifier + noise(2.5)
pass = securityScore > 0.3
```

- **Pass:** +2 chalMemberScores, popDelta(+1), security dodge narration
- **Fail (alarm trigger):** -2 chalMemberScores, popDelta(-1), alarm narration, tribe alarm count++

### Alarm System

Tribe accumulates alarms across all members. Alarm count cascades into Phase 2:

| Alarms | Phase 2 Effect |
|--------|---------------|
| 0 | Clean sweep bonus (+3 tribe score), minimal animals |
| 1-2 | Normal animal frequency |
| 3-4 | Elevated — animals actively hunt, +15% encounter rate |
| 5+ | Maximum — animals swarm, can scatter found pieces |

### Per-Alarm Blame Events

Each alarm trigger fires a blame check (~50% chance):
- Blamer selection: teammate with lowest bond to alarm-triggerer, archetype-weighted
- `addBond(blamer, triggerer, -0.8)`, `popDelta(triggerer, -1)`
- Hothead archetype: guaranteed blame, louder text
- Hero archetype: never blames, may defend ("leave them alone")

### Clean Sweep Bonus

If tribe triggers 0 alarms:
- +3 tribe score bonus
- All members: `addBond(each pair, +0.3)`
- Camp event: "{tribe} pulled off a clean museum break-in"

### Between Phase 1-2

Social events fire for all tribes:
- Cross-tribe taunts (tribes with fewer alarms mock tribes with more)
- Chatter (atmospheric museum narration)
- Showmance moments (~25% if active)
- Bond/rivalry between tribe members based on Phase 1 performance

---

## Phase 2: Gallery Search

Museum has 4 themed galleries: **Sculpture Hall**, **Ancient Wing**, **Modern Gallery**, **The Vault**.

### Statue Selection Debate

Before searching, each tribe votes on which statue to pursue. Debate follows the zipline technique pattern:

**Three statue options:**

| Statue | Pieces | Carry Stat | Assembly Stat | Special |
|--------|--------|-----------|---------------|---------|
| Classical Figure | 6 | physical * 0.06 | mental * 0.05 | Heavy pieces — carrying roll per piece |
| Ancient Relic | 4 | intuition * 0.05 | intuition * 0.07 | Cursed — +25% animal encounter rate, assembly needs decoding |
| Modern Abstract | 5 | — (lightweight) | mental * 0.08 | Confusing — wrong placement chance on assembly |

**Debate structure:**
1. Champions advocate (one per statue type, best matching stats)
2. 1-2 interjections from non-champions (archetype-driven)
3. Persuasion roll → winner's statue selected
4. Decision card locks it in

Bond consequences: winner gains bonds, losers get friction if negative bond.

### Room Search

Members fan out across 4 galleries. Each gallery visit:

```
searchScore = intuition * 0.06 + mental * 0.05 + noise(2.5)
findPiece = searchScore > 0.3 AND tribe.piecesFound < statue.totalPieces
```

**Per-room events (~40% chance per player per room):**

| Event | Type | Score | Bond/Pop |
|-------|------|-------|----------|
| Shortcut found | trek | +2 | popDelta(+1) |
| Dead end | danger | -1 | — |
| Animal encounter (dodge) | trek | +1 | popDelta(+1) if dramatic |
| Animal encounter (caught) | danger | -2, can scatter 1 piece | popDelta(-1) |
| Animal drawn to weak player | danger | -1 target | — |
| Teammate distracts animal | hero | +2 distractor | addBond(+0.5), popDelta(+1) |
| Piece scattered by animal | danger | -2, lose 1 found piece | popDelta(-1) |

Animal encounter frequency: `base 25% + (alarmCount * 5%)`

### Social Events Between Rooms

Fire between room transitions (~35% chance per gap):
- Help (nice archetypes, bond > 1): point teammate to a piece, addBond(+0.5), popDelta(+1)
- Sabotage (canScheme, bond < 0): misdirect, trigger security remnant, addBond(-1), popDelta(-1)
- Bond: shared discovery moment, addBond(+0.5)
- Rivalry: argument over search strategy, addBond(-0.5)
- Encourage: social-butterfly/hero, +1 to teammate's next search roll
- Blame: if animal scatters a piece, blame the carrier
- Showmance: dark gallery moment (~20% if active pair in tribe)

### Cross-Tribe Collisions (~1-2 per Phase 2)

When players from different tribes reach the same gallery:
- **Piece race:** Both spot a piece → physical + boldness roll, winner grabs it (+3 score, popDelta +2), loser gets nothing (popDelta -1, addBond -0.5)
- **Block:** Schemer blocks corridor, victim detours (addBond -0.5, popDelta -1)
- **Taunt:** Compare piece counts, trash talk (addBond -0.3, popDelta -1)

### Between Phase 2-3

- Assembly role debate events
- Animal escalation narration (they're getting closer)
- Showmance/bond/rivalry moments
- Chatter (museum atmosphere shifts — lights flickering, growling closer)

---

## Phase 3: Assembly Under Pressure

### Role Assignment Debate

Each tribe assigns three roles through vote/debate (same pattern as statue selection):

| Role | Primary Stats | Function |
|------|--------------|----------|
| Builder | mental * 0.07 + intuition * 0.05 | Places pieces, determines assembly quality |
| Defender | physical * 0.07 + boldness * 0.04 | Protects statue from animal attacks |
| Coordinator | social * 0.06 + strategic * 0.04 | Boosts builder rolls, keeps morale |

Remaining tribe members act as support (minor score contributions, can sub in if needed).

**Debate:** Champions advocate for who should fill each role. Interjections fire. Bond consequences.

### Assembly Sequence

Builder places pieces one at a time. Each placement:

```
placeScore = mental * 0.07 + intuition * 0.05 + coordinatorBonus + noise(2.5)
coordinatorBonus = coordinator.social * 0.02
```

**Placement outcomes:**
- Success (placeScore > 0.25): +2 tribe score, piece placed
- Fumble (placeScore <= 0.25): -1 tribe score, piece placed poorly (fixable)
- Wrong placement (Modern Abstract only, ~15%): -2, must redo

**Statue-specific modifiers:**
- Classical Figure: each piece requires a carry roll `physical * 0.06 + noise(2.5) > 0.2` before placement
- Ancient Relic: each piece requires a decode roll `intuition * 0.05 + noise(2.5) > 0.2` before placement
- Modern Abstract: +15% chance of wrong placement per piece

### Animal Attacks During Assembly

Every 1-2 placements, an animal attack fires:

```
defendScore = physical * 0.07 + boldness * 0.04 + noise(2.5)
defended = defendScore > 0.3
```

- **Defended:** +2 defender score, popDelta(defender, +1), addBond(builder, defender, +0.5)
- **Failed defense:** Animal knocks statue — lose 1 placed piece, -3 tribe score, blame event fires
  - `addBond(blamed, defender, -0.8)`, `popDelta(defender, -2)`

### Social Events During Assembly

Fire between placement beats (~30% chance):
- Coordinator argues with builder (bond check, social event)
- Defender heroic save (dramatic animal block)
- Defender blame (failed block, hothead explodes)
- Showmance comfort after setback
- Villain deliberately slow (if they want tribe to lose — canScheme + low loyalty)
- Encourage from support members

### Completion

- **All pieces placed correctly:** +5 bonus, completion narration
- **Missing pieces (didn't find all in Phase 2):** Can still assemble partial statue, but -2 per missing piece
- **Statue knocked over completely (rare, 3+ failed defenses):** Massive penalty, -8

---

## Scoring Summary

### Individual (chalMemberScores)

| Action | Points |
|--------|--------|
| Security pass | +2 |
| Security alarm | -2 |
| Piece found | +2 |
| Piece scattered (lost) | -2 |
| Cross-tribe race win | +3 |
| Shortcut/puzzle solve | +2 |
| Animal dodge | +1 |
| Animal caught | -2 |
| Hero distraction | +2 |
| Builder: piece placed | +2 |
| Builder: fumble | -1 |
| Builder: wrong placement | -2 |
| Defender: successful block | +2 |
| Defender: failed block | -3 |
| Coordinator: per placement | +1 |
| Sabotage/help/blame | per existing pattern |

### Tribe Score

Per-member average as always. Components:
- Phase 1: alarm results + clean sweep bonus
- Phase 2: pieces found + gallery events
- Phase 3: assembly quality + defense results + completion bonus

**Immunity winner bonus:** `Math.max(currentScore, maxOther) + active.length + 5`

---

## Animal Threat Escalation

| Phase | Behavior | Frequency |
|-------|----------|-----------|
| Phase 1 | Background — occasional startles during security | ~15% per player |
| Between 1-2 | Released into museum, atmospheric narration | — |
| Phase 2 | Active roaming — encounter rate scales with alarm count | 25% + (alarmCount * 5%) per room |
| Between 2-3 | Escalation narration — animals converge on assembly area | — |
| Phase 3 | Full siege — constant attacks every 1-2 placements | 60-80% per beat |

**Animal targeting:** Low physical players attract more attention. Formula: `animalTarget = 1.0 - (physical * 0.08) + noise(1.5)`. Higher = more likely targeted.

**Teammate intervention:** Hero/nice archetypes can draw animals away. Roll: `physical * 0.06 + boldness * 0.04 + noise(2.5) > 0.25`. Success = +2 score, +bond, +pop. Failure = both player AND original target take penalty.

---

## Camp Events

| Trigger | Camp Event | Badge |
|---------|-----------|-------|
| Clean sweep Phase 1 | "{tribe} executed a flawless museum break-in" | badge-positive |
| 4+ alarms Phase 1 | "{player} triggered multiple alarms during the museum heist" | badge-negative |
| Piece race winner | "{player} snatched a statue piece from a rival tribe" | badge-positive |
| Defender heroic save | "{player} protected the statue from animal attacks" | badge-positive |
| Defender failure | "{player} let the animals destroy {tribe}'s statue progress" | badge-negative |
| Builder completes statue | "{player} assembled {tribe}'s statue to win immunity" | badge-positive |
| Villain sabotage | "{player} deliberately sabotaged the search" | badge-negative |

All camp events must have `players: []` array, `badgeText`, and `badgeClass`.

---

## Romance Hooks

- Call `_challengeRomanceSpark()` for all active player pairs at end of simulation (pass null for phases/phaseKey)
- Call `_checkShowmanceChalMoment()` at end (pass null for phases/phaseKey)
- Showmance moment opportunities: Phase 1 (calms nerves), Phase 2 (dark gallery), Phase 3 (comfort after setback)
- Always check `romanticCompat(a, b)` before any romance event
- Max 2 active showmances enforced by `_challengeRomanceSpark()` internally

---

## Integration Checklist (7 files)

1. **core.js** — TWIST_CATALOG entry: `{ id:'night-at-museum', emoji:'🏛️', name:'Night at the Museum', category:'challenge', chalSeries:'world-tour', chalStyle:'adventure', phase:'pre-merge', minTribes:2, engineType:'night-at-museum', desc:'Museum heist. Navigate security, search galleries for statue pieces, assemble under animal siege.', incompatible:[...all other challenge IDs...] }`

2. **twists.js** — In `applyTwist()`: `} else if (engineType === 'night-at-museum') { if (gs.isMerged || gs.tribes.length < 2) return; ep.isNightAtMuseum = true; }`

3. **episode.js** — 7+ edits:
   - Import `simulateNightAtMuseum`
   - Dispatch block (pre-merge, tribes >= 2)
   - Generic challenge skip condition: add `|| ep.isNightAtMuseum`
   - Generic updateChalRecord guard: add `&& !ep.isNightAtMuseum`
   - `_hasTwistChallenge` list: add `|| ep.isNightAtMuseum`
   - `handleExileFormat` guard: add `|| ep.isNightAtMuseum`
   - ALL `gs.episodeHistory.push` calls (8+): add `isNightAtMuseum: ep.isNightAtMuseum || false, nightAtMuseum: ep.nightAtMuseum || null`

4. **vp-screens.js** — Import VP builders + screen registration (Title, Security, Gallery, Assembly, Results)

5. **text-backlog.js** — Import + `_textTwistChallenge()` call with VP builders (BEFORE `_textCampPost`)

6. **main.js** — `import * as nightMuseumMod from './chal/night-at-museum.js';` + add to spread array

7. **run-ui.js** — Badge tag for episode timeline

---

## VP Screens

| Screen | Function | Content |
|--------|----------|---------|
| Title Card | `rpBuildNMTitleCard` | Cold open, museum intro, tribe blocks, host quote |
| Security Breach | `rpBuildNMSecurity` | Per-tribe: pre-attempt events → security rolls → alarm count → blame/bond |
| Gallery Search | `rpBuildNMGallery` | Statue debate → room-by-room search → cross-tribe collisions → pieces found |
| Assembly | `rpBuildNMAssembly` | Role debate → progressive assembly → animal attacks → completion |
| Results | `rpBuildNMResults` | Per-tribe breakdown, expedition board, final standings |

Each screen: own `screenKey`, `_tvState[key]` with `idx: -1`, `_reapplyVisibility()` in both revealNext/revealAll, try-catch wrapped sidebar/map updates, DOM-only reveals (never rebuild page).

---

## VP Identity

**Theme:** Grand museum at night — marble floors, dim gallery lighting, security lasers (red/green), classical art frames, golden accents. Shifts from sleek heist (Phase 1) to chaotic gallery (Phase 2) to siege (Phase 3).

**CSS prefix:** `nm-`

**Unique visual primitives (NO reuse from other challenges):**
- CSS-only laser beam icons (animated red lines)
- Marble card backgrounds with gold leaf borders
- Security camera sweep animation (background)
- Gallery frame borders on cards (ornate gold)
- Animal threat indicator in sidebar (escalating red glow)
- Statue assembly progress tracker (silhouette filling in)

**Fonts:** Display font for headers (serif/classical), monospace for security readouts

**Sidebar:** Live-updating per reveal. Shows:
- Alarm count per tribe (Phase 1)
- Pieces found per tribe (Phase 2)
- Assembly progress + defender stats (Phase 3)
- Animal threat level indicator

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
