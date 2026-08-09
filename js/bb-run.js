// ══════════════════════════════════════════════════════════════════════
// bb-run.js — running a Big Brother season from the run surface
// ══════════════════════════════════════════════════════════════════════
//
// The engine has been finishable in tests since it was written, and unreachable
// from the app the whole time: nothing dispatched it, and it takes its event
// library as an argument that defaulted to empty. This is the adapter that
// closes both gaps — one week per press of Run, with the house actually talking.
//
// It sits on the integration side deliberately. `js/bb/` stays headless and
// knows nothing about `ep`, `gs.episodeHistory` or the UI; the translation
// happens here, which is also the rule the spec sets for the entry point.
//
// `js/episode.js` is not touched and not called. Total Drama's rules are not
// involved in a Big Brother week.

import { gs, seasonConfig, seasonFormat, resolveTwistSchedule, TWIST_CATALOG } from './core.js';
import { simulateBBWeek } from './bb/week.js';
import { juryOpensAt, juryLines, isSeatedJuror } from './bb/jury.js';
import { applyGoodbyeMessages } from './bb/jury-sentiment.js';
import { lastWordsLines } from './bb/last-words.js';
import { juryHouseLines } from './bb/jury-house.js';
import { HOUSE_EVENTS } from './bb-events/index.js';
import { scheduleHouseBeats } from './bb/house-events.js';
import { getPerceivedBond } from './bonds.js';
import { knownBlocsFor } from './bb/blocs.js';
import { getBBTarget } from './bb/shared-strategy.js';
import { BB_COMPETITIONS } from './bb-comps/index.js';
// The dispatcher's own fallbacks — listed in the pinning dropdowns so "an
// ordinary one this week" is an authorable choice, not just what you get.
import { GENERIC_BB_COMPS, runBBCompetition } from './bb/comps.js';
import { generateBBEvictionInterview } from './bb-aftermath.js';
import { simulateBBFinale, finalCompChoices } from './bb-finale.js';
import { generateBBFinaleText } from './text-backlog.js';
import { updateEditLayer, finalizeEditSeason } from './edit-layer.js';
import { installBBSaboteur, saboteurState } from './bb/saboteur.js';
import { installTwinTwist, twinState } from './bb/twin-twist.js';
import { installDuos } from './bb/duos.js';
import { installRivals, rivalsState } from './bb/rivals.js';
// Re-exported so the Format Designer (bare-globals world) can list what a
// distributor is allowed to hand out.
export { BB_POWER_DEFINITIONS } from './bb/powers.js';
/** Is this season a Big Brother season? */
export const isBigBrotherSeason = () => seasonFormat(seasonConfig) === 'big-brother';

/**
 * A house, not tribes.
 *
 * Total Drama seasons open by splitting the cast; a Big Brother season opens
 * with everybody in one place. Rather than inventing a fake single tribe — which
 * would leak tribe semantics into every downstream reader — the season simply
 * declares itself merged from the start, which is already how the codebase says
 * "one group, individual game".
 */
export function prepareHouse() {
  gs.isMerged = true;
  gs.mergeName = gs.mergeName || 'the house';
  // A house has no tribes — but the shared Total Drama systems it borrows read
  // gs.tribes as an array, and an absent one threw straight through the middle
  // of the romance pipeline (`gs.tribes.some is not a function`), which is why
  // eight seasons produced a hundred sparks and not one showmance. An empty
  // array says the true thing and keeps every shared reader working.
  if (!Array.isArray(gs.tribes)) gs.tribes = [];
  gs.bb ||= { outgoingHoh: null, weeks: [], stats: {} };
  gs.bb.outgoingHoh ??= null;
  gs.bb.weeks ||= [];
  gs.bb.stats ||= {};
  return gs.activePlayers || [];
}

/**
 * A house ends at a final three. Not a preference — a constraint.
 *
 * The last night is a three-part Head of Household played from three, and the
 * week engine cannot run a house of fewer than four. A configured final two
 * therefore crashed the season at three remaining, and a configured final four
 * ran the finale from four and cut only one, leaving a houseguest neither
 * evicted nor a finalist. Both were reachable from the Finale Size slider.
 */
export const houseFinaleSize = () => 3;

/** Is the house down to its final few? */
export const houseIsAtFinale = () => (gs.activePlayers || []).length <= houseFinaleSize();

/**
 * The shape of a house season, worked out before it is played.
 *
 * A house has almost nothing to configure — one group, no tribes, no merge —
 * so the setup column is better filled with what the season WILL be than with
 * knobs invented to fill it. Everything here is derived; there is no state
 * behind it to get out of sync.
 *
 * Pure, so it can be tested without a DOM: (config, castSize) → segments.
 */
export function houseStructure(config = {}, castSize = 0) {
  const N = Number(castSize) || 0;
  const jurySize = Math.max(0, Number(config.jurySize) || 0);
  const segs = [];

  // Four is the floor: the week engine will not run a smaller house, and the
  // finale needs three to play a three-part Head of Household from.
  segs.push({
    label: `${N} houseguest${N === 1 ? '' : 's'}`,
    ok: N >= 4,
    why: N >= 4 ? undefined : 'A house needs at least 4 houseguests',
  });

  // One eviction a week down to the final three, minus the extra body each
  // scheduled double eviction takes in the same episode.
  const evictions = Math.max(0, N - 3);
  // Every scheduled night that removes TWO houseguests shortens the season by
  // a week. The Split House does exactly that — one eviction per side — and was
  // not counted here, so a season with one scheduled ran a week longer on the
  // projection than it does in play.
  const twoAtOnce = (config.twistSchedule || [])
    .filter(t => t && (t.type === 'bb-double-eviction' || t.type === 'bb-split-house'
      || t.type === 'bb-duo-week'));
  const doubles = twoAtOnce.length;
  const splits = twoAtOnce.filter(t => t.type === 'bb-split-house').length;
  const weeks = Math.max(0, evictions - Math.min(doubles, Math.max(0, evictions - 1)));
  const doubleLabel = doubles
    ? ` (${doubles} double${splits ? `, ${splits} of them a split` : ''})` : '';
  segs.push({
    label: `${weeks} week${weeks === 1 ? '' : 's'}${doubleLabel}`,
    ok: weeks >= 1,
    why: weeks >= 1 ? undefined : 'No weeks to play — cast more houseguests',
  });

  // The jury is the last `jurySize` people out, and the houseguest cut at the
  // final three is one of them — so the rest come from the weekly evictions.
  if (jurySize > 0) {
    const opensAt = juryOpensAt(config);
    const fits = jurySize <= evictions + 1;
    segs.push({
      label: fits ? `jury opens at ${opensAt}` : `jury of ${jurySize}`,
      ok: fits,
      why: fits ? undefined
        : `A jury of ${jurySize} needs ${jurySize + 2} houseguests but only ${N} are cast`,
    });
  } else {
    segs.push({ label: 'no jury', ok: true });
  }

  // A three-nominee mode is part of the season's shape, not a detail.
  const mode = config.bbSafetyMode && config.bbSafetyMode !== 'off' ? config.bbSafetyMode : null;
  if (mode) {
    const stopsAt = Math.max(Number(config.bbSafetyStopsAt) || 0, 5);
    const runs = N > stopsAt;
    segs.push({
      label: `Block Buster to ${stopsAt}`,
      ok: runs,
      why: runs ? undefined : `The house starts at ${N}, so the Block Buster would never run`,
    });
  }

  segs.push({ label: 'final three', ok: N >= 4 });
  return segs;
}

/**
 * Turn a finished week into the record the run surface renders.
 *
 * Only the fields the timeline, episode view and history actually read are
 * filled. Anything Total Drama-specific stays null rather than being faked: a
 * house has no tribes, no immunity necklace and no idols, and pretending
 * otherwise is how the two formats start bleeding into each other.
 */
