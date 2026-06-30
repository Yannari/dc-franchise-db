// js/rescue-island.js - Rescue Island (RI) lifecycle: duels, life events, reentry
import { gs, players, seasonConfig } from './core.js';
import { pStats, pronouns, getPlayerState } from './players.js';
import { getBond, addBond } from './bonds.js';
import { wRandom } from './alliances.js';
import { CHALLENGE_BANK } from './ri-challenge-bank.js';
import { CHALLENGE_BANK_2 } from './ri-challenge-bank-2.js';

// Merge both halves of the challenge bank
const ALL_CHALLENGES = { ...CHALLENGE_BANK, ...CHALLENGE_BANK_2 };
const ALL_CHALLENGE_IDS = Object.keys(ALL_CHALLENGES);

function _getChallenge(id) { return ALL_CHALLENGES[id]; }
function _randomChallenge() { return ALL_CHALLENGES[ALL_CHALLENGE_IDS[Math.floor(Math.random() * ALL_CHALLENGE_IDS.length)]]; }

// Backward-compatible export for rescue format (episode.js simple wRandom pick)
export const RI_DUEL_CHALLENGES = ALL_CHALLENGE_IDS.map(id => {
  const c = ALL_CHALLENGES[id];
  return {
    id: c.id, name: c.name, desc: c.desc,
    stat: s => s[c.primary] * 0.6 + s[c.secondary] * 0.4,
  };
});

const VALID_STATS = ['physical','endurance','mental','social','strategic','loyalty','boldness','intuition','temperament'];

function _noise(n) { return (Math.random() - 0.5) * n * 2; }

function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function _shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ══════════════════════════════════════════════════════════════════════
// SCORE-AWARE HOST COMMENTARY
// ══════════════════════════════════════════════════════════════════════

function _hostLine(slot, context) {
  const { leader, trailer, winner, loser, margin } = context;
  const HOST = {
    opener: [
      `"This is it. One stays, one goes. Survivors ready?"`,
      `"You both know what's at stake. Let's get to it."`,
      `"The arena doesn't lie. It will tell us who deserves to stay."`,
      `"No alliances out here. No strategy. Just you and the challenge."`,
      `"Welcome back to the arena. I wish I could say it gets easier. It doesn't."`,
    ],
    'after1.leading': [
      `"${leader} takes the first round! ${trailer} — you need to respond RIGHT NOW."`,
      `"One round in and ${leader} is looking sharp. ${trailer}, dig deep."`,
      `"${leader} draws first blood. ${trailer} is on the back foot."`,
      `"Advantage: ${leader}. But this is far from over."`,
    ],
    'after2.matchPoint': [
      `"Match point. ${leader} wins this next one and it is OVER for ${trailer}."`,
      `"${leader} is one round away from ending this. ${trailer}, this is do or die."`,
      `"${trailer} is staring down elimination. One more loss and the dream is over."`,
      `"Back against the wall for ${trailer}. ${leader} can smell the finish line."`,
    ],
    'after2.tied': [
      `"We are TIED one apiece. This is EVERYTHING right here."`,
      `"One all! The final round decides it. Winner takes all."`,
      `"Tied up. It all comes down to this last round. You can feel it."`,
      `"Dead even. This is why we play three rounds."`,
    ],
    'after2.dominant': [
      `"${leader} is rolling. ${trailer} needs a miracle."`,
      `"Complete control from ${leader}. ${trailer} looks shaken."`,
      `"Two rounds in and it hasn't been close. ${trailer} has to find something fast."`,
      `"Dominant performance from ${leader}. Can ${trailer} make this interesting?"`,
    ],
    'closer.sweep': [
      `"Three for three. That is TOTAL DOMINATION by ${winner}."`,
      `"A sweep! ${winner} didn't give ${loser} a single round. Ruthless."`,
      `"${winner} made a statement tonight. ${loser} never had a chance."`,
      `"Clean sweep. ${winner} is the real deal."`,
    ],
    'closer.comeback': [
      `"WHAT a comeback! Down after round one and ${winner} claws all the way back!"`,
      `"${winner} was on the ropes — and STILL found a way. Incredible."`,
      `"You can't teach that kind of fight. ${winner} refused to die."`,
      `"Down but not out. ${winner} proves why this game is never over."`,
    ],
    'closer.close': [
      `"By the THINNEST of margins. ${winner} survives to fight another day."`,
      `"That could have gone either way. ${winner} just barely edges it."`,
      `"Heartbreaking for ${loser}. Inches away. ${winner} lives on."`,
      `"A razor-thin finish. ${winner} holds on — but only just."`,
    ],
    'closer.dominant': [
      `"${winner} made that look easy. An impressive showing."`,
      `"Not much ${loser} could do there. ${winner} was simply better today."`,
      `"${winner} was in control the whole way. Commanding performance."`,
      `"${winner} leaves no doubt. That's how you survive on Redemption Island."`,
    ],
  };
  const pool = HOST[slot];
  if (!pool || !pool.length) return `"Let's see what happens next."`;
  let line = _pick(pool);
  return line;
}

function _pickHostSlot(phaseIdx, totalPhases, winsPerPlayer, leader, trailer) {
  if (phaseIdx === 0) {
    return 'after1.leading';
  }
  if (phaseIdx === totalPhases - 2) {
    const leaderWins = winsPerPlayer[leader] || 0;
    const trailerWins = winsPerPlayer[trailer] || 0;
    if (leaderWins === trailerWins) return 'after2.tied';
    if (leaderWins >= 2) return 'after2.dominant';
    return 'after2.matchPoint';
  }
  return 'after1.leading';
}

function _pickCloserSlot(phases, winner, loser) {
  const winnerPhaseWins = phases.filter(p => p.winner === winner).length;
  const loserPhaseWins = phases.filter(p => p.winner === loser).length;
  if (winnerPhaseWins === phases.length) return 'closer.sweep';
  if (loserPhaseWins > 0 && phases[0].winner === loser) return 'closer.comeback';
  const avgMargin = phases.reduce((s, p) => s + (p.margin || 0), 0) / phases.length;
  if (avgMargin < 1.5) return 'closer.close';
  return 'closer.dominant';
}

// ══════════════════════════════════════════════════════════════════════
// BREATHING MOMENTS — between phases
// ══════════════════════════════════════════════════════════════════════

