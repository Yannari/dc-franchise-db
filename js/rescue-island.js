// js/rescue-island.js - Rescue Island (RI) lifecycle: duels, life events, reentry
import { gs, seasonConfig } from './core.js';
import { pStats, pronouns, getPlayerState } from './players.js';
import { getBond, addBond } from './bonds.js';
import { wRandom } from './alliances.js';

export const RI_DUEL_CHALLENGES = [
  { id: 'fire-making', name: 'Fire-Making', desc: 'First to build a sustainable fire wins.',
    stat: s => s.endurance * 0.5 + s.physical * 0.4 + s.temperament * 0.1 },
  { id: 'speed-puzzle', name: 'Speed Puzzle', desc: 'First to complete a slide puzzle wins.',
    stat: s => s.mental * 0.6 + s.strategic * 0.3 + s.temperament * 0.1 },
  { id: 'endurance-hold', name: 'Endurance Hold', desc: 'Hold position as long as possible. Last one standing wins.',
    stat: s => s.endurance * 0.6 + s.physical * 0.2 + s.temperament * 0.2 },
  { id: 'precision-toss', name: 'Precision Toss', desc: 'Toss rings onto a series of posts. Most accuracy wins.',
    stat: s => s.physical * 0.4 + s.mental * 0.3 + s.temperament * 0.3 },
  { id: 'balance-beam', name: 'Balance Beam', desc: 'Navigate a narrow beam while carrying a stack of blocks.',
    stat: s => s.endurance * 0.3 + s.temperament * 0.4 + s.mental * 0.3 },
  { id: 'memory', name: 'Memory Challenge', desc: 'Memorize a sequence and recreate it. Precision under pressure.',
    stat: s => s.mental * 0.5 + s.intuition * 0.3 + s.temperament * 0.2 },
];

// Is RI still accepting new players? Stops after all return points have been used.
export function isRIStillActive() {
  if (!seasonConfig.ri) return false;
  const maxReturns = seasonConfig.riReturnPoints || 1;
  return (gs.riReturnCount || 0) < maxReturns;
}

export function simulateRIChoice(name) {
  const s = pStats(name);
  const state = getPlayerState(name);
  const emotional = state?.emotional || 'content';

  // Proportional: fight score determines whether they go to RI
  // Bold, physical, strategic, loyal players fight. Meek players might quit.
  const _fightScore = (s.boldness + s.physical + s.strategic + s.loyalty) / 4; // avg of fighting stats
  const _emotBoost = emotional === 'desperate' ? 2.0 : emotional === 'paranoid' ? 1.0 : 0;
  const _riChance = Math.min(0.98, (_fightScore + _emotBoost) * 0.10); // stat avg 5 = 50%, avg 7 = 70%, avg 9 = 90%
  return Math.random() < _riChance ? 'REDEMPTION ISLAND' : 'WENT HOME';
}

export function simulateRIDuel(riPlayers) {
  const challenge = RI_DUEL_CHALLENGES[Math.floor(Math.random() * RI_DUEL_CHALLENGES.length)];

  if (riPlayers.length === 2) {
    // Classic 1v1 duel
    const [resident, arrival] = [riPlayers[0], riPlayers[1]];
    const aScore = challenge.stat(pStats(resident)) + Math.random() * 3;
    const bScore = challenge.stat(pStats(arrival)) + Math.random() * 3;
    const winner = aScore >= bScore ? resident : arrival;
    const loser = winner === resident ? arrival : resident;
    return { winner, loser, survivors: [winner], challengeType: challenge.id, challengeLabel: challenge.name, challengeDesc: challenge.desc, isThreeWay: false };
  }

  // 3-way duel (or more): all compete, last place eliminated, rest stay
  const scores = riPlayers.map(p => ({
    name: p,
    score: challenge.stat(pStats(p)) + Math.random() * 3
  }));
  scores.sort((a, b) => b.score - a.score); // highest first
  const loser = scores[scores.length - 1].name;
  const survivors = scores.slice(0, -1).map(s => s.name);
  const winner = scores[0].name; // top performer
  return { winner, loser, survivors, challengeType: challenge.id, challengeLabel: challenge.name, challengeDesc: challenge.desc, isThreeWay: riPlayers.length >= 3, duelists: [...riPlayers] };
}

