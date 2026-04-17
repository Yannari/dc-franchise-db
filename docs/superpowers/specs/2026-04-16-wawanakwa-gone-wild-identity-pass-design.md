# Wawanakwa Gone Wild — Identity Pass Design

Date: 2026-04-16
Scope: Visual-identity reinforcement on top of the already-shipped wow-pass. No gameplay changes.
Target file: `js/chal/wawanakwa-gone-wild.js` (all edits).

## Why this pass

The wow-pass landed every item in its plan (ticker, signal gauge, dart trail, mishap particles, tannoy, tier backdrops, food spread, podium, evidence boards). But in a Playwright visual audit, the middle 80% of the VP still reads uniform — 100 nearly-identical portrait-left/text-right cards that *declare* a ranger field-cam identity at the top but never *carry* that identity into each card. The strong finale (feast + podium + bathroom-duty) can't rescue 3000px of flat card-list preceding it.

This pass adds the minimum set of visual touches that make every card feel like a time-stamped field-cam log entry instead of a generic simulator card. Five touchpoints, all additive:

1. **Per-card timestamp + location stamp** — every event gets a `09:47 · LAKE SHORE` label suffix.
2. **Emoji glyphs in gear and animal pills** — 🦉 Owl, 🪚 chainsaw, 💉 tranq gun, etc.
3. **Tier backdrop intensity boost + extreme-tier scanline treatment** — makes the tier backdrops actually read.
4. **Per-round tannoy badge variation** — "HUNT IN PROGRESS" / "HOUR TWO" / "DUSK APPROACHES" / "LAST LIGHT".
5. **Approach-abort fallback text pool expansion** — kill the repeated `"${name} loses the trail."` line.

None of these require new event types, new simulation state, or changes to the reveal engine. They're all inside `_renderWWStep` and the timeline-building pass inside `rpBuildWawanakwaGoneWild`, plus one CSS touch-up block.

## What already exists (don't rebuild)

- `WW_STYLES` CSS block with ticker, signal gauge, tannoy, tier backdrops, podium, evidence board classes.
- `_wwReveal` / `_wwRevealAll` / `_wwDrawEvidenceLines` reveal engine.
- `rpBuildWawanakwaGoneWild` VP builder + `_renderWWStep` per-event renderer.
- `wrapTier(tier, cardHtml)` helper inside `_renderWWStep` for tier backdrops.
- Hunt Encounters event types (`huntBeat`, `animalReaction`, `stateChange`) and their render branches.

## Item 1 — Per-card timestamp + location stamp

### Data model

Augment the timeline pre-processing step (inside `rpBuildWawanakwaGoneWild`, before the `for (const evt of ww.timeline)` loop that pushes steps) with an annotation pass: walk the timeline once, add `_time` and `_location` fields to each event in-place, then build steps off the annotated timeline.

### Time progression

- Start clock at `07:00` (morning check-in).
- Each event advances the clock by `3 + random * 9` minutes (3–12 min), rounded to whole minutes.
- Format as `HH:MM` with zero-padding.
- After `22:59`, wrap to `00:00` and keep going (unlikely but safe).

Exceptions that don't advance the clock:
- `chrisQuip` (announcement/reaction) — uses current time, no advance
- `stateChange` — inherits the preceding event's time
- `animalReaction` — inherits the preceding `huntBeat`'s time

### Location mapping

Location is determined by event type + animal tier:

| Event type | Location |
|---|---|
| `animalDraw` | `DOCK` (hunters draw slips at the dock) |
| `gearGrab` | `BOATHOUSE` |
| `chrisQuip` | `RANGER STATION` |
| `feastReveal` | `CAMP MESS` |
| `punishmentReveal` | `LATRINE` |
| `tranqChaos` | `INCIDENT: WILDLIFE ZONE` (or variant based on subtype) |
| `huntBeat`, `huntAttempt`, `huntMishap`, `huntFail`, `animalReaction` | Lookup by animal tier (see below) |
| `stateChange` | inherits location from preceding event |
| `honorPodium` | `CAMP MESS` |

