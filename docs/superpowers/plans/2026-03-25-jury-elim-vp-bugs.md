# Jury Elimination VP Bugs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 3 VP viewer bugs for jury-elimination twist episodes: missing screens (camp life, voting plans, tribal, votes), spoiler twist screen, and old static challenge format.

**Architecture:** All bugs trace to 2 root causes: (1) the jury elimination early-return path in `runEpisode` saves a sparse episodeHistory record missing campEvents/chalPlacements/twists/etc., and (2) the VP screen builder doesn't have jury-elimination-specific flow logic. Fix the data save, exclude jury-elimination from pre-twist screen, then build a proper jury-elimination VP sequence with interactive vote reveal.

**Tech Stack:** Single-file HTML app (`simulator.html`), vanilla JS, CSS variables.

---

### Task 1: Fix episodeHistory save in jury elimination path

**Files:**
- Modify: `simulator.html:8361-8369`

The jury elimination path returns early with a bare-bones history push. It's missing: `campEvents`, `chalPlacements`, `chalMemberScores`, `challengeLabel`, `challengeCategory`, `challengeDesc`, `tribesAtStart`, `twists`, `twistScenes`, `alliances`, `tribalPlayers`, `votingLog`, `idolPlays`, `socialBombs`, `goatEvents`, `chalThreatEvents`, `allianceQuits`, `allianceRecruits`, `chalSitOuts`. This causes bugs 1 and 3.

- [ ] **Step 1: Replace sparse episodeHistory push with full push**

Replace lines 8361-8369 (the `gs.episode = epNum; ... saveGameState(); return ep;` block inside the `juryElimTw` handler) with a full push matching the normal path at lines 8536-8608.

Key differences from the normal path:
- `votes: {}` (no tribal vote happened)
- `votingLog: []` (no voting log)
- `alliances:` save the actual alliances (they were formed), not empty `[]`
- Include all challenge data fields
- After push: generate and save `twistScenes`, save `campEvents` and `tipOffCampEvents`
- After push: generate and save `summaryText`

```javascript
    // No tribal vote — jury elimination replaces it
    gs.episode = epNum;
    ep.bondChanges = updateBonds([], ep.eliminated, alliances);
    detectBetrayals(ep);
    applyPostTribalConsequences(ep);
    checkAllianceRecruitment(ep);
    if (gs.activePlayers.length <= cfg.finaleSize) gs.phase = 'finale';
    gs.episodeHistory.push({
      num: epNum, eliminated: ep.eliminated || null, firstEliminated: null, riChoice: null,
      immunityWinner: ep.immunityWinner || null,
      challengeType: ep.challengeType || 'individual', isMerge: ep.isMerge,
      challengeLabel: ep.challengeLabel || null,
      challengeCategory: ep.challengeCategory || null,
      challengeDesc: ep.challengeDesc || '',
      challengePlacements: ep.challengePlacements
        ? ep.challengePlacements.map(t => ({ name: t.name, members: [...(t.members||[])] }))
        : null,
      chalMemberScores: ep.chalMemberScores || null,
      chalPlacements: ep.chalPlacements || null,
      rewardChalData: (() => {
        const rct = (ep.twists||[]).find(t => t.type === 'reward-challenge');
        if (!rct) return null;
        return {
          winner: rct.rewardWinner, winnerType: rct.rewardWinnerType || 'individual',
          placements: rct.rewardChalPlacements || [], label: rct.rewardChalLabel || 'Reward Challenge',
          category: rct.rewardChalCategory || 'mixed', desc: rct.rewardChalDesc || '',
          rewardItemId: rct.rewardItemId || null, rewardItemLabel: rct.rewardItemLabel || null,
          rewardItemDesc: rct.rewardItemDesc || null, rewardCompanions: rct.rewardCompanions || null,
          rewardCluedPlayer: rct.rewardCluedPlayer || null,
        };
      })(),
      tribalTribe: null,
      tribalPlayers: ep.tribalPlayers ? [...ep.tribalPlayers] : null,
      votes: {}, alliances: (ep.alliances||[]).map(a=>({...a})),
      tribesAtStart: (ep.tribesAtStart || []).map(t => ({ name: t.name, members: [...t.members] })),
      twistScenes: [], campEvents: null, summaryText: '', gsSnapshot: snapshotGameState(),
      twists: (ep.twists||[]).map(t => ({...t})),
      votingLog: [],
      revoteLog: [],
      idolPlays: ep.idolPlays || [],
      shotInDark: null,
      socialBombs: ep.socialBombs || [],
      chalThreatEvents: ep.chalThreatEvents || [],
      goatEvents: ep.goatEvents || [],
      allianceQuits: ep.allianceQuits || [],
      allianceRecruits: ep.allianceRecruits || [],
      chalSitOuts: ep.chalSitOuts || null,
    });
    const twistScenesJE = generateTwistScenes(ep);
    gs.episodeHistory[gs.episodeHistory.length-1].twistScenes = twistScenesJE;
    ep.twistScenes = twistScenesJE;
    gs.episodeHistory[gs.episodeHistory.length-1].campEvents = ep.campEvents || null;
    gs.episodeHistory[gs.episodeHistory.length-1].tipOffCampEvents = ep.tipOffCampEvents || null;
    const stJE = generateSummaryText(ep);
    gs.episodeHistory[gs.episodeHistory.length-1].summaryText = stJE;
    ep.summaryText = stJE;
    updatePlayerStates(ep); decayAllianceTrust(ep.num);
    saveGameState(); return ep;
```

