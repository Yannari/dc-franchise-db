# Talent Show Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the talent show with backstage social events, 3-beat performance narratives (270 sentences), and audition drama events.

**Architecture:** Modify existing `TALENT_POOL` constants (single functions → 3-element arrays), add backstage event generation to `simulateTalentShow`, add audition drama generation, update VP screens to render new data. All changes in `simulator.html`.

**Tech Stack:** Pure JS in `simulator.html`. No external dependencies.

---

### Task 1: Upgrade TALENT_POOL to 3-Beat Narratives

**Files:**
- Modify: `simulator.html:7921-8113` (TALENT_POOL constant)

- [ ] **Step 1: Replace the entire TALENT_POOL constant**

The complete spec with all 270 sentences is at `docs/superpowers/specs/2026-04-10-talent-show-enhancements-design.md` section "2. Expanded Performance Descriptions". Read it and replace the TALENT_POOL.

Key structural change — current format:
```javascript
performance: (p, pr) => `Single sentence.`,
disaster: (p, pr) => `Single sentence.`,
clutch: (p, pr) => `Single sentence.`,
```

New format:
```javascript
performance: [
  (p, pr) => `Setup sentence.`,
  (p, pr) => `Act sentence.`,
  (p, pr) => `Landing sentence.`,
],
disaster: [
  (p, pr) => `Setup sentence.`,
  (p, pr) => `Act sentence.`,
  (p, pr) => `Landing sentence.`,
],
clutch: [
  (p, pr) => `Setup sentence.`,
  (p, pr) => `Act sentence.`,
  (p, pr) => `Landing sentence.`,
],
```

The `audition` field stays as a single function (not an array).

Use the spec's hand-written sentences. For the `[p]`, `[Sub]`, `[pos]` placeholders in the spec, convert to template literal expressions: `${p}`, `${pr.Sub}`, `${pr.pos}`, etc. Handle they/singular properly: `${pr.sub === 'they' ? 'close' : 'closes'}`.

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: upgrade TALENT_POOL to 3-beat narratives (270 sentences)"
```

---

### Task 2: Update simulateTalentShow Pre-Rendering

**Files:**
- Modify: `simulator.html` — inside `simulateTalentShow` function (~line 8220-8240)

- [ ] **Step 1: Update audition pre-rendering for 3-beat format**

Find the audition results mapping (search for `auditionText: t_.audition(name, pr)`). The `audition` field is still a single function — no change there. But the `performanceText`, `disasterText`, `clutchText` fields need to change from single strings to 3-string arrays:

Replace:
```javascript
performanceText: t_.performance(name, pr),
disasterText: t_.disaster(name, pr),
clutchText: t_.clutch(name, pr),
```

With:
```javascript
performanceText: t_.performance.map(fn => fn(name, pr)),
disasterText: t_.disaster.map(fn => fn(name, pr)),
clutchText: t_.clutch.map(fn => fn(name, pr)),
```

- [ ] **Step 2: Update performance text selection**

Find where `performanceText` is selected for the show (search for `outcome === 'disaster' ? performer.disasterText`). The result is now a 3-element array. Update:

Replace:
```javascript
const performanceText = outcome === 'disaster' ? performer.disasterText
  : outcome === 'clutch' ? performer.clutchText
  : performer.performanceText;
```

With:
```javascript
const performanceBeats = outcome === 'disaster' ? performer.disasterText
  : outcome === 'clutch' ? performer.clutchText
  : performer.performanceText;