export function simulateRIReentry(riPlayers) {
  const challenge = RI_DUEL_CHALLENGES[Math.floor(Math.random() * RI_DUEL_CHALLENGES.length)];
  const winner = wRandom(riPlayers, n => Math.max(0.1, challenge.stat(pStats(n)) + Math.random() * 3));
  const losers = riPlayers.filter(p => p !== winner);
  return { winner, losers, challengeType: challenge.id, challengeLabel: challenge.name };
}

export function generateRILifeEvents(ep) {
  if (!gs.riPlayers || !gs.riPlayers.length) return;
  if (!ep.riLifeEvents) ep.riLifeEvents = [];
  if (!gs.riLifeEvents) gs.riLifeEvents = {};
  const epNum = ep.num || (gs.episode + 1);

  // Determine who is the existing resident vs new arrival
  // New arrival = last player pushed to riPlayers this episode (if riPlayers grew)
  const riList = [...gs.riPlayers];

  // ── Solo events (1 resident) ──
  if (riList.length === 1) {
    const name = riList[0];
    const pr = pronouns(name);
    const daysOnRI = (gs.riLifeEvents[name] || []).length + 1;
    const soloPool = [
      { type: 'processing', text: `${name} replays tribal in ${pr.pos} head. The name ${pr.sub} trusted most wrote ${pr.pos} name.` },
      { type: 'training', text: `${name} spends the day running the beach, building fire, lifting rocks. Whatever comes next, ${pr.sub}'ll be ready.` },
      { type: 'reflection', text: `${name} sits alone watching the sunset. The game feels very far away \u2014 and very close.` },
      { type: 'motivation', text: `${name} carves a mark in the shelter wall. ${daysOnRI > 1 ? `${daysOnRI} marks now.` : 'One for each day survived.'} The marks are adding up.` },
    ];
    // Pick 1-2 events deterministically by hash
    const hash = ([...name].reduce((s,c) => s + c.charCodeAt(0), 0) + epNum);
    const ev1 = soloPool[hash % soloPool.length];
    const evt1 = { ep: epNum, text: ev1.text, type: ev1.type, player: name };
    ep.riLifeEvents.push(evt1);
    if (!gs.riLifeEvents[name]) gs.riLifeEvents[name] = [];
    gs.riLifeEvents[name].push(evt1);

    // 50% chance of second solo event
    if (Math.random() < 0.5) {
      const ev2 = soloPool[(hash + 1) % soloPool.length];
      if (ev2.type !== ev1.type) {
        const evt2 = { ep: epNum, text: ev2.text, type: ev2.type, player: name };
        ep.riLifeEvents.push(evt2);
        gs.riLifeEvents[name].push(evt2);
      }
    }
  }

  // ── Pre-duel events (2+ residents) ──
  // Generate tension events between pairs — covers all duelists, not just last 2
  if (riList.length >= 2) {
    const preDuelPool = [];
    // Build events for notable pairs
    for (let i = 0; i < riList.length; i++) {
      for (let j = i + 1; j < riList.length; j++) {
        const a = riList[i], b = riList[j];
        const prA = pronouns(a), prB = pronouns(b);
        const bond = getBond(a, b);
        const sameHistory = gs.episodeHistory.some(h => (h.tribesAtStart||[]).some(t => t.members.includes(a) && t.members.includes(b)));
        if (sameHistory) preDuelPool.push({ type: 'history', text: `${a} and ${b} were on the same tribe. The awkwardness is thick.`, player: a, player2: b });
        if (bond <= -2) preDuelPool.push({ type: 'enemy-arrives', text: `${a} and ${b} locked eyes. This is personal.`, player: a, player2: b });
        if (bond >= 3) preDuelPool.push({ type: 'ally-arrives', text: `${a} and ${b} share a look. They know — only one can stay.`, player: a, player2: b });
      }
    }
    // New arrivals get sizing-up events from existing residents
    const newArrivals = riList.filter(n => {
      const arrEp = gs.riArrivalEp?.[n] || gs.riLifeEvents?.[n]?.length || 0;
      return !gs.riLifeEvents?.[n]?.length || arrEp >= epNum;
    });
    const existingRes = riList.filter(n => !newArrivals.includes(n));
    newArrivals.forEach(arrival => {
      const prA = pronouns(arrival);
      const arrStats = pStats(arrival);
      existingRes.forEach(resident => {
        const prR = pronouns(resident);
        preDuelPool.push({ type: 'sizing-up', text: `${resident} watches ${arrival} walk onto the beach. ${prR.Sub} know${prR.sub==='they'?'':'s'} what this means.`, player: resident, player2: arrival });
      });
      if (arrStats.boldness >= 7 && existingRes.length > 0) {
        const target = existingRes[0];
        preDuelPool.push({ type: 'trash-talk', text: `${arrival} tells ${target} exactly how this is going to go. ${target} says nothing. Just stares.`, player: arrival, player2: target });
      }
    });
    // If no new arrivals (all are returning residents), add general tension
    if (!preDuelPool.length && riList.length >= 2) {
      const [a, b] = riList;
      const prA = pronouns(a);
      preDuelPool.push({ type: 'sizing-up', text: `${a} and ${b} size each other up. The duel is coming.`, player: a, player2: b });
    }

    // Pick 1-2 events from pool
    if (preDuelPool.length) {
      const hash = riList.reduce((s, n) => s + [...n].reduce((ss, c) => ss + c.charCodeAt(0), 0), 0) + epNum;
      const ev1 = preDuelPool[hash % preDuelPool.length];
      const evt1 = { ep: epNum, text: ev1.text, type: ev1.type, player: ev1.player, player2: ev1.player2 };
      ep.riLifeEvents.push(evt1);
      [ev1.player, ev1.player2].filter(Boolean).forEach(n => { if (!gs.riLifeEvents[n]) gs.riLifeEvents[n] = []; gs.riLifeEvents[n].push(evt1); });

      if (preDuelPool.length > 1 && Math.random() < 0.5) {
        const ev2 = preDuelPool[(hash + 1) % preDuelPool.length];
        if (ev2.type !== ev1.type || ev2.player !== ev1.player) {
          const evt2 = { ep: epNum, text: ev2.text, type: ev2.type, player: ev2.player, player2: ev2.player2 };
          ep.riLifeEvents.push(evt2);
          [ev2.player, ev2.player2].filter(Boolean).forEach(n => { if (!gs.riLifeEvents[n]) gs.riLifeEvents[n] = []; gs.riLifeEvents[n].push(evt2); });
        }
      }
    }
  }
}

