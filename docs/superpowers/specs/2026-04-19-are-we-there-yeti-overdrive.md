# Are We There Yeti? — Overdrive Design Spec

**Date:** 2026-04-19
**File:** `js/chal/are-we-there-yeti.js` (modify in place)
**Goal:** Fix 12 gameplay bugs + rebuild VP from generic cards to immersive forest survival experience with trail map tracker, forest depth layers, Sasquatch visual arc, cave mouth POV, footstep reveals, and dawn verdict.

---

## Identity

**Vibe:** Forest survival — dread through isolation, warmth through campfire, tension through creature proximity. NOT slasher (Slasher Night owns that). NOT surveillance (Camp Castaways owns that). This is a night hike that went wrong.

**Two Visual Anchors:**
1. **Trail map** — hand-drawn style, fills in as you reveal events. Persistent per screen. Pairs tracked as colored routes. Landmarks, traps, Sasquatch sightings marked.
2. **Forest depth layers** — CSS parallax that darkens per phase. Background IS the emotional progression.

**Anti-reuse clause:** No other challenge VP may use: trail map tracker with footstep reveals, forest parallax depth layers shifting per phase, CSS Sasquatch silhouette with visual proximity arc, cave-mouth POV framing, or dawn-at-totem-pole verdict.

---

## Forest Depth Layers

CSS parallax background, shifts per phase via `data-phase` attribute:

| Phase | Scene | Sky | Trees | Ground |
|-------|-------|-----|-------|--------|
| 0 — Drop Off | Clearing | Twilight blue-green, clouds | Sparse edge trees, bright | Grass, helicopter pad |
| 1 — Navigation | Forest entry | Deepening dusk, orange horizon | Dense, medium dark | Dirt trail, roots |
| 2 — Traps | Deep woods | Purple dusk, first stars | Very dense, dark silhouettes | Undergrowth, shadows |
| 3 — Overnight | Cave mouth POV | Black sky, moon through opening | Cave walls frame | Cave floor, campfire glow |
| 4 — Sprint | Dawn breaking | Golden light right edge, pink clouds | Trees thinning, light between | Trail to totem pole |
| 5 — Verdict | Totem clearing | Full dawn, warm gold | Cleared, open sky | Totem pole center |

Implementation: 3 CSS layers (`::before`, `::after`, base) with `background` shifts driven by `data-phase`.

---

## Sasquatch Visual Arc

CSS-drawn silhouette (no image file). Dark shape, 2 red-orange (`#ff4d00`) dots for eyes.

| Phase | Position | Size | Visibility |
|-------|----------|------|------------|
| 1 — Hints | Far background between trees | 30px | Flickers in/out, 0.3 opacity |
| 2 — Stalking | Mid-ground, closer | 60px | 0.6 opacity, eyes glow |
| 3 — Chase | Fills cave mouth opening | 120px+ | Full opacity, blocks exit |
| 3 — Overnight | Eyes only at cave mouth | 2 dots | Pulse animation, 0.8 opacity |
| 4 — Sprint | Behind stragglers | 60px, moving | Fast horizontal drift |
| 5 — Verdict | Absent | — | Gone. Dawn broke. |

CSS class: `.sasquatch-presence[data-proximity]` with values `far`, `mid`, `close`, `filling`, `eyes`, `chasing`, `gone`.

---

## Trail Map

Hand-drawn style element at top of each screen (120px height, fixed). Contains:

- Dotted trail paths (pair A = amber, pair B = silver, pair C = green if 3+ pairs)
- Path segments draw in per reveal click (CSS `stroke-dashoffset` or width animation)
- Landmark icons along path: cliff, river, trap (X mark), Sasquatch sighting (claw), cave (convergence), totem pole (destination)
- Pair position markers (colored dots) advance per reveal
- Cave = convergence point where all paths merge
- Sprint = single race line to totem pole

Implemented as positioned `<div>` elements with CSS borders/transforms — absolute-positioned dots on a gradient progress bar. No SVG required.