// performanceBeats is [setup, act, landing] — store as array
```

Then in the `performances.push` call, change `performanceText` to `performanceBeats`:

Replace the `performanceText` field in the push with:
```javascript
performanceBeats, // [setup, act, landing] array
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: pre-render 3-beat performance text arrays"
```

---

### Task 3: Add Audition Drama Events

**Files:**
- Modify: `simulator.html` — inside `simulateTalentShow`, after audition selection, before the show

- [ ] **Step 1: Add audition drama generation**

Find the line `auditions[t.name] = results;` inside the tribe audition loop. After the loop that processes all tribes' auditions (after the `tribeMembers.forEach` for auditions closes), add:

```javascript
  // ── Audition Drama (1 per tribe, priority order) ──
  const auditionDrama = {};
  tribeMembers.forEach(t => {
    const results = auditions[t.name] || [];
    const captain = captains[t.name];
    const selected = results.filter(r => r.selected);
    const cut = results.filter(r => !r.selected);
    if (!selected.length || !cut.length) return;

    // Priority 1: Captain's Controversial Cut — cut player within 0.5 of 3rd pick
    const thirdPick = selected[selected.length - 1];
    const closestCut = cut[0]; // highest-scoring cut player
    if (closestCut && thirdPick && Math.abs(closestCut.auditionScore - thirdPick.auditionScore) < 0.5) {
      const arch = players.find(p => p.name === closestCut.name)?.archetype || '';
      const pr = pronouns(closestCut.name);
      const text = ['hero', 'loyal', 'protector'].includes(arch)
        ? `${closestCut.name} stares at ${captain}. "You're cutting me? After what I did for this tribe?" The silence is brutal.`
        : ['villain', 'schemer', 'mastermind'].includes(arch)
        ? `${closestCut.name} smiles. Cold. "Fine. Remember this when we're at tribal." ${captain} pretends not to hear.`
        : `${closestCut.name} takes it hard. Scored nearly as high as the people who made it. ${captain}'s call. Not everyone agrees.`;
      addBond(closestCut.name, captain, -0.4);
      auditionDrama[t.name] = { type: 'controversialCut', players: [closestCut.name, captain], text, badge: 'CONTROVERSIAL CUT', badgeClass: 'red' };
      return;
    }

    // Priority 2: Last Spot Fight — 3rd and 4th within 0.3
    if (closestCut && thirdPick && Math.abs(closestCut.auditionScore - thirdPick.auditionScore) < 0.3) {
      addBond(closestCut.name, thirdPick.name, -0.3);
      auditionDrama[t.name] = {
        type: 'lastSpotFight',
        players: [thirdPick.name, closestCut.name],
        text: `${thirdPick.name} and ${closestCut.name} both know only one of them is getting on that stage. ${thirdPick.name} got it. ${closestCut.name} hasn't stopped staring since.`,
        badge: 'FIGHT FOR THE SPOT', badgeClass: 'red'
      };
      return;
    }

    // Priority 3: Diva Moment — highest scorer with boldness >= 7
    const topScorer = selected[0];
    const topS = pStats(topScorer.name);
    if (topS.boldness >= 7) {
      const lowBoldness = t.members.filter(m => m !== topScorer.name && pStats(m).boldness < 5);
      lowBoldness.forEach(m => addBond(m, topScorer.name, -0.2));
      auditionDrama[t.name] = {
        type: 'divaMoment',
        players: [topScorer.name],
        text: `${topScorer.name} scored highest and wants everyone to know it. "I go first. I close the show. I AM the show." Half the tribe rolls their eyes.`,
        badge: 'DIVA', badgeClass: 'gold'
      };
      return;
    }

    // Priority 4: Terrible Audition Roast — lowest score < 2.0
    const worst = results[results.length - 1];
    if (worst && worst.auditionScore < 2.0) {
      const reactor = t.members.find(m => m !== worst.name && pStats(m).social >= 5) || t.members.find(m => m !== worst.name);
      const rPr = pronouns(reactor);
      addBond(worst.name, reactor, -0.1);
      auditionDrama[t.name] = {
        type: 'terribleAudition',
        players: [worst.name, reactor],
        text: `${worst.name}'s audition was... something. ${reactor} covers ${rPr.pos} mouth trying not to laugh. "Was that... on purpose?"`,
        badge: 'ROASTED', badgeClass: 'red'
      };
      return;
    }

    // Priority 5: Confidence Boost — high social selected encourages cut player
    const supporter = selected.find(s => pStats(s.name).social >= 6);
    if (supporter && cut.length) {
      const cutPlayer = cut[0];
      addBond(supporter.name, cutPlayer.name, 0.3);
      addBond(cutPlayer.name, supporter.name, 0.3);
      auditionDrama[t.name] = {
        type: 'confidenceBoost',
        players: [supporter.name, cutPlayer.name],
        text: `${supporter.name} finds ${cutPlayer.name} after the audition. "Hey. You were good. This doesn't mean anything about you." ${cutPlayer.name} nods. Needed to hear that.`,
        badge: 'ENCOURAGEMENT', badgeClass: 'gold'
      };
    }
  });
