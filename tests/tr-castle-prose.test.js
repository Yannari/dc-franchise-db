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
import { rpBuildCastleDay, castleDayScenes } from '../js/vp-tr/castle-day.js';
import { screenNarration } from '../js/vp-tr/screens.js';
import { _vpTextLines } from '../js/text-backlog.js';

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
// FOUR THOUSAND TWO HUNDRED, RAISED FROM 3,200 BY TASK 8 AND NOT BY MOVING
// THE FLOOR. The murder-variant catalogue (spec 7.4) ends seasons sooner --
// `name-your-own` kills a Traitor and the loop exits when the pact runs out,
// `double` empties two chairs a night -- so every castle key fires slightly
// less often per season and the rarest family in the pool,
// `romance-liability-exposed`, fell from 44/48/54 firings to 35/41/47. The
// floor of 40 below is a STATISTICAL requirement about how many firings it
// takes before a four-line pool would reliably be seen; it is not a property
// of the castle to be preserved, and the honest response to fewer firings per
// season is more seasons, never a smaller number in the assertion. 4,200
// restores the rarest key to 51.
const PROSE_SEASONS = 4200;

/** The first sentence of a note — the part a line pool owns. See the header. */
function lead(note) { return String(note || '').split(/(?<=[.!?])[ ]/)[0]; }

/** A note minus any citation appended to it — see `citeMoments` in threads.js. */
function authored(note) {
  return String(note || '').split(/It went back to day |It had been going on since day |It did not stop there: /)[0];
}

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
    const raw = [];
    for (const t of (gs?.tr?.threads || [])) {
      for (const b of t.beats) if (!before.has(b) && b.note) { notes.push(mask(lead(b.note))); raw.push(String(b.note)); }
    }
    // The season facts a printed number is allowed to be about, sampled at the
    // moment the sentence was written. See THE NUMBER RULE below.
    const rounds = gs?.tr?.rounds || [];
    const truth = {
      ep: ctx.ep,
      living: (gs?.activePlayers || []).length,
      cast: Object.keys(gs?.tr?.alignment || {}).length,
      banished: rounds.filter(r => r.banished).length,
    };
    truth.lost = Math.max(0, truth.cast - truth.living);
    truth.murders = Math.max(0, truth.lost - truth.banished);
    FIRINGS.push({ season: _season, key: `${ev.id}:${res?.branch ?? '(none)'}`, notes, raw, truth });
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

describe('THE SILENCE FLOOR: a scene that prints nothing is not a scene', () => {
  // WHY THIS EXISTS, AND WHY THE TWO RULES ABOVE COULD NOT SEE IT (whole-plan
  // review, F5). Both of them key on the sentences a firing WROTE. A firing
  // that writes none contributes zero sentences and still increments its own
  // firing count, so a branch that is silent 86% of the time passed the
  // variety floor on the 14% that spoke, and passed the repetition ceiling
  // because absence is not repetition. Nothing counted absence.
  //
  // What it was hiding: four events computed a line, called `closeThread`
  // (which writes no beat and no residue) and threw the sentence away — so the
  // PAYOFF SCENE of a story the castle had been telling printed nothing at
  // all. Measured before the fix, per 400 seasons:
  //
  //     susp-private-accusation:denies      53/62 silent  (86%)
  //     susp-private-accusation:confess     45/58 silent  (78%)
  //     testing-decoy-secret:keptQuiet      15/72 silent  (21%)
  //     testing-decoy-secret:caughtTest      8/39 silent  (21%)
  //     callback-history-confrontation:buries 24/122 silent (20%)
  //     testing-decoy-secret:malicious       6/45 silent  (13%)
  //
  // Task 8 had found the identical defect in `romance-liability-exposed:
  // exposes` and fixed that one event. This is the rule that makes the class
  // visible, which is the lesson Task 4 wrote into the plan.
  it('every firing of every event writes at least one thread beat', () => {
    const per = new Map();
    for (const f of FIRINGS) {
      if (!per.has(f.key)) per.set(f.key, { n: 0, silent: 0 });
      const e = per.get(f.key);
      e.n++;
      if (!f.notes.length) e.silent++;
    }
    const rows = [...per].map(([k, v]) => ({ k, ...v })).filter(r => r.silent)
      .sort((a, b) => b.silent / b.n - a.silent / a.n);
    console.log(`
=== SILENT FIRINGS (${PROSE_SEASONS} seasons, ${per.size} keys) ===`);
    for (const r of rows.slice(0, 10)) console.log(`   ${(100 * r.silent / r.n).toFixed(1)}%	${r.silent}/${r.n}	${r.k}`);
    if (!rows.length) console.log('   none');

    expect(FIRINGS.length, 'no firings captured — this assertion is vacuous').toBeGreaterThan(100000);
    // ZERO, NOT A SHARE, and that is deliberate. A branch is either wired to
    // write its sentence or it is not; the shares above are the share of
    // firings that took the unwired path, not sampling noise. If a legitimate
    // silent branch is ever authored, it belongs in this comment with its
    // reason, not under a loosened threshold.
    expect(rows.map(r => `${r.k}: ${r.silent}/${r.n} firings printed nothing`),
      'these branches computed a scene and wrote no sentence — the payoff prints nothing')
      .toEqual([]);
  });
});

