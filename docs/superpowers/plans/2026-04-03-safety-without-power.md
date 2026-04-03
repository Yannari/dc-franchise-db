# Safety Without Power Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Safety Without Power advantage — holder leaves tribal before the vote, safe but can't participate. Full lifecycle: discovery, confession, leak, snoop, heat, play logic, bond consequences, VP display.

**Architecture:** New advantage type `'safetyNoPower'` in `simulator.html`. Play logic fires BEFORE `simulateVotes()` to exclude the holder from tribal participation. Follows the established advantage lifecycle pattern (Team Swap/Vote Block style).

**Tech Stack:** Vanilla JS, single-file app

**Spec:** `docs/superpowers/specs/2026-04-03-safety-without-power-design.md`

---

### Task 1: Advantage Config + Serialization + Discovery

**Files:**
- Modify: `simulator.html` — ADVANTAGES array, SET_FIELDS (both locations), findAdvantages nonIdolTypes, typeLabel mappings

- [ ] **Step 1: Add to ADVANTAGES array**

Find the ADVANTAGES array (search for `{ key: 'voteBlock'`). After the voteBlock entry, add:

```javascript
  { key: 'safetyNoPower', label: 'Safety Without Power', default: 0 },
```

- [ ] **Step 2: Add Set to both SET_FIELDS arrays**

Find `'knownTeamSwapHolders', 'knownVoteBlockHolders', 'knownVoteStealHolders'` (appears in both `repairGsSets` and `prepGsForSave`). In BOTH locations, add `'knownSafetyNoPowerHolders'` to the array.

- [ ] **Step 3: Add to findAdvantages nonIdolTypes**

Find the `nonIdolTypes` array in `findAdvantages()` (search for `key: 'voteBlock'` inside the array). After the voteBlock entry, add:

```javascript
    { key: 'safetyNoPower', postMergeOnly: false, baseChance: 0.002, epScaleCap: 0.008 },
```

- [ ] **Step 4: Add to typeLabel mappings**

Search for `teamSwap:'Team Swap', voteBlock:'Vote Block'` — there are 2 typeLabel objects. In BOTH, add:

```javascript
safetyNoPower:'Safety Without Power'
```

- [ ] **Step 5: Add discovery camp event**

In `findAdvantages()`, find the discovery camp event block that starts with `if (['teamSwap', 'voteBlock', 'voteSteal'].includes(key))`. Change the filter to include `'safetyNoPower'`:

```javascript
if (['teamSwap', 'voteBlock', 'voteSteal', 'safetyNoPower'].includes(key)) {
```

And expand the `_discLabel` mapping:

```javascript
const _discLabel = { teamSwap: 'Team Swap', voteBlock: 'Vote Block', voteSteal: 'Vote Steal', safetyNoPower: 'Safety Without Power' }[key];
```

The existing discovery text variants work fine for safetyNoPower (the Vote Block/Vote Steal "tactical" lines fit). But add a safetyNoPower-specific set by expanding the ternary. Change:

```javascript
const _discLines = key === 'teamSwap' ? [
```

To:

```javascript
const _discLines = key === 'safetyNoPower' ? [
  `${name} found a Safety Without Power hidden at camp. ${_discPr.Sub} read the note twice. Leave tribal. Stay safe. Lose your vote. That's one hell of a trade-off.`,
  `${name} discovered a Safety Without Power tucked under a rock. ${_discPr.Sub} can walk out of tribal whenever ${_discPr.sub} want${_discPr.sub === 'they' ? '' : 's'}. The question is whether ${_discPr.sub}'ll have the nerve to use it.`,
  `${name} found something at camp — a Safety Without Power. An escape hatch. No vote, no voice, but no torch snuffed either. ${_discPr.Sub} pocketed it fast.`,
] : key === 'teamSwap' ? [
```

- [ ] **Step 6: Commit**

```bash
git add simulator.html
git commit -m "feat: Safety Without Power — config, serialization, discovery"
```

---

### Task 2: Play Logic (fires BEFORE simulateVotes)

**Files:**
- Modify: `simulator.html` — add play logic before `simulateVotes` call (~line 17623)

- [ ] **Step 1: Add Safety Without Power play check before simulateVotes**

Find the line (around line 17623):
```javascript
    const { votes, log, defections, voteMiscommunications } = simulateVotes(tribalPlayers, _allImmune, allianceSet, gs.lostVotes, ep.openVote);
```

BEFORE that line, insert:

```javascript
    // ── Safety Without Power: holder leaves tribal before votes are cast ──
    const _snpAdvs = gs.advantages.filter(a => a.type === 'safetyNoPower' && tribalPlayers.includes(a.holder));
    for (const _snpAdv of _snpAdvs) {
      const _snpHolder = _snpAdv.holder;
      const _snpS = pStats(_snpHolder);
      const _snpHeat = computeHeat(_snpHolder, tribalPlayers, []);
      const _snpForcePlay = ep._forceAdvantages || gs.activePlayers.length <= (seasonConfig.advExpire || 4);
      const _snpPlayChance = _snpForcePlay ? 1.0 : _snpHeat * 0.08 + (10 - _snpS.loyalty) * 0.02 + _snpS.boldness * 0.02;
      if (Math.random() >= _snpPlayChance) continue;

      // Warning decision: tell closest ally?
      const _snpAllyPool = tribalPlayers.filter(p => p !== _snpHolder && getBond(_snpHolder, p) >= 2)
        .sort((a, b) => getBond(_snpHolder, b) - getBond(_snpHolder, a));
      const _snpClosestAlly = _snpAllyPool[0] || null;
      const _snpWarnChance = _snpClosestAlly
        ? _snpS.loyalty * 0.06 + getBond(_snpHolder, _snpClosestAlly) * 0.04
        : 0;
      const _snpWarned = _snpClosestAlly && Math.random() < _snpWarnChance ? _snpClosestAlly : null;

      // Execute: remove holder from tribal
      gs.advantages.splice(gs.advantages.indexOf(_snpAdv), 1);
      gs.knownSafetyNoPowerHolders?.delete(_snpHolder);
      tribalPlayers.splice(tribalPlayers.indexOf(_snpHolder), 1);
      gs.lostVotes.push(_snpHolder);

      // Bond consequences
      const _snpPr = pronouns(_snpHolder);
      tribalPlayers.forEach(p => {
        const bond = getBond(p, _snpHolder);
        if (p === _snpWarned) {
          addBond(p, _snpHolder, -0.5); // warned ally — mild
        } else if (bond >= 2) {
          addBond(p, _snpHolder, _snpWarned ? -1.0 : -1.5); // ally not warned — abandonment
        } else {
          addBond(p, _snpHolder, -0.3); // general coward perception
        }
      });

      // Popularity
      if (seasonConfig.popularityEnabled && gs.popularity) {
        gs.popularity[_snpHolder] = (gs.popularity[_snpHolder] || 0) + (_snpWarned ? -0.2 : 0.3);
      }

      // Heat next episode
      gs.safetyNoPowerHeat = { player: _snpHolder, ep: (gs.episode || 0) + 1 };

      // bigMoves
      const _snpBmState = getPlayerState(_snpHolder);
      _snpBmState.bigMoves = (_snpBmState.bigMoves || 0) + 1;
      if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
      if (!gs.bigMoveEarnersThisEp.includes(_snpHolder)) gs.bigMoveEarnersThisEp.push(_snpHolder);

      // Record
      ep.idolPlays = ep.idolPlays || [];
      ep.idolPlays.push({ player: _snpHolder, type: 'safetyNoPower', warned: _snpWarned, surprise: !_snpWarned, forced: _snpForcePlay });
      ep.safetyNoPowerPlayed = { holder: _snpHolder, warnedAlly: _snpWarned, surprise: !_snpWarned };
      break; // one per tribal
    }
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: Safety Without Power play logic — leaves tribal before votes"
```

---

### Task 3: Heat Modifier + Post-Play Heat Tracking

**Files:**
- Modify: `simulator.html` — computeHeat (~line 2999)

- [ ] **Step 1: Add known holder heat and post-play heat in computeHeat**

Find the line:
```javascript
  if (gs.knownVoteStealHolders?.has(name)) heat += 0.3;
```

After it, add:

```javascript
  // Known Safety Without Power holder — people want to flush it
  if (gs.knownSafetyNoPowerHolders?.has(name)) heat += 0.5;
  // Used Safety Without Power last episode — "ran away, get them before they run again"
  if (gs.safetyNoPowerHeat?.player === name && gs.safetyNoPowerHeat?.ep === ((gs.episode || 0) + 1)) heat += 1.0;
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: heat modifiers for Safety Without Power holders"
```

---

### Task 4: Feast Leak + Confession + Snoop (Lifecycle)

**Files:**
- Modify: `simulator.html` — feast intel-leak filter, checkTeamSwapConfessions (rename or add new), checkTacticalAdvantageSnoop

- [ ] **Step 1: Add to feast intel-leak type filter**

Find the line:
```javascript
        const _leakerAdv = gs.advantages.find(adv => adv.holder === _leaker && ['idol', 'legacy', 'amulet', 'secondLife', 'teamSwap', 'voteBlock', 'voteSteal'].includes(adv.type));
```

Add `'safetyNoPower'` to the array.

- [ ] **Step 2: Add to feast Set routing**

Find the `else if (['voteSteal'].includes(_leakerAdv.type))` block in the feast leak logic. After its closing brace, before the `else {` that routes to knownIdolHolders, add:

```javascript
          } else if (['safetyNoPower'].includes(_leakerAdv.type)) {
            if (!gs.knownSafetyNoPowerHolders) gs.knownSafetyNoPowerHolders = new Set();
            gs.knownSafetyNoPowerHolders.add(_leaker);
```

- [ ] **Step 3: Add to feast advantage label mapping**

Find the `_advLabel` ternary chain in the feast leak. After `_leakerAdv.type === 'voteSteal' ? 'Vote Steal'`, add:

```javascript
: _leakerAdv.type === 'safetyNoPower' ? 'Safety Without Power'
```

- [ ] **Step 4: Add confession system**

Find `checkTeamSwapConfessions(ep)`. After that function's closing `}`, add a new function:

```javascript
function checkSafetyNoPowerConfessions(ep) {
  const holders = (gs.advantages || []).filter(a => a.type === 'safetyNoPower' && gs.activePlayers.includes(a.holder));
  if (!holders.length || !ep.campEvents) return;
  if (!gs.knownSafetyNoPowerHolders) gs.knownSafetyNoPowerHolders = new Set();

  holders.forEach(adv => {
    const holder = adv.holder;
    const s = pStats(holder);
    const confChance = s.social * 0.03;
    if (Math.random() >= confChance) return;

    const tribeMembers = gs.isMerged
      ? gs.activePlayers.filter(p => p !== holder)
      : (gs.tribes.find(t => t.members.includes(holder))?.members || []).filter(p => p !== holder);
    const allies = tribeMembers
      .map(p => ({ name: p, bond: getBond(holder, p) }))
      .filter(x => x.bond >= 2)
      .sort((a, b) => b.bond - a.bond);
    if (!allies.length) return;

    const confidant = allies[0].name;
    gs.knownSafetyNoPowerHolders.add(holder);
    addBond(holder, confidant, 0.3);

    const _pr = pronouns(holder);
    const confLines = [
      `${holder} pulled ${confidant} aside. "I found something. If things go bad, I can leave tribal. Just... walk out." ${confidant} stared. "And your vote?" ${holder} shrugged. "Gone."`,
      `${holder} told ${confidant} about the Safety Without Power. An escape route — but it means abandoning the vote. ${confidant} didn't say much. The weight of it sat between them.`,
      `In a quiet moment, ${holder} confided in ${confidant}. "I have a way out. But if I use it, you're on your own at tribal." ${confidant} nodded slowly. That kind of honesty costs something.`,
    ];
    const _seed = [...(holder+confidant)].reduce((s, c) => s + c.charCodeAt(0), 0);
    const confEvt = { type: 'safetyNoPowerConfession', players: [holder, confidant],
      text: confLines[_seed % confLines.length] };

    const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(holder))?.name);
    if (tribeName && ep.campEvents?.[tribeName]) {
      const campBlock = ep.campEvents[tribeName];
      (Array.isArray(campBlock) ? campBlock : (campBlock.pre || [])).push(confEvt);
    }
  });
}
```

- [ ] **Step 5: Add call site for confession**

Find where `checkTeamSwapConfessions(ep)` is called. Add after it:

```javascript
    checkSafetyNoPowerConfessions(ep);
