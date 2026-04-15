// js/social-manipulation.js - Social manipulation camp events (forge note, lies, kiss trap, etc.)
import { gs, players } from './core.js';
import { pStats, pronouns, romanticCompat } from './players.js';
import { getBond, addBond } from './bonds.js';

export function _generateExposeSchemer(exposer, schemer, victim, group, ep, _rp) {
  if (!exposer || !schemer) return null;
  const _expP = pronouns(exposer), _schP = pronouns(schemer);
  const _vicP = victim ? pronouns(victim) : null;
  const exposeTexts = [
    `${exposer} gathers the group and lays out exactly what ${schemer} has been doing. Names, timelines, specifics. The tribe goes quiet.`,
    `${exposer} pulls people aside one by one with the same message: ${schemer} is behind it. By dinner it's common knowledge.`,
    `${exposer} confronts ${schemer} directly in front of witnesses. "Tell them what you told me." ${_schP.Sub} can't.`,
    `${exposer} connects the dots out loud. The picture that emerges of ${schemer}'s game is not flattering. The tribe reassesses everything.`,
  ];
  if (!gs._schemeHeat) gs._schemeHeat = {};
  gs._schemeHeat[schemer] = { amount: 2.0, expiresEp: (gs.episode || 0) + 1 + 3 };
  group.filter(p => p !== schemer && p !== exposer).forEach(p => {
    addBond(p, schemer, -0.5);
    addBond(p, exposer, 0.3);
  });
  if (victim) group.filter(p => p !== victim).forEach(p => addBond(p, victim, 0.3));
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[exposer] = (gs.popularity[exposer] || 0) + 2;
  gs.popularity[schemer] = (gs.popularity[schemer] || 0) - 2;
  return {
    type: 'exposeSchemer',
    players: [exposer, schemer, ...(victim ? [victim] : [])],
    text: _rp(exposeTexts),
    consequences: `${schemer} exposed — heat +2.0 for 3 eps. ${exposer} gains sympathy.`,
    badgeText: 'EXPOSED', badgeClass: 'gold'
  };
}

export function _generateComfortVictim(victim, group, ep, _rp) {
  if (!victim) return null;
  const compassionate = group.filter(p => p !== victim && (pStats(p).loyalty >= 6 || getBond(p, victim) >= 3));
  if (!compassionate.length) return null;
  const comforter = compassionate.reduce((best, p) => {
    const score = pStats(p).loyalty * 0.4 + getBond(p, victim) * 0.3 + pStats(p).social * 0.3;
    return score > (best._score || -Infinity) ? { name: p, _score: score } : best;
  }, {}).name;
  if (!comforter) return null;
  const _comP = pronouns(comforter), _vicP = pronouns(victim);
  const boost = 1.0 + pStats(comforter).social * 0.1;
  addBond(comforter, victim, boost);
  addBond(victim, comforter, boost);
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[comforter] = (gs.popularity[comforter] || 0) + 1;
  const comfortTexts = [
    `${comforter} finds ${victim} alone after everything and just sits with ${_vicP.obj}. No strategy. No agenda. ${victim} doesn't say much. ${_comP.Sub} do${_comP.sub==='they'?'':'es'}n't need to.`,
    `${comforter} pulls ${victim} aside and says the thing everyone else was thinking but wouldn't say. It lands.`,
    `${comforter} stays up with ${victim} long after the camp quiets down. By morning the bond between them is different — stronger.`,
    `${comforter} quietly advocates for ${victim} when others start questioning ${_vicP.posAdj} read of the situation. The gesture is noticed.`,
  ];
  return {
    type: 'comfortVictim',
    players: [comforter, victim],
    text: _rp(comfortTexts),
    consequences: `Bond ${comforter}↔${victim} +${boost.toFixed(1)}.`,
    badgeText: 'COMFORTED', badgeClass: 'green'
  };
}

