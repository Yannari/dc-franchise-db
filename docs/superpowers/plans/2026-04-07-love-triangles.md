# Love Triangles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add love triangle mechanic extending the showmance system — 3-way romantic tension with escalating jealousy, forced ultimatums, and Aftermath show integration.

**Architecture:** New `gs.loveTriangles[]` array with its own lifecycle that references existing showmances. Detection runs after `updateShowmancePhases()`. Triangle events inject camp events with bond/heat consequences. Aftermath integration adds content to all 4 segments (Truth or Anvil, Fan Call, Unseen Footage, Host Roast).

**Tech Stack:** Single-file (`simulator.html`), vanilla JS, no dependencies.

**Spec:** `docs/superpowers/specs/2026-04-07-love-triangles-design.md`

---

### Task 1: Data Structure & Detection Function

**Files:**
- Modify: `simulator.html:16197` (after `checkShowmanceBreakup`)

- [ ] **Step 1: Add `checkLoveTriangleFormation(ep)` function after `checkShowmanceBreakup` (line ~16197)**

```javascript
// ── Love Triangle: detect 3-way romantic tension ──
function checkLoveTriangleFormation(ep) {
  if (!gs.showmances?.length) return;
  if (!gs.loveTriangles) gs.loveTriangles = [];
  const active = gs.activePlayers;
  const epNum = ep.num || (gs.episode || 0) + 1;

  // Max 1 active triangle at a time
  const activeTriangles = gs.loveTriangles.filter(t => !t.resolved);
  if (activeTriangles.length >= 1) return;

  // 2-episode cooldown after last resolution
  const lastResolved = gs.loveTriangles.filter(t => t.resolved).sort((a, b) => (b.resolution?.ep || 0) - (a.resolution?.ep || 0))[0];
  if (lastResolved && epNum - (lastResolved.resolution?.ep || 0) < 2) return;

  const activeShowmances = gs.showmances.filter(sh => sh.phase !== 'broken-up' && sh.players.every(p => active.includes(p)));

  // Path 1: Dual showmance — player appears in two active showmances
  for (const sh1 of activeShowmances) {
    for (const sh2 of activeShowmances) {
      if (sh1 === sh2) continue;
      const shared = sh1.players.filter(p => sh2.players.includes(p));
      if (shared.length === 1) {
        const center = shared[0];
        const suitorA = sh1.players.find(p => p !== center);
        const suitorC = sh2.players.find(p => p !== center);
        gs.loveTriangles.push({
          center,
          suitors: [suitorA, suitorC],
          formedEp: epNum,
          phase: 'tension',
          episodesActive: 0,
          sourceType: 'dual-showmance',
          showmanceRef: [center, suitorA],
          jealousyLevel: 0,
          resolved: false,
          resolution: null
        });
        // Clear jealousPlayer on primary showmance to avoid duplicate events
        if (sh1.jealousPlayer) sh1.jealousPlayer = null;
        if (sh2.jealousPlayer) sh2.jealousPlayer = null;

        const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(center))?.name || 'merge');
        if (ep.campEvents?.[tribeName]) {
          const block = ep.campEvents[tribeName];
          const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
          evts.push({ type: 'triangleTension', text:
            `The math stopped adding up the moment ${center} started showing up in two places at once. ${suitorA} noticed first — the way ${center} looks at ${suitorC} is the same way ${pronouns(center).sub} used to look at ${suitorA}. Nobody's said it out loud yet. But everyone's thinking it.`,
            players: [suitorA, center, suitorC]
          });
        }
        ep.triangleEvents = ep.triangleEvents || [];
        ep.triangleEvents.push({ type: 'formed', center, suitors: [suitorA, suitorC], sourceType: 'dual-showmance' });
        return; // one triangle per episode
      }
    }
  }

  // Path 2: One-sided crush — C has bond >= 4 with B + romanticCompat + B in showmance with A
  for (const sh of activeShowmances) {
    // Ride-or-die showmances are too locked for triangles (0.15x chance)
    const rideOrDieMult = sh.phase === 'ride-or-die' ? 0.15 : 1.0;
    for (const center of sh.players) {
      const partnerA = sh.players.find(p => p !== center);
      const candidates = active.filter(c => {
        if (c === center || c === partnerA) return false;
        if (!romanticCompat(center, c)) return false;
        const bond = getBond(center, c);
        if (bond < 4) return false;
        // Must not already be in a showmance with center
        if (gs.showmances.some(s => s.players.includes(center) && s.players.includes(c) && s.phase !== 'broken-up')) return false;
        return true;
      });
      for (const suitorC of candidates) {
        const bond = getBond(center, suitorC);
        const chance = Math.min(0.30, bond * 0.06) * rideOrDieMult;
        if (Math.random() >= chance) continue;

        gs.loveTriangles.push({
          center,
          suitors: [partnerA, suitorC],
          formedEp: epNum,
          phase: 'tension',
          episodesActive: 0,
          sourceType: 'one-sided',
          showmanceRef: [center, partnerA],
          jealousyLevel: 0,
          resolved: false,
          resolution: null
        });
        if (sh.jealousPlayer) sh.jealousPlayer = null;

        const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(center))?.name || 'merge');
        if (ep.campEvents?.[tribeName]) {
          const block = ep.campEvents[tribeName];
          const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
          const _pC = pronouns(center);
          evts.push({ type: 'triangleTension', text:
            `Something shifted the night ${center} and ${suitorC} stayed up talking by the fire. ${partnerA} didn't say anything — just watched from the shelter. But ${pronouns(partnerA).sub} noticed. ${_pC.Sub} ${_pC.sub === 'they' ? 'have' : 'has'} been splitting ${_pC.posAdj} time ever since. The distance is starting to show.`,
            players: [partnerA, center, suitorC]
          });
        }
        ep.triangleEvents = ep.triangleEvents || [];
        ep.triangleEvents.push({ type: 'formed', center, suitors: [partnerA, suitorC], sourceType: 'one-sided' });
        return;
      }
    }
  }
}
```

- [ ] **Step 2: Verify function placement**

Confirm the function is placed after `checkShowmanceBreakup` (line ~16197) and before any unrelated function.

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add love triangle detection with dual-showmance and one-sided paths"
```

