// js/chal/cliff-dive.js
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';

export function simulateCliffDive(ep) {
  const tribes = gs.tribes;
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const host = seasonConfig.host || 'Chris';

  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });

  const tribeResults = [];

  tribes.forEach(tribe => {
    const members = [...tribe.members].sort(() => Math.random() - 0.5);
    const jumpers = [];
    const chickens = [];
    const reactions = [];
    let momentum = 0;

    // ── Phase 1a: Initial jump decisions ──
    members.forEach(name => {
      const s = pStats(name);
      const pr = pronouns(name);

      // Tuned so mid-stat players chicken ~35% (feeds convince/force system, targets 3-7 final chickens)
      let jumpChance = s.boldness * 0.05 + s.physical * 0.02 + s.loyalty * 0.02 + 0.08;

      // Cascade from momentum (cap negative to prevent cowardice spirals)
      jumpChance += Math.max(-2, momentum) * 0.04;

      // Clamp
      jumpChance = Math.max(0.05, Math.min(0.95, jumpChance));

      const jumped = Math.random() < jumpChance;

      if (jumped) {
        jumpers.push(name);
        momentum++;
        const tier = s.boldness >= 7 ? 'high' : s.boldness <= 3 ? 'low' : 'mid';
        const text = _rp(CLIFF_DIVE_JUMPED[tier])(name, pr);
        reactions.push({ name, jumped: true, text, boldness: s.boldness });
      } else {
        chickens.push(name);
        momentum--;
        const cTier = s.boldness >= 7 ? 'high' : s.boldness <= 3 ? 'low' : 'mid';
        const text = _rp(CLIFF_DIVE_CHICKEN[cTier])(name, pr);
        reactions.push({ name, jumped: false, text, boldness: s.boldness });
      }
    });

    // ── Phase 1b: Convince / Force interventions (max 2 per tribe) ──
    let interventionCount = 0;
    const maxInterventions = 2;
    const convertedChickens = []; // track who gets flipped

    if (chickens.length > 0 && jumpers.length >= 1) {
      // For each chicken, find the most motivated jumper to intervene
      const chickenTargets = [...chickens];
      chickenTargets.forEach(chicken => {
        if (interventionCount >= maxInterventions) return;

        const cStats = pStats(chicken);
        const cPr = pronouns(chicken);

        // Find the most motivated jumper
        let bestMotivation = 0, bestJumper = null;
        jumpers.forEach(j => {
          const bond = getBond(j, chicken);
          const jStats = pStats(j);
          const motivation = Math.abs(bond) * 0.4 + jStats.social * 0.03 + jStats.physical * 0.02;
          if (motivation > bestMotivation) { bestMotivation = motivation; bestJumper = j; }
        });

        if (!bestJumper || bestMotivation < 0.3) return; // nobody cares enough

        const jStats = pStats(bestJumper);
        const jPr = pronouns(bestJumper);
        const bond = getBond(bestJumper, chicken);

        // Path selection: allies convince, rivals force, neutral depends on stats
        const isConvince = bond >= 2 ? true : bond <= -2 ? false : jStats.social > jStats.physical;

        let success = false;
        let interventionText = '';
        let interventionHostLine = '';
        let interventionType = '';

        if (isConvince) {
          // Convince: social-weighted chance
          let chance = jStats.social * 0.06 + bond * 0.04 + cStats.loyalty * 0.03;
          // Boldness tier modifier (narrative text selection only)
          if (cStats.boldness >= 7) chance += 0.05; // pride can be leveraged
          else if (cStats.boldness >= 4) chance += 0.10; // on the fence
          // else low boldness: no bonus, they've made peace with it
          chance = Math.max(0.10, Math.min(0.80, chance));

          success = Math.random() < chance;
          interventionType = success ? 'convinceSuccess' : 'convinceFail';
          if (success) {
            interventionText = _rp(CLIFF_DIVE_CONVINCE_SUCCESS)(bestJumper, chicken, jPr, cPr);
            addBond(bestJumper, chicken, 0.2);
          } else {
            interventionText = _rp(CLIFF_DIVE_CONVINCE_FAIL)(bestJumper, chicken, jPr, cPr);
            addBond(bestJumper, chicken, -0.1);
          }
        } else {
          // Force: physical advantage matters
          let chance = (jStats.physical - cStats.physical) * 0.06 + jStats.boldness * 0.03 + 0.15;
          chance = Math.max(0.10, Math.min(0.75, chance));

          success = Math.random() < chance;
          interventionType = success ? 'forceSuccess' : 'forceFail';
          if (success) {
            interventionText = _rp(CLIFF_DIVE_FORCE_SUCCESS)(bestJumper, chicken, jPr, cPr);
            addBond(bestJumper, chicken, -0.5);
          } else {
            interventionText = _rp(CLIFF_DIVE_FORCE_FAIL)(bestJumper, chicken, jPr, cPr);
            addBond(bestJumper, chicken, -0.2);
          }
        }

        // Host reaction
        const hostPool = CLIFF_DIVE_HOST_INTERVENTION[interventionType];
        if (hostPool) interventionHostLine = _rp(hostPool)(host, bestJumper, chicken);

        // Update the chicken's reaction with intervention data
        const chickenReaction = reactions.find(r => r.name === chicken && !r.jumped);
        if (chickenReaction) {
          chickenReaction.intervention = {
            by: bestJumper, type: isConvince ? 'convince' : 'force',
            success, text: interventionText, hostLine: interventionHostLine,
          };
        }

        if (success) {
          // Flip the chicken to a jumper
          chickens.splice(chickens.indexOf(chicken), 1);
          jumpers.push(chicken);
          convertedChickens.push(chicken);
          if (chickenReaction) {
            chickenReaction.jumped = true; // now counts as jumped for scoring
            chickenReaction.wasForced = interventionType === 'forceSuccess';
            chickenReaction.wasConvinced = interventionType === 'convinceSuccess';
          }
        }

        interventionCount++;
      });
    }

    // Pressure reactions for remaining chickens (those NOT converted)
    chickens.forEach(chicken => {
      const chickenReaction = reactions.find(r => r.name === chicken && !r.jumped);
      if (chickenReaction && !chickenReaction.intervention && jumpers.length > 0) {
        const frustrated = _rp(jumpers);
        const fPr = pronouns(frustrated);
        const pressureLines = [
          `${frustrated} throws ${fPr.posAdj} hands up. "${chicken}, seriously?"`,
          `"Come ON, ${chicken}." ${frustrated} is already waist-deep in the water.`,
          `${frustrated} shakes ${fPr.posAdj} head. "We needed that jump."`,
          `"You said you'd do it." ${frustrated} doesn't look at ${chicken}.`,
        ];
        chickenReaction.text += ' ' + _rp(pressureLines);
        addBond(frustrated, chicken, -0.1);
        chickenReaction.pressured = true;
      }
    });

    let standout = null, standoutIsUnderdog = false;
    if (jumpers.length) {
      if (Math.random() < 0.15) {
        standout = jumpers.reduce((a, b) => pStats(a).boldness < pStats(b).boldness ? a : b);
        standoutIsUnderdog = true;
      } else {
        const scored = jumpers.map(name => ({
          name, score: pStats(name).boldness * 0.07 + 0.3 + Math.random() * 0.2
        })).sort((a, b) => b.score - a.score);
        standout = scored[0].name;
        standoutIsUnderdog = pStats(standout).boldness <= 4;
      }
    }

    // ── Task 4: Per-player scoring for haul & build ──
    const manpowerPct = members.length > 0 ? jumpers.length / members.length : 0;
    const haulIndiv = {};
    const buildIndiv = {};

    members.forEach(name => {
      if (jumpers.includes(name)) {
        const s = pStats(name);
        haulIndiv[name] = s.physical * 0.5 + s.endurance * 0.4 + Math.random() * 1.0;
        buildIndiv[name] = s.mental * 0.5 + s.social * 0.3 + Math.random() * 1.0;
      } else {
        haulIndiv[name] = 0;
        buildIndiv[name] = 0;
      }
    });

    const haulSum = jumpers.reduce((acc, n) => acc + haulIndiv[n], 0);
    const buildSum = jumpers.reduce((acc, n) => acc + buildIndiv[n], 0);
    // Avg per jumper (not per member) — elite jumpers can carry a short-handed team
    // Manpower multiplier is the only penalty for chickens
    const haulAvg = jumpers.length > 0 ? haulSum / jumpers.length : 0;
    const buildAvg = jumpers.length > 0 ? buildSum / jumpers.length : 0;

    const haulScore = haulAvg * (0.5 + manpowerPct * 0.5);
    const buildScore = buildAvg * (0.5 + manpowerPct * 0.5);
    const totalScore = haulScore + buildScore;

    // ── Haul narrative ──
    const haulNarrative = [];
    const haulTier = manpowerPct >= 0.8 ? 'dominant' : manpowerPct >= 0.5 ? 'scrappy' : 'struggling';
    haulNarrative.push(_rp(CLIFF_DIVE_HAUL[haulTier])(tribe.name));

    let haulStandout = null, haulWeakest = null;
    if (jumpers.length >= 2) {
      const sortedByHaul = [...jumpers].sort((a, b) => haulIndiv[b] - haulIndiv[a]);
      haulStandout = sortedByHaul[0];
      haulWeakest = sortedByHaul[sortedByHaul.length - 1];
      haulNarrative.push(_rp(CLIFF_DIVE_HAUL_STANDOUT)(haulStandout, pronouns(haulStandout)));
      if (haulWeakest !== haulStandout) {
        haulNarrative.push(_rp(CLIFF_DIVE_HAUL_WEAKEST)(haulWeakest, pronouns(haulWeakest)));
      }
    }

    // ── Build narrative ──
    const buildNarrative = [];
    const buildTier = manpowerPct >= 0.7 ? 'efficient' : 'chaotic';
    buildNarrative.push(_rp(CLIFF_DIVE_BUILD[buildTier])(tribe.name));

    let buildLeader = null;
    if (jumpers.length >= 2) {
      buildLeader = jumpers.reduce((a, b) => pStats(a).mental > pStats(b).mental ? a : b);
      buildNarrative.push(_rp(CLIFF_DIVE_BUILD_LEADER)(buildLeader, pronouns(buildLeader)));
      // Build leader bond boost from teammates
      jumpers.filter(j => j !== buildLeader).forEach(j => addBond(j, buildLeader, 0.15));
    }

    // Frustration: chicken watches worker struggle
    if (chickens.length > 0 && jumpers.length > 0 && manpowerPct < 0.7) {
      const sittingChicken = _rp(chickens);
      const worker = _rp(jumpers);
      const chickenPr = pronouns(sittingChicken);
      buildNarrative.push(_rp(CLIFF_DIVE_BUILD_FRUSTRATION)(sittingChicken, worker, chickenPr));
    }

    tribeResults.push({
      name: tribe.name, members, jumpers, chickens, standout, standoutIsUnderdog,
      jumpCount: jumpers.length,
      haulScore: Math.round(haulScore * 100) / 100,
      buildScore: Math.round(buildScore * 100) / 100,
      totalScore: Math.round(totalScore * 100) / 100,
      reactions,
      haulIndiv, buildIndiv,
      haulNarrative, buildNarrative,
      haulStandout, haulWeakest, buildLeader,
    });
  });

  // ── Task 5: Reworked wagon advantage ──
  const jumpPcts = tribeResults.map(t => ({
    name: t.name, pct: t.members.length > 0 ? t.jumpers.length / t.members.length : 0
  })).sort((a, b) => b.pct - a.pct);
  let wagonWinner = null;
  if (jumpPcts[0].pct >= 1.0) {
    wagonWinner = jumpPcts[0].name;
  } else if (jumpPcts.length >= 2 && jumpPcts[0].pct - jumpPcts[1].pct >= 0.20) {
    wagonWinner = jumpPcts[0].name;
  }
  if (wagonWinner) {
    const wt = tribeResults.find(t => t.name === wagonWinner);
    wt.haulScore = Math.round(wt.haulScore * 1.3 * 100) / 100;
    wt.totalScore = Math.round((wt.haulScore + wt.buildScore) * 100) / 100;
  }

  tribeResults.sort((a, b) => b.totalScore - a.totalScore || b.jumpCount - a.jumpCount);
  const winner = tribeResults[0];
  const loser = tribeResults[tribeResults.length - 1];

  // ── Host lines per reaction (skip if intervention already has one) ──
  tribeResults.forEach(t => {
    t.reactions.forEach(r => {
      if (r.intervention) return; // intervention has its own host line
      if (!r.jumped) {
        r.hostLine = _rp(CLIFF_DIVE_HOST.afterChicken)(host, r.name);
      } else if (r.boldness <= 3) {
        r.hostLine = _rp(CLIFF_DIVE_HOST.afterScaredJump)(host, r.name);
      } else if (r.boldness >= 7 && Math.random() < 0.5) {
        r.hostLine = _rp(CLIFF_DIVE_HOST.afterBoldJump)(host, r.name);
      }
    });
  });

  // ── Task 6: Top-level host lines ──
  const hostIntro = _rp(CLIFF_DIVE_HOST.intro)(host);
  const hostPhase2 = _rp(CLIFF_DIVE_HOST.phase2Intro)(host);
  const hostPhase3 = _rp(CLIFF_DIVE_HOST.phase3Intro)(host);
  const hostWinner = _rp(CLIFF_DIVE_HOST.winnerReveal)(host, winner.name);
  const hostLoserDig = _rp(CLIFF_DIVE_HOST.loserDig)(host, loser.name);

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

  // ── Task 2: Tiered blame / bond hits ──
  if (!gs._cliffDiveBlame) gs._cliffDiveBlame = {};
  loser.chickens.forEach(chicken => {
    const cBold = pStats(chicken).boldness;
    const blame = cBold >= 7 ? 1.5 : cBold <= 3 ? 0.5 : 1.0;
    const bondHitLoser = cBold >= 7 ? -0.5 : cBold <= 3 ? -0.15 : -0.3;
    gs._cliffDiveBlame[chicken] = blame;
    loser.jumpers.forEach(jumper => addBond(jumper, chicken, bondHitLoser));
  });
  tribeResults.filter(t => t.name !== loser.name).forEach(t => {
    t.chickens.forEach(chicken => {
      const cBold = pStats(chicken).boldness;
      const bondHitWinner = cBold >= 7 ? -0.3 : cBold <= 3 ? -0.08 : -0.15;
      t.jumpers.forEach(jumper => addBond(jumper, chicken, bondHitWinner));
    });
  });

  tribeResults.forEach(t => {
    if (t.standout) {
      t.members.filter(m => m !== t.standout).forEach(m => addBond(m, t.standout, 0.3));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[t.standout] = (gs.popularity[t.standout] || 0) + 2; // first to jump = crowd favourite
    }
  });

  tribeResults.forEach(t => {
    if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] };
    if (!ep.campEvents[t.name].post) ep.campEvents[t.name].post = [];

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
      if (isLoser) {
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[chicken] = (gs.popularity[chicken] || 0) - 1; // chicken on losing tribe = embarrassing
      }
    });

    if (t.standout) {
      const pr = pronouns(t.standout);
      ep.campEvents[t.name].post.push({
        type: 'cliffDiveStandout',
        players: [t.standout],
        text: t.standoutIsUnderdog
          ? `Nobody expected ${t.standout} to go first. ${pr.Sub} surprised everyone — including ${pr.ref}.`
          : `${t.standout} stepped up when nobody else would. First off the cliff. The team needed that.`,
        consequences: 'Bond +0.3 from teammates, +2 popularity.',
        badgeText: 'FIRST TO JUMP', badgeClass: 'gold'
      });
    }

    // ── Build leader camp event ──
    if (t.buildLeader) {
      const otherJumpers = t.jumpers.filter(j => j !== t.buildLeader);
      ep.campEvents[t.name].post.push({
        type: 'cliffDiveBuildLeader',
        players: [t.buildLeader, ...otherJumpers.slice(0, 2)],
        text: `${t.buildLeader} took charge of the hot tub build, calling directions and keeping the team focused under pressure.`,
        consequences: 'Bond +0.15 from teammates, +1 popularity.',
        badgeText: 'BUILD CAPTAIN', badgeClass: 'blue'
      });
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[t.buildLeader] = (gs.popularity[t.buildLeader] || 0) + 1; // build leader = organiser credit
    }

    // ── Convince/Force camp events ──
    t.reactions.filter(r => r.intervention).forEach(r => {
      const iv = r.intervention;
      if (iv.type === 'force' && iv.success) {
        ep.campEvents[t.name].post.push({
          type: 'cliffDiveForced',
          players: [iv.by, r.name],
          text: `${iv.by} threw ${r.name} off the cliff. ${r.name} did NOT agree to that.`,
          consequences: 'Bond -0.5. Counts as a jump. Thrower +1 popularity (entertaining).',
          badgeText: 'THROWN', badgeClass: 'red'
        });
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[iv.by] = (gs.popularity[iv.by] || 0) + 1; // thrower = entertaining chaos
      } else if (iv.type === 'convince' && iv.success) {
        ep.campEvents[t.name].post.push({
          type: 'cliffDiveConvinced',
          players: [iv.by, r.name],
          text: `${iv.by} talked ${r.name} into jumping. Trust moment on the cliff.`,
          consequences: 'Bond +0.2. Convincer +1 popularity.',
          badgeText: 'CONVINCED', badgeClass: 'green'
        });
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[iv.by] = (gs.popularity[iv.by] || 0) + 1; // convincer = social credit
      }
    });
  });

  // ── Task 4: chalMemberScores with haul/build/leader contributions ──
  ep.chalMemberScores = {};
  tribeResults.forEach(t => {
    t.members.forEach(m => {
      if (!t.jumpers.includes(m)) {
        ep.chalMemberScores[m] = 0;
        return;
      }
      const jumpScore = m === t.standout ? 30 : 10;
      const haulPts = Math.round(t.haulIndiv[m] * 3);
      const buildPts = Math.round(t.buildIndiv[m] * 3);
      const leaderBonus = m === t.buildLeader ? 5 : 0;
      const haulStandoutBonus = m === t.haulStandout ? 5 : 0;
      ep.chalMemberScores[m] = jumpScore + haulPts + buildPts + leaderBonus + haulStandoutBonus;
    });
  });

  ep.cliffDive = {
    tribes: tribeResults,
    wagonWinner,
    winner: winner.name,
    hostIntro, hostPhase2, hostPhase3, hostWinner, hostLoserDig,
  };

  updateChalRecord(ep);
}

