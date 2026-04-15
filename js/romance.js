// js/romance.js - Romance sparks, showmances, love triangles, affairs
import { gs, players, seasonConfig } from './core.js';
import { pStats, pronouns, romanticCompat, threatScore } from './players.js';
import { getBond, addBond } from './bonds.js';
import { SHOWMANCE_ARCHETYPE_MULT } from './camp-events.js';

export function _challengeRomanceSpark(a, b, ep, phaseKey, phases, personalScores, context) {
  if (seasonConfig.romance === 'disabled') return false;
  if (!gs.showmances) gs.showmances = [];
  // Cap: max 2 active showmances
  const activeShowmances = gs.showmances.filter(sh => sh.phase !== 'broken-up' && sh.players.every(p => gs.activePlayers.includes(p)));
  if (activeShowmances.length >= 2) return false;
  // Already a showmance?
  if (gs.showmances.some(sh => sh.players.includes(a) && sh.players.includes(b))) return false;
  // Romantic compatibility
  if (typeof romanticCompat === 'function' && !romanticCompat(a, b)) return false;
  // Bond check — challenge moments use lower threshold since the moment itself is romantic
  const bond = getBond(a, b);
  const aArch = players.find(p => p.name === a)?.archetype || '';
  const bArch = players.find(p => p.name === b)?.archetype || '';
  const isShowmancer = aArch === 'showmancer' || bArch === 'showmancer';
  const threshold = isShowmancer ? 3.5 : 4.5; // lower than normal (5-6) because the moment is charged
  if (bond < threshold) return false;
  // Proportional spark chance
  const sparkChance = (bond - threshold) * 0.08 + (isShowmancer ? 0.10 : 0.03);
  if (Math.random() >= sparkChance) return false;

  // SPARK! Create a romantic spark — not a showmance yet (slow burn)
  const epNum = (gs.episode || 0) + 1;
  if (!gs.romanticSparks) gs.romanticSparks = [];
  // Don't duplicate sparks for the same pair
  if (gs.romanticSparks.some(sp => sp.players.includes(a) && sp.players.includes(b))) return false;
  gs.romanticSparks.push({
    players: [a, b],
    sparkEp: epNum,
    context: context,
    intensity: 0.3,
    fake: false,
    saboteur: null,
  });
  const prA = pronouns(a), prB = pronouns(b);
  const _sparkTexts = [
    `Something shifts between ${a} and ${b} during the ${context}. A look. A touch. By the time it's over, the tribe can see it.`,
    `${a} and ${b} were close before. After the ${context}, they're something else. The tribe notices. Everyone notices.`,
    `It started as teamwork. But the way ${a} looks at ${b} after the ${context} — that's not strategy. That's a spark.`,
    `${b} catches ${a} staring during the ${context}. Neither looks away. The showmance has begun.`,
    `The ${context} changed things between ${a} and ${b}. What was friendship is now something the tribe is going to have opinions about.`,
  ];
  const sparkText = _sparkTexts[Math.floor(Math.random() * _sparkTexts.length)];
  addBond(a, b, 0.5);
  if (personalScores) { personalScores[a] = (personalScores[a] || 0) + 0.5; personalScores[b] = (personalScores[b] || 0) + 0.5; }
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[a] = (gs.popularity[a] || 0) + 2;
  gs.popularity[b] = (gs.popularity[b] || 0) + 2;
  if (phases && phaseKey) {
    phases[phaseKey].push({
      type: 'soShowmance', phase: phaseKey, players: [a, b],
      text: sparkText, personalScores: { [a]: 0.5, [b]: 0.5 },
      badge: 'ROMANCE SPARK', badgeClass: 'gold'
    });
  }
  return true;
}

export function updateRomanticSparks(ep) {
  if (seasonConfig.romance === 'disabled') return;
  if (!gs.romanticSparks) gs.romanticSparks = [];

  // Grow or decay each spark
  gs.romanticSparks.forEach(spark => {
    if (spark.fake) return; // fake sparks don't grow
    const [a, b] = spark.players;
    if (!gs.activePlayers.includes(a) || !gs.activePlayers.includes(b)) return;

    const bond = getBond(a, b);

    // Passive growth if bond above threshold
    const aArch = players.find(p => p.name === a)?.archetype || '';
    const bArch = players.find(p => p.name === b)?.archetype || '';
    const isShowmancer = aArch === 'showmancer' || bArch === 'showmancer';
    const bondThreshold = isShowmancer ? 3.0 : 4.0;
    if (bond > bondThreshold) spark.intensity += 0.1;

    // Bond grew this episode → boost
    // (Approximation: if bond is high, assume positive interactions happened)
    if (bond >= 3) spark.intensity += 0.05;

    // Negative decay: if bond dropped or they voted against each other
    if (bond < 2.0) spark.intensity -= 0.3;

    // Same tribe camp event boost (proportional to bond)
    const sameTribe = gs.tribes.some(t => t.members.includes(a) && t.members.includes(b));
    if (sameTribe && bond >= 3) spark.intensity += 0.1;
  });

  // Remove dead sparks (bond too low or intensity gone negative)
  gs.romanticSparks = gs.romanticSparks.filter(spark => {
    const [a, b] = spark.players;
    if (!gs.activePlayers.includes(a) || !gs.activePlayers.includes(b)) return false;
    if (getBond(a, b) < 2.0) return false;
    if (spark.intensity < 0) return false;
    return true;
  });
}

export function checkFirstMove(ep) {
  if (seasonConfig.romance === 'disabled') return;
  if (!gs.romanticSparks?.length) return;

  const FIRST_MOVE_THRESHOLDS = {
    'showmancer': 0.5, 'chaos-agent': 0.6, 'villain': 0.8, 'schemer': 0.8,
    'mastermind': 0.8, 'hero': 1.0, 'loyal': 1.2, 'loyal-soldier': 1.2,
    'protector': 1.2, 'social-butterfly': 0.7, 'wildcard': 0.7, '_default': 0.8,
  };

  const FIRST_MOVE_TEXTS = {
    'showmancer': [
      (a, b, pr) => `${a} doesn't hesitate. Crosses the distance. Kisses ${b}. The tribe goes dead silent — then erupts.`,
      (a, b, pr) => `${a} takes ${b}'s face in ${pr.posAdj} hands. No words needed. The first kiss lands and the game changes.`,
      (a, b, pr) => `It's been building for days. ${a} finally goes for it. ${b} doesn't pull away. The tribe watches, stunned.`,
    ],
    'chaos-agent': [
      (a, b, pr) => `Mid-argument. ${a} grabs ${b} and kisses ${pr.obj}. Everyone stares. ${a} shrugs. "What? It was obvious."`,
      (a, b, pr) => `${a} kisses ${b} out of nowhere. In front of everyone. At the worst possible moment. Nobody saw it coming.`,
      (a, b, pr) => `${a} interrupts ${b} mid-sentence with a kiss. The timing is insane. The tribe doesn't know whether to cheer or cringe.`,
    ],
    'villain': [
      (a, b, pr) => `What started as strategy is on ${a}'s face now — something ${pr.sub} didn't plan. The way ${pr.sub} ${pr.sub === 'they' ? 'look' : 'looks'} at ${b} isn't calculated anymore.`,
      (a, b, pr) => `${a} leans in close to whisper something strategic. Stops. The gap between them disappears. This wasn't the plan.`,
      (a, b, pr) => `${a} was playing ${b}. Everyone knows it. The problem is, somewhere along the way, ${a} stopped pretending.`,
    ],
    'hero': [
      (a, b, pr) => `${a} pulls ${b} out of harm's way. They're close. Too close. ${a}: "I couldn't let anything happen to you." Neither of them moves.`,
      (a, b, pr) => `After the danger passes, ${a} is still holding ${b}. The adrenaline fades. What's left isn't relief — it's something else.`,
      (a, b, pr) => `${a} doesn't say it with words. ${pr.Sub} just ${pr.sub === 'they' ? 'stand' : 'stands'} between ${b} and everything that could hurt ${pr.obj}. ${b} finally understands.`,
    ],
    'loyal': [
      (a, b, pr) => `${a} can't make eye contact. Stares at the ground. "I, um. I think I..." ${b} waits. ${a} can't finish. ${b} closes the distance instead.`,
      (a, b, pr) => `${a} has been trying to say it for three episodes. Finally: "I really like you." It comes out like an apology. ${b} smiles.`,
      (a, b, pr) => `${a} leaves a note. Handwritten. Awful penmanship. ${b} reads it alone. Finds ${a} by the fire. Doesn't say anything. Just sits closer.`,
    ],
    '_default': [
      (a, b, pr) => `They're alone. The fire is low. ${a} says something real. ${b} responds with something realer. When they look at each other after, everything is different.`,
      (a, b, pr) => `${a} reaches for ${b}'s hand. ${b} lets ${pr.obj}. They sit in silence. The tribe finds them like that in the morning.`,
      (a, b, pr) => `One of them says "I trust you." The other one means it when they say it back. That's the moment it becomes real.`,
    ],
  };

  gs.romanticSparks = gs.romanticSparks.filter(spark => {
    if (spark.fake) return true; // fake sparks don't get first moves
    const [a, b] = spark.players;
    if (!gs.activePlayers.includes(a) || !gs.activePlayers.includes(b)) return false;

    // Get slower archetype threshold
    const aArch = players.find(p => p.name === a)?.archetype || '_default';
    const bArch = players.find(p => p.name === b)?.archetype || '_default';
    const aThresh = FIRST_MOVE_THRESHOLDS[aArch] || FIRST_MOVE_THRESHOLDS._default;
    const bThresh = FIRST_MOVE_THRESHOLDS[bArch] || FIRST_MOVE_THRESHOLDS._default;
    const threshold = Math.max(aThresh, bThresh); // slower one sets the pace

    if (spark.intensity < threshold) return true; // not ready yet, keep spark

    // FIRST MOVE! Determine who makes the move (faster archetype)
    const mover = aThresh <= bThresh ? a : b;
    const receiver = mover === a ? b : a;
    const moverArch = mover === a ? aArch : bArch;
    const pr = pronouns(mover);

    // Pick text based on mover's archetype
    const textPool = FIRST_MOVE_TEXTS[moverArch] || FIRST_MOVE_TEXTS._default;
    const text = textPool[Math.floor(Math.random() * textPool.length)](mover, receiver, pr);

    // Create the actual showmance
    if (!gs.showmances) gs.showmances = [];
    // Check cap again
    const activeShowmances = gs.showmances.filter(sh => sh.phase !== 'broken-up' && sh.players.every(p => gs.activePlayers.includes(p)));
    if (activeShowmances.length >= 2) return true; // cap hit, keep spark alive

    // Determine romance origin type from spark context + mover archetype
    const _originType = moverArch === 'villain' || moverArch === 'schemer' ? 'strategic'
      : moverArch === 'chaos-agent' ? 'impulsive'
      : moverArch === 'hero' || moverArch === 'protector' ? 'protective'
      : moverArch === 'showmancer' ? 'instant-chemistry'
      : moverArch === 'loyal' || moverArch === 'loyal-soldier' ? 'slow-burn'
      : 'organic';
    gs.showmances.push({
      players: [a, b], phase: 'spark', sparkEp: spark.sparkEp,
      episodesActive: 0, tested: false, breakupEp: null, breakupVoter: null, breakupType: null,
      firstMoveEp: (gs.episode || 0) + 1, firstMoveBy: mover,
      origin: _originType, sparkContext: spark.context,
    });

    addBond(a, b, 0.5);
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[a] = (gs.popularity[a] || 0) + 3;
    gs.popularity[b] = (gs.popularity[b] || 0) + 3;

    // Camp event
    const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(mover))?.name || 'merge');
    if (!ep.campEvents) ep.campEvents = {};
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
    if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];
    ep.campEvents[campKey].post.push({
      type: 'firstMove', players: [mover, receiver],
      text: text, badgeText: 'FIRST MOVE', badgeClass: 'gold'
    });

    return false; // remove spark — it became a showmance
  });
}

