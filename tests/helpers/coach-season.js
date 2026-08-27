// tests/helpers/coach-season.js
// Shared headless-season bootstrap for coach-twist tests. Extracted out of
// tests/coach-season.test.js (not a .test.js file itself) so a second test
// file can import `runHeadlessSeason` without re-executing that file's own
// `describe`/`it` blocks — vitest runs every top-level test registered by a
// module that gets imported, test file or not.
//
// Copies the bootstrap from tests/full-season-audit.test.js (headless season
// in vitest + jsdom) and adds a `coachesPerTribe` option that calls
// `addCoach` after the cast and tribes exist.
//
// IMPORTANT: coaches are added to `players` and to `gs.coaches` AFTER
// initGameState() runs, and are never given a `.tribe` property on their
// player record. `gs.tribes[i].members` is built once, at init, from the
// contestant cast only — a coach's player record is deliberately kept out of
// that grouping (js/coach-episode.js says outright: "Coaches are never in
// `tribe.members`"). Giving a coach a `.tribe` field before init would let
// them fall into `gs.tribes` and compete/vote like a contestant, which is
// exactly the bug this suite exists to catch.
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
import * as coachesMod from '../../js/coaches.js';
import * as coachEpisodeMod from '../../js/coach-episode.js';
import { addCoach } from '../../js/coaches.js';

const MODS = [core, playersMod, bondsMod, alliancesMod, votingMod, advantagesMod, romanceMod,
  challengesCoreMod, campEventsMod, twistsMod, episodeMod, finaleMod, savestateMod, textBacklogMod,
  reputationMod, strategyMemoryMod, votePlanningMod, socialManipMod, settingsMod, rescueIslandMod,
  coachesMod, coachEpisodeMod];
for (const m of MODS) for (const [k, v] of Object.entries(m)) { try { window[k] = v; } catch { /* read-only live binding */ } }
window.saveGameState = () => {};
window.snapshotGameState = savestateMod.snapshotGameState;
window.patchEpisodeHistory = savestateMod.patchEpisodeHistory;
if (!window.gsCheckpoints) window.gsCheckpoints = {};
if (!window._tvState) window._tvState = {};

const _ARR = () => [], _STR = () => '', _NOOP = () => {};
Object.assign(window, {
  getTribeAdvantageStatus: _ARR, getTribeRelationshipHighlights: _ARR, generateChallengeNotes: _ARR,
  buildTribalQA: _STR, rpBuildAftermath: _STR, generateAftermathShow: _NOOP, buildCrashout: _STR,
});

const _idbStore = {};
globalThis.indexedDB = {
  open() {
    const req = {};
    req.result = {
      createObjectStore() {},
      transaction() {
        const tx = { objectStore: () => ({ put(v, k) { _idbStore[k] = v; }, get(k) { const r = { result: _idbStore[k] }; queueMicrotask(() => r.onsuccess && r.onsuccess()); return r; }, delete(k) { delete _idbStore[k]; }, clear() { for (const k in _idbStore) delete _idbStore[k]; } }) };
        queueMicrotask(() => tx.oncomplete && tx.oncomplete());
        return tx;
      },
    };
    queueMicrotask(() => req.onsuccess && req.onsuccess());
    return req;
  },
};

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCHS = ['mastermind', 'schemer', 'hothead', 'challenge-beast', 'social-butterfly', 'loyal-soldier',
  'wildcard', 'chaos-agent', 'floater', 'underdog', 'hero', 'villain', 'goat', 'perceptive-player', 'showmancer'];

function makeStats() { const s = {}; STATS.forEach(k => s[k] = 2 + Math.floor(Math.random() * 9)); return s; }

function makeCast(n) {
  const cast = [];
  for (let i = 0; i < n; i++) {
    cast.push({ name: `P${i + 1}`, slug: `p${i + 1}`, gender: i % 2 ? 'm' : 'f',
      sexuality: 'straight', archetype: ARCHS[i % ARCHS.length], stats: makeStats(), tribe: i < n / 2 ? 'Ravu' : 'Moto' });
  }
  return cast;
}

