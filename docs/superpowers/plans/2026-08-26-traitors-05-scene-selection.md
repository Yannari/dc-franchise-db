# The Traitors — Plan 5: Scene Selection and Thread Continuity

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the castle's stories accumulate across a season instead of dying at their first beat, by letting scene selection know a story is live — then build the payoffs (residue, emotional state, acts) that only pay once stories survive long enough to have them.

**Architecture:** One function is the root cause. `_sceneActors()` (js/tr/events.js) draws actors uniformly from the living cast, so a thread opened between two people is reconvened only by chance — measured 0.4% per draw, which is why 89.4% of threads die at their first beat and 0.7% ever pay off. Task 1 makes selection thread-aware and bands both directions (stories must lengthen; one storyline must not eat the season). Tasks 2-5 then build the things the spec promises that are only reachable once threads survive: residue that lets episode 7 cite episode 2, emotional state in `ctx`, the three shipped-but-unused anti-repetition guards, and the empty windows. Task 6 re-measures every band against the new distribution. Task 7 closes a repo hazard that has now run a guard in no CI job three separate times.

**Tech Stack:** ES modules, no build step. vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-25-traitors-design.md` (§5.2 Threads, §5.3 `weight(ctx)`, §5.4 Four guards, §5.5 Branching, §5.6 Beats and windows)

**Carry-forward from Plan 4:** `docs/superpowers/notes/2026-08-26-traitors-plan5-carry-forward.md` — read it. It records the measurements this plan is built on and the seven findings it inherits.

## Global Constraints

- **Castle events write ZERO beliefs.** Belief writes belong to deduction/roundtable/murder only. Guarded by `tests/tr-castle-belief-gate.test.js`, which has two arms (seeded seasons + direct execution of every registered event's `fire()`). Any new event must pass both. Never weaken either arm to accommodate content.
- **Castle events must condition on BELIEF, never ground truth.** No `alignmentAt()` in a castle `weight()` or `fire()`, except for the ACTING player's own role (a Traitor knows they are a Traitor). Guarded by probes A/B/C in `tests/tr-castle.test.js`, written as a rule over the whole pool.
- **No bare `Math.random()`** in season logic. Use `stableRng`/`rngFor`/`castleRngFor`. Seeds must be hashed — an unhashed seed once collapsed 200 seasons into 2-3 distinct Traitor identities.
- **`npm test` EXCLUDES the audit-test filename pattern** (see vitest.config.js). A guard in a file matching that pattern is collected by nothing. Verify collection by RUNNING the suite and watching the counts, never by reading config. This trap has landed three times.
- **The 13 calibration bands are pinned.** Do not widen, lower, or delete any band to make a change pass. If a change moves a measured value enough to break a band, that is a real regression — report it. Task 6 is the only task permitted to re-derive bands, and only by re-measuring, never by loosening.
- **Every test ships with the mutation that proves it.** Fix, apply the mutation, confirm RED, revert, confirm GREEN, report the literal mutation. Seventeen unfailable tests have been found in this project.
- **Guards are written as RULES over the whole event pool, never as lists of known cases.** The list-shaped ground-truth probe would have caught 3 of 6 leaks; the rule-shaped one caught all 6 and later found 9 untested fork branches.
- **Measure against an uninformative control, never a base rate.** Build the version with content removed but shape preserved and check the metric does not improve just as much. This has collapsed four flattering numbers so far, including one metric (advance-share) that read 11.6% live against 11.0% with the guard disabled.

## Facts the implementer needs and cannot infer

- **Cooldowns do NOT conflict with continuation.** `pickEvent` keys cooldowns as `eventId:pairKey`, not by pair alone. The 5-episode pair cooldown holds off *the same event* for that pair; a *different* event may reconvene them next episode. This is what makes thread continuation possible at all. Do not "fix" it.
- **The continuation guard already works** and must not be re-implemented. Given actors who have a live thread, it continues at 0.2606 vs 0.1989 with the guard off, monotone across OFF/HALF/SHIPPED/DOUBLE, banded `>0.22` in `tests/tr-calibration.test.js` with an in-suite control arm. This plan changes *which scenes get convened*, not how the guard scores them once convened.
- **Do not band unconditional advance-share.** It reads 11.6% live vs 11.0% with the guard flattened — overlapping distributions dominated by the runner re-drawing a pair by chance. `pickEvent` samples `liveThread` and `continued` before `fire()` runs precisely so the *conditional* rate is measurable; use those.
- **Current measured baseline** (shipped, before this plan): threads average 1.13 beats; 89.4% die at their first beat; 0.7% reach a payoff; `abandonThread` has no caller; `residue` has zero production readers; `acts:` is used by 2 of 81 events, `oncePerSeason` by 0, `ev.cooldown` by 0; windows `journey-out` and `journey-back` hold 0 events and `night` holds 1.
- **Commands:** `npx vitest run tests/tr-*.test.js` (198 tests at plan base df17dda2; the registry suite is separate), `npx vitest run tests/tr-calibration.test.js` (13 bands), `npm run audit:tr-castle` (5).

---

### Task 1: Thread-aware scene selection

**Files:**
- Modify: `js/tr/events.js` (`_sceneActors`, ~line 360)
- Modify: `js/tr/threads.js` (export a live-threads query if one is not already usable)
- Test: `tests/tr-events.test.js`, `tests/tr-calibration.test.js`

**Interfaces:**
- Consumes: `heatAt(thread, ep)` and the thread store from `js/tr/threads.js`; `gs.activePlayers`.
- Produces: `_sceneActors(living, rng, ep)` — note the added `ep` parameter; every caller in `runWindow` must pass it. Exports `CONTINUATION_SCENE_P` so tests and the control arm can zero it.

**The change.** Scene selection gets a bias toward reconvening the parties of a live thread. A bias, not a rule — novelty must survive, or no new threads ever open.

- [ ] **Step 1: Write the failing test** in `tests/tr-events.test.js` — with one open hot thread between two named players and `CONTINUATION_SCENE_P` at 1, `_sceneActors` returns exactly those parties; with it at 0, over 200 draws the pair's share is within noise of uniform. Assert on observed draws, never on a returned shape.

- [ ] **Step 2: Run it, confirm it fails** (`_sceneActors` currently takes no `ep` and knows nothing about threads).

- [ ] **Step 3: Implement.** Shape:

```js
// Uniform selection is why threads died: with ~18 alive and a 60% pair draw,
// one specific pair reconvenes at 0.6 * 2/(18*17) ~= 0.4% a draw. The
// continuation guard in pickEvent scores continuation correctly and was simply
// never asked, because nothing convened a scene BECAUSE a story was live.
const CONTINUATION_SCENE_P = 0.5;   // tuned in Step 6 against the control arm

