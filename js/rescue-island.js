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
  // The mental meter is authoritative for the broken state when well-being is tracked
  const mh = gs.riWellbeing?.[name]?.mh;
  if (mh !== undefined && mh < 25) return 'broken';
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

const RI_TRAINING_CAP = 3.0;  // max total banked positive bonus per resident (spec §4)
function _trainingTotal(name) {
  const t = gs.riTraining?.[name]; if (!t) return 0;
  return Object.values(t).reduce((s, v) => s + Math.max(0, v), 0);
}
function _addTrainingBonus(name, statKey, amount) {
  if (!gs.riTraining) gs.riTraining = {};
  if (!gs.riTraining[name]) gs.riTraining[name] = {};
  if (amount > 0) amount = Math.min(amount, Math.max(0, RI_TRAINING_CAP - _trainingTotal(name)));
  gs.riTraining[name][statKey] = (gs.riTraining[name][statKey] || 0) + amount;
}

// ── Well-being meters (Edge of Extinction) — pw = physical, mh = mental, 0–100 ──
function _initWB(name) {
  if (!gs.riWellbeing) gs.riWellbeing = {};
  if (!gs.riWellbeing[name]) gs.riWellbeing[name] = { pw: 100, mh: 85 };  // arrive rattled, not fresh
  return gs.riWellbeing[name];
}
function _clampWB(w) { w.pw = Math.max(0, Math.min(100, w.pw)); w.mh = Math.max(0, Math.min(100, w.mh)); }

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
// EDGE OF EXTINCTION — multi-phase return challenge (spec §7)
// ══════════════════════════════════════════════════════════════════════
export const RESCUE_RETURN_PHASES = [
  { name: 'The Climb',     stat: 'physical',  meter: 'pw', blurb: 'scale the cliff wall' },
  { name: 'The Vigil',     stat: 'endurance', meter: 'pw', blurb: 'hold the line' },
  { name: 'The Cipher',    stat: 'mental',    meter: 'mh', blurb: 'decode the totem' },
  { name: 'The Reckoning', stat: 'social',    meter: 'mh', blurb: 'sway the watchers' },
  { name: 'The Leap',      stat: 'boldness',  meter: 'mh', blurb: 'nerve over the chasm' },
];