```

- [ ] **Step 6: Add to snoop system**

Find the `_snoopTypes` array in `checkTacticalAdvantageSnoop()`. Add a new entry:

```javascript
      { type: 'safetyNoPower', setKey: 'knownSafetyNoPowerHolders', chance: 0.02, evtType: 'safetyNoPowerSnooped', label: 'Safety Without Power' },
```

- [ ] **Step 7: Commit**

```bash
git add simulator.html
git commit -m "feat: Safety Without Power lifecycle — feast leak, confession, snoop"
```

---

### Task 5: VP Display — Votes Screen + Camp Badges

**Files:**
- Modify: `simulator.html` — rpBuildVotes advantage play rendering, badgeText/badgeClass chains

- [ ] **Step 1: Add VP rendering for Safety Without Power play**

Find the advantage play rendering in rpBuildVotes (search for `} else if (type === 'voteBlock') {`). After the Vote Block rendering block's closing `}`, add:

```javascript
      } else if (type === 'safetyNoPower') {
        const _snpWarned = play.warned;
        html += `<div class="tv-advantage-play">
          <div class="tv-advantage-play-left">${rpPortrait(player, 'sm sitd')}</div>
          <div class="tv-advantage-play-body">
            <div class="tv-advantage-play-badge" style="color:#818cf8;background:rgba(129,140,248,0.12);border-color:rgba(129,140,248,0.25)">SAFETY WITHOUT POWER</div>
            <div class="tv-advantage-play-title">${player} leaves Tribal Council</div>
            <div class="tv-advantage-play-desc">${player} is safe tonight — but cannot vote.${_snpWarned ? ` ${player} warned ${_snpWarned} before leaving.` : ' Nobody saw it coming.'}</div>
          </div>
        </div>`;
```

- [ ] **Step 2: Add camp event badges to badgeText chain**

Find the badgeText ternary chain. After the `voteStealSnooped` entry, add:

```javascript
                     : evt.type === 'safetyNoPowerFound'       ? 'ADVANTAGE FOUND'
                     : evt.type === 'safetyNoPowerConfession'  ? 'CONFESSION'
                     : evt.type === 'safetyNoPowerSnooped'     ? '⚠ SNOOPED'
                     : evt.type === 'safetyNoPowerAftermath'   ? 'ABANDONED TRIBAL'
                     : evt.type === 'safetyNoPowerEscaped'     ? 'ESCAPED'
```

- [ ] **Step 3: Add badge classes**

Find the badgeClass ternary chain. After the snooped entries, add:

```javascript
                     : evt.type === 'safetyNoPowerFound' || evt.type === 'safetyNoPowerConfession' || evt.type === 'safetyNoPowerEscaped' ? 'gold'
                     : evt.type === 'safetyNoPowerSnooped' || evt.type === 'safetyNoPowerAftermath' ? 'red'
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: VP display for Safety Without Power — votes banner + camp badges"
```

---

### Task 6: Post-Play Camp Events + Ally Elimination Check

**Files:**
- Modify: `simulator.html` — generateCampEvents or post-tribal consequence logic

- [ ] **Step 1: Add post-play camp event generation**

Find where `gs.safetyNoPowerHeat` would be checked — in `generateCampEvents`, in the 'pre' phase, alongside other "last episode carry-over" events (like `gs.kipStealLastEp` or `gs.discoveredVotesLastEp`). Search for `kipStealLastEp` or `kipAftermath` to find the pattern.

After that block, add:

```javascript
    // ── Safety Without Power aftermath: holder walked out last tribal ──
    if (gs.safetyNoPowerPlayed) {
      const _snpData = gs.safetyNoPowerPlayed;
      const _snpPr = pronouns(_snpData.holder);
      const _snpTribe = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(_snpData.holder))?.name);
      if (_snpTribe && ep.campEvents?.[_snpTribe]) {
        const _snpBlock = ep.campEvents[_snpTribe];
        const _push = evt => (Array.isArray(_snpBlock) ? _snpBlock : (_snpBlock.pre || [])).push(evt);

        if (_snpData.surprise) {
          // Surprise exit — dramatic aftermath
          const _snpLines = [
            `Camp is tense this morning. ${_snpData.holder} walked out of tribal last night without a word. ${_snpPr.Sub} ${_snpPr.sub === 'they' ? 'are' : 'is'} safe, but the trust ${_snpPr.sub} left behind isn't.`,
            `Nobody has spoken to ${_snpData.holder} since last night. ${_snpPr.Sub} stood up, walked out, and left everyone to fend for themselves. Some people call that survival. Others have a different word for it.`,
            `${_snpData.holder} sits alone by the fire. ${_snpPr.Sub} used the Safety Without Power. ${_snpPr.Sub} ${_snpPr.sub === 'they' ? 'are' : 'is'} still here. But the looks from the others say everything words can't.`,
          ];
          const _snpSeed = [..._snpData.holder].reduce((s, c) => s + c.charCodeAt(0), 0);
          _push({ type: 'safetyNoPowerAftermath', players: [_snpData.holder],
            text: _snpLines[_snpSeed % _snpLines.length] });
        } else {
          // Warned exit — quieter aftermath
          const _snpLines = [
            `${_snpData.holder} is back at camp after walking out of tribal. ${_snpData.warnedAlly} knew it was coming. The rest didn't. The air is different this morning.`,
            `${_snpData.holder} warned ${_snpData.warnedAlly} before leaving tribal. That bought some goodwill — but not with everyone. The tribe is split on whether it was smart or selfish.`,
            `${_snpData.holder} played the Safety Without Power. ${_snpData.warnedAlly} covered for ${_snpPr.obj} as best ${pronouns(_snpData.warnedAlly).sub} could. The question now is whether anyone else will.`,
          ];
          const _snpSeed = [..._snpData.holder].reduce((s, c) => s + c.charCodeAt(0), 0);
          _push({ type: 'safetyNoPowerEscaped', players: [_snpData.holder, _snpData.warnedAlly],
            text: _snpLines[_snpSeed % _snpLines.length] });
        }

        // If an ally was eliminated because of the missing vote
        if (_snpData.allyCost) {
          const _costPr = pronouns(_snpData.allyCost);
          _push({ type: 'safetyNoPowerAftermath', players: [_snpData.holder],
            text: `${_snpData.allyCost} went home last night. ${_snpData.holder}'s vote could have changed that. ${_snpPr.Sub} know${_snpPr.sub === 'they' ? '' : 's'} it. Everyone knows it.` });
          addBond(_snpData.allyCost, _snpData.holder, -1.0); // extra sting
        }
      }
      delete gs.safetyNoPowerPlayed;
    }
