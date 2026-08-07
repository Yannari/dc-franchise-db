# Multi-show data model — carried-forward findings

Sub-project A (`(format, season_number)` as the season key, so Total Drama and Big
Brother can coexist) shipped on branch `worktree-multishow-data-model`. Several
real problems were found during that work and **deliberately not fixed there** —
each one belongs to a later sub-project, or is a pre-existing condition that this
migration was not allowed to change.

This file is the durable record of them. The working ledger it was distilled from
lived in a gitignored `.superpowers/` directory and is gone with the worktree.

---

## 1. Blockers for later sub-projects

These two are not "nice to have". Each is a way for the franchise data to go
wrong quietly, and each becomes reachable the moment real Big Brother data lands.

### 1a. No Big Brother path writes `seasons_database.json`

`mergeBigBrotherSeason` writes **players only**. `_mergeSeasonsDatabase`
hardcodes `total-drama`. So there is currently no code path that records a Big
Brother season into `seasons_database.json` at all.

Consequence: the first real BB season would have **every season detail silently
skipped** by `/api/sync-seasons`. The sync validates each detail against the
`(format, season_number)` list built from `seasons_database.json`; a BB-tagged
detail with no matching season record fails that lookup and is dropped with
`ok:true`, no error, and only `counts.skipped` moving. Nobody would notice from
the response.

**What catches it:** the cross-file test in `tests/multishow-json.test.js` fails
the moment such data appears. That is the safety net — it means this cannot ship
unnoticed, but it does *not* mean it is fixed.

**Owner:** whichever task ships Big Brother season export.

### 1b. The leaderboard is format-blind

`/api/leaderboard` filters by format for exactly nothing. Six stats blend shows
the moment BB data lands:

- `wins`
- `finals`
- `avgPlacement`
- `juryVotes`
- `votesAgainst`
- `seasonsPlayed`

Leaving it that way was correct in sub-project A: adding a format filter there
would have contradicted that task's own constraint (*a BB appearance must not
drop a player from a TD board*), and the spec assigns show filters to
sub-project B.

**Requirement for sub-project B: the leaderboard must gain a format filter.**
It must not ship without one, or the boards silently mix two shows.

---

## 2. The bonds `SELECT DISTINCT` collapse

In `worker/worker-studio.js`, the bonds query ignores `bonds.format`. Once BB
bonds exist, a pair bonded in **TD s1 and again in BB s1** collapses to a single
row under `SELECT DISTINCT`.

This is a **silent data loss**, not merely a display ambiguity — one of the two
relationships disappears from the response entirely.

Leaving it was correct in A (adding `format` to the query breaches that task's
"response shapes must not change" constraint), but it is a real latent bug.
**Fix in sub-project B, alongside the filter work.**

Related, lesser: `GROUP_CONCAT(them.season_number)` yields `"1,1"` for a castmate
shared in TD 1 and BB 1 — indistinguishable in the output.

---

## 3. Cross-format aggregates have no display rule

`byShow` is **summed from season details**. The top-level career totals are
**their own numbers**, and `stats-export` folds Big Brother competition wins into
the top-level `totalChallengeWins`.

So for a Big Brother player, **top-level will legitimately exceed
`byShow['total-drama']`** — by design, not by drift.