export function _generateForgeNote(schemer, target, group, ep, _rp) {
  const results = [];
  const reader = target.a, alleged = target.b;
  const _sP = pronouns(schemer), _rdrP = pronouns(reader), _algP = pronouns(alleged);
  const sStats = pStats(schemer), rStats = pStats(reader);
  const noteQuality = sStats.strategic * 0.1 + sStats.social * 0.05;
  const belief = noteQuality + (5 - getBond(reader, alleged)) * 0.1;
  const resistance = rStats.mental * 0.08 + rStats.intuition * 0.05;

  const noteContents = [
    `a message suggesting ${alleged} is planning to flip`,
    `a note making it look like ${alleged} is running a side deal`,
    `a letter that implies ${alleged} has been talking about ${reader} behind ${_rdrP.posAdj} back`,
    `a fabricated confession about ${alleged}'s true alliance`,
    `a note that looks like ${alleged} is trying to recruit ${reader}'s closest ally`,
  ];
  const noteContent = _rp(noteContents);

  if (belief > resistance + 0.3) {
    // Believed
    const bondDrop = -(1.0 + noteQuality * 0.3);
    addBond(reader, alleged, bondDrop);
    if (ep) ep._socialVictim = alleged;
    if (ep) ep._socialSchemer = schemer;
    if (ep) ep._socialVictimTarget = reader;
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[alleged] = (gs.popularity[alleged] || 0) + 1;
    const believedTexts = [
      `${schemer} plants ${noteContent} where ${reader} will find it. ${_rdrP.Sub} read${_rdrP.sub==='they'?'':'s'} it twice, fold${_rdrP.sub==='they'?'':'s'} it carefully, and put${_rdrP.sub==='they'?'':'s'} it away. ${_rdrP.PosAdj} whole attitude toward ${alleged} shifts.`,
      `The forged note reaches ${reader} exactly as ${schemer} intended. ${_rdrP.Sub} do${_rdrP.sub==='they'?'':'es'}n't question it — the handwriting looks right, the story fits. ${alleged} has no idea what's coming.`,
      `${reader} finds the note ${schemer} planted. It's ${noteContent}. ${_rdrP.Sub} believe${_rdrP.sub==='they'?'':'s'} every word. The bond between ${reader} and ${alleged} quietly cracks.`,
    ];
    results.push({
      type: 'forgeNote', players: [schemer, reader, alleged],
      text: _rp(believedTexts),
      consequences: `Bond ${reader}↔${alleged} ${bondDrop.toFixed(1)}.`,
      badgeText: 'FORGED NOTE', badgeClass: 'red'
    });
    const comfort = _generateComfortVictim(alleged, group, ep, _rp);
    if (comfort) results.push(comfort);
  } else if (resistance > belief + 0.5) {
    // Detected — schemer exposed
    addBond(reader, schemer, -1.0);
    group.filter(p => p !== schemer && p !== reader).forEach(p => addBond(p, schemer, -0.5));
    if (!gs._schemeHeat) gs._schemeHeat = {};
    gs._schemeHeat[schemer] = { amount: 2.0, expiresEp: (gs.episode || 0) + 1 + 3 };
    const detectedTexts = [
      `${schemer} slips a forged note into ${reader}'s things. ${_rdrP.Sub} find${_rdrP.sub==='they'?'':'s'} it — and immediately recognizes ${schemer}'s handwriting. The confrontation that follows is quiet and devastating.`,
      `The forgery falls apart the moment ${reader} reads it carefully. ${_rdrP.Sub} trace${_rdrP.sub==='they'?'':'s'} it back to ${schemer} in under an hour. When ${_rdrP.sub} confront${_rdrP.sub==='they'?'':'s'} ${_sP.obj}, ${schemer} has no explanation.`,
      `${reader} brings the forged note to the group and asks questions until the story doesn't hold. The tribe turns to ${schemer} for an answer. ${_sP.Sub} do${_sP.sub==='they'?'':'es'}n't have one.`,
    ];
    const exposeEvt = _generateExposeSchemer(reader, schemer, null, group, ep, _rp);
    results.push({
      type: 'forgeNote', players: [schemer, reader],
      text: _rp(detectedTexts),
      consequences: `${schemer} caught — heat +2.0 for 3 eps.`,
      badgeText: 'EXPOSED', badgeClass: 'gold'
    });
    if (exposeEvt) results.push(exposeEvt);
  } else {
    // Skeptical — seed of doubt
    addBond(reader, alleged, -0.5);
    const skepticTexts = [
      `${schemer} plants a forged note for ${reader} about ${alleged}. ${_rdrP.Sub} read${_rdrP.sub==='they'?'':'s'} it and pause — not convinced, but not completely dismissive either. The seed is there.`,
      `The note ${schemer} left for ${reader} lands in a gray area. ${_rdrP.Sub} can't confirm it — but ${_rdrP.sub} can't quite shake it either. Something has shifted in how ${_rdrP.sub} see${_rdrP.sub==='they'?'':'s'} ${alleged}.`,
      `${reader} finds ${schemer}'s planted note but can't verify the story. ${_rdrP.Sub} file${_rdrP.sub==='they'?'':'s'} it away without confronting ${alleged}. For now.`,
    ];
    results.push({
      type: 'forgeNote', players: [schemer, reader, alleged],
      text: _rp(skepticTexts),
      consequences: `Bond ${reader}↔${alleged} -0.5 (seed of doubt).`,
      badgeText: 'FORGED NOTE', badgeClass: 'red'
    });
  }
  return results;
}

