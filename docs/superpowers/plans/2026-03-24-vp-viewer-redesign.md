# VP Viewer Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Visual Player (VP) viewer in `simulator.html` with a broadcast-quality reality TV aesthetic (Survivor-dark + Disventure Camp structure), a time-of-day progression across screens, interactive challenge reveals, and all 9 functional gaps from `viewer_improvements.txt`.

**Architecture:** All changes are in `simulator.html` — CSS additions in the `<style>` block (`:root` at line 11), new/modified VP builder functions in the script section, and new screens inserted in the `vpScreens.push()` block (line 15185+). No new files. New screen builder functions (`rpBuildMergeAnnouncement`, `rpBuildRelationships`, `rpBuildRIDuel`) are added adjacent to their related builders. A new helper `buildSignalCards()` is added near `rpBuildCampTribe` (line 12226).

**Tech Stack:** Vanilla HTML/CSS/JS, single-file simulator. No build step. Open `simulator.html` in a browser to test — run a season, click into any episode's VP viewer to verify screens.

---

> **Line number drift warning:** Line numbers below are approximate starting points. After each task inserts code, subsequent line numbers shift. Always search for a nearby unique anchor string rather than jumping to a bare line number. Each task includes a quoted anchor to search for.

---

## Reference

- Spec: `docs/superpowers/specs/2026-03-24-vp-viewer-redesign-design.md`
- Key functions by line:
  - CSS `:root`: line 11
  - `rpBuildColdOpen()`: line 11698
  - `rpBuildTribes()`: line 11775
  - `rpBuildPreTwist()`: line 11993
  - `rpBuildPostElimTwist()`: line 12018
  - `rpBuildCampTribe()`: line 12226
  - `rpBuildChallenge()`: line 12512
  - `rpBuildVotingPlans()`: line 12703
  - `rpBuildTribal()`: line 13784
  - `rpBuildVotes()`: line 14030
  - `rpBuildAftermath()`: line 14730
  - `vpScreens.push()` block: line 15185

---

## Task 1: CSS Foundation

**Files:**
- Modify: `simulator.html` — `:root` block (line 11–23) and adjacent VP CSS

- [ ] **Step 1: Add accent + animation CSS variables to `:root`**

  In the `:root` block (line 11), after the existing `--font-mono` line, add:

  ```css
  --accent-fire:    #e8873a;
  --accent-ice:     #4db8c4;
  --accent-gold:    #f0c040;
  --ease-broadcast: cubic-bezier(0.22, 1, 0.36, 1);
  --reveal-stagger: 120ms;
  ```

- [ ] **Step 2: Add time-of-day background utility classes**

  After the `:root` block, add a new CSS section:

  ```css
  /* ── VP: Time-of-day backgrounds ── */
  .tod-dawn       { background: linear-gradient(to bottom, #0f0e18, #1a1530); }
  .tod-morning    { background: linear-gradient(to bottom, #0d1018, #181624); }
  .tod-merge-am   { background: linear-gradient(to bottom, #0e1014, #1a1a28); }
  .tod-midday     { background: linear-gradient(to bottom, #0c1118, #111820); }
  .tod-afternoon  { background: linear-gradient(to bottom, #0b1219, #0e1a26); }
  .tod-golden     { background: linear-gradient(to bottom, #100e0a, #1c1508); }
  .tod-dusk       { background: linear-gradient(to bottom, #130d06, #1e1205); }
  .tod-night      { background: linear-gradient(to bottom, #090d12, #0d0705); }
  .tod-deepnight  { background: linear-gradient(to bottom, #050709, #08050a); }
  .tod-posttribal { background: linear-gradient(to bottom, #080c11, #0d1018); }
  .tod-arena      { background: linear-gradient(to bottom, #0d1318, #131a20); }
  ```

  > **Implementation note:** The spec describes inline `--tod-bg-start`/`--tod-bg-end` CSS variables per screen. This plan uses utility classes instead — same visual result, simpler to apply (one class vs. two inline vars per screen). Intentional deviation.

- [ ] **Step 3: Add component classes and animation keyframes**

  Add after the time-of-day section:

  ```css
  /* ── VP: Component classes ── */
  .vp-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; }
  .vp-card.fire  { border-color: var(--accent-fire); }
  .vp-card.ice   { border-color: var(--accent-ice); }
  .vp-card.gold  { border-color: var(--accent-gold); }
  .vp-section-header { font-family: var(--font-display); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; padding: 6px 0 6px 10px; margin: 16px 0 8px; border-left: 3px solid var(--accent-fire); color: var(--muted); }
  .vp-section-header.ice  { border-color: var(--accent-ice); }
  .vp-section-header.gold { border-color: var(--accent-gold); }

  /* ── VP: Tribal stump ── */
  .vp-stump-wrap { display: flex; flex-direction: column; align-items: center; gap: 0; }
  .vp-stump { position: relative; width: 72px; height: 20px; border-radius: 6px;
    background: radial-gradient(ellipse at 50% 30%, #8b6914, #5c3d0a);
    box-shadow: 0 2px 16px rgba(232,135,58,0.25); }
  .vp-stump::before { content:''; position:absolute; inset:0; border-radius:6px;
    background: linear-gradient(to right, rgba(61,37,5,0.7), transparent 20%, transparent 80%, rgba(61,37,5,0.7));
    pointer-events:none; }
  .vp-stump-wrap img { margin-bottom: -10px; }

  /* ── VP: Torch snuff ── */
  /* Uses animation (not transition) so it fires when element is inserted into DOM via innerHTML */
  @keyframes torchSnuff {
    from { filter: brightness(1) grayscale(0); }
    to   { filter: brightness(0.15) grayscale(1); }
  }
  .torch-snuffed img { animation: torchSnuff 1.5s ease-in 1.5s both; }

  /* ── VP: Animations ── */
  @keyframes torchFlicker {
    0%,100% { opacity: 0.10; }
    50%      { opacity: 0.18; }
  }
  @keyframes voteFlash {
    0%   { box-shadow: 0 0 0 0 var(--accent-fire); }
    100% { box-shadow: 0 0 0 16px transparent; }
  }
  @keyframes goldPulse {
    0%   { box-shadow: 0 0 0 0 var(--accent-gold); }
    100% { box-shadow: 0 0 0 20px transparent; }
  }
  @keyframes staggerIn {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-32px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes bannerUnfurl {
    from { transform: scaleX(0); opacity: 0; }
    to   { transform: scaleX(1); opacity: 1; }
  }
  @keyframes scrollDrop {
    from { transform: scaleY(0); transform-origin: top center; opacity: 0; }
    to   { transform: scaleY(1); transform-origin: top center; opacity: 1; }
  }
  ```

- [ ] **Step 4: Verify**

  Open `simulator.html` in browser. Confirm no CSS parse errors in DevTools console.

- [ ] **Step 5: Commit**

  ```bash
  git add simulator.html
  git commit -m "feat(vp): add CSS foundation — accent vars, time-of-day classes, animation keyframes"
  ```

---

## Task 2: Navigation Fixes

**Files:**
- Modify: `simulator.html` — `vpScreens.push()` block (line 15194), twist label pushes (lines 15194, 15283)

- [ ] **Step 1: Fix duplicate twist labels**

  At line 15194, change:
  ```js
  if (_preTwistHtml) vpScreens.push({ id:'twist', label:'Twists & Events', html: _preTwistHtml });
  ```
  to:
  ```js
  if (_preTwistHtml) vpScreens.push({ id:'twist', label:'Pre-Tribal Events', html: _preTwistHtml });
  ```

  At line 15283, change:
  ```js
  if (_postElimHtml) vpScreens.push({ id:'post-twist', label:'Twists & Events', html: _postElimHtml });
  ```
  to:
  ```js
  if (_postElimHtml) vpScreens.push({ id:'post-twist', label:'Post-Vote Twist', html: _postElimHtml });
  ```

