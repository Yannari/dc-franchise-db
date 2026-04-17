# Wawanakwa Gone Wild — Identity Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-card timestamp + location stamps, emoji glyphs in gear/animal pills, boosted tier backdrops, varied per-round tannoy badges, and a richer approach-abort fallback text pool. Every change reinforces the ranger-field-cam identity at the card level.

**Architecture:** All edits in `js/chal/wawanakwa-gone-wild.js`. Adds module-scope constants (location pool, emoji maps, tannoy badges, abort fallbacks), one annotation pass inside `rpBuildWawanakwaGoneWild`, extends `_renderWWStep` signature with a `annotation` argument, adds a helper `_wwGearEmoji`, tweaks three CSS classes in `WW_STYLES`. No new event types, no simulation-side changes.

**Tech Stack:** Vanilla ES modules, no build step. Verification is manual browser (`simulator.html`) plus `node --check`.

**Design spec:** `docs/superpowers/specs/2026-04-16-wawanakwa-gone-wild-identity-pass-design.md`

---

## Setup

Before starting, confirm you can:
1. Load `simulator.html` in a browser and trigger a wawanakwa-gone-wild episode (Playwright or manual).
2. Run `node --check js/chal/wawanakwa-gone-wild.js` and see exit 0.

Reference regions in `js/chal/wawanakwa-gone-wild.js` (post-wow-pass, post-Hunt-Encounters):
- `RANGER_FACTS` constant (line ~864)
- `WW_STYLES` (starts ~line 976)
- `_runHuntEncounter` (starts ~line 1421)
- `_renderWWStep` (starts ~line 2460 — the actual line has shifted since the initial spec; use Grep to locate)
- `rpBuildWawanakwaGoneWild` (starts ~line 2280 — same)
- Round tannoy push inside `rpBuildWawanakwaGoneWild` (uses the string `"📢 RANGER STATION"` — grep for it)

**Commit convention:** `feat(ww): <description>` for features, `fix(ww): <description>` for bug fixes.

---

## Task 1: Add module-scope constants (emoji maps, locations, tannoy badges, fallback text)

**Files:**
- Modify: `js/chal/wawanakwa-gone-wild.js` — insert constants near `RANGER_FACTS`.

- [ ] **Step 1: Locate `RANGER_FACTS`**

Use Grep to find the `const RANGER_FACTS = [` line. Insert the new constants IMMEDIATELY AFTER the closing `];` of `RANGER_FACTS`.

- [ ] **Step 2: Insert new constants block**