export function checkShowmanceSabotage(ep) {
  if (seasonConfig.romance === 'disabled') return;
  if (!gs.showmances?.length) return;

  const NICE_ARCHS = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
  const activeShowmances = gs.showmances.filter(sh =>
    sh.phase !== 'broken-up' && sh.players.every(p => gs.activePlayers.includes(p))
  );
  if (!activeShowmances.length) return;

  // Find potential saboteurs
  gs.activePlayers.forEach(saboteur => {
    const arch = players.find(p => p.name === saboteur)?.archetype || '';
    if (!['villain', 'schemer', 'mastermind'].includes(arch)) return;
    const sS = pStats(saboteur);

    // Proportional chance
    const chance = (10 - sS.loyalty) * 0.02 + sS.strategic * 0.015;
    if (Math.random() >= chance) return;

    // Find a showmance where saboteur hates one member
    const targetShowmance = activeShowmances.find(sh => {
      return sh.players.some(p => getBond(saboteur, p) <= -2) &&
        !sh.players.includes(saboteur);
    });
    if (!targetShowmance) return;

    // Target = the one the saboteur hates. Partner = the one they'll kiss.
    const target = targetShowmance.players.find(p => getBond(saboteur, p) <= -2);
    const partner = targetShowmance.players.find(p => p !== target);
    if (!target || !partner) return;

    // Saboteur must be romantically plausible with the partner (sexuality check)
    // A straight male can't fake-kiss another male — it wouldn't be believable
    if (typeof romanticCompat === 'function' && !romanticCompat(saboteur, partner)) return;

    // Must be accessible (same tribe or post-merge)
    const accessible = gs.isMerged || gs.tribes.some(t => t.members.includes(saboteur) && t.members.includes(partner));
    if (!accessible) return;

    const prS = pronouns(saboteur);
    const prP = pronouns(partner);
    const prT = pronouns(target);

    const _sabTexts = [
      `${saboteur} corners ${partner} alone. What follows looks romantic from a distance — and that's exactly what ${saboteur} wanted. By the time ${target} walks around the corner, the damage is done.`,
      `${saboteur} kisses ${partner}. It's calculated. ${partner} is confused. ${target} sees everything. The showmance will never be the same.`,
      `${saboteur} engineers a private moment with ${partner}. A touch, a whisper, a look that lasts too long. ${target} doesn't catch them — but someone else does, and word travels fast.`,
      `"I just thought you should know what your partner is really like." ${saboteur} doesn't need to lie. ${prS.Sub} just needs to create doubt. The kiss was the weapon. The rumor is the bullet.`,
    ];

    // Consequences
    addBond(target, partner, -2.0);
    addBond(partner, saboteur, -1.5);
    addBond(partner, target, -1.0);

    // Partner gets heat (looks like cheater)
    if (!gs._upTheCreekHeat) gs._upTheCreekHeat = {};
    gs._upTheCreekHeat[partner] = { amount: 1.0, expiresEp: ((gs.episode || 0) + 1) + 1 };
    // Saboteur gets heat
    gs._upTheCreekHeat[saboteur] = { amount: 1.5, expiresEp: ((gs.episode || 0) + 1) + 2 };

    // Popularity
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[target] = (gs.popularity[target] || 0) + 3; // sympathy
    gs.popularity[partner] = (gs.popularity[partner] || 0) - 1; // looks bad

    // BigMoves for saboteur
    if (!gs.playerStates) gs.playerStates = {};
    if (!gs.playerStates[saboteur]) gs.playerStates[saboteur] = {};
    gs.playerStates[saboteur].bigMoves = (gs.playerStates[saboteur].bigMoves || 0) + 1;

    // People who disliked the target warm to saboteur
    gs.activePlayers.forEach(m => {
      if (m === saboteur || m === target || m === partner) return;
      if (getBond(m, target) <= -1) addBond(m, saboteur, 0.2);
    });

    // Witness bond damage to saboteur
    gs.activePlayers.filter(m => m !== saboteur && m !== target && m !== partner).forEach(m => {
      addBond(m, saboteur, -0.5);
    });

    // Showmance enters tested phase — 30% instant breakup
    targetShowmance.tested = true;
    if (Math.random() < 0.30) {
      targetShowmance.phase = 'broken-up';
      targetShowmance.breakupEp = (gs.episode || 0) + 1;
      targetShowmance.breakupType = 'sabotaged';
    }

    // Create fake spark (never becomes real)
    if (!gs.romanticSparks) gs.romanticSparks = [];
    gs.romanticSparks.push({
      players: [saboteur, partner], sparkEp: (gs.episode || 0) + 1,
      context: 'sabotage', intensity: 0, fake: true, saboteur: saboteur,
    });

    // Camp event
    const campKey = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(saboteur))?.name || 'merge');
    if (!ep.campEvents) ep.campEvents = {};
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
    if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];
    ep.campEvents[campKey].post.push({
      type: 'showmanceSabotage', players: [saboteur, partner, target],
      text: _sabTexts[Math.floor(Math.random() * _sabTexts.length)],
      badgeText: 'SHOWMANCE SABOTAGE', badgeClass: 'red'
    });
  });
}

export function _checkShowmanceChalMoment(ep, phaseKey, phases, personalScores, triggerType, tribeMembers) {
  if (seasonConfig.romance === 'disabled') return;
  if (!gs.showmances?.length) return;

  const activeShowmances = gs.showmances.filter(sh =>
    sh.phase !== 'broken-up' && sh.players.every(p => gs.activePlayers.includes(p))
  );
  if (!activeShowmances.length) return;

  // Max 1 showmance moment per challenge call
  let fired = false;

  activeShowmances.forEach(sh => {
    if (fired) return;
    const [a, b] = sh.players;
    // Both must be in the challenge (in tribeMembers)
    const allMembers = tribeMembers ? tribeMembers.flatMap(t => t.members || []) : gs.activePlayers;
    if (!allMembers.includes(a) || !allMembers.includes(b)) return;

    const prA = pronouns(a), prB = pronouns(b);
    const bond = getBond(a, b);

    // Select moment based on trigger type
    let moment = null;

    if (triggerType === 'danger' && Math.random() < 0.4) {
      // Protective Instinct
      const protector = pStats(a).boldness >= pStats(b).boldness ? a : b;
      const protected_ = protector === a ? b : a;
      const prP = pronouns(protector);
      const _texts = [
        `${protector} drops everything and grabs ${protected_}. "Stay behind me." The tribe loses a few seconds. ${protector} doesn't care.`,
        `${protector} puts ${prP.posAdj} body between ${protected_} and the danger. Instinct, not strategy. The tribe notices.`,
        `${protector} reaches for ${protected_} first. Not the canoe. Not the supplies. ${protected_}. That says everything.`,
      ];
      personalScores[protector] = (personalScores[protector] || 0) - 0.5;
      addBond(a, b, 0.4);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[protector] = (gs.popularity[protector] || 0) + 1;
      moment = { type: 'showmanceProtective', players: [protector, protected_],
        text: _texts[Math.floor(Math.random() * _texts.length)],
        personalScores: { [protector]: -0.5 }, badgeText: 'PROTECTIVE', badgeClass: 'gold' };

    } else if (triggerType === 'partner-interaction' && Math.random() < 0.3) {
      // Jealousy Flare
      const jealous = Math.random() < 0.5 ? a : b;
      const other = jealous === a ? b : a;
      const prJ = pronouns(jealous);
      const _texts = [
        `${jealous} sees ${other} laughing with someone else. ${prJ.PosAdj} jaw tightens. ${prJ.Sub} ${prJ.sub === 'they' ? 'say' : 'says'} nothing. The silence is loud.`,
        `${jealous} watches ${other} from across the camp. When ${other} finally comes back, the conversation is clipped. Something's wrong.`,
        `"Who was that?" ${jealous} tries to sound casual. ${prJ.Sub} ${prJ.sub === 'they' ? "don't" : "doesn't"}. ${other} notices.`,
      ];
      addBond(a, b, -0.3);
      moment = { type: 'showmanceJealousy', players: [jealous, other],
        text: _texts[Math.floor(Math.random() * _texts.length)],
        personalScores: {}, badgeText: 'JEALOUSY', badgeClass: 'red' };

    } else if (triggerType === 'teamwork' && Math.random() < 0.3) {
      // Sacrifice Play
      const sacrificer = pStats(a).loyalty >= pStats(b).loyalty ? a : b;
      const beneficiary = sacrificer === a ? b : a;
      const prS = pronouns(sacrificer);
      const _texts = [
        `${sacrificer} gives up ${prS.posAdj} share to ${beneficiary}. The tribe sees it. Some think it's sweet. Others think it's a liability.`,
        `${sacrificer} takes the harder task so ${beneficiary} doesn't have to. ${prS.Sub} ${prS.sub === 'they' ? "don't" : "doesn't"} even hesitate.`,
        `"Take mine." ${sacrificer} hands ${prS.posAdj} advantage to ${beneficiary}. The tribe is split between admiration and concern.`,
      ];
      personalScores[sacrificer] = (personalScores[sacrificer] || 0) - 1.0;
      addBond(a, b, 0.5);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[sacrificer] = (gs.popularity[sacrificer] || 0) + 2;
      const _bmState = gs.playerStates?.[sacrificer] || {};
      _bmState.bigMoves = (_bmState.bigMoves || 0) + 1;
      if (!gs.playerStates) gs.playerStates = {};
      gs.playerStates[sacrificer] = _bmState;
      moment = { type: 'showmanceSacrifice', players: [sacrificer, beneficiary],
        text: _texts[Math.floor(Math.random() * _texts.length)],
        personalScores: { [sacrificer]: -1.0 }, badgeText: 'SACRIFICE', badgeClass: 'gold' };

    } else if (Math.random() < 0.25) {
      // PDA Reaction (default fallback)
      const _texts = [
        `${a} and ${b} are not being subtle. The tribe has opinions. Some smile. Some roll their eyes. One person starts planning how to use it.`,
        `Everyone can see ${a} and ${b}. The looks. The whispered conversations. The tribe is watching and taking notes.`,
        `${a} and ${b} forget there are cameras. And a tribe. And a game. Someone coughs loudly. They don't notice.`,
      ];
      // Tribe reactions — bond shifts from observers
      allMembers.filter(m => m !== a && m !== b).forEach(m => {
        const mArch = players.find(p => p.name === m)?.archetype || '';
        if (['hero', 'loyal', 'social-butterfly'].includes(mArch)) addBond(m, a, 0.1);
        else if (['villain', 'schemer'].includes(mArch)) addBond(m, a, -0.1); // target forming
      });
      moment = { type: 'showmancePDA', players: [a, b],
        text: _texts[Math.floor(Math.random() * _texts.length)],
        personalScores: {}, badgeText: 'PDA', badgeClass: 'gold' };
    }

    if (moment) {
      phases[phaseKey].push({ ...moment, phase: phaseKey });
      fired = true;
    }
  });
}

export function getShowmance(name) {
  return (gs.showmances || []).find(sh => sh.players.includes(name) && sh.phase !== 'broken-up');
}

export function getShowmancePartner(name) {
  const sh = getShowmance(name);
  return sh ? sh.players.find(p => p !== name) : null;
}

