// ══════════════════════════════════════════════════════════════════════
// tr-rerun-ledger.test.js — a re-run must agree with what already aired
// ══════════════════════════════════════════════════════════════════════
//
// Reported from a played season: the day book on episode 3 listed two people
// as struck in episode 2 who had never been struck at all, while episode 2's
// own page listed the two who had. One ledger, two answers.
//
// The cause was that only ONE re-run point was remembered. Re-run episode 2,
// air it, then re-run episode 4, and the second replay reproduced episodes 1-3
// off the BASE seed — but episodes 2 and 3 had aired off the FIRST re-run's
// seed. The new episode 4 was therefore built on a prefix that never happened,
// and it printed that prefix.
//
// tr-run.test.js already guarded that earlier episodes do not CHANGE under a
// later re-run, and they did not. What nothing checked was whether the re-run
// episode AGREES with them, which is the half the screen shows.
import { afterAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gs as gsRef, setGs, setPlayers, players, seasonConfig, relationships,
  gsCheckpoints, repairGsSets, TWIST_CATALOG, formatIsRunnable, defaultConfig } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { isTraitorsSeason, simulateTraitorsEpisode, traitorsEpisodesLeft,
  rerunTraitorsEpisode } from '../js/tr-run.js';
import { getEpisodeEliminations, renderEpisodeHistory, renderEpisodeView } from '../js/run-ui.js';
import { exitVerbs } from '../js/shows.js';
import { TRAITORS_SCREENS } from '../js/vp-tr/screens.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);

// run-ui.js reads most of its world as bare globals, exactly the way main.js
// wires it in a browser. Same set-up as tests/bb-replay-episode.test.js, and
// the same reason: `gs` in particular has to be a real setter or the module's
// own reassignment goes nowhere.
const STUBBED = ['players', 'seasonConfig', 'relationships', 'pStats', 'pronouns',
  'ordinal', 'getBond', 'getPerceivedBond', 'bKey', 'bondLabel', 'romanticCompat',
  'TWIST_CATALOG', 'gsCheckpoints', 'repairGsSets', 'updatePopularity',
  'saveGameState', 'renderRunTab', '_idbDelete', '_idbPut', '_autoRevealSpoiler',
  'viewingEpNum', 'isBigBrotherSeason', 'houseIsAtFinale', 'tribeColor'];
const priorGlobals = new Map();
let gsDescribed = false;

function castle(cfg = {}, seed = null) {
  for (const k of STUBBED) if (!priorGlobals.has(k)) priorGlobals.set(k, globalThis[k]);
  if (!gsDescribed) {
    Object.defineProperty(globalThis, 'gs', {
      configurable: true, get: () => gsRef, set: v => setGs(v),
    });
    gsDescribed = true;
  }
  setPlayers(ROSTER.map(p => ({ ...p })));
  Object.assign(globalThis, { players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG,
    gsCheckpoints, repairGsSets,
    updatePopularity: () => {}, saveGameState: () => {}, renderRunTab: () => {},
    _idbDelete: () => {}, _idbPut: () => {}, _autoRevealSpoiler: () => {},
    viewingEpNum: null, isBigBrotherSeason: () => false,
    houseIsAtFinale: () => false, tribeColor: () => '#fff',
  });
  Object.assign(seasonConfig, defaultConfig(), { format: 'traitors', traitorCount: 3,
    trPotCeiling: 120000, ...cfg });
  setGs({ initialized: true, bonds: {}, activePlayers: players.map(p => p.name),
    episodeHistory: [], episode: 0, phase: 'pre-merge' });
  // THE SEED IS FIXED HERE AND THE RUN MODULE'S OWN IS NOT USED. `_seed()`
  // draws from Math.random so that two seasons of the same show differ, which
  // is right for a viewer and wrong for a guard: an arm that needs a night
  // removing two people, or an offer, passes or fails on the draw. Set on the
  // state exactly as the run module would have set it, so the path under test
  // is unchanged.
  if (seed != null) gsRef._trSeed = seed;
  return gsRef;
}

/**
 * Play the whole thing through the UI's own entry point.
 *
 * SEVERAL SEASONS, not one. A castle season is nine to twelve nights and the
 * rarer branches — an offer, a night that removes two — fire a handful of
 * times across one of them and sometimes not at all. Plan 8 measured the same
 * thing for the refused ultimatum: four seeds is not enough for a rare branch.
 */