export function generateRIPostDuelEvents(ep) {
  if (!ep.riDuel) return;
  if (!ep.riLifeEvents) ep.riLifeEvents = [];
  if (!gs.riLifeEvents) gs.riLifeEvents = {};
  const epNum = ep.num || (gs.episode + 1);
  const { winner, loser, survivors } = ep.riDuel;
  const prL = pronouns(loser);

  // Survivor events — one per survivor (in 3+ way duels, multiple survive)
  const allSurvivors = survivors || [winner];
  allSurvivors.forEach(surv => {
    const prS = pronouns(surv);
    const duelCount = (gs.riLifeEvents[surv] || []).filter(e => e.type === 'winner-relief' || e.type === 'winner-hardened').length + 1;
    const winPool = [
      { type: 'winner-relief', text: `${surv} watches ${loser} leave. ${prS.Sub} sit${prS.sub==='they'?'':'s'} down on the beach. Still here.` },
      { type: 'winner-hardened', text: `${surv} has survived ${duelCount} duel${duelCount>1?'s':''} now. The fire in ${prS.pos} eyes is different.` },
    ];
    const wHash = ([...surv].reduce((s,c) => s + c.charCodeAt(0), 0) + epNum);
    const wEvt = winPool[wHash % winPool.length];
    const wObj = { ep: epNum, text: wEvt.text, type: wEvt.type, player: surv };
    ep.riLifeEvents.push(wObj);
    if (!gs.riLifeEvents[surv]) gs.riLifeEvents[surv] = [];
    gs.riLifeEvents[surv].push(wObj);
  });

  // Loser exit event — one event for the eliminated player
  const losePool = [
    { type: 'loser-graceful', text: `${loser} shakes ${winner}'s hand. 'You earned it.' Then ${prL.sub} walk${prL.sub==='they'?'':'s'} away.` },
    { type: 'loser-bitter', text: `${loser} doesn't look back. The game took everything and gave nothing.` },
    { type: 'loser-emotional', text: `${loser} breaks down. Not because of the duel \u2014 because it's really over now.` },
  ];
  const lHash = ([...loser].reduce((s,c) => s + c.charCodeAt(0), 0) + epNum);
  const lEvt = losePool[lHash % losePool.length];
  const lObj = { ep: epNum, text: lEvt.text, type: lEvt.type, player: loser };
  ep.riLifeEvents.push(lObj);
  if (!gs.riLifeEvents[loser]) gs.riLifeEvents[loser] = [];
  gs.riLifeEvents[loser].push(lObj);
}

