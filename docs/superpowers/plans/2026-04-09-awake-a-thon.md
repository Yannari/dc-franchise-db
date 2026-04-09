# Awake-A-Thon Challenge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a schedulable pre-merge tribe challenge where players run, feast, then try to stay awake the longest. Mid-challenge social events (bonding, alliances, showmance, cheating, scheming) fire between dropouts.

**Architecture:** `simulateAwakeAThon(ep)` generates all 3 phases + social events + blame. Follows exact cliff dive pattern: TWIST_CATALOG entry, applyTwist flag, engine function, `ep.chalMemberScores` for `updateChalRecord`, VP timeline, badges, text backlog, cold open recap.

**Tech Stack:** Vanilla JS in `simulator.html`

---

### Task 1: TWIST_CATALOG + applyTwist Flag

**Files:**
- Modify: `simulator.html:1633` (after cliff-dive in TWIST_CATALOG)
- Modify: `simulator.html:12540` (applyTwist — add awake-a-thon branch after cliff-dive)

- [ ] **Step 1: Add TWIST_CATALOG entry**

Find the cliff-dive entry (line ~1633). Insert AFTER it:
```javascript
  { id:'awake-a-thon', emoji:'😴', name:'Awake-A-Thon', category:'challenge', phase:'pre-merge', desc:'Three-phase endurance: 20km run, feast trap, then stay awake. Last team standing wins. Mid-challenge social events fire between dropouts.', engineType:'awake-a-thon' },
```

- [ ] **Step 2: Add applyTwist flag**

Find `} else if (engineType === 'cliff-dive') {` (line ~12540). After the cliff-dive block (which ends with `ep.isCliffDive = true;` then the next else-if), insert:
```javascript
  } else if (engineType === 'awake-a-thon') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isAwakeAThon = true;
```

- [ ] **Step 3: Add to rpBuildPreTwist filter**

Find the long `.filter(t =>` line in `rpBuildPreTwist` that excludes twist types shown in dedicated screens (search for `t.type !== 'cliff-dive'`). Add `&& t.type !== 'awake-a-thon'` to the filter chain.

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: add awake-a-thon to TWIST_CATALOG and applyTwist"
```

---

### Task 2: Engine — `simulateAwakeAThon(ep)`

**Files:**
- Modify: `simulator.html` — insert function after `simulateCliffDive`, before `simulatePhobiaFactor`

- [ ] **Step 1: Add the simulateAwakeAThon function**

Find `function simulatePhobiaFactor(ep)`. Insert BEFORE it (after the cliff dive constants/function block):

```javascript
// ══════════════════════════════════════════════════════════════════════
// AWAKE-A-THON CHALLENGE
// ══════════════════════════════════════════════════════════════════════

