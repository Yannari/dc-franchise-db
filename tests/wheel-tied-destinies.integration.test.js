// @vitest-environment jsdom
// Integration: Wheel of Misfortune coupled with the Tied Destinies twist.
// Verifies the pair challenge actually launches (not clobbered by the generic
// tied-destinies paired-challenge handler) and that collateral elimination stays wired.
import { describe, it, expect } from 'vitest';
import * as core from '../js/core.js';
import * as playersMod from '../js/players.js';
import * as bondsMod from '../js/bonds.js';
import * as alliancesMod from '../js/alliances.js';
import * as votingMod from '../js/voting.js';
import * as advantagesMod from '../js/advantages.js';
import * as romanceMod from '../js/romance.js';
import * as challengesCoreMod from '../js/challenges-core.js';
import * as campEventsMod from '../js/camp-events.js';
import * as twistsMod from '../js/twists.js';
import * as episodeMod from '../js/episode.js';
import * as finaleMod from '../js/finale.js';
import * as savestateMod from '../js/savestate.js';
import * as textBacklogMod from '../js/text-backlog.js';
import * as reputationMod from '../js/reputation.js';
import * as strategyMemoryMod from '../js/strategy-memory.js';
import * as votePlanningMod from '../js/vote-planning.js';
import * as socialManipMod from '../js/social-manipulation.js';
import * as settingsMod from '../js/settings.js';
import * as rescueIslandMod from '../js/rescue-island.js';

const MODS = [core, playersMod, bondsMod, alliancesMod, votingMod, advantagesMod, romanceMod,
  challengesCoreMod, campEventsMod, twistsMod, episodeMod, finaleMod, savestateMod, textBacklogMod,
  reputationMod, strategyMemoryMod, votePlanningMod, socialManipMod, settingsMod, rescueIslandMod];
for (const m of MODS) for (const [k, v] of Object.entries(m)) { try { window[k] = v; } catch { /* live binding */ } }
window.saveGameState = () => {};
window.snapshotGameState = savestateMod.snapshotGameState;
window.patchEpisodeHistory = savestateMod.patchEpisodeHistory;
if (!window.gsCheckpoints) window.gsCheckpoints = {};
if (!window._tvState) window._tvState = {};
const _ARR = () => [], _STR = () => '', _NOOP = () => {};
Object.assign(window, { getTribeAdvantageStatus: _ARR, getTribeRelationshipHighlights: _ARR, generateChallengeNotes: _ARR,
  buildTribalQA: _STR, rpBuildAftermath: _STR, generateAftermathShow: _NOOP, buildCrashout: _STR });
const _idbStore = {};
globalThis.indexedDB = { open() { const req = {}; req.result = { createObjectStore() {},
  transaction() { const tx = { objectStore: () => ({ put(v, k) { _idbStore[k] = v; }, get(k) { const r = { result: _idbStore[k] }; queueMicrotask(() => r.onsuccess && r.onsuccess()); return r; }, delete(k) { delete _idbStore[k]; }, clear() { for (const k in _idbStore) delete _idbStore[k]; } }) };
    queueMicrotask(() => tx.oncomplete && tx.oncomplete()); return tx; } };
  queueMicrotask(() => req.onsuccess && req.onsuccess()); return req; } };

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCHS = ['mastermind', 'schemer', 'social-butterfly', 'loyal-soldier', 'floater', 'hero', 'villain', 'perceptive-player'];
function makeCast(n) {
  const cast = [];
  for (let i = 0; i < n; i++) {
    const stats = {}; STATS.forEach(s => stats[s] = 2 + Math.floor(Math.random() * 9));
    cast.push({ name: `P${i + 1}`, slug: `p${i + 1}`, gender: i % 2 ? 'm' : 'f',
      sexuality: 'straight', archetype: ARCHS[i % ARCHS.length], stats, tribe: i < n / 2 ? 'Ravu' : 'Moto' });
  }
  return cast;
}