- [ ] **Step 2: Add tribe color dots to camp sidebar labels**

  At line 15210, the pre-challenge camp push block:
  ```js
  vpScreens.push({
    id: `camp-pre-${tribe.name}`,
    label: tribe.name === 'merge' || tribe.name === (gs.mergeName||'merged')
      ? 'Camp Life'
      : `${tribe.name} Camp`,
    html: rpBuildCampTribe(ep, tribe.name, tribe.members, 'pre'),
  });
  ```
  Change to:
  ```js
  const _tc = tribeColor(tribe.name);
  const _dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${_tc};margin-right:6px;flex-shrink:0"></span>`;
  const _isMergeCamp = tribe.name === 'merge' || tribe.name === (gs.mergeName||'merged');
  vpScreens.push({
    id: `camp-pre-${tribe.name}`,
    label: _isMergeCamp ? 'Camp Life' : `${_dot}${tribe.name} Camp`,
    html: rpBuildCampTribe(ep, tribe.name, tribe.members, 'pre'),
  });
  ```

  Apply the same pattern to the post-challenge camp push block at line 15241:
  ```js
  const _tcPost = tribeColor(tribe.name);
  const _dotPost = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${_tcPost};margin-right:6px;flex-shrink:0"></span>`;
  const _isMergeCampPost = tribe.name === 'merge' || tribe.name === (gs.mergeName||'merged');
  vpScreens.push({
    id: `camp-post-${tribe.name}`,
    label: _isMergeCampPost ? 'Camp — After TC' : `${_dotPost}${tribe.name} — After TC`,
    html: rpBuildCampTribe(ep, tribe.name, postMembers, 'post'),
  });
  ```

- [ ] **Step 3: Verify**

  Run a season, open VP on a pre-merge tribal episode. Confirm: sidebar shows "Pre-Tribal Events" / "Post-Vote Twist" (not both "Twists & Events"), and tribe camp labels have colored dots.

- [ ] **Step 4: Commit**

  ```bash
  git add simulator.html
  git commit -m "feat(vp): fix duplicate twist labels, add tribe color dots to camp sidebar"
  ```

---

## Task 3: Cold Open — "Coming in from last episode"

**Files:**
- Modify: `simulator.html` — `rpBuildColdOpen()` (line 11698)

- [ ] **Step 1: Add narrative block at the end of `rpBuildColdOpen`, before `html += '</div>'`**

  Find the closing `html += '</div>';` at line 11770 (before `return html`). Insert before it:

  ```js
  // ── "Coming in from last episode" block ──
  if (prevEp && ep.num > 1) {
    const _pSnap = prevEp.gsSnapshot || {};
    const _pAlliances = _pSnap.namedAlliances || [];
    const _recruits = prevEp.allianceRecruits || [];
    const _quits    = prevEp.allianceQuits    || [];

    // Top alliance by member count
    const _topAlliance = [..._pAlliances].sort((a,b) => b.members.length - a.members.length)[0];

    // Bottom 2 players by average bond
    // Use gs.activePlayers (live at episode start) — bonds are live too, so these are consistent
    const _activePlayers = gs.activePlayers;
    const _avgBond = n => {
      const others = _activePlayers.filter(p => p !== n);
      if (!others.length) return 0;
      return others.reduce((s, p) => s + getBond(n, p), 0) / others.length;
    };
    const _bottomTwo = [..._activePlayers].sort((a,b) => _avgBond(a) - _avgBond(b)).slice(0, 2);

    let _hookHtml = `<div class="rp-co-divider"></div>
      <div class="rp-section-header" style="font-family:var(--font-display);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);padding:6px 0 10px">Coming in from last episode</div>`;

    if (_topAlliance) {
      const _members = _topAlliance.members.filter(n => _activePlayers.includes(n));
      _hookHtml += `<div class="vp-card" style="margin-bottom:10px">
        <div style="font-family:var(--font-display);font-size:13px;letter-spacing:1px;margin-bottom:6px">${_topAlliance.name}</div>
        <div style="font-size:12px;color:var(--muted)">${_members.join(', ')} — ${_members.length} strong going in</div>
      </div>`;
    }

    if (_bottomTwo.length) {
      _hookHtml += `<div class="vp-card fire" style="margin-bottom:10px">
        <div style="font-family:var(--font-display);font-size:11px;letter-spacing:1px;color:var(--accent-fire);margin-bottom:6px">On the bottom</div>
        <div style="font-size:12px">${_bottomTwo.join(' and ')}</div>
      </div>`;
    }

    if (_recruits.length) {
      _recruits.forEach(r => {
        _hookHtml += `<div style="font-size:12px;color:var(--muted);margin-bottom:4px">
          ${r.player} joined ${r.toAlliance} last episode${r.fromAlliance ? ` (left ${r.fromAlliance})` : ''}.
        </div>`;
      });
    }
    if (_quits.length) {
      _quits.forEach(q => {
        _hookHtml += `<div style="font-size:12px;color:var(--muted);margin-bottom:4px">
          ${q.player} left ${q.alliance} last episode.
        </div>`;
      });
    }

    html += _hookHtml;
  }
  ```

- [ ] **Step 2: Apply dawn time-of-day class to cold open page**

  In `rpBuildColdOpen`, find `<div class="rp-page rp-cold-open">` and change to:
  ```js
  `<div class="rp-page rp-cold-open tod-dawn">`
  ```

- [ ] **Step 3: Verify**

  Run 2+ episodes, open VP on episode 2+. Cold Open should show a "Coming in from last episode" section with top alliance and bottom players. Episode 1 should show nothing extra.

- [ ] **Step 4: Commit**

  ```bash
  git add simulator.html
  git commit -m "feat(vp): cold open narrative hook — top alliance, bottom players, alliance shifts"
  ```

---

## Task 4: Tribe Status — color headers + tribe history dots

**Files:**
- Modify: `simulator.html` — `rpBuildTribes()` (line 11775)

- [ ] **Step 1: Read `rpBuildTribes()`**

  Read lines 11775–11992 to understand current tribe status rendering before modifying.

- [ ] **Step 2: Add `getTribeHistory()` helper before `rpBuildTribes()`**

  Insert before `rpBuildTribes` at line 11774:

  ```js
  function getTribeHistory(playerName) {
    const history = [];
    for (const ep of (gs.episodeHistory || [])) {
      const tribe = (ep.tribesAtStart || []).find(t => t.members.includes(playerName));
      if (!tribe) continue;
      if (history[history.length - 1] !== tribe.name) history.push(tribe.name);
    }
    return history;
  }
  ```

- [ ] **Step 3: Add tribe history dot rendering inside `rpBuildTribes()`**

  Find where each tribe's portrait row is rendered in `rpBuildTribes`. Tribe swap has ever happened when any `gs.episodeHistory` entry has a swap-type twist. Add this detection at the start of `rpBuildTribes`:

  ```js
  const _swapTypes = ['tribe-swap','tribe-expansion','abduction','swapvote','mutiny','tribe-dissolve'];
  const _hadSwap = (gs.episodeHistory || []).some(h =>
    (h.twist?.type && _swapTypes.includes(h.twist.type)) ||
    (h.twists || []).some(t => _swapTypes.includes(t.type))
  );
  const _showHistory = _hadSwap && localStorage.getItem('vp_showTribeHistory') !== 'false';
  ```

  Then for each player portrait rendered in this function, after the portrait img, add tribe history dots when `_showHistory`:

  ```js
  function _tribeHistoryDots(playerName) {
    if (!_showHistory) return '';
    const history = getTribeHistory(playerName);
    if (history.length <= 1) return '';
    return `<div style="display:flex;gap:3px;justify-content:center;margin-top:3px">
      ${history.map(t => `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${tribeColor(t)}" title="${t}"></span>`).join('')}
    </div>`;
  }
  ```

- [ ] **Step 4: Add toggle button to tribe status screen header**

  In `rpBuildTribes`, after the page header HTML is built, add:

  ```js
  if (_hadSwap) {
    const _on = localStorage.getItem('vp_showTribeHistory') !== 'false';
    html += `<div style="text-align:right;margin-bottom:12px">
      <button onclick="(function(){const n=localStorage.getItem('vp_showTribeHistory')!=='false';localStorage.setItem('vp_showTribeHistory',n?'false':'true');const ep=gs.episodeHistory.find(e=>e.num===vpEpNum);if(ep){buildVPScreens(ep);renderVPScreen();}})()"
        style="font-size:10px;padding:4px 10px;border:1px solid var(--border);border-radius:4px;background:transparent;color:var(--muted);cursor:pointer">
        Tribe History: ${_on ? 'ON' : 'OFF'}
      </button>
    </div>`;
  }
  ```

  The toggle rebuilds the VP for the current episode by calling `buildVPScreens(ep)` + `renderVPScreen()`. `vpEpNum` is the module-level variable set when `openVisualPlayer` runs. No `window._vpCurrentEp` needed.

- [ ] **Step 5: Apply early morning time-of-day class**

  Find the `<div class="rp-page` in `rpBuildTribes` and add `tod-morning` class.

- [ ] **Step 6: Apply tribe colors to tribe name headers**

  Find where tribe headers are rendered in `rpBuildTribes`. Add `style="color:${tribeColor(t.name)}"` or `border-color` to each tribe name element.

- [ ] **Step 7: Verify**

  Run a season with a tribe swap. Open VP after the swap episode. Tribe Status should show colored dots under each player's portrait showing their tribe history. Toggle button should appear and work.

- [ ] **Step 8: Commit**

  ```bash
  git add simulator.html
  git commit -m "feat(vp): tribe status — history dots, toggle, color headers, morning palette"
  ```

---

## Task 5: Merge Announcement Screen (NEW)

**Files:**
- Modify: `simulator.html` — add `rpBuildMergeAnnouncement()` near line 11774, insert into `vpScreens.push()` block at line 15190

- [ ] **Step 1: Add `rpBuildMergeAnnouncement()` before `rpBuildPreTwist()`** (line 11992)

  ```js
  // ── Merge Announcement (NEW — inserted on isMerge episodes) ──
  function rpBuildMergeAnnouncement(ep) {
    const snap = ep.gsSnapshot || {};
    const mergedTribe = snap.tribes?.[0] || { name: gs.mergeName || 'Merged', members: snap.activePlayers || [] };
    const tc = tribeColor(mergedTribe.name);
    const alliances = snap.namedAlliances || [];
    const active = snap.activePlayers || gs.activePlayers;

    // Top 2 alliances by size
    const topAlliances = [...alliances].sort((a,b) => b.members.length - a.members.length).slice(0, 2);

    // Unallied players
    const alliedSet = new Set(alliances.flatMap(a => a.members));
    const unallied = active.filter(n => !alliedSet.has(n));
    // On the bottom = lowest avg bond among unallied
    const avgBond = n => {
      const others = active.filter(p => p !== n);
      return others.length ? others.reduce((s,p) => s + getBond(n,p), 0) / others.length : 0;
    };
    const onBottom = unallied.sort((a,b) => avgBond(a) - avgBond(b)).slice(0, 3);

    let html = `<div class="rp-page tod-merge-am">
      <div class="rp-eyebrow">Episode ${ep.num}</div>
      <div style="font-family:var(--font-display);font-size:48px;letter-spacing:2px;text-align:center;color:${tc};margin-bottom:8px;animation:bannerUnfurl 0.6s var(--ease-broadcast) both;transform-origin:center">${mergedTribe.name.toUpperCase()}</div>
      <div style="text-align:center;font-size:13px;color:var(--muted);margin-bottom:24px">The merge. ${active.length} players remain.</div>
      <div class="rp-portrait-row" style="flex-wrap:wrap;justify-content:center;margin-bottom:28px">
        ${active.map((n, i) => `<div style="animation:staggerIn 0.4s var(--ease-broadcast) ${i * 80}ms both">${rpPortrait(n)}</div>`).join('')}
      </div>`;

    if (topAlliances.length) {
      html += `<div class="vp-section-header gold">Alliance threats going in</div>`;
      topAlliances.forEach(a => {
        const members = a.members.filter(n => active.includes(n));
        html += `<div class="vp-card gold" style="margin-bottom:10px">
          <div style="font-family:var(--font-display);font-size:14px;letter-spacing:1px;margin-bottom:6px">${a.name}</div>
          <div style="font-size:12px;color:var(--muted)">${members.join(', ')}</div>
        </div>`;
      });
    }

    if (onBottom.length) {
      html += `<div class="vp-section-header fire">On the bottom</div>`;
      html += `<div class="vp-card fire">
        <div style="font-size:13px">${onBottom.join(', ')}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">Unallied going into the merge</div>
      </div>`;
    }

    html += `</div>`;
    return html;
  }
  ```

- [ ] **Step 2: Insert into `vpScreens.push()` block**

  At line 15190, after the Tribe Status push:
  ```js
  vpScreens.push({ id:'tribes', label:'Tribe Status', html: rpBuildTribes(ep) });

  // ── Merge Announcement (isMerge episodes only) ──
  if (ep.isMerge) {
    vpScreens.push({ id:'merge', label:'The Merge', html: rpBuildMergeAnnouncement(ep) });
  }
  ```

- [ ] **Step 3: Verify**

  Run a season past the merge episode. Open VP on the merge episode — "The Merge" screen should appear in sidebar between Tribe Status and Camp Life, with animated portrait grid, alliance threats, and bottom players.

- [ ] **Step 4: Commit**

  ```bash
  git add simulator.html
  git commit -m "feat(vp): add Merge Announcement screen with cinematic entrance animation"
  ```

---

## Task 6: Camp Life — post-merge grouping + signal cards

**Files:**
- Modify: `simulator.html` — `rpBuildCampTribe()` (line 12226), add `buildSignalCards()` helper before it

- [ ] **Step 1: Add `buildSignalCards()` helper before `rpBuildCampTribe` (line 12225)**

  ```js
  function buildSignalCards(ep, tribePlayers) {
    const cards = [];
    const playerSet = new Set(tribePlayers);
    // Build per-player mention tracking from existing events (precise — avoids false positives
    // where a player name appearing for any reason blocks all their signals)
    const existingLines = Object.values(ep.campEvents || {})
      .flatMap(e => [...(e.pre||[]), ...(e.post||[])]).map(e => e.text || '');
    const mentionedPairs = new Set(); // "PlayerA|PlayerB" (sorted)
    const mentionedSolo = new Set(); // single-player mention
    existingLines.forEach(txt => {
      const named = tribePlayers.filter(n => txt.includes(n));
      if (named.length >= 2) {
        for (let i = 0; i < named.length; i++)
          for (let j = i+1; j < named.length; j++)
            mentionedPairs.add([named[i], named[j]].sort().join('|'));
      } else if (named.length === 1) {
        mentionedSolo.add(named[0]);
      }
    });
    // alreadyMentioned(a, b) — true if this pair already has a camp event
    // alreadyMentioned(a)    — true if this solo player already has a solo event
    const alreadyMentioned = (a, b) =>
      b ? mentionedPairs.has([a,b].sort().join('|'))
        : mentionedSolo.has(a);

    // Bond rupture (delta < -1.5, both players in tribe)
    (ep.bondChanges || [])
      .filter(c => c.delta < -1.5 && playerSet.has(c.a) && playerSet.has(c.b) && !alreadyMentioned(c.a, c.b))
      .forEach(c => cards.push({ weight: 3, type: 'bondRupture', players: [c.a, c.b],
        text: `Something cracked between ${c.a} and ${c.b} this episode. The numbers on the surface look the same — but the dynamic isn't.`,
        badge: '− Bond broken', badgeClass: 'red' }));

    // Betrayal aftermath
    (ep.gsSnapshot?.namedAlliances || []).forEach(a => {
      (a.betrayals || []).filter(b => b.ep === ep.num && playerSet.has(b.player)).forEach(b => {
        if (!alreadyMentioned(b.player)) {
          cards.push({ weight: 3, type: 'betrayal', players: [b.player],
            text: `${b.player} voted against the alliance. Everyone noticed.`,
            badge: 'Betrayal', badgeClass: 'red' });
        }
      });
    });

    // Close vote survivor (received votes but not eliminated)
    const votes = ep.votes || {};
    const votesAgainst = {};
    Object.values(votes).forEach(v => { votesAgainst[v] = (votesAgainst[v] || 0) + 1; });
    Object.entries(votesAgainst)
      .filter(([p, n]) => n > 0 && p !== ep.eliminated && playerSet.has(p))
      .forEach(([p]) => {
        if (!alreadyMentioned(p)) {
          cards.push({ weight: 2, type: 'closeVote', players: [p],
            text: `${p} had their name written down tonight. They're still here — but they know it now.`,
            badge: 'Close call', badgeClass: 'gold' });
        }
      });

    // Idol play aftermath
    (ep.idolPlays || [])
      .filter(ip => playerSet.has(ip.player) && !alreadyMentioned(ip.player))
      .forEach(ip => cards.push({ weight: 2, type: 'idolPlay', players: [ip.player],
        text: `${ip.player} played an idol tonight. Camp tomorrow will not be the same.`,
        badge: 'Idol played', badgeClass: 'gold' }));

    // Alliance shift
    (ep.allianceRecruits || [])
      .filter(r => playerSet.has(r.player))
      .forEach(r => cards.push({ weight: 2, type: 'allianceShift', players: [r.player],
        text: `${r.player} just got absorbed into ${r.toAlliance}. The alliance map just got redrawn.`,
        badge: 'Alliance shift', badgeClass: 'gold' }));

    // Bond spike (delta > 2, both in tribe)
    (ep.bondChanges || [])
      .filter(c => c.delta > 2 && playerSet.has(c.a) && playerSet.has(c.b) && !alreadyMentioned(c.a, c.b))
      .forEach(c => cards.push({ weight: 1, type: 'bondSpike', players: [c.a, c.b],
        text: `${c.a} and ${c.b} got closer this episode. On a tribe this small, that matters.`,
        badge: '+ Bond', badgeClass: 'green' }));

    return cards.sort((a,b) => b.weight - a.weight).slice(0, 5);
  }
  ```

- [ ] **Step 2: Inject signal cards into `rpBuildCampTribe()` camp events section**

  In `rpBuildCampTribe()`, find the section after `events.forEach(evt => { ... })` loop ends (around line 12381). Before the closing `html += '</div></div>'` of the camp events toggle section, add:

  ```js
  // Signal cards — engine events not yet surfaced as camp narrative
  const _signals = buildSignalCards(ep, portraitMembers);
  if (_signals.length) {
    html += `<div class="vp-section-header">Engine signals</div>`;
    _signals.forEach((sig, i) => {
      html += `<div class="rp-brant-entry" style="animation:staggerIn 0.4s var(--ease-broadcast) ${i * 80}ms both">`;
      if (sig.players.length >= 2) html += `<div class="rp-brant-portraits">${rpDuoImg(sig.players[0], sig.players[1])}</div>`;
      else if (sig.players.length === 1) html += `<div class="rp-brant-portraits">${rpPortrait(sig.players[0])}</div>`;
      html += `<div class="rp-brant-text">${sig.text}</div>`;
      html += `<span class="rp-brant-badge ${sig.badgeClass}">${sig.badge}</span>`;
      html += `</div>`;
    });
  }
  ```

- [ ] **Step 3: Add post-merge event grouping**

  In `rpBuildCampTribe()`, find where `events.forEach(evt => ...)` is called. **First**, read lines 12280–12405 to find the exact body of that loop. The body appends HTML directly to the outer `html` variable (it does NOT return a string — it's a closure appender).

  Extract the body by converting `events.forEach(evt => { <body> })` to a named function before it:

  ```js
  // BEFORE the events.forEach call, add:
  const renderEvt = evt => {
    // <paste the exact existing body from the forEach here, verbatim>
    // Body appends to `html` directly via closure — no return statement needed
  };
  ```

  **Then** replace `events.forEach(evt => { <body> })` with:

  ```js
  if (isMerge && events.length > 0) {
    const strategyTypes = new Set(['doubt','paranoia','tempBloc','idol','allianceForm','allianceCrack',
      'socialBomb','socialBombReaction','chalThreat','chalThreatReaction','ftcThreatAlert','ftcThreatStrategist']);
    const spotlightTypes = new Set(['comfortBlindspot','clockingIt']);
    const strategy = events.filter(e => strategyTypes.has(e.type));
    const spotlight = events.filter(e => spotlightTypes.has(e.type));
    const social = events.filter(e => !strategyTypes.has(e.type) && !spotlightTypes.has(e.type));

    // renderGroup appends header to html, then calls renderEvt for each event.
    // renderEvt appends to html directly (closure), so no return value needed.
    const renderGroup = (label, evts, accent) => {
      if (!evts.length) return;
      html += `<div class="vp-section-header ${accent}">${label}</div>`;
      evts.forEach(evt => renderEvt(evt));
    };
    renderGroup('Strategy', strategy, 'fire');
    renderGroup('Social', social, '');
    renderGroup('Spotlight', spotlight, 'gold');
  } else {
    events.forEach(evt => renderEvt(evt));
  }
  ```

- [ ] **Step 4: Apply time-of-day classes**

  Find `<div class="rp-page` in `rpBuildCampTribe`. The function receives a `phase` param (`'pre'` or `'post'`). Apply:
  - Pre-challenge camp: `tod-midday`
  - Post-challenge camp: `tod-afternoon`

  (`tod-golden` is reserved for the Relationships screen — do not use it here.)

