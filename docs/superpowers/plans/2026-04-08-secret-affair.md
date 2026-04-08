# Secret Affair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add secret affair mechanic — hidden romance that escalates through 4 exposure tiers with full Aftermath integration. Also upgrade triangle and showmance betrayal Aftermath content.

**Architecture:** New `gs.affairs[]` array with tiered exposure lifecycle. Formation shares trigger with one-sided triangle but forks on personality. Aftermath integration across all 5 segments (interviews, Truth or Anvil, Fan Call, Unseen Footage, Host Roast). Debug tab extended.

**Tech Stack:** Single-file (`simulator.html`), vanilla JS.

**Spec:** `docs/superpowers/specs/2026-04-08-secret-affair-design.md`

---

### Task 1: Formation — Personality Fork in Triangle Detection

**Files:**
- Modify: `simulator.html:16374` (Path 2 in `checkLoveTriangleFormation`, after probability roll)

- [ ] **Step 1: Add personality fork after the probability roll passes (line ~16375, after `if (Math.random() >= chance) continue;`)**

After the probability roll succeeds (the `continue` didn't fire), add a personality check that routes to affair instead of triangle:

```javascript
        // ── PERSONALITY FORK: secret affair vs public triangle ──
        const _cheaterStats = pStats(inShowmance);
        const _cheaterArch = _cheaterStats.archetype || '';
        const _isSecretType = _cheaterStats.loyalty <= 5 || ['villain','schemer','chaos-agent','showmancer'].includes(_cheaterArch);
        
        if (_isSecretType) {
          // Secret affair — hidden romance path
          gs.affairs = gs.affairs || [];
          // Max 1 active affair per cheater
          if (gs.affairs.some(af => !af.resolved && af.cheater === inShowmance)) continue;
          
          // Complicit check — does the secret partner know about the showmance?
          const _complicit = Math.random() < (pStats(candidate).intuition * 0.08 + getBond(candidate, partner) * 0.05);
          
          gs.affairs.push({
            cheater: inShowmance,
            partner: partner,
            secretPartner: candidate,
            formedEp: epNum,
            episodesActive: 0,
            showmanceRef: [inShowmance, partner],
            exposure: 'hidden',
            rumorSources: [],
            caughtBy: null,
            caughtTold: false,
            complicit: _complicit,
            resolved: false,
            resolution: null
          });
          
          ep.affairEvents = ep.affairEvents || [];
          ep.affairEvents.push({ type: 'formed', cheater: inShowmance, partner, secretPartner: candidate, complicit: _complicit });
          return; // one formation per episode
        }
```

This goes BEFORE the existing triangle formation code (the `sh.jealousPlayer = null;` line and triangle push). The existing triangle code becomes the `else` path — no changes needed to it since the `if (_isSecretType)` block returns.

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add personality fork — low-loyalty/villain types start affairs instead of triangles"
```

---

### Task 2: Affair Lifecycle — Exposure Tiers

**Files:**
- Modify: `simulator.html` (after `updateLoveTrianglePhases`, line ~16700)

- [ ] **Step 1: Add `updateAffairExposure(ep)` function**

```javascript
// ── Secret Affair Lifecycle: exposure tier progression each episode ──
function updateAffairExposure(ep) {
  if (!gs.affairs?.length) return;
  const active = gs.activePlayers;
  const epNum = (gs.episode || 0) + 1;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  ep.affairEvents = ep.affairEvents || [];

  gs.affairs.forEach(af => {
    if (af.resolved) return;
    const { cheater, partner, secretPartner } = af;

    // --- Elimination check ---
    if (!active.includes(cheater) || !active.includes(partner) || !active.includes(secretPartner)) {
      af.resolved = true;
      af.resolution = { type: 'eliminated', who: [cheater, partner, secretPartner].find(p => !active.includes(p)), ep: epNum };
      ep.affairEvents.push({ type: 'eliminated', cheater, who: af.resolution.who });
      return;
    }

    // --- Tribe separation freeze ---
    const sameTribe = gs.isMerged || gs.tribes.some(t =>
      t.members.includes(cheater) && t.members.includes(secretPartner));
    if (!sameTribe) return; // frozen

    af.episodesActive++;

    const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(cheater))?.name || 'merge');
    const pushEvt = (type, text, players) => {
      if (!ep.campEvents?.[tribeName]) return;
      const block = ep.campEvents[tribeName];
      const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
      evts.push({ type, text, players });
      ep.affairEvents.push({ type, cheater, secretPartner, exposure: af.exposure });
    };

    const pc = pronouns(cheater);
    const pp = pronouns(partner);
    const ps = pronouns(secretPartner);

    // ═══ TIER 1: HIDDEN ═══
    if (af.exposure === 'hidden') {
      // Secret bond growth
      addBond(cheater, secretPartner, 0.2);

      // Subtle camp event (30% chance)
      if (Math.random() < 0.30) {
        pushEvt('affairSecret', _pick([
          `${cheater} disappeared for twenty minutes after dinner. ${pc.Sub} came back from the beach with wet hair and a story about washing up. Nobody questioned it. ${secretPartner} came back five minutes later.`,
          `${cheater} and ${secretPartner} ended up on the same firewood run again. Third time this week. ${partner} didn't notice. Everyone else did.`,
          `Late at night, after ${partner} fell asleep, ${cheater} slipped out of the shelter. The cameras followed. ${secretPartner} was already waiting by the well.`,
          `${cheater} laughed at something ${secretPartner} whispered. The kind of laugh that's too quiet, too close. ${partner} was ten feet away, talking strategy with someone else.`,
          `${secretPartner} handed ${cheater} an extra portion at dinner. A small thing. But ${partner} used to be the one who did that.`,
          `${cheater} has a tell: ${pc.sub} only ${pc.sub === 'they' ? 'smile' : 'smiles'} like that around ${secretPartner}. The cameras catch it every time. ${partner} hasn't figured it out yet.`,
          `The tribe was asleep. ${cheater} and ${secretPartner} were not. Whatever happened between the shelter and the shore, the cameras got it all.`,
          `${cheater} volunteers for every task with ${secretPartner}. Water runs. Firewood. Challenge practice. ${partner} thinks it's strategy. It's not.`,
        ]), [cheater, secretPartner]);
      }

      // Detection roll — intuition-based, pressure cooker (+6% per episode)
      const detectionBase = 0.10 + af.episodesActive * 0.06;
      const tribemates = active.filter(p => p !== cheater && p !== secretPartner && p !== partner);
      // Check if cheater+secret are separated from partner — bolder behavior
      const partnerSeparated = !gs.isMerged && !gs.tribes.some(t =>
        t.members.includes(cheater) && t.members.includes(partner));
      const boldnessBonus = partnerSeparated ? 0.15 : 0;

      for (const observer of tribemates) {
        const obs = pStats(observer);
        const detectChance = (obs.intuition * 0.05 + obs.mental * 0.02) * af.episodesActive * 0.3 + boldnessBonus;
        if (Math.random() < Math.min(0.80, detectionBase + detectChance)) {
          af.exposure = 'rumors';
          af.rumorSources.push(observer);
          pushEvt('affairRumor', _pick([
            `${observer} stopped mid-sentence and watched ${cheater} walk past ${secretPartner}. The brush of hands. The half-second of eye contact. ${observer} filed it away and said nothing. Yet.`,
            `"Have you noticed ${cheater} and ${secretPartner}?" ${observer} asked casually at the fire. Nobody answered. But two people exchanged a look.`,
            `${observer} couldn't sleep. That's when ${pronouns(observer).sub} saw ${cheater} leaving the shelter. And ${secretPartner} following. ${observer} lay still and pretended not to see.`,
            `${observer} has been watching ${cheater} for days. The secret looks. The excuses to be near ${secretPartner}. ${pronouns(observer).Sub} ${pronouns(observer).sub === 'they' ? 'haven\'t' : 'hasn\'t'} told ${partner} yet. But ${pronouns(observer).sub} ${pronouns(observer).sub === 'they' ? 'know' : 'knows'}.`,
          ]), [observer, cheater, secretPartner]);
          // Guilt bond — observer feels conflicted about knowing
          addBond(observer, partner, 0.1);
          break; // one detection per episode
        }
      }
    }

    // ═══ TIER 2: RUMORS ═══
    else if (af.exposure === 'rumors') {
      addBond(cheater, secretPartner, 0.2);

      // More observers may detect
      const tribemates = active.filter(p => p !== cheater && p !== secretPartner && p !== partner && !af.rumorSources.includes(p));
      for (const obs of tribemates) {
        const obsS = pStats(obs);
        if (Math.random() < obsS.intuition * 0.06) {
          af.rumorSources.push(obs);
        }
      }

      // Each rumor source may tell the partner
      for (const source of af.rumorSources) {
        if (!active.includes(source)) continue;
        const sourceS = pStats(source);
        const tellChance = sourceS.loyalty * 0.06 + getBond(source, partner) * 0.04;
        if (Math.random() < tellChance) {
          // Skip straight to EXPOSED
          af.exposure = 'exposed';
          pushEvt('affairExposed', _pick([
            `${source} couldn't keep it in anymore. "${partner}, I need to tell you something about ${cheater}." The words hung in the air. ${partner}'s face went blank. Then it went cold.`,
            `"I've been watching ${cheater} and ${secretPartner} for days. I can't stay quiet anymore." ${source} told ${partner} everything. The beach meetings. The secret looks. All of it.`,
            `${source} pulled ${partner} aside after the challenge. "You deserve to know." What followed was the conversation that changes the game.`,
            `"${partner}. Sit down. This is going to hurt." ${source} said it fast, like ripping off a bandage. ${cheater} and ${secretPartner}. The whole thing. ${partner} didn't say a word for five minutes.`,
          ]), [source, partner, cheater]);
          _resolveAffairExposure(af, ep, epNum, pushEvt, _pick);
          return;
        }
      }

      // Rumor camp event
      if (Math.random() < 0.50) {
        const src = _pick(af.rumorSources.filter(s => active.includes(s))) || af.rumorSources[0];
        if (src) {
          pushEvt('affairRumor', _pick([
            `The whispers are getting louder. ${src} mentioned ${cheater} and ${secretPartner} to someone at the well. It's not a secret anymore — it's an open question.`,
            `${src} keeps glancing between ${cheater} and ${partner}. The guilt of knowing is eating at ${pronouns(src).obj}. But telling ${partner} means blowing up the tribe.`,
            `"Someone needs to say something to ${partner}." ${src} said it under ${pronouns(src).posAdj} breath. Nobody volunteered. The affair is the worst-kept secret in camp.`,
            `${src} debated all day. Tell ${partner}? Stay quiet? In the end, ${pronouns(src).sub} said nothing. Again. The longer this goes, the worse it'll be when it breaks.`,
          ]), [src, cheater, partner]);
        }
      }

      // After 2 episodes of rumors with no one telling → caught tier
      const rumorsStartEp = af.formedEp + (af.episodesActive - af.rumorSources.length);
      if (af.episodesActive >= 2 && af.rumorSources.length > 0) {
        const confronter = _pick(af.rumorSources.filter(s => active.includes(s)));
        if (confronter) {
          af.exposure = 'caught';
          af.caughtBy = confronter;
          pushEvt('affairCaught', _pick([
            `${confronter} walked to the beach at the wrong time. Or the right time. ${cheater} and ${secretPartner}, alone, too close for strategy. ${cheater} froze. "This isn't what it looks like." It was exactly what it looked like.`,
            `${confronter} found them. Behind the shelter, after dark. ${cheater} stammered an excuse. ${secretPartner} said nothing. The silence confirmed everything.`,
            `"I knew it." ${confronter} stood at the tree line, arms crossed. ${cheater} and ${secretPartner} pulled apart. "How long has this been going on?" ${cheater} didn't answer.`,
            `${confronter} wasn't even looking for them. But there they were — ${cheater} and ${secretPartner}, tucked into the rocks where nobody was supposed to see. ${confronter} saw.`,
          ]), [confronter, cheater, secretPartner]);
        }
      }
    }

    // ═══ TIER 3: CAUGHT ═══
    else if (af.exposure === 'caught') {
      addBond(cheater, secretPartner, 0.1); // still going but more careful

      if (!af.caughtTold) {
        const catcher = af.caughtBy;
        if (!catcher || !active.includes(catcher)) { af.caughtTold = true; return; }
        const catcherS = pStats(catcher);
        const tellChance = (catcherS.loyalty * 0.07 + getBond(catcher, partner) * 0.05) - (getBond(catcher, cheater) * 0.03);

        if (Math.random() < tellChance) {
          // Catcher tells → EXPOSED
          af.caughtTold = true;
          af.exposure = 'exposed';
          pushEvt('affairExposed', _pick([
            `${catcher} finally told ${partner}. "I saw ${cheater} with ${secretPartner}. I'm sorry. You deserved to know." The look on ${partner}'s face could have ended the game right there.`,
            `"I can't carry this anymore." ${catcher} sat ${partner} down. "It's ${cheater} and ${secretPartner}. I caught them." ${partner} went quiet — the dangerous kind of quiet.`,
          ]), [catcher, partner, cheater]);
          _resolveAffairExposure(af, ep, epNum, pushEvt, _pick);
          return;
        } else {
          // Staying silent — leverage
          if (!af._silentEventFired) {
            af._silentEventFired = true;
            addBond(cheater, catcher, -0.5);
            pushEvt('affairSilent', _pick([
              `${catcher} knows. ${cheater} knows that ${catcher} knows. They made eye contact at the fire and both looked away. ${catcher} hasn't told ${partner}. Not yet. But the power dynamic just shifted.`,
              `${catcher} is sitting on a bomb. ${cheater} brought ${pronouns(catcher).obj} extra rice. Volunteered for ${pronouns(catcher).posAdj} chores. The unspoken deal is clear: silence for loyalty.`,
              `"You owe me." ${catcher} didn't say it out loud. Didn't need to. ${cheater} understood. The secret stays — for now. The price is still being negotiated.`,
              `${catcher} decided to keep quiet. Not for ${cheater}'s sake — for ${pronouns(catcher).posAdj} own game. Information is currency. And ${catcher} just became the richest person on the tribe.`,
            ]), [catcher, cheater]);
          }
          // Silent catchers crack — 40% per episode
          if (Math.random() < 0.40) {
            af.caughtTold = true;
            af.exposure = 'exposed';
            pushEvt('affairExposed', _pick([
              `${catcher} cracked. The guilt was too much. "${partner}, there's something you need to hear." The dam broke. Everything came out.`,
              `${catcher} had been holding it for too long. At the fire, unprompted: "${partner}. I need to tell you about ${cheater} and ${secretPartner}." The tribe went silent.`,
            ]), [catcher, partner, cheater]);
            _resolveAffairExposure(af, ep, epNum, pushEvt, _pick);
            return;
          }
        }
      }
    }
  });
}