export function checkShowmanceFormation(ep) {
  if (seasonConfig.romance === 'disabled') return;
  if (!gs.showmances) gs.showmances = [];
  const active = gs.activePlayers;

  // Cap: max 2 active showmances at a time — 3+ starts feeling like Love Island
  const activeShowmances = gs.showmances.filter(sh => sh.phase !== 'broken-up' && sh.players.every(p => active.includes(p)));
  if (activeShowmances.length >= 2) return;

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j];
      if (gs.showmances.some(sh => sh.players.includes(a) && sh.players.includes(b))) continue;

      // Must be on the same tribe (or post-merge) to develop a showmance
      const sameTribe = gs.isMerged || gs.tribes.some(t => t.members.includes(a) && t.members.includes(b));
      if (!sameTribe) continue;
      // Must be romantically compatible (sexuality check)
      if (!romanticCompat(a, b)) continue;

      const bond = getBond(a, b);
      const aArch = players.find(p => p.name === a)?.archetype || '';
      const bArch = players.find(p => p.name === b)?.archetype || '';
      const aIsShowmancer = aArch === 'showmancer';
      const bIsShowmancer = bArch === 'showmancer';

      // Spark bonus: if a romantic spark exists for this pair, lower the threshold
      const existingSpark = (gs.romanticSparks || []).find(sp => sp.players.includes(a) && sp.players.includes(b) && !sp.fake);
      const sparkBonus = existingSpark ? 1.5 : 0;

      const threshold = ((aIsShowmancer || bIsShowmancer) ? 5 : 6) - sparkBonus;
      if (bond < threshold) continue;

      // Base probability is low — this should be special, not routine
      const aMult = SHOWMANCE_ARCHETYPE_MULT[aArch] ?? 0.50;
      const bMult = SHOWMANCE_ARCHETYPE_MULT[bArch] ?? 0.50;
      // Combine multipliers: geometric mean so both archetypes influence the result
      const combinedMult = Math.sqrt(aMult * bMult);
      const chance = Math.min(0.40, 0.07 * combinedMult);
      if (Math.random() >= chance) continue;

      // Showmance forms — object with phase tracking
      const showmance = {
        players: [a, b],
        phase: 'spark',        // spark → honeymoon → target → resolved (ride-or-die or broken-up)
        sparkEp: ep.num || (gs.episode || 0) + 1,
        episodesActive: 0,
        jealousPlayer: null,   // 3rd wheel if detected
        tested: false,         // whether "the test" has fired
        origin: 'camp-organic', sparkContext: 'camp events',
      };
      gs.showmances.push(showmance);
      ep.newShowmances = ep.newShowmances || [];
      ep.newShowmances.push({ a, b });

      // Push camp event into the tribe they share
      const tribeName = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(a))?.name);
      if (tribeName && ep.campEvents?.[tribeName]) {
        const block = ep.campEvents[tribeName];
        const evts = Array.isArray(block) ? block : (block.pre || []);
        evts.push({ type: 'showmanceSpark', text:
          `At some point between the first day and now, whatever ${a} and ${b} have stopped being a question. ` +
          `The tribe has a word for it. Nobody says it out loud — but they all think it every time ${a} and ${b} are in the same frame.`,
          players: [a, b]
        });
      }
      return; // one showmance per episode check is enough
    }
  }
}

export function updateShowmancePhases(ep) {
  if (seasonConfig.romance === 'disabled') return;
  if (!gs.showmances?.length) return;
  const active = gs.activePlayers;
  const epNum = ep.num || (gs.episode || 0) + 1;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  ep.showmanceEvents = ep.showmanceEvents || [];

  gs.showmances.forEach(sh => {
    // ── REKINDLE: broken-up partner returned to the game ──
    if (sh.phase === 'broken-up' && active.includes(sh.players[0]) && active.includes(sh.players[1])) {
      const [a, b] = sh.players;
      const bond = getBond(a, b);
      const wasBetrayedBy = sh.breakupVoter; // the partner who voted them out
      const wasSeparated = sh.breakupType === 'separated';

      // Separated (didn't vote them out): rekindle if bond still positive
      // Betrayal: much harder — need bond recovery + low chance
      let rekindleChance = 0;
      if (wasSeparated) {
        // Bond stayed high after separation — strong rekindle chance
        rekindleChance = bond >= 3 ? 0.70 : bond >= 1 ? 0.40 : bond >= 0 ? 0.15 : 0;
      } else {
        // Betrayal — bond probably crashed. Only rekindle if somehow recovered
        rekindleChance = bond >= 2 ? 0.25 : bond >= 0 ? 0.08 : 0;
      }

      if (rekindleChance > 0 && Math.random() < rekindleChance) {
        sh.phase = 'spark';
        sh.episodesActive = 0;
        sh.tested = false;
        sh.jealousPlayer = null;
        // Bond boost on rekindle — proportional, not threshold
        addBond(a, b, wasSeparated ? 1.5 : 0.5);

        const tribeName = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(a))?.name || 'merge');
        if (ep.campEvents?.[tribeName]) {
          const block = ep.campEvents[tribeName];
          const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
          const _pA = pronouns(a), _pB = pronouns(b);
          const rekindleTexts = wasSeparated ? [
            `${a} and ${b} are back in the same camp. The first look they shared said everything the game couldn't. Whatever they had isn't over.`,
            `The moment ${a} walked back into camp, ${b}'s face changed. Not a word. Just a look. The tribe saw it all.`,
            `${a} and ${b} found each other by the fire that night. "I never stopped," ${_pA.sub} said. ${_pB.Sub} didn't need to answer.`,
            `They tried to play it cool. ${a} and ${b} acted like strangers for about ten minutes. Then ${_pA.sub} sat next to ${_pB.obj} and the whole tribe knew the showmance was back.`,
          ] : [
            `${a} voted ${b} out. ${b} came back. They shouldn't be talking. But they are. Whatever this is, it's complicated.`,
            `"You voted me out." "${b} said it flat. ${a} didn't deny it. But they're still drawn to each other, and the tribe can see it.`,
            `${a} and ${b} have unfinished business. The betrayal is still there — but so is whatever made them a showmance in the first place.`,
            `The tribe expected fireworks when ${b} returned. Instead, ${a} and ${b} had a quiet conversation on the beach. When they came back, something had shifted.`,
          ];
          evts.push({ type: 'showmanceRekindle', text: _pick(rekindleTexts), players: [a, b] });
          ep.showmanceEvents.push({ type: 'showmanceRekindle', players: [a, b], phase: 'rekindle' });
        }
      }
      return;
    }

    if (sh.phase === 'broken-up' || sh.phase === 'ride-or-die') return;
    const [a, b] = sh.players;
    if (!active.includes(a) || !active.includes(b)) return; // one eliminated — skip

    // ── NATURAL BREAKUP: bond dropped below -1 → showmance dies organically ──
    const _preBond = getBond(a, b);
    if (_preBond <= -1 && sh.phase !== 'spark') {
      sh.phase = 'broken-up';
      sh.breakupEp = epNum;
      sh.breakupType = 'faded'; // neither voted the other out — just fell apart
      const _pA = pronouns(a), _pB = pronouns(b);
      const tribeName = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(a))?.name || 'merge');
      if (ep.campEvents) {
        if (!ep.campEvents[tribeName]) ep.campEvents[tribeName] = { pre: [], post: [] };
        const block = ep.campEvents[tribeName];
        const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
        evts.push({ type: 'showmanceBreakup', text: _pick([
          `Whatever ${a} and ${b} had is gone. No fight, no betrayal — just two people who stopped looking at each other the same way. The tribe noticed weeks ago.`,
          `${a} and ${b} haven't spoken in days. The showmance that started in episode ${sh.sparkEp} ended somewhere between the silence and the distance. Nobody marked the exact moment.`,
          `It's over between ${a} and ${b}. Not with a bang — with a fade. ${_pA.Sub} moved ${_pA.posAdj} things to the other side of the shelter. ${_pB.Sub} didn't stop ${_pA.obj}.`,
          `The showmance died the way most do out here — quietly, between missed conversations and avoided eye contact. ${a} and ${b} are done.`,
        ]), players: [a, b] });
        ep.showmanceEvents = ep.showmanceEvents || [];
        ep.showmanceEvents.push({ type: 'showmanceBreakup', players: [a, b], phase: 'faded' });
      }
      return;
    }

    sh.episodesActive = (sh.episodesActive || 0) + 1;
    const bond = getBond(a, b);
    const _pA = pronouns(a), _pB = pronouns(b);

    const tribeName = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(a))?.name || 'merge');
    const pushEvt = (type, text, players) => {
      if (!ep.campEvents?.[tribeName]) return;
      const block = ep.campEvents[tribeName];
      const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
      evts.push({ type, text, players: players || [a, b] });
      ep.showmanceEvents.push({ type, players: players || [a, b], phase: sh.phase });
    };

    // ── Phase transitions ──
    if (sh.phase === 'spark' && sh.episodesActive >= 2) {
      sh.phase = 'honeymoon';
    } else if (sh.phase === 'honeymoon' && sh.episodesActive >= 4) {
      sh.phase = 'target';
    }

    // ── RIDE-OR-DIE: survived 7+ episodes together → bond locks ──
    if (sh.episodesActive >= 7 && sh.phase !== 'ride-or-die' && bond >= 6) {
      sh.phase = 'ride-or-die';
      addBond(a, b, 2.0); // cement the bond
      pushEvt('showmanceRideOrDie', _pick([
        `${a} and ${b} have stopped pretending this is temporary. They're going to the end together or not at all. Everyone knows it. Nobody can do anything about it.`,
        `Seven episodes in, ${a} and ${b} are inseparable. The tribe has accepted it like weather — you can't vote it out, you can't split it up, you just have to plan around it.`,
        `${a} and ${b} made a promise somewhere between day one and now. The kind that doesn't get spoken out loud but everyone can see. Ride or die.`,
      ]));
      return;
    }

    // ── Phase-specific effects ──
    if (sh.phase === 'honeymoon') {
      // Accelerated bond growth
      addBond(a, b, 0.3);
      // Camp events: the glow period
      if (Math.random() < 0.50) {
        pushEvt('showmanceHoneymoon', _pick([
          `${a} and ${b} are doing that thing again where they finish each other's sentences. The tribe watches like it's a nature documentary.`,
          `${b} brought ${a} water without being asked. ${a} didn't say thank you — just smiled. The tribe filed it away.`,
          `Late at night, ${a} and ${b} are the last ones awake. Whatever they're whispering about isn't strategy.`,
          `${a} laughed at something ${b} said and the whole camp went quiet for a second. Not awkward — just aware.`,
          `${b} reached for ${a}'s hand during a quiet moment and didn't let go. The tribe pretended not to notice. They all noticed.`,
        ]));
      }
      // Tribe notices — foreshadowing the target phase
      if (sh.episodesActive >= 3 && Math.random() < 0.35) {
        const observer = active.filter(p => p !== a && p !== b && pStats(p).strategic >= 5);
        if (observer.length) {
          const obs = observer[Math.floor(Math.random() * observer.length)];
          pushEvt('showmanceNoticed', _pick([
            `${obs} watches ${a} and ${b} from across the fire and starts doing math. Two votes. Always together. Always protecting each other. That's a problem.`,
            `"Those two are going to the end together if we don't do something." ${obs} says it to nobody in particular. Everybody hears it.`,
          ]), [obs, a, b]);
        }
      }
    }

    if (sh.phase === 'target') {
      // Heat escalation — the pair is now actively targeted
      // (computeHeat already adds +0.6 post-merge; this adds camp event pressure)
      if (Math.random() < 0.40) {
        const strategists = active.filter(p => p !== a && p !== b && pStats(p).strategic >= 6);
        if (strategists.length) {
          const plotter = strategists[Math.floor(Math.random() * strategists.length)];
          pushEvt('showmanceTarget', _pick([
            `${plotter} has been talking to people about ${a} and ${b}. The pitch is simple: split them up now, or watch them ride to the final two together.`,
            `The showmance has become the elephant in every strategy conversation. ${plotter} is the one who finally says it out loud: "One of them has to go."`,
            `${plotter} pulled three people aside today with the same message: ${a} and ${b} are a guaranteed final two if nobody breaks them up. The numbers are starting to move.`,
          ]), [plotter, a, b]);
        }
      }
    }

    // ── JEALOUSY / THIRD WHEEL (~20% per episode when conditions met) ──
    if (!sh.jealousPlayer && sh.episodesActive >= 2 && Math.random() < 0.20) {
      // Find a 3rd player who has bond >= 3 with one partner but feels excluded
      // Must be romantically compatible to trigger romantic jealousy (potential triangle)
      // Friendship jealousy (not compat) doesn't create a 3rd wheel
      const candidates = active.filter(p => {
        if (p === a || p === b) return false;
        const bondA = getBond(p, a), bondB = getBond(p, b);
        const hasAsymmetry = (bondA >= 3 && bondB < 1) || (bondB >= 3 && bondA < 1);
        if (!hasAsymmetry) return false;
        // Only romantic jealousy — must be compatible with the partner they're close to
        const closerTo = bondA > bondB ? a : b;
        return typeof romanticCompat === 'function' ? romanticCompat(p, closerTo) : true;
      });
      if (candidates.length) {
        // Romantic jealousy — potential love triangle
        const jealous = candidates[Math.floor(Math.random() * candidates.length)];
        sh.jealousPlayer = jealous;
        const closerTo = getBond(jealous, a) > getBond(jealous, b) ? a : b;
        const other = closerTo === a ? b : a;
        addBond(jealous, a, -0.5);
        addBond(jealous, b, -0.5);
        pushEvt('showmanceJealousy', _pick([
          `${jealous} used to be the person ${closerTo} talked to at night. Now that's ${other}'s role. ${jealous} hasn't said anything about it. The silence says enough.`,
          `Something shifted between ${jealous} and ${closerTo}. It happened the day ${closerTo} started spending every free moment with ${other}. ${jealous} clocked it. The distance is growing.`,
          `${jealous} sat alone at the fire last night while ${closerTo} and ${other} whispered on the beach. "I'm happy for them," ${jealous} said. Nobody believed it.`,
        ]), [jealous, closerTo, other]);
      } else {
        // Friendship jealousy — NOT romantic, but the friend feels sidelined
        const friendCandidates = active.filter(p => {
          if (p === a || p === b) return false;
          const bondA = getBond(p, a), bondB = getBond(p, b);
          return (bondA >= 4 && bondB < 1) || (bondB >= 4 && bondA < 1);
        });
        if (friendCandidates.length && Math.random() < 0.25) {
          const sidelined = friendCandidates[Math.floor(Math.random() * friendCandidates.length)];
          const bestFriend = getBond(sidelined, a) > getBond(sidelined, b) ? a : b;
          const partner = bestFriend === a ? b : a;
          const prS = pronouns(sidelined);
          // Damage the partner bond harder — they "stole" the friend
          addBond(sidelined, partner, -0.8);
          // Mild damage with the friend — hurt but won't say it
          addBond(sidelined, bestFriend, -0.3);
          // Heat on sidelined player — isolation makes them a target
          if (!gs._upTheCreekHeat) gs._upTheCreekHeat = {};
          gs._upTheCreekHeat[sidelined] = { amount: 0.5, expiresEp: ((gs.episode || 0) + 1) + 1 };
          pushEvt('friendshipJealousy', _pick([
            `${sidelined} and ${bestFriend} used to be inseparable. Now ${bestFriend} is always with ${partner}. ${sidelined} eats alone. Sleeps facing the wall. The distance is growing and nobody's talking about it.`,
            `${sidelined} watches ${bestFriend} and ${partner} from across camp. ${prS.Sub} ${prS.sub === 'they' ? 'don\'t' : 'doesn\'t'} say anything. But the way ${prS.sub} ${prS.sub === 'they' ? 'look' : 'looks'} at ${partner} isn't warm anymore.`,
            `"We used to talk about everything." ${sidelined} said that to no one in particular. ${bestFriend} was too busy with ${partner} to hear it.`,
            `${sidelined} tried to sit with ${bestFriend} at the fire. ${partner} was already there. ${sidelined} walked away. The tribe saw it. Nobody intervened.`,
            `${bestFriend} doesn't even notice ${sidelined} pulling away. That's the part that hurts the most.`,
          ]), [sidelined, bestFriend, partner]);
        }
      }
    }
  });
}

