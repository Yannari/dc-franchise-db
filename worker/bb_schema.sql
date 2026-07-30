-- Big Brother groundwork.
-- Apply with:  npx wrangler d1 execute dc-franchise --remote --file bb_schema.sql --yes
--
-- Two parts, with different re-run behaviour:
--
--   1. The ALTER is a ONE-TIME migration. SQLite has no "ADD COLUMN IF NOT
--      EXISTS", so running this file a second time fails on that line with
--      "duplicate column name: format". That error is harmless and means the
--      migration is already applied — everything below it is idempotent.
--   2. The table is CREATE ... IF NOT EXISTS and is safe to re-run.
--
-- Nothing here changes how Total Drama seasons behave. Every existing season is
-- backfilled to 'total-drama', which is what they are.

-- ── 1. Which show does a season belong to? ────────────────────────────
ALTER TABLE seasons ADD COLUMN format TEXT DEFAULT 'total-drama';

UPDATE seasons SET format = 'total-drama' WHERE format IS NULL;

-- ── 2. Big Brother per-season stats ───────────────────────────────────
-- Kept out of `appearances` on purpose: these columns would be null for every
-- Total Drama row, which is almost every row. The shared per-season fields
-- (placement, status, votes received, jury votes) stay in `appearances` for
-- both shows, so anything that reads a placement keeps working across formats.
CREATE TABLE IF NOT EXISTS bb_appearances (
  player_id        TEXT NOT NULL,       -- -> players.id / roster.slug
  season_number    INTEGER NOT NULL,    -- -> seasons.season_number
  hoh_wins         INTEGER DEFAULT 0,
  veto_wins        INTEGER DEFAULT 0,
  times_nominated  INTEGER DEFAULT 0,   -- includes replacement nominations
  times_on_block   INTEGER DEFAULT 0,   -- reached an eviction night nominated
  times_saved      INTEGER DEFAULT 0,   -- taken off the block by a veto
  PRIMARY KEY (player_id, season_number),
  FOREIGN KEY (player_id)     REFERENCES players (id),
  FOREIGN KEY (season_number) REFERENCES seasons (season_number)
);

CREATE INDEX IF NOT EXISTS idx_bb_appearances_season ON bb_appearances (season_number);
