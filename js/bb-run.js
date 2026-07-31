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

import { gs, seasonConfig, seasonFormat } from './core.js';
import { simulateBBWeek } from './bb/week.js';
import { HOUSE_EVENTS } from './bb-events/index.js';
import { BB_COMPETITIONS } from './bb-comps/index.js';
import { generateBBEvictionInterview } from './bb-aftermath.js';
import { simulateBBFinale } from './bb-finale.js';

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
    initialNominees: [...(week.initialNominees || [])],
    finalNominees: [...(week.finalNominees || [])],
    votes: { ...(week.votes || {}) },
    // The shared vote screen reads votingLog, so a Big Brother ballot is
    // translated once here rather than the player growing a second way to draw
    // a vote. Same screen, same tally bars, same blindside detection.
    votingLog: (week.ballots || []).map(b => ({ voter: b.voter, voted: b.evict, changed: !!b.changed })),
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
export const BB_TWIST_IDS = new Set(['bb-double-eviction', 'bb-have-nots', 'bb-instant-eviction']);

/**
 * Which twists are scheduled for the week about to be played.
 *
 * The designer schedules by episode number and a Big Brother episode is a
 * week, so they are the same axis. Anything not built for this format is
 * dropped rather than passed through to an engine that would ignore it
 * silently.
 */
export function bbTwistsForWeek(weekNum) {
  const scheduled = (seasonConfig.twistSchedule || [])
    .filter(t => t && Number(t.episode) === Number(weekNum))
    .map(t => t.type)
    .filter(id => BB_TWIST_IDS.has(id));

  // Have-nots can be a standing feature of the season rather than a one-off,
  // which is how the format usually runs it: somebody is always on slop.
  const mode = seasonConfig.bbHaveNots || 'twist';
  const out = new Set(scheduled);
  if (mode === 'every-week') out.add('bb-have-nots');
  if (mode === 'off') out.delete('bb-have-nots');
  return [...out];
}

export function simulateBBEpisode() {
  prepareHouse();
  const house = (gs.activePlayers || []).filter(Boolean);
  if (house.length <= houseFinaleSize()) return null;

  const weekNum = (gs.bb.weeks?.length || 0) + 1;
  const twists = bbTwistsForWeek(weekNum);

  const week = simulateBBWeek({
    // Both libraries default to empty inside the engine, so a season that does
    // not hand them over runs silent and falls back to one-line competitions.
    houseEvents: HOUSE_EVENTS,
    competitions: BB_COMPETITIONS,
    twists,
    // Season modes that put a third houseguest on the block every week.
    safetyMode: seasonConfig.bbSafetyMode || 'off',
    safetyStopsAt: Number.isFinite(Number(seasonConfig.bbSafetyStopsAt))
      ? Number(seasonConfig.bbSafetyStopsAt) : undefined,
    // The HOH picks have-nots off their own read of the house, not the truth.
    readBond: (a, b) => (typeof window !== 'undefined' && window.getPerceivedBond
      ? window.getPerceivedBond(a, b) : 0),
  });

  const ep = weekToEpisode(week);
  ep.twists = [...twists];
  ep.haveNots = week.haveNots ? [...week.haveNots] : [];
  ep.instantEviction = twists.includes('bb-instant-eviction');
  ep.safetyMode = week.safetyMode || null;
  ep.safetyWinner = week.safetyWinner || null;
  ep.blockBeforeSafety = week.blockBeforeSafety ? [...week.blockBeforeSafety] : [];

  // ── Double eviction: a second, compressed cycle the same night ──
  // A separate week record, because it genuinely is one — the stats, the jury
  // and the competition history all have to see two HOHs and two evictions —
  // but a single episode, because that is how it is watched.
  if (twists.includes('bb-double-eviction') && (gs.activePlayers || []).length > Math.max(4, houseFinaleSize())) {
    const second = simulateBBWeek({
      houseEvents: HOUSE_EVENTS,
      competitions: BB_COMPETITIONS,
      compressed: true,
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
    ep.acts = [...(ep.acts || []), ...(second.acts || []).map(a => ({ ...a, segment: 2 }))];
    ep.votingLog = [
      ...(ep.votingLog || []),
      ...(second.ballots || []).map(b => ({ voter: b.voter, voted: b.evict, changed: !!b.changed, segment: 2 })),
    ];
  }
  // The aftermath of a Big Brother week is one person, interviewed on the way
  // out, finding out what was actually happening around them.
  ep.evictionInterview = generateBBEvictionInterview(ep, week);
  // The shared text backlog owns transcripts for both shows, so a Big Brother
  // week is written by the same system that writes a Total Drama episode.
  ep.summaryText = typeof window !== 'undefined' && window.generateSummaryText
    ? window.generateSummaryText(ep)
    : summariseWeek(week);

  gs.episodeHistory ||= [];
  gs.episodeHistory.push({
    ...ep,
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

  for (const act of week.acts || []) {
    switch (act.type) {
      case 'hoh':
        line('');
        line('HEAD OF HOUSEHOLD');
        _competition(line, act.competition);
        line(`  ${act.winner} wins Head of Household.`);
        (act.results || []).filter(r => r.threw).forEach(r => line(`  ${r.name} threw the competition.`));
        break;
      case 'nominations':
        line('');
        line('NOMINATION CEREMONY');
        line(`  Nominated: ${(act.nominees || []).join(' and ')}.`);
        break;
      case 'veto':
        line('');
        line('POWER OF VETO');
        line(`  Played by: ${(act.participants || []).join(', ')}.`);
        _competition(line, act.competition);
        line(`  ${act.winner} wins the Power of Veto.`);
        break;
      case 'veto-ceremony':
        line('');
        line('VETO CEREMONY');
        if (act.used) {
          line(`  The veto is used on ${act.saved}.`);
          if (act.replacement) line(`  ${act.replacement} is named as the replacement nominee.`);
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
        line('LIVE EVICTION');
        Object.entries(act.votes || {}).forEach(([name, count]) => line(`  ${name}: ${count} vote${count === 1 ? '' : 's'}`));
        if (act.tieBreak) line(`  Tied — ${act.tieBreak.voter} breaks it.`);
        line(`  ${act.evicted} is evicted from the Big Brother house.`);
        break;
      }
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
  ep.summaryText = typeof window !== 'undefined' && window.generateSummaryText
    ? window.generateSummaryText(ep) : '';
  gs.episodeHistory ||= [];
  gs.episodeHistory.push({
    ...ep,
    gsSnapshot: typeof window !== 'undefined' && window.snapshotGameState
      ? window.snapshotGameState() : null,
  });
  return ep;
}
