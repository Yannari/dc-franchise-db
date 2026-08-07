-- worker/multishow_schema.sql
--
-- Many shows, one franchise. Apply with:
--   npx wrangler d1 execute dc-franchise --config worker/wrangler.toml --local  --file worker/multishow_schema.sql --yes
--   npx wrangler d1 execute dc-franchise --config worker/wrangler.toml --remote --file worker/multishow_schema.sql --yes
--
-- SQLite cannot alter a primary key, so the keyed tables are rebuilt
-- create-copy-drop-rename rather than altered. Every rebuild is written so a
-- second run is a no-op that neither loses rows nor relabels them.
--
-- ─────────────────────────────────────────────────────────────────────────
-- HOW OFTEN THIS FILE CAN BE RUN
-- ─────────────────────────────────────────────────────────────────────────
-- Apply it as many times as you like, EXCEPT while this condition holds. It is
-- refused up front by a named CHECK constraint, so the file aborts as a whole
-- and changes nothing rather than corrupting rows:
--
--   PERMANENT once it happens — one player holding an appearance in two shows
--   under the same season number (the same person in Total Drama 5 and Big
--   Brother 5, a normal thing for a multi-show franchise to record). Once the
--   legacy `format`-less shape is gone those two rows are genuinely
--   indistinguishable to every derivation here, so a rebuild would collapse
--   them into one. From that moment this file is ONE-SHOT and will refuse to
--   run at all, including against a restored backup. There is no loss in that:
--   if you hit it, the database is already in the target shape and does not
--   need this migration.
--   Constraint: `rerun_would_collapse_two_shows_rows`.
--
-- ─────────────────────────────────────────────────────────────────────────
-- HOW `format` IS RECOVERED ON A RE-RUN, AND WHY IT IS NOT `COALESCE(format, …)`
-- ─────────────────────────────────────────────────────────────────────────
-- The obvious way to make each copy re-runnable is
-- `SELECT COALESCE(format,'total-drama') … FROM appearances` — read the value
-- back when the column is there, default it when it isn't. That does not work
-- here, and it cannot be made to work:
--
--   * D1 resolves column names at PREPARE time. On a first run, `appearances`,
--     `bonds` and `live_season` have no `format` column at all (see
--     worker/schema.sql), so ANY statement naming `format` fails to compile
--     with "no such column: format" — a WHERE guard, a CASE, an
--     `EXISTS (SELECT … FROM pragma_table_info(…))` test, none of them help,
--     because none of them run before compilation.
--     `seasons` is the exception, and the reason it alone can use a plain
--     `COALESCE(format,'total-drama')`: worker/bb_schema.sql already added the
--     column to it with `ALTER TABLE seasons ADD COLUMN format`. That makes
--     bb_schema.sql a hard prerequisite of this file — which it already was,
--     since the derivations below read `bb_appearances`.
--
--   * The only conditional-compilation primitive D1 offers is
--     `CREATE TABLE IF NOT EXISTS x AS SELECT …`: with `x` already present it
--     short-circuits WITHOUT preparing the SELECT (verified empirically
--     against this database). `CREATE TRIGGER` does not help — trigger bodies
--     ARE resolved at CREATE TRIGGER time (also verified: "no such column").
--
--   * That primitive can only express "run once, ever" (its guard table is
--     created on the first run and persists). It cannot express the
--     complement, "run on every run except the first", because that would
--     need a table that exists during run 1's body and not during run 2's —
--     and nothing can create such a table, since any unconditional create
--     makes it exist on every run and any unconditional drop on none.
--
-- So `format` is never read back off a column that might not exist. It is
-- DERIVED, from tables that are unconditionally present and already carry the
-- answer:
--
--   appearances → 'big-brother' when the (player_id, season_number) has a row
--                 in bb_appearances and none in td_appearances; else
--                 'total-drama'. On a first run bb_appearances is empty and
--                 every row is correctly Total Drama.
--   seasons     → read straight back off its own column, which bb_schema.sql
--                 guarantees exists: COALESCE(format,'total-drama').
--   bonds       → the format of the bonded player's appearance in that season.
--   live_season → plainly backfilled to 'total-drama'. The column is NEW here,
--                 so every row that can exist in that table today was written
--                 before the second show — there is nothing else it could be.
--                 Attributing a LIVE Big Brother season is not this
--                 migration's job: what this file owns is the KEY, so a live
--                 Big Brother season and a live Total Drama season cannot
--                 collide. The table is transient (rows are cleared when a
--                 season is published into permanent history) and belongs to
--                 sub-project E, which feeds current-season.html and rebuilds
--                 it. E is where a live Big Brother week decides what it
--                 writes into `format`.
--
-- `appearances` is therefore rebuilt FIRST, because `bonds` reads it. Every one
-- of these SELECTs compiles on a pristine database and on an already-migrated
-- one.
--
-- ─────────────────────────────────────────────────────────────────────────
-- WHAT A RE-RUN CAN STILL GET WRONG — READ BEFORE APPLYING TO PRODUCTION
-- ─────────────────────────────────────────────────────────────────────────
-- This file is re-runnable, but it is NOT true that "no re-run can silently
-- relabel a second show's rows". Three known ways it can, all deliberately
-- left as-is (each is owned by a later sub-project, and none is reachable by
-- the first, Total-Drama-only application of this file):
--
--   1. live_season is relabelled unconditionally. The backfill below is a
--      plain literal 'total-drama' — it derives nothing. That is correct the
--      first time this runs (the column is new, so every row that can exist
--      predates the second show), but a LATER re-run against a database
--      holding live Big Brother rows WILL silently relabel them
--      'total-drama'. Attributing a live season is sub-project E's job; E
--      rebuilds this table.
--
--   2. A Big Brother appearance with no `bb` block is relabelled. The
--      `appearances.format` derivation reads bb_appearances MEMBERSHIP, but
--      the sync writes a bb_appearances row only when a `det.bb` block is
--      present, while the appearance's own format comes from `det.format`. So
--      an appearance that is Big Brother by `det.format` but carries no `bb`
--      block has no bb_appearances row to be found, and the next run of this
--      migration silently relabels it 'total-drama'.
--
--   3. td_appearances rows can be RESURRECTED. `ms_legacy_td_columns` is a
--      frozen snapshot taken on the first run, and the
--      `INSERT OR IGNORE INTO td_appearances … FROM ms_legacy_td_columns`
--      below replays it on every run. If a later sync legitimately DROPS an
--      appearance, a subsequent re-run reinstates the stale td_appearances row
--      for it. The snapshot is never refreshed — and must never be dropped
--      either, since dropping it re-arms the CTAS, which then fails with
--      "no such column: tribe".
--
-- ─────────────────────────────────────────────────────────────────────────
-- DEVIATION FROM BRIEF (1): D1 (both local miniflare and remote) does not
-- honor `PRAGMA foreign_keys = OFF` — `PRAGMA foreign_keys` reads back as 1
-- no matter what this script sets it to, so DROP TABLE always runs its
-- implicit "delete every row, check every FK-holding table" pass. Old
-- `appearances` and old `bonds` both carry `FOREIGN KEY (season_number)
-- REFERENCES seasons(season_number)`. Dropping `seasons` while either still
-- references it by the old single-column key fails with
-- SQLITE_CONSTRAINT_FOREIGNKEY. The fix is ordering, not the pragma:
-- rebuild and drop the OLD appearances/bonds tables (removing their FK clause
-- for good) BEFORE seasons is dropped. The pragma lines are left in as
-- documentation of intent; they are no-ops on D1.
--
-- DEVIATION FROM BRIEF (2): the brief says "do not drop or recreate
-- bb_appearances" (from bb_schema.sql), and this file does not touch its data
-- or its column list. But its schema-level
-- `FOREIGN KEY (season_number) REFERENCES seasons(season_number)` cannot
-- survive seasons losing season_number as a standalone unique/PK column: once
-- seasons's key is (format, season_number), SQLite reports "foreign key
-- mismatch - bb_appearances referencing seasons" on ANY INSERT into seasons
-- afterwards, local or remote. So bb_appearances is rebuilt in place — same
-- columns, same PRIMARY KEY (player_id, season_number), rows copied — with the
-- stale FK removed, matching the treatment appearances/bonds already get.