export function _textCliffDive(ep, ln, sec) {
  if (!ep.cliffDive?.tribes?.length) return;
  const cd = ep.cliffDive;
  sec('CLIFF DIVE');
  if (cd.hostIntro) ln(cd.hostIntro);
  ln('One thousand feet. Shark-infested waters. A tiny safe zone.');
  ln('');
  ln('Phase 1 — The Jump:');
  cd.tribes.forEach(t => {
    ln(`  ${t.name}:`);
    (t.reactions || []).forEach(r => {
      const badge = r.jumped ? 'JUMPED' : 'CHICKENED OUT';
      const standoutTag = r.name === t.standout ? ' [★ FIRST TO JUMP]' : '';
      ln(`    [${badge}]${standoutTag} ${r.text}`);
      if (r.hostLine) ln(`      Host: ${r.hostLine}`);
      if (r.intervention) {
        const iv = r.intervention;
        const tag = iv.success ? (iv.type === 'force' ? 'THROWN' : 'CONVINCED') : (iv.type === 'force' ? 'FORCE FAILED' : 'CONVINCE FAILED');
        ln(`      [${tag}] ${iv.text}`);
        if (iv.hostLine) ln(`        Host: ${iv.hostLine}`);
      }
    });
    ln(`    Score: ${t.jumpCount}/${t.members.length} jumped`);
  });
  if (cd.wagonWinner) ln(`Wagon advantage: ${cd.wagonWinner}`);
  ln('');
  if (cd.hostPhase2) ln(cd.hostPhase2);
  ln('Phase 2 — Haul Crates:');
  cd.tribes.forEach(t => {
    const manpower = t.members.length > 0 ? Math.round(t.jumpers.length / t.members.length * 100) : 0;
    ln(`  ${t.name}: ${t.haulScore} (${manpower}% manpower${t.name === cd.wagonWinner ? ', wagons 1.3x' : ''})`);
    (t.haulNarrative || []).forEach(line => ln(`    ${line}`));
    if (t.haulStandout) ln(`    ★ Haul MVP: ${t.haulStandout}`);
    if (t.haulWeakest && t.haulWeakest !== t.haulStandout) ln(`    ▽ Struggling: ${t.haulWeakest}`);
  });
  ln('');
  if (cd.hostPhase3) ln(cd.hostPhase3);
  ln('Phase 3 — Build Hot Tub:');
  cd.tribes.forEach(t => {
    const manpower = t.members.length > 0 ? Math.round(t.jumpers.length / t.members.length * 100) : 0;
    ln(`  ${t.name}: ${t.buildScore} (${manpower}% manpower)`);
    (t.buildNarrative || []).forEach(line => ln(`    ${line}`));
    if (t.buildLeader) ln(`    ★ Build Captain: ${t.buildLeader}`);
  });
  ln('');
  if (cd.hostWinner) ln(cd.hostWinner);
  ln(`RESULT: ${cd.winner} wins immunity`);
  if (cd.hostLoserDig) ln(cd.hostLoserDig);
  cd.tribes.forEach(t => ln(`  ${t.name}: Jump ${t.jumpCount} · Haul ${t.haulScore} · Build ${t.buildScore} · Total ${t.totalScore}${t.name === cd.winner ? ' ★ WINNER' : ''}`));
  const allChickens = cd.tribes.flatMap(t => t.chickens);
  if (allChickens.length) ln(`Chicken hats: ${allChickens.join(', ')}`);
}