export function _generateSpreadLies(schemer, target, group, ep, _rp) {
  const results = [];
  const listener = target.a, accused = target.b;
  const _sP = pronouns(schemer), _lP = pronouns(listener), _aP = pronouns(accused);
  const sStats = pStats(schemer), lStats = pStats(listener);
  const persuasion = sStats.social * 0.08 + sStats.strategic * 0.04;
  const resistance = lStats.social * 0.06 + lStats.intuition * 0.04 + getBond(listener, accused) * 0.03;

  const lieThemes = [
    `that ${accused} has been throwing ${listener}'s name around`,
    `that ${accused} said something about ${listener} that was deeply personal`,
    `that ${accused} is secretly working against ${listener}'s best interests`,
    `that ${accused} laughed at ${listener} when ${_lP.sub} weren't around`,
  ];
  const lieTheme = _rp(lieThemes);

  if (persuasion > resistance) {
    // Believed
    addBond(listener, accused, -1.5);
    if (ep) ep._socialVictim = accused;
    if (ep) ep._socialSchemer = schemer;
    const believedTexts = [
      `${schemer} tells ${listener} ${lieTheme}. ${_lP.Sub} believe${_lP.sub==='they'?'':'s'} every word. By the time ${_sP.sub} walk${_sP.sub==='they'?'':'s'} away, the damage is done.`,
      `${schemer} pulls ${listener} aside with a look of concern. "I wasn't going to say anything, but..." What follows is ${lieTheme}. ${_lP.Sub} absorb${_lP.sub==='they'?'':'s'} it without question.`,
      `${schemer} delivers the lie so cleanly that ${listener} thanks ${_sP.obj} for telling ${_lP.obj}. ${accused} has no idea ${_aP.posAdj} standing just took a hit.`,
    ];
    results.push({
      type: 'spreadLies', players: [schemer, listener, accused],
      text: _rp(believedTexts),
      consequences: `Bond ${listener}↔${accused} -1.5.`,
      badgeText: 'LIED TO', badgeClass: 'red'
    });
    // Confrontation sub-event — schemer -1 (went public), accused +1 (wrongly accused sympathy)
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[schemer] = (gs.popularity[schemer] || 0) - 1;
    gs.popularity[accused] = (gs.popularity[accused] || 0) + 1;
    if (lStats.temperament <= 6 && Math.random() < 0.60) {
      addBond(listener, accused, -0.5);
      addBond(accused, listener, -0.5);
      const confrontTexts = [
        `${listener} can't hold it. ${_lP.Sub} go${_lP.sub==='they'?'':'es'} straight to ${accused} and says it out loud in front of witnesses. ${accused} has no idea what's happening. The exchange is raw and very public.`,
        `${listener} confronts ${accused} with the thing ${schemer} told ${_lP.obj}. ${accused} denies it. ${_lP.Sub} push${_lP.sub==='they'?'':'es'} harder. Camp goes very quiet.`,
        `The confrontation between ${listener} and ${accused} happens in the middle of camp. Voices raise. Nobody interrupts. ${schemer} watches from a distance and says nothing.`,
      ];
      results.push({
        type: 'spreadLies', players: [listener, accused],
        text: _rp(confrontTexts),
        consequences: `${listener} publicly confronts ${accused} — bond drop -0.5 each.`,
        badgeText: 'CONFRONTATION', badgeClass: 'red'
      });
    }
    const comfort = _generateComfortVictim(accused, group, ep, _rp);
    if (comfort) results.push(comfort);
  } else {
    // Not believed — listener warns accused, schemer loses trust
    addBond(listener, schemer, -0.5);
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[schemer] = (gs.popularity[schemer] || 0) - 1;
    const notBelievedTexts = [
      `${schemer} tries to plant something with ${listener} about ${accused}. ${_lP.Sub} listen${_lP.sub==='they'?'':'s'}, but the story doesn't sit right. ${_lP.Sub} file${_lP.sub==='they'?'':'s'} ${schemer}'s name away for later.`,
      `${listener} hears what ${schemer} is claiming about ${accused} and doesn't buy it. Something about the delivery felt rehearsed.`,
      `${schemer}'s pitch to ${listener} backfires. ${_lP.Sub} can see through the framing — and ${_lP.sub} like${_lP.sub==='they'?'':'s'} ${accused} too much to believe it without more.`,
    ];
    results.push({
      type: 'spreadLies', players: [schemer, listener],
      text: _rp(notBelievedTexts),
      consequences: `Lie rejected — bond ${listener}↔${schemer} -0.5.`,
      badgeText: 'LIED TO', badgeClass: 'red'
    });
    if (Math.random() < 0.50) {
      addBond(listener, accused, 0.3);
      const _acc2P = pronouns(accused);
      results.push({
        type: 'spreadLies', players: [listener, accused],
        text: `${listener} pulls ${accused} aside and tells ${_acc2P.obj} what ${schemer} said. ${accused} looks rattled — not by the content, but by the move.`,
        consequences: `${listener} warns ${accused} — bond +0.3.`,
        badgeText: 'WARNED', badgeClass: 'blue'
      });
    }
  }
  return results;
}

