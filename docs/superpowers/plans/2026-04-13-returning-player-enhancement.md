# Returning Player Twist Enhancement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the returning-player twist to support 1-3 returnees per episode, each with a configurable "reason for returning" that drives weighted selection.

**Architecture:** Extend the existing twist config object with `returnCount` and `returnReasons[]`. Add 5 weight functions in a reason-to-weight map. Loop selection in `applyTwist`. Update all 12+ downstream references from `twistObj.returnee` (string) to `twistObj.returnees[]` (array of `{name, reason}` objects), keeping `twistObj.returnee` as a backward-compat alias.

**Tech Stack:** Vanilla JS, single file (`simulator.html`)

**Spec:** `docs/superpowers/specs/2026-04-13-returning-player-enhancement-design.md`

---

### Task 1: Add reason weight functions and update applyTwist selection logic

**Files:**
- Modify: `simulator.html:29712-29740`

This is the core change. Replace the single `wRandom` call with a loop that picks N returnees using reason-specific weight functions.

- [ ] **Step 1: Add the reason-to-weight-function map above the returning-player block**

Insert just before line 29712 (the `} else if (engineType === 'returning-player')` line). These weight functions will be used by `wRandom` to select returnees. Place them as a const inside the `applyTwist` function scope, or just above the returning-player branch:

```javascript
// ── RETURNING-PLAYER WEIGHT FUNCTIONS ──
const _rpWeightFns = {
  'random': (name) => Math.max(0.1, pStats(name).strategic * 0.3 + Math.random() * 3),
  'unfinished-business': (name) => {
    let w = 0.1;
    // Strong bonds (positive or negative) with active players
    const bondStrengths = gs.activePlayers.map(p => Math.abs(getBond(name, p)));
    w += (Math.max(...bondStrengths, 0)) * 1.5;
    // Was blindsided: their vote didn't match who went home (them)
    const elimEp = gs.episodeHistory.find(h => h.eliminated === name || (h.eliminatedPlayers||[]).includes(name));
    if (elimEp) {
      const theirVote = (elimEp.votingLog || []).find(v => v.voter === name);
      if (theirVote && theirVote.voted !== name) w += 2; // they voted for someone else — blindside
    }
    // Held an advantage when eliminated
    const heldAdv = (gs._eliminatedAdvantages || []).includes(name);
    if (heldAdv) w += 2;
    return Math.max(0.1, w + Math.random() * 0.5);
  },
  'entertainment': (name) => {
    let w = 0.1;
    const s = pStats(name);
    w += s.social * 0.4;
    // Showmance involvement
    if ((gs.showmances || []).some(sh => sh.pair.includes(name))) w += 3;
    if ((gs.romanticSparks || []).some(sp => sp.pair?.includes(name) || sp.a === name || sp.b === name)) w += 1.5;
    // General entertainment: boldness + social
    w += s.boldness * 0.2;
    return Math.max(0.1, w + Math.random() * 0.5);
  },
  'strategic-threat': (name) => {
    let w = 0.1;
    const s = pStats(name);
    w += s.strategic * 0.5;
    // Alliance membership with active players
    const activeAlliances = (gs.namedAlliances || []).filter(a =>
      a.members.includes(name) && a.members.some(m => m !== name && gs.activePlayers.includes(m))
    );
    w += activeAlliances.length * 1.5;
    // Disruption: would they shake up the dominant alliance?
    // Approximate by counting enemies among current power players
    const enemies = gs.activePlayers.filter(p => getBond(name, p) <= -3);
    w += enemies.length * 0.5;
    return Math.max(0.1, w + Math.random() * 0.5);
  },
  'underdog': (name) => {
    let w = 0.1;
    // Eliminated early = higher weight
    const elimEp = gs.episodeHistory.find(h => h.eliminated === name || (h.eliminatedPlayers||[]).includes(name));
    if (elimEp) {
      const elimEpNum = elimEp.episode || 1;
      const totalEps = gs.episodeHistory.length || 1;
      w += (1 - elimEpNum / totalEps) * 5; // earlier = higher
    }
    // Low threat perception
    const s = pStats(name);
    w += (10 - s.strategic) * 0.2; // less strategic = more underdog
    w += (10 - s.physical) * 0.1;
    return Math.max(0.1, w + Math.random() * 0.5);
  },
};
```

