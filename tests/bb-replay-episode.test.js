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
import { replayEpisode } from '../js/run-ui.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer'][i % 4],
}));

function house() {
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

afterAll(() => {
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