export function _generateKissTrap(schemer, target, group, ep, _rp) {
  const results = [];
  const showmancePair = target.showmance;
  if (!showmancePair) return results;
  const [p1, p2] = showmancePair.players;
  // Witness = lower mental partner; kissTarget = the other
  const witness = pStats(p1).mental <= pStats(p2).mental ? p1 : p2;
  const kissTarget = witness === p1 ? p2 : p1;
  const _wP = pronouns(witness), _kP = pronouns(kissTarget), _sP = pronouns(schemer);

  // Schemer must be romantically plausible with kissTarget (sexuality check)
  if (typeof romanticCompat === 'function' && !romanticCompat(schemer, kissTarget)) return results;

  // Need accomplice
  const accompliceCandidates = group.filter(p => p !== schemer && p !== witness && p !== kissTarget && getBond(p, schemer) >= 2 && pStats(p).social >= 5);
  if (!accompliceCandidates.length) return results;
  const accomplice = accompliceCandidates[Math.floor(Math.random() * accompliceCandidates.length)];
  const _acP = pronouns(accomplice);

  const sStats = pStats(schemer), ktStats = pStats(kissTarget);
  const power = sStats.social * 0.08 + sStats.strategic * 0.04;
  const resistance = ktStats.loyalty * 0.06 + getBond(kissTarget, witness) * 0.04 + ktStats.intuition * 0.03;

  if (power < resistance && Math.random() < 0.70) {
    // Scheme failed
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[schemer] = (gs.popularity[schemer] || 0) - 1;
    const failTexts = [
      `${schemer} tries to orchestrate a trap — getting ${accomplice} to draw ${witness} away while ${_sP.sub} make${_sP.sub==='they'?'':'s'} a move on ${kissTarget}. ${kissTarget} sees through it immediately and shuts it down.`,
      `The plan falls apart before it starts. ${kissTarget} doesn't go where ${schemer} needs ${_kP.obj} to go. The whole setup dissolves.`,
    ];
    results.push({
      type: 'kissTrap', players: [schemer, kissTarget],
      text: _rp(failTexts),
      consequences: `Kiss trap failed.`,
      badgeText: 'KISS TRAP', badgeClass: 'red'
    });
    return results;
  }

  // Trap succeeds
  const beliefLevel = (10 - pStats(witness).mental) * 0.08 + (10 - pStats(witness).intuition) * 0.04;
  const bondDrop = -(2.0 + beliefLevel * 2.0);
  addBond(witness, kissTarget, bondDrop);
  addBond(kissTarget, schemer, -1.0);
  if (ep) ep._socialVictim = witness;
  if (ep) ep._socialSchemer = schemer;
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[schemer] = (gs.popularity[schemer] || 0) - 3;
  gs.popularity[witness] = (gs.popularity[witness] || 0) + 2;
  gs.popularity[kissTarget] = (gs.popularity[kissTarget] || 0) + 1;

  const trapTexts = [
    `${accomplice} pulls ${witness} away on a made-up errand. While ${_wP.sub}'re${_wP.sub==='they'?' ':'re '}gone, ${schemer} finds ${kissTarget} alone. When ${witness} comes back early, ${_wP.sub} see${_wP.sub==='they'?'':'s'} everything.`,
    `The setup is perfect. ${accomplice} keeps ${witness} occupied. ${schemer} uses the opening. ${witness} walks in at the wrong moment. The look on ${_wP.posAdj} face says it all.`,
    `${schemer} has arranged this — ${accomplice} distracting ${witness}, the private moment with ${kissTarget}. It plays out exactly as planned. Except ${witness} returns early. Nothing is the same after that.`,
  ];
  results.push({
    type: 'kissTrap', players: [schemer, accomplice, kissTarget, witness],
    text: _rp(trapTexts),
    consequences: `Bond ${witness}↔${kissTarget} ${bondDrop.toFixed(1)}. ${kissTarget} bond with ${schemer} -1.0.`,
    badgeText: 'KISS TRAP', badgeClass: 'red'
  });

  // Witness reaction
  const witnessTmp = pStats(witness).temperament;
  const witnessTexts = witnessTmp <= 5
    ? [`${witness} doesn't speak for a long time. When ${_wP.sub} finally do${_wP.sub==='they'?'':'es'}, it's to ${kissTarget}: "Were you ever actually in this with me?" There's no good answer.`,
       `${witness} goes completely cold. ${_wP.Sub} don't${_wP.sub==='they'?'':'s'} cry, don't${_wP.sub==='they'?'':'s'} yell — just shut down. That's almost worse.`]
    : [`${witness} confronts ${kissTarget} immediately. The argument is loud enough for the whole camp to hear. By the end they're not speaking.`,
       `${witness} explodes — at ${kissTarget}, at ${accomplice}, at the situation. The showmance is over in real time and everyone witnesses it.`];
  results.push({
    type: 'kissTrap', players: [witness, kissTarget],
    text: _rp(witnessTexts),
    consequences: `Showmance under threat.`,
    badgeText: 'HEARTBROKEN', badgeClass: 'red'
  });

  // Break showmance if bond drops to 0 or below
  const currentBond = getBond(witness, kissTarget);
  if (currentBond <= 0) {
    const shm = gs.showmances?.find(s => s.players.includes(witness) && s.players.includes(kissTarget) && s.phase !== 'broken-up');
    if (shm) shm.phase = 'broken-up';
    gs.popularity[schemer] = (gs.popularity[schemer] || 0) - 1;
    results.push({
      type: 'kissTrap', players: [witness, kissTarget],
      text: `The showmance between ${witness} and ${kissTarget} is over. What ${schemer} started, the trust collapse finished.`,
      consequences: `Showmance phase set to 'broken-up'.`,
      badgeText: 'SHOWMANCE DESTROYED', badgeClass: 'red'
    });
  }

  // Detection chain
  const detectorCandidates = group.filter(p => p !== schemer && p !== accomplice && p !== witness && p !== kissTarget && pStats(p).intuition >= 6);
  detectorCandidates.forEach(detector => {
    if (Math.random() < 0.40) {
      const exposeEvt = _generateExposeSchemer(detector, schemer, witness, group, ep, _rp);
      if (exposeEvt) results.push(exposeEvt);
    }
  });

  const comfort = _generateComfortVictim(witness, group, ep, _rp);
  if (comfort) results.push(comfort);
  return results;
}