export function weekToEpisode(week) {
  const evicted = week.evicted || null;
  return {
    num: week.num,
    format: 'big-brother',
    isBigBrother: true,
    eliminated: evicted,
    // Carried for the visual player: the cold open opens on the whole house,
    // and the nomination screen shows the HOH's private plan.
    houseAtStart: [...(week.houseAtStart || [])],
    outgoingHoh: (week.acts || []).find(a => a.type === 'hoh')?.outgoingHoh || null,
    plan: week.plan || null,
    // The HOH is the week's safety, which is the closest true analogue.
    immunityWinner: week.hoh || null,
    hoh: week.hoh || null,
    vetoWinner: week.vetoWinner || null,
    // The resolved twist contract — which twist changed which rule — so the
    // Debug panel can show hook mutations on replay, not just live.
    twistState: week.twistState || null,
    // The alliance board as it stood this week — who is in what, how firmly,
    // and which member is the crack.
    allianceBoard: (week.allianceBoard || []).map(b => ({ ...b, members: (b.members || []).map(m => ({ ...m })) })),
    // The Battle of the Block's own fields. `botbStoodDown` records WHY a
    // scheduled battle did not happen, so a week that quietly ran as an
    // ordinary one can still say so on the debug screen instead of looking
    // like the twist was never wired up.
    botbStoodDown: week.botbStoodDown || null,
    coHoh: week.coHoh || null,
    crownedHohs: week.crownedHohs || null,
    dethronedHoh: week.dethronedHoh || null,
    hohSecret: !!week.hohSecret,
    hohGuesses: (week.hohGuesses || []).map(g => ({ ...g })),
    // Who the house decided turned the third key, right or wrong. Carried
    // because the guesses ARE the twist — without them a Roadkill week is a
    // third nomination with extra steps.
    roadkill: week.roadkill
      ? { winner: week.roadkill.winner, nominee: week.roadkill.nominee,
        refilled: !!week.roadkillRefilled }
      : null,
    roadkillGuesses: (week.roadkillGuesses || []).map(g => ({ ...g })),
    // The Hacker, same reasoning and three times over: what was done, and who
    // the house decided did it. The competition object itself stays on the act
    // — this is the summary the screens and the replay read.
    hacker: week.hacker
      ? { winner: week.hacker.winner,
        blockHack: week.hacker.blockHack ? { ...week.hacker.blockHack } : null,
        vetoHack: week.hacker.vetoHack ? { ...week.hacker.vetoHack } : null,
        voteHack: week.hacker.voteHack ? { ...week.hacker.voteHack } : null }
      : null,
    hackerGuesses: (week.hackerGuesses || []).map(g => ({ ...g })),
    hackerVote: week.hackerVote ? { ...week.hackerVote } : null,
    // Everything that was in somebody's pocket this week, with the rules
    // attached — the screen's "what is still out there" band reads this, and a
    // replayed week has to show the state as it was then rather than the
    // season-long ledger as it is now.
    powerLedger: (week.powerLedger || []).map(p => ({ ...p })),
    invisibleReveal: week.invisibleReveal ? { ...week.invisibleReveal } : null,
    initialNominees: [...(week.initialNominees || [])],
    finalNominees: [...(week.finalNominees || [])],
    votes: { ...(week.votes || {}) },
    // The shared vote screen reads votingLog, so a Big Brother ballot is
    // translated once here rather than the player growing a second way to draw
    // a vote. Same screen, same tally bars, same blindside detection.
    // Everything the vote screen needs to show its own working: what each
    // voter said before anything moved them, whether they had shaken on it,
    // and which force moved them if one did.
    votingLog: (week.ballots || []).map(b => ({
      voter: b.voter, voted: b.evict, changed: !!b.changed,
      stated: b.stated || null, blocMove: b.blocMove || null, bandwagon: !!b.bandwagon,
    })),
    voteCommitments: (week.voteCommitments || []).map(c => ({ ...c })),
    votePlans: (week.votePlans || []).map(v => ({ ...v })),
    // The whole operation — meetings, stances, approaches, refusals, lies —
    // travels with the episode, because the Voting Plans screen is a rendering
    // of it and a replay with only the ballots would have nothing to say.
    finalPleas: (week.finalPleas || []).map(r => ({
      ...r, factsUsed: r.factsUsed.map(f => ({ ...f })),
      eligibleListeners: [...r.eligibleListeners], responses: r.responses.map(x => ({ ...x })),
      allies: [...(r.allies || [])],
    })),
    voteOperation: week.voteOperation
      ? {
        majority: week.voteOperation.majority,
        plans: (week.voteOperation.plans || []).map(p => ({
          ...p, members: [...p.members],
          stances: p.stances.map(s => ({ ...s })),
          approaches: p.approaches.map(a => ({ ...a })),
          outsideSupport: [...p.outsideSupport],
        })),
        independents: (week.voteOperation.independents || []).map(v => ({ ...v })),
        moves: (week.voteOperation.moves || []).map(m => ({ ...m })),
      }
      : null,
    // Why anybody's plan moved this week, and what is currently promised. Both
    // are shown, not merely stored — a game that behaves on reasons the user
    // cannot see is the failure mode this format keeps rediscovering.
    planChanges: (week.planChanges || []).map(c => ({ ...c })),
    housePlans: { ...(week.housePlans || {}) },
    endgameDeals: (week.endgameDeals || []).map(d => ({ ...d })),
    dealBreaks: (week.dealBreaks || []).map(d => ({ ...d })),
    blocMoves: (week.blocMoves || []).map(m => ({ ...m })),
    bandwagon: (week.bandwagon || []).map(m => ({ ...m })),
    voteBroken: (week.voteBroken || []).map(m => ({ ...m })),
    voteChanges: week.voteChanges || 0,
    tieBreak: week.tieBreak || null,
    acts: week.acts || [],
    // Deliberately absent from a house: tribes, merge, idols, Tribal Council.
    challengeType: null,
    isMerge: false,
    riChoice: null,
    alliances: [],
    twists: [],
    tribesAtStart: [],
    campEvents: null,
    summaryText: '',
  };
}

/**
 * Simulate one Big Brother week and record it the way the run surface expects.
 *
 * Returns an `ep`-shaped object so `simulateNext()` can carry on unchanged, or
 * null when the house has nobody left to evict.
 */
/** The twists this format has, so a Total Drama entry can never reach the house. */
/**
 * Which twists this format can schedule.
 *
 * DERIVED, not listed. It was a hand-maintained Set, and a hand-maintained
 * allowlist fails silently in the one direction that matters: a twist missing
 * from it is dropped out of `bbTwistsForWeek` with no error, no warning and no
 * twist — you schedule it, play the week, and nothing happens. Both twists
 * added this week were invisible for exactly that reason, and there was
 * nothing on screen to say why.
 *
 * The catalogue already declares `format`, so this is the same question asked
 * once instead of twice. Checked before replacing it: the old list held every
 * catalogue twist and nothing else — the only two it was missing were the two
 * added this week, which is precisely the failure being removed.
 */
export const BB_TWIST_IDS = new Set(
  TWIST_CATALOG.filter(c => c?.format === 'big-brother' && c.id).map(c => c.id));

/**
 * Which twists are scheduled for the week about to be played.
 *
 * The designer schedules by episode number and a Big Brother episode is a
 * week, so they are the same axis. Anything not built for this format is
 * dropped rather than passed through to an engine that would ignore it
 * silently.
 */
/**
 * Which competitions the designer pinned to this week, if any.
 *
 * The library picks weighted-at-random by default, which is right for a season
 * you want to be surprised by and wrong for one you are booking. A pinned comp
 * is authored per episode in the Season Timeline and handed to the engine as
 * `forcedCompetitions`, which the dispatcher has always accepted and nothing
 * has ever set.
 *
 * Slot eligibility is NOT re-checked here — `chooseCompetition` throws a clear
 * error if a comp cannot serve the slot it was pinned to, and swallowing that
 * here would turn an authoring mistake into a silently random week.
 */
export function bbForcedCompsForWeek(epNum) {
  const entry = (seasonConfig.bbCompSchedule || [])
    .find(c => c && Number(c.episode) === Number(epNum));
  if (!entry) return undefined;
  const forced = {};
  if (entry.hoh) forced.hoh = entry.hoh;
  if (entry.veto) forced.veto = entry.veto;
  return Object.keys(forced).length ? forced : undefined;
}

/**
 * Everything that can legally fill one slot, for the Season Timeline's pinning
 * dropdowns.
 *
 * Slots are not interchangeable and the picker must not pretend they are: OTEV
 * and Hide and Go Veto are veto-only, the Wall and the Pressure Cooker are not
 * veto comps at all. Filtering on `types` here is what stops the designer from
 * authoring a week the dispatcher would refuse to run.
 *
 * The generic fallbacks are included and flagged, because "give me an ordinary
 * one this week" is a real authoring choice and the pool accepts their ids the
 * same way it accepts a written comp's.
 */
export function bbCompetitionsForSlot(type) {
  // `finalRole` rides along so the finale picker can tell the recurring The
  // Wall apart from the set piece of the same name written for finale night.
  // `stats` rides along for the same reason `finalRole` does: a caller that has
  // to reason about the competition needs more than its name. The season
  // randomiser weighs these to build a balanced or leaning season, and without
  // them every competition looked identical to it — the mix setting was
  // selected, applied, and changed nothing at all.
  const shape = (c, generic) => ({ id: c.id, name: c.name, category: c.category,
    finalRole: c.finalRole || null, generic, stats: { ...(c.stats || {}) } });
  // The Battle Back is not an HOH or a veto and does not inherit either list's
  // restrictions: it is a competition held outside the house for a prize that
  // is neither power nor safety, so anything the library can stage is fair.
  // Its own 'return' declarations are only three comps deep, which would make
  // the picker useless.
  // The two parts of the final Head of Household are a role, not a type: each
  // draws from the ordinary library plus the set pieces written for finale
  // night, and the finale itself owns that definition so the picker and the
  // night can never disagree about what is eligible.
  if (type === 'final-1' || type === 'final-2') {
    // Two groups, not one list. `generic` carries "this is outside what the
    // night would have drawn", which is the only thing the picker needs to know
    // to label them apart.
    const { usual, rest } = finalCompChoices(type === 'final-1' ? 'endurance' : 'skill');
    const byName = (a, b) => a.name.localeCompare(b.name);
    return [...usual.map(c => shape(c, false)).sort(byName),
      ...rest.map(c => shape(c, true)).sort(byName)];
  }
  const serves = c => (type === 'battle-back'
    ? ['hoh', 'veto', 'return'].some(t => (c.types || []).includes(t))
    : (c.types || []).includes(type));
  const written = BB_COMPETITIONS.filter(serves).map(c => shape(c, false));
  const generic = (GENERIC_BB_COMPS || []).filter(serves).map(c => shape(c, true));
  const byName = (a, b) => a.name.localeCompare(b.name);
  return [...written.sort(byName), ...generic.sort(byName)];
}

/** A pinned Battle Back competition, resolved to the real definition. */
export function bbFindCompetition(id) {
  if (!id) return null;
  return BB_COMPETITIONS.find(c => c.id === id)
    || (GENERIC_BB_COMPS || []).find(c => c.id === id)
    || null;
}

export function bbTwistsForWeek(weekNum) {
  const scheduled = (seasonConfig.twistSchedule || [])
    .filter(t => t && Number(t.episode) === Number(weekNum))
    .map(t => t.type)
    .filter(id => BB_TWIST_IDS.has(id));

  // What the cards say they cannot run beside — another card, or a season-long
  // mode. This used to be enforced only by the Format Designer while you were
  // authoring, so a week that became illegal AFTER it was booked still ran:
  // schedule the Den, switch the Block Buster on, and the Den went ahead in a
  // season the catalog would now refuse to add it to.
  const legal = resolveTwistSchedule(scheduled, seasonConfig);

  // Have-nots can be a standing feature of the season rather than a one-off,
  // which is how the format usually runs it: somebody is always on slop.
  // Applied AFTER the filter — it is a season-long choice made explicitly in
  // the config rather than a card on this week, so it is not the filter's to
  // overrule.
  const mode = seasonConfig.bbHaveNots || 'twist';
  const out = new Set(legal);
  if (mode === 'every-week') out.add('bb-have-nots');
  if (mode === 'off') out.delete('bb-have-nots');
  return [...out];
}


