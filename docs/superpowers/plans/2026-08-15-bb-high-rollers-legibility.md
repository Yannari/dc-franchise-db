# High Roller's Legibility — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the season readable — say what the money is for, show who has it, and give it something to do before the room opens.

**Architecture:** Three separable pieces. A viewer-facing standings table on House Life (rendering only). A new weekly side bet in `js/bb/bb-bucks.js`'s orbit (engine + three writers). And a copy pass across the primer, the room and the Roulette.

**Tech Stack:** ES modules, no build step. Vitest. No new dependencies.

## Global Constraints

From `docs/superpowers/specs/2026-08-15-bb-high-rollers-legibility-design.md` plus the rules the last three slices established.

- **In-world privacy is UNCHANGED.** No transcript line, no beat, no in-world prose may state a houseguest's BALANCE. The standings table is a VIEWER surface only, exactly as `_bbPowerBand` shows the viewer a secret power the house cannot see.
- **Copy must describe what the engine really does.** The recurring bug in this repo is a generated sentence the mechanics do not honour; it has cost four fix rounds across two slices. Nothing may say "safe for the week", and the Roulette's three branches (spent / void / no chair) must all still be described accurately.
- **Bets must not print money.** The economy is tuned so a season's income buys roughly one purchase (tiers 26/20/14, Roulette 125). A positive-expectation bet undoes that silently. Expected value must be negative and it must be MEASURED, not assumed.
- **`!compressed` is NOT "once a week".** `simulateBBWeek` runs once per cycle; a `week-in-one` double eviction runs its second cycle UNCOMPRESSED (`js/bb-run.js:1027`) and Split House runs one per side. Anything once-a-week gates on `week.segment` — working example at the payout, `js/bb/week.js`.
- **No bare `Math.random()`.** Thread the week's `rng`, or `stableRng(...)` with `gs.bb.seasonSalt`.
- **Serialization:** anything on `gs` or `week` must survive `JSON.stringify`. No Sets, no functions.
- **Every act reaches all three writers** (`js/bb-run.js`, `js/text-backlog.js`, `js/vp-screens.js`); `tests/bb-act-coverage.test.js` is the guard.
- **Every event has a gameplay consequence.** A side bet that only moves numbers is not enough — see Task 2.
- **VP:** CSS/SVG primitives, no emoji, theme tokens (`var(--bbx-key)`) not hexes, painting rules scoped under `.rp-page`.
- **Test command:** name the files — `npx vitest run tests/<file>.test.js`. NEVER `npm test`. Never `git stash`. Kill orphaned vitest workers after the final run.

---

### Task 1: The chip standings table

**Files:**
- Modify: `js/vp-screens.js` (`_bbChipBand` region ~16537, and the House Life render site)
- Modify: `js/bb/week.js` + `js/bb-run.js` if the per-week delta is not already reachable
- Test: `tests/bb-high-rollers-room.test.js` (extend)

A table on House Life: every ACTIVE houseguest, their balance, and the change this week, ordered by balance descending.

`week.bucksLedger` already exists (`[{name, balance}]`, snapshotted per week) and is already carried to `ep.bucksLedger`. Read that — not live state — so a replayed week 3 shows week 3's money. The per-week delta is the payout act plus any spend that week; derive it rather than storing a second copy if you can, and say in the report how you got it.

Note `week.bucksLedger` snapshots `week.houseAtStart`, so it includes the houseguest evicted that night. Decide deliberately whether the table shows them (a deferred minor from an earlier slice); state which you chose.

- [ ] **Step 1: Write the failing test** — the House Life output contains a standings row for every active houseguest with their balance; a replayed early week shows that week's smaller numbers, not the season's final ones; an unthemed season renders no table.
- [ ] **Step 2: Run it, watch it fail.**
- [ ] **Step 3: Build `_bbChipStandings(ep)`** beside `_bbChipBand`, drawn at the same House Life site. Return `''` when there is no ledger. Escape names with `_bbEsc`. Theme tokens only.
- [ ] **Step 4: Verify** — `npx vitest run tests/bb-high-rollers-room.test.js tests/bb-theme-vp.test.js`
- [ ] **Step 5: Commit** — `feat(bb): a table showing who is holding what`

---

### Task 2: The side bet

**Files:**
- Create: `js/bb/side-bet.js`
- Create: `tests/bb-side-bet.test.js`
- Modify: `js/bb/week.js` (run it before the vote), and the three writers

**Interfaces:**
- `SIDE_BET` — frozen `{stake, payout}`. `payout` is the multiplier on a correct bet.
- `runSideBets({week, house, nominees, rng, plan}) -> act | null`
- Act: `{type:'side-bet', week, secret:false, bets:[{name, on, stake}], results:[{name, on, won, delta}], beats:[]}`

**The rules:**

