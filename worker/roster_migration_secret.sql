-- One-time migration: a Secret Story secret becomes canon on the character (2026-10-27).
--
--   cd worker
--   npx wrangler d1 execute dc-franchise --remote --file roster_migration_secret.sql
--
-- ── RUN THIS ONCE. IT IS NOT RE-RUNNABLE. ──
-- Check first:
--   npx wrangler d1 execute dc-franchise --remote --command "SELECT name FROM pragma_table_info('roster')"
--
-- WRITE-ONCE. The Studio's character save never touches this column (a save
-- that did would wipe a canon secret every time a character was edited); only
-- /api/roster/secret and /api/publish-season set it, and only while it is NULL.

ALTER TABLE roster ADD COLUMN secret TEXT;
