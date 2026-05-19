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

// ══════════════════════════════════════════════════════════════════════
// EXCHANGE POOL — multi-beat duel system
// ══════════════════════════════════════════════════════════════════════

const EXCHANGE_POOL = [
  { id: 'grit',      name: 'Grit',      primary: 'physical',  secondary: 'endurance' },
  { id: 'precision', name: 'Precision', primary: 'mental',    secondary: 'temperament' },
  { id: 'instinct',  name: 'Instinct',  primary: 'intuition', secondary: 'boldness' },
  { id: 'willpower', name: 'Willpower', primary: 'endurance', secondary: 'loyalty' },
  { id: 'cunning',   name: 'Cunning',   primary: 'strategic', secondary: 'social' },
];

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
// NARRATION — exchange-level text generation
// ══════════════════════════════════════════════════════════════════════

function _exchangeNarration(exchangeId, winnerName, loserName, margin, isThreeWay) {
  const prW = pronouns(winnerName);
  const prL = pronouns(loserName);
  const dominant = margin >= 2.5;

  const narr = {
    grit: {
      winDom: [
        `${winnerName} powers through with raw force. ${loserName} can't match the intensity.`,
        `Pure physicality from ${winnerName}. ${prW.Sub} grind${prW.sub==='they'?'':'s'} ${loserName} into the dirt.`,
        `${winnerName} digs deeper than anyone thought possible. ${loserName} has no answer.`,
        `${winnerName} makes it look effortless — ${loserName} is left gasping.`,
      ],
      winClose: [
        `${winnerName} edges out ${loserName} by sheer willpower. Both are spent.`,
        `A war of attrition. ${winnerName} survives it. Barely.`,
        `${winnerName} and ${loserName} go blow for blow — ${winnerName} lands the last one.`,
        `Neck and neck the whole way. ${winnerName} finds one more gear at the end.`,
      ],
      loseHard: [
        `${loserName} fights until ${prL.pos} body gives out. No quit in ${prL.obj} — but no win either.`,
        `${loserName} goes down swinging. ${prL.Sub} gave everything and it wasn't enough.`,
        `A valiant effort from ${loserName}, but ${winnerName} is simply stronger today.`,
        `${loserName} refuses to stop. ${prL.Pos} legs give out before ${prL.pos} will does.`,
      ],
      loseCollapse: [
        `${loserName} fades fast. The island has taken too much.`,
        `${loserName} can't keep up. ${prL.Sub} know${prL.sub==='they'?'':'s'} it early and it shows.`,
        `${loserName} stumbles out of the gate and never recovers.`,
        `The fire is gone from ${loserName}. ${prL.Sub} go${prL.sub==='they'?'':'es'} through the motions.`,
      ],
    },
    precision: {
      winDom: [
        `${winnerName} is surgical. Every move calculated. ${loserName} can't keep pace mentally.`,
        `${winnerName} locks in with terrifying focus. ${loserName} second-guesses and pays for it.`,
        `Precision personified. ${winnerName} barely blinks while ${loserName} scrambles.`,
        `${winnerName} treats it like a chess match — and ${loserName} is three moves behind.`,
      ],
      winClose: [
        `Both razor-sharp, but ${winnerName} makes one fewer mistake than ${loserName}.`,
        `${winnerName} stays composed when it matters most. ${loserName} flinches first.`,
        `A battle of minds. ${winnerName} finds the edge by a hair.`,
        `${loserName} nearly has it. Nearly. ${winnerName} doesn't deal in nearly.`,
      ],
      loseHard: [
        `${loserName} solves it clean but ${winnerName} is just faster. Nothing to be ashamed of.`,
        `${loserName} puts up a brilliant fight — just outclassed at the final step.`,
        `${loserName} plays it smart but can't match ${winnerName}'s composure under fire.`,
        `So close for ${loserName}. One wrong read at the wrong moment.`,
      ],
      loseCollapse: [
        `${loserName} panics. Overthinks. Makes mistakes that compound into disaster.`,
        `${loserName}'s hands are shaking before the exchange even starts. It's over quickly.`,
        `${loserName} freezes up. The pressure is too much.`,
        `${loserName} can't focus. The game in ${prL.pos} head is louder than the one in front of ${prL.obj}.`,
      ],
    },
    instinct: {
      winDom: [
        `${winnerName} reads it instantly. ${loserName} is still processing when it's already over.`,
        `Pure instinct from ${winnerName}. ${prW.Sub} move${prW.sub==='they'?'':'s'} before thinking and it's the right call.`,
        `${winnerName} trusts ${prW.pos} gut — and ${prW.pos} gut is never wrong today.`,
        `${winnerName} acts on impulse and it's brilliant. ${loserName} hesitates and it's fatal.`,
      ],
      winClose: [
        `Both go on instinct. ${winnerName}'s instincts are just slightly sharper.`,
        `A coin flip decided by nerve. ${winnerName} doesn't blink.`,
        `${winnerName} and ${loserName} both swing wild — ${winnerName} connects.`,
        `Gut feeling versus gut feeling. ${winnerName}'s wins by a fraction.`,
      ],
      loseHard: [
        `${loserName}'s instincts are good — ${winnerName}'s are just better right now.`,
        `${loserName} makes the bold play. It almost works. Almost.`,
        `${loserName} reads it right but reacts a beat too slow.`,
        `${loserName} trusts ${prL.pos} read and it's not wrong — it's just not enough.`,
      ],
      loseCollapse: [
        `${loserName} second-guesses every impulse. Paralyzed by options.`,
        `${loserName} overthinks it into oblivion. Instinct abandoned, nothing left.`,
        `${loserName} looks lost. No read, no plan, no chance.`,
        `${loserName} goes against ${prL.pos} gut and pays the price immediately.`,
      ],
    },
    willpower: {
      winDom: [
        `${winnerName} refuses to break. ${loserName} watches the resolve and knows it's unbeatable.`,
        `Iron will from ${winnerName}. ${prW.Sub} would rather collapse than lose. ${loserName} can see it.`,
        `${winnerName} endures what shouldn't be endurable. ${loserName} has no answer for that.`,
        `${winnerName} sets ${prW.pos} jaw and wills it into existence. ${loserName} can't match that energy.`,
      ],
      winClose: [
        `Both refuse to quit. ${winnerName} simply refuses a tiny bit harder.`,
        `Willpower against willpower. ${winnerName} outlasts ${loserName} by a breath.`,
        `${winnerName} finds something deep when it looks like ${prW.sub}'ll break. ${loserName} can't find the same.`,
        `A test of pure determination. ${winnerName} passes. ${loserName} fails — barely.`,
      ],
      loseHard: [
        `${loserName} doesn't quit. ${prL.Sub} just run${prL.sub==='they'?'':'s'} out of road.`,
        `${loserName} gives everything. But everything isn't enough against ${winnerName} today.`,
        `${loserName} holds on longer than anyone expected. Just not long enough.`,
        `${loserName}'s will is strong. ${winnerName}'s is stronger.`,
      ],
      loseCollapse: [
        `${loserName} breaks early. The island has worn ${prL.obj} down to nothing.`,
        `${loserName} gives up before ${prL.pos} body does. The fight left days ago.`,
        `There's nothing left in ${loserName}'s tank. ${prL.Sub} know${prL.sub==='they'?'':'s'} it. Everyone knows it.`,
        `${loserName} mouths "I'm done" before the exchange is half over.`,
      ],
    },
    cunning: {
      winDom: [
        `${winnerName} plays ${loserName} like a fiddle. Feints, misdirection, and a clean finish.`,
        `${winnerName} outmaneuvers ${loserName} at every turn. It's strategy, not strength.`,
        `${winnerName} sees three steps ahead. ${loserName} is still on step one.`,
        `Masterclass in game reading from ${winnerName}. ${loserName} never stood a chance.`,
      ],
      winClose: [
        `A chess match between equals. ${winnerName} finds the one opening ${loserName} leaves.`,
        `Both playing mind games. ${winnerName} wins the final bluff.`,
        `${winnerName} and ${loserName} trade moves — ${winnerName} makes the last smart one.`,
        `Cunning meets cunning. ${winnerName} edges it by reading ${loserName}'s tell.`,
      ],
      loseHard: [
        `${loserName} plays it smart — just runs into someone smarter today.`,
        `${loserName}'s strategy is sound. ${winnerName}'s is just more ruthless.`,
        `${loserName} tries to outthink ${winnerName} and nearly pulls it off.`,
        `${loserName} reads the board well. ${winnerName} reads it better.`,
      ],
      loseCollapse: [
        `${loserName} tries to get clever and outsmarts ${prL.ref}. Badly.`,
        `${loserName}'s plan falls apart on contact. No backup. No recovery.`,
        `${loserName} overthinks it into a corner and can't escape.`,
        `${loserName} has no read on ${winnerName}. Playing blind.`,
      ],
    },
  };

  const pool = narr[exchangeId];
  if (!pool) return `${winnerName} takes the exchange from ${loserName}.`;

  if (dominant) return _pick(pool.winDom);
  if (margin >= 0.5) return _pick(pool.winClose);
  // From loser's perspective for flavor variety
  if (margin >= 1.5) return _pick(pool.loseCollapse);
  return _pick(pool.loseHard);
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
// MULTI-BEAT DUEL ENGINE
// ══════════════════════════════════════════════════════════════════════

function _runExchanges(duelists, numExchanges) {
  // Pick unique exchanges
  const shuffled = _shuffle(EXCHANGE_POOL);
  const chosen = shuffled.slice(0, Math.min(numExchanges, EXCHANGE_POOL.length));

  // Fill extra if needed (shouldn't happen with 5 exchanges and 5 pool entries, but safe)
  while (chosen.length < numExchanges) {
    chosen.push(_pick(EXCHANGE_POOL));
  }

  const momentum = {};
  duelists.forEach(n => { momentum[n] = 0; });

  const exchanges = [];

  for (const ex of chosen) {
    const scores = {};
    duelists.forEach(name => {
      const s = pStats(name);
      const primaryVal = s[ex.primary] + _getTrainingBonus(name, ex.primary);
      const secondaryVal = s[ex.secondary] + _getTrainingBonus(name, ex.secondary);
      const mentalState = _getMentalState(name);
      const mentalBonus = mentalState === 'obsessed' ? 0.5 : mentalState === 'broken' ? -0.5 : 0;
      scores[name] = primaryVal * 0.6 + secondaryVal * 0.4 + _noise(2.5) + (momentum[name] || 0) + mentalBonus;
    });

    // Determine winner and margin
    const sorted = duelists.slice().sort((a, b) => scores[b] - scores[a]);
    const winner = sorted[0];
    const runnerUp = sorted[1];
    const margin = scores[winner] - scores[runnerUp];

    // Narration — for 2-way, show winner vs loser. For 3+ way, show winner vs last place.
    const lastPlace = sorted[sorted.length - 1];
    const narration = _exchangeNarration(ex.id, winner, lastPlace, margin, duelists.length > 2);

    exchanges.push({
      id: ex.id,
      name: ex.name,
      scores: { ...scores },
      winner,
      margin: Math.round(margin * 100) / 100,
      narration,
    });

    // Update momentum: winner gets +0.5, others reset to 0
    duelists.forEach(n => { momentum[n] = n === winner ? 0.5 : 0; });
  }

  return exchanges;
}

function _resolveExchanges(duelists, exchanges) {
  // Count exchange wins per player
  const wins = {};
  duelists.forEach(n => { wins[n] = 0; });
  exchanges.forEach(ex => { wins[ex.winner] = (wins[ex.winner] || 0) + 1; });

  // For 2-player: best of N
  if (duelists.length === 2) {
    const [a, b] = duelists;
    if (wins[a] !== wins[b]) {
      const winner = wins[a] > wins[b] ? a : b;
      const loser = winner === a ? b : a;
      return { winner, loser, tiebreaker: null };
    }
    // Tiebreaker
    const tbStat = _pick(VALID_STATS);
    const tbScores = {};
    duelists.forEach(name => {
      const s = pStats(name);
      tbScores[name] = s[tbStat] + _getTrainingBonus(name, tbStat) + _noise(3.5);
    });
    const tbWinner = tbScores[a] >= tbScores[b] ? a : b;
    const tbLoser = tbWinner === a ? b : a;
    return {
      winner: tbWinner,
      loser: tbLoser,
      tiebreaker: { stat: tbStat, scores: { ...tbScores }, winner: tbWinner },
    };
  }

  // For 3+ players: most exchange losses = loser. All others survive.
  const losses = {};
  duelists.forEach(n => { losses[n] = 0; });
  exchanges.forEach(ex => {
    // Last place in each exchange gets a loss
    const sorted = duelists.slice().sort((a, b) => ex.scores[b] - ex.scores[a]);
    losses[sorted[sorted.length - 1]] = (losses[sorted[sorted.length - 1]] || 0) + 1;
  });

  // Most losses = eliminated. Tiebreak: lowest total score across all exchanges.
  const maxLosses = Math.max(...Object.values(losses));
  const lossCandidates = duelists.filter(n => losses[n] === maxLosses);

  let loser;
  if (lossCandidates.length === 1) {
    loser = lossCandidates[0];
  } else {
    // Tiebreak by total score (lowest eliminated)
    const totals = {};
    lossCandidates.forEach(n => {
      totals[n] = exchanges.reduce((sum, ex) => sum + (ex.scores[n] || 0), 0);
    });
    loser = lossCandidates.sort((a, b) => totals[a] - totals[b])[0];
  }

  const winner = duelists.slice().sort((a, b) => {
    const wA = exchanges.filter(ex => ex.winner === a).length;
    const wB = exchanges.filter(ex => ex.winner === b).length;
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
  // Pick a random legacy challenge for backward-compat labels
  const challenge = RI_DUEL_CHALLENGES[Math.floor(Math.random() * RI_DUEL_CHALLENGES.length)];

  // Init tracking if needed
  if (!gs.riWinStreak) gs.riWinStreak = {};
  if (!gs.riMentalState) gs.riMentalState = {};
  if (!gs.riTraining) gs.riTraining = {};

  const duelists = [...riPlayers];
  const isThreeWay = duelists.length >= 3;

  // Run 3-exchange duel
  const exchanges = _runExchanges(duelists, 3);
  const { winner, loser, tiebreaker } = _resolveExchanges(duelists, exchanges);
  const survivors = duelists.filter(n => n !== loser);

  // Update win streaks
  gs.riWinStreak[winner] = (gs.riWinStreak[winner] || 0) + 1;
  delete gs.riWinStreak[loser];

  // Clear mental state + training for eliminated player
  if (gs.riMentalState[loser]) delete gs.riMentalState[loser];
  if (gs.riTraining[loser]) delete gs.riTraining[loser];

  const streakData = {};
  duelists.forEach(n => {
    if (gs.riWinStreak[n]) streakData[n] = gs.riWinStreak[n];
  });

  return {
    winner, loser, survivors,
    challengeType: challenge.id, challengeLabel: challenge.name, challengeDesc: challenge.desc,
    isThreeWay, duelists,
    exchanges,
    tiebreaker,
    streakData,
  };
}

export function simulateRIReentry(riPlayers) {
  // Pick a random legacy challenge for backward-compat labels
  const challenge = RI_DUEL_CHALLENGES[Math.floor(Math.random() * RI_DUEL_CHALLENGES.length)];

  // Init tracking if needed
  if (!gs.riWinStreak) gs.riWinStreak = {};
  if (!gs.riMentalState) gs.riMentalState = {};
  if (!gs.riTraining) gs.riTraining = {};

  const duelists = [...riPlayers];

  // 5-exchange return challenge
  const exchanges = _runExchanges(duelists, 5);

  // For reentry: top scorer wins, everyone else loses
  const totalScores = {};
  duelists.forEach(n => {
    totalScores[n] = exchanges.reduce((sum, ex) => sum + (ex.scores[n] || 0), 0);
  });
  const sorted = duelists.slice().sort((a, b) => totalScores[b] - totalScores[a]);
  const winner = sorted[0];
  const losers = sorted.slice(1);

  // Check for tiebreaker if top 2 are within 0.5
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
      // Tiebreaker overturned the result
      const newWinner = tbWinner;
      const newLosers = duelists.filter(n => n !== newWinner);
      tiebreaker = { stat: tbStat, scores: { ...tbScores }, winner: newWinner };
      // Clean up streaks for all losers
      newLosers.forEach(n => { delete gs.riWinStreak[n]; delete gs.riMentalState[n]; delete gs.riTraining[n]; });
      const streakData = {};
      if (gs.riWinStreak[newWinner]) streakData[newWinner] = gs.riWinStreak[newWinner];
      return {
        winner: newWinner, losers: newLosers,
        challengeType: challenge.id, challengeLabel: challenge.name,
        duelists, exchanges, tiebreaker, streakData,
      };
    }
    tiebreaker = { stat: tbStat, scores: { ...tbScores }, winner };
  }

  // Clean up streaks for losers
  losers.forEach(n => { delete gs.riWinStreak[n]; delete gs.riMentalState[n]; delete gs.riTraining[n]; });

  const streakData = {};
  if (gs.riWinStreak[winner]) streakData[winner] = gs.riWinStreak[winner];

  return {
    winner, losers,
    challengeType: challenge.id, challengeLabel: challenge.name,
    duelists, exchanges, tiebreaker, streakData,
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

  // ── Pre-duel events (2+ residents) ──
  if (riList.length >= 2) {
    const preDuelPool = [];
    for (let i = 0; i < riList.length; i++) {
      for (let j = i + 1; j < riList.length; j++) {
        const a = riList[i], b = riList[j];
        const prA = pronouns(a), prB = pronouns(b);
        const bond = getBond(a, b);
        const sameHistory = gs.episodeHistory.some(h => (h.tribesAtStart||[]).some(t => t.members.includes(a) && t.members.includes(b)));
        if (sameHistory) preDuelPool.push({ type: 'history', text: `${a} and ${b} were on the same tribe. The awkwardness is thick.`, player: a, player2: b });
        if (bond <= -2) preDuelPool.push({ type: 'enemy-arrives', text: `${a} and ${b} locked eyes. This is personal.`, player: a, player2: b });
        if (bond >= 3) preDuelPool.push({ type: 'ally-arrives', text: `${a} and ${b} share a look. They know — only one can stay.`, player: a, player2: b });

        // Streak intimidation — if one player has 3+ wins
        const streakA = gs.riWinStreak[a] || 0;
        const streakB = gs.riWinStreak[b] || 0;
        if (streakA >= 3) {
          preDuelPool.push({ type: 'intimidation', text: `${a} has won ${streakA} duels in a row. ${b} can see it in ${pronouns(a).pos} posture — ${a} expects to win again.`, player: a, player2: b });
        }
        if (streakB >= 3) {
          preDuelPool.push({ type: 'intimidation', text: `${b} has won ${streakB} duels in a row. ${a} can see it in ${pronouns(b).pos} posture — ${b} expects to win again.`, player: b, player2: a });
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
        preDuelPool.push({ type: 'sizing-up', text: `${resident} watches ${arrival} walk onto the beach. ${prR.Sub} know${prR.sub==='they'?'':'s'} what this means.`, player: resident, player2: arrival });
      });
      if (arrStats.boldness >= 7 && existingRes.length > 0) {
        const target = existingRes[0];
        preDuelPool.push({ type: 'trash-talk', text: `${arrival} tells ${target} exactly how this is going to go. ${target} says nothing. Just stares.`, player: arrival, player2: target });
      }
    });

    if (!preDuelPool.length && riList.length >= 2) {
      const [a, b] = riList;
      preDuelPool.push({ type: 'sizing-up', text: `${a} and ${b} size each other up. The duel is coming.`, player: a, player2: b });
    }

    // Pick 1-2 events
    if (preDuelPool.length) {
      const hash = riList.reduce((s, n) => s + [...n].reduce((ss, c) => ss + c.charCodeAt(0), 0), 0) + epNum;
      const ev1 = preDuelPool[hash % preDuelPool.length];
      pushEvt({ ep: epNum, text: ev1.text, type: ev1.type, player: ev1.player, player2: ev1.player2 });

      if (preDuelPool.length > 1 && Math.random() < 0.5) {
        const ev2 = preDuelPool[(hash + 1) % preDuelPool.length];
        if (ev2.type !== ev1.type || ev2.player !== ev1.player) {
          pushEvt({ ep: epNum, text: ev2.text, type: ev2.type, player: ev2.player, player2: ev2.player2 });
        }
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
      if (s.boldness <= 3 && daysOn >= 3 && (emotional === 'desperate' || mentalState === 'broken')) {
        pool.push({ weight: 4, type: 'quit-temptation', player: name,
          text: `${name} stares at the path off the island for a long time today.`,
          quitChance: 0.15 + mentalQuitBoost });
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