PRAGMA foreign_keys = OFF;

-- ── live_season: create the OLD (pre-migration) shape if missing ──────
-- This table does not exist in every database. Creating the legacy shape up
-- front gives the re-run guard and the copy below something to read from —
-- 0 rows the first time this runs anywhere.
CREATE TABLE IF NOT EXISTS live_season (
  season_number  INTEGER NOT NULL,
  player_name    TEXT    NOT NULL,
  player_id      TEXT,
  status         TEXT,
  exit_episode   INTEGER,
  immunity_wins  INTEGER DEFAULT 0,
  reward_wins    INTEGER DEFAULT 0,
  challenge_wins INTEGER DEFAULT 0,
  votes_received INTEGER DEFAULT 0
);

-- ── td_appearances: the Total Drama half of an appearance ─────────────
-- No format column: the table IS the format, exactly like bb_appearances.
--
-- The table is DECLARED (real PRIMARY KEY, NOT NULLs, DEFAULT 0) rather than
-- produced by `CREATE TABLE … AS SELECT`, which cannot declare any of those.
-- The once-only harvest of the legacy columns is pushed into a separate CTAS
-- instead: `ms_legacy_td_columns` is created on the first run only, while
-- `appearances` still has tribe/challenge_wins/…, and short-circuits (SELECT
-- never prepared) on every run after — which is what makes this re-runnable,
-- since on a second run those columns no longer exist to name.
--
-- ⚠ DO NOT DROP `ms_legacy_td_columns`. It is a MIGRATION GUARD, not a backup.
-- Its mere existence is what disarms the CTAS above; delete it and the next
-- run re-arms that statement, which then fails to compile against the migrated
-- `appearances` with "no such column: tribe" and aborts the whole file.
-- It is also not a usable backup of the six stripped columns: it is a frozen
-- snapshot taken at migration time and goes stale the moment anything edits
-- `td_appearances`, which is the live table for that data from here on.
DROP INDEX IF EXISTS idx_td_appearances_pk;
CREATE TABLE IF NOT EXISTS td_appearances (
  player_id      TEXT    NOT NULL,
  season_number  INTEGER NOT NULL,
  tribe          TEXT,
  challenge_wins INTEGER DEFAULT 0,
  immunity_wins  INTEGER DEFAULT 0,
  reward_wins    INTEGER DEFAULT 0,
  idols_found    INTEGER DEFAULT 0,
  strategic_rank INTEGER,
  PRIMARY KEY (player_id, season_number)
);
CREATE TABLE IF NOT EXISTS ms_legacy_td_columns AS
  SELECT player_id, season_number, tribe, challenge_wins, immunity_wins,
         reward_wins, idols_found, strategic_rank
  FROM appearances;