- [ ] **Step 5: Verify**

  Run a season to merge. Camp Life post-merge should show grouped sections (Strategy / Social / Spotlight). Any episode with betrayals, bond breaks, or close votes should show signal cards at the bottom of the camp events section.

- [ ] **Step 6: Commit**

  ```bash
  git add simulator.html
  git commit -m "feat(vp): camp life — post-merge grouping, signal card injection (5-card cap)"
  ```

---

## Task 7: Relationships / Alliance State Screen (NEW)

**Files:**
- Modify: `simulator.html` — add `rpBuildRelationships()` near line 12225, insert into `vpScreens.push()` block after post-challenge camp (~line 15249)

- [ ] **Step 1: Add `rpBuildRelationships()` before `rpBuildCampTribe`**

  ```js
  function rpBuildRelationships(ep) {
    const alliances = ep.gsSnapshot?.namedAlliances || [];
    const active = ep.gsSnapshot?.activePlayers || gs.activePlayers;
    const bondChanges = ep.bondChanges || [];
    const recruits = ep.allianceRecruits || [];
    const quits = ep.allianceQuits || [];

    // Betrayals this episode
    const betrayalsThisEp = alliances.flatMap(a =>
      (a.betrayals || []).filter(b => b.ep === ep.num)
        .map(b => ({ ...b, allianceName: a.name }))
    );

    let html = `<div class="rp-page tod-golden">
      <div class="rp-eyebrow">Episode ${ep.num}</div>
      <div class="rp-title">Relationships</div>`;

    // Alliance cards
    if (alliances.length) {
      html += `<div class="vp-section-header ice">Alliances</div>`;
      alliances.forEach((a, i) => {
        const members = a.members.filter(n => active.includes(n));
        const aRecruits = recruits.filter(r => r.toAlliance === a.name).map(r => r.player);
        const aQuits = quits.filter(q => q.alliance === a.name).map(q => q.player);
        html += `<div class="vp-card ice" style="animation:slideInLeft 0.4s var(--ease-broadcast) ${i * 100}ms both;margin-bottom:10px">
          <div style="font-family:var(--font-display);font-size:14px;letter-spacing:1px;margin-bottom:8px">${a.name}</div>
          <div class="rp-portrait-row" style="margin-bottom:8px">${members.map(n => rpPortrait(n)).join('')}</div>`;
        if (aRecruits.length) html += `<div style="font-size:11px;color:var(--accent-ice)">+ Joined: ${aRecruits.join(', ')}</div>`;
        if (aQuits.length) html += `<div style="font-size:11px;color:var(--accent-fire)">− Left: ${aQuits.join(', ')}</div>`;
        html += `</div>`;
      });
    }

    // Bond shifts
    const topShifts = [...bondChanges].sort((a,b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 5);
    if (topShifts.length) {
      html += `<div class="vp-section-header">Bond shifts this episode</div>`;
      topShifts.forEach(c => {
        const col = c.delta > 0 ? 'var(--accent-ice)' : 'var(--accent-fire)';
        const sign = c.delta > 0 ? '+' : '';
        html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px">
          <span>${c.a} &amp; ${c.b}</span>
          <span style="color:${col};font-family:var(--font-mono);font-size:12px">${sign}${c.delta.toFixed(1)}</span>
        </div>`;
      });
    }

    // Betrayals
    if (betrayalsThisEp.length) {
      html += `<div class="vp-section-header fire">Betrayals</div>`;
      betrayalsThisEp.forEach(b => {
        html += `<div class="vp-card fire" style="margin-bottom:8px">
          <div style="font-size:13px">${b.player} voted against <strong>${b.allianceName}</strong></div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">Voted for ${b.votedFor} (alliance wanted ${b.consensusWas})</div>
        </div>`;
      });
    }

    html += `</div>`;
    return html;
  }
  ```

- [ ] **Step 2: Insert into VP builder after post-challenge camp, before Voting Plans**

  Find the comment `// ── 8. Voting Plans` (line 15250). Insert before it:

  ```js
  // ── Relationships / Alliance State (after post-camp, before voting plans) ──
  if (hasTribal || ep.bondChanges?.length || (ep.gsSnapshot?.namedAlliances?.length)) {
    const _relHtml = rpBuildRelationships(ep);
    if (_relHtml) vpScreens.push({ id:'relationships', label:'Relationships', html: _relHtml });
  }
  ```

