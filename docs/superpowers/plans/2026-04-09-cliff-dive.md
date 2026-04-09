# Cliff Dive Challenge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a schedulable pre-merge tribe challenge where players jump off a cliff (willingness check), haul crates (physical), and build a hot tub (mental). Chickens get blame heat on losing tribe.

**Architecture:** `simulateCliffDive(ep)` generates all 3 phases + blame/standout. Wired into `applyTwist` (flag) and the pre-merge challenge branch (execution). VP screens registered in `buildVPScreens`. Follows exact patterns of Phobia Factor.

**Tech Stack:** Vanilla JS in `simulator.html`

---

### Task 1: TWIST_CATALOG Entry + applyTwist Flag

**Files:**
- Modify: `simulator.html:1632` (after phobia-factor in TWIST_CATALOG)
- Modify: `simulator.html:12338` (applyTwist — add cliff-dive branch)

- [ ] **Step 1: Add TWIST_CATALOG entry**

Find the phobia-factor entry (line ~1632):
```javascript
  { id:'phobia-factor', emoji:'😱', name:'Phobia Factor', ...
```

Insert AFTER it:
```javascript
  { id:'cliff-dive', emoji:'🏔️', name:'Cliff Dive', category:'challenge', phase:'pre-merge', desc:'Three-phase tribe challenge: cliff jump (willingness), crate haul (physical), hot tub build (mental). Chickens get blame on losing tribe.', engineType:'cliff-dive' },
```

- [ ] **Step 2: Add applyTwist flag**

Find `} else if (engineType === 'phobia-factor') {` (line ~12338). Insert AFTER the phobia-factor block's closing (which is just `ep.isPhobiaFactor = true;` then the next else-if):

```javascript
  } else if (engineType === 'cliff-dive') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isCliffDive = true;
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add cliff-dive to TWIST_CATALOG and applyTwist"
```

---

### Task 2: Reaction Text Pools

**Files:**
- Modify: `simulator.html` — insert constants before `simulateCliffDive` (Task 3)

- [ ] **Step 1: Add reaction text constants**

Find `function simulatePhobiaFactor(ep)` (line ~6769). Insert BEFORE it:

```javascript
// ══════════════════════════════════════════════════════════════════════
// CLIFF DIVE — REACTION POOLS
// ══════════════════════════════════════════════════════════════════════

const CLIFF_DIVE_JUMPED = {
  high: [ // boldness >= 7
    (n,pr) => `${n} doesn't even pause. ${pr.Sub} ${pr.sub==='they'?'walk':'walks'} to the edge and jumps.`,
    (n,pr) => `${n} takes one look down and grins. ${pr.Sub} ${pr.sub==='they'?'are':'is'} already in the air.`,
    (n,pr) => `No hesitation from ${n}. Off the cliff like it's nothing.`,
    (n,pr) => `${n} cracks ${pr.posAdj} neck, backs up for a running start, and launches.`,
  ],
  mid: [ // boldness 4-6
    (n,pr) => `${n} takes a deep breath. Closes ${pr.posAdj} eyes. Jumps.`,
    (n,pr) => `${n} looks down, looks at ${pr.posAdj} team, looks down again. Then jumps.`,
    (n,pr) => `It takes ${n} a moment. But ${pr.sub} ${pr.sub==='they'?'do':'does'} it.`,
    (n,pr) => `${n} whispers something to ${pr.ref}, backs up, and goes for it.`,
  ],
  low: [ // boldness <= 3
    (n,pr) => `${n} is visibly shaking. But ${pr.sub} ${pr.sub==='they'?'jump':'jumps'} anyway. The scream echoes off the cliff.`,
    (n,pr) => `Nobody expected ${n} to jump. ${n} didn't expect it either. But there ${pr.sub} ${pr.sub==='they'?'go':'goes'}.`,
    (n,pr) => `${n} closes ${pr.posAdj} eyes, plugs ${pr.posAdj} nose, and falls forward. It counts.`,
    (n,pr) => `${n}'s legs are shaking so hard the cliff might crumble. ${pr.Sub} ${pr.sub==='they'?'jump':'jumps'} before ${pr.sub} can change ${pr.posAdj} mind.`,
  ],
};

