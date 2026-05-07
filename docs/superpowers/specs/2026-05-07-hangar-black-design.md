# Operation: Hangar Black — Challenge Design

## Overview
A both-phase twist challenge based on Total Drama World Tour's "The EX-Files." Players breach a secret facility, hunt alien specimens room-by-room in a push-your-luck system, then extract through escalating hazards. Aggressive specimens score high but can escape during extraction, zeroing your score.

**ID:** `hangar-black`
**Phase:** `both` (pre-merge and post-merge)
**Style:** `adventure`
**Series:** `world-tour`
**VP Identity:** "Operation: Hangar Black" — military sci-fi / B-movie retro. Dark desert night, green HUD, scanlines, tactical SVG map.

## Challenge Structure

### 3 Phases

| Phase | Name | Core Mechanic |
|-------|------|--------------|
| 1 | **ENTRY** | Breach the facility — pick entry method (vent/fence/bluff). Method determines starting HP and map position. |
| 2 | **HUNT** | Room-by-room push-your-luck. Each room has a hazard tier (Green/Yellow/Red). Choose: advance (risk hazard, find better specimens) or secure (lock in, stop hunting). |
| 3 | **EXTRACTION** | Carry specimen back through facility. Hazards intensify. Social events fire — help, sabotage, steal, guard. Aggressive aliens can escape. |

### Pre-Merge vs Post-Merge

- **Pre-merge:** Tribe scores = average member scores. Captain picks entry method. Room progression is per-tribe. Losing tribe goes to tribal.
- **Post-merge:** Individual scores. Each player navigates independently. More social events. Highest score = immunity.

## Gameplay Mechanics

### Entry Phase

| Method | HP Cost | Map Position | Stat Check |
|--------|---------|-------------|------------|
| **Vent Crawl** | -5 HP | Deep start (skip room 1) | Physical + Stealth |
| **Fence Cut** | -10 HP | Standard start | Strategic + Mental |
| **Guard Bluff** | 0 HP | Standard start, but if failed: -20 HP + alarm (raises hazard tier globally by 1) | Social + Boldness |

Pre-merge: tribe captain picks for the whole tribe. Post-merge: individual choice, stat-weighted with noise.

### Hunt Phase (Push-Your-Luck)

**Room tiers escalate with depth:**

| Depth | Tier | Hazard Examples | Specimen Quality |
|-------|------|----------------|-----------------|
| Room 1 | Green | Motion sensor, locked door | Docile (3-5 pts) |
| Room 2 | Yellow | Laser grid, guard patrol | Mixed (5-8 pts) |
| Room 3 | Red | Containment breach, security lockdown | Aggressive (8-12 pts) |
| Room 4 | Red+ | Full alarm, alien loose | Rare (12-18 pts) |

Each room: stat check vs hazard difficulty. **Pass** = collect specimen + choose advance/secure. **Fail** = take HP damage + choose advance/secure. **HP hits 0** = knocked out, lose ALL specimens, score 0.

**Secure decision:** `boldness * 0.15 + strategicRisk + noise(2.5)` — bold players push deeper, strategic players read the odds. Archetype modifiers: challenge-beasts push +1 room, floaters secure early, wildcards are pure noise.

### Specimen System

| Type | Score | Extraction Risk | Frequency |
|------|-------|----------------|-----------|
| **Docile** | 3-6 | Almost none (5% escape) | 50% |
| **Skittish** | 6-10 | Moderate (25% escape per hazard) | 30% |
| **Aggressive** | 10-18 | High (40% escape + HP damage) | 20% |

Players carry one specimen at a time. Finding a better one = drop the old one (decision point). Aggressive specimens are high-risk-high-reward — they can escape during extraction, zeroing your score.

### Extraction Phase

Reverse run back through the facility. Each room passed through generates a hazard on the way out. Specimen temperament determines escape chance per hazard.

**Social events (1-2 per extraction):**
- **Help ally:** Share intel about hazard ahead (+dodge bonus). Bond boost.
- **Sabotage rival:** Trip alarm near them (+hazard tier). Bond penalty. Villain/schemer only.
- **Steal specimen:** Snatch rival's alien if stunned by hazard. Massive bond penalty. Rare, schemer only.
- **Guard/Shield:** Block hazard for ally. HP cost to helper, specimen saved. Hero/loyal-soldier.
- **Encourage:** Morale boost after failed hazard check. Small stat buff. Social-butterfly/underdog.

### Scoring

**Final score** = specimen value × extraction multiplier (1.0 clean exit, 0.5 damaged, 0.0 escaped)
- Bonus: +3 deepest room reached, +2 zero HP damage during extraction
- Pre-merge: tribe score = average of member scores
- Post-merge: highest individual score = immunity

## VP Screens & Visual Identity

### Visual Target
Mockup at `mockup/area51.html` + `mockup/area51-app.jsx`. CSS prefix: `hb-`.

### Font Stack
- **Black Ops One** — titles, phase headers
- **Share Tech Mono** — monospace HUD elements, timestamps
- **Rajdhani** — body text, narration
- **Orbitron** — stat numbers, scores

### Color Palette
- `--hud: #92ffb3` (green HUD)
- `--warn: #ffb836` (warning amber)
- `--hot: #ff3a3a` (danger red)
- `--laser: #ff2a6a` (laser pink)
- `--alien: #b76dff` (alien purple)
- `--classified: #ff5e3a` (classified orange)