export function rpBuildCliffDive(ep) {
  const cd = ep.cliffDive;
  if (!cd?.tribes?.length) return null;

  const stateKey = `cd_reveal_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // ── Build flat steps: each jump reaction + phase reveals ──
  const steps = [];
  cd.tribes.forEach(t => {
    steps.push({ type: 'tribe-header', tribe: t.name });
    t.reactions.forEach(r => {
      steps.push({ type: 'jump', reaction: r, tribe: t.name, isStandout: r.name === t.standout });
    });
  });
  steps.push({ type: 'phase2' });
  steps.push({ type: 'phase3' });
  steps.push({ type: 'results' });

  const totalSteps = steps.length;
  const allRevealed = state.idx >= totalSteps - 1;
  const _cdReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  // Compute live jump tracker from revealed steps
  const jumpCount = {};
  const chickenCount = {};
  cd.tribes.forEach(t => { jumpCount[t.name] = 0; chickenCount[t.name] = 0; });
  steps.forEach((s, si) => {
    if (si <= state.idx && s.type === 'jump') {
      if (s.reaction.jumped) jumpCount[s.tribe]++;
      else chickenCount[s.tribe]++;
    }
  });

  // ── Build HTML ──
  let html = `<div class="rp-page cd-wrap">
    <div style="text-align:center;font-size:9px;font-weight:700;letter-spacing:3px;color:#4a3520;margin-bottom:10px">EPISODE ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:32px;letter-spacing:3px;text-align:center;color:#f47067;text-shadow:0 0 24px rgba(244,112,103,0.2);margin-bottom:4px">CLIFF DIVE</div>
    <div style="text-align:center;font-size:11px;color:#8b949e;margin-bottom:4px">One thousand feet. Shark-infested waters. A tiny safe zone.</div>
    <div style="text-align:center;font-size:10px;color:#6e7681;margin-bottom:12px">Jump for your team. Chicken out and wear the hat of shame.</div>
    ${cd.hostIntro ? `<div style="text-align:center;font-size:12px;color:#c9d1d9;font-style:italic;margin-bottom:8px;padding:6px 12px;background:rgba(0,0,0,0.3);border-radius:6px">${cd.hostIntro}</div>` : ''}
    <div class="cd-cliff-edge">\u2593\u2593\u2593 CLIFF EDGE \u2593\u2593\u2593</div>`;

  // ── Live jump tracker ──
  html += `<div class="cd-tracker">`;
  cd.tribes.forEach(t => {
    const tc = tribeColor(t.name);
    const j = jumpCount[t.name] || 0;
    const c = chickenCount[t.name] || 0;
    html += `<div class="cd-tracker-tribe">
      <div style="font-size:10px;font-weight:700;color:${tc};letter-spacing:0.5px">${t.name}</div>
      <div style="font-family:var(--font-mono);font-size:9px;margin-top:2px">
        <span style="color:#3fb950">${j}</span><span style="color:#484f58"> jumped</span>
        ${c > 0 ? ` <span style="color:#f85149">${c}</span><span style="color:#484f58"> \ud83d\udc14</span>` : ''}
      </div>
    </div>`;
  });
  html += `</div>`;

  // ── Render steps ──
  steps.forEach((step, si) => {
    const isVisible = si <= state.idx;

    if (step.type === 'tribe-header') {
      if (!isVisible) return;
      const tc = tribeColor(step.tribe);
      html += `<div style="font-family:var(--font-display);font-size:16px;color:${tc};text-align:center;margin:12px 0 6px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.04)">${step.tribe}</div>`;

    } else if (step.type === 'jump') {
      if (!isVisible) {
        html += `<div style="padding:8px;margin-bottom:4px;border:1px solid rgba(255,255,255,0.03);border-radius:6px;opacity:0.06;font-size:10px;color:#484f58;text-align:center">\u00b7\u00b7\u00b7</div>`;
        return;
      }
      const r = step.reaction;
      const jumped = r.jumped;
      const badge = jumped
        ? '<span class="cd-jump-badge pass">JUMPED</span>'
        : '<span class="cd-jump-badge fail">CHICKENED OUT</span>';

      if (step.isStandout) {
        html += `<div class="cd-confessional standout" style="padding:16px;margin-bottom:8px">
          <div style="font-size:8px;font-weight:800;letter-spacing:2px;color:#f0a500;margin-bottom:6px">\u2605 FIRST TO JUMP \u2605</div>
          <div style="display:flex;align-items:center;gap:10px">
            ${rpPortrait(r.name, 'lg')}
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <span style="font-size:15px;font-weight:700;color:#f0a500">${r.name}</span>
                ${badge}
              </div>
              <div style="font-size:13px;color:#e6edf3;line-height:1.6;font-style:italic">${r.text}</div>
              ${r.hostLine ? `<div style="font-size:10px;color:#6e7681;margin-top:4px">${r.hostLine}</div>` : ''}
            </div>
          </div>
        </div>`;
      } else {
        html += `<div class="cd-confessional ${jumped ? 'jumped' : 'chickened'}">
          <div style="display:flex;align-items:center;gap:10px">
            ${rpPortrait(r.name, 'pb-sm')}
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <span style="font-size:13px;font-weight:600;color:#c9d1d9">${r.name}</span>
                ${badge}
              </div>
              <div style="font-size:12px;color:#8b949e;line-height:1.5;font-style:italic">${r.text}</div>
              ${r.hostLine ? `<div style="font-size:10px;color:#6e7681;margin-top:3px">${r.hostLine}</div>` : ''}
              ${r.intervention ? `<div style="margin-top:6px;padding:6px 8px;border-radius:6px;border:1px solid ${r.intervention.success ? (r.intervention.type==='force' ? 'rgba(248,81,73,0.25)' : 'rgba(63,185,80,0.25)') : 'rgba(255,255,255,0.06)'};background:${r.intervention.success ? (r.intervention.type==='force' ? 'rgba(248,81,73,0.06)' : 'rgba(63,185,80,0.06)') : 'rgba(0,0,0,0.2)'}">
                <div style="font-size:8px;font-weight:800;letter-spacing:1px;color:${r.intervention.success ? (r.intervention.type==='force' ? '#f85149' : '#3fb950') : '#6e7681'};margin-bottom:3px">${r.intervention.type === 'force' ? (r.intervention.success ? 'THROWN OFF THE CLIFF' : 'FORCE ATTEMPT FAILED') : (r.intervention.success ? 'TALKED INTO IT' : 'CONVINCE ATTEMPT FAILED')}</div>
                <div style="font-size:11px;color:#c9d1d9;font-style:italic">${r.intervention.text}</div>
                ${r.intervention.hostLine ? `<div style="font-size:10px;color:#6e7681;margin-top:3px">${r.intervention.hostLine}</div>` : ''}
              </div>` : ''}
            </div>
          </div>
        </div>`;
      }

    } else if (step.type === 'phase2') {
      if (!isVisible) {
        html += `<div style="padding:10px;margin-bottom:4px;margin-top:14px;border:1px solid rgba(88,166,255,0.04);border-radius:6px;opacity:0.06;font-size:10px;text-align:center;color:#484f58">Phase 2</div>`;
        return;
      }
      html += `<div class="cd-phase-card" style="margin-top:18px;padding-top:14px;border-top:1px solid rgba(88,166,255,0.1)">
        <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;text-align:center;color:#58a6ff;margin-bottom:4px">HAUL CRATES</div>
        <div style="text-align:center;font-size:10px;color:#6e7681;margin-bottom:12px">More jumpers \u003d more hands. Chickens sit this one out.</div>`;

      if (cd.wagonWinner) {
        html += `<div style="text-align:center;margin-bottom:12px;padding:8px 12px;background:rgba(63,185,80,0.05);border:1px solid rgba(63,185,80,0.15);border-radius:6px">
          <span style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:#3fb950">WAGON ADVANTAGE</span>
          <span style="font-size:11px;color:#c9d1d9"> \u2014 ${cd.wagonWinner} gets wagons (1.3\u00d7)</span>
        </div>`;
      }

      const hSorted = [...cd.tribes].sort((a, b) => b.haulScore - a.haulScore);
      hSorted.forEach((t, i) => {
        const tc = tribeColor(t.name);
        const isFirst = i === 0;
        const mp = t.members.length > 0 ? Math.round(t.jumpers.length / t.members.length * 100) : 0;
        const pct = Math.min(100, t.haulScore / (hSorted[0].haulScore || 1) * 100);
        html += `<div style="padding:10px 14px;margin-bottom:5px;border-radius:8px;border:1px solid ${isFirst ? 'rgba(63,185,80,0.15)' : 'rgba(255,255,255,0.04)'};background:rgba(0,0,0,0.25)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <span style="font-size:13px;font-weight:700;color:${tc};min-width:80px">${t.name}</span>
            <div style="flex:1"><div class="cd-bar-track"><div class="cd-bar-fill" style="--cd-pct:${pct}%;background:${tc}"></div></div></div>
            <span style="font-size:13px;font-weight:700;color:${isFirst ? '#3fb950' : '#6e7681'};font-family:var(--font-mono)">${t.haulScore}</span>
            ${isFirst ? '<span style="font-size:8px;font-weight:800;letter-spacing:1px;color:#3fb950;background:rgba(63,185,80,0.12);padding:2px 5px;border-radius:3px">1ST</span>' : ''}
          </div>
          <div style="font-size:9px;color:#484f58">${t.jumpers.length}/${t.members.length} hauling (${mp}%)${t.name === cd.wagonWinner ? ' \u00b7 wagons' : ''}</div>
        </div>`;
      });
      // Haul narrative
      const haulNarratives = cd.tribes.map(t => (t.haulNarrative || []).join(' ')).filter(n => n);
      haulNarratives.forEach(n => {
        html += `<div style="font-size:11px;color:#8b949e;font-style:italic;margin-top:8px;padding:6px 10px;background:rgba(0,0,0,0.2);border-radius:6px">${n}</div>`;
      });
      if (cd.hostPhase2) html += `<div style="font-size:11px;color:#6e7681;font-style:italic;margin-top:6px;text-align:center">${cd.hostPhase2}</div>`;
      html += `</div>`;

    } else if (step.type === 'phase3') {
      if (!isVisible) {
        html += `<div style="padding:10px;margin-bottom:4px;border:1px solid rgba(210,168,255,0.04);border-radius:6px;opacity:0.06;font-size:10px;text-align:center;color:#484f58">Phase 3</div>`;
        return;
      }
      html += `<div class="cd-phase-card" style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(210,168,255,0.1)">
        <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;text-align:center;color:#d2a8ff;margin-bottom:4px">BUILD HOT TUB</div>
        <div style="text-align:center;font-size:10px;color:#6e7681;margin-bottom:12px">Open crates with your teeth. Build the best hot tub.</div>`;

      const bSorted = [...cd.tribes].sort((a, b) => b.buildScore - a.buildScore);
      bSorted.forEach((t, i) => {
        const tc = tribeColor(t.name);
        const isFirst = i === 0;
        const mp = t.members.length > 0 ? Math.round(t.jumpers.length / t.members.length * 100) : 0;
        const pct = Math.min(100, t.buildScore / (bSorted[0].buildScore || 1) * 100);
        html += `<div style="padding:10px 14px;margin-bottom:5px;border-radius:8px;border:1px solid ${isFirst ? 'rgba(210,168,255,0.15)' : 'rgba(255,255,255,0.04)'};background:rgba(0,0,0,0.25)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <span style="font-size:13px;font-weight:700;color:${tc};min-width:80px">${t.name}</span>
            <div style="flex:1"><div class="cd-bar-track"><div class="cd-bar-fill" style="--cd-pct:${pct}%;background:${tc}"></div></div></div>
            <span style="font-size:13px;font-weight:700;color:${isFirst ? '#d2a8ff' : '#6e7681'};font-family:var(--font-mono)">${t.buildScore}</span>
            ${isFirst ? '<span style="font-size:8px;font-weight:800;letter-spacing:1px;color:#d2a8ff;background:rgba(210,168,255,0.12);padding:2px 5px;border-radius:3px">1ST</span>' : ''}
          </div>
          <div style="font-size:9px;color:#484f58">${t.jumpers.length}/${t.members.length} building (${mp}%)</div>
          ${t.buildLeader ? `<div style="font-size:9px;color:#d2a8ff;margin-top:2px">Build captain: ${t.buildLeader}</div>` : ''}
        </div>`;
      });
      // Build narrative
      const buildNarratives = cd.tribes.map(t => (t.buildNarrative || []).join(' ')).filter(n => n);
      buildNarratives.forEach(n => {
        html += `<div style="font-size:11px;color:#8b949e;font-style:italic;margin-top:8px;padding:6px 10px;background:rgba(0,0,0,0.2);border-radius:6px">${n}</div>`;
      });
      if (cd.hostPhase3) html += `<div style="font-size:11px;color:#6e7681;font-style:italic;margin-top:6px;text-align:center">${cd.hostPhase3}</div>`;
      html += `</div>`;

    } else if (step.type === 'results') {
      if (!isVisible) {
        html += `<div style="padding:10px;margin-bottom:4px;border:1px solid rgba(63,185,80,0.04);border-radius:6px;opacity:0.06;font-size:10px;text-align:center;color:#484f58">Results</div>`;
        return;
      }
      // Final results
      const fSorted = [...cd.tribes].sort((a, b) => b.totalScore - a.totalScore);
      html += `<div class="cd-phase-card" style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06)">
        <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;text-align:center;color:#e6edf3;margin-bottom:14px">FINAL RESULTS</div>`;

      fSorted.forEach((t, i) => {
        const tc = tribeColor(t.name);
        const isWinner = t.name === cd.winner;
        html += `<div class="cd-final-winner" style="margin-bottom:6px;text-align:left;padding:12px;border:1px solid ${isWinner ? 'rgba(63,185,80,0.25)' : 'rgba(255,255,255,0.04)'};background:${isWinner ? 'rgba(63,185,80,0.05)' : 'rgba(0,0,0,0.2)'}">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:20px;font-weight:800;color:${isWinner ? '#3fb950' : '#30363d'};font-family:var(--font-mono);min-width:24px">${i + 1}</span>
            <span style="font-size:16px;font-weight:700;color:${tc}">${t.name}</span>
            <div style="flex:1;text-align:right">
              <span style="font-size:9px;color:#484f58;margin-right:6px">Jump:${t.jumpCount} \u00b7 Haul:${t.haulScore} \u00b7 Build:${t.buildScore}</span>
              <span style="font-size:18px;font-weight:800;color:${isWinner ? '#3fb950' : '#6e7681'};font-family:var(--font-mono)">${t.totalScore}</span>
            </div>
            ${isWinner ? '<span style="font-size:9px;font-weight:800;letter-spacing:1px;color:#0d1117;background:#3fb950;padding:3px 8px;border-radius:4px">IMMUNITY</span>' : ''}
          </div>
        </div>`;
      });
      html += `</div>`;

      if (cd.hostWinner) html += `<div style="font-size:13px;color:#3fb950;font-style:italic;text-align:center;margin-top:10px;padding:8px 12px;background:rgba(63,185,80,0.05);border-radius:6px">${cd.hostWinner}</div>`;
      if (cd.hostLoserDig) html += `<div style="font-size:11px;color:#f85149;font-style:italic;text-align:center;margin-top:6px;padding:6px 10px;background:rgba(248,81,73,0.04);border-radius:6px">${cd.hostLoserDig}</div>`;

      // Wall of Shame
      const allChickens = cd.tribes.flatMap(t => t.chickens);
      if (allChickens.length) {
        html += `<div class="cd-shame-wall">
          <div style="font-family:var(--font-display);font-size:14px;letter-spacing:2px;color:#f85149;margin-bottom:4px">WALL OF SHAME</div>
          <div style="font-size:10px;color:#6e7681;margin-bottom:10px">These players refused to jump. Chicken hat for the rest of the day.</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">${allChickens.map(c => `<div style="opacity:0.7">${rpPortrait(c, 'pb-sm')}</div>`).join('')}</div>
        </div>`;
      }
    }
  });

  // ── Sticky nav ──
  if (!allRevealed) {
    html += `<div style="position:sticky;bottom:0;padding:14px 0;text-align:center;background:linear-gradient(transparent,rgba(15,10,6,0.95) 25%);z-index:5">
      <button class="rp-btn" onclick="${_cdReveal(state.idx + 1)}">NEXT (${state.idx + 2}/${totalSteps})</button>
      <button class="rp-btn" style="margin-left:8px;opacity:0.6" onclick="${_cdReveal(totalSteps - 1)}">REVEAL ALL</button>
    </div>`;
  }

  html += `</div>`;
  return html;
}

