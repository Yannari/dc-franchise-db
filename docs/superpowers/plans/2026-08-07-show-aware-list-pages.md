# Show-aware List Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a visitor see which show each season, award and ranking belongs to, and switch between shows — and stop the two places where two shows silently become one.

**Architecture:** One shared module, `js/show-switcher.js`, renders the control and owns the state in the URL (`?show=big-brother`); each page keeps its own rendering and re-renders on a callback. `js/shows.js` becomes the only registry of shows, with the two duplicate prefix maps deleted. Two worker queries gain a `format` they were missing, tested against real SQL for the first time via `node:sqlite`.

**Tech Stack:** ES modules, no build step. Vitest. `node:sqlite` (built into Node 24, experimental). Playwright via the npm package. Cloudflare Worker + D1.

**Spec:** `docs/superpowers/specs/2026-08-07-show-aware-list-pages-design.md`

## Global Constraints

Copied from the spec. Every task's requirements implicitly include these.

- **`js/shows.js` is the only registry of shows.** No other module may hold a format→prefix map or a list of formats.
- **The switcher never hardcodes a show.** `formats` is always derived from the data the page loaded.
- **State lives in the URL**: `?show=<format>` filters; absent or `?show=all` shows everything. An unrecognised value falls back to `all` — never an error.
- **Default view is everything, grouped by show**, default format (`total-drama`) first.
- **`/api/leaderboard`'s default must stay all-shows.** A Big Brother appearance must never drop a player off an existing board.
- **Total Drama keeps its bare names** — `season4-data.json`, `S4 Winner`. Only other shows are prefixed.
- Run one test file with `node node_modules/vitest/vitest.mjs run tests/<file>`. Do **not** run the whole suite; it exhausts memory.
- Commit messages in this repo are prose sentences, not `feat:`/`fix:` prefixes.
- **Commit with an explicit pathspec** — `git commit -- <paths>`. Another session shares this git index; staging paths alone is not enough, and a plain `git commit` has already swallowed someone else's work twice.
- Playwright's MCP server is unreliable here. Drive it with the npm package: `require('C:/Users/yanna/OneDrive/Documents/GitHub/dc-franchise-db/node_modules/playwright')` — a script outside the repo cannot resolve `'playwright'` by name.
- The local server is `python serve.py 4173`. The player page's URL parameter is `?player=`, not `?slug=`.

## File Structure

| File | Responsibility |
|---|---|
| `js/show-switcher.js` (create) | The control, the state, the URL. Never touches a page's list. |
| `js/shows.js` (modify) | Gains `careerStats` per show; becomes the sole registry. |
| `js/fame.js` (modify) | Deletes its private `PREFIX`; imports `formatPrefix`. |
| `js/stats-export.js` (modify) | `_rebuildByShow` reads stat fields from the registry instead of branching. |
| `worker/queries.js` (create) | The SQL for the leaderboard, castmates and bonds, as pure functions. Imported by the worker AND by the tests, so the tested strings are the shipped strings. |
| `worker/worker-studio.js` (modify) | Deletes `SEASON_FILE_PREFIX`; imports its SQL from `worker/queries.js`. |
| `seasons.html`, `awards.html`, `rankings.html` (modify) | Mount the switcher, group by show, render badges. Rankings also gets fame stars and the empty state. |
| `tests/show-switcher.test.js` (create) | The module's URL and state behaviour. |
| `tests/shows-registry.test.js` (create) | The guard: no second prefix map, no second format list. |
| `tests/worker-sql.test.js` (create) | The worker's SQL against real SQLite. |
| `tests/show-pages.e2e.test.js` (create) | The three pages in a browser, driven by URL. |

### Data shapes

```js
// js/shows.js today
SHOWS = { 'total-drama': { prefix:'td', name:'Total Drama', short:'TD', emoji:'🎬' },
          'big-brother': { prefix:'bb', name:'Big Brother', short:'BB', emoji:'📹' } }

// seasons_database.json
{ seasons: [ { seasonNumber: 1, format: 'big-brother', seasonId: 'bb-1', title: '…', awards: {…} } ] }

// rankings_database.json
{ metadata: { format: 'total-drama' }, rankings: [ { playerId, name, rank, tier, score, title, emoji } ] }
```

---

### Task 1: The switcher module

**Files:**
- Create: `js/show-switcher.js`
- Test: `tests/show-switcher.test.js`

**Interfaces:**
- Consumes: `SHOWS`, `DEFAULT_FORMAT` from `js/shows.js`.
- Produces: `mountShowSwitcher(mountEl, { formats, onChange }) → { current(), set(format), destroy() }`, `currentShow() → string`, `ALL = 'all'`, `orderFormats(formats) → string[]`.

- [ ] **Step 1: Write the failing test**

