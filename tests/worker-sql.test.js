// tests/worker-sql.test.js
// The worker's SQL, tested for the first time.
//
// multishow-followups.md section 5 records that NOTHING covers these queries or
// the migration file, and that an edit reintroducing a removed column or dropping
// a `format` predicate passes CI green. Both of those were real bugs during that
// branch, caught only by hand-running probes against a live database.
//
// node:sqlite ships with Node 24, so the queries can run against a real database
// built from the real schema. D1 is SQLite, so the dialect matches.
//
// The queries are IMPORTED, not re-declared here. A re-declared copy silently
// stops matching the code it claims to test, which is how this project ended up
// with three prefix maps and two strip blocks.
import { describe, expect, it, beforeAll } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { leaderboardQuery, bondsQuery, castmatesQuery } from '../worker/queries.js';

let db;

/** The subset of the schema these queries touch, matching multishow_schema.sql. */
function makeDb() {
  const d = new DatabaseSync(':memory:');
  d.exec(`
    CREATE TABLE players (id TEXT PRIMARY KEY, name TEXT, tier TEXT);
    CREATE TABLE appearances (
      player_id TEXT, format TEXT, season_number INTEGER,
      placement INTEGER, status TEXT, jury_votes INTEGER DEFAULT 0,
      votes_against INTEGER DEFAULT 0,
      PRIMARY KEY (player_id, format, season_number));
    CREATE TABLE td_appearances (
      player_id TEXT, season_number INTEGER,
      challenge_wins INTEGER DEFAULT 0, immunity_wins INTEGER DEFAULT 0,
      reward_wins INTEGER DEFAULT 0, idols_found INTEGER DEFAULT 0,
      PRIMARY KEY (player_id, season_number));
    CREATE TABLE bonds (
      player_id TEXT, ally_id TEXT, format TEXT, season_number INTEGER,
      PRIMARY KEY (player_id, ally_id, format, season_number));
  `);
  // Wayne: two Total Drama seasons and one Big Brother. The real shape.
  d.exec(`
    INSERT INTO players VALUES ('wayne','Wayne','Unranked'), ('ann','Ann','S'), ('bo','Bo','A');
    INSERT INTO appearances VALUES
      ('wayne','total-drama',9,1,'Winner',5,2),
      ('wayne','total-drama',13,4,'Juror',0,6),
      ('wayne','big-brother',1,1,'Winner',4,3),
      ('ann','total-drama',9,2,'Finalist',3,4),
      ('ann','big-brother',1,2,'Runner-up',3,5),
      ('bo','big-brother',1,3,'Juror',0,7);
    INSERT INTO td_appearances VALUES ('wayne',9,6,4,1,2), ('wayne',13,2,1,0,0), ('ann',9,3,2,1,0);
    -- The same pair bonded in BOTH shows. One row before the fix.
    INSERT INTO bonds VALUES ('wayne','ann','total-drama',9), ('wayne','ann','big-brother',1);
  `);
  return d;
}

beforeAll(() => { db = makeDb(); });

describe('the leaderboard, filtered by show', () => {
  const run = (format) => {
    const sql = leaderboardQuery({ expr: 'COUNT(*)', dir: 'DESC', format });
    const args = format ? [format, 1, 20] : [1, 20];
    return db.prepare(sql).all(...args);
  };

  it('blends the shows when no format is asked for, exactly as before', () => {
    const wayne = run(null).find(r => r.id === 'wayne');
    expect(wayne.value, 'the default stopped counting every show').toBe(3);
  });

  it('counts only the show asked for', () => {
    expect(run('big-brother').find(r => r.id === 'wayne').value).toBe(1);
    expect(run('total-drama').find(r => r.id === 'wayne').value).toBe(2);
  });

  it('drops nobody from a board they belong on', () => {
    // Sub-project A's constraint: a Big Brother appearance must never remove a
    // player from a Total Drama board.
    const ids = run(null).map(r => r.id).sort();
    expect(ids).toEqual(['ann', 'bo', 'wayne']);
    expect(run('big-brother').map(r => r.id).sort()).toEqual(['ann', 'bo', 'wayne']);
    expect(run('total-drama').map(r => r.id).sort()).toEqual(['ann', 'wayne']);
  });

  it('keeps Total Drama stats out of a Big Brother board', () => {
    // challenge_wins lives in td_appearances and must contribute 0 under a
    // Big Brother filter rather than leaking across.
    const sql = leaderboardQuery({ expr: 'COALESCE(SUM(td.challenge_wins),0)', dir: 'DESC', format: 'big-brother' });
    expect(db.prepare(sql).all('big-brother', 1, 20).find(r => r.id === 'wayne').value).toBe(0);
  });
});

describe('bonds across two shows', () => {
  it('returns the pair once per show, not once in total', () => {
    // The collapse: SELECT DISTINCT without format returned ONE row for a pair
    // bonded in Total Drama 1 AND Big Brother 1 — a relationship gone from the
    // response entirely, not merely ambiguous.
    const rows = db.prepare(bondsQuery()).all('wayne');
    expect(rows, 'the two shows collapsed into one bond').toHaveLength(2);
    expect(rows.map(r => r.format).sort()).toEqual(['big-brother', 'total-drama']);
  });

  it('tells two shows apart in a castmate\'s shared seasons', () => {
    // GROUP_CONCAT(season_number) yielded "1,1" for a castmate shared in Total
    // Drama 1 and Big Brother 1 — indistinguishable in the output.
    const rows = db.prepare(castmatesQuery()).all('wayne');
    const ann = rows.find(r => r.id === 'ann');
    expect(ann.seasons.split(',').sort()).toEqual(['big-brother-1', 'total-drama-9']);
  });
});
