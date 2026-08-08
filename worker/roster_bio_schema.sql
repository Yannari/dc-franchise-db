-- Roster bio: age, ethnicity and nationality as real columns.
-- Apply with:  npx wrangler d1 execute dc-franchise --remote --file roster_bio_schema.sql
--
-- RUN ONCE. SQLite has no ADD COLUMN IF NOT EXISTS, so a second run answers
-- "duplicate column name: age" and changes nothing — that error means it is
-- already applied, not that something is wrong. The alternative (rebuilding the
-- table so the file is re-runnable) would copy the OLD column list forward and
-- wipe every value entered since, which is a far worse failure than a red line
-- in a terminal.
--
-- WHY THESE ARE COLUMNS. The Casting Studio has always collected age and origin
-- and folded them into a sentence at the front of the voice profile, because
-- the episode writer reads the voice profile and nothing else:
--
--     "21, Asian Canadian, lesbian. Twin sister of Harriett…"
--
-- Good for writing, useless for asking. "Who is the youngest player ever to win
-- HOH" is a query against a sentence, which is to say it is not a query.
--
-- WHY ETHNICITY AND NATIONALITY ARE SEPARATE. The single origin box holds all of
-- `Latino`, `Nigerian`, `Scouse`, `Asian Canadian` and `Mixed Mexican Canadian`
-- — three kinds of fact in one column. "First Asian winner" asked against that
-- matches `Asian Canadian` and misses `Japanese`.
--
-- `descriptor` is the honest overflow: `Scouse` is a real thing to know about
-- somebody and is neither an ethnicity nor a nationality. It is kept verbatim
-- rather than dropped or forced into the wrong column.
--
-- NOTHING HERE IS INFERRED. A Nigerian character does not get an ethnicity
-- because the record does not state one, and a database that invents
-- demographics is worse than one with an empty field. See js/bio.js.

ALTER TABLE roster ADD COLUMN age         INTEGER;
ALTER TABLE roster ADD COLUMN ethnicity   TEXT;
ALTER TABLE roster ADD COLUMN nationality TEXT;
ALTER TABLE roster ADD COLUMN descriptor  TEXT;

-- Trivia asks for extremes ("youngest to win HOH"), which is an ordered scan of
-- everybody who HAS an age — a small set today and worth an index either way.
CREATE INDEX IF NOT EXISTS idx_roster_age ON roster (age);
CREATE INDEX IF NOT EXISTS idx_roster_ethnicity ON roster (ethnicity);
CREATE INDEX IF NOT EXISTS idx_roster_nationality ON roster (nationality);
