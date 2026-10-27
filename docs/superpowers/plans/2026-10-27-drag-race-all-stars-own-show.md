# Drag Race All Stars as its own show — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (inline — this project uses no subagents). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drag Race All Stars becomes its own registered show (`drag-race-all-stars`, seasons `dras-1`, `dras-2`…) that runs the Drag Race engine, sits under Drag Race in a family toggle on the site, and counts in Drag Race careers and rankings while its winners are marked as Hall of Fame inductees.

**Architecture:** A spin-off is a registry entry with `engine` and `family` fields. **The season's identity lives on `seasonConfig.format` and the published document; episode rows keep the ENGINE's stamp (`ep.format === 'drag-race'`)**, because a row's format answers "which renderer draws me", and every viewer check already asks that. So only identity readers (numbering, keys, export, calendar, careers, site) and config-level engine checks change; the ~16 row checks and the whole `js/vp-dr/` tree do not. This is the pattern Secret Story will reuse on Big Brother.

**Tech Stack:** ES modules, no build step; vitest + jsdom; Cloudflare worker (`worker/worker-studio.js` imports `js/shows.js`).

**Spec:** the decisions below (agreed with the user, 2026-10-27). Background: `docs/ADDING-A-SHOW.md` §1, §5.1, §8.3, §9, §13; `docs/drag-race.md`; `docs/superpowers/specs/2026-09-08-drag-race-all-stars-design.md`.

## Decisions (from the user)

- Own registry entry, prefix **`dras`** (not `as` — other shows will have All Stars too). Permanent once published.
- Still related to Drag Race: one family on the site, a tab to switch `Drag Race | All Stars`.
- All Stars wins are **legitimate**: they count in the queen's Drag Race career totals and on the Drag Race rankings board.
- Something must still distinguish an All Stars winner from a first-time winner. The real show's answer: the All Stars winner is **inducted into the Drag Race Hall of Fame**. Use that — a badge and trivia lines.

## Global Constraints

- Slug `drag-race-all-stars`, prefix `dras`, name `Drag Race All Stars`, short `DRAS`. A bare integer is still Total Drama.
- Episode rows produced by the engine keep `format: 'drag-race'`. Never stamp a row `drag-race-all-stars`.
- Every identity check goes through `js/shows.js` helpers (`engineOf`, `familyOf`); no new `=== 'drag-race-all-stars'` literals outside the registry (the `show-list-duplication` guard counts them).
- Only `dr-1` is published today and no All Stars season exists: no data migration, but legacy readers must still accept a row `{ format: 'drag-race', allStars: true }`.
- There is no vote on this show; nothing written here may imply one.
- Commit by path after each task (`git commit -- <paths>`), push at the end. Another session has uncommitted PM work in `js/pm/` and `js/vp-pm/` — never stage it.

## Review Focus

1. **A saved config `{ format: 'drag-race', drAllStars: true }`** (old save, live slot, test fixture) must load as the All Stars show, not as Drag Race season N with All Stars rules. → Task 2 test `legacy all-stars config is read as the spin-off`.
2. **Switching the setup dropdown DR → DRAS → DR** must leave `drAllStars` false on Drag Race. → Task 2 test `drag race never carries all-stars rules`.
3. **Publishing `dras-1` must not touch `dr-1`.** Strip/merge keys on (format, number); a number-only key would wipe a queen's Season 1 row. → Task 3 test `dras-1 merge leaves dr-1 details alone`.
4. **An All Stars queen's past reads both series** — her Season 1 run and an earlier All Stars. → Task 4 test.
5. **`?show=drag-race` remembered in sessionStorage** while the page now offers a family: the switcher must not land on an empty sub-tab. → Task 7 test.

---

### Task 1: The registry entry and its helpers