```js
// tests/show-switcher.test.js
// The switcher owns which show you are looking at. It must never hold its own
// list of shows — the formats come from whatever data the page loaded, so a
// third show appears without editing this module.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL, currentShow, mountShowSwitcher, orderFormats } from '../js/show-switcher.js';

function setUrl(search) {
  window.history.replaceState({}, '', '/seasons.html' + search);
}

describe('reading the show from the URL', () => {
  beforeEach(() => setUrl(''));

  it('shows everything when nothing is asked for', () => {
    expect(currentShow()).toBe(ALL);
    setUrl('?show=all');
    expect(currentShow()).toBe(ALL);
  });

  it('reads a real format', () => {
    setUrl('?show=big-brother');
    expect(currentShow()).toBe('big-brother');
  });

  it('degrades a stale or nonsense link instead of erroring', () => {
    // A link from before a show was renamed must still open the page.
    setUrl('?show=wrestling');
    expect(currentShow()).toBe(ALL);
    setUrl('?show=');
    expect(currentShow()).toBe(ALL);
  });
});

describe('ordering the shows', () => {
  it('puts the default format first, then the rest as given', () => {
    expect(orderFormats(['big-brother', 'total-drama'])).toEqual(['total-drama', 'big-brother']);
    expect(orderFormats(['big-brother'])).toEqual(['big-brother']);
  });

  it('keeps an unknown format rather than dropping it', () => {
    // A season in a format the registry has not learned yet must still be
    // reachable — dropping it would hide seasons with no error anywhere.
    expect(orderFormats(['wrestling', 'total-drama'])).toEqual(['total-drama', 'wrestling']);
  });
});

describe('the control', () => {
  let el;
  beforeEach(() => { setUrl(''); el = document.createElement('div'); document.body.appendChild(el); });
  afterEach(() => el.remove());

  it('offers every format it was given, plus All', () => {
    mountShowSwitcher(el, { formats: ['total-drama', 'big-brother'], onChange: () => {} });
    const values = [...el.querySelectorAll('[data-show]')].map(b => b.dataset.show);
    expect(values).toEqual([ALL, 'total-drama', 'big-brother']);
    // Labels come from the registry, not from this module.
    expect(el.textContent).toContain('Total Drama');
    expect(el.textContent).toContain('Big Brother');
  });

  it('offers nothing to switch to when there is only one show', () => {
    // A franchise with one show should not show a switcher at all.
    mountShowSwitcher(el, { formats: ['total-drama'], onChange: () => {} });
    expect(el.querySelectorAll('[data-show]')).toHaveLength(0);
  });

  it('reports and changes the current show, and puts it in the URL', () => {
    const onChange = vi.fn();
    const sw = mountShowSwitcher(el, { formats: ['total-drama', 'big-brother'], onChange });
    expect(sw.current()).toBe(ALL);

    sw.set('big-brother');
    expect(sw.current()).toBe('big-brother');
    expect(window.location.search).toBe('?show=big-brother');
    expect(onChange).toHaveBeenCalledWith('big-brother');

    // Back to everything drops the parameter rather than writing ?show=all.
    sw.set(ALL);
    expect(window.location.search).toBe('');
  });

  it('marks which one is selected', () => {
    setUrl('?show=big-brother');
    mountShowSwitcher(el, { formats: ['total-drama', 'big-brother'], onChange: () => {} });
    const on = [...el.querySelectorAll('[data-show]')].filter(b => b.getAttribute('aria-pressed') === 'true');
    expect(on).toHaveLength(1);
    expect(on[0].dataset.show).toBe('big-brother');
  });

  it('re-renders when the browser goes back', () => {
    const onChange = vi.fn();
    mountShowSwitcher(el, { formats: ['total-drama', 'big-brother'], onChange });
    setUrl('?show=total-drama');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onChange).toHaveBeenCalledWith('total-drama');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run tests/show-switcher.test.js`
Expected: FAIL — cannot resolve `../js/show-switcher.js`.

- [ ] **Step 3: Write the implementation**

```js
// js/show-switcher.js
// Which show you are looking at.
//
// This module holds NO list of shows. The formats come from whatever data the
// calling page loaded, and the labels come from the registry in js/shows.js, so
// a third show appears in the control without a line changing here. That is the
// whole point: the format-to-prefix map was already duplicated three times
// across this codebase, and one of those copies decided season filenames.
//
// The state lives in the URL so a view is shareable, back and forward work, and
// a filtered page can be tested by loading a link rather than by driving clicks.
import { SHOWS, DEFAULT_FORMAT } from './shows.js';

export const ALL = 'all';

/** The show the URL is asking for. Anything unrecognised means everything. */
export function currentShow() {
  let value = '';
  try { value = new URLSearchParams(window.location.search).get('show') || ''; } catch { return ALL; }
  return SHOWS[value] ? value : ALL;
}

/** Default format first, everything else in the order given. */
export function orderFormats(formats) {
  const list = [...new Set(formats || [])];
  return list.sort((a, b) =>
    (a === DEFAULT_FORMAT ? -1 : 0) - (b === DEFAULT_FORMAT ? -1 : 0));
}

const labelOf = format => SHOWS[format]
  ? `${SHOWS[format].emoji} ${SHOWS[format].name}`
  : format;

/**
 * Render the control into `mountEl`.
 *
 * With fewer than two formats there is nothing to switch between, so nothing is
 * drawn — a one-show franchise should not carry a switcher.
 */
export function mountShowSwitcher(mountEl, { formats, onChange } = {}) {
  const ordered = orderFormats(formats);
  const fire = () => { try { onChange?.(currentShow()); } catch (e) { console.warn(e); } };

  const draw = () => {
    if (!mountEl) return;
    if (ordered.length < 2) { mountEl.innerHTML = ''; return; }
    const now = currentShow();
    const button = (value, label) =>
      `<button type="button" class="show-sw-btn" data-show="${value}" `
      + `aria-pressed="${value === now}">${label}</button>`;
    mountEl.innerHTML = `<div class="show-sw" role="group" aria-label="Filter by show">`
      + button(ALL, 'All shows')
      + ordered.map(f => button(f, labelOf(f))).join('')
      + `</div>`;
  };

  const onClick = e => {
    const btn = e.target.closest('[data-show]');
    if (!btn || !mountEl.contains(btn)) return;
    api.set(btn.dataset.show);
  };
  const onPop = () => { draw(); fire(); };

  const api = {
    current: currentShow,
    set(format) {
      const next = SHOWS[format] ? format : ALL;
      const url = new URL(window.location.href);
      if (next === ALL) url.searchParams.delete('show');
      else url.searchParams.set('show', next);
      window.history.pushState({}, '', url);
      draw();
      fire();
    },
    destroy() {
      mountEl?.removeEventListener('click', onClick);
      window.removeEventListener('popstate', onPop);
    },
  };

  mountEl?.addEventListener('click', onClick);
  window.addEventListener('popstate', onPop);
  draw();
  return api;
}

/** Styles, injected by whichever page mounts the switcher. */
export const SHOW_SWITCHER_CSS = `
.show-sw{display:inline-flex;gap:4px;padding:4px;border-radius:10px;
  background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);}
