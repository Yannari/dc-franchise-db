-- DC Franchise D1 schema (Step 2 of the D1 learning project).
-- Apply with:  npx wrangler d1 execute dc-franchise --remote --file schema.sql
-- Safe to re-run: every table uses IF NOT EXISTS, so applying twice does nothing new.
-- This ADDS tables to a separate database. It cannot touch the live site or existing JSON.

-- ============================================================
-- players : one row per person (from players_database.json top level)
-- ============================================================
CREATE TABLE IF NOT EXISTS players (
  id                   TEXT PRIMARY KEY,   -- slug, e.g. "alejandro" (stable + unique)
  name                 TEXT NOT NULL,      -- display name, e.g. "Alejandro"
  total_seasons        INTEGER,
  best_placement       INTEGER,            -- 1 = won a season
  wins                 INTEGER,            -- number of seasons won
  total_challenge_wins INTEGER,
  total_immunity_wins  INTEGER,
  total_reward_wins    INTEGER,
  total_votes_against  INTEGER,
  total_idols_found    INTEGER,
  total_jury_votes     INTEGER,
  tier                 TEXT,               -- "S+", "A", ...
  avg_placement        REAL                -- REAL = decimals allowed (e.g. 3.5)
);

-- ============================================================
-- seasons : one row per season (from seasons_database.json)
-- ============================================================
CREATE TABLE IF NOT EXISTS seasons (
  season_number INTEGER PRIMARY KEY,       -- 1..14, the natural key
  title         TEXT,
  subtitle      TEXT,
  cast_size     INTEGER,
  episode_count INTEGER,
  winner_slug   TEXT,                      -- -> players.id
  theme         TEXT,
  status        TEXT                       -- "Complete", ...
);

-- ============================================================
-- appearances : THE link table. One row per (player x season),
-- flattened from each player's seasonDetails[] array.
-- This is what makes cross-season questions possible.
-- ============================================================
CREATE TABLE IF NOT EXISTS appearances (
  player_id      TEXT NOT NULL,            -- -> players.id
  season_number  INTEGER NOT NULL,         -- -> seasons.season_number
  placement      INTEGER,
  status         TEXT,                     -- "Winner", "Jury", "Pre-merge", ...
  tribe          TEXT,                     -- "Yellow -> Red -> Green -> Campers"
  challenge_wins INTEGER,
  immunity_wins  INTEGER,
  reward_wins    INTEGER,
  votes_received INTEGER,
  idols_found    INTEGER,
  strategic_rank INTEGER,
  jury_votes     INTEGER,
  final_vote     TEXT,                     -- "7-6-1"
  PRIMARY KEY (player_id, season_number),  -- a player appears once per season
  FOREIGN KEY (player_id)     REFERENCES players (id),
  FOREIGN KEY (season_number) REFERENCES seasons (season_number)
);

-- Index the season column so "everyone in season N" and self-joins stay fast.
CREATE INDEX IF NOT EXISTS idx_appearances_season ON appearances (season_number);

-- ============================================================
-- bonds : unbreakable bonds, flattened from seasonDetails[].unbreakableBonds.
-- One row per (player, ally, season). Stored one-directional as recorded;
-- queries can look both ways with OR / UNION.
-- ============================================================
CREATE TABLE IF NOT EXISTS bonds (
  player_id     TEXT NOT NULL,             -- -> players.id (whose record listed the bond)
  ally_id       TEXT NOT NULL,             -- -> players.id (the ally)
  season_number INTEGER NOT NULL,          -- -> seasons.season_number
  PRIMARY KEY (player_id, ally_id, season_number),
  FOREIGN KEY (player_id)     REFERENCES players (id),
  FOREIGN KEY (season_number) REFERENCES seasons (season_number)
);
