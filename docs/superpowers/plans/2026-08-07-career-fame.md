# Career Fame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compute a 0–5 star career fame rating for every player across every show, derived from published data, and show it on the player page.

**Architecture:** One pure module, `js/fame.js`, walks the franchise's seasons in chronological order once per player — accruing fame for seasons they played, decaying for seasons they missed, and locking permanently at five stars. Nothing is stored: fame is recomputed from the published JSON databases on demand. A separate `js/fame-stars.js` renders the stars, keeping `js/fame.js` free of the DOM so the simulator can import it later.

**Tech Stack:** ES modules, no build step. Vitest for tests. Plain JSON databases fetched at runtime.

**Spec:** `docs/superpowers/specs/2026-08-07-career-fame-design.md`

## Global Constraints

Copied verbatim from the spec. Every task's requirements implicitly include these.

- **Stars are 0 to 5 in 0.5 steps.** No "unrated" state — everyone who has played has a number.
- **Score→star thresholds:** 0.5≥5, 1≥12, 1.5≥20, 2≥30, 2.5≥40, 3≥52, 3.5≥64, 4≥76, 4.5≥86, 5≥95. Below 5 is 0 stars.
- **placementBase:** Winner 22, Runner-up 16, Finalist 13, Jury 8, Pre-jury 3.
- **popularityFactor:** 0.5 to 1.5, by **rank** within that season's cast (most popular 1.5, least 0.5, linear by rank position). Never by raw value.
- **showRankMultiplier:** S+ 1.5, S 1.35, A 1.2, B 1.05, C 0.9, D 0.75.
- **seasonAwards:** `fanFavorite` +10, `bestStrategic` +4, `mostChallengeWins` +4, capped +12.
- **Multi-show bonus:** +8 at the first season of a second show, +8 again for a third, capped +16.
- **Records:** +6 per franchise record held, capped +12, applied at the player's last appearance.
- **Decay:** −1.2 per season missed, floored at 0.
- **Gates:** five stars requires 2+ seasons played. Reaching five locks permanently — no decay afterwards, ever.
- **Derived, never stored.** No `fame` field is written to any JSON file, ever.
- **`js/fame.js` imports no DOM and nothing from the simulator.** No side effects.
- **Fallbacks are 1.0** — missing popularity and unranked shows both use a neutral 1.0 multiplier, never 0.
- Run a single test file with `node node_modules/vitest/vitest.mjs run tests/<file>`. Do **not** run the whole suite; it exhausts memory.
- Commit messages in this repo are prose sentences, not `feat:`/`fix:` prefixes.

## Spec corrections adopted here

1. **`computeFame` takes four databases, not three.** The spec's signature omits `franchise_database.json`, which is where the 29 record holders live. This plan uses a single options object:
   `computeFame({ players, rankings, seasons, franchise })`.
2. **`franchise` is optional.** When absent, the records bonus is 0 rather than an error, so the module works from three files.

## File Structure

| File | Responsibility |
|---|---|
| `js/fame.js` (create) | The whole model: chronology, walk, accrual, decay, gates, lock. Pure. |
| `js/fame-stars.js` (create) | Renders a `FameResult` as HTML. Owns all markup and CSS for stars. |
| `js/stats-export.js` (modify) | Writes per-player season popularity into season details, both show paths. |
| `rankings_database.json` (modify) | Gains `metadata.format: "total-drama"`. |
| `player.html` (modify) | Displays the star rating. |
| `tests/fame.test.js` (create) | Unit tests: mapping, chronology, accrual, decay, gates, lock, fallbacks. |
| `tests/fame-calibration.test.js` (create) | Distribution assertions over the real 152-player roster. |
| `tests/fame-popularity-export.test.js` (create) | Popularity reaches the published season details. |

### Data shapes the implementer will read

```js
// players_database.json
{ players: [ { id: 'alejandro', name: 'Alejandro',
    seasonDetails: [ { season: 4, format: 'total-drama', seasonId: 'td-4',
                       placement: 1, status: 'Winner', popularity: 12.5 /* may be absent */ } ] } ] }

// rankings_database.json  — metadata.format is added by Task 2
{ metadata: { format: 'total-drama' },
  rankings: [ { playerId: 'alejandro', tier: 'S+', score: 100 } ] }

// seasons_database.json
{ seasons: [ { seasonNumber: 4, format: 'total-drama', seasonId: 'td-4',
               awards: { fanFavorite: { playerSlug: 'justin' },
                         bestStrategic: { playerSlug: 'alejandro' },
                         mostChallengeWins: { playerSlug: 'bridgette' } } } ] }

// franchise_database.json — records nest 2-3 levels deep; every holder has playerSlug
{ records: { challengeRecords: { overall: { mostChallengeWins: { playerSlug: 'alejandro' } } } } }
```

---

### Task 1: Score-to-stars mapping

**Files:**
- Create: `js/fame.js`
- Test: `tests/fame.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `starsFromScore(score) → number` (0–5 in 0.5 steps), and the `STAR_THRESHOLDS` constant.

- [ ] **Step 1: Write the failing test**

```js
// tests/fame.test.js
import { describe, expect, it } from 'vitest';
import { starsFromScore } from '../js/fame.js';

