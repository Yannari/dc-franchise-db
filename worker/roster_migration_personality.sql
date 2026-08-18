-- One-time migration: the long-form personality column.
--
--   cd worker
--   npx wrangler d1 execute dc-franchise --remote --file roster_migration_personality.sql
--
-- RUN ONCE. D1 executes a file as one batch and rolls the whole thing back on
-- the first error, so re-running reports `duplicate column name` and applies
-- nothing. Check before guessing:
--
--   npx wrangler d1 execute dc-franchise --remote \
--     --command "SELECT name FROM pragma_table_info('roster')"
--
-- `personality` is the long-form version of `voice` and is GENERATED from it,
-- not typed beside it. See the note in roster_schema.sql for why they are not
-- two hand-authored fields.

ALTER TABLE roster ADD COLUMN personality TEXT;