- [ ] **Step 2: Replace the returning-player applyTwist block**

Replace lines 29712-29740 (from `} else if (engineType === 'returning-player') {` through the closing narrative event block, up to but NOT including `} else if (engineType === 'spirit-island')`) with:

```javascript
  } else if (engineType === 'returning-player') {
    const returnCount = twistObj.returnCount || 1;
    const returnReasons = twistObj.returnReasons || ['random'];
    let eligible = gs.eliminated.filter(p => !gs.riPlayers.includes(p) && !(gs.jury||[]).includes(p));
    if (!eligible.length) { twistObj.noReturn = true; return; }

    const returnees = [];
    for (let i = 0; i < returnCount; i++) {
      if (!eligible.length) break;
      const reason = returnReasons[i] || 'random';
      const weightFn = _rpWeightFns[reason] || _rpWeightFns['random'];
      const picked = wRandom(eligible, weightFn);
      returnees.push({ name: picked, reason });
      eligible = eligible.filter(p => p !== picked);
    }

    if (!returnees.length) { twistObj.noReturn = true; return; }
    twistObj.returnees = returnees;
    twistObj.returnee = returnees[0].name; // backward compat alias

    // Update game state for each returnee
    returnees.forEach(({ name: returnee }) => {
      gs.eliminated = gs.eliminated.filter(p => p !== returnee);
      gs.activePlayers.push(returnee);

      // Pre-merge: join smallest tribe (recalculated each time for distribution)
      if (gs.phase === 'pre-merge' && gs.tribes.length) {
        const smallest = [...gs.tribes].sort((a,b) => a.members.length - b.members.length)[0];
        smallest.members.push(returnee);
      }

      // Bond adjustments
      Object.keys(gs.bonds).forEach(k => {
        if (k.includes(returnee) && gs.bonds[k] < -1) gs.bonds[k] = -1;
      });
      gs.activePlayers.filter(p => p !== returnee).forEach(p => {
        const b = getBond(returnee, p);
        if (b >= 4) addBond(returnee, p, 1);
        else if (b <= -3) addBond(returnee, p, -0.5);
      });
    });

    // Narrative events — one per returnee, keyed by their tribe
    ep.twistNarrativeEvents = ep.twistNarrativeEvents || {};
    const _rpReasonLabel = { 'unfinished-business':'unfinished business', 'entertainment':'the drama they bring', 'strategic-threat':'the threat they pose', 'underdog':'a second shot', 'random':'sheer will' };
    returnees.forEach(({ name: returnee, reason }) => {
      const returnTribeKey = gs.phase === 'pre-merge' && gs.tribes.length
        ? ([...gs.tribes].find(t => t.members.includes(returnee))?.name || 'merge')
        : (gs.mergeName || 'merge');
      const reasonText = _rpReasonLabel[reason] || 'sheer will';
      // Use unique key per returnee to avoid overwriting
      ep.twistNarrativeEvents[returnTribeKey + ':return-' + returnee] = { type: 'rumor', text: _pick([
        `${returnee} walked back into camp — driven by ${reasonText}. Some faces lit up. Others went very still.`,
        `${returnee} was back, and everyone knew why: ${reasonText}. The game had moved on without them — and now it had to make room again.`,
        `The tribe had voted ${returnee} out. Now they were standing right there, fueled by ${reasonText}. The conversations that followed were careful.`,
      ]) };
    });
```

- [ ] **Step 3: Verify the block ends correctly**

