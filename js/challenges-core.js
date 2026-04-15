// js/challenges-core.js - Challenge picking, tribe/individual challenge simulation
import { gs, players, seasonConfig } from './core.js';
import { pStats, pronouns, threatScore, threat } from './players.js';
import { getBond, addBond } from './bonds.js';

export function pickChallenge(mode = 'both') {
  // Filter by mode: 'team', 'individual', or 'both' (accepts challenges tagged 'both' or matching mode)
  const modePool = CHALLENGE_DB.filter(c => !c.mode || c.mode === 'both' || c.mode === mode);
  const pool = modePool.length ? modePool : CHALLENGE_DB; // fallback if empty
  // Forced category: twist override — pick only from that category
  if (gs.forcedChallengeCategory) {
    const forced = gs.forcedChallengeCategory;
    delete gs.forcedChallengeCategory;
    const catPool = pool.filter(c => c.category === forced);
    if (catPool.length) {
      const picked = catPool[Math.floor(Math.random() * catPool.length)];
      gs.recentChallengeCategories = [...(gs.recentChallengeCategories || []), picked.category].slice(-3);
      return picked;
    }
  }
  // Reduce probability of recently-used categories so you don't get 4 physical challenges in a row.
  // Last episode's category = 10% weight, 2 episodes ago = 40% weight, anything older = 100%.
  // Core categories (physical, endurance, puzzle) get a frequency boost.
  const CATEGORY_FREQ = { physical: 1.4, endurance: 1.3, puzzle: 1.25, balance: 1, social: 1, mixed: 1 };
  const recent = gs.recentChallengeCategories || [];
  const weighted = pool.map(c => {
    const lastIdx = recent.lastIndexOf(c.category); // -1 if not in recent
    const ageBack = lastIdx === -1 ? 99 : (recent.length - 1 - lastIdx);
    const w = (ageBack === 0 ? 0.10 : ageBack === 1 ? 0.40 : ageBack === 2 ? 0.70 : 1) * (CATEGORY_FREQ[c.category] || 1);
    return { c, w };
  });
  const totalW = weighted.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * totalW;
  let picked = pool[0];
  for (const { c, w } of weighted) { r -= w; if (r <= 0) { picked = c; break; } }
  // Record category for future cooldown
  gs.recentChallengeCategories = [...recent, picked.category].slice(-3);
  return picked;
}

