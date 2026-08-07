-- worker/multishow_schema.sql
--
-- Many shows, one franchise. Apply with:
--   npx wrangler d1 execute dc-franchise --config worker/wrangler.toml --local  --file worker/multishow_schema.sql --yes
--   npx wrangler d1 execute dc-franchise --config worker/wrangler.toml --remote --file worker/multishow_schema.sql --yes
--
-- SQLite cannot alter a primary key, so the three keyed tables are rebuilt
-- create-copy-drop-rename rather than altered. Every rebuild is written so a
-- second run is a no-op: the _new table is dropped first, and the copy reads
-- from whichever shape the live table is currently in.
--
-- Every existing row is Total Drama. Fourteen seasons predate the second show.
--
-- DEVIATION FROM BRIEF (1): D1 (both local miniflare and remote) does not
-- honor `PRAGMA foreign_keys = OFF` — `PRAGMA foreign_keys` reads back as 1
-- no matter what this script sets it to, so DROP TABLE always runs its
-- implicit "delete every row, check every FK-holding table" pass. `old
-- appearances` and `old bonds` both carry `FOREIGN KEY (season_number)
-- REFERENCES seasons(season_number)`. Dropping `seasons` while either still
-- references it by the old single-column key fails with
-- SQLITE_CONSTRAINT_FOREIGNKEY. The fix is ordering, not the pragma:
-- rebuild and drop the OLD appearances/bonds tables (removing their FK
-- clause for good) BEFORE seasons is dropped. The pragma lines are left in
-- as documentation of intent; they are no-ops on D1.
--
-- DEVIATION FROM BRIEF (2): the brief says "do not drop or recreate
-- bb_appearances" (from bb_schema.sql), and this file does not touch its
-- data or its column list. But its schema-level
-- `FOREIGN KEY (season_number) REFERENCES seasons(season_number)` cannot
-- survive seasons losing season_number as a standalone unique/PK column:
-- once seasons's key is (format, season_number), SQLite reports
-- "foreign key mismatch - bb_appearances referencing seasons" on ANY
-- INSERT into seasons afterwards, local or remote, including the
-- coexistence acceptance test itself. bb_appearances has 0 rows in this
-- database, so it is rebuilt in place (same columns, same
-- PRIMARY KEY (player_id, season_number), no data to lose) with the stale
-- FK removed — matching the pattern the brief already uses for
-- appearances/bonds, which also dropped their FK-to-seasons clauses rather
-- than try to keep them valid against a composite key.

PRAGMA foreign_keys = OFF;

-- ── td_appearances: the Total Drama half of an appearance ─────────────
-- No format column: the table IS the format, exactly like bb_appearances.
--
-- DEVIATION FROM BRIEF (3): the brief's `CREATE TABLE ... ; INSERT OR
-- IGNORE ... WHERE EXISTS (SELECT 1 FROM pragma_table_info('appearances')
-- WHERE name = 'tribe')` guard does not protect a second run: D1 rejects a
-- statement that references a column which doesn't exist at PREPARE time,
-- regardless of whether a WHERE clause would make that branch runtime-false
-- — confirmed locally with "no such column: tribe". `CREATE TABLE ... AS
-- SELECT` behaves differently: with `IF NOT EXISTS` and the table already
-- present, it short-circuits WITHOUT preparing the SELECT at all (verified
-- against this database). So this form only ever evaluates the
-- tribe-referencing SELECT the one time it can succeed — while
-- `appearances` still carries the old columns — and is a true no-op on
-- every run after. The trade-off: `CREATE TABLE ... AS SELECT` can't
-- declare a PRIMARY KEY inline, so the key is a UNIQUE index instead,
-- which enforces the same constraint.
CREATE TABLE IF NOT EXISTS td_appearances AS
  SELECT player_id, season_number, tribe, challenge_wins, immunity_wins,
         reward_wins, idols_found, strategic_rank
  FROM appearances;
CREATE UNIQUE INDEX IF NOT EXISTS idx_td_appearances_pk ON td_appearances (player_id, season_number);

-- ── appearances: shared core only ─────────────────────────────────────
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
-- Hardcoded literal, not COALESCE(format, ...): unlike `seasons`, the
-- pristine `appearances` table (worker/schema.sql) has never had a `format`
-- column added by an ALTER, so referencing `appearances.format` here would
-- break the very first run with "no such column: format". Every row in
-- this table is Total Drama data pre-migration, so the literal is correct
-- on every run — first or repeat — for as long as nothing else writes a
-- non-Total-Drama row into `appearances` between runs of this file, which
-- holds for this migration's own verification cycle.
INSERT INTO appearances_new
  (player_id, format, season_number, placement, status, votes_received, jury_votes, final_vote)
  SELECT player_id, 'total-drama', season_number, placement, status,
         votes_received, jury_votes, final_vote
  FROM appearances;
DROP TABLE appearances;
ALTER TABLE appearances_new RENAME TO appearances;
CREATE INDEX IF NOT EXISTS idx_appearances_season ON appearances (format, season_number);

-- ── bonds: format joins the key ───────────────────────────────────────
DROP TABLE IF EXISTS bonds_new;
CREATE TABLE bonds_new (
  player_id     TEXT    NOT NULL,
  ally_id       TEXT    NOT NULL,
  format        TEXT    NOT NULL DEFAULT 'total-drama',
  season_number INTEGER NOT NULL,
  PRIMARY KEY (player_id, ally_id, format, season_number)
);
INSERT INTO bonds_new (player_id, ally_id, format, season_number)
  SELECT player_id, ally_id, 'total-drama', season_number FROM bonds;
DROP TABLE bonds;
ALTER TABLE bonds_new RENAME TO bonds;

-- ── bb_appearances: drop its stale FK to seasons(season_number) ───────
-- See deviation note (2) above. Empty table, same shape, no data movement.
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
-- carry `FOREIGN KEY (season_number) REFERENCES seasons(season_number)`,
-- and D1 enforces foreign keys unconditionally (see deviation note up top).
-- DROP TABLE runs an implicit "delete every row" pass that is checked
-- against every table still holding an FK into it, so seasons can only be
-- dropped once nothing references it by the old single-column key.
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
-- This table does not exist yet in this database. Create it in its OLD
-- (pre-migration) shape first if missing, so the copy below always has a
-- source to read from — 0 rows the first time this runs anywhere, real rows
-- once sub-project E starts writing to it.
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