```

Store it: add `auditionDrama` to the `ep.talentShow` object at the end of the function.

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: audition drama events (controversial cut, last spot fight, diva, roast, encouragement)"
```

---

### Task 4: Add Backstage Social Events

**Files:**
- Modify: `simulator.html` — inside `simulateTalentShow`, after audition drama, before the show loop

- [ ] **Step 1: Add backstage event generation**

After the audition drama block, before `// ── The Show: perform acts (interleaved) ──`, add:

```javascript
  // ── Backstage Events (2-3 between auditions and show) ──
  const backstageEvents = [];
  const maxBackstage = 3;

  // Sabotage Setup (auto if sabotage will fire — must check before show)
  // (sabotage check moved earlier, before backstage, so we know if it fires)

  // Spy Mission — villain/schemer sends ally to watch other tribe rehearse
  if (backstageEvents.length < maxBackstage) {
    tribeMembers.forEach(t => {
      if (backstageEvents.length >= maxBackstage) return;
      t.members.forEach(name => {
        if (backstageEvents.length >= maxBackstage) return;
        const arch = players.find(p => p.name === name)?.archetype || '';
        if (!['villain', 'schemer', 'mastermind'].includes(arch)) return;
        if (Math.random() >= 0.25) return;
        const ally = t.members.find(m => m !== name && getBond(name, m) >= 1);
        if (!ally) return;
        const otherTribes = tribeMembers.filter(ot => ot.name !== t.name);
        const targetTribe = otherTribes[Math.floor(Math.random() * otherTribes.length)];
        const bestPerformer = (auditions[targetTribe.name] || []).filter(a => a.selected).sort((a, b) => b.auditionScore - a.auditionScore)[0];
        if (!bestPerformer) return;
        const pr = pronouns(name);
        backstageEvents.push({
          type: 'spyMission', players: [name, ally, bestPerformer.name],
          text: `${name} sends ${ally} to spy on ${targetTribe.name}'s rehearsal. ${ally} comes back with intel: "${bestPerformer.name} is their best. That's who we target."`,
          badge: 'SPY MISSION', badgeClass: 'gold',
        });
      });
    });
  }

  // Sabotage Setup — narrative card if sabotage fires
  if (sabotage && backstageEvents.length < maxBackstage) {
    const pr = pronouns(sabotage.saboteur);
    backstageEvents.push({
      type: 'sabotageSetup', players: [sabotage.saboteur],
      text: `${sabotage.saboteur} slips away while the tribe rehearses. ${pr.Sub} ${pr.sub === 'they' ? 'have' : 'has'} a plan for ${sabotage.target}. It's not about winning the show. It's about making sure someone else loses.`,
      badge: 'SABOTAGE SETUP', badgeClass: 'red',
    });
    addBond(sabotage.saboteur, sabotage.target, -0.2);
  }

  // Pep Talk — high social non-performer comforts nervous performer
  if (backstageEvents.length < maxBackstage) {
    tribeMembers.forEach(t => {
      if (backstageEvents.length >= maxBackstage) return;
      const selected = (auditions[t.name] || []).filter(a => a.selected);
      const nervousPerformer = selected.find(s => pStats(s.name).temperament <= 5);
      if (!nervousPerformer) return;
      const nonPerformers = t.members.filter(m => !selected.some(s => s.name === m));
      const talker = nonPerformers.sort((a, b) => pStats(b).social - pStats(a).social)[0];
      if (!talker || Math.random() >= 0.30) return;
      const pr = pronouns(nervousPerformer.name);
      // Buff: +1 temperament for the show (stored on performer object)
      nervousPerformer._tempBuff = (nervousPerformer._tempBuff || 0) + 1;
      addBond(nervousPerformer.name, talker, 0.3);
      backstageEvents.push({
        type: 'pepTalk', players: [talker, nervousPerformer.name],
        text: `${talker} finds ${nervousPerformer.name} backstage, pacing. "Hey. You practiced this. You're ready." ${nervousPerformer.name} takes a breath. ${pr.Sub} needed that.`,
        badge: 'PEP TALK', badgeClass: 'gold',
      });
    });
  }

  // Rivalry Confrontation — cross-tribe bond <= -2
  if (backstageEvents.length < maxBackstage) {
    const allPlayers = tribeMembers.flatMap(t => t.members);
    for (let i = 0; i < allPlayers.length && backstageEvents.length < maxBackstage; i++) {
      for (let j = i + 1; j < allPlayers.length; j++) {
        const a = allPlayers[i], b = allPlayers[j];
        const aTribe = tribeMembers.find(t => t.members.includes(a))?.name;
        const bTribe = tribeMembers.find(t => t.members.includes(b))?.name;
        if (aTribe === bTribe) continue; // same tribe — not a rivalry
        if (getBond(a, b) > -2) continue;
        if (Math.random() >= 0.20) continue;
        addBond(a, b, -0.4);
        backstageEvents.push({
          type: 'rivalryConfrontation', players: [a, b],
          text: `${a} and ${b} cross paths backstage. Words are exchanged. It starts quiet and gets loud. Someone has to step between them.`,
          badge: 'RIVALRY', badgeClass: 'red',
        });
        break;
      }
    }
  }

  // Accident — performer with temperament <= 4 practicing backstage
  if (backstageEvents.length < maxBackstage) {
    tribeMembers.forEach(t => {
      if (backstageEvents.length >= maxBackstage) return;
      const selected = (auditions[t.name] || []).filter(a => a.selected);
      const clumsy = selected.find(s => pStats(s.name).temperament <= 4);
      if (!clumsy || Math.random() >= 0.15) return;
      const pr = pronouns(clumsy.name);
      // Coin flip: self-injury (-2 score) or prop break (substitution)
      if (Math.random() < 0.5) {
        clumsy._scorePenalty = (clumsy._scorePenalty || 0) - 2;
        backstageEvents.push({
          type: 'accidentInjury', players: [clumsy.name],
          text: `${clumsy.name} was practicing backstage and something went wrong. ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} nursing ${pr.pos} hand. "I'm fine. I can still go." ${pr.Sub} ${pr.sub === 'they' ? 'aren\'t' : 'isn\'t'} fine.`,
          badge: 'ACCIDENT', badgeClass: 'red',
        });
      } else {
        // Substitution: swap with best non-selected
        const cut = (auditions[t.name] || []).filter(a => !a.selected);
        const sub = cut[0]; // best cut player
        if (sub) {
          clumsy.selected = false;
          sub.selected = true;
          backstageEvents.push({
            type: 'accidentSubstitution', players: [clumsy.name, sub.name],
            text: `${clumsy.name} broke something backstage — ${pr.pos} props are ruined. ${sub.name} gets the call. "You're in." The Harold moment.`,
            badge: 'SUBSTITUTION', badgeClass: 'gold',
          });
        }
      }
    });
  }

  // Secret Rehearsal — cut player with boldness >= 6, practicing alone
  if (backstageEvents.length < maxBackstage) {
    tribeMembers.forEach(t => {
      if (backstageEvents.length >= maxBackstage) return;
      const cut = (auditions[t.name] || []).filter(a => !a.selected);
      const bold = cut.find(c => pStats(c.name).boldness >= 6);
      if (!bold || Math.random() >= 0.20) return;
      // 40% chance of being subbed in
      if (Math.random() < 0.40) {
        const selected = (auditions[t.name] || []).filter(a => a.selected);
        const weakest = selected[selected.length - 1]; // lowest scorer
        if (weakest) {
          weakest.selected = false;
          bold.selected = true;
          const pr = pronouns(bold.name);
          backstageEvents.push({
            type: 'secretRehearsalSubIn', players: [bold.name, weakest.name],
            text: `Someone spots ${bold.name} practicing alone behind the cabins. Word gets back to the captain. "${bold.name} looks good." A last-minute swap. ${weakest.name} is out. ${bold.name} is in.`,
            badge: 'SECRET REHEARSAL', badgeClass: 'gold',
          });
        }
      } else {
        backstageEvents.push({
          type: 'secretRehearsalAlone', players: [bold.name],
          text: `${bold.name} didn't make the cut, but ${pronouns(bold.name).sub} ${pronouns(bold.name).sub === 'they' ? 'haven\'t' : 'hasn\'t'} stopped practicing. Alone. Behind the cabins. Nobody saw it. This time.`,
          badge: 'SECRET REHEARSAL', badgeClass: 'gold',
        });
      }
    });
  }