---

### Task 2: Lifecycle — Phase Progression & Camp Events

**Files:**
- Modify: `simulator.html` (after `checkLoveTriangleFormation`)

- [ ] **Step 1: Add `updateLoveTrianglePhases(ep)` function after `checkLoveTriangleFormation`**

```javascript
// ── Love Triangle Lifecycle: phase progression + events each episode ──
function updateLoveTrianglePhases(ep) {
  if (!gs.loveTriangles?.length) return;
  const active = gs.activePlayers;
  const epNum = ep.num || (gs.episode || 0) + 1;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];

  gs.loveTriangles.forEach(tri => {
    if (tri.resolved) return;
    const { center, suitors } = tri;
    const [suitorA, suitorC] = suitors;

    // Check all 3 still active — if not, resolve as eliminated
    const missing = [center, suitorA, suitorC].filter(p => !active.includes(p));
    if (missing.length) {
      tri.resolved = true;
      tri.resolution = { type: 'eliminated', who: missing[0], ep: epNum };
      tri.phase = 'resolved';
      // If both suitors eliminated (double tribal), lonely event for center
      if (missing.includes(suitorA) && missing.includes(suitorC) && active.includes(center)) {
        const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(center))?.name || 'merge');
        if (ep.campEvents?.[tribeName]) {
          const block = ep.campEvents[tribeName];
          const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
          evts.push({ type: 'triangleResolved', text:
            `${center} sits alone at the fire tonight. Both ${suitorA} and ${suitorC} are gone. The triangle resolved itself — just not the way anyone expected.`,
            players: [center]
          });
        }
      }
      ep.triangleEvents = ep.triangleEvents || [];
      ep.triangleEvents.push({ type: 'eliminated', center, who: missing[0] });
      return;
    }

    // Check if all 3 on same tribe or merged — freeze if separated
    const sameTribe = gs.isMerged || gs.tribes.some(t =>
      t.members.includes(center) && t.members.includes(suitorA) && t.members.includes(suitorC));
    if (!sameTribe) return; // frozen — no events, no escalation

    tri.episodesActive++;
    const bondACenter = getBond(suitorA, center);
    const bondCCenter = getBond(suitorC, center);
    const _pA = pronouns(suitorA), _pC = pronouns(suitorC), _pCenter = pronouns(center);

    const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(center))?.name || 'merge');
    const pushEvt = (type, text, players) => {
      if (!ep.campEvents?.[tribeName]) return;
      const block = ep.campEvents[tribeName];
      const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
      evts.push({ type, text, players: players || [suitorA, center, suitorC] });
      ep.triangleEvents = ep.triangleEvents || [];
      ep.triangleEvents.push({ type, phase: tri.phase, center, suitors: [suitorA, suitorC] });
    };

    // Phase transitions
    if (tri.phase === 'tension' && tri.episodesActive >= 3) {
      tri.phase = 'escalation';
    } else if (tri.phase === 'escalation' && tri.episodesActive >= 5) {
      tri.phase = 'ultimatum';
    }

    // Organic resolution check: if bond drops below 1.0 with either suitor
    if (bondACenter < 1.0 || bondCCenter < 1.0) {
      const survivingBond = bondACenter >= bondCCenter ? suitorA : suitorC;
      const droppedSuitor = survivingBond === suitorA ? suitorC : suitorA;
      tri.resolved = true;
      tri.resolution = { type: 'organic', survivingBond, ep: epNum };
      tri.phase = 'resolved';
      pushEvt('triangleResolved',
        `It ended quietly. ${center} stopped looking at ${droppedSuitor} the way ${_pCenter.sub} used to. No fight, no ultimatum — just distance. ${survivingBond} is still there. The triangle isn't.`,
        [center, survivingBond]);
      return;
    }

    // ── TENSION PHASE ──
    if (tri.phase === 'tension') {
      // Jealousy accumulates proportional to center's bond with rival suitor
      const jealousyGain = 1.0 + bondCCenter * 0.1;
      tri.jealousyLevel = Math.min(10, tri.jealousyLevel + jealousyGain);

      // Bond erosion: A-C animosity, A-B suspicion
      addBond(suitorA, suitorC, -0.3);
      addBond(suitorA, center, -0.15);

      // Tension camp events
      pushEvt('triangleTension', _pick([
        `${suitorA} catches ${center} laughing with ${suitorC} at the well. It's nothing. It's not nothing. ${_pA.Sub} ${_pA.sub === 'they' ? 'don\'t' : 'doesn\'t'} say anything — just walks back to camp with a different look on ${_pA.posAdj} face.`,
        `There's a silence every time ${suitorA}, ${center}, and ${suitorC} are all in the same space. The kind of silence that fills a room. Everyone feels it. Nobody names it.`,
        `${suitorC} sat next to ${center} at the fire again. ${suitorA} noticed. ${suitorA} always notices.`,
        `${center} has been splitting ${_pCenter.posAdj} time between ${suitorA} and ${suitorC}. It was subtle at first. It's not subtle anymore.`,
        `${suitorA} pulled a tribemate aside today: "Am I crazy, or is something going on between ${center} and ${suitorC}?" The tribemate didn't answer. That was answer enough.`,
        `The way ${center} looked at ${suitorC} during the challenge wasn't strategy. ${suitorA} saw it from across the course. The game just got personal.`,
        `${suitorA} used to be the person ${center} talked to after tribal. Now ${center} goes to ${suitorC} first. The shift happened slowly — but ${suitorA} knows exactly when it started.`,
        `${suitorC} doesn't know ${_pC.sub} ${_pC.sub === 'they' ? 'are' : 'is'} in a triangle. ${suitorA} does. That asymmetry is a ticking bomb.`,
      ]));

      // 30% chance: private confrontation
      if (Math.random() < 0.30) {
        const confrontBond = -0.5;
        addBond(suitorA, center, confrontBond);
        pushEvt('triangleConfrontation', _pick([
          `${suitorA} finally said it: "What's going on with you and ${suitorC}?" ${center} didn't have a good answer. The silence between them was louder than anything in camp.`,
          `"I need to know where I stand." ${suitorA} cornered ${center} by the water well. ${center} said all the right things. ${suitorA} didn't believe any of them.`,
          `${suitorA} confronted ${center} about ${suitorC}. ${center} said it's nothing. The way ${_pCenter.sub} said it made it sound like everything.`,
          `"Are you choosing ${suitorC}?" ${suitorA} asked point-blank. ${center} hesitated. In this game, hesitation IS the answer.`,
          `${suitorA} and ${center} had a conversation that started calm and ended cold. The subject was ${suitorC}. The subtext was betrayal.`,
          `"I've been loyal to you since day one." ${suitorA} said it like a fact. ${center} heard it like an accusation.`,
          `The confrontation happened at the water well. ${suitorA} asked once. ${center} deflected. ${suitorA} didn't ask again. The answer was in what wasn't said.`,
          `${suitorA} pulled ${center} aside and laid it out: "It's me or ${suitorC}. I'm not sharing." ${center} asked for time. Time is running out.`,
        ]), [suitorA, center]);
      }
    }

    // ── ESCALATION PHASE ──
    if (tri.phase === 'escalation') {
      const jealousyGain = 1.5 + bondCCenter * 0.1;
      tri.jealousyLevel = Math.min(10, tri.jealousyLevel + jealousyGain);

      // Accelerated bond erosion
      addBond(suitorA, suitorC, -0.5);
      addBond(suitorA, center, -0.3);

      // Escalation camp events
      if (Math.random() < 0.60) {
        pushEvt('triangleEscalation', _pick([
          `The triangle has become everyone's business. ${suitorA} is rallying allies against ${suitorC}. ${suitorC} doesn't know it yet. The tribe is picking sides — and they're not picking quietly.`,
          `"You're either with me or you're with ${suitorC}." ${suitorA} said it to three different people today. The tribe is splitting along lines that have nothing to do with strategy.`,
          `${suitorA} pitched voting out ${suitorC} to anyone who'd listen. The reasoning was strategic. The motivation wasn't.`,
          `Alliances are cracking along the triangle. Players who were solid are hedging. The center of gravity shifted the moment ${suitorA} made it personal.`,
          `The tribe had a strategy meeting that turned into a referendum on ${center}'s love life. Nobody wanted to talk about it. Everybody had an opinion.`,
          `${suitorC} finally figured out what's happening. The look on ${_pC.posAdj} face said everything. Now there are two players campaigning, and only one of them has been in this fight from the start.`,
          `Three separate conversations today, all about the same topic: who does ${center} really want? The tribe is invested. Strategy has left the building.`,
          `${suitorA} made it clear: anyone who votes with ${suitorC} is voting against ${_pA.obj}. The lines are drawn. The tribe is choosing sides in someone else's love story.`,
        ]));
      }

      // 40% chance: tribemates discuss exploiting the triangle
      if (Math.random() < 0.40) {
        const outsiders = active.filter(p => p !== center && p !== suitorA && p !== suitorC && pStats(p).strategic >= 5);
        if (outsiders.length) {
          const schemer = outsiders[Math.floor(Math.random() * outsiders.length)];
          pushEvt('triangleEscalation', _pick([
            `${schemer} sees opportunity in the chaos. "Let them fight over ${center}. While they're distracted, we move." The triangle is the best thing that's happened to ${schemer}'s game.`,
            `${schemer} pulled aside a few numbers and laid it out: "These three are imploding. We pick off whichever one survives." Cold. Smart. Exactly the kind of move this game rewards.`,
          ]), [schemer, center]);
        }
      }

      // Public fight — high drama
      if (Math.random() < 0.30) {
        addBond(suitorA, suitorC, -1.0);
        pushEvt('trianglePublicFight', _pick([
          `It finally exploded. ${suitorA} and ${suitorC} went at it in front of the whole tribe. ${center} stood between them saying nothing. The silence was the loudest part.`,
          `${suitorA} called out ${suitorC} at the fire. Voices raised. Names dropped. ${center} tried to intervene and made it worse. The tribe watched like it was the finale.`,
          `The fight between ${suitorA} and ${suitorC} happened fast and loud. By the time it was over, half the tribe had picked a side and the other half was looking for cover.`,
          `${suitorA} snapped. Said things about ${suitorC} that can't be unsaid. ${center} walked away. Both of them watched ${_pCenter.obj} go. Neither followed.`,
          `Tribal lines shattered when ${suitorA} confronted ${suitorC} in front of everyone. "${center} was mine before you showed up." The whole tribe heard it. Strategy is dead tonight.`,
          `What started as a whispered argument between ${suitorA} and ${suitorC} turned into a camp-wide event. ${center} buried ${_pCenter.posAdj} head in ${_pCenter.posAdj} hands. This is the kind of moment that changes the game.`,
          `The meltdown the tribe had been waiting for finally arrived. ${suitorA} vs. ${suitorC}. No strategy, no gameplay — just raw emotion. ${center} looked like ${_pCenter.sub} wanted to disappear.`,
          `${suitorA} said it loud enough for everyone to hear: "${suitorC} is trying to steal ${center} from me." ${suitorC}'s response: "You can't steal what was never yours." The tribe held its breath.`,
        ]));
      }
    }

    // ── ULTIMATUM PHASE ──
    if (tri.phase === 'ultimatum' && !tri.resolved) {
      const sCenter = pStats(center);
      const bondA = getBond(center, suitorA);
      const bondC = getBond(center, suitorC);

      // Find primary showmance for relationship length
      const primarySh = gs.showmances.find(sh =>
        sh.players.includes(center) && sh.players.includes(suitorA) && sh.phase !== 'broken-up');
      const relationshipLengthA = primarySh ? (primarySh.episodesActive || 0) : 0;

      // Decision formula
      const scoreA = bondA * 0.40
        + (sCenter.loyalty * 0.03 * relationshipLengthA) * 0.30
        + (threatScore(suitorC) - threatScore(suitorA)) * 0.20 * -1 // prefer less threatening
        + (Math.random() - 0.5) * 0.10;
      const scoreC = bondC * 0.40
        + 0 // no relationship length bonus for new attraction
        + (threatScore(suitorA) - threatScore(suitorC)) * 0.20 * -1
        + (Math.random() - 0.5) * 0.10;

      const chosen = scoreA >= scoreC ? suitorA : suitorC;
      const rejected = chosen === suitorA ? suitorC : suitorA;
      const _pRej = pronouns(rejected);
      const _pCho = pronouns(chosen);

      // Chosen gets bond boost
      addBond(center, chosen, 1.0);

      // Rejected player's reaction — personality-driven severity
      const sRejected = pStats(rejected);
      const rejBond = getBond(rejected, center);
      const rejectionSeverity = sRejected.loyalty * 0.3 + sRejected.temperament * -0.2 + rejBond * 0.2;

      let bondCrash, heatBoost;
      const rejArch = sRejected.archetype || '';
      if (rejArch === 'villain' || rejArch === 'schemer') {
        // Weaponize rejection for sympathy
        bondCrash = -(1.0 + rejectionSeverity * 0.1);
        heatBoost = -0.5; // gains sympathy
      } else if (sRejected.strategic >= 7 && sRejected.loyalty <= 4) {
        // Strategic pivot
        bondCrash = -(1.0 + rejectionSeverity * 0.15);
        heatBoost = 0.5;
      } else {
        // Emotional reaction — high loyalty hurts more
        bondCrash = -Math.min(5, 2.0 + rejectionSeverity * 0.2);
        heatBoost = Math.min(2.0, 0.5 + rejectionSeverity * 0.15);
      }
      addBond(rejected, center, bondCrash);
      addBond(rejected, chosen, bondCrash * 0.6); // also resents the chosen

      tri.resolved = true;
      tri.resolution = {
        type: 'chose',
        chosen,
        rejected,
        ep: epNum,
        severity: rejectionSeverity,
        bondCrash,
        heatBoost
      };
      tri.phase = 'resolved';

      // Store heat boost for computeHeat to pick up next episode
      gs._triangleRejectionHeat = gs._triangleRejectionHeat || {};
      gs._triangleRejectionHeat[rejected] = { heat: heatBoost, expiresEp: epNum + 2 };

      pushEvt('triangleUltimatum', _pick([
        `It came down to one question: "${suitorA} or ${suitorC}?" ${center} chose ${chosen}. The look on ${rejected}'s face will stay with this tribe longer than any blindside.`,
        `${center} pulled ${rejected} aside and said the words nobody wants to hear: "I care about you. But not like that." ${rejected} didn't argue. ${_pRej.Sub} just walked away.`,
        `The triangle ended the way everyone feared and nobody expected. ${center} chose ${chosen}. ${rejected} sat at the fire alone that night. Tomorrow, ${_pRej.sub} ${_pRej.sub === 'they' ? 'come' : 'comes'} back with a plan. Or a grudge. Or both.`,
        `"I've made my decision." ${center} said it to both of them at the same time. ${chosen} exhaled. ${rejected} didn't blink. The triangle is over. What comes next might be worse.`,
      ]), [center, chosen, rejected]);

      // Second event for the rejected player's reaction
      if (rejArch === 'villain' || rejArch === 'schemer') {
        pushEvt('triangleResolved', _pick([
          `${rejected} smiled when ${center} made the choice. Not a warm smile. The kind that makes people check their bags at tribal. "That's fine," ${_pRej.sub} said. "I'll remember this."`,
          `${rejected} took the rejection in stride — publicly. In confessional: "They just handed me the best underdog story of the season. Now I destroy them both."`,
        ]), [rejected]);
      } else if (sRejected.strategic >= 7 && sRejected.loyalty <= 4) {
        pushEvt('triangleResolved', _pick([
          `${rejected} processed it for exactly ten seconds, then started making new alliances. "The best thing ${center} did for my game was cut me loose." Cold. Effective.`,
          `${rejected} pivoted faster than anyone expected. By sundown, ${_pRej.sub} had three new conversations going and a plan that didn't include ${center} or ${chosen}. The game goes on.`,
        ]), [rejected]);
      } else {
        pushEvt('triangleResolved', _pick([
          `${rejected} hasn't spoken to ${center} since the decision. The tribe can feel the hurt radiating off ${_pRej.obj}. This isn't the kind of wound that heals before the merge.`,
          `${rejected} sat alone for a long time after ${center} chose ${chosen}. When ${_pRej.sub} finally came back to camp, ${_pRej.posAdj} eyes were red but ${_pRej.posAdj} jaw was set. Something shifted.`,
          `"I gave ${_pRej.obj} everything." ${rejected} said it to nobody. Or maybe to the cameras. The betrayal of the heart hits different than a blindside at tribal.`,
          `${rejected} tried to pretend it didn't hurt. The tribe wasn't fooled. ${_pRej.Sub} ${_pRej.sub === 'they' ? 'are' : 'is'} still in this game — but the fire behind ${_pRej.posAdj} eyes is different now. Colder.`,
        ]), [rejected]);
      }

      ep.triangleResolution = { center, chosen, rejected, severity: rejectionSeverity, bondCrash, heatBoost };
    }
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add love triangle lifecycle — tension, escalation, ultimatum phases"
```

---

### Task 3: Wire Triangle Functions Into Episode Flow

**Files:**
- Modify: `simulator.html` — find where `updateShowmancePhases(ep)` and `checkShowmanceFormation(ep)` are called in the episode simulation flow

- [ ] **Step 1: Find where showmance functions are called in the episode loop**

Search for `updateShowmancePhases(ep)` calls. These are in the episode simulation — add triangle calls right after each one:

```javascript
// After each updateShowmancePhases(ep) call, add:
checkLoveTriangleFormation(ep);
updateLoveTrianglePhases(ep);
```

Search for all call sites of `updateShowmancePhases` and add the two triangle calls after each one. The triangle detection runs after showmance phases update so it can read current showmance state.

- [ ] **Step 2: Initialize `gs.loveTriangles` in game state setup**

Find where `gs.showmances = []` is first initialized (in the game state reset/setup, NOT inside `checkShowmanceFormation`). Add `gs.loveTriangles = [];` right after it.

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: wire love triangle functions into episode simulation flow"
```

