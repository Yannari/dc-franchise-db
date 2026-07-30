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

/** How many houseguests are left when the season stops and the finale runs. */
export const houseFinaleSize = () => Math.max(2, seasonConfig.finaleSize || 3);

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
    // The HOH is the week's safety, which is the closest true analogue.
    immunityWinner: week.hoh || null,
    hoh: week.hoh || null,
    vetoWinner: week.vetoWinner || null,
    initialNominees: [...(week.initialNominees || [])],
    finalNominees: [...(week.finalNominees || [])],
    votes: { ...(week.votes || {}) },
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
export function simulateBBEpisode() {
  prepareHouse();
  const house = (gs.activePlayers || []).filter(Boolean);
  if (house.length <= houseFinaleSize()) return null;

  const week = simulateBBWeek({
    // Both libraries default to empty inside the engine, so a season that does
    // not hand them over runs silent and falls back to one-line competitions.
    houseEvents: HOUSE_EVENTS,
    competitions: BB_COMPETITIONS,
  });

  const ep = weekToEpisode(week);
  ep.summaryText = summariseWeek(week);

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
          line(`  ${e.nominee} works ${e.voter} — ${e.success ? 'and it lands.' : 'and it does not take.'}`);
        });
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
