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

### 1a. No Big Brother path writes `seasons_database.json` — FIXED 2026-08-07 (`7a03d4f`)

`mergeBigBrotherSeasonsDatabase` now writes the record, and `exportSeason()`
routes the export button by format. The entry below is kept because what was
found alongside it is worth not rediscovering: the extractor and both merges
had **no callers outside their tests**, so the gap was not "seasons file only" —
a finished house could not be exported by any route at all.

Three further number-only keys were fixed in the same commit, all of them
dormant purely because no Big Brother data existed: `publishSeason` wrote
`season1-data.json` for both shows (Big Brother 1 committed over Total Drama 1's
episode log), the per-player re-merge dedupe found and deleted the *other*
show's season detail, and `totalSeasons` counted `player.seasons` — a flat list
of numbers in which Total Drama 1 and Big Brother 1 collapse to one entry.

**Still outstanding:** `worker/worker-studio.js` must be deployed before the
first Big Brother publish, or the season document lands on the Total Drama path.

Original finding follows.


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

### 1b. The leaderboard is format-blind — FIXED 2026-08-07 (sub-project B)

`/api/leaderboard` takes an optional `format`, validated against the registry.
The default stays all-shows, so no player drops off an existing board.
Original finding follows.


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

## 2. The bonds `SELECT DISTINCT` collapse — FIXED 2026-08-07 (sub-project B)

`bonds.format` is part of the query's identity now, so a pair bonded in both
shows returns two rows. `GROUP_CONCAT` carries the format too. Original follows.


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

## 5. Test gap: nothing covers the worker SQL — CLOSED 2026-08-07 (sub-project B)

The queries moved to `worker/queries.js` as pure functions, imported by both the
worker and `tests/worker-sql.test.js`, which runs them against a real SQLite
database via `node:sqlite`. The tested strings are the shipped strings.
`worker/multishow_schema.sql` itself is still unexercised. Original follows.


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

---

## Carried forward from sub-project B (show-aware list pages), 2026-08-07

Sub-project B shipped: `seasons`, `awards` and `rankings` group by show and honour
`?show=`; `js/shows.js` is the sole registry; `/api/leaderboard` takes a `format`;
the bonds query stopped collapsing two shows into one. These were found during it
and deliberately left.

### The wrong-show link, on two more pages

A season number alone stopped identifying a season when the second show arrived.
Five places built a link or a filename from the bare number. **Three are now
fixed** — `player.html`'s season-data fetch, `seasons.html` → `season_ref.html`,
and `awards.html` → `season-awards_ref.html`. **Two remain:**

- `player.html:905` links `?season=${s.season}` from a season detail that already
  carries `.format` and `.seasonId`. Same bug, third page.
- `timeline.html:420` likewise. Total Drama only today, so latent.

The fix pattern is settled and applies verbatim: link
`?season=${seasonId || seasonNumber}`, and parse with `parseSeasonRef` at the
other end. Total Drama's bare `?season=7` must keep resolving — `parseSeasonRef`
returns the default format for a bare integer, which is what makes bookmarks safe.

### Smaller items

- **`orderFormats` dedupes via a `Set`**, so two ranking boards sharing one format
  would silently drop one from the "all shows" view. Impossible today (one board
  per format), and it would be a data error rather than a code one.
- **The registry guard's 160-character window can false-positive**: a format
  default, an unrelated ternary and a prefix constant within 160 characters of
  each other would flag. Nothing in the repo trips it. It is also narrower than
  the old rule for two literals >160 characters apart on one line.
- **Big Brother cards still use `assets/cast/s1-cast.png`** and `season_ref.html`
  titles Big Brother 1 as "S1". Cosmetic, pre-existing, and squarely
  sub-project C's territory.
- **The worker is verified by bundle and by SQL tests against a real SQLite
  database, never against live D1.** `/api/leaderboard?format=` and the two-row
  bonds response are unproven end to end until the worker is deployed. The
  `castmates[].seasons` response shape changed from `number[]` to `string[]`;
  `leaderboards.html` reads both, because its local-JSON fallback still yields
  numbers.
- **`js/core.js` keeps its own `SEASON_FORMATS` list** and cannot import the
  registry — CLAUDE.md requires it to stay a leaf. A drift guard in
  `tests/shows-registry.test.js` asserts the two agree, so they cannot silently
  diverge.

---

## Carried forward 2026-08-08 — the character page becomes a wiki

Three requests from the same conversation, recorded together because they are
one arc: the player page stops being a stat sheet and becomes the character's
page, which is the foundation the per-character social profiles sit on.

### 1. Career totals must separate the shows — PARTLY DONE 2026-08-08

A player with two Total Drama seasons and one Big Brother season was described
as having played **3 seasons**. True, and useless: it reads as a three-season
veteran of one franchise, which is a different career.

`players_database.json` has carried the breakdown in `byShow` since the
multi-show migration — `{total-drama:{seasons:2}, big-brother:{seasons:1}}` —
and the page had never rendered it. The header, the Career at a Glance pill and
the Seasons chip now read "2 Total Drama • 1 Big Brother", and a single-show
career still reads "4 seasons" rather than saying the same number twice.

**Still merged on that page**, and each needs the same treatment:

- the stat bars and mini chips (`totalChallengeWins`, `totalImmunityWins`,
  `totalIdolsFound`, `totalVotesAgainst`) are cross-format sums. `byShow` holds
  Big Brother's own counters — `totalCompWins`, `hohWins`, `vetoWins`,
  `timesNominated` — which have no Total Drama equivalent and are currently
  displayed nowhere at all.
- `winRate` and `avgPlacement` average across both shows.
- the winner badge names ONE win. Wayne has two, in different shows, and the
  header credits him with whichever season detail comes first.
- `js/records.js` already recomputes per-show careers correctly
  (`careersIn(players, format)`); the player page should read that rather than
  growing its own second version.

### 2. A wiki section on the character page

An in-depth write-up per character, in the shape a fandom wiki uses: the whole
career across every show, personality, relationships and whether they are in a
couple, notable moments, running gags.

What already exists to build it from, none of it currently on the page:

- `voice-profiles.json` — the personality prose, and now a structured bio
  (age, ethnicity, nationality) via `js/bio.js`.
- `seasonDetails[].keyMoments` / `notes` / `story` — per-season narrative
  already written by the export's AI pass.
- `unbreakableBonds` per season — who they were close to.
- `gs.showmances` at play time; nothing survives export yet, so **couples are
  the one piece with no published source**. Recording showmances into the
  season document is a prerequisite, in the same way comp names were for
  competition records.
- `js/fame.js` for standing, `js/records.js` for what they hold.

### 3. Per-character social profiles

The stated objective the other two serve: every character with their own social
page — not everybody posting constantly, but the more famous you are the more
followers you gain. Followers are the metric that continues past five stars
("you are famous, and you can still aim higher"), and posts range over their
life rather than only the show: a new baby, a wedding, an opinion about
somebody else's season.

`js/social/crowd.js` already models followers for the fan personas and derives
them from tenure and volatility; the same currency extends to alumni. The
feed's `chat` stream already writes in an alumnus's voice from their real
record.

Sequence: career separation (1) gives the page honest numbers, the wiki
section (2) gives it prose, and the social profile (3) is that page with a
timeline attached. The user's own ordering: this one comes last.