/**
 * A week where the house never meets.
 *
 * Crowns two Heads of Household over the whole house, divides it by schoolyard
 * pick, then runs a COMPLETE week for each half against a house that contains
 * only that half. The two records are separate weeks in the ledger — the
 * stats, the jury and the competition history all have to see two HOHs and two
 * evictions — and one episode, because that is how it is watched.
 */
function simulateSplitHouseEpisode({ house, epNum, twists }) {
  // ── everybody, together, before any of it ──
  //
  // One stretch of house life with the whole cast in it. It has to be built
  // out here rather than inside a side's week: the sides are sealed, and an
  // opener run inside one of them forms cross-side bonds and alliances that
  // later side acts then name — which is exactly the wall this twist exists to
  // put up. Out here it happens before there is a wall to cross.
  const openerWeek = { num: (gs.bb.weeks?.length || 0) + 1, houseAtStart: [...house], acts: [] };
  let sharedOpener = null;
  try {
    sharedOpener = {
      type: 'house', phase: 'pre-hoh', sharedOpener: true, segment: 0,
      socialBeats: scheduleHouseBeats(HOUSE_EVENTS, house,
        { act: 'house', phase: 'pre-hoh', hoh: null, coHoh: null, hohs: [],
          nominees: [], vetoWinner: null, week: openerWeek },
        { rng: Math.random, min: 22, max: 30 }),
    };
  } catch { sharedOpener = null; }

  // ── the crowning, before anybody is divided ──
  const eligible = house.filter(name => name !== gs.bb.outgoingHoh);
  const crowning = runBBCompetition({
    type: 'hoh', participants: eligible,
    excluded: house.filter(n => !eligible.includes(n)),
    house, week: { num: (gs.bb.weeks?.length || 0) + 1, houseAtStart: house },
    rng: Math.random, library: BB_COMPETITIONS,
    forcedId: bbForcedCompsForWeek(epNum)?.hoh,
  });
  const [hohA, hohB] = crowning.placements;

  // ── the schoolyard pick ──
  //
  // Not "take whoever you like most". A wall splits the house into two games
  // and the pick is the last decision anybody makes with the whole house in
  // the room, so it is played on what the picker actually KNOWS:
  //
  //   the target   somebody you want gone has to be on YOUR side, because you
  //                cannot nominate through a wall. Taking your target is not
  //                affection, it is the only way to reach them.
  //   the split    a bloc you have worked out is a bloc you can break. Pull one
  //                member across and the rest of it spends the week on the
  //                other side of a wall without their numbers.
  //   the numbers  a side is a voting bloc for a week. Somebody who will vote
  //                the way you ask is worth more than somebody you merely like.
  //   isolation    take a person AWAY from everybody they trust and they arrive
  //                on your side with nobody — which is what makes them nominate
  //                -able without costing you anything.
  //
  // All proportional, all noisy, and the reason recorded is whichever term
  // actually decided it rather than a label chosen afterwards.
  const sideA = [hohA];
  const sideB = [hohB];
  const pool = house.filter(n => n !== hohA && n !== hohB);
  let picking = hohA;
  const picks = [];
  const safely = (fn, fallback) => { try { return fn(); } catch { return fallback; } };

  while (pool.length) {
    const side = picking === hohA ? sideA : sideB;
    const rival = picking === hohA ? hohB : hohA;
    const mine = picking === hohA ? sideA : sideB;
    const myTarget = safely(() => getBBTarget(picking), null);
    // How much of this pick is a plan and how much is a feeling.
    //
    // Every reason below used to assume a strategist, so a loyal-soldier was
    // credited with executing bloc splits and isolation plays they would never
    // think of. Proportional both ways: the more strategically somebody plays
    // the more the reads weigh, and the less they do the more the pick is
    // simply "I want to be in there with somebody I like" — which is a real
    // reason and the honest one for most of this cast.
    const pst = safely(() => pStats(picking), {});
    const strat = Math.max(0, Math.min(1, (pst.strategic ?? 5) / 10));
    const warm = 1 - strat;
    // Groups this picker has actually worked out, strongest read first. A bloc
    // they have not noticed cannot be a reason for anything.
    const known = safely(() => knownBlocsFor(picking), []) || [];

    let best = pool[0], bestScore = -Infinity, bestWhy = null;
    for (const name of pool) {
      const bond = safely(() => getPerceivedBond(picking, name), 0);
      const theirs = safely(() => getPerceivedBond(rival, name), 0);
      // Who this person has left in the pool, and who they already have on my
      // side — the difference between taking somebody and isolating them.
      const closeTo = n => safely(() => getPerceivedBond(name, n), 0) >= 3.5;
      const alliesLoose = pool.filter(n => n !== name && closeTo(n)).length;
      const alliesMine = mine.filter(closeTo).length;
      // Somebody with nobody ANYWHERE is a floater, not an isolation play.
      // Isolating means cutting a person off from people they actually have.
      const alliesAnywhere = house.filter(n => n !== name && closeTo(n)).length;
      const inKnownBloc = known.find(k => k.bloc.members.includes(name));
      // Splitting only counts while part of that bloc is still unclaimed.
      const blocLoose = inKnownBloc
        ? inKnownBloc.bloc.members.filter(m => pool.includes(m) && m !== name).length : 0;

      const reasons = [
        // Reads. A plan you have to be playing a game to have.
        { key: 'target', v: (myTarget === name ? 3.4 : 0) * (0.35 + strat * 0.65) },
        { key: 'split', v: (blocLoose ? 1.5 + (inKnownBloc.read || 0) * 0.7 : 0) * strat },
        { key: 'isolate', v: (alliesAnywhere >= 2 && alliesLoose === 0 && bond < 3 ? 1.9 : 0) * strat },
        { key: 'deny', v: Math.max(0, theirs - bond) * 0.34 * (0.4 + strat * 0.6) },
        // Half a read. Anybody can count votes, even if they cannot scheme.
        { key: 'numbers', v: (Math.max(0, bond) * 0.42 + alliesMine * 0.5) * (0.5 + strat * 0.5) },
        // No read at all, and no less real for it: a week sealed behind a wall
        // is a great deal easier next to somebody you actually like.
        { key: 'ally', v: Math.max(0, bond) * 0.42 * (0.55 + warm)
            + (pst.loyalty ?? 5) * 0.035 * warm },
      ].sort((x, y) => y.v - x.v);

      const score = reasons.reduce((sum, r) => sum + r.v, 0) + (Math.random() - 0.5) * 1.4;
      if (score > bestScore) {
        bestScore = score; best = name;
        bestWhy = reasons[0].v > 0.35 ? reasons[0].key : 'nobody-left';
        bestWhy = { key: bestWhy, bloc: inKnownBloc?.bloc?.label || null, alliesAnywhere };
      }
    }

    side.push(best);
    const bond = safely(() => getPerceivedBond(picking, best), 0);
    const w = bestWhy || { key: 'nobody-left' };
    const why = w.key === 'target'
      ? `${best} is who ${picking} came into this week wanting gone, and you cannot nominate through a wall — taking ${best} is the only way to reach ${best} at all`
      : w.key === 'split'
        ? `${picking} has worked out ${w.bloc || 'that group'} and is taking a piece of it. The rest of them spend the week on the other side of a wall, one body short`
        : w.key === 'numbers'
          ? `${picking} needs votes more than friends this week, and ${best} is a vote ${picking} can actually ask for`
          : w.key === 'isolate'
            ? `every person ${best} trusts has already gone to one side or the other. Pulled across now, ${best} arrives with nobody to run to — which is what makes ${best} nominateable`
            : w.key === 'deny'
              ? `${best} is closer to ${rival} than to ${picking}. This is less about wanting ${best} and more about ${rival} not having ${best}`
              : w.key === 'ally'
                ? `${picking} likes ${best} and is not thinking any further than that. A week sealed behind a wall is a great deal easier next to somebody you would have chosen anyway`
                : `there is nobody left to want. ${best} goes to ${picking} because somebody has to`;

    picks.push({
      by: picking, picked: best, why, reason: w.key,
      bond: Math.round(bond * 10) / 10,
    });
    pool.splice(pool.indexOf(best), 1);
    picking = picking === hohA ? hohB : hohA;
  }

  // ── two weeks, each blind to the other ──
  const common = {
    houseEvents: HOUSE_EVENTS,
    competitions: BB_COMPETITIONS,
    twists: twists.filter(t => t !== 'bb-split-house'),
    haveNotCount: seasonConfig.bbHaveNotCount === 'auto' ? 0 : Number(seasonConfig.bbHaveNotCount) || 0,
    departures: seasonConfig.bbDepartures || 'off',
  };
  // ── the wall ──
  //
  // Isolation is not a flag the week engine reads, and it cannot be one: the
  // knowledge store, the plan revisions, the alliance lifecycle, the bloc
  // reader, the deal ledger and the event pool all ask `gs.activePlayers` who
  // is in this house. Passing a half-house down to the week did not stop any
  // of them reaching the other side, and the isolation test caught house
  // events on one side naming four people from the other.
  //
  // So the roster IS the side while that side is playing. Every one of those
  // readers then sees exactly the people the twist says exist, and no module
  // needs to learn what a split house is. It is also what the twist means: for
  // this week, the other half genuinely is not in the building.
  const playSide = (side, preCrownedHoh, segment) => {
    const before = [...(gs.activePlayers || [])];
    gs.activePlayers = [...side];
    try {
      // The side is told it IS a side. `segment` alone cannot say so — a
      // double eviction's second cycle carries one too — and the house event
      // pool needs to know it is playing half a week behind a wall, plus who
      // is on the other side of it, to write about the people who are not
      // there.
      return simulateBBWeek({ ...common, house: side, preCrownedHoh, segment,
        // The opening stretch of house life belongs to the undivided house and
        // happens once. Side A plays it for everybody; side B skips it.
        // Both sides skip it: the opening stretch belongs to the undivided
        // house and is built below, before anybody is crowned or divided.
        skipOpeningHouse: true,
        splitSide: segment === 1 ? 'A' : 'B',
        splitOther: segment === 1 ? [...sideB] : [...sideA],
        splitPicks: picks.map(p => ({ ...p })) });
    } finally {
      gs.activePlayers = before;
    }
  };
  const weekA = playSide(sideA, hohA, 1);
  const weekB = playSide(sideB, hohB, 2);
  // Both halves are back in one building, minus the two who left it.
  const gone = new Set([weekA.evicted, weekB.evicted].filter(Boolean));
  gs.activePlayers = house.filter(n => !gone.has(n));

  // ── one episode ──
  const ep = weekToEpisode(weekA);
  ep.num = epNum;
  ep.twists = [...twists];
  ep.splitHouse = {
    crowning, hohs: [hohA, hohB],
    sides: { [hohA]: [...sideA], [hohB]: [...sideB] },
    picks,
    evicted: { [hohA]: weekA.evicted, [hohB]: weekB.evicted },
  };
  // The crowning is the one thing both halves shared, so it opens the episode
  // ahead of either side's week.
  // The order the night actually happened in: everybody together, then the
  // competition that crowns two, then the wall. The opening stretch was played
  // by the whole house so it sits ahead of the crowning rather than inside
  // side A's half, where it would read as something that happened behind a
  // wall that had not gone up yet.
  ep.acts = [
    ...(sharedOpener ? [sharedOpener] : []),
    { type: 'split-house', crowning, hohs: [hohA, hohB],
      // Aliased so the generic competition board can draw this the way it
      // draws any other HOH night: the house was told two crowns were on the
      // line and then never shown anybody winning them.
      competition: crowning, coHoh: hohB,
      sides: { [hohA]: [...sideA], [hohB]: [...sideB] }, picks,
      results: crowning.placements.map(n => ({ name: n, score: crowning.scores[n] })),
      socialBeats: [] },
    ...(weekA.acts || []).map(a => ({ ...a, segment: 1, side: hohA })),
    ...(weekB.acts || []).map(a => ({ ...a, segment: 2, side: hohB })),
  ];
  ep.votingLog = [
    ...(weekA.ballots || []).map(b => ({ voter: b.voter, voted: b.evict, changed: !!b.changed, segment: 1 })),
    ...(weekB.ballots || []).map(b => ({ voter: b.voter, voted: b.evict, changed: !!b.changed, segment: 2 })),
  ];
  ep.houseAtStart = [...house];
  ep.alsoEliminated = weekB.evicted;
  ep.doubleEviction = {
    hoh: weekB.hoh, nominees: [...(weekB.finalNominees || [])],
    vetoWinner: weekB.vetoWinner || null, evicted: weekB.evicted,
    votes: { ...(weekB.votes || {}) }, houseAtStart: [...sideB],
  };
  // Neither half's frozen bookend state is ever read back off the ledger.
  for (const w of [weekA, weekB]) { delete w.openingState; delete w.closingState; }

  ep.evictionInterview = generateBBEvictionInterview(ep, weekA);
  // TWO people left this house tonight, one from each side, and only the first
  // was being interviewed — the second walked straight past the chair. Each is
  // interviewed against their OWN side's week, because the vote that removed
  // them and the room that did it are different on each side of the wall.
  if (weekB.evicted) {
    ep.secondEvictionInterview =
      generateBBEvictionInterview(ep, weekB, Math.random, weekB.evicted);
  }
  carryGoodbyesToJury(ep, weekA.num);
  ep.summaryText = typeof window !== 'undefined' && window.generateSummaryText
    ? window.generateSummaryText(ep) : '';
  try { updateEditLayer(ep); } catch { /* the edit never blocks the week */ }
  gs.episodeHistory ||= [];
  gs.episodeHistory.push({
    ...ep,
    // What the fans thought AT THE END OF THIS WEEK.
    //
    // Nothing in the house ever wrote this, and snapshotGameState does not
    // carry popularity either, so every screen that asked an old episode how
    // popular somebody was fell through to the LIVE score and answered with
    // today's number. Week three and week eleven showed the same board, which
    // makes a per-week view of fan sentiment impossible to build and the
    // existing episode switcher silently useless.
    popularitySnapshot: { ...(gs.popularity || {}) },
    gsSnapshot: typeof window !== 'undefined' && window.snapshotGameState
      ? window.snapshotGameState() : null,
  });
  return ep;
}