function _sceneActors(living, rng, ep) {
  if (!living.length) return [];
  const alive = new Set(living);
  const live = openThreads(ep).filter(t => t.parties.length && t.parties.every(p => alive.has(p)));
  if (live.length && rng() < CONTINUATION_SCENE_P) {
    // Heat-weighted, NOT max-heat: the hottest storyline must not monopolise
    // the season. A cold-but-open thread keeps a small chance of revival,
    // which is what findOpenThread's parties-keyed lookup exists to serve.
    const total = live.reduce((s, t) => s + Math.max(0.15, heatAt(t, ep)), 0);
    let roll = rng() * total;
    let chosen = live[live.length - 1];
    for (const t of live) { roll -= Math.max(0.15, heatAt(t, ep)); if (roll <= 0) { chosen = t; break; } }
    return [...chosen.parties];
  }
  // ...existing uniform draw, unchanged...
}
```

- [ ] **Step 4: Run the test, confirm it passes.**

- [ ] **Step 5: Thread the `ep` parameter** through every `_sceneActors` call in `runWindow`. Run the full `tests/tr-*.test.js` suite; all must stay green and all 13 bands must hold. If a band breaks, STOP and report it — do not retune.

- [ ] **Step 6: Measure and tune, against a control.** Over >=200 seasons on decorrelated seeds, measure with `CONTINUATION_SCENE_P` at 0 (control), 0.25, 0.5, 0.75: mean thread beats, share dying at first beat, payoff rate, and **distinct pairs appearing in scenes per season** (the anti-monopoly measure). Pick the value that lengthens threads while keeping distinct-pair coverage within 15% of the control. Report the whole table, not just the chosen value.

- [ ] **Step 7: Band both directions** in `tests/tr-calibration.test.js` — one band that thread health improved, one that cast coverage did NOT collapse. Both banded below/above measurement with headroom.

- [ ] **Step 8: Prove the bands fail.** Mutation: set `CONTINUATION_SCENE_P = 0`. The thread-health band must go RED. Then mutation: set it to `1`. The coverage band must go RED. Report both. A pair of bands where only one can fail is half a guard.

- [ ] **Step 9: Commit.**

---

### Task 2: Residue that later events can cite

**Files:**
- Modify: `js/tr/threads.js` (`residueFor` and its writers)
- Modify: castle events under `js/tr/castle/` that should read residue
- Test: `tests/tr-threads.test.js`, `tests/tr-castle.test.js`

Spec §5.4.4: "Residue is what lets episode 7's accusation name episode 2." Currently `residue` is write-only with zero production readers, so the spec's worked example in §5.2 — a six-episode thread whose payoff names all three earlier moments — cannot happen. Task 1 is what makes threads live long enough for this to matter; without Task 1 this is unreachable content.

- [ ] **Step 1:** Write a failing test: a thread with three recorded beats produces, at its payoff, narration text naming the episode numbers of the earlier beats.
- [ ] **Step 2:** Run it, confirm it fails (nothing reads residue).
- [ ] **Step 3:** Give at least three existing events a residue-citing branch in `fire()`. Text must name the specific earlier moment, not "as before".
- [ ] **Step 4:** Run, confirm pass. Confirm the belief gate and ground-truth probes still pass — residue is castle state, not belief.
- [ ] **Step 5: Mutation:** make `residueFor` return `[]` unconditionally. The citing tests must go RED.
- [ ] **Step 6:** Commit.

---

### Task 3: The three spec gaps — emotional state, thread `act`, thread `outcome`

**Files:**
- Modify: `js/tr/events.js` (build `ctx.state`), `js/tr/threads.js` (add `act` at open)
- Modify: castle events that should read them
- Test: `tests/tr-events.test.js`, `tests/tr-threads.test.js`, `tests/tr-castle.test.js`

Spec §5.3 requires `ctx` to carry emotional state (`paranoid`, `desperate` — both already exist and `js/knowledge.js` already reads them); no castle event reads it. Spec §5.2 gives a thread an `act` field; the implementation has none. Spec §5.5 has events branch on a thread's `.outcome`; nothing reads it.

- [ ] **Step 1:** Failing test per gap — an event whose weight differs for a paranoid vs calm actor; a thread carrying the act it opened in; an event branching on a closed thread's outcome.
- [ ] **Step 2:** Run, confirm all three fail.
- [ ] **Step 3:** Implement all three. `ctx.state` is read-only in castle events.
- [ ] **Step 4:** Run, confirm pass, full suite + bands green.
- [ ] **Step 5: Mutations:** force `ctx.state` to `{}`; drop `act` at open; force `.outcome` to null. Each must turn its own test RED.
- [ ] **Step 6:** Commit.

---

### Task 4: Populate the three empty windows

**Files:**
- Create: `js/tr/castle/journey.js` (journey-out / journey-back)
- Modify: `js/tr/castle/` families gaining `night` events
- Test: `tests/tr-castle.test.js`, `tests/tr-castle-reachability.test.js`

`journey-out` and `journey-back` hold 0 events; `night` holds 1. The spec (§5.6) has all three as real windows. Projected effect of populating them: +50% firings, +53% distinctness. The journey windows are where the mission would run — there is no mission engine yet (Plan 6), so these are social scenes with nothing mechanical behind them, exactly as `headless.js` documents.

- [ ] **Step 1:** Write reachability expectations first — every new event fires at least once in the 400-season sweep.
- [ ] **Step 2:** Run, confirm failure (events do not exist).
- [ ] **Step 3:** Author >=12 events across the three windows. Every event: real branches on a real check (§5.5, not text variants), gameplay consequences, `rare: true` where gated behind a rare state (§5.4.1 — the omission of this flag is exactly what starved seven romance events in Plan 4).
- [ ] **Step 4:** Run reachability, belief gate, ground-truth probes, full suite, all bands.
- [ ] **Step 5: Mutation:** force one new event's weight to 0 → reachability RED. Per-branch score zeroing → that branch's test RED (see Plan 4 round 2: flatten-all is the WRONG mutant, it passes positionally).
- [ ] **Step 6:** Commit.

---

### Task 5: Wire the three dead anti-repetition guards into content

**Files:**
- Modify: castle event files under `js/tr/castle/`
- Test: `tests/tr-events.test.js`, `tests/tr-castle.test.js`

`acts:` is declared by 2 of 81 events, `oncePerSeason` by 0, `ev.cooldown` by 0. Spec §5.4.2/§5.4.3 require all three. An episode-2 castle must not sound like an episode-9 castle.

- [ ] **Step 1:** Failing test — a signature event flagged `oncePerSeason` fires at most once across a season; an act-tagged event's share of firings differs between early and late acts.
- [ ] **Step 2:** Run, confirm fail.
- [ ] **Step 3:** Tag content: `oncePerSeason` on signature moments, `acts:` on events whose tone belongs to one part of the season, `ev.cooldown` overrides where the default windows are wrong.
- [ ] **Step 4:** Run; full suite and all bands green.
- [ ] **Step 5: Mutations:** strip `oncePerSeason` handling → its test RED; flatten act multipliers to 1 → the act-share test RED.
- [ ] **Step 6:** Commit.

---

### Task 6: Re-measure every band against the new distribution

**Files:**
- Modify: `tests/tr-calibration.test.js`, `tests/tr-castle-reachability.test.js`

This is the ONLY task permitted to re-derive bands, and only by re-measuring — never by loosening to accommodate a regression. Tasks 1-5 change the firing-share distribution that every band is measured against.

Two inherited items land here because both move firing shares and so could not be fixed earlier: `trust-trade-reads` takes ~0.40-0.455 of all trust-family firings (two in five of its own family); `trust-protect-pact` fires once in 67 seasons, below the one-in-forty floor.

- [ ] **Step 1:** Re-measure all 13 bands plus dominance and the reachability floor over >=200 decorrelated seasons. Report the table: band, old threshold, old measured, new measured, verdict.
- [ ] **Step 2:** Fix the two inherited items by changing weights/predicates — not by moving thresholds.
- [ ] **Step 3:** Re-derive thresholds from the new measurements with headroom. Any band that moved must have a stated reason that is a *measured change*, never "it was failing".
- [ ] **Step 4:** Confirm every band can still fail — run each band's own mutation, report the list.
- [ ] **Step 5:** Commit.

---

### Task 7: Close the audit-filename hazard

**Files:**
- Create: a check (test or CI step) that fails when an excluded audit test file contains an assertion no job runs
- Modify: `vitest.config.js` or the workflow, as the fix requires

Three separate times in this project a guard has been placed in a file matching the audit-test exclusion pattern and therefore run in no job: Task 4 caught and renamed one, Tasks 5-6 reintroduced it, fix round 1 re-banded family dominance inside it. The pattern will land a fourth time.

- [ ] **Step 1:** Write the check. It must fail on a file that matches the exclusion pattern AND contains an assertion, unless that file is explicitly listed in a job that runs it.
- [ ] **Step 2:** Run it against the current tree — it must PASS (round 2 moved the dominance band out).
- [ ] **Step 3: Mutation:** add an assertion to the excluded audit file → the check goes RED. This is the proof it works; without it the check is itself the eighteenth unfailable test.
- [ ] **Step 4:** Commit.

---

## Ordering note

Task 1 gates Tasks 2, 3 and 5: residue, thread `act`/`outcome` and act-pacing are all unmeasurable while 89.4% of threads die at their first beat. Task 4 is independent and may run any time. Task 6 must run last. Task 7 is independent.

---

## Amendment after Task 1 — advancer coverage is the binding constraint

Task 1 shipped `CONTINUATION_SCENE_P = 0.35` with guard `3/1.5`: mean thread 1.139 -> 1.431
beats, first-beat death 87.7% -> 73.9%, payoff 1.91% -> 3.96%, >=3-beat threads 2.42% ->
9.87%. Costs 9.0% of people-coverage and takes the busiest pair to 17.0%.

**The model in this plan's Architecture section was wrong and the measurement corrected it.**
Thread length is not P(scene convenes live-thread actors) x P(guard continues it). The
guard multiplier is nearly inert: +20% relative on its own conditional rate buys +2.4% mean
beats. The real third term is **P(an advancing event even exists for this scene)**, measured
at **0.490** at the shipped 3/1.5 constants (0.499 at the old 1/0.5). Slightly over half of
all scenes whose actors share a live thread have NO eligible event that could advance it.

Cause is pool composition, measured — and these counts are now PINNED in
`tests/tr-castle-reachability.test.js`, because the first three copies written into this
repo were all wrong in the same direction and nothing in the suite could tell:
- only **27 of 81** events set `advancesThread`
- there are **28 non-empty** (family x window) cells
- **10** hold **zero** advancers -- `callback|dawn`, `callback|morning`, `cover|evening`,
  `cover|morning`, `grief|evening`, `grief|morning`, `romance|morning`,
  `suspicion|morning`, `testing|dawn`, `testing|morning`
- **12 more** hold exactly one, and with the 5-episode pair cooldown a thread in a
  one-advancer cell can advance at most once every five rounds
- only **6** hold two or more
- heat decay is NOT a cause: cold revivals hold steady at 4.6% of beats across every cell

### Binding requirement added to Tasks 2, 4 and 5

Every task that authors or edits castle content must raise advancer coverage, and must
report the cell table before and after. Target: **no (family x window) cell that can host a
thread kind holds fewer than 2 advancing events**, and overall `advancesThread` coverage
rises from 27/81 toward at least half the pool. An event "advances" only if it can attach
to a thread its actors already have -- adding the flag without the attachment is exactly
the dead-content failure Plan 4's reachability sweep exists to catch.

Task 4's new journey/night events are the cheapest place to fix the zero cells, because
those windows have no advancers at all today.

### Two further rulings

- ~~**Task 6 must re-derive the continuity band.**~~ **DONE IN TASK 1, ROUND 3.** The band
  was modified in Task 1's diff, so it was Task 1's to fix. Re-derived at the shipped
  operating point: the control arm is now GUARD-ONLY (guard flattened, scene selection left
  at its shipped value) rather than both-mechanisms-off, and the floor moved 0.22 -> 0.30.
  Shipped reads 36.14%, the guard-deleted control 23.29%, separation 12.84pp banded at
  >0.06. Verified RED under the literal mutation
  `continuationMult = 1 + _contBase + heat * _contPerHeat;` -> `= 1;`.
  Note the floor is now tied to the shipped `CONTINUATION_SCENE_P`: changing it moves this
  band, by design, since the band measures the guard's contribution at the operating point.
- **Do not plan Tasks 2-5 around long threads.** 73.9% of stories still die at beat one.
  Residue citation (Task 2) and outcome-branching (Task 3) must degrade gracefully on a
  1-2 beat thread, because that is the common case and will remain so.

### Coverage budget

Task 1 spent 9.0 of the 12% people-coverage budget and reached 17.0% of the 20% max-pair
ceiling. Roughly 3pp of headroom remains on each. Task 4 and Task 5 add content that will
move both. If either band breaks, that is a real regression to report, not a band to widen.

---

## Second amendment — the advancer measurement was measuring a label

Task 2 refuted the first amendment's mechanism. Recorded in full because this plan has now
had two wrong models corrected by measurement, and the pattern matters more than either.

**What the first amendment claimed:** thread death is gated by advancer coverage -- only
27/81 events set `advancesThread`, 10 of 28 family-window cells hold zero, so half of all
live-thread scenes have no event that *could* continue the story.

**What is actually true:** `openThread` folds a firing into an open thread of the same kind
and parties. Nearly every event was already continuing stories. `advancesThread` only
decided whether guard 1 multiplied the score and whether the harness *labelled* the firing
a continuation. Proof: with the guard flattened, seasons before and after Task 2's
re-declaration are BIT-IDENTICAL (mean 1.363, 2975 live-thread scenes, both arms).

So "49% of live-thread scenes have no eligible advancer" measured the declaration rate, not
the pool's capability. Declaring the truth on 17 more events (27/81 -> 44/81, zero cells
10 -> 1) bought +3.4% mean thread length (1.431 -> 1.479) and COST 0.5pp of payoff
(3.96% -> 3.48%).

**The real gate on thread length** is family-matching (a thread of kind X is continued only
by an event of family X) plus the 5-episode pair cooldown, operating on top of scene
selection. Not coverage.

### What this changes for the remaining tasks

- **The cell table is a ledger, not a quality bar.** Tasks 4 and 5 must NOT author content
  to hit a coverage target -- the target was derived from a wrong model. `advancesThread`
  should be declared where it is *true*, and nowhere else. The pinned ledger in
  `tests/tr-castle-reachability.test.js` exists to catch silent drift, not to be maximised.
- **The "no cell below 2 advancers" target from the first amendment is WITHDRAWN.**
- Task 6 keeps its job: re-measure everything against the final distribution.

### New coupling to carry into Task 6

The continuity control floor is a function of the pool's advancer DECLARATION rate, not
only of `CONTINUATION_SCENE_P`. Re-labelling moved both arms (shipped 36.14% -> 55.96%,
guard-off control 23.29% -> 36.07%) while widening separation 12.84pp -> 19.89pp. Any later
task that declares or undeclares the flag moves this band without touching the guard.

### Corollary for Tasks 4 and 5: add CLOSERS, not advancers

Task 2 measured why declaring 17 more advancers cost 0.5pp of payoff rate. Closer events
were not out-drawn -- their yield fell. A closer firing closed a thread 0.390 times before,
0.347 after (-11%): it lands more often on a pair with no open thread of its own family and
opens one instead of closing one. Guard 1's boost is family-scoped, so newly-declared
advancers take a larger share of exactly the scenes where a matching live thread exists,
and closers get the remainder.

Measured, 200 seasons: closer firings 467 -> 450 (-3.6%), threads opened 4601 -> 4483
(-2.6%), threads CLOSED 182 -> 156 (-14.3%).

**The flag trades payoffs for length at roughly one payoff per 4.5 extra beats.** A story
that keeps advancing is a story that has not paid off. Since a payoff is what makes a thread
legible to a viewer, Tasks 4 and 5 should author CLOSING events into the crowded windows
(evening, after-table) rather than more advancers. This is the opposite of what the first
amendment's withdrawn coverage target would have produced.

### The declaration is not free (Task 2, round 3)

Guard 1 multiplies a DECLARED advancer by 4x-9x, and `rare` by 2x. Declaring the flag is
therefore a large weight change, not a label. Ten of Task 2's seventeen conversions landed
in `morning` and starved `romance-shared-alibi` from 12 firings/400 seasons to 2 -- the
reachability floor fired and caught it. Those ten were withdrawn (44/81 -> 32/81): payoff
recovered 3.48% -> 3.93% (base 3.96%) for 0.018 beats of length, and every citation was
kept, because citing residue never needed the flag.

**Rule for Tasks 4 and 5: declare `advancesThread` only where it is true, and treat each
declaration as a 4x-9x weight change in that event's window.** Watch the reachability floor
after any batch of declarations, and read headroom in DECLARATIONS, not in sd -- roughly 17
remain before the continuity control band goes stale again.

### Guarding prose: some defects are only catchable at the source

Task 2 round 3 found a truncation bug (`"...told it made."` -- a branch deleting from `{b}`
to end-of-sentence, correct only when `{b}` starts one). Its first guard was an OUTPUT
regex for a dangling space, and it was GREEN against the broken source.

**No regex over finished prose can distinguish a fragment from a sentence that meant to end
there.** The working guard was a SOURCE rule (substituted, never cut). Verified again on the
placeholder bug: mutating one `/\{b\}/g` back to the string form reddens the SOURCE rule and
does NOT redden the output rule. When authoring prose guards, prefer a rule over the source
text; use output rules only for defects that are unambiguous in the finished string.

### CORRECTED: Task 6 should make the continuity band self-calibrating

**This section originally claimed the band went stale three times, the third being Task 3.
That was wrong and the claim was mine.** Task 3's report compared head against a STALE
baseline -- the withdrawn 17-declaration pass from Task 2 round 2, which never shipped.
Measured base (e70df3d0) to head (e14988bd) on identical seeds: arms 46.2/30.5 -> 46.5/30.3,
separation 15.7pp -> **16.2pp**. The arms moved 0.3pp and the separation WIDENED. The 0.38
floor has exactly the headroom it had before Task 3, and Task 3 needs no explanation.

I accepted a reported delta without checking what it was differenced against, and promoted
it into this plan as a durable lesson. **Rule for the rest of this plan: measure base vs
head, not report vs memory.** A report's numbers are a claim about a comparison; the
baseline is the half that goes stale silently.

The honest record is that the band went stale TWICE, both times from content change:
Task 1 (floor 0.22, cleared by scene selection alone) and Task 2 (0.30, re-derived to 0.38
after the declaration withdrawal moved both arms).

The structural argument survives the correction, on two occurrences rather than three:

1. an ABSOLUTE floor on the live arm goes stale whenever content moves the measurement
2. a SEPARATION between live and control arms measured in the same run does NOT, because
   both sides move together

**Task 6 ruling stands: keep the separation, and either delete the absolute floor or
re-express it as a ratio against the control.** Sweep the suite for bands of the same shape
-- an absolute constant compared against a measurement content can move. Two rotations of
that treadmill have already cost two fix rounds, and each left a window guarding nothing.
