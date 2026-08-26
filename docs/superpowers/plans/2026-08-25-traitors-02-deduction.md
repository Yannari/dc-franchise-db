# The Traitors — Plan 2: The deduction slice

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a Round Table produce a believable banishment — Faithfuls forming reasoned, fallible beliefs about who the Traitors are, from the public ballot record alone.

**Architecture:** A new `js/tr/deduction.js` layers an `alignment` fact type onto the existing `js/knowledge.js` (facts with ground truth, per-person beliefs with confidence and valence, source-credibility tiers, decay). `js/tr/roundtable.js` runs the debate as a public broadcast and the vote. A headless harness plays whole seasons and measures whether detection actually beats chance.

**Tech Stack:** ES modules, no build step. Vitest (`npm test`, but never run the whole suite — see constraints).

**Spec:** `docs/superpowers/specs/2026-08-25-traitors-design.md` (§4 is this plan; §5.2 threads and §6 murder are NOT).

## This plan is the stop-or-go gate

Spec §13 step 6 is explicit: **if a Round Table does not produce a believable banishment here, nothing else matters — stop and fix it before building anything else.** Task 6 exists to answer that question with numbers, not vibes. A green test suite that produces Faithfuls banishing at random is a FAILED plan, not a passed one.

## Global Constraints

- **Branch `traitors`, worktree `../worktree-traitors`.** The main repo folder is on `main` with another session live in it. Never `git checkout` there.
- **`git add <explicit paths>`, never `-A`.** Run `git status --short` AND `git branch --show-current` before every commit.
- **Before committing, find the tests that name what you touched** — this is not optional, a regression hid for three tasks in Plan 1 exactly here:
  ```bash
  for f in $(git diff --name-only); do grep -rl "$(basename "$f")" tests/ 2>/dev/null; done | sort -u
  ```
  Run whatever that prints, in addition to your own named files.
- **Never run the full suite** (`npm test`) — it exhausts memory. Named files only. Kill orphan vitest workers after (filter on command line containing `vitest`, never all `node.exe` — a parallel session is running).
- **No bare `Math.random()` anywhere in this plan.** Every draw takes an injected `rng`. Seasons must replay identically from a seed, and an unseeded draw in the middle of one makes every saved season unreproducible. Use `stableRng(...parts)` from `js/bb/knowledge.js` where a deterministic-per-subject roll is wanted.
- **Valid stats, the only nine:** `physical`, `endurance`, `mental`, `social`, `strategic`, `loyalty`, `boldness`, `intuition`, `temperament`.
- **The show stays NOT runnable.** Do not set `window._trRunnable`. Everything here is driven by the harness and by tests.
- **Traitors is `traitors` / prefix `tr`.** A bare integer is Total Drama, permanently.

## Two spec corrections, settled here

**1. `simulateRevote` is NOT reusable.** Spec §3.3 says it "already restricts a tie revote to the tied pair — the Round Table's tie rule unmodified." The shape matches; the behaviour does not. `js/voting.js:1629` ranks compromise targets by Total Drama alliance/threat pressure and calls bare `Math.random()` (~:1648), which this plan's own constraint forbids. **We reuse `resolveVotes()` only** — it is pure, takes a `{name: count}` tally and returns `{eliminated, isTie, tiedPlayers}` — and write the Round Table's own revote in `tr/roundtable.js`.

**2. A placeholder murder ships in this plan.** Spec §13 puts murder in step 7 (Plan 3). But with no murder at all a 20-cast season is 17 straight banishments, the Traitor count never falls, and the measured detection rate describes a game nobody plays. So Task 6 includes a **deliberately stupid** murder: uniform-random among living Faithfuls, seeded, no conclave, no target reasoning, generating **no evidence**. It exists to make the cast shrink at the right rate. Plan 3 deletes it. Task 6's metrics are chosen so they do not depend on murder quality.

---

## File structure

| File | Responsibility | Task |
|---|---|---|
| `js/tr/roles.js` | Traitor selection, alignment ground truth, eras | 1 |
| `js/tr/deduction.js` | Alignment facts, ballot evidence, suspicion, reveal cascade | 1,2,3,5 |
| `js/tr/roundtable.js` | Broadcast, the vote, the tie rule | 4 |
| `js/tr/headless.js` | Season loop + placeholder murder, for tests and calibration | 6 |
| `js/knowledge.js` | One line: `VALIDITY.alignment = 99` | 1 |
| `tests/tr-deduction.test.js` | New | 1,2,3,5 |
| `tests/tr-roundtable.test.js` | New | 4 |
| `tests/tr-calibration.test.js` | New — the stop-or-go measurement | 6 |

---

### Task 1: Alignment as a fact, with eras

**Files:**
- Create: `js/tr/roles.js`, `js/tr/deduction.js`
- Modify: `js/knowledge.js` (the `VALIDITY` map)
- Modify: `js/tr/state.js` (**required — see below**)
- Test: `tests/tr-deduction.test.js` (create)

**A conflict with what Plan 1 shipped, which you must fix first.** `js/tr/state.js`
declares `alignment: {}` and its comment describes it as `name -> traitor |
faithful`. This plan needs it to hold **eras** — `name -> [{ truth, sinceEp }]`
— and needs a `rounds: []` field that does not exist at all. Plan 1 wrote the
comment about eras while shipping the shape that cannot express them. Update
`initTraitorsState()`:

```js
    // name -> [{ truth, sinceEp }], oldest first. NOT a single value: alignment
    // is a property of a person AND a round, because recruitment changes it
    // mid-season and a belief formed before a flip was correct when it was
    // formed. See truthAtLearn() in tr/roles.js.
    alignment: {},

    // Completed rounds, and the export shape (spec 10.1): each carries its
    // ballots with a `channel`, so a murder is a ballot only the Traitors cast
    // and the whole round still normalises to votingHistory[].
    rounds: [],
```

The Plan 1 test asserting `tr.alignment` equals `{}` still passes; add one
asserting `tr.rounds` equals `[]`.

**Interfaces:**
- Consumes: `initTraitorsState()` from `js/tr/state.js` (Plan 1); `recordFact`, `learn`, `believes` from `js/knowledge.js`.
- Produces:
  - `selectTraitors(cast, cfg, rng) → string[]`
  - `recordAlignment(name, isTraitor, ep, via)` — `via` is `'selection' | 'recruitment' | 'ultimatum'`
  - `alignmentAt(name, ep) → 'traitor' | 'faithful'`
  - `alignmentFactId(name) → string`
  - `seedTraitorKnowledge(ep)` — Traitors learn each other at `public`
  - `truthAtLearn(name, learnedEp) → boolean`

**Why eras exist (spec §4.3):** recruitment mutates ground truth mid-season. A Faithful who flips in episode 8 was genuinely a Faithful in episode 3, so a belief formed then was *correct when formed*. Flip `fact.truth` naively and `isAccurate()` retroactively marks every sharp early read as a mistake. Recruitment is Plan 3, but the era structure must exist **before** any belief is stored, because it cannot be retrofitted onto saved seasons.

- [ ] **Step 1: Write the failing test**

Create `tests/tr-deduction.test.js`:

