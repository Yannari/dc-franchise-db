# Off the Chain — Full Overdrive Design

Date: 2026-04-16
Scope: VP polish pass only. No gameplay changes, no schema changes, no new events.
Target file: `js/chal/off-the-chain.js` (all edits).

## Goal

Bring the `rpBuildOffTheChain` VP up to the visual ambition of Say Uncle / Brunch / Basic Straining. The challenge's beats (swap twist, bike destruction, finish-line drama, sabotage reveal) are the most cinematic in the pack but currently render with mid-tier theming.

## What already exists (don't rebuild)

- Motocross palette: `#1a1008` bg, `#ff6b00` orange, `#ffd700` gold, `#ff3333` danger.
- Checkered conic-gradient header band.
- Keyframes: `mx-explosion`, `mx-shake`, `mx-scan-in`, `mx-drop-in`, `mx-speed`, `mx-count-flash`, `mx-btn-pulse`.
- Sticky `RACING / WRECKED / FINISHED` status sidebar with live counters.
- Click-to-reveal engine (`_mxReveal` / `_mxRevealAll`).
- Per-bike quality bars, per-racer HP bars, hazard-tape stripes, speed-lines overlay.
- 8 section groups: grid, build, swap, qualifying, cut, obstacles, finish, aftermath, wreckage.

## Shared infrastructure additions

### New keyframes (append to `MX_STYLES`)

- `mx-reel-spin` — vertical name-reel scroll used in swap phase.
- `mx-stamp-slam` — rotating, scaling impact for SWAP / CASE CLOSED / bike-name stamps.
- `mx-weld-spark` — tiny scaling+fade spark dots for build fill.
- `mx-camera-shake` — whole-page translate on catastrophic breakdown.
- `mx-curtain-open` — clip-path sweep revealing the winner.
- `mx-hp-drain` — HP bar width transition with red-flash overlay.
- `mx-ticker-scroll` — continuous horizontal marquee for Chris-quip ticker.
- `mx-rpm-needle` — 0°→120° sweep for RPM gauge.
- `mx-debris-settle` — 4px drift-down + haze fade-in for aftermath.
- `mx-mine-pulse` — radial-dot pulse for mines backdrop.
- `mx-dotted-connect` — stroke-dashoffset anim for evidence-board lines.

### New classes

`.mx-reel`, `.mx-reel-strip`, `.mx-reel-window`, `.mx-stamp`, `.mx-ticker`, `.mx-ticker-inner`, `.mx-rpm`, `.mx-rpm-needle`, `.mx-rpm-rev`, `.mx-podium`, `.mx-podium-plinth`, `.mx-obstacle-bg--mines`, `.mx-obstacle-bg--oil`, `.mx-obstacle-bg--piranhas`, `.mx-evidence-board`, `.mx-evidence-pin`, `.mx-evidence-line`, `.mx-photo-finish`, `.mx-debris-wrap`, `.mx-field-mic`.

### Reveal-hook changes in `_mxReveal`

1. On every successful reveal click, add `.mx-rpm-rev` to the RPM needle for 800ms, then remove.
2. If the revealed step element has `data-camera-shake="1"`, add `.mx-camera-shake` to the root `.mx-page` for 400ms, then remove.
3. If the revealed step has `data-ticker-line`, push the line into the ticker marquee payload (prepend to the scrolling content).

The step object gains optional fields: `cameraShake: boolean`, `tickerLine: string`. These serialize to `data-*` attributes alongside the existing `racingDelta` / `wreckedDelta` / `finishedDelta` / `immuneDelta`.

## Per-item design

### 1. Swap reveal (slot-machine)

Replace the existing plain card. Each swap step renders a reel card:

```
[portrait]  [ reel-window showing cycling names ]  [status]
```

