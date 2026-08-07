-- worker/verify_multishow.sql
-- The acceptance test for the migration, as data rather than prose.
-- Run after applying, locally first:
--   npx wrangler d1 execute dc-franchise --config worker/wrangler.toml --local --file worker/verify_multishow.sql

-- 1. Every season carries a format and nothing was lost.
SELECT 'seasons' AS check_name, COUNT(*) AS n,
       SUM(CASE WHEN format = 'total-drama' THEN 1 ELSE 0 END) AS td
FROM seasons;

-- 2. Appearances kept every row and gained a format.
SELECT 'appearances' AS check_name, COUNT(*) AS n,
       SUM(CASE WHEN format = 'total-drama' THEN 1 ELSE 0 END) AS td
FROM appearances;

-- 3. The Total Drama stats moved rather than vanished.
SELECT 'td_appearances' AS check_name, COUNT(*) AS n,
       SUM(COALESCE(challenge_wins,0)) AS challenge_wins
FROM td_appearances;

-- 4. The shared table no longer carries format-specific columns.
SELECT 'appearances_columns' AS check_name, COUNT(*) AS leaked
FROM pragma_table_info('appearances')
WHERE name IN ('tribe','challenge_wins','immunity_wins','reward_wins','idols_found','strategic_rank');

-- 4b. And neither does the player record — those four are derived now.
SELECT 'players_columns' AS check_name, COUNT(*) AS leaked
FROM pragma_table_info('players')
WHERE name IN ('total_challenge_wins','total_immunity_wins','total_reward_wins','total_idols_found');

-- 5. THE ACCEPTANCE TEST: two shows, both with a season 1, side by side.
INSERT OR REPLACE INTO seasons (format, season_number, title, status)
  VALUES ('big-brother', 1, 'Big Brother 1', 'Complete');
SELECT 'coexistence' AS check_name, COUNT(*) AS n
FROM seasons WHERE season_number = 1;
DELETE FROM seasons WHERE format = 'big-brother' AND season_number = 1;

-- 6. bonds kept every row and gained a format.
SELECT 'bonds' AS check_name, COUNT(*) AS n,
       SUM(CASE WHEN format = 'total-drama' THEN 1 ELSE 0 END) AS td
FROM bonds;
