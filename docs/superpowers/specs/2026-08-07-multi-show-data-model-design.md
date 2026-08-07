# Many shows, one franchise — the data model

Design spec, 2026-08-07. **Sub-project A of five.**

The site is a Total Drama database with Big Brother bolted to the side. The goal
is a franchise platform where many reality formats coexist — Big Brother is the
second, not the last — and every one of them can be listed, ranked, compared and
played without the schema being renegotiated.

This spec covers the DATA MODEL only. It is deliberately the least visible piece
of the work and most of the risk: when it lands, nothing on the site looks
different. What changes is that the other four sub-projects become possible.

## The decomposition

| | Sub-project | Depends on |
|---|---|---|
| **A** | **Data model + pipeline** (this spec) | — |
| B | List pages: seasons, rankings, leaderboards, timeline, awards, compare, franchise — show badges and filters | A |
| C | Season detail: `season_ref.html` rendering a BB season as weeks/HOH/veto | A |
| D | Careers: per-show sections on the player page | A |
| E | `current-season.html` (7,693 lines) made format-aware | A, C |

Each gets its own spec → plan → build cycle. Doing B–E before A means doing
them twice.

## Decisions taken

Four, settled before this was written:

1. **Per-show numbering with a composite key.** Each show numbers its seasons
   from 1; a season is `(format, season_number)`. Not one global sequence —
   "Big Brother Season 3" has to be sayable.
2. **A genuinely universal core, plus one table per show.** The shared table
   keeps only what every format has; format-specific stats live in their own
   table.
3. **One player profile**, with per-show sections and a franchise-wide summary.
4. **Unified pages with show badges and filters**, not a global show switcher
   or separate per-show sections.

## What exists today

- `worker/schema.sql` — `players`, `seasons` (PK `season_number`), `appearances`
  (PK `player_id, season_number`), `bonds`.
- `worker/bb_schema.sql` — already adds `seasons.format` defaulting to
  `'total-drama'`, and `bb_appearances` for per-season BB stats. **The naming is
  set by this file: the column is `format`, not `show`.**
- `worker/live_season_schema.sql`, `rankings_schema.sql`, `roster_schema.sql`.
- Four JSON databases — `seasons_database`, `players_database`,
  `franchise_database`, `rankings_database` — with **no format field anywhere**.

The last point is the one that reframes the job. Most of the site reads the JSON
files (`players_database` on six pages, `seasons_database` on five,
`rankings_database` on four); only `leaderboards.html`, `player.html` and
`devotees.html` touch D1. The existing BB groundwork covers the minority path.

## 1. Identity

A season is the pair `(format, season_number)`. `format` is a slug —
`total-drama`, `big-brother` — matching what `bb_schema.sql` already writes.

For URLs and cross-references, the pair has a canonical string form:

```
seasonId = `${formatPrefix}-${season_number}`     // "td-14", "bb-1"
```

Prefixes are declared in ONE place, alongside the format slug and display name,
so adding a show is a single registry entry rather than a search for every
place a format was assumed:

```js
// js/shows.js — the registry every consumer reads
export const SHOWS = {
  'total-drama': { prefix: 'td', name: 'Total Drama',  short: 'TD', emoji: '🎬' },
  'big-brother': { prefix: 'bb', name: 'Big Brother',  short: 'BB', emoji: '📹' },
};
```

### URL back-compatibility is non-negotiable

Every link on the site, and every link anybody has ever saved, is
`season_ref.html?season=7`. A bare integer means Total Drama, permanently:

```js
parseSeasonRef('7')     // → { format: 'total-drama', number: 7 }
parseSeasonRef('bb-1')  // → { format: 'big-brother', number: 1 }
```

One normaliser in `js/shows.js`, used by every page. No existing link breaks.

## 2. D1 schema

### `seasons` — rebuilt

SQLite cannot alter a primary key, so this is create-copy-rename, not `ALTER`:

```sql
CREATE TABLE seasons_new (
  format        TEXT NOT NULL DEFAULT 'total-drama',
  season_number INTEGER NOT NULL,
  title TEXT, subtitle TEXT, cast_size INTEGER, episode_count INTEGER,
  winner_slug TEXT, theme TEXT, status TEXT,
  PRIMARY KEY (format, season_number)
);
INSERT INTO seasons_new SELECT COALESCE(format,'total-drama'), season_number,
  title, subtitle, cast_size, episode_count, winner_slug, theme, status FROM seasons;
DROP TABLE seasons; ALTER TABLE seasons_new RENAME TO seasons;
```

### `appearances` — gains `format`, loses the Total Drama columns

```sql
CREATE TABLE appearances_new (
  player_id      TEXT NOT NULL,
  format         TEXT NOT NULL DEFAULT 'total-drama',
  season_number  INTEGER NOT NULL,
  placement      INTEGER,
  status         TEXT,
  votes_received INTEGER,
  jury_votes     INTEGER,
  final_vote     TEXT,
  PRIMARY KEY (player_id, format, season_number),
  FOREIGN KEY (player_id) REFERENCES players (id),
  FOREIGN KEY (format, season_number) REFERENCES seasons (format, season_number)
);
```