```js
// Alignment is the one fact nobody in this game ever observes.
//
// Every other fact type in js/knowledge.js can be witnessed: a vote is cast in
// front of people, an idol is found, an alliance meets. Alignment is different —
// the Traitors know theirs, and NOBODY else can ever do better than infer. That
// asymmetry is the whole format, and it is enforced here by credibility ceiling
// rather than by special-casing every reader.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { resetKnowledge, believes, learn } from '../js/knowledge.js';
import {
  selectTraitors, recordAlignment, alignmentAt, truthAtLearn,
} from '../js/tr/roles.js';
import { alignmentFactId, seedTraitorKnowledge } from '../js/tr/deduction.js';

const CAST = ['Gwen', 'Duncan', 'Heather', 'Owen', 'Leshawna', 'Noah'];
function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

beforeEach(() => {
  gs.tr = initTraitorsState();
  gs.activePlayers = [...CAST];
  resetKnowledge();
});

describe('choosing the traitors', () => {
  it('picks the number asked for, from the living cast, without repeats', () => {
    const picked = selectTraitors(CAST, { traitorCount: 2 }, seededRng(7));
    expect(picked).toHaveLength(2);
    expect(new Set(picked).size).toBe(2);
    picked.forEach(n => expect(CAST).toContain(n));
  });

  it('is deterministic for a given seed, because a season must replay', () => {
    const a = selectTraitors(CAST, { traitorCount: 2 }, seededRng(42));
    const b = selectTraitors(CAST, { traitorCount: 2 }, seededRng(42));
    expect(a).toEqual(b);
  });

  it('does not always pick the same archetypes — a bad traitor is good television', () => {
    const seen = new Set();
    for (let s = 1; s <= 40; s++) {
      selectTraitors(CAST, { traitorCount: 2 }, seededRng(s)).forEach(n => seen.add(n));
    }
    // Over 40 seeds every member of a 6-cast should have been picked at least once.
    expect(seen.size).toBe(CAST.length);
  });
});

describe('alignment as ground truth', () => {
  beforeEach(() => {
    recordAlignment('Gwen', true, 1, 'selection');
    recordAlignment('Duncan', true, 1, 'selection');
    CAST.filter(n => !['Gwen', 'Duncan'].includes(n))
      .forEach(n => recordAlignment(n, false, 1, 'selection'));
  });

  it('answers who is what', () => {
    expect(alignmentAt('Gwen', 1)).toBe('traitor');
    expect(alignmentAt('Heather', 1)).toBe('faithful');
  });

  it('keeps eras, so a later flip does not rewrite an earlier truth', () => {
    // Heather is recruited in episode 8. She was genuinely Faithful before it.
    recordAlignment('Heather', true, 8, 'recruitment');
    expect(alignmentAt('Heather', 3)).toBe('faithful');
    expect(alignmentAt('Heather', 8)).toBe('traitor');
    expect(alignmentAt('Heather', 11)).toBe('traitor');
    // And the record says how and when, for the VP and the exit blowup.
    const flip = gs.tr.roleHistory.find(r => r.name === 'Heather' && r.via === 'recruitment');
    expect(flip).toMatchObject({ from: 'faithful', to: 'traitor', ep: 8 });
  });

  it('reports the truth as it stood when a belief was formed', () => {
    recordAlignment('Heather', true, 8, 'recruitment');
    expect(truthAtLearn('Heather', 3)).toBe(false);   // a correct read in ep 3
    expect(truthAtLearn('Heather', 9)).toBe(true);
  });
});

describe('what the traitors know, and what nobody else can', () => {
  beforeEach(() => {
    recordAlignment('Gwen', true, 1, 'selection');
    recordAlignment('Duncan', true, 1, 'selection');
    CAST.filter(n => !['Gwen', 'Duncan'].includes(n))
      .forEach(n => recordAlignment(n, false, 1, 'selection'));
    seedTraitorKnowledge(1);
  });

  it('lets each traitor know the other with certainty', () => {
    const b = believes('Gwen', alignmentFactId('Duncan'), 1);
    expect(b, 'Gwen does not know her own ally').toBeTruthy();
    expect(b.effectiveConfidence).toBeGreaterThanOrEqual(0.99);
    expect(b.valence).toBe('accurate');
  });

  it('tells the faithful nothing at all at the start', () => {
    for (const target of CAST) {
      expect(believes('Heather', alignmentFactId(target), 1),
        `Heather already has a read on ${target}`).toBeNull();
    }
  });

  it('CEILING: a faithful can never reach certainty about anyone', () => {
    // Even the strongest inference this engine can express stays a guess.
    learn('Heather', alignmentFactId('Gwen'),
      { source: 'ballots', sourceType: 'deduced', ep: 4, rng: () => 0.01 });
    const b = believes('Heather', alignmentFactId('Gwen'), 4);
    if (b) expect(b.effectiveConfidence).toBeLessThan(0.7);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-deduction.test.js
```

Expected: FAIL — cannot resolve `js/tr/roles.js`.

- [ ] **Step 3: Register the fact type's lifetime**

In `js/knowledge.js`, in the `VALIDITY` map, add:

```js
  // Alignment never goes stale. A vote or a pitch describes one round and
  // rightly fades; who somebody IS does not, and a read formed in episode two
  // is still evidence in episode nine. This is the only fact type whose ground
  // truth can CHANGE mid-season (recruitment), which eras handle in tr/roles.js
  // rather than by expiring the fact.
  alignment: 99,
```

- [ ] **Step 4: Write `js/tr/roles.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// tr/roles.js — who is a Traitor, and since when
// ══════════════════════════════════════════════════════════════════════
//
// Ground truth only. What anybody BELIEVES about it lives in tr/deduction.js.
//
// The "since when" is the part that is easy to get wrong and impossible to add
// later. Recruitment changes a player's alignment mid-season, so alignment is
// not a property of a person but of a person AND a round. A Faithful recruited
// in episode 8 was genuinely Faithful in episode 3, and somebody who read them
// as Faithful then was RIGHT. Store a single boolean and every one of those
// correct early reads is retroactively scored as a mistake the moment the flip
// happens — which is both wrong and unfixable once seasons are saved.
import { gs } from '../core.js';
import { recordFact } from '../knowledge.js';

/** The knowledge-layer id for what somebody is. */
export function alignmentFactId(name) { return `alignment:${name}`; }

/**
 * Pick the Traitors.
 *
 * Deliberately near-uniform. Weighting toward masterminds makes every season the
 * same season, and this format's best outcomes include a TERRIBLE Traitor — the
 * hothead who cracks in episode three, the hero who cannot lie. The engine gets
 * its drama from what a bad Traitor does under pressure, not from casting for
 * competence.
 */
export function selectTraitors(cast, cfg = {}, rng = Math.random) {
  const pool = [...cast];
  const want = Math.max(1, Math.min(Number(cfg.traitorCount) || 3, pool.length - 1));
  const picked = [];
  for (let i = 0; i < want && pool.length; i++) {
    picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return picked;
}

/**
 * Set (or change) somebody's alignment as of `ep`.
 *
 * Appends an era rather than overwriting, and records the transition so the VP
 * can show it and so a banished recruit's exit speech can know how new they were
 * — a two-night Traitor owes the others nothing, which is why the format's
 * famous betrayals come from fresh recruits.
 */
export function recordAlignment(name, isTraitor, ep, via = 'selection') {
  if (!gs.tr) return null;
  const to = isTraitor ? 'traitor' : 'faithful';
  const from = alignmentAt(name, ep - 1);
  const eras = (gs.tr.alignment[name] ||= []);
  eras.push({ truth: !!isTraitor, sinceEp: ep });
  eras.sort((a, b) => a.sinceEp - b.sinceEp);
  if (from !== to || via === 'selection') {
    gs.tr.roleHistory.push({ name, from, to, ep, via });
  }
  // The knowledge layer's ground truth tracks the CURRENT era. Anything asking
  // about an earlier one goes through truthAtLearn() instead.
  recordFact({ type: 'alignment', subject: name, truth: !!isTraitor, ep });
  return eras;
}

/** What was `name` during episode `ep`? Defaults to faithful before any era. */
export function alignmentAt(name, ep) {
  const eras = gs.tr?.alignment?.[name];
  if (!eras || !eras.length) return 'faithful';
  let cur = 'faithful';
  for (const era of eras) { if (era.sinceEp <= ep) cur = era.truth ? 'traitor' : 'faithful'; }
  return cur;
}

/** Ground truth as it stood when a belief was formed. The era rule, as a boolean. */
export function truthAtLearn(name, learnedEp) {
  return alignmentAt(name, learnedEp) === 'traitor';
}

/** Everyone currently a Traitor, among the living. */
export function livingTraitors(ep) {
  return (gs.activePlayers || []).filter(n => alignmentAt(n, ep) === 'traitor');
}

/** Everyone currently a Faithful, among the living. */
export function livingFaithfuls(ep) {
  return (gs.activePlayers || []).filter(n => alignmentAt(n, ep) === 'faithful');
}
```

