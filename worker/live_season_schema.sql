-- Live season: where everyone stands in the season currently airing.
-- Apply with:  npx wrangler d1 execute dc-franchise --remote --file live_season_schema.sql
-- Safe to re-run.
--
-- players_database.json only ever holds FINISHED seasons, so a season in
-- progress has nowhere to live. The simulator pushes a snapshot here after any
-- episode you're happy with, and the site overlays it on top of the finished
-- data. Nothing here is permanent: when the season is published for real,
-- these rows are cleared and the season becomes part of the normal history.

CREATE TABLE IF NOT EXISTS live_season (
  season_number INTEGER NOT NULL,
  player_name   TEXT NOT NULL,      -- the simulator works in display names
  player_id     TEXT,               -- roster slug when one matches
  status        TEXT,               -- 'in' | 'out' | 'jury'
  exit_episode  INTEGER,            -- null while they're still in
  immunity_wins INTEGER DEFAULT 0,
  reward_wins   INTEGER DEFAULT 0,
  challenge_wins INTEGER DEFAULT 0,
  votes_received INTEGER DEFAULT 0,
  -- The portrait this season cast them with. A player can have any number,
  -- scoped per show, and for an AIRING season this table is the only place
  -- that choice exists — players_database.json holds finished seasons only.
  -- See live_season_migration_portrait.sql for an existing database.
  avatar_id      TEXT,
  avatar_file    TEXT,
  PRIMARY KEY (season_number, player_name)
);

CREATE INDEX IF NOT EXISTS idx_live_player ON live_season (player_id);

-- One row describing the airing season itself.
CREATE TABLE IF NOT EXISTS live_meta (
  id            INTEGER PRIMARY KEY CHECK (id = 1),   -- single row, enforced
  season_number INTEGER,
  title         TEXT,
  episode       INTEGER,
  total_players INTEGER,
  still_in      INTEGER,
  updated_at    TEXT
);