The closing of this block should flow into `} else if (engineType === 'spirit-island') {` on the next line (line 29742). Make sure there are no orphaned braces.

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: multi-returnee selection with reason-based weight functions"
```

---

### Task 2: Update twist config UI in Episode Format Designer

**Files:**
- Modify: `simulator.html:50691-50694` (timeline twist tags)
- Modify: `simulator.html:50851` (assignTwist — store default config)
- Modify: `simulator.html:50873-50876` (updateTwist)

Add count + reason dropdowns to the timeline twist tags, and wire up the `assignTwist` function to set default values.

- [ ] **Step 1: Update `assignTwist` to set default returnCount and returnReasons**

At line 50851, the twist entry is pushed:
```javascript
seasonConfig.twistSchedule.push({ id: 'tw-' + Date.now() + '-' + ep, episode: ep, type: twistId });
```

Replace with:
```javascript
    const entry = { id: 'tw-' + Date.now() + '-' + ep, episode: ep, type: twistId };
    if (twistId === 'returning-player') { entry.returnCount = 1; entry.returnReasons = ['random']; }
    seasonConfig.twistSchedule.push(entry);
```

- [ ] **Step 2: Update the twist tag rendering in `renderTimeline` to show config UI for returning-player**

At lines 50691-50694, the twist tags are rendered. Replace the tag generation:

Find this code:
```javascript
    const twistTags  = twists.map(t => {
      const cat = TWIST_CATALOG.find(c => c.id === t.type);
      return `<span class="fd-ep-twist-tag" onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')">${cat ? cat.emoji : '🔀'} ${cat ? cat.name : t.type} ×</span>`;
    }).join('');
```

Replace with:
```javascript
    const twistTags  = twists.map(t => {
      const cat = TWIST_CATALOG.find(c => c.id === t.type);
      if (t.type === 'returning-player') {
        const rc = t.returnCount || 1;
        const reasons = t.returnReasons || ['random'];
        const reasonOpts = ['random','unfinished-business','entertainment','strategic-threat','underdog'];
        const reasonLabels = { 'random':'Random', 'unfinished-business':'Unfinished Business', 'entertainment':'Entertainment', 'strategic-threat':'Strategic Threat', 'underdog':'Underdog' };
        let configHtml = `<select onchange="event.stopPropagation();updateTwist('${t.id}','returnCount',+this.value)" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 2px;margin-left:4px">`;
        for (let n = 1; n <= 3; n++) configHtml += `<option value="${n}" ${n===rc?'selected':''}>${n}</option>`;
        configHtml += `</select>`;
        // Reason dropdowns for each slot
        for (let s = 0; s < rc; s++) {
          configHtml += `<select onchange="event.stopPropagation();_updateReturnReason('${t.id}',${s},this.value)" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(99,102,241,0.3);border-radius:3px;padding:1px 2px;margin-left:2px" title="Slot ${s+1} reason">`;
          reasonOpts.forEach(r => configHtml += `<option value="${r}" ${reasons[s]===r?'selected':''}>${reasonLabels[r]}</option>`);
          configHtml += `</select>`;
        }
        return `<span class="fd-ep-twist-tag" style="display:inline-flex;align-items:center;gap:2px;flex-wrap:wrap">${cat.emoji} ${cat.name} ${configHtml} <span onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')" style="cursor:pointer;margin-left:4px">×</span></span>`;
      }
      return `<span class="fd-ep-twist-tag" onclick="event.stopPropagation();removeTwistFromEpisode(${ep},'${t.id}')">${cat ? cat.emoji : '🔀'} ${cat ? cat.name : t.type} ×</span>`;
    }).join('');