// ── Affair Resolution: the confrontation and choice ──
function _resolveAffairExposure(af, ep, epNum, pushEvt, _pick) {
  const { cheater, partner, secretPartner } = af;
  const sCenter = pStats(cheater);
  const bondPartner = getBond(cheater, partner);
  const bondSecret = getBond(cheater, secretPartner);
  const pc = pronouns(cheater);
  const pp = pronouns(partner);
  const ps = pronouns(secretPartner);

  // Find primary showmance for relationship length
  const primarySh = gs.showmances?.find(sh =>
    sh.players.includes(cheater) && sh.players.includes(partner) && sh.phase !== 'broken-up');
  const relLength = primarySh?.episodesActive || 0;

  // Decision: stay with partner or leave for secret?
  const scorePartner = bondPartner * 0.40
    + (sCenter.loyalty * 0.03 * relLength) * 0.30
    + (threatScore(secretPartner) - threatScore(partner)) * 0.20 * -1
    + (Math.random() - 0.5) * 0.10;
  const scoreSecret = bondSecret * 0.40
    + 0
    + (threatScore(partner) - threatScore(secretPartner)) * 0.20 * -1
    + (Math.random() - 0.5) * 0.10;

  const staysWithPartner = scorePartner >= scoreSecret;
  const chose = staysWithPartner ? partner : secretPartner;
  const leftFor = staysWithPartner ? null : secretPartner;

  // Partner reaction — personality-driven
  const sPartner = pStats(partner);
  const partnerSeverity = sPartner.loyalty * 0.3 + sPartner.temperament * -0.2 + bondPartner * 0.2;

  if (staysWithPartner) {
    // Stays — showmance survives damaged
    addBond(cheater, partner, -2.0);
    addBond(cheater, secretPartner, -1.5);
    // Secret partner reaction
    if (af.complicit) {
      addBond(secretPartner, cheater, -1.0); // knew what they were getting into
    } else {
      addBond(secretPartner, cheater, -2.0); // feels used
    }
    pushEvt('affairChoice', _pick([
      `${cheater} chose ${partner}. "It was a mistake. It meant nothing." ${partner} didn't believe it. But ${pp.sub} stayed. For now.`,
      `${cheater} begged. ${partner} listened. ${secretPartner} walked away without a word. The showmance survives — but the trust doesn't.`,
      `"I'm choosing you," ${cheater} said to ${partner}. The words sounded rehearsed. ${secretPartner} heard them from across camp and laughed. Not a happy laugh.`,
      `${cheater} stayed with ${partner}. The tribe watched the reconciliation like a car crash in slow motion. Nobody believes it'll last.`,
    ]), [cheater, partner, secretPartner]);
  } else {
    // Leaves partner for secret partner
    addBond(cheater, partner, -4.0);
    addBond(secretPartner, partner, -2.0);
    // Break the showmance
    if (primarySh) {
      primarySh.phase = 'broken-up';
      primarySh.breakupEp = epNum;
      primarySh.breakupVoter = cheater; // cheater initiated
    }
    pushEvt('affairChoice', _pick([
      `${cheater} chose ${secretPartner}. In front of everyone. ${partner} didn't cry — just nodded slowly, like ${pp.sub} always knew this was coming.`,
      `"I can't pretend anymore." ${cheater} said it to ${partner} and the whole tribe heard. ${pc.Sub} walked to ${secretPartner}. ${partner} sat down and stared at the fire.`,
      `${cheater} left ${partner} for ${secretPartner}. The tribe split in half — not along alliance lines, but along who thinks ${cheater} is a villain and who thinks ${pc.sub} followed ${pc.posAdj} heart.`,
      `It's over. ${cheater} and ${partner} are done. ${cheater} and ${secretPartner} are... something. The tribe is in shambles. This is the episode everyone will remember.`,
    ]), [cheater, secretPartner, partner]);
  }

  af.resolved = true;
  af.resolution = { type: 'exposed', ep: epNum, chose, leftFor, staysWithPartner, partnerSeverity, complicit: af.complicit };
  ep.affairExposure = { cheater, partner, secretPartner, chose, leftFor, staysWithPartner, complicit: af.complicit, severity: partnerSeverity };
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add affair exposure lifecycle — hidden/rumors/caught/exposed tiers"
```

---

### Task 3: Wire Affair Functions Into Episode Flow

**Files:**
- Modify: `simulator.html` — where triangle functions are called (after `updateShowmancePhases`)
- Modify: `simulator.html:28761` — `initGameState` gs object
- Modify: `simulator.html` — where `checkLoveTriangleBreakup` is called in `patchEpisodeHistory`

- [ ] **Step 1: Add affair calls after triangle calls in episode flow**

Find where `checkLoveTriangleFormation(ep)` and `updateLoveTrianglePhases(ep)` are called. Add after:

```javascript
  updateAffairExposure(ep);
```

Note: `checkLoveTriangleFormation` already handles affair creation via the personality fork (Task 1). Only the lifecycle update needs a separate call.

- [ ] **Step 2: Add `affairs: []` to `initGameState`**

After the `_triangleRejectionHeat` line (line ~28762), add:

```javascript
    affairs: [],               // [{ cheater, partner, secretPartner, exposure, resolved, resolution }]
```

- [ ] **Step 3: Add affair breakup check to `patchEpisodeHistory`**

After the `checkLoveTriangleBreakup(ep)` call (line ~28414 area), add:

```javascript
  // Resolve affairs on elimination
  if (gs.affairs?.length && ep.eliminated) {
    const _afElim = ep.eliminated;
    gs.affairs.forEach(af => {
      if (af.resolved) return;
      if (af.cheater !== _afElim && af.partner !== _afElim && af.secretPartner !== _afElim) return;
      af.resolved = true;
      af.resolution = { type: 'eliminated', who: _afElim, ep: (gs.episode || 0) + 1 };
    });
  }
```

- [ ] **Step 4: Add affair serialization to gsSnapshot**

After the `loveTriangles` serialization line (line ~28651), add:

```javascript
    affairs: (gs.affairs || []).map(af => ({ ...af, rumorSources: [...af.rumorSources], showmanceRef: [...af.showmanceRef], resolution: af.resolution ? { ...af.resolution } : null })),
```

- [ ] **Step 5: Add affair history to `patchEpisodeHistory`**

After the triangle history lines (line ~28414), add:

```javascript
  if (ep.affairEvents?.length) h.affairEvents = ep.affairEvents;
  if (ep.affairExposure) h.affairExposure = ep.affairExposure;
```

- [ ] **Step 6: Commit**

```bash
git add simulator.html
git commit -m "feat: wire affair lifecycle into episode flow, init, serialization"
```

---

### Task 4: Heat, Popularity, VP Badges

**Files:**
- Modify: `simulator.html:3778` area — `computeHeat` (after triangle heat)
- Modify: `simulator.html:23907` area — `updatePopularity` switch and post-switch
- Modify: `simulator.html:35735` area — badge detection booleans
- Modify: `simulator.html:35813` area — badgeText ternary
- Modify: `simulator.html:36048` area — badgeClass ternary

- [ ] **Step 1: Add affair heat to `computeHeat`**

After the triangle rejection heat block (the `_rejHeat` block), add:

```javascript
  // Active affair heat — cheater gets pressure as exposure grows
  const _affair = (gs.affairs || []).find(af => !af.resolved && af.cheater === name);
  if (_affair) {
    const afHeat = _affair.exposure === 'exposed' ? 1.5
      : _affair.exposure === 'caught' ? 0.8
      : _affair.exposure === 'rumors' ? 0.4
      : 0.1; // hidden — minimal
    heat += gs.phase === 'post-merge' ? afHeat : afHeat * 0.3;
  }
```

- [ ] **Step 2: Add affair events to `updatePopularity` switch**

After the triangle event cases (line ~23912), add:

```javascript
      // Affair events
      case 'affairSecret':     if (ps?.[0]) add(ps[0], 'drama', 1, evt.type); break;
      case 'affairRumor':      if (ps) { ps.forEach(n => add(n, 'drama', 2, evt.type)); } break;
      case 'affairCaught':     if (ps) { ps.forEach(n => add(n, 'drama', 3, evt.type)); } break;
      case 'affairSilent':     if (ps) { ps.forEach(n => add(n, 'drama', 2, evt.type)); } break;
      case 'affairExposed':    if (ps) { ps.forEach(n => add(n, 'drama', 4, evt.type)); } break;
      case 'affairChoice':     if (ps) { ps.forEach(n => add(n, 'drama', 3, evt.type)); } break;
```

- [ ] **Step 3: Add affair exposure popularity after the triangle resolution block**

After `ep.triangleResolution` popularity (line ~23965), add:

```javascript
  // Affair exposure popularity
  if (ep.affairExposure) {
    const _af = ep.affairExposure;
    add(_af.cheater, 'like', -4, 'affairCheater');
    add(_af.partner, 'like', 3, 'affairBetrayed');
    add(_af.partner, 'under', 3, 'affairBetrayed');
    if (_af.staysWithPartner) {
      add(_af.cheater, 'like', -2, 'affairStayed');
      add(_af.partner, 'like', 1, 'affairPartnerTookBack');
    } else {
      add(_af.cheater, 'like', -3, 'affairLeft');
      add(_af.cheater, 'drama', 4, 'affairLeft');
      add(_af.partner, 'like', 2, 'affairAbandoned');
      add(_af.partner, 'under', 4, 'affairAbandoned');
    }
    if (_af.complicit) {
      add(_af.secretPartner, 'like', -2, 'affairComplicit');
      add(_af.secretPartner, 'drama', 2, 'affairComplicit');
    } else {
      add(_af.secretPartner, 'like', 1, 'affairDidntKnow');
      add(_af.secretPartner, 'under', 1, 'affairDidntKnow');
    }
  }
```

- [ ] **Step 4: Add affair badge detection booleans**

After the triangle detection booleans (line ~35739 area, after `isTriangleRes`), add:

```javascript
    const isAffair     = evt.type?.startsWith('affair');
    const isAffairNeg  = evt.type === 'affairExposed' || evt.type === 'affairCaught';
    const isAffairGold = evt.type === 'affairSecret' || evt.type === 'affairRumor' || evt.type === 'affairSilent';
    const isAffairChoice = evt.type === 'affairChoice';
```

- [ ] **Step 5: Add affair badge text entries**

Before the `isShowmance` badge text entry, add:

```javascript
                     : isAffairNeg    ? (evt.type === 'affairExposed' ? '💔 EXPOSED' : '😳 Caught')
                     : isAffairGold   ? (evt.type === 'affairSecret' ? '🤫 Secret Meeting' : evt.type === 'affairRumor' ? '👀 Rumors' : '🤐 Keeping Quiet')
                     : isAffairChoice ? '💔 Chose'
```

- [ ] **Step 6: Add affair badge class entries**

Before the showmance color entries, add:

```javascript
                     : isAffairNeg ? 'red'
                     : isAffairGold ? 'gold'
                     : isAffairChoice ? 'red'
```

- [ ] **Step 7: Add affair types to isNeg array**

In the isNeg type list, add:

```javascript
'affairExposed', 'affairCaught'
```

- [ ] **Step 8: Commit**

```bash
git add simulator.html
git commit -m "feat: add affair heat, popularity, VP badges"
```

---

### Task 5: Aftermath — Truth or Anvil, Interviews, Fan Call, Unseen Footage, Host Roast

**Files:**
- Modify: `simulator.html:27191` area — Truth or Anvil (after love-triangle contradiction)
- Modify: `simulator.html:26842` area — Interview _allQAs array (after showmance question)
- Modify: `simulator.html:27545` area — Fan Call (after triangle questions)
- Modify: `simulator.html:27407` area — Unseen Footage (after triangle footage)
- Modify: `simulator.html:27000` area — Host Roast (after triangle roasts)

- [ ] **Step 1: Add affair Truth or Anvil contradiction**

After the love-triangle contradiction block (after its closing `}`), add:

```javascript

    // Secret affair
    const _affair = (gs.affairs || []).find(af =>
      af.cheater === name || af.partner === name || af.secretPartner === name || af.caughtBy === name);
    if (_affair) {
      const _afRole = _affair.cheater === name ? 'cheater'
        : _affair.partner === name ? 'betrayed'
        : _affair.secretPartner === name ? 'secret'
        : 'catcher';
      const _afDrama = 9;
      if (_afRole === 'cheater') {
        _contradictions.push({
          setup: `You were in a showmance with ${_affair.partner}. You told ${pronouns(_affair.partner).obj} it was real. But the cameras caught you with ${_affair.secretPartner}. Every. Single. Night. So — truth or anvil. Was any of it real?`,
          evidence: `Secret affair started episode ${_affair.formedEp}. ${_affair.resolved ? `Exposed episode ${_affair.resolution?.ep || '?'}.` : 'Still hidden.'} ${_affair.complicit ? `${_affair.secretPartner} knew about the showmance.` : `${_affair.secretPartner} didn't know.`}`,
          affected: [_affair.partner, _affair.secretPartner].filter(p => [...gs.activePlayers, ...(gs.jury || [])].includes(p)),
          type: 'affair', drama: _afDrama
        });
      } else if (_afRole === 'betrayed') {
        _contradictions.push({
          setup: `You trusted ${_affair.cheater}. The whole tribe knew before you did. How does that feel to hear right now?`,
          evidence: `${_affair.cheater} had a secret affair with ${_affair.secretPartner} starting episode ${_affair.formedEp}.`,
          affected: [_affair.cheater].filter(p => [...gs.activePlayers, ...(gs.jury || [])].includes(p)),
          type: 'affair', drama: _afDrama
        });
      } else if (_afRole === 'secret') {
        const _secSetup = _affair.complicit
          ? `You knew ${_affair.cheater} was with ${_affair.partner}. You didn't care. Own it or deny it.`
          : `You got played too. ${_affair.cheater} told you ${pronouns(_affair.cheater).sub} ${pronouns(_affair.cheater).sub === 'they' ? 'were' : 'was'} single. Finding out on national TV — what went through your head?`;
        _contradictions.push({
          setup: _secSetup,
          evidence: `${_affair.complicit ? 'Knew about the showmance — complicit.' : 'Did not know — also a victim.'} Affair lasted ${_affair.episodesActive} episodes.`,
          affected: [_affair.cheater, _affair.partner].filter(p => [...gs.activePlayers, ...(gs.jury || [])].includes(p)),
          type: 'affair', drama: _afDrama
        });
      } else if (_afRole === 'catcher' && !_affair.caughtTold) {
        _contradictions.push({
          setup: `You SAW ${_affair.cheater} with ${_affair.secretPartner}. You said nothing. ${_affair.partner} was right there. Why?`,
          evidence: `Caught the affair but kept silent. ${_affair.partner} didn't find out from ${name}.`,
          affected: [_affair.partner, _affair.cheater].filter(p => [...gs.activePlayers, ...(gs.jury || [])].includes(p)),
          type: 'affair', drama: 7
        });
      }
    }