export function checkShowmanceTest(voter, allianceTarget, tribalPlayers, ep) {
  if (!allianceTarget) return null;
  const sh = getShowmance(voter);
  if (!sh || sh.tested || sh.phase === 'broken-up' || sh.phase === 'ride-or-die') return null;
  if (!sh.players.includes(allianceTarget)) return null; // target isn't their partner
  // The Test fires — the alliance wants to vote out their showmance partner
  sh.tested = true;
  const partner = allianceTarget;
  const s = pStats(voter);
  const bond = getBond(voter, partner);
  // Will they defy the alliance to protect the partner?
  // High bond + high loyalty + showmance attachment = resist
  const defyChance = Math.min(0.90, bond * 0.08 + s.loyalty * 0.04 + 0.15);
  ep.showmanceTests = ep.showmanceTests || [];
  ep.showmanceTests.push({ voter, partner, defied: Math.random() < defyChance, bond, phase: sh.phase });
  return { defyChance };
}

export function checkShowmanceBreakup(ep) {
  if (!gs.showmances?.length || !ep.eliminated) return;
  const elim = ep.eliminated;
  gs.showmances.forEach(sh => {
    if (sh.phase === 'broken-up') return;
    if (!sh.players.includes(elim)) return;
    const partner = sh.players.find(p => p !== elim);
    if (!gs.activePlayers.includes(partner)) return;
    // Did the partner vote for them?
    const partnerVotedThem = (ep.votingLog || []).some(v => v.voter === partner && v.voted === elim);
    if (partnerVotedThem) {
      // BREAKUP — the ultimate betrayal
      sh.phase = 'broken-up';
      sh.breakupEp = ep.num || (gs.episode || 0) + 1;
      sh.breakupVoter = partner;
      addBond(partner, elim, -5.0); // devastating collapse
      ep.showmanceBreakup = { voter: partner, eliminated: elim, bond: getBond(partner, elim) };
    } else {
      // Partner didn't vote for them — they tried to save them but failed
      sh.phase = 'broken-up';
      sh.breakupEp = ep.num || (gs.episode || 0) + 1;
      sh.breakupType = 'separated'; // not betrayal — relationship intact, just physically apart
      // Bond stays high — grief, not anger
      ep.showmanceSeparation = { survivor: partner, eliminated: elim, bond: getBond(partner, elim) };
    }
  });
}

export function checkLoveTriangleBreakup(ep) {
  if (!gs.loveTriangles?.length || !ep.eliminated) return;
  const elim = ep.eliminated;
  const epNum = ep.num || (gs.episode || 0) + 1;
  gs.loveTriangles.forEach(tri => {
    if (tri.resolved) return;
    if (tri.center !== elim && !tri.suitors.includes(elim)) return;
    tri.resolved = true;
    tri.resolution = { type: 'eliminated', who: elim, ep: epNum };
    tri.phase = 'resolved';
    ep.triangleEvents = ep.triangleEvents || [];
    ep.triangleEvents.push({ type: 'eliminated', center: tri.center, who: elim });
  });
}