```

- [ ] **Step 3: Add the `_updateReturnReason` helper and update `updateTwist` to handle returnCount changes**

Insert after the `updateTwist` function (after line 50876):

```javascript
function _updateReturnReason(twistId, slotIdx, reason) {
  const t = (seasonConfig.twistSchedule||[]).find(t => t.id === twistId);
  if (!t) return;
  if (!t.returnReasons) t.returnReasons = ['random'];
  t.returnReasons[slotIdx] = reason;
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTimeline();
}
```

Also update `updateTwist` (line 50873-50876) to handle `returnCount` changes — when count changes, resize the `returnReasons` array:

Find:
```javascript
function updateTwist(id, field, value) {
  const t = (seasonConfig.twistSchedule||[]).find(t => t.id === id);
  if (t) { t[field] = value; localStorage.setItem('simulator_config', JSON.stringify(seasonConfig)); renderTimeline(); }
}
```

Replace with:
```javascript
function updateTwist(id, field, value) {
  const t = (seasonConfig.twistSchedule||[]).find(t => t.id === id);
  if (!t) return;
  t[field] = value;
  // When returnCount changes, resize returnReasons array
  if (field === 'returnCount' && t.type === 'returning-player') {
    const reasons = t.returnReasons || ['random'];
    while (reasons.length < value) reasons.push('random');
    t.returnReasons = reasons.slice(0, value);
  }
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTimeline();
}
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: returning-player UI — count dropdown + per-slot reason selectors"
```

---

### Task 3: Update return count prediction in Episode Format Designer

**Files:**
- Modify: `simulator.html:50617`

The timeline player-count prediction hardcodes returning-player as 1 return. Update it to read the configured `returnCount`.

- [ ] **Step 1: Replace the return count prediction**

Find (line 50617):
```javascript
    let returns = (_allTypes.includes('returning-player') || _allTypes.includes('second-chance')) ? 1 : 0;
```

Replace with:
```javascript
    let returns = _allTypes.includes('second-chance') ? 1 : 0;
    const _rpTwist = schedule.filter(t => Number(t.episode) === ep).find(t => t.type === 'returning-player');
    if (_rpTwist) returns += (_rpTwist.returnCount || 1);
```

Note: this requires the `schedule` variable to be in scope. Check that the loop at this location has access to `schedule` (which is `seasonConfig.twistSchedule`). The `buildEpisodeMap` function may need the schedule passed in, or you may need to reference `seasonConfig.twistSchedule` directly. Read the surrounding code to verify — if `schedule` isn't in scope, use `(seasonConfig.twistSchedule||[])` instead.

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "fix: return count prediction uses configured returnCount instead of hardcoded 1"
```

---

### Task 4: Update merge calculation logic

**Files:**
- Modify: `simulator.html:40240-40242`

The merge check counts twist returns. Currently it filters for `.returnee` (single). Update to count `returnees.length`.

- [ ] **Step 1: Update `_twistReturns` calculation**

Find (line 40240):
```javascript
  const _twistReturns = (ep.twists || []).filter(t => t.returnee && (t.type === 'second-chance' || t.type === 'returning-player')).length;
```

Replace with:
```javascript
  const _twistReturns = (ep.twists || []).reduce((sum, t) => {
    if (t.type === 'second-chance' && t.returnee) return sum + 1;
    if (t.type === 'returning-player' && t.returnees?.length) return sum + t.returnees.length;
    return sum;
  }, 0);
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "fix: merge calculation counts all returnees, not just first"
```

---

### Task 5: Update camp event boost to scale with returnee count

**Files:**
- Modify: `simulator.html:38304-38309`

Scale the camp event boosts by the number of returnees.

- [ ] **Step 1: Update the returning-player case in camp event boosting**

Find (lines 38304-38309):
```javascript
      case 'returning-player':
        // Disruption — existing alliances rattled, scheming to handle returner
        boost('tdStrategy', 30); boost('dispute', 25);
        boost('eavesdrop', 20); boost('leadershipClash', 15);
        boost('rumor', 15);
        break;
```

Replace with:
```javascript
      case 'returning-player': {
        // Disruption — existing alliances rattled, scheming to handle returners
        const _rpCount = tw.returnees?.length || 1;
        boost('tdStrategy', 30 * _rpCount); boost('dispute', 25 * _rpCount);
        boost('eavesdrop', 20 * _rpCount); boost('leadershipClash', 15 * _rpCount);
        boost('rumor', 15 * _rpCount);
        break;
      }
```