Tier-to-location pool (one picked per hunter at the start of the hunt, stays constant for their whole attempt sequence — so Bowie always hunts in the same zone):

| Tier | Locations (2-3 options per tier) |
|---|---|
| easy | `CAMP PERIMETER`, `WEST CLEARING`, `STREAM BANK` |
| medium | `NORTH TRAIL`, `DENSE WOODS`, `LAKE SHORE` |
| hard | `CANOPY RIDGE`, `SOUTH SWAMP`, `DEEP BRUSH` |
| extreme | `BEAR COUNTRY`, `CLIFF BASE`, `LOST VALLEY` |

Pre-compute once in the annotation pass:
- `huntState._hunterLocations[name] = <one of the tier locations>` at setup time.
- During annotation, hunt-related events for that hunter pick up their assigned location.

### Render integration

In `_renderWWStep`, the existing card-label area (`<div class="ww-card-label">...`) gets the timestamp + location prepended:

```html
<div class="ww-card-label">
  <span class="ww-timestamp">09:47</span>
  <span class="ww-location">LAKE SHORE</span>
  <span class="ww-label-divider">·</span>
  <span class="ww-label-kind">🎯 APPROACH</span>
</div>
```

New CSS classes:
- `.ww-timestamp` — monospace, `color:#c33` (matching the REC dot color), font-size:9px
- `.ww-location` — monospace, `color:#8b7750`, font-size:9px, letter-spacing:1px
- `.ww-label-divider` — `color:rgba(139,119,80,0.3)`

## Item 2 — Emoji glyphs in gear and animal pills

Two lookup maps (inserted as module-scope constants near `RANGER_FACTS`):

### `WW_ANIMAL_EMOJI`

```js
const WW_ANIMAL_EMOJI = {
  Chipmunk: '🐿️', Frog: '🐸', Rabbit: '🐇', Squirrel: '🐿️', Seagull: '🐦',
  Duck: '🦆', Raccoon: '🦝', Goose: '🦢', Skunk: '🦨', Porcupine: '🦔',
  Beaver: '🦫', Deer: '🦌', Snake: '🐍', 'Wild Turkey': '🦃', Owl: '🦉',
  Bear: '🐻', Moose: '🫎', Wolf: '🐺', Alligator: '🐊',
};
```

### `WW_GEAR_EMOJI`

Keyword-match helper (gear names are short and distinctive):

```js
function _wwGearEmoji(gearName) {
  const n = String(gearName || '').toLowerCase();
  if (n.includes('tranq')) return '💉';
  if (n.includes('chainsaw')) return '🪚';
  if (n.includes('net')) return '🕸️';
  if (n.includes('rope')) return '🪢';
  if (n.includes('sack') || n.includes('bag')) return '💼';
  if (n.includes('hook')) return '🎣';
  if (n.includes('smoke')) return '💣';
  if (n.includes('float')) return '🛟';
  if (n.includes('paper towel')) return '🧻';
  if (n.includes('flashlight') || n.includes('torch')) return '🔦';
  if (n.includes('binocular')) return '🔭';
  if (n.includes('compass')) return '🧭';
  if (n.includes('knife')) return '🔪';
  if (n.includes('whistle')) return '🎺';
  if (n.includes('hat') || n.includes('helmet')) return '🧢';
  if (n.includes('fish')) return '🎣';
  if (n.includes('bait')) return '🪱';
  return '🎒';
}
```

### Render integration

- Animal name pills in `animalDraw` and the reel: prepend `${WW_ANIMAL_EMOJI[name] || '🐾'} `.
- Gear pills in `gearGrab`: prepend `${_wwGearEmoji(gearName)} `.
- Honor-podium animal stat line: already uses animal emoji (no change).

## Item 3 — Tier backdrop intensity boost

Two CSS changes:

1. **Global opacity bump:** `.ww-tier-bg::before { opacity: 0.35; }` (was 0.2, but effectively ~0.15 because the layered gradients already used low alpha).
2. **Extreme-tier visual replacement:** the current `repeating-conic-gradient` crackle doesn't register as "danger." Replace with a clearer red-scanline treatment that reads as "broken transmission / warning":

```css
.ww-tier-bg--extreme::before {
  background:
    repeating-linear-gradient(0deg,
      rgba(204,51,51,0.22) 0px, rgba(204,51,51,0.22) 1px,
      transparent 1px, transparent 4px),
    radial-gradient(ellipse at 50% 50%, rgba(160,20,20,0.15) 0%, transparent 70%),
    linear-gradient(135deg, rgba(40,10,15,0.3), rgba(20,5,10,0.4));
  animation: ww-tv-flicker 0.9s steps(4, end) infinite;
}
@keyframes ww-tv-flicker {
  0%   { opacity:0.35; }
  20%  { opacity:0.8; }
  40%  { opacity:0.3; }
  60%  { opacity:0.65; }
  80%  { opacity:0.4; }
  100% { opacity:0.35; }
}
```

Delete or replace `@keyframes ww-electric-crackle`.

3. **Hard-tier saturation:** bump `rgba(204,51,51,0.12)` → `rgba(204,51,51,0.22)` on the repeating-linear-gradient.

## Item 4 — Per-round tannoy badge variation

Replace the constant `"📢 RANGER STATION"` badge text on the round tannoy with a per-round lookup:

```js
const WW_TANNOY_BADGE = [
  '📢 HUNT IN PROGRESS',    // Round 0 (first tannoy before round 1 events)
  '📢 HOUR TWO',             // Round 1 transition
  '📢 DUSK APPROACHES',      // Round 2 transition
  '📢 LAST LIGHT',           // Round 3+ transition
];
function _wwTannoyBadge(round) {
  return WW_TANNOY_BADGE[Math.min(round, WW_TANNOY_BADGE.length - 1)];
}
```

Where the current tannoy push happens in `rpBuildWawanakwaGoneWild`, replace the hardcoded badge with a call to `_wwTannoyBadge(evt.round)`.

## Item 5 — Approach-abort fallback text pool expansion

Inside `_runHuntEncounter` (in Hunt Encounters code), the approach-abort fallback uses the animal's `approach` array OR falls back to a single line. The fallback is hit for the 8 newer animals that don't have approach pools yet (Squirrel, Seagull, Skunk, Porcupine, Wild Turkey, Owl, Wolf, Alligator), producing repeated `"${name} loses the trail."` text.

Replace the single-line fallback with a pool:

```js
const WW_APPROACH_ABORT_FALLBACK = [
  (n, animalName) => `${n} follows the trail for ten minutes, then realizes it's the wrong set of prints.`,
  (n, animalName) => `${n} spots the ${animalName.toLowerCase()}, takes one step forward, and loses it in the undergrowth.`,
  (n, animalName) => `${n} hears the ${animalName.toLowerCase()} but can't find it. Could be anywhere.`,
  (n, animalName) => `${n} circles the same stand of pines three times. The ${animalName.toLowerCase()} is long gone.`,
  (n, animalName) => `${n} doubles back after a crash in the brush. False alarm. Trail cold.`,
  (n, animalName) => `${n} loses the trail at a stream crossing. The ${animalName.toLowerCase()} had better footing.`,
  (n, animalName) => `${n} approaches what turns out to be a hollow log. The ${animalName.toLowerCase()} watched from somewhere else.`,
];
```

In `_runHuntEncounter`, change:

```js
timeline.push(_buildHuntBeat(name, round, animal, 'approach', 'abort',
  _rp(animal.approach || [() => `${name} loses the trail.`])(name, pr)));
```

To:

```js
const abortText = animal.approach?.length
  ? _rp(animal.approach)(name, pr)  // (these are actually approach-PASS flavor; use only if approach defined)
  : _rp(WW_APPROACH_ABORT_FALLBACK)(name, animal.name);
