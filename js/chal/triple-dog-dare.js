// js/chal/triple-dog-dare.js
import { DARE_CATEGORIES, DARE_POOL, gs, players } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { wRandom, computeHeat } from '../alliances.js';

export function simulateTripleDogDare(ep) {
  const activePlayers = [...gs.activePlayers];
  const eliminated = [...gs.eliminated];
  const maxRounds = 50; // safety cap only — fatigue + freebie economy should produce elimination well before this
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

  // State tracking — everyone starts with 0 freebies. Early rounds you accept because you have no choice.
  const freebies = {};
  activePlayers.forEach(p => freebies[p] = 0);
  const rounds = [];
  const freebieGifts = [];
  const pacts = [];       // { initiator, partner, target, formedRound }
  const betrayals = [];   // { player, target, type:'redirect'|'refusal', round }
  const completions = {}; // { playerName: count }
  activePlayers.forEach(p => completions[p] = 0);
  let eliminatedPlayer = null;
  let eliminatedRound = null;
  let eliminatedDare = null;

  // ── Helper: get alliance + pact partners ──
  const _getPactPartners = (player) => {
    const partners = new Set();
    (gs.namedAlliances || []).filter(a => a.active && a.members.includes(player))
      .forEach(a => a.members.forEach(m => { if (m !== player) partners.add(m); }));
    pacts.filter(p => (p.initiator === player || p.partner === player) && !p.broken)
      .forEach(p => partners.add(p.initiator === player ? p.partner : p.initiator));
    return partners;
  };

  // ── Helper: willingness to accept a dare ──
  // Returns true if the player is willing to do it, false if they'd rather redirect
  // When forced (0 freebies), a second roll determines if they can actually do it
  const _willingness = (player, category, roundNum, forced = false) => {
    const s = pStats(player);
    // Fatigue ramps up — early rounds feel brave, late rounds get desperate
    // Round 1-3: negligible. Round 5-7: noticeable. Round 10+: heavy. Round 15+: brutal.
    // No cap — eventually even boldness 10 cracks.
    const fatigue = Math.pow(roundNum, 1.5) * 0.006;
    let secondary = 0;
    if (category === 'humiliation') secondary = (10 - s.social) * 0.03;
    else if (category === 'pain-fear') secondary = s.physical * 0.03;
    else if (category === 'sacrifice') secondary = (10 - s.loyalty) * 0.03;
    // Freebie awareness: players know their freebie count and act accordingly
    // 0 freebies = accept (no choice anyway, might as well commit)
    // 1 freebie = clutch it, redirect if possible
    // 2+ freebies = comfortable, more willing to accept
    // 4+ freebies = very secure, almost always accept
    const myFreebies = freebies[player] || 0;
    const freebieComfort = myFreebies === 0 ? 0.15   // no freebies = commit (can't redirect anyway)
      : myFreebies === 1 ? -0.12  // 1 freebie = protect it, redirect
      : myFreebies === 2 ? 0.0    // 2 freebies = neutral
      : myFreebies === 3 ? 0.08   // 3 freebies = comfortable
      : 0.15;                      // 4+ = very secure, accept freely
    // Early round safety: first 3 rounds nobody should go home — the game needs buildup
    const earlyBoost = roundNum <= 2 ? 0.25 : roundNum <= 4 ? 0.10 : 0;
    const chance = s.boldness * 0.07 + secondary - fatigue + freebieComfort + earlyBoost;
    // When choosing freely: moderate bar — lean toward accepting early
    // When forced (0 freebies): lower bar — desperation helps
    const threshold = forced ? 0.15 : 0.35;
    return Math.random() < (chance - threshold + 0.5);
  };

  // ── Helper: redirect target selection ──
  const _pickRedirectTarget = (player, remaining) => {
    const partners = _getPactPartners(player);
    const candidates = remaining.filter(p => p !== player);
    if (!candidates.length) return null;

    // Check for alliance betrayal — low loyalty + low bond + high strategic
    const s = pStats(player);
    const allyTargets = candidates.filter(c => partners.has(c));
    for (const ally of allyTargets) {
      const bond = getBond(player, ally);
      const betrayalChance = (10 - s.loyalty) * 0.03 + (10 - Math.max(0, bond)) * 0.02 + s.strategic * 0.02;
      if (Math.random() < betrayalChance - 0.30) return { target: ally, isBetrayal: true };
    }

    // Normal targeting: enemies first, heat, alliance consensus
    return { target: wRandom(candidates, c => {
      const bond = getBond(player, c);
      const heat = computeHeat(c, activePlayers, gs.namedAlliances || []);
      const isPartner = partners.has(c);
      const partnerPenalty = isPartner ? -5.0 : 0;
      return Math.max(0.1, (-bond * 0.4) + (heat * 0.3) + partnerPenalty + Math.random() * 0.3);
    }), isBetrayal: false };
  };

  // ── Helper: freebie sharing check ──
  const _checkFreebieSharing = (roundNum, remaining) => {
    const needy = remaining.filter(p => freebies[p] <= 1 && p !== eliminatedPlayer);
    for (const requester of needy) {
      // Only donate if after giving, the requester won't exceed donor's remaining count
      const donors = remaining.filter(p => p !== requester && freebies[p] >= 3 && (freebies[requester] + 1) <= (freebies[p] - 1));
      for (const donor of donors) {
        const bond = getBond(donor, requester);
        const s = pStats(donor);
        const requesterThreat = threatScore(requester);
        const donorThreat = threatScore(donor);
        // Shield logic only applies with 5+ players — at F3/F4, nobody's a shield
        const isShield = remaining.length >= 5 && requesterThreat > donorThreat ? 0.15 : 0;
        const strategicVal = s.strategic * 0.03 * (isShield ? 2 : 1);
        // Surplus factor: proportional to how many freebies you can afford to give
        // 3 freebies (minimum to donate) = 0.0, 4 = 0.06, 5 = 0.12, 6 = 0.18, 7+ = 0.24+
        const _surplus = freebies[donor] - 3; // 0 at threshold, grows with stockpile
        const surplusMod = _surplus * 0.06;
        const arch = players.find(p => p.name === donor)?.archetype || '';
        const archMod = arch === 'hero' || arch === 'loyal-soldier' ? 0.06
                       : arch === 'social-butterfly' ? 0.03
                       : arch === 'villain' || arch === 'mastermind' ? 0.00
                       : arch === 'chaos-agent' ? Math.random() * 0.06
                       : 0;
        const shareChance = bond * 0.03 + s.loyalty * 0.03 + strategicVal + surplusMod + archMod - 0.10;
        if (Math.random() < shareChance) {
          freebies[donor]--;
          freebies[requester]++;
          // Context: why did they share?
          const _sharedAlliance = (gs.namedAlliances || []).find(a => a.active && a.members.includes(donor) && a.members.includes(requester));
          const _inPact = pacts.some(p => !p.broken && ((p.initiator === donor && p.partner === requester) || (p.partner === donor && p.initiator === requester)));
          const _reason = isShield ? 'strategic — keeping a shield'
            : _sharedAlliance ? `protecting ${_sharedAlliance.name}`
            : _inPact ? 'honoring the pact'
            : bond >= 5 ? 'genuine bond'
            : s.loyalty >= 7 ? 'loyalty — it\'s who they are'
            : 'investment — building trust';
          const _prD = pronouns(donor);
          const _giftText = _rp([
            `${donor} catches ${requester}'s eye and slides a freebie across. ${_reason === 'genuine bond' ? '"I got you."' : _reason.startsWith('strategic') ? `${_prD.Sub} ${_prD.sub === 'they' ? 'need' : 'needs'} ${requester} in this game.` : `"Hold onto this."`}`,
            `${donor} quietly hands ${requester} a freebie. ${_sharedAlliance ? `The ${_sharedAlliance.name} looks out for its own.` : _inPact ? 'The deal holds.' : `It costs something. But it buys something too.`}`,
          ]);
          freebieGifts.push({ from: donor, to: requester, round: roundNum, reason: _reason, text: _giftText });
          addBond(donor, requester, 0.4);
          addBond(requester, donor, 0.4);
          break;
        } else if (bond >= 2 && _getPactPartners(donor).has(requester)) {
          const refusalChance = (10 - s.loyalty) * 0.04 + (10 - Math.max(0, bond)) * 0.03;
          if (Math.random() < refusalChance) {
            betrayals.push({ player: donor, target: requester, type: 'refusal', round: roundNum });
            addBond(donor, requester, -0.5);
          }
        }
      }
    }
  };

  // ── Helper: pact formation ──
  const _checkPactFormation = (roundNum, remaining) => {
    const unallied = remaining.filter(p => {
      return !(gs.namedAlliances || []).some(a => a.active && a.members.includes(p) &&
        a.members.filter(m => remaining.includes(m)).length >= 2);
    });
    const inPact = new Set(pacts.filter(p => !p.broken).flatMap(p => [p.initiator, p.partner]));

    for (const initiator of unallied) {
      if (inPact.has(initiator)) continue;
      const s = pStats(initiator);
      const initiateChance = s.strategic * 0.07 + s.social * 0.03;
      if (Math.random() >= initiateChance) continue;
      const candidates = remaining.filter(p => p !== initiator && !inPact.has(p));
      if (!candidates.length) continue;
      const partner = candidates.sort((a, b) => getBond(initiator, b) - getBond(initiator, a))[0];
      const bond = getBond(initiator, partner);
      const sharedEnemies = remaining.filter(p => p !== initiator && p !== partner &&
        getBond(initiator, p) < -1 && getBond(partner, p) < -1);
      const sharedEnemyBonus = sharedEnemies.length ? 0.15 : 0;
      const acceptChance = bond * 0.05 + sharedEnemyBonus;
      if (Math.random() < acceptChance) {
        const target = remaining.filter(p => p !== initiator && p !== partner)
          .sort((a, b) => (getBond(initiator, a) + getBond(partner, a)) - (getBond(initiator, b) + getBond(partner, b)))[0];
        pacts.push({ initiator, partner, target, formedRound: roundNum, broken: false });
        inPact.add(initiator); inPact.add(partner);
        addBond(initiator, partner, 0.2);
      }
    }
  };

  // ── Helper: reaction text generation ──
  const _acceptReaction = (player, category, dareTitle) => {
    const s = pStats(player);
    const pr = pronouns(player);
    const arch = players.find(p => p.name === player)?.archetype || '';
    const bold = s.boldness >= 7;
    const reactions = [];
    if (bold) {
      reactions.push(`${player} doesn't even hesitate. "${dareTitle}? That's it?" ${pr.Sub} ${pr.sub === 'they' ? 'step' : 'steps'} forward.`);
      reactions.push(`${player} grins. "I've done worse on a Tuesday." ${pr.Sub} ${pr.sub === 'they' ? 'take' : 'takes'} the dare.`);
      reactions.push(`${player} looks almost disappointed it wasn't harder. ${pr.Sub} ${pr.sub === 'they' ? 'accept' : 'accepts'} immediately.`);
    } else {
      reactions.push(`${player} takes a deep breath. Closes ${pr.pos} eyes. Does it. Barely.`);
      reactions.push(`${player} stares at the dare for a long moment. Then, quietly: "Okay." ${pr.Sub} ${pr.sub === 'they' ? 'do' : 'does'} it.`);
      reactions.push(`${player} looks like ${pr.sub} might refuse. But something shifts — pride, desperation, or just stubbornness. ${pr.Sub} ${pr.sub === 'they' ? 'go' : 'goes'} for it.`);
    }
    if (arch === 'villain' || arch === 'mastermind') reactions.push(`${player} accepts with a smirk. Everything is a power move.`);
    if (arch === 'hero') reactions.push(`${player} sets ${pr.pos} jaw. "If that's what it takes." ${pr.Sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'} flinch.`);
    if (arch === 'chaos-agent') reactions.push(`${player} laughs — actually laughs — and takes the dare before anyone can react.`);
    return _rp(reactions);
  };

  const _failReaction = (player, dareTitle) => {
    const pr = pronouns(player);
    const reactions = [
      `${player} looks at the dare. Looks at the tribe. Looks back at the dare. "${pr.Sub} can't." The words come out quieter than expected.`,
      `${player} opens ${pr.pos} mouth to say yes. Nothing comes out. The silence says everything.`,
      `${player} starts to step forward — then stops. ${pr.Sub} ${pr.sub === 'they' ? 'know' : 'knows'} it's over. Everyone does.`,
      `${player}'s hands are shaking. "I'm sorry. I just — I can't do this one." The tribe watches ${pr.obj} sit down.`,
      `${player} tries. Really tries. But ${pr.pos} body won't cooperate. It's done.`,
    ];
    return _rp(reactions);
  };

  const _redirectReaction = (player, target, bond, isBetrayal) => {
    const pr = pronouns(player);
    const tPr = pronouns(target);
    const reactions = [];
    if (isBetrayal) {
      reactions.push(`${player} turns to ${target} — ${pr.pos} own ally — and passes the dare. The look on ${target}'s face says it all.`);
      reactions.push(`${player} redirects to ${target}. Nobody saw that coming. Especially not ${target}.`);
      reactions.push(`"Sorry, ${target}." ${player} doesn't look sorry. ${pr.Sub} ${pr.sub === 'they' ? 'slide' : 'slides'} the dare across.`);
    } else if (bond < -2) {
      reactions.push(`${player} doesn't even think about it. "${target}." ${pr.Sub} ${pr.sub === 'they' ? 'say' : 'says'} the name like it's been waiting.`);
      reactions.push(`${player} locks eyes with ${target}. "Your turn." There's history in those two words.`);
      reactions.push(`${player} passes it to ${target} without hesitation. This isn't strategy — it's personal.`);
    } else {
      reactions.push(`${player} weighs the options. "I'm going to have to pass this to ${target}." ${pr.Sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'} enjoy it.`);
      reactions.push(`${player} burns a freebie and redirects to ${target}. Not malice — just math.`);
      reactions.push(`"${target}, I'm sorry, but I need to hold onto my position." ${player} passes the dare.`);
    }
    return _rp(reactions);
  };

  const _receiveReaction = (player, fromPlayer, bond) => {
    const pr = pronouns(player);
    const reactions = [];
    if (bond < -2) {
      reactions.push(`${player} catches the dare and glares at ${fromPlayer}. "Of course."`);
      reactions.push(`${player} shakes ${pr.pos} head. "Real brave, ${fromPlayer}."`);
    } else if (bond > 3) {
      reactions.push(`${player} looks at ${fromPlayer} — hurt flickers, then disappears. "${pr.Sub} ${pr.sub === 'they' ? 'take' : 'takes'} it."`);
      reactions.push(`${player} nods slowly. Didn't expect this from ${fromPlayer}. But here they are.`);
    } else {
      reactions.push(`${player} takes a breath. "Okay. Let's see what we've got."`);
      reactions.push(`${player} looks at the dare. Then at ${fromPlayer}. Then back at the dare. "Fine."`);
    }
    return _rp(reactions);
  };

  // ══════════════════════════════════════════════════════════════
  // MAIN ROUND LOOP
  // ══════════════════════════════════════════════════════════════
  // Flow per round:
  // 1. Spinner spins wheel -> dare assigned
  // 2. Spinner decides: ACCEPT own dare (earn +1 freebie) or PASS to someone
  // 3. If passed: target can USE FREEBIE to skip, or ATTEMPT (willingness roll).
  //    Fail willingness with 0 freebies = ELIMINATED.
  let remaining = [...activePlayers];
  let _rotation = [...remaining].sort(() => Math.random() - 0.5);

  for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
    if (eliminatedPlayer) break;

    // Pact formation (every 3 rounds)
    if (roundNum % 3 === 1) _checkPactFormation(roundNum, remaining);
    // Freebie sharing (every 3 rounds — giving away freebies is costly, shouldn't be constant)
    if (roundNum % 3 === 0) _checkFreebieSharing(roundNum, remaining);

    // Spinner: next in rotation
    _rotation = _rotation.filter(p => remaining.includes(p));
    if (!_rotation.length) _rotation = [...remaining].sort(() => Math.random() - 0.5);
    const activeSpinner = _rotation.shift();

    // Wheel lands on eliminated player (who wrote the dare)
    const wheelLanding = eliminated.length ? _rp(eliminated) : 'The Host';
    const category = _rp(DARE_CATEGORIES);
    const dareObj = _rp(DARE_POOL[category]);
    const dareTitle = dareObj.title;
    const dareText = dareObj.desc;

    const chain = [];

    // Step 1: Spinner decides -- accept own dare or pass?
    const spinnerWilling = _willingness(activeSpinner, category, roundNum, false);

    if (spinnerWilling) {
      // Spinner accepts their own dare -> earns +1 freebie
      chain.push({ player: activeSpinner, action: 'accept', completed: true, freebieEarned: true,
        isSpinner: true, reaction: _acceptReaction(activeSpinner, category, dareTitle) });
      freebies[activeSpinner]++;
      completions[activeSpinner]++;
    } else {
      // Spinner passes the dare to someone else
      const redirectResult = _pickRedirectTarget(activeSpinner, remaining);
      if (!redirectResult || !redirectResult.target) {
        // No valid targets (solo?) -- spinner must accept
        chain.push({ player: activeSpinner, action: 'accept', completed: true, freebieEarned: true,
          isSpinner: true, reaction: _acceptReaction(activeSpinner, category, dareTitle) });
        freebies[activeSpinner]++;
        completions[activeSpinner]++;
      } else {
        const target = redirectResult.target;
        const _rdBond = getBond(activeSpinner, target);
        chain.push({
          player: activeSpinner, action: 'pass', to: target, isSpinner: true,
          isBetrayal: redirectResult.isBetrayal,
          reaction: _redirectReaction(activeSpinner, target, _rdBond, redirectResult.isBetrayal),
          receiveReaction: _receiveReaction(target, activeSpinner, _rdBond),
        });
        addBond(activeSpinner, target, -0.2);
        if (redirectResult.isBetrayal) {
          betrayals.push({ player: activeSpinner, target, type: 'redirect', round: roundNum });
          addBond(activeSpinner, target, -0.8);
        }

        // Remove target from rotation (being targeted counts as their turn)
        const _tIdx = _rotation.indexOf(target);
        if (_tIdx !== -1) _rotation.splice(_tIdx, 1);

        // Step 2: Target deals with the dare
        if (freebies[target] > 0) {
          // Has freebies -- will they use one or push through?
          const targetWilling = _willingness(target, category, roundNum, false);
          if (targetWilling) {
            // Target pushes through (no freebie earned -- only spinners earn)
            chain.push({ player: target, action: 'accept', completed: true, freebieEarned: false,
              isSpinner: false, reaction: _acceptReaction(target, category, dareTitle) });
            completions[target]++;
          } else {
            // Target uses a freebie to skip
            freebies[target]--;
            const pr = pronouns(target);
            chain.push({ player: target, action: 'freebie-skip', freebieSpent: true,
              reaction: `${target} pulls out a freebie. "Not today." ${pr.Sub} ${pr.sub === 'they' ? 'slide' : 'slides'} it across and sits back down.` });
          }
        } else {
          // 0 freebies -- MUST face the dare. Willingness determines fate.
          const canDoIt = _willingness(target, category, roundNum, true);
          if (canDoIt) {
            // Pushes through despite having no safety net
            chain.push({ player: target, action: 'accept', completed: true, freebieEarned: false,
              isSpinner: false, reaction: _acceptReaction(target, category, dareTitle) });
            completions[target]++;
          } else {
            // Can't do it, no freebie to save them -- ELIMINATED
            chain.push({ player: target, action: 'refuse', completed: false,
              reaction: _failReaction(target, dareTitle) });
            eliminatedPlayer = target;
            eliminatedRound = roundNum;
            eliminatedDare = { category, title: dareTitle, text: dareText };
          }
        }
      }
    }

    rounds.push({ roundNum, activeSpinner, wheelLanding, dareCategory: category, dareTitle, dareText, initialTarget: chain[0]?.player, chain });
  }

  // Fallback: lowest completions goes home
  if (!eliminatedPlayer) {
    const sorted = remaining.sort((a, b) => completions[a] - completions[b]);
    eliminatedPlayer = sorted[0];
    eliminatedRound = maxRounds;
    eliminatedDare = { category: 'fallback', text: 'Couldn\'t keep up with the dares' };
  }

  // MVP: most completions (resume moment, no immunity)
  const mostDares = remaining.filter(p => p !== eliminatedPlayer)
    .sort((a, b) => completions[b] - completions[a])[0] || null;

  // Set results on ep
  ep.tripleDogDare = {
    rounds, freebieGifts, pacts, betrayals,
    freebiesAtEnd: { ...freebies }, completions: { ...completions },
    eliminated: eliminatedPlayer, eliminatedRound, eliminatedDare,
    mostDares, playerCount: activePlayers.length,
  };
  ep.eliminated = eliminatedPlayer;
  ep.challengeType = 'triple-dog-dare';

  // Camp events
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };

  // Dare completions — respect events (only for 3+ dares)
  Object.entries(completions).forEach(([player, count]) => {
    if (count >= 3) {
      ep.campEvents[campKey].post.push({
        type: 'dareCompleted', players: [player],
        text: `${player} completed ${count} dares. That kind of guts doesn't go unnoticed.`,
        badgeText: 'DAREDEVIL', badgeClass: 'gold'
      });
    }
  });

  // Freebie gifts
  freebieGifts.forEach(g => {
    ep.campEvents[campKey].post.push({
      type: 'freebieGift', players: [g.from, g.to],
      text: `${g.from} slid a freebie to ${g.to} during the dare challenge. That's not nothing.`,
      badgeText: 'FREEBIE SHARED', badgeClass: 'gold'
    });
  });

  // Pact formation
  pacts.forEach(p => {
    ep.campEvents[campKey].post.push({
      type: 'darePact', players: [p.initiator, p.partner],
      text: `${p.initiator} and ${p.partner} made a deal during the dare challenge — target ${p.target} together.`,
      badgeText: 'DEAL STRUCK', badgeClass: 'gold'
    });
  });

  // Betrayals
  betrayals.forEach(b => {
    const badgeText = b.type === 'redirect' ? 'BETRAYED' : 'LEFT HANGING';
    const text = b.type === 'redirect'
      ? `${b.player} redirected a dare to ${b.target} — their own ally. The cracks are showing.`
      : `${b.player} watched ${b.target} run out of freebies and did nothing.`;
    ep.campEvents[campKey].post.push({
      type: b.type === 'redirect' ? 'allianceRedirectBetrayal' : 'freebieRefusal',
      players: [b.player, b.target], text, badgeText, badgeClass: 'red'
    });
  });

  // MVP resume moment
  if (mostDares) {
    ep.campEvents[campKey].post.push({
      type: 'dareMVP', players: [mostDares],
      text: `${mostDares} completed the most dares. That performance is going on the resume.`,
      badgeText: 'DAREDEVIL', badgeClass: 'gold'
    });
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[mostDares] = (gs.popularity[mostDares] || 0) + 2; // dared the most = crowd entertainer
  }

  // Eliminated player loses a step in the public eye
  if (eliminatedPlayer) {
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[eliminatedPlayer] = (gs.popularity[eliminatedPlayer] || 0) - 1; // ran out of freebies = exposed as weakest
  }

  updateChalRecord(ep);
}

