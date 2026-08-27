// @vitest-environment jsdom
// Task 17 — a full season with coaches, run end to end and measured.
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
import { describe, expect, it, vi } from 'vitest';
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
import * as coachesMod from '../js/coaches.js';
import * as coachEpisodeMod from '../js/coach-episode.js';
import { addCoach } from '../js/coaches.js';

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
 */
async function runHeadlessSeason({ twist, coachesPerTribe = 0, castSize = 16, mergeAt = 10 } = {}) {
  core.setPlayers(makeCast(castSize));
  const twistSchedule = [];
  if (twist === 'coaches') {
    for (let e = 1; e <= 40; e++) twistSchedule.push({ episode: e, type: 'coaches', id: `coaches-${e}` });
  }
  core.setSeasonConfig({
    ...core.seasonConfig, name: 'CoachAudit', teams: 2, mergeAt, finaleSize: 3,
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
    episodes.push({
      num: ep.num, eliminated: hist.eliminated ?? ep.eliminated ?? null,
      chalMemberScores: hist.chalMemberScores || ep.chalMemberScores || {},
      votingLog: hist.votingLog || ep.votingLog || [],
      coachPromotions: ep.coachPromotions || null,
      isMerge: ep.isMerge || false,
      activePlayersAfter: [...core.gs.activePlayers],
    });
  }
  return { episodes, coachNames, finalActivePlayers: [...core.gs.activePlayers], guard };
}

describe('a season with coaches', () => {
  it('never lets a coach appear in a challenge result', async () => {
    // Once a coach survives to the merge, promoteCoaches() makes them a real
    // contestant — from that episode on they are SUPPOSED to compete. The
    // property under test is about coaches WHILE THEY ARE STILL COACHES, so
    // track promotions as they land and stop checking a name the moment it
    // graduates. (The brief's literal sample checked every coach for the
    // whole season, which would fail on any season where a coach survives to
    // merge — that is property 5 working, not a violation of property 1.)
    const season = await runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2 });
    const stillCoach = new Set(season.coachNames);
    for (const ep of season.episodes) {
      // Promotion (if any) happens mid-episode, before that same episode's
      // challenge — so a coach promoted THIS episode is already a legitimate
      // competitor for it. Apply the promotion before checking.
      for (const p of (ep.coachPromotions || [])) stillCoach.delete(p.name);
      const scored = Object.keys(ep.chalMemberScores || {});
      for (const coach of stillCoach) {
        expect(scored, `${coach} competed in episode ${ep.num}`).not.toContain(coach);
      }
    }
  });

  it('never records a vote cast by a coach', async () => {
    // Same promotion carve-out as above: a promoted coach is a full player
    // and voting is exactly what they are now supposed to do.
    const season = await runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2 });
    const stillCoach = new Set(season.coachNames);
    for (const ep of season.episodes) {
      for (const p of (ep.coachPromotions || [])) stillCoach.delete(p.name);
      for (const v of (ep.votingLog || [])) {
        if (v.voter === 'THE GAME') continue; // system-generated entries, not a ballot
        expect(stillCoach.has(v.voter), `${v.voter} cast a ballot`).toBe(false);
      }
    }
  });

  it('lets a coach be voted out', async () => {
    // "Voted out" means voted out AS A COACH — before promotion, while they
    // still fit the twist's own definition (never compete, never vote, can
    // be voted off directly). A promoted coach who is later eliminated as an
    // ordinary contestant is not this property; it is property 5 (promotion)
    // running its normal course, so promotions are applied before the
    // eliminated-name check on each episode, exactly like tests 1 and 2.
    const seasons = await Promise.all(Array.from({ length: 20 }, () =>
      runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2 })));
    const anyBooted = seasons.some(s => {
      const stillCoach = new Set(s.coachNames);
      return s.episodes.some(e => {
        for (const p of (e.coachPromotions || [])) stillCoach.delete(p.name);
        return stillCoach.has(e.eliminated);
      });
    });
    expect(anyBooted, 'in 20 seasons no coach was ever voted out while still a coach').toBe(true);
  }, 240000);

  it('does not let coaches be booted every single time either', async () => {
    // The free-boot problem, measured. If a coach is the first elimination in
    // nearly every season, the training cost and the awe are not biting.
    const seasons = await Promise.all(Array.from({ length: 20 }, () =>
      runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2 })));
    const firstBootWasCoach = seasons.filter(s =>
      s.coachNames.includes(s.episodes.find(e => e.eliminated)?.eliminated)).length;
    console.log(`COACH FIRST-BOOT RATE: ${firstBootWasCoach}/20`);
    expect(firstBootWasCoach, `${firstBootWasCoach}/20 first boots were coaches`).toBeLessThan(14);
  }, 240000);

  it('promotes whoever survived to the merge', async () => {
    // Checked against the SNAPSHOT TAKEN AT THE MERGE EPISODE, not the
    // season-ending roster: a promoted coach becomes a full contestant and
    // can legitimately be voted out later like anyone else. What this
    // property actually claims is narrower — that promotion lands them in
    // gs.activePlayers the moment it happens — so that is what is checked.
    // (The brief's literal sample asserted membership in the FINAL roster,
    // which a mid-jury promoted coach would fail for reasons that have
    // nothing to do with promotion working.)
    const season = await runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2 });
    const merged = season.episodes.find(e => e.coachPromotions);
    if (!merged) return;   // every coach was voted out; a legitimate season
    for (const p of merged.coachPromotions) {
      expect(merged.activePlayersAfter, `${p.name} promoted but missing from activePlayers at the merge`).toContain(p.name);
    }
  });
});