export function checkLoveTriangleFormation(ep) {
  if (seasonConfig.romance === 'disabled') return;
  if (!gs.showmances?.length) return;
  gs.loveTriangles = gs.loveTriangles || [];
  ep.triangleEvents = ep.triangleEvents || [];
  const epNum = ep.num || (gs.episode || 0) + 1;

  // Max 1 active triangle at a time
  const activeTriangle = gs.loveTriangles.find(t => !t.resolved);
  if (activeTriangle) return;

  // 2-episode cooldown after last resolution
  const lastResolved = gs.loveTriangles.filter(t => t.resolved).sort((a, b) => (b.resolution?.ep || 0) - (a.resolution?.ep || 0))[0];
  if (lastResolved && epNum - (lastResolved.resolution?.ep || 0) < 2) return;

  const activeShowmances = gs.showmances.filter(sh =>
    sh.phase !== 'broken-up' && sh.players.every(p => gs.activePlayers.includes(p))
  );
  if (!activeShowmances.length) return;

  // ── Path 1: Dual Showmance — player appears in 2 active showmances ──
  const playerShowmanceCounts = {};
  activeShowmances.forEach(sh => {
    sh.players.forEach(p => {
      playerShowmanceCounts[p] = (playerShowmanceCounts[p] || 0) + 1;
    });
  });

  for (const center of Object.keys(playerShowmanceCounts)) {
    if (playerShowmanceCounts[center] < 2) continue;
    const involvedShowmances = activeShowmances.filter(sh => sh.players.includes(center));
    const suitors = involvedShowmances.map(sh => sh.players.find(p => p !== center));
    if (suitors.length < 2) continue;

    // Clear jealousPlayer on affected showmances to avoid duplicate jealousy
    involvedShowmances.forEach(sh => { sh.jealousPlayer = null; });

    const triangle = {
      center,
      suitors: [suitors[0], suitors[1]],
      formedEp: epNum,
      phase: 'tension',
      episodesActive: 0,
      sourceType: 'dual-showmance',
      showmanceRef: [center, suitors[0]],
      jealousyLevel: 0,
      resolved: false,
      resolution: null
    };
    gs.loveTriangles.push(triangle);

    // Push camp event
    const pc = pronouns(center);
    const ps0 = pronouns(suitors[0]);
    const ps1 = pronouns(suitors[1]);
    const tribeName = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(center))?.name || 'merge');
    if (ep.campEvents?.[tribeName]) {
      const block = ep.campEvents[tribeName];
      const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
      const variants = [
        `The math isn't adding up. ${center} has been spending nights whispering with ${suitors[0]} and mornings laughing with ${suitors[1]}. ` +
        `${ps0.Sub} noticed. ${ps1.Sub} noticed. Neither has said anything yet — but the silence is louder than any confrontation.`,
        `Everyone on the tribe can feel it: ${center} is caught between ${suitors[0]} and ${suitors[1]}, and ${pc.sub} doesn't seem to realize ` +
        `how obvious it's become. The question isn't whether this blows up — it's when.`
      ];
      evts.push({ type: 'triangleTension', text: variants[Math.random() < 0.5 ? 0 : 1], players: [center, suitors[0], suitors[1]] });
    }
    ep.triangleEvents.push({ type: 'formation', sourceType: 'dual-showmance', center, suitors: [suitors[0], suitors[1]], ep: epNum });
    return; // max 1 triangle
  }

  // ── Path 2: One-Sided Crush — C has high bond with B, B is in showmance with A ──
  for (const sh of activeShowmances) {
    const [pA, pB] = sh.players;
    // Check both directions: someone crushing on pA or pB
    for (const [inShowmance, partner] of [[pA, pB], [pB, pA]]) {
      for (const candidate of gs.activePlayers) {
        if (candidate === inShowmance || candidate === partner) continue;
        // Already in a showmance with inShowmance? skip — that's Path 1 territory
        if (activeShowmances.some(s => s.players.includes(candidate) && s.players.includes(inShowmance))) continue;

        const bond = getBond(candidate, inShowmance);
        if (bond < 4) continue;
        if (!romanticCompat(inShowmance, candidate)) continue;

        // Prevent instant organic resolution — partner bond must be >= 1.0
        if (getBond(inShowmance, partner) < 1.0) continue;

        // Same trio can't re-form a triangle (prevents infinite reform loops)
        const _trioKey = [inShowmance, partner, candidate].sort().join('|');
        if (gs.loveTriangles.some(t => [t.center, ...t.suitors].sort().join('|') === _trioKey)) continue;

        // Must be on same tribe
        if (!gs.isMerged) {
          const candidateTribe = gs.tribes.find(t => t.members.includes(candidate));
          const targetTribe = gs.tribes.find(t => t.members.includes(inShowmance));
          if (!candidateTribe || !targetTribe || candidateTribe.name !== targetTribe.name) continue;
        }

        // Probability: proportional to bond, capped at 0.30
        let chance = Math.min(0.30, bond * 0.06);
        // Ride-or-die showmance reduces chance to 0.15x
        if (sh.phase === 'ride-or-die') chance *= 0.15;
        if (Math.random() >= chance) continue;

        // ── PERSONALITY FORK: secret affair vs public triangle ──
        const _cheaterStats = pStats(inShowmance);
        const _cheaterArch = players.find(p => p.name === inShowmance)?.archetype || '';
        const _isSecretType = _cheaterStats.loyalty <= 5 || ['villain','schemer','chaos-agent','showmancer'].includes(_cheaterArch);

        if (_isSecretType) {
          // Secret affair — hidden romance path
          gs.affairs = gs.affairs || [];
          // Max 1 active affair per cheater
          if (gs.affairs.some(af => !af.resolved && af.cheater === inShowmance)) continue;
          // Same trio can't have had an affair before
          const _afTrioKey = [inShowmance, partner, candidate].sort().join('|');
          if (gs.affairs.some(af => [af.cheater, af.partner, af.secretPartner].sort().join('|') === _afTrioKey)) continue;

          // Complicit check — does the secret partner know about the showmance?
          const _complicit = Math.random() < (pStats(candidate).intuition * 0.08 + Math.max(0, getBond(candidate, partner)) * 0.05);

          gs.affairs.push({
            cheater: inShowmance,
            partner: partner,
            secretPartner: candidate,
            formedEp: epNum,
            episodesActive: 0,
            showmanceRef: [inShowmance, partner],
            exposure: 'hidden',
            rumorSources: [],
            caughtBy: null,
            caughtTold: false,
            complicit: _complicit,
            resolved: false,
            resolution: null
          });

          // Subtle formation event (the affair is secret — no big announcement)
          const _afTribe = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(inShowmance))?.name || 'merge');
          if (ep.campEvents?.[_afTribe]) {
            const _afBlock = ep.campEvents[_afTribe];
            const _afEvts = Array.isArray(_afBlock) ? _afBlock : (_afBlock.post || _afBlock.pre || []);
            const _afPc = pronouns(inShowmance);
            const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
            _afEvts.push({ type: 'affairSecret', text: _pick([
              `${inShowmance} has been finding excuses to be alone with ${candidate}. ${partner} doesn't notice. The cameras do.`,
              `Something shifted between ${inShowmance} and ${candidate}. It's subtle — a glance held too long, a conversation that goes quiet when ${partner} walks over. The game just got complicated.`,
            ]), players: [inShowmance, candidate] });
          }

          ep.affairEvents = ep.affairEvents || [];
          ep.affairEvents.push({ type: 'formed', cheater: inShowmance, partner, secretPartner: candidate, complicit: _complicit });
          return; // one formation per episode
        }

        // Clear jealousPlayer on affected showmance
        sh.jealousPlayer = null;

        const triangle = {
          center: inShowmance,
          suitors: [partner, candidate],
          formedEp: epNum,
          phase: 'tension',
          episodesActive: 0,
          sourceType: 'one-sided',
          showmanceRef: [inShowmance, partner],
          jealousyLevel: 0,
          resolved: false,
          resolution: null
        };
        gs.loveTriangles.push(triangle);

        // Push camp event
        const pc = pronouns(inShowmance);
        const pCand = pronouns(candidate);
        const tribeName = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(inShowmance))?.name || 'merge');
        if (ep.campEvents?.[tribeName]) {
          const block = ep.campEvents[tribeName];
          const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
          const variants = [
            `${candidate} has been finding every excuse to be near ${inShowmance} — carrying water together, sitting close at fire, ` +
            `volunteering for the same tasks. ${partner} watches from across camp, jaw tightening. ` +
            `${pCand.Sub} might not call it a crush, but ${partner} already has a word for it.`,
            `There's a new energy around ${inShowmance} that ${partner} can't quite name. ${candidate} lights up whenever ${pc.sub} walks over, ` +
            `laughs a half-second too long at ${pc.posAdj} jokes. It hasn't crossed any lines yet — but the line is getting thinner every day.`
          ];
          evts.push({ type: 'triangleTension', text: variants[Math.random() < 0.5 ? 0 : 1], players: [inShowmance, partner, candidate] });
        }
        ep.triangleEvents.push({ type: 'formation', sourceType: 'one-sided', center: inShowmance, suitors: [partner, candidate], ep: epNum });
        return; // max 1 triangle
      }
    }
  }
}