function _pickBreathingMoment(duelists, riList, phaseIdx, winsPerPlayer, challenge) {
  const eligible = [];
  const [a, b] = duelists.length >= 2 ? duelists : [duelists[0], null];
  if (!b) return null;

  const sA = pStats(a), sB = pStats(b);
  const prA = pronouns(a), prB = pronouns(b);
  const bond = getBond(a, b);
  const archA = players.find(p => p.name === a)?.archetype || '';
  const archB = players.find(p => p.name === b)?.archetype || '';
  const isVillainA = ['villain','mastermind','schemer'].includes(archA);
  const isVillainB = ['villain','mastermind','schemer'].includes(archB);
  const isNiceA = ['hero','loyal-soldier','social-butterfly','showmancer','underdog','goat'].includes(archA);
  const isNiceB = ['hero','loyal-soldier','social-butterfly','showmancer','underdog','goat'].includes(archB);
  const wA = winsPerPlayer[a] || 0, wB = winsPerPlayer[b] || 0;
  const aTrailing = wA < wB, bTrailing = wB < wA;

  // ── STRATEGIC ──
  if (isVillainA || sA.strategic >= 7) {
    eligible.push({
      type: 'psych-out', player: a, target: b,
      text: _pick([
        `${a} leans toward ${b} between rounds. "You feel that? That's you losing." ${b} says nothing.`,
        `${a} makes eye contact with ${b} and slowly shakes ${prA.pos} head. The message is clear.`,
        `${a} stretches casually, glancing at ${b} like this is beneath ${prA.obj}. The disrespect is deliberate.`,
        `"You done yet?" ${a} asks ${b}. ${b}'s jaw tightens.`,
      ]),
      bondDelta: -1, momentumDelta: { [b]: -0.3 },
      badgeText: 'PSYCH-OUT', badgeClass: 'ri-pill-danger', players: [a, b],
    });
  }
  if (isVillainB || sB.strategic >= 7) {
    eligible.push({
      type: 'psych-out', player: b, target: a,
      text: _pick([
        `${b} stares ${a} down during the reset. The silence is louder than any words.`,
        `${b} lets out a laugh between rounds. Not at anything funny. ${a} notices.`,
        `"I've beaten better," ${b} mutters loud enough for ${a} to hear.`,
        `${b} takes ${prB.pos} time resetting. Making ${a} wait. Making ${a} think.`,
      ]),
      bondDelta: -1, momentumDelta: { [a]: -0.3 },
      badgeText: 'PSYCH-OUT', badgeClass: 'ri-pill-danger', players: [b, a],
    });
  }

  if (sA.boldness >= 6) {
    eligible.push({
      type: 'self-talk', player: a,
      text: _pick([
        `${a} mutters to ${prA.ref} between rounds. Fists clenched. Eyes locked forward. ${prA.Sub} ${prA.sub==='they'?'are':'is'} going to a different place mentally.`,
        `${a} slaps ${prA.pos} own face. Hard. The fire in ${prA.pos} eyes doubles.`,
        `${a} closes ${prA.pos} eyes. Breathes. When they open, something has shifted.`,
        `"Come on. COME ON." ${a} pounds ${prA.pos} chest. The self-belief radiates.`,
      ]),
      mentalShift: 'obsessed',
      badgeText: 'FIRED UP', badgeClass: 'ri-pill-fire', players: [a],
    });
  }
  if (sB.boldness >= 6) {
    eligible.push({
      type: 'self-talk', player: b,
      text: _pick([
        `${b} talks to ${prB.ref}. You can see the words — "I can do this. I CAN do this."`,
        `${b} takes a deep breath, squares ${prB.pos} shoulders. Something clicks.`,
        `${b} is pacing between rounds. Muttering. Planning. ${prB.Sub} ${prB.sub==='they'?'are':'is'} building into something.`,
        `${b} lets out a primal yell between rounds. ${a} looks over. ${b} doesn't care.`,
      ]),
      mentalShift: 'obsessed',
      badgeText: 'FIRED UP', badgeClass: 'ri-pill-fire', players: [b],
    });
  }

  if (sA.intuition >= 6) {
    eligible.push({
      type: 'read-opponent', player: a, target: b,
      text: _pick([
        `${a} watches ${b}'s hands during the reset. The way ${prB.sub} grip${prB.sub==='they'?'':'s'}. The slight tremor. ${a} files it away.`,
        `${a} studies ${b}'s technique. There — a pattern. ${a} adjust${prA.sub==='they'?'':'s'} ${prA.pos} approach.`,
        `${a}'s eyes narrow. ${prA.Sub}'s spotted something in ${b}'s rhythm. A weakness to exploit.`,
        `${a} watches ${b} reset and nods slowly. ${prA.Sub} see${prA.sub==='they'?'':'s'} it now.`,
      ]),
      momentumDelta: { [a]: 0.5 },
      badgeText: 'READ', badgeClass: 'ri-pill-info', players: [a],
    });
  }
  if (sB.intuition >= 6) {
    eligible.push({
      type: 'read-opponent', player: b, target: a,
      text: _pick([
        `${b} tilts ${prB.pos} head, watching ${a} reset. Something about ${a}'s footwork... there. Found it.`,
        `${b} catches a tell in ${a}'s approach. A micro-adjustment follows.`,
        `${b} replays the last round in ${prB.pos} head. ${prB.Sub} see${prB.sub==='they'?'':'s'} where ${a} is weak.`,
        `Between rounds, ${b} recalibrates. ${prB.Sub}'ve read ${a}'s rhythm now.`,
      ]),
      momentumDelta: { [b]: 0.5 },
      badgeText: 'READ', badgeClass: 'ri-pill-info', players: [b],
    });
  }

  // ── SOCIAL ──
  if (bond >= 1) {
    eligible.push({
      type: 'respectful-nod', player: a, target: b,
      text: _pick([
        `Between rounds, ${a} and ${b} share a look. A tiny nod. Even here, there's respect.`,
        `${a} taps ${b}'s shoulder during the reset. No words. Just acknowledgment.`,
        `${a} and ${b} both pause. For a second, they're not opponents. Then the moment passes.`,
        `"Good round," ${a} says quietly. ${b} almost smiles. Almost.`,
      ]),
      bondDelta: 1,
      badgeText: 'RESPECT', badgeClass: 'ri-pill-green', players: [a, b],
    });
  }

  // Sideline encouragement (3+ residents)
  const spectators = (riList || []).filter(n => !duelists.includes(n));
  if (spectators.length > 0) {
    const spec = _pick(spectators);
    const prSpec = pronouns(spec);
    const supported = getBond(spec, a) >= getBond(spec, b) ? a : b;
    eligible.push({
      type: 'sideline-encouragement', player: spec, target: supported,
      text: _pick([
        `From the sideline, ${spec} shouts: "Come on, ${supported}! You got this!" ${supported} hears it.`,
        `${spec} is on ${prSpec.pos} feet at the edge of the arena. "DON'T GIVE UP, ${supported}!" The words land.`,
        `${spec} claps between rounds. ${supported} looks over and ${spec} gives a thumbs up. Small thing. Means everything.`,
        `"${supported}! ${supported}!" ${spec} is practically in the arena. The support is real.`,
      ]),
      bondDelta: 1, bondPair: [spec, supported],
      momentumDelta: { [supported]: 0.3 },
      badgeText: 'SUPPORT', badgeClass: 'ri-pill-green', players: [spec, supported],
    });
  }

  if (aTrailing && sA.temperament <= 4) {
    eligible.push({
      type: 'breakdown', player: a,
      text: _pick([
        `${a}'s composure cracks between rounds. ${prA.Sub} wipe${prA.sub==='they'?'':'s'} ${prA.pos} eyes quickly, hoping no one saw.`,
        `${a} slams the ground. Frustration boiling over. The game is slipping away and ${prA.sub} know${prA.sub==='they'?'':'s'} it.`,
        `${a}'s shoulders drop. The fight is leaving ${prA.pos} body. You can see it draining out.`,
        `A shaky exhale from ${a}. ${prA.Sub} ${prA.sub==='they'?'are':'is'} coming apart at the seams.`,
      ]),
      mentalShift: 'broken',
      badgeText: 'BREAKING', badgeClass: 'ri-pill-danger', players: [a],
    });
  }
  if (bTrailing && sB.temperament <= 4) {
    eligible.push({
      type: 'breakdown', player: b,
      text: _pick([
        `${b} can't hide it anymore. The frustration spills out. ${prB.Sub} kick${prB.sub==='they'?'':'s'} the sand.`,
        `${b}'s lip trembles between rounds. ${prB.Sub} ${prB.sub==='they'?'are':'is'} losing this and ${prB.sub} know${prB.sub==='they'?'':'s'} it.`,
        `Something breaks in ${b}'s expression. The hope dims.`,
        `${b} stares at the ground for a long beat. When ${prB.sub} look${prB.sub==='they'?'':'s'} up, the fight is gone.`,
      ]),
      mentalShift: 'broken',
      badgeText: 'BREAKING', badgeClass: 'ri-pill-danger', players: [b],
    });
  }

  if (bond <= -3) {
    eligible.push({
      type: 'grudge-flare', player: a, target: b,
      text: _pick([
        `${a} and ${b} lock eyes between rounds. Pure fire. The hatred is fuel for both of them.`,
        `"I'm not done with you," ${a} says. ${b} fires back: "Good. I'm not done either." Both get meaner.`,
        `The animosity between ${a} and ${b} crackles in the air. They're both playing for blood now.`,
        `${b} mutters ${a}'s name like a curse. ${a} hears it. Smiles. This just got personal.`,
      ]),
      bondDelta: -1,
      momentumDelta: { [a]: 0.3, [b]: 0.3 },
      badgeText: 'GRUDGE', badgeClass: 'ri-pill-danger', players: [a, b],
    });
  }

  // ── NEUTRAL ──
  if (Math.random() < 0.15) {
    const victim = _pick(duelists.slice(0, 2));
    const prV = pronouns(victim);
    eligible.push({
      type: 'equipment-trouble', player: victim,
      text: _pick([
        `${victim}'s station shifts during the reset. ${prV.Sub} lose${prV.sub==='they'?'':'s'} precious seconds readjusting.`,
        `Something jams on ${victim}'s side. ${prV.Sub} fumble${prV.sub==='they'?'':'s'} with it, losing focus.`,
        `${victim} drops ${prV.pos} gear between rounds. A small setback — but everything matters here.`,
        `A gust of wind scatters ${victim}'s setup. ${prV.Sub} scramble${prV.sub==='they'?'':'s'} to recover.`,
      ]),
      momentumDelta: { [victim]: -0.5 },
      badgeText: 'TROUBLE', badgeClass: 'ri-pill-warn', players: [victim],
    });
  }

  if (aTrailing && (sA.loyalty >= 6 || sA.endurance >= 7)) {
    eligible.push({
      type: 'second-wind', player: a,
      text: _pick([
        `${a} digs somewhere deep between rounds. The posture changes. The breathing steadies. ${prA.Sub} ${prA.sub==='they'?'are':'is'} not done.`,
        `Something shifts in ${a}. The desperation turns to determination. A second wind.`,
        `${a} rolls ${prA.pos} shoulders. Cracks ${prA.pos} neck. Whatever was broken just got fixed.`,
        `${a} takes one long breath. When ${prA.sub} exhale${prA.sub==='they'?'':'s'}, the fear is gone. ${prA.Sub} ${prA.sub==='they'?'are':'is'} ready.`,
      ]),
      mentalShift: 'focused',
      badgeText: 'SECOND WIND', badgeClass: 'ri-pill-green', players: [a],
    });
  }
  if (bTrailing && (sB.loyalty >= 6 || sB.endurance >= 7)) {
    eligible.push({
      type: 'second-wind', player: b,
      text: _pick([
        `${b} was fading — but between rounds, something ignites. ${prB.Sub} stand${prB.sub==='they'?'':'s'} taller. Eyes sharper.`,
        `Down but not broken. ${b} finds a reserve nobody knew was there.`,
        `${b} shakes off the last round. Literally shakes — arms, legs, head. Fresh start. New fight.`,
        `${b} looks at the arena. Looks at ${a}. And decides this isn't over. Not yet.`,
      ]),
      mentalShift: 'focused',
      badgeText: 'SECOND WIND', badgeClass: 'ri-pill-green', players: [b],
    });
  }

  if (Math.random() < 0.20) {
    eligible.push({
      type: 'crowd-energy', player: a, target: b,
      text: _pick([
        `The arena seems to pulse between rounds. Both competitors feel it — something electric in the air.`,
        `A bird calls from the treeline. Both look up. A beat of silence. Then back to war — but sharper now.`,
        `The wind shifts. The light changes. Something in the atmosphere sharpens both of them.`,
        `Between rounds, both competitors catch their breath and reset. The brief pause charges them both.`,
      ]),
      momentumDelta: { [a]: 0.2, [b]: 0.2 },
      badgeText: 'ENERGY', badgeClass: 'ri-pill-info', players: [a, b],
    });
  }

  if (!eligible.length) return null;
  return _pick(eligible);
}