```

- [ ] **Step 2: Add affair AND triangle interview questions to _allQAs**

After the showmance interview question (line ~26842, the `cat: 'showmance'` entry), add:

```javascript
      // Affair interview
      const _interviewAffair = (gs.affairs || []).find(af => af.cheater === name || af.partner === name || af.secretPartner === name || af.caughtBy === name);
      _interviewAffair && _interviewAffair.cheater === name && { q: `"Walk us through the timeline. When did the showmance with ${_interviewAffair.partner} stop being real and the affair with ${_interviewAffair.secretPartner} start? Did you ever plan to tell ${_interviewAffair.partner}?"`,
        a: _pick([`"It wasn't planned. Things with ${_interviewAffair.secretPartner} just... happened. I know how that sounds."`, `"I kept telling myself I'd end it. Every day. And every day I didn't."`, `"The showmance was real at first. Then it wasn't. And ${_interviewAffair.secretPartner} was there when ${_interviewAffair.partner} wasn't."`]), cat: 'affair' },
      _interviewAffair && _interviewAffair.partner === name && { q: `"When did you first suspect something between ${_interviewAffair.cheater} and ${_interviewAffair.secretPartner}? Or did you truly not see it coming?"`,
        a: _pick([`"I had no idea. Zero. I feel stupid saying that, but it's the truth."`, `"There were signs. I just didn't want to see them. ${_interviewAffair.cheater} was good at hiding it."`, `"I trusted ${_interviewAffair.cheater}. That was my mistake. The only one I regret."`]), cat: 'affair' },
      _interviewAffair && _interviewAffair.secretPartner === name && _interviewAffair.complicit && { q: `"You knew ${_interviewAffair.cheater} was with ${_interviewAffair.partner} the whole time. At any point did you think about walking away?"`,
        a: _pick([`"Every day. But the heart wants what it wants. I know that's not an excuse."`, `"I'm not proud of it. But I'm not going to pretend I didn't feel what I felt."`]), cat: 'affair' },
      _interviewAffair && _interviewAffair.secretPartner === name && !_interviewAffair.complicit && { q: `"When did you find out you were the other ${pronouns(name).sub === 'she' ? 'woman' : pronouns(name).sub === 'he' ? 'man' : 'person'}? What was that moment like?"`,
        a: _pick([`"Finding out on camera? In front of everyone? That's a special kind of humiliation."`, `"${_interviewAffair.cheater} told me ${pronouns(_interviewAffair.cheater).sub} ${pronouns(_interviewAffair.cheater).sub === 'they' ? 'were' : 'was'} single. I believed ${pronouns(_interviewAffair.cheater).obj}. That's on me."`]), cat: 'affair' },
      _interviewAffair && _interviewAffair.caughtBy === name && _interviewAffair.caughtTold && { q: `"You're the one who blew it up. Do you regret telling ${_interviewAffair.partner}?"`,
        a: _pick([`"Not for a second. ${_interviewAffair.partner} deserved to know."`, `"It was the hardest conversation I've had out here. But I'd do it again."`]), cat: 'affair' },
      _interviewAffair && _interviewAffair.caughtBy === name && !_interviewAffair.caughtTold && { q: `"You watched the affair happen and said nothing. If you could go back, would you tell ${_interviewAffair.partner}?"`,
        a: _pick([`"I should have. I know that now. I was protecting my own game and it cost ${_interviewAffair.partner} the truth."`, `"It wasn't my secret to tell. At least that's what I told myself."`]), cat: 'affair' },
      // Triangle interview
      const _interviewTriangle = (gs.loveTriangles || []).find(t => t.center === name || t.suitors.includes(name));
      _interviewTriangle && _interviewTriangle.center === name && { q: `"Two people. One choice. Walk us through what was going through your head when you realized you were caught between ${_interviewTriangle.suitors[0]} and ${_interviewTriangle.suitors[1]}."`,
        a: _pick([`"I cared about both of them. That's the truth. But the game doesn't let you have both."`, `"I didn't ask for this. It just happened. And by the time I realized, everyone was watching."`]), cat: 'triangle' },
      _interviewTriangle && _interviewTriangle.resolution?.type === 'chose' && _interviewTriangle.center === name && { q: `"You chose ${_interviewTriangle.resolution.chosen}. Do you think ${_interviewTriangle.resolution.rejected} will ever forgive you?"`,
        a: _pick([`"I hope so. But I understand if ${pronouns(_interviewTriangle.resolution.rejected).sub} ${pronouns(_interviewTriangle.resolution.rejected).sub === 'they' ? 'don\'t' : 'doesn\'t'}."`, `"Forgive me? I'm not sure I've forgiven myself."`]), cat: 'triangle' },
      _interviewTriangle && _interviewTriangle.resolution?.rejected === name && { q: `"You watched ${_interviewTriangle.center} choose someone else. On a scale of one to devastated — where did you land?"`,
        a: pStats(name).archetype === 'villain' || pStats(name).archetype === 'schemer' ? _pick([`"Devastated? No. Motivated. ${_interviewTriangle.center} just gave me the best villain origin story of the season."`, `"I don't get devastated. I get even."`]) : _pick([`"Off the scale. I thought what we had was real."`, `"Devastated doesn't cover it. But I'm still here. And that has to count for something."`]), cat: 'triangle' },
      _interviewTriangle && _interviewTriangle.resolution?.chosen === name && { q: `"You won the triangle. But the whole tribe watched ${_interviewTriangle.resolution.rejected} fall apart. Did you feel guilty — even for a second?"`,
        a: _pick([`"Every second. But I can't control who ${_interviewTriangle.center} chooses."`, `"Guilty? A little. But I'm not going to apologize for being chosen."`]), cat: 'triangle' },
