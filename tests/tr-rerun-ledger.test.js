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
  rerunTraitorsEpisode, lastTraitorsRerunRefusal } from '../js/tr-run.js';
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

function castle(cfg = {}, seed = null, castOverride = null) {
  for (const k of STUBBED) if (!priorGlobals.has(k)) priorGlobals.set(k, globalThis[k]);
  if (!gsDescribed) {
    Object.defineProperty(globalThis, 'gs', {
      configurable: true, get: () => gsRef, set: v => setGs(v),
    });
    gsDescribed = true;
  }
  setPlayers((castOverride || ROSTER).map(p => ({ ...p })));
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

function airWholeSeason(seed = SEEDS[0], cfg, castOverride) {
  castle(cfg, seed, castOverride);
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

describe('a refusal says why', () => {
  // "Episode 11 could not be re-run, so nothing was changed." was the whole of
  // it, from four different refusals, none of which could say what was wrong.
  it('names the missing seed', () => {
    airWholeSeason(37);
    delete gsRef._trSeed;
    expect(rerunTraitorsEpisode(3)).toBe(false);
    expect(lastTraitorsRerunRefusal(), 'refused with no reason').toBeTruthy();
    expect(lastTraitorsRerunRefusal()).toMatch(/seed/i);
  });

  it('names a cast too small to hold a castle', () => {
    airWholeSeason(37);
    setPlayers(ROSTER.slice(0, 2).map(p => ({ ...p })));
    globalThis.players = players;
    gsRef.tr.castOrder = players.map(p => p.name);
    expect(rerunTraitorsEpisode(3)).toBe(false);
    expect(lastTraitorsRerunRefusal()).toMatch(/four players/i);
  });

  it('clears the reason when a re-run works', () => {
    airWholeSeason(37);
    expect(rerunTraitorsEpisode(3)).toBe(true);
    expect(lastTraitorsRerunRefusal(), 'a stale reason survived a good re-run')
      .toBeNull();
  });
});

describe('re-running the LAST night', () => {
  // Reported: "Episode 11 could not be re-run" on an eleven-night season. A
  // castle has no fixed length — the endgame ends when the room agrees to stop
  // — so a re-roll can finish a night earlier and leave no episode 11 to air.
  // True, and useless: the viewer asked for a different finale, not for a
  // ruling on whether one exists. The nonce is turned until one comes up.
  it('re-runs the finale on a smaller cast too', () => {
    // HONEST NOTE ON WHAT THIS DOES AND DOES NOT PROVE. Re-running the finale
    // was reported as refused on a played season, and a scan over cast sizes
    // found re-rolls that end a night early (fourteen players, seed 3, the
    // first three nonces all come back one night short of the aired season).
    // The engine retries the nonce until one reaches the episode. But every
    // case reachable from THIS harness succeeds on the first attempt, so this
    // arm covers the smaller cast and NOT the retry itself — it passes with
    // the retry limit set to one. The retry is not proven by a test.
    setPlayers(roster.players.slice(0, 14).map(p => ({ ...p })));
    globalThis.players = players;
    const aired = airWholeSeason(3, {}, roster.players.slice(0, 14));
    const last = aired.length;
    expect(rerunTraitorsEpisode(last), 'refused a finale a re-roll can reach')
      .toBe(true);
    const row = simulateTraitorsEpisode();
    expect(row, 'aired nothing').toBeTruthy();
    expect(row.num).toBe(last);
  });

  it('produces a finale rather than refusing', () => {
    for (const seed of [11, 23, 37, 41, 59, 101, 131]) {
      const aired = airWholeSeason(seed);
      const last = aired.length;
      expect(rerunTraitorsEpisode(last), `seed ${seed}: refused the finale`).toBe(true);
      const row = simulateTraitorsEpisode();
      expect(row, `seed ${seed}: re-ran the finale and aired nothing`).toBeTruthy();
      expect(row.num).toBe(last);
      agrees(row, last);
    }
  });

  it('keeps the prefix while it hunts for one', () => {
    // Each attempt replays the whole season; the aired nights must survive
    // every one of them.
    const aired = airWholeSeason(41);
    const last = aired.length;
    const kept = prefixOf(gsRef.episodeHistory, last);
    expect(rerunTraitorsEpisode(last)).toBe(true);
    simulateTraitorsEpisode();
    expect(prefixOf(gsRef.episodeHistory, last), 'a retry rewrote the past')
      .toEqual(kept);
  });

  it('still records the reroll that actually took', () => {
    // The nonce moves on every attempt, so the persisted seed has to be the
    // one that produced the season now on the queue — otherwise a reload
    // rebuilds a different one.
    const aired = airWholeSeason(23);
    const last = aired.length;
    expect(rerunTraitorsEpisode(last)).toBe(true);
    const row = simulateTraitorsEpisode();
    const kept = prefixOf(gsRef.episodeHistory, last + 1);
    delete gsRef._trQueue;                       // a reload that lost it
    const chain = gsRef._trRerolls;
    expect(chain[chain.length - 1].fromEp).toBe(last);
    expect(prefixOf(gsRef.episodeHistory, last + 1)).toEqual(kept);
    expect(row.num).toBe(last);
  });
});

