// Re-running an episode must never be able to delete it.
//
// replayEpisode rolled gs back to the episode's checkpoint, deleted every
// checkpoint from that point on, and only THEN simulated — ending with a bare
// `if (!ep) return`. So a re-run that came back empty, or threw anywhere
// inside the engine, left the season already truncated: the episode you asked
// to re-run was gone, its checkpoints with it, and the screen dropped you on
// the previous episode with no way forward.
//
// Reported as "re-run deletes the episode and brings me back to the previous
// one instead of re-running". The rollback is reversible now: nothing is
// thrown away until the replacement episode is in hand.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs as gsRef, players, seasonConfig, relationships, TWIST_CATALOG,
  gsCheckpoints, setGs, repairGsSets } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, isBigBrotherSeason } from '../js/bb-run.js';
import { replayEpisode, _saveBBCheckpoint } from '../js/run-ui.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer'][i % 4],
}));

function house() {
  for (const k of STUBBED) {
    if (!priorGlobals.has(k)) priorGlobals.set(k, globalThis[k]);
  }
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  // run-ui.js has no imports — it reads everything as a bare global, exactly
  // the way main.js wires it in the browser. `gs` in particular has to be a
  // real setter or the module's own reassignment goes nowhere.
  Object.defineProperty(globalThis, 'gs', {
    configurable: true, get: () => gsRef, set: v => setGs(v),
  });
  Object.assign(globalThis, { players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG,
    gsCheckpoints, repairGsSets, isBigBrotherSeason, simulateBBEpisode,
    runBBFinale: () => null,
    // Side effects the run surface performs and this test does not care about.
    updatePopularity: () => {}, saveGameState: () => {}, renderRunTab: () => {},
    _idbDelete: () => {}, _idbPut: () => {}, _autoRevealSpoiler: () => {},
    viewingEpNum: null,
  });
  for (const k of Object.keys(gsCheckpoints)) delete gsCheckpoints[k];
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', twistSchedule: [] });
  globalThis.gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  globalThis.gs.episodeHistory = []; globalThis.gs.showmances = [];
  globalThis.gs.namedAlliances = []; globalThis.gs.jury = []; globalThis.gs.episode = 0;
}

// Everything this file puts on the shared globals, put back.
//
// vitest reuses a worker across files, so a stub left standing here is a stub
// the NEXT file inherits. Overriding document.getElementById in particular —
// run-ui reaches for '#run-main' on the way out — replaced jsdom's real lookup
// for every test that ran afterwards, and bb-invisible-hoh failed building VP
// screens for reasons that had nothing to do with itself.
const STUBBED = ['players', 'seasonConfig', 'relationships', 'pStats', 'pronouns',
  'ordinal', 'getBond', 'getPerceivedBond', 'bKey', 'bondLabel', 'romanticCompat',
  'TWIST_CATALOG', 'gsCheckpoints', 'repairGsSets', 'isBigBrotherSeason',
  'simulateBBEpisode', 'runBBFinale', 'updatePopularity', 'saveGameState',
  'renderRunTab', '_idbDelete', '_idbPut', '_autoRevealSpoiler', 'viewingEpNum',
  'confirm', 'alert'];
const priorGlobals = new Map();
let priorGetElementById;

afterAll(() => {
  for (const k of STUBBED) {
    if (priorGlobals.has(k)) globalThis[k] = priorGlobals.get(k);
    else delete globalThis[k];
  }
  if (globalThis.document) globalThis.document.getElementById = priorGetElementById;
  delete globalThis.gs;
  seasonConfig.twistSchedule = [];
  delete seasonConfig.format;
});

beforeEach(() => {
  house();
  // replayEpisode asks before it does anything, and reports failure the same way.
  globalThis.confirm = () => true;
  globalThis.alert = () => {};
  // It repaints and scrolls on the way out; neither exists here.
  globalThis.document = globalThis.document || {};
  if (priorGetElementById === undefined) priorGetElementById = globalThis.document.getElementById;
  globalThis.document.getElementById = () => ({ scrollTop: 0, style: {}, querySelector: () => null });
});