describe('turning a score into stars', () => {
  it('places every threshold on its own step', () => {
    expect(starsFromScore(0)).toBe(0);
    expect(starsFromScore(4.9)).toBe(0);
    expect(starsFromScore(5)).toBe(0.5);
    expect(starsFromScore(12)).toBe(1);
    expect(starsFromScore(30)).toBe(2);
    expect(starsFromScore(52)).toBe(3);
    expect(starsFromScore(76)).toBe(4);
    expect(starsFromScore(86)).toBe(4.5);
    expect(starsFromScore(95)).toBe(5);
    expect(starsFromScore(1000)).toBe(5);
  });

  it('never returns a value between the steps', () => {
    for (let s = 0; s <= 120; s += 0.5) {
      const stars = starsFromScore(s);
      expect(stars * 2, `score ${s} produced ${stars}`).toBe(Math.round(stars * 2));
      expect(stars).toBeLessThanOrEqual(5);
      expect(stars).toBeGreaterThanOrEqual(0);
    }
  });

  it('never goes down as the score goes up', () => {
    let prev = 0;
    for (let s = 0; s <= 120; s += 0.25) {
      const stars = starsFromScore(s);
      expect(stars).toBeGreaterThanOrEqual(prev);
      prev = stars;
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run tests/fame.test.js`
Expected: FAIL — cannot resolve `../js/fame.js`.

- [ ] **Step 3: Write the implementation**

```js
// js/fame.js
// Career fame: how big a deal a player is across the whole franchise.
//
// Derived, never stored. Fame decays while a player is off air, which makes it
// a function of WHEN you ask rather than of the player's own record — publishing
// a new season changes the fame of somebody who last played six seasons ago,
// without them doing anything. A stored field would have to be rewritten for
// every player on every export, and the first path that forgot would leave the
// file disagreeing with reality in silence. See multishow-followups.md section 4
// for the nine career totals that already drifted exactly that way.

/** Score at which each half-star is reached. Ascending; below the first is 0. */
export const STAR_THRESHOLDS = [
  [5, 0.5], [12, 1], [20, 1.5], [30, 2], [40, 2.5],
  [52, 3], [64, 3.5], [76, 4], [86, 4.5], [95, 5],
];

/** Stars for a raw score. Thresholds, not division — the gates have to bite. */
export function starsFromScore(score) {
  let stars = 0;
  for (const [at, value] of STAR_THRESHOLDS) {
    if (score >= at) stars = value;
  }
  return stars;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node node_modules/vitest/vitest.mjs run tests/fame.test.js`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add js/fame.js tests/fame.test.js
git commit -m "Stars are thresholds, not a division"
```

---

### Task 2: Per-show ranking lookup

**Files:**
- Modify: `js/fame.js`
- Modify: `rankings_database.json` (add `metadata.format`)
- Test: `tests/fame.test.js`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `showRankMultiplier(playerId, format, rankings) → number`, and `RANK_MULTIPLIER`.

`rankings` is either one rankings database object or an array of them (one board per show). A board's show is `metadata.format`, defaulting to `'total-drama'` for the existing untagged board.

- [ ] **Step 1: Write the failing test**

```js
// append to tests/fame.test.js
import { showRankMultiplier } from '../js/fame.js';

const TD_BOARD = { metadata: { format: 'total-drama' }, rankings: [
  { playerId: 'alejandro', tier: 'S+' }, { playerId: 'bridgette', tier: 'B' },
]};
const BB_BOARD = { metadata: { format: 'big-brother' }, rankings: [
  { playerId: 'alejandro', tier: 'D' }, { playerId: 'hicks', tier: 'S' },
]};

describe('per-show rankings', () => {
  it('reads the board belonging to that show', () => {
    expect(showRankMultiplier('alejandro', 'total-drama', [TD_BOARD, BB_BOARD])).toBe(1.5);
    // Same player, different show, different standing.
    expect(showRankMultiplier('alejandro', 'big-brother', [TD_BOARD, BB_BOARD])).toBe(0.75);
    expect(showRankMultiplier('hicks', 'big-brother', [TD_BOARD, BB_BOARD])).toBe(1.35);
  });

  it('treats an untagged board as Total Drama, which is what the live file is', () => {
    const untagged = { rankings: [{ playerId: 'alejandro', tier: 'S+' }] };
    expect(showRankMultiplier('alejandro', 'total-drama', untagged)).toBe(1.5);
  });

  it('falls back to neutral rather than zero', () => {
    // A show with no board at all — Big Brother, today.
    expect(showRankMultiplier('hicks', 'big-brother', TD_BOARD)).toBe(1);
    // On the board but unranked, or a tier nobody recognises.
    expect(showRankMultiplier('nobody', 'total-drama', TD_BOARD)).toBe(1);
    expect(showRankMultiplier('x', 'total-drama',
      { metadata: { format: 'total-drama' }, rankings: [{ playerId: 'x', tier: 'Unranked' }] })).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run tests/fame.test.js`
Expected: FAIL — `showRankMultiplier is not a function`.

- [ ] **Step 3: Write the implementation**

```js
// js/fame.js — append

/** What each tier is worth. Anything not listed is neutral, never zero. */
export const RANK_MULTIPLIER = {
  'S+': 1.5, 'S': 1.35, 'A': 1.2, 'B': 1.05, 'C': 0.9, 'D': 0.75,
};

/**
 * How well regarded this player is ON THIS SHOW.
 *
 * Falls back to 1.0 — neutral — when the show has no board yet or the player
 * is not on it. Zero would silently erase a whole show's careers, and Big
 * Brother has no board at the time of writing.
 */
export function showRankMultiplier(playerId, format, rankings) {
  const boards = Array.isArray(rankings) ? rankings : [rankings];
  for (const board of boards) {
    if (!board) continue;
    // The live board predates the second show and carries no format tag.
    const boardFormat = board.metadata?.format || 'total-drama';
    if (boardFormat !== format) continue;
    const row = (board.rankings || []).find(r => r.playerId === playerId);
    if (row) return RANK_MULTIPLIER[row.tier] ?? 1;
  }
  return 1;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node node_modules/vitest/vitest.mjs run tests/fame.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Tag the live rankings board**

Edit `rankings_database.json` — add `"format": "total-drama"` inside `metadata`, as the first key:

```json
  "metadata": {
    "format": "total-drama",
    "name": "🏆 Total Drama Franchise Rankings - Complete Cast",
```

Leave every other key untouched. Verify the file still parses:

```bash
node -e "const r=require('./rankings_database.json');console.log(r.metadata.format, r.rankings.length)"
```
Expected: `total-drama 152`

- [ ] **Step 6: Commit**

```bash
git add js/fame.js tests/fame.test.js rankings_database.json
git commit -m "A ranking belongs to a show, and an unranked show is neutral not zero"
```

---

### Task 3: Season chronology

**Files:**
- Modify: `js/fame.js`
- Test: `tests/fame.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `seasonChronology(seasons) → [{ seasonId, format, seasonNumber, awards }]` in franchise order.

- [ ] **Step 1: Write the failing test**

```js
// append to tests/fame.test.js
import { seasonChronology } from '../js/fame.js';

describe('ordering two shows into one franchise history', () => {
  it('keeps the order the seasons database lists them in', () => {
    const db = { seasons: [
      { seasonNumber: 2, format: 'total-drama', seasonId: 'td-2' },
      { seasonNumber: 1, format: 'big-brother', seasonId: 'bb-1' },
      { seasonNumber: 3, format: 'total-drama', seasonId: 'td-3' },
    ]};
    expect(seasonChronology(db).map(s => s.seasonId)).toEqual(['td-2', 'bb-1', 'td-3']);
  });

  it('synthesises a seasonId for a record written before they existed', () => {
    const db = { seasons: [{ seasonNumber: 1 }] };   // no format, no seasonId
    expect(seasonChronology(db)).toEqual([
      expect.objectContaining({ seasonId: 'td-1', format: 'total-drama', seasonNumber: 1 }),
    ]);
  });

  it('survives an empty or missing database', () => {
    expect(seasonChronology({ seasons: [] })).toEqual([]);
    expect(seasonChronology(null)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run tests/fame.test.js`
Expected: FAIL — `seasonChronology is not a function`.

- [ ] **Step 3: Write the implementation**

```js
// js/fame.js — append

const PREFIX = { 'total-drama': 'td', 'big-brother': 'bb' };

/**
 * Every season the franchise has produced, in the order it produced them.
 *
 * The order is the order seasons_database.json lists them, which is publication
 * order. Two shows airing at once is out of scope — that would need a real date
 * field on the season record, and nothing writes one.
 */
export function seasonChronology(seasonsDb) {
  return (seasonsDb?.seasons || []).map(s => {
    const format = s.format || 'total-drama';
    return {
      seasonId: s.seasonId || `${PREFIX[format] || format}-${s.seasonNumber}`,
      format,
      seasonNumber: s.seasonNumber,
      awards: s.awards || {},
    };
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node node_modules/vitest/vitest.mjs run tests/fame.test.js`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add js/fame.js tests/fame.test.js
git commit -m "Two shows, one franchise history"
```

---

### Task 4: What one season is worth

**Files:**
- Modify: `js/fame.js`
- Test: `tests/fame.test.js`

**Interfaces:**
- Consumes: `showRankMultiplier` (Task 2).
- Produces: `PLACEMENT_BASE`, `popularityFactor(playerId, detail, cohort) → number`, `seasonAwardPoints(playerId, season) → number`, `seasonGain({ playerId, detail, season, cohort, rankings }) → number`.

`cohort` is the array of every season detail belonging to that same season, across all players — needed to rank popularity within the season.

- [ ] **Step 1: Write the failing test**

```js
// append to tests/fame.test.js
import { popularityFactor, seasonAwardPoints, seasonGain, PLACEMENT_BASE } from '../js/fame.js';

describe('what a single season is worth', () => {
  const cohort = [
    { playerId: 'a', popularity: 40 },
    { playerId: 'b', popularity: 20 },
    { playerId: 'c', popularity: 0 },
  ];

  it('spaces popularity by rank, not by raw value', () => {
    expect(popularityFactor('a', cohort)).toBeCloseTo(1.5, 5);
    expect(popularityFactor('b', cohort)).toBeCloseTo(1.0, 5);
    expect(popularityFactor('c', cohort)).toBeCloseTo(0.5, 5);
    // Raw values are unbounded and vary in scale between seasons, so a huge
    // outlier must not compress everybody else.
    const skewed = [
      { playerId: 'a', popularity: 9999 },
      { playerId: 'b', popularity: 2 },
      { playerId: 'c', popularity: 1 },
    ];
    expect(popularityFactor('b', skewed)).toBeCloseTo(1.0, 5);
  });

  it('is neutral when nobody in the season recorded popularity', () => {
    const blank = [{ playerId: 'a' }, { playerId: 'b' }];
    expect(popularityFactor('a', blank)).toBe(1);
    expect(popularityFactor('a', [{ playerId: 'a', popularity: 5 }])).toBe(1); // cast of one
  });

  it('counts the three awards the seasons database stores', () => {
    const season = { awards: {
      fanFavorite: { playerSlug: 'a' },
      bestStrategic: { playerSlug: 'b' },
      mostChallengeWins: { playerSlug: 'a' },
    }};
    expect(seasonAwardPoints('a', season)).toBe(14);   // 10 + 4
    expect(seasonAwardPoints('b', season)).toBe(4);
    expect(seasonAwardPoints('c', season)).toBe(0);
    expect(seasonAwardPoints('a', { awards: {} })).toBe(0);
  });

  it('multiplies placement by reception, then by standing on that show', () => {
    const season = { format: 'total-drama', awards: {} };
    const rankings = { metadata: { format: 'total-drama' },
      rankings: [{ playerId: 'a', tier: 'S+' }] };
    // Winner 22 x 1.5 popularity x 1.5 rank
    expect(seasonGain({ playerId: 'a', detail: { status: 'Winner' },
      season, cohort, rankings })).toBeCloseTo(49.5, 5);
    // A forgettable winner earns materially less than a beloved one.
    expect(seasonGain({ playerId: 'c', detail: { status: 'Winner' },
      season, cohort, rankings })).toBeCloseTo(11, 5);   // 22 x 0.5 x 1.0
  });

  it('knows every placement tier and refuses to invent one', () => {
    expect(PLACEMENT_BASE).toEqual({
      'Winner': 22, 'Runner-up': 16, 'Finalist': 13, 'Jury': 8, 'Pre-jury': 3,
    });
    expect(seasonGain({ playerId: 'a', detail: { status: 'Nonsense' },
      season: { awards: {} }, cohort: [], rankings: {} })).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run tests/fame.test.js`
Expected: FAIL — `popularityFactor is not a function`.

- [ ] **Step 3: Write the implementation**

```js
// js/fame.js — append

/** What finishing in each position is worth. Both shows write `status`. */
export const PLACEMENT_BASE = {
  'Winner': 22, 'Runner-up': 16, 'Finalist': 13, 'Jury': 8, 'Pre-jury': 3,
};

const AWARD_POINTS = { fanFavorite: 10, bestStrategic: 4, mostChallengeWins: 4 };
const AWARD_CAP = 12;

/**
 * How the audience received this player, 0.5 to 1.5.
 *
 * By RANK within the season, never by raw value: the raw numbers are unbounded
 * and scale differently season to season, so one season's 1.2x would be
 * another's 0.7x, and a single outlier would compress everybody else to the
 * floor.
 *
 * Neutral when the season recorded no popularity at all — which is every season
 * exported before popularity was written out, and cannot be recovered.
 */
export function popularityFactor(playerId, cohort) {
  const rated = (cohort || []).filter(d => Number.isFinite(d.popularity));
  if (rated.length < 2) return 1;
  const sorted = [...rated].sort((a, b) => b.popularity - a.popularity);
  const idx = sorted.findIndex(d => d.playerId === playerId);
  if (idx < 0) return 1;
  // Most popular 1.5, least 0.5, linear by position.
  return 1.5 - (idx / (sorted.length - 1));
}

/** The three awards seasons_database.json stores, capped. */
export function seasonAwardPoints(playerId, season) {
  let points = 0;
  for (const [key, value] of Object.entries(AWARD_POINTS)) {
    if (season?.awards?.[key]?.playerSlug === playerId) points += value;
  }
  return Math.min(points, AWARD_CAP);
}

/** What one season adds to a career. */
export function seasonGain({ playerId, detail, season, cohort, rankings }) {
  const base = PLACEMENT_BASE[detail?.status] || 0;
  if (!base) return 0;
  const reception = popularityFactor(playerId, cohort);
  const awards = seasonAwardPoints(playerId, season);
  return (base * reception + awards) * showRankMultiplier(playerId, season.format, rankings);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node node_modules/vitest/vitest.mjs run tests/fame.test.js`
Expected: PASS, 14 tests.

- [ ] **Step 5: Commit**

```bash
git add js/fame.js tests/fame.test.js
git commit -m "A forgettable winner is not the same as a beloved one"
```

---

### Task 5: The walk — decay, gates, the lock

**Files:**
- Modify: `js/fame.js`
- Test: `tests/fame.test.js`

**Interfaces:**
- Consumes: everything above.
- Produces: `recordsHeld(playerId, franchise) → number`, `computeFame({ players, rankings, seasons, franchise }) → Map<string, FameResult>`, `fameOf(playerId, dbs) → FameResult`.
- `FameResult = { stars, score, locked, seasonsPlayed, shows, timeline }` where `timeline` is `[{ seasonId, event, delta, score }]` and `event` is one of `'played' | 'missed' | 'multi-show' | 'records' | 'locked'`.

- [ ] **Step 1: Write the failing test**

```js
// append to tests/fame.test.js
import { computeFame, fameOf, recordsHeld } from '../js/fame.js';

/** Fifteen Total Drama seasons then one Big Brother, like the real franchise. */
function franchiseOf(n = 15) {
  const seasons = [];
  for (let i = 1; i <= n; i++) {
    seasons.push({ seasonNumber: i, format: 'total-drama', seasonId: `td-${i}`, awards: {} });
  }
  seasons.push({ seasonNumber: 1, format: 'big-brother', seasonId: 'bb-1', awards: {} });
  return { seasons };
}
const player = (id, details) => ({ id, name: id, seasonDetails: details });
const td = (n, status) => ({ season: n, format: 'total-drama', seasonId: `td-${n}`, status });
const bb = (n, status) => ({ season: n, format: 'big-brother', seasonId: `bb-${n}`, status });

describe('walking a career', () => {
  it('cannot reach five stars on one season, however good it was', () => {
    // One season, winner, top ranking, fan favourite — the best single season possible.
    const seasons = { seasons: [{ seasonNumber: 1, format: 'total-drama', seasonId: 'td-1',
      awards: { fanFavorite: { playerSlug: 'solo' }, bestStrategic: { playerSlug: 'solo' } } }] };
    const r = fameOf('solo', {
      players: { players: [player('solo', [td(1, 'Winner')])] },
      rankings: { metadata: { format: 'total-drama' }, rankings: [{ playerId: 'solo', tier: 'S+' }] },
      seasons,
    });
    expect(r.seasonsPlayed).toBe(1);
    expect(r.stars, 'a single season reached five stars').toBeLessThanOrEqual(4.5);
    expect(r.locked).toBe(false);
  });

  it('fades a player who never comes back', () => {
    const dbs = { players: { players: [
      player('early', [td(1, 'Jury'), td(2, 'Jury')]),
      player('late', [td(14, 'Jury'), td(15, 'Jury')]),
    ]}, rankings: {}, seasons: franchiseOf() };
    const all = computeFame(dbs);
    // Identical careers, different eras: the older one has decayed.
    expect(all.get('early').score).toBeLessThan(all.get('late').score);
    expect(all.get('early').timeline.some(t => t.event === 'missed')).toBe(true);
  });

  it('never decays below zero', () => {
    const dbs = { players: { players: [player('faded', [td(1, 'Pre-jury')])] },
      rankings: {}, seasons: franchiseOf(60) };
    expect(computeFame(dbs).get('faded').score).toBe(0);
  });

  it('locks at five and stops decaying forever', () => {
    // A big multi-show career, then a very long absence.
    const seasons = { seasons: [
      { seasonNumber: 1, format: 'total-drama', seasonId: 'td-1',
        awards: { fanFavorite: { playerSlug: 'legend' } } },
      { seasonNumber: 2, format: 'total-drama', seasonId: 'td-2',
        awards: { fanFavorite: { playerSlug: 'legend' } } },
      { seasonNumber: 1, format: 'big-brother', seasonId: 'bb-1',
        awards: { fanFavorite: { playerSlug: 'legend' } } },
    ]};
    for (let i = 3; i <= 40; i++) {
      seasons.seasons.push({ seasonNumber: i, format: 'total-drama', seasonId: `td-${i}`, awards: {} });
    }
    const r = fameOf('legend', {
      players: { players: [player('legend',
        [td(1, 'Winner'), td(2, 'Winner'), bb(1, 'Winner')])] },
      rankings: [{ metadata: { format: 'total-drama' }, rankings: [{ playerId: 'legend', tier: 'S+' }] },
                 { metadata: { format: 'big-brother' }, rankings: [{ playerId: 'legend', tier: 'S+' }] }],
      seasons,
    });
    expect(r.stars, 'a three-time winner across two shows is not famous').toBe(5);
    expect(r.locked).toBe(true);
    // 37 missed seasons afterwards would have cost ~44 points if decay applied.
    expect(r.timeline.filter(t => t.event === 'missed')).toHaveLength(0);
  });

  it('pays the multi-show bonus once per extra show, at the right season', () => {
    const dbs = { players: { players: [player('cross', [td(1, 'Jury'), bb(1, 'Jury')])] },
      rankings: {}, seasons: franchiseOf() };
    const r = computeFame(dbs).get('cross');
    const bonus = r.timeline.filter(t => t.event === 'multi-show');
    expect(bonus).toHaveLength(1);
    expect(bonus[0].delta).toBe(8);
    expect(bonus[0].seasonId).toBe('bb-1');
    expect(r.shows.sort()).toEqual(['big-brother', 'total-drama']);
  });

  it('counts records once each and caps them', () => {
    const franchise = { records: { challengeRecords: { overall: {
      mostChallengeWins: { playerSlug: 'rec' }, mostImmunityWins: { playerSlug: 'rec' },
      mostRewardWins: { playerSlug: 'rec' } } },
      votingRecords: { overall: { mostVotes: { playerSlug: 'rec' } } } } };
    expect(recordsHeld('rec', franchise)).toBe(4);
    expect(recordsHeld('nobody', franchise)).toBe(0);
    const r = fameOf('rec', { players: { players: [player('rec', [td(1, 'Jury')])] },
      rankings: {}, seasons: franchiseOf(1), franchise });
    const rec = r.timeline.filter(t => t.event === 'records');
    expect(rec).toHaveLength(1);
    expect(rec[0].delta, 'the records cap did not hold').toBe(12);   // 4 x 6 capped
  });

  it('works with no franchise database at all', () => {
    expect(() => computeFame({ players: { players: [player('x', [td(1, 'Jury')])] },
      rankings: {}, seasons: franchiseOf(1) })).not.toThrow();
  });

  it('gives the same answer every time', () => {
    const dbs = { players: { players: [player('d', [td(1, 'Winner'), bb(1, 'Jury')])] },
      rankings: {}, seasons: franchiseOf() };
    const a = computeFame(dbs).get('d');
    const b = computeFame(dbs).get('d');
    expect(a.score).toBe(b.score);
    expect(a.timeline).toEqual(b.timeline);
  });

  it('gives a player with no popularity and no ranking a real score, not zero', () => {
    const r = fameOf('bare', { players: { players: [player('bare', [td(1, 'Winner')])] },
      rankings: {}, seasons: franchiseOf(1) });
    expect(r.score, 'the neutral fallbacks produced nothing').toBeGreaterThan(0);
    expect(r.stars).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run tests/fame.test.js`
Expected: FAIL — `computeFame is not a function`.

- [ ] **Step 3: Write the implementation**

```js
// js/fame.js — append

const DECAY_PER_MISSED_SEASON = 1.2;
const MULTI_SHOW_BONUS = 8;
const MULTI_SHOW_CAP = 16;
const RECORD_POINTS = 6;
const RECORD_CAP = 12;
const LOCK_SCORE = 95;
const LOCK_MIN_SEASONS = 2;

/**
 * How many franchise records this player holds.
 *
 * The records nest two or three levels deep under four categories, and every
 * holder object carries a playerSlug, so this walks rather than hardcoding the
 * shape — new record categories then count themselves.
 */
export function recordsHeld(playerId, franchiseDb) {
  let held = 0;
  const walk = node => {
    if (!node || typeof node !== 'object') return;
    if (node.playerSlug) {
      if (node.playerSlug === playerId) held++;
      return;                       // a holder is a leaf; do not descend into it
    }
    Object.values(node).forEach(walk);
  };
  walk(franchiseDb?.records);
  return held;
}

/**
 * Fame for every player, walked season by season.
 *
 * One pass over the franchise's chronology per player: accrue for the seasons
 * they were in, decay for the ones they missed, and lock at five stars the
 * moment they get there.
 */
export function computeFame({ players, rankings, seasons, franchise } = {}) {
  const chronology = seasonChronology(seasons);
  const roster = players?.players || [];

  // Everybody's details for a given season, so popularity can be ranked within it.
  const cohorts = new Map();
  for (const p of roster) {
    for (const d of p.seasonDetails || []) {
      const key = d.seasonId || `${PREFIX[d.format || 'total-drama']}-${d.season}`;
      if (!cohorts.has(key)) cohorts.set(key, []);
      cohorts.get(key).push({ ...d, playerId: p.id });
    }
  }

  const out = new Map();
  for (const p of roster) {
    const mine = new Map();
    for (const d of p.seasonDetails || []) {
      mine.set(d.seasonId || `${PREFIX[d.format || 'total-drama']}-${d.season}`, d);
    }

    let score = 0;
    let locked = false;
    let seasonsPlayed = 0;
    let bonusPaid = 0;
    const shows = [];
    const timeline = [];
    // Records reflect a finished career, so they land on the last appearance.
    const lastPlayed = chronology.filter(s => mine.has(s.seasonId)).slice(-1)[0]?.seasonId;

    for (const season of chronology) {
      const detail = mine.get(season.seasonId);

      if (!detail) {
        if (locked) continue;
        const delta = -Math.min(DECAY_PER_MISSED_SEASON, score);
        if (delta) {
          score += delta;
          timeline.push({ seasonId: season.seasonId, event: 'missed', delta, score });
        }
        continue;
      }

      seasonsPlayed++;
      const gain = seasonGain({ playerId: p.id, detail, season,
        cohort: cohorts.get(season.seasonId) || [], rankings });
      score += gain;
      timeline.push({ seasonId: season.seasonId, event: 'played', delta: gain, score });

      // A second or third show raises the ceiling — it does not grant the star.
      if (!shows.includes(season.format)) {
        shows.push(season.format);
        if (shows.length > 1 && bonusPaid < MULTI_SHOW_CAP) {
          const delta = Math.min(MULTI_SHOW_BONUS, MULTI_SHOW_CAP - bonusPaid);
          bonusPaid += delta;
          score += delta;
          timeline.push({ seasonId: season.seasonId, event: 'multi-show', delta, score });
        }
      }

      if (season.seasonId === lastPlayed) {
        const delta = Math.min(recordsHeld(p.id, franchise) * RECORD_POINTS, RECORD_CAP);
        if (delta) {
          score += delta;
          timeline.push({ seasonId: season.seasonId, event: 'records', delta, score });
        }
      }

      // Famous and impossible to forget.
      if (!locked && score >= LOCK_SCORE && seasonsPlayed >= LOCK_MIN_SEASONS) {
        locked = true;
        timeline.push({ seasonId: season.seasonId, event: 'locked', delta: 0, score });
      }
    }

    // The gate, enforced at the end as well as at the lock: a one-season career
    // can climb past the threshold and must still be held below five.
    let stars = starsFromScore(score);
    if (stars === 5 && seasonsPlayed < LOCK_MIN_SEASONS) stars = 4.5;

    out.set(p.id, { stars, score: Math.round(score * 100) / 100,
      locked, seasonsPlayed, shows, timeline });
  }
  return out;
}

/**
 * Fame for one player. The read API the simulator would call — it takes the
 * same databases and returns the same shape, so wiring fame into gameplay is a
 * call rather than a redesign.
 */
export function fameOf(playerId, dbs) {
  return computeFame(dbs).get(playerId)
    || { stars: 0, score: 0, locked: false, seasonsPlayed: 0, shows: [], timeline: [] };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node node_modules/vitest/vitest.mjs run tests/fame.test.js`
Expected: PASS, 23 tests.

- [ ] **Step 5: Commit**

```bash
git add js/fame.js tests/fame.test.js
git commit -m "Fame accrues, fades, and at five it stops fading forever"
```

---

### Task 6: Calibration against the real roster

**Files:**
- Create: `tests/fame-calibration.test.js`
- Modify: `js/fame.js` (only if tuning is needed)

**Interfaces:**
- Consumes: `computeFame` (Task 5).
- Produces: nothing. This task's deliverable is a tuned, asserted distribution.

This is the task that matters. The weights so far are a first pass; this measures them against 152 real careers and either confirms them or moves them.

- [ ] **Step 1: Write the calibration test**

```js
// tests/fame-calibration.test.js
// The weights in js/fame.js are arbitrary until something measures them.
//
// Without this file they rot in silence: a plausible-looking formula can put
// half the roster on five stars or everybody on one, and nothing else in the
// suite would notice. These assertions are deliberately about the SHAPE of the
// distribution rather than any individual player, so tuning the weights does not
// mean rewriting the test — only the bands move, and only on purpose.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { computeFame } from '../js/fame.js';

const load = name => JSON.parse(readFileSync(fileURLToPath(new URL(`../${name}`, import.meta.url)), 'utf8'));

const dbs = {
  players: load('players_database.json'),
  rankings: load('rankings_database.json'),
  seasons: load('seasons_database.json'),
  franchise: load('franchise_database.json'),
};
const fame = computeFame(dbs);
const all = [...fame.values()];
const at = s => all.filter(f => f.stars === s).length;

describe('fame across the real franchise', () => {
  it('rates everybody who has ever played', () => {
    expect(all.length).toBe(dbs.players.players.length);
    expect(all.every(f => f.stars >= 0 && f.stars <= 5)).toBe(true);
    expect(all.every(f => f.stars * 2 === Math.round(f.stars * 2))).toBe(true);
  });

  it('keeps five stars rare', () => {
    // A handful. If this fails high the weights are too generous; if it fails
    // low, nobody in fifteen seasons is famous, which is also wrong.
    expect(at(5), `${at(5)} players are at five stars`).toBeLessThanOrEqual(8);
  });

  it('puts the bulk of the roster in the middle', () => {
    const mid = all.filter(f => f.stars >= 1 && f.stars <= 3).length;
    expect(mid / all.length, 'the distribution collapsed to the edges')
      .toBeGreaterThan(0.4);
  });

  it('does not put everybody on the same number', () => {
    // The failure mode the neutral fallbacks could cause: with no popularity
    // and no per-show rankings, a bad formula flattens the whole roster.
    const distinct = new Set(all.map(f => f.stars));
    expect(distinct.size, 'fame is not discriminating between careers')
      .toBeGreaterThanOrEqual(5);
  });

  it('keeps one forgettable season out of the top', () => {
    const oneAndDone = all.filter(f => f.seasonsPlayed === 1);
    expect(oneAndDone.length).toBeGreaterThan(0);
    expect(Math.max(...oneAndDone.map(f => f.stars)),
      'a single season reached five stars').toBeLessThanOrEqual(4.5);
    // And a forgettable one should be nowhere near the top.
    const forgettable = oneAndDone.filter(f => f.score < 15);
    if (forgettable.length) {
      expect(Math.max(...forgettable.map(f => f.stars))).toBeLessThanOrEqual(2);
    }
  });

  it('ranks a decorated multi-season career above a single quiet one', () => {
    const veterans = all.filter(f => f.seasonsPlayed >= 3);
    const rookies = all.filter(f => f.seasonsPlayed === 1);
    expect(veterans.length).toBeGreaterThan(0);
    const avg = xs => xs.reduce((s, f) => s + f.score, 0) / xs.length;
    expect(avg(veterans)).toBeGreaterThan(avg(rookies));
  });
});
```

- [ ] **Step 2: Run it and read the distribution**

Run: `node node_modules/vitest/vitest.mjs run tests/fame-calibration.test.js`

Then print the actual shape, whether or not it passed:

```bash
node --input-type=module -e "
import { readFileSync } from 'node:fs';
import { computeFame } from './js/fame.js';
const L=n=>JSON.parse(readFileSync(n,'utf8'));
const f=[...computeFame({players:L('players_database.json'),rankings:L('rankings_database.json'),seasons:L('seasons_database.json'),franchise:L('franchise_database.json')}).values()];
const b={}; f.forEach(x=>b[x.stars]=(b[x.stars]||0)+1);
console.log('distribution:',b);
console.log('locked:',f.filter(x=>x.locked).length,'| max score:',Math.max(...f.map(x=>x.score)));
"
```

- [ ] **Step 3: Tune the weights if the distribution is wrong**

If five stars is over-populated, lower it by raising `LOCK_SCORE` and the 4.5/5 thresholds, **not** by cutting `placementBase` — placement is the honest signal. If nearly everyone lands at 0–0.5, the decay is eating careers: reduce `DECAY_PER_MISSED_SEASON` toward 0.8.

Change one constant at a time and re-run both files:

```bash
node node_modules/vitest/vitest.mjs run tests/fame.test.js tests/fame-calibration.test.js
```

Task 5's unit tests must stay green — they encode the rules, and the rules are not what is being tuned.

- [ ] **Step 4: Verify both files pass**

Run: `node node_modules/vitest/vitest.mjs run tests/fame.test.js tests/fame-calibration.test.js`
Expected: PASS, 29 tests.

- [ ] **Step 5: Commit**

```bash
git add tests/fame-calibration.test.js js/fame.js
git commit -m "Measure the weights against 152 real careers"
```

---

### Task 7: Popularity reaches the published data

**Files:**
- Modify: `js/stats-export.js` (Total Drama season details; Big Brother season details)
- Test: `tests/fame-popularity-export.test.js`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `popularity` on each `seasonDetails[]` entry in `players_database.json`.

Popularity is the biggest input to fame and it currently never leaves memory. Historical seasons cannot be backfilled — that data is gone — so this only affects seasons exported from now on.

- [ ] **Step 1: Write the failing test**

```js
// tests/fame-popularity-export.test.js
// Popularity was live-only: gs.popularity never reached players_database.json,
// so "how the audience received you" — the biggest single input to fame — was
// unavailable to every page. Verified absent from a real Big Brother export
// before this was written.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { simulateBBFinale } from '../js/bb-finale.js';
import { buildBigBrotherSeasonDocument, mergeBigBrotherSeason } from '../js/stats-export.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
].map(([name, archetype, gender]) => ({ name, archetype, gender, sexuality: 'straight' }));

describe('popularity survives the export', () => {
  beforeEach(() => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.episodeHistory = []; gs.jury = []; gs.jurorHistory = {};
    gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7 });
    withSeededRandom(11, () => {
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 40) simulateBBEpisode();
      simulateBBFinale();
    });
  });

  it('writes each houseguest\'s popularity into their season detail', () => {
    const doc = buildBigBrotherSeasonDocument(1);
    const db = mergeBigBrotherSeason({ franchise: {}, players: [] }, doc);
    const rated = db.players.filter(p =>
      Number.isFinite(p.seasonDetails.find(d => d.format === 'big-brother')?.popularity));
    expect(rated.length, 'no popularity reached the career database').toBe(db.players.length);
  });

  it('records different numbers for different players', () => {
    // A constant would satisfy the test above and tell fame nothing.
    const doc = buildBigBrotherSeasonDocument(1);
    const db = mergeBigBrotherSeason({ franchise: {}, players: [] }, doc);
    const values = db.players.map(p =>
      p.seasonDetails.find(d => d.format === 'big-brother').popularity);
    expect(new Set(values).size, 'every player got the same popularity').toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run tests/fame-popularity-export.test.js`
Expected: FAIL — "no popularity reached the career database".

- [ ] **Step 3: Carry popularity through the Big Brother path**

In `js/stats-export.js`, inside `extractBigBrotherSeasonTemplate`, add `popularity` to each object built in the `placements` map (beside `votesReceived`):

```js
        // What the audience made of them. Live-only until now, which left fame
        // and every audience-facing page with nothing to read.
        popularity: Number(gs.popularity?.[name]) || 0,
```

Then in `mergeBigBrotherSeason`, add it to the object passed to `_tagSeasonDetail`, beside `juryVotes`:

```js
      popularity: Number(entry.popularity) || 0,
```

- [ ] **Step 4: Carry popularity through the Total Drama path**

In `js/stats-export.js`, in `_mergePlayersDatabase`, add the same field to the object pushed via `_tagSeasonDetail` for a Total Drama season detail, beside `votesReceived`:

```js
      popularity: Number(gs.popularity?.[player.name]) || 0,
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node node_modules/vitest/vitest.mjs run tests/fame-popularity-export.test.js`
Expected: PASS, 2 tests.

- [ ] **Step 6: Verify nothing else broke**

Run: `node node_modules/vitest/vitest.mjs run tests/bb-season-export.test.js tests/season-format.test.js`
Expected: PASS, all existing tests still green.

- [ ] **Step 7: Commit**

```bash
git add js/stats-export.js tests/fame-popularity-export.test.js
git commit -m "How the audience received you now leaves memory"
```

---

### Task 8: Stars on the player page

**Files:**
- Create: `js/fame-stars.js`
- Modify: `player.html`
- Test: `tests/fame.test.js`

**Interfaces:**
- Consumes: `FameResult` (Task 5).
- Produces: `renderStars(fame) → string` (HTML), `FAME_STAR_CSS` (string).

`js/fame.js` must remain DOM-free; all markup lives here.

- [ ] **Step 1: Write the failing test**

```js
// append to tests/fame.test.js
import { renderStars } from '../js/fame-stars.js';

describe('drawing the stars', () => {
  const fame = s => ({ stars: s, score: 50, locked: false, seasonsPlayed: 2, shows: [], timeline: [] });

  it('draws five positions whatever the rating', () => {
    for (const s of [0, 0.5, 2.5, 5]) {
      const html = renderStars(fame(s));
      expect((html.match(/fame-star\b/g) || []).length, `${s} stars`).toBe(5);
    }
  });

  it('draws half stars as halves', () => {
    expect(renderStars(fame(2.5))).toMatch(/fame-star-half/);
    expect(renderStars(fame(2))).not.toMatch(/fame-star-half/);
  });

  it('says so when a rating is locked', () => {
    expect(renderStars({ ...fame(5), locked: true })).toMatch(/fame-locked/);
    expect(renderStars(fame(5))).not.toMatch(/fame-locked/);
  });

  it('shows nothing rather than crashing on missing data', () => {
    expect(renderStars(null)).toBe('');
    expect(renderStars(undefined)).toBe('');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run tests/fame.test.js`
Expected: FAIL — cannot resolve `../js/fame-stars.js`.

- [ ] **Step 3: Write the renderer**

```js
// js/fame-stars.js
// Drawing a FameResult. Separate from js/fame.js on purpose: that module must
// stay free of the DOM so the simulator can import it without dragging markup
// along.

export const FAME_STAR_CSS = `
.fame-rating{display:inline-flex;align-items:center;gap:6px;}
.fame-stars{display:inline-flex;gap:2px;}
.fame-star{width:15px;height:15px;position:relative;display:inline-block;
  background:rgba(255,255,255,0.18);
  clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);}
.fame-star-full{background:linear-gradient(135deg,#ffd76a,#ffa726);}
.fame-star-half{background:linear-gradient(90deg,#ffd76a 50%,rgba(255,255,255,0.18) 50%);}
.fame-locked .fame-star-full{background:linear-gradient(135deg,#fff3c4,#ffb300);
  box-shadow:0 0 6px rgba(255,183,0,0.6);}
.fame-score{font-size:11px;opacity:0.6;}
@media(prefers-reduced-motion:reduce){.fame-locked .fame-star-full{box-shadow:none;}}
`;

/** A FameResult as five star positions, halves included. */
export function renderStars(fame) {
  if (!fame || typeof fame.stars !== 'number') return '';
  const full = Math.floor(fame.stars);
  const half = fame.stars - full >= 0.5;
  const cells = [];
  for (let i = 0; i < 5; i++) {
    const cls = i < full ? 'fame-star fame-star-full'
      : (i === full && half) ? 'fame-star fame-star-half'
        : 'fame-star';
    cells.push(`<span class="${cls}"></span>`);
  }
  const title = fame.locked
    ? `${fame.stars} stars — famous, and it can no longer fade (score ${fame.score})`
    : `${fame.stars} stars (score ${fame.score}, from ${fame.seasonsPlayed} season(s))`;
  return `<span class="fame-rating${fame.locked ? ' fame-locked' : ''}" title="${title}">`
    + `<span class="fame-stars">${cells.join('')}</span>`
    + `<span class="fame-score">${fame.stars.toFixed(1)}</span></span>`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node node_modules/vitest/vitest.mjs run tests/fame.test.js`
Expected: PASS, 27 tests.

- [ ] **Step 5: Wire it into the player page**

`player.html` already fetches `players_database.json` (around line 461). Add the other three fetches and render the stars into the player's header.

Add near the other module imports in `player.html`:

```html
<script type="module">
  import { computeFame } from './js/fame.js';
  import { renderStars, FAME_STAR_CSS } from './js/fame-stars.js';

  const style = document.createElement('style');
  style.textContent = FAME_STAR_CSS;
  document.head.appendChild(style);

  window.renderPlayerFame = async (playerId, mountEl) => {
    if (!mountEl) return;
    try {
      const [players, rankings, seasons, franchise] = await Promise.all([
        fetch('players_database.json', { cache: 'no-store' }).then(r => r.json()),
        fetch('rankings_database.json').then(r => r.json()).catch(() => ({})),
        fetch('seasons_database.json').then(r => r.json()).catch(() => ({ seasons: [] })),
        fetch('franchise_database.json').then(r => r.json()).catch(() => ({})),
      ]);
      const fame = computeFame({ players, rankings, seasons, franchise }).get(playerId);
      mountEl.innerHTML = renderStars(fame);
    } catch (err) {
      // A missing rating must never take the page down with it.
      console.warn('Could not compute fame:', err);
      mountEl.innerHTML = '';
    }
  };
</script>
```

Then add a mount point in the player header markup and call it once the player is known:

```html
<span id="player-fame"></span>
```

```js
window.renderPlayerFame(player.id, document.getElementById('player-fame'));
```

- [ ] **Step 6: Verify in a browser**

```bash
python serve.py 4173
```

Open `http://localhost:4173/player.html?slug=alejandro`. Confirm: five star positions render, the filled count matches the tooltip's number, and a player with a single season shows fewer stars than a multi-season winner. Check the console is clean.

- [ ] **Step 7: Commit**

```bash
git add js/fame-stars.js player.html tests/fame.test.js
git commit -m "Put the stars on the player page"
```

---

## Self-Review

**Spec coverage.** Every section of the spec maps to a task: the star scale and thresholds (Task 1), per-show rankings and their 1.0 fallback (Task 2), chronology across two shows (Task 3), placement/popularity/awards/rank multiplier (Task 4), decay, multi-show bonus, records, gates and the lock (Task 5), calibration (Task 6), the popularity export prerequisite and its unrecoverable history (Task 7), the renderer, the one wired page and the simulator read API (Tasks 5 and 8).

Deliberately **not** covered, matching the spec's out-of-scope list: stars on seasons/rankings/leaderboards/cast lists, authoring the Big Brother ranking board, any simulator behaviour reading fame, and backfilling historical popularity.

**Where the Big Brother ranking board will come from.** Not from this plan, and
not hand-written. `current-season.html` already drives a ranking pipeline through
the AI worker (`mode: 'rankings-update'` to preserve non-returnees,
`'rankings-rebuild'` to recalculate everyone), rendered by
`js/rankings-update.js`. Adapting that pipeline to produce a per-show board is
sub-project E's work — making `current-season.html` format-aware — and it will
write a second board tagged `metadata.format: 'big-brother'`.

Task 2 is built for exactly that: boards are looked up by format, `rankings` may
be a single board or an array of them, and a show with no board yet scores at a
neutral 1.0. So fame works today with one Total Drama board, and starts reading
the Big Brother board the moment that pipeline produces one — with no change to
`js/fame.js`.

**Known issue found while planning, not in scope.** `player.html:410` fetches a season document as `'data/seasons/season' + sd.season + '-data.json'` — season number only, no format. For a Big Brother season detail that resolves to Total Drama's file. It is the read-side twin of the publish collision already fixed in the worker. Fame does not touch that code path, so this plan leaves it alone; it belongs to sub-project C or D and should be recorded there.

**Type consistency.** `FameResult` is `{ stars, score, locked, seasonsPlayed, shows, timeline }` in Tasks 5, 6 and 8 alike. `computeFame` takes one options object `{ players, rankings, seasons, franchise }` everywhere. `showRankMultiplier(playerId, format, rankings)` is defined in Task 2 and called with that order in Task 4. `seasonGain` takes a single object in both its definition and its call site. `PREFIX` is defined once in Task 3 and reused in Task 5.
