# Off the Chain — Full Overdrive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `rpBuildOffTheChain` VP up to Say Uncle / Brunch / Basic Straining visual ambition — polish every section without changing gameplay.

**Architecture:** All edits live in `js/chal/off-the-chain.js`. Add ~300 lines of CSS + keyframes to the existing `MX_STYLES` block; extend the `_mxReveal` engine with a unconditional RPM-rev pulse + optional `data-camera-shake` / `data-ticker-line` hooks; rewrite 8 step-generation sections in `rpBuildOffTheChain`. No new modules, no schema changes, no new imports.

**Tech Stack:** Vanilla ES modules, inline `<style>` blocks, CSS keyframes, no build step. Project has no automated test runner — verification is manual in a browser via `simulator.html`.

---

## Setup

Before starting: verify you can reach the challenge VP. Open `simulator.html` in a browser, build or load a season, fast-forward to a post-merge episode, and trigger the `off-the-chain` twist from the debug challenge tab (or a seeded save). You should see the existing motocross VP render with its current step-by-step reveal. Keep this tab open and reload after each task.

Reference files:
- Spec: `docs/superpowers/specs/2026-04-16-off-the-chain-overdrive-design.md`
- Target: `js/chal/off-the-chain.js` (1504 lines; `MX_STYLES` starts at line 954, `rpBuildOffTheChain` starts at line 1008, `_mxReveal` at line 1451)

**Commit convention:** `feat(off-chain): <description>` — matches the project's recent style.

---

## Task 1: Add shared CSS infrastructure

**Files:**
- Modify: `js/chal/off-the-chain.js` (append to `MX_STYLES`, before the closing backtick at line 1000)

- [ ] **Step 1: Read the existing `MX_STYLES` block**

Read `js/chal/off-the-chain.js` lines 954–1000 to confirm the current closing of the template literal.

- [ ] **Step 2: Append the overdrive CSS block**

