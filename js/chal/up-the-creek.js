// js/chal/up-the-creek.js
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

export function simulateUpTheCreek(ep) {
  const tribes = gs.tribes;
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const _hash = (str, n) => { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xfffffff; return h % n; };
  const NICE_ARCHS = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
  // _utcMembers: local flat list for iteration (distinct from global `players`)
  const _utcMembers = tribes.flatMap(t => t.members.map(m => ({ name: m, tribe: t.name })));

  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });

  // ── Personal scores per player ──
  const personalScores = {};
  _utcMembers.forEach(p => { personalScores[p.name] = 0; });

  // ── Phase storage ──
  const phases = { partnerSelection: [], paddleOut: [], portage: [], buildFire: [], paddleBack: [] };

  // ── Tribe-level accumulators ──
  const tribePhase1Score = {};
  const tribePhase2Score = {};
  const tribePhase3Score = {};
  const tribePhase4Score = {};
  tribes.forEach(t => {
    tribePhase1Score[t.name] = 0;
    tribePhase2Score[t.name] = 0;
    tribePhase3Score[t.name] = 0;
    tribePhase4Score[t.name] = 0;
  });

  // ── Canoe pair data ──
  const canoePairs = {};   // { tribeName: [{ a, b, scenario, chemistry, speed }] }
  const soloCanoe = {};    // { tribeName: name || null }
  const paddlesBurned = {};  // { tribeName: bool }
  let swimmerHero = null;

  // ══ PHASE 0: PARTNER SELECTION ══
  tribes.forEach(t => {
    const members = t.members.slice();
    canoePairs[t.name] = [];
    soloCanoe[t.name] = null;
    paddlesBurned[t.name] = false;

    // Sort by boldness descending — boldest picks first
    const byBoldness = members.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness);
    const unpicked = new Set(members);
    const paired = new Set();
    const pairs = [];

    // Check active showmances
    const activeShowmances = (gs.showmances || []).filter(sm => sm.phase !== 'broken-up' && sm.phase !== 'faded');
    const showmancePairs = new Set();
    activeShowmances.forEach(sm => {
      const [smA, smB] = sm.players;
      if (members.includes(smA) && members.includes(smB)) {
        showmancePairs.add(smA + '|||' + smB);
        showmancePairs.add(smB + '|||' + smA);
      }
    });

    // Determine each player's most-wanted partner: bond * 0.5 + (physical + endurance) * 0.1
    const wantedBy = {};
    members.forEach(picker => {
      const others = members.filter(m => m !== picker);
      if (!others.length) return;
      wantedBy[picker] = others.slice().sort((a, b) => {
        const sA = pStats(a), sB = pStats(b);
        const bondA = getBond(picker, a), bondB = getBond(picker, b);
        return (bondB * 0.5 + (sB.physical + sB.endurance) * 0.1) - (bondA * 0.5 + (sA.physical + sA.endurance) * 0.1);
      })[0];
    });

    // Determine solo canoe: if odd members, lowest boldness player gets solo canoe
    let soloPlayer = null;
    if (members.length % 2 === 1) {
      soloPlayer = members.slice().sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
      unpicked.delete(soloPlayer);
      paired.add(soloPlayer);
      soloCanoe[t.name] = soloPlayer;
      const prSolo = pronouns(soloPlayer);
      const soloTexts = [
        `${soloPlayer} is the last one standing on the dock. Solo canoe. The tribe is already in the water.`,
        `Nobody picked ${soloPlayer}. ${prSolo.Sub} ${prSolo.sub === 'they' ? 'drag' : 'drags'} the canoe into the water alone. Quiet.`,
        `${soloPlayer} pushes off solo. The others are paired up and laughing. ${prSolo.Sub} ${prSolo.sub === 'they' ? 'paddle' : 'paddles'} harder.`,
      ];
      personalScores[soloPlayer] -= 0.5;
      addBond(soloPlayer, members.filter(m => m !== soloPlayer)[0] || soloPlayer, -0.1);
      const soloText = soloTexts[_hash(soloPlayer + 'solo', soloTexts.length)];
      phases.partnerSelection.push({
        type: 'utcSoloPaddler', phase: 'partnerSelection', players: [soloPlayer],
        text: soloText, personalScores: { [soloPlayer]: -0.5 }, badge: 'SOLO CANOE', badgeClass: 'red'
      });
    }

    // Pick order: boldest first (skip solo player)
    const pickOrder = byBoldness.filter(m => m !== soloPlayer);

    pickOrder.forEach(picker => {
      if (paired.has(picker)) return;
      const available = [...unpicked].filter(m => m !== picker && !paired.has(m));
      if (!available.length) return;

      // Check showmance shortcut
      const showmanceTarget = available.find(m => showmancePairs.has(picker + '|||' + m));

      let chosen;
      if (showmanceTarget) {
        chosen = showmanceTarget;
      } else {
        // Pick highest bond * 0.5 + (phys + end) * 0.1
        chosen = available.slice().sort((a, b) => {
          const sA = pStats(a), sB = pStats(b);
          const bondA = getBond(picker, a), bondB = getBond(picker, b);
          return (bondB * 0.5 + (sB.physical + sB.endurance) * 0.1) - (bondA * 0.5 + (sA.physical + sA.endurance) * 0.1);
        })[0];
      }

      paired.add(picker);
      paired.add(chosen);
      unpicked.delete(picker);
      unpicked.delete(chosen);

      const bond = getBond(picker, chosen);
      const sP = pStats(picker), sC = pStats(chosen);
      const chemistry = bond * 0.15 + (sP.physical + sP.endurance + sC.physical + sC.endurance) / 4 * 0.25;

      // Determine scenario
      const isShowmance = !!showmanceTarget;
      const mutual = wantedBy[picker] === chosen && wantedBy[chosen] === picker;
      const oneSided = wantedBy[picker] === chosen && wantedBy[chosen] !== picker;
      const rivalForced = !isShowmance && bond <= -1 && available.length === 1; // last option
      const wasRejected = wantedBy[chosen] !== picker && wantedBy[chosen] && !paired.has(wantedBy[chosen]) === false;

      let scenario, text, bondDelta;
      const prPicker = pronouns(picker), prChosen = pronouns(chosen);

      if (isShowmance) {
        scenario = 'showmance';
        const showTexts = [
          `${picker} and ${chosen} don't even hesitate. Same canoe. The tribe rolls their eyes.`,
          `${picker} holds the canoe steady for ${chosen}. The tenderness is visible. Someone gags.`,
          `'You and me?' 'Always.' The canoe practically launched itself.`,
        ];
        text = showTexts[_hash(picker + chosen + 'show', showTexts.length)];
        bondDelta = 0.2;
      } else if (rivalForced) {
        scenario = 'rivals-forced';
        const rivalTexts = [
          `${picker} and ${chosen} stare at the last canoe, then at each other. This is going to be a long paddle.`,
          `'Absolutely not.' 'You don't have a choice.' They get in. Neither sits comfortably.`,
          `${picker} takes the front. ${chosen} takes the back. They haven't looked at each other once.`,
        ];
        text = rivalTexts[_hash(picker + chosen + 'rival', rivalTexts.length)];
        bondDelta = -0.3;
      } else if (mutual) {
        scenario = 'mutual';
        const mutualTexts = [
          `${picker} and ${chosen} grab the same canoe. No words needed. They both knew.`,
          `${picker} nods at ${chosen}. ${prChosen.Sub} nods back. They're already in the water before anyone else has picked.`,
          `${chosen} grins when ${picker} walks over. 'I was hoping you'd ask.' 'I wasn't asking.'`,
        ];
        text = mutualTexts[_hash(picker + chosen + 'mutual', mutualTexts.length)];
        bondDelta = 0.3;
      } else if (oneSided) {
        scenario = 'one-sided';
        const oneSideTexts = [
          `${chosen} hesitates. Looks at ${wantedBy[chosen] || 'the others'}. Then at ${picker}. Gets in the canoe. Says nothing.`,
          `${picker} is thrilled. ${chosen} is... managing expectations.`,
          `'Come on, it'll be fun,' ${picker} says. ${prChosen.Sub} ${prChosen.sub === 'they' ? 'don\'t' : 'doesn\'t'} look convinced.`,
        ];
        text = oneSideTexts[_hash(picker + chosen + 'one', oneSideTexts.length)];
        bondDelta = -0.2;
        addBond(picker, chosen, bondDelta);
      } else {
        scenario = 'standard';
        const stdTexts = [
          `${picker} and ${chosen} pair up without fanfare. Practical choice.`,
          `${picker} walks over to ${chosen}. 'You and me?' ${prChosen.Sub} shrugs. 'Sure.'`,
          `${picker} taps ${chosen} on the shoulder. They're in the same canoe before anyone else makes a move.`,
        ];
        text = stdTexts[_hash(picker + chosen + 'std', stdTexts.length)];
        bondDelta = 0.1;
      }

      addBond(picker, chosen, bondDelta);

      const pairScoreDelta = isShowmance ? 0.3 : mutual ? 0.3 : oneSided ? 0 : rivalForced ? -0.3 : 0.1;
      personalScores[picker] += pairScoreDelta;
      personalScores[chosen] += pairScoreDelta;

      pairs.push({ a: picker, b: chosen, scenario, chemistry, speed: 0 });

      const badgeTextMap = { 'showmance': 'POWER COUPLE', 'mutual': 'PERFECT MATCH', 'one-sided': 'RELUCTANT PAIR', 'rivals-forced': 'RIVALS', 'standard': 'CANOE PAIR' };
      const badgeClassMap = { 'showmance': 'gold', 'mutual': 'gold', 'one-sided': '', 'rivals-forced': 'red', 'standard': '' };

      phases.partnerSelection.push({
        type: 'utcPartnerPick', phase: 'partnerSelection', players: [picker, chosen],
        text, personalScores: { [picker]: pairScoreDelta, [chosen]: pairScoreDelta },
        badge: badgeTextMap[scenario] || 'CANOE PAIR', badgeClass: badgeClassMap[scenario] || ''
      });

      // Rejected: whoever chosen's wantedBy was, if available and didn't get them
      const rejectedWanted = wantedBy[chosen];
      if (rejectedWanted && rejectedWanted !== picker && !paired.has(rejectedWanted) === false) {
        // Fire a rejection event if the rejected player exists
      }
    });

    // Fire rejection events for players who lost their wanted pick
    members.filter(m => m !== soloPlayer).forEach(loser => {
      const wanted = wantedBy[loser];
      if (!wanted) return;
      const loserPair = pairs.find(p => p.a === loser || p.b === loser);
      const wantedPair = pairs.find(p => p.a === wanted || p.b === wanted);
      if (!loserPair || !wantedPair) return;
      const takerName = wantedPair.a === wanted ? wantedPair.b : wantedPair.a;
      if (takerName === loser) return; // loser actually got their pick
      // loser didn't get who they wanted
      const prLoser = pronouns(loser);
      const rejTexts = [
        `${loser} watches ${wanted} paddle off with ${takerName}. ${prLoser.Sub} pretends it doesn't sting. It stings.`,
        `${loser} stood there a second too long. By the time ${prLoser.sub} moved, ${wanted} was already gone.`,
        `'Whatever,' ${loser} mutters, grabbing the next available canoe. ${prLoser.Sub} ${prLoser.sub === 'they' ? 'don\'t' : 'doesn\'t'} look back.`,
      ];
      addBond(loser, takerName, -0.3);
      personalScores[loser] -= 0.2;
      phases.partnerSelection.push({
        type: 'utcRejected', phase: 'partnerSelection', players: [loser, wanted, takerName],
        text: rejTexts[_hash(loser + wanted + 'rej', rejTexts.length)],
        personalScores: { [loser]: -0.2 }, badge: 'REJECTED', badgeClass: 'red'
      });
    });

    canoePairs[t.name] = pairs;
  });

  // ══ PHASE 1: PADDLE TO BONEY ISLAND (3-4 events per tribe) ══
  tribes.forEach(t => {
    const members = t.members;
    const pairs = canoePairs[t.name];
    const solo = soloCanoe[t.name];
    let p1EventCount = 0;
    const maxP1 = 3 + (Math.random() < 0.5 ? 1 : 0);

    // Calculate pair speeds
    pairs.forEach(pair => {
      const bond = getBond(pair.a, pair.b);
      const sA = pStats(pair.a), sB = pStats(pair.b);
      const avgPhysEnd = ((sA.physical + sA.endurance + sB.physical + sB.endurance) / 2);
      let speed = bond * 0.15 + avgPhysEnd * 0.25 + Math.random() * 1.5;
      if (bond >= 2) speed += 0.5;
      if (bond <= -1) speed -= 0.5;
      speed = Math.max(0.1, speed);
      pair.speed = speed;
      tribePhase1Score[t.name] += speed;
    });

    // Solo canoe speed
    let soloSpeed = 0;
    if (solo) {
      const sS = pStats(solo);
      soloSpeed = sS.physical * 0.3 + sS.endurance * 0.25 + Math.random() * 1.0;
      tribePhase1Score[t.name] += soloSpeed;
    }

    // Event 1: Fast pair leads the way
    if (p1EventCount < maxP1 && pairs.length) {
      const topPair = pairs.slice().sort((a, b) => b.speed - a.speed)[0];
      const prA = pronouns(topPair.a), prB = pronouns(topPair.b);
      const fastTexts = [
        `${topPair.a} and ${topPair.b} are already twenty meters ahead. Something clicks when they paddle together.`,
        `${topPair.a} calls the strokes. ${topPair.b} matches every one. They cut through the water like they've done this before.`,
        `The gap between ${topPair.a} and ${topPair.b}'s canoe and the rest of the tribe is embarrassing for everyone else.`,
      ];
      personalScores[topPair.a] += 1.5; personalScores[topPair.b] += 1.5;
      addBond(topPair.a, topPair.b, 0.2);
      phases.paddleOut.push({
        type: 'utcFastPair', phase: 'paddleOut', players: [topPair.a, topPair.b],
        text: fastTexts[_hash(topPair.a + topPair.b + 'fast', fastTexts.length)],
        personalScores: { [topPair.a]: 1.5, [topPair.b]: 1.5 }, badge: 'FAST PAIR', badgeClass: 'gold'
      });
      // Romance spark check — paddling in sync can build chemistry
      _challengeRomanceSpark(topPair.a, topPair.b, ep, 'paddleOut', phases, personalScores, 'canoe ride');
      p1EventCount++;
    }

    // Event 2: Slow pair holds tribe back
    if (p1EventCount < maxP1 && pairs.length > 1) {
      const bottomPair = pairs.slice().sort((a, b) => a.speed - b.speed)[0];
      const slowTexts = [
        `${bottomPair.a} and ${bottomPair.b} can't sync their strokes. One pulls left, one pulls right. They spin in a slow, mortifying circle.`,
        `The tribe waits for ${bottomPair.a} and ${bottomPair.b} to catch up. Again. The silence is pointed.`,
        `${bottomPair.a} is paddling. ${bottomPair.b} is splashing water. These are two different activities.`,
      ];
      personalScores[bottomPair.a] -= 1.0; personalScores[bottomPair.b] -= 1.0;
      addBond(bottomPair.a, bottomPair.b, -0.2);
      phases.paddleOut.push({
        type: 'utcSlowPair', phase: 'paddleOut', players: [bottomPair.a, bottomPair.b],
        text: slowTexts[_hash(bottomPair.a + bottomPair.b + 'slow', slowTexts.length)],
        personalScores: { [bottomPair.a]: -1.0, [bottomPair.b]: -1.0 }, badge: 'SLOW PAIR', badgeClass: 'red'
      });
      p1EventCount++;
    }

    // Event 3: Argument in canoe (bond <= 0)
    if (p1EventCount < maxP1 && Math.random() < 0.45) {
      const argPairs = pairs.filter(p => getBond(p.a, p.b) <= 0);
      if (argPairs.length) {
        const argPair = _rp(argPairs);
        const argTexts = [
          `${argPair.a} and ${argPair.b} are arguing about paddle technique. In the middle of the race.`,
          `'You're going too fast.' 'You're going too slow.' ${argPair.a} and ${argPair.b} have ground to a halt.`,
          `${argPair.a} snaps at ${argPair.b} over the steering. ${argPair.b} snaps back. The canoe drifts sideways.`,
        ];
        personalScores[argPair.a] -= 0.5; personalScores[argPair.b] -= 0.5;
        addBond(argPair.a, argPair.b, -0.3);
        phases.paddleOut.push({
          type: 'utcArgument', phase: 'paddleOut', players: [argPair.a, argPair.b],
          text: argTexts[_hash(argPair.a + argPair.b + 'arg1', argTexts.length)],
          personalScores: { [argPair.a]: -0.5, [argPair.b]: -0.5 }, badge: 'PADDLING ARGUMENT', badgeClass: 'red'
        });
        p1EventCount++;
      }
    }

    // Event 4: Bonding in canoe (bond >= 2)
    if (p1EventCount < maxP1 && Math.random() < 0.45) {
      const bondPairs = pairs.filter(p => getBond(p.a, p.b) >= 2);
      if (bondPairs.length) {
        const bondPair = _rp(bondPairs);
        const bondTexts = [
          `${bondPair.a} and ${bondPair.b} are laughing halfway across. Paddling together like they've done it a hundred times.`,
          `Between strokes, ${bondPair.a} and ${bondPair.b} are talking. The kind of easy conversation that only happens when you genuinely like someone.`,
          `${bondPair.a} and ${bondPair.b} sync up without thinking. The canoe cuts clean. The tribe notices.`,
        ];
        personalScores[bondPair.a] += 0.5; personalScores[bondPair.b] += 0.5;
        addBond(bondPair.a, bondPair.b, 0.3);
        phases.paddleOut.push({
          type: 'utcBonding', phase: 'paddleOut', players: [bondPair.a, bondPair.b],
          text: bondTexts[_hash(bondPair.a + bondPair.b + 'bond', bondTexts.length)],
          personalScores: { [bondPair.a]: 0.5, [bondPair.b]: 0.5 }, badge: 'CANOE CHEMISTRY', badgeClass: 'gold'
        });
        p1EventCount++;
      }
    }

    // Event: Capsized (proportional to low endurance)
    if (p1EventCount < maxP1 && Math.random() < 0.30) {
      const capsizePairs = pairs.slice().sort((a, b) => {
        const endA = (pStats(a.a).endurance + pStats(a.b).endurance) / 2;
        const endB = (pStats(b.a).endurance + pStats(b.b).endurance) / 2;
        return endA - endB; // lowest endurance most likely
      });
      const capPair = capsizePairs[0];
      if (capPair && Math.random() < (10 - Math.min(pStats(capPair.a).endurance, pStats(capPair.b).endurance)) * 0.04) {
        const capTexts = [
          `${capPair.a} and ${capPair.b} go over. Completely. The canoe floats upside down. They're fine. The time loss is not fine.`,
          `A wave catches ${capPair.a} and ${capPair.b}'s canoe sideways. One moment paddling, next moment swimming.`,
          `${capPair.a} shifts weight at the wrong time. Over they go. ${capPair.b} comes up spitting water.`,
        ];
        personalScores[capPair.a] -= 1.5; personalScores[capPair.b] -= 1.5;
        phases.paddleOut.push({
          type: 'utcCapsized', phase: 'paddleOut', players: [capPair.a, capPair.b],
          text: capTexts[_hash(capPair.a + capPair.b + 'cap', capTexts.length)],
          personalScores: { [capPair.a]: -1.5, [capPair.b]: -1.5 }, badge: 'CAPSIZED', badgeClass: 'red'
        });
        tribePhase1Score[t.name] -= 1.5;
        p1EventCount++;
      }
    }

    // Event: Wildlife spotted
    if (p1EventCount < maxP1 && Math.random() < 0.35) {
      const spotter = members.slice().sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
      if (spotter) {
        const sS = pStats(spotter);
        const spotScore = sS.intuition * 0.04;
        if (Math.random() < spotScore + 0.2) {
          const prSpot = pronouns(spotter);
          const wildTexts = [
            `${spotter} points out a great blue heron watching them from the reeds. The tribe slows down to look. Worth it.`,
            `${spotter} calls out a school of fish under the canoe. Everyone peers over the side. For five seconds, nobody's playing Survivor.`,
            `A family of otters slides past ${spotter}'s canoe. ${prSpot.Sub} grins. Even the tribe's most jaded members can't help it.`,
          ];
          const spotterPair = pairs.find(p => p.a === spotter || p.b === spotter);
          const partner = spotterPair ? (spotterPair.a === spotter ? spotterPair.b : spotterPair.a) : null;
          personalScores[spotter] += 0.5;
          if (partner) { personalScores[partner] += 0.2; addBond(spotter, partner, 0.2); }
          phases.paddleOut.push({
            type: 'utcWildlife', phase: 'paddleOut', players: partner ? [spotter, partner] : [spotter],
            text: wildTexts[_hash(spotter + 'wild', wildTexts.length)],
            personalScores: partner ? { [spotter]: 0.5, [partner]: 0.2 } : { [spotter]: 0.5 },
            badge: 'WILDLIFE', badgeClass: ''
          });
          p1EventCount++;
        }
      }
    }

    // Event: Solo canoe struggles or impresses
    if (solo && p1EventCount < maxP1) {
      const sS = pStats(solo);
      const physScore = sS.physical * 0.04;
      const prSolo = pronouns(solo);
      if (Math.random() < physScore + 0.15) {
        const impressTexts = [
          `${solo} paddles alone and somehow keeps pace with the paired canoes. The tribe is quietly impressed.`,
          `${solo} is pulling the canoe through the water like ${prSolo.sub} has something to prove. ${prSolo.Sub} might.`,
          `No partner, no problem. ${solo} drives a single canoe with enough force that the tribe starts checking if ${prSolo.sub === 'they' ? 'they\'re' : prSolo.sub + '\'re'} even human.`,
        ];
        personalScores[solo] += 1.5;
        members.filter(m => m !== solo).forEach(m => addBond(m, solo, 0.3));
        phases.paddleOut.push({
          type: 'utcSoloPaddler', phase: 'paddleOut', players: [solo],
          text: impressTexts[_hash(solo + 'soloim', impressTexts.length)],
          personalScores: { [solo]: 1.5 }, badge: 'SOLO CANOE', badgeClass: 'gold'
        });
      } else {
        const strugTexts = [
          `${solo} is paddling alone and falling behind. The tribe keeps having to wait.`,
          `${solo} steers the solo canoe into a reed bed. Extracting it takes two minutes and a lot of muttering.`,
          `Without a partner to stabilize the canoe, ${solo} is zigzagging across the water. It's painful to watch.`,
        ];
        personalScores[solo] -= 0.5;
        phases.paddleOut.push({
          type: 'utcSoloStruggles', phase: 'paddleOut', players: [solo],
          text: strugTexts[_hash(solo + 'solostrg', strugTexts.length)],
          personalScores: { [solo]: -0.5 }, badge: 'STRUGGLING SOLO', badgeClass: 'red'
        });
      }
      p1EventCount++;
    }
  });

  // ── Canoe romance check: mutual-pick pairs with good chemistry get a romance moment ──
  tribes.forEach(t => {
    const pairs = canoePairs[t.name] || [];
    pairs.forEach(pair => {
      if (pair.scenario !== 'mutual' && pair.scenario !== 'showmance') return;
      const bond = getBond(pair.a, pair.b);
      if (bond < 3) return;
      if (Math.random() >= bond * 0.06) return; // proportional: bond 5 = 30%, bond 8 = 48%
      const prA = pronouns(pair.a), prB = pronouns(pair.b);
      const _romEnabled = seasonConfig.romance !== 'disabled';
      const _canoeRomTexts = _romEnabled ? [
        `The paddle rhythm syncs. ${pair.a} and ${pair.b} stop talking strategy and start talking about something else entirely. The canoe drifts. Neither notices.`,
        `${pair.b} catches ${pair.a} staring. "What?" "Nothing." It's not nothing. The tribe in the next canoe pretends not to see.`,
        `Halfway across the lake, ${pair.a} and ${pair.b} stop paddling. Just floating. The conversation turns personal. The other canoes pull ahead. They don't care.`,
        `${pair.a} reaches for the paddle at the same time as ${pair.b}. Their hands touch. Neither pulls away.`,
      ] : [
        `${pair.a} and ${pair.b} paddle in perfect sync. No words needed. They just work. The canoe cuts through the water like it has a mind of its own.`,
        `${pair.a} and ${pair.b} are talking about everything except the game. The paddle rhythm is automatic. The friendship is natural.`,
        `The best canoe pair on the water. ${pair.a} and ${pair.b} move as one. Trust built stroke by stroke.`,
      ];
      addBond(pair.a, pair.b, 0.4);
      phases.paddleOut.push({
        type: 'utcCanoeRomance', phase: 'paddleOut', players: [pair.a, pair.b],
        text: _canoeRomTexts[Math.floor(Math.random() * _canoeRomTexts.length)],
        personalScores: { [pair.a]: 0.5, [pair.b]: 0.5 }, badge: 'CANOE MOMENT', badgeClass: 'gold'
      });
      personalScores[pair.a] = (personalScores[pair.a] || 0) + 0.5;
      personalScores[pair.b] = (personalScores[pair.b] || 0) + 0.5;
      // Romance spark check
      _challengeRomanceSpark(pair.a, pair.b, ep, 'paddleOut', phases, personalScores, 'canoe ride across the lake');
    });
  });

  // Showmance challenge moment — partner-interaction scenario (canoe bonding context)
  tribes.forEach(t => _checkShowmanceChalMoment(ep, 'paddleOut', phases, personalScores, 'partner-interaction', tribes));

  // ══ PHASE 2: PORTAGE (3-5 encounters per tribe) ══
  const ALL_PORTAGE = [
    'woolly-beavers', 'giant-geese', 'quicksand', 'injury', 'shortcut', 'dangerous-crossing',
    'dropped-canoe', 'cursed-idol', 'insect-swarm', 'boney-fog', 'rival-spotted',
    'falls-behind', 'spooky-sounds', 'steep-hill', 'food-discovery', 'creek-crossing',
    'boney-mist', 'skeleton-find'
  ];

  tribes.forEach(t => {
    const members = t.members;
    const numPortage = 3 + Math.floor(Math.random() * 3); // 3-5
    const pool = ALL_PORTAGE.slice().sort(() => Math.random() - 0.5).slice(0, numPortage);

    pool.forEach(encounter => {
      switch (encounter) {

        case 'woolly-beavers': {
          const brave = members.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
          const panicker = members.slice().sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
          if (!brave || brave === panicker) break;
          const prBrave = pronouns(brave);
          const _wbTexts = [
            `Woolly beavers. Three of them, blocking the trail. Teeth like steak knives. ${panicker} screams. ${brave} grabs a stick and charges. The beavers scatter — but they don't look happy about it.`,
            `The bushes erupt with woolly beavers — remnants of the Pleistocene Era, and they eat meat. ${brave} holds the line while the tribe sprints past. ${panicker} is already gone.`,
            `${brave} spots the beaver dam first. "Nobody move." The woolly beavers circle. ${prBrave.Sub} ${prBrave.sub === 'they' ? 'hold' : 'holds'} ${prBrave.posAdj} ground until they lose interest. ${panicker} hasn't stopped shaking.`,
            `A woolly beaver the size of a dog lunges from the undergrowth. ${panicker} drops the canoe. ${brave} kicks it away. The tribe runs. The beaver gives chase for 200 meters.`,
          ];
          personalScores[brave] += 1.5; personalScores[panicker] -= 1.0;
          addBond(brave, panicker, 0.3);
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[brave] = (gs.popularity[brave] || 0) + 1;
          tribePhase2Score[t.name] += pStats(brave).boldness * 0.15;
          phases.portage.push({
            type: 'utcWildlife', phase: 'portage', players: [brave, panicker],
            text: _wbTexts[_hash(brave + panicker + 'woolly', _wbTexts.length)],
            personalScores: { [brave]: 1.5, [panicker]: -1.0 }, badge: 'WOOLLY BEAVERS', badgeClass: 'red'
          });
          break;
        }

        case 'giant-geese': {
          // Owen's underwear moment — someone does something stupid that wakes the geese
          const troublemaker = members.slice().sort((a, b) => {
            return (pStats(b).boldness * 0.5 + (10 - pStats(b).mental) * 0.3) - (pStats(a).boldness * 0.5 + (10 - pStats(a).mental) * 0.3);
          })[0];
          const saver = members.filter(m => m !== troublemaker).sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
          if (!troublemaker || !saver) break;
          const prT = pronouns(troublemaker);
          const _ggTexts = [
            `${troublemaker} makes too much noise and wakes a flock of giant geese. They're huge. They're angry. The tribe runs. ${saver} throws food to distract them — it works, barely.`,
            `Giant geese. Prehistoric, enormous, and territorial. ${troublemaker} startled them. ${saver} spots an escape route and guides the tribe through. ${troublemaker} brings up the rear, still apologizing.`,
            `The ground shakes. Giant geese — six of them — stampede through the clearing. ${troublemaker} caused this. ${saver} pulls everyone behind a rock formation until the flock passes.`,
            `"What is THAT?" Giant geese. ${troublemaker} threw something at them. Now they're chasing. ${saver} finds cover. The tribe hides until the flock loses interest.`,
          ];
          personalScores[troublemaker] -= 1.0; personalScores[saver] += 1.5;
          addBond(troublemaker, saver, -0.2);
          tribePhase2Score[t.name] += pStats(saver).intuition * 0.1;
          phases.portage.push({
            type: 'utcWildlife', phase: 'portage', players: [troublemaker, saver],
            text: _ggTexts[_hash(troublemaker + saver + 'geese', _ggTexts.length)],
            personalScores: { [troublemaker]: -1.0, [saver]: 1.5 }, badge: 'GIANT GEESE', badgeClass: 'red'
          });
          break;
        }

        case 'quicksand': {
          const trapped = members.slice().sort((a, b) => pStats(a).intuition - pStats(b).intuition)[0];
          const rescuer = members.filter(m => m !== trapped).slice().sort((a, b) => {
            return (pStats(b).physical * 0.5 + pStats(b).loyalty * 0.5) - (pStats(a).physical * 0.5 + pStats(a).loyalty * 0.5);
          })[0];
          if (!trapped || !rescuer) break;
          const prTrapped = pronouns(trapped);
          const qsTexts = [
            `${trapped} steps off the path and goes straight into a muddy sinkhole. Both legs. ${rescuer} hauls ${prTrapped.obj} out by ${prTrapped.posAdj} arms. The whole tribe stops.`,
            `${trapped} is in to the knee before ${prTrapped.sub === 'they' ? 'they realize' : prTrapped.sub + ' realizes'} what's happened. ${rescuer} doesn't hesitate. In up to ${pronouns(rescuer).posAdj} elbows, pulling.`,
            `The mud trap catches ${trapped} mid-stride. ${rescuer} ties rope around ${prTrapped.posAdj} wrist and braces. Takes three minutes. Everyone is watching.`,
          ];
          personalScores[trapped] -= 1.5; personalScores[rescuer] += 2.0;
          addBond(rescuer, trapped, 0.5);
          tribePhase2Score[t.name] -= 0.5;
          phases.portage.push({
            type: 'utcQuicksand', phase: 'portage', players: [trapped, rescuer],
            text: qsTexts[_hash(trapped + rescuer + 'qs', qsTexts.length)],
            personalScores: { [trapped]: -1.5, [rescuer]: 2.0 }, badge: 'QUICKSAND', badgeClass: ''
          });
          break;
        }

        case 'injury': {
          const injured = members.slice().sort((a, b) => {
            return ((10 - pStats(a).endurance) * 0.07) - ((10 - pStats(b).endurance) * 0.07);
          })[members.length - 1]; // most likely injured = lowest endurance proportional
          const carrier = members.filter(m => m !== injured).slice().sort((a, b) => pStats(b).social - pStats(a).social)[0];
          if (!injured || !carrier) break;
          const prInj = pronouns(injured);
          const injTexts = [
            `${injured} catches a splinter from a portage post — deep, under the nail. ${carrier} stops to help dig it out. The rest of the tribe barely slows.`,
            `${injured} rolls an ankle on a root. ${carrier} takes ${prInj.posAdj} load without being asked. Nobody says anything. They keep moving.`,
            `${injured} slips carrying the canoe and catches the hull with ${prInj.posAdj} arm. ${carrier} takes the front end for the next stretch.`,
          ];
          personalScores[injured] -= 1.0; personalScores[carrier] += 0.5;
          addBond(carrier, injured, 0.3);
          phases.portage.push({
            type: 'utcInjury', phase: 'portage', players: [injured, carrier],
            text: injTexts[_hash(injured + carrier + 'inj', injTexts.length)],
            personalScores: { [injured]: -1.0, [carrier]: 0.5 }, badge: 'INJURY', badgeClass: 'red'
          });
          break;
        }

        case 'shortcut': {
          const finder = members.slice().sort((a, b) => {
            const sA = pStats(a), sB = pStats(b);
            return (sB.intuition * 0.5 + sB.mental * 0.5) - (sA.intuition * 0.5 + sA.mental * 0.5);
          })[0];
          if (!finder) break;
          const prFinder = pronouns(finder);
          const shortTexts = [
            `${finder} spots a gap in the tree line — barely a trail, but it cuts the route in half. The tribe follows. They gain time.`,
            `${finder} holds up ${prFinder.posAdj} hand. 'This way.' Nobody argues. They're back on the water ten minutes ahead of schedule.`,
            `${finder} has been reading the terrain the whole way. When ${prFinder.sub === 'they' ? 'they point' : prFinder.sub + ' points'} left instead of right, the tribe trusts ${prFinder.obj}. Smart call.`,
          ];
          const finderScore = pStats(finder).intuition * 0.2 + pStats(finder).mental * 0.2;
          personalScores[finder] += 2.0; tribePhase2Score[t.name] += finderScore;
          members.filter(m => m !== finder).forEach(m => addBond(m, finder, 0.2));
          phases.portage.push({
            type: 'utcShortcut', phase: 'portage', players: [finder],
            text: shortTexts[_hash(finder + 'short', shortTexts.length)],
            personalScores: { [finder]: 2.0 }, badge: 'SHORTCUT', badgeClass: 'gold'
          });
          break;
        }

        case 'dangerous-crossing': {
          const leader = members.slice().sort((a, b) => {
            const sA = pStats(a), sB = pStats(b);
            return (sB.physical * 0.5 + sB.boldness * 0.5) - (sA.physical * 0.5 + sA.boldness * 0.5);
          })[0];
          if (!leader) break;
          const sL = pStats(leader);
          const crossScore = sL.physical * 0.06 + sL.boldness * 0.05;
          const success = Math.random() < crossScore + 0.3;
          const prL = pronouns(leader);
          const crossSuccTexts = [
            `The log bridge over the ravine looks terrible. ${leader} tests it, nods, and crosses first — canoe overhead. The tribe follows.`,
            `${leader} scouts the cliff edge crossing and picks the safest line. Everyone makes it. Nobody mentions how close the drop was.`,
            `The river ford is waist-deep and fast. ${leader} wades in first, turns to brace for the next person. The system works.`,
          ];
          const crossFailTexts = [
            `${leader} takes the lead on the crossing — and misjudges the depth. Half the tribe gets soaked. Time lost.`,
            `The log bridge collapses under the canoe weight. ${leader}'s fault for rushing. Everyone makes it but the delay stings.`,
            `${leader} picks the wrong route across the cliff. The tribe spends fifteen minutes backtracking.`,
          ];
          if (success) {
            personalScores[leader] += 1.5; tribePhase2Score[t.name] += 1.0;
            phases.portage.push({
              type: 'utcDangerousCrossing', phase: 'portage', players: [leader],
              text: crossSuccTexts[_hash(leader + 'csucc', crossSuccTexts.length)],
              personalScores: { [leader]: 1.5 }, badge: 'DANGEROUS CROSSING', badgeClass: 'gold'
            });
          } else {
            personalScores[leader] -= 1.0; tribePhase2Score[t.name] -= 0.5;
            phases.portage.push({
              type: 'utcDangerousCrossing', phase: 'portage', players: [leader],
              text: crossFailTexts[_hash(leader + 'cfail', crossFailTexts.length)],
              personalScores: { [leader]: -1.0 }, badge: 'DANGEROUS CROSSING', badgeClass: 'red'
            });
          }
          break;
        }

        case 'dropped-canoe': {
          const dropper = members.slice().sort((a, b) => {
            return ((10 - pStats(a).physical) * 0.07) - ((10 - pStats(b).physical) * 0.07);
          })[members.length - 1];
          if (!dropper) break;
          const dropScore = (10 - pStats(dropper).physical) * 0.07;
          const prDrop = pronouns(dropper);
          const dropTexts = [
            `${dropper} loses grip on the canoe going uphill. It slides back and clips two tribemates. Grumbling all around.`,
            `'I've got it.' ${dropper} does not have it. The canoe bounces off a rock. Everyone winces.`,
            `${dropper} drops ${prDrop.posAdj} end of the canoe at the worst possible moment — halfway up a slope. The whole tribe scrambles.`,
          ];
          personalScores[dropper] -= 1.5;
          members.filter(m => m !== dropper).forEach(m => addBond(m, dropper, -0.2));
          tribePhase2Score[t.name] -= dropScore * 2;
          // Add heat
          if (!gs._upTheCreekHeat) gs._upTheCreekHeat = {};
          gs._upTheCreekHeat[dropper] = { amount: 0.5, expiresEp: ((gs.episode || 0) + 1) + 1 };
          phases.portage.push({
            type: 'utcDroppedCanoe', phase: 'portage', players: [dropper],
            text: dropTexts[_hash(dropper + 'drop', dropTexts.length)],
            personalScores: { [dropper]: -1.5 }, badge: 'DROPPED', badgeClass: 'red'
          });
          break;
        }

        case 'cursed-idol': {
          // The Beth moment — someone finds a tiki idol on Boney Island
          // "Anyone who removes an item from the island will be cursed forever"
          const finder = members.slice().sort((a, b) => {
            return (pStats(b).boldness * 0.3 + (10 - pStats(b).intuition) * 0.4) - (pStats(a).boldness * 0.3 + (10 - pStats(a).intuition) * 0.4);
          })[0]; // bold + low intuition = most likely to pick it up
          if (!finder) break;
          const prF = pronouns(finder);
          const tookIt = Math.random() < (10 - pStats(finder).intuition) * 0.07 + pStats(finder).boldness * 0.03;
          if (tookIt) {
            const _tookTexts = [
              `${finder} spots a carved tiki idol half-buried in the dirt. "${prF.Sub} ${prF.sub === 'they' ? 'are' : 'is'} keeping this." Nobody mentions Chris's warning. Maybe ${prF.sub} wasn't listening.`,
              `${finder} finds a wooden idol near an old shrine. It looks cool. ${prF.Sub} ${prF.sub === 'they' ? 'pocket' : 'pockets'} it. The island seems to get quieter after that.`,
              `"Look what I found!" ${finder} holds up a carved tiki figure. The tribe stares. "What? It's a souvenir." Lightning flashes in the distance. Nobody connects the dots.`,
              `${finder} picks up the cursed tiki idol and calls it ${prF.posAdj} new lucky charm. It is not a lucky charm.`,
            ];
            personalScores[finder] -= 2.0; // curse penalty
            // The curse: bad luck for the rest of the challenge
            if (!gs._upTheCreekHeat) gs._upTheCreekHeat = {};
            gs._upTheCreekHeat[finder] = { amount: 1.0, expiresEp: ((gs.episode || 0) + 1) + 3 }; // curse lasts 3 episodes
            phases.portage.push({
              type: 'utcCursedIdol', phase: 'portage', players: [finder],
              text: _tookTexts[_hash(finder + 'idol', _tookTexts.length)],
              personalScores: { [finder]: -2.0 }, badge: 'CURSED IDOL', badgeClass: 'red'
            });
          } else {
            const _leftTexts = [
              `${finder} spots a carved idol on a stone pedestal. Reaches for it — then remembers Chris's warning. "Nah." Walks away. Smart.`,
              `${finder} sees the tiki idol. Something about it feels wrong. ${prF.Sub} ${prF.sub === 'they' ? 'leave' : 'leaves'} it where it is. The island approves.`,
              `"Don't touch anything on this island." ${finder} remembers. The idol stays. ${finder} moves on.`,
            ];
            personalScores[finder] += 0.5; // wisdom bonus
            phases.portage.push({
              type: 'utcCursedIdol', phase: 'portage', players: [finder],
              text: _leftTexts[_hash(finder + 'noidol', _leftTexts.length)],
              personalScores: { [finder]: 0.5 }, badge: 'WISE CHOICE', badgeClass: 'gold'
            });
          }
          break;
        }

        case 'insect-swarm': {
          const calm = members.slice().sort((a, b) => pStats(b).temperament - pStats(a).temperament)[0];
          const panicker = members.slice().sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
          if (!calm || calm === panicker) break;
          const prP = pronouns(panicker);
          const insectTexts = [
            `Black flies, everywhere, all at once. ${calm} keeps moving. ${panicker} is flailing, swatting, retreating. Chaos.`,
            `A cloud of mosquitoes descends on the tribe mid-portage. ${calm} pulls out bug spray and keeps walking. ${panicker} is not calm.`,
            `Hornets' nest — kicked by accident. ${calm} says 'keep moving, don't swat' and walks through. ${panicker} does not follow this advice.`,
          ];
          personalScores[calm] += 0.5; personalScores[panicker] -= 0.5;
          phases.portage.push({
            type: 'utcInsectSwarm', phase: 'portage', players: [calm, panicker],
            text: insectTexts[_hash(calm + panicker + 'bugs', insectTexts.length)],
            personalScores: { [calm]: 0.5, [panicker]: -0.5 }, badge: 'INSECT SWARM', badgeClass: 'red'
          });
          break;
        }

        case 'boney-fog': {
          const navigator = members.slice().sort((a, b) => {
            const sA = pStats(a), sB = pStats(b);
            return (sB.mental * 0.5 + sB.intuition * 0.5) - (sA.mental * 0.5 + sA.intuition * 0.5);
          })[0];
          if (!navigator) break;
          const sNav = pStats(navigator);
          const navScore = sNav.mental * 0.06 + sNav.intuition * 0.04;
          const prNav = pronouns(navigator);
          if (Math.random() < navScore + 0.3) {
            const fogSuccTexts = [
              `The fog rolls in thick. ${navigator} tells the tribe to stay close and keep calling out. They make it through without losing anyone.`,
              `${navigator} uses the sound of running water to stay on course through zero-visibility fog. Smart. The tribe gives ${prNav.obj} credit.`,
              `${navigator} marks trees as they go. When the fog lifts, they're exactly on course.`,
            ];
            personalScores[navigator] += 1.5; tribePhase2Score[t.name] += 1.0;
            members.filter(m => m !== navigator).forEach(m => addBond(m, navigator, 0.2));
            phases.portage.push({
              type: 'utcDenseFog', phase: 'portage', players: [navigator],
              text: fogSuccTexts[_hash(navigator + 'fogsucc', fogSuccTexts.length)],
              personalScores: { [navigator]: 1.5 }, badge: 'NAVIGATED FOG', badgeClass: 'gold'
            });
          } else {
            const fogFailTexts = [
              `The fog takes the tribe off-trail. ${navigator} insists they're on course. They're not. They backtrack for twenty minutes.`,
              `${navigator} leads the tribe in a slow arc back toward where they started. Nobody realizes until the fog thins.`,
              `${navigator} loses the trail in the fog. The tribe splits trying to find it. Regrouping costs them serious time.`,
            ];
            personalScores[navigator] -= 1.5; tribePhase2Score[t.name] -= 1.0;
            phases.portage.push({
              type: 'utcDenseFog', phase: 'portage', players: [navigator],
              text: fogFailTexts[_hash(navigator + 'fogfail', fogFailTexts.length)],
              personalScores: { [navigator]: -1.5 }, badge: 'LOST IN FOG', badgeClass: 'red'
            });
          }
          break;
        }

        case 'rival-spotted': {
          const strategist = members.slice().sort((a, b) => {
            const sA = pStats(a), sB = pStats(b);
            return (sB.strategic * 0.5 + sB.social * 0.5) - (sA.strategic * 0.5 + sA.social * 0.5);
          })[0];
          if (!strategist) break;
          // Cross-tribe bond interaction: find a player from another tribe
          const otherTribeMembers = tribes.filter(ot => ot.name !== t.name).flatMap(ot => ot.members);
          if (!otherTribeMembers.length) break;
          const rival = _rp(otherTribeMembers);
          const prStrat = pronouns(strategist);
          const rivalTexts = [
            `${strategist} catches sight of the rival tribe through the trees. ${prStrat.Sub} immediately clocks their position and pace. The tribe picks it up.`,
            `Voices ahead — the other tribe. ${strategist} signals to slow down and listen. They hear enough. The tribe adjusts its route.`,
            `${strategist} spots ${rival} struggling on the portage. ${prStrat.Sub} files that away. Quietly.`,
          ];
          personalScores[strategist] += 0.5;
          const existingBond = getBond(strategist, rival);
          addBond(strategist, rival, existingBond >= 0 ? 0.3 : -0.3);
          phases.portage.push({
            type: 'utcRivalSpotted', phase: 'portage', players: [strategist, rival],
            text: rivalTexts[_hash(strategist + rival + 'rival', rivalTexts.length)],
            personalScores: { [strategist]: 0.5 }, badge: 'RIVAL SPOTTED', badgeClass: ''
          });
          break;
        }

        case 'falls-behind': {
          const straggler = members.slice().sort((a, b) => {
            const sA = pStats(a), sB = pStats(b);
            return ((10 - sA.endurance) * 0.5 + (10 - sA.physical) * 0.5) - ((10 - sB.endurance) * 0.5 + (10 - sB.physical) * 0.5);
          })[members.length - 1];
          const helper = members.filter(m => m !== straggler).slice().sort((a, b) => pStats(b).social - pStats(a).social)[0];
          if (!straggler || !helper) break;
          const prStr = pronouns(straggler);
          const fallTexts = [
            `${straggler} falls back on the uphill. ${helper} drops behind to match ${prStr.posAdj} pace. Nobody is left behind.`,
            `${helper} notices ${straggler} is struggling and drifts back without saying anything. Just walks alongside. That's enough.`,
            `${straggler} isn't keeping up. ${helper} passes ${prStr.obj} ${prStr.posAdj} water without comment. They finish together.`,
          ];
          personalScores[straggler] -= 1.0; personalScores[helper] += 0.5;
          addBond(helper, straggler, 0.3);
          phases.portage.push({
            type: 'utcFallsBehind', phase: 'portage', players: [straggler, helper],
            text: fallTexts[_hash(straggler + helper + 'fall', fallTexts.length)],
            personalScores: { [straggler]: -1.0, [helper]: 0.5 }, badge: 'FALLS BEHIND', badgeClass: 'red'
          });
          break;
        }

        case 'spooky-sounds': {
          const brave = members.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
          const comforter = members.filter(m => m !== brave).slice().sort((a, b) => pStats(b).social - pStats(a).social)[0];
          const scared = members.filter(m => m !== brave && m !== comforter).slice().sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
          if (!brave || !comforter) break;
          const prCom = pronouns(comforter);
          const soundTexts = [
            `Something large moves in the undergrowth. ${brave} doesn't flinch. ${comforter} immediately reads the group's anxiety and makes a joke. The tension breaks.`,
            `Low sounds, rhythmic, like breathing. ${brave} says 'it's nothing' and is probably right. ${comforter} puts ${prCom.posAdj} hand on someone's shoulder. The tribe keeps moving.`,
            `Crackling. Then silence. ${brave} keeps walking, doesn't look back. ${comforter} falls into step next to ${scared || 'the most anxious-looking tribemate'}.`,
          ];
          personalScores[brave] += 0.5; personalScores[comforter] += 0.5;
          if (scared) addBond(comforter, scared, 0.3);
          phases.portage.push({
            type: 'utcMysteriousSounds', phase: 'portage', players: scared ? [brave, comforter, scared] : [brave, comforter],
            text: soundTexts[_hash(brave + comforter + 'sound', soundTexts.length)],
            personalScores: scared ? { [brave]: 0.5, [comforter]: 0.5, [scared]: 0 } : { [brave]: 0.5, [comforter]: 0.5 },
            badge: 'MYSTERIOUS SOUNDS', badgeClass: ''
          });
          break;
        }

        case 'steep-hill': {
          const hillScore = members.reduce((sum, m) => {
            const s = pStats(m);
            return sum + s.physical * 0.06 + s.endurance * 0.05;
          }, 0) / members.length;
          const weakest = members.slice().sort((a, b) => {
            const sA = pStats(a), sB = pStats(b);
            return (sA.physical + sA.endurance) - (sB.physical + sB.endurance);
          })[0];
          const prWeak = pronouns(weakest);
          const hillTexts = [
            `The hill is worse than it looks. The canoes double the misery. ${weakest} is gasping by the top — the tribe had to slow its pace.`,
            `Everyone hits the hill running. ${weakest} is the last to crest it. Nobody waits too long, but nobody pretends they didn't notice.`,
            `The portage hill. Everyone hates it. ${weakest} hates it specifically in a way that ${prWeak.sub === 'they' ? 'show' : 'shows'}.`,
          ];
          personalScores[weakest] -= 0.2;
          tribePhase2Score[t.name] += hillScore;
          phases.portage.push({
            type: 'utcSteepHill', phase: 'portage', players: [weakest],
            text: hillTexts[_hash(weakest + 'hill', hillTexts.length)],
            personalScores: { [weakest]: -0.2 }, badge: 'STEEP HILL', badgeClass: 'red'
          });
          break;
        }

        case 'food-discovery': {
          const spotter = members.slice().sort((a, b) => {
            const sA = pStats(a), sB = pStats(b);
            return (sB.intuition * 0.5 + sB.mental * 0.5) - (sA.intuition * 0.5 + sA.mental * 0.5);
          })[0];
          if (!spotter) break;
          const sSpot = pStats(spotter);
          const identScore = sSpot.mental * 0.06 + sSpot.intuition * 0.04;
          const goodFind = Math.random() < identScore + 0.3;
          const prSpot = pronouns(spotter);
          if (goodFind) {
            const foodTexts = [
              `${spotter} spots wild blueberries off the trail and correctly identifies them. The tribe takes two minutes to eat and gains morale.`,
              `${spotter} recognizes a wild apple tree and announces it immediately. Fifteen seconds of foraging. Worth it.`,
              `${spotter} picks up a handful of berries, pops one in ${prSpot.posAdj} mouth, thinks, and says 'edible.' The tribe is grateful.`,
            ];
            personalScores[spotter] += 1.0;
            members.filter(m => m !== spotter).forEach(m => addBond(m, spotter, 0.2));
            tribePhase2Score[t.name] += 0.5;
            phases.portage.push({
              type: 'utcFoodDiscovery', phase: 'portage', players: [spotter],
              text: foodTexts[_hash(spotter + 'food', foodTexts.length)],
              personalScores: { [spotter]: 1.0 }, badge: 'FOOD DISCOVERY', badgeClass: 'gold'
            });
          } else {
            const sickTexts = [
              `${spotter} finds berries and confidently eats them. They are not the right berries. ${prSpot.Sub} ${prSpot.sub === 'they' ? 'spend' : 'spends'} the next kilometer looking ill.`,
              `${spotter} misidentifies what turns out to be mildly toxic berries. Not dangerous. Just deeply unpleasant for the rest of the portage.`,
              `${spotter} hands out what ${prSpot.sub === 'they' ? 'they call' : prSpot.sub + ' calls'} 'trail snacks.' The tribe's collective stomach disagrees.`,
            ];
            personalScores[spotter] -= 1.0;
            tribePhase2Score[t.name] -= 0.5;
            phases.portage.push({
              type: 'utcFoodDiscovery', phase: 'portage', players: [spotter],
              text: sickTexts[_hash(spotter + 'sick', sickTexts.length)],
              personalScores: { [spotter]: -1.0 }, badge: 'WRONG BERRIES', badgeClass: 'red'
            });
          }
          break;
        }

        case 'creek-crossing': {
          const teamScore = members.reduce((sum, m) => {
            const s = pStats(m);
            return sum + s.physical * 0.06 + s.loyalty * 0.04;
          }, 0) / members.length;
          const coordinated = teamScore > 0.6;
          const coordinator = members.slice().sort((a, b) => {
            return (pStats(b).loyalty + pStats(b).social) - (pStats(a).loyalty + pStats(a).social);
          })[0];
          if (!coordinator) break;
          const prCoord = pronouns(coordinator);
          if (coordinated) {
            const coordTexts = [
              `${coordinator} organizes the crossing — pairs, timing, canoe placement. The whole tribe moves as a unit. Smooth.`,
              `Creek crossing with canoes. ${coordinator} calls it out. The tribe locks arms and wades across together. Not a single canoe hits a rock.`,
              `${coordinator} has everyone staged on the bank before anyone enters the water. The crossing is fast, efficient, and actually kind of impressive.`,
            ];
            personalScores[coordinator] += 1.0; tribePhase2Score[t.name] += 1.0;
            phases.portage.push({
              type: 'utcCreekCrossing', phase: 'portage', players: [coordinator],
              text: coordTexts[_hash(coordinator + 'ccoord', coordTexts.length)],
              personalScores: { [coordinator]: 1.0 }, badge: 'CREEK CROSSING', badgeClass: 'gold'
            });
          } else {
            const messTexts = [
              `The creek crossing with canoes devolves fast. Everyone is doing something different. Someone drops a canoe in the water. They make it through eventually.`,
              `The tribe tries to cross with canoes and fails to coordinate. Two near-drops, one actual drop, and fifteen minutes of chaos.`,
              `'Everyone at once' was the plan. It was not a good plan. The canoes end up wedged and someone has to wade out to free them.`,
            ];
            tribePhase2Score[t.name] -= 0.5;
            phases.portage.push({
              type: 'utcCreekCrossing', phase: 'portage', players: members.slice(0, 2),
              text: messTexts[_hash(t.name + 'cuncord', messTexts.length)],
              personalScores: {}, badge: 'CREEK CROSSING', badgeClass: 'red'
            });
          }
          break;
        }

        case 'boney-mist': {
          // Boney Island's signature eerie mist rolls in
          const nervous = members.slice().sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
          const steady = members.slice().sort((a, b) => pStats(b).temperament - pStats(a).temperament)[0];
          if (!nervous || nervous === steady) break;
          const prN = pronouns(nervous);
          const _mistTexts = [
            `The mist rolls in without warning. Thick, cold, unnatural. Visibility drops to five feet. ${nervous} grabs someone's arm. ${steady} keeps walking like nothing's wrong.`,
            `Boney Island's mist swallows the tribe. ${nervous} starts breathing fast. "I can't see anything." ${steady}: "Then follow my voice." They push through.`,
            `The air turns cold. The mist is so thick ${nervous} can't see ${prN.posAdj} own hands. Something moves in the white. Nobody knows what. ${steady} keeps the tribe moving.`,
            `White fog, everywhere. ${nervous} swears something touched ${prN.posAdj} shoulder. ${steady} says it was a branch. Neither of them is sure.`,
          ];
          personalScores[nervous] = (personalScores[nervous] || 0) - 0.5;
          personalScores[steady] = (personalScores[steady] || 0) + 0.5;
          phases.portage.push({
            type: 'utcBoneyMist', phase: 'portage', players: [nervous, steady],
            text: _mistTexts[_hash(nervous + steady + 'mist', _mistTexts.length)],
            personalScores: { [nervous]: -0.5, [steady]: 0.5 }, badge: 'BONEY MIST', badgeClass: ''
          });
          break;
        }

        case 'skeleton-find': {
          // Someone finds bones/skulls — Boney Island got its name for a reason
          const finder = members[Math.floor(Math.random() * members.length)];
          if (!finder) break;
          const prFi = pronouns(finder);
          const _skelTexts = [
            `${finder} trips over something. Looks down. Bones. Old ones. Boney Island earned its name. ${prFi.Sub} doesn't trip again — ${prFi.sub} ${prFi.sub === 'they' ? 'watch' : 'watches'} every step after that.`,
            `"Hey, what's—" ${finder} stops mid-sentence. A skull, half-buried in the mud. Human or animal, nobody can tell. Nobody wants to look closer.`,
            `${finder} finds a skeleton arranged in a sitting position against a tree. Like it was waiting. The tribe walks faster after that.`,
            `Bones scattered across the trail. ${finder} counts at least three different sets. "What happened here?" Nobody answers. Nobody wants to.`,
          ];
          personalScores[finder] = (personalScores[finder] || 0) - 0.3;
          phases.portage.push({
            type: 'utcSkeletonFind', phase: 'portage', players: [finder],
            text: _skelTexts[_hash(finder + 'skeleton', _skelTexts.length)],
            personalScores: { [finder]: -0.3 }, badge: 'BONES', badgeClass: ''
          });
          break;
        }

      } // end switch
    }); // end portage encounters
  }); // end tribes portage

  // Showmance challenge moment — danger scenario (portage danger context)
  tribes.forEach(t => _checkShowmanceChalMoment(ep, 'portage', phases, personalScores, 'danger', tribes));

  // ══ PHASE 3: BUILD FIRE ══
  const fireScores = {};

  tribes.forEach(t => {
    const members = t.members;

    // Best fire builder: mental * 0.04 + boldness * 0.03
    const builder = members.slice().sort((a, b) => {
      const sA = pStats(a), sB = pStats(b);
      return (sB.mental * 0.04 + sB.boldness * 0.03) - (sA.mental * 0.04 + sA.boldness * 0.03);
    })[0];
    if (!builder) { fireScores[t.name] = 0; return; }

    const sBuilder = pStats(builder);
    let fireScore = sBuilder.mental * 0.04 + sBuilder.boldness * 0.03 + Math.random() * 1.5;
    const prBuilder = pronouns(builder);
    let fireMethod = 'traditional';
    let fireMethodText = '';

    // Check special methods
    const arch = players.find(p => p.name === builder)?.archetype || '';
    const isVillainType = ['villain', 'schemer', 'wildcard', 'chaos-agent'].includes(arch);
    const isChaosType = ['chaos-agent', 'wildcard'].includes(arch);

    // 1. Lighter (villain/schemer/wildcard)
    if (isVillainType && Math.random() < sBuilder.boldness * 0.06 + 0.15) {
      fireScore += 3.0;
      fireMethod = 'lighter';
      fireMethodText = ` 'No rule against it,' ${builder} says, clicking a lighter.`;
      personalScores[builder] += 1.5;
      phases.buildFire.push({
        type: 'utcLighter', phase: 'buildFire', players: [builder],
        text: `${builder} produces a lighter from ${prBuilder.posAdj} pocket.${fireMethodText} The fire is enormous. The tribe doesn't know whether to be impressed or suspicious.`,
        personalScores: { [builder]: 1.5 }, badge: 'LIGHTER', badgeClass: 'gold'
      });
    }
    // 2. Homemade fire-starter (chaos/wildcard, 50/50 risk) — only if no lighter
    else if (isChaosType && Math.random() < sBuilder.boldness * 0.05 + 0.20) {
      const explosion = Math.random() < 0.5;
      fireMethod = 'homemade-starter';
      if (!explosion) {
        fireScore += 4.0;
        personalScores[builder] += 2.0;
        phases.buildFire.push({
          type: 'utcFireStarter', phase: 'buildFire', players: [builder],
          text: `${builder} pulls out a homemade fire-starter concoction. It goes off exactly as planned — an enormous column of fire. Controlled. Barely. The tribe is speechless.`,
          personalScores: { [builder]: 2.0 }, badge: 'FIRE STARTER', badgeClass: 'gold'
        });
      } else {
        fireScore -= 2.0;
        personalScores[builder] -= 1.5;
        phases.buildFire.push({
          type: 'utcFireStarter', phase: 'buildFire', players: [builder],
          text: `${builder}'s homemade fire-starter does not go as planned. The initial explosion singes ${prBuilder.posAdj} eyebrows. The tribe rebuilds from scratch. Time lost.`,
          personalScores: { [builder]: -1.5 }, badge: 'EXPLOSION', badgeClass: 'red'
        });
      }
    }
    // 3. Throw paddles in fire (low mental + high boldness proportional) — only for non-nice archetypes
    else if (!NICE_ARCHS.has(arch) && Math.random() < (10 - sBuilder.mental) * 0.02 + sBuilder.boldness * 0.03) {
      fireScore += 2.0;
      fireMethod = 'paddle-burn';
      paddlesBurned[t.name] = true;
      personalScores[builder] -= 0.5; // short-term gain, long-term cost
      // Anger from tribe
      members.filter(m => m !== builder).forEach(m => addBond(m, builder, -0.3));
      // Add heat
      if (!gs._upTheCreekHeat) gs._upTheCreekHeat = {};
      gs._upTheCreekHeat[builder] = { amount: 1.0, expiresEp: ((gs.episode || 0) + 1) + 2 };
      phases.buildFire.push({
        type: 'utcPaddleBurn', phase: 'buildFire', players: [builder],
        text: `${builder} looks at the paddles. Looks at the fire. Makes the decision in about one second. In go the paddles. The fire roars. The tribe stares. 'We don't need them.' Technically true. Practically disastrous.`,
        personalScores: { [builder]: -0.5 }, badge: 'PADDLES BURNED', badgeClass: 'red'
      });
    }
    // 4. Advice to enemy (social * 0.04 + (10-strategic) * 0.03, only social/low-strategic types) — only if no other special method
    else if (!NICE_ARCHS.has(arch) === false && !isVillainType && Math.random() < sBuilder.social * 0.04 + (10 - sBuilder.strategic) * 0.03 - 0.3) {
      const otherTribes = tribes.filter(ot => ot.name !== t.name);
      if (otherTribes.length) {
        const enemyTribe = otherTribes[Math.floor(Math.random() * otherTribes.length)];
        fireMethod = 'advice-to-enemy';
        fireScore -= 0.5;
        fireScores[enemyTribe.name] = (fireScores[enemyTribe.name] || 0) + 2.0;
        personalScores[builder] -= 0.5;
        members.filter(m => m !== builder).forEach(m => addBond(m, builder, -0.5));
        // Add heat
        if (!gs._upTheCreekHeat) gs._upTheCreekHeat = {};
        gs._upTheCreekHeat[builder] = { amount: 1.5, expiresEp: ((gs.episode || 0) + 1) + 2 };
        phases.buildFire.push({
          type: 'utcAdviceGiver', phase: 'buildFire', players: [builder],
          text: `${builder} wanders over to ${enemyTribe.name}'s fire and just... helps them. The tips are good. ${enemyTribe.name}'s fire improves dramatically. ${builder}'s own tribe is silent with fury.`,
          personalScores: { [builder]: -0.5 }, badge: 'HELPED THE ENEMY', badgeClass: 'red'
        });
      }
    }

    // Traditional fire-building (default, always fires if no other method)
    if (fireMethod === 'traditional') {
      const tradTexts = [
        `${builder} gets down on ${prBuilder.posAdj} knees and works the friction method. Steady, patient, experienced. The coal forms. The fire catches.`,
        `${builder} sets up the tinder, the kindling, the fuel — in order, correctly. The tribe watches. The fire starts on the first try.`,
        `${builder} has done this before. The technique is clean. The fire is solid. Nothing flashy — just competent.`,
      ];
      personalScores[builder] += 0.5;
      phases.buildFire.push({
        type: 'utcFireBuilt', phase: 'buildFire', players: [builder],
        text: tradTexts[_hash(builder + 'tradfire', tradTexts.length)],
        personalScores: { [builder]: 0.5 }, badge: 'FIRE BUILT', badgeClass: 'gold'
      });
    }

    fireScore = Math.max(0, fireScore);
    // Only set if not already incremented by advice-to-enemy above
    if (!fireScores[t.name]) fireScores[t.name] = 0;
    fireScores[t.name] += fireScore;
    tribePhase3Score[t.name] = fireScores[t.name];
  });

  // Determine fire winner: gets +3.0 for Phase 4
  const fireWinner = tribes.slice().sort((a, b) => (fireScores[b.name] || 0) - (fireScores[a.name] || 0))[0];

  // ══ PHASE 4: PADDLE BACK (3-5 events per tribe) ══
  tribes.forEach(t => {
    const members = t.members;
    const pairs = canoePairs[t.name];
    const solo = soloCanoe[t.name];
    let p4EventCount = 0;
    const maxP4 = 3 + Math.floor(Math.random() * 3); // 3-5

    // Recalculate pair speeds for paddle back (same formula)
    pairs.forEach(pair => {
      const bond = getBond(pair.a, pair.b);
      const sA = pStats(pair.a), sB = pStats(pair.b);
      const avgPhysEnd = ((sA.physical + sA.endurance + sB.physical + sB.endurance) / 2);
      let speed = bond * 0.15 + avgPhysEnd * 0.25 + Math.random() * 1.5;
      if (bond >= 2) speed += 0.5;
      if (bond <= -1) speed -= 0.5;
      speed = Math.max(0.1, speed);
      tribePhase4Score[t.name] += speed;
    });

    // Fire winner bonus
    if (fireWinner && fireWinner.name === t.name) {
      tribePhase4Score[t.name] += 3.0;
    }

    // Paddles burned: swimmer hero mechanic
    if (paddlesBurned[t.name]) {
      const heroCandidate = members.slice().sort((a, b) => {
        const sA = pStats(a), sB = pStats(b);
        return (sB.physical * 0.06 + sB.endurance * 0.05) - (sA.physical * 0.06 + sA.endurance * 0.05);
      })[0];
      if (heroCandidate) {
        const sH = pStats(heroCandidate);
        const swimScore = sH.physical * 0.06 + sH.endurance * 0.05 + Math.random() * 2.0;
        const prH = pronouns(heroCandidate);
        if (swimScore > 1.2) {
          swimmerHero = heroCandidate;
          personalScores[heroCandidate] += 3.0;
          tribePhase4Score[t.name] += swimScore;
          phases.paddleBack.push({
            type: 'utcSwimmerHero', phase: 'paddleBack', players: [heroCandidate],
            text: `No paddles. ${heroCandidate} strips to ${prH.posAdj} shorts and goes in the water. ${prH.Sub} ${prH.sub === 'they' ? 'push' : 'pushes'} the canoe from behind for the entire stretch. The tribe rides. ${heroCandidate} swims. Somehow they make it.`,
            personalScores: { [heroCandidate]: 3.0 }, badge: 'SWIMMER HERO', badgeClass: 'gold'
          });
          p4EventCount++;
        } else {
          personalScores[heroCandidate] -= 1.0;
          tribePhase4Score[t.name] -= 1.5;
          phases.paddleBack.push({
            type: 'utcSwimmerHero', phase: 'paddleBack', players: [heroCandidate],
            text: `No paddles. The plan is for ${heroCandidate} to swim and push the canoe. The plan does not survive first contact with the current. The tribe barely moves.`,
            personalScores: { [heroCandidate]: -1.0 }, badge: 'STRUGGLING SWIMMER', badgeClass: 'red'
          });
          p4EventCount++;
        }
      }
    }

    // Solo canoe Phase 4
    if (solo && !paddlesBurned[t.name]) {
      const sS = pStats(solo);
      tribePhase4Score[t.name] += sS.physical * 0.3 + sS.endurance * 0.25 + Math.random() * 1.0;
    }

    // Event pool for Phase 4
    const P4_EVENTS = [
      'strong-current', 'capsized', 'sprint-finish', 'paddling-argument',
      'wildlife-in-water', 'wave-hits', 'cheating', 'canoe-leak',
      'motivational-speech', 'exhaustion', 'drafting', 'photo-finish'
    ];
    const p4Pool = P4_EVENTS.slice().sort(() => Math.random() - 0.5).slice(0, maxP4 - p4EventCount);

    p4Pool.forEach(evtType => {
      if (p4EventCount >= maxP4) return;

      switch (evtType) {
        case 'strong-current': {
          const allPairs = pairs.slice().sort((a, b) => {
            const sA = pStats(a.a).physical + pStats(a.b).physical;
            const sB = pStats(b.a).physical + pStats(b.b).physical;
            return sA - sB; // weakest most affected
          });
          const weakPair = allPairs[0];
          if (!weakPair) break;
          const currTexts = [
            `Strong current hits the tribe on the home stretch. Every pair fights it. ${weakPair.a} and ${weakPair.b} feel it the most.`,
            `The current pushes back hard. ${weakPair.a} and ${weakPair.b}'s canoe is going sideways. The stronger pairs power through.`,
            `Current. Strong. The kind that turns a five-minute stretch into fifteen. ${weakPair.a} and ${weakPair.b} are exhausted by it.`,
          ];
          personalScores[weakPair.a] -= 0.5; personalScores[weakPair.b] -= 0.5;
          tribePhase4Score[t.name] -= 0.8;
          phases.paddleBack.push({
            type: 'utcStrongCurrent', phase: 'paddleBack', players: [weakPair.a, weakPair.b],
            text: currTexts[_hash(weakPair.a + weakPair.b + 'curr', currTexts.length)],
            personalScores: { [weakPair.a]: -0.5, [weakPair.b]: -0.5 }, badge: 'STRONG CURRENT', badgeClass: 'red'
          });
          p4EventCount++;
          break;
        }

        case 'capsized': {
          if (!pairs.length) break;
          const capPair = pairs.slice().sort((a, b) => {
            const endA = (pStats(a.a).endurance + pStats(a.b).endurance) / 2;
            const endB = (pStats(b.a).endurance + pStats(b.b).endurance) / 2;
            return endA - endB;
          })[0];
          if (capPair && Math.random() < 0.35) {
            const prCA = pronouns(capPair.a);
            const capBackTexts = [
              `${capPair.a} and ${capPair.b} capsize on the final stretch. Time gone. The crowd on shore watches them flip.`,
              `${capPair.a} overcorrects on the approach and the whole canoe goes over. ${capPair.b} comes up furious.`,
              `The wake from another canoe catches ${capPair.a} and ${capPair.b} wrong. They're in the water before they can blink.`,
            ];
            personalScores[capPair.a] -= 1.5; personalScores[capPair.b] -= 1.5;
            addBond(capPair.a, capPair.b, -0.3);
            tribePhase4Score[t.name] -= 1.5;
            phases.paddleBack.push({
              type: 'utcCapsized', phase: 'paddleBack', players: [capPair.a, capPair.b],
              text: capBackTexts[_hash(capPair.a + capPair.b + 'capback', capBackTexts.length)],
              personalScores: { [capPair.a]: -1.5, [capPair.b]: -1.5 }, badge: 'CAPSIZED', badgeClass: 'red'
            });
            p4EventCount++;
          }
          break;
        }

        case 'sprint-finish': {
          const sprinter = members.slice().sort((a, b) => {
            const sA = pStats(a), sB = pStats(b);
            return (sB.physical + sB.endurance) - (sA.physical + sA.endurance);
          })[0];
          if (!sprinter) break;
          const prSpr = pronouns(sprinter);
          const sprintTexts = [
            `${sprinter} calls it in the last 200 meters — full sprint. The canoe surges. The tribe rides the energy all the way to shore.`,
            `${sprinter} switches to power strokes on the final stretch. The canoe hits the beach at full speed. The tribe piles out.`,
            `${sprinter} sees the shore and just goes. The pace is brutal and the tribe matches it. They arrive in a heap, breathing hard.`,
          ];
          personalScores[sprinter] += 2.0; tribePhase4Score[t.name] += 1.5;
          phases.paddleBack.push({
            type: 'utcSprintFinish', phase: 'paddleBack', players: [sprinter],
            text: sprintTexts[_hash(sprinter + 'sprint', sprintTexts.length)],
            personalScores: { [sprinter]: 2.0 }, badge: 'SPRINT FINISH', badgeClass: 'gold'
          });
          p4EventCount++;
          break;
        }

        case 'paddling-argument': {
          const argPairs4 = pairs.filter(p => getBond(p.a, p.b) <= 0);
          if (!argPairs4.length) break;
          const argPair4 = _rp(argPairs4);
          const argBack4 = [
            `${argPair4.a} and ${argPair4.b} are screaming at each other mid-race. Actual screaming. The other tribes can hear it.`,
            `'PADDLE LEFT.' 'I AM PADDLING LEFT.' ${argPair4.a} and ${argPair4.b} are going in circles.`,
            `${argPair4.a} stops paddling to make a point. ${argPair4.b} responds by paddling the wrong way. The canoe drifts.`,
          ];
          personalScores[argPair4.a] -= 0.5; personalScores[argPair4.b] -= 0.5;
          addBond(argPair4.a, argPair4.b, -0.3);
          tribePhase4Score[t.name] -= 0.8;
          phases.paddleBack.push({
            type: 'utcPaddlingArg', phase: 'paddleBack', players: [argPair4.a, argPair4.b],
            text: argBack4[_hash(argPair4.a + argPair4.b + 'argback', argBack4.length)],
            personalScores: { [argPair4.a]: -0.5, [argPair4.b]: -0.5 }, badge: 'PADDLING ARGUMENT', badgeClass: 'red'
          });
          p4EventCount++;
          break;
        }

        case 'wildlife-in-water': {
          const braveMem = members.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
          const scaredMem = members.slice().sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
          if (!braveMem || braveMem === scaredMem) break;
          const wildWater = ['snapping turtle', 'large pike fish', 'snapping catfish'];
          const creature = _rp(wildWater);
          const prBW = pronouns(braveMem);
          const waterWildTexts = [
            `A ${creature} surfaces alongside ${scaredMem}'s canoe. ${scaredMem} flinches hard enough to rock it. ${braveMem} doesn't even blink. Keeps paddling.`,
            `${creature} circles the lead canoe. ${scaredMem} pulls ${pronouns(scaredMem).posAdj} paddle in. ${braveMem} says 'it's fine' and it is fine.`,
            `${braveMem} spots the ${creature} first and says nothing, just steers around it. ${scaredMem} finds out thirty seconds later and is not pleased.`,
          ];
          personalScores[braveMem] += 1.0; personalScores[scaredMem] -= 0.5;
          phases.paddleBack.push({
            type: 'utcWildlife', phase: 'paddleBack', players: [braveMem, scaredMem],
            text: waterWildTexts[_hash(braveMem + scaredMem + 'waterwild', waterWildTexts.length)],
            personalScores: { [braveMem]: 1.0, [scaredMem]: -0.5 }, badge: 'WILDLIFE', badgeClass: ''
          });
          p4EventCount++;
          break;
        }

        case 'wave-hits': {
          const weakEnd = members.slice().sort((a, b) => pStats(a).endurance - pStats(b).endurance)[0];
          if (!weakEnd) break;
          const prWE = pronouns(weakEnd);
          const waveTexts = [
            `A wake from a passing boat hits ${weakEnd}'s canoe sideways. ${prWE.Sub} ${prWE.sub === 'they' ? 'spend' : 'spends'} the next minute bailing.`,
            `The wave doesn't capsize ${weakEnd}'s canoe but it doesn't help. ${prWE.Sub} ${prWE.sub === 'they' ? 'arrive' : 'arrives'} soaked and behind.`,
            `${weakEnd} takes a wave full in the face. The canoe slows. The race continues. ${prWE.Sub} wipes ${prWE.posAdj} eyes and keeps paddling.`,
          ];
          personalScores[weakEnd] -= 0.5; tribePhase4Score[t.name] -= 0.5;
          phases.paddleBack.push({
            type: 'utcWaveHit', phase: 'paddleBack', players: [weakEnd],
            text: waveTexts[_hash(weakEnd + 'wave', waveTexts.length)],
            personalScores: { [weakEnd]: -0.5 }, badge: 'WAVE HIT', badgeClass: 'red'
          });
          p4EventCount++;
          break;
        }

        case 'cheating': {
          const cheaterCandidates = members.filter(m => {
            const s = pStats(m);
            const arch2 = players.find(p => p.name === m)?.archetype || '';
            return (10 - s.loyalty) * 0.02 + s.strategic * 0.03 > 0.3 && !NICE_ARCHS.has(arch2);
          });
          if (!cheaterCandidates.length) break;
          const cheater = _rp(cheaterCandidates);
          const observer = tribes.filter(ot => ot.name !== t.name).flatMap(ot => ot.members)
            .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
          const sCh = pStats(cheater);
          const caught = observer && Math.random() < pStats(observer).intuition * 0.05;
          const prCh = pronouns(cheater);
          if (!caught) {
            const cheatTexts = [
              `${cheater} cuts through the restricted zone when no one is looking. Gains serious time. Nobody notices.`,
              `${cheater} takes the direct line that was marked as off-limits. ${prCh.Sub} ${prCh.sub === 'they' ? 'make' : 'makes'} it back looking casual.`,
              `${cheater} shortcircuits the final buoy. Clean, quick, undetected. The time gain is real.`,
            ];
            personalScores[cheater] += 1.5; tribePhase4Score[t.name] += 2.0;
            phases.paddleBack.push({
              type: 'utcCheating', phase: 'paddleBack', players: [cheater],
              text: cheatTexts[_hash(cheater + 'cheat', cheatTexts.length)],
              personalScores: { [cheater]: 1.5 }, badge: 'CHEATING', badgeClass: 'red'
            });
          } else {
            const caughtTexts = [
              `${cheater} cuts through the restricted zone. ${observer} from the other tribe calls it out immediately. The tribe is assessed a penalty.`,
              `${cheater} tries the shortcut. ${observer} points. Everyone sees. The time penalty hurts more than the attempt helped.`,
              `${observer} spots ${cheater}'s canoe inside the marker. The call goes up. ${cheater} has to backtrack in front of everyone.`,
            ];
            personalScores[cheater] -= 1.0; tribePhase4Score[t.name] -= 1.5;
            phases.paddleBack.push({
              type: 'utcCheating', phase: 'paddleBack', players: [cheater, observer],
              text: caughtTexts[_hash(cheater + 'caught', caughtTexts.length)],
              personalScores: { [cheater]: -1.0 }, badge: 'CHEATING', badgeClass: 'red'
            });
          }
          p4EventCount++;
          break;
        }

        case 'canoe-leak': {
          if (!pairs.length) break;
          const leakPair = _rp(pairs);
          if (Math.random() < 0.3) {
            const prLA = pronouns(leakPair.a);
            const sLB = pStats(leakPair.b);
            const bailerScore = sLB.physical * 0.05;
            const leakTexts = [
              `${leakPair.a} and ${leakPair.b}'s canoe springs a leak. ${leakPair.a} bails. ${leakPair.b} solos the paddling. They're slowing.`,
              `A crack in the hull. ${leakPair.a} is on bail duty. ${leakPair.b} paddles hard enough for both of them.`,
              `Water in the canoe. ${leakPair.a} cups it out with ${prLA.posAdj} hands. ${leakPair.b} tries to compensate with power strokes.`,
            ];
            personalScores[leakPair.a] -= 0.5; personalScores[leakPair.b] += bailerScore;
            tribePhase4Score[t.name] -= 0.8;
            phases.paddleBack.push({
              type: 'utcCanoeLeak', phase: 'paddleBack', players: [leakPair.a, leakPair.b],
              text: leakTexts[_hash(leakPair.a + leakPair.b + 'leak', leakTexts.length)],
              personalScores: { [leakPair.a]: -0.5, [leakPair.b]: bailerScore }, badge: 'CANOE LEAK', badgeClass: 'red'
            });
            p4EventCount++;
          }
          break;
        }

        case 'motivational-speech': {
          const speechmaker = members.slice().sort((a, b) => {
            const sA = pStats(a), sB = pStats(b);
            return (sB.social * 0.04 + sB.boldness * 0.03) - (sA.social * 0.04 + sA.boldness * 0.03);
          })[0];
          if (!speechmaker) break;
          const prSM = pronouns(speechmaker);
          const speechTexts = [
            `${speechmaker} stands up in the canoe — briefly, dangerously — and screams something motivational. Somehow it works. The tribe's pace jumps.`,
            `${speechmaker}'s speech between strokes is short: 'We're doing this. Right now. Let's go.' The tribe goes.`,
            `${speechmaker} calls out cadence. Left, right, left, right. The tribe locks in. The canoes start moving as one.`,
          ];
          const sS = pStats(speechmaker);
          const speechBoost = sS.social * 0.04 + sS.boldness * 0.03;
          personalScores[speechmaker] += 1.5;
          members.filter(m => m !== speechmaker).forEach(m => personalScores[m] += 0.3);
          tribePhase4Score[t.name] += speechBoost * 5;
          phases.paddleBack.push({
            type: 'utcMotivational', phase: 'paddleBack', players: [speechmaker],
            text: speechTexts[_hash(speechmaker + 'speech', speechTexts.length)],
            personalScores: Object.fromEntries(members.map(m => [m, m === speechmaker ? 1.5 : 0.3])),
            badge: 'RALLY CRY', badgeClass: 'gold'
          });
          p4EventCount++;
          break;
        }

        case 'exhaustion': {
          const exhausted = members.slice().sort((a, b) => pStats(a).endurance - pStats(b).endurance)[0];
          if (!exhausted) break;
          const prEx = pronouns(exhausted);
          const exhTexts = [
            `${exhausted} hits the wall in the final stretch. ${prEx.Sub} ${prEx.sub === 'they' ? 'keep' : 'keeps'} paddling but the pace drops. The tribe absorbs the loss.`,
            `${exhausted}'s arms give out in the last kilometer. ${prEx.Sub} ${prEx.sub === 'they' ? 'switch' : 'switches'} to half-strokes. It costs the tribe.`,
            `${exhausted} was spent before the paddle back even started. Now it's showing. The canoe drifts left every time ${prEx.sub} ${prEx.sub === 'they' ? 'drop' : 'drops'} ${prEx.posAdj} paddle.`,
          ];
          personalScores[exhausted] -= 1.0; tribePhase4Score[t.name] -= 1.0;
          phases.paddleBack.push({
            type: 'utcExhaustion', phase: 'paddleBack', players: [exhausted],
            text: exhTexts[_hash(exhausted + 'exh', exhTexts.length)],
            personalScores: { [exhausted]: -1.0 }, badge: 'EXHAUSTED', badgeClass: 'red'
          });
          p4EventCount++;
          break;
        }

        case 'drafting': {
          const drafter = members.slice().sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
          if (!drafter) break;
          const prDr = pronouns(drafter);
          const draftTexts = [
            `${drafter} steers the canoe right behind the rival tribe's lead canoe. Riding their draft. They're gaining without the effort.`,
            `${drafter} notices the wake pocket from the tribe ahead and positions into it. Smart paddling. The rivals haven't caught on.`,
            `${drafter} drafts the rival canoe until they notice. The trash talk starts. The pace increases. This is good.`,
          ];
          personalScores[drafter] += 1.0; tribePhase4Score[t.name] += 0.8;
          phases.paddleBack.push({
            type: 'utcDrafting', phase: 'paddleBack', players: [drafter],
            text: draftTexts[_hash(drafter + 'draft', draftTexts.length)],
            personalScores: { [drafter]: 1.0 }, badge: 'DRAFTING', badgeClass: 'gold'
          });
          p4EventCount++;
          break;
        }

      } // end p4 switch
    }); // end p4 events

    // Check for photo finish (only vs other tribes, within 10% of score)
    // This runs after all events are generated, checked once per tribe pair
  }); // end tribes phase 4

  // Photo finish check (once, between top 2 tribes)
  // Normalize all phase scores by tribe size so smaller tribes aren't disadvantaged
  const _utcNorm = (score, tribeName) => score / Math.max(1, tribes.find(t_ => t_.name === tribeName)?.members.length || 1);
  const tribeScores = tribes.map(t => ({
    name: t.name,
    total: _utcNorm(tribePhase1Score[t.name], t.name) + _utcNorm(tribePhase2Score[t.name], t.name) + tribePhase3Score[t.name] + _utcNorm(tribePhase4Score[t.name], t.name)
    // Phase 3 (fire) NOT normalized — it's already fixed (best builder + bonus method, not per-member)
  })).sort((a, b) => b.total - a.total);

  if (tribeScores.length >= 2) {
    const top1 = tribeScores[0], top2 = tribeScores[1];
    const gap = Math.abs(top1.total - top2.total);
    const threshold = top1.total * 0.10;
    if (gap <= threshold) {
      // Photo finish! Random tiebreaker
      const winner = Math.random() < 0.5 ? top1 : top2;
      const loserPF = winner === top1 ? top2 : top1;
      // Small boost to the winner
      tribePhase4Score[winner.name] += 0.5;
      const t1Members = tribes.find(t => t.name === winner.name)?.members || [];
      const t2Members = tribes.find(t => t.name === loserPF.name)?.members || [];
      const allPFPlayers = [...t1Members, ...t2Members];
      phases.paddleBack.push({
        type: 'utcPhotoFinish', phase: 'paddleBack', players: allPFPlayers.slice(0, 3),
        text: `${winner.name} and ${loserPF.name} hit the beach almost simultaneously. Close enough that nobody can call it until the post arrives. ${winner.name} edges it. Barely.`,
        personalScores: {}, badge: 'PHOTO FINISH', badgeClass: ''
      });
    }
  }

  // ══ WINNER DETERMINATION ══
  // Normalized scores — same formula as photo finish check
  const finalScores = tribes.map(t => ({
    tribe: t,
    total: _utcNorm(tribePhase1Score[t.name], t.name) + _utcNorm(tribePhase2Score[t.name], t.name) + tribePhase3Score[t.name] + _utcNorm(tribePhase4Score[t.name], t.name)
  })).sort((a, b) => b.total - a.total);

  let winner = finalScores[0].tribe;
  let loser = finalScores[finalScores.length - 1].tribe;

  // Tiebreaker: fire score, then portage score
  if (finalScores.length >= 2 && finalScores[0].total === finalScores[1].total) {
    const tied = finalScores.filter(fs => fs.total === finalScores[0].total);
    const byFire = tied.slice().sort((a, b) => (fireScores[b.tribe.name] || 0) - (fireScores[a.tribe.name] || 0));
    winner = byFire[0].tribe;
  }
  if (finalScores.length >= 2 && finalScores[finalScores.length - 1].total === finalScores[finalScores.length - 2].total) {
    const tiedLast = finalScores.filter(fs => fs.total === finalScores[finalScores.length - 1].total);
    const byPortage = tiedLast.slice().sort((a, b) => tribePhase2Score[a.tribe.name] - tribePhase2Score[b.tribe.name]);
    loser = byPortage[0].tribe;
  }

  // ══ CAMP EVENTS: 2 positive + 1-2 negative per tribe ══
  tribes.forEach(t => {
    const members = t.members;
    const key = t.name;
    const usedPlayers = new Set();

    // Positive 1: MVP paddler (top personal score from this tribe)
    const mvp = members.slice().sort((a, b) => (personalScores[b] || 0) - (personalScores[a] || 0))[0];
    if (mvp) {
      const prMVP = pronouns(mvp);
      const mvpTexts = [
        `${mvp} was the engine of ${t.name}'s canoe race today. Strong paddle, calm head, no panic. The tribe noticed.`,
        `${mvp}'s performance out there gave the tribe something to build on. ${prMVP.Sub} was first in the water and last to tire.`,
        `${mvp} set the pace all day. Portage, paddles, fire — ${prMVP.sub} showed up everywhere it mattered.`,
      ];
      personalScores[mvp] += 0.5;
      members.filter(m => m !== mvp).forEach(m => addBond(m, mvp, 0.2));
      ep.campEvents[key].post.push({
        type: 'utcMVP', players: [mvp],
        text: mvpTexts[_hash(mvp + 'mvp', mvpTexts.length)],
        consequences: '+0.2 bond with all tribemates.',
        badgeText: 'MVP PADDLER', badgeClass: 'gold'
      });
      usedPlayers.add(mvp);
    }

    // Positive 2: Fire hero / swimmer hero / rescue moment
    let posHero = null;
    if (swimmerHero && members.includes(swimmerHero) && !usedPlayers.has(swimmerHero)) {
      posHero = swimmerHero;
    } else {
      // Rescue or shortcut finder
      const rescueEvent = phases.portage.find(e => (e.type === 'utcQuicksand' || e.type === 'utcFallsBehind') && e.players && e.players.some(p => members.includes(p) && !usedPlayers.has(p)));
      if (rescueEvent) {
        // The rescuer is the second player in quicksand (rescuer) or helper in falls behind
        const heroName = rescueEvent.players.find(p => members.includes(p) && !usedPlayers.has(p) && p !== rescueEvent.players[0]);
        if (heroName) posHero = heroName;
      }
    }
    if (posHero) {
      const prH2 = pronouns(posHero);
      const heroTexts = [
        `${posHero} proved something today. When the challenge got hard, ${prH2.sub} ${prH2.sub === 'they' ? 'were' : 'was'} the one who stepped up.`,
        `The tribe is talking about what ${posHero} did out there today. The kind of effort that doesn't get forgotten.`,
        `${posHero} put the tribe on ${prH2.posAdj} back when it mattered. Back at camp, the mood around ${prH2.obj} is warm.`,
      ];
      personalScores[posHero] += 0.5;
      members.filter(m => m !== posHero).forEach(m => addBond(m, posHero, 0.3));
      ep.campEvents[key].post.push({
        type: 'utcHeroMoment', players: [posHero],
        text: heroTexts[_hash(posHero + 'hero', heroTexts.length)],
        consequences: '+0.3 bond with all tribemates.',
        badgeText: 'HERO MOMENT', badgeClass: 'gold'
      });
      usedPlayers.add(posHero);
    }

    // Negative 1: Worst performer (lowest personal score)
    const worstPerformer = members.filter(m => !usedPlayers.has(m)).slice().sort((a, b) => (personalScores[a] || 0) - (personalScores[b] || 0))[0];
    if (worstPerformer) {
      const prW = pronouns(worstPerformer);
      const worstTexts = [
        `${worstPerformer} had a rough one today. Back at camp, ${prW.sub} ${prW.sub === 'they' ? 'keep' : 'keeps'} to ${prW.posAdj} corner. The tribe isn't piling on. But nobody's going out of their way either.`,
        `What ${worstPerformer} did — or didn't do — out there is being replayed in a few heads right now. Quietly.`,
        `${worstPerformer} wasn't the reason they lost. But ${prW.sub} ${prW.sub === 'they' ? 'weren\'t' : 'wasn\'t'} the reason they won either. That matters.`,
      ];
      members.filter(m => m !== worstPerformer).forEach(m => addBond(m, worstPerformer, -0.15));
      ep.campEvents[key].post.push({
        type: 'utcWeakLink', players: [worstPerformer],
        text: worstTexts[_hash(worstPerformer + 'weak', worstTexts.length)],
        consequences: '-0.15 bond with all tribemates.',
        badgeText: 'WEAK LINK', badgeClass: 'red'
      });
      usedPlayers.add(worstPerformer);
    }

    // Negative 2 (optional): Paddle burner or advice giver
    const paddleBurner = phases.buildFire.find(e => e.type === 'utcPaddleBurn' && e.players && e.players.some(p => members.includes(p) && !usedPlayers.has(p)));
    const adviceGiver = phases.buildFire.find(e => e.type === 'utcAdviceGiver' && e.players && e.players.some(p => members.includes(p) && !usedPlayers.has(p)));

    if (paddleBurner) {
      const burner = paddleBurner.players.find(p => members.includes(p) && !usedPlayers.has(p));
      if (burner) {
        const prBurn = pronouns(burner);
        const burnTexts = [
          `${burner}'s decision to burn the paddles is all anyone is talking about. The defense — 'the fire needed it' — is not landing.`,
          `${burner} burned the paddles. The tribe made it home. But 'we survived it' is a low bar and everyone knows it.`,
          `${prBurn.Sub} thought it was tactical. The tribe thought it was reckless. These are not compatible assessments.`,
        ];
        members.filter(m => m !== burner).forEach(m => addBond(m, burner, -0.3));
        ep.campEvents[key].post.push({
          type: 'utcPaddleBurnFallout', players: [burner],
          text: burnTexts[_hash(burner + 'burnfall', burnTexts.length)],
          consequences: '-0.3 bond with all tribemates.',
          badgeText: 'PADDLE BURN FALLOUT', badgeClass: 'red'
        });
        usedPlayers.add(burner);
      }
    } else if (adviceGiver) {
      const giver = adviceGiver.players.find(p => members.includes(p) && !usedPlayers.has(p));
      if (giver) {
        const prGiv = pronouns(giver);
        const giveTexts = [
          `${giver} helped the other tribe. The tribe has not forgotten this. Back at camp, it's unspoken but present — a cold current under everything.`,
          `${prGiv.Sub} helped the enemy. Some are charitable: 'just being friendly.' Others are not: 'we almost lost.' The divide is forming.`,
          `${giver}'s helpfulness is the topic of conversation after dark. Nobody is saying 'vote ${prGiv.obj} out.' But nobody is saying the opposite either.`,
        ];
        members.filter(m => m !== giver).forEach(m => addBond(m, giver, -0.4));
        ep.campEvents[key].post.push({
          type: 'utcAdviceGiverFallout', players: [giver],
          text: giveTexts[_hash(giver + 'advgfall', giveTexts.length)],
          consequences: '-0.4 bond with all tribemates.',
          badgeText: 'HELPED THE ENEMY', badgeClass: 'red'
        });
        usedPlayers.add(giver);
      }
    }
  });

  // ══ STORE EPISODE DATA ══
  ep.upTheCreek = {
    canoePairs,
    soloCanoe,
    phases,
    fireScores,
    paddlesBurned,
    swimmerHero,
    winner: winner.name,
    loser: loser.name,
    tribeScores: Object.fromEntries(finalScores.map(fs => [fs.tribe.name, fs.total]))
  };
  ep.winner = winner;
  ep.loser = loser;
  ep.challengeType = 'tribe';
  ep.tribalPlayers = [...loser.members];
  ep.challengeLabel = 'Up the Creek';
  ep.challengeCategory = 'physical';
  ep.chalMemberScores = personalScores;

  updateChalRecord(ep);
}