**Files:**
- Modify: `js/shows.js` (new entry after `'drag-race'`; remove the parent's `allStars` sub-object; new exports), `js/core.js:2096-2112` (`engineFormat`, `twistsForFormat`)
- Modify (only where Step 2 reports a failure): the map-shaped per-show files `js/settings.js`, `js/quick-setup.js`, `js/social/adapter.js`, `js/ranking-boards.js`, `js/rankings-update.js`, `js/player-trivia.js`, `worker/worker-season-live.js`
- Test: `tests/dras-registry.test.js`

**Interfaces — Produces:**
- `SHOWS['drag-race-all-stars']` with `prefix: 'dras'`, `engine: 'drag-race'`, `family: 'drag-race'`, `familyTab: 'All Stars'`, `spinOff: { after: 3 }`, `airSlots: ['summer']`, `airNight: 5`, `runnableFlag: '_drRunnable'`, and `words`/`careerStats`/`articleStats`/`audience`/`roundShape`/`roundsPath` copied from the parent by spreading `SHOWS['drag-race']` fields (so they cannot drift). Parent gains `familyTab: 'Drag Race'`.
- `engineOf(format: string): string` — `SHOWS[f]?.engine || f`.
- `familyOf(format: string): string` — `SHOWS[f]?.family || f`.
- `familyMembers(format: string): string[]` — every registry key whose `familyOf` equals `familyOf(format)`, parent first.
- `seasonRowFormat(row): string` — `row.format`, except a legacy `{ format: 'drag-race', allStars: true }` returns `'drag-race-all-stars'`.
- `engineFormat(source): string` in `js/core.js` — `engineOf(seasonFormat(source))`.
- `twistsForFormat(source)` filters by `twistFormat(t) === engineFormat(source)`.

- [ ] **Step 1: Write the failing test** `tests/dras-registry.test.js`:
  - `parseSeasonRef('dras-2')` → `{ format: 'drag-race-all-stars', number: 2 }`; `seasonId('drag-race-all-stars', 1)` → `'dras-1'`; `parseSeasonRef('dr-1').format` is still `'drag-race'`.
  - `engineOf('drag-race-all-stars') === 'drag-race'`, `engineOf('big-brother') === 'big-brother'`; `familyOf` likewise; `familyMembers('drag-race-all-stars')` → `['drag-race', 'drag-race-all-stars']`.
  - `showWords('drag-race-all-stars').exit === 'sashayed away'` and `.host === 'RuPaul'`.
  - `twistsForFormat({ format: 'drag-race-all-stars' })` contains `dr-legacy` and no Total Drama twist.
  - `seasonRowFormat({ format: 'drag-race', allStars: true }) === 'drag-race-all-stars'`.
- [ ] **Step 2: Run it, then run the 25 registry-iterating tests** (`tests/{aired-exit-interview,calendar-run-length,current-season-show-scope,dr-franchise,dr-readers,dr-run-ui,dr-setup,format-select-every-show,franchise-calendar,franchise-meta-ui,live-sync-show,rankings-builder,ratings,season-format,show-list-duplication,show-vocabulary,shows-registry,shows,social-packs,studio-portraits,studio-voice-help,tr-audience,tr-rankings,traitors-registry,wiki-fill-record}.test.js`) on HEAD first and save the list of failures that already exist.
  Expected: the new test fails on missing exports.
- [ ] **Step 3: Implement the entry and helpers.** Then re-run the 25. Each NEW failure is a per-show map missing the new key: fix each by reading `MAP[format] ?? MAP[familyOf(format)]` in that file's lookup, never by copying the Drag Race entry under a second key. The calendar failures belong to Task 5 — leave them red and note them.
- [ ] **Step 4: Run** `npx vitest run tests/dras-registry.test.js` plus the 25. Expected: new test PASS; no failures beyond the HEAD list and the calendar ones.
- [ ] **Step 5: Commit** `git commit -- js/shows.js js/core.js tests/dras-registry.test.js <map files touched> -m "shows: Drag Race All Stars registered as its own show on the drag engine"`

### Task 2: The engine plays an All Stars season under the new show

**Files:**
- Modify: `js/dr-run.js:60` (`isDragSeason` → `engineFormat(seasonConfig) === DRAG_FORMAT`; config built at ~635 sets `drAllStars` from the show), `js/run-ui.js:314-317, 476, 3268`, `js/cast-ui.js:1329, 1488-1512, 1712-1727, 2140, 2606`, `js/players.js:73`, `js/quick-setup.js:57` — each a config-level check becomes `engineFormat(...)`
- Modify: the config load/repair path in `js/core.js` (where defaults at ~2204 are merged) for the legacy migration
- Modify: `simulator.html` — the `cfg-dr-all-stars` select shows only on the All Stars show and offers `legacy` / `save` (no `off`)
- Test: `tests/dras-season.test.js`

**Interfaces — Consumes:** Task 1 helpers. **Produces:** `drAllStarsFor(config): boolean` in `js/dr-run.js` — `engineFormat(config) === DRAG_FORMAT && !!SHOWS[seasonFormat(config)]?.spinOff` (registry-driven, no slug literal). The engine keeps reading `seasonConfig.drAllStars`; `drAllStarsFor` is what sets it.

- [ ] **Step 1: Write the failing tests** in `tests/dras-season.test.js` (headless season, the `dr-*` test harness pattern):
  - `all-stars season runs under its own show`: config `{ format: 'drag-race-all-stars', seasonNumber: 1 }` with a 10-queen cast plays to a winner; `seasonConfig.drAllStars === true`; every `gs.episodeHistory` row has `format === 'drag-race'`; the lipstick/legacy result appears at least once; `episodeKey(1, 1, seasonConfig.format) === 'dras_episode_s1_e1'`.
  - `legacy all-stars config is read as the spin-off`: loading `{ format: 'drag-race', drAllStars: true }` yields `seasonFormat(config) === 'drag-race-all-stars'`.
  - `drag race never carries all-stars rules`: `{ format: 'drag-race', drAllStars: true }` after setup read with format set back to `drag-race` from the dropdown yields `drAllStars === false`.
- [ ] **Step 2: Run** `npx vitest run tests/dras-season.test.js`. Expected: FAIL (`isDragSeason()` false for the new slug).
- [ ] **Step 3: Implement** the check conversions and the migration. The legacy rule lives in ONE function in the config repair path; the dropdown read in `cast-ui.js` sets `drAllStars = drAllStarsFor(config)` and keeps `drAllStarsRule` from the select.
- [ ] **Step 4: Run** the new test, `tests/dr-*.test.js` and `tests/dr-all-stars*.test.js` (whatever exists). Expected: new PASS; no new failures vs HEAD.
- [ ] **Step 5: Playwright check**: open `simulator.html`, pick Drag Race All Stars, cast, run two episodes; the stepped viewer draws them and the setup shows the legacy/save select only on this show. Screenshot to the scratchpad.
- [ ] **Step 6: Commit** by path: `"dr: an All Stars season plays as its own show; rows keep the engine's stamp"`

### Task 3: Export and publish as `dras-N`

**Files:**
- Modify: `js/stats-export.js:2480-2700, 3720-3806` (`mergeDragSeason`, `mergeDragSeasonsDatabase`, `exportDragRaceSeason`; register the exporter for the new slug too), `js/stats-export.js:90-94` (`_winnerBadge`), `js/dr/export.js:24-30, 265, 352` (format and `PREFIX` from the document/config, not the constant), `js/dr/ledger-record.js:32`, `js/kristal-exit.js` / `js/exit-interview/shows.js` (exit interviews keyed by the season's format)
- Test: `tests/dras-export.test.js`

**Interfaces — Produces:** season document and seasons-db row with `format: 'drag-race-all-stars'`, `seasonId: 'dras-N'`, title default `Drag Race All Stars N`, `hallOfFame: true` on the row; player `seasonDetails[]` entries with `format: 'drag-race-all-stars'` and the usual `dr` stat block; winner badge string `DRAS{N} Winner`.

- [ ] **Step 1: Write the failing tests:**
  - `exports an all-stars season as dras`: export after the Task 2 season → `doc.format === 'drag-race-all-stars'`, `doc.seasonId === 'dras-1'`, download filename `dras-1-data.json`.
  - `dras-1 merge leaves dr-1 details alone`: a players db holding a queen's `dr-1` detail, merged with a `dras-1` document → she has two details (`drag-race`/1 and `drag-race-all-stars`/1); re-merging `dras-1` still leaves exactly two.
  - `seasons db keeps both rows`: `mergeDragSeasonsDatabase` with `dr-1` already present → two rows, keys `(drag-race,1)` and `(drag-race-all-stars,1)`; the new row has `hallOfFame: true` and no `allStars` flag.
  - `the merges refuse another family`: a Big Brother document still throws.
- [ ] **Step 2: Run** — expected FAIL on the format check (`seasonDoc.format !== DRAG_FORMAT`).
- [ ] **Step 3: Implement**: the guards become `familyOf(seasonDoc.format) === DRAG_FORMAT`; every `DRAG_FORMAT` used as an identity in those functions (strip, filter, seasonId, title, castPhotoPath, `_airWindowFor`, filename, publish payload) becomes `seasonDoc.format`; `SHOWS[DRAG_FORMAT].words` reads stay (shared words). Delete the `allStars` sniffing at 2632 in favour of the format.
- [ ] **Step 4: Run** the new test plus `tests/dr-export*.test.js`, `tests/stats-export*.test.js`. Expected: PASS, nothing new red.
- [ ] **Step 5: Commit** by path: `"export: an All Stars season publishes as dras-N beside the main series"`

### Task 4: A queen's past reads the whole family

**Files:**
- Modify: `js/dr-run.js:570-615` (`loadDragHistory`, `_pastDragSeasons`: accept `familyMembers(DRAG_FORMAT)` and fetch each season's own file by its format), `js/genealogy-tab.js:50-51`, `js/wiki-view.js:991`, `player.html:941`, `js/kristal.js:247`, `js/dr/genealogy.js` (its `drag-race` match; it is detected as binary by grep — read it with an editor), `js/franchise-carry.js` if it filters by `=== DRAG_FORMAT`
- Test: `tests/dras-history.test.js`

- [ ] **Step 1: Write the failing test**: ledger with `dr-1` (queen A placed 9th) and `dras-1` (A placed 2nd) → the history `js/dr/past.js` builds for A for an `dras-2` season names both appearances, in air order; genealogy-tab's season list for A contains `dr-1` and `dras-1`.
- [ ] **Step 2: Run** — expected FAIL (only `dr-1` seen).
- [ ] **Step 3: Implement** every listed check as `familyOf(x) === DRAG_FORMAT`; season file paths by `seasonId(format, num)`.
- [ ] **Step 4: Run** the test and `tests/dr-past*.test.js`, `tests/dr-franchise.test.js`. Expected: PASS.
- [ ] **Step 5: Commit** by path: `"dr: a queen's past and family read both series"`

### Task 5: The calendar schedules All Stars as the spin-off

**Files:**
- Modify: `js/franchise-calendar.js:127-128, 260, 295-340` (`nextAllStarsWindow(seasons, format)` takes the spin-off's slug, reads `SHOWS[format].spinOff.after` and `airSlots`, counts flagships from `SHOWS[format].family`; rows compared with `seasonRowFormat`), `js/calendar-view.js:110-200, 530-535` (labels from the registry: `DRAS3`, `Drag Race All Stars 3`), `js/air-watch.js:109`, `js/cast-ui.js:1329`, `js/stats-export.js:2268-2291`
- Test: update `tests/franchise-calendar.test.js` fixtures, add cases to `tests/dras-registry.test.js`

- [ ] **Step 1: Write the failing tests**: with three aired `drag-race` rows, `nextAllStarsWindow(rows, 'drag-race-all-stars')` returns a summer window with `number: 1`; adding a `{ format: 'drag-race-all-stars' }` row moves the next to a year later with `number: 2`; the SAME results when that row is the legacy `{ format: 'drag-race', allStars: true }`; `nextWindowFor(rows, 'drag-race')` ignores All Stars rows of both shapes.
- [ ] **Step 2: Run** — expected FAIL, plus the Task 1 calendar failures.
- [ ] **Step 3: Implement.** `nextAllStarsWindow(seasons, 'drag-race')` (the parent slug) keeps working by mapping to the family's spin-off, so callers can move one at a time.
- [ ] **Step 4: Run** `tests/franchise-calendar.test.js`, `tests/calendar-run-length.test.js`, the new cases. Expected: PASS.
- [ ] **Step 5: Commit** by path: `"calendar: All Stars airs on its own show's schedule"`

### Task 6: Careers, rankings and the Hall of Fame

**Files:**
- Modify: `js/stats-export.js:199-219` (`_rebuildByShow`: bucket by `familyOf(format)`; add `player.hallOfFame = [{ seasonId, format }]` for every detail with `placement === 1` on a show with `spinOff`), `js/ranking-boards.js:54` (`boardFile(familyOf(format))`), `js/rankings-update.js:1059` (`_ruRubric(familyOf(...))`), `js/wiki-view.js` / `player.html` (a Hall of Fame line on the career block, beside the winner badges), `js/player-trivia.js`
- Test: `tests/dras-career.test.js`

**Interfaces — Produces:** `player.byShow['drag-race']` totals include All Stars details; `player.byShow` has no `drag-race-all-stars` bucket; `player.hallOfFame` array (empty when none).

- [ ] **Step 1: Write the failing tests:**
  - `all-stars wins count in the drag career`: a queen with `dr-1` (3 maxi wins) and `dras-1` (2 maxi wins, winner) → `byShow['drag-race'].totalMaxiWins === 5`, `.seasons === 2`, `hallOfFame` = `[{ seasonId: 'dras-1', format: 'drag-race-all-stars' }]`.
  - `a main-season winner is not in the Hall of Fame`: winner of `dr-1` only → `hallOfFame` empty, badge `DR1 Winner`.
  - `the drag board ranks both series`: `boardFile('drag-race-all-stars') === 'rankings_dr.json'`; `_ruRubric('drag-race-all-stars')` is the Drag Race rubric.
  - Trivia (`playerTriviaFor(..., 'drag-race')`) with exact strings:
    - `"A was inducted into the Drag Race Hall of Fame on All Stars 1, after placing 9th on Drag Race 1."`
    - first inductee ever: `"A was the first queen inducted into the Drag Race Hall of Fame."`
    - won both: `"A won Drag Race 1 and was later inducted into the Hall of Fame on All Stars 2."`
    - never for a queen with no All Stars win.
- [ ] **Step 2: Run** — expected FAIL.
- [ ] **Step 3: Implement.** Trivia lines take the queen's original placement from her earliest `drag-race` detail and use `nth()`; the season names come from `showName()` + number, never typed. The career page shows `👑 Hall of Fame · All Stars 1` next to the badges; words from the registry.
- [ ] **Step 4: Run** the new test plus `tests/rankings-builder.test.js`, `tests/stats-export*.test.js`, `tests/player-trivia*.test.js`. Expected: PASS.
- [ ] **Step 5: Commit** by path: `"careers: All Stars counts for the queen and inducts its winner into the Hall of Fame"`

### Task 7: The family toggle on the site

**Files:**
- Modify: `js/show-switcher.js` (`mountShowSwitcher` renders one top button per family, `orderFormats` on families; a second row `familyTab` labels when the active family has more than one member), `js/site-header.js:336-337`, check `seasons.html`, `rankings.html`, `awards.html`, `js/franchise-ui.js` mounts
- Test: `tests/show-switcher-family.test.js` (jsdom)

**Interfaces — Produces:** URL stays `?show=<slug>`; `?show=drag-race-all-stars` lights the Drag Race family button and the All Stars tab; `?show=drag-race` lights the Drag Race tab.

- [ ] **Step 1: Write the failing tests:**
  - top row has `Object.keys(SHOWS).length - 1` show buttons (+ All); exactly one says Drag Race.
  - clicking the family button with nothing remembered selects `drag-race`; the sub-row reads `Drag Race | All Stars`.
  - clicking All Stars sets `?show=drag-race-all-stars` and calls `onChange('drag-race-all-stars')`.
  - sessionStorage holding `drag-race-all-stars` on a page whose `formats` list lacks it falls back to `drag-race`, never an empty selection.
  - a family with one member (Big Brother today) draws no sub-row.
- [ ] **Step 2: Run** — expected FAIL.
- [ ] **Step 3: Implement**, styles added to `SHOW_SWITCHER_CSS` (sub-row smaller, family accent).
- [ ] **Step 4: Run** the test and `tests/show-switcher*.test.js`, `tests/current-season-show-scope.test.js`. Expected: PASS. Then Playwright on `seasons.html` at desktop and 390px width: the row does not wrap past two lines; screenshot to the scratchpad.
- [ ] **Step 5: Commit** by path: `"site: spin-offs sit under their show as a tab"`

### Task 8: Read it, document it, ship it

**Files:**
- Modify: `docs/ADDING-A-SHOW.md` (new section: *A spin-off of an existing show* — `engine`/`family`/`spinOff`, rows stamp the engine, identity on the config, the family toggle; the §13 commands re-run with the new counts), `docs/drag-race.md` (All Stars is now `drag-race-all-stars`), `CLAUDE.md` Drag Race section (one line)

- [ ] **Step 1: Run the guard and the audit**: `npx vitest run tests/show-list-duplication.test.js` and `npm run audit:dr-spec`. Expected: guard PASS; audit rates unchanged vs HEAD (the engine did not change).
- [ ] **Step 2: Play and read**: one full All Stars season headless, export it, print the document's title, `seasonId`, placements and the winner's trivia; read them for Drag Race words (no vote, no "evicted") and for `dras` everywhere a prefix shows.
- [ ] **Step 3: Write the docs.**
- [ ] **Step 4: Commit** by path and **push**.
- [ ] **Step 5: Ask the user before deploying the worker** (it imports `js/shows.js`, so publishing a `dras` season needs the new registry live there). Deploy only on their yes.
