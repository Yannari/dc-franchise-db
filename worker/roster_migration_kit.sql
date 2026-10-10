-- One-time migration: the Total Drama character kit column (2026-10-10).
--
--   cd worker
--   npx wrangler d1 execute dc-franchise --remote --file roster_migration_kit.sql
--
-- ── RUN THIS ONCE. IT IS NOT RE-RUNNABLE. ──
-- Its own file: D1 runs a file as one batch and rolls back on the first error, so it
-- must not share a file with a migration that has already run.
-- Check first:
--   npx wrangler d1 execute dc-franchise --remote --command "SELECT name FROM pragma_table_info('roster')"

ALTER TABLE roster ADD COLUMN kit TEXT;