```

Note: These need to be added as individual entries in the `_allQAs` array. Each is a conditional object (`condition && { q, a, cat }`). Also add `'affair'` and `'triangle'` to the `_rarecats` array (line ~26857):

```javascript
    const _rarecats = ['showmance', 'mole', 'betrayal', 'idol', 'enemy', 'affair', 'triangle'];
```

- [ ] **Step 3: Add showmance betrayal interview question**

In the same `_allQAs` array, after the showmance question, add:

```javascript
      // Showmance betrayal — voted out partner
      _showmance && _showmance.breakupVoter === name && { q: `"You wrote ${_showmance.players.find(p => p !== name)}'s name down. After everything. Was there even a moment of hesitation?"`,
        a: _pick([`"A moment? It was the longest walk to the voting booth of my life. But the game demanded it."`, `"I hesitated. I won't pretend I didn't. But survival comes first. Even over love."`, `"${_showmance.players.find(p => p !== name)} would have done the same thing. I just did it first."`]), cat: 'showmance' },
```

- [ ] **Step 4: Add affair Fan Call questions**

After the triangle fan call questions (line ~27562 area), add:

```javascript

  // Affair fan call questions
  const _ftAffair = (gs.affairs || []).find(af => af.cheater === _fanTarget || af.partner === _fanTarget || af.secretPartner === _fanTarget);
  if (_ftAffair) {
    const _ftAfRole = _ftAffair.cheater === _fanTarget ? 'cheater'
      : _ftAffair.partner === _fanTarget ? 'betrayed' : 'secret';
    if (_ftAfRole === 'cheater') {
      _allQs.push({ cat: 'affair', q: `"The secret affair was the biggest twist of the season — and it wasn't even planned by production. When did you decide to go behind ${_ftAffair.partner}'s back?"`,
        a: _ftS.strategic >= 6 ? `"It wasn't a decision. It was a series of moments that added up. By the time I realized what I was doing, it was too late to stop."` : `"I didn't decide. It just happened. And I know how that sounds, but it's the truth."`, tone: ['superfan', 'drama'] });
      _allQs.push({ cat: 'affair', q: `"You had someone who trusted you and you threw it away. Was the game worth it?"`,
        a: `"The game? This wasn't about the game. That's what makes it worse."`, tone: ['hater'] });
    } else if (_ftAfRole === 'betrayed') {
      _allQs.push({ cat: 'affair', q: `"The whole fanbase is behind you. You deserved better than what ${_ftAffair.cheater} did. How are you holding up?"`,
        a: `"Day by day. It's harder when you find out the same time as the whole country."`, tone: ['supporter', 'drama'] });
    } else {
      _allQs.push({ cat: 'affair', q: _ftAffair.complicit
        ? `"Homewrecker is a strong word. But if the shoe fits..."`
        : `"You got pulled into something you didn't ask for. How does it feel to be the other ${_ftPr.sub === 'she' ? 'woman' : _ftPr.sub === 'he' ? 'man' : 'person'} without even knowing it?"`,
        a: _ftAffair.complicit ? `"I own it. I'm not going to sit here and pretend I'm innocent."` : `"I was lied to. Same as ${_ftAffair.partner}. We're both victims here."`, tone: ['hater', 'drama'] });
    }
  }