---

### Task 4: Heat & Vote Integration

**Files:**
- Modify: `simulator.html:3763-3767` (computeHeat showmance block)
- Modify: `simulator.html:7514-7515` (simulateVotes showmance resist area)

- [ ] **Step 1: Add triangle heat to `computeHeat` after the showmance heat block (line ~3767)**

After the existing showmance heat block ending at line 3767, add:

```javascript
  // Love triangle heat — all 3 members get collateral heat
  const _tri = (gs.loveTriangles || []).find(t => !t.resolved && (t.center === name || t.suitors.includes(name)));
  if (_tri) {
    const triHeat = _tri.center === name
      ? 0.4 * (_tri.jealousyLevel / 10)   // center gets more heat
      : 0.2 * (_tri.jealousyLevel / 10);  // suitors get less
    heat += gs.phase === 'post-merge' ? triHeat : triHeat * 0.3;
  }
  // Rejected player revenge heat (temporary, 2 episodes)
  const _rejHeat = gs._triangleRejectionHeat?.[name];
  if (_rejHeat && epNum <= _rejHeat.expiresEp) {
    heat += _rejHeat.heat; // can be negative for villain sympathy
  }
```

Note: `epNum` may not be available in `computeHeat`. Use `(gs.episode || 0) + 1` instead:

```javascript
  const _rejHeat = gs._triangleRejectionHeat?.[name];
  if (_rejHeat && ((gs.episode || 0) + 1) <= _rejHeat.expiresEp) {
    heat += _rejHeat.heat;
  }
```

- [ ] **Step 2: Verify vote targeting flows through heat**

The rejected player's targeting bias is already handled: `computeHeat` picks up `_triangleRejectionHeat` (added in Step 1), and heat drives vote targeting. No separate `simulateVotes` modification needed — the heat system handles it proportionally. Verify by confirming `computeHeat` results feed into vote target selection (they do — `computeHeat(name)` is called in vote scoring).

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: integrate love triangle heat and vote targeting bias"
```

---

### Task 5: Episode History & Serialization

**Files:**
- Modify: `simulator.html:27760` (patchEpisodeHistory, after showmance fields)
- Modify: `simulator.html:27988` (gsSnapshot serialization, after showmances line)

- [ ] **Step 1: Add triangle fields to `patchEpisodeHistory` (after line ~27759)**

After the existing showmance history lines, add:

```javascript
  if (ep.triangleEvents?.length) h.triangleEvents = ep.triangleEvents;
  if (ep.triangleResolution) h.triangleResolution = ep.triangleResolution;
```

- [ ] **Step 2: Add triangle serialization to gsSnapshot (after line ~27988)**

After the showmances serialization line, add:

```javascript
    loveTriangles: (gs.loveTriangles || []).map(t => ({ ...t, suitors: [...t.suitors], showmanceRef: [...t.showmanceRef], resolution: t.resolution ? { ...t.resolution } : null })),
