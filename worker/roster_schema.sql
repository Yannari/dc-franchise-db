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

  -- ── the bio ──
  --
  -- WHO THEY ARE, as opposed to how they talk (`voice`) or what they did in a
  -- season (players_database.json, derived). Columns rather than a blob for the
  -- same reason the stats are: "every attorney on the roster" has to be a query.
  --
  -- `voice` and `backstory` are deliberately NOT one field even though they
  -- overlap. Voice is a writing directive shipped inside every episode prompt —
  -- padding it with biography is paid for on every episode of every season.
  -- Backstory is read by a human on a wiki page, and unlike voice it can change
  -- when a life event lands.
  age         INTEGER,                -- only when no birthdate; see below
  birthdate   TEXT,                   -- ISO 'YYYY-MM-DD'. AUTHORITATIVE over age.
  ethnicity   TEXT,
  nationality TEXT,                   -- country: "Canadian"
  hometown    TEXT,                   -- where they are FROM: "Chicago, IL"
  occupation  TEXT,                   -- "Attorney"
  descriptor  TEXT,                   -- anything that is neither, kept verbatim
  backstory   TEXT,                   -- reader-facing prose: who they were before the show

  is_returnee INTEGER DEFAULT 0,      -- roster flag carried over from the JSON
  retired     INTEGER DEFAULT 0,      -- 1 = hidden from casting, history preserved
  updated_at  TEXT                    -- ISO timestamp of the last write
);

-- Casting screens list living characters alphabetically; keep that path fast.
CREATE INDEX IF NOT EXISTS idx_roster_active ON roster (retired, name);

-- Tombstones: characters deliberately deleted from the pool.
-- Publishing overwrites franchise_roster.json, so it has to tell "you deleted
-- this on purpose" apart from "this never made it into the database" (a
-- half-failed save). Without that distinction publish either blocks every
-- legitimate delete, or silently deletes characters it shouldn't.
CREATE TABLE IF NOT EXISTS roster_deleted (
  slug       TEXT PRIMARY KEY,
  name       TEXT,
  deleted_at TEXT
);
