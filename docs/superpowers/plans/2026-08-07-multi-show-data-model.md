# Multi-Show Data Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a season identified by `(format, season_number)` so Total Drama and Big Brother seasons coexist in D1 and in the JSON databases, with no visible change to the site.

**Architecture:** A season becomes a composite key with per-show numbering. A show registry (`js/shows.js`) owns format slugs, URL prefixes and the back-compatible reference parser. In D1, `seasons`/`appearances`/`bonds`/`live_season` gain `format` (rebuilt, because SQLite cannot alter a primary key), and the Total Drama columns move out of `appearances` into `td_appearances` mirroring the existing `bb_appearances`. The JSON databases gain `format`/`seasonId` per season and a `byShow` block per player.

**Tech Stack:** Vanilla ES modules (no build step), Cloudflare D1 (SQLite) via `npx wrangler`, Vitest for JS tests, Python 3 for the data validators.

## Global Constraints

- The column is named **`format`**, never `show` — `worker/bb_schema.sql` already established it.
- Format slugs are exactly **`total-drama`** and **`big-brother`**.
- Season id string form is **`td-14`**, **`bb-1`** (prefix, hyphen, number — no zero padding).
- A bare integer season reference (`?season=7`) means **Total Drama, forever**.
- Every existing row backfills to `total-drama`. 14 seasons, 262 appearances.
- Migration SQL must be **safe to re-run**.
- The JSON databases are **build outputs** — never hand-edit them; regenerate.
- No page gains a badge, filter or per-show section in this plan. The only user-visible change permitted is that nothing breaks.
- Run tests with `node node_modules/vitest/vitest.mjs run <file>` (the `vitest` binary is not on PATH in this checkout).

---

### Task 1: The show registry and season references

**Files:**
- Create: `js/shows.js`
- Test: `tests/shows.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `SHOWS` (object keyed by format slug), `formatPrefix(format) -> string`, `seasonId(format, number) -> string`, `parseSeasonRef(ref) -> {format, number} | null`, `showName(format) -> string`.

- [ ] **Step 1: Write the failing test**

```js
// tests/shows.test.js
import { describe, expect, it } from 'vitest';
import { SHOWS, formatPrefix, seasonId, parseSeasonRef, showName } from '../js/shows.js';

describe('the show registry', () => {
  it('knows both shows by their slugs', () => {
    expect(Object.keys(SHOWS)).toContain('total-drama');
    expect(Object.keys(SHOWS)).toContain('big-brother');
    expect(showName('big-brother')).toBe('Big Brother');
  });

  it('builds a season id from a format and a number', () => {
    expect(seasonId('total-drama', 14)).toBe('td-14');
    expect(seasonId('big-brother', 1)).toBe('bb-1');
    expect(formatPrefix('total-drama')).toBe('td');
  });
});