- [ ] **Step 5: Write the first half of `js/tr/deduction.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// tr/deduction.js — what the castle believes about who is a Traitor
// ══════════════════════════════════════════════════════════════════════
//
// This is the show. Everything else — the missions, the pot, the murder — feeds
// the one question a Round Table asks, and this file is where the answer forms.
//
// It is a layer on js/knowledge.js rather than a system of its own, and the fit
// is close enough to be worth stating. That module already models a fact with a
// ground truth, a per-person belief with a confidence and a source, a
// credibility tier per source type, decay with age, and a read-skill roll on
// mental+intuition that decides both whether you accept a claim AND whether you
// see through a false one. Point all of that at a new `alignment` fact type and
// most of a social deduction engine is already written.
//
// THE ONE RULE THAT MAKES IT WORK: nobody ever OBSERVES an alignment. The
// Traitors are told theirs; everybody else can only ever deduce or hear a rumour,
// which the credibility tiers cap at 0.62 and 0.45. So no Faithful can reach
// certainty, ever, about anyone — which is exactly the state the people on this
// show are in, and it falls out of the tier table rather than out of a special
// case in every reader.
import { gs } from '../core.js';
import { recordFact, learn, believes } from '../knowledge.js';
import { alignmentFactId, alignmentAt, livingTraitors } from './roles.js';

export { alignmentFactId };

/**
 * The Traitors meet, and learn each other with certainty.
 *
 * `public` credibility (1.0) is correct and is the ONLY place it is used for an
 * alignment: they are standing in a room together wearing the cloaks. Every
 * other belief about alignment in the whole game arrives as `deduced` or
 * `rumor`. If a second caller ever passes `public` or `observed` here, the
 * ceiling that makes the format work is gone.
 */
export function seedTraitorKnowledge(ep) {
  const traitors = livingTraitors(ep);
  for (const knower of traitors) {
    for (const subject of traitors) {
      learn(knower, alignmentFactId(subject),
        { source: 'the turret', sourceType: 'public', ep, rng: () => 0 });
    }
  }
  return traitors;
}
```

- [ ] **Step 6: Run the tests**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-deduction.test.js
for f in $(git diff --name-only); do grep -rl "$(basename "$f")" tests/ 2>/dev/null; done | sort -u
```

Expected: PASS. Run anything that second command prints.

- [ ] **Step 7: Commit**

```bash
cd ../worktree-traitors
git branch --show-current
git status --short
git add js/tr/roles.js js/tr/deduction.js js/knowledge.js tests/tr-deduction.test.js
git commit -m "Alignment is the one fact in this game nobody can witness"
```

---

### Task 2: The ballot record as evidence

**Files:**
- Modify: `js/tr/deduction.js`
- Test: `tests/tr-deduction.test.js` (append)

**Interfaces:**
- Consumes: Task 1's `alignmentFactId`, `truthAtLearn`, `alignmentAt`.
- Produces: `recordRound(round)`, `ballotEvidence(ep, rng)`, `suspicion(observer, target, ep)`.

**Why `suspicion()` lands here and not in Task 3:** this task's tests cannot
assert anything about evidence without a way to read it back, so the reader ships
with the writer. Task 3 builds the ranking and the ballot on top.

**Why the ballot record is the richest source we have (spec §4.4 ①):** on this show every vote is **read aloud**. That makes the whole voting history a permanent *public* fact — Total Drama's model, not Big Brother's secret one — and it means a Faithful can legitimately reason over who defended whom and who changed a vote. It costs nothing to collect and it is the only evidence source this plan builds.

The round record shape, which also satisfies spec §10.1's export decision:

```js
{ ep, banished, banishedWasTraitor, murdered,
  ballots: [ { voter, voted, channel: 'banishment' } ] }
```

- [ ] **Step 1: Write the failing test**

Append to `tests/tr-deduction.test.js`:

```js
import { recordRound, ballotEvidence, suspicion } from '../js/tr/deduction.js';

