-- worker/verify_multishow.sql
-- The acceptance test for the migration, as data rather than prose.
-- Run after applying, locally first:
--   npx wrangler d1 execute dc-franchise --config worker/wrangler.toml --local --file worker/verify_multishow.sql
--
-- READ-ONLY. This file ships to production and is expected to be run against
-- the live database, so it does not INSERT, UPDATE or DELETE anything — an
-- earlier version wrote a synthetic Big Brother season 1 and then deleted it,
-- which against a database holding a REAL Big Brother season 1 would have
-- overwritten and then destroyed it.

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
       SUM(CASE WHEN tribe IS NOT NULL AND tribe <> '' THEN 1 ELSE 0 END) AS with_tribe,
       SUM(COALESCE(challenge_wins,0)) AS challenge_wins
FROM td_appearances;

-- 3b. …and it is a declared table, not a CREATE-TABLE-AS-SELECT husk:
--     (player_id, season_number) is a real PRIMARY KEY, both NOT NULL.
SELECT 'td_appearances_shape' AS check_name,
       (SELECT COUNT(*) FROM pragma_table_info('td_appearances') WHERE pk > 0) AS pk_cols,
       (SELECT COUNT(*) FROM pragma_table_info('td_appearances')
         WHERE name IN ('player_id','season_number') AND "notnull" = 1) AS notnull_cols,
       (SELECT COUNT(*) FROM pragma_table_info('td_appearances')
         WHERE name IN ('challenge_wins','immunity_wins','reward_wins','idols_found')
           AND dflt_value = '0') AS default_zero_cols;

-- 4. The shared table no longer carries format-specific columns.
SELECT 'appearances_columns' AS check_name, COUNT(*) AS leaked
FROM pragma_table_info('appearances')
WHERE name IN ('tribe','challenge_wins','immunity_wins','reward_wins','idols_found','strategic_rank');

-- 4b. And neither does the player record — those four are derived now.
SELECT 'players_columns' AS check_name, COUNT(*) AS leaked
FROM pragma_table_info('players')
WHERE name IN ('total_challenge_wins','total_immunity_wins','total_reward_wins','total_idols_found');

-- 5. THE ACCEPTANCE TEST: two shows can hold the same season number.
--    Proved from the key's own definition rather than by writing a row: the
--    primary key of `seasons` is (format, season_number), so `season_number`
--    alone is not unique and 'big-brother' + 1 cannot collide with
--    'total-drama' + 1. pk = the column's 1-based position in the key.
--    Expected: pk_cols=2, format_pos=1, season_pos=2, season_alone_unique=0.
SELECT 'coexistence' AS check_name,
       (SELECT COUNT(*) FROM pragma_table_info('seasons') WHERE pk > 0) AS pk_cols,
       (SELECT pk FROM pragma_table_info('seasons') WHERE name = 'format') AS format_pos,
       (SELECT pk FROM pragma_table_info('seasons') WHERE name = 'season_number') AS season_pos,
       (SELECT COUNT(*) FROM pragma_index_list('seasons') l
         WHERE l."unique" = 1
           AND (SELECT COUNT(*) FROM pragma_index_info(l.name)) = 1
           AND (SELECT COUNT(*) FROM pragma_index_info(l.name) WHERE name = 'season_number') = 1
       ) AS season_alone_unique;

-- 5b. The same key shape on the other rebuilt tables.
SELECT 'appearances_pk' AS check_name,
       (SELECT COUNT(*) FROM pragma_table_info('appearances') WHERE pk > 0) AS pk_cols,
       (SELECT pk FROM pragma_table_info('appearances') WHERE name = 'format') AS format_pos;
SELECT 'bonds_pk' AS check_name,
       (SELECT COUNT(*) FROM pragma_table_info('bonds') WHERE pk > 0) AS pk_cols,
       (SELECT pk FROM pragma_table_info('bonds') WHERE name = 'format') AS format_pos;
SELECT 'live_season_pk' AS check_name,
       (SELECT COUNT(*) FROM pragma_table_info('live_season') WHERE pk > 0) AS pk_cols,
       (SELECT pk FROM pragma_table_info('live_season') WHERE name = 'format') AS format_pos;

-- 6. bonds kept every row and gained a format.
SELECT 'bonds' AS check_name, COUNT(*) AS n,
       SUM(CASE WHEN format = 'total-drama' THEN 1 ELSE 0 END) AS td
FROM bonds;

-- 7. players survived the rebuild intact.
SELECT 'players' AS check_name, COUNT(*) AS n FROM players;

-- 8. bb_appearances — the table the brief said not to touch. Its stale
--    foreign key to seasons(season_number) had to go (it cannot reference a
--    composite key), but every row must still be there.
SELECT 'bb_appearances' AS check_name, COUNT(*) AS n,
       (SELECT COUNT(*) FROM pragma_table_info('bb_appearances')) AS cols,
       (SELECT COUNT(*) FROM pragma_foreign_key_list('bb_appearances')) AS stale_fks
FROM bb_appearances;

-- 9. The legacy Total Drama columns stripped off `appearances` are still
--    recoverable from the harvest staging table the migration keeps.
SELECT 'ms_legacy_td_columns' AS check_name, COUNT(*) AS n FROM ms_legacy_td_columns;
