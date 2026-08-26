-- The continuity read: what a character's seasons MEAN, as opposed to the
-- chronology, which js/continuity.js derives from the season documents and
-- never needs stored.
--
-- It has to live here because Publish regenerates franchise_roster.json
-- wholesale from this table. A field the database has never heard of survives
-- exactly until the next time somebody presses the button.
--
-- Apply once with Wrangler; SQLite has no ADD COLUMN IF NOT EXISTS.
ALTER TABLE roster ADD COLUMN continuity_note TEXT;
