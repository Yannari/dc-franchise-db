-- Roster table: the CHARACTER POOL, and the source of truth for who exists.
-- Apply with:  npx wrangler d1 execute dc-franchise --remote --file roster_schema.sql
-- Safe to re-run (IF NOT EXISTS).
--
-- This is AUTHORED data you edit in the Casting Studio, unlike the players /
-- appearances / bonds tables, which are DERIVED from simulated season results.
-- franchise_roster.json becomes a published snapshot of this table.

CREATE TABLE IF NOT EXISTS roster (
  slug        TEXT PRIMARY KEY,       -- "alejandro" — stable id, also the avatar filename
  name        TEXT NOT NULL,          -- "Alejandro"
  gender      TEXT,                   -- "m" / "f" / ...
  sexuality   TEXT,
  archetype   TEXT,                   -- one of the 15 valid archetypes

  -- The 9 valid stats, as real columns so they can be queried and sorted.
  -- A JSON blob here would make "most strategic characters" impossible in SQL.
  physical    INTEGER,
  endurance   INTEGER,
  mental      INTEGER,
  social      INTEGER,
  strategic   INTEGER,
  loyalty     INTEGER,
  boldness    INTEGER,
  intuition   INTEGER,
  temperament INTEGER,

  voice       TEXT,                   -- voice profile prose (from voice-profiles.json)
  is_returnee INTEGER DEFAULT 0,      -- roster flag carried over from the JSON
  retired     INTEGER DEFAULT 0,      -- 1 = hidden from casting, history preserved
  updated_at  TEXT                    -- ISO timestamp of the last write
);

-- Casting screens list living characters alphabetically; keep that path fast.
CREATE INDEX IF NOT EXISTS idx_roster_active ON roster (retired, name);