What remains is what every elimination format has: where you finished, what you
finished as, how many votes you took, how the jury split, the final tally.

### `td_appearances` — new, mirroring `bb_appearances`

```sql
CREATE TABLE td_appearances (
  player_id      TEXT NOT NULL,
  season_number  INTEGER NOT NULL,
  tribe          TEXT,
  challenge_wins INTEGER DEFAULT 0,
  immunity_wins  INTEGER DEFAULT 0,
  reward_wins    INTEGER DEFAULT 0,
  idols_found    INTEGER DEFAULT 0,
  strategic_rank INTEGER,
  PRIMARY KEY (player_id, season_number)
);
```

No `format` column: the table IS the format. Symmetric with `bb_appearances`,
which is what makes show number three a copy of a known shape rather than a
design discussion.

### `players` — per-format career totals stop being stored

`total_challenge_wins`, `total_immunity_wins`, `total_reward_wins` and
`total_idols_found` are dropped and derived from `td_appearances` on read.
Universal career facts stay: `total_seasons`, `wins`, `best_placement`,
`avg_placement`, `tier`.

**Why derive rather than store:** a stored copy of a derived number is a second
source of truth, and the two drift the first time a season is re-imported. The
dataset is 152 players; the aggregation is free. The cost is real and worth
naming — `/api/leaderboard` gains joins it does not currently have.

### `bonds`

`PRIMARY KEY (player_id, ally_id, season_number)` — so `format` joins the key
and this is another create-copy-rename, not an `ALTER`. Same backfill.

### `live_season` — keyed now, generalised later

`PRIMARY KEY (season_number, player_name)` gains `format` the same way. Its
stat columns are a different matter: `immunity_wins`, `reward_wins` and
`challenge_wins` are Total Drama concepts sitting in a table that a Big Brother
season also has to fill.

Deliberately NOT solved here. This table exists to feed `current-season.html`,
which is sub-project E, and it is transient — rows are cleared when a season is
published into the permanent history. Splitting its stats the way `appearances`
is split, with no page yet able to read the result, is work done twice. What A
owns is the key, so a BB live season and a TD live season cannot collide; what E
owns is what a live BB week actually shows.

## 3. JSON databases

`seasons_database.json` — each season gains `format` and `seasonId`:

```json
{ "seasonNumber": 14, "format": "total-drama", "seasonId": "td-14", "title": "..." }
```

`players_database.json` — universal career facts stay top-level; per-format
totals move under `byShow`, keyed by format slug:

```json
{
  "id": "alejandro", "name": "Alejandro",
  "totalSeasons": 4, "wins": 1, "bestPlacement": 1, "avgPlacement": 3.5, "tier": "S",
  "seasons": ["td-4", "td-2", "td-1", "td-8"],
  "byShow": {
    "total-drama": { "seasons": 4, "totalChallengeWins": 12, "totalImmunityWins": 5,
                     "totalRewardWins": 4, "totalIdolsFound": 2 },
    "big-brother": { "seasons": 1, "hohWins": 2, "vetoWins": 1, "timesNominated": 3 }
  },
  "seasonDetails": [ { "seasonId": "td-4", "format": "total-drama", "season": 4, "placement": 1, "...": "..." } ]
}
```

`seasonDetails[]` keeps its numeric `season` alongside the new `format` and
`seasonId`, so a reader that has not been updated yet still finds the number it
expects. `franchise_database.champions[]` gains `format`; format-specific record
lists get scoped per show. `rankings_database.rankings[]` gains `format`.

## 4. Migration and the pipeline

- **Backfill**: every existing season, appearance and bond becomes
  `total-drama`. Fourteen seasons, 262 appearances.
- **Idempotence**: the SQL file must be safe to re-run. The rebuilds are
  guarded by checking whether the new column already exists; `bb_schema.sql`
  documents the same pattern and its known one-time `ALTER` failure.
- **Generators**: `js/stats-export.js` emits the new fields for both formats;
  `tools/audit_data.py`, `tools/lint_data.py` and `tools/validate_schemas.py`
  learn the new shape and start FAILING on a season with no format.
- **Order**: schema first, then backfill, then regenerate the JSON from the
  pipeline, then verify. The JSON files are build outputs — they are not
  hand-edited.

## 5. Verification

- A Total Drama season 1 and a Big Brother season 1 exist simultaneously in
  `seasons`, in `appearances`, and in `seasons_database.json`, and nothing
  joins one to the other. **This is the acceptance test for the whole spec.**
- `parseSeasonRef` resolves a bare `7` to Total Drama season 7, and `bb-1` to
  Big Brother season 1.
- Every page that reads a JSON database renders Total Drama data unchanged —
  compared against output captured before the migration.
- `/api/leaderboard`, `/api/stats` and `/api/relationships` return the same
  numbers for Total Drama as before, with per-format totals now derived.
- Re-running the migration file is harmless.
- A player with appearances in two shows aggregates correctly: universal totals
  span both, per-show totals do not bleed.

## Out of scope

Everything visible. No page gains a badge, a filter or a per-show section in
this sub-project — that is B and D. The only user-facing change permitted here
is that nothing breaks.
