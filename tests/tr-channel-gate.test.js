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
import { measureChannel, seasonForAudit } from '../js/tr/channel-audit.js';
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
    // who turned out to be a Faithful". The band is wide because 100 seasons is
    // a smaller sample than the 600 the constant was priced on; the assertion
    // that matters is that this is NOT a signal.
    expect(r.edge).toBeLessThan(0.10);
  });

  // The transcription check. The audit reconstructs each channel's selection
  // rule from the season record rather than patching the engine, so the rule it
  // measures could silently drift from the rule the engine runs. Every belief
  // the real channel actually left in the knowledge store must appear in the
  // reconstruction.
  it('reconstructs the real channel faithfully — every belief it left is an emission the audit found', () => {
    setPlayers(ROSTER);
    let checked = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const S = seasonForAudit({ ...OPTS, seed });
      const emitted = S.emissions('pushed-then-died');
      const subjects = new Set(emitted.map(e => e.subject));
      const firstEp = new Map();
      for (const e of emitted) if (!firstEp.has(e.subject)) firstEp.set(e.subject, e.ep);
      for (const b of S.beliefs) {
        if (!/^wanted .+ gone the night .+ died$/.test(b.source)) continue;
        checked++;
        expect(subjects.has(b.subject),
          `a belief sourced to the murder channel names ${b.subject}, who the reconstruction never indicts`).toBe(true);
        // The belief must not PREDATE the emission that wrote it. It may
        // POSTdate it: learn() refreshes `learnedEp` on every subsequent learn
        // about the same pair even when it keeps the older, stronger source, so
        // learnedEp is the last time anything was learned about this subject,
        // not the round this source wrote. Requiring exact equality here fails
        // on real seasons — measured, ep 4 emission read back as ep 5 — and the
        // failure is a property of the knowledge layer, not of the transcription.
        expect(b.learnedEp).toBeGreaterThanOrEqual(firstEp.get(b.subject));
      }
    }
    expect(checked, 'the fidelity check must have had something to check').toBeGreaterThan(20);
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
      // Round-matched, so the control sees the identical population densities.
      expect(r.controlBase, `${src}: control must share the channel base`).toBeCloseTo(r.base, 12);
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
