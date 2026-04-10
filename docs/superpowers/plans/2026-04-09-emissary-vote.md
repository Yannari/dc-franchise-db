# Emissary Vote Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a schedulable pre-merge twist where the winning tribe sends an emissary to the losing tribe's tribal council, who eliminates a second player after the normal vote.

**Architecture:** New `simulateEmissaryVote(ep)` function handles emissary selection, scouting, and pick. Emissary selection happens in `applyTwist`. The pick fires after `resolveVotes` in the standard tribal flow. VP screen `rpBuildEmissaryVote(ep)` renders the 3-phase experience. Text backlog via `_textEmissaryVote(ep, ln, sec)`.

**Tech Stack:** Pure JS in `simulator.html`. No external dependencies.

---

### Task 1: TWIST_CATALOG Entry

**Files:**
- Modify: `simulator.html:1638` (after ambassadors entry)

- [ ] **Step 1: Add the catalog entry**

After line 1638 (the ambassadors entry), add:

```javascript
  { id:'emissary-vote', emoji:'🕵️', name:'Emissary Vote', category:'elim', phase:'pre-merge', desc:'Winning tribe sends an emissary to losing tribe\'s tribal. After the normal vote, the emissary eliminates a second player.', engineType:'emissary-vote', incompatible:['ambassadors','double-tribal','multi-tribal','kidnapping'], minTribes:2 },
```

- [ ] **Step 2: Verify it appears in the twist scheduler UI**

Open simulator.html in a browser, go to season config, open twist scheduling. Confirm "Emissary Vote" appears in the `elim` category with the 🕵️ emoji and is only available for pre-merge episodes.

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: add Emissary Vote to TWIST_CATALOG"
```

---

### Task 2: Emissary Selection in `applyTwist`

**Files:**
- Modify: `simulator.html` — inside `applyTwist` function, after the ambassadors block (after ~line 14250)

- [ ] **Step 1: Add the emissary-vote engine type handler**

After the ambassadors `} else if` block closes (search for the closing `}` of the ambassadors section), add:

```javascript
  } else if (engineType === 'emissary-vote') {
    // ── EMISSARY VOTE: winning tribe sends emissary to losing tribe's tribal ──
    // Requires pre-merge with distinct winning/losing tribes
    if (gs.isMerged || !ep.winner || !ep.loser) {
      twistObj.blocked = true;
      twistObj.blockedReason = 'requires pre-merge with winning/losing tribes';
      return;
    }
    const _evWinTribe = ep.winner;
    const _evLoseTribe = ep.loser;
    const _evWinMembers = _evWinTribe.members.filter(m => gs.activePlayers.includes(m));
    if (_evWinMembers.length < 2) {
      twistObj.blocked = true;
      twistObj.blockedReason = 'winning tribe too small';
      return;
    }

    // ── Emissary selection: boldness + strategic + social scoring ──
    const _evScores = _evWinMembers.map(name => {
      const s = pStats(name);
      return { name, score: s.boldness * 0.06 + s.strategic * 0.05 + s.social * 0.04 + Math.random() * 0.15 };
    }).sort((a, b) => b.score - a.score);
    const _evEmissary = _evScores[0].name;
    const _evEmS = pStats(_evEmissary);
    const _evEmPr = pronouns(_evEmissary);
    const _evArch = _evEmS.archetype || 'neutral';

    ep.emissary = { name: _evEmissary, tribe: _evWinTribe.name, targetTribe: _evLoseTribe.name };

    // ── Archetype-flavored volunteer dialogue ──
    const _evVolunteerText = ['villain','schemer','mastermind'].includes(_evArch)
      ? `${_evEmissary} volunteers with a thin smile. "I'll handle this."`
      : ['hero','loyal','protector'].includes(_evArch)
      ? `${_evEmissary} steps forward reluctantly. "Someone has to do it. Might as well be me."`
      : ['floater','follower'].includes(_evArch)
      ? `${_evEmissary} shrugs and volunteers. "Sure, I'll go check it out."`
      : `${_evEmissary} volunteers. "I want to see what's going on over there."`;

    // ── Own tribe bond shifts ──
    _evWinMembers.filter(p => p !== _evEmissary).forEach(p => {
      const pS = pStats(p);
      if (['villain','schemer','mastermind'].includes(_evArch) && pS.intuition >= 6) {
        addBond(p, _evEmissary, -0.2); // suspicious of motives
      } else {
        addBond(p, _evEmissary, 0.3); // respect for stepping up
      }
    });

    // ── Camp event on winning tribe ──
    const _evWinKey = _evWinTribe.name;
    if (!ep.campEvents) ep.campEvents = {};
    if (!ep.campEvents[_evWinKey]) ep.campEvents[_evWinKey] = { pre: [], post: [] };
    if (!ep.campEvents[_evWinKey].post) ep.campEvents[_evWinKey].post = [];
    ep.campEvents[_evWinKey].post.push({
      type: 'emissaryVolunteer',
      players: [_evEmissary, ..._evWinMembers.filter(p => p !== _evEmissary).slice(0, 2)],
      text: _evVolunteerText,
      consequences: `${_evEmissary} will visit ${_evLoseTribe.name}'s tribal council.`,
      badgeText: 'EMISSARY', badgeClass: 'gold'
    });
  }
