// ══════════════════════════════════════════════════════════════════════
// tr-castle-audit.test.js — the TABLES. Run this and read it when you
// change castle content.
// ══════════════════════════════════════════════════════════════════════
//
// A viewer does not experience "the pool has 81 events" — they experience a
// handful of firings a round, across a season, against whatever the ELIGIBLE
// set happens to be at that window in that act. A big pool with a starved
// eligible set at a given (window, act) still repeats badly. This file
// measures that and prints the numbers; the numbers ARE the deliverable.
//
// WHAT IS NOT HERE ANY MORE (whole-plan review, finding 4). The dead-event
// sweep and the cooldown sweep used to live here, and this filename matches
// `**/*-audit.test.js`, which vitest.config.js excludes from `npm test`. They
// were guards sitting in a file nothing runs. They moved to
// tests/tr-castle-reachability.test.js, which the ordinary run collects. What
// is left here is genuinely a tool: it plays seasons and prints tables, and
// nothing in it is a bar any more.
//
// FIX ROUND 2, R3. Round 1 left ONE assertion here — the family-dominance
// band — and re-banded it 0.50 -> 0.45 inside this file, which is the file
// `**/*-audit.test.js` excludes from `npm test`. That is the third time this
// exact trap has landed in this project. The band now lives in
// tests/tr-castle-reachability.test.js next to the other two sweeps the
// ordinary run collects. What is left here prints tables and asserts only
// that it measured something.
//
// Run it: npm run audit:tr-castle
import { describe, expect, it } from 'vitest';
import { gs, setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { EVENTS, eligible } from '../js/tr/events.js';
import { seedFranchiseHistory } from './helpers/tr-castle-fixture.js';
import roster from '../franchise_roster.json';

// Side-effect imports: the whole pool, all seven families.
import '../js/tr/castle/trust.js';
import '../js/tr/castle/suspicion.js';
import '../js/tr/castle/grief.js';
import '../js/tr/castle/cover.js';
import '../js/tr/castle/romance.js';
import '../js/tr/castle/callback.js';
import '../js/tr/castle/testing.js';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
// Enough seasons for the shares and the distinctness averages to settle. This
// is a table, not a bar: it is NOT the dead-event sweep's count and must never
// be raised to make anything pass. See tr-castle-reachability.test.js for the
// count that is a threshold, and where it comes from.
const AUDIT_SEASONS = 1000;

function seededRng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function runAuditSeasons(n) {
  const perSeason = [];
  for (let i = 1; i <= n; i++) {
    setPlayers(ROSTER);
    seedFranchiseHistory(CAST);
    const res = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: i });
    const fired = [];
    for (const round of res.log) {
      for (const ce of (round.castleEvents || [])) {
        fired.push({
          ep: round.ep, id: ce.event.id, family: ce.event.family, window: ce.event.window,
          branch: ce.consequences?.branch ?? null,
        });
      }
    }
    perSeason.push(fired);
  }
  return perSeason;
}

const SEASONS = runAuditSeasons(AUDIT_SEASONS);
const ALL_FIRINGS = SEASONS.flat();

describe('THE FIRING DISTRIBUTION', () => {
  it('prints every event\'s firing count, by family', () => {
    const countPerId = {};
    for (const f of ALL_FIRINGS) countPerId[f.id] = (countPerId[f.id] || 0) + 1;
    const byFamily = {};
    for (const ev of EVENTS) (byFamily[ev.family] ||= []).push(ev.id);
    console.log(`\n=== FIRING DISTRIBUTION (${AUDIT_SEASONS} seasons, ${ALL_FIRINGS.length} total firings) ===`);
    for (const [family, ids] of Object.entries(byFamily)) {
      console.log(`-- ${family} (${ids.length} events) --`);
      for (const id of ids) console.log(`   ${id}: ${countPerId[id] || 0}`);
    }
    expect(ALL_FIRINGS.length).toBeGreaterThan(0);
  });

});

