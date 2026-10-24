-- Kristal-talKs' exit interviews for a season still on the air.
-- Apply with:  npx wrangler d1 execute dc-franchise --remote --file live_exits_schema.sql
-- Safe to re-run.
--
-- A finished season carries its interviews on its row in seasons_database.json
-- (`exitInterviews`). A season being played has no row yet, so kristal.html had
-- nothing to read until the finale was exported (user, 2026-10-24: "i still
-- dont see it for the dumped in perfect match and the evicted in big brother").
-- "Publish to site" now sends them here, one row per (show, season), replaced
-- whole on every press. Keyed by show as well as number, because two shows can
-- be on the air at once (the season switcher) and live_meta holds only one.
-- Kristal ignores a row once that season is published.

CREATE TABLE IF NOT EXISTS live_exits (
  format        TEXT NOT NULL,
  season_number INTEGER NOT NULL,
  title         TEXT,
  air_year      INTEGER,
  air_slot      TEXT,
  body          TEXT NOT NULL,      -- JSON: the exitInterviews list, as the season document would carry it
  updated_at    TEXT,
  PRIMARY KEY (format, season_number)
);
