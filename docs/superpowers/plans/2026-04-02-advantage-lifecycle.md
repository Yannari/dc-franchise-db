# Advantage Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full social/narrative lifecycle (confession, leak, snoop, heat, bigMoves, camp events) to Team Swap, Vote Block, and Vote Steal advantages.

**Architecture:** All changes in `simulator.html`. Add 3 new Sets for known-holder tracking, expand existing feast-leak and computeHeat systems, add a new `checkAdvantageConfessions()` function for Team Swap, add snoop checks for all three in existing `checkSocialIntel()`, and register new badge types in `rpBuildCampTribe()`.

**Tech Stack:** Vanilla JS, single-file app

**Spec:** `docs/superpowers/specs/2026-04-02-advantage-lifecycle-design.md`

---

### Task 1: Add Known Holder Sets + Serialization

**Files:**
- Modify: `simulator.html:1626-1628` (repairGsSets SET_FIELDS)
- Modify: `simulator.html:1638-1640` (prepGsForSave SET_FIELDS)

- [ ] **Step 1: Add 3 new Sets to repairGsSets SET_FIELDS (~line 1628)**

Find:
```javascript
                      'socialBombHeatThisEp', 'injuredThisEp', 'scramblingThisEp', 'beastDrillsThisEp', 'lieTargetsThisEp'];
```

Replace with:
```javascript
                      'socialBombHeatThisEp', 'injuredThisEp', 'scramblingThisEp', 'beastDrillsThisEp', 'lieTargetsThisEp',
                      'knownTeamSwapHolders', 'knownVoteBlockHolders', 'knownVoteStealHolders'];
```

- [ ] **Step 2: Add same 3 Sets to prepGsForSave SET_FIELDS (~line 1640)**

Same change — find the identical closing line and add the 3 new Set names.

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add known holder Sets for Team Swap, Vote Block, Vote Steal serialization"
```

---

### Task 2: Discovery Camp Events

**Files:**
- Modify: `simulator.html:7597-7604` (findAdvantages non-idol discovery loop)

- [ ] **Step 1: Add discovery camp event injection after advantage is found**

After line 7603 (`ep.idolFinds.push(...)`) and before the `break;`, insert discovery camp event logic. This fires for teamSwap, voteBlock, and voteSteal:

```javascript
        // ── Discovery camp event for tactical advantages ──
        if (['teamSwap', 'voteBlock', 'voteSteal'].includes(key)) {
          const _discLabel = { teamSwap: 'Team Swap', voteBlock: 'Vote Block', voteSteal: 'Vote Steal' }[key];
          const _discPr = pronouns(name);
          const _discLines = key === 'teamSwap' ? [
            `${name} found something hidden at camp — a ${_discLabel}. ${_discPr.Sub} can feel the weight of it already. The power to move someone between tribes... that changes everything.`,
            `${name} was alone when ${_discPr.sub} found the ${_discLabel}. ${_discPr.Sub} turned it over in ${_discPr.posAdj} hands. This could save ${_discPr.obj} — or save someone else. Either way, the game just shifted.`,
            `${name} discovered a ${_discLabel} tucked into a tree. ${_discPr.Sub} pocketed it fast. Nobody saw. But now ${_discPr.sub} ${_discPr.sub === 'they' ? 'have' : 'has'} an escape route nobody knows about.`,
          ] : [
            `${name} found a ${_discLabel} at camp. A quiet advantage — but a useful one. The right play at the right time could change a vote.`,
            `${name} discovered a ${_discLabel} hidden near the well. ${_discPr.Sub} slipped it into ${_discPr.posAdj} bag without a word. One more tool in the arsenal.`,
            `${name} was searching near the shelter when ${_discPr.sub} found a ${_discLabel}. Not flashy, but tactical. ${_discPr.Sub} ${_discPr.sub === 'they' ? 'know' : 'knows'} exactly when to use it.`,
          ];
          const _discTribe = _advTribe;
          if (_discTribe && ep.campEvents?.[_discTribe]) {
            const _discBlock = ep.campEvents[_discTribe];
            (Array.isArray(_discBlock) ? _discBlock : (_discBlock.pre || [])).push({
              type: key + 'Found', players: [name],
              text: _discLines[Math.floor(Math.random() * _discLines.length)]
            });
          }
        }
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: discovery camp events for Team Swap, Vote Block, Vote Steal"
```

---

### Task 3: Heat Modifiers for Known Holders

**Files:**
- Modify: `simulator.html:2988-2995` (computeHeat known-holder section)

- [ ] **Step 1: Add heat checks after existing amulet holder check (~line 2995)**

After the line `if (gs.knownAmuletHoldersThisEp?.has(name)) heat -= 0.5;`, add:

```javascript
  // Known Team Swap holder — get them before they escape
  if (gs.knownTeamSwapHolders?.has(name)) heat += 0.6;
  // Known Vote Block holder — mild tactical awareness
  if (gs.knownVoteBlockHolders?.has(name)) heat += 0.3;
  // Known Vote Steal holder — mild tactical awareness
  if (gs.knownVoteStealHolders?.has(name)) heat += 0.3;
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: heat modifiers for known Team Swap/Vote Block/Vote Steal holders"
```

---

### Task 4: Feast Intel-Leak Integration

**Files:**
- Modify: `simulator.html:9863` (feast intel-leak advantage type filter)
- Modify: `simulator.html:9865-9868` (known holder Set assignment)
- Modify: `simulator.html:9869` (advantage label mapping)

- [ ] **Step 1: Expand the type filter on line 9863**

Find:
```javascript
        const _leakerAdv = gs.advantages.find(adv => adv.holder === _leaker && ['idol', 'legacy', 'amulet', 'secondLife'].includes(adv.type));