/**
 * Headless season runner. `twist: 'coaches'` schedules the coaches twist for
 * every episode from 1 through a generous ceiling, so it is active for the
 * whole pre-merge phase AND on the merge episode itself (promoteCoaches only
 * fires when `ep.isCoaches` is set on the episode that crosses the merge
 * threshold — see js/episode.js's MERGE CHECK block).
 *
 * `captureText: true` also runs `generateSummaryText(ep)` immediately after
 * each episode (while `gs` still reflects that episode's resulting state —
 * one more loop iteration mutates gs.activePlayers/gs.tribes/gs.phase out
 * from under a later call) and stores the result on `episodes[i].text`.
 */
export async function runHeadlessSeason({ twist, coachesPerTribe = 0, castSize = 16, mergeAt = 10, captureText = false, teams = 2 } = {}) {
  core.setPlayers(makeCast(castSize));
  const twistSchedule = [];
  if (twist === 'coaches') {
    for (let e = 1; e <= 40; e++) twistSchedule.push({ episode: e, type: 'coaches', id: `coaches-${e}` });
  }
  core.setSeasonConfig({
    ...core.seasonConfig, name: 'CoachAudit', teams, mergeAt, finaleSize: 3,
    finaleFormat: 'traditional', jurySize: 7, romance: 'disabled', aftermath: 'disabled',
    popularityEnabled: false, advantages: { idol: { enabled: true } },
    twistSchedule,
  });
  const ok = savestateMod.initGameState();
  if (!ok) throw new Error('initGameState failed');

  const coachNames = [];
  if (twist === 'coaches' && coachesPerTribe > 0) {
    const extraPlayers = [];
    for (const tribe of core.gs.tribes) {
      for (let c = 0; c < coachesPerTribe; c++) {
        const name = `Coach_${tribe.name}_${c + 1}`;
        // NOTE: deliberately no `.tribe` field — see file header comment.
        extraPlayers.push({ name, slug: name.toLowerCase(), gender: c % 2 ? 'm' : 'f',
          sexuality: 'straight', archetype: ARCHS[(c + 3) % ARCHS.length], stats: makeStats() });
        coachNames.push(name);
      }
    }
    core.setPlayers([...core.players, ...extraPlayers]);
    for (const name of coachNames) {
      const tribe = name.split('_')[1];
      addCoach({ name, tribe });
    }
    // Belt-and-suspenders per the brief: a coach must never be a contestant.
    core.gs.activePlayers = core.gs.activePlayers.filter(n => !coachNames.includes(n));
  }

  const sync = () => { window.gs = core.gs; window.players = core.players; window.seasonConfig = core.seasonConfig; };
  sync();
  const episodes = [];
  let guard = 0;
  while (core.gs.phase !== 'complete' && core.gs.activePlayers.length > 1 && guard++ < 80) {
    sync();
    const ep = core.gs.phase === 'finale' ? finaleMod.simulateFinale() : episodeMod.simulateEpisode();
    if (!ep) break;
    const hist = core.gs.episodeHistory[core.gs.episodeHistory.length - 1] || {};
    let text = null;
    if (captureText) {
      try { text = textBacklogMod.generateSummaryText(ep); } catch { text = null; }
    }
    episodes.push({
      num: ep.num, eliminated: hist.eliminated ?? ep.eliminated ?? null,
      chalMemberScores: hist.chalMemberScores || ep.chalMemberScores || {},
      votingLog: hist.votingLog || ep.votingLog || [],
      coachPromotions: ep.coachPromotions || null,
      coachElimination: ep.coachElimination || null,
      isMerge: ep.isMerge || false,
      activePlayersAfter: [...core.gs.activePlayers],
      ep, // full episode record
      text,
    });
  }
  return { episodes, coachNames, finalActivePlayers: [...core.gs.activePlayers], guard };
}

/**
 * The name eliminated THIS episode, whichever channel it came through.
 *
 * A contestant boot lands on `ep.eliminated`. A coach boot never does —
 * `applyCoachElimination` (coach-episode.js) deliberately nulls it, because a
 * coach voted out costs the tribe its coach, not a contestant's game/jury
 * standing, and records the event on `ep.coachElimination` instead. The two
 * are mutually exclusive within one episode (a tribal council seats exactly
 * one result), so reading `eliminated ?? coachElimination[0].coach` is safe.
 */
export function episodeEliminated(e) {
  return e.eliminated ?? e.coachElimination?.[0]?.coach ?? null;
}