```

- [ ] **Step 3: Also add to `_triangleRejectionHeat` cleanup**

In `patchEpisodeHistory` or at end of episode, clean up expired rejection heat:

```javascript
  // Clean expired triangle rejection heat
  if (gs._triangleRejectionHeat) {
    const curEp = (gs.episode || 0) + 1;
    for (const name of Object.keys(gs._triangleRejectionHeat)) {
      if (curEp > gs._triangleRejectionHeat[name].expiresEp) {
        delete gs._triangleRejectionHeat[name];
      }
    }
  }
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: add love triangle episode history and serialization"
```

---

### Task 6: VP Badge Registration

**Files:**
- Modify: `simulator.html:35043` (isShowmance detection line area)
- Modify: `simulator.html:35045-35221` (badgeText ternary chain)
- Modify: `simulator.html:35222-35305` (badgeClass ternary chain)

- [ ] **Step 1: Add triangle event type detection near the `isShowmance` check (line ~34989)**

Find the existing event type boolean block (where `isShowmance`, `isAlliance`, etc. are defined). Add after:

```javascript
    const isTriangle     = evt.type?.startsWith('triangle');
    const isTriangleNeg  = evt.type === 'triangleConfrontation' || evt.type === 'trianglePublicFight' || evt.type === 'triangleUltimatum';
    const isTriangleGold = evt.type === 'triangleTension' || evt.type === 'triangleEscalation';
    const isTriangleRes  = evt.type === 'triangleResolved';
