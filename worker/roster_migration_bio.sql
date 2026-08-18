-- One-time migration: the bio columns.
--
--   npx wrangler d1 execute dc-franchise --remote --file roster_migration_bio.sql
--
-- WHY THIS IS A SEPARATE FILE. roster_schema.sql promises at the top that it is
-- safe to re-run, and it keeps that promise with CREATE TABLE IF NOT EXISTS.
-- SQLite has no ADD COLUMN IF NOT EXISTS, so an ALTER in there would make the
-- whole file abort on the second run and take the tombstone table with it.
-- A fresh database gets these columns from the CREATE; an existing one gets
-- them from here, ONCE.
--
-- Re-running this is harmless but noisy: each ALTER fails with "duplicate
-- column name" and the rest still apply. If you are unsure whether it has been
-- run, ask the table instead of guessing:
--
--   npx wrangler d1 execute dc-franchise --remote \
--     --command "SELECT name FROM pragma_table_info('roster')"
--
-- age / ethnicity / nationality / descriptor were added to the live table out
-- of band before this file existed — roster_schema.sql did not declare them and
-- the Worker was already reading and writing them, so a fresh database built
-- from the schema would have been missing four columns the code depends on.
-- They are listed here too, so a database at either state converges.

ALTER TABLE roster ADD COLUMN age         INTEGER;
ALTER TABLE roster ADD COLUMN ethnicity   TEXT;
ALTER TABLE roster ADD COLUMN nationality TEXT;
ALTER TABLE roster ADD COLUMN descriptor  TEXT;

-- New with the bio work.
ALTER TABLE roster ADD COLUMN birthdate   TEXT;
ALTER TABLE roster ADD COLUMN hometown    TEXT;
ALTER TABLE roster ADD COLUMN occupation  TEXT;
ALTER TABLE roster ADD COLUMN backstory   TEXT;

-- "Every attorney on the roster" and "everyone from Chicago" are the questions
-- these columns exist to answer, so they are worth an index each.
CREATE INDEX IF NOT EXISTS idx_roster_occupation ON roster (occupation);
CREATE INDEX IF NOT EXISTS idx_roster_hometown   ON roster (hometown);