/** Play two weeks, checkpointing the way the run surface does. */
function playTwo() {
  return withSeededRandom(4242, () => {
    const eps = [];
    for (let i = 0; i < 2; i++) {
      gsCheckpoints[i + 1] = JSON.parse(JSON.stringify(globalThis.gs));
      eps.push(simulateBBEpisode());
    }
    return eps;
  });
}

describe('a re-run that fails changes nothing', () => {
  it('keeps the episode when the engine returns nothing', () => {
    playTwo();
    const before = globalThis.gs.episodeHistory.length;
    const names = globalThis.gs.episodeHistory.map(e => e.num);

    // The engine declines to produce an episode — the exact case the old
    // `if (!ep) return` walked away from with the season already cut.
    globalThis.simulateBBEpisode = () => null;
    try { replayEpisode(2); } finally { globalThis.simulateBBEpisode = simulateBBEpisode; }

    expect(globalThis.gs.episodeHistory.length, 'the episode was deleted by a failed re-run')
      .toBe(before);
    expect(globalThis.gs.episodeHistory.map(e => e.num)).toEqual(names);
    expect(gsCheckpoints[2], 'the checkpoint went with it').toBeTruthy();
  });

  it('keeps the episode when the engine throws', () => {
    playTwo();
    const before = globalThis.gs.episodeHistory.length;

    globalThis.simulateBBEpisode = () => { throw new Error('engine blew up mid-week'); };
    try { replayEpisode(2); } finally { globalThis.simulateBBEpisode = simulateBBEpisode; }

    expect(globalThis.gs.episodeHistory.length, 'a thrown re-run truncated the season').toBe(before);
    expect(gsCheckpoints[2]).toBeTruthy();
  });

  // The SUCCESS path is not covered here on purpose: it ends in the real
  // renderRunTab, which is module-local and paints the whole run surface, so
  // exercising it needs a real DOM rather than a stub. These two cover the
  // reported bug — a re-run that fails must leave the season untouched.
});

// ── the season that stopped being re-runnable ─────────────────────────
//
// Reported with a screenshot: episodes 1-3 carried the replay button, episode
// 3 was a double eviction ("Caleb + Scary Girl"), and episodes 4 and 5 had no
// button at all. Not one episode — every episode after it, for the rest of the
// season.
//
// The checkpoint was keyed by the WEEK count and the button looks it up by the
// EPISODE number. Those agree only while one episode is one week. A double
// eviction pushes two weeks for one episode, so from that point on every
// checkpoint was filed under a number no episode would ever carry.
describe('a two-week episode does not unfile every checkpoint after it', () => {
  it('keys checkpoints by episode number across a double eviction', () => {
    house();
    // Play a plain week, then the double, then two more.
    withSeededRandom(31, () => {
      seasonConfig.twistSchedule = [{ id: 't1', episode: 2, type: 'bb-double-eviction' }];
      for (let i = 0; i < 4; i++) {
        // Through the REAL writer, the way simulateNext does it. Writing the
        // keys by hand here would test my own arithmetic and pass against the
        // very bug it exists to catch.
        _saveBBCheckpoint();
        simulateBBEpisode();
      }
    });

    const eps = globalThis.gs.episodeHistory.map(e => e.num);
    expect(eps.length, 'the season did not play').toBeGreaterThan(2);
    // The double really did run — otherwise this proves nothing.
    expect(globalThis.gs.bb.weeks.length,
      'no double eviction happened, so the divergence was never exercised')
      .toBeGreaterThan(eps.length);

    // Every episode has a checkpoint filed under ITS OWN number, which is what
    // the replay button reads. This is the assertion the screenshot was of.
    for (const num of eps) {
      expect(gsCheckpoints[num], `episode ${num} has no checkpoint — no replay button`)
        .toBeTruthy();
    }
  });
});