export function _generateWhisperCampaign(schemer, target, group, ep, _rp) {
  const results = [];
  const _sP = pronouns(schemer);
  const listeners = group.filter(p => p !== schemer && p !== target).slice(0, 6);
  if (!listeners.length) return results;
  let influenced = 0;
  const sStats = pStats(schemer);
  listeners.forEach(listener => {
    const influence = sStats.strategic * 0.04 + getBond(schemer, listener) * 0.02;
    const deflection = pStats(listener).intuition * 0.04 + getBond(listener, target) * 0.03;
    if (influence > deflection && Math.random() < 0.50) {
      addBond(listener, target, -0.3);
      influenced++;
    }
  });
  // Detection
  const detected = pStats(target).intuition * 0.06 > sStats.strategic * 0.05;
  if (detected) {
    const exposeEvt = _generateExposeSchemer(target, schemer, null, group, ep, _rp);
    if (exposeEvt) results.push(exposeEvt);
  }
  const whisperTexts = [
    `${schemer} works the camp methodically — a quiet word here, a sideways comment there. Nobody realizes it's coordinated. By nightfall, ${target}'s name carries a different weight.`,
    `${schemer} does a lap around the tribe one by one, planting small doubts about ${target}. Each conversation looks innocent. The cumulative effect is not.`,
    `${schemer} runs a whisper campaign against ${target} — subtle, distributed, effective. No single person can point to anything concrete, but everyone is slightly more wary.`,
  ];
  results.push({
    type: 'whisperCampaign', players: [schemer, target],
    text: _rp(whisperTexts),
    consequences: `${influenced} players had bond with ${target} reduced -0.3.${detected ? ` ${target} detected the campaign.` : ''}`,
    badgeText: 'WHISPERS', badgeClass: 'blue'
  });
  return results;
}

