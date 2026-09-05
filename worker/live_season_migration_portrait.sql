-- The portrait a live season's cast was cast WITH.
-- Apply with:  npx wrangler d1 execute dc-franchise --remote --file live_season_migration_portrait.sql
-- Safe to re-run: both statements are guarded by the worker, which retries
-- without these columns if they are missing, so an unapplied migration costs
-- the portraits and nothing else.
--
-- WHY THE SNAPSHOT NEEDS IT
--
-- A player can have any number of portraits now, scoped per show, and the
-- season records which one it cast them with. players_database.json holds
-- FINISHED seasons, so for the season currently airing this table is the only
-- place that fact can live. Without it current-season.html falls back to
-- `assets/avatars/<slug>.png` — the profile default — which is precisely the
-- season the simulator is most likely to be drawing custom art for, and the
-- transcript ends up disagreeing with the episode it is transcribing.
--
-- Both columns are stored because they answer different questions: the FILE is
-- what renders (and keeps rendering if the catalog is later edited), and the
-- ID is what the choice was, for anything that wants to reason about it.

ALTER TABLE live_season ADD COLUMN avatar_id TEXT;
ALTER TABLE live_season ADD COLUMN avatar_file TEXT;
