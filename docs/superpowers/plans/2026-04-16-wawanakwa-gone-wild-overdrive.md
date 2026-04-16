# Wawanakwa Gone Wild! — VP Overdrive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full VP visual overhaul for the Wawanakwa Gone Wild! challenge. No gameplay changes. All edits in a single file: `js/chal/wawanakwa-gone-wild.js`.

**Design spec:** `docs/superpowers/specs/2026-04-16-wawanakwa-gone-wild-overdrive-design.md`

**Architecture:** Replace the inline-styled VP code (lines ~975–1059) with a CSS-in-JS `WW_STYLES` constant + a structured reveal engine + per-section visual treatments. No new imports. No changes to simulation, text backlog, or integration files.

---

## Task 1: Add `WW_STYLES` CSS constant

**Files:**
- Modify: `js/chal/wawanakwa-gone-wild.js` — insert new constant before `rpBuildWawanakwaGoneWild` (before line 975)

- [ ] **Step 1: Insert the full `WW_STYLES` template literal**

Add this block directly before the `// ══════════════════════════════════════════════════════════════` comment on line 975:

```javascript
// ── VP STYLES ──
const WW_STYLES = `
  /* ── Page & Chrome ── */
  .ww-page { background:linear-gradient(180deg,#1a2416 0%,#0f1a0b 50%,#0a0f07 100%); color:#e6edf3;
    font-family:var(--font-body,'Segoe UI',sans-serif); position:relative; overflow:hidden; padding:24px 16px; min-height:400px; }
  .ww-page::before { content:''; position:absolute; top:0; left:0; right:0; bottom:0; pointer-events:none; z-index:0;
    background:
      radial-gradient(ellipse at 25% 75%, rgba(26,36,22,0.4) 0%, transparent 50%),
      radial-gradient(ellipse at 75% 25%, rgba(15,26,11,0.3) 0%, transparent 40%);
    animation: ww-paw-track 3s ease-in-out infinite alternate; }
  @keyframes ww-paw-track { 0%{opacity:0.4} 100%{opacity:0.7} }

  .ww-header { text-align:center; position:relative; z-index:2; margin-bottom:6px;
    border-top:3px solid transparent; border-bottom:3px solid transparent;
    border-image:repeating-linear-gradient(90deg, #2d4a1e 0px, #2d4a1e 12px, transparent 12px, transparent 18px) 3;
    padding:10px 0 8px; }
  .ww-title { font-family:var(--font-display,'Impact',sans-serif); font-size:22px; font-weight:800;
    letter-spacing:3px; text-transform:uppercase; color:#d4a017;
    text-shadow:0 0 12px rgba(212,160,23,0.4), 0 2px 4px rgba(0,0,0,0.6); }
  .ww-subtitle { font-size:11px; color:#6e7681; letter-spacing:0.3px; margin-top:4px; }

  /* ── Status Tracker (sticky) ── */
  .ww-tracker { position:sticky; top:0; z-index:10; display:flex; justify-content:center; gap:16px;
    background:rgba(15,26,11,0.95); backdrop-filter:blur(6px); padding:8px 12px; margin:-24px -16px 16px;
    border-bottom:1px solid rgba(212,160,23,0.15); font-family:var(--font-display,'Impact',sans-serif);
    font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; }
  .ww-tracker-item { display:flex; align-items:center; gap:4px; }
  .ww-tracker-item--hunting { color:#f0883e; }
  .ww-tracker-item--captured { color:#3fb950; }
  .ww-tracker-item--failed { color:#f85149; }
  .ww-count { display:inline-block; min-width:16px; text-align:center; }
  @keyframes ww-count-flash { 0%{color:#fff;transform:scale(1.4)} 100%{color:inherit;transform:scale(1)} }
  .ww-count-flash { animation: ww-count-flash 0.4s ease-out; }

  /* ── Cards ── */
  .ww-card { position:relative; z-index:2; padding:10px 14px; margin-bottom:6px;
    border-radius:8px; border:1px solid rgba(255,255,255,0.06); border-left:3px solid var(--ww-accent,#6e7681);
    background:rgba(0,0,0,0.3); animation: ww-scan-in 0.35s ease-out both; }
  @keyframes ww-scan-in { 0%{opacity:0;transform:translateY(-8px)} 100%{opacity:1;transform:translateY(0)} }
  .ww-card-label { font-size:9px; font-weight:700; letter-spacing:0.5px; color:var(--ww-accent,#6e7681); margin-bottom:3px; }
  .ww-card-body { font-size:12px; color:#e6edf3; line-height:1.55; }
  .ww-card-footer { font-size:9px; color:#6e7681; margin-top:3px; }

  /* Card variants */
  .ww-card--mishap { animation: ww-scan-in 0.35s ease-out both, ww-shake 0.4s 0.35s both; }
  @keyframes ww-shake { 0%,100%{transform:translateX(0)} 15%,45%,75%{transform:translateX(-3px)} 30%,60%,90%{transform:translateX(3px)} }
  .ww-card--tranq { border-color:rgba(248,81,73,0.5); background:rgba(248,81,73,0.06); }
  .ww-card--feast { border-color:rgba(212,160,23,0.5); background:rgba(212,160,23,0.06); }
  .ww-card--punish { border-color:rgba(248,81,73,0.5); background:rgba(248,81,73,0.06); }
  @keyframes ww-pulse-gold { 0%,100%{box-shadow:0 0 4px rgba(212,160,23,0.1)} 50%{box-shadow:0 0 18px rgba(212,160,23,0.4)} }
  @keyframes ww-pulse-red { 0%,100%{box-shadow:0 0 4px rgba(248,81,73,0.1)} 50%{box-shadow:0 0 18px rgba(248,81,73,0.4)} }

  /* ── Section Markers ── */
  .ww-section { font-size:11px; font-weight:800; letter-spacing:3px; color:#d4a017; text-transform:uppercase;
    margin:20px 0 10px; border-top:1px solid rgba(212,160,23,0.15); padding-top:14px; position:relative; z-index:2; }

  /* ── Slot-machine Reel (animal draw) ── */
  .ww-reel { position:relative; width:160px; height:26px; overflow:hidden; display:inline-block; vertical-align:middle;
    background:rgba(0,0,0,0.5); border:1px solid rgba(212,160,23,0.4); border-radius:4px; margin:0 8px; }
  .ww-reel-window { position:absolute; top:0; left:0; right:0; bottom:0; z-index:2; pointer-events:none;
    background:linear-gradient(to bottom, rgba(15,26,11,0.8) 0%, transparent 25%, transparent 75%, rgba(15,26,11,0.8) 100%); }
  .ww-reel-strip { position:absolute; left:0; right:0; top:0; display:flex; flex-direction:column;
    animation: ww-slot-spin 1.4s cubic-bezier(0.2,0.9,0.3,1) both; }
  .ww-reel-strip > div { height:26px; line-height:26px; text-align:center; font-size:11px;
    color:#cdd9e5; font-weight:600; white-space:nowrap; }
  @keyframes ww-slot-spin {
    0%   { transform:translateY(var(--reel-start,0px)); filter:blur(2px); }
    70%  { filter:blur(1px); }
    100% { transform:translateY(var(--reel-final,0px)); filter:blur(0); }
  }

  /* ── Stamp ── */
  .ww-stamp { display:inline-block; padding:3px 10px; border:3px solid currentColor; border-radius:3px;
    font-family:var(--font-display,'Impact',sans-serif); font-size:12px; font-weight:900; letter-spacing:2px;
    text-transform:uppercase; transform:rotate(-6deg) scale(1); transform-origin:center;
    animation: ww-stamp-slam 0.5s ease-out both; }
  @keyframes ww-stamp-slam {
    0%   { transform:rotate(-6deg) scale(3.5); opacity:0; }
    55%  { transform:rotate(-6deg) scale(0.9); opacity:1; }
    75%  { transform:rotate(-6deg) scale(1.05); }
    100% { transform:rotate(-6deg) scale(1); opacity:1; }
  }

  /* ── Tier Badges ── */
  .ww-tier { display:inline-block; padding:1px 6px; border-radius:8px; font-size:9px; font-weight:700; letter-spacing:0.5px; }
  .ww-tier--easy { background:rgba(63,185,80,0.2); color:#3fb950; }
  .ww-tier--medium { background:rgba(240,136,62,0.2); color:#f0883e; }
  .ww-tier--hard { background:rgba(248,81,73,0.2); color:#f85149; }
  .ww-tier--extreme { background:rgba(188,77,255,0.2); color:#bc4dff; }

  /* ── Gear Card ── */
  .ww-gear-card { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:6px;
    background:rgba(80,60,30,0.15); border:1px solid rgba(139,93,49,0.25); animation: ww-gear-tumble 0.7s ease-out both; }
  @keyframes ww-gear-tumble { 0%{opacity:0;transform:rotate(-90deg) translateY(-20px)} 60%{transform:rotate(5deg) translateY(2px)} 100%{opacity:1;transform:rotate(0) translateY(0)} }
  .ww-gear-card--armed { border-color:rgba(248,81,73,0.4); background:rgba(248,81,73,0.08); }

  /* ── Player Tiles (status board) ── */
  .ww-player-tile { padding:8px 10px; border-radius:8px; background:rgba(0,0,0,0.35);
    border:1px solid rgba(255,255,255,0.06); border-left:3px solid var(--tile-tier-color,#6e7681);
    font-size:10px; transition:transform 0.15s; }
  .ww-player-tile:hover { transform:translateY(-2px); }
  .ww-progress-bar { height:4px; border-radius:2px; background:rgba(255,255,255,0.08); overflow:hidden; margin-top:4px; }
  .ww-progress-fill { height:100%; border-radius:2px; animation: ww-fill-bar 0.8s ease-out both; }
  @keyframes ww-fill-bar { 0%{width:0%} 100%{width:var(--target-width,0%)} }

  /* ── Tranq Dart Animation ── */
  .ww-dart { display:inline-block; animation: ww-dart-fly 0.3s ease-out both; }
  @keyframes ww-dart-fly { 0%{opacity:0;transform:translateX(-40px) rotate(-15deg)} 100%{opacity:1;transform:translateX(0) rotate(0)} }

  /* ── Crosshair (hunt phases) ── */
  .ww-crosshair { display:inline-block; animation: ww-crosshair-spin 8s linear infinite; font-size:14px; }
  @keyframes ww-crosshair-spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }

  /* ── Leaf Curtain (feast reveal) ── */
  .ww-curtain-wrap { position:relative; padding:24px 0; min-height:160px; overflow:hidden; border-radius:10px; margin:8px 0; }
  .ww-curtain-wrap::before, .ww-curtain-wrap::after {
    content:''; position:absolute; top:0; bottom:0; width:50%; z-index:5;
    background:repeating-conic-gradient(#1a2416 0% 25%, #2d4a1e 0% 50%) 0 0 / 20px 20px; }
  .ww-curtain-wrap::before { left:0;  animation: ww-curtain-left  1s ease-in-out forwards; }
  .ww-curtain-wrap::after  { right:0; animation: ww-curtain-right 1s ease-in-out forwards; }
  @keyframes ww-curtain-left  { 0%{transform:translateX(0)} 100%{transform:translateX(-100%)} }
  @keyframes ww-curtain-right { 0%{transform:translateX(0)} 100%{transform:translateX(100%)} }

  .ww-spotlight { position:relative; z-index:6; text-align:center; padding-top:8px;
    background:radial-gradient(ellipse at 50% 40%, rgba(212,160,23,0.25) 0%, transparent 70%); }
  .ww-trophy-wrap { animation: ww-trophy-bounce 0.8s ease-out 1s both; display:inline-block; }
  @keyframes ww-trophy-bounce { 0%{opacity:0;transform:translateY(30px) scale(0.8)} 50%{transform:translateY(-6px) scale(1.05)} 100%{opacity:1;transform:translateY(0) scale(1)} }

  /* ── Camera Shake ── */
  .ww-camera-shake { animation: ww-camera-shake 0.4s; }
  @keyframes ww-camera-shake {
    0%,100% { transform:translate(0,0); }
    15%  { transform:translate(-3px, 2px); }
    30%  { transform:translate(3px,-2px); }
    45%  { transform:translate(-2px,-3px); }
    60%  { transform:translate(2px, 3px); }
    75%  { transform:translate(-3px, 1px); }
    90%  { transform:translate(3px,-1px); }
  }

  /* ── Reveal Controls ── */
  .ww-btn-reveal { background:rgba(63,185,80,0.1); border:1px solid rgba(63,185,80,0.3); color:#3fb950;
    padding:8px 20px; border-radius:6px; cursor:pointer; font-family:var(--font-display,'Impact',sans-serif);
    font-size:12px; letter-spacing:2px; text-transform:uppercase; margin:12px auto; display:block;
    animation: ww-btn-pulse 2s infinite; }
  .ww-btn-reveal:hover { background:rgba(63,185,80,0.2); }
  @keyframes ww-btn-pulse { 0%,100%{box-shadow:0 0 5px rgba(63,185,80,0.1)} 50%{box-shadow:0 0 15px rgba(63,185,80,0.3)} }
  .ww-btn-reveal-all { display:block; text-align:center; font-size:10px; color:#6e7681; cursor:pointer;
    text-decoration:underline; margin-top:4px; }
  .ww-btn-reveal-all:hover { color:#8b949e; }

  /* ── Results Table ── */
  .ww-results-table { width:100%; border-collapse:collapse; font-size:11px; margin-top:12px; }
  .ww-results-table th { text-align:left; color:#d4a017; font-size:9px; font-weight:700; letter-spacing:1px;
    text-transform:uppercase; padding:4px 8px; border-bottom:1px solid rgba(212,160,23,0.15); }
  .ww-results-table td { padding:4px 8px; color:#cdd9e5; border-bottom:1px solid rgba(255,255,255,0.04); }
  .ww-results-table tr.ww-row-winner { background:rgba(212,160,23,0.08); }
  .ww-results-table tr.ww-row-loser { background:rgba(248,81,73,0.06); }

  /* ── Reduced Motion ── */
  @media (prefers-reduced-motion: reduce) {
    .ww-card, .ww-card--mishap, .ww-reel-strip, .ww-stamp, .ww-gear-card,
    .ww-dart, .ww-crosshair, .ww-curtain-wrap::before, .ww-curtain-wrap::after,
    .ww-trophy-wrap, .ww-progress-fill, .ww-camera-shake, .ww-btn-reveal,
    .ww-count-flash, .ww-page::before { animation:none !important; }
    .ww-reel-strip { transform:translateY(var(--reel-final,0px)) !important; filter:none !important; }
  }
`;
```

- [ ] **Step 2: Reload and verify**

Reload simulator. The new constant should not break anything (it's unused until Task 3 replaces the VP function).

- [ ] **Step 3: Commit**

```bash
git add js/chal/wawanakwa-gone-wild.js
git commit -m "feat(wild-hunt): WW_STYLES CSS constant with all keyframes, classes, status tracker"
```

---

## Task 2: Add reveal engine functions (`_wwReveal`, `_wwRevealAll`)

**Files:**
- Modify: `js/chal/wawanakwa-gone-wild.js` — insert after `WW_STYLES`, before `rpBuildWawanakwaGoneWild`

- [ ] **Step 1: Add `_wwReveal` and `_wwRevealAll`**

Insert these functions after the `WW_STYLES` constant and before `rpBuildWawanakwaGoneWild`:

```javascript
// ── REVEAL ENGINE ──
// Exposed on window from within rpBuild via inline script

function _wwReveal(stateKey, totalSteps) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const st = _tvState[stateKey];
  if (st.idx >= totalSteps - 1) return;
  st.idx++;
  const el = document.getElementById(`ww-step-${stateKey}-${st.idx}`);
  if (el) {
    el.style.display = '';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Camera shake?
    if (el.dataset.cameraShake === '1') {
      const page = el.closest('.ww-page');
      if (page) { page.classList.add('ww-camera-shake'); setTimeout(() => page.classList.remove('ww-camera-shake'), 400); }
    }

    // Update status tracker counters
    ['hunting', 'captured', 'failed'].forEach(key => {
      const delta = parseInt(el.dataset[key + 'Delta'] || '0', 10);
      if (delta) {
        const span = document.getElementById(`ww-count-${stateKey}-${key}`);
        if (span) {
          span.textContent = parseInt(span.textContent || '0', 10) + delta;
          span.classList.remove('ww-count-flash');
          void span.offsetWidth; // force reflow
          span.classList.add('ww-count-flash');
          setTimeout(() => span.classList.remove('ww-count-flash'), 400);
        }
      }
    });
  }

  // Update button text
  const btn = document.getElementById(`ww-btn-${stateKey}`);
  if (btn) {
    if (st.idx >= totalSteps - 1) {
      const ctrl = document.getElementById(`ww-controls-${stateKey}`);
      if (ctrl) ctrl.style.display = 'none';
    } else {
      btn.textContent = `▶ NEXT EVENT (${st.idx + 2}/${totalSteps})`;
    }
  }
}

function _wwRevealAll(stateKey, totalSteps) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  _tvState[stateKey].idx = totalSteps - 1;
  for (let i = 0; i < totalSteps; i++) {
    const el = document.getElementById(`ww-step-${stateKey}-${i}`);
    if (el) el.style.display = '';
  }
  // Snap counters to final values
  const ctrl = document.getElementById(`ww-controls-${stateKey}`);
  if (ctrl) {
    ['hunting', 'captured', 'failed'].forEach(key => {
      const span = document.getElementById(`ww-count-${stateKey}-${key}`);
      const final = ctrl.dataset[`final${key.charAt(0).toUpperCase() + key.slice(1)}`];
      if (span && final != null) span.textContent = final;
    });
    ctrl.style.display = 'none';
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/wawanakwa-gone-wild.js
git commit -m "feat(wild-hunt): _wwReveal/_wwRevealAll reveal engine functions"
```

---

## Task 3: Rewrite `rpBuildWawanakwaGoneWild` — header, tracker, scoreboard

**Files:**
- Modify: `js/chal/wawanakwa-gone-wild.js` — replace entire `rpBuildWawanakwaGoneWild` function (lines ~975–1041) and `_renderWWCard` (lines ~1043–1059)

- [ ] **Step 1: Replace the entire `rpBuildWawanakwaGoneWild` function**

Delete the existing function body (lines 976–1041) and replace with a new implementation. The new function will:

1. Inject `<style>${WW_STYLES}</style>` at the start.
2. Render `.ww-page` root container.
3. Render `.ww-header` with title + subtitle.
4. Render `.ww-tracker` sticky bar with hunting/captured/failed counters.
5. Render collapsible `<details>` scoreboard.
6. Pre-compute all steps into an array, each with `{html, huntingDelta, capturedDelta, failedDelta, cameraShake}`.
7. Render each step as a hidden `#ww-step-{stateKey}-{i}` div.
8. Pre-reveal steps up to `_tvState[stateKey].idx`.
9. Render controls div with button + reveal-all link.
10. Expose `_wwReveal` and `_wwRevealAll` on `window` inline.
11. Render final results (only if fully revealed).

```javascript
export function rpBuildWawanakwaGoneWild(ep) {
  const ww = ep.wawanakwaGoneWild;
  if (!ww?.timeline?.length) return '';

  const stateKey = `ww_reveal_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // ── Compute all animal names for reel strip ──
  const ALL_ANIMAL_NAMES = ['Chipmunk','Frog','Rabbit','Duck','Raccoon','Goose','Beaver','Deer','Snake','Bear','Moose'];

  // ── Pre-compute steps from timeline ──
  const steps = [];
  let huntingCount = Object.keys(ww.huntResults || {}).length;
  let capturedCount = 0, failedCount = 0;
  let lastRound = -1;

  for (const evt of ww.timeline) {
    let huntingDelta = 0, capturedDelta = 0, failedDelta = 0, cameraShake = false;

    // Insert round separator
    if (evt.round !== undefined && evt.round !== lastRound && (evt.type === 'huntAttempt' || evt.type === 'huntMishap' || evt.type === 'huntFail')) {
      if (evt.round <= 3) {
        steps.push({ html: `<div class="ww-section"><span class="ww-crosshair">🎯</span> ROUND ${evt.round + 1}</div>`, huntingDelta: 0, capturedDelta: 0, failedDelta: 0, cameraShake: false });
      } else {
        steps.push({ html: `<div class="ww-section"><span class="ww-crosshair">🎯</span> FINAL ROUND — LAST CHANCE</div>`, huntingDelta: 0, capturedDelta: 0, failedDelta: 0, cameraShake: false });
      }
      lastRound = evt.round;
    }

    // Compute deltas
    if (evt.type === 'huntAttempt' && evt.success) { capturedDelta = 1; huntingDelta = -1; }
    if (evt.type === 'huntFail') { failedDelta = 1; huntingDelta = -1; }
    if (evt.type === 'tranqChaos' && evt.subtype === 'hitContestant') { cameraShake = true; }

    steps.push({ html: _renderWWStep(evt, ww, ALL_ANIMAL_NAMES), huntingDelta, capturedDelta, failedDelta, cameraShake });
  }

  const totalSteps = steps.length;

  // ── Compute final counter values ──
  const finalCaptured = Object.values(ww.huntResults || {}).filter(r => r.captured).length;
  const finalFailed = Object.values(ww.huntResults || {}).filter(r => !r.captured).length;
  const finalHunting = 0; // everyone resolves by end

  // ── Start building HTML ──
  let html = `<style>${WW_STYLES}</style>`;
  html += `<div class="ww-page">`;

  // Header
  html += `<div class="ww-header"><div class="ww-title">🏕️ WAWANAKWA GONE WILD!</div>`;
  html += `<div class="ww-subtitle">Catch your animal. First back wins a feast. Last back cleans the bathrooms.</div></div>`;

  // Status tracker
  html += `<div class="ww-tracker">`;
  html += `<div class="ww-tracker-item ww-tracker-item--hunting">🎯 HUNTING: <span class="ww-count" id="ww-count-${stateKey}-hunting">${huntingCount}</span></div>`;
  html += `<div class="ww-tracker-item ww-tracker-item--captured">✅ CAPTURED: <span class="ww-count" id="ww-count-${stateKey}-captured">0</span></div>`;
  html += `<div class="ww-tracker-item ww-tracker-item--failed">❌ FAILED: <span class="ww-count" id="ww-count-${stateKey}-failed">0</span></div>`;
  html += `</div>`;

  // Collapsible scoreboard
  html += `<details style="margin-bottom:14px;position:relative;z-index:2"><summary style="cursor:pointer;font-size:11px;color:#6e7681;letter-spacing:0.5px">📋 Hunt Scoreboard (spoilers)</summary>`;
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px;margin-top:8px">`;
  Object.entries(ww.huntResults || {}).forEach(([name, r]) => {
    const tierColor = { easy:'#3fb950', medium:'#f0883e', hard:'#f85149', extreme:'#bc4dff' }[r.animalTier] || '#6e7681';
    const tierEmoji = { easy:'🐿️', medium:'🦆', hard:'🦌', extreme:'🐻' }[r.animalTier] || '🐾';
    const statusIcon = r.captured ? '✅' : '❌';
    const maxAttempts = 5; // 4 rounds + 1 last chance
    const fillPct = Math.min(100, Math.round((r.attemptsMade / maxAttempts) * 100));
    const fillColor = r.captured ? '#3fb950' : '#f85149';
    html += `<div class="ww-player-tile" style="--tile-tier-color:${tierColor}">`;
    html += `<div style="font-weight:700;color:#e6edf3;margin-bottom:2px">${name}</div>`;
    html += `<div style="color:${tierColor}">${tierEmoji} ${r.animal} <span class="ww-tier ww-tier--${r.animalTier}">${r.animalTier.toUpperCase()}</span></div>`;
    html += `<div style="color:#6e7681">🎒 ${r.gear}</div>`;
    html += `<div>${statusIcon} ${r.captured ? `R${r.captureRound + 1}` : 'FAILED'} · ${r.attemptsMade} tries</div>`;
    html += `<div class="ww-progress-bar"><div class="ww-progress-fill" style="--target-width:${fillPct}%;background:${fillColor}"></div></div>`;
    html += `</div>`;
  });
  html += `</div></details>`;

  // ── Render all steps (hidden by default, pre-reveal up to state.idx) ──
  for (let i = 0; i < totalSteps; i++) {
    const step = steps[i];
    const visible = i <= state.idx;
    html += `<div id="ww-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}"`;
    if (step.huntingDelta) html += ` data-hunting-delta="${step.huntingDelta}"`;
    if (step.capturedDelta) html += ` data-captured-delta="${step.capturedDelta}"`;
    if (step.failedDelta) html += ` data-failed-delta="${step.failedDelta}"`;
    if (step.cameraShake) html += ` data-camera-shake="1"`;
    html += `>${step.html}</div>`;
  }

  // ── Controls ──
  const allRevealed = state.idx >= totalSteps - 1;
  html += `<div id="ww-controls-${stateKey}" style="${allRevealed ? 'display:none' : 'text-align:center;margin:12px 0;position:relative;z-index:2'}" data-final-hunting="${finalHunting}" data-final-captured="${finalCaptured}" data-final-failed="${finalFailed}">`;
  html += `<button class="ww-btn-reveal" id="ww-btn-${stateKey}" onclick="window._wwReveal('${stateKey}',${totalSteps})">▶ NEXT EVENT (${state.idx + 2}/${totalSteps})</button>`;
  html += `<a class="ww-btn-reveal-all" onclick="window._wwRevealAll('${stateKey}',${totalSteps})">reveal all</a>`;
  html += `</div>`;

  // ── Expose reveal functions ──
  // (They read _tvState which is on window already)
  html += `<script>window._wwReveal=${_wwReveal.toString()};window._wwRevealAll=${_wwRevealAll.toString()};</script>`;

  // ── Final results (only after full reveal) ──
  if (allRevealed) {
    html += _renderWWResults(ww, stateKey);
  }

  // ── Fix tracker counters for pre-revealed state ──
  if (state.idx >= 0) {
    // Compute what the counters should be at the current reveal index
    let h = huntingCount, c = 0, f = 0;
    for (let i = 0; i <= state.idx && i < totalSteps; i++) {
      h += steps[i].huntingDelta;
      c += steps[i].capturedDelta;
      f += steps[i].failedDelta;
    }
    html += `<script>
      (function(){
        var h=document.getElementById('ww-count-${stateKey}-hunting');
        var c=document.getElementById('ww-count-${stateKey}-captured');
        var f=document.getElementById('ww-count-${stateKey}-failed');
        if(h)h.textContent='${h}';if(c)c.textContent='${c}';if(f)f.textContent='${f}';
      })();
    </script>`;
  }

  html += `</div>`; // .ww-page
  return html;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/wawanakwa-gone-wild.js
git commit -m "feat(wild-hunt): rewrite rpBuild with header, tracker, scoreboard, step-based reveal"
```

---

## Task 4: Implement `_renderWWStep` — per-event-type card rendering

**Files:**
- Modify: `js/chal/wawanakwa-gone-wild.js` — replace `_renderWWCard` with `_renderWWStep`

- [ ] **Step 1: Replace `_renderWWCard` with `_renderWWStep`**

Delete the existing `_renderWWCard` function (lines ~1043–1059) and replace with:

```javascript
function _renderWWStep(evt, ww, ALL_ANIMAL_NAMES) {
  const GOLD = '#d4a017', GREEN = '#3fb950', RED = '#f85149', GREY = '#6e7681', ORANGE = '#f0883e', PINK = '#ff69b4', BLUE = '#58a6ff', PURPLE = '#bc4dff';

  // ── ANIMAL DRAW: slot reel ──
  if (evt.type === 'animalDraw') {
    const tierColors = { easy: GREEN, medium: ORANGE, hard: RED, extreme: PURPLE };
    const tierStamps = { easy: 'EASY PICKINGS', medium: 'FAIR GAME', hard: 'GOOD LUCK', extreme: "YOU'RE DOOMED" };
    const color = tierColors[evt.tier] || GREY;
    // Build reel strip (repeat 4× for spin length)
    const reelNames = [];
    for (let r = 0; r < 4; r++) ALL_ANIMAL_NAMES.forEach(a => reelNames.push(a));
    reelNames.push(evt.animal); // landing position
    const stripHeight = 26; // px per item
    const totalItems = reelNames.length;
    const reelStart = 0;
    const reelFinal = -((totalItems - 1) * stripHeight);

    let h = `<div class="ww-card" style="--ww-accent:${color}">`;
    h += `<div class="ww-card-label">🎲 ANIMAL DRAW</div>`;
    h += `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">`;
    // Portrait if available
    h += `<span style="font-weight:700;color:#e6edf3;font-size:13px">${evt.player}</span>`;
    h += `<div class="ww-reel" style="--reel-start:${reelStart}px;--reel-final:${reelFinal}px"><div class="ww-reel-window"></div><div class="ww-reel-strip">`;
    reelNames.forEach(a => { h += `<div>${a}</div>`; });
    h += `</div></div>`;
    h += `<span class="ww-tier ww-tier--${evt.tier}">${evt.tier.toUpperCase()}</span>`;
    h += `</div>`;
    h += `<div class="ww-card-body" style="margin-top:6px">${evt.text}</div>`;
    h += `<div style="margin-top:6px"><span class="ww-stamp" style="color:${color}">${tierStamps[evt.tier] || evt.tier.toUpperCase()}</span></div>`;
    h += `</div>`;
    return h;
  }

  // ── GEAR GRAB ──
  if (evt.type === 'gearGrab') {
    const isArmed = evt.gear?.toLowerCase().includes('tranq');
    const cardClass = isArmed ? 'ww-gear-card ww-gear-card--armed' : 'ww-gear-card';
    let h = `<div class="ww-card" style="--ww-accent:${isArmed ? RED : '#8b5a2b'}">`;
    h += `<div class="ww-card-label">🎒 GEAR GRAB</div>`;
    h += `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">`;
    h += `<span style="font-weight:700;color:#e6edf3">${evt.player}</span>`;
    h += `<span class="${cardClass}">${isArmed ? '💉 ' : ''}${evt.gear} <span style="color:#6e7681;font-size:9px">(${evt.gearTier})</span></span>`;
    h += `</div>`;
    h += `<div class="ww-card-body" style="margin-top:4px">${evt.text}</div>`;
    if (isArmed) h += `<div style="margin-top:4px"><span class="ww-stamp" style="color:${RED}">ARMED AND DANGEROUS</span></div>`;
    h += `</div>`;
    return h;
  }

  // ── CHRIS QUIP ──
  if (evt.type === 'chrisQuip') {
    let h = `<div class="ww-card" style="--ww-accent:${ORANGE}">`;
    h += `<div class="ww-card-label">📢 CHRIS MCLEAN</div>`;
    h += `<div class="ww-card-body" style="font-style:italic">${evt.text}</div>`;
    h += `</div>`;
    return h;
  }

  // ── HUNT ATTEMPT (success) ──
  if (evt.type === 'huntAttempt' && evt.success) {
    let h = `<div class="ww-card" style="--ww-accent:${GREEN}">`;
    h += `<div class="ww-card-label">✅ CAPTURE — ${evt.animal.toUpperCase()}</div>`;
    h += `<div class="ww-card-body">${evt.text}</div>`;
    h += `<div style="margin-top:6px"><span class="ww-stamp" style="color:${GREEN}">CAUGHT!</span></div>`;
    h += `<div class="ww-card-footer">${evt.player} · Round ${(evt.round || 0) + 1}</div>`;
    h += `</div>`;
    return h;
  }

  // ── HUNT ATTEMPT (fail) ──
  if (evt.type === 'huntAttempt' && !evt.success) {
    let h = `<div class="ww-card" style="--ww-accent:${ORANGE}">`;
    h += `<div class="ww-card-label">❌ FAILED ATTEMPT — ${evt.animal.toUpperCase()}</div>`;
    h += `<div class="ww-card-body">${evt.text}</div>`;
    h += `<div class="ww-card-footer">${evt.player} · Round ${(evt.round || 0) + 1}</div>`;
    h += `</div>`;
    return h;
  }

  // ── HUNT MISHAP ──
  if (evt.type === 'huntMishap') {
    let h = `<div class="ww-card ww-card--mishap" style="--ww-accent:${RED}">`;
    h += `<div class="ww-card-label">💥 MISHAP — ${evt.animal.toUpperCase()}</div>`;
    h += `<div class="ww-card-body">${evt.text}</div>`;
    h += `<div class="ww-card-footer">${evt.player} · Round ${(evt.round || 0) + 1}</div>`;
    h += `</div>`;
    return h;
  }

  // ── HUNT FAIL (never caught) ──
  if (evt.type === 'huntFail') {
    let h = `<div class="ww-card" style="--ww-accent:${RED}">`;
    h += `<div class="ww-card-label">💀 NO CATCH — ${evt.animal.toUpperCase()}</div>`;
    h += `<div class="ww-card-body">${evt.text}</div>`;
    h += `<div style="margin-top:6px"><span class="ww-stamp" style="color:${RED}">FAILED</span></div>`;
    h += `<div class="ww-card-footer">${evt.player}</div>`;
    h += `</div>`;
    return h;
  }

  // ── TRANQ CHAOS ──
  if (evt.type === 'tranqChaos') {
    let h = `<div class="ww-card ww-card--tranq" style="--ww-accent:${RED}">`;
    h += `<div class="ww-card-label"><span class="ww-dart">💉</span> TRANQUILIZER CHAOS${evt.badgeText ? ' · ' + evt.badgeText : ''}</div>`;
    h += `<div class="ww-card-body">${evt.text}</div>`;
    if (evt.players?.length) h += `<div class="ww-card-footer">${evt.players.join(', ')}</div>`;
    h += `</div>`;
    return h;
  }

  // ── FEAST REVEAL (leaf curtain) ──
  if (evt.type === 'feastReveal') {
    const winner = evt.player || ww.immunityWinner || '???';
    let h = `<div class="ww-curtain-wrap">`;
    h += `<div class="ww-spotlight">`;
    h += `<div class="ww-trophy-wrap">`;
    h += `<div style="font-size:36px">🏆</div>`;
    h += `<div style="font-family:var(--font-display,'Impact',sans-serif);font-size:22px;font-weight:800;color:${GOLD};letter-spacing:2px;margin-top:4px">${winner}</div>`;
    h += `<div style="font-size:12px;color:#cdd9e5;margin-top:4px">IMMUNITY + FEAST OF ALL THEIR FAVORITES</div>`;
    h += `</div>`;
    h += `<div style="margin-top:10px"><span class="ww-stamp" style="color:${GOLD}">🏆 FEAST WINNER</span></div>`;
    h += `</div></div>`;
    return h;
  }

  // ── PUNISHMENT REVEAL ──
  if (evt.type === 'punishmentReveal') {
    const loser = evt.player || ww.punishmentTarget || '???';
    let h = `<div class="ww-card ww-card--punish" style="--ww-accent:${RED};animation:ww-scan-in 0.35s ease-out both,ww-pulse-red 0.6s 0.35s 2">`;
    h += `<div class="ww-card-label">🚽 BATHROOM DUTY</div>`;
    h += `<div style="font-family:var(--font-display,'Impact',sans-serif);font-size:18px;font-weight:700;color:${RED};margin:4px 0">${loser}</div>`;
    h += `<div class="ww-card-body">${evt.text}</div>`;
    h += `<div style="margin-top:6px"><span class="ww-stamp" style="color:${RED}">BATHROOM DUTY</span></div>`;
    h += `</div>`;
    return h;
  }

  // ── HUNT EVENTS (subtypes) ──
  if (evt.type === 'huntEvent') {
    const subtypeConfig = {
      'help':              { color: GREEN, emoji: '🤝', label: 'HELPING HAND' },
      'sabotage':          { color: RED,   emoji: '🔪', label: 'SABOTAGE' },
      'sabotage-caught':   { color: RED,   emoji: '🔪', label: 'SABOTAGE CAUGHT' },
      'alliance-accepted': { color: GOLD,  emoji: '🤝', label: 'ALLIANCE FORMED' },
      'alliance-rejected': { color: GREY,  emoji: '🚫', label: 'ALLIANCE REJECTED' },
      'alliance-backfire': { color: RED,   emoji: '🗡️', label: 'ALLIANCE BETRAYAL' },
      'taunt':             { color: RED,   emoji: '😏', label: 'TAUNT' },
      'encourage':         { color: GREEN, emoji: '💪', label: 'ENCOURAGEMENT' },
      'showmance':         { color: PINK,  emoji: '💕', label: 'SHOWMANCE MOMENT' },
      'rivalry':           { color: RED,   emoji: '⚡', label: 'RIVALRY CLASH' },
      'discovery':         { color: BLUE,  emoji: '🔎', label: 'DISCOVERY' },
      'steal-gear':        { color: RED,   emoji: '🖐️', label: 'GEAR STOLEN' },
      'animal-encounter':  { color: ORANGE,emoji: '🐾', label: 'ANIMAL ENCOUNTER' },
    };
    const cfg = subtypeConfig[evt.subtype] || { color: GREY, emoji: '⚡', label: (evt.subtype || 'EVENT').toUpperCase() };
    let h = `<div class="ww-card" style="--ww-accent:${cfg.color}">`;
    h += `<div class="ww-card-label">${cfg.emoji} ${cfg.label}${evt.badgeText ? ' · ' + evt.badgeText : ''}</div>`;
    h += `<div class="ww-card-body">${evt.text}</div>`;
    if (evt.players?.length) h += `<div class="ww-card-footer">${evt.players.join(', ')}</div>`;
    h += `</div>`;
    return h;
  }

  // ── FALLBACK ──
  let h = `<div class="ww-card" style="--ww-accent:${GREY}">`;
  h += `<div class="ww-card-label">📋 ${(evt.type || 'EVENT').toUpperCase()}</div>`;
  h += `<div class="ww-card-body">${evt.text || ''}</div>`;
  h += `</div>`;
  return h;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/wawanakwa-gone-wild.js
git commit -m "feat(wild-hunt): _renderWWStep with animal draw reel, gear tumble, tranq dart, feast curtain"
```

---

## Task 5: Add `_renderWWResults` — final results after full reveal

**Files:**
- Modify: `js/chal/wawanakwa-gone-wild.js` — add new function near `_renderWWStep`

- [ ] **Step 1: Add `_renderWWResults`**

Insert after `_renderWWStep`:

```javascript
function _renderWWResults(ww) {
  const GOLD = '#d4a017', GREEN = '#3fb950', RED = '#f85149', GREY = '#6e7681';
  let html = `<div style="position:relative;z-index:2;margin-top:16px">`;

  // Finish order table
  html += `<div class="ww-section">📊 FINAL STANDINGS</div>`;
  html += `<table class="ww-results-table"><thead><tr>`;
  html += `<th>#</th><th>Player</th><th>Animal</th><th>Gear</th><th>Result</th><th>Tries</th><th>Score</th>`;
  html += `</tr></thead><tbody>`;
  (ww.finishOrder || []).forEach((name, i) => {
    const r = (ww.huntResults || {})[name];
    if (!r) return;
    const isWinner = i === 0;
    const isLoser = i === (ww.finishOrder.length - 1);
    const rowClass = isWinner ? 'ww-row-winner' : isLoser ? 'ww-row-loser' : '';
    const resultText = r.captured ? `<span style="color:${GREEN}">CAUGHT R${r.captureRound + 1}</span>` : `<span style="color:${RED}">FAILED</span>`;
    const mods = [];
    if (r.helpedBy) mods.push(`helped by ${r.helpedBy}`);
    if (r.sabotagedBy) mods.push(`sabotaged by ${r.sabotagedBy}`);
    if (r.tranqDarted) mods.push("tranq'd");

    html += `<tr class="${rowClass}">`;
    html += `<td style="color:${isWinner ? GOLD : isLoser ? RED : '#cdd9e5'};font-weight:700">#${i + 1}</td>`;
    html += `<td style="font-weight:700">${name}${isWinner ? ' 🏆' : isLoser ? ' 🚽' : ''}</td>`;
    html += `<td>${r.animal} <span class="ww-tier ww-tier--${r.animalTier}">${r.animalTier.toUpperCase()}</span></td>`;
    html += `<td style="color:${GREY}">${r.gear}</td>`;
    html += `<td>${resultText}</td>`;
    html += `<td>${r.attemptsMade}</td>`;
    html += `<td>${(r.personalScore || 0).toFixed(1)}${mods.length ? `<div style="font-size:8px;color:${GREY}">${mods.join(' · ')}</div>` : ''}</td>`;
    html += `</tr>`;
  });
  html += `</tbody></table>`;

  // Alliance offer summary (if any alliance events)
  const allianceEvents = (ww.timeline || []).filter(e => e.type === 'huntEvent' && (e.subtype === 'alliance-accepted' || e.subtype === 'alliance-rejected' || e.subtype === 'alliance-backfire'));
  if (allianceEvents.length) {
    html += `<div style="margin-top:12px;padding:10px;border-radius:8px;background:rgba(212,160,23,0.06);border:1px solid rgba(212,160,23,0.15)">`;
    html += `<div style="font-size:10px;font-weight:700;letter-spacing:1px;color:${GOLD};margin-bottom:6px">🤝 ALLIANCE ACTIVITY</div>`;
    allianceEvents.forEach(ae => {
      const icon = ae.subtype === 'alliance-accepted' ? '✅' : ae.subtype === 'alliance-backfire' ? '🗡️' : '🚫';
      html += `<div style="font-size:11px;color:#cdd9e5;margin-bottom:3px">${icon} ${ae.players?.join(' & ') || '???'} — ${ae.subtype.replace(/-/g, ' ').toUpperCase()}</div>`;
    });
    html += `</div>`;
  }

  // Tranq incident report (if any tranq events)
  const tranqEvents = (ww.timeline || []).filter(e => e.type === 'tranqChaos');
  if (tranqEvents.length) {
    html += `<div style="margin-top:12px;padding:10px;border-radius:8px;background:rgba(248,81,73,0.06);border:1px solid rgba(248,81,73,0.15)">`;
    html += `<div style="font-size:10px;font-weight:700;letter-spacing:1px;color:${RED};margin-bottom:6px">💉 TRANQUILIZER INCIDENT REPORT</div>`;
    tranqEvents.forEach(te => {
      html += `<div style="font-size:11px;color:#cdd9e5;margin-bottom:3px"><span class="ww-dart">💉</span> ${te.players?.join(' → ') || '???'} — ${(te.subtype || 'unknown').replace(/-/g, ' ').toUpperCase()}</div>`;
    });
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/chal/wawanakwa-gone-wild.js
git commit -m "feat(wild-hunt): _renderWWResults with finish table, alliance summary, tranq report"
```

---

## Task 6: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run a complete Wawanakwa Gone Wild VP end-to-end**

Reload simulator. Configure season, reach post-merge, trigger the wawanakwa-gone-wild twist. Click every single "NEXT EVENT" through all phases. Verify:

1. **Tracker** updates correctly — HUNTING decreases, CAPTURED/FAILED increase on the right steps.
2. **Animal draw reels** spin and land on the correct animal for each player. Tier stamps slam in.
3. **Gear grab cards** tumble in. Tranq gun gets "ARMED AND DANGEROUS" stamp.
4. **Round separators** appear between hunt phases with crosshair icon.
5. **Mishap cards** shake briefly on reveal.
6. **Tranq chaos cards** show animated dart. Page shakes on contestant hits.
7. **Capture success cards** show "CAUGHT!" stamp in green.
8. **Feast reveal**: leaf curtain slides apart revealing winner in gold spotlight with trophy bounce.
9. **Punishment reveal**: red pulsing card with toilet icon + "BATHROOM DUTY" stamp.
10. **"reveal all"** snaps all steps visible and final counters are correct.
11. **Scoreboard** is hidden behind `<details>`, shows progress bars per player.
12. **Final results** table appears after full reveal with finish order, alliance summary, tranq report.

- [ ] **Step 2: Console smoke test**

With DevTools console open, click through an entire VP. Confirm no errors, no warnings related to missing elements.

- [ ] **Step 3: Test save/load round-trip**

Save state mid-VP-reveal, reload, confirm `_tvState` is rebuilt correctly and the VP renders at the saved reveal index with correct counter values.

- [ ] **Step 4: Test reduced motion**

Enable `prefers-reduced-motion: reduce` in DevTools. Confirm:
- No animations play.
- Reels snap directly to final position.
- All content is still visible and readable.

- [ ] **Step 5: Commit (if any fixes needed)**

If the verification pass surfaces bugs, fix them and commit with `fix(wild-hunt): <description>`. If clean, no commit needed.

---

## Files touched at completion

- `js/chal/wawanakwa-gone-wild.js` — ~250 new lines of CSS in `WW_STYLES`, `_wwReveal`/`_wwRevealAll` reveal engine, complete rewrite of `rpBuildWawanakwaGoneWild`, new `_renderWWStep` replacing `_renderWWCard`, new `_renderWWResults`.

## Files NOT touched

- No changes to any other `js/chal/*.js` challenge files.
- No changes to `js/core.js`, `js/episode.js`, `js/twists.js`, `js/vp-screens.js`, `js/main.js`, `js/text-backlog.js`, `js/savestate.js`, `js/run-ui.js`.
- No changes to simulation logic, `simulateWawanakwaGoneWild`, or `_textWawanakwaGoneWild`.
- No changes to `franchise_roster.json` or any asset files.
- No changes to save-state serialization or episode history patching.
