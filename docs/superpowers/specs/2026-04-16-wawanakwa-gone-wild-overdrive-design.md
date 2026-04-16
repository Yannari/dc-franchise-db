# Wawanakwa Gone Wild! — Full Overdrive Design

Date: 2026-04-16
Scope: VP polish pass only. No gameplay changes, no schema changes, no new events.
Target file: `js/chal/wawanakwa-gone-wild.js` (all edits).

## Goal

Bring the `rpBuildWawanakwaGoneWild` VP up to the visual ambition of Say Uncle / Brunch / Off the Chain / Hide and Be Sneaky. The challenge's beats (animal draw lottery, gear scramble, tranq gun chaos, alliance offers, capture races, feast ceremony, bathroom punishment) are cinematic but currently render as flat cards with inline styles — no CSS keyframes, no dedicated reveal engine, no status tracker, no animated transitions. The VP needs a complete visual overhaul.

## What already exists (don't rebuild)

- Dark forest palette: `#1a2416` / `#0f1a0b` gradient bg, `#d4a017` gold, `#3fb950` green, `#f85149` red, `#6e7681` grey.
- Player status board grid (per-player animal + gear + capture status).
- Click-to-reveal timeline engine using `_tvState` with `idx: -1` pattern.
- `_renderWWCard` helper for timeline event cards.
- Timeline event types: `animalDraw`, `gearGrab`, `chrisQuip`, `huntAttempt`, `huntMishap`, `huntFail`, `huntEvent`, `tranqChaos`, `feastReveal`, `punishmentReveal`.
- End results block (immunity winner + punishment target) after full reveal.
- Available data on `ep.wawanakwaGoneWild`: `timeline[]`, `animalAssignments`, `gearAssignments`, `finishOrder`, `immunityWinner`, `punishmentTarget`, `huntResults` (per-player: animal, gear, captured, captureRound, attemptsMade, personalScore, helpedBy, sabotagedBy, tranqDarted, mishapCount), `badges`.

## Shared infrastructure additions

### New constant: `WW_STYLES`

Inject a `<style>` tag at the top of the VP HTML (same pattern as `MX_STYLES` in off-the-chain, `NV_STYLES` in hide-and-be-sneaky). All CSS lives in a single template literal.

### New keyframes (defined in `WW_STYLES`)

- `ww-scan-in` — fade-in + translateY(-8px → 0) for step reveal (0.35s ease-out).
- `ww-shake` — small translateX jitter for mishap/tranq events (0.4s).
- `ww-pulse-gold` — box-shadow glow pulse in gold for immunity/feast reveals (0.6s, 2 cycles).
- `ww-pulse-red` — box-shadow glow pulse in red for punishment/fail reveals (0.6s, 2 cycles).
- `ww-slot-spin` — vertical translateY scroll for animal draw lottery reel (1.4s cubic-bezier ease-out, reads `--reel-start` / `--reel-final` CSS vars).
- `ww-stamp-slam` — scale(3.5) → scale(0.9) → scale(1) with rotate(-6deg) for badge stamps (0.5s ease-out).
- `ww-paw-track` — repeating opacity pulse for paw-print background (3s infinite, subtle).
- `ww-crosshair-spin` — 360° rotate for crosshair icon during hunt phases (8s linear infinite).
- `ww-trophy-bounce` — translateY bounce + gold glow for winner reveal (0.8s).
- `ww-curtain-left` / `ww-curtain-right` — leaf-curtain split open for feast reveal (1s ease-in-out).
- `ww-count-flash` — brief scale(1.3) + glow for counter updates (0.4s).
- `ww-gear-tumble` — rotate(0 → 360deg) + translateY for gear items popping out of crate (0.7s).
- `ww-dart-fly` — translateX(-100px → 0) + rotate for tranq dart animation (0.3s).
- `ww-fill-bar` — width 0% → var(--target-width) for capture progress bars (0.8s ease-out).

### New classes (defined in `WW_STYLES`)

