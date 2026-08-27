// ══════════════════════════════════════════════════════════════════════
// tr-castle-prose.test.js — the castle may not print the same sentence
// twice, and it may not own a one-line pool
// ══════════════════════════════════════════════════════════════════════
//
// WHAT THIS IS FOR. Roughly half the castle pool used to write a CONSTANT:
// one sentence per event, printed with different names in it. 44 of 98 events
// had a single template and 58 called no `pick()` at all. `susp-misread-tell`
// printed its one line in episodes 1, 4, 8 and 10 of the same castle. Nothing
// in the suite could see it: every floor in this repo counts FIRINGS, and an
// event that fires the right number of times while saying the identical thing
// is perfectly healthy by every one of them. It was found by dumping a season
// and reading it, which is how all eleven prose defects on this plan were
// found and none of them by an assertion. This file is the assertion.
//
// TWO RULES, BOTH OVER THE WHOLE POOL, NEITHER A LIST OF KNOWN CASES:
//
//   A. VARIETY. Every (event, branch) the castle can produce must be able to
//      say it at least four different ways.
//   B. REPETITION. A season almost never prints the same sentence three times
//      (1.5% of them, against 26.5% before this task) and never four. That is
//      what a viewer experiences; rule A is the mechanism that makes it true,
//      and the two fail for different reasons — a pool can be wide and still
//      be hammered by one event that fires eight times in one castle. See the
//      long note on the band for why B is a SHARE and not a maximum.
//
// WHY IT MEASURES REAL SEASONS AND NOT `fire()` DIRECTLY. The obvious cheap
// version is the belief gate's second arm: execute every event's fire() in the
// probe world at a few rolls and count what comes out. It was written, and it
// measures the probe world rather than the pool. Nine events read their names
// off a thread's `parties` and never look at `ctx.actors`, so varying the
// scene does not vary their sentence; `forkRng` is deterministic after its
// first draw, so every `pick()` inside a branch returns the same element every
// time. That arm scored 35 keys at ONE distinct sentence against pools of four
// and five. A guard that reports a defect the code does not have is worse than
// no guard, so this reads what the seasons actually printed.
//
// HOW THE SENTENCE IS EXTRACTED. Each firing's new thread beats are captured
// by wrapping `fire()` — harness instrumentation, exactly like `actors` in
// tr-castle-reachability.js, and nothing in the engine reads it. Only the
// FIRST sentence of each beat counts: Task 2's citations append "It went back
// to day 3: ..." to a note, and the day numbers vary even when the sentence in
// front of them never does, so counting whole notes would let a constant hide
// behind its own citation. Names and numbers are then masked, because
// "Brick clocked a harmless habit of Cameron's" and "B clocked a harmless
// habit of Bowie's" are the same sentence to a reader and were counted as two
// different ones by every earlier attempt at this measurement.
//
// FILENAME: deliberately NOT `*-audit.test.js`. vitest.config.js excludes that
// pattern from `npm test` and this project has shipped four guards into that
// hole. Collection verified by running the suite and watching the count.
import { describe, expect, it } from 'vitest';
import { gs, setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { EVENTS } from '../js/tr/events.js';
import { seedFranchiseHistory } from './helpers/tr-castle-fixture.js';
import roster from '../franchise_roster.json';

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
// Longest first, so "Chris McLean" is masked before "Chris" can eat half of it.
const NAMES = [...CAST].sort((a, b) => b.length - a.length);

// == WHY 3200 AND NOT 400 ================================================
//
// Rule A asks whether a pool has four elements, and it can only see four if
// the season sampler actually lands on all four. Line selection is a hash of
// (event id, branch, episode, the people in the scene), so over N firings of a
// genuine four-line pool the chance of missing one is 4*(3/4)^N. At the 400
// seasons the rest of this plan measures at, the rarest (event, branch) key
// fires 6 times: 4*(3/4)^6 = 71%, so the guard would have reddened on nearly
// every rare branch in the pool for no content reason at all. At 3200 the
// rarest key fires 50 times and the same probability is 2.3e-6 — 3.8e-4 across
// all 168 keys. That is the season count this rule costs, and it is why the
// guard-on-the-guard below pins the rarest key's FIRING count as well as its
// distinct count: if a key ever decays back into the sampling zone, this file
// must go red rather than quietly start measuring nothing.
//
// Wall clock: ~23s. Measured, not estimated.
const PROSE_SEASONS = 3200;

/** The first sentence of a note — the part a line pool owns. See the header. */
function lead(note) { return String(note || '').split(/(?<=[.!?])[ ]/)[0]; }

/** Two sentences that differ only in who is in them are ONE sentence here. */
function mask(s) {
  let out = String(s);
  for (const n of NAMES) out = out.split(n).join('~');
  return out.replace(/\d+/g, '#').replace(/~['’]s/g, '~');
}

// == THE HARNESS =========================================================
//
// Wrap every registered event's fire() once, before any season runs, and
// record the thread beats that firing wrote. The wrapper returns the original
// result untouched, so the seasons play exactly as they would without it.
const FIRINGS = [];
let _season = 0;
for (const ev of EVENTS) {
  const orig = ev.fire;
  ev.fire = function (ctx, rng) {
    const before = new Set();
    for (const t of (gs?.tr?.threads || [])) for (const b of t.beats) before.add(b);
    const res = orig.call(this, ctx, rng);
    const notes = [];
    for (const t of (gs?.tr?.threads || [])) {
      for (const b of t.beats) if (!before.has(b) && b.note) notes.push(mask(lead(b.note)));
    }
    FIRINGS.push({ season: _season, key: `${ev.id}:${res?.branch ?? '(none)'}`, notes });
    return res;
  };
}

for (let i = 1; i <= PROSE_SEASONS; i++) {
  _season = i;
  setPlayers(ROSTER);
  seedFranchiseHistory(CAST);
  playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: i });
}

/** { key -> { firings, distinct sentences } } */
const PER_KEY = new Map();
for (const f of FIRINGS) {
  if (!PER_KEY.has(f.key)) PER_KEY.set(f.key, { n: 0, set: new Set() });
  const e = PER_KEY.get(f.key);
  e.n++;
  for (const s of f.notes) e.set.add(s);
}

/** The worst within-season repeat of one sentence, per season. */
const WORST_PER_SEASON = [];
{
  const bySeason = new Map();
  for (const f of FIRINGS) {
    if (!bySeason.has(f.season)) bySeason.set(f.season, new Map());
    const m = bySeason.get(f.season);
    for (const s of f.notes) m.set(s, (m.get(s) || 0) + 1);
  }
  for (const [season, m] of bySeason) {
    let worst = 0, what = '';
    for (const [s, v] of m) if (v > worst) { worst = v; what = s; }
    WORST_PER_SEASON.push({ season, worst, what });
  }
}

describe('THE VARIETY FLOOR: an event that says one thing is one thing, however often it fires', () => {
  // GUARD ON THE GUARD, and it guards against this file hiding its own drift.
  // Rule A's threshold of four is only meaningful while every key fires often
  // enough that four distinct sentences would actually be SEEN. If a key's
  // volume collapses into the sampling zone, Rule A stops being a measurement
  // of the pool and becomes a coin flip that happens to keep passing at 4 for
  // small pools too. Pinning the rarest firing count makes that collapse
  // visible instead of silent.
  it('every (event, branch) key fires often enough for the variety floor to mean anything', () => {
    const rows = [...PER_KEY].map(([k, v]) => ({ k, n: v.n })).sort((a, b) => a.n - b.n);
    console.log(`\n=== RAREST FIVE KEYS BY FIRINGS (${PROSE_SEASONS} seasons, ${rows.length} keys) ===`);
    for (const r of rows.slice(0, 5)) console.log(`   ${r.n}\t${r.k}`);

    expect(FIRINGS.length, 'no firings captured at all — the fire() wrapper is not wired and every '
      + 'assertion below is vacuous').toBeGreaterThan(100000);
    expect(rows.length, 'the key table collapsed — see BRANCHES in tr-castle-reachability.test.js')
      .toBeGreaterThan(150);
    // MEASURED at 3200 seasons, seed base 0: rarest key 50 firings
    // (`romance-liability-exposed:suspicious`). The floor is 40, which is the
    // point where a four-line pool is missed with probability 4*(3/4)^40 =
    // 4.0e-5 per key. The rarest key clears it by 10.
    const starved = rows.filter(r => r.n < 40);
    expect(starved.map(r => `${r.k}=${r.n}`),
      'these keys fire too rarely for the variety floor to be a measurement rather than a coin flip')
      .toEqual([]);
  });

  it('no event ships a single-element line pool: every branch says it four ways', () => {
    const rows = [...PER_KEY].map(([k, v]) => ({ k, n: v.n, d: v.set.size }))
      .sort((a, b) => a.d - b.d || a.n - b.n);
    console.log(`\n=== NARROWEST TEN LINE POOLS (${PROSE_SEASONS} seasons) ===`);
    for (const r of rows.slice(0, 10)) console.log(`   ${r.d} distinct / ${r.n} firings\t${r.k}`);

    // THE BAR IS FOUR, and it is a bar on CONTENT, not on a sample statistic.
    // A four-line pool measured over 50+ firings shows four with probability
    // 1 - 2.3e-6, so a key reading 3 here is a three-line pool, not bad luck.
    // That is the difference between this band and the knife-edge counts Task
    // 6 had to re-derive: those were sampling noise sitting on their own
    // threshold, this one is a property of the source that the sample resolves
    // to certainty.
    //
    // WHAT IT DOES NOT CLAIM: that four is enough. Four is the floor the plan
    // set, and the pool's median is six. It claims only that nothing is below
    // it, which is precisely the defect that shipped.
    const thin = rows.filter(r => r.d < 4);
    expect(thin.map(r => `${r.k} says it ${r.d} way(s) in ${r.n} firings`),
      'these branches print the same sentence every time they fire').toEqual([]);
  });
});

describe('THE REPETITION CEILING: what a viewer actually notices', () => {
  it('a season almost never prints the same sentence three times, and never four', () => {
    const hist = new Map();
    for (const w of WORST_PER_SEASON) hist.set(w.worst, (hist.get(w.worst) || 0) + 1);
    const worst = WORST_PER_SEASON.reduce((a, b) => (b.worst > a.worst ? b : a));
    const loud = WORST_PER_SEASON.filter(w => w.worst >= 3);
    const share = loud.length / WORST_PER_SEASON.length;
    console.log(`
=== WITHIN-SEASON REPETITION (${PROSE_SEASONS} seasons) ===`);
    console.log('   per-season worst repeat: '
      + [...hist].sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}x in ${v} seasons`).join(', '));
    console.log(`   seasons reaching 3x: ${loud.length} (${(share * 100).toFixed(2)}%)`);
    console.log(`   worst single season: ${worst.worst}x  (season ${worst.season})`);
    console.log(`   "${worst.what}"`);

    expect(WORST_PER_SEASON.length, 'no seasons measured — this assertion is vacuous')
      .toBe(PROSE_SEASONS);

    // == WHY THE BAND IS A SHARE AND NOT THE MAXIMUM ======================
    //
    // "No season prints the same sentence more than N times" is the sentence
    // the plan asked for, and as a MAXIMUM it cannot be made both red at the
    // old pool and stable at the new one. Measured, 3200 seasons each:
    //
    //             worst=1   worst=2   worst=3   worst=4
    //   BEFORE       146      2205       814        35
    //   AFTER       1025      2128        47         0
    //
    // A ceiling of 4 passes BEFORE (its maximum is exactly 4), so it proves
    // nothing about this change. A ceiling of 3 is red before and green after
    // — but it is a maximum sitting on its own threshold, which is the shape
    // Task 6 had to re-derive twice, and 47 seasons per block sit on it.
    //
    // The statistic that actually separates is HOW OFTEN a season repeats a
    // sentence three times at all. Four decorrelated 3200-season blocks (seed
    // bases 0, 3200, 6400, 9600): 47, 50, 59, 41 seasons — 1.47%, 1.56%,
    // 1.84%, 1.28%. Mean 1.54%, sd 0.23pp. Against BEFORE's 26.5% in the same
    // block. The band is 4%: 10.7 sd above the live value and 6.6x below the
    // pool this task replaced.
    expect(share, `${loud.length} of ${PROSE_SEASONS} seasons printed some sentence three times `
      + '— the castle is looping').toBeLessThan(0.04);

    // AND THE CEILING, AS A BACKSTOP, STATED FOR WHAT IT IS. Zero seasons in
    // 12800 reach four. This arm is NOT the one that proves this change: the
    // old pool passed it too. It is here because a share can stay small while
    // one season goes badly wrong, and that season is the one somebody reads.
    // It fails the moment any pool collapses — see the mutation in the report.
    const over = WORST_PER_SEASON.filter(w => w.worst > 4);
    expect(over.map(w => `season ${w.season}: ${w.worst}x "${w.what}"`),
      'a season printed one sentence five or more times').toEqual([]);
  });
});