```

Store it: add `backstageEvents` to the `ep.talentShow` object.

- [ ] **Step 2: Apply backstage buffs/penalties to show scores**

In the show scoring section, where `rawScore` is calculated, apply any backstage modifiers. Find the `showScore` call and add after it:

```javascript
      // Backstage modifiers
      if (performer._tempBuff) rawScore += performer._tempBuff * 0.3; // pep talk temperament buff
      if (performer._scorePenalty) rawScore += performer._scorePenalty; // accident penalty
```

- [ ] **Step 3: Move sabotage check before backstage**

The sabotage check currently runs inside the show loop. It needs to run BEFORE backstage events so the "sabotage setup" backstage event knows if sabotage will fire. Move the sabotage detection block from inside the show loop to BEFORE the backstage events section. The sabotage EFFECT (score penalty) stays in the show loop — only the DETECTION moves.

- [ ] **Step 4: Update ep.talentShow data object**

Find `ep.talentShow = {` and add the new fields:

```javascript
  ep.talentShow = {
    auditions, performances, captains, sabotage,
    auditionDrama, backstageEvents,
    tribeScores,
    winner: winnerName, loser: loserName,
    mvp: performances.slice().sort((a, b) => b.chefScore - a.chefScore)[0]?.name || null,
  };
```

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: backstage social events (spy, pep talk, sabotage setup, rivalry, accident, secret rehearsal)"
```

---

### Task 5: Update VP — Audition Drama Cards

**Files:**
- Modify: `simulator.html` — `rpBuildTalentAuditions` function (~line 50575)

- [ ] **Step 1: Add drama card rendering after each tribe's audition results**

In `rpBuildTalentAuditions`, find where each tribe's audition card closes (after the `results.forEach` loop). Add after it:

```javascript
    // Audition drama card (if one fired for this tribe)
    const drama = ts.auditionDrama?.[tribeName];
    if (drama) {
      const dColor = drama.badgeClass === 'gold' ? '#f0a500' : '#f85149';
      html += `<div style="margin-top:10px;padding:10px;border-radius:8px;
        border-left:3px solid ${dColor};background:${dColor}08;
        animation:scrollDrop 0.3s var(--ease-broadcast) both">
        <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${dColor}">${drama.badge}</span>
        <div style="display:flex;gap:6px;margin:6px 0">
          ${(drama.players || []).map(p => rpPortrait(p, 'xs')).join('')}
        </div>
        <div style="font-size:11px;color:#cdd9e5;font-style:italic;line-height:1.5">${drama.text}</div>
      </div>`;
    }
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: audition drama cards in VP"
```

---

### Task 6: Update VP — Backstage Screen

**Files:**
- Modify: `simulator.html` — add `rpBuildTalentBackstage` function, register in buildVPScreens

- [ ] **Step 1: Add the backstage VP function**

Place right after `rpBuildTalentAuditions`:

```javascript
function rpBuildTalentBackstage(ep) {
  const ts = ep.talentShow;
  const events = ts?.backstageEvents;
  if (!events?.length) return null;

  const stateKey = `ts_back_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];
  const allRevealed = state.idx >= events.length - 1;

  const _bsReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  let html = `<div class="rp-page tod-dusk" style="background:linear-gradient(180deg,rgba(25,18,35,1) 0%,rgba(15,12,20,1) 100%)">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:24px;letter-spacing:2px;text-align:center;
      color:#8b5cf6;text-shadow:0 0 20px rgba(139,92,246,0.3);margin-bottom:4px">BACKSTAGE</div>
    <div style="text-align:center;font-size:11px;color:#6e7681;margin-bottom:20px;letter-spacing:1px">
      Between auditions and the show, things happen in the shadows.</div>`;

  events.forEach((evt, i) => {
    const isVisible = i <= state.idx;
    if (!isVisible) {
      html += `<div style="padding:12px;margin-bottom:6px;border:1px solid var(--border);border-radius:8px;
        opacity:0.1;text-align:center;color:var(--muted);font-style:italic">Something is happening backstage...</div>`;
      return;
    }
    const bColor = evt.badgeClass === 'gold' ? '#f0a500' : evt.badgeClass === 'red' ? '#f85149' : '#8b5cf6';
    html += `<div style="padding:14px;margin-bottom:8px;border-radius:10px;
      border-left:3px solid ${bColor};
      background:linear-gradient(135deg,${bColor}08 0%,transparent 60%);
      animation:scrollDrop 0.3s var(--ease-broadcast) both">
      <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${bColor}">${evt.badge}</span>
      <div style="display:flex;gap:8px;margin:8px 0">
        ${(evt.players || []).map(p => rpPortrait(p, 'sm')).join('')}
      </div>
      <div style="font-size:12px;color:#cdd9e5;line-height:1.6;font-style:italic">${evt.text}</div>
    </div>`;
  });

  if (!allRevealed) {
    html += `<div style="position:sticky;bottom:0;padding:12px 0;text-align:center;
      background:linear-gradient(transparent,rgba(15,12,20,1) 30%)">
      <button class="rp-btn" onclick="${_bsReveal(state.idx + 1)}">NEXT (${state.idx + 2}/${events.length})</button>
      <button class="rp-btn rp-btn-secondary" onclick="${_bsReveal(events.length - 1)}" style="margin-left:8px">REVEAL ALL</button>
    </div>`;
  }

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Register in buildVPScreens**