function _applyBreathingMoment(moment, duelists, momentum) {
  if (!moment) return;
  if (moment.bondDelta) {
    const bA = moment.bondPair ? moment.bondPair[0] : moment.player;
    const bB = moment.bondPair ? moment.bondPair[1] : moment.target;
    if (bA && bB) addBond(bA, bB, moment.bondDelta);
  }
  if (moment.mentalShift) {
    _setMentalState(moment.player, moment.mentalShift);
  }
  if (moment.momentumDelta) {
    for (const [name, delta] of Object.entries(moment.momentumDelta)) {
      if (momentum[name] !== undefined) momentum[name] += delta;
    }
  }
}

// ══════════════════════════════════════════════════════════════════════
// PHASE NARRATION — challenge-specific + bond modifiers
// ══════════════════════════════════════════════════════════════════════

function _phaseNarration(challenge, phaseTag, winnerName, loserName, margin, bond) {
  const prW = pronouns(winnerName);
  const prL = pronouns(loserName);
  const dominant = margin >= 2.5;

  const outcome = dominant ? 'winDom' : 'winClose';
  // Look up narration directly from the challenge object (works for both banks)
  const phase = challenge.narration?.[phaseTag];
  const pool = phase?.[outcome];
  let base = (pool?.length)
    ? pool[Math.floor(Math.random() * pool.length)](winnerName, loserName, prW, prL)
    : `${winnerName} takes the round from ${loserName}.`;

  // Also try loser-perspective outcomes (loseHard / loseCollapse) for variety
  if (!dominant && phase?.loseHard?.length && Math.random() < 0.4) {
    base = phase.loseHard[Math.floor(Math.random() * phase.loseHard.length)](winnerName, loserName, prW, prL);
  } else if (dominant && phase?.loseCollapse?.length && Math.random() < 0.4) {
    base = phase.loseCollapse[Math.floor(Math.random() * phase.loseCollapse.length)](winnerName, loserName, prW, prL);
  }

  // Bond modifier suffix (55% chance)
  if (bond !== undefined && Math.random() < 0.55) {
    if (bond <= -3) {
      base += '\n\n' + _pick([
        `${loserName} mouths something unprintable. This is war.`,
        `You can feel the hatred. Every point is personal.`,
        `${winnerName} stares ${loserName} down. No words needed.`,
        `${loserName} slams the ground. ${prL.Sub} want${prL.sub==='they'?'':'s'} this one BAD.`,
        `There's history here — and none of it is good.`,
      ]);
    } else if (bond <= -1) {
      base += '\n\n' + _pick([
        `The tension between them is obvious.`,
        `${loserName} shoots ${winnerName} a look that could cut glass.`,
        `Not friends. Not even close. And it shows.`,
        `${winnerName} can't resist a small smirk. ${loserName} sees it.`,
      ]);
    } else if (bond >= 4) {
      base += '\n\n' + _pick([
        `${winnerName} reaches out a hand. ${loserName} takes it. Even here, respect.`,
        `${loserName} nods — no bitterness. ${prL.Sub} know${prL.sub==='they'?'':'s'} ${winnerName} earned it.`,
        `Friends on opposite sides. The hardest kind of fight.`,
        `${winnerName} whispers something to ${loserName} after. ${loserName} almost smiles.`,
      ]);
    } else if (bond >= 2) {
      base += '\n\n' + _pick([
        `A respectful nod from ${loserName}. Good game.`,
        `No hard feelings between them — but no mercy either.`,
        `${winnerName} checks on ${loserName} after. Old habits.`,
      ]);
    }
  }
  return base;
}

// ══════════════════════════════════════════════════════════════════════
// MENTAL STATE helpers
// ══════════════════════════════════════════════════════════════════════

function _getMentalState(name) {
  if (!gs.riMentalState) gs.riMentalState = {};
  return gs.riMentalState[name] || 'focused';
}

function _setMentalState(name, state) {
  if (!gs.riMentalState) gs.riMentalState = {};
  gs.riMentalState[name] = state;
}

function _getTrainingBonus(name, statKey) {
  if (!gs.riTraining || !gs.riTraining[name]) return 0;
  return gs.riTraining[name][statKey] || 0;
}

function _addTrainingBonus(name, statKey, amount) {
  if (!gs.riTraining) gs.riTraining = {};
  if (!gs.riTraining[name]) gs.riTraining[name] = {};
  gs.riTraining[name][statKey] = (gs.riTraining[name][statKey] || 0) + amount;
}

// ══════════════════════════════════════════════════════════════════════
// PHASE-BASED DUEL ENGINE
// ══════════════════════════════════════════════════════════════════════

function _runPhases(duelists, challenge, numPhases, riList) {
  const phaseDefs = challenge.phases;
  const phaseTags = ['opening', 'pivot', 'climax'];
  // For 5-phase reentry: opening, pivot, climax, pivot, climax
  const tagSequence = numPhases <= 3
    ? phaseTags.slice(0, numPhases)
    : ['opening', 'pivot', 'climax', 'pivot', 'climax'].slice(0, numPhases);

  const momentum = {};
  duelists.forEach(n => { momentum[n] = 0; });

  const phases = [];
  const breathingMoments = [];
  const winsPerPlayer = {};
  duelists.forEach(n => { winsPerPlayer[n] = 0; });

  for (let i = 0; i < numPhases; i++) {
    const tag = tagSequence[i];
    const phaseDef = phaseDefs[Math.min(i, phaseDefs.length - 1)];
    const phaseName = i < phaseDefs.length ? phaseDef.name : `Round ${i + 1}`;

    const scores = {};
    duelists.forEach(name => {
      const s = pStats(name);
      const primaryVal = s[challenge.primary] + _getTrainingBonus(name, challenge.primary);
      const secondaryVal = s[challenge.secondary] + _getTrainingBonus(name, challenge.secondary);
      const mentalState = _getMentalState(name);
      const mentalBonus = mentalState === 'obsessed' ? 0.5 : mentalState === 'broken' ? -0.5 : 0;
      scores[name] = primaryVal * 0.6 + secondaryVal * 0.4 + _noise(2.5) + (momentum[name] || 0) + mentalBonus;
    });

    const sorted = duelists.slice().sort((a, b) => scores[b] - scores[a]);
    const winner = sorted[0];
    const runnerUp = sorted[1];
    const margin = scores[winner] - scores[runnerUp];
    const lastPlace = sorted[sorted.length - 1];
    const bond = getBond(winner, lastPlace);

    const narration = _phaseNarration(challenge, tag, winner, lastPlace, margin, bond);

    winsPerPlayer[winner] = (winsPerPlayer[winner] || 0) + 1;

    phases.push({
      name: phaseName,
      tag,
      scores: { ...scores },
      winner,
      margin: Math.round(margin * 100) / 100,
      narration,
    });

    // Momentum: winner gets +0.5, others reset
    duelists.forEach(n => { momentum[n] = n === winner ? 0.5 : 0; });

    // Breathing moment between phases (not after the last)
    if (i < numPhases - 1) {
      const moment = _pickBreathingMoment(duelists, riList || [], i, winsPerPlayer, challenge);
      if (moment) {
        _applyBreathingMoment(moment, duelists, momentum);
        breathingMoments.push(moment);
      } else {
        breathingMoments.push(null);
      }
    }
  }

  return { phases, breathingMoments, winsPerPlayer };
}

