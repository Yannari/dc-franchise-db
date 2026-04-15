// js/chal/dodgebrawl.js
import { gs, players } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord } from '../players.js';
import { addBond } from '../bonds.js';

export function simulateDodgebrawl(ep) {
  const tribes = gs.tribes.filter(t => t.members.filter(m => gs.activePlayers.includes(m)).length >= 2);
  if (tribes.length < 2) return;

  // ── Court size: 5 or smallest tribe's active count ──
  const tribeMembers = tribes.map(t => ({
    name: t.name,
    members: t.members.filter(m => gs.activePlayers.includes(m))
  }));
  const smallestSize = Math.min(...tribeMembers.map(t => t.members.length));
  const courtSize = Math.min(5, smallestSize);

  // ── Per-player "power" base for throw / catch / dodge ──
  function playerPower(name) {
    const s = pStats(name);
    return s.physical * 0.35 + s.intuition * 0.30 + s.endurance * 0.20 + s.mental * 0.15;
  }

  // ── Rotation: advancing sit-out index each round ──
  // With 6 members and 5 court spots, player at index 0 sits round 1, index 1 sits round 2, etc.
  const sitOutIndex = {};
  tribeMembers.forEach(t => { sitOutIndex[t.name] = 0; });

  function pickLineup(tribeName, refusedThisRound) {
    const allMembers = tribeMembers.find(t => t.name === tribeName).members;
    const available = allMembers.filter(m => !refusedThisRound.includes(m));
    if (available.length <= courtSize) return [...available]; // everyone plays

    // Rotating window: sit-out index advances each round, wrapping around
    // With 8 available and court 5, sit out indices [0,1,2], then [3,4,5], then [6,7,0], etc.
    const numSitOut = available.length - courtSize;
    const startIdx = sitOutIndex[tribeName] % available.length;
    const sittingOutSet = new Set();
    for (let i = 0; i < numSitOut; i++) {
      sittingOutSet.add(available[(startIdx + i) % available.length]);
    }
    sitOutIndex[tribeName] += numSitOut; // advance by number sat out
    return available.filter(m => !sittingOutSet.has(m));
  }

  // ── Highlight text pools ──
  const HIGHLIGHT_TEXTS = {
    trickShot: [
      (p) => `${p} winds up and spins the ball sideways. It curves right around a defender and nails the target. Nobody saw it coming.`,
      (p) => `${p} reads the court, fakes left, then snaps the ball at a sharp angle. Clean trick shot. The other tribe just watches.`,
      (p) => `${p} bounces the ball off the back wall — it comes around perfectly. Trick shot. The crowd loses it.`,
    ],
    rageMode: [
      (p, pr) => `${p} switches gears. ${pr.Sub} ${pr.sub === 'they' ? 'stop' : 'stops'} playing defense and just start${pr.sub === 'they' ? '' : 's'} throwing. Three players go down in thirty seconds.`,
      (p, pr) => `Something clicks for ${p}. ${pr.Sub} ${pr.sub === 'they' ? 'grab' : 'grabs'} every ball ${pr.sub} can find and unloads. It's a demolition.`,
      (p, pr) => `${p} goes full berserker. ${pr.PosAdj} tribe just stays out of the way. Four throws, four hits.`,
    ],
    clutchDodge: [
      (p, pr, tribe) => `${p} is the last one left for ${tribe}. ${pr.Sub} ${pr.sub === 'they' ? 'dodge' : 'dodges'} two throws, sidestepping both. Not enough to win, but impossible not to respect.`,
      (p, pr, tribe) => `Everyone else on ${tribe} is out. ${p} alone. ${pr.Sub} ${pr.sub === 'they' ? 'duck' : 'ducks'} a throw, spin${pr.sub === 'they' ? '' : 's'} away from another — then finally ${pr.sub} ${pr.sub === 'they' ? 'go' : 'goes'} down.`,
      (p, pr, tribe) => `${p} refuses to quit. Last standing for ${tribe}, ${pr.sub} ${pr.sub === 'they' ? 'dodge' : 'dodges'} and weave${pr.sub === 'they' ? '' : 's'} until there's nowhere left to go.`,
    ],
    rushStrategy: [
      (p, target) => `${p} points at ${target}. "That one. Everyone." They all fire at once. ${target} goes down under a wall of rubber.`,
      (p, target) => `${p} clocks who to target — ${target}. Calls the shot. The tribe executes. ${target} is out before ${target.split(' ')[0]} can react.`,
      (p, target) => `Calculated. ${p} spots the weak link — ${target} — and directs all fire there. Clean strategy. One coordinated rush.`,
    ],
    friendlyFire: [
      (p, victim, pr) => `${p} releases the throw wild — it sails straight into ${victim}. ${pr.PosAdj} own teammate. The court goes silent, then erupts.`,
      (p, victim, pr) => `${p} panics, throws too early, and nails ${victim} in the shoulder. ${pr.PosAdj} own tribe. The look on ${victim}'s face says everything.`,
      (p, victim, pr) => `Friendly fire. ${p}'s throw misses completely and clips ${victim} on the side of the head. ${pr.PosAdj} own player. Chaos.`,
    ],
    caught: [
      (catcher, thrower) => `${catcher} CATCHES it. ${thrower} is out — eliminated by ${catcher}'s own hands. The court goes silent.`,
      (catcher, thrower) => `${thrower} throws hard — ${catcher} reaches out and snatches it clean. Catch. ${thrower} walks off in disbelief.`,
      (catcher, thrower) => `${catcher} holds position, reads the throw, and catches it with both hands. ${thrower} is done.`,
    ],
    refusalLoss: [
      (p, pr, tribe) => `${p} watched every second from the sideline. ${pr.PosAdj} tribe just lost and ${pr.sub} didn't lift a finger.`,
      (p, pr, tribe) => `${tribe} loses, and ${p} was right there on the bench. ${pr.Sub} ${pr.sub === 'they' ? 'didn\'t' : 'didn\'t'} even flinch.`,
      (p, pr) => `${p} sat this one out. Voluntarily. The tribe remembers.`,
    ],
  };

  function pickText(pool, ...args) {
    const hash = args.join('').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return pool[hash % pool.length](...args);
  }

  // ── Simulate rounds ──
  const rounds = [];
  const tribeWins = {};
  const cumulativeScores = {};
  tribes.forEach(t => { tribeWins[t.name] = 0; cumulativeScores[t.name] = 0; });
  const playerTotalScores = {};
  // Track per-player refusal history for lower-chance-next-round logic
  const refusedLastRound = new Set();
  // All-game refusers (for camp events): players who refused at least once
  const allGameRefusals = [];

  let roundNum = 0;
  const maxWins = 3;
  while (!Object.values(tribeWins).some(w => w >= maxWins) && roundNum < 7) {
    roundNum++;

    // ── Pick lineups FIRST (rotation decides who's supposed to play) ──
    const lineups = {};
    tribeMembers.forEach(t => {
      lineups[t.name] = pickLineup(t.name, []);
    });

    // ── Per-round refusal check: only players IN the lineup can refuse ──
    // Refusal = it's your turn but you say no (the Noah move). Max 1 per tribe.
    const roundRefusals = [];
    tribeMembers.forEach(t => {
      const lineup = lineups[t.name];
      if (!lineup?.length) return;
      // Only check lineup players — bench players aren't refusing, they're just sitting out
      let refuser = null;
      for (const name of lineup) {
        const s = pStats(name);
        // Refusal is RARE — only truly low boldness + low loyalty players (the Noah type)
        // Boldness 2 / loyalty 2 = ~4.5%. Boldness 5 / loyalty 5 = ~0%. Must be extreme stats.
        let chance = Math.max(0, (7 - s.boldness) * 0.01 + (7 - s.loyalty) * 0.008 - 0.05);
        if (refusedLastRound.has(name)) chance *= 2.0; // MORE likely if already established the pattern
        if (Math.random() < chance) { refuser = name; break; } // max 1
      }
      if (refuser) {
        roundRefusals.push({ name: refuser, tribe: t.name });
        if (!allGameRefusals.some(r => r.name === refuser)) allGameRefusals.push({ name: refuser, tribe: t.name });
        // Pull refuser from lineup, replace with bench player if available
        const bench = t.members.filter(m => !lineup.includes(m));
        const idx = lineup.indexOf(refuser);
        if (bench.length) {
          lineup[idx] = bench[0]; // substitute from bench
        } else {
          lineup.splice(idx, 1); // no replacement — team plays short
        }
      }
    });
    refusedLastRound.clear();
    roundRefusals.forEach(r => refusedLastRound.add(r.name));

    // ── Per-player elimination simulation within the round ──
    // Active players per tribe (with power scores + random variance)
    const activePlayers = {};
    tribeMembers.forEach(t => {
      activePlayers[t.name] = lineups[t.name].map(name => ({
        name,
        power: playerPower(name) + Math.random() * 2.0,
        alive: true,
        elimsThisRound: 0,
        dodgesThisRound: 0,
      }));
    });

    const tribeNames = tribeMembers.map(t => t.name);
    const eliminations = []; // { eliminated, eliminatedBy, tribe, eliminatedByTribe, method }

    // Track per-player counts for highlight derivation
    const perPlayerElims = {}; // name -> count eliminated
    const perPlayerDodges = {}; // name -> count dodged

    // Elimination loop: continue until only 1 tribe has survivors
    let loopGuard = 0;
    while (loopGuard++ < 200) {
      const aliveTribes = tribeNames.filter(tn => activePlayers[tn].some(p => p.alive));
      if (aliveTribes.length <= 1) break;

      // Pick thrower: rotate through alive players (weighted random, not always the best)
      const allAlive = aliveTribes.flatMap(tn => activePlayers[tn].filter(p => p.alive).map(p => ({ ...p, tribe: tn })));
      if (allAlive.length < 2) break;
      // Weighted random pick — higher power = more likely but not guaranteed
      const throwerPool = allAlive.map(p => ({ ...p, weight: p.power + Math.random() * 1.5 })).sort((a, b) => b.weight - a.weight);
      // Pick thrower directly from alive pool — no separate find() that can desync
      const throwerEntry = throwerPool[0];
      const bestThrower = activePlayers[throwerEntry.tribe].find(p => p.name === throwerEntry.name && p.alive);
      const bestThrowerTribe = throwerEntry.tribe;
      if (!bestThrower) continue; // stale pool entry — retry

      // Target: weighted random from opposing tribes (lower power = more likely to be targeted)
      const opposingTribes = aliveTribes.filter(tn => tn !== bestThrowerTribe);
      if (!opposingTribes.length) break;
      const targetPool = opposingTribes.flatMap(tn => activePlayers[tn].filter(p => p.alive).map(p => ({ ...p, tribe: tn })));
      if (!targetPool.length) break;
      const targetWeighted = targetPool.map(p => ({ ...p, weight: (12 - p.power) + Math.random() * 2.0 })).sort((a, b) => b.weight - a.weight);
      const targetEntry = targetWeighted[0];
      const weakestTarget = activePlayers[targetEntry.tribe].find(p => p.name === targetEntry.name && p.alive);
      const weakestTargetTribe = targetEntry.tribe;
      if (!weakestTarget) continue; // stale pool entry — retry

      // After throwing, reduce thrower's power so they don't dominate every turn
      bestThrower.power = Math.max(0.5, bestThrower.power - 0.8);

      // Catch check: RARE — max ~2% at intuition 10. Catches are highlight moments, not routine.
      const catcherStats = pStats(weakestTarget.name);
      const canCatch = Math.random() < catcherStats.intuition * 0.002;
      if (canCatch) {
        // Catcher catches — thrower is eliminated instead
        bestThrower.alive = false;
        perPlayerElims[weakestTarget.name] = (perPlayerElims[weakestTarget.name] || 0) + 1;
        eliminations.push({
          eliminated: bestThrower.name,
          eliminatedBy: weakestTarget.name,
          tribe: bestThrowerTribe,
          eliminatedByTribe: weakestTargetTribe,
          method: 'caught',
        });
      } else {
        // Dodge check: base chance from stats, decreases with each dodge (fatigue)
        // First dodge ~40% for high stats, drops ~12% per consecutive dodge so rounds always end
        const dodgeFatigue = (weakestTarget.dodgesThisRound || 0) * 0.12;
        const dodgeChance = catcherStats.intuition * 0.03 + catcherStats.endurance * 0.015 + Math.random() * 0.15 - dodgeFatigue;
        if (dodgeChance > 0.25) {
          // Dodged — fatigue accumulates so eventually they'll get hit
          weakestTarget.dodgesThisRound++;
          perPlayerDodges[weakestTarget.name] = (perPlayerDodges[weakestTarget.name] || 0) + 1;
          weakestTarget.power = Math.max(0, weakestTarget.power - 0.5);
          eliminations.push({
            eliminated: null,
            eliminatedBy: bestThrower.name,
            tribe: null,
            eliminatedByTribe: bestThrowerTribe,
            method: 'dodged',
            dodger: weakestTarget.name,
            dodgerTribe: weakestTargetTribe,
          });
        } else {
          // Friendly fire check: low physical thrower, 10% per throw
          const throwerStats = pStats(bestThrower.name);
          const friendlyFireChance = throwerStats.physical <= 4 ? 0.10 : 0;
          const isFriendlyFire = Math.random() < friendlyFireChance;
          if (isFriendlyFire) {
            // Find an alive friendly teammate
            const friendlyTeammates = activePlayers[bestThrowerTribe].filter(p => p.alive && p.name !== bestThrower.name);
            if (friendlyTeammates.length) {
              const victim = friendlyTeammates[Math.floor(Math.random() * friendlyTeammates.length)];
              victim.alive = false;
              perPlayerElims[bestThrower.name] = (perPlayerElims[bestThrower.name] || 0) + 1;
              eliminations.push({
                eliminated: victim.name,
                eliminatedBy: bestThrower.name,
                tribe: bestThrowerTribe,
                eliminatedByTribe: bestThrowerTribe,
                method: 'friendlyFire',
              });
            } else {
              // No friendly to hit — normal hit instead
              weakestTarget.alive = false;
              perPlayerElims[bestThrower.name] = (perPlayerElims[bestThrower.name] || 0) + 1;
              eliminations.push({
                eliminated: weakestTarget.name,
                eliminatedBy: bestThrower.name,
                tribe: weakestTargetTribe,
                eliminatedByTribe: bestThrowerTribe,
                method: 'hit',
              });
            }
          } else {
            weakestTarget.alive = false;
            perPlayerElims[bestThrower.name] = (perPlayerElims[bestThrower.name] || 0) + 1;
            eliminations.push({
              eliminated: weakestTarget.name,
              eliminatedBy: bestThrower.name,
              tribe: weakestTargetTribe,
              eliminatedByTribe: bestThrowerTribe,
              method: 'hit',
            });
          }
        }
      }
    }

    // ── Determine round winner: tribe with surviving players ──
    const aliveAfter = tribeNames.filter(tn => activePlayers[tn].some(p => p.alive));
    const roundWinner = aliveAfter.length === 1
      ? aliveAfter[0]
      // Tiebreaker: most alive players, then highest combined power
      : tribeNames.reduce((best, tn) => {
          const aliveCount = activePlayers[tn].filter(p => p.alive).length;
          const bestAlive = activePlayers[best]?.filter(p => p.alive).length || 0;
          if (aliveCount > bestAlive) return tn;
          if (aliveCount === bestAlive) {
            const tnPower = activePlayers[tn].filter(p => p.alive).reduce((s, p) => s + p.power, 0);
            const bestPower = activePlayers[best].filter(p => p.alive).reduce((s, p) => s + p.power, 0);
            return tnPower > bestPower ? tn : best;
          }
          return best;
        }, tribeNames[0]);

    tribeWins[roundWinner]++;

    // ── Derive scores from elimination data ──
    const roundScores = {};
    tribeMembers.forEach(t => {
      roundScores[t.name] = {};
      (lineups[t.name] || []).forEach(name => {
        const elimsBy = (perPlayerElims[name] || 0);
        const dodges = (perPlayerDodges[name] || 0);
        const base = playerPower(name);
        roundScores[t.name][name] = base + elimsBy * 1.5 + dodges * 0.5;
        playerTotalScores[name] = (playerTotalScores[name] || 0) + roundScores[t.name][name];
        cumulativeScores[t.name] = (cumulativeScores[t.name] || 0) + roundScores[t.name][name];
      });
    });
    const tribeTotals = {};
    tribeMembers.forEach(t => {
      tribeTotals[t.name] = Object.values(roundScores[t.name]).reduce((s, v) => s + v, 0);
    });

    // ── Derive highlights from elimination sequence ──
    const highlights = [];
    const loserTribes = tribeNames.filter(tn => tn !== roundWinner);

    // Trick Shot: mental >= 7 AND eliminated 2+ players this round
    tribeNames.forEach(tn => {
      if (highlights.length >= 3) return;
      (lineups[tn] || []).forEach(name => {
        if (highlights.length >= 3) return;
        if (pStats(name).mental >= 7 && (perPlayerElims[name] || 0) >= 2) {
          highlights.push({
            type: 'trickShot', player: name, tribe: tn,
            text: pickText(HIGHLIGHT_TEXTS.trickShot, name),
          });
          // Bond with teammate
          const teammate = (lineups[tn] || []).find(p => p !== name);
          if (teammate) addBond(name, teammate, 0.3);
        }
      });
    });

    // Rage Mode: eliminated 3+ players in one round
    tribeNames.forEach(tn => {
      if (highlights.length >= 3) return;
      (lineups[tn] || []).forEach(name => {
        if (highlights.length >= 3) return;
        if ((perPlayerElims[name] || 0) >= 3 && !highlights.some(h => h.player === name)) {
          const pr = pronouns(name);
          highlights.push({
            type: 'rageMode', player: name, tribe: tn,
            text: pickText(HIGHLIGHT_TEXTS.rageMode, name, pr),
          });
          if (!gs._dodgebrawlHeat) gs._dodgebrawlHeat = {};
          gs._dodgebrawlHeat[name] = { amount: 1.0, expiresEp: ((gs.episode || 0) + 1) + 1 };
        }
      });
    });

    // Clutch Dodge: last survivor on a losing tribe who dodged 2+ throws (max 1 per round)
    loserTribes.forEach(lt => {
      if (highlights.length >= 3) return;
      // Find who was eliminated last on this tribe (they held out the longest)
      const ltElims = eliminations.filter(e => e.eliminated && e.tribe === lt);
      const lastElim = ltElims.length ? ltElims[ltElims.length - 1].eliminated : null;
      if (lastElim && (perPlayerDodges[lastElim] || 0) >= 2 && !highlights.some(h => h.player === lastElim)) {
        const pr = pronouns(lastElim);
        highlights.push({
          type: 'clutchDodge', player: lastElim, tribe: lt,
          text: pickText(HIGHLIGHT_TEXTS.clutchDodge, lastElim, pr, lt),
        });
        (lineups[lt] || []).filter(p => p !== lastElim).forEach(p => addBond(p, lastElim, 0.3));
      }
    });

    // Rush Strategy: strategic >= 7 player on winning tribe, first 2 eliminations target same player
    if (highlights.length < 3 && roundNum >= 2) {
      const firstElims = eliminations.filter(e => e.method === 'hit' && e.tribe && loserTribes.includes(e.tribe));
      if (firstElims.length >= 2 && firstElims[0].eliminated === firstElims[1].eliminated) {
        // Shouldn't happen with one-at-a-time, but check for same-tribe targeting
      }
      const strategist = (lineups[roundWinner] || []).find(p => pStats(p).strategic >= 7);
      // Rush: 2+ eliminations on the same opposing tribe early
      const firstTarget = eliminations.find(e => e.method === 'hit' && e.tribe && loserTribes.includes(e.tribe))?.eliminated;
      if (strategist && firstTarget && !highlights.some(h => h.player === strategist)) {
        const pr = pronouns(strategist);
        highlights.push({
          type: 'rushStrategy', player: strategist, target: firstTarget, tribe: roundWinner,
          text: pickText(HIGHLIGHT_TEXTS.rushStrategy, strategist, firstTarget),
        });
        if (!gs.playerStates) gs.playerStates = {};
        const _bm = gs.playerStates[strategist] || {};
        _bm.bigMoves = (_bm.bigMoves || 0) + 1;
        gs.playerStates[strategist] = _bm;
        if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
        if (!gs.bigMoveEarnersThisEp.includes(strategist)) gs.bigMoveEarnersThisEp.push(strategist);
      }
    }

    // Friendly Fire: if any friendly fire happened this round
    const ffEvent = eliminations.find(e => e.method === 'friendlyFire');
    if (ffEvent && highlights.length < 3 && !highlights.some(h => h.player === ffEvent.eliminatedBy)) {
      const pr = pronouns(ffEvent.eliminatedBy);
      highlights.push({
        type: 'friendlyFire', player: ffEvent.eliminatedBy, victim: ffEvent.eliminated, tribe: ffEvent.tribe,
        text: pickText(HIGHLIGHT_TEXTS.friendlyFire, ffEvent.eliminatedBy, ffEvent.eliminated, pr),
      });
      addBond(ffEvent.eliminated, ffEvent.eliminatedBy, -0.5);
    }

    // Catch: if any catch happened this round
    const catchEvent = eliminations.find(e => e.method === 'caught');
    if (catchEvent && highlights.length < 3 && !highlights.some(h => h.player === catchEvent.eliminatedBy)) {
      highlights.push({
        type: 'caught', player: catchEvent.eliminatedBy, victim: catchEvent.eliminated, tribe: catchEvent.eliminatedByTribe,
        text: pickText(HIGHLIGHT_TEXTS.caught, catchEvent.eliminatedBy, catchEvent.eliminated),
      });
    }

    // Refusal + loss: check per round
    roundRefusals.forEach(r => {
      if (loserTribes.includes(r.tribe) && highlights.length < 3) {
        const pr = pronouns(r.name);
        highlights.push({
          type: 'refusalLoss', player: r.name, tribe: r.tribe,
          text: pickText(HIGHLIGHT_TEXTS.refusalLoss, r.name, pr, r.tribe),
        });
        const rMembers = tribeMembers.find(t => t.name === r.tribe)?.members.filter(m => m !== r.name) || [];
        rMembers.forEach(m => addBond(m, r.name, -0.5));
        if (!gs._dodgebrawlHeat) gs._dodgebrawlHeat = {};
        gs._dodgebrawlHeat[r.name] = { amount: 1.5, expiresEp: ((gs.episode || 0) + 1) + 1 };
      }
    });

    rounds.push({
      num: roundNum,
      winner: roundWinner,
      lineups,
      refusals: roundRefusals,
      eliminations,
      highlights,
      scores: roundScores,
      tribeScores: tribeTotals,
    });
  }

  // ── Determine winner and loser ──
  const finalSorted = Object.entries(tribeWins).sort(([,a], [,b]) => b - a);
  const winnerName = finalSorted[0][0];
  const loserCandidates = finalSorted.filter(([,w]) => w === finalSorted[finalSorted.length - 1][1]);
  const loserName = loserCandidates.length === 1
    ? loserCandidates[0][0]
    : loserCandidates.sort(([a], [b]) => {
        const aSize = tribeMembers.find(t => t.name === a)?.members.length || 1;
        const bSize = tribeMembers.find(t => t.name === b)?.members.length || 1;
        return ((cumulativeScores[a] || 0) / aSize) - ((cumulativeScores[b] || 0) / bSize);
      })[0][0];

  const winner = gs.tribes.find(t => t.name === winnerName);
  const loser = gs.tribes.find(t => t.name === loserName);

  // ── Refusers get score 0 ──
  allGameRefusals.forEach(r => { playerTotalScores[r.name] = 0; });

  // ── Set ep fields ──
  ep.winner = winner;
  ep.loser = loser;
  ep.challengeType = 'tribe';
  ep.tribalPlayers = [...loser.members];
  ep.challengeLabel = 'Dodgebrawl';
  ep.challengeCategory = 'physical';
  ep.challengeDesc = `Multi-round dodgeball. First to ${maxWins} wins immunity.`;
  ep.chalMemberScores = playerTotalScores;
  ep.chalSitOuts = {};

  tribeMembers.forEach(t => {
    const allPlayed = new Set();
    rounds.forEach(r => Object.keys(r.lineups[t.name] ? r.lineups[t.name].reduce((o, p) => { o[p] = 1; return o; }, {}) : {}).forEach(p => allPlayed.add(p)));
    const satOut = t.members.filter(m => !allPlayed.has(m));
    if (satOut.length) ep.chalSitOuts[t.name] = satOut;
  });

  updateChalRecord(ep);

  // ── Generate camp events (2 per tribe: 1 positive + 1 negative) ──
  if (!ep.campEvents) ep.campEvents = {};
  tribeMembers.forEach(t => {
    const key = t.name;
    if (!ep.campEvents[key]) ep.campEvents[key] = { pre: [], post: [] };
    if (!ep.campEvents[key].post) ep.campEvents[key].post = [];

    const memberScores = t.members.map(name => ({
      name,
      total: playerTotalScores[name] || 0,
      expected: (() => { const s = pStats(name); return s.physical * 0.35 + s.intuition * 0.30 + s.endurance * 0.20 + s.mental * 0.15; })() * rounds.length
    }));
    const sorted = memberScores.sort((a, b) => b.total - a.total);

    // ── POSITIVE EVENT ──
    const mvp = sorted[0];
    const nonMvpSorted = sorted.slice(1);
    const round1Scores = rounds[0]?.scores[t.name] || {};
    const redemptionCandidate = sorted.find(p => {
      const r1Score = round1Scores[p.name] || 0;
      const r1Sorted = Object.values(round1Scores).sort((a, b) => a - b);
      const isBottomHalf = r1Score <= (r1Sorted[Math.floor(r1Sorted.length / 2)] || 0);
      const wasTopLater = rounds.slice(1).some(r => {
        const rScores = r.scores[t.name] || {};
        const rSorted = Object.entries(rScores).sort(([,a], [,b]) => b - a);
        return rSorted[0]?.[0] === p.name;
      });
      return isBottomHalf && wasTopLater;
    });

    if (redemptionCandidate && redemptionCandidate.name !== mvp.name) {
      const pr = pronouns(redemptionCandidate.name);
      ep.campEvents[key].post.push({
        type: 'dodgebrawlRedemption', players: [redemptionCandidate.name],
        text: `${redemptionCandidate.name} started rough — one of the worst in round 1. But ${pr.sub} came back hard. When it mattered, ${pr.sub} delivered.`,
        consequences: '+0.3 bond from tribemates.',
        badgeText: 'REDEMPTION', badgeClass: 'gold'
      });
      t.members.filter(m => m !== redemptionCandidate.name).forEach(m => addBond(m, redemptionCandidate.name, 0.3));
    } else if (nonMvpSorted.length) {
      const teamPlayer = nonMvpSorted.sort((a, b) => {
        const sA = pStats(a.name); const sB = pStats(b.name);
        return (sB.social * 0.5 + sB.loyalty * 0.5) - (sA.social * 0.5 + sA.loyalty * 0.5);
      })[0];
      if (teamPlayer) {
        const pr = pronouns(teamPlayer.name);
        ep.campEvents[key].post.push({
          type: 'dodgebrawlTeamPlayer', players: [teamPlayer.name, mvp.name],
          text: `${teamPlayer.name} didn't need the spotlight. ${pr.Sub} kept feeding balls to ${mvp.name}, set up plays, covered gaps. That kind of selflessness doesn't go unnoticed.`,
          consequences: '+0.4 bond with tribemates.',
          badgeText: 'TEAM PLAYER', badgeClass: 'gold'
        });
        t.members.filter(m => m !== teamPlayer.name).slice(0, 2).forEach(m => addBond(m, teamPlayer.name, 0.4));
      }
    } else {
      const pr = pronouns(mvp.name);
      ep.campEvents[key].post.push({
        type: 'dodgebrawlHero', players: [mvp.name],
        text: `${mvp.name} carried the team. Every round, ${pr.sub} ${pr.sub === 'they' ? 'were' : 'was'} the one making plays.`,
        consequences: '+0.5 bond, +2 popularity.',
        badgeText: 'DODGEBALL HERO', badgeClass: 'gold'
      });
      t.members.filter(m => m !== mvp.name).forEach(m => addBond(m, mvp.name, 0.5));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[mvp.name] = (gs.popularity[mvp.name] || 0) + 2;
    }

    // ── NEGATIVE EVENT ──
    const refuser = allGameRefusals.find(r => r.tribe === t.name);
    if (refuser) {
      const pr = pronouns(refuser.name);
      ep.campEvents[key].post.push({
        type: 'dodgebrawlRefusal', players: [refuser.name],
        text: `${refuser.name} sat out. ${pr.Sub} gave the team nothing — just commentary from the sideline.`,
        consequences: '-0.5 bond from all tribemates, +1.5 heat.',
        badgeText: 'REFUSED TO PLAY', badgeClass: 'red'
      });
      t.members.filter(m => m !== refuser.name).forEach(m => addBond(m, refuser.name, -0.5));
      if (!gs._dodgebrawlHeat) gs._dodgebrawlHeat = {};
      gs._dodgebrawlHeat[refuser.name] = { amount: 1.5, expiresEp: ((gs.episode || 0) + 1) + 1 };
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[refuser.name] = (gs.popularity[refuser.name] || 0) - 2; // sat out dodgebrawl = dead weight edit
    } else {
      const worstPerformer = sorted[sorted.length - 1];
      const biggestChoke = [...memberScores].sort((a, b) => (a.total - a.expected) - (b.total - b.expected))[0];
      const chokeGap = biggestChoke ? biggestChoke.expected - biggestChoke.total : 0;
      const useChoke = chokeGap > 1.5 && biggestChoke.name !== worstPerformer?.name;

      if (useChoke && biggestChoke) {
        const pr = pronouns(biggestChoke.name);
        ep.campEvents[key].post.push({
          type: 'dodgebrawlChoke', players: [biggestChoke.name],
          text: `${biggestChoke.name} was supposed to be good at this. ${pr.Sub} ${pr.sub === 'they' ? 'weren\'t' : 'wasn\'t'}. The tribe expected more and got less.`,
          consequences: '-0.3 bond, +0.5 heat.',
          badgeText: 'CHOKED', badgeClass: 'red'
        });
        t.members.filter(m => m !== biggestChoke.name).forEach(m => addBond(m, biggestChoke.name, -0.3));
        if (!gs._dodgebrawlHeat) gs._dodgebrawlHeat = {};
        gs._dodgebrawlHeat[biggestChoke.name] = { amount: 0.5, expiresEp: ((gs.episode || 0) + 1) + 1 };
      } else if (worstPerformer) {
        const pr = pronouns(worstPerformer.name);
        const isLoser = t.name === loserName;
        ep.campEvents[key].post.push({
          type: 'dodgebrawlLiability', players: [worstPerformer.name],
          text: `${worstPerformer.name} was the weakest link on the court. ${isLoser ? 'The tribe knows exactly who cost them.' : 'Even in a win, the tribe noticed.'}`,
          consequences: `${isLoser ? '-0.3 bond, +0.5 heat.' : '-0.2 bond.'}`,
          badgeText: 'LIABILITY', badgeClass: 'red'
        });
        const bondDelta = isLoser ? -0.3 : -0.2;
        t.members.filter(m => m !== worstPerformer.name).forEach(m => addBond(m, worstPerformer.name, bondDelta));
        if (isLoser) {
          if (!gs._dodgebrawlHeat) gs._dodgebrawlHeat = {};
          gs._dodgebrawlHeat[worstPerformer.name] = { amount: 0.5, expiresEp: ((gs.episode || 0) + 1) + 1 };
        }
      }
    }
  });

  // ── Store dodgebrawl data ──
  ep.dodgebrawl = {
    rounds, courtSize, allGameRefusals, tribeWins, cumulativeScores,
    winner: winnerName, loser: loserName,
    finalScore: tribeWins,
    mvp: Object.entries(playerTotalScores).sort(([,a], [,b]) => b - a)[0]?.[0] || null,
  };
}

