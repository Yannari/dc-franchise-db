# The Coin of Destiny, to canon — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The floor's last and most expensive product. Buy the Coin with real money, win it, call the toss right, and you do not just take the nominations — you run the entire week as a Head of Household whose name the house never learns.

**Architecture:** `js/bb/coin-of-destiny.js` already exists and is genuinely this game; it is built to the wrong rule and to an abstract buy-in. This plan does three things to it — prices the buy-in against the BB Bucks ledger, extends the winner's authority from the nomination ceremony to the whole week (including the post-veto replacement), and gives the dethroned Head of Household canon's consolation instead of our current double punishment. The wiring hooks already exist: `chairAuthority` (`js/bb/week.js:4372`) decides who names a replacement, and `_invisibleGuess` (`js/bb/week.js:5077`) already lands the grievance when nobody's voice said the name.

**Tech Stack:** ES modules, no build step. Vitest. No new dependencies.

## Canon (BB23, wiki-verified)

> Houseguests could pay 250 BB Bucks to compete in the Coin of Destiny. The winner would call a coin toss in private; if correct, they would dethrone the current Head of Household and take over as the anonymous Head of Household for the week, making the nominations and any replacement nomination. The dethroned Head of Household remained safe for the week and was eligible to compete in the following Head of Household competition.

**What we have today, measured against that:**

| canon | `js/bb/coin-of-destiny.js` today |
|---|---|
| costs 250 BB Bucks | costs nothing — `pull` is a bespoke probability (`coin-of-destiny.js:64`) |
| winner is HOH for the **week** | winner makes **nominations only**; the dethroned HOH names the replacement at the veto ceremony |
| dethroned HOH plays the next HOH comp | `gs.bb.outgoingHoh = hoh` runs regardless (`week.js:5320`) and `yard` bars them (`week.js:1911`) |
| the house never learns who | already correct — `secret: true`, and no surface names them |

`week.coinDethroned` is written at `week.js:2987` and **read by nothing**. Task 3 either gives it a consequence or deletes it; it does not stay as it is.

## Global Constraints

- **The price is NOT canon's 250, and the deviation must be written down in the source.** 250 is unreachable below cast 18 (spec §2: cast 16 mean top balance 169, cast 20 mean 236, zero seasons in 40,000 reaching 250 at cast 16). The hypothesis is **165**; Task 4 measures and sets the real number. Whatever lands, it must (a) exceed the Roulette's 125 so the Coin stays the premium product, and (b) be reachable by at least one houseguest on a cast-16 season who skipped the room. One place: the constant in `js/bb/coin-of-destiny.js`.
- **Money leaves on ENTRY and is never refunded.** Buying in and losing the game, or winning it and calling the toss wrong, all cost full price. This mirrors `openRoom` (`js/bb/high-rollers-room.js:386`) exactly.
- **Willingness is decided BEFORE money.** A houseguest who wants in and cannot afford it is a visible beat, not a silent filter. Filtering the ledger first deletes a real thing that happened in that house. `openRoom` has this order and the comment explaining why; do not invert it.
- **One buy-in per houseguest per season**, win or lose.
- **`!compressed` is NOT "once a week".** A `week-in-one` double eviction runs its second cycle UNCOMPRESSED (`js/bb-run.js:1027`); Split House runs one cycle per side. The existing coin dispatch is `!compressed`-gated only (`week.js:2974`) — this plan does not widen that, but Task 1 must not make the money side double-fire. Gate money on `week.segment`.
- **No bare `Math.random()`** — thread the week's `rng` or use `stableRng(...)` with `gs.bb.seasonSalt`. The existing signatures default to `Math.random` and that must change.
- **Serialization:** anything on `gs`/`week` must be plain JSON. No Sets, no functions.
- **Every act reaches all three writers** — `summariseWeek` (`js/bb-run.js`), `js/text-backlog.js`, `js/vp-screens.js`. `tests/bb-act-coverage.test.js` is the guard.
- **The privacy rule stands:** no surface names the coin holder, ever, including the VP. Balances appear only on House Status' purse chip.
- **Copy must describe what the engine does.** Nothing may promise authority the winner does not have.
- **Test command: name the files. NEVER `npm test`.** Never `git stash`. Kill orphaned vitest workers.

---

### Task 1: The buy-in becomes a payment

**Files:**
- Modify: `js/bb/coin-of-destiny.js`
- Modify: `js/bb/week.js` (the dispatch at ~2973)
- Test: `tests/bb-coin-of-destiny.test.js` (create if absent)

**Interfaces:**
- `COIN_PRICE` — exported const, initially `165`. The only place the number lives.
- `runCoinOfDestiny({ week, house, hoh, nominees, rng })` — signature unchanged. Behaviour changes: buyers must afford and are charged; a `short` list records who wanted in and could not pay; `act.price` carries the price.
- `hasBoughtCoin(name)` — one buy per season, backed by a plain array on `gs.bb`.