```

- [ ] **Step 2: Add triangle badges to badgeText ternary chain**

Find the showmance badge entries (line ~35059 `isShowmance ? 'SHOWMANCE'`). Add BEFORE that line:

```javascript
                     : isTriangleNeg   ? (evt.type === 'triangleUltimatum' ? '💔 Choose One' : evt.type === 'trianglePublicFight' ? '💥 Triangle Meltdown' : '💔 Confrontation')
                     : isTriangleGold  ? (evt.type === 'triangleTension' ? '⚠ Love Triangle' : '🎯 Pick a Side')
                     : isTriangleRes   ? (evt.text?.includes('Chose') || evt.text?.includes('chose') ? '💕 Chose' : '💔 Rejected')
```

- [ ] **Step 3: Add triangle classes to badgeClass ternary chain**

Find the showmance color entries (line ~35291). Add BEFORE that line:

```javascript
                     : isTriangleNeg ? 'red'
                     : isTriangleGold ? 'gold'
                     : isTriangleRes ? (evt.text?.includes('Chose') || evt.text?.includes('chose') ? 'green' : 'red')
```

- [ ] **Step 4: Add triangle types to the `isNeg` array (line ~35038-35043)**

Find the `isNeg` type array and add triangle confrontation/fight types:

```javascript
// Add to the isNeg array:
'triangleConfrontation', 'trianglePublicFight'
```

- [ ] **Step 5: Commit**

```bash
git add simulator.html
git commit -m "feat: register love triangle VP badges — badgeText, badgeClass, detection"
```

---

### Task 7: Aftermath — Truth or Anvil

**Files:**
- Modify: `simulator.html:26601` (after showmance contradiction, before clean fallback)

- [ ] **Step 1: Add love triangle contradiction type after the showmance block (line ~26601)**

Insert after the closing `}` of the showmance contradiction block (line 26601), before the `// Fallback: clean game` comment (line 26603):

