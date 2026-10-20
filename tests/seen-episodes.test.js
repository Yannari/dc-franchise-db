// ADDING-A-SHOW §N case 3 on every show that queues its season
// (js/seen-episodes.js). The user, 2026-10-20, on the Circle: "when i use a
// savestate to return at episode 3 simulating new episode just use an episode
// already simulated before instead of creating a different one". Every save
// carries the queue, episode 4 at its head, so each of these re-aired it.
//
// The measurement for each show: play to 3, save, play to 5, then load the
// save and press Simulate, three times. Every episode 4 must be one never
// shown before, and the three that aired before the save must stay as they were.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs as gsRef, setGs, setPlayers, players, seasonConfig, relationships, defaultConfig,
  gsCheckpoints, repairGsSets, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulatePerfectMatchEpisode } from '../js/pm-run.js';
import { simulateChallengeEpisode } from '../js/ch-run.js';
import { simulateRaceEpisode } from '../js/rr-run.js';
import { simulateTraitorsEpisode } from '../js/tr-run.js';
import { simulateDragEpisode } from '../js/dr-run.js';
import { setFranchiseLedger } from '../js/franchise-meta.js';
import { makeIslanders } from './helpers/pm-cast.js';
import { challengeCast } from './helpers/ch-cast.js';
import { raceCast } from './helpers/rr-cast.js';
import roster from '../franchise_roster.json';

// The suite switches the memory off (tests/setup/forget-seen.js); these are its tests.
beforeEach(() => {
  globalThis.__dcSeenEpisodesOff = false;
  setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {} } } });
});

Object.defineProperty(globalThis, 'gs', { configurable: true, get: () => gsRef, set: v => setGs(v) });
globalThis.window = globalThis.window || {};
afterAll(() => { delete globalThis.gs; });

/** Play to 3, save, play to 5; then load and simulate three times. */
function rewind(simulate, said) {
  for (let i = 0; i < 3; i++) expect(simulate(), `episode ${i + 1}`).toBeTruthy();
  const save = JSON.stringify(gsRef);
  const before = gsRef.episodeHistory.map(said);
  const shown = new Set([said(simulate())]);
  simulate();
  for (let k = 0; k < 3; k++) {
    setGs(JSON.parse(save));
    const four = simulate();
    expect(four.num).toBe(4);
    expect(shown.has(said(four)), `load ${k + 1}: episode 4 aired before`).toBe(false);
    shown.add(said(four));
    expect(gsRef.episodeHistory.slice(0, 3).map(said), 'the episodes before the save stay').toEqual(before);
  }
}

describe('loading a save and pressing Simulate deals a new episode', () => {
  it('Perfect Match', () => {
    Object.assign(seasonConfig, { format: 'perfect-match', seasonNumber: 3, pmSetup: {}, twistSchedule: [], pmRoleCounts: {} });
    setPlayers(makeIslanders(22, 5));
    setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], pm: { seed: 3004 } });
    rewind(simulatePerfectMatchEpisode, r => JSON.stringify(r.pm));
  });

  it('The Challenge', () => {
    Object.assign(seasonConfig, { format: 'the-challenge', seasonNumber: 1, chSetup: {}, chFinalists: 6,
      chGenderBlind: false, twistSchedule: [], name: null });
    setPlayers(challengeCast(16, 3).cast);
    setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], ch: { seed: 909 }, seasonNumber: 1 });
    rewind(simulateChallengeEpisode, r => JSON.stringify(r.ch));
  });

  it('The Ridonculous Race', () => {
    Object.assign(seasonConfig, { format: 'ridonculous-race', seasonNumber: 1, twistSchedule: [], name: null, rrTeams: null });
    const { cast, teams } = raceCast(8, 5);
    const byName = Object.fromEntries(cast.map(p => [p.name, { ...p }]));
    for (const t of teams) {
      byName[t.a].rrPartner = t.b; byName[t.b].rrPartner = t.a; byName[t.a].rrRel = t.rel;
      if (t.identity) byName[t.b].rrIdentity = t.identity;
    }
    setPlayers(Object.values(byName));
    setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], rr: { seed: 404 }, seasonNumber: 1 });
    rewind(simulateRaceEpisode, r => JSON.stringify(r.rr));
  });

  it('The Traitors', () => {
    // The castle reads these as bare globals (tests/tr-rerun-ledger.test.js).
    setPlayers(roster.players.slice(0, 20).map(p => ({ ...p })));
    Object.assign(globalThis, { players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond,
      getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG, gsCheckpoints, repairGsSets,
      updatePopularity: () => {}, saveGameState: () => {}, renderRunTab: () => {}, _idbDelete: () => {},
      _idbPut: () => {}, _autoRevealSpoiler: () => {}, viewingEpNum: null, isBigBrotherSeason: () => false,
      houseIsAtFinale: () => false, tribeColor: () => '#fff' });
    Object.assign(seasonConfig, defaultConfig(), { format: 'traitors', traitorCount: 3, trPotCeiling: 120000 });
    setGs({ initialized: true, bonds: {}, activePlayers: players.map(p => p.name), episodeHistory: [], episode: 0, phase: 'pre-merge' });
    gsRef._trSeed = 23;
    rewind(simulateTraitorsEpisode, r => JSON.stringify(r.tr));
  }, 120000);

  it('Drag Race', () => {
    const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
    const CAST = Array.from({ length: 12 }, (_, i) => ({
      name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
      stats: Object.fromEntries(STATS.map(k => [k, 3 + ((i * 3) % 8)])),
      drag: { acting: 1 + (i % 9), comedy: 2 + ((i * 5) % 8), dance: 1 + ((i * 7) % 9), design: 3 + (i % 7),
        runway: 2 + ((i * 2) % 8), lipsync: 1 + ((i * 4) % 9), singing: 4 + (i % 6) },
    }));
    setPlayers(CAST.map(p => ({ ...p })));
    Object.assign(seasonConfig, defaultConfig(), { format: 'drag-race', seasonNumber: 1 });
    setGs({ episodeHistory: [], activePlayers: CAST.map(p => p.name), eliminated: [], popularity: {}, episode: 0,
      bonds: {}, bondLean: {}, perceivedBonds: {}, _drInitBonds: {}, _drInitLean: {}, _drSeed: 4242 });
    // The night itself; `state` is the season carried forward, not what aired.
    rewind(simulateDragEpisode, r => JSON.stringify({ ...r.dr, state: undefined }));
  });
});

describe('with the memory off, a rewind replays the queue as it always did', () => {
  it('the suite default: the same episode 4', () => {
    globalThis.__dcSeenEpisodesOff = true;
    Object.assign(seasonConfig, { format: 'the-challenge', seasonNumber: 1, chSetup: {}, chFinalists: 6,
      chGenderBlind: false, twistSchedule: [], name: null });
    setPlayers(challengeCast(16, 3).cast);
    setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], ch: { seed: 909 }, seasonNumber: 1 });
    for (let i = 0; i < 3; i++) simulateChallengeEpisode();
    const save = JSON.stringify(gsRef);
    const four = JSON.stringify(simulateChallengeEpisode().ch);
    setGs(JSON.parse(save));
    expect(JSON.stringify(simulateChallengeEpisode().ch)).toBe(four);
  });
});