/**
 * The messages the house recorded, following the evictee onto the jury.
 *
 * The house records these, the evictee watches them on the way out, and until
 * now that was the end of it: a houseguest could gloat into the camera and the
 * vote at the end of the season had never heard about it.
 *
 * A function rather than two copies because there are TWO paths that interview
 * somebody — the ordinary week and the Split House, which returns from its own
 * branch — and a feature wired into one of them is a feature that works for
 * half the season. That is the exact shape of bug this house keeps producing.
 */
function carryGoodbyesToJury(ep, weekNum) {
  for (const [iv, gone] of [[ep.evictionInterview, ep.eliminated],
    [ep.secondEvictionInterview, ep.alsoEliminated]]) {
    if (!iv?.goodbyes?.length || !gone || !isSeatedJuror(gone)) continue;
    try {
      const moved = applyGoodbyeMessages(gone, iv.goodbyes, weekNum);
      if (moved.length) iv.sentimentMoved = moved;
    } catch { /* the messages still played */ }
  }
}

export function simulateBBEpisode() {
  prepareHouse();
  // Not const: seating the Twin Twist can take a houseguest back OUT of the
  // house on night one. A season that cast both twins and declared them has one
  // of them in the storeroom from the start, and every downstream read — the
  // week's roster, `ep.houseAtStart`, the memory wall — has to be the house
  // that actually walked in.
  let house = (gs.activePlayers || []).filter(Boolean);
  if (house.length <= houseFinaleSize()) return null;

  // ── the season-long twist, installed once ──
  //
  // Not scheduled onto a week, because there is no week to schedule it on: it
  // is chosen on night one, before anybody has done anything worth sabotaging,
  // and it runs until it banks or gets caught. `bbSaboteur` is a season knob
  // rather than a twist-schedule entry for the same reason.
  if (seasonConfig.bbSaboteur && seasonConfig.bbSaboteur !== 'off' && !saboteurState()) {
    try {
      installBBSaboteur(house, {
        bankWeek: Number(seasonConfig.bbSaboteurBankWeek) || 5,
        rng: Math.random,
        // 'choose' means the user cast it themselves.
        pick: seasonConfig.bbSaboteur === 'choose' ? (seasonConfig.bbSaboteurPlayer || null) : null,
      });
    } catch { /* the season plays without one */ }
  }

  // Dynamic Duos: the shape of the whole season rather than a week's rule, so
  // it is seated on night one beside the other season-layer twists.
  if (seasonConfig.bbDuos && seasonConfig.bbDuos !== 'off' && !gs.bb?.duos) {
    try {
      // 'on' is the BB13 shape and stays the default meaning, so a season
      // saved before the mode existed plays exactly as it did. 'pairs' is the
      // other game: no keys, and orphans chained to each other instead.
      const seated = installDuos(house, {
        keyAt: Number(seasonConfig.bbDuosKeyAt) || 10,
        goldenKey: seasonConfig.bbDuos !== 'pairs',
        rng: Math.random,
      });
      // A duo is a DECLARED relation, so a cast built without any cannot play
      // this — and failing silently would leave a season labelled Dynamic Duos
      // that never once nominated a pair. Recorded where the Run tab can say it.
      if (!seated) {
        gs.bb.duosBlocked = 'This cast has fewer than two declared relationships, so Dynamic Duos '
          + 'cannot run. Pair houseguests up on the Relationships tab — siblings, exes, married, '
          + 'worked together — and the twist will seat itself on night one.';
      }
    } catch { /* the season plays without one */ }
  }

  // The other season-layer twist, seated the same way and for the same reason:
  // it is chosen on night one and there is no week to schedule it on.
  if (seasonConfig.bbTwins && seasonConfig.bbTwins !== 'off' && !twinState()) {
    try {
      installTwinTwist(house, {
        // Weeks survived, as the show plays it: last this long without being
        // found out or evicted and both of them are in. The jobs pay money and
        // risk exposure; they are not the way in.
        weeks: Number(seasonConfig.bbTwinsWeeks) || 5,
        quota: Number(seasonConfig.bbTwinsQuota) || 3,
        rng: Math.random,
        pick: seasonConfig.bbTwins === 'choose' ? (seasonConfig.bbTwinsPlayer || null) : null,
      });
    } catch { /* the season plays without one */ }
    // Re-read, in case the second twin was one of the people standing here a
    // moment ago.
    house = (gs.activePlayers || []).filter(Boolean);
  }

  // The cast twist. Seated on night one like the other two, but it owns one
  // WEEK rather than a season: the three who walk in late cannot play for the
  // first crown, cannot be nominated, and hand the house to one of the last two
  // standing. After that it is a season with three live grudges in it.
  if (seasonConfig.bbRivals && seasonConfig.bbRivals !== 'off' && !rivalsState()) {
    try {
      installRivals(house, {
        count: Number(seasonConfig.bbRivalsCount) || 3,
        rng: Math.random,
        // 'declared' means only use pairs the cast actually named; 'auto' lets
        // it fill the gaps from whoever gets on worst.
        allowGuess: seasonConfig.bbRivals === 'auto',
      });
    } catch { /* the season plays without one */ }
    // They are not in the house yet — the premise is that the room is already a
    // room when they walk in, so seating the twist takes them off the roster
    // and `openRivals` puts them back once the rule has been read out.
    house = (gs.activePlayers || []).filter(Boolean);
  }

  const weekNum = (gs.bb.weeks?.length || 0) + 1;
  // The EPISODE number is the show's count, and it is continuous. A double
  // eviction pushes two records into the weeks ledger but airs as one
  // episode, so numbering episodes off the ledger skipped a number after
  // every double (episode 3, then 5). The schedule is authored in episodes,
  // so the twist lookup uses the episode count too.
  const epNum = (gs.episodeHistory?.length || 0) + 1;
  const twists = bbTwistsForWeek(epNum);

  // A distributor's cargo is configured on its SCHEDULED INSTANCE — that is
  // what makes Pandora's Box replayable across seasons with different prizes
  // and no new code. The entry's `prize` field is set in the Format Designer.
  const boxEntry = (seasonConfig.twistSchedule || [])
    .find(t => t && Number(t.episode) === epNum && t.type === 'bb-pandoras-box');
  // The double eviction has three shapes, chosen on the scheduled entry:
  // 'fast-forward' (the US live hour — a compressed second cycle),
  // 'week-in-one' (BB5/6 — a second FULL cycle inside the same episode),
  // and 'double-vote' (the international night — one vote over three
  // nominees, the two highest evict-getters both walk).
  const deEntry = (seasonConfig.twistSchedule || [])
    .find(t => t && Number(t.episode) === epNum && t.type === 'bb-double-eviction');
  const deStyle = deEntry?.deStyle || 'fast-forward';
  // The Battle Back's shape and its competition are both authored on the
  // scheduled instance, the same way Pandora's cargo and the double's style
  // are — so one season can run the BB18 gauntlet and the next the Showdown.
  const bbEntry = (seasonConfig.twistSchedule || [])
    .find(t => t && Number(t.episode) === epNum && t.type === 'bb-battle-back');
  // Which temptation is on the table. Same per-entry pattern, and it reads the
  // power registry, so a power added to the shelf is offerable here for free.
  // Which powers are behind the three doors. Same per-entry pattern, read off
  // the power registry, so a new power is competable for with no new UI.
  // Which shape America's Nominee runs in. week.js has read
  // options.americasNomineeStyle since the twist was written and NOTHING ever
  // set it, so the MVP variant was unreachable and its whole event family —
  // the house watching the actual culprit overplay their innocence — was dead
  // code that no amount of reweighting could have revived.
  // What is behind the cereal. Read off the power registry like the box and
  // the shelf, so a new power is hideable with no new UI.
  const hpEntry = (seasonConfig.twistSchedule || [])
    .find(t => t && Number(t.episode) === epNum && t.type === 'bb-hidden-power');
  const anEntry = (seasonConfig.twistSchedule || [])
    .find(t => t && Number(t.episode) === epNum && t.type === 'bb-americas-nominee');
  const whackEntry = (seasonConfig.twistSchedule || [])
    .find(t => t && Number(t.episode) === epNum && t.type === 'bb-whacktivity');
  const spcEntry = (seasonConfig.twistSchedule || [])
    .find(t => t && Number(t.episode) === epNum && t.type === 'bb-secret-power-comp');
  const denEntry = (seasonConfig.twistSchedule || [])
    .find(t => t && Number(t.episode) === epNum && t.type === 'bb-den-of-temptation');
  // The audience channel: which shape it runs, and what it is stocked with.
  const cpEntry = (seasonConfig.twistSchedule || [])
    .find(t => t && Number(t.episode) === epNum && t.type === 'bb-care-package');

  // ══════════════════════════════════════════════════════════════════
  // The Split House
  // ══════════════════════════════════════════════════════════════════
  //
  // Two Heads of Household are crowned in ONE competition over the whole
  // house, they pick their own sides schoolyard-style, and then the two halves
  // play complete, separate weeks — nominations, veto, campaign, vote — with
  // no contact until eviction night, when one houseguest leaves from each.
  //
  // The isolation is not a rule the week engine reads. It falls out of running
  // that engine twice over two DISJOINT houses: every event, every bond, every
  // piece of knowledge in a cycle is drawn from the house it was handed, so a
  // houseguest on the other side is not somebody the engine can reach. That is
  // the whole design, and the reason this is the slice that stress-tests it.
  const splitScheduled = twists.includes('bb-split-house');
  // Ten is the floor: two sides of five, each needing an HOH, two nominees and
  // somebody left to vote.
  const splitPossible = splitScheduled && house.length >= 10
    && !twists.includes('bb-double-eviction') && !twists.includes('bb-instant-eviction')
    && !(seasonConfig.bbSafetyMode && seasonConfig.bbSafetyMode !== 'off');
  if (splitScheduled && splitPossible) {
    return simulateSplitHouseEpisode({ house, epNum, twists });
  }

  const week = simulateBBWeek({
    // Both libraries default to empty inside the engine, so a season that does
    // not hand them over runs silent and falls back to one-line competitions.
    houseEvents: HOUSE_EVENTS,
    competitions: BB_COMPETITIONS,
    twists,
    forcedCompetitions: bbForcedCompsForWeek(epNum),
    battleBackStyle: bbEntry?.bbStyle || 'gauntlet',
    battleBackCompetition: bbFindCompetition(bbEntry?.bbComp),
    pandorasPrize: boxEntry?.prize || undefined,
    temptationOffer: denEntry?.offer || 'random',
    americasNomineeStyle: anEntry?.anStyle === 'mvp' ? 'mvp' : 'direct',
    hiddenPowerId: hpEntry?.hidden || 'the-cloud',
    whacktivityDoors: whackEntry?.doors || 'auto',
    // The secret power competition authors its doors the same way.
    secretPowerDoors: spcEntry?.doors || 'auto',
    // Which package the audience is voting over. 'auto' runs the show's
    // rotation; a package id books that one onto this week, which is the whole
    // point of the twist being a distributor rather than a fixed schedule.
    carePackageForced: cpEntry?.package || null,
    // Which shape the audience channel runs this week: the Time Capsule's
    // challenge (default) or BB18's straight delivery.
    carePackageStyle: cpEntry?.cpStyle || 'time-capsule',
    // What the audience is voting over. 'all' stocks the whole inventory; a
    // power id stocks just that one, which is how a season books a specific
    // power onto a specific week.
    appStoreShelf: ((seasonConfig.twistSchedule || [])
      .find(t => t && Number(t.episode) === epNum && t.type === 'bb-app-store')?.shelf) || undefined,
    doubleVote: twists.includes('bb-double-eviction') && deStyle === 'double-vote',
    // Season modes that put a third houseguest on the block every week.
    safetyMode: seasonConfig.bbSafetyMode || 'off',
    safetyStopsAt: Number.isFinite(Number(seasonConfig.bbSafetyStopsAt))
      ? Number(seasonConfig.bbSafetyStopsAt) : undefined,
    haveNotCount: seasonConfig.bbHaveNotCount === 'auto' ? 0 : Number(seasonConfig.bbHaveNotCount) || 0,
    departures: seasonConfig.bbDepartures || 'off',
  });

  const ep = weekToEpisode(week);
  ep.num = epNum;
  ep.twists = [...twists];
  ep.haveNots = week.haveNots ? [...week.haveNots] : [];
  ep.instantEviction = twists.includes('bb-instant-eviction');
  ep.safetyMode = week.safetyMode || null;
  ep.safetyWinner = week.safetyWinner || null;
  ep.blockBeforeSafety = week.blockBeforeSafety ? [...week.blockBeforeSafety] : [];
  ep.departure = week.departure ? { ...week.departure } : null;
  ep.maintenanceErrors = [...(week.maintenanceErrors || [])];
  ep.openingState = week.openingState || null;
  ep.openingDeals = (week.openingDeals || []).map(d => ({ ...d }));
  ep.closingState = week.closingState || null;

  // ── Double eviction: a second, compressed cycle the same night ──
  // A separate week record, because it genuinely is one — the stats, the jury
  // and the competition history all have to see two HOHs and two evictions —
  // but a single episode, because that is how it is watched.
  if (deStyle === 'double-vote' && week.secondEvicted) {
    ep.alsoEliminated = week.secondEvicted;
    ep.doubleEvictionStyle = 'double-vote';
  }
  // Held outside the block so the second evictee's interview can be written
  // against the cycle that actually removed them.
  let secondWeek = null;
  if (twists.includes('bb-double-eviction') && deStyle !== 'double-vote'
    && (gs.activePlayers || []).length > Math.max(4, houseFinaleSize())) {
    const second = simulateBBWeek({
      houseEvents: HOUSE_EVENTS,
      competitions: BB_COMPETITIONS,
      // The week-in-one runs the second cycle at FULL length — house life,
      // real campaigning — inside the same episode; the fast-forward keeps
      // the live-hour compression.
      compressed: deStyle !== 'week-in-one',
      segment: 2,
      // A three-nominee season is a three-nominee season, including the half
      // of the night that runs live.
      safetyMode: seasonConfig.bbSafetyMode || 'off',
      safetyStopsAt: Number.isFinite(Number(seasonConfig.bbSafetyStopsAt))
        ? Number(seasonConfig.bbSafetyStopsAt) : undefined,
    });
    ep.doubleEviction = {
      hoh: second.hoh,
      nominees: [...(second.finalNominees || [])],
      vetoWinner: second.vetoWinner || null,
      evicted: second.evicted,
      votes: { ...(second.votes || {}) },
      houseAtStart: [...(second.houseAtStart || [])],
    };
    ep.alsoEliminated = second.evicted;
    ep.doubleEvictionStyle = deStyle;
    ep.acts = [...(ep.acts || []), ...(second.acts || []).map(a => ({ ...a, segment: 2 }))];
    ep.votingLog = [
      ...(ep.votingLog || []),
      ...(second.ballots || []).map(b => ({ voter: b.voter, voted: b.evict, changed: !!b.changed, segment: 2 })),
    ];
    // Same as the main week below: the second cycle's bookend snapshots are
    // never read back off the ledger.
    delete second.openingState;
    delete second.closingState;
    secondWeek = second;
  }
  // The aftermath of a Big Brother week is one person, interviewed on the way
  // out, finding out what was actually happening around them.
  ep.evictionInterview = generateBBEvictionInterview(ep, week);
  // And the second eviction of a double gets its own chair for the same
  // reason. `secondWeek` is the compressed cycle when there was one; a
  // double-vote night removes both from the SAME week, so that record is the
  // right context for both interviews.
  if (ep.alsoEliminated) {
    ep.secondEvictionInterview = generateBBEvictionInterview(
      ep, secondWeek || week, Math.random, ep.alsoEliminated);
  }
  carryGoodbyesToJury(ep, week.num);
  // The shared text backlog owns transcripts for both shows, so a Big Brother
  // week is written by the same system that writes a Total Drama episode.
  ep.summaryText = typeof window !== 'undefined' && window.generateSummaryText
    ? window.generateSummaryText(ep)
    : summariseWeek(week);

  // The episode record now owns the bookend snapshots; the weeks ledger only
  // ever gets read back for its scalars, ballots and alliance changes, so a
  // quarter-megabyte of frozen feelings per week was being serialized again
  // by every save, checkpoint and replay that carries gs.bb.
  delete week.openingState;
  delete week.closingState;

  // The edit: what the audience saw of this week. Total Drama runs this at
  // every episode-complete site in episode.js; this is the house's.
  try { updateEditLayer(ep); } catch { /* the edit never blocks the week */ }

  gs.episodeHistory ||= [];
  gs.episodeHistory.push({
    ...ep,
    // What the fans thought AT THE END OF THIS WEEK.
    //
    // Nothing in the house ever wrote this, and snapshotGameState does not
    // carry popularity either, so every screen that asked an old episode how
    // popular somebody was fell through to the LIVE score and answered with
    // today's number. Week three and week eleven showed the same board, which
    // makes a per-week view of fan sentiment impossible to build and the
    // existing episode switcher silently useless.
    popularitySnapshot: { ...(gs.popularity || {}) },
    gsSnapshot: typeof window !== 'undefined' && window.snapshotGameState
      ? window.snapshotGameState() : null,
  });
  return ep;
}