describe('parseSeasonRef', () => {
  // The whole point: every link ever saved is a bare number.
  it('reads a bare number as Total Drama', () => {
    expect(parseSeasonRef('7')).toEqual({ format: 'total-drama', number: 7 });
    expect(parseSeasonRef(7)).toEqual({ format: 'total-drama', number: 7 });
  });

  it('reads a prefixed id', () => {
    expect(parseSeasonRef('bb-1')).toEqual({ format: 'big-brother', number: 1 });
    expect(parseSeasonRef('td-14')).toEqual({ format: 'total-drama', number: 14 });
  });

  it('round-trips', () => {
    expect(parseSeasonRef(seasonId('big-brother', 3))).toEqual({ format: 'big-brother', number: 3 });
  });

  it('refuses nonsense rather than guessing', () => {
    expect(parseSeasonRef('')).toBeNull();
    expect(parseSeasonRef('xx-2')).toBeNull();
    expect(parseSeasonRef('bb-0')).toBeNull();
    expect(parseSeasonRef(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `node node_modules/vitest/vitest.mjs run tests/shows.test.js`
Expected: FAIL — `Failed to resolve import "../js/shows.js"`.

- [ ] **Step 3: Write the registry**

```js
// js/shows.js
// ══════════════════════════════════════════════════════════════════════
// shows.js — which show a season belongs to
// ══════════════════════════════════════════════════════════════════════
//
// The franchise was one show numbered 1..14, so a season was an integer and
// every page could assume it. With a second show that integer stops being an
// identity: "Season 1" is now a question, not an answer.
//
// A season is (format, season_number), each show numbering from one. This file
// is the only place that knows the slugs, the URL prefixes and the display
// names, so adding a third show is one entry here rather than a search for
// every place a format was assumed.

export const SHOWS = {
  'total-drama': { prefix: 'td', name: 'Total Drama', short: 'TD', emoji: '🎬' },
  'big-brother': { prefix: 'bb', name: 'Big Brother', short: 'BB', emoji: '📹' },
};

/** The default for anything that predates formats — every old season is this. */
export const DEFAULT_FORMAT = 'total-drama';

const BY_PREFIX = Object.fromEntries(
  Object.entries(SHOWS).map(([format, show]) => [show.prefix, format]));

export function formatPrefix(format) {
  return SHOWS[format]?.prefix || SHOWS[DEFAULT_FORMAT].prefix;
}

export function showName(format) {
  return SHOWS[format]?.name || SHOWS[DEFAULT_FORMAT].name;
}

/** "td-14" — the string form used in URLs and cross-references. */
export function seasonId(format, number) {
  return `${formatPrefix(format)}-${Number(number)}`;
}

/**
 * Read a season reference from a URL, a JSON field or a saved link.
 *
 * A BARE INTEGER IS TOTAL DRAMA, PERMANENTLY. Every link on the site and every
 * link anybody has bookmarked is `?season=7`, and those cannot be allowed to
 * rot the day a second show exists.
 *
 * Returns null rather than guessing, so a caller can tell "no season" from
 * "season 0".
 */
export function parseSeasonRef(ref) {
  if (ref == null || ref === '') return null;
  const raw = String(ref).trim().toLowerCase();

  if (/^\d+$/.test(raw)) {
    const number = Number(raw);
    return number > 0 ? { format: DEFAULT_FORMAT, number } : null;
  }

  const match = raw.match(/^([a-z]+)-(\d+)$/);
  if (!match) return null;
  const format = BY_PREFIX[match[1]];
  const number = Number(match[2]);
  if (!format || number <= 0) return null;
  return { format, number };
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `node node_modules/vitest/vitest.mjs run tests/shows.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add js/shows.js tests/shows.test.js
git commit -m "A season stops being an integer and becomes a show and a number"
```

---

### Task 2: The D1 migration

**Files:**
- Create: `worker/multishow_schema.sql`
- Create: `worker/verify_multishow.sql`

**Interfaces:**
- Consumes: the existing tables in `worker/schema.sql` and `worker/bb_schema.sql`.
- Produces: `seasons(format, season_number, ...)` PK `(format, season_number)`; `appearances(player_id, format, season_number, placement, status, votes_received, jury_votes, final_vote)` PK `(player_id, format, season_number)`; `td_appearances(player_id, season_number, tribe, challenge_wins, immunity_wins, reward_wins, idols_found, strategic_rank)`; `bonds(player_id, ally_id, format, season_number)`; `live_season(format, season_number, player_name, ...)`.

- [ ] **Step 1: Write the migration**

```sql
-- worker/multishow_schema.sql
--
-- Many shows, one franchise. Apply with:
--   npx wrangler d1 execute dc-franchise --local  --file worker/multishow_schema.sql --yes
--   npx wrangler d1 execute dc-franchise --remote --file worker/multishow_schema.sql --yes
--
-- SQLite cannot alter a primary key, so the three keyed tables are rebuilt
-- create-copy-drop-rename rather than altered. Every rebuild is written so a
-- second run is a no-op: the _new table is dropped first, and the copy reads
-- from whichever shape the live table is currently in.
--
-- Every existing row is Total Drama. Fourteen seasons predate the second show.

PRAGMA foreign_keys = OFF;

-- ── seasons: (format, season_number) ──────────────────────────────────
DROP TABLE IF EXISTS seasons_new;
CREATE TABLE seasons_new (
  format        TEXT    NOT NULL DEFAULT 'total-drama',
  season_number INTEGER NOT NULL,
  title         TEXT,
  subtitle      TEXT,
  cast_size     INTEGER,
  episode_count INTEGER,
  winner_slug   TEXT,
  theme         TEXT,
  status        TEXT,
  PRIMARY KEY (format, season_number)
);
INSERT INTO seasons_new (format, season_number, title, subtitle, cast_size,
                         episode_count, winner_slug, theme, status)
  SELECT COALESCE(format, 'total-drama'), season_number, title, subtitle, cast_size,
         episode_count, winner_slug, theme, status
  FROM seasons;
DROP TABLE seasons;
ALTER TABLE seasons_new RENAME TO seasons;

-- ── td_appearances: the Total Drama half of an appearance ─────────────
-- No format column: the table IS the format, exactly like bb_appearances.
CREATE TABLE IF NOT EXISTS td_appearances (
  player_id      TEXT    NOT NULL,
  season_number  INTEGER NOT NULL,
  tribe          TEXT,
  challenge_wins INTEGER DEFAULT 0,
  immunity_wins  INTEGER DEFAULT 0,
  reward_wins    INTEGER DEFAULT 0,
  idols_found    INTEGER DEFAULT 0,
  strategic_rank INTEGER,
  PRIMARY KEY (player_id, season_number)
);
INSERT OR IGNORE INTO td_appearances
  (player_id, season_number, tribe, challenge_wins, immunity_wins, reward_wins,
   idols_found, strategic_rank)
  SELECT player_id, season_number, tribe, challenge_wins, immunity_wins,
         reward_wins, idols_found, strategic_rank
  FROM appearances
  WHERE EXISTS (SELECT 1 FROM pragma_table_info('appearances') WHERE name = 'tribe');

-- ── appearances: shared core only ─────────────────────────────────────
DROP TABLE IF EXISTS appearances_new;
CREATE TABLE appearances_new (
  player_id      TEXT    NOT NULL,
  format         TEXT    NOT NULL DEFAULT 'total-drama',
  season_number  INTEGER NOT NULL,
  placement      INTEGER,
  status         TEXT,
  votes_received INTEGER,
  jury_votes     INTEGER,
  final_vote     TEXT,
  PRIMARY KEY (player_id, format, season_number)
);
INSERT INTO appearances_new
  (player_id, format, season_number, placement, status, votes_received, jury_votes, final_vote)
  SELECT player_id, 'total-drama', season_number, placement, status,
         votes_received, jury_votes, final_vote
  FROM appearances;
DROP TABLE appearances;
ALTER TABLE appearances_new RENAME TO appearances;
CREATE INDEX IF NOT EXISTS idx_appearances_season ON appearances (format, season_number);

-- ── bonds: format joins the key ───────────────────────────────────────
DROP TABLE IF EXISTS bonds_new;
CREATE TABLE bonds_new (
  player_id     TEXT    NOT NULL,
  ally_id       TEXT    NOT NULL,
  format        TEXT    NOT NULL DEFAULT 'total-drama',
  season_number INTEGER NOT NULL,
  PRIMARY KEY (player_id, ally_id, format, season_number)
);
INSERT INTO bonds_new (player_id, ally_id, format, season_number)
  SELECT player_id, ally_id, 'total-drama', season_number FROM bonds;
DROP TABLE bonds;
ALTER TABLE bonds_new RENAME TO bonds;

-- ── live_season: keyed now; its stat columns are sub-project E ────────
DROP TABLE IF EXISTS live_season_new;
CREATE TABLE live_season_new (
  format         TEXT    NOT NULL DEFAULT 'total-drama',
  season_number  INTEGER NOT NULL,
  player_name    TEXT    NOT NULL,
  player_id      TEXT,
  status         TEXT,
  exit_episode   INTEGER,
  immunity_wins  INTEGER DEFAULT 0,
  reward_wins    INTEGER DEFAULT 0,
  challenge_wins INTEGER DEFAULT 0,
  votes_received INTEGER DEFAULT 0,
  PRIMARY KEY (format, season_number, player_name)
);
INSERT INTO live_season_new
  (format, season_number, player_name, player_id, status, exit_episode,
   immunity_wins, reward_wins, challenge_wins, votes_received)
  SELECT 'total-drama', season_number, player_name, player_id, status, exit_episode,
         immunity_wins, reward_wins, challenge_wins, votes_received
  FROM live_season;
DROP TABLE live_season;
ALTER TABLE live_season_new RENAME TO live_season;

-- ── players: the derived Total Drama totals stop being stored ─────────
-- A stored copy of a derived number is a second source of truth, and the two
-- drift the first time a season is re-imported. These four are SUMs over
-- td_appearances; 152 players is nothing to aggregate on read.
DROP TABLE IF EXISTS players_new;
CREATE TABLE players_new (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  total_seasons       INTEGER,
  best_placement      INTEGER,
  wins                INTEGER,
  total_votes_against INTEGER,
  total_jury_votes    INTEGER,
  tier                TEXT,
  avg_placement       REAL
);
INSERT INTO players_new (id, name, total_seasons, best_placement, wins,
                         total_votes_against, total_jury_votes, tier, avg_placement)
  SELECT id, name, total_seasons, best_placement, wins,
         total_votes_against, total_jury_votes, tier, avg_placement
  FROM players;
DROP TABLE players;
ALTER TABLE players_new RENAME TO players;

PRAGMA foreign_keys = ON;
```

- [ ] **Step 2: Write the verification query**

```sql
-- worker/verify_multishow.sql
-- The acceptance test for the migration, as data rather than prose.
-- Run after applying, locally first:
--   npx wrangler d1 execute dc-franchise --local --file worker/verify_multishow.sql

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
```

- [ ] **Step 3: Apply the migration to the LOCAL database**

Run:
```bash
npx wrangler d1 execute dc-franchise --local --file worker/multishow_schema.sql --yes
```
Expected: every statement reports success. If the local DB is empty, the copies insert 0 rows — that is fine, the shapes are still created.

- [ ] **Step 4: Verify, and read the numbers**

Run:
```bash
npx wrangler d1 execute dc-franchise --local --file worker/verify_multishow.sql
```
Expected:
- `appearances_columns.leaked` = **0** (the TD columns are gone from the shared table)
- `players_columns.leaked` = **0** (the four career totals are derived now)
- `coexistence.n` = **2** when the local DB already has a Total Drama season 1; **1** if the local DB is empty. Either proves the key permits both — a collision would have failed the INSERT.
- `seasons.n` = `seasons.td` (everything backfilled)

- [ ] **Step 5: Re-run the migration to prove it is safe twice**

Run:
```bash
npx wrangler d1 execute dc-franchise --local --file worker/multishow_schema.sql --yes
npx wrangler d1 execute dc-franchise --local --file worker/verify_multishow.sql
```
Expected: identical counts to Step 4. If `appearances` came back empty on the second run, the copy read from the already-migrated shape incorrectly — fix before continuing.

- [ ] **Step 6: Commit**

```bash
git add worker/multishow_schema.sql worker/verify_multishow.sql
git commit -m "Two shows cannot share one numbering line"
```

---

### Task 3: The worker's read queries

**Files:**
- Modify: `worker/worker-studio.js` — the leaderboard stat whitelist (~lines 165-174), the `/api/stats` season query (~lines 235-243), the `/api/relationships` self-join (~lines 247-255).

**Interfaces:**
- Consumes: the tables from Task 2.
- Produces: no new exports; the same JSON response shapes as before.

- [ ] **Step 1: Capture the current responses as the regression baseline**

Run the worker locally and save what it returns today, BEFORE changing it:
```bash
npx wrangler dev worker/worker-studio.js --local &
sleep 5
curl -s "http://localhost:8787/api/leaderboard?stat=challenges&limit=10" > /tmp/base-challenges.json
curl -s "http://localhost:8787/api/leaderboard?stat=wins&limit=10"       > /tmp/base-wins.json
curl -s "http://localhost:8787/api/stats?player=alejandro"               > /tmp/base-stats.json
curl -s "http://localhost:8787/api/relationships?player=alejandro"       > /tmp/base-rel.json
kill %1
```
Expected: four non-empty JSON files. These are the answer the change must not alter.

- [ ] **Step 2: Point the four Total Drama leaderboard stats at `td_appearances`**

The whitelist entries for `challenges`, `immunities`, `rewards` and `idols` read columns that no longer exist on `appearances`. Change those four `expr` values to read the joined table, and add the join:

```js
  challenges:    { label: 'Challenge wins',     expr: 'SUM(COALESCE(td.challenge_wins,0))', dir: 'DESC' },
  immunities:    { label: 'Immunity wins',      expr: 'SUM(COALESCE(td.immunity_wins,0))',  dir: 'DESC' },
  rewards:       { label: 'Reward wins',        expr: 'SUM(COALESCE(td.reward_wins,0))',    dir: 'DESC' },
  idols:         { label: 'Idols found',        expr: 'SUM(COALESCE(td.idols_found,0))',    dir: 'DESC' },
```

and in the leaderboard SQL, add the LEFT JOIN so a Big Brother appearance simply contributes zero rather than dropping the player:

```js
    FROM appearances a
    JOIN players p ON p.id = a.player_id
    LEFT JOIN td_appearances td
           ON td.player_id = a.player_id AND td.season_number = a.season_number
          AND a.format = 'total-drama'
```

- [ ] **Step 3: Rejoin the player-stats query**

Replace the `/api/stats` season query so the Total Drama columns come from `td_appearances` and the season join uses both key parts:

```js
    d.prepare(`SELECT a.season_number AS season, a.format AS format, s.title AS seasonTitle,
                      a.placement, a.status,
                      td.tribe, td.challenge_wins AS challengeWins, td.immunity_wins AS immunityWins,
                      td.idols_found AS idolsFound, a.votes_received AS votesReceived,
                      a.jury_votes AS juryVotes, a.final_vote AS finalVote
               FROM appearances a
               LEFT JOIN seasons s ON s.season_number = a.season_number AND s.format = a.format
               LEFT JOIN td_appearances td ON td.player_id = a.player_id
                                          AND td.season_number = a.season_number
                                          AND a.format = 'total-drama'
               WHERE a.player_id = ?
               ORDER BY a.format, a.season_number`).bind(slug),
```

- [ ] **Step 4: Make the relationships self-join format-aware**

Two people share a season only if they share a FORMAT and a number. Without this, Total Drama season 1 and Big Brother season 1 would report everybody as castmates:

```js
    d.prepare(`SELECT p.id, p.name, p.tier,
                      COUNT(*) AS sharedSeasons,
                      GROUP_CONCAT(them.season_number) AS seasons
               FROM appearances me
               JOIN appearances them ON them.season_number = me.season_number
                                    AND them.format = me.format
                                    AND them.player_id <> me.player_id
               JOIN players p ON p.id = them.player_id
               WHERE me.player_id = ?
               GROUP BY p.id, p.name, p.tier
               ORDER BY sharedSeasons DESC, p.name ASC
```

- [ ] **Step 5: Re-run the four requests and diff against the baseline**

```bash
npx wrangler dev worker/worker-studio.js --local &
sleep 5
curl -s "http://localhost:8787/api/leaderboard?stat=challenges&limit=10" > /tmp/new-challenges.json
curl -s "http://localhost:8787/api/leaderboard?stat=wins&limit=10"       > /tmp/new-wins.json
curl -s "http://localhost:8787/api/stats?player=alejandro"               > /tmp/new-stats.json
curl -s "http://localhost:8787/api/relationships?player=alejandro"       > /tmp/new-rel.json
kill %1
diff /tmp/base-challenges.json /tmp/new-challenges.json && echo "challenges OK"
diff /tmp/base-wins.json       /tmp/new-wins.json       && echo "wins OK"
diff /tmp/base-rel.json        /tmp/new-rel.json        && echo "relationships OK"
```
Expected: `challenges OK`, `wins OK`, `relationships OK`. The stats response is ALLOWED to differ by exactly one thing — a new `format` field on each season row — so inspect that diff by eye rather than requiring it to be empty.

- [ ] **Step 6: Commit**

```bash
git add worker/worker-studio.js
git commit -m "The queries follow the Total Drama columns into their own table"
```

---

### Task 4: The worker's write path

**Files:**
- Modify: `worker/worker-studio.js` — the `/api/sync-seasons` writer (~lines 598-700) and its DELETE statements (~lines 709-711).

**Interfaces:**
- Consumes: `players_database.json` shape from Task 5 (`format`, `seasonId`, `byShow` on players; `format` on `seasonDetails[]`).
- Produces: rows in `appearances` (with format), `td_appearances`, `bb_appearances`, `bonds` (with format).

- [ ] **Step 1: Split the appearance insert into core and Total Drama halves**

Replace the single `INSERT INTO appearances` with the shared insert plus a `td_appearances` insert, mirroring how `bb_appearances` is already written. `det.format` falls back to `total-drama` because every existing season detail predates formats:

```js
      const fmt = det.format === 'big-brother' ? 'big-brother' : 'total-drama';
      stmts.push(d.prepare(
        `INSERT INTO appearances (player_id,format,season_number,placement,status,
          votes_received,jury_votes,final_vote) VALUES (?,?,?,?,?,?,?,?)`
      ).bind(p.id, fmt, sn, asInt(det.placement), det.status || null,
        asInt(det.votesReceived), asInt(det.juryVotes), det.finalVote || null));

      // The Total Drama half, in its own table. Driven off the FORMAT, so a
      // Big Brother season never writes a tribe.
      if (fmt === 'total-drama') {
        stmts.push(d.prepare(
          `INSERT INTO td_appearances (player_id,season_number,tribe,challenge_wins,
            immunity_wins,reward_wins,idols_found,strategic_rank) VALUES (?,?,?,?,?,?,?,?)`
        ).bind(p.id, sn, det.tribe || null, asInt(det.challengeWins), asInt(det.immunityWins),
          asInt(det.rewardWins), asInt(det.idolsFound), asInt(det.strategicRank)));
      }
```

- [ ] **Step 2: Carry the format into bonds**

```js
        stmts.push(d.prepare('INSERT INTO bonds (player_id,ally_id,format,season_number) VALUES (?,?,?,?)')
          .bind(p.id, allySlug, fmt, sn));
```

Also change the dedupe key so the same pair can be allies in two different shows' season 1:

```js
        const bkey = `${p.id}|${allySlug}|${fmt}|${sn}`;
```

- [ ] **Step 3: Stop writing the derived career totals**

The four Total Drama career totals are derived from `td_appearances` now. Drop them from the `players` insert:

```js
    stmts.push(d.prepare(
      `INSERT INTO players (id,name,total_seasons,best_placement,wins,
        total_votes_against,total_jury_votes,tier,avg_placement) VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(p.id, p.name || p.id, asInt(p.totalSeasons), asInt(p.bestPlacement), asInt(p.wins),
      asInt(p.totalVotesAgainst), asInt(p.totalJuryVotes), p.tier || null, asNum(p.avgPlacement)));
```

- [ ] **Step 4: Clear the new table on re-sync**

Add `td_appearances` next to the existing DELETEs so a re-sync does not double-count:

```js
    d.prepare('DELETE FROM td_appearances'),
```

- [ ] **Step 5: Sync into the local database and count**

```bash
npx wrangler dev worker/worker-studio.js --local &
sleep 5
curl -s -X POST "http://localhost:8787/api/sync-seasons" -H 'content-type: application/json' \
  --data-binary @players_database.json > /tmp/sync.json
kill %1
cat /tmp/sync.json
npx wrangler d1 execute dc-franchise --local --file worker/verify_multishow.sql
```
Expected: the sync response reports non-zero `appearances` and `bonds`; `td_appearances.n` in the verification matches the appearance count for Total Drama, and `challenge_wins` is non-zero.

- [ ] **Step 6: Commit**

```bash
git add worker/worker-studio.js
git commit -m "The sync writes a season into the show it belongs to"
```

---

### Task 5: The JSON databases and their generator

**Files:**
- Modify: `js/stats-export.js`
- Test: `tests/multishow-json.test.js`

**Interfaces:**
- Consumes: `seasonId`, `parseSeasonRef` from `js/shows.js` (Task 1).
- Produces: `seasons_database.seasons[]` with `format` + `seasonId`; `players_database.players[]` with `byShow` and `seasonDetails[].format`; `franchise_database.champions[].format`.

- [ ] **Step 1: Write the failing test against the shipped data files**

```js
// tests/multishow-json.test.js
// The JSON databases are what most of the site reads — six pages read
// players_database alone. A format that exists only in D1 is a format the site
// cannot see.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSeasonRef } from '../js/shows.js';

const load = f => JSON.parse(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'));

describe('seasons_database', () => {
  it('says which show every season belongs to', () => {
    const { seasons } = load('seasons_database.json');
    expect(seasons.length).toBeGreaterThan(0);
    for (const s of seasons) {
      expect(s.format, `season ${s.seasonNumber} has no format`).toBeTruthy();
      expect(parseSeasonRef(s.seasonId)).toEqual({ format: s.format, number: s.seasonNumber });
    }
  });
});

describe('players_database', () => {
  it('tags every season detail with its show', () => {
    const { players } = load('players_database.json');
    for (const p of players) {
      for (const det of p.seasonDetails || []) {
        expect(det.format, `${p.id} season ${det.season} has no format`).toBeTruthy();
      }
    }
  });

  it('splits career totals per show and keeps the universal ones on top', () => {
    const { players } = load('players_database.json');
    const withSeasons = players.filter(p => (p.seasonDetails || []).length);
    expect(withSeasons.length).toBeGreaterThan(0);
    for (const p of withSeasons) {
      expect(p.byShow, `${p.id} has no byShow`).toBeTruthy();
      // Universal facts stay top-level.
      expect(typeof p.totalSeasons).toBe('number');
      expect(typeof p.wins).toBe('number');
      // Per-show totals live under their show.
      const td = p.byShow['total-drama'];
      if (td) expect(typeof td.totalChallengeWins).toBe('number');
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node node_modules/vitest/vitest.mjs run tests/multishow-json.test.js`
Expected: FAIL — `season 1 has no format`.

- [ ] **Step 3: Emit the new fields from the generator**

In `js/stats-export.js`, import the registry and stamp every season and season detail. Read the format from the season being exported (`gs`/season data carries `format: 'big-brother'` for a house season; anything else is Total Drama):

```js
import { seasonId, DEFAULT_FORMAT } from './shows.js';

// ...where a season record is built:
const format = seasonFormat === 'big-brother' ? 'big-brother' : DEFAULT_FORMAT;
seasonRecord.format = format;
seasonRecord.seasonId = seasonId(format, seasonRecord.seasonNumber);

// ...where a player's season detail is built:
detail.format = format;
detail.seasonId = seasonId(format, detail.season);
```

And build `byShow` when assembling a player, keeping the universal totals where they are:

```js
// Per-show career totals. The universal ones (totalSeasons, wins,
// bestPlacement, avgPlacement, tier) stay top-level because they mean the same
// thing in every format; challenge wins and idols do not.
player.byShow = {};
for (const det of player.seasonDetails) {
  const bucket = (player.byShow[det.format] ||= { seasons: 0 });
  bucket.seasons++;
  if (det.format === 'total-drama') {
    bucket.totalChallengeWins = (bucket.totalChallengeWins || 0) + (det.challengeWins || 0);
    bucket.totalImmunityWins  = (bucket.totalImmunityWins  || 0) + (det.immunityWins  || 0);
    bucket.totalRewardWins    = (bucket.totalRewardWins    || 0) + (det.rewardWins    || 0);
    bucket.totalIdolsFound    = (bucket.totalIdolsFound    || 0) + (det.idolsFound    || 0);
  } else if (det.format === 'big-brother' && det.bb) {
    bucket.hohWins        = (bucket.hohWins        || 0) + (det.bb.hohWins        || 0);
    bucket.vetoWins       = (bucket.vetoWins       || 0) + (det.bb.vetoWins       || 0);
    bucket.timesNominated = (bucket.timesNominated || 0) + (det.bb.timesNominated || 0);
  }
}
```

- [ ] **Step 4: Backfill the four shipped JSON files**

These are build outputs, but the historical ones cannot be regenerated from a simulator run — write a one-shot script that stamps the existing files:

```js
// tools/backfill_formats.mjs — run once: node tools/backfill_formats.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { seasonId, DEFAULT_FORMAT } from '../js/shows.js';

const edit = (file, fn) => {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  fn(data);
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log('stamped', file);
};

edit('seasons_database.json', d => {
  for (const s of d.seasons) {
    s.format ||= DEFAULT_FORMAT;
    s.seasonId ||= seasonId(s.format, s.seasonNumber);
  }
});

edit('players_database.json', d => {
  for (const p of d.players) {
    for (const det of p.seasonDetails || []) {
      det.format ||= DEFAULT_FORMAT;
      det.seasonId ||= seasonId(det.format, det.season);
    }
    p.byShow ||= {};
    const td = (p.byShow[DEFAULT_FORMAT] ||= { seasons: 0 });
    td.seasons = (p.seasonDetails || []).filter(x => x.format === DEFAULT_FORMAT).length;
    td.totalChallengeWins = p.totalChallengeWins || 0;
    td.totalImmunityWins  = p.totalImmunityWins  || 0;
    td.totalRewardWins    = p.totalRewardWins    || 0;
    td.totalIdolsFound    = p.totalIdolsFound    || 0;
  }
});

edit('franchise_database.json', d => {
  for (const c of d.champions || []) c.format ||= DEFAULT_FORMAT;
});
```

Run: `node tools/backfill_formats.mjs`
Expected: three "stamped" lines.

- [ ] **Step 5: Run the test and watch it pass**

Run: `node node_modules/vitest/vitest.mjs run tests/multishow-json.test.js`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add js/stats-export.js tools/backfill_formats.mjs tests/multishow-json.test.js \
        seasons_database.json players_database.json franchise_database.json
git commit -m "The JSON databases learn which show a season came from"
```

---

### Task 6: The validators start requiring a format

**Files:**
- Modify: `tools/validate_schemas.py`

**Interfaces:**
- Consumes: the JSON shape from Task 5.
- Produces: a non-zero exit when a season or season detail has no format.

- [ ] **Step 1: Add the format rules to the schemas**

In the season schema, require `format` and constrain it; in the player season-detail schema, the same:

```python
SEASON_SCHEMA["properties"]["format"] = {"enum": ["total-drama", "big-brother"]}
SEASON_SCHEMA["properties"]["seasonId"] = {"type": "string", "pattern": "^[a-z]+-[0-9]+$"}
SEASON_SCHEMA.setdefault("required", []).append("format")
```

- [ ] **Step 2: Run the validator against the backfilled files**

Run: `python tools/validate_schemas.py`
Expected: passes. If it fails naming a season with no format, Task 5's backfill missed a file — fix there, not here.

- [ ] **Step 3: Prove the validator actually catches a missing format**

A validator that passes a broken file is worse than none, so break one on purpose and put it back:

```bash
cp seasons_database.json seasons_database.json.bak
python - <<'PY'
import json
d = json.load(open('seasons_database.json', encoding='utf-8'))
del d['seasons'][0]['format']
json.dump(d, open('seasons_database.json', 'w'), indent=2)
print('removed the format from season', d['seasons'][0]['seasonNumber'])
PY
python tools/validate_schemas.py; echo "exit=$?"
mv seasons_database.json.bak seasons_database.json
python tools/validate_schemas.py; echo "restored exit=$?"
```
Expected: the first run FAILS (`exit=1`) naming that season; the restored run passes (`exit=0`). If the first run passes, the schema change in Step 1 did not take — fix it before continuing.

- [ ] **Step 4: Commit**

```bash
git add tools/validate_schemas.py
git commit -m "A season with no show is now a validation failure"
```

---

### Task 7: The regression gate

**Files:**
- Create: `tests/multishow-regression.test.js`

**Interfaces:**
- Consumes: everything above.
- Produces: the guard that this whole plan changed nothing visible.

- [ ] **Step 1: Write the regression test**

```js
// tests/multishow-regression.test.js
// The promise of sub-project A is that NOTHING looks different. These are the
// properties that would be silently broken by a bad migration and not noticed
// until a page rendered wrong weeks later.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSeasonRef, seasonId } from '../js/shows.js';

const load = f => JSON.parse(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'));

describe('nothing about Total Drama changed', () => {
  it('still has fourteen seasons, all Total Drama', () => {
    const { seasons } = load('seasons_database.json');
    const td = seasons.filter(s => s.format === 'total-drama');
    expect(td.length).toBe(seasons.length);
    expect(td.length).toBeGreaterThanOrEqual(14);
  });

  it('kept every player and every appearance', () => {
    const { players } = load('players_database.json');
    expect(players.length).toBeGreaterThanOrEqual(152);
    const appearances = players.reduce((n, p) => n + (p.seasonDetails || []).length, 0);
    expect(appearances).toBeGreaterThanOrEqual(262);
  });

  it('did not lose a single challenge win in the move to byShow', () => {
    const { players } = load('players_database.json');
    for (const p of players) {
      const fromDetails = (p.seasonDetails || [])
        .filter(d => d.format === 'total-drama')
        .reduce((n, d) => n + (d.challengeWins || 0), 0);
      const fromByShow = p.byShow?.['total-drama']?.totalChallengeWins || 0;
      expect(fromByShow, `${p.id} lost challenge wins`).toBe(fromDetails);
    }
  });

  it('resolves every old-style season link', () => {
    const { seasons } = load('seasons_database.json');
    for (const s of seasons.filter(x => x.format === 'total-drama')) {
      expect(parseSeasonRef(String(s.seasonNumber)))
        .toEqual({ format: 'total-drama', number: s.seasonNumber });
    }
  });

  it('lets two shows hold the same season number', () => {
    expect(seasonId('total-drama', 1)).not.toBe(seasonId('big-brother', 1));
    expect(parseSeasonRef('td-1')).not.toEqual(parseSeasonRef('bb-1'));
  });
});
```

- [ ] **Step 2: Run it**

Run: `node node_modules/vitest/vitest.mjs run tests/multishow-regression.test.js`
Expected: PASS, 5 tests. A failure in "did not lose a single challenge win" means the Task 5 backfill summed the wrong field — fix there.

- [ ] **Step 3: Run every test touched by this plan**

Run:
```bash
node node_modules/vitest/vitest.mjs run tests/shows.test.js tests/multishow-json.test.js tests/multishow-regression.test.js
```
Expected: 14 tests passing across 3 files.

- [ ] **Step 4: Open the site and click through it**

```bash
python serve.py 4173
```
Visit and confirm each renders as before: `seasons.html`, `rankings.html`, `player.html?player=alejandro`, `leaderboards.html`, `timeline.html`, `franchise.html`, and an old-style link `season_ref.html?season=7`.
Expected: no blank panels, no console errors, the same numbers as before the migration.

- [ ] **Step 5: Commit**

```bash
git add tests/multishow-regression.test.js
git commit -m "The guard that says Total Drama did not notice any of this"
```

---

### Task 8: Apply to production

**Files:** none — this is an operational task.

> **Every `wrangler` command below carries `--config worker/wrangler.toml`.** The D1
> binding lives in `worker/wrangler.toml`, not at the repo root. Without the flag every
> command fails with `Couldn't find a D1 DB with the name or binding 'dc-franchise'`.
> Run them from the repo root with the flag, not by `cd`-ing into `worker/`.

- [ ] **Step 1: Ask before touching the live database**

The remote D1 holds the real franchise. Confirm with the user before running anything with `--remote`, and confirm the local run in Task 2 succeeded twice.

- [ ] **Step 2: Take a backup — before anything else**

The migration **drops and recreates five tables** holding the real franchise
(`appearances`, `bonds`, `seasons`, `live_season`, `players`), and D1 executes a
`--file` **statement by statement over HTTP, not in one transaction**. A failure
partway through leaves the database half-migrated with no rollback. `DROP TABLE
players` is irreversible for the four career-total columns this migration removes —
they exist nowhere else once the statement lands.

Do both of these. They fail differently, so having both matters.

```bash
# a) Full logical export to a file you keep until the site is verified good.
npx wrangler d1 export dc-franchise --config worker/wrangler.toml --remote \
  --output backups/dc-franchise-pre-multishow-$(date +%Y%m%d-%H%M).sql

# b) Record a Time Travel bookmark — the point-in-time you can rewind to.
npx wrangler d1 time-travel info dc-franchise --config worker/wrangler.toml
# Write the returned bookmark down here before continuing: ____________________
```

Restore, if it goes wrong:

```bash
# Preferred: rewind the whole database to the bookmark from (b).
npx wrangler d1 time-travel restore dc-franchise --config worker/wrangler.toml \
  --bookmark <BOOKMARK-FROM-STEP-2b>

# Fallback, if Time Travel is unavailable or the window has passed: replay the export.
npx wrangler d1 execute dc-franchise --config worker/wrangler.toml --remote \
  --file backups/dc-franchise-pre-multishow-<STAMP>.sql --yes
```

Expected: the export file is non-empty and contains `CREATE TABLE appearances`, and
you have a bookmark string written down.

- [ ] **Step 3: Do it in this order — the ordering is the whole risk**

Applying the migration while the OLD worker is still deployed breaks
`/api/leaderboard`, `/api/relationships` and `/api/sync-seasons` **immediately** —
the old queries reference `appearances.challenge_wins` and a bare
`seasons.season_number`, both of which stop existing the moment the migration lands.
The live site starts erroring before you get to the sync.

The order, and why each step must precede the next:

1. **Push the backfilled JSON to `main`.**
   `/api/sync-seasons` fetches `players_database.json` **from GitHub** — it takes no
   request body (see Step 5). If the format-tagged JSON is not on the branch GitHub
   Pages serves before the sync runs, the sync re-imports the *old* untagged data.
2. **Deploy the new worker.**
   `npx wrangler deploy --config worker/wrangler.toml`
   The new worker's queries read `td_appearances` and `(format, season_number)`.
   Deployed *before* the migration, it is broken for the few minutes until step 3 —
   which is the shorter and more recoverable outage of the two orderings, because
   the alternative (old worker against new schema) breaks and *stays* broken until
   you deploy anyway.
3. **Apply the migration** (Step 4 below). Now the schema matches the deployed worker.
4. **Run the sync** (Step 5 below) — it repopulates `td_appearances`, which the
   migration creates empty of the per-season stat columns beyond the frozen snapshot.
   Nothing before this step can run it, because the sync endpoint itself needs the
   new schema.
5. **Verify** (Step 6 below).

Do not interleave. If you must pause, pause *between* numbered steps, not inside one.

- [ ] **Step 4: Apply the migration remotely**

```bash
npx wrangler d1 execute dc-franchise --config worker/wrangler.toml --remote \
  --file worker/multishow_schema.sql --yes
npx wrangler d1 execute dc-franchise --config worker/wrangler.toml --remote \
  --file worker/verify_multishow.sql
```
Expected: the same counts as local — `appearances_columns.leaked` = 0, seasons all `total-drama`.

Read the re-run caveats in the header of `worker/multishow_schema.sql` first. They
are not decorative — they describe three ways a *second* application of the file
relabels or resurrects rows.

- [ ] **Step 5: Re-sync the data**

```bash
curl -X POST https://<worker-host>/api/sync-seasons -H "X-Studio-Token: <STUDIO_TOKEN>"
```

**`/api/sync-seasons` takes NO request body.** It fetches `players_database.json`
from GitHub itself, using `GITHUB_REPO`/`GITHUB_BRANCH` from `worker/wrangler.toml`.
An earlier draft of this plan suggested
`curl --data-binary @players_database.json` — **that does not work**; the body is
ignored entirely. This is why step 1 of the ordering above (push the JSON) has to
happen before the sync, not alongside it.

Then re-run the verification from Step 4.
Expected: `td_appearances` populated, `challenge_wins` non-zero, `skipped` = 0.

- [ ] **Step 6: Check the deployed site**

Load `leaderboards.html` and `player.html` on the live site and confirm the numbers match what the local run produced.
Expected: identical leaderboards to before the migration.

Only after this passes should the backup from Step 2 be considered no longer needed.

---

## Notes for whoever executes this

- **Tasks 1 and 2 are independent.** Everything else depends on both.
- **Task 2 is the dangerous one.** It drops and recreates four tables. Run it locally, twice, and read the verification output before going anywhere near `--remote`.
- **The JSON files are build outputs everywhere except Task 5 Step 4**, which is a deliberate one-shot backfill of history that no simulator run can regenerate.
- **If a test fails, do not adjust the test to match the code.** Every assertion here encodes a decision from the spec.