```

- [ ] **Step 5: Add showmance betrayal Fan Call question**

In the same area, add:

```javascript

  // Showmance betrayal fan call
  const _ftShowmanceBetray = (gs.showmances || []).find(sh => sh.breakupVoter === _fanTarget);
  if (_ftShowmanceBetray) {
    const _ftBetrayedPartner = _ftShowmanceBetray.players.find(p => p !== _fanTarget);
    _allQs.push({ cat: 'showmance', q: `"You voted out your showmance partner. The fanbase has one word for that and it's not 'strategic.'"`,
      a: _ftS.loyalty >= 6 ? `"It was the hardest thing I've ever done. And I'd do it again if I had to. That's the game."` : `"Strategic IS the word. ${_ftBetrayedPartner} was a threat. The showmance made it harder, not impossible."`, tone: ['hater', 'drama'] });
  }
```

- [ ] **Step 6: Add affair Unseen Footage**

After the triangle footage section (line ~27428 area), add:

```javascript

  // Affair footage
  (gs.affairs || []).forEach(af => {
    const afPr = pronouns(af.cheater);
    unseenFootage.push({
      sourceEp: af.formedEp,
      type: 'affair',
      description: `What the cameras caught after everyone fell asleep... ${af.cheater} and ${af.secretPartner} on the beach. The showmance with ${af.partner}? A lie. This is the real story.`,
      players: [af.cheater, af.secretPartner, af.partner],
      classified: true,
      drama: 9
    });
    // Silent catcher footage
    if (af.caughtBy && !af.caughtTold) {
      unseenFootage.push({
        sourceEp: af.resolution?.ep || af.formedEp + af.episodesActive,
        type: 'affair',
        description: `${af.caughtBy} saw everything. Watched ${af.cheater} walk back to ${af.partner} like nothing happened. And said nothing.`,
        players: [af.caughtBy, af.cheater],
        classified: true,
        drama: 7
      });
    }
    // Hidden affair revealed post-elimination (cheater eliminated while hidden)
    if (af.resolved && af.resolution?.type === 'eliminated' && af.exposure === 'hidden') {
      unseenFootage.push({
        sourceEp: af.resolution.ep,
        type: 'affair',
        description: `${af.cheater} left the game with a secret ${afPr.sub} never told ${af.partner}. The affair with ${af.secretPartner} — hidden from start to finish. Until now.`,
        players: [af.cheater, af.secretPartner, af.partner],
        classified: true,
        drama: 8
      });
    }
  });