Notes for the implementer:

- **Reuse the room's machinery, not the room's need function.** `spendPull` comes from `js/bb/powers.js` and is the shared decision. `entryNeed` and `nerveFor` are private to `js/bb/high-rollers-room.js` and must stay that way — write a `coinNeed` local to this file, because the room sells *safety* and the Coin sells *the week*. On-block pressure drives both; the Coin additionally appeals to somebody with a target they cannot reach, so read `getPerceivedBond` against the house the way `coinNominations` already does. Keep the existing `BUY_IN` / `DECLINED` narration pools and add a `SHORT` pool (4+ variants) for the person who walked up and could not pay — mirror `SHORT` in `high-rollers-room.js`.
- The season-play record goes on `gs.bb`, created on first touch, a plain object of plain arrays — copy the shape of `plays()` in `high-rollers-room.js:186` and its comment about why a Set silently forgets the season.
- `spend` returning false is the ledger's last word. Honour it as a closed door; do not retry.
- The HOH is still excluded, for the same reason the room excludes them.
- Default `rng` must become `stableRng('coin-of-destiny', gs?.bb?.seasonSalt || 0, week?.num || 0)`, not `Math.random`.

- [ ] **Step 1: Write the failing test** — a buyer's balance drops by exactly `COIN_PRICE` on entry; a buyer who loses the game is still charged; a winner who calls it wrong is still charged; somebody who cannot afford it never enters and appears in `act.short`; nobody buys in twice in a season; the act names every buyer once.
- [ ] **Step 2: Run it, watch it fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Verify** — `npx vitest run tests/bb-coin-of-destiny.test.js tests/bb-bucks.test.js`
- [ ] **Step 5: Commit** — `feat(bb): the Coin costs money now, and losing does not refund it`

---

### Task 2: The winner runs the whole week

**THE HARD ONE.** Today the coin holder rewrites the block and then hands the week back: at the veto ceremony `chairAuthority` is still the dethroned HOH (`week.js:4372`), so the person who just lost their nominations picks the replacement. Canon has the holder run both ceremonies.

**Files:**
- Modify: `js/bb/week.js` (the coin dispatch ~2973; `chairAuthority` ~4372; the namer ~5077)
- Modify: `js/bb/coin-of-destiny.js` (a replacement beat)
- Test: `tests/bb-coin-of-destiny.test.js`

**Interfaces:**
- `week.coinAuthority` — the holder's name when the toss was called right, else null. Plain string. This is the flag `chairAuthority` reads, and it is **secret**: it must never reach a surface.

Notes for the implementer:

- `chairAuthority` becomes `diamond ? vetoWinner : (roadkillChair ? week.roadkill.winner : (week.coinAuthority || hoh))`. The Diamond Veto and Roadkill outrank the Coin: both are held by somebody who won them *this* week for *this* ceremony, and both are already the exception to the HOH. Check the existing precedence order and preserve it — do not reorder the ternary.
- **The blame must not land on the holder.** `week.js:5077` computes `namer` as `(hohSecret && !diamond) ? _invisibleGuess(replacement) : chairAuthority`. A coin week is exactly the invisible case: no voice said the name. Extend that condition to cover `week.coinAuthority`, so the replacement's grievance lands on their own guess. **If this line is missed, the whole twist inverts** — the transcript names the holder as the person who renominated you, and the anonymity the twist exists for is gone.
- The dethroned HOH is **still safe**. They cannot be nominated or renominated by the holder. Confirm the existing `untouchable` / `protectedNames` sets carry them into the veto ceremony, not just the nomination one.
- **The eligible pool can run out**, and `resolveBBCampaignAct` (`js/bb/shared-strategy.js:1251`) THROWS on a block of fewer than two. The engine's existing rule when a replacement cannot be seated is that the block does not move; extend that guard, do not invent a new one.
- **`gs.bb.stats[name]` on an undefined name throws** and has crashed a real season. Every name reaching it must be checked.
- An unthemed week, and a themed week with no coin, must run **byte-identically**.

- [ ] **Step 1: Write the failing test** — on a week where the toss was called right and the veto is used, the replacement is chosen by the holder's read and not the HOH's; no surface anywhere in the week names the holder; the dethroned HOH is not renominated; a week with no coin is unchanged.
- [ ] **Step 2: Run it, watch it fail.**
- [ ] **Step 3: Implement**, then narrate it in all three writers — the ceremony must say the block moved and that nobody will say whose hand moved it.
- [ ] **Step 4: MEASURE.** Across casts 12–20, report how often a coin week reaches a veto ceremony where the veto is used, and how often the replacement pool runs out. If a one-name block is ever reachable, STOP and report rather than shipping it.
- [ ] **Step 5: Verify** — `npx vitest run tests/bb-coin-of-destiny.test.js tests/bb-act-coverage.test.js tests/bb-diamond-veto.test.js tests/bb-veto-variants.test.js tests/bb-veto-derby.test.js`
- [ ] **Step 6: Commit** — `feat(bb): the coin holder runs the whole week, and nobody learns the name`