---

## Screens (7+)

| # | ID | Label | Phase |
|---|-----|-------|-------|
| 1 | `yeti-dropoff` | The Drop Off | 0 |
| 2+ | `yeti-trail-{label}` | Trail: Pair {label} | 1 |
| N | `yeti-traps` | Traps & Tricks | 2 |
| N+1 | `yeti-night` | The Night | 3 |
| N+2 | `yeti-sprint` | The Sprint | 4 |
| N+3 | `yeti-verdict` | Chef's Verdict | 5 |

Trail screens scale with pair count (2-3 screens for 2-3 pairs after bug fix #1).

---

## Footstep Reveal System

All screens use `_tvState[key]` with `idx: -1`. Events hidden by default.

**Reveal button:** `"Keep moving →"` — styled as trail marker (wooden sign shape, amber text on bark-brown background, slight rotation).

**On each click:**
1. Next event card fades in (`opacity 0→1` + `translateY(8px→0)` over 0.3s)
2. Trail map: next path segment draws in
3. Pair position dot advances one step
4. Sasquatch event: creature silhouette shifts closer (0.5s delay before card)
5. Catch/grab event: screen border flashes red-orange briefly

**Reveal All:** `"Run to the end ▸▸"` — smaller, below main button. Draws full map, shows all events.

---

## Event Card Styling

Cards render as torn notebook pages pinned to the forest scene:

- Background: `rgba(245,235,220,0.06)` — faint parchment
- Left border: jagged torn-edge effect (CSS `clip-path` polygon)
- Portrait left-aligned, text right
- Badge as ink stamp (rotated -3°, uppercase, heavy letter-spacing)
- **Sasquatch events:** red-orange torn edge, shake animation on appear
- **Grudge events:** red stamp overlay ("NOTED." / "STRIKE." / "UNACCEPTABLE.")
- **Brave/gold events:** amber glow border, ember particle CSS burst on appear
- **Theft events:** strikethrough text revealing true action (CSS animation)

---

## Cave Mouth POV — The Night (Screen: yeti-night)

Entire viewport IS the cave interior looking outward.

### Scene Layout
- **Cave walls:** Dark rocky gradient borders framing left/right edges, narrowing toward mouth
- **Cave mouth opening:** Center-top, ~40% width. Shows dark forest + moon. Sasquatch appears here.
- **Campfire:** Bottom-center. CSS animated flame (3 layered divs, `border-radius` + `@keyframes` flicker). Amber radial gradient upward.
  - Campfire story → fire brightens, glow expands
  - Theft → fire dims momentarily (0.5s transition)
  - Morning → embers, golden light floods from mouth
- **Player portraits:** Semicircle around campfire. Active player gets glow highlight.

### Sasquatch at Cave Mouth
- **Chase beat:** Full silhouette charges toward opening, fills it. Eyes glow. Holds 2s, retreats to eyes-only.
- **Overnight:** Eyes drift left-right across mouth. Slow `@keyframes` horizontal oscillation. Never fully gone.
- **Morning:** Eyes vanish. Golden light replaces them.

### Event Cards
Overlay on cave scene with translucency so scene stays visible underneath.

---

## Chef's Verdict — Dawn at Totem Pole (Screen: yeti-verdict)

Forest layers = full dawn. Golden light. Open clearing. Totem pole center (CSS stacked colored segments, carved face top).

### Reveal Sequence (one click per beat)

**Beat 1 — Winning pair arrives.**
Portraits animate in from left. Totem pole glows. `"🏆 PAIR IMMUNITY"`. Golden ring on both portraits.

**Beat 2-N — Grudge meter bars.**
One bar per click. Red fill animates left-to-right. Sources as small text below: `"Disrespect +1.0 | Cowardice +0.5"`. Tension builds with each reveal.

**Beat N+1 — Helicopter arrives.**
CSS helicopter silhouette descends top-right. Chef quote in stencil font: `"Listen up."`

**Beat N+2 — Chef points.**
Grudge-gated elimination line. Eliminated portrait: color drains to grayscale (CSS filter 1s), red border pulse, name turns red, `"ELIMINATED BY CHEF"` stamp.

**Beat N+3 — Eliminated reaction.**
Confessional card. Elimination quote. Portrait greyed. Archetype label. Final score.

**Beat N+4 — Torch snuff.**
Existing `torchSnuffFx` inside dawn scene. `"Chef has spoken."` text.

---

## Gameplay Fixes (12 items)

### Fix 1 — Pair formation creates halves, not pairs
**Current:** Splits 50/50. 6 players → two trios.
**Fix:** Chunk into pairs of 2. Odd count → last group is trio. 4 players = 2 pairs. 6 = 3 pairs. 5 = 2 pairs + 1 trio. VP trail screens scale to pair count.

### Fix 2 — Cross-pair event exclusion too aggressive
**Current:** `!otherPairEvents.has(e)` blocks all overlap.
**Fix:** Track per-pair independently. Cross-pair exclusion soft: prefer unused events, allow overlap if pool < 3 remaining.

### Fix 3 — Showmance field mismatch
**Current:** `sm.a`/`sm.b` — should be `sm.players[0]`/`sm.players[1]`.
**Fix:** Use correct field access. Add `romanticCompat` check before showmance moment fires.

### Fix 4 — Sprint overwrites personalScores
**Current:** `personalScores[name] = sprintScores[name]` double-counts stat bonuses.
**Fix:** Store sprint deltas separately. Final = `personalScores[name] + sprintDelta[name]`.

### Fix 5 — `_archOf` uses `window.players`
**Fix:** Use imported `players`. Same for `_isVillain`, `_isNice`, `_canScheme`.

### Fix 6 — Schemers dominate phase 2
**Fix:** Add nice-archetype events: scouting (+0.5), morale rally (bond + 0.3), shelter improvement (+0.3 score, -0.3 grudge), wildlife calming (+0.5). 6 nice options total, fire 2-3 per nice player.

### Fix 7 — Overnight theft only fires for first schemer
**Fix:** Allow up to 2 theft attempts if multiple schemers. Add supply recovery path for nice archetypes: `loyalty * 0.08 + intuition * 0.06 + noise` vs thief's `strategic * 0.06`.

### Fix 8 — Grudge meter too easy to game
**Fix:** Cap grudge floor at -2.0. Increase elimination noise from ±0.5 to ±1.0.

### Fix 9 — Missing romance spark check
**Fix:** Add `_challengeRomanceSpark()` in phase 3 (overnight, forced proximity).

### Fix 10 — Missing showmance challenge moment
**Fix:** Add `_checkShowmanceChalMoment()` in phase 3 during campfire/vulnerability beats.

### Fix 11 — No step-based reveal
**Fix:** Addressed by footstep reveal system. All screens get `_tvState` click-to-reveal.

### Fix 12 — Landmark event wastes slot on miss
**Fix:** Only increment `eventsFired` if timeline event was pushed. Add else branch with filler beat or skip.

---

## File Changes

### `js/chal/are-we-there-yeti.js`
- **Simulate:** Fix bugs 1-10, 12. Add new nice-archetype events. Fix pair formation. Fix sprint scoring. Add romance hooks.
- **CSS:** Replace `YETI_STYLES` entirely. New forest depth system, trail map, cave mouth, Sasquatch presence, torn-page cards, footstep reveal styling.
- **VP functions:** Rewrite all 7 `rpBuild*` functions with new visual systems. Add footstep reveal logic. Add cave mouth scene. Add dawn verdict sequence.
- **Reveal functions:** New `yetiRevealNext(stateKey, total)` / `yetiRevealAll(stateKey, total)` for footstep system.

### `js/vp-screens.js`
- Update screen push to handle variable pair count (2-3 trail screens).
- No other changes needed (imports already in place).

### No other files changed.
All fixes and overdrive contained within `are-we-there-yeti.js`.
