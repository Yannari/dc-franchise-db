// @vitest-environment jsdom
// Full-season integration audit (roadmap item 1). Runs COMPLETE seasons headlessly
// — camp events → challenge → voting → elimination → merge → finale — and aggregates
// strategy/alliance/vote/jury metrics. Mirrors main.js's window-exposure so bare-global
// sim calls resolve; stubs only IndexedDB-backed persistence.
import { describe, it, expect, vi } from 'vitest';
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
// expose every export (functions AND constants like TWIST_CATALOG) so bare-global sim refs resolve
for (const m of MODS) for (const [k, v] of Object.entries(m)) { try { window[k] = v; } catch { /* read-only live binding */ } }
window.saveGameState = () => {};          // real one needs IndexedDB
window.snapshotGameState = savestateMod.snapshotGameState;
window.patchEpisodeHistory = savestateMod.patchEpisodeHistory;

// bare-global object that episode.js writes checkpoints to
if (!window.gsCheckpoints) window.gsCheckpoints = {};
if (!window._tvState) window._tvState = {};

// presentation-layer helpers the sim calls for summary text / VP — the audit never reads
// these, so stub them with safe empties instead of importing the whole VP/UI graph.
const _ARR = () => [], _STR = () => '', _NOOP = () => {};
Object.assign(window, {
  getTribeAdvantageStatus: _ARR, getTribeRelationshipHighlights: _ARR, generateChallengeNotes: _ARR,
  buildTribalQA: _STR, rpBuildAftermath: _STR, generateAftermathShow: _NOOP, buildCrashout: _STR,
});

// minimal in-memory IndexedDB shim (jsdom has none) so persistence calls resolve quietly
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

function makeCast(n) {
  const cast = [];
  for (let i = 0; i < n; i++) {
    const stats = {}; STATS.forEach(s => stats[s] = 2 + Math.floor(Math.random() * 9));
    cast.push({ name: `P${i + 1}`, slug: `p${i + 1}`, gender: i % 2 ? 'm' : 'f',
      sexuality: 'straight', archetype: ARCHS[i % ARCHS.length], stats, tribe: i < n / 2 ? 'Ravu' : 'Moto' });
  }
  return cast;
}

function runOneSeason(castSize = 16) {
  core.setPlayers(makeCast(castSize));
  core.setSeasonConfig({
    ...core.seasonConfig, name: 'Audit', teams: 2, mergeAt: 10, finaleSize: 3,
    finaleFormat: 'traditional', jurySize: 7, romance: 'disabled', aftermath: 'disabled',
    popularityEnabled: false, advantages: { idol: { enabled: true } },
  });
  const ok = savestateMod.initGameState();
  if (!ok) throw new Error('initGameState failed');
  // keep bare-global reads (some presentation code reads window.gs/players, not the live import) in sync
  const sync = () => { window.gs = core.gs; window.players = core.players; window.seasonConfig = core.seasonConfig; };
  sync();
  let guard = 0;
  while (core.gs.phase !== 'complete' && core.gs.activePlayers.length > 1 && guard++ < 80) {
    sync();
    const ep = core.gs.phase === 'finale' ? finaleMod.simulateFinale() : episodeMod.simulateEpisode();
    if (!ep) break;
  }
  return { phase: core.gs.phase, episodes: core.gs.episodeHistory.length, winner: core.gs.winner || core.gs.finaleResult?.winner || null, guard };
}

