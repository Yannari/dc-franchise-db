// ══════════════════════════════════════════════════════════════════════
// tr-castle-reachability.test.js — the two castle sweeps that are GUARDS,
// in a file `npm test` collects
// ══════════════════════════════════════════════════════════════════════
//
// WHY THIS FILE EXISTS AT ALL (whole-plan review, finding 4). These two sweeps
// used to live in tests/tr-castle-audit.test.js, whose name matches
// `**/*-audit.test.js` — the pattern vitest.config.js excludes from `npm test`.
// It is not in vitest.slow.js either, so the nightly `npm run test:sim` does
// not collect it, and no workflow runs `audit:*`. Task 6's deliverable
// therefore executed in NO automated context whatsoever: only when a human
// typed `npm run audit:tr-castle`.
//
// vitest.config.js's own comment draws the line the other way round, by name:
// "the regression guards that actually catch things (THE DEAD-EVENT SWEEP, the
// replay checks, the render completeness sweep) are not audits and still run
// every time." This is the second time this trap has landed in this project;
// Task 4 caught it once and wrote "MY FILENAME WOULD HAVE MADE THE GATE NEVER
// RUN" in the ledger.
//
// The tables — eligible-set sizes, cross-season Jaccard, within-season
// distinctness — stay in the audit file. They are things you run and READ when
// changing content. These two are pass/fail and belong here.
//
// ── WHY 400 SEASONS, AND NOT 5,000 (findings 5 and 11) ──
//
// The old number was 5,000, with the comment "margin for rare-but-reachable
// pair-specific callback/romance events" — i.e. the count was raised until the
// content passed. Spec §5.7 sets the standard the other way: "Dead event,
// never fired across 20 simulated seasons, is an audit, not a hope."
//
// 400 is derived from the pool as it now stands, not from what makes it pass.
// Measured over 1,000 seasons after the content fixes in this same round, the
// RAREST event in the pool fires 25 times — one season in forty, the floor the
// review itself proposed. At 400 seasons that event expects 10 firings, so the
// probability of the sweep missing it by chance is about 5 in 100,000; every
// other event has more headroom than that. If a future change drops something
// below one-in-forty, this sweep is supposed to go red, and it will.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { EVENTS } from '../js/tr/events.js';
import { seedFranchiseHistory, seedEmptyHistory } from './helpers/tr-castle-fixture.js';
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
const SWEEP_SEASONS = 400;

function runSeasons(n, seedBase = 0) {
  const perSeason = [];
  for (let i = 1; i <= n; i++) {
    setPlayers(ROSTER);
    seedFranchiseHistory(CAST);
    const res = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: seedBase + i });
    const fired = [];
    for (const round of res.log) {
      for (const ce of (round.castleEvents || [])) {
        fired.push({ ep: round.ep, id: ce.event.id, family: ce.event.family });
      }
    }
    perSeason.push(fired);
  }
  return perSeason;
}

const SEASONS = runSeasons(SWEEP_SEASONS);
const ALL_FIRINGS = SEASONS.flat();

describe('THE DEAD-EVENT SWEEP', () => {
  it(`every registered event fires at least once across ${SWEEP_SEASONS} seasons`, () => {
    const countPerId = {};
    for (const f of ALL_FIRINGS) countPerId[f.id] = (countPerId[f.id] || 0) + 1;
    const dead = EVENTS.map(e => e.id).filter(id => !countPerId[id]);

    // The bottom of the distribution, printed unconditionally: the number the
    // season count above is derived FROM. If this list starts creeping toward
    // zero, the answer is to fix or delete the content, not to raise 400.
    const rarest = EVENTS.map(e => ({ id: e.id, family: e.family, n: countPerId[e.id] || 0 }))
      .sort((a, b) => a.n - b.n).slice(0, 10);
    console.log(`\n=== RAREST TEN (${SWEEP_SEASONS} seasons, ${ALL_FIRINGS.length} firings) ===`);
    for (const r of rarest) console.log(`   ${r.n}\t${r.family}\t${r.id}`);

    expect(dead, `these events never fired in ${SWEEP_SEASONS} seasons and are dead content: ${dead.join(', ')}`)
      .toEqual([]);
  });

  it('registers 80+ events across the seven families (honest count, not padded to a target)', () => {
    const byFamily = {};
    for (const ev of EVENTS) (byFamily[ev.family] ||= 0, byFamily[ev.family]++);
    console.log('Per-family counts:', byFamily);
    expect(EVENTS.length).toBeGreaterThanOrEqual(80);
  });
});

