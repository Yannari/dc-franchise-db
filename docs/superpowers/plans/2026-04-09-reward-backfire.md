# Reward Trip Bonding Backfire — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a post-merge reward winner picks companions, left-behind players occasionally organize — forming a counter-alliance (strong bonds) or loose voting bloc (weak bonds).

**Architecture:** Single insertion block after the existing snub loop in the reward challenge engine code (~line 13792), plus heat application in `computeHeat`, episode history fields in both `patchEpisodeHistory` locations, badge registration, VP card, and text backlog line.

**Tech Stack:** Vanilla JS in `simulator.html`

---

### Task 1: Engine — Backfire Trigger + Path Logic

**Files:**
- Modify: `simulator.html:13792` (after snub loop closing brace, before `} else {` tribe branch)

- [ ] **Step 1: Add the backfire block after the snub loop**

Insert immediately after line 13792 (`});` closing the snub forEach), before line 13793 (`} else {`):

```javascript
      // ── Reward Trip Bonding Backfire: left-behind players organize against reward group ──
      // Gate 1: post-merge individual reward (already guaranteed by this branch)
      // Gate 2: meaningful snub — at least 1 left-behind player had bond >= 3 with winner
      const _snubbedPlayers = (twistObj.rewardSnubs || []).map(s => s.player);
      if (_snubbedPlayers.length >= 1) {
        // Gate 3: left-behind cohesion — at least 2 non-picked players share bond >= 1.5
        const _leftBehind = _others.filter(p => !_companions.includes(p));
        let _hasCohesion = false;
        for (let _bi = 0; _bi < _leftBehind.length && !_hasCohesion; _bi++) {
          for (let _bj = _bi + 1; _bj < _leftBehind.length && !_hasCohesion; _bj++) {
            if (getBond(_leftBehind[_bi], _leftBehind[_bj]) >= 1.5) _hasCohesion = true;
          }
        }
        // Gate 4: 15% roll
        if (_hasCohesion && Math.random() < 0.15) {
          // Score left-behind group avg pairwise bond to determine path
          let _lbTotalBond = 0, _lbPairs = 0;
          for (let _bi = 0; _bi < _leftBehind.length; _bi++) {
            for (let _bj = _bi + 1; _bj < _leftBehind.length; _bj++) {
              _lbTotalBond += getBond(_leftBehind[_bi], _leftBehind[_bj]);
              _lbPairs++;
            }
          }
          const _lbAvgBond = _lbPairs > 0 ? _lbTotalBond / _lbPairs : 0;
          const _curEp = (gs.episode || 0) + 1;
          const _campKey = gs.mergeName || 'merge';

          if (_lbAvgBond >= 2.0) {
            // ── Path A: Counter-Alliance ──
            // Members: left-behind with bond >= 1.0 with any snubbed player, capped below majority
            const _maxMembers = Math.floor(gs.activePlayers.length / 2) - 1;
            const _allianceMembers = _leftBehind.filter(p =>
              _snubbedPlayers.some(sp => getBond(p, sp) >= 1.0) || _snubbedPlayers.includes(p)
            ).slice(0, Math.max(2, _maxMembers));

            if (_allianceMembers.length >= 2) {
              // Bond boost: shared grievance
              for (let _ai = 0; _ai < _allianceMembers.length; _ai++) {
                for (let _aj = _ai + 1; _aj < _allianceMembers.length; _aj++) {
                  addBond(_allianceMembers[_ai], _allianceMembers[_aj], 0.4);
                }
              }
              // Form alliance
              const _bfAllianceName = nameNewAlliance(_allianceMembers.length);
              gs.namedAlliances.push({
                id: `alliance_${Date.now()}_${Math.floor(Math.random()*1000)}`,
                name: _bfAllianceName, members: [..._allianceMembers],
                formed: _curEp, betrayals: [], active: true,
              });
              // Temporary heat on reward group
              gs._rewardBackfireHeat = {
                targets: { [_w]: 1.5 },
                expiresEp: _curEp + 1
              };
              _companions.forEach(c => { gs._rewardBackfireHeat.targets[c] = 0.8; });

              // Camp event
              const _bfMemberList = _allianceMembers.length <= 3
                ? _allianceMembers.join(' and ')
                : _allianceMembers.slice(0, -1).join(', ') + ', and ' + _allianceMembers[_allianceMembers.length - 1];
              if (!ep.campEvents[_campKey]) ep.campEvents[_campKey] = { pre: [], post: [] };
              if (!ep.campEvents[_campKey].post) ep.campEvents[_campKey].post = [];
              ep.campEvents[_campKey].post.push({
                type: 'rewardBackfireAlliance',
                players: [..._allianceMembers],
                text: `While ${_w} was off enjoying the ${twistObj.rewardItemLabel || 'reward'}, the ones left behind started talking. Really talking. By sundown, ${_bfMemberList} had something — not just anger, but a plan.`,
                consequences: `Alliance "${_bfAllianceName}" formed. Heat on ${_w} +1.5.`,
                badgeText: 'BACKFIRE', badgeClass: 'red-orange'
              });

              twistObj.rewardBackfire = {
                fired: true, path: 'alliance',
                snubbedPlayers: [..._snubbedPlayers],
                leftBehindGroup: [..._leftBehind],
                allianceName: _bfAllianceName,
                allianceMembers: [..._allianceMembers],
                blocPair: null,
                heatTarget: _w,
                heatCompanions: [..._companions],
              };
            }
          } else {
            // ── Path B: Voting Bloc ──
            // Bond boost among snubbed players
            for (let _si = 0; _si < _snubbedPlayers.length; _si++) {
              for (let _sj = _si + 1; _sj < _snubbedPlayers.length; _sj++) {
                addBond(_snubbedPlayers[_si], _snubbedPlayers[_sj], 0.3);
              }
            }
            // Temporary heat on reward winner only
            gs._rewardBackfireHeat = {
              targets: { [_w]: 1.0 },
              expiresEp: _curEp + 1
            };
            // Side deal between top 2 bonded snubbed players
            let _blocPair = null;
            if (_snubbedPlayers.length >= 2) {
              let _bestPair = null, _bestBond = -Infinity;
              for (let _si = 0; _si < _snubbedPlayers.length; _si++) {
                for (let _sj = _si + 1; _sj < _snubbedPlayers.length; _sj++) {
                  const _pBond = getBond(_snubbedPlayers[_si], _snubbedPlayers[_sj]);
                  if (_pBond > _bestBond) { _bestBond = _pBond; _bestPair = [_snubbedPlayers[_si], _snubbedPlayers[_sj]]; }
                }
              }
              if (_bestPair) {
                const _initiator = _bestPair[0];
                const _partner = _bestPair[1];
                const _initS = pStats(_initiator);
                const _genuineChance = _initS.loyalty * 0.09 + getBond(_initiator, _partner) * 0.06
                  - (10 - _initS.loyalty) * 0.02
                  - ((gs.sideDeals || []).filter(d => d.active && d.players.includes(_initiator)).length) * 0.2;
                const _genuine = Math.random() < Math.max(0.15, Math.min(0.95, _genuineChance));
                if (!gs.sideDeals) gs.sideDeals = [];
                gs.sideDeals.push({
                  players: [_initiator, _partner], initiator: _initiator, madeEp: _curEp,
                  type: 'f2', active: true, genuine: _genuine
                });
                addBond(_initiator, _partner, 1.0);
                _blocPair = [..._bestPair];
              }
            }
            // Camp event
            const _bfP1 = _snubbedPlayers[0];
            const _bfP2 = _snubbedPlayers.length >= 2 ? _snubbedPlayers[1] : null;
            const _bfCompName = _companions[0] || 'someone';
            if (!ep.campEvents[_campKey]) ep.campEvents[_campKey] = { pre: [], post: [] };
            if (!ep.campEvents[_campKey].post) ep.campEvents[_campKey].post = [];
            ep.campEvents[_campKey].post.push({
              type: 'rewardBackfireBloc',
              players: _bfP2 ? [_bfP1, _bfP2] : [_bfP1],
              text: _bfP2
                ? `${_bfP1} and ${_bfP2} sat by the fire, watching the empty shelter. "Funny how ${_w} picks ${_bfCompName} over us." The conversation didn't end there.`
                : `${_bfP1} sat alone by the fire while ${_w} was off on the reward. The sting of not being picked turned into something else — a plan.`,
              consequences: `Bonds strengthened. Heat on ${_w} +1.0.${_blocPair ? ` F2 deal between ${_blocPair[0]} and ${_blocPair[1]}.` : ''}`,
              badgeText: 'LEFT BEHIND', badgeClass: 'red'
            });

            twistObj.rewardBackfire = {
              fired: true, path: 'bloc',
              snubbedPlayers: [..._snubbedPlayers],
              leftBehindGroup: [..._leftBehind],
              allianceName: null,
              allianceMembers: null,
              blocPair: _blocPair,
              heatTarget: _w,
              heatCompanions: [..._companions],
            };
          }
        }
      }