describe('REPETITION-AS-EXPERIENCED', () => {
  it('1. eligible-set size per (window, act): median and minimum', () => {
    const WINDOWS = ['dawn', 'morning', 'journey-out', 'journey-back', 'evening', 'after-table', 'night'];
    const ACT_EP = { early: 2, middle: 5, late: 9 };
    const cells = {};
    let seedCounter = 5000;
    for (const [act, repEp] of Object.entries(ACT_EP)) {
      for (let trial = 0; trial < 15; trial++) {
        seedCounter++;
        setPlayers(ROSTER);
        seedFranchiseHistory(CAST);
        // Play a truncated season up to this act's representative round, so
        // the accumulated bonds/threads/alignment are REAL, not synthetic —
        // only the actor draw used to sample eligible() below is separate
        // from the real castle rng, since eligible() is a pure read and
        // sampling it extra times cannot perturb the real run (it never
        // touches cooldowns or the round budget; only pickEvent() does).
        playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: seedCounter, maxRounds: repEp });
        const living = gs.activePlayers || [];
        if (living.length < 2) continue;
        const rng = seededRng(seedCounter * 31 + 1);
        for (let s = 0; s < 6; s++) {
          const i = Math.floor(rng() * living.length);
          let j = Math.floor(rng() * living.length);
          while (j === i && living.length > 1) j = Math.floor(rng() * living.length);
          const actors = rng() < 0.4 ? [living[i]] : [living[i], living[j]];
          for (const window of WINDOWS) {
            const ctx = { ep: repEp, window, act, living, actors };
            const size = eligible(ctx).length;
            const key = `${window}|${act}`;
            (cells[key] ||= []).push(size);
          }
        }
      }
    }
    const report = {};
    for (const [key, sizes] of Object.entries(cells)) {
      const sorted = [...sizes].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      report[key] = { median, min: sorted[0], max: sorted[sorted.length - 1], n: sorted.length };
    }
    console.log('\n=== ELIGIBLE-SET SIZE PER (window, act) ===');
    for (const [key, r] of Object.entries(report)) console.log(`${key}: median=${r.median} min=${r.min} max=${r.max}`);
    // Not a bar — the numbers ARE the finding — but this guards against the
    // measurement itself being silently empty (e.g. a typo'd window name).
    expect(Object.keys(report).length).toBe(21);
  });

  it('2. within-season distinctness: how many firings are distinct ids / distinct (id,branch) outcomes', () => {
    const totals = SEASONS.map(s => s.length);
    const distinctIds = SEASONS.map(s => new Set(s.map(f => f.id)).size);
    const distinctBranches = SEASONS.map(s => new Set(s.map(f => `${f.id}:${f.branch}`)).size);
    const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    console.log('\n=== WITHIN-SEASON DISTINCTNESS ===');
    console.log(`avg firings/season: ${avg(totals).toFixed(1)}`);
    console.log(`avg distinct event ids/season: ${avg(distinctIds).toFixed(1)}`);
    console.log(`avg distinct (id,branch) outcomes/season: ${avg(distinctBranches).toFixed(1)}`);
    expect(totals.length).toBe(AUDIT_SEASONS);
  });

  it('3. cross-season overlap: Jaccard of fired-event-id sets between season pairs', () => {
    const idSets = SEASONS.slice(0, 20).map(s => new Set(s.map(f => f.id)));
    function jaccard(a, b) {
      const inter = [...a].filter(x => b.has(x)).length;
      const union = new Set([...a, ...b]).size;
      return union ? inter / union : 0;
    }
    let sum = 0, pairs = 0;
    for (let i = 0; i < idSets.length; i++) {
      for (let j = i + 1; j < idSets.length; j++) { sum += jaccard(idSets[i], idSets[j]); pairs++; }
    }
    console.log(`\n=== CROSS-SEASON OVERLAP === avg Jaccard over ${pairs} season pairs: ${(sum / pairs).toFixed(3)}`);
    expect(pairs).toBeGreaterThan(0);
  });

  it('4. the most-repeated event and (event, branch) pair within a single season', () => {
    let maxEventRepeat = 0, maxEventRepeatId = null;
    let maxBranchRepeat = 0, maxBranchRepeatKey = null;
    for (const season of SEASONS) {
      const byId = {};
      const byBranch = {};
      for (const f of season) {
        byId[f.id] = (byId[f.id] || 0) + 1;
        const k = `${f.id}:${f.branch}`;
        byBranch[k] = (byBranch[k] || 0) + 1;
      }
      for (const [id, c] of Object.entries(byId)) if (c > maxEventRepeat) { maxEventRepeat = c; maxEventRepeatId = id; }
      for (const [k, c] of Object.entries(byBranch)) if (c > maxBranchRepeat) { maxBranchRepeat = c; maxBranchRepeatKey = k; }
    }
    console.log(`\n=== MOST-REPEATED WITHIN A SEASON ===`);
    console.log(`max single event firings in one season: ${maxEventRepeat} (${maxEventRepeatId})`);
    console.log(`max single (event,branch) firings in one season: ${maxBranchRepeat} (${maxBranchRepeatKey})`);
    expect(maxEventRepeatId).toBeTruthy();
  });
});
