# African Lying Safari — Challenge Design Spec

**Date:** 2026-05-12
**Type:** Post-merge individual immunity challenge
**Origin:** Total Drama World Tour S3E21 "African Lying Safari"
**File:** `js/chal/african-lying-safari.js`

---

## Overview

3-phase post-merge challenge set on the golden savanna plains. Phase 1: Sock-et To Me — a soccer dodgeball gauntlet where players collect plums under fire. Phase 2: Gourd Smash — convert plums into tranquilizer ammo. Phase 3: The Great Safari Hunt — an extended timeline-based hunt for Chef (gone feral in a costume) across 6 savanna zones with wildlife hazards, social drama, alliances, betrayals, and escalating tension.

The hunt phase is the centerpiece — long, event-dense, and unpredictable. Every tick generates multiple events. The savanna is alive.

**TWIST_CATALOG entry:**
```javascript
{ id: 'african-lying-safari', emoji: '🔭', name: 'African Lying Safari',
  category: 'challenge', chalSeries: 'world-tour', chalStyle: 'hunt',
  phase: 'post-merge',
  desc: 'Soccer dodge gauntlet → gourd smash for ammo → extended savanna hunt for feral Chef. Timeline tracker with wildlife hazards, quicksand, baboon theft, alliance hunts, and rivalry showdowns.',
  engineType: 'african-lying-safari',
  incompatible: [/* all other challenge IDs */] }
```

**World Tour rule:** Never mention Tanzania, Africa, or Serengeti by name. Use "the endless plains," "the golden savanna," "the watering hole," etc.

---

## Phase 1: Sock-et To Me (Dodge & Collect)

Each player takes a turn sprinting through a gauntlet to collect plums from a pile at the far end. While they run, every OTHER player kicks soccer balls at them.

### Runner's Turn

```
dodgeRoll = physical * 0.25 + boldness * 0.25 + intuition * 0.25 + endurance * 0.25 + noise(2.5)
basePlums = 2 + floor((dodgeRoll - 3.5) / 1.5)   // clamped 1–6
```

Each other player gets a kick:
```
kickRoll = physical * 0.35 + strategic * 0.30 + boldness * 0.15 + noise(2.5)
```

If `kickRoll > dodgeRoll`: HIT — runner loses 1 plum, kicker gets pop +0.5, bond(kicker, runner) -0.5.

`finalPlums = max(1, basePlums - totalHits)`

### Runner Events (one guaranteed per turn, ~40% chance of bonus)

| Event | Trigger | Effect |
|-------|---------|--------|
| **Ball Deflection** | Runner `physical >= 7` + `dodgeRoll >= 8` | Runner kicks a ball back at a kicker. Kicker humiliated: pop -1, bond -1. Runner pop +1. |
| **Targeted Headshot** | Kicker is villain archetype + runner is their rival (lowest bond) | Double damage: runner loses 2 plums. Kicker taunts. Bond -1.5. |
| **Intentional Miss** | Kicker is nice archetype + runner is ally (bond >= 3) | Kicker deliberately whiffs. Bond +1. If noticed by others: kicker loses pop -0.5. |
| **Soccer Prodigy** | Runner `physical >= 8` | Runner dodges everything in a spectacular display. Guaranteed max plums. Pop +1. |
| **Comedy Wipeout** | Runner `dodgeRoll <= 3.5` | Runner faceplants. Loses all but 1 plum. Hilarious narration. Pop -1 but bond +0.5 with everyone (sympathy). |
| **Collateral Damage** | 2+ kickers aim at same runner | Balls collide mid-air. Both kickers miss. Comedy moment. |

### Scoring
`chalMemberScores += finalPlums * 2`

---

## Phase 2: Gourd Smash (Earn Ammo)

Players use collected plums to smash gourds open. Each plum = one attempt. The order you smash determines your ammo tier.

### Per Attempt
```
smashRoll = physical * 0.35 + boldness * 0.30 + endurance * 0.20 + temperament * 0.15 + noise(2.5)
smashThreshold = 5.5
```

If `smashRoll >= threshold`: SMASH. Player is ranked by order of first successful smash.

### Ammo Tiers (by finish order)
| Place | Tranq Balls | Slingshot |
|-------|-------------|-----------|
| 1st smash | 6 | Yes |
| 2nd smash | 4 | Yes |
| 3rd smash | 3 | Yes |
| 4th-5th smash | 2 | Yes |
| Failed (no smash) | 1 | No (-1.5 penalty in Phase 3) |

