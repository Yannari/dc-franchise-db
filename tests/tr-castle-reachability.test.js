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
import { actFor, outcomeSense, openThread, closeThread, advanceThread }
  from '../js/tr/threads.js';
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
import '../js/tr/castle/mission-fallout.js';
import '../js/tr/castle/consequences.js';
import '../js/tr/castle/nightfall.js';

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
    // MOVED AGAIN BY TASK 7 STAGE 3: 98 -> 112 events, 39 -> 53 advancers,
    // 33 -> 47 citers. All fourteen are the `journey-back` library
    // (js/tr/castle/mission-fallout.js), and all fourteen declare both flags.
    //
    // WHY A DECLARATION IS SAFE IN THIS WINDOW WHEN IT WAS NOT IN `morning`.
    // The paragraph above is the reason the flag is treated as a weight change
    // rather than a label: guard 1 multiplies a declared advancer by 4x-9x
    // inside its own window, so ten declarations in `morning` starved
    // `romance-shared-alibi` from 12 firings to 2. `journey-back` is the
    // opposite case. It was the emptiest window in the game — six events,
    // 0.70 scenes an episode against a 4-6 phase budget — so the multiplier is
    // being applied inside a window whose problem was that it had nothing to
    // draw, and the sweep below confirms the result: the rarest branch in the
    // whole pool is unchanged at `grief-nobody-sleeps:awake-desperate`, and
    // the window's own pre-existing six all still clear the branch floor.
    // MOVED AGAIN BY TASK 7 STAGE 4: 112 -> 128 events, 53 -> 71 advancers,
    // 47 -> 63 citers. Sixteen new events are the `after-table` and `night`
    // libraries (js/tr/castle/consequences.js, js/tr/castle/nightfall.js) and
    // all sixteen declare both flags; the other two advancer declarations are
    // rewrites off the audit's REWRITE list —
    // `susp-heard-in-the-corridor` (the pool's most-fired event, which wrote
    // no thread at all) and `cover-alone-with-it` (which wrote no effects at
    // all before stage 2 migrated it).
    //
    // SAME ARGUMENT AS STAGE 3'S FOR WHY A DECLARATION IS SAFE IN THESE TWO
    // WINDOWS AND WAS NOT IN `morning`: guard 1 multiplies a declared advancer
    // by 4x-9x inside its OWN window, and `after-table` and `night` were
    // running at 26% and 44% of their own phase budgets — the multiplier is
    // being applied inside windows whose problem was that they had nothing to
    // draw. Measured after: `after-table` 1.43 -> 4.05 scenes an episode,
    // `night` 1.31 -> 2.58, and the sweeps below confirm nothing in either
    // window's pre-existing pool fell under a floor.
    // 138 -> 157 on 2026-09-05. Nineteen SOLO-ONLY events (js/tr/castle/
    // alone.js), written because a firings-per-branch sweep showed seven of
    // the ten busiest branches in the whole pool are solo branches: the
    // scene composer convenes ONE person about 40% of the time and only a
    // handful of events carried a solo branch, so that handful absorbed
    // nearly every solo draw in a season. All nineteen OPEN arcs rather than
    // continuing them and none cites residue, so the two counts below are
    // deliberately unmoved — which is the check that the count moved for the
    // reason given.
    expect(EVENTS.length).toBe(194);
    // 71 -> 73 (TASK 7 STAGE 6), and both are named rather than counted:
    // `susp-misread-tell` and `susp-defensive-overcorrect`. Each was rewritten
    // from a single branch onto `arcContinue`, so each can now genuinely
    // continue a story that already exists between the pair — which is what
    // the flag asserts — and declaring it is what makes guard 1's multiplier
    // available to a scene that can actually use it. No event was added.
    // 73 -> 77 on the same 2026-09-04 re-baseline as the branch snapshot
    // below: `confrontation.js` declares advancers and landed after this
    // file was last written. `quiet-night-full-table` is NOT one of them --
    // it opens an arc rather than continuing one -- so it is not in this
    // number, which is the check that the count moved for the reason given.
    // 77 -> 80 on 2026-09-05: three of the four events added to the
    // `journey-out` window continue a thread (raising an old thing on the
    // road, carrying the table's argument onto it, taking the weight off
    // somebody). The fourth, `susp-the-shape-of-the-column`, OPENS an arc
    // rather than continuing one and is deliberately not in this number —
    // which is the check that the count moved for the reason given.
    // 80 -> 87 on 2026-09-05: all seven new confrontation events advance a
    // thread, because every one of them continues an argument the pair
    // already had -- `advanceArc` on an existing suspicion or
    // confrontation story, `openArc` only when there is none. None of the
    // seven cites residue, and the citer count below is deliberately
    // unmoved: `confront-the-broken-word` DECLARED citesResidue and it was
    // false (it writes through lineFor and advanceArc, neither of which
    // appends a citation), which tests/tr-castle.test.js caught by being
    // unable to make the event eligible in the probe world.
    // 87 -> 90: all three romance road events advance the thread they gate on.
    // 90 -> 97: all seven group events advance a thread. Each continues the
    // story between the first two of its actors where one exists and opens
    // one where it does not -- a room arguing about a name is the same
    // story as the pair who started it, not a rival one.
    // 97 -> 101: all four mission-fallout additions advance a thread. Each
    // continues the trust story between its pair where one exists and opens
    // one where it does not — an afternoon two people spent together is the
    // same story as whatever they already had, not a rival one.
    // 101 -> 106: all five carry-on events advance a thread, which is the
    // whole reason they exist — each one refuses to fire without a story to
    // continue, so unlike an ordinary event none of them can open one.
    // 106 -> 109: the last three carry-on events, same as the five before
    // them — they exist only to continue a story and cannot open one.
    expect(EVENTS.filter(e => e.advancesThread).length).toBe(117);
    // Pinned alongside, because Task 2 proved the two are NOT the same thing:
    // citing residue needs no flag, so eleven events cite without declaring.
    // 63 -> 64: exactly one of the four new journey-out events declares it.
    // `trust-raised-it-on-the-road` refuses to fire without a thread that
    // already has a day behind it and cites those days; the other three
    // read the bond graph, the column or last night's accusations, none of
    // which is residue.
    // 64 -> 69 on 2026-09-06: all five carry-on events cite residue, and for
    // a structural reason rather than a stylistic one. They exist to
    // CONTINUE a story, they go through `arcContinue`, and a continuation
    // that does not say what it is continuing is the disconnected-vignette
    // shape they were written against. The day tab is the payload.
    // 69 -> 72: all three cite residue for the same structural reason as the
    // five before them — a continuation that does not say what it continues
    // is the disconnected-vignette shape they exist against.
    expect(EVENTS.filter(e => e.citesResidue).length).toBe(72);
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
    // MOVED BY TASK 7 STAGE 3: 45 -> 47 cells, and the interesting number is
    // the one that did NOT move. `zero` is still 18 and `zeroNames` below is
    // still the same eighteen strings: the fourteen new events opened two new
    // cells (`callback|journey-back` and `testing|journey-back`) and every one
    // of them landed in a cell that already had, or now has, an advancer. So
    // the count that changed is `one` -> `many` (17/10 -> 14/15), which is the
    // direction this ledger has always wanted and has never been able to
    // assert as a bar — six `journey-back` cells went from one advancer to two
    // or more, and a thread living in that window is no longer limited to one
    // advance every five rounds by the pair cooldown on a single event.
    // MOVED BY TASK 7 STAGE 4: 47 -> 48 cells, and this is the first time the
    // ZERO count has fallen. 18 -> 15: `cover|night`, `grief|night` and
    // `suspicion|night` all gained an advancer, two of them because the audit's
    // REWRITE verdict on the events already sitting there was that they wrote
    // no thread at all. `one` -> `many` moved again for the same reason as
    // stage 3 (10 -> 23), and the new cell is `trust|night`.
    // 50 -> 55: the confrontation family reached six new windows on
    // 2026-09-05 (dawn, morning, journey-out, journey-back, after-table,
    // night), which is five new cells plus one it already had. See the
    // note on the event count above.
    expect(c.size, 'the number of non-empty (family x window) cells changed').toBe(55);
    // 15 -> 14 (TASK 7 STAGE 6). `suspicion|morning` left the zero list, for
    // the same reason the three `night` cells left it in stage 4: the events
    // already sitting there gained the declaration the audit said they were
    // missing. `susp-misread-tell` and `susp-body-language-read` both write
    // through `arcContinue` now, and the first of them declares the flag. This
    // is a cell count FALLING again, which is the direction it should move.
    // 14 -> 11 on 2026-09-05, AND THIS IS THE FIRST TIME IT HAS FALLEN BY
    // MORE THAN ONE. The three romance road events all advance a thread, and
    // all three landed in cells that had no advancer at all: a story opened
    // in `journey-out` or `journey-back` could not be continued there. Three
    // fewer places where the castle can start something it can never pick up
    // again — which is the number on this line that actually means something.
    expect(zero, 'cells with NO event that can advance a thread — a thread opened here '
      + 'can never be continued here, whatever either continuation lever is set to').toBe(3);
    // 17 -> 20 on 2026-09-05: the same three cells that left `zero` above
    // arrived here, because one advancer is what they gained. The two
    // numbers move together by construction and it is worth reading them
    // that way — a cell going 0 -> 1 is a real improvement and still leaves a
    // thread continuable only once every five rounds.
    //
    // 13 -> 17 on 2026-09-05. The confrontation family reached six new
    // windows, and each arrived with exactly ONE advancer in it, so five of
    // those cells are new entries on this list rather than cells that moved
    // off `zero`. That is the expected shape for a family being widened one
    // event per window at a time, and it is worth saying plainly that it is
    // not an improvement: a cell with one advancer can continue a thread at
    // most once every five rounds. A second confrontation event in each of
    // those windows is what would move them on, and is not yet written.
    //
    // 12 -> 13: `confrontation @ journey-out` did not exist before and now
    // holds exactly one advancer. `none` is unchanged, which is what says a
    // cell gained an advancer rather than the grid moving under all three.
    expect(one, 'cells with exactly one advancer — the 5-episode pair cooldown means a thread '
      // 20 -> 18: two cells that held exactly one advancer gained a second
      // when the group events landed in them, which is the direction this
      // number should move -- a cell with one advancer can continue a
      // thread at most once every five rounds.
      // 18 -> 23: the five cells that left the zero list arrived here, which
      // is the movement to expect and is not yet the movement wanted. A cell
      // with ONE advancer can continue a thread at most once every five
      // rounds; a second event in each of those five is what would move them
      // on, and is not written.
      // 26 -> 22 (THE CONFRONTATION BATCH, 2026-09-06). This one moved the
      // OTHER WAY, and that is the direction to want. The eight new events
      // went into windows confrontation already occupied, so no cell left
      // `zero`; four cells that held a single advancer now hold two, which is
      // the count that matters against the five-episode pair cooldown — a
      // thread living in a one-advancer cell can be picked up at most once
      // every five rounds, and in a two-advancer cell it can alternate.
      // 23 -> 26: the three cells that left the zero list arrived here. Every
      // cell a debut season can reach now has AN advancer; none of the new
      // ones has two, so a thread opened in them is still continuable only
      // once every five rounds. That is the next thing to move, not this.
      + 'living here can be advanced at most once every five rounds').toBe(22);
    // 24 -> 26 on 2026-09-05: two more cells reached two advancers when the
    // group events landed, which is the same movement as the `one` count
    // falling above and should be read with it.
    //
    // 23 -> 24 on 2026-09-05: `confrontation @ evening` had three events and
    // gained a fourth, so the one cell the family already occupied is the
    // only one that moved up here. The other six arrived at one advancer
    // each — see the note above.
    //
    // 22 -> 23: one further cell reached two advancers when the
    // confrontation family was registered. `none` and `one` are unchanged,
    // which is what says a cell gained an advancer rather than the shape
    // of the grid moving underneath all three numbers.
    // 26 -> 30: the four cells the confrontation batch lifted out of `one`.
    expect(many, 'cells with two or more advancers').toBe(30);
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
    // TASK 7 STAGE 4 REMOVED THREE, AND NAMED THEM: `cover|night`,
    // `grief|night` and `suspicion|night`. All three lost their zero because
    // the event already sitting in them gained the declaration the audit said
    // it was missing — `cover-alone-with-it` and `susp-heard-in-the-corridor`
    // both wrote no thread at all, which is the "no reachable follow-up"
    // half of their REWRITE verdicts — plus `night-the-seat-they-had` in the
    // grief cell. Nothing was added to this list.
    // TASK 7 STAGE 6 REMOVED ONE MORE, AND NAMED IT: `suspicion|morning`.
    // `susp-misread-tell`'s rewrite gave it four branches, three of which
    // continue an existing story rather than opening a new one, so the cell
    // that held the pool's most-quoted single-line event now has an advancer
    // in it. Nothing was added to this list.
    // AND FIVE MORE LEFT IT ON 2026-09-06 — `cover|morning`, `grief|morning`,
    // `romance|morning`, `suspicion|journey-out` and `testing|journey-out`,
    // the five js/tr/castle/carry-on.js was written for. What is left is
    // three `callback` cells, which fire zero in a debut season by design
    // and need a returnee fixture rather than an event, and two that are
    // next.
    //
    // THREE NAMES LEFT THIS LIST ON 2026-09-05 and none joined it:
    // `romance|after-table`, `romance|journey-back` and `romance|journey-out`.
    // The family had no event at all on the road and one that could not
    // continue anything after a table, so a romance story opened in any of
    // those three hours could never be picked up in them again. This list
    // is the one in the file worth reading as a to-do: every name on it is
    // a place the castle can start something and then drop it.
    expect(zeroNames).toEqual([
      'callback|dawn',
      'callback|journey-out',
      'callback|morning',
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
  // MOVED BY TASK 7 STAGE 4: 17 -> 21. Two new closers, one per window:
  // `after-i-need-you-tomorrow` (js/tr/castle/consequences.js), which ends a
  // trust story an hour after a banishment in either direction, and
  // `night-what-we-say-in-the-morning` (js/tr/castle/nightfall.js), which
  // settles a testing story by AGREEMENT as well as by catching somebody out
  // — the pool held only the second ending. Nothing left the list.
  'after-i-need-you-tomorrow:passed-clean',
  'after-i-need-you-tomorrow:turned-back',
  'cover-story-survived-the-day:exposed',
  'cover-story-survived-the-day:passed-clean',
  'grief-castle-in-view:buried',
  'grief-castle-in-view:turned-back',
  'mission-back-through-the-gate:buried',
  'mission-back-through-the-gate:passed-clean',
  'mission-back-through-the-gate:turned-back',
  'night-what-we-say-in-the-morning:passed-clean',
  'night-what-we-say-in-the-morning:test-exposed',
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
// PLAN 5 TASK 8 added four splits (164 keys -> 168). Four events returned a
// CONSTANT branch label over state that genuinely forked the scene, which made
// this table blind to a repeat inside them — `susp-misread-tell` read as one
// outcome fired 345 times per 400 seasons when it is two. The splits are:
// `grief-headcount` on pair/solo, `susp-alliance-shape-guess` on whether the
// map was already drawn, `susp-misread-tell` on whether the misreader is nervy,
// and `susp-pattern-tracking` on whether the tally crosses acts.
//
// THE SPLITS WERE CHOSEN AGAINST THIS FLOOR, not in spite of it. Splitting
// `susp-body-language-read` on its prior-outcome sense measured 162 / 3 / 17
// per 400 seasons — two new cells at or beside the floor of 3, on counts the
// resampling finding says are redrawn rather than nudged by any later content
// change — so that one keeps a constant label and varies its SENTENCE instead.
// Same for `susp-misread-tell`, where the raw `desperate` state reads 6 per 400
// and `nervy` (paranoid OR desperate) reads 59. The rarest of the six new cells
// is 59 per 400. A repeat-detecting label is not worth a knife-edge band.
// MOVED AGAIN BY TASK 7 STAGE 5: 346 -> 411 (event, branch) keys.
//
// A DRIFT LEDGER, MAINTAINED DELIBERATELY, and the interesting thing about this
// repin is that it added NO EVENTS. Every one of the sixty-five new keys is a
// branch on an event that already existed: twenty-one events rewritten off the
// audit's REWRITE list from one or two branches to four, plus six solo branches
// added to events that previously refused a one-person draw. Exactly one key
// disappeared, `trust-late-checkin:checked-in`, and it disappeared because that
// event's single branch was replaced by four named ones.
//
// The count of EVENTS is unchanged at 128, which is the check worth making
// against this number: if events had been added or removed, that assertion
// above would have moved too, and it did not.
//
// MOVED AGAIN BY TASK 7 STAGE 6: 411 -> 540 (event, branch) keys, and the same
// check holds — `EVENTS.length` is STILL 128. Not one event was registered or
// removed in this stage either. Every one of the new keys is a branch on an
// event that already existed: the remaining REWRITE-list events taken from one
// or two branches to four, five or six, plus the KEEP-list flagships whose
// forks were real but whose branch sets could not express a refusal or a
// reversal. Five keys disappeared, and each because its event's branch was
// renamed rather than deleted — `susp-body-language-read:body-read` became
// four named branches, `trust-defend-in-absentia:defended` became
// `spoke-for-them` (the old label meant the opposite thing in two other
// events, and `_tone` cannot hold both), `romance-spark:one-sided` became
// `one-sided-so-far` and `trust-circle-forms:not-yet` became `not-this-week`
// for the same collision reason, and `cover-swap-story-with-partner`'s merged
// romance branch was renamed when its gate was widened.
//
// FIX ROUND 1: 541, +1. `grief-nobody-sleeps:awake-unfounded` is new — the
// branch a nervy mood takes when NO ballot supports the sentence it would
// otherwise print (C3, js/tr/castle/grief.js). `cover-decline-recruit-offer-
// story:recruit-story-covered` was renamed `recruit-story-kept` because the
// old identifier contained a banned engine word (C2); it is the same branch.
// RE-BASELINED 2026-09-04, AND THE CAUSE WAS CHECKED BEFORE THE NUMBERS WERE
// TOUCHED. This snapshot was written on 2026-09-02 (819f37cd). `confrontation.js`
// landed on 2026-09-03 with three events, `trust-circle-breaks` and
// `after-the-circle-harboured-one` grew branches in the same window, and
// `quiet-night-full-table` was added on the 4th. None of those updated this
// file, and this file is in vitest.slow.js — excluded from `npm test` — so
// nothing ever ran it to say so. It has been red since the 3rd.
//
// 22 branches ADDED, ZERO REMOVED, which is the only fact that makes a
// re-baseline safe rather than a way of blessing a regression:
//
//   confront-to-the-face          4    (confrontation.js, new)
//   confront-pile-on              3    (confrontation.js, new)
//   confront-defend-the-accused   3    (confrontation.js, new)
//   after-the-circle-harboured-one 4   (betrayal fallout)
//   trust-circle-breaks           4
//   quiet-night-full-table        4    (the morning nobody was taken)
// 2026-09-05: +14, all from the four events added to the `journey-out` window
// (js/tr/castle/journey.js). That window held EIGHT events against thirty-one
// in `evening`, with seven of the eight families on exactly one — the
// eligible-event exhaustion this plan measured in `journey-back` and `night`
// and then fixed in both, leaving this one starved. Zero branches removed.
// 183 -> 186 AND 770 -> 782 on 2026-09-06, AND THE ZERO-ADVANCER LIST IS NOW
// THREE, ALL OF THEM `callback`. Those three are not an oversight: that family
// reads franchise history and fires ZERO in a debut season by design, so an
// event written for `callback|dawn` cannot be verified by playing one. They
// wait for a returnee fixture rather than being guessed at.
//
// Every cell a debut season can reach now has an event that can continue a
// story in it. 11 -> 6 -> 3 across two batches.
//
// 178 -> 183 AND 750 -> 770 on 2026-09-06, AND THE NUMBER THIS BATCH IS
// ABOUT IS THE ZERO-ADVANCER COUNT BELOW: 11 -> 6.
//
// Measured first, the share of each window's scenes that CONTINUE a story
// rather than open one, over 30 played seasons: night 67%, after-table 66%,
// journey-back 58%, evening 54%, dawn 53% — and MORNING 42%, JOURNEY-OUT 44%.
// A continued scene is the one that arrives with a day tab on it, so those
// two hours read as disconnected vignettes next to the evening.
//
// The cause was not a weight. Ten of the eleven cells on the zero-advancer
// list were in those two columns, so a story opened there could never be
// picked up there again — a suspicion formed on the road out had to wait for
// the evening. js/tr/castle/carry-on.js is five events that REFUSE TO FIRE
// WITHOUT ONE: each weight() checks findOpenThread and returns 0, because an
// event written to fill an advancer hole that spends half its firings opening
// new threads has not filled it.
//
// After: morning 45%, journey-out 47%. A modest move for five events, and
// the honest reading is that the gate is doing the limiting — these can only
// win a draw when the pair convened happens to hold the right kind of story.
//
// 174 -> 178 AND 734 -> 750 on 2026-09-05. mission-fallout.js held fourteen
// events and, read by their bond direction, every one of them was about
// something the afternoon TOOK: "what cost us", "a body short", "who was
// where", "the hour they went missing". An afternoon is also the only time
// eighteen strangers do something together, in daylight, with a shared
// result, and that half of it had no scene at all. These four are it — a pair
// the draw put together who had no history, watching somebody be visibly
// good at a thing, a disaster that becomes a joke on the road home, and a day
// that went well and made an alliance visible.
//
// NOT ALL WARM, because "positive" is not a register: a good day is a target,
// being carried is a debt, and noticing competence is the first half of
// deciding somebody is dangerous.
//
// 167 -> 174 AND 706 -> 734 on 2026-09-05, AND THIS ONE IS NOT A CONTENT
// BATCH. Actors per scene, measured over 40 played seasons (9,796 scenes):
// one actor 45%, two actors 55%, THREE OR MORE 0%. Not rare -- none.
// `_sceneActors` had two uniform branches and no third, and its continuation
// branch returns a thread's parties, which are one or two names. A castle of
// eighteen never had three of them in a room together.
//
// AND js/vp-tr/castle-day.js HAS HAD A `group` COMPOSITION MODE SINCE IT WAS
// WRITTEN (line ~1461, its own ESTABLISH_GROUP pool, its own establish and
// consequence arms) that no played season could reach. A whole mode of dead
// content, not a fork nobody takes.
//
// The seven events in js/tr/castle/group.js exist so the draw could be
// opened: 93 of the pool's events begin `if (ctx.actors?.length !== 2)
// return 0`, so a three-actor draw with nothing to answer it spends window
// density on barren draws. Content first, sampler second, measured after --
// density held at 26.34 scenes an episode against 26.46 before.
//
// 164 -> 167 AND 694 -> 706 on 2026-09-05. Same method as the confrontation
// batch below, applied to the next-thinnest row of the same grid: romance held
// evening 3, dawn 2, morning 2, night 2, after-table 1 -- and JOURNEY-OUT 0,
// JOURNEY-BACK 0. Two people could fall for each other at breakfast, at
// dinner and at midnight, and then walk five miles beside each other twice a
// day with nothing to say. The road is the only hour the castle spends
// outside, paired off, in daylight, where a showmance is unavoidably public,
// which is the liability that family is built on.
//
// All three gate on a thread that already exists, so none can create a
// pairing or needs the 4-active concurrency cap, and all three declare
// `rare: true` -- the guard-2 rule js/tr/castle/romance.js's own header
// records that family having broken once already.
//
// 157 -> 164 AND 666 -> 694 on 2026-09-05, AND THE EVENT COUNT MOVES FOR THE
// FIRST TIME IN THREE COMMITS. Measured before writing: events per family
// across the pool were trust 35, suspicion 31, grief 26, testing 17, cover 17,
// romance 14, callback 12 -- and CONFRONTATION 4, every one of them registered
// to `evening`. The loudest thing this format does could happen in exactly one
// hour of the day. The seven new events are that family in the six windows it
// had never reached, four branches each.
//
// 653 -> 666 on 2026-09-05, EVENT COUNT AGAIN UNCHANGED. The last thirteen
// events below Task 11's four-branch bar, and TWO OF THEM WERE BUGS rather
// than missing content -- see js/tr/castle/cover.js
// (`they-told-it-first` read a field name that does not exist, so it scored a
// literal 0 forever) and js/tr/castle/grief.js (`turned-on-each-other`
// required one thread naming three people, which cannot happen). Both had
// written pools that had never reached a screen. THIS FILE'S OWN TITLE says a
// fork nobody takes is dead content inside a live event, and it could not see
// either, because the snapshot is built from what was observed rather than
// from what the source declares.
//
// 634 -> 653 on 2026-09-05, and the EVENT COUNT ABOVE IS UNCHANGED: the
// nineteen solo events each gained a FOURTH branch. Task 11's completeness bar
// is four branches per event and they shipped with three, which is a thing
// this file counts branches for and never checked per event. Each addition
// forks on a different driver from its three siblings -- see the header of
// js/tr/castle/alone.js.
//
// 577 -> 634 on 2026-09-05: nineteen solo-only events in
// js/tr/castle/alone.js, three branches each. See the event-count comment
// above for why they were written and why the advancer/citer counts beside
// it are deliberately unmoved.
const BRANCHES = [
  'after-i-need-you-tomorrow:agreed',
  'after-i-need-you-tomorrow:conditional',
  'after-i-need-you-tomorrow:refused',
  'after-i-need-you-tomorrow:traded',
  'after-nobody-said-our-names:made-it-a-plan',
  'after-nobody-said-our-names:one-of-us-is-lying',
  'after-nobody-said-our-names:quietly-pleased',
  'after-nobody-said-our-names:worried-by-it',
  'after-somebody-goes-tonight:alone-with-it',
  'after-somebody-goes-tonight:joked-about-it',
  'after-somebody-goes-tonight:made-a-plan',
  'after-somebody-goes-tonight:performed-it',
  'after-somebody-goes-tonight:said-it-out-loud',
  'after-somebody-goes-tonight:would-not-say-it',
  'after-the-circle-harboured-one:closed-ranks',
  'after-the-circle-harboured-one:couldnt-see-it',
  'after-the-circle-harboured-one:cut-loose',
  'after-the-circle-harboured-one:who-else',
  'after-the-count-moved:came-across',
  'after-the-count-moved:flat-denial',
  'after-the-count-moved:moved-off',
  'after-the-count-moved:never-with-me',
  'after-the-count-moved:with-me-again',
  'after-the-empty-seat:angry-at-the-room',
  'after-the-empty-seat:guilty',
  'after-the-empty-seat:mourned',
  'after-the-empty-seat:on-their-own',
  'after-the-empty-seat:relieved',
  'after-the-last-thing-they-said:alone-with-it',
  'after-the-last-thing-they-said:answered-it',
  'after-the-last-thing-they-said:dismissed',
  'after-the-last-thing-they-said:let-it-stand',
  'after-the-last-thing-they-said:picked-it-up',
  'after-the-room-got-it-right:credit-where-due',
  'after-the-room-got-it-right:next-one',
  'after-the-room-got-it-right:on-their-own',
  'after-the-room-got-it-right:overclaimed',
  'after-the-room-got-it-right:who-knew',
  'after-the-room-got-it-wrong:alone-with-it',
  'after-the-room-got-it-wrong:blamed-the-loudest',
  'after-the-room-got-it-wrong:counted-my-own',
  'after-the-room-got-it-wrong:defended-the-vote',
  'after-the-room-got-it-wrong:went-quiet',
  'after-two-people-said-my-name:asked-them-why',
  'after-two-people-said-my-name:counted-them',
  'after-two-people-said-my-name:hardened',
  'after-two-people-said-my-name:rattled',
  'after-two-people-said-my-name:worked-the-room',
  'after-what-i-said-at-the-table:alone-with-it',
  'after-what-i-said-at-the-table:got-it-right',
  'after-what-i-said-at-the-table:named-the-wrong-one',
  'after-what-i-said-at-the-table:stood-by-it',
  'after-what-i-said-at-the-table:walked-it-back',
  'after-you-wrote-my-name:denied-it',
  'after-you-wrote-my-name:made-it-a-price',
  'after-you-wrote-my-name:named-the-others',
  'after-you-wrote-my-name:owned-it',
  'after-you-wrote-my-name:reassured-it',
  'after-you-wrote-my-name:would-not-say',
  'callback-competitive-history:called-a-truce',
  'callback-competitive-history:reopened-it',
  'callback-competitive-history:rivalry-carried-over',
  'callback-competitive-history:useful-rivalry',
  'callback-different-show-different-person:asked-to-be-let-off',
  'callback-different-show-different-person:disappointment',
  'callback-different-show-different-person:dissonance',
  'callback-different-show-different-person:redemption',
  'callback-different-show-different-person:stopped-comparing',
  'callback-grudge-resurfaces:grudge-resurfaced',
  'callback-grudge-resurfaces:let-it-go-at-last',
  'callback-grudge-resurfaces:said-it-once-and-stopped',
  'callback-grudge-resurfaces:wants-something-for-it',
  'callback-history-confrontation:buries',
  'callback-history-confrontation:grudge',
  'callback-history-confrontation:reconciles',
  'callback-history-confrontation:strategic',
  'callback-no-history-envy:asked-to-be-told',
  'callback-no-history-envy:left-out',
  'callback-no-history-envy:made-a-virtue-of-it',
  'callback-no-history-envy:went-and-found-one',
  'callback-old-alliance-reforms:alliance-reformed',
  'callback-old-alliance-reforms:not-the-same-terms',
  'callback-old-alliance-reforms:renegotiated-it',
  'callback-old-alliance-reforms:somebody-noticed',
  'callback-protects-old-ally-from-vote:defended-by-history',
  'callback-protects-old-ally-from-vote:history-is-not-evidence',
  'callback-protects-old-ally-from-vote:now-they-are-a-pair',
  'callback-protects-old-ally-from-vote:would-not-spend-it',
  'callback-recognized:left-it-at-the-door',
  'callback-recognized:picked-it-back-up',
  'callback-recognized:said-it-to-the-room',
  'callback-recognized:still-owed',
  'callback-shared-alumni-status:alumni-bond',
  'callback-shared-alumni-status:both-know-how-it-ends',
  'callback-shared-alumni-status:compared-endings',
  'callback-shared-alumni-status:the-room-priced-them',
  'callback-showmance-reunion-spark:agreed-not-to',
  'callback-showmance-reunion-spark:one-of-them-still-is',
  'callback-showmance-reunion-spark:reunion-spark',
  'callback-showmance-reunion-spark:the-room-got-there-first',
  'callback-warns-newbies:already-knew',
  'callback-warns-newbies:defended-them-instead',
  'callback-warns-newbies:used-it-immediately',
  'callback-warns-newbies:warned',
  'carry-account-again:somebody-else-checked',
  'carry-account-again:stopped-telling-it',
  'carry-account-again:the-story-grew',
  'carry-account-again:told-it-the-same',
  'carry-account-on-the-road:asked-about-it-out-there',
  'carry-account-on-the-road:let-it-lie-out-there',
  'carry-account-on-the-road:rehearsed-on-the-walk',
  'carry-account-on-the-road:somebody-else-was-there',
  'carry-doubt-on-the-road:found-the-hole',
  'carry-doubt-on-the-road:let-it-cool',
  'carry-doubt-on-the-road:tested-it-again',
  'carry-doubt-on-the-road:was-talked-round',
  'carry-grief-days-later:put-it-away',
  'carry-grief-days-later:shared-it-properly',
  'carry-grief-days-later:still-carrying-it',
  'carry-grief-days-later:turned-it-to-use',
  'carry-one-short-on-the-road:counted-the-column',
  'carry-one-short-on-the-road:nobody-said-the-name',
  'carry-one-short-on-the-road:talked-about-them-walking',
  'carry-one-short-on-the-road:walking-where-they-walked',
  'carry-the-morning-after:admitted-it-in-daylight',
  'carry-the-morning-after:nothing-changed-in-daylight',
  'carry-the-morning-after:one-of-them-retreated',
  'carry-the-morning-after:somebody-saw',
  'carry-the-morning-test:answered-too-well',
  'carry-the-morning-test:nothing-to-read',
  'carry-the-morning-test:set-it-over-breakfast',
  'carry-the-morning-test:they-saw-it-coming',
  'carry-the-second-test:failed-it-this-time',
  'carry-the-second-test:passed-it-again',
  'carry-the-second-test:refused-to-play',
  'carry-the-second-test:turned-it-around',
  'confront-about-the-vote:blamed-somebody-else',
  'confront-about-the-vote:owned-it',
  'confront-about-the-vote:turned-it-on-them',
  'confront-about-the-vote:would-not-answer',
  'confront-apology-refused:apologised-for-the-wrong-thing',
  'confront-apology-refused:refused-it',
  'confront-apology-refused:took-it-badly-and-then-took-it',
  'confront-apology-refused:used-it',
  'confront-blamed-for-the-mission:blamed-them-back',
  'confront-blamed-for-the-mission:named-the-weak-link',
  'confront-blamed-for-the-mission:nobody-backed-it',
  'confront-blamed-for-the-mission:took-the-blame',
  'confront-carried-it-home:dropped-it-at-the-gate',
  'confront-carried-it-home:one-of-them-apologised',
  'confront-carried-it-home:somebody-else-carried-it',
  'confront-carried-it-home:still-going-inside',
  'confront-defend-the-accused:drew-fire',
  'confront-defend-the-accused:fell-flat',
  'confront-defend-the-accused:too-late',
  'confront-defend-the-accused:worked',
  'confront-first-light:caught-them-alone',
  'confront-first-light:it-turned-into-breakfast',
  'confront-first-light:not-at-this-hour',
  'confront-first-light:somebody-walked-in',
  'confront-in-the-corridor:cleared-the-air',
  'confront-in-the-corridor:made-it-worse',
  'confront-in-the-corridor:nobody-heard-it',
  'confront-in-the-corridor:said-what-they-meant',
  'confront-it-starts-on-the-road:in-front-of-everybody',
  'confront-it-starts-on-the-road:somebody-stepped-in',
  'confront-it-starts-on-the-road:straight-back-into-it',
  'confront-it-starts-on-the-road:swallowed-it',
  'confront-on-the-long-walk:everybody-heard-it',
  'confront-on-the-long-walk:ran-out-of-road',
  'confront-on-the-long-walk:ran-the-whole-way',
  'confront-on-the-long-walk:the-column-broke-it-up',
  'confront-over-breakfast:room-took-sides',
  'confront-over-breakfast:said-it-cold',
  'confront-over-breakfast:shut-down',
  'confront-over-breakfast:too-raw',
  'confront-pile-on:crumbled',
  'confront-pile-on:overreached',
  'confront-pile-on:turned-it-back',
  'confront-pile-on:weathered',
  'confront-stop-following-me:admitted-it',
  'confront-stop-following-me:both-embarrassed',
  'confront-stop-following-me:made-it-worse-for-them',
  'confront-stop-following-me:told-them-to-stop',
  'confront-the-broken-word:denied-saying-it',
  'confront-the-broken-word:had-a-reason',
  'confront-the-broken-word:said-it-plainly',
  'confront-the-broken-word:threw-it-back',
  'confront-the-empty-chair:defended-the-room',
  'confront-the-empty-chair:nobody-said-anything',
  'confront-the-empty-chair:we-got-it-wrong',
  'confront-the-empty-chair:you-drove-it',
  'confront-through-the-door:never-opened-it',
  'confront-through-the-door:opened-it',
  'confront-through-the-door:said-the-unsayable',
  'confront-through-the-door:wrong-door',
  'confront-to-the-face:blew-up',
  'confront-to-the-face:cracked',
  'confront-to-the-face:held',
  'confront-to-the-face:turned',
  'confront-waited-up:had-it-out',
  'confront-waited-up:lost-their-nerve',
  'confront-waited-up:they-were-ready-too',
  'confront-waited-up:woke-the-corridor',
  'confront-would-not-walk-with:called-out-for-it',
  'confront-would-not-walk-with:closed-the-gap',
  'confront-would-not-walk-with:dragged-others-in',
  'confront-would-not-walk-with:made-it-obvious',
  'confront-you-let-them-go:both-admitted-it',
  'confront-you-let-them-go:said-nothing-at-all',
  'confront-you-let-them-go:saved-themselves',
  'confront-you-let-them-go:turned-it-on-the-accuser',
  'cover-alibi-crumbles:abandoned-it',
  'cover-alibi-crumbles:checked-against-somebody',
  'cover-alibi-crumbles:collapses',
  'cover-alibi-crumbles:holds',
  'cover-alibi-crumbles:wobbles',
  'cover-alone-with-it:nearly',
  'cover-alone-with-it:rehearsing',
  'cover-alone-with-it:sleepless',
  'cover-alone-with-it:steady',
  'cover-blend-with-victims-friends:blended-in',
  'cover-blend-with-victims-friends:kept-out',
  'cover-blend-with-victims-friends:overdid-it',
  'cover-blend-with-victims-friends:was-welcomed',
  'cover-cold-sweat-tell:laughed-it-off',
  'cover-cold-sweat-tell:overexplained',
  'cover-cold-sweat-tell:stopped-talking',
  'cover-cold-sweat-tell:tell',
  'cover-decline-recruit-offer-story:binned-it',
  'cover-decline-recruit-offer-story:recruit-story-kept',
  'cover-decline-recruit-offer-story:they-told-it-first',
  'cover-decline-recruit-offer-story:told-it-unasked',
  'cover-double-bluff:asked-back',
  'cover-double-bluff:did-not-take',
  'cover-double-bluff:double-bluffed',
  'cover-double-bluff:overpaid-for-it',
  'cover-feign-fear:borrowed-it',
  'cover-feign-fear:could-not-today',
  'cover-feign-fear:overdid-it',
  'cover-feign-fear:pitched-it-right',
  'cover-plant-a-name:came-back-round',
  'cover-plant-a-name:it-took',
  'cover-plant-a-name:thought-better-of-it',
  'cover-plant-a-name:too-obvious',
  'cover-preemptive-alibi:alibi-built',
  'cover-preemptive-alibi:asked-for-it',
  'cover-preemptive-alibi:held-it-back',
  'cover-preemptive-alibi:too-specific',
  'cover-rehearsed-story-advance:changed-it',
  'cover-rehearsed-story-advance:heard-themselves',
  'cover-rehearsed-story-advance:rehearsed',
  'cover-rehearsed-story-advance:roughed-it-up',
  'cover-road-rehearsal:airtight',
  'cover-road-rehearsal:could-not-get-it-straight',
  'cover-road-rehearsal:overcooked',
  'cover-road-rehearsal:serviceable',
  'cover-road-rehearsal:stopped-rehearsing',
  'cover-story-check:awkward',
  'cover-story-check:convincing',
  'cover-story-check:slip',
  'cover-story-check:suspicious',
  'cover-story-survived-the-day:broke',
  'cover-story-survived-the-day:frayed',
  'cover-story-survived-the-day:held',
  'cover-story-survived-the-day:nobody-asked',
  'cover-suspect-own-ally:played-along',
  'cover-suspect-own-ally:sacrificed-ally',
  'cover-suspect-own-ally:the-room-kept-it',
  'cover-suspect-own-ally:would-not-take-it',
  'cover-swap-story-with-partner:synchronized',
  'cover-swap-story-with-partner:too-identical',
  'cover-swap-story-with-partner:were-together-anyway',
  'cover-swap-story-with-partner:would-not-square-it',
  'grief-blame-the-room:blamed-room',
  'grief-blame-the-room:blamed-themselves',
  'grief-blame-the-room:named-a-number',
  'grief-blame-the-room:turned-on-them',
  'grief-castle-in-view:buried',
  'grief-castle-in-view:carried',
  'grief-castle-in-view:talked-past-it',
  'grief-castle-in-view:turned-sharp',
  'grief-empty-chair:empty-chair',
  'grief-empty-chair:laid-a-place',
  'grief-empty-chair:moved-it-away',
  'grief-empty-chair:nobody-noticed',
  'grief-headcount:counted-the-chairs',
  'grief-headcount:counted-the-useful-ones',
  'grief-headcount:left-it-unsaid',
  'grief-headcount:said-the-number',
  'grief-how-the-room-holds-them:being-managed',
  'grief-how-the-room-holds-them:nothing-changed',
  'grief-how-the-room-holds-them:people-are-cooler',
  'grief-how-the-room-holds-them:people-are-warmer',
  'grief-keepsake:handed-it-over',
  'grief-keepsake:pocketed',
  'grief-keepsake:put-it-back',
  'grief-keepsake:set-it-out',
  'grief-morning-reaction:mourn',
  'grief-morning-reaction:opportunistic',
  'grief-morning-reaction:stoic',
  'grief-morning-reaction:suspicious',
  'grief-nobody-sleeps:awake-content',
  'grief-nobody-sleeps:awake-desperate',
  'grief-nobody-sleeps:awake-paranoid',
  'grief-nobody-sleeps:awake-unfounded',
  'grief-numb-to-it-now:numb',
  'grief-numb-to-it-now:one-of-them-still-feels-it',
  'grief-numb-to-it-now:performed-it',
  'grief-numb-to-it-now:said-it-and-regretted-it',
  'grief-seating-shift:kept-the-gap',
  'grief-seating-shift:reseated',
  'grief-seating-shift:sat-apart',
  'grief-seating-shift:took-their-chair',
  'grief-shared-mourning-bond:could-not-say-it',
  'grief-shared-mourning-bond:one-sided-grief',
  'grief-shared-mourning-bond:shared-mourning',
  'grief-shared-mourning-bond:told-a-story-about-them',
  'grief-shorter-column:pair-again',
  'grief-shorter-column:pair-first',
  'grief-shorter-column:solo-again',
  'grief-shorter-column:solo-first',
  'grief-someone-cries-alone:came-down-angry',
  'grief-someone-cries-alone:did-not-come-down',
  'grief-someone-cries-alone:put-it-away',
  'grief-someone-cries-alone:was-found',
  'grief-suspicion-of-timing:about-to-say-something',
  'grief-suspicion-of-timing:timing',
  'grief-suspicion-of-timing:we-had-it-wrong',
  'grief-suspicion-of-timing:would-not-play',
  'grief-the-castle-in-daylight:got-on-with-it',
  'grief-the-castle-in-daylight:looked-at-it-properly',
  'grief-the-castle-in-daylight:the-empty-rooms',
  'grief-the-castle-in-daylight:wanted-to-go-home',
  'grief-the-chair-beside-them:did-not-notice',
  'grief-the-chair-beside-them:kept-the-place',
  'grief-the-chair-beside-them:sat-somewhere-else',
  'grief-the-chair-beside-them:took-the-chair',
  'grief-the-hour-before-the-table:decided-early',
  'grief-the-hour-before-the-table:dreading-it',
  'grief-the-hour-before-the-table:not-worried-tonight',
  'grief-the-hour-before-the-table:still-deciding',
  'grief-toast-to-them:could-not-finish',
  'grief-toast-to-them:named-them-all',
  'grief-toast-to-them:nobody-joined-in',
  'grief-toast-to-them:poured-two',
  'grief-toast-to-them:turned-into-a-vow',
  'grief-what-came-back-with-them:brought-it-home',
  'grief-what-came-back-with-them:came-back-decided',
  'grief-what-came-back-with-them:shook-it-off',
  'grief-what-came-back-with-them:watched-them-come-in',
  'grief-what-it-is-all-for:did-the-arithmetic',
  'grief-what-it-is-all-for:not-thinking-about-it',
  'grief-what-it-is-all-for:what-it-has-cost',
  'grief-what-it-is-all-for:why-they-came',
  'grief-wrongly-suspected-irony:owned-the-mistake',
  'grief-wrongly-suspected-irony:still-think-we-were-right',
  'grief-wrongly-suspected-irony:turned-on-each-other',
  'grief-wrongly-suspected-irony:wrongly-suspected-irony',
  'group-agreed-a-name:broke-up-with-nothing',
  'group-agreed-a-name:landed-on-one',
  'group-agreed-a-name:somebody-said-nothing',
  'group-agreed-a-name:two-against-one',
  'group-kitchen-at-breakfast:closed-ranks',
  'group-kitchen-at-breakfast:nobody-mentioned-it',
  'group-kitchen-at-breakfast:said-it-first',
  'group-kitchen-at-breakfast:the-room-split',
  'group-rounded-on-them:came-apart',
  'group-rounded-on-them:held-the-room',
  'group-rounded-on-them:nobody-would-start',
  'group-rounded-on-them:the-room-turned',
  'group-sat-up-late:heard-something',
  'group-sat-up-late:nobody-wanted-to-go-up',
  'group-sat-up-late:one-of-them-left-early',
  'group-sat-up-late:told-each-other-things',
  'group-walked-home-in-threes:agreed-who-cost-them',
  'group-walked-home-in-threes:one-of-them-defended-them',
  'group-walked-home-in-threes:said-nothing-useful',
  'group-walked-home-in-threes:went-over-the-afternoon',
  'group-walked-out-together:left-somebody-out',
  'group-walked-out-together:picked-up-a-stray',
  'group-walked-out-together:traded-what-they-had',
  'group-walked-out-together:walked-as-a-block',
  'group-went-through-the-vote:blamed-each-other',
  'group-went-through-the-vote:counted-it-out-loud',
  'group-went-through-the-vote:protected-one-of-them',
  'group-went-through-the-vote:went-to-bed-on-it',
  'mission-a-body-short:angry',
  'mission-a-body-short:did-not-mention-it',
  'mission-a-body-short:named-them',
  'mission-a-body-short:on-their-own',
  'mission-a-body-short:useful',
  'mission-a-name-by-the-time-were-back:agreed',
  'mission-a-name-by-the-time-were-back:agreed-for-different-reasons',
  'mission-a-name-by-the-time-were-back:alone',
  'mission-a-name-by-the-time-were-back:kept-it-back',
  'mission-a-name-by-the-time-were-back:split',
  'mission-back-through-the-gate:carried-inside',
  'mission-back-through-the-gate:ended-badly',
  'mission-back-through-the-gate:quietly-dropped',
  'mission-back-through-the-gate:settled-it',
  'mission-good-hands:admired',
  'mission-good-hands:found-it-suspicious',
  'mission-good-hands:noted-it-quietly',
  'mission-good-hands:wished-it-had-been-them',
  'mission-laughed-about-it:blamed-the-set-up',
  'mission-laughed-about-it:laughed-about-it',
  'mission-laughed-about-it:too-soon',
  'mission-laughed-about-it:went-quiet-about-it',
  'mission-same-half-first-time:found-they-worked',
  'mission-same-half-first-time:got-in-the-way',
  'mission-same-half-first-time:one-of-them-carried-it',
  'mission-same-half-first-time:polite-and-nothing',
  'mission-same-side:closed-ranks',
  'mission-same-side:divided-it',
  'mission-same-side:one-sided',
  'mission-same-side:professional',
  'mission-the-good-day:enjoyed-it',
  'mission-the-good-day:shared-it-out',
  'mission-the-good-day:too-visible',
  'mission-the-good-day:took-the-credit',
  'mission-the-hour-they-went-missing:counted-the-cost',
  'mission-the-hour-they-went-missing:defended-the-hour',
  'mission-the-hour-they-went-missing:let-it-alone',
  'mission-the-hour-they-went-missing:saw-it-happen',
  'mission-the-long-walk:caught-up-with-it',
  'mission-the-long-walk:nothing-doing',
  'mission-the-long-walk:sorting-it',
  'mission-the-long-walk:straight-through',
  'mission-the-other-half:boasted',
  'mission-the-other-half:compared-clean',
  'mission-the-other-half:gap',
  'mission-the-other-half:shrugged-off',
  'mission-the-other-half:traded',
  'mission-took-the-extra:credited',
  'mission-took-the-extra:suspicious-of-eager',
  'mission-took-the-extra:unimpressed',
  'mission-took-the-extra:used-it',
  'mission-weve-done-this-before:not-that-person',
  'mission-weve-done-this-before:old-account',
  'mission-weve-done-this-before:same-page',
  'mission-weve-done-this-before:still-that-person',
  'mission-what-cost-us:alone',
  'mission-what-cost-us:defended',
  'mission-what-cost-us:pinned',
  'mission-what-cost-us:redirected',
  'mission-what-cost-us:shrugged',
  'mission-what-the-day-was-worth:already-past-it',
  'mission-what-the-day-was-worth:bitter',
  'mission-what-the-day-was-worth:counted-it',
  'mission-what-the-day-was-worth:joked',
  'mission-what-they-can-ask-me:overtold',
  'mission-what-they-can-ask-me:solid',
  'mission-what-they-can-ask-me:thin',
  'mission-what-they-can-ask-me:unasked',
  'mission-what-you-saw-out-there:answered',
  'mission-what-you-saw-out-there:blank',
  'mission-what-you-saw-out-there:caught',
  'mission-what-you-saw-out-there:turned',
  'mission-who-was-where:asked-back',
  'mission-who-was-where:refused-it',
  'mission-who-was-where:straight-answer',
  'mission-who-was-where:thin-answer',
  'night-nothing-strategic-left:alone',
  'night-nothing-strategic-left:funny',
  'night-nothing-strategic-left:hollow',
  'night-nothing-strategic-left:kind',
  'night-nothing-strategic-left:ordinary',
  'night-one-vote-away:asked-outright',
  'night-one-vote-away:awake-with-it',
  'night-one-vote-away:counted-it',
  'night-one-vote-away:let-it-lie',
  'night-one-vote-away:promised-nothing',
  'night-overruled-in-the-turret:filed-it',
  'night-overruled-in-the-turret:made-a-condition',
  'night-overruled-in-the-turret:pressed-it',
  'night-overruled-in-the-turret:swallowed-it',
  'night-overruled-in-the-turret:turned-cold',
  'night-the-seat-they-had:could-not',
  'night-the-seat-they-had:moved-their-things',
  'night-the-seat-they-had:on-their-own',
  'night-the-seat-they-had:own-ballot',
  'night-the-seat-they-had:talked-about-them',
  'night-what-we-say-in-the-morning:agreed-a-line',
  'night-what-we-say-in-the-morning:could-not-agree',
  'night-what-we-say-in-the-morning:one-of-them-lied',
  'night-what-we-say-in-the-morning:settled-it',
  'quiet-night-full-table:a-message',
  'quiet-night-full-table:counted-twice',
  'quiet-night-full-table:somebody-was-safe',
  'quiet-night-full-table:they-faltered',
  'romance-carried-them-home:let-them-struggle',
  'romance-carried-them-home:made-a-performance-of-it',
  'romance-carried-them-home:they-refused-it',
  'romance-carried-them-home:took-care-of-them',
  'romance-comfort-after-loss-sparks:grief-spark',
  'romance-comfort-after-loss-sparks:just-comfort',
  'romance-comfort-after-loss-sparks:the-room-noticed',
  'romance-comfort-after-loss-sparks:too-soon',
  'romance-jealousy-third-party:made-it-strategy',
  'romance-jealousy-third-party:said-it-out-loud',
  'romance-jealousy-third-party:swallowed-it',
  'romance-jealousy-third-party:went-to-them',
  'romance-liability-exposed:confronts',
  'romance-liability-exposed:exposes',
  'romance-liability-exposed:oblivious',
  'romance-liability-exposed:suspicious',
  'romance-protection-instinct:asked-not-to',
  'romance-protection-instinct:did-not-step-in',
  'romance-protection-instinct:protected',
  'romance-protection-instinct:too-loud',
  'romance-road-spark:named-it',
  'romance-road-spark:road-spark',
  'romance-road-spark:somebody-saw',
  'romance-road-spark:walked-it-off',
  'romance-shared-alibi:asked-separately',
  'romance-shared-alibi:did-not-match',
  'romance-shared-alibi:refused-to-vouch',
  'romance-shared-alibi:shared-alibi',
  'romance-shields-target-together:agreed-to-be-strangers',
  'romance-shields-target-together:one-sided-pact',
  'romance-shields-target-together:refused-the-pact',
  'romance-shields-target-together:shield-pact',
  'romance-showmance-breakup:broke-up',
  'romance-showmance-breakup:ended-in-strategy',
  'romance-showmance-breakup:ended-kindly',
  'romance-showmance-breakup:faded-out',
  'romance-showmance-fight:about-the-vote',
  'romance-showmance-fight:patched-it',
  'romance-showmance-fight:showmance-fight',
  'romance-showmance-fight:went-cold',
  'romance-showmance-forms:agreed-to-hide-it',
  'romance-showmance-forms:stopped-hiding-it',
  'romance-showmance-forms:the-room-said-it',
  'romance-showmance-forms:told-one-person',
  'romance-showmance-on-the-way-back:agreed-quietly',
  'romance-showmance-on-the-way-back:not-yet',
  'romance-showmance-on-the-way-back:told-them',
  'romance-showmance-on-the-way-back:walked-in-holding',
  'romance-spark:interrupted',
  'romance-spark:named-it-fast',
  'romance-spark:one-sided-so-far',
  'romance-spark:said-nothing',
  'romance-spark:sparked',
  'romance-strategic-optics:called-strategic',
  'romance-strategic-optics:it-landed-inside',
  'romance-strategic-optics:leaned-into-it',
  'romance-strategic-optics:made-a-joke-of-it',
  'romance-voted-differently:covered-for-them',
  'romance-voted-differently:one-of-them-was-in-danger',
  'romance-voted-differently:wrote-different-names',
  'romance-voted-differently:wrote-the-same-name',
  'romance-walked-back-together:easy',
  'romance-walked-back-together:said-out-loud',
  'romance-walked-back-together:strained',
  'romance-walked-back-together:watched',
  'romance-walked-together:first-hour-alone',
  'romance-walked-together:kept-apart-on-purpose',
  'romance-walked-together:the-column-saw-it',
  'romance-walked-together:walked-the-whole-way',
  'susp-alliance-shape-guess:agreed-the-map',
  'susp-alliance-shape-guess:could-not-place-one',
  'susp-alliance-shape-guess:drew-it-alone',
  'susp-alliance-shape-guess:put-each-other-on-it',
  'susp-alliance-shape-guess:redrew-it',
  'susp-awake-with-a-name:afraid-of-the-morning',
  'susp-awake-with-a-name:certain-of-someone',
  'susp-awake-with-a-name:changed-their-mind',
  'susp-awake-with-a-name:slept-fine',
  'susp-body-language-read:asked-what-it-was',
  'susp-body-language-read:caught-them-looking',
  'susp-body-language-read:read-it',
  'susp-body-language-read:was-nothing',
  'susp-cold-case-revival:answered-at-last',
  'susp-cold-case-revival:nobody-cared',
  'susp-cold-case-revival:put-it-down',
  'susp-cold-case-revival:revived',
  'susp-defensive-overcorrect:caught-themselves',
  'susp-defensive-overcorrect:it-worked',
  'susp-defensive-overcorrect:let-it-go',
  'susp-defensive-overcorrect:nobody-asked-you',
  'susp-defensive-overcorrect:overcorrected',
  'susp-going-over-the-count:counted-who-did-not-look',
  'susp-going-over-the-count:one-vote-bothering-them',
  'susp-going-over-the-count:read-the-ballots',
  'susp-going-over-the-count:stopped-counting',
  'susp-group-pressure-crack:admitted-something-else',
  'susp-group-pressure-crack:cracks',
  'susp-group-pressure-crack:holds',
  'susp-group-pressure-crack:overcorrected',
  'susp-group-pressure-crack:redirects',
  'susp-group-pressure-crack:walked-away',
  'susp-heard-in-the-corridor:caught',
  'susp-heard-in-the-corridor:checked-the-door',
  'susp-heard-in-the-corridor:heard',
  'susp-heard-in-the-corridor:imagined',
  'susp-keeping-track-of-it:checked-their-own-record',
  'susp-keeping-track-of-it:gave-up-tracking',
  'susp-keeping-track-of-it:went-through-it-again',
  'susp-keeping-track-of-it:wrote-it-down',
  'susp-let-it-go-on-the-road-back:cleared',
  'susp-let-it-go-on-the-road-back:hardened',
  'susp-let-it-go-on-the-road-back:never-raised-it',
  'susp-let-it-go-on-the-road-back:slipped',
  'susp-misread-tell:asked-them',
  'susp-misread-tell:heard-it-out-loud',
  'susp-misread-tell:misread-calm',
  'susp-misread-tell:misread-nervy',
  'susp-misread-tell:told-somebody',
  'susp-noticed-inconsistency:asked-about-it',
  'susp-noticed-inconsistency:let-it-pass',
  'susp-noticed-inconsistency:noticed',
  'susp-noticed-inconsistency:told-somebody',
  'susp-out-of-earshot:agreed',
  'susp-out-of-earshot:defended',
  'susp-out-of-earshot:hedged',
  'susp-out-of-earshot:named-somebody-else',
  'susp-out-of-earshot:would-not-talk-about-it',
  'susp-overheard-conversation:agreed-what-it-was',
  'susp-overheard-conversation:argued-about-it',
  'susp-overheard-conversation:saw-it-alone',
  'susp-overheard-conversation:told-somebody-else',
  'susp-overheard-conversation:went-and-asked',
  'susp-pattern-tracking:let-the-list-go',
  'susp-pattern-tracking:put-it-to-them',
  'susp-pattern-tracking:showed-somebody',
  'susp-pattern-tracking:tracked',
  'susp-pattern-tracking:tracked-since',
  'susp-private-accusation:confess',
  'susp-private-accusation:denies',
  'susp-private-accusation:denyWeak',
  'susp-private-accusation:turned',
  'susp-said-nothing-about-it:decided-who-to-tell',
  'susp-said-nothing-about-it:holding-it',
  'susp-said-nothing-about-it:let-it-go',
  'susp-said-nothing-about-it:not-sure-it-counts',
  'susp-the-shape-of-the-column:read-the-order',
  'susp-the-shape-of-the-column:the-gap-in-the-middle',
  'susp-the-shape-of-the-column:the-wrong-pair',
  'susp-the-shape-of-the-column:walking-alone',
  'susp-timeline-crosscheck:checked-out',
  'susp-timeline-crosscheck:did-not-line-up',
  'susp-timeline-crosscheck:lost-the-hour',
  'susp-timeline-crosscheck:one-of-us-was-there',
  'susp-what-one-person-does-with-it:counting-the-cost',
  'susp-what-one-person-does-with-it:voted-against-the-room',
  'susp-what-one-person-does-with-it:was-right',
  'susp-what-one-person-does-with-it:was-wrong',
  'susp-where-in-the-column:took-the-back',
  'susp-where-in-the-column:took-the-front',
  'susp-where-in-the-column:walked-off-the-path',
  'susp-where-in-the-column:went-where-put',
  'susp-whisper-about-absent:compared-notes',
  'susp-whisper-about-absent:named-somebody-else',
  'susp-whisper-about-absent:took-it-away',
  'susp-whisper-about-absent:would-not-join-in',
  'testing-ask-for-alibi-check:checks-out',
  'testing-ask-for-alibi-check:got-back-to-them',
  'testing-ask-for-alibi-check:inconsistent',
  'testing-ask-for-alibi-check:nobody-would-say',
  'testing-cold-read-check:kept-it',
  'testing-cold-read-check:read-it-right',
  'testing-cold-read-check:read-it-wrong',
  'testing-cold-read-check:said-it-aloud',
  'testing-decoy-secret:caughtTest',
  'testing-decoy-secret:innocent',
  'testing-decoy-secret:keptQuiet',
  'testing-decoy-secret:malicious',
  'testing-double-check-story:asked-why-twice',
  'testing-double-check-story:consistent',
  'testing-double-check-story:inconsistent',
  'testing-double-check-story:would-not-repeat-it',
  'testing-follow-through-check:clocked-the-check',
  'testing-follow-through-check:dropped-it',
  'testing-follow-through-check:followed-through',
  'testing-follow-through-check:half-kept-it',
  'testing-hypothetical-loyalty-question:asked-it-back',
  'testing-hypothetical-loyalty-question:hedged',
  'testing-hypothetical-loyalty-question:made-a-condition',
  'testing-hypothetical-loyalty-question:reassured',
  'testing-loyalty-oath:asked-for-one-back',
  'testing-loyalty-oath:refuses',
  'testing-loyalty-oath:reluctant',
  'testing-loyalty-oath:sincere',
  'testing-night-scores-it:confirmed',
  'testing-night-scores-it:failed',
  'testing-night-scores-it:inconclusive',
  'testing-night-scores-it:misread',
  'testing-rehearsing-tomorrow:decided-to-go-first',
  'testing-rehearsing-tomorrow:decided-to-say-nothing',
  'testing-rehearsing-tomorrow:no-plan-at-all',
  'testing-rehearsing-tomorrow:practised-it',
  'testing-reverse-psychology:got-rattled',
  'testing-reverse-psychology:saw-through-it',
  'testing-reverse-psychology:stayed-calm',
  'testing-reverse-psychology:turned-it-round',
  'testing-silence-test:chased',
  'testing-silence-test:filled-it-with-their-own',
  'testing-silence-test:let-it-go',
  'testing-silence-test:out-waited-them',
  'testing-small-dare:complied',
  'testing-small-dare:named-the-test',
  'testing-small-dare:over-delivered',
  'testing-small-dare:refused',
  'testing-who-you-walk-with:flattered',
  'testing-who-you-walk-with:transactional',
  'testing-who-you-walk-with:turned-it-around',
  'testing-who-you-walk-with:wary',
  'testing-who-you-walk-with:would-not-be-picked',
  'trust-circle-breaks:drifted',
  'trust-circle-breaks:severed',
  'trust-circle-breaks:talked-through',
  'trust-circle-breaks:turned-cold',
  'trust-circle-forms:circle',
  'trust-circle-forms:not-this-week',
  'trust-circle-forms:said-the-word',
  'trust-circle-forms:three-of-us',
  'trust-confide-fear:confided',
  'trust-confide-fear:invited-them-in',
  'trust-confide-fear:nearly-said-it',
  'trust-confide-fear:regretted-it',
  'trust-confide-fear:traded-it',
  'trust-defend-in-absentia:let-it-sit',
  'trust-defend-in-absentia:lost-the-argument',
  'trust-defend-in-absentia:spoke-for-them',
  'trust-defend-in-absentia:was-asked-why',
  'trust-fall-into-step:confided',
  'trust-fall-into-step:fell-behind',
  'trust-fall-into-step:probed',
  'trust-fall-into-step:quiet',
  'trust-fall-into-step:said-too-much',
  'trust-first-one-down:counted-them-in',
  'trust-first-one-down:had-the-room',
  'trust-first-one-down:nobody-came',
  'trust-first-one-down:wished-they-had-waited',
  'trust-glad-of-the-air:already-working',
  'trust-glad-of-the-air:dreading-the-mission',
  'trust-glad-of-the-air:glad-to-be-out',
  'trust-glad-of-the-air:walked-it-like-a-race',
  'trust-inner-circle-invite:asked-what-it-costs',
  'trust-inner-circle-invite:declined',
  'trust-inner-circle-invite:invited-in',
  'trust-inner-circle-invite:showed-the-worst-of-it',
  'trust-last-word-before-lights-out:broken',
  'trust-last-word-before-lights-out:hedged',
  'trust-last-word-before-lights-out:sworn',
  'trust-last-word-before-lights-out:turned-it-round',
  'trust-late-checkin:air-in-the-answer',
  'trust-late-checkin:asked-for-a-name',
  'trust-late-checkin:checked-on-them',
  'trust-late-checkin:still-good',
  'trust-post-murder-huddle:could-not-be-near-anyone',
  'trust-post-murder-huddle:counted-the-room',
  'trust-post-murder-huddle:huddled',
  'trust-post-murder-huddle:went-round-the-room',
  'trust-protect-pact:one-way',
  'trust-protect-pact:pact',
  'trust-protect-pact:said-it-again',
  'trust-protect-pact:with-one-exception',
  'trust-raised-it-on-the-road:let-it-lie',
  'trust-raised-it-on-the-road:put-it-down',
  'trust-raised-it-on-the-road:reopened-it',
  'trust-raised-it-on-the-road:said-it-out-there',
  'trust-return-favor:favor-returned',
  'trust-return-favor:kept-the-score',
  'trust-return-favor:noticed-and-said-so',
  'trust-return-favor:refused-it-back',
  'trust-secret-swap:kept',
  'trust-secret-swap:leakedAccident',
  'trust-secret-swap:leakedDeliberate',
  'trust-secret-swap:refused-to-trade',
  'trust-settled-on-the-way-back:dropped',
  'trust-settled-on-the-way-back:held',
  'trust-settled-on-the-way-back:soured',
  'trust-settled-on-the-way-back:unresolved',
  'trust-share-suspicion-honestly:both-had-it',
  'trust-share-suspicion-honestly:defended-them',
  'trust-share-suspicion-honestly:made-them-pay-first',
  'trust-share-suspicion-honestly:shared-suspicion',
  'trust-share-suspicion-honestly:took-it-back',
  'trust-the-back-of-the-column:could-not-keep-up',
  'trust-the-back-of-the-column:deliberately-behind',
  'trust-the-back-of-the-column:set-the-pace',
  'trust-the-back-of-the-column:took-the-long-way',
  'trust-the-last-light:could-not-sleep',
  'trust-the-last-light:counted-the-doors',
  'trust-the-last-light:slept-fine',
  'trust-the-last-light:went-over-tomorrow',
  'trust-the-stairs-afterwards:said-nothing-going-up',
  'trust-the-stairs-afterwards:stayed-down',
  'trust-the-stairs-afterwards:straight-up',
  'trust-the-stairs-afterwards:went-up-with-a-decision',
  'trust-the-walk-back-alone:let-it-go',
  'trust-the-walk-back-alone:noticed-the-quiet',
  'trust-the-walk-back-alone:went-over-it',
  'trust-the-walk-back-alone:worked-out-a-move',
  'trust-took-the-weight-on-the-road:let-them-struggle',
  'trust-took-the-weight-on-the-road:made-a-point-of-it',
  'trust-took-the-weight-on-the-road:needed-carrying',
  'trust-took-the-weight-on-the-road:took-the-weight',
  'trust-trade-reads:disagreed',
  'trust-trade-reads:one-way',
  'trust-trade-reads:read-the-room',
  'trust-trade-reads:same-name',
  'trust-trade-reads:traded-reads',
  'trust-trade-reads:went-back-over-one',
  'trust-vote-commitment-test:broken',
  'trust-vote-commitment-test:deflected',
  'trust-vote-commitment-test:kept',
  'trust-vote-commitment-test:turned',
  'trust-vow-of-silence:agreed-a-version',
  'trust-vow-of-silence:one-sided-vow',
  'trust-vow-of-silence:vowed-silence',
  'trust-vow-of-silence:would-not-promise',
];

// A minimum over 164 cells needs more seasons than a total or a share does —
// see the derivation on the assertion below. This is the only band in the file
// that pays for them.
const BRANCH_SWEEP_SEASONS = 3200;
const BRANCH_PER400 = n => Math.round(n * BRANCH_SWEEP_SEASONS / 400);

describe('THE BRANCH FLOOR: a fork nobody takes is dead content inside a live event', () => {
  it('every (event, branch) pair the pool can produce is produced in real seasons', () => {
    const perBranch = {};
    for (const f of runSeasons(BRANCH_SWEEP_SEASONS).flat()) {
      const k = `${f.id}:${f.branch}`;
      perBranch[k] = (perBranch[k] || 0) + 1;
    }
    const keys = Object.keys(perBranch).sort();
    const bottom = keys.map(k => ({ k, n: perBranch[k] })).sort((a, b) => a.n - b.n).slice(0, 12);
    console.log(`\n=== RAREST TWELVE BRANCHES (${BRANCH_SWEEP_SEASONS} seasons, ${keys.length} branches) ===`);
    for (const b of bottom) console.log(`   ${b.n}\t${b.k}`);

    expect(keys, 'a branch appeared or disappeared from the pool').toEqual(BRANCHES);
    // == RE-DERIVED BY PLAN 5 TASK 6: 4 per 400 seasons -> 3 per 400 ==========
    //
    // SAY IT PLAINLY: THIS IS A LOOSENING. The demand on content fell by a
    // quarter, from four firings per 400 seasons to three. The first draft of
    // this comment called it "not a loosening, just precision", and that was
    // spin. What follows is why it was taken anyway.
    //
    // The old floor of 4 was measured at 400 seasons against a rarest branch of
    // 4 — zero margin, on a count whose own resampling noise is larger than the
    // whole margin. `romance-liability-exposed:exposes` read 8, 7, 4, 5 and 6
    // across five arms of identical decisions.
    //
    // AND HOLDING THE OLD DEMAND WOULD HAVE SHIPPED ANOTHER KNIFE-EDGE. At
    // 1600 seasons PER400(4) = 16 sits 2.2 sd under the rarest branch; even at
    // 3200 it is 2.6 sd. Both are under the 3 sd bar this suite uses, so
    // "keep 4 and raise the seasons" buys a second version of the same defect.
    // Three per 400 clears it. That is the trade, stated rather than dressed up.
    //
    // == AND THIS BAND GETS ITS OWN, DEEPER SWEEP (round 2, R3) ==============
    //
    // It is the only assertion in this file whose statistic is a MINIMUM over
    // 164 cells. A minimum has a much fatter lower tail than any mean or share
    // here, so it needs more seasons than the rest of the file to be known as
    // well. The first derivation used four 1600-season blocks and reported
    // 4.4 sd; eight blocks put the sd at 3.38, not 1.83, and the margin at
    // 2.48 sd — the four-block figure was optimistic by 80%, which is exactly
    // the +/-40% an sd on 3 degrees of freedom carries.
    //
    // MEASURED, six disjoint 3200-season blocks (bases 0, 3200, 6400, 9600,
    // 12800, 16000): rarest branch 50, 37, 52, 45, 46, 52 — mean 47.0, sd 5.73.
    // PER400(3) = 24 sits 4.01 sd under it, and the worst block observed (37)
    // clears it by 13. On five degrees of freedom the 90% upper bound on that
    // sd is 10.1, so the DEFENSIBLE claim is "at least 2.3 sd at 90%
    // confidence, 4.0 sd on the point estimate". Both numbers are here because
    // quoting only the point estimate is how the four-block figure misled.
    //
    // The rest of the file stays at SWEEP_SEASONS: every other statistic in it
    // is a total or a share and is already known well enough at 1600.
    //
    // WHAT IT STILL CATCHES: a branch falling below one firing per 133 seasons,
    // and a branch dying outright. What it deliberately does NOT do is police
    // ordinary resampling — a branch moving 47 -> 35 on an unrelated content
    // change is noise, and the old floor would have called it a regression.
    const starved = bottom.filter(b => b.n < BRANCH_PER400(3)).map(b => `${b.k}: ${b.n}`);
    expect(starved, `these branches are on their way to dead content — an event-keyed `
      + `floor cannot see this, which is why this one is keyed per branch`).toEqual([]);
  // == A WALL-CLOCK ALLOWANCE, NOT A BAND (Task 7 stage 6) =================
  //
  // This arm plays 3,200 real seasons and nothing about what it ASSERTS has
  // been changed here — the season count, the floor of three per 400 and the
  // derivation above are all untouched. What moved is how long 3,200 seasons
  // take: Task 7 took the castle from 12.8 fired scenes an episode to ~27, so
  // the same sweep does roughly twice the work and ran past the 90s in
  // vitest.sim.config.js. It measured 165s here.
  //
  // THE HONEST OPTIONS WERE FEWER SEASONS OR MORE TIME, and fewer seasons is
  // the one that weakens the guard: the long note above spends thirty lines
  // establishing that this particular statistic — a MINIMUM over 164 cells —
  // needs 3,200 to be known well, and cutting it to fit a timer would undo
  // that derivation to save four minutes on a file that already lives in
  // `vitest.slow.js`. So the time moves and the evidence does not. 300s is
  // ~1.8x the measured runtime, which is headroom for a slower machine rather
  // than a number chosen to just fit.
  }, 300000);
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

    // THE ASSUMPTION THIS RULE RESTS ON, CHECKED RATHER THAN ASSUMED (R4).
    //
    // `t.lastEp` is the last BEAT's episode, not explicitly the closing one.
    // The comparisons above are only reading the closing episode because
    // nothing can beat a thread after it closes: `advanceThread` returns null
    // unless `state === 'open'`, and `openThread` folds only through
    // `findOpenThread`, which is open-only. That is a property of two functions
    // in ANOTHER file. If it ever stops holding, `lastEp` drifts past the
    // closure and every comparison above silently reads the wrong episode.
    //
    // THE OBVIOUS CHECK IS VACUOUS AND WAS WRITTEN FIRST. Scanning the played
    // seasons for a closed thread whose last beat is later than `lastEp` finds
    // nothing even when the guard is deleted — because `advanceThread` stamps
    // `lastEp` on its way past, so the two move together and the drift hides
    // itself. Measured: with `|| t.state !== 'open'` removed from
    // `advanceThread`, that scan stays GREEN.
    //
    // So the property is asserted DIRECTLY, on the real functions, against the
    // live state the sweep above has already built.
    const [pa, pb] = CAST;
    const probe = openThread('suspicion', [pa, pb], 2, 'r4 probe');
    closeThread(probe.id, 3, 'buried');
    const closedAt = probe.lastEp;
    const advanced = advanceThread(probe.id, 9, 'a beat after the ending');
    expect(advanced, 'advanceThread accepted a CLOSED thread, so `lastEp` no longer means '
      + 'the closing episode and every comparison in this rule is reading the wrong number '
      + '- give closed threads an explicit closing episode').toBeNull();
    expect(probe.lastEp, "a closed thread's lastEp moved after it closed").toBe(closedAt);

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