```

- [ ] **Step 7: Add affair Host Roast templates**

After the triangle roast templates (line ~27011 area), add:

```javascript
      // Affair roasts
      const _afRoast = (gs.affairs || []).find(af => af.cheater === p || af.partner === p || af.secretPartner === p);
      if (_afRoast) {
        if (_afRoast.cheater === p) {
          pool.push(`"${p} had a showmance AND a secret affair. Most people can't manage one relationship out here and ${rPr.sub} ${rPr.sub === 'they' ? 'are' : 'is'} running a franchise."`);
          pool.push(`"${p} — the first player to get eliminated from a relationship AND the game in the same week."`);
        } else if (_afRoast.partner === p) {
          pool.push(`"${p} trusted ${_afRoast.cheater}. Which is like trusting a snake to watch your eggs. But ${pronouns(_afRoast.cheater).sub} looked so sincere!"`);
        } else {
          pool.push(`"${p} — the other ${rPr.sub === 'she' ? 'woman' : rPr.sub === 'he' ? 'man' : 'person'}. Every reality show needs one. ${p} delivered."`);
        }
      }
```

- [ ] **Step 8: Add showmance betrayal Truth or Anvil upgrade**

In the existing showmance Truth or Anvil block (line ~26697 area), the showmance contradiction has drama 4-6. Add a higher-drama specific entry for betrayal. Find the showmance contradiction code and add BEFORE it:

```javascript
    // Showmance betrayal — voted out partner (higher drama than generic showmance)
    const _showmanceBetray = (gs.showmances || []).find(sh => sh.breakupVoter === name);
    if (_showmanceBetray) {
      const _betrayPartner = _showmanceBetray.players.find(p => p !== name);
      _contradictions.push({
        setup: `You voted out the person you were sleeping next to every night. ${_betrayPartner}. Look ${pronouns(_betrayPartner).obj} in the eye and explain.`,
        evidence: `Showmance from episode ${_showmanceBetray.sparkEp}. Voted out partner in episode ${_showmanceBetray.breakupEp}. Bond at breakup: ${getBond(name, _betrayPartner).toFixed(1)}.`,
        affected: [_betrayPartner].filter(p => [...gs.activePlayers, ...(gs.jury || [])].includes(p)),
        type: 'showmance-betrayal', drama: 8
      });
    }