// ══════════════════════════════════════════════════════════════════════
// ENGINE: RESCUE ISLAND LIFE (Edge of Extinction format)
// ══════════════════════════════════════════════════════════════════════

export function generateRescueIslandLife(ep) {
  if (!gs.riPlayers || !gs.riPlayers.length) return;
  if (!ep.rescueIslandEvents) ep.rescueIslandEvents = [];
  if (!gs.riLifeEvents) gs.riLifeEvents = {};
  if (!gs.riArrivalEp) gs.riArrivalEp = {};
  if (!gs.riQuits) gs.riQuits = [];
  if (!gs.riAlliancesFormed) gs.riAlliancesFormed = [];
  const epNum = ep.num || (gs.episode || 0) + 1;
  const riList = [...gs.riPlayers];

  function pushEvt(evt) {
    ep.rescueIslandEvents.push(evt);
    const names = [evt.player, evt.player2].filter(Boolean);
    names.forEach(n => {
      if (!gs.riLifeEvents[n]) gs.riLifeEvents[n] = [];
      gs.riLifeEvents[n].push(evt);
    });
  }

  // Survival drain — Rescue Island is brutal (minimal food, no shelter, exposed elements)
  // Harder than exile: sustained over multiple episodes, cumulative toll
  if (seasonConfig.foodWater === 'enabled' && gs.survival) {
    riList.forEach(name => {
      const s = pStats(name);
      const daysOn = epNum - (gs.riArrivalEp[name] || epNum);
      // Base drain 6-10 per episode, reduced by endurance. Gets worse the longer you stay.
      const _riBaseDrain = 10 - s.endurance * 0.4;
      const _riDaysPenalty = Math.min(daysOn * 0.5, 3); // up to +3 extra drain after 6 episodes
      const _riDrain = _riBaseDrain + _riDaysPenalty;
      gs.survival[name] = Math.max(0, (gs.survival[name] || 80) - _riDrain);
    });
  }

  // Determine how many events: 2-4 based on population
  const eventCount = riList.length <= 2 ? 2 : riList.length <= 4 ? 3 : 4;
  const usedTypes = new Set();

  for (let i = 0; i < eventCount; i++) {
    const pool = [];

    // ── Processing events (solo, emotional) ──
    riList.forEach(name => {
      const pr = pronouns(name);
      const daysOn = epNum - (gs.riArrivalEp[name] || epNum);
      const state = getPlayerState(name);
      const emotional = state?.emotional || 'content';

      if (daysOn <= 1 && !usedTypes.has('processing-' + name)) {
        pool.push({ weight: 3, type: 'processing', player: name,
          text: `${name} replays the vote. ${pr.Sub} know${pr.sub==='they'?'':'s'} exactly who wrote ${pr.pos} name.` });
      }
      if (daysOn >= 2 && daysOn <= 3 && !usedTypes.has('grief-' + name)) {
        pool.push({ weight: 2, type: 'processing', player: name,
          text: `${name} breaks down today. Not about the game — about what the game took.` });
      }
      if (daysOn >= 3 && !usedTypes.has('acceptance-' + name)) {
        pool.push({ weight: 2, type: 'processing', player: name,
          text: `${name} has stopped replaying the vote. Something shifted. ${pr.Sub} ${pr.sub==='they'?'are':'is'} here now. That's all that matters.` });
      }
      if (!usedTypes.has('motivation-' + name)) {
        pool.push({ weight: 1.5, type: 'processing', player: name,
          text: `${name} wakes up before everyone else. Runs the beach. Does push-ups by the water. The return challenge is coming.` });
      }
      if (emotional === 'desperate' || emotional === 'paranoid') {
        pool.push({ weight: 1.5, type: 'processing', player: name,
          text: `${name} wishes ${pr.sub} had played differently. The what-ifs are louder than the waves.` });
      }
    });

    // ── Social events (pairs) ──
    if (riList.length >= 2) {
      for (let a = 0; a < riList.length; a++) {
        for (let b = a + 1; b < riList.length; b++) {
          const nameA = riList[a], nameB = riList[b];
          const bond = getBond(nameA, nameB);
          const pairKey = nameA + '-' + nameB;
          if (usedTypes.has('social-' + pairKey)) continue;

          // Shared enemy — find someone who voted both out
          const aVoters = gs.episodeHistory.flatMap(h => (h.votingLog||[]).filter(v => v.voted === nameA).map(v => v.voter));
          const bVoters = gs.episodeHistory.flatMap(h => (h.votingLog||[]).filter(v => v.voted === nameB).map(v => v.voter));
          const sharedEnemies = aVoters.filter(v => bVoters.includes(v));
          if (sharedEnemies.length > 0) {
            const enemy = sharedEnemies[0];
            pool.push({ weight: 3, type: 'bonding', player: nameA, player2: nameB,
              text: `${nameA} and ${nameB} were both voted out by ${enemy}. The conversation writes itself.`,
              bondDelta: 1.5, pairKey });
          }

          if (bond >= 3) {
            pool.push({ weight: 2, type: 'bonding', player: nameA, player2: nameB,
              text: `${nameA} sits with ${nameB} after a rough night. No strategy — just presence.`,
              bondDelta: 0.5, pairKey });
          }
          if (bond <= -2) {
            pool.push({ weight: 2.5, type: 'rivalry', player: nameA, player2: nameB,
              text: `${nameA} and ${nameB} brought their beef to Rescue Island. It hasn't cooled.`,
              bondDelta: -1.0, pairKey });
          }
          if (bond > -2 && bond < 3) {
            pool.push({ weight: 1.5, type: 'bonding', player: nameA, player2: nameB,
              text: `${nameA} and ${nameB} never spoke in the main game. Out here, they find common ground.`,
              bondDelta: 1.0, pairKey });
          }
          // Game talk
          pool.push({ weight: 1, type: 'game-talk', player: nameA, player2: nameB,
            text: `${nameA} and ${nameB} compare notes. The picture of who's running the game gets clearer.`,
            bondDelta: 0, pairKey });

          if (bond <= -3) {
            pool.push({ weight: 2, type: 'rivalry', player: nameA, player2: nameB,
              text: `${nameA} blames ${nameB} for how the vote went. ${nameB} disagrees. Loudly.`,
              bondDelta: -1.5, pairKey });
          }

          // Alliance forming — only if bond >= 2 and no existing RI alliance between them
          const hasRIAlliance = gs.riAlliancesFormed.some(al => al.members.includes(nameA) && al.members.includes(nameB));
          if (bond >= 2 && !hasRIAlliance) {
            pool.push({ weight: 1.5, type: 'bonding', player: nameA, player2: nameB,
              text: `${nameA} and ${nameB} make a pact — if either wins the return challenge, they play together.`,
              bondDelta: 1.0, pairKey, allianceForming: true });
          }
        }
      }
    }

    // ── Survival events (solo) ──
    riList.forEach(name => {
      const pr = pronouns(name);
      const s = pStats(name);
      // Proportional: thriving/struggling scales with endurance
      if (s.endurance * 0.1 > Math.random() && !usedTypes.has('thriving-' + name)) {
        pool.push({ weight: s.endurance * 0.2, type: 'thriving', player: name,
          text: `${name} looks stronger now than when ${pr.sub} left the main game.` });
      }
      if ((10 - s.endurance) * 0.1 > Math.random() && !usedTypes.has('struggling-' + name)) {
        pool.push({ weight: (10 - s.endurance) * 0.2, type: 'struggling', player: name,
          text: `${name} is barely eating. The island is taking a physical toll.` });
      }
      if (s.endurance * 0.08 > Math.random() && !usedTypes.has('fishing-' + name)) {
        pool.push({ weight: 1, type: 'bonding', player: name,
          text: `${name} catches enough fish for the whole island. Respect earned.`,
          allBond: s.endurance * 0.04 }); // proportional bond: endurance 5=0.20, endurance 8=0.32
      }
      if (s.physical * 0.08 > Math.random() && !usedTypes.has('shelter-' + name)) {
        pool.push({ weight: 1, type: 'bonding', player: name,
          text: `${name} builds a windbreak. Nobody asked. Everyone benefits.`,
          allBond: s.physical * 0.03 }); // proportional: phys 5=0.15, phys 8=0.24
      }
    });

    // ── Quit temptation ──
    riList.forEach(name => {
      const pr = pronouns(name);
      const s = pStats(name);
      const state = getPlayerState(name);
      const emotional = state?.emotional || 'content';
      const daysOn = epNum - (gs.riArrivalEp[name] || epNum);
      if (s.boldness <= 3 && daysOn >= 3 && emotional === 'desperate') {
        pool.push({ weight: 4, type: 'quit-temptation', player: name,
          text: `${name} stares at the path off the island for a long time today.`,
          quitChance: 0.15 });
      }
    });

    if (!pool.length) break;

    // Weighted random pick
    const totalW = pool.reduce((s, e) => s + e.weight, 0);
    let roll = Math.random() * totalW;
    let picked = pool[0];
    for (const entry of pool) {
      roll -= entry.weight;
      if (roll <= 0) { picked = entry; break; }
    }

    // Mark used
    if (picked.player && picked.type === 'processing') usedTypes.add('processing-' + picked.player);
    if (picked.player && picked.type === 'processing' && picked.text.includes('breaks down')) usedTypes.add('grief-' + picked.player);
    if (picked.player && picked.type === 'processing' && picked.text.includes('stopped replaying')) usedTypes.add('acceptance-' + picked.player);
    if (picked.player && picked.type === 'processing' && picked.text.includes('wakes up')) usedTypes.add('motivation-' + picked.player);
    if (picked.pairKey) usedTypes.add('social-' + picked.pairKey);
    if (picked.type === 'thriving') usedTypes.add('thriving-' + picked.player);
    if (picked.type === 'struggling') usedTypes.add('struggling-' + picked.player);
    if (picked.text?.includes('catches enough')) usedTypes.add('fishing-' + picked.player);
    if (picked.text?.includes('builds a windbreak')) usedTypes.add('shelter-' + picked.player);

    // Apply consequences
    if (picked.bondDelta && picked.player && picked.player2) {
      addBond(picked.player, picked.player2, picked.bondDelta);
    }
    if (picked.allBond && picked.player) {
      riList.forEach(other => {
        if (other !== picked.player) addBond(picked.player, other, picked.allBond);
      });
    }
    if (picked.allianceForming && picked.player && picked.player2) {
      gs.riAlliancesFormed.push({ members: [picked.player, picked.player2], formedOnRI: true, ep: epNum });
    }

    // Handle quit temptation
    if (picked.type === 'quit-temptation') {
      const evt = { ep: epNum, text: picked.text, type: 'quit-temptation', player: picked.player };
      pushEvt(evt);
      // Roll for actual quit
      if (Math.random() < picked.quitChance) {
        const pr = pronouns(picked.player);
        const quitEvt = { ep: epNum, type: 'quit',
          text: `${picked.player} raises the sail. ${pr.Sub} ${pr.sub==='they'?'are':'is'} done. The island loses one more.`,
          player: picked.player };
        pushEvt(quitEvt);
        // Remove from RI
        gs.riPlayers = gs.riPlayers.filter(p => p !== picked.player);
        gs.riQuits.push(picked.player);
        gs.eliminated.push(picked.player);
        ep.riQuit = { name: picked.player, daysOnIsland: epNum - (gs.riArrivalEp[picked.player] || epNum) };
        // Update riList for remaining events
        const idx = riList.indexOf(picked.player);
        if (idx >= 0) riList.splice(idx, 1);
      }
      continue; // quit temptation is its own event
    }

    const evt = { ep: epNum, text: picked.text, type: picked.type, player: picked.player, player2: picked.player2 || null };
    pushEvt(evt);
  }
}
