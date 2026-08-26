// THE INSTRUMENT THAT DECIDES WHETHER AN EVENT HAS EARNED THE RIGHT TO WRITE A
// BELIEF.
//
// Three bad evidence channels have shipped in this project and not one of them
// was found by reading code:
//
//   _assess()'s ground-truth valence — sanctioned, but supplying most of a
//     headline number nobody had questioned.
//   murderCost.blames — an evidence source reading GROUND TRUTH, naming a real
//     Traitor 84 times out of 84 against a 20.5% base.
//   clashTraced — an ANTI-SIGNAL at 0.87x emission and 0.57x on surviving
//     beliefs. Deleted.
//
// The governing rule this file enforces: bonds, state and residue are free;
// beliefs are earned. An event may set `writesBelief: true` only if its channel
// measures above an UNINFORMATIVE CONTROL — never above a base rate. That is
// lesson 8, and it is the one that cost the most: `pushedThenDied` reads 1.45x
// against a flat season-wide base and ~0.01x against "voted for any Faithful".
//
// ── WHY THIS IS NOT CALLED tr-channel-audit.test.js ──
//
// vitest.config.js excludes `tests/**/*-audit.test.js` from `npm test`: the
// eight files with that name are TOOLS you run and read (`npm run audit:*`),
// and they cost half the wall clock of the whole suite. Named that way, this
// file would have been collected by nothing — `npx vitest run
// tests/tr-channel-audit.test.js` reports "No test files found" and exits 1,
// which is exactly the slow-globbed-test-silently-skips bug this project has
// already been bitten by once.
//
// It is not a tool. It is a GUARD, it costs about three seconds, and everything
// Tasks 5 and 6 build is admitted or refused on the instrument it checks — an
// audit that cannot detect its own miscalibration is worse than no audit,
// because everything downstream trusts it. So it runs on every `npm test`,
// under a name the exclusion does not swallow. The module it measures keeps the
// name the brief gave it: js/tr/channel-audit.js.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { measureChannel, gateChannel, seasonForAudit } from '../js/tr/channel-audit.js';
import roster from '../franchise_roster.json';

// franchise_roster.json is { players: [...] }, NOT a bare array.
const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
const OPTS = { cast: CAST, traitorCount: 3 };

function measure(source, seasons = 40, extra = {}) {
  setPlayers(ROSTER);
  return measureChannel({ source, seasons, control: 'any-faithful', ...OPTS, ...extra });
}

// Lesson 6: an extreme value is an anomaly to investigate, not a result to
// report — so every measurement this file makes is printed, whether it passes
// or not.
function report(label, r) {
  console.log(`  ${label.padEnd(22)} n=${String(r.n).padStart(5)}  hit=${(r.hitRate * 100).toFixed(1)}%  base=${(r.base * 100).toFixed(1)}%  ratio=${r.ratio.toFixed(3)}x  control=${r.controlRatio.toFixed(3)}x  EDGE=${r.edge.toFixed(3)}`);
}

