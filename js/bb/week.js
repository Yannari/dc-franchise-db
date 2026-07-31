// Headless Big Brother week engine: a run of acts, one eviction.
//
// Built like a Total Drama episode rather than a calendar. Acts are what the VP
// renders and what events hang off; the day numbers were scaffolding sitting on
// top of acts that already existed. The campaign carries a VARIABLE number of
// beats, the way a challenge fires a variable number of social events between
// its phases.
import { gs, players, seasonConfig } from '../core.js';
import { pStats } from '../players.js';
import { getBond } from '../bonds.js';
import { rollDeparture } from '../departures.js';
import {
  updateRomanticSparks, checkFirstMove, checkShowmanceFormation,
  updateShowmancePhases, checkShowmanceBreakup,
} from '../romance.js';
import { checkPerceivedBondTriggers, recoverBonds } from '../bonds.js';
import { decayAllianceTrust } from '../alliances.js';
import { tickIntentions } from '../intentions.js';
import { applySocialStatusEffects } from '../relationship-events.js';
import { updateSocialStatus } from '../social-status.js';
import { updateEditLayer } from '../edit-layer.js';
import { updateAdaptationFromEpisode } from '../adaptation.js';
import {
  chooseNominationPlan, chooseReplacement, initialVotePreference,
  shouldUseVeto, houseVoteCommitment, applyAllianceVoteBloc, applyHouseBandwagon,
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

/**
 * Run the shared romance pipeline over the house.
 *
 * The house created sparks and nothing ever promoted one: eight seasons made
 * a hundred sparks and zero showmances, which also left the kiss trap — a
 * scheme that needs a showmance to break — permanently unreachable.
 *
 * Total Drama owns the whole pipeline already (spark, intensity, first move,
 * formation, phases, breakup) and none of it is tribe-specific; it keys camp
 * events off `merge` whenever a season is merged, which a house always is. So
 * the house runs the real thing rather than half of it.
 *
 * This lives in the WEEK rather than the run adapter on purpose: a headless
 * season and a played one must produce the same house, and behaviour that
 * depends on which entry point you used is the bug this format keeps finding.
 *
 * Returns the beats it produced so they join the week rather than being left
 * in a camp-events structure a house never renders.
 */
function runHouseRomance(week) {
  if (seasonConfig.romance === 'disabled') return [];
  const ep = { num: week.num, campEvents: { merge: { pre: [], post: [] } },
               eliminated: week.evicted || null, votingLog: week.ballots || [] };
  // The pipeline is Total Drama code and writes gs.popularity directly, which
  // walks straight past the house's own switch. Snapshot and restore rather
  // than edit a module the other simulator depends on.
  const popOff = seasonConfig.popularityEnabled === false;
  const popBefore = popOff ? { ...(gs.popularity || {}) } : null;
  try {
    updateRomanticSparks(ep);
    checkFirstMove(ep);
    checkShowmanceFormation(ep);
    updateShowmancePhases(ep);
    checkShowmanceBreakup(ep);
  } catch { /* romance is texture — it never takes a week down with it */ }
  if (popOff) gs.popularity = popBefore;
  return ep.campEvents.merge.pre.map(e => ({
    text: e.text, players: (e.players || []).filter(Boolean),
    badgeText: e.badgeText || 'SHOWMANCE', badgeClass: e.badgeClass || 'gold',
    eventId: `romance-${e.type || 'beat'}`, category: 'social', location: 'bedroom',
  })).filter(b => b.text);
}


/**
 * The end-of-episode maintenance every Total Drama episode runs, and no Big
 * Brother week ever did.
 *
 * Eight shared systems, all skipped: perceived bonds never diverged on their
 * own, alliance trust never decayed, intentions never aged out, social roles
 * were never computed, the edit never updated, learned behaviour never
 * updated — and, most visibly, bonds never RECOVERED toward neutral. That
 * last one is why every measured season ended with somebody at a perfect 10:
 * relationships in a house could only ever ratchet upward.
 *
 * updatePlayerStates is deliberately not here. It lives in js/episode.js, and
 * a Big Brother week does not run the Total Drama engine.
 *
 * Each call is guarded on its own so one throwing system cannot take the rest
 * of the maintenance — or the week — down with it. That is exactly how the
 * romance pipeline stayed silently broken for as long as it did.
 */
function runHouseMaintenance(week) {
  const ep = {
    num: week.num,
    eliminated: week.evicted || null,
    votingLog: (week.ballots || []).map(b => ({ voter: b.voter, voted: b.evict, changed: !!b.changed })),
    votes: { ...(week.votes || {}) },
    alliances: [],
    campEvents: { merge: { pre: [], post: [] } },
    knowledgeEvents: [],
  };
  const steps = [
    ['perceived bonds', () => checkPerceivedBondTriggers(ep)],
    ['bond recovery', () => recoverBonds(ep)],
    ['alliance trust', () => decayAllianceTrust(week.num)],
    ['intentions', () => tickIntentions(ep)],
    ['status effects', () => applySocialStatusEffects(ep)],
    ['social status', () => updateSocialStatus(ep)],
    ['edit layer', () => updateEditLayer(ep)],
    ['adaptation', () => updateAdaptationFromEpisode(ep)],
  ];
  // Same guard as the romance and scheme bridges: these are shared Total Drama
  // systems and several of them write gs.popularity directly rather than
  // through the house's api, which walks straight past the season's switch.
  const popOff = seasonConfig.popularityEnabled === false;
  const popBefore = popOff ? { ...(gs.popularity || {}) } : null;
  week.maintenanceErrors = [];
  for (const [label, run] of steps) {
    try { run(); } catch (e) { week.maintenanceErrors.push(`${label}: ${e && e.message}`); }
  }
  if (popOff) gs.popularity = popBefore;
  return ep.campEvents.merge.pre.map(e => ({
    text: e.text, players: (e.players || []).filter(Boolean),
    badgeText: e.badgeText || 'THE HOUSE SHIFTS', badgeClass: e.badgeClass || 'grey',
    eventId: `upkeep-${e.type || 'beat'}`, category: 'social', location: 'living-room',
  })).filter(b => b.text);
}

/**
 * Hang the romance beats on the last stretch of house life.
 *
 * Both exits from a week run this — the ordinary one and the one where
 * somebody walked out — so a departure week still has a love life.
 */
/**
 * The end of an alliance, or the survival of one, said out loud.
 *
 * Betrayals, repair attempts and collapses all happened silently — they moved
 * bonds, memories and trust and never once appeared on screen, so a viewer
 * watched an alliance vanish between weeks with nothing to explain it. Every
 * transition in the lifecycle now has a beat, because a consequence nobody can
 * see is indistinguishable from no consequence at all.
 */
function _attachAllianceFallout(week, house) {
  const beats = [];
  const inHouse = n => house.includes(n) || (gs.activePlayers || []).includes(n);

  for (const incident of week.allianceChanges?.betrayals || []) {
    const { player, victim, alliance, repair } = incident;
    beats.push({
      text: `<strong>${player}</strong> votes to evict <strong>${victim}</strong>, even though they `
        + `were together in <strong>${alliance}</strong>. By the time everyone gets back inside, `
        + `the remaining members are comparing votes and asking where ${player} was.`,
      players: [player, victim].filter(Boolean),
      badgeText: 'VOTED OUT AN ALLY', badgeClass: 'red',
      eventId: 'alliance-betrayal', category: 'deals', location: 'living-room',
    });

    if (!repair) continue;
    const how = repair.approach === 'apology' ? `${player} admits the vote was a betrayal and apologizes`
      : repair.approach === 'strategic-explanation' ? `${player} walks everyone through the votes and insists there was no other option`
      : repair.approach === 'refusal' ? `${player} says the vote was personal game information and refuses to discuss it`
      : `${player} denies flipping, even as the others tell ${player} the numbers only work one way`;
    const outcome = repair.outcome === 'forgiven'
      ? { text: `${how}. After a long conversation, <strong>${alliance}</strong> agrees to keep working with ${player}. Nobody calls the trust repaired.`,
          badgeText: 'FORGIVEN', badgeClass: 'green' }
      : repair.outcome === 'working-truce'
        ? { text: `${how}. Some members of <strong>${alliance}</strong> accept the explanation. The others agree to work with ${player} only until the next vote.`,
            badgeText: 'WORKING TRUCE', badgeClass: 'grey' }
        : { text: `${how}. The rest of <strong>${alliance}</strong> reject the explanation. The meeting ends with people leaving separately.`,
            badgeText: repair.outcome === 'fracture' ? 'FRACTURED' : 'REJECTED', badgeClass: 'red' };
    beats.push({
      ...outcome, players: [player].filter(inHouse),
      eventId: 'alliance-repair', category: 'deals', location: 'bedroom',
    });
  }

  // Anything that died this week, for whatever reason.
  for (const alliance of gs.namedAlliances || []) {
    if (alliance.dissolved !== week.num) continue;
    if (gs.bb.mourned?.includes(alliance.id)) continue;
    (gs.bb.mourned ||= []).push(alliance.id);
    const left = (alliance.members || []).filter(inHouse);
    const collapsed = alliance.dissolutionReason === 'trust-collapsed';
    beats.push({
      text: collapsed
        ? `Nobody calls a meeting to end <strong>${alliance.name}</strong>. Its members simply stop sharing information, `
          + `stop checking in before votes and eventually stop using the name.`
        : `<strong>${alliance.name}</strong> is down to ${left.length === 1 ? `${left[0]}, alone` : 'nobody'}. `
          + `There are not enough members left to keep the alliance going.`,
      players: left.slice(0, 4),
      badgeText: collapsed ? 'IT STOPS BEING TRUE' : 'OUT OF NUMBERS', badgeClass: 'red',
      eventId: 'alliance-collapsed', category: 'deals', location: 'living-room',
    });
  }

  if (!beats.length) return;
  const host = (week.acts || []).find(a => a.type === 'eviction')
    || [...(week.acts || [])].reverse().find(a => a.type === 'house');
  if (host) (host.socialBeats ||= []).push(...beats);
}

/** What the house looks like right now: enough for the panels, nothing more. */
function _snapshotHouse() {
  return {
    bonds: { ...(gs.bonds || {}) },
    alliances: (gs.namedAlliances || [])
      .filter(a => a.active !== false && !a.dissolved)
      .map(a => ({ name: a.name, members: [...(a.members || [])], formed: a.formed })),
    showmances: (gs.showmances || [])
      .filter(sh => sh.phase !== 'broken-up')
      .map(sh => ({ players: [...(sh.players || [])], phase: sh.phase })),
  };
}

function _attachRomance(week) {
  const beats = [...runHouseRomance(week), ...runHouseMaintenance(week)];
  if (!beats.length) return;
  const houseActs = (week.acts || []).filter(a => a.type === 'house');
  const host = houseActs[houseActs.length - 1] || (week.acts || [])[week.acts.length - 1];
  if (host) (host.socialBeats ||= []).push(...beats);
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
   * The Block Buster: three nominees every week, and immediately before the
   * vote those three compete for one spot off the block. A nomination stops
   * being a death sentence and becomes a competition, which changes what an
   * HOH is willing to try — and the person who leaves has now lost twice.
   *
   * Runs from week one and stops when the house gets small enough that a third
   * nominee would leave nobody to vote.
   */
  // Any value that is not "off" means the Block Buster — seasons saved while
  // there were two modes still load.
  const safetyMode = options.safetyMode && options.safetyMode !== 'off' ? 'block-buster' : null;
  const stopsAt = Number.isFinite(options.safetyStopsAt) ? options.safetyStopsAt : 6;
  // Three nominees plus an HOH leaves house.length - 4 voters; below five in
  // the house that is nobody, so the mode has to stop before it breaks a vote.
  const safetyActive = !!safetyMode && house.length > Math.max(stopsAt, 5);
  week.safetyMode = safetyActive ? safetyMode : null;
  const nomineeCount = safetyActive ? 3 : 2;
  // Reconcile first; formation itself happens inside the stretches below, so
  // that a new alliance always has a scene in the same act that created it.
  const allianceOpening = updateBBAllianceLifecycle({ phase:'reconcile', house, week, rng });
  week.allianceChanges = { formed:[], betrayals:[] };
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
  /**
   * A beat for an alliance that has just changed.
   *
   * The lifecycle returns the same field for two different events: a brand new
   * alliance, and an existing one that recruited somebody. Treating both as a
   * formation announced "for the first time" on every recruitment — six
   * seasons produced 229 formation beats and never more than one live
   * alliance, which is the tell.
   *
   * An alliance is announced once, ever. After that a new member joining is
   * its own smaller moment.
   */
  const allianceBeat = alliance => {
    const members = (alliance.members || []).filter(n => house.includes(n));
    if (members.length < 2) return null;
    gs.bb.announced ||= [];
    const isNew = !gs.bb.announced.includes(alliance.id);

    if (isNew) {
      gs.bb.announced.push(alliance.id);
      const named = members.length === 2
        ? `${members[0]} and ${members[1]}`
        : `${members.slice(0, -1).join(', ')} and ${members[members.length - 1]}`;

      // An alliance formed INSIDE another one is a different event, and the
      // more dangerous of the two: the people who made it are still sitting in
      // the room they are quietly playing against.
      if (alliance.parent) {
        return {
          text: `${named} meet without the rest of <strong>${alliance.parentName}</strong>. `
            + `They agree to protect each other first, then return to the larger group without mentioning the new deal.`,
          players: members.slice(0, 4),
          badgeText: 'AN ALLIANCE INSIDE AN ALLIANCE', badgeClass: 'gold',
          eventId: 'alliance-inner-circle', category: 'deals', location: 'pantry',
          newAlliance: true,
        };
      }

      return {
        text: `${named} meet in the bedroom and finally make the agreement official. `
          + `They name the alliance <strong>${alliance.name}</strong>, decide who is allowed to know about it `
          + `and leave the room one at a time.`,
        players: members.slice(0, 4),
        badgeText: 'ALLIANCE FORMED', badgeClass: 'gold',
        eventId: 'alliance-formed', category: 'deals', location: 'bedroom',
        newAlliance: true,
      };
    }

    // A recruitment. The newest name in the history is the person who just
    // came in, and the room they came into already had a name.
    const joined = [...(alliance.history || [])].reverse()
      .find(h => h.type === 'recruited')?.member;
    if (!joined || !house.includes(joined)) return null;
    return {
      text: `The members of <strong>${alliance.name}</strong> bring <strong>${joined}</strong> into the bedroom `
        + `and offer them a place in the alliance. ${joined} agrees, then asks who outside the room already knows.`,
      players: [joined, ...members.filter(n => n !== joined).slice(0, 3)],
      badgeText: 'BROUGHT IN', badgeClass: 'blue',
      eventId: 'alliance-recruited', category: 'deals', location: 'bedroom',
      newAlliance: false,
    };
  };

  const houseAct = (phase, extra = {}) => {
    const act = { type: 'house', phase, socialBeats: [] };
    act.socialBeats = scheduleHouseBeats(eventLibrary, house, {
      act: 'house', phase,
      hoh: week.hoh || null,
      nominees: extra.nominees || week.finalNominees || week.initialNominees || [],
      vetoWinner: week.vetoWinner || null, week, ...extra,
    }, { rng, min: eventLibrary.length ? 22 : 0, max: eventLibrary.length ? 30 : 0 });
    // People decide to work together at any hour of the day, not only in the
    // gap before the week starts. Formation is attempted in every stretch of
    // house life and the lifecycle's own caps decide whether one happens —
    // so an alliance can be born after an HOH win, in the middle of
    // nominations, or during the campaign, and the scene appears exactly
    // where it happened.
    const formedHere = updateBBAllianceLifecycle({ phase: 'opening', house, week, rng }).formed;
    if (formedHere) {
      const beat = allianceBeat(formedHere);
      if (beat) {
        act.socialBeats.unshift(beat);
        if (beat.newAlliance) week.allianceChanges.formed.push(formedHere.name);
      }
    }

    // The state as it stands when this stretch ends.
    //
    // The panels used to read the episode's single end-of-week snapshot, so
    // the FIRST screen of the week already showed the numbers the week
    // finished on — bonds that had not happened yet and alliances nobody had
    // formed on screen. Each stretch carries its own picture now.
    act.state = _snapshotHouse();
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
  // A Block Buster week is always three on the block — the third chair is the
  // mode, not a choice the Head of Household gets to make. Three go up, the
  // three compete, and two face the vote.
  //
  // The third is named by the same read that names a replacement, so it is
  // another target rather than a name out of a hat.
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
    week.allianceChanges.betrayals = settleBBAllianceWeek(week, rng);
  _attachAllianceFallout(week, house);
    week.perceptionChanges = updateBBPerceptions({ house: gs.activePlayers, week, rng });
    _attachRomance(week);
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

  // ── What people said, what their bloc wanted, and where the room went ──
  // Recorded before anything moves so the week can tell a changed vote from a
  // vote that was never honest — and so a promise can be checked against it.
  ballots.forEach(ballot => { ballot.stated = ballot.evict; });
  const commitments = new Map(ballots.map(b => [b.voter, houseVoteCommitment(b, nominees)]));
  week.voteCommitments = [...commitments.values()];
  week.blocMoves = applyAllianceVoteBloc({ ballots, nominees, commitments });
  week.bandwagon = applyHouseBandwagon({ ballots, nominees, commitments, rng });
  week.voteBroken = ballots
    .filter(b => b.stated !== b.evict && commitments.get(b.voter)?.promised)
    .map(b => ({ voter: b.voter, promised: b.stated, cast: b.evict }));

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
  week.allianceChanges.betrayals = settleBBAllianceWeek(week, rng);
  _attachAllianceFallout(week, house);
  week.perceptionChanges = updateBBPerceptions({ house:gs.activePlayers, week, rng });
  _attachRomance(week);
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
