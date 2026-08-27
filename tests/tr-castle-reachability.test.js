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
//
// ── FIX ROUND 2, R4: THE MARGIN CLAIM ABOVE WAS WRONG BY ~200x ──
//
// It used to read: "the RAREST event in the pool fires 25 times [per 1,000] —
// one season in forty, the floor the review itself proposed. At 400 seasons
// that event expects 10 firings, so the probability of the sweep missing it by
// chance is about 5 in 100,000." This test's OWN printout, four lines of
// console.log below, has said otherwise on every run since it was written:
//
//     === RAREST TEN (400 seasons, 12628 firings) ===
//        6   trust      trust-protect-pact
//        12  romance    romance-showmance-fight
//        12  callback   callback-showmance-reunion-spark
//
// The floor is 6 firings in 400 seasons — 15 per 1,000, one season in 67, not
// one in forty. Poisson at lambda = 6 gives a miss probability of e^-6, about
// 2.5e-3: one run in 400, not one in 20,000. The comment was corrected rather
// than the content raised, and the honest reasons for that choice are:
//
//   - This sweep is DETERMINISTIC. Seeds are 1..400 and the fixture is laid
//     out by index, so it does not roll dice on each run: it passes or it
//     fails, always the same way. The Poisson number is a robustness margin
//     against UNRELATED future change, never a flake rate.
//   - Raising trust-protect-pact, romance-showmance-fight and
//     callback-showmance-reunion-spark to make one-in-forty true is content
//     work: it moves each family's firing shares, and the family-dominance
//     band below plus the twelve calibration bands in tr-calibration.test.js
//     are all measured against the current distribution. Retuning a
//     measurement to rescue a comment is the wrong direction.
//
// SO, STATED PLAINLY AND LEFT OPEN: the pool's rarest event is at one season
// in 67, BELOW the one-in-forty floor the whole-plan review proposed. That is
// a real content finding about trust-protect-pact and it is not fixed here. If
// a future change drops something below the current floor, this sweep goes red
// — with about 2.5e-3 of chance-miss slack rather than 5e-5.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { EVENTS, KNOWN_WINDOWS } from '../js/tr/events.js';
import { actFor, outcomeSense } from '../js/tr/threads.js';
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
import '../js/tr/castle/journey.js';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
// ── PLAN 5 TASK 6: 400 -> 1600, AND EVERY FLOOR IN THIS FILE SCALES WITH IT ──
//
// 400 was derived from the pool as it stood, and it was enough for the
// EVENT-keyed sweeps. It was not enough for the BRANCH-keyed one Task 4 added.
// Task 5 measured why, and the finding is general: a content change does not
// nudge a low count, it RESAMPLES it, because changing which event a draw
// lands on changes what is on cooldown next round and reroutes the whole
// seeded path from there. `romance-liability-exposed:exposes` read 8, 7, 4, 5
// and 6 across five arms of identical decisions. THE BRANCH FLOOR shipped at 4
// against a threshold of 4: zero margin, on a quantity whose own noise is
// larger than the margin. It would have reddened on a change that starved
// nothing and stayed green on one that did.
//
// The fix is the cheapest of the three the plan listed: raise the measurement
// until the count is a measurement. Seeds are fixed, so this costs only
// runtime. Measured over four DISJOINT 1600-season blocks (seed bases 0, 1600,
// 3200, 4800), re-running the whole sweep per block:
//
//   rarest BRANCH   21, 22, 19, 18   mean 20.0   sd 1.83
//   rarest EVENT    32, 32, 36, 29   mean 32.25  sd 2.87
//
// At 400 the same two statistics were 4 and 7. So the branch floor is honestly
// derivable at last: 12 is 4.4 sd under the rarest branch, and the event floor
// of 16 is 5.7 sd under the rarest event.
//
// AND THE FLOORS ARE NOW WRITTEN AS RATES, not as constants. Every count floor
// in this file was a bare integer paired to a season count in a comment, which
// is the same stale-constant shape Task 6 swept out of tr-calibration.test.js:
// change SWEEP_SEASONS and each of them silently tightens or loosens by the
// same factor. `PER400(n)` says "n firings per 400 seasons" and scales, so the
// season count can be raised again by editing one number.
const SWEEP_SEASONS = 1600;
const PER400 = n => Math.round(n * SWEEP_SEASONS / 400);

function runSeasons(n, seedBase = 0, threadSink = null) {
  const perSeason = [];
  for (let i = 1; i <= n; i++) {
    setPlayers(ROSTER);
    seedFranchiseHistory(CAST);
    const res = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: seedBase + i });
    const fired = [];
    for (const round of res.log) {
      for (const ce of (round.castleEvents || [])) {
        // `priorOutcome` is how an event declares it looked at a CLOSED
        // thread's outcome, and `null` vs absent is the distinction the
        // branch floor below is built on: absent means the event does not
        // read outcomes at all, null means it read and found nothing.
        fired.push({ ep: round.ep, id: ce.event.id, family: ce.event.family,
          window: ce.event.window,
          // WHO WAS IN THE ROOM. Recorded for the cooldown sweep's player and
          // pair arms (Plan 5 Task 5): those two scopes cannot be checked from
          // an episode list alone, and `fire()` has already run by the time the
          // harness sees the firing, so this is the only place it survives.
          actors: [...(ce.actors || [])],
          // THE BRANCH THE FIRING ACTUALLY TOOK. See THE BRANCH FLOOR: an
          // event-keyed count cannot see a fork collapse, and three floors in
          // this file were event-keyed.
          branch: ce.consequences?.branch ?? '(none)',
          readsOutcome: !!ce.consequences && 'priorOutcome' in ce.consequences,
          priorOutcome: ce.consequences?.priorOutcome ?? null,
          // `outcome` is how an event declares it CLOSED a thread, and the
          // absent/null distinction is the same one `priorOutcome` uses:
          // absent means the event has no closing branch at all, null means it
          // had one and this firing did not take it. See THE CLOSER FLOOR.
          writesOutcome: !!ce.consequences && 'outcome' in ce.consequences,
          outcome: ce.consequences?.outcome ?? null });
      }
    }
    perSeason.push(fired);
    // THE SEASON'S THREADS, for the prior-outcome ORDER rule at the foot of
    // this file. It needs the closure the firing read, not just the label the
    // firing recorded, and `res.threads` is the only place that survives.
    if (threadSink) threadSink.push((res.threads || []).map(t => ({
      state: t.state, outcome: t.outcome, lastEp: t.lastEp, parties: [...t.parties] })));
  }
  return perSeason;
}