---

### Task 3: The dethroned Head of Household

Canon: the dethroned HOH stays safe for the week and **is eligible for the next HOH competition**. We currently take their week and then bar them from winning it back — `gs.bb.outgoingHoh = hoh` runs unconditionally at `week.js:5320` and `yard` (`week.js:1911`) filters the outgoing HOH out of the next comp.

**Files:**
- Modify: `js/bb/week.js` (~5320, and the twin at ~6454)
- Test: `tests/bb-coin-of-destiny.test.js`

Notes for the implementer:

- The existing line already has two exemptions — `week.hohSecret || week.rewound` — and a dethroned HOH is a third of exactly the same kind: somebody who did not get the reign the flag is recording. Add `week.coinDethroned` to that condition rather than writing a new branch.
- **There are TWO of these lines** (`5320` and `6454`, the second on another episode path). Missing one leaves the rule half-applied on whichever path is not exercised by the tests you happen to run.
- This gives `week.coinDethroned` its first reader. It stays.

- [ ] **Step 1: Write the failing test** — after a week whose HOH was dethroned by the coin, `gs.bb.outgoingHoh` is null and that houseguest is in the next HOH competition's field; after an ordinary week, they are barred exactly as before.
- [ ] **Step 2: Run it, watch it fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Verify** — `npx vitest run tests/bb-coin-of-destiny.test.js tests/bb-hoh.test.js`
- [ ] **Step 5: Commit** — `feat(bb): a dethroned HOH gets to win it back`

---

### Task 4: The price, the copy, and a read of the output

**Files:** `js/bb/coin-of-destiny.js` (the constant), `js/bb/themes-high-rollers.js` (the primer), `js/bb/twist-contract.js` (`bb-coin-of-destiny` announcement, ~600), and a backlog read.

- **Set the price by measurement.** Across casts 12, 16 and 20, over enough seeded seasons to be stable, report: the balance distribution at the Coin's week (`fromEnd: 5`), how many houseguests can afford `COIN_PRICE`, and how that splits between people who did and did not buy into the room earlier. Then set the number. The constraint is in Global Constraints; **report the measurement in the commit message**, because the last two prices on this theme were set by arithmetic that turned out to be wrong.
- The primer's `rules` gains the Coin: what it costs, that the winner runs the week, and that nobody ever learns who. **Never write "the house"** in that block — the Pit Boss says the floor, the room, the edge. A test sweeps it.
- The contract's `announcement.rule` currently promises nominations only. It must now describe the whole week, including the replacement.
- **Read a real backlog end to end.** Every prose bug on this theme was found that way and none by a test: a nominee named twice, a settlement printed before the vote it settled, a table that opened three times a week. Report what you saw.

- [ ] **Step 1: Write the failing test** — the primer names the Coin and its price; the announcement describes the replacement authority; the banned-phrase sweeps still pass; no surface in a coin week contains the holder's name.
- [ ] **Step 2: Run it, watch it fail.**
- [ ] **Step 3: Measure, set the price, write the copy.**
- [ ] **Step 4: Read the backlog and report.**
- [ ] **Step 5: Verify** — `npx vitest run tests/bb-theme-primers.test.js tests/bb-coin-of-destiny.test.js tests/bb-act-coverage.test.js tests/bb-themes.test.js`
- [ ] **Step 6: Commit** — `feat(bb): the floor's last product, priced`

---

## Self-review notes

- **Interface consistency:** `COIN_PRICE` and `hasBoughtCoin` are defined in Task 1 and consumed in Task 4. `week.coinAuthority` is defined in Task 2 and read by `chairAuthority` in the same task. `week.coinDethroned` is written today and gets its first reader in Task 3.
- **Ordering:** Task 2 is independent of Task 1 but both must land before Task 4's backlog read is meaningful. Task 3 is independent of both.
- **Known soft spot:** Task 2 touches the veto ceremony, which the Diamond Veto, Roadkill, the Block Buster, America's Nominee, the Roulette and the just-shipped Veto Derby all hook. The byte-identical assertion for a week with no coin is the guard that matters most.
- **Deliberately out of scope:** the adapted Wildcard (spec §5) and the theme's missing `fromEnd: 2` finale beat. Both are separate slices.
