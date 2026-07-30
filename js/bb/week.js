// Headless Big Brother week engine: a run of acts, one eviction.
//
// Built like a Total Drama episode rather than a calendar. Acts are what the VP
// renders and what events hang off; the day numbers were scaffolding sitting on
// top of acts that already existed. The campaign carries a VARIABLE number of
// beats, the way a challenge fires a variable number of social events between
// its phases.
import { gs } from '../core.js';
import { pStats } from '../players.js';
import { addBond } from '../bonds.js';
import {
  campaignAttempt, chooseNominationPlan, chooseReplacement, initialVotePreference,
  shouldThrowHoh, shouldUseVeto,
} from './strategy.js';
import { scheduleHouseBeats } from './house-events.js';

function hook(hooks, name, value, context) {
  const result = hooks?.[name]?.(value, context);
  return result === undefined ? value : result;
}

function compScore(name, type, rng) {
  const stats = pStats(name);
  const base = type === 'hoh'
    ? stats.mental * 0.28 + stats.endurance * 0.25 + stats.physical * 0.18 + stats.intuition * 0.16 + stats.boldness * 0.13
    : stats.mental * 0.26 + stats.physical * 0.24 + stats.endurance * 0.22 + stats.intuition * 0.16 + stats.strategic * 0.12;
  return base + rng() * 5;
}

function runComp(participants, type, rng, house) {
  return participants.map(name => {
    let score = compScore(name, type, rng);
    let threw = false;
    if (type === 'hoh') {
      const throwRead = shouldThrowHoh(name, house);
      threw = rng() < throwRead.throwChance;
      if (threw) score *= 0.35 + rng() * 0.25;
    }
    return { name, score, threw };
  }).sort((a, b) => b.score - a.score);
}

function ensureBBState() {
  gs.bb ||= {};
  gs.bb.outgoingHoh ??= null;
  gs.bb.weeks ||= [];
  gs.bb.stats ||= {};
  gs.eliminated ||= [];
  for (const name of gs.activePlayers || []) {
    gs.bb.stats[name] ||= { hohWins: 0, vetoWins: 0, timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 };
    gs.bb.stats[name].timesOnTheBlock ||= 0;
  }
}

