# The Veto Derby and the Two-Holder Veto Week — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The room's second game — buy a slot, bet on a veto player, and if they win it you hold a veto of your own, which you spend BEFORE the person who actually won the competition.

**Architecture:** `js/bb/veto-derby.js` owns the game and the bet. The room sells the slot; the bet is placed at the veto draw once the six are known; it resolves when the veto competition does; and the veto ceremony learns to run two holders in sequence. That last part is the real work — `js/bb/week.js` has only ever had one.

**Tech Stack:** ES modules, no build step. Vitest. No new dependencies.

## Canon (BB23, wiki-verified)

> For 50 BB Bucks, houseguests can play in the "Veto Derby" competition. If they received a score higher than 0 and landed in the top six, they would be able to bet on one of the six Veto players. If the person they bet on ended up winning the PoV Competition, they would earn a second Veto for themselves. Whoever won their Veto through the bet would make their decision first, and the HoH would name a replacement if it was used. From there, whoever won their Veto through the competition then made their decision and could potentially force the HoH to nominate a replacement a second time.

**The one deviation, approved by the user:** you cannot bet on one of the six before the six are drawn. Our room opens after the nomination ceremony and the veto draw happens later, so a seat buys a **slot** and the slot is spent at the draw. Same rule, two stages, and the drama is better for it: you pay on Sunday for a bet you cannot place until Tuesday.

## Global Constraints

- **Prices are canon and frozen:** Derby 50, Roulette 125, Coin 250. `ROOM_GAMES` is the only place they live.
- **Money leaves on ENTRY.** A slot that never becomes a bet — because you missed the top six, or scored zero — is money gone. Paying is not winning.
- **One entry per game per houseguest per season**, win or lose.
- **`!compressed` is NOT "once a week".** A `week-in-one` double eviction runs its second cycle UNCOMPRESSED (`js/bb-run.js:1027`); Split House runs one cycle per side. Gate on `week.segment`.
- **No bare `Math.random()`** — thread the week's `rng` or use `stableRng(...)` with `gs.bb.seasonSalt`.
- **Serialization:** anything on `gs`/`week` must be plain JSON. No Sets, no functions.
- **Every act reaches all three writers**; `tests/bb-act-coverage.test.js` is the guard.
- **Copy must describe what the engine does.** Four fix rounds have gone into this on this theme already. Nothing may promise a veto that does not exist.
- **The privacy rule stands:** stakes and slips are private; walking to the rail is public. No surface states a balance except House Status' purse chip.
- **Test command:** name the files. NEVER `npm test`. Never `git stash`. Kill orphaned vitest workers.

---

### Task 1: The Derby, and the slot it sells

**Files:**
- Create: `js/bb/veto-derby.js`
- Create: `tests/bb-veto-derby.test.js`
- Modify: `js/bb/high-rollers-room.js` (menu entry + engine table)

**Interfaces:**
- `runDerby({entrants, rng}) -> {results: [{name, score, slot}], beats}` — an "as close as you can" guess. **Score zero and you have bought nothing.** Top six by score earn `slot: true`.
- The room's menu gains `{id:'veto-derby', name:'The Veto Derby', price:50, ...}`.

Notes for the implementer:

- The Roulette resolves the whole field at once via the resolver's `resolvesField` flag. The Derby is the same shape — everybody who paid plays together and up to SIX earn something, which is the contrast with the Roulette's single winner. Do not flatten the two.
- Slot holders are recorded on `gs.bb` so the draw can find them next episode; plain arrays keyed by name, JSON-safe.
- 4+ narration variants per category: the guess, earning a slot, missing the top six, scoring zero.

- [ ] **Step 1: Write the failing test** — money leaves on entry; a zero score earns no slot; at most six slots exist however many paid; a field of three produces at most three; the act names every entrant once.
- [ ] **Step 2: Run it, watch it fail on the unresolved import.**
- [ ] **Step 3: Build it**, and wire it into `ROOM_GAMES` + the room's engine table.
- [ ] **Step 4: Verify** — `npx vitest run tests/bb-veto-derby.test.js tests/bb-high-rollers-room.test.js`
- [ ] **Step 5: Commit** — `feat(bb): the Veto Derby, and the slot a seat buys`

---

### Task 2: The bet, placed at the draw and resolved at the competition

**Files:**
- Create/extend: `js/bb/veto-derby.js`
- Modify: `js/bb/week.js` (at the veto draw ~3781, and after the veto winner is known ~4005)
- Test: `tests/bb-veto-derby.test.js`

**Interfaces:**
- `placeDerbyBets({week, slots, vetoPlayers, rng}) -> act|null` — each slot holder backs ONE of the six.
- `resolveDerbyBets(act, vetoWinner) -> act` — whoever backed the winner now holds a veto.

**The bet is a read, like the side bet, and must not be omniscient.** Who a slot holder backs comes from what they believe: their own bond with each drawn player, plus how well they read a room. Nothing in this file may see the competition result before it happens — `resolveDerbyBets` runs after, and is the only function that learns it.

