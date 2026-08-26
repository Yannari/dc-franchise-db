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

  voice       TEXT,                   -- authored raw voice profile prose
  profile_sources TEXT,                -- JSON field-keyed provenance arrays

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
  -- The long-form version of `voice`, for the wiki page.
  --
  -- These two are the SAME TRUTH at two lengths, and only one of them is ever
  -- written by hand. `voice` is the short imperative that ships inside every
  -- episode prompt ("never lets you see the scheme" instructs a model better
  -- than "he is strategically guarded" describes him), and `personality` is
  -- generated from it plus the stat line. Authoring both would be two copies of
  -- one fact, which is the drift this project keeps getting bitten by.
  personality TEXT,

  -- The casting interview: the questionnaire every reference character page
  -- opens with, stored as a JSON array of {key, q, a}.
  --
  -- Stored WITH its question text rather than as a bare map of answers, because
  -- an article renders interviews written long before the current wording of
  -- the question list. See js/casting-interview.js, which owns that list.
  --
  -- It is written at CASTING and must never be generated from a played season:
  -- "do you have a strategy for winning" answered by a model that has read the
  -- season leaks the ending into a tape recorded before the door shut.
  casting_interview TEXT,

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