```

Replace with:
```javascript
        const _leakerAdv = gs.advantages.find(adv => adv.holder === _leaker && ['idol', 'legacy', 'amulet', 'secondLife', 'teamSwap', 'voteBlock', 'voteSteal'].includes(adv.type));
```

- [ ] **Step 2: Update known-holder Set logic (~lines 9865-9868)**

The current code always adds to `knownIdolHoldersThisEp` and `knownIdolHoldersPersistent`. Replace that block with type-aware routing:

Find:
```javascript
          if (!gs.knownIdolHoldersThisEp) gs.knownIdolHoldersThisEp = new Set();
          gs.knownIdolHoldersThisEp.add(_leaker);
          if (!gs.knownIdolHoldersPersistent) gs.knownIdolHoldersPersistent = new Set();
          gs.knownIdolHoldersPersistent.add(_leaker);
```

Replace with:
```javascript
          if (['teamSwap'].includes(_leakerAdv.type)) {
            if (!gs.knownTeamSwapHolders) gs.knownTeamSwapHolders = new Set();
            gs.knownTeamSwapHolders.add(_leaker);
          } else if (['voteBlock'].includes(_leakerAdv.type)) {
            if (!gs.knownVoteBlockHolders) gs.knownVoteBlockHolders = new Set();
            gs.knownVoteBlockHolders.add(_leaker);
          } else if (['voteSteal'].includes(_leakerAdv.type)) {
            if (!gs.knownVoteStealHolders) gs.knownVoteStealHolders = new Set();
            gs.knownVoteStealHolders.add(_leaker);
          } else {
            if (!gs.knownIdolHoldersThisEp) gs.knownIdolHoldersThisEp = new Set();
            gs.knownIdolHoldersThisEp.add(_leaker);
            if (!gs.knownIdolHoldersPersistent) gs.knownIdolHoldersPersistent = new Set();
            gs.knownIdolHoldersPersistent.add(_leaker);
          }
```

- [ ] **Step 3: Expand the advantage label mapping (~line 9869)**

Find:
```javascript
          const _advLabel = _leakerAdv.type === 'idol' ? 'Hidden Immunity Idol' : _leakerAdv.type === 'legacy' ? 'Legacy Advantage' : _leakerAdv.type === 'amulet' ? 'Amulet' : _leakerAdv.type === 'secondLife' ? 'Second Life Amulet' : 'advantage';