Find the talent show VP registration (search for `talent-auditions`). Add the backstage screen between auditions and the show:

```javascript
  } else if (ep.isTalentShow && ep.talentShow) {
    vpScreens.push({ id:'talent-auditions', label:'Auditions', html: rpBuildTalentAuditions(ep) });
    const _bsHtml = rpBuildTalentBackstage(ep);
    if (_bsHtml) vpScreens.push({ id:'talent-backstage', label:'Backstage', html: _bsHtml });
    const _tsShowHtml = rpBuildTalentShowStage(ep);
    if (_tsShowHtml) vpScreens.push({ id:'talent-show', label:'The Show', html: _tsShowHtml });
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: backstage VP screen (spy mission, pep talk, rivalry, accident, secret rehearsal)"
```

---

### Task 7: Update VP — 3-Beat Performance Rendering

**Files:**
- Modify: `simulator.html` — `rpBuildTalentShowStage` function (~line 50649)

- [ ] **Step 1: Update performance text rendering to show 3 beats**

In `rpBuildTalentShowStage`, find where performance text is rendered (search for `perf.performanceText`). Replace the single paragraph with 3 staggered paragraphs:

Replace:
```javascript
    html += `<div style="font-size:13px;color:#cdd9e5;text-align:center;line-height:1.7;
      margin-bottom:16px;font-style:italic;max-width:340px;margin-left:auto;margin-right:auto;
      text-shadow:0 1px 2px rgba(0,0,0,0.3)">${perf.performanceText}</div>`;