function _resolvePhases(duelists, phases) {
  const wins = {};
  duelists.forEach(n => { wins[n] = 0; });
  phases.forEach(p => { wins[p.winner] = (wins[p.winner] || 0) + 1; });

  if (duelists.length === 2) {
    const [a, b] = duelists;
    if (wins[a] !== wins[b]) {
      const winner = wins[a] > wins[b] ? a : b;
      const loser = winner === a ? b : a;
      return { winner, loser, tiebreaker: null };
    }
    const tbStat = _pick(VALID_STATS);
    const tbScores = {};
    duelists.forEach(name => {
      const s = pStats(name);
      tbScores[name] = s[tbStat] + _getTrainingBonus(name, tbStat) + _noise(3.5);
    });
    const tbWinner = tbScores[a] >= tbScores[b] ? a : b;
    const tbLoser = tbWinner === a ? b : a;
    return {
      winner: tbWinner, loser: tbLoser,
      tiebreaker: { stat: tbStat, scores: { ...tbScores }, winner: tbWinner },
    };
  }

  const losses = {};
  duelists.forEach(n => { losses[n] = 0; });
  phases.forEach(p => {
    const sorted = duelists.slice().sort((a, b) => p.scores[b] - p.scores[a]);
    losses[sorted[sorted.length - 1]] = (losses[sorted[sorted.length - 1]] || 0) + 1;
  });
  const maxLosses = Math.max(...Object.values(losses));
  const lossCandidates = duelists.filter(n => losses[n] === maxLosses);

  let loser;
  if (lossCandidates.length === 1) {
    loser = lossCandidates[0];
  } else {
    const totals = {};
    lossCandidates.forEach(n => {
      totals[n] = phases.reduce((sum, p) => sum + (p.scores[n] || 0), 0);
    });
    loser = lossCandidates.sort((a, b) => totals[a] - totals[b])[0];
  }

  const winner = duelists.slice().sort((a, b) => {
    const wA = phases.filter(p => p.winner === a).length;
    const wB = phases.filter(p => p.winner === b).length;
    return wB - wA;
  })[0];

  return { winner, loser, tiebreaker: null };
}

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

  // Proportional: fight score determines whether they go to RI (~75-85% for average players)
  const _fightScore = (s.boldness + s.physical + s.strategic + s.loyalty) / 4;
  const _emotBoost = emotional === 'desperate' ? 1.5 : emotional === 'paranoid' ? 0.5 : emotional === 'defeated' ? -1.0 : 0;
  const _riChance = Math.min(0.98, 0.40 + (_fightScore + _emotBoost) * 0.08);
  return Math.random() < _riChance ? 'REDEMPTION ISLAND' : 'WENT HOME';
}

export function simulateRIDuel(riPlayers) {
  const challenge = _randomChallenge();

  if (!gs.riWinStreak) gs.riWinStreak = {};
  if (!gs.riMentalState) gs.riMentalState = {};
  if (!gs.riTraining) gs.riTraining = {};

  const duelists = [...riPlayers];
  const isThreeWay = duelists.length >= 3;

  // Capture pre-duel streaks BEFORE updating (prevents VP spoiler)
  const preStreakData = {};
  duelists.forEach(n => {
    if (gs.riWinStreak[n]) preStreakData[n] = gs.riWinStreak[n];
  });

  // Run 3-phase duel with breathing moments
  const { phases, breathingMoments, winsPerPlayer } = _runPhases(duelists, challenge, 3, gs.riPlayers);
  const { winner, loser, tiebreaker } = _resolvePhases(duelists, phases);
  const survivors = duelists.filter(n => n !== loser);

  // Build score-aware host commentary
  const leader = Object.entries(winsPerPlayer).sort((a, b) => b[1] - a[1])[0]?.[0] || winner;
  const trailer = duelists.find(n => n !== leader) || loser;
  const hostCtx = { leader, trailer, winner, loser };
  const host = {
    opener: _hostLine('opener', hostCtx),
    after1: _hostLine(_pickHostSlot(0, 3, winsPerPlayer, leader, trailer), hostCtx),
    after2: _hostLine(_pickHostSlot(1, 3, winsPerPlayer, leader, trailer), hostCtx),
    closer: _hostLine(_pickCloserSlot(phases, winner, loser), hostCtx),
  };

  gs.riWinStreak[winner] = (gs.riWinStreak[winner] || 0) + 1;
  delete gs.riWinStreak[loser];

  if (gs.riMentalState[loser]) delete gs.riMentalState[loser];
  if (gs.riTraining[loser]) delete gs.riTraining[loser];

  const streakData = {};
  duelists.forEach(n => {
    if (gs.riWinStreak[n]) streakData[n] = gs.riWinStreak[n];
  });

  return {
    winner, loser, survivors,
    challenge: { id: challenge.id, name: challenge.name, desc: challenge.desc, primary: challenge.primary, secondary: challenge.secondary },
    challengeType: challenge.id, challengeLabel: challenge.name, challengeDesc: challenge.desc,
    isThreeWay, duelists,
    phases,
    breathingMoments,
    host,
    tiebreaker,
    streakData,
    preStreakData,
  };
}

export function simulateRIReentry(riPlayers) {
  const challenge = _randomChallenge();

  if (!gs.riWinStreak) gs.riWinStreak = {};
  if (!gs.riMentalState) gs.riMentalState = {};
  if (!gs.riTraining) gs.riTraining = {};

  const duelists = [...riPlayers];

  // 5-phase return challenge
  const { phases, breathingMoments } = _runPhases(duelists, challenge, 5, gs.riPlayers);

  // For reentry: top total scorer wins, everyone else loses
  const totalScores = {};
  duelists.forEach(n => {
    totalScores[n] = phases.reduce((sum, p) => sum + (p.scores[n] || 0), 0);
  });
  const sorted = duelists.slice().sort((a, b) => totalScores[b] - totalScores[a]);
  const winner = sorted[0];
  const losers = sorted.slice(1);

  let tiebreaker = null;
  if (sorted.length >= 2 && Math.abs(totalScores[sorted[0]] - totalScores[sorted[1]]) < 0.5) {
    const tbStat = _pick(VALID_STATS);
    const tbScores = {};
    [sorted[0], sorted[1]].forEach(name => {
      const s = pStats(name);
      tbScores[name] = s[tbStat] + _getTrainingBonus(name, tbStat) + _noise(3.5);
    });
    const tbWinner = tbScores[sorted[0]] >= tbScores[sorted[1]] ? sorted[0] : sorted[1];
    if (tbWinner !== winner) {
      const newWinner = tbWinner;
      const newLosers = duelists.filter(n => n !== newWinner);
      tiebreaker = { stat: tbStat, scores: { ...tbScores }, winner: newWinner };
      newLosers.forEach(n => { delete gs.riWinStreak[n]; delete gs.riMentalState[n]; delete gs.riTraining[n]; });
      const streakData = {};
      if (gs.riWinStreak[newWinner]) streakData[newWinner] = gs.riWinStreak[newWinner];
      return {
        winner: newWinner, losers: newLosers,
        challenge: { id: challenge.id, name: challenge.name, desc: challenge.desc, primary: challenge.primary, secondary: challenge.secondary },
        challengeType: challenge.id, challengeLabel: challenge.name,
        duelists, phases, breathingMoments, tiebreaker, streakData,
      };
    }
    tiebreaker = { stat: tbStat, scores: { ...tbScores }, winner };
  }

  losers.forEach(n => { delete gs.riWinStreak[n]; delete gs.riMentalState[n]; delete gs.riTraining[n]; });

  const streakData = {};
  if (gs.riWinStreak[winner]) streakData[winner] = gs.riWinStreak[winner];

  return {
    winner, losers,
    challenge: { id: challenge.id, name: challenge.name, desc: challenge.desc, primary: challenge.primary, secondary: challenge.secondary },
    challengeType: challenge.id, challengeLabel: challenge.name,
    duelists, phases, breathingMoments, tiebreaker, streakData,
  };
}

// ══════════════════════════════════════════════════════════════════════
// LIFE EVENTS — pre-duel tension + solo processing
// ══════════════════════════════════════════════════════════════════════