function simulateAwakeAThon(ep) {
  const tribes = gs.tribes;
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const host = seasonConfig.host || 'Chris';

  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });

  const allMembers = tribes.flatMap(t => t.members);

  // ── Phase 1: The Run ──
  const runResults = [];
  allMembers.forEach(name => {
    const s = pStats(name);
    const finishChance = s.physical * 0.06 + s.endurance * 0.05 + 0.20;
    runResults.push({ name, finished: Math.random() < finishChance });
  });
  const feastEaters = runResults.filter(r => r.finished).map(r => r.name);
  const feastSet = new Set(feastEaters);

  // ── Phase 3: The Awake-A-Thon (sequential dropout) ──
  const awake = new Set(allMembers);
  const rounds = [];
  const socialEventsDone = { bonds: new Set(), alliances: new Set(), schemes: new Set(), cheaters: new Set() };
  let roundNum = 0;
  const totalPlayers = allMembers.length;
  const fairyTaleThreshold = Math.ceil(totalPlayers * 0.30);
  const canadaThreshold = Math.ceil(totalPlayers * 0.70);
  let fairyTaleRound = null, canadaRound = null;
  let totalDropouts = 0;

  // Track tribe awake counts
  const tribeOf = {};
  tribes.forEach(t => t.members.forEach(m => { tribeOf[m] = t.name; }));

  while (true) {
    roundNum++;

    // Check if any tribe is fully asleep → game over
    const tribeAwake = {};
    tribes.forEach(t => { tribeAwake[t.name] = t.members.filter(m => awake.has(m)).length; });
    const deadTribes = tribes.filter(t => tribeAwake[t.name] === 0);
    if (deadTribes.length > 0) break;

    // Each awake player rolls to stay awake
    const rolls = [];
    awake.forEach(name => {
      const s = pStats(name);
      const feastDebuff = feastSet.has(name) ? -0.15 : 0;
      const stayChance = s.endurance * 0.07 + s.mental * 0.04 + s.physical * 0.02 + 0.10 + feastDebuff;
      const roll = Math.random();
      rolls.push({ name, roll, passed: roll < stayChance, stayChance });
    });

    // Lowest roller falls asleep
    rolls.sort((a, b) => {
      // Failed rolls drop first, then lowest roll among failures, then lowest among passes
      if (!a.passed && b.passed) return -1;
      if (a.passed && !b.passed) return 1;
      return a.roll - b.roll;
    });
    const dropout = rolls[0];
    awake.delete(dropout.name);
    totalDropouts++;

    // Phase markers
    if (!fairyTaleRound && totalDropouts >= fairyTaleThreshold) fairyTaleRound = roundNum;
    if (!canadaRound && totalDropouts >= canadaThreshold) canadaRound = roundNum;

    // ── Mid-challenge social events (1-2 per round, among awake players) ──
    const roundSocialEvents = [];
    const awakePlayers = [...awake];
    let eventsThisRound = 0;
    const maxEvents = Math.min(2, Math.floor(awakePlayers.length / 3));

    // Bonding (~40%)
    if (eventsThisRound < maxEvents && Math.random() < 0.40 && awakePlayers.length >= 2) {
      for (let bi = 0; bi < awakePlayers.length && eventsThisRound < maxEvents; bi++) {
        for (let bj = bi + 1; bj < awakePlayers.length; bj++) {
          const pairKey = [awakePlayers[bi], awakePlayers[bj]].sort().join('|');
          if (socialEventsDone.bonds.has(pairKey)) continue;
          if (getBond(awakePlayers[bi], awakePlayers[bj]) >= 1.0) {
            addBond(awakePlayers[bi], awakePlayers[bj], 0.3);
            socialEventsDone.bonds.add(pairKey);
            const pr1 = pronouns(awakePlayers[bi]);
            roundSocialEvents.push({
              type: 'awakeAThonBond', players: [awakePlayers[bi], awakePlayers[bj]],
              text: `${awakePlayers[bi]} and ${awakePlayers[bj]} talk quietly to stay awake. The conversation runs deeper than either expected.`,
              badgeText: 'STAYING AWAKE TOGETHER', badgeClass: 'gold'
            });
            eventsThisRound++;
            break;
          }
        }
        if (eventsThisRound > 0) break;
      }
    }

    // Alliance pitch (~15%)
    if (eventsThisRound < maxEvents && Math.random() < 0.15 && awakePlayers.length >= 2) {
      const strategists = awakePlayers.filter(p => pStats(p).strategic >= 6);
      for (const initiator of strategists) {
        if (socialEventsDone.alliances.has(initiator)) continue;
        const partner = awakePlayers.find(p => p !== initiator && !socialEventsDone.alliances.has(p) && getBond(initiator, p) >= 0.5);
        if (!partner) continue;
        // Check if already allied
        const alreadyAllied = (gs.namedAlliances || []).some(a => a.active && a.members.includes(initiator) && a.members.includes(partner));
        if (alreadyAllied) continue;
        // Check global cap
        const activeAlliances = (gs.namedAlliances || []).filter(a => a.active).length;
        const globalCap = Math.max(2, Math.floor(gs.activePlayers.length * 0.4));
        if (activeAlliances >= globalCap) continue;
        // Form side deal
        const s = pStats(initiator);
        const genuineChance = s.loyalty * 0.09 + getBond(initiator, partner) * 0.06
          - (10 - s.loyalty) * 0.02
          - ((gs.sideDeals || []).filter(d => d.active && d.players.includes(initiator)).length) * 0.2;
        const genuine = Math.random() < Math.max(0.15, Math.min(0.95, genuineChance));
        if (!gs.sideDeals) gs.sideDeals = [];
        gs.sideDeals.push({
          players: [initiator, partner], initiator, madeEp: (gs.episode || 0) + 1,
          type: 'f2', active: true, genuine
        });
        addBond(initiator, partner, 1.0);
        socialEventsDone.alliances.add(initiator);
        roundSocialEvents.push({
          type: 'awakeAThonDeal', players: [initiator, partner],
          text: `At ${roundNum > canadaThreshold ? '85 hours' : roundNum > fairyTaleThreshold ? '24 hours' : '12 hours'} in, ${initiator} leans over to ${partner}. "You and me. Final two. What do you say?"`,
          badgeText: 'LATE NIGHT DEAL', badgeClass: 'blue'
        });
        eventsThisRound++;
        break;
      }
    }

    // Showmance spark (~10%)
    if (eventsThisRound < maxEvents && Math.random() < 0.10 && awakePlayers.length >= 2) {
      const showmanceCount = (gs.showmances || []).filter(s => s.phase !== 'broken-up').length;
      if (showmanceCount < 2) {
        for (let si = 0; si < awakePlayers.length; si++) {
          for (let sj = si + 1; sj < awakePlayers.length; sj++) {
            const a = awakePlayers[si], b = awakePlayers[sj];
            if (getBond(a, b) >= 4 && romanticCompat(a, b)) {
              // Check not already in showmance
              const alreadyShowmance = (gs.showmances || []).some(s => s.players.includes(a) && s.players.includes(b));
              if (alreadyShowmance) continue;
              if (!gs.showmances) gs.showmances = [];
              gs.showmances.push({ players: [a, b], phase: 'spark', sparkEp: (gs.episode || 0) + 1, episodesActive: 0 });
              addBond(a, b, 1.0);
              roundSocialEvents.push({
                type: 'awakeAThonRomance', players: [a, b],
                text: `${a} and ${b} have been talking for hours. At some point the conversation stopped being about the game.`,
                badgeText: 'SLEEPLESS ROMANCE', badgeClass: 'pink'
              });
              eventsThisRound++;
              break;
            }
          }
          if (eventsThisRound >= maxEvents) break;
        }
      }
    }

    // Cheating (~8%)
    if (eventsThisRound < maxEvents && Math.random() < 0.08 && awakePlayers.length >= 3) {
      for (const cheater of awakePlayers) {
        if (socialEventsDone.cheaters.has(cheater)) continue;
        const s = pStats(cheater);
        const cheatChance = s.boldness * 0.04 + (10 - s.loyalty) * 0.03;
        if (Math.random() >= cheatChance) continue;
        // Detection
        const detectors = awakePlayers.filter(p => p !== cheater);
        const caught = detectors.some(d => Math.random() < pStats(d).intuition * 0.05);
        socialEventsDone.cheaters.add(cheater);
        if (caught) {
          const caughtBy = detectors.find(d => Math.random() < pStats(d).intuition * 0.05) || detectors[0];
          awake.delete(cheater);
          totalDropouts++;
          // Bond damage + heat
          const cheaterTribe = tribeOf[cheater];
          tribes.find(t => t.name === cheaterTribe)?.members.filter(m => m !== cheater).forEach(m => addBond(m, cheater, -0.5));
          if (!gs._awakeAThonBlame) gs._awakeAThonBlame = {};
          gs._awakeAThonBlame[cheater] = (gs._awakeAThonBlame[cheater] || 0) + 1.0;
          roundSocialEvents.push({
            type: 'awakeAThonCheat', players: [cheater, caughtBy],
            text: `${caughtBy} catches ${cheater} with ${pronouns(cheater).posAdj} eyes painted open. "Nice try." ${cheater} is disqualified.`,
            badgeText: 'CAUGHT CHEATING', badgeClass: 'red'
          });
          // Record cheater with score 0
          if (!ep.chalMemberScores) ep.chalMemberScores = {};
          ep.chalMemberScores[cheater] = 0;
          eventsThisRound++;
        }
        break;
      }
    }

    // Scheming (~10%)
    if (eventsThisRound < maxEvents && Math.random() < 0.10 && awakePlayers.length >= 2) {
      const schemers = awakePlayers.filter(p => {
        const arch = players.find(pl => pl.name === p)?.archetype || '';
        return arch === 'villain' || arch === 'schemer';
      });
      for (const schemer of schemers) {
        if (socialEventsDone.schemes.has(schemer)) continue;
        // Target: sleeping player from OTHER tribe
        const sleepers = allMembers.filter(m => !awake.has(m) && tribeOf[m] !== tribeOf[schemer]);
        if (!sleepers.length) continue;
        const target = sleepers[Math.floor(Math.random() * sleepers.length)];
        if (!gs._awakeAThonBlame) gs._awakeAThonBlame = {};
        gs._awakeAThonBlame[target] = (gs._awakeAThonBlame[target] || 0) + 0.8;
        socialEventsDone.schemes.add(schemer);
        // Bond damage if witnessed
        const witnesses = awakePlayers.filter(p => p !== schemer && tribeOf[p] === tribeOf[target]);
        witnesses.forEach(w => addBond(w, schemer, -0.3));
        roundSocialEvents.push({
          type: 'awakeAThonScheme', players: [schemer, target],
          text: `While ${target} sleeps, ${schemer} makes ${pronouns(schemer).posAdj} move. By morning, ${target} will have a much harder time at camp.`,
          badgeText: 'SABOTAGE', badgeClass: 'red-orange'
        });
        eventsThisRound++;
        break;
      }
    }

    rounds.push({
      round: roundNum,
      dropout: { name: dropout.name, tribe: tribeOf[dropout.name], roll: Math.round(dropout.roll * 1000) / 1000 },
      socialEvents: roundSocialEvents,
    });

    // Check again after dropout
    const tribeAwakePost = {};
    tribes.forEach(t => { tribeAwakePost[t.name] = t.members.filter(m => awake.has(m)).length; });
    const deadTribesPost = tribes.filter(t => tribeAwakePost[t.name] === 0);
    if (deadTribesPost.length > 0) break;
  }

  // ── Determine winner ──
  const tribeAwakeFinal = {};
  tribes.forEach(t => { tribeAwakeFinal[t.name] = t.members.filter(m => awake.has(m)).length; });
  // Sort: most awake first. Fully asleep = loser.
  const tribeSorted = [...tribes].sort((a, b) => tribeAwakeFinal[b.name] - tribeAwakeFinal[a.name]);
  const winner = tribeSorted[0];
  const loser = tribeSorted[tribeSorted.length - 1];

  // Last awake on winning tribe
  const lastAwake = winner.members.find(m => awake.has(m)) || null;

  // First to fall asleep overall
  const firstOut = rounds[0]?.dropout || null;

  // ── Set episode fields ──
  ep.challengeType = 'tribe';
  ep.winner = gs.tribes.find(t => t.name === winner.name);
  ep.loser = gs.tribes.find(t => t.name === loser.name);
  ep.safeTribes = tribeSorted.length > 2
    ? tribeSorted.slice(1, -1).map(t => gs.tribes.find(tr => tr.name === t.name)).filter(Boolean)
    : [];
  ep.challengeLabel = 'Awake-A-Thon';
  ep.challengeCategory = 'endurance';
  ep.challengeDesc = 'Three-phase endurance: 20km run, feast trap, stay awake.';
  ep.tribalPlayers = [...loser.members];
  ep.challengePlacements = tribeSorted.map(t => ({
    name: t.name, members: [...(gs.tribes.find(tr => tr.name === t.name)?.members || [])],
    memberScores: {},
  }));

  // ── Challenge member scores: round survived = score ──
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  allMembers.forEach(name => {
    if (ep.chalMemberScores[name] !== undefined) return; // cheater already scored 0
    const dropRound = rounds.find(r => r.dropout.name === name);
    ep.chalMemberScores[name] = dropRound ? dropRound.round : roundNum + 1; // still awake = max
  });

  // ── Blame: first out on losing tribe ──
  if (firstOut && firstOut.tribe === loser.name) {
    if (!gs._awakeAThonBlame) gs._awakeAThonBlame = {};
    gs._awakeAThonBlame[firstOut.name] = (gs._awakeAThonBlame[firstOut.name] || 0) + 1.0;
  }

  // ── Standout: last awake bond boost ──
  if (lastAwake) {
    winner.members.filter(m => m !== lastAwake).forEach(m => addBond(m, lastAwake, 0.4));
  }

  // ── Camp events ──
  // Iron will (last awake)
  if (lastAwake) {
    const pr = pronouns(lastAwake);
    const campKey = winner.name;
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
    if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];
    ep.campEvents[campKey].post.push({
      type: 'awakeAThonIronWill', players: [lastAwake],
      text: `${lastAwake} was the last one standing. ${roundNum} rounds. ${pr.Sub} never closed ${pr.posAdj} eyes.`,
      consequences: 'Bond +0.4 from teammates.',
      badgeText: 'IRON WILL', badgeClass: 'gold'
    });
  }
  // First out shame
  if (firstOut && firstOut.tribe === loser.name) {
    const pr = pronouns(firstOut.name);
    const campKey = firstOut.tribe;
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
    if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];
    ep.campEvents[campKey].post.push({
      type: 'awakeAThonFirstOut', players: [firstOut.name],
      text: `${firstOut.name} was the first to fall asleep. ${pr.Sub} didn't even make it past the twelve-hour mark.`,
      consequences: 'Heat +1.0.',
      badgeText: 'FIRST OUT', badgeClass: 'red'
    });
  }
  // Social events → camp events
  rounds.forEach(r => {
    r.socialEvents.forEach(evt => {
      const evtTribe = tribeOf[evt.players[0]] || winner.name;
      if (!ep.campEvents[evtTribe]) ep.campEvents[evtTribe] = { pre: [], post: [] };
      if (!ep.campEvents[evtTribe].post) ep.campEvents[evtTribe].post = [];
      ep.campEvents[evtTribe].post.push(evt);
    });
  });

  // ── Save to episode ──
  ep.awakeAThon = {
    runResults,
    feastEaters,
    rounds,
    phaseMarkers: { fairyTales: fairyTaleRound, historyOfCanada: canadaRound },
    winner: winner.name,
    lastAwake,
    firstOut,
    cheaters: [...socialEventsDone.cheaters].map(c => {
      const cheatEvt = rounds.flatMap(r => r.socialEvents).find(e => e.type === 'awakeAThonCheat' && e.players[0] === c);
      return { name: c, caught: !!cheatEvt, caughtBy: cheatEvt?.players[1] || null };
    }),
  };
}
```

- [ ] **Step 2: Wire into the pre-merge challenge branch**

Find `} else if (ep.isCliffDive && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {` (line ~23554). Insert AFTER the cliff-dive block:
```javascript
  } else if (ep.isAwakeAThon && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateAwakeAThon(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateAwakeAThon
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add simulateAwakeAThon engine function"
```

---

### Task 3: Heat Application + Cleanup + Episode History

**Files:**
- Modify: `simulator.html` — computeHeat, post-tribal cleanup, patchEpisodeHistory

- [ ] **Step 1: Add blame heat in computeHeat**

Find `if (gs._cliffDiveBlame?.[name]) heat += gs._cliffDiveBlame[name];` (line ~4201). Insert AFTER it:
```javascript
  if (gs._awakeAThonBlame?.[name]) heat += gs._awakeAThonBlame[name];
```

- [ ] **Step 2: Add cleanup after tribal**

Find `if (gs._cliffDiveBlame) delete gs._cliffDiveBlame;` (line ~26372). Insert AFTER it:
```javascript
    if (gs._awakeAThonBlame) delete gs._awakeAThonBlame;
```

- [ ] **Step 3: Add to patchEpisodeHistory**

Find `if (ep.isCliffDive) h.isCliffDive = true;` (line ~31674). Insert AFTER the cliff dive lines:
```javascript
  if (ep.isAwakeAThon) h.isAwakeAThon = true;
  if (!h.awakeAThon && ep.awakeAThon) h.awakeAThon = ep.awakeAThon;
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: add awake-a-thon blame heat, cleanup, and episode history"
```

---

### Task 4: VP Screen

**Files:**
- Modify: `simulator.html` — add `rpBuildAwakeAThon(ep)` function + register in `buildVPScreens`

- [ ] **Step 1: Add VP function**

Find `function rpBuildCliffDive(ep)`. Insert BEFORE it:

```javascript
function rpBuildAwakeAThon(ep) {
  const aat = ep.awakeAThon;
  if (!aat?.rounds?.length) return null;

  const stateKey = `aat_reveal_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // Build timeline steps: phase markers + dropouts + social events interleaved
  const steps = [];
  // Phase 1: run results
  steps.push({ type: 'run-results', runResults: aat.runResults, feastEaters: aat.feastEaters });
  // Phase 2: feast
  steps.push({ type: 'feast' });

  // Phase 3: dropouts + social events with phase markers
  let phaseMarkerShown = { fairyTales: false, historyOfCanada: false };
  aat.rounds.forEach(r => {
    if (!phaseMarkerShown.fairyTales && aat.phaseMarkers.fairyTales && r.round >= aat.phaseMarkers.fairyTales) {
      steps.push({ type: 'phase-marker', phase: 'fairyTales', label: '24 HOURS — FAIRY TALES', desc: `${seasonConfig.host || 'Chris'} reads fairy tales while Chef, dressed as a pink sheep, plays the harp.` });
      phaseMarkerShown.fairyTales = true;
    }
    if (!phaseMarkerShown.historyOfCanada && aat.phaseMarkers.historyOfCanada && r.round >= aat.phaseMarkers.historyOfCanada) {
      steps.push({ type: 'phase-marker', phase: 'historyOfCanada', label: '85 HOURS — HISTORY OF CANADA', desc: `${seasonConfig.host || 'Chris'} pulls out a pop-up book. The History of Canada. This is the endgame.` });
      phaseMarkerShown.historyOfCanada = true;
    }
    steps.push({ type: 'dropout', ...r.dropout, round: r.round });
    r.socialEvents.forEach(evt => {
      steps.push({ type: 'social', ...evt });
    });
  });
  // Winner
  steps.push({ type: 'winner', winner: aat.winner, lastAwake: aat.lastAwake });

  const allRevealed = state.idx >= steps.length - 1;
  const _aatReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){buildVPScreens(ep);renderVPScreen();}`;

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:#8b5cf6;text-shadow:0 0 20px rgba(139,92,246,0.3);margin-bottom:6px">AWAKE-A-THON</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:6px">20km run. A feast. Then the real challenge: stay awake.</div>
    <div style="text-align:center;font-size:11px;color:#6e7681;margin-bottom:20px">Last team with someone awake wins immunity.</div>`;

  steps.forEach((step, i) => {
    const isVisible = i <= state.idx;

    if (step.type === 'run-results') {
      if (!isVisible) {
        html += `<div style="padding:10px;margin-bottom:6px;border:1px solid var(--border);border-radius:8px;opacity:0.12;text-align:center;font-size:11px;color:var(--muted)">Phase 1 — The Run</div>`;
        return;
      }
      const finished = step.runResults.filter(r => r.finished);
      const dnf = step.runResults.filter(r => !r.finished);
      html += `<div style="padding:14px;margin-bottom:8px;border-radius:10px;border:1px solid rgba(139,92,246,0.2);background:rgba(139,92,246,0.04)">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#8b5cf6;margin-bottom:8px">PHASE 1 — THE RUN</div>
        <div style="font-size:12px;color:#8b949e;margin-bottom:10px">20 kilometres around the lake. ${finished.length} finish. ${dnf.length} don't.</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">${finished.map(r => `<div style="text-align:center">${rpPortrait(r.name, 'sm')}<div style="font-size:8px;color:#3fb950;font-weight:700">FINISHED</div></div>`).join('')}</div>
        ${dnf.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px">${dnf.map(r => `<div style="text-align:center">${rpPortrait(r.name, 'sm')}<div style="font-size:8px;color:#f85149;font-weight:700">DNF</div></div>`).join('')}</div>` : ''}
      </div>`;
    } else if (step.type === 'feast') {
      if (!isVisible) {
        html += `<div style="padding:10px;margin-bottom:6px;border:1px solid var(--border);border-radius:8px;opacity:0.12;text-align:center;font-size:11px;color:var(--muted)">Phase 2 — The Feast</div>`;
        return;
      }
      html += `<div style="padding:14px;margin-bottom:8px;border-radius:10px;border:1px solid rgba(227,179,65,0.2);background:rgba(227,179,65,0.04)">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#e3b341;margin-bottom:8px">PHASE 2 — THE FEAST</div>
        <div style="font-size:12px;color:#8b949e;line-height:1.6">"Congratulations on finishing the run. As a reward — a feast!" The campers eat like they've never seen food before. What they don't know: the real challenge hasn't started yet.</div>
        <div style="font-size:10px;color:#f0883e;margin-top:8px">Every player who ate gets a -0.15 stay-awake penalty. The feast was the trap.</div>
      </div>`;
    } else if (step.type === 'phase-marker') {
      if (!isVisible) {
        html += `<div style="padding:8px;margin-bottom:4px;border:1px solid var(--border);border-radius:6px;opacity:0.12;text-align:center;font-size:11px;color:var(--muted)">?</div>`;
        return;
      }
      html += `<div style="text-align:center;padding:14px;margin:12px 0;border-radius:8px;border:1px solid rgba(139,92,246,0.3);background:rgba(139,92,246,0.06)">
        <div style="font-family:var(--font-display);font-size:16px;letter-spacing:2px;color:#8b5cf6">${step.label}</div>
        <div style="font-size:11px;color:#8b949e;margin-top:4px">${step.desc}</div>
      </div>`;
    } else if (step.type === 'dropout') {
      if (!isVisible) {
        html += `<div style="padding:8px;margin-bottom:4px;border:1px solid var(--border);border-radius:6px;opacity:0.12;text-align:center;font-size:11px;color:var(--muted)">?</div>`;
        return;
      }
      const tc = tribeColor(step.tribe);
      html += `<div style="padding:10px 14px;margin-bottom:4px;border-radius:8px;border:1px solid var(--border);background:var(--surface);animation:scrollDrop 0.3s var(--ease-broadcast) both">
        <div style="display:flex;align-items:center;gap:10px">
          ${rpPortrait(step.name, 'sm')}
          <div style="flex:1">
            <span style="font-size:13px;font-weight:600;color:#e6edf3">${step.name}</span>
            <span style="font-size:10px;color:${tc};margin-left:6px">${step.tribe}</span>
          </div>
          <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#8b949e;background:rgba(139,148,158,0.1);padding:2px 8px;border-radius:3px">💤 FALLS ASLEEP</span>
        </div>
      </div>`;
    } else if (step.type === 'social') {
      if (!isVisible) {
        html += `<div style="padding:8px;margin-bottom:4px;border:1px solid var(--border);border-radius:6px;opacity:0.12;text-align:center;font-size:11px;color:var(--muted)">?</div>`;
        return;
      }
      const badgeColors = { gold: '#e3b341', blue: '#58a6ff', pink: '#db61a2', red: '#f85149', 'red-orange': '#f0883e' };
      const bc = badgeColors[step.badgeClass] || '#8b949e';
      html += `<div style="padding:10px 14px;margin-bottom:4px;border-radius:8px;border:1px solid ${bc}33;background:${bc}0a;animation:scrollDrop 0.3s var(--ease-broadcast) both">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          ${(step.players || []).map(p => rpPortrait(p, 'sm')).join('')}
          <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${bc};background:${bc}1a;padding:2px 8px;border-radius:3px">${step.badgeText}</span>
        </div>
        <div style="font-size:12px;color:#8b949e;line-height:1.5">${step.text}</div>
      </div>`;
    } else if (step.type === 'winner') {
      if (!isVisible) {
        html += `<div style="padding:10px;margin-bottom:6px;border:1px solid var(--border);border-radius:8px;opacity:0.12;text-align:center;font-size:11px;color:var(--muted)">Winner — ?</div>`;
        return;
      }
      const tc = tribeColor(step.winner);
      html += `<div style="padding:16px;margin-top:12px;border-radius:10px;border:2px solid rgba(63,185,80,0.3);background:rgba(63,185,80,0.06);text-align:center">
        <div style="font-family:var(--font-display);font-size:20px;letter-spacing:2px;color:#3fb950;margin-bottom:8px">IMMUNITY</div>
        <div style="font-size:16px;font-weight:700;color:${tc}">${step.winner}</div>
        ${step.lastAwake ? `<div style="margin-top:10px">${rpPortrait(step.lastAwake, 'md')}<div style="font-size:11px;color:#e3b341;font-weight:700;margin-top:4px">★ IRON WILL — ${step.lastAwake}</div><div style="font-size:10px;color:#8b949e">Last one standing.</div></div>` : ''}
      </div>`;
    }
  });

  // Sticky reveal buttons
  if (!allRevealed) {
    html += `<div style="position:sticky;bottom:0;padding:12px 0;background:linear-gradient(transparent,rgba(7,9,13,0.95) 20%);text-align:center;z-index:5">
      <button class="rp-btn" onclick="${_aatReveal(state.idx + 1)}">NEXT (${state.idx + 2}/${steps.length})</button>
      <button class="rp-btn" style="margin-left:8px;opacity:0.6" onclick="${_aatReveal(steps.length - 1)}">Reveal All</button>
    </div>`;
  }

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Register in buildVPScreens**

Find `} else if (ep.isCliffDive && ep.cliffDive) {` in `buildVPScreens` (line ~49572). Insert AFTER the cliff dive block:
```javascript
  } else if (ep.isAwakeAThon && ep.awakeAThon) {
    vpScreens.push({ id:'awake-a-thon', label:'Awake-A-Thon', html: rpBuildAwakeAThon(ep) });
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add awake-a-thon VP screen with timeline reveal"
```

---

### Task 5: Badges + Text Backlog + Episode Tag + Cold Open

**Files:**
- Modify: `simulator.html` — badge chain, text backlog function, generateSummaryText, episode tag, cold open

- [ ] **Step 1: Add badge entries**

Find `evt.type === 'cliffDiveStandout'` in the badge ternary chain. Insert AFTER the cliff dive entries:
```javascript
                     : evt.type === 'awakeAThonBond'           ? (evt.badgeText || 'STAYING AWAKE TOGETHER')
                     : evt.type === 'awakeAThonDeal'           ? (evt.badgeText || 'LATE NIGHT DEAL')
                     : evt.type === 'awakeAThonRomance'        ? (evt.badgeText || 'SLEEPLESS ROMANCE')
                     : evt.type === 'awakeAThonCheat'          ? (evt.badgeText || 'CAUGHT CHEATING')
                     : evt.type === 'awakeAThonScheme'         ? (evt.badgeText || 'SABOTAGE')
                     : evt.type === 'awakeAThonIronWill'       ? (evt.badgeText || 'IRON WILL')
                     : evt.type === 'awakeAThonFirstOut'       ? (evt.badgeText || 'FIRST OUT')
```

- [ ] **Step 2: Add text backlog function**

Find `function _textCliffDive(ep, ln, sec)`. Insert BEFORE it:
```javascript
function _textAwakeAThon(ep, ln, sec) {
  if (!ep.awakeAThon?.rounds?.length) return;
  const aat = ep.awakeAThon;
  sec('AWAKE-A-THON');
  ln('Phase 1 — The Run:');
  const finished = aat.runResults.filter(r => r.finished);
  const dnf = aat.runResults.filter(r => !r.finished);
  if (finished.length) ln(`  FINISHED: ${finished.map(r => r.name).join(', ')}`);
  if (dnf.length) ln(`  DNF: ${dnf.map(r => r.name).join(', ')}`);
  ln('Phase 2 — The Feast (the trap):');
  ln(`  Feast eaters: ${aat.feastEaters.join(', ')} (-0.15 stay-awake penalty)`);
  ln('');
  ln('Phase 3 — The Awake-A-Thon:');
  aat.rounds.forEach(r => {
    if (aat.phaseMarkers.fairyTales === r.round) ln('  [24 HOURS — FAIRY TALES]');
    if (aat.phaseMarkers.historyOfCanada === r.round) ln('  [85 HOURS — HISTORY OF CANADA]');
    ln(`  Round ${r.round}: ${r.dropout.name} falls asleep (${r.dropout.tribe})`);
    r.socialEvents.forEach(evt => {
      ln(`    [${evt.badgeText}] ${evt.text}`);
    });
  });
  ln('');
  ln(`RESULT: ${aat.winner} wins immunity. Last awake: ${aat.lastAwake || 'N/A'} (IRON WILL)`);
  if (aat.firstOut) ln(`First out: ${aat.firstOut.name} (${aat.firstOut.tribe})`);
  if (aat.cheaters?.length) {
    aat.cheaters.forEach(c => ln(`Cheater: ${c.name} — ${c.caught ? `caught by ${c.caughtBy}` : 'uncaught'}`));
  }
}

```

- [ ] **Step 3: Wire into generateSummaryText**

Find `_textCliffDive(ep, ln, sec);` in `generateSummaryText`. Insert BEFORE it:
```javascript
  _textAwakeAThon(ep, ln, sec);
```

- [ ] **Step 4: Add episode history tag**

Find `const cdTag = ep.isCliffDive ?` in episode history rendering. Insert AFTER it:
```javascript
    const aatTag = ep.isAwakeAThon ? `<span class="ep-hist-tag" style="background:rgba(139,92,246,0.15);color:#8b5cf6">Awake-A-Thon</span>` : '';
```

Then find where `${cdTag}` is used in the HTML template and add `${aatTag}` right after it.

- [ ] **Step 5: Add cold open recap**

Find `if (prevEp.isCliffDive && prevEp.cliffDive) {` in `rpBuildColdOpen`. Insert AFTER the cliff dive recap block:
```javascript
    if (prevEp.isAwakeAThon && prevEp.awakeAThon) {
      const _aat = prevEp.awakeAThon;
      html += `<div class="vp-card" style="border-color:rgba(139,92,246,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#8b5cf6;margin-bottom:4px">AWAKE-A-THON</div>
        <div style="font-size:12px;color:#8b949e">${_aat.lastAwake ? `${_aat.lastAwake} was the last one standing.` : ''} ${_aat.winner} won immunity.${_aat.firstOut ? ` ${_aat.firstOut.name} was first to fall asleep.` : ''}</div>
      </div>`;
    }
```

- [ ] **Step 6: Commit**

```bash
git add simulator.html
git commit -m "feat: awake-a-thon badges, text backlog, episode tag, cold open"
```

---

### Task 6: Verification

- [ ] **Step 1: Search for consistency**

```bash
grep -n "awakeAThon\|isAwakeAThon\|awake-a-thon\|AWAKE_A_THON\|_awakeAThonBlame\|simulateAwakeAThon\|rpBuildAwakeAThon\|_textAwakeAThon" simulator.html | head -40
```

Expected: entries across TWIST_CATALOG, applyTwist, engine, computeHeat, cleanup, history, VP, badges, text backlog, cold open, rpBuildPreTwist filter.

- [ ] **Step 2: Open in browser, check for JS errors**

- [ ] **Step 3: Test**

Schedule `awake-a-thon` in the twist scheduler for episode 2 (pre-merge). Run 2 episodes. Check:
- VP shows Awake-A-Thon screen with timeline reveal
- Phase markers (fairy tales, history of canada) appear at correct thresholds
- Social events (bonding, deals, etc.) appear between dropouts
- Winner + IRON WILL displayed
- Camp events have correct badges
- Text backlog shows AWAKE-A-THON section with all rounds
- Episode 3 cold open recaps the awake-a-thon

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: awake-a-thon challenge — complete implementation"
```