describe('the channel audit', () => {
  it('passes a channel that genuinely knows something', () => {
    // Synthetic: names a real Traitor 60% of the time against a ~21% base.
    const r = measure('synthetic-informed');
    report('synthetic-informed', r);
    expect(r.n).toBeGreaterThan(200);          // non-vacuity: it must have fired
    expect(r.edge).toBeGreaterThan(0.15);
  });

  it('FAILS a channel that is merely structurally enriched', () => {
    // The pushedThenDied shape: looks strong against a flat base, ~0.01x
    // against "voted for any Faithful". If the audit passes this, it is
    // measuring the same thing the old bands measured and is worthless.
    const r = measure('synthetic-structural');
    report('synthetic-structural', r);
    expect(r.n).toBeGreaterThan(200);
    expect(r.ratio, 'looks informative against a naive base').toBeGreaterThan(1.1);
    expect(r.edge, 'but has no edge over an uninformative control').toBeLessThan(0.05);
  });

  it('FAILS an anti-signal outright', () => {
    // The clashTraced shape: 0.87x at emission. It points the room at
    // innocents. An audit that does not catch this has no purpose.
    const r = measure('synthetic-anti');
    report('synthetic-anti', r);
    expect(r.n).toBeGreaterThan(200);
    expect(r.ratio).toBeLessThan(1);
    expect(r.edge).toBeLessThan(0);
  });

  it('bases every ratio on the density at the round the belief was formed', () => {
    // NOT a season-wide average. The murder only ever removes Faithfuls, so
    // Traitor density climbs all season and a flat base double-counts that
    // drift as if it were signal.
    const r = measure('synthetic-informed');
    expect(r.base).toBeGreaterThan(0.15);
    expect(r.base).toBeLessThan(0.35);
    // And it must NOT be the season's opening density, which is what a mutant
    // computing base once per season would report. A cast of 20 with 3 Traitors
    // opens at 0.150 and every emission lands strictly later than that.
    expect(r.base).toBeGreaterThan(3 / 20);
  });

  // The falsifiable half of the same rule. The assertion above only bounds the
  // base; a mutant that computes it ONCE PER SEASON instead of per emission
  // lands inside those bounds and survives. This does not: a channel that fires
  // only in the last two rounds emits into rooms where the murder has already
  // stripped out most of the Faithfuls, so its base MUST read materially higher
  // than a channel firing in every round. Under a season-wide base the two are
  // the same number.
  it('a channel that fires in the last round reports a higher base than one firing in the first', () => {
    const last = measure('synthetic-last-round');
    const first = measure('synthetic-first-round');
    console.log(`  base first-round=${(first.base * 100).toFixed(1)}%  last-round=${(last.base * 100).toFixed(1)}%  gap=${((last.base - first.base) * 100).toFixed(1)}pp`);
    expect(last.n).toBeGreaterThan(50);
    expect(first.n).toBeGreaterThan(50);
    // The two channels are the SAME uniform rule; only the round differs. A
    // season-wide base makes this gap exactly zero.
    expect(last.base - first.base).toBeGreaterThan(0.05);
  });

  // ── THE FIFTH TEST, AND THE ONE THAT ACTUALLY VALIDATES THE INSTRUMENT ──
  //
  // Three synthetics prove the arithmetic. They cannot prove the audit is
  // pointed at the real engine. This runs it against the one murder-shaped
  // channel that survived deletion and checks it reproduces the number
  // js/tr/deduction.js was repriced on: edge ~0.01x over "voted for any
  // Faithful". If this reads materially more, the audit is measuring the wrong
  // thing and NOTHING may be built on it.
  it('reproduces the known ~0.01x edge of the real pushedThenDied channel', () => {
    const r = measure('pushed-then-died', 100);
    report('pushed-then-died', r);
    expect(r.n).toBeGreaterThan(150);
    // Structurally enriched, exactly as the deduction.js note says: it beats a
    // room's density...
    expect(r.ratio).toBeGreaterThan(1.05);
    // ...and does not beat the uninformative statement "you voted for somebody
    // who turned out to be a Faithful". The assertion that matters is that this
    // is NOT a signal.
    expect(r.edge).toBeLessThan(0.10);
  });

  // ── THE PROTOCOL, WHICH IS NOT THE SAME THING AS THE INSTRUMENT ──
  //
  // A single 40-season measureChannel call is an estimator with a standard
  // error on `edge` of roughly 0.06 — larger than the 0.05 band the synthetics
  // above use to mean "no edge". Re-derived here, on this audit's own reference
  // channel:
  //
  //     seasons    n     edge
  //        40     150   +0.058     <- WRONG SIGN
  //        60     219   -0.014
  //       100     351   -0.058
  //       200     708   -0.074
  //       300    1091   -0.116
  //
  // At 40 seasons `pushedThenDied` — the channel this whole file exists to have
  // caught — reports a POSITIVE edge. A gate prescribing 40 seasons would have
  // admitted it on a sampling accident, and ~150 events were about to be judged
  // that way. gateChannel() is the fix: grow the sample until n >= 200 however
  // many seasons that takes, then require the bar on two DISJOINT seed blocks.
  it('the gate rejects the reference channel, at every stage of its own protocol', () => {
    setPlayers(ROSTER);
    const g = gateChannel({ source: 'pushed-then-died', ...OPTS });
    console.log(`  GATE pushed-then-died pass=${g.pass} seasons=${g.seasons} n=${g.full.n} edge=${g.full.edge.toFixed(3)} A=${g.halves[0].edge.toFixed(3)} B=${g.halves[1].edge.toFixed(3)}`);
    expect(g.pass).toBe(false);
    // It grew past the 40 seasons that would have flattered it.
    expect(g.seasons).toBeGreaterThan(40);
    expect(g.full.n).toBeGreaterThanOrEqual(200);
    // And it fails on BOTH blocks independently, which is what makes the
    // rejection a finding rather than a draw of a coin. Four decorrelated
    // 100-season blocks read -0.058, -0.091, -0.193, -0.083.
    expect(g.halves[0].edge).toBeLessThan(0.15);
    expect(g.halves[1].edge).toBeLessThan(0.15);
    expect(g.reasons.length).toBeGreaterThan(0);
  });

  it('the gate admits a channel that genuinely knows something, on both blocks', () => {
    setPlayers(ROSTER);
    const g = gateChannel({ source: 'synthetic-informed', ...OPTS });
    console.log(`  GATE synthetic-informed pass=${g.pass} seasons=${g.seasons} n=${g.full.n} edge=${g.full.edge.toFixed(3)} A=${g.halves[0].edge.toFixed(3)} B=${g.halves[1].edge.toFixed(3)}`);
    expect(g.pass).toBe(true);
    expect(g.reasons).toEqual([]);
    // The two blocks must be genuinely disjoint seed ranges — a split of one
    // correlated run proves nothing, and `rngFor` hashing is what makes
    // separate ranges separate populations (lesson 9).
    expect(g.halves[1].seedFrom).toBe(g.halves[0].seedFrom + g.seasons);
    expect(g.halves[0].edge).toBeGreaterThan(0.15);
    expect(g.halves[1].edge).toBeGreaterThan(0.15);
  });

  it('the gate refuses a channel that cannot emit enough to be measured', () => {
    setPlayers(ROSTER);
    // n is decoupled from season count on purpose — a rare event is not a bad
    // one — but a channel that still cannot reach 200 emissions inside the
    // ceiling has not been measured, and an unmeasured channel is refused
    // rather than waved through.
    const g = gateChannel({ source: 'pushed-then-died', ...OPTS, minN: 400, maxSeasons: 40 });
    expect(g.pass).toBe(false);
    expect(g.reasons.join(' ')).toMatch(/too rare to measure/);
  });

  it('reports emissions, and says so in the returned object', () => {
    // clashTraced measured 0.87x AT EMISSION and 0.57x on the beliefs that
    // SURVIVED to move a board. Both true, very different. A number that does
    // not name its unit invites the next author to compare the two.
    const r = measure('pushed-then-died');
    expect(r.unit).toBe('emission');
    expect(r.source).toBe('pushed-then-died');
    expect(r.control).toBe('any-faithful');
  });

  // The transcription check. The audit reconstructs each channel's selection
  // rule from the season record rather than patching the engine, so the rule it
  // measures could silently drift from the rule the engine runs. Every belief
  // the real channel actually left in the knowledge store must appear in the
  // reconstruction.
  it('reconstructs the real channel faithfully — every belief it left is an emission the audit found', () => {
    setPlayers(ROSTER);
    let checked = 0, emissionSubjects = 0, withSurvivingBelief = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const S = seasonForAudit({ ...OPTS, seed });
      const emitted = S.emissions('pushed-then-died');
      const subjects = new Set(emitted.map(e => e.subject));
      const firstEp = new Map();
      for (const e of emitted) if (!firstEp.has(e.subject)) firstEp.set(e.subject, e.ep);
      // The source string names the VICTIM, so the round the channel read is
      // checkable too, not just who it indicted. An off-by-one on the round, or
      // a transcription that read `murdered` where the engine reads
      // `murderTarget ?? murdered`, would put a different name here.
      const victimAt = new Map();
      for (const r of S.rounds) victimAt.set(r.ep + 1, r.murderTarget ?? r.murdered);
      const victimsPushed = new Map();
      for (const e of emitted) {
        if (!victimsPushed.has(e.subject)) victimsPushed.set(e.subject, new Set());
        victimsPushed.get(e.subject).add(victimAt.get(e.ep));
      }

      const seen = new Set();
      for (const b of S.beliefs) {
        const m = /^wanted (.+) gone the night (.+) died$/.exec(b.source);
        if (m && m[1] !== m[2]) throw new Error(`malformed source: ${b.source}`);
        if (!m) continue;
        checked++;
        seen.add(b.subject);
        expect(subjects.has(b.subject),
          `a belief sourced to the murder channel names ${b.subject}, who the reconstruction never indicts`).toBe(true);
        // The belief must not PREDATE the emission that wrote it. It may
        // POSTdate it: learn() refreshes `learnedEp` on every subsequent learn
        // about the same pair even when it keeps the older, stronger source, so
        // learnedEp is the last time anything was learned about this subject,
        // not the round this source wrote. Requiring exact equality here fails
        // on real seasons — measured, an ep-4 emission reads back as ep 5 — and
        // the failure is a property of the knowledge layer, not of the
        // transcription.
        expect(b.learnedEp).toBeGreaterThanOrEqual(firstEp.get(b.subject));
        // ...and the victim the belief names must be one this subject was
        // actually reconstructed as having pushed. Not the FIRST such victim:
        // somebody can be indicted in several rounds for several victims, and
        // the belief that survived is whichever landed hardest.
        expect([...(victimsPushed.get(b.subject) || [])],
          `belief names victim ${m[1]}, reconstruction has ${b.subject} pushing`).toContain(m[1]);
      }
      emissionSubjects += subjects.size;
      for (const x of subjects) if (seen.has(x)) withSurvivingBelief++;
    }
    expect(checked, 'the fidelity check must have had something to check').toBeGreaterThan(20);

    // ── THE OTHER DIRECTION, AND ITS LIMIT ──
    //
    // Everything above proves the reconstruction is not too NARROW. It cannot
    // prove it is not too BROAD: extra emissions the engine never makes would
    // dilute hitRate downward and leave every assertion green. A full two-way
    // correspondence is not available, because most true emissions leave no
    // surviving trace — learn()'s acceptance roll rejects many outright, and
    // revealCascade overwrites the survivors at 0.5 against this channel's
    // 0.36. So the check is a COVERAGE FLOOR, bar set below the measured rate
    // and the rate logged (lesson 4). Measured 40.1%; a transcription would
    // have to be roughly a quarter over-broad before this caught it, and the
    // report says so plainly rather than claiming breadth is verified.
    const coverage = withSurvivingBelief / emissionSubjects;
    console.log(`  reconstruction coverage=${(coverage * 100).toFixed(1)}%  (emission subjects=${emissionSubjects}, with a surviving belief=${withSurvivingBelief})`);
    expect(coverage).toBeGreaterThan(0.30);
  });

  // The control must be LIKE-FOR-LIKE. A control that draws a different number
  // of pairs, or draws them from different rounds, is not a control — it is a
  // second, differently-weighted statistic, and subtracting it produces a
  // number with no meaning. This is one of the three mutants this instrument
  // must be able to detect in itself.
  it('draws exactly one control unit per emission, from that emissions own round', () => {
    for (const src of ['synthetic-informed', 'synthetic-structural', 'synthetic-anti', 'pushed-then-died']) {
      const r = measure(src);
      expect(r.controlN, `${src}: control n must match channel n`).toBe(r.n);
      // ROUND-MATCHED, ASSERTED ON THE ROUNDS THEMSELVES.
      //
      // This used to read `expect(r.controlBase).toBeCloseTo(r.base, 12)`, and
      // it certified NOTHING: both accumulators add the same local `base`
      // variable, so that equality holds under any control whatsoever —
      // including one that reads a single fixed round all season. It was a
      // number compared with itself.
      //
      // The property meant is that the control drew from the SAME ROUNDS the
      // channel emitted into, so `controlEpHist` is built from the round each
      // control pool says it came from, independently of the emission's.
      expect(r.controlEpHist, `${src}: control must draw from the channel's own rounds`)
        .toEqual(r.epHist);
    }
  });

  // THE SAME POPULATION, NOT MERELY THE SAME ROUND — and this is the failure
  // class the module's own docstring names ("a control drawn from a different
  // population ... would produce a number with no meaning") and did not test.
  //
  // The channel filters its subjects to the living. The control filtered its
  // voters to the living only INSIDE its own rule, so removing that one filter
  // left every assertion green while moving the reference channel's edge from
  // +0.058 to +0.080 — a 38% swing on the number the gate is built around.
  // Asymmetry between a channel and its control is invisible in every rate it
  // produces; it is only visible in who is in the pool.
  it('draws its control from the same population the channel indicts into', () => {
    for (const src of ['synthetic-informed', 'synthetic-structural', 'synthetic-anti', 'pushed-then-died']) {
      const r = measure(src);
      expect(r.controlOffPopulation,
        `${src}: ${r.controlOffPopulation} control pool members were not in the room the channel was indicting into`).toBe(0);
    }
  });

  it('reports edge as ratio MINUS controlRatio, not ratio', () => {
    const r = measure('synthetic-informed');
    expect(r.edge).toBeCloseTo(r.ratio - r.controlRatio, 12);
    // The control is not decoration: on this engine "voted for any Faithful" is
    // itself enriched, so ignoring it would inflate every channel by ~0.2x.
    expect(r.controlRatio).toBeGreaterThan(1);
  });

  it('refuses a channel or control it does not know, rather than reporting zero', () => {
    setPlayers(ROSTER);
    expect(() => measureChannel({ source: 'no-such-channel', seasons: 2, control: 'any-faithful', ...OPTS }))
      .toThrow(/unknown channel/i);
    expect(() => measureChannel({ source: 'synthetic-informed', seasons: 2, control: 'no-such-control', ...OPTS }))
      .toThrow(/unknown control/i);
  });
});