```

With:
```javascript
    // 3-beat performance narrative
    const beats = perf.performanceBeats || (typeof perf.performanceText === 'string' ? [perf.performanceText] : perf.performanceText) || [''];
    beats.forEach((beat, bIdx) => {
      if (!beat) return;
      const delay = bIdx * 0.15;
      const opacity = bIdx === 0 ? '0.7' : bIdx === 2 ? '1' : '0.85';
      const size = bIdx === 1 ? '13px' : '11px'; // act text is larger
      html += `<div style="font-size:${size};color:#cdd9e5;text-align:center;line-height:1.7;
        margin-bottom:${bIdx < 2 ? '8' : '16'}px;font-style:italic;max-width:360px;margin-left:auto;margin-right:auto;
        opacity:${opacity};text-shadow:0 1px 2px rgba(0,0,0,0.3);
        animation:scrollDrop 0.3s var(--ease-broadcast) both;animation-delay:${delay}s">${beat}</div>`;
    });
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: 3-beat performance rendering with stagger animation"
```

---

### Task 8: Update Text Backlog + Add Backstage Badge Types

**Files:**
- Modify: `simulator.html` — `_textTalentShow`, badge chains

- [ ] **Step 1: Update text backlog for new data**

Find `_textTalentShow` (~line 31075). Add backstage events and audition drama to the output. After the audition section and before performances:

```javascript
  // Audition drama
  if (ts.auditionDrama) {
    Object.entries(ts.auditionDrama).forEach(([tribe, drama]) => {
      ln(`  ${tribe} DRAMA: [${drama.badge}] ${drama.text}`);
    });
  }
  // Backstage
  if (ts.backstageEvents?.length) {
    ln('');
    ln('BACKSTAGE:');
    ts.backstageEvents.forEach(evt => ln(`  [${evt.badge}] ${evt.text}`));
  }