Note: verify that `tw` is the twist object in scope at this location. Read the surrounding switch statement to confirm the variable name — it may be `t` or `twist` instead of `tw`.

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: camp event boosts scale with number of returnees"
```

---

### Task 6: Update ambassador exclusion logic

**Files:**
- Modify: `simulator.html:30609` and `simulator.html:30643`

The ambassador twist excludes returnees using `.returnee` (single string). Update to extract all returnee names from `.returnees[]`.

- [ ] **Step 1: Update returnee set construction at line 30609**

Find:
```javascript
    const _thisEpReturneesSet = new Set((ep.twists || []).filter(t => t.returnee).map(t => t.returnee));
```

Replace with:
```javascript
    const _thisEpReturneesSet = new Set((ep.twists || []).flatMap(t => t.returnees ? t.returnees.map(r => r.name) : t.returnee ? [t.returnee] : []));
```

- [ ] **Step 2: Update returnee set construction at line 30643**

Find:
```javascript
    const _thisEpReturnees = new Set((ep.twists || []).filter(t => t.returnee).map(t => t.returnee));
```

Replace with:
```javascript
    const _thisEpReturnees = new Set((ep.twists || []).flatMap(t => t.returnees ? t.returnees.map(r => r.name) : t.returnee ? [t.returnee] : []));
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "fix: ambassador exclusion handles multiple returnees"
```

---

### Task 7: Update VP scene builder (pre-tribal twist display)

**Files:**
- Modify: `simulator.html:44848-44855`

Update the returning-player VP scenes to show all returnees with their reasons.

- [ ] **Step 1: Replace the returning-player case**

Find (lines 44848-44855):
```javascript
      case 'returning-player':
        if (tw.returnee) {
          sc.push({ text: 'A door that was supposed to be closed just opened.', players: [tw.returnee] });
          sc.push({ text: `${tw.returnee} fought their way back into the game.`, players: [tw.returnee], badge:'Returns', badgeClass:'win' });
        } else {
          sc.push({ text: 'A returning player slot was on the line — no eligible players could make it back this episode.', players: [] });
        }
        result.push({ label:'Returning Player', type:tw.type, scenes:sc }); break;