```javascript

    // Love triangle secret
    const _triangle = (gs.loveTriangles || []).find(t =>
      t.center === name || t.suitors.includes(name));
    if (_triangle) {
      const _triRole = _triangle.center === name ? 'center'
        : (_triangle.resolution?.rejected === name ? 'rejected' : 'chosen');
      const _triResolved = _triangle.resolved;
      const _triDrama = _triResolved && _triangle.resolution?.type === 'chose' ? 8
        : _triResolved ? 6 : 7;
      const _triOther1 = _triangle.center === name ? _triangle.suitors[0] : _triangle.center;
      const _triOther2 = _triangle.center === name ? _triangle.suitors[1]
        : _triangle.suitors.find(s => s !== name) || _triangle.center;

      if (_triRole === 'center') {
        _contradictions.push({
          setup: `You had two people fighting for you out there. ${_triOther1} and ${_triOther2}. The whole tribe watched it happen. Did you ever actually care about both of them — or were you stringing one along?`,
          evidence: `Love triangle formed episode ${_triangle.formedEp}. ${_triResolved && _triangle.resolution?.type === 'chose' ? `Chose ${_triangle.resolution.chosen}, rejected ${_triangle.resolution.rejected}.` : `Resolved: ${_triangle.resolution?.type || 'ongoing'}.`} Jealousy level peaked at ${_triangle.jealousyLevel.toFixed(1)}.`,
          affected: [_triOther1, _triOther2].filter(p => [...gs.activePlayers, ...(gs.jury || [])].includes(p)),
          type: 'love-triangle', drama: _triDrama
        });
      } else if (_triRole === 'rejected') {
        _contradictions.push({
          setup: `You and ${_triangle.center}. Everyone saw how you looked at ${pronouns(_triangle.center).obj}. And then ${_triangle.center} chose ${_triangle.resolution?.chosen || 'someone else'}. Were you blindsided — or did you see it coming?`,
          evidence: `Rejected in episode ${_triangle.resolution?.ep || '?'}. Bond crashed by ${Math.abs(_triangle.resolution?.bondCrash || 0).toFixed(1)}. Severity: ${(_triangle.resolution?.severity || 0).toFixed(1)}.`,
          affected: [_triangle.center].filter(p => [...gs.activePlayers, ...(gs.jury || [])].includes(p)),
          type: 'love-triangle', drama: _triDrama
        });
      } else {
        _contradictions.push({
          setup: `You won the triangle — ${_triangle.center} chose you over ${_triangle.resolution?.rejected || 'someone else'}. But honestly... did you ever worry you were the backup plan?`,
          evidence: `Chosen in episode ${_triangle.resolution?.ep || '?'}. Triangle lasted ${_triangle.episodesActive} episodes.`,
          affected: [_triangle.center, _triangle.resolution?.rejected].filter(p => p && [...gs.activePlayers, ...(gs.jury || [])].includes(p)),
          type: 'love-triangle', drama: _triDrama
        });
      }
    }
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: add love triangle Truth or Anvil contradiction type"
```

---

### Task 8: Aftermath — Fan Call, Unseen Footage, Host Roast

**Files:**
- Modify: `simulator.html:26912` (after archetype questions, before universal fallbacks)
- Modify: `simulator.html:26798` (after loyalty-test footage, before sort/splice)
- Modify: `simulator.html:26441` (after temperament roasts, before universal fallbacks)

- [ ] **Step 1: Add Fan Call triangle questions (after line ~26912, before line 26914)**

```javascript
  // Love triangle questions
  const _ftTriangle = (gs.loveTriangles || []).find(t => t.center === _fanTarget || t.suitors.includes(_fanTarget));
  if (_ftTriangle) {
    const _ftTriRole = _ftTriangle.center === _fanTarget ? 'center'
      : (_ftTriangle.resolution?.rejected === _fanTarget ? 'rejected' : 'suitor');
    if (_ftTriRole === 'center') {
      _allQs.push({ cat: 'triangle', q: `"The love triangle was THE storyline this season. When did you first realize you were in the middle of it?"`,
        a: _ftS.strategic >= 6 ? `"I knew what was happening. I just didn't know how to stop it without losing both of them."` : `"Honestly? I didn't see it until it was too late. I thought I could keep everyone happy. I was wrong."`, tone: ['superfan', 'drama'] });
      _allQs.push({ cat: 'triangle', q: `"Be honest — did you enjoy having two people competing for your attention?"`,
        a: _ftS.social >= 6 ? `"It wasn't like that. These were real feelings. Real people. I hated every second of hurting someone."` : `"...Maybe at first. But it stopped being fun the moment I saw what it was doing to ${_ftTriangle.suitors[0]}."`, tone: ['drama', 'hater'] });
    } else if (_ftTriRole === 'rejected') {
      _allQs.push({ cat: 'triangle', q: `"The audience was rooting for you in that love triangle. How are you holding up?"`,
        a: _ftS.loyalty >= 6 ? `"I'm not going to lie — it gutted me. I thought what we had was real. Turns out I was the backup plan."` : `"I'm fine. Honestly. The game taught me something about myself. Not everyone who says they care actually does."`, tone: ['supporter', 'drama'] });
      _allQs.push({ cat: 'triangle', q: `"You got picked second. In love and in this game. How does that feel to hear out loud?"`,
        a: `"Terrible. Thanks for asking."`, tone: ['hater'] });
    } else {
      _allQs.push({ cat: 'triangle', q: `"You were part of the love triangle whether you wanted to be or not. Did you know what was happening?"`,
        a: _ftS.intuition >= 6 ? `"I could feel it. The tension between us was impossible to miss. I just didn't want to be the one to name it."` : `"Honestly? I had no idea until it blew up. I thought ${_ftTriangle.center} and I were just friends."`, tone: ['superfan', 'supporter'] });
    }
  }
```

- [ ] **Step 2: Add Unseen Footage triangle source (after line ~26798, before the sort at line 26800)**