```

- [ ] **Step 9: Commit**

```bash
git add simulator.html
git commit -m "feat: add affair Aftermath (truth/anvil, interviews, fan call, footage, roast) + triangle/betrayal upgrades"
```

---

### Task 6: Debug Tab — Affairs Section & Event Log

**Files:**
- Modify: `simulator.html:33973` area — Romance debug tab
- Modify: `simulator.html:34040` area — Romance Event Log

- [ ] **Step 1: Add affairs section to Romance debug tab**

After the love triangles section (after `html += '</div>';` for triangles, before the Romance Event Log), add:

```javascript

    // Affairs
    const _affairs = snap.affairs || gs.affairs || [];
    html += `<div style="margin-bottom:16px">
      <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#f47067;margin-bottom:8px">SECRET AFFAIRS (${_affairs.length})</div>`;
    if (_affairs.length) {
      _affairs.forEach(af => {
        const expCol = af.exposure === 'exposed' ? '#f47067' : af.exposure === 'caught' ? '#f0883e' : af.exposure === 'rumors' ? '#d29922' : '#3fb950';
        const resText = af.resolution
          ? (af.resolution.type === 'exposed' ? `${af.resolution.staysWithPartner ? 'Stayed with ' + af.resolution.chose : 'Left for ' + af.resolution.leftFor}` : `${af.resolution.who} eliminated`)
          : 'Ongoing';
        html += `<div style="padding:8px;margin-bottom:6px;border:1px solid rgba(244,112,103,0.2);border-radius:6px;background:rgba(244,112,103,0.04)">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            ${rpPortrait(af.cheater, 'sm')}
            <span style="color:#e6edf3;font-weight:700">${af.cheater}</span>
            <span style="color:#f47067;font-size:10px">🤫→</span>
            ${rpPortrait(af.secretPartner, 'sm')}
            <span style="color:#e6edf3;font-weight:600">${af.secretPartner}</span>
            <span style="color:#6e7681;font-size:10px">(hiding from</span>
            ${rpPortrait(af.partner, 'xs')}
            <span style="color:#6e7681;font-size:10px">${af.partner})</span>
            <div style="margin-left:auto">
              <span style="font-size:10px;color:${expCol};font-weight:700;text-transform:uppercase">${af.exposure}</span>
            </div>
          </div>
          <div style="font-size:9px;color:#6e7681;padding-left:4px">
            Ep ${af.formedEp} | ${af.episodesActive} eps | Complicit: ${af.complicit ? 'YES' : 'NO'}
            ${af.rumorSources.length ? ' | Rumors: ' + af.rumorSources.join(', ') : ''}
            ${af.caughtBy ? ' | Caught by: ' + af.caughtBy + (af.caughtTold ? ' (TOLD)' : ' (silent)') : ''}
          </div>
          <div style="font-size:9px;color:#8b949e;padding-left:4px;margin-top:2px">
            Resolution: ${resText}
          </div>
        </div>`;
      });
    } else {
      html += `<div style="font-size:10px;color:#484f58">No secret affairs this season.</div>`;
    }
    html += `</div>`;