```

- [ ] **Step 2: Test that scheduling the twist sets ep.emissary**

Schedule emissary-vote on a pre-merge episode in the config UI. Run the episode. Open browser console and verify `gs.episodeHistory[gs.episodeHistory.length-1].emissary` exists with `name`, `tribe`, and `targetTribe`.

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: emissary selection in applyTwist (boldness+strategic+social scoring)"
```

---

### Task 3: Scouting Period Events

**Files:**
- Modify: `simulator.html` — add `generateEmissaryScoutEvents(ep)` function near the other camp event generators

- [ ] **Step 1: Add the scouting events generator function**

Place this function near `generateCampEventsForGroup` (around line 5800-5900 area, wherever the camp event generators are clustered). Search for `function generateCampEventsForGroup` and add before it:

```javascript
  // ── EMISSARY VOTE: scouting events at losing tribe's camp ──
  function generateEmissaryScoutEvents(ep) {
    if (!ep.emissary) return;
    const emissary = ep.emissary.name;
    const emS = pStats(emissary);
    const emPr = pronouns(emissary);
    const emArch = emS.archetype || 'neutral';
    const loseTribeName = ep.emissary.targetTribe;
    const loseTribe = gs.tribes.find(t => t.name === loseTribeName);
    if (!loseTribe) return;
    const loseMembers = loseTribe.members.filter(m => gs.activePlayers.includes(m));
    if (!loseMembers.length) return;

    ep.emissaryScoutEvents = [];
    const _evCampKey = loseTribeName;
    if (!ep.campEvents) ep.campEvents = {};
    if (!ep.campEvents[_evCampKey]) ep.campEvents[_evCampKey] = { pre: [], post: [] };
    if (!ep.campEvents[_evCampKey].post) ep.campEvents[_evCampKey].post = [];

    // ── 1. PITCHES (1-2 losing tribe members approach the emissary) ──
    // Most likely: high social, high strategic, or high heat (feeling threatened)
    const _evPitchCandidates = loseMembers.map(name => {
      const s = pStats(name);
      const heat = computeHeat(name, loseMembers, ep);
      const bond = getBond(emissary, name);
      return { name, score: s.social * 0.05 + s.strategic * 0.04 + heat * 0.03 + bond * 0.02 + Math.random() * 0.10 };
    }).sort((a, b) => b.score - a.score);

    const _evPitchCount = Math.min(_evPitchCandidates.length, Math.random() < 0.4 ? 2 : 1);
    const _evPitchers = _evPitchCandidates.slice(0, _evPitchCount);

    _evPitchers.forEach(pitcher => {
      const pS = pStats(pitcher.name);
      const pPr = pronouns(pitcher.name);
      // Pitch against their lowest-bond rival on the tribe
      const _evRivals = loseMembers.filter(p => p !== pitcher.name)
        .map(p => ({ name: p, bond: getBond(pitcher.name, p) }))
        .sort((a, b) => a.bond - b.bond);
      const pitchTarget = _evRivals[0]?.name || null;
      if (!pitchTarget) return;

      // Emissary receptiveness: existing bond with pitcher + pitcher's social
      const receptiveness = getBond(emissary, pitcher.name) * 0.10 + pS.social * 0.05 + Math.random() * 0.15;
      const pitchStrength = Math.max(0, Math.min(1, receptiveness));

      const pitchEvent = {
        type: 'emissaryPitch',
        players: [pitcher.name, emissary],
        pitcher: pitcher.name,
        pitchTarget: pitchTarget,
        pitchStrength: pitchStrength,
        text: `${pitcher.name} pulls ${emissary} aside. "${pitchTarget} is the weakest link here. Trust me on this."`,
        consequences: `Pitch influence: ${(pitchStrength * 100).toFixed(0)}% receptiveness.`,
        badgeText: 'PITCH', badgeClass: 'gold'
      };
      ep.emissaryScoutEvents.push(pitchEvent);
      ep.campEvents[_evCampKey].post.push(pitchEvent);

      // Small bond shift: pitcher + emissary get closer from the interaction
      addBond(pitcher.name, emissary, 0.3);
      addBond(emissary, pitcher.name, pitchStrength * 0.4);
    });

    // ── 2. OBSERVATION (emissary reads the tribe) ──
    const _evObsQuality = emS.intuition * 0.07 + emS.mental * 0.025 + Math.random() * 0.10;
    const _evMostIsolated = loseMembers.map(name => {
      const avgBond = loseMembers.filter(p => p !== name).reduce((sum, p) => sum + getBond(name, p), 0) / Math.max(1, loseMembers.length - 1);
      return { name, avgBond };
    }).sort((a, b) => a.avgBond - b.avgBond)[0];

    const obsText = _evObsQuality > 0.5
      ? `${emissary} watches carefully. ${emPr.Sub} notices ${_evMostIsolated?.name || 'tension'} seems isolated — conversations stop when ${pronouns(_evMostIsolated?.name || emissary).sub} walks by.`
      : `${emissary} tries to read the tribe, but it's hard to tell who's really on the outs.`;

    const obsEvent = {
      type: 'emissaryObservation',
      players: [emissary, ...(_evMostIsolated ? [_evMostIsolated.name] : [])],
      text: obsText,
      observationQuality: _evObsQuality,
      isolatedPlayer: _evMostIsolated?.name || null,
      consequences: _evObsQuality > 0.5 ? `${emissary} identified ${_evMostIsolated?.name} as isolated.` : 'Surface-level read only.',
      badgeText: 'EMISSARY', badgeClass: 'blue'
    };
    ep.emissaryScoutEvents.push(obsEvent);
    ep.campEvents[_evCampKey].post.push(obsEvent);

    // ── 3. ALLIANCE OFFER (optional — if emissary has strong existing bond with someone) ──
    const _evAllyCandidate = loseMembers.find(p => getBond(emissary, p) >= 3.0);
    if (_evAllyCandidate && Math.random() < 0.6) {
      const _evAllyBond = getBond(emissary, _evAllyCandidate);
      const _evAllyS = pStats(_evAllyCandidate);
      // Cross-tribe F2 pact
      if (!gs.sideDeals) gs.sideDeals = [];
      const _evGenuine = emS.loyalty * 0.08 + _evAllyBond * 0.05 + Math.random() * 0.15 > 0.5;
      gs.sideDeals.push({
        players: [emissary, _evAllyCandidate],
        initiator: emissary,
        madeEp: (gs.episode || 0) + 1,
        type: 'f2',
        active: true,
        genuine: _evGenuine
      });

      const dealEvent = {
        type: 'emissaryDeal',
        players: [emissary, _evAllyCandidate],
        text: `${emissary} and ${_evAllyCandidate} make a cross-tribe deal. "When we merge, we look out for each other."`,
        consequences: `F2 pact formed (${_evGenuine ? 'genuine' : 'strategic'}).`,
        badgeText: 'CROSS-TRIBE DEAL', badgeClass: 'gold'
      };
      ep.emissaryScoutEvents.push(dealEvent);
      ep.campEvents[_evCampKey].post.push(dealEvent);
      addBond(emissary, _evAllyCandidate, 0.5);
      addBond(_evAllyCandidate, emissary, 0.5);
    }
  }
```