describe('THE FAMILY-DOMINANCE BAND', () => {
  // ── MOVED HERE IN FIX ROUND 2 (R3), AND WHY ──
  //
  // This is the only pass/fail bar the castle content has against repetition,
  // and until now it lived in tests/tr-castle-audit.test.js. That filename
  // matches `**/*-audit.test.js`, which vitest.config.js excludes from
  // `npm test`; it is not in vitest.slow.js either, and no workflow runs
  // `audit:*`. Round 1 re-banded it 0.50 -> 0.45 *inside that file*, so the
  // tightened band ran in no job at all. Same trap as this file's own header
  // describes, third occurrence. Bars live here; tables live there.
  //
  // ── WHERE 0.45 COMES FROM ──
  //
  // It used to be titled "beyond 35%" and assert `toBeLessThan(0.50)` against
  // a worst measured share of 0.211 — a name stating a threshold its own
  // assertion did not enforce (whole-plan review, finding 9). The review's
  // number was itself wrong: re-measured on the shipped pool BEFORE round 1's
  // content work, the worst was trust-trade-reads at 0.455 of the trust
  // family. The NAME was the defect; the band was very nearly right.
  //
  // Re-measured after round 1's content work, over the 1,000-season audit:
  // worst 0.395 (trust-trade-reads), romance-spark 0.389 behind it. The band
  // is 0.45 — near the measurement, loose enough for ordinary drift, tight
  // enough that one event genuinely running away with its family trips it.
  // Over the 400 seasons THIS file plays — the sample the band now actually
  // runs against — the same worst event measures 0.407, with romance-spark at
  // 0.394 behind it. So the band has about 0.04 of headroom, not 0.05; both
  // numbers are printed on every run rather than left in a comment to rot.
  //
  // trust-trade-reads taking two firings in five of its own family is a real
  // repetition finding and is NOT fixed here: it predates round 1 and belongs
  // with the scene-selection work.
  it('no single event takes more than 45% of its family\'s firings', () => {
    const familyTotal = {};
    const idTotal = {};
    for (const f of ALL_FIRINGS) {
      familyTotal[f.family] = (familyTotal[f.family] || 0) + 1;
      idTotal[f.id] = (idTotal[f.id] || 0) + 1;
    }
    const shares = Object.entries(idTotal).map(([id, count]) => {
      const ev = EVENTS.find(e => e.id === id);
      const share = count / (familyTotal[ev.family] || 1);
      return { id, family: ev.family, share: Math.round(share * 1000) / 1000 };
    }).sort((a, b) => b.share - a.share);
    console.log(`\n=== TOP FIRING SHARES (${SWEEP_SEASONS} seasons) ===`);
    for (const s of shares.slice(0, 8)) console.log(`   ${s.share}\t${s.family}\t${s.id}`);
    const worst = shares[0];
    expect(worst.share, `${worst.id} is ${(worst.share * 100).toFixed(1)}% of family "${worst.family}"'s firings`)
      .toBeLessThan(0.45);
  });
});

describe('THE COOLDOWN SWEEP: does the engine\'s own cooldown hold in real seasons?', () => {
  it('no event fires again inside its own event-scope cooldown, in any real season', () => {
    const byId = {};
    for (const ev of EVENTS) byId[ev.id] = ev;
    const violations = [];
    for (const season of SEASONS) {
      const epsById = {};
      for (const f of season) (epsById[f.id] ||= []).push(f.ep);
      for (const [id, eps] of Object.entries(epsById)) {
        const sorted = [...eps].sort((a, b) => a - b);
        const window = byId[id]?.cooldown?.event ?? 2;
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] - sorted[i - 1] < window) violations.push({ id, gap: sorted[i] - sorted[i - 1], window });
        }
      }
    }
    expect(violations, JSON.stringify(violations.slice(0, 10))).toEqual([]);
  });
});

describe('CALLBACK IS DEAD IN A DEBUT SEASON (documented, not fixed)', () => {
  // callback.js's own header says this too. This test exists so a green run is
  // never mistaken for "callback works in season one" — the sweep above only
  // shows callback alive because the fixture installs a returnee ledger on
  // purpose. Here we run WITHOUT one and confirm the family goes to zero while
  // the other six do not, proving it reads real history rather than faking it,
  // and pricing the cost of that correctness.
  it('with an empty ledger, callback fires 0 while the other six families are unaffected', () => {
    const perFamily = {};
    for (let i = 1; i <= 60; i++) {
      setPlayers(ROSTER);
      seedEmptyHistory();
      const res = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 90000 + i });
      for (const round of res.log) {
        for (const ce of (round.castleEvents || [])) {
          perFamily[ce.event.family] = (perFamily[ce.event.family] || 0) + 1;
        }
      }
    }
    console.log('=== DEBUT-SEASON (empty ledger) FIRINGS PER FAMILY ===', perFamily);
    expect(perFamily.callback ?? 0).toBe(0);
    for (const fam of ['trust', 'suspicion', 'grief', 'cover', 'romance', 'testing']) {
      expect(perFamily[fam] ?? 0, `family "${fam}" should still fire with no franchise history`).toBeGreaterThan(0);
    }
  });
});