- [ ] **Step 3: Verify**

  Run a season with alliances formed. The "Relationships" screen should appear between Camp Life and Voting Plans, showing alliance cards sliding in, bond shifts, and any betrayals.

- [ ] **Step 4: Commit**

  ```bash
  git add simulator.html
  git commit -m "feat(vp): add Relationships / Alliance State screen with sliding alliance cards"
  ```

---

## Task 8: Voting Plans — gap fixes

**Files:**
- Modify: `simulator.html` — `rpBuildVotingPlans()` (line 12703)

- [ ] **Step 1: Read `rpBuildVotingPlans()`**

  Read lines 12703–13783 to understand current rendering structure before modifying.

- [ ] **Step 2: Add CHECKED OUT badge for comfort blindspot player**

  In `rpBuildVotingPlans()`, find where individual player plan cards are rendered. For each player card, check `ep.comfortBlindspotPlayer === playerName` and inject the badge:

  ```js
  if (ep.comfortBlindspotPlayer === playerName) {
    cardHtml += `<span class="rp-brant-badge gold">⭐ CHECKED OUT</span>`;
  }
  ```

- [ ] **Step 3: Add defection callout before plan reveal section**

  After the plan cards are built but before they're added to `html`, check `ep.defections`:

  ```js
  if (ep.defections?.length) {
    const defHtml = ep.defections.map(d =>
      `<div class="vp-card fire" style="margin-bottom:8px">
        <div style="font-size:13px"><strong>${d.player}</strong> broke from ${d.alliance}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">Voted ${d.votedFor} — alliance wanted ${d.consensusWas}</div>
      </div>`
    ).join('');
    html += `<div class="vp-section-header fire">Defectors</div>${defHtml}`;
  }
  ```

