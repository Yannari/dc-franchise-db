# Vote Reveal Overdrive — "Live Results Night" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the tribal council vote reveal into a reality-TV broadcast experience with a full-width tally leaderboard, multi-beat reveal animations, and threshold reactions.

**Architecture:** The tally moves from a sidebar to a stacked leaderboard above vote cards. Each click triggers a 4-beat sequence (spotlight → flip → vote flies → tally reacts). Threshold events (tie, majority-1, majority) fire layered CSS reactions. All changes are in `simulator.html` — CSS additions near line 1435, HTML builder changes in `rpBuildVotes` (~line 63979), and JS changes in `tvRevealNext`/`_tvUpdateTally` (~line 65216).

**Tech Stack:** CSS keyframes, CSS transitions, vanilla JS (no libraries). Single file: `simulator.html`.

---

### Task 1: New CSS — Tally Leaderboard Restyling

**Files:**
- Modify: `simulator.html:1435-1464` (CSS section `/* ── Interactive Votes screen ── */`)

- [ ] **Step 1: Replace `.tv-wrap` from side-by-side to stacked layout**

Find the existing CSS block at line 1436:

```css
.tv-wrap { display:flex; gap:14px; align-items:flex-start; margin-bottom:16px; }
.tv-reveal-panel { flex:3; display:flex; flex-direction:column; gap:8px; }
.tv-tally-panel { flex:2; background:#0d1117; border:1px solid #21262d; border-radius:12px; padding:14px 12px; position:sticky; top:8px; }
```

Replace with:

```css
.tv-wrap { display:flex; flex-direction:column; gap:18px; margin-bottom:16px; }
.tv-reveal-panel { display:flex; flex-direction:column; gap:8px; }
.tv-tally-panel { background:#0a0e14; border:1px solid #1a1f28; border-radius:14px; padding:16px 18px; }
```

- [ ] **Step 2: Replace tally header, row, bar, and count styles**

Find the existing block at lines 1439-1447:

```css
.tv-tally-header { font-size:9px; font-weight:800; letter-spacing:2.5px; text-transform:uppercase; color:#30363d; margin-bottom:12px; }
.tv-tally-row { display:flex; align-items:center; gap:7px; padding:5px 0; border-bottom:1px solid #161b22; transition:background 0.2s; }
.tv-tally-row:last-child { border-bottom:none; }
.tv-tally-pname { font-size:12px; font-weight:700; color:#6e7681; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tv-tally-bar-bg { width:48px; height:3px; background:#21262d; border-radius:2px; overflow:hidden; flex-shrink:0; }
.tv-tally-bar { height:100%; border-radius:2px; background:#30363d; transition:width 0.35s; }
.tv-tally-row.tv-tally-leading .tv-tally-bar { background:#da3633; }
.tv-tally-count { font-size:18px; font-weight:800; min-width:20px; text-align:right; color:#30363d; transition:color 0.3s; }
.tv-tally-row.tv-tally-leading .tv-tally-count { color:#f85149; }
```

Replace with:

```css
.tv-tally-header { font-size:10px; font-weight:800; letter-spacing:3px; text-transform:uppercase; color:#e3b341; margin-bottom:14px; }
.tv-tally-row { display:flex; align-items:center; gap:10px; padding:8px 10px; border-bottom:1px solid #111820; border-radius:8px; transition:background 0.3s,box-shadow 0.3s,opacity 0.4s,transform 0.4s; transform:translateX(-20px); opacity:0; }
.tv-tally-row.tv-tally-visible { transform:translateX(0); opacity:1; }
.tv-tally-row:last-child { border-bottom:none; }
.tv-tally-pname { font-size:13px; font-weight:700; color:#8b949e; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tv-tally-bar-bg { flex:2; height:14px; background:#161b22; border-radius:7px; overflow:hidden; flex-shrink:0; }
.tv-tally-bar { height:100%; border-radius:7px; background:#30363d; transition:width 0.4s cubic-bezier(0.34,1.56,0.64,1); }
.tv-tally-row.tv-tally-leading .tv-tally-bar { background:#da3633; }
.tv-tally-row.tv-tally-leading { background:rgba(218,54,51,0.06); box-shadow:0 0 0 1px rgba(218,54,51,0.2); }
.tv-tally-count { font-size:28px; font-weight:800; min-width:28px; text-align:right; color:#30363d; transition:color 0.3s,transform 0.15s; }
.tv-tally-row.tv-tally-leading .tv-tally-count { color:#f85149; }
.tv-tally-count.tv-count-bounce { animation:tvCountBounce 0.3s ease-out; }
@keyframes tvCountBounce { 0% { transform:scale(1); } 40% { transform:scale(1.3); } 100% { transform:scale(1); } }
```

- [ ] **Step 3: Add torch icon CSS**

Insert after the tally count styles (after the `tvCountBounce` keyframes):

