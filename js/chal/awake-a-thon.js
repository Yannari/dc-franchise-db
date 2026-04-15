// js/chal/awake-a-thon.js
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, romanticCompat, tribeColor, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';

export function simulateAwakeAThon(ep) {
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

  const tribeOf = {};
  tribes.forEach(t => t.members.forEach(m => { tribeOf[m] = t.name; }));

  while (true) {
    roundNum++;

    // Challenge ends when only 1 tribe has awake members (all others eliminated)
    const tribeAwake = {};
    tribes.forEach(t => { tribeAwake[t.name] = t.members.filter(m => awake.has(m)).length; });
    const aliveTribes = tribes.filter(t => tribeAwake[t.name] > 0);
    if (aliveTribes.length <= 1) break;

    const rolls = [];
    awake.forEach(name => {
      const s = pStats(name);
      const feastDebuff = feastSet.has(name) ? -0.15 : 0;
      const stayChance = s.endurance * 0.07 + s.mental * 0.04 + s.physical * 0.02 + 0.10 + feastDebuff;
      const roll = Math.random();
      rolls.push({ name, roll, passed: roll < stayChance, stayChance });
    });

    rolls.sort((a, b) => {
      if (!a.passed && b.passed) return -1;
      if (a.passed && !b.passed) return 1;
      return a.roll - b.roll;
    });
    const dropout = rolls[0];
    awake.delete(dropout.name);
    totalDropouts++;

    if (!fairyTaleRound && totalDropouts >= fairyTaleThreshold) fairyTaleRound = roundNum;
    if (!canadaRound && totalDropouts >= canadaThreshold) canadaRound = roundNum;

    // ── Mid-challenge social events ──
    const roundSocialEvents = [];
    const awakePlayers = [...awake];
    let eventsThisRound = 0;
    // At least 1 event when 4+ awake, up to 2 when 6+
    const maxEvents = awakePlayers.length >= 6 ? 2 : awakePlayers.length >= 4 ? 1 : 0;

    // Bonding (~50%) — social-butterfly/hero/showmancer/loyal-soldier more likely to initiate
    if (eventsThisRound < maxEvents && Math.random() < 0.50 && awakePlayers.length >= 2) {
      // Sort by social inclination: social archetypes first, then by social stat
      const _bondArchBoost = { 'social-butterfly': 3, hero: 2, showmancer: 2, 'loyal-soldier': 1, underdog: 1, villain: -1, floater: -1 };
      // Build all possible pairs, score by archetype + social + same-tribe bonus
      const _bondPairs = [];
      for (let _bpi = 0; _bpi < awakePlayers.length; _bpi++) {
        for (let _bpj = _bpi + 1; _bpj < awakePlayers.length; _bpj++) {
          const a = awakePlayers[_bpi], b = awakePlayers[_bpj];
          const pairKey = [a, b].sort().join('|');
          if (socialEventsDone.bonds.has(pairKey)) continue;
          if (getBond(a, b) < -1.0) continue;
          const aArch = players.find(p => p.name === a)?.archetype || '';
          const bArch = players.find(p => p.name === b)?.archetype || '';
          const sameTribe = tribeOf[a] === tribeOf[b] ? 3.0 : 0; // strong same-tribe bias
          const score = (_bondArchBoost[aArch] || 0) + (_bondArchBoost[bArch] || 0) + (pStats(a).social + pStats(b).social) * 0.05 + sameTribe + Math.random() * 1.5;
          _bondPairs.push({ a, b, pairKey, score });
        }
      }
      _bondPairs.sort((x, y) => y.score - x.score);
      if (_bondPairs.length) {
        const pick = _bondPairs[0];
        addBond(pick.a, pick.b, 0.3);
        socialEventsDone.bonds.add(pick.pairKey);
        roundSocialEvents.push({
          type: 'awakeAThonBond', players: [pick.a, pick.b],
          text: `${pick.a} and ${pick.b} talk quietly to stay awake. The conversation runs deeper than either expected.`,
          badgeText: 'STAYING AWAKE TOGETHER', badgeClass: 'gold'
        });
        eventsThisRound++;
      }
    }

    // Alliance pitch (~20%, max 2 per challenge) — mastermind/schemer/villain archetypes boosted
    if (eventsThisRound < maxEvents && socialEventsDone.alliances.size < 2 && Math.random() < 0.20 && awakePlayers.length >= 2) {
      const _dealArchs = ['mastermind', 'schemer', 'villain'];
      const strategists = awakePlayers.filter(p => {
        const arch = players.find(pl => pl.name === p)?.archetype || '';
        return pStats(p).strategic >= 6 || _dealArchs.includes(arch);
      });
      for (const initiator of strategists) {
        if (socialEventsDone.alliances.has(initiator)) continue;
        // Prefer same-tribe partners but cross-tribe possible
        const _dealCandidates = awakePlayers.filter(p => p !== initiator && !socialEventsDone.alliances.has(p) && getBond(initiator, p) >= -0.5)
          .sort((a, b) => {
            const aSame = tribeOf[a] === tribeOf[initiator] ? 2.0 : 0;
            const bSame = tribeOf[b] === tribeOf[initiator] ? 2.0 : 0;
            return (bSame + getBond(initiator, b)) - (aSame + getBond(initiator, a));
          });
        const partner = _dealCandidates[0];
        if (!partner) continue;
        const alreadyAllied = (gs.namedAlliances || []).some(a => a.active && a.members.includes(initiator) && a.members.includes(partner));
        if (alreadyAllied) continue;
        const activeAlliances = (gs.namedAlliances || []).filter(a => a.active).length;
        const globalCap = Math.max(2, Math.floor(gs.activePlayers.length * 0.4));
        if (activeAlliances >= globalCap) continue;
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
        const phaseLabel = totalDropouts >= canadaThreshold ? '85 hours' : totalDropouts >= fairyTaleThreshold ? '24 hours' : '12 hours';
        roundSocialEvents.push({
          type: 'awakeAThonDeal', players: [initiator, partner],
          text: `At ${phaseLabel} in, ${initiator} leans over to ${partner}. "You and me. Final two. What do you say?"`,
          badgeText: 'LATE NIGHT DEAL', badgeClass: 'blue'
        });
        eventsThisRound++;
        break;
      }
    }

    // Showmance spark (~15%) — showmancer archetype gets lower bond threshold
    if (eventsThisRound < maxEvents && Math.random() < 0.15 && awakePlayers.length >= 2) {
      const showmanceCount = (gs.showmances || []).filter(s => s.phase !== 'broken-up').length;
      if (showmanceCount < 2) {
        for (let si = 0; si < awakePlayers.length; si++) {
          for (let sj = si + 1; sj < awakePlayers.length; sj++) {
            const a = awakePlayers[si], b = awakePlayers[sj];
            const _aIsShowmancer = players.find(p => p.name === a)?.archetype === 'showmancer';
            const _bIsShowmancer = players.find(p => p.name === b)?.archetype === 'showmancer';
            const _bondReq = (_aIsShowmancer || _bIsShowmancer) ? 0.5 : 2; // showmancers connect faster
            if (getBond(a, b) >= _bondReq && romanticCompat(a, b)) {
              const alreadyShowmance = (gs.showmances || []).some(s => s.players.includes(a) && s.players.includes(b));
              if (alreadyShowmance) continue;
              if (!gs.showmances) gs.showmances = [];
              gs.showmances.push({ players: [a, b], phase: 'spark', sparkEp: (gs.episode || 0) + 1, episodesActive: 0, origin: 'challenge-awakeathon', sparkContext: 'awake-a-thon social event' });
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

    // Cheating (~5%, max 1 per challenge) — rare and dramatic when it happens
    const _totalCheats = [...socialEventsDone.cheaters].filter(c => {
      return rounds.flatMap(r => r.socialEvents).some(e => e.type === 'awakeAThonCheat' && e.players[0] === c);
    }).length;
    if (eventsThisRound < maxEvents && _totalCheats < 1 && Math.random() < 0.05 && awakePlayers.length >= 3) {
      for (const cheater of awakePlayers) {
        if (socialEventsDone.cheaters.has(cheater)) continue;
        const s = pStats(cheater);
        const cheatChance = s.boldness * 0.04 + (10 - s.loyalty) * 0.03;
        if (Math.random() >= cheatChance) continue;
        const detectors = awakePlayers.filter(p => p !== cheater);
        const caught = detectors.some(d => Math.random() < pStats(d).intuition * 0.05);
        socialEventsDone.cheaters.add(cheater);
        if (caught) {
          const caughtBy = detectors.find(d => Math.random() < pStats(d).intuition * 0.05) || detectors[0];
          awake.delete(cheater);
          totalDropouts++;
          const cheaterTribe = tribeOf[cheater];
          tribes.find(t => t.name === cheaterTribe)?.members.filter(m => m !== cheater).forEach(m => addBond(m, cheater, -0.5));
          if (!gs._awakeAThonBlame) gs._awakeAThonBlame = {};
          gs._awakeAThonBlame[cheater] = (gs._awakeAThonBlame[cheater] || 0) + 1.0;
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[cheater] = (gs.popularity[cheater] || 0) - 2; // caught cheating = villain edit
          roundSocialEvents.push({
            type: 'awakeAThonCheat', players: [cheater, caughtBy],
            text: `${caughtBy} catches ${cheater} with ${pronouns(cheater).posAdj} eyes painted open. "Nice try." ${cheater} is disqualified.`,
            badgeText: 'CAUGHT CHEATING', badgeClass: 'red'
          });
          if (!ep.chalMemberScores) ep.chalMemberScores = {};
          ep.chalMemberScores[cheater] = 0;
          eventsThisRound++;
          // Note: cheater removal may kill a tribe — the aliveTribesPost check at end of round handles this
        }
        break;
      }
    }

    // Scheming (~15%)
    if (eventsThisRound < maxEvents && Math.random() < 0.15 && awakePlayers.length >= 2) {
      const schemers = awakePlayers.filter(p => {
        const arch = players.find(pl => pl.name === p)?.archetype || '';
        return arch === 'villain' || arch === 'schemer';
      });
      for (const schemer of schemers) {
        if (socialEventsDone.schemes.has(schemer)) continue;
        const sleepers = allMembers.filter(m => !awake.has(m) && tribeOf[m] !== tribeOf[schemer]);
        if (!sleepers.length) continue;
        const target = sleepers[Math.floor(Math.random() * sleepers.length)];
        if (!gs._awakeAThonBlame) gs._awakeAThonBlame = {};
        gs._awakeAThonBlame[target] = (gs._awakeAThonBlame[target] || 0) + 0.8;
        socialEventsDone.schemes.add(schemer);
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

    const tribeAwakePost = {};
    tribes.forEach(t => { tribeAwakePost[t.name] = t.members.filter(m => awake.has(m)).length; });
    const aliveTribesPost = tribes.filter(t => tribeAwakePost[t.name] > 0);
    if (aliveTribesPost.length <= 1) break;
  }

  // ── Determine winner ──
  const tribeAwakeFinal = {};
  tribes.forEach(t => { tribeAwakeFinal[t.name] = t.members.filter(m => awake.has(m)).length; });
  const tribeSorted = [...tribes].sort((a, b) => tribeAwakeFinal[b.name] - tribeAwakeFinal[a.name]);
  const winner = tribeSorted[0]; // most awake members
  // Loser = tribe whose last member fell asleep most recently (latest round with 0 awake)
  const deadTribesWithRound = tribeSorted.filter(t => tribeAwakeFinal[t.name] === 0).map(t => {
    const lastDropRound = [...rounds].reverse().find(r => r.dropout.tribe === t.name)?.round || 0;
    return { tribe: t, lastDropRound };
  });
  // The tribe that died FIRST (earliest lastDropRound) is the biggest loser — they go to tribal
  deadTribesWithRound.sort((a, b) => a.lastDropRound - b.lastDropRound);
  const loser = deadTribesWithRound[0]?.tribe || tribeSorted[tribeSorted.length - 1];
  const lastAwake = winner.members.find(m => awake.has(m)) || null;
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

  // ── Challenge member scores ──
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  allMembers.forEach(name => {
    if (ep.chalMemberScores[name] !== undefined) return;
    const dropRound = rounds.find(r => r.dropout.name === name);
    ep.chalMemberScores[name] = dropRound ? dropRound.round : roundNum + 1;
  });

  // ── Blame: first out on losing tribe ──
  if (firstOut && firstOut.tribe === loser.name) {
    if (!gs._awakeAThonBlame) gs._awakeAThonBlame = {};
    gs._awakeAThonBlame[firstOut.name] = (gs._awakeAThonBlame[firstOut.name] || 0) + 1.0;
  }

  // ── Standout: last awake bond boost ──
  if (lastAwake) {
    winner.members.filter(m => m !== lastAwake).forEach(m => addBond(m, lastAwake, 0.4));
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[lastAwake] = (gs.popularity[lastAwake] || 0) + 3; // last one standing = iron will legend
  }

  // ── Camp events ──
  if (lastAwake) {
    const pr = pronouns(lastAwake);
    const campKey = winner.name;
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
    if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];
    ep.campEvents[campKey].post.push({
      type: 'awakeAThonIronWill', players: [lastAwake],
      text: `${lastAwake} was the last one standing. ${roundNum} rounds. ${pr.Sub} never closed ${pr.posAdj} eyes.`,
      consequences: 'Bond +0.4 from teammates, +3 popularity.',
      badgeText: 'IRON WILL', badgeClass: 'gold'
    });
  }
  if (firstOut && firstOut.tribe === loser.name) {
    const pr = pronouns(firstOut.name);
    const campKey = firstOut.tribe;
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
    if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];
    ep.campEvents[campKey].post.push({
      type: 'awakeAThonFirstOut', players: [firstOut.name],
      text: `${firstOut.name} was the first to fall asleep. ${pr.Sub} didn't even make it past the twelve-hour mark.`,
      consequences: 'Heat +1.0, -1 popularity.',
      badgeText: 'FIRST OUT', badgeClass: 'red'
    });
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[firstOut.name] = (gs.popularity[firstOut.name] || 0) - 1; // first out on losing tribe = soft target
  }
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

  updateChalRecord(ep);
}

export function _textAwakeAThon(ep, ln, sec) {
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

export function rpBuildAwakeAThon(ep) {
  const aat = ep.awakeAThon;
  if (!aat?.rounds?.length) return null;

  const stateKey = `aat_reveal_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // ── Build steps (unchanged data model) ──
  const steps = [];
  steps.push({ type: 'run-results', runResults: aat.runResults, feastEaters: aat.feastEaters });
  steps.push({ type: 'feast' });

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
      steps.push({ ...evt, stepType: 'social' });
    });
  });
  steps.push({ type: 'winner', winner: aat.winner, lastAwake: aat.lastAwake });

  // ── Atmosphere calculations ──
  const totalPlayers = aat.runResults.length;
  const totalRounds = aat.rounds.length;

  // Seeded pseudo-random for consistent starfield per episode
  let _seed = ep.num * 7919;
  const _rand = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };

  // Generate 140 stars as box-shadow
  const starShadows = [];
  for (let i = 0; i < 140; i++) {
    const x = Math.floor(_rand() * 1000) - 500;
    const y = Math.floor(_rand() * 1000) - 500;
    const bright = _rand();
    const size = bright < 0.06 ? '2px' : bright < 0.18 ? '1px' : '0';
    const a = (0.3 + _rand() * 0.7).toFixed(2);
    starShadows.push(`${x}px ${y}px 0 ${size} rgba(255,255,255,${a})`);
  }

  // Map round index → simulated hours (exponential curve: early drops fast, late drops slow)
  const maxHours = aat.phaseMarkers.historyOfCanada ? 90 : 50;
  const hoursAt = (rnd) => {
    if (totalRounds <= 1) return 1;
    const t = Math.min(rnd, totalRounds - 1) / (totalRounds - 1);
    return Math.max(1, Math.round(maxHours * (1 - Math.pow(1 - t, 1.5))));
  };

  // Count dropouts revealed so far → drive fire & sky
  let dropoutsRevealed = 0, lastRevRound = 0;
  for (let i = 0; i <= Math.min(state.idx, steps.length - 1); i++) {
    if (steps[i].type === 'dropout') { dropoutsRevealed++; lastRevRound = steps[i].round; }
  }
  const fireInt = Math.max(0.12, 1 - (dropoutsRevealed / Math.max(totalPlayers, 1)) * 0.88);
  const curHour = lastRevRound > 0 ? hoursAt(lastRevRound - 1) : 0;
  const winnerShown = state.idx >= steps.length - 1;

  // Sky gradient shifts as hours pass
  let skyBg;
  if (winnerShown)       skyBg = 'linear-gradient(to bottom, #0f0818, #1c0f1e, #2d1a0e, #3d2008)';
  else if (curHour > 70) skyBg = 'linear-gradient(to bottom, #07041a, #0e0820)';
  else if (curHour > 20) skyBg = 'linear-gradient(to bottom, #050710, #090712)';
  else                   skyBg = 'linear-gradient(to bottom, #050709, #08050a)';

  // Fire colours scaled by intensity
  const fClr1 = `rgba(245,158,11,${fireInt.toFixed(2)})`;
  const fClr2 = `rgba(234,88,12,${(fireInt * 0.8).toFixed(2)})`;
  const fClr3 = `rgba(220,38,38,${(fireInt * 0.55).toFixed(2)})`;
  const fGlow = `rgba(245,158,11,${(fireInt * 0.22).toFixed(2)})`;

  // Ember particles (3 tiny rising dots, different delays)
  const embers = [0, 1, 2].map(i => {
    const x = -6 + i * 6;
    const delay = (i * 0.7).toFixed(1);
    return `<span class="aat-ember" style="left:${x}px;animation-delay:${delay}s;opacity:${fireInt > 0.3 ? 1 : 0}"></span>`;
  }).join('');

  const allRevealed = state.idx >= steps.length - 1;
  const _aatReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  // ── Build HTML ──
  let html = `<div class="rp-page aat-wrap" style="background:${skyBg};transition:background 0.8s ease">
    <div class="aat-starfield" style="box-shadow:${starShadows.join(',')}"></div>
    <div class="aat-content">
      <div style="text-align:center;font-size:9px;font-weight:700;letter-spacing:3px;color:#484f58;margin-bottom:14px">EPISODE ${ep.num}</div>
      <div style="font-family:var(--font-display);font-size:32px;letter-spacing:3px;text-align:center;color:#c4b5fd;text-shadow:0 0 30px rgba(139,92,246,0.15);margin-bottom:4px">AWAKE-A-THON</div>
      <div style="text-align:center;font-size:11px;color:#6e7681;letter-spacing:0.3px;margin-bottom:4px">20km run &middot; a feast &middot; then stay awake or lose</div>
      <div style="text-align:center;font-size:10px;color:#484f58;margin-bottom:18px">Last team with someone standing wins immunity.</div>

      <!-- Campfire -->
      <div class="aat-fire" style="opacity:${fireInt.toFixed(2)};margin-bottom:4px">
        <div class="aat-fire-core" style="background:radial-gradient(ellipse at 50% 80%,${fClr1},${fClr2} 40%,${fClr3} 70%,transparent)"></div>
        <div class="aat-fire-glow" style="background:radial-gradient(ellipse,${fGlow},transparent 70%)"></div>
        <div class="aat-embers">${embers}</div>
      </div>

      <!-- Hour counter -->
      <div class="aat-hour-display" style="color:${curHour > 70 ? '#6e7681' : '#484f58'}">${curHour > 0 ? `HOUR ${String(curHour).padStart(3, '0')}` : 'NIGHTFALL'}</div>`;

  // ── Render each step ──
  steps.forEach((step, i) => {
    const isVisible = i <= state.idx;

    if (step.type === 'run-results') {
      if (!isVisible) { html += `<div style="padding:10px;margin-bottom:6px;border:1px solid rgba(139,92,246,0.06);border-radius:8px;opacity:0.1;text-align:center;font-size:10px;color:#484f58">Phase 1 — The Run</div>`; return; }
      const finished = step.runResults.filter(r => r.finished);
      const dnf = step.runResults.filter(r => !r.finished);
      html += `<div style="padding:16px;margin-bottom:10px;border-radius:10px;border:1px solid rgba(139,92,246,0.12);background:rgba(139,92,246,0.03);animation:scrollDrop 0.4s var(--ease-broadcast) both">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#a78bfa;margin-bottom:10px">PHASE 1 — THE RUN</div>
        <div style="font-size:12px;color:#8b949e;margin-bottom:12px;line-height:1.5">20 kilometres around the lake. ${finished.length} finish. ${dnf.length} don't.</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px">${finished.map(r => `<div style="text-align:center">${rpPortrait(r.name, 'pb-sm')}<div style="font-size:7px;font-weight:800;letter-spacing:1px;color:#3fb950;margin-top:2px">FINISHED</div></div>`).join('')}</div>
        ${dnf.length ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(139,92,246,0.08)"><div style="font-size:8px;color:#f85149;font-weight:700;letter-spacing:1px;margin-bottom:6px">DID NOT FINISH</div><div style="display:flex;flex-wrap:wrap;gap:6px">${dnf.map(r => `<div style="text-align:center;opacity:0.55">${rpPortrait(r.name, 'pb-sm')}<div style="font-size:7px;font-weight:800;letter-spacing:1px;color:#f85149;margin-top:2px">DNF</div></div>`).join('')}</div></div>` : ''}
      </div>`;

    } else if (step.type === 'feast') {
      if (!isVisible) { html += `<div style="padding:10px;margin-bottom:6px;border:1px solid rgba(227,179,65,0.06);border-radius:8px;opacity:0.1;text-align:center;font-size:10px;color:#484f58">Phase 2 — The Feast</div>`; return; }
      html += `<div style="padding:16px;margin-bottom:10px;border-radius:10px;border:1px solid rgba(227,179,65,0.12);background:rgba(227,179,65,0.03);animation:scrollDrop 0.4s var(--ease-broadcast) both">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#e3b341;margin-bottom:10px">PHASE 2 — THE FEAST</div>
        <div style="font-size:12px;color:#8b949e;line-height:1.6">"Congratulations on finishing the run. As a reward — a feast!" The campers eat like they've never seen food before. What they don't know: the real challenge hasn't started yet.</div>
        <div style="font-size:10px;color:#f0883e;margin-top:10px;padding:6px 10px;border-radius:6px;background:rgba(240,136,62,0.05);border:1px solid rgba(240,136,62,0.1)">Every player who ate gets a <strong style="color:#f0883e">-0.15</strong> stay-awake penalty. The feast was the trap.</div>
      </div>`;

    } else if (step.type === 'phase-marker') {
      if (!isVisible) { html += `<div style="padding:8px;margin-bottom:4px;border:1px solid rgba(139,92,246,0.04);border-radius:6px;opacity:0.06;text-align:center;font-size:10px;color:#484f58">&middot;&middot;&middot;</div>`; return; }
      const isCanada = step.phase === 'historyOfCanada';
      const mc = isCanada ? '#c084fc' : '#a78bfa';
      html += `<div class="aat-phase-marker" style="text-align:center;padding:20px 16px;margin:14px 0;border-radius:10px;border:1px solid ${mc}22;background:${mc}08;animation:aatPhaseShift 0.6s var(--ease-broadcast) both">
        <div style="font-family:var(--font-display);font-size:18px;letter-spacing:3px;color:${mc};text-shadow:0 0 24px ${mc}33">${step.label}</div>
        <div style="font-size:11px;color:#8b949e;margin-top:8px;line-height:1.5;max-width:400px;margin-left:auto;margin-right:auto">${step.desc}</div>
      </div>`;

    } else if (step.type === 'dropout') {
      if (!isVisible) { html += `<div style="padding:8px;margin-bottom:4px;border:1px solid rgba(139,148,158,0.03);border-radius:6px;opacity:0.06;text-align:center;font-size:10px;color:#484f58">&middot;&middot;&middot;</div>`; return; }
      const tc = tribeColor(step.tribe);
      const dropHour = hoursAt(step.round - 1);
      html += `<div class="aat-dropout-card">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="aat-dropout-portrait asleep" style="position:relative">
            ${rpPortrait(step.name, 'pb-sm')}
            <div class="aat-seat-zzz">💤</div>
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap">
              <span style="font-size:13px;font-weight:600;color:#c9d1d9">${step.name}</span>
              <span style="font-size:9px;font-weight:700;color:${tc}">${step.tribe}</span>
            </div>
            <div style="font-size:9px;color:#484f58;margin-top:2px;letter-spacing:0.3px">Falls asleep — hour ${dropHour}</div>
          </div>
          <div style="font-family:var(--font-mono);font-size:9px;color:#30363d;letter-spacing:1px;white-space:nowrap">H${String(dropHour).padStart(3,'0')}</div>
        </div>
      </div>`;

    } else if (step.stepType === 'social') {
      if (!isVisible) { html += `<div style="padding:8px;margin-bottom:4px;border:1px solid rgba(139,148,158,0.03);border-radius:6px;opacity:0.06;text-align:center;font-size:10px;color:#484f58">&middot;&middot;&middot;</div>`; return; }
      const badgeColors = { gold: '#e3b341', blue: '#58a6ff', pink: '#db61a2', red: '#f85149', 'red-orange': '#f0883e' };
      const bc = badgeColors[step.badgeClass] || '#8b949e';
      html += `<div style="padding:10px 14px;margin-bottom:4px;border-radius:8px;border:1px solid ${bc}18;background:${bc}06;animation:scrollDrop 0.35s var(--ease-broadcast) both;backdrop-filter:blur(4px)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          ${(step.players || []).map(p => rpPortrait(p, 'pb-xs')).join('')}
          <span style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:${bc};background:${bc}12;padding:2px 8px;border-radius:3px">${step.badgeText}</span>
        </div>
        <div style="font-size:12px;color:#8b949e;line-height:1.5">${step.text}</div>
      </div>`;

    } else if (step.type === 'winner') {
      if (!isVisible) { html += `<div style="padding:10px;margin-bottom:6px;border:1px solid rgba(63,185,80,0.04);border-radius:8px;opacity:0.06;text-align:center;font-size:10px;color:#484f58">&middot;&middot;&middot;</div>`; return; }
      const tc = tribeColor(step.winner);
      html += `<div style="padding:28px 16px;margin-top:18px;border-radius:12px;border:1px solid rgba(63,185,80,0.12);background:rgba(63,185,80,0.03);text-align:center;position:relative;overflow:hidden">
        <div class="aat-sunrise-burst"></div>
        <div style="position:relative;z-index:1">
          <div style="font-family:var(--font-display);font-size:26px;letter-spacing:3px;color:#3fb950;margin-bottom:10px;text-shadow:0 0 24px rgba(63,185,80,0.25)">IMMUNITY</div>
          <div style="font-size:18px;font-weight:700;color:${tc};margin-bottom:4px">${step.winner}</div>
          <div style="font-size:10px;color:#484f58;margin-bottom:14px">The sun rises. It's over.</div>
          ${step.lastAwake ? `<div style="display:inline-block;position:relative">
            ${rpPortrait(step.lastAwake, 'lg')}
          </div>
          <div style="font-size:12px;color:#fbbf24;font-weight:700;margin-top:8px;letter-spacing:1px">★ IRON WILL — ${step.lastAwake}</div>
          <div style="font-size:10px;color:#6e7681;margin-top:3px">Last one standing.</div>` : ''}
        </div>
      </div>`;
    }
  });

  // ── Navigation ──
  if (!allRevealed) {
    const navBg = winnerShown ? 'rgba(30,16,6,0.95)' : 'rgba(5,7,9,0.95)';
    html += `<div style="position:sticky;bottom:0;padding:14px 0;background:linear-gradient(transparent,${navBg} 25%);text-align:center;z-index:5">
      <button class="rp-btn" onclick="${_aatReveal(state.idx + 1)}">NEXT (${state.idx + 2}/${steps.length})</button>
      <button class="rp-btn" style="margin-left:8px;opacity:0.6" onclick="${_aatReveal(steps.length - 1)}">Reveal All</button>
    </div>`;
  }

  html += `</div></div>`;
  return html;
}