describe('THE NUMBER RULE: a printed count must be true of the season it is printed in', () => {
  // WHOLE-PLAN REVIEW, F1: there was no assertion anywhere on a number a
  // castle event prints. `grief-nobody-sleeps` summed `gs.tr.rounds` to count
  // the empty beds, and night one's murder deliberately leaves no round
  // record — so the count was short by at least one on 363 of 363 firings
  // across 200 seasons. The viewer read "2 empty beds, so far" on a night
  // with three in it.
  //
  // A RULE OVER THE POOL, NOT A CHECK ON THAT EVENT. Any digit a castle
  // sentence prints must equal a fact the season state can justify at the
  // moment it was written: how many are gone, how many are left, how many
  // were murdered, how many were banished, how many started — or an episode
  // number that has already happened, which is what Task 2's citations print
  // ("It went back to day 3"). A number that matches none of those is either
  // wrong or is a fact this rule has never heard of, and both need a human.
  it('every number in every castle sentence is a fact about that season', () => {
    const bad = new Map();
    let checked = 0;
    for (const f of FIRINGS) {
      const t = f.truth;
      const ok = new Set([t.living, t.lost, t.murders, t.banished, t.cast]);
      for (let e = 1; e <= t.ep; e++) ok.add(e);
      for (const note of f.raw) {
        // THE AUTHORED PART ONLY, and this is what makes the rule sharp rather
        // than vacuous. A note may carry a citation appended to it, and a
        // citation QUOTES an earlier note verbatim — "seventeen of us" was
        // true on day 1 and is not a claim about today. Admitting every
        // historically-true value to the allowed set instead would have let
        // F1's own defect through, because a count short by one is exactly a
        // count that was true one round ago.
        //
        // The cut is at the citation's two openers (threads.js `citeMoments`)
        // and NOT at the end of the first sentence, which is the other obvious
        // way to write this and is wrong: `grief-nobody-sleeps` prints its
        // count in a SECOND sentence ("... 3 empty beds, so far."), so a
        // lead-only rule was green against the very defect it was written for.
        // Verified by running the mutation, not by reading the code.
        for (const m of authored(note).match(/\d+/g) || []) {
          checked++;
          if (ok.has(Number(m))) continue;
          const k = `${f.key} printed ${m} (living ${t.living}, lost ${t.lost}, `
            + `murdered ${t.murders}, banished ${t.banished}, ep ${t.ep})`;
          if (!bad.has(k)) bad.set(k, 0);
          bad.set(k, bad.get(k) + 1);
        }
      }
    }
    console.log(`
=== NUMBERS CHECKED (${PROSE_SEASONS} seasons) === ${checked}`);
    expect(checked, 'no numbers were printed at all — this assertion is vacuous')
      .toBeGreaterThan(1000);
    expect([...bad].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} x${v}`),
      'these sentences printed a number the season state cannot justify').toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════
// PLAN 10 TASK 6 — THE CASTLE DAY IS AN EDITED EPISODE, NOT A STATE REPORT
// ══════════════════════════════════════════════════════════════════════
//
// Everything above measures the ENGINE's sentence pools. These arms measure
// what the SCREEN makes of them, which is a different failure surface and had
// no guard at all: the screen used to print an internal category label above
// every card ("Suspicion — Cast on"), a sidebar called The Loom whose rows
// said "opened today", and one card per scene carrying one sentence. A viewer
// reading that is reading a state report with a serif font on it.
//
// FOUR RULES, and each one is a shape rather than a list of known cases:
//
//   A. NO ENGINE VOCABULARY ON THE PAGE. `cover`, `thread`, `heat`,
//      `opened today` and `The Loom` are the debug words scene-api.js names
//      in its own header, and a screen that prints one of them is showing the
//      machine instead of the show.
//   B. EVERY SCENE IS A COMPLETE SCENE. The audience stream of a scene must
//      carry all four beat kinds — establish, action, reaction, consequence —
//      because a card that says a thing happened and never says what it cost
//      is the disconnected-event shape the whole plan is written against.
//   C. THE FILTERED STREAMS ARE AUTHORED, NOT HIDDEN. A watcher who was not
//      in the room gets a SHORTER, DIFFERENT stream, composed before any
//      markup exists — not the same prose behind a CSS class.
//   D. WHAT THE COMPOSER WRITES IS WHAT THE SCREEN PRINTS, and what the
//      transcript prints. Three copies of the day that can drift apart is the
//      shape js/vp-tr/screens.js exists to prevent, one level down.
//
// The seasons above leave `gs` holding the last one played, so this block
// plays its own and snapshots the rows. It runs AFTER the module-level
// statistics above are computed, so the extra firings it produces cannot
// reach them.
setPlayers(ROSTER);
seedFranchiseHistory(CAST);
playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 20260901 });
const TASK6_ROWS = (gs.episodeHistory || []).map(e => ({ ...e }))
  .filter(e => e.tr && e.tr.castle && (e.tr.castle.scenes || []).length);

/** Every composed scene of every day, as the screen composed it. */
function allScenes(ep) {
  return castleDayScenes(ep, 'audience');
}

describe('THE CASTLE DAY READS AS TELEVISION', () => {
  it('has days to read at all', () => {
    expect(TASK6_ROWS.length, 'the season recorded no castle day — every arm below is vacuous')
      .toBeGreaterThan(4);
    expect(TASK6_ROWS.reduce((n, e) => n + allScenes(e).length, 0),
      'no scene was composed').toBeGreaterThan(20);
  });

  it('never presents engine vocabulary as story', () => {
    let checked = 0;
    for (const ep of TASK6_ROWS) {
      // THE WORDS, NOT THE MARKUP. `screenNarration` takes the furniture out
      // and `_vpTextLines` takes the stylesheet and the tags out; a scan of the
      // raw string is a scan of 20KB of CSS, where `--dy-thread` is a variable
      // name and not something the castle said.
      const text = _vpTextLines(screenNarration(rpBuildCastleDay(ep, 'audience'))).join('\n');
      expect(text.length, 'the day rendered nothing').toBeGreaterThan(400);
      expect(text).not.toMatch(/\b(?:cover|thread|heat|opened today|the loom)\b/i);
      checked++;
    }
    expect(checked, 'no day was scanned').toBeGreaterThan(4);
    // GUARD ON THE GUARD: the matcher has to be able to match.
    expect(/\b(?:cover|thread|heat|opened today|the loom)\b/i.test('Cover — Something starts'))
      .toBe(true);
  });

  it('every scene establishes action and consequence', () => {
    let checked = 0;
    for (const ep of TASK6_ROWS) {
      for (const scene of allScenes(ep)) {
        expect(scene.observerText.audience.map(x => x.kind))
          .toEqual(expect.arrayContaining(['establish', 'action', 'reaction', 'consequence']));
        checked++;
      }
    }
    expect(checked, 'no scene was checked').toBeGreaterThan(20);
  });

  it('and an audience scene is four or five cards, never one', () => {
    const sizes = new Set();
    let checked = 0;
    for (const ep of TASK6_ROWS) {
      for (const scene of allScenes(ep)) {
        const n = scene.observerText.audience.length;
        expect(n, scene.id + ' is ' + n + ' cards').toBeGreaterThanOrEqual(4);
        expect(n, scene.id + ' is ' + n + ' cards').toBeLessThanOrEqual(5);
        sizes.add(n);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(20);
    expect(sizes.size, 'every scene is exactly the same length — nothing varies').toBeGreaterThan(1);
  });

  it('gives every scene a natural time-and-place heading and no category label', () => {
    let checked = 0;
    for (const ep of TASK6_ROWS) {
      for (const scene of allScenes(ep)) {
        expect(scene.heading, scene.id + ' has no heading').toMatch(/^[A-Z][^·]+ · [A-Z].+$/);
        expect(scene.heading.toLowerCase())
          .not.toMatch(/suspicion|testing|callback|romance|grief|trust|journey/);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(20);
  });

  it('names people instead of claiming the castle agrees', () => {
    // The evidence-for-consensus contract: a screen-composed sentence may not
    // say `everyone`/`the whole castle`/`the group agrees` without a public
    // ballot behind it, and this screen renders no ballot. The engine's own
    // authored `action` sentence is not this screen's to rewrite, so the rule
    // is applied to the beats the SCREEN composes, which is where it belongs.
    const BANNED = /\b(everyone|the whole castle|the group agrees|the castle turns|nobody trusts|the whole room)\b/i;
    let checked = 0;
    for (const ep of TASK6_ROWS) {
      for (const scene of allScenes(ep)) {
        for (const beat of scene.observerText.audience) {
          if (beat.kind === 'action') continue;
          expect(beat.text, scene.id + '/' + beat.kind + ': ' + beat.text).not.toMatch(BANNED);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(60);
    expect(BANNED.test('Everyone turns against Manu after the mission.')).toBe(true);
  });

  it('composes the filtered stream separately instead of hiding the full one', () => {
    let compared = 0;
    for (const ep of TASK6_ROWS) {
      for (const scene of allScenes(ep)) {
        const pub = scene.observerText.public;
        expect(Array.isArray(pub), scene.id + ' has no public stream').toBe(true);
        expect(pub.length, scene.id + ': the public stream is as long as the audience stream')
          .toBeLessThan(scene.observerText.audience.length);
        expect(pub.length).toBeGreaterThanOrEqual(2);
        // and it is not the same words with a class on it
        const a = scene.observerText.audience.map(b => b.text).join(' ');
        for (const b of pub) {
          if (b.kind === 'establish') continue;
          expect(a.includes(b.text), scene.id + ': the public stream reuses the audience ' + b.kind)
            .toBe(false);
        }
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(20);
  });

  it('and every card the screen composes says something concrete', () => {
    // The "incomplete because the label was removed" failure: a sentence that
    // is under about forty characters is a fragment that used to lean on a
    // heading for its meaning.
    let checked = 0;
    for (const ep of TASK6_ROWS) {
      for (const scene of allScenes(ep)) {
        for (const beat of scene.observerText.audience) {
          expect(beat.text.length,
            scene.id + '/' + beat.kind + ' is a fragment: "' + beat.text + '"')
            .toBeGreaterThan(38);
          expect(/[.!?"”']$/.test(beat.text.trim()),
            scene.id + '/' + beat.kind + ' does not finish a sentence: "' + beat.text + '"')
            .toBe(true);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(80);
  });

  it('draws the overflow part of the day, marked, instead of dropping it', () => {
    // TASK 5'S OVERFLOW BUCKET, ON A CONSTRUCTED ROW, AND IT SAYS SO.
    // `castlePhaseRecord` appends an `unmapped:<window>` part for a scene whose
    // hour the running order has never heard of, so nothing can vanish in
    // silence. No played season reaches it — all seven windows map — so this is
    // proof the branch RENDERS and is marked, not proof a viewer will see it.
    const real = TASK6_ROWS.find(e => e.tr.castle.scenes.length > 3);
    expect(real, 'no day had enough scenes to build the case on').toBeTruthy();
    const c = real.tr.castle;
    const last = c.scenes[c.scenes.length - 1];
    const odd = { ...last, window: 'some-future-window' };
    const row = { ...real, tr: { ...real.tr, castle: { ...c,
      scenes: [...c.scenes.slice(0, -1), odd],
      phases: [
        ...c.phases.map(ph => ({ ...ph, scenes: ph.scenes.filter(x => x !== last) })),
        { id: 'unmapped:some-future-window',
          label: 'Unmapped window: some-future-window', scenes: [odd] },
      ] } } };
    const html = rpBuildCastleDay(row, 'audience');
    expect(html, 'the overflow part was drawn as ordinary programming')
      .toContain('Outside the running order');
    expect(html).toContain('some-future-window');
    const scenes = castleDayScenes(row, 'audience');
    expect(scenes.length, 'a scene was dropped on the way to the screen')
      .toBe(c.scenes.length);
    expect(scenes.some(x => x.phase === 'unmapped:some-future-window'),
      'the composed record lost which part of the day it came from').toBe(true);
  });

  it('and the transcript retranscribes the screen exactly', () => {
    let checked = 0;
    for (const ep of TASK6_ROWS) {
      const shown = _vpTextLines(screenNarration(rpBuildCastleDay(ep, 'audience')));
      for (const scene of allScenes(ep)) {
        for (const beat of scene.observerText.audience) {
          const want = beat.text.replace(/\s+/g, ' ').trim().slice(0, 44);
          expect(shown.some(l => l.includes(want)),
            'the screen never printed ' + scene.id + '/' + beat.kind + ': "' + want + '"')
            .toBe(true);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(80);
  });
});