- `.ww-page` — root container with forest gradient bg, paw-print overlay (`ww-paw-track` on `::before`), min-height.
- `.ww-header` — centered title bar with leaf border pattern (repeating-linear-gradient of dark green triangles at top/bottom edges).
- `.ww-card` — standard event card: rounded corners, border-left accent, semi-transparent bg, `ww-scan-in` animation on mount.
- `.ww-card--mishap` — adds `ww-shake` animation for 0.4s.
- `.ww-card--tranq` — red pulsing border + dart icon overlay via `::before`.
- `.ww-card--feast` — gold border, `ww-pulse-gold` on reveal.
- `.ww-card--punish` — red border, `ww-pulse-red` on reveal.
- `.ww-status-tracker` — sticky header bar with counters: `HUNTING: N | CAPTURED: N | FAILED: N`.
- `.ww-count` — counter number with `ww-count-flash` class toggle on change.
- `.ww-reel` / `.ww-reel-window` / `.ww-reel-strip` — slot-machine reel for animal draw (same architecture as off-the-chain's `mx-reel` but with green/brown palette).
- `.ww-stamp` — impact-font rotated stamp badge (`ww-stamp-slam`).
- `.ww-tier-badge` — small rounded pill showing animal tier with tier-specific color.
- `.ww-gear-card` — gear item display with tumble-in animation.
- `.ww-progress-bar` / `.ww-progress-fill` — capture progress bar per player showing attempts-to-capture ratio.
- `.ww-crosshair` — rotating crosshair SVG overlay for hunt phase sections.
- `.ww-trophy-wrap` — winner reveal container with `ww-trophy-bounce`.
- `.ww-curtain-wrap` — leaf-curtain split reveal for feast ceremony (mirroring off-the-chain's checkered-flag curtain but with green leaves).
- `.ww-spotlight` — radial gold gradient behind winner portrait.
- `.ww-player-tile` — status board tile with hover lift, tier-colored left border.
- `.ww-section-marker` — phase separator with crosshair icon + label.
- `.ww-btn-reveal` — styled reveal button with pulsing green border.
- `.ww-btn-reveal-all` — small "reveal all" link.
- `.ww-dart` — animated tranq dart element (`ww-dart-fly`).

### Reveal engine: `_wwReveal` / `_wwRevealAll`

New functions matching the `_mxReveal` / `_mxRevealAll` pattern from off-the-chain:

**`_wwReveal(stateKey, totalSteps)`:**
1. Increment `_tvState[stateKey].idx`.
2. Show the next `#ww-step-{stateKey}-{idx}` div (remove `display:none`, add `.ww-scan-in`).
3. Scroll into view smoothly.
4. Read `data-hunting-delta`, `data-captured-delta`, `data-failed-delta` from the step and update the sticky counter spans. Flash the changed counter with `.ww-count-flash` (remove → force reflow → re-add, 400ms timeout to remove).
5. Read `data-camera-shake` — if `"1"`, add `.ww-card--mishap` to `.ww-page` for 400ms.
6. Update button text: `▶ NEXT EVENT (N/M)`.
7. If last step: hide the controls div.

**`_wwRevealAll(stateKey, totalSteps)`:**
1. Show all hidden steps, set `_tvState[stateKey].idx = totalSteps - 1`.
2. Snap all counters to final values (read from `data-final-hunting`, `data-final-captured`, `data-final-failed` on the controls div).
3. Hide controls.

Both functions exposed on `window` from within `rpBuildWawanakwaGoneWild` via inline `<script>` in the VP HTML (same pattern as off-the-chain).

## Per-section design

### 1. Header & chrome

Replace the inline-styled title with structured `.ww-header`:

```
🏕️ WAWANAKWA GONE WILD!
[leaf border strip]
Catch your animal. First back wins a feast. Last back cleans the bathrooms.
[rotating crosshair decoration — subtle, right-aligned]
```

Below the header: `.ww-status-tracker` sticky bar:

```
🎯 HUNTING: 7  |  ✅ CAPTURED: 0  |  ❌ FAILED: 0
```

Counts update on each reveal click via `_wwReveal` reading `data-*-delta` attributes.

### 2. Player status board (redesign)

Replace the flat grid with `.ww-player-tile` cards:

Each tile:
- Left border colored by tier (green/easy, orange/medium, red/hard, purple/extreme).
- Player name (bold, white).
- Animal name + tier emoji + `.ww-tier-badge` pill.
- Gear name + gear tier indicator.
- Capture progress bar: fills to `attemptsMade / maxRoundsPossible` width, colored by outcome (green if captured, red if failed, grey if in-progress). Progress bars animate via `ww-fill-bar` on page load.
- Status icon: `⏳` hunting / `✅` captured (round N) / `❌` failed.

The board is static (not click-to-reveal) — it spoils outcomes. Wrap it in a collapsible `<details>` element labeled "📋 Hunt Scoreboard (spoilers)" so players can choose to peek.

### 3. Animal draw phase (slot-machine lottery)

Each `animalDraw` timeline event becomes a reel card:

```
[portrait]  [ reel-window cycling all 11 animal names ]  [tier badge]
```

The `.ww-reel-strip` contains all animal names stacked vertically (×4 repetitions for spin length). `ww-slot-spin` animates `translateY` from `--reel-start` to `--reel-final` (landing on the drawn animal). Duration: 1.4s with cubic-bezier ease-out.

After the reel settles: a `.ww-stamp` slams across showing the tier difficulty:

| Tier | Stamp | Color |
|---|---|---|
| easy | EASY PICKINGS | green |
| medium | FAIR GAME | orange |
| hard | GOOD LUCK | red |
| extreme | YOU'RE DOOMED | purple |

One step per player, same step count as current timeline events.

### 4. Gear grab phase

Each `gearGrab` timeline event renders as a `.ww-gear-card`:

- Crate visual: brown-bordered box with plank-texture gradient.
- Gear item pops out with `ww-gear-tumble` animation.
- Gear name in bold, tier in muted text.
- Special gear highlight: if the player drew the **tranq gun**, render a red-bordered card with a 💉 dart icon and stamp "ARMED AND DANGEROUS".
- Chris announcement step (`chrisQuip` after all gear grabs) gets a megaphone card style with orange accent.

### 5. Hunt rounds (the main timeline)

Restructure the flat timeline into **round sections**. Group events by their `round` field. Each round gets a `.ww-section-marker`:

```
── ROUND 1 ── 🎯
```

Within each round, events render as `.ww-card` variants:

**`huntAttempt` (success):** Green-bordered card. Player name, animal, narrative text. Stamp: "CAUGHT!" in green with `ww-stamp-slam`.

**`huntAttempt` (fail):** Orange-bordered card. No stamp.

**`huntMishap`:** Red-bordered card with `.ww-card--mishap` (shake animation). Mishap icon (🦨 skunk / 🐝 bees / 🕳️ pitfall / etc.).

**`huntFail` (final round, never caught):** Dark red card, skull icon. Stamp: "FAILED" in red.

**`huntEvent`:** Subtype-specific styling:
- `help` → green card, handshake emoji
- `sabotage` / `sabotage-caught` → red card, knife emoji
- `alliance-accepted` / `alliance-rejected` / `alliance-backfire` → gold/grey/red card
- `taunt` / `rivalry` → red card
- `encourage` → green card
- `showmance` → pink card, heart emoji
- `steal-gear` → red card, theft emoji
- `discovery` → blue card
- `animal-encounter` → orange card, paw emoji

**`tranqChaos`:** `.ww-card--tranq` with animated dart (`.ww-dart` flies in from the left via `ww-dart-fly`). Red pulsing border. If target is a contestant, add `data-camera-shake="1"` for page shake on reveal.

Each hunt step stores `huntingDelta` / `capturedDelta` / `failedDelta` for the status tracker. Only capture-success steps have `capturedDelta: 1, huntingDelta: -1`. Only final-fail steps have `failedDelta: 1, huntingDelta: -1`.

### 6. Feast reveal (leaf curtain)

The `feastReveal` step triggers a leaf-curtain ceremony:

- Full-width `.ww-curtain-wrap`: two panels of green leaf pattern (repeating-conic-gradient of dark/light green) slide apart via `ww-curtain-left` / `ww-curtain-right`.
- Behind the curtain: `.ww-spotlight` radial gold gradient → winner portrait (xl size) → name in gold → "IMMUNITY + FEAST OF ALL THEIR FAVORITES" subtitle.
- `.ww-trophy-bounce` on the portrait for dramatic entrance.
- Stamp: "🏆 FEAST WINNER" in gold.
- `data-camera-shake` NOT set (this is a celebration, not a disaster).

### 7. Punishment reveal (bathroom doom)

The `punishmentReveal` step:

- `.ww-card--punish` with red pulsing border.
- Toilet icon (🚽) prominently displayed.
- Player portrait + name.
- Stamp: "BATHROOM DUTY" in red with `ww-stamp-slam`.
- Subtitle: narrative text from the timeline event.

### 8. Final results (post full-reveal)

After all steps are revealed, render a results summary section:

**Finish order table:**
- Ranked list of all players: placement (#1, #2, ...), player name, animal + tier, capture round (or "FAILED"), personal score.
- #1 gets gold row highlight, last place gets red.
- Capture progress bars next to each row.

**Alliance offer summary:** If any `alliance-accepted` or `alliance-rejected` events occurred, render a sidebar box listing them.

**Tranq gun incident report:** If any `tranqChaos` events occurred, render an incident log with dart icons connecting shooter to target.

### 9. Reveal controls

Replace the inline onclick div with proper controls:

```html
<div class="ww-controls" id="ww-controls-{stateKey}">
  <button class="ww-btn-reveal" id="ww-btn-{stateKey}" onclick="_wwReveal(...)">
    ▶ NEXT EVENT (1/{total})
  </button>
  <a class="ww-btn-reveal-all" onclick="_wwRevealAll(...)">reveal all</a>
</div>
```

Button pulses with green glow via `.ww-btn-reveal`. Counter updates on each click.

## Data-flow changes

Steps gain optional fields:

```
{ type, html, huntingDelta?, capturedDelta?, failedDelta?, cameraShake? }
```

Serialized to `data-hunting-delta` / `data-captured-delta` / `data-failed-delta` / `data-camera-shake` on each `#ww-step-*` div. `_wwReveal` reads them after making the step visible.

The controls div stores `data-final-hunting` / `data-final-captured` / `data-final-failed` for `_wwRevealAll` to snap counters.

No changes to `gs`, `ep`, `ww`, or any persisted state. All animations are purely presentational.

## Testing

Open `simulator.html`, configure a season with the wawanakwa-gone-wild twist available post-merge, run to merge, trigger the twist. Verify:

1. Every step reveals without console errors.
2. Animal draw reels spin and land on the correct animal name for each player.
3. Tier stamps appear with correct color/text after each reel.
4. Gear cards tumble in; tranq gun gets special "ARMED" styling.
5. Hunt rounds are visually separated by round markers with crosshair.
6. Mishap cards shake briefly on reveal.
7. Tranq chaos cards show animated dart + page shake on contestant hits.
8. Capture-success cards show "CAUGHT!" stamp.
9. Status tracker (HUNTING/CAPTURED/FAILED) updates correctly on each relevant reveal.
10. Feast reveal: leaf curtain slides open revealing the winner in a gold spotlight.
11. Punishment reveal: red pulsing card with toilet icon + "BATHROOM DUTY" stamp.
12. "Reveal all" snaps all steps visible and final counters are correct.
13. Scoreboard spoiler-hides behind a `<details>` element.
14. All animations respect `prefers-reduced-motion` media query (skip or reduce).

## Non-goals

- No sound effects.
- No new gameplay events, bond changes, heat, or popularity effects.
- No new `ww` state fields — all reads from existing structure.
- No new challenge file; all edits are within `js/chal/wawanakwa-gone-wild.js`.
- No changes to text backlog (`_textWawanakwaGoneWild`) or episode history patching.
- No new imports outside the file.
- No changes to integration files (core.js, episode.js, twists.js, etc.).

## Risks and mitigations

- **Reel spin needs enough strip height.** Mitigation: repeat the animal name list ×4 in the strip so translateY always has content to show during the scroll. Same approach proven in off-the-chain swap reel.
- **Camera shake on tranq hits may feel excessive if many tranq events fire.** Mitigation: cap to one shake per reveal click (handled by `_wwReveal`'s single-step architecture). Each shake is 400ms, small amplitude (±3px).
- **Status board spoils outcomes.** Mitigation: wrapped in collapsible `<details>` tag, closed by default.
- **WW_STYLES string grows to ~200+ lines of CSS.** Acceptable — single-file challenge pattern, no other consumer.
- **Leaf curtain requires two pseudo-elements.** Same pattern as off-the-chain's checkered-flag curtain — browser-proven.