- Runs each calendar week before the eviction vote, once per calendar week.
- A houseguest may stake a small fixed amount on **who they think is going home**. Not everybody bets — willingness is proportional to `boldness` and `strategic`, and to how sure they are. Use `spendPull` from `js/bb/powers.js` if it fits; if it does not, say why in the report rather than bending it.
- **Who they bet on is their READ.** Use what that houseguest actually believes about the week — the same knowledge the vote path uses (`js/bb/knowledge.js`, the plan, perceived bonds). A houseguest with good information bets well; one who wrongly believes they are in the majority does not. Do NOT bet from omniscient state; that would make the bet a coin flip wearing a read's clothes.
- **Correct pays `stake * payout`; wrong loses the stake.** The floor keeps an edge: expected value must be NEGATIVE.
- **Public that they bet; private the stake and the pick.** The same split the room door already uses.
- **The social consequence, required:** a houseguest with high `intuition` may work out who backed their eviction, costing bond between them. Wire it with `addBond`; a bet that only moves money does not meet this project's bar.

**The measurement, which is the point of the task:** report, over at least 2,000 seeded weeks, the share of bets won, the average net change to a houseguest's balance across a whole season, and what share of houseguests can still afford 125 on the room's first night COMPARED TO the same seasons with betting disabled. If betting materially raises balances, the edge is wrong. If it strips the room of all customers, the stake is too high.

- [ ] **Step 1: Write the failing test** — a bet takes the stake immediately; a correct bet pays `stake * payout` and a wrong one pays nothing; nobody bets more than they hold; no beat states a balance; the act reports every bet exactly once; expected value across many seeded weeks is negative.
- [ ] **Step 2: Run it, watch it fail on the unresolved import.**
- [ ] **Step 3: Build `js/bb/side-bet.js`.** 4+ narration variants per category (placed, won, lost, read-caught).
- [ ] **Step 4: Wire it into `js/bb/week.js`** before the vote, gated on `currentTheme()?.economy === 'bb-bucks'` and on the calendar week (`week.segment`).
- [ ] **Step 5: Handle the act in all three writers.** The `bb-bucks` cases are the precedent; use each file's real helpers.
- [ ] **Step 6: Measure**, and report the numbers named above.
- [ ] **Step 7: Verify** — `npx vitest run tests/bb-side-bet.test.js tests/bb-bucks.test.js tests/bb-act-coverage.test.js`
- [ ] **Step 8: Commit** — `feat(bb): a weekly side bet, so the money is live from week one`

---

### Task 3: Say what everything is for

**Files:**
- Modify: `js/bb/themes-high-rollers.js` (`primer`), `js/core.js` (the room's `desc`), `js/bb/high-rollers-room.js` and `js/bb/chopping-block-roulette.js` (narration), the room's VP screen
- Test: `tests/bb-theme-primers.test.js` (extend)

This is a writing task. The complaint it answers: *"i did not understand what was the money really for until the casino thingy and even that i wasnt sure what was going on till in the casino what was the point why would you want to spin."*

**The primer** must state, in its first two sentences, the concrete thing money is for. Not "a back room that will sell you something" — what it sells, what it costs, and what it does. Add the side bet to `rules` once Task 2 exists.

**The room** must state the pitch BEFORE anybody pays, on the screen and in both transcripts: win this and you take somebody off the block, and a wheel — not you — decides who replaces them.

**The Roulette** must answer "why would you want it", in stakes rather than mechanics:
- it takes you or an ally off the block;
- it takes the Head of Household's week away from them;
- and because nobody chose the replacement, nobody can pin it on you.

**Constraints that still bind:** nothing says "safe for the week"; the three branches (spent / void / no chair) stay accurately described; the Pit Boss never says "the house"; every claim must be true of the engine.

- [ ] **Step 1: Write the failing test** — the primer's `what` names the price and the effect; the room's `desc` states the pitch; a rendered room screen contains the pitch before any result; the existing banned-phrase sweeps still pass.
- [ ] **Step 2: Run it, watch it fail.**
- [ ] **Step 3: Rewrite.** Read the existing text first; this is an edit, not a fresh draft.
- [ ] **Step 4: Verify** — `npx vitest run tests/bb-theme-primers.test.js tests/bb-high-rollers-room.test.js tests/bb-chopping-block-roulette.test.js tests/bb-act-coverage.test.js`
- [ ] **Step 5: Read a real backlog.** Play a themed season, dump `generateBBSummaryText` for every episode, and READ it — that is how the last two prose bugs were found, and neither was catchable by assertion. Report what you saw.
- [ ] **Step 6: Commit** — `feat(bb): say what the money is for and what a spin does`

---

## Self-review notes

- **Spec coverage:** §1 standings → Task 1. §2 side bet → Task 2. §3 rewritten explanations → Task 3.
- **Ordering:** Task 3 depends on Task 2 existing (the primer should mention the bet), so it runs last.
- **Interface consistency:** `SIDE_BET`, `runSideBets` and the `side-bet` act type are defined in Task 2 and used under those names in Tasks 2 and 3.
- **Known soft spot:** Task 2's "bet from what the houseguest actually believes" is the hardest requirement to get right and the easiest to fake with omniscient state. The test for it has to compare a well-informed houseguest's hit rate against a poorly-informed one, or it proves nothing.