export function _generateCampaignRally(rallier, target, group, ep, _rp) {
  const results = [];
  const _rlyP = pronouns(rallier);
  const listeners = group.filter(p => p !== rallier && p !== target);
  if (!listeners.length) return results;
  let agreed = 0;
  const rStats = pStats(rallier);
  listeners.forEach(listener => {
    const flipChance = rStats.social * 0.05 + getBond(rallier, listener) * 0.03;
    if (Math.random() < flipChance) agreed++;
  });
  if (agreed > 0) {
    if (!gs._schemeHeat) gs._schemeHeat = {};
    gs._schemeHeat[target] = { amount: Math.min(3.0, agreed * 0.5), expiresEp: (gs.episode || 0) + 1 + 2 };
  }
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[target] = (gs.popularity[target] || 0) - 1;
  // Rallier gets +1 if rallying against a known villain/schemer (righteous anger)
  const _rallyTargetIsSchemer = (gs._schemeHeat && gs._schemeHeat[target] && gs._schemeHeat[target].amount >= 1.5);
  if (_rallyTargetIsSchemer) gs.popularity[rallier] = (gs.popularity[rallier] || 0) + 1;
  const rallyTexts = [
    `${rallier} makes the rounds — every conversation ends the same way: ${target} needs to go. ${_rlyP.Sub} don't${_rlyP.sub==='they'?'':'s'} ask, ${_rlyP.sub} inform${_rlyP.sub==='they'?'':'s'}. By the time ${_rlyP.sub} finish${_rlyP.sub==='they'?'':'s'}, ${agreed} people are on board.`,
    `${rallier} organizes a campaign to flip the tribe against ${target}. The pitch is emotional, personal, and specific. ${agreed} people take the bait.`,
    `${rallier} goes player to player making the case against ${target}. Some listen. Some don't. ${agreed} agree enough to matter.`,
    `${rallier} pushes hard against ${target} — pulling in favors, calling in bonds, leaning on every relationship. ${agreed} players move.`,
  ];
  results.push({
    type: 'campaignRally', players: [rallier, target],
    text: _rp(rallyTexts),
    consequences: `${agreed} players moved. ${target} heat +${Math.min(3.0, agreed * 0.5).toFixed(1)} for 2 eps.`,
    badgeText: 'CAMPAIGNED', badgeClass: 'blue'
  });
  return results;
}