// ── extract per-season metrics from a finished gs ──
function collectSeason(g, winner) {
  const S = { episodes: g.episodeHistory.length, completed: g.phase === 'complete' ? 1 : 0,
    winnerArch: core.players.find(p => p.name === winner)?.archetype || null };
  const als = g.namedAlliances || [];
  S.alliances = als.length;
  S.alliancesDissolved = als.filter(a => a.active === false).length;
  let betr = 0, major = 0, expul = 0, pitchInc = 0, pitchExcl = 0, lifespanSum = 0, lifespanN = 0;
  const endEp = g.episodeHistory.length;
  als.forEach(a => {
    (a.betrayals || []).forEach(b => { betr++; if (b.severity === 'major') major++; });
    (a.quits || []).forEach(q => { if ((q.reason || '').includes('expel')) expul++; });
    (a.pitchIncidents || []).forEach(pi => { pitchInc++; if (pi.excluded) pitchExcl++; });
    // lifespan: formed → last betrayal/quit ep if dissolved, else season end
    const evEps = [...(a.betrayals || []).map(b => b.ep), ...(a.quits || []).map(q => q.ep)].filter(Boolean);
    const end = a.active === false && evEps.length ? Math.max(...evEps) : endEp;
    if (typeof a.formed === 'number') { lifespanSum += Math.max(0, end - a.formed); lifespanN++; }
  });
  S.betrayals = betr; S.majorBetr = major; S.expulsions = expul; S.pitchIncidents = pitchInc; S.pitchExclusions = pitchExcl;
  S.avgLifespan = lifespanN ? lifespanSum / lifespanN : 0;
  // vote outcomes per tribal
  let trib = 0, unan = 0, maj = 0, plur = 0, tie = 0;
  g.episodeHistory.forEach(h => {
    if (!h.votes || !Object.keys(h.votes).length) return;
    const counts = Object.values(h.votes), total = counts.reduce((a, b) => a + b, 0), top = Math.max(...counts);
    const topShared = counts.filter(c => c === top).length, distinct = Object.keys(h.votes).length;
    trib++;
    if (topShared > 1) tie++;
    else if (distinct === 1) unan++;
    else if (top > total / 2) maj++;
    else plur++;
  });
  S.tribals = trib; S.unanimous = unan; S.majority = maj; S.plurality = plur; S.ties = tie;
  // Count immunity-idol decisions only; ep.idolPlays also stores unrelated advantages.
  const idolPlays = g.episodeHistory.flatMap(h => (h.idolPlays || []).filter(p =>
    !p.type || ['idol', 'superIdol', 'legacy'].includes(p.type)));
  S.idolPlays = idolPlays.length;
  S.idolSuccesses = idolPlays.filter(p => !p.failed && !p.fake && (p.votesNegated || 0) > 0).length;
  S.idolWastes = idolPlays.filter(p => !p.failed && (p.votesNegated || 0) === 0).length;
  S.idolAllyPlays = idolPlays.filter(p => p.playedFor && p.playedFor !== p.player).length;
  // reputations
  const reps = Object.values(g.strategicReputations || {});
  S.repPlayers = reps.length;
  S.repLabeled = reps.filter(r => (r.labels || []).length).length;
  S.labels = reps.flatMap(r => r.labels || []);
  const repChanges = g.episodeHistory.flatMap(h => h.reputationChanges || []);
  S.repEarnEvents = repChanges.reduce((n, c) => n + (c.earned || []).length, 0);
  S.repLossEvents = repChanges.reduce((n, c) => n + (c.lost || []).length, 0);
  S.repPlayersChanged = new Set(repChanges.filter(c => (c.earned || []).length || (c.lost || []).length).map(c => c.name)).size;
  // jury
  const fr = g.finaleResult;
  if (fr && fr.votes) {
    const jv = Object.values(fr.votes), jt = jv.reduce((a, b) => a + b, 0), wv = fr.votes[fr.winner] || 0;
    S.hasJury = 1; S.juryMargin = wv / Math.max(1, jt); S.juryUnanimous = wv === jt ? 1 : 0;
  } else S.hasJury = 0;
  return S;
}

function lcg(seed) { let s = seed >>> 0; return () => ((s = (1664525 * s + 1013904223) >>> 0) / 0x100000000); }
function pct(v) { return `${(v * 100).toFixed(1)}%`; }

function runAudit(seasons = 60, seed = 20260716) {
  const spy = vi.spyOn(Math, 'random').mockImplementation(lcg(seed));
  const rows = [], labelFreq = {}, winnerArchFreq = {};
  try {
    for (let i = 0; i < seasons; i++) {
      const r = runOneSeason(16);
      const S = collectSeason(core.gs, r.winner);
      rows.push(S);
      S.labels.forEach(l => labelFreq[l] = (labelFreq[l] || 0) + 1);
      if (S.winnerArch) winnerArchFreq[S.winnerArch] = (winnerArchFreq[S.winnerArch] || 0) + 1;
    }
  } finally { spy.mockRestore(); }
  const n = rows.length, sum = k => rows.reduce((a, s) => a + (s[k] || 0), 0), avg = k => sum(k) / n;
  const totalTribals = sum('tribals');
  return {
    seasons: n,
    completionRate: sum('completed') / n,
    avgEpisodes: avg('episodes'),
    avgAlliances: avg('alliances'),
    dissolvedRate: sum('alliancesDissolved') / Math.max(1, sum('alliances')),
    avgLifespan: rows.reduce((a, s) => a + s.avgLifespan, 0) / n,
    betrayalsPerSeason: avg('betrayals'),
    majorBetrayalShare: sum('majorBetr') / Math.max(1, sum('betrayals')),
    expulsionsPerSeason: avg('expulsions'),
    pitchIncidentsPerSeason: avg('pitchIncidents'),
    pitchExclusionRate: sum('pitchExclusions') / Math.max(1, sum('pitchIncidents')),
    unanimousRate: sum('unanimous') / totalTribals,
    majorityRate: sum('majority') / totalTribals,
    pluralityRate: sum('plurality') / totalTribals,
    tieRate: sum('ties') / totalTribals,
    idolPlaysPerSeason: avg('idolPlays'),
    idolAccuracy: sum('idolSuccesses') / Math.max(1, sum('idolPlays')),
    idolWasteRate: sum('idolWastes') / Math.max(1, sum('idolPlays')),
    idolAllyPlayRate: sum('idolAllyPlays') / Math.max(1, sum('idolPlays')),
    reputationLabeledRate: sum('repLabeled') / Math.max(1, sum('repPlayers')),
    reputationEarnsPerSeason: avg('repEarnEvents'),
    reputationLossesPerSeason: avg('repLossEvents'),
    reputationChangedPlayerRate: sum('repPlayersChanged') / Math.max(1, sum('repPlayers')),
    juryMargin: rows.filter(s => s.hasJury).reduce((a, s) => a + s.juryMargin, 0) / Math.max(1, sum('hasJury')),
    juryUnanimousRate: sum('juryUnanimous') / Math.max(1, sum('hasJury')),
    labelFreq, winnerArchFreq, distinctWinnerArchs: Object.keys(winnerArchFreq).length,
  };
}