export function _textUpTheCreek(ep, ln, sec) {
  if (!ep.isUpTheCreek || !ep.upTheCreek) return;
  const utc = ep.upTheCreek;
  sec('UP THE CREEK');
  ln('Canoe race to Boney Island and back.');
  if (utc.canoePairs) {
    Object.entries(utc.canoePairs).forEach(([tribe, pairs]) => {
      ln(`${tribe} canoe pairs:`);
      pairs.forEach(p => ln(`  ${p.a} + ${p.b} (${p.scenario})`));
      if (utc.soloCanoe?.[tribe]) ln(`  ${utc.soloCanoe[tribe]} — solo canoe`);
    });
  }
  ['partnerSelection', 'paddleOut', 'portage', 'buildFire', 'paddleBack'].forEach(phase => {
    const events = utc.phases?.[phase] || [];
    if (!events.length) return;
    const labels = { partnerSelection: 'PARTNERS', paddleOut: 'PADDLE OUT', portage: 'PORTAGE', buildFire: 'BUILD FIRE', paddleBack: 'PADDLE BACK' };
    ln('');
    ln(`── ${labels[phase] || phase} ──`);
    events.forEach(evt => {
      const scores = Object.entries(evt.personalScores || {}).map(([n, d]) => `${n}:${d > 0 ? '+' : ''}${d.toFixed(1)}`).join(', ');
      ln(`  [${evt.badge || evt.type}] ${evt.text}${scores ? ` (${scores})` : ''}`);
    });
  });
  if (utc.paddlesBurned) Object.entries(utc.paddlesBurned).forEach(([t, burned]) => { if (burned) ln(`${t}: PADDLES BURNED`); });
  if (utc.swimmerHero) ln(`SWIMMER HERO: ${utc.swimmerHero}`);
  ln(`Winner: ${utc.winner}. ${utc.loser} goes to tribal.`);
}

