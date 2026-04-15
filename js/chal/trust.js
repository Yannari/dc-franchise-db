// js/chal/trust.js
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

export function simulateTrustChallenge(ep) {
  const tribes = gs.tribes;
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const host = seasonConfig.host || 'Chris';
  const epNum = (gs.episode || 0) + 1;

  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });

  const allMembers = tribes.flatMap(t => t.members);
  const tribeOf = {};
  tribes.forEach(t => t.members.forEach(m => { tribeOf[m] = t.name; }));

  const personalScores = {};
  allMembers.forEach(m => { personalScores[m] = 0; });

  const phases = { pairReveal: [], round1: [], round2: [], round3a: [], round3b: [], round3c: [], result: [] };
  const allEvents = [];
  const timeline = [];
  const sabotageLog = [];
  const poisonedLog = [];
  let ruleBreakData = null;
  let redemptionData = null;

  // Event density boost for 2-tribe games (fewer pairs = fewer events, need to compensate)
  const _eventBoost = tribes.length === 2 ? 1.4 : 1.0;
  const _evRoll = (baseChance) => Math.random() < baseChance * _eventBoost; // use instead of Math.random() < X

  if (!gs._trustHeat) gs._trustHeat = {};
  if (!gs.lingeringInjuries) gs.lingeringInjuries = {};

  // ── Archetype clash detection ──
  const CLASH_PAIRS = [['villain','hero'],['schemer','loyal-soldier'],['chaos-agent','mastermind'],['hothead','strategist']];
  function isArchetypeClash(a, b) {
    const archA = players.find(p => p.name === a)?.archetype || '';
    const archB = players.find(p => p.name === b)?.archetype || '';
    return CLASH_PAIRS.some(([x,y]) => (archA === x && archB === y) || (archA === y && archB === x));
  }

  // ── Emotional state debuff: recent loss, betrayal, showmance breakup ──
  function hasEmotionalDebuff(name) {
    const prevEp = gs.episodeHistory?.length ? gs.episodeHistory[gs.episodeHistory.length - 1] : null;
    if (prevEp?.eliminated && getBond(name, prevEp.eliminated) >= 3) return true;
    if (gs.showmances?.some(s => s.broken && s.players.includes(name))) return true;
    return false;
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 1: PAIR SELECTION — Chris picks for maximum drama
  // ══════════════════════════════════════════════════════════════════
  const pairsData = {}; // tribeName -> { round1, round2, round3a, round3b, round3c }
  const rolesData = {}; // tribeName -> { round1: { climber, belayer }, round2: { cook, eater }, ... }
  const negotiationData = {}; // tribeName -> { round1: { score, correct, event }, ... }
  const usedPlayers = {}; // tribeName -> Set of players already assigned to rounds 1-2
  const poisonedPlayers = new Set(); // players who got food poisoned, can't do round 3

  tribes.forEach(t => {
    pairsData[t.name] = {};
    rolesData[t.name] = {};
    negotiationData[t.name] = {};
    usedPlayers[t.name] = new Set();
    const members = t.members.filter(m => gs.activePlayers.includes(m));

    // ── Pick Drama Pair: from bottom 3 lowest-bond pairs (variance) ──
    const allPairBonds = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        allPairBonds.push({ pair: [members[i], members[j]], bond: getBond(members[i], members[j]) });
      }
    }
    allPairBonds.sort((a, b) => a.bond - b.bond);

    // Pick from bottom 3 candidates (weighted toward lowest but not deterministic)
    let dramaPair;
    const dramaCandidates = allPairBonds.slice(0, Math.min(3, allPairBonds.length));
    if (dramaCandidates.length && dramaCandidates[0].bond <= 1) {
      // Weight toward lower bonds: weights 3, 2, 1
      const weights = dramaCandidates.map((_, i) => 3 - i);
      const totalW = weights.reduce((s, w) => s + w, 0);
      let roll = Math.random() * totalW;
      let pick = 0;
      for (let i = 0; i < weights.length; i++) {
        roll -= weights[i];
        if (roll <= 0) { pick = i; break; }
      }
      dramaPair = dramaCandidates[pick].pair;
    } else {
      // No low-bond pairs — try archetype clash
      let found = false;
      for (let i = 0; i < members.length && !found; i++) {
        for (let j = i + 1; j < members.length && !found; j++) {
          if (isArchetypeClash(members[i], members[j])) {
            dramaPair = [members[i], members[j]];
            found = true;
          }
        }
      }
      if (!found) dramaPair = [members[0], members[1]];
    }

    // ── Pick Wild Card Pair from remaining ──
    const dramaSet = new Set(dramaPair);
    const remaining2 = members.filter(m => !dramaSet.has(m));
    let wildcardPair = null;

    // Try showmance/spark pair
    if (seasonConfig.romance === 'enabled') {
      const sparkPair = remaining2.length >= 2 ? gs.showmances?.find(s => s.players.every(p => remaining2.includes(p))) ||
        gs.romanticSparks?.find(s => s.players.every(p => remaining2.includes(p))) : null;
      if (sparkPair) wildcardPair = [...sparkPair.players];
    }

    // Try archetype clash from remaining
    if (!wildcardPair && remaining2.length >= 2) {
      for (let i = 0; i < remaining2.length && !wildcardPair; i++) {
        for (let j = i + 1; j < remaining2.length && !wildcardPair; j++) {
          if (isArchetypeClash(remaining2[i], remaining2[j])) wildcardPair = [remaining2[i], remaining2[j]];
        }
      }
    }

    // Most neutral pair (bond closest to 0)
    if (!wildcardPair && remaining2.length >= 2) {
      let bestNeutral = null, bestDist = Infinity;
      for (let i = 0; i < remaining2.length; i++) {
        for (let j = i + 1; j < remaining2.length; j++) {
          const dist = Math.abs(getBond(remaining2[i], remaining2[j]));
          if (dist < bestDist) { bestDist = dist; bestNeutral = [remaining2[i], remaining2[j]]; }
        }
      }
      wildcardPair = bestNeutral;
    }

    // Fallback
    if (!wildcardPair) {
      if (remaining2.length >= 2) wildcardPair = [remaining2[0], remaining2[1]];
      else {
        const pool = members.filter(m => !dramaSet.has(m) || remaining2.length < 2);
        wildcardPair = pool.length >= 2 ? [pool[0], pool[1]] : [members[0], members[1]];
      }
    }

    // ── SHUFFLE ROUND ASSIGNMENT — randomly assign which pair goes to which round ──
    if (Math.random() < 0.5) {
      pairsData[t.name].round1 = dramaPair;
      pairsData[t.name].round2 = wildcardPair;
    } else {
      pairsData[t.name].round1 = wildcardPair;
      pairsData[t.name].round2 = dramaPair;
    }
    pairsData[t.name].round1.forEach(p => usedPlayers[t.name].add(p));
    pairsData[t.name].round2.forEach(p => usedPlayers[t.name].add(p));

    // ── Round 3 — Remaining players, 3 sub-rounds ──
    // Will be filled after round 2 (poisoned players removed)
  });

  // ══════════════════════════════════════════════════════════════════
  // ROLE NEGOTIATION HELPER
  // ══════════════════════════════════════════════════════════════════
  function negotiateRoles(a, b, rolePrimary, roleSecondary, primaryStat, tribeName, roundKey) {
    const sA = pStats(a), sB = pStats(b);
    const bond = getBond(a, b);
    const avgTemp = (sA.temperament + sB.temperament) / 2;
    const maxBold = Math.max(sA.boldness, sB.boldness);
    const maxMental = Math.max(sA.mental, sB.mental);
    const maxLoyalty = Math.max(sA.loyalty, sB.loyalty);
    const negScore = bond * 0.02 + avgTemp * 0.04 + (10 - maxBold) * 0.02
                     + maxMental * 0.02 + maxLoyalty * 0.015 + Math.random() * 0.12;
    const correct = negScore > 0.5;

    let primary, secondary;
    if (correct) {
      // Best-stat player gets the matching role
      primary = sA[primaryStat] >= sB[primaryStat] ? a : b;
      secondary = primary === a ? b : a;
    } else {
      // Wrong assignment — worse-stat player insists on the glory role
      primary = sA[primaryStat] < sB[primaryStat] ? a : b;
      secondary = primary === a ? b : a;
    }

    // Negotiation event text
    const prA = pronouns(a), prB = pronouns(b);
    let negEvent = '';
    if (sA.boldness >= 6 && sB.boldness >= 6 && avgTemp < 5) {
      negEvent = _rp([
        `"I'M doing this." "No, I'M doing this." ${a} and ${b} are nose to nose. Neither budges.`,
        `${a} grabs the gear. ${b} grabs it back. ${host} watches, amused. "Work it out, people."`,
        `"You think YOU can handle this?" ${a} snaps. ${b} fires back: "Better than you." The pair squares off.`,
      ]);
    } else if (bond >= 3 && avgTemp >= 6) {
      negEvent = _rp([
        `${a} nods at ${b}. "You ${rolePrimary === primary ? rolePrimary : roleSecondary}, I'll ${rolePrimary === primary ? roleSecondary : rolePrimary}. I trust you." ${b}: "Deal."`,
        `They barely need to discuss it. ${a} and ${b} have worked together enough to know their strengths.`,
        `"You're better at this," ${a} says honestly. ${b} appreciates the maturity. They sort it out calmly.`,
      ]);
    } else if (sA.boldness >= 7 && sB.boldness <= 4) {
      negEvent = _rp([
        `${a} takes charge immediately. ${b} says nothing — but ${prB.posAdj} jaw tightens.`,
        `"I'll handle this." ${a} doesn't ask. ${b} lets it happen. For now.`,
      ]);
    } else if (sB.boldness >= 7 && sA.boldness <= 4) {
      negEvent = _rp([
        `${b} takes charge immediately. ${a} says nothing — but ${prA.posAdj} jaw tightens.`,
        `"I'll handle this." ${b} doesn't ask. ${a} lets it happen. For now.`,
      ]);
    } else if (sA.boldness <= 4 && sB.boldness <= 4) {
      negEvent = _rp([
        `${a} and ${b} stare at each other. Neither wants to decide. "You go." "No, you go." Painful.`,
        `An awkward silence hangs between them. ${host} taps ${host === 'Chris' ? 'his' : 'the'} watch. "Any day now."`,
      ]);
    } else if ((sA.strategic >= 7 || sB.strategic >= 7) && correct) {
      // Strategist made the RIGHT call — text reflects smart analysis
      const strategist = sA.strategic >= 7 ? a : b;
      const other = strategist === a ? b : a;
      const strategistRole = strategist === primary ? rolePrimary : roleSecondary;
      const otherRole = strategist === primary ? roleSecondary : rolePrimary;
      negEvent = _rp([
        `${strategist} analyzes the situation. "You ${otherRole}, I'll ${strategistRole}." ${other} blinks — nobody's been that honest before.`,
        `"Statistically, you should ${otherRole} here." ${strategist}'s logic is hard to argue with. ${other} agrees.`,
      ]);
    } else if ((sA.strategic >= 7 || sB.strategic >= 7) && !correct) {
      // Strategist's analysis was overruled by ego/hostility — wrong assignment
      const strategist = sA.strategic >= 7 ? a : b;
      const other = strategist === a ? b : a;
      const wrongPrimary = primary; // the person who SHOULDN'T be primary but is
      negEvent = _rp([
        `${strategist} tries to talk sense. "I should ${strategist === primary ? roleSecondary : rolePrimary}—" ${other} cuts ${pronouns(strategist).obj} off. "No. I'm not doing that." ${wrongPrimary} takes ${rolePrimary}. Wrong call.`,
        `"This isn't the smart play." ${strategist} knows who should do what. But ${other} won't listen. The hostility wins over logic.`,
        `${strategist}: "If we did this right—" ${other}: "We're doing it MY way." ${strategist} gives up. The wrong person is ${rolePrimary}. Everyone knows it.`,
      ]);
    } else {
      negEvent = _rp([
        `They work it out with minimal drama. Not friends, not enemies — just practical.`,
        `A brief discussion. ${a} takes one role, ${b} the other. It's decided.`,
      ]);
    }

    // Personal score for role negotiation
    if (correct) { personalScores[a] = (personalScores[a] || 0) + 0.5; personalScores[b] = (personalScores[b] || 0) + 0.5; }
    else { personalScores[a] = (personalScores[a] || 0) - 0.5; personalScores[b] = (personalScores[b] || 0) - 0.5; }

    negotiationData[tribeName][roundKey] = { score: negScore, correct, event: negEvent };

    const roles = {};
    roles[rolePrimary] = primary;
    roles[roleSecondary] = secondary;
    rolesData[tribeName][roundKey] = roles;
    return { primary, secondary, correct, negScore, negEvent };
  }

  // ══════════════════════════════════════════════════════════════════
  // PAIR REVEAL PHASE — timeline items
  // ══════════════════════════════════════════════════════════════════
  tribes.forEach(t => {
    const r1 = pairsData[t.name].round1;
    const r2 = pairsData[t.name].round2;
    const bond1 = getBond(r1[0], r1[1]);
    const bond2 = getBond(r2[0], r2[1]);
    const bondLabel = b => b <= 0 ? 'rivals' : b <= 3 ? 'uncertain' : 'allies';

    phases.pairReveal.push({
      kind: 'event', _tribe: t.name,
      type: 'pair-reveal-r1',
      text: `${host} pairs ${r1[0]} and ${r1[1]} for the Rock Climb. Bond: ${bond1.toFixed(1)} (${bondLabel(bond1)}).`,
      players: [...r1], tribe: t.name
    });
    phases.pairReveal.push({
      kind: 'event', _tribe: t.name,
      type: 'pair-reveal-r2',
      text: `${host} pairs ${r2[0]} and ${r2[1]} for the Fugu Cook. Bond: ${bond2.toFixed(1)} (${bondLabel(bond2)}).`,
      players: [...r2], tribe: t.name
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // ROUND 1 — EXTREME ROCK CLIMB
  // ══════════════════════════════════════════════════════════════════
  const roundScores = {};
  tribes.forEach(t => { roundScores[t.name] = {}; });
  const roundWinners = {};

  tribes.forEach(t => {
    const pair = pairsData[t.name].round1;
    const neg = negotiateRoles(pair[0], pair[1], 'climber', 'belayer', 'physical', t.name, 'round1');
    const climberName = neg.primary, belayerName = neg.secondary;
    const sClimber = pStats(climberName), sBelayer = pStats(belayerName);
    const bond = getBond(climberName, belayerName);
    const prClimber = pronouns(climberName), prBelayer = pronouns(belayerName);
    const archBelayer = players.find(p => p.name === belayerName)?.archetype || '';

    // Negotiation event
    phases.round1.push({
      kind: 'event', _tribe: t.name, type: 'negotiation-r1',
      text: neg.negEvent, players: [climberName, belayerName], tribe: t.name
    });

    // ── SETUP — Pair steps up ──
    const archClimber = players.find(p => p.name === climberName)?.archetype || '';
    const isClash = isArchetypeClash(climberName, belayerName);
    let setupText;
    if (bond <= -2) {
      setupText = _rp([
        `${climberName} and ${belayerName} step up to the wall. They don't look at each other. The tension is thick enough to cut.`,
        `${host} watches ${climberName} and ${belayerName} approach the wall. "This should be interesting." Neither responds.`,
        `${climberName} stares at the wall. ${belayerName} stares at the rope. Neither acknowledges the other exists.`,
      ]);
    } else if (bond <= 1) {
      setupText = _rp([
        `${climberName} and ${belayerName} size each other up at the base of the wall. Not hostile — but not comfortable either.`,
        `An uneasy silence as the pair approaches. ${climberName} checks the harness. ${belayerName} picks up the rope. No words.`,
        `${host}: "Trust each other with your LIVES, people!" ${climberName} and ${belayerName} exchange a look that says: easier said than done.`,
      ]);
    } else if (isClash) {
      setupText = _rp([
        `${climberName} and ${belayerName} are oil and water at the base of the wall. But the clock is ticking.`,
        `Everyone knows these two don't mesh. ${climberName} grips the harness. ${belayerName} wraps the rope. Pure professionalism — for now.`,
      ]);
    } else if (bond >= 5) {
      setupText = _rp([
        `${climberName} and ${belayerName} fist-bump at the base. "Let's crush this." They're in sync before the climb even starts.`,
        `"You ready?" "Born ready." ${climberName} and ${belayerName} are locked in. The confidence is contagious.`,
      ]);
    } else {
      setupText = _rp([
        `${climberName} takes position at the wall. ${belayerName} grips the rope. A nod. They're ready.`,
        `The pair approaches the wall. Not best friends, not enemies — just two people with a job to do.`,
      ]);
    }
    phases.round1.push({
      kind: 'event', _tribe: t.name, type: 'climb-setup',
      text: setupText, players: [climberName, belayerName], tribe: t.name
    });
    allEvents.push({ type: 'climb-setup', tribe: t.name, text: setupText });

    let climbScore = sClimber.physical * 0.05 + sClimber.endurance * 0.035 + Math.random() * 0.12
                     + bond * 0.012 + sBelayer.loyalty * 0.02 + sBelayer.temperament * 0.015;

    // Emotional debuff
    if (hasEmotionalDebuff(climberName)) climbScore -= 0.05;
    if (hasEmotionalDebuff(belayerName)) climbScore -= 0.03;

    let sabotaged = false;
    let heroicCatch = false;

    // ── Belayer sabotage check ──
    if (bond <= 0 && ['villain','schemer','chaos-agent'].includes(archBelayer)) {
      const sabChance = (10 - sBelayer.loyalty) * 0.02 + (0 - bond) * 0.015 + (10 - sBelayer.temperament) * 0.01;
      if (Math.random() < sabChance) {
        sabotaged = true;
        const isHumiliation = _evRoll(0.35);
        if (isHumiliation) {
          // Humiliation pull
          climbScore -= 0.1;
          addBond(climberName, belayerName, -1.5);
          personalScores[climberName] = (personalScores[climberName] || 0) - 0.5;
          personalScores[belayerName] = (personalScores[belayerName] || 0) - 2.0;
          gs._trustHeat[belayerName] = { amount: 1.0, expiresEp: epNum + 1 };
          // Popularity shifts: saboteur loses big, victim gets sympathy
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[climberName] = (gs.popularity[climberName] || 0) + 3; // victim of climb sabotage = huge sympathy
          gs.popularity[belayerName] = (gs.popularity[belayerName] || 0) - 2; // saboteur belayer = villain edit

          const sabText = _rp([
            `${belayerName} smirks and pulls the second rope. ${climberName} is humiliated in front of everyone.`,
            `A yank on the wrong line — ${climberName}'s harness goes haywire. ${belayerName} doesn't even try to hide the grin.`,
            `"Oops." ${belayerName}'s voice is dripping with sarcasm as ${prClimber.Sub} ${prClimber.sub === 'they' ? 'dangle' : 'dangles'} in shame.`,
          ]);
          phases.round1.push({ kind: 'event', _tribe: t.name, type: 'sabotage-humiliation', text: sabText, players: [belayerName, climberName], tribe: t.name });
          allEvents.push({ type: 'sabotage-humiliation', tribe: t.name, saboteur: belayerName, victim: climberName, text: sabText });
          sabotageLog.push({ round: 'round1', type: 'humiliation', saboteur: belayerName, victim: climberName, tribe: t.name });

          // Tribe reaction
          t.members.filter(m => m !== climberName && m !== belayerName).forEach(m => {
            const mArch = players.find(p => p.name === m)?.archetype || '';
            if (['villain','schemer'].includes(mArch)) addBond(m, belayerName, 0.2);
            else if (['hero','loyal-soldier'].includes(mArch)) addBond(m, belayerName, -0.3);
            else addBond(m, belayerName, -0.1);
          });

          ep.campEvents[t.name].post.push({
            type: 'trustSabotageHumiliation', players: [belayerName, climberName],
            text: `Everyone's talking about what ${belayerName} did to ${climberName} on the wall. The humiliation was public.`,
            consequences: `${climberName} popularity +3. ${belayerName} becomes the villain of the episode.`,
            badgeText: 'SABOTAGE', badgeClass: 'red'
          });
        } else {
          // Rope drop
          climbScore = -999; // auto-lose
          addBond(climberName, belayerName, -2.0);
          personalScores[climberName] = (personalScores[climberName] || 0) - 0.5;
          personalScores[belayerName] = (personalScores[belayerName] || 0) - 2.0;
          gs._trustHeat[belayerName] = { amount: 2.5, expiresEp: epNum + 3 };

          const sabText = _rp([
            `${belayerName} lets go of the rope. ${climberName} plummets. The silence is deafening.`,
            `The rope goes slack. ${climberName} falls. ${belayerName} watches. Doesn't flinch.`,
            `"Hold the rope!" ${climberName} screams. ${belayerName}'s hands are already at ${prBelayer.posAdj} sides.`,
          ]);
          phases.round1.push({ kind: 'event', _tribe: t.name, type: 'sabotage-ropedrop', text: sabText, players: [belayerName, climberName], tribe: t.name });
          allEvents.push({ type: 'sabotage-ropedrop', tribe: t.name, saboteur: belayerName, victim: climberName, text: sabText });
          sabotageLog.push({ round: 'round1', type: 'rope-drop', saboteur: belayerName, victim: climberName, tribe: t.name });

          // Tribe reaction
          t.members.filter(m => m !== climberName && m !== belayerName).forEach(m => {
            const mArch = players.find(p => p.name === m)?.archetype || '';
            if (['villain','schemer'].includes(mArch)) addBond(m, belayerName, 0.2);
            else if (['hero','loyal-soldier'].includes(mArch)) addBond(m, belayerName, -0.3);
            else addBond(m, belayerName, -0.15);
          });

          // Spectators react
          allMembers.filter(m => tribeOf[m] !== t.name).forEach(m => {
            addBond(m, belayerName, -0.3);
          });

          ep.campEvents[t.name].post.push({
            type: 'trustSabotageRopeDrop', players: [belayerName, climberName],
            text: `${belayerName} dropped ${climberName}. On purpose. The tribe is fractured — do they vote out the saboteur or the one who provoked it?`,
            consequences: `Bond crash -2.0. Heat +2.5 for 3 episodes. Tribal wedge.`,
            badgeText: 'SABOTAGE', badgeClass: 'red'
          });
        }
      }
    }

    // ── MIDDLE — Sequential obstacles (if no sabotage) ──
    if (!sabotaged) {
      // Pick 1-2 obstacles from pool. Each builds on the previous.
      const obstaclePool = ['explosion', 'habanero', 'oil'];
      for (let i = obstaclePool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [obstaclePool[i], obstaclePool[j]] = [obstaclePool[j], obstaclePool[i]];
      }
      const numObstacles = _evRoll(0.55) ? 2 : 1;
      const chosen = obstaclePool.slice(0, numObstacles);

      let prevOutcome = null; // 'pass' | 'save' | 'fail'
      let prevObstacle = null;

      chosen.forEach((obs, obsIdx) => {
        const isSecond = obsIdx === 1;
        const ctxPrefix = isSecond
          ? prevOutcome === 'pass'
            ? `Still riding the adrenaline, `
            : prevOutcome === 'save'
            ? `Shaken but still climbing, `
            : `Already rattled from the ${prevObstacle}, `
          : '';

        if (obs === 'explosion') {
          const endCheck = sClimber.endurance * 0.04 + Math.random() * 0.15;
          const threshold = isSecond && prevOutcome === 'fail' ? 0.42 : 0.35;
          if (endCheck > threshold) {
            climbScore += 0.03;
            personalScores[climberName] = (personalScores[climberName] || 0) + 0.5;
            addBond(climberName, belayerName, 0.2);
            const txt = _rp([
              `${ctxPrefix}an explosion rocks the wall! ${climberName} grabs hold — fingers white — and keeps climbing. ${belayerName} is impressed.`,
              `${ctxPrefix}BOOM. The wall shakes. ${climberName} slips but catches ${prClimber.ref}. Pure grit.`,
            ]);
            phases.round1.push({ kind: 'event', _tribe: t.name, type: 'explosion-pass', text: txt, players: [climberName, belayerName], tribe: t.name });
            allEvents.push({ type: 'explosion-pass', tribe: t.name, text: txt });
            prevOutcome = 'pass';
          } else {
            climbScore -= 0.05;
            if (Math.random() < sBelayer.loyalty * 0.09 + bond * 0.02) {
              heroicCatch = true;
              addBond(climberName, belayerName, 0.3);
              personalScores[belayerName] = (personalScores[belayerName] || 0) + 1.5;
              const txt = _rp([
                `${ctxPrefix}the explosion sends ${climberName} falling — but ${belayerName} holds the rope. Hands burning. Doesn't let go.`,
                `${ctxPrefix}${climberName} falls. ${belayerName} digs in, catches the weight. "I got you!"`,
              ]);
              phases.round1.push({ kind: 'event', _tribe: t.name, type: 'heroic-catch', text: txt, players: [belayerName, climberName], tribe: t.name });
              allEvents.push({ type: 'heroic-catch', tribe: t.name, catcher: belayerName, fallen: climberName, text: txt });
              prevOutcome = 'save';
            } else {
              addBond(climberName, belayerName, -0.2);
              const txt = `${ctxPrefix}${climberName} falls after the explosion. ${belayerName} reacts late — barely catches ${prClimber.obj}. ${climberName} hangs there, staring up. The trust is gone.`;
              phases.round1.push({ kind: 'event', _tribe: t.name, type: 'explosion-fail', text: txt, players: [climberName, belayerName], tribe: t.name });
              allEvents.push({ type: 'explosion-fail', tribe: t.name, text: txt });
              prevOutcome = 'fail';
            }
          }
        }

        if (obs === 'habanero') {
          const mentalCheck = sClimber.mental * 0.04 + Math.random() * 0.15;
          const threshold = isSecond && prevOutcome === 'fail' ? 0.42 : 0.35;
          if (mentalCheck > threshold) {
            const txt = `${ctxPrefix}habanero spray hits ${climberName} in the face. ${prClimber.Sub} doesn't flinch. ${belayerName} gains respect.`;
            addBond(climberName, belayerName, 0.1);
            phases.round1.push({ kind: 'event', _tribe: t.name, type: 'habanero-pass', text: txt, players: [climberName], tribe: t.name });
            allEvents.push({ type: 'habanero-pass', tribe: t.name, text: txt });
            prevOutcome = 'pass';
          } else {
            if (Math.random() < sBelayer.loyalty * 0.08 + bond * 0.03) {
              climbScore += bond * 0.01;
              addBond(climberName, belayerName, 0.3);
              const txt = `${ctxPrefix}habanero spray! ${climberName} screams, loses grip. ${belayerName} pulls the slack tight — saves ${prClimber.obj}. "I've got the rope. Focus."`;
              phases.round1.push({ kind: 'event', _tribe: t.name, type: 'habanero-save', text: txt, players: [belayerName, climberName], tribe: t.name });
              allEvents.push({ type: 'habanero-save', tribe: t.name, text: txt });
              prevOutcome = 'save';
            } else {
              climbScore -= 0.04;
              const txt = _rp([
                `${ctxPrefix}habanero spray blinds ${climberName}. ${prClimber.Sub} grabs ${prClimber.posAdj} face, loses grip. ${belayerName} laughs. "Not my problem."`,
                `${ctxPrefix}${climberName} gets a face full of habanero. ${belayerName} watches. Doesn't help. Doesn't care.`,
              ]);
              phases.round1.push({ kind: 'event', _tribe: t.name, type: 'habanero-fail', text: txt, players: [climberName, belayerName], tribe: t.name });
              allEvents.push({ type: 'habanero-fail', tribe: t.name, text: txt });
              prevOutcome = 'fail';
            }
          }
        }

        if (obs === 'oil') {
          const physCheck = sClimber.physical * 0.04 + Math.random() * 0.15;
          const threshold = isSecond && prevOutcome === 'fail' ? 0.42 : 0.35;
          if (physCheck > threshold) {
            const txt = `${ctxPrefix}oil slick on the wall! ${climberName} adjusts ${prClimber.posAdj} grip and keeps going. Smooth recovery.`;
            phases.round1.push({ kind: 'event', _tribe: t.name, type: 'oil-pass', text: txt, players: [climberName], tribe: t.name });
            allEvents.push({ type: 'oil-pass', tribe: t.name, text: txt });
            prevOutcome = 'pass';
          } else {
            climbScore -= 0.04;
            if (Math.random() < sBelayer.loyalty * 0.08 + bond * 0.03) {
              const txt = `${ctxPrefix}${climberName} hits the oil slick and slides. ${belayerName} was watching — catches the slack immediately. Safe.`;
              phases.round1.push({ kind: 'event', _tribe: t.name, type: 'oil-caught', text: txt, players: [belayerName, climberName], tribe: t.name });
              prevOutcome = 'save';
            } else {
              addBond(climberName, belayerName, -0.5);
              const isBelayerDistracted = bond <= 0 || sBelayer.strategic >= 7;
              const txt = isBelayerDistracted
                ? `${ctxPrefix}${climberName} slips on oil. ${belayerName} was ${bond <= 0 ? 'talking to spectators' : 'thinking about the game'} — reacts too late. ${climberName} hits the ground.`
                : `${ctxPrefix}${climberName} slips. ${belayerName} fumbles the rope. ${climberName} crashes down hard.`;
              phases.round1.push({ kind: 'event', _tribe: t.name, type: 'oil-crash', text: txt, players: [climberName, belayerName], tribe: t.name });
              allEvents.push({ type: 'oil-crash', tribe: t.name, text: txt });
              if (_evRoll(0.25)) {
                gs.lingeringInjuries[climberName] = { ep: epNum, duration: 1, type: 'climbing-fall', penalty: 0.5 + Math.random() * 0.5 };
              }
              prevOutcome = 'fail';
            }
          }
        }

        prevObstacle = obs;
      });

      // Belayer engagement — flows from what happened during obstacles
      if (bond >= 3) {
        climbScore += 0.05;
        addBond(climberName, belayerName, 0.2);
        const engageCtx = prevOutcome === 'fail' ? 'Despite the rough climb, ' : prevOutcome === 'save' ? 'After the save, ' : '';
        const txt = _rp([
          `${engageCtx}"You've got this! Keep going!" ${belayerName} shouts genuine encouragement. ${climberName} pushes harder.`,
          `${engageCtx}${belayerName} locks eyes with ${climberName}: "I'm right here. Trust the rope." ${climberName} climbs on.`,
        ]);
        phases.round1.push({ kind: 'event', _tribe: t.name, type: 'belayer-encourage', text: txt, players: [belayerName, climberName], tribe: t.name });
        allEvents.push({ type: 'belayer-encourage', tribe: t.name, text: txt });
      } else if (bond <= 0) {
        addBond(climberName, belayerName, -0.2);
        const disCtx = prevOutcome === 'fail' ? 'After that disaster, ' : '';
        const txt = _rp([
          `${disCtx}${belayerName} checks ${prBelayer.posAdj} nails while ${climberName} climbs. ${climberName} notices.`,
          `${disCtx}${belayerName} is chatting with the other players on the ground. ${climberName} is twenty feet up. The rope is loose.`,
          `${disCtx}${belayerName} isn't even watching. ${prBelayer.Sub}'s joking around with the team while ${climberName} hangs on for dear life.`,
        ]);
        phases.round1.push({ kind: 'event', _tribe: t.name, type: 'belayer-distracted', text: txt, players: [belayerName, climberName], tribe: t.name });
        allEvents.push({ type: 'belayer-distracted', tribe: t.name, text: txt });
        ep.campEvents[t.name].post.push({
          type: 'trustBelayerDistracted', players: [climberName, belayerName],
          text: `"I saw you not paying attention up there. I was trusting you with my life." ${climberName} confronts ${belayerName} at camp.`,
          consequences: 'Bond -0.2. Tribal talking point.', badgeText: 'DISTRUST', badgeClass: 'orange'
        });
      }

      // ── CLIMAX — Summit or Fall ──
      const fallThreshold = 0.15;
      if (climbScore <= fallThreshold && climbScore > -900) {
        // FALL — climber doesn't make it
        climbScore -= 0.08;
        personalScores[climberName] = (personalScores[climberName] || 0) - 1.0;
        personalScores[belayerName] = (personalScores[belayerName] || 0) - 0.5;
        let fallText;
        if (bond <= 0) {
          fallText = _rp([
            `${climberName}'s grip gives out. ${prClimber.Sub} ${prClimber.sub === 'they' ? 'slide' : 'slides'} down the wall. ${belayerName} catches the rope — but doesn't rush to help.`,
            `It's over. ${climberName} can't hold on. The fall is slow, almost graceful. ${belayerName} watches from below, face unreadable.`,
            `${climberName} falls. Not dramatic — just... done. ${belayerName} barely reacts. "Told you," someone mutters.`,
          ]);
        } else {
          fallText = _rp([
            `${climberName} reaches for the next hold — and misses. The fall is sudden. ${belayerName} catches the rope. "It's okay! We tried!"`,
            `So close. ${climberName}'s arms give out ten feet from the top. ${belayerName} lowers ${prClimber.obj} down gently. "You gave it everything."`,
            `${climberName} can't hold on. ${belayerName} sees it before it happens — braces — catches. They don't make it, but ${belayerName} kept ${prClimber.obj} safe.`,
          ]);
          addBond(climberName, belayerName, 0.1);
        }
        phases.round1.push({
          kind: 'event', _tribe: t.name, type: 'climb-fall',
          text: fallText, players: [climberName, belayerName], tribe: t.name
        });
        allEvents.push({ type: 'climb-fall', tribe: t.name, text: fallText });
        if (_evRoll(0.20)) {
          gs.lingeringInjuries[climberName] = { ep: epNum, duration: 1, type: 'climbing-fall', penalty: 0.3 + Math.random() * 0.3 };
        }
      } else if (climbScore > fallThreshold) {
        // SUMMIT — climber reaches the top
        if (bond <= 0) {
          addBond(climberName, belayerName, 0.3);
          const txt = _rp([
            `${climberName} reaches the top. Looks down at ${belayerName}. "I didn't think you'd hold the rope." "${prBelayer.Sub === 'They' ? 'They' : prBelayer.Sub} almost didn't."`,
            `Summit. ${climberName} and ${belayerName} share a look. Not friendship — but something shifted.`,
          ]);
          phases.round1.push({ kind: 'event', _tribe: t.name, type: 'summit-rivals', text: txt, players: [climberName, belayerName], tribe: t.name });
          allEvents.push({ type: 'summit-rivals', tribe: t.name, text: txt });
        } else {
          const txt = heroicCatch
            ? `After everything — ${climberName} reaches the top! ${belayerName} cheers. "We did that!" The save earlier makes this moment sweeter.`
            : `${climberName} reaches the top! ${belayerName} cheers from below. High-five at the bottom.`;
          addBond(climberName, belayerName, 0.2);
          phases.round1.push({ kind: 'event', _tribe: t.name, type: 'summit-success', text: txt, players: [climberName, belayerName], tribe: t.name });
          allEvents.push({ type: 'summit-success', tribe: t.name, text: txt });
        }
      }
    }

    roundScores[t.name].round1 = climbScore;
  });

  // Determine round 1 winner + arrival reactions
  {
    const sorted = [...tribes].sort((a, b) => (roundScores[b.name].round1 || -999) - (roundScores[a.name].round1 || -999));
    const r1Winner = sorted[0];
    roundWinners.round1 = r1Winner.name;

    // Personal scores for round win/loss
    tribes.forEach(t => {
      const pair = pairsData[t.name].round1;
      if (t.name === r1Winner.name) {
        pair.forEach(p => { personalScores[p] = (personalScores[p] || 0) + 2.0; });
      } else {
        pair.forEach(p => { personalScores[p] = (personalScores[p] || 0) - 0.5; });
      }
    });

    // ── RESOLUTION — Arrival-order reactions ──
    const r1WinScore = roundScores[sorted[0].name].round1 || 0;
    const r1LoseScore = sorted.length > 1 ? (roundScores[sorted[1].name].round1 || 0) : 0;
    const r1Margin = r1WinScore > -900 && r1LoseScore > -900 ? r1WinScore - r1LoseScore : 999;
    const r1Close = r1Margin < 0.08 && r1Margin >= 0;
    const r1Domination = r1Margin > 0.25;

    sorted.forEach((t, arrivalIdx) => {
      const pair = pairsData[t.name].round1;
      const p0 = pair[0], p1 = pair[1];
      const bond = getBond(p0, p1);
      const score = roundScores[t.name].round1;
      const fell = score <= 0.15 && score > -900;
      const wasSabotaged = score <= -900;
      const roles = rolesData[t.name].round1 || {};
      const climber = roles.climber || p0;
      const belayer = roles.belayer || p1;

      if (arrivalIdx === 0) {
        // FIRST TO ARRIVE — win reaction
        let arrText;
        const marginCtx = r1Close ? ' Barely ahead of the other team.' : r1Domination ? ' They blew the competition away.' : '';
        if (bond <= 0) {
          arrText = _rp([
            `${climber} reaches the bottom.${marginCtx} ${belayer} is already there. A nod. Nothing more. But they won.`,
            `First to summit.${marginCtx} ${climber} and ${belayer} don't celebrate — but there's a flicker of respect neither expected.`,
            `"We actually did it." ${climber} sounds surprised.${marginCtx} ${belayer}: "Don't make it weird." But ${pronouns(belayer).sub} ${pronouns(belayer).sub === 'they' ? 'are' : 'is'} almost smiling.`,
          ]);
        } else {
          arrText = _rp([
            `FIRST TO THE TOP!${marginCtx} ${climber} and ${belayer} are screaming. Their tribe erupts.`,
            `They crushed it. ${climber} and ${belayer} collide in a chest bump at the base. The tribe is electric.`,
            `"LET'S GO!" ${climber} slides down and ${belayer} is right there. High-fives all around.`,
          ]);
        }
        phases.round1.push({
          kind: 'event', _tribe: t.name, type: 'climb-arrive-first',
          text: arrText, players: [climber, belayer], tribe: t.name
        });
        allEvents.push({ type: 'climb-arrive-first', tribe: t.name, text: arrText });
      } else if (!wasSabotaged && !fell) {
        // ARRIVED BUT LOST — react to performance
        let arrText;
        const loseCtx = r1Close ? ' It was neck and neck.' : r1Domination ? '' : '';
        if (bond >= 3) {
          arrText = _rp([
            `${climber} reaches the bottom. ${r1Close ? 'Seconds behind the other team.' : 'Late.'} ${belayer}: "We gave it our best." ${climber} nods. No blame — just quiet disappointment.`,
            `Second place.${loseCtx} ${climber} and ${belayer} share a look. "It is what it is." They're not happy, but they're not pointing fingers.`,
            `${climber} and ${belayer} walk back to their tribe. ${r1Close ? 'So close. That stings more than getting blown out.' : 'Disappointed, but together. That counts for something.'}`,
          ]);
        } else if (bond >= 0) {
          const blameRoll = Math.random();
          if (blameRoll < 0.4) {
            arrText = _rp([
              `${climber} comes down. ${belayer} is already looking away. Neither says a word. The tension speaks.`,
              `"We lost." ${climber} states the obvious. ${belayer}: "Yeah."${r1Close ? ' They were RIGHT there.' : ''} No eye contact. The tribe watches in uncomfortable silence.`,
            ]);
          } else {
            arrText = _rp([
              `${climber} and ${belayer} regroup. Not thrilled, not fighting. "Next round," ${belayer} says. ${climber} just nods.`,
              `Second place stings but they handle it. ${climber} and ${belayer} walk back without drama.`,
            ]);
          }
        } else {
          // Blame each other — bond damage
          addBond(climber, belayer, -0.3);
          arrText = _rp([
            `"That was YOUR fault." ${climber} is in ${belayer}'s face before ${pronouns(climber).sub} even ${pronouns(climber).sub === 'they' ? 'unclip' : 'unclips'} the harness. ${belayer}: "MY fault?! Maybe learn to CLIMB."`,
            `${belayer}: "If you'd moved faster—" ${climber}: "If YOU'D held the rope—" The tribe watches. Nobody intervenes.`,
            `${climber} rips off the harness. "Don't EVER belay for me again." ${belayer} laughs coldly. "Gladly."`,
          ]);
          phases.round1.push({
            kind: 'event', _tribe: t.name, type: 'climb-arrive-blame',
            text: arrText, players: [climber, belayer], tribe: t.name
          });
          allEvents.push({ type: 'climb-arrive-blame', tribe: t.name, text: arrText });
          arrText = null;
        }
        if (arrText) {
          phases.round1.push({
            kind: 'event', _tribe: t.name, type: 'climb-arrive-second',
            text: arrText, players: [climber, belayer], tribe: t.name
          });
          allEvents.push({ type: 'climb-arrive-second', tribe: t.name, text: arrText });
        }
      } else {
        // DIDN'T ARRIVE — fell or sabotaged
        let arrText;
        if (wasSabotaged) {
          arrText = _rp([
            `${climber} and ${belayer} don't even walk back together. ${climber} goes left. ${belayer} goes right. The tribe is silent.`,
            `The walk of shame. ${climber} limps back. ${belayer} is nowhere near ${pronouns(climber).obj}. Nobody speaks.`,
          ]);
        } else {
          // Fell — frustration reactions, weighted toward blame
          const blameChance = bond <= 0 ? 0.75 : bond <= 2 ? 0.45 : 0.2;
          if (Math.random() < blameChance) {
            addBond(climber, belayer, -0.4);
            arrText = _rp([
              `"We didn't even FINISH." ${climber} is fuming. ${belayer}: "YOU fell." ${climber}: "Because YOU weren't paying attention!"`,
              `DNF. ${climber} won't look at ${belayer}. ${belayer} won't apologize. The tribe pretends not to notice.`,
              `"Every other pair made it and WE fell?!" ${climber} is humiliated. ${belayer}: "Don't put this on me." But everyone heard the rope go slack.`,
            ]);
          } else {
            arrText = _rp([
              `${climber} sits at the base, head down. ${belayer} sits next to ${pronouns(climber).obj}. "The wall won." Not much else to say.`,
              `They didn't make it. ${climber} and ${belayer} share a defeated look. Not angry — just exhausted.`,
              `DNF. ${climber} shakes ${pronouns(climber).posAdj} head slowly. ${belayer} puts a hand on ${pronouns(climber).posAdj} shoulder. "Next time."`,
            ]);
          }
        }
        phases.round1.push({
          kind: 'event', _tribe: t.name, type: 'climb-arrive-failed',
          text: arrText, players: [climber, belayer], tribe: t.name
        });
        allEvents.push({ type: 'climb-arrive-failed', tribe: t.name, text: arrText });
      }
    });

    const r1Text = `Round 1 — Rock Climb: ${r1Winner.name} wins!`;
    phases.round1.push({ kind: 'event', _tribe: 'cross', type: 'round1-result', text: r1Text, players: [] });
    timeline.push({ kind: 'event', type: 'round-result', round: 1, winner: r1Winner.name, text: r1Text });
  }

  // ══════════════════════════════════════════════════════════════════
  // ROUND 2 — FUGU SASHIMI
  // ══════════════════════════════════════════════════════════════════
  tribes.forEach(t => {
    const pair = pairsData[t.name].round2;
    const neg = negotiateRoles(pair[0], pair[1], 'cook', 'eater', 'intuition', t.name, 'round2');
    const cookName = neg.primary, eaterName = neg.secondary;
    const sCook = pStats(cookName), sEater = pStats(eaterName);
    const bond = getBond(cookName, eaterName);
    const prCook = pronouns(cookName), prEater = pronouns(eaterName);
    const archCook = players.find(p => p.name === cookName)?.archetype || '';

    // Negotiation event
    phases.round2.push({
      kind: 'event', _tribe: t.name, type: 'negotiation-r2',
      text: neg.negEvent, players: [cookName, eaterName], tribe: t.name
    });

    // ── SETUP — Cook approaches the station ──
    let fuguSetupText;
    if (sCook.intuition >= 7 && bond >= 3) {
      fuguSetupText = _rp([
        `${cookName} rolls up ${prCook.posAdj} sleeves and inspects the fugu. Precise. Focused. ${eaterName} relaxes — ${prEater.sub} ${prEater.sub === 'they' ? 'are' : 'is'} in good hands.`,
        `${cookName} picks up the knife like ${prCook.sub} ${prCook.sub === 'they' ? 'were' : 'was'} born holding one. ${eaterName}: "Okay, I feel better already."`,
      ]);
    } else if (sCook.mental <= 4) {
      fuguSetupText = _rp([
        `${cookName} stares at the fugu on the cutting board. Then at the knife. Then back at the fugu. "${eaterName}... do you know which part kills you?"`,
        `${cookName} approaches the station. Picks up the knife. Puts it down. Picks it up again. ${eaterName} is watching this unfold in slow-motion horror.`,
        `"I've never cooked fish before." ${cookName} announces this to no one in particular. ${eaterName}'s face drains of color.`,
      ]);
    } else if (bond <= -2) {
      fuguSetupText = _rp([
        `${cookName} picks up the knife. ${eaterName} flinches. "Relax." "You relax." The station is a war zone before a single cut.`,
        `${eaterName} is watching ${cookName}'s every move. Not out of curiosity — out of survival instinct.`,
        `${cookName} doesn't acknowledge ${eaterName}. Just starts cutting. ${eaterName} leans in, trying to see if the technique is right. Neither trusts the other.`,
      ]);
    } else if (bond <= 1) {
      fuguSetupText = _rp([
        `${cookName} takes position at the cutting station. ${eaterName} hovers. Not helpful — just nervous.`,
        `The fugu sits on the board between them. ${cookName} picks up the knife. ${eaterName}: "Just... be careful." ${cookName}: "I know."`,
      ]);
    } else {
      fuguSetupText = _rp([
        `${cookName} and ${eaterName} approach the station. ${cookName} takes the knife. ${eaterName}: "You got this." A small nod.`,
        `${cookName} examines the fugu carefully. ${eaterName} watches with quiet confidence. They've seen ${prCook.obj} focus like this before.`,
      ]);
    }
    phases.round2.push({
      kind: 'event', _tribe: t.name, type: 'fugu-setup',
      text: fuguSetupText, players: [cookName, eaterName], tribe: t.name
    });
    allEvents.push({ type: 'fugu-setup', tribe: t.name, text: fuguSetupText });

    let cookScore = sCook.intuition * 0.05 + sCook.mental * 0.035 + Math.random() * 0.12
                    + bond * 0.01 + sCook.loyalty * 0.02;

    if (hasEmotionalDebuff(cookName)) cookScore -= 0.05;

    let wasPoisoned = false;
    let sabotaged2 = false;
    let eaterRefused = false;

    // ── Cook sabotage check ──
    if (bond <= -1 && ['villain','schemer'].includes(archCook)) {
      const botchChance = (10 - sCook.loyalty) * 0.02;
      if (Math.random() < botchChance) {
        sabotaged2 = true;
        wasPoisoned = true;
        addBond(cookName, eaterName, -2.0);
        personalScores[cookName] = (personalScores[cookName] || 0) - 2.0;
        personalScores[eaterName] = (personalScores[eaterName] || 0) - 1.0;
        gs._trustHeat[cookName] = { amount: 2.0, expiresEp: epNum + 2 };
        gs.lingeringInjuries[eaterName] = { ep: epNum, duration: 1, type: 'food-poisoned', penalty: 1.0 + Math.random() };
        poisonedPlayers.add(eaterName);
        cookScore = -999; // auto-lose

        const sabText = _rp([
          `${cookName} prepares the fugu with a little too much precision. ${eaterName} bites in — and immediately turns green.`,
          `"Here. Eat." ${cookName} slides the plate over. ${eaterName} tastes it. Five seconds later — face whack, screaming, collapse.`,
          `Did ${cookName} do it on purpose? The kitchen cameras will tell. ${eaterName} is already on the ground.`,
        ]);
        phases.round2.push({ kind: 'event', _tribe: t.name, type: 'deliberate-botch', text: sabText, players: [cookName, eaterName], tribe: t.name });
        allEvents.push({ type: 'deliberate-botch', tribe: t.name, saboteur: cookName, victim: eaterName, text: sabText });
        sabotageLog.push({ round: 'round2', type: 'deliberate-botch', saboteur: cookName, victim: eaterName, tribe: t.name });

        ep.campEvents[t.name].post.push({
          type: 'trustDeliberatePoisoning', players: [cookName, eaterName],
          text: `"Did ${cookName} poison ${eaterName} on purpose?" The tribe is split. ${cookName}'s allies look away. Everyone else wants answers.`,
          consequences: `Heat +2.0 for 2 episodes. Bond crash -2.0.`,
          badgeText: 'POISONED', badgeClass: 'red'
        });
      }
    }

    // ── Poisoning check (accidental) ──
    if (!sabotaged2) {
      const poisonRisk = (10 - sCook.mental) * 0.03 + (10 - sCook.intuition) * 0.02 + Math.random() * 0.1;
      if (poisonRisk > 0.4) {
        wasPoisoned = true;
        personalScores[eaterName] = (personalScores[eaterName] || 0) - 1.0;
        gs.lingeringInjuries[eaterName] = { ep: epNum, duration: 1, type: 'food-poisoned', penalty: 1.0 + Math.random() };
        poisonedPlayers.add(eaterName);
        cookScore = -999; // auto-lose

        if (sCook.loyalty >= 5) {
          addBond(cookName, eaterName, 0.1);
          const txt = _rp([
            `${eaterName} bites in. Hits ${prEater.ref} in the face. Screams. Turns pale. Collapses. ${cookName}: "I'm so sorry! I tried!"`,
            `The fugu was wrong. ${eaterName} is down. ${cookName} rushes over — genuinely terrified. "I didn't mean to—"`,
          ]);
          phases.round2.push({ kind: 'event', _tribe: t.name, type: 'poison-honest', text: txt, players: [eaterName, cookName], tribe: t.name });
          allEvents.push({ type: 'poison-honest', tribe: t.name, text: txt });
        } else {
          addBond(cookName, eaterName, -0.5);
          const txt = _rp([
            `${eaterName} takes a bite. Face whack. Screaming. Laughing. Pale. Collapse. ${cookName} just stares. "Huh."`,
            `Food poisoning. ${eaterName} is down. ${cookName} shrugs. "I told you I couldn't cook."`,
          ]);
          phases.round2.push({ kind: 'event', _tribe: t.name, type: 'poison-negligent', text: txt, players: [eaterName, cookName], tribe: t.name });
          allEvents.push({ type: 'poison-negligent', tribe: t.name, text: txt });

          ep.campEvents[t.name].post.push({
            type: 'trustPoisoning', players: [eaterName, cookName],
            text: `"${cookName} almost killed me and ${prCook.sub} doesn't even care." ${eaterName} is sick. The tribe is shaken.`,
            consequences: 'Bond -0.5. Eater incapacitated for round 3.', badgeText: 'POISONED', badgeClass: 'orange'
          });
        }
        poisonedLog.push({ cook: cookName, eater: eaterName, deliberate: false, tribe: t.name });
      }
    }

    // ── Eater hesitation check (only if not already poisoned) ──
    if (!wasPoisoned) {
      const hesitation = (0 - bond) * 0.03 + (10 - sEater.boldness) * 0.02 + Math.random() * 0.1;
      if (hesitation > 0.4) {
        // Boldness check to force eat
        const boldCheck = sEater.boldness * 0.04 + Math.random() * 0.15;
        if (boldCheck > 0.3) {
          // Eater bravery — overcame fear
          addBond(cookName, eaterName, 0.3);
          personalScores[eaterName] = (personalScores[eaterName] || 0) + 1.5;
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[eaterName] = (gs.popularity[eaterName] || 0) + 1; // ate the fugu despite fear = brave edit
          const txt = _rp([
            `${eaterName} stares at the plate. Hands shaking. "If I die, you're going home next." Takes the bite. Survives.`,
            `${eaterName} picks up the fugu. Sniffs it. Puts it down. Picks it up again. Finally eats. "...Okay. I'm alive."`,
            `The fear is written all over ${prEater.posAdj} face. But ${eaterName} eats it anyway. Bond earned.`,
          ]);
          phases.round2.push({ kind: 'event', _tribe: t.name, type: 'eater-bravery', text: txt, players: [eaterName, cookName], tribe: t.name });
          allEvents.push({ type: 'eater-bravery', tribe: t.name, text: txt });
          ep.campEvents[t.name].post.push({
            type: 'trustBravery', players: [eaterName],
            text: `${eaterName} ate the fugu despite being terrified. The tribe respects the courage.`,
            consequences: 'Popularity +1. Bond +0.3 with cook.', badgeText: 'BRAVE', badgeClass: 'green'
          });
        } else {
          // Eater refuses
          eaterRefused = true;
          cookScore = -999; // auto-lose
          personalScores[eaterName] = (personalScores[eaterName] || 0) - 0.5;
          const txt = _rp([
            `${eaterName} pushes the plate away. "No. I'm not eating that." ${cookName}: "Are you SERIOUS?!" Round over.`,
            `"You first." ${eaterName} says. ${cookName} says no. ${eaterName} says no. The round ends with an untouched plate.`,
          ]);
          phases.round2.push({ kind: 'event', _tribe: t.name, type: 'eater-refused', text: txt, players: [eaterName, cookName], tribe: t.name });
          allEvents.push({ type: 'eater-refused', tribe: t.name, text: txt });
        }
      }
    }

    // ── Track fugu narrative mood for continuity ──
    const fuguMood = wasPoisoned ? 'disaster'
      : eaterRefused ? 'refusal'
      : sabotaged2 ? 'sabotage'
      : sCook.mental <= 4 ? 'anxious'
      : bond <= 0 ? 'tense'
      : 'steady';

    // ── MIDDLE EVENT — Pick ONE coherent middle beat (mutually exclusive) ──
    // Priority: suspicious eater → cook panic → standoff → cook confidence → perfect dish
    // Each pair gets at most ONE middle event to avoid contradictions
    if (!wasPoisoned && !eaterRefused && !sabotaged2) {
      let fuguMiddleFired = false;

      // Suspicious eater (bond <= 0, eater sniffs food)
      if (!fuguMiddleFired && bond <= 0 && _evRoll(0.6)) {
        fuguMiddleFired = true;
        const moodCtx = fuguMood === 'anxious' ? `After watching that shaky preparation, ` : '';
        const txt = _rp([
          `${moodCtx}${eaterName} picks up the dish. Sniffs it. Pokes it. "You first." ${cookName}: "It's fine!" ${eaterName}: "Then YOU eat it."`,
          `${moodCtx}${eaterName} eyes the fugu suspiciously. Doesn't touch it for a full thirty seconds. The tension is unbearable.`,
        ]);
        if (Math.random() < sCook.loyalty * 0.08 + 0.1) {
          addBond(cookName, eaterName, 0.3);
          phases.round2.push({ kind: 'event', _tribe: t.name, type: 'suspicious-cook-eats', text: txt + ` ${cookName} takes a bite first. ${eaterName} relaxes — slightly.`, players: [eaterName, cookName], tribe: t.name });
        } else {
          addBond(cookName, eaterName, -0.3);
          phases.round2.push({ kind: 'event', _tribe: t.name, type: 'suspicious-standoff', text: txt + ` ${cookName} refuses. The suspicion deepens.`, players: [eaterName, cookName], tribe: t.name });
        }
      }

      // Cook panic (proportional — lower mental = more likely)
      if (!fuguMiddleFired && Math.random() < (10 - sCook.mental) * 0.08) {
        fuguMiddleFired = true;
        const moodCtx = fuguMood === 'tense' ? `The tension makes it worse. ` : '';
        const txt = _rp([
          `${moodCtx}"Wait... which part is poisonous again?!" ${cookName} stares at the fish in terror. ${eaterName}: "YOU DON'T KNOW?!"`,
          `${moodCtx}${cookName}'s hands are shaking. The knife is wrong. The cut is wrong. Everything is wrong. "${cookName}!" ${eaterName} shouts.`,
        ]);
        const eaterCalmRoll = sEater.temperament * 0.1 + Math.random() * 0.1;
        if (eaterCalmRoll > 0.6) {
          addBond(cookName, eaterName, 0.3);
          personalScores[eaterName] = (personalScores[eaterName] || 0) + 1.5;
          phases.round2.push({ kind: 'event', _tribe: t.name, type: 'cook-panic-saved', text: txt + ` ${eaterName} talks ${prCook.obj} through it. The EATER saves the dish.`, players: [eaterName, cookName], tribe: t.name });
        } else if (eaterCalmRoll < 0.25) {
          cookScore = -999;
          const storm = ` ${eaterName} storms off. "I'm NOT eating anything you make." Round over.`;
          phases.round2.push({ kind: 'event', _tribe: t.name, type: 'cook-panic-abandon', text: txt + storm, players: [eaterName, cookName], tribe: t.name });
        } else {
          phases.round2.push({ kind: 'event', _tribe: t.name, type: 'cook-panic', text: txt, players: [cookName, eaterName], tribe: t.name });
        }
        allEvents.push({ type: 'cook-panic', tribe: t.name, text: txt });
      }

      // "You first" standoff (proportional — lower boldness = more likely)
      if (!fuguMiddleFired && Math.random() < (10 - sEater.boldness) * 0.04 + (10 - sCook.boldness) * 0.04) {
        fuguMiddleFired = true;
        cookScore -= 0.05;
        const breaker = sEater.temperament < sCook.temperament ? eaterName : cookName;
        personalScores[breaker] = (personalScores[breaker] || 0) + 0.5;
        const moodCtx = fuguMood === 'anxious' ? `After that performance, nobody wants to go first. ` : '';
        const txt = `${moodCtx}Neither wants to touch the fish. "You go." "No, you go." ${host} sighs. Finally ${breaker} snaps: "FINE, I'll do it!" and grabs the knife.`;
        phases.round2.push({ kind: 'event', _tribe: t.name, type: 'you-first-standoff', text: txt, players: [cookName, eaterName], tribe: t.name });
        allEvents.push({ type: 'you-first-standoff', tribe: t.name, text: txt });
      }

      // Cook confidence (proportional — higher intuition = more likely)
      if (!fuguMiddleFired && Math.random() < sCook.intuition * 0.08) {
        fuguMiddleFired = true;
        const txt = `"Trust me. I know exactly what I'm doing." ${cookName} works with precision. ${eaterName} watches, impressed.`;
        if (cookScore > 0.4) {
          addBond(cookName, eaterName, 0.3);
          phases.round2.push({ kind: 'event', _tribe: t.name, type: 'cook-confidence-delivers', text: txt + ` And ${prCook.sub} delivers.`, players: [cookName, eaterName], tribe: t.name });
        } else {
          addBond(cookName, eaterName, -0.2);
          phases.round2.push({ kind: 'event', _tribe: t.name, type: 'cook-confidence-fails', text: txt + ` ...The dish is mediocre. "All that confidence and THIS is what you made?"`, players: [cookName, eaterName], tribe: t.name });
        }
      }

      // Perfect dish — fires as climax if nothing else dramatic happened and score is high
      if (!fuguMiddleFired && cookScore > 0.6) {
        fuguMiddleFired = true;
        addBond(cookName, eaterName, 0.4);
        personalScores[cookName] = (personalScores[cookName] || 0) + 1.5;
        const moodCtx = fuguMood === 'anxious' ? `Nobody expected this after that shaky start. ` : fuguMood === 'tense' ? `Despite the tension — ` : '';
        const txt = bond <= 0
          ? `${moodCtx}${eaterName} takes a bite. Eyes widen. "This is... actually incredible?" "I hate that you're good at this."`
          : `${moodCtx}${eaterName} tastes it. Stunned. "${cookName}, this is amazing." The pair grins.`;
        phases.round2.push({ kind: 'event', _tribe: t.name, type: 'perfect-dish', text: txt, players: [cookName, eaterName], tribe: t.name });
        allEvents.push({ type: 'perfect-dish', tribe: t.name, cook: cookName, text: txt });

        if (bond <= 0) {
          ep.campEvents[t.name].post.push({
            type: 'trustPerfectDish', players: [cookName, eaterName],
            text: `Nobody expected ${cookName} to nail the fugu. ${eaterName} gave an unlikely compliment. The dynamic is shifting.`,
            consequences: 'Bond +0.4. Reveals hidden competence.', badgeText: 'CHEF', badgeClass: 'green'
          });
        }
      }

      // ── FALLBACK — guaranteed middle event if nothing else fired ──
      if (!fuguMiddleFired) {
        let fallbackTxt;
        if (cookScore > 0.4) {
          // Decent dish — not perfect, not disaster
          fallbackTxt = bond <= 0
            ? _rp([
              `${cookName} works in silence. ${eaterName} watches from a distance. The dish comes out... fine. Not great. Not poison. ${eaterName} eats without comment.`,
              `${cookName} finishes the fugu. Slides the plate over. ${eaterName} takes a bite. Chews. Swallows. "It's edible." High praise from a rival.`,
            ])
            : _rp([
              `${cookName} plates the fugu. ${eaterName} takes a bite. Pauses. "It's good." Not amazing — but solid. They move on.`,
              `The fugu is respectable. ${eaterName} eats it without drama. ${cookName}: "See? I told you I could do this." A quiet win.`,
            ]);
          phases.round2.push({ kind: 'event', _tribe: t.name, type: 'fugu-decent', text: fallbackTxt, players: [cookName, eaterName], tribe: t.name });
          allEvents.push({ type: 'fugu-decent', tribe: t.name, text: fallbackTxt });
        } else {
          // Mediocre dish
          fallbackTxt = bond <= 0
            ? _rp([
              `${cookName} presents the fugu. It looks... wrong. ${eaterName} pokes it with a chopstick. "You expect me to eat THIS?" ${cookName}: "Just eat it." They both know it's bad.`,
              `The dish is mediocre. ${eaterName} forces it down, grimacing. ${cookName} doesn't apologize. Neither is surprised.`,
            ])
            : _rp([
              `${cookName} tries. The fugu is... not great. ${eaterName}: "I've had worse?" ${cookName}: "That's not reassuring." They share a weak laugh.`,
              `The fugu tastes like disappointment. ${eaterName} eats it anyway. ${cookName}: "Sorry." ${eaterName}: "It's fine. We're alive."`,
            ]);
          addBond(cookName, eaterName, bond <= 0 ? -0.1 : 0.1);
          phases.round2.push({ kind: 'event', _tribe: t.name, type: 'fugu-mediocre', text: fallbackTxt, players: [cookName, eaterName], tribe: t.name });
          allEvents.push({ type: 'fugu-mediocre', tribe: t.name, text: fallbackTxt });
        }
      }
    }

    // Romance check for round 2 pair
    if (seasonConfig.romance === 'enabled') {
      _challengeRomanceSpark(cookName, eaterName, ep, 'round2', phases, personalScores, 'life-or-death cooking');
    }

    roundScores[t.name].round2 = cookScore;
  });

  // Determine round 2 winner + arrival reactions
  {
    const sorted = [...tribes].sort((a, b) => (roundScores[b.name].round2 || -999) - (roundScores[a.name].round2 || -999));
    const r2Winner = sorted[0];
    roundWinners.round2 = r2Winner.name;
    tribes.forEach(t => {
      const pair = pairsData[t.name].round2;
      if (t.name === r2Winner.name) {
        pair.forEach(p => { personalScores[p] = (personalScores[p] || 0) + 2.0; });
      } else {
        pair.forEach(p => { personalScores[p] = (personalScores[p] || 0) - 0.5; });
      }
    });

    // ── RESOLUTION — Arrival-order reactions ──
    const r2WinScore = roundScores[sorted[0].name].round2 || 0;
    const r2LoseScore = sorted.length > 1 ? (roundScores[sorted[1].name].round2 || 0) : 0;
    const r2Margin = r2WinScore > -900 && r2LoseScore > -900 ? r2WinScore - r2LoseScore : 999;
    const r2Close = r2Margin < 0.08 && r2Margin >= 0;
    const r2Domination = r2Margin > 0.25;

    sorted.forEach((t, arrivalIdx) => {
      const pair = pairsData[t.name].round2;
      const cook = rolesData[t.name].round2?.cook || pair[0];
      const eater = rolesData[t.name].round2?.eater || pair[1];
      const bond = getBond(cook, eater);
      const score = roundScores[t.name].round2;
      const failed = score <= -900;

      if (arrivalIdx === 0) {
        // FIRST — win reaction
        let arrText;
        const marginCtx = r2Close ? ' By the narrowest margin.' : r2Domination ? ' The other team didn\'t stand a chance.' : '';
        if (bond <= 0) {
          arrText = _rp([
            `They won.${marginCtx} ${cook} and ${eater} process this in opposite corners. Not celebrating together — but the scoreboard doesn't lie.`,
            `"We... won?"${marginCtx} ${eater} looks at the score. Then at ${cook}. "Don't act so surprised," ${cook} says. But ${pronouns(cook).sub} ${pronouns(cook).sub === 'they' ? 'are' : 'is'} just as shocked.`,
            `First place.${marginCtx} ${cook} nods at ${eater}. ${eater} nods back. Rivals don't high-five. But they both know what just happened.`,
          ]);
        } else {
          arrText = _rp([
            `"WE WON!"${marginCtx} ${eater} grabs ${cook}. "I told you I could cook!" "I told you I could EAT!" The tribe cheers.`,
            `${cook} pumps a fist.${marginCtx} ${eater} is grinning — alive and victorious. The relief and joy collide.`,
            `${eater}: "That was genuinely delicious." ${cook}: "You're genuinely alive." They both laugh. Win.`,
          ]);
        }
        phases.round2.push({
          kind: 'event', _tribe: t.name, type: 'fugu-arrive-first',
          text: arrText, players: [cook, eater], tribe: t.name
        });
        allEvents.push({ type: 'fugu-arrive-first', tribe: t.name, text: arrText });
      } else if (!failed) {
        // ARRIVED BUT LOST
        let arrText;
        if (bond >= 3) {
          arrText = _rp([
            `${cook}: "The dish was fine. They were just faster." ${eater} nods. No blame. Just bad luck.`,
            `Second place. ${eater}: "You kept me alive. That's what matters." ${cook} manages a weak smile.`,
          ]);
        } else if (bond >= 0) {
          const blameRoll = Math.random();
          if (blameRoll < 0.35) {
            arrText = _rp([
              `${eater} glances at the winning pair's plate. Then at theirs. Says nothing. The silence is its own verdict.`,
              `"Close." ${cook} says. It wasn't close. ${eater} knows it. They both walk back quietly.`,
            ]);
          } else {
            arrText = _rp([
              `"We tried." ${cook} shrugs. ${eater}: "Yeah." Not angry. Just flat.`,
              `Second place. ${cook} and ${eater} exchange a look. Nothing to say. They move on.`,
            ]);
          }
        } else {
          // Blame — bond damage
          addBond(cook, eater, -0.3);
          arrText = _rp([
            `"If the food wasn't mediocre we would've won." ${eater} doesn't hold back. ${cook}: "If you'd eaten FASTER—" "FASTER?! I was trying not to DIE!"`,
            `${cook}: "I did my job." ${eater}: "Your JOB was to not poison me AND win. You managed ONE of those." ${cook} goes red.`,
            `"We lost because of YOUR cooking." ${eater} jabs a finger. ${cook}: "We lost because you sat there STARING at it for thirty seconds!"`,
          ]);
          phases.round2.push({
            kind: 'event', _tribe: t.name, type: 'fugu-arrive-blame',
            text: arrText, players: [cook, eater], tribe: t.name
          });
          allEvents.push({ type: 'fugu-arrive-blame', tribe: t.name, text: arrText });
          arrText = null;
        }
        if (arrText) {
          phases.round2.push({
            kind: 'event', _tribe: t.name, type: 'fugu-arrive-second',
            text: arrText, players: [cook, eater], tribe: t.name
          });
          allEvents.push({ type: 'fugu-arrive-second', tribe: t.name, text: arrText });
        }
      } else {
        // FAILED — poisoned, refused, or sabotaged
        let arrText;
        const eaterWasPoisoned = poisonedPlayers.has(eater);
        if (eaterWasPoisoned) {
          const blameChance = bond <= 0 ? 0.8 : 0.3;
          if (Math.random() < blameChance) {
            arrText = _rp([
              `${eater} is still green. ${cook} won't make eye contact. "You POISONED me." "It was an accident!" "Was it?!"`,
              `${eater} from the medical bench: "I'm never eating anything you make again. EVER." ${cook} has no response.`,
            ]);
          } else {
            arrText = _rp([
              `${eater} is recovering. ${cook} sits nearby, genuinely worried. "I'm sorry. I really am." ${eater}: "...I know."`,
              `${cook} brings water to ${eater}. "I tried my best." ${eater}, still pale: "I believe you. Just... never again."`,
            ]);
          }
        } else {
          // Refused to eat
          const blameChance = bond <= 0 ? 0.7 : 0.35;
          if (Math.random() < blameChance) {
            arrText = _rp([
              `"You couldn't even EAT it?!" ${cook} is livid. ${eater}: "You couldn't even COOK it right!" The tribe watches the meltdown.`,
              `DNF. ${cook} blames ${eater} for refusing. ${eater} blames ${cook} for making it look lethal. Nobody wins this argument.`,
            ]);
            addBond(cook, eater, -0.3);
          } else {
            arrText = _rp([
              `The plate sits untouched between them. ${cook} and ${eater} stare at it. "We really blew that," ${cook} says quietly.`,
              `DNF. Neither speaks on the walk back. The untouched fugu says everything.`,
            ]);
          }
        }
        phases.round2.push({
          kind: 'event', _tribe: t.name, type: 'fugu-arrive-failed',
          text: arrText, players: [cook, eater], tribe: t.name
        });
        allEvents.push({ type: 'fugu-arrive-failed', tribe: t.name, text: arrText });
      }
    });

    const r2Text = `Round 2 — Fugu Sashimi: ${r2Winner.name} wins!`;
    phases.round2.push({ kind: 'event', _tribe: 'cross', type: 'round2-result', text: r2Text, players: [] });
    timeline.push({ kind: 'event', type: 'round-result', round: 2, winner: r2Winner.name, text: r2Text });
  }

  // ══════════════════════════════════════════════════════════════════
  // ROUND 3 — THREE BLIND CHALLENGES (best of 3 sub-rounds)
  // ══════════════════════════════════════════════════════════════════
  const BLIND_SUBS = ['round3a', 'round3b', 'round3c'];
  const BLIND_LABELS = { round3a: 'Blind William Tell', round3b: 'Blind Trapeze', round3c: 'Blind Toboggan' };
  const BLIND_ROLES = {
    round3a: { primary: 'shooter', secondary: 'target', stat: 'intuition' },
    round3b: { primary: 'catcher', secondary: 'jumper', stat: 'physical' },
    round3c: { primary: 'navigator', secondary: 'driver', stat: 'intuition' }
  };

  // Assign round 3 pairs for each tribe
  tribes.forEach(t => {
    const members = t.members.filter(m => gs.activePlayers.includes(m));
    const available = members.filter(m => !usedPlayers[t.name].has(m) && !poisonedPlayers.has(m));
    // Also include poisoned-player replacements from already-used pool
    const allAvailable = [...available];

    // Need 3 pairs (6 slots). Fill from available, then reuse.
    const pairList = [];
    const usedR3 = new Set();

    function pickPair() {
      const free = allAvailable.filter(m => !usedR3.has(m));
      if (free.length >= 2) {
        const a = free[0], b = free[1];
        usedR3.add(a); usedR3.add(b);
        return [a, b];
      } else if (free.length === 1) {
        // Need to reuse one player
        const a = free[0];
        usedR3.add(a);
        const reuse = members.filter(m => m !== a && !poisonedPlayers.has(m));
        const b = reuse.length ? reuse[Math.floor(Math.random() * reuse.length)] : members[0];
        return [a, b];
      } else {
        // All used — pick from members (reuse)
        const pool = members.filter(m => !poisonedPlayers.has(m));
        if (pool.length >= 2) {
          const shuffled = [...pool].sort(() => Math.random() - 0.5);
          return [shuffled[0], shuffled[1]];
        }
        return [members[0], members[1 % members.length]];
      }
    }

    BLIND_SUBS.forEach(sub => {
      pairsData[t.name][sub] = pickPair();
    });
  });

  // ── Run each blind sub-round ──
  const subRoundWinners = {};

  BLIND_SUBS.forEach(sub => {
    const phaseKey = sub;
    const roleInfo = BLIND_ROLES[sub];

    tribes.forEach(t => {
      const pair = pairsData[t.name][sub];
      const neg = negotiateRoles(pair[0], pair[1], roleInfo.primary, roleInfo.secondary, roleInfo.stat, t.name, sub);
      const primaryName = neg.primary, secondaryName = neg.secondary;
      const sPrimary = pStats(primaryName), sSecondary = pStats(secondaryName);
      const bond = getBond(primaryName, secondaryName);
      const prPrimary = pronouns(primaryName), prSecondary = pronouns(secondaryName);
      const archPrimary = players.find(p => p.name === primaryName)?.archetype || '';
      const archSecondary = players.find(p => p.name === secondaryName)?.archetype || '';

      phases[phaseKey].push({
        kind: 'event', _tribe: t.name, type: `negotiation-${sub}`,
        text: neg.negEvent, players: [primaryName, secondaryName], tribe: t.name
      });

      // ── SETUP — Pair steps up for blind challenge ──
      let blindSetupText;
      if (sub === 'round3a') {
        // William Tell — shooter aims at target's head
        if (bond <= -2) {
          blindSetupText = _rp([
            `${secondaryName} stands against the target. ${primaryName} picks up the bow. Neither looks happy about this arrangement.`,
            `"You're going to shoot an arrow at MY head?" ${secondaryName} looks at ${primaryName}. "Try not to enjoy it."`,
            `${primaryName} tests the bow. ${secondaryName} watches every move. The apple on ${prSecondary.posAdj} head wobbles. So does ${prSecondary.posAdj} confidence.`,
          ]);
        } else if (bond >= 4) {
          blindSetupText = _rp([
            `${secondaryName} puts the apple on ${prSecondary.posAdj} head. Doesn't flinch. "I trust you." ${primaryName} draws the bow.`,
            `${primaryName} picks up the bow with quiet confidence. ${secondaryName} stands steady. They've been through worse together.`,
          ]);
        } else {
          blindSetupText = _rp([
            `${primaryName} picks up the bow. ${secondaryName} positions at the target. A deep breath from both.`,
            `The apple goes on ${secondaryName}'s head. ${primaryName} draws. The crowd holds its breath.`,
          ]);
        }
      } else if (sub === 'round3b') {
        // Trapeze — jumper leaps, catcher catches
        if (bond <= -2) {
          blindSetupText = _rp([
            `${secondaryName} looks down from the platform. Then at ${primaryName} below. "You better catch me." ${primaryName}: "We'll see."`,
            `${secondaryName} climbs to the platform. Looks at the water. Looks at ${primaryName}. The jellyfish are visible from up here. This is going to be ugly.`,
          ]);
        } else if (bond >= 4) {
          blindSetupText = _rp([
            `${secondaryName} climbs to the platform. ${primaryName} spreads ${prPrimary.posAdj} arms below. "Whenever you're ready." No hesitation.`,
            `${primaryName} positions below the platform. ${secondaryName} looks down and nods. They've got this.`,
          ]);
        } else {
          blindSetupText = _rp([
            `${secondaryName} stands on the platform edge. ${primaryName} braces below. The water between them is full of jellyfish. No pressure.`,
            `${primaryName} gets into position. ${secondaryName} peers over the edge. Neither looks fully confident.`,
          ]);
        }
      } else {
        // Toboggan — navigator calls, driver steers blind
        if (bond <= -2) {
          blindSetupText = _rp([
            `${secondaryName} gets in the toboggan. ${primaryName} sits behind to navigate. "Don't crash us." "Don't give me a reason to."`,
            `The blindfold goes on ${secondaryName}. ${primaryName} is supposed to guide ${prSecondary.obj}. The lack of trust is palpable.`,
          ]);
        } else if (bond >= 4) {
          blindSetupText = _rp([
            `${secondaryName} puts on the blindfold. ${primaryName}: "I've got you. Left, right, straight — just listen to my voice." ${secondaryName} grips the handles. Ready.`,
            `They climb into the toboggan. ${secondaryName} blindfolded, ${primaryName} calling directions. "Let's fly." They launch.`,
          ]);
        } else {
          blindSetupText = _rp([
            `${secondaryName} adjusts the blindfold. ${primaryName} takes the navigator seat. A nervous glance between them. Here goes nothing.`,
            `Into the toboggan. ${secondaryName} can't see. ${primaryName} can barely think. The course stretches ahead.`,
          ]);
        }
      }
      phases[phaseKey].push({
        kind: 'event', _tribe: t.name, type: `blind-setup-${sub}`,
        text: blindSetupText, players: [primaryName, secondaryName], tribe: t.name
      });
      allEvents.push({ type: `blind-setup-${sub}`, tribe: t.name, text: blindSetupText });

      let score = 0;

      // ════════════════════════════════════════════
      // 3a: BLIND WILLIAM TELL
      // ════════════════════════════════════════════
      if (sub === 'round3a') {
        const shooterName = rolesData[t.name][sub].shooter;
        const targetName = rolesData[t.name][sub].target;
        const sShooter = pStats(shooterName), sTarget = pStats(targetName);
        const prShooter = pronouns(shooterName), prTarget = pronouns(targetName);

        score = sShooter.intuition * 0.04 + Math.random() * 0.18
                + bond * 0.015 + sShooter.loyalty * 0.025 + sShooter.temperament * 0.015;

        // Target flinch (low bond)
        if (bond < 0) {
          score -= 0.05;
          const txt = `${targetName} flinches every time ${shooterName} draws the bow. Makes it harder to aim.`;
          phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'target-flinch', text: txt, players: [targetName, shooterName], tribe: t.name });
        }

        // Wild shooter — Sadie moment
        if (sShooter.intuition <= 3 && sShooter.temperament <= 4 && Math.random() < 0.5) {
          score = -999;
          personalScores[shooterName] = (personalScores[shooterName] || 0) - 1.0;
          addBond(targetName, shooterName, -0.5);
          // Hit bystanders
          const bystanders = t.members.filter(m => m !== shooterName && m !== targetName).slice(0, 2);
          bystanders.forEach(b => addBond(b, shooterName, -0.2));

          const txt = _rp([
            `${shooterName} keeps firing after the round is called. Arrows EVERYWHERE. ${targetName}, the audience, a seagull — nobody is safe.`,
            `${shooterName} can't stop shooting. Arrows hit the target's face, a camera, ${host}'s coffee. Complete chaos.`,
            `"STOP SHOOTING!" ${host} yells. ${shooterName} fires three more. One hits a tree. One hits a bird. One almost hits ${host}.`,
          ]);
          phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'wild-shooter', text: txt, players: [shooterName, targetName, ...bystanders], tribe: t.name });
          allEvents.push({ type: 'wild-shooter', tribe: t.name, shooter: shooterName, text: txt });

          ep.campEvents[t.name].post.push({
            type: 'trustWildShooter', players: [shooterName, targetName, ...bystanders],
            text: `"Remember when ${shooterName} almost killed everyone?" It's the only thing anyone is talking about.`,
            consequences: 'Bond -0.5 with target. -0.2 with bystanders hit. Comedy but lasting damage.', badgeText: 'WILD', badgeClass: 'orange'
          });
        }
        // Perfect hit
        else if (score > 0.6) {
          addBond(shooterName, targetName, 0.4);
          personalScores[shooterName] = (personalScores[shooterName] || 0) + 1.5;
          const txt = _rp([
            `${shooterName} fires. Arrow knocks clean off the apple. ${targetName} doesn't flinch. Pure trust. "I told you I wouldn't miss."`,
            `Bullseye. The apple splits. ${targetName} exhales. ${shooterName}: "See? I've got you."`,
          ]);
          phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'perfect-hit', text: txt, players: [shooterName, targetName], tribe: t.name });
          allEvents.push({ type: 'perfect-hit', tribe: t.name, text: txt });
        }
        // Face hit (low score)
        else if (score < 0.25 && score > -900) {
          addBond(targetName, shooterName, sShooter.temperament >= 5 ? 0.1 : -0.3);
          const txt = sShooter.temperament >= 5
            ? `Apple hits ${targetName} in the face. ${shooterName}: "Oh god, are you okay?!" Genuinely sorry.`
            : `Apple hits ${targetName} square in the face. ${shooterName}: "Oops." No remorse. ${targetName} will remember this.`;
          phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'face-hit', text: txt, players: [shooterName, targetName], tribe: t.name });
          allEvents.push({ type: 'face-hit', tribe: t.name, text: txt });
        }
      }

      // ════════════════════════════════════════════════════════════════
      // 3b: BLIND TRAPEZE — Full sequence over jellyfish pond
      // Catcher on spinning trapeze, jumper blindfolded on platform.
      // 4 phases: CATCHER PREP → JUMPER CLIMB → THE CALL → THE JUMP
      // ════════════════════════════════════════════════════════════════
      if (sub === 'round3b') {
        const catcherName = rolesData[t.name][sub].catcher;
        const jumperName = rolesData[t.name][sub].jumper;
        const sCatcher = pStats(catcherName), sJumper = pStats(jumperName);
        const prCatcher = pronouns(catcherName), prJumper = pronouns(jumperName);
        const archCatcher = players.find(p => p.name === catcherName)?.archetype || '';

        score = sCatcher.physical * 0.04 + Math.random() * 0.15
                + bond * 0.015 + sCatcher.loyalty * 0.025 + sCatcher.temperament * 0.015;

        const communication = bond * 0.02 + sCatcher.temperament * 0.04 + sCatcher.loyalty * 0.03;
        let trapSabotaged = false;
        let trapMomentum = 'steady'; // 'confident' | 'steady' | 'shaky' | 'frozen'

        // ── PHASE 1: CATCHER PREP — Getting on the trapeze, finding rhythm ──
        const catcherReady = sCatcher.physical * 0.04 + sCatcher.temperament * 0.02 + Math.random() * 0.12;
        if (catcherReady > 0.45) {
          score += 0.02;
          trapMomentum = 'confident';
          const txt = _rp([
            `${catcherName} climbs onto the trapeze and starts swinging. Steady rhythm. Arms out. Ready.`,
            `${catcherName} finds the rhythm immediately. The trapeze swings in clean arcs over the jellyfish pond. ${prCatcher.Sub} looks locked in.`,
          ]);
          phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'trapeze-catcher-ready', text: txt, players: [catcherName], tribe: t.name });
          allEvents.push({ type: 'trapeze-catcher-ready', tribe: t.name, text: txt });
        } else if (catcherReady < 0.2) {
          score -= 0.03;
          trapMomentum = 'shaky';
          const txt = _rp([
            `${catcherName} gets on the trapeze. Can't find the rhythm. Swinging too fast, then too slow. The jellyfish glow below.`,
            `${catcherName} nearly falls off the trapeze just getting on it. "I'M FINE." ${prCatcher.Sub} ${prCatcher.sub === 'they' ? 'are' : 'is'} not fine.`,
            `The trapeze is unsteady. ${catcherName} is gripping too tight, throwing off the swing. Not a great sign.`,
          ]);
          phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'trapeze-catcher-shaky', text: txt, players: [catcherName], tribe: t.name });
          allEvents.push({ type: 'trapeze-catcher-shaky', tribe: t.name, text: txt });
        } else {
          const txt = `${catcherName} gets on the trapeze. Takes a moment to find the swing. Okay. Decent rhythm.`;
          phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'trapeze-catcher-ok', text: txt, players: [catcherName], tribe: t.name });
          allEvents.push({ type: 'trapeze-catcher-ok', tribe: t.name, text: txt });
        }

        // ── PHASE 2: JUMPER CLIMB — Climbing blindfolded to the platform ──
        const climbFear = (10 - sJumper.boldness) * 0.05 + (0 - bond) * 0.02 + Math.random() * 0.1;
        if (climbFear > 0.45) {
          score -= 0.02;
          if (trapMomentum !== 'frozen') trapMomentum = 'shaky';
          const txt = _rp([
            `${jumperName} climbs the ladder blindfolded. Every rung is slower than the last. ${prJumper.Sub} can hear the jellyfish crackling below.`,
            `"How high is this?!" ${jumperName} is gripping the ladder. ${host}: "You don't want to know." The blindfold makes every inch feel like a mile.`,
            `${jumperName} reaches the platform. Legs shaking. Can't see the pond but can HEAR the jellyfish popping. "I'm going to die up here."`,
          ]);
          phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'trapeze-climb-scared', text: txt, players: [jumperName], tribe: t.name });
          allEvents.push({ type: 'trapeze-climb-scared', tribe: t.name, text: txt });
        } else if (sJumper.boldness >= 7) {
          const txt = _rp([
            `${jumperName} climbs the ladder fast. Blindfolded and unbothered. "Tell me when." ${prJumper.Sub} ${prJumper.sub === 'they' ? 'are' : 'is'} ready before ${catcherName} is.`,
            `${jumperName} takes the platform like it's nothing. Arms crossed. Waiting. "Hurry up down there."`,
          ]);
          score += 0.02; // faster climb = time advantage
          phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'trapeze-climb-bold', text: txt, players: [jumperName], tribe: t.name });
          allEvents.push({ type: 'trapeze-climb-bold', tribe: t.name, text: txt });
        } else {
          const txt = `${jumperName} climbs to the platform. Blindfolded. Takes a breath at the top. "Okay. I'm here."`;
          phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'trapeze-climb-ok', text: txt, players: [jumperName], tribe: t.name });
          allEvents.push({ type: 'trapeze-climb-ok', tribe: t.name, text: txt });
        }

        // ── DISTRACTION CHECK — Bystanders, wind, noise ──
        if (_evRoll(0.35)) {
          const bystanders = t.members.filter(m => m !== catcherName && m !== jumperName);
          const distractSource = bystanders.length > 0 ? bystanders[Math.floor(Math.random() * bystanders.length)] : null;
          if (distractSource && _evRoll(0.5)) {
            // Teammate causes distraction
            score -= 0.03;
            const txt = _rp([
              `${distractSource} yells something from the sideline. ${catcherName} loses rhythm for a second. ${jumperName}: "What was that?!" "Nothing! FOCUS!"`,
              `"YOU CAN DO IT!" ${distractSource} screams. The sudden noise makes ${jumperName} flinch on the platform. ${catcherName}: "STOP HELPING!"`,
              `${distractSource} knocks over equipment on the sideline. The crash echoes. ${catcherName}'s swing stutters. ${jumperName} grips the railing tighter.`,
            ]);
            phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'trapeze-distraction', text: txt, players: [distractSource, catcherName, jumperName], tribe: t.name });
            allEvents.push({ type: 'trapeze-distraction', tribe: t.name, text: txt });
            if (trapMomentum === 'confident') trapMomentum = 'steady';
          } else {
            // Wind/environment distraction
            score -= 0.02;
            const txt = _rp([
              `A gust of wind rocks the trapeze. ${catcherName} swings wide. The timing is off. ${jumperName}: "Are you still there?!" "YES! Wait!"`,
              `The jellyfish light up brighter — a surge below the pond. The glow is visible even through ${jumperName}'s blindfold. ${prJumper.Sub} hesitates.`,
            ]);
            phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'trapeze-wind', text: txt, players: [catcherName, jumperName], tribe: t.name });
            allEvents.push({ type: 'trapeze-wind', tribe: t.name, text: txt });
          }
        }

        // ── PHASE 3: THE CALL — Catcher calls the timing ──
        // Sabotage check first
        if (bond <= -1 && ['villain','schemer'].includes(archCatcher) && Math.random() < 0.3) {
          trapSabotaged = true;
          score = -999;
          addBond(jumperName, catcherName, -2.0);
          personalScores[catcherName] = (personalScores[catcherName] || 0) - 2.0;
          gs._trustHeat[catcherName] = { amount: 2.0, expiresEp: epNum + 2 };
          const momCtx = trapMomentum === 'shaky' ? `${jumperName} was already terrified. Then — ` : '';
          const txt = _rp([
            `${momCtx}"JUMP!" ${catcherName} calls — at exactly the wrong time. ${jumperName} leaps into jellyfish-filled water. ${catcherName} watches from the trapeze. Doesn't move.`,
            `${momCtx}${catcherName} waits for the worst possible moment. "NOW!" ${jumperName} jumps. The splash is followed by screaming. Electric blue light everywhere. Jellyfish.`,
            `${momCtx}"Trust me — JUMP!" ${catcherName}'s voice is steady. Convincing. ${jumperName} leaps. ${catcherName} pulls ${prCatcher.posAdj} arms back. The betrayal is mid-air. The splash is sickening.`,
          ]);
          phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'catcher-sabotage', text: txt, players: [catcherName, jumperName], tribe: t.name });
          allEvents.push({ type: 'catcher-sabotage', tribe: t.name, saboteur: catcherName, victim: jumperName, text: txt });
          sabotageLog.push({ round: sub, type: 'catcher-sabotage', saboteur: catcherName, victim: jumperName, tribe: t.name });
          gs.lingeringInjuries[jumperName] = { ep: epNum, duration: 1, type: 'jellyfish-stings', penalty: 0.3 };

          // Aftermath
          const afterTxt = _rp([
            `${jumperName} climbs out of the pond, stung and shaking. ${catcherName} hangs on the trapeze, saying nothing. The tribe is stunned.`,
            `Medics rush in. ${jumperName} is covered in welts. ${catcherName} climbs down from the trapeze quietly. Nobody makes eye contact with ${prCatcher.obj}.`,
          ]);
          phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'trapeze-sabotage-aftermath', text: afterTxt, players: [jumperName, catcherName], tribe: t.name });
          allEvents.push({ type: 'trapeze-sabotage-aftermath', tribe: t.name, text: afterTxt });

          ep.campEvents[t.name].post.push({
            type: 'trustCatcherSabotage', players: [catcherName, jumperName],
            text: `${catcherName} let ${jumperName} fall into the jellyfish. Everyone saw it. Heat is coming.`,
            consequences: `Heat +2.0. Bond crash -2.0.`, badgeText: 'SABOTAGE', badgeClass: 'red'
          });
        }

        // ── PHASE 4: THE JUMP — if no sabotage ──
        if (!trapSabotaged) {
          const momCtx = trapMomentum === 'confident' ? '' : trapMomentum === 'shaky' ? 'After all that buildup of fear, ' : trapMomentum === 'frozen' ? 'Against everything ${prJumper.posAdj} body is telling ${prJumper.obj}, ' : '';

          // Trust leap (proportional — bolder = more likely to leap without waiting)
          if (Math.random() < sJumper.boldness * 0.06 && _evRoll(0.45)) {
            if (Math.random() < sCatcher.physical * 0.07 + 0.15) {
              score += 0.15;
              addBond(jumperName, catcherName, 0.5);
              personalScores[jumperName] = (personalScores[jumperName] || 0) + 1.5;
              const txt = `${jumperName} doesn't wait for the call. Just JUMPS. Mid-air. ${catcherName}: "YOU PSYCHO!" But ${prCatcher.sub} catches ${prJumper.obj}. Arms lock. The crowd erupts. Pure adrenaline trust.`;
              phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'trust-leap-caught', text: txt, players: [jumperName, catcherName], tribe: t.name });
              allEvents.push({ type: 'trust-leap-caught', tribe: t.name, text: txt });

              // Aftermath
              const afterTxt = `${jumperName} rips off the blindfold, grinning. ${catcherName} is still processing. "Never do that again." But ${prCatcher.sub} ${prCatcher.sub === 'they' ? 'are' : 'is'} smiling too.`;
              phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'trapeze-leap-aftermath', text: afterTxt, players: [jumperName, catcherName], tribe: t.name });
              allEvents.push({ type: 'trapeze-leap-aftermath', tribe: t.name, text: afterTxt });
            } else {
              score -= 0.1;
              addBond(jumperName, catcherName, -0.3);
              gs.lingeringInjuries[jumperName] = { ep: epNum, duration: 1, type: 'jellyfish-stings', penalty: 0.3 };
              const txt = `${jumperName} leaps without warning. ${catcherName} wasn't ready — the swing was off. Fingertips brush. Then nothing. Splash. The jellyfish light up blue.`;
              phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'trust-leap-miss', text: txt, players: [jumperName, catcherName], tribe: t.name });
              allEvents.push({ type: 'trust-leap-miss', tribe: t.name, text: txt });

              const afterTxt = `${jumperName} surfaces, stung, furious. "I JUMPED FOR YOU!" ${catcherName}: "I WASN'T READY!" The pair argues while medics pull ${jumperName} out.`;
              phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'trapeze-miss-aftermath', text: afterTxt, players: [jumperName, catcherName], tribe: t.name });
              allEvents.push({ type: 'trapeze-miss-aftermath', tribe: t.name, text: afterTxt });
            }
          }
          // Frozen jumper (proportional — lower boldness = more likely to freeze)
          else if (Math.random() < (10 - sJumper.boldness) * 0.06 && _evRoll(0.55)) {
            // The frozen moment — catcher has to talk them into it
            const convinceCheck = bond * 0.05 + sCatcher.temperament * 0.03 + sCatcher.loyalty * 0.03 + Math.random() * 0.1;
            if (convinceCheck > 0.4) {
              addBond(jumperName, catcherName, 0.3);
              score -= 0.03;
              const txt = _rp([
                `${jumperName} is frozen on the platform. Can't jump. ${catcherName} stops swinging. "Hey. Look — I know you can't see me. But I'm right here. I will catch you." Silence. Then — ${prJumper.sub} ${prJumper.sub === 'they' ? 'jump' : 'jumps'}.`,
                `"I can't." ${jumperName}'s voice cracks. ${catcherName}: "Yes you can. On three. One... two..." ${jumperName} jumps on two. ${catcherName} catches ${prJumper.obj}. "You went early." "Shut up."`,
                `${jumperName} stands on the edge. Minutes pass. ${catcherName} keeps swinging, patient. "Whenever you're ready." Finally — a small step. Then a leap. Caught.`,
              ]);
              phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'frozen-jump', text: txt, players: [jumperName, catcherName], tribe: t.name });
              allEvents.push({ type: 'frozen-jump', tribe: t.name, text: txt });
            } else {
              score -= 0.08;
              const txt = _rp([
                `${jumperName} stands on the platform. Frozen. "Why would I trust YOU?" ${catcherName} has no answer. ${prJumper.Sub} refuses. Time ticks away. The jellyfish glow mockingly below.`,
                `"Jump!" "No." "JUMP!" "NO." ${catcherName} swings back and forth. ${jumperName} won't move. ${host} taps his watch. "We're burning daylight, people." They time out.`,
              ]);
              phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'frozen-refuse', text: txt, players: [jumperName, catcherName], tribe: t.name });
              allEvents.push({ type: 'frozen-refuse', tribe: t.name, text: txt });

              ep.campEvents[t.name].post.push({
                type: 'trustFrozenRefuse', players: [jumperName, catcherName],
                text: `${jumperName} couldn't jump. The frozen moment reveals how broken the pair's trust is.`,
                consequences: 'Severe time penalty. The refusal is discussed at camp.', badgeText: 'FROZEN', badgeClass: 'orange'
              });
            }
          }
          // Normal jump — timing call quality determines outcome
          else {
            // The call
            const callQuality = communication * 0.5 + sCatcher.intuition * 0.03 + Math.random() * 0.1;
            const callCtx = trapMomentum === 'shaky' ? 'shaky ' : trapMomentum === 'confident' ? '' : '';

            if (callQuality < 0.25) {
              // Bad call — jellyfish
              score -= 0.1;
              addBond(jumperName, catcherName, -0.4);
              gs.lingeringInjuries[jumperName] = { ep: epNum, duration: 1, type: 'jellyfish-stings', penalty: 0.3 };

              const callTxt = _rp([
                `"JUMP!" ${catcherName}'s ${callCtx}call comes at the wrong moment. The swing is off. ${jumperName} leaps — and there's nothing to grab.`,
                `${catcherName} misjudges the timing. "NOW!" ${jumperName} jumps into empty air. For one second, everything is still. Then — splash.`,
              ]);
              phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'trapeze-bad-call', text: callTxt, players: [catcherName, jumperName], tribe: t.name });
              allEvents.push({ type: 'trapeze-bad-call', tribe: t.name, text: callTxt });

              // Aftermath
              // Proportional: higher loyalty+temperament = more likely to help
              const catcherRemorseRoll = sCatcher.loyalty * 0.06 + sCatcher.temperament * 0.05 + Math.random() * 0.1;
              if (catcherRemorseRoll > 0.6) {
                addBond(jumperName, catcherName, 0.2);
                const afterTxt = `${catcherName} dives off the trapeze into the water. Jellyfish and all. Pulls ${jumperName} out. "I'm so sorry. I'm so sorry." Loyalty earned the hard way.`;
                phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'jellyfish-sorry', text: afterTxt, players: [jumperName, catcherName], tribe: t.name });
                allEvents.push({ type: 'jellyfish-sorry', tribe: t.name, text: afterTxt });
              } else {
                // Lower temperament = more likely to laugh (proportional cruelty)
                const laughRoll = (10 - sCatcher.temperament) * 0.08;
                if (Math.random() < laughRoll) addBond(jumperName, catcherName, -0.4);
                const afterTxt = Math.random() < laughRoll
                  ? `${jumperName} surfaces screaming. ${catcherName} is still on the trapeze. Laughing. "You dropped me in JELLYFISH." "Yeah I saw." This goes to tribal.`
                  : `${jumperName} climbs out covered in welts. ${catcherName} climbs down from the trapeze. Neither speaks. The damage is done.`;
                phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'jellyfish-fall', text: afterTxt, players: [jumperName, catcherName], tribe: t.name });
                allEvents.push({ type: 'jellyfish-fall', tribe: t.name, text: afterTxt });

                ep.campEvents[t.name].post.push({
                  type: 'trustJellyfishFall', players: [jumperName, catcherName],
                  text: `"You dropped me in JELLYFISH." ${jumperName} is furious. ${catcherName} has no excuse.`,
                  consequences: 'Bond -0.4. Tribal ammunition.', badgeText: 'JELLYFISH', badgeClass: 'orange'
                });
              }
            } else if (score > 0.55) {
              // Great call — perfect catch
              addBond(jumperName, catcherName, 0.5);
              personalScores[catcherName] = (personalScores[catcherName] || 0) + 1.5;
              const callTxt = _rp([
                `"NOW!" ${catcherName}'s timing is flawless. ${jumperName} leaps. Mid-air — arms connect. The catch is clean. ${jumperName} hangs from the trapeze, breathing hard. "You actually caught me." "I told you I would."`,
                `${catcherName} calls the jump perfectly. ${jumperName} flies through the air — and lands in ${catcherName}'s arms. The trapeze swings. The jellyfish glow below, untouched. The crowd roars.`,
                `The call. The leap. The catch. Everything connects. ${jumperName} and ${catcherName} swing together over the jellyfish pond. Pure trust. "${prJumper.Sub} actually did it."`,
              ]);
              phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'perfect-catch', text: callTxt, players: [catcherName, jumperName], tribe: t.name });
              allEvents.push({ type: 'perfect-catch', tribe: t.name, text: callTxt });

              if (seasonConfig.romance === 'enabled') {
                _challengeRomanceSpark(catcherName, jumperName, ep, phaseKey, phases, personalScores, 'dramatic mid-air catch');
              }
            } else {
              // Decent call — catches but messy
              const txt = _rp([
                `"Jump!" The timing is close but not perfect. ${jumperName} leaps. ${catcherName} stretches — grabs ${prJumper.posAdj} wrist. Swings ${prJumper.obj} up. Messy, but safe. ${jumperName}'s feet dangle over the jellyfish.`,
                `${catcherName} calls it. ${jumperName} jumps. The catch is awkward — one arm, not two. ${jumperName} dangles. ${catcherName} hauls ${prJumper.obj} up. "That was ugly." "We're alive."`,
                `Almost missed. ${jumperName} jumps, ${catcherName} reaches — fingertips first, then grip. They swing together, barely. The jellyfish crackle below their feet.`,
              ]);
              addBond(jumperName, catcherName, 0.2);
              score += 0.03;
              phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'trapeze-messy-catch', text: txt, players: [catcherName, jumperName], tribe: t.name });
              allEvents.push({ type: 'trapeze-messy-catch', tribe: t.name, text: txt });
            }
          }
        }
      }

      // ════════════════════════════════════════════
      // ════════════════════════════════════════════
      // 3c: BLIND TOBOGGAN — Full descent race
      // Navigator sees the course, driver is blindfolded.
      // 3 phases: LAUNCH → DESCENT (2-3 obstacles) → FINAL STRETCH
      // ════════════════════════════════════════════
      if (sub === 'round3c') {
        const navigatorName = rolesData[t.name][sub].navigator;
        const driverName = rolesData[t.name][sub].driver;
        const sNavigator = pStats(navigatorName), sDriver = pStats(driverName);
        const prNavigator = pronouns(navigatorName), prDriver = pronouns(driverName);

        score = sDriver.physical * 0.04 + sNavigator.intuition * 0.04 + Math.random() * 0.15
                + bond * 0.015 + ((sDriver.loyalty + sNavigator.loyalty) / 2) * 0.025 + ((sDriver.temperament + sNavigator.temperament) / 2) * 0.015;

        const communication = bond * 0.02 + sNavigator.temperament * 0.04 + sNavigator.loyalty * 0.03;
        let tobSabotaged = false;
        let tobWipedOut = false;
        let tobMomentum = 'steady'; // 'steady' | 'strong' | 'shaky' | 'chaos'

        // ── PHASE 1: LAUNCH — First calls off the top of the hill ──
        const launchQuality = sNavigator.intuition * 0.04 + sNavigator.temperament * 0.03 + Math.random() * 0.12;
        if (launchQuality > 0.5) {
          score += 0.03;
          tobMomentum = 'strong';
          const txt = _rp([
            `"STRAIGHT! Keep it straight!" ${navigatorName}'s voice is clear. ${driverName} launches perfectly off the top. They're flying.`,
            `${navigatorName} calls the first turn with confidence. ${driverName} nails it. Clean start — they're ahead.`,
            `The toboggan rockets off the start. ${navigatorName} is calm, precise. "Left... NOW." ${driverName} cuts it clean. Great launch.`,
          ]);
          phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'toboggan-launch-clean', text: txt, players: [navigatorName, driverName], tribe: t.name });
          allEvents.push({ type: 'toboggan-launch-clean', tribe: t.name, text: txt });
        } else if (launchQuality < 0.25) {
          score -= 0.04;
          tobMomentum = 'shaky';
          const txt = _rp([
            `"Uh... left? No wait—" ${navigatorName} hesitates. ${driverName} clips a wall on the first turn. Rough start.`,
            `${navigatorName} freezes at the top. The toboggan launches crooked. ${driverName}: "WHERE DO I GO?!" Already behind.`,
            `Bad start. ${navigatorName} calls right when ${prNavigator.sub} ${prNavigator.sub === 'they' ? 'mean' : 'means'} left. ${driverName} spins. They lose precious seconds.`,
          ]);
          phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'toboggan-launch-rough', text: txt, players: [navigatorName, driverName], tribe: t.name });
          allEvents.push({ type: 'toboggan-launch-rough', tribe: t.name, text: txt });
        } else {
          const txt = `They launch. ${navigatorName} calls the first turn. ${driverName} follows. Decent start — nothing special, nothing disastrous.`;
          phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'toboggan-launch-ok', text: txt, players: [navigatorName, driverName], tribe: t.name });
          allEvents.push({ type: 'toboggan-launch-ok', tribe: t.name, text: txt });
        }

        // ── Navigator sabotage check (before obstacles) ──
        if (bond <= 0 && _evRoll(0.15)) {
          const navArch = players.find(p => p.name === navigatorName)?.archetype || '';
          if (['villain','schemer','chaos-agent'].includes(navArch)) {
            tobSabotaged = true;
            score -= 0.15;
            if (Math.random() < sDriver.intuition * 0.08 + 0.1) {
              addBond(driverName, navigatorName, -1.0);
              const ctx = tobMomentum === 'strong' ? 'They were doing so well — then ' : '';
              const txt = `${ctx}"Turn LEFT!" — ${navigatorName} says. ${driverName} turns right. "You did that on purpose." The driver's intuition caught the lie.`;
              phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'nav-sabotage-caught', text: txt, players: [navigatorName, driverName], tribe: t.name });
              allEvents.push({ type: 'nav-sabotage-caught', tribe: t.name, text: txt });
            } else {
              const txt = `${navigatorName} calls the wrong direction. ${driverName} slams into a barrier. Blames ${prDriver.ref}. ${navigatorName} got away with it — for now.`;
              phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'nav-sabotage-hidden', text: txt, players: [navigatorName, driverName], tribe: t.name });
              allEvents.push({ type: 'nav-sabotage-hidden', tribe: t.name, navigator: navigatorName, driver: driverName, text: txt });
              sabotageLog.push({ round: sub, type: 'wrong-directions', saboteur: navigatorName, victim: driverName, tribe: t.name, hidden: true });
              // Delayed consequence — someone notices on replay / at camp
              addBond(driverName, navigatorName, -0.3); // driver senses something was off
              gs._trustHeat[navigatorName] = { amount: 0.5, expiresEp: epNum + 1 }; // mild suspicion
              ep.campEvents[t.name].post.push({
                type: 'trustNavSabotageHidden', players: [navigatorName, driverName],
                text: `${driverName} keeps replaying the crash. "Something felt wrong about that turn..." ${navigatorName} changes the subject. Fast.`,
                consequences: 'Bond -0.3. Mild heat. Suspicion seeds planted.', badgeText: 'SUSPICIOUS', badgeClass: 'orange'
              });
            }
            tobMomentum = 'chaos';
          }
        }

        // ── PHASE 2: DESCENT — 2-3 sequential obstacles ──
        if (!tobSabotaged) {
          const descentObstacles = ['explosion', 'sharp-turn', 'water-hazard', 'mud-pit', 'jump-ramp'];
          for (let oi = descentObstacles.length - 1; oi > 0; oi--) {
            const oj = Math.floor(Math.random() * (oi + 1));
            [descentObstacles[oi], descentObstacles[oj]] = [descentObstacles[oj], descentObstacles[oi]];
          }
          const numObs = _evRoll(0.45) ? 3 : 2;
          const chosenObs = descentObstacles.slice(0, numObs);

          chosenObs.forEach((obs, oi) => {
            const momCtx = oi > 0
              ? tobMomentum === 'strong' ? 'Still in control, ' : tobMomentum === 'shaky' ? 'Already rattled, ' : tobMomentum === 'chaos' ? 'In total chaos, ' : ''
              : '';
            const passCheck = communication * 0.5 + sDriver.physical * 0.03 + Math.random() * 0.15;
            const threshold = tobMomentum === 'shaky' || tobMomentum === 'chaos' ? 0.4 : 0.3;

            if (obs === 'explosion') {
              if (passCheck > threshold) {
                score += 0.02;
                const txt = _rp([
                  `${momCtx}BOOM! Explosion on the right! ${navigatorName}: "LEFT! HARD LEFT!" ${driverName} swerves. Clean dodge.`,
                  `${momCtx}explosion rocks the course! ${navigatorName} doesn't flinch — "Straight through!" ${driverName} threads the gap. Smoke everywhere.`,
                ]);
                phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'toboggan-explosion-dodge', text: txt, players: [navigatorName, driverName], tribe: t.name });
                allEvents.push({ type: 'toboggan-explosion-dodge', tribe: t.name, text: txt });
                tobMomentum = 'strong';
              } else {
                score -= 0.06;
                const txt = _rp([
                  `${momCtx}explosion! ${navigatorName}: "LEFT! NO, RIGHT! NO—" ${driverName} drives straight into it. The toboggan spins.`,
                  `${momCtx}BOOM. ${navigatorName} screams something unintelligible. ${driverName} takes the full blast. They're still moving — barely.`,
                ]);
                phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'toboggan-explosion-hit', text: txt, players: [navigatorName, driverName], tribe: t.name });
                allEvents.push({ type: 'toboggan-explosion-hit', tribe: t.name, text: txt });
                tobMomentum = 'shaky';
              }
            }

            if (obs === 'sharp-turn') {
              if (passCheck > threshold) {
                score += 0.02;
                const txt = _rp([
                  `${momCtx}hairpin turn! "${navigatorName === driverName ? 'Turn' : 'RIGHT, RIGHT, RIGHT!'}" ${driverName} leans into it. The toboggan tilts on one runner — and makes it.`,
                  `${momCtx}sharp bend ahead. ${navigatorName} calls it early. ${driverName} brakes, turns, accelerates. Textbook.`,
                ]);
                phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'toboggan-turn-clean', text: txt, players: [navigatorName, driverName], tribe: t.name });
                allEvents.push({ type: 'toboggan-turn-clean', tribe: t.name, text: txt });
                if (tobMomentum !== 'chaos') tobMomentum = 'strong';
              } else {
                score -= 0.05;
                const txt = _rp([
                  `${momCtx}hairpin! ${navigatorName} calls it late. ${driverName} clips the wall. The toboggan BOUNCES off. They're still going but something is rattling.`,
                  `${momCtx}"TURN! TURN NOW!" Too late. ${driverName} overshoots the bend. The toboggan skids sideways through gravel before righting itself.`,
                ]);
                phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'toboggan-turn-crash', text: txt, players: [navigatorName, driverName], tribe: t.name });
                allEvents.push({ type: 'toboggan-turn-crash', tribe: t.name, text: txt });
                tobMomentum = 'shaky';
              }
            }

            if (obs === 'water-hazard') {
              if (passCheck > threshold) {
                const txt = _rp([
                  `${momCtx}water across the track! ${navigatorName}: "Don't brake — power through!" ${driverName} hits the water at full speed. Massive splash. They clear it.`,
                  `${momCtx}river crossing! ${navigatorName} spots it early. "Straight. Don't slow down." ${driverName} trusts the call. Water sprays everywhere — but they don't stall.`,
                ]);
                score += 0.02;
                phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'toboggan-water-clear', text: txt, players: [navigatorName, driverName], tribe: t.name });
                allEvents.push({ type: 'toboggan-water-clear', tribe: t.name, text: txt });
              } else {
                score -= 0.06;
                addBond(driverName, navigatorName, -0.2);
                const txt = _rp([
                  `${momCtx}WATER! ${navigatorName}: "Brake! No wait—" Too late. The toboggan hydroplanes. ${driverName}: "WHY DIDN'T YOU WARN ME?!" They're soaked and off-course.`,
                  `${momCtx}${driverName} hits the water hazard blind. The toboggan stalls halfway through. ${navigatorName} is pushing. ${driverName} is cursing. Neither is happy.`,
                ]);
                phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'toboggan-water-stall', text: txt, players: [driverName, navigatorName], tribe: t.name });
                allEvents.push({ type: 'toboggan-water-stall', tribe: t.name, text: txt });
                tobMomentum = 'shaky';
              }
            }

            if (obs === 'mud-pit') {
              if (passCheck > threshold) {
                score += 0.01;
                const txt = `${momCtx}mud pit! ${navigatorName}: "Go around — LEFT side!" ${driverName} veers. Barely misses it. Close call.`;
                phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'toboggan-mud-dodge', text: txt, players: [navigatorName, driverName], tribe: t.name });
                allEvents.push({ type: 'toboggan-mud-dodge', tribe: t.name, text: txt });
              } else {
                score -= 0.04;
                const txt = _rp([
                  `${momCtx}${driverName} hits the mud pit. The toboggan slows to a crawl. ${navigatorName}: "PUSH! PUSH!" They lose time clawing out.`,
                  `${momCtx}mud everywhere. ${driverName} is stuck. ${navigatorName} jumps out and pushes. "This is DISGUSTING." They get free, covered head to toe.`,
                ]);
                phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'toboggan-mud-stuck', text: txt, players: [driverName, navigatorName], tribe: t.name });
                allEvents.push({ type: 'toboggan-mud-stuck', tribe: t.name, text: txt });
                tobMomentum = 'shaky';
              }
            }

            if (obs === 'jump-ramp') {
              const boldCheck = sDriver.boldness * 0.04 + Math.random() * 0.12;
              if (boldCheck > 0.35) {
                score += 0.04;
                personalScores[driverName] = (personalScores[driverName] || 0) + 0.5;
                const txt = _rp([
                  `${momCtx}RAMP! ${navigatorName}: "Hit it! FULL SPEED!" ${driverName} doesn't hesitate. The toboggan goes AIRBORNE. They land clean. The crowd ROARS.`,
                  `${momCtx}jump ramp ahead! ${navigatorName}: "Don't brake!" ${driverName} guns it. They FLY. Mid-air. Landing. Perfect. "${prDriver.Sub} ${prDriver.sub === 'they' ? 'are' : 'is'} actually insane."`,
                ]);
                addBond(driverName, navigatorName, 0.2);
                phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'toboggan-jump-send', text: txt, players: [driverName, navigatorName], tribe: t.name });
                allEvents.push({ type: 'toboggan-jump-send', tribe: t.name, text: txt });
                tobMomentum = 'strong';
              } else {
                score -= 0.03;
                const txt = _rp([
                  `${momCtx}ramp ahead. ${driverName} brakes. "I'm not jumping that." ${navigatorName}: "You HAVE to!" They crawl over it. Time lost.`,
                  `${momCtx}${navigatorName}: "Jump!" ${driverName}: "NO." They slow down, bump over the ramp awkwardly. Not dramatic — just slow.`,
                ]);
                phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'toboggan-jump-chicken', text: txt, players: [driverName, navigatorName], tribe: t.name });
                allEvents.push({ type: 'toboggan-jump-chicken', tribe: t.name, text: txt });
              }
            }
          });

          // ── Navigator composure check (during descent) ──
          if (Math.random() < (10 - sNavigator.temperament) * 0.06 && _evRoll(0.5)) {
            score -= 0.04;
            const momCtx = tobMomentum === 'shaky' ? 'After that disaster, ' : tobMomentum === 'chaos' ? 'It gets worse — ' : '';
            if (bond <= 0) {
              const physCheck = sDriver.physical * 0.04 + Math.random() * 0.15;
              if (physCheck > 0.35) {
                score += 0.03;
                const txt = `${momCtx}${navigatorName} is SCREAMING contradicting directions. ${driverName} ignores ${prNavigator.obj} entirely and steers by instinct. It works.`;
                phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'nav-screaming-ignore', text: txt, players: [driverName, navigatorName], tribe: t.name });
              } else {
                const txt = `${momCtx}${navigatorName} is screaming. ${driverName} ignores ${prNavigator.obj}. Crashes anyway.`;
                phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'nav-screaming-crash', text: txt, players: [driverName, navigatorName], tribe: t.name });
              }
            } else {
              const txt = `${momCtx}${navigatorName} panics. Screams every direction at once. ${driverName} tries to follow. It's chaos on wheels.`;
              phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'nav-screaming', text: txt, players: [navigatorName, driverName], tribe: t.name });
            }
            allEvents.push({ type: 'nav-screaming', tribe: t.name, text: `${navigatorName} loses composure` });
            tobMomentum = 'chaos';
          }
        }

        // ── PHASE 3: FINAL STRETCH — wipeout or finish ──
        // Wipeout check: if momentum is terrible and score is low
        if (!tobSabotaged && score > -900) {
          const wipeoutChance = tobMomentum === 'chaos' ? 0.4 : tobMomentum === 'shaky' ? 0.2 : 0.05;
          if (score < 0.2 && Math.random() < wipeoutChance) {
            tobWipedOut = true;
            score -= 0.1;
            personalScores[driverName] = (personalScores[driverName] || 0) - 0.5;
            personalScores[navigatorName] = (personalScores[navigatorName] || 0) - 0.5;
            const txt = _rp([
              `The toboggan catches a rut. Tips. ROLLS. ${navigatorName} and ${driverName} tumble out in a heap. They slide the last twenty feet on their backs.`,
              `Too much damage. The toboggan veers off-course and flips. ${driverName} rips off the blindfold in the crash. ${navigatorName} is tangled in the wreckage. They crawl across the finish line.`,
              `The front runner snaps. The toboggan nosedives. ${navigatorName} and ${driverName} are launched into the dirt. The other team finishes while they're still picking gravel out of their teeth.`,
            ]);
            phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'toboggan-wipeout', text: txt, players: [driverName, navigatorName], tribe: t.name });
            allEvents.push({ type: 'toboggan-wipeout', tribe: t.name, text: txt });
          } else if (tobMomentum === 'strong' && score > 0.4) {
            // Strong finish
            addBond(driverName, navigatorName, 0.2);
            const txt = _rp([
              `Final stretch! ${navigatorName}: "STRAIGHT! FULL SPEED!" ${driverName} pushes hard. The toboggan rockets across the finish line. Clean run.`,
              `They come screaming down the final hill. ${navigatorName}'s calls are perfect. ${driverName}'s steering is flawless. They cross the line at top speed.`,
              `"GO GO GO!" The toboggan blazes through the last section. ${driverName} tears off the blindfold at the finish line, grinning. ${navigatorName}: "WE CRUSHED IT."`,
            ]);
            phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'toboggan-finish-strong', text: txt, players: [driverName, navigatorName], tribe: t.name });
            allEvents.push({ type: 'toboggan-finish-strong', tribe: t.name, text: txt });
          } else {
            // Normal finish
            const finishCtx = tobMomentum === 'shaky' ? 'Battered but intact, ' : '';
            const txt = `${finishCtx}${driverName} and ${navigatorName} cross the finish line. ${driverName} pulls off the blindfold. "Did we win?" ${navigatorName}: "...We finished. That's something."`;
            phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'toboggan-finish', text: txt, players: [driverName, navigatorName], tribe: t.name });
            allEvents.push({ type: 'toboggan-finish', tribe: t.name, text: txt });
          }
        }

        // ── Rule break DQ (the DJ moment) — can happen at any point ──
        if (score > -900 && !ruleBreakData) {
          const hasEmotionalTrigger = hasEmotionalDebuff(driverName) ? 1 : 0;
          const ruleBreakChance = (10 - sDriver.strategic) * 0.02 + hasEmotionalTrigger * 0.15
            + (tobMomentum === 'chaos' ? 0.1 : 0); // more likely when things are going badly
          if (Math.random() < ruleBreakChance && _evRoll(0.15)) {
            ruleBreakData = { driver: driverName, navigator: navigatorName, tribe: t.name, sub };
            score = -999; // DQ
            personalScores[driverName] = (personalScores[driverName] || 0) - 2.0;
            gs._trustHeat[driverName] = { amount: 2.0, expiresEp: epNum + 2 };

            const navArch = players.find(p => p.name === navigatorName)?.archetype || '';
            if (['strategic','schemer','mastermind'].includes(navArch)) {
              addBond(navigatorName, driverName, -0.5);
            } else if (['hero','loyal-soldier'].includes(navArch)) {
              addBond(navigatorName, driverName, 0.3);
            }

            const wasWinning = tobMomentum === 'strong';
            const txt = _rp([
              wasWinning
                ? `${driverName} rips off the blindfold. They were WINNING. But the rule is clear: blindfold on at all times. ${host}: "Disqualified." The silence is deafening.`
                : `"I can't do this blind anymore." ${driverName} removes the blindfold. ${host}: "That's a DQ." ${navigatorName} stares in disbelief.`,
              `${driverName} tears the blindfold off. Something broke — the fear, the frustration, the not-knowing. ${host} doesn't even need to say it. Everyone knows.`,
              `The blindfold comes off. ${driverName} can finally see the course — the turns, the walls, the finish line RIGHT THERE. But the race is over. DQ.`,
            ]);
            phases[phaseKey].push({ kind: 'event', _tribe: t.name, type: 'rule-break-dq', text: txt, players: [driverName, navigatorName], tribe: t.name });
            allEvents.push({ type: 'rule-break-dq', tribe: t.name, driver: driverName, text: txt });

            ep.campEvents[t.name].post.push({
              type: 'trustRuleBreak', players: [driverName, navigatorName],
              text: `Was it selfish or noble? ${driverName} broke the one rule. The tribe debates whether the DQ was worth it.`,
              consequences: `Heat +2.0 for 2 episodes. Partner bond depends on archetype.`, badgeText: 'DQ', badgeClass: 'red'
            });
          }
        }
      }

      roundScores[t.name][sub] = score;
    });

    // Determine sub-round winner
    const sorted = [...tribes].sort((a, b) => (roundScores[b.name][sub] || -999) - (roundScores[a.name][sub] || -999));
    subRoundWinners[sub] = sorted[0].name;

    // Personal scores for sub-round
    tribes.forEach(t => {
      const pair = pairsData[t.name][sub];
      if (t.name === sorted[0].name) {
        pair.forEach(p => { personalScores[p] = (personalScores[p] || 0) + 0.67; }); // ~2.0 total for winning all 3
      } else {
        pair.forEach(p => { personalScores[p] = (personalScores[p] || 0) - 0.17; }); // ~-0.5 total for losing all 3
      }
    });

    // ── RESOLUTION — Arrival-order reactions for sub-round ──
    const subLabel = BLIND_LABELS[sub];
    const winScore = roundScores[sorted[0].name][sub] || 0;
    const loseScore = sorted.length > 1 ? (roundScores[sorted[1].name][sub] || 0) : 0;
    const margin = winScore > -900 && loseScore > -900 ? winScore - loseScore : 999;
    const wasClose = margin < 0.1 && margin >= 0;
    const wasDomination = margin > 0.3;

    sorted.forEach((t, arrIdx) => {
      const pair = pairsData[t.name][sub];
      const roles = rolesData[t.name][sub] || {};
      const p0 = pair[0], p1 = pair[1];
      const bnd = getBond(p0, p1);
      const sc = roundScores[t.name][sub];
      const wasDQ = sc <= -900;

      // Role-specific names for text flavor
      const ri = BLIND_ROLES[sub];
      const lead = roles[ri.primary] || p0;
      const support = roles[ri.secondary] || p1;

      if (arrIdx === 0) {
        // WON the sub-round
        let arrText;
        const marginCtx = wasClose ? ' By a hair.' : wasDomination ? ' And it wasn\'t even close.' : '';
        if (bnd <= 0) {
          arrText = _rp([
            `${subLabel} goes to them.${marginCtx} ${lead} and ${support} don't celebrate together — but neither can deny what just happened.`,
            `They won ${subLabel}.${marginCtx} ${lead} nods at ${support}. A grudging acknowledgment. Nothing more.`,
          ]);
        } else {
          arrText = _rp([
            `${subLabel} — THEY NAILED IT!${marginCtx} ${lead} and ${support} are pumped. The tribe roars.`,
            `"YES!" ${lead} and ${support} take ${subLabel}.${marginCtx} The confidence is building.`,
          ]);
        }
        phases[phaseKey].push({
          kind: 'event', _tribe: t.name, type: `blind-arrive-first-${sub}`,
          text: arrText, players: [lead, support], tribe: t.name
        });
        allEvents.push({ type: `blind-arrive-first-${sub}`, tribe: t.name, text: arrText });
      } else if (!wasDQ) {
        // LOST but completed
        let arrText;
        const loseCtx = wasClose ? ' It was razor-thin.' : wasDomination ? ' They got outclassed.' : '';
        if (bnd >= 3) {
          arrText = _rp([
            `${lead} and ${support} come up short on ${subLabel}.${loseCtx} ${support}: "We did our best." ${lead} nods. No blame.`,
            `The other team was ${wasClose ? 'just a tick faster' : 'better this time'}. ${lead} and ${support} take the loss gracefully. Move on.`,
          ]);
        } else if (bnd <= 0) {
          addBond(lead, support, -0.2);
          arrText = _rp([
            `"That was pathetic." ${lead} mutters after losing ${subLabel}. ${support}: "YOU were pathetic." Neither backs down.`,
            `Lost ${subLabel}.${loseCtx} ${lead} and ${support} won't look at each other. The blame is mutual and unspoken.`,
            `${support}: "If you'd actually done your job—" ${lead}: "If YOU'D trusted me—" Another pair imploding.`,
          ]);
        } else {
          arrText = _rp([
            `${subLabel} goes to the other team. ${lead} and ${support} shrug it off. "Next one."`,
            `Not their sub-round. ${lead} and ${support} walk back quietly. It stings, but it's not the end.`,
          ]);
        }
        phases[phaseKey].push({
          kind: 'event', _tribe: t.name, type: `blind-arrive-second-${sub}`,
          text: arrText, players: [lead, support], tribe: t.name
        });
        allEvents.push({ type: `blind-arrive-second-${sub}`, tribe: t.name, text: arrText });
      } else {
        // DQ or catastrophic failure
        let arrText;
        if (sub === 'round3a') {
          // Wild shooter DQ
          arrText = _rp([
            `DQ. ${lead} and ${support} stand in the wreckage. ${lead} still has the bow. Nobody wants to be near ${pronouns(lead).obj}.`,
            `Disqualified. ${support} is still shaking. ${lead} doesn't seem to understand what went wrong. Everyone else does.`,
          ]);
        } else if (sub === 'round3b') {
          // Catcher sabotage
          arrText = _rp([
            `${support} climbs out of the water, stung and furious. ${lead} doesn't offer a hand. The tribe watches in silence.`,
            `Jellyfish and betrayal. ${support} limps away. ${lead} stands alone. Nobody approaches ${pronouns(lead).obj}.`,
          ]);
        } else {
          // Toboggan DQ / rule break
          arrText = _rp([
            `DQ. The blindfold is off. The run is void. ${lead} and ${support} sit in the wrecked toboggan. No words.`,
            `Disqualified. ${support} rips off the blindfold too. "Great. Just great." ${lead} has nothing to say.`,
          ]);
        }
        phases[phaseKey].push({
          kind: 'event', _tribe: t.name, type: `blind-arrive-failed-${sub}`,
          text: arrText, players: [lead, support], tribe: t.name
        });
        allEvents.push({ type: `blind-arrive-failed-${sub}`, tribe: t.name, text: arrText });
      }
    });

    const subText = `${BLIND_LABELS[sub]}: ${sorted[0].name} wins!`;
    phases[phaseKey].push({ kind: 'event', _tribe: 'cross', type: `${sub}-result`, text: subText, players: [] });
  });

  // Determine round 3 overall winner (best of 3 sub-rounds)
  {
    const subWinCounts = {};
    tribes.forEach(t => { subWinCounts[t.name] = 0; });
    BLIND_SUBS.forEach(sub => { subWinCounts[subRoundWinners[sub]]++; });

    let r3Winner = null;
    const maxWins = Math.max(...Object.values(subWinCounts));
    const tied = Object.keys(subWinCounts).filter(k => subWinCounts[k] === maxWins);
    if (tied.length === 1) {
      r3Winner = tied[0];
    } else {
      // Tiebreak: total score across sub-rounds
      let bestTotal = -Infinity, bestTribe = null;
      tied.forEach(tn => {
        const total = BLIND_SUBS.reduce((sum, sub) => sum + (roundScores[tn][sub] || 0), 0);
        if (total > bestTotal) { bestTotal = total; bestTribe = tn; }
      });
      r3Winner = bestTribe;
    }
    roundWinners.round3 = r3Winner;

    const r3Text = `Round 3 — Blind Challenges: ${r3Winner} wins! (${subWinCounts[r3Winner]}/3 sub-rounds)`;
    timeline.push({ kind: 'event', type: 'round-result', round: 3, winner: r3Winner, text: r3Text });
  }

  // ══════════════════════════════════════════════════════════════════
  // HIDDEN MOMENTS — Redemption Act
  // ══════════════════════════════════════════════════════════════════
  {
    const REDEMPTION_ARCHETYPES = ['villain','schemer','hothead','chaos-agent'];
    // Find non-competing players (not in any pair for the current round — use round 3 since it's the most active)
    const allPaired = new Set();
    tribes.forEach(t => {
      Object.values(pairsData[t.name]).forEach(pair => { if (pair) pair.forEach(p => allPaired.add(p)); });
    });
    const bystanders = allMembers.filter(m => !allPaired.has(m) && gs.activePlayers.includes(m));
    const candidates = bystanders.filter(m => {
      const arch = players.find(p => p.name === m)?.archetype || '';
      return REDEMPTION_ARCHETYPES.includes(arch);
    });

    if (candidates.length > 0) {
      const candidate = candidates[Math.floor(Math.random() * candidates.length)];
      const sCand = pStats(candidate);
      const redemptionChance = sCand.loyalty * 0.02 + (10 - sCand.boldness) * 0.015 + Math.random() * 0.1;

      if (redemptionChance > 0.3) {
        // Find witness — highest intuition bystander (not the candidate)
        const witnesses = allMembers.filter(m => m !== candidate && gs.activePlayers.includes(m));
        let bestWitness = null, bestInt = -1;
        witnesses.forEach(w => {
          const sW = pStats(w);
          if (sW.intuition > bestInt) { bestInt = sW.intuition; bestWitness = w; }
        });

        if (bestWitness) {
          addBond(bestWitness, candidate, 0.5);
          personalScores[candidate] = (personalScores[candidate] || 0) + 1.0;
          personalScores[bestWitness] = (personalScores[bestWitness] || 0) + 0.5;

          const prCand = pronouns(candidate), prWit = pronouns(bestWitness);
          const archWit = players.find(p => p.name === bestWitness)?.archetype || '';
          const archCand = players.find(p => p.name === candidate)?.archetype || '';

          const kindAct = _rp([
            `${candidate} quietly helps an injured player off the sidelines. Nobody sees — except ${bestWitness}.`,
            `${candidate} finds a lost item and returns it without a word. ${bestWitness} watches from behind a tree.`,
            `${candidate} covers for someone's mistake during setup. ${bestWitness} catches the whole thing.`,
            `${candidate} brings water to someone sitting out with an injury. No cameras. No audience. Just kindness. ${bestWitness} sees it.`,
          ]);

          let witnessReaction = '';
          if (['hero','loyal-soldier'].includes(archWit)) {
            witnessReaction = _rp([
              `${bestWitness} (confessional): "I saw what ${candidate} did. Maybe ${prCand.sub} ${prCand.sub === 'they' ? 'aren\'t' : 'isn\'t'} so bad. I won't tell anyone."`,
              `${bestWitness} gains quiet respect for ${candidate}. Won't exploit it. Just... remembers.`,
            ]);
          } else if (['schemer','villain','mastermind'].includes(archWit)) {
            witnessReaction = _rp([
              `${bestWitness} (confessional): "Interesting. ${candidate} has a soft side. That could be useful."`,
              `${bestWitness} files this information away. Leverage. For later.`,
            ]);
          } else {
            witnessReaction = _rp([
              `${bestWitness} (confessional): "I saw what ${candidate} did. ${prCand.Sub} ${prCand.sub === 'they' ? 'aren\'t' : 'isn\'t'} who I thought ${prCand.sub} ${prCand.sub === 'they' ? 'were' : 'was'}."`,
              `${bestWitness} is surprised. ${candidate} being kind? That changes things.`,
            ]);
          }

          // Romance spark if witness has showmance/spark with candidate
          if (seasonConfig.romance === 'enabled') {
            const hasSpark = gs.romanticSparks?.some(s => s.players.includes(candidate) && s.players.includes(bestWitness));
            const hasShowmance = gs.showmances?.some(s => s.players.includes(candidate) && s.players.includes(bestWitness));
            if (hasSpark || hasShowmance) {
              witnessReaction += ` "You're actually nice." Something shifts between them.`;
              const spark = gs.romanticSparks?.find(s => s.players.includes(candidate) && s.players.includes(bestWitness));
              if (spark) spark.intensity = (spark.intensity || 0) + 0.3;
            }
          }

          redemptionData = { player: candidate, witness: bestWitness, act: kindAct, reaction: witnessReaction };

          phases.result.push({
            kind: 'event', _tribe: tribeOf[candidate] || 'cross', type: 'redemption-act',
            text: kindAct + ' ' + witnessReaction,
            players: [candidate, bestWitness], tribe: tribeOf[candidate] || ''
          });
          allEvents.push({ type: 'redemption-act', player: candidate, witness: bestWitness, text: kindAct });

          // Private camp event — confessional from witness
          const witTribe = tribeOf[bestWitness];
          if (witTribe && ep.campEvents[witTribe]) {
            ep.campEvents[witTribe].post.push({
              type: 'trustRedemptionWitness', players: [bestWitness, candidate],
              text: `${bestWitness} (confessional): "I saw ${candidate} do something nobody else saw. ${prCand.Sub} ${prCand.sub === 'they' ? 'aren\'t' : 'isn\'t'} who everyone thinks ${prCand.sub} ${prCand.sub === 'they' ? 'are' : 'is'}."`,
              consequences: 'Private bond +0.5. Asymmetric knowledge — witness knows, player doesn\'t know they were seen.',
              badgeText: 'WITNESS', badgeClass: 'gold'
            });
          }
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // POST-ROUND SOCIAL EVENTS
  // ══════════════════════════════════════════════════════════════════
  tribes.forEach(t => {
    // Post-round arguments (losing pairs with low temperament)
    ['round1', 'round2'].forEach(rk => {
      if (roundWinners[rk] !== t.name) {
        const pair = pairsData[t.name][rk];
        const s0 = pStats(pair[0]), s1 = pStats(pair[1]);
        if (s0.temperament <= 4 || s1.temperament <= 4) {
          addBond(pair[0], pair[1], -0.5);
          const arguer = s0.temperament <= s1.temperament ? pair[0] : pair[1];
          const other = arguer === pair[0] ? pair[1] : pair[0];
          const txt = _rp([
            `"This is YOUR fault." ${arguer} is in ${other}'s face. "MY fault? You couldn't even hold a ROPE."`,
            `The losing pair explodes. ${arguer} and ${other} go at it. Teammates pick sides.`,
            `"I SAID I should have done it." ${arguer} won't let it go. ${other} fires back. The camp is split.`,
          ]);
          // Tribe picks sides
          t.members.filter(m => m !== pair[0] && m !== pair[1]).forEach(m => {
            const bondA = getBond(m, pair[0]), bondB = getBond(m, pair[1]);
            if (bondA > bondB) addBond(m, pair[1], -0.1);
            else if (bondB > bondA) addBond(m, pair[0], -0.1);
          });
          phases[rk].push({ kind: 'event', _tribe: t.name, type: 'post-round-argument', text: txt, players: [...pair], tribe: t.name });
          allEvents.push({ type: 'post-round-argument', tribe: t.name, pair: [...pair], text: txt, round: rk });
          ep.campEvents[t.name].post.push({
            type: 'trustPostArgument', players: [...pair],
            text: txt, consequences: 'Bond -0.5. Tribe picks sides — camp rift.',
            badgeText: 'FIGHT', badgeClass: 'red'
          });
        }
      }
    });

    // Post-round bonding (winning pairs that started with low bond)
    ['round1', 'round2'].forEach(rk => {
      if (roundWinners[rk] === t.name) {
        const pair = pairsData[t.name][rk];
        const preBond = getBond(pair[0], pair[1]);
        if (preBond < 2) {
          addBond(pair[0], pair[1], 0.5);
          const txt = _rp([
            `"I didn't think we could do it." "Neither did I." ${pair[0]} and ${pair[1]} share a quiet moment.`,
            `Enemies who succeed together bond MORE than friends. ${pair[0]} and ${pair[1]} proved something today.`,
          ]);
          phases[rk].push({ kind: 'event', _tribe: t.name, type: 'grudging-respect', text: txt, players: [...pair], tribe: t.name });
          allEvents.push({ type: 'grudging-respect', tribe: t.name, pair: [...pair], text: txt, round: rk });
          ep.campEvents[t.name].post.push({
            type: 'trustGrudgingRespect', players: [...pair],
            text: txt, consequences: 'Bond +0.5. New alliance possibility from unexpected pair.',
            badgeText: 'RESPECT', badgeClass: 'green'
          });
        }
      }
    });

    // Spectator reactions to sabotage
    sabotageLog.filter(s => s.tribe === t.name).forEach(sab => {
      t.members.filter(m => m !== sab.saboteur && m !== sab.victim).forEach(m => {
        addBond(m, sab.saboteur, -0.3);
      });
      // Other tribe spectators also react
      allMembers.filter(m => tribeOf[m] !== t.name).forEach(m => {
        addBond(m, sab.saboteur, -0.15);
      });
    });
  });

  // Showmance check for trust challenge (partner-interaction theme)
  if (seasonConfig.romance === 'enabled') {
    _checkShowmanceChalMoment(ep, 'round2', phases, personalScores, 'partner-interaction', tribes);
  }

  // ══════════════════════════════════════════════════════════════════
  // WINNER DETERMINATION
  // ══════════════════════════════════════════════════════════════════
  const roundWinCounts = {};
  tribes.forEach(t => { roundWinCounts[t.name] = 0; });
  ['round1', 'round2', 'round3'].forEach(rk => {
    if (roundWinners[rk]) roundWinCounts[roundWinners[rk]]++;
  });

  let winner = null, loser = null;
  const maxRoundWins = Math.max(...Object.values(roundWinCounts));
  const winnerCandidates = tribes.filter(t => roundWinCounts[t.name] === maxRoundWins);

  if (winnerCandidates.length === 1) {
    winner = winnerCandidates[0];
  } else {
    // Tiebreak: total score across all rounds
    let bestTotal = -Infinity;
    winnerCandidates.forEach(t => {
      const total = Object.values(roundScores[t.name]).reduce((s, v) => s + (v > -900 ? v : 0), 0);
      if (total > bestTotal) { bestTotal = total; winner = t; }
    });
    if (!winner) winner = winnerCandidates[0];
  }

  // Loser: worst performing tribe
  const loserCandidates = tribes.filter(t => t !== winner);
  if (loserCandidates.length === 1) {
    loser = loserCandidates[0];
  } else {
    let worstWins = Infinity;
    loserCandidates.forEach(t => {
      if (roundWinCounts[t.name] < worstWins) { worstWins = roundWinCounts[t.name]; loser = t; }
    });
    if (!loser) {
      // Still tied — use total score
      let worstTotal = Infinity;
      loserCandidates.forEach(t => {
        const total = Object.values(roundScores[t.name]).reduce((s, v) => s + (v > -900 ? v : 0), 0);
        if (total < worstTotal) { worstTotal = total; loser = t; }
      });
    }
    if (!loser) loser = loserCandidates[0];
  }

  // MVP — highest personal score on winning team
  let mvp = null, mvpScore = -Infinity;
  winner.members.forEach(m => {
    if ((personalScores[m] || 0) > mvpScore) { mvpScore = personalScores[m] || 0; mvp = m; }
  });
  if (mvp) { if (!gs.popularity) gs.popularity = {}; gs.popularity[mvp] = (gs.popularity[mvp] || 0) + 2; } // trust challenge MVP

  // Final result timeline
  const finalText = `${winner.name} wins Who Can You Trust! (${roundWinCounts[winner.name]}/3 rounds). ${loser.name} goes to tribal council.${mvp ? ` MVP: ${mvp}.` : ''}`;
  phases.result.push({ kind: 'event', _tribe: 'cross', type: 'final-result', text: finalText, players: mvp ? [mvp] : [] });
  timeline.push({ kind: 'event', type: 'final-result', winner: winner.name, loser: loser.name, mvp, text: finalText });

  // ══════════════════════════════════════════════════════════════════
  // BUILD EPISODE DATA
  // ══════════════════════════════════════════════════════════════════
  ep.isTrustChallenge = true;
  ep.trustChallenge = {
    pairs: pairsData,
    roles: rolesData,
    negotiation: negotiationData,
    roundScores,
    roundWinners,
    rounds: {
      round1: { label: 'Extreme Rock Climb', pairs: {}, roles: {}, scores: {}, winner: roundWinners.round1, events: allEvents.filter(e => { const t = e.type || ''; if (e.round === 'round1') return true; return (t.startsWith('sabotage') || t.startsWith('climb') || t.startsWith('explosion') || t.startsWith('heroic') || t.startsWith('habanero') || t.startsWith('oil') || t.startsWith('summit') || t.startsWith('belayer')) && !t.includes('toboggan') && !t.includes('trapeze'); }) },
      round2: { label: 'Fugu Sashimi', pairs: {}, roles: {}, scores: {}, winner: roundWinners.round2, events: allEvents.filter(e => { if (e.round === 'round2') return true; return e.type?.includes('dish') || e.type?.includes('poison') || e.type?.includes('botch') || e.type?.includes('bravery') || e.type?.includes('cook') || e.type?.includes('eater') || e.type?.includes('standoff') || e.type?.includes('fugu') || e.type?.includes('suspicious'); }) },
      round3: { label: 'Three Blind Challenges', pairs: {}, roles: {}, scores: {}, winner: roundWinners.round3, events: allEvents.filter(e => e.type?.includes('shooter') || e.type?.includes('perfect-hit') || e.type?.includes('face-hit') || e.type?.includes('wild-') || e.type?.includes('catcher') || e.type?.includes('perfect-catch') || e.type?.includes('jelly') || e.type?.includes('trapeze') || e.type?.includes('toboggan') || e.type?.includes('frozen') || e.type?.includes('leap') || e.type?.includes('nav') || e.type?.includes('dq') || e.type?.includes('rule') || e.type?.includes('blind') || e.type?.includes('flinch') || e.type?.includes('explosion-dodge') || e.type?.includes('explosion-hit')) }
    },
    events: allEvents,
    timeline: (() => {
      // Build full timeline from phases (all events) + round results
      const _tl = [];
      // Round 1 events then result
      (phases.round1 || []).forEach(ev => _tl.push(ev));
      const _r1res = timeline.find(t => t.round === 1);
      if (_r1res) _tl.push(_r1res);
      // Round 2 events then result
      (phases.round2 || []).forEach(ev => _tl.push(ev));
      const _r2res = timeline.find(t => t.round === 2);
      if (_r2res) _tl.push(_r2res);
      // Round 3: sub-rounds interleaved with sub-results
      ['round3a', 'round3b', 'round3c'].forEach(rk => {
        (phases[rk] || []).forEach(ev => _tl.push(ev));
      });
      const _r3res = timeline.find(t => t.round === 3);
      if (_r3res) _tl.push(_r3res);
      // Post-round social events
      (phases.result || []).forEach(ev => _tl.push(ev));
      // Final result
      const _finalRes = timeline.find(t => t.type === 'final-result');
      if (_finalRes) _tl.push(_finalRes);
      return _tl;
    })(),
    sabotage: sabotageLog,
    poisoned: poisonedLog,
    ruleBreak: ruleBreakData,
    redemption: redemptionData,
    winner: winner.name,
    loser: loser.name,
    mvp
  };

  // Fill per-round pair/role/score data
  tribes.forEach(t => {
    ep.trustChallenge.rounds.round1.pairs[t.name] = pairsData[t.name].round1;
    ep.trustChallenge.rounds.round1.roles[t.name] = rolesData[t.name].round1;
    ep.trustChallenge.rounds.round1.scores[t.name] = roundScores[t.name].round1;
    ep.trustChallenge.rounds.round2.pairs[t.name] = pairsData[t.name].round2;
    ep.trustChallenge.rounds.round2.roles[t.name] = rolesData[t.name].round2;
    ep.trustChallenge.rounds.round2.scores[t.name] = roundScores[t.name].round2;
    ep.trustChallenge.rounds.round3.pairs[t.name] = { round3a: pairsData[t.name].round3a, round3b: pairsData[t.name].round3b, round3c: pairsData[t.name].round3c };
    ep.trustChallenge.rounds.round3.roles[t.name] = { round3a: rolesData[t.name].round3a, round3b: rolesData[t.name].round3b, round3c: rolesData[t.name].round3c };
    ep.trustChallenge.rounds.round3.scores[t.name] = { round3a: roundScores[t.name].round3a, round3b: roundScores[t.name].round3b, round3c: roundScores[t.name].round3c };
  });

  // ── Set episode properties ──
  ep.winner = winner;
  ep.loser = loser;
  ep.safeTribes = tribes.length > 2 ? tribes.filter(t => t !== winner && t !== loser) : [];
  ep.challengeType = 'tribe';
  ep.immunePlayers = winner.members.slice();
  ep.tribalPlayers = loser.members.filter(m => gs.activePlayers.includes(m));
  ep.challengeLabel = "Who Can You Trust?";
  ep.challengeCategory = 'social';

  // ── Challenge member scores ──
  ep.chalMemberScores = personalScores;
  updateChalRecord(ep);
}

export function _textTrustChallenge(ep, ln, sec) {
  if (!ep.isTrustChallenge || !ep.trustChallenge) return;
  const tc = ep.trustChallenge;
  sec('WHO CAN YOU TRUST?');
  ln('Three-round trust challenge: Rock Climb, Fugu Sashimi, Three Blind Challenges.');
  ln('');

  // Round 1 — Rock Climb
  ln('── ROUND 1: EXTREME ROCK CLIMB ──');
  Object.entries(tc.rounds?.round1?.pairs || {}).forEach(([tribe, pair]) => {
    if (!pair) return;
    const roles = tc.rounds?.round1?.roles?.[tribe];
    const score = tc.rounds?.round1?.scores?.[tribe];
    const climber = roles?.climber || pair[0];
    const belayer = roles?.belayer || pair[1];
    const scoreTxt = score > -900 ? score.toFixed(3) : 'AUTO-LOSS';
    ln(`  ${tribe}: ${climber} (climber) + ${belayer} (belayer) → ${scoreTxt}`);
  });
  if (tc.rounds?.round1?.winner) ln(`  Round 1 Winner: ${tc.rounds.round1.winner}`);

  // Round 2 — Fugu Sashimi
  ln('');
  ln('── ROUND 2: FUGU SASHIMI ──');
  Object.entries(tc.rounds?.round2?.pairs || {}).forEach(([tribe, pair]) => {
    if (!pair) return;
    const roles = tc.rounds?.round2?.roles?.[tribe];
    const score = tc.rounds?.round2?.scores?.[tribe];
    const cook = roles?.cook || pair[0];
    const eater = roles?.eater || pair[1];
    const scoreTxt = score > -900 ? score.toFixed(3) : 'AUTO-LOSS';
    ln(`  ${tribe}: ${cook} (cook) + ${eater} (eater) → ${scoreTxt}`);
  });
  if (tc.rounds?.round2?.winner) ln(`  Round 2 Winner: ${tc.rounds.round2.winner}`);

  // Round 3 — Three Blind Challenges
  ln('');
  ln('── ROUND 3: THREE BLIND CHALLENGES ──');
  const SUB_LABELS = { round3a: 'William Tell', round3b: 'Trapeze', round3c: 'Toboggan' };
  ['round3a','round3b','round3c'].forEach(sub => {
    ln(`  ${SUB_LABELS[sub]}:`);
    Object.entries(tc.rounds?.round3?.pairs || {}).forEach(([tribe, subPairs]) => {
      const pair = subPairs?.[sub];
      const roles = tc.rounds?.round3?.roles?.[tribe]?.[sub];
      const score = tc.rounds?.round3?.scores?.[tribe]?.[sub];
      if (!pair) return;
      const roleStr = roles ? Object.entries(roles).map(([r, p]) => `${p} (${r})`).join(' + ') : pair.join(' + ');
      const scoreTxt = score !== undefined && score > -900 ? score.toFixed(3) : score !== undefined ? 'AUTO-LOSS' : '?';
      ln(`    ${tribe}: ${roleStr} → ${scoreTxt}`);
    });
  });
  if (tc.rounds?.round3?.winner) ln(`  Round 3 Winner: ${tc.rounds.round3.winner}`);

  // Events
  if (tc.events?.length) {
    ln('');
    ln('── NOTABLE EVENTS ──');
    tc.events.forEach(evt => {
      ln(`  [${evt.type}] ${evt.text}`);
    });
  }

  // Sabotage
  if (tc.sabotage?.length) {
    ln('');
    ln('── SABOTAGE ──');
    tc.sabotage.forEach(s => {
      ln(`  ${s.type.toUpperCase()} — ${s.saboteur} → ${s.victim || '?'} (${s.round}, ${s.tribe})`);
    });
  }

  // Poisoned
  if (tc.poisoned?.length) {
    ln('');
    tc.poisoned.forEach(p => {
      ln(`  POISONED: ${p.eater} by ${p.cook} (${p.deliberate ? 'deliberate' : 'accidental'})`);
    });
  }

  // Rule break
  if (tc.ruleBreak) {
    ln(`  RULE BREAK DQ: ${tc.ruleBreak.driver} (${tc.ruleBreak.sub}, ${tc.ruleBreak.tribe})`);
  }

  // Redemption
  if (tc.redemption) {
    ln('');
    ln(`  [HIDDEN MOMENT] ${tc.redemption.act}`);
    ln(`  Witnessed by ${tc.redemption.witness}: ${tc.redemption.reaction}`);
  }

  ln('');
  ln(`Winner: ${tc.winner}. ${tc.loser} goes to tribal.`);
  if (tc.mvp) ln(`MVP: ${tc.mvp}`);
}

export function rpBuildTrustChallenge(ep) {
  const tc = ep.trustChallenge;
  if (!tc) return null;

  const stateKey = 'tc_reveal_' + ep.num;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const _tcReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  const tribeNames = Object.keys(tc.pairs || {});
  const CYAN = '#38bdf8';
  const SUB_LABELS = { round3a: '🎯 BLIND WILLIAM TELL', round3b: '🎪 BLIND TRAPEZE', round3c: '🛷 BLIND TOBOGGAN' };
  const ROLE_EMOJIS = { climber: '🧗', belayer: '🪢', cook: '🔪', eater: '😰', shooter: '🏹', target: '🎯', catcher: '🤲', jumper: '🤸', navigator: '🧭', driver: '🛷' };

  // ── Build rich timeline steps from available data ──
  const steps = [];

  // Step builder: pair reveal for a round
  const addPairReveal = (roundKey, label, roundColor) => {
    steps.push({ stepType: 'round-header', roundKey, label, color: roundColor });
    // Pair cards for this round
    if (roundKey === 'round3') {
      ['round3a','round3b','round3c'].forEach(sub => {
        steps.push({ stepType: 'sub-round-header', sub, label: SUB_LABELS[sub], color: '#8b5cf6' });
        steps.push({ stepType: 'pair-cards', roundKey, sub });
        // Negotiation events for sub-round
        tribeNames.forEach(tn => {
          const neg = tc.negotiation?.[tn]?.[sub];
          if (neg?.event) steps.push({ stepType: 'event', data: { type: 'negotiation-' + sub, text: neg.event, tribe: tn, _tribe: tn } });
        });
        // Drama events for this sub-round
        const subEvents = (tc.rounds?.round3?.events || []).filter(e => {
          const t = e.type || '';
          if (sub === 'round3a') return t.includes('shooter') || t.includes('perfect-hit') || t.includes('face-hit') || t.includes('wild-') || t.includes('flinch') || t.includes('round3a');
          if (sub === 'round3b') return t.includes('catcher') || t.includes('perfect-catch') || t.includes('leap') || t.includes('jelly') || t.includes('trapeze') || t.includes('frozen') || t.includes('round3b');
          if (sub === 'round3c') return t.includes('nav') || t.includes('toboggan') || t.includes('driver') || t.includes('dq') || t.includes('rule') || t.includes('round3c');
          return false;
        });
        subEvents.forEach(evt => { steps.push({ stepType: 'event', data: evt }); });
      });
    } else {
      steps.push({ stepType: 'pair-cards', roundKey, sub: null });
      // Negotiation events
      tribeNames.forEach(tn => {
        const neg = tc.negotiation?.[tn]?.[roundKey];
        if (neg?.event) steps.push({ stepType: 'event', data: { type: 'negotiation-' + roundKey, text: neg.event, tribe: tn, _tribe: tn } });
      });
      // Drama events for this round
      const roundEvents = tc.rounds?.[roundKey]?.events || [];
      roundEvents.forEach(evt => { steps.push({ stepType: 'event', data: evt }); });
    }
    // Round result from timeline
    const roundNum = roundKey === 'round1' ? 1 : roundKey === 'round2' ? 2 : 3;
    const resultItem = (tc.timeline || []).find(t => t.type === 'round-result' && t.round === roundNum);
    if (resultItem) steps.push({ stepType: 'round-result', data: resultItem, color: roundColor });
  };

  addPairReveal('round1', '🧗 ROUND 1 — EXTREME ROCK CLIMB', '#f85149');
  addPairReveal('round2', '🐡 ROUND 2 — FUGU SASHIMI', '#f0a500');
  addPairReveal('round3', '🎯 ROUND 3 — THREE BLIND CHALLENGES', '#8b5cf6');

  // Events not captured by round filtering (post-round arguments, grudging respect, etc.)
  const roundEventTypes = new Set((tc.rounds?.round1?.events || []).concat(tc.rounds?.round2?.events || []).concat(tc.rounds?.round3?.events || []).map(e => e.type + '|' + e.text));
  const unclaimedEvents = (tc.events || []).filter(evt => !roundEventTypes.has(evt.type + '|' + evt.text) && evt.type !== 'redemption-act');
  if (unclaimedEvents.length) {
    unclaimedEvents.forEach(evt => { steps.push({ stepType: 'event', data: evt }); });
  }

  // Redemption
  if (tc.redemption) steps.push({ stepType: 'redemption', data: tc.redemption });

  // Final scoreboard
  steps.push({ stepType: 'final', data: {} });

  const totalSteps = steps.length;
  const _nonHeaderTypes = new Set(['round-header', 'sub-round-header']);
  const _revealableCount = steps.filter(s => !_nonHeaderTypes.has(s.stepType)).length;
  const allRevealed = state.idx >= totalSteps - 1;
  // Find next revealable step (skip headers)
  let _nextIdx = state.idx + 1;
  while (_nextIdx < totalSteps && _nonHeaderTypes.has(steps[_nextIdx]?.stepType)) _nextIdx++;

  // ── Helper: event border color ──
  const evtBorderColor = (evt) => {
    const t = evt.type || '';
    if (['sabotage-humiliation','sabotage-ropedrop','deliberate-botch','catcher-sabotage','rule-break-dq','nav-sabotage-caught','nav-sabotage-hidden','climb-arrive-blame','fugu-arrive-blame'].includes(t)) return '#f85149';
    if (['poison-honest','poison-negligent','eater-refused','habanero-fail','oil-crash','jellyfish-fall','jellyfish-sorry','frozen-refuse','wild-shooter','face-hit','explosion-fail','belayer-distracted','cook-panic','trust-leap-miss','climb-fall','climb-arrive-failed','fugu-arrive-failed'].includes(t)) return '#f0a500';
    if (['heroic-catch','eater-bravery','perfect-dish','belayer-encourage','perfect-hit','perfect-catch','trust-leap-caught','summit-rivals','summit-success','cook-confidence-delivers','explosion-pass','habanero-pass','habanero-save','oil-pass','oil-caught','frozen-jump','explosion-dodge','nav-screaming-ignore','cook-panic-saved','grudging-respect','climb-setup','climb-arrive-first','climb-arrive-second','fugu-setup','fugu-arrive-first','fugu-arrive-second'].includes(t)) return '#3fb950';
    if (['redemption-act'].includes(t)) return '#faca15';
    if (t.includes('negotiation')) return '#58a6ff';
    if (t.includes('trapeze-catcher-ready') || t.includes('trapeze-climb-bold') || t.includes('trapeze-leap-aftermath') || t.includes('trapeze-messy-catch')) return '#3fb950';
    if (t.includes('trapeze-catcher-shaky') || t.includes('trapeze-climb-scared') || t.includes('trapeze-bad-call') || t.includes('trapeze-miss-aftermath') || t.includes('trapeze-sabotage-aftermath') || t.includes('trapeze-distraction') || t.includes('trapeze-wind')) return '#f0a500';
    if (t.includes('toboggan-launch-clean') || t.includes('toboggan-explosion-dodge') || t.includes('toboggan-turn-clean') || t.includes('toboggan-water-clear') || t.includes('toboggan-mud-dodge') || t.includes('toboggan-jump-send') || t.includes('toboggan-finish-strong')) return '#3fb950';
    if (t.includes('toboggan-launch-rough') || t.includes('toboggan-explosion-hit') || t.includes('toboggan-turn-crash') || t.includes('toboggan-water-stall') || t.includes('toboggan-mud-stuck') || t.includes('toboggan-wipeout') || t.includes('toboggan-jump-chicken')) return '#f0a500';
    if (t.includes('blind-arrive-first')) return '#3fb950';
    if (t.includes('blind-arrive-failed')) return '#f0a500';
    if (t.includes('blind-arrive-second')) return '#8b949e';
    if (t.includes('toboggan-launch-ok') || t.includes('toboggan-finish')) return '#8b5cf6';
    if (t.includes('blind') || t.includes('target-flinch')) return '#8b5cf6';
    if (t.includes('post-round-argument')) return '#f85149';
    if (t.includes('you-first-standoff') || t.includes('suspicious')) return '#f0a500';
    return CYAN;
  };

  // ── Helper: extract player names from event data ──
  const evtPlayers = (evt) => {
    if (evt.players?.length) return evt.players;
    const names = [];
    if (evt.saboteur) names.push(evt.saboteur);
    if (evt.victim) names.push(evt.victim);
    if (evt.cook) names.push(evt.cook);
    if (evt.catcher) names.push(evt.catcher);
    if (evt.fallen) names.push(evt.fallen);
    if (evt.shooter) names.push(evt.shooter);
    if (evt.navigator) names.push(evt.navigator);
    if (evt.driver) names.push(evt.driver);
    if (evt.pair?.length) names.push(...evt.pair);
    // Fallback: try to get pair from tribe + round data
    if (!names.length && evt.tribe) {
      const t = evt.type || '';
      let rk = null;
      if (t.includes('climb') || t.includes('belayer') || t.includes('summit') || t.includes('explosion') || t.includes('habanero') || t.includes('oil') || t.includes('rope')) rk = 'round1';
      else if (t.includes('cook') || t.includes('dish') || t.includes('eater') || t.includes('poison') || t.includes('botch') || t.includes('standoff') || t.includes('panic')) rk = 'round2';
      if (rk) {
        const pair = tc.rounds?.[rk]?.pairs?.[evt.tribe];
        if (pair?.length) names.push(...pair);
      }
    }
    return names;
  };

  // ── Helper: trust meter bar ──
  const trustMeter = (a, b) => {
    const bond = getBond(a, b);
    const sA = pStats(a), sB = pStats(b);
    const trustPct = Math.max(2, Math.min(100, (bond * 0.05 + ((sA?.loyalty || 5) + (sB?.loyalty || 5)) / 2 * 0.04) * 100));
    const bondLabel = bond <= 0 ? 'rivals' : bond <= 3 ? 'uncertain' : 'allies';
    const bondEmoji = bond <= 0 ? '💔' : bond <= 3 ? '❓' : '🔗';
    const bondColor = bond <= 0 ? '#f85149' : bond <= 3 ? '#8b949e' : '#58a6ff';
    return `<div style="margin-top:6px">
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:4px">
        <span style="font-size:14px">${bondEmoji}</span>
        <span style="font-size:9px;color:${bondColor};font-weight:700;text-transform:uppercase">${bondLabel}</span>
        <span style="font-size:9px;color:#6e7681">(${bond.toFixed(1)})</span>
      </div>
      <div style="height:6px;border-radius:3px;background:#21262d;overflow:hidden;position:relative">
        <div style="height:100%;width:${trustPct}%;background:linear-gradient(90deg,#f85149,#f0a500,#3fb950);border-radius:3px;transition:width 0.5s ease"></div>
      </div>
    </div>`;
  };

  // ── Helper: pair card with portraits, bond indicator, role badges, trust meter ──
  const pairCard = (tname, pair, roles, score, accentColor) => {
    if (!pair || pair.length < 2) return '';
    const roleEntries = roles ? Object.entries(roles) : [];
    // Order portraits by role (primary role left, secondary right) so they match role labels
    const left = roleEntries.length >= 2 ? roleEntries[0][1] : pair[0];
    const right = roleEntries.length >= 2 ? roleEntries[1][1] : pair[1];
    return `<div style="flex:1;min-width:160px;padding:12px;border-radius:10px;border:1px solid ${accentColor}33;background:${accentColor}08;text-align:center">
      <div style="font-size:9px;font-weight:700;color:${accentColor};margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid ${accentColor}22;padding-bottom:4px">${tname}</div>
      <div style="display:flex;gap:4px;justify-content:center;align-items:center;margin-bottom:6px">
        ${rpPortrait(left, 'pb-sm')}
        <div style="font-size:16px;margin:0 2px">${getBond(pair[0], pair[1]) <= 0 ? '💔' : getBond(pair[0], pair[1]) <= 3 ? '❓' : '🔗'}</div>
        ${rpPortrait(right, 'pb-sm')}
      </div>
      <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-bottom:6px">
        ${roleEntries.map(([role, player]) => `<span style="font-size:9px;background:${accentColor}18;color:${accentColor};padding:2px 6px;border-radius:4px;font-weight:700;text-transform:uppercase">${ROLE_EMOJIS[role] || ''} ${role}: ${player.split(' ')[0]}</span>`).join('')}
      </div>
      ${trustMeter(pair[0], pair[1])}
    </div>`;
  };

  // ══════════════════════════════════════════════════════════════════
  // PAGE HEADER
  // ══════════════════════════════════════════════════════════════════
  let html = `<div class="rp-page" style="background:linear-gradient(180deg,#001a2e 0%,#0d1117 40%,#0d1117 100%);padding-bottom:60px">
    <div class="rp-eyebrow" style="color:${CYAN}">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:3px;text-align:center;color:${CYAN};animation:trustGlow 2.5s ease-in-out infinite;margin-bottom:4px">
      WHO CAN YOU TRUST?
    </div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:6px">
      ${tribeNames.map(tn => `<span style="color:${tribeColor(tn)};font-weight:700">${tn}</span>`).join(' <span style="color:#6e7681">vs</span> ')}
    </div>
    <div style="text-align:center;font-size:10px;color:#6e7681;margin-bottom:20px">Three rounds. Two-person trust pairs. One tribe goes to tribal.</div>`;

  // ══════════════════════════════════════════════════════════════════
  // CLICK-TO-REVEAL TIMELINE
  // ══════════════════════════════════════════════════════════════════
  html += `<div style="margin-bottom:16px">`;

  steps.forEach((step, i) => {
    const isVisible = i <= state.idx;

    // ── ROUND HEADER — always visible, doesn't count as a reveal step ──
    if (step.stepType === 'round-header') {
      html += `<div style="text-align:center;padding:14px 0 6px;margin:16px 0 8px;border-top:2px solid ${step.color}33">
        <div style="font-family:var(--font-display);font-size:16px;letter-spacing:2px;color:${step.color};text-shadow:0 0 15px ${step.color}33">${step.label}</div>
      </div>`;
      return;
    }

    // ── SUB-ROUND HEADER — always visible ──
    if (step.stepType === 'sub-round-header') {
      html += `<div style="text-align:center;padding:8px 0 4px;margin:10px 0 6px;border-top:1px dashed ${step.color}22">
        <span style="font-size:12px;font-weight:700;letter-spacing:1.5px;color:${step.color}">${step.label}</span>
      </div>`;
      return;
    }

    // Hidden placeholder for unrevealed steps
    if (!isVisible) {
      html += `<div style="padding:10px;margin-bottom:4px;border:1px solid var(--border);border-radius:6px;opacity:0.08;text-align:center;cursor:pointer"
        onclick="${_tcReveal(i)}">
        <span style="font-size:11px;color:var(--muted)">▶</span>
      </div>`;
      return;
    }

    // ── PAIR CARDS ──
    if (step.stepType === 'pair-cards') {
      html += `<div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">`;
      tribeNames.forEach(tn => {
        const tcol = tribeColor(tn);
        if (step.roundKey === 'round3' && step.sub) {
          const pair = tc.rounds?.round3?.pairs?.[tn]?.[step.sub];
          const roles = tc.rounds?.round3?.roles?.[tn]?.[step.sub];
          const score = tc.rounds?.round3?.scores?.[tn]?.[step.sub];
          if (pair) html += pairCard(tn, pair, roles, score, tcol);
        } else if (step.roundKey !== 'round3') {
          const pair = tc.rounds?.[step.roundKey]?.pairs?.[tn];
          const roles = tc.rounds?.[step.roundKey]?.roles?.[tn];
          const score = tc.rounds?.[step.roundKey]?.scores?.[tn];
          html += pairCard(tn, pair, roles, score, tcol);
        }
      });
      html += `</div>`;
      return;
    }

    // ── EVENT CARD ──
    if (step.stepType === 'event') {
      const evt = step.data;
      const border = evtBorderColor(evt);
      const pList = evtPlayers(evt);
      const evtType = evt.type || '';
      const badge = evt.badge || evt.badgeText || (evtType.includes('negotiation') ? 'NEGOTIATION' : evtType.includes('sabotage') || evtType.includes('botch') ? 'SABOTAGE' : evtType.includes('heroic') || evtType.includes('save') ? 'HEROIC' : evtType.includes('poison') ? 'POISON' : evtType.includes('perfect') ? 'PERFECT' : evtType.includes('panic') ? 'PANIC' : evtType.includes('argument') ? 'ARGUMENT' : evtType.includes('respect') ? 'BONDING' : evtType.includes('setup') ? 'SETUP' : evtType.includes('-fall') || evtType.includes('wipeout') ? 'FALL' : evtType.includes('arrive') ? 'ARRIVAL' : evtType.includes('blame') ? 'BLAME' : evtType.includes('trapeze-catcher') ? 'PREP' : evtType.includes('trapeze-climb') ? 'CLIMB' : evtType.includes('trapeze-distraction') || evtType.includes('trapeze-wind') ? 'DISTRACTION' : evtType.includes('trapeze-bad-call') ? 'BAD CALL' : evtType.includes('trapeze-messy') ? 'CATCH' : evtType.includes('trapeze-leap') || evtType.includes('trapeze-miss') ? 'AFTERMATH' : evtType.includes('toboggan-launch') ? 'LAUNCH' : evtType.includes('toboggan-finish') ? 'FINISH' : evtType.includes('toboggan-jump') ? 'JUMP' : evtType.includes('toboggan-explosion') || evtType.includes('toboggan-turn') || evtType.includes('toboggan-water') || evtType.includes('toboggan-mud') ? 'OBSTACLE' : evtType.includes('rule-break') ? 'DQ' : null);
      const tribeLabel = evt.tribe || evt._tribe || '';
      const tribeLabelColor = tribeLabel && tribeLabel !== 'cross' ? tribeColor(tribeLabel) : '#8b949e';

      html += `<div style="padding:10px 12px;border-radius:8px;border-left:3px solid ${border};background:rgba(255,255,255,0.03);margin-bottom:8px;animation:scrollDrop 0.3s var(--ease-broadcast) both">`;
      // Tribe label + badge row
      html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap">`;
      if (tribeLabel && tribeLabel !== 'cross') {
        html += `<span style="font-size:8px;font-weight:700;color:${tribeLabelColor};text-transform:uppercase;letter-spacing:0.5px">${tribeLabel}</span>`;
      }
      if (badge) {
        html += `<span style="font-size:8px;font-weight:800;letter-spacing:0.5px;color:${border};background:${border}18;padding:1px 6px;border-radius:3px">${badge}</span>`;
      }
      html += `</div>`;
      // Player portraits
      if (pList.length) {
        html += `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">`;
        pList.forEach(p => { html += rpPortrait(p, 'pb-sm'); });
        html += `</div>`;
      }
      // Narrative text
      html += `<div style="font-size:11px;color:#c9d1d9;line-height:1.6">${evt.text || ''}</div>`;
      html += `</div>`;
      return;
    }

    // ── ROUND RESULT ──
    if (step.stepType === 'round-result') {
      const rd = step.data;
      const winTribe = rd.winner;
      const winColor = winTribe ? tribeColor(winTribe) : '#3fb950';
      html += `<div style="padding:12px;border-radius:10px;border:2px solid ${winColor}44;background:linear-gradient(135deg,${winColor}10,transparent);margin-bottom:12px;text-align:center;animation:scrollDrop 0.3s var(--ease-broadcast) both">
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#8b949e;text-transform:uppercase;margin-bottom:4px">Round ${rd.round} Result</div>
        <div style="font-size:14px;font-weight:700;color:${winColor};margin-bottom:4px">
          🏆 <span style="color:${winColor}">${winTribe}</span> WINS!
        </div>
        <div style="font-size:11px;color:#c9d1d9;line-height:1.5">${rd.text || ''}</div>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:8px">`;
      // Show scores for all tribes
      tribeNames.forEach(tn => {
        const tcol = tribeColor(tn);
        const isWin = tn === winTribe;
        let scoreVal;
        if (rd.round === 3) {
          const sub3 = tc.rounds?.round3?.scores?.[tn] || {};
          scoreVal = Object.values(sub3).reduce((s, v) => s + (v > -900 ? v : 0), 0);
        } else {
          const rk = 'round' + rd.round;
          scoreVal = tc.roundScores?.[tn]?.[rk];
        }
        const scoreTxt = scoreVal !== undefined && scoreVal > -900 ? scoreVal.toFixed(2) : 'DQ';
        html += `<div style="padding:6px 12px;border-radius:6px;border:1px solid ${tcol}${isWin ? '55' : '22'};background:${tcol}${isWin ? '15' : '05'}">
          <div style="font-size:9px;font-weight:700;color:${tcol}">${tn}</div>
          <div style="font-size:16px;font-weight:700;color:${isWin ? '#3fb950' : '#8b949e'}">${scoreTxt}</div>
          <div style="font-size:12px">${isWin ? '✓' : '✗'}</div>
        </div>`;
      });
      html += `</div></div>`;
      return;
    }

    // ── REDEMPTION / HIDDEN MOMENT ──
    if (step.stepType === 'redemption') {
      const r = step.data;
      html += `<div style="padding:14px;border-radius:10px;border:2px solid rgba(250,204,21,0.4);background:rgba(250,204,21,0.05);margin-bottom:12px;animation:secretGlow2 3s ease-in-out infinite">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <span style="font-size:14px">🔒</span>
          <span style="font-size:10px;font-weight:700;letter-spacing:1px;color:#faca15;text-transform:uppercase">Private Moment</span>
          <span style="font-size:9px;color:#8b949e;font-style:italic">Only ${r.witness} saw this</span>
        </div>
        <div style="display:flex;gap:10px;align-items:flex-start">
          ${rpPortrait(r.player, 'pb-sm')}
          <div style="flex:1">
            <div style="font-size:11px;color:#e6edf3;margin-bottom:4px;line-height:1.6">${r.act}</div>
            <div style="font-size:10px;color:#8b949e;font-style:italic;line-height:1.5">${r.reaction}</div>
            <div style="display:flex;gap:6px;align-items:center;margin-top:6px">
              ${rpPortrait(r.witness, 'pb-sm')}
              <span style="font-size:9px;color:#faca15;font-weight:700">WITNESS</span>
            </div>
          </div>
        </div>
      </div>`;
      return;
    }

    // ── FINAL SCOREBOARD ──
    if (step.stepType === 'final') {
      const winnerColor = tribeColor(tc.winner);
      const loserColor = tc.loser ? tribeColor(tc.loser) : '#f85149';
      const ROUNDS = ['round1', 'round2', 'round3'];
      const ROUND_NAMES = { round1: 'Rock Climb', round2: 'Fugu Sashimi', round3: 'Blind Challenges' };

      // Winner celebration
      html += `<div style="text-align:center;padding:16px;margin-bottom:12px;border-radius:10px;border:2px solid ${winnerColor};background:linear-gradient(135deg,${winnerColor}15,transparent);animation:scrollDrop 0.4s var(--ease-broadcast) both">
        <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;color:${winnerColor};text-shadow:0 0 15px ${winnerColor}44;margin-bottom:4px">
          🏆 ${tc.winner} WINS
        </div>
        <div style="font-size:11px;color:#8b949e;margin-bottom:4px">Who Can You Trust? — Immunity secured.</div>
        <div style="font-size:11px;color:${loserColor};font-weight:700">${tc.loser} → Tribal Council</div>
      </div>`;

      // Scoreboard grid
      html += `<div style="padding:14px;border-radius:10px;border:1px solid ${CYAN}33;background:rgba(56,189,248,0.04);margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:${CYAN};text-align:center;margin-bottom:12px;text-transform:uppercase">Final Scoreboard</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">`;
      tribeNames.forEach(tn => {
        const ttc = tribeColor(tn);
        html += `<div style="flex:1;min-width:130px;text-align:center;padding:12px;border-radius:8px;border:1px solid ${ttc}33;background:${ttc}08">
          <div style="font-size:11px;font-weight:700;color:${ttc};margin-bottom:10px;text-transform:uppercase">${tn}</div>`;
        ROUNDS.forEach(rk => {
          const won = tc.rounds?.[rk]?.winner === tn;
          html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 8px;margin-bottom:3px;border-radius:4px;background:${won ? '#3fb95010' : '#f8514910'}">
            <span style="font-size:9px;color:#8b949e">${ROUND_NAMES[rk]}</span>
            <span style="font-size:14px;font-weight:700;color:${won ? '#3fb950' : '#f85149'}">${won ? '✓' : '✗'}</span>
          </div>`;
        });
        const wins = ROUNDS.filter(rk => tc.rounds?.[rk]?.winner === tn).length;
        html += `<div style="border-top:1px solid ${ttc}33;margin-top:8px;padding-top:8px">
            <div style="font-size:9px;color:#8b949e;text-transform:uppercase">Rounds Won</div>
            <div style="font-size:32px;font-weight:700;color:${ttc}">${wins}<span style="font-size:14px;color:#6e7681">/3</span></div>
          </div>`;
        if (tn === tc.winner) {
          html += `<div style="margin-top:6px;padding:3px 10px;border-radius:4px;background:#3fb95022;color:#3fb950;font-size:10px;font-weight:700;display:inline-block">🏆 WINNER</div>`;
        } else if (tn === tc.loser) {
          html += `<div style="margin-top:6px;padding:3px 10px;border-radius:4px;background:#f8514922;color:#f85149;font-size:10px;font-weight:700;display:inline-block">TRIBAL COUNCIL</div>`;
        }
        html += `</div>`;
      });
      html += `</div></div>`;

      // MVP card
      if (tc.mvp) {
        html += `<div style="padding:14px;border-radius:10px;border:2px solid #f0a500;background:rgba(240,165,0,0.06);text-align:center;margin-bottom:12px">
          <div style="font-size:18px;margin-bottom:4px">⭐</div>
          <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#f0a500;text-transform:uppercase;margin-bottom:6px">Challenge MVP</div>
          ${rpPortrait(tc.mvp)}
        </div>`;
      }

      // Sabotage log
      if (tc.sabotage?.length) {
        html += `<div style="padding:12px;border-radius:8px;border:1px solid rgba(248,81,73,0.3);background:rgba(248,81,73,0.04);margin-bottom:10px">
          <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#f85149;margin-bottom:8px">🗡️ SABOTAGE LOG</div>`;
        tc.sabotage.forEach(s => {
          html += `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid rgba(248,81,73,0.1)">
            ${rpPortrait(s.saboteur, 'pb-sm')}
            <div>
              <span style="font-size:9px;color:#f85149;font-weight:700">${(s.type || '').toUpperCase()}</span>
              <span style="font-size:10px;color:#c9d1d9"> ${s.saboteur} → ${s.victim || '?'}</span>
              <span style="font-size:9px;color:#6e7681"> (${s.tribe}, ${s.round})</span>
            </div>
          </div>`;
        });
        html += `</div>`;
      }

      // Poisoned log
      if (tc.poisoned?.length) {
        html += `<div style="padding:12px;border-radius:8px;border:1px solid rgba(240,165,0,0.3);background:rgba(240,165,0,0.04);margin-bottom:10px">
          <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#f0a500;margin-bottom:8px">☠️ POISONED</div>`;
        tc.poisoned.forEach(p => {
          html += `<div style="font-size:10px;color:#c9d1d9;padding:3px 0">
            <span style="color:#f0a500;font-weight:700">${p.deliberate ? 'DELIBERATE' : 'ACCIDENTAL'}</span>
            — ${p.eater} poisoned by ${p.cook}
          </div>`;
        });
        html += `</div>`;
      }

      return;
    }
  });

  html += `</div>`; // close timeline container

  // ── REVEAL BUTTONS ──
  if (!allRevealed) {
    html += `<div style="position:sticky;bottom:0;background:linear-gradient(transparent,#0d1117 30%);padding:16px 0 8px;display:flex;gap:8px;justify-content:center">
      <button class="rp-btn" onclick="${_tcReveal(_nextIdx)}">NEXT</button>
      <button class="rp-btn" style="opacity:0.5" onclick="${_tcReveal(totalSteps - 1)}">REVEAL ALL</button>
    </div>`;
  }

  html += `</div>`; // close rp-page
  return html;
}