export function generateRILifeEvents(ep) {
  if (!gs.riPlayers || !gs.riPlayers.length) return;
  if (!ep.riLifeEvents) ep.riLifeEvents = [];
  if (!gs.riLifeEvents) gs.riLifeEvents = {};
  if (!gs.riTraining) gs.riTraining = {};
  if (!gs.riWinStreak) gs.riWinStreak = {};
  if (!gs.riMentalState) gs.riMentalState = {};
  const epNum = ep.num || (gs.episode + 1);
  const riList = [...gs.riPlayers];

  function pushEvt(evt) {
    ep.riLifeEvents.push(evt);
    const names = [evt.player, evt.player2].filter(Boolean);
    names.forEach(n => {
      if (!gs.riLifeEvents[n]) gs.riLifeEvents[n] = [];
      gs.riLifeEvents[n].push(evt);
    });
  }

  // ── Training events (solo) ──
  const trainingTypes = [
    { label: 'running the beach',          stat: 'physical',    text: n => `${n} spends the morning running the beach. Legs burning, lungs on fire. Getting faster.` },
    { label: 'puzzle practice with shells', stat: 'mental',      text: n => `${n} arranges shells into patterns, solving and re-solving. The mind sharpens.` },
    { label: 'fire drills at dawn',         stat: 'endurance',   text: n => `${n} drills fire-making before sunrise. Over and over until the hands bleed.` },
    { label: 'meditation by the water',     stat: 'temperament', text: n => `${n} sits by the water as the tide comes in. Breathing. Centering. Finding calm.` },
    { label: 'studying who voted whom',     stat: 'strategic',   text: n => `${n} scratches vote histories into the sand. Patterns emerge. Plans form.` },
    { label: 'shadow boxing',              stat: 'boldness',    text: n => `${n} shadow boxes alone at the edge of camp. Fists flying at ghosts. Getting braver.` },
    { label: 'reading body language',       stat: 'intuition',   text: n => `${n} watches the others — how they sit, how they breathe, how they lie. Learning to read.` },
  ];

  riList.forEach(name => {
    // ~60% chance of a training event each episode
    if (Math.random() > 0.6) return;

    const s = pStats(name);
    const pr = pronouns(name);
    const training = _pick(trainingTypes);
    const statVal = s[training.stat];

    // Boost proportional to stat: 0.3 + stat * 0.02
    let boost = 0.3 + statVal * 0.02;

    // Injury risk: proportional to (10 - endurance) * 0.02
    const injuryChance = (10 - s.endurance) * 0.02;
    let isInjury = Math.random() < injuryChance;

    if (isInjury) {
      boost = -0.3;
      const injuryTexts = [
        `${name} pushes too hard during ${training.label}. ${pr.Sub} tweak${pr.sub==='they'?'':'s'} something. It'll hurt tomorrow.`,
        `${name} goes down mid-drill. ${pr.PosAdj} body gives out during ${training.label}. A setback.`,
        `A rough training session. ${name} limps away from ${training.label} worse than when ${pr.sub} started.`,
        `${name} overextends during ${training.label}. The grimace says it all.`,
      ];
      pushEvt({ ep: epNum, text: _pick(injuryTexts), type: 'training-injury', player: name, stat: training.stat, boost });
    } else {
      pushEvt({ ep: epNum, text: training.text(name), type: 'training', player: name, stat: training.stat, boost });
    }

    _addTrainingBonus(name, training.stat, boost);
  });

  // ── Shared training (2+ residents, ~30% chance) ──
  if (riList.length >= 2 && Math.random() < 0.3) {
    const pair = _shuffle(riList).slice(0, 2);
    const sharedStat = _pick(VALID_STATS);
    const [a, b] = pair;
    const sharedTexts = [
      `${a} and ${b} train together — ${sharedStat} drills until the sun goes down. Something bonds them.`,
      `${a} challenges ${b} to a ${sharedStat} workout. They push each other harder than they would alone.`,
      `${a} and ${b} find themselves doing the same drills. Wordlessly, they become training partners.`,
      `A shared struggle. ${a} and ${b} push through ${sharedStat} training side by side.`,
    ];
    pushEvt({ ep: epNum, text: _pick(sharedTexts), type: 'shared-training', player: a, player2: b, stat: sharedStat });
    _addTrainingBonus(a, sharedStat, 0.2);
    _addTrainingBonus(b, sharedStat, 0.2);
    addBond(a, b, 1.0);
  }

  // ── Mental arc events ──
  riList.forEach(name => {
    const pr = pronouns(name);
    const daysOnRI = (gs.riLifeEvents[name] || []).length;
    const duelWins = gs.riWinStreak[name] || 0;
    const currentMental = _getMentalState(name);

    // After 3+ episodes: 20% chance of breakdown (if not already broken or obsessed)
    if (daysOnRI >= 3 && currentMental === 'focused' && Math.random() < 0.20) {
      _setMentalState(name, 'broken');
      _addTrainingBonus(name, 'temperament', -0.5);
      const breakdownTexts = [
        `${name} breaks down alone at night. The isolation, the hunger, the uncertainty — it all hits at once.`,
        `${name} can't stop crying. ${pr.Sub} thought ${pr.sub} could handle this. ${pr.Sub} can't.`,
        `Something snaps in ${name}. ${pr.Sub} sit${pr.sub==='they'?'':'s'} staring at the fire for hours, unresponsive.`,
        `${name} stops eating. Stops training. Stops talking. The island is winning.`,
      ];
      pushEvt({ ep: epNum, text: _pick(breakdownTexts), type: 'mental-breakdown', player: name });
    }

    // After surviving 2+ duels: 25% chance of hardening
    if (duelWins >= 2 && currentMental === 'focused' && Math.random() < 0.25) {
      _setMentalState(name, 'hardened');
      _addTrainingBonus(name, 'boldness', 0.3);
      const hardenTexts = [
        `${name} survived ${duelWins} duels. Something changed behind ${pr.pos} eyes. ${pr.Sub} ${pr.sub==='they'?'are':'is'} harder now.`,
        `${name} doesn't flinch anymore. ${duelWins} duels. ${duelWins} wins. The fear is gone.`,
        `There's a coldness to ${name} now. Each duel burned away a little more softness.`,
        `${name} walks different. Talks different. ${duelWins} duels will do that to a person.`,
      ];
      pushEvt({ ep: epNum, text: _pick(hardenTexts), type: 'mental-hardened', player: name });
    }

    // After 4+ episodes: 15% chance of obsession
    if (daysOnRI >= 4 && (currentMental === 'focused' || currentMental === 'hardened') && Math.random() < 0.15) {
      _setMentalState(name, 'obsessed');
      // Find who voted them out for revenge flavor
      const voters = gs.episodeHistory.flatMap(h => (h.votingLog||[]).filter(v => v.voted === name).map(v => v.voter));
      const revengeTarget = voters.length > 0 ? voters[voters.length - 1] : null;
      if (revengeTarget) addBond(name, revengeTarget, -1.0);

      const obsessionTexts = revengeTarget ? [
        `${name} has a new mantra: "${revengeTarget}." Over and over. The revenge is all that's left.`,
        `${name} scratches ${revengeTarget}'s name into the shelter wall. Stares at it. Plans.`,
        `${name} talks about nothing but getting back at ${revengeTarget}. The obsession is consuming.`,
        `Every drill, every rep — ${name} pictures ${revengeTarget}'s face. It fuels everything.`,
      ] : [
        `${name} has become obsessed with the return challenge. Nothing else matters.`,
        `${name} trains through pain, through hunger, through exhaustion. The obsession is absolute.`,
        `${name} doesn't sleep anymore. Just plans. Just prepares. Just waits.`,
        `The fire in ${name}'s eyes isn't healthy. It's consuming. But it might be enough.`,
      ];
      pushEvt({ ep: epNum, text: _pick(obsessionTexts), type: 'mental-obsessed', player: name, revengeTarget });
    }
  });

  // ── Solo events (1 resident) ──
  if (riList.length === 1) {
    const name = riList[0];
    const pr = pronouns(name);
    const daysOnRI = (gs.riLifeEvents[name] || []).length + 1;
    const soloPool = [
      { type: 'processing', text: `${name} replays tribal in ${pr.pos} head. The name ${pr.sub} trusted most wrote ${pr.pos} name.` },
      { type: 'reflection', text: `${name} sits alone watching the sunset. The game feels very far away — and very close.` },
      { type: 'motivation', text: `${name} carves a mark in the shelter wall. ${daysOnRI > 1 ? `${daysOnRI} marks now.` : 'One for each day survived.'} The marks are adding up.` },
      { type: 'processing', text: `${name} talks to ${pr.ref} — running through scenarios, playing both sides of the conversation.` },
    ];
    const hash = ([...name].reduce((s,c) => s + c.charCodeAt(0), 0) + epNum);
    const ev1 = soloPool[hash % soloPool.length];
    pushEvt({ ep: epNum, text: ev1.text, type: ev1.type, player: name });

    if (Math.random() < 0.5) {
      const ev2 = soloPool[(hash + 1) % soloPool.length];
      if (ev2.text !== ev1.text) {
        pushEvt({ ep: epNum, text: ev2.text, type: ev2.type, player: name });
      }
    }
  }

  // ── Social / relationship events (2+ residents) ──
  if (riList.length >= 2) {
    const socialPool = [];
    for (let i = 0; i < riList.length; i++) {
      for (let j = i + 1; j < riList.length; j++) {
        const a = riList[i], b = riList[j];
        const prA = pronouns(a), prB = pronouns(b);
        const bond = getBond(a, b);
        const sA = pStats(a), sB = pStats(b);
        const archA = players.find(p => p.name === a)?.archetype || '';
        const archB = players.find(p => p.name === b)?.archetype || '';
        const sameHistory = gs.episodeHistory.some(h => (h.tribesAtStart||[]).some(t => t.members.includes(a) && t.members.includes(b)));

        // ── HISTORY & ARRIVAL ──
        if (sameHistory) socialPool.push(
          { type: 'history', text: `${a} and ${b} were on the same tribe. The awkwardness is thick.`, player: a, player2: b },
          { type: 'history', text: `${a} and ${b} keep glancing at each other. Same tribe, different side of the vote. Neither has forgotten.`, player: a, player2: b },
          { type: 'history', text: `"Funny how things work out," ${a} says to ${b}. ${b} doesn't laugh.`, player: a, player2: b },
          { type: 'history', text: `${a} and ${b} used to share a shelter. Now they share Redemption Island. The irony isn't lost on either of them.`, player: a, player2: b },
        );

        // ── ENEMIES (bond <= -2) ──
        if (bond <= -2) {
          socialPool.push(
            { type: 'enemy-arrives', text: `${a} and ${b} locked eyes. This is personal.`, player: a, player2: b },
            { type: 'grudge-confrontation', text: `${a} finally says what ${prA.sub}'${prA.sub==='they'?'ve':'s'} been holding in. ${b} fires back. The island shakes.`, player: a, player2: b, bondDelta: -0.5 },
            { type: 'grudge-confrontation', text: `"You know what you did." ${a} blocks ${b}'s path. This has been building for days.`, player: a, player2: b, bondDelta: -0.5 },
            { type: 'cold-war', text: `${a} and ${b} eat on opposite sides of the shelter. Nobody speaks. The silence is deafening.`, player: a, player2: b },
            { type: 'cold-war', text: `${a} deliberately takes ${b}'s spot by the fire. ${b} moves without a word. Petty. Effective.`, player: a, player2: b, bondDelta: -0.3 },
          );
          if (bond <= -4) socialPool.push(
            { type: 'explosive-fight', text: `${a} and ${b} finally blow up. Screaming. Pointing. Other residents back away. This was inevitable.`, player: a, player2: b, bondDelta: -1.0 },
            { type: 'explosive-fight', text: `${b} accuses ${a} of sabotaging ${prB.pos} fire. ${a} accuses ${b} of stealing rice. It devolves from there.`, player: a, player2: b, bondDelta: -1.0 },
          );
        }

        // ── FRIENDS (bond >= 3) ──
        if (bond >= 3) {
          socialPool.push(
            { type: 'ally-arrives', text: `${a} and ${b} share a look. They know — only one can stay.`, player: a, player2: b },
            { type: 'bonding-meal', text: `${a} splits the last coconut with ${b}. "We're still us," ${a} says. Even here.`, player: a, player2: b, bondDelta: 0.5 },
            { type: 'emotional-talk', text: `${a} and ${b} stay up talking. About home, about the game, about everything. The bond is still there.`, player: a, player2: b, bondDelta: 0.5 },
            { type: 'bittersweet', text: `${a} helps ${b} practice fire-making. They both know one of them might be using it against the other tomorrow.`, player: a, player2: b },
          );
          if (bond >= 5) socialPool.push(
            { type: 'heartbreak-preview', text: `${a} can't sleep. Tomorrow ${prA.sub} might have to duel ${b}. The person ${prA.sub} trust${prA.sub==='they'?'':'s'} most in this game.`, player: a, player2: b },
            { type: 'heartbreak-preview', text: `"Promise me something," ${b} says to ${a}. "Whoever wins — no hard feelings." They both know that's a lie.`, player: a, player2: b },
          );
        }

        // ── NEUTRAL / MILD BOND — comedy, mundane conflict, bonding ──
        if (bond > -2 && bond < 3) {
          socialPool.push(
            { type: 'comedy', text: `${a} accidentally kicks sand into ${b}'s rice. ${b} stares. ${a} stares back. ${b} starts laughing. Then they both do.`, player: a, player2: b, bondDelta: 0.5 },
            { type: 'comedy', text: `${a} and ${b} argue about the best way to cook rice. It's the most normal thing that's happened on this island.`, player: a, player2: b, bondDelta: 0.3 },
            { type: 'comedy', text: `A crab steals ${a}'s sock. ${b} watches the whole chase and does nothing to help. They'll laugh about it later.`, player: a, player2: b, bondDelta: 0.3 },
            { type: 'midnight-talk', text: `Can't sleep. ${a} and ${b} end up talking at 3 AM. Who they miss. What they'd do differently. The island strips pretense away.`, player: a, player2: b, bondDelta: 0.8 },
            { type: 'resource-conflict', text: `${a} accuses ${b} of hogging the tarp. ${b} says ${a} snores. It's petty but it's real — the island makes everything bigger.`, player: a, player2: b, bondDelta: -0.3 },
          );
        }

        // ── ALLIANCE PLOTTING ──
        if (sA.strategic >= 6 && sB.strategic >= 6) {
          socialPool.push(
            { type: 'alliance-plot', text: `${a} and ${b} whisper by the well. If one of them makes it back... they'd have numbers. A new alliance forms in the ashes.`, player: a, player2: b, bondDelta: 1.0 },
            { type: 'alliance-plot', text: `"When we get back in," ${a} says, "we go after the same target. Agreed?" ${b} nods. Plans bloom in exile.`, player: a, player2: b, bondDelta: 1.0 },
          );
        }

        // ── INTIMIDATION / SIZING UP ──
        const streakA = gs.riWinStreak[a] || 0;
        const streakB = gs.riWinStreak[b] || 0;
        if (streakA >= 3) {
          socialPool.push(
            { type: 'intimidation', text: `${a} has won ${streakA} duels in a row. ${b} can see it in ${prA.pos} posture — ${a} expects to win again.`, player: a, player2: b },
            { type: 'intimidation', text: `${b} watches ${a} train. ${streakA} wins. No weakness. No openings. The dread builds.`, player: a, player2: b },
          );
        }
        if (streakB >= 3) {
          socialPool.push(
            { type: 'intimidation', text: `${b} has won ${streakB} duels in a row. ${a} can see it in ${prB.pos} posture — ${b} expects to win again.`, player: b, player2: a },
          );
        }

        // ── TRASH TALK (bold/villain characters) ──
        const isVillainA = ['villain','mastermind','schemer'].includes(archA);
        const isVillainB = ['villain','mastermind','schemer'].includes(archB);
        if (sA.boldness >= 7 || isVillainA) {
          socialPool.push(
            { type: 'trash-talk', text: `${a} tells ${b} exactly how this is going to go. ${b} says nothing. Just stares.`, player: a, player2: b, bondDelta: -0.5 },
            { type: 'trash-talk', text: `"You know you can't beat me, right?" ${a} says it like ${prA.sub}'${prA.sub==='they'?'re':'s'} commenting on the weather. ${b} grits ${prB.pos} teeth.`, player: a, player2: b, bondDelta: -0.5 },
          );
        }
        if (sB.boldness >= 7 || isVillainB) {
          socialPool.push(
            { type: 'trash-talk', text: `${b} leans in close to ${a}. "You're going home." ${a} doesn't blink. But ${prA.sub} heard${prA.sub==='they'?'':'s'} it.`, player: b, player2: a, bondDelta: -0.5 },
          );
        }

        // ── EMOTIONAL SUPPORT (nice archetypes) ──
        const isNiceA = ['hero','loyal-soldier','social-butterfly','showmancer','underdog','goat'].includes(archA);
        const isNiceB = ['hero','loyal-soldier','social-butterfly','showmancer','underdog','goat'].includes(archB);
        if (isNiceA && _getMentalState(b) === 'broken') {
          socialPool.push(
            { type: 'comfort', text: `${a} sits next to ${b} when ${prB.sub} break${prB.sub==='they'?'':'s'} down. No words. Just presence. Sometimes that's enough.`, player: a, player2: b, bondDelta: 1.5 },
            { type: 'comfort', text: `${a} brings ${b} water and a freshly cracked coconut. "Eat. You need it." ${b}'s eyes well up.`, player: a, player2: b, bondDelta: 1.5 },
          );
        }
        if (isNiceB && _getMentalState(a) === 'broken') {
          socialPool.push(
            { type: 'comfort', text: `${b} won't let ${a} give up. "You didn't come this far to quit." ${a} wipes ${prA.pos} eyes. Maybe not.`, player: b, player2: a, bondDelta: 1.5 },
          );
        }

        // ── RESPECT (after close duels / training together) ──
        const mutualDuels = (gs.riLifeEvents[a] || []).filter(e => (e.type === 'shared-training' || e.type === 'history') && (e.player === b || e.player2 === b));
        if (mutualDuels.length >= 2 && bond >= 0) {
          socialPool.push(
            { type: 'mutual-respect', text: `${a} and ${b} have developed an unspoken respect. Competitors by day, survivors by night.`, player: a, player2: b, bondDelta: 0.5 },
            { type: 'mutual-respect', text: `${a} compliments ${b}'s fire technique. ${b} returns the favor on ${a}'s puzzle speed. Rivals who recognize each other.`, player: a, player2: b, bondDelta: 0.5 },
          );
        }

        // ── REVENGE TALK ──
        const votersOfA = gs.episodeHistory.flatMap(h => (h.votingLog||[]).filter(v => v.voted === a).map(v => v.voter));
        const votersOfB = gs.episodeHistory.flatMap(h => (h.votingLog||[]).filter(v => v.voted === b).map(v => v.voter));
        if (votersOfA.length && votersOfB.length && sA.strategic >= 5 && sB.strategic >= 5) {
          socialPool.push(
            { type: 'revenge-talk', text: `${a} and ${b} swap stories of who backstabbed them. Names get repeated. Hit lists get compared.`, player: a, player2: b, bondDelta: 0.5 },
            { type: 'revenge-talk', text: `"Who voted you out?" ${a} asks. ${b} lists the names. ${a} nods slowly. "Same people." The enemy of my enemy...`, player: a, player2: b, bondDelta: 0.8 },
          );
        }
      }
    }

    // New arrivals get sizing-up events
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
        socialPool.push(
          { type: 'sizing-up', text: `${resident} watches ${arrival} walk onto the beach. ${prR.Sub} know${prR.sub==='they'?'':'s'} what this means.`, player: resident, player2: arrival },
          { type: 'sizing-up', text: `${arrival} drops ${prA.pos} torch and looks around. ${resident} is already watching. Measuring.`, player: arrival, player2: resident },
        );
      });
    });

    if (!socialPool.length && riList.length >= 2) {
      const [a, b] = riList;
      socialPool.push({ type: 'sizing-up', text: `${a} and ${b} size each other up. The duel is coming.`, player: a, player2: b });
    }

    // Pick 2-4 events (more than before — RI should feel alive)
    if (socialPool.length) {
      const _shuffled = _shuffle([...socialPool]);
      const numEvents = Math.min(_shuffled.length, 2 + (Math.random() < 0.5 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0));
      const usedTypes = new Set();
      let picked = 0;
      for (const evt of _shuffled) {
        if (picked >= numEvents) break;
        const pairKey = [evt.player, evt.player2].sort().join('|');
        const typeKey = evt.type + '|' + pairKey;
        if (usedTypes.has(typeKey)) continue;
        usedTypes.add(typeKey);

        pushEvt({ ep: epNum, text: evt.text, type: evt.type, player: evt.player, player2: evt.player2 });
        if (evt.bondDelta) addBond(evt.player, evt.player2, evt.bondDelta);
        picked++;
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════════════
// POST-DUEL EVENTS — streak-aware narration
// ══════════════════════════════════════════════════════════════════════

export function generateRIPostDuelEvents(ep) {
  if (!ep.riDuel) return;
  if (!ep.riLifeEvents) ep.riLifeEvents = [];
  if (!gs.riLifeEvents) gs.riLifeEvents = {};
  const epNum = ep.num || (gs.episode + 1);
  const { winner, loser, survivors, streakData } = ep.riDuel;
  const prL = pronouns(loser);

  function pushEvt(evt) {
    ep.riLifeEvents.push(evt);
    const names = [evt.player, evt.player2].filter(Boolean);
    names.forEach(n => {
      if (!gs.riLifeEvents[n]) gs.riLifeEvents[n] = [];
      gs.riLifeEvents[n].push(evt);
    });
  }

  // Survivor events — one per survivor
  const allSurvivors = survivors || [winner];
  allSurvivors.forEach(surv => {
    const prS = pronouns(surv);
    const streak = (streakData && streakData[surv]) || 1;
    const duelCount = (gs.riLifeEvents[surv] || []).filter(e => e.type === 'winner-relief' || e.type === 'winner-hardened' || e.type === 'winner-streak').length + 1;
    const mentalState = _getMentalState(surv);

    let winPool;
    if (streak >= 4) {
      winPool = [
        { type: 'winner-streak', text: `${surv} has won ${streak} duels straight. ${prS.Sub} ${prS.sub==='they'?'don\'t':'doesn\'t'} celebrate anymore. Just nods. The machine keeps running.` },
        { type: 'winner-streak', text: `${streak} in a row. ${surv} is the undisputed king of this island. Nobody wants to face ${prS.obj}.` },
        { type: 'winner-streak', text: `${surv} marks another win. ${streak} duels. ${streak} victories. The shelter wall tells the story.` },
        { type: 'winner-streak', text: `${streak} consecutive wins. ${surv} doesn't look relieved anymore — ${prS.sub} look${prS.sub==='they'?'':'s'} inevitable.` },
      ];
    } else if (streak >= 2) {
      winPool = [
        { type: 'winner-hardened', text: `${surv} has survived ${streak} duels now. Each one gets easier. Or maybe ${prS.sub} just stop${prS.sub==='they'?'':'s'} caring about the fear.` },
        { type: 'winner-hardened', text: `${streak} duels, ${streak} wins. ${surv} is becoming something different out here. Harder. Sharper.` },
        { type: 'winner-hardened', text: `Another duel, another victory. ${surv} watches ${loser} leave with eyes that have seen this before.` },
        { type: 'winner-hardened', text: `${surv} has built a rhythm now. Train, fight, win. ${streak} times and counting.` },
      ];
    } else if (mentalState === 'obsessed') {
      winPool = [
        { type: 'winner-obsessed', text: `${surv} wins, but there's no joy. Only the next duel. Only the return.` },
        { type: 'winner-obsessed', text: `${surv} barely acknowledges the win. ${prS.Pos} eyes are already on the horizon. The return challenge. The revenge.` },
      ];
    } else {
      winPool = [
        { type: 'winner-relief', text: `${surv} watches ${loser} leave. ${prS.Sub} sit${prS.sub==='they'?'':'s'} down on the beach. Still here.` },
        { type: 'winner-relief', text: `${surv} exhales. ${prS.Sub} ${prS.sub==='they'?'are':'is'} still in this. Barely.` },
        { type: 'winner-relief', text: `${surv} collapses after the duel. ${prS.Sub} won — but it cost ${prS.obj} everything.` },
        { type: 'winner-relief', text: `${surv} stays at the duel arena after ${loser} walks away. Letting it sink in. Still alive.` },
      ];
    }

    const wHash = ([...surv].reduce((s,c) => s + c.charCodeAt(0), 0) + epNum);
    const wEvt = winPool[wHash % winPool.length];
    pushEvt({ ep: epNum, text: wEvt.text, type: wEvt.type, player: surv });
  });

  // Loser exit event — archetype-aware
  const archetype = (window?.players || []).find(p => p.name === loser)?.archetype || 'floater';
  const isNice = ['hero','loyal-soldier','social-butterfly','showmancer','underdog','goat'].includes(archetype);
  const isVillain = ['villain','mastermind','schemer'].includes(archetype);

  let losePool;
  if (isVillain) {
    losePool = [
      { type: 'loser-bitter', text: `${loser} doesn't shake hands. Doesn't look back. ${prL.Sub} will remember this.` },
      { type: 'loser-bitter', text: `${loser} smirks as ${prL.sub} leave${prL.sub==='they'?'':'s'}. 'You'll need more than that to stop me.' But it did stop ${prL.obj}.` },
      { type: 'loser-bitter', text: `${loser} burns ${prL.pos} buff before walking away. The island can have it.` },
      { type: 'loser-bitter', text: `${loser} says nothing. Just stares at ${winner} for a long, cold moment. Then walks.` },
    ];
  } else if (isNice) {
    losePool = [
      { type: 'loser-graceful', text: `${loser} shakes ${winner}'s hand. 'You earned it.' Then ${prL.sub} walk${prL.sub==='they'?'':'s'} away.` },
      { type: 'loser-graceful', text: `${loser} hugs ${winner}. 'Win the whole thing.' No bitterness. Just grace.` },
      { type: 'loser-emotional', text: `${loser} breaks down. Not because of the duel — because it's really over now.` },
      { type: 'loser-emotional', text: `${loser} cries quietly on the walk out. ${prL.Sub} wanted it so badly. It wasn't enough.` },
    ];
  } else {
    losePool = [
      { type: 'loser-neutral', text: `${loser} nods at ${winner}. Fair fight. Then ${prL.sub} pick${prL.sub==='they'?'':'s'} up ${prL.pos} torch and goes.` },
      { type: 'loser-bitter', text: `${loser} doesn't look back. The game took everything and gave nothing.` },
      { type: 'loser-emotional', text: `${loser} takes one last look at the island. Then turns around and never looks back.` },
      { type: 'loser-graceful', text: `${loser} shakes ${winner}'s hand and says 'Better player today.' Clean exit.` },
    ];
  }

  const lHash = ([...loser].reduce((s,c) => s + c.charCodeAt(0), 0) + epNum);
  const lEvt = losePool[lHash % losePool.length];
  pushEvt({ ep: epNum, text: lEvt.text, type: lEvt.type, player: loser });
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
  if (!gs.riTraining) gs.riTraining = {};
  if (!gs.riWinStreak) gs.riWinStreak = {};
  if (!gs.riMentalState) gs.riMentalState = {};
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

  // Survival drain — Rescue Island is brutal
  if (seasonConfig.foodWater === 'enabled' && gs.survival) {
    riList.forEach(name => {
      const s = pStats(name);
      const daysOn = epNum - (gs.riArrivalEp[name] || epNum);
      const _riBaseDrain = 10 - s.endurance * 0.4;
      const _riDaysPenalty = Math.min(daysOn * 0.5, 3);
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

    // ── Training events (solo — integrated into life event pool) ──
    const trainingTypes = [
      { label: 'running the beach',          stat: 'physical',    textFn: n => `${n} pushes through another beach run. The body adapts. The body has to.` },
      { label: 'puzzle practice',             stat: 'mental',      textFn: n => `${n} builds puzzles out of driftwood and solves them over and over. Faster each time.` },
      { label: 'endurance holds',             stat: 'endurance',   textFn: n => `${n} holds a plank until ${pronouns(n).pos} arms shake. Then holds it longer. Building iron.` },
      { label: 'meditation',                  stat: 'temperament', textFn: n => `${n} practices breathing exercises as the waves crash. Finding the calm before the storm.` },
      { label: 'vote analysis',               stat: 'strategic',   textFn: n => `${n} maps out vote patterns in the sand. The picture of the game gets clearer from out here.` },
      { label: 'confidence drills',           stat: 'boldness',    textFn: n => `${n} stands on the highest rock and screams at the ocean. ${pronouns(n).Sub} ${pronouns(n).sub==='they'?'are':'is'}n't afraid anymore.` },
      { label: 'body language study',         stat: 'intuition',   textFn: n => `${n} watches the others eat, argue, sleep. Learning to read what people don't say.` },
    ];

    riList.forEach(name => {
      if (usedTypes.has('ril-training-' + name)) return;
      const s = pStats(name);
      const training = _pick(trainingTypes);
      const statVal = s[training.stat];
      pool.push({ weight: 1.5, type: 'training-life', player: name,
        text: training.textFn(name), stat: training.stat,
        boost: 0.3 + statVal * 0.02,
        injuryChance: (10 - s.endurance) * 0.02 });
    });

    // ── Mental arc events (integrated into pool) ──
    riList.forEach(name => {
      const pr = pronouns(name);
      const daysOn = epNum - (gs.riArrivalEp[name] || epNum);
      const duelWins = gs.riWinStreak[name] || 0;
      const currentMental = _getMentalState(name);

      if (daysOn >= 3 && currentMental === 'focused' && !usedTypes.has('mental-' + name)) {
        pool.push({ weight: 2, type: 'mental-breakdown-life', player: name,
          text: `${name} sits alone and stares at nothing. The island is getting to ${pr.obj}.`,
          mentalChange: 'broken' });
      }
      if (duelWins >= 2 && currentMental === 'focused' && !usedTypes.has('mental-' + name)) {
        pool.push({ weight: 2, type: 'mental-hardened-life', player: name,
          text: `${name} moves differently now. ${duelWins} duel wins. The softness is gone.`,
          mentalChange: 'hardened' });
      }
      if (daysOn >= 4 && (currentMental === 'focused' || currentMental === 'hardened') && !usedTypes.has('mental-' + name)) {
        const voters = gs.episodeHistory.flatMap(h => (h.votingLog||[]).filter(v => v.voted === name).map(v => v.voter));
        const revengeTarget = voters.length > 0 ? voters[voters.length - 1] : null;
        pool.push({ weight: 1.5, type: 'mental-obsessed-life', player: name,
          text: revengeTarget
            ? `${name} can't stop thinking about ${revengeTarget}. The revenge is all that's left.`
            : `${name} has become consumed by the return challenge. Nothing else exists.`,
          mentalChange: 'obsessed', revengeTarget });
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
          pool.push({ weight: 1, type: 'game-talk', player: nameA, player2: nameB,
            text: `${nameA} and ${nameB} compare notes. The picture of who's running the game gets clearer.`,
            bondDelta: 0, pairKey });

          if (bond <= -3) {
            pool.push({ weight: 2, type: 'rivalry', player: nameA, player2: nameB,
              text: `${nameA} blames ${nameB} for how the vote went. ${nameB} disagrees. Loudly.`,
              bondDelta: -1.5, pairKey });
          }

          // Shared training between pairs
          if (bond >= 1 && !usedTypes.has('shared-train-' + pairKey)) {
            const shStat = _pick(VALID_STATS);
            pool.push({ weight: 1.5, type: 'shared-training-life', player: nameA, player2: nameB,
              text: `${nameA} and ${nameB} train together — ${shStat} drills until sundown. The shared struggle bonds them.`,
              bondDelta: 1.0, pairKey, sharedStat: shStat });
          }

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
          allBond: s.endurance * 0.04 });
      }
      if (s.physical * 0.08 > Math.random() && !usedTypes.has('shelter-' + name)) {
        pool.push({ weight: 1, type: 'bonding', player: name,
          text: `${name} builds a windbreak. Nobody asked. Everyone benefits.`,
          allBond: s.physical * 0.03 });
      }
    });

    // ── Quit temptation ──
    riList.forEach(name => {
      const pr = pronouns(name);
      const s = pStats(name);
      const state = getPlayerState(name);
      const emotional = state?.emotional || 'content';
      const daysOn = epNum - (gs.riArrivalEp[name] || epNum);
      const mentalState = _getMentalState(name);
      // Broken mental state increases quit temptation
      const mentalQuitBoost = mentalState === 'broken' ? 0.10 : 0;
      // Quit temptation — physical depletion (endurance) is the dominant driver of leaving the Edge,
      // with weak will (low boldness) as a secondary push, and the toll compounding the longer you're stranded.
      // No hard cutoff: even a bold, rested player can crack if truly broken, just rarely.
      if (daysOn >= 3 && (emotional === 'desperate' || mentalState === 'broken')) {
        const wornDown = (11 - s.endurance) / 10;   // primary: the island grinds the body down
        const timidity = (11 - s.boldness) / 10;    // secondary: weak will to keep fighting
        const frailty  = wornDown * 0.65 + timidity * 0.35;
        const timeToll = Math.min(0.12, (daysOn - 3) * 0.025);  // +2.5%/episode stranded, capped at +12%
        pool.push({ weight: 5 * frailty, type: 'quit-temptation', player: name,
          text: `${name} stares at the path off the island for a long time today.`,
          quitChance: 0.16 * frailty + timeToll + mentalQuitBoost });
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
    if (picked.type?.startsWith('training')) usedTypes.add('ril-training-' + picked.player);
    if (picked.type?.startsWith('mental-')) usedTypes.add('mental-' + picked.player);
    if (picked.type === 'shared-training-life' && picked.pairKey) usedTypes.add('shared-train-' + picked.pairKey);

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

    // Apply training from life events
    if (picked.type === 'training-life' && picked.stat && picked.player) {
      const isInjury = Math.random() < (picked.injuryChance || 0);
      if (isInjury) {
        const pr = pronouns(picked.player);
        picked.text = `${picked.player} pushes too hard during training. ${pr.Sub} tweak${pr.sub==='they'?'':'s'} something. A setback.`;
        picked.type = 'training-injury-life';
        _addTrainingBonus(picked.player, picked.stat, -0.3);
      } else {
        _addTrainingBonus(picked.player, picked.stat, picked.boost || 0.3);
      }
    }

    // Apply shared training from life events
    if (picked.type === 'shared-training-life' && picked.sharedStat && picked.player && picked.player2) {
      _addTrainingBonus(picked.player, picked.sharedStat, 0.2);
      _addTrainingBonus(picked.player2, picked.sharedStat, 0.2);
    }

    // Apply mental state changes from life events
    if (picked.mentalChange && picked.player) {
      const chance = picked.mentalChange === 'broken' ? 0.20 : picked.mentalChange === 'hardened' ? 0.25 : 0.15;
      if (Math.random() < chance) {
        _setMentalState(picked.player, picked.mentalChange);
        if (picked.mentalChange === 'broken') _addTrainingBonus(picked.player, 'temperament', -0.5);
        if (picked.mentalChange === 'hardened') _addTrainingBonus(picked.player, 'boldness', 0.3);
        if (picked.mentalChange === 'obsessed' && picked.revengeTarget) {
          addBond(picked.player, picked.revengeTarget, -1.0);
        }
      } else {
        // Didn't trigger — change text to a softer version
        const pr = pronouns(picked.player);
        picked.text = `${picked.player} has a rough moment but pulls through. The island tests, but doesn't break.`;
        picked.type = 'processing';
      }
    }

    // Handle quit temptation
    if (picked.type === 'quit-temptation') {
      const evt = { ep: epNum, text: picked.text, type: 'quit-temptation', player: picked.player };
      pushEvt(evt);
      if (Math.random() < picked.quitChance) {
        const pr = pronouns(picked.player);
        const quitEvt = { ep: epNum, type: 'quit',
          text: `${picked.player} raises the sail. ${pr.Sub} ${pr.sub==='they'?'are':'is'} done. The island loses one more.`,
          player: picked.player };
        pushEvt(quitEvt);
        gs.riPlayers = gs.riPlayers.filter(p => p !== picked.player);
        gs.riQuits.push(picked.player);
        gs.eliminated.push(picked.player);
        ep.riQuit = { name: picked.player, daysOnIsland: epNum - (gs.riArrivalEp[picked.player] || epNum) };
        // Clean up tracking for quitter
        delete gs.riWinStreak[picked.player];
        delete gs.riMentalState[picked.player];
        delete gs.riTraining[picked.player];
        const idx = riList.indexOf(picked.player);
        if (idx >= 0) riList.splice(idx, 1);
      }
      continue;
    }

    const evt = { ep: epNum, text: picked.text, type: picked.type, player: picked.player, player2: picked.player2 || null };
    pushEvt(evt);
  }
}
