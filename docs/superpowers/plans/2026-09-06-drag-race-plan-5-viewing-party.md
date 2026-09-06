# Drag Race Plan 5 — The viewing party, and the track record chart

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Watch an episode. Sixteen screens in the running order, each with its own atmosphere, click-to-reveal, and a live sidebar — plus the track record chart, which is this show's signature screen and the thing the community actually reads.

**Architecture:** `js/vp-dr/` holds one file per screen group and a registry (`screens.js`) that the viewing party and the text backlog both read, so the transcript can never quietly stop mentioning a screen. Every screen renders from the episode ROW, never from live state. The chart is built by `js/dr/grid.js` — created in Plan 4 for the season page — so there is one grid in the codebase with three readers.

**Tech Stack:** ES modules, inline CSS per screen family, no build step, no external assets. CSS-only icons, never emoji. Vitest for the render sweeps; Playwright for the screenshots.

**Spec:** `docs/superpowers/specs/2026-09-06-drag-race-design.md` §10, and the project's VP rules in `CLAUDE.md` (overdrive is the baseline, DOM-only reveals, live sidebar, `top:46px`, reduced-motion fallbacks).

**Depends on:** Plans 1–4.

## Global Constraints

- Everything in Plan 1's Global Constraints still applies, with the trailer
  ```
  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Y4XaJLLRHojvnzFuEVJsAt
  ```
- **A screen reads the row, never live state.** Every panel takes its numbers from `ep.dr`. A screen that calls a simulation function is the bug class the manual's §11.5B is entirely about: replaying episode 4 must show episode 4.
- **No emoji anywhere.** Icons are CSS or inline SVG, from one `_icon(type)` helper.
- **Unique visual identity.** Class prefix `dr-`. Two fonts. `max-width:1100px;margin:0 auto`. Atmosphere layers start at `top:46px` so they never cover the nav. `@media(prefers-reduced-motion:reduce)` on every animation.
- **DOM-only reveals.** `_reapplyVisibility(suffix, idx, total)` loops 0→idx and toggles classes by id; nothing rebuilds the page. Sidebars update by `innerHTML` replacement on a known id, called from BOTH `revealNext` and `revealAll`.
- **The sidebar never spoils.** Every panel is gated on `_tvState[key].idx`; a value that belongs to a later step is not in the DOM at all, not merely hidden.
- **Never trust an assertion that a screen "contains a name".** Every queen's name is on these screens many times over. Render sweeps assert on specific elements by id, per the manual's §11.5J.

## File map

| File | Responsibility |
|---|---|
| `mockup-drag-race-vp.html` | the approved visual target, kept in the repo |
| `js/vp-dr/style.js` | the shell, the palette, the fonts, the icon set, the atmosphere layers |
| `js/vp-dr/screens.js` | the registry: id, label, badge, `when`, `build`, reveal handlers |
| `js/vp-dr/werk.js` | cold open, morning, elimination day |
| `js/vp-dr/challenge.js` | mini, announcement, choice, prep, the maxi (per-type panels) |
| `js/vp-dr/stage.js` | main stage, runway |
| `js/vp-dr/critiques.js` | critiques, Untucked |
| `js/vp-dr/results.js` | results, lip sync, exit, crowning |
| `js/vp-dr/arrivals.js` | the premiere's entrances |
| `js/vp-dr/chart.js` | the track record chart screen (wraps `js/dr/grid.js`) |
| `js/vp-dr/reveal.js` | `_tvState` helpers, `_reapplyVisibility`, sidebar updates |
| `js/vp-screens.js`, `js/main.js`, `js/run-ui.js` | dispatch |

---

### Task 1: The mockup, and the approval gate

**Files:**
- Create: `mockup-drag-race-vp.html`

**This task ends with the user's approval and nothing else.** The project's VP Mockup Workflow is explicit: build the standalone mockup, get it approved, and only then write builders that reproduce it exactly. A builder written before the mockup is approved gets rewritten.

**What the mockup must show**, with placeholder data, all in one scrollable file:

1. **The shell** — nav bar allowance (46px), the 1100px column, the palette, the two fonts, and the four phase atmospheres: **werk room** (warm, mirror bulbs, fabric), **main stage** (hot pink and violet, runway lights, haze), **Untucked** (low purple, lounge, close), **the chart** (flat, editorial, ink on paper).
2. **The card families** — a scene card (werk room), a performance card with a score bar, a critique card with a judge portrait slot and a tone stripe, a social card (visually distinct: dashed border, portrait), a lip sync beat card, an exit card.
3. **The track record chart** — the full grid: queens as rows, episodes as columns, cells coloured WIN gold / HIGH light blue / SAFE grey / LOW orange / BTM red / ELIM dark red / OUT blank / WINNER crown / FINALIST band; a legend; the hover state showing challenge, panel rank vs final rank, and the storyline beat.
4. **The live sidebar** — three states: before the critiques (who is in the room), during (the panel's running read), after (the call).
5. **The reveal controls** — sticky at the bottom, with a counter, in the shell's own styling.
6. **The icon set** — at least twelve CSS-only icons: mirror, wig, sewing machine, runway, microphone, camera, lipstick, crown, star, hanger, spotlight, heels. No emoji.

- [ ] **Step 1: Build the mockup**

Write `mockup-drag-race-vp.html` as a single self-contained file. Use invented queen names and plausible placeholder results. It must be openable directly in a browser with no server.

- [ ] **Step 2: Screenshot it**

```bash
npx playwright screenshot --viewport-size=1280,900 --full-page mockup-drag-race-vp.html /tmp/dr-mockup.png
```

- [ ] **Step 3: Show the user and STOP**

Present the mockup and the screenshot. Do not write a single VP builder until the user approves it. If they ask for changes, change the mockup and show it again.

- [ ] **Step 4: Commit the approved mockup**

```bash
git add mockup-drag-race-vp.html
git commit -m "feat(drag-race): the approved VP mockup — four atmospheres, the card families, the chart"
```

---

### Task 2: The shell, the palette, the icons

**Files:**
- Create: `js/vp-dr/style.js`, `js/vp-dr/reveal.js`
- Test: `tests/dr-vp-shell.test.js`

**Interfaces:**
- `js/vp-dr/style.js`:
  - `DR_CSS` — the whole stylesheet as a string, emitted once per screen (the VP inlines styles; every other show does the same).
  - `_shell(content, ep, { phase, title, subtitle, sidebar }) → html` — the 1100px column, the atmosphere layer for `phase` (`'werk'|'stage'|'untucked'|'chart'`), the header, the sidebar mount (`id="dr-sidebar-inner"`), and the sticky controls mount.
  - `_icon(type) → html` — the twelve CSS-only icons from the mockup. Throws on an unknown type, so a typo is a crash and not an invisible blank.
  - `_portrait(name, ep) → html` — the queen's portrait through `js/avatar-registry.js` ONLY (never a path built from a slug; `tests/no-direct-avatar-paths.test.js` fails the build otherwise), with initials as the fallback.
  - `_judgePortrait(judgeId, { stage }) → html` — the judge's file from `js/dr/data/judges.js`, using `portraitStage` for the host on a main-stage screen and `portrait` in the werk room.
- `js/vp-dr/reveal.js`:
  - `_state(ep, suffix) → { idx }` from `window._tvState`, keyed `dr:<epNum>:<suffix>`.
  - `_controls(suffix, total, epNum) → html` — the sticky bar with `id="dr-controls-<suffix>"` and a counter `id="dr-counter-<suffix>"`.
  - `drRevealNext(suffix, total, epNum)` / `drRevealAll(suffix, total, epNum)` — exported and put on `window` by `main.js`; both call `_reapplyVisibility` then `_updateSidebar`.
  - `_reapplyVisibility(suffix, idx, total)` — loops 0→idx, adds `dr-vis` to `#dr-step-<suffix>-<i>`, updates the counter, dims the buttons at the end, and scrolls the newest into view with `behavior:'smooth', block:'center'`.
  - `_updateSidebar(suffix, epNum)` — replaces `#dr-sidebar-inner`'s innerHTML from `window._drSidebar[suffix]`, which each screen sets when it builds.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-vp-shell.test.js
// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { DR_CSS, _shell, _icon } from '../js/vp-dr/style.js';
import { _state, _controls, _reapplyVisibility, drRevealNext, drRevealAll } from '../js/vp-dr/reveal.js';

const ep = { num: 3, format: 'drag-race', dr: { ep: 3 } };

beforeEach(() => { window._tvState = {}; window._drSidebar = {}; document.body.innerHTML = ''; });

describe('the shell', () => {
  it('carries its own identity and never covers the nav', () => {
    expect(DR_CSS).toMatch(/\.dr-/);
    expect(DR_CSS).toMatch(/prefers-reduced-motion/);
    expect(DR_CSS).toMatch(/top: *46px/);
    expect(DR_CSS).toMatch(/max-width: *1100px/);
    expect(DR_CSS).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });
  it('renders a phase and a sidebar mount', () => {
    const html = _shell('<p>x</p>', ep, { phase: 'stage', title: 'Main Stage', sidebar: '<b>s</b>' });
    expect(html).toMatch(/dr-phase-stage/);
    expect(html).toMatch(/id="dr-sidebar-inner"/);
    expect(html).toContain('Main Stage');
  });
  it('has an icon set and refuses an unknown one', () => {
    for (const t of ['mirror', 'wig', 'sewing', 'runway', 'microphone', 'camera', 'lipstick', 'crown', 'star', 'hanger', 'spotlight', 'heels']) {
      expect(_icon(t), t).toMatch(/<(span|svg)/);
      expect(_icon(t)).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    }
    expect(() => _icon('nonsense')).toThrow(/nonsense/);
  });
});

describe('reveals are DOM-only', () => {
  it('reveals one step at a time and updates the counter', () => {
    document.body.innerHTML = `
      <div id="dr-step-test-0"></div><div id="dr-step-test-1"></div><div id="dr-step-test-2"></div>
      <span id="dr-counter-test"></span><div id="dr-controls-test"><button></button></div>
      <div id="dr-sidebar-inner"></div>`;
    window._drSidebar.test = ['a', 'b', 'c'];
    drRevealNext('test', 3, 3);
    expect(document.getElementById('dr-step-test-0').className).toMatch(/dr-vis/);
    expect(document.getElementById('dr-step-test-1').className).not.toMatch(/dr-vis/);
    expect(document.getElementById('dr-counter-test').textContent).toMatch(/1.*3/);
    drRevealNext('test', 3, 3);
    drRevealNext('test', 3, 3);
    expect(document.getElementById('dr-step-test-2').className).toMatch(/dr-vis/);
    expect(document.getElementById('dr-controls-test').className).toMatch(/dr-done/);
  });
  it('reveal all shows everything and reapply is idempotent after a screen switch', () => {
    document.body.innerHTML = `<div id="dr-step-t2-0"></div><div id="dr-step-t2-1"></div><span id="dr-counter-t2"></span><div id="dr-controls-t2"></div>`;
    drRevealAll('t2', 2, 5);
    expect(document.getElementById('dr-step-t2-1').className).toMatch(/dr-vis/);
    document.body.innerHTML = `<div id="dr-step-t2-0"></div><div id="dr-step-t2-1"></div><span id="dr-counter-t2"></span><div id="dr-controls-t2"></div>`;
    _reapplyVisibility('t2', _state({ num: 5 }, 't2').idx, 2);
    expect(document.getElementById('dr-step-t2-1').className).toMatch(/dr-vis/);
  });
  it('state is per episode, so replaying one does not inherit another\'s reveals', () => {
    drRevealAll('t3', 4, 1);
    expect(_state({ num: 1 }, 't3').idx).toBe(3);
    expect(_state({ num: 2 }, 't3').idx).toBe(-1);
  });
  it('the sidebar updates without rebuilding the page', () => {
    document.body.innerHTML = `<div id="dr-step-t4-0"></div><span id="dr-counter-t4"></span><div id="dr-controls-t4"></div><div id="dr-sidebar-inner">old</div>`;
    window._drSidebar.t4 = ['fresh'];
    drRevealNext('t4', 1, 9);
    expect(document.getElementById('dr-sidebar-inner').innerHTML).toBe('fresh');
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-vp-shell.test.js`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement, reproducing the mockup exactly**

Write `js/vp-dr/style.js` and `js/vp-dr/reveal.js` so that `_shell` produces the mockup's markup. The mockup is the source of truth: same grid, same fonts, same icon system, same sidebar structure, same card physics. `_reapplyVisibility` is the one that matters most; here it is in full, because every VP in this repo has had a version of it and the DOM-patching detail is what makes it survive a screen switch:

```js
export function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i < total; i++) {
    const el = document.getElementById(`dr-step-${suffix}-${i}`);
    if (!el) continue;
    if (i <= upToIdx) el.classList.add('dr-vis'); else el.classList.remove('dr-vis');
  }
  const counter = document.getElementById(`dr-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  const controls = document.getElementById(`dr-controls-${suffix}`);
  if (controls) controls.classList.toggle('dr-done', upToIdx >= total - 1);
  const newest = document.getElementById(`dr-step-${suffix}-${upToIdx}`);
  if (newest && newest.scrollIntoView) {
    try { newest.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch { /* jsdom */ }
  }
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-vp-shell.test.js tests/no-direct-avatar-paths.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/vp-dr/style.js js/vp-dr/reveal.js tests/dr-vp-shell.test.js
git commit -m "feat(drag-race): the VP shell — four atmospheres, twelve CSS icons, DOM-only reveals"
```

---

### Task 3: The screen registry and the dispatch

**Files:**
- Create: `js/vp-dr/screens.js`
- Modify: `js/vp-screens.js`, `js/main.js`, `js/run-ui.js`, `js/dr/transcript.js`
- Test: `tests/dr-vp-registry.test.js`

**Interfaces:**
- `DRAG_SCREENS` — the ordered list, each `{ id, label, suffix, badge: { text, color } | null, when(row) → boolean, build(row) → html, revealAll, revealAllName }`, exactly the Traitors' shape so the two shows' registries can be read by one reader later. Seventeen entries: the sixteen steps plus the chart.
- `dragScreens(row) → [{ id, label, html }]` — filtered by `when`, built in order.
- `dragScreensRevealed(row) → [...]` — the same, fully revealed on a RENUMBERED copy of the row (negative `num`) so the transcript never consumes the viewer's own reveal state. This is the Traitors' trick and it is not optional: reveal state is keyed by episode number.
- `js/vp-screens.js` gains, beside the castle branch:
  ```js
  if (epRecord.format === 'drag-race') {
    vpScreens = dragScreens(epRecord);
    ...debug tab behind the same localStorage flag...
    return vpScreens;
  }
  ```
- `js/run-ui.js`'s `_dragBadges` (Plan 1 Task 13) now derives from `DRAG_SCREENS[].badge` plus the result badges, so a screen and its pill cannot drift.
- `js/dr/transcript.js` retranscribes from `dragScreensRevealed`, replacing its own scene walk — **one list, two readers**, the reason the Traitors put its screen table in one file.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-vp-registry.test.js
// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { DRAG_SCREENS, dragScreens, dragScreensRevealed } from '../js/vp-dr/screens.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 12, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: ['f', 'nb'][i % 2],
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
const { rows } = playDragSeason({ cast: cast(12, 6), seed: 11 });
beforeEach(() => { window._tvState = {}; window._drSidebar = {}; });

describe('the registry', () => {
  it('is the seventeen screens, in the running order', () => {
    expect(DRAG_SCREENS.length).toBe(17);
    const ids = DRAG_SCREENS.map(s => s.id);
    expect(ids[0]).toBe('dr-arrivals');
    expect(ids).toContain('dr-chart');
    expect(new Set(ids).size).toBe(17);
    for (const s of DRAG_SCREENS) {
      expect(typeof s.when).toBe('function');
      expect(typeof s.build).toBe('function');
      expect(s.suffix, s.id).toBeTruthy();
    }
  });
  it('every screen builds on every episode it claims', () => {
    for (const row of rows) {
      for (const s of DRAG_SCREENS) {
        if (!s.when(row)) continue;
        let html;
        expect(() => { html = s.build(row); }, `${s.id} on episode ${row.num}`).not.toThrow();
        expect(html.length, `${s.id} is empty on episode ${row.num}`).toBeGreaterThan(200);
      }
    }
  });
  it('the premiere shows arrivals and no other episode does', () => {
    expect(dragScreens(rows[0]).some(s => s.id === 'dr-arrivals')).toBe(true);
    for (const row of rows.slice(1)) expect(dragScreens(row).some(s => s.id === 'dr-arrivals')).toBe(false);
  });
  it('the finale shows the crowning and no other episode does', () => {
    const last = rows[rows.length - 1];
    expect(dragScreens(last).some(s => s.id === 'dr-crowning')).toBe(true);
    expect(dragScreens(rows[1]).some(s => s.id === 'dr-crowning')).toBe(false);
  });
  it('a normal episode shows at least twelve screens', () => {
    expect(dragScreens(rows[2]).length).toBeGreaterThanOrEqual(12);
  });
  it('revealing for the transcript does not consume the viewer\'s state', () => {
    const before = JSON.stringify(window._tvState);
    dragScreensRevealed(rows[2]);
    const keys = Object.keys(window._tvState).filter(k => k.includes(`:${rows[2].num}:`));
    expect(keys.length, 'the transcript ate the viewer\'s reveals').toBe(0);
    void before;
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-vp-registry.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the registry**

Write `js/vp-dr/screens.js` with the seventeen entries in this order, each importing its builder from the file that owns it (Tasks 4–9 fill the builders; register them all now with the group file's stub so the registry test can run as each lands):

`dr-arrivals`, `dr-cold-open`, `dr-werk-morning`, `dr-mini`, `dr-maxi-announce`, `dr-choice`, `dr-prep`, `dr-maxi`, `dr-werk-elim-day`, `dr-main-stage`, `dr-runway`, `dr-critiques`, `dr-untucked`, `dr-results`, `dr-lipsync`, `dr-exit`, `dr-chart`. The maxi screen's `when` accepts both stages and its builder picks the panel set from `row.dr.challenge.id`; `dr-crowning` is the finale's form of `dr-results`, distinguished by `when` on `row.dr.finale` — count it as that entry's finale variant rather than an eighteenth screen, and make the id switch (`dr-results` / `dr-crowning`) explicit in `screens.js` so the test above finds `dr-crowning`.

- [ ] **Step 4: Wire the dispatch**

`js/vp-screens.js`, `js/main.js` (import every `js/vp-dr/*.js` module and spread it, beside the `trXxxMod` imports), `js/run-ui.js` (badges from the registry), `js/dr/transcript.js` (retranscribe from `dragScreensRevealed`).

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/dr-vp-registry.test.js tests/dr-transcript.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/vp-dr/screens.js js/vp-screens.js js/main.js js/run-ui.js js/dr/transcript.js tests/dr-vp-registry.test.js
git commit -m "feat(drag-race): the screen registry — one list, read by the viewing party and the transcript"
```

---

### Task 4: The track record chart — the signature screen

**Files:**
- Create: `js/vp-dr/chart.js`; extend `js/dr/grid.js` (created in Plan 4 Task 4)
- Test: `tests/dr-chart.test.js`

**Interfaces:**
- `js/dr/grid.js` (the one builder, three readers):
  - `GRID_RESULTS = { WIN: {...}, HIGH: {...}, SAFE: {...}, LOW: {...}, BTM: {...}, ELIM: {...}, OUT: {...}, WINNER: {...}, FINALIST: {...} }` — label, short code, colour, text colour.
  - `gridRows(doc | rows) → [{ name, slug, cells: [{ episode, result, challenge, panelRank, finalRank, storyline, lipsync }], placement }]` — ordered by placement, best first. Accepts either a published document (`doc.episodes`) or live `episodeHistory` rows, because the season page has the first and the VP has the second.
  - `buildTrackRecordGrid(source, { upToEpisode = Infinity, interactive = true, title }) → html` — the table, the legend, the hover payload as `data-` attributes, and a `data-result` on every cell.
- `js/vp-dr/chart.js`:
  - `rpBuildChart(row) → html` — the chart screen, cut off at `row.num` so it never spoils, in the `chart` atmosphere, with the reveal control stepping **episode by episode** rather than card by card (the column fills as you click, which is the thing worth watching).
  - `drChartRevealNext/All(suffix, total, epNum)` exported for the registry.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-chart.test.js
// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { GRID_RESULTS, gridRows, buildTrackRecordGrid } from '../js/dr/grid.js';
import { rpBuildChart } from '../js/vp-dr/chart.js';
import { buildDragSeasonDocument } from '../js/dr/export.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 11, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
const season = playDragSeason({ cast: cast(11, 2), seed: 7 });
const doc = buildDragSeasonDocument(season.rows, { seasonNumber: 1 });
beforeEach(() => { window._tvState = {}; window._drSidebar = {}; });

describe('the grid builder', () => {
  it('knows the nine results with the community\'s colours', () => {
    expect(Object.keys(GRID_RESULTS).sort()).toEqual(
      ['BTM', 'ELIM', 'FINALIST', 'HIGH', 'LOW', 'OUT', 'SAFE', 'WIN', 'WINNER'].sort());
    expect(GRID_RESULTS.WIN.color).toBeTruthy();
    expect(GRID_RESULTS.OUT.color).toBeTruthy();
    for (const v of Object.values(GRID_RESULTS)) expect(v.short.length).toBeLessThanOrEqual(4);
  });
  it('reads a published document and live rows the same way', () => {
    const a = gridRows(doc), b = gridRows(season.rows);
    expect(a.length).toBe(b.length);
    expect(a.map(r => r.name)).toEqual(b.map(r => r.name));
    expect(a[0].cells.length).toBe(b[0].cells.length);
  });
  it('orders best first and gives everybody a full row', () => {
    const rows = gridRows(doc);
    expect(rows[0].name).toBe(doc.winner.name);
    expect(rows.map(r => r.placement)).toEqual([...rows.map(r => r.placement)].sort((a, b) => a - b));
    for (const r of rows) expect(r.cells.length).toBe(doc.episodes.length);
  });
  it('carries the panel rank beside the final rank in the cell', () => {
    const cells = gridRows(doc).flatMap(r => r.cells).filter(c => c.panelRank != null);
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.some(c => c.panelRank !== c.finalRank)).toBe(true);
  });
  it('renders one cell per queen per episode with a data-result', () => {
    const html = buildTrackRecordGrid(doc, {});
    expect((html.match(/data-result="/g) || []).length).toBe(doc.placements.length * doc.episodes.length);
    expect(html).toMatch(/legend/i);
  });
});

describe('the chart screen', () => {
  it('never draws past the episode being watched', () => {
    const early = rpBuildChart(season.rows[2]);
    const drawn = (early.match(/data-episode="(\d+)"/g) || []).map(m => Number(m.match(/\d+/)[0]));
    expect(Math.max(...drawn)).toBeLessThanOrEqual(3);
  });
  it('is complete on the finale', () => {
    const last = rpBuildChart(season.rows[season.rows.length - 1]);
    const drawn = (last.match(/data-episode="(\d+)"/g) || []).map(m => Number(m.match(/\d+/)[0]));
    expect(Math.max(...drawn)).toBe(season.rows.length);
    expect(last).toMatch(/data-result="WINNER"/);
  });
  it('steps episode by episode', () => {
    const html = rpBuildChart(season.rows[4]);
    expect(html).toMatch(/drChartRevealNext\('[^']+', *5/);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-chart.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

`js/dr/grid.js` holds the colours, the row builder and the table; `js/vp-dr/chart.js` wraps it in the shell with the episode-stepping reveal. Both the season page (Plan 4) and the article's per-season block read `buildTrackRecordGrid`, so keep it free of any VP-only markup: the interactive extras ride on `interactive: true`.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/dr-chart.test.js tests/dr-season-page.test.js`
Expected: PASS, both — the season page's grid assertions now run against the shared builder.

- [ ] **Step 5: Commit**

```bash
git add js/dr/grid.js js/vp-dr/chart.js tests/dr-chart.test.js
git commit -m "feat(drag-race): the track record chart — one builder for the VP, the season page and the article"
```

---

### Task 5: The werk room screens

**Files:**
- Create: `js/vp-dr/werk.js`, `js/vp-dr/arrivals.js`
- Test: `tests/dr-vp-werk.test.js`

**Interfaces:**
- `rpBuildArrivals(row)` — the premiere only. One card per queen in cast order: portrait, drag name, style tag, her entrance line, and the room's reaction. Reveal steps one queen at a time. Sidebar: who has walked in so far, and nothing about anybody who has not.
- `rpBuildColdOpen(row)` — the mirror message and the immediate reactions, in the `werk` atmosphere with the mirror-bulb treatment from the mockup. Sidebar: who left, and who is left.
- `rpBuildWerkMorning(row)` — the morning scenes as cards; a social card (dashed border, two portraits) whenever the scene names two queens, a plain card when it names one. Sidebar: the bond changes this scene made, drawn as arrows, from the row's own events.
- `rpBuildWerkElimDay(row)` — getting ready, with the runway category named at the top so the room's talk has a subject. Sidebar: a checklist of who is ready.
- All four take their text from `scene.text` (Plan 3) and their consequences from `row.dr.events`, never recomputing anything.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-vp-werk.test.js
// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { rpBuildColdOpen, rpBuildWerkMorning, rpBuildWerkElimDay } from '../js/vp-dr/werk.js';
import { rpBuildArrivals } from '../js/vp-dr/arrivals.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 12, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: ['f', 'nb'][i % 2],
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
const { rows } = playDragSeason({ cast: cast(12, 8), seed: 3 });
const strip = h => h.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
beforeEach(() => { window._tvState = {}; window._drSidebar = {}; });

describe('the werk room screens', () => {
  it('the arrivals screen walks every queen in, once', () => {
    const html = rpBuildArrivals(rows[0]);
    for (const p of rows[0].houseAtStart) expect(html, `${p} did not walk in`).toContain(p);
    expect((html.match(/dr-step-arrivals-\d+/g) || []).length).toBeGreaterThanOrEqual(rows[0].houseAtStart.length);
  });
  it('the cold open names who left and who is left', () => {
    const html = rpBuildColdOpen(rows[2]);
    const gone = rows[1].exits[0]?.name;
    if (gone) expect(html).toContain(gone);
    expect(html).toMatch(/id="dr-sidebar-inner"/);
  });
  it('a two-queen scene draws a social card and a one-queen scene does not', () => {
    const html = rpBuildWerkMorning(rows[3]);
    const scenes = rows[3].dr.scenes.filter(s => s.step === 'werk-morning');
    const social = scenes.filter(s => (s.data?.players || []).length >= 2).length;
    expect((html.match(/dr-card-social/g) || []).length).toBe(social);
  });
  it('elimination day names the runway category', () => {
    const html = rpBuildWerkElimDay(rows[4]);
    const cat = rows[4].dr.runway?.category;
    if (cat) expect(html).toContain(cat);
  });
  it('every screen renders on every episode and says nothing from another show', () => {
    for (const row of rows) {
      for (const build of [rpBuildColdOpen, rpBuildWerkMorning, rpBuildWerkElimDay]) {
        const html = build(row);
        expect(html.length).toBeGreaterThan(200);
        expect(foreignWordsIn(strip(html), 'drag-race'), `${build.name} on ${row.num}`).toEqual([]);
        expect(html).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
        expect(html).not.toMatch(/undefined|NaN|\[object/);
      }
    }
  });
  it('reveals are wired with a total that matches the steps drawn', () => {
    const html = rpBuildWerkMorning(rows[3]);
    const total = Number((html.match(/drRevealAll\('[^']+', *(\d+)/) || [])[1]);
    const steps = (html.match(/id="dr-step-[^"]+-\d+"/g) || []).length;
    expect(total).toBe(steps);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-vp-werk.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement, matching the mockup**

Reproduce the mockup's werk-room atmosphere and card families exactly. Each builder: gather its scenes from `row.dr.scenes` filtered by `step`, build one step div per scene, set `window._drSidebar[suffix]` to the per-step sidebar HTML array, and wrap in `_shell(..., { phase: 'werk' })`.

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-vp-werk.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/vp-dr/werk.js js/vp-dr/arrivals.js tests/dr-vp-werk.test.js
git commit -m "feat(drag-race): the werk room screens — arrivals, cold open, morning, elimination day"
```

---

### Task 6: The challenge screens

**Files:**
- Create: `js/vp-dr/challenge.js`
- Test: `tests/dr-vp-challenge.test.js`

**Interfaces:**
- `rpBuildMini(row)` — the mini challenge, the scores, the winner, and what the win buys.
- `rpBuildMaxiAnnounce(row)` — the host arrives; the challenge's `desc` from the catalogue is drawn IN FULL, because it is the only place the viewer is told what the queens are physically doing (the project's challenge-description rule). Format, teams and roles named.
- `rpBuildChoice(row)` — the draft: pick order as a numbered strip, each pick as a card, a conflict drawn as a collision (the loser's second choice shown beside the winner's first). Reveal one pick at a time. Sidebar: what is still on the board.
- `rpBuildPrep(row)` — the werk room at work: help and sabotage as social cards, the walkthrough as a host card per queen with her note and whether she took it.
- `rpBuildMaxi(row)` — the performance, with **per-type panels** dispatched on `row.dr.challenge.id`:
  - Snatch Game: a panel grid, six rounds, each queen's character and her per-round score, with the dying queen marked.
  - Ball: three looks per queen, the sewn one flagged, a build-quality meter.
  - Girl group / Rumix / Music video: teams, verse scores, the spotlight hog, the carried queen.
  - Rusical: the cast list with parts, live-vocal flags.
  - Makeover: pairs with a resemblance meter.
  - Roast / stand-up: the running order with the room-temperature line moving across it.
  - Talent show: one act card per queen with her talent and whether it landed.
  - LaLaPaRUza: the bracket, drawn as rounds.
  - Design family: the material, the build meter, the performance.
  - Anything else: the generic score cards.
  Sidebar: the running order or the team standings, gated by the reveal index.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-vp-challenge.test.js
// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { rpBuildMini, rpBuildMaxiAnnounce, rpBuildChoice, rpBuildPrep, rpBuildMaxi } from '../js/vp-dr/challenge.js';
import { MAXI_TYPES, maxiById } from '../js/dr/data/challenges.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 12, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
const strip = h => h.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
beforeEach(() => { window._tvState = {}; window._drSidebar = {}; });

// One season per tentpole, forced through the schedule, so every panel is exercised.
const seasons = ['snatch-game', 'ball', 'girl-group', 'rusical', 'makeover', 'roast', 'talent-show', 'lipsync-challenge', 'design']
  .map(id => ({ id, out: playDragSeason({ cast: cast(12, 4), seed: 2,
    config: { drSchedule: [{ episode: 2, maxiId: id }] } }) }));

describe('the challenge screens', () => {
  it('the announcement draws the full description, so the viewer knows the rules', () => {
    for (const { id, out } of seasons) {
      const row = out.rows.find(r => r.dr?.challenge?.id === id);
      if (!row) continue;
      const html = rpBuildMaxiAnnounce(row);
      expect(html, id).toContain(maxiById(id).desc.slice(0, 60));
    }
  });
  it('every maxi type has a panel that renders', () => {
    for (const { id, out } of seasons) {
      const row = out.rows.find(r => r.dr?.challenge?.id === id);
      if (!row) continue;
      const html = rpBuildMaxi(row);
      expect(html.length, id).toBeGreaterThan(400);
      expect(html, id).not.toMatch(/undefined|NaN|\[object/);
      expect(foreignWordsIn(strip(html), 'drag-race'), id).toEqual([]);
    }
  });
  it('the snatch game panel shows characters and rounds', () => {
    const row = seasons.find(s => s.id === 'snatch-game').out.rows.find(r => r.dr?.challenge?.id === 'snatch-game');
    const html = rpBuildMaxi(row);
    const first = Object.values(row.dr.performances)[0];
    expect(html).toContain(first.detail.character);
    expect((html.match(/dr-round/g) || []).length).toBeGreaterThanOrEqual(6);
  });
  it('the ball panel shows three looks with one sewn', () => {
    const row = seasons.find(s => s.id === 'ball').out.rows.find(r => r.dr?.challenge?.id === 'ball');
    const html = rpBuildMaxi(row);
    expect((html.match(/dr-look/g) || []).length).toBeGreaterThanOrEqual(3 * row.dr.living.length);
    expect(html).toMatch(/dr-sewn/);
  });
  it('the choice screen draws a pick per queen and marks a conflict', () => {
    const row = seasons.find(s => s.id === 'snatch-game').out.rows.find(r => r.dr?.challenge?.id === 'snatch-game');
    const html = rpBuildChoice(row);
    const picks = Object.keys(row.dr.assignment.picks).filter(k => !k.startsWith('_'));
    expect((html.match(/dr-pick\b/g) || []).length).toBe(picks.length);
    if (picks.some(p => row.dr.assignment.picks[p].penalty > 0)) expect(html).toMatch(/dr-contested/);
  });
  it('the prep screen shows the walkthrough note and whether she took it', () => {
    const row = seasons[0].out.rows[2];
    const html = rpBuildPrep(row);
    expect(html).toMatch(/dr-walkthrough/);
    expect(html).toMatch(/took it|ignored it/i);
  });
  it('the mini screen names what the win buys', () => {
    const row = seasons[0].out.rows.find(r => r.dr?.mini);
    if (row) {
      const html = rpBuildMini(row);
      expect(html).toContain(row.dr.mini.winner);
      expect(html).toMatch(/pick|captain|first/i);
    }
  });
  it('nothing spoils: the sidebar holds no result before its step', () => {
    const row = seasons[0].out.rows[3];
    const html = rpBuildMaxi(row);
    const winner = row.dr.call.win[0];
    const sidebarFirst = (html.match(/_drSidebar\[[^\]]+\] *= *(\[[\s\S]*?\]);/) || [])[1] || '';
    expect(sidebarFirst.split(',')[0] || '').not.toContain(`${winner} wins`);
  });
});

describe('coverage', () => {
  it('every catalogue type resolves to a panel builder', () => {
    for (const m of MAXI_TYPES) {
      const out = playDragSeason({ cast: cast(12, 9), seed: 1, config: { drSchedule: [{ episode: 2, maxiId: m.id }] } });
      const row = out.rows.find(r => r.dr?.challenge?.id === m.id);
      if (!row) continue;
      expect(() => rpBuildMaxi(row), m.id).not.toThrow();
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-vp-challenge.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

One exported builder per screen; inside `rpBuildMaxi`, a `PANELS` map from challenge id to a panel function, with the generic one as the fallback — the same registry-with-fallback shape as `js/dr/maxi.js`, so a new challenge type gets a working screen for free and a bespoke one when somebody writes it.

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-vp-challenge.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/vp-dr/challenge.js tests/dr-vp-challenge.test.js
git commit -m "feat(drag-race): the challenge screens — the rules drawn in full, and a panel per maxi type"
```

---

### Task 7: The main stage, the runway, the critiques, Untucked

**Files:**
- Create: `js/vp-dr/stage.js`, `js/vp-dr/critiques.js`
- Test: `tests/dr-vp-stage.test.js`

**Interfaces:**
- `rpBuildMainStage(row)` — the host in drag (`portraitStage`), the panel introduced one seat at a time, the guest with their franchise credit ("from Total Drama 9"). `stage` atmosphere.
- `rpBuildRunway(row)` — the category, then one walk per queen: portrait, the look described from her style and traits, her runway score as a meter. A Ball or a makeover draws its extra walks. Sidebar: the running runway leaderboard, gated so it only shows queens already walked.
- `rpBuildCritiques(row)` — for each critiqued queen, a card with her portrait and one line per judge, each with the judge's portrait, a tone stripe (praise green, mixed amber, pan red), and her reaction at the bottom. Reveal one queen at a time. Sidebar: **the panel's running ranking**, which is the screen's whole point — the viewer watches the panel disagree.
- `rpBuildUntucked(row)` — the lounge atmosphere, the three acts as sections, social cards throughout, and the fight escalating visually (the shell gets a `dr-shake` class on a `blow-up-continues` step).
- The critiques screen must draw the panel rank beside nothing else: **the final rank is not on this screen**, because the host has not decided yet. That ordering is the show.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-vp-stage.test.js
// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { rpBuildMainStage, rpBuildRunway } from '../js/vp-dr/stage.js';
import { rpBuildCritiques, rpBuildUntucked } from '../js/vp-dr/critiques.js';
import { playDragSeason } from '../js/dr/season.js';
import { JUDGES } from '../js/dr/data/judges.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 12, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f',
    archetype: ['hero', 'villain'][i % 2], age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
const { rows } = playDragSeason({ cast: cast(12, 11), seed: 5 });
const strip = h => h.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
beforeEach(() => { window._tvState = {}; window._drSidebar = {}; });

describe('the main stage', () => {
  it('uses the in-drag host portrait and seats the whole panel', () => {
    const html = rpBuildMainStage(rows[3]);
    expect(html).toContain('rupaul-drag.png');
    expect(html).not.toContain('avatars/rupaul.png"');
    for (const id of rows[3].dr.judges) {
      const j = JUDGES.find(x => x.id === id);
      if (j) expect(html, j.name).toContain(j.name);
    }
  });
  it('the runway draws a walk per queen with a score meter', () => {
    const html = rpBuildRunway(rows[3]);
    expect((html.match(/dr-walk\b/g) || []).length).toBeGreaterThanOrEqual(rows[3].dr.living.length);
    expect(html).toContain(rows[3].dr.runway.category);
    expect(html).toMatch(/dr-meter/);
  });
});

describe('the critiques', () => {
  const row = rows[3];
  const html = rpBuildCritiques(row);
  it('gives every critiqued queen every judge\'s line, with a tone', () => {
    const critiqued = new Set([...row.dr.call.win, ...row.dr.call.high, ...row.dr.call.low, ...row.dr.call.bottom]);
    for (const q of critiqued) expect(html, q).toContain(q);
    expect((html.match(/dr-tone-(praise|mixed|pan)/g) || []).length).toBeGreaterThanOrEqual(critiqued.size);
  });
  it('shows the panel rank and NOT the final rank — the host has not spoken', () => {
    expect(html).toMatch(/panel/i);
    const finalOnly = row.dr.bend.find(b => b.finalRank !== b.panelRank);
    if (finalOnly) expect(html).not.toMatch(new RegExp(`final rank[^<]*${finalOnly.finalRank}`, 'i'));
  });
  it('shows her reaction', () => {
    expect(html).toMatch(/dr-reaction/);
  });
});

describe('untucked', () => {
  it('draws three acts and shakes on a blow-up', () => {
    let shook = false;
    for (const row of rows) {
      const html = rpBuildUntucked(row);
      expect(html.length).toBeGreaterThan(200);
      expect(foreignWordsIn(strip(html), 'drag-race'), `episode ${row.num}`).toEqual([]);
      if (row.dr.scenes.some(s => s.kind === 'blow-up-continues')) { expect(html).toMatch(/dr-shake/); shook = true; }
    }
    expect(shook, 'no season produced a blow-up to draw').toBe(true);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-vp-stage.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement, matching the mockup**

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-vp-stage.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/vp-dr/stage.js js/vp-dr/critiques.js tests/dr-vp-stage.test.js
git commit -m "feat(drag-race): main stage, runway, critiques and Untucked — the panel ranks before the host decides"
```

---

### Task 8: Results, the lip sync, the exit, the crowning

**Files:**
- Create: `js/vp-dr/results.js`
- Test: `tests/dr-vp-results.test.js`

**Interfaces:**
- `rpBuildResults(row)` — the call, revealed in the show's order: safe queens dismissed, then the high, then the win, then the low, then the bottom two. **And the reveal the spec is built around**: a panel-rank column beside the final-rank column, so a bend is visible as a moving row. A queen bent two places or more gets a `dr-robbed` marker.
- `rpBuildLipsync(row)` — the song, the two queens, then the four beats (verse, chorus, hook, ending) as cards with each queen's delta, the stunt if there was one, and finally the call. `stage` atmosphere with the lights down. Sidebar: the two lip sync records.
- `rpBuildExit(row)` — her last words and the mirror message, drawn on the mirror.
- `rpBuildCrowning(row)` — the finale: the tournament bracket, each duel, then the crown. Replaces `rpBuildResults` when `row.dr.finale` is set.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-vp-results.test.js
// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { rpBuildResults, rpBuildLipsync, rpBuildExit, rpBuildCrowning } from '../js/vp-dr/results.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 12, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
const { rows } = playDragSeason({ cast: cast(12, 13), seed: 6 });
const strip = h => h.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
beforeEach(() => { window._tvState = {}; window._drSidebar = {}; });

describe('results', () => {
  const row = rows[4];
  const html = rpBuildResults(row);
  it('shows the panel rank beside the final rank', () => {
    expect(html).toMatch(/panel/i);
    expect(html).toMatch(/final/i);
    for (const b of row.dr.bend.slice(0, 3)) expect(html).toContain(String(b.panelRank));
  });
  it('marks a queen the host moved two places or more', () => {
    const moved = row.dr.bend.find(b => Math.abs(b.finalRank - b.panelRank) >= 2);
    if (moved) expect(html).toMatch(/dr-robbed|dr-bent/);
  });
  it('names the win and the bottom two', () => {
    for (const n of [...row.dr.call.win, ...row.dr.call.bottom]) expect(html).toContain(n);
  });
});

describe('the lip sync', () => {
  it('draws the song, four beats and the call', () => {
    const row = rows.find(r => r.dr?.lipsync);
    const html = rpBuildLipsync(row);
    expect(html).toContain(row.dr.lipsync.song);
    expect((html.match(/dr-beat\b/g) || []).length).toBeGreaterThanOrEqual(8);   // four beats, two queens
    expect(html).toMatch(/shantay|sashay/i);
  });
  it('a double shantay reads as both staying', () => {
    for (let s = 0; s < 40; s++) {
      const out = playDragSeason({ cast: cast(12, 20 + s), seed: s, config: { drDoubleShantay: true } });
      const dbl = out.rows.find(r => r.dr?.lipsync?.call === 'double-shantay');
      if (dbl) { expect(rpBuildLipsync(dbl)).toMatch(/both stay/i); return; }
    }
  });
});

describe('the exit and the crown', () => {
  it('the exit draws the mirror message', () => {
    const row = rows.find(r => r.exits?.length);
    const html = rpBuildExit(row);
    expect(html).toContain(row.exits[0].name);
    expect(html).toMatch(/dr-mirror/);
    expect(html).toMatch(/sashayed away/i);
  });
  it('the crowning draws the bracket and the winner', () => {
    const last = rows[rows.length - 1];
    const html = rpBuildCrowning(last);
    expect(html).toContain(last.dr.finale.winner);
    expect((html.match(/dr-duel\b/g) || []).length).toBe(last.dr.finale.rounds.length);
    expect(html).toMatch(/dr-crown/);
  });
  it('everything speaks this show only', () => {
    for (const row of rows) {
      for (const build of [rpBuildResults, rpBuildExit]) {
        if (build === rpBuildExit && !row.exits?.length) continue;
        expect(foreignWordsIn(strip(build(row)), 'drag-race'), `${build.name} ${row.num}`).toEqual([]);
      }
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-vp-results.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-vp-results.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/vp-dr/results.js tests/dr-vp-results.test.js
git commit -m "feat(drag-race): results with the bend made visible, the lip sync in beats, the exit and the crown"
```

---

### Task 9: The render sweep, the screenshots, and the read

**Files:**
- Create: `tests/dr-vp-render.test.js`, `tests/e2e/dr-vp.spec.js`, `tools/render-drag-vp.mjs`
- Test: both, plus a human look

**Interfaces:**
- `tests/dr-vp-render.test.js` — the completeness sweep, built on the lesson that an allowlist guard let five twists ship with no screen (memory `feedback_guards_need_denylists`):
  - Every episode of ten seasons renders every screen its `when` claims, with no throw, no `undefined`, no `NaN`, no `[object Object]`, no empty brace, and a length floor.
  - Every scene `kind` the row carries appears in at least one screen's output — a scene the engine wrote and no screen draws is the repo's signature bug.
  - Every screen's reveal `total` equals the steps it drew.
  - Replaying a mid-season episode after the season finishes produces byte-identical HTML to rendering it during the season (the historical-screen rule).
  - No screen reads live state: rendering with `gs` emptied changes nothing.
- `tools/render-drag-vp.mjs` writes every screen of one episode to `tmp/dr-vp/<screen>.html` for eyeballing.
- `tests/e2e/dr-vp.spec.js` — Playwright: opens the built HTML for each of the seventeen screens, screenshots it, and asserts no console error and no horizontal body scroll.

- [ ] **Step 1: Write the sweep**

```js
// tests/dr-vp-render.test.js
// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { DRAG_SCREENS, dragScreens } from '../js/vp-dr/screens.js';
import { playDragSeason } from '../js/dr/season.js';
import { setGs } from '../js/core.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'mastermind', 'goat', 'schemer', 'showmancer'];
function cast(n, seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Queen${i + 1}`, slug: `queen${i + 1}`,
    gender: ['f', 'm', 'nb'][i % 3], archetype: ARCH[i % ARCH.length], age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
const strip = h => h.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
const seasons = Array.from({ length: 10 }, (_, s) => playDragSeason({ cast: cast(12, 400 + s), seed: s }));
beforeEach(() => { window._tvState = {}; window._drSidebar = {}; });

describe('every screen, every episode', () => {
  it('renders clean', () => {
    for (const { rows } of seasons) for (const row of rows) for (const s of DRAG_SCREENS) {
      if (!s.when(row)) continue;
      let html;
      expect(() => { html = s.build(row); }, `${s.id} ep${row.num}`).not.toThrow();
      expect(html.length, `${s.id} ep${row.num} too short`).toBeGreaterThan(200);
      for (const bad of ['undefined', 'NaN', '[object Object]', '{{', '}}']) {
        expect(html.includes(bad), `${s.id} ep${row.num} contains ${bad}`).toBe(false);
      }
      expect(html).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
      expect(foreignWordsIn(strip(html), 'drag-race'), `${s.id} ep${row.num}`).toEqual([]);
    }
  });
  it('draws every scene the engine wrote', () => {
    for (const { rows } of seasons.slice(0, 3)) for (const row of rows) {
      const all = dragScreens(row).map(s => s.html).join(' ');
      for (const scene of row.dr.scenes) {
        if (!scene.text) continue;
        const key = scene.text.slice(0, 30);
        expect(all.includes(key), `ep${row.num}: scene "${scene.kind}" is written and drawn by nothing`).toBe(true);
      }
    }
  });
  it('reveal totals match the steps drawn', () => {
    for (const { rows } of seasons.slice(0, 3)) for (const row of rows) for (const s of DRAG_SCREENS) {
      if (!s.when(row)) continue;
      const html = s.build(row);
      const m = html.match(/drRevealAll\('([^']+)', *(\d+)/) || html.match(/RevealAll\('([^']+)', *(\d+)/);
      if (!m) continue;
      const steps = (html.match(new RegExp(`id="dr-step-${m[1]}-\\d+"`, 'g')) || []).length;
      expect(Number(m[2]), `${s.id} ep${row.num}`).toBe(steps);
    }
  });
  it('a replayed episode is byte-identical, and reads no live state', () => {
    const { rows } = seasons[0];
    const mid = rows[3];
    const during = DRAG_SCREENS.filter(s => s.when(mid)).map(s => s.build(mid)).join('');
    setGs({ episodeHistory: [], activePlayers: [], eliminated: [], popularity: {} });
    window._tvState = {};
    const after = DRAG_SCREENS.filter(s => s.when(mid)).map(s => s.build(mid)).join('');
    expect(after).toBe(during);
  });
});
```

- [ ] **Step 2: Run it and fix what it finds**

Run: `npx vitest run tests/dr-vp-render.test.js`
Expected: FAIL first, on real gaps. Fix the screens, not the sweep.

- [ ] **Step 3: The renderer tool and the screenshots**

`tools/render-drag-vp.mjs` plays a season, picks an episode, writes each screen wrapped in a minimal HTML document to `tmp/dr-vp/`. Then:

```bash
node tools/render-drag-vp.mjs 5 4
for f in tmp/dr-vp/*.html; do npx playwright screenshot --viewport-size=1280,900 --full-page "$f" "${f%.html}.png"; done
```

- [ ] **Step 4: LOOK AT THEM, beside the mockup**

Open each screenshot next to `mockup-drag-race-vp.html`. The mockup is the source of truth. Check: the same grid, the same fonts, the same icon system, the same sidebar structure, the same card physics. Also check for the things a test cannot see — a meter that is always full, a card with nothing in it, a sidebar that says the same thing on every step, text that runs off the column, a light-on-light card.

Write the findings into `docs/drag-race-season-read.md` and fix them.

- [ ] **Step 5: The e2e arm**

```js
// tests/e2e/dr-vp.spec.js
import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';

for (const f of readdirSync('tmp/dr-vp').filter(x => x.endsWith('.html'))) {
  test(`drag VP screen renders: ${f}`, async ({ page }) => {
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(`file://${process.cwd()}/tmp/dr-vp/${f}`);
    await expect(page.locator('.dr-shell')).toBeVisible();
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(overflow, 'the page scrolls sideways').toBe(false);
    expect(errors).toEqual([]);
  });
}
```

- [ ] **Step 6: Commit**

```bash
git add tests/dr-vp-render.test.js tests/e2e/dr-vp.spec.js tools/render-drag-vp.mjs docs/drag-race-season-read.md js/vp-dr
git commit -m "test(drag-race): render sweep over ten seasons, screenshots, and the fixes the look found"
git push
```

---

## Self-review against the spec

- §10's screens: Tasks 5–8 cover the sixteen steps; Task 4 is the chart, built once and read by the VP, the season page and the article as the spec requires. The mockup gate the project's workflow demands is Task 1 and it stops for approval.
- The VP rules in `CLAUDE.md`: unique prefix and fonts (Task 2), `top:46px` (Task 2), reduced motion (Task 2), CSS icons and no emoji (Task 2, swept in Task 9), DOM-only reveals with `_reapplyVisibility` (Task 2), sticky controls with a live counter (Task 2), live sidebar updated from both reveal paths (Task 2), phase-specific atmospheres (Tasks 5–8), no spoiling ahead (Tasks 6, 9), the full challenge `desc` drawn (Task 6).
- The bug classes the manual names: a screen showing live state instead of the episode's own snapshot (Task 9's byte-identical replay), a system written and drawn by nothing (Task 9's scene sweep), an assertion satisfied by the wrong element (every sweep asserts on ids and counts, not on a name appearing somewhere).
- Deferred to Plan 6: the AI episode writer's prompt, `readSignals`, the ratings calibration, the aftermath and edit-layer adapters, and the final measurement table.