```

Replace with:
```javascript
          const _advLabel = _leakerAdv.type === 'idol' ? 'Hidden Immunity Idol' : _leakerAdv.type === 'legacy' ? 'Legacy Advantage' : _leakerAdv.type === 'amulet' ? 'Amulet' : _leakerAdv.type === 'secondLife' ? 'Second Life Amulet' : _leakerAdv.type === 'teamSwap' ? 'Team Swap' : _leakerAdv.type === 'voteBlock' ? 'Vote Block' : _leakerAdv.type === 'voteSteal' ? 'Vote Steal' : 'advantage';
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: feast intel-leak integration for Team Swap, Vote Block, Vote Steal"
```

---

### Task 5: Team Swap Confession System

**Files:**
- Modify: `simulator.html` — add new function `checkTeamSwapConfessions(ep)` near `checkIdolConfessions` (~line 14265)
- Modify: `simulator.html` — call site in `generateCampEvents` post phase

- [ ] **Step 1: Add checkTeamSwapConfessions function after checkIdolConfessions (~line 14265)**

Insert after the closing `}` of `checkIdolConfessions`:

```javascript
function checkTeamSwapConfessions(ep) {
  const tsHolders = (gs.advantages || []).filter(a => a.type === 'teamSwap' && gs.activePlayers.includes(a.holder));
  if (!tsHolders.length) return;
  if (!gs.knownTeamSwapHolders) gs.knownTeamSwapHolders = new Set();

  tsHolders.forEach(adv => {
    const holder = adv.holder;
    const s = pStats(holder);
    // ~15% chance, proportional to social
    const confChance = s.social * 0.03;
    if (Math.random() >= confChance) return;

    // Find best ally on same tribe with bond >= 2
    const tribeMembers = gs.isMerged
      ? gs.activePlayers.filter(p => p !== holder)
      : (gs.tribes.find(t => t.members.includes(holder))?.members || []).filter(p => p !== holder);
    const allies = tribeMembers
      .map(p => ({ name: p, bond: getBond(holder, p) }))
      .filter(x => x.bond >= 2)
      .sort((a, b) => b.bond - a.bond);
    if (!allies.length) return;

    const confidant = allies[0].name;
    gs.knownTeamSwapHolders.add(confidant === holder ? confidant : holder);
    // Mark the confidant as knowing — track in the Set so computeHeat picks it up
    gs.knownTeamSwapHolders.add(holder);
    addBond(holder, confidant, 0.3); // trust gesture

    const _pr = pronouns(holder);
    const confLines = [
      `${holder} pulled ${confidant} aside. ${_pr.Sub} showed ${confidant} the Team Swap — the power to move someone between tribes. ${confidant}'s eyes widened. That kind of trust doesn't come cheap.`,
      `${holder} needed someone to know. ${_pr.Sub} told ${confidant} about the Team Swap. If things go south, ${_pr.sub} ${_pr.sub === 'they' ? 'have' : 'has'} an exit strategy — and now ${confidant} knows it too.`,
      `In a quiet moment, ${holder} confided in ${confidant} about the Team Swap. It felt like the right move — sharing the weight of that kind of power.`,
    ];
    const confEvt = { type: 'teamSwapConfession', players: [holder, confidant],
      text: confLines[Math.floor(Math.random() * confLines.length)] };

    const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(holder))?.name);
    if (tribeName && ep.campEvents?.[tribeName]) {
      const campBlock = ep.campEvents[tribeName];
      (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(confEvt);
    }
  });
}
```

- [ ] **Step 2: Add call site in generateCampEvents post phase**

Find where `checkIdolConfessions(ep)` is called in `generateCampEvents` (should be in the post/both phase). Add `checkTeamSwapConfessions(ep)` on the line after it:

```javascript
    checkTeamSwapConfessions(ep);
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: Team Swap confession system (idol pattern — social-scaled, ally confide)"
```

---

### Task 6: Snoop System for All Three Advantages

**Files:**
- Modify: `simulator.html` — in or near `checkSocialIntel()` (~line 14425), add snoop checks for teamSwap, voteBlock, voteSteal

- [ ] **Step 1: Add advantage snoop checks in checkSocialIntel**

Find the existing amulet snoop block (~line 14425-14436) that starts with:
```javascript
      // Proportional: any player can snoop, chance scales with intuition