timeline.push(_buildHuntBeat(name, round, animal, 'approach', 'abort', abortText));
```

Note: animals that DO have approach pools (the original 11) have pass-flavor text in those pools, which doesn't fit abort outcome perfectly. A future Hunt Encounters gap-fill can add proper `approachAbort: []` pools per animal. For this pass, the fallback is the only thing we change, and it fires for the 8 under-specified animals (the current pain point).

## Data-flow changes

- `huntState._hunterLocations` — new transient field populated at simulation start (inside `rpBuildWawanakwaGoneWild`, not in `simulateWawanakwaGoneWild`, since this is VP-side metadata). Keyed by hunter name → location string.
- `huntState._clockMinutes` — internal counter during the annotation pass. Not persisted.
- Each timeline event gets `_time` and `_location` string fields during annotation. These are VP-side annotations, not part of the spec'd event shape — safe to attach since the timeline is rebuilt per VP render anyway... actually wait, the timeline IS persisted in `ep.wawanakwaGoneWild.timeline`. Attaching `_time` to events means they're serialized with the ep state.

**Resolution:** don't mutate events. Build a parallel `_annotations[i] = { time, location }` array inside `rpBuildWawanakwaGoneWild`, indexed by timeline position, and pass it to `_renderWWStep` as a third argument:

```js
function _renderWWStep(evt, ww, ALL_ANIMAL_NAMES, annotation = null) { ... }
```

`annotation` is `{ time, location }` or null. Renderer reads it inline to prepend the timestamp + location on the card label.

The annotation-building pass runs once per `rpBuildWawanakwaGoneWild` call, before the step-push loop.

## Testing

Manual browser verification using `simulator.html`:

1. Trigger a wawanakwa-gone-wild episode.
2. Every card label should show `HH:MM · LOCATION · ...` prefix.
3. Same hunter's hunt cards should share the same location across rounds (Bowie stays at CAMP PERIMETER if he's hunting easy, etc.).
4. Animal pills (in reel + draw card) show emoji glyphs (🦉 Owl, etc.).
5. Gear pills show emoji (💉 tranq, 🪚 chainsaw).
6. Tier backdrops register more strongly — extreme tier has visible red scanlines flickering.
7. Round 1 tannoy says "HUNT IN PROGRESS"; Round 2 says "HOUR TWO"; Round 3 says "DUSK APPROACHES"; final round says "LAST LIGHT".
8. Approach-abort cards for the 8 missing-pool animals read a variety of lines (not all "loses the trail").
9. Console clean.

## Non-goals

- No changes to simulation logic or gameplay. All edits are VP-side.
- No new event types, no new reveal-engine hooks, no new CSS animations (one new `ww-tv-flicker` keyframe replaces the old `ww-electric-crackle`).
- No changes to the 8 missing-animal approach pools (that's a Hunt Encounters gap — out of scope for identity pass).
- No camera-chrome frame around cards (identified as "medium impact" in the audit; save for a follow-up).
- No static/noise overlay on the page.
- No sound.

## Risks and mitigations

- **Timestamp drift.** If the random-minute advance pushes past 22:59, wrap to 00:00. Unlikely to matter (100 events × 7 min average = ~11 hours simulated).
- **Animal emoji coverage.** 19 animals, all mapped. Missing animals get `🐾` fallback.
- **Gear emoji keyword-match false negatives.** If a new gear name doesn't match any keyword, fallback is `🎒`. Acceptable.
- **Extreme-tier flicker nauseating.** Capped at 0.9s loop with 4 keyframe steps. Reduced-motion block covers it (add `.ww-tier-bg--extreme::before` to the existing list).
- **Same hunter location across rounds is semantically right for Spec 1 but limits variety.** Spec 2 (Challenge Flow) will introduce zone transitions; this pass keeps hunters in one zone for now.