```

Also update performance text for 3-beat format:

Replace the performance line:
```javascript
    const tag = p.outcome === 'disaster' ? ' [DISASTER]' : p.outcome === 'clutch' ? ' [CLUTCH]' : p.outcome === 'sabotaged' ? ' [SABOTAGED]' : '';
    ln(`${p.tribe} — ${p.name}: ${p.talent} — Chef: ${p.chefScore}/9${tag}`);
```

With:
```javascript
    const tag = p.outcome === 'disaster' ? ' [DISASTER]' : p.outcome === 'clutch' ? ' [CLUTCH]' : p.outcome === 'sabotaged' ? ' [SABOTAGED]' : '';
    ln(`${p.tribe} — ${p.name}: ${p.talent} — Chef: ${p.chefScore}/9${tag}`);
    const beats = p.performanceBeats || (typeof p.performanceText === 'string' ? [p.performanceText] : p.performanceText) || [];
    beats.forEach(b => { if (b) ln(`  ${b}`); });
```

- [ ] **Step 2: Add backstage badge types to badge chains**

After the talent show badge text entries, add:

```javascript
                     : evt.type === 'spyMission'              ? (evt.badgeText || evt.badge || 'SPY MISSION')
                     : evt.type === 'sabotageSetup'            ? (evt.badgeText || evt.badge || 'SABOTAGE SETUP')
                     : evt.type === 'pepTalk'                  ? (evt.badgeText || evt.badge || 'PEP TALK')
                     : evt.type === 'rivalryConfrontation'     ? (evt.badgeText || evt.badge || 'RIVALRY')
                     : evt.type === 'accidentInjury'           ? (evt.badgeText || evt.badge || 'ACCIDENT')
                     : evt.type === 'accidentSubstitution'     ? (evt.badgeText || evt.badge || 'SUBSTITUTION')
                     : evt.type === 'secretRehearsalSubIn'     ? (evt.badgeText || evt.badge || 'SECRET REHEARSAL')
                     : evt.type === 'secretRehearsalAlone'     ? (evt.badgeText || evt.badge || 'SECRET REHEARSAL')
```

And badge class entries:

```javascript
                     : evt.type === 'spyMission' || evt.type === 'pepTalk' || evt.type === 'accidentSubstitution' || evt.type === 'secretRehearsalSubIn' || evt.type === 'secretRehearsalAlone' ? 'gold'
                     : evt.type === 'sabotageSetup' || evt.type === 'rivalryConfrontation' || evt.type === 'accidentInjury' ? 'red'
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: talent show text backlog updates + backstage badge types"
```