```css
.tv-tally-torch { width:12px; height:20px; position:relative; flex-shrink:0; }
.tv-tally-torch-flame { position:absolute; bottom:2px; left:50%; transform:translateX(-50%); width:6px; height:6px; border-radius:50% 50% 50% 50% / 60% 60% 40% 40%; background:#1a1f28; box-shadow:none; transition:width 0.4s,height 0.4s,background 0.4s,box-shadow 0.4s; }
.tv-tally-torch-flame.tv-flame-low { width:8px; height:10px; background:#c45a1a; box-shadow:0 0 4px #c45a1a,0 0 8px rgba(232,135,58,0.4); animation:torchFlicker 3.5s ease-in-out infinite; }
.tv-tally-torch-flame.tv-flame-high { width:10px; height:16px; background:#e8873a; box-shadow:0 0 6px #e8873a,0 0 12px rgba(240,192,64,0.5),0 0 20px rgba(196,90,26,0.3); animation:torchFlicker 2s ease-in-out infinite; }
.tv-tally-torch-flame.tv-flame-max { width:12px; height:18px; background:#f0c040; box-shadow:0 0 8px #f0c040,0 0 16px rgba(232,135,58,0.6),0 0 24px rgba(240,192,64,0.4); animation:torchFlicker 1.2s ease-in-out infinite; }
.tv-tally-torch-flame.tv-flame-out { width:6px; height:6px; background:#1a1f28; box-shadow:none; animation:none; transition:all 0.5s; }
```

- [ ] **Step 4: Add tied-pulse animation**

Insert after torch CSS:

```css
.tv-tally-row.tv-tally-tied { animation:tvTiedPulse 2s ease-in-out infinite; }
@keyframes tvTiedPulse { 0%,100% { box-shadow:0 0 0 1px rgba(218,54,51,0.3); } 50% { box-shadow:0 0 0 1px rgba(210,153,34,0.4); } }
.tv-tally-tied-badge { font-size:9px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:#d29922; text-align:center; padding:4px 0; }
```

- [ ] **Step 5: Add spotlight and threshold CSS**

Insert after tied CSS:

```css
.tv-spotlight-dim { opacity:0.7; transition:opacity 0.2s; }
.tv-spotlight-active { position:relative; z-index:2; border-color:rgba(200,220,255,0.3) !important; box-shadow:0 0 12px rgba(200,220,255,0.08); transition:border-color 0.2s,box-shadow 0.2s; }
.tv-vote-fly { position:fixed; font-size:14px; font-weight:700; color:#f85149; opacity:0.6; pointer-events:none; z-index:100; filter:blur(0px); transition:none; }
.tv-threshold-banner { background:rgba(248,81,73,0.08); border:1px solid rgba(248,81,73,0.25); border-radius:8px; padding:6px 14px; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#f85149; text-align:center; animation:tvBannerIn 0.3s ease-out; }
@keyframes tvBannerIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
.tv-majority-flash { position:fixed; inset:0; background:rgba(248,81,73,0.12); pointer-events:none; z-index:200; animation:tvFlashOut 0.15s ease-out forwards; }
@keyframes tvFlashOut { to { opacity:0; } }
.tv-tally-row.tv-tally-eliminated { opacity:0.3; filter:grayscale(0.8); transition:opacity 0.5s,filter 0.5s; }
```

- [ ] **Step 6: Commit**

```bash
git add simulator.html
git commit -m "style: vote reveal overdrive — new tally leaderboard CSS, torch flames, threshold animations"
```

---

### Task 2: HTML Builder — Tally Leaderboard with Torches

**Files:**
- Modify: `simulator.html:64408-64443` (tally panel HTML in `rpBuildVotes`)

- [ ] **Step 1: Update the tally panel HTML generation**

Find the existing tally panel builder at lines 64408-64421:

```javascript
  html += `</div>`; // end tv-reveal-panel

  // Live tally panel
  const tallyNames = [...new Set(vlog.map(v => v.voted))].sort((a,b) => (votes[b]||0) - (votes[a]||0));
  html += `<div class="tv-tally-panel" id="tv-tally-${epNum}">
    <div class="tv-tally-header">Live Tally</div>`;
  tallyNames.forEach(name => {
    const slug = name.replace(/[^a-zA-Z0-9]/g, '');
    html += `<div class="tv-tally-row" data-name="${name}" style="opacity:0;transition:opacity 0.4s">
      ${rpPortrait(name)}
      <div class="tv-tally-pname">${name}</div>
      <div class="tv-tally-bar-bg"><div class="tv-tally-bar" id="tv-tb-${epNum}-${slug}" style="width:0%"></div></div>
      <div class="tv-tally-count" id="tv-tc-${epNum}-${slug}" data-count="0">—</div>
    </div>`;
  });
  html += `</div>`; // end tally panel
```

Replace with:

```javascript
  html += `</div>`; // end tv-reveal-panel

  html += `</div>`; // end tv-wrap (close early — tally moves above)

  // ── Threshold banner slot (inserted between tally and cards by JS) ──
  // Will be populated dynamically by tvRevealNext threshold logic

  // The tv-wrap is now just around the reveal panel. Tally is built separately above.
```

**Wait** — the layout change means the tally must come BEFORE the vote cards in the HTML. So we need to restructure the `rpBuildVotes` function to build the tally first, then wrap just the cards.

- [ ] **Step 2: Move tally panel HTML to render BEFORE the tv-wrap div**

Find the line at 64249-64251 where tv-wrap opens:

```javascript
  // ── Two-panel layout: vote cards left, live tally right ──
  html += `<div class="tv-wrap">
    <div class="tv-reveal-panel" id="tv-cards-${epNum}">`;
```

Replace with:

```javascript
  // ── Tally leaderboard (above vote cards) ──
  const tallyNames = [...new Set(vlog.map(v => v.voted))].sort((a,b) => (votes[b]||0) - (votes[a]||0));
  // Store total eligible voters for majority calculation
  const _eligibleVoters = vlog.filter(v => v.voter !== 'THE GAME' && v.voted && !v.voteBlocked && !v.teamSwapped && !v.sitdSacrificed).length;
  const _majorityThreshold = Math.ceil(_eligibleVoters / 2);
  html += `<div class="tv-tally-panel" id="tv-tally-${epNum}" data-majority="${_majorityThreshold}" data-eligible="${_eligibleVoters}">
    <div class="tv-tally-header">The Votes</div>`;
  tallyNames.forEach(name => {
    const slug = name.replace(/[^a-zA-Z0-9]/g, '');
    html += `<div class="tv-tally-row" data-name="${name}">
      <div class="tv-tally-torch"><div class="tv-tally-torch-flame" id="tv-tf-${epNum}-${slug}"></div></div>
      ${rpPortrait(name)}
      <div class="tv-tally-pname">${name}</div>
      <div class="tv-tally-bar-bg"><div class="tv-tally-bar" id="tv-tb-${epNum}-${slug}" style="width:0%"></div></div>
      <div class="tv-tally-count" id="tv-tc-${epNum}-${slug}" data-count="0">\u2014</div>
    </div>`;
  });
  html += `</div>`;
  // Threshold banner slot
  html += `<div id="tv-threshold-${epNum}" style="display:none"></div>`;
  // ── Vote cards ──
  html += `<div class="tv-reveal-panel" id="tv-cards-${epNum}">`;
```

- [ ] **Step 3: Remove the old tally panel HTML and fix the closing divs**

Find the old tally builder (which is now dead code after the cards, around lines 64406-64421):

```javascript
  html += `</div>`; // end tv-reveal-panel

  // Live tally panel
  const tallyNames = [...new Set(vlog.map(v => v.voted))].sort((a,b) => (votes[b]||0) - (votes[a]||0));
  html += `<div class="tv-tally-panel" id="tv-tally-${epNum}">
    <div class="tv-tally-header">Live Tally</div>`;
  tallyNames.forEach(name => {
    const slug = name.replace(/[^a-zA-Z0-9]/g, '');
    html += `<div class="tv-tally-row" data-name="${name}" style="opacity:0;transition:opacity 0.4s">
      ${rpPortrait(name)}
      <div class="tv-tally-pname">${name}</div>
      <div class="tv-tally-bar-bg"><div class="tv-tally-bar" id="tv-tb-${epNum}-${slug}" style="width:0%"></div></div>
      <div class="tv-tally-count" id="tv-tc-${epNum}-${slug}" data-count="0">—</div>
    </div>`;
  });
  html += `</div>`; // end tally panel
```

Replace with:

```javascript
  html += `</div>`; // end tv-reveal-panel (cards)
```

- [ ] **Step 4: Fix the closing tv-wrap div**

Find line 64443:

```javascript
  html += `</div>`; // end tv-wrap
```

Remove this line entirely (tv-wrap no longer exists as a container — tally and cards are siblings now).

- [ ] **Step 5: Update the revote tally panel to match new style**

Find the revote tally panel builder (lines 64424-64441):

```javascript
  // Second Live Tally for revote — hidden until revote cards start revealing
  if (revoteLog.length && !ep.sidFreshVote) {
    const rvTallyNames = [...new Set(revoteLog.map(v => v.voted))].sort((a,b) => {
      const rv = ep.revoteVotes || {};
      return (rv[b]||0) - (rv[a]||0);
    });
    html += `<div class="tv-tally-panel" id="tv-tally-rv-${epNum}" style="display:none;border-color:rgba(210,153,34,0.3)">
      <div class="tv-tally-header" style="color:#d29922">Live Tally #2</div>`;
    rvTallyNames.forEach(name => {
      const slug = name.replace(/[^a-zA-Z0-9]/g, '');
      html += `<div class="tv-tally-row" data-name="${name}" style="opacity:0;transition:opacity 0.4s">
        ${rpPortrait(name)}
        <div class="tv-tally-pname">${name}</div>
        <div class="tv-tally-bar-bg"><div class="tv-tally-bar" id="tv-tb-rv-${epNum}-${slug}" style="width:0%;background:#d29922"></div></div>
        <div class="tv-tally-count" id="tv-tc-rv-${epNum}-${slug}" data-count="0">—</div>
      </div>`;
    });
    html += `</div>`;
  }
```

Replace with:

```javascript
  // Second Live Tally for revote — hidden until revote cards start revealing
  if (revoteLog.length && !ep.sidFreshVote) {
    const rvTallyNames = [...new Set(revoteLog.map(v => v.voted))].sort((a,b) => {
      const rv = ep.revoteVotes || {};
      return (rv[b]||0) - (rv[a]||0);
    });
    html += `<div class="tv-tally-panel" id="tv-tally-rv-${epNum}" style="display:none;border-color:rgba(210,153,34,0.3)">
      <div class="tv-tally-header" style="color:#d29922">Revote</div>`;
    rvTallyNames.forEach(name => {
      const slug = name.replace(/[^a-zA-Z0-9]/g, '');
      html += `<div class="tv-tally-row" data-name="${name}">
        <div class="tv-tally-torch"><div class="tv-tally-torch-flame" id="tv-tf-rv-${epNum}-${slug}"></div></div>
        ${rpPortrait(name)}
        <div class="tv-tally-pname">${name}</div>
        <div class="tv-tally-bar-bg"><div class="tv-tally-bar" id="tv-tb-rv-${epNum}-${slug}" style="width:0%;background:#d29922"></div></div>
        <div class="tv-tally-count" id="tv-tc-rv-${epNum}-${slug}" data-count="0">\u2014</div>
      </div>`;
    });
    html += `</div>`;
  }
```

- [ ] **Step 6: Update fresh vote tally panel to match new style**

Find the fresh vote tally builder (lines 64700-64733):

```javascript
    // Fresh vote reveal panel
    html += `<div class="tv-wrap">
      <div class="tv-reveal-panel" id="tv-cards-${_fvId}">`;