export function generateSocialManipulationEvents(group, ep, boostRate) {
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const results = [];
  if (group.length < 3) return results;

  // Identify eligible schemers — must have villain intent, not just brains
  const VILLAIN_ARCHETYPES = ['villain', 'mastermind', 'schemer'];
  const NICE_ARCHETYPES = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
  // Neutral: hothead, challenge-beast, wildcard, chaos-agent, floater, perceptive-player
  const schemers = group.filter(name => {
    const st = pStats(name);
    const arch = players.find(p => p.name === name)?.archetype || '';
    const isNice = NICE_ARCHETYPES.has(arch);
    // Villain archetypes always qualify
    if (VILLAIN_ARCHETYPES.includes(arch)) return true;
    // Nice archetypes NEVER scheme (even with high strategic)
    if (isNice) return false;
    // Neutral archetypes: need strategic + low loyalty
    return (st.strategic >= 6 && st.loyalty <= 4);
  });
  if (!schemers.length) return results;

  // Identify viable targets
  const showmanceTargets = [];
  const bondTargets = [];
  const grudgeTargets = [];

  (gs.showmances || []).filter(s => s.phase !== 'broken-up' && s.players.every(p => group.includes(p))).forEach(shm => {
    showmanceTargets.push({ type: 'showmance', showmance: shm, score: 3 + Math.random() * 2 });
  });
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const bond = getBond(group[i], group[j]);
      if (bond >= 4) bondTargets.push({ type: 'bond', a: group[i], b: group[j], score: bond * 0.5 + Math.random() * 2 });
      if (bond <= -3) grudgeTargets.push({ type: 'grudge', a: group[i], b: group[j], score: Math.abs(bond) * 0.3 + Math.random() * 2 });
    }
  }
  const allTargets = [
    ...showmanceTargets,
    ...bondTargets.sort((a, b) => b.score - a.score).slice(0, 3),
    ...grudgeTargets.sort((a, b) => b.score - a.score).slice(0, 2),
  ];
  if (!allTargets.length) return results;

  let schemesThisEp = 0;
  const shuffledSchemers = [...schemers].sort(() => Math.random() - 0.5);

  for (const schemer of shuffledSchemers) {
    if (schemesThisEp >= 2) break;
    if (Math.random() > boostRate) continue;
    const sStats = pStats(schemer);
    let events = [];

    // Build a weighted pool of possible schemes this schemer can attempt
    const schemeOptions = [];

    // Kiss trap — needs showmance + high strategic
    if (showmanceTargets.length && sStats.strategic >= 7) {
      schemeOptions.push({ weight: 2, fn: () => _generateKissTrap(schemer, showmanceTargets[0], group, ep, _rp) });
    }
    // Spread lies — needs a bond or grudge pair, social-heavy schemer
    if (bondTargets.length || grudgeTargets.length) {
      const pairTarget = [...bondTargets, ...grudgeTargets].sort((a, b) => b.score - a.score)[0];
      if (pairTarget) schemeOptions.push({ weight: 3, fn: () => _generateSpreadLies(schemer, pairTarget, group, ep, _rp) });
    }
    // Forge note — needs any pair target
    if (bondTargets.length || grudgeTargets.length) {
      const pairTarget = [...bondTargets, ...grudgeTargets].sort(() => Math.random() - 0.5)[0]; // random pair, not always best
      if (pairTarget) schemeOptions.push({ weight: 3, fn: () => _generateForgeNote(schemer, pairTarget, group, ep, _rp) });
    }
    // Whisper campaign — works against anyone
    const whisperTarget = group.find(p => p !== schemer && getBond(schemer, p) <= -1);
    if (whisperTarget) {
      schemeOptions.push({ weight: 2, fn: () => _generateWhisperCampaign(schemer, whisperTarget, group, ep, _rp) });
    }

    if (!schemeOptions.length) continue;

    // Weighted random pick
    const totalWeight = schemeOptions.reduce((sum, o) => sum + o.weight, 0);
    let roll = Math.random() * totalWeight;
    let picked = schemeOptions[0];
    for (const opt of schemeOptions) {
      roll -= opt.weight;
      if (roll <= 0) { picked = opt; break; }
    }

    events = picked.fn();
    if (events.length) {
      events.forEach(e => results.push(e));
      schemesThisEp++;
    }
  }

  // Campaign rally: if ep._socialVictim is set and an angry social player exists
  if (ep?._socialVictim) {
    const victim = ep._socialVictim;
    const rallierCandidates = group.filter(p => p !== victim && p !== ep._socialSchemer && pStats(p).social >= 6 && getBond(p, victim) >= 2);
    if (rallierCandidates.length) {
      const rallier = rallierCandidates.reduce((best, p) => {
        const s = pStats(p).social * 0.5 + getBond(p, victim) * 0.3;
        return s > (best._s || -Infinity) ? { name: p, _s: s } : best;
      }, {}).name;
      if (rallier) {
        const rallyEvents = _generateCampaignRally(rallier, ep._socialSchemer, group, ep, _rp);
        rallyEvents.forEach(e => results.push(e));
      }
    }
  }

  return results;
}
