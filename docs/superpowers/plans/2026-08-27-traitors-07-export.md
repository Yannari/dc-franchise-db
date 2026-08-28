# The Traitors — Plan 7: Export, Co-Winners and the Website Database

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a finished Traitors season land correctly in every downstream system — the season file, career stats, the social feed, fame, followers, rankings and the wiki — and resolve the co-winner conflict without inventing a fact.

**Architecture:** The engine is complete (Plans 1–6, 365 tests). This plan writes almost no simulation. It is integration: collapse the eight duplicate show-list maps, split the overloaded `isReturnee`, define the per-round export shape, resolve co-winners across every reader, write popularity correctly and read the audience through the show-agnostic module, then publish under prefixed keys with a per-format ranking config.

**Tech Stack:** ES modules, no build step. vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-25-traitors-design.md` §10 (export, data, co-winners, popularity/audience/fame/rankings, the duplication, existing guards) and §11 (the returnee split). **`docs/ADDING-A-SHOW.md` is the binding manual** — §5 defines the season shape, §9 lists the duplication, §13 has the commands to re-derive it all.

**Prior plans:** `2026-08-26-traitors-05-scene-selection.md` and `2026-08-27-traitors-06-missions-powers-endgame.md`. Read their appended lesson sections — they were written from measurement and several bind this plan.

## Global Constraints

- **`js/shows.js` is the ONLY source of truth** for slugs, prefixes, names and per-show vocabulary. A bare integer in a URL, filename or storage key is Total Drama, permanently; every other show is prefixed.
- **Every generated sentence takes its words from that show's registry entry.** The recurring bug class this exists for: one show's vocabulary printed over the other. Traitors has TWO exit verbs — **banished** and **murdered** — and a guard that only ever sees a banishment is the empty-section failure mode wearing a different hat.
- **`gs.popularity` must NEVER rank anybody.** It is accrued every round, so it is dominated by how long somebody lasted — measured at **−0.952** correlation with final placement. Asking it who was liked returns who lasted. Use `audienceStanding` / `audienceBoard` / `runAudienceVote` from `js/audience.js`.
- **`js/audience.js` is show-agnostic on purpose and Traitors gets it for free. Do not write our own.**
- **Never `rankings_database.json`** — that file declares itself Total Drama's, and Big Brother was once applied into it, producing houseguests ranked among contestants while every correct reader refused to display them. `rankings_tr.json`, via `js/ranking-boards.js`.
- **Stamp `format` on `seasonDetails[]`.** An appearance with no format **is** Total Drama, so a Traitors appearance silently joins the Total Drama career of whoever shares a slug.
- **NEVER `git stash`, never `reset --hard`, never `git add -A`.** Stashes are per-repository; this worktree shares a stack with live uncommitted work on `main`. Copy files aside or use a SEPARATE temporary worktree. Temp worktrees empty `node_modules/.bin` — `npm rebuild` restores it.

## The discipline, earned over six plans

- **Every test ships with the literal mutation that proves it.** Apply, RED, revert, GREEN, report it.
- **A mutation is necessary and NOT sufficient.** It proves a guard can fail — not that the margin is right, nor that it measures what its name says.
- **`\b` inside a template literal is U+0008, not a word boundary.** Four guards in this repo have never once matched, and one production `.replace()` at `js/rankings-update.js:1205` has never stripped anything. Check character codes, not appearance.
- **A store sweep measures survivors of an overwriting process, not writes.**
- **A test must read the value under test, never recompute it.** And **never recompute alignment at season end** — alignment has eras, and recomputing it misread a defect as ten times its real size.
- **A guard can be unfalsifiable because the forbidden state is rare.** Assert at the decision point with a coverage floor.
- **400 seasons is not enough for anything rare.** Size the sample to the rarity of the thing measured.
- **A methodological finding does not reach the other measurements in its own task.** Sweep your own figures against it before reporting any.
- **READ THE OUTPUT.** Every prose defect in six plans was found by dumping and reading; zero by assertion.

## Facts the implementer needs and cannot infer

- The registry entry exists with `words`, `historyFromLedger: true`, `careerStats` (six `tr.*` pairs) and an `audience` overlay. `audienceAward` is **deliberately omitted** — §10.4 says leaving it out and calling nothing is a supported answer, not a gap.
- `tests/show-vocabulary.test.js` already walks every registered format and fails when a show's output contains another show's words. There is no list in it to extend. Its e2e sibling has three documented failure modes: a fixture rendering only a winner never draws the exit cell; a season with no round data passes over an empty section; and the `\b` trap above.
- Baseline: `npx vitest run tests/tr-*.test.js` → **365 green**; `npm run audit:tr-castle` → 5.
- Known-broken and NOT this plan's unless a task touches the file: `js/rankings-update.js:1205` (dead regex, live bug — Task 6 touches this file and should fix it); `COMMIT_LINES.kept` in `js/tr/castle/trust.js`; `shield.cost` has no reader; `tests/roster-bio-fields.test.js` "keeps the paragraph breaks" fails at base, unrelated.

---

### Task 1: Collapse the eight identity maps into `js/shows.js`

**Files:** `player.html` (`SHOW_PREFIX` ~681, `NAMES` ~792, `ICONS` ~793, `SHOW_NAMES` ~909/~918, literal `['total-drama','big-brother']` ~727), `js/wiki.js` (~25), `js/wiki-view.js` (~28), `season_ref.html` (~320), `current-season.html` (~870), `compare.html` (~832), `franchise.html` (~705), `js/alumni.js` (~106). Test: a new guard.

Spec §10.5: these eight are **pure identity** and should be collapsed **before we start**. The manual calls it roughly an hour, mechanical, and it converts eight chances to forget the show into zero. The other five hold per-show **data** and stay: `js/settings.js`, `js/rankings-update.js`, `js/quick-setup.js`, and the two vocabulary maps.

- [ ] **Step 1:** Write a guard that fails when any file outside `js/shows.js` holds its own show list — a rule over the tree, not a list of the eight.
- [ ] **Step 2:** Run it; confirm RED naming all eight.
- [ ] **Step 3:** Collapse each to read from `js/shows.js`.
- [ ] **Step 4:** Run the guard (GREEN) and the full suite.
- [ ] **Step 5: Mutation** — reintroduce a literal show list in one file → RED. Verify the guard names that file.
- [ ] **Step 6:** Commit.

---

### Task 2: Split `isReturnee` from franchise history

**Files:** `js/franchise-meta.js:505`, `js/players.js:180` (leave alone), a new derived predicate. Test: `tests/tr-franchise-history.test.js`.

Spec §11. `isReturnee` drives two orthogonal things: **art** (the `<slug>-returnee` portrait) and **reputation** (`franchise-meta.js:505` `if (!p.isReturnee) continue;` gates the entire profile, reputation, instincts and callback build). On the other shows these coincide. **On Traitors every player has history and nobody is returning to this show.**

Franchise-meta priors are **evidence source 5**. Without the split, twenty checkboxes must be hand-ticked every season to enable a system that already knows the answer — and the day one is missed, that player walks in with no reputation and no grudges and nothing reports it.

- [ ] **Step 1:** Failing test — a Traitors cast member with prior appearances and `isReturnee: false` still gets a franchise profile, reputation and grudges.
- [ ] **Step 2:** Run, confirm fail.
- [ ] **Step 3:** Add `hasFranchiseHistory(name)`, derived from the appearance ledger (182 players, 279 appearances). Point `franchise-meta.js:505` at it. **`isReturnee` keeps its current meaning** — per-season casting state, reset each season at `cast-ui.js:407`.
- [ ] **Step 4:** Run; confirm the other two shows are unaffected (their returnees have history, so the predicate agrees with the flag there).
- [ ] **Step 5: Mutation** — point 505 back at `isReturnee` → RED. Then: a player with history but no flag must gain a profile, and a flagged player with NO history must not silently gain one.
- [ ] **Step 6: Measure** how many of a Traitors cast get a profile under each predicate. Report both.
- [ ] **Step 7:** Commit.

---

### Task 3: The per-round export shape and the data traps

**Files:** Create `js/tr/export.js`. Test: `tests/tr-export.test.js`.

Spec §10.1: model the **murder as a ballot cast only by the Traitors**. A round produces one `votingHistory[]`-shaped record carrying two ballot sets — the public banishment (everyone) and the private murder (Traitors only) — distinguished by a **`channel`** field. No third export shape, no second normaliser, no six branches in `season_ref.html`. It is also true to the fiction: the conclave is a vote.

§10.3 data traps, all three: stamp `format` on `seasonDetails[]`; register the format before publishing (`POST /api/publish-season` refuses an unknown one, deliberately); keys by prefix — `data/seasons/tr-1-data.json`, `tr_episode_s1_e1`, `AI_ANALYTICS_tr-1`, `rankings_tr.json`.

- [ ] **Step 1:** Failing test — a played season exports a `votingHistory[]` whose banishment rounds carry every living player's ballot and whose murder rounds carry only the Traitors', distinguished by `channel`; `format` is stamped on every `seasonDetails[]` entry; every key carries the `tr` prefix.
- [ ] **Step 2:** Run, confirm fail.
- [ ] **Step 3:** Implement against the real season output from `playTraitorsSeason`.
- [ ] **Step 4:** Run; `tests/show-vocabulary.test.js` and the format-scoped guards green.
- [ ] **Step 5: Mutations** — drop `format` from `seasonDetails[]` → RED; write an unprefixed key → RED; collapse the two channels into one → RED.
- [ ] **Step 6:** Commit.

---

### Task 4: Co-winners — resolved across every reader

**Files:** `js/tr/export.js`, plus every reader that assumes a single winner. Test: `tests/tr-export.test.js` and the affected readers' tests.

Spec §10.2, and this is the plan's real design work. `docs/ADDING-A-SHOW.md` §5 requires `winner { name, playerSlug, vote, runnerUp }` — **singular** — and `placements[]` with an ordinal `placement`. **The Traitors has co-winners**: US season 3 ended with four splitting the pot, with no ordinal finish between them and no runner-up in the usual sense.

**The shape:** co-winners all take `placement: 1` with `status: 'winner'`; add a `winners[]` array; populate `winner{}` **only where a season genuinely has one** (a lone surviving Traitor, which is common — Plan 6 measured 158 of 400 seasons ending with exactly one taker).

**Then find every reader that assumes a single winner and decide each one deliberately** — rankings, leaderboards, career pages, the wiki lead, D1 `appearances`. **Picking a "main" winner to dodge this would be inventing a fact and is not acceptable.**

- [ ] **Step 1:** Sweep for every reader of `winner`, `runnerUp` and `placement === 1` across the repo. **Report the list before changing anything** — it is the deliverable of this step.
- [ ] **Step 2:** Failing test — a four-way co-winner season exports `winners[]` with four entries all at `placement: 1`, and `winner{}` absent; a lone-Traitor season exports both.
- [ ] **Step 3:** Run, confirm fail.
- [ ] **Step 4:** Implement the shape, then work the reader list, deciding each deliberately and recording the decision beside it.
- [ ] **Step 5:** Run the full suite plus the wiki and ratings guards.
- [ ] **Step 6: Mutations** — populate `winner{}` on a co-winner season → RED; give co-winners ordinal placements 1..4 → RED; make a reader silently take `winners[0]` → RED.
- [ ] **Step 7:** Commit.

---

### Task 5: Popularity, and the audience read

**Files:** `js/tr/` event and round code (popularity writes), plus wherever the audience is read. Test: `tests/tr-audience.test.js`.

Spec §10.4. **Popularity still has to be written**: every event that is heroic, villainous, cowardly or selfless moves `gs.popularity[name]`.

**This show adds a wrinkle the others do not have — the audience knows who the Traitors are.** A Traitor playing brilliantly is **entertaining**, not **admirable**, and the two must not be the same number. Popularity tracks affection; it must not silently become a competence score for a villain the crowd enjoys.

Read through `js/audience.js` and nothing else: `audienceStanding(name)` for who was liked, `audienceBoard({ eligible })` for the cast best-first. `audienceAward` is deliberately absent from the registry, so **call nothing** for an award.

- [ ] **Step 1:** Failing test — heroic/villainous/cowardly/selfless moments move popularity; a Traitor's successful deception does NOT move it the way a Faithful's heroism does; and nothing in the Traitors code ranks by `gs.popularity`.
- [ ] **Step 2:** Run, confirm fail.
- [ ] **Step 3:** Implement. Wire popularity writes into the existing event/round paths.
- [ ] **Step 4:** Run; confirm `audienceBoard` returns a sane order for a played season.
- [ ] **Step 5: Mutations** — rank by `gs.popularity` anywhere → RED; give a Traitor's deception the same popularity delta as a heroic act → RED; write our own audience function → RED (a guard that no Traitors file reimplements `audience.js`).
- [ ] **Step 6: Measure** the correlation between `gs.popularity` and final placement for Traitors, and between `audienceStanding` and placement. Report both. The first should be high (that is what it is); the second should not be.
- [ ] **Step 7:** Commit.

---

### Task 6: Social feed, fame, and the rankings board

**Files:** `js/social/adapter.js` (one `SHOW_WORDS` entry), `js/ranking-boards.js`, `js/rankings-update.js` (~360, per-format ranking config). Test: `tests/tr-rankings.test.js`.

Spec §10.4. `js/fame.js` and the 22 other registry importers need nothing beyond the entry. The social feed needs **one** `SHOW_WORDS` entry in `js/social/adapter.js` — that map is vocabulary and stays where it is; components never branch, so it is the only file. **Follower counts and fame level then flow from the published season and the audience reading**, not from anything Traitors writes itself.

**Rankings:** `rankings_tr.json`, never `rankings_database.json`. A board ranks **one** show, because the scores are not comparable across shows. A show with no finished season has no board and that is not an error — `loadRankingBoards()` skips the 404.

**Ranking weights are a real design question** and the spec deferred them until a season existed. Seasons exist now. There are no comp wins to weight; the obvious currency is **rounds survived, correct banishments driven, and whether you finished on the winning side** — but measure before committing to it.

**While you are in `js/rankings-update.js`: fix the dead regex at line ~1205.** It parses to `…s+(?:Winner|Pd+)…` — the escapes were eaten the same way four test guards were — so that `.replace()` has never stripped anything. It is a live production bug.

- [ ] **Step 1:** Failing tests — a published Traitors season produces a social feed with Traitors vocabulary (never another show's), a fame level and follower count; and a ranking board written to `rankings_tr.json`.
- [ ] **Step 2:** Run, confirm fail.
- [ ] **Step 3:** Add the `SHOW_WORDS` entry and the per-format ranking config. Fix the dead regex, with a test that would have caught it.
- [ ] **Step 4:** Run; `show-vocabulary` green **for both exit verbs, banished and murdered**.
- [ ] **Step 5: Mutations** — write to `rankings_database.json` → RED; emit another show's exit verb → RED; restore the dead regex → RED.
- [ ] **Step 6: Measure** the ranking weights against played seasons before fixing them, and report what you chose and why.
- [ ] **Step 7:** Commit.

---

## Ordering

Task 1 first — it is mechanical and removes eight chances to forget the show from every task after it. Task 2 is independent and unlocks evidence source 5. Task 3 gates Task 4 (the export shape must exist before co-winners can be expressed in it). Tasks 5 and 6 follow the export. Task 6 last, because rankings read what everything else wrote.

## Task 1 done — and the eight were already collapsed

**My brief was written from the spec, not the branch.** All eight identity maps were collapsed
on 2026-08-25 in `f36e495e`, and `docs/ADDING-A-SHOW.md` §9 already marked every row
"collapsed". The implementer verified each of the eight individually rather than trusting the
doc, which is the right order. **A spec describes a moment in time; check the branch before
briefing work from it.**

**Writing the RULE instead of the list found three copies nobody had listed:**

- `tools/regen-rankings-reasoning.mjs` -- `SHOW_NAMES`, a `startsWith('bb-')` format guess, an
  `S`-or-`BB` label and an `/^(?:S|BB)/` fallback: **four show lists in five lines**, in the
  file that writes the ranking-board prose **the public site serves**.
- `tools/backfill-tiers.mjs` -- a copy of `BOARD_FILES` behind a comment claiming the module
  could not be imported because it fetches. The fetch is inside a function; the import works.
  **A written justification that did not survive checking.**
- `js/social-page.js` -- `?show=` resolved by naming two slugs and two prefixes, so
  **`?show=traitors` silently left you on the previous show.**

`tests/show-list-duplication.test.js` is now a rule over every `.js`/`.mjs`/`.html` in the
tree, with the seven per-show DATA maps as exemptions carrying written reasons and a staleness
check so that list can only shrink. Three anti-vacuity arms: a >300-file coverage floor, a
check the rule can see the registry's own map, and a `charCodeAt` assertion that no regex
contains U+0008. Its own header says to add the missing SHAPE, not the missing file -- because
`js/social-page.js` was a real leak neither mutation arm matched.

### Two findings that bind Task 3

Both invisible to the manual's §13 commands because they are written across two lines:

- **`js/stats-export.js:2874` dispatches the ENTIRE season export on `=== 'big-brother'`.**
- **`js/social/live.js:30` picks the round array the same way.**

**A Traitors season goes down the Total Drama branch in both.** Task 3 must add a
registry-driven dispatch at 2874 rather than a third branch.