export function _textDodgebrawl(ep, ln, sec) {
  if (!ep.isDodgebrawl || !ep.dodgebrawl) return;
  const db = ep.dodgebrawl;
  sec('DODGEBRAWL');
  ln(`${db.courtSize}v${db.courtSize} dodgeball — first to 3 wins immunity.`);
  if (db.refusers?.length) ln(`Refused to play: ${db.refusers.map(r => r.name).join(', ')}`);
  db.rounds.forEach(r => {
    let line = `Round ${r.num}: ${r.winner} wins.`;
    r.highlights.forEach(h => {
      if (h.type === 'trickShot') line += ` ${h.player} trick shot.`;
      else if (h.type === 'rageMode') line += ` ${h.player} rage mode.`;
      else if (h.type === 'clutchDodge') line += ` ${h.player} clutch dodge.`;
      else if (h.type === 'rushStrategy') line += ` ${h.player} calls rush strategy.`;
      else if (h.type === 'friendlyFire') line += ` ${h.player} friendly fire on ${h.victim}.`;
      else if (h.type === 'refusal') line += ` ${h.player} sat out again.`;
    });
    ln(line);
  });
  ln(`Final: ${Object.entries(db.finalScore).map(([t, w]) => `${t} ${w}`).join(' — ')}`);
  ln(`Winner: ${db.winner}. ${db.loser} goes to tribal.`);
  if (db.mvp) ln(`MVP: ${db.mvp}`);
}

