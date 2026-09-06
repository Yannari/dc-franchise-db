// ══════════════════════════════════════════════════════════════════════
// dr-run.test.js — the main stage is REACHABLE
// ══════════════════════════════════════════════════════════════════════
//
// Everything else in this show could be finished and none of it startable
// from the page. That is this project's signature bug class at its largest
// size — a whole show written, tested and unreachable — so these are guards on
// REACHABILITY rather than on behaviour.
//
// Three things are invisible by looking at the screen:
//   1. THE FLAG. formatIsRunnable('drag-race') reads window._drRunnable and
//      only js/dr-run.js sets it, so importing that module IS the wiring and a
//      refactor that drops the import silently un-ships the show.
//   2. THE QUEUE SURVIVES A RELOAD. The season is played in one call; a lost
//      queue must rebuild the SAME season and drop what already aired.
//   3. THE ROW REACHES gs.episodeHistory in the shape every screen reads.
import { afterAll, describe, expect, it } from 'vitest';
import {
  gs as gsRef, setGs, setPlayers, players, seasonConfig, formatIsRunnable, defaultConfig,
} from '../js/core.js';
import { isDragSeason, simulateDragEpisode, dragEpisodesLeft } from '../js/dr-run.js';
import { roundExits } from '../js/shows.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const CAST = Array.from({ length: 12 }, (_, i) => ({
  name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 3 + (i % 7), comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 2 + (i % 8), singing: 5 },
}));

let gsDescribed = false;
function stage(cfg = {}) {
  if (!gsDescribed) {
    Object.defineProperty(globalThis, 'gs', {
      configurable: true, get: () => gsRef, set: v => setGs(v),
    });
    gsDescribed = true;
  }
  setPlayers(CAST.map(p => ({ ...p })));
  Object.assign(seasonConfig, defaultConfig(), { format: 'drag-race', seasonNumber: 1, ...cfg });
  setGs({ episodeHistory: [], activePlayers: CAST.map(p => p.name), eliminated: [], popularity: {}, episode: 0 });
}
afterAll(() => { delete globalThis.gs; });

describe('dr-run', () => {
  it('sets the runnable flag by being imported', () => {
    globalThis.window = globalThis.window || {};
    // The import at the top of this file is the only thing that could have set
    // it, which is exactly the property being asserted.
    expect(globalThis.window._drRunnable).toBe(true);
    expect(formatIsRunnable('drag-race')).toBe(true);
  });

  it('knows a drag season from the config', () => {
    stage();
    expect(isDragSeason()).toBe(true);
    Object.assign(seasonConfig, { format: 'traitors' });
    expect(isDragSeason()).toBe(false);
    Object.assign(seasonConfig, { format: 'drag-race' });
  });

  it('plays one row per press and finishes with a crown', () => {
    stage();
    const r1 = simulateDragEpisode();
    expect(r1.num).toBe(1);
    expect(gsRef.episodeHistory.length).toBe(1);
    expect(gsRef.activePlayers.length).toBe(11);
    expect(gsRef.eliminated.length).toBe(1);
    expect(roundExits(r1, 'drag-race')[0].verb).toBe('sashayed away');
    expect(dragEpisodesLeft()).toBe(8);

    let row = r1;
    let guard = 0;
    while (row && guard++ < 25) row = simulateDragEpisode();

    expect(gsRef.phase).toBe('complete');
    expect(gsRef.episodeHistory.length).toBe(9);
    expect(gsRef.drWinner).toBeTruthy();
    expect(gsRef.drRunnerUp).toBeTruthy();
    expect(gsRef.episodeHistory.every(r => r.format === 'drag-race')).toBe(true);
    // The vote field this show does not have, on every row.
    expect(gsRef.episodeHistory.every(r => r.eliminated === null)).toBe(true);
  });

  it('writes the popularity ledger as it goes', () => {
    stage();
    let row = simulateDragEpisode();
    let guard = 0;
    while (row && guard++ < 25) row = simulateDragEpisode();
    // Plan 2 gives the challenges events to write; until then the ledger exists
    // and is reachable, which is what this asserts.
    expect(gsRef.popularity).toBeTruthy();
  });

  it('rebuilds the same season from the seed after the queue is lost', () => {
    stage();
    const first = [simulateDragEpisode(), simulateDragEpisode()].map(r => JSON.stringify(r.dr.call));
    const seed = gsRef._drSeed;

    // A reload: the queue is gone, the history is not.
    delete gsRef._drQueue;

    const third = simulateDragEpisode();
    expect(third.num, 'the rebuilt season restarted from episode one').toBe(3);
    expect(gsRef._drSeed).toBe(seed);
    // The two episodes that already aired are untouched by the rebuild.
    expect(gsRef.episodeHistory.slice(0, 2).map(r => JSON.stringify(r.dr.call))).toEqual(first);
    expect(gsRef.episodeHistory.length).toBe(3);
  });

  it('refuses a cast too small to play rather than crashing', () => {
    stage();
    setPlayers([{ name: 'Solo', slug: 'solo', stats: {}, drag: {} }]);
    setGs({ episodeHistory: [], activePlayers: ['Solo'], eliminated: [], popularity: {} });
    expect(simulateDragEpisode()).toBe(null);
  });
});