- [ ] **Step 4: Apply dusk time-of-day class**

  Find `<div class="rp-page` in `rpBuildVotingPlans` and add `tod-dusk` class.

- [ ] **Step 5: Verify**

  Run several episodes. On any episode where a comfort blindspot player went to tribal, their plan card should show `⭐ CHECKED OUT`. On any episode with defections, a "Defectors" section should appear.

- [ ] **Step 6: Commit**

  ```bash
  git add simulator.html
  git commit -m "feat(vp): voting plans — CHECKED OUT badge, defection callout, dusk palette"
  ```

---

## Task 9: Challenge — interactive reveal

**Files:**
- Modify: `simulator.html` — `rpBuildChallenge()` (line 12512)

- [ ] **Step 1: Read `rpBuildChallenge()`**

  Read lines 12512–12624 to understand current rendering before modifying.

- [ ] **Step 2: Replace with interactive post-merge individual reveal**

  In `rpBuildChallenge()`, detect post-merge using the episode snapshot (not live `gs.isMerged`, which may reflect a different episode when viewing past VP records). When true and `ep.chalPlacements?.length`:

  ```js
  if ((ep.gsSnapshot?.isMerged || gs.isMerged) && ep.chalPlacements?.length) {
    const placements = ep.chalPlacements; // index 0 = winner
    const winner = ep.immunityWinner;

    // "On the line" — top 3 threat scores who aren't immune
    const threatened = (ep.tribalPlayers || gs.activePlayers)
      .filter(n => n !== winner)
      .sort((a,b) => threatScore(b) - threatScore(a))
      .slice(0, 3);

    html += `<div class="rp-page tod-dusk">
      <div class="rp-eyebrow">Episode ${ep.num} — Individual Immunity</div>
      <div class="rp-title">${ep.challengeLabel || 'Immunity Challenge'}</div>`;

    if (ep.challengeDesc) html += `<div style="font-size:13px;color:var(--muted);margin-bottom:16px">${ep.challengeDesc}</div>`;

    if (threatened.length) {
      html += `<div class="vp-section-header fire">Needed this</div>`;
      threatened.forEach(n => {
        html += `<div class="vp-card fire" style="margin-bottom:8px;display:flex;align-items:center;gap:12px">
          ${rpPortrait(n)}
          <span style="font-size:13px">${n}</span>
        </div>`;
      });
    }

    // Reveal card — revealed[] tracks which positions are shown
    const totalPlayers = placements.length;
    const revealId = `chal-reveal-${ep.num}`;
    html += `<div class="vp-section-header">Finishing order</div>
      <div id="${revealId}" data-placements='${JSON.stringify(placements)}' data-revealed="0" data-winner="${winner}">
        ${placements.map((_, i) => `<div class="chal-slot" id="${revealId}-slot-${i}" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);opacity:0.15">
          <span style="font-family:var(--font-mono);font-size:11px;color:var(--muted);width:24px">${totalPlayers - i}</span>
          <span style="color:var(--muted)">?</span>
        </div>`).join('')}
      </div>
      <div style="display:flex;gap:12px;margin-top:16px;align-items:center">
        <button onclick="vpRevealNextPlacement('${revealId}')" style="padding:8px 20px;background:var(--accent-fire);border:none;border-radius:6px;color:#fff;font-family:var(--font-display);font-size:13px;letter-spacing:1px;cursor:pointer">REVEAL</button>
        <button onclick="vpRevealAllPlacements('${revealId}')" style="padding:6px 12px;background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:11px;cursor:pointer">See all results</button>
      </div>`;

    html += `</div>`;
    return html;
  }
  ```

- [ ] **Step 3: Add `vpRevealNextPlacement()` and `vpRevealAllPlacements()` JS functions**

  Add near the other VP utility functions (search for `vpToggleSection`):

  ```js
  function vpRevealNextPlacement(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const placements = JSON.parse(el.dataset.placements);
    const revealed = parseInt(el.dataset.revealed);
    if (revealed >= placements.length) return;

    // Reveal from last place (index = placements.length-1) to first (index 0)
    const revealIdx = placements.length - 1 - revealed;
    const playerName = placements[revealIdx];
    const isWinner = playerName === el.dataset.winner;
    const slot = document.getElementById(`${containerId}-slot-${revealIdx}`);
    if (!slot) return;

    const place = placements.length - revealIdx;
    const flavors = { physical: 'Physical dominance.', strategic: 'Read the comp perfectly.', endurance: 'Outlasted everyone.' };
    const stat = Object.keys(flavors).find(k => (pStats(playerName)?.[k] || 0) >= 7);
    const flavor = stat ? flavors[stat] : 'Fought for it.';

    slot.style.opacity = '1';
    slot.innerHTML = `
      <span style="font-family:var(--font-mono);font-size:11px;color:var(--muted);width:24px">${place === 1 ? '🥇' : place}</span>
      ${rpPortrait(playerName)}
      <span style="font-size:13px${isWinner ? ';color:var(--accent-gold);font-family:var(--font-display)' : ''}">${playerName}</span>
      ${isWinner ? `<span class="rp-brant-badge gold">IMMUNE</span><span style="font-size:11px;color:var(--muted);margin-left:8px">${flavor}</span>` : ''}
    `;
    slot.style.animation = 'staggerIn 0.35s var(--ease-broadcast) both';
    if (isWinner) slot.style.boxShadow = '0 0 0 1px var(--accent-gold)';

    el.dataset.revealed = revealed + 1;
  }

  function vpRevealAllPlacements(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const placements = JSON.parse(el.dataset.placements);
    const total = placements.length;
    // Reset to 0 first, then call vpRevealNextPlacement total times.
    // Do NOT set el.dataset.revealed inside the loop — vpRevealNextPlacement
    // increments it internally; setting it externally would corrupt the counter.
    el.dataset.revealed = '0';
    for (let i = 0; i < total; i++) {
      vpRevealNextPlacement(containerId);
    }
  }
  ```

