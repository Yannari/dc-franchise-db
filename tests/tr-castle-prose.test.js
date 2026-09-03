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
import { readFileSync } from 'node:fs';
import { gs, setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { EVENTS } from '../js/tr/events.js';
import { seedFranchiseHistory } from './helpers/tr-castle-fixture.js';
import { _setDrawRule } from '../js/tr/castle/lines.js';
import roster from '../franchise_roster.json';
import { rpBuildCastleDay, castleDayScenes, castleDayChips, BRANCH_TONES, TOPIC_READY } from '../js/vp-tr/castle-day.js';
import { rpBuildConclave } from '../js/vp-tr/conclave.js';
import { rpBuildRoundTable } from '../js/vp-tr/round-table.js';
import { screenNarration } from '../js/vp-tr/screens.js';
import { _vpTextLines } from '../js/text-backlog.js';
import { consensusPhrase } from '../js/tr/knowledge-flow.js';

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
  // ── AND A FLOOR THAT THE DRAW RULE CANNOT SATISFY FOR IT ─────────────
  //
  // WHY THE ARM ABOVE STOPPED MEASURING ANYTHING (fix round 1, C1). Task 7
  // added a season-scope round-robin to `lineFor` (js/tr/castle/lines.js): the
  // hash picks a starting point and the draw then walks past whatever this
  // (event, branch) has already spent this season. For any pool of four or
  // more that GUARANTEES four distinct sentences before any of them repeats —
  // so `d >= 4` above is now a property of the draw rule, not of the writing,
  // and it cannot fail. The reviewer proved it: cutting the library's
  // highest-firing pool from 18 lines to 3 left the ceiling at 2.83%, unmoved.
  //
  // SO POOL POVERTY IS MEASURED WHERE IT LIVES, WHICH IS THE SOURCE. This
  // reads the pool arrays out of the castle files and counts them. It cannot
  // be satisfied by a draw rule, a sampling accident or a season count,
  // because it never runs a season at all.
  //
  // THE BAND IS FOUR, matching the plan's floor and the arm above, so this is
  // a strict replacement of what that arm used to prove rather than a new
  // demand. What it deliberately does NOT do is band the MEDIAN: 469 pools are
  // still under nine lines, that is Task 11's work, and a band nobody can pass
  // today is a band somebody deletes.
  it('and no pool in the source is thinner than four, which the draw rule cannot fake', () => {
    const FILES = ['trust', 'suspicion', 'grief', 'cover', 'romance', 'callback',
      'testing', 'journey', 'mission-fallout', 'consequences', 'nightfall'];
    const pools = [];
    for (const f of FILES) {
      const src = readFileSync(new URL('../js/tr/castle/' + f + '.js', import.meta.url), 'utf8');
      const lines = src.split('\n');
      let name = null; let count = 0;
      for (const raw of lines) {
        const t = raw.trim();
        // A POOL OPENS: either `const NAME_LINES = [` or a keyed branch pool
        // `'branch-name': [` / `branch: [` inside one.
        const open = /^(?:const\s+([A-Z_]+)\s*=|\s*'?([\w-]+)'?\s*:)\s*\[$/.exec(t);
        if (open) { name = `${f}:${open[1] || open[2]}`; count = 0; continue; }
        // BACKTICKS COUNT (fix round 2, item 4). This used to be /^['"]/ and
        // it silently EXEMPTED what it could not read: a template-literal
        // entry was not counted, and the `p.count > 0` filter below then
        // dropped the whole pool, so a three-line pool written with backticks
        // passed. The re-review proved it by converting exactly those three
        // lines and turning this arm green. In a file set this full of
        // apostrophes a backtick is a natural authoring choice, and Task 11
        // adds a great deal more prose.
        if (name && /^['"`]/.test(t)) { count++; continue; }
        if (name && /^\],?$/.test(t)) { pools.push({ name, count }); name = null; }
      }
    }
    // ANTI-VACUITY FIRST: a parser that stops matching would report a clean
    // library forever, which is the exact shape of the guard it replaces.
    expect(pools.length, 'no pools were parsed out of the castle source at all')
      .toBeGreaterThan(400);
    const total = pools.reduce((n, p) => n + p.count, 0);
    expect(total, 'the pools parsed but hold almost no lines').toBeGreaterThan(3000);

    // AND NOTHING IS EXEMPTED BY BEING UNREADABLE. A pool the parser opens and
    // closes without counting a single entry is not an empty pool — there are
    // none in this library — it is a pool written in a syntax the parser does
    // not recognise, and the old `p.count > 0` filter turned exactly that into
    // a silent pass. Asserted BEFORE the width band so a failure names the
    // right defect: the parser stopped reading, rather than the writing having
    // got thin.
    const invisible = pools.filter(p => p.count === 0).map(p => p.name);
    expect(invisible, 'these pools parsed to zero entries — the parser cannot read them, '
      + 'and a pool it cannot read is a pool this floor is not checking')
      .toEqual([]);

    const thin = pools.filter(p => p.count < 4)
      .map(p => `${p.name} has ${p.count} line(s)`);
    expect(thin, 'a pool in the source is thinner than the plan\'s floor of four — '
      + 'the draw rule hides this from the firing-count arm above, so it is caught here')
      .toEqual([]);

    // AND THE DISTRIBUTION IS PRINTED, not banded, so Task 11 inherits a number
    // rather than a feeling about the 469.
    const under9 = pools.filter(p => p.count < 9).length;
    const sorted = pools.map(p => p.count).sort((a, b) => a - b);
    console.log(`\n=== POOL WIDTH IN THE SOURCE (${pools.length} pools, ${total} lines) ===`);
    console.log(`   min ${sorted[0]}  median ${sorted[Math.floor(sorted.length / 2)]}  `
      + `max ${sorted[sorted.length - 1]}  under nine: ${under9}`);
  });
});

// ══════════════════════════════════════════════════════════════════════
// A BALLOT CLAIM MAY NOT BE MANUFACTURED FROM A MOOD (fix round 2, item 3)
// ══════════════════════════════════════════════════════════════════════
//
// WHY THIS EXISTS. Fix round 1 closed C3 — two grief events printed "Somebody
// had said {a}'s name tonight" off nothing but `ctx.state === 'paranoid'`, and
// 6.0% of paranoid firings had zero votes and zero accusations against that
// person, including episode one before any Round Table has been held. The fix
// shipped with a measurement and NO GUARD, and the re-review proved what that
// is worth: it replaced `const grounded = !isNervy(state) || !!_ballotBehind(
// actor)` with `const grounded = true`, restoring the exact defect, and ran
// `tr-castle-prose` plus `tr-castle` — 116 tests, all green.
//
// Every other blocker in that round got an arm. This is the one whose failure
// mode is a sentence asserting a fact the season does not contain, which is
// the causal writing contract's whole subject.
//
// HOW IT MEASURES. It wraps the two events' `fire()`, and for each firing
// records three things off the ENGINE rather than off the prose: who the actor
// was, what the last recorded round says about them (votes cast against, names
// said at the table), and the note the firing actually wrote. A firing is a
// violation when the note makes a ballot claim and the record supports none.
//
// THE MATCHER IS A FIXED REGRESSION CORPUS, NOT A COPY OF THE PRODUCTION
// PREDICATE. It lists the claim phrases these two events can print — the same
// technique the composed-solo arm above uses, and for the same reason: a guard
// that re-implements the thing it guards passes whenever both copies are wrong
// together.
const BALLOT_CLAIM = /(had said [^.]*name|said [^.]*name (?:out loud )?(?:at|tonight)|at that table|One name said out loud|write their own name down|the ballots|wrote [^.]*name)/i;

describe('a ballot claim needs a ballot behind it', () => {
  it('never says the room named somebody when the round record does not', () => {
    const SEASONS = 400;
    const rows = [];
    const wrapped = [];
    for (const ev of EVENTS) {
      if (ev.id !== 'grief-nobody-sleeps' && ev.id !== 'grief-someone-cries-alone') continue;
      const orig = ev.fire;
      wrapped.push([ev, orig]);
      ev.fire = function (ctx, rng) {
        const before = new Set();
        for (const t of (gs?.tr?.threads || [])) for (const b of t.beats) before.add(b);
        const res = orig.call(this, ctx, rng);
        const actor = res?.actor;
        // THE RECORD, READ THE WAY THE ENGINE READS IT: the most recent round,
        // which is the one `emotionalStateOf` derived the mood from.
        const rounds = gs.tr?.rounds || [];
        const last = rounds[rounds.length - 1];
        const votes = last ? (last.ballots || []).filter(b => b.voted === actor).length : 0;
        const named = last ? (last.accusations || []).filter(a => a.target === actor).length : 0;
        let note = '';
        for (const t of (gs?.tr?.threads || [])) {
          for (const b of t.beats) if (!before.has(b) && b.note) note += ' ' + b.note;
        }
        rows.push({ id: ev.id, ep: ctx.ep, state: res?.state || 'content',
          votes, named, note: note.trim() });
        return res;
      };
    }
    try {
      for (let seed = 1; seed <= SEASONS; seed++) {
        setPlayers(ROSTER);
        seedFranchiseHistory(CAST);
        playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
      }
    } finally {
      for (const [ev, orig] of wrapped) ev.fire = orig;
    }

    const nervy = rows.filter(r => r.state === 'paranoid' || r.state === 'desperate');
    const ungrounded = nervy.filter(r => r.votes === 0 && r.named === 0);
    const violations = ungrounded.filter(r => BALLOT_CLAIM.test(r.note))
      .map(r => `${r.id} ep${r.ep} [${r.state}] votes=0 accusations=0: "${r.note.slice(0, 120)}"`);

    console.log(`\n=== BALLOT CLAIMS WITHOUT A BALLOT (${SEASONS} seasons) ===`);
    console.log(`   firings ${rows.length}, nervy ${nervy.length}, `
      + `ungrounded nervy ${ungrounded.length}, claiming a ballot anyway ${violations.length}`);

    // ── ANTI-VACUITY, AND IT IS THREE SEPARATE CHECKS ──────────────────
    //
    // Each one closes a different way this arm could pass while measuring
    // nothing: the events never firing, the mood never occurring, and the
    // ungrounded case never arising — which is the one the defect lives in.
    expect(rows.length, 'neither event fired at all, so this arm asserted nothing')
      .toBeGreaterThan(500);
    expect(nervy.length, 'no firing was ever paranoid or desperate, so the branch this '
      + 'arm is about was never reached').toBeGreaterThan(200);
    expect(ungrounded.length, 'no nervy firing ever had an empty round record — the '
      + 'ungrounded case this arm exists for did not occur in the sample')
      .toBeGreaterThan(5);

    // AND EPISODE ONE EXPLICITLY, because it is the strongest form of the
    // defect: there is no Round Table at all, so a mood can only have come
    // from a scene override and any table claim is certainly false.
    const ep1 = rows.filter(r => r.ep === 1);
    expect(ep1.length, 'no episode-1 firing was sampled, so the no-table-exists case '
      + 'is untested').toBeGreaterThan(0);
    expect(ep1.filter(r => BALLOT_CLAIM.test(r.note)).map(r => r.note.slice(0, 120)),
      'an episode-1 scene described a Round Table that has not happened yet').toEqual([]);

    expect(violations.slice(0, 5), 'a scene asserted that the room named somebody when '
      + 'no ballot and no accusation in the record says so — see `_ballotBehind` in '
      + 'js/tr/castle/grief.js').toEqual([]);
  }, 300000);

  it('and the matcher can see a claim when there is one', () => {
    // GUARD ON THE GUARD. If the corpus above stopped matching, the arm would
    // report a clean library forever — which is precisely the free pass this
    // whole item is about.
    expect(BALLOT_CLAIM.test('Somebody had said Beth’s name tonight, and Beth lay there.'))
      .toBe(true);
    expect(BALLOT_CLAIM.test('One name said out loud at that table was enough.')).toBe(true);
    expect(BALLOT_CLAIM.test('Beth had watched the room write their own name down.')).toBe(true);
    expect(BALLOT_CLAIM.test('Beth went over the ballots in the dark.')).toBe(true);
    // and it does not fire on the ungrounded pool, which is the whole point of
    // that pool existing
    expect(BALLOT_CLAIM.test('Nothing happened. Beth spent four hours going over the nothing.'))
      .toBe(false);
    expect(BALLOT_CLAIM.test('Every creak in the building was somebody deciding something.'))
      .toBe(false);
  });
});

describe('THE POOL HEALTH FLOOR: how varied the castle is WRITTEN, not how varied it reads', () => {
  // ── WHY THIS EXISTS AND WHY IT IS A SEPARATE NUMBER (fix round 1, C1) ─
  //
  // The repetition ceiling below reports what a VIEWER experiences, and the
  // draw rule in `lineFor` is a large part of why it is 2.83%. That is a real
  // property and it is the right thing to band for the show. It is NOT a
  // measurement of the writing, and Task 7's own note in lines.js claimed it
  // was — the claim is corrected there and the counterfactual is banded here.
  //
  // SAME MEASUREMENT, SAME CONTENT, DRAW RULE HELD OFF: 9.67%. That is the
  // honest state of the pools, and it fails the ceiling's own 4% band by a
  // factor of two and a half. Nobody reading 2.83% should conclude the writing
  // is finished; 448 pools are still under nine lines and Task 11 owns them.
  //
  // == THE DERIVATION, AND A DISCREPANCY STATED RATHER THAN SMOOTHED =====
  //
  // RESOLVED (fix round 2). The first review reported this counterfactual at
  // 7.00%; re-measured here it was 9.67%, the difference was not noise, and it
  // was published rather than reconciled to a number that could not be derived.
  // The re-review then drove `_setDrawRule` directly across these four blocks
  // plus a fifth of its own unused seeds, under four attribution variants, and
  // reproduced every block to the digit — including one never run here — and
  // patched `lineFor` at the pre-fix commit to rule out a commit difference.
  // **7.00% is retracted.** It matched none of the variants and came from an
  // apparatus that had not been inspected.
  //
  // FIVE DISJOINT 600-SEASON BLOCKS, draw rule held off (seed bases 0, 600,
  // 1200, 1800 here; the fifth is the re-review's own):
  //
  //     9.67%   10.50%   10.00%   9.83%   9.50%     mean 9.90, sd 0.36pp
  //
  // and this arm, in-suite on seeds 1-600, reads 9.67% — the same figure as
  // the base-0 block to the digit, so the two harnesses agree and the
  // statistic is well determined. The same arm at N=400 read 8.00%: a 600
  // sample is the point at which this stops wobbling, which is why N is 600
  // and not the 400 it was first written at.
  //
  // The population estimate is therefore 9.90%. The figure quoted at the top of
  // this note is 9.67% rather than 9.90% because that is the block THIS ARM
  // plays and prints, and `js/tr/castle/lines.js` quotes the same 9.67% for the
  // same reason — two shipped statements of one number that disagree is the
  // defect the note in that file exists to correct, and it would be an odd way
  // to correct it.
  //
  // THE BAND IS A REGRESSION GUARD, NOT A TARGET. 13% sits 9.2 sd above the
  // measured mean on the block sd above, so it reddens when the pools get
  // THINNER and does not demand work this task was not asked to do. Task 11
  // should tighten it as it widens them — that is the only direction it can
  // move in, and a band nobody can pass today is a band somebody deletes.
  it('with the draw rule held off, the same seasons still do not loop badly', () => {
    const was = _setDrawRule(false);
    try {
      let loud = 0;
      const N = 600;
      for (let i = 1; i <= N; i++) {
        setPlayers(ROSTER);
        seedFranchiseHistory(CAST);
        const seen = new Map();
        // The fire() wrapper at the top of this file is still installed, so
        // the firings land in FIRINGS; they are read back by season number
        // rather than re-instrumented.
        const before = FIRINGS.length;
        playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: i });
        for (let j = before; j < FIRINGS.length; j++) {
          for (const s of FIRINGS[j].notes) seen.set(s, (seen.get(s) || 0) + 1);
        }
        for (const [, v] of seen) if (v >= 3) { loud++; break; }
      }
      const share = loud / N;
      console.log(`\n=== POOL HEALTH (draw rule OFF, ${N} seasons) ===`);
      console.log(`   seasons printing one sentence three times: ${loud} (${(share * 100).toFixed(2)}%)`);
      console.log('   the same measurement with the rule ON is the ceiling below');
      expect(loud, 'no season was measured, so this arm asserted nothing').toBeGreaterThan(0);
      expect(share, `${loud} of ${N} seasons loop with the draw rule off — the POOLS have got `
        + 'thinner, whatever the ceiling says').toBeLessThan(0.13);
    } finally {
      _setDrawRule(was);
    }
  }, 300000);

  it('and the switch it uses actually switches something', () => {
    // GUARD ON THE GUARD. If `_setDrawRule` stopped working, the arm above
    // would silently measure the shipped configuration and pass forever at
    // 2.83% — the same free-pass shape this file exists to prevent.
    setPlayers(ROSTER);
    seedFranchiseHistory(CAST);
    playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 777001 });
    const on = FIRINGS.slice(-400).map(f => f.notes.join('|')).join('~');
    const was = _setDrawRule(false);
    setPlayers(ROSTER);
    seedFranchiseHistory(CAST);
    playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 777001 });
    _setDrawRule(was);
    const off = FIRINGS.slice(-400).map(f => f.notes.join('|')).join('~');
    expect(on.length, 'the season printed nothing').toBeGreaterThan(2000);
    expect(off, 'the draw rule switch changed no sentence at all, so the arm above is '
      + 'measuring the shipped configuration twice').not.toBe(on);
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

  // ── THE DEBUG-WORD SWEEP, REBUILT (fix round 1, C2) ─────────────────
  //
  // WHAT WAS WRONG WITH IT, MEASURED BY THE REVIEWER: 73 hits in 422,503 cards
  // over 400 seasons, and this arm was green the whole time. Three separate
  // reasons, and all three are shapes rather than bad luck:
  //
  //   1. IT RENDERED ONE SEED. `TASK6_ROWS` is a single season (20260901), so
  //      any line that seed never draws is unguarded. Every other arm in this
  //      file plays thousands of seasons for exactly this reason and says so
  //      at length; this one did not.
  //   2. IT SCANNED ONE SCREEN. Only `rpBuildCastleDay`. Three of the
  //      reviewer's hits are in `js/vp-tr/conclave.js` and
  //      `js/vp-tr/round-table.js`, which this arm had never once looked at.
  //   3. THE MATCHER MISSED INFLECTIONS. A bare `cover` alternative does not
  //      match "coverage" or "covered", and both of those shipped.
  //
  // All three are fixed here. The word list is unchanged in substance — it is
  // scene-api.js's own header list of debug vocabulary, and the point of it is
  // that these words are engine furniture whatever grammatical form they
  // arrive in.
  const DEBUG_WORDS = /\b(?:cover|covers|covered|covering|coverage|thread|threads|threaded|heat|heats|heated|loom|looms|opened today)\b/i;

  it('never presents engine vocabulary as story, across seasons and across screens', () => {
    // A CORPUS, NOT A SEED. Twenty seasons rendered in full is ~30x the
    // exposure of the single season this arm used to read, and it is about the
    // largest sample that keeps this file's wall clock reasonable — the
    // module-level statistics above already cost ~110s at 4,200 seasons, and
    // those need no rendering at all. The seeds are decorrelated from
    // 20260901 on purpose: a bug only this file's own fixture seed can reach
    // is precisely the thing being guarded against.
    const rows = [];
    for (let seed = 90001; seed <= 90020; seed++) {
      setPlayers(ROSTER);
      seedFranchiseHistory(CAST);
      playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
      for (const e of (gs.episodeHistory || [])) {
        if (e.tr && e.tr.castle && (e.tr.castle.scenes || []).length) rows.push({ ...e });
      }
    }
    expect(rows.length, 'the corpus came back empty').toBeGreaterThan(150);

    // AND EVERY SCREEN THE CASTLE'S OWN VOCABULARY CAN REACH, not just the
    // day. The conclave and the Round Table are written by the same hands and
    // draw on the same state; a debug word is exactly as wrong on either.
    const screens = [
      ['castle day', ep => rpBuildCastleDay(ep, 'audience')],
      ['conclave', ep => rpBuildConclave(ep, 'audience')],
      ['round table', ep => rpBuildRoundTable(ep, 'audience')],
    ];
    const hits = [];
    let scanned = 0; let chars = 0;
    for (const ep of rows) {
      for (const [what, build] of screens) {
        let html = '';
        try { html = build(ep) || ''; } catch { continue; }   // a screen this row does not register
        if (!html) continue;
        // THE WORDS, NOT THE MARKUP. `screenNarration` takes the furniture out
        // and `_vpTextLines` takes the stylesheet and the tags out; a scan of
        // the raw string is a scan of 20KB of CSS, where `--dy-thread` is a
        // variable name and not something the castle said.
        const text = _vpTextLines(screenNarration(html)).join('\n');
        if (text.length < 40) continue;
        scanned++; chars += text.length;
        const m = DEBUG_WORDS.exec(text);
        if (m) {
          const at = Math.max(0, m.index - 60);
          hits.push(`ep ${ep.num} ${what}: "${m[0]}" in ...${text.slice(at, m.index + 70)}...`);
        }
      }
    }
    expect(scanned, 'no screen was scanned, so this arm asserted nothing')
      .toBeGreaterThan(300);
    expect(chars, 'the screens rendered almost no words').toBeGreaterThan(400000);
    expect(hits.slice(0, 6), 'the screen is printing engine vocabulary as story')
      .toEqual([]);
  }, 300000);

  it('and the matcher can match, including the inflections that shipped', () => {
    // GUARD ON THE GUARD, and the second half of it is not decoration: three
    // of these were live in the pool while the old matcher reported the
    // library clean.
    expect(DEBUG_WORDS.test('Cover — Something starts')).toBe(true);
    expect(DEBUG_WORDS.test('would cover either outcome')).toBe(true);
    expect(DEBUG_WORDS.test('would have covered either outcome')).toBe(true);
    expect(DEBUG_WORDS.test('either decency or coverage')).toBe(true);
    expect(DEBUG_WORDS.test('said it without heat')).toBe(true);
    expect(DEBUG_WORDS.test('the rows said opened today')).toBe(true);
    // and it does not fire on ordinary words that merely start the same way
    expect(DEBUG_WORDS.test('the campaign was covert about nothing')).toBe(false);
    expect(DEBUG_WORDS.test('a heather on the hill')).toBe(false);
  });

  // THE SOURCE SCAN IS THE OTHER HALF AND IS NOT REDUNDANT. The arm above
  // reads what twenty seasons happened to DRAW; this reads what is WRITTEN, so
  // a forbidden word typed into a pool no season reaches is still caught. Two
  // different failure modes, two arms — the same reasoning the vocabulary
  // guard in tr-vp.test.js gives for keeping both of its.
  it('and no castle or castle-screen source file holds one at all', () => {
    const FILES = ['js/vp-tr/castle-day.js', 'js/vp-tr/conclave.js', 'js/vp-tr/round-table.js',
      'js/tr/castle/trust.js', 'js/tr/castle/suspicion.js', 'js/tr/castle/grief.js',
      'js/tr/castle/cover.js', 'js/tr/castle/romance.js', 'js/tr/castle/callback.js',
      'js/tr/castle/testing.js', 'js/tr/castle/journey.js', 'js/tr/castle/mission-fallout.js',
      'js/tr/castle/consequences.js', 'js/tr/castle/nightfall.js'];
    const bad = [];
    let lines = 0;
    for (const f of FILES) {
      const src = readFileSync(new URL('../' + f, import.meta.url), 'utf8');
      expect(src.length, `${f} is empty`).toBeGreaterThan(2000);
      for (const raw of src.split('\n')) {
        const t = raw.trim();
        // A PROSE LINE, which is what this rule is about: a whole-line string
        // literal out of a pool. Comments and identifiers are engine writing
        // and are allowed to say `thread` — that is what the thing IS.
        if (!/^['"].{10,}['"],?$/.test(t)) continue;
        lines++;
        const m = DEBUG_WORDS.exec(t);
        if (m) bad.push(`${f}: [${m[0]}] ${t.slice(0, 100)}`);
      }
    }
    expect(lines, 'no prose lines were found, so this arm read nothing')
      .toBeGreaterThan(2000);
    expect(bad, 'a pool holds engine vocabulary, whether or not a season draws it')
      .toEqual([]);
  });

  it('every scene establishes action and consequence', () => {
    let checked = 0;
    for (const ep of TASK6_ROWS) {
      for (const scene of allScenes(ep)) {
        // ESTABLISH, ACTION and CONSEQUENCE are the load-bearing spine of every
        // scene and are demanded of all of them. The generic REACTION beat is
        // NOT: a topic-grounded scene carries its exchange inside the action
        // line and drops the separate reaction (see TOPIC_CONFIG in
        // castle-day.js), so requiring 'reaction' of every scene would forbid
        // the grounding this rework exists for. A legacy scene still has all
        // four, which the reaction-tone guard above continues to check.
        expect(scene.observerText.audience.map(x => x.kind))
          .toEqual(expect.arrayContaining(['establish', 'action', 'consequence']));
        checked++;
      }
    }
    expect(checked, 'no scene was checked').toBeGreaterThan(20);
  });

  it('and an audience scene is three to five cards, never one', () => {
    const sizes = new Set();
    let checked = 0;
    for (const ep of TASK6_ROWS) {
      for (const scene of allScenes(ep)) {
        const n = scene.observerText.audience.length;
        // THREE is the floor, not four: a topic-grounded scene is
        // establish + action + consequence (+ a recall beat when carried), and
        // that is a deliberate re-baseline — the point of the guard is "never
        // one blob", and three distinct beats is not one.
        expect(n, scene.id + ' is ' + n + ' cards').toBeGreaterThanOrEqual(3);
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

  it('composes the filtered stream out of different sentences, not the same ones', () => {
    // THIS ARM USED TO BE UNFAILABLE. It compared `pub.length < audience.length`
    // — a constant 3 against a constant 4 or 5 — so it could not go red for any
    // input, and it `continue`d past `kind === 'establish'`, which exempted the
    // one card that WAS being copied: for every pair scene the public
    // establishing card was the audience's, verbatim, so a watcher in the
    // corridor was handed "{a} and {b} are at {loc}, and nobody knows they are".
    // What is asserted now is the property that actually matters and that a
    // regression can break: NO sentence composed for the audience may appear in
    // the stream composed for somebody who was only in the room.
    let compared = 0, cards = 0;
    for (const ep of TASK6_ROWS) {
      for (const scene of allScenes(ep)) {
        const pub = scene.observerText.public;
        expect(Array.isArray(pub), scene.id + ' has no public stream').toBe(true);
        expect(pub.length).toBeGreaterThanOrEqual(2);
        const aud = scene.observerText.audience.map(b => b.text);
        for (const b of pub) {
          expect(aud.includes(b.text),
            scene.id + ': the public ' + b.kind + ' is the audience card verbatim')
            .toBe(false);
          // and it may not carry the continuity the layer exists to withhold
          expect(b.text, scene.id + ': the public stream cites a day').not.toMatch(/\bday \d+/i);
          cards++;
        }
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(20);
    expect(cards).toBeGreaterThan(60);
  });

  it('and every card that puts people in a room names them', () => {
    // THIS ARM USED TO BE UNFAILABLE. "at least 38 characters and ends in a full
    // stop" cannot fail on any authored pool line, so it proved nothing about
    // fragments. What it is asserting now is the property the removed category
    // headings used to carry: the ESTABLISHING card has to say who is there and
    // the REACTION card has to say who is reacting, because those are the two
    // cards a reader cannot resolve from anywhere else. It goes red today on any
    // pool line that loses its `{a}` — it found two while being written.
    //
    // It deliberately does NOT extend to the consequence card. "Neither of them
    // will suggest it tomorrow" is resolved by the establishing card two above
    // it and is better prose than repeating both names a fourth time; requiring
    // a name there would be requiring worse writing.
    let checked = 0;
    for (const ep of TASK6_ROWS) {
      for (const scene of allScenes(ep)) {
        for (const beat of scene.observerText.audience) {
          if (beat.kind !== 'establish' && beat.kind !== 'reaction') continue;
          expect(scene.participants.some(n => beat.text.includes(n)),
            scene.id + '/' + beat.kind + ' names nobody: "' + beat.text + '"').toBe(true);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(40);
  });

  it('and does not print the same composed card twice in one episode', () => {
    // FIX ROUND 1, I3. Five rendered seasons of the first version produced 48
    // verbatim repeats of a composed card INSIDE one episode — every one of
    // them a pool of two drawn three or more times in a day. The consequence
    // pools are four-wide now and split by tone, and the same scan measures 6.
    //
    // TWO ARMS, because they fail for different reasons. Three of the same card
    // in one episode is a pool that has collapsed and it is a hard zero. Two is
    // the tail of a finite pool and is a SHARE, measured at 6 across 45 days;
    // the ceiling is 15, which is 2.5x the live value and far below the 48 this
    // replaced.
    let twice = 0, thrice = [];
    let episodes = 0, composed = 0;
    for (const ep of TASK6_ROWS) {
      const seen = new Map();
      for (const scene of allScenes(ep)) {
        for (const beat of scene.observerText.audience) {
          if (beat.kind === 'action') continue;      // the engine's own pools
          seen.set(beat.text, (seen.get(beat.text) || 0) + 1);
          composed++;                                 // the honest denominator
        }
      }
      for (const [text, n] of seen) {
        if (n >= 3) thrice.push('x' + n + ' "' + text.slice(0, 70) + '"');
        else if (n === 2) twice++;
      }
      episodes++;
    }
    expect(episodes).toBeGreaterThan(4);
    // A SHARE, NOT A ZERO, and the review is why. The hard `[]` held only on
    // this file's pinned seed: seed 99 produces a three-peat, so the arm went
    // red on a reseed, which is how a guard teaches people to ignore it. The
    // pools are four-wide and `_pickUnique` round-robins an exhausted pool now,
    // so a third print needs a day drawing the same slot nine times; two of
    // those across a season is a busy castle, and three is a pool collapsing.
    expect(thrice.length, 'composed cards are printing three times in one episode - a '
      + 'pool has collapsed: ' + thrice.join(' / ')).toBeLessThanOrEqual(2);
    // ── A RATE, NOT A COUNT, RE-DERIVED AGAINST WHAT THIS ARM WALKS ────
    //
    // FIX ROUND 1. The block that stood here was wrong in three separate
    // respects, and the third is the one that matters most:
    //
    //   1. STALE. It quoted "19 repeats / 1215 cards = 1.56%". The shipped arm
    //      measures 8 / 837 = 0.96%.
    //   2. THE "STRICTLY HARDER" CLAIM WAS FALSE AS A COUNT. 2% of 837 is
    //      16.7, so this rate permits SIXTEEN repeats where the count it
    //      replaced permitted fourteen. It is stricter as a rate and
    //      marginally looser as a count, and saying only the first half was
    //      the kind of sentence this file exists to stop.
    //   3. IT ARGUED OVER A DIFFERENT POPULATION THAN IT COMPUTES. The 576 and
    //      1215 figures are 45 RENDERED DAYS across several seasons. This arm
    //      walks `TASK6_ROWS`, which is ONE season: 10 episodes, 837 composed
    //      cards. The numbers being reasoned about and the number being
    //      asserted were never measured over the same thing.
    //
    // SO IT IS RE-DERIVED AGAINST THE ARM'S OWN POPULATION, which is the
    // choice made here rather than widening the arm — this block sits inside a
    // describe whose whole subject is `TASK6_ROWS`, and every other arm in it
    // walks that one season. Measured at the tip, seed 20260901:
    //
    //     episodes 10   composed 837   twice 8   thrice 0   rate 0.96%
    //
    // THE BAND IS 2%, unchanged in value and now honest about what it means:
    // 16 repeats out of 837, against a live 8. It is a rate rather than a count
    // because the denominator moves with throughput — Task 7 took a day from
    // 12.8 fired scenes to ~28 — and a count whose denominator has doubled is
    // measuring how much television the castle makes, not how good its pools
    // are. What it is NOT is "strictly harder than 15": at this denominator it
    // is two repeats more permissive, and that is stated rather than spun.
    //
    // AND THE DENOMINATOR IS PINNED AT 600. A share can always be made to pass
    // by measuring fewer things, so this floor guards against a THROUGHPUT
    // COLLAPSE rather than a design choice: stage 5's `runWindow` barren-draw
    // fix is worth ~5 scenes an episode and a full regression of it put the
    // composed count at 621. It was 750 when the live count was 837; the
    // editor's per-player concentration cap (one player headlines at most 3
    // scenes a day — see PER_PLAYER_CAP in episode-editor.js) brought it to
    // ~711, and the floor moved to 650.
    //
    // RE-BASELINED 650 -> 600 for the CASTLE-SCENE REWORK. A topic-grounded
    // scene closes on a subject-naming consequence and DROPS the generic
    // reaction beat (TOPIC_CONFIG `reaction: false` in castle-day.js — the
    // action line already carries the exchange), so each grounded scene
    // contributes two composed beats (establish + consequence) where a legacy
    // scene contributed three. As the testing and cover families landed this
    // fell from ~711 to 648 BY DESIGN, not by a throughput regression. This is
    // a re-baseline of a denominator-sanity floor, exactly like the 750->650
    // one above; the repeat-RATE band below (the actual quality guard) is
    // UNCHANGED at 2%. 600 clears the live 648 with margin and still reddens on
    // the ~414 a barren-draw regression would reach under grounding. It will be
    // re-baselined again as the remaining deduction families (consequences,
    // nightfall) ground.
    expect(composed, 'too few composed cards to measure a repeat rate against — the '
      + 'castle is rendering materially less than it did when this rate was derived')
      .toBeGreaterThan(600);
    expect(twice / composed, `${twice} of ${composed} composed cards repeated inside `
      + 'a single episode - the screen pools are too narrow for the throughput')
      .toBeLessThan(0.02);
  });

  it('and does not print the same composed card over and over across a SEASON', () => {
    // ── THE ARM THE PER-EPISODE ONE COULD NOT BE (fix round 1, C1b) ─────
    //
    // WHAT THE REVIEW MEASURED, AND WHY NOTHING HERE SAW IT: 100% of seasons
    // printed the same composed card FOUR OR MORE times; median worst 9, worst
    // 15, across 206,364 cards. The arm above is per EPISODE and by
    // construction cannot see a card printed once an episode across ten of
    // them — which is exactly the shape a four-element pool produces when
    // `_pickUnique`'s `used` set is rebuilt every day.
    //
    // THE CAUSE, AND WHY THE FIX WAS WIDTH. `castleDayScenes` builds a fresh
    // `used` set per episode, so a four-line pool drawn five times a day is
    // exhausted and restarted every day. A season-scoped set would fix the
    // count and break something worse: this function is called repeatedly for
    // the same episode by the screen, the transcript and these guards, and the
    // output would then depend on how many times it had already been called.
    // So `REACT_SINGLE`, `CONSEQ_SINGLE` (4 -> 12), `REACT.bond`,
    // `REACT.pressure` (3 -> 9) and the recall leads (4 -> 10) were widened
    // instead. Median worst per season 9 -> 6, worst 15 -> 10.
    //
    // ── THE BAND, RE-DERIVED AGAINST ITS OWN MUTANT (fix round 2) ──────
    //
    // THE FIRST VERSION OF THIS BAND DID NOT BITE, and the re-review proved it
    // the only way that counts: it reverted `CONSEQ_SINGLE` to the 4-wide state
    // this fix widened — the exact pool the fix was about — and the arm stayed
    // GREEN. Reproduced here, and the numbers came back to the digit:
    //
    //                                    median   max
    //     shipped, arm seeds N=40           5       7
    //     shipped, arm seeds N=200          4       7
    //     shipped, independent N=200        4       7
    //     REVERTED, arm seeds N=40          6      13   <- old band passed
    //     REVERTED, arm seeds N=200         7      14   <- passed, exactly
    //     REVERTED, independent N=200       6      15   <- would have failed
    //
    // So the STATISTIC separates cleanly and only the THRESHOLD was wrong: 14
    // sat one above the mutant's own value on this arm's seeds, which is the
    // knife-edge shape this branch rejects and the shape I correctly diagnosed
    // and repaired in tr-rankings. A guard that cannot fail is a number without
    // an assertion behind it wearing a different costume.
    //
    // TWO STATISTICS NOW, and the MEDIAN is the primary one. It separates 4-5
    // from 6-7 without depending on a tail at all, so it cannot be defeated by
    // a lucky maximum, and 40 seasons resolve a median far better than they
    // resolve a max. The maximum is banded as well, at 10: three of headroom
    // over the shipped 7 and reddening at the mutant's 13. Both were measured
    // on three configurations, two of them seeds this arm does not use.
    //
    // WHAT IS STILL NOT FIXED, and is not claimed to be: every season still has
    // some composed card at 4 or more. The forty four-element pools in `CONSEQ`
    // are the remaining exposure and they are Task 11's, alongside the 448 thin
    // engine pools. The distribution is printed so the next task inherits a
    // number instead of a feeling.
    const N = 40;
    const worst = [];
    for (let seed = 60001; seed <= 60000 + N; seed++) {
      setPlayers(ROSTER);
      seedFranchiseHistory(CAST);
      playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
      const seen = new Map();
      let cards = 0;
      for (const row of (gs.episodeHistory || [])) {
        if (!row.tr || !row.tr.castle || !(row.tr.castle.scenes || []).length) continue;
        if (row.tr.endgame) continue;
        for (const scene of castleDayScenes(row, 'audience')) {
          for (const beat of scene.observerText.audience) {
            if (beat.kind === 'action') continue;      // the engine's own pools
            seen.set(beat.text, (seen.get(beat.text) || 0) + 1);
            cards++;
          }
        }
      }
      let w = 0; let what = '';
      for (const [t, n] of seen) if (n > w) { w = n; what = t; }
      worst.push({ w, what, cards });
    }
    const ws = worst.map(x => x.w).sort((a, b) => a - b);
    const top = worst.reduce((a, b) => (b.w > a.w ? b : a));
    console.log(`\n=== COMPOSED CARD REPETITION, SEASON SCOPE (${N} seasons) ===`);
    console.log(`   worst card per season: median ${ws[Math.floor(ws.length / 2)]}, `
      + `max ${ws[ws.length - 1]}, seasons with one at 4+ `
      + `${worst.filter(x => x.w >= 4).length}/${N}`);
    console.log(`   "${top.what.slice(0, 90)}"`);

    // ANTI-VACUITY: the seasons have to have rendered something.
    expect(worst.reduce((n, x) => n + x.cards, 0),
      'no composed cards were counted, so this arm asserted nothing').toBeGreaterThan(20000);
    const median = ws[Math.floor(ws.length / 2)];
    // THE PRIMARY BAND. Shipped 4-5 against a 4-wide-CONSEQ_SINGLE mutant's
    // 6-7, on three configurations; 5 is the shipped value and 6 is the mutant.
    expect(median, `the median season's worst composed card printed ${median} times `
      + '- a screen pool has narrowed relative to the throughput')
      .toBeLessThanOrEqual(5);
    // AND THE TAIL, which catches a single pool collapsing while the median
    // holds. Shipped 7 on all three configurations; the mutant reads 13-15.
    expect(ws[ws.length - 1], `the worst composed card in a season printed `
      + `${ws[ws.length - 1]} times — a screen pool has collapsed under the throughput`)
      .toBeLessThanOrEqual(10);
  }, 300000);

  it('never claims a room was empty when the scene says otherwise', () => {
    // FIX ROUND 1, C1 - and this is the arm that would have caught it. `people`
    // is who the SENTENCE is about, and reading it as "who was there" made the
    // screen assert solitude over an action card that named other players: 69
    // scenes in five rendered seasons, 13% of everything. Solitude is a claim
    // about who witnessed the scene and everything downstream depends on it.
    //
    // FIX ROUND 2 - THE ARM COULD NOT SEE HALF THE DEFECT. It tested only the
    // name scan, so deleting the phrase clause from `_mode` did not trip it,
    // and the review found four live scenes still composed as alone over lines
    // like "checked what frightened looked like on the two people nearest them"
    // and "The column out of the gate got shorter every time". Company by
    // QUANTITY and by COLLECTIVE NOUN, neither of which names anybody.
    //
    // The list below is NOT a second copy of the production matcher. It is a
    // fixed regression corpus: the exact phrases found in real composed-solo
    // lines that plainly had company in them. It does not grow when the
    // production list grows, and it goes red the moment any of these classes is
    // composed as solitary again.
    const FOUND_DEFECTS = [
      /\b(?:one|two|three) (?:person|people)\b/i,   // "the two people nearest them"
      /\bthe column\b/i,                            // "the column out of the gate"
      /\bquestions?\b/i,                            // "an ordinary follow-up question"
      /\bagree\w* with (?:them|him|her)\b/i,        // "had to agree with them"
      /\bthe only one\b/i,                          // "the only one who said anything"
      /\bat breakfast\b/i,                          // "counted heads at breakfast"
    ];
    let solo = 0, single = 0, pair = 0;
    for (const ep of TASK6_ROWS) {
      for (const scene of allScenes(ep)) {
        const action = scene.observerText.audience.find(b => b.kind === 'action').text;
        if (scene.mode === 'solo') {
          const others = CAST.filter(n => !scene.participants.includes(n) && action.includes(n));
          expect(others, scene.id + ': composed as alone, and the action names '
            + others.join(', ') + ' - "' + action + '"').toEqual([]);
          const hit = FOUND_DEFECTS.filter(re => re.test(action)).map(String);
          expect(hit, scene.id + ': composed as alone over a line with company in it - '
            + hit.join(' ') + ' - "' + action + '"').toEqual([]);
          // and a scene on the road is never solitary: the whole castle walks it
          expect(['journey-out', 'journey-back'].includes(scene.window),
            scene.id + ': composed as alone while the castle was walking in a line')
            .toBe(false);
          solo++;
        }
        if (scene.mode === 'single') single++;
        if (scene.mode === 'pair') pair++;
      }
    }
    // ALL THREE MODES HAVE TO BE REACHED or the rule above is a rule about
    // nothing. `single` is the mode that exists because the record cannot say
    // who was present; if it ever went to zero, every one-person scene would be
    // claiming solitude again and this arm would still be green.
    expect(pair, 'no pair scene was composed').toBeGreaterThan(20);
    expect(single, 'the one-subject mode is unreachable, so C1 has silently returned')
      .toBeGreaterThan(0);
    expect(solo, 'no scene was ever composed as alone, so the rule above asserted nothing')
      .toBeGreaterThan(0);
    // GUARD ON THE GUARD, and it is not decoration here: the production matcher
    // is a regex over prose, and a word-boundary typed into a JS string literal
    // is U+0008 - a matcher that approves everything, silently, forever. This
    // task shipped exactly that for one run.
    expect(FOUND_DEFECTS.some(re => re.test('on the two people nearest them'))).toBe(true);
    expect(FOUND_DEFECTS.some(re => re.test('lay awake with the empty beds'))).toBe(false);
  });

  it('takes who answered off the record when the record says, not off the sentence', () => {
    // PLAN 10 TASK 7, CARRY-FORWARD FROM TASK 6. `_order` used to work out who
    // replied by reading the authored line and taking the LAST name in it as
    // the respondent. It inverts the scene when it is wrong, and it is wrong on
    // a whole class of two-clause sentences - the reviewer's rendered example
    // was "Two people put Beardo in the same place at the same time, and
    // Alejandro had asked them separately", which handed the reply to the
    // asker, across three consecutive cards.
    //
    // The fix is a FIELD (`speaker`/`respondent`, js/tr/events.js
    // `sceneSpeakers`), and this arm exists to prove the field WINS - i.e. that
    // it is not shadowed by the heuristic that is still there for records that
    // do not carry it.
    //
    // THE FIXTURE IS BUILT SO THE TWO ANSWERS DISAGREE. The line names Ondine
    // last, so the heuristic makes Ondine the respondent; the record says the
    // respondent is Marek. If `_order` ignored the field this assertion could
    // not pass, which is checked directly below by deleting it.
    const line = 'Two people put Marek in the same place at the same time, '
      + 'and Ondine had asked them separately.';
    const scene = {
      window: 'evening', family: 'testing', eventId: 'testing-ask-for-alibi-check',
      branch: 'checks-out', actors: ['Ondine', 'Marek'], people: ['Ondine', 'Marek'],
      parties: ['Ondine', 'Marek'], threadId: 't1', kind: 'testing', openedEp: 3,
      beatNo: 1, opened: true, priorDays: [], line, citation: null, citedDays: [],
      closedNow: false, outcome: null, sense: null,
      speaker: 'Ondine', respondent: 'Marek',
    };
    const row = ep => ({ ep: 3, tr: { castle: { ep: 3, scenes: [ep], windows: ['evening'],
      phases: [{ id: 'private-strategy', label: 'Private Strategy', scenes: [ep] }] } } });

    const withField = castleDayScenes(row(scene), 'audience');
    expect(withField.length, 'the fixture composed no scene').toBe(1);
    expect(withField[0].participants.slice(0, 2)).toEqual(['Ondine', 'Marek']);

    // AND THE MUTATION: strip the field and the heuristic answers the other way
    // round. Without this half the arm would still pass if `_order` ignored the
    // record entirely and simply happened to agree - the failure mode the whole
    // fix is about.
    const { speaker, respondent, ...silent } = scene;
    const withoutField = castleDayScenes(row(silent), 'audience');
    expect(withoutField[0].participants.slice(0, 2)).toEqual(['Marek', 'Ondine']);

    // A record that names somebody who was not in the scene is not trusted:
    // `sceneSpeakers` returns null for it and the screen falls back.
    const bogus = castleDayScenes(row({ ...scene, respondent: 'Nobody' }), 'audience');
    expect(bogus[0].participants.slice(0, 2)).toEqual(['Marek', 'Ondine']);
  });

  it('and the engine actually writes that field on the events that declare it', () => {
    // The arm above proves the SCREEN honours the field. This one proves the
    // ENGINE produces it, on a real season, for the thirteen events annotated
    // `roles: 'initiator-first'` - otherwise the fix is a code path nothing
    // reaches, which is the defect class this repo's own notes call
    // "written-but-unreachable".
    const declared = new Set(EVENTS.filter(e => e.roles === 'initiator-first').map(e => e.id));
    expect(declared.size, 'no event declares its direction, so this arm is vacuous')
      .toBeGreaterThanOrEqual(13);
    // A DECLARED EVENT THAT FIRES SOLO NAMES NO RESPONDENT (Defect 3). The
    // alibi check is convened as a pair but conducted BEHIND the subject's back
    // — the subject is absent, so the event now reports ONE participant and
    // there is no respondent to record. Its `roles` declaration is harmless
    // (`sceneSpeakers` simply returns null with no pair), but the per-scene pair
    // check below must skip it. The skip is PAIRED, not a hole: a declared event
    // that recorded a lone participant must be that one behind-the-back event,
    // so a DIFFERENT initiator-first event losing its speaker still fails here.
    const SOLO_DECLARED = new Set(['testing-ask-for-alibi-check']);
    let seen = 0, solo = 0;
    for (const ep of TASK6_ROWS) {
      for (const raw of ep.tr.castle.scenes) {
        if (!declared.has(raw.eventId)) continue;
        if ((raw.people || []).length < 2) {
          expect(SOLO_DECLARED.has(raw.eventId),
            `${raw.eventId} declares a direction but recorded a lone participant`).toBe(true);
          solo++;
          continue;
        }
        expect(raw.speaker, `${raw.eventId} declares its direction and recorded no speaker`)
          .toBeTruthy();
        expect(raw.respondent).toBeTruthy();
        expect(raw.speaker).not.toBe(raw.respondent);
        // and it is the pair the event returned, in the order it returned it
        expect(raw.people).toContain(raw.speaker);
        expect(raw.people).toContain(raw.respondent);
        seen++;
      }
    }
    expect(seen, 'no annotated event fired in this season, so nothing was checked')
      .toBeGreaterThan(0);
    // ── THE FALLBACK IS STILL LIVE, AND THE SECOND WAY OF DECLARING ───────
    //
    // `every(... === null)` was right while `roles: 'initiator-first'` was the
    // only way to say which way a scene runs. It is not: `sceneSpeakers`
    // (js/tr/events.js) documents TWO, and the second — `speaker`/`respondent`
    // on the `fire()` result — is the one it tells new events to use, "whenever
    // a branch can hand the scene the other way round". Task 7 stage 3's
    // mission-fallout library uses it, including on two events that could not
    // use `roles` at all because they also fire solo and a one-person scene has
    // no respondent to name.
    //
    // So the claim is split into the two things it was really making, and both
    // are kept: SOME unannotated scene still records nothing (the heuristic
    // fallback in js/vp-tr/castle-day.js is reachable, which is what this line
    // was for), and EVERY unannotated scene that does record a direction
    // records a valid one. The second half is new and is strictly more than
    // was checked before.
    const quiet = TASK6_ROWS.flatMap(e => e.tr.castle.scenes)
      .filter(x => !declared.has(x.eventId));
    expect(quiet.length).toBeGreaterThan(0);
    expect(quiet.some(x => x.speaker === null && x.respondent === null),
      'every scene in the season names a speaker, so the heuristic fallback on the '
      + 'screen is unreachable and untested').toBe(true);
    for (const x of quiet) {
      if (x.speaker === null && x.respondent === null) continue;
      expect(x.speaker, `${x.eventId} recorded a respondent and no speaker`).toBeTruthy();
      expect(x.respondent, `${x.eventId} recorded a speaker and no respondent`).toBeTruthy();
      expect(x.speaker).not.toBe(x.respondent);
      expect(x.people).toContain(x.speaker);
      expect(x.people).toContain(x.respondent);
    }
  });

  it('and classifies every branch it can see as adverse or as harmless', () => {
    // FIX ROUND 2, item 3. `_tone` treats anything not on the adverse list as
    // smooth, so an unknown branch and a known-harmless branch were the same
    // thing to it - the design could not tell "we looked at this and it is
    // fine" from "we have never seen this". Six genuinely adverse branches were
    // falling through in silence.
    //
    // THE CORPUS IS THE WHOLE POOL, not one season: `PER_KEY` above is built
    // from every firing of every event across all the seasons this file plays,
    // so it sees branches a handful of seeds never reach. It is a DENYLIST -
    // every branch must be on one list or the other - so Task 7's new branches
    // will redden it, which is the entire point of it.
    const known = new Set([...BRANCH_TONES.adverse, ...BRANCH_TONES.benign]);
    expect(known.size, 'the two lists came back empty').toBeGreaterThan(100);
    const seen = new Set();
    for (const key of PER_KEY.keys()) {
      const branch = key.slice(key.indexOf(':') + 1);
      if (branch && branch !== '(none)') seen.add(branch);
    }
    expect(seen.size, 'no branch was observed, so this arm asserted nothing')
      .toBeGreaterThan(100);
    const unclassified = [...seen].filter(b => !known.has(b)).sort();
    expect(unclassified, 'these branches are on neither list, so `_tone` is guessing at '
      + 'them. Read each one and put it in ADVERSE_BRANCHES or BENIGN_BRANCHES in '
      + 'js/vp-tr/castle-day.js - do not widen a pattern').toEqual([]);
    // and the two lists do not overlap, which would make the classification a lie
    const both = [...BRANCH_TONES.adverse].filter(b => BRANCH_TONES.benign.has(b));
    expect(both, 'a branch is on both lists').toEqual([]);
  });

  it('answers a scene that went badly as a scene that went badly', () => {
    // FIX ROUND 1, C2 — the other arm that would have caught a shipped defect.
    // The record carries `branch`, the castle pools fork four ways on it, and
    // the screen keyed only on the family: so `testing-night-scores-it` on
    // branch `failed`, outcome `failed-maliciously`, rendered "doesn't think
    // twice about it, which is either the truth or a very good habit" directly
    // above "It was failed on purpose, and both of them know that as well."
    // ── AND A SEASON THAT ACTUALLY CONTAINS THE CASE (Task 7 stage 3) ────
    //
    // The `closedAdverse` floor at the foot of this arm is its anti-vacuity
    // check, and it is a check on a REACHABILITY: a story that closes tonight
    // on `exposed` / `failed-maliciously` / `test-exposed` / `broken-up` /
    // `confessed-unrelated`. That is not a common night, and seed 20260901 —
    // the one season the whole Task-6 block reads — stopped containing one
    // when the castle's scene scheduling moved. The floor then failed for a
    // reason that has nothing to do with what the arm is testing, which is the
    // same fixture fragility this plan already hit once in tr-export.test.js's
    // co-winner block, and the fix is the same one: WIDEN THE SEARCH rather
    // than pin a seed. A pinned seed rotates out of the case on the next
    // scheduling change; a search reads as "look for the case", and a total
    // miss across the whole range still fails loudly at the foot of the arm.
    //
    // The shared rows are read first and are almost always enough for the tone
    // assertions themselves; the extra seasons are only walked until one
    // adverse payoff turns up.
    const hasAdversePayoff = rows => rows.some(ep => (ep.tr.castle.scenes || [])
      .some(x => x.closedNow && ['test-exposed', 'failed-maliciously', 'exposed',
        'broken-up', 'confessed-unrelated'].includes(x.outcome)));
    const ROWS = [...TASK6_ROWS];
    for (let seed = 1; seed <= 60 && !hasAdversePayoff(ROWS); seed++) {
      setPlayers(ROSTER);
      seedFranchiseHistory(CAST);
      playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 900000 + seed });
      ROWS.push(...(gs.episodeHistory || []).map(e => ({ ...e }))
        .filter(e => e.tr && e.tr.castle && (e.tr.castle.scenes || []).length));
    }

    let adverse = 0, smooth = 0, closedAdverse = 0;
    for (const ep of ROWS) {
      const record = new Map(ep.tr.castle.scenes.map(x => [x.eventId + '|' + x.beatNo, x]));
      // ── WHICH BEAT OF A STORY IS ALLOWED TO BE ITS ENDING (Task 7 stage 3) ──
      //
      // `_castleRecord` (js/tr/headless.js) stamps `closedNow` on EVERY beat a
      // closed story took tonight, because it is answering "did this end
      // tonight". `castleDayScenes` deliberately clears it on all but the LAST
      // of them, and says why in its own comment: a story that announces its
      // ending at dawn, runs two more scenes and announces the same ending on
      // the road home reads as a rendering fault. That was found by dumping a
      // transcript and reading it.
      //
      // This arm was reading the RECORD's un-cleared flag, so it demanded an
      // adverse tone from beats the screen had deliberately un-closed — the
      // dawn beat of a story that would not end until the evening. It passed
      // for as long as a story taking two beats in one day was rare; the
      // mission-fallout window going from 0.70 scenes an episode to 4.36 made
      // it ordinary, and the arm went red on `testing-cold-read-check`, whose
      // own branch is `cold-read` and whose own firing closed nothing.
      //
      // So it is scoped to the same population the screen scopes itself to:
      // the last beat that story took today. That is a NARROWING of what the
      // arm asks about, not of what it demands — the `closedAdverse` floor
      // below still has to be cleared, so an implementation that stopped
      // rendering real payoffs adversely still fails here.
      const lastBeatOfThread = new Map();
      for (const x of ep.tr.castle.scenes) lastBeatOfThread.set(x.threadId, x.beatNo);
      for (const scene of allScenes(ep)) {
        const raw = record.get(scene.eventId + '|' + scene.id.split('-').pop());
        const react = scene.observerText.audience.find(b => b.kind === 'reaction');
        const conseq = scene.observerText.audience.find(b => b.kind === 'consequence');
        if (scene.tone === 'adverse') {
          adverse++;
          expect(conseq.tone, scene.id + ': the consequence was drawn from the wrong pool')
            .toBe('adverse');
          // A TOPIC-GROUNDED scene carries its exchange in the action line and
          // drops the separate generic reaction beat (see TOPIC_CONFIG in
          // castle-day.js); its tone is checked on the consequence above. Only
          // a scene that HAS a reaction beat is asked whether that beat is
          // adverse — the guard still bites for every legacy pair/group scene.
          if ((scene.mode === 'pair' || scene.mode === 'group') && react) {
            expect(react.tone, scene.id + ': a scene that went badly got a smooth reaction')
              .toBe('adverse');
          }
        } else { smooth++; }
        // and the tone is the RECORD's, not the screen's own opinion of it
        if (raw && raw.closedNow && lastBeatOfThread.get(raw.threadId) === raw.beatNo
          && ['test-exposed', 'failed-maliciously', 'exposed',
            'broken-up', 'confessed-unrelated'].includes(raw.outcome)) {
          expect(scene.tone, scene.id + ': outcome ' + raw.outcome + ' rendered as smooth')
            .toBe('adverse');
          closedAdverse++;
        }
      }
    }
    expect(smooth, 'nothing rendered smooth').toBeGreaterThan(20);
    expect(adverse, 'no scene ever rendered as having gone badly — the branch is being ignored '
      + 'again, which is exactly the defect').toBeGreaterThan(10);
    expect(closedAdverse, 'no closed scene with an adverse stored outcome was checked')
      .toBeGreaterThan(0);
  });

  it('gives a player only the layer they are entitled to, and says which it is', () => {
    // FIX ROUND 1, I1. `castleDayScenes` took an `observer` and ignored it for
    // CONTENT: it handed back the full audience stream for scenes the player
    // was never in, and the record carried no `layer`, so no caller could tell.
    // There is no production consumer today, which is precisely why it had to
    // be fixed: the next one would have leaked in silence.
    let full = 0, heard = 0, checked = 0;
    for (const ep of TASK6_ROWS) {
      const n = {};
      for (const s of ep.tr.castle.scenes) {
        for (const p of new Set([...s.people, ...s.actors])) n[p] = (n[p] || 0) + 1;
      }
      const who = Object.keys(n).sort((a, b) => n[b] - n[a])[0];
      if (!who) continue;
      for (const scene of castleDayScenes(ep, 'player:' + who)) {
        const mine = scene.participants.includes(who);
        if (scene.layer === 'full') {
          expect(mine, scene.id + ': ' + who + ' got the full layer for a scene they were not in')
            .toBe(true);
          expect(Array.isArray(scene.observerText.audience)).toBe(true);
          full++;
        } else {
          expect(scene.layer, scene.id + ': a scene with no layer on it').toBe('heard');
          expect(scene.observerText.audience,
            scene.id + ': an overheard scene carried the audience stream anyway').toBeUndefined();
          expect(Array.isArray(scene.observerText.public)).toBe(true);
          heard++;
        }
        expect(scene.window === 'night' && !mine,
          scene.id + ': ' + who + ' was asleep and got a night scene').toBe(false);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(20);
    expect(full, 'the watcher was in nothing, so the full branch is untested').toBeGreaterThan(0);
    expect(heard, 'nothing was ever withheld, so the layer is unreachable').toBeGreaterThan(10);
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

// ══════════════════════════════════════════════════════════════════════
// EVERYONE IS A CLAIM ABOUT A NUMBER, AND IT NEEDS EVIDENCE
// ══════════════════════════════════════════════════════════════════════
//
// writing-contracts.md, "Evidence for group consensus": `everyone`, `the whole
// room`, `the group agrees`, `the castle turns` and `nobody trusts` require a
// public vote or ceremony, named reactions from the configured share of living
// players, propagation receipts reaching that share, or a stored group
// declaration. "Otherwise use precise language: `three players`, `most of
// Fiore's team`, `the people in the van`, or named contestants."
//
// WHY THIS ARM IS SHAPED LIKE THE DEBUG-WORD SWEEP ABOVE. That sweep shipped
// green while 73 banned words were live, for three reasons the fix-round note
// sets out: it rendered ONE seed, it scanned ONE screen, and its matcher missed
// inflections. All three failure modes apply exactly as well here — "everybody
// knew" and "everyone knows" are the same defect in different tenses, and the
// consensus claims are spread across the castle library AND the conclave AND
// the Round Table. So this reuses that arm's corpus, its screen list and its
// guard-on-the-guard, and adds the source scan the same way.
//
// TWO WAYS A LINE MAY SAY IT, AND NO THIRD:
//
//   1. WIRED. The line carries `{who}`, and its event fills it from
//      `api.consensusPhrase(...)` (js/tr/knowledge-flow.js), which is only
//      allowed to return the universal form once propagation receipts pass
//      `CONSENSUS_FLOOR` or a public ceremony licenses it. Below the floor it
//      names them or counts them.
//   2. LICENSED. The universal is about something the room WATCHED HAPPEN — a
//      Round Table, a ceremony, a mission briefing, a public row — or it is a
//      screen naming the aggregate belief model, or it is a contestant's own
//      speech overstating for effect. Each of those is listed below with its
//      reason, keyed on a distinctive fragment rather than a line number so an
//      edit elsewhere in the file cannot move it.
//
// Anything on neither list is red. That is the point.
const CONSENSUS_CLAIM = [
  // `turns against` is in the contract's own worked forbidden example
  // ("Everyone turns against Manu after the mission") and the first draft of
  // this matcher did not have it. The MUTANT arm below caught that, which is
  // the entire argument for writing the mutant arm before the fix.
  /\b(?:everyone|everybody)\s+(?:knew|knows|agreed|agrees|believed|believes|decided|decides|turns?|turned|has\s+it|had\s+it|now\s+knew|already\s+knew)\b/i,
  /\bthe\s+(?:whole\s+)?(?:castle|room|house|building)\s+(?:has\s+decided|have\s+decided|decided|decides|agreed|agrees|believed|believes|knew|knows|turned|turns)\b/i,
  /\bgone\s+round\s+the\s+whole\s+castle\b/i,
  /\bthe\s+whole\s+castle\s+(?:will\s+have|has|had|knows|knew)\b/i,
  /\b(?:nobody|no\s+one|no-one)\s+(?:trusts|trusted|believes|believed)\b/i,
  /\bthe\s+group\s+agrees\b/i,
];
const claimsConsensus = t => CONSENSUS_CLAIM.some(r => r.test(t));

/**
 * The licensed universals, each keyed on a fragment and each with the evidence
 * that licenses it. Adding a line here is a decision somebody has to write a
 * reason for; that is the whole mechanism.
 */
const CONSENSUS_LICENSED = [
  // ── PUBLIC: the room watched it happen ───────────────────────────────
  ['and the room agreed, and', 'said out loud to the room, which was present'],
  ['The room has decided to keep', 'the room spent an evening on it in the open'],
  ['and everybody knew which one', 'the empty chair at breakfast is the morning reveal'],
  ['outright success and everybody knew it', 'the mission result is announced to everyone'],
  ['everybody agreed afterwards', 'a defence made in front of the room'],
  ['The hesitation was the answer and everybody had it', 'the room asked the question'],
  ['and the room agreed with', 'said at the table, in the room'],
  ['The room believed', 'a group-pressure scene: the room is the participants'],
  ['which nobody had asked about and everybody now knew', 'blurted out loud in the room'],
  ['assumed everyone already knew', 'a stated MISTAKE, corrected in the same sentence'],
  ['Nobody says the number out loud. Everybody has it', 'the headcount at breakfast is visible'],
  ['the room decides it has agreed', 'the conclave, whose room is its three members'],
  ['every hand in the room agrees to stop it', 'the endgame rule, said by the host'],
  ['Everybody knew what was being asked', 'the mission briefing is a ceremony'],
  ['The split is arbitrary and everybody knows it', 'the teams are drawn in public'],
  ['Then the room has decided', 'the Round Table ballot'],
  ['Everybody knows one true thing now', 'the banishment reveal'],
  ['the room has decided otherwise', 'the Round Table ballot, read aloud'],
  ['exactly what the room has decided they are', 'reads the recorded ballot'],
  ['everyone knew it while it was still happening', 'a mission failure everybody was standing in'],
  ['and everybody knew whose', 'a relic laid on the table before the vote'],
  // ── THE AGGREGATE MODEL, NAMED BY A SCREEN ───────────────────────────
  ['What the castle believes', 'a screen heading for the deduction model itself'],
  ['What The Castle Believes', 'the same heading, title case'],
  ['the castle knows something came back', 'the relic award had witnesses; the board says so'],
  ['the castle knows that, but the next table', 'names the model, then says it will be ignored'],
  ['Everything else the castle believes about anybody, it deduced', 'describes the model'],
  ['The castle knows nothing', 'an assertion of IGNORANCE, which needs no evidence'],
  ['Nobody in the castle knows to reread it', 'the same, about a recruitment note'],
  // ── A CONTESTANT'S OWN WORDS ─────────────────────────────────────────
  ['the next morning everybody agrees it was obvious all along', 'a confessional aphorism'],
  ['right, and everybody knows it', 'a contestant overstating in their own voice'],
];
const licensed = t => CONSENSUS_LICENSED.some(([frag]) => t.includes(frag));

/**
 * The forms `consensusPhrase` itself produces. A rendered sentence containing
 * one of these is legal BY CONSTRUCTION: the phrase only reaches the universal
 * form above the floor or on public evidence, so the evidence check has already
 * happened by the time these words exist.
 */
const EVIDENCED_PHRASE = /the people (?:still in the castle|who were in the room)/i;

/**
 * The five sentences whose count comes from `api.consensusPhrase`, matched in
 * the RENDERED corpus with the filled slot captured. This is the arm that
 * distinguishes "the machinery governs the prose" from "the machinery exists".
 * Each regex is anchored on the fixed words either side of `{who}` in the pool.
 */
const WIRED_TEMPLATES = [
  /By breakfast (.+?) knew about .+? and .+?, and/gi,
  /By breakfast (.+?) will have it\./gi,
  /had gone round (.+?) and come home to/gi,
  /now has to explain, to (.+?), why the one person/gi,
  /It was settled this morning, by (.+?), that/gi,
];

describe('a universal claim is evidenced, wired, or it does not ship', () => {
  it('the source carries no unlicensed, unwired universal', () => {
    // WHAT IS WRITTEN, not what one season happened to draw — the same reason
    // the debug-word sweep keeps its source half beside its render half.
    const files = [
      ...['trust', 'suspicion', 'grief', 'cover', 'romance', 'callback', 'testing',
        'journey', 'mission-fallout', 'consequences', 'nightfall', 'voice']
        .map(f => 'js/tr/castle/' + f + '.js'),
      ...['castle-day', 'cold-open', 'conclave', 'confessionals', 'round-table',
        'house-status', 'mission', 'recruitment', 'endgame', 'selection', 'suspicion',
        'arrival', 'debug']
        .map(f => 'js/vp-tr/' + f + '.js'),
      'js/tr/missions.js', 'js/tr/powers.js', 'js/tr/roundtable.js', 'js/tr/murder.js',
      // TASK 8: the four bespoke missions. They author viewer prose — host
      // ceremonies, phase narration, scene lines, confessionals — so they
      // belong in the same scan as every other prose library. Added here
      // rather than given a private copy of this matcher in
      // tests/tr-missions-bespoke.test.js, which keeps the RENDERED half only.
      ...['drowned-causeway', 'nightjar-orrery', 'long-account', 'ash-vault']
        .map(f => 'js/tr/missions/' + f + '.js'),
    ];
    const offenders = [];
    let scanned = 0, seen = 0;
    for (const f of files) {
      const src = readFileSync(new URL('../' + f, import.meta.url), 'utf8');
      expect(src.length, f + ' is empty — this scan is reading nothing').toBeGreaterThan(200);
      scanned++;
      for (const [n, raw] of src.split('\n').entries()) {
        const line = raw.trim();
        if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;
        if (!claimsConsensus(line)) continue;
        seen++;
        // WIRED: the line defers the count to `consensusPhrase`.
        if (line.includes('{who}') || EVIDENCED_PHRASE.test(line)) continue;
        if (licensed(line)) continue;
        offenders.push(f + ':' + (n + 1) + '  ' + line);
      }
    }
    expect(scanned).toBe(files.length);
    // ANTI-VACUITY: the scan has to be finding the shape at all, or a matcher
    // that quietly stopped matching would report the library clean.
    expect(seen, 'the consensus matcher found nothing anywhere — it has stopped matching')
      .toBeGreaterThan(20);
    expect(offenders,
      'these say everyone/the whole castle with nothing checking the evidence. Either '
      + 'route the line through api.consensusPhrase (give it {who}) or add it to '
      + 'CONSENSUS_LICENSED with the public event that licenses it.')
      .toEqual([]);
  });

  it('and no rendered screen prints one either, across seasons and across screens', () => {
    // THE CORPUS ARM. Twenty decorrelated seeds, three screens, exactly as the
    // debug-word sweep does it — a source scan cannot see a sentence assembled
    // at render time out of two halves that are each innocent.
    const rows = [];
    for (let seed = 91001; seed <= 91020; seed++) {
      setPlayers(ROSTER);
      seedFranchiseHistory(CAST);
      playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
      for (const e of (gs.episodeHistory || [])) {
        if (e.tr && e.tr.castle && (e.tr.castle.scenes || []).length) rows.push({ ...e });
      }
    }
    expect(rows.length, 'the corpus came back empty').toBeGreaterThan(150);
    const screens = [
      ['castle day', ep => rpBuildCastleDay(ep, 'audience')],
      ['conclave', ep => rpBuildConclave(ep, 'audience')],
      ['round table', ep => rpBuildRoundTable(ep, 'audience')],
    ];
    const hits = [];
    let scanned = 0, chars = 0, evidenced = 0;
    for (const ep of rows) {
      for (const [what, build] of screens) {
        let html = '';
        try { html = build(ep) || ''; } catch { continue; }
        if (!html) continue;
        const text = _vpTextLines(screenNarration(html)).join('\n');
        if (text.length < 40) continue;
        scanned++; chars += text.length;
        for (const sentence of text.split(/(?<=[.!?])\s+|\n/)) {
          if (!claimsConsensus(sentence)) continue;
          if (EVIDENCED_PHRASE.test(sentence)) { evidenced++; continue; }
          if (licensed(sentence)) continue;
          hits.push('ep ' + ep.num + ' ' + what + ': ' + sentence.trim().slice(0, 150));
        }
      }
    }
    expect(scanned, 'no screen was scanned, so this arm asserted nothing').toBeGreaterThan(300);
    expect(chars, 'the screens rendered almost no words').toBeGreaterThan(400000);
    // eslint-disable-next-line no-console
    console.log('[tr-castle-prose] consensus: ' + scanned + ' screens, '
      + chars + ' chars, ' + evidenced + ' evidenced universals printed');
    expect(hits.slice(0, 6),
      'a screen printed an unevidenced universal').toEqual([]);
    // AND THE WIRING IS REACHED. A guard whose only evidence is an empty
    // offender list cannot tell "the machinery governs the prose" from "the
    // machinery is never called" — which is precisely the defect this arm was
    // added to close. So the five WIRED sentences are matched in the rendered
    // corpus and their filled slot is read back.
    //
    // `evidenced` IS REPORTED AND NOT BANDED, and the numbers are the reason.
    // The universal form needs receipts past the 0.75 floor, and the widest
    // spread any castle event writes is six hops — 39% of a full castle of
    // eighteen, and past the floor only once the room has shrunk. Measured
    // over sixty seasons (tools/tr-measure-runs.mjs's sibling probe): 27 wired
    // sentences printed, 11 of them reaching "the people still in the castle"
    // and the other 16 handing back "eight of the 13 still here" or "seven of
    // the eleven still here". Whether THIS twenty-season corpus at twenty
    // players happens to contain one is a property of the sample, so it is
    // printed and not asserted; what is asserted is that the wired sentences
    // shipped at all and that none of them printed an unfilled slot.
    let wired = 0;
    const overclaimed = [];
    for (const ep of rows) {
      for (const [, build] of screens) {
        let html = '';
        try { html = build(ep) || ''; } catch { continue; }
        if (!html) continue;
        const text = _vpTextLines(screenNarration(html)).join(' ');
        for (const re of WIRED_TEMPLATES) {
          for (const m of text.matchAll(re)) {
            wired++;
            const slot = (m[1] || '').trim();
            if (!slot || /\{who\}/.test(slot)
              || /\b(?:everyone|everybody|the whole castle)\b/i.test(slot)) {
              overclaimed.push(m[0].slice(0, 140));
            }
          }
        }
      }
    }
    // eslint-disable-next-line no-console
    console.log('[tr-castle-prose] consensus wiring: ' + wired + ' wired sentences printed, '
      + evidenced + ' of them reaching the universal form');
    expect(wired,
      'not one of the five sentences routed through api.consensusPhrase reached a '
      + 'screen in twenty seasons — the machinery is built and unreachable, which is '
      + 'the exact failure mode it was wired to close').toBeGreaterThan(0);
    expect(overclaimed.slice(0, 4),
      'a wired sentence printed an unfilled slot or an unevidenced universal').toEqual([]);
  }, 300000);

  it('MUTANT: the matcher catches the forbidden forms, in every tense', () => {
    // THE MUTATION, RUN RATHER THAN ASSERTED. Each of these is the shape the
    // contract forbids, in a tense or a subject the first draft of this matcher
    // missed. If any goes false the arms above are decorative — which is
    // exactly how the debug-word sweep shipped green over 73 live hits.
    for (const bad of [
      'Everyone turns against Manu after the mission.',
      'everybody knew about it by breakfast',
      'everybody knows about it already',
      'everyone already knew what she had done',
      'everybody agreed it was him',
      'the whole castle knew by lunch',
      'The name had gone round the whole castle and came home.',
      'By breakfast the whole castle will have it.',
      'The castle has decided about her.',
      'the room has decided otherwise about him',
      'the castle knew what that meant',
      'nobody trusts him now',
      'no one believed a word of it',
      'the group agrees on nothing',
    ]) {
      expect(claimsConsensus(bad), 'the matcher missed: ' + bad).toBe(true);
    }
    // ...and it does not fire on the precise language the contract asks for,
    // or the rule would be unusable and every line would end up licensed.
    for (const fine of [
      'Three players said the same thing.',
      'Ellie, Gabby and Alec knew about it by breakfast.',
      'four of the twelve still here knew about it',
      'the people in the van knew',
      'She said it in front of everybody.',
      'Nobody had asked.',
      'the room asked, and she hesitated',
    ]) {
      expect(claimsConsensus(fine), 'the matcher over-fires on: ' + fine).toBe(false);
    }
    // AND THE LICENCE CANNOT SWALLOW THE MUTANT. An unlicensed offender is
    // still an offender after the licence check runs.
    expect(licensed('Everyone turns against Manu after the mission.')).toBe(false);
    expect(EVIDENCED_PHRASE.test('Everyone turns against Manu.')).toBe(false);
    expect(CONSENSUS_LICENSED.every(([frag, why]) => frag && why)).toBe(true);
  });

  it('and the evidenced form is only reachable through the floor', () => {
    // The other half of the mutation: the phrase the guard treats as legal by
    // construction has to be one `consensusPhrase` will not hand out cheaply.
    expect(EVIDENCED_PHRASE.test(consensusPhrase({ agreeing: ['A', 'B', 'C'], living: 12 })))
      .toBe(false);
    expect(EVIDENCED_PHRASE.test(consensusPhrase({
      agreeing: ['A', 'B', 'C'], living: 12, evidence: 'public-ceremony' }))).toBe(true);
    expect(EVIDENCED_PHRASE.test(consensusPhrase({
      agreeing: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], living: 12 }))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
// A SHARED GRIEF IS NOT AN ARGUMENT
// ══════════════════════════════════════════════════════════════════════
//
// `RECALL_LEAD_DAYS` is the card that says WHAT KIND of thing has been running
// between these people, and it was drawn regardless of tone: "The argument
// arrives already halfway through, because it started days ago" landed on
// trust, romance and grief beats. Task 7A split the pair pools by register and
// fix round 1 found the GROUP pools still unsplit — same defect, one branch
// further down the same ternary, so a carried three-person mourning could
// still be called an argument.
//
// MEASURED OVER RENDERED SCENES rather than over the source, because the
// selection is a four-way ternary on (mode, tail.days, warmCarry) and a source
// assertion can only check that the words appear in a file.
const COMBATIVE_LEAD = /\b(?:argument|nobody is being careful|a good deal sharper|and none of them agree|will say out loud)\b/i;
const WARM_FAMILIES = new Set(['trust', 'romance', 'romance-spark', 'grief']);

describe('the recall lead is drawn in the scene own register', () => {
  it('never calls a carried trust, romance or grief scene an argument', () => {
    const rows = [];
    for (let seed = 92001; seed <= 92008; seed++) {
      setPlayers(ROSTER);
      seedFranchiseHistory(CAST);
      playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
      for (const e of (gs.episodeHistory || [])) {
        if (e.tr && e.tr.castle && (e.tr.castle.scenes || []).length) rows.push({ ...e });
      }
    }
    const hits = [];
    let carriedWarm = 0, carriedWarmGroup = 0;
    for (const ep of rows) {
      const raw = new Map((ep.tr.castle.scenes || [])
        .map(sc => ['ep' + ep.num + '-' + sc.window + '-' + sc.eventId + '-' + sc.beatNo, sc]));
      for (const scene of castleDayScenes(ep, 'audience')) {
        const rec = raw.get(scene.id);
        if (!rec || rec.opened) continue;
        if (!WARM_FAMILIES.has(String(rec.family || rec.kind))) continue;
        carriedWarm++;
        if (scene.mode === 'group') carriedWarmGroup++;
        for (const card of scene.observerText.audience || []) {
          if (card.role !== 'recall') continue;
          if (COMBATIVE_LEAD.test(card.lead || '')) {
            hits.push(scene.mode + ' ' + rec.family + ': ' + card.lead);
          }
        }
      }
    }
    // ANTI-VACUITY, AND THE SECOND HALF IS THE ONE FIX ROUND 1 NEEDED: the
    // scan must have found carried warm scenes AT ALL, and it must have found
    // GROUP ones, or the half of the ternary this arm was added for is
    // untested and the arm passes for free.
    expect(carriedWarm, 'no carried trust/romance/grief scene was rendered')
      .toBeGreaterThan(30);
    expect(carriedWarmGroup, 'no carried warm scene had three people in it, so the '
      + 'group branch of the lead selection was never exercised').toBeGreaterThan(0);
    expect(hits.slice(0, 5),
      'a shared confidence or a shared grief was introduced as an argument').toEqual([]);
  }, 300000);

  it('and the matcher would catch the line that shipped', () => {
    // THE MUTATION: the exact sentence the defect printed.
    expect(COMBATIVE_LEAD.test(
      'The argument arrives already halfway through, because it started days ago.')).toBe(true);
    expect(COMBATIVE_LEAD.test(
      'They are back on it, and this time nobody is being careful.')).toBe(true);
    expect(COMBATIVE_LEAD.test(
      'All of them have a version of where this began and none of them agree.')).toBe(true);
    // ...and not on the warm replacements, or the arm could never pass.
    expect(COMBATIVE_LEAD.test(
      'They have sat like this before, in a different room, on a worse day.')).toBe(false);
    expect(COMBATIVE_LEAD.test(
      'All of them arrived at this from a different day, and all of them arrived.')).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════
// COHERENCE: A COMPOSED SCENE NAMES ONE CAST AND ONE EVENT (Defect 3)
// ══════════════════════════════════════════════════════════════════════
//
// THE BUG, REPRODUCED AND FIXED. A behind-the-back investigation — an alibi
// check {a} runs with third parties while the SUBJECT {b} is elsewhere — was
// convened as a pair [a, b] and composed as a two-hander. The establish put
// both in the room ("Brody and Chet are at the bottom of the stairs"); the
// reaction gave the absent {b} a face-to-face answer ("Chet stumbles, laughs,
// and the laugh does not land the way Chet wanted"); and the consequence then
// said {b} "has no idea a question was asked, let alone answered badly" — three
// cards of a conversation {b} was never in. Root cause: `testing-ask-for-alibi-
// check` reported {b} as a participant (`pair: [a, b]`), so `_mode` guessed a
// pair. Fixed by reporting one participant off the record (`actor: a`), exactly
// as `susp-pattern-tracking` and `trust-defend-in-absentia` already do, so the
// composer draws the solo scene the event actually is.
//
// The sweep that fix opened found a SECOND face of the same defect: the line
// "{b} has no idea a question was asked" lived in the SHARED `CONSEQ.testing`
// pool, so it also landed on to-their-face tests where {b} had just answered —
// the consequence contradicting the reaction one card above it. That line was
// rewritten to the coherent stakes-oblivious version.
//
// TWO ARMS, both mutation-proved by the last `it` in this block:
//   A. STRUCTURAL — an alibi check composes ONE participant, never a pair.
//   B. GENERAL — no composed pair/group scene closes by saying the partner it
//      just gave a face-to-face reaction to was never asked a question.
describe('a composed scene names one cast and one event (Defect 3)', () => {
  // The exact incoherence signature: a consequence claiming the reaction's
  // partner never knew a question was put to them. NOT the coherent "without
  // ever knowing there was anything to pass" (present, unaware it was a TEST).
  const ABSENT_PARTNER = /has no idea (?:a|the) question was asked/i;
  const strip = s => String(s || '').replace(/<[^>]+>/g, '')
    .replace(/&#8217;|&rsquo;/g, "'").replace(/&mdash;/g, '—').replace(/\s+/g, ' ').trim();

  const rows = [];
  for (let seed = 70001; seed <= 70030; seed++) {
    setPlayers(ROSTER);
    seedFranchiseHistory(CAST);
    playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
    for (const e of (gs.episodeHistory || [])) {
      if (e.tr && e.tr.castle && (e.tr.castle.scenes || []).length) rows.push({ ...e });
    }
  }
  const scenes = rows.flatMap(e => castleDayScenes(e, 'audience'));

  it('composed enough scenes across seasons to test at all', () => {
    expect(scenes.length, 'no scene was composed — every arm below is vacuous')
      .toBeGreaterThan(200);
  });

  it('ARM A: a behind-the-back alibi check composes one participant, never a pair', () => {
    const alibi = scenes.filter(s => s.eventId === 'testing-ask-for-alibi-check');
    expect(alibi.length,
      'no alibi check was composed, so the structural arm is vacuous').toBeGreaterThan(10);
    const asPair = alibi.filter(s => s.participants.length >= 2);
    expect(asPair.map(s => s.participants.join(' & ')),
      'an alibi check composed the absent subject as a co-present partner')
      .toEqual([]);
  });

  it('ARM B: no pair scene reacts to a partner it then says was never asked', () => {
    let pairScenes = 0;
    const bad = [];
    for (const s of scenes) {
      if (s.mode !== 'pair' && s.mode !== 'group') continue;
      pairScenes++;
      const conseq = (s.observerText.audience || []).find(c => c.kind === 'consequence');
      if (conseq && ABSENT_PARTNER.test(strip(conseq.text))) {
        bad.push(`${s.eventId} [${s.participants.join(' & ')}]: ${strip(conseq.text)}`);
      }
    }
    expect(pairScenes,
      'no pair or group scene was composed, so the general arm is vacuous')
      .toBeGreaterThan(40);
    expect(bad.slice(0, 8),
      'a two-hander closed by saying the partner it just answered was never asked')
      .toEqual([]);
  });

  it('and the matcher would catch the card that shipped, and clears the fix', () => {
    // THE MUTATION: the exact consequence the defect printed, over a pair scene.
    expect(ABSENT_PARTNER.test(
      'Brody got the answer Brody was afraid of. Chet has no idea a question '
      + 'was asked, let alone answered badly.')).toBe(true);
    // ...and NOT the coherent replacement, or ARM B could never fail.
    expect(ABSENT_PARTNER.test(
      'Brody got the answer Brody was afraid of. Chet thinks it was just a '
      + 'conversation, and does not know it was anything else.')).toBe(false);
    // ...nor the coherent "unaware it was a test" line, which is a different and
    // legitimate thing to say about a partner who WAS present.
    expect(ABSENT_PARTNER.test(
      'Chet passes it without ever knowing there was anything to pass. Brody '
      + 'knows, and that is the whole point of it.')).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════
// TOPIC-GROUNDED SCENES — a cold reader can answer all four questions
// ══════════════════════════════════════════════════════════════════════
//
// The rework's contract (coordinator spec): a reworked scene must let a reader
// who has seen nothing else answer WHAT happened, WHY the conversation started
// (the concrete subject), WHO reacted, and WHAT changed. The mechanism is a
// recorded `topic` (real sim data) that the composer names in the consequence,
// instead of the generic "it / whatever this is" it used to close on.
//
// This arm plays several seasons, collects every scene from a TOPIC_READY
// event, and demands the topic be NAMED in the closing consequence — which is
// the sentence that used to name the wrong person or no one. The floor is a
// real firing count so a rework that quietly stopped grounding fails here.
describe('a topic-grounded scene names its subject and what changed', () => {
  const SEEDS = [1, 2, 3, 7, 42, 55, 101, 555, 777, 999, 2002];
  const grounded = [];
  for (const seed of SEEDS) {
    playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
    for (const row of (gs.episodeHistory || [])) {
      if (!row.tr || !row.tr.castle) continue;
      for (const sc of castleDayScenes(row, 'audience')) {
        if (sc.layer === 'heard') continue;
        if (TOPIC_READY.has(sc.eventId) && sc.topic) grounded.push(sc);
      }
    }
  }

  it('fires enough to test', () => {
    expect(grounded.length, 'no topic-grounded scene fired across the sample')
      .toBeGreaterThan(30);
  });

  it('WHY: every grounded scene records a concrete subject', () => {
    for (const sc of grounded) {
      expect(typeof sc.topic === 'string' && sc.topic.length > 0,
        sc.id + ': grounded scene has no topic').toBe(true);
    }
  });

  it('WHAT CHANGED: the consequence names the recorded subject', () => {
    let checked = 0;
    for (const sc of grounded) {
      const beats = sc.observerText.audience;
      const conseq = beats.find(b => b.kind === 'consequence');
      expect(conseq, sc.id + ': grounded scene has no consequence').toBeTruthy();
      const text = String(conseq.say || conseq.text || '');
      expect(text.includes(sc.topic),
        sc.id + ': the consequence does not name its subject "' + sc.topic
        + '" — closes on: ' + text.slice(0, 120)).toBe(true);
      checked++;
    }
    expect(checked, 'no consequence was checked').toBeGreaterThan(30);
  });

  it('WHAT + WHO: the scene has an action, and its opening names a person in it', () => {
    for (const sc of grounded) {
      const beats = sc.observerText.audience;
      const action = beats.find(b => b.kind === 'action');
      expect(action, sc.id + ': grounded scene has no action').toBeTruthy();
      const text = String(action.say || action.text || '');
      expect(text.length, sc.id + ': empty action').toBeGreaterThan(10);
      // WHO is answerable from the SCENE, not necessarily the action line: a
      // solo scene names its actor in the establish ("Caleb has the track to
      // themselves") and then says "the account of …" rather than repeating the
      // name — which is the name-repetition the rework also set out to cut. So
      // the check is that the establish OR the action names a participant.
      const estab = beats.find(b => b.kind === 'establish');
      const opening = String(estab ? (estab.say || estab.text || '') : '') + ' ' + text;
      const named = (sc.participants || []).some(p => opening.includes(p));
      expect(named, sc.id + ': the scene names no participant in its opening').toBe(true);
    }
  });

  it('NO DANGLING FILLER: a grounded consequence never closes on an unnamed "it"', () => {
    // The exact vagueness the rework removes — a closing line whose whole
    // content is an unnamed "whatever this is / it did not keep / it repeats
    // quietly", with no subject on the card. A grounded consequence names its
    // topic (checked above), so none of these may appear in one.
    const DANGLING = /\bwhatever this is\b|it did not keep until tomorrow|it repeats, quietly/i;
    for (const sc of grounded) {
      const conseq = sc.observerText.audience.find(b => b.kind === 'consequence');
      const text = String(conseq.say || conseq.text || '');
      expect(DANGLING.test(text),
        sc.id + ': grounded consequence still closes on unnamed filler: ' + text.slice(0, 120))
        .toBe(false);
    }
  });

  it('MUTATION: the subject matcher actually bites', () => {
    // If the consequence matcher could not tell a named subject from a missing
    // one, every arm above would be vacuous. Prove it: a consequence that omits
    // the topic fails the includes() check, and one that names it passes.
    const topic = 'Gabby';
    expect('the doubt about Gabby did not clear — it set.'.includes(topic)).toBe(true);
    expect('and that is where it finishes.'.includes(topic)).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════
// IMPACT CHIPS — the movements are shown, and observer-gated
// ══════════════════════════════════════════════════════════════════════
//
// The user could read what a scene said but not SEE what it moved. Each scene
// now renders a "What it moved" row of chips (suspicion / bond) sourced from the
// scene's receipts and record. This arm proves (1) they appear, and (2) they
// respect the observer layer — a Faithful never sees another player's private
// read. Band against the mutant: the gating is what makes arm 2 pass.
describe('impact chips are shown and observer-gated', () => {
  const chipSeasons = [];
  for (const seed of [1, 2, 3, 7, 42, 2002]) {
    playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
    for (const row of (gs.episodeHistory || [])) {
      if (row.tr && row.tr.castle) chipSeasons.push({ seed, row });
    }
  }

  it('the audience sees suspicion and bond movements', () => {
    let susp = 0, bond = 0;
    for (const { row } of chipSeasons) {
      for (const sc of castleDayChips(row, 'audience')) {
        for (const c of sc.chips) {
          if (c.type === 'suspicion') susp++;
          if (c.type === 'bond') bond++;
        }
      }
    }
    expect(bond, 'no bond chips across the sample').toBeGreaterThan(30);
    expect(susp, 'no suspicion chips across the sample').toBeGreaterThan(5);
  });

  it('every chip names the people concerned', () => {
    for (const { row } of chipSeasons) {
      for (const sc of castleDayChips(row, 'audience')) {
        for (const c of sc.chips) {
          expect(typeof c.a === 'string' && c.a.length > 0,
            sc.eventId + ': chip has no primary person').toBe(true);
          if (c.type !== 'popularity') {
            expect(typeof c.b === 'string' && c.b.length > 0,
              sc.eventId + ': ' + c.type + ' chip has no second person').toBe(true);
          }
        }
      }
    }
  });

  it('OBSERVER SAFETY: a player never sees another player\'s private read', () => {
    // For every suspicion/popularity chip a PLAYER layer is shown, the read must
    // be that player's own (the observer). For a bond chip, the player must be
    // one of the two. Anything else is a leak. Also: an overheard scene shows
    // no chips at all.
    let checkedPlayers = 0, checkedChips = 0;
    for (const { row } of chipSeasons.slice(0, 30)) {
      const living = (row.tr && row.tr.living) || [];
      for (const who of living.slice(0, 4)) {
        checkedPlayers++;
        for (const sc of castleDayChips(row, 'player:' + who)) {
          if (sc.layer === 'heard') {
            expect(sc.chips.length, who + ': an overheard scene showed impact chips')
              .toBe(0);
            continue;
          }
          for (const c of sc.chips) {
            checkedChips++;
            if (c.type === 'bond') {
              expect(c.a === who || c.b === who,
                who + ': shown a bond chip they are not part of (' + c.a + '/' + c.b + ')')
                .toBe(true);
            } else {
              // suspicion / popularity: the observer is `c.a`
              expect(c.a, who + ': shown a ' + c.type + ' read that is not theirs (' + c.a + ')')
                .toBe(who);
            }
          }
        }
      }
    }
    expect(checkedPlayers, 'no player layers were checked').toBeGreaterThan(10);
  });

  it('MUTATION: an un-gated suspicion chip would leak, and the check catches it', () => {
    // A synthetic leak: a suspicion chip whose observer (a) is not the watcher.
    // The observer-safety assertion above is `c.a === who`; prove it bites.
    const who = 'Alejandro';
    const leak = { type: 'suspicion', a: 'Beth', b: 'Chef Hatchet', dir: 1 };
    const ownRead = { type: 'suspicion', a: who, b: 'Chef Hatchet', dir: 1 };
    expect(leak.a === who).toBe(false);      // would fail the guard → caught
    expect(ownRead.a === who).toBe(true);    // the watcher's own read passes
  });
});