```

- [ ] **Step 2: Verify the insertion point**

The code should sit between the closing `});` of the snub forEach (line 13792) and the `} else {` for tribe rewards (line 13793). The indentation is 6 spaces (inside the `if (twistObj.rewardWinnerType === 'individual')` block).

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add reward trip bonding backfire engine logic"
```

---

### Task 2: Heat Application in `computeHeat`

**Files:**
- Modify: `simulator.html:3937` (after the `challengeThrowHeatReduction` line)

- [ ] **Step 1: Add backfire heat check**

Insert after line 3938 (`if (gs.challengeThrowHeatReduction?.[name] >= ((gs.episode || 0) + 1) - 1) heat -= 1.0;`):

```javascript
  // Reward backfire: left-behind players organized against reward group
  if (gs._rewardBackfireHeat?.targets?.[name] && gs._rewardBackfireHeat.expiresEp > (gs.episode || 0) + 1 - 1) {
    heat += gs._rewardBackfireHeat.targets[name];
  }
```

- [ ] **Step 2: Add heat cleanup after tribal**

In the post-tribal cleanup section (~line 25489), after `if (gs._phobiaBlame) delete gs._phobiaBlame;`, add:

```javascript
    // Clear reward backfire heat after tribal (or if expired)
    if (gs._rewardBackfireHeat && (gs.episode || 0) + 1 >= gs._rewardBackfireHeat.expiresEp) delete gs._rewardBackfireHeat;
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: apply reward backfire heat in computeHeat + cleanup"
```

---

### Task 3: Episode History — Save `rewardBackfire` Field

**Files:**
- Modify: `simulator.html:24829` (first patchEpisodeHistory location — inline episode push)
- Modify: `simulator.html:25623` (second patchEpisodeHistory location — standalone push)

- [ ] **Step 1: Add `rewardBackfire` to first history location**

On line 24829, after `rewardShareInvite: rct.rewardShareInvite || null,`, append on the same line or next:

```javascript
          rewardBackfire: rct.rewardBackfire || null,
```

- [ ] **Step 2: Add `rewardBackfire` to second history location**

On line 25623, after `rewardCluedPlayer: rct.rewardCluedPlayer || null,`, append:

```javascript
        rewardBackfire: rct.rewardBackfire || null,
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: save rewardBackfire in episode history"
```

---

### Task 4: Badge Registration in `rpBuildCampTribe`

**Files:**
- Modify: `simulator.html:38588` (badge type chain in rpBuildCampTribe)

- [ ] **Step 1: Add badge entries for both backfire event types**

After line 38588 (`evt.type === 'sideDeal'` line), add two new entries in the ternary chain:

```javascript
                     : evt.type === 'rewardBackfireAlliance'   ? (evt.badgeText || 'BACKFIRE')
                     : evt.type === 'rewardBackfireBloc'       ? (evt.badgeText || 'LEFT BEHIND')
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: register reward backfire camp event badges"
```

---

### Task 5: VP Card in `rpBuildRewardChallenge`

**Files:**
- Modify: `simulator.html:39508` (after the alliance strengthened card, before closing `</div>`)

- [ ] **Step 1: Add backfire VP card**

After line 39508 (`}`), before line 39510 (`html += \`</div>\`;`), insert:

```javascript
    // ── Reward Backfire card ──
    if (rc.rewardBackfire?.fired) {
      const _bf = rc.rewardBackfire;
      if (_bf.path === 'alliance') {
        html += `<div style="padding:10px 12px;background:rgba(248,81,73,0.06);border:1px solid rgba(248,81,73,0.2);border-radius:6px;margin-bottom:8px">
          <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f0883e;margin-bottom:4px">BACKFIRE</div>
          <div style="font-size:12px;color:#e6edf3">While <strong>${_bf.heatTarget}</strong> feasted, the camp organized. <strong>${_bf.allianceName}</strong> was born from resentment.</div>
          <div style="display:flex;gap:4px;margin-top:6px">${(_bf.allianceMembers || []).map(m => rpPortrait(m, 'sm')).join('')}</div>
          <div style="font-size:10px;color:#f0883e;margin-top:6px">+1.5 heat on ${_bf.heatTarget}${_bf.heatCompanions?.length ? `, +0.8 on ${_bf.heatCompanions.join(', ')}` : ''}</div>
        </div>`;
      } else {
        html += `<div style="padding:10px 12px;background:rgba(248,81,73,0.04);border:1px solid rgba(248,81,73,0.12);border-radius:6px;margin-bottom:8px">
          <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f85149;margin-bottom:4px">LEFT BEHIND</div>
          <div style="font-size:12px;color:#8b949e">The ones left behind found common ground.${_bf.blocPair ? ` ${_bf.blocPair[0]} and ${_bf.blocPair[1]} made an F2 deal.` : ''}</div>
          <div style="display:flex;gap:4px;margin-top:6px">${(_bf.snubbedPlayers || []).map(m => rpPortrait(m, 'sm')).join('')}</div>
          <div style="font-size:10px;color:#f85149;margin-top:6px">+1.0 heat on ${_bf.heatTarget}</div>
        </div>`;
      }
    }
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add reward backfire VP card"
```

---

### Task 6: Text Backlog Line

**Files:**
- Modify: `simulator.html:27279` (in `_textRewardChallenge`, after the pitch leaks line)

- [ ] **Step 1: Add backfire text line**

After line 27279 (`if (rc.rewardPitchLeaks?.length)...`), before line 27280 (`if (rc.rewardShareInvite)...`), add:

```javascript
    if (rc.rewardBackfire?.fired) {
      if (rc.rewardBackfire.path === 'alliance') {
        ln(`BACKFIRE: Left-behind players formed alliance "${rc.rewardBackfire.allianceName}" (${(rc.rewardBackfire.allianceMembers||[]).join(', ')}). Heat +1.5 on ${rc.rewardBackfire.heatTarget}.`);
      } else {
        ln(`LEFT BEHIND: Snubbed players bonded. Heat +1.0 on ${rc.rewardBackfire.heatTarget}.${rc.rewardBackfire.blocPair ? ` F2 deal: ${rc.rewardBackfire.blocPair.join(' + ')}.` : ''}`);
      }
    }
```

- [ ] **Step 2: Also add to the standalone reward data block**

After line 27279 there's a second block starting at line 27268 (`if (ep.rewardChalData && !_rcTwist)`). Inside that block, after line 27279, add the same check but using `rc` variable (which is `ep.rewardChalData`):

Actually, looking at the code more carefully — line 27279 is inside the `_rcTwist` block. The standalone block (line 27268-27281) also needs the same line. Add after line 27279 inside the twist block, AND after line 27279 inside the standalone block (both already use the same variable pattern).

The twist block uses `_rcTwist` for data. The standalone block uses `rc`. For the twist block, the rewardBackfire data is on the twist object. Add:

After line 27279 (inside the `if (_rcTwist)` block):
```javascript
    if (_rcTwist.rewardBackfire?.fired) {
      if (_rcTwist.rewardBackfire.path === 'alliance') {
        ln(`BACKFIRE: Left-behind players formed alliance "${_rcTwist.rewardBackfire.allianceName}" (${(_rcTwist.rewardBackfire.allianceMembers||[]).join(', ')}). Heat +1.5 on ${_rcTwist.rewardBackfire.heatTarget}.`);
      } else {
        ln(`LEFT BEHIND: Snubbed players bonded. Heat +1.0 on ${_rcTwist.rewardBackfire.heatTarget}.${_rcTwist.rewardBackfire.blocPair ? ` F2 deal: ${_rcTwist.rewardBackfire.blocPair.join(' + ')}.` : ''}`);
      }
    }
```

After line 27279 (inside the standalone `if (ep.rewardChalData && !_rcTwist)` block, after the rewardPitchLeaks line):
```javascript
    if (rc.rewardBackfire?.fired) {
      if (rc.rewardBackfire.path === 'alliance') {
        ln(`BACKFIRE: Left-behind players formed alliance "${rc.rewardBackfire.allianceName}" (${(rc.rewardBackfire.allianceMembers||[]).join(', ')}). Heat +1.5 on ${rc.rewardBackfire.heatTarget}.`);
      } else {
        ln(`LEFT BEHIND: Snubbed players bonded. Heat +1.0 on ${rc.rewardBackfire.heatTarget}.${rc.rewardBackfire.blocPair ? ` F2 deal: ${rc.rewardBackfire.blocPair.join(' + ')}.` : ''}`);
      }
    }
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add reward backfire to text backlog"
```

---

### Task 7: Verification

- [ ] **Step 1: Search for consistency**

Verify all references are consistent:

```bash
grep -n "rewardBackfire" simulator.html | head -30
```

Expected: entries in the engine block (~13792), computeHeat (~3939), both episode history locations (~24829, ~25623), badge registration (~38590), VP card (~39510), and text backlog (~27279).

- [ ] **Step 2: Verify no syntax errors**

Open `simulator.html` in browser, open DevTools console, check for JS parse errors.

- [ ] **Step 3: Test by running a season**

Enable `Auto Reward Challenges` in config. Run a full season (Sim All). Check:
- No console errors
- If backfire fires: check camp events show BACKFIRE or LEFT BEHIND badge
- Check reward challenge VP screen shows the backfire card after snubs
- Check text backlog includes backfire/left-behind line

- [ ] **Step 4: Final commit**

```bash
git add simulator.html
git commit -m "feat: reward trip bonding backfire — complete implementation"
```