```

After that entire amulet snoop block (after the closing `}` of the `if (snooper)` block), add the tactical advantage snoop system:

```javascript
    // ── Snoop: tactical advantages (Team Swap, Vote Block, Vote Steal) ──
    const _snoopTypes = [
      { type: 'teamSwap', setKey: 'knownTeamSwapHolders', chance: 0.02, evtType: 'teamSwapSnooped', label: 'Team Swap' },
      { type: 'voteBlock', setKey: 'knownVoteBlockHolders', chance: 0.015, evtType: 'voteBlockSnooped', label: 'Vote Block' },
      { type: 'voteSteal', setKey: 'knownVoteStealHolders', chance: 0.015, evtType: 'voteStealSnooped', label: 'Vote Steal' },
    ];
    _snoopTypes.forEach(({ type: _sType, setKey, chance, evtType, label }) => {
      const _sHolders = (gs.advantages || []).filter(a => a.type === _sType && tribeMembers.includes(a.holder));
      _sHolders.forEach(_sAdv => {
        const _sHolder = _sAdv.holder;
        if (!gs[setKey]) gs[setKey] = new Set();
        // Skip if all tribemates already know
        const _sUnaware = tribeMembers.filter(p => p !== _sHolder && !gs[setKey].has(p));
        if (!_sUnaware.length) return;
        // Find snooper — proportional to intuition
        const _sSnooper = _sUnaware.filter(p => Math.random() < pStats(p).intuition * chance)
          .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
        if (!_sSnooper) return;
        gs[setKey].add(_sHolder);
        const _sPr = pronouns(_sHolder);
        const _sSnoopPr = pronouns(_sSnooper);
        const _sSnoopLines = [
          `${_sSnooper} noticed ${_sHolder} checking ${_sPr.posAdj} bag one too many times. Something's in there — and ${_sSnoopPr.sub} think${_sSnoopPr.sub === 'they' ? '' : 's'} it's a ${label}.`,
          `${_sSnooper} caught a glimpse of something in ${_sHolder}'s things. ${_sSnoopPr.Sub} ${_sSnoopPr.sub === 'they' ? 'aren\'t' : 'isn\'t'} sure, but it looked like a ${label}. ${_sSnooper} is keeping that to ${_sSnoopPr.ref}.`,
          `${_sSnooper} has been watching ${_sHolder}. The way ${_sPr.sub} ${_sPr.sub === 'they' ? 'move' : 'moves'} around camp changed a few days ago. ${_sSnooper} is almost certain ${_sHolder} has a ${label}.`,
        ];
        pushEvt({ type: evtType, players: [_sSnooper, _sHolder],
          text: _sSnoopLines[Math.floor(Math.random() * _sSnoopLines.length)] });
      });
    });
```

Note: `pushEvt` and `tribeMembers` are already in scope within `checkSocialIntel`. Verify that the insertion point has access to both. If `pushEvt` is not in scope, use the same pattern as the amulet snoop block above it (direct push to `ep.campEvents[tribeName]`).

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: snoop system for Team Swap, Vote Block, Vote Steal holders"
```

---

### Task 7: bigMoves Credit for Team Swap

**Files:**
- Modify: `simulator.html:8360-8362` (Team Swap play logic, after advantage is consumed)

- [ ] **Step 1: Add bigMoves increment after Team Swap executes successfully**

After line 8362 (`ep.teamSwapPlayed = { ... };`) and before the `break;`, add:

```javascript
      // bigMoves credit — escaping or saving someone is a bold strategic move
      const _tsBmState = getPlayerState(_tsHolder);
      _tsBmState.bigMoves = (_tsBmState.bigMoves || 0) + 1;
      if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
      if (!gs.bigMoveEarnersThisEp.includes(_tsHolder)) gs.bigMoveEarnersThisEp.push(_tsHolder);
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: bigMoves credit for successful Team Swap play"
```

---

### Task 8: Bond Consequences on Play

**Files:**
- Modify: `simulator.html:8360-8362` (Team Swap — ally save bond boost)
- Modify: `simulator.html:8317-8318` (Vote Block — enemy penalty + ally protection)

- [ ] **Step 1: Add ally-save bond boost to Team Swap play logic**

After the bigMoves block added in Task 7 (before `break;`), add:

```javascript
      // Bond consequences: ally save = significant gratitude
      if (!_tsSwapSelf && _tsClosestAlly) {
        addBond(_tsHolder, _tsClosestAlly, 1.5);
      }
```

- [ ] **Step 2: Add bond consequences to Vote Block play logic**

After line 8318 (`ep.idolPlays.push({ player: _vbHolder, type: 'voteBlock', ... });`), add:

```javascript
    // Bond consequences
    addBond(_vbTarget, _vbHolder, -1.0); // getting silenced is personal
    // Check if this protected an ally (blocked someone voting against holder's ally)
    const _vbBlockedVote = voteLog.find(l => l.voter === _vbTarget);
    if (_vbBlockedVote?.voted) {
      const _vbProtected = _vbBlockedVote.voted;
      if (_vbProtected !== _vbHolder && getBond(_vbHolder, _vbProtected) >= 2) {
        addBond(_vbHolder, _vbProtected, 0.5); // mild gratitude for protection
      }
    }
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: bond consequences for Team Swap ally-save and Vote Block silence"
```

---

### Task 9: Clean Up Known Holders on Advantage Consumption

**Files:**
- Modify: `simulator.html:8309` (Vote Block — after advantage splice)
- Modify: `simulator.html:8348` (Team Swap — after advantage splice)

- [ ] **Step 1: Remove from known Sets when Vote Block is consumed**

After line 8309 (`gs.advantages.splice(gs.advantages.indexOf(_vbAdv), 1);`), add:

```javascript
    gs.knownVoteBlockHolders?.delete(_vbHolder);
```

- [ ] **Step 2: Remove from known Sets when Team Swap is consumed**

After line 8348 (`gs.advantages.splice(gs.advantages.indexOf(_tsAdv), 1);`), add:

```javascript
      gs.knownTeamSwapHolders?.delete(_tsHolder);
```

- [ ] **Step 3: Also clean up Vote Steal known holders when consumed**

Find the existing Vote Steal play logic (search for `type === 'voteSteal'` in `checkNonIdolAdvantageUse`). After the line that splices the advantage out of `gs.advantages`, add:

```javascript
    gs.knownVoteStealHolders?.delete(holder);
```

(Use the correct variable name for the holder — match the existing code's variable naming.)

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: clean known holder Sets when advantages are consumed"
```

---

### Task 10: VP Badge Registration

**Files:**
- Modify: `simulator.html:27806-27866` (badgeText/badgeClass in rpBuildCampTribe)

- [ ] **Step 1: Add new badge types to the badgeText ternary chain**

Find a good insertion point in the ternary chain — after the `isAmuletSnoop` line (~27840). Add these lines:

```javascript
                     : evt.type === 'teamSwapFound'        ? 'ADVANTAGE FOUND'
                     : evt.type === 'voteBlockFound'       ? 'ADVANTAGE FOUND'
                     : evt.type === 'voteStealFound'       ? 'ADVANTAGE FOUND'
                     : evt.type === 'teamSwapConfession'   ? 'CONFESSION'
                     : evt.type === 'teamSwapSnooped'      ? '⚠ SNOOPED'
                     : evt.type === 'voteBlockSnooped'     ? '⚠ SNOOPED'
                     : evt.type === 'voteStealSnooped'     ? '⚠ SNOOPED'
```

- [ ] **Step 2: Add badge classes for the new types**

Find the corresponding `badgeClass` ternary chain (follows the badgeText chain). Add matching entries:

```javascript
                     : evt.type === 'teamSwapFound'        ? 'gold'
                     : evt.type === 'voteBlockFound'       ? 'gold'
                     : evt.type === 'voteStealFound'       ? 'gold'
                     : evt.type === 'teamSwapConfession'   ? 'gold'
                     : evt.type === 'teamSwapSnooped'      ? 'purple'
                     : evt.type === 'voteBlockSnooped'     ? 'purple'
                     : evt.type === 'voteStealSnooped'     ? 'purple'
```

Note: Feast leak events already use the generic `badgeText: '... Exposed', badgeClass: 'red'` from the feast event push — no extra badge registration needed for those.

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: VP badges for advantage discovery, confession, and snoop events"
```

---

### Task 11: Verify and Test

- [ ] **Step 1: Open simulator.html in browser**

Load the simulator, create a season config with Team Swap, Vote Block, and Vote Steal all enabled (count: 2 each for higher discovery chance).

- [ ] **Step 2: Run a season and check VP for new events**

Look for:
- "ADVANTAGE FOUND" badges on camp screens when advantages are discovered
- "CONFESSION" badge if Team Swap holder confesses
- "SNOOPED" badges if someone discovers a holder
- Exposed events at feasts
- Heat correctly targeting known holders
- bigMoves increment on Team Swap play
- Bond changes on play (Team Swap ally +1.5, Vote Block enemy -1.0)

- [ ] **Step 3: Verify serialization survives save/load**

Save a game mid-season (after a Team Swap is found), reload, verify the known holder Sets are preserved.

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add simulator.html
git commit -m "fix: advantage lifecycle polish from testing"
```