INSERT OR IGNORE INTO td_appearances
  (player_id, season_number, tribe, challenge_wins, immunity_wins, reward_wins,
   idols_found, strategic_rank)
  SELECT player_id, season_number, tribe, challenge_wins, immunity_wins,
         reward_wins, idols_found, strategic_rank
  FROM ms_legacy_td_columns;

-- ── re-run guard ──────────────────────────────────────────────────────
-- Refuse, loudly and before anything is dropped, in the one situation the
-- format derivations below cannot resolve: the same player holding two
-- appearance rows under one season number, i.e. an appearance in each show.
-- Those two rows are indistinguishable once `format` is not readable, so the
-- rebuild would collapse them. The CHECK is named so the failure explains
-- itself: "CHECK constraint failed: rerun_would_collapse_two_shows_rows".
-- On a first run and on any Total-Drama-only database this inserts 0 rows.
DROP TABLE IF EXISTS ms_rerun_guard;
CREATE TABLE ms_rerun_guard (
  n INTEGER,
  CONSTRAINT rerun_would_collapse_two_shows_rows CHECK (n = 0)
);
INSERT INTO ms_rerun_guard (n)
  SELECT 1
  WHERE EXISTS (SELECT 1 FROM appearances
                 GROUP BY player_id, season_number HAVING COUNT(*) > 1);
DROP TABLE ms_rerun_guard;

