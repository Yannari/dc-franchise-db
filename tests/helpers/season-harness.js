// Headless full-season harness — runs the real sim in vitest+jsdom by mirroring
// main.js's window-exposure and stubbing IndexedDB + presentation-only helpers.
// Import from a test that declares `// @vitest-environment jsdom`.
import { vi } from 'vitest';
import * as core from '../../js/core.js';
import * as playersMod from '../../js/players.js';
import * as bondsMod from '../../js/bonds.js';
import * as alliancesMod from '../../js/alliances.js';
import * as votingMod from '../../js/voting.js';
import * as advantagesMod from '../../js/advantages.js';
import * as romanceMod from '../../js/romance.js';
import * as challengesCoreMod from '../../js/challenges-core.js';
import * as campEventsMod from '../../js/camp-events.js';
import * as twistsMod from '../../js/twists.js';
import * as episodeMod from '../../js/episode.js';
import * as finaleMod from '../../js/finale.js';
import * as savestateMod from '../../js/savestate.js';
import * as textBacklogMod from '../../js/text-backlog.js';
import * as reputationMod from '../../js/reputation.js';
import * as strategyMemoryMod from '../../js/strategy-memory.js';
import * as votePlanningMod from '../../js/vote-planning.js';
import * as socialManipMod from '../../js/social-manipulation.js';
import * as settingsMod from '../../js/settings.js';
import * as rescueIslandMod from '../../js/rescue-island.js';

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
Object.assign(window, { getTribeAdvantageStatus: _ARR, getTribeRelationshipHighlights: _ARR,
  generateChallengeNotes: _ARR, buildTribalQA: _STR, rpBuildAftermath: _STR, generateAftermathShow: _NOOP, buildCrashout: _STR });
const _idbStore = {};
globalThis.indexedDB = {
  open() {
    const req = { result: { createObjectStore() {}, transaction() {
      const tx = { objectStore: () => ({ put(v, k) { _idbStore[k] = v; }, get(k) { const r = { result: _idbStore[k] }; queueMicrotask(() => r.onsuccess && r.onsuccess()); return r; }, delete(k) { delete _idbStore[k]; }, clear() { for (const k in _idbStore) delete _idbStore[k]; } }) };
      queueMicrotask(() => tx.oncomplete && tx.oncomplete()); return tx;
    } } };
    queueMicrotask(() => req.onsuccess && req.onsuccess());
    return req;
  },
};

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCHS = ['mastermind', 'schemer', 'hothead', 'challenge-beast', 'social-butterfly', 'loyal-soldier',
  'wildcard', 'chaos-agent', 'floater', 'underdog', 'hero', 'villain', 'goat', 'perceptive-player', 'showmancer'];

export function makeCast(n = 16) {
  const cast = [];
  for (let i = 0; i < n; i++) {
    const stats = {}; STATS.forEach(s => stats[s] = 2 + Math.floor(Math.random() * 9));
    cast.push({ name: `P${i + 1}`, slug: `p${i + 1}`, gender: i % 2 ? 'm' : 'f',
      sexuality: 'straight', archetype: ARCHS[i % ARCHS.length], stats, tribe: i < n / 2 ? 'Ravu' : 'Moto' });
  }
  return cast;
}

export function runOneSeason(configOverride = {}, castSize = 16) {
  core.setPlayers(makeCast(castSize));
  core.setSeasonConfig({
    ...core.seasonConfig, name: 'Audit', teams: 2, mergeAt: 10, finaleSize: 3,
    finaleFormat: 'traditional', jurySize: 7, romance: 'disabled', aftermath: 'disabled',
    popularityEnabled: false, ...configOverride,
  });
  if (!savestateMod.initGameState()) throw new Error('initGameState failed');
  const sync = () => { window.gs = core.gs; window.players = core.players; window.seasonConfig = core.seasonConfig; };
  sync();
  let guard = 0;
  while (core.gs.phase !== 'complete' && core.gs.activePlayers.length > 1 && guard++ < 80) {
    sync();
    const ep = core.gs.phase === 'finale' ? finaleMod.simulateFinale() : episodeMod.simulateEpisode();
    if (!ep) break;
  }
  return { phase: core.gs.phase, episodes: core.gs.episodeHistory.length,
    winner: core.gs.winner || core.gs.finaleResult?.winner || null };
}

export function seededRun(fn, seed = 20260716) {
  let s = seed >>> 0;
  const lcg = () => ((s = (1664525 * s + 1013904223) >>> 0) / 0x100000000);
  const spy = vi.spyOn(Math, 'random').mockImplementation(lcg);
  try { return fn(); } finally { spy.mockRestore(); }
}

export { core };