.show-sw-btn{appearance:none;border:0;cursor:pointer;padding:6px 14px;border-radius:7px;
  font:inherit;font-size:13px;font-weight:600;color:rgba(255,255,255,0.62);background:transparent;
  transition:background .15s ease,color .15s ease;}
.show-sw-btn:hover{color:#fff;background:rgba(255,255,255,0.07);}
.show-sw-btn[aria-pressed="true"]{color:#12101a;background:linear-gradient(135deg,#ffd76a,#ffa726);}
@media(prefers-reduced-motion:reduce){.show-sw-btn{transition:none;}}
`;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node node_modules/vitest/vitest.mjs run tests/show-switcher.test.js`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add js/show-switcher.js tests/show-switcher.test.js
git commit -F - -- js/show-switcher.js tests/show-switcher.test.js <<'EOF'
A switcher that does not know what a show is

The formats come from the data the page loaded and the labels from the registry,
so a third show appears without a line changing here.
EOF
```

---

### Task 2: One registry, and a guard that keeps it that way

**Files:**
- Modify: `js/shows.js`, `js/fame.js:102`, `worker/worker-studio.js:547`, `js/stats-export.js`
- Test: `tests/shows-registry.test.js`

**Interfaces:**
- Consumes: `formatPrefix` from `js/shows.js` (already exported).
- Produces: `SHOWS[format].careerStats → string[]` — the season-detail fields that show contributes to `byShow`.

- [ ] **Step 1: Write the failing test**

```js
// tests/shows-registry.test.js
// js/shows.js is the only place that knows what a show is.
//
// This is a guard about the SHAPE OF THE CODE, which is unusual and deliberate:
// the format-to-prefix map had been duplicated THREE times — here, in js/fame.js
// and in worker/worker-studio.js — and both copies were written by someone who
// knew the rule. The rule cannot enforce itself, and the worker's copy decides
// season FILENAMES, so a show missing from it writes its season over another
// show's file. That is the collision that nearly took Total Drama 1's episode log.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SHOWS, formatPrefix, seasonId } from '../js/shows.js';

const read = f => readFileSync(join(process.cwd(), f), 'utf8');

describe('the registry', () => {
  it('describes every show completely', () => {
    for (const [format, show] of Object.entries(SHOWS)) {
      expect(show.prefix, `${format} has no prefix`).toBeTruthy();
      expect(show.name, `${format} has no name`).toBeTruthy();
      expect(show.emoji, `${format} has no emoji`).toBeTruthy();
      expect(Array.isArray(show.careerStats), `${format} declares no career stats`).toBe(true);
    }
  });

  it('gives every show a distinct prefix', () => {
    const prefixes = Object.values(SHOWS).map(s => s.prefix);
    expect(new Set(prefixes).size, 'two shows share a prefix — their season IDs collide')
      .toBe(prefixes.length);
  });

  it('builds season IDs from it', () => {
    expect(seasonId('total-drama', 4)).toBe('td-4');
    expect(seasonId('big-brother', 1)).toBe('bb-1');
    expect(formatPrefix('big-brother')).toBe('bb');
  });
});

describe('nothing else keeps its own copy', () => {
  const sources = () => {
    const out = [];
    const walk = dir => {
      for (const entry of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) { if (entry.name !== 'node_modules') walk(rel); }
        else if (entry.name.endsWith('.js')) out.push(rel);
      }
    };
    walk('js'); walk('worker');
    return out.filter(f => f !== 'js/shows.js');
  };

  it('has no second format-to-prefix map', () => {
    // Matches an object literal mapping a known format to its prefix, e.g.
    //   { 'total-drama': 'td', 'big-brother': 'bb' }
    const offenders = [];
    for (const file of sources()) {
      const src = read(file);
      for (const [format, show] of Object.entries(SHOWS)) {
        const pattern = new RegExp(`['"\`]${format}['"\`]\\s*:\\s*['"\`]${show.prefix}['"\`]`);
        if (pattern.test(src)) offenders.push(`${file} (${format})`);
      }
    }
    expect(offenders, `a second prefix map appeared in: ${offenders.join(', ')}`).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run tests/shows-registry.test.js`
Expected: FAIL twice — `careerStats` is not an array, and the prefix map is found in `js/fame.js` and `worker/worker-studio.js`.

- [ ] **Step 3: Add `careerStats` to the registry**

In `js/shows.js`, extend each entry:

```js
export const SHOWS = {
  'total-drama': {
    prefix: 'td', name: 'Total Drama', short: 'TD', emoji: '🎬',
    // Season-detail fields this show contributes to a career, and the byShow
    // key each lands under. A show declares its own shape here rather than
    // _rebuildByShow branching on the format.
    careerStats: [
      ['challengeWins', 'totalChallengeWins'],
      ['immunityWins', 'totalImmunityWins'],
      ['rewardWins', 'totalRewardWins'],
      ['idolsFound', 'totalIdolsFound'],
    ],
  },
  'big-brother': {
    prefix: 'bb', name: 'Big Brother', short: 'BB', emoji: '📹',
    careerStats: [
      ['challengeWins', 'totalCompWins'],
      ['bb.hohWins', 'hohWins'],
      ['bb.vetoWins', 'vetoWins'],
      ['bb.timesNominated', 'timesNominated'],
    ],
  },
};
```

- [ ] **Step 4: Delete the duplicate in `js/fame.js`**

Replace line 102 (`const PREFIX = { 'total-drama': 'td', 'big-brother': 'bb' };`) — delete it, and import the registry's function instead. At the top of `js/fame.js`:

```js
import { formatPrefix, DEFAULT_FORMAT } from './shows.js';
```

Then replace both uses. In `seasonChronology`:

```js
      seasonId: s.seasonId || `${formatPrefix(format)}-${s.seasonNumber}`,
```

and in `detailKey`:

```js
const detailKey = d => d.seasonId
  || `${formatPrefix(d.format || DEFAULT_FORMAT)}-${d.season}`;
```

`js/fame.js` currently declares its own `DEFAULT_FORMAT`-equivalent default inline as the string `'total-drama'` in several places; leave those, they are values not a map.

- [ ] **Step 5: Delete the duplicate in the worker**

In `worker/worker-studio.js`, delete `const SEASON_FILE_PREFIX = { 'big-brother': 'bb' };` (line ~547) and import the registry. At the top of the file:

```js
import { formatPrefix, DEFAULT_FORMAT } from '../js/shows.js';
```

Then in `publishSeason`, replace the filename line:

```js
    const file = format === DEFAULT_FORMAT
      ? `season${n}-data.json`
      : `${formatPrefix(format)}-${n}-data.json`;
```

`js/shows.js` imports nothing, so wrangler bundles it without further configuration.

- [ ] **Step 6: Drive `_rebuildByShow` from the registry**

In `js/stats-export.js`, replace the body of `_rebuildByShow`'s per-format branch with a registry lookup:

```js
function _rebuildByShow(player) {
  const byShow = {};
  for (const det of player.seasonDetails || []) {
    const format = det.format || DEFAULT_FORMAT;
    const bucket = (byShow[format] ||= { seasons: 0 });
    bucket.seasons++;
    // A show declares which fields it contributes; see SHOWS in js/shows.js.
    for (const [from, to] of (SHOWS[format]?.careerStats || [])) {
      const value = from.startsWith('bb.') ? (det.bb || {})[from.slice(3)] : det[from];
      bucket[to] = (bucket[to] || 0) + (value || 0);
    }
  }
  player.byShow = byShow;
  player.totalSeasons = (player.seasonDetails || []).length;
  return player;
}
```

Add `SHOWS` to the existing import from `./shows.js` at the top of `js/stats-export.js`.

- [ ] **Step 7: Run the tests to verify they pass**

Run: `node node_modules/vitest/vitest.mjs run tests/shows-registry.test.js tests/fame.test.js tests/fame-calibration.test.js tests/season-format.test.js tests/season-replacement.test.js`
Expected: PASS. `byShow` keys must be unchanged — the calibration and season-format suites assert on them, which is what proves the registry produces exactly what the branches did.

- [ ] **Step 8: Verify the worker still bundles**

Run: `node node_modules/wrangler/bin/wrangler.js deploy --config worker/wrangler.toml --dry-run`
Expected: builds with no unresolved import.

- [ ] **Step 9: Commit**

```bash
git commit -F - -- js/shows.js js/fame.js js/stats-export.js worker/worker-studio.js tests/shows-registry.test.js <<'EOF'
One registry, and a guard that keeps it one

The format-to-prefix map existed three times — js/shows.js, js/fame.js and
worker/worker-studio.js — and the worker's copy decides season filenames, so a
show missing from it writes its season over another show's file.

The guard asserts the shape of the code rather than its behaviour, because both
duplicates were written by someone who knew the rule.
EOF
```

---

### Task 3: The leaderboard learns which show you mean

**Files:**
- Create: `worker/queries.js`
- Modify: `worker/worker-studio.js` (`leaderboard`, ~line 199)
- Test: `tests/worker-sql.test.js`

**Interfaces:**
- Consumes: `SHOWS` from `js/shows.js`.
- Produces: `leaderboardQuery({ expr, dir, format }) → string` in `worker/queries.js`; `/api/leaderboard?format=<format>` restricts the appearances counted. Response gains `format` echoing what was applied (`'all'` when unfiltered).

**Why a separate module.** The worker builds its SQL as inline template strings, so a test cannot import them — it can only re-declare them, and a re-declared copy silently stops matching the code it claims to test. This project has already been bitten three times by exactly that (three prefix maps, two strip blocks). The queries move into `worker/queries.js` as pure functions taking no `env`, so the worker and the tests run **the same strings**.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run tests/worker-sql.test.js`
Expected: FAIL — cannot resolve `../worker/queries.js`.

- [ ] **Step 3: Create `worker/queries.js`**

Move the SQL out of the worker so the tests can run the real strings. Copy the
existing queries verbatim from `worker/worker-studio.js` (leaderboard ~line 209,
castmates ~line 262, bonds ~line 278), then apply the changes noted in the
comments:

```js
// worker/queries.js
// The SQL, as pure functions.
//
// Split out of worker-studio.js so the tests can run THE SAME STRINGS the worker
// runs. They were inline template strings, which a test can only re-declare —
// and a re-declared copy silently stops matching the code it claims to test.
// This project has been bitten by that three times.
//
// These take no `env` and touch no network: they build SQL and nothing else.

/**
 * The leaderboard.
 *
 * `expr` and `dir` come from the caller's own whitelist, never from a user.
 * `format` restricts which show's appearances are counted; null counts every
 * show, which is the DEFAULT and must stay that way — a Big Brother appearance
 * must never drop a player off a Total Drama board.
 *
 * Binds: [format?] , minSeasons, limit
 */
export function leaderboardQuery({ expr, dir, format = null }) {
  return `
    SELECT p.id, p.name, p.tier,
           ${expr} AS value,
           COUNT(*) AS seasonsPlayed
    FROM appearances a
    JOIN players p ON p.id = a.player_id
    LEFT JOIN td_appearances td
           ON td.player_id = a.player_id AND td.season_number = a.season_number
          AND a.format = 'total-drama'
    ${format ? 'WHERE a.format = ?' : ''}
    GROUP BY p.id, p.name, p.tier
    HAVING COUNT(*) >= ?
    ORDER BY value ${dir}, seasonsPlayed DESC, p.name ASC
    LIMIT ?`;
}

/**
 * Everybody who played a season with this player.
 *
 * "Same season" means same FORMAT and same number — without the format clause,
 * Total Drama 1 and Big Brother 1 would report each other's casts.
 *
 * The shared seasons carry their show: GROUP_CONCAT of the number alone yielded
 * "1,1" for a castmate shared across both shows, which cannot be told apart.
 *
 * Binds: playerId
 */
export function castmatesQuery() {
  return `SELECT p.id, p.name, p.tier,
                 COUNT(*) AS sharedSeasons,
                 GROUP_CONCAT(them.format || '-' || them.season_number) AS seasons
          FROM appearances me
          JOIN appearances them ON them.season_number = me.season_number
                               AND them.format = me.format
                               AND them.player_id <> me.player_id
          JOIN players p ON p.id = them.player_id
          WHERE me.player_id = ?
          GROUP BY p.id, p.name, p.tier
          ORDER BY sharedSeasons DESC, p.name ASC
          LIMIT 100`;
}

/**
 * Bonds, looked at from both sides.
 *
 * Many pairs are recorded from BOTH sides (a->b and b->a), hence DISTINCT or
 * allies show up twice.
 *
 * FORMAT is part of the identity. Without it, a pair bonded in Total Drama 1 AND
 * Big Brother 1 collapsed to a single row — one of the two relationships gone
 * from the response entirely, which is data loss rather than ambiguity.
 *
 * Binds: playerId (as ?1)
 */
export function bondsQuery() {
  return `SELECT DISTINCT
                 CASE WHEN b.player_id = ?1 THEN b.ally_id ELSE b.player_id END AS id,
                 p.name, b.format AS format, b.season_number AS season
          FROM bonds b
          JOIN players p ON p.id = CASE WHEN b.player_id = ?1 THEN b.ally_id ELSE b.player_id END
          WHERE b.player_id = ?1 OR b.ally_id = ?1
          ORDER BY b.format, b.season_number`;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node node_modules/vitest/vitest.mjs run tests/worker-sql.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Point the worker at the shared queries**

In `worker/worker-studio.js`, import them and delete the inline copies:

```js
import { leaderboardQuery, castmatesQuery, bondsQuery } from './queries.js';
```

In `leaderboard` (~line 199), after `minSeasons` is read:

```js
  // Which show's appearances to count. The DEFAULT IS EVERY SHOW, deliberately:
  // sub-project A's constraint is that a Big Brother appearance must never drop
  // a player off a Total Drama board, and changing the default would do exactly
  // that to every existing caller.
  const formatParam = params.get('format') || '';
  const format = SHOWS[formatParam] ? formatParam : null;
  if (formatParam && !format) {
    throw new ValidationError(
      `unknown format "${formatParam}" — valid: ${Object.keys(SHOWS).join(', ')}`);
  }
```

Replace the inline `const sql = ...` template with the imported builder, and bind
the format when there is one:

```js
  const sql = leaderboardQuery({ expr: stat.expr, dir: stat.dir, format });
  const binds = format ? [format, minSeasons, limit] : [minSeasons, limit];
  const { results } = await db(env).prepare(sql).bind(...binds).all();
```

And echo it in the response object beside `stat`:

```js
    format: format || 'all',
```

`SHOWS` must be imported at the top of `worker/worker-studio.js` from
`'../js/shows.js'` — Task 2 already adds that import for `formatPrefix`, so
extend it rather than adding a second import line.

- [ ] **Step 6: Verify the worker still bundles**

Run: `node node_modules/wrangler/bin/wrangler.js deploy --config worker/wrangler.toml --dry-run`
Expected: builds with no unresolved import.

**Do not deploy.** The controller holds all deploys for human review.

- [ ] **Step 7: Commit**

```bash
git commit -F - -- worker/worker-studio.js tests/worker-sql.test.js <<'EOF'
The leaderboard learns which show you mean

Six stats blended the shows, so Wayne read as a three-season player with no way
to ask for either show. The default stays all-shows: sub-project A's constraint
is that a Big Brother appearance must never drop a player off a Total Drama board.

Also the worker's first tests. node:sqlite runs the real queries against a real
database, which followups section 5 records as untested and able to regress green.
EOF
```

---

### Task 4: `/api/relationships` uses the shared queries

**Files:**
- Modify: `worker/worker-studio.js` (castmates ~line 262, bonds ~line 278, and the mapping ~line 296)
- Test: `tests/worker-sql.test.js` (written and passing in Task 3)

**Interfaces:**
- Consumes: `castmatesQuery()`, `bondsQuery()` from `worker/queries.js` (Task 3).
- Produces: `/api/relationships` bonds rows carry `format`; castmate `seasons` are `"<format>-<number>"` strings.

The SQL itself already exists and is tested — Task 3 built it. This task is the
swap, plus the one consumer that has to change with it.

- [ ] **Step 1: Replace both inline queries with the imported builders**

In `worker/worker-studio.js`, the castmates prepare (~line 262) and the bonds
prepare (~line 278) become:

```js
    d.prepare(castmatesQuery()).bind(slug),
```

```js
    d.prepare(bondsQuery()).bind(slug),
```

Delete the inline SQL and its comments — the comments moved to `worker/queries.js`
with the queries, and leaving a copy behind recreates the drift this split exists
to prevent.

- [ ] **Step 2: Fix the consumer that parses the seasons**

The mapping below (~line 296) parses the concatenated seasons as numbers, which
is no longer what they are:

```js
    castmates: (mates.results || []).map(m => ({
      ...m,
      // "total-drama-9,big-brother-1" — a season is a (format, number) pair now,
      // and "1,1" could not tell two shows apart.
      seasons: String(m.seasons || '').split(',').filter(Boolean),
    })),
```

This is a response-shape change: `seasons` was `number[]`, it is now `string[]`.
Nothing in this plan consumes it, and `leaderboards.html` is out of scope — note
it in the report so the final review can confirm no page breaks on it.

- [ ] **Step 3: Run the SQL tests**

Run: `node node_modules/vitest/vitest.mjs run tests/worker-sql.test.js`
Expected: PASS, 6 tests — unchanged from Task 3, because the queries did not
change. What this proves is that the worker now runs the tested strings.

- [ ] **Step 4: Verify the worker still bundles**

Run: `node node_modules/wrangler/bin/wrangler.js deploy --config worker/wrangler.toml --dry-run`
Expected: builds with no unresolved import.

**Do not deploy.** The controller holds all deploys for human review.

- [ ] **Step 5: Commit**

```bash
git commit -F - -- worker/worker-studio.js <<'EOF'
The relationships endpoint runs the tested queries

A pair bonded in Total Drama 1 and Big Brother 1 returned one row, because
SELECT DISTINCT ignored bonds.format — one relationship gone from the response,
not merely ambiguous. Castmate seasons carry their show too; "1,1" could not tell
them apart.

The SQL now lives in worker/queries.js, so what the tests run is what ships.
EOF
```

---

### Task 5: `seasons.html` and `awards.html`

**Files:**
- Modify: `seasons.html` (`renderSeasons`, line 360), `awards.html` (render block, line 384)
- Test: `tests/show-pages.e2e.test.js`

**Interfaces:**
- Consumes: `mountShowSwitcher`, `ALL`, `orderFormats`, `SHOW_SWITCHER_CSS` (Task 1); `SHOWS` from `js/shows.js`.
- Produces: both pages honour `?show=`; each season card carries a show badge.

- [ ] **Step 1: Write the failing test**

```js
// tests/show-pages.e2e.test.js
// The pages in a real browser, driven by URL rather than by clicking — which is
// the reason the switcher's state lives in the URL at all.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const BASE = 'http://localhost:4179';
let server, browser;

beforeAll(async () => {
  server = spawn('python', ['serve.py', '4179'], { cwd: process.cwd(), stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2500));
  browser = await chromium.launch();
}, 60000);

afterAll(async () => { await browser?.close(); server?.kill(); });

const open = async (path) => {
  const page = await browser.newPage();
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  return page;
};

describe('seasons.html', () => {
  it('shows both shows, under their own headings', async () => {
    const page = await open('/seasons.html');
    const headings = await page.$$eval('[data-show-group]', els => els.map(e => e.dataset.showGroup));
    expect(headings).toEqual(['total-drama', 'big-brother']);
    expect(await page.$$eval('[data-season-format]', e => e.length)).toBe(15);
    await page.close();
  });

  it('narrows to one show from the URL', async () => {
    const page = await open('/seasons.html?show=big-brother');
    const formats = await page.$$eval('[data-season-format]', els =>
      [...new Set(els.map(e => e.dataset.seasonFormat))]);
    expect(formats).toEqual(['big-brother']);
    expect(await page.$$eval('[data-season-format]', e => e.length)).toBe(1);
    await page.close();
  });

  it('treats a nonsense show as all of them', async () => {
    const page = await open('/seasons.html?show=wrestling');
    expect(await page.$$eval('[data-season-format]', e => e.length)).toBe(15);
    await page.close();
  });
});

describe('awards.html', () => {
  it('narrows to one show from the URL', async () => {
    const page = await open('/awards.html?show=big-brother');
    const formats = await page.$$eval('[data-season-format]', els =>
      [...new Set(els.map(e => e.dataset.seasonFormat))]);
    expect(formats).toEqual(['big-brother']);
    await page.close();
  });
});

describe('rankings.html', () => {
  it('says why a show has no board yet', async () => {
    const page = await open('/rankings.html?show=big-brother');
    expect(await page.textContent('body')).toMatch(/No Big Brother rankings yet/);
    await page.close();
  });

  it('still ranks Total Drama, with fame stars', async () => {
    const page = await open('/rankings.html?show=total-drama');
    expect(await page.$$eval('.fame-rating', e => e.length)).toBeGreaterThan(0);
    await page.close();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run tests/show-pages.e2e.test.js`
Expected: FAIL — no `[data-show-group]` or `[data-season-format]` elements exist.

- [ ] **Step 3: Wire `seasons.html`**

Add a mount point above the grid (near `<div id="seasons-grid">`):

```html
<div id="show-switcher" style="margin:0 0 16px;"></div>
```

Add a module script before the closing `</body>`:

```html
<script type="module">
  import { mountShowSwitcher, orderFormats, ALL, SHOW_SWITCHER_CSS } from './js/show-switcher.js';
  import { SHOWS, DEFAULT_FORMAT } from './js/shows.js';
  const style = document.createElement('style');
  style.textContent = SHOW_SWITCHER_CSS;
  document.head.appendChild(style);
  window.showSwitcher = { mountShowSwitcher, orderFormats, ALL, SHOWS, DEFAULT_FORMAT };
</script>
```

Then change `renderSeasons` (line 360) to group. Replace its body's grid write with:

```js
function renderSeasons(seasons) {
  const grid = document.getElementById('seasons-grid');
  const { mountShowSwitcher, orderFormats, ALL, SHOWS, DEFAULT_FORMAT } = window.showSwitcher;

  if (!window._sw) {
    const formats = orderFormats(seasons.map(s => s.format || DEFAULT_FORMAT));
    window._sw = mountShowSwitcher(document.getElementById('show-switcher'),
      { formats, onChange: () => renderSeasons(seasons) });
  }

  const show = window._sw.current();
  const visible = show === ALL ? seasons : seasons.filter(s => (s.format || DEFAULT_FORMAT) === show);
  if (!visible.length) {
    grid.innerHTML = '<div style="text-align:center;padding:60px;opacity:.5;grid-column:1/-1">No seasons found</div>';
    return;
  }

  const card = (season, idx) => `<!-- existing card markup, with these two additions:
       data-season-format="${season.format || DEFAULT_FORMAT}" on the outer element,
       and a badge inside:
       <span class="season-show-badge">${(SHOWS[season.format || DEFAULT_FORMAT] || {}).short || ''}</span> -->`;

  if (show !== ALL) {
    grid.innerHTML = visible.map(card).join('');
  } else {
    // Real headings, so one Big Brother season reads as deliberate rather than lost.
    const groups = orderFormats(visible.map(s => s.format || DEFAULT_FORMAT));
    grid.innerHTML = groups.map(f => {
      const mine = visible.filter(s => (s.format || DEFAULT_FORMAT) === f);
      return `<h2 data-show-group="${f}" style="grid-column:1/-1;margin:18px 0 4px;font-size:15px;`
           + `letter-spacing:.08em;text-transform:uppercase;opacity:.65;">`
           + `${(SHOWS[f] || {}).emoji || ''} ${(SHOWS[f] || {}).name || f}`
           + `<span style="opacity:.6;font-weight:400;"> · ${mine.length}</span></h2>`
           + mine.map(card).join('');
    }).join('');
  }
  document.getElementById('seasons-count').innerHTML = `${visible.length} season${visible.length === 1 ? '' : 's'}`;
}
```

Keep the existing card markup exactly as it is — only add the `data-season-format` attribute and the badge span.

- [ ] **Step 4: Wire `awards.html` the same way**

`awards.html` renders at line 384-385 from the same `seasons_database.json`. Apply the identical pattern: a `#show-switcher` mount above `#awards-grid`, the same module script, and the same group/filter logic wrapped around its existing card markup, adding `data-season-format` to each card.

- [ ] **Step 5: Run the page tests**

Run: `node node_modules/vitest/vitest.mjs run tests/show-pages.e2e.test.js`
Expected: the `seasons.html` and `awards.html` cases PASS; the two `rankings.html` cases still FAIL (Task 6).

- [ ] **Step 6: Commit**

```bash
git commit -F - -- seasons.html awards.html tests/show-pages.e2e.test.js <<'EOF'
Seasons and awards say which show they are

Everything visible by default under per-show headings, with ?show= narrowing to
one — which is also how the tests drive them, rather than by clicking.
EOF
```

---

### Task 6: `rankings.html` — the board, the empty state, the stars

**Files:**
- Modify: `rankings.html` (`renderRankings`, line 924; `renderPlayerCard`, line 1038)
- Test: `tests/show-pages.e2e.test.js` (already written in Task 5)

**Interfaces:**
- Consumes: `mountShowSwitcher` etc. (Task 1); `computeFame` from `js/fame.js`; `renderStars`, `FAME_STAR_CSS` from `js/fame-stars.js`.
- Produces: rankings honours `?show=`; a show with no board shows the empty state; player rows carry fame stars.

- [ ] **Step 1: Add the switcher and the empty state**

Add a `#show-switcher` mount above `#rankings-container`, and the same module script as Task 5 plus fame:

```html
<script type="module">
  import { mountShowSwitcher, orderFormats, ALL, SHOW_SWITCHER_CSS } from './js/show-switcher.js';
  import { SHOWS, DEFAULT_FORMAT } from './js/shows.js';
  import { computeFame } from './js/fame.js';
  import { renderStars, FAME_STAR_CSS } from './js/fame-stars.js';
  const style = document.createElement('style');
  style.textContent = SHOW_SWITCHER_CSS + FAME_STAR_CSS;
  document.head.appendChild(style);
  window.showSwitcher = { mountShowSwitcher, orderFormats, ALL, SHOWS, DEFAULT_FORMAT };
  window.fame = { computeFame, renderStars };
</script>
```

In `renderRankings` (line 924), before building the board:

```js
  const { mountShowSwitcher, orderFormats, ALL, SHOWS, DEFAULT_FORMAT } = window.showSwitcher;
  const boards = Array.isArray(rankingsData) ? rankingsData : [rankingsData];
  // Every show that has any data, not only the ones with a board — otherwise a
  // show could never be selected to discover that it has no rankings yet.
  const formats = orderFormats([
    ...boards.map(b => b?.metadata?.format || DEFAULT_FORMAT),
    ...(window._allFormats || []),
  ]);

  if (!window._sw) {
    window._sw = mountShowSwitcher(document.getElementById('show-switcher'),
      { formats, onChange: () => renderRankings(rankingsData, playersMap) });
  }
  const show = window._sw.current();
  const board = show === ALL
    ? boards.find(b => (b?.metadata?.format || DEFAULT_FORMAT) === DEFAULT_FORMAT)
    : boards.find(b => (b?.metadata?.format || DEFAULT_FORMAT) === show);

  if (!board) {
    const name = (SHOWS[show] || {}).name || show;
    document.getElementById('rankings-container').innerHTML =
      `<div style="text-align:center;padding:64px 24px;opacity:.75;">`
      + `<div style="font-size:34px;margin-bottom:10px;">${(SHOWS[show] || {}).emoji || '📋'}</div>`
      + `<h2 style="margin:0 0 8px;font-size:19px;">No ${name} rankings yet</h2>`
      + `<p style="margin:0;opacity:.7;max-width:420px;margin-inline:auto;line-height:1.55;">`
      + `Rankings are generated from <strong>current-season.html</strong> once a season is finished. `
      + `${name} seasons are already recorded — the board just has not been built.</p></div>`;
    return;
  }
```

`window._allFormats` is set where the page loads `players_database.json`:

```js
  window._allFormats = [...new Set((playersData.players || [])
    .flatMap(p => (p.seasonDetails || []).map(d => d.format || 'total-drama')))];
```

- [ ] **Step 2: Put fame stars on the player rows**

The page already loads `players_database.json`. Load the other two databases beside it and compute fame once:

```js
  const [seasonsDb, franchiseDb] = await Promise.all([
    fetch('seasons_database.json').then(r => r.json()).catch(() => ({ seasons: [] })),
    fetch('franchise_database.json').then(r => r.json()).catch(() => ({})),
  ]);
  window._fame = window.fame.computeFame({
    players: playersData, rankings: rankingsData, seasons: seasonsDb, franchise: franchiseDb,
  });
```

In `renderPlayerCard` (line 1038), add the stars beside the player's name:

```js
  const fame = window._fame?.get(ranking.playerId);
  const stars = fame ? window.fame.renderStars(fame) : '';
```

and place `${stars}` in the card's name row.

- [ ] **Step 3: Run the page tests**

Run: `node node_modules/vitest/vitest.mjs run tests/show-pages.e2e.test.js`
Expected: PASS, 6 tests — including the Big Brother empty state and stars on the Total Drama board.

- [ ] **Step 4: Look at it**

```bash
python serve.py 4173
```

Open `http://localhost:4173/rankings.html`, switch to Big Brother, confirm the empty state reads correctly and switching back restores the board. Confirm the browser back button returns to the previous show. Check the console is clean.

- [ ] **Step 5: Commit**

```bash
git commit -F - -- rankings.html tests/show-pages.e2e.test.js <<'EOF'
Rankings are per show, and say so when a show has none

A show with no board explains where boards come from rather than looking broken,
and it disappears on its own the day one is generated. Fame stars ride along on
the rows, which is the page they add most to.
EOF
```

---

## Self-Review

**Spec coverage.** Every section maps to a task: the switcher module and its URL state (Task 1); one registry, both duplicate prefix maps deleted, `careerStats` replacing the `_rebuildByShow` branch, and the guard (Task 2); the leaderboard `format` with an unchanged default plus the first worker SQL tests (Task 3); the bonds collapse and the `"1,1"` castmate ambiguity (Task 4); `seasons.html` and `awards.html` grouped with badges (Task 5); `rankings.html` with the empty state and fame stars (Task 6).

The spec's "adding a show costs" checklist is documentation, carried in the spec itself rather than duplicated into a task.

**Deliberately not covered**, matching the spec: `compare`, `franchise`, `timeline`, the leaderboards *page* UI, authoring a Big Brother ranking board, extracting a shared page shell, and `franchise.totalSeasons`.

**Type consistency.** `mountShowSwitcher(mountEl, { formats, onChange })` returning `{ current(), set(), destroy() }` is used identically in Tasks 1, 5 and 6. `ALL` is imported, never the literal `'all'`. `orderFormats` takes and returns an array of format strings throughout. `SHOWS[format].careerStats` is defined in Task 2 and consumed only there. `computeFame({ players, rankings, seasons, franchise })` in Task 6 matches the signature shipped in sub-project F.

**One risk worth naming.** Tasks 5 and 6 edit large HTML files whose render functions build markup as template strings. The instruction throughout is to keep the existing card markup and only add `data-season-format` and a badge — the grouping wraps the existing output rather than rewriting it. A reviewer should reject any diff that rewrites a card's internals, because that is how a "filter" task silently becomes a redesign.