export function rpBuildUpTheCreek(ep) {
  const utc = ep.upTheCreek;
  if (!utc?.phases) return null;

  const stateKey = `utc_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // 5 reveals: partner selection + 4 phases
  const PHASES = [
    { key: 'partnerSelection', label: '🛶 PARTNER SELECTION', icon: '🌊', accent: '#58a6ff', atmos: 'water' },
    { key: 'paddleOut',        label: '🌊 PADDLE OUT',         icon: '🌊', accent: '#58a6ff', atmos: 'water' },
    { key: 'portage',          label: '🌿 PORTAGE',            icon: '💀', accent: '#3fb950', atmos: 'jungle' },
    { key: 'buildFire',        label: '🔥 BUILD FIRE',         icon: '🔥', accent: '#f0a500', atmos: 'fire' },
    { key: 'paddleBack',       label: '🌅 PADDLE BACK',        icon: '🌅', accent: '#e06030', atmos: 'sunset' },
  ];
  const totalPhases = PHASES.length;
  const allRevealed = state.idx >= totalPhases - 1;

  const _utcReveal = (targetIdx) =>
    `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};` +
    `_tvState['${stateKey}'].idx=${targetIdx};` +
    `const ep=gs.episodeHistory.find(e=>e.num===${ep.num});` +
    `if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  const _bc = (cls) => cls === 'gold' ? '#f0a500' : cls === 'red' ? '#f85149' : cls === 'blue' ? '#58a6ff' : cls === 'pink' ? '#db61a2' : '#8b949e';

  const _scoreDelta = (scores) => {
    if (!scores || !Object.keys(scores).length) return '';
    return Object.entries(scores).map(([n, d]) => {
      const sign = d >= 0 ? '+' : '';
      const col = d >= 0 ? '#3fb950' : '#f85149';
      return `<span style="font-size:9px;font-weight:700;color:${col};margin-right:4px">${n}: ${sign}${d.toFixed(1)}</span>`;
    }).join('');
  };

  // Atmosphere backgrounds keyed by atmos type
  const _atmosBg = {
    water:  'linear-gradient(180deg,#0a1a30 0%,#0d2545 30%,#0a1a30 70%,#061220 100%)',
    jungle: 'linear-gradient(180deg,#050f05 0%,#0a1a0a 20%,#081508 50%,#0a0808 80%,#0d0508 100%)',
    fire:   'radial-gradient(ellipse at 50% 70%,rgba(240,165,0,0.12) 0%,transparent 50%),linear-gradient(180deg,#1a0f05 0%,#0d0805 50%,#0a0505 100%)',
    sunset: 'linear-gradient(180deg,#1a0a2a 0%,#2a1030 15%,#4a1520 35%,#6a2010 50%,#3a1808 70%,#0d0815 100%)',
  };

  const ambientPhaseIdx = Math.max(0, Math.min(state.idx < 0 ? 0 : state.idx, totalPhases - 1));
  const ambientAtmos = PHASES[ambientPhaseIdx].atmos;
  const ambientAccent = PHASES[ambientPhaseIdx].accent;
  const ambientBg = _atmosBg[ambientAtmos];

  // Helper: group events by tribe
  const _groupByTribe = (events) => {
    const groups = {};
    const tribeOrder = (ep.tribesAtStart || []).map(t => t.name);
    events.forEach(evt => {
      const firstPlayer = evt.players?.[0];
      let evtTribe = 'general';
      if (firstPlayer) {
        for (const t of (ep.tribesAtStart || [])) {
          if (t.members?.includes(firstPlayer)) { evtTribe = t.name; break; }
        }
      }
      if (!groups[evtTribe]) groups[evtTribe] = [];
      groups[evtTribe].push(evt);
    });
    return { groups, renderOrder: [...tribeOrder.filter(t => groups[t]), ...(groups.general ? ['general'] : [])] };
  };

  // Helper: render a tribe sub-header
  const _tribeSubHeader = (tribeName) => {
    const tc = tribeColor(tribeName);
    return `<div style="font-family:var(--font-display);font-size:12px;letter-spacing:1px;color:${tc};margin:12px 0 6px;padding-bottom:4px;border-bottom:1px solid ${tc}22">${tribeName.toUpperCase()}</div>`;
  };

  // Helper: render a generic event card with phase-aware glow
  const _eventCard = (evt, phaseAccent, overrides = {}) => {
    const bc = overrides.bc || _bc(evt.badgeClass || '');
    const accent = overrides.forceAccent ? bc : phaseAccent;
    const players = evt.players || [];
    const isSpecial = overrides.special;
    const borderStyle = isSpecial
      ? `2px solid ${bc}55`
      : `1px solid ${accent}20`;
    const bgStyle = isSpecial
      ? `${bc}09`
      : `linear-gradient(135deg,${accent}07 0%,transparent 60%)`;
    const glowStyle = isSpecial
      ? `0 0 20px ${bc}12`
      : `0 0 15px ${accent}08`;
    return `<div style="padding:${isSpecial ? '14px' : '10px 14px'};margin-bottom:${isSpecial ? '10px' : '6px'};border-radius:${isSpecial ? '10px' : '8px'};border:${borderStyle};background:${bgStyle};box-shadow:${glowStyle};animation:scrollDrop 0.3s var(--ease-broadcast) both">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        ${players.map(p => rpPortrait(p, 'sm')).join('')}
        <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${bc};background:${bc}18;padding:2px 8px;border-radius:3px;${isSpecial ? 'letter-spacing:1.5px;' : ''}">${evt.badge || evt.type || ''}</span>
        ${_scoreDelta(evt.personalScores) ? `<div style="margin-left:auto">${_scoreDelta(evt.personalScores)}</div>` : ''}
      </div>
      <div style="font-size:12px;color:${isSpecial ? '#cdd9e5' : '#8b949e'};line-height:1.5">${evt.text || ''}</div>
    </div>`;
  };

  // ── Keyframes + inline styles ──
  let html = `<style>
    @keyframes utcWaveShimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
    @keyframes utcEmberFloat{0%{transform:translateY(0) scale(1);opacity:0.8}100%{transform:translateY(-40px) scale(0.3);opacity:0}}
    @keyframes utcFogPulse{0%,100%{opacity:0.15}50%{opacity:0.35}}
    @keyframes utcFireGlow{0%,100%{box-shadow:0 0 30px rgba(240,165,0,0.2),0 0 60px rgba(240,130,0,0.1)}50%{box-shadow:0 0 50px rgba(240,165,0,0.4),0 0 100px rgba(240,130,0,0.2)}}
    @keyframes utcLightningFlash{0%,90%,100%{opacity:0}92%,96%{opacity:0.3}}
    @keyframes utcGoldPulse{0%,100%{box-shadow:0 0 20px rgba(240,165,0,0.25),0 0 40px rgba(240,165,0,0.1)}50%{box-shadow:0 0 40px rgba(240,165,0,0.5),0 0 80px rgba(240,165,0,0.25)}}
    @keyframes utcSunsetShimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
  </style>`;

  // ── Page wrapper ──
  html += `<div class="rp-page" style="position:relative;background:${ambientBg};transition:background 1s ease;overflow:hidden">`;

  // ── Atmosphere overlays (water shimmer, fog, embers, sunset shimmer) ──
  if (ambientAtmos === 'water' || ambientAtmos === 'sunset') {
    const shimmerColor = ambientAtmos === 'water' ? 'rgba(88,166,255,0.06)' : 'rgba(224,96,48,0.04)';
    const shimmerDur = ambientAtmos === 'water' ? '4s' : '3s';
    html += `<div style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;
      background:linear-gradient(90deg,transparent,${shimmerColor},transparent);
      background-size:200% 100%;animation:utcWaveShimmer ${shimmerDur} ease-in-out infinite"></div>`;
    // Wave bar at bottom
    html += `<div style="position:absolute;bottom:0;left:0;right:0;height:40px;pointer-events:none;z-index:0;
      background:repeating-linear-gradient(100deg,transparent,transparent 20px,${ambientAtmos === 'water' ? 'rgba(88,166,255,0.08)' : 'rgba(224,96,48,0.06)'} 20px,${ambientAtmos === 'water' ? 'rgba(88,166,255,0.08)' : 'rgba(224,96,48,0.06)'} 22px)"></div>`;
  }
  if (ambientAtmos === 'jungle') {
    // Canopy overlay
    html += `<div style="position:absolute;top:0;left:0;right:0;height:120px;pointer-events:none;z-index:0;
      background:linear-gradient(180deg,rgba(10,40,10,0.8) 0%,transparent 100%)"></div>`;
    // Fog pulse
    html += `<div style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;
      background:radial-gradient(ellipse at 50% 60%,rgba(200,200,200,0.12) 0%,transparent 60%);
      animation:utcFogPulse 6s ease-in-out infinite"></div>`;
    // Skull corners
    html += `<div style="position:absolute;top:12px;left:12px;font-size:32px;opacity:0.06;pointer-events:none;z-index:0;user-select:none">💀</div>`;
    html += `<div style="position:absolute;top:12px;right:12px;font-size:32px;opacity:0.06;pointer-events:none;z-index:0;user-select:none">💀</div>`;
  }
  if (ambientAtmos === 'fire') {
    // Ember particles — 8 staggered
    const emberPositions = [8,18,30,42,55,67,78,90];
    const emberDelays = [0,0.7,1.4,0.3,1.1,0.5,1.8,0.9];
    emberPositions.forEach((left, i) => {
      html += `<div style="position:absolute;bottom:20px;left:${left}%;width:3px;height:3px;border-radius:50%;background:#f0a500;pointer-events:none;z-index:0;
        animation:utcEmberFloat ${1.8 + (i % 3) * 0.4}s ease-out ${emberDelays[i]}s infinite"></div>`;
    });
  }

  // ── Content wrapper (above overlays) ──
  html += `<div style="position:relative;z-index:1">`;

  // ── Page header ──
  html += `<div class="rp-eyebrow">Episode ${ep.num}</div>
  <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:${ambientAccent};text-shadow:0 0 20px ${ambientAccent}44;margin-bottom:6px">UP THE CREEK</div>
  <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:4px">Canoe race to Boney Island and back. Pick your partner. Portage through danger.</div>
  <div style="text-align:center;font-size:11px;color:#6e7681;margin-bottom:20px">Build a fire. Race home. The losing tribe faces tribal council.</div>`;

  // ── Phase reveals ──
  PHASES.forEach((phase, phaseIdx) => {
    const isVisible = phaseIdx <= state.idx;
    const isActive = phaseIdx === state.idx;
    const phaseAtmosBg = _atmosBg[phase.atmos];

    if (!isVisible) {
      html += `<div style="padding:12px;margin-bottom:8px;border:1px solid rgba(255,255,255,0.06);border-radius:8px;opacity:0.12;text-align:center;font-size:11px;color:var(--muted)">${phase.label}</div>`;
      return;
    }

    // Phase atmosphere wrapper
    html += `<div style="position:relative;margin-bottom:20px;border-radius:12px;overflow:hidden;animation:scrollDrop 0.3s var(--ease-broadcast) both;${phase.atmos === 'fire' ? 'animation:utcFireGlow 3s ease-in-out infinite;' : ''}">`;

    // Phase background tint layer
    html += `<div style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;background:${phaseAtmosBg};opacity:0.5"></div>`;

    // Lightning flash for jungle cursed idol events
    if (phase.atmos === 'jungle') {
      html += `<div style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;background:rgba(180,120,255,0.15);animation:utcLightningFlash 8s ease-in-out infinite"></div>`;
    }

    // Phase content (above tint)
    html += `<div style="position:relative;z-index:1;padding:14px">`;

    // Phase header bar
    const phaseDecoEmoji = phase.atmos === 'water' ? '🌊' : phase.atmos === 'jungle' ? '🦫💀' : phase.atmos === 'fire' ? '🔥' : '🌅';
    html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:10px 14px;border-radius:8px;
      background:${phase.accent}14;border-left:3px solid ${phase.accent};
      box-shadow:0 0 20px ${phase.accent}12">
      <span style="font-family:var(--font-display);font-size:14px;letter-spacing:1.5px;color:${phase.accent}">${phase.label}</span>
      <span style="font-size:18px;opacity:0.7">${phaseDecoEmoji}</span>
    </div>
    <div style="height:2px;border-radius:1px;background:linear-gradient(90deg,${phase.accent}44,transparent);margin-bottom:14px"></div>`;

    // ── Partner Selection ──
    if (phase.key === 'partnerSelection') {
      html += `<div style="font-size:12px;color:#cdd9e5;text-align:center;margin-bottom:16px;font-style:italic">Teams pick their canoe partners — bold players choose first. Chemistry matters on the water.</div>`;

      const tribeOrder = (ep.tribesAtStart || []).map(t => t.name);
      const tribesToRender = tribeOrder.length ? tribeOrder : Object.keys(utc.canoePairs || {});

      tribesToRender.forEach(tribeName => {
        const tc = tribeColor(tribeName);
        const pairs = utc.canoePairs?.[tribeName] || [];
        const solo = utc.soloCanoe?.[tribeName];
        if (!pairs.length && !solo) return;

        html += `<div style="margin-bottom:16px">
          <div style="font-family:var(--font-display);font-size:12px;letter-spacing:1px;color:${tc};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid ${tc}22">${tribeName.toUpperCase()}</div>`;

        pairs.forEach(pair => {
          const scenarioBadgeText = pair.scenario === 'mutual'     ? 'MUTUAL PICK'
            : pair.scenario === 'one-sided' ? 'ONE-SIDED'
            : pair.scenario === 'rejected'  ? 'REJECTED'
            : pair.scenario === 'showmance' ? '💕 SHOWMANCE'
            : pair.scenario === 'rivals'    ? 'RIVALS'
            : pair.scenario === 'last-pick' ? 'LAST PICK'
            : 'PARTNERS';
          const scenarioBadgeCol = pair.scenario === 'rejected' || pair.scenario === 'rivals' ? '#f85149'
            : pair.scenario === 'showmance' ? '#db61a2'
            : pair.scenario === 'one-sided' ? '#f0a500'
            : '#58a6ff';
          const isRivals = pair.scenario === 'rejected' || pair.scenario === 'rivals';
          const isShowmance = pair.scenario === 'showmance';

          const chemSign = (pair.chemistry || 0) >= 0 ? '+' : '';
          const chemCol = (pair.chemistry || 0) >= 1 ? '#3fb950' : (pair.chemistry || 0) >= 0 ? '#8b949e' : '#f85149';

          // Water reflection portrait helper
          const _reflectedPortrait = (name) => {
            const base = rpPortrait(name, 'sm');
            return `<div style="position:relative;display:inline-block">
              ${base}
              <div style="position:absolute;top:100%;left:0;right:0;height:18px;overflow:hidden;transform:scaleY(-1);opacity:0.15;pointer-events:none">
                ${base}
              </div>
              <div style="position:absolute;top:100%;left:0;right:0;height:18px;background:linear-gradient(180deg,transparent,rgba(10,26,48,0.8));pointer-events:none"></div>
            </div>`;
          };

          html += `<div style="padding:12px;margin-bottom:8px;border-radius:10px;
            border:1px solid ${scenarioBadgeCol}${isRivals ? '44' : '28'};
            background:linear-gradient(135deg,${scenarioBadgeCol}09 0%,transparent 60%);
            box-shadow:0 0 ${isRivals ? '20px' : '15px'} ${scenarioBadgeCol}${isRivals ? '14' : '08'};
            animation:scrollDrop 0.3s var(--ease-broadcast) both">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
              ${_reflectedPortrait(pair.a)}
              <span style="font-size:14px;color:#6e7681">+</span>
              ${_reflectedPortrait(pair.b)}
              ${isShowmance ? '<span style="font-size:16px;margin:0 2px">💕</span>' : ''}
              <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${scenarioBadgeCol};background:${scenarioBadgeCol}18;padding:2px 8px;border-radius:3px;margin-left:auto">${scenarioBadgeText}</span>
              <span style="font-size:10px;color:${chemCol};font-weight:700">${chemSign}${(pair.chemistry || 0).toFixed(1)}</span>
            </div>
            ${pair.reactionText ? `<div style="font-size:12px;color:#8b949e;line-height:1.5;font-style:italic">${pair.reactionText}</div>` : ''}
          </div>`;
        });

        // Solo canoe player — dramatic red card
        if (solo) {
          html += `<div style="padding:14px;margin-bottom:8px;border-radius:10px;
            border:2px solid rgba(248,81,73,0.35);
            background:linear-gradient(135deg,rgba(248,81,73,0.08) 0%,transparent 60%);
            box-shadow:0 0 20px rgba(248,81,73,0.1);
            animation:scrollDrop 0.3s var(--ease-broadcast) both">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
              ${rpPortrait(solo, 'sm')}
              <span style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#f85149;background:rgba(248,81,73,0.18);padding:3px 10px;border-radius:3px">SOLO CANOE</span>
            </div>
            <div style="font-size:12px;color:#8b949e;line-height:1.5">${solo} paddles alone. No partner to share the load — or the blame.</div>
          </div>`;
        }

        html += `</div>`;
      });

      // partnerSelection events
      const psEvents = utc.phases?.partnerSelection || [];
      if (psEvents.length) {
        psEvents.forEach(evt => {
          html += _eventCard(evt, phase.accent);
        });
      }
    }

    // ── Build Fire ──
    else if (phase.key === 'buildFire') {
      const events = utc.phases?.buildFire || [];
      const { groups, renderOrder } = _groupByTribe(events);

      renderOrder.forEach(tribeName => {
        const tribeEvents = groups[tribeName] || [];
        if (!tribeEvents.length) return;
        if (tribeName !== 'general') html += _tribeSubHeader(tribeName);

        tribeEvents.forEach(evt => {
          const isPaddleBurn = evt.type === 'utcPaddleBurn';
          const isAdvice = evt.type === 'utcAdviceGiver';

          if (isPaddleBurn) {
            html += `<div style="padding:14px;margin-bottom:10px;border-radius:10px;
              border:2px solid rgba(248,81,73,0.5);
              background:linear-gradient(135deg,rgba(248,81,73,0.1) 0%,rgba(240,120,0,0.05) 100%);
              box-shadow:0 0 25px rgba(248,81,73,0.15);
              animation:scrollDrop 0.3s var(--ease-broadcast) both">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                ${(evt.players || []).map(p => rpPortrait(p, 'sm')).join('')}
                <span style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#f85149;background:rgba(248,81,73,0.18);padding:3px 10px;border-radius:3px">🔥 PADDLES BURNED</span>
              </div>
              <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${evt.text}</div>
              ${_scoreDelta(evt.personalScores) ? `<div style="margin-top:6px">${_scoreDelta(evt.personalScores)}</div>` : ''}
            </div>`;
          } else if (isAdvice) {
            html += `<div style="padding:14px;margin-bottom:8px;border-radius:10px;
              border:2px solid rgba(248,81,73,0.3);
              background:linear-gradient(135deg,rgba(248,81,73,0.07) 0%,transparent 60%);
              box-shadow:0 0 15px rgba(248,81,73,0.08);
              animation:scrollDrop 0.3s var(--ease-broadcast) both">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                ${(evt.players || []).map(p => rpPortrait(p, 'sm')).join('')}
                <span style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#f85149;background:rgba(248,81,73,0.18);padding:3px 10px;border-radius:3px">HELPED THE ENEMY</span>
              </div>
              <div style="font-size:12px;color:#8b949e;line-height:1.5">${evt.text}</div>
              ${_scoreDelta(evt.personalScores) ? `<div style="margin-top:6px">${_scoreDelta(evt.personalScores)}</div>` : ''}
            </div>`;
          } else {
            html += _eventCard(evt, phase.accent);
          }
        });
      });

      // Fire scores per tribe
      if (utc.fireScores && Object.keys(utc.fireScores).length) {
        const fireEntries = Object.entries(utc.fireScores);
        const maxFire = Math.max(...fireEntries.map(([,v]) => v), 1);
        html += `<div style="margin-top:14px;padding:14px;border-radius:10px;
          border:1px solid rgba(240,165,0,0.25);
          background:linear-gradient(135deg,rgba(240,165,0,0.06) 0%,transparent 60%);
          box-shadow:0 0 20px rgba(240,165,0,0.08);animation:utcFireGlow 3s ease-in-out infinite">
          <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#f0a500;margin-bottom:10px">🔥 FIRE SCORES</div>`;
        fireEntries.sort((a,b) => b[1] - a[1]).forEach(([tribe, score]) => {
          const tc = tribeColor(tribe);
          const pct = Math.round((score / maxFire) * 100);
          const burned = utc.paddlesBurned?.[tribe];
          html += `<div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-size:11px;font-weight:700;color:${tc}">${tribe}${burned ? ' 🔥' : ''}</span>
              <div style="display:flex;align-items:center;gap:6px">
                ${burned ? '<span style="font-size:8px;font-weight:700;color:#f85149;background:rgba(248,81,73,0.15);padding:1px 6px;border-radius:3px">PADDLES BURNED</span>' : ''}
                <span style="font-size:11px;color:#8b949e">${score.toFixed(1)}</span>
              </div>
            </div>
            <div style="height:7px;border-radius:4px;background:rgba(255,255,255,0.06)">
              <div style="height:7px;border-radius:4px;background:${burned ? 'linear-gradient(90deg,#f85149,#c0392b)' : `linear-gradient(90deg,${tc},${tc}99)`};width:${pct}%;transition:width 0.6s ease;box-shadow:0 0 8px ${burned ? 'rgba(248,81,73,0.4)' : tc + '44'}"></div>
            </div>
          </div>`;
        });
        html += `</div>`;
      }
    }

    // ── Paddle Back ──
    else if (phase.key === 'paddleBack') {
      const events = utc.phases?.paddleBack || [];

      // Swimmer hero — dramatic hero card
      if (utc.swimmerHero) {
        const pr = pronouns(utc.swimmerHero);
        html += `<div style="padding:18px;margin-bottom:16px;border-radius:12px;
          border:2px solid rgba(88,166,255,0.4);
          background:linear-gradient(135deg,rgba(88,166,255,0.1) 0%,rgba(88,166,255,0.03) 100%);
          box-shadow:0 0 30px rgba(88,166,255,0.15);
          animation:scrollDrop 0.3s var(--ease-broadcast) both">
          <div style="text-align:center;font-size:9px;font-weight:700;letter-spacing:2px;color:#58a6ff;margin-bottom:10px">🌊 SWIMMER HERO</div>
          <div style="display:flex;align-items:center;gap:14px;justify-content:center">
            ${rpPortrait(utc.swimmerHero, 'md')}
            <div>
              <div style="font-size:17px;font-weight:700;color:#58a6ff;margin-bottom:5px">${utc.swimmerHero}</div>
              <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${pr.Sub} can't paddle — the paddles are ash. So ${pr.sub} does the next best thing: ${pr.sub} jumps in and pushes the canoe home.</div>
            </div>
          </div>
        </div>`;
      }

      const { groups, renderOrder } = _groupByTribe(events);
      renderOrder.forEach(tribeName => {
        const tribeEvents = groups[tribeName] || [];
        if (!tribeEvents.length) return;
        if (tribeName !== 'general') html += _tribeSubHeader(tribeName);

        tribeEvents.forEach(evt => {
          const isPhotoFinish = evt.type === 'utcPhotoFinish' || (evt.badge || '').includes('PHOTO FINISH');
          const isQuicksand = evt.type === 'utcQuicksand' || (evt.badge || '').toUpperCase().includes('QUICKSAND');
          const bc = _bc(evt.badgeClass || '');

          if (isPhotoFinish) {
            html += `<div style="padding:14px;margin-bottom:10px;border-radius:10px;
              border:2px solid transparent;
              background:linear-gradient(135deg,rgba(240,96,48,0.1) 0%,rgba(240,165,0,0.08) 100%);
              box-shadow:0 0 25px rgba(240,96,48,0.2),0 0 8px rgba(240,165,0,0.1);
              outline:2px solid transparent;
              animation:scrollDrop 0.3s var(--ease-broadcast) both;
              border-image:linear-gradient(135deg,#e06030,#f0a500) 1">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                ${(evt.players || []).map(p => rpPortrait(p, 'sm')).join('')}
                <span style="font-size:9px;font-weight:700;letter-spacing:1.5px;background:linear-gradient(135deg,#e06030,#f0a500);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;border:1px solid #e0603044;padding:2px 10px;border-radius:3px">${evt.badge || '📸 PHOTO FINISH'}</span>
              </div>
              <div style="font-size:12px;color:#cdd9e5;line-height:1.5">${evt.text}</div>
              ${_scoreDelta(evt.personalScores) ? `<div style="margin-top:6px">${_scoreDelta(evt.personalScores)}</div>` : ''}
            </div>`;
          } else if (isQuicksand) {
            html += `<div style="padding:12px 14px;margin-bottom:8px;border-radius:8px;
              border:1px solid rgba(139,100,60,0.4);
              background:linear-gradient(135deg,rgba(100,70,30,0.12) 0%,rgba(80,50,20,0.06) 100%);
              box-shadow:0 0 15px rgba(100,70,30,0.1);
              animation:scrollDrop 0.3s var(--ease-broadcast) both">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                ${(evt.players || []).map(p => rpPortrait(p, 'sm')).join('')}
                <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#8b6040;background:rgba(139,96,64,0.2);padding:2px 8px;border-radius:3px">${evt.badge || 'QUICKSAND'}</span>
                ${_scoreDelta(evt.personalScores) ? `<div style="margin-left:auto">${_scoreDelta(evt.personalScores)}</div>` : ''}
              </div>
              <div style="font-size:12px;color:#8b949e;line-height:1.5">${evt.text}</div>
            </div>`;
          } else {
            html += _eventCard(evt, phase.accent);
          }
        });
      });
    }

    // ── Generic phases: paddleOut, portage ──
    else {
      const events = utc.phases?.[phase.key] || [];
      if (!events.length) {
        html += `<div style="font-size:11px;color:#6e7681;text-align:center;padding:10px">No events this phase.</div>`;
      }

      const { groups, renderOrder } = _groupByTribe(events);
      renderOrder.forEach(tribeName => {
        const tribeEvents = groups[tribeName] || [];
        if (!tribeEvents.length) return;
        if (tribeName !== 'general') html += _tribeSubHeader(tribeName);

        tribeEvents.forEach(evt => {
          const bc = _bc(evt.badgeClass || '');
          // Special treatments for portage danger events
          const isDanger = phase.key === 'portage' && (
            (evt.type || '').toLowerCase().includes('beaver') ||
            (evt.type || '').toLowerCase().includes('geese') ||
            (evt.badge || '').toLowerCase().includes('beaver') ||
            (evt.badge || '').toLowerCase().includes('geese')
          );
          const isCursed = phase.key === 'portage' && (
            (evt.type || '').toLowerCase().includes('cursed') ||
            (evt.badge || '').toLowerCase().includes('cursed')
          );

          if (isDanger) {
            html += `<div style="padding:12px 14px;margin-bottom:8px;border-radius:8px;
              border:2px solid rgba(248,81,73,0.4);
              background:linear-gradient(135deg,rgba(248,81,73,0.09) 0%,transparent 60%);
              box-shadow:0 0 15px rgba(248,81,73,0.12),0 0 0 1px rgba(248,81,73,0.08);
              animation:scrollDrop 0.3s var(--ease-broadcast) both">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                ${(evt.players || []).map(p => rpPortrait(p, 'sm')).join('')}
                <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f85149;background:rgba(248,81,73,0.18);padding:2px 8px;border-radius:3px">${evt.badge || evt.type}</span>
                ${_scoreDelta(evt.personalScores) ? `<div style="margin-left:auto">${_scoreDelta(evt.personalScores)}</div>` : ''}
              </div>
              <div style="font-size:12px;color:#8b949e;line-height:1.5">${evt.text}</div>
            </div>`;
          } else if (isCursed) {
            const cursedTaken = !(evt.badge || '').toLowerCase().includes('left') && !(evt.text || '').toLowerCase().includes('left behind');
            html += `<div style="padding:12px 14px;margin-bottom:8px;border-radius:8px;
              border:2px solid ${cursedTaken ? 'rgba(180,80,255,0.4)' : 'rgba(63,185,80,0.35)'};
              background:${cursedTaken ? 'linear-gradient(135deg,rgba(120,50,200,0.1) 0%,rgba(80,20,150,0.05) 100%)' : 'linear-gradient(135deg,rgba(63,185,80,0.08) 0%,transparent 60%)'};
              box-shadow:0 0 18px ${cursedTaken ? 'rgba(180,80,255,0.12)' : 'rgba(63,185,80,0.1)'};
              animation:scrollDrop 0.3s var(--ease-broadcast) both">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                ${(evt.players || []).map(p => rpPortrait(p, 'sm')).join('')}
                ${cursedTaken ? '<span style="font-size:14px">💀</span>' : ''}
                <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${cursedTaken ? '#b450ff' : '#3fb950'};background:${cursedTaken ? 'rgba(180,80,255,0.15)' : 'rgba(63,185,80,0.15)'};padding:2px 8px;border-radius:3px">${evt.badge || evt.type}</span>
                ${_scoreDelta(evt.personalScores) ? `<div style="margin-left:auto">${_scoreDelta(evt.personalScores)}</div>` : ''}
              </div>
              <div style="font-size:12px;color:#8b949e;line-height:1.5">${evt.text}</div>
            </div>`;
          } else {
            html += _eventCard(evt, phase.accent);
          }
        });
      });
    }

    html += `</div></div>`; // close phase content + atmosphere wrapper
  });

  // ── Final result card (only after all phases revealed) ──
  if (allRevealed && utc.winner) {
    const winnerColor = tribeColor(utc.winner);
    const loserColor = utc.loser ? tribeColor(utc.loser) : '#f85149';

    html += `<div style="padding:20px;margin-top:8px;border-radius:14px;
      border:2px solid ${winnerColor}55;
      background:linear-gradient(135deg,${winnerColor}0d 0%,transparent 60%);
      box-shadow:0 0 40px ${winnerColor}20,0 0 80px ${winnerColor}0a;
      text-align:center;animation:utcGoldPulse 3s ease-in-out infinite">
      <div style="font-size:22px;margin-bottom:6px">🏆</div>
      <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;color:#f0a500;margin-bottom:8px;text-shadow:0 0 20px rgba(240,165,0,0.4)">IMMUNITY</div>
      <div style="font-size:20px;font-weight:700;color:${winnerColor};margin-bottom:4px;text-shadow:0 0 15px ${winnerColor}55">${utc.winner}</div>
      <div style="font-size:11px;color:#8b949e">First tribe to paddle home wins.</div>
    </div>`;

    if (utc.loser) {
      html += `<div style="padding:14px;margin-top:8px;border-radius:10px;
        border:1px solid rgba(248,81,73,0.3);
        background:linear-gradient(135deg,rgba(248,81,73,0.06) 0%,transparent 60%);
        text-align:center">
        <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#f85149;margin-bottom:5px">TRIBAL COUNCIL</div>
        <div style="font-size:16px;font-weight:700;color:${loserColor}">${utc.loser}</div>
      </div>`;
    }

    // Swimmer hero shoutout in final result
    if (utc.swimmerHero) {
      html += `<div style="padding:12px;margin-top:8px;border-radius:8px;
        background:linear-gradient(135deg,rgba(88,166,255,0.08) 0%,transparent 60%);
        border:1px solid rgba(88,166,255,0.25);
        display:flex;align-items:center;gap:12px">
        ${rpPortrait(utc.swimmerHero, 'sm')}
        <div>
          <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#58a6ff">★ SWIMMER HERO</div>
          <div style="font-size:12px;color:#e6edf3;margin-top:2px">${utc.swimmerHero} swam the tribe home when the paddles were gone.</div>
        </div>
      </div>`;
    }
  }

  // ── Sticky NEXT / REVEAL ALL buttons ──
  if (!allRevealed) {
    const nextAccent = PHASES[Math.min(state.idx + 1, totalPhases - 1)].accent;
    html += `<div style="position:sticky;bottom:0;padding:14px 0;text-align:center;
      background:linear-gradient(transparent,rgba(6,18,32,0.97) 30%);z-index:5">
      <button class="rp-btn" style="background:linear-gradient(135deg,${nextAccent},${nextAccent}aa);color:#000;font-weight:700;border:none;padding:9px 22px;border-radius:6px;cursor:pointer;font-size:12px;letter-spacing:1px;box-shadow:0 0 16px ${nextAccent}33"
        onclick="${_utcReveal(state.idx + 1)}">NEXT (${state.idx + 2}/${totalPhases})</button>
      <button class="rp-btn rp-btn-secondary" onclick="${_utcReveal(totalPhases - 1)}" style="margin-left:8px">REVEAL ALL</button>
    </div>`;
  }

  html += `</div></div>`; // close content wrapper + page
  return html;
}

