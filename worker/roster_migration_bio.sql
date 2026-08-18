-- One-time migration: the four bio columns added with the bio work.
--
--   cd worker
--   npx wrangler d1 execute dc-franchise --remote --file roster_migration_bio.sql
--
-- ── RUN THIS ONCE. IT IS NOT RE-RUNNABLE. ──
--
-- D1 executes a file as ONE BATCH and rolls the whole thing back on the first
-- error, so a second run does not "apply the rest" — it applies NOTHING and
-- reports `duplicate column name`. An earlier version of this file claimed
-- otherwise and listed all eight bio columns; running it failed on `age` and
-- left the four new ones unadded, which is how that claim got tested.
--
-- If you are unsure whether it has already run, ask the table rather than
-- guessing — this is cheap and non-destructive:
--
--   npx wrangler d1 execute dc-franchise --remote \
--     --command "SELECT name FROM pragma_table_info('roster')"
--
-- ── WHY ONLY FOUR ──
--
-- age / ethnicity / nationality / descriptor were added to the live table out
-- of band before this file existed: the Worker read and wrote all four while
-- roster_schema.sql declared none of them. The schema now declares all eight,
-- so a FRESH database gets everything from its CREATE TABLE. An existing
-- database already has those four and needs only these.
--
-- Confirmed against the live database on 2026-08-18 — its roster table had
-- age, ethnicity, nationality and descriptor and none of the four below.

ALTER TABLE roster ADD COLUMN birthdate  TEXT;
ALTER TABLE roster ADD COLUMN hometown   TEXT;
ALTER TABLE roster ADD COLUMN occupation TEXT;
ALTER TABLE roster ADD COLUMN backstory  TEXT;

-- "Every attorney on the roster" and "everyone from Chicago" are the questions
-- these columns exist to answer, so they are worth an index each. These two ARE
-- safe to re-run; only the ALTERs above are not.
CREATE INDEX IF NOT EXISTS idx_roster_occupation ON roster (occupation);
CREATE INDEX IF NOT EXISTS idx_roster_hometown   ON roster (hometown);