### Gourd Smash Events (~35% chance per player)

| Event | Trigger | Effect |
|-------|---------|--------|
| **Chris Distraction** | Random | Chris calls the player "[rival]'s boyfriend/girlfriend" mid-swing. Mental check: `mental + noise(2) >= 5` or reroll at -2 penalty. |
| **Bat Toss** | Player `temperament <= 3` or `boldness >= 8` | Player flings the bat at the gourds in frustration/bravado. Auto-smash but loses 1 ammo as penalty. |
| **Intimidation Flex** | First smasher has `physical >= 7` | The dominant smash rattles the next player: they get -1 to their first attempt. |
| **Plum Misfire** | `smashRoll <= 3` | Player accidentally hits Chef (in his Penalty Parka). Comedy moment. Chef glares. No gameplay effect. |
| **Lucky Ricochet** | `smashRoll` between threshold-0.5 and threshold | The plum bounces off the gourd and THEN smashes it from behind. Counts as a smash. Crowd goes wild. |

### Scoring
`chalMemberScores += ammoTier * 3`

---

## Phase 3: The Great Safari Hunt (Timeline Tracker)

The main event. An extended hunt across the savanna for Chef (gone feral in an animal costume). Timeline-based with 14-18 ticks. Dense with events — every tick has MULTIPLE things happening. The savanna is a living, breathing environment.

### Zones (6 total)
Each zone has a primary wildlife hazard and a terrain modifier.

| Zone | Hazard | Terrain Effect | Flavor |
|------|--------|----------------|--------|
| **Watering Hole** | Crocodile | +1 to track (clear sightlines), risk of croc ambush | Muddy banks, hippo silhouettes, still water |
| **Tall Grass** | Snake | -1 to track (poor visibility), +1 to hide | Shoulder-high golden grass, rustling sounds |
| **Acacia Grove** | Baboon pack | Baboons steal ammo, but trees give vantage points | Twisted trees, dappled shade, chattering |
| **Rocky Outcrop** | Eagle/falling rocks | +2 to track from high ground, but exposed to hazards | Stacked boulders, vultures circling |
| **Mud Flats** | Quicksand | Slows movement (skip a tick if caught), good footprints | Cracked earth, geysers of mud |
| **Riverbed** | Hippo | Must cross to change zones, hippo blocks path | Dry riverbed with pools, reeds |

### Chef Movement
Chef starts in a random zone. Every 3 ticks, Chef moves to an adjacent zone (predetermined path with some randomness). Players can track Chef's movement through clues.

Chef gets warier over time:
```
chefDodge = 5.0 + tick * 0.15
```

### Per-Tick Player Actions

Each tick, every player:
1. **Explores current zone:**
```
trackRoll = intuition * 0.30 + mental * 0.25 + strategic * 0.25 + endurance * 0.20 + noise(2.5)
trackRoll += zone.terrainModifier
```

2. **Clue discovery:** If `trackRoll >= 5.5` → find a clue (paw print, torn fabric, claw marks, fur sample)
   - 1 clue = general direction
   - 2 clues = zone narrowed to 2
   - 3+ clues = Chef's exact zone known

3. **Chef encounter:** Player needs 2+ clues AND is in Chef's zone AND `trackRoll >= 7.0`

4. **Tranq shot (if encounter):**
```
tranqRoll = physical * 0.30 + boldness * 0.25 + intuition * 0.25 + strategic * 0.20 + noise(2.5)
noSlingshot: tranqRoll -= 1.5
```
   - If `tranqRoll >= chefDodge`: HIT — player wins immunity
   - Each shot costs 1 ammo. Player can fire multiple shots per encounter (one roll each)
   - If all miss: Chef flees to random non-adjacent zone, all players in zone lose their clues back to 1

5. **Zone movement:** Player can move to an adjacent zone (costs the tick — no tracking this tick)

### Hunt Events

**GUARANTEED events: 2-3 per tick.** Bonus events at ~40% each. The savanna should feel chaotic and alive.

#### Wildlife Hazards (1 per tick, random player in a hazard zone)