const SEASON_THREADS = [];
const SEASONS = runSeasons(SWEEP_SEASONS, 0, SEASON_THREADS);
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

    // AND THE FLOOR ITSELF, AS AN ASSERTION (fix round 2, R4). The paragraph
    // in this file's header used to make a claim about the bottom of this
    // distribution that was wrong by ~200x, and nothing could tell, because
    // the only thing enforced was "> 0". A comment stating a number no code
    // checks is how that happens. 4 is derived from the measured 6 with room
    // for ordinary drift: an event sliding from 6 firings to 2 is on its way
    // to dead and this run should say so BEFORE it gets there. Deterministic
    // seeds, so this is a bar and not a coin.
    const floor = rarest[0];
    expect(floor.n, `the rarest event in the pool is ${floor.id} at ${floor.n} firings in ${SWEEP_SEASONS} seasons — one season in ${Math.round(SWEEP_SEASONS / Math.max(1, floor.n))}`)
      .toBeGreaterThanOrEqual(PER400(4));
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
  // ── ALL THREE SCOPES, NOT JUST THE FIRST (Plan 5 Task 5) ──
  //
  // This sweep used to check the EVENT scope alone, and read the per-event
  // override while doing it (`byId[id]?.cooldown?.event ?? 2`) - so it was
  // already the guard on a `cooldown` override before any content declared
  // one. The other two scopes had no season-level check at all, which meant a
  // content author could widen `cooldown.player` or `cooldown.pair`, ship it,
  // and nothing outside tests/tr-events.test.js's synthetic events would ever
  // execute the widened value. Task 5 declares two overrides and one of them
  // is `player`, so the missing arms are written here rather than left as a
  // scope that happens not to be covered.
  //
  // Rule-shaped over `EVENTS` and over whatever each event declares, so an
  // override added tomorrow is checked tomorrow.
  //
  // THE MUTATIONS, ONE PER ARM, and the point of having three is that each
  // reddens ONLY its own - the isolation the unequal 2/3/5 defaults exist to
  // give, demonstrated rather than asserted. All three run in js/tr/events.js:
  //   `const playerWindow = ev.cooldown?.player ?? PLAYER_COOLDOWN_EPS;` -> `= 0;`
  //       player arm RED, 656 violations; event and pair arms green.
  //   `const pairWindow = ev.cooldown?.pair ?? PAIR_COOLDOWN_EPS;` -> `= 0;`
  //       pair arm RED, 83 violations; event and player arms green.
  //   `const evWindow = ev.cooldown?.event ?? EVENT_COOLDOWN_EPS;` -> `= 0;`
  //       event arm RED; the other two green.
  const byId = {};
  for (const ev of EVENTS) byId[ev.id] = ev;
  const pairKey = actors => [...actors].sort().join('|');

  it('no event fires again inside its own event-scope cooldown, in any real season', () => {
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

  it('no event fires again on the same PLAYER inside its player-scope cooldown', () => {
    const violations = [];
    let observed = 0;
    for (const season of SEASONS) {
      const eps = {};
      for (const f of season) for (const p of f.actors) (eps[`${f.id}\u0000${p}`] ||= []).push(f.ep);
      for (const [key, list] of Object.entries(eps)) {
        // COUNT ONLY KEYS THAT CAN FAIL (round 2, R2). The loop below cannot
        // report a violation on a key with a single firing, so counting every
        // key would let this pass having examined nothing that could ever go
        // red. See the note on the pair arm, where the two numbers are 34
        // against 14086.
        if (list.length > 1) observed++;
        const id = key.split('\u0000')[0];
        const window = byId[id]?.cooldown?.player ?? 3;
        const sorted = [...list].sort((a, b) => a - b);
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] - sorted[i - 1] < window) {
            violations.push({ key: key.replace('\u0000', ':'), gap: sorted[i] - sorted[i - 1], window });
          }
        }
      }
    }
    expect(violations.slice(0, 10), `${violations.length} player-scope cooldown violations`).toEqual([]);
    // Guard on the guard: (event, player) keys with a REPEAT have to be
    // reaching this sweep, or the loop above examines nothing that could fail.
    // Measured 965 repeating keys of 32150, i.e. 3.0%; the floor is 300.
    expect(observed, 'no (event, player) key repeated at all - every gap check above was '
      + 'vacuous, and the harness may not be recording actors').toBeGreaterThan(300);
  });

  it('no event fires again on the same PAIR inside its pair-scope cooldown', () => {
    const violations = [];
    let observed = 0;
    for (const season of SEASONS) {
      const eps = {};
      for (const f of season) {
        if (f.actors.length < 2) continue;
        (eps[`${f.id}\u0000${pairKey(f.actors)}`] ||= []).push(f.ep);
      }
      for (const [key, list] of Object.entries(eps)) {
        // ONLY KEYS THAT CAN FAIL, and this arm is why the rule matters: 14086
        // (event, pair) keys are produced across 400 seasons and just 34 of
        // them - 0.24% - ever hold a second firing, because the sampler draws
        // one specific pair about once in 190 attempts. The first version
        // counted all 14086 and would have read PASSED over a world where no
        // pair ever repeated and the pair cooldown was never once consulted.
        if (list.length > 1) observed++;
        const id = key.split('\u0000')[0];
        const window = byId[id]?.cooldown?.pair ?? 5;
        const sorted = [...list].sort((a, b) => a - b);
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] - sorted[i - 1] < window) {
            violations.push({ key: key.replace('\u0000', ':'), gap: sorted[i] - sorted[i - 1], window });
          }
        }
      }
    }
    expect(violations.slice(0, 10), `${violations.length} pair-scope cooldown violations`).toEqual([]);
    // Measured 34 repeating keys of 14086. The floor is 10 - low because the
    // quantity itself is low, and deliberately NOT propped up by playing more
    // seasons, since all it has to prove is that the pair scope is consulted.
    expect(observed, 'no (event, pair) key repeated at all in 400 seasons - the pair-scope '
      + 'cooldown was never consulted and the check above is vacuous').toBeGreaterThan(10);
  });

  it('the two declared cooldown overrides are the reason a gap is wider than the default', () => {
    // The three sweeps above read `ev.cooldown ?? default`, so they pass
    // whether or not any override exists - they check the engine honours what
    // is declared, not that anything IS declared. This one checks the
    // OVERRIDES ARE LIVE: for every event that widens a scope past the
    // default, the tightest gap actually observed in 400 seasons must be at
    // least the widened value, and must be wider than the default it replaced.
    // Without that second half, an override on an event that only ever fires
    // once a season would read as working while doing nothing.
    const DEFAULTS = { event: 2, player: 3, pair: 5 };
    const widened = EVENTS.filter(e => e.cooldown
      && Object.entries(e.cooldown).some(([k, v]) => v > (DEFAULTS[k] ?? 0)));
    expect(widened.length, 'no event widens any cooldown scope past the engine default')
      .toBeGreaterThanOrEqual(1);

    const report = [];
    for (const ev of widened) {
      for (const [scope, value] of Object.entries(ev.cooldown)) {
        if (!(value > DEFAULTS[scope])) continue;
        let tightest = Infinity;
        for (const season of SEASONS) {
          const eps = {};
          for (const f of season) {
            if (f.id !== ev.id) continue;
            if (scope === 'event') (eps.all ||= []).push(f.ep);
            else if (scope === 'player') for (const p of f.actors) (eps[p] ||= []).push(f.ep);
            else if (f.actors.length >= 2) (eps[pairKey(f.actors)] ||= []).push(f.ep);
          }
          for (const list of Object.values(eps)) {
            const sorted = [...list].sort((a, b) => a - b);
            for (let i = 1; i < sorted.length; i++) tightest = Math.min(tightest, sorted[i] - sorted[i - 1]);
          }
        }
        report.push({ id: ev.id, scope, declared: value, default: DEFAULTS[scope], tightest });
      }
    }
    console.log(`\n=== DECLARED COOLDOWN OVERRIDES (${SWEEP_SEASONS} seasons) ===`);
    for (const r of report) {
      console.log(`   ${r.id}.${r.scope}: declared ${r.declared} (default ${r.default}), `
        + `tightest observed gap ${r.tightest === Infinity ? 'never repeated' : r.tightest}`);
    }
    const inert = report.filter(r => r.tightest < r.declared)
      .map(r => `${r.id}.${r.scope}: observed a gap of ${r.tightest} against a declared ${r.declared}`);
    expect(inert, 'a widened cooldown was not honoured').toEqual([]);
    // ...and at least one of them is doing WORK: a repeat that would have been
    // legal under the default is not legal now and does not happen. If every
    // widened override only ever sat above a gap the default already forbade,
    // the declarations would be decoration.
    const biting = report.filter(r => r.tightest !== Infinity && r.tightest >= r.declared
      && r.declared > r.default);
    expect(biting.length, 'every widened cooldown sits on an event that never repeats anyway, '
      + 'so no override in the pool is doing anything').toBeGreaterThanOrEqual(1);
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

// ══════════════════════════════════════════════════════════════════════
// ADVANCER COVERAGE, PINNED (Plan 5 Task 1 round 3, R2)
// ══════════════════════════════════════════════════════════════════════
//
// Plan 5 measured that the ceiling on thread length is not either continuation
// lever but the number of events that can ADVANCE a thread, and where they
// sit. That measurement was then written into three separate comments and a
// plan document — and all three copies were WRONG, in the same direction, by
// the same hand: "26 cells, 11 zero, 13 one" against a true 28 / 10 / 12 / 6.
// Nothing in the suite could have caught it, because nothing asserted on the
// shape of the pool at all.
//
// So this pins it. It is not a quality bar — Plan 5's binding requirement
// (no cell below two advancers) is deliberately NOT asserted here, because it
// is not met yet and Tasks 2, 4 and 5 are what meet it. This is a LEDGER: it
// fails when the numbers quoted elsewhere stop being true, which is exactly
// when somebody must go and update them.
//
// A cell is a (family x window) pair that has at least one event in it. Empty
// cells are not counted — `journey-out`, `journey-back` and `night` hold
// almost nothing, and counting their absent cells as "zero-advancer" would
// inflate the number that matters.
//
// == UPDATED BY PLAN 5 TASK 2: 27 -> 32, and 10 zero cells -> 7 ==
//
// AND THE FINDING THAT CAME WITH IT, because the numbers alone would mislead
// exactly as the last three copies of them did. `advancesThread` is a
// DECLARATION, not a capability. `openThread(kind, parties, ...)` consults
// `findOpenThread` first and FOLDS into an open thread with the same kind and
// the same party set, so almost every event in this pool was already
// continuing a story whenever its actors had one of its own family open — the
// flag only ever controlled two things: whether guard 1 multiplies the event's
// score, and whether `pickEvent` labels the firing `continued` for the
// harness. So Plan 5's "in 49% of live-thread scenes NO eligible event could
// advance it" measured the FLAG and not the pool. What actually gates a
// continuation is the drawn event's FAMILY matching the thread's kind, plus
// the 5-episode pair cooldown.
//
// Measured, 200 seeded seasons, before and after Task 2:
//   mean thread   1.431 -> 1.461 beats      first-beat death  73.9% -> 72.3%
//   payoff rate   3.96% -> 3.93%            people/season     14.49 -> 14.44
// (At the 44-declaration high-water mark it read 1.479 beats and a payoff rate
// of 3.48% — MORE length and FEWER payoffs, because guard 1 prefers advancing
// events over the flagship forks that close a thread. Trimming the ten
// `morning` declarations recovered the payoffs and cost 0.018 beats.)
// With guard 1 flattened the seasons are BIT-IDENTICAL (mean 1.363, 2975
// live-thread scenes, both arms), which is the proof of the paragraph above:
// declaring the flag changed no thread's shape, only which events the guard
// prefers to draw. The conditional continuation rate moves 36.1% -> 56.0%
// live and 23.3% -> 30.5% with the guard off, almost all of it re-labelling.
// The second of those broke a control-arm assertion in tr-calibration.test.js
// (`dead.rate < 0.30`), whose floor was re-derived to 0.38 as a result.
describe('advancer coverage: the pool shape Plan 5 quotes', () => {
  function cells() {
    const out = new Map();
    for (const ev of EVENTS) {
      const k = `${ev.family}|${ev.window}`;
      if (!out.has(k)) out.set(k, { total: 0, adv: 0 });
      const c = out.get(k);
      c.total++;
      if (ev.advancesThread) c.adv++;
    }
    return out;
  }

  it('98 events, 39 of which can advance a thread and 33 of which cite residue', () => {
    // MOVED BY PLAN 5 TASK 4, deliberately: 81 -> 98 events (97 after round 1;
    // round 2 added `romance-showmance-on-the-way-back`, a second escalation
    // door for a family whose flagship's four branches were all at or under the
    // branch floor because only one event in the pool could create the state it
    // needs). Round 2 also RELOCATED three events out of `evening` and
    // `after-table` into the thin windows, which moves no count here but moves
    // the cell ledger below. Sixteen new ones
    // populate the three windows that held almost nothing (`journey-out` and
    // `journey-back` held ZERO between them; `night` held one, and drew 36 of
    // 13,553 firings across 400 seasons).
    //
    // SEVEN of those sixteen declare `advancesThread` (32 -> 39). That is a
    // deliberate MINORITY, because Plan 5's second amendment measured what the
    // declaration costs: guard 1 multiplies a declared advancer by 4x-9x while
    // `rare` multiplies by only 2x, so a declaration is a large weight change
    // inside its own window, not a label. All seven sit in `journey-out`,
    // `journey-back` or `night` — windows holding five or six events each —
    // and never in `morning` or `evening`, which is where ten declarations
    // once starved `romance-shared-alibi` from 12 firings to 2.
    expect(EVENTS.length).toBe(98);
    expect(EVENTS.filter(e => e.advancesThread).length).toBe(39);
    // Pinned alongside, because Task 2 proved the two are NOT the same thing:
    // citing residue needs no flag, so eleven events cite without declaring.
    expect(EVENTS.filter(e => e.citesResidue).length).toBe(33);
  });

  it('45 non-empty family x window cells: 18 with no advancer, 17 with one, 10 with two or more', () => {
    const c = cells();
    const counts = [...c.values()];
    const zero = counts.filter(v => v.adv === 0).length;
    const one = counts.filter(v => v.adv === 1).length;
    const many = counts.filter(v => v.adv >= 2).length;
    const zeroNames = [...c.entries()].filter(([, v]) => v.adv === 0).map(([k]) => k).sort();
    console.log(`=== ADVANCER COVERAGE === ${c.size} cells: ${zero} zero, ${one} one, ${many} two-plus`);
    console.log(`zero-advancer cells: ${zeroNames.join(', ')}`);

    // MOVED BY PLAN 5 TASK 4: 28 cells -> 44. Populating three empty windows
    // opens sixteen new cells by construction, and most of a NEW cell's first
    // occupant is not an advancer, so the zero count rises with them. THAT IS
    // NOT A REGRESSION AND THE LEDGER IS NOT A QUALITY BAR — Plan 5's second
    // amendment withdrew the "no cell below 2 advancers" target after proving
    // the measurement behind it was measuring a declaration rate rather than
    // the pool's capability (`openThread` folds a firing into an open thread
    // of the same kind and parties whether or not anything is declared; with
    // guard 1 flattened, seasons before and after a re-declaration pass were
    // bit-identical). This table exists to catch silent drift, and that is all.
    expect(c.size, 'the number of non-empty (family x window) cells changed').toBe(45);
    expect(zero, 'cells with NO event that can advance a thread — a thread opened here '
      + 'can never be continued here, whatever either continuation lever is set to').toBe(18);
    expect(one, 'cells with exactly one advancer — the 5-episode pair cooldown means a thread '
      + 'living here can be advanced at most once every five rounds').toBe(17);
    expect(many, 'cells with two or more advancers').toBe(10);
    // Named, not just counted: a change that swapped one zero cell for another
    // would keep every total above and still be a different game.
    // SEVEN, AND THE SHAPE OF THE LIST IS THE FINDING. Six of them are the
    // whole `morning` window, and that is deliberate: Task 2 declared ten
    // advancers across those six cells, measured what it bought (mean thread
    // 1.43 -> 1.48) against what it cost (`romance-shared-alibi` starved from
    // 12 firings per 400 seasons to 2, tripping the dead-event floor above),
    // and withdrew them. Guard 1 multiplies a declared advancer by 4x-9x while
    // `rare` multiplies by 2x, so advancers declared in a window out-compete
    // that window's rare content. `morning` is the pool's most crowded window
    // and cannot carry them. The CITATIONS those events gained were kept —
    // citing residue never needed the flag.
    //
    // The seventh is `callback|dawn`, which holds exactly one event,
    // `callback-recognized`, whose weight() returns 0 when a callback thread
    // between those two already exists — "they clocked each other from a
    // previous season" happens once per pair, and an advance branch would write
    // a beat contradicting its own text.
    //
    // THE NINE NEW ZERO CELLS ARE ALL IN THE THREE WINDOWS TASK 4 OPENED, and
    // each is a cell holding exactly one event which does not attach to a
    // thread its actors already have:
    //   `*|journey-out`  — the road OUT is where stories start. Four of that
    //                      window's six events open a thread rather than
    //                      continue one; the two that continue
    //                      (`trust-fall-into-step`, `cover-road-rehearsal`)
    //                      are why `trust|journey-out` and the cover solo
    //                      thread are not on this list.
    //   `*|night`        — `susp-heard-in-the-corridor` writes a fresh beat
    //                      about a fresh noise and `grief-nobody-sleeps` is a
    //                      solo scene with nobody to continue anything with.
    //   `romance|journey-back` — `romance-walked-back-together` DOES advance a
    //                      thread; it advances a `romance-spark` /
    //                      `romance-showmance` thread, and guard 1 keys on
    //                      `ev.family`, which is `romance`. Declaring the flag
    //                      there would buy a multiplier that never fires. See
    //                      the note on that event.
    //
    // ROUND 2 ADDED THREE MORE, all from relocation rather than new content:
    // `callback|journey-out` and `romance|after-table` are cells that changed
    // hands (`callback-different-show-different-person` left after-table,
    // `romance-liability-exposed` left it for night), and `romance|journey-back`
    // gained a second non-advancer. Two cells gained a second advancer in the
    // move, which is why `many` went 8 -> 10.
    expect(zeroNames).toEqual([
      'callback|dawn', 'callback|journey-out', 'callback|morning',
      'cover|journey-out', 'cover|morning', 'cover|night',
      'grief|journey-out', 'grief|morning', 'grief|night',
      'romance|after-table', 'romance|journey-back', 'romance|journey-out',
      'romance|morning', 'suspicion|journey-out', 'suspicion|morning',
      'suspicion|night', 'testing|journey-out', 'testing|morning',
    ]);
  });

  it('every family that can open a thread has at least one event that can advance one', () => {
    // The weakest true statement about the pool, and the one that would break
    // first if somebody added a family and forgot its advancers entirely.
    const perFamily = {};
    for (const ev of EVENTS) {
      perFamily[ev.family] ||= 0;
      if (ev.advancesThread) perFamily[ev.family]++;
    }
    for (const [fam, n] of Object.entries(perFamily)) {
      expect(n, `family "${fam}" has no event that can advance one of its own threads`)
        .toBeGreaterThan(0);
    }
  });
});


// ══════════════════════════════════════════════════════════════════════
// RESIDUE IS CITED IN REAL SEASONS (Plan 5 Task 2)
// ══════════════════════════════════════════════════════════════════════
//
// tr-threads.test.js proves the citation helpers work and tr-castle.test.js
// proves the pool calls them. Neither would notice if the citation never
// happened in a season that actually plays — the preconditions could all be
// unreachable, which is the dead-content failure this whole file exists for.
// So this runs seasons and reads what the castle actually wrote.
//
// IT CHECKS THE NUMBER, NOT JUST THE SENTENCE. Every day a citation names must
// be a day that thread really had a beat on. A citation that invented a number
// would read exactly as well as one that did not, and nothing else in the
// suite could tell the difference.
//
// THE MUTATION: `residueFor` returning `[]` unconditionally — every citation
// disappears and the floor below goes red.
describe('residue is cited in seasons that actually play', () => {
  const CITE_SEASONS = 60;
  const cited = [];      // { threadId, ep, days, beatEps, len }
  const notes = [];      // every note the castle wrote, for the prose guards below
  let beats = 0;
  for (let i = 1; i <= CITE_SEASONS; i++) {
    setPlayers(ROSTER);
    seedFranchiseHistory(CAST);
    const res = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 40000 + i });
    for (const t of (res.threads || [])) {
      const eps = t.beats.map(b => b.ep);
      for (const b of t.beats) {
        beats++;
        notes.push({ season: i, id: t.id, ep: b.ep, note: String(b.note || '') });
        const days = [...String(b.note || '').matchAll(/day (\d+)/g)].map(m => Number(m[1]));
        if (days.length) cited.push({ threadId: t.id, ep: b.ep, days, beatEps: eps, len: t.beats.length });
      }
    }
  }

  it('citations happen, and every day one names is a real earlier beat of that same thread', () => {
    const lying = cited.filter(c => c.days.some(d => d >= c.ep || !c.beatEps.includes(d)));
    const byLen = {};
    for (const c of cited) byLen[c.len] = (byLen[c.len] || 0) + 1;
    console.log(`=== CITATIONS (${CITE_SEASONS} seasons) === ${cited.length} of ${beats} beats cite an `
      + `earlier moment; by thread length ${JSON.stringify(byLen)}`);

    expect(lying.slice(0, 5), 'a citation named a day that thread never had a beat on, or named '
      + 'the episode it was itself written in').toEqual([]);
    // The floor. Measured well above this; it is here so the mechanism going
    // silent — a residue read that quietly returns nothing — is caught in the
    // only place that runs whole seasons.
    expect(cited.length, 'no beat in 60 seasons cited an earlier moment').toBeGreaterThan(100);
  });

  it('the common case is a SHORT thread citing its one earlier moment', () => {
    // Task 1 left 73.9% of threads dying at their first beat and 3.96% reaching
    // a payoff, so a citation mechanism that only lit up on the spec's
    // six-episode thread would be content nobody sees. This asserts the
    // opposite of the flattering thing: most citations come from threads of
    // three beats or fewer, and that is fine, because the one-moment form is
    // the one the text was written around.
    // TWO-BEAT threads specifically: the shortest thread that can carry a
    // citation at all, and the one the one-moment form was written for.
    // Measured 56 of 192 citations; the floor is a third of that, and under
    // the mutation (`residueFor` -> []) it is zero.
    const twoBeat = cited.filter(c => c.len === 2).length;
    expect(cited.length, 'no citations to characterise').toBeGreaterThan(100);
    expect(twoBeat, 'no citation in 60 seasons came from a two-beat thread — the mechanism '
      + 'only lights up on long stories, and 73.9% of stories die at beat one')
      .toBeGreaterThan(20);
  });

  // ── THE PROSE GUARDS (review round 3) ────────────────────────────────
  //
  // Both of these were found by DUMPING A SEASON'S NOTES AND READING THEM, and
  // neither was catchable by anything in the suite: every assertion in this
  // repo checked that a note EXISTED, that it named a real day, that it moved a
  // bond. None of them read the sentence. Written as rules over every note a
  // played season produces, not as checks on the events that happened to be
  // broken.

  it('no note ships a raw {a}/{b}/{c}/{v} placeholder', () => {
    // `String.prototype.replace` with a STRING pattern substitutes the FIRST
    // match only. Eleven line pools in this repo contain a line using the same
    // token twice, and every one of them was being filled with the
    // single-argument form, so the second occurrence shipped raw: 264 of 6595
    // beats over 200 seasons, e.g. "…what they made of Beth. {b} told them."
    // Task 2's citations then re-quoted those broken sentences verbatim into
    // later beats. The fix is that no castle file uses the string form at all
    // (see the source guard below); this is the OUTPUT half of that rule.
    const leaks = notes.filter(n => /\{[abcdv]\}/.test(n.note));
    expect(leaks.slice(0, 5).map(n => n.note), `${leaks.length} of ${notes.length} notes `
      + 'shipped an unsubstituted placeholder').toEqual([]);
  });

  it('no note holds more than one em-dash pair', () => {
    // FOUND BY DUMPING SEASONS AND READING THEM (Plan 5 Task 4). `citeMoments`
    // splices the quoted moment between two em-dashes, and `cover-feign-fear`
    // writes a note that already contains one:
    //
    //   "...and slept. It went back to day 1 \u2014 Amy performed the exact right
    //    amount of fear at breakfast \u2014 no more, no less than anyone else \u2014 and
    //    it had not stopped since: day 2."
    //
    // Four dashes in one sentence and no way to tell which pair is the aside.
    // Neither existing prose guard could see it: the note holds no placeholder,
    // quotes nothing back at itself, and splices no full stop against a dash.
    // The note is also well-formed ON ITS OWN and only breaks when spliced,
    // which is why this one is legitimately an OUTPUT rule rather than a source
    // rule \u2014 the defect is created by the join, not written by any author.
    //
    // THE MUTATION: in js/tr/threads.js, delete the `quoted.includes` branch in
    // `citeMoments` so the em-dash form is used unconditionally.
    // WIDENED IN ROUND 2 (R3). The first version matched only the exact shape
    // of the fix that had just been written - a dash inside the QUOTED half of
    // the splice - and was green against 15 of 3703 beats that still shipped
    // three dashes, because the offending dash was in the HOST note instead.
    // The defect was described in the report as "four dashes in one sentence,
    // no readable aside", and this is that description: more than one em-dash
    // pair in a note. Write the guard from the defect, not from the fix.
    const nested = notes.filter(n => n.note.split('\u2014').length > 3);
    expect(nested.slice(0, 5).map(n => n.note), `${nested.length} of ${notes.length} notes `
      + 'hold more than one em-dash pair - whichever half of the splice the second one '
      + 'came from, a reader cannot tell which pair is the aside').toEqual([]);
    // Guard on the guard: em-dashes have to occur at all, or this passes
    // against any mutant.
    const dashed = notes.filter(n => n.note.includes('\u2014'));
    expect(dashed.length, 'no note used an em-dash at all - this check matched nothing '
      + 'and asserted nothing').toBeGreaterThan(10);
  });

  it('no note quotes its own head sentence back at itself', () => {
    // R2: several events write a CONSTANT note, so a citation on the second
    // firing quoted the sentence it was being appended to — "X. It went back to
    // day 1: X." Measured at 22 of 758 citations before the fix.
    const head = str => String(str).split(/(?<=[.!?])[ ]/)[0].trim().replace(/[.!?]+$/, '');
    const echoes = notes.filter(n => {
      const h = head(n.note);
      return h.length > 20 && n.note.split(h).length - 1 > 1;
    });
    expect(echoes.slice(0, 5).map(n => n.note), `${echoes.length} of ${notes.length} notes `
      + 'contain their own first sentence twice').toEqual([]);
  });

  it('no sentence is quoted into more than three notes of one season', () => {
    // R4, FOUND IN A DUMP. `citeMoments` used to lead with the thread's OPENING
    // beat, always, so a thread that ran eight beats quoted the same sentence
    // into all eight of them. The dump had four consecutive beats of one cover
    // thread repeating `cover-road-rehearsal`'s opener, twice sitting directly
    // underneath "X told the same story again, word for word. Nobody clocked
    // the repetition." - the engine narrating its own bug. Nothing in the suite
    // could see it: every note was well-formed, named a real day, and quoted a
    // sentence that genuinely happened. Repetition is not malformation, and
    // only counting catches it.
    //
    // THREE, not one: a sentence recurring twice across a whole season is a
    // callback, and the fix (lead with the oldest moment nobody has quoted yet)
    // deliberately still allows a repeat once every prior moment is used up.
    //
    // THE MUTATION: in js/tr/threads.js, `const lead = prior[0];` in place of
    // the `prior.find(...)` that skips already-quoted moments.
    const perSeason = new Map();
    const RE = /It went back to day \d+[:—] (.*?)(?: — and it had not stopped| It had not stopped|$)/g;
    for (const n of notes) {
      for (const m of n.note.matchAll(RE)) {
        const head = m[1].trim().replace(/\.$/, '');
        if (head.length < 25) continue;
        const key = `${n.season}\u0000${head}`;
        perSeason.set(key, (perSeason.get(key) || 0) + 1);
      }
    }
    const worst = [...perSeason.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    console.log('=== MOST-QUOTED SENTENCE IN ONE SEASON ===');
    for (const [k, c] of worst) console.log(`   ${c}x  ${k.split('\u0000')[1].slice(0, 70)}`);
    const repeated = worst.filter(([, c]) => c > 3)
      .map(([k, c]) => `${c}x  ${k.split('\u0000')[1].slice(0, 70)}`);
    expect(repeated, 'one sentence was quoted into more than three beats of a single '
      + 'season - a thread is re-quoting the same moment every time it advances').toEqual([]);
    // Guard on the guard: quotations have to be happening, or nothing is counted.
    expect(perSeason.size, 'no note quoted an earlier moment at all in these seasons')
      .toBeGreaterThan(50);
  });

  it('no note starts a sentence in lower case', () => {
    // FOUND BY READING OUTPUT (round 2). Three events fill an absent partner
    // with the stand-in "somebody" - substitution, not deletion, because the
    // source rule below requires it - and when the token opened a sentence the
    // stand-in opened it in lower case: "...how hard it hit them. somebody sat
    // with them and let it be quiet for a while." This one IS unambiguous in
    // the finished string, which is what makes an output rule the right shape
    // for it: every authored line in js/tr/castle/ begins with a capital.
    //
    // THE MUTATION: drop the `_sentenceCase(...)` wrapper from
    // `grief-morning-reaction` in js/tr/castle/grief.js - 14 of 2789 notes.
    // NOT from `_fillPartner` in cover.js, which was the first mutation tried
    // and left this GREEN: cover's own line pools never put `{b}` at the start
    // of a sentence, so that call site cannot produce the defect today. A
    // mutation that does not redden is a fact about the test, and this one is
    // that the wrapper on `_fillPartner` is insurance against a future line
    // rather than a fix for a live defect.
    const lower = notes.filter(n => /[.!?] +[a-z]/.test(n.note));
    expect(lower.slice(0, 5).map(n => n.note), `${lower.length} of ${notes.length} notes `
      + 'open a sentence in lower case').toEqual([]);
  });

  it('no note splices a full stop against the em-dash that follows it', () => {
    // R3: the quoted moment sits INSIDE a parenthetical, so its own stop has to
    // come off. This affected every three-plus-moment citation.
    const bad = notes.filter(n => n.note.includes('. —') && n.note.includes('it had not stopped since'));
    expect(bad.slice(0, 5).map(n => n.note)).toEqual([]);
  });
});

// ── THE SOURCE HALF OF THE PLACEHOLDER RULE ──────────────────────────────
//
// The output guard above needs a season to run and only sees the lines that
// happened to be drawn. This one is exhaustive and instant: NO castle file may
// substitute a token with a string pattern, because a string pattern is
// first-match-only and whether that matters depends on a line pool somebody
// else edits later. `/\{a\}/g` costs nothing and cannot go wrong.
describe('token substitution is global, in every castle file', () => {
  it('no castle file uses the first-match-only string form of .replace', () => {
    // Relative to the vitest root, which is the repo root — import.meta.url
    // is not a file: URL under this environment.
    const dir = 'js/tr/castle/';
    const offenders = [];
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.js')) continue;
      const src = readFileSync(dir + f, 'utf8');
      for (const m of src.matchAll(/\.replace\('(\{[a-z]\})'/g)) {
        offenders.push(`${f}: .replace('${m[1]}', …)`);
      }
    }
    expect(offenders, 'a string pattern replaces the FIRST match only — use /\\{x\\}/g')
      .toEqual([]);
  });

  it('an absent actor is SUBSTITUTED, never cut out of the sentence', () => {
    // FOUND BY READING OUTPUT, and the reason this is a source rule and not an
    // output one: the damage it does is grammatical, and no regex over finished
    // prose can tell "…told it made." from a sentence that meant to end there.
    //
    // Two events fill an optional partner. Both used to handle "no partner" by
    // DELETING from the token to the end of its sentence, which is only correct
    // when the token starts one. "Something about the way {a} told it made {b}
    // quietly file it away." became "…told it made." — a sentence ending on its
    // own verb, and Task 2's citations then quoted that into later beats.
    // Substituting an unnamed onlooker is true (the room is still there) and
    // cannot produce a fragment, whatever a future line pool says.
    const dir = 'js/tr/castle/';
    const cutters = [];
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.js')) continue;
      for (const m of readFileSync(dir + f, 'utf8').matchAll(/\.replace\(\/[^/\n]*\\\{[a-z]\\\}[^/\n]+\/g?[a-z]*,/g)) {
        cutters.push(`${f}: ${m[0]}`);
      }
    }
    expect(cutters, 'a token must be filled with a name or a stand-in — deleting the clause '
      + 'around it leaves a fragment whenever the token is not sentence-initial').toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE OUTCOME-BRANCH FLOOR (Plan 5 Task 3, round 2 - review finding R1)
// ══════════════════════════════════════════════════════════════════════
//
// THE HOLE THIS CLOSES, STATED AS THE FAILURE IT ALLOWS. Task 3 gave four
// events a branch that fires only when one of their subjects has a CLOSED
// thread behind them. Nothing in the suite could see that branch:
//
//   - the dead-event sweep above is EVENT-keyed, and all four events fire
//     632 times per 200 seasons whether or not a single thread ever closes;
//   - the audit file's (id, branch) tables key on `consequences.branch`,
//     which these clauses never touch - they set `priorOutcome`;
//   - every unit test in tr-castle.test.js builds the closed thread by hand,
//     so all of them stay green in a world where closures never happen.
//
// So if Tasks 4 or 5 move the payoff rate toward zero - and the Task 2
// corollary says declaring advancers does exactly that, at roughly one payoff
// per 4.5 extra beats - all four branches go dead and 247 tests stay green.
// That is precisely the failure the dead-event sweep exists to prevent, and
// these branches were sitting outside it.
//
// WHERE THE NUMBERS COME FROM. Threads close 0.84 times a season (3.5% of the
// 24 that open), which is what makes this rare and is measured, not assumed.
// Over the 400 seasons this file already plays, the four readers take their
// clause 18 / 16 / 12 / 12 times. The per-reader floor is 4 - the same floor
// the pool's rarest EVENT is held to, a few lines above, and for the same
// reason: something sliding from 12 takes to 2 is on its way to dead and this
// run should say so before it gets there. The total floor is 20 against a
// measured 58.
//
// THE MUTATION: make `closeThread` leave the thread open (delete
// `t.state = 'closed';`). No thread ever closes, every clause goes to zero,
// and this block goes red while every other test in the repo stays green -
// which is the whole point of it.
describe('THE OUTCOME-BRANCH FLOOR: a clause nobody can reach is dead content', () => {
  it('every event that reads a closed outcome actually takes its branch in real seasons', () => {
    const fired = {}, took = {};
    for (const f of ALL_FIRINGS) {
      if (!f.readsOutcome) continue;
      fired[f.id] = (fired[f.id] || 0) + 1;
      if (f.priorOutcome) took[f.id] = (took[f.id] || 0) + 1;
    }
    const readers = Object.keys(fired).sort();
    const total = Object.values(took).reduce((a, b) => a + b, 0);
    console.log(`
=== OUTCOME-BRANCH TAKES (${SWEEP_SEASONS} seasons) ===`);
    for (const id of readers) console.log(`   ${took[id] || 0}	of ${fired[id]}	${id}`);
    console.log(`   ${total}	total`);

    // The readers still exist at all. Without this the two floors below pass
    // vacuously the moment somebody deletes every reader.
    expect(readers.length, `only these events read a closed outcome: ${readers.join(', ')}`)
      .toBeGreaterThanOrEqual(4);
    // Each one is individually reachable...
    const starved = readers.filter(id => (took[id] || 0) < PER400(4))
      .map(id => `${id}: ${took[id] || 0} of ${fired[id]} firings`);
    expect(starved, 'these outcome branches are on their way to dead content').toEqual([]);
    // ...and the mechanism as a whole has not gone quiet.
    expect(total, `no castle event reached a closed thread in ${SWEEP_SEASONS} seasons`)
      .toBeGreaterThanOrEqual(PER400(20));
  });

  it('and threads really do close in these seasons - the floor above is not measuring nothing', () => {
    // Guard on the guard. If closures were impossible the block above could
    // only ever be red, and a future reader deserves to know which of the two
    // broke: the branch, or the thing it depends on.
    let opened = 0, closed = 0;
    for (let i = 1; i <= 60; i++) {
      setPlayers(ROSTER);
      seedFranchiseHistory(CAST);
      const res = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: i });
      opened += res.threads.length;
      closed += res.threads.filter(t => t.state === 'closed' && t.outcome).length;
    }
    console.log(`=== CLOSURES === ${closed} of ${opened} threads closed over 60 seasons `
      + `(${(closed / opened * 100).toFixed(2)}%, ${(closed / 60).toFixed(2)} a season)`);
    expect(closed, 'no thread closed at all - the outcome branch has nothing to read')
      .toBeGreaterThanOrEqual(20);
  });
});


// ══════════════════════════════════════════════════════════════════════
// THE WINDOW SWEEP (Plan 5 Task 4)
// ══════════════════════════════════════════════════════════════════════
//
// A WINDOW WITH NO CONTENT IS DEAD CODE THAT NOTHING IN THIS SUITE COULD SEE.
// Spec 5.6 gives a round SEVEN windows and js/tr/events.js validates every
// registration against exactly those seven. Before this task, two of them
// (`journey-out`, `journey-back`) held zero events and a third (`night`) held
// one, drawing 36 firings out of 13,553 across the 400 seasons below. Every
// round of every season ran `runWindow` on all seven, found nothing eligible
// in three of them, and returned — and 249 tests were green, because every
// other guard in this file is EVENT-keyed: an event that does not exist has no
// id to be missing from a count.
//
// So this is written as a rule over `KNOWN_WINDOWS` itself rather than as a
// list of window names, for the reason this project keeps re-learning: a list
// of known cases would not have covered the eighth window either.
//
// THE FLOOR IS 200 IN 400 SEASONS — one firing every other season — and it is
// deliberately far under the measured minimum (`journey-back`, 1126) rather
// than tuned to it. What it is asserting is "this window is part of the show",
// not "this window drew its current share": a share floor would be an absolute
// constant against a number any future content change moves, which is the
// treadmill this plan has already been round twice.
//
// THE MUTATION: delete `...runWindow('journey-back', ep, castleRng),` from the
// round loop in js/tr/headless.js. That window drops to 0 and this goes red.
describe('THE WINDOW SWEEP: every window spec 5.6 names is a window the show uses', () => {
  it('all seven windows hold registered events, and all seven fire in real seasons', () => {
    const perWindow = {};
    for (const f of ALL_FIRINGS) perWindow[f.window] = (perWindow[f.window] || 0) + 1;
    const registered = {};
    for (const ev of EVENTS) registered[ev.window] = (registered[ev.window] || 0) + 1;

    console.log(`\n=== PER-WINDOW (${SWEEP_SEASONS} seasons) ===`);
    for (const w of KNOWN_WINDOWS) {
      console.log(`   ${perWindow[w] || 0}\tfirings\t${registered[w] || 0}\tevents\t${w}`);
    }

    const empty = [...KNOWN_WINDOWS].filter(w => !registered[w]);
    expect(empty, 'these windows hold no registered event at all — the runner calls '
      + 'runWindow on them every round and they can only ever return []').toEqual([]);

    const silent = [...KNOWN_WINDOWS]
      .filter(w => (perWindow[w] || 0) < PER400(200))
      .map(w => `${w}: ${perWindow[w] || 0} firings from ${registered[w] || 0} events`);
    expect(silent, `these windows hold content that a season almost never reaches, in `
      + `${SWEEP_SEASONS} seasons`).toEqual([]);

    // Guard on the guard: if KNOWN_WINDOWS ever came back empty both checks
    // above would pass having asserted nothing.
    expect(KNOWN_WINDOWS.size).toBe(7);
  });
});


// ══════════════════════════════════════════════════════════════════════
// THE CLOSER FLOOR (Plan 5 Task 4)
// ══════════════════════════════════════════════════════════════════════
//
// A STORY THAT KEEPS ADVANCING IS A STORY THAT HAS NOT PAID OFF, and a payoff
// is what makes a thread legible to a viewer. Plan 5's second amendment
// measured the pool's real deficit here: threads closed 3.58% of the time,
// 0.86 a season out of 24 opened, and declaring more advancers made it WORSE
// (one payoff traded per 4.5 extra beats). Task 4's whole content brief was to
// add CLOSERS rather than advancers.
//
// This is the guard that keeps them alive. It is the same shape as THE
// OUTCOME-BRANCH FLOOR above and for the same reason: a closing branch is a
// clause inside an event that fires constantly, so the dead-event sweep cannot
// see it. `cover-story-survived-the-day` fires whether or not its `held`
// branch is ever taken, and if the branch scores were retuned so that one
// never happened, every other test in this repo would stay green.
//
// RULE-SHAPED, NOT A LIST. Membership is "the event reported an `outcome` key
// at all", read off the firing, so any future event that closes a thread and
// says so is covered automatically. The absent/null distinction is what makes
// that work: absent means no closing branch exists, null means one exists and
// this firing did not take it.
//
// IT IS KEYED PER (EVENT, OUTCOME), NOT PER EVENT, and that distinction is
// the whole guard rather than a detail. The first version of this counted
// closures per event id, and it stayed GREEN under its own stated mutation:
// `cover-story-survived-the-day` writes `passed-clean` on one branch and
// `exposed` on another, so zeroing the first branch's score simply moved every
// closure onto the second and the event's total did not change. A guard that
// survives the mutation it names is the eighteenth unfailable test found in
// this project, and it was found by RUNNING the mutation rather than by
// reasoning about it.
//
// THE FLOOR IS 4 PER (EVENT, OUTCOME), the same number the pool's rarest EVENT
// is held to a few hundred lines above, and for the same reason: something
// sliding from 40 takes to 2 is on its way to dead and this run should say so
// before it gets there.
//
// THE MUTATION: in js/tr/castle/journey.js, zero the closing branch of one
// closer — `const holdScore = 0;` in `cover-story-survived-the-day` — and that
// event's `passed-clean` closures go to zero while its firings, and its
// `exposed` closures, do not.
const CLOSING_BRANCHES = [
  'cover-story-survived-the-day:exposed',
  'cover-story-survived-the-day:passed-clean',
  'grief-castle-in-view:buried',
  'romance-showmance-on-the-way-back:became-showmance',
  'susp-let-it-go-on-the-road-back:confessed-unrelated',
  'susp-let-it-go-on-the-road-back:denied-convincingly',
  'testing-night-scores-it:failed-maliciously',
  'testing-night-scores-it:passed-clean',
  'trust-last-word-before-lights-out:passed-clean',
  'trust-last-word-before-lights-out:turned-back',
  'trust-settled-on-the-way-back:buried',
  'trust-settled-on-the-way-back:passed-clean',
  'trust-settled-on-the-way-back:turned-back',
];

describe('THE CLOSER FLOOR: an event that can end a story must actually end one', () => {
  it('every closing branch in the pool is taken in real seasons', () => {
    const fired = {}, closedBy = {}, perOutcome = {}, senses = {};
    for (const f of ALL_FIRINGS) {
      if (!f.writesOutcome) continue;
      fired[f.id] = (fired[f.id] || 0) + 1;
      if (f.outcome) {
        closedBy[f.id] = (closedBy[f.id] || 0) + 1;
        perOutcome[`${f.id}:${f.outcome}`] = (perOutcome[`${f.id}:${f.outcome}`] || 0) + 1;
        senses[f.outcome] = (senses[f.outcome] || 0) + 1;
      }
    }
    const closers = Object.keys(fired).sort();
    const total = Object.values(closedBy).reduce((a, b) => a + b, 0);
    console.log(`\n=== CLOSING BRANCHES TAKEN (${SWEEP_SEASONS} seasons) ===`);
    for (const k of Object.keys(perOutcome).sort()) console.log(`   ${perOutcome[k]}\t${k}`);
    for (const id of closers) console.log(`   ${closedBy[id] || 0}\tof ${fired[id]}\tTOTAL ${id}`);
    console.log(`   outcomes written: ${JSON.stringify(senses)}`);

    expect(closers.length, `only these events report a closing branch: ${closers.join(', ')}`)
      .toBeGreaterThanOrEqual(6);
    // THE SET OF (event, outcome) PAIRS IS PINNED, because a branch that stops
    // firing entirely vanishes from `perOutcome` and a floor over the keys
    // that ARE there could never see it. This is the same shape as the cell
    // ledger: a list that must be maintained deliberately, not a bar.
    expect(Object.keys(perOutcome).sort(), 'a closing branch appeared or disappeared')
      .toEqual(CLOSING_BRANCHES);
    const starved = Object.entries(perOutcome).filter(([, n]) => n < PER400(4))
      .map(([k, n]) => `${k}: ${n} closures`);
    expect(starved, 'these closing branches are on their way to dead content').toEqual([]);
    expect(total, `no event closed a thread in ${SWEEP_SEASONS} seasons`)
      .toBeGreaterThanOrEqual(PER400(100));

    // EVERY OUTCOME THESE EVENTS WRITE IS ONE js/tr/threads.js CAN READ. The
    // source rule in tr-threads.test.js checks the literal strings in the
    // castle files; this checks the ones that actually reach a season, which
    // is the half a source scan cannot do for a value built at runtime.
    const unreadable = Object.keys(senses).filter(o => outcomeSense(o) == null);
    expect(unreadable, 'these outcomes were written by a season and no event can branch '
      + 'on them — add them to OUTCOME_SENSE in js/tr/threads.js').toEqual([]);
  });
});


// ══════════════════════════════════════════════════════════════════════
// THE BRANCH FLOOR (Plan 5 Task 4, round 2 — R1)
// ══════════════════════════════════════════════════════════════════════
//
// A FLOOR KEYED PER EVENT CANNOT SEE A BRANCH DIE. This is one mistake this
// file made in three separate places, and the whole point of writing it down
// once at this size is that it is a SHAPE, not three bugs:
//
//   - THE CLOSER FLOOR (below) shipped keyed per event, and stayed green under
//     its own stated mutation: zeroing one closing branch simply moved every
//     closure onto the same event's other outcome. Fixed there by keying on
//     (event, outcome).
//   - THE OUTCOME-BRANCH FLOOR (below) already knew this and keys on the take,
//     not the firing — which is why it was the one that worked.
//   - THE DEAD-EVENT SWEEP (above) is still event-keyed, and covers nothing
//     underneath an event that fires. Proof, from review: `const quietScore =
//     0;` in `trust-fall-into-step` kills a branch worth 172 firings per 400
//     seasons and three of its nine text variants, and every one of 252 tests
//     stays green.
//
// So this is the general form of all three: EVERY (event, branch) pair the
// pool can produce must be produced, at least 4 times in 400 seasons — the
// same floor the rarest whole EVENT is held to a few hundred lines above, for
// the same reason. A branch is content exactly as much as an event is, and it
// is content nothing else in this repo counts.
//
// THE SET IS PINNED, NOT JUST FLOORED, and that is not belt-and-braces: a
// branch that stops firing entirely vanishes from the tally, so a floor over
// the keys that ARE present could never see it go. The pin is the part that
// catches deletion; the floor is the part that catches decay. Same reasoning
// as the cell ledger.
//
// `(none)` is a legitimate key: plenty of events return consequences with no
// `branch` field because they have exactly one thing they do.
//
// THE MUTATION: `const quietScore = 0;` in `trust-fall-into-step`
// (js/tr/castle/journey.js) — the one review used to prove the dead-event
// sweep could not see it.
const BRANCHES = [
  'callback-competitive-history:rivalry-carried-over',
  'callback-different-show-different-person:disappointment',
  'callback-different-show-different-person:dissonance',
  'callback-different-show-different-person:redemption',
  'callback-grudge-resurfaces:grudge-resurfaced',
  'callback-history-confrontation:buries',
  'callback-history-confrontation:grudge',
  'callback-history-confrontation:reconciles',
  'callback-history-confrontation:strategic',
  'callback-no-history-envy:left-out',
  'callback-old-alliance-reforms:alliance-reformed',
  'callback-protects-old-ally-from-vote:defended-by-history',
  'callback-recognized:recognized',
  'callback-shared-alumni-status:alumni-bond',
  'callback-showmance-reunion-spark:reunion-spark',
  'callback-warns-newbies:warned',
  'cover-alibi-crumbles:collapses',
  'cover-alibi-crumbles:holds',
  'cover-alibi-crumbles:wobbles',
  'cover-alone-with-it:nearly',
  'cover-alone-with-it:sleepless',
  'cover-alone-with-it:steady',
  'cover-blend-with-victims-friends:blended-in',
  'cover-cold-sweat-tell:tell',
  'cover-decline-recruit-offer-story:recruit-story-covered',
  'cover-double-bluff:double-bluffed',
  'cover-feign-fear:feigned-fear',
  'cover-plant-a-name:planted',
  'cover-preemptive-alibi:alibi-built',
  'cover-rehearsed-story-advance:rehearsed',
  'cover-road-rehearsal:airtight',
  'cover-road-rehearsal:overcooked',
  'cover-road-rehearsal:serviceable',
  'cover-story-check:awkward',
  'cover-story-check:convincing',
  'cover-story-check:slip',
  'cover-story-check:suspicious',
  'cover-story-survived-the-day:broke',
  'cover-story-survived-the-day:frayed',
  'cover-story-survived-the-day:held',
  'cover-suspect-own-ally:sacrificed-ally',
  'cover-swap-story-with-partner:synchronized',
  'grief-blame-the-room:blamed-room',
  'grief-castle-in-view:buried',
  'grief-castle-in-view:carried',
  'grief-empty-chair:empty-chair',
  'grief-headcount:headcount',
  'grief-keepsake:keepsake',
  'grief-morning-reaction:mourn',
  'grief-morning-reaction:opportunistic',
  'grief-morning-reaction:stoic',
  'grief-morning-reaction:suspicious',
  'grief-nobody-sleeps:awake-content',
  'grief-nobody-sleeps:awake-desperate',
  'grief-nobody-sleeps:awake-paranoid',
  'grief-numb-to-it-now:numb',
  'grief-seating-shift:reseated',
  'grief-shared-mourning-bond:shared-mourning',
  'grief-shorter-column:pair-again',
  'grief-shorter-column:pair-first',
  'grief-shorter-column:solo-again',
  'grief-shorter-column:solo-first',
  'grief-someone-cries-alone:cried-alone',
  'grief-suspicion-of-timing:timing',
  'grief-toast-to-them:toasted',
  'grief-wrongly-suspected-irony:wrongly-suspected-irony',
  'romance-comfort-after-loss-sparks:grief-spark',
  'romance-jealousy-third-party:jealousy',
  'romance-liability-exposed:confronts',
  'romance-liability-exposed:exposes',
  'romance-liability-exposed:oblivious',
  'romance-liability-exposed:suspicious',
  'romance-protection-instinct:protected',
  'romance-road-spark:road-spark',
  'romance-shared-alibi:shared-alibi',
  'romance-shields-target-together:shield-pact',
  'romance-showmance-breakup:broke-up',
  'romance-showmance-fight:showmance-fight',
  'romance-showmance-forms:showmance-formed',
  'romance-showmance-on-the-way-back:showmance-on-the-road',
  'romance-spark:sparked',
  'romance-strategic-optics:called-strategic',
  'romance-walked-back-together:walked-back-together',
  'susp-alliance-shape-guess:shape-guessed',
  'susp-body-language-read:body-read',
  'susp-cold-case-revival:revived',
  'susp-defensive-overcorrect:overcorrected',
  'susp-group-pressure-crack:cracks',
  'susp-group-pressure-crack:holds',
  'susp-group-pressure-crack:redirects',
  'susp-heard-in-the-corridor:caught',
  'susp-heard-in-the-corridor:heard',
  'susp-heard-in-the-corridor:imagined',
  'susp-let-it-go-on-the-road-back:cleared',
  'susp-let-it-go-on-the-road-back:hardened',
  'susp-let-it-go-on-the-road-back:slipped',
  'susp-misread-tell:misread',
  'susp-noticed-inconsistency:noticed',
  'susp-out-of-earshot:agreed',
  'susp-out-of-earshot:defended',
  'susp-out-of-earshot:hedged',
  'susp-overheard-conversation:overheard',
  'susp-pattern-tracking:tracked',
  'susp-private-accusation:confess',
  'susp-private-accusation:denies',
  'susp-private-accusation:denyWeak',
  'susp-private-accusation:turned',
  'susp-timeline-crosscheck:crosschecked',
  'susp-whisper-about-absent:whispered',
  'testing-ask-for-alibi-check:checks-out',
  'testing-ask-for-alibi-check:inconsistent',
  'testing-cold-read-check:cold-read',
  'testing-decoy-secret:caughtTest',
  'testing-decoy-secret:innocent',
  'testing-decoy-secret:keptQuiet',
  'testing-decoy-secret:malicious',
  'testing-double-check-story:consistent',
  'testing-double-check-story:inconsistent',
  'testing-follow-through-check:followed-through',
  'testing-hypothetical-loyalty-question:hedged',
  'testing-hypothetical-loyalty-question:reassured',
  'testing-loyalty-oath:refuses',
  'testing-loyalty-oath:reluctant',
  'testing-loyalty-oath:sincere',
  'testing-night-scores-it:confirmed',
  'testing-night-scores-it:failed',
  'testing-night-scores-it:inconclusive',
  'testing-reverse-psychology:got-rattled',
  'testing-reverse-psychology:stayed-calm',
  'testing-silence-test:chased',
  'testing-silence-test:let-it-go',
  'testing-small-dare:complied',
  'testing-small-dare:refused',
  'testing-who-you-walk-with:flattered',
  'testing-who-you-walk-with:transactional',
  'testing-who-you-walk-with:wary',
  'trust-circle-forms:circle',
  'trust-confide-fear:confided',
  'trust-defend-in-absentia:defended',
  'trust-fall-into-step:confided',
  'trust-fall-into-step:probed',
  'trust-fall-into-step:quiet',
  'trust-inner-circle-invite:invited-in',
  'trust-last-word-before-lights-out:broken',
  'trust-last-word-before-lights-out:hedged',
  'trust-last-word-before-lights-out:sworn',
  'trust-late-checkin:checked-in',
  'trust-post-murder-huddle:huddled',
  'trust-protect-pact:pact',
  'trust-return-favor:favor-returned',
  'trust-secret-swap:kept',
  'trust-secret-swap:leakedAccident',
  'trust-secret-swap:leakedDeliberate',
  'trust-settled-on-the-way-back:dropped',
  'trust-settled-on-the-way-back:held',
  'trust-settled-on-the-way-back:soured',
  'trust-settled-on-the-way-back:unresolved',
  'trust-share-suspicion-honestly:shared-suspicion',
  'trust-trade-reads:traded-reads',
  'trust-vote-commitment-test:broken',
  'trust-vote-commitment-test:deflected',
  'trust-vote-commitment-test:kept',
  'trust-vote-commitment-test:turned',
  'trust-vow-of-silence:vowed-silence',
];

describe('THE BRANCH FLOOR: a fork nobody takes is dead content inside a live event', () => {
  it('every (event, branch) pair the pool can produce is produced in real seasons', () => {
    const perBranch = {};
    for (const f of ALL_FIRINGS) {
      const k = `${f.id}:${f.branch}`;
      perBranch[k] = (perBranch[k] || 0) + 1;
    }
    const keys = Object.keys(perBranch).sort();
    const bottom = keys.map(k => ({ k, n: perBranch[k] })).sort((a, b) => a.n - b.n).slice(0, 12);
    console.log(`\n=== RAREST TWELVE BRANCHES (${SWEEP_SEASONS} seasons, ${keys.length} branches) ===`);
    for (const b of bottom) console.log(`   ${b.n}\t${b.k}`);

    expect(keys, 'a branch appeared or disappeared from the pool').toEqual(BRANCHES);
    // == RE-DERIVED BY PLAN 5 TASK 6: 4 per 400 seasons -> 3 per 400 ==========
    //
    // Not a loosening. The old floor of 4 was measured at 400 seasons against a
    // rarest branch of 4 — zero margin, on a count whose own resampling noise
    // is larger than the whole margin. Raising the sweep to 1600 turns that
    // count into a measurement: the rarest branch reads 20.0 (sd 1.83 over four
    // disjoint 1600-season blocks) and PER400(3) = 12 sits 4.4 sd under it.
    // In per-400 terms the floor moved 4 -> 3 while the margin went from 0.0 sd
    // to 4.4 sd, because the thing that changed is how well the number is
    // known, not how much is being demanded of the content.
    //
    // WHAT IT STILL CATCHES: a branch falling below one firing per 133 seasons,
    // and a branch dying outright. What it deliberately does NOT do is police
    // ordinary resampling — a branch moving 20 -> 15 on an unrelated content
    // change is noise, and the old floor would have called it a regression.
    const starved = bottom.filter(b => b.n < PER400(3)).map(b => `${b.k}: ${b.n}`);
    expect(starved, `these branches are on their way to dead content — an event-keyed `
      + `floor cannot see this, which is why this one is keyed per branch`).toEqual([]);
  });
});



// ══════════════════════════════════════════════════════════════════════
// THE PRIOR-OUTCOME ORDER RULE (Plan 5 Task 6)
// ══════════════════════════════════════════════════════════════════════
//
// `lastClosedThread(name, { beforeEp })` and `residueFor(name, { beforeEp })`
// are the two filters that stop a season recapping something that has not
// happened yet. Both were verified correct by direct measurement in Task 2
// (0 violations in 758 citations) and neither was properly GUARDED, which is
// not the same thing: a filter nothing checks is a filter the next edit can
// delete.
//
// RE-MEASURED IN TASK 6, because the plan's open item said the citation half
// was caught only by one accidental guard and that is no longer true.
// Mutating `residueFor`'s comparison from `<` to `<=` now reddens FOUR tests
// in three files, two of them season-level rules — tr-threads.test.js's unit
// on `beforeEp`, tr-castle.test.js's fresh-pair rule, and this file's own
// "every day one names is a real earlier beat", whose `d >= c.ep` clause is a
// deliberate rule and not an accident. That half is closed.
//
// THE HALF THAT WAS STILL OPEN is `lastClosedThread`. Mutating ITS comparison
// the same way — `!(t.lastEp < beforeEp)` -> `!(t.lastEp <= beforeEp)` —
// reddened exactly one assertion in the whole repo, a hand-built unit in
// tr-threads.test.js. Nothing looked at whether a season that actually plays
// ever branches on a payoff that had not landed yet. This is that rule.
//
// RULE-SHAPED, over every firing that reports a `priorOutcome` at all: some
// thread carrying that outcome must have closed STRICTLY BEFORE the episode
// doing the reading. A list of the four events that currently read outcomes
// would need editing on every content change and would cover nothing new.
//
// WHY IT DOES NOT ALSO REQUIRE THE CLOSURE TO INVOLVE SOMEBODY IN THE ROOM,
// which was the first draft and was WRONG. `lastClosedThread` is called on the
// SUBJECT of the scene, who is frequently not in it: `susp-whisper-about-absent`
// is by construction about the person who is absent. Requiring party overlap
// with `ce.actors` reported 239 false violations of 532 reads at head — a
// guard that is red on correct code, which is worse than no guard. A firing
// records the outcome LABEL it read, not the thread, so "a thread with this
// outcome had already closed" is the strongest reconstruction available from
// what survives, and it is enough: it is exactly the ordering the `beforeEp`
// filter enforces, and the mutation drives it to 83 violations.
//
// THE MUTATION: in js/tr/threads.js, `!(t.lastEp < beforeEp)` ->
// `!(t.lastEp <= beforeEp)`. Verified RED here and GREEN before.
describe('THE PRIOR-OUTCOME ORDER RULE: nothing is recapped before it happens', () => {
  it('every closed outcome an event branches on had closed before the episode that read it', () => {
    const violations = [];
    let checked = 0;
    for (let i = 0; i < SEASONS.length; i++) {
      const closed = (SEASON_THREADS[i] || []).filter(t => t.state === 'closed' && t.outcome);
      for (const f of SEASONS[i]) {
        if (!f.priorOutcome) continue;
        checked++;
        const shared = closed.filter(t => t.outcome === f.priorOutcome);
        if (shared.some(t => t.lastEp < f.ep)) continue;
        const when = shared.map(t => t.lastEp).sort((a, b) => a - b);
        violations.push(`season ${i + 1} ep ${f.ep} ${f.id} read "${f.priorOutcome}" `
          + `but the only closures it could have read are at ep ${JSON.stringify(when)}`);
      }
    }
    console.log(`
=== PRIOR-OUTCOME ORDER (${SWEEP_SEASONS} seasons) === `
      + `${checked} firings branched on a closed outcome, ${violations.length} of them on a `
      + `closure that had not happened yet`);

    // NON-VACUITY FIRST, and it is the half that makes this failable at all:
    // if no event ever branched on an outcome the rule below would be
    // trivially true. PER400(20) is the same floor THE OUTCOME-BRANCH FLOOR
    // uses for the same quantity, so the two cannot disagree about whether
    // the mechanism is alive.
    expect(checked, 'no firing branched on a closed outcome - this rule would be vacuous')
      .toBeGreaterThanOrEqual(PER400(20));
    expect(violations.slice(0, 5), `${violations.length} firings branched on a thread that `
      + 'closed in or after the episode that read it - a season recapping something that has '
      + 'not happened').toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE ONCE-PER-SEASON RULE (Plan 5 Task 5)
// ══════════════════════════════════════════════════════════════════════
//
// Spec 5.4.2 gives signature moments a `oncePerSeason` flag "so signature
// moments cannot cheapen themselves". The engine has honoured it since Plan 4
// and tests/tr-events.test.js has a unit for it built on a synthetic event.
// No castle event declared it, so in the game it did nothing at all - an
// engine test cannot tell a working guard from a guard nothing uses, because
// it brings its own content.
//
// RULE-SHAPED: every event that DECLARES the flag, whichever ones those are,
// checked over the seasons this file already plays. A list of known ids would
// need editing on every content change and would cover nothing new.
//
// NON-VACUITY IS THE OTHER HALF, and it is the half that makes this test
// failable at all: at base, "every oncePerSeason event fires at most once" was
// trivially TRUE, because the set was empty. So the same test asserts the flag
// is declared, and that the declaring events reach a season often enough that
// the first assertion is measuring something.
//
// THE MUTATION: in js/tr/events.js, delete `if (ev.oncePerSeason) return true;`
// from `_onCooldown`. `grief-numb-to-it-now` then fires twice in 8 of these 400
// seasons and this goes red - while tests/tr-events.test.js's own unit for the
// flag goes red too, which is the point: one is the engine, this is the game.
describe('THE ONCE-PER-SEASON RULE: a signature moment happens once', () => {
  it('no event declaring oncePerSeason fires twice in one season, and some do fire', () => {
    const declared = EVENTS.filter(e => e.oncePerSeason).map(e => e.id);
    expect(declared.length, 'no castle event declares `oncePerSeason`, so the assertion below '
      + 'passes over an empty set - spec 5.4.2 asks for the flag to be USED, and this is the '
      + 'state Plan 5 Task 5 found: the guard shipped, tested, and declared by nobody')
      .toBeGreaterThanOrEqual(1);

    const seasonsWith = {};
    const doubles = [];
    for (let s = 0; s < SEASONS.length; s++) {
      const counts = {};
      for (const f of SEASONS[s]) {
        if (!declared.includes(f.id)) continue;
        counts[f.id] = (counts[f.id] || 0) + 1;
      }
      for (const [id, n] of Object.entries(counts)) {
        seasonsWith[id] = (seasonsWith[id] || 0) + 1;
        if (n > 1) doubles.push(`${id}: ${n} firings in season ${s + 1}`);
      }
    }
    console.log(`\n=== ONCE-PER-SEASON (${SWEEP_SEASONS} seasons) ===`);
    for (const id of declared) console.log(`   ${seasonsWith[id] || 0}\tseasons\t${id}`);

    expect(doubles.slice(0, 5), 'a signature moment happened twice in one season').toEqual([]);
    // ...and it happens often enough that the check above has seasons to run
    // against. 40 is well under the measured 100 for `grief-numb-to-it-now`, so
    // ordinary content drift does not trip it, but a flagged event sliding
    // toward unreachable - which `oncePerSeason` makes easier, since it can
    // only ever reduce firings - is caught here rather than only by the
    // dead-event sweep's floor of 4.
    const quiet = declared.filter(id => (seasonsWith[id] || 0) < PER400(40))
      .map(id => `${id}: reached ${seasonsWith[id] || 0} of ${SWEEP_SEASONS} seasons`);
    expect(quiet, 'a oncePerSeason event is now so rare that "at most once" is close to '
      + 'vacuous for it').toEqual([]);
  });
});


// ══════════════════════════════════════════════════════════════════════
// THE ACT-PACING RULE, WITH AN IN-SUITE CONTROL ARM (Plan 5 Task 5)
// ══════════════════════════════════════════════════════════════════════
//
// Spec 5.4.3: "Early: broad, social, thread-opening. Middle: testing,
// doubting, thread-advancing. Late: paranoid, surgical, thread-closing,
// counting arguments. An episode-2 castle must not sound like an episode-9
// castle." `acts` is the multiplier that does it, and before this task two
// events of ninety-eight declared one.
//
// WHY A CONTROL ARM AND NOT A PLAIN SHARE ASSERTION. The obvious guard - "an
// act-tagged event's share of firings differs between early and late" - is
// UNFAILABLE against this pool, and the reason is the whole point of the
// declaration: a tag is written where the tone already belongs, so the event
// was ALREADY act-skewed by its own weight() before anything was declared.
// `callback-recognized` reads 233/134/68 with no tag at all, because you can
// only clock somebody from a previous season once. Flatten every multiplier to
// 1 and that assertion stays green.
//
// So this measures the TAG's contribution the way Plan 5's global constraint
// requires: against an uninformative control with the content removed and the
// shape preserved. The control arm plays THE SAME 400 SEEDS with `ev.acts`
// deleted from every event and nothing else touched. For each tagged event,
// take its share of its own WINDOW's firings in the act its profile favours
// most and in the act it favours least (window-relative, because the budget
// gives different acts different volumes), and compare the ratio between the
// arms. Laplace smoothing on both terms, because several tagged events are
// state-gated to near-zero in one act - `grief-numb-to-it-now` needs two
// deaths and cannot fire in `early` at all - and an unsmoothed ratio there is
// a division by luck rather than a measurement.
//
// THE MUTATION: in js/tr/events.js, `const actMult = ev.acts?.[ctx.act] ?? 1;`
// -> `const actMult = 1;`. The two arms then play identically, every gain is
// exactly 1.000, and both assertions below go red. Note that flattening also
// makes tr-events.test.js's own `acts` unit red - again, that one is the
// engine and this one is the game.
describe('THE ACT-PACING RULE: a declared act profile moves the season', () => {
  it('the tags tilt each event toward its own act, measured against an acts-stripped control', () => {
    const tagged = EVENTS.filter(e => e.acts);
    expect(tagged.length, 'nothing declares `acts`, so there is nothing to measure - this is '
      + 'the state Plan 5 Task 5 found, 2 events of 98').toBeGreaterThanOrEqual(15);

    // The control: content removed, shape preserved. Restored in a finally so
    // a failure here cannot leave the pool flattened for the rest of the file.
    const saved = new Map();
    let control;
    try {
      for (const ev of EVENTS) if (ev.acts) { saved.set(ev.id, ev.acts); delete ev.acts; }
      control = runSeasons(SWEEP_SEASONS).flat();
    } finally {
      for (const ev of EVENTS) if (saved.has(ev.id)) ev.acts = saved.get(ev.id);
    }

    const tally = firings => {
      const byIdAct = {}, byWinAct = {};
      for (const f of firings) {
        const act = actFor(f.ep);
        byIdAct[`${f.id}|${act}`] = (byIdAct[`${f.id}|${act}`] || 0) + 1;
        byWinAct[`${f.window}|${act}`] = (byWinAct[`${f.window}|${act}`] || 0) + 1;
      }
      return { byIdAct, byWinAct };
    };
    const live = tally(ALL_FIRINGS);
    const ctrl = tally(control);
    // Derived from `actFor`, not restated - see the note on the same
    // derivation in tests/tr-castle.test.js (round 2, R4).
    const ACTS = [...new Set(Array.from({ length: 40 }, (_, i) => actFor(i + 1)))];
    expect(ACTS.length, '`actFor` returned nothing over 40 episodes').toBeGreaterThanOrEqual(2);

    const rows = tagged.map(ev => {
      const mult = k => ev.acts[k] ?? 1;
      const fav = ACTS.reduce((x, y) => (mult(y) > mult(x) ? y : x));
      const least = ACTS.reduce((x, y) => (mult(y) < mult(x) ? y : x));
      // Window-relative share, Laplace-smoothed on both terms.
      const share = (d, act) => ((d.byIdAct[`${ev.id}|${act}`] || 0) + 1)
        / ((d.byWinAct[`${ev.window}|${act}`] || 0) + 1);
      const rLive = share(live, fav) / share(live, least);
      const rCtrl = share(ctrl, fav) / share(ctrl, least);
      return { id: ev.id, fav, least, gain: rLive / rCtrl,
        n: ACTS.reduce((s, k) => s + (live.byIdAct[`${ev.id}|${k}`] || 0), 0) };
    }).sort((a, b) => a.gain - b.gain);

    console.log(`\n=== ACT TILT vs ACTS-STRIPPED CONTROL (${SWEEP_SEASONS} seasons each arm) ===`);
    for (const r of rows) {
      console.log(`   ${r.gain.toFixed(3)}x\t${r.fav}>${r.least}\t${String(r.n).padStart(4)} firings\t${r.id}`);
    }
    const geo = Math.exp(rows.reduce((s, r) => s + Math.log(r.gain), 0) / rows.length);
    const moved = rows.filter(r => r.gain > 1.05).length;
    console.log(`   geometric mean ${geo.toFixed(3)}x; ${moved} of ${rows.length} tagged events moved >5%`);

    // THE HEADLINE. Measured 1.61x. The floor is 1.30, clear of the shipped
    // value and clear of 1.000 - the value the mutation produces EXACTLY,
    // since with `actMult` flattened the two arms are the same 400 seasons.
    expect(geo, 'the act profiles do not move an event\'s share of its own window any more '
      + 'than deleting them does - the declarations are decoration')
      .toBeGreaterThan(1.30);
    // AND PER EVENT, because a geometric mean can be carried by three big
    // movers while most of the pool's tags do nothing. Measured 18 of 19; the
    // bar is three quarters. The one that does not move is
    // `romance-liability-exposed`, which is state-gated to zero `early`
    // firings in BOTH arms, so no multiplier on `early` can reach it.
    expect(moved, `only ${moved} of ${rows.length} act-tagged events shifted their share of `
      + 'their own window by more than 5% against the control')
      .toBeGreaterThanOrEqual(Math.ceil(rows.length * 0.75));
  }, 120000);
});
