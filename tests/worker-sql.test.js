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
import { leaderboardQuery, bondsQuery, castmatesQuery,
         socialInsertQuery, socialSelectQuery, socialDeleteSeasonQuery } from '../worker/queries.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let db;

/** The subset of the schema these queries touch, matching multishow_schema.sql. */
function makeDb() {
  const d = new DatabaseSync(':memory:');
  // Column names track worker/multishow_schema.sql exactly. A fixture that
  // disagrees with the real schema can go green while the shipped query fails,
  // which is the failure this whole file exists to catch — the column below is
  // votes_received, not votes_against, however much the stat is called
  // "votesAgainst" in the API.
  d.exec(`
    CREATE TABLE players (id TEXT PRIMARY KEY, name TEXT, tier TEXT);
    CREATE TABLE appearances (
      player_id TEXT, format TEXT, season_number INTEGER,
      placement INTEGER, status TEXT, jury_votes INTEGER DEFAULT 0,
      votes_received INTEGER DEFAULT 0,
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

  it('runs the votes-against stat the API actually ships', () => {
    // The stat is named votesAgainst; the column is votes_received. If the
    // fixture and the schema ever drift apart, this is what fails.
    const sql = leaderboardQuery({ expr: 'SUM(COALESCE(a.votes_received,0))', dir: 'DESC' });
    const rows = db.prepare(sql).all(1, 20);
    expect(rows.find(r => r.id === 'wayne').value).toBe(11);   // 2 + 6 + 3
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

// ── the airing season's social feed ──────────────────────────────────────
//
// Built from worker/social_schema.sql itself rather than a hand-copied CREATE
// TABLE, so a column renamed in the schema and not in the query fails here. The
// rest of this file already learned that lesson the expensive way: a fixture
// that disagrees with the real schema goes green while the shipped query fails.
describe('the social feed', () => {
  const feedDb = () => {
    const d = new DatabaseSync(':memory:');
    d.exec(readFileSync(join(process.cwd(), 'worker/social_schema.sql'), 'utf8'));
    return d;
  };

  /** Exactly the fifteen values, in exactly the order, the worker binds. */
  const insert = (d, over = {}) => {
    const p = {
      id: 'p-1-1-0000', format: 'big-brother', season: 1, episode: 1,
      stream: 'timeline', handle: '@x', name: 'X', topic: 'blindside-reaction',
      kind: 'blindside', subject: 'heather', text: 'a post', at: 1000,
      replyTo: null, likes: 3, tomatoes: 0, ...over,
    };
    d.prepare(socialInsertQuery()).run(p.id, p.format, p.season, p.episode, p.stream,
      p.handle, p.name, p.topic, p.kind, p.subject, p.text, p.at, p.replyTo,
      p.likes, p.tomatoes);
    return p;
  };

  it('binds fifteen values into the fifteen columns the schema declares', () => {
    // The bind list is positional and nothing else checks it lines up. A column
    // added to the schema without a matching value lands every field one place
    // to the left — a feed where the text is in the topic column.
    const d = feedDb();
    insert(d, { text: 'the vote was a bloodbath', likes: 42 });
    const row = d.prepare(socialSelectQuery()).all('big-brother', 1)[0];
    expect(row.body).toBe('the vote was a bloodbath');
    expect(row.likes).toBe(42);
    expect(row.subject).toBe('heather');
    expect(row.at_ms).toBe(1000);
  });

  it('replays in the order the posts arrived, not the order they were written', () => {
    // Load-bearing: a reaction to the vote sorting before the vote reads as a
    // leak. The rows go in backwards on purpose.
    const d = feedDb();
    insert(d, { id: 'p-1-2-0001', episode: 2, at: 900 });
    insert(d, { id: 'p-1-1-0002', episode: 1, at: 5000 });
    insert(d, { id: 'p-1-1-0001', episode: 1, at: 100 });
    expect(d.prepare(socialSelectQuery()).all('big-brother', 1).map(r => r.id))
      .toEqual(['p-1-1-0001', 'p-1-1-0002', 'p-1-2-0001']);
  });

  it('reads one night on its own', () => {
    const d = feedDb();
    insert(d, { id: 'p-1-1-0001', episode: 1 });
    insert(d, { id: 'p-1-2-0001', episode: 2 });
    expect(d.prepare(socialSelectQuery({ episode: true })).all('big-brother', 1, 2)
      .map(r => r.id)).toEqual(['p-1-2-0001']);
  });

  it('replaces one show\'s feed without touching the other\'s', () => {
    // Two shows can be airing at once. A bare DELETE to republish one of them
    // would take the other's audience down with it.
    const d = feedDb();
    insert(d, { id: 'bb-post', format: 'big-brother', season: 1 });
    insert(d, { id: 'td-post', format: 'total-drama', season: 1 });
    d.prepare(socialDeleteSeasonQuery()).run('big-brother', 1);
    expect(d.prepare(socialSelectQuery()).all('big-brother', 1)).toHaveLength(0);
    expect(d.prepare(socialSelectQuery()).all('total-drama', 1).map(r => r.id))
      .toEqual(['td-post']);
  });

  it('rewrites a post rather than refusing it, when an episode is replayed', () => {
    // Post ids are stable across rebuilds, so a republish without the DELETE
    // would hit the primary key. The worker deletes the season first; this
    // proves the id really is the collision it is designed around.
    const d = feedDb();
    insert(d, { text: 'first take' });
    expect(() => insert(d, { text: 'second take' })).toThrow();
    d.prepare(socialDeleteSeasonQuery()).run('big-brother', 1);
    insert(d, { text: 'second take' });
    expect(d.prepare(socialSelectQuery()).all('big-brother', 1)[0].body).toBe('second take');
  });
});