```

Replace with:
```javascript
      case 'returning-player':
        if (tw.returnees?.length) {
          const _rpReasonLabel = { 'unfinished-business':'unfinished business', 'entertainment':'the drama they bring', 'strategic-threat':'the threat they pose', 'underdog':'a second shot', 'random':'sheer will' };
          if (tw.returnees.length === 1) {
            sc.push({ text: 'A door that was supposed to be closed just opened.', players: [tw.returnees[0].name] });
            sc.push({ text: `${tw.returnees[0].name} fought their way back — driven by ${_rpReasonLabel[tw.returnees[0].reason] || 'sheer will'}.`, players: [tw.returnees[0].name], badge:'Returns', badgeClass:'win' });
          } else {
            sc.push({ text: `${tw.returnees.length} doors that were supposed to be closed just opened.`, players: tw.returnees.map(r => r.name) });
            tw.returnees.forEach(r => {
              sc.push({ text: `${r.name} is back — driven by ${_rpReasonLabel[r.reason] || 'sheer will'}.`, players: [r.name], badge:'Returns', badgeClass:'win' });
            });
          }
        } else if (tw.returnee) {
          // backward compat: old format with single returnee string
          sc.push({ text: 'A door that was supposed to be closed just opened.', players: [tw.returnee] });
          sc.push({ text: `${tw.returnee} fought their way back into the game.`, players: [tw.returnee], badge:'Returns', badgeClass:'win' });
        } else {
          sc.push({ text: 'A returning player slot was on the line — no eligible players could make it back this episode.', players: [] });
        }
        result.push({ label:'Returning Player', type:tw.type, scenes:sc }); break;
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: VP scene builder shows all returnees with reasons"
```

---

### Task 8: Update tribal summary display

**Files:**
- Modify: `simulator.html:45718-45720`

- [ ] **Step 1: Replace the returning-player tribal summary**

Find (lines 45718-45720):
```javascript
    } else if (tw.type === 'returning-player') {
      if (tw.noReturn) ln('RETURNING PLAYER — no eligible players could return.');
      else if (tw.returnee) ln(`RETURNING PLAYER — ${tw.returnee} fought their way back into the game.`);
```

Replace with:
```javascript
    } else if (tw.type === 'returning-player') {
      if (tw.noReturn) ln('RETURNING PLAYER — no eligible players could return.');
      else if (tw.returnees?.length) {
        const _rpReasonLabel = { 'unfinished-business':'unfinished business', 'entertainment':'entertainment value', 'strategic-threat':'strategic threat', 'underdog':'underdog grit', 'random':'sheer will' };
        tw.returnees.forEach(r => ln(`RETURNING PLAYER — ${r.name} fought back into the game (${_rpReasonLabel[r.reason] || 'sheer will'}).`));
      } else if (tw.returnee) ln(`RETURNING PLAYER — ${tw.returnee} fought their way back into the game.`);
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: tribal summary lists each returnee with reason"
```

---

### Task 9: Update episode summary narrative

**Files:**
- Modify: `simulator.html:49207`

- [ ] **Step 1: Replace the returning-player summary line**

Find (line 49207):
```javascript
    if (tw.type === 'returning-player') lines.push(`A player came back. The tribe that voted them out has to decide whether that's a threat or an asset. Both options have a cost.`);
```

Replace with:
```javascript
    if (tw.type === 'returning-player') {
      const _rpN = tw.returnees?.length || 1;
      if (_rpN === 1) lines.push(`A player came back. The tribe that voted them out has to decide whether that's a threat or an asset. Both options have a cost.`);
      else lines.push(`${_rpN} players came back. The game that moved on without them just got a lot more crowded. Every existing alliance has to recalculate.`);
    }
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: episode summary scales text for multi-returnee episodes"
```

---

### Task 10: Update `getPlayerNamesFromTwist` and `buildTwistDesc`

**Files:**
- Modify: `simulator.html:53863` (getPlayerNamesFromTwist)
- Modify: `simulator.html:53898` (buildTwistDesc)

- [ ] **Step 1: Update `getPlayerNamesFromTwist`**

Find (line 53863):
```javascript
    case 'returning-player':  if (tw.returnee) names.push(tw.returnee); break;
```

Replace with:
```javascript
    case 'returning-player':  if (tw.returnees?.length) tw.returnees.forEach(r => names.push(r.name)); else if (tw.returnee) names.push(tw.returnee); break;
```

- [ ] **Step 2: Update `buildTwistDesc`**

Find (line 53898):
```javascript
    case 'returning-player':   if (tw.returnee) L.push(`${tw.returnee} fought their way back into the game.`); else L.push('No eligible players could return this episode.'); break;
```

Replace with:
```javascript
    case 'returning-player': {
      const _rpReasonLabel = { 'unfinished-business':'unfinished business', 'entertainment':'entertainment value', 'strategic-threat':'strategic threat', 'underdog':'underdog grit', 'random':'sheer will' };
      if (tw.returnees?.length) tw.returnees.forEach(r => L.push(`${r.name} fought back into the game (${_rpReasonLabel[r.reason] || 'sheer will'}).`));
      else if (tw.returnee) L.push(`${tw.returnee} fought their way back into the game.`);
      else L.push('No eligible players could return this episode.');
      break;
    }
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: VP helpers extract all returnee names and build multi-returnee descriptions"
```

---

### Task 11: Update twist catalog description

**Files:**
- Modify: `simulator.html:2262`

- [ ] **Step 1: Update the twist catalog entry description**

Find (line 2262):
```javascript
  { id:'returning-player', emoji:'🔁', name:'Returning Player',     category:'returns',    phase:'any',        desc:'A previously eliminated player returns. Tribal still runs — someone goes home. Net zero change in count.',  engineType:'returning-player'},
```

Replace with:
```javascript
  { id:'returning-player', emoji:'🔁', name:'Returning Player',     category:'returns',    phase:'any',        desc:'1-3 previously eliminated players return, each for a chosen reason (unfinished business, entertainment, strategic threat, underdog, or random). One tribal still runs.',  engineType:'returning-player'},
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "docs: update returning-player twist description for multi-returnee support"
```

---

### Task 12: Update the timeline twist tag to show returnee count

**Files:**
- Modify: `simulator.html:50691-50694` (already modified in Task 2, but the runtime timeline in the results/VP needs updating too)

The Episode Format Designer tags were updated in Task 2. But we also need the runtime season timeline (if it displays twist info after simulation) to reflect multiple returnees. Check if the results timeline uses a different rendering path.

- [ ] **Step 1: Search for any other timeline/tag rendering that shows returnee info**

Grep for `returnee` in the context of timeline or results display. If there's a separate results timeline renderer, update it. If it reuses `buildTwistDesc`, it's already handled by Task 10.

- [ ] **Step 2: Commit if changes were made**

```bash
git add simulator.html
git commit -m "feat: results timeline shows all returnees"
```

---

### Task 13: Verify `applyTwist` receives twist config from schedule

**Files:**
- Modify: `simulator.html:40198-40209` (twist processing in episode init)

The twist schedule entries include `returnCount` and `returnReasons`, but `applyTwist` receives `twistObj`. Verify that the scheduled twist config (from `seasonConfig.twistSchedule`) is passed through to `applyTwist` so that `twistObj.returnCount` and `twistObj.returnReasons` are available.

- [ ] **Step 1: Read the twist scheduling code around line 40198**

Check how `scheduledTwists` are constructed and passed to `applyTwist`. The twist schedule entries from `seasonConfig.twistSchedule` should flow through as-is. If they're reconstructed (e.g., only `{ type }` is passed), you need to include `returnCount` and `returnReasons`.

- [ ] **Step 2: If needed, ensure config fields are preserved**

If the twist object is reconstructed before being passed to `applyTwist`, add `returnCount` and `returnReasons` to the construction:

```javascript
// Example — only if needed:
{ type: scheduled.type, ...scheduled }
```

- [ ] **Step 3: Commit if changes were made**

```bash
git add simulator.html
git commit -m "fix: preserve returnCount and returnReasons through twist pipeline"
```

---

### Task 14: Final integration test

- [ ] **Step 1: Open the simulator in a browser**

Open `simulator.html` in a browser. Navigate to the Episode Format Designer.

- [ ] **Step 2: Test the UI**

1. Select an episode in the timeline
2. Assign "Returning Player" twist
3. Verify the count dropdown (1/2/3) appears in the twist tag
4. Change count to 2 — verify two reason dropdowns appear
5. Change count to 3 — verify three reason dropdowns appear
6. Change count back to 1 — verify extra dropdowns disappear
7. Set different reasons for each slot
8. Remove and re-add the twist — verify defaults are 1 / Random

- [ ] **Step 3: Test the simulation**

1. Configure a season with a returning-player twist on an episode, set to 2 returnees with different reasons
2. Run the simulation
3. Check the text backlog — verify both returnees are mentioned with their reasons
4. Check the VP screen — verify both returnees appear with badges
5. Check the tribal summary — verify both RETURNING PLAYER lines appear
6. Check the episode summary — verify the multi-returnee text

- [ ] **Step 4: Test edge cases**

1. Set returnCount to 3 but have only 1 eliminated player — verify partial return works (1 comes back, no crash)
2. Set returnCount to 1 — verify backward-compatible behavior (identical to old behavior)
3. Test pre-merge: verify returnees go to different tribes (smallest recalculated)
4. Test post-merge: verify no tribe placement logic fires

- [ ] **Step 5: Final commit**

```bash
git add simulator.html
git commit -m "test: verify returning-player multi-returnee enhancement end-to-end"
```