function bootMergedSeason(castSize = 10, mergeAt = 8) {
  core.setPlayers(makeCast(castSize));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'WOMxTD', teams: 2, mergeAt, finaleSize: 3,
    finaleFormat: 'traditional', jurySize: 5, romance: 'disabled', aftermath: 'disabled',
    popularityEnabled: false, advantages: { idol: { enabled: false } }, twistSchedule: [] });
  savestateMod.initGameState();
  const sync = () => { window.gs = core.gs; window.players = core.players; window.seasonConfig = core.seasonConfig; };
  sync();
  let guard = 0;
  // run until we're post-merge AND sitting on an even, schedulable count (>=4)
  while (core.gs.activePlayers.length > 4 && guard++ < 60 &&
         !(core.gs.isMerged && core.gs.activePlayers.length % 2 === 0)) {
    sync(); episodeMod.simulateEpisode();
  }
  return sync;
}

describe('Wheel of Misfortune × Tied Destinies', () => {
  it('the pair challenge launches (not clobbered) and immunity goes to the winning pair', () => {
    let ok = false;
    for (let attempt = 0; attempt < 6 && !ok; attempt++) {
      const sync = bootMergedSeason(10, 8);
      // need an even post-merge count for the pairing
      if (!core.gs.isMerged || core.gs.activePlayers.length < 4 || core.gs.activePlayers.length % 2 !== 0) continue;
      const epNum = core.gs.episode + 1;
      core.seasonConfig.twistSchedule = [
        { episode: epNum, type: 'tied-destinies', id: 'td-x' },
        { episode: epNum, type: 'wheel-of-misfortune', id: 'wom-x' },
      ];
      sync();
      const ep = episodeMod.simulateEpisode();
      expect(ep).toBeTruthy();
      // WHEEL actually ran and set the challenge type (not overwritten to generic 'individual')
      expect(ep.isWheelOfMisfortune).toBe(true);
      expect(ep.challengeType).toBe('wheel-of-misfortune');
      expect(ep.wheelOfMisfortune).toBeTruthy();
      expect(ep.wheelOfMisfortune.immunePair.length).toBe(2);
      // tied destinies pairs match the challenge's roster pairs
      expect(ep.tiedDestinies?.pairs?.length).toBeGreaterThan(0);
      const rosterKeys = ep.wheelOfMisfortune.roster.map(r => [r.rider, r.grounder].sort().join('|')).sort();
      const tdKeys = ep.tiedDestinies.pairs.map(p => [p.a, p.b].sort().join('|')).sort();
      expect(rosterKeys).toEqual(tdKeys);
      // both winners were safe from the vote
      ep.wheelOfMisfortune.immunePair.forEach(n => {
        expect(ep.eliminated).not.toBe(n);
        expect(ep.tiedDestinies.eliminatedPartner).not.toBe(n);
      });
      ok = true;
    }
    expect(ok).toBe(true);
  });

  it('collateral elimination still fires — a voted-out player drags their tied partner', () => {
    let sawCollateral = false;
    for (let attempt = 0; attempt < 12 && !sawCollateral; attempt++) {
      const sync = bootMergedSeason(10, 8);
      if (!core.gs.isMerged || core.gs.activePlayers.length < 4 || core.gs.activePlayers.length % 2 !== 0) continue;
      const epNum = core.gs.episode + 1;
      core.seasonConfig.twistSchedule = [
        { episode: epNum, type: 'tied-destinies', id: 'td-x' },
        { episode: epNum, type: 'wheel-of-misfortune', id: 'wom-x' },
      ];
      sync();
      const ep = episodeMod.simulateEpisode();
      if (ep?.tiedDestinies?.eliminatedPartner) {
        // the collateral partner was tied to the eliminated target
        const pair = ep.tiedDestinies.pairs.find(p =>
          p.a === ep.tiedDestinies.eliminatedPartner || p.b === ep.tiedDestinies.eliminatedPartner);
        expect(pair).toBeTruthy();
        sawCollateral = true;
      }
    }
    expect(sawCollateral).toBe(true);
  });
});