// Runs the gauntlet, eliminating worst performer(s) phase by phase with farewells.
// Pure of game-state side effects except popularity + Edge-tracking cleanup; the caller
// (episode.js) handles re-entry, jury, and riPlayers mutation.
export function simulateRescueReturnChallenge(riPlayers, epNum, returnCount = 1) {
  if (!gs.riWellbeing) gs.riWellbeing = {};
  if (!gs.riTraining) gs.riTraining = {};
  if (!gs.riWinStreak) gs.riWinStreak = {};
  if (!gs.riMentalState) gs.riMentalState = {};

  const all = [...riPlayers];
  // How many survive the gauntlet together (DC4 brought back TWO at once). Always leave
  // at least one loser so the gauntlet actually eliminates someone.
  const rc = Math.max(1, Math.min(returnCount, Math.max(1, all.length - 1)));
  let phaseDefs = RESCUE_RETURN_PHASES;
  if (all.length <= 2) phaseDefs = [RESCUE_RETURN_PHASES[0], RESCUE_RETURN_PHASES[2], RESCUE_RETURN_PHASES[4]];

  // Snapshot meters/bonuses for VP/text before any cleanup
  const snapshot = {};
  all.forEach(n => {
    const w = _initWB(n);
    snapshot[n] = { pw: Math.round(w.pw), mh: Math.round(w.mh),
      bonus: +(_trainingTotal(n).toFixed(1)), days: epNum - (gs.riArrivalEp?.[n] || epNum) };
  });

  let remaining = [...all];
  const phases = [];
  const eliminations = [];
  let lastScores = {};

  for (let pi = 0; pi < phaseDefs.length && remaining.length > rc; pi++) {
    const pd = phaseDefs[pi];
    const scores = {};
    remaining.forEach(name => {
      const s = pStats(name);
      const w = _initWB(name);
      const meterMod = (w[pd.meter] / 100 - 0.5) * 2.0;   // ±1.0 from the matching meter
      scores[name] = s[pd.stat] + _getTrainingBonus(name, pd.stat) + meterMod + _noise(3.0);
    });
    lastScores = scores;

    // Give-up override — a competitor near breakdown may collapse early (phases 1–2)
    let gaveUpName = null;
    if (pi < 2) {
      for (const n of remaining) {
        if (_initWB(n).mh < 20 && Math.random() < 0.5) { gaveUpName = n; break; }
      }
    }

    // Size the cut so the gauntlet reduces to EXACTLY `rc` survivor(s) by the final phase.
    // (Fixed cuts left several players standing after the last stage, and the winner
    // then defaulted to remaining[0] — arbitrary list order, not merit.)
    const _phasesLeft = phaseDefs.length - pi;
    let cut = Math.ceil((remaining.length - rc) / _phasesLeft);
    cut = Math.max(0, Math.min(cut, remaining.length - rc));   // never cut below the return count

    const ordered = [...remaining].sort((a, b) => scores[a] - scores[b]);
    const cutList = [];
    if (gaveUpName && cut > 0) cutList.push({ name: gaveUpName, gaveUp: true });
    for (const n of ordered) {
      if (cutList.length >= cut) break;
      if (cutList.some(e => e.name === n)) continue;
      cutList.push({ name: n, gaveUp: false });
    }

    const events = [];
    cutList.forEach(({ name, gaveUp }) => {
      const days = snapshot[name].days;
      const farewell = _edgeFarewell(name, days, gaveUp);
      eliminations.push({ name, phase: pd.name, phaseIndex: pi, gaveUp, daysOnEdge: days, farewell });
      events.push({ name, gaveUp, text: gaveUp
        ? `${name} crumbles in ${pd.name} — body and mind give out at once. ${farewell}`
        : `${name} falls in ${pd.name}. ${farewell}` });
      remaining = remaining.filter(r => r !== name);
    });

    phases.push({ name: pd.name, stat: pd.stat, blurb: pd.blurb,
      scores: { ...scores }, eliminated: cutList.map(e => e.name), events });
  }

  // Order the survivor(s) best-first by their score in the last contested stage.
  const winners = (remaining.length ? [...remaining] : [all[0]])
    .sort((a, b) => (lastScores[b] || 0) - (lastScores[a] || 0));
  const winner = winners[0];
  const finalStandings = [...winners, ...eliminations.slice().reverse().map(e => e.name)];

  if (!gs.popularity) gs.popularity = {};
  winners.forEach(w => { if (w) gs.popularity[w] = (gs.popularity[w] || 0) + 2; });   // fighting back in earns respect

  // The gauntlet is over — everyone leaves the Edge. Clean Edge tracking for all competitors.
  all.forEach(n => {
    delete gs.riWinStreak[n]; delete gs.riMentalState[n];
    delete gs.riTraining[n]; delete gs.riWellbeing[n];
    if (gs.riActionLog) delete gs.riActionLog[n];
  });

  return { winner, winners, returnCount: rc, finalStandings, phases, eliminations, snapshot, competitors: all };
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

// ── Edge of Extinction action model (spec §4–§6) ──
const _ARCH_TRAIN  = { 'challenge-beast':1.8, 'hothead':1.4, 'villain':1.2, 'schemer':1.2, 'mastermind':1.2, 'wildcard':1.1, 'social-butterfly':0.7, 'showmancer':0.7, 'goat':0.6 };
const _ARCH_SOCIAL = { 'social-butterfly':1.6, 'showmancer':1.6, 'hero':1.4, 'loyal-soldier':1.2, 'villain':0.8, 'schemer':0.8, 'challenge-beast':0.7 };
const _EDGE_DRILLS = [
  { label: 'beach sprints',      stat: 'physical',  textFn: n => `${n} runs the beach until ${pronouns(n).pos} legs give out, then runs it again. The body adapts.` },
  { label: 'dead hangs',         stat: 'endurance', textFn: n => `${n} hangs off the cliff ledge until ${pronouns(n).pos} grip screams, then holds it longer. Building iron.` },
  { label: 'driftwood puzzles',  stat: 'mental',    textFn: n => `${n} solves driftwood puzzles over and over, shaving seconds off every attempt.` },
  { label: 'shadow debates',     stat: 'social',    textFn: n => `${n} rehearses pleas to an imaginary jury, sharpening every word.` },
  { label: 'cliff-edge nerves',  stat: 'boldness',  textFn: n => `${n} stands at the cliff edge staring down the drop until the fear goes quiet.` },
  { label: 'reading the others', stat: 'intuition', textFn: n => `${n} studies how the others move and lie, learning to read the unspoken.` },
];
function _archOf(name) { return players.find(p => p.name === name)?.archetype || 'floater'; }

function _edgeFarewell(name, daysOn, gaveUp) {
  const pr = pronouns(name);
  const arch = _archOf(name);
  const longHaul = daysOn >= 5;
  if (gaveUp) return _pick([
    `${pr.Sub} ${pr.sub==='they'?'are':'is'} done. "I left everything out here. There's nothing left to give."`,
    `"I'm not quitting on myself," ${name} says quietly. "I'm choosing to be okay again." Then ${pr.sub} walk${pr.sub==='they'?'':'s'} away.`,
    `${name} can't do it anymore. ${longHaul ? `${daysOn} days on this island took more than the game ever did.` : `The island won this one.`} ${pr.Sub} go${pr.sub==='they'?'':'es'} home.`,
  ]);
  if (['villain','schemer','mastermind'].includes(arch)) return _pick([
    `"Enjoy it while it lasts." ${name} spits the words at the others. "I'll be watching from the jury."`,
    `${name} says nothing kind — just a cold look and a colder walk off the sand.`,
  ]);
  if (['hero','loyal-soldier','social-butterfly','showmancer','underdog','goat'].includes(arch)) return _pick([
    `"I gave it everything," ${name} says, hugging whoever's closest. "No regrets. Go win it."`,
    `${name} shakes every hand on the way out. "Proud of myself. Proud of all of you."`,
  ]);
  return _pick([
    `"That's the game," ${name} shrugs. "I fought my way back as far as I could."`,
    `${name} nods once, picks up ${pr.pos} bag, and walks. No drama. Just done.`,
  ]);
}

// Daily Train / Rest / Socialize resolution + meter economy. Mutates gs.riPlayers/riList on quit.
function _resolveEdgeActions(ep, riList, epNum, pushEvt) {
  riList.slice().forEach(name => {
    if (!gs.riPlayers.includes(name)) return;
    const s = pStats(name);
    const pr = pronouns(name);
    const w = _initWB(name);
    const daysOn = epNum - (gs.riArrivalEp[name] || epNum);
    const arch = _archOf(name);

    // 1) Passive time toll on the mind — COMPOUNDS with every day stranded (uncapped); boldness = resilience.
    //    Long-haul residents erode toward breakdown unless they keep spending actions on social contact —
    //    which means sacrificing training time. Winning the return early is its own reward.
    let timeToll = 3 + daysOn * 1.0;
    timeToll *= Math.max(0.65, Math.min(1.35, 1 - (s.boldness - 5) * 0.05));
    w.mh -= timeToll;

    // 2) Pick an action — hard survival gates first, then personality × stats × meters (Blend)
    let action;
    if (w.mh < 25 && w.pw >= 25)      action = 'social';
    else if (w.pw < 25)               action = 'rest';
    else {
      const trainW  = 1.0 * (_ARCH_TRAIN[arch]  || 1.0) * (1 + (s.endurance - 5) * 0.08 + (s.boldness - 5) * 0.06) * (w.pw / 100);
      const restW   = 0.8 * (1 + (100 - w.pw) / 100 * 1.5);
      const socialW = 1.0 * (_ARCH_SOCIAL[arch] || 1.0) * (1 + (s.social - 5) * 0.08) * (1 + (100 - w.mh) / 100 * 1.2);
      action = wRandom(['train','rest','social'], a => a === 'train' ? Math.max(0.05, trainW) : a === 'rest' ? restW : socialW);
    }

    // 3) Apply effects
    if (action === 'train') {
      const drill = _pick(_EDGE_DRILLS);
      const accidentChance = 0.12 + (1 - w.pw / 100) * 0.30 + Math.max(0, s.boldness - 6) * 0.03;
      if (Math.random() < accidentChance) {
        w.pw -= 25; w.mh -= 4;
        pushEvt({ ep: epNum, type: 'edge-injury', player: name,
          text: `${name} pushes too hard at ${drill.label}. Something gives — a wound, a wasted day. ${pr.Sub} limp${pr.sub==='they'?'':'s'} back to camp with nothing to show.` });
      } else {
        w.pw -= 8;
        _addTrainingBonus(name, drill.stat, 0.4);
        pushEvt({ ep: epNum, type: 'edge-train', player: name, stat: drill.stat, text: drill.textFn(name) });
      }
    } else if (action === 'rest') {
      w.pw += 18; w.mh += 3;
      pushEvt({ ep: epNum, type: 'edge-rest', player: name, text: _pick([
        `${name} does nothing today but heal — sleeping in the shade, letting the body knit back together.`,
        `${name} rests. No drills, no drama. Just recovery. The return challenge needs a working body.`,
        `${name} tends ${pr.pos} wounds and sleeps through the heat of the day. Tomorrow ${pr.sub} can push again.`,
      ]) });
    } else {
      w.mh += 12; w.pw += 2;
      const others = riList.filter(o => o !== name && gs.riPlayers.includes(o));
      const friend = others.length ? _pick(others) : null;
      if (friend) addBond(name, friend, 0.8);
      pushEvt({ ep: epNum, type: 'edge-social', player: name, player2: friend, text: friend ? _pick([
        `${name} and ${friend} sit by the fire trading stories until the dark feels smaller. The mind steadies.`,
        `${name} talks it out with ${friend}. No strategy — just two people keeping each other sane out here.`,
        `${name} leans on ${friend} today. The weight gets lighter when it's shared.`,
      ]) : _pick([
        `${name} walks the shore and lets the rhythm of the waves do the work. The noise in ${pr.pos} head quiets.`,
        `${name} carves a tally into driftwood, one mark per day survived. A small ritual. It helps.`,
      ]) });
    }
    _clampWB(w);
    if (!gs.riActionLog) gs.riActionLog = {};
    (gs.riActionLog[name] ??= []).push(action);

    // 4) Breakdown / quit — meter-driven
    if (w.mh < 30) {
      let quitChance = (0.08 + (30 - w.mh) / 30 * 0.32) * (1 + (5 - s.boldness) * 0.06);
      if (w.pw < 25) quitChance += 0.05;
      if (Math.random() < quitChance) {
        pushEvt({ ep: epNum, type: 'quit', player: name, text: `${name} raises the sail. ${_edgeFarewell(name, daysOn, true)}` });
        gs.riPlayers = gs.riPlayers.filter(p => p !== name);
        gs.riQuits.push(name);
        if (!gs.eliminated.includes(name)) gs.eliminated.push(name);
        ep.riQuit = { name, daysOnIsland: daysOn };
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[name] = (gs.popularity[name] || 0) + 1;
        delete gs.riWinStreak[name]; delete gs.riMentalState[name];
        delete gs.riTraining[name]; delete gs.riWellbeing[name];
        const idx = riList.indexOf(name); if (idx >= 0) riList.splice(idx, 1);
      }
    }
  });
}

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

  // ── Daily action model + meter economy (Train / Rest / Socialize). Authoritative for
  //    training bonuses, well-being, and quits. Runs once per resident per episode. ──
  _resolveEdgeActions(ep, riList, epNum, pushEvt);

  // Remaining events below are supplementary colour (processing, social, survival) — no training/quit.
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

    // (Training is now handled by _resolveEdgeActions above — no training events in this colour pool.)

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

    // (Quitting is now meter-driven in _resolveEdgeActions above.)

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

    const evt = { ep: epNum, text: picked.text, type: picked.type, player: picked.player, player2: picked.player2 || null };
    pushEvt(evt);
  }
}
// ══════════════════════════════════════════════════════════════════════
// INTERLUDE LIFE — a full non-elimination "check in on the out-of-game cast"
// EPISODE. Because this segment IS the whole episode, it's built as 4 acts with
// multi-beat storylines and a dramatic centerpiece.
//
// The two venues are fundamentally different situations:
//   • RESCUE ISLAND — the cast is STILL IN THE GAME. They can come back and win,
//     so they're RIVALS: training for the return, sizing each other up as
//     threats, forming fragile comeback pacts, weathering the island. The
//     centerpiece is a storm-and-rescue setpiece. (No jury rooting — they want
//     to win it themselves.)
//   • JURY HOUSE — the cast is OUT FOR GOOD (the jury). They process, feud, find
//     closure, and DEBATE who deserves the win. The centerpiece is the Roundtable.
//
// Output: ep.interlude = { venue, residents, acts:[{title,beats:[...]}],
//   events (flattened), roundtable, teaser }. (+ ep.juryHouse alias.)
// ══════════════════════════════════════════════════════════════════════
export function generateInterludeLife(ep) {
  const venue = ep.interludeMode === 'jury-house' ? 'jury' : 'rescue';
  const residents = [...(venue === 'jury' ? (gs.eliminated || []) : (gs.riPlayers || []))];
  if (residents.length < 2) return;
  const epNum = ep.num || (gs.episode || 0) + 1;
  const active = [...gs.activePlayers];

  const P = (n) => pronouns(n);
  const archOf = (n) => players.find(p => p.name === n)?.archetype || 'floater';
  const shuffle = (a) => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
  const allNames = residents.concat(active);
  const strip = (t) => allNames.reduce((s, n) => n ? s.split(n).join('~') : s, t);
  const usedTpl = new Set();
  const draw = (pool, ...ctx) => {
    const built = pool.map(f => f(...ctx));
    const fresh = built.filter(t => !usedTpl.has(strip(t)));
    const from = fresh.length ? fresh : built;
    const chosen = from[Math.floor(Math.random() * from.length)];
    usedTpl.add(strip(chosen));
    return chosen;
  };
  const elimInfo = (name) => {
    const h = (gs.episodeHistory || []).find(e => e.eliminated === name || e.firstEliminated === name);
    const voters = (h?.votingLog || []).filter(v => v.voted === name && v.voter !== 'THE GAME').map(v => v.voter);
    const alliance = (h?.alliances || []).find(a => a.members?.includes(name));
    return { epsSince: epNum - (h?.num || 0), voters, betrayedBy: alliance ? alliance.members.filter(m => voters.includes(m)) : [] };
  };

  const V = venue === 'jury'
    ? { home: 'the motel', spot: 'the pool deck', kitchen: 'the motel kitchen', comm: 'the lounge' }
    : { home: 'camp', spot: 'the fire', kitchen: 'the cook pit', comm: 'the shelter' };

  const appeared = {}; // name -> count, to guarantee coverage
  const featured = new Set(); // names carrying a storyline (get fewer color beats)
  const mark = (ppl) => ppl.forEach(n => { appeared[n] = (appeared[n] || 0) + 1; });
  const beat = (badge, cls, ppl, text, bondDelta) => { mark(ppl); return { badge, cls, player: ppl[0], player2: ppl[1] || null, players: ppl, text, bondDelta: bondDelta || 0 }; };

  // ────────────────────────────────────────────────────────────
  // STORYLINE BUILDERS — each returns { a1, a2, a3, a4 } beat-arrays keyed by act,
  // and applies its own bond consequences. They FEATURE specific residents.
  // ────────────────────────────────────────────────────────────
  const S = { a1: [], a2: [], a3: [], a4: [] }; // storyline beats bucketed by act
  const put = (act, b) => S[act].push(b);

  // — RESCUE: THE STORM (centerpiece) — weather builds, someone is stranded, the camp rescues them —
  function storyStorm() {
    const pool = shuffle(residents);
    const victim = pool.find(n => pStats(n).boldness >= 6) || pool[0];
    const rescuer = pool.find(n => n !== victim && (archOf(n) === 'hero' || pStats(n).loyalty >= 6)) || pool.find(n => n !== victim);
    const buddy = pool.find(n => n !== victim && n !== rescuer);
    if (!victim || !rescuer) return;
    [victim, rescuer, buddy].filter(Boolean).forEach(n => featured.add(n));
    put('a2', beat('STORM WARNING', 'iron', [victim, buddy].filter(Boolean), draw([
      (v, b) => `The sky over the island turns the color of a bruise. ${v}${b ? ` and ${b}` : ''} lash the shelter down while everyone eyes the horizon. "That's not blowing over. That's coming for us."`,
    ], victim, buddy)));
    put('a2', beat('BATTEN DOWN', 'iron', [rescuer, buddy].filter(Boolean), draw([
      (r, b) => `Old rivalries get shelved fast when the wind picks up. ${r}${b ? `, ${b},` : ''} and half the camp haul the canoe up the beach and pile rocks on the food stores. "Save the fighting for tomorrow. Tonight we just don't want to die out here."`,
    ], rescuer, buddy)));
    put('a3', beat('SWEPT AWAY', 'danger', [victim].filter(Boolean), draw([
      (v) => `The storm hits like a wall. ${v} goes out to drag in the last of the firewood — and doesn't come back. A shout, a snapped branch, then nothing but rain.`,
      (v) => `Mid-squall the ridge gives way and ${v} drops out of sight into a gully. The wind eats ${P(v).posAdj} scream. Camp realizes too late that someone's missing.`,
    ], victim)));
    put('a3', beat('MISSING', 'danger', [rescuer, buddy].filter(Boolean), draw([
      (r, b) => `A headcount comes up one short. ${r}${b ? ` and ${b}` : ''} scream ${victim}'s name into the dark and hear nothing but the surf. "We are not losing somebody out here. Not like this. Grab a rope."`,
    ], rescuer, buddy)));
    put('a3', beat('THE RESCUE', 'green', [rescuer, victim].filter(Boolean), draw([
      (r, v) => `${r} goes out into the teeth of it, roped to the shelter post, and finds ${v} half-buried and shaking. ${P(r).Sub} ${P(r).sub === 'they' ? 'haul' : 'hauls'} ${P(v).obj} back hand over hand. Nobody breathes until they're both under cover.`,
      (r, v) => `It's ${r} who won't wait it out. ${P(r).Sub} ${P(r).sub === 'they' ? 'wade' : 'wades'} into the flood, grabs ${v} by the collar, and drags ${P(v).obj} up the bank inch by inch as the others form a chain. They make it. Barely.`,
    ], rescuer, victim), 3.0));
    if (buddy) put('a4', beat('AFTER THE STORM', 'green', [victim, rescuer], draw([
      (v, r) => `Dawn comes gray and quiet. ${v} can't look at ${r} without ${P(v).posAdj} eyes going wet. "You didn't have to come out there for me. We're supposed to be fighting each other for that spot." ${r} just shrugs. "Not last night we weren't."`,
    ], victim, rescuer), 2.0));
    addBond(victim, rescuer, 3.0);
  }

  // — RESCUE: THREAT RIVALRY — two strongest circle each other as the biggest danger to the return —
  function storyRivalry() {
    const threats = residents.slice().sort((a, b) => (pStats(b).physical + pStats(b).boldness + pStats(b).endurance) - (pStats(a).physical + pStats(a).boldness + pStats(a).endurance));
    const a = threats[0], b = threats[1];
    if (!a || !b || featured.has(a) && featured.has(b)) return;
    featured.add(a); featured.add(b);
    put('a1', beat('SIZING UP', 'gold', [a, b], draw([
      (x, y) => `${x} clocks ${y} the second ${P(y).sub} ${P(y).sub === 'they' ? 'arrive' : 'arrives'}. Two of the biggest threats in the game, now fighting for one ticket back. "If anybody in this camp beats me to that return, it's ${y}. So I'm watching."`,
    ], a, b)));
    put('a2', beat('THE NEEDLE', 'danger', [a, b], draw([
      (x, y) => `${x} and ${y} turn every chore into a contest — who hauls more, who lasts longer at the fire. A "friendly" arm-wrestle at ${V.kitchen} ends with a table nearly flipped and the whole camp watching.`,
      (x, y) => `${y} "jokes" that ${x} only made it this far on luck. ${x} doesn't laugh. The temperature at ${V.spot} drops ten degrees.`,
    ], a, b), -1.0));
    put('a4', beat('FLASHPOINT', 'danger', [a, b], draw([
      (x, y) => `It nearly comes to blows when ${x} accuses ${y} of hoarding the good training gear. Camp gets between them before it lands. "One of us is going back and one of us is going home. I'm done pretending we're friends."`,
    ], a, b), -1.0));
    put('a4', beat('UNEASY TRUCE', 'iron', [a, b], draw([
      (x, y) => `After the worst of it, ${x} finds ${y} training alone at the water's edge and joins in without a word. "We're gonna be the last two standing for that spot. Might as well make each other sharper." It isn't friendship. It's respect — the dangerous kind.`,
    ], a, b), 1.0));
    addBond(a, b, -0.5);
  }

  // — RESCUE: COMEBACK — someone bottoms out, another lifts them, they refire for the return —
  function storyComeback() {
    const low = residents.slice().sort((a, b) => (pStats(a).temperament + pStats(a).boldness) - (pStats(b).temperament + pStats(b).boldness))[0];
    const lifter = residents.slice().sort((a, b) => getBond(b, low) - getBond(a, low)).find(n => n !== low);
    if (!low || !lifter || featured.has(low)) return;
    featured.add(low); featured.add(lifter);
    put('a1', beat('ROCK BOTTOM', 'danger', [low], draw([
      (n) => `${n} sits apart from everyone, staring at the surf. "What's the point of training? I got voted out for a reason. They'll just do it again." The fire in ${P(n).obj} is out.`,
    ], low)));
    put('a2', beat('A HAND UP', 'green', [lifter, low], draw([
      (l, n) => `${l} sits down next to ${n} and doesn't say anything smart — just stays. Then: "You're not out here because you're weak. You're out here because you're a threat. Big difference. Now get up." ${n} gets up.`,
    ], lifter, low), 2.0));
    put('a4', beat('REFIRED', 'green', [low], draw([
      (n) => `By nightfall ${n} is the last one still drilling in the dark, jaw set. "I'm not coming back to make friends. I'm coming back to finish it." The camp feels the shift.`,
    ], low)));
    addBond(low, lifter, 2.0);
  }

  // — RESCUE: THE PACT — two allies weigh a fragile comeback alliance for after the return —
  function storyPact() {
    const pair = shuffle(residents).filter(n => !featured.has(n));
    let a = pair[0], b = pair.slice(1).sort((x, y) => getBond(a, y) - getBond(a, x))[0];
    if (!a || !b) return;
    featured.add(a); featured.add(b);
    put('a2', beat('THE OFFER', 'gold', [a, b], draw([
      (x, y) => `${x} pulls ${y} down the beach, out of earshot. "If we both make it back in, we're targets — unless we're a two. Ride together till the end?" ${y} doesn't say yes. Doesn't say no. Just listens.`,
    ], a, b)));
    put('a3', beat('COLD FEET', 'danger', [a, b], draw([
      (x, y) => `Doubt creeps in overnight. ${y} watches ${x} charm the whole camp and wonders out loud: "Am I ${P(x).posAdj} number one — or ${P(x).posAdj} insurance? Out here everybody's smiling. That's exactly what scares me."`,
    ], a, b)));
    put('a4', beat('SEALED IN THE SAND', 'green', [a, b], draw([
      (x, y) => `They shake on it at ${V.spot}, low and quiet so the rivals don't see. "First one back holds the door for the other. No matter who's got the numbers." A pact made by two people the game already burned once.`,
    ], a, b), 1.5));
    addBond(a, b, 1.5);
  }

  // — RESCUE: THE ANCHOR — someone becomes camp's backbone; leadership breeds friction and respect —
  function storyProvider() {
    const anchor = residents.slice().sort((a, b) => (pStats(b).physical + pStats(b).endurance + pStats(b).loyalty) - (pStats(a).physical + pStats(a).endurance + pStats(a).loyalty)).find(n => !featured.has(n));
    if (!anchor) return;
    const doubter = residents.slice().sort((a, b) => getBond(a, anchor) - getBond(b, anchor)).find(n => n !== anchor);
    featured.add(anchor); if (doubter) featured.add(doubter);
    put('a1', beat('THE ANCHOR', 'green', [anchor], draw([
      (n) => `While everyone else licks their wounds, ${n} just... gets to work. Fire lit, fish smoked, shelter re-roofed. By midday the whole camp runs on ${P(n).posAdj} rhythm without anyone deciding it should.`,
    ], anchor)));
    if (doubter) put('a2', beat('WHO PUT YOU IN CHARGE', 'danger', [anchor, doubter], draw([
      (n, d) => `${d} bristles at ${n} calling the shots. "This isn't your camp. We're all fighting for the same seat back." ${n} keeps stacking firewood. "Then help me stack. Or don't eat. Your call."`,
    ], anchor, doubter), -0.5));
    put('a4', beat('EARNED IT', 'green', [anchor], draw([
      (n) => `By nightfall even the doubters are eating ${n}'s fish and warming at ${P(n).posAdj} fire. Nobody says thank you. But when the return challenge comes, everyone already knows who the camp would follow.`,
    ], anchor)));
    addBond(anchor, doubter || anchor, 0.5);
  }

  // — JURY: THE ROUNDTABLE (centerpiece) — the jury debates the finalists —
  let roundtable = null;
  function storyRoundtable() {
    if (!(gs.isMerged && active.length >= 2)) return;
    const finalists = active.slice().sort((a, b) => (gs.episodeHistory || []).filter(e => e.immunityWinner === b).length - (gs.episodeHistory || []).filter(e => e.immunityWinner === a).length).slice(0, 4);
    const backerUse = {}, doubterUse = {};
    const leastUsed = (cands, use, dir) => cands.slice().sort((a, c) => ((use[a.n] || 0) - a.b * dir * 0.15) - ((use[c.n] || 0) - c.b * dir * 0.15) || Math.random() - 0.5)[0].n;
    const lines = finalists.map(fin => {
      const ranked = residents.map(n => ({ n, b: getBond(n, fin) }));
      const backer = leastUsed(ranked.filter(x => x.b >= 0).length ? ranked.filter(x => x.b >= 0) : ranked, backerUse, 1);
      const dCands = ranked.filter(x => x.n !== backer);
      const doubter = leastUsed(dCands.filter(x => x.b <= 0).length ? dCands.filter(x => x.b <= 0) : dCands, doubterUse, -1);
      backerUse[backer] = (backerUse[backer] || 0) + 1; doubterUse[doubter] = (doubterUse[doubter] || 0) + 1;
      const backText = draw([
        (f, s) => `${s} makes the case for ${f}: "${f} actually played. Owned the moves, took the shots. That's a résumé."`,
        (f, s) => `${s} won't stop championing ${f}. "${f} is still in there and we're out here. That's the whole argument."`,
        (f, s) => `${s} leans in on ${f}: "Every big move this season had ${f}'s fingerprints on it. That's a winner."`,
        (f, s) => `${s} goes to bat for ${f}: "${f} played the people, not just the board. Hardest part of this game — and ${f} nailed it."`,
      ], fin, backer);
      const doubtText = draw([
        (f, d) => `${d} isn't sold. "${f} hid behind other people's plans all game. Now it's a 'résumé'? Convenient."`,
        (f, d) => `${d} pushes back. "${f} floated. I'm not rewarding somebody who never put their own neck out."`,
        (f, d) => `${d} scoffs. "${f} rode other people's numbers to the end. Being there isn't the same as earning it."`,
        (f, d) => `${d} shakes ${P(d).posAdj} head. "${f} never had to make the hard call. Easy to look clean when someone else does the dirty work."`,
      ], fin, doubter);
      return { finalist: fin, backer, doubter, backText, doubtText };
    });
    roundtable = { finalists, lines };
    // pre-roundtable tension in act 2
    const hot = residents[Math.floor(Math.random() * residents.length)];
    put('a2', beat('THE VOTE LOOMS', 'gold', [hot], draw([
      (n) => `${n} keeps steering every conversation back to the finale. "Whatever we say at the roundtable — that's the last power we've got in this game. I'm not wasting it."`,
    ], hot)));
  }

  // — JURY: GRUDGE → CLOSURE — two who clashed in the game hash it out —
  function storyGrudge() {
    let best = null;
    for (let i = 0; i < residents.length; i++) for (let j = i + 1; j < residents.length; j++) {
      const b = getBond(residents[i], residents[j]);
      if (b <= -3 && (!best || b < best.b)) best = { a: residents[i], c: residents[j], b };
    }
    if (!best) return;
    const { a, c } = best;
    featured.add(a); featured.add(c);
    put('a1', beat('OLD WOUNDS', 'danger', [a, c], draw([
      (x, y) => `${x} and ${y} arrive at ${V.home} still carrying the game with them. One shared glance across ${V.comm} and everyone can feel it: this isn't over.`,
    ], a, c)));
    put('a2', beat('IT BOILS OVER', 'danger', [a, c], draw([
      (x, y) => `It erupts at ${V.kitchen} — ${x} finally says what ${P(x).sub}${P(x).sub === 'they' ? "'ve" : "'s"} been holding, ${y} fires back, and the others clear the room. "You looked me in the eye and lied. In here I've got nothing but time to remember that."`,
    ], a, c), -1.0));
    put('a3', beat('THE RECKONING', 'iron', [a, c], draw([
      (x, y) => `${y} is the one who finally crosses the room. No cameras rolling in their heads anymore — just two people who lost. They talk for an hour. It's ugly, then it isn't.`,
    ], a, c)));
    put('a4', beat('BURIED IT', 'green', [a, c], draw([
      (x, y) => `By the last night ${x} and ${y} are sharing a bottle ${y} swiped from the kitchen, laughing about how petty it all got. "We gave this game everything and it spat us both out. No sense hating each other over it now."`,
    ], a, c), 2.5));
    addBond(a, c, 1.5);
  }

  // — JURY: OUTSIDER — someone feels out of place until another pulls them in —
  function storyOutsider() {
    const outsider = residents.slice().sort((a, b) => {
      const sa = active.concat(residents).reduce((s, o) => s + Math.max(0, getBond(a, o)), 0);
      const sb = active.concat(residents).reduce((s, o) => s + Math.max(0, getBond(b, o)), 0);
      return sa - sb;
    }).find(n => !featured.has(n));
    if (!outsider) return;
    const includer = residents.slice().sort((a, b) => (getBond(b, outsider) - getBond(a, outsider)))[0] === outsider
      ? residents.find(n => n !== outsider) : residents.slice().sort((a, b) => getBond(b, outsider) - getBond(a, outsider)).find(n => n !== outsider);
    if (!includer) return;
    featured.add(outsider); featured.add(includer);
    put('a1', beat('ON THE OUTSIDE', 'iron', [outsider], draw([
      (n) => `${n} keeps to the edge of every room, watching the others fall back into old friendships. "Even here, I don't quite fit. Same as the game, honestly." ${P(n).Sub} ${P(n).sub === 'they' ? 'say' : 'says'} it like a joke. It isn't.`,
    ], outsider)));
    put('a2', beat('A SEAT AT THE TABLE', 'green', [includer, outsider], draw([
      (i, n) => `${i} notices ${n} eating alone again and just... sits down. Pulls ${P(n).obj} into the card game, the cooking, the dumb argument about the TV. Small thing. It lands like a lifeline.`,
    ], includer, outsider), 2.0));
    put('a4', beat('BELONGING', 'green', [outsider, includer], draw([
      (n, i) => `By nightfall ${n} is in the middle of the crowd at ${V.spot}, actually laughing. "${i} didn't have to do that. Nobody in the game ever did. Maybe that's the difference out here."`,
    ], outsider, includer)));
    addBond(outsider, includer, 2.0);
  }

  // — JURY: UNLIKELY FRIENDSHIP — two who never connected in the game become thick as thieves —
  function storyFriendship() {
    const pool = shuffle(residents).filter(n => !featured.has(n));
    let a = pool[0];
    let b = pool.slice(1).sort((x, y) => Math.abs(getBond(a, x)) - Math.abs(getBond(a, y)))[0];
    if (!a || !b) return;
    featured.add(a); featured.add(b);
    put('a2', beat('STRANGE BEDFELLOWS', 'green', [a, b], draw([
      (x, y) => `${x} and ${y} were never on the same page in the game — different tribes, different plans, barely a word. A 2 a.m. kitchen raid changes that. Turns out they've got the same terrible taste in everything.`,
    ], a, b)));
    put('a4', beat('THICK AS THIEVES', 'green', [a, b], draw([
      (x, y) => `By the last night ${x} and ${y} are finishing each other's sentences and planning a road trip after the finale. "Weird, right? The game never let us find out we'd actually be friends. Took getting voted out."`,
    ], a, b), 2.0));
    addBond(a, b, 2.0);
  }

  // — JURY: THE BITTER JUROR — someone can't let go of how they went out; it will drive their vote —
  function storyBitter() {
    const bitter = residents.slice().sort((a, b) => (pStats(a).temperament) - (pStats(b).temperament)).find(n => !featured.has(n) && elimInfo(n).voters.length);
    if (!bitter) return;
    const info = elimInfo(bitter);
    const target = info.betrayedBy[0] || info.voters.find(v => active.includes(v)) || null;
    featured.add(bitter);
    put('a1', beat("CAN'T LET GO", 'danger', [bitter], draw([
      (n) => target
        ? `${n} brings up ${target}'s name at every meal like picking a scab. "${target} looked me dead in the eye and lied. I'm on that jury now, and I've got a long memory."`
        : `${n} replays ${P(n).posAdj} exit on a loop, jaw tight. "Everybody says 'it's just a game.' Easy to say when you're not the one they lied to."`,
    ], bitter)));
    put('a4', beat('THE GRUDGE VOTE', 'gold', [bitter], draw([
      (n) => target
        ? `Whatever the others argue at the roundtable, ${n} has already decided: ${target} will never get ${P(n).posAdj} vote. "Play the game, fine. But don't insult me and then ask me to reward you for it."`
        : `${n} tells the house flat out: nobody who smiled in ${P(n).posAdj} face on the way out is getting this vote. "I earned my seat on this jury the hard way. I'm spending it on principle."`,
    ], bitter)));
  }

  // ── choose storylines by venue ──
  // Fire ALL applicable storylines so the episode is dense (each features distinct
  // residents via the `featured` set; builders bail if their people are taken).
  if (venue === 'rescue') {
    storyStorm();
    if (residents.length >= 4) storyRivalry();
    if (residents.length >= 4) storyProvider();
    if (residents.length >= 5) storyPact();
    if (residents.length >= 3) storyComeback();
  } else {
    storyRoundtable();
    storyGrudge();
    if (residents.length >= 4) storyOutsider();
    if (residents.length >= 5) storyBitter();
    if (residents.length >= 6) storyFriendship();
  }

  // ────────────────────────────────────────────────────────────
  // COLOR BEATS — venue-specific solo/pair flavor, spread across residents not
  // already carrying a storyline. RESCUE = competitive/survival; JURY = processing.
  // ────────────────────────────────────────────────────────────
  const RESCUE_SOLO = {
    training: { badge: 'TRAINING', cls: 'gold', pool: [
      (n) => `${n} builds a rig from driftwood and vines and drills on it till ${P(n).posAdj} hands bleed. "That return challenge is the only thing between me and a second life. I'm not showing up soft."`,
      (n) => `${n} swims the cove end to end, over and over, timing ${P(n).ref} against the tide. Every rep is a message: whoever comes back, it's going to be ${P(n).obj}.`,
      (n) => `${n} memorizes the shoreline, the currents, the wind — treating the whole island like a puzzle for the challenge ${P(n).sub} ${P(n).sub === 'they' ? 'know' : 'knows'} is coming.`,
      (n) => `${n} runs the ridge at dawn before anyone's up, banking miles nobody sees. "Let them think I'm resting. I'll let my legs do the talking at the challenge."`,
      (n) => `${n} practices holding ${P(n).posAdj} breath underwater, timing it by heartbeats. "Half these return challenges come down to who can suffer longest. So I'm learning to suffer."`,
    ] },
    provider: { badge: 'THE BACKBONE', cls: 'green', pool: [
      (n) => `${n} quietly becomes the reason the camp runs — fire lit, fish caught, shelter patched. "Out here you earn respect the old way. And respect might be the thing that carries me back in."`,
      (n) => `While others rest, ${n} is hauling water and re-lashing the roof. Nobody asked. Everyone notices. In a camp full of rivals, being needed is its own kind of power.`,
      (n) => `${n} splits the last of the food fair and even, down to the crumb — even for the people ${P(n).sub}'ll have to beat. "We can be enemies at the challenge. Tonight everybody eats."`,
    ] },
    surviving: { badge: 'THE TOLL', cls: 'iron', pool: [
      (n) => `The island is grinding ${n} down — thinner, quieter, ${P(n).posAdj} eyes ringed dark. "Nobody tells you the wait is its own challenge. Some of us won't make it to the return in one piece."`,
      (n) => `${n} lies awake listening to the surf, running the vote back. "You come out here to fight your way in. Then you realize the first thing you have to survive is your own head."`,
      (n) => `${n} pushes through a rough patch — a cut gone sour, no sleep, less food — but won't say a word about it. "Show weakness out here and you've already lost the return."`,
    ] },
    homesick: { badge: 'HOMESICK', cls: 'iron', pool: [
      (n) => `${n} goes quiet talking about home. "I miss the noise. My people. Out here it's too calm and my head gets loud." ${P(n).Sub} ${P(n).sub === 'they' ? 'laugh' : 'laughs'} it off, barely.`,
      (n) => `${n} scratches a tally into a piece of driftwood — one mark a day since the vote. "I just want back in before I forget why I came."`,
      (n) => `${n} tells a long story about someone back home and the whole camp goes quiet, everyone thinking of their own.`,
    ] },
  };
  const JURY_SOLO = {
    processing: { badge: 'PROCESSING', cls: 'iron', pool: [
      (n) => `${n} sits apart at ${V.spot} and finally lets it out — not about the game, about everything it cost ${P(n).obj}. ${P(n).Sub} ${P(n).sub === 'they' ? 'wipe' : 'wipes'} ${P(n).posAdj} eyes and ${P(n).sub === 'they' ? 'stay' : 'stays'} put.`,
      (n) => `${n} has stopped picking at the wound. Somewhere between the pool and the quiet, the anger cooled into something like peace.`,
      (n) => `${n} admits the hardest part isn't losing — it's not knowing if ${P(n).sub} would've done it differently. Nobody has an answer. They just nod.`,
      (n) => `${n} writes a long, rambling note to ${P(n).posAdj} game self and then laughs at it. "Dear me: you got too comfortable. Love, the jury."`,
      (n) => `${n} finally sleeps through the night for the first time since the vote. "Turns out the game was the nightmare. This is just... quiet."`,
      (n) => `${n} watches ${P(n).posAdj} own blindside replay on the lounge TV and, to everyone's surprise, claps. "Okay. That was good. I'd have voted me out too."`,
    ] },
    rooting: { badge: 'ROOTING', cls: 'green', need: (n) => { const f = active.map(p => ({ p, b: getBond(n, p) })).sort((a, b) => b.b - a.b)[0]; return f && f.b >= 3 ? f.p : null; }, pool: [
      (n, f) => `${n} — a lock for ${f}'s jury vote — talks ${f} up to the whole house. "I'm out. Fine. But my vote's still live, and it's got ${f}'s name on it."`,
      (n, f) => `${n} watches ${f}'s every move on the feeds and grins. "When I get to that jury seat, I already know who's earned it. Go on, ${f}."`,
      (n, f) => `${n} defends ${f} hard when the house piles on. "Say what you want. ${f} is the only one left playing a game I'd vote for."`,
    ] },
    observing: { badge: 'WATCHING', cls: 'gold', pool: [
      (n) => `${n} says little but misses nothing, filing away every finale rumor that drifts into ${V.home}. "The game's not done with me yet. I've still got a vote — and I'm going to spend it right."`,
      (n) => `${n} watches the feeds in ${V.comm} like film study, muttering reads under ${P(n).posAdj} breath. "I lost. Doesn't mean I stopped seeing the board."`,
      (n) => `${n} stays out of the house drama and just observes who's really who now the masks are off. "You learn a lot about people once the game can't reward them for lying."`,
      (n) => `${n} keeps a mental scorecard on the finalists and shares it with nobody. "Everyone in here is campaigning. I'm just... watching who's worth a vote."`,
      (n) => `${n} notices which jurors are already locked in and which are still winnable. "The finale's not just their game anymore. It's ours too, now."`,
    ] },
    restless: { badge: 'RESTLESS', cls: 'danger', need: (n) => (archOf(n) === 'hothead' || pStats(n).boldness >= 7) ? true : null, pool: [
      (n) => `${n} can't sit still — laps in the pool, pacing the lobby — anything to burn off being out. "If I stop moving I start thinking. So I don't stop."`,
      (n) => `${n} snaps at the TV, the food, the weather — anything but the real thing. An hour later ${P(n).sub} ${P(n).sub === 'they' ? 'apologize' : 'apologizes'} to the room. "It's not you. It's that I should still be in there."`,
      (n) => `${n} keeps trying to turn ${V.home} into a competition — who swims faster, who stays up latest — because being out with nothing to win eats at ${P(n).obj}.`,
    ] },
  };

  const SOLO = venue === 'rescue' ? RESCUE_SOLO : JURY_SOLO;
  const PAIR = {
    bond: { badge: 'COMMON GROUND', cls: 'green', delta: 1.0, pool: [
      (a, b) => `${a} and ${b} barely spoke in the game. Over ${venue === 'jury' ? 'dishes and bad TV' : 'firewood and fishing'}, they find they actually get along.`,
      (a, b) => `Stuck on ${venue === 'jury' ? 'kitchen duty' : 'shelter repair'} together, ${a} and ${b} turn out funnier than either expected. The ice breaks.`,
      (a, b) => `${a} catches ${b} having a rough night and sits with ${P(b).obj} at ${V.spot} until it passes. Neither mentions it again.`,
      (a, b) => `${a} and ${b} trade stories about home until the ${venue === 'jury' ? 'motel' : 'island'} feels a little less lonely. Two strangers, suddenly not.`,
      (a, b) => `${a} teaches ${b} some ${venue === 'jury' ? 'card trick' : 'knot'} nobody asked about, and an hour vanishes. The kind of easy that never happened in the game.`,
      (a, b) => `${a} and ${b} discover they were each other's biggest misread all season. "I had you completely wrong." "Yeah. Same." They laugh about it now.`,
    ] },
    talk: { badge: venue === 'jury' ? 'GAME TALK' : 'WAR COUNCIL', cls: 'gold', delta: 0, pool: venue === 'jury' ? [
      (a, b) => `${a} and ${b} sprawl by ${V.spot} comparing reads on the finale. The picture of who deserves it gets sharper — and thornier.`,
      (a, b) => `${a} walks ${b} through the vote that got ${P(a).obj} out, beat by beat. ${b} spots a read ${a} missed.`,
      (a, b) => `${a} and ${b} argue for an hour over which finalist has the real winner's résumé. Neither budges; both take notes for the jury vote.`,
      (a, b) => `${a} and ${b} rank the whole cast worst-to-first over cold coffee. It gets heated. It gets honest. It gets personal.`,
    ] : [
      (a, b) => `${a} and ${b} whisper by ${V.spot} about the return — who's the one to beat, whether to work together or cut each other's throats. No deal yet. Just circling.`,
      (a, b) => `${a} floats a comeback pact to ${b}: back each other if they both make it in. ${b} nods slow. In here, even a handshake has a catch.`,
      (a, b) => `${a} and ${b} war-game the return challenge — who's fast, who's fading, who to target first if they both get back. Cold-blooded, and a little thrilling.`,
      (a, b) => `${a} sizes ${b} up over the fire, half-friendly. "If it's you and me at the end of that challenge, no hard feelings?" ${b} smiles. Doesn't answer.`,
    ] },
  };

  const colorBeats = { a1: [], a2: [], a4: [] };
  const catUsage = {};
  const soloKeys = Object.keys(SOLO);
  const soloFor = (n, act) => {
    const opts = soloKeys.filter(k => !SOLO[k].need || SOLO[k].need(n)).map(k => ({ k, arg: SOLO[k].need ? SOLO[k].need(n) : undefined }));
    if (!opts.length) opts.push({ k: soloKeys[0] });
    opts.sort((x, y) => ((catUsage[x.k] || 0)) - ((catUsage[y.k] || 0)) || Math.random() - 0.5);
    const pick = opts[0]; catUsage[pick.k] = (catUsage[pick.k] || 0) + 1;
    const def = SOLO[pick.k];
    colorBeats[act].push(beat(def.badge, def.cls, [n], draw(def.pool, n, pick.arg)));
  };
  // every un-storylined resident gets a solo beat; distribute across acts
  const uncovered = shuffle(residents.filter(n => !featured.has(n)));
  uncovered.forEach((n, i) => soloFor(n, i % 3 === 0 ? 'a1' : i % 3 === 1 ? 'a2' : 'a4'));
  // give a handful of residents a SECOND beat so acts stay full (bigger casts = more)
  shuffle(residents).slice(0, Math.max(2, Math.round(residents.length / 2))).forEach((n, i) => soloFor(n, i % 2 === 0 ? 'a2' : 'a4'));

  // pair color beats spread across acts (scale with cast)
  const usedPairs = new Set();
  const pairTarget = Math.max(2, Math.floor(residents.length / 2));
  for (let k = 0, g = 0; k < pairTarget && g < 60; g++) {
    const a = residents[Math.floor(Math.random() * residents.length)];
    const b = residents.filter(n => n !== a)[Math.floor(Math.random() * (residents.length - 1))];
    if (!a || !b) break; const key = [a, b].sort().join('|');
    if (usedPairs.has(key)) continue; usedPairs.add(key); k++;
    const bd = getBond(a, b);
    const kind = (bd > -2) ? 'bond' : 'talk';
    const def = PAIR[kind];
    colorBeats[k % 2 === 0 ? 'a2' : 'a1'].push(beat(def.badge, def.cls, [a, b], draw(def.pool, a, b), def.delta));
    if (def.delta) addBond(a, b, def.delta);
  }

  // ── CONFESSIONALS — to-camera voice, the show's signature. One per act (1/2/4). ──
  const CONF = venue === 'rescue' ? [
    (n) => `<b>${n}, confessional:</b> "People think getting voted out is the hard part. Nah. The hard part is out here, every day, staring at the one door back in — and knowing everybody around that fire wants it as bad as I do."`,
    (n) => `<b>${n}, confessional:</b> "I'm not here to make friends. I made that mistake the first time. This time I train, I watch, and when that return challenge drops, I'm walking back into that game and finishing what I started."`,
    (n) => `<b>${n}, confessional:</b> "Funny thing about this place — it strips the game away and you finally see who people really are. Which is exactly the intel I'll need when one of us claws back in."`,
    (n) => `<b>${n}, confessional:</b> "Every rep, every fish, every night I don't quit — that's me buying a ticket. I got sent here to disappear. I'm gonna use it to come back scarier."`,
  ] : [
    (n) => `<b>${n}, confessional:</b> "For nine weeks this game was my whole life. Now I'm sitting in a motel with the people who took it from me. And the wild part? I've got one thing left — my vote — and I plan to make it count."`,
    (n) => `<b>${n}, confessional:</b> "You'd think out here we'd all be at each other's throats. Some of us are. But some of us are becoming friends I never would've made inside the game. The mask comes off once there's nothing left to win."`,
    (n) => `<b>${n}, confessional:</b> "I keep replaying my vote-out. Everybody says let it go. But that jury seat is the last power I've got, and I'm not spending it on somebody who lied to my face and smiled."`,
    (n) => `<b>${n}, confessional:</b> "The finale's coming and we all know it. So yeah — I'm watching every move those finalists make on the feeds. When I get to that seat, I want to know exactly who earned it."`,
  ];
  const confActs = ['a1', 'a2', 'a4'];
  const confVoices = shuffle(residents);
  confActs.forEach((act, i) => {
    const voice = confVoices[i % confVoices.length];
    if (voice) colorBeats[act].push(beat('CONFESSIONAL', '', [voice], draw(CONF, voice)));
  });

  // ── group setpieces (act 2 + a lighter one in act 4) — mode-specific shared scenes ──
  const cast3 = shuffle(residents).slice(0, Math.min(3, residents.length));
  if (cast3.length >= 3) {
    const GROUP = venue === 'jury' ? [
      () => `${cast3[0]} appoints ${P(cast3[0]).ref} activities director and railroads ${V.home} into water aerobics. ${cast3[1]} threatens to "set ${P(cast3[1]).ref} aflame" if there's one more shuffleboard round. ${cast3[2]} is, inexplicably, having the time of ${P(cast3[2]).posAdj} life.`,
      () => `Bingo night turns cutthroat. ${cast3[0]} calls the numbers, ${cast3[1]} accuses ${P(cast3[0]).obj} of rigging it, and ${cast3[2]} wins on a card ${P(cast3[2]).sub} swears ${P(cast3[2]).sub} ${P(cast3[2]).sub === 'they' ? "weren't" : "wasn't"} even watching.`,
      () => `Someone digs up a guitar and ${cast3[0]} turns out to actually play. ${cast3[1]} and ${cast3[2]} drift over, and for one night the lounge sounds less like a waiting room and more like a home.`,
    ] : [
      () => `A raid on the wrecked supply crate turns up a cooler of food and — of all things — a guitar. ${cast3[0]} hauls it back and camp goes feral over real coffee while ${cast3[1]} and ${cast3[2]} bicker over first cup.`,
      () => `${cast3[0]} coaxes the fire alive against the wind and camp huddles close. ${cast3[1]} tells a story, ${cast3[2]} caps it with the worst possible ending, and for a while nobody's thinking about the return.`,
      () => `Fishing goes sideways when ${cast3[0]} hooks something huge and ${cast3[1]} and ${cast3[2]} pile on to help. They lose the fish, keep the story, eat coconut again — but together.`,
    ];
    colorBeats.a2.push(beat(venue === 'jury' ? 'MOTEL LIFE' : 'CAMP LIFE', 'gold', cast3, draw(GROUP)));
    for (let i = 0; i < cast3.length; i++) for (let j = i + 1; j < cast3.length; j++) addBond(cast3[i], cast3[j], 0.4);
  }
  // second, quieter setpiece — a nightfall gathering (act 4)
  const castN = shuffle(residents).slice(0, Math.min(3, residents.length));
  if (castN.length >= 3) {
    const NIGHT = venue === 'jury' ? [
      () => `Last night in the motel, the whole house piles onto the pool deck with whatever ${castN[0]} found in the mini-fridge. Old grudges, new friendships, one shared truth: nobody in here is walking away the same. ${castN[1]} makes a toast. ${castN[2]} pretends not to cry.`,
      () => `${castN[0]} digs out a deck of cards and the whole house crowds around for one loud, stupid, wonderful game that runs till 3 a.m. For one night, ${castN[1]} and ${castN[2]} forget they're the ones the game threw away.`,
    ] : [
      () => `The storm's passed, and the whole camp crowds the fire to dry out. ${castN[0]} rations the last of the coffee, ${castN[1]} strums the salvaged guitar, and ${castN[2]} says what everyone's thinking: "Whatever happens at that challenge — we survived THIS. That's ours."`,
      () => `Under a clear sky at last, ${castN[0]}, ${castN[1]}, and ${castN[2]} sit shoulder to shoulder counting stars and rivals in the same breath. Tomorrow they compete. Tonight they're just ${residents.length} people the game couldn't quite finish off.`,
    ];
    colorBeats.a4.push(beat(venue === 'jury' ? 'ONE LAST NIGHT' : 'BY THE FIRE', 'gold', castN, draw(NIGHT)));
    for (let i = 0; i < castN.length; i++) for (let j = i + 1; j < castN.length; j++) addBond(castN[i], castN[j], 0.3);
  }

  // ── ARRIVALS (act 1) for anyone eliminated last episode ──
  const arrivals = residents.filter(n => elimInfo(n).epsSince <= 1).slice(0, 2);
  const arrivalBeats = arrivals.map(n => {
    const o = residents.find(r => r !== n && getBond(n, r) >= 3);
    return beat('NEW ARRIVAL', 'green', [n, o].filter(Boolean), draw([
      (x) => o ? `${x} trudges in off the boat and ${o} is up before the door shuts — a hug that lasts a beat too long. "You made it. Finally, someone I actually like."` : `${x} trudges in off the boat, still raw. The others don't push — they just make room by ${V.spot} and hand ${P(x).obj} a plate.`,
    ], n));
  });

  // ────────────────────────────────────────────────────────────
  // ASSEMBLE ACTS
  // ────────────────────────────────────────────────────────────
  const titles = venue === 'jury'
    ? { a1: 'Checking In', a2: 'The Long Days', a3: 'The Roundtable', a4: 'Before the Finale' }
    : { a1: 'Washed Ashore', a2: 'Life on the Island', a3: 'The Storm', a4: 'Nightfall' };
  const acts = [];
  const pushAct = (key, extra = []) => {
    const beats = [...extra, ...S[key], ...(colorBeats[key] || [])].filter(Boolean);
    if (beats.length) acts.push({ title: titles[key], beats });
  };
  pushAct('a1', arrivalBeats);
  pushAct('a2');
  // act 3 centerpiece (rescue storm beats live in S.a3; jury roundtable rendered from `roundtable`)
  if (venue === 'rescue') pushAct('a3');
  else if (roundtable) acts.push({ title: titles.a3, beats: [], roundtable });
  pushAct('a4');

  // guarantee every resident appears at least once — append a quick beat for stragglers to act 4
  const strays = residents.filter(n => !appeared[n]);
  if (strays.length) {
    const extra = strays.map(n => beat(venue === 'jury' ? 'SETTLING IN' : 'HOLDING ON', 'iron', [n], draw([
      (x) => venue === 'jury'
        ? `${x} finds a quiet corner of ${V.home} and, for the first time since the vote, actually exhales.`
        : `${x} banks the fire and takes the first watch, jaw set against the dark. "One more day closer to getting back in."`,
    ], n)));
    const last = acts[acts.length - 1];
    if (last && last.beats) last.beats.push(...extra); else acts.push({ title: titles.a4, beats: extra });
  }

  const teaser = draw([
    () => venue === 'jury'
      ? `That night the host gathers the lounge: "Rest up. Soon, two of you get a shot to fight your way back in." The room lights up with old fire.`
      : `The host sails out with a promise: two of them get one chance at the return challenge. Camp buzzes; every eye sharpens on the horizon.`,
    () => `Before lights out, word comes down — a return challenge is coming, and not everyone gets a seat. Alliances that died in the game flicker back to life.`,
    () => `A warning wrapped in a promise: "Stay sharp. A door back into this game is about to crack open." Nobody sleeps much after that.`,
  ]);

  const events = acts.flatMap(a => a.beats);
  ep.interlude = { venue, residents, acts, events, roundtable, teaser, epNum };
  ep.juryHouse = ep.interlude; // legacy alias
}

// Back-compat wrapper (episode.js / tests may import the old name).
export function generateJuryHouseLife(ep) { return generateInterludeLife(ep); }