- [ ] **Step 2: Call `generateEmissaryScoutEvents` in `simulateEpisode`**

In `simulateEpisode`, find where camp events are generated for the post phase (search for `generateCampEvents(ep, 'post')`). Add the following BEFORE that call:

```javascript
    // ── Emissary Vote: scouting events at losing tribe camp ──
    if (ep.emissary) generateEmissaryScoutEvents(ep);
```

- [ ] **Step 3: Test scouting events fire**

Schedule emissary-vote on a pre-merge episode. Run it. Check browser console:
```javascript
const lastEp = gs.episodeHistory[gs.episodeHistory.length-1];
console.log('Emissary:', lastEp.emissary);
console.log('Scout events:', lastEp.emissaryScoutEvents);
```
Verify 2-3 scout events exist with types `emissaryPitch`, `emissaryObservation`, and optionally `emissaryDeal`.

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: emissary scouting period (pitches, observation, cross-tribe deal)"
```

---

### Task 4: Emissary Pick Logic (`simulateEmissaryVote`)

**Files:**
- Modify: `simulator.html` — new function `simulateEmissaryVote(ep)`, placed near `simulateVotes` (around line 9360)

- [ ] **Step 1: Add the `simulateEmissaryVote` function**

Place this near `simulateVotes` (before or after it):

```javascript
  // ── EMISSARY VOTE: emissary picks a second elimination after normal tribal ──
  function simulateEmissaryVote(ep) {
    if (!ep.emissary) return null;
    const emissary = ep.emissary.name;
    const emS = pStats(emissary);
    const emPr = pronouns(emissary);
    const emArch = emS.archetype || 'neutral';

    // Pool: remaining tribal players minus the just-eliminated player and immune players
    const pool = (ep.tribalPlayers || []).filter(p =>
      p !== ep.eliminated && gs.activePlayers.includes(p) && p !== ep.immunityWinner && !(ep.extraImmune || []).includes(p)
    );
    if (!pool.length) return null;

    // ── Collect pitch influence from scouting ──
    const pitchInfluence = {};
    (ep.emissaryScoutEvents || []).forEach(evt => {
      if (evt.type === 'emissaryPitch' && evt.pitchTarget) {
        pitchInfluence[evt.pitchTarget] = (pitchInfluence[evt.pitchTarget] || 0) + (evt.pitchStrength || 0.3);
      }
    });

    // ── Archetype weight modifiers ──
    let threatWeight = 0.30, bondWeight = 0.20, heatWeight = 0.15;
    if (['villain', 'schemer', 'mastermind'].includes(emArch)) {
      threatWeight = 0.40; // strategic elimination
    } else if (['hero', 'loyal', 'protector'].includes(emArch)) {
      bondWeight = 0.30; // protects friends
    } else if (['floater', 'follower'].includes(emArch)) {
      heatWeight = 0.25; // follows the crowd
    }

    // ── Score each candidate ──
    const scores = pool.map(target => {
      const tThreat = threatScore(target);
      const tBond = getBond(emissary, target);
      const tHeat = computeHeat(target, pool, ep);
      const tPitch = pitchInfluence[target] || 0;

      const score = tThreat * threatWeight
                  + tPitch * 0.25
                  - tBond * bondWeight
                  + tHeat * heatWeight
                  + Math.random() * 0.10;

      return { name: target, score, threat: tThreat, bond: tBond, heat: tHeat, pitch: tPitch };
    }).sort((a, b) => b.score - a.score);

    const pick = scores[0];
    if (!pick) return null;

    // ── Generate reason text ──
    const pickPr = pronouns(pick.name);
    let reason;
    if (pick.pitch > 0.3) {
      const pitcher = (ep.emissaryScoutEvents || []).find(e => e.type === 'emissaryPitch' && e.pitchTarget === pick.name)?.pitcher;
      reason = pitcher
        ? `${emissary} was swayed by ${pitcher}'s pitch against ${pick.name}.`
        : `${emissary} heard enough to make ${pickPr.obj} mind up about ${pick.name}.`;
    } else if (pick.bond <= -1) {
      reason = `${emissary} and ${pick.name} have history. This is personal.`;
    } else if (pick.threat > 6) {
      reason = `${emissary} points at the biggest threat. "${pick.name}. You're too dangerous to keep around."`;
    } else if (pick.heat > 3) {
      reason = `${emissary} reads the room. "${pick.name}. Your own tribe wanted you gone."`;
    } else {
      reason = `${emissary} makes ${emPr.pos} choice. "${pick.name}."`;
    }

    ep.emissaryPick = { name: pick.name, reason, scores: scores.slice(0, 5) };
    return ep.emissaryPick;
  }