export function updateLoveTrianglePhases(ep) {
  if (seasonConfig.romance === 'disabled') return;
  if (!gs.loveTriangles?.length) return;
  const epNum = (gs.episode || 0) + 1;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];

  gs.loveTriangles.forEach(tri => {
    if (tri.resolved) return;

    const { center, suitors } = tri;
    const suitorA = suitors[0];
    const suitorC = suitors[1];
    const active = gs.activePlayers;

    // --- Early Resolution: elimination ---
    const centerAlive = active.includes(center);
    const aAlive = active.includes(suitorA);
    const cAlive = active.includes(suitorC);

    if (!centerAlive || !aAlive || !cAlive) {
      tri.resolved = true;
      tri.resolution = { type: 'eliminated', who: !centerAlive ? center : !aAlive ? suitorA : suitorC, ep: epNum };
      // Both suitors eliminated same episode (double tribal) — center gets lonely event
      if (centerAlive && !aAlive && !cAlive) {
        const pc = pronouns(center);
        const tribeName = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(center))?.name || 'merge');
        if (ep.campEvents?.[tribeName]) {
          const block = ep.campEvents[tribeName];
          const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
          evts.push({
            type: 'triangleLonely',
            text: `${center} sits alone at camp, ${pc.posAdj} shelter suddenly too quiet. Both ${suitorA} and ${suitorC} are gone — ` +
                  `the triangle resolved itself in the cruelest way possible. ${pc.Sub} stares into the fire and says nothing.`,
            players: [center]
          });
        }
        ep.triangleEvents = ep.triangleEvents || [];
        ep.triangleEvents.push({ type: 'triangleLonely', phase: tri.phase, center, suitors: [suitorA, suitorC] });
      }
      return;
    }

    // --- Early Resolution: bond decay ---
    const bondA = getBond(center, suitorA);
    const bondC = getBond(center, suitorC);
    if (bondA < 1.0 || bondC < 1.0) {
      tri.resolved = true;
      tri.phase = 'resolved';
      const droppedSuitor = bondA < 1.0 ? suitorA : suitorC;
      const survivingBond = droppedSuitor === suitorA ? suitorC : suitorA;
      tri.resolution = { type: 'organic', ep: epNum, survivingBond };
      ep.triangleEvents = ep.triangleEvents || [];
      ep.triangleEvents.push({ type: 'organic-resolve', phase: tri.phase, center, suitors: [suitorA, suitorC], survivingBond });
      // Push visible camp event so the resolution isn't silent
      const _orgTribe = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(center))?.name || 'merge');
      if (ep.campEvents?.[_orgTribe]) {
        const _orgBlock = ep.campEvents[_orgTribe];
        const _orgEvts = Array.isArray(_orgBlock) ? _orgBlock : (_orgBlock.post || _orgBlock.pre || []);
        const _pDrop = pronouns(droppedSuitor);
        const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
        _orgEvts.push({ type: 'triangleResolved', text: _pick([
          `It ended quietly. ${center} stopped looking at ${droppedSuitor} the way ${pronouns(center).sub} used to. No fight, no ultimatum — just distance. ${survivingBond} is still there. The triangle isn't.`,
          `The triangle dissolved without a word. ${droppedSuitor} noticed first — ${_pDrop.sub} could feel ${center} pulling away. By the time ${_pDrop.sub} accepted it, it was already over.`,
          `${center} and ${droppedSuitor} barely talk anymore. Whatever spark was there burned out on its own. ${survivingBond} won without having to fight for it.`,
          `The triangle resolved itself. ${center} drifted away from ${droppedSuitor} naturally — no dramatic confrontation, just the slow fade of something that was never going to last.`,
        ]), players: [center, survivingBond, droppedSuitor] });
      }
      // Surviving bond becomes a showmance if compatible + bond high enough + cap allows
      const _orgBondVal = getBond(center, survivingBond);
      const _activeShCount = (gs.showmances || []).filter(sh => sh.phase !== 'broken-up' && sh.players.every(p => active.includes(p))).length;
      if (_orgBondVal >= 4 && romanticCompat(center, survivingBond) && _activeShCount < 2) {
        // Check they don't already have a showmance
        if (!gs.showmances.some(sh => sh.players.includes(center) && sh.players.includes(survivingBond) && sh.phase !== 'broken-up')) {
          gs.showmances.push({
            players: [center, survivingBond], phase: 'spark',
            sparkEp: epNum, episodesActive: 0, jealousPlayer: null, tested: false
          });
          ep.newShowmances = ep.newShowmances || [];
          ep.newShowmances.push({ a: center, b: survivingBond });
        }
      }
      return;
    }

    // --- Pre-merge freeze: must all be on same tribe ---
    if (!gs.isMerged) {
      const tribeCenter = gs.tribes.find(t => t.members.includes(center))?.name;
      const tribeA = gs.tribes.find(t => t.members.includes(suitorA))?.name;
      const tribeC = gs.tribes.find(t => t.members.includes(suitorC))?.name;
      if (!tribeCenter || tribeCenter !== tribeA || tribeCenter !== tribeC) return; // freeze
    }

    // Increment episode counter
    tri.episodesActive++;

    // --- Phase transitions ---
    if (tri.phase === 'tension' && tri.episodesActive >= 3) tri.phase = 'escalation';
    if (tri.phase === 'escalation' && tri.episodesActive >= 5) tri.phase = 'ultimatum';

    const pc = pronouns(center);
    const pA = pronouns(suitorA);
    const pC = pronouns(suitorC);
    const tribeName = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(center))?.name || 'merge');

    const pushEvt = (type, text, players) => {
      if (!ep.campEvents?.[tribeName]) return;
      const block = ep.campEvents[tribeName];
      const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
      evts.push({ type, text, players: players || [suitorA, center, suitorC] });
      ep.triangleEvents = ep.triangleEvents || [];
      ep.triangleEvents.push({ type, phase: tri.phase, center, suitors: [suitorA, suitorC] });
    };

    // ===================== TENSION PHASE =====================
    if (tri.phase === 'tension') {
      // Jealousy growth — proportional to center's bond with the rival
      tri.jealousyLevel = Math.min(10, tri.jealousyLevel + 1.0 + bondC * 0.1);

      // Bond erosion
      addBond(suitorA, suitorC, -0.3);
      addBond(suitorA, center, -0.15);

      // Tension camp event
      const tensionVariants = [
        `${suitorA} catches ${center} and ${suitorC} sharing a coconut by the water well. ${pA.Sub} says nothing, but ${pA.posAdj} expression says everything.`,
        `${suitorA} has started positioning ${pA.ref} between ${center} and ${suitorC} at every opportunity — at challenges, at meals, at fire. It's subtle, but ${center} has noticed.`,
        `${suitorC} made ${center} laugh today, the kind of laugh that carries across camp. ${suitorA} heard it from the shelter and felt something twist in ${pA.posAdj} chest.`,
        `There's a chill between ${suitorA} and ${suitorC} that wasn't there before. They still talk, but the pauses are longer, the eye contact shorter. ${center} pretends not to notice.`,
        `${center} asked ${suitorA} to go collect firewood, but ${suitorC} volunteered first. The look ${suitorA} gave could have started a fire on its own.`,
        `${suitorA} spent the morning building a new fishing spear — alone. Usually ${pA.sub} and ${center} do that together. ${center} was with ${suitorC} instead.`,
        `The sleeping arrangement has become a nightly negotiation. ${suitorA} wants to be next to ${center}. So does ${suitorC}. ${center} rotates, trying to keep the peace.`,
        `${suitorA} overheard ${suitorC} telling ${center} about ${pC.posAdj} family back home — the kind of personal story ${suitorA} thought was just between ${pA.obj} and ${center}.`
      ];
      pushEvt('triangleTension', _pick(tensionVariants));

      // 30% chance: confrontation
      if (Math.random() < 0.30) {
        addBond(suitorA, center, -0.5);
        const confrontVariants = [
          `${suitorA} finally snapped. "What's going on with you and ${suitorC}?" ${center} stammered out a non-answer, which only made it worse.`,
          `${suitorA} pulled ${center} aside at the water well. "I'm not blind. I see how you look at ${suitorC}." ${center} tried to deflect, but ${pA.sub} wasn't buying it.`,
          `${suitorA} cornered ${center} after the challenge. "Are you playing me?" The accusation hung in the air. ${center} denied it, but ${pA.sub} walked away unconvinced.`,
          `"Just tell me the truth," ${suitorA} said, voice cracking. ${center} insisted there was nothing to tell. ${pA.Sub} wanted to believe it, but couldn't.`,
          `${suitorA} confronted ${center} at the shelter while ${suitorC} was out fishing. "I need to know where I stand." ${center} said all the right things, but ${pA.posAdj} eyes said ${pA.sub} didn't believe a word.`,
          `After a long silence by the fire, ${suitorA} turned to ${center}. "I'm starting to feel like a backup plan." ${center} reached for ${pA.posAdj} hand, but ${pA.sub} pulled away.`,
          `${suitorA} confronted ${center} with surprising calm. "I deserve honesty." ${center} insisted everything was fine, but ${pA.sub} could see the guilt behind ${pc.posAdj} eyes.`,
          `It started as a whisper and ended as a shout. ${suitorA} accused ${center} of stringing ${pA.obj} along. The whole tribe heard it.`
        ];
        pushEvt('triangleConfrontation', _pick(confrontVariants));
      }
    }

    // ===================== ESCALATION PHASE =====================
    else if (tri.phase === 'escalation') {
      // Jealousy growth — escalated
      tri.jealousyLevel = Math.min(10, tri.jealousyLevel + 1.5 + bondC * 0.1);

      // Bond erosion — intensified
      addBond(suitorA, suitorC, -0.5);
      addBond(suitorA, center, -0.3);

      // 60% chance: escalation event
      if (Math.random() < 0.60) {
        const escalationVariants = [
          `${suitorA} and ${suitorC} aren't even pretending to get along anymore. At the challenge, they refused to make eye contact. ${center} stood between them, looking miserable.`,
          `${suitorA} told anyone who'd listen that ${suitorC} is "fake" and "only here for the game." It was clearly about more than strategy.`,
          `${center} tried to have a normal conversation with both ${suitorA} and ${suitorC} at camp, but the tension was suffocating. ${pc.Sub} gave up and went for a walk alone.`,
          `${suitorC} found ${center} crying by the beach. "Is this about ${suitorA}?" ${center} didn't answer, which was answer enough.`,
          `The tribe is starting to walk on eggshells. Every interaction between ${suitorA}, ${center}, and ${suitorC} feels like it could ignite. Even fetching water has become political.`,
          `${suitorA} made a pointed comment at the fire about "people who can't make up their minds." ${center} flinched. ${suitorC} stared straight ahead.`,
          `${suitorA} refused to sit with ${center} at the reward feast. "Go sit with ${suitorC}. That's what you want anyway." The table went silent.`,
          `${center} asked ${suitorA} if they could talk. ${pA.Sub} said "About what? You've made your feelings pretty clear." Then ${pA.sub} walked away.`
        ];
        pushEvt('triangleEscalation', _pick(escalationVariants));
      }

      // 40% chance: tribemates discuss exploiting triangle
      if (Math.random() < 0.40) {
        const tribeMembers = (gs.isMerged ? active : (gs.tribes.find(t => t.members.includes(center))?.members || []))
          .filter(p => p !== center && p !== suitorA && p !== suitorC);
        if (tribeMembers.length > 0) {
          const schemer = _pick(tribeMembers);
          const pS = pronouns(schemer);
          const exploitVariants = [
            `${schemer} pulled aside an ally. "Have you noticed the ${suitorA}-${center}-${suitorC} situation? We can use that. They're so wrapped up in each other, they're not watching us."`,
            `${schemer} has been quietly observing the love triangle. "${pS.Sub} realized one of them is going to feel burned — and burned people make desperate allies.`,
            `"That triangle is a ticking time bomb," ${schemer} whispered. "When it explodes, we need to be on the right side of the shrapnel."`,
            `${schemer} grinned at ${pS.posAdj} alliance. "Let them tear each other apart over ${center}. While they're distracted, we make our move."`,
            `${schemer} noticed the cracks in the ${suitorA}-${suitorC} relationship. "We don't even need to do anything. The triangle is doing our work for us."`,
            `"Three people, one mess," ${schemer} said. "That's three people not thinking about the game. That's three potential votes we can control."`,
            `${schemer} mapped it out to ${pS.posAdj} closest ally: "If ${suitorA} gets rejected, ${pA.sub}'ll be furious. That's a free number for us."`,
            `${schemer} has been feeding small doubts to both ${suitorA} and ${suitorC}. Nothing big — just enough to keep the triangle unstable and exploitable.`
          ];
          pushEvt('triangleEscalation', _pick(exploitVariants), [schemer, suitorA, center, suitorC]);
        }
      }

      // 30% chance: public fight
      if (Math.random() < 0.30) {
        addBond(suitorA, suitorC, -1.0);
        const fightVariants = [
          `It happened at the fire, in front of everyone. ${suitorA} accused ${suitorC} of "moving in" on ${center}. ${suitorC} fired back. By the time it was over, half the tribe had scattered.`,
          `${suitorA} and ${suitorC} had been circling each other for days. Tonight, the dam broke. Voices raised, fingers pointed, and ${center} sat frozen, unable to stop it.`,
          `The fight was ugly. ${suitorA} called ${suitorC} a snake. ${suitorC} called ${suitorA} delusional. ${center} tried to intervene but got shouted down by both.`,
          `${suitorA} shoved past ${suitorC} on the way to the shelter. Words were exchanged. Then louder words. The tribe watched in stunned silence.`,
          `"You don't deserve ${center}!" ${suitorA} shouted across the camp. ${suitorC} laughed — the kind of laugh that makes things worse. The rest of the tribe pretended to be asleep.`,
          `${suitorA} confronted ${suitorC} directly for the first time. No more passive aggression. The argument lasted twenty minutes and solved nothing.`,
          `The fight spilled out of the shelter and onto the beach. ${suitorA} and ${suitorC} screamed at each other while ${center} watched with ${pc.posAdj} head in ${pc.posAdj} hands.`,
          `It was the worst fight the tribe had seen all season. ${suitorA} vs ${suitorC}, no holds barred. When it was finally over, ${center} whispered, "This is my fault."`
        ];
        pushEvt('trianglePublicFight', _pick(fightVariants));
      }
    }

    // ===================== ULTIMATUM PHASE =====================
    else if (tri.phase === 'ultimatum') {
      // Center makes forced choice
      const sA = pStats(center);
      const bondACurrent = getBond(center, suitorA);
      const bondCCurrent = getBond(center, suitorC);
      const threatA = threatScore(suitorA);
      const threatC = threatScore(suitorC);

      // Relationship length from showmance reference
      const primaryShowmance = gs.showmances?.find(sh =>
        sh.players.includes(center) && sh.players.includes(suitorA)
      );
      const relationshipLengthA = primaryShowmance?.episodesActive || 0;

      const scoreA = bondACurrent * 0.40
        + (sA.loyalty * 0.03 * relationshipLengthA) * 0.30
        + (threatC - threatA) * 0.20 * -1
        + Math.random() * 0.10;

      const scoreC = bondCCurrent * 0.40
        + 0
        + (threatA - threatC) * 0.20 * -1
        + Math.random() * 0.10;

      const chosen = scoreA >= scoreC ? suitorA : suitorC;
      const rejected = chosen === suitorA ? suitorC : suitorA;
      const pRej = pronouns(rejected);
      const pCh = pronouns(chosen);
      const sRej = pStats(rejected);

      // Rejection severity — proportional
      const rejBond = getBond(rejected, center);
      const rejSeverity = sRej.loyalty * 0.3 + sRej.temperament * -0.2 + rejBond * 0.2;

      let bondCrash, heatBoost;
      const arch = sRej.archetype;

      if (arch === 'villain' || arch === 'schemer') {
        bondCrash = -(1.0 + rejSeverity * 0.1);
        heatBoost = -0.5; // sympathy
      } else if (sRej.strategic >= 7 && sRej.loyalty <= 4) {
        // High strategic + low loyalty — threshold only for TEXT variant selection
        bondCrash = -(1.0 + rejSeverity * 0.15);
        heatBoost = 0.5;
      } else {
        // Default emotional
        bondCrash = -Math.min(5, 2.0 + rejSeverity * 0.2);
        heatBoost = Math.min(2.0, 0.5 + rejSeverity * 0.15);
      }

      // Apply bond consequences
      addBond(center, chosen, 1.0);
      addBond(rejected, center, bondCrash);
      addBond(rejected, chosen, bondCrash * 0.6);

      // Store rejection heat
      gs._triangleRejectionHeat = gs._triangleRejectionHeat || {};
      gs._triangleRejectionHeat[rejected] = { heat: heatBoost, expiresEp: epNum + 2 };

      // Resolve triangle
      tri.resolved = true;
      tri.resolution = { type: 'chose', ep: epNum, chosen, rejected, severity: rejSeverity, bondCrash, heatBoost };

      // Ultimatum event
      const ultimatumVariants = [
        `${center} sat ${suitorA} and ${suitorC} down at the fire. "I can't keep doing this. I have to be honest." What followed was the hardest conversation of ${pc.posAdj} game.`,
        `${center} pulled ${chosen} aside first. "It's you. It's always been you." Then ${pc.sub} went to find ${rejected}. That conversation didn't go as smoothly.`,
        `"I've made my decision," ${center} announced. The relief on ${chosen}'s face was matched only by the devastation on ${rejected}'s.`,
        `${center} chose. It wasn't clean, it wasn't painless, but it was done. ${chosen} exhaled. ${rejected} walked to the beach alone.`
      ];
      pushEvt('triangleUltimatum', _pick(ultimatumVariants));

      // Personality-specific reaction from rejected player
      let reactionText;
      if (arch === 'villain' || arch === 'schemer') {
        const villainReactions = [
          `${rejected} took it with a cold smile. "Fine. But don't think I'll forget this. ${center} just made the worst mistake of ${pc.posAdj} game." ${pRej.Sub} was already planning ${pRej.posAdj} revenge.`,
          `${rejected} laughed when ${center} told ${pRej.obj}. "You think I'm upset? I'm free now. And you just lost the one person who was actually protecting you."`,
          `${rejected} nodded slowly, eyes calculating. "Interesting choice." ${pRej.Sub} walked away already thinking about how to weaponize this.`
        ];
        reactionText = _pick(villainReactions);
      } else if (sRej.strategic >= 7 && sRej.loyalty <= 4) {
        const strategicReactions = [
          `${rejected} processed it quickly. "I understand." But behind the calm facade, ${pRej.sub} was already recalculating every alliance, every vote, every path to the end.`,
          `${rejected} barely flinched. "Game respects game, ${center}." But ${pRej.posAdj} voting hand was already itching for tribal.`,
          `${rejected} shook ${center}'s hand. "No hard feelings." It was the most strategic handshake in the history of the game.`
        ];
        reactionText = _pick(strategicReactions);
      } else {
        const emotionalReactions = [
          `${rejected} couldn't speak for a long time. When ${pRej.sub} finally did, ${pRej.posAdj} voice cracked. "I thought we had something real." ${pRej.Sub} spent the night alone on the beach.`,
          `${rejected}'s eyes welled up. "After everything?" ${center} tried to explain, but ${rejected} held up a hand. "Don't. Just... don't." ${pRej.Sub} walked away before the tears came.`,
          `${rejected} stared at ${center} like ${pRej.sub} was seeing ${pc.obj} for the first time. "I gave you everything out here." ${pRej.Sub} went silent after that — the dangerous kind of silent.`
        ];
        reactionText = _pick(emotionalReactions);
      }
      pushEvt('triangleResolved', reactionText, [center, chosen, rejected]);

      // Store on episode for VP
      ep.triangleResolution = { center, chosen, rejected, severity: rejSeverity, bondCrash, heatBoost };

      // Chosen pair becomes a showmance if compatible + bond high enough + cap allows
      const _chosenBond = getBond(center, chosen);
      const _actShCount = (gs.showmances || []).filter(sh => sh.phase !== 'broken-up' && sh.players.every(p => active.includes(p))).length;
      if (_chosenBond >= 3 && romanticCompat(center, chosen) && _actShCount < 2) {
        if (!gs.showmances.some(sh => sh.players.includes(center) && sh.players.includes(chosen) && sh.phase !== 'broken-up')) {
          gs.showmances.push({
            players: [center, chosen], phase: 'spark',
            sparkEp: epNum, episodesActive: 0, jealousPlayer: null, tested: false
          });
          ep.newShowmances = ep.newShowmances || [];
          ep.newShowmances.push({ a: center, b: chosen });
        }
      }
    }
  });
}