Summing was the right choice (copying the top-level values down would have
imported the drift in §4 and made the task's own invariant unsatisfiable). But
the consequence is that a page rendering both numbers shows two different figures
with **no rule anywhere saying which one wins**.

The cross-format aggregate contract is documented in the validator's module
docstring, deliberately *without* an equality rule. What is still missing is a
presentation rule.

**Sub-project D inherits this.** It needs to decide, per page, whether the
top-level cross-format total or the per-show figure is the one displayed.

---

## 4. Pre-existing data drift, now frozen in two places

Surfaced by this work, **not caused by it**. All of it predates the branch.

- **9 career-total disagreements across 8 players.** Example: `cameron` has
  `totalChallengeWins` = 6 at top level but 7 when summed from his season
  details.
- **`avgPlacement` missing on 11 players.**
- **`tier` missing on 57 players.**

These were deliberately left alone. Reconciling them changes what six pages
display and was out of scope. For the same reason, `tools/validate_schemas.py`
does **not** make `tier` or `avgPlacement` required — either would fail on
shipped data.

**The new constraint:** these numbers are now pinned in *two* places, because
the tests assert `byShow` equals the sum of the season details. Any future
reconciliation is therefore a **deliberate data change** with a test update
alongside it, not an incidental cleanup.

Recommended order if anyone takes this on: backfill the missing fields first,
tighten the schema in a separate ticket.

---

## 5. Test gap: nothing covers the worker SQL or the migration file

There is **no test** exercising:

- the SQL in `worker/worker-studio.js`
- `worker/multishow_schema.sql`

The four queries rewritten during this migration are guarded by nothing. A
future edit that **reintroduces `a.challenge_wins`** (the column this migration
removed from `appearances`), or **drops a `format` predicate from the castmate
join**, passes CI green.

Both of those were real bugs during the branch, caught only by hand-running
probes against a local D1. That verification is not repeatable in CI as things
stand.

---

## 6. Smaller items, recorded so they are not rediscovered

- `js/shows.js`: `seasonId` / `formatPrefix` / `showName` fall back to
  `DEFAULT_FORMAT` on an unknown format, while `parseSeasonRef` refuses and
  returns `null`. Two philosophies in one file. Inherited from the plan text.
  `parseSeasonRef`'s handling of uppercase / whitespace / negatives / decimals is
  correct but untested.
- `worker/multishow_schema.sql`: `idx_live_player` (from
  `live_season_schema.sql`) is dropped with the table and never recreated.
  Performance only, on an empty transient table.
- `worker/multishow_schema.sql`: the read-only coexistence rewrite lost the
  accidental FK-mismatch detection the old destructive INSERT had. A read-only
  sweep of `pragma_foreign_key_list` over every table referencing `seasons`
  would restore it.
- `ms_legacy_td_columns` **must never be dropped** — dropping it re-arms the
  `CREATE TABLE IF NOT EXISTS … AS SELECT`, which then fails with
  `no such column: tribe`. See also the re-run caveats in the migration header.
- No unit test exercises the `_tagSeasonDetail` throw or `_rebuildByShow` on a
  Big Brother detail; both guards are data-verified only, so a refactor could
  neuter them silently.
- `tools/backfill_formats.mjs` stamps `s.format ||= 'total-drama'` on seasons
  with no bb-shaped detection, unlike its own player guard.
- `tools/validate_schemas.py`: `check_schema()` raises `SchemaError` uncaught, so
  a malformed schema arrives as a traceback rather than the tool's own `FAILED:`
  line. Exit code is still non-zero.
- Big Brother tolerance in the JSON tests is demonstrated by a scratchpad script,
  not locked by a fixture. Worth adding when the first real BB season lands.
- The loader pattern `join(process.cwd(), f)` is now copied in three test files.
  `fileURLToPath(new URL(...))` is the correct fix; a shared helper would stop
  the fourth copy.

---

## Production apply — restore points (2026-08-07)

Recorded immediately before the multi-show migration was applied to the live D1.

- **Time Travel bookmark:** `00000058-00000000-000050c0-cb8e9e034b8f9128ff14efa53e3d10f6`
- **Logical export:** `backups/dc-franchise-pre-multishow-20260807.sql` (233 KB, gitignored)
  — verified to contain 262 appearances, 152 players, 37 bonds, 14 seasons.

Restore, preferred:

```bash
npx wrangler d1 time-travel restore dc-franchise --config worker/wrangler.toml \
  --bookmark=00000058-00000000-000050c0-cb8e9e034b8f9128ff14efa53e3d10f6
```

Fallback, if the Time Travel window has passed:

```bash
npx wrangler d1 execute dc-franchise --config worker/wrangler.toml --remote \
  --file backups/dc-franchise-pre-multishow-20260807.sql --yes
```

The export file is gitignored on purpose — it is a full copy of the franchise and the
repo is public. Keep it somewhere off the checkout until the site is verified good.