export function _textTripleDogDare(ep, ln, sec) {
  const tdd = ep.tripleDogDare;
  if (!tdd) return;
  sec('TRIPLE DOG DARE');
  ln(`${tdd.playerCount} players. ${tdd.rounds.length} rounds. Sudden-death elimination.`);
  ln('');

  if (tdd.pacts?.length) {
    ln('PACTS:');
    tdd.pacts.forEach(p => ln(`- ${p.initiator} + ${p.partner} → targeting ${p.target} (formed round ${p.formedRound})`));
    ln('');
  }

  tdd.rounds.forEach(round => {
    ln(`Round ${round.roundNum}: [${round.dareCategory.toUpperCase()}] ${round.eliminatedSpinner} dares: "${round.dareText}"`);
    round.chain.forEach(step => {
      if (step.action === 'accept' && step.freebieEarned) {
        ln(`  ${step.player} ACCEPTS — earns a freebie.`);
      } else if (step.action === 'accept') {
        ln(`  ${step.player} PUSHES THROUGH — no freebie (passed dare).`);
      } else if (step.action === 'pass') {
        ln(`  ${step.player} PASSES to ${step.to}${step.isBetrayal ? ' [BETRAYAL]' : ''}`);
      } else if (step.action === 'freebie-skip') {
        ln(`  ${step.player} USES A FREEBIE to skip.`);
      } else if (step.action === 'refuse') {
        ln(`  ${step.player} REFUSES — no freebies left. ELIMINATED.`);
      } else if (step.action === 'redirect') {
        ln(`  ${step.player} REDIRECTED to ${step.to} (-1 freebie)${step.isBetrayal ? ' [BETRAYAL]' : ''}`);
      }
    });
  });
  ln('');

  if (tdd.freebieGifts?.length) {
    ln('FREEBIE GIFTS:');
    tdd.freebieGifts.forEach(g => ln(`- Round ${g.round}: ${g.from} → ${g.to}`));
    ln('');
  }

  if (tdd.betrayals?.length) {
    ln('BETRAYALS:');
    tdd.betrayals.forEach(b => ln(`- Round ${b.round}: ${b.player} ${b.type === 'redirect' ? 'redirected to' : 'refused to share with'} ${b.target}`));
    ln('');
  }

  ln('FINAL FREEBIE COUNTS:');
  Object.entries(tdd.freebiesAtEnd || {}).sort(([,a],[,b]) => b - a).forEach(([name, count]) => {
    ln(`  ${name}: ${count}`);
  });
  ln('');

  ln(`ELIMINATED: ${tdd.eliminated} (round ${tdd.eliminatedRound})`);
  if (tdd.eliminatedDare?.text) ln(`  Dare: "${tdd.eliminatedDare.text}" [${tdd.eliminatedDare.category}]`);
  if (tdd.mostDares) ln(`DAREDEVIL: ${tdd.mostDares} (${tdd.completions?.[tdd.mostDares] || 0} dares completed)`);
}