/**
 * A plain-text transcript of the week.
 *
 * Every act, every social beat, in order — the same standard the Total Drama
 * side holds itself to, so a week is readable without the visual player.
 */
/**
 * The competition itself, beat by beat.
 *
 * Without this the transcript records only who won, which throws away the part
 * of the week the competition library exists to produce — who led and lost it,
 * who threw it, who choked with the yard silent.
 */
function _competition(line, comp) {
  if (!comp) return;
  line(`  ${comp.name}${comp.category ? ` (${comp.category})` : ''}`);
  for (const b of comp.beats || []) line(`    · ${b.text}`);
}

export function summariseWeek(week) {
  const lines = [];
  const line = t => lines.push(t);
  line(`WEEK ${week.num}`);
  line('═'.repeat(40));

  // Where the alliances stand and which member is on their way out of one.
  // The week's own snapshot, so a replay reads what was true then rather than
  // recomputing off bonds that have moved on since.
  if ((week.allianceBoard || []).length) {
    line('');
    line('THE ALLIANCE BOARD');
    for (const b of week.allianceBoard) {
      const kind = b.kind === 'couple' ? 'showmance' : 'alliance';
      line(`  ${b.name || 'an unnamed group'} (${kind}, ${b.members.length} votes, avg ${b.average.toFixed(1)}):`);
      line(`    ${b.members.map(m => `${m.name} ${m.loyalty.toFixed(1)}`).join('   ')}`);
      if (b.weakest) line(`    CRACK: ${b.weakest.name} — ${b.weakest.reason}.`);
    }
  }

  for (const act of week.acts || []) {
    switch (act.type) {
      // NOTE: no 'split-house' case here on purpose. That act lives on the
      // EPISODE and neither half-week carries it, so a branch here could never
      // fire on a real season — it read as coverage and was doing nothing. The
      // in-app backlog is built from the episode and does write it in full.
      case 'hoh':
        line('');
        line(act.secret ? 'HEAD OF HOUSEHOLD — RESULT SEALED'
          : act.preCrowned ? 'HEAD OF HOUSEHOLD — CROWNED BEFORE THE SPLIT'
            : 'HEAD OF HOUSEHOLD');
        _competition(line, act.competition);
        if (act.secret) {
          line('  The result is not revealed. Only the winner knows who holds power.');
          line(`  (Viewer only: ${act.winner} is the Invisible HOH.)`);
        } else {
          line(`  ${act.winner} wins Head of Household.`);
        }
        (act.results || []).filter(r => r.threw).forEach(r => line(`  ${r.name} threw the competition.`));
        break;
      case 'power-played': {
        line('');
        line(`${(act.name || 'A POWER').toUpperCase()} IS PLAYED`);
        line(`  ${act.holder} has been holding it${act.secret ? ', and nobody knew' : ''}.`);
        if (act.detail) line(`  ${act.detail}`);
        if ((act.removed || []).length) {
          line(`  Off the block: ${act.removed.join(' and ')}.`);
          line(`  Named instead: ${(act.nominees || []).join(' and ') || '—'}.`);
        }
        break;
      }
      case 'hacker': {
        line('');
        line('THE HACKER — PLAYED ALONE, RESULT SEALED');
        _competition(line, act.competition);
        line('  The winner is told in private and is never named to the house.');
        if (act.blockHack) {
          line(`  The block is hacked: ${act.blockHack.down} comes down, ${act.blockHack.up} goes up.`);
          if (act.blockHack.why) line(`  ${act.blockHack.why}`);
          line(`  ${act.blockHack.down} is NOT safe — the veto ceremony can seat them again.`);
        } else {
          line('  The block is left exactly as the Head of Household made it.');
        }
        break;
      }
      case 'hacker-vote': {
        line('');
        line('A VOTE IS CANCELLED');
        line(`  ${act.voter}'s ballot is nullified before the count — ${act.voter} was voting to evict ${act.wouldHaveVoted}.`);
        line(`  ${act.flips ? 'It changes who leaves tonight.'
          : act.levels ? 'It levels the count, and the tie is the Head of Household\'s to break.'
            : 'It does not change who leaves tonight.'}`);
        line('  The house hears a count one short of the number of people who believe they voted.');
        break;
      }
      case 'roadkill': {
        line('');
        line('BB ROADKILL — PLAYED ALONE, RESULT SEALED');
        _competition(line, act.competition);
        line('  The winner is told in private. Nobody else is told anything.');
        line(`  A third key turns: ${act.nominee} is nominated, with no name attached to it.`);
        break;
      }
      case 'nominations':
        line('');
        line(act.anonymous ? 'NOMINATION CEREMONY — READ BY BIG BROTHER'
          : act.byCoHoh ? `NOMINATION CEREMONY — ${act.hoh}` : 'NOMINATION CEREMONY');
        line(`  Nominated: ${(act.nominees || []).join(' and ')}.`);
        // A chair the Head of Household did not fill is still on the block, but
        // saying "nominated by" without this reads as if they chose all three.
        if (act.curseChair) line(`  ${act.curseChair} nominated THEMSELVES — the curse, not the Head of Household.`);
        if (act.roadkillChair) line(`  ${act.roadkillChair} was named by the Roadkill winner, not the Head of Household.`);
        if (act.anonymous) line('  No speech, no reasons: the keys turned on their own.');
        break;
      case 'battle-of-the-block': {
        line('');
        line('THE BATTLE OF THE BLOCK');
        for (const owner of act.hohs || []) {
          line(`  ${owner}'s block: ${(act.pairs?.[owner] || []).join(' and ')}.`);
        }
        _competition(line, act.competition);
        line(`  ${(act.saved || []).join(' and ')} win, and come off the block.`);
        line(`  ${act.dethroned} is DETHRONED — no longer Head of Household, and no longer safe.`);
        line(`  ${act.reigning} keeps the power, and ${(act.stuck || []).join(' and ')} stay nominated.`);
        break;
      }
      case 'veto':
        line('');
        line('POWER OF VETO');
        line(`  Played by: ${(act.participants || []).join(', ')}.`);
        if (act.hacked) {
          line(`  ${act.hacked.pick} plays with no chip drawn for them — the hacker took ${act.hacked.replaced}'s seat and gave it away.`);
        }
        if (act.drawTwist) {
          const dt = act.drawTwist;
          line(dt.kind === 'redraw' ? '  THE VETO REDRAW' : '  THE VETO REPLACEMENT');
          line(`    Drawn: ${(dt.before || []).join(', ')}.`);
          if (!dt.changed) line('    The bag returns the same three names. Nothing changes.');
          else {
            line(`    Out: ${(dt.lost || []).join(', ')}. In: ${(dt.gained || []).join(', ')}.`);
            if (dt.selfSeat) line(`    ${dt.holder} put ${dt.holder} into the competition.`);
            else if (!dt.anonymous && dt.holder) line(`    ${dt.holder} chose both names.`);
          }
        }
        _competition(line, act.competition);
        if (act.orderOnly) {
          line(`  ${act.winner} wins the competition — which this week awards the LAST PICK,`);
          line('  not the veto. The order runs from the worst finish to the best:');
          line(`  ${(act.pickOrder || []).join(' → ')}.`);
        } else {
          line(`  ${act.winner} wins the Power of Veto.`);
        }
        break;
      case 'pandoras-box':
        line('');
        line("PANDORA'S BOX");
        line(act.opened
          ? `  ${act.hoh} opens the box, and pays for it in ${act.consequenceName || 'public'};`
            + ` ${act.hoh} claims it held ${act.publicClaim}.`
          : `  ${act.hoh} leaves the box closed.`);
        break;
      case 'diamond-detonation':
        line('');
        line('DIAMOND POWER OF VETO — DETONATED');
        line(`  ${act.holder} reveals the secret power live: ${act.saved} comes off the block, and ${act.replacement} takes the empty chair.`);
        break;
      case 'app-store':
        line('');
        line('THE APP STORE');
        line(`  On the shelf: ${(act.shelf || []).join(', ')}.`);
        line(`  The audience votes. ${(act.winners || []).length} power${
          (act.winners || []).length === 1 ? '' : 's'} leave the shelf and the house is told only that somebody out there is now holding something.`);
        line('  Who won what is not public. The Debug panel owns the truth.');
        break;
      case 'coin-of-destiny': {
        line('');
        line('THE COIN OF DESTINY');
        line(`  Bought in: ${(act.buyers || []).join(', ') || 'nobody'}.`);
        line(`  ${act.winner} wins the game and is taken away to call it.`);
        line(act.calledRight
          ? `  The call is right. The nominations are taken off ${act.hoh}: ${(act.nominees || []).join(' and ')} go up.`
          : '  The call is wrong. Nothing changes, and everybody still knows who paid to try.');
        line('  The house is never told who called it.');
        break;
      }
      case 'second-veto': {
        line('');
        line(act.kind === 'secret' ? 'THE SECOND MEDALLION' : 'THE SECOND VETO');
        if (!act.used) {
          line(`  ${act.anonymous ? 'It is not used.' : `${act.holder} does not use it.`}`);
        } else if (act.anonymous) {
          line(`  ${act.saved} comes off the block and ${act.replacement} goes up.`);
          line('  The house is never told whose hand did it.');
        } else {
          line(`  ${act.holder} uses it on ${act.saved}. ${act.replacement} goes up instead.`);
        }
        break;
      }
      case 'team-america': {
        line('');
        line('TEAM AMERICA');
        line(`  Mission ${act.missionNumber}: ${act.mission.name}.`);
        line(`  ${act.mission.done ? 'Complete' : 'Failed'}${act.mission.noticed
          ? ' — and the house noticed it was being steered.' : '.'}`);
        if (act.mission.effect?.note) line(`  ${act.mission.effect.note}`);
        break;
      }
      case 'camp-comeback': {
        line('');
        line('CAMP COMEBACK');
        line(`  ${act.arrival} is evicted and does not leave. Camp: ${(act.camp || []).join(', ')}.`);
        if (act.full) line('  Camp is full. The door opens.');
        break;
      }
      case 'camp-return': {
        line('');
        line('THE CAMP COMEBACK DOOR');
        line(`  ${(act.played || []).join(', ')} play for one place back in the game.`);
        line(`  ${act.winner} returns. ${(act.gone || []).join(', ')} leave for good.`);
        break;
      }
      case 'prize-exchange': {
        line('');
        line('PRIZES AND PUNISHMENTS');
        line(`  Pick order: ${(act.order || []).join(', ')}.`);
        for (const s of act.steals || []) {
          line(`  ${s.thief} steals ${s.item} from ${s.victim}.`);
        }
        line(`  The Power of Veto ends with ${act.vetoHolder}.`);
        if (act.punished?.length) {
          line(`  Punishments: ${act.punished.map(p => `${p.name} (${p.punishment})`).join(', ')}.`);
        }
        break;
      }
      case 'safety-suite': {
        line('');
        line('THE SAFETY SUITE');
        line(`  Entered: ${(act.entrants || []).join(', ') || 'nobody'}.`);
        if (act.exhausted?.length) line(`  Out of entries for the season: ${act.exhausted.join(', ')}.`);
        if (!act.winner) {
          line(act.entrants?.length ? '  Nobody beats the clock. The entries are spent and nobody is safe.'
            : '  The suite goes unused.');
        } else {
          line(`  ${act.winner} beats the clock and is safe.`);
          if (act.plusOne) line(`  Plus One: ${act.plusOne}, safe, with ${act.punishmentLabel} for it.`);
        }
        break;
      }
      case 'time-capsule': {
        line('');
        line('THE BB TIME CAPSULE');
        line(`  America votes ${act.favourite} into the capsule.`);
        if (act.challenge) line(`  Tonight's challenge: ${act.challenge.name}.`);
        if (act.won) {
          line('  The challenge is beaten. Something from a past season comes out with them,');
          line('  and the house is told only that the capsule was beaten.');
        } else {
          line(`  ${act.challenge?.name || 'The challenge'} beats them, and they come out `
            + `${act.punishmentVerb || 'wearing'} ${act.punishment}.`);
          if (act.tetheredTo) line(`  ${act.tetheredTo} is tied to them until it comes off.`);
        }
        if (act.ineligible?.length) line(`  Already been in: ${act.ineligible.join(', ')}.`);
        break;
      }
      case 'care-package': {
        line('');
        line("AMERICA'S CARE PACKAGE");
        line(`  This week's package: ${act.package}. ${act.blurb}`);
        line(`  ${act.catch}`);
        line(`  The audience votes it to ${act.recipient}, and the house is told out loud.`);
        if (act.ineligible?.length) {
          line(`  Already had one and can never have another: ${act.ineligible.join(', ')}.`);
        }
        if (act.coNominee) line(`  As Co-Head of Household, ${act.recipient} names ${act.coNominee}.`);
        break;
      }
      case 'care-package-play': {
        line('');
        line(`THE CARE PACKAGE IS SPENT — ${act.package}`);
        if (act.blocked?.length) {
          line(`  ${act.recipient} strikes the votes of ${act.blocked.join(' and ')}, by name and in public.`);
        }
        if (act.bribe) {
          line(act.bribe.taken
            ? `  $${act.bribe.amount.toLocaleString()} changes hands. A vote moves to ${act.bribe.evict}, and the house is never told whose.`
            : `  $${act.bribe.amount.toLocaleString()} is refused, and ${act.bribe.mark} keeps what the offer gave away instead.`);
        }
        break;
      }
      case 'americas-nominee': {
        line('');
        line("AMERICA'S NOMINEE");
        line(act.style === 'mvp'
          ? '  The audience has voted a Most Valuable Player, and only that houseguest is told.'
          : '  The audience has named a third nominee. Nobody in the house had a vote.');
        line(`  A third key turns: ${act.nominee} is nominated.`);
        line('  If the veto saves them, the chair empties. There is no replacement.');
        break;
      }
      case 'halting-hex': {
        line('');
        line('THE EVICTION IS CANCELLED');
        line(`  ${act.holder} plays the Halting Hex${act.selfSave ? ' on themselves' : ` on ${act.spared}`}.`);
        line(`  ${act.spared} was leaving. Nobody leaves. ${(act.nominees || []).join(' and ')} come off the block.`);
        line('  The votes were read out and they no longer decide anything.');
        break;
      }
      case 'power-expired':
        line('');
        line('WHAT QUIETLY LEFT THE GAME');
        for (const x of act.expired || []) {
          line(`  ${x.name} — ${x.holder} ${x.reason === 'holder-evicted'
            ? 'took it out of the front door with them.'
            : `held it since week ${x.heldSince} and never played it.`}`);
        }
        line('  Told to nobody in the house. This note is for the viewer.');
        break;
      case 'hidden-power': {
        line('');
        if (act.phase === 'hidden') {
          line('SOMETHING IN THIS HOUSE');
          line(`  ${act.power} is hidden somewhere in the building. No clue, no competition, no map.`);
          line('  Where it is, is not public — and neither is who finds it.');
          break;
        }
        if (act.phase === 'expired') {
          line('NEVER FOUND');
          line('  The fuse runs out with it still where it was put. Nobody in that house ever learned it existed.');
          break;
        }
        line(act.found ? 'FOUND IT' : 'THE HOUSE IS LOOKING');
        line(`  Searching this week: ${(act.searchers || []).join(', ') || 'nobody'}.`);
        if (act.found) line('  Somebody found it. Who, and what it is, stays off this page.');
        break;
      }
      case 'interrogation': {
        line('');
        line('THE INTERROGATION');
        line(`  ${act.deposed} was dethroned by ${act.caught ? act.holder : 'somebody'}.`);
        line(act.caught
          ? `  ${act.deposed} named ${act.holder} correctly and keeps the week. The power is spent for nothing.`
          : `  ${act.deposed} named the wrong houseguest. ${act.holder} is Head of Household and nobody knows.`);
        break;
      }
      case 'mystery-competitor': {
        line('');
        line('THE MYSTERY COMPETITOR');
        line(`  ${act.guest} entered the veto draw on ${act.holder}'s behalf${act.displaced ? `, bumping ${act.displaced}` : ''}.`);
        line(act.won ? `  ${act.guest} won it. The veto belongs to ${act.holder}.`
          : `  ${act.guest} lost. ${act.holder} bought a body in the draw and nothing else.`);
        break;
      }
      case 'second-veto-ceremony': {
        line('');
        line('THE SECOND VETO MEETING');
        line(`  ${act.holder} used a veto nobody knew existed. ${act.saved} comes off the block.`);
        if (act.replacement) line(`  Replacement: ${act.replacement}.`);
        break;
      }
      case 'mystery-veto': {
        line('');
        line('THE MYSTERY VETO');
        line(`  ${act.holder} called a second veto competition with one player in it.`);
        line(act.won ? `  Won alone. ${act.saves ? `${act.saves} comes off the block.` : ''}`
          : '  Lost alone. Nobody was in the way and it was still lost.');
        break;
      }
      case 'secret-power-comp': {
        line('');
        line('THE SECRET POWER COMPETITION');
        line('  Three powers hidden inside the Head of Household. Every houseguest chose, in');
        line('  private, whether they were playing for the crown or for one of them.');
        for (const r of act.rooms || []) {
          const who = (r.entrants || []).length ? r.entrants.join(', ') : 'nobody';
          if (!r.winner) { line(`  ${r.name}: UNCLAIMED — ${who} went for it.`); continue; }
          line(`  ${r.name}: ${r.winner} (${who}).`);
        }
        if (act.winner) line(`  Head of Household: ${act.winner}, out of those who were running for it.`);
        else line('  Nobody won the Head of Household outright — the whole yard was chasing a door.');
        line('  The house is told none of this. Every power won here dies when the jury opens.');
        break;
      }
      case 'no-eviction': {
        line('');
        line('NO EVICTION');
        line('  No nomination ceremony, no veto, no vote. The house is the same size on Thursday.');
        break;
      }
      case 'whacktivity': {
        line('');
        line('THE WHACKTIVITY COMPETITIONS');
        for (const r of act.rooms || []) {
          const who = r.entrants.length ? r.entrants.join(', ') : 'nobody';
          if (!r.opened) { line(`  ${r.power}: DID NOT OPEN — ${who} had picked it.`); continue; }
          line(`  ${r.power}: OPENED — ${who}${r.entrants.length ? ` (${r.entrants.length} of 5)` : ''}.`);
          if (r.soloFailed) line('    Entered alone and did not beat it. The power goes unclaimed.');
        }
        if ((act.satOut || []).length) line(`  Sat out entirely: ${act.satOut.join(', ')}.`);
        line('  Who won what is not public — the house is told only that the competitions happened.');
        break;
      }
      case 'temptation': {
        line('');
        line('THE DEN OF TEMPTATION');
        line(`  The audience sends ${act.entrant} into the Den and offers ${act.power} for nothing.`);
        if (!act.accepted) {
          line('  REFUSED. No power changes hands and no curse enters the house.');
          break;
        }
        line(`  ACCEPTED — in secret. ${act.entrant} holds ${act.power} and the house is never told.`);
        line(`  ${act.curse.name} enters the house. Who it lands on is drawn at the nomination ceremony.`);
        for (const g of act.guesses || []) {
          line(`  ${g.who} suspects ${g.guess}${g.correct ? ' — and is right.' : ' — and is wrong.'}`);
        }
        break;
      }
      case 'temptation-curse':
        line('');
        if (act.missed) {
          line('THE CURSE FINDS NOBODY');
          line('  Everybody still eligible is protected. The curse has nowhere to land, and whoever took the temptation got it for free.');
          break;
        }
        line(`THE CURSE — ${act.cursed} NOMINATES THEMSELVES`);
        line(`  ${act.cursed} takes the third chair. Nobody put them there and nobody can be blamed for it.`);
        break;
      case 'bonus-life': {
        line('');
        if (!act.fired) {
          line('THE BONUS LIFE — NOT PLAYED');
          line(`  ${act.holder} is holding a Bonus Life and lets ${act.evicted} walk without it.`);
          break;
        }
        line(`THE BONUS LIFE${act.auto ? ' — THE FUSE RUNS OUT' : ''}`);
        if (act.auto) {
          line(`  ${act.holder} never played it. The window closes tonight, so it activates by default on ${act.beneficiary}.`);
        } else if (act.self) {
          line(`  ${act.holder} is the one evicted, and plays the Bonus Life to stay in the game.`);
        } else {
          line(`  ${act.holder} plays the Bonus Life on ${act.beneficiary}.`);
        }
        line(`  ${act.beneficiary} plays the re-entry competition alone: ${act.competition.score} against a standard of ${act.competition.standard}.`);
        if (act.returned) {
          line(`  ${act.returned} WINS AND RE-ENTERS THE HOUSE — the eviction is reversed, with no immunity.`);
          if ((act.grudges || []).length) line(`  Still in the house and on the record voting ${act.returned} out: ${act.grudges.join(', ')}.`);
        } else {
          line(`  ${act.beneficiary} FAILS the re-entry competition and leaves for good.`);
        }
        break;
      }
      case 'battle-back': {
        line('');
        line(`BATTLE BACK — ${act.style === 'showdown' ? 'THE SHOWDOWN' : 'THE GAUNTLET'}`);
        line(`  ${act.contenders.join(', ')} compete for the right to re-enter${
          act.competition?.name ? ` on ${act.competition.name}` : ''}.`);
        for (const r of act.rounds || []) {
          if (r.kind === 'heat') {
            line(`  ${r.label}: ${(r.results || []).map((x, i) => `${i + 1}. ${x.name}`).join('  ')}`);
          } else {
            line(`  ${r.label}: ${r.a} vs ${r.b} — ${r.winner} advances.`);
          }
        }
        if (act.champion) line(`  The house elects ${act.champion.name} to defend the door (${act.champion.votes} votes).`);
        if (act.returned) {
          line(`  ${act.returned} WINS AND RE-ENTERS THE HOUSE — with no immunity.`);
          if ((act.grudges || []).length) line(`  Still in the house and on the record voting ${act.returned} out: ${act.grudges.join(', ')}.`);
        } else {
          line(`  Nobody re-enters. ${act.champion ? `${act.champion.name} held the door.` : 'The door stays shut.'}`);
        }
        if ((act.eliminatedForGood || []).length) line(`  Eliminated for good: ${act.eliminatedForGood.join(', ')}.`);
        break;
      }
      case 'twist-announcement':
        line('');
        line('TWIST ANNOUNCEMENT');
        for (const a of act.announced || []) {
          line(`  ${a.name.toUpperCase()}: ${a.rule}`);
          if (a.sting) line(`  ${a.sting}`);
        }
        break;
      case 'veto-ceremony':
        line('');
        line('VETO CEREMONY');
        if (act.diamond) line(`  DIAMOND POWER OF VETO — if used, the veto holder (${act.holder}), not the Head of Household, names the replacement.`);
        if (act.used) {
          line(`  The veto is used on ${act.saved}.`);
          if (act.replacement) line(`  ${act.replacement} is named as the replacement nominee${act.diamond ? ` — by ${act.chairAuthority}, under the Diamond Veto` : ''}.`);
        } else {
          line('  The veto is not used. Nominations stay the same.');
        }
        break;
      case 'campaign':
        line('');
        line('CAMPAIGNING');
        (act.events || []).forEach(e => {
          line(`  ${e.pitcher} campaigns to evict ${e.pitchTarget}.`);
          if (e.reactionSummary) line(`    ${e.reactionSummary}`);
          for (const reaction of e.reactions || []) if (reaction.narration?.text) line(`    ${reaction.narration.text}`);
        });
        for (const change of act.changed || []) line(`  ${change.voter}'s vote moves from ${change.from} to ${change.to} after talking with ${change.changedBy}.`);
        break;
      case 'eviction': {
        line('');
        line('EVICTION NIGHT');
        Object.entries(act.votes || {}).forEach(([name, count]) => line(`  ${name}: ${count} vote${count === 1 ? '' : 's'}`));
        if (act.tieBreak) line(act.tieBreak.anonymous
          ? '  Tied — the Invisible HOH breaks it through the wall screen, and nobody stands up.'
          : `  Tied — ${act.tieBreak.voter} breaks it.`);
        line(act.doubleVote && act.secondEvicted
          ? `  DOUBLE EVICTION — one vote, two walks: ${act.evicted} and ${act.secondEvicted} are both evicted from the Big Brother house.`
          : `  ${act.evicted} is evicted from the Big Brother house.`);
        if (week.invisibleReveal?.to === act.evicted) {
          line(`  In the goodbye messages, the Invisible HOH finally signs the week: ${week.invisibleReveal.hoh} tells ${act.evicted} it was them all along. The house still does not know.`);
        }
        // Between the verdict and the front door, if they had something to say.
        lastWordsLines(act.lastWords, line);
        juryLines(week, line);
        break;
      }
      case 'jury-house':
        juryHouseLines(act, line);
        break;
      default:
        break;
    }
    // House life, in the act it happened in.
    for (const beat of act.socialBeats || []) {
      line(`    [${beat.badgeText}] ${beat.text}`);
    }
  }
  return lines.join('\n');
}