```js
// ── Animal emoji glyphs (identity pass) ──
const WW_ANIMAL_EMOJI = {
  Chipmunk: '🐿️', Frog: '🐸', Rabbit: '🐇', Squirrel: '🐿️', Seagull: '🐦',
  Duck: '🦆', Raccoon: '🦝', Goose: '🦢', Skunk: '🦨', Porcupine: '🦔',
  Beaver: '🦫', Deer: '🦌', Snake: '🐍', 'Wild Turkey': '🦃', Owl: '🦉',
  Bear: '🐻', Moose: '🫎', Wolf: '🐺', Alligator: '🐊',
};

// ── Gear emoji (keyword match, identity pass) ──
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

// ── Location pool by animal tier (identity pass) ──
const WW_TIER_LOCATIONS = {
  easy:    ['CAMP PERIMETER', 'WEST CLEARING', 'STREAM BANK'],
  medium:  ['NORTH TRAIL', 'DENSE WOODS', 'LAKE SHORE'],
  hard:    ['CANOPY RIDGE', 'SOUTH SWAMP', 'DEEP BRUSH'],
  extreme: ['BEAR COUNTRY', 'CLIFF BASE', 'LOST VALLEY'],
};

// ── Per-round tannoy badges (identity pass) ──
const WW_TANNOY_BADGE = [
  '📢 HUNT IN PROGRESS',
  '📢 HOUR TWO',
  '📢 DUSK APPROACHES',
  '📢 LAST LIGHT',
];
function _wwTannoyBadge(round) {
  return WW_TANNOY_BADGE[Math.min(Math.max(0, round), WW_TANNOY_BADGE.length - 1)];
}

// ── Approach-abort fallback text pool (identity pass) ──
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

- [ ] **Step 3: Validate + commit**

```bash
node --check js/chal/wawanakwa-gone-wild.js
git add js/chal/wawanakwa-gone-wild.js
git commit -m "feat(ww): add identity-pass constants (emoji maps, locations, tannoy badges, abort pool)"
```

---

## Task 2: CSS touch-ups (tier backdrop intensity + extreme scanline + timestamp styles)

**Files:**
- Modify: `js/chal/wawanakwa-gone-wild.js` — `WW_STYLES` block.

- [ ] **Step 1: Add timestamp/location label styles**

Locate the existing `.ww-card-label` rule in `WW_STYLES`. Immediately AFTER it, add these new styles:

```css
  /* Identity pass: timestamp + location inline with card label */
  .ww-timestamp { font-family:'Courier New',monospace; font-size:9px; font-weight:700;
    color:#c33; letter-spacing:1px; margin-right:4px; }
  .ww-location { font-family:'Courier New',monospace; font-size:9px; font-weight:700;
    color:#8b7750; letter-spacing:1.5px; margin-right:4px; }
  .ww-label-divider { color:rgba(139,119,80,0.3); margin:0 3px; }
  .ww-label-kind { font-family:'Courier New',monospace; font-size:9px; font-weight:700;
    letter-spacing:1px; color:var(--ww-accent, #8b7750); }
```

- [ ] **Step 2: Boost tier backdrop opacity**

Find `.ww-tier-bg::before` in `WW_STYLES`. Change `opacity:0.2;` → `opacity:0.35;`.

- [ ] **Step 3: Bump hard-tier saturation**

Find `.ww-tier-bg--hard::before`. The current `rgba(204,51,51,0.12)` values (two of them in the repeating-linear-gradient) should both become `rgba(204,51,51,0.22)`.

- [ ] **Step 4: Replace extreme-tier crackle with scanline flicker**

Find `.ww-tier-bg--extreme::before` and the accompanying `@keyframes ww-electric-crackle`. Replace BOTH with:

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

- [ ] **Step 5: Extend `prefers-reduced-motion` block**

Find the `@media (prefers-reduced-motion: reduce)` block. Add `.ww-tier-bg--extreme::before` to the selector list if not already present (it should be already, but verify). If `ww-electric-crackle` is listed, replace with `ww-tv-flicker`.

- [ ] **Step 6: Validate + commit**

```bash
node --check js/chal/wawanakwa-gone-wild.js
git add js/chal/wawanakwa-gone-wild.js
git commit -m "feat(ww): boost tier backdrops + extreme-tier scanline flicker + timestamp/location styles"
```

---

## Task 3: Annotation pass + renderer signature extension

**Files:**
- Modify: `js/chal/wawanakwa-gone-wild.js` — `rpBuildWawanakwaGoneWild` (add annotation pre-pass) + `_renderWWStep` (accept annotation parameter).

- [ ] **Step 1: Extend `_renderWWStep` signature**

Locate the function declaration — it currently reads:

```js
function _renderWWStep(evt, ww, ALL_ANIMAL_NAMES) {
```

Change to:

```js
function _renderWWStep(evt, ww, ALL_ANIMAL_NAMES, annotation = null) {
```

- [ ] **Step 2: Inject timestamp/location into EVERY existing card-label**

For each existing branch inside `_renderWWStep` that emits a `<div class="ww-card-label">...</div>`, wrap the existing label content in a helper that prefixes the timestamp + location when `annotation` is present.

Add this helper at the top of `_renderWWStep` (right after the color constants):

```js
  // Identity pass: render the standardized label prefix
  function _wwLabel(annotation, kindHtml) {
    if (!annotation) return kindHtml;
    return `<span class="ww-timestamp">${annotation.time}</span>` +
           `<span class="ww-location">${annotation.location}</span>` +
           `<span class="ww-label-divider">·</span>` +
           `<span class="ww-label-kind">${kindHtml}</span>`;
  }
```

Then, for every existing branch that writes a card label, change:

```js
h += `<div class="ww-card-label">🎲 ANIMAL DRAW</div>`;
```

To:

```js
h += `<div class="ww-card-label">${_wwLabel(annotation, '🎲 ANIMAL DRAW')}</div>`;
```

Apply this pattern to every `<div class="ww-card-label">...</div>` in `_renderWWStep`. Quick grep to list them:

```bash
grep -n '"ww-card-label"' js/chal/wawanakwa-gone-wild.js
```

Expect 10-15 hits, one per branch (animalDraw, gearGrab, chrisQuip, huntAttempt success, huntAttempt fail, huntMishap, huntFail, tranqChaos, huntBeat, animalReaction, honorPodium tannoy, others). Apply the `_wwLabel(annotation, ...)` wrap to each.

- [ ] **Step 3: Build the annotation pass inside `rpBuildWawanakwaGoneWild`**

Locate the `for (const evt of ww.timeline)` loop that builds the `steps` array (inside `rpBuildWawanakwaGoneWild`). IMMEDIATELY BEFORE that loop, insert the annotation pre-pass:

```js
  // Identity pass: annotate each timeline event with a clock time + location
  const annotations = [];
  const hunterLocations = {};
  // Assign a persistent location per hunter based on their animal tier
  Object.entries(ww.huntResults || {}).forEach(([name, r]) => {
    const pool = WW_TIER_LOCATIONS[r?.animalTier] || WW_TIER_LOCATIONS.medium;
    hunterLocations[name] = pool[Math.floor(Math.random() * pool.length)];
  });
  let clockMin = 7 * 60; // 07:00
  const fmtTime = (mins) => {
    const m = ((mins % (24 * 60)) + (24 * 60)) % (24 * 60);
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  };
  const locationFor = (evt) => {
    if (evt.type === 'animalDraw') return 'DOCK';
    if (evt.type === 'gearGrab') return 'BOATHOUSE';
    if (evt.type === 'chrisQuip') return 'RANGER STATION';
    if (evt.type === 'feastReveal') return 'CAMP MESS';
    if (evt.type === 'punishmentReveal') return 'LATRINE';
    if (evt.type === 'honorPodium') return 'CAMP MESS';
    if (evt.type === 'tranqChaos') return 'INCIDENT ZONE';
    // Hunt-related: lookup by hunter's assigned location
    if (evt.player && hunterLocations[evt.player]) return hunterLocations[evt.player];
    return 'WAWANAKWA ISLAND';
  };
  const advancesClock = (evt) => {
    return !(evt.type === 'stateChange' || evt.type === 'animalReaction' || evt.type === 'chrisQuip');
  };
  for (let i = 0; i < ww.timeline.length; i++) {
    const evt = ww.timeline[i];
    if (advancesClock(evt)) clockMin += 3 + Math.floor(Math.random() * 10);
    // animalReaction and stateChange inherit the preceding event's time
    const time = fmtTime(clockMin);
    const location = locationFor(evt);
    annotations.push({ time, location });
  }
```

- [ ] **Step 4: Pass annotation into every step push**

Inside the step-building loop, find the `steps.push({ html: _renderWWStep(evt, ww, ALL_ANIMAL_NAMES), ... })` call and change the renderer call to include the annotation:

```js
steps.push({ html: _renderWWStep(evt, ww, ALL_ANIMAL_NAMES, annotations[<index>]), ... });
```

The index is the position of `evt` in the timeline loop. Use a local `let idx = 0;` counter incremented after each push, OR use `ww.timeline.indexOf(evt)` (slower but clear).

Also: the round-separator push (tannoy) and the honor-podium push (appended after feastReveal) emit synthetic events not present in the timeline. For those, pass `null` for annotation (renderer falls back to no-prefix label):

```js
// round separator
steps.push({ html: `<div class="ww-tannoy">...`, ... }); // no annotation needed — tannoy has its own heading
// honor podium
steps.push({ html: _renderWWStep(podiumEvt, ww, ALL_ANIMAL_NAMES, null), ... });
```

- [ ] **Step 5: Validate + commit**

```bash
node --check js/chal/wawanakwa-gone-wild.js
git add js/chal/wawanakwa-gone-wild.js
git commit -m "feat(ww): annotate every card with timestamp + location stamp"
```

---

## Task 4: Emoji glyphs in gear and animal pills

**Files:**
- Modify: `js/chal/wawanakwa-gone-wild.js` — `_renderWWStep` branches that render pills.

- [ ] **Step 1: Animal emoji on animalDraw cards**

Inside the `animalDraw` branch of `_renderWWStep`, find where the reel strip renders animal names and where the drawn-animal pill is rendered. Modify to prepend `WW_ANIMAL_EMOJI[name] || '🐾'`:

Find a line like:

```js
reelNames.forEach(a => { h += `<div>${a}</div>`; });
```

Change to:

```js
reelNames.forEach(a => { h += `<div>${WW_ANIMAL_EMOJI[a] || '🐾'} ${a}</div>`; });
```

And find the prominent drawn-animal display (typically something like `<span style="...">${evt.animal}</span>`). Change to:

```js
<span style="...">${WW_ANIMAL_EMOJI[evt.animal] || '🐾'} ${evt.animal}</span>
```

- [ ] **Step 2: Gear emoji on gearGrab cards**

Inside the `gearGrab` branch, find the gear pill rendering. Currently it looks something like:

```js
h += `<span class="${cardClass}">${isArmed ? '💉 ' : ''}${evt.gear} <span style="...">(${evt.gearTier})</span></span>`;
```

Replace with:

```js
h += `<span class="${cardClass}">${_wwGearEmoji(evt.gear)} ${evt.gear} <span style="...">(${evt.gearTier})</span></span>`;
```

(Drop the `isArmed ? '💉 ' : ''` — the tranq-specific emoji is now handled by `_wwGearEmoji` keyword-matching.)

- [ ] **Step 3: Animal emoji on huntBeat + huntAttempt + huntMishap + huntFail label suffixes**

These branches already use `${(evt.animal || '').toUpperCase()}` inside the card label. Leave those — they're the label-kind text, not the pill. The new emoji-in-pill treatment applies to pill-style displays (reel + draw card). Hunt cards display the player+portrait without an animal pill, so no change needed here.

Actually, one useful addition: in `huntBeat` branch (and similar), the card-label currently reads `"👣 APPROACH · SQUIRREL"`. Upgrade to use the animal emoji:

```js
const animalEmoji = WW_ANIMAL_EMOJI[evt.animal] || '🐾';
const outcomeBadge = ...;
h += `<div class="ww-card-label">${_wwLabel(annotation, `${cfg.emoji} ${cfg.label}${outcomeBadge} · ${animalEmoji} ${(evt.animal || '').toUpperCase()}`)}</div>`;
```

Apply the same `${WW_ANIMAL_EMOJI[evt.animal] || '🐾'}` prefix to the animal name in the label kind for: `huntBeat`, `huntAttempt` (both success and fail), `huntMishap`, `huntFail`, `animalReaction`.

- [ ] **Step 4: Validate + commit**

```bash
node --check js/chal/wawanakwa-gone-wild.js
git add js/chal/wawanakwa-gone-wild.js
git commit -m "feat(ww): emoji glyphs in gear + animal pills"
```

---

## Task 5: Per-round tannoy badge variation

**Files:**
- Modify: `js/chal/wawanakwa-gone-wild.js` — round-separator push inside `rpBuildWawanakwaGoneWild`.

- [ ] **Step 1: Find the tannoy push**

Grep for `📢 RANGER STATION` (or whatever the current badge string is):

```bash
grep -n "📢 " js/chal/wawanakwa-gone-wild.js
```

You'll find the tannoy HTML inside `rpBuildWawanakwaGoneWild`. It currently looks something like:

```js
const tannoyHtml = `
  <div class="ww-tannoy">
    <div class="ww-tannoy-badge">📢 RANGER STATION</div>
    <div class="ww-tannoy-title">${roundLabel}</div>
    <div class="ww-tannoy-census">...</div>
  </div>`;
```

- [ ] **Step 2: Replace the hardcoded badge with the helper**

Change the badge line to use `_wwTannoyBadge(evt.round)`:

```js
const tannoyHtml = `
  <div class="ww-tannoy">
    <div class="ww-tannoy-badge">${_wwTannoyBadge(evt.round)}</div>
    <div class="ww-tannoy-title">${roundLabel}</div>
    <div class="ww-tannoy-census">...</div>
  </div>`;
```

- [ ] **Step 3: Validate + commit**

```bash
node --check js/chal/wawanakwa-gone-wild.js
git add js/chal/wawanakwa-gone-wild.js
git commit -m "feat(ww): vary tannoy badge per round (hunt in progress → last light)"
```

---

## Task 6: Approach-abort fallback text pool expansion

**Files:**
- Modify: `js/chal/wawanakwa-gone-wild.js` — `_runHuntEncounter`.

- [ ] **Step 1: Find the current fallback**

Inside `_runHuntEncounter`, locate the line:

```js
timeline.push(_buildHuntBeat(name, round, animal, 'approach', 'abort',
  _rp(animal.approach || [() => `${name} loses the trail.`])(name, pr)));
```

- [ ] **Step 2: Replace with richer fallback logic**

Change to:

```js
const abortText = animal.approach?.length
  ? _rp(animal.approach)(name, pr)
  : _rp(WW_APPROACH_ABORT_FALLBACK)(name, animal.name);
timeline.push(_buildHuntBeat(name, round, animal, 'approach', 'abort', abortText));
```

(If the `_rp` call for an animal-with-approach-pool reads approach-PASS flavor text for an abort outcome — yes, acknowledged; that's a Hunt Encounters polish gap. This pass keeps the `animal.approach` path for the 11 animals that have pools and only changes the fallback for the 8 without.)

- [ ] **Step 3: Validate + commit**

```bash
node --check js/chal/wawanakwa-gone-wild.js
git add js/chal/wawanakwa-gone-wild.js
git commit -m "feat(ww): richer approach-abort fallback text pool"
```

---

## Task 7: Manual browser verification

**Files:** none (verification only).

- [ ] **Step 1: Load simulator + trigger wawanakwa-gone-wild**

Open `simulator.html` in a browser (via a local HTTP server — `python -m http.server 8765` from the repo root). Trigger a wawanakwa-gone-wild episode via the debug path or a real post-merge run.

- [ ] **Step 2: Verify each item**

1. **Timestamps + locations.** Scroll through the reveal. Every card label should read `"HH:MM · LOCATION · ..."`. Locations should cycle sensibly (DOCK for draws, BOATHOUSE for gear, hunter's persistent location for their hunt cards).
2. **Hunter location persistence.** If Bowie hunts Squirrel, all Bowie's hunt cards should share the same location (e.g. `STREAM BANK`) across rounds.
3. **Animal emoji pills.** Animal-draw reel scrolls emoji+name (`🦉 Owl`, `🐻 Bear`). Drawn-animal pill shows emoji.
4. **Gear emoji pills.** Tranq gun shows `💉`, chainsaw `🪚`, rope with hook `🎣`, etc.
5. **Tier backdrops.** Scroll to an extreme-tier hunt card. Red scanlines should be visible, flickering at a clear rhythm (not subtle). Hard-tier cards show stronger diagonal red stripes.
6. **Tannoy badges.** First round separator reads `📢 HUNT IN PROGRESS`. Second reads `📢 HOUR TWO`. Third reads `📢 DUSK APPROACHES`. Fourth (if present) reads `📢 LAST LIGHT`.
7. **Approach-abort variety.** Find cards for the 8 under-specified animals (Squirrel, Seagull, Skunk, Porcupine, Wild Turkey, Owl, Wolf, Alligator) that show APPROACH · ABORT. Across multiple reveals, the text should VARY across the 7 fallback lines instead of always reading "loses the trail."
8. **Console clean.** No errors during reveal.

- [ ] **Step 3: Fix any bugs surfaced**

Commit fixes with `fix(ww): <description>`.

- [ ] **Step 4: Update project memory**

Append a line to the Wawanakwa memory file (create `project_wawanakwa_identity_pass.md` if needed):

```markdown
---
name: Wawanakwa Gone Wild — Identity pass
description: VP identity reinforcement — timestamps, locations, emoji pills, tannoy variation, richer abort pool
type: project
---

Shipped 2026-04-16. Builds on top of wow-pass.

**What it does:** Every VP card now shows `HH:MM · LOCATION` stamps. Animals have emoji glyphs (🦉 Owl, 🐻 Bear). Gear has emoji (💉 tranq, 🪚 chainsaw). Tier backdrops boosted (extreme tier = red scanline flicker). Tannoy badge varies per round. Approach-abort fallback rotates through 7 variations.

**Why:** Pre-identity-pass, the middle 80% of the VP read as uniform portrait-left/text-right cards. Audit via Playwright showed the theme was declarative at the top but never carried into each card.

**Spec:** `docs/superpowers/specs/2026-04-16-wawanakwa-gone-wild-identity-pass-design.md`
**Plan:** `docs/superpowers/plans/2026-04-16-wawanakwa-gone-wild-identity-pass.md`

**Not done (future):** camera-chrome frame on cards, static/noise overlay, per-card tally LED, sound. Also: the 8 under-specified animals still need proper `approach`/`engagementSuccess`/`engagementFail`/`behaviors` pools (Hunt Encounters gap).
```

Update the `MEMORY.md` index to reference it.

---

## Files touched at completion

- `js/chal/wawanakwa-gone-wild.js` — new module-scope constants (WW_ANIMAL_EMOJI, WW_TIER_LOCATIONS, WW_TANNOY_BADGE, WW_APPROACH_ABORT_FALLBACK), one new helper (`_wwGearEmoji`, `_wwTannoyBadge`, `_wwLabel` inside `_renderWWStep`), annotation pre-pass inside `rpBuildWawanakwaGoneWild`, extended `_renderWWStep` signature + label-prefix injection in every branch, 4 CSS class updates in `WW_STYLES` (tier backdrop opacity + hard saturation + extreme scanline flicker + timestamp/location styles), one `@keyframes` replacement (`ww-electric-crackle` → `ww-tv-flicker`), one-line fallback expansion in `_runHuntEncounter`.

## Files NOT touched

- No other `js/chal/*.js` files.
- No changes to `js/core.js`, `js/episode.js`, `js/twists.js`, `js/vp-screens.js`, `js/text-backlog.js`, `js/savestate.js`, `js/main.js`, `js/players.js`, `js/bonds.js`, `js/romance.js`.
- No changes to simulation logic.
- No changes to save-state, episode history patching, text backlog.
- No changes to the 8 under-specified animals' approach/engagement/behavior pools (that's a Hunt Encounters gap — out of scope).