Add the following before the closing `` ` `` of `MX_STYLES`. Keep all existing rules intact — this is a pure append.

```css
  /* ── OVERDRIVE ADDITIONS ── */

  /* Slot-machine reel */
  .mx-reel { position:relative; width:180px; height:28px; overflow:hidden;
    background:rgba(0,0,0,0.5); border:1px solid rgba(255,107,0,0.4); border-radius:4px; }
  .mx-reel-window { position:absolute; top:0; left:0; right:0; bottom:0; z-index:2; pointer-events:none;
    background:linear-gradient(to bottom, rgba(26,16,8,0.7) 0%, transparent 25%, transparent 75%, rgba(26,16,8,0.7) 100%); }
  .mx-reel-strip { position:absolute; left:0; right:0; top:0; display:flex; flex-direction:column;
    animation: mx-reel-spin 1.2s cubic-bezier(0.2,0.9,0.3,1) both; }
  .mx-reel-strip > div { height:28px; line-height:28px; text-align:center; font-size:12px;
    color:#cdd9e5; font-weight:600; }
  @keyframes mx-reel-spin {
    0%   { transform: translateY(var(--reel-start, 0px)); filter:blur(2px); }
    70%  { filter:blur(1px); }
    100% { transform: translateY(var(--reel-final, 0px)); filter:blur(0); }
  }

  /* Stamp slam (SWAP, CASE CLOSED, bike names) */
  .mx-stamp { display:inline-block; padding:4px 12px; border:3px solid currentColor; border-radius:3px;
    font-family:'Impact','Arial Narrow',sans-serif; font-size:14px; font-weight:900; letter-spacing:2px;
    text-transform:uppercase; transform:rotate(-8deg) scale(1); transform-origin:center;
    animation: mx-stamp-slam 0.55s ease-out both; }
  @keyframes mx-stamp-slam {
    0%   { transform: rotate(-8deg) scale(4); opacity:0; }
    55%  { transform: rotate(-8deg) scale(0.85); opacity:1; }
    75%  { transform: rotate(-8deg) scale(1.08); }
    100% { transform: rotate(-8deg) scale(1); opacity:1; }
  }

  /* Weld sparks (build phase) */
  .mx-spark-field { position:relative; height:0; }
  .mx-weld-spark { position:absolute; width:4px; height:4px; border-radius:50%;
    background: radial-gradient(circle, #fff 0%, #ffd700 45%, transparent 75%);
    pointer-events:none;
    animation: mx-weld-spark 0.7s ease-out forwards;
    animation-delay: var(--spark-delay, 0ms); }
  @keyframes mx-weld-spark {
    0%   { transform: translate(0,0) scale(0.4); opacity:0; }
    25%  { transform: translate(calc(var(--sx,0) * 0.4), calc(var(--sy,0) * 0.4)) scale(1.3); opacity:1; }
    100% { transform: translate(var(--sx,0), calc(var(--sy,0) + 12px)) scale(0.2); opacity:0; }
  }

  /* Camera shake (catastrophic breakdown) */
  .mx-camera-shake { animation: mx-camera-shake 0.4s; }
  @keyframes mx-camera-shake {
    0%,100% { transform: translate(0,0); }
    15%  { transform: translate(-3px, 2px); }
    30%  { transform: translate(3px,-2px); }
    45%  { transform: translate(-2px,-3px); }
    60%  { transform: translate(2px, 3px); }
    75%  { transform: translate(-3px, 1px); }
    90%  { transform: translate(3px,-1px); }
  }

  /* Checkered-flag curtain (finish line) */
  .mx-curtain-wrap { position:relative; padding:24px 0; min-height:180px; overflow:hidden; }
  .mx-curtain-wrap::before, .mx-curtain-wrap::after {
    content:''; position:absolute; top:0; bottom:0; width:50%; z-index:5;
    background:repeating-conic-gradient(#111 0% 25%, #fff 0% 50%) 0 0 / 24px 24px; }
  .mx-curtain-wrap::before { left:0;  animation: mx-curtain-left  1s ease-in-out forwards; }
  .mx-curtain-wrap::after  { right:0; animation: mx-curtain-right 1s ease-in-out forwards; }
  @keyframes mx-curtain-left  { to { transform: translateX(-100%); } }
  @keyframes mx-curtain-right { to { transform: translateX( 100%); } }
  .mx-curtain-spotlight { position:relative; z-index:1; text-align:center; padding:16px;
    background: radial-gradient(ellipse at center, rgba(255,215,0,0.25) 0%, transparent 65%); }

  /* Photo finish label */
  .mx-photo-finish { display:inline-block; font-size:13px; letter-spacing:4px; color:#ffd700;
    background:rgba(255,215,0,0.12); border:2px dashed #ffd700; padding:6px 14px; border-radius:4px;
    margin-bottom:10px; animation: mx-stamp-slam 0.55s ease-out both; font-weight:800; }

  /* Podium */
  .mx-podium { display:flex; align-items:flex-end; justify-content:center; gap:10px;
    margin-top:18px; min-height:200px; }
  .mx-podium-plinth { flex:0 0 auto; width:96px; display:flex; flex-direction:column; align-items:center;
    animation: mx-drop-in 0.6s ease-out both; }
  .mx-podium-plinth[data-rank="1"] { order:2; }
  .mx-podium-plinth[data-rank="2"] { order:1; animation-delay:0.15s; }
  .mx-podium-plinth[data-rank="3"] { order:3; animation-delay:0.3s; }
  .mx-podium-block { width:100%; border-top:3px solid; display:flex; align-items:center;
    justify-content:center; font-weight:900; font-size:22px; color:#1a1008;
    background:linear-gradient(to top, rgba(255,107,0,0.9), rgba(255,107,0,0.4)); border-color:#ff6b00; }
  .mx-podium-plinth[data-rank="1"] .mx-podium-block { height:130px;
    background:linear-gradient(to top, rgba(255,215,0,1), rgba(255,215,0,0.5)); border-color:#ffd700; }
  .mx-podium-plinth[data-rank="2"] .mx-podium-block { height:95px;
    background:linear-gradient(to top, rgba(200,200,200,0.9), rgba(200,200,200,0.4)); border-color:#cccccc; }
  .mx-podium-plinth[data-rank="3"] .mx-podium-block { height:70px;
    background:linear-gradient(to top, rgba(205,127,50,1), rgba(205,127,50,0.4)); border-color:#cd7f32; }

  /* HP drain overlay */
  .mx-hp-bar { position:relative; }
  .mx-hp-drain-flash { position:absolute; top:0; left:0; bottom:0; width:100%;
    background:rgba(255,51,51,0.6); opacity:0; animation: mx-hp-drain-flash 0.6s ease-out both; pointer-events:none; }
  @keyframes mx-hp-drain-flash { 0%{opacity:0} 25%{opacity:0.9} 100%{opacity:0} }

  /* Obstacle backdrops */
  .mx-obstacle-bg { position:relative; padding:12px; border-radius:6px; margin-bottom:10px; overflow:hidden; }
  .mx-obstacle-bg::before { content:''; position:absolute; inset:0; z-index:0; pointer-events:none; }
  .mx-obstacle-bg > * { position:relative; z-index:1; }
  .mx-obstacle-bg--mines::before {
    background: radial-gradient(circle at 15% 30%, rgba(255,51,51,0.35) 0%, transparent 8%),
                radial-gradient(circle at 70% 60%, rgba(255,51,51,0.35) 0%, transparent 8%),
                radial-gradient(circle at 40% 80%, rgba(255,51,51,0.35) 0%, transparent 8%),
                radial-gradient(circle at 85% 15%, rgba(255,51,51,0.35) 0%, transparent 8%),
                radial-gradient(circle at 25% 55%, rgba(255,51,51,0.35) 0%, transparent 8%),
                rgba(50,20,10,0.4);
    animation: mx-mine-pulse 1.8s ease-in-out infinite; }
  @keyframes mx-mine-pulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
  .mx-obstacle-bg--oil::before {
    background:repeating-linear-gradient(115deg,
      rgba(60,80,180,0.25) 0px, rgba(180,60,180,0.25) 20px,
      rgba(60,180,120,0.25) 40px, rgba(180,180,60,0.25) 60px, rgba(60,80,180,0.25) 80px);
    animation: mx-oil-shift 3s linear infinite; }
  @keyframes mx-oil-shift { to { background-position: 80px 0; } }
  .mx-obstacle-bg--piranhas::before {
    background:linear-gradient(to bottom, rgba(20,60,100,0.5) 0%, rgba(10,30,60,0.8) 100%); }
  .mx-obstacle-bg--piranhas::after {
    content:'▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲'; position:absolute; bottom:2px; left:0; right:0;
    text-align:center; font-size:10px; color:rgba(255,255,255,0.6); letter-spacing:3px;
    z-index:0; animation: mx-teeth-chomp 0.6s ease-in-out infinite; }
  @keyframes mx-teeth-chomp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }

  /* Debris settle (aftermath) */
  .mx-debris-wrap { position:relative; padding:8px; border-radius:6px;
    background:linear-gradient(to bottom, rgba(255,107,0,0.04) 0%, rgba(255,107,0,0.08) 100%);
    animation: mx-debris-settle 0.8s ease-out both; }
  @keyframes mx-debris-settle {
    0%   { opacity:0; transform:translateY(-6px); }
    100% { opacity:1; transform:translateY(0); }
  }
  .mx-field-mic::before { content:'🎤 '; opacity:0.7; margin-right:4px; }

  /* Evidence board (wreckage report) */
  .mx-evidence-board { position:relative; padding:20px 12px; border-radius:6px;
    background:
      radial-gradient(circle at 20% 30%, rgba(160,100,50,0.25) 0%, transparent 2%),
      radial-gradient(circle at 70% 60%, rgba(160,100,50,0.2) 0%, transparent 2%),
      radial-gradient(circle at 40% 80%, rgba(160,100,50,0.15) 0%, transparent 2%),
      radial-gradient(circle at 85% 25%, rgba(160,100,50,0.2) 0%, transparent 2%),
      linear-gradient(135deg, rgba(120,80,40,0.4), rgba(80,50,25,0.5));
    border:2px solid rgba(160,100,50,0.5); }
  .mx-evidence-pin { position:relative; }
  .mx-evidence-pin::before {
    content:''; position:absolute; top:-4px; left:50%; transform:translateX(-50%);
    width:10px; height:10px; border-radius:50%;
    background: radial-gradient(circle at 35% 35%, #ff6b00 0%, #aa3300 70%);
    box-shadow: 0 1px 2px rgba(0,0,0,0.5); z-index:3; }
  .mx-evidence-svg { position:absolute; inset:0; pointer-events:none; z-index:2; }
  .mx-evidence-line { stroke:#ff3333; stroke-width:2; stroke-dasharray:6 4; fill:none;
    stroke-dashoffset:100; animation: mx-evidence-draw 1.2s ease-out forwards; }
  @keyframes mx-evidence-draw { to { stroke-dashoffset:0; } }

  /* Ticker marquee */
  .mx-ticker { position:relative; overflow:hidden; height:22px; margin:0 0 12px 0;
    background:linear-gradient(to right, rgba(255,107,0,0.15), rgba(255,107,0,0.05), rgba(255,107,0,0.15));
    border-top:1px solid rgba(255,107,0,0.3); border-bottom:1px solid rgba(255,107,0,0.3); }
  .mx-ticker-inner { position:absolute; white-space:nowrap; top:0; left:0; height:22px; line-height:22px;
    font-size:11px; color:#ffd700; letter-spacing:1.5px;
    animation: mx-ticker-scroll 32s linear infinite; }
  @keyframes mx-ticker-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

  /* RPM gauge */
  .mx-rpm { position:relative; width:64px; height:34px; overflow:hidden; display:inline-block; vertical-align:middle; }
  .mx-rpm-dial { position:absolute; inset:0 0 -32px 0;
    background: conic-gradient(from 270deg, #00ff41 0deg, #ffd700 60deg, #ff6b00 90deg, #ff3333 120deg, transparent 120deg);
    border-radius:50%; opacity:0.35; }
  .mx-rpm-needle { position:absolute; bottom:0; left:50%; width:2px; height:28px;
    background:#ff3333; transform-origin:bottom center; transform:rotate(-60deg); }
  .mx-rpm-needle.mx-rpm-rev { animation: mx-rpm-needle 0.8s cubic-bezier(0.2,0.8,0.3,1) both; }
  @keyframes mx-rpm-needle {
    0%   { transform: rotate(-60deg); }
    30%  { transform: rotate(55deg); }
    100% { transform: rotate(-60deg); }
  }
  .mx-rpm-label { position:absolute; bottom:-2px; left:0; right:0; text-align:center;
    font-size:8px; letter-spacing:1px; color:#ff6b00; }
```

- [ ] **Step 3: Reload simulator and verify no regression**

Reload the browser tab showing `simulator.html`. Run through the existing Off the Chain VP. Confirm every section still renders identically to before (new CSS has no effect yet because nothing uses the classes).

Expected: no visual change, no console errors.

- [ ] **Step 4: Commit**

```bash
git add js/chal/off-the-chain.js
git commit -m "feat(off-chain): add overdrive CSS infrastructure"
```

---

## Task 2: Extend `_mxReveal` with hook logic + step attribute serialization

**Files:**
- Modify: `js/chal/off-the-chain.js` — `_mxReveal` function (starts ~line 1451), `steps.forEach` serialization inside `rpBuildOffTheChain` (~line 1437)

- [ ] **Step 1: Update the step serialization to emit new data-* attributes**

Locate the `steps.forEach` block inside `rpBuildOffTheChain` (around line 1437). The current line is:

```js
html += `<div id="mx-step-${stateKey}-${i}" data-racing-delta="${step.racingDelta||0}" data-wrecked-delta="${step.wreckedDelta||0}" data-finished-delta="${step.finishedDelta||0}" data-immune-delta="${step.immuneDelta||0}" style="${visible ? '' : 'display:none'}">${step.html}</div>`;
```

Replace with:

```js
const shakeAttr = step.cameraShake ? ' data-camera-shake="1"' : '';
const tickerAttr = step.tickerLine ? ` data-ticker-line="${String(step.tickerLine).replace(/"/g,'&quot;')}"` : '';
html += `<div id="mx-step-${stateKey}-${i}" data-racing-delta="${step.racingDelta||0}" data-wrecked-delta="${step.wreckedDelta||0}" data-finished-delta="${step.finishedDelta||0}" data-immune-delta="${step.immuneDelta||0}"${shakeAttr}${tickerAttr} style="${visible ? '' : 'display:none'}">${step.html}</div>`;
```

- [ ] **Step 2: Extend `_mxReveal` with RPM rev, camera shake, ticker push**

Locate `_mxReveal` (line 1451). The existing function body is:

```js
export function _mxReveal(stateKey, totalSteps) {
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];
  const nextIdx = state.idx + 1;
  if (nextIdx >= totalSteps) return;
  const el = document.getElementById(`mx-step-${stateKey}-${nextIdx}`);
  if (el) { el.style.display = ''; el.classList.add('mx-scan-in'); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  state.idx = nextIdx;
  // Update status tracker counts
  if (el) {
    const rd = parseInt(el.dataset.racingDelta || '0');
    const wd = parseInt(el.dataset.wreckedDelta || '0');
    const fd = parseInt(el.dataset.finishedDelta || '0');
    if (rd || wd || fd) {
      const rEl = document.getElementById(`mx-racing-${stateKey}`);
      const wEl = document.getElementById(`mx-wrecked-${stateKey}`);
      const fEl = document.getElementById(`mx-finished-${stateKey}`);
      if (rEl && rd) { rEl.textContent = Math.max(0, parseInt(rEl.textContent) + rd); rEl.classList.remove('mx-count-flash'); void rEl.offsetWidth; rEl.classList.add('mx-count-flash'); }
      if (wEl && wd) { wEl.textContent = parseInt(wEl.textContent) + wd; wEl.classList.remove('mx-count-flash'); void wEl.offsetWidth; wEl.classList.add('mx-count-flash'); }
      if (fEl && fd) { fEl.textContent = parseInt(fEl.textContent) + fd; fEl.classList.remove('mx-count-flash'); void fEl.offsetWidth; fEl.classList.add('mx-count-flash'); }
    }
  }
  if (nextIdx >= totalSteps - 1) {
    const controls = document.getElementById(`mx-controls-${stateKey}`);
    if (controls) controls.style.display = 'none';
  } else {
    const btn = document.getElementById(`mx-btn-${stateKey}`);
    if (btn) btn.textContent = `▶ NEXT LAP (${nextIdx + 2}/${totalSteps})`;
  }
}
```

Insert the new hook block immediately after the `state.idx = nextIdx;` line (before the `// Update status tracker counts` comment):

```js
  // Overdrive hooks: RPM rev, camera shake, ticker push
  const rpmNeedle = document.getElementById(`mx-rpm-needle-${stateKey}`);
  if (rpmNeedle) {
    rpmNeedle.classList.remove('mx-rpm-rev');
    void rpmNeedle.offsetWidth;
    rpmNeedle.classList.add('mx-rpm-rev');
    setTimeout(() => rpmNeedle.classList.remove('mx-rpm-rev'), 850);
  }
  if (el?.dataset.cameraShake === '1') {
    const page = el.closest('.mx-page');
    if (page) {
      page.classList.remove('mx-camera-shake');
      void page.offsetWidth;
      page.classList.add('mx-camera-shake');
      setTimeout(() => page.classList.remove('mx-camera-shake'), 450);
    }
  }
  if (el?.dataset.tickerLine) {
    const tickerInner = document.getElementById(`mx-ticker-inner-${stateKey}`);
    if (tickerInner) {
      const line = el.dataset.tickerLine;
      tickerInner.textContent = line + '  •  ' + tickerInner.textContent;
    }
  }
```

- [ ] **Step 3: Reload and verify no regression**

Reload the simulator and re-run the Off the Chain VP. Since no step uses `cameraShake`, `tickerLine`, and the RPM/ticker DOM elements don't exist yet, the new hook code's branches all short-circuit on missing elements. Confirm VP renders identically, console clean.

- [ ] **Step 4: Commit**

```bash
git add js/chal/off-the-chain.js
git commit -m "feat(off-chain): extend reveal engine with rpm/shake/ticker hooks"
```

---

## Task 3: Add global chrome — ticker band + RPM gauge

**Files:**
- Modify: `js/chal/off-the-chain.js` — `rpBuildOffTheChain` HTML assembly section (~line 1425)

- [ ] **Step 1: Locate the header assembly**

Find the block starting `let html = \`<style>${MX_STYLES}</style><div class="mx-page rp-page">` near line 1425. Just after the `.mx-header` closing `</div></div>\`;`.

- [ ] **Step 2: Seed ticker content from Chris quips**

Immediately before `let html = ` in `rpBuildOffTheChain`, add a helper that builds ticker content:

```js
  // Build ticker content: flatten all Chris quip pools, shuffle, join
  const tickerLines = [];
  Object.values(CHRIS_BIKE_QUIPS || {}).forEach(v => {
    if (Array.isArray(v)) tickerLines.push(...v);
    else if (typeof v === 'string') tickerLines.push(v);
  });
  for (let i = tickerLines.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tickerLines[i], tickerLines[j]] = [tickerLines[j], tickerLines[i]];
  }
  const tickerText = tickerLines.slice(0, 20).join('  •  ');
  const tickerDoubled = tickerText + '  •  ' + tickerText; // seamless wrap
```

If `CHRIS_BIKE_QUIPS` doesn't exist in this file's scope, grep for it with `grep -n "CHRIS_BIKE_QUIPS" js/chal/off-the-chain.js` and adjust the import/reference. It's already referenced inside the function at line 1154 so it's in scope.

- [ ] **Step 3: Insert the ticker and RPM gauge into the HTML**

Modify the sticky status bar HTML (currently around line 1431). The existing block is:

```js
  html += `<div style="display:flex;gap:16px;justify-content:center;font-size:12px;font-weight:700;letter-spacing:1px;position:sticky;top:0;z-index:3;padding:8px;margin-bottom:12px;background:#1a1008">
    <span style="color:#ff6b00">RACING: <span id="mx-racing-${stateKey}" data-initial="${initialRacing}" style="color:#ff6b00">${initialRacing}</span></span>
    <span style="color:#ff3333">WRECKED: <span id="mx-wrecked-${stateKey}" style="color:#ff3333">0</span></span>
    <span style="color:#ffd700">FINISHED: <span id="mx-finished-${stateKey}" style="color:#ffd700">0</span></span>
  </div>`;
```

Replace it with:

```js
  // Ticker strip
  html += `<div class="mx-ticker"><div class="mx-ticker-inner" id="mx-ticker-inner-${stateKey}">${tickerDoubled}</div></div>`;

  // Sticky status bar with RPM gauge
  html += `<div style="display:flex;gap:16px;align-items:center;justify-content:center;font-size:12px;font-weight:700;letter-spacing:1px;position:sticky;top:0;z-index:3;padding:8px;margin-bottom:12px;background:#1a1008">
    <div class="mx-rpm" title="RPM">
      <div class="mx-rpm-dial"></div>
      <div class="mx-rpm-needle" id="mx-rpm-needle-${stateKey}"></div>
      <div class="mx-rpm-label">RPM</div>
    </div>
    <span style="color:#ff6b00">RACING: <span id="mx-racing-${stateKey}" data-initial="${initialRacing}" style="color:#ff6b00">${initialRacing}</span></span>
    <span style="color:#ff3333">WRECKED: <span id="mx-wrecked-${stateKey}" style="color:#ff3333">0</span></span>
    <span style="color:#ffd700">FINISHED: <span id="mx-finished-${stateKey}" style="color:#ffd700">0</span></span>
  </div>`;
```

- [ ] **Step 4: Reload and verify**

Reload the simulator. Trigger the off-the-chain VP. Confirm:
1. A yellow-on-dark scrolling ticker band appears below the checkered header with Chris quips flowing right-to-left continuously.
2. A small semi-circular gauge with a red needle appears in the sticky status bar (left of RACING counter).
3. Clicking "Next Lap" sweeps the needle up toward redline and back.
4. Browser console has no errors.

- [ ] **Step 5: Commit**

```bash
git add js/chal/off-the-chain.js
git commit -m "feat(off-chain): add scrolling Chris ticker + RPM gauge chrome"
```

---

## Task 4: Build phase — animated quality fill + weld sparks + name stamp

**Files:**
- Modify: `js/chal/off-the-chain.js` — the per-bike card generation loop (~lines 1048–1087)

- [ ] **Step 1: Rewrite the bike-card HTML**

Locate the `br.activePlayers.forEach(name => {` loop inside the build phase (around line 1048). Replace the entire `steps.push({ type: 'grid-bike', ... })` block with:

```js
    // Pre-compute a random spark pattern per bike (4 sparks with random x/y offsets)
    const sparks = [0,1,2,3].map(i => ({
      x: (Math.random() * 60 - 30).toFixed(0),
      y: (Math.random() * 30 - 15).toFixed(0),
      delay: (150 + i * 150).toFixed(0),
      left: (20 + Math.random() * 60).toFixed(0),
    }));
    const sparkHtml = sparks.map(s =>
      `<div class="mx-weld-spark" style="left:${s.left}%;top:0;--sx:${s.x}px;--sy:${s.y}px;--spark-delay:${s.delay}ms"></div>`
    ).join('');

    steps.push({
      type: 'grid-bike',
      html: `
        <div class="mx-card" style="display:flex;align-items:center;gap:12px${isBest ? ';border-color:rgba(0,200,100,0.3)' : isWorst ? ';border-color:rgba(255,51,51,0.3)' : ''}">
          ${rpPortrait(name, 'sm')}
          <div style="flex:1">
            <div style="font-size:13px;color:#cdd9e5;font-weight:600">${name}${tag}</div>
            <div style="font-size:11px;color:#ff6b00;margin-top:2px"><span class="mx-stamp" style="font-size:10px;padding:2px 8px;color:#ff6b00;border-color:#ff6b00">${bikeName}</span></div>
            <div class="mx-quality-bar" style="position:relative">
              <div class="mx-quality-fill" style="width:${qPct}%;background:${qColor};transition:width 0.9s cubic-bezier(0.3,0.8,0.3,1)"></div>
              <div class="mx-spark-field" style="position:absolute;top:-6px;left:0;right:0;height:0">${sparkHtml}</div>
            </div>
            <div style="font-size:9px;color:${qColor};margin-top:2px;letter-spacing:1px">${qLabel} (${q.toFixed(1)})</div>
            ${evtHtml}
          </div>
        </div>
        ${quip}
      `
    });
```

The fill transition triggers automatically when the step is made visible because the element goes from `display:none` → visible and the `width:` value is already in the style. The browser treats this as a style change, so the `transition` property applies. Weld-sparks fire via their keyframe animation on mount.

- [ ] **Step 2: Reload and verify**

Reload, trigger the challenge. In the Build phase:
1. Each bike name appears in a stamped-in orange nameplate box.
2. Click each bike card reveal — the quality bar should visibly fill from 0 (or at least animate) and 4 yellow sparks should pop from above the bar.
3. No console errors.

**If bars don't animate:** the browser may already render the element at its target width before display becomes visible. Verify by checking that the `transition` attribute is present in the rendered HTML. If still no animation, use a two-frame approach: render the bar at `width:0` initially, then use a `requestAnimationFrame` in `_mxReveal` to set the target width after the element becomes visible. Document this fix if applied.

- [ ] **Step 3: Commit**

```bash
git add js/chal/off-the-chain.js
git commit -m "feat(off-chain): animate build-phase quality fill with weld sparks"
```

---

## Task 5: Swap reveal — slot-machine reel

**Files:**
- Modify: `js/chal/off-the-chain.js` — the swap assignments loop (~lines 1105–1123)

- [ ] **Step 1: Rewrite each swap-assign step**

Locate `Object.entries(assignments).forEach(([rider, bikeOwner]) => {` (around line 1105). Replace the `steps.push({ type: 'swap-assign', ... })` block with:

```js
    const ownerIdx = br.activePlayers.indexOf(bikeOwner);
    const totalRiders = br.activePlayers.length;
    // Reel shows all riders in original order; we translate so the winning name lands centered
    // Strip items are 28px tall; we want the chosen item in the window (which is also 28px)
    // final translateY = -(ownerIdx * 28)
    const reelFinal = -(ownerIdx * 28);
    const reelStripItems = br.activePlayers.map(n =>
      `<div${n === bikeOwner ? ' style="color:#ffd700;font-weight:800"' : ''}>${n}</div>`
    ).join('');

    const quality = br.phase1.bikeQuality[bikeOwner] || 5;
    const stampLabel = quality >= 7 ? 'LUCKY!' : quality >= 5 ? 'DECENT!' : quality >= 3 ? 'UH OH' : 'DOOMED!';
    const stampColor = quality >= 7 ? '#00ff41' : quality >= 5 ? '#ffd700' : quality >= 3 ? '#ff6b00' : '#ff3333';

    steps.push({
      type: 'swap-assign',
      html: `
        <div class="mx-card" style="display:flex;align-items:center;gap:12px">
          ${rpPortrait(rider, 'sm')}
          <div style="flex:1">
            <div style="font-size:13px;color:#cdd9e5;font-weight:600">${rider} draws...</div>
            <div class="mx-reel" style="margin-top:6px">
              <div class="mx-reel-window"></div>
              <div class="mx-reel-strip" style="--reel-final:${reelFinal}px">${reelStripItems}</div>
            </div>
            <div style="font-size:10px;color:#8b949e;margin-top:4px">bike: "${br.phase1.bikeNames[bikeOwner] || '???'}"</div>
          </div>
          <div style="text-align:right">
            <div class="mx-stamp" style="color:${stampColor};border-color:${stampColor};animation-delay:1s">${stampLabel}</div>
          </div>
        </div>
      `
    });
```

- [ ] **Step 2: Use a 4x-repeated strip so the window is never empty during spin**

The reel has a fixed window height of 28px and each strip item is 28px tall. If the strip only contains each active player once, translating it too far would show empty space. Duplicate the content 4x so the strip has enough height for the spin.

Replace the first version's `reelStripItems` and `reelFinal` from Step 1 with:

```js
    const reelStripItems = Array(4).fill(br.activePlayers.map(n =>
      `<div${n === bikeOwner ? ' style="color:#ffd700;font-weight:800"' : ''}>${n}</div>`
    ).join('')).join('');
    // Strip now has 4 copies of the player list. Target the chosen name in copy #4 (0-indexed).
    const reelFinal = -((3 * totalRiders + ownerIdx) * 28);
    const reelStart = 0; // spin downward from the top of the strip
```

And update the strip element to pass both vars:

```js
    <div class="mx-reel-strip" style="--reel-start:${reelStart}px;--reel-final:${reelFinal}px">${reelStripItems}</div>
```

The CSS keyframe `mx-reel-spin` (already committed in Task 1) reads both `--reel-start` and `--reel-final` with `0px` defaults, so this works as a drop-in.

- [ ] **Step 3: Reload and verify**

Reload, trigger challenge, reach the Swap phase. For each swap reveal:
1. A reel card shows all rider names cycling top-to-bottom in a small window.
2. The reel slams to a stop with the chosen bike owner's name highlighted in gold.
3. A stamp (LUCKY! / DECENT! / UH OH / DOOMED!) slams across on the right after ~1 second.
4. No console errors.

- [ ] **Step 4: Commit**

```bash
git add js/chal/off-the-chain.js
git commit -m "feat(off-chain): slot-machine reel for swap reveal"
```

---

## Task 6: Qualifying lap — position badge

**Files:**
- Modify: `js/chal/off-the-chain.js` — race1-result step generation (~lines 1149–1186)

- [ ] **Step 1: Add position badge to each rider card**

Inside the `sortedRiders.forEach(name => {` loop, track the rider's finish position (which is just its index in sortedRiders + 1). Modify the step HTML to include a big #N badge in the top-right corner.

Locate the existing step push:

```js
    steps.push({
      type: 'race1-result',
      racingDelta: finished ? 0 : -1,
      wreckedDelta: finished ? 0 : 1,
      html: `
        <div class="mx-card mx-speed-lines" ...>
```

Just before it, compute:

```js
    const position = sortedRiders.indexOf(name) + 1;
    const posColor = position === 1 ? '#ffd700' : position <= 3 ? '#00ff41' : '#ff6b00';
    const posBadge = `<div style="position:absolute;top:8px;right:10px;font-family:'Impact','Arial Narrow',sans-serif;font-size:22px;font-weight:900;color:${posColor};letter-spacing:1px;text-shadow:0 0 8px ${posColor}55;z-index:3" class="mx-count-flash">#${position}</div>`;
```

Modify the outer card to be `position:relative` and inject `posBadge` as its first child. The existing HTML is:

```js
      html: `
        <div class="mx-card mx-speed-lines" style="${!finished ? 'border-color:rgba(255,51,51,0.3);background:rgba(255,51,51,0.04)' : 'border-color:rgba(0,200,100,0.15)'}">
          <div style="display:flex;align-items:center;gap:12px">
            ...
```

Replace with:

```js
      html: `
        <div class="mx-card mx-speed-lines" style="position:relative;${!finished ? 'border-color:rgba(255,51,51,0.3);background:rgba(255,51,51,0.04)' : 'border-color:rgba(0,200,100,0.15)'}">
          ${posBadge}
          <div style="display:flex;align-items:center;gap:12px;padding-right:32px">
            ...
```

(The `padding-right:32px` on the inner flex prevents the portrait/score content from sitting under the badge.)

- [ ] **Step 2: Reload and verify**

Reload, reach qualifying lap. Each rider card should show a large colored `#1`, `#2`, etc. badge in the top-right. Gold for #1, green for #2-3, orange for the rest.

- [ ] **Step 3: Commit**

```bash
git add js/chal/off-the-chain.js
git commit -m "feat(off-chain): position badges on qualifying lap results"
```

---

## Task 7: Obstacle gauntlet — backdrops + HP drain + camera shake

**Files:**
- Modify: `js/chal/off-the-chain.js` — obstacle section (~lines 1240–1307)

- [ ] **Step 1: Wrap each obstacle in a themed backdrop**

Locate the `for (let oi = 0; oi < maxObstacles; oi++) {` loop (around line 1240). Currently it pushes an `obstacle-name` step, then per-racer `obstacle-result` steps. We need to wrap the entire obstacle group — but steps are revealed one at a time, so we can't literally wrap all of them in a single DOM element. Instead, apply the backdrop class to the obstacle-name step and use it as a visual section marker.

Modify the obstacle-name step push to include the backdrop class based on obstacle index:

```js
    const bgClass = oi === 0 ? 'mx-obstacle-bg--mines' : oi === 1 ? 'mx-obstacle-bg--oil' : 'mx-obstacle-bg--piranhas';
    const obsEmoji = oi === 0 ? '💣' : oi === 1 ? '🛢️' : '🐟';
    steps.push({
      type: 'obstacle-name',
      html: `<div class="mx-obstacle-bg ${bgClass}">
        <div class="mx-hazard" style="font-size:12px;color:#ffd700;font-weight:700;letter-spacing:2px;text-align:center;padding:8px 0;margin:0;background:transparent;border:0">
          ⚠ ${obstacleNames[oi] || 'OBSTACLE ' + (oi + 1)} ⚠
        </div>
      </div>`
    });
```

- [ ] **Step 2: Set `cameraShake: true` on destroyed obstacle results**

Still inside the same obstacle loop, locate the existing step push for obstacle-result:

```js
      steps.push({
        type: 'obstacle-result',
        racingDelta: wasDestroyed ? -1 : 0,
        wreckedDelta: wasDestroyed ? 1 : 0,
        html: cardContent + destroyQuip
      });
```

Add the `cameraShake` field:

```js
      steps.push({
        type: 'obstacle-result',
        racingDelta: wasDestroyed ? -1 : 0,
        wreckedDelta: wasDestroyed ? 1 : 0,
        cameraShake: wasDestroyed,
        html: cardContent + destroyQuip
      });
```

- [ ] **Step 3: Add HP drain flash to the HP bar**

In the `cardContent` template string (defined just above the steps.push), the current HP bar markup is:

```js
      ${!wasDestroyed ? `<div style="display:flex;align-items:center;gap:6px;margin-top:3px"><div class="mx-hp-bar" style="flex:1"><div class="mx-hp-fill" style="width:${hpPct}%;background:${hpColor}"></div></div><span style="font-size:9px;color:${hpColor};font-weight:700;min-width:35px">${hpAfter}/${hpMax}</span></div>` : ''}
```

Replace with (adds a flashing red overlay that animates on reveal):

```js
      ${!wasDestroyed ? `<div style="display:flex;align-items:center;gap:6px;margin-top:3px"><div class="mx-hp-bar" style="flex:1"><div class="mx-hp-fill" style="width:${hpPct}%;background:${hpColor};transition:width 0.6s ease-out"></div>${damage ? '<div class="mx-hp-drain-flash"></div>' : ''}</div><span style="font-size:9px;color:${hpColor};font-weight:700;min-width:35px">${hpAfter}/${hpMax}</span></div>` : ''}
```

The drain flash only renders if the racer took damage on this obstacle. Width transition makes the HP bar visibly shrink on reveal.

- [ ] **Step 4: Reload and verify**

Reload, trigger off-the-chain, reach the obstacle gauntlet:
1. Mine obstacle section: pulsing red-dot backdrop behind the obstacle label.
2. Oil slick: shimmering rainbow backdrop.
3. Piranhas: dark blue water with jagged teeth at the bottom.
4. When a racer takes damage, HP bar visibly drains with a brief red flash.
5. When a racer is DESTROYED (catastrophic breakdown), the whole page briefly shakes.
6. No console errors.

- [ ] **Step 5: Commit**

```bash
git add js/chal/off-the-chain.js
git commit -m "feat(off-chain): obstacle backdrops, HP drain, camera shake on destruction"
```

---

## Task 8: Finish line — curtain reveal + podium

**Files:**
- Modify: `js/chal/off-the-chain.js` — finish-line section (~lines 1309–1375)

- [ ] **Step 1: Replace the winner step with a curtain reveal**

Locate the `steps.push({ type: 'finish-winner', ... })` block (around line 1324). Replace with two steps — curtain and podium:

```js
    // Determine photo finish: compare top-2 finishers' last-obstacle HP
    let photoFinish = false;
    if (finishRanking.length >= 2) {
      const top1 = finishRanking[0];
      const top2 = finishRanking[1];
      const top1Obs = (obstacleResults[top1]?.obstacles || []);
      const top2Obs = (obstacleResults[top2]?.obstacles || []);
      const hp1 = top1Obs[top1Obs.length - 1]?.hpAfter;
      const hp2 = top2Obs[top2Obs.length - 1]?.hpAfter;
      if (typeof hp1 === 'number' && typeof hp2 === 'number' && Math.abs(hp1 - hp2) <= 10) {
        photoFinish = true;
      }
    }

    // Step A: Curtain reveal
    steps.push({
      type: 'finish-curtain',
      finishedDelta: 1,
      immuneDelta: 1,
      racingDelta: -1,
      html: `
        ${winQuip}
        <div class="mx-curtain-wrap">
          <div class="mx-curtain-spotlight">
            ${photoFinish ? '<div class="mx-photo-finish">📸 PHOTO FINISH 📸</div>' : ''}
            ${rpPortrait(winner, 'xl')}
            <div style="font-size:18px;color:#ffd700;font-weight:900;margin-top:10px;letter-spacing:2px">${winner}</div>
            <div style="font-size:12px;color:#ff6b00;margin-top:4px;letter-spacing:3px">FIRST ACROSS THE LINE</div>
            <div style="margin-top:10px"><span class="mx-status mx-immune" style="font-size:12px;padding:4px 14px">IMMUNITY WINNER</span></div>
          </div>
        </div>
      `
    });

    // Step B: Podium rise (top 3, or top 2 if only 2 finished, or skip if only 1)
    if (finishRanking.length >= 2) {
      const podiumSlots = [];
      if (finishRanking[1]) podiumSlots.push({ rank: 2, name: finishRanking[1], medal: '🥈' });
      if (finishRanking[0]) podiumSlots.push({ rank: 1, name: finishRanking[0], medal: '🥇' });
      if (finishRanking[2]) podiumSlots.push({ rank: 3, name: finishRanking[2], medal: '🥉' });

      const podiumHtml = podiumSlots.map(slot => `
        <div class="mx-podium-plinth" data-rank="${slot.rank}">
          <div style="margin-bottom:6px">${rpPortrait(slot.name, 'sm')}</div>
          <div style="font-size:12px;color:#cdd9e5;font-weight:700;margin-bottom:4px">${slot.name}</div>
          <div class="mx-podium-block">${slot.medal}</div>
        </div>
      `).join('');

      steps.push({
        type: 'finish-podium',
        html: `<div class="mx-podium">${podiumHtml}</div>`
      });
    }
```

Do NOT remove the subsequent `finishRanking.slice(1).forEach((name, i) => { ... })` block — the remaining finishers (#4+ or whoever isn't on the podium) still get their per-rank cards below the podium. But the podium already shows #2 and #3, so adjust that loop to skip already-shown ranks:

```js
    // Rest of ranking (#4+, since podium covers top 3)
    finishRanking.slice(3).forEach((name, i) => {
      const isLast = i === finishRanking.length - 4;
      ...
```

Actually wait — keep the original `finishRanking.slice(1)` if you want every non-winner listed as a card too (podium is decorative on top). That duplicates #2 and #3 which is ugly. Switch to `finishRanking.slice(3)` so cards only list #4 onward.

And recompute `isLast` correctly:

```js
    finishRanking.slice(3).forEach((name, i) => {
      const isLast = i === finishRanking.slice(3).length - 1 && name === finishRanking[finishRanking.length - 1];
      steps.push({
        type: 'finish-place',
        racingDelta: -1,
        finishedDelta: 1,
        html: `
          <div class="mx-card" style="display:flex;align-items:center;gap:12px;${isLast ? 'border-color:rgba(255,51,51,0.4);background:rgba(255,51,51,0.04)' : ''}">
            ${rpPortrait(name, 'sm')}
            <div style="flex:1">
              <div style="font-size:13px;color:#cdd9e5;font-weight:600">${name}</div>
              <div style="font-size:10px;color:${isLast ? '#ff3333' : '#ff6b00'};margin-top:2px">${isLast ? 'LAST PLACE' : `Finished #${finishRanking.indexOf(name) + 1}`}</div>
            </div>
            <span class="mx-status ${isLast ? 'mx-last' : 'mx-safe'}">${isLast ? 'LAST' : `#${finishRanking.indexOf(name) + 1}`}</span>
          </div>
        `
      });
    });
```

- [ ] **Step 2: Reload and verify**

Reload, trigger challenge, clickthrough to finish line:
1. Click "Next Lap" on the finish step: two checkered-flag panels slide outward, revealing the winner portrait in a gold glow with name + IMMUNITY WINNER.
2. If the top-2 HP was within 10 points, a dashed gold PHOTO FINISH label appears above.
3. Next click reveals podium: winner on center-tall plinth, #2 on left-medium, #3 on right-short, all rising from the bottom.
4. Subsequent reveals show #4+ finishers in the original card style (not duplicating podium names).
5. With only 2 finishers: podium shows #1 + #2. With only 1: podium is skipped entirely.
6. No console errors.

- [ ] **Step 3: Commit**

```bash
git add js/chal/off-the-chain.js
git commit -m "feat(off-chain): curtain reveal + podium for finish line"
```

---

## Task 9: Elimination aftermath — debris settle + field-reporter mic

**Files:**
- Modify: `js/chal/off-the-chain.js` — aftermath section (~lines 1378–1394)

- [ ] **Step 1: Wrap aftermath beats and add mic prefix**

Locate the aftermath loop:

```js
    br.phase4.eliminationReaction.beats.forEach(beat => {
      steps.push({
        type: 'aftermath-beat',
        html: `
          <div class="mx-card" style="border-color:rgba(255,107,0,0.2)">
            <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${beat}</div>
          </div>
        `
      });
    });
```

Replace with:

```js
    br.phase4.eliminationReaction.beats.forEach(beat => {
      steps.push({
        type: 'aftermath-beat',
        html: `
          <div class="mx-debris-wrap">
            <div class="mx-card" style="border-color:rgba(255,107,0,0.2);margin-bottom:0">
              <div class="mx-field-mic" style="font-size:12px;color:#cdd9e5;line-height:1.6">${beat}</div>
            </div>
          </div>
        `
      });
    });
```

- [ ] **Step 2: Reload and verify**

Reload, trigger challenge, reach the aftermath section. Each beat card should:
1. Fade in from slightly above (debris-settle animation).
2. Have a subtle orange haze/tint behind it.
3. Start with a 🎤 microphone icon before the beat text.

- [ ] **Step 3: Commit**

```bash
git add js/chal/off-the-chain.js
git commit -m "feat(off-chain): debris-settle aftermath with field-reporter mic"
```

---

## Task 10: Wreckage report — evidence board with connecting lines

**Files:**
- Modify: `js/chal/off-the-chain.js` — debrief step (~lines 1397–1420) and `_mxReveal` (for line drawing)

- [ ] **Step 1: Rebuild the debrief step as an evidence board**

Locate the `let debriefHtml = ` block (around line 1398). Replace the entire debrief assembly with:

```js
  // Identify sabotage pairs from build events for connecting lines
  const sabotagePairs = [];
  (br.phase1.buildEvents || []).forEach(evt => {
    if (evt.id === 'sabotage' || evt.id === 'parts-theft') {
      const actor = evt.players?.find(p => p !== evt.effect?.target);
      const victim = evt.effect?.target;
      if (actor && victim) sabotagePairs.push({ actor, victim });
    }
  });

  let debriefHtml = `<div class="mx-sector">WRECKAGE REPORT — FINAL STATUS</div>`;
  debriefHtml += `<div class="mx-evidence-board" id="mx-evidence-${stateKey}" data-sabotage-pairs='${JSON.stringify(sabotagePairs).replace(/'/g, "&#39;")}'>
    <svg class="mx-evidence-svg" id="mx-evidence-svg-${stateKey}"></svg>
    <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center">`;
  br.activePlayers.forEach(name => {
    const badge = br.badges[name];
    const isImmune = badge === 'bikeRaceImmune';
    const isWrecked = (br.phase3.destroyed || []).includes(name);
    const isLast = badge === 'bikeRaceLast';
    const statusClass = isImmune ? 'mx-immune' : isWrecked ? 'mx-wrecked' : isLast ? 'mx-last' : badge === 'bikeRaceBuilder' ? 'mx-safe' : badge === 'bikeRaceSaboteur' ? 'mx-wrecked' : badge === 'bikeRaceClutch' ? 'mx-safe' : 'mx-racing';
    const statusText = isImmune ? 'IMMUNE' : isWrecked ? 'WRECKED' : isLast ? 'LAST' : badge === 'bikeRaceBuilder' ? 'BEST BUILD' : badge === 'bikeRaceSaboteur' ? 'SABOTEUR' : badge === 'bikeRaceClutch' ? 'CLUTCH' : 'FINISHED';
    debriefHtml += `
      <div class="mx-evidence-pin" data-player="${name}" style="text-align:center;width:80px;padding-top:8px">
        ${rpPortrait(name, 'sm')}
        <span class="mx-status ${statusClass}" style="margin-top:4px;display:block;font-size:9px">${statusText}</span>
      </div>`;
  });
  debriefHtml += `</div>`;

  if (finishRanking.length) {
    debriefHtml += `<div style="text-align:center;margin-top:16px">
      <span class="mx-stamp" style="color:#ffd700;border-color:#ffd700;animation-delay:0.8s">CASE CLOSED</span>
    </div>`;
  }

  debriefHtml += `</div>`;
  steps.push({ type: 'debrief', html: debriefHtml });
```

- [ ] **Step 2: Add line-drawing logic to `_mxReveal`**

The SVG lines need to be drawn after the debrief element is visible (so `getBoundingClientRect` returns non-zero values). Add this block to `_mxReveal`, after the existing overdrive hooks and before the status tracker update:

```js
  // Evidence-board line drawing (runs only when the revealed step is the debrief)
  if (el && el.querySelector(`#mx-evidence-${stateKey}`)) {
    requestAnimationFrame(() => {
      const board = el.querySelector(`#mx-evidence-${stateKey}`);
      const svg = el.querySelector(`#mx-evidence-svg-${stateKey}`);
      if (!board || !svg) return;
      let pairs = [];
      try { pairs = JSON.parse(board.dataset.sabotagePairs || '[]'); } catch (e) {}
      const boardRect = board.getBoundingClientRect();
      svg.setAttribute('width', boardRect.width);
      svg.setAttribute('height', boardRect.height);
      svg.style.width = boardRect.width + 'px';
      svg.style.height = boardRect.height + 'px';
      svg.innerHTML = '';
      pairs.forEach(({ actor, victim }) => {
        const aEl = board.querySelector(`[data-player="${actor}"]`);
        const vEl = board.querySelector(`[data-player="${victim}"]`);
        if (!aEl || !vEl) return;
        const aR = aEl.getBoundingClientRect();
        const vR = vEl.getBoundingClientRect();
        const ax = aR.left - boardRect.left + aR.width / 2;
        const ay = aR.top - boardRect.top + 12;
        const vx = vR.left - boardRect.left + vR.width / 2;
        const vy = vR.top - boardRect.top + 12;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', ax); line.setAttribute('y1', ay);
        line.setAttribute('x2', vx); line.setAttribute('y2', vy);
        line.setAttribute('class', 'mx-evidence-line');
        svg.appendChild(line);
      });
    });
  }
```

- [ ] **Step 3: Reload and verify**

Reload, trigger challenge, click through to the final debrief:
1. The final report card renders on a tan cork-board background with portraits "pinned" via small red pushpins on top.
2. If any sabotage events occurred during the build phase, dashed red lines draw from saboteur → victim portraits (animated stroke-draw).
3. A "CASE CLOSED" stamp appears at the bottom, slamming in with a slight delay.
4. No console errors. Lines scale correctly if you resize the browser (lines redraw on the reveal only; resize after reveal doesn't redraw them — acceptable).

Edge case: if no sabotage events occurred, no lines draw (only pinned portraits + CASE CLOSED stamp). Verify by running a clean season with no build sabotage.

- [ ] **Step 4: Commit**

```bash
git add js/chal/off-the-chain.js
git commit -m "feat(off-chain): evidence-board wreckage report with sabotage lines"
```

---

## Task 11: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run a complete off-the-chain VP end-to-end**

Reload simulator. Trigger the off-the-chain challenge. Click every single "Next Lap" through all phases. Verify:

1. **Ticker** scrolls continuously throughout, never freezes.
2. **RPM needle** revs on every single click.
3. **Build phase**: every bike card animates (quality fill + sparks + stamped name).
4. **Swap phase**: each reel spins and lands on the correct owner, stamp appears.
5. **Qualifying**: every rider has a #N position badge.
6. **Obstacles**: each obstacle section has its themed backdrop. HP bars drain visibly. Page shakes on catastrophic breakdowns.
7. **Finish line**: curtain opens on the winner. Podium rises. PHOTO FINISH appears only when HP margin was tight.
8. **Aftermath**: beats have mic prefix and debris-settle fade.
9. **Wreckage report**: cork-board, pins, sabotage lines draw correctly, CASE CLOSED stamp.
10. **"Reveal all"**: clicking the tiny "Reveal all" link snaps every step visible and final counts are correct.

- [ ] **Step 2: Run both tribal paths**

Trigger once with `br.isSuddenDeath === true` (configure sudden-death twist in the season setup) — verify the last-place fate text says "AUTOMATICALLY ELIMINATED".

Trigger once with `br.isSuddenDeath === false` (normal tribal) — verify the fate text says "a massive target heading into tribal council" and the normal tribal flow follows.

- [ ] **Step 3: Console smoke test**

With DevTools console open, click through an entire VP. Confirm no errors, no warnings related to missing elements, no layout-thrash warnings.

- [ ] **Step 4: Commit (if any fixes were needed)**

If the verification pass surfaces bugs, fix them and commit with `fix(off-chain): <description>`. If clean, no commit needed.

- [ ] **Step 5: Update memory**

Update `C:\Users\yanna\.claude\projects\C--Users-yanna-OneDrive-Documents-GitHub-dc-franchise-db\memory\project_off_the_chain.md` to note the overdrive pass was completed on 2026-04-16, with a one-line summary of what the overdrive added.

---

## Files touched at completion

- `js/chal/off-the-chain.js` — ~300 new lines of CSS in `MX_STYLES`, reveal-engine hooks in `_mxReveal`, rewrites of 8 step-generation sections in `rpBuildOffTheChain`.

## Files NOT touched

- No changes to any other `js/chal/*.js` challenge files.
- No changes to `js/core.js`, `js/episode.js`, `js/twists.js`, `js/vp-screens.js`.
- No changes to `franchise_roster.json` or any asset files.
- No changes to save-state serialization, episode history patching, or text backlog.