-- ── appearances: shared core only ─────────────────────────────────────
-- Rebuilt FIRST, because `bonds` derives its format from it. (`seasons` reads
-- its own column, and `live_season` is backfilled to a literal — neither reads
-- this table.) `format` here is derived from bb_appearances/td_appearances
-- membership rather than read off a column that does not exist on a first run
-- — see the long note at the top of this file, including the re-run caveat
-- about a Big Brother appearance that carries no `bb` block.
DROP TABLE IF EXISTS appearances_new;
CREATE TABLE appearances_new (
  player_id      TEXT    NOT NULL,
  format         TEXT    NOT NULL DEFAULT 'total-drama',
  season_number  INTEGER NOT NULL,
  placement      INTEGER,
  status         TEXT,
  votes_received INTEGER,
  jury_votes     INTEGER,
  final_vote     TEXT,
  PRIMARY KEY (player_id, format, season_number)
);
INSERT INTO appearances_new
  (player_id, format, season_number, placement, status, votes_received, jury_votes, final_vote)
  SELECT a.player_id,
         CASE WHEN EXISTS (SELECT 1 FROM bb_appearances b
                            WHERE b.player_id = a.player_id
                              AND b.season_number = a.season_number)
               AND NOT EXISTS (SELECT 1 FROM td_appearances t
                            WHERE t.player_id = a.player_id
                              AND t.season_number = a.season_number)
              THEN 'big-brother' ELSE 'total-drama' END,
         a.season_number, a.placement, a.status,
         a.votes_received, a.jury_votes, a.final_vote
  FROM appearances a;
DROP TABLE appearances;
ALTER TABLE appearances_new RENAME TO appearances;
CREATE INDEX IF NOT EXISTS idx_appearances_season ON appearances (format, season_number);

-- ── bonds: format joins the key ───────────────────────────────────────
-- A bond belongs to the same show as the appearance it was recorded in, and
-- `appearances` above already carries `format` by this point.
DROP TABLE IF EXISTS bonds_new;
CREATE TABLE bonds_new (
  player_id     TEXT    NOT NULL,
  ally_id       TEXT    NOT NULL,
  format        TEXT    NOT NULL DEFAULT 'total-drama',
  season_number INTEGER NOT NULL,
  PRIMARY KEY (player_id, ally_id, format, season_number)
);
INSERT INTO bonds_new (player_id, ally_id, format, season_number)
  SELECT b.player_id, b.ally_id,
         COALESCE((SELECT a.format FROM appearances a
                    WHERE a.player_id = b.player_id
                      AND a.season_number = b.season_number
                    LIMIT 1), 'total-drama'),
         b.season_number
  FROM bonds b;
DROP TABLE bonds;
ALTER TABLE bonds_new RENAME TO bonds;

-- ── bb_appearances: drop its stale FK to seasons(season_number) ───────
-- See deviation note (2) above. Same shape, same rows, no data movement.
DROP TABLE IF EXISTS bb_appearances_new;
CREATE TABLE bb_appearances_new (
  player_id        TEXT NOT NULL,
  season_number    INTEGER NOT NULL,
  hoh_wins         INTEGER DEFAULT 0,
  veto_wins        INTEGER DEFAULT 0,
  times_nominated  INTEGER DEFAULT 0,
  times_on_block   INTEGER DEFAULT 0,
  times_saved      INTEGER DEFAULT 0,
  PRIMARY KEY (player_id, season_number)
);
INSERT INTO bb_appearances_new
  (player_id, season_number, hoh_wins, veto_wins, times_nominated, times_on_block, times_saved)
  SELECT player_id, season_number, hoh_wins, veto_wins, times_nominated, times_on_block, times_saved
  FROM bb_appearances;
DROP TABLE bb_appearances;
ALTER TABLE bb_appearances_new RENAME TO bb_appearances;
CREATE INDEX IF NOT EXISTS idx_bb_appearances_season ON bb_appearances (season_number);