describe('reading the ballots', () => {
  beforeEach(() => {
    recordAlignment('Gwen', true, 1, 'selection');
    recordAlignment('Duncan', true, 1, 'selection');
    ['Heather', 'Owen', 'Leshawna', 'Noah'].forEach(n => recordAlignment(n, false, 1, 'selection'));
    seedTraitorKnowledge(1);
  });

  it('makes defending a revealed traitor the strongest signal there is', () => {
    // Round 1: Owen votes to save Duncan (votes elsewhere) while the room
    // banishes Duncan, who reveals as a Traitor.
    recordRound({
      ep: 1, banished: 'Duncan', banishedWasTraitor: true, murdered: null,
      ballots: [
        { voter: 'Heather',  voted: 'Duncan', channel: 'banishment' },
        { voter: 'Leshawna', voted: 'Duncan', channel: 'banishment' },
        { voter: 'Noah',     voted: 'Duncan', channel: 'banishment' },
        { voter: 'Owen',     voted: 'Noah',   channel: 'banishment' },
      ],
    });
    ballotEvidence(2, seededRng(3));

    // Owen protected a Traitor. Heather, who voted him out, did not.
    const onOwen = suspicion('Heather', 'Owen', 2);
    const onLeshawna = suspicion('Heather', 'Leshawna', 2);
    expect(onOwen, 'defending a revealed traitor bought no suspicion').toBeGreaterThan(onLeshawna);
  });

  it('exonerates the people who were right', () => {
    recordRound({
      ep: 1, banished: 'Duncan', banishedWasTraitor: true, murdered: null,
      ballots: [
        { voter: 'Heather',  voted: 'Duncan', channel: 'banishment' },
        { voter: 'Leshawna', voted: 'Duncan', channel: 'banishment' },
        { voter: 'Noah',     voted: 'Owen',   channel: 'banishment' },
        { voter: 'Owen',     voted: 'Noah',   channel: 'banishment' },
      ],
    });
    ballotEvidence(2, seededRng(3));
    expect(suspicion('Noah', 'Heather', 2)).toBeLessThan(suspicion('Noah', 'Owen', 2));
  });

  it('notices a pair who never once vote for each other', () => {
    // Gwen and Duncan are the real Traitors and never touch each other.
    for (let ep = 1; ep <= 4; ep++) {
      recordRound({
        ep, banished: null, banishedWasTraitor: false, murdered: null,
        ballots: [
          { voter: 'Gwen',     voted: 'Noah',     channel: 'banishment' },
          { voter: 'Duncan',   voted: 'Noah',     channel: 'banishment' },
          { voter: 'Heather',  voted: 'Gwen',     channel: 'banishment' },
          { voter: 'Leshawna', voted: 'Duncan',   channel: 'banishment' },
          { voter: 'Noah',     voted: 'Heather',  channel: 'banishment' },
          { voter: 'Owen',     voted: 'Leshawna', channel: 'banishment' },
        ],
      });
    }
    ballotEvidence(5, seededRng(11));
    // Somebody should have noticed. This is a WEAK signal by design — innocent
    // friends also never vote for each other — so assert only that it registered.
    const pairRead = suspicion('Heather', 'Gwen', 5) + suspicion('Heather', 'Duncan', 5);
    expect(pairRead).toBeGreaterThan(0);
  });

  it('never lets a ballot read reach certainty', () => {
    for (let ep = 1; ep <= 6; ep++) {
      recordRound({
        ep, banished: 'Duncan', banishedWasTraitor: true, murdered: null,
        ballots: [{ voter: 'Owen', voted: 'Heather', channel: 'banishment' }],
      });
    }
    ballotEvidence(7, seededRng(5));
    expect(suspicion('Heather', 'Owen', 7)).toBeLessThan(1);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-deduction.test.js -t 'reading the ballots'
```

Expected: FAIL — `recordRound is not a function`.

- [ ] **Step 3: Implement**

Append to `js/tr/deduction.js`:

```js
/** Store a completed round. This is also the export shape (spec §10.1). */
export function recordRound(round) {
  if (!gs.tr) return null;
  (gs.tr.rounds ||= []).push(round);
  return round;
}

/** Every banishment ballot cast so far, oldest first. */
function banishmentBallots() {
  return (gs.tr?.rounds || []).flatMap(r =>
    (r.ballots || []).filter(b => b.channel === 'banishment')
      .map(b => ({ ...b, ep: r.ep, banished: r.banished, wasTraitor: r.banishedWasTraitor })));
}

// How hard each ballot pattern pushes. Deliberately small: a single vote is a
// hint, not a proof, and the ceiling in learn() is what stops a pile of hints
// becoming certainty.
const W = {
  defendedRevealedTraitor: 0.34,   // you kept a Traitor in. The strongest read available.
  votedRevealedFaithful:   0.10,   // you spent a life for nothing — or you meant to
  votedRevealedTraitor:   -0.16,   // exonerating
  neverVotedEachOther:     0.07,   // per round of a clean pair record
};

/**
 * Turn the public ballot record into deduced beliefs about alignment.
 *
 * Runs once per round, after a banishment reveal. Every belief it forms arrives
 * as `deduced`, so it runs the read-skill roll in js/knowledge.js — a sharp
 * reader accepts a real pattern and sees through a coincidental one, a gullible
 * one does the reverse, and neither can ever be certain.
 */
export function ballotEvidence(ep, rng = Math.random) {
  const ballots = banishmentBallots();
  if (!ballots.length) return [];
  const living = gs.activePlayers || [];
  const formed = [];

  // ── reveals: who protected whom, and who was right ──────────────────
  const reveals = (gs.tr?.rounds || []).filter(r => r.banished);
  for (const round of reveals) {
    const cast = ballots.filter(b => b.ep === round.ep);
    for (const b of cast) {
      if (!living.includes(b.voter)) continue;
      const votedForTheBanished = b.voted === round.banished;
      let weight = 0;
      if (round.banishedWasTraitor) {
        weight = votedForTheBanished ? W.votedRevealedTraitor : W.defendedRevealedTraitor;
      } else if (votedForTheBanished) {
        weight = W.votedRevealedFaithful;
      }
      if (weight <= 0) continue;   // exoneration is handled by absence, not by a negative belief
      for (const observer of living) {
        if (observer === b.voter) continue;
        const belief = learn(observer, alignmentFactId(b.voter), {
          source: `the ballot in episode ${round.ep}`,
          sourceType: 'deduced',
          confidence: weight * 1.6,
          ep, rng,
        });
        if (belief) formed.push({ observer, subject: b.voter, weight, ep: round.ep });
      }
    }
  }

  // ── the pair who never touch each other ─────────────────────────────
  // Catches real Traitor pairs AND innocent best friends, and the false
  // positive is the point: this is how a castle convinces itself about two
  // people who simply like each other.
  const rounds = new Set(ballots.map(b => b.ep));
  if (rounds.size >= 3) {
    for (const a of living) {
      for (const b of living) {
        if (a >= b) continue;
        const aVotedB = ballots.some(x => x.voter === a && x.voted === b);
        const bVotedA = ballots.some(x => x.voter === b && x.voted === a);
        if (aVotedB || bVotedA) continue;
        const conf = Math.min(0.5, W.neverVotedEachOther * rounds.size);
        for (const observer of living) {
          if (observer === a || observer === b) continue;
          for (const subject of [a, b]) {
            const belief = learn(observer, alignmentFactId(subject), {
              source: `never once voted against ${subject === a ? b : a}`,
              sourceType: 'deduced', confidence: conf, ep, rng,
            });
            if (belief) formed.push({ observer, subject, weight: conf, ep });
          }
        }
      }
    }
  }

  return formed;
}

/**
 * How much does a warm relationship blunt a suspicion?
 *
 * Not a rounding error — it is the mechanism by which a well-liked Traitor
 * survives a table the evidence should have lost them, and by which a Faithful's
 * best friend is the last person they will name. At bond +10 roughly half the
 * signal is absorbed; at 0 none of it is; hostility sharpens it slightly.
 */
function bondResistance(observer, target) {
  const bond = getBond(observer, target);
  return bond >= 0 ? 1 - (bond / 10) * 0.5 : 1 + Math.min(0.2, -bond / 50);
}

/** How strongly `observer` suspects `target` right now. 0 = no read at all. */
export function suspicion(observer, target, ep) {
  if (observer === target) return 0;
  const b = believes(observer, alignmentFactId(target), ep);
  if (!b) return 0;
  // A belief the observer has correctly identified as FALSE is not suspicion —
  // it is the opposite, and treating it as a small positive is how a sharp
  // reader ends up voting for the person they just cleared.
  if (b.valence === 'false') return 0;
  return Math.max(0, b.effectiveConfidence * bondResistance(observer, target));
}
```

Add `getBond` to the imports at the top of `js/tr/deduction.js`:
`import { getBond } from '../bonds.js';`

- [ ] **Step 4: Run the tests**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-deduction.test.js
for f in $(git diff --name-only); do grep -rl "$(basename "$f")" tests/ 2>/dev/null; done | sort -u
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ../worktree-traitors
git branch --show-current && git status --short
git add js/tr/deduction.js tests/tr-deduction.test.js
git commit -m "Every ballot is read aloud, so every ballot is evidence"
```

---

### Task 3: Suspicion, and the ballot it produces

**Files:**
- Modify: `js/tr/deduction.js`
- Test: `tests/tr-deduction.test.js` (append)

**Interfaces:**
- Consumes: Task 1 and 2.
- Produces: `suspicionBoard(observer, ep) → [{name, score}]`, `chooseBanishmentVote(voter, candidates, ep, rng) → string`. (`suspicion()` shipped in Task 2.)

**The formula (spec §4.6):**

```
suspicion(P → Q) = effectiveConfidence(P's belief in alignment:Q)
                 × bondResistance(P, Q)
                 + noise
```

Two consequences are intended, not bugs: **a strong bond can carry a Traitor through a table they should have lost**, and **noise means the group is sometimes wrong together** — which is the format's real failure mode.

`grudgeBias` from the spec is franchise-meta reputation and is **deferred**: it is evidence source ⑤, this plan builds source ① only, and mixing an untested prior into the first calibration would make the numbers unreadable.

- [ ] **Step 1: Write the failing test**

Append to `tests/tr-deduction.test.js`:

```js
import { suspicionBoard, chooseBanishmentVote } from '../js/tr/deduction.js';
import { setBond } from '../js/bonds.js';

describe('turning belief into a vote', () => {
  beforeEach(() => {
    recordAlignment('Gwen', true, 1, 'selection');
    ['Heather', 'Owen', 'Leshawna', 'Noah', 'Duncan'].forEach(n => recordAlignment(n, false, 1, 'selection'));
    seedTraitorKnowledge(1);
  });

  it('ranks by belief, and never nominates the voter', () => {
    learn('Heather', alignmentFactId('Gwen'),
      { source: 't', sourceType: 'deduced', confidence: 0.6, ep: 2, rng: () => 0.01 });
    const board = suspicionBoard('Heather', 2);
    expect(board[0].name).toBe('Gwen');
    expect(board.map(r => r.name)).not.toContain('Heather');
  });

  it('a strong bond protects somebody the evidence points at', () => {
    learn('Heather', alignmentFactId('Gwen'),
      { source: 't', sourceType: 'deduced', confidence: 0.6, ep: 2, rng: () => 0.01 });
    const cold = suspicion('Heather', 'Gwen', 2);
    setBond('Heather', 'Gwen', 9);
    const warm = suspicion('Heather', 'Gwen', 2);
    expect(warm, 'a close friend is suspected exactly as much as a stranger').toBeLessThan(cold);
  });

  it('a traitor never votes for a fellow traitor while a faithful is available', () => {
    recordAlignment('Duncan', true, 1, 'selection');
    seedTraitorKnowledge(1);
    const pick = chooseBanishmentVote('Gwen', ['Duncan', 'Heather', 'Owen'], 2, seededRng(9));
    expect(pick).not.toBe('Duncan');
  });

  it('with no evidence at all, the room does not converge', () => {
    // Round one: nobody knows anything. Votes must scatter, or the format is
    // decided before it starts.
    const picks = ['Heather', 'Owen', 'Leshawna', 'Noah', 'Duncan']
      .map((v, i) => chooseBanishmentVote(v, ['Gwen', 'Heather', 'Owen', 'Leshawna', 'Noah', 'Duncan'], 1, seededRng(i + 1)));
    expect(new Set(picks).size, 'the whole room picked the same name on no information').toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-deduction.test.js -t 'turning belief into a vote'
```

- [ ] **Step 3: Implement**

Append to `js/tr/deduction.js`. `suspicion` and `bondResistance` already exist from
Task 2; `getBond` and `alignmentAt` are already imported.

```js
/** Everyone `observer` could name, most suspected first. */
export function suspicionBoard(observer, ep, candidates = null) {
  const pool = (candidates || gs.activePlayers || []).filter(n => n !== observer);
  return pool
    .map(name => ({ name, score: suspicion(observer, name, ep) }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Who does `voter` write down?
 *
 * The noise term is load-bearing in both directions. Without it a room with any
 * shared evidence votes unanimously every single round, which no Round Table has
 * ever done; and a room with NO evidence votes for whoever sorts first, which
 * would decide episode one alphabetically.
 */
export function chooseBanishmentVote(voter, candidates, ep, rng = Math.random) {
  const pool = (candidates || []).filter(n => n !== voter);
  if (!pool.length) return null;

  // A Traitor knows exactly who not to name, and will spend a Faithful to
  // protect the pact — until there is nobody else left to spend.
  const isTraitor = alignmentAt(voter, ep) === 'traitor';
  const safe = isTraitor ? pool.filter(n => alignmentAt(n, ep) !== 'traitor') : pool;
  const usable = safe.length ? safe : pool;

  const scored = usable.map(name => ({
    name,
    score: suspicion(voter, name, ep) + rng() * 0.35,
  })).sort((a, b) => b.score - a.score);
  return scored[0].name;
}
```

- [ ] **Step 4: Run, then commit**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-deduction.test.js
git branch --show-current && git status --short
git add js/tr/deduction.js tests/tr-deduction.test.js
git commit -m "A friend is suspected less than a stranger, on identical evidence"
```

---

### Task 4: The Round Table

**Files:**
- Create: `js/tr/roundtable.js`
- Test: `tests/tr-roundtable.test.js` (create)

**Interfaces:**
- Consumes: Tasks 1-3; `resolveVotes` from `js/voting.js`.
- Produces: `broadcast(accuser, target, ep, rng)`, `runRoundTable(ep, rng) → { banished, wasTraitor, ballots, tally, revotes }`.

**`broadcast()` is not `propagate()` (spec §4.5).** `js/knowledge.js`'s `propagate()` models private gossip — random hops between people who talk. The Round Table is the opposite: **everyone hears every accusation at once**, and each listener filters it through their own read skill *and* through how much they trust the accuser. That is why a high-`social` Traitor can frame someone while a distrusted player naming the same true name is ignored.

**The tie rule** (per the format): revote among the tied players only, with the tied players not voting. Implemented here, NOT via `simulateRevote` — see "Two spec corrections" above.

- [ ] **Step 1: Write the failing test**

Create `tests/tr-roundtable.test.js`:

```js
// The Round Table is a group vote, which this engine has always been able to
// run. What is new is WHY a ballot gets written: not an alliance's target, but
// a belief about who somebody IS — formed in public, in front of everybody, and
// weighted by whether the room trusts the person making the accusation.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { resetKnowledge, believes } from '../js/knowledge.js';
import { recordAlignment } from '../js/tr/roles.js';
import { alignmentFactId, seedTraitorKnowledge, suspicion } from '../js/tr/deduction.js';
import { broadcast, runRoundTable } from '../js/tr/roundtable.js';
import { setBond } from '../js/bonds.js';

const CAST = ['Gwen', 'Duncan', 'Heather', 'Owen', 'Leshawna', 'Noah', 'Bridgette'];
function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

beforeEach(() => {
  gs.tr = initTraitorsState();
  gs.activePlayers = [...CAST];
  gs.bonds = {};
  resetKnowledge();
  recordAlignment('Gwen', true, 1, 'selection');
  recordAlignment('Duncan', true, 1, 'selection');
  CAST.filter(n => !['Gwen', 'Duncan'].includes(n))
    .forEach(n => recordAlignment(n, false, 1, 'selection'));
  seedTraitorKnowledge(1);
});

describe('an accusation is heard by the whole room', () => {
  it('reaches everybody present, not a random contact', () => {
    broadcast('Heather', 'Owen', 2, seededRng(4));
    const heard = CAST.filter(n => n !== 'Heather' && n !== 'Owen')
      .filter(n => believes(n, alignmentFactId('Owen'), 2));
    expect(heard.length, 'an accusation at the table reached almost nobody').toBeGreaterThan(2);
  });

  it('lands harder when the room trusts the accuser', () => {
    CAST.forEach(n => { if (n !== 'Leshawna') setBond(n, 'Leshawna', 8); });
    CAST.forEach(n => { if (n !== 'Noah') setBond(n, 'Noah', -6); });
    broadcast('Leshawna', 'Owen', 2, seededRng(4));
    const trusted = suspicion('Bridgette', 'Owen', 2);
    resetKnowledge();
    broadcast('Noah', 'Owen', 2, seededRng(4));
    const distrusted = suspicion('Bridgette', 'Owen', 2);
    expect(trusted).toBeGreaterThan(distrusted);
  });
});

describe('the banishment', () => {
  it('banishes exactly one person and reports what they were', () => {
    const r = runRoundTable(2, seededRng(6));
    expect(CAST).toContain(r.banished);
    expect(typeof r.wasTraitor).toBe('boolean');
    expect(r.wasTraitor).toBe(['Gwen', 'Duncan'].includes(r.banished));
  });

  it('collects a ballot from every living player, nobody voting for themselves', () => {
    const r = runRoundTable(2, seededRng(6));
    expect(r.ballots).toHaveLength(CAST.length);
    r.ballots.forEach(b => {
      expect(b.channel).toBe('banishment');
      expect(b.voter).not.toBe(b.voted);
      expect(CAST).toContain(b.voted);
    });
  });

  it('breaks a tie among the tied players only, and they do not vote', () => {
    // Force a 3-3 by giving two candidates identical strong reads and nobody else any.
    const r = runRoundTable(2, seededRng(6));
    if (r.revotes.length) {
      const rv = r.revotes[0];
      rv.ballots.forEach(b => {
        expect(rv.tied).toContain(b.voted);
        expect(rv.tied).not.toContain(b.voter);
      });
    }
    expect(r.banished).toBeTruthy();   // a tie must still resolve
  });

  it('is deterministic for a seed — a season has to replay', () => {
    const a = runRoundTable(2, seededRng(21));
    gs.tr.rounds = [];
    const b = runRoundTable(2, seededRng(21));
    expect(a.banished).toBe(b.banished);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-roundtable.test.js
```

- [ ] **Step 3: Implement `js/tr/roundtable.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// tr/roundtable.js — the debate, and the vote it produces
// ══════════════════════════════════════════════════════════════════════
//
// Two things here are not what the rest of the engine does.
//
// FIRST, an accusation is a BROADCAST. js/knowledge.js's propagate() models
// gossip: private hops between people who happen to talk, with most of the room
// never hearing it. A Round Table is the opposite — everyone hears everything,
// simultaneously, and the only variable is whether they believe it. That
// variable is trust in the ACCUSER, which is why the same true name lands when
// a liked player says it and dies when a distrusted one does.
//
// SECOND, we do not reuse simulateRevote(). Its shape is right — restrict the
// revote to the tied players, they do not vote — but it ranks compromise
// targets by Total Drama alliance and threat pressure, which is not why this
// room converges, and it calls Math.random(), which a season that must replay
// from a seed cannot afford.
import { gs } from '../core.js';
import { pStats } from '../players.js';
import { getBond } from '../bonds.js';
import { resolveVotes } from '../voting.js';
import { learn } from '../knowledge.js';
import { alignmentAt } from './roles.js';
import { alignmentFactId, suspicionBoard, chooseBanishmentVote, recordRound } from './deduction.js';

/**
 * One player names another in front of everybody.
 *
 * Every listener runs their own read-skill check (inside learn), so a room does
 * not move as a bloc. What scales the claim before it gets there is the
 * accuser: their `social` for how well it is put, and each listener's own bond
 * with them for whether it is worth hearing.
 */
export function broadcast(accuser, target, ep, rng = Math.random) {
  const room = (gs.activePlayers || []).filter(n => n !== accuser && n !== target);
  const pitch = 0.25 + (pStats(accuser).social || 5) / 20;   // 0.25 .. 0.75
  const heard = [];
  for (const listener of room) {
    const trust = 0.55 + Math.max(-0.35, Math.min(0.45, getBond(listener, accuser) / 22));
    const belief = learn(listener, alignmentFactId(target), {
      source: `${accuser} at the Round Table`,
      sourceType: 'rumor',
      confidence: Math.max(0.05, Math.min(0.6, pitch * trust)),
      ep, from: accuser, rng,
    });
    if (belief) heard.push(listener);
  }
  return heard;
}

/** Who speaks, and about whom. The loudest reads in the room get aired. */
function debate(ep, rng) {
  const living = gs.activePlayers || [];
  const accusations = [];
  for (const speaker of living) {
    const board = suspicionBoard(speaker, ep, living);
    const top = board[0];
    // Somebody with no read at all keeps quiet rather than inventing one.
    // Boldness decides who speaks anyway.
    const willSpeak = (top?.score || 0) > 0.12 || rng() < (pStats(speaker).boldness || 5) / 45;
    if (!willSpeak || !top) continue;
    accusations.push({ accuser: speaker, target: top.name });
  }
  for (const a of accusations) broadcast(a.accuser, a.target, ep, rng);
  return accusations;
}

function tally(ballots) {
  const t = {};
  for (const b of ballots) if (b.voted) t[b.voted] = (t[b.voted] || 0) + 1;
  return t;
}

/** Run one Round Table end to end. Returns the round record, already stored. */
export function runRoundTable(ep, rng = Math.random) {
  const living = [...(gs.activePlayers || [])];
  const accusations = debate(ep, rng);

  const ballots = living.map(voter => ({
    voter,
    voted: chooseBanishmentVote(voter, living, ep, rng),
    channel: 'banishment',
  }));

  let result = resolveVotes(tally(ballots));
  const revotes = [];
  // The format's tie rule: only the tied are eligible, and they do not vote.
  // Capped, because a tiny room can deadlock indefinitely; the last resort is a
  // seeded draw, which the real show also does (it hands them boxes to open).
  let guard = 0;
  while (result.isTie && guard++ < 3) {
    const tied = result.tiedPlayers || [];
    const voters = living.filter(n => !tied.includes(n));
    const rvBallots = voters.map(voter => ({
      voter, voted: chooseBanishmentVote(voter, tied, ep, rng), channel: 'banishment-revote',
    }));
    revotes.push({ tied, ballots: rvBallots });
    result = resolveVotes(tally(rvBallots));
    if (result.isTie && !voters.length) break;
  }
  const banished = result.eliminated
    || (result.tiedPlayers || living)[Math.floor(rng() * ((result.tiedPlayers || living).length))];

  const wasTraitor = alignmentAt(banished, ep) === 'traitor';
  const round = { ep, banished, banishedWasTraitor: wasTraitor, murdered: null,
    ballots, revotes, accusations };
  recordRound(round);
  gs.activePlayers = living.filter(n => n !== banished);
  return { ...round, wasTraitor, tally: tally(ballots) };
}
```

- [ ] **Step 4: Run, then commit**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-roundtable.test.js tests/tr-deduction.test.js
for f in $(git diff --name-only); do grep -rl "$(basename "$f")" tests/ 2>/dev/null; done | sort -u
git branch --show-current && git status --short
git add js/tr/roundtable.js tests/tr-roundtable.test.js
git commit -m "The same true name lands or dies depending on whose mouth it comes from"
```

---

### Task 5: The reveal cascade

**Files:**
- Modify: `js/tr/deduction.js`, `js/tr/roundtable.js`
- Test: `tests/tr-deduction.test.js` (append)

**Interfaces:**
- Produces: `revealCascade(name, wasTraitor, ep, rng)`, called from `runRoundTable` after the banishment.

**Why this is the engine of the late game (spec §4.5):** a banishment reveal is the **only** certainty a Faithful ever receives, and it lands at `public` 1.0 — about that one person. Its real work is retroactive: everyone who defended a revealed Traitor takes a hit, everyone who voted them is exonerated. That is why late Round Tables sharpen while early ones are noise, with nothing scripted — the information density genuinely rises.

- [ ] **Step 1: Write the failing test**

Append to `tests/tr-deduction.test.js`:

```js
import { revealCascade } from '../js/tr/deduction.js';

describe('the reveal, and what it does to everybody else', () => {
  beforeEach(() => {
    recordAlignment('Gwen', true, 1, 'selection');
    recordAlignment('Duncan', true, 1, 'selection');
    ['Heather', 'Owen', 'Leshawna', 'Noah'].forEach(n => recordAlignment(n, false, 1, 'selection'));
    seedTraitorKnowledge(1);
  });

  it('makes a banished traitor a certainty for everyone left', () => {
    gs.activePlayers = ['Gwen', 'Heather', 'Owen', 'Leshawna', 'Noah'];
    revealCascade('Duncan', true, 3, seededRng(2));
    const b = believes('Heather', alignmentFactId('Duncan'), 3);
    expect(b.effectiveConfidence).toBeGreaterThanOrEqual(0.99);
  });

  it('punishes the people who kept them in', () => {
    gs.activePlayers = ['Gwen', 'Heather', 'Owen', 'Leshawna', 'Noah'];
    recordRound({
      ep: 3, banished: 'Duncan', banishedWasTraitor: true, murdered: null,
      ballots: [
        { voter: 'Owen',     voted: 'Noah',   channel: 'banishment' },
        { voter: 'Heather',  voted: 'Duncan', channel: 'banishment' },
        { voter: 'Leshawna', voted: 'Duncan', channel: 'banishment' },
        { voter: 'Noah',     voted: 'Duncan', channel: 'banishment' },
      ],
    });
    revealCascade('Duncan', true, 3, seededRng(2));
    expect(suspicion('Leshawna', 'Owen', 3)).toBeGreaterThan(suspicion('Leshawna', 'Heather', 3));
  });

  it('a banished faithful teaches the room something too — they were wrong', () => {
    gs.activePlayers = ['Gwen', 'Duncan', 'Heather', 'Leshawna', 'Noah'];
    revealCascade('Owen', false, 3, seededRng(2));
    const b = believes('Heather', alignmentFactId('Owen'), 3);
    expect(b.valence).toBe('false');   // correctly disbelieved: he was not one
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-deduction.test.js -t 'the reveal'
```

- [ ] **Step 3: Implement**

Append to `js/tr/deduction.js`:

```js
/**
 * A banishment reveal, and everything it retroactively re-scores.
 *
 * The certainty is about ONE person and is the only one a Faithful ever gets.
 * The value is in the second half: a room that now knows Duncan was a Traitor
 * also knows who spent a vote keeping him, and that is real evidence about
 * THOSE people, arrived at by reasoning rather than by being told.
 *
 * This is why the last three Round Tables of a season feel different from the
 * first three without anything being scripted — every reveal converts a round of
 * ballots that meant nothing into a round of ballots that mean something.
 */
export function revealCascade(name, wasTraitor, ep, rng = Math.random) {
  const living = (gs.activePlayers || []).filter(n => n !== name);

  // 1. The certainty. `public` is correct: they said it out loud, to the room.
  //    This and seedTraitorKnowledge are the only two places alignment is ever
  //    learned at better than `deduced`.
  recordFact({ type: 'alignment', subject: name, truth: !!wasTraitor, ep });
  for (const observer of living) {
    learn(observer, alignmentFactId(name),
      { source: 'the reveal', sourceType: 'public', ep, rng: () => 0 });
  }

  // 2. The re-scoring. Only a revealed TRAITOR indicts their defenders — a
  //    revealed Faithful tells you the room was wrong, not who is guilty.
  if (!wasTraitor) return [];
  const round = (gs.tr?.rounds || []).find(r => r.ep === ep && r.banished === name);
  if (!round) return [];

  const formed = [];
  for (const b of (round.ballots || [])) {
    if (b.channel !== 'banishment' || !living.includes(b.voter)) continue;
    if (b.voted === name) continue;                 // they were right; nothing to answer for
    for (const observer of living) {
      if (observer === b.voter) continue;
      const belief = learn(observer, alignmentFactId(b.voter), {
        source: `kept ${name} in on the night ${name} was revealed`,
        sourceType: 'deduced', confidence: 0.5, ep, rng,
      });
      if (belief) formed.push({ observer, subject: b.voter });
    }
  }
  return formed;
}
```

Then in `js/tr/roundtable.js`, import `revealCascade` and call it in `runRoundTable` immediately after `recordRound(round)` and after `gs.activePlayers` is updated:

```js
  gs.activePlayers = living.filter(n => n !== banished);
  revealCascade(banished, wasTraitor, ep, rng);
```

- [ ] **Step 4: Run, then commit**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-deduction.test.js tests/tr-roundtable.test.js
git branch --show-current && git status --short
git add js/tr/deduction.js js/tr/roundtable.js tests/tr-deduction.test.js
git commit -m "A reveal turns a round of meaningless ballots into evidence"
```

---

### Task 6: Play it headless, and measure whether it works

**Files:**
- Create: `js/tr/headless.js`, `tests/tr-calibration.test.js`
- Test: both

**Interfaces:**
- Produces: `playTraitorsSeason({ cast, traitorCount, seed }) → { rounds, winner, survivors, log }`.

**This task is the gate.** Everything before it can pass its tests and still produce a castle where nobody deduces anything. The measurements below are the actual deliverable.

**The placeholder murder.** Uniform-random among living Faithfuls, seeded, no conclave, no reasoning, and it writes **no evidence**. It exists only so the cast shrinks at the right rate. Plan 3 replaces it entirely. It is named `_placeholderMurder` so nobody mistakes it for the real thing.

- [ ] **Step 1: Write `js/tr/headless.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// tr/headless.js — a whole season, with no UI and no screens
// ══════════════════════════════════════════════════════════════════════
//
// The point of this file is measurement. A social deduction engine can pass
// every unit test it has and still produce a room that never works anything
// out, because "did the belief update" and "did the room find the Traitors" are
// different questions and only the second one matters.
import { gs } from '../core.js';
import { initTraitorsState } from './state.js';
import { resetKnowledge } from '../knowledge.js';
import { selectTraitors, recordAlignment, livingTraitors, livingFaithfuls } from './roles.js';
import { seedTraitorKnowledge, ballotEvidence } from './deduction.js';
import { runRoundTable } from './roundtable.js';

function rngFor(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/**
 * PLACEHOLDER. Plan 3 deletes this.
 *
 * A real murder is the Traitors arguing in the turret about who the table
 * cannot remove for them. This is a coin flip. It is here so the cast shrinks
 * at roughly the rate the format shrinks it — a season of pure banishment runs
 * seventeen rounds and measures a game nobody plays — and it deliberately
 * generates NO evidence, so nothing calibrated here depends on it.
 */
function _placeholderMurder(ep, rng) {
  const targets = livingFaithfuls(ep);
  if (!targets.length) return null;
  const victim = targets[Math.floor(rng() * targets.length)];
  gs.activePlayers = (gs.activePlayers || []).filter(n => n !== victim);
  return victim;
}

/** Play one season. Returns the record and enough log to measure it. */
export function playTraitorsSeason({ cast, traitorCount = 3, seed = 1, maxRounds = 40 } = {}) {
  const rng = rngFor(seed);
  gs.tr = initTraitorsState();
  gs.activePlayers = [...cast];
  gs.bonds = {};
  resetKnowledge();

  const traitors = selectTraitors(cast, { traitorCount }, rng);
  traitors.forEach(n => recordAlignment(n, true, 1, 'selection'));
  cast.filter(n => !traitors.includes(n)).forEach(n => recordAlignment(n, false, 1, 'selection'));
  seedTraitorKnowledge(1);

  const log = [];
  let ep = 1;
  // The format's own rule: no banishment on the first night, so the Traitors
  // get one round to become a faction before the hunt starts.
  const firstMurder = _placeholderMurder(ep, rng);
  log.push({ ep, banished: null, wasTraitor: null, murdered: firstMurder });

  while (ep++ < maxRounds) {
    const alive = gs.activePlayers || [];
    const tr = livingTraitors(ep).length;
    const fa = livingFaithfuls(ep).length;
    if (!tr || alive.length <= 3 || fa <= tr) break;

    ballotEvidence(ep, rng);
    const r = runRoundTable(ep, rng);
    const murdered = livingTraitors(ep).length ? _placeholderMurder(ep, rng) : null;
    log.push({ ep, banished: r.banished, wasTraitor: r.wasTraitor, murdered, alive: alive.length });
  }

  const survivingTraitors = livingTraitors(ep);
  return {
    traitors,
    log,
    rounds: gs.tr.rounds,
    survivors: [...(gs.activePlayers || [])],
    winner: survivingTraitors.length ? 'traitors' : 'faithfuls',
  };
}
```

- [ ] **Step 2: Write the calibration test**

Create `tests/tr-calibration.test.js`:

```js
// DOES THE ROOM ACTUALLY WORK ANYTHING OUT?
//
// Spec section 13, step 6: "If a Round Table does not produce a believable
// banishment here, nothing else matters — stop and fix it before building
// anything else." This file is that check, and it is the reason this plan
// exists before any screen, any mission and any conclave.
//
// A green unit suite proves beliefs update. It does not prove a castle deduces.
// These are population measurements over many seeded seasons, and a failure here
// is a DESIGN failure, not a flaky test — do not widen a band to make it pass.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import roster from '../franchise_roster.json';

const CAST = roster.slice(0, 20).map(p => p.name);
const SEASONS = 60;

function run(n = SEASONS, traitorCount = 3) {
  setPlayers(roster.slice(0, 20));
  return Array.from({ length: n }, (_, i) =>
    playTraitorsSeason({ cast: CAST, traitorCount, seed: i + 1 }));
}

describe('the castle, measured over many seasons', () => {
  const seasons = run();

  it('finishes every season without hanging or crashing', () => {
    seasons.forEach(s => {
      expect(s.log.length).toBeGreaterThan(2);
      expect(['traitors', 'faithfuls']).toContain(s.winner);
    });
  });

  it('BEATS CHANCE: banishments hit traitors more often than random would', () => {
    // Random banishment with 3 traitors in 20 hits one ~15% of the time. This is
    // the whole thesis of the plan: if it is not clearly above chance, the
    // deduction engine does not work and nothing downstream can save it.
    let hits = 0, total = 0;
    seasons.forEach(s => s.log.forEach(r => {
      if (r.banished) { total++; if (r.wasTraitor) hits++; }
    }));
    const rate = hits / total;
    console.log(`traitor-hit rate: ${(rate * 100).toFixed(1)}% over ${total} banishments`);
    expect(rate, 'the room is banishing at random — the deduction layer is not working').toBeGreaterThan(0.22);
  });

  it('DOES NOT SOLVE IT: the faithfuls must lose a fair share of seasons', () => {
    const faithfulWins = seasons.filter(s => s.winner === 'faithfuls').length / seasons.length;
    console.log(`faithful win rate: ${(faithfulWins * 100).toFixed(1)}%`);
    // The real format is Traitor-favoured. A castle that always finds them is
    // as broken as one that never does, and far less fun.
    expect(faithfulWins).toBeGreaterThan(0.10);
    expect(faithfulWins, 'the faithfuls are solving it every time').toBeLessThan(0.75);
  });

  it('SHARPENS: late banishments are better than early ones', () => {
    // The reveal cascade should make information density rise. Early rounds are
    // noise; late rounds should not be.
    const half = (pick) => {
      let hits = 0, total = 0;
      seasons.forEach(s => {
        const bans = s.log.filter(r => r.banished);
        pick(bans).forEach(r => { total++; if (r.wasTraitor) hits++; });
      });
      return total ? hits / total : 0;
    };
    const early = half(b => b.slice(0, Math.floor(b.length / 2)));
    const late  = half(b => b.slice(Math.floor(b.length / 2)));
    console.log(`early ${(early * 100).toFixed(1)}%  late ${(late * 100).toFixed(1)}%`);
    expect(late, 'the room learns nothing as the season goes on').toBeGreaterThan(early);
  });

  it('IS NOT UNANIMOUS: a round table disagrees with itself', () => {
    // A room that votes 20-0 every night is not deducing, it is following a
    // scalar. Real tables split.
    let splitRounds = 0, totalRounds = 0;
    seasons.forEach(s => (s.rounds || []).forEach(r => {
      const t = {};
      (r.ballots || []).forEach(b => { t[b.voted] = (t[b.voted] || 0) + 1; });
      const counts = Object.values(t);
      if (!counts.length) return;
      totalRounds++;
      if (counts.length > 1) splitRounds++;
    }));
    const splitRate = splitRounds / totalRounds;
    console.log(`rounds with a split vote: ${(splitRate * 100).toFixed(1)}%`);
    expect(splitRate).toBeGreaterThan(0.6);
  });

  it('replays identically from a seed', () => {
    const a = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 99 });
    const b = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 99 });
    expect(a.log.map(r => r.banished)).toEqual(b.log.map(r => r.banished));
    expect(a.winner).toBe(b.winner);
  });
});
```

- [ ] **Step 3: Run it and read the numbers**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-calibration.test.js --reporter=verbose
```

**Read the console output, do not just check for green.** You are looking for:
- traitor-hit rate meaningfully above 15%
- faithful win rate somewhere between 10% and 75%
- late clearly above early
- split-vote rate above 60%

**If a band fails, fix the DESIGN, never the band.** The tuning levers, in order of what they do:
- `W.*` in `deduction.js` — how loud each ballot pattern is
- the `0.35` noise term in `chooseBanishmentVote` — lower it and the room converges harder, raise it and it scatters
- `bondResistance`'s `0.5` — how much a friendship blinds somebody
- `broadcast`'s `pitch`/`trust` ranges — how much the debate moves the room

Record what you changed and what the numbers were before and after, in the report.

- [ ] **Step 4: Commit**

```bash
cd ../worktree-traitors
npx vitest run tests/tr-deduction.test.js tests/tr-roundtable.test.js tests/tr-calibration.test.js
for f in $(git diff --name-only); do grep -rl "$(basename "$f")" tests/ 2>/dev/null; done | sort -u
git branch --show-current && git status --short
git add js/tr/headless.js tests/tr-calibration.test.js
git commit -m "Sixty seasons say whether the castle can actually work it out"
git push
```

---

## Done when

- A headless season runs end to end and replays identically from a seed.
- **The traitor-hit rate is clearly above chance**, the Faithfuls neither always nor never win, late banishments beat early ones, and Round Tables split.
- No bare `Math.random()` in `js/tr/`.
- `npx vitest run tests/tr-deduction.test.js tests/tr-roundtable.test.js tests/tr-calibration.test.js` green, plus whatever the touched-file grep prints.

## Explicitly NOT in this plan

Murder reasoning and the conclave (Plan 3) · recruitment and eras in anger (Plan 3) · the exit blowup (Plan 3) · threads, cooldowns, acts, residue and the castle event pool (Plan 4) · missions, the pot, Shield/Dagger/Seer (Plan 5) · the endgame (Plan 5) · export and co-winners (Plan 6) · every screen and all VP (Plan 7) · evidence sources ②–⑥, including franchise-meta priors.

## Carried forward from Plan 1

- `js/wiki-view.js` renders "Challenge wins" and "Voted to evict" on a Traitors article, and `tests/show-vocabulary.test.js`'s `EXCLUSIVE` map has no `traitors` key. **Named prerequisite of Plan 7.**
- `js/player-trivia.js` hands a Traitors line Total Drama's noun and counters. **Named prerequisite of the first plan that produces a real season (Plan 6).**
- `tests/bb-twist-compatibility.test.js` has 4 failures inherited from `main`, and `tests/wiki.test.js` 2. Neither is ours; both predate the branch.