The `.mx-reel-strip` contains all active rider names stacked vertically; `mx-reel-spin` animates `translateY` from a random offset to the position that lands on the chosen `bikeOwner` name. Animation duration: 1.2s with cubic-bezier ease-out. After the strip settles, a `.mx-stamp` reading **SWAP!** (or **LUCKY!** / **DOOMED!** keyed off bike quality) slams across with `mx-stamp-slam`.

One step per rider assignment, same step count as today.

### 2. Obstacle gauntlet

Three additions to the obstacle section:

**Obstacle backdrop.** The per-obstacle header (`type: 'obstacle-name'`) is extended into a full-width backdrop div with one of `.mx-obstacle-bg--mines` / `--oil` / `--piranhas`:

- Mines: radial-gradient of red dots on dark background; each dot pulses via `mx-mine-pulse` (0.8s, staggered).
- Oil: repeating-linear rainbow shimmer (`conic-gradient`) sliding slowly via `mx-speed`-style transform.
- Piranhas: dark-blue vertical gradient with a row of triangle SVG teeth pinned to the bottom border.

All three are pseudo-elements (`::before` on the backdrop div) so they don't affect layout and don't require new DOM per-racer.

**HP bar drain animation.** When HP drops on a racer reveal, the bar now animates: old value → new value over 600ms, with a red flash overlay that fades in during the drain and out after.

**Camera shake on catastrophic breakdown.** The `obstacle-result` step sets `cameraShake: true` when `wasDestroyed` is true. `_mxReveal` applies `.mx-camera-shake` to `.mx-page` for 400ms.

### 3. Finish line (curtain + podium)

Replace the single `finish-winner` step with a two-step sequence:

**Step 3a — Curtain open.** A full-width `.mx-curtain` div renders checkered-flag pattern (repeating-conic-gradient). On reveal, `mx-curtain-open` animates `clip-path: inset(0 0 0 0)` → `inset(0 0 0 100%)` over 1s, revealing the winner portrait in a gold radial-gradient spotlight. Prepend a **PHOTO FINISH** label via `.mx-photo-finish` when the margin is tight (see below).

**Step 3b — Podium rise.** Three `.mx-podium-plinth` elements (tall center, medium left, short right) rise from below via `mx-drop-in` (already exists, reuse). Each plinth shows a portrait + rank medal. Remaining finishers (`#4+`) listed below in the existing card format. If only 2 racers reached the finish, render a 2-plinth podium (center + left); if only 1, skip the podium step entirely.

**PHOTO FINISH trigger.** At spec-build time read `obstacleResults[name].hpAfter` (last-obstacle HP) for finishers ranked #1 and #2. If both have values and the absolute difference is ≤ 10 HP, set `br._photoFinish = true` on the step's source data and render the label. If either value is missing (e.g., both reached the finish without entering the final obstacle), skip the label — do not fall back to any other data source.

### 4. Build phase

Each bike card grows three animated effects on reveal:

- Quality bar now fills from `0%` to target width over 900ms (set via inline `style` with a transition, triggered by adding `.mx-quality-fill--animate` on scan-in).
- 3–5 `.mx-weld-spark` divs (small yellow dots) absolutely-positioned over the bar; each animates `mx-weld-spark` with a stagger so sparks pop during the fill.
- Bike name line (`"Rusty Thunder"`) stamps in with `mx-stamp-slam` after the bar completes (300ms delay).

### 5. Qualifying lap position badge

Add a `#N` badge in the top-right of each `race1-result` card. Skip visual reorder (keeps the rendering engine simple). The badge uses existing `.mx-status` shape with gold for top-3, orange otherwise, and flashes in with `mx-count-flash`.

### 6. Elimination aftermath

Wrap all `aftermath-beat` cards in a shared `.mx-debris-wrap` parent. Apply `mx-debris-settle` for an orange-haze overlay fade-in and 4px card drift. Each beat line gets a 🎤 field-reporter mic prefix via `.mx-field-mic::before`.

### 7. Wreckage report (evidence board)

Rebuild the debrief step as `.mx-evidence-board`:

- Cork-board background: repeating radial-gradient of small tan speckles.
- Each portrait wrapped in `.mx-evidence-pin` with a small push-pin SVG icon at top.
- Compute sabotage→victim pairs from `br.phase1.buildEvents` (filter `id === 'sabotage' || id === 'parts-theft'`) and render `.mx-evidence-line` absolutely-positioned dashed lines between the saboteur's portrait and the victim's portrait (using `getBoundingClientRect` on reveal). Lines animate via `mx-dotted-connect` (stroke-dashoffset or background-position).
- End the debrief with a **CASE CLOSED** stamp via `mx-stamp-slam`.

Line drawing is deferred: on the debrief step reveal, run a `requestAnimationFrame` in `_mxReveal` that finds the board and draws lines between pinned portraits.

### 8. Global chrome

**Ticker.** Add `.mx-ticker` strip immediately below `.mx-header`. Initial content seeded from `CHRIS_BIKE_QUIPS` general pool (flatten all quip categories, shuffle, concatenate). Inner div animates `mx-ticker-scroll` (translateX from 0% to -50%, continuous 30s loop, doubles the content for seamless wrap). `_mxReveal` can push per-step `tickerLine` values into the marquee by prepending.

**RPM gauge.** Add `.mx-rpm` to the sticky status bar (right side, before the counter block). SVG semicircle 60px wide with a needle line; `.mx-rpm-rev` class applies `mx-rpm-needle` animation (0°→120° rotate with ease-out, 800ms). Removed after 800ms to reset.

## Data-flow changes

Steps gain two optional fields:

```
{ type, html, racingDelta?, wreckedDelta?, finishedDelta?, immuneDelta?,
  cameraShake?, tickerLine? }
```

Serialized to `data-camera-shake` / `data-ticker-line` on each `mx-step-*` div. `_mxReveal` reads them after adding `.mx-scan-in`.

No changes to `gs`, `ep`, `br`, or any persisted state. All animations are purely presentational.

## Testing

Open `simulator.html`, configure a season with the off-the-chain twist available post-merge, run to merge, trigger the twist. Verify:

1. Every step reveals without console errors.
2. Swap reel stops on the correct bike owner name for each rider.
3. Camera shake fires only on obstacle-result steps where the racer was destroyed.
4. Finish curtain reveals the correct winner; podium shows correct top-3 (or top-2 if only 2 finished, or top-1 if only the winner survived).
5. PHOTO FINISH label appears only when top-2 score delta is below threshold.
6. Build-phase quality bars fill visibly; weld-sparks appear during the fill.
7. Evidence-board lines correctly connect every sabotage-event saboteur→victim pair from phase 1.
8. Ticker scrolls continuously without jumping.
9. RPM needle sweeps once per reveal click and resets.
10. `Reveal all` button snaps all deltas to final totals and hides the controls (no mid-animation state left behind).
11. Works with `br.isSuddenDeath === true` (auto-elimination path).
12. Works with `br.isSuddenDeath === false` (normal tribal-heat path).

## Non-goals

- No sound effects.
- No new gameplay events, bond changes, heat, or popularity effects.
- No new `br` state — all reads from existing structure.
- No new challenge file; all edits are within `js/chal/off-the-chain.js`.
- No changes to text backlog (`_textOffTheChain`) or episode history patching.
- No new imports outside the file.

## Risks and mitigations

- **Line drawing depends on layout timing.** Mitigation: use `requestAnimationFrame` inside `_mxReveal` after the step is made visible, read `getBoundingClientRect` for both portraits, draw relative to the evidence-board container.
- **Camera shake can feel nauseating.** Mitigation: cap at 400ms, small amplitude (±3px), single firing per destruction event (already how step reveal works).
- **Ticker marquee can pile up with many pushes.** Mitigation: cap the in-memory ticker payload at 20 lines; drop oldest when new ones arrive.
- **MX_STYLES string length grows meaningfully (~350 lines of CSS added).** Acceptable — already a single-file challenge pattern, no other consumer.