```

- [ ] **Step 2: Wire `simulateEmissaryVote` into the standard tribal flow**

In `simulateEpisode`, find the standard elimination block at ~line 26523 (`} else { ep.eliminated = r1.eliminated; }`). The emissary pick must fire AFTER the normal elimination is fully resolved (RI check, advantage inheritance, etc.) but BEFORE the phase check.

Find the line (around 26670-26692) where the standard RI choice block ends:
```javascript
  } else if (ep.eliminated) {
    if (isRIStillActive()) { ... }
    ...
    handleAdvantageInheritance(ep.eliminated, ep);
    gs.advantages = gs.advantages.filter(a => a.holder !== ep.eliminated);
```

After the advantage cleanup line (`gs.advantages = gs.advantages.filter(a => a.holder !== ep.eliminated);` at ~line 26692), and AFTER the tied destinies block, BEFORE the blame clearing lines (`if (gs._phobiaBlame) delete gs._phobiaBlame;` at ~line 26738), add:

```javascript
    // ── EMISSARY VOTE: second elimination by emissary pick ──
    if (ep.emissary && !ep.eliminationSwap) {
      const _evPick = simulateEmissaryVote(ep);
      if (_evPick) {
        ep.emissaryEliminated = _evPick.name;
        // ── Bond consequences ──
        const _evEmissary = ep.emissary.name;
        const _evPickName = _evPick.name;
        ep.emissaryBondShifts = [];
        const _evLoseMembers = (ep.tribalPlayers || []).filter(p => p !== ep.eliminated && p !== _evPickName && gs.activePlayers.includes(p));

        // Allies of the picked player: grudge (-1.5 scaled by bond)
        _evLoseMembers.forEach(p => {
          const allyBond = getBond(p, _evPickName);
          if (allyBond >= 2.0) {
            const grudge = -(1.5 * allyBond * 0.15);
            addBond(p, _evEmissary, grudge);
            ep.emissaryBondShifts.push({ from: p, to: _evEmissary, delta: grudge, reason: 'ally-grudge' });
          } else {
            // Neutral: general resentment
            addBond(p, _evEmissary, -0.3);
            ep.emissaryBondShifts.push({ from: p, to: _evEmissary, delta: -0.3, reason: 'resentment' });
          }
        });

        // Players who pitched against the picked player or had them as vote target: gratitude
        const _evVotersAgainst = (ep.votingLog || []).filter(l => l.voted === _evPickName).map(l => l.voter);
        const _evPitchersAgainst = (ep.emissaryScoutEvents || []).filter(e => e.type === 'emissaryPitch' && e.pitchTarget === _evPickName).map(e => e.pitcher);
        const _evGrateful = [...new Set([..._evVotersAgainst, ..._evPitchersAgainst])].filter(p => p !== _evPickName && gs.activePlayers.includes(p));
        _evGrateful.forEach(p => {
          addBond(p, _evEmissary, 0.8);
          ep.emissaryBondShifts.push({ from: p, to: _evEmissary, delta: 0.8, reason: 'gratitude' });
        });

        // Emissary's own tribe: strategic tribemates approve high-threat pick, hero/loyal disapprove low-threat
        const _evOwnMembers = (gs.tribes.find(t => t.name === ep.emissary.tribe)?.members || []).filter(p => p !== _evEmissary && gs.activePlayers.includes(p));
        const _evPickThreat = threatScore(_evPickName);
        _evOwnMembers.forEach(p => {
          const pS = pStats(p);
          if (_evPickThreat >= 5 && pS.strategic >= 5) {
            addBond(p, _evEmissary, 0.4);
            ep.emissaryBondShifts.push({ from: p, to: _evEmissary, delta: 0.4, reason: 'good-move' });
          } else if (_evPickThreat < 4 && ['hero', 'loyal', 'protector'].includes(pS.archetype)) {
            addBond(p, _evEmissary, -0.3);
            ep.emissaryBondShifts.push({ from: p, to: _evEmissary, delta: -0.3, reason: 'cruel-pick' });
          }
        });

        // ── Heat: emissary gets +1.5 heat for 2 episodes ──
        if (!gs._emissaryHeat) gs._emissaryHeat = {};
        gs._emissaryHeat[_evEmissary] = { amount: 1.5, expiresEp: ((gs.episode || 0) + 1) + 2 };

        // ── Popularity ──
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[_evEmissary] = (gs.popularity[_evEmissary] || 0) - 2; // villain edit
        gs.popularity[_evPickName] = (gs.popularity[_evPickName] || 0) + 3; // sympathy

        // ── Eliminate the emissary's pick ──
        if (isRIStillActive()) {
          if (cfg.riFormat === 'rescue') {
            gs.riPlayers.push(_evPickName);
            if (!gs.riArrivalEp) gs.riArrivalEp = {};
            gs.riArrivalEp[_evPickName] = (gs.episode || 0) + 1;
          } else {
            const _evRIChoice = simulateRIChoice(_evPickName);
            if (_evRIChoice === 'REDEMPTION ISLAND') gs.riPlayers.push(_evPickName);
            else { gs.eliminated.push(_evPickName); if (gs.isMerged) gs.jury.push(_evPickName); }
          }
        } else {
          gs.eliminated.push(_evPickName);
          if (gs.isMerged) gs.jury.push(_evPickName);
        }
        gs.activePlayers = gs.activePlayers.filter(p => p !== _evPickName);
        gs.tribes = gs.tribes.map(t => ({...t, members: t.members.filter(p => p !== _evPickName)}));
        handleAdvantageInheritance(_evPickName, ep);
        gs.advantages = gs.advantages.filter(a => a.holder !== _evPickName);
      }
    }
```

- [ ] **Step 3: Add emissary heat to `computeHeat`**

In `computeHeat` (around line 4203, after the `_awakeAThonBlame` line), add:

```javascript
  if (gs._emissaryHeat?.[name] && ((gs.episode || 0) + 1) < gs._emissaryHeat[name].expiresEp) heat += gs._emissaryHeat[name].amount;
```

- [ ] **Step 4: Clear emissary heat after tribal**

In the blame-clearing section (around line 26738, where `gs._phobiaBlame` and `gs._cliffDiveBlame` are deleted), add:

```javascript
    // Clear expired emissary heat
    if (gs._emissaryHeat) {
      Object.keys(gs._emissaryHeat).forEach(k => {
        if (((gs.episode || 0) + 1) >= gs._emissaryHeat[k].expiresEp) delete gs._emissaryHeat[k];
      });
      if (!Object.keys(gs._emissaryHeat).length) delete gs._emissaryHeat;
    }
```

- [ ] **Step 5: Test double elimination**

Schedule emissary-vote. Run the episode. Verify:
```javascript
const ep = gs.episodeHistory[gs.episodeHistory.length-1];
console.log('Normal elim:', ep.eliminated);
console.log('Emissary pick:', ep.emissaryPick);
console.log('Emissary elim:', ep.emissaryEliminated);
console.log('Active players reduced by 2:', gs.activePlayers.length);
```
Both `ep.eliminated` and `ep.emissaryEliminated` should be different players.

- [ ] **Step 6: Commit**

```bash
git add simulator.html
git commit -m "feat: emissary pick logic + bond consequences + double elimination"
```

---

### Task 5: Episode History & `patchEpisodeHistory`

**Files:**
- Modify: `simulator.html:26847-26939` (episode history push)
- Modify: `simulator.html:32064-32090` (patchEpisodeHistory)

- [ ] **Step 1: Add emissary fields to the episode history push**

In the standard episode history push (around line 26847, the `gs.episodeHistory.push({` block), add these fields. Find a good spot near the existing twist data (around the `swapResult`, `exileDuelResult` area, ~line 26890-26893):

```javascript
    emissary:           ep.emissary           || null,
    emissaryPick:       ep.emissaryPick       || null,
    emissaryEliminated: ep.emissaryEliminated || null,
    emissaryScoutEvents: ep.emissaryScoutEvents || null,
    emissaryBondShifts: ep.emissaryBondShifts || null,
```

- [ ] **Step 2: Add to `patchEpisodeHistory`**

In `patchEpisodeHistory` (around line 32082, after the `schoolyardExileReturn` line), add:

```javascript
  if (ep.emissary) h.emissary = ep.emissary;
  if (ep.emissaryPick) h.emissaryPick = ep.emissaryPick;
  if (ep.emissaryEliminated) h.emissaryEliminated = ep.emissaryEliminated;
  if (ep.emissaryScoutEvents) h.emissaryScoutEvents = ep.emissaryScoutEvents;
  if (ep.emissaryBondShifts) h.emissaryBondShifts = ep.emissaryBondShifts;
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: emissary vote episode history fields + patchEpisodeHistory"
```

---

### Task 6: Camp Event Badges

**Files:**
- Modify: `simulator.html:40122-40143` (badgeText block in rpBuildCampTribe)

- [ ] **Step 1: Add emissary badge types**

In the `badgeText` ternary chain in `rpBuildCampTribe` (around line 40131, after the `rewardBackfireBloc` entry), add:

```javascript
                     : evt.type === 'emissaryVolunteer'      ? (evt.badgeText || 'EMISSARY')
                     : evt.type === 'emissaryPitch'           ? (evt.badgeText || 'PITCH')
                     : evt.type === 'emissaryObservation'     ? (evt.badgeText || 'EMISSARY')
                     : evt.type === 'emissaryDeal'            ? (evt.badgeText || 'CROSS-TRIBE DEAL')
                     : evt.type === 'emissaryPickEvent'       ? (evt.badgeText || 'EMISSARY PICK')
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: emissary vote camp event badge types"
```

---

### Task 7: VP Screen — `rpBuildEmissaryVote`

**Files:**
- Modify: `simulator.html` — add `rpBuildEmissaryVote(ep)` function near the other `rpBuild*` functions
- Modify: `simulator.html:50547` (buildVPScreens — insert after 'The Votes' screen)

- [ ] **Step 1: Add the VP screen function**

Place near the other `rpBuild*` twist functions (search for `function rpBuildAmbassadors` or `function rpBuildSchoolyardPick` and add nearby):

```javascript
  function rpBuildEmissaryVote(ep) {
    if (!ep.emissary || !ep.emissaryPick) return '';
    const emissary = ep.emissary.name;
    const emS = pStats(emissary);
    const emPr = pronouns(emissary);
    const pick = ep.emissaryPick;
    const scoutEvents = ep.emissaryScoutEvents || [];
    const bondShifts = ep.emissaryBondShifts || [];
    const snap = ep.gsSnapshot || gs;

    let html = '<div class="rp-section">';
    html += '<h2 class="rp-section-title">🕵️ The Emissary Vote</h2>';

    // ── Phase 1: Emissary Selection ──
    html += '<div class="rp-card">';
    html += '<h3>Emissary Selection</h3>';
    html += `<div class="rp-flex-row" style="align-items:center;gap:12px;margin:8px 0;">`;
    html += rpPortrait(emissary, snap);
    html += `<div><strong>${emissary}</strong> from <em>${ep.emissary.tribe}</em> volunteers to visit <em>${ep.emissary.targetTribe}</em>'s tribal council.</div>`;
    html += '</div>';
    // Find the volunteer camp event for the quote
    const volEvent = (ep.campEvents?.[ep.emissary.tribe]?.post || []).find(e => e.type === 'emissaryVolunteer');
    if (volEvent?.text) html += `<div class="rp-quote" style="margin:8px 0;font-style:italic;">"${volEvent.text.replace(/^[^"]*"/, '').replace(/"[^"]*$/, '')}"</div>`;
    html += '</div>';

    // ── Phase 2: Scouting Period (click-to-reveal) ──
    if (scoutEvents.length) {
      const _tvKey = 'emissaryScout';
      if (!_tvState[_tvKey]) _tvState[_tvKey] = { idx: 0, total: scoutEvents.length };
      html += '<div class="rp-card">';
      html += '<h3>Scouting Period</h3>';
      html += `<p style="opacity:0.7;">${emissary} arrives at ${ep.emissary.targetTribe}'s camp...</p>`;
      scoutEvents.forEach((evt, i) => {
        const isRevealed = i < _tvState[_tvKey].idx;
        const revealStyle = isRevealed ? '' : 'display:none;';
        const badgeColor = evt.type === 'emissaryPitch' ? 'gold' : evt.type === 'emissaryDeal' ? 'gold' : 'blue';
        html += `<div class="rp-reveal-card" id="emissaryScout-${i}" style="${revealStyle}margin:8px 0;padding:10px;border-left:3px solid var(--accent-${badgeColor},#888);">`;
        html += `<span class="rp-badge rp-badge-${evt.badgeClass || badgeColor}">${evt.badgeText || evt.type}</span> `;
        // Portraits
        if (evt.players?.length) {
          html += '<div class="rp-flex-row" style="gap:8px;margin:6px 0;">';
          evt.players.forEach(p => { html += rpPortrait(p, snap); });
          html += '</div>';
        }
        html += `<div>${evt.text}</div>`;
        if (evt.consequences) html += `<div style="opacity:0.6;font-size:0.85em;margin-top:4px;">${evt.consequences}</div>`;
        html += '</div>';
      });
      html += '</div>';
      // Reveal buttons
      html += `<div class="rp-reveal-buttons" style="position:sticky;bottom:0;padding:8px;text-align:center;background:var(--bg,#1a1a2e);">`;
      html += `<button class="rp-btn" onclick="(function(){const s=document.querySelector('.rp-main');const st=s?s.scrollTop:0;tvRevealNext('emissaryScout');if(s)requestAnimationFrame(()=>s.scrollTop=st)})()">NEXT</button> `;
      html += `<button class="rp-btn" onclick="(function(){const s=document.querySelector('.rp-main');const st=s?s.scrollTop:0;tvRevealAll('emissaryScout');if(s)requestAnimationFrame(()=>s.scrollTop=st)})()">REVEAL ALL</button>`;
      html += '</div>';
    }

    // ── Phase 3: The Pick ──
    html += '<div class="rp-card" style="margin-top:16px;">';
    html += '<h3>🎯 The Emissary\'s Choice</h3>';
    html += `<div class="rp-flex-row" style="align-items:center;gap:12px;margin:12px 0;">`;
    html += rpPortrait(emissary, snap);
    html += `<div style="font-size:1.3em;">→</div>`;
    html += rpPortrait(pick.name, snap);
    html += '</div>';
    html += `<div style="font-size:1.1em;margin:8px 0;"><strong>${pick.name}</strong> is eliminated by the emissary.</div>`;
    html += `<div style="font-style:italic;opacity:0.8;">${pick.reason}</div>`;

    // Bond consequence summary
    if (bondShifts.length) {
      html += '<div style="margin-top:12px;"><strong>Fallout:</strong></div>';
      html += '<div style="font-size:0.85em;opacity:0.8;">';
      const grudges = bondShifts.filter(s => s.reason === 'ally-grudge');
      const grateful = bondShifts.filter(s => s.reason === 'gratitude');
      if (grudges.length) html += `<div>😤 ${grudges.map(s => s.from).join(', ')} hold a grudge against ${emissary}</div>`;
      if (grateful.length) html += `<div>🤝 ${grateful.map(s => s.from).join(', ')} ${grateful.length === 1 ? 'is' : 'are'} grateful</div>`;
      html += '</div>';
    }
    html += '</div>';

    html += '</div>';
    return html;
  }
```

- [ ] **Step 2: Register in `buildVPScreens`**

After line 50547 (the `vpScreens.push({ id:'votes', ...})` line), add:

```javascript
    // ── Emissary Vote screen (after normal tribal vote) ──
    if (ep.emissaryPick) {
      const _evHtml = rpBuildEmissaryVote(ep);
      if (_evHtml) vpScreens.push({ id:'emissary-vote', label:'Emissary Vote', html: _evHtml });
    }
```

- [ ] **Step 3: Test VP rendering**

Schedule emissary-vote on a pre-merge episode. Run it. Open the VP viewer and navigate to the episode. Verify:
- "Emissary Vote" tab appears after "The Votes"
- Emissary selection card shows the volunteer with portrait
- Scouting period has click-to-reveal cards with NEXT/REVEAL ALL buttons
- The Pick section shows emissary → target with portraits and reason text
- Bond fallout summary renders

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: emissary vote VP screen (3-phase click-to-reveal)"
```

---

### Task 8: Text Backlog

**Files:**
- Modify: `simulator.html:28664-28690` (inside `_textTwists`)

- [ ] **Step 1: Add emissary-vote text output**

In `_textTwists`, after the ambassadors text handling or near the end of the twist type chain (around line 28690), add:

```javascript
    } else if (tw.type === 'emissary-vote') {
      ln('EMISSARY VOTE — winning tribe sends an emissary to losing tribe\'s tribal.');
      if (ep.emissary) {
        ln(`${ep.emissary.name} (${ep.emissary.tribe}) volunteers to visit ${ep.emissary.targetTribe}'s tribal council.`);
      }
      if (ep.emissaryScoutEvents?.length) {
        ln('  Scouting:');
        ep.emissaryScoutEvents.forEach(evt => {
          if (evt.type === 'emissaryPitch') ln(`    PITCH: ${evt.pitcher} lobbies against ${evt.pitchTarget} (${(evt.pitchStrength * 100).toFixed(0)}% receptiveness)`);
          else if (evt.type === 'emissaryObservation') ln(`    OBSERVATION: ${evt.text}`);
          else if (evt.type === 'emissaryDeal') ln(`    DEAL: ${evt.players.join(' & ')} — cross-tribe F2 pact`);
        });
      }
      if (ep.emissaryPick) {
        ln(`  EMISSARY PICK: ${ep.emissaryPick.name} — ${ep.emissaryPick.reason}`);
      }
      if (ep.emissaryBondShifts?.length) {
        const grudges = ep.emissaryBondShifts.filter(s => s.reason === 'ally-grudge');
        const grateful = ep.emissaryBondShifts.filter(s => s.reason === 'gratitude');
        if (grudges.length) ln(`  Grudges: ${grudges.map(s => s.from).join(', ')}`);
        if (grateful.length) ln(`  Grateful: ${grateful.map(s => s.from).join(', ')}`);
      }
```

- [ ] **Step 2: Also add emissary summary to the elimination text**

In the text backlog section that reports eliminations (search for `_textTribalCouncil` or the elimination reporting section), ensure `ep.emissaryEliminated` is reported. If there's a line like `ln('ELIMINATED: ' + ep.eliminated)`, add after it:

```javascript
      if (ep.emissaryEliminated) ln(`EMISSARY ELIMINATED: ${ep.emissaryEliminated}`);
```

- [ ] **Step 3: Test text backlog**

Run an emissary-vote episode. Toggle the text backlog viewer. Verify the emissary section appears with:
- Emissary volunteer line
- Scouting events (pitches with receptiveness %, observations, deals)
- Emissary pick with reason
- Bond fallout

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: emissary vote text backlog"
```

---

### Task 9: Cold Open Recap Integration

**Files:**
- Modify: `simulator.html` — `rpBuildColdOpen(ep)` function

- [ ] **Step 1: Add emissary vote recap card**

In `rpBuildColdOpen`, find where other twist recaps are generated (search for `cliffDive` or `awakeAThon` recap cards in the cold open function). Add a similar block:

```javascript
    // ── Emissary Vote recap ──
    if (prev.emissaryPick) {
      threads.push({
        priority: 8,
        html: `<div class="rp-card"><span class="rp-badge rp-badge-gold">EMISSARY VOTE</span> ${prev.emissary?.name} eliminated ${prev.emissaryPick.name} — ${prev.emissaryPick.reason}</div>`
      });
    }
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: emissary vote cold open recap card"
```

---

### Task 10: CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add emissary vote documentation**

In the relevant sections of CLAUDE.md, add documentation. Under the advantage/twist system section, or create a section near the challenge system documentation:

Under **Key Engine Functions**, add:
```
- `simulateEmissaryVote(ep)` — emissary picks second elimination after normal tribal (pre-merge only)
- `generateEmissaryScoutEvents(ep)` — scouting period: pitches, observation, cross-tribe deal
```

Under **Core State**, add:
```
- `gs._emissaryHeat` — temporary heat for emissary (+1.5 for 2 episodes)
```

Add a new section:
```
## Emissary Vote
- Schedulable pre-merge twist (`emissary-vote` in TWIST_CATALOG, category `elim`)
- Winning tribe sends emissary (boldness+strategic+social scored volunteer) to losing tribe's tribal
- Scouting: 1-2 pitches (losing tribe lobbies emissary), observation (intuition read), optional cross-tribe F2 deal
- After normal vote eliminates someone, emissary picks a second player to eliminate
- Pick scoring: `threatScore * 0.30 + pitchInfluence * 0.25 - bond * 0.20 + heat * 0.15 + random * 0.10`
- Archetype modifiers: villain/schemer → threat 0.40, hero/loyal → bond 0.30, floater → heat 0.25
- No idol protection against the emissary pick — it's absolute
- Bond consequences: allies of picked player grudge emissary (-1.5 scaled), voters against picked player grateful (+0.8), neutral resentment (-0.3)
- Emissary's own tribe: strategic approve high-threat pick (+0.4), hero/loyal disapprove low-threat (-0.3)
- Heat: emissary +1.5 for 2 episodes. Popularity: emissary -2 like, picked player +3 underdog.
- VP: `rpBuildEmissaryVote(ep)` — 3-phase (selection, scouting click-to-reveal, the pick)
- Incompatible with: ambassadors, double-tribal, multi-tribal, kidnapping
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add Emissary Vote to CLAUDE.md"
```