export function pickReward() {
  const phase = gs.phase === 'pre-merge' ? 'pre-merge' : 'post-merge';
  const pool = REWARD_POOL.filter(r => r.phase === 'any' || r.phase === phase);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function selectSitOuts(tribe, chal, count) {
  if (count <= 0 || !tribe.members.length) return [];
  const lastSitOuts = new Set(gs.sitOutHistory?.[tribe.name] || []);
  const ranked = tribe.members
    .map(m => ({ name: m, score: chal.stat(pStats(m)) }))
    .sort((a, b) => a.score - b.score);
  const result = [];
  // Pass 1: weakest players who didn't sit out last episode
  for (const s of ranked) {
    if (result.length >= count) break;
    if (!lastSitOuts.has(s.name)) result.push(s.name);
  }
  // Pass 2: still need more — allow back-to-back (e.g. 2-person tribe)
  if (result.length < count) {
    for (const s of ranked) {
      if (result.length >= count) break;
      if (!result.includes(s.name)) result.push(s.name);
    }
  }
  return result;
}

export function simulateTribeChallenge(tribes) {
  const chal = pickChallenge('team');
  // Equalize tribe sizes: larger tribes sit out their weakest to match the smallest tribe.
  // Back-to-back sit-out rule: same player can't sit out two episodes in a row.
  const minSize = Math.min(...tribes.map(t => t.members.length));
  if (!gs.sitOutHistory) gs.sitOutHistory = {};
  if (!gs.sitOutCount)   gs.sitOutCount   = {};
  const prevSitOuts = {};
  const sitOuts = {};
  tribes.forEach(tribe => {
    prevSitOuts[tribe.name] = [...(gs.sitOutHistory[tribe.name] || [])];
    const count = tribe.members.length - minSize;
    sitOuts[tribe.name] = count > 0 ? selectSitOuts(tribe, chal, count) : [];
    // Update tracking for this episode
    gs.sitOutHistory[tribe.name] = sitOuts[tribe.name];
    sitOuts[tribe.name].forEach(n => { gs.sitOutCount[n] = (gs.sitOutCount[n] || 0) + 1; });
  });
  // Score only competing members
  const memberScores = {};
  const scored = tribes.map(tribe => {
    const competitors = tribe.members.filter(m => !sitOuts[tribe.name].includes(m));
    const ms = competitors.map(m => {
      const _inj = gs.lingeringInjuries?.[m];
      const _injP = _inj && (gs.episode + 1 - _inj.ep) < _inj.duration ? _inj.penalty * (1 - (gs.episode + 1 - _inj.ep) / _inj.duration) : 0;
      const survPenalty = (seasonConfig.foodWater === 'enabled' && gs.survival)
        ? Math.max(0, (70 - (gs.survival[m] || 80)) * 0.03)
        : 0;
      let _moleThrowPenalty = 0;
      // The Mole: 30% chance to sabotage tribe challenges (pre-merge)
      // Pre-merge: 40% self-throw / 60% target sabotage (pinning blame is smarter)
      if (gs.moles?.length) {
        const _mObj = gs.moles.find(ml => ml.player === m && !ml.exposed && !ml.layingLow);
        if (_mObj && Math.random() < 0.30) {
          if (Math.random() < 0.40) {
            // Self-throw: Mole reduces own score
            _moleThrowPenalty = 2 + Math.random() * 2;
            _mObj.sabotageCount++;
            _mObj.sabotageLog.push({ ep: (gs.episode || 0) + 1, type: 'challengeThrow', tribe: tribe.name });
            _mObj.resistance = Math.max(0.15, 0.5 - _mObj.sabotageCount * 0.03);
            if (!gs._moleChalThrows) gs._moleChalThrows = [];
            gs._moleChalThrows.push({ player: m, tribe: tribe.name, penalty: _moleThrowPenalty, mode: 'self' });
          } else {
            // Target sabotage: Mole sabotages someone else — deferred to after scores computed
            if (!gs._moleChalTargetSabotage) gs._moleChalTargetSabotage = [];
            gs._moleChalTargetSabotage.push({ mole: m, tribe: tribe.name });
          }
        }
      }
      return { name: m, score: chal.stat(pStats(m)) - _injP - survPenalty - _moleThrowPenalty + (Math.random()*4-2) };
    });
    // The Mole: target sabotage — reduce another player's score after all scores computed
    if (gs._moleChalTargetSabotage?.length) {
      const _tribeSabs = gs._moleChalTargetSabotage.filter(s => s.tribe === tribe.name);
      _tribeSabs.forEach(sab => {
        const _mObj = gs.moles?.find(ml => ml.player === sab.mole);
        if (!_mObj) return;
        const _coordMole = (seasonConfig.moleCoordination === 'coordinated' && gs.moles.length === 2)
          ? gs.moles.find(ml => ml.player !== sab.mole)?.player : null;
        // Pre-merge Owen mode: pick the easiest target to blame — weakest player, worst performance
        // Nobody questions it when the tribe's weakest link has a bad day
        const _sabPool = ms.filter(x => x.name !== sab.mole && (_coordMole ? x.name !== _coordMole : true));
        if (!_sabPool.length) return;
        const _avgScore = ms.reduce((s, m2) => s + m2.score, 0) / ms.length;
        const _target = _sabPool.reduce((best, x) => {
          const xS = pStats(x.name);
          let sc = 0;
          // Heavily prefer low physical/endurance — blame sticks naturally
          sc += (10 - xS.physical) * 0.5;
          sc += (10 - xS.endurance) * 0.3;
          // Prefer players already performing below average this challenge
          sc += Math.max(0, _avgScore - x.score) * 0.4;
          // Small bonus for players with existing challenge bombs (reputation as weak)
          const _rec = gs.chalRecord?.[x.name];
          sc += (_rec?.bombs || 0) * 0.5;
          sc += Math.random() * 0.8;
          return sc > best.sc ? { name: x.name, sc } : best;
        }, { name: _sabPool[0].name, sc: -99 });
        // Apply penalty to the target's score
        const _penalty = 1.5 + Math.random() * 2; // -1.5 to -3.5 (slightly less than self-throw)
        const _targetEntry = ms.find(x => x.name === _target.name);
        if (_targetEntry) _targetEntry.score -= _penalty;
        // Log it
        _mObj.sabotageCount++;
        _mObj.sabotageLog.push({ ep: (gs.episode || 0) + 1, type: 'challengeSabotage', tribe: tribe.name, target: _target.name });
        _mObj.resistance = Math.max(0.15, 0.5 - _mObj.sabotageCount * 0.03);
        if (!gs._moleChalThrows) gs._moleChalThrows = [];
        gs._moleChalThrows.push({ player: sab.mole, tribe: tribe.name, penalty: _penalty, mode: 'target', target: _target.name });
      });
      // Clean up this tribe's entries
      gs._moleChalTargetSabotage = gs._moleChalTargetSabotage.filter(s => s.tribe !== tribe.name);
    }
    ms.forEach(x => { memberScores[x.name] = x.score; });
    const avg = ms.length ? ms.reduce((s,x) => s + x.score, 0) / ms.length : 0;
    // Underdog bonus: smaller tribes can't sit out weak players, so compensate
    const sizeDiff = Math.max(0, minSize - tribe.members.length + sitOuts[tribe.name].length);
    const underdogBonus = tribe.members.length < Math.max(...tribes.map(t => t.members.length))
      ? (Math.max(...tribes.map(t => t.members.length)) - tribe.members.length) * 0.4
      : 0;
    return { tribe, score: avg + underdogBonus + (Math.random()*2-1), memberScores: ms };
  });
  scored.sort((a,b) => b.score-a.score);
  const safe = scored.slice(1, scored.length - 1).map(s => s.tribe);
  return { winner: scored[0].tribe, loser: scored[scored.length-1].tribe, safe, placements: scored.map(s => s.tribe),
           memberScores, challengeLabel: chal.name, challengeCategory: chal.category, challengeDesc: chal.desc,
           sitOuts, prevSitOuts };
}

export function simulateLastChance(a, b) {
  // Head-to-head elimination duel — pick from a thematic last-chance pool
  const lcPool = [
    { name:'Fire-Making',    desc:'First to start a fire using flint and steel wins. The oldest skill in the game.',                                   category:'mixed',     stat:s=>s.physical*0.5+s.endurance*0.5 },
    { name:'The Long Haul',  desc:'An endurance hold — arms up, weight held, last one standing survives.',                                             category:'endurance', stat:s=>s.endurance },
    { name:'On the Block',   desc:'A one-on-one log-chopping race. First to split their log and raise a flag stays.',                                  category:'physical',  stat:s=>s.physical },
    { name:'Beast Mode',     desc:'A head-to-head obstacle course. First through the course stays in the game.',                                       category:'mixed',     stat:s=>s.physical*0.6+s.mental*0.4 },
    { name:'Memory Lane',    desc:'Replicate a sequence of symbols from memory. First to get it right survives.',                                      category:'puzzle',    stat:s=>s.mental },
  ];
  const chal = lcPool[Math.floor(Math.random() * lcPool.length)];
  const sA = chal.stat(pStats(a)) + (Math.random() * 2 - 1);
  const sB = chal.stat(pStats(b)) + (Math.random() * 2 - 1);
  const winner = sA >= sB ? a : b;
  return { winner, loser: winner === a ? b : a, challengeLabel: chal.name, challengeCategory: chal.category, challengeDesc: chal.desc };
}

export function simulateIndividualChallenge(pool, immune) {
  const chal = pickChallenge('individual');
  const candidates = pool.filter(p => p!==immune);
  if (!candidates.length) return null;
  // Consecutive-win fatigue: repeat winners face increasing pressure/fatigue
  const _streaks = gs.challengeWinStreak || {};

  // ── Challenge throw check (post-merge only, not when immunity is critical) ──
  const _throwers = new Set();
  const _throwDisabled = candidates.length <= (seasonConfig.finaleSize || 3) || gs.activePlayers.length <= 4; // F3/F4 — every immunity matters, never throw when 4 or fewer players remain
  if (gs.isMerged && !_throwDisabled) {
    candidates.forEach(name => {
      const s = pStats(name);
      const streak = _streaks[name] || 0;
      const heat = computeHeat(name, candidates, gs.namedAlliances || []);
      // Motivation: proportional — higher heat + streak = more reason to lay low
      // Roll: strategic players recognize when to throw, bold players resist (want to win)
      if (heat < 2) return;
      const throwChance = heat * (s.strategic * 0.007) + streak * 0.08 - s.boldness * 0.012;
      if (throwChance > 0 && Math.random() < throwChance) {
        _throwers.add(name);
      }
    });
  }

  // Score every candidate so we can produce a full ranking
  const scored = candidates
    .map(name => {
      const base = chal.stat(pStats(name));
      const streak = _streaks[name] || 0;
      const fatigue = streak >= 4 ? 3 : streak >= 3 ? 2 : streak >= 2 ? 1.5 : streak >= 1 ? 0.5 : 0;
      // Lingering injury penalty — decays over episodes
      const _inj = gs.lingeringInjuries?.[name];
      const _epNum = (gs.episode || 0) + 1;
      const injPenalty = _inj && (_epNum - _inj.ep) < _inj.duration ? _inj.penalty * (1 - (_epNum - _inj.ep) / _inj.duration) : 0;
      // Survival penalty: proportional — every point below 70 matters
      const survPenalty = (seasonConfig.foodWater === 'enabled' && gs.survival)
        ? Math.max(0, (70 - (gs.survival[name] || 80)) * 0.03)
        : 0;
      // Challenge throw: massive score penalty to place near the bottom
      const throwPenalty = _throwers.has(name) ? 5 + Math.random() * 3 : 0; // -5 to -8
      return { name, score: base - fatigue - injPenalty - survPenalty - throwPenalty + (Math.random()*8-4), threwIt: _throwers.has(name) };
    });
  // ── The Mole: post-merge target sabotage (prevent someone from winning immunity) ──
  // No self-throw post-merge — useless. Only target sabotage: make a threat lose immunity.
  if (gs.moles?.length && gs.isMerged && !_throwDisabled) {
    gs.moles.forEach(mole => {
      if (mole.exposed || mole.layingLow || !candidates.includes(mole.player)) return;
      if (Math.random() >= 0.25) return; // 25% chance post-merge (lower than pre-merge 30%)
      const _coordMole = (seasonConfig.moleCoordination === 'coordinated' && gs.moles.length === 2)
        ? gs.moles.find(ml => ml.player !== mole.player)?.player : null;
      // Target: prefer high threats, players Mole wants gone, players currently winning
      const _sabPool = scored.filter(x => x.name !== mole.player && (_coordMole ? x.name !== _coordMole : true));
      if (!_sabPool.length) return;
      const _target = _sabPool.reduce((best, x) => {
        const xS = pStats(x.name);
        let sc = 0;
        sc += threatScore(x.name) * 0.3; // prefer threats
        sc += x.score * 0.2; // prefer currently high scorers (deny them immunity)
        sc += Math.max(0, -getBond(mole.player, x.name)) * 0.3; // prefer enemies
        // Post-merge Scott mode: prefer players not in Mole's alliance
        const _moleAlliances = (gs.namedAlliances || []).filter(a => a.active && a.members.includes(mole.player));
        const _isAlly = _moleAlliances.some(a => a.members.includes(x.name));
        if (!_isAlly) sc += 1.0;
        // PRIORITY: deny immunity to whoever suspects the Mole — make them vulnerable to elimination
        if (mole.suspicion?.[x.name] >= 0.5) sc += 2.0 + (mole.suspicion[x.name] || 0) * 0.5;
        sc += Math.random() * 0.5;
        return sc > best.sc ? { name: x.name, sc, entry: x } : best;
      }, { name: _sabPool[0].name, sc: -99, entry: _sabPool[0] });
      // Apply penalty
      const _penalty = 1.5 + Math.random() * 2.5;
      _target.entry.score -= _penalty;
      // Log
      mole.sabotageCount++;
      mole.sabotageLog.push({ ep: (gs.episode || 0) + 1, type: 'challengeSabotage', target: _target.name });
      mole.resistance = Math.max(0.15, 0.5 - mole.sabotageCount * 0.03);
      if (!gs._moleChalThrows) gs._moleChalThrows = [];
      gs._moleChalThrows.push({ player: mole.player, tribe: gs.mergeName || 'merge', penalty: _penalty, mode: 'target', target: _target.name });
    });
  }
  scored.sort((a, b) => b.score - a.score);
  const winner = scored[0].name;
  // Update win streaks — winner increments, everyone else resets
  if (!gs.challengeWinStreak) gs.challengeWinStreak = {};
  candidates.forEach(name => { gs.challengeWinStreak[name] = name === winner ? (gs.challengeWinStreak[name] || 0) + 1 : 0; });
  const chalMemberScores = {};
  scored.forEach(s => { chalMemberScores[s.name] = s.score; });

  // ── Challenge throw detection + consequences ──
  const _throwData = [];
  _throwers.forEach(thrower => {
    const tS = pStats(thrower);
    const tPr = pronouns(thrower);
    // Track throw count for escalating detection
    if (!gs.challengeThrowCount) gs.challengeThrowCount = {};
    gs.challengeThrowCount[thrower] = (gs.challengeThrowCount[thrower] || 0) + 1;
    const _throwCount = gs.challengeThrowCount[thrower];
    // Detection: each other player rolls intuition to notice
    // Lower base rate — throwing is subtle. Escalates with repeat throws.
    const _detectors = [];
    candidates.filter(p => p !== thrower).forEach(p => {
      const _detectChance = pStats(p).intuition * 0.015 + (_throwCount - 1) * 0.04;
      if (Math.random() < _detectChance) _detectors.push(p);
    });
    if (_detectors.length) {
      // Caught — consequences
      _detectors.forEach(d => addBond(d, thrower, -0.5));
      // Heat bump for being deceptive
      if (!gs.challengeThrowHeat) gs.challengeThrowHeat = {};
      gs.challengeThrowHeat[thrower] = (gs.episode || 0) + 1;
      // Reset throw count — suspicion is confirmed and out in the open
      gs.challengeThrowCount[thrower] = 0;
    }
    // Heat reduction for successful throw (whether caught or not — you DID place lower)
    // But if caught, the heat reduction is cancelled by the suspicion
    if (!_detectors.length) {
      if (!gs.challengeThrowHeatReduction) gs.challengeThrowHeatReduction = {};
      gs.challengeThrowHeatReduction[thrower] = (gs.episode || 0) + 1;
    }
    _throwData.push({ thrower, detectedBy: _detectors, caught: _detectors.length > 0 });
  });

  return { name: winner, challengeLabel: chal.name, challengeCategory: chal.category, challengeDesc: chal.desc,
    challengeThrows: _throwData.length ? _throwData : null,
           chalPlacements: scored.map(s => s.name), chalMemberScores };
}