### Screen Breakdown

| # | Screen ID | Content | Reveal Steps |
|---|-----------|---------|-------------|
| 1 | `hb-title` | Abduction cold open + mission briefing | Static (animated) |
| 2 | `hb-entry` | Breach method per team/player, stat check, HP result | 1 per team/player |
| 3 | `hb-hunt` | Room-by-room progression — hazard, pass/fail, specimen, advance/secure | 1 per room per team/player |
| 4 | `hb-extract` | Extraction — hazard gauntlet, specimen escape, social events | 1 per event |
| 5 | `hb-results` | Final scores, immunity/tribe placements, specimen gallery | Static |

### Card Types
- **Briefing** (green left border) — mission intel, room descriptions
- **Movement** (team-colored border) — entry method, room advancement
- **Hazard** (red flash + cause→effect connector) — laser grid, guard patrol, alarm
- **Alien** (purple pulse border) — specimen encounters, temperament reveal
- **Discovery** (green glow) — successful specimen capture
- **Confessional** (dashed italic) — player reactions, strategy thoughts
- **Social** (dashed, distinct background) — help/sabotage/steal/guard events
- **Victory** (gold) — immunity winner / tribe result

### Title Screen: Abduction Cold Open

Animated sequence (~4 seconds, CSS-only `@keyframes`):
1. Stars twinkle on dark desert background
2. Green searchlight cone sweeps across ground
3. CSS-drawn UFO descends with wobble, trailing tractor beam
4. Player avatars in beam zone float upward with stagger delays (~0.3s apart), spin + glow
5. Abducted players scale down + fade into saucer hull
6. Saucer tilts and shoots off-screen with speed trail

Pre-merge: one random player per tribe gets abducted (captain). Post-merge: 3-4 random players. Purely cosmetic.

Title text fades in after animation: "OPERATION: HANGAR BLACK" with episode number, team/operator count, and team blocks.

### Tactical SVG Map

Facility layout with zones: Perimeter, Hangar, Labs, Containment, Deep Storage. Live-updates per reveal:
- Team tokens with tribe colors (pre) or individual colors (post), vertically staggered
- Hazard pulses on rooms as entered
- Specimen icons follow player tokens during extraction
- Facility border shifts green → yellow → red with alarm level
- Updated via `_updateMap(screenKey)` in try-catch, separate from sidebar

### Live-Updating Sidebar (4 panels)

1. **Race Progress** — depth bars per team/player (rooms 1-4)
2. **Operator Roster** — HP bars, status (active/stunned/KO'd), current specimen icon
3. **Artifact Status** — captured specimens grid with temperament + score, greyed if escaped
4. **Hazard Log** — scrolling hazard list with timestamps, feeds tension meter

All gated by `_tvState`. Rebuilds via `_buildSidebarContent()` → `sideEl.innerHTML`. Phase data on `window`, read from DOM `data-phase`.

### Atmosphere
- Dark desert night with perspective grid + scanlines + vignette + twinkling stars
- Phase color temperature: Entry = cold blue-green, Hunt = amber/warning, Extraction = red alert
- Card physics: hazard cards shake, alien cards pulse, KO cards slam
- Comm chatter flavor text: 8-10 per phase ("Operator 3, reading movement in Sector 7...")
- `@media(prefers-reduced-motion:reduce)` on all animations

## Integration

### TWIST_CATALOG
```
id:'hangar-black', emoji:'👽', name:'Operation: Hangar Black',
category:'challenge', chalSeries:'world-tour', chalStyle:'adventure',
phase:'both', engineType:'hangar-black'
```

### State & Episode Data
- `ep.isHangarBlack = true` (set in twists.js)
- `ep.challengeData` contains: entries[], huntRuns[], extractions[], scores{}, socialEvents[], immunityWinner/winningTribe

### 7-File Checklist
1. `js/chal/hangar-black.js` — new file (simulation + VP)
2. `js/core.js` — TWIST_CATALOG entry
3. `js/twists.js` — flag mapping
4. `js/episode.js` — import, dispatch, skip guards, _hasTwistChallenge, exile guard, ALL history pushes
5. `js/vp-screens.js` — import VP builders + screen registration
6. `js/text-backlog.js` — import + _textTwistChallenge()
7. `js/main.js` — import + spread array
8. `js/run-ui.js` — badge tag

### Romance Hooks
`_challengeRomanceSpark` between all active pairs, `_checkShowmanceChalMoment` for existing showmances. Pass `null` for phases/phaseKey.

### Camp Events
- Entry: "X chose [method] to breach the facility"
- Hunt: "X pushed to Room [N] and captured a [temperament] specimen"
- Extraction: social events inject as camp events
- KO: "X was knocked out — lost all specimens"

### Popularity
- Deep push (Room 4): +1 heroic
- Guard/shield ally: +1 heroic
- Sabotage/steal: -1 villainous
- KO'd with 0 specimens: -1 embarrassing
- Aggressive specimen successfully extracted: +2 legendary

## Anti-Reuse Clause
This challenge's visual identity (desert night scanlines, green HUD, tactical facility map, tractor beam, comm chatter) must NOT be reused by other challenges. Each challenge invents its own visual world.
