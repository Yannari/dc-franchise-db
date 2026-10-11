-- One-time migration: the speaking voice column (2026-10-11).
--
-- What a character SOUNDS like, for voice acting (tools/td-vo-render.py, Qwen3-TTS VoiceDesign): sex,
-- adult age, accent, pitch, timbre, pace, how sentences end. Not `voice`, which is how they WRITE (the
-- personality line the episode writer reads). Written in the Studio, by hand or with "Write it from their
-- profile" (writer worker mode 'speaking-voice').
--
--   cd worker
--   npx wrangler d1 execute dc-franchise --remote --file roster_migration_speaking_voice.sql
--
-- ── RUN THIS ONCE. IT IS NOT RE-RUNNABLE. ──
-- Its own file: D1 runs a file as one batch and rolls back on the first error, so it
-- must not share a file with a migration that has already run.
-- Check first:
--   npx wrangler d1 execute dc-franchise --remote --command "SELECT name FROM pragma_table_info('roster')"

ALTER TABLE roster ADD COLUMN speaking_voice TEXT;
