// Headless Big Brother week engine: a run of acts, one eviction.
//
// Built like a Total Drama episode rather than a calendar. Acts are what the VP
// renders and what events hang off; the day numbers were scaffolding sitting on
// top of acts that already existed. The campaign carries a VARIABLE number of
// beats, the way a challenge fires a variable number of social events between
// its phases.
import { gs, players } from '../core.js';
import { pStats } from '../players.js';
import { getBond } from '../bonds.js';
import { rollDeparture } from '../departures.js';
import {
  chooseNominationPlan, chooseReplacement, initialVotePreference,
  shouldUseVeto,
} from './strategy.js';
import { scheduleHouseBeats } from './house-events.js';
import { runBBCompetition } from './comps.js';
import { resolveBBCampaignAct, settleBBAllianceWeek, updateBBAllianceLifecycle, updateBBPerceptions } from './shared-strategy.js';

function hook(hooks, name, value, context) {
  const result = hooks?.[name]?.(value, context);
  return result === undefined ? value : result;
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

/**
 * Who goes on slop.
 *
 * The Head of Household picks, which is the point of the twist: it is the
 * first thing a new HOH does with power, it is public, and it is remembered.
 * The read is the HOH's own — perceived bond, not real bond — so an HOH can
 * punish somebody who was never actually against them, and take the blame for
 * it either way. Noise keeps it from being a pure enemies list.
 */
function chooseHaveNots(hoh, house, rng, getRead, wanted) {
  const pool = house.filter(name => name !== hoh);
  const auto = Math.max(2, Math.min(4, Math.floor(pool.length / 3)));
  // A fixed count can be asked for, but never more than the house can spare —
  // putting everybody on slop is not a twist, it is a different show.
  const count = Math.min(Number(wanted) > 0 ? Number(wanted) : auto, Math.max(1, pool.length - 1));
  return pool
    .map(name => ({ name, score: (getRead ? getRead(hoh, name) : 0) + (rng() * 4 - 2) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, count)
    .map(entry => entry.name);
}

export function simulateBBWeek(options = {}) {
  const rng = options.rng || Math.random;
  const hooks = options.hooks || {};
  const house = [...(options.house || gs.activePlayers || [])];
  if (house.length < 4) throw new Error('The standard Big Brother week engine requires at least four houseguests.');
  ensureBBState();
  const week = { num: gs.bb.weeks.length + 1, format: 'big-brother', acts: [], houseAtStart: house };

  /**
   * Twists change the SHAPE of a week, not just its numbers.
   *
   * Instant Eviction removes the veto — nominations stand and the house votes
   * the same night. A compressed cycle drops house life entirely and runs one
   * campaign act, which is what the back half of a double eviction is: the
   * same week with no time in it. Everything else is unchanged, so a twist
   * week is still a week rather than a separate engine.
   */
  const twists = new Set(options.twists || []);
  const compressed = !!options.compressed;
  const skipVeto = compressed ? !!options.skipVeto : (twists.has('bb-instant-eviction') || !!options.skipVeto);
  week.twists = [...twists];
  week.compressed = compressed;
  if (compressed) week.segment = options.segment || 2;

  /**
   * Season modes that put a third houseguest on the block.
   *
   * The AI Arena and the Block Buster are the same machine with different
   * paint: three nominees every week, and immediately before the vote those
   * three compete for one spot off the block. The consequence is that a
   * nomination stops being a death sentence and starts being a competition,
   * which changes what an HOH is willing to try — and it means the person
   * who leaves has now lost twice.
   *
   * Both run from week one and stop when the house gets small enough that a
   * third nominee would leave nobody to vote.
   */
  const safetyMode = options.safetyMode && options.safetyMode !== 'off' ? options.safetyMode : null;
  const stopsAt = Number.isFinite(options.safetyStopsAt) ? options.safetyStopsAt
    : (safetyMode === 'ai-arena' ? 9 : 6);
  // Three nominees plus an HOH leaves house.length - 4 voters; below five in
  // the house that is nobody, so the mode has to stop before it breaks a vote.
  const safetyActive = !!safetyMode && house.length > Math.max(stopsAt, 5);
  week.safetyMode = safetyActive ? safetyMode : null;
  const nomineeCount = safetyActive ? 3 : 2;
  const allianceOpening = updateBBAllianceLifecycle({ phase:'opening', house, week, rng });
  week.allianceChanges = { formed:allianceOpening.formed ? [allianceOpening.formed.name] : [], betrayals:[] };
  const eventLibrary = options.houseEvents || [];
  const competitionLibrary = options.competitions || [];
  const addBeats = (act, extra = {}) => {
    act.socialBeats = scheduleHouseBeats(eventLibrary, house, {
      act: act.type, phase: act.phase || act.type,
      hoh: week.hoh, nominees: extra.nominees || week.finalNominees || week.initialNominees || [],
      vetoWinner: week.vetoWinner || null, week, ...extra,
    }, { rng, min: eventLibrary.length ? 1 : 0, max: eventLibrary.length ? 3 : 0 });
    return act;
  };

  /**
   * A stretch of house life, as its own act.
   *
   * The phase matters more than the label. What a house does depends entirely
   * on what it knows: before the Head of Household is decided nobody is safe
   * and nobody is a target, and everything after that is a reaction to a fact
   * that did not exist an hour earlier. Attaching beats only to the ceremonies
   * meant an event could never tell those apart.
   *
   * Runs longer than a ceremony act, because this is where the week lives.
   */
  const houseAct = (phase, extra = {}) => {
    const act = { type: 'house', phase, socialBeats: [] };
    act.socialBeats = scheduleHouseBeats(eventLibrary, house, {
      act: 'house', phase,
      hoh: week.hoh || null,
      nominees: extra.nominees || week.finalNominees || week.initialNominees || [],
      vetoWinner: week.vetoWinner || null, week, ...extra,
    }, { rng, min: eventLibrary.length ? 3 : 0, max: eventLibrary.length ? 6 : 0 });
    week.acts.push(act);
    return act;
  };

  // Before anybody has power. No HOH, no nominees, nothing decided.
  if (!compressed) houseAct('pre-hoh');

  // HOH act and the first scramble.
  const hohPlayers = house.filter(name => name !== gs.bb.outgoingHoh);
  const hohCompetition = runBBCompetition({ type:'hoh', participants:hohPlayers, excluded:house.filter(name => !hohPlayers.includes(name)), house, week, rng, library:competitionLibrary, forcedId:options.forcedCompetitions?.hoh, seed:options.seed });
  const hohResults = hohCompetition.placements.map(name => ({ name, score:hohCompetition.scores[name], threw:!!hohCompetition.debug.scoreBreakdown[name]?.threw }));
  let hoh = hook(hooks, 'hohResult', hohCompetition.winner, { week, results: hohResults, competition:hohCompetition, house });
  if (!hohPlayers.includes(hoh)) hoh = hohCompetition.winner;
  week.hoh = hoh;
  gs.bb.stats[hoh].hohWins++;
  week.hohCompetition = hohCompetition;
  week.acts.push(addBeats({ type: 'hoh', winner: hoh, results: hohResults, competition:hohCompetition, outgoingHoh: gs.bb.outgoingHoh }));

  // Slop is the first thing a new Head of Household does with power, and the
  // house watches them do it. Chosen before nominations so the week's first
  // grievance is already in the room when the block is named.
  if (twists.has('bb-have-nots')) {
    const haveNots = chooseHaveNots(hoh, house, rng, options.readBond, options.haveNotCount);
    week.haveNots = [...haveNots];
    gs.bb.haveNots = [...haveNots];
    week.acts.push(addBeats({ type: 'have-nots', hoh, names: [...haveNots] }, { haveNots: [...haveNots] }));
  } else {
    gs.bb.haveNots = [];
  }

  // The house now knows who holds power, and reacts to it.
  if (!compressed) houseAct('post-hoh');

  // Nomination act — directed power: target, pawn, and an optional backdoor plan.
  let plan = chooseNominationPlan(hoh, house, rng);
  plan = hook(hooks, 'nominationResult', plan, { week, house, hoh }) || plan;
  let nominees = [...new Set(plan.nominees)].filter(name => house.includes(name) && name !== hoh).slice(0, 2);
  if (nominees.length < 2) nominees = chooseNominationPlan(hoh, house, rng).nominees;
  // A third chair, named by the same read that names a replacement — the HOH
  // is choosing another target, not drawing a name out of a hat.
  while (safetyActive && nominees.length < nomineeCount) {
    const third = chooseReplacement(hoh, house, [hoh, ...nominees], plan, rng);
    if (!third || nominees.includes(third)) break;
    nominees.push(third);
  }
  nominees.forEach(name => gs.bb.stats[name].timesNominated++);
  week.initialNominees = [...nominees];
  week.plan = plan;
  week.acts.push(addBeats({ type: 'nominations', nominees: [...nominees], target: plan.target, pawn: plan.pawn, backdoorTarget: plan.backdoorTarget }, { nominees: [...nominees] }));

  // Two people are on the block and the rest of the house is not.
  if (!compressed) houseAct('post-noms', { nominees: [...nominees] });

  // ── Instant Eviction: there is no veto, so nominations stand ──
  // The whole middle of the week — the draw, the competition, the ceremony and
  // the two stretches of house life around them — simply does not happen. The
  // pair named by the HOH are the pair the house votes on.
  if (skipVeto) {
    week.vetoWinner = null;
    week.vetoCompetition = null;
    week.finalNominees = [...nominees];
    nominees.forEach(name => gs.bb.stats[name].timesOnTheBlock++);
    week.acts.push(addBeats(
      { type: 'instant-eviction', nominees: [...nominees], hoh },
      { nominees: [...nominees] }));
  }

  if (!skipVeto) {
    // Veto act — player draw, competition, and lobbying.
    let vetoPlayers = chooseVetoPlayers(house, hoh, nominees, rng);
    vetoPlayers = hook(hooks, 'vetoParticipants', vetoPlayers, { week, house, hoh, nominees: [...nominees] }) || vetoPlayers;
    vetoPlayers = [...new Set(vetoPlayers)].filter(name => house.includes(name));
    const vetoCompetition = runBBCompetition({ type:'veto', participants:vetoPlayers, excluded:house.filter(name => !vetoPlayers.includes(name)), house, week, rng, library:competitionLibrary, forcedId:options.forcedCompetitions?.veto, nominees, hoh, seed:options.seed, haveNots: week.haveNots || [] });
    const vetoResults = vetoCompetition.placements.map(name => ({ name, score:vetoCompetition.scores[name], threw:!!vetoCompetition.debug.scoreBreakdown[name]?.threw }));
    let vetoWinner = hook(hooks, 'vetoOutcome', vetoCompetition.winner, { week, results:vetoResults, competition:vetoCompetition, nominees: [...nominees] });
    if (!vetoPlayers.includes(vetoWinner)) vetoWinner = vetoCompetition.winner;
    gs.bb.stats[vetoWinner].vetoWins++;
    week.vetoWinner = vetoWinner;
    week.vetoCompetition = vetoCompetition;
    week.acts.push(addBeats({ type: 'veto', participants: vetoPlayers, winner: vetoWinner, results:vetoResults, competition:vetoCompetition }, { nominees: [...nominees], vetoWinner }));

    // Somebody holds the veto and has not yet said what they will do with it.
    if (!compressed) houseAct('post-veto', { nominees: [...nominees], vetoWinner });

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
  }

  // ── The last competition of the week, played by the people on the block ──
  // Three went up; two will face the vote. Whoever wins here has saved
  // themselves rather than been saved, which the house reads very differently
  // from a veto — and the two who lose have now been beaten in front of
  // everybody on the night they most needed not to be.
  if (safetyActive && nominees.length >= 3) {
    const arena = runBBCompetition({
      type: 'arena', participants: [...nominees], excluded: house.filter(n => !nominees.includes(n)),
      house, week, rng, library: competitionLibrary, forcedId: options.forcedCompetitions?.arena,
      nominees: [...nominees], hoh, seed: options.seed, haveNots: week.haveNots || [],
    });
    const results = arena.placements.map(name => ({ name, score: arena.scores[name] }));
    let saved = hook(hooks, 'safetyOutcome', arena.winner, { week, results, competition: arena, nominees: [...nominees] });
    if (!nominees.includes(saved)) saved = arena.winner;
    week.blockBeforeSafety = [...nominees];
    week.safetyWinner = saved;
    week.safetyCompetition = arena;
    gs.bb.stats[saved].timesSaved++;
    nominees = nominees.filter(name => name !== saved);
    week.acts.push(addBeats(
      { type: 'safety', mode: safetyMode, participants: [...week.blockBeforeSafety],
        winner: saved, results, competition: arena, nominees: [...nominees] },
      { nominees: [...nominees], vetoWinner: week.vetoWinner || null }));
  }
  week.finalNominees = [...nominees];

  // ── Somebody leaves before the house gets to decide ──
  // A walkout or an expulsion takes the week's eviction with it: the house is
  // already down one, so there is nothing to vote on. Checked here so the week
  // still played out normally up to the point it went wrong.
  const departure = rollDeparture(house, {
    mode: options.departures || 'off', rng, round: week.num || 1,
    atRisk: nominees, deprived: week.haveNots || [],
  });
  if (departure) {
    week.departure = { ...departure };
    week.evicted = departure.name;
    week.votes = {};
    week.ballots = [];
    week.tieBreak = null;
    week.voteChanges = 0;
    week.acts.push(addBeats(
      { type: 'departure', ...departure, nominees: [...nominees] },
      { nominees: [...nominees], evicted: departure.name }));

    gs.activePlayers = house.filter(name => name !== departure.name);
    if (!gs.eliminated.includes(departure.name)) gs.eliminated.push(departure.name);
    week.allianceChanges.betrayals = settleBBAllianceWeek(week);
    week.perceptionChanges = updateBBPerceptions({ house: gs.activePlayers, week, rng });
    gs.bb.outgoingHoh = hoh;
    gs.bb.weeks.push(week);
    gs.episode = (gs.episode || 0) + 1;
    return week;
  }

  // Days 5–6 — votes begin from bonds, then campaigning can visibly move them.
  let voters = house.filter(name => name !== hoh && !nominees.includes(name));
  voters = hook(hooks, 'voteEligibility', voters, { week, house, hoh, nominees: [...nominees] }) || voters;
  voters = [...new Set(voters)].filter(name => house.includes(name) && name !== hoh && !nominees.includes(name));
  const ballots = voters.map(voter => ({ voter, ...initialVotePreference(voter, nominees, rng), changed: false }));
  week.preCampaignVotes = tally(ballots, nominees);
  week.campaign = [];
  // A compressed cycle has no time in it: one round of campaigning, live, with
  // the house voting on the spot. That compression IS the twist.
  const campaignActCount = compressed ? 1
    : (options.campaignActCount || (house.length >= 12 ? 3 : house.length >= 7 ? 2 : 1));
  for (let campaignIndex = 0; campaignIndex < campaignActCount; campaignIndex++) {
    const campaign = resolveBBCampaignAct({ nominees, ballots, house, campaignIndex, rng });
    week.campaign.push(campaign);
    week.acts.push(addBeats({
      type:'campaign', campaignIndex, events:campaign.pitches,
      pitches:campaign.pitches, pitchIntel:campaign.intel,
      counterplay:campaign.counterplay, voteChanges:campaign.changed,
      votesAfterAct:tally(ballots, nominees),
    }, { nominees:[...nominees], ballots }));
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
  // Eviction night gets its beats like every other act. It was the one act
  // hardcoded to silence, which made a farewell speech - one of the format's
  // signature moments - impossible to write. The evicted houseguest is passed
  // through so events can be about the person actually leaving.
  week.acts.push(addBeats(
    { type: 'eviction', nominees: [...nominees], ballots, votes, tieBreak, evicted },
    { nominees: [...nominees], evicted, votes, ballots }));

  gs.activePlayers = house.filter(name => name !== evicted);
  if (!gs.eliminated.includes(evicted)) gs.eliminated.push(evicted);
  week.allianceChanges.betrayals = settleBBAllianceWeek(week);
  week.perceptionChanges = updateBBPerceptions({ house:gs.activePlayers, week, rng });
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