describe('full-season integration audit', () => {
  it('runs complete seasons and reports stable macro behavior', () => {
    const requestedSeasons = Number.parseInt(process.env.AUDIT_SEASONS || '60', 10);
    const R = runAudit(Number.isFinite(requestedSeasons) && requestedSeasons > 0 ? requestedSeasons : 60);
    console.table([{
      seasons: R.seasons,
      'completion': pct(R.completionRate),
      'avg episodes': R.avgEpisodes.toFixed(1),
      'alliances/season': R.avgAlliances.toFixed(1),
      'dissolved rate': pct(R.dissolvedRate),
      'avg lifespan (eps)': R.avgLifespan.toFixed(1),
      'betrayals/season': R.betrayalsPerSeason.toFixed(1),
      'major betrayal share': pct(R.majorBetrayalShare),
      'expulsions/season': R.expulsionsPerSeason.toFixed(2),
      'exposed pitches/season': R.pitchIncidentsPerSeason.toFixed(2),
      'pitch→exclusion': pct(R.pitchExclusionRate),
    }]);
    console.table([{
      'unanimous votes': pct(R.unanimousRate),
      'majority votes': pct(R.majorityRate),
      'plurality votes': pct(R.pluralityRate),
      'tied votes': pct(R.tieRate),
      'idol plays/season': R.idolPlaysPerSeason.toFixed(2),
      'idol success': pct(R.idolAccuracy),
      'idol wasted': pct(R.idolWasteRate),
      'idol ally plays': pct(R.idolAllyPlayRate),
      'players labeled': pct(R.reputationLabeledRate),
      'rep earns/season': R.reputationEarnsPerSeason.toFixed(2),
      'rep losses/season': R.reputationLossesPerSeason.toFixed(2),
      'players with rep change': pct(R.reputationChangedPlayerRate),
      'avg jury margin': pct(R.juryMargin),
      'unanimous juries': pct(R.juryUnanimousRate),
      'distinct winner archetypes': R.distinctWinnerArchs,
    }]);
    console.log('LABELS:', JSON.stringify(R.labelFreq));
    console.log('WINNER ARCHETYPES:', JSON.stringify(R.winnerArchFreq));

    // ── sanity gates: no catastrophic extremes ──
    expect(R.completionRate).toBe(1);                       // every season finishes
    expect(R.avgEpisodes).toBeGreaterThan(6);
    expect(R.unanimousRate).toBeLessThan(0.85);             // not everyone rubber-stamps
    expect(R.tieRate).toBeLessThan(0.30);                   // ties aren't chaos
    expect(R.majorityRate + R.pluralityRate + R.unanimousRate + R.tieRate).toBeCloseTo(1, 5);
    expect(R.betrayalsPerSeason).toBeGreaterThan(0);        // alliances actually fracture
    expect(R.dissolvedRate).toBeGreaterThan(0);
    expect(R.reputationLabeledRate).toBeGreaterThan(0);     // reputations get earned
    expect(R.reputationLabeledRate).toBeLessThan(0.95);     // but not everyone, not too early
    expect(R.idolAccuracy).toBeGreaterThan(0.05);           // reads sometimes work
    expect(R.idolAccuracy).toBeLessThan(0.95);              // but holders are not omniscient
    expect(R.idolWasteRate).toBeGreaterThan(0);             // paranoia/desperation can waste one
    expect(R.reputationEarnsPerSeason).toBeGreaterThan(0);  // labels emerge from behavior
    expect(R.reputationChangedPlayerRate).toBeLessThan(0.95); // reputation is not universal churn
    expect(R.juryMargin).toBeGreaterThan(0.34);             // winner gets a plurality at least
    expect(R.distinctWinnerArchs).toBeGreaterThan(3);       // different archetypes win
  }, 240000);
});