| Hazard | Zone | Roll | Fail Effect | Success Effect |
|--------|------|------|-------------|----------------|
| **Crocodile Lunge** | Watering Hole | `physical * 0.4 + boldness * 0.3 + noise(2) >= 6` | Lose 1 ammo + stuck 1 tick (dragged under) | Dramatic escape, pop +1 |
| **Snake Strike** | Tall Grass | `intuition * 0.4 + temperament * 0.3 + noise(2) >= 5.5` | Paralyzed — skip next tick | Catch the snake, use as rope tool (+1 next trackRoll) |
| **Baboon Ambush** | Acacia Grove | `social * 0.3 + temperament * 0.3 + noise(2) >= 5` | Baboons steal 1-2 ammo | Befriend baboons, they lead you toward Chef (+1 clue) |
| **Rock Slide** | Rocky Outcrop | `endurance * 0.4 + physical * 0.3 + noise(2) >= 6` | Knocked down, lose 1 tick + minor injury narrative | Climb through, reach vantage point (+1 clue) |
| **Quicksand Trap** | Mud Flats | `endurance * 0.3 + mental * 0.3 + noise(2) >= 5.5` | Stuck — lose 2 ticks unless rescued by another player in zone | Spot it early, mark it for others (pop +1) |
| **Hippo Charge** | Riverbed | `boldness * 0.4 + physical * 0.3 + noise(2) >= 6.5` | Forced back to previous zone, drop 1 ammo | Stand ground — hippo yields, free zone crossing |

#### Social Events (1-2 per tick guaranteed)