```javascript
  // Love triangle footage
  (gs.loveTriangles || []).forEach(tri => {
    const triPr = pronouns(tri.center);
    unseenFootage.push({
      sourceEp: tri.formedEp,
      type: 'love-triangle',
      description: `What the cameras caught between the fire and the shelter... ${tri.center} pulled aside by ${tri.suitors[0]}, then found talking with ${tri.suitors[1]} an hour later. The triangle the tribe suspected — confirmed.`,
      players: [tri.suitors[0], tri.center, tri.suitors[1]],
      classified: true,
      drama: 7
    });
    if (tri.phase === 'escalation' || tri.phase === 'ultimatum' || tri.resolved) {
      unseenFootage.push({
        sourceEp: tri.resolution?.ep || tri.formedEp + tri.episodesActive,
        type: 'love-triangle',
        description: `The confrontation between ${tri.suitors[0]} and ${tri.suitors[1]} over ${tri.center}. Voices low but sharp. "${triPr.Sub} ${triPr.sub === 'they' ? 'were' : 'was'} mine first." The cameras caught every word.`,
        players: [tri.suitors[0], tri.suitors[1]],
        classified: true,
        drama: 6
      });
    }
  });
```

- [ ] **Step 3: Add Host Roast triangle templates (after line ~26441, before the universal fallbacks comment)**

```javascript
      // Love triangle roasts
      const _triRoast = (gs.loveTriangles || []).find(t => t.center === p || t.suitors.includes(p));
      if (_triRoast) {
        if (_triRoast.center === p) {
          pool.push(`"${p} managed to have TWO showmances. Most people can't maintain one alliance, and ${rPr.sub} ${rPr.sub === 'they' ? 'are' : 'is'} out here collecting partners."`);
          pool.push(`"${p} — the center of a love triangle. Which sounds glamorous until you realize it means TWO people want to vote you out for personal reasons."`);
        } else if (_triRoast.resolution?.rejected === p) {
          pool.push(`"${p} got chosen last in the love triangle. At least in Schoolyard Pick you get sent to Exile — here ${rPr.sub} just ${rPr.sub === 'they' ? 'have' : 'has'} to watch."`);
          pool.push(`"${p}. Lost the love triangle AND the game. At least ${rPr.sub} ${rPr.sub === 'they' ? 'are' : 'is'} consistent."`);
        } else {
          pool.push(`"${p} won the love triangle. Congratulations. Now the entire tribe wants ${rPr.obj} both gone."`);
        }
      }
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: add love triangle Aftermath content — fan call, unseen footage, host roast"
```

---

### Task 9: Triangle Resolution on Elimination

**Files:**
- Modify: `simulator.html:16171` (inside or near `checkShowmanceBreakup`)

- [ ] **Step 1: Add `checkLoveTriangleBreakup(ep)` function near `checkShowmanceBreakup`**

```javascript
// ── Love Triangle Breakup: resolve when any member is eliminated ──
function checkLoveTriangleBreakup(ep) {
  if (!gs.loveTriangles?.length || !ep.eliminated) return;
  const elim = ep.eliminated;
  const epNum = ep.num || (gs.episode || 0) + 1;
  gs.loveTriangles.forEach(tri => {
    if (tri.resolved) return;
    if (tri.center !== elim && !tri.suitors.includes(elim)) return;
    tri.resolved = true;
    tri.resolution = { type: 'eliminated', who: elim, ep: epNum };
    tri.phase = 'resolved';
    ep.triangleEvents = ep.triangleEvents || [];
    ep.triangleEvents.push({ type: 'eliminated', center: tri.center, who: elim });
  });
}
```

- [ ] **Step 2: Wire `checkLoveTriangleBreakup(ep)` into elimination paths**

Add the call right after each `checkShowmanceBreakup(ep)` call. Search for all instances of `checkShowmanceBreakup` and add `checkLoveTriangleBreakup(ep);` after each one. Also check `patchEpisodeHistory` where `checkShowmanceBreakup` is called at line 27731 — add triangle breakup there too:

```javascript
  if (!h.showmanceBreakup && !h.showmanceSeparation) checkShowmanceBreakup(ep);
  checkLoveTriangleBreakup(ep); // also resolve triangles on elimination
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: resolve love triangles on elimination"
```

---

### Task 10: Mole Overlap & Final Polish

**Files:**
- Modify: `simulator.html` — Mole suspicion section (where suspicion is calculated)
- Modify: `simulator.html` — `prepGsForSave` / `repairGsSets` if needed

- [ ] **Step 1: Add Mole triangle cover in suspicion calculation**

Find where Mole suspicion is calculated (the `suspicion += (intuition * 0.04 + mental * 0.015)` pattern). Add a modifier that reduces suspicion growth when the Mole is in an active triangle:

```javascript
// Triangle cover — drama distracts from suspicion
const _moleInTriangle = (gs.loveTriangles || []).some(t => !t.resolved && (t.center === mole.player || t.suitors.includes(mole.player)));
if (_moleInTriangle) {
  suspGain *= 0.85; // 15% reduction — triangle drama provides cover
}
```

- [ ] **Step 2: Verify serialization — no Sets in triangle objects**

`gs.loveTriangles` uses only arrays and plain objects — no Sets. Confirm `prepGsForSave()` and `repairGsSets()` do NOT need changes. The `_triangleRejectionHeat` object is also plain key-value — no Sets.

- [ ] **Step 3: Add `gs.loveTriangles` and `gs._triangleRejectionHeat` cleanup to game reset**

Find where game state is reset (new season start) and ensure `gs.loveTriangles = []` and `gs._triangleRejectionHeat = {}` are included.

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: add Mole triangle cover and finalize love triangle system"
```