- [ ] **Step 2: Verify** — Simulate a season with jury-elimination twist. Confirm VP episode record includes campEvents, chalPlacements, twists, etc.

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "fix(engine): save full episodeHistory for jury-elimination episodes"
```

---

### Task 2: Exclude jury-elimination from pre-twist screen

**Files:**
- Modify: `simulator.html:13091` (rpBuildPreTwist filter)

- [ ] **Step 1: Filter out jury-elimination from twist scenes**

At line 13091, add `jury-elimination` to the filter:

```javascript
.filter(t => t.type !== 'exile-island' && t.type !== 'jury-elimination');
```

Also in the fallback text filter (lines 13095-13098), exclude jury elimination lines:

```javascript
const _noPostVote = l => !l.includes('Exile Island') && !l.startsWith('EXILE ISLAND')
                      && !l.startsWith('ELIMINATION SWAP') && !l.startsWith('EXILE DUEL')
                      && !l.startsWith('JURY ELIMINATION')
                      && !(ep.swapResult && l.includes(' in exchange'))
                      && !(ep.swapResult && l.startsWith('New ') && l.includes('member:'));
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "fix(vp): exclude jury-elimination from pre-twist screen to prevent spoiler"
```

---

### Task 3: Build jury elimination VP screen sequence in buildVPScreens

**Files:**
- Modify: `simulator.html:17526` (hasTribal check)
- Modify: `simulator.html:17662-17696` (regular episode tribal section)

For jury elimination episodes, the VP flow should be:
1. Cold Open
2. (The Merge — if merge episode)
3. Camp Life (pre-challenge) — now works via Task 1
4. Immunity Challenge (interactive) — now works via Task 1
5. Camp After TC — now works via Task 1
6. Camp Overview
7. **Jury Convenes** — announcement screen (post-challenge, not pre-challenge)
8. **Jury Votes** — interactive card-by-card reveal (reusing tv-vote-card pattern)
9. Aftermath

- [ ] **Step 1: Detect jury elimination in buildVPScreens**

After line 17526 (`hasTribal` definition), add:

```javascript
const _isJuryElim = !!(ep.twists||[]).find(t => t.type === 'jury-elimination' && t.juryBooted);
```

- [ ] **Step 2: Gate voting plans and tribal screens**

At line 17662, change:
```javascript
if (hasTribal) {
```
to:
```javascript
if (hasTribal && !_isJuryElim) {
```

Similarly at line 17679:
```javascript
} else if (hasTribal) {
```
to:
```javascript
} else if (hasTribal && !_isJuryElim) {
```

- [ ] **Step 3: Add jury elimination screens in the regular episode block**

In the regular episode else block (after line 17734), replace the existing `rpBuildJuryElimScreen` call with the new sequence. The `_jeScreen` call at line 17738 becomes the full jury sequence:

```javascript
    // ── REGULAR EPISODE POST-VOTE ──

    // Jury Elimination sequence — announcement + interactive vote reveal + elim card
    if (_isJuryElim) {
      const _jeAnnounce = rpBuildJuryConvenes(ep);
      if (_jeAnnounce) vpScreens.push({ id:'jury-convenes', label:'Jury Convenes', html: _jeAnnounce });
      const _jeVotes = rpBuildJuryVotes(ep);
      if (_jeVotes) vpScreens.push({ id:'jury-votes', label:'Jury Votes', html: _jeVotes });
    }

    // Post-elimination twists ...
```

Remove the old `rpBuildJuryElimScreen` call that was there before.

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "fix(vp): restructure jury elimination VP screen sequence"
```

---

### Task 4: Build rpBuildJuryConvenes and rpBuildJuryVotes

**Files:**
- Modify: `simulator.html:17401-17451` (replace rpBuildJuryElimScreen with two new functions)

- [ ] **Step 1: Write rpBuildJuryConvenes**

Announcement screen after the challenge. Shows the jury assembling and the dramatic setup — who has power, who is vulnerable. No result revealed.

```javascript
function rpBuildJuryConvenes(ep) {
  const tw = (ep.twists||[]).find(t => t.type === 'jury-elimination' && t.juryBooted);
  if (!tw) return null;
  const immune = ep.immunityWinner;
  const candidates = Object.keys(tw.elimVotes || {});
  const jurors = tw.elimLog?.map(e => e.juror) || [];
  const uniqueJurors = [...new Set(jurors)];

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;margin-bottom:6px;text-transform:uppercase;color:var(--accent-gold);text-shadow:0 0 30px rgba(227,179,65,0.3)">The Jury Has Spoken</div>
    <div style="text-align:center;font-size:11px;color:var(--muted);margin-bottom:20px;letter-spacing:1.5px;text-transform:uppercase">Tonight, the jury holds the power</div>`;

  html += `<div style="margin-bottom:20px">`;
  html += `<div class="vp-section-header gold">The Jury</div>`;
  html += `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-bottom:16px">
    ${uniqueJurors.map(j => `<div style="text-align:center">${rpPortrait(j)}<div style="font-size:10px;color:var(--muted);margin-top:2px">${j}</div></div>`).join('')}
  </div>`;
  html += `</div>`;

  if (immune) {
    html += `<div class="vp-card gold" style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      ${rpPortrait(immune)}
      <div><div style="font-size:13px;font-weight:600">${immune}</div><div style="font-size:11px;color:#e3b341">Immune — cannot be targeted</div></div>
    </div>`;
  }

  html += `<div class="vp-section-header fire">Vulnerable</div>`;
  candidates.forEach(c => {
    const ts = threatScore(c);
    const avgBondWithJury = uniqueJurors.length
      ? uniqueJurors.reduce((s, j) => s + getBond(j, c), 0) / uniqueJurors.length : 0;
    const dangerLevel = avgBondWithJury <= -1 ? 'high' : avgBondWithJury <= 1 ? 'medium' : 'low';
    const dangerLabel = dangerLevel === 'high' ? 'Burned bridges with the jury'
                      : dangerLevel === 'medium' ? 'Mixed relationships with jury'
                      : 'Well-liked by the jury';
    html += `<div class="vp-card" style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
      ${rpPortrait(c)}
      <div><div style="font-size:13px">${c}</div><div style="font-size:10px;color:${dangerLevel==='high'?'var(--accent-fire)':dangerLevel==='medium'?'#e3b341':'var(--muted)'}">${dangerLabel}</div></div>
    </div>`;
  });

  html += `<div style="text-align:center;font-size:13px;color:#8b949e;margin-top:20px;line-height:1.6">
    The eliminated players have voted. One active player will be removed from the game. No tribal council tonight.
  </div>`;

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Write rpBuildJuryVotes**

Interactive card-by-card reveal reusing the `tv-vote-card` / `tvRevealNext` / `tvRevealAll` pattern. Shows jury members casting votes against candidates, with live tally, elimination card at the end.

Uses the `_tvState` with a `_je` suffix key so it doesn't collide with normal vote state.

```javascript
function rpBuildJuryVotes(ep) {
  const tw = (ep.twists||[]).find(t => t.type === 'jury-elimination' && t.juryBooted);
  if (!tw) return null;
  const jBooted = tw.juryBooted;
  const jLog = tw.elimLog || [];
  const jVotes = tw.elimVotes || {};
  const epNum = ep.num;
  const stateKey = epNum + '_je';

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${epNum} — Jury Elimination</div>
    <div class="rp-title">The Jury Votes</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:16px;text-align:center">Tonight, the jury votes to <strong style="color:var(--accent-fire)">eliminate</strong> one active player.</div>`;

  // Two-panel layout: cards left, tally right
  html += `<div class="tv-wrap">
    <div class="tv-reveal-panel" id="tv-cards-${stateKey}">`;

  // Build vote cards for each juror
  jLog.forEach(({ juror, votedOut }, idx) => {
    const bond = getBond(juror, votedOut);
    const _pick = arr => arr[([...juror+votedOut].reduce((a,c)=>a+c.charCodeAt(0),0)+epNum*11)%arr.length];
    let reason;
    if (bond <= -2) reason = _pick([
      'Never forgave what happened.',
      'This is personal. And I\\'m fine with that.',
      'I watched from the jury bench. I saw enough.',
    ]);
    else if (bond <= 0) reason = _pick([
      'Nothing personal. Just the biggest threat left.',
      'This game needs a shakeup.',
      'Strategic. Cold. Necessary.',
    ]);
    else reason = _pick([
      'Sorry. You played too well to let you stay.',
      'I respect your game. That\\'s exactly why.',
      'Hardest vote I\\'ve cast — from either side of the game.',
    ]);

    html += `<div class="tv-vote-card" data-voted="${votedOut}" data-voter="${juror}" data-index="${idx}">
      <div class="tv-vote-voter-wrap">
        ${rpPortrait(juror, 'sm')}
        <div class="tv-vote-voter">${juror}</div>
      </div>
      <div class="tv-vote-arrow" style="color:var(--accent-fire)">\u2192</div>
      <div class="tv-vote-right">
        <div class="tv-vote-target">${votedOut}</div>
        <div class="tv-vote-reason">${reason}</div>
      </div>
    </div>`;
  });

  html += `</div>`; // end tv-reveal-panel

  // Live tally panel
  const tallyNames = Object.entries(jVotes).sort(([,a],[,b]) => b-a).map(([n]) => n);
  html += `<div class="tv-tally-panel" id="tv-tally-${stateKey}">
    <div class="tv-tally-header">Jury Tally</div>`;
  tallyNames.forEach(name => {
    const slug = name.replace(/[^a-zA-Z0-9]/g, '');
    html += `<div class="tv-tally-row" data-name="${name}" style="opacity:0;transition:opacity 0.4s">
      ${rpPortrait(name)}
      <div class="tv-tally-pname">${name}</div>
      <div class="tv-tally-bar-bg"><div class="tv-tally-bar" id="tv-tb-${stateKey}-${slug}" style="width:0%"></div></div>
      <div class="tv-tally-count" id="tv-tc-${stateKey}-${slug}" data-count="0">\u2014</div>
    </div>`;
  });
  html += `</div></div>`; // end tally panel + tv-wrap

  // Reveal buttons
  html += `<div id="tv-btn-wrap-${stateKey}">
    <button class="tv-reveal-btn" id="tv-btn-${stateKey}" onclick="tvRevealNext('${stateKey}')">Read the Vote (0/${jLog.length})</button>
    <div style="text-align:right;margin:-12px 0 14px">
      <button onclick="tvRevealAll('${stateKey}')" style="background:none;border:none;font-size:11px;color:#484f58;cursor:pointer;padding:2px 0;letter-spacing:0.3px">Skip to results \u203a</button>
    </div>
  </div>`;

  // Results section (hidden until all votes revealed)
  html += `<div id="tv-results-${stateKey}" style="display:none">`;

  // Elimination card
  const _jPlace = (ep.gsSnapshot?.activePlayers ?? gs.activePlayers).length + 1;
  const _jQ = vpGenerateQuote(jBooted, ep, 'eliminated');
  html += `<div class="rp-elim">
    <div class="rp-elim-eyebrow">Jury eliminated \u2014 ${ordinal(_jPlace)} place</div>
    ${rpPortrait(jBooted, 'xl elim')}
    <div class="rp-elim-name">${jBooted}</div>
    <div class="rp-elim-arch">${vpArchLabel(jBooted)}</div>
    <div class="rp-elim-quote">"${_jQ}"</div>
    <div class="rp-elim-place">Episode ${ep.num} \u2014 Eliminated by the Jury</div>
  </div>`;

  html += `</div>`; // end results
  html += `</div>`; // end page
  return html;
}
```

- [ ] **Step 3: Update `_tvState` cleanup in buildVPScreens**

After line 17523, add cleanup for the `_je` key:

```javascript
delete _tvState[String(vpEpNum) + '_je'];
```

- [ ] **Step 4: Remove old rpBuildJuryElimScreen function**

Delete the old `rpBuildJuryElimScreen` function (lines 17401-17451) since it's replaced by the two new functions. Also remove the call at line 17707 in the finale block.

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat(vp): interactive jury elimination screens with card-by-card vote reveal"
```

---

### Task 5: Fix rpBuildChallenge gs.isMerged reference

**Files:**
- Modify: `simulator.html:14007`

- [ ] **Step 1: Use snapshot isMerged instead of live gs.isMerged**

Same bug pattern as the vpTribeGroups fix. At line 14007:

```javascript
if ((ep.gsSnapshot?.isMerged || gs.isMerged) && ep.chalPlacements?.length) {
```

Change to:

```javascript
if ((ep.isMerge || ep.gsSnapshot?.isMerged) && ep.chalPlacements?.length) {
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "fix(vp): use snapshot isMerged in challenge screen to prevent pre-merge misrender"
```