```

- [ ] **Step 2: Save safetyNoPowerPlayed for next episode carry-over**

In the play logic (Task 2), the data is stored on `ep.safetyNoPowerPlayed`. But for next-episode camp events, we need it on `gs`. After the `ep.safetyNoPowerPlayed = {...}` line in the play logic, add:

```javascript
      gs.safetyNoPowerPlayed = { holder: _snpHolder, warnedAlly: _snpWarned, surprise: !_snpWarned };
```

Also, after vote resolution (after `resolveVotes` determines `ep.eliminated`), check if the eliminated player was an ally of the holder. Find where `ep.eliminated` is set in the main tribal flow. After that, add:

```javascript
    // Track if Safety Without Power caused an ally's elimination
    if (gs.safetyNoPowerPlayed && ep.eliminated) {
      const _snpBond = getBond(gs.safetyNoPowerPlayed.holder, ep.eliminated);
      if (_snpBond >= 2) gs.safetyNoPowerPlayed.allyCost = ep.eliminated;
    }
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: Safety Without Power post-play camp events + ally cost tracking"
```

---

### Task 7: Journey Pool + Backlog Update

**Files:**
- Modify: `simulator.html` — journey advantage pool (~line 8519)
- Modify: `DATA_SEASON/ideas_probabilistic_moments.txt`

- [ ] **Step 1: Add to journey advantage pool**

Find the journey pool section. After the voteBlock entry:

```javascript
  if (cfg.advantages?.voteBlock?.enabled) {
    if (gs.advantages.filter(a=>a.type==='voteBlock').length < (cfg.advantages.voteBlock.count||1)) advPool.push('voteBlock');
  }