**Placement:** immediately after `week.vetoDraw` is set (`js/bb/week.js:3781`), so the six are known. **Resolution:** after `week.vetoWinner` is assigned (~4005) and before the ceremony.

- [ ] **Step 1: Write the failing test** — a slot holder backs one of the six and nobody else; backing the eventual winner yields a veto and backing anybody else yields nothing; a holder with no slot never bets; the bet act carries no result before resolution (the spoiler rule the side bet already learned).
- [ ] **Step 2: Run it, watch it fail.**
- [ ] **Step 3: Build and wire it.**
- [ ] **Step 4: Verify** — `npx vitest run tests/bb-veto-derby.test.js`
- [ ] **Step 5: Commit** — `feat(bb): back one of the six, and hold a veto if they win`

---

### Task 3: The two-holder veto week

**THE HARD ONE.** `js/bb/week.js`'s ceremony has exactly one `vetoWinner`, one `shouldUseVeto`, one replacement. It now needs, in order:

1. the **bettor** decides;
2. if used, the **HOH names a replacement**;
3. the **PoV winner** decides;
4. if used, the **HOH names a second replacement**.

**Files:** `js/bb/week.js` (the ceremony, ~4100-4300), and the three writers.

**What to watch, all of it learned the expensive way on this theme:**

- **The saved houseguest cannot be renominated**, and that applies across BOTH decisions. The first save must be in `protectedNames` before the second replacement is chosen, or the second holder can put back the person the first one took down.
- **The eligible pool can run out.** Two saves plus two replacements on a small house is four names, and `resolveBBCampaignAct` (`js/bb/shared-strategy.js:1251`) THROWS on a block of fewer than two. Measure this across house sizes; if the second save cannot be filled, the rule the engine already uses is that the veto stays in the box (`js/bb/week.js` has that guard for one holder — extend it, do not invent a new one).
- **`gs.bb.stats[name]` on an undefined name throws** and has crashed a real season. Every name reaching it must be checked.
- The Diamond Veto, Roadkill, the Block Buster, America's Nominee and the Roulette all hook this same ceremony. An unthemed week, and a themed week with no Derby bet, must run **byte-identically**.

- [ ] **Step 1: Write the failing test** — a week with both holders runs them in the canon order; the HOH names two different replacements; neither saved houseguest is renominated; and a week with no Derby bet is unchanged.
- [ ] **Step 2: Run it, watch it fail.**
- [ ] **Step 3: Implement**, then narrate it in all three writers — the ceremony must say who saved whom, in what order, and that the HOH refilled twice.
- [ ] **Step 4: MEASURE the small-house case.** Report, across casts 12–20, how often two vetoes are held in one week and how often the second save cannot be filled. If a one-name block is ever reachable, STOP and report rather than shipping it.
- [ ] **Step 5: Verify** — `npx vitest run tests/bb-veto-derby.test.js tests/bb-high-rollers-room.test.js tests/bb-act-coverage.test.js tests/bb-diamond-veto.test.js tests/bb-veto-variants.test.js tests/bb-veto-draw.test.js`
- [ ] **Step 6: Commit** — `feat(bb): a veto week with two holders and two replacements`

---

### Task 4: The arc, the primer, and a read of the output

**Files:** `js/bb/themes-high-rollers.js`, `js/core.js` (catalog `desc` if the room's copy names its menu), and a backlog read.

- The Derby joins the primer's `rules` — what it costs, what a slot is, and what winning the bet actually does to the ceremony.
- At 50 it is affordable on the room's FIRST night, when almost nobody can reach 125. Say so in the report: measure what share of the house can afford each game on each of the three room nights, at casts 16 and 20.
- **Read a real backlog end to end.** Every prose bug on this theme was found that way and none by a test: a nominee named twice, a settlement printed before the vote it settled, a table that opened three times a week. Report what you saw.

- [ ] **Step 1: Write the failing test** — the primer names the Derby and its price; the banned-phrase sweeps still pass.
- [ ] **Step 2: Run it, watch it fail.**
- [ ] **Step 3: Write the copy.**
- [ ] **Step 4: Read the backlog and report.**
- [ ] **Step 5: Verify** — `npx vitest run tests/bb-theme-primers.test.js tests/bb-veto-derby.test.js tests/bb-act-coverage.test.js`
- [ ] **Step 6: Commit** — `feat(bb): the floor sells two games now`

---

## Self-review notes

- **Interface consistency:** `runDerby`, `placeDerbyBets`, `resolveDerbyBets` are defined in Tasks 1-2 and consumed in Tasks 2-3. The act types are `veto-derby` (the game), `derby-bet` (placed at the draw) and `derby-bet-settled` (resolved at the competition) — the same two-act split the side bet needed so a screen cannot show a result before the event that caused it.
- **Ordering:** Task 3 depends on Task 2's bet existing; Task 4 depends on all three.
- **Known soft spot:** Task 3 is the largest engine change in the whole High Roller's build and touches code five other twists hook. The byte-identical assertion for an unthemed week is the guard that matters most.