const CLIFF_DIVE_CHICKEN = [
  (n,pr) => `${n} looks over the edge, shakes ${pr.posAdj} head, and steps back. Not happening.`,
  (n,pr) => `${n} crosses ${pr.posAdj} arms. "I'm not doing this." The chicken hat goes on.`,
  (n,pr) => `${n} peers down at the water. At the sharks. Back at the water. "No." Chicken hat.`,
  (n,pr) => `${n} starts walking toward the edge, stops, and walks back. "Sorry." Chicken hat.`,
  (n,pr) => `${n} sits down on the cliff. ${pr.Sub} ${pr.sub==='they'?'aren\'t':'isn\'t'} going anywhere.`,
];
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add cliff dive reaction text pools"
```

---

### Task 3: Engine — `simulateCliffDive(ep)`

**Files:**
- Modify: `simulator.html` — insert function after the reaction pools, before `simulatePhobiaFactor`

- [ ] **Step 1: Add the simulateCliffDive function**

Insert after `CLIFF_DIVE_CHICKEN` constant, before `function simulatePhobiaFactor(ep)`:

```javascript
function simulateCliffDive(ep) {
  const tribes = gs.tribes;
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });

  const tribeResults = [];

  tribes.forEach(tribe => {
    const members = [...tribe.members];
    const jumpers = [];
    const chickens = [];
    const reactions = [];

    // ── Phase 1: Jump willingness ──
    members.forEach(name => {
      const s = pStats(name);
      const pr = pronouns(name);
      const jumpChance = s.boldness * 0.06 + s.physical * 0.02 + s.loyalty * 0.03 + 0.10;
      const jumped = Math.random() < jumpChance;

      if (jumped) {
        jumpers.push(name);
        const tier = s.boldness >= 7 ? 'high' : s.boldness <= 3 ? 'low' : 'mid';
        const text = _rp(CLIFF_DIVE_JUMPED[tier])(name, pr);
        reactions.push({ name, jumped: true, text, boldness: s.boldness });
      } else {
        chickens.push(name);
        const text = _rp(CLIFF_DIVE_CHICKEN)(name, pr);
        reactions.push({ name, jumped: false, text, boldness: s.boldness });
      }
    });

    // ── Standout: first to volunteer (per tribe) ──
    let standout = null, standoutIsUnderdog = false;
    if (jumpers.length) {
      // 15% chance lowest-boldness jumper is the standout
      if (Math.random() < 0.15) {
        standout = jumpers.reduce((a, b) => pStats(a).boldness < pStats(b).boldness ? a : b);
        standoutIsUnderdog = true;
      } else {
        // Score-based: boldness + random
        const scored = jumpers.map(name => ({
          name, score: pStats(name).boldness * 0.07 + 0.3 + Math.random() * 0.2
        })).sort((a, b) => b.score - a.score);
        standout = scored[0].name;
        standoutIsUnderdog = pStats(standout).boldness <= 4;
      }
    }

    // ── Phase 2: Haul crates ──
    const manpowerMult = members.length > 0 ? jumpers.length / members.length : 0;
    const avgPhysical = members.reduce((s, n) => s + pStats(n).physical, 0) / members.length;
    const avgEndurance = members.reduce((s, n) => s + pStats(n).endurance, 0) / members.length;
    const haulScore = (avgPhysical * 0.5 + avgEndurance * 0.5) * manpowerMult;

    // ── Phase 3: Build hot tub ──
    const avgMental = members.reduce((s, n) => s + pStats(n).mental, 0) / members.length;
    const avgSocial = members.reduce((s, n) => s + pStats(n).social, 0) / members.length;
    const buildScore = (avgMental * 0.5 + avgSocial * 0.5) * manpowerMult;

    const totalScore = haulScore + buildScore;

    tribeResults.push({
      name: tribe.name, members, jumpers, chickens, standout, standoutIsUnderdog,
      jumpCount: jumpers.length, haulScore: Math.round(haulScore * 100) / 100,
      buildScore: Math.round(buildScore * 100) / 100, totalScore: Math.round(totalScore * 100) / 100,
      reactions,
    });
  });

  // ── Determine wagon winner (most jumpers) ──
  const maxJumps = Math.max(...tribeResults.map(t => t.jumpCount));
  const wagonCandidates = tribeResults.filter(t => t.jumpCount === maxJumps);
  const wagonWinner = wagonCandidates.length === 1 ? wagonCandidates[0].name : null;
  // Apply wagon bonus to Phase 2
  if (wagonWinner) {
    const wt = tribeResults.find(t => t.name === wagonWinner);
    wt.haulScore = Math.round(wt.haulScore * 1.3 * 100) / 100;
    wt.totalScore = Math.round((wt.haulScore + wt.buildScore) * 100) / 100;
  }

  // ── Determine winner ──
  tribeResults.sort((a, b) => b.totalScore - a.totalScore || b.jumpCount - a.jumpCount);
  const winner = tribeResults[0];
  const loser = tribeResults[tribeResults.length - 1];

  // ── Set episode fields (same pattern as simulatePhobiaFactor) ──
  ep.challengeType = 'tribe';
  ep.winner = gs.tribes.find(t => t.name === winner.name);
  ep.loser = gs.tribes.find(t => t.name === loser.name);
  ep.safeTribes = tribeResults.length > 2
    ? tribeResults.slice(1, -1).map(t => gs.tribes.find(tr => tr.name === t.name)).filter(Boolean)
    : [];
  ep.challengeLabel = 'Cliff Dive';
  ep.challengeCategory = 'mixed';
  ep.challengeDesc = 'Three-phase challenge: cliff jump, crate haul, hot tub build.';
  ep.tribalPlayers = [...loser.members];
  ep.challengePlacements = tribeResults.map(t => ({
    name: t.name, members: [...(gs.tribes.find(tr => tr.name === t.name)?.members || [])],
    memberScores: Object.fromEntries(t.members.map(m => [m, t.jumpers.includes(m) ? 1 : 0])),
  }));

  // ── Blame: chickens on losing tribe get heat ──
  if (!gs._cliffDiveBlame) gs._cliffDiveBlame = {};
  loser.chickens.forEach(chicken => {
    gs._cliffDiveBlame[chicken] = 1.0;
    // Bond damage from jumped teammates
    loser.jumpers.forEach(jumper => addBond(jumper, chicken, -0.3));
  });
  // Winning tribe chickens: mild shame only
  tribeResults.filter(t => t.name !== loser.name).forEach(t => {
    t.chickens.forEach(chicken => {
      t.jumpers.forEach(jumper => addBond(jumper, chicken, -0.15));
    });
  });

  // ── Standout bond boost ──
  tribeResults.forEach(t => {
    if (t.standout) {
      t.members.filter(m => m !== t.standout).forEach(m => addBond(m, t.standout, 0.3));
    }
  });

  // ── Camp events ──
  tribeResults.forEach(t => {
    if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] };
    if (!ep.campEvents[t.name].post) ep.campEvents[t.name].post = [];

    // Chicken events
    t.chickens.forEach(chicken => {
      const pr = pronouns(chicken);
      const isLoser = t.name === loser.name;
      ep.campEvents[t.name].post.push({
        type: 'cliffDiveChicken',
        players: [chicken, ...t.jumpers.slice(0, 2)],
        text: `${chicken} is wearing the chicken hat. ${t.jumpers.length} teammate${t.jumpers.length !== 1 ? 's' : ''} jumped. ${pr.Sub} didn't.`,
        consequences: `Bond damage from teammates.${isLoser ? ' Heat +1.0.' : ''}`,
        badgeText: 'CHICKEN', badgeClass: 'red'
      });
    });

    // Standout event
    if (t.standout) {
      const pr = pronouns(t.standout);
      ep.campEvents[t.name].post.push({
        type: 'cliffDiveStandout',
        players: [t.standout],
        text: t.standoutIsUnderdog
          ? `Nobody expected ${t.standout} to go first. ${pr.Sub} surprised everyone — including ${pr.ref}.`
          : `${t.standout} stepped up when nobody else would. First off the cliff. The team needed that.`,
        consequences: 'Bond +0.3 from teammates.',
        badgeText: 'FIRST TO JUMP', badgeClass: 'gold'
      });
    }
  });

  // ── Challenge record tracking (half weight — same as reward challenges) ──
  tribeResults.forEach(t => {
    if (t.standout) {
      if (!gs.chalRecord) gs.chalRecord = {};
      if (!gs.chalRecord[t.standout]) gs.chalRecord[t.standout] = { wins: 0, podiums: 0, bombs: 0 };
      gs.chalRecord[t.standout].podiums += 0.5;
    }
    t.chickens.forEach(c => {
      if (!gs.chalRecord) gs.chalRecord = {};
      if (!gs.chalRecord[c]) gs.chalRecord[c] = { wins: 0, podiums: 0, bombs: 0 };
      gs.chalRecord[c].bombs += 0.5;
    });
  });

  // ── Save to episode ──
  ep.cliffDive = {
    tribes: tribeResults,
    wagonWinner,
    winner: winner.name,
  };
}
```

- [ ] **Step 2: Wire into the pre-merge challenge branch**

Find `} else if (ep.isPhobiaFactor && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {` (line ~23355). Insert BEFORE it:

```javascript
  } else if (ep.isCliffDive && gs.phase === 'pre-merge' && gs.tribes.length >= 2) {
    simulateCliffDive(ep);
    // winner, loser, challengeType, tribalPlayers already set by simulateCliffDive
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add simulateCliffDive engine function"
```

---

### Task 4: Heat Application + Cleanup

**Files:**
- Modify: `simulator.html` — computeHeat (add blame check)
- Modify: `simulator.html` — post-tribal cleanup (clear blame)
- Modify: `simulator.html` — patchEpisodeHistory (save isCliffDive + cliffDive data)

- [ ] **Step 1: Add blame heat in computeHeat**

Find `if (gs._phobiaBlame?.[name]) heat += gs._phobiaBlame[name];` (line ~4143). Insert AFTER it:

```javascript
  if (gs._cliffDiveBlame?.[name]) heat += gs._cliffDiveBlame[name];
```

- [ ] **Step 2: Add cleanup after tribal**

Find `if (gs._phobiaBlame) delete gs._phobiaBlame;` (line ~25628). Insert AFTER it:

```javascript
    if (gs._cliffDiveBlame) delete gs._cliffDiveBlame;
```

- [ ] **Step 3: Add to patchEpisodeHistory**

Find `if (ep.isPhobiaFactor) h.isPhobiaFactor = true;` (line ~31433). Insert AFTER it:

```javascript
  if (ep.isCliffDive) h.isCliffDive = true;
  if (!h.cliffDive && ep.cliffDive) h.cliffDive = ep.cliffDive;
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: add cliff dive blame heat, cleanup, and episode history"
```

---

### Task 5: VP Screens

**Files:**
- Modify: `simulator.html` — add `rpBuildCliffDive(ep)` function + register in `buildVPScreens`

- [ ] **Step 1: Add VP function**

Insert before `function rpBuildPhobiaConfessions(ep)` (line ~47865):

```javascript
function rpBuildCliffDive(ep) {
  const cd = ep.cliffDive;
  if (!cd?.tribes?.length) return null;

  const stateKey = `cd_reveal_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // All reactions across all tribes in display order
  const allReactions = cd.tribes.flatMap(t =>
    t.reactions.map(r => ({ ...r, tribe: t.name, isStandout: r.name === t.standout }))
  );
  // Group by tribe for display
  const allRevealed = state.idx >= allReactions.length - 1;
  const _cdReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){buildVPScreens(ep);renderVPScreen();}`;

  let html = `<div class="rp-page tod-dawn">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:#f47067;text-shadow:0 0 20px rgba(244,112,103,0.3);margin-bottom:6px">CLIFF DIVE</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:6px">One thousand feet. Shark-infested waters. A tiny safe zone.</div>
    <div style="text-align:center;font-size:11px;color:#6e7681;margin-bottom:20px">Jump and score a point for your team. Chicken out and wear the hat of shame.</div>`;

  // Per-tribe sections with click-to-reveal
  let globalIdx = 0;
  cd.tribes.forEach(t => {
    const tc = tribeColor(t.name);
    html += `<div style="margin-bottom:16px">
      <div style="font-family:var(--font-display);font-size:16px;color:${tc};text-align:center;margin-bottom:8px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06)">${t.name} <span style="font-size:11px;color:#8b949e">(${t.jumpCount}/${t.members.length} jumped)</span></div>`;

    t.reactions.forEach(r => {
      const isVisible = globalIdx <= state.idx;
      if (!isVisible) {
        html += `<div style="padding:8px;margin-bottom:4px;border:1px solid var(--border);border-radius:6px;opacity:0.12;font-size:11px;color:var(--muted);text-align:center">?</div>`;
      } else {
        const jumpBadge = r.jumped
          ? '<span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#3fb950;background:rgba(63,185,80,0.12);padding:2px 6px;border-radius:3px">JUMPED</span>'
          : '<span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f85149;background:rgba(248,81,73,0.12);padding:2px 6px;border-radius:3px">CHICKENED OUT</span>';
        const standoutBorder = r.isStandout ? 'border-color:rgba(240,165,0,0.4);background:rgba(240,165,0,0.04)' : '';
        const standoutLabel = r.isStandout ? `<span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f0a500;background:rgba(240,165,0,0.12);padding:2px 6px;border-radius:3px;margin-left:4px">FIRST TO JUMP</span>` : '';
        html += `<div class="vp-card" style="margin-bottom:4px;${standoutBorder};animation:scrollDrop 0.3s var(--ease-broadcast) both">
          <div style="display:flex;align-items:center;gap:10px">
            ${rpPortrait(r.name, 'sm')}
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <span style="font-size:13px;font-weight:600;color:#e6edf3">${r.name}</span>
                ${jumpBadge}${standoutLabel}
              </div>
              <div style="font-size:12px;color:#8b949e;line-height:1.5">${r.text}</div>
            </div>
          </div>
        </div>`;
      }
      globalIdx++;
    });
    html += `</div>`;
  });

  // Reveal controls
  if (!allRevealed) {
    html += `<div style="text-align:center;margin-top:12px">
      <button class="rp-btn" onclick="${_cdReveal(state.idx + 1)}">NEXT (${state.idx + 2}/${allReactions.length})</button>
      <button class="rp-btn" style="margin-left:8px;opacity:0.6" onclick="${_cdReveal(allReactions.length - 1)}">Reveal All</button>
    </div>`;
  } else {
    // Phase 2 + 3 results
    html += `<div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06)">`;

    // Wagon advantage
    if (cd.wagonWinner) {
      html += `<div style="text-align:center;margin-bottom:12px;padding:8px;background:rgba(63,185,80,0.06);border:1px solid rgba(63,185,80,0.15);border-radius:6px">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#3fb950;margin-bottom:4px">WAGON ADVANTAGE</div>
        <div style="font-size:12px;color:#e6edf3">${cd.wagonWinner} had the most jumpers — they get wagons to haul the crates.</div>
      </div>`;
    }

    // Phase scores
    cd.tribes.forEach(t => {
      const tc = tribeColor(t.name);
      const isWinner = t.name === cd.winner;
      html += `<div style="display:flex;align-items:center;gap:10px;padding:8px;margin-bottom:4px;border-radius:6px;border:1px solid ${isWinner ? 'rgba(63,185,80,0.2)' : 'var(--border)'}">
        <span style="font-size:13px;font-weight:700;color:${tc};min-width:100px">${t.name}</span>
        <span style="font-size:11px;color:#8b949e">Haul: ${t.haulScore}${t.name === cd.wagonWinner ? ' (wagons)' : ''}</span>
        <span style="font-size:11px;color:#8b949e">Build: ${t.buildScore}</span>
        <span style="font-size:12px;font-weight:700;color:${isWinner ? '#3fb950' : '#8b949e'};margin-left:auto">${t.totalScore}</span>
        ${isWinner ? '<span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#3fb950;background:rgba(63,185,80,0.12);padding:2px 6px;border-radius:3px">WIN</span>' : ''}
      </div>`;
    });
    html += `</div>`;

    // Chicken hat gallery
    const allChickens = cd.tribes.flatMap(t => t.chickens);
    if (allChickens.length) {
      html += `<div style="margin-top:14px;text-align:center;padding:10px;background:rgba(248,81,73,0.04);border:1px solid rgba(248,81,73,0.12);border-radius:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f85149;margin-bottom:8px">CHICKEN HAT GALLERY</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${allChickens.map(c => rpPortrait(c, 'sm')).join('')}</div>
      </div>`;
    }
  }

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Register in buildVPScreens**

Find `} else if (ep.isPhobiaFactor && ep.phobiaFactor) {` in `buildVPScreens` (line ~49138). Insert BEFORE it:

```javascript
  } else if (ep.isCliffDive && ep.cliffDive) {
    vpScreens.push({ id:'cliff-dive', label:'Cliff Dive', html: rpBuildCliffDive(ep) });
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add cliff dive VP screen with click-to-reveal"
```

---

### Task 6: Badge Registration + Text Backlog

**Files:**
- Modify: `simulator.html` — badge ternary chain in rpBuildCampTribe
- Modify: `simulator.html` — add `_textCliffDive` function + wire into generateSummaryText

- [ ] **Step 1: Add badge entries**

Find `evt.type === 'rewardBackfireAlliance'` in the badge ternary chain. Insert BEFORE it:

```javascript
                     : evt.type === 'cliffDiveChicken'         ? (evt.badgeText || 'CHICKEN')
                     : evt.type === 'cliffDiveStandout'        ? (evt.badgeText || 'FIRST TO JUMP')
```

- [ ] **Step 2: Add text backlog function**

Find `function _textPhobiaFactor(ep, ln, sec)`. Insert BEFORE it:

```javascript
function _textCliffDive(ep, ln, sec) {
  if (!ep.cliffDive?.tribes?.length) return;
  const cd = ep.cliffDive;
  sec('CLIFF DIVE');
  ln('Phase 1 — The Jump:');
  cd.tribes.forEach(t => {
    ln(`  ${t.name} (${t.jumpCount}/${t.members.length} jumped):`);
    if (t.jumpers.length) ln(`    JUMPED: ${t.jumpers.join(', ')}`);
    if (t.chickens.length) ln(`    CHICKENED OUT: ${t.chickens.join(', ')}`);
    if (t.standout) ln(`    First to jump: ${t.standout}${t.standoutIsUnderdog ? ' (underdog moment)' : ''}`);
  });
  if (cd.wagonWinner) ln(`Wagon advantage: ${cd.wagonWinner}`);
  ln('Phase 2 — Haul Crates:');
  cd.tribes.forEach(t => ln(`  ${t.name}: ${t.haulScore}${t.name === cd.wagonWinner ? ' (wagons)' : ''}`));
  ln('Phase 3 — Build Hot Tub:');
  cd.tribes.forEach(t => ln(`  ${t.name}: ${t.buildScore}`));
  ln(`RESULT: ${cd.winner} wins immunity (${cd.tribes.map(t => `${t.name}: ${t.totalScore}`).join(' vs ')})`);
}
```

- [ ] **Step 3: Wire into generateSummaryText**

Find `_textPhobiaFactor(ep, ln, sec);` in `generateSummaryText`. Insert BEFORE it:

```javascript
  _textCliffDive(ep, ln, sec);
```

- [ ] **Step 4: Add episode history tag for episode list display**

Find `const pfTag = ep.isPhobiaFactor ?` (line ~32101). Insert AFTER that line (after the pfTag declaration):

```javascript
    const cdTag = ep.isCliffDive ? `<span class="ep-hist-tag" style="background:rgba(244,112,103,0.15);color:#f47067">Cliff Dive</span>` : '';
```

Then find where `pfTag` is used in the episode history card HTML and add `${cdTag}` next to it. Search for `${pfTag}` and append `${cdTag}` after it.

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: add cliff dive badges, text backlog, and episode tag"
```

---

### Task 7: Cold Open Integration

**Files:**
- Modify: `simulator.html` — rpBuildColdOpen, in the "Previously On" section

- [ ] **Step 1: Add cliff dive recap to cold open**

Find `if (prevEp.isPhobiaFactor && prevEp.phobiaFactor) {` in rpBuildColdOpen (line ~35183). Insert BEFORE it:

```javascript
    if (prevEp.isCliffDive && prevEp.cliffDive) {
      const _cd = prevEp.cliffDive;
      const _cdChickens = _cd.tribes.flatMap(t => t.chickens);
      const _cdStandouts = _cd.tribes.filter(t => t.standout).map(t => t.standout);
      if (_cdChickens.length) {
        html += `<div class="vp-card" style="border-color:rgba(244,112,103,0.15);margin-bottom:8px">
          <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f47067;margin-bottom:4px">CLIFF DIVE</div>
          <div style="font-size:12px;color:#8b949e">${_cdChickens.length} player${_cdChickens.length>1?'s':''} chickened out: ${_cdChickens.join(', ')}. ${_cd.winner} won immunity.</div>
        </div>`;
      }
    }
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add cliff dive recap to cold open"
```

---

### Task 8: Verification

- [ ] **Step 1: Search for consistency**

```bash
grep -n "cliffDive\|isCliffDive\|cliff-dive\|CLIFF_DIVE\|_cliffDiveBlame\|_textCliffDive\|rpBuildCliffDive\|simulateCliffDive" simulator.html | head -40
```

Expected: entries across TWIST_CATALOG, applyTwist, constants, engine, computeHeat, cleanup, history, VP, badges, text backlog, cold open.

- [ ] **Step 2: Open in browser, check for JS errors**

- [ ] **Step 3: Test**

Schedule `cliff-dive` in the twist scheduler for episode 2 (pre-merge). Run 2 episodes. Check:
- VP shows Cliff Dive screen with click-to-reveal jumps
- Chicken hats appear in camp events
- Standouts get gold badge
- Losing tribe chickens get blame heat
- Text backlog shows CLIFF DIVE section
- Episode 3 cold open recaps the cliff dive

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: cliff dive challenge — complete implementation"
```