```

Replace with:

```javascript
    // Fresh vote tally leaderboard
    const _fvTallyNames = [...new Set(revoteLog.map(v => v.voted))].sort((a,b) => (_fvVotes[b]||0) - (_fvVotes[a]||0));
    const _fvEligible = revoteLog.filter(v => v.voter !== 'THE GAME' && v.voted).length;
    const _fvMajority = Math.ceil(_fvEligible / 2);
    html += `<div class="tv-tally-panel" id="tv-tally-${_fvId}" data-majority="${_fvMajority}" data-eligible="${_fvEligible}">
      <div class="tv-tally-header">Fresh Vote</div>`;
    _fvTallyNames.forEach(name => {
      const _fvSlug = name.replace(/[^a-zA-Z0-9]/g, '');
      html += `<div class="tv-tally-row" data-name="${name}">
        <div class="tv-tally-torch"><div class="tv-tally-torch-flame" id="tv-tf-${_fvId}-${_fvSlug}"></div></div>
        ${rpPortrait(name)}
        <div class="tv-tally-pname">${name}</div>
        <div class="tv-tally-bar-bg"><div class="tv-tally-bar" id="tv-tb-${_fvId}-${_fvSlug}" style="width:0%"></div></div>
        <div class="tv-tally-count" id="tv-tc-${_fvId}-${_fvSlug}" data-count="0">\u2014</div>
      </div>`;
    });
    html += `</div>`;
    html += `<div id="tv-threshold-${_fvId}" style="display:none"></div>`;
    // Fresh vote reveal panel
    html += `<div class="tv-reveal-panel" id="tv-cards-${_fvId}">`;
```

And remove the old fresh vote tally that comes after the cards (lines 64720-64733):

```javascript
    // Fresh vote live tally panel
    html += `<div class="tv-tally-panel" id="tv-tally-${_fvId}">
      <div class="tv-tally-header">Fresh Vote — Live Tally</div>`;
    const _fvTallyNames = [...new Set(revoteLog.map(v => v.voted))].sort((a,b) => (_fvVotes[b]||0) - (_fvVotes[a]||0));
    _fvTallyNames.forEach(name => {
      const _fvSlug = name.replace(/[^a-zA-Z0-9]/g, '');
      html += `<div class="tv-tally-row" data-name="${name}" style="opacity:0;transition:opacity 0.4s">
        ${rpPortrait(name)}
        <div class="tv-tally-pname">${name}</div>
        <div class="tv-tally-bar-bg"><div class="tv-tally-bar" id="tv-tb-${_fvId}-${_fvSlug}" style="width:0%"></div></div>
        <div class="tv-tally-count" id="tv-tc-${_fvId}-${_fvSlug}" data-count="0">—</div>
      </div>`;
    });
    html += `</div></div>`; // end tally panel + tv-wrap
```

Replace the closing with just:

```javascript
    html += `</div>`; // end tv-reveal-panel (fresh vote cards)
```

- [ ] **Step 7: Commit**

```bash
git add simulator.html
git commit -m "feat: vote reveal overdrive — tally leaderboard HTML with torches, stacked layout"
```

---

### Task 3: Update rpBuildVotes2 to Match

**Files:**
- Modify: `simulator.html:65809+` (`rpBuildVotes2` function)

- [ ] **Step 1: Find the tally panel in rpBuildVotes2**

Search for the tally panel builder inside `rpBuildVotes2`. It will follow the same pattern — `tv-tally-panel` built after the vote cards with `epId` = `String(ep.num) + '_v2'`.

Apply the same structural changes as Task 2:
1. Move tally panel HTML to render BEFORE the vote cards
2. Add torch icons to each row
3. Add `data-majority` and `data-eligible` attributes
4. Change header to "The Votes"
5. Add threshold banner slot `<div id="tv-threshold-${epId}">`
6. Remove `tv-wrap` container (cards and tally are siblings)
7. Remove inline `style="opacity:0;transition:opacity 0.4s"` from rows (now handled by CSS class)

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: vote reveal overdrive — apply leaderboard layout to rpBuildVotes2"
```

---

### Task 4: JS — Multi-Beat Reveal Sequence

**Files:**
- Modify: `simulator.html:65216-65254` (`tvRevealNext` function)

- [ ] **Step 1: Replace tvRevealNext with the 4-beat sequence**

Find the existing function at line 65216:

```javascript
function tvRevealNext(epNum) {
  if (!_tvState[epNum]) _tvState[epNum] = { revealed: 0, tallyCounts: {}, revoteCounts: {} };
  const state = _tvState[epNum];
  if (state.flipping) return;
  const cards = document.querySelectorAll(`#tv-cards-${epNum} .tv-vote-card`);
  if (!cards.length) return;
  cards.forEach(c => c.classList.remove('tv-latest'));
  if (state.revealed < cards.length) {
    const card = cards[state.revealed];
    const isRevote = card.dataset.revote === '1';
    state.flipping = true;
    card.classList.add('tv-flipping');
    // At midpoint (edge-on), swap content visibility
    setTimeout(() => {
      card.classList.add('tv-revealed', 'tv-latest');
      const voted = card.dataset.voted;
      if (voted) {
        if (isRevote) {
          // Show revote tally panel on first revote card
          const rvPanel = document.getElementById(`tv-tally-rv-${epNum}`);
          if (rvPanel && rvPanel.style.display === 'none') rvPanel.style.display = '';
          state.revoteCounts[voted] = (state.revoteCounts[voted] || 0) + 1;
          _tvUpdateRevoteTally(epNum, state);
        } else {
          state.tallyCounts[voted] = (state.tallyCounts[voted] || 0) + 1;
          _tvUpdateTally(epNum, state);
        }
      }
    }, 250);
    setTimeout(() => { card.classList.remove('tv-flipping'); state.flipping = false; }, 500);
    state.revealed++;
    const btn = document.getElementById(`tv-btn-${epNum}`);
    if (state.revealed >= cards.length) {
      if (btn) { btn.textContent = 'See Results ▼'; btn.onclick = () => tvShowResults(epNum); }
    } else {
      if (btn) btn.textContent = `Read the Vote (${state.revealed}/${cards.length})`;
    }
  }
}
```

Replace with:

```javascript
function tvRevealNext(epNum) {
  if (!_tvState[epNum]) _tvState[epNum] = { revealed: 0, tallyCounts: {}, revoteCounts: {} };
  const state = _tvState[epNum];
  if (state.flipping) return;
  const cards = document.querySelectorAll(`#tv-cards-${epNum} .tv-vote-card`);
  if (!cards.length) return;
  cards.forEach(c => c.classList.remove('tv-latest'));
  if (state.revealed >= cards.length) return;

  const card = cards[state.revealed];
  const isRevote = card.dataset.revote === '1';
  state.flipping = true;

  // ── Beat 1: Spotlight (0→200ms) ──
  cards.forEach(c => { if (c !== card) c.classList.add('tv-spotlight-dim'); });
  const tallyPanel = document.getElementById(`tv-tally-${epNum}`);
  if (tallyPanel) tallyPanel.classList.add('tv-spotlight-dim');
  card.classList.add('tv-spotlight-active');

  // ── Beat 2: Flip (200→700ms) ──
  setTimeout(() => {
    card.classList.add('tv-flipping');
    setTimeout(() => {
      card.classList.add('tv-revealed', 'tv-latest');
      const voted = card.dataset.voted;

      // ── Beat 3: Vote Flies (700→1100ms) ──
      if (voted) {
        _tvFireVoteFly(card, epNum, voted, isRevote);
        if (isRevote) {
          const rvPanel = document.getElementById(`tv-tally-rv-${epNum}`);
          if (rvPanel && rvPanel.style.display === 'none') rvPanel.style.display = '';
          state.revoteCounts[voted] = (state.revoteCounts[voted] || 0) + 1;
        } else {
          state.tallyCounts[voted] = (state.tallyCounts[voted] || 0) + 1;
        }
      }
    }, 250); // midpoint of flip

    // ── Beat 4: Tally Reacts (1100→1500ms from start = 400ms after vote fly starts) ──
    setTimeout(() => {
      card.classList.remove('tv-flipping');
      const voted = card.dataset.voted;
      if (voted) {
        if (isRevote) {
          _tvUpdateRevoteTally(epNum, state);
        } else {
          _tvUpdateTally(epNum, state);
          _tvCheckThresholds(epNum, state);
        }
      }
      // Restore spotlight
      cards.forEach(c => c.classList.remove('tv-spotlight-dim'));
      if (tallyPanel) tallyPanel.classList.remove('tv-spotlight-dim');
      card.classList.remove('tv-spotlight-active');
      state.flipping = false;
    }, 800); // 200ms beat1 + 500ms flip + 100ms settle
  }, 200); // beat 1 duration

  state.revealed++;
  const btn = document.getElementById(`tv-btn-${epNum}`);
  if (state.revealed >= cards.length) {
    if (btn) { btn.textContent = 'See Results \u25bc'; btn.onclick = () => tvShowResults(epNum); }
  } else {
    if (btn) btn.textContent = `Read the Vote (${state.revealed}/${cards.length})`;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: vote reveal overdrive — 4-beat reveal sequence with spotlight and timing"
```

---

### Task 5: JS — Vote Fly Animation

**Files:**
- Modify: `simulator.html` (insert new function after `tvRevealNext`, before `tvShowResults` at line 65256)

- [ ] **Step 1: Add the _tvFireVoteFly function**

Insert after `tvRevealNext` closes:

```javascript
function _tvFireVoteFly(cardEl, epNum, voted, isRevote) {
  const slug = voted.replace(/[^a-zA-Z0-9]/g, '');
  const tallyId = isRevote ? `tv-tally-rv-${epNum}` : `tv-tally-${epNum}`;
  const targetRow = document.querySelector(`#${tallyId} .tv-tally-row[data-name="${voted}"]`);
  if (!targetRow) return;

  // Source: the vote target name in the card
  const sourceEl = cardEl.querySelector('.tv-vote-target') || cardEl;
  const srcRect = sourceEl.getBoundingClientRect();
  const dstRect = targetRow.getBoundingClientRect();

  const fly = document.createElement('div');
  fly.className = 'tv-vote-fly';
  fly.textContent = voted;
  fly.style.left = srcRect.left + 'px';
  fly.style.top = srcRect.top + 'px';
  document.body.appendChild(fly);

  // Animate from source to destination
  const dx = dstRect.left - srcRect.left;
  const dy = dstRect.top - srcRect.top;
  const duration = 400;
  const start = performance.now();

  function animate(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
    fly.style.left = (srcRect.left + dx * ease) + 'px';
    fly.style.top = (srcRect.top + dy * ease) + 'px';
    fly.style.opacity = String(0.6 * (1 - t * 0.5));
    fly.style.filter = `blur(${t * 2}px)`;
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      fly.remove();
    }
  }
  requestAnimationFrame(animate);
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: vote reveal overdrive — vote fly animation from card to tally"
```

---

### Task 6: JS — Updated Tally with Torches and Count Bounce

**Files:**
- Modify: `simulator.html:65373-65411` (`_tvUpdateTally` and `_tvUpdateRevoteTally`)

- [ ] **Step 1: Replace _tvUpdateTally**

Find at line 65373:

```javascript
function _tvUpdateTally(epNum, state) {
  const maxCount = Math.max(...Object.values(state.tallyCounts), 1);
  Object.entries(state.tallyCounts).forEach(([name, count]) => {
    const slug = name.replace(/[^a-zA-Z0-9]/g, '');
    const countEl = document.getElementById(`tv-tc-${epNum}-${slug}`);
    const barEl = document.getElementById(`tv-tb-${epNum}-${slug}`);
    const rowEl = document.querySelector(`#tv-tally-${epNum} .tv-tally-row[data-name="${name}"]`);
    if (countEl) countEl.textContent = count;
    if (barEl) barEl.style.width = `${Math.round((count / maxCount) * 100)}%`;
    if (rowEl) {
      rowEl.style.opacity = '1'; // reveal row when it gets its first vote
      rowEl.classList.toggle('tv-tally-leading', count === maxCount && count > 0);
    }
  });
  // Clear leading from names with 0 count
  const tally = document.getElementById(`tv-tally-${epNum}`);
  if (tally) {
    tally.querySelectorAll('.tv-tally-row').forEach(row => {
      const rName = row.dataset.name;
      if (!state.tallyCounts[rName]) row.classList.remove('tv-tally-leading');
    });
  }
}
```

Replace with:

```javascript
function _tvUpdateTally(epNum, state) {
  const maxCount = Math.max(...Object.values(state.tallyCounts), 1);
  const leadCount = maxCount;
  const leaders = Object.entries(state.tallyCounts).filter(([,c]) => c === leadCount && c > 0);
  const isTied = leaders.length > 1;

  Object.entries(state.tallyCounts).forEach(([name, count]) => {
    const slug = name.replace(/[^a-zA-Z0-9]/g, '');
    const countEl = document.getElementById(`tv-tc-${epNum}-${slug}`);
    const barEl = document.getElementById(`tv-tb-${epNum}-${slug}`);
    const flameEl = document.getElementById(`tv-tf-${epNum}-${slug}`);
    const rowEl = document.querySelector(`#tv-tally-${epNum} .tv-tally-row[data-name="${name}"]`);
    if (countEl) {
      countEl.textContent = count;
      // Count bounce
      countEl.classList.remove('tv-count-bounce');
      void countEl.offsetWidth; // force reflow
      countEl.classList.add('tv-count-bounce');
    }
    if (barEl) barEl.style.width = `${Math.round((count / maxCount) * 100)}%`;
    if (rowEl) {
      if (!rowEl.classList.contains('tv-tally-visible')) rowEl.classList.add('tv-tally-visible');
      const isLeading = count === leadCount && count > 0;
      rowEl.classList.toggle('tv-tally-leading', isLeading);
      rowEl.classList.toggle('tv-tally-tied', isLeading && isTied);
    }
    // Torch flame sizing
    if (flameEl) {
      flameEl.className = 'tv-tally-torch-flame';
      const isLeading = count === leadCount && count > 0;
      if (count === 0) { /* unlit — default class */ }
      else if (isLeading && count >= 3) flameEl.classList.add('tv-flame-max');
      else if (isLeading) flameEl.classList.add('tv-flame-high');
      else flameEl.classList.add('tv-flame-low');
    }
  });
  // Clear leading/tied from names with 0 count
  const tally = document.getElementById(`tv-tally-${epNum}`);
  if (tally) {
    tally.querySelectorAll('.tv-tally-row').forEach(row => {
      const rName = row.dataset.name;
      if (!state.tallyCounts[rName]) {
        row.classList.remove('tv-tally-leading', 'tv-tally-tied');
      }
    });
    // Tied badge
    let badge = tally.querySelector('.tv-tally-tied-badge');
    if (isTied) {
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'tv-tally-tied-badge';
        // Insert after last leading row
        const lastLeader = [...tally.querySelectorAll('.tv-tally-leading')].pop();
        if (lastLeader) lastLeader.after(badge);
      }
      badge.textContent = 'TIED';
      badge.style.display = '';
    } else if (badge) {
      badge.style.display = 'none';
    }
  }
}
```

- [ ] **Step 2: Replace _tvUpdateRevoteTally**

Find at line 65397:

```javascript
function _tvUpdateRevoteTally(epNum, state) {
  const maxCount = Math.max(...Object.values(state.revoteCounts), 1);
  Object.entries(state.revoteCounts).forEach(([name, count]) => {
    const slug = name.replace(/[^a-zA-Z0-9]/g, '');
    const countEl = document.getElementById(`tv-tc-rv-${epNum}-${slug}`);
    const barEl = document.getElementById(`tv-tb-rv-${epNum}-${slug}`);
    const rowEl = document.querySelector(`#tv-tally-rv-${epNum} .tv-tally-row[data-name="${name}"]`);
    if (countEl) countEl.textContent = count;
    if (barEl) barEl.style.width = `${Math.round((count / maxCount) * 100)}%`;
    if (rowEl) {
      rowEl.style.opacity = '1';
      rowEl.classList.toggle('tv-tally-leading', count === maxCount && count > 0);
    }
  });
}
```

Replace with:

```javascript
function _tvUpdateRevoteTally(epNum, state) {
  const maxCount = Math.max(...Object.values(state.revoteCounts), 1);
  const leaders = Object.entries(state.revoteCounts).filter(([,c]) => c === maxCount && c > 0);
  const isTied = leaders.length > 1;
  Object.entries(state.revoteCounts).forEach(([name, count]) => {
    const slug = name.replace(/[^a-zA-Z0-9]/g, '');
    const countEl = document.getElementById(`tv-tc-rv-${epNum}-${slug}`);
    const barEl = document.getElementById(`tv-tb-rv-${epNum}-${slug}`);
    const flameEl = document.getElementById(`tv-tf-rv-${epNum}-${slug}`);
    const rowEl = document.querySelector(`#tv-tally-rv-${epNum} .tv-tally-row[data-name="${name}"]`);
    if (countEl) {
      countEl.textContent = count;
      countEl.classList.remove('tv-count-bounce');
      void countEl.offsetWidth;
      countEl.classList.add('tv-count-bounce');
    }
    if (barEl) barEl.style.width = `${Math.round((count / maxCount) * 100)}%`;
    if (rowEl) {
      if (!rowEl.classList.contains('tv-tally-visible')) rowEl.classList.add('tv-tally-visible');
      const isLeading = count === maxCount && count > 0;
      rowEl.classList.toggle('tv-tally-leading', isLeading);
      rowEl.classList.toggle('tv-tally-tied', isLeading && isTied);
    }
    if (flameEl) {
      flameEl.className = 'tv-tally-torch-flame';
      const isLeading = count === maxCount && count > 0;
      if (count === 0) { /* unlit */ }
      else if (isLeading && count >= 3) flameEl.classList.add('tv-flame-max');
      else if (isLeading) flameEl.classList.add('tv-flame-high');
      else flameEl.classList.add('tv-flame-low');
    }
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: vote reveal overdrive — tally update with torch flames, count bounce, tied state"
```

---

### Task 7: JS — Threshold Reactions

**Files:**
- Modify: `simulator.html` (insert new function after `_tvUpdateRevoteTally`)

- [ ] **Step 1: Add the _tvCheckThresholds function**

Insert after `_tvUpdateRevoteTally` closes:

```javascript
function _tvCheckThresholds(epNum, state) {
  const tallyPanel = document.getElementById(`tv-tally-${epNum}`);
  if (!tallyPanel) return;
  const majority = parseInt(tallyPanel.dataset.majority) || 999;
  const thresholdSlot = document.getElementById(`tv-threshold-${epNum}`);

  const sorted = Object.entries(state.tallyCounts).sort(([,a],[,b]) => b - a);
  if (!sorted.length) return;
  const [topName, topCount] = sorted[0];

  // ── Majority reached ──
  if (topCount >= majority) {
    // Full-screen flash
    const flash = document.createElement('div');
    flash.className = 'tv-majority-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 200);

    // Grey out losing rows, snuff their torches
    tallyPanel.querySelectorAll('.tv-tally-row').forEach(row => {
      if (row.dataset.name !== topName) {
        row.classList.add('tv-tally-eliminated');
        row.classList.remove('tv-tally-leading', 'tv-tally-tied');
        const flame = row.querySelector('.tv-tally-torch-flame');
        if (flame) { flame.className = 'tv-tally-torch-flame tv-flame-out'; }
      }
    });
    // Winner torch goes max
    const winSlug = topName.replace(/[^a-zA-Z0-9]/g, '');
    const winFlame = document.getElementById(`tv-tf-${epNum}-${winSlug}`);
    if (winFlame) winFlame.className = 'tv-tally-torch-flame tv-flame-max';

    // Clear threshold banner (replace any "one vote away")
    if (thresholdSlot) { thresholdSlot.style.display = 'none'; thresholdSlot.innerHTML = ''; }

    // Change button text to elimination reveal
    const btn = document.getElementById(`tv-btn-${epNum}`);
    const cards = document.querySelectorAll(`#tv-cards-${epNum} .tv-vote-card`);
    if (btn && state.revealed >= cards.length) {
      const elimNum = _tvGetElimOrdinal(epNum);
      btn.textContent = `The ${elimNum} person voted out...`;
      btn.onclick = () => tvShowResults(epNum);
    }

    // Remove tied badge
    const badge = tallyPanel.querySelector('.tv-tally-tied-badge');
    if (badge) badge.style.display = 'none';

    return; // no further threshold checks needed
  }

  // ── One vote away (majority - 1) ──
  if (topCount === majority - 1 && !state._shownOneAway) {
    state._shownOneAway = true;
    if (thresholdSlot) {
      thresholdSlot.innerHTML = '<div class="tv-threshold-banner">ONE VOTE AWAY</div>';
      thresholdSlot.style.display = '';
    }
    // Speed up leader's torch
    const slug = topName.replace(/[^a-zA-Z0-9]/g, '');
    const flame = document.getElementById(`tv-tf-${epNum}-${slug}`);
    if (flame) flame.className = 'tv-tally-torch-flame tv-flame-max';
    return;
  }

  // ── Clear banner if lead changed away from one-away ──
  if (state._shownOneAway && topCount < majority - 1) {
    state._shownOneAway = false;
    if (thresholdSlot) { thresholdSlot.style.display = 'none'; thresholdSlot.innerHTML = ''; }
  }
}

function _tvGetElimOrdinal(epNum) {
  const history = gs.episodeHistory || [];
  const priorElims = history.filter(h => h.eliminated && h.num < epNum).length;
  return ordinal(priorElims + 1);
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: vote reveal overdrive — threshold reactions (tied, one-vote-away, majority flash)"
```

---

### Task 8: JS — Update tvRevealAll for Instant Mode

**Files:**
- Modify: `simulator.html:65341-65371` (`tvRevealAll`)

- [ ] **Step 1: Replace tvRevealAll**

Find at line 65341:

```javascript
function tvRevealAll(epNum) {
  if (!_tvState[epNum]) _tvState[epNum] = { revealed: 0, tallyCounts: {}, revoteCounts: {} };
  const state = _tvState[epNum];
  const cards = document.querySelectorAll(`#tv-cards-${epNum} .tv-vote-card`);
  cards.forEach(card => {
    card.classList.add('tv-revealed');
    card.classList.remove('tv-latest');
    const voted = card.dataset.voted;
    const isRevote = card.dataset.revote === '1';
    if (voted) {
      if (isRevote) {
        state.revoteCounts[voted] = (state.revoteCounts[voted] || 0) + 1;
      } else {
        state.tallyCounts[voted] = (state.tallyCounts[voted] || 0) + 1;
      }
    }
  });
  state.revealed = cards.length;
  _tvUpdateTally(epNum, state);
  // Show + update revote tally if any revote cards exist
  if (Object.keys(state.revoteCounts).length) {
    const rvPanel = document.getElementById(`tv-tally-rv-${epNum}`);
    if (rvPanel) rvPanel.style.display = '';
    _tvUpdateRevoteTally(epNum, state);
  }
  const btn = document.getElementById(`tv-btn-${epNum}`);
  if (btn) btn.style.display = 'none';
  // Also hide the skip button (sibling)
  btn?.parentElement?.querySelectorAll('button').forEach(b => b.style.display = 'none');
  tvShowResults(epNum);
}
```

Replace with:

```javascript
function tvRevealAll(epNum) {
  if (!_tvState[epNum]) _tvState[epNum] = { revealed: 0, tallyCounts: {}, revoteCounts: {} };
  const state = _tvState[epNum];
  state.flipping = false; // cancel any in-progress reveal
  const cards = document.querySelectorAll(`#tv-cards-${epNum} .tv-vote-card`);
  // Clean up any lingering spotlight/animation classes
  cards.forEach(c => c.classList.remove('tv-spotlight-dim', 'tv-spotlight-active', 'tv-flipping'));
  const tallyPanel = document.getElementById(`tv-tally-${epNum}`);
  if (tallyPanel) tallyPanel.classList.remove('tv-spotlight-dim');

  cards.forEach(card => {
    card.classList.add('tv-revealed');
    card.classList.remove('tv-latest');
    const voted = card.dataset.voted;
    const isRevote = card.dataset.revote === '1';
    if (voted) {
      if (isRevote) {
        state.revoteCounts[voted] = (state.revoteCounts[voted] || 0) + 1;
      } else {
        state.tallyCounts[voted] = (state.tallyCounts[voted] || 0) + 1;
      }
    }
  });
  state.revealed = cards.length;
  _tvUpdateTally(epNum, state);
  _tvCheckThresholds(epNum, state);
  // Show + update revote tally if any revote cards exist
  if (Object.keys(state.revoteCounts).length) {
    const rvPanel = document.getElementById(`tv-tally-rv-${epNum}`);
    if (rvPanel) rvPanel.style.display = '';
    _tvUpdateRevoteTally(epNum, state);
  }
  const btn = document.getElementById(`tv-btn-${epNum}`);
  if (btn) btn.style.display = 'none';
  btn?.parentElement?.querySelectorAll('button').forEach(b => b.style.display = 'none');
  // Clear threshold banner before showing results
  const thresholdSlot = document.getElementById(`tv-threshold-${epNum}`);
  if (thresholdSlot) { thresholdSlot.style.display = 'none'; thresholdSlot.innerHTML = ''; }
  tvShowResults(epNum);
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: vote reveal overdrive — tvRevealAll cleanup for instant mode with threshold support"
```

---

### Task 9: Smoke Test and Fix Edge Cases

**Files:**
- Modify: `simulator.html` (various locations as needed)

- [ ] **Step 1: Open the simulator and run a season**

Open `simulator.html` in a browser. Configure a season with at least 6 players. Run through to the first tribal council.

- [ ] **Step 2: Navigate to the Votes VP screen and test the reveal**

Click "Read the Vote" and verify:
1. Screen dims (spotlight) before the card flips
2. Card flips with existing animation
3. Vote name flies from card up to tally row
4. Tally row slides in from left on first vote
5. Bar animates with spring ease, count bounces
6. Torch icon lights up (low → high → max as votes increase)
7. Leading row gets red glow

- [ ] **Step 3: Continue clicking to test thresholds**

1. At a tie: both leading rows pulse red/amber, "TIED" badge appears
2. At majority-1: "ONE VOTE AWAY" banner slides in
3. At majority: red flash, losing rows grey out, torches snuff, button changes to "The Nth person voted out..."

- [ ] **Step 4: Test "Skip to results"**

Click "Skip to results" on a fresh vote screen. Verify all cards reveal instantly, tally shows final state, no lingering animation classes.

- [ ] **Step 5: Test edge cases**

1. Multi-tribal episode (rpBuildVotes2) — verify second vote screen works
2. Fresh vote (SitD wipe) — verify fresh vote tally works
3. Revote — verify revote tally panel appears with torches
4. Single-vote elimination (unanimous) — verify majority triggers on first/second vote correctly
5. No elimination episode — verify no crashes

- [ ] **Step 6: Fix any issues found, commit**

```bash
git add simulator.html
git commit -m "fix: vote reveal overdrive — edge case fixes from smoke test"
```