```

Add:

```javascript
  if (cfg.advantages?.safetyNoPower?.enabled) {
    if (gs.advantages.filter(a=>a.type==='safetyNoPower').length < (cfg.advantages.safetyNoPower.count||1)) advPool.push('safetyNoPower');
  }
```

- [ ] **Step 2: Add to patchEpisodeHistory**

Find `patchEpisodeHistory`. Add:

```javascript
  if (ep.safetyNoPowerPlayed) h.safetyNoPowerPlayed = ep.safetyNoPowerPlayed;
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html DATA_SEASON/ideas_probabilistic_moments.txt
git commit -m "feat: Safety Without Power in journey pool + backlog update"
```

---

### Task 8: Verify and Test

- [ ] **Step 1: Open simulator.html in browser**

Create a season with Safety Without Power enabled (count: 2 for higher discovery chance). Also enable Journey twist.

- [ ] **Step 2: Run a season and verify**

Check for:
- "ADVANTAGE FOUND" badge when discovered at camp
- Confession/snoop events appearing in camp screens
- "SAFETY WITHOUT POWER" banner on votes screen when played
- Bond damage to allies after play
- Heat +1.0 next episode for the player who used it
- Popularity +0.3 (surprise) or -0.2 (warned)
- bigMoves +1
- Post-play camp events (aftermath/escaped)
- Journey can award it

- [ ] **Step 3: Final commit if fixes needed**

```bash
git add simulator.html
git commit -m "fix: Safety Without Power polish from testing"
```
