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

- [ ] **Step 1:** Failing test — the Seer learns a true alignment at `observed` credibility; NO other player's belief changes; and a later claim about the meeting by either party is `rumor`, not `observed`.
- [ ] **Step 2:** Run, confirm fail.
- [ ] **Step 3:** Implement. Gate to the endgame. Once per game, globally.
- [ ] **Step 4:** Run; **verify the credibility ceiling still holds** — exactly three `public` alignment writes and now exactly one `observed`.
- [ ] **Step 5: Mutation** — write the Seer's read at `public` → the ceiling guard RED. Let a second Seer read happen → RED. Let a bystander learn it → RED.
- [ ] **Step 6:** Commit.

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