function chooseVetoPlayers(house, hoh, nominees, rng) {
  const automatic = [hoh, ...nominees];
  const pool = house.filter(name => !automatic.includes(name));
  while (automatic.length < Math.min(6, house.length) && pool.length) {
    automatic.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return automatic;
}

function tally(ballots, nominees) {
  const counts = Object.fromEntries(nominees.map(name => [name, 0]));
  ballots.forEach(ballot => { if (ballot.evict in counts) counts[ballot.evict]++; });
  return counts;
}

export function simulateBBWeek(options = {}) {
  const rng = options.rng || Math.random;
  const hooks = options.hooks || {};
  const house = [...(options.house || gs.activePlayers || [])];
  if (house.length < 4) throw new Error('The standard Big Brother week engine requires at least four houseguests.');
  ensureBBState();
  const week = { num: gs.bb.weeks.length + 1, format: 'big-brother', acts: [], houseAtStart: house };
  const eventLibrary = options.houseEvents || [];
  const addBeats = (act, extra = {}) => {
    act.socialBeats = scheduleHouseBeats(eventLibrary, house, {
      act: act.type, hoh: week.hoh, nominees: extra.nominees || week.finalNominees || week.initialNominees || [],
      vetoWinner: week.vetoWinner || null, week, ...extra,
    }, { rng, min: eventLibrary.length ? 1 : 0, max: eventLibrary.length ? 3 : 0 });
    return act;
  };

  // HOH act and the first scramble.
  const hohPlayers = house.filter(name => name !== gs.bb.outgoingHoh);
  const hohResults = runComp(hohPlayers, 'hoh', rng, house);
  let hoh = hook(hooks, 'hohResult', hohResults[0].name, { week, results: hohResults, house });
  if (!hohPlayers.includes(hoh)) hoh = hohResults[0].name;
  week.hoh = hoh;
  gs.bb.stats[hoh].hohWins++;
  week.acts.push(addBeats({ type: 'hoh', winner: hoh, results: hohResults, outgoingHoh: gs.bb.outgoingHoh }));

  // Nomination act — directed power: target, pawn, and an optional backdoor plan.
  let plan = chooseNominationPlan(hoh, house, rng);
  plan = hook(hooks, 'nominationResult', plan, { week, house, hoh }) || plan;
  let nominees = [...new Set(plan.nominees)].filter(name => house.includes(name) && name !== hoh).slice(0, 2);
  if (nominees.length < 2) nominees = chooseNominationPlan(hoh, house, rng).nominees;
  nominees.forEach(name => gs.bb.stats[name].timesNominated++);
  week.initialNominees = [...nominees];
  week.plan = plan;
  week.acts.push(addBeats({ type: 'nominations', nominees: [...nominees], target: plan.target, pawn: plan.pawn, backdoorTarget: plan.backdoorTarget }, { nominees: [...nominees] }));

  // Veto act — player draw, competition, and lobbying.
  let vetoPlayers = chooseVetoPlayers(house, hoh, nominees, rng);
  vetoPlayers = hook(hooks, 'vetoParticipants', vetoPlayers, { week, house, hoh, nominees: [...nominees] }) || vetoPlayers;
  vetoPlayers = [...new Set(vetoPlayers)].filter(name => house.includes(name));
  const vetoResults = runComp(vetoPlayers, 'veto', rng, house);
  let vetoWinner = hook(hooks, 'vetoOutcome', vetoResults[0].name, { week, results: vetoResults, nominees: [...nominees] });
  if (!vetoPlayers.includes(vetoWinner)) vetoWinner = vetoResults[0].name;
  gs.bb.stats[vetoWinner].vetoWins++;
  week.vetoWinner = vetoWinner;
  week.acts.push(addBeats({ type: 'veto', participants: vetoPlayers, winner: vetoWinner, results: vetoResults }, { nominees: [...nominees], vetoWinner }));

  // Veto ceremony and replacement hook (Diamond Veto can intercept it).
  let vetoDecision = shouldUseVeto(vetoWinner, nominees, plan, rng);
  vetoDecision = hook(hooks, 'vetoDecision', vetoDecision, { week, house, hoh, nominees: [...nominees], vetoWinner }) || vetoDecision;
  let replacement = null;
  if (vetoDecision.use && nominees.includes(vetoDecision.save)) {
    const protectedNames = [hoh, vetoWinner, ...nominees.filter(name => name !== vetoDecision.save)];
    replacement = chooseReplacement(hoh, house, protectedNames, plan, rng);
    replacement = hook(hooks, 'replacementChoice', replacement, { week, house, hoh, vetoWinner, saved: vetoDecision.save, protectedNames }) || replacement;
    if (!house.includes(replacement) || protectedNames.includes(replacement)) replacement = chooseReplacement(hoh, house, protectedNames, plan, rng);
    nominees = nominees.map(name => name === vetoDecision.save ? replacement : name);
    gs.bb.stats[vetoDecision.save].timesSaved++;
    gs.bb.stats[replacement].timesNominated++;
  }
  week.finalNominees = [...nominees];
  nominees.forEach(name => gs.bb.stats[name].timesOnTheBlock++);
  week.acts.push(addBeats({ type: 'veto-ceremony', used: !!vetoDecision.use, saved: vetoDecision.save, replacement, nominees: [...nominees] }, { nominees: [...nominees] }));

  // Days 5–6 — votes begin from bonds, then campaigning can visibly move them.
  let voters = house.filter(name => name !== hoh && !nominees.includes(name));
  voters = hook(hooks, 'voteEligibility', voters, { week, house, hoh, nominees: [...nominees] }) || voters;
  voters = [...new Set(voters)].filter(name => house.includes(name) && name !== hoh && !nominees.includes(name));
  const ballots = voters.map(voter => ({ voter, ...initialVotePreference(voter, nominees, rng), changed: false }));
  week.preCampaignVotes = tally(ballots, nominees);
  const campaignActCount = options.campaignActCount || (house.length >= 12 ? 3 : house.length >= 7 ? 2 : 1);
  for (let campaignIndex = 0; campaignIndex < campaignActCount; campaignIndex++) {
    const events = [];
    for (const nominee of nominees) {
      const opponent = nominees.find(name => name !== nominee);
      const targets = ballots
        .filter(ballot => ballot.evict === nominee || ballot.margin < 2.2)
        .sort((a, b) => a.margin - b.margin);
      if (!targets.length) continue;
      const target = targets[Math.floor(rng() * Math.min(3, targets.length))];
      const attempt = campaignAttempt(nominee, target.voter, opponent, rng);
      if (attempt.success && target.evict === nominee) {
        target.evict = opponent;
        target.changed = true;
        target.changedBy = nominee;
        addBond(nominee, target.voter, 0.35);
      } else if (!attempt.success) {
        addBond(nominee, target.voter, -0.15);
      }
      events.push(attempt);
    }
    week.acts.push(addBeats({ type: 'campaign', campaignIndex, events, votesAfterAct: tally(ballots, nominees) }, { nominees: [...nominees], ballots }));
  }

  // Eviction act; HOH breaks a tie.
  const votes = tally(ballots, nominees);
  let evicted;
  let tieBreak = null;
  if (votes[nominees[0]] === votes[nominees[1]]) {
    const preference = initialVotePreference(hoh, nominees, rng);
    evicted = preference.evict;
    tieBreak = { voter: hoh, evict: evicted };
  } else {
    evicted = votes[nominees[0]] > votes[nominees[1]] ? nominees[0] : nominees[1];
  }
  evicted = hook(hooks, 'evictionResult', evicted, { week, house, hoh, nominees: [...nominees], ballots, votes, tieBreak }) || evicted;
  if (!nominees.includes(evicted)) evicted = votes[nominees[0]] >= votes[nominees[1]] ? nominees[0] : nominees[1];
  week.evicted = evicted;
  week.votes = votes;
  week.ballots = ballots;
  week.tieBreak = tieBreak;
  week.voteChanges = ballots.filter(ballot => ballot.changed).length;
  week.acts.push({ type: 'eviction', nominees: [...nominees], ballots, votes, tieBreak, evicted, socialBeats: [] });

  gs.activePlayers = house.filter(name => name !== evicted);
  if (!gs.eliminated.includes(evicted)) gs.eliminated.push(evicted);
  gs.bb.outgoingHoh = hoh;
  gs.bb.weeks.push(week);
  gs.episode = (gs.episode || 0) + 1;
  return week;
}

export function simulateBBSeason(options = {}) {
  const weeks = [];
  const finaleSize = options.finaleSize || 3;
  while ((gs.activePlayers || []).length > finaleSize) {
    weeks.push(simulateBBWeek(options));
  }
  return { weeks, finalists: [...gs.activePlayers] };
}
