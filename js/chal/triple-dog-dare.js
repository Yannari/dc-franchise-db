// js/chal/triple-dog-dare.js
import { DARE_CATEGORIES, DARE_POOL, gs, players } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { wRandom, computeHeat } from '../alliances.js';

// ── Archetype × Category willingness modifiers ──
const TDD_ARCHETYPE_BIAS = {
  'hothead':            { gross:  0.00, physical:  0.15, truth: -0.10, public:  0.05 },
  'challenge-beast':    { gross: -0.05, physical:  0.20, truth: -0.05, public:  0.00 },
  'villain':            { gross:  0.00, physical:  0.00, truth:  0.12, public: -0.08 },
  'mastermind':         { gross: -0.05, physical: -0.05, truth:  0.12, public: -0.05 },
  'schemer':            { gross: -0.05, physical: -0.05, truth:  0.10, public: -0.05 },
  'social-butterfly':   { gross: -0.05, physical:  0.00, truth:  0.05, public:  0.15 },
  'showmancer':         { gross: -0.05, physical:  0.00, truth:  0.05, public:  0.15 },
  'hero':               { gross:  0.05, physical:  0.05, truth:  0.05, public:  0.05 },
  'loyal-soldier':      { gross:  0.05, physical:  0.05, truth:  0.05, public:  0.05 },
  'underdog':           { gross:  0.10, physical:  0.10, truth:  0.00, public:  0.00 },
  'goat':               { gross:  0.15, physical:  0.05, truth:  0.00, public:  0.10 },
  'perceptive-player':  { gross: -0.05, physical: -0.05, truth:  0.10, public: -0.05 },
  'wildcard':           { gross:  0.10, physical:  0.10, truth:  0.05, public:  0.10 },
  'chaos-agent':        { gross:  0.15, physical:  0.10, truth:  0.00, public:  0.10 },
  'floater':            { gross: -0.05, physical: -0.05, truth: -0.05, public: -0.05 },
};