// Loading this module is precisely what makes a Big Brother season playable, so
// this is the honest place to flip the flag the Show selector reads. Before
// this existed the selector correctly warned that Run would fall back to Total
// Drama; now it must stop warning.
if (typeof window !== 'undefined') window._bbRunnable = true;

/**
 * The last night, recorded the way every other week is.
 *
 * Returns null when the season is already over, so the run surface can tell
 * "nothing left to play" from "here is the finale".
 */
export function runBBFinale() {
  if (gs.phase === 'complete' || (gs.activePlayers || []).length < 2) return null;
  const ep = simulateBBFinale();
  if (!ep) return null;
  ep.num = (gs.episodeHistory?.length || 0) + 1;
  // The finale's transcript, on BOTH paths.
  //
  // This used to fall back to an empty string, which meant every headless
  // season — the test suite, the audits, anything run without a browser —
  // produced a finale with no transcript at all. The weekly writer has
  // `summariseWeek` for exactly this reason; the finale had nothing, so the
  // one episode that ends the season was the one nobody could read.
  ep.summaryText = typeof window !== 'undefined' && window.generateSummaryText
    ? window.generateSummaryText(ep)
    : generateBBFinaleText(ep);
  try { updateEditLayer(ep); finalizeEditSeason(); } catch { /* the edit never blocks the finale */ }
  gs.episodeHistory ||= [];
  gs.episodeHistory.push({
    ...ep,
    // What the fans thought AT THE END OF THIS WEEK.
    //
    // Nothing in the house ever wrote this, and snapshotGameState does not
    // carry popularity either, so every screen that asked an old episode how
    // popular somebody was fell through to the LIVE score and answered with
    // today's number. Week three and week eleven showed the same board, which
    // makes a per-week view of fan sentiment impossible to build and the
    // existing episode switcher silently useless.
    popularitySnapshot: { ...(gs.popularity || {}) },
    gsSnapshot: typeof window !== 'undefined' && window.snapshotGameState
      ? window.snapshotGameState() : null,
  });
  return ep;
}