- [ ] **Step 4: Add pre-merge tribe reveal (interactive)**

  In `rpBuildChallenge()`, for pre-merge (`ep.challengePlacements?.length`):

  The tribe reveal hides tribe identity (name/color/result) but shows individual hierarchy and sit-outs. Each tribe gets a "REVEAL" button. Tribes reveal from last to first.

  ```js
  } else if (ep.challengePlacements?.length) {
    const tribePlacements = ep.challengePlacements; // ordered 1st(winner) to last(loser)
    const sitOuts = ep.chalSitOuts || {};
    const memberScores = ep.chalMemberScores || {};

    const revealId = `tribe-chal-reveal-${ep.num}`;
    html += `<div class="rp-page tod-afternoon">
      <div class="rp-eyebrow">Episode ${ep.num} — Tribe Immunity</div>
      <div class="rp-title">${ep.challengeLabel || 'Immunity Challenge'}</div>`;

    if (ep.challengeDesc) html += `<div style="font-size:13px;color:var(--muted);margin-bottom:16px">${ep.challengeDesc}</div>`;

    // Render tribes from last(loser) to first(winner) — but show member hierarchy always
    const orderedForReveal = [...tribePlacements].reverse(); // loser first
    orderedForReveal.forEach((tribe, i) => {
      const tName = tribe.name;
      const tMembers = tribe.members || [];
      const sos = sitOuts[tName] || [];
      const competitors = tMembers.filter(n => !sos.includes(n));
      const rankedCompetitors = [...competitors].sort((a,b) => (memberScores[b]||0) - (memberScores[a]||0));
      const slotId = `${revealId}-tribe-${i}`;
      const isWinner = i === orderedForReveal.length - 1;
      const resultBadge = isWinner ? '<span class="rp-brant-badge gold">WIN</span>' : '<span class="rp-brant-badge red">LOSS</span>';

      html += `<div class="vp-card" style="margin-bottom:12px">
        <div id="${slotId}-header" style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <span id="${slotId}-name" style="font-family:var(--font-display);font-size:16px;color:var(--muted)">Tribe ?</span>
          <span id="${slotId}-badge" style="display:none">${resultBadge}</span>
          <button onclick="vpRevealTribe('${slotId}','${tName}')" style="margin-left:auto;padding:4px 12px;background:var(--accent-fire);border:none;border-radius:4px;color:#fff;font-size:11px;cursor:pointer">REVEAL</button>
        </div>
        <div class="rp-portrait-row" style="margin-bottom:8px">
          ${rankedCompetitors.map((n,ri) => `<div style="text-align:center">
            ${rpPortrait(n)}
            <div style="font-size:9px;color:var(--muted);margin-top:2px">#${ri+1}</div>
          </div>`).join('')}
        </div>
        ${sos.length ? `<div style="font-size:11px;color:var(--muted);margin-top:4px">Sit-outs: ${sos.map(n => `<strong>${n}</strong>`).join(', ')}</div>` : ''}
      </div>`;
    });

    html += `<button onclick="vpRevealAllTribes('${revealId}',${JSON.stringify(orderedForReveal.map((t,i)=>({slotId:`${revealId}-tribe-${i}`,name:t.name})))})"
      style="padding:6px 12px;background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:11px;cursor:pointer;margin-top:8px">See all results</button>`;
    html += `</div>`;
    return html;
  }
  ```

- [ ] **Step 5: Add `vpRevealTribe()` and `vpRevealAllTribes()` utility functions**

  ```js
  function vpRevealTribe(slotId, tribeName) {
    const nameEl = document.getElementById(`${slotId}-name`);
    const badgeEl = document.getElementById(`${slotId}-badge`);
    if (nameEl) {
      nameEl.textContent = tribeName;
      nameEl.style.color = tribeColor(tribeName);
    }
    if (badgeEl) badgeEl.style.display = '';
  }

  function vpRevealAllTribes(revealId, slots) {
    slots.forEach(s => vpRevealTribe(s.slotId, s.name));
  }
  ```

- [ ] **Step 6: Post-merge suspense signal cards (after result)**

  After the individual challenge result is built (still inside the post-merge branch), add:

  ```js
  // Suspense cards
  const _suspense = [];
  (ep.tribalPlayers || gs.activePlayers).forEach(n => {
    if (n === winner) return;
    if (threatScore(n) > 6) {
      _suspense.push({ player: n, text: `${n} didn't get the necklace. The target on their back just got bigger.`, type: 'fire' });
    }
  });
  const _gameMedian = [...(ep.tribalPlayers || gs.activePlayers)].map(n => {
    const oth = (ep.tribalPlayers || gs.activePlayers).filter(p => p !== n);
    return oth.length ? oth.reduce((s,p) => s + getBond(n,p),0)/oth.length : 0;
  }).sort((a,b)=>a-b)[Math.floor((ep.tribalPlayers||gs.activePlayers).length/2)] || 0;
  const _winnerAvgBond = ((ep.tribalPlayers || gs.activePlayers).filter(p=>p!==winner).reduce((s,p)=>s+getBond(winner,p),0)) / Math.max(1,(ep.tribalPlayers||gs.activePlayers).length-1);
  if (_winnerAvgBond < _gameMedian) {
    _suspense.unshift({ player: winner, text: `${winner} bought themselves one more day.`, type: 'ice' });
  }
  _suspense.slice(0, 2).forEach(s => {
    html += `<div class="vp-card ${s.type}" style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
      ${rpPortrait(s.player)}
      <span style="font-size:13px">${s.text}</span>
    </div>`;
  });
  ```

- [ ] **Step 7: Verify**

  Run a season. Pre-merge challenge: tribe names hidden, player hierarchy visible, sit-outs always shown, REVEAL button works tribe by tribe. Post-merge: numbered reveal from last to winner, tally animation, gold glow on winner, suspense cards below.

- [ ] **Step 8: Commit**

  ```bash
  git add simulator.html
  git commit -m "feat(vp): challenge — interactive reveal (individual + tribe), suspense cards"
  ```

---

## Task 10: Tribal Council — atmospheric redesign + stumps

**Files:**
- Modify: `simulator.html` — `rpBuildTribal()` (line 13784)

- [ ] **Step 1: Read `rpBuildTribal()`**

  Read lines 13784–14029 to understand current layout before modifying.

- [ ] **Step 2: Apply night time-of-day class + torch flicker overlay**

  Find `<div class="rp-page` in `rpBuildTribal` and replace with:

  ```js
  `<div class="rp-page tod-night" style="position:relative;overflow:hidden">`
  ```

  Immediately after, add the torch flicker overlay:

  ```js
  html += `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 100%, rgba(232,135,58,0.15), transparent 70%);pointer-events:none;animation:torchFlicker 3.5s ease-in-out infinite alternate"></div>`;
  ```

- [ ] **Step 3: Upgrade "TRIBAL COUNCIL" header**

  Find the header that displays "Tribal Council" or similar. Change it to:

  ```js
  html += `<div style="font-family:var(--font-display);font-size:48px;letter-spacing:2px;text-align:center;text-shadow:0 0 24px #e8873a,0 0 8px rgba(232,135,58,0.5);margin-bottom:24px">TRIBAL COUNCIL</div>`;
  ```

- [ ] **Step 4: Replace portrait row with stump seating**

  Find where player portraits are rendered in the main seating row. Replace each `rpPortrait(n)` call with a stump-wrapped version:

  ```js
  const totalPlayers = seatPlayers.length;
  seatPlayers.map((n, i) => {
    const isOuter = i === 0 || i === 1 || i === totalPlayers - 1 || i === totalPlayers - 2;
    const arcOffset = isOuter ? 'transform:translateY(6px)' : '';
    return `<div class="vp-stump-wrap" style="${arcOffset};animation:staggerIn 0.4s var(--ease-broadcast) ${i * 60}ms both">
      ${rpPortrait(n)}
      <div class="vp-stump"></div>
    </div>`;
  }).join('')
  ```

- [ ] **Step 5: Add mood indicators (emotional state badges)**

  After the stump row, add a small emotional state row:

  ```js
  const moodColor = { comfortable: '#10b981', confident: 'var(--accent-ice)', paranoid: 'var(--accent-fire)', desperate: '#c0392b' };
  html += `<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:12px 0">`;
  seatPlayers.forEach(n => {
    const state = gs.playerStates?.[n]?.emotional || 'comfortable';
    html += `<span style="font-size:10px;padding:2px 8px;border-radius:10px;border:1px solid ${moodColor[state]||'var(--border)'};color:${moodColor[state]||'var(--muted)'}">${n}: ${state}</span>`;
  });
  html += `</div>`;
  ```

- [ ] **Step 6: Add parchment urn divider**

  Before the vote area, add:

  ```js
  html += `<div class="vp-card" style="text-align:center;font-family:var(--font-mono);font-style:italic;border-color:var(--accent-fire);color:var(--muted);margin:20px 0;font-size:14px">
    "The votes have been cast."
  </div>`;
  ```

- [ ] **Step 7: Add comfort blindspot note**

  ```js
  if (ep.comfortBlindspotPlayer) {
    html += `<div class="vp-card fire" style="font-size:13px;margin-top:12px">
      <strong>${ep.comfortBlindspotPlayer}</strong> was seen checked out at camp before Tribal — the tribe noticed.
    </div>`;
  }
  ```

- [ ] **Step 8: Verify**

  Run a season to a tribal episode. Open VP Tribal Council screen. Should show: dark night atmosphere with amber glow from bottom, "TRIBAL COUNCIL" with fire glow text shadow, portraits sitting on wooden stumps in an arc, emotional state badges, parchment urn divider.

- [ ] **Step 9: Commit**

  ```bash
  git add simulator.html
  git commit -m "feat(vp): tribal council — stumps, torch flicker, mood badges, urn divider"
  ```

---

## Task 11: Vote Reveal — staggered animation + torch-snuff

**Files:**
- Modify: `simulator.html` — `rpBuildVotes()` (line 14030)

- [ ] **Step 1: Read `rpBuildVotes()`**

  Read lines 14030–14729 to understand the current vote card rendering.

- [ ] **Step 2: Apply deep night time-of-day class**

  Find `<div class="rp-page` in `rpBuildVotes` and add `tod-deepnight` class.