function _tddArchBias(playerName, category) {
  const p = players.find(pp => pp.name === playerName);
  const arch = p?.archetype || '';
  const row = TDD_ARCHETYPE_BIAS[arch];
  if (!row) return 0;
  return row[category] || 0;
}

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
  const chickenStreak = {};
  activePlayers.forEach(p => chickenStreak[p] = 0);
  const chickenStreakAnnounced = {};
  activePlayers.forEach(p => chickenStreakAnnounced[p] = false);
  const dareFatigue = {};
  activePlayers.forEach(p => dareFatigue[p] = 0);
  let eliminatedPlayer = null;
  let eliminatedRound = null;
  let eliminatedDare = null;

  const _applyDareConsequence = (player, category, dareObj, chain, roundNum) => {
    if (category === 'gross') {
      if (Math.random() < 0.25) {
        if (freebies[player] > 0) freebies[player]--;
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[player] = (gs.popularity[player] || 0) - 1;
        const mishapTexts = [
          `${player} tries to comply. Their body has other ideas.`,
          `${player} commits fully. The audience wishes they hadn't.`,
          `${player} gets halfway through and loses it. Completely.`,
        ];
        chain.push({ type: 'dareMishap', player, category, round: roundNum,
          text: mishapTexts[Math.floor(Math.random() * mishapTexts.length)],
          badgeText: 'MISHAP', badgeClass: 'red' });
      } else {
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[player] = (gs.popularity[player] || 0) + 1;
        chain.push({ type: 'dareConsequence', player, category, round: roundNum,
          text: `${player} pulls it off without flinching. Grudging respect from the tribe.` });
      }
    } else if (category === 'physical') {
      dareFatigue[player] = 2;
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[player] = (gs.popularity[player] || 0) + 2;
      chain.push({ type: 'dareConsequence', player, category, round: roundNum,
        text: `${player} is drained. Two rounds of recovery needed, but the crowd loves it.` });
    } else if (category === 'truth') {
      const namedTarget = dareObj._resolvedTarget || null;
      if (namedTarget) {
        const bondDelta = dareObj.severity === 'harsh' ? -3 : -2;
        addBond(player, namedTarget, bondDelta);
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[namedTarget] = (gs.popularity[namedTarget] || 0) - 1;
        gs.popularity[player] = (gs.popularity[player] || 0) + 1;
        chain.push({ type: 'dareConsequence', player, namedTarget, category, round: roundNum,
          text: `${player} tells the truth about ${namedTarget}. The silence that follows says everything.`,
          bondDelta, players: [player, namedTarget] });
      } else {
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[player] = (gs.popularity[player] || 0) + 1;
        chain.push({ type: 'dareConsequence', player, category, round: roundNum,
          text: `${player} reveals something nobody knew. The game just shifted.` });
      }
    } else if (category === 'public') {
      const swing = dareObj.severity === 'harsh' ? 3 : 2;
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[player] = (gs.popularity[player] || 0) + swing;
      chain.push({ type: 'dareConsequence', player, category, round: roundNum,
        text: `${player} commits completely. The entire camp stops to watch.`, popDelta: swing });
    }
  };

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
  const _willingness = (player, category, roundNum, forced = false) => {
    const s = pStats(player);
    const fatigue = Math.pow(roundNum, 1.5) * 0.006;
    const physicalFatigue = (dareFatigue[player] || 0) > 0 ? 0.05 * dareFatigue[player] : 0;
    const streakPressure = (chickenStreak[player] || 0) >= 3 ? 0.03 * chickenStreak[player] : 0;
    let secondary = 0;
    if (category === 'public') secondary = (10 - s.social) * 0.03;
    else if (category === 'physical') secondary = s.physical * 0.03;
    else if (category === 'truth') secondary = (10 - s.loyalty) * 0.03;
    const myFreebies = freebies[player] || 0;
    const freebieComfort = myFreebies === 0 ? 0.15
      : myFreebies === 1 ? -0.12
      : myFreebies === 2 ? 0.0
      : myFreebies === 3 ? 0.08
      : 0.15;
    const earlyBoost = roundNum <= 2 ? 0.25 : roundNum <= 4 ? 0.10 : 0;
    const chance = s.boldness * 0.07 + secondary - fatigue + freebieComfort + earlyBoost
      + _tddArchBias(player, category) + streakPressure - physicalFatigue;
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
    let darePool = DARE_POOL[category] || [];
    if ((chickenStreak[activeSpinner] || 0) >= 5) {
      const harsh = darePool.filter(d => d.severity === 'harsh');
      if (harsh.length >= 3) darePool = harsh;
    }
    let dareObj = darePool[Math.floor(Math.random() * darePool.length)] || { title: '', desc: '', severity: 'mild' };
    const dareTitle = dareObj.title;
    let dareText = dareObj.desc;
    let dareTarget = null;
    if (dareText && dareText.includes('{target}')) {
      const candidates = remaining.filter(p => p !== activeSpinner);
      dareTarget = candidates[Math.floor(Math.random() * candidates.length)];
      if (dareTarget) dareText = dareText.replace(/\{target\}/g, dareTarget);
      dareObj = { ...dareObj, _resolvedTarget: dareTarget, desc: dareText };
    }

    const chain = [];

    // Spinner land + dare reveal events
    const _spinnerIdx = activePlayers.indexOf(activeSpinner);
    const _spinnerWedge = 360 / Math.max(1, remaining.length);
    const _spinnerAngle = _spinnerIdx >= 0 ? _spinnerIdx * _spinnerWedge + _spinnerWedge / 2 : Math.random() * 360;
    chain.push({ type: 'spinnerLand', player: activeSpinner, round: roundNum, _spinnerAngle });
    chain.push({ type: 'dareReveal', player: activeSpinner, category, text: dareText, round: roundNum });

    // Step 1: Spinner decides -- accept own dare or pass?
    const spinnerWilling = _willingness(activeSpinner, category, roundNum, false);

    if (spinnerWilling) {
      if ((chickenStreak[activeSpinner] || 0) >= 3) {
        chain.push({ type: 'chickenStreakBroken', player: activeSpinner, priorStreak: chickenStreak[activeSpinner], round: roundNum,
          text: `${activeSpinner} finally steps up. After ${chickenStreak[activeSpinner]} passes, the streak is broken.` });
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[activeSpinner] = (gs.popularity[activeSpinner] || 0) + 1;
      }
      chickenStreak[activeSpinner] = 0;
      chickenStreakAnnounced[activeSpinner] = false;
      // Spinner accepts their own dare -> earns +1 freebie
      chain.push({ player: activeSpinner, action: 'accept', completed: true, freebieEarned: true,
        isSpinner: true, reaction: _acceptReaction(activeSpinner, category, dareTitle) });
      freebies[activeSpinner]++;
      completions[activeSpinner]++;
      _applyDareConsequence(activeSpinner, category, dareObj, chain, roundNum);
    } else {
      // Spinner passes the dare to someone else
      const redirectResult = _pickRedirectTarget(activeSpinner, remaining);
      if (!redirectResult || !redirectResult.target) {
        // No valid targets (solo?) -- spinner must accept
        if ((chickenStreak[activeSpinner] || 0) >= 3) {
          chain.push({ type: 'chickenStreakBroken', player: activeSpinner, priorStreak: chickenStreak[activeSpinner], round: roundNum,
            text: `${activeSpinner} finally steps up. After ${chickenStreak[activeSpinner]} passes, the streak is broken.` });
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[activeSpinner] = (gs.popularity[activeSpinner] || 0) + 1;
        }
        chickenStreak[activeSpinner] = 0;
        chickenStreakAnnounced[activeSpinner] = false;
        chain.push({ player: activeSpinner, action: 'accept', completed: true, freebieEarned: true,
          isSpinner: true, reaction: _acceptReaction(activeSpinner, category, dareTitle) });
        freebies[activeSpinner]++;
        completions[activeSpinner]++;
        _applyDareConsequence(activeSpinner, category, dareObj, chain, roundNum);
      } else {
        const target = redirectResult.target;
        chickenStreak[activeSpinner] = (chickenStreak[activeSpinner] || 0) + 1;
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
            if ((chickenStreak[target] || 0) >= 3) {
              chain.push({ type: 'chickenStreakBroken', player: target, priorStreak: chickenStreak[target], round: roundNum,
                text: `${target} finally steps up. After ${chickenStreak[target]} passes, the streak is broken.` });
              if (!gs.popularity) gs.popularity = {};
              gs.popularity[target] = (gs.popularity[target] || 0) + 1;
            }
            chickenStreak[target] = 0;
            chickenStreakAnnounced[target] = false;
            // Target pushes through (no freebie earned -- only spinners earn)
            chain.push({ player: target, action: 'accept', completed: true, freebieEarned: false,
              isSpinner: false, reaction: _acceptReaction(target, category, dareTitle) });
            completions[target]++;
            _applyDareConsequence(target, category, dareObj, chain, roundNum);
          } else {
            chickenStreak[target] = (chickenStreak[target] || 0) + 1;
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
            if ((chickenStreak[target] || 0) >= 3) {
              chain.push({ type: 'chickenStreakBroken', player: target, priorStreak: chickenStreak[target], round: roundNum,
                text: `${target} finally steps up. After ${chickenStreak[target]} passes, the streak is broken.` });
              if (!gs.popularity) gs.popularity = {};
              gs.popularity[target] = (gs.popularity[target] || 0) + 1;
            }
            chickenStreak[target] = 0;
            chickenStreakAnnounced[target] = false;
            // Pushes through despite having no safety net
            chain.push({ player: target, action: 'accept', completed: true, freebieEarned: false,
              isSpinner: false, reaction: _acceptReaction(target, category, dareTitle) });
            completions[target]++;
            _applyDareConsequence(target, category, dareObj, chain, roundNum);
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

    // ── Public reactions (max 2 per round) ──
    const roundReactions = [];
    const grossMishap = chain.find(e => e.type === 'dareMishap' && e.category === 'gross');
    if (grossMishap) {
      roundReactions.push({ type: 'publicReaction', subtype: 'disgust', round: roundNum,
        players: [grossMishap.player],
        text: `The crowd GAGS. ${grossMishap.player} just lost a bit of respect.` });
    }
    const physConseq = chain.find(e => e.type === 'dareConsequence' && e.category === 'physical');
    if (physConseq) {
      roundReactions.push({ type: 'publicReaction', subtype: 'cheer', round: roundNum,
        players: [physConseq.player],
        text: `The crowd WHOOPS for ${physConseq.player}. That was earned.` });
    }
    const pubConseq = chain.find(e => e.type === 'dareConsequence' && e.category === 'public');
    if (pubConseq) {
      roundReactions.push({ type: 'publicReaction', subtype: 'spotlight', round: roundNum,
        players: [pubConseq.player],
        text: `${pubConseq.player} has the whole camp watching. Eyes do not blink.` });
    }
    const truthConseq = chain.find(e => e.type === 'dareConsequence' && e.category === 'truth');
    if (truthConseq && truthConseq.namedTarget) {
      roundReactions.push({ type: 'publicReaction', subtype: 'tension', round: roundNum,
        players: [truthConseq.player, truthConseq.namedTarget],
        text: `${truthConseq.namedTarget} didn't see that coming. The game just changed.` });
    }
    const chickenAt3 = remaining.filter(p => (chickenStreak[p] || 0) >= 3);
    if (chickenAt3.length) {
      const worst = [...chickenAt3].sort((a, b) => (chickenStreak[b] || 0) - (chickenStreak[a] || 0))[0];
      roundReactions.push({ type: 'publicReaction', subtype: 'turning', round: roundNum,
        players: [worst],
        text: `The crowd is starting to turn on ${worst}. Every pass makes it worse.` });
    }
    roundReactions.slice(0, 2).forEach(r => chain.push(r));

    // ── Chicken-streak events (one escalate max per round) ──
    let escalateEmitted = false;
    activePlayers.filter(p => remaining.includes(p)).forEach(p => {
      const streak = chickenStreak[p] || 0;
      if (streak >= 3 && !chickenStreakAnnounced[p]) {
        chain.push({ type: 'chickenStreakStart', player: p, streak, round: roundNum,
          text: `${p} has passed ${streak} times in a row. The chicken meter is rising.`,
          badgeText: 'CHICKEN!', badgeClass: 'yellow' });
        chickenStreakAnnounced[p] = true;
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[p] = (gs.popularity[p] || 0) - 0.5;
      } else if (streak >= 4 && chickenStreakAnnounced[p] && !escalateEmitted) {
        chain.push({ type: 'chickenStreakEscalate', player: p, streak, round: roundNum,
          text: `${p} passes again. That's ${streak} in a row.`,
          badgeText: 'CHICKEN METER', badgeClass: 'yellow' });
        escalateEmitted = true;
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[p] = (gs.popularity[p] || 0) - 0.5;
      }
    });

    // ── Decrement fatigue ──
    activePlayers.filter(p => remaining.includes(p)).forEach(p => {
      if (dareFatigue[p] > 0) dareFatigue[p]--;
    });

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
    freebiesAtEnd: { ...freebies },
    finalChickens: { ...chickenStreak },
    completions: { ...completions },
    eliminated: eliminatedPlayer, eliminatedRound, eliminatedDare,
    mostDares, playerCount: activePlayers.length,
    activePlayers: [...activePlayers],
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

  sec('I TRIPLE DOG DARE YOU!');
  ln(`${tdd.playerCount} players · ${(tdd.rounds || []).length} rounds · Sudden-death elimination`);
  ln('');

  if (tdd.pacts?.length) {
    sec('PACTS');
    tdd.pacts.forEach(p => ln(`  ${p.initiator} + ${p.partner} → target: ${p.target} (round ${p.formedRound})`));
    ln('');
  }

  let curRound = null;
  (tdd.rounds || []).forEach(round => {
    if (round.roundNum !== curRound) {
      curRound = round.roundNum;
      ln('');
      sec(`ROUND ${curRound}`);
    }
    ln(`  [DARE · ${(round.dareCategory || '').toUpperCase()}] "${round.dareText || round.dareTitle || ''}"`);
    (round.chain || []).forEach(step => {
      const type = step.type || step.action || '';
      if (step.action === 'accept' && step.freebieEarned) ln(`    ${step.player} ACCEPTS — earns a freebie`);
      else if (step.action === 'accept' && !step.freebieEarned && step.completed !== false) ln(`    ${step.player} PUSHES THROUGH`);
      else if (step.action === 'pass') ln(`    ${step.player} PASSES → ${step.to}${step.isBetrayal ? ' [BETRAYAL]' : ''}`);
      else if (step.action === 'freebie-skip') ln(`    ${step.player} USES FREEBIE to skip`);
      else if (step.action === 'refuse' || (step.action === 'accept' && step.completed === false)) ln(`    ${step.player} REFUSES — ELIMINATED`);
      else if (type === 'dareMishap') ln(`    [MISHAP] ${step.player}: ${step.text || ''}`);
      else if (type === 'dareConsequence') ln(`    [CONSEQUENCE · ${(step.category || '').toUpperCase()}] ${step.text || ''}`);
      else if (type === 'chickenStreakStart') ln(`    [CHICKEN STREAK] ${step.player} at ${step.streak} passes`);
      else if (type === 'chickenStreakEscalate') ln(`    [CHICKEN ESCALATES] ${step.player} at ${step.streak} passes`);
      else if (type === 'chickenStreakBroken') ln(`    [STREAK BROKEN] ${step.player} after ${step.priorStreak} passes`);
      else if (type === 'publicReaction') ln(`    [CROWD · ${step.subtype || '?'}] ${step.text || ''}`);
      else if (type === 'freebieGift') ln(`    [GIFT] ${step.from || step.donor} → ${step.to || step.requester}`);
    });
  });

  ln('');
  if (tdd.freebieGifts?.length) {
    sec('FREEBIE GIFTS');
    tdd.freebieGifts.forEach(g => ln(`  Round ${g.round}: ${g.from} → ${g.to}`));
    ln('');
  }
  if (tdd.betrayals?.length) {
    sec('BETRAYALS');
    tdd.betrayals.forEach(b => ln(`  Round ${b.round}: ${b.player} → ${b.target} [${b.type}]`));
    ln('');
  }
  sec('FINAL FREEBIE COUNTS');
  Object.entries(tdd.freebiesAtEnd || {}).sort(([,a],[,b]) => b - a)
    .forEach(([name, count]) => ln(`  ${name}: ${count}`));
  ln('');
  if (tdd.eliminated) {
    sec('ELIMINATION');
    ln(`  ${tdd.eliminated} — round ${tdd.eliminatedRound}`);
    if (tdd.eliminatedDare?.text) ln(`  Dare: "${tdd.eliminatedDare.text}" [${tdd.eliminatedDare.category}]`);
  }
  if (tdd.mostDares) {
    ln('');
    sec('DAREDEVIL');
    ln(`  ${tdd.mostDares} (${tdd.completions?.[tdd.mostDares] || 0} completions)`);
  }
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
  const _catColor = { 'gross': '#ff2d87', 'public': '#3aff7a', 'physical': '#ffe83a', 'truth': '#3ef0ff', 'gross-out': '#3fb950', 'humiliation': '#db61a2', 'pain-fear': '#da3633', 'sacrifice': '#e3b341', 'fallback': '#8b949e' };
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
  const catColor = { 'gross': '#ff2d87', 'public': '#3aff7a', 'physical': '#ffe83a', 'truth': '#3ef0ff', 'gross-out': '#3fb950', 'humiliation': '#db61a2', 'pain-fear': '#da3633', 'sacrifice': '#e3b341', 'fallback': '#8b949e' }[tdd.eliminatedDare?.category] || '#8b949e';

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

// ════════════════════════════════════════════════════════════════════════
//  PLAYGROUND CHAOS — CSS + VP Identity
// ════════════════════════════════════════════════════════════════════════

const TDD_STYLES = `
  .tdd-page {
    background:#2a2a2a;
    color:#f0ece2;
    font-family:'Kalam','Patrick Hand','Chalkboard SE','Comic Sans MS',cursive;
    position:relative; overflow:hidden; padding:30px 20px; min-height:600px;
  }
  .tdd-page::before {
    content:''; position:absolute; inset:0; pointer-events:none; z-index:0;
    background:
      radial-gradient(circle at 15% 25%, rgba(240,236,226,0.08) 0%, transparent 8%),
      radial-gradient(circle at 75% 40%, rgba(240,236,226,0.05) 0%, transparent 10%),
      radial-gradient(circle at 45% 70%, rgba(240,236,226,0.07) 0%, transparent 9%),
      radial-gradient(circle at 85% 85%, rgba(240,236,226,0.04) 0%, transparent 7%);
    animation: tdd-chalk-dust-drift 12s ease-in-out infinite alternate;
  }
  @keyframes tdd-chalk-dust-drift {
    0%,100% { transform:translate(0,0) }
    50% { transform:translate(3px,-4px) }
  }
  .tdd-page > * { position:relative; z-index:2; }
  .tdd-header {
    text-align:center; padding:20px 12px 16px;
    border-bottom:3px dashed rgba(240,236,226,0.25);
    margin-bottom:16px;
  }
  .tdd-title {
    font-family:'Permanent Marker','Kalam',cursive;
    font-size:36px; font-weight:900; letter-spacing:2px;
    color:#f0ece2; text-transform:uppercase;
    text-shadow:2px 3px 0 rgba(0,0,0,0.4);
    transform:rotate(-1.5deg); display:inline-block;
  }
  .tdd-subtitle {
    font-size:13px; color:#ffd447; letter-spacing:1px;
    margin-top:10px; font-family:'Kalam',cursive;
  }
  .tdd-chalk-stars { font-size:18px; color:#ffd447; letter-spacing:8px; margin-top:6px; opacity:0.7; }
  .tdd-scoreboard {
    margin-bottom:20px; padding:14px 18px; border-radius:6px;
    background:rgba(0,0,0,0.25); border:2px dashed rgba(240,236,226,0.25);
  }
  .tdd-scoreboard-title {
    font-family:'Permanent Marker',cursive; font-size:14px; letter-spacing:2px;
    color:#f0ece2; text-transform:uppercase; margin-bottom:10px;
    transform:rotate(-0.5deg); display:inline-block;
  }
  .tdd-scoreboard-row {
    display:flex; align-items:center; gap:10px;
    padding:6px 4px; font-family:'Kalam',cursive; font-size:15px;
    border-bottom:1px dotted rgba(240,236,226,0.15);
  }
  .tdd-scoreboard-row:last-child { border-bottom:none; }
  .tdd-scoreboard-name { flex:1; color:#f0ece2; }
  .tdd-scoreboard-name--elim { text-decoration:line-through; text-decoration-color:#d92424; text-decoration-thickness:3px; opacity:0.6; }
  .tdd-bracelet-stack { display:inline-flex; gap:2px; }
  .tdd-bracelet {
    width:8px; height:16px; border-radius:3px;
    background:repeating-linear-gradient(90deg, var(--ba,#ff2d87) 0 2px, var(--bb,#3ef0ff) 2px 4px);
    border:1px solid rgba(0,0,0,0.3);
  }
  .tdd-bracelet:nth-child(1) { --ba:#ff2d87; --bb:#ffe83a; }
  .tdd-bracelet:nth-child(2) { --ba:#3ef0ff; --bb:#3aff7a; }
  .tdd-bracelet:nth-child(3) { --ba:#ffd447; --bb:#ff2d87; }
  .tdd-bracelet:nth-child(4) { --ba:#3aff7a; --bb:#3ef0ff; }
  .tdd-bracelet:nth-child(5) { --ba:#ff2d87; --bb:#3ef0ff; }
  .tdd-bracelet:nth-child(6) { --ba:#ffe83a; --bb:#3aff7a; }
  .tdd-chicken { display:inline-block; font-size:18px; margin-left:4px; transition:transform 0.3s cubic-bezier(0.2,1.5,0.5,1); }
  .tdd-chicken[data-streak="3"] { transform:scale(1.0); }
  .tdd-chicken[data-streak="4"] { transform:scale(1.35); }
  .tdd-chicken[data-streak="5"] { transform:scale(1.7); }
  .tdd-chicken[data-streak="6"] { transform:scale(2.0); }
  .tdd-card {
    margin-bottom:10px; padding:14px 18px; border-radius:4px;
    font-family:'Kalam',cursive; font-size:14px; line-height:1.5;
    animation: tdd-card-fade 0.5s ease-out both;
  }
  @keyframes tdd-card-fade { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
  .tdd-card--chalk { background:rgba(0,0,0,0.3); color:#f0ece2; border:2px dashed rgba(240,236,226,0.2); }
  .tdd-card--paper {
    background:#f4e8c8; color:#1a1a1a;
    border:1px solid rgba(139,90,43,0.3); box-shadow:2px 3px 6px rgba(0,0,0,0.35);
    position:relative; overflow:hidden;
  }
  .tdd-card--paper::before {
    content:''; position:absolute; inset:10px 16px;
    background:repeating-linear-gradient(to bottom, transparent 0 24px, rgba(100,120,150,0.12) 24px 25px);
    pointer-events:none;
  }
  .tdd-card--paper > * { position:relative; z-index:1; }
  .tdd-card--chris { background:rgba(40,40,40,0.6); border-left:4px solid #ffd447; }
  .tdd-card--mishap { background:rgba(40,0,0,0.4); border:2px solid #d92424; }
  .tdd-cat { display:inline-block; padding:2px 8px; border-radius:3px;
    font-family:'Permanent Marker',cursive; font-size:11px; letter-spacing:2px;
    text-transform:uppercase; font-weight:700; transform:rotate(-2deg); }
  .tdd-cat--gross    { background:#ff2d87; color:#f0ece2; }
  .tdd-cat--physical { background:#ffe83a; color:#1a1a1a; }
  .tdd-cat--truth    { background:#3ef0ff; color:#1a1a1a; }
  .tdd-cat--public   { background:#3aff7a; color:#1a1a1a; }
  .tdd-dare-text {
    font-family:'Permanent Marker','Kalam',cursive;
    font-size:21px; line-height:1.35; color:#1a1a1a;
    transform:rotate(-0.3deg); margin:10px 0;
    overflow:hidden; white-space:pre-wrap;
  }
  .tdd-spinner-wrap {
    display:flex; flex-direction:column; align-items:center; gap:10px;
    padding:20px 0; margin:10px auto;
  }
  .tdd-spinner-svg { width:200px; height:200px; overflow:visible; }
  .tdd-spinner-circle {
    fill:none; stroke:#f0ece2; stroke-width:4;
    stroke-dasharray:5 3 7 4 6 2 9 3; stroke-linecap:round;
  }
  .tdd-spinner-arrow {
    stroke:#1a1a1a; stroke-width:5; stroke-linecap:round; fill:none;
    transform-origin:100px 100px;
  }
  .tdd-spinner-result {
    font-family:'Permanent Marker',cursive; font-size:24px;
    color:#ffd447; letter-spacing:2px; transform:rotate(-2deg);
    opacity:0; transition:opacity 0.4s ease-out 0.2s;
  }
  .tdd-spinner-result--visible { opacity:1; }
  .tdd-burst-wrap { position:relative; display:inline-block; }
  .tdd-burst { position:absolute; top:50%; left:50%; width:2px; height:14px;
    background:#f0ece2; transform-origin:center bottom;
    animation: tdd-burst 0.4s ease-out forwards;
  }
  @keyframes tdd-burst {
    0% { opacity:0; transform:translate(-50%,-50%) rotate(var(--a,0deg)) scaleY(0); }
    30% { opacity:1; transform:translate(-50%,-50%) rotate(var(--a,0deg)) scaleY(1); }
    100% { opacity:0; transform:translate(-50%,-50%) rotate(var(--a,0deg)) scaleY(1.5) translateY(-8px); }
  }
  .tdd-chicken-setpiece {
    text-align:center; padding:26px;
    background:radial-gradient(ellipse at center, rgba(255,212,71,0.12) 0%, rgba(0,0,0,0.3) 70%);
    border-radius:6px; margin:12px 0;
  }
  .tdd-chicken-big {
    font-size:64px; line-height:1; display:inline-block;
    animation: tdd-chicken-grow 0.6s cubic-bezier(0.2,1.5,0.5,1) both;
  }
  @keyframes tdd-chicken-grow {
    0% { transform:scale(0.2) rotate(-10deg); opacity:0; }
    70% { transform:scale(1.2) rotate(4deg); opacity:1; }
    100% { transform:scale(1) rotate(0deg); }
  }
  .tdd-chicken-caption {
    font-family:'Permanent Marker',cursive; font-size:17px;
    color:#ffd447; letter-spacing:2px; margin-top:10px; text-transform:uppercase;
  }
  .tdd-crowd-figures {
    font-size:22px; letter-spacing:10px; color:#f0ece2;
    opacity:0.5; margin-top:12px;
    animation: tdd-crowd-fade 0.8s ease-out 0.4s both;
  }
  @keyframes tdd-crowd-fade { 0%{opacity:0} 100%{opacity:0.5} }
  .tdd-gift-card {
    display:flex; align-items:center; gap:12px; flex-wrap:wrap;
    padding:14px; border-radius:6px;
    background:rgba(62,240,255,0.08); border:2px dashed rgba(62,240,255,0.35);
    margin-bottom:10px;
  }
  .tdd-gift-from, .tdd-gift-to { flex:0 0 auto; text-align:center; min-width:48px; }
  .tdd-gift-pass {
    flex:1; text-align:center;
    font-family:'Permanent Marker',cursive; font-size:13px;
    color:#3ef0ff; letter-spacing:3px;
  }
  .tdd-gift-bracelet {
    display:inline-block; width:30px; height:10px; border-radius:4px;
    background:repeating-linear-gradient(90deg, #ff2d87 0 3px, #3ef0ff 3px 6px, #3aff7a 6px 9px);
    animation: tdd-bracelet-slide 0.8s cubic-bezier(0.4,0.1,0.3,1) both;
  }
  @keyframes tdd-bracelet-slide {
    0% { transform:translateX(-50px); opacity:0; }
    50% { opacity:1; }
    100% { transform:translateX(50px); opacity:1; }
  }
  .tdd-reaction {
    padding:12px 16px; margin:8px 0;
    background:rgba(0,0,0,0.25); border-left:3px solid #ffd447;
    font-style:italic; font-size:13px; color:#f0ece2;
  }
  .tdd-reaction-crowd { font-size:18px; letter-spacing:8px; color:#f0ece2; opacity:0.4; margin-top:6px; }
  .tdd-elim {
    text-align:center; padding:32px 20px; margin:20px 0;
    background:repeating-linear-gradient(45deg, rgba(217,36,36,0.1) 0 30px, rgba(0,0,0,0.4) 30px 60px);
    border:3px solid #d92424; border-radius:6px;
  }
  .tdd-elim-name {
    font-family:'Permanent Marker',cursive; font-size:40px;
    color:#f0ece2; letter-spacing:3px; transform:rotate(-2deg);
    display:inline-block; position:relative; padding:0 10px;
  }
  .tdd-elim-slash {
    position:absolute; top:50%; left:-6%; right:-6%; height:6px;
    background:#d92424; transform-origin:left center;
    animation: tdd-slash 0.8s cubic-bezier(0.6,0.1,0.3,1) 0.3s both;
  }
  @keyframes tdd-slash {
    0% { transform:rotate(-6deg) scaleX(0); }
    100% { transform:rotate(-6deg) scaleX(1); }
  }
  .tdd-elim-caption { margin-top:18px; font-family:'Kalam',cursive; font-size:16px; color:#f4e8c8; font-style:italic; }
  .tdd-btn-reveal {
    display:block; margin:20px auto; padding:10px 28px;
    background:transparent; border:3px dashed #ffd447; color:#ffd447;
    font-family:'Permanent Marker',cursive; font-size:14px;
    letter-spacing:3px; text-transform:uppercase; cursor:pointer; border-radius:4px;
    transition:transform 0.2s;
  }
  .tdd-btn-reveal:hover { transform:rotate(-1deg) scale(1.03); }
  .tdd-btn-reveal-all {
    display:block; text-align:center; font-family:'Kalam',cursive;
    font-size:12px; color:#ffd447; opacity:0.6;
    cursor:pointer; text-decoration:underline; margin-top:4px;
  }
  @media (prefers-reduced-motion: reduce) {
    .tdd-page::before, .tdd-card, .tdd-chicken-big, .tdd-crowd-figures,
    .tdd-gift-bracelet, .tdd-elim, .tdd-elim-slash, .tdd-burst,
    .tdd-chicken { animation:none !important; transition:none !important; }
    .tdd-spinner-result--visible { opacity:1 !important; }
    .tdd-elim-slash { transform:rotate(-6deg) scaleX(1) !important; }
  }
`;

// ── Reveal state + engine ──
const _tvStateTDD = {};

function _tddReveal(stateKey, totalSteps) {
  if (!_tvStateTDD[stateKey]) _tvStateTDD[stateKey] = { idx: -1 };
  const st = _tvStateTDD[stateKey];
  if (st.idx >= totalSteps - 1) return;
  st.idx++;
  const el = document.getElementById(`tdd-step-${stateKey}-${st.idx}`);
  if (el) {
    el.style.display = '';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (el.dataset.typewriter === '1') {
      const target = el.querySelector('.tdd-dare-text');
      if (target) {
        const fullText = target.dataset.fullText || target.textContent;
        target.dataset.fullText = fullText;
        target.textContent = '';
        const speed = fullText.length > 60 ? 30 : 50;
        let i = 0;
        const tick = () => {
          if (i > fullText.length) return;
          target.textContent = fullText.slice(0, i);
          i++;
          if (i <= fullText.length) setTimeout(tick, speed);
        };
        tick();
      }
    }
    if (el.dataset.spinnerTarget) {
      const arrow = el.querySelector('.tdd-spinner-arrow');
      const resultLabel = el.querySelector('.tdd-spinner-result');
      const targetAngle = parseFloat(el.dataset.spinnerTarget);
      if (arrow) {
        const start = performance.now();
        const dur = 1400;
        const total = 360 * 3 + targetAngle;
        const spin = (now) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          arrow.style.transform = `rotate(${total * eased}deg)`;
          if (t < 1) {
            requestAnimationFrame(spin);
          } else {
            let osc = 0;
            const settle = () => {
              const jitter = (osc % 2 === 0 ? 4 : -3) - osc * 0.8;
              arrow.style.transform = `rotate(${total + jitter}deg)`;
              osc++;
              if (osc < 4) setTimeout(settle, 100);
              else {
                arrow.style.transform = `rotate(${total}deg)`;
                if (resultLabel) resultLabel.classList.add('tdd-spinner-result--visible');
              }
            };
            setTimeout(settle, 80);
          }
        };
        requestAnimationFrame(spin);
      }
    }
  }
  const btn = document.getElementById(`tdd-btn-${stateKey}`);
  if (btn) {
    if (st.idx >= totalSteps - 1) {
      const ctrl = document.getElementById(`tdd-controls-${stateKey}`);
      if (ctrl) ctrl.style.display = 'none';
    } else {
      btn.textContent = `\u25B6 NEXT DARE (${st.idx + 2}/${totalSteps})`;
    }
  }
}

function _tddRevealAll(stateKey, totalSteps) {
  if (!_tvStateTDD[stateKey]) _tvStateTDD[stateKey] = { idx: -1 };
  _tvStateTDD[stateKey].idx = totalSteps - 1;
  for (let i = 0; i < totalSteps; i++) {
    const el = document.getElementById(`tdd-step-${stateKey}-${i}`);
    if (el) {
      el.style.display = '';
      if (el.dataset.typewriter === '1') {
        const tgt = el.querySelector('.tdd-dare-text');
        if (tgt && tgt.dataset.fullText) tgt.textContent = tgt.dataset.fullText;
      }
      if (el.dataset.spinnerTarget) {
        const arrow = el.querySelector('.tdd-spinner-arrow');
        const resultLabel = el.querySelector('.tdd-spinner-result');
        if (arrow) arrow.style.transform = `rotate(${parseFloat(el.dataset.spinnerTarget)}deg)`;
        if (resultLabel) resultLabel.classList.add('tdd-spinner-result--visible');
      }
    }
  }
  const ctrl = document.getElementById(`tdd-controls-${stateKey}`);
  if (ctrl) ctrl.style.display = 'none';
}

function _htmlEscapeTDD(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function _renderTDDScoreboard(tdd) {
  const pList = tdd.activePlayers || Object.keys(tdd.freebiesAtEnd || {});
  const freebies = tdd.freebiesAtEnd || {};
  const chickens = tdd.finalChickens || {};
  const eliminated = tdd.eliminated || null;
  let html = `<div class="tdd-scoreboard"><div class="tdd-scoreboard-title">\u00b7 THE RECESS WALL \u00b7</div>`;
  pList.forEach(p => {
    const n = Math.min(6, freebies[p] || 0);
    const bracelets = Array.from({ length: n }, () => `<span class="tdd-bracelet"></span>`).join('');
    const streak = chickens[p] || 0;
    const chicken = streak >= 3 ? `<span class="tdd-chicken" data-streak="${Math.min(streak,6)}">\uD83D\uDC14</span>` : '';
    const elimCls = p === eliminated ? ' tdd-scoreboard-name--elim' : '';
    html += `<div class="tdd-scoreboard-row">
      <span class="tdd-scoreboard-name${elimCls}">${_htmlEscapeTDD(p)}</span>
      <span class="tdd-bracelet-stack">${bracelets}</span>${chicken}
    </div>`;
  });
  html += `</div>`;
  return html;
}

function _renderTDDStep(evt, tdd) {
  const type = evt.type || evt.action || '';

  if (type === 'tddIntro') {
    return `<div class="tdd-card tdd-card--chris">
      <span style="font-size:10px;font-weight:700;letter-spacing:2px;color:#ffd447">\uD83D\uDCE2 CHRIS</span>
      <div style="margin-top:6px">${_htmlEscapeTDD(evt.text || '')}</div>
    </div>`;
  }

  if (type === 'spinnerLand') {
    return `<div class="tdd-spinner-wrap">
      <svg class="tdd-spinner-svg" viewBox="0 0 200 200">
        <circle class="tdd-spinner-circle" cx="100" cy="100" r="88"/>
        <path class="tdd-spinner-arrow" d="M100,100 L100,15"/>
      </svg>
      <div class="tdd-spinner-result">\u25b8 ${_htmlEscapeTDD(evt.player || '?')}</div>
    </div>`;
  }

  if (type === 'dareReveal') {
    const category = evt.category || 'gross';
    const dareText = evt.text || evt.dareText || '';
    return `<div class="tdd-card tdd-card--paper" data-typewriter="1">
      <span class="tdd-cat tdd-cat--${category}">${category}</span>
      <div class="tdd-dare-text" data-full-text="${_htmlEscapeTDD(dareText)}">${_htmlEscapeTDD(dareText)}</div>
      <div style="font-family:'Kalam',cursive;font-size:11px;color:#8b5a2b;letter-spacing:1px;margin-top:6px">\u2014 for ${_htmlEscapeTDD(evt.player || '?')} \u2014</div>
    </div>`;
  }

  if (type === 'accept' || evt.action === 'accept') {
    const burst = [0,45,90,135,180,225,270,315].map(a =>
      `<div class="tdd-burst" style="--a:${a}deg"></div>`
    ).join('');
    return `<div class="tdd-card tdd-card--chalk">
      <div class="tdd-burst-wrap">${burst}<strong>${_htmlEscapeTDD(evt.player || '?')}</strong></div>
      <span style="margin-left:8px">accepts. ${_htmlEscapeTDD(evt.reaction || evt.text || '')}</span>
      ${evt.freebieEarned ? '<div style="font-size:10px;color:#ffd447;margin-top:4px">+1 freebie earned</div>' : ''}
    </div>`;
  }

  if (type === 'pass' || evt.action === 'pass') {
    const betrayalTag = evt.isBetrayal ? '<span style="color:#d92424;font-weight:700;font-size:11px;margin-left:4px">BETRAYAL</span>' : '';
    return `<div class="tdd-card tdd-card--chalk">
      <strong>${_htmlEscapeTDD(evt.player || '?')}</strong> chickens \u2014 redirects to <strong>${_htmlEscapeTDD(evt.to || evt.target || '?')}</strong>${betrayalTag}
      <div style="margin-top:4px;font-size:12px;font-style:italic">${_htmlEscapeTDD(evt.reaction || evt.text || '')}</div>
    </div>`;
  }

  if (type === 'freebie-skip' || evt.action === 'freebie-skip') {
    return `<div class="tdd-card tdd-card--chalk" style="border-color:#ffd447">
      <strong>${_htmlEscapeTDD(evt.player || '?')}</strong> burns a freebie to skip.
      <div style="font-size:10px;color:#ffd447;margin-top:2px">\u22121 freebie</div>
      <div style="margin-top:4px;font-size:12px;font-style:italic">${_htmlEscapeTDD(evt.reaction || '')}</div>
    </div>`;
  }

  if (type === 'refuse' || evt.action === 'refuse') {
    return `<div class="tdd-card tdd-card--chalk" style="border-color:#d92424">
      <strong>${_htmlEscapeTDD(evt.player || '?')}</strong> <span style="color:#d92424;font-weight:700">REFUSES</span> \u2014 no freebies left.
      <div style="margin-top:4px;font-size:12px">${_htmlEscapeTDD(evt.reaction || '')}</div>
    </div>`;
  }

  if (type === 'freebieGift') {
    return `<div class="tdd-gift-card">
      <div class="tdd-gift-from"><strong>${_htmlEscapeTDD(evt.from || evt.donor || '?')}</strong></div>
      <div class="tdd-gift-pass">
        <div>PASS \u2192</div>
        <div><span class="tdd-gift-bracelet"></span></div>
      </div>
      <div class="tdd-gift-to"><strong>${_htmlEscapeTDD(evt.to || evt.requester || '?')}</strong></div>
      <div style="flex-basis:100%;text-align:center;font-size:12px;color:#f0ece2;margin-top:6px">${_htmlEscapeTDD(evt.text || '')}</div>
    </div>`;
  }

  if (type === 'dareMishap') {
    return `<div class="tdd-card tdd-card--mishap">
      <span class="tdd-cat tdd-cat--gross">MISHAP</span>
      <div style="margin-top:6px"><strong>${_htmlEscapeTDD(evt.player || '?')}</strong> \u2014 ${_htmlEscapeTDD(evt.text || '')}</div>
    </div>`;
  }

  if (type === 'dareConsequence') {
    const category = evt.category || 'gross';
    return `<div class="tdd-card tdd-card--chalk">
      <span class="tdd-cat tdd-cat--${category}">${category} result</span>
      <div style="margin-top:6px">${_htmlEscapeTDD(evt.text || '')}</div>
    </div>`;
  }

  if (type === 'chickenStreakStart' || type === 'chickenStreakEscalate') {
    const streak = evt.streak || 3;
    const chicken = streak <= 3 ? '\uD83D\uDC23' : streak === 4 ? '\uD83D\uDC14' : '\uD83D\uDC13';
    const crowd = '\uD83E\uDDD1'.repeat(Math.min(8, 2 + (streak - 3))).split('').join(' ');
    return `<div class="tdd-chicken-setpiece">
      <div class="tdd-chicken-big">${chicken}</div>
      <div class="tdd-chicken-caption">CHICKEN METER \u00b7 ${_htmlEscapeTDD(evt.player || '?')} \u00b7 ${streak} passes</div>
      <div class="tdd-crowd-figures">${crowd}</div>
    </div>`;
  }

  if (type === 'chickenStreakBroken') {
    return `<div class="tdd-card tdd-card--chalk" style="border-color:#3aff7a">
      <strong>${_htmlEscapeTDD(evt.player || '?')}</strong> finally accepts after ${evt.priorStreak || '?'} passes.
      <span style="color:#3aff7a;margin-left:4px">Streak broken.</span>
    </div>`;
  }

  if (type === 'publicReaction') {
    return `<div class="tdd-reaction">
      <div>${_htmlEscapeTDD(evt.text || '')}</div>
      <div class="tdd-reaction-crowd">\uD83E\uDDD1 \uD83E\uDDD1 \uD83E\uDDD1 \uD83E\uDDD1 \uD83E\uDDD1</div>
    </div>`;
  }

  if (type === 'dareElimination' || type === 'elimination') {
    return `<div class="tdd-elim">
      <div class="tdd-elim-name">
        ${_htmlEscapeTDD(evt.player || '?')}
        <span class="tdd-elim-slash"></span>
      </div>
      <div class="tdd-elim-caption">${_htmlEscapeTDD(evt.text || evt.reaction || 'Chickens out. Eliminated.')}</div>
    </div>`;
  }

  const text = evt.reaction || evt.text || '';
  const player = evt.player || '';
  if (text || player) {
    return `<div class="tdd-card tdd-card--chalk"><strong>${_htmlEscapeTDD(player)}</strong>${text ? ' ' + _htmlEscapeTDD(text) : ''}</div>`;
  }
  return '';
}

function _tddStepDataAttrs(evt) {
  const attrs = [];
  if (evt.type === 'dareReveal') attrs.push('data-typewriter="1"');
  if (evt.type === 'spinnerLand' && evt._spinnerAngle != null) {
    attrs.push(`data-spinner-target="${evt._spinnerAngle}"`);
  }
  return attrs.length ? ' ' + attrs.join(' ') : '';
}

export function rpBuildTripleDogDare(ep) {
  const tdd = ep.tripleDogDare;
  if (!tdd) return '';

  window._tddReveal = _tddReveal;
  window._tddRevealAll = _tddRevealAll;

  const stateKey = `tdd_${ep.num}`;
  if (!_tvStateTDD[stateKey]) _tvStateTDD[stateKey] = { idx: -1 };
  const state = _tvStateTDD[stateKey];

  const steps = [];

  steps.push({
    evt: { type: 'tddIntro', text: '"Last one standing wins immunity. First to chicken out goes home. Let\'s spin."', player: '' }
  });

  (tdd.rounds || []).forEach(round => {
    const roundGifts = (tdd.freebieGifts || []).filter(g => g.round === round.roundNum);
    roundGifts.forEach(g => {
      steps.push({ evt: { type: 'freebieGift', from: g.from, to: g.to, text: g.text, round: round.roundNum } });
    });

    const spinnerIdx = (tdd.activePlayers || []).indexOf(round.activeSpinner);
    const wedge = 360 / Math.max(1, (tdd.activePlayers || []).length);
    const spinAngle = spinnerIdx >= 0 ? spinnerIdx * wedge + wedge / 2 : Math.random() * 360;

    (round.chain || []).forEach(step => {
      if (step.type === 'spinnerLand') {
        steps.push({ evt: { ...step, _spinnerAngle: step._spinnerAngle ?? spinAngle } });
      } else if (step.type === 'dareReveal') {
        steps.push({ evt: step });
      } else {
        steps.push({ evt: { ...step, round: round.roundNum } });
      }
    });

    if (!(round.chain || []).some(s => s.type === 'spinnerLand')) {
      steps.splice(steps.length - (round.chain || []).length, 0,
        { evt: { type: 'spinnerLand', player: round.activeSpinner, round: round.roundNum, _spinnerAngle: spinAngle } }
      );
    }
    if (!(round.chain || []).some(s => s.type === 'dareReveal')) {
      const dareRevealIdx = steps.findIndex((s, i) => i >= steps.length - (round.chain || []).length && s.evt.type === 'spinnerLand');
      if (dareRevealIdx >= 0) {
        steps.splice(dareRevealIdx + 1, 0,
          { evt: { type: 'dareReveal', player: round.activeSpinner, category: round.dareCategory,
            text: round.dareText || round.dareTitle || '', round: round.roundNum } }
        );
      }
    }
  });

  const renderedSteps = steps.map((s, i) => {
    const html = _renderTDDStep(s.evt, tdd);
    if (!html) return null;
    return { html, evt: s.evt, i };
  }).filter(Boolean);

  let out = `<style>${TDD_STYLES}</style><div class="tdd-page rp-page">`;

  out += `<div class="tdd-header">
    <div class="tdd-title">I Triple Dog Dare You!</div>
    <div class="tdd-chalk-stars">\u2605 \u2605 \u2605</div>
    <div class="tdd-subtitle">The last one standing wins immunity \u00b7 The first one to chicken out goes home</div>
  </div>`;

  out += _renderTDDScoreboard(tdd);

  renderedSteps.forEach((s, idx) => {
    const visible = idx <= state.idx;
    const dataAttrs = _tddStepDataAttrs(s.evt);
    out += `<div id="tdd-step-${stateKey}-${idx}" style="${visible ? '' : 'display:none'}"${dataAttrs}>${s.html}</div>`;
  });

  const total = renderedSteps.length;
  const allRevealed = state.idx >= total - 1;
  const nextLabel = state.idx + 2 <= total ? `${state.idx + 2}/${total}` : `${total}/${total}`;
  out += `<div id="tdd-controls-${stateKey}" style="${allRevealed ? 'display:none' : 'text-align:center;margin-top:20px'}">
    <button class="tdd-btn-reveal" id="tdd-btn-${stateKey}" onclick="window._tddReveal('${stateKey}',${total})">\u25B6 NEXT DARE (${nextLabel})</button>
    <span class="tdd-btn-reveal-all" onclick="window._tddRevealAll('${stateKey}',${total})">reveal all</span>
  </div>`;

  out += `</div>`;
  return out;
}