const SEEDS = [11, 23, 37, 41, 59];

function airWholeSeason(seed = SEEDS[0], cfg) {
  castle(cfg, seed);
  const aired = [];
  for (let i = 0; i < 60; i++) {
    const row = simulateTraitorsEpisode();
    if (!row) break;
    aired.push(row);
  }
  return aired;
}


const struckOf = row => [...((row.tr && row.tr.goneBefore) || [])]
  .map(g => g.ep + ':' + g.name);

/** What actually aired before episode `n`, taken off the earlier rows. */
function airedBefore(history, n) {
  const out = [];
  for (const e of history) {
    if (!e.tr || e.tr.ep >= n) continue;
    for (const x of (e.exits || [])) out.push(e.tr.ep + ':' + x.name);
  }
  return out;
}

/** The prefix, as a comparable string per episode. */
const prefixOf = (history, n) => history.filter(e => e.tr && e.tr.ep < n)
  .map(e => e.tr.ep + '=' + (e.exits || []).map(x => x.name).join(','));

function agrees(row, n) {
  expect(struckOf(row).sort(),
    `episode ${n}'s day book lists people the season never struck`)
    .toEqual(airedBefore(gsRef.episodeHistory, n).sort());
}

describe('one re-run', () => {
  it('the re-run night prints the prefix that actually happened', () => {
    expect(airWholeSeason(37).length).toBeGreaterThan(4);
    expect(rerunTraitorsEpisode(3)).toBe(true);
    const row = simulateTraitorsEpisode();
    expect(row && row.num).toBe(3);
    agrees(row, 3);
  });
});

describe('two re-runs, which is where it broke', () => {
  it('the second still agrees with what aired under the first', () => {
    airWholeSeason(37);
    expect(rerunTraitorsEpisode(2)).toBe(true);
    simulateTraitorsEpisode();
    simulateTraitorsEpisode();
    const kept = prefixOf(gsRef.episodeHistory, 4);

    expect(rerunTraitorsEpisode(4)).toBe(true);
    const row = simulateTraitorsEpisode();
    expect(row && row.num).toBe(4);
    // The prefix is untouched...
    expect(prefixOf(gsRef.episodeHistory, 4), 'the prefix moved').toEqual(kept);
    // ...and the new night believes it.
    agrees(row, 4);
  });

  it('holds for a third one too', () => {
    airWholeSeason(41);
    for (const n of [2, 4]) {
      expect(rerunTraitorsEpisode(n)).toBe(true);
      for (let i = n; i <= n + 1; i++) simulateTraitorsEpisode();
    }
    expect(rerunTraitorsEpisode(6)).toBe(true);
    const row = simulateTraitorsEpisode();
    if (!row) return;                      // season ended before six; nothing to prove
    agrees(row, row.num);
  });

  it('re-running the SAME episode twice keeps the prefix', () => {
    airWholeSeason(23);
    expect(rerunTraitorsEpisode(3)).toBe(true);
    simulateTraitorsEpisode();
    const kept = prefixOf(gsRef.episodeHistory, 3);
    expect(rerunTraitorsEpisode(3)).toBe(true);
    const row = simulateTraitorsEpisode();
    expect(prefixOf(gsRef.episodeHistory, 3)).toEqual(kept);
    agrees(row, 3);
  });
});

describe('a reload after two re-runs', () => {
  it('rebuilds the season that aired, not the original', () => {
    // The queue normally survives the save; when it does not, the rebuild
    // replays from the seed and must reproduce EVERY re-run, not the last.
    airWholeSeason(37);
    expect(rerunTraitorsEpisode(2)).toBe(true);
    simulateTraitorsEpisode();
    simulateTraitorsEpisode();
    expect(rerunTraitorsEpisode(4)).toBe(true);
    const intact = simulateTraitorsEpisode();
    expect(intact && intact.num).toBe(4);
    const kept = prefixOf(gsRef.episodeHistory, 5);

    delete gsRef._trQueue;                 // a reload that lost it
    const next = simulateTraitorsEpisode();
    expect(next, 'nothing aired after the rebuild').toBeTruthy();
    expect(prefixOf(gsRef.episodeHistory, 5), 'the rebuild rewrote the past')
      .toEqual(kept);
    agrees(next, next.num);
  });
});