- [ ] **Step 3: Add staggered animation to vote card reveals**

  Find where vote cards are rendered (look for `.tv-vote-card` or similar class). Each card gets a stagger delay:

  ```js
  // Add to each card's inline style:
  `animation:staggerIn 0.35s var(--ease-broadcast) ${cardIndex * 120}ms both`
  ```

  Also add `opacity:0` initially so `staggerIn` works correctly.

- [ ] **Step 4: Add tally count-up via JS**

  Each tally number element gets a `data-target` attribute with the final count. After the VP loads, a small JS function increments it:

  ```js
  // Add to tally number elements:
  `<span class="vp-tally-num" data-target="${tallyCount}">0</span>`

  // Add utility function near vpToggleSection:
  function vpAnimateTallies(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.vp-tally-num[data-target]').forEach((el, i) => {
      const target = parseInt(el.dataset.target);
      let current = 0;
      const duration = 600;
      const startTime = performance.now() + i * 200;
      function tick(now) {
        if (now < startTime) { requestAnimationFrame(tick); return; }
        const elapsed = now - startTime;
        current = Math.min(target, Math.round((elapsed / duration) * target));
        el.textContent = current;
        if (current < target) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }
  ```

  Hook `vpAnimateTallies` into screen display. In `renderVPScreen()` (line 15308), after `content.innerHTML = cur.html;`, add:
  ```js
  if (cur.id === 'votes' || cur.id?.startsWith('votes-')) {
    vpAnimateTallies(cur.id);
  }
  ```

  > **Sequencing note:** The spec says one tally counts before the next card enters (fully sequential). This plan uses CSS stagger for card entrance and a staggered `startTime` offset for tallies — these are parallel but offset, producing a close-enough sequential feel without the complexity of promise-chaining. Acceptable for this implementation.

- [ ] **Step 5: Add torch-snuff on eliminated player**

  After all votes are displayed, find where the eliminated player's portrait is shown. Add `.torch-snuffed` class and the "tribe has spoken" text:

  ```js
  if (ep.eliminated) {
    html += `<div id="torch-snuff-${ep.num}" style="text-align:center;margin-top:24px">
      <div class="torch-snuffed">${rpPortrait(ep.eliminated, 'xl')}</div>
      <div style="font-family:var(--font-display);font-size:24px;color:var(--accent-fire);margin-top:16px;text-shadow:0 0 12px var(--accent-fire)">The tribe has spoken.</div>
    </div>`;
  }
  ```

  The `.torch-snuffed` CSS uses `@keyframes torchSnuff` (added in Task 1), not a CSS transition. CSS **animations** fire automatically when an element with the class is inserted into the DOM via `innerHTML`. No JS hook needed — the dimming will start 1.5s after the vote screen is rendered.

- [ ] **Step 6: Verify**

  Run to a tribal episode. Vote cards should fade in staggered. Tally numbers count up. Eliminated player's portrait dims after a moment with "The tribe has spoken." below.

- [ ] **Step 7: Commit**

  ```bash
  git add simulator.html
  git commit -m "feat(vp): vote reveal — staggered cards, tally count-up, torch-snuff animation"
  ```

---

## Task 12: RI Duel Screen (NEW)

**Files:**
- Modify: `simulator.html` — add `rpBuildRIDuel()` near `rpBuildPostElimTwist` (line 12018), insert into `vpScreens.push()` block after Vote Reveal

- [ ] **Step 1: Add `rpBuildRIDuel()` after `rpBuildPostElimTwist` (line 12043)**

  ```js
  // ── RI Duel Screen (NEW) ──
  function rpBuildRIDuel(ep) {
    const duel = ep.riDuel;
    if (!duel) return null;
    const { winner, loser } = duel;
    const isLoserFinalElim = (ep.gsSnapshot?.eliminated || []).includes(loser);

    const wStats = pStats(winner);
    const flavorMap = { physical: 'A dominant physical performance.', endurance: 'Outlasted the challenger.', mental: 'Puzzle solved under pressure.', strategic: 'Smart comp strategy — knew when to push.' };
    const topStat = Object.entries(flavorMap).sort(([a],[b]) => (wStats[b]||0) - (wStats[a]||0))[0];
    const flavor = topStat ? flavorMap[topStat[0]] : 'Won when it mattered.';

    let html = `<div class="rp-page tod-arena">
      <div class="rp-eyebrow">Episode ${ep.num} — Redemption Island</div>
      <div style="font-family:var(--font-display);font-size:32px;letter-spacing:2px;text-align:center;margin-bottom:24px">REDEMPTION ISLAND DUEL</div>
      <div style="display:flex;justify-content:center;align-items:flex-start;gap:32px;margin-bottom:24px">
        <div style="text-align:center">
          ${rpPortrait(winner, 'xl')}
          <div style="font-family:var(--font-display);font-size:14px;margin-top:8px">${winner}</div>
          <span class="rp-brant-badge gold" style="margin-top:4px">WINS</span>
        </div>
        <div style="font-family:var(--font-display);font-size:28px;color:var(--accent-fire);align-self:center">VS</div>
        <div style="text-align:center" ${isLoserFinalElim ? 'class="torch-snuffed"' : ''}>
          ${rpPortrait(loser, 'xl')}
          <div style="font-family:var(--font-display);font-size:14px;margin-top:8px">${loser}</div>
          <span class="rp-brant-badge red" style="margin-top:4px">${isLoserFinalElim ? 'Eliminated' : 'Loses'}</span>
        </div>
      </div>
      <div style="text-align:center;font-size:13px;color:var(--muted);margin-bottom:16px">${flavor}</div>
      <div style="text-align:center;font-size:13px">
        ${winner} remains on Redemption Island.
        ${isLoserFinalElim ? `${loser} has been permanently eliminated.` : `${loser} loses the duel.`}
      </div>
    </div>`;
    return html;
  }
  ```

- [ ] **Step 2: Insert into VP builder after Vote Reveal**

  Find the `vpScreens.push({ id:'votes'` line (line 15270). After it, add:

  ```js
  // ── RI Duel (when ep.riDuel fired) ──
  if (ep.riDuel) {
    const _riHtml = rpBuildRIDuel(ep);
    if (_riHtml) vpScreens.push({ id:'ri-duel', label:'RI Duel', html: _riHtml });
  }
  ```

  Also add it after the multi-tribal votes block for completeness:

  ```js
  // After ep.multiTribalResults forEach:
  if (ep.riDuel) {
    const _riHtml = rpBuildRIDuel(ep);
    if (_riHtml) vpScreens.push({ id:'ri-duel', label:'RI Duel', html: _riHtml });
  }
  ```

- [ ] **Step 3: Verify**

  Run a season with Redemption Island enabled (check `seasonConfig.ri`). On an episode where a duel fires (`ep.riDuel !== null`), the "RI Duel" screen should appear in the sidebar after Votes showing a face-off portrait layout.

- [ ] **Step 4: Commit**

  ```bash
  git add simulator.html
  git commit -m "feat(vp): add RI Duel screen with VS face-off layout"
  ```

---

## Task 13: WHY This Vote Happened — gap fixes

**Files:**
- Modify: `simulator.html` — `rpBuildAftermath()` (line 14730)

- [ ] **Step 1: Read `rpBuildAftermath()`**

  Read lines 14730–15013 to understand current rendering before modifying.