export function rpBuildTripleDogDareAnnouncement(ep) {
  const tdd = ep.tripleDogDare;
  if (!tdd) return '';
  // Use previous episode's snapshot for eliminated list — ep.gsSnapshot is taken AFTER this episode,
  // so it includes this episode's elimination (spoiler). Same pattern as Cold Open.
  const prevEp = (gs.episodeHistory || []).filter(h => h.num < ep.num).slice(-1)[0];
  const prevSnap = prevEp?.gsSnapshot || {};
  const snap = ep.gsSnapshot || {};
  // Active players from this episode's start (not the post-elimination snapshot)
  const _tribesMembers = ep.tribesAtStart?.flatMap(t => t.members);
  const activePlayers = (_tribesMembers?.length ? _tribesMembers : null) || prevSnap.activePlayers || snap.activePlayers || [];
  // Eliminated players BEFORE this episode — no spoilers
  const eliminatedPlayers = prevSnap.eliminated || [];
  const playerCount = tdd.playerCount || activePlayers.length;

  // Host quotes
  const _hostQuotes = [
    'The producers ran out of ideas for challenges. So we asked the people you voted out to come up with something. They were... enthusiastic.',
    'Tonight, the people you sent home get their revenge. Every dare on that wheel was written by someone you eliminated.',
    'No immunity challenge. No tribal council. Just dares. Refuse one without a freebie, and you\'re done.',
    'You\'ve been voting people out all season. Now they get to decide what you have to do to stay.',
  ];
  const _hostQuote = _hostQuotes[Math.floor(Math.abs((ep.num || 1) * 17) % _hostQuotes.length)];

  let html = `<div class="rp-page tod-tribal">
    <div style="font-family:var(--font-display);font-size:32px;letter-spacing:3px;text-align:center;color:var(--accent-fire);text-shadow:0 0 20px var(--accent-fire);margin-bottom:4px;animation:scrollDrop 0.5s var(--ease-broadcast) both">TRIPLE DOG DARE</div>
    <div style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--muted);text-align:center;margin-bottom:24px">Sudden-Death Elimination</div>

    <div style="font-size:13px;color:var(--vp-text);text-align:center;margin-bottom:24px;line-height:1.7;max-width:460px;margin-left:auto;margin-right:auto;font-style:italic">
      "${_hostQuote}"
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-bottom:24px;max-width:500px;margin-left:auto;margin-right:auto">
      <div class="vp-card" style="flex:1;min-width:180px;text-align:center;padding:12px">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);margin-bottom:8px">THE RULES</div>
        <div style="font-size:11px;color:var(--muted);line-height:1.6;text-align:left">
          <div style="margin-bottom:4px"><span style="color:#3fb950;font-weight:700">Accept</span> a dare — earn a freebie</div>
          <div style="margin-bottom:4px"><span style="color:var(--accent-gold);font-weight:700">Redirect</span> it — spend a freebie</div>
          <div><span style="color:#da3633;font-weight:700">0 freebies + can't do it</span> — eliminated</div>
        </div>
      </div>
      <div class="vp-card" style="flex:1;min-width:180px;text-align:center;padding:12px">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:var(--accent-fire);margin-bottom:8px">THE STAKES</div>
        <div style="font-size:11px;color:var(--muted);line-height:1.6">
          <div style="margin-bottom:4px">${playerCount} players</div>
          <div style="margin-bottom:4px">${tdd.rounds.length} rounds</div>
          <div style="color:var(--accent-fire);font-weight:700">No tribal council</div>
        </div>
      </div>
    </div>

    <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:var(--muted);text-align:center;margin-bottom:10px">PLAYERS</div>
    <div class="rp-portrait-row" style="justify-content:center;margin-bottom:24px">
      ${activePlayers.map(name => rpPortrait(name)).join('')}
    </div>`;

  // Show the dare wheel — eliminated players who wrote the dares
  if (eliminatedPlayers.length) {
    html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#da3633;text-align:center;margin-bottom:10px">THE DARE WHEEL</div>
    <div style="font-size:10px;color:var(--muted);text-align:center;margin-bottom:10px">Written by the eliminated</div>
    <div class="rp-portrait-row" style="justify-content:center;opacity:0.7">
      ${eliminatedPlayers.map(name => rpPortrait(name, 'sm elim')).join('')}
    </div>`;
  }

  html += `</div>`;
  return html;
}

export function rpBuildTripleDogDareRounds(ep) {
  const tdd = ep.tripleDogDare;
  if (!tdd || !tdd.rounds?.length) return '';
  const snap = ep.gsSnapshot || {};
  const prevEp = (gs.episodeHistory || []).filter(h => h.num < ep.num).slice(-1)[0];
  const prevSnap = prevEp?.gsSnapshot || {};
  const _tribesMembersR = ep.tribesAtStart?.flatMap(t => t.members);
  const activePlayers = (_tribesMembersR?.length ? _tribesMembersR : null) || prevSnap.activePlayers || snap.activePlayers || [];
  const _catColor = { 'gross-out': '#3fb950', 'humiliation': '#db61a2', 'pain-fear': '#da3633', 'sacrifice': '#e3b341', 'fallback': '#8b949e' };
  const uid = 'tdd-' + ep.num;

  // Build the ordered reveal sequence: each item is { type, html, freebieDeltas }
  // freebieDeltas: { playerName: +1/-1 } for freebie counter updates
  const revealItems = [];

  // Freebie gifts and pacts grouped by round
  const _giftsByRound = {};
  (tdd.freebieGifts || []).forEach(g => { if (!_giftsByRound[g.round]) _giftsByRound[g.round] = []; _giftsByRound[g.round].push(g); });
  const _pactsByRound = {};
  (tdd.pacts || []).forEach(p => { if (!_pactsByRound[p.formedRound]) _pactsByRound[p.formedRound] = []; _pactsByRound[p.formedRound].push(p); });

  tdd.rounds.forEach(round => {
    const catColor = _catColor[round.dareCategory] || '#8b949e';

    // Pacts before this round
    (_pactsByRound[round.roundNum] || []).forEach(pact => {
      revealItems.push({ type: 'pact', freebieDeltas: {},
        html: `<div class="vp-card gold" style="margin-bottom:10px;text-align:center">
          <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:var(--accent-gold)">DEAL STRUCK</span><br>
          <div class="rp-portrait-row" style="justify-content:center;margin:6px 0">${rpPortrait(pact.initiator, 'sm')} ${rpPortrait(pact.partner, 'sm')}</div>
          <div style="font-size:11px;color:var(--muted)">${pact.initiator} and ${pact.partner} agree to work together \u2014 target: ${pact.target}</div>
        </div>` });
    });

    // Freebie gifts before this round
    (_giftsByRound[round.roundNum] || []).forEach(gift => {
      revealItems.push({ type: 'gift', freebieDeltas: { [gift.from]: -1, [gift.to]: 1 },
        html: `<div class="vp-card gold" style="margin-bottom:10px;text-align:center">
          <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:var(--accent-gold)">FREEBIE SHARED</span><br>
          <div class="rp-portrait-row" style="justify-content:center;margin:6px 0">${rpPortrait(gift.from, 'sm')} <span style="font-size:16px;color:var(--accent-gold)">\u2192</span> ${rpPortrait(gift.to, 'sm')}</div>
          <div style="font-size:12px;color:var(--vp-text);line-height:1.5;margin-top:6px">${gift.text || (gift.from + ' slides a freebie to ' + gift.to)}</div>
          ${gift.reason ? `<div style="font-size:10px;color:var(--muted);margin-top:4px;font-style:italic">${gift.reason}</div>` : ''}
        </div>` });
    });

    // The round itself — dare reveal + all chain steps in one card
    const hasElim = round.chain.some(s => s.action === 'accept' && !s.completed);
    const deltas = {};
    let chainHtml = '';

    // Dare header — who spins + who wrote the dare
    const _spinner = round.activeSpinner || round.initialTarget;
    const _wheelName = round.wheelLanding || round.eliminatedSpinner || 'The Host';
    chainHtml += `<div style="font-size:10px;font-weight:700;color:var(--muted);font-family:var(--font-mono);margin-bottom:8px">ROUND ${round.roundNum}</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      ${rpPortrait(_spinner, 'sm')}
      <div style="font-size:12px;color:var(--vp-text)">${_spinner} spins the wheel\u2026</div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-left:16px">
      ${rpPortrait(_wheelName, 'sm', '', true)}
      <div style="font-size:12px;color:var(--muted)">Lands on <span style="font-weight:600;color:var(--vp-text)">${_wheelName}</span> \u2014 "${_wheelName} dares you to\u2026"</div>
    </div>
    <div style="background:${catColor}08;border-left:3px solid ${catColor};padding:8px 12px;margin-bottom:12px;border-radius:0 6px 6px 0">
      <div style="font-size:14px;font-weight:700;color:var(--vp-text);margin-bottom:4px">${round.dareTitle || round.dareText}</div>
      <div style="font-size:12px;color:var(--muted);line-height:1.5">${round.dareText}</div>
    </div>`;

    // Chain steps
    round.chain.forEach((step, si) => {
      chainHtml += `<div style="padding:6px 0;${si > 0 ? 'margin-top:6px;border-top:1px solid var(--border);' : ''}">
        <div style="display:flex;align-items:flex-start;gap:8px">
          ${rpPortrait(step.player, 'sm')}
          <div style="flex:1">`;

      if (step.action === 'accept' && step.freebieEarned) {
        // Spinner accepted their own dare — earns a freebie
        deltas[step.player] = (deltas[step.player] || 0) + 1;
        chainHtml += `<div style="font-size:11px;font-weight:700;color:#3fb950;letter-spacing:0.5px;margin-bottom:4px">\u2705 ACCEPTS THE DARE</div>`;
        if (step.reaction) chainHtml += `<div style="font-size:12px;color:var(--vp-text);line-height:1.5;margin-bottom:4px">${step.reaction}</div>`;
        chainHtml += `<div style="font-size:10px;color:var(--accent-gold)">+1 freebie earned</div>`;
      } else if (step.action === 'accept' && !step.freebieEarned) {
        // Target accepted a passed dare — no freebie
        chainHtml += `<div style="font-size:11px;font-weight:700;color:#3fb950;letter-spacing:0.5px;margin-bottom:4px">\u2705 PUSHES THROUGH</div>`;
        if (step.reaction) chainHtml += `<div style="font-size:12px;color:var(--vp-text);line-height:1.5;margin-bottom:4px">${step.reaction}</div>`;
      } else if (step.action === 'pass') {
        // Spinner passes the dare to someone
        const betrayalTag = step.isBetrayal ? ' <span style="font-size:9px;font-weight:700;color:#da3633;letter-spacing:0.5px;vertical-align:middle">BETRAYAL</span>' : '';
        chainHtml += `<div style="font-size:11px;font-weight:700;color:var(--accent-fire);letter-spacing:0.5px;margin-bottom:4px">\uD83C\uDFAF PASSES THE DARE${betrayalTag}</div>`;
        if (step.reaction) chainHtml += `<div style="font-size:12px;color:var(--vp-text);line-height:1.5;margin-bottom:4px">${step.reaction}</div>`;
        if (step.receiveReaction && step.to) {
          chainHtml += `</div></div>
          <div style="display:flex;align-items:flex-start;gap:8px;margin-top:8px;padding-left:16px">
            ${rpPortrait(step.to, 'sm')}
            <div style="flex:1">
              <div style="font-size:12px;color:var(--vp-text);line-height:1.5;font-style:italic">${step.receiveReaction}</div>`;
        }
      } else if (step.action === 'freebie-skip') {
        // Target used a freebie to skip
        deltas[step.player] = (deltas[step.player] || 0) - 1;
        chainHtml += `<div style="font-size:11px;font-weight:700;color:var(--accent-gold);letter-spacing:0.5px;margin-bottom:4px">\uD83C\uDDF8 USES A FREEBIE</div>`;
        if (step.reaction) chainHtml += `<div style="font-size:12px;color:var(--vp-text);line-height:1.5;margin-bottom:4px">${step.reaction}</div>`;
        chainHtml += `<div style="font-size:10px;color:var(--muted)">\u22121 freebie</div>`;
      } else if (step.action === 'refuse') {
        // Target refused with 0 freebies — eliminated
        chainHtml += `<div style="font-size:11px;font-weight:700;color:#da3633;letter-spacing:0.5px;margin-bottom:4px">\u274c REFUSES \u2014 NO FREEBIES LEFT</div>`;
        if (step.reaction) chainHtml += `<div style="font-size:12px;color:var(--vp-text);line-height:1.5;margin-bottom:4px">${step.reaction}</div>`;
        chainHtml += `<div style="font-size:12px;font-weight:700;color:#da3633;letter-spacing:1px;margin-top:4px">ELIMINATED</div>`;
      } else if (step.action === 'redirect') {
        // Legacy support for old saves
        deltas[step.player] = (deltas[step.player] || 0) - 1;
        const betrayalTag = step.isBetrayal ? ' <span style="font-size:9px;font-weight:700;color:#da3633;letter-spacing:0.5px;vertical-align:middle">BETRAYAL</span>' : '';
        chainHtml += `<div style="font-size:11px;font-weight:700;color:var(--accent-gold);letter-spacing:0.5px;margin-bottom:4px">\uD83D\uDD04 REDIRECTED${betrayalTag}</div>`;
        if (step.reaction) chainHtml += `<div style="font-size:12px;color:var(--vp-text);line-height:1.5;margin-bottom:4px">${step.reaction}</div>`;
        chainHtml += `<div style="font-size:10px;color:var(--muted)">\u22121 freebie</div>`;
        if (step.receiveReaction && step.to) {
          chainHtml += `</div></div>
          <div style="display:flex;align-items:flex-start;gap:8px;margin-top:8px;padding-left:16px">
            ${rpPortrait(step.to, 'sm')}
            <div style="flex:1">
              <div style="font-size:12px;color:var(--vp-text);line-height:1.5;font-style:italic">${step.receiveReaction}</div>`;
        }
      }
      chainHtml += `</div></div></div>`;
    });

    revealItems.push({ type: 'round', freebieDeltas: deltas,
      html: `<div class="vp-card ${hasElim ? 'fire' : ''}" style="margin-bottom:12px">${chainHtml}</div>` });
  });

  // Serialize reveal data into data attributes (inline scripts don't execute in innerHTML)
  const revealData = JSON.stringify(revealItems.map(r => r.freebieDeltas)).replace(/</g, '\\u003c');
  const startFreebies = {};
  activePlayers.forEach(p => startFreebies[p] = 0);

  let html = `<div class="rp-page tod-tribal" id="${uid}-page"
    data-tdd-deltas='${revealData}'
    data-tdd-fb='${JSON.stringify(startFreebies).replace(/</g, '\\u003c')}'
    data-tdd-revealed="0">
    <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;text-align:center;color:var(--accent-fire);margin-bottom:6px">THE DARES</div>`;

  // Freebie counter bar — starts at 1 each, updates with reveals
  html += `<div id="${uid}-fb" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:20px;padding:10px;background:var(--surface);border:1px solid var(--border);border-radius:8px;position:sticky;top:0;z-index:5">
    ${activePlayers.map(name => {
      return `<div style="text-align:center;min-width:48px">
        ${rpPortrait(name, 'sm')}
        <div id="${uid}-fb-${name.replace(/[^a-zA-Z0-9]/g, '_')}" style="font-size:14px;font-weight:700;color:#da3633;margin-top:2px;font-family:var(--font-mono)">0</div>
      </div>`;
    }).join('')}
  </div>`;

  // Hidden reveal items
  revealItems.forEach((item, i) => {
    html += `<div class="${uid}-item" style="display:none" data-idx="${i}">${item.html}</div>`;
  });

  // Reveal buttons — Next + Reveal All
  html += `<div style="display:flex;gap:10px;justify-content:center;margin-top:16px;position:sticky;bottom:10px;z-index:5">
    <button class="rp-camp-toggle-btn" style="border-color:var(--accent-fire);color:var(--accent-fire);padding:8px 20px;font-size:12px" onclick="tddRevealNext('${uid}')">NEXT \u25B6</button>
    <button class="rp-camp-toggle-btn" style="border-color:#484f58;color:#8b949e;padding:8px 16px;font-size:11px" onclick="tddRevealAll('${uid}')">REVEAL ALL</button>
  </div>`;

  html += `</div>`;
  return html;
}

export function rpBuildTripleDogDareElimination(ep) {
  const tdd = ep.tripleDogDare;
  if (!tdd || !tdd.eliminated) return '';
  const elimName = tdd.eliminated;
  const pr = pronouns(elimName);
  const p = players.find(x => x.name === elimName);
  const arch = p?.archetype || 'player';
  const archLabel = arch.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const catColor = { 'gross-out': '#3fb950', 'humiliation': '#db61a2', 'pain-fear': '#da3633', 'sacrifice': '#e3b341', 'fallback': '#8b949e' }[tdd.eliminatedDare?.category] || '#8b949e';

  const quotes = [
    `"I knew it was coming. I just didn't think it would end like this."`,
    `"I did everything I could. Some dares are just... too much."`,
    `"${pr.Sub} ${pr.sub === 'they' ? 'weren\'t' : 'wasn\'t'} afraid of the game. ${pr.Sub} ${pr.sub === 'they' ? 'were' : 'was'} afraid of that."`,
    `"I gave this game everything. It just asked for one thing I couldn't give."`,
    `"No regrets. Okay, one regret."`,
  ];
  const quote = quotes[Math.floor(Math.abs(elimName.charCodeAt(0) * 7 + ep.num * 13) % quotes.length)];

  let html = `<div class="rp-page tod-tribal" style="text-align:center">
    <div class="rp-co-eyebrow" style="color:#da3633;margin-bottom:20px">ELIMINATED</div>
    ${rpPortrait(elimName, 'lg elim')}
    <div class="rp-elim-name" style="margin-top:16px">${elimName}</div>
    <div class="rp-elim-arch">${archLabel}</div>
    <div class="rp-elim-quote">${quote}</div>`;

  if (tdd.eliminatedDare && tdd.eliminatedDare.category !== 'fallback') {
    html += `<div style="margin-bottom:8px">
      <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${catColor};background:${catColor}18;padding:3px 8px;border-radius:3px">${(tdd.eliminatedDare.category || '').toUpperCase().replace('-', ' / ')}</span>
    </div>
    <div style="font-size:15px;font-weight:700;color:var(--vp-text);margin-bottom:6px">${tdd.eliminatedDare.title || ''}</div>
    <div style="font-size:12px;color:var(--muted);font-style:italic;margin-bottom:16px">${tdd.eliminatedDare.text}</div>`;
  }

  html += `<div class="rp-elim-place">Couldn't take the dare — Round ${tdd.eliminatedRound}</div>`;

  // Tied Destinies collateral
  if (ep.tiedDestiniesCollateral) {
    const tdName = ep.tiedDestiniesCollateral;
    const tdPr = pronouns(tdName);
    const tdP = players.find(x => x.name === tdName);
    const tdArch = tdP?.archetype || 'player';
    const tdArchLabel = tdArch.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    html += `<div class="rp-co-divider"></div>
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#da3633;margin-bottom:12px">TIED DESTINIES &mdash; COLLATERAL</div>
      ${rpPortrait(tdName, 'lg elim')}
      <div class="rp-elim-name" style="margin-top:12px">${tdName}</div>
      <div class="rp-elim-arch">${tdArchLabel}</div>
      <div class="rp-elim-quote">"${tdPr.Sub} didn't get dared. ${tdPr.Sub} got tied to the wrong person."</div>
      <div class="rp-elim-place">Eliminated by Tied Destinies</div>`;
  }

  // Daredevil MVP
  if (tdd.mostDares) {
    html += `<div class="rp-co-divider"></div>
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:var(--accent-gold);margin-bottom:12px">DAREDEVIL</div>
      ${rpPortrait(tdd.mostDares, 'sm')}
      <div style="font-size:12px;color:var(--muted);margin-top:6px">${tdd.mostDares} completed the most dares (${tdd.completions?.[tdd.mostDares] || 0})</div>`;
  }

  html += `</div>`;
  return html;
}