export function updateAffairExposure(ep) {
  if (seasonConfig.romance === 'disabled') return;
  if (!gs.affairs?.length) return;
  const active = gs.activePlayers;
  const epNum = (gs.episode || 0) + 1;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  ep.affairEvents = ep.affairEvents || [];

  gs.affairs.forEach(af => {
    if (af.resolved) return;
    const { cheater, partner, secretPartner } = af;

    // --- Elimination check ---
    if (!active.includes(cheater) || !active.includes(partner) || !active.includes(secretPartner)) {
      af.resolved = true;
      af.resolution = { type: 'eliminated', who: [cheater, partner, secretPartner].find(p => !active.includes(p)), ep: epNum };
      ep.affairEvents.push({ type: 'eliminated', cheater, who: af.resolution.who });
      return;
    }

    // --- Tribe separation freeze (cheater + secret must be together) ---
    const sameTribe = gs.isMerged || gs.tribes.some(t =>
      t.members.includes(cheater) && t.members.includes(secretPartner));
    if (!sameTribe) return;

    af.episodesActive++;

    const tribeName = gs.isMerged ? (gs.mergeName || 'merge') : (gs.tribes.find(t => t.members.includes(cheater))?.name || 'merge');
    const pushEvt = (type, text, players) => {
      if (!ep.campEvents?.[tribeName]) return;
      const block = ep.campEvents[tribeName];
      const evts = Array.isArray(block) ? block : (block.post || block.pre || []);
      evts.push({ type, text, players });
      ep.affairEvents.push({ type, cheater, secretPartner, exposure: af.exposure });
    };

    const pc = pronouns(cheater);
    const pp = pronouns(partner);
    const ps = pronouns(secretPartner);

    // ═══ TIER 1: HIDDEN ═══
    if (af.exposure === 'hidden') {
      addBond(cheater, secretPartner, 0.2);

      // Subtle camp event (30% chance)
      if (Math.random() < 0.30) {
        pushEvt('affairSecret', _pick([
          `${cheater} disappeared for twenty minutes after dinner. ${pc.Sub} came back from the beach with wet hair and a story about washing up. Nobody questioned it. ${secretPartner} came back five minutes later.`,
          `${cheater} and ${secretPartner} ended up on the same firewood run again. Third time this week. ${partner} didn't notice. Everyone else did.`,
          `Late at night, after ${partner} fell asleep, ${cheater} slipped out of the shelter. The cameras followed. ${secretPartner} was already waiting by the well.`,
          `${cheater} laughed at something ${secretPartner} whispered. The kind of laugh that's too quiet, too close. ${partner} was ten feet away, talking strategy with someone else.`,
          `${secretPartner} handed ${cheater} an extra portion at dinner. A small thing. But ${partner} used to be the one who did that.`,
          `${cheater} has a tell: ${pc.sub} only ${pc.sub === 'they' ? 'smile' : 'smiles'} like that around ${secretPartner}. The cameras catch it every time. ${partner} hasn't figured it out yet.`,
          `The tribe was asleep. ${cheater} and ${secretPartner} were not. Whatever happened between the shelter and the shore, the cameras got it all.`,
          `${cheater} volunteers for every task with ${secretPartner}. Water runs. Firewood. Challenge practice. ${partner} thinks it's strategy. It's not.`,
        ]), [cheater, secretPartner]);
      }

      // Detection roll — pressure cooker (+6% per episode)
      const detectionBase = 0.10 + af.episodesActive * 0.06;
      const tribemates = active.filter(p => p !== cheater && p !== secretPartner && p !== partner);
      const partnerSeparated = !gs.isMerged && !gs.tribes.some(t =>
        t.members.includes(cheater) && t.members.includes(partner));
      const boldnessBonus = partnerSeparated ? 0.15 : 0;

      for (const observer of tribemates) {
        const obs = pStats(observer);
        const detectChance = (obs.intuition * 0.05 + obs.mental * 0.02) * af.episodesActive * 0.3 + boldnessBonus;
        if (Math.random() < Math.min(0.80, detectionBase + detectChance)) {
          af.exposure = 'rumors';
          af.rumorSources.push(observer);
          pushEvt('affairRumor', _pick([
            `${observer} stopped mid-sentence and watched ${cheater} walk past ${secretPartner}. The brush of hands. The half-second of eye contact. ${observer} filed it away and said nothing. Yet.`,
            `"Have you noticed ${cheater} and ${secretPartner}?" ${observer} asked casually at the fire. Nobody answered. But two people exchanged a look.`,
            `${observer} couldn't sleep. That's when ${pronouns(observer).sub} saw ${cheater} leaving the shelter. And ${secretPartner} following. ${observer} lay still and pretended not to see.`,
            `${observer} has been watching ${cheater} for days. The secret looks. The excuses to be near ${secretPartner}. ${pronouns(observer).Sub} ${pronouns(observer).sub === 'they' ? 'haven\'t' : 'hasn\'t'} told ${partner} yet. But ${pronouns(observer).sub} ${pronouns(observer).sub === 'they' ? 'know' : 'knows'}.`,
            `Something about ${cheater} and ${secretPartner} doesn't sit right with ${observer}. ${pronouns(observer).Sub} can't prove it yet. But ${pronouns(observer).sub} ${pronouns(observer).sub === 'they' ? 'are' : 'is'} watching.`,
            `${observer} noticed ${cheater} and ${secretPartner} walking back from the beach. Separately. Too carefully separately. ${observer} said nothing. But ${pronouns(observer).sub} started paying attention.`,
            `${observer} caught a look between ${cheater} and ${secretPartner} that wasn't meant for anyone else. It was barely a moment. But it was enough.`,
            `"I'm not saying anything, but..." ${observer} trailed off. The tribe read between the lines. Somebody knows about ${cheater} and ${secretPartner}.`,
          ]), [observer, cheater, secretPartner]);
          addBond(observer, partner, 0.1); // guilt
          break;
        }
      }
    }

    // ═══ TIER 2: RUMORS ═══
    else if (af.exposure === 'rumors') {
      addBond(cheater, secretPartner, 0.2);

      // More observers may detect
      const tribemates = active.filter(p => p !== cheater && p !== secretPartner && p !== partner && !af.rumorSources.includes(p));
      for (const obs of tribemates) {
        if (Math.random() < pStats(obs).intuition * 0.06) {
          af.rumorSources.push(obs);
        }
      }

      // Each rumor source may tell the partner
      for (const source of af.rumorSources) {
        if (!active.includes(source)) continue;
        const sourceS = pStats(source);
        const tellChance = sourceS.loyalty * 0.06 + Math.max(0, getBond(source, partner)) * 0.04;
        if (Math.random() < tellChance) {
          af.exposure = 'exposed';
          pushEvt('affairExposed', _pick([
            `${source} couldn't keep it in anymore. "${partner}, I need to tell you something about ${cheater}." The words hung in the air. ${partner}'s face went blank. Then it went cold.`,
            `"I've been watching ${cheater} and ${secretPartner} for days. I can't stay quiet anymore." ${source} told ${partner} everything. The beach meetings. The secret looks. All of it.`,
            `${source} pulled ${partner} aside after the challenge. "You deserve to know." What followed was the conversation that changes the game.`,
            `"${partner}. Sit down. This is going to hurt." ${source} said it fast, like ripping off a bandage. ${cheater} and ${secretPartner}. The whole thing. ${partner} didn't say a word for five minutes.`,
          ]), [source, partner, cheater]);
          _resolveAffairExposure(af, ep, epNum, pushEvt, _pick);
          return;
        }
      }

      // Rumor camp event (50% chance)
      if (Math.random() < 0.50) {
        const src = _pick(af.rumorSources.filter(s => active.includes(s)));
        if (src) {
          pushEvt('affairRumor', _pick([
            `The whispers are getting louder. ${src} mentioned ${cheater} and ${secretPartner} to someone at the well. It's not a secret anymore — it's an open question.`,
            `${src} keeps glancing between ${cheater} and ${partner}. The guilt of knowing is eating at ${pronouns(src).obj}. But telling ${partner} means blowing up the tribe.`,
            `"Someone needs to say something to ${partner}." ${src} said it under ${pronouns(src).posAdj} breath. Nobody volunteered. The affair is the worst-kept secret in camp.`,
            `${src} debated all day. Tell ${partner}? Stay quiet? In the end, ${pronouns(src).sub} said nothing. Again. The longer this goes, the worse it'll be when it breaks.`,
            `Three people know about ${cheater} and ${secretPartner} now. ${src} is one of them. The question isn't whether ${partner} finds out — it's when.`,
            `${src} pulled aside another tribemate. "You see it too, right? ${cheater} and ${secretPartner}?" The nod confirmed it. The secret is spreading.`,
            `${src} almost told ${partner} today. Almost. But the words wouldn't come. "It's not my place," ${pronouns(src).sub} told the cameras. "But somebody has to say something."`,
            `The camp has divided into people who know and people who don't. ${partner} is in the second group. ${src} is running out of reasons to keep it that way.`,
          ]), [src, cheater, partner]);
        }
      }

      // After 2 episodes of rumors → caught tier
      if (af.episodesActive >= af.formedEp + 3 || af.rumorSources.length >= 3) {
        const confronter = _pick(af.rumorSources.filter(s => active.includes(s)));
        if (confronter) {
          af.exposure = 'caught';
          af.caughtBy = confronter;
          pushEvt('affairCaught', _pick([
            `${confronter} walked to the beach at the wrong time. Or the right time. ${cheater} and ${secretPartner}, alone, too close for strategy. ${cheater} froze. "This isn't what it looks like." It was exactly what it looked like.`,
            `${confronter} found them. Behind the shelter, after dark. ${cheater} stammered an excuse. ${secretPartner} said nothing. The silence confirmed everything.`,
            `"I knew it." ${confronter} stood at the tree line, arms crossed. ${cheater} and ${secretPartner} pulled apart. "How long has this been going on?" ${cheater} didn't answer.`,
            `${confronter} wasn't even looking for them. But there they were — ${cheater} and ${secretPartner}, tucked into the rocks where nobody was supposed to see. ${confronter} saw.`,
            `${confronter} came around the corner and stopped dead. ${cheater} and ${secretPartner} jumped apart like they'd been burned. "Don't insult me," ${confronter} said. "I have eyes."`,
            `The moment ${confronter} caught ${cheater} with ${secretPartner}, everything changed. The excuse was instant. The lie was bad. ${confronter}'s expression said: I'm not buying this.`,
            `${confronter} saw ${cheater} and ${secretPartner} together. Not sitting together — TOGETHER. The kind of together that makes excuses impossible. "We were just talking." "${confronter}: "No. You weren't."`,
            `${confronter} had suspected for days. Tonight ${pronouns(confronter).sub} got the proof. ${cheater} and ${secretPartner}, by the fire, when they thought nobody was watching. ${confronter} was watching.`,
          ]), [confronter, cheater, secretPartner]);
        }
      }
    }

    // ═══ TIER 3: CAUGHT ═══
    else if (af.exposure === 'caught') {
      addBond(cheater, secretPartner, 0.1);

      if (!af.caughtTold) {
        const catcher = af.caughtBy;
        if (!catcher || !active.includes(catcher)) { af.caughtTold = true; return; }
        const catcherS = pStats(catcher);
        const tellChance = (catcherS.loyalty * 0.07 + Math.max(0, getBond(catcher, partner)) * 0.05) - (Math.max(0, getBond(catcher, cheater)) * 0.03);

        if (Math.random() < Math.max(0, tellChance)) {
          af.caughtTold = true;
          af.exposure = 'exposed';
          pushEvt('affairExposed', _pick([
            `${catcher} finally told ${partner}. "I saw ${cheater} with ${secretPartner}. I'm sorry. You deserved to know." The look on ${partner}'s face could have ended the game right there.`,
            `"I can't carry this anymore." ${catcher} sat ${partner} down. "It's ${cheater} and ${secretPartner}. I caught them." ${partner} went quiet — the dangerous kind of quiet.`,
            `${catcher} pulled ${partner} aside at the water well. "There's no easy way to say this." ${partner} listened. Then ${pp.sub} stood up without a word and walked toward ${cheater}.`,
            `"${partner}, I owe you the truth." ${catcher} laid it all out — the beach meetings, the looks, the excuses. ${partner}'s jaw tightened. "Thank you for telling me." The calm was terrifying.`,
          ]), [catcher, partner, cheater]);
          _resolveAffairExposure(af, ep, epNum, pushEvt, _pick);
          return;
        } else {
          // Staying silent — leverage
          if (!af._silentEventFired) {
            af._silentEventFired = true;
            addBond(cheater, catcher, -0.5);
            pushEvt('affairSilent', _pick([
              `${catcher} knows. ${cheater} knows that ${catcher} knows. They made eye contact at the fire and both looked away. ${catcher} hasn't told ${partner}. Not yet. But the power dynamic just shifted.`,
              `${catcher} is sitting on a bomb. ${cheater} brought ${pronouns(catcher).obj} extra rice. Volunteered for ${pronouns(catcher).posAdj} chores. The unspoken deal is clear: silence for loyalty.`,
              `"You owe me." ${catcher} didn't say it out loud. Didn't need to. ${cheater} understood. The secret stays — for now. The price is still being negotiated.`,
              `${catcher} decided to keep quiet. Not for ${cheater}'s sake — for ${pronouns(catcher).posAdj} own game. Information is currency. And ${catcher} just became the richest person on the tribe.`,
              `${catcher} hasn't told ${partner}. But ${pronouns(catcher).sub} also hasn't let ${cheater} forget. Every shared glance at tribal, every casual comment about "loyalty" — ${cheater} flinches. ${catcher} is playing a different game now.`,
              `The silence between ${catcher} and ${cheater} says everything. ${catcher} knows. ${cheater} knows ${catcher} knows. And ${partner} is the only one who doesn't. It's the most dangerous secret on the island.`,
              `${catcher} weighed it. Tell ${partner} and blow up the tribe? Or stay quiet and own ${cheater}? ${pronouns(catcher).Sub} chose power over honesty. The game is better for it. ${partner} is not.`,
              `${cheater} has been doing everything ${catcher} asks. Extra firewood. Better sleeping spot. The tribe thinks they're allies. The real currency is silence.`,
            ]), [catcher, cheater]);
          }
          // Silent catchers crack — 40% per episode
          if (Math.random() < 0.40) {
            af.caughtTold = true;
            af.exposure = 'exposed';
            pushEvt('affairExposed', _pick([
              `${catcher} cracked. The guilt was too much. "${partner}, there's something you need to hear." The dam broke. Everything came out.`,
              `${catcher} had been holding it for too long. At the fire, unprompted: "${partner}. I need to tell you about ${cheater} and ${secretPartner}." The tribe went silent.`,
              `${catcher} cornered ${partner} before tribal. "I should have told you sooner. ${cheater} has been seeing ${secretPartner} behind your back." ${partner} stared at ${catcher} for ten seconds. Then: "How long have you known?"`,
              `It was ${catcher} who finally broke. "I can't watch this anymore." ${pronouns(catcher).Sub} told ${partner} everything — the beach, the shelter, the looks. ${partner}'s hands were shaking by the end.`,
            ]), [catcher, partner, cheater]);
            _resolveAffairExposure(af, ep, epNum, pushEvt, _pick);
            return;
          }
        }
      }
    }
  });
}

