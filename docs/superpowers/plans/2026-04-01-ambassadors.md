# Ambassadors Twist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Koh-Lanta Ambassadors twist — tribes select ambassadors who meet to negotiate an elimination before the merge. 15 personality-driven negotiation pairings with resistance checks. 3+ tribe support with coalition mechanics.

**Architecture:** Single-file changes in `simulator.html`. New TWIST_CATALOG entry + `applyTwist` handler for `'ambassadors'` engine type. The twist fires before merge check, eliminates a player, then merge proceeds with one fewer player. 4 VP screens: Selection, Meeting, Return, Elimination.

**Tech Stack:** Vanilla JS, inline CSS, existing twist/VP patterns.

**Spec:** `docs/superpowers/specs/2026-04-01-ambassadors-design.md`

---

### Task 1: Add TWIST_CATALOG entry + basic applyTwist handler

**Files:**
- Modify: `simulator.html` — TWIST_CATALOG array (~line 1446) + applyTwist function

- [ ] **Step 1: Add catalog entry**

Find `const TWIST_CATALOG = [` and add the ambassadors entry. Place it near other pre-merge twists:

```js
  { id:'ambassadors',     emoji:'🤝', name:'Ambassadors',          category:'elim',       phase:'pre-merge', desc:'Each tribe names an ambassador. They meet and must agree on one elimination — or one ambassador draws the wrong rock.',  engineType:'ambassadors' },
```

- [ ] **Step 2: Add the applyTwist handler**

Find the `applyTwist` function. Search for `} else if (engineType === 'reward-challenge')` and add the ambassadors handler BEFORE it:

```js
  } else if (engineType === 'ambassadors') {
    // Requires 2+ tribes with 2+ members each
    const _ambTribes = gs.tribes.filter(t => t.members.filter(m => gs.activePlayers.includes(m)).length >= 2);
    if (_ambTribes.length < 2 || gs.isMerged) { twistObj.blocked = true; twistObj.blockedReason = 'need 2+ tribes'; return; }

    // ── 1. AMBASSADOR SELECTION ──
    const _ambSelections = _ambTribes.map(tribe => {
      const members = tribe.members.filter(m => gs.activePlayers.includes(m));
      const scored = members.map(name => {
        const s = pStats(name);
        const avgBond = members.filter(m => m !== name).reduce((sum, m) => sum + getBond(name, m), 0) / Math.max(1, members.length - 1);
        return { name, score: s.social * 0.3 + s.strategic * 0.3 + avgBond * 0.4 + Math.random() * 1.0 };
      }).sort((a, b) => b.score - a.score);
      return { tribe: tribe.name, ambassador: scored[0].name, runnerUp: scored[1]?.name || null, score: scored[0].score, members };
    });
    twistObj.ambassadorSelections = _ambSelections;

    // ── 2. DETERMINE NEGOTIATION ARCHETYPES ──
    const _ambGetType = (name) => {
      const s = pStats(name);
      const arch = players.find(p => p.name === name)?.archetype || '';
      if ((arch === 'schemer' || arch === 'mastermind') && s.strategic >= 7) return 'manipulator';
      if (s.strategic >= 8 && s.loyalty <= 4) return 'manipulator';
      if (arch === 'villain' || (s.boldness >= 8 && s.loyalty <= 3)) return 'villain';
      if (s.strategic >= 6 && s.social >= 5) return 'dealmaker';
      if (s.loyalty >= 7 && s.social >= 5) return 'loyal-shield';
      return 'emotional';
    };
    const _ambassadors = _ambSelections.map(sel => ({
      name: sel.ambassador, tribe: sel.tribe, type: _ambGetType(sel.ambassador),
      stats: pStats(sel.ambassador), pr: pronouns(sel.ambassador),
    }));
    twistObj.ambassadorTypes = _ambassadors.map(a => ({ name: a.name, type: a.type }));

    // ── 3. NEGOTIATION ──
    const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];

    if (_ambassadors.length === 2) {
      // 2-TRIBE NEGOTIATION
      const [amb1, amb2] = _ambassadors;
      const ambBond = getBond(amb1.name, amb2.name);

      // Determine agreement based on archetype pairing
      let agreed = false, target = null, targetReason = '', rockDrawLoser = null;
      const narrative = [];

      // ── Agreement formula (proportional, archetype-influenced) ──
      // Base agreement chance from personality blend
      let agreeBase = 0.3 + ambBond * 0.06;
      // Archetype modifiers
      const types = [amb1.type, amb2.type].sort();
      const typeKey = types.join('-');
      // Boost/penalty by pairing
      if (typeKey === 'dealmaker-dealmaker') agreeBase += 0.4;
      else if (typeKey === 'emotional-emotional') agreeBase += 0.25 + ambBond * 0.06;
      else if (typeKey === 'dealmaker-emotional') agreeBase += 0.15;
      else if (typeKey === 'dealmaker-manipulator') agreeBase += 0.2;
      else if (typeKey === 'manipulator-manipulator') agreeBase += 0.25;
      else if (typeKey === 'emotional-loyal-shield') agreeBase += 0.05;
      else if (typeKey === 'dealmaker-loyal-shield') agreeBase -= 0.05;
      else if (typeKey === 'loyal-shield-loyal-shield') agreeBase -= 0.15;
      else if (typeKey === 'loyal-shield-villain') agreeBase -= 0.2;
      else if (typeKey === 'villain-villain') agreeBase -= 0.25;
      // Shared enemy bonus
      const _allPlayers = gs.activePlayers.filter(p => p !== amb1.name && p !== amb2.name);
      const _sharedEnemy = _allPlayers.find(p => getBond(amb1.name, p) <= -1 && getBond(amb2.name, p) <= -1);
      if (_sharedEnemy) agreeBase += 0.2;

      // ── Resistance check for domination pairings ──
      let dominatorIdx = -1, defenderIdx = -1, resistFired = false;
      if (amb1.type === 'manipulator' && amb2.type !== 'manipulator') { dominatorIdx = 0; defenderIdx = 1; }
      else if (amb2.type === 'manipulator' && amb1.type !== 'manipulator') { dominatorIdx = 1; defenderIdx = 0; }
      else if (amb1.type === 'villain' && amb2.type !== 'villain') { dominatorIdx = 0; defenderIdx = 1; }
      else if (amb2.type === 'villain' && amb1.type !== 'villain') { dominatorIdx = 1; defenderIdx = 0; }
      if (dominatorIdx >= 0) {
        const def = _ambassadors[defenderIdx];
        const resistChance = def.stats.boldness * 0.06 + def.stats.temperament * 0.04 + (10 - _ambassadors[dominatorIdx].stats.social) * 0.02;
        resistFired = Math.random() < resistChance;
        if (resistFired) {
          agreeBase -= 0.15; // resistance makes agreement harder
          narrative.push(`${def.name} pushed back. The dynamic shifted — what looked like a one-sided conversation became a standoff.`);
        }
      }

      agreed = Math.random() < Math.max(0.05, Math.min(0.95, agreeBase));

      if (agreed) {
        // Target selection
        if (_sharedEnemy) {
          target = _sharedEnemy;
          targetReason = 'shared enemy — both ambassadors wanted this person gone';
        } else {
          // Highest threat that neither ambassador is close to
          const _candidates = _allPlayers
            .filter(p => getBond(amb1.name, p) < 3 && getBond(amb2.name, p) < 3)
            .sort((a, b) => threatScore(b) - threatScore(a));
          target = _candidates[0] || _allPlayers[0];
          targetReason = `highest threat — ${target} was too dangerous to bring into the merge`;
        }
        // Manipulator override: if one is a manipulator and didn't get resisted, they pick the target
        if (!resistFired && dominatorIdx >= 0 && _ambassadors[dominatorIdx].type === 'manipulator') {
          const manip = _ambassadors[dominatorIdx];
          const _manipTarget = _allPlayers.sort((a, b) => getBond(manip.name, a) - getBond(manip.name, b))[0];
          if (_manipTarget) {
            target = _manipTarget;
            targetReason = `${manip.name}'s choice — steered the conversation to serve ${manip.pr.pos} agenda`;
          }
        }
        // Villain override: if villain, target is personal grudge
        if (!resistFired && dominatorIdx >= 0 && _ambassadors[dominatorIdx].type === 'villain') {
          const vill = _ambassadors[dominatorIdx];
          const _villTarget = _allPlayers.sort((a, b) => getBond(vill.name, a) - getBond(vill.name, b))[0];
          if (_villTarget && getBond(vill.name, _villTarget) < 0) {
            target = _villTarget;
            targetReason = `${vill.name}'s grudge — personal score settled through the meeting`;
          }
        }
      }

      if (!agreed) {
        // Rock draw between the two ambassadors
        rockDrawLoser = Math.random() < 0.5 ? amb1.name : amb2.name;
        target = null;
      }

      // ── 4. GENERATE NARRATIVE ──
      // Beat 1: Arrival
      narrative.unshift(_pick([
        `${amb1.name} and ${amb2.name} meet at the neutral ground. The torches are lit. The host is watching. This conversation decides someone's fate.`,
        `Two ambassadors. One decision. ${amb1.name} sits down first. ${amb2.name} follows. Neither speaks for a moment — both measuring the other.`,
      ], amb1.name + amb2.name + 'arrival'));

      // Beat 2: The negotiation (archetype-driven)
      if (agreed) {
        narrative.push(_pick([
          `The conversation lasted longer than expected. But a name emerged. ${target}. Both ambassadors know what this means — someone's game ends without a vote.`,
          `It wasn't easy. But ${amb1.name} and ${amb2.name} found common ground. The name is ${target}. The deal is done.`,
          `After everything — the arguments, the silence, the weighing of names — they agreed. ${target} never gets to merge.`,
        ], amb1.name + amb2.name + 'agreed'));
      } else {
        narrative.push(_pick([
          `The conversation broke down. Neither would budge. ${amb1.name} and ${amb2.name} stare at each other across the fire. The host reaches for the bag of rocks.`,
          `No agreement. The ambassadors tried — but the gap was too wide. Now one of them goes home. The bag comes out. Two rocks. One is the wrong color.`,
        ], amb1.name + amb2.name + 'disagreed'));
        // Rock draw narrative
        const _rlPr = pronouns(rockDrawLoser);
        const _rsSurvivor = rockDrawLoser === amb1.name ? amb2.name : amb1.name;
        narrative.push(`${rockDrawLoser} reaches into the bag. Pulls out a rock. ${_rlPr.Sub} ${_rlPr.sub==='they'?'look':'looks'} down. The wrong color. ${_rsSurvivor} exhales. ${rockDrawLoser}'s game is over.`);
      }

      // ── 5. APPLY ELIMINATION ──
      const eliminated = agreed ? target : rockDrawLoser;
      const eliminatedByRocks = !agreed;

      // Bond consequences
      if (agreed && !eliminatedByRocks) {
        // Ambassador who agreed to sacrifice their tribe's member
        const _elimTribe = _ambSelections.find(s => s.members.includes(eliminated));
        const _elimAmbassador = _elimTribe ? _ambassadors.find(a => a.tribe === _elimTribe.tribe) : null;
        if (_elimAmbassador) {
          // Target's close allies resent the ambassador
          _elimTribe.members.filter(m => m !== eliminated && m !== _elimAmbassador.name).forEach(m => {
            const bWithElim = getBond(m, eliminated);
            if (bWithElim >= 2) addBond(m, _elimAmbassador.name, -1.0);
            else addBond(m, _elimAmbassador.name, -0.3);
          });
        }
        // Successful ambassador's tribe respects them
        const _safeAmbassador = _ambassadors.find(a => a.tribe !== _elimTribe?.tribe);
        if (_safeAmbassador) {
          const _safeTribe = _ambSelections.find(s => s.tribe === _safeAmbassador.tribe);
          if (_safeTribe) _safeTribe.members.filter(m => m !== _safeAmbassador.name).forEach(m => addBond(m, _safeAmbassador.name, 0.3));
        }
      }
      if (eliminatedByRocks) {
        // Tribe of eliminated ambassador bands together
        const _elimTribe = _ambSelections.find(s => s.ambassador === eliminated);
        if (_elimTribe) {
          _elimTribe.members.filter(m => m !== eliminated).forEach(m1 => {
            _elimTribe.members.filter(m2 => m2 !== eliminated && m2 !== m1).forEach(m2 => addBond(m1, m2, 0.5));
          });
        }
        // Surviving ambassador: guilt
        const _survivor = _ambassadors.find(a => a.name !== eliminated);
        if (_survivor) addBond(_survivor.name, eliminated, -1.0);
      }

      // Remove eliminated player
      handleAdvantageInheritance(eliminated, ep);
      gs.activePlayers = gs.activePlayers.filter(p => p !== eliminated);
      gs.eliminated.push(eliminated);
      // Find their tribe and remove
      gs.tribes.forEach(t => { t.members = t.members.filter(m => m !== eliminated); });

      // ── 6. RETURN EVENTS (stored for VP) ──
      const _returnEvents = [];
      _ambSelections.forEach(sel => {
        const amb = _ambassadors.find(a => a.tribe === sel.tribe);
        if (!amb) return;
        if (eliminatedByRocks && eliminated === amb.name) {
          // This ambassador was eliminated
          _returnEvents.push({ tribe: sel.tribe, type: 'ambassador-eliminated',
            text: _pick([
              `${amb.name} doesn't come back. The news reaches ${sel.tribe} camp like a weight dropping. ${amb.pr.Sub} drew the wrong rock. The tribe stares at ${amb.pr.pos} empty spot in the shelter.`,
              `When ${sel.tribe} learns what happened, nobody speaks. ${amb.name} went to protect them — and became the casualty. The torch stays unlit.`,
            ], amb.name + 'rockLoss'),
          });
        } else if (agreed && sel.members.includes(eliminated)) {
          // This tribe lost a member — the ambassador sold them out (or was forced to)
          const _targetPr = pronouns(eliminated);
          const _targetS = pStats(eliminated);
          let _reactionText;
          if (_targetS.temperament <= 4 || _targetS.boldness >= 7) {
            _reactionText = `${eliminated} stares at ${amb.name}. "You had ONE job. Protect us. And you gave ME up?" The camp goes dead silent. ${amb.name} has nothing.`;
          } else if (_targetS.loyalty >= 7) {
            _reactionText = `${eliminated} doesn't yell. ${_targetPr.Sub} just ${_targetPr.sub==='they'?'look':'looks'} at ${amb.name} and ${_targetPr.sub==='they'?'say':'says'}: "I trusted you." It's the last thing ${_targetPr.sub} ${_targetPr.sub==='they'?'say':'says'} before walking away.`;
          } else if (_targetS.strategic >= 7) {
            _reactionText = `${eliminated} nods slowly. "Smart move. I would've done the same thing." ${_targetPr.Sub} ${_targetPr.sub==='they'?'pause':'pauses'}. "No I wouldn't. I would have fought harder for my people."`;
          } else {
            _reactionText = `${eliminated}'s face crumbles. ${_targetPr.Sub} ${_targetPr.sub==='they'?'don\'t':'doesn\'t'} understand. ${_targetPr.Sub} did everything right at camp. And someone ${_targetPr.sub} never got to face decided ${_targetPr.pos} fate.`;
          }
          // Bond damage: target → ambassador
          const _betrayalDamage = _targetS.temperament <= 4 ? -3.0 : _targetS.loyalty >= 7 ? -2.5 : _targetS.strategic >= 7 ? -1.5 : -2.0;
          addBond(eliminated, amb.name, _betrayalDamage);
          _returnEvents.push({ tribe: sel.tribe, type: 'tribemate-eliminated', eliminated, ambassador: amb.name, text: _reactionText, betrayalDamage: _betrayalDamage });
        } else {
          // This tribe is safe
          _returnEvents.push({ tribe: sel.tribe, type: 'safe',
            text: _pick([
              `${amb.name} walks back into camp. The tribe reads ${amb.pr.pos} face. "We're safe," ${amb.pr.sub} ${amb.pr.sub==='they'?'say':'says'}. The relief is instant.`,
              `${amb.name} returns. One look and the tribe knows — they made it through. ${amb.pr.Sub} protected them. That means something now.`,
            ], amb.name + 'safe'),
          });
        }
      });

      twistObj.ambassadorMeeting = {
        ambassadors: _ambassadors.map(a => a.name),
        types: _ambassadors.map(a => ({ name: a.name, type: a.type })),
        agreed, target, targetReason, rockDrawLoser, narrative,
        eliminatedByRocks, eliminated, resistFired,
        returnEvents: _returnEvents,
      };
      twistObj.ambassadorEliminated = eliminated;
      ep.ambassadorData = twistObj;

    } else {
      // 3+ TRIBE NEGOTIATION — coalition mechanics
      const _ambNames = _ambassadors.map(a => a.name);

      // Coalition formation: each pair scored
      const _coalitionScores = [];
      for (let i = 0; i < _ambassadors.length; i++) {
        for (let j = i + 1; j < _ambassadors.length; j++) {
          const a = _ambassadors[i], b = _ambassadors[j];
          const bond = getBond(a.name, b.name);
          const sharedEnemy = _allPlayers.find(p => getBond(a.name, p) <= -1 && getBond(b.name, p) <= -1);
          const score = bond * 0.3 + (sharedEnemy ? 0.3 : 0) + (a.stats.strategic + b.stats.strategic) * 0.02 + Math.random() * 0.2;
          _coalitionScores.push({ pair: [a.name, b.name], score, sharedEnemy });
        }
      }
      _coalitionScores.sort((a, b) => b.score - a.score);
      const _coalition = _coalitionScores[0].pair;
      const _oddOneOut = _ambNames.find(n => !_coalition.includes(n));

      // Odd one out can counter-offer
      const _oddS = pStats(_oddOneOut);
      const _counterChance = _oddS.social * 0.06 + _oddS.strategic * 0.04;
      const _counterSucceeds = Math.random() < _counterChance;

      let agreed = false, target = null, targetReason = '', rockDrawLoser = null, eliminated = null;
      const narrative = [];

      narrative.push(`Three ambassadors. ${_coalition.join(' and ')} find common ground quickly. ${_oddOneOut} is on the outside looking in.`);

      if (_counterSucceeds) {
        // Odd one out breaks the coalition
        const _newPartner = _coalition[Math.random() < 0.5 ? 0 : 1];
        const _newOdd = _coalition.find(n => n !== _newPartner);
        narrative.push(`${_oddOneOut} makes a move — pulls ${_newPartner} aside and pitches a new deal. The coalition shatters. ${_newOdd} is suddenly the odd one out.`);
        // New coalition targets someone from the new odd-one-out's tribe
        const _oddTribe = _ambSelections.find(s => s.ambassador === _newOdd);
        const _candidates = (_oddTribe?.members || []).filter(m => m !== _newOdd && getBond(_oddOneOut, m) < 3 && getBond(_newPartner, m) < 3);
        target = _candidates.sort((a, b) => threatScore(b) - threatScore(a))[0] || _oddTribe?.members.find(m => m !== _newOdd);
        agreed = !!target;
        targetReason = `${_oddOneOut}'s counter-offer succeeded — new coalition targeted ${_newOdd}'s tribe`;
      } else {
        // Coalition holds — target from odd one out's tribe
        narrative.push(`${_oddOneOut} tries to counter but ${_coalition.join(' and ')} aren't budging. The majority has spoken.`);
        const _oddTribe = _ambSelections.find(s => s.ambassador === _oddOneOut);
        const _candidates = (_oddTribe?.members || []).filter(m => m !== _oddOneOut && getBond(_coalition[0], m) < 3);
        target = _candidates.sort((a, b) => threatScore(b) - threatScore(a))[0] || _oddTribe?.members.find(m => m !== _oddOneOut);

        // Odd one out can accept or refuse
        const _acceptChance = 0.3 + _oddS.strategic * 0.04 + getBond(_oddOneOut, _coalition[0]) * 0.05;
        if (target && Math.random() < _acceptChance) {
          agreed = true;
          targetReason = `coalition decision — ${_oddOneOut} accepted the majority's choice`;
          narrative.push(`${_oddOneOut} accepts. It's not a choice — it's survival. ${target} never merges.`);
        } else {
          agreed = false;
          narrative.push(`${_oddOneOut} refuses. "I won't hand you one of my people." The rocks come out.`);
          // Rock draw among all 3
          rockDrawLoser = _ambNames[Math.floor(Math.random() * _ambNames.length)];
          narrative.push(`Three rocks. One wrong color. ${rockDrawLoser} draws it. Gone.`);
        }
      }

      eliminated = agreed ? target : rockDrawLoser;
      const eliminatedByRocks = !agreed;

      // Bond consequences (same pattern as 2-tribe)
      if (eliminatedByRocks) {
        const _elimTribe = _ambSelections.find(s => s.ambassador === eliminated);
        if (_elimTribe) _elimTribe.members.filter(m => m !== eliminated).forEach(m1 => {
          _elimTribe.members.filter(m2 => m2 !== eliminated && m2 !== m1).forEach(m2 => addBond(m1, m2, 0.5));
        });
      } else {
        const _elimTribe = _ambSelections.find(s => s.members.includes(eliminated));
        const _elimAmb = _elimTribe ? _ambassadors.find(a => a.tribe === _elimTribe.tribe) : null;
        if (_elimAmb) {
          _elimTribe.members.filter(m => m !== eliminated && m !== _elimAmb.name).forEach(m => {
            addBond(m, _elimAmb.name, getBond(m, eliminated) >= 2 ? -1.0 : -0.3);
          });
        }
      }

      // Remove eliminated
      handleAdvantageInheritance(eliminated, ep);
      gs.activePlayers = gs.activePlayers.filter(p => p !== eliminated);
      gs.eliminated.push(eliminated);
      gs.tribes.forEach(t => { t.members = t.members.filter(m => m !== eliminated); });

      // Return events (simplified for 3+ tribes)
      const _returnEvents = _ambSelections.map(sel => {
        const amb = _ambassadors.find(a => a.tribe === sel.tribe);
        if (eliminatedByRocks && eliminated === amb?.name) return { tribe: sel.tribe, type: 'ambassador-eliminated', text: `${amb.name} drew the wrong rock. ${sel.tribe} lost their ambassador.` };
        if (sel.members.includes(eliminated)) return { tribe: sel.tribe, type: 'tribemate-eliminated', eliminated, ambassador: amb?.name, text: `${amb?.name || 'The ambassador'} returns with bad news. ${eliminated} was the price of the negotiation.` };
        return { tribe: sel.tribe, type: 'safe', text: `${amb?.name || 'The ambassador'} returns. ${sel.tribe} is safe.` };
      });

      twistObj.ambassadorMeeting = {
        ambassadors: _ambNames, types: _ambassadors.map(a => ({ name: a.name, type: a.type })),
        agreed, target, targetReason, rockDrawLoser, narrative, eliminatedByRocks, eliminated,
        coalition: _coalition, oddOneOut: _oddOneOut, counterSucceeded: _counterSucceeds,
        returnEvents: _returnEvents,
      };
      twistObj.ambassadorEliminated = eliminated;
      ep.ambassadorData = twistObj;
    }

  } else if (engineType === 'reward-challenge') {
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: ambassadors twist — catalog entry + full engine logic"
```

---

### Task 2: VP Screens — Selection, Meeting, Return, Elimination

**Files:**
- Modify: `simulator.html` — add `rpBuildAmbassadors(ep)` function + wire into VP flow

- [ ] **Step 1: Add the VP function**

Find `function rpBuildMergeAnnouncement(ep)` and insert `rpBuildAmbassadors` BEFORE it:

```js
function rpBuildAmbassadors(ep) {
  const data = ep.ambassadorData;
  if (!data?.ambassadorMeeting) return null;
  const meeting = data.ambassadorMeeting;
  const selections = data.ambassadorSelections || [];
  const epNum = ep.num || 0;

  let html = `<div class="rp-page" style="background:linear-gradient(180deg,rgba(99,102,241,0.06) 0%,transparent 40%)">
    <div class="rp-eyebrow">Episode ${epNum}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;margin-bottom:4px;color:#818cf8;text-shadow:0 0 20px rgba(99,102,241,0.2)">THE AMBASSADORS</div>
    <div style="width:60px;height:2px;background:#818cf8;margin:8px auto 20px"></div>`;

  // ── SELECTION ──
  html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#8b949e;margin-bottom:10px">TRIBAL SELECTIONS</div>`;
  html += `<div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap">`;
  selections.forEach(sel => {
    const tc = tribeColor(sel.tribe);
    const typeObj = meeting.types?.find(t => t.name === sel.ambassador);
    const typeLabel = typeObj?.type === 'manipulator' ? 'The Manipulator' : typeObj?.type === 'villain' ? 'The Villain' : typeObj?.type === 'dealmaker' ? 'The Dealmaker' : typeObj?.type === 'loyal-shield' ? 'The Loyal Shield' : 'The Emotional Pitch';
    html += `<div style="flex:1;min-width:140px;padding:12px;border:1px solid ${tc};border-radius:10px;background:rgba(0,0,0,0.2)">
      <div style="font-size:10px;font-weight:700;color:${tc};letter-spacing:1px;margin-bottom:8px">${sel.tribe.toUpperCase()}</div>
      <div style="text-align:center">
        ${rpPortrait(sel.ambassador, 'lg')}
        <div style="font-size:14px;font-weight:700;color:#e6edf3;margin-top:6px">${sel.ambassador}</div>
        <div style="font-size:10px;color:#818cf8;margin-top:2px">${typeLabel}</div>
      </div>
      ${sel.runnerUp ? `<div style="display:flex;align-items:center;gap:6px;margin-top:8px;opacity:0.5">
        ${rpPortrait(sel.runnerUp, 'xs')}
        <span style="font-size:10px;color:#8b949e">${sel.runnerUp} — runner-up</span>
      </div>` : ''}
    </div>`;
  });
  html += `</div>`;

  // ── MEETING NARRATIVE ──
  html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#8b949e;margin-bottom:10px">THE MEETING</div>`;
  meeting.narrative?.forEach(beat => {
    html += `<div style="padding:10px 14px;margin-bottom:8px;background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.12);border-radius:8px;font-size:12px;color:#c9d1d9;line-height:1.6;font-style:italic">${beat}</div>`;
  });

  // ── OUTCOME ──
  if (meeting.agreed && meeting.target) {
    html += `<div style="text-align:center;margin-top:16px;padding:16px;border:2px solid rgba(218,54,51,0.3);border-radius:12px;background:rgba(218,54,51,0.04)">
      ${rpPortrait(meeting.target, 'xl')}
      <div style="font-family:var(--font-display);font-size:18px;color:#f85149;margin-top:10px">${meeting.target}</div>
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#f85149;margin-top:4px">ELIMINATED BY AMBASSADORS</div>
      <div style="font-size:11px;color:#8b949e;margin-top:8px;max-width:350px;margin-left:auto;margin-right:auto">${meeting.targetReason}</div>
    </div>`;
  } else if (meeting.rockDrawLoser) {
    html += `<div style="text-align:center;margin-top:16px;padding:16px;border:2px solid rgba(218,54,51,0.3);border-radius:12px;background:rgba(218,54,51,0.04)">
      ${rpPortrait(meeting.rockDrawLoser, 'xl')}
      <div style="font-family:var(--font-display);font-size:18px;color:#f85149;margin-top:10px">${meeting.rockDrawLoser}</div>
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#f85149;margin-top:4px">ELIMINATED BY ROCK DRAW</div>
      <div style="font-size:11px;color:#8b949e;margin-top:8px">The ambassadors couldn't agree. The rocks decided.</div>
    </div>`;
  }

  // ── RETURN EVENTS ──
  if (meeting.returnEvents?.length) {
    html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#8b949e;margin-top:20px;margin-bottom:10px">THE RETURN</div>`;
    meeting.returnEvents.forEach(re => {
      const borderColor = re.type === 'safe' ? 'rgba(63,185,80,0.2)' : re.type === 'ambassador-eliminated' ? 'rgba(218,54,51,0.2)' : 'rgba(218,54,51,0.15)';
      const bg = re.type === 'safe' ? 'rgba(63,185,80,0.03)' : 'rgba(218,54,51,0.03)';
      const badge = re.type === 'safe' ? '<span style="font-size:9px;font-weight:700;color:#3fb950;letter-spacing:1px">SAFE</span>'
        : re.type === 'ambassador-eliminated' ? '<span style="font-size:9px;font-weight:700;color:#f85149;letter-spacing:1px">AMBASSADOR LOST</span>'
        : '<span style="font-size:9px;font-weight:700;color:#f85149;letter-spacing:1px">ELIMINATED</span>';
      const tc = tribeColor(re.tribe);
      html += `<div style="padding:10px;margin-bottom:6px;border:1px solid ${borderColor};border-radius:8px;background:${bg}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="font-size:10px;font-weight:700;color:${tc}">${re.tribe}</span>
          ${badge}
        </div>
        <div style="font-size:12px;color:#c9d1d9;line-height:1.6;font-style:italic">${re.text}</div>
      </div>`;
    });
  }

  // ── EXIT QUOTE ──
  if (meeting.eliminated) {
    const _exitS = pStats(meeting.eliminated);
    const _exitPr = pronouns(meeting.eliminated);
    const _exitPick = (arr) => arr[([...meeting.eliminated].reduce((a,c)=>a+c.charCodeAt(0),0)+(epNum||0)*5)%arr.length];
    const exitQuote = meeting.eliminatedByRocks
      ? _exitPick([
        `"I'd do it again. I'd volunteer again. At least I went down swinging — not hiding behind someone else's name."`,
        `"Tell them I tried. Tell them I didn't give anyone up. The rock took me — not the game."`,
        `"Bad luck. That's all this is. I played it right and the rock said no."`,
      ])
      : _exitPick([
        `"Two people I never got to face decided my fate. That's not the game — that's a backroom deal."`,
        `"I would have fought for my tribe. I would have stood in that room and refused. But I never got the chance."`,
        `"It was the right move. I hate it — but it was right. I just wish I'd been the one making it."`,
        `"I thought the bonds I built would protect me. They didn't. The game happened in a room I wasn't in."`,
      ]);
    html += `<div style="margin-top:16px;padding:12px;background:rgba(139,148,158,0.04);border:1px solid rgba(139,148,158,0.08);border-radius:8px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        ${rpPortrait(meeting.eliminated, 'sm')}
        <div>
          <div style="font-size:13px;font-weight:700;color:#e6edf3">${meeting.eliminated}</div>
          <div style="font-size:10px;color:#8b949e">${vpArchLabel(meeting.eliminated)}</div>
        </div>
      </div>
      <div style="font-size:12px;color:#8b949e;font-style:italic;line-height:1.6">${exitQuote}</div>
    </div>`;
  }

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Wire into VP flow**

Find the VP screen flow. Search for `// ── MERGE CHECK ──` in the `buildVPScreens` function (NOT in `simulateEpisode`). Actually, search for `rpBuildMergeAnnouncement` in the VP flow:

```js
  if (ep.isMerge) {
    vpScreens.push({ id:'merge', label:'The Merge', html: rpBuildMergeAnnouncement(ep) });
  }
```

Add BEFORE this block:

```js
  // ── Ambassador twist screen (before merge) ──
  if (ep.ambassadorData?.ambassadorMeeting) {
    const _ambHtml = rpBuildAmbassadors(ep);
    if (_ambHtml) vpScreens.push({ id:'ambassadors', label:'The Ambassadors', html: _ambHtml });
  }
```

- [ ] **Step 3: Add ambassadorData to episode history**

Find `patchEpisodeHistory` and add:

```js
    ambassadorData: ep.ambassadorData || null,
```

- [ ] **Step 4: Commit**

```bash
git add simulator.html
git commit -m "feat: ambassadors VP screen + wiring into VP flow"
```

---

### Task 3: Update CLAUDE.md + ideas backlog

**Files:**
- Modify: `CLAUDE.md`
- Modify: `DATA_SEASON/ideas_probabilistic_moments.txt`

- [ ] **Step 1: Update CLAUDE.md**

Add to Key Engine Functions:
```
- Ambassadors twist (`engineType: 'ambassadors'`) — pre-merge: tribes select ambassadors, they negotiate an elimination. 15 personality-driven pairings with resistance checks. 3+ tribe coalition mechanics. 4 VP screens.
```

- [ ] **Step 2: Mark done in ideas backlog**

Change `[KL-1] AMBASSADORS` from MEDIUM PRIORITY to DONE with implementation summary.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md DATA_SEASON/ideas_probabilistic_moments.txt
git commit -m "docs: ambassadors twist in CLAUDE.md + ideas backlog"
```