- [ ] **Step 2: Add comfort blindspot callout**

  Near the beginning of `rpBuildAftermath()`, after the eliminated player header is built, add:

  ```js
  if (ep.comfortBlindspotPlayer && ep.comfortBlindspotPlayer === ep.eliminated) {
    html += `<div class="vp-card fire" style="margin-bottom:12px">
      <div style="font-family:var(--font-display);font-size:11px;letter-spacing:1px;color:var(--accent-fire);margin-bottom:4px">Checked Out</div>
      <div style="font-size:13px">${ep.eliminated} was seen checked out at camp before Tribal — the tribe noticed.</div>
    </div>`;
  }
  ```

- [ ] **Step 3: Add rival tip-off note in idol misplay section**

  Find where `tipOffAlly` or idol misplay ally analysis is rendered. After the ally's intuition stat display, check `isRivalTipOff`:

  ```js
  if (entry.isRivalTipOff) {
    html += `<div style="font-size:11px;color:var(--accent-fire);margin-top:4px">(Note: this ally was in a rival alliance.)</div>`;
  }
  ```

- [ ] **Step 4: Add alliance recruitment note**

  At the end of `rpBuildAftermath()`, before the closing `</div>`, add:

  ```js
  if (ep.allianceRecruits?.length) {
    html += `<div class="vp-section-header gold">Alliance movement this episode</div>`;
    ep.allianceRecruits.forEach(r => {
      html += `<div class="vp-card gold" style="margin-bottom:8px;font-size:13px">
        <strong>${r.player}</strong> joined <strong>${r.toAlliance}</strong>${r.fromAlliance ? ` (left ${r.fromAlliance})` : ''}.
        <div style="font-size:11px;color:var(--muted);margin-top:4px">This shifted the numbers going into Tribal.</div>
      </div>`;
    });
  }
  ```

- [ ] **Step 5: Apply post-tribal time-of-day class**

  Find `<div class="rp-page` in `rpBuildAftermath` and add `tod-posttribal` class.

- [ ] **Step 6: Verify**

  Run several episodes. On an episode where the comfort blindspot player was eliminated, the WHY screen should show a "Checked Out" callout. On any episode with alliance recruitment, a gold section should appear at the bottom.

- [ ] **Step 7: Commit**

  ```bash
  git add simulator.html
  git commit -m "feat(vp): aftermath — comfort blindspot callout, rival tip-off note, alliance recruitment"
  ```

---

## Task 14: Twist Pages — dramatic atmosphere

**Files:**
- Modify: `simulator.html` — `rpBuildPreTwist()` (line 11993), `rpBuildPostElimTwist()` (line 12018), internal twist block/scene functions (lines 12046–12225)

- [ ] **Step 1: Read twist builder functions to confirm names**

  Read lines 12018–12225 to confirm the exact names of:
  - The function that builds twist scene blocks (likely `_buildPostTwistBlocks` or similar)
  - The function that renders individual twist scenes (likely `_renderTwistScene` or inline)

  Steps 3–5 reference these by name — **do not proceed until you have confirmed them**.

- [ ] **Step 2: Apply time-of-day classes to base twist pages**

  In `rpBuildPreTwist()`, find `<div class="rp-page rp-twist-page">` and add `tod-dusk` class.
  In `rpBuildPostElimTwist()`, find `<div class="rp-page rp-twist-page">` and add `tod-deepnight` class.

- [ ] **Step 3: Upgrade twist title styling (gold glow)**

  Find `.rp-twist-title` CSS class in the stylesheet. Add:

  ```css
  .rp-twist-title {
    text-shadow: 0 0 20px #f0c040, 0 0 8px rgba(240,192,64,0.5);
    animation: scrollDrop 0.4s var(--ease-broadcast) both;
  }
  ```

- [ ] **Step 4: Add face-off visual for duel-type twists**

  In the post-twist block builder (confirmed in Step 1), after each duel block (`2nd Chance Duel`, `Fire Making`) is pushed, inject a face-off scene at the start of `sc`:

  For the exile duel block, inject at the start of `sc`:
  ```js
  sc.unshift({
    text: '', players: [dr.exilePlayer, dr.newBoot],
    faceOff: true, // flag for renderer
  });
  ```

  In the twist scene renderer (confirmed in Step 1), add handling for `s.faceOff`:

  ```js
  if (s.faceOff && s.players?.length === 2) {
    return `<div style="display:flex;justify-content:center;align-items:flex-start;gap:32px;margin:16px 0">
      <div style="text-align:center">${rpPortrait(s.players[0],'xl')}<div style="font-family:var(--font-display);font-size:12px;margin-top:6px">${s.players[0]}</div></div>
      <div style="font-family:var(--font-display);font-size:28px;color:var(--accent-fire);align-self:center">VS</div>
      <div style="text-align:center">${rpPortrait(s.players[1],'xl')}<div style="font-family:var(--font-display);font-size:12px;margin-top:6px">${s.players[1]}</div></div>
    </div>`;
  }
  ```

- [ ] **Step 5: Jury Elimination — dark ceremonial treatment**

  In the post-twist block builder, find the Jury Elimination block. Before `blocks.push(...)`, add a jury portrait header to `sc`:

  ```js
  if (_jJury.length) {
    sc.unshift({
      text: '', players: _jJury.slice(0, 6),
      juryHeader: true,
    });
  }
  ```

  In the twist scene renderer, add handling:
  ```js
  if (s.juryHeader) {
    return `<div style="text-align:center;margin-bottom:16px">
      <div style="font-size:10px;letter-spacing:2px;color:var(--muted);font-family:var(--font-display);margin-bottom:8px">THE JURY</div>
      <div class="rp-portrait-row" style="justify-content:center">${s.players.map(n=>rpPortrait(n)).join('')}</div>
    </div>`;
  }
  ```

  Also apply a darker background to the jury elimination block — add a `darkCeremony: true` flag to the block, and in `rpBuildPostElimTwist()`, wrap jury elimination blocks in a `<div style="background:#030507;margin:-16px;padding:16px;border-radius:8px">`.

- [ ] **Step 6: Exile setup — lonely isolated treatment**

  Condition: `ep.exilePlayer && !ep.exileDuelResult` (player sent to exile, not a returning duel).

  In the post-twist block builder, find the exile-setup block (fires when `ep.exilePlayer` without a duel result). Before the first scene push, inject:

  ```js
  sc.unshift({
    text: 'Waiting.', players: [ep.exilePlayer],
    exileIsolated: true,
  });
  ```

  In the twist scene renderer:
  ```js
  if (s.exileIsolated) {
    return `<div style="text-align:center;padding:24px 0">
      ${rpPortrait(s.players[0],'xl')}
      <div style="font-family:var(--font-mono);font-style:italic;color:var(--muted);margin-top:12px;font-size:13px">${s.text}</div>
    </div>`;
  }
  ```

- [ ] **Step 7: Tribe Swap — "EVERYTHING JUST CHANGED" header**

  In `rpBuildPreTwist()`, detect swap-type twists and add a dramatic header:

  ```js
  const _swapTypes = ['tribe-swap','tribe-dissolve','tribe-expansion','abduction','swapvote','mutiny'];
  const _hasSwap = (ep.twists||[]).some(t => _swapTypes.includes(t.type)) || _swapTypes.includes(ep.twist?.type);
  if (_hasSwap) {
    html += `<div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:var(--accent-gold);text-shadow:0 0 20px var(--accent-gold);margin-bottom:20px;animation:scrollDrop 0.5s var(--ease-broadcast) both">EVERYTHING JUST CHANGED</div>`;
  }
  ```

- [ ] **Step 8: Verify**

  Run a season with RI/exile duel, fire making, and tribe swaps enabled. Each twist type should have its distinct visual atmosphere. Duel twists show VS face-off. Jury elimination shows jury portrait header. Exile shows isolated portrait. Tribe swap shows gold dramatic header.

- [ ] **Step 9: Commit**

  ```bash
  git add simulator.html
  git commit -m "feat(vp): twist pages — dramatic atmosphere, duel face-off, jury ceremony, exile isolation"
  ```

---

## Final Verification

- [ ] Run a full season (10+ episodes) with RI enabled, tribe swaps, alliances, and merge
- [ ] Open VP on each episode type and verify all 14 screens render correctly
- [ ] Check browser DevTools console — no JS errors
- [ ] Verify no spoilers appear on Tribal Council or Voting Plans screens
- [ ] Verify tribe history toggle persists across VP page loads (localStorage)
- [ ] Final commit if any cleanup needed

  ```bash
  git add simulator.html
  git commit -m "feat(vp): complete VP viewer redesign — broadcast aesthetic, 3 new screens, interactive reveals"
  ```