-- ── seasons: (format, season_number) ──────────────────────────────────
-- Rebuilt AFTER appearances/bonds/bb_appearances above: those all used to
-- carry `FOREIGN KEY (season_number) REFERENCES seasons(season_number)`, and
-- D1 enforces foreign keys unconditionally (see deviation note 1). DROP TABLE
-- runs an implicit "delete every row" pass checked against every table still
-- holding an FK into it, so seasons can only be dropped once nothing
-- references it by the old single-column key.
--
-- This is the one table that can read `format` straight back off itself:
-- worker/bb_schema.sql already added the column with
-- `ALTER TABLE seasons ADD COLUMN format TEXT DEFAULT 'total-drama'`, so the
-- COALESCE below compiles on a first run and preserves a real Big Brother
-- season's format on every run after.
DROP TABLE IF EXISTS seasons_new;
CREATE TABLE seasons_new (
  format        TEXT    NOT NULL DEFAULT 'total-drama',
  season_number INTEGER NOT NULL,
  title         TEXT,
  subtitle      TEXT,
  cast_size     INTEGER,
  episode_count INTEGER,
  winner_slug   TEXT,
  theme         TEXT,
  status        TEXT,
  PRIMARY KEY (format, season_number)
);
INSERT INTO seasons_new (format, season_number, title, subtitle, cast_size,
                         episode_count, winner_slug, theme, status)
  SELECT COALESCE(format, 'total-drama'), season_number, title, subtitle, cast_size,
         episode_count, winner_slug, theme, status
  FROM seasons;
DROP TABLE seasons;
ALTER TABLE seasons_new RENAME TO seasons;

-- ── live_season: keyed now; its stat columns are sub-project E ────────
-- What this migration owns here is the KEY — (format, season_number,
-- player_name) — so a live Big Brother season and a live Total Drama season
-- cannot collide on one numbering line. That is the whole job.
--
-- The rows are backfilled plainly to 'total-drama', the same as every other
-- table in this file: `format` did not exist on this table until this
-- migration, so every row that can possibly be in it today was written before
-- the second show existed.
--
-- Attributing a LIVE Big Brother season is NOT decided here. This table is
-- transient — rows are cleared when a season is published into permanent
-- history — and it exists to feed current-season.html, which is sub-project E.
-- E rebuilds this table and is what decides what a live Big Brother week
-- writes into `format`.
DROP TABLE IF EXISTS live_season_new;
CREATE TABLE live_season_new (
  format         TEXT    NOT NULL DEFAULT 'total-drama',
  season_number  INTEGER NOT NULL,
  player_name    TEXT    NOT NULL,
  player_id      TEXT,
  status         TEXT,
  exit_episode   INTEGER,
  immunity_wins  INTEGER DEFAULT 0,
  reward_wins    INTEGER DEFAULT 0,
  challenge_wins INTEGER DEFAULT 0,
  votes_received INTEGER DEFAULT 0,
  PRIMARY KEY (format, season_number, player_name)
);
INSERT INTO live_season_new
  (format, season_number, player_name, player_id, status, exit_episode,
   immunity_wins, reward_wins, challenge_wins, votes_received)
  SELECT 'total-drama', season_number, player_name, player_id, status, exit_episode,
         immunity_wins, reward_wins, challenge_wins, votes_received
  FROM live_season;
DROP TABLE live_season;
ALTER TABLE live_season_new RENAME TO live_season;

-- ── players: the derived Total Drama totals stop being stored ─────────
-- A stored copy of a derived number is a second source of truth, and the two
-- drift the first time a season is re-imported. These four are SUMs over
-- td_appearances; 152 players is nothing to aggregate on read.
DROP TABLE IF EXISTS players_new;
CREATE TABLE players_new (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  total_seasons       INTEGER,
  best_placement      INTEGER,
  wins                INTEGER,
  total_votes_against INTEGER,
  total_jury_votes    INTEGER,
  tier                TEXT,
  avg_placement       REAL
);
INSERT INTO players_new (id, name, total_seasons, best_placement, wins,
                         total_votes_against, total_jury_votes, tier, avg_placement)
  SELECT id, name, total_seasons, best_placement, wins,
         total_votes_against, total_jury_votes, tier, avg_placement
  FROM players;
DROP TABLE players;
ALTER TABLE players_new RENAME TO players;

PRAGMA foreign_keys = ON;