export function _resolveAffairExposure(af, ep, epNum, pushEvt, _pick) {
  const { cheater, partner, secretPartner } = af;
  const sCenter = pStats(cheater);
  const bondPartner = getBond(cheater, partner);
  const bondSecret = getBond(cheater, secretPartner);
  const pc = pronouns(cheater);
  const pp = pronouns(partner);
  const ps = pronouns(secretPartner);

  // Find primary showmance for relationship length
  const primarySh = gs.showmances?.find(sh =>
    sh.players.includes(cheater) && sh.players.includes(partner) && sh.phase !== 'broken-up');
  const relLength = primarySh?.episodesActive || 0;

  // Decision: stay with partner or leave for secret?
  const scorePartner = bondPartner * 0.40
    + (sCenter.loyalty * 0.03 * relLength) * 0.30
    + (threatScore(secretPartner) - threatScore(partner)) * 0.20 * -1
    + (Math.random() - 0.5) * 0.10;
  const scoreSecret = bondSecret * 0.40
    + 0
    + (threatScore(partner) - threatScore(secretPartner)) * 0.20 * -1
    + (Math.random() - 0.5) * 0.10;

  const staysWithPartner = scorePartner >= scoreSecret;
  const chose = staysWithPartner ? partner : secretPartner;
  const leftFor = staysWithPartner ? null : secretPartner;

  // Partner reaction — personality-driven
  const sPartner = pStats(partner);
  const partnerSeverity = sPartner.loyalty * 0.3 + sPartner.temperament * -0.2 + bondPartner * 0.2;

  if (staysWithPartner) {
    addBond(cheater, partner, -2.0);
    addBond(cheater, secretPartner, -1.5);
    if (af.complicit) {
      addBond(secretPartner, cheater, -1.0);
    } else {
      addBond(secretPartner, cheater, -2.0);
    }
    pushEvt('affairChoice', _pick([
      `${cheater} chose ${partner}. "It was a mistake. It meant nothing." ${partner} didn't believe it. But ${pp.sub} stayed. For now.`,
      `${cheater} begged. ${partner} listened. ${secretPartner} walked away without a word. The showmance survives — but the trust doesn't.`,
      `"I'm choosing you," ${cheater} said to ${partner}. The words sounded rehearsed. ${secretPartner} heard them from across camp and laughed. Not a happy laugh.`,
      `${cheater} stayed with ${partner}. The tribe watched the reconciliation like a car crash in slow motion. Nobody believes it'll last.`,
      `${partner} took ${cheater} back. The tribe has opinions about that. ${secretPartner} has a plan about that. This isn't over.`,
      `"One chance," ${partner} said. "One." ${cheater} nodded. ${secretPartner} watched from across camp. The tension didn't break — it just changed shape.`,
      `${cheater} chose ${partner}. ${secretPartner} didn't fight it. Just nodded, walked to the shelter, and started having very different conversations with very different people.`,
      `${cheater} said all the right words. ${partner} heard them all. Whether ${pp.sub} believed them is another question. The tribe is taking bets.`,
    ]), [cheater, partner, secretPartner]);
  } else {
    addBond(cheater, partner, -4.0);
    addBond(secretPartner, partner, -2.0);
    if (primarySh) {
      primarySh.phase = 'broken-up';
      primarySh.breakupEp = epNum;
      primarySh.breakupVoter = cheater;
    }
    pushEvt('affairChoice', _pick([
      `${cheater} chose ${secretPartner}. In front of everyone. ${partner} didn't cry — just nodded slowly, like ${pp.sub} always knew this was coming.`,
      `"I can't pretend anymore." ${cheater} said it to ${partner} and the whole tribe heard. ${pc.Sub} walked to ${secretPartner}. ${partner} sat down and stared at the fire.`,
      `${cheater} left ${partner} for ${secretPartner}. The tribe split in half — not along alliance lines, but along who thinks ${cheater} is a villain and who thinks ${pc.sub} followed ${pc.posAdj} heart.`,
      `It's over. ${cheater} and ${partner} are done. ${cheater} and ${secretPartner} are... something. The tribe is in shambles. This is the episode everyone will remember.`,
      `${cheater} walked away from ${partner} and toward ${secretPartner}. The whole camp watched. ${partner} sat alone for a long time. When ${pp.sub} came back, ${pp.posAdj} eyes were dry but ${pp.posAdj} fists were clenched.`,
      `"I'm done lying." ${cheater} said it once, clearly. Then ${pc.sub} took ${secretPartner}'s hand. ${partner} watched the whole thing. Then ${pp.sub} got up, walked to the confessional, and didn't come back for an hour.`,
      `${cheater} chose. ${secretPartner} exhaled. ${partner} imploded. Three reactions, one decision, and a tribe that will never be the same.`,
      `The affair is over because the secret is over. ${cheater} chose ${secretPartner}. ${partner} lost everything in the time it took ${cheater} to say four words: "I'm with ${secretPartner} now."`,
    ]), [cheater, secretPartner, partner]);
  }

  af.resolved = true;
  af.resolution = { type: 'exposed', ep: epNum, chose, leftFor, staysWithPartner, partnerSeverity, complicit: af.complicit };
  ep.affairExposure = { cheater, partner, secretPartner, chose, leftFor, staysWithPartner, complicit: af.complicit, severity: partnerSeverity };

  // If cheater left partner — new showmance with secret partner if compatible + cap allows
  if (!staysWithPartner && romanticCompat(cheater, secretPartner)) {
    const _afShCount = (gs.showmances || []).filter(sh => sh.phase !== 'broken-up' && sh.players.every(p => gs.activePlayers.includes(p))).length;
    if (_afShCount < 2 && !gs.showmances.some(sh => sh.players.includes(cheater) && sh.players.includes(secretPartner) && sh.phase !== 'broken-up')) {
      gs.showmances.push({
        players: [cheater, secretPartner], phase: 'spark',
        sparkEp: epNum, episodesActive: 0, jealousPlayer: null, tested: false
      });
      ep.newShowmances = ep.newShowmances || [];
      ep.newShowmances.push({ a: cheater, b: secretPartner });
    }
  }
}