| Event | Trigger | Effect |
|-------|---------|--------|
| **Alliance Hunt** | Two allied players (bond >= 3) in same zone | Both share clues (each gets the other's clue count, up to max). Bond +1. Narration: tracking together, pointing out signs. |
| **Ammo Theft** | Villain/schemer + another player in same zone | Steal 1-2 ammo. Bond -2. Victim gets camp event. If detected (victim `intuition >= 7`): thief takes pop -2 instead, ammo returned. |
| **Rivalry Showdown** | Two enemies (bond <= -3) in same zone | Physical confrontation over a clue. Both roll `physical + boldness + noise(2.5)`. Winner gets +1 clue. Loser loses 1 tick. Bond -1 both. Pop changes based on who started it. |
| **Quicksand Rescue** | Player stuck in quicksand + another player in Mud Flats | Rescuer pulls them out. Bond +3. Both pop +1. Rescued player owes a debt (narrative). |
| **Slingshot Sabotage** | Schemer near a player with slingshot | Tamper with slingshot: target's next tranqRoll gets -1. If caught (target `intuition + mental >= 12`): saboteur exposed, pop -2, bond -3. |
| **Shared Watering Hole** | 3+ players at Watering Hole same tick | Forced social moment. Highest social player gets intel: learns one zone Chef is NOT in. Others bond +0.5 with each other. |
| **Panic Stampede** | Wildlife hazard fail in a zone with 2+ players | The fleeing player's panic startles everyone in the zone. All other players in zone lose their current-tick tracking (no clue this tick). Comedy narration. |
| **Tracker's Instinct** | Player with `intuition >= 8` and 0 clues after tick 5 | Pity mechanic: player gets a free clue. Narration: "Something in the wind. A feeling." |
| **Predator Stare** | Player with 3+ clues encounters another player with 0-1 clues | Dominant player can choose to share a clue (bond +2) or intimidate (bond -1, pop +0.5 for dominance). Archetype-driven: nice always share, villains never share, neutrals check strategic vs loyalty. |
| **Chef Sighting** | Random (15% per tick after tick 4) | Chef briefly appears — ALL players in the zone get +1 clue. Players in adjacent zones hear the commotion and learn Chef's zone. Dramatic narration. |
| **Baboon Courier** | Player in Acacia Grove with `social >= 7` | A baboon brings an item — 50% chance it's useful (clue) or 50% chance it's garbage (comedy). |
| **Night Falls** | After tick 10 | Visibility drops. All trackRoll penalties of -1. But Chef slows down (chefDodge stops increasing). Narration shifts to night mode. Flashlight/torch flavor. |
| **Desperation Sprint** | Player with most clues + ammo, tick 12+ | If no one has won yet, the leading player gets a guaranteed Chef encounter. Final showdown narration. |

#### Encounter Events (when player finds Chef)

| Event | Trigger | Effect |
|-------|---------|--------|
| **Chef Counterattack** | Chef encounter + player `boldness <= 4` | Chef lunges first. Player must pass `physical + temperament >= 10` or lose 1 ammo before they can shoot. |
| **Perfect Ambush** | Player `intuition >= 8` + `strategic >= 7` | Player gets +2 to first tranqRoll. Narration: patient stalking, perfect positioning. |
| **Showmance Distraction** | Player encounters Chef while showmance partner is in same zone | The partner distracts Chef for a moment. Player gets +1 to all tranqRolls this encounter. Romance moment narration. |
| **Last Dart Drama** | Player down to 1 ammo | Heightened narration. If they miss, dramatic failure text. If they hit, legendary clutch moment. Pop +2 on hit. |
| **Steal the Kill** | Two players encounter Chef same tick | Both roll tranq simultaneously. Higher roll wins. Loser's shot misses. Massive rivalry moment. Bond -2. |

### Win Condition
- **Primary:** First player to successfully tranq Chef wins immunity.
- **Tiebreaker (tick 14+):** If no one has tranq'd Chef by the final tick, the player with the highest composite score wins: `clues * 3 + ammoRemaining * 2 + (hazardsSurvived * 1)`.
- **Immunity winner bonus:** `maxOther + active.length + 5` to chalMemberScores.

### Scoring
```
chalMemberScores += clues * 3 + ammoSpent * 2 + hazardsSurvived * 1
immunityWinner: += maxOther + active.length + 5
```

---

## Social Systems

### Romance
- `_challengeRomanceSpark()` during Phase 3 when two compatible players are in the same zone during a wildlife hazard (danger bonding).
- `_checkShowmanceChalMoment()` during shared zone moments and quicksand rescues.

### Popularity
| Action | Delta |
|--------|-------|
| Ball deflection (Phase 1) | +1 |
| Comedy wipeout (Phase 1) | -1 |
| Soccer prodigy dodge | +1 |
| Heroic quicksand rescue | +1 |
| Ammo theft (if caught) | -2 |
| Rivalry showdown winner | +1 |
| Clutch last-dart tranq | +2 |
| Clean immunity win | +1 |
| Wildlife hazard comedy fail | -1 |
| Befriending baboons | +1 |

### Camp Events
All significant Phase 3 events inject camp events: ammo theft, rivalry showdowns, quicksand rescues, alliance hunts, kill steals. Each has `players: []` array + `badgeText`/`badgeClass`.

### Temporary Heat
```javascript
gs._safariHeat = { target, amount, expiresEp }
```
Generated by: ammo theft, targeted headshots (Phase 1), rivalry showdowns, slingshot sabotage.

---

## VP Visual Identity: Safari Documentary Journal

### Design Language
Wildlife documentary camera aesthetic merged with hand-drawn field journal. The VP should feel like watching a nature documentary that someone is also sketching in a leather notebook.

### Technical Specs
- **Class prefix:** `als-`
- **Fonts:** Display = Playfair Display, Body = Lora
- **Max width:** `max-width: 1100px; margin: 0 auto`
- **Color palette:**
  - `--als-gold: #C4A35A` (savanna gold, primary accent)
  - `--als-dust: #E8D5B0` (parchment/dust, card backgrounds)
  - `--als-acacia: #5B7744` (acacia green, success states)
  - `--als-sunset: #D4763C` (sunset orange, danger/elimination)
  - `--als-night: #2A2D45` (night indigo, Phase 3 late ticks)
  - `--als-earth: #8B6B4A` (earth brown, borders/text)
  - `--als-ink: #2C1810` (dark ink, primary text)

### Phase-Specific Environments
- **Phase 1 (Sock-et To Me):** Bright midday savanna. Bleached sky, heat shimmer effect (CSS animation). Soccer field markings made of dust.
- **Phase 2 (Gourd Smash):** Golden hour. Long shadows, warm amber glow. Gourd pile with scattered plums.
- **Phase 3 early (Ticks 1-9):** Late afternoon → dusk. Gradient shift from warm gold to deep orange. Acacia tree silhouettes.
- **Phase 3 late (Ticks 10+):** Night. Deep indigo sky, star field (CSS dots), moonlit edges on cards. Flashlight/torch cone overlay on active player cards.

### Card Design
- Torn parchment edges (CSS clip-path with jagged polygon)
- Ink-wash background gradient on event cards
- Compass rose watermark (CSS pseudo-element, low opacity)
- Field sketch icons: CSS-only binoculars, tranq dart, paw print, soccer ball, gourd, slingshot, each animal silhouette
- Wildlife hazard cards: red-orange border, animal silhouette icon, danger stamp
- Social event cards: dashed khaki border, different background tone
- Chef encounter cards: viewfinder crosshair border (CSS corners), lens flare burst animation
- Clue cards: magnifying glass icon, torn paper edge, handwritten-style italic text

### Sidebar: Field Journal Tracker
- Player portraits as "passport stamps" with ink-ring borders
- Clue count as tally marks (CSS pseudo-elements, groups of 5)
- Ammo as tiny tranq dart icons (filled = available, empty = spent)
- Current zone indicator per player
- Zone map: simple top-down savanna with animal silhouettes at each zone, player dots that move
- Chef's last known position (only shown if player has 2+ clues in the narrative sense — but VP shows the real position gated by `_tvState`)
- Hunt progress bar: tick counter, "Night Falls" marker at tick 10

### Ambient Narration
Attenborough-style flavor text between cards (8-10 per phase):
- "The hunter becomes still. The savanna holds its breath."
- "Something moves in the tall grass. Or perhaps it was nothing."
- "The golden hour bleeds into dusk. Time is running out."
- "A distant roar. Every head turns. Nobody moves."
- "The savanna does not forgive hesitation."
- "Somewhere out there, Chef watches. And waits."
- "The sun touches the horizon. The hunt enters its final chapter."
- "Night falls like a curtain. The rules change."

### Sticky Elements
1. Phase tracker breadcrumb bar (top: 46px)
2. Savanna zone map (Phase 3 only, sticky below tracker)
3. Sidebar field journal (sticky, scrollable)
4. Fixed reveal controls (bottom: 0)

### Animations
- Card entry: ink-blot spread (`clip-path` animation from center)
- Chef encounter: viewfinder lock-on (crosshair corners animate inward)
- Tranq hit: dart-thud impact + screen shake
- Wildlife hazard: card tilts + dust burst
- Night transition: background gradient shifts over 2s
- `@media (prefers-reduced-motion: reduce)`: all animations disabled, static fallback

---

## Integration Points

### Files to Update (7 total)
1. **`js/core.js`** — TWIST_CATALOG entry
2. **`js/twists.js`** — `engineType` → `ep.isAfricanLyingSafari = true` in `applyTwist()`
3. **`js/episode.js`** — 7 locations: import, dispatch, generic skip, updateChalRecord guard, `_hasTwistChallenge`, `handleExileFormat` guard, episode history save (4+ push calls)
4. **`js/vp-screens.js`** — import rpBuild functions, register VP screens
5. **`js/text-backlog.js`** — import VP builders, add `_textTwistChallenge()` call
6. **`js/main.js`** — import module
7. **`js/run-ui.js`** — episode timeline badge tag

### Data Shape
```javascript
ep.challengeData = {
  // Phase 1
  sockerResults: [{ name, dodgeRoll, plums, hits, hitBy: [], events: [] }],
  // Phase 2
  gourdResults: [{ name, attempts, smashRoll, smashOrder, tranqAmmo, hasSlingshot }],
  // Phase 3
  huntTicks: [{
    tick, chefZone, chefDodge,
    playerStates: [{ name, zone, clues, ammo, trackRoll, events: [] }],
    events: [{ type, player, target, text, consequences }],
    encounter: { player, tranqRolls: [], hit: boolean } | null,
  }],
  immunityWinner,
  winnerText,
  huntWinTick,
  zones: [...],
  // Standings
  standings: [{ name, clues, ammoSpent, ammoRemaining, hazardsSurvived, finalScore }],
};
```

---

## Noise & Balance

- All stat checks use `noise(2.5)` minimum
- Phase 1: dodgeRoll uses 4 stats equally (0.25 each) — no archetype dominance
- Phase 2: physical/boldness lead (challenge-beasts shine here) but noise allows upsets
- Phase 3 tracking: intuition leads (perceptive-players excel) but mental/strategic matter too
- Phase 3 tranq: physical/boldness lead (different from tracking — finding Chef ≠ shooting Chef)
- Ammo economy creates real scarcity — max 6 shots, most players have 2-3
- No slingshot penalty (-1.5) is significant but not fatal
- Chef gets harder over time but "Night Falls" at tick 10 freezes his dodge — rewards patience
- Desperation Sprint at tick 12+ prevents games from stalling
- Wildlife hazards use different stats per zone — spread the advantage across archetypes
