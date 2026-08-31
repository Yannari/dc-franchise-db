# The Traitors — Plan 6: Missions, Powers and the Endgame

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the season its game layer — missions that fund a shared pot, the three powers (Shield, Dagger, Seer), the murder variant catalogue, and the "Banish or End Game" endgame that decides who takes the money.

**Architecture:** The deduction engine, roles, Round Table, murder and the castle event engine are built and measured (Plans 1–5). What is missing is everything that gives a season stakes: the pot the Faithfuls may be building for the Traitors, the powers that break deadlocks, and the endgame loop where Traitors must be able to turn on each other. New modules `js/tr/missions.js`, `js/tr/powers.js`, `js/tr/endgame.js`, plus one surgical change to the deduction core. `js/tr/headless.js` grows a mission beat and an endgame phase.

**Tech Stack:** ES modules, no build step. vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-25-traitors-design.md` — §7 (round, missions, powers, murder variants), §8 (endgame). §4.4 (evidence sources) and §4.1 (alignment as a fact) bind the Seer.

**Prior plan:** `docs/superpowers/plans/2026-08-26-traitors-05-scene-selection.md`. Read its closing section and its ~18 appended lessons — they were written from measurement and they bind this plan.

## Global Constraints

- **Castle events write ZERO beliefs.** Guarded by `tests/tr-castle-belief-gate.test.js`, two arms (seeded seasons + direct execution of every registered event's `fire()`). Missions and powers are NOT castle events, but anything you add under `js/tr/castle/` inherits this.
- **Exactly THREE legitimate `public`-credibility alignment writes exist** (turret seeding, banishment reveal, recruit seeing the turret). **The Seer adds the game's ONE `observed`-credibility alignment belief and there must never be a second.** Any other alignment write is `deduced` or `rumor`.
- **Castle events condition on BELIEF, never ground truth**, except the acting player's own role. Probes A/B/C in `tests/tr-castle.test.js`, written as rules over the whole pool.
- **No bare `Math.random()`** in season logic. Use `stableRng`/`rngFor`/`castleRngFor`; seeds must be hashed.
- **`npm test` excludes the audit-filename pattern.** Verify collection by RUNNING `npx vitest list`, never by reading config. `tests/unrun-assertions.test.js` now fails the build if an excluded file holds an assertion no runner names.
- **The 15 calibration bands are pinned.** If a change moves one, that is a real regression to report — never a band to retune. Bands are re-derived only in a task explicitly permitted to.
- **NEVER `git stash`, never `reset --hard`, never `git add -A`.** Stashes are per-repository; this worktree shares a stack with live uncommitted work on `main`. Copy files aside or use a SEPARATE temporary worktree. Temp worktrees empty `node_modules/.bin` — `npm rebuild` restores it.

## The discipline, earned over five plans

- **Every test ships with the mutation that proves it.** Apply, confirm RED, revert, confirm GREEN, report the literal mutation.
- **A mutation is necessary and NOT sufficient.** It proves a guard *can* fail. It does not prove the margin is right, nor that the assertion measures what its name says. Ask all three.
- **Knife-edge:** any sampled assertion needs its separation stated. Under ~3 sd, or inside resampling noise, is a coin flip. Fix the estimator, not the threshold.
- **A control arm cancels a drift source only when BOTH arms are exposed to it.** Ablating the mechanism under test often also ablates the pathway the drift travels on — exactly when the control stops helping. Check the control's own perturbation response.
- **Fixing the instance you noticed does not fix the class.** When you find a bug of shape X, sweep for shape X. Plan 5 learned this twice and failed to apply it once.
- **READ THE OUTPUT.** Seventeen prose defects in Plan 5 were found by dumping seasons and reading; ZERO by any assertion. Two were wrong on 100% of firings.
- **Measure base vs head, not report vs memory.** Five deltas in Plan 5 were differenced against baselines that never shipped.

## Facts the implementer needs and cannot infer

- `gs.tr.pot` already exists (`js/tr/state.js:34`) and is unused. `grantShield(name, ep)` / `isShielded(name)` already exist (`js/tr/murder.js:249,255`) and are wired into `resolveMurder`. `gs.tr.shieldedThisRound` is a Set in `TR_SETS`.
- `fire(ctx, rng)` shares the castle rng stream with `_sceneActors`/`pickEvent`. Any new `pick(rng, …)` consumes a draw and reroutes the season. Use `lineFor()` from `js/tr/castle/lines.js` (hash of id/branch/ep/actors) for prose, and verify path-neutrality with bit-identical firing tables.
- `js/tr/headless.js` `playTraitorsSeason` is the only entry point. Round order is a documented CONTRACT: both evidence sources read the round that just closed, so they must run before `runRoundTable` opens a new one, and the murder is written back onto the round the table produced. Do not reorder it.
- The first round has no banishment, by format. Its murder deliberately leaves no round record, so `murderEvidence` has nothing to emit — that is correct, not a gap.
- Baseline: `npx vitest run tests/tr-*.test.js` → **280 green**; `npm run audit:tr-castle` → 5.

---

### Task 1: Missions and the pot

**Files:** Create `js/tr/missions.js`. Modify `js/tr/headless.js` (mission beat), `js/tr/state.js` if the pot needs shape. Test: `tests/tr-missions.test.js`.

**Interfaces produced:** `runMission(ep, rng)` → `{ id, teams, earned, potAfter, sideObjectives }`; `POT_CEILING`.

Spec §7.2: missions grant **money to a shared pot, never immunity**. The pot has a ceiling and **seasons are expected to fail to max it**. Team-based, scored by team performance. The strategic sting is structural — a Faithful who grinds all season may be building the pot for the Traitors.

- [ ] **Step 1:** Failing test — a season accumulates pot money across rounds, never exceeds `POT_CEILING`, and no mission ever grants immunity or writes an alignment belief.
- [ ] **Step 2:** Run, confirm fail.
- [ ] **Step 3:** Implement. Teams drawn from living players; score from stats; earnings scale with team performance. At least three mission archetypes so a season does not repeat one.
- [ ] **Step 4:** Run; full suite green; all 15 bands hold. If a band moves, STOP and report.
- [ ] **Step 5: Measure and report** the pot distribution over 400 seasons — mean final pot as a fraction of ceiling, and the share of seasons that max it. The spec requires maxing to be rare; if it is common the earnings are too generous.
- [ ] **Step 6: Mutations** — make missions grant immunity → RED; remove the ceiling → RED.
- [ ] **Step 7:** Commit.

---

### Task 2: The Chess mission — knowledge as currency

**Files:** Modify `js/tr/missions.js`. Test: `tests/tr-missions.test.js`.

Spec §7.2: **at least one mission archetype must make knowledge the currency**, so evidence source 4 has something to read. This is the mission that feeds the deduction engine rather than the pot alone.

- [x] **Step 1:** Failing test — the Chess mission emits evidence into the knowledge model, and a player who performs well in it holds beliefs they did not hold before.
- [x] **Step 2:** Run, confirm fail.
- [x] **Step 3:** Implement. What a player learns must be `deduced` or `rumor` credibility — **never `public`, never `observed`.** The Seer is the only `observed` alignment write in the game.
- [x] **Step 4:** Run; belief gate and ground-truth probes green; bands hold.
- [x] **Step 5: Measure** how much this moves late lift, using the control arm from Plan 5's Task 9 (`_setVoteSuspicionMult`). Report the number. This mission is *supposed* to improve deduction — quantify by how much.
- [x] **Step 6: Mutation** — make the mission emit nothing → the evidence assertion RED.
- [x] **Step 7:** Commit.

---

### Task 3: Shield

**Files:** Modify `js/tr/missions.js`, `js/tr/powers.js` (create). Test: `tests/tr-powers.test.js`.

Spec §7.3: blocks the **next murder only**, **never** protects from banishment, expires unused, non-transferable, **won in missions, semi-visibly**. **The Armoury is NOT rebuilt** — its silence-pact metagame is the known-degenerate strategy that got it removed from the real show.

`grantShield`/`isShielded` already exist and are wired into `resolveMurder`. This task is the acquisition path and the visibility model.

- [ ] **Step 1:** Failing test — a shield won in a mission blocks that night's murder, does NOT protect at the Round Table, and is gone the following night.
- [ ] **Step 2:** Run, confirm fail.
- [ ] **Step 3:** Implement. "Semi-visibly" means some players know and some do not — model who saw it, and let that feed suspicion (a shielded player surviving a night is information).
- [ ] **Step 4:** Run; bands hold; `blockedMurders` still tracked.
- [ ] **Step 5: Measure** blocked murders per season and the share of shields that expire unused.
- [ ] **Step 6: Mutations** — let a shield block a banishment → RED; let it persist two nights → RED.
- [ ] **Step 7:** Commit.

---

### Task 4: Dagger

**Files:** Modify `js/tr/powers.js`, `js/tr/roundtable.js`. Test: `tests/tr-powers.test.js`.

Spec §7.3: doubles your vote at the next banishment. **Historically decides seasons by breaking 3-3 endgame deadlocks** — so it must actually reach the endgame, not expire in the mid-game.

- [ ] **Step 1:** Failing test — a dagger holder's ballot counts twice, and a 3-3 tie resolves rather than going to a revote.
- [ ] **Step 2:** Run, confirm fail.
- [ ] **Step 3:** Implement in `runRoundTable`'s tally, not in the ballot itself — a doubled vote must still read as ONE name aloud, because ballots read aloud are the game's only public facts.
- [ ] **Step 4:** Run; bands hold; the all-tied path still resolves (an earlier bug banished `undefined`).
- [ ] **Step 5: Measure** how often a dagger changes an outcome, and how often one reaches the endgame unused.
- [ ] **Step 6: Mutations** — count the dagger once → the tiebreak test RED; make the doubled vote read as two names → the public-facts test RED.
- [ ] **Step 7:** Commit.

---

### Task 5: The Seer — the game's one `observed` alignment belief

**Files:** Modify `js/tr/powers.js`, `js/tr/deduction.js`. Test: `tests/tr-powers.test.js`, `tests/tr-deduction.test.js`.

Spec §7.3: once per game, **endgame only**. A private meeting in which one player must **truthfully** confirm their alignment. **Only the Seer sees it**, and **both parties may lie about it afterwards.**

This is the single most constrained mechanic in the plan. It is the only `observed`-credibility alignment write in the game, and §4.1's credibility ceiling exists to stop certainty being laundered.

- [x] **Step 1:** Failing test — the Seer learns a true alignment at `observed` credibility; NO other player's belief changes; and a later claim about the meeting by either party is `rumor`, not `observed`.
- [x] **Step 2:** Run, confirm fail.
- [x] **Step 3:** Implement. Gate to the endgame. Once per game, globally.
- [x] **Step 4:** Run; **verify the credibility ceiling still holds** — exactly three `public` alignment writes and now exactly one `observed`.
- [x] **Step 5: Mutation** — write the Seer's read at `public` → the ceiling guard RED. Let a second Seer read happen → RED. Let a bystander learn it → RED.
- [x] **Step 6:** Commit.

---

### Task 6: Traitors must be able to turn on each other

**Files:** Modify `js/tr/deduction.js:346`. Test: `tests/tr-deduction.test.js`, `tests/tr-calibration.test.js`.

**This is the endgame's hard prerequisite and it is currently impossible.** `chooseBanishmentVote` reads:

```js
const safe = isTraitor ? pool.filter(n => alignmentAt(n, ep) !== 'traitor') : pool;
```

A Traitor is **hard-barred** from ever naming a fellow Traitor — measured 0 occurrences in 1,996 seasons. The endgame is *entirely* about Traitors betraying Traitors for the pot, so an absolute bar makes it unreachable.

- [ ] **Step 1:** Failing test — late in a season, with the pot large and few players left, a Traitor can and sometimes does vote for a fellow Traitor; early in a season they essentially never do.
- [ ] **Step 2:** Run, confirm fail (currently 0 always).
- [ ] **Step 3:** Replace the hard filter with a **weighted** reluctance: enormous early, falling as the field shrinks and the pot grows. **Proportional, never a threshold** — this is a gameplay decision, and the project rule is `stat * factor`, never `if (stat >= X)`.
- [ ] **Step 4:** Run; **watch every deduction band** — this changes who gets banished, so the hit rate, early/late lift, growth and board bands are all in scope. A band moving here is a REAL regression, not drift.
- [ ] **Step 5: Measure** the betrayal rate by round and by pot size over 400 seasons. Report the curve, not a single number.
- [ ] **Step 6: Mutations** — restore the hard bar → the late-betrayal test RED; make reluctance constant → the early-vs-late test RED.
- [ ] **Step 7:** Commit.

---

### Task 7: The endgame — Banish or End Game

**Files:** Create `js/tr/endgame.js`. Modify `js/tr/headless.js`. Test: `tests/tr-endgame.test.js`.

Spec §8. After the final mandated Round Table each survivor **secretly chooses**. **One vote to banish forces another Round Table.** Loop until unanimous. Resolution: only Faithfuls remain → they **split the pot**; any Traitor remains → the Traitor or Traitors **take all of it** and the Faithfuls get nothing.

**No reveals during the endgame.** Players banished in the finale do not reveal alignment, so survivors continue on nerve alone — `revealCascade()` is switched OFF for the endgame, and that is what makes the last two votes feel different from every earlier one.

- [ ] **Step 1:** Failing test — the loop runs until unanimous; a single banish vote forces another table; no reveal fires during the endgame; and the pot resolves per the rule above.
- [ ] **Step 2:** Run, confirm fail.
- [ ] **Step 3:** Implement. The secret choice must read from beliefs, not ground truth — a Faithful ends the game when they believe the room is clean, which is exactly when they are most often wrong.
- [ ] **Step 4:** Run; full suite; bands hold.
- [ ] **Step 5: Measure** over 400 seasons: how often Faithfuls win, how many endgame rounds a season takes, and how often a Traitor survives to take everything. Report against the real show's outcome distribution if the numbers are wildly off.
- [ ] **Step 6: Mutations** — let one banish vote end the game → RED; fire `revealCascade` in the endgame → RED; let Faithfuls split the pot with a Traitor alive → RED.
- [ ] **Step 7:** Commit.

---

### Task 8: Murder variants

**Files:** Create `js/tr/murder-variants.js` or extend `js/tr/murder.js`. Test: `tests/tr-murder.test.js`.

Spec §7.4, the show's twist catalogue, **mutually exclusive per round**: standard; On Trial / Death List; **Murder in Plain Sight** (poisoned drink, kiss on the cheek, or a hug at a dinner party — **no conclave**); Face-to-Face (chapel pleas); the Dungeon; double murder; Traitors forced to name one of their own.

- [ ] **Step 1:** Failing test — each variant fires, exactly one variant per round, and Murder in Plain Sight runs with no conclave.
- [ ] **Step 2:** Run, confirm fail.
- [ ] **Step 3:** Implement. Each variant must produce DIFFERENT evidence — that is the point of a variant. A no-conclave murder leaves no conclave tension to trace.
- [ ] **Step 4:** Run; bands hold; `murderEvidence`'s once-guard still holds (an earlier bug re-emitted old rounds forever).
- [ ] **Step 5: Measure** each variant's firing rate over 400 seasons against the reachability floor, and report what evidence each one leaves.
- [ ] **Step 6: Mutations** — allow two variants in one round → RED; give Murder in Plain Sight a conclave → RED.
- [ ] **Step 7:** Commit.

---

## Ordering

Task 6 gates Task 7 — the endgame cannot be built while Traitors cannot name each other. Task 1 gates Tasks 2 and 3 (missions must exist before a mission grants a Shield or reads knowledge). Tasks 4, 5 and 8 are independent. Task 5 (Seer) is endgame-gated and so is easiest to verify after Task 7, but may be built before it.

## Carried to Plan 8 (the VP layer) — recorded now, not built here

The user's stated requirements for the visual layer, captured while fresh:

- **The signature Traitors look** — it must read as that show, not as a reskin of Total Drama or Big Brother. Spec §9 requires each part to have its OWN visual identity per the overdrive baseline, not a shared shell with a swapped palette.
- **Wow factor, and visually organised** — both, not one at the cost of the other.
- **Every part gets its screen**: cold open, house status, the mission, the Round Table (debate, slates, ballots read one at a time, the reveal), **the conclave as the signature screen** (cloaks, lantern light, the shortlist argued aloud, the wax seal, and the dramatic irony of watching people plan a death for someone they were laughing with an hour ago), recruitment, the endgame.
- **Sidebar, screen organisation, debug** — the live-updating sidebar gated by `_tvState`, the screen sequence, and the debug view.
- **The observer contract (spec §9.1)** — every builder takes `rpBuild*(ep, observer)`. Three information layers must be renderable: what a given player knows, what the Faithfuls collectively believe, and what is true. **Deciding this now is free; retrofitting it later is a rewrite.**
- Text backlog is a complete retranscription of every VP narration.

---

## Standing requirement, added after Task 1: a sentence must agree with the ledger

This defect class has now appeared THREE times, twice in Plan 5 and again in Task 1 of this
plan, each time found by reading and never by an assertion:

1. `grief-nobody-sleeps` printed a bed count wrong on all 363 firings -- it summed a ledger
   the first murder is deliberately not in.
2. `callback-no-history-envy` said "names and seasons they had no part of" while its
   precondition never checked the outsider lacked history -- false on all 157 firings.
3. Task 1's mission `failed` lines said "nothing earned" over a ~2,000-credit payment.

Plan 5's own rule applies and was not applied: **fixing the instance you noticed does not fix
the class.** Every task in this plan that emits narration must therefore carry a guard of this
shape, not merely fix the instances it happens to notice:

**Any sentence asserting a fact about season state must be checked against that state.** A
printed count agrees with the count; a claimed absence is actually absent; a "nothing
happened" line does not run over something happening. Where the claim is not mechanically
checkable, the precondition must encode it -- if the sentence says the outsider has no
history, `weight()` checks that the outsider has no history.

Task 1 fixed its instance at source (a pass mark, so sentence and ledger cannot disagree),
which is the right shape: make the contradiction unrepresentable rather than assert against it
after the fact.

## Handoffs recorded from Task 1

- **Task 3 must narrow the missions-grant-nothing guard deliberately.** It is true today;
  shields are won in missions, so it becomes "identical except the shield's effects" and needs
  its own mutation rather than silently weakening.
- **Task 2's rule is "no alignment belief above `deduced`", NOT "no `learn` call".** The Chess
  mission is supposed to emit evidence; the constraint is its credibility, not its existence.
- Missions run on a THIRD hashed rng stream and deliberately write no bonds -- a bond write
  feeds `bondResistance()` -> `suspicion()` and would move the deduction bands from a content
  task. The equivalence arm proves it: missions-off reproduces the base log string-for-string
  over 40 seasons.
- `gs.tr.pot` still has no reader. The sting exists only in fiction until Task 7 lands.

## Task 2 added two defect shapes to the taxonomy

Both were found the same way: a guard that was GREEN on its first draft, caught only by
running the mutation it was written for.

**1. A store sweep measures SURVIVORS of an overwriting process, not writes.** The
credibility guard swept the belief store and passed a mutation writing at `observed`, because
only 2 of ~250 mission beliefs survive a season -- later writes overwrite earlier ones, so the
store at season end is a tiny biased sample of what was written. **The rule binds the write,
so the guard must inspect the write.** It now checks every `learn()` call's arguments.

Generalise: whenever a rule constrains an ACTION, guarding the resulting STATE is only valid
if state retains every action. Ask what fraction of actions survive into the state you are
asserting on.

**2. Duplicate-source drift, again.** The tier-reachability test re-derived the tier from
`quality` using its OWN copy of the cuts, so moving the real cuts left it green. `runMission`
now records `rec.tier` and the test reads it. This is the third appearance of two copies of
one rule in this project -- the act-name triplication and the pool-shape figures were the
others. **A test must read the value under test, never recompute it.**

## Task 2's other carried facts

- The chess channel is priced AT `ALIGNMENT_CRED_CEILING` -- **no headroom remains for a
  later, louder tell.** Any future mechanic wanting to be more credible than this one has
  nowhere to go without raising the ceiling, which the whole deduction model is built around.
- **26.8% of seasons still have no evidence source 4 at all.** A second knowledge archetype
  would roughly double emission; that is a design decision, not a copy-paste.
- Pricing is the whole ballgame: at the first taste-chosen price the channel was inert at
  +0.10pp. It was swept 0.20->0.62 against a matched noise arm -- monotone for the real
  channel, flat-to-falling for noise -- before shipping at +3.28pp, t=8.90, 12/12 blocks.
- **Task 3 must narrow the missions-grant-nothing guard a SECOND time**, for the Shield, the
  same way Task 2 did for chess: hold the shield-granting archetype out of the equivalence
  arm, and add an arm proving the hold-out actually holds something out.

## Task 3's architectural finding: the knowledge model cannot CLEAR anybody

A blocked murder should exonerate its target -- the Traitors chose them and failed, so they
are not a Traitor. **It cannot, and this is structural.** `learn()` has no clearing primitive,
and writing an exoneration through `_assess` makes roughly **seven readers in ten SUSPECT the
person it clears**, because the model reads any alignment traffic about someone as evidence
against them.

So the model can express "I think X is a Traitor" and cannot express "I know X is not."
Building a clearing primitive is a design act with its own sweep -- it touches every reader in
`deduction.js` and would need the full band re-derivation. **Recorded, not attempted.**

Consequences to carry:
- The blocked-night read fires ~15 times in 200 seasons. Anything that makes the conclave
  better informed drives it toward zero, so it is fragile to later tasks.
- Any future mechanic whose fiction is "this proves someone innocent" hits the same wall.
  Check against this before designing one.

## Task 3's other carried facts

- **A pact-wide Traitor blind spot was measured and rejected before it shipped**: it produced
  ONE block in 200 seasons -- the format's strongest read, written but unreachable. Per-Traitor
  gives 13 in 200 and is the truer model. Implemented as a score PENALTY, not a candidate
  filter, because a filter consumes one fewer rng draw per candidate and re-rolls the season.
- `CHESS_WEIGHT` went 2 -> 3 so a seventh archetype did not silently take a fifth of Task 2's
  +3.28pp off a calibration band. **Adding an archetype dilutes every existing one** -- the
  mission pool is a selection, so check what a new entry costs the ones already measured.
- Early lift drifted 3.88 -> 4.60pp (t=1.39, under the 3-sd bar, ceiling 10pp). A three-arm
  ablation attributed all of it to the belief channel, not the mechanic: **coverage, not
  information.** Mitigated with a fiction rule, not a price.
- `gs.tr.pot` still has no reader, and now neither does the recorded `shield.cost`. Both wait
  on the endgame.

## Task 4's carried facts, and the mutation that survived

**A guard over a POPULATION can be unfalsifiable while looking fine.** The one-Dagger-at-a-time rule
was asserted across 120 seasons and stayed GREEN with the rule deleted, because only 22 seasons in
400 award a second Dagger at all and the overlap it forbids is rarer still. The fix was to assert
the rule where it is DECIDED (`daggerAfternoon`, which fires every time) and to put a coverage floor
on the population arm so it can no longer pass while observing nothing. This is Task 2's "necessary,
not sufficient" in a third shape, alongside the store sweep and the recomputed value: **before
trusting a population guard, ask how many times the forbidden state is even reachable in the sample
you are asserting over.**

**The Dagger is a KEPT power, and that is a reading of the spec rather than an embellishment.**
§7.3's two sentences — "doubles your vote at the next banishment" and "breaks 3-3 endgame deadlocks"
— cannot both be true of a power spent the afternoon it is won. So it is carried; `drawAt` (the room
size at which its holder's nerve gives out) is rolled at ACQUISITION on the missions' stream, and the
table reads a number already written down. **`runRoundTable` takes no new rng draw**, so a season
with a Dagger in it remains comparable with the season without one.

**The relic split cost the Shield, on purpose, to protect the Chess channel.** The Reliquary yields
ONE relic and a Dagger only below twelve living, so Shields fall 1.67 → 1.12 a season and blocked
murders 13 → 8 per 200. An eighth archetype would instead have re-opened the `CHESS_WEIGHT`
arithmetic Task 3 closed. **Anyone restoring the Shield rate via `SHIELD_WEIGHT` must re-derive
`CHESS_WEIGHT` with it.**

**A doubled vote lives in the tally, and the guard is a PAIR of tests.** One says the count changed;
the other says the read-aloud record did not (identical ballot strings, one ballot per voter, no
weight field on a ballot). The mutation that implements the doubling as a duplicate ballot passes the
first and fails the second, which is the only arrangement that actually protects the public-facts
invariant.

**Bands: early lift 2.0 → 2.3pp, late 19.4 → 19.6pp, base vs head on the same command.** No band
moved. Note for later tasks that this file's default population reads early lift at ~2pp, not the
~4.60pp measured on Task 3's larger decorrelated blocks — quoting the wrong one is how a delta gets
differenced against a baseline that never shipped.

**Two prose defects, both found by dumping seasons and reading, neither by an assertion.**
`_render` had no capitalised pronoun forms, so a Dagger draw line printed `{They}` on 100% of
firings. And the witness-tier pool, shared with the Shield, contained one line ending "exactly what
she is carrying TONIGHT" — true of a Shield, false of a Dagger, printed over a woman still carrying
hers when she was banished the next evening. **A pool shared between two mechanics must not name a
property only one of them has.**

**For Task 7.** `gs.tr.daggers` reaches the endgame with an unspent Dagger in a survivor's hand in
6% of seasons (24 in 400); that is the state a 3-3 finale deadlock is broken from. `tally(ballots,
weights)` takes an open `{ voter: n }` map, so the endgame can weight a vote without touching it.
`drawAt` is capped at 9 and the season loop stops at 3, so a Dagger carried to the finale fires at
the endgame's first table unless `daggerWeights` is gated further.

## Task 4's defect shape: unfalsifiable because the forbidden state is RARE

A mutation SURVIVED. The guard forbade a second Dagger being held, but only **22 seasons in
400** ever award a second Dagger at all, so the sample barely contained the forbidden state
and the assertion could not see the rule break.

**This is distinct from the eighteen unfailable tests and from the knife-edge class.** The
assertion was well-formed and the margin was irrelevant -- the POPULATION did not contain
enough of the case. Fixed by asserting where the rule is DECIDED (at the award site, every
time) plus a coverage floor proving the sample contains the case at all.

**Generalise: before asserting a rule over sampled seasons, count how often the sample
actually reaches the state the rule forbids.** If it is rare, assert at the decision point and
add a coverage floor. This bites hardest on rules about things that are rare BY DESIGN --
which is most interesting game mechanics.

**Task 6 walks straight into this.** Traitor-on-Traitor votes are rare by construction; a
season-level guard on them will be unfalsifiable for exactly this reason.

## Task 4's other carried facts

- The Dagger is KEPT, not spent the day it is won -- §7.3's two sentences cannot both hold
  otherwise. Won once the castle is down to twelve, drawn when the room is small enough. No
  draw ever happens in a room bigger than 9.
- `runRoundTable` takes **no new rng draw**; doubling is entirely in `tally(ballots, weights)`
  and ballots are untouched, so a doubled vote still reads as ONE name aloud.
- **No eighth archetype**, to avoid diluting `blind-chess` again -- the Reliquary yields ONE
  relic, so the cost landed on the Shield instead (1.67 -> 1.12/season). Restoring it via
  `SHIELD_WEIGHT` would re-open the `CHESS_WEIGHT` arithmetic Task 3 closed.
- The conclave-steering ablation is **2.5 sd, under the 3-sd bar** -- consistently signed,
  not demonstrated. Reported as such rather than claimed. `_setDaggerSteeringEnabled` exists
  to re-run it. Its unit test reads 60/60 because the fixture carries no information, not
  because the bonus overrides -- the ablation numbers are the honest ones.

## Task 6 done — the pact is a price, and two things it leaves behind

`reluctance = 0.55 * cover^2 * (1 - 0.9*potShare)`, `cover = max(0, (living-2)/2)`, subtracted
from the fellow's score. Reads the LIVING FIELD, not the candidate pool -- a revote is not an
endgame. Betrayal 0% at ep2-8 and at every field size 7-20 (0 of 6,415), rising to 47.3% at a
field of 5 and 54.6% at ep12. Pot conditioned on field=5: 33.3 -> 41.1 -> 48.9 -> 68.2%. Both
terms independently monotone.

**The technique that made it safe:** the fellow's noise term is HASHED from (voter, fellow,
ep) rather than drawn, so a Traitor's ballot consumes exactly the draws it always did. A
season diverges from base ONLY on nights somebody actually turns -- which is what makes the
band deltas attributable to the mechanism instead of stream drift. This is Plan 5's
path-neutrality technique applied inside the deduction core, and it should be the default for
any future change to a decision function.

### 1. The bands now measure something slightly different, and this must not be forgotten

**~0.97pp of the 23.2pp late lift and ~0.54pp of the 35.3pp hit rate is Traitor
SELF-DESTRUCTION, not deduction.** A Traitor naming a fellow is a correct banishment the room
did not earn. Six bands moved with |t|>3 (largest 0.97pp), none red, none toward a threshold,
none retuned.

**No future task may credit the deduction engine with that share.** If a later task wants to
claim it improved deduction, it must separate the two -- the honest comparison is against a
head that already contains betrayal, not against Plan 5's numbers.

### 2. A betrayal is SILENT -- the show's biggest moment prints nothing

A Traitor turning on a Traitor produces **no event, no thread beat, no exit line, nothing
anywhere**. Not a false sentence: no sentence. It is the single most dramatic thing the format
does, and the season says nothing about it.

**Task 7 or Plan 8 must give it narration**, and it should be the loudest text in the game.
Note the constraint from Task 3's finding: the knowledge model cannot CLEAR anybody, so the
fallout of a betrayal can be written as suspicion and shock but not as anyone being exonerated.

### Task 6's other carried facts

- **The hard bar was itself a ground-truth leak.** "X never named Y" was a perfect tell across
  a whole season. Weighted reluctance REDUCES the ground-truth signature in public behaviour.
- The missions guard was narrowed a THIRD time (the pot now has a reader), in the Task 2/3
  shape. Its hold-out arm projects the BALLOT RECORD, not the banishment log -- on the
  banishment projection the separation was only 1.5 sd at 120 seeds.
- Pre-existing, found by reading, deliberately NOT fixed: `COMMIT_LINES.kept` in
  `js/tr/castle/trust.js` asserts how somebody voted from a fork that never inspects a ballot.
  Fixing it moves bonds and therefore bands, from inside the one task meant to hold them still.
  **Carry it to a task that is allowed to move bands.**
- Five stale comments across three files asserted the hard bar as fact. Corrected with
  measurements attached.

## Task 7 done — a season can now END

Faithful win 45.5%; a Traitor takes everything 218/400 (54.5%), 158 alone and 60 shared;
endgame rounds mean 1.29 (130 seasons banish nobody, up to 6 tables). Entry field mean 5.50,
mean pot 63,632, mean payout 37,567. Inside the real show's shape, so nothing was re-priced.

**The loop EXTENDS Task 6's betrayal curve rather than distorting it.** Fields 7-20
bit-identical base to head. Field 5: 47.3% -> 48.0% (the endgame's own 252 decisions betray at
48.4%, the same rate). Field 6 dilutes 4.4% -> 3.0% -- a different subpopulation, not a changed
formula. Fields 4 and 3 are NEW and continue monotonically at 81.0% and 93.9%.

**Eleven deduction bands came back BIT-IDENTICAL**, structurally enforced rather than
asserted: `rounds` stays the mandated slice and the finale tables return in `endgame.rounds`,
so the plurality population is not silently redefined under the band that measures it. Two
numbers moved because the QUANTITY changed meaning and neither was retuned -- faithful win
40.0 -> 41.0% (`winner` now means who took the money) and the pact's late arm 24.16 -> 48.51%
(the <=6 bucket now holds endgame ballots; per-field rates unchanged, the mix shifted).

### The defect shape Task 7 caught in its own guard: a timestamp that updates on access

The no-reveal probe keyed on `learnedEp` -- but **`learn()` bumps that field on every call**,
so an episode-1 turret belief re-dated by a finale rumour read EXACTLY like a reveal. The
guard now keys on `source === 'the reveal'`.

Generalise: **a field that updates on access cannot testify about when something happened.**
Check any guard keyed on a timestamp for whether the timestamp means "when this was first
true" or "when this was last touched". The second answers a different question.

Its other self-caught defect: the completeness arm RECOMPUTED alignment and hit the
recruitment-era trap -- alignment has eras, so recomputing it at season end misreads anyone
who flipped. This is the third appearance of "a test must read the value under test, never
recompute it".

### Betrayal narration shipped

Placed in `roundtable.js`, not `endgame.js`, so it covers the late mandated tables too.
4-line `lineFor` pool, no rng draw. Four prose defects found by dumping and reading, none by
assertion: plural verbs over a lone winner and a lone loser, "the Faithfuls beside them get
nothing" over a castle with none, and an "and...and...and" list. All fixed by making the
contradiction unrepresentable -- the pool is keyed on taker count and on whether anyone stands
beside them -- with a ledger-agreement guard alongside.

### Carried

- **`shield.cost` still has no reader.** The endgame gave it no natural home.
- **The Dagger fires at the endgame's first table**, as Task 4 predicted. `tr-powers.test.js`
  was going red on exactly the state 7.3 wants and was widened to search `endgame.rounds`.
  Gating it needs its own decision.
- **`potShare()` is now shared out of `deduction.js`** -- the FOURTH narrowing of the missions
  guard, and it had to be a property of the READER: a private copy left the endgame seeing a
  pot the rest of the engine could not, and the two arms diverged on `survivors`.
- The endgame plays at whatever field the mandated loop leaves, sometimes 7+. It converges
  (max 6 tables in 400 seasons), but the show's shape lives in the mandated loop's exit
  conditions, not here.
- `COMMIT_LINES.kept` in `js/tr/castle/trust.js` is still wrong and still carried -- fixing it
  moves bonds, and this task could not move bands either. **It needs a task that is allowed to.**


## Task 5 done — the one certain thing, and the two people who may lie about it

The Seer ships: once per game, endgame only, `observed`, and there is now **exactly one**
`observed` alignment source in the whole store (`'the seer'`, 389 beliefs over 400 seasons)
against the three sanctioned `public` write sites. Fires in 97.3% of seasons; the misses are
endgame rooms below three.

### 1. It is not louder than a deduction — it is surer of itself, and that is the whole design

`learn()` clamps it to `ALIGNMENT_CRED_CEILING` like everything else, so the Seer writes 0.62,
the number `blind-chess` already sits at. What `observed` buys is the `direct` branch:
unconditional acceptance and a valence from ground truth instead of an intuition roll. **That
is also what makes it the ONLY clearing primitive in this engine** — a clean read writes
`valence: 'false'` deterministically and overrides whatever the Seer already believed, which no
non-direct write can do (Task 3's wall stands everywhere else). Any future mechanic wanting to
clear somebody hits that wall unless it goes through `observed`, which must never widen.

### 2. In this format, ANY stat correlates with alignment among the survivors

Selection weighted by `intuition` — which says nothing about a cloak — put Traitors in the
Seer's seat **38.7%** of the time in rooms that were 18.1% Traitor. Selection is uniform and the
base rate was taken at the same table, so neither explains it. **Survivorship does:** a Traitor
who reads badly is banished and a Faithful who reads badly is not, so the Traitors who *reach*
an endgame are intuition-selected and the Faithfuls beside them are not.

**Generalise: a rule that must be alignment-blind at the endgame has to be blind to stats too,
or prove otherwise against the base rate at the same table.** Now one hash indexed into the
sorted room: z = 0.23 (n=389), z = −0.10 (n=1,553).

Two estimator lessons fell out of measuring it, both "fix the estimator, not the threshold":
- **The null is a mean of per-room shares, not a pooled share.** Pooling weights big rooms while
  the draw happens once per room, and endgame rooms that are Traitor-dense are the small ones.
  That mismatch alone read as a 10pp leak.
- **A per-player hash is fixed forever**, so the same names win the same nights in every season
  ever played, and a name that reaches episode eleven more often when wearing a cloak hands that
  correlation over. Measured z = 2.61 at n=1,553 — under the bar, consistently signed, removed
  for nothing by hashing the room instead.

### 3. Two mutations survived, in two new shapes

- **A prose guard that only agreed with itself.** "A line calling itself a lie sits on a claim
  recorded as one" is green when a mutation makes `truthful` a constant, because the lying pool
  simply stops being reached and the pools stay self-consistent. The rule that binds is that
  each claim kind asserts a *different fact* and `truthful` must agree with the one it asserts.
- **A pooled floor over two channels.** "Some claim reached somebody" is carried by one live
  channel while the other is dead. Per-channel floors.

And a third, about the mutation rather than the guard: **the endgame gate is defence-in-depth
over the CALL SITE, and a gate mutation alone is unfalsifiable while only one caller exists.**
The mutation that actually breaks the equivalence arm is calling `openSeer` inside the mandated
loop; that takes the arm, the gate guard and a calibration band red together.

### 4. Bands: fourteen unchanged structurally, one moved and it is the declared sanity check

No rng draw anywhere in the Seer, so the mandated season is **bit-identical** base to head over
400 seasons on nine projections (`log`, `rounds`, `missions`, `shields`, `pot`, `roleHistory`,
`blockedMurders`, `threads`, `traitors`) — shipped as a test with a hold-out arm. Every band
computed from those is arithmetically unchanged. The only band reading `s.winner` moves
**41.0 → 44.0%** against bounds of 10–75%, on the file's own population; 41.0% reproduces Task
7's figure exactly. Not retuned.

Endgame outcomes: faithful win 45.5 → 48.8%, a Traitor takes it 218 → 205. Entry field, endgame
rounds and pot unchanged — the Seer changes who wins, not the shape of the phase.

### 5. Carried

- **`shield.cost` still has no reader.** Three tasks now.
- **`COMMIT_LINES.kept` in `js/tr/castle/trust.js` is still wrong**, and still needs a task
  allowed to move bands.
- **97.3% availability is deliberate**, so the once-per-game rule is re-decided on every endgame
  table and the refusal path carries the coverage. Making the Seer a power a season might not
  have means re-deriving every floor in `tr-powers.test.js`, and the deltas above are quoted at
  this availability.
- **If a later task wants the Seer to matter more, the lever is the claim economy, not the
  credibility.** There is no headroom above the ceiling and there must not be.
- **The meeting has no screen.** `endgame.seer` carries `meetingLine`, `readLine`, both claim
  lines, `truthful` on each, and `seerTruth` — which is all three of §9.1's information layers
  (what the Seer knows, what the room was told, what is true) already on the record.

## Task 8 done — Plan 6 complete at 360 tests

Seven variants, all clearing a floor of 40 per 400 seasons by at least 50: standard 70.30%,
plain-sight 5.57%, double 5.33%, on-trial 5.19%, dungeon 4.67%, name-your-own 4.51%,
face-to-face 4.43%.

**Each leaves evidence the others do not** (subject share vs the MEAN OF PER-ROOM Traitor
shares, living subjects only): on-trial the SPARED z=8.98; plain-sight PROXIMITY z=15.85 plus
no conclave so no overrule on the ledger (0 across 57 nights vs 820 across 734 standard);
face-to-face the victim's OWN READ said aloud z=6.34; dungeon WHO CAME BACK UP z=7.75 plus a
private single-holder read at `deduced`, right 27.8% of the time; double A NAME BOTH VICTIMS
HAD BEEN PUSHING z=3.60.

**`name-your-own` leaves NOTHING, on purpose, and that is its signature.** The ordinary
channel fires over a Traitor's body and indicts pushers who are 0.8% Traitor against a room of
20.4% -- **z = -12.83**. The variant's evidence is that the normal evidence LIES. The pact pays
in grudges instead.

### 400 seasons is NOT enough to price a rare channel

The double's evidence read **z=2.80 at 400 seasons and z=0.88 at 1,200** -- a false positive at
nearly three sigma, on the sample size this project has used as its default all plan. Every
enrichment figure in Task 8 was re-taken at 1,200.

**Carry this: the standard 400-season sweep is adequate for pool-wide statistics and NOT for a
channel that fires on ~5% of nights.** Size the sample to the rarity of the thing measured,
not to habit.

### Two more guards that survived their first mutation

- A chapel prose guard **only agreed with itself** -- fixed by recording the pool key and
  checking the text really came from that pool. This is the same shape as Task 5's, and the
  second appearance in two tasks: a prose guard that verifies a string against a rule it
  derived from the same string proves nothing.
- A missing **living-subject filter** made the double's channel read z=0.88, because most
  names it indicted had already left the castle. With the filter, z=3.60. **A channel measured
  over dead subjects is measuring nothing** -- check the population before the statistic.

### Bands: five moved, none retuned, each attributed by three-arm ablation

Faithful win 44.0 -> 53.0%, early lift 2.4 -> 4.4pp, late lift 20.0 -> 22.3pp, pact endgame
betrayal 48.53 -> 38.94%, blocked murders 8 -> 11.

The ablation splits them cleanly: **the faithful-win swing is ENTIRELY MECHANICAL** --
`name-your-own` kills a Traitor the room did not earn, and **no later task may credit
deduction with it** (this is now the second such carve-out, alongside Task 6's ~0.97pp of
self-destruction). The deduction movement is **entirely the channels**; the mechanic alone
makes the room slightly worse.

Outside the calibration file, `tr-castle-prose.test.js`'s rarest-key floor was crossed because
seasons now END SOONER -- fixed by raising the sample 3,200 -> 4,200, **not the threshold**.

### Still carried out of Plan 6

- `shield.cost` has no reader after four tasks.
- `COMMIT_LINES.kept` in `js/tr/castle/trust.js` is wrong and needs a task allowed to move
  bands. Every task since Plan 5 has declined it for the same correct reason.
- `voice-on-the-stair` writes ~23 times in 200 seasons against a floor of 12 -- guarded, but
  near the edge of measurability.

---

# CORRECTION: carve-out B was INVERTED, and it was my error to record it

The plan stated: *"the faithful-win swing is ENTIRELY MECHANICAL -- `name-your-own` kills a
Traitor the room did not earn, and no later task may credit deduction with it."*

**That is backwards.** Three-arm ablation on identical seeds, paired McNemar:

| n | variants OFF | mechanic-only | full | swing | mechanic share |
|---|---|---|---|---|---|
| 200 | 44.00% | 53.50% | 53.00% | 9.00pp | **105.6%** |
| 400 | 48.75% | 53.25% | 55.25% | 6.50pp | 69.2% |
| **1200** | **50.92%** | **51.17%** | **54.58%** | **3.67pp** | **6.8%** |

mechanic-only vs variants-off = +0.25pp, **p=0.86**. Full vs mechanic-only = +3.42pp,
**p=0.021**. **The evidence channels carry 93% of the effect.** The instruction is STRUCK, not
softened: later tasks MAY credit deduction with this.

**How it happened, and it is the sharpest lesson of the plan.** Task 8 discovered that 400
seasons is too small to price a channel firing on ~5% of nights -- and then took this
attribution at **200** seasons, on `name-your-own`, which fires ~47 times in 200 seasons. It
applied its own lesson to its enrichment z-scores and not to its band attribution, in the same
task. I read the number and promoted it into this plan as binding on every future task.

**A lesson learned in one measurement does not automatically reach the other measurements in
the same task.** When a task establishes a methodological finding, sweep that task's OWN
figures against it before recording any of them.

Carve-out A (Task 6, ~0.97pp of late lift is Traitor self-destruction) is **CONFIRMED in
sign**. A paired static recount -- drop every Traitor-on-Traitor ballot, re-resolve plurality
-- gives 0.16pp of a 24.68pp late lift over 3,170 tables; the plan's 0.97pp is a full
re-simulation including downstream population effects. Both small, same-signed, and the
carve-out errs toward over-reserving. **Keep it.**

## Also correct in the record

- **Murder variant percentages are quoted against an unstated denominator.** The plan's
  standard 70.30% / others 4.43-5.57% does not reproduce: over all nights it is 81.63% /
  2.74-3.45%, over ep>=2 nights 79.14% / 3.11-3.91%. The **counts** reconcile (92-115 firings
  per 400 seasons each). Restate against a named denominator.
- Betrayal @3 reads 88.56% +/- 4.06 at n=1200, not 93.9% (plan high ~2.6 sd). @5 reads 42.53%
  vs the plan's ~47% (~1.6 sd high). Both were 400-season figures on rare states -- the same
  sample-size problem, smaller.
- Task 7's pot figure (63,632) was taken before Task 8 shortened seasons and never re-taken.
  Head is 60,780.

---

# Fix round after the whole-plan review

Eight findings (F1-F8) fixed or justified, each with the literal mutation that
proves it; the report is at
`.superpowers/sdd/2026-08-27-traitors-06-missions-powers-endgame/final-fix-report.md`.
360 -> 365 tests, `npm run audit:tr-castle` 5.

## The methodological rule, applied to this round's own figures

Every number below is taken at 1,200 seasons. Two of them moved a lot against
the 200-400 season figures the plan already records, and BOTH numbers are kept
in the tests rather than the newer one silently replacing the older:

- **The late MANDATED pact rate is 11.41% at 200 seasons (n=149) and 20.23% at
  1,200 (n=865)** -- 2.7 sd apart, and 11.41% is what `tr-calibration.test.js`'s
  own population reads. Its band is cut under the LOW reading for that reason.
- **Revote-only betrayals are 3.4% of all turns at 1,200**, not the 8.6% the
  review measured at 400. Another rare state read high on the smaller sample.

And a third, which is the same lesson in the review's own instrument: the first
measurement of the revote betrayals in this round called `alignmentAt()` AFTER
the season loop, scoring every season against the last season's roles, and read
438 silent ballots instead of 41. **The era trap is not only a hazard for
tests; it is a hazard for the measurement that decides how big a defect is.**

## F9: the endgame plays an already-decided game half the time — NOT CHANGED

Reproduced exactly at 1,200 seasons (the review's figures were right):

| | 400 seasons | 1,200 seasons |
|---|---|---|
| entry field, mean | 5.78 | 5.94 |
| entry field, max | 15 | 15 |
| enters at field >= 8 | 24.5% | 26.0% |
| enters with NO Traitor alive | 50.7% | **51.2%** |
| further banishments in those seasons, mean | 1.42 | **1.49** |
| all endgame tables run in a decided game | 54.0% | **54.6%** |

Entry field distribution at 1,200: `3:255 4:198 6:171 5:166 8:67 7:61 10:64
9:56 12:49 2:37 11:33 13:27 14:9 15:7`.

**Deliberately not changed in this round, for four reasons.**

1. It is the mandated loop's EXIT CONDITION, not the endgame's behaviour. The
   endgame plays whatever field it is handed and converges (max 6 tables in 400
   seasons). Nothing in `endgame.js` decides this.
2. Changing when the mandated loop stops moves EVERY band in Plan 6 -- faithful
   win, both lifts, hit rate, both pact arms, entry field, pot and payout. The
   Global Constraints say bands are re-derived only in a task explicitly
   permitted to, and a fix round is not one.
3. It is a design decision rather than a defect. Spec §8 does not fix the field
   at which the mandated phase ends; choosing one is a design act needing its
   own sweep, the way Task 6's price needed one.
4. Everything re-cut in this round is measured against the CURRENT entry
   distribution -- F6's endgame arm at 50.5%, and nine Shield/Dagger floors.
   Moving the distribution in the same commit that sets them would invalidate
   them.

**What a task that takes this on has to decide**, recorded so it does not have
to be rediscovered: at what field the mandated loop should stop (the real show
is 4-5), and whether the 51.2% of seasons that reach the endgame with the
Traitors already gone should end there instead of banishing a further 1.49
Faithfuls out of their share. The second half is the sharper question -- those
banishments are not wrong by the rules, but they are the show cutting people
out of a prize the room has already won, and nothing in the phase knows it.

---

# PLAN 6 CLOSED — 365 tests, 15 bands, credibility ceiling intact

Missions and a pot never maxed (0/1200, mean 0.51 of ceiling) · knowledge as currency
(+3.28pp late lift, t=8.90) · Shield (95.9% expire unused) · Dagger (decides a banishment in
9.3% of seasons) · weighted Traitor betrayal (0% at fields 7-20, 42.5% at 5, 80.8% at 4, 88.6%
at 3) · the Banish-or-End-Game endgame (Faithfuls win 54.6%) · the Seer (one `observed` belief
per season) · seven murder variants each leaving evidence the others do not.

**Credibility ceiling verified by sweeping all 15 `learn()` call sites individually: exactly
three `public` (turret, reveal, recruit) and exactly one `observed` (the Seer).** `learn()`
DEFAULTS `sourceType='observed'`, and every alignment caller passes it explicitly -- that
default is the standing risk.

## The three lessons this plan taught

**1. A methodological finding does not reach the other measurements in its own task.** Task 8
discovered that 400 seasons cannot price a channel firing on ~5% of nights, applied it to its
z-scores, and then took its band attribution at 200 seasons on a variant firing 47 times. The
result inverted at scale (105.6% -> 6.8%) and I promoted it into this plan as binding. When you
establish something about method, sweep your OWN figures against it before reporting any.

**2. The recompute-alignment trap applies to MEASUREMENT, not just tests.** The fix round
counted revote betrayals with `alignmentAt()` after the season loop and read **438 where the
truth was 41** -- a defect sized ten times too large. Alignment has eras; recomputing it at
season end misreads everyone who flipped. This plan already recorded that as a hazard for
tests. It is equally one for the measurement that sizes a defect, and the review's own 8.6%
figure was really 3.4% for exactly this reason.

**3. `\b` inside a template literal is U+0008, and the guard can never match.** Found in
`tr-murder.test.js` (passed on every implementation since it was written), then swept: three
more in the suite, **and one in PRODUCTION** -- `js/rankings-update.js:1205` builds a regex
parsing to `...s+(?:Winner|Pd+)...`, so that `.replace()` has never stripped anything on the
live rankings path. Invisible by inspection; only character codes reveal it.

## Carried out of Plan 6

- **`js/rankings-update.js:1205` is a live production bug** and needs a task that can look at
  rankings output. Not this plan's.
- **Assume every pre-Task-8 rare-state figure in this plan is un-re-measured.** Two are already
  known wrong on the small sample in the same direction (11.41% -> 20.23%, 8.6% -> 3.4%).
- **F9, deliberately not changed:** 26% of endgames enter at field >=8 (max 15), 51.2% enter
  with no Traitor alive, and 54.6% of endgame tables run in an already-decided game. Six
  figures reproduce exactly at 1,200. This is the MANDATED LOOP'S EXIT CONDITION, not the
  endgame's fault; moving it moves every band in the plan, and the spec does not make the
  decision. A future task must decide it deliberately.
- `shield.cost` still has no reader (five tasks). `COMMIT_LINES.kept` in
  `js/tr/castle/trust.js` is still wrong and still needs a task allowed to move bands.
- Pre-existing, unrelated, present at base: `tests/roster-bio-fields.test.js` "keeps the
  paragraph breaks in authored prose" fails.
- `tr-powers.test.js` is now ~56s (tr suite 81s) -- the price of sizing four arms to their
  rare states. Correct trade, worth knowing.