export function rpBuildDodgebrawl(ep) {
  const db = ep.dodgebrawl;
  if (!db?.rounds?.length) return null;

  const stateKey = `db_reveal_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];
  const tribeList = Object.keys(db.tribeWins);

  // ── Build flat steps array: each event is its own reveal ──
  const steps = [];
  db.rounds.forEach((r, ri) => {
    // Filter events for this round (same logic as before)
    const elimSoFar = new Set();
    const display = [];
    (r.eliminations || []).forEach(ev => {
      if (ev.method === 'dodged') {
        if (!elimSoFar.has(ev.dodger) && !elimSoFar.has(ev.eliminatedBy)) display.push(ev);
      } else {
        display.push(ev);
        if (ev.eliminated) elimSoFar.add(ev.eliminated);
      }
    });
    let dc = 0;
    const filtered = display.filter(ev => {
      if (ev.method === 'dodged') { dc++; return dc <= 3; }
      return true;
    });

    // Step: round start (bumper + court with no one eliminated yet)
    steps.push({ type: 'round-start', round: r, roundIdx: ri, events: filtered });
    // Step: each event individually
    filtered.forEach((ev, ei) => {
      steps.push({ type: 'event', round: r, roundIdx: ri, event: ev, eventIdx: ei, events: filtered });
    });
    // Step: round end (winner + highlights)
    steps.push({ type: 'round-end', round: r, roundIdx: ri });
  });

  const totalSteps = steps.length;
  const allRevealed = state.idx >= totalSteps - 1;

  const _dbReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  // Compute scoreboard: count round-end steps revealed
  const revealedWins = {};
  tribeList.forEach(t => { revealedWins[t] = 0; });
  steps.forEach((s, si) => { if (si <= state.idx && s.type === 'round-end') revealedWins[s.round.winner]++; });

  // ── Helper: badge style by type ──
  function highlightStyle(type) {
    if (type === 'friendlyFire' || type === 'refusalLoss') return { color: '#f85149', label: type === 'friendlyFire' ? 'FRIENDLY FIRE' : 'REFUSED' };
    if (type === 'clutchDodge') return { color: '#58a6ff', label: 'CLUTCH DODGE' };
    if (type === 'caught') return { color: '#3fb950', label: 'CAUGHT!' };
    if (type === 'rageMode') return { color: '#da3633', label: 'RAGE MODE' };
    if (type === 'rushStrategy') return { color: '#d2a8ff', label: 'RUSH STRATEGY' };
    return { color: '#f0a500', label: 'TRICK SHOT' };
  }

  // ── Helper: render court side ──
  function renderCourtSide(tribeName, lineupArr, refusalsThisRound, allMembers, eliminatedSet) {
    const tc = tribeColor(tribeName);
    const refusedNames = (refusalsThisRound || []).filter(r => r.tribe === tribeName).map(r => r.name);
    const lineupSet = new Set(lineupArr || []);
    const sitOuts = (allMembers || []).filter(m => !lineupSet.has(m) && !refusedNames.includes(m));
    let out = `<div class="db-court-side">
      <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:${tc};margin-bottom:6px">${tribeName}</div>
      <div class="db-court-roster">`;
    (lineupArr || []).forEach(name => {
      const isOut = eliminatedSet.has(name);
      out += `<div class="db-court-player${isOut ? ' out' : ''}">
        ${rpPortrait(name, 'pb-xs')}
        <div style="font-size:7px;color:${isOut ? '#484f58' : '#8b949e'};margin-top:2px;max-width:40px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name.split(' ')[0]}</div>
      </div>`;
    });
    sitOuts.forEach(name => {
      out += `<div class="db-court-player sitout">${rpPortrait(name, 'pb-xs')}<div style="font-size:6px;font-weight:700;color:#484f58;letter-spacing:0.5px;margin-top:2px">BENCH</div></div>`;
    });
    refusedNames.forEach(name => {
      out += `<div class="db-court-player refused"><div style="border:2px solid #f85149;border-radius:6px;padding:1px">${rpPortrait(name, 'pb-xs')}</div><div style="font-size:6px;font-weight:800;color:#f85149;letter-spacing:0.5px;margin-top:2px">REFUSED</div></div>`;
    });
    out += `</div></div>`;
    return out;
  }

  // ── Helper: render elimination card ──
  function renderElimCard(ev) {
    if (!ev) return '';
    const _player = (name, tribe, isOut) => {
      const tc = tribe ? tribeColor(tribe) : '#8b949e';
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;min-width:48px;max-width:60px${isOut ? ';opacity:0.5' : ''}">
        ${rpPortrait(name, 'pb-sm')}
        <span style="font-size:8px;color:${tc};font-weight:600;text-align:center;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>
        ${isOut ? '<span style="font-size:7px;font-weight:800;letter-spacing:0.5px;color:#f85149;background:rgba(248,81,73,0.12);padding:1px 4px;border-radius:2px">OUT</span>' : ''}
      </div>`;
    };
    const styles = {
      hit:          { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.06)', label: 'HIT', labelColor: '#e6edf3', arrow: '\u2192' },
      caught:       { bg: 'rgba(63,185,80,0.05)',   border: 'rgba(63,185,80,0.15)',   label: 'CATCH', labelColor: '#3fb950', arrow: '\u27F5' },
      friendlyFire: { bg: 'rgba(248,81,73,0.05)',   border: 'rgba(248,81,73,0.15)',   label: 'FRIENDLY FIRE', labelColor: '#f85149', arrow: '\u2192' },
      dodged:       { bg: 'rgba(88,166,255,0.03)',   border: 'rgba(88,166,255,0.1)',   label: 'DODGE', labelColor: '#58a6ff', arrow: '\u219B' }
    };
    const s = styles[ev.method] || styles.hit;
    if (ev.method === 'dodged') {
      return `<div class="db-elim-card" style="background:${s.bg};border:1px solid ${s.border}">
        ${_player(ev.eliminatedBy, ev.eliminatedByTribe, false)}
        <div class="db-elim-action" style="color:${s.labelColor}"><span style="font-size:14px;opacity:0.5">${s.arrow}</span><span>${s.label}</span></div>
        ${_player(ev.dodger, ev.dodgerTribe, false)}
      </div>`;
    }
    const thrower = ev.eliminatedBy, throwerTribe = ev.eliminatedByTribe || ev.tribe;
    const target = ev.eliminated, targetTribe = ev.method === 'friendlyFire' ? ev.eliminatedByTribe : ev.tribe;
    return `<div class="db-elim-card" style="background:${s.bg};border:1px solid ${s.border}">
      ${_player(thrower, throwerTribe, false)}
      <div class="db-elim-action" style="color:${s.labelColor}"><span style="font-size:14px;opacity:0.5">${s.arrow}</span><span>${s.label}</span></div>
      ${_player(target, targetTribe, true)}
    </div>`;
  }

  // ── Helper: alive bar ──
  function aliveBar(roundTribes, aliveCount) {
    return `<div class="db-alive-bar">${roundTribes.map(tn => {
      const tc = tribeColor(tn);
      return `<span style="color:${tc}">${tn}: ${aliveCount[tn]}</span>`;
    }).join(' <span style="color:#30363d">\u2502</span> ')}</div>`;
  }

  // ── Build HTML ──
  let html = `<div class="rp-page db-wrap">
    <div style="text-align:center;font-size:9px;font-weight:700;letter-spacing:3px;color:#484f58;margin-bottom:12px">EPISODE ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:32px;letter-spacing:3px;text-align:center;color:#e06030;text-shadow:0 0 24px rgba(224,96,48,0.2);margin-bottom:4px">DODGEBRAWL</div>
    <div style="text-align:center;font-size:11px;color:#6e7681;margin-bottom:14px;letter-spacing:0.3px">${db.courtSize}v${db.courtSize} \u00b7 First to 3 wins immunity</div>`;

  // ── Broadcast Scoreboard ──
  html += `<div class="db-scoreboard">`;
  tribeList.forEach((tribe, ti) => {
    const tc = tribeColor(tribe);
    const wins = revealedWins[tribe] || 0;
    const isChamp = allRevealed && tribe === db.winner;
    html += `<div class="db-score-side${ti > 0 ? ' right' : ''}">
      <div class="db-score-num" style="color:${tc};${isChamp ? 'animation:dbScoreFlash 0.6s var(--ease-broadcast) both' : ''}">${wins}</div>
      <div>
        <div style="font-size:10px;font-weight:700;color:${tc};letter-spacing:0.5px">${tribe}</div>
        <div class="db-score-dots" style="color:${tc};${ti > 0 ? 'justify-content:flex-end' : ''}">
          ${[0,1,2].map(d => `<div class="db-score-dot${d < wins ? ' filled' : ''}" style="${d < wins ? 'animation-delay:' + (d * 0.1) + 's' : ''}"></div>`).join('')}
        </div>
      </div>
    </div>`;
    if (ti < tribeList.length - 1) html += `<div class="db-score-vs">VS</div>`;
  });
  html += `</div>`;

  // ── Render steps ──
  // Track which round card is currently open
  let currentOpenRound = -1;

  steps.forEach((step, si) => {
    const isVisible = si <= state.idx;

    if (step.type === 'round-start') {
      // Show placeholder for unrevealed rounds
      if (!isVisible) {
        // Only show placeholder if this is the first step of the round (avoid duplicates)
        html += `<div style="padding:10px;margin-bottom:4px;border:1px solid rgba(224,96,48,0.04);border-radius:6px;opacity:0.06;font-size:10px;text-align:center;color:#484f58">\u00b7\u00b7\u00b7</div>`;
        return;
      }
      currentOpenRound = step.roundIdx;
      const r = step.round;
      const rTC = tribeColor(r.winner);
      const roundTribes = Object.keys(r.lineups || {});

      // Round bumper
      html += `<div class="db-round-bumper">
        <div style="font-size:9px;font-weight:700;letter-spacing:3px;color:#484f58;margin-bottom:2px">ROUND</div>
        <div style="font-family:var(--font-display);font-size:28px;color:#e06030;letter-spacing:2px">${r.num}</div>
      </div>`;

      html += `<div style="padding:12px;margin-bottom:10px;border-radius:10px;border:1px solid ${rTC}18;background:${rTC}04">`;

      // Court layout — compute eliminations revealed so far for THIS round
      const elimRevealed = new Set();
      steps.forEach((s2, s2i) => {
        if (s2i <= state.idx && s2.type === 'event' && s2.roundIdx === step.roundIdx && s2.event.eliminated) {
          elimRevealed.add(s2.event.eliminated);
        }
      });

      html += `<div class="db-court">`;
      roundTribes.forEach((tn, ti) => {
        const allMembers = (ep.tribesAtStart || []).find(t => t.name === tn)?.members || r.lineups[tn] || [];
        html += renderCourtSide(tn, r.lineups[tn], r.refusals, allMembers, elimRevealed);
        if (ti < roundTribes.length - 1) html += `<div class="db-court-divider"></div>`;
      });
      html += `</div>`;

      // Initial alive bar
      const aliveCount = {};
      roundTribes.forEach(tn => { aliveCount[tn] = (r.lineups[tn] || []).length; });
      // Subtract revealed eliminations
      elimRevealed.forEach(name => {
        const evStep = steps.find(s2 => s2.type === 'event' && s2.roundIdx === step.roundIdx && s2.event.eliminated === name);
        if (evStep?.event?.tribe) aliveCount[evStep.event.tribe] = Math.max(0, (aliveCount[evStep.event.tribe] || 1) - 1);
      });
      if (step.events.length) html += aliveBar(roundTribes, aliveCount);

    } else if (step.type === 'event') {
      if (!isVisible) return; // hidden events don't render placeholders
      html += renderElimCard(step.event);
      // Show updated alive bar after elimination events
      if (step.event.eliminated && step.event.tribe) {
        const r = step.round;
        const roundTribes = Object.keys(r.lineups || {});
        const aliveCount = {};
        roundTribes.forEach(tn => { aliveCount[tn] = (r.lineups[tn] || []).length; });
        // Count all revealed eliminations up to and including this step
        steps.forEach((s2, s2i) => {
          if (s2i <= si && s2.type === 'event' && s2.roundIdx === step.roundIdx && s2.event.eliminated && s2.event.tribe) {
            aliveCount[s2.event.tribe] = Math.max(0, (aliveCount[s2.event.tribe] || 1) - 1);
          }
        });
        html += aliveBar(roundTribes, aliveCount);
      }

    } else if (step.type === 'round-end') {
      if (!isVisible) return;
      const r = step.round;
      const rTC = tribeColor(r.winner);

      // Round winner
      html += `<div class="db-round-winner" style="border:2px solid ${rTC};background:${rTC}0a">
        <span style="font-family:var(--font-display);font-size:16px;letter-spacing:2px;color:${rTC}">${r.winner.toUpperCase()} WINS ROUND ${r.num}</span>
      </div>`;

      // Highlights
      if (r.highlights?.length) {
        r.highlights.forEach(h => {
          const hs = highlightStyle(h.type);
          html += `<div class="db-highlight" style="background:${hs.color}08;border-left:2px solid ${hs.color}">
            <span class="db-highlight-replay">REPLAY</span>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              ${rpPortrait(h.player, 'pb-xs')}
              <span style="font-size:9px;font-weight:800;letter-spacing:1px;color:${hs.color}">${hs.label}</span>
            </div>
            <div style="font-size:12px;color:#c9d1d9;line-height:1.5">${h.text}</div>
          </div>`;
        });
      }

      html += `</div>`; // close the round card opened in round-start
    }
  });

  // ── Championship result ──
  if (allRevealed) {
    const wTC = tribeColor(db.winner);
    html += `<div class="db-championship" style="border:2px solid ${wTC};background:${wTC}08">
      <div style="font-family:var(--font-display);font-size:26px;letter-spacing:3px;color:${wTC};margin-bottom:6px;text-shadow:0 0 20px ${wTC}44">${db.winner} WINS</div>
      <div style="font-family:var(--font-display);font-size:16px;letter-spacing:2px;color:#3fb950;margin-bottom:8px">IMMUNITY</div>
      <div style="font-size:11px;color:#6e7681;margin-bottom:${db.mvp ? '14px' : '0'}">${db.loser} goes to tribal council.</div>
      ${db.mvp ? `<div style="display:inline-block">
        ${rpPortrait(db.mvp, 'lg')}
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#f0a500;margin-top:6px">MVP \u2014 ${db.mvp}</div>
      </div>` : ''}
    </div>`;
  }

  // ── Sticky nav ──
  if (!allRevealed) {
    html += `<div style="position:sticky;bottom:0;padding:14px 0;text-align:center;background:linear-gradient(transparent,rgba(15,10,6,0.95) 25%);z-index:5">
      <button class="rp-btn" onclick="${_dbReveal(state.idx + 1)}">NEXT (${state.idx + 2}/${totalSteps})</button>
      <button class="rp-btn" style="margin-left:8px;opacity:0.6" onclick="${_dbReveal(totalSteps - 1)}">REVEAL ALL</button>
    </div>`;
  }

  html += `</div>`;
  return html;
}