```

- [ ] **Step 2: Add affair events to Romance Event Log**

In the Romance Event Log loop (where `_romEvents` is built from `gs.episodeHistory`), add after the triangle formation events:

```javascript
      if (h.affairEvents?.length) h.affairEvents.forEach(e => {
        if (e.type === 'formed') _romEvents.push({ ep: h.num, type: 'AFFAIR FORMED', col: '#f47067', detail: `${e.cheater} cheating on ${e.partner} with ${e.secretPartner}${e.complicit ? ' (complicit)' : ''}` });
      });
      if (h.affairExposure) {
        const ae = h.affairExposure;
        _romEvents.push({ ep: h.num, type: 'AFFAIR EXPOSED', col: '#f47067', detail: `${ae.cheater} ${ae.staysWithPartner ? 'stayed with ' + ae.partner : 'left ' + ae.partner + ' for ' + ae.secretPartner}${ae.complicit ? ' (both complicit)' : ''}` });
      }
```

- [ ] **Step 3: Update the Romance tab button to also show when affairs exist**

Find the line that controls the Romance tab button visibility (line ~33406 area, where `gs.showmances?.length || gs.loveTriangles?.length`). Add `|| gs.affairs?.length`:

```javascript
      ${(gs.showmances?.length || gs.loveTriangles?.length || gs.affairs?.length) ? _tabBtn('romance', 'Romance') : ''}
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: add affairs to Romance debug tab and event log"
```

---

### Task 7: Mole Overlap & Edge Cases

**Files:**
- Modify: `simulator.html` — Mole suspicion area (where triangle cover is, line ~17380 area)

- [ ] **Step 1: Add affair cover to Mole suspicion**

Find where triangle cover was added (`_moleInTriangle`). Extend it to also check affairs:

```javascript
    // Love triangle / affair cover — drama distracts from suspicion
    const _moleInTriangle = (gs.loveTriangles || []).some(t => !t.resolved && (t.center === mole.player || t.suitors.includes(mole.player)));
    const _moleInAffair = (gs.affairs || []).some(af => !af.resolved && (af.cheater === mole.player || af.secretPartner === mole.player));
    if (_moleInTriangle || _moleInAffair) mole.resistance = Math.min(0.85, mole.resistance + 0.15);
```

Replace the existing `_moleInTriangle` block with this expanded version.

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: extend Mole suspicion cover to include affairs"
```
