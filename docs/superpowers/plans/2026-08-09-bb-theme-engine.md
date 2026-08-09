# BB Theme Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Tier 0 theme engine from `docs/superpowers/specs/2026-08-09-bb-season-themes-design.md`, and prove it by shipping Summer of Temptation as the first theme.

**Architecture:** A theme is one descriptor object in a new leaf-ish module `js/bb/themes.js`. It owns identity (palette/fonts/house binding), an antagonist (a named voice with moods), an arc (week-indexed acts that emit `twistSchedule` entries), and twist affinity. The arc installs once per season from `prepareHouse()` in `bb-run.js`, writing entries tagged `source:'theme'` into `seasonConfig.twistSchedule` — so every existing consumer (`bbTwistsForWeek`, `resolveTwistSchedule`, the per-entry option readers) keeps working untouched. The antagonist speaks at four fixed points in `js/bb/week.js`, pushing a `theme-beat` act that both transcript writers and the VP screen builder handle.

**Tech Stack:** ES modules, no build step. Vitest 4 + jsdom for tests. No new dependencies.

## Global Constraints

- ES modules only, no build step. `js/core.js` stays a leaf — it imports nothing from the project.
- Module state mutations go through setter functions from `core.js`; never assign directly to an imported binding.
- Every exported function must be reachable from `window` via the `main.js` module spread.
- **No bare `Math.random()`** anywhere in theme code — use `stableRng(...parts)` from `js/bb/knowledge.js`. A seeded season must replay identically; the replay guards catch violations.
- Valid stats are exactly: `physical`, `endurance`, `mental`, `social`, `strategic`, `loyalty`, `boldness`, `intuition`, `temperament`.
- `pronouns(name)` returns `{sub, obj, pos, posAdj, ref, Sub, Obj, PosAdj}` — there is no `Pos` property.
- Every new act type MUST be handled by **both** transcript writers: `generateSummaryText()` in `js/text-backlog.js` and `summariseWeek()` in `js/bb-run.js`. `tests/bb-act-coverage.test.js` fails otherwise.
- Every new act type that produces a VP screen must be registered in the act switch in `js/vp-screens.js` (~line 21241).
- VP atmosphere layers use `top:46px`, never `top:0` — the `.rp-nav` bar is 46px tall.
- All animations need an `@media (prefers-reduced-motion: reduce)` fallback.
- Run only the affected test files while iterating (`npx vitest run tests/<file>`), not the full suite.
- **`bb-house` stays the default venue and a theme must never change it.** `theme.house` is a *suggestion* recorded on the descriptor — the venue is the user's choice and lives in `seasonConfig.setting`. `installTheme` must not write to `seasonConfig.setting` under any circumstance, and `defaultSettingFor('big-brother')` must keep returning `'bb-house'`. Task 2 tests this directly.

## File Structure

| File | Responsibility |
|---|---|
| `js/bb/themes.js` (create) | Theme descriptors, registry, resolution, arc scheduler, antagonist voice. The only file that knows what a theme is. |
| `js/bb/themes-temptation.js` (create) | The Summer of Temptation descriptor. One file per theme from here on. |
| `js/bb-run.js` (modify) | Install the theme in `prepareHouse()`; handle `theme-beat` in `summariseWeek()`. |
| `js/bb/week.js` (modify) | Arc advance + four antagonist voice hooks. |
| `js/text-backlog.js` (modify) | `theme-beat` transcript case. |
| `js/vp-screens.js` (modify) | `rpBuildBBThemeBeat`, registered in the act switch. |
| `js/vp-ui.js` (modify) | `.rp-theme-<id>` class on the reader root. |
| `js/core.js` (modify) | `theme: 'none'` in `defaultConfig()`. |
| `simulator.html` (modify) | `cfg-theme` select + `.rp-theme-*` CSS palettes. |
| `js/cast-ui.js` (modify) | Read/write `cfg-theme`. |
| `js/main.js` (modify) | Import + spread `themesMod`. |
| `tests/bb-themes.test.js` (create) | Registry integrity, arc scheduler, voice. |
| `tests/bb-theme-temptation.test.js` (create) | Played season with the theme on. |

---

### Task 1: The theme descriptor and registry

**Files:**
- Create: `js/bb/themes.js`
- Test: `tests/bb-themes.test.js`

**Interfaces:**
- Consumes: `seasonConfig` from `js/core.js`; `settingsForFormat` from `js/settings.js`; `TWIST_CATALOG` from `js/core.js`.
- Produces:
  - `BB_THEMES` — `{ [id]: descriptor }`
  - `THEME_LIST` — `string[]` of ids
  - `themeById(id) -> descriptor | null`
  - `currentTheme() -> descriptor | null`
  - `themeAccent() -> string` (hex, `'#f0c040'` when no theme)

- [ ] **Step 1: Write the failing test**

Create `tests/bb-themes.test.js`:

```js
// The theme engine.
//
// A theme is a season author: it decides what the house looks like, who is
// taunting the houseguests, and which twists arrive in which week. The tests
// that matter are the ones that stop a theme from lying — booking a twist that
// does not exist, binding to a venue the format does not have, or naming a
// houseguest who is not in the house.
import { beforeEach, describe, expect, it } from 'vitest';
import { seasonConfig, TWIST_CATALOG } from '../js/core.js';
import { settingsForFormat } from '../js/settings.js';
import { BB_THEMES, THEME_LIST, themeById, currentTheme, themeAccent } from '../js/bb/themes.js';

describe('theme registry', () => {
  beforeEach(() => {
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = 'none';
  });

  it('lists every registered theme', () => {
    expect(THEME_LIST.length).toBeGreaterThan(0);
    expect(THEME_LIST).toEqual(Object.keys(BB_THEMES));
  });

  it('binds every theme to a house the format actually has', () => {
    const houses = settingsForFormat('big-brother');
    for (const id of THEME_LIST) {
      expect(houses, `${id} binds to a real house`).toContain(BB_THEMES[id].house);
    }
  });

  it('only books twists that exist in the catalog', () => {
    const ids = new Set(TWIST_CATALOG.map(c => c.id));
    for (const id of THEME_LIST) {
      for (const act of BB_THEMES[id].arc || []) {
        if (!act.book) continue;
        expect(ids, `${id} books a real twist`).toContain(act.book);
      }
    }
  });

  it('gives every theme a name, a tagline, an accent and an antagonist', () => {
    for (const id of THEME_LIST) {
      const t = BB_THEMES[id];
      expect(t.name).toBeTruthy();
      expect(t.tagline).toBeTruthy();
      expect(t.palette.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.antagonist.name).toBeTruthy();
    }
  });

  it('resolves nothing when the season has no theme', () => {
    expect(currentTheme()).toBeNull();
    expect(themeAccent()).toBe('#f0c040');
  });

  it('resolves nothing on a season that is not a house', () => {
    seasonConfig.format = 'total-drama';
    seasonConfig.theme = THEME_LIST[0];
    expect(currentTheme()).toBeNull();
  });

  it('resolves the descriptor for a themed house season', () => {
    seasonConfig.theme = THEME_LIST[0];
    expect(currentTheme().id).toBe(THEME_LIST[0]);
    expect(themeAccent()).toBe(BB_THEMES[THEME_LIST[0]].palette.accent);
  });

  it('resolves nothing for an unknown id', () => {
    seasonConfig.theme = 'not-a-theme';
    expect(currentTheme()).toBeNull();
    expect(themeById('not-a-theme')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/bb-themes.test.js`
Expected: FAIL — `Failed to resolve import "../js/bb/themes.js"`.

- [ ] **Step 3: Write minimal implementation**

Create `js/bb/themes.js`:

```js
// js/bb/themes.js — SEASON THEMES.
//
// A house season with twists but no theme is a list of rules. Every modern
// Big Brother season is sold on a premise instead, and on the real show the
// premise is not decoration — it is the container the twists arrive in. The
// Multiverse gave each bedroom a bucket of twists; AINSLEY *was* the
// rule-changing engine and turned heel in Week 10; the Mastermind kidnapped
// the host on night one and then marched the house to a final three.
//
// So a theme here is a SEASON AUTHOR, and it owns four things:
//   1. IDENTITY — palette, fonts, vocab, and which of the four houses it is in.
//   2. AN ANTAGONIST — a named voice that reads real simulation state. This is
//      the one thing the broadcast cannot do and we can: an antagonist who
//      names the alliance that actually formed last night.
//   3. AN ARC — week-indexed acts that book twists onto the schedule, so you
//      pick a theme instead of hand-booking twelve cards.
//   4. TWIST AFFINITY — what it books, weights, bans, and what only it can run.
//
// The descriptor carries no house vocabulary in its STRUCTURE (acts are indexed
// by episode, twists by catalog id), so a Total Drama theme later needs content
// rather than a second engine.
import { seasonConfig } from '../core.js';

/** The accent the reader uses when a season has no theme. */
export const DEFAULT_ACCENT = '#f0c040';

/**
 * Every theme, by id.
 *
 * Themes are authored in code and picked in config; there is deliberately no
 * theme editor. Add one by adding a descriptor here (or importing one from its
 * own file, once it is big enough to want one) and an `.rp-theme-<id>` CSS
 * block in simulator.html.
 */
export const BB_THEMES = {};

/** Register a theme descriptor. Called by each theme's own module. */
export function registerTheme(descriptor) {
  BB_THEMES[descriptor.id] = descriptor;
  return descriptor;
}

export const THEME_LIST = [];

/** Rebuild the id list. Called after each registration. */
function refreshList() {
  THEME_LIST.length = 0;
  THEME_LIST.push(...Object.keys(BB_THEMES));
}

export function themeById(id) {
  return (id && BB_THEMES[id]) || null;
}

/**
 * The theme this season is actually running.
 *
 * Guarded on format for the same reason `houseSetting()` is: a season carried
 * over from Total Drama can still be pointing at a house theme, and nothing on
 * a beach should start quoting an AI.
 */
export function currentTheme() {
  if (seasonConfig?.format !== 'big-brother') return null;
  return themeById(seasonConfig?.theme);
}

export function themeAccent() {
  return currentTheme()?.palette?.accent || DEFAULT_ACCENT;
}

// ── the first theme ───────────────────────────────────────────────────
// Imported for side effect: each theme module calls registerTheme.
import './themes-temptation.js';
refreshList();
```

Create `js/bb/themes-temptation.js` with a minimal descriptor (the arc is filled in Task 7):

```js
// Summer of Temptation (BB19).
//
// The house is offered things all summer and the offer is free, which is what
// makes accepting a decision rather than a trade. The season's own cruelty is
// that the consequence does not land on the person who accepted it.
import { registerTheme } from './themes.js';

export default registerTheme({
  id: 'summer-of-temptation',
  name: 'Summer of Temptation',
  tagline: 'Every week, an offer. Somebody else pays for it.',
  house: 'bb-house',
  palette: { accent: '#c02040', ink: '#f3e8ea', paper: '#1a0a0e', glow: '#ff4d6d' },
  fonts: { display: '"Cinzel", Georgia, serif', body: '"Inter", system-ui, sans-serif' },
  antagonist: {
    name: 'The Den',
    voice: { open: { neutral: ['The Den is open.'] } },
  },
  arc: [],
  books: [],
  weights: {},
  bans: [],
  exclusive: [],
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/bb-themes.test.js`
Expected: PASS, 8 tests.

- [ ] **Step 5: Wire onto window and commit**

In `js/main.js`, add the import beside the other module imports (near line 110):

```js
import * as themesMod from './bb/themes.js';
```

and add `themesMod` to the module spread array (near line 224), immediately after `settingsMod`.

```bash
git add js/bb/themes.js js/bb/themes-temptation.js js/main.js tests/bb-themes.test.js
git commit -m "A season can now say what it is about"
```

---

### Task 2: The arc scheduler

**Files:**
- Modify: `js/bb/themes.js`
- Modify: `js/bb-run.js` (inside `prepareHouse()`, ~line 55-69)
- Test: `tests/bb-themes.test.js`

**Interfaces:**
- Consumes: `themeById`, `currentTheme` from Task 1; `resolveTwistSchedule` from `js/core.js`; `gs`, `seasonConfig` from `js/core.js`.
- Produces:
  - `themeScheduleEntries(theme, { weeks, existing }) -> Array<{id, episode, type, source, ...options}>`
  - `installTheme(houseSize) -> { id, mood, booked, said } | null`
  - `themeState() -> { id, mood, booked, said } | null`

- [ ] **Step 1: Write the failing test**

Append to `tests/bb-themes.test.js`:

```js
import { gs, resolveTwistSchedule } from '../js/core.js';
import { themeScheduleEntries, installTheme, themeState } from '../js/bb/themes.js';

const FIXTURE = {
  id: 'fixture', name: 'Fixture', tagline: 't', house: 'bb-house',
  palette: { accent: '#112233' }, fonts: { display: 'x', body: 'y' },
  antagonist: { name: 'Nobody', voice: {} },
  arc: [
    { at: { week: 2 }, book: 'bb-have-nots' },
    { at: { week: 4 }, book: 'bb-pandoras-box', options: { prize: 'diamond-veto' } },
    { at: { fromEnd: 1 }, book: 'bb-double-eviction' },
    { at: { week: 99 }, book: 'bb-roadkill' },
  ],
};

describe('theme arc scheduler', () => {
  it('lays booked twists onto the weeks the arc names', () => {
    const out = themeScheduleEntries(FIXTURE, { weeks: 9, existing: [] });
    expect(out.map(e => [e.episode, e.type])).toEqual([
      [2, 'bb-have-nots'],
      [4, 'bb-pandoras-box'],
      [9, 'bb-double-eviction'],
    ]);
  });

  it('drops acts that fall outside the season', () => {
    const out = themeScheduleEntries(FIXTURE, { weeks: 3, existing: [] });
    expect(out.map(e => e.type)).not.toContain('bb-roadkill');
    expect(out.map(e => e.type)).not.toContain('bb-pandoras-box');
  });

  it('carries the act options onto the entry', () => {
    const box = themeScheduleEntries(FIXTURE, { weeks: 9, existing: [] })
      .find(e => e.type === 'bb-pandoras-box');
    expect(box.prize).toBe('diamond-veto');
  });

  it('tags every entry so a theme booking is distinguishable from yours', () => {
    for (const e of themeScheduleEntries(FIXTURE, { weeks: 9, existing: [] })) {
      expect(e.source).toBe('theme');
      expect(e.id).toBeTruthy();
    }
  });

  it('leaves a week you booked yourself alone', () => {
    const existing = [{ id: 'mine', episode: 2, type: 'bb-roadkill' }];
    const out = themeScheduleEntries(FIXTURE, { weeks: 9, existing });
    expect(out.some(e => e.episode === 2)).toBe(false);
    expect(out.some(e => e.episode === 4)).toBe(true);
  });

  it('emits nothing that the incompatibility resolver would throw away', () => {
    const cfg = { format: 'big-brother' };
    const out = themeScheduleEntries(FIXTURE, { weeks: 9, existing: [] });
    for (const e of out) {
      expect(resolveTwistSchedule([e.type], cfg)).toEqual([e.type]);
    }
  });

  it('installs once and is idempotent', () => {
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = THEME_LIST[0];
    seasonConfig.twistSchedule = [];
    gs.bb = { weeks: [] };
    const first = installTheme(12);
    const count = seasonConfig.twistSchedule.length;
    const second = installTheme(12);
    expect(second).toBe(first);
    expect(seasonConfig.twistSchedule.length).toBe(count);
    expect(themeState().id).toBe(THEME_LIST[0]);
  });

  it('never changes the venue — the house is the default and the user picks it', () => {
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = THEME_LIST[0];
    seasonConfig.setting = 'bb-house';
    seasonConfig.twistSchedule = [];
    gs.bb = { weeks: [] };
    installTheme(12);
    expect(seasonConfig.setting).toBe('bb-house');
  });

  it('leaves a venue the user chose alone, even one the theme was not written for', () => {
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = THEME_LIST[0];
    seasonConfig.setting = 'bb-manor';
    seasonConfig.twistSchedule = [];
    gs.bb = { weeks: [] };
    installTheme(12);
    expect(seasonConfig.setting).toBe('bb-manor');
  });

  it('keeps the house as the format default', async () => {
    const { defaultSettingFor } = await import('../js/settings.js');
    expect(defaultSettingFor('big-brother')).toBe('bb-house');
  });

  it('installs nothing on an unthemed season', () => {
    seasonConfig.theme = 'none';
    seasonConfig.twistSchedule = [];
    gs.bb = { weeks: [] };
    expect(installTheme(12)).toBeNull();
    expect(seasonConfig.twistSchedule).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/bb-themes.test.js`
Expected: FAIL — `themeScheduleEntries is not a function`.

- [ ] **Step 3: Write minimal implementation**

Add to `js/bb/themes.js`, after `themeAccent()`:

```js
import { gs } from '../core.js';

/**
 * The weeks a theme's arc lands on.
 *
 * Pure, because the interesting cases are all about what it REFUSES to emit:
 * an act past the end of a short season, and any week you booked yourself.
 * A week you booked is yours — the arc fills the gaps, it does not argue.
 *
 * `at` is either `{week: n}` counted from the premiere or `{fromEnd: n}`
 * counted back from the finale, because an endgame act belongs at the endgame
 * whether the house cast twelve or sixteen.
 */
export function themeScheduleEntries(theme, { weeks = 10, existing = [] } = {}) {
  if (!theme) return [];
  const booked = (existing || []).filter(Boolean);
  const yours = new Set(booked.map(t => Number(t.episode)));
  const seen = new Set();
  const out = [];
  for (const act of theme.arc || []) {
    if (!act || !act.book) continue;
    const ep = act.at?.week != null
      ? Number(act.at.week)
      : weeks - Number(act.at?.fromEnd || 0);
    if (!Number.isFinite(ep) || ep < 1 || ep > weeks) continue;
    if (yours.has(ep)) continue;
    const key = `${ep}:${act.book}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `th-${theme.id}-${ep}-${act.book}`,
      episode: ep,
      type: act.book,
      source: 'theme',
      ...(act.options || {}),
    });
  }
  return out;
}

/**
 * Install the season's theme, once.
 *
 * Writes real schedule entries rather than intercepting the twist lookup,
 * because a twist's OPTIONS are read off its scheduled entry in a dozen places
 * (`boxEntry`, `deEntry`, the App Store shelf) and an intercept would have to
 * reimplement all of them. Everything downstream — `bbTwistsForWeek`,
 * `resolveTwistSchedule`, the Format Designer — keeps working untouched.
 */
export function installTheme(houseSize) {
  const theme = currentTheme();
  if (!theme) return null;
  if (!gs.bb) return null;
  if (gs.bb.theme) return gs.bb.theme;
  // A house loses one a week and ends at three.
  const weeks = Math.max(1, Number(houseSize || 0) - 3);
  const entries = themeScheduleEntries(theme, {
    weeks, existing: seasonConfig.twistSchedule || [],
  });
  seasonConfig.twistSchedule = [...(seasonConfig.twistSchedule || []), ...entries];
  gs.bb.theme = {
    id: theme.id,
    mood: theme.antagonist?.mood || 'neutral',
    booked: entries.map(e => e.type),
    said: [],
  };
  return gs.bb.theme;
}

export function themeState() {
  return gs?.bb?.theme || null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/bb-themes.test.js`
Expected: PASS, 19 tests.

- [ ] **Step 5: Wire the install into the season**

In `js/bb-run.js`, add to the imports at the top of the file:

```js
import { installTheme, themeState, currentTheme } from './bb/themes.js';
```

In `prepareHouse()` (~line 64), immediately after the `gs.bb.stats ||= {};` line and before `return gs.activePlayers || [];`, add:

```js
  // The season's theme, installed once. It books its arc onto the twist
  // schedule the first time the house is prepared, which is before any week
  // has run and after the cast is known — the arc needs the house size to
  // know where the endgame is.
  try { installTheme((gs.activePlayers || []).length); } catch { /* the season plays unthemed */ }
```

- [ ] **Step 5b: Run the BB regression files**

Run: `npx vitest run tests/bb-themes.test.js tests/bb-act-coverage.test.js tests/bb-replay-episode.test.js`
Expected: PASS. An unthemed season must be byte-identical to before — `installTheme` returns null and touches nothing.

- [ ] **Step 6: Commit**

```bash
git add js/bb/themes.js js/bb-run.js tests/bb-themes.test.js
git commit -m "The arc fills the weeks you left empty, and never the ones you didn't"
```

---

### Task 3: The antagonist voice

**Files:**
- Modify: `js/bb/themes.js`
- Modify: `js/bb/week.js` (four hook points)
- Test: `tests/bb-themes.test.js`

**Interfaces:**
- Consumes: `themeState`, `currentTheme` from Task 2; `stableRng` from `js/bb/knowledge.js`; `gs` from `js/core.js`.
- Produces:
  - `themeVoice(hook, ctx) -> { speaker, line, mood, hook } | null` where `hook` is one of `'open' | 'noms' | 'veto' | 'vote'` and `ctx` is `{ week, hoh, nominees, evicted }`
  - `setThemeMood(mood) -> string`
  - `themeBeat(hook, ctx) -> { type: 'theme-beat', ... } | null`

- [ ] **Step 1: Write the failing test**

Append to `tests/bb-themes.test.js`:

```js
import { themeVoice, setThemeMood, themeBeat } from '../js/bb/themes.js';

const VOICED = {
  id: 'voiced', name: 'Voiced', tagline: 't', house: 'bb-house',
  palette: { accent: '#112233' }, fonts: { display: 'x', body: 'y' },
  antagonist: {
    name: 'The Voice',
    mood: 'neutral',
    voice: {
      open:  { neutral: ['Week {week}. Begin.'], hostile: ['Week {week}. Suffer.'] },
      noms:  { neutral: ['{hoh} has chosen {nominees}.'] },
      veto:  { neutral: ['The veto changes nothing.'] },
      vote:  { neutral: ['{evicted} is gone.'] },
    },
  },
  arc: [], books: [], weights: {}, bans: [], exclusive: [],
};

function voicedSeason() {
  BB_THEMES.voiced = VOICED;
  seasonConfig.format = 'big-brother';
  seasonConfig.theme = 'voiced';
  gs.bb = { weeks: [], theme: { id: 'voiced', mood: 'neutral', booked: [], said: [] } };
  gs.activePlayers = ['Bowie', 'Chase', 'Ripper'];
}

describe('the antagonist', () => {
  beforeEach(voicedSeason);

  it('speaks at every declared hook', () => {
    const ctx = { week: 3, hoh: 'Bowie', nominees: ['Chase', 'Ripper'], evicted: 'Chase' };
    for (const hook of ['open', 'noms', 'veto', 'vote']) {
      const said = themeVoice(hook, ctx);
      expect(said, hook).not.toBeNull();
      expect(said.speaker).toBe('The Voice');
      expect(said.line.length).toBeGreaterThan(0);
    }
  });

  it('fills the tokens with what actually happened', () => {
    const said = themeVoice('noms', { week: 3, hoh: 'Bowie', nominees: ['Chase', 'Ripper'] });
    expect(said.line).toBe('Bowie has chosen Chase and Ripper.');
  });

  it('never names somebody who is not in the house', () => {
    const said = themeVoice('noms', { week: 3, hoh: 'Ghost', nominees: ['Chase'] });
    expect(said).toBeNull();
  });

  it('says nothing at a hook the theme did not declare', () => {
    expect(themeVoice('nonsense', { week: 1 })).toBeNull();
  });

  it('changes register with the mood', () => {
    const calm = themeVoice('open', { week: 3 });
    setThemeMood('hostile');
    const cross = themeVoice('open', { week: 3 });
    expect(calm.line).toBe('Week 3. Begin.');
    expect(cross.line).toBe('Week 3. Suffer.');
    expect(cross.mood).toBe('hostile');
  });

  it('falls back to neutral when a mood has no lines of its own', () => {
    setThemeMood('hostile');
    expect(themeVoice('veto', { week: 3 }).line).toBe('The veto changes nothing.');
  });

  it('is silent on an unthemed season', () => {
    seasonConfig.theme = 'none';
    gs.bb.theme = null;
    expect(themeVoice('open', { week: 1 })).toBeNull();
  });

  it('is deterministic for the same week and hook', () => {
    const ctx = { week: 5, hoh: 'Bowie', nominees: ['Chase'] };
    expect(themeVoice('noms', ctx).line).toBe(themeVoice('noms', ctx).line);
  });

  it('wraps a line into an act the transcripts can read', () => {
    const act = themeBeat('open', { week: 2 });
    expect(act.type).toBe('theme-beat');
    expect(act.hook).toBe('open');
    expect(act.speaker).toBe('The Voice');
    expect(act.players).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/bb-themes.test.js`
Expected: FAIL — `themeVoice is not a function`.

- [ ] **Step 3: Write minimal implementation**

Add to `js/bb/themes.js`:

```js
import { stableRng } from './knowledge.js';

const VOICE_HOOKS = ['open', 'noms', 'veto', 'vote'];

/** The house, as the antagonist is allowed to know it. */
function inHouse(name) {
  return !!name && (gs.activePlayers || []).includes(name);
}

/**
 * Fill a line's tokens, or refuse to.
 *
 * Returns null rather than a half-filled line if any name token resolves to
 * somebody who is not in the house. An antagonist who taunts an evicted
 * houseguest is worse than an antagonist who says nothing, and the alternative
 * — trusting every caller to pass a live roster — is the bug we would find in
 * a played season rather than a test.
 */
function fillLine(tpl, ctx) {
  const noms = (ctx.nominees || []).filter(Boolean);
  if (tpl.includes('{hoh}') && !inHouse(ctx.hoh)) return null;
  if (tpl.includes('{nominees}') && (!noms.length || noms.some(n => !inHouse(n)))) return null;
  if (tpl.includes('{evicted}') && !ctx.evicted) return null;
  const list = noms.length > 1
    ? `${noms.slice(0, -1).join(', ')} and ${noms[noms.length - 1]}`
    : (noms[0] || '');
  return tpl
    .replace(/\{week\}/g, String(ctx.week ?? ''))
    .replace(/\{hoh\}/g, ctx.hoh || '')
    .replace(/\{nominees\}/g, list)
    .replace(/\{evicted\}/g, ctx.evicted || '');
}

/** Move the antagonist's register. This is how a heel turn is expressed. */
export function setThemeMood(mood) {
  const st = themeState();
  if (st) st.mood = mood;
  return mood;
}

/**
 * What the antagonist says at one of the four fixed points in a week.
 *
 * Seeded on theme + hook + week, so the same season replays with the same
 * taunts and an extra unrelated die roll earlier in the week cannot change
 * them.
 */
export function themeVoice(hook, ctx = {}) {
  const theme = currentTheme();
  const st = themeState();
  if (!theme || !st) return null;
  if (!VOICE_HOOKS.includes(hook)) return null;
  const byMood = theme.antagonist?.voice?.[hook];
  if (!byMood) return null;
  const pool = byMood[st.mood] || byMood.neutral;
  if (!pool || !pool.length) return null;
  const rng = stableRng('theme-voice', theme.id, hook, st.mood, ctx.week || 0);
  // Walk the pool from a seeded start so a refused line falls through to the
  // next candidate instead of silencing the hook.
  const start = Math.floor(rng() * pool.length);
  for (let i = 0; i < pool.length; i++) {
    const line = fillLine(pool[(start + i) % pool.length], ctx);
    if (line) return { speaker: theme.antagonist.name, line, mood: st.mood, hook };
  }
  return null;
}

/** The same line, as an act the week can push and the transcripts can read. */
export function themeBeat(hook, ctx = {}) {
  const said = themeVoice(hook, ctx);
  if (!said) return null;
  return {
    type: 'theme-beat',
    hook: said.hook,
    speaker: said.speaker,
    line: said.line,
    mood: said.mood,
    themeId: currentTheme()?.id || null,
    players: [],
    badgeText: said.speaker,
    badgeClass: 'badge-twist',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/bb-themes.test.js`
Expected: PASS, 28 tests.

- [ ] **Step 5: Wire the four hooks into the week**

In `js/bb/week.js`, add to the imports:

```js
import { themeBeat } from './themes.js';
```

Add a helper immediately above `export function simulateBBWeek` (~line 1097):

```js
/** Push the antagonist's line for this point in the week, if it has one. */
function _themeSay(week, hook, ctx) {
  const beat = themeBeat(hook, { week: week.num, ...ctx });
  if (beat) week.acts.push(beat);
}
```

Then add four calls:

1. **open** — immediately after `week.twistState = resolveWeekTwistState(...)` (~line 1151):
```js
  _themeSay(week, 'open', {});
```
2. **noms** — immediately after the nominations act is pushed (~line 1767, the `week.acts.push(addBeats(` for the nomination ceremony):
```js
  _themeSay(week, 'noms', { hoh: week.hohSecret ? null : week.hoh, nominees: week.nominees || [] });
```
3. **veto** — immediately after the veto ceremony act is pushed (~line 1886):
```js
  _themeSay(week, 'veto', { hoh: week.hohSecret ? null : week.hoh, nominees: week.finalNominees || week.nominees || [] });
```
4. **vote** — immediately after the eviction result is recorded, at the end of the vote block (search for where `week.evicted` is assigned and the eviction act pushed):
```js
  _themeSay(week, 'vote', { evicted: week.evicted || null });
```

Note the `hohSecret` guard on hooks 2 and 3 — an Invisible HOH week must not have the antagonist name the winner. `fillLine` refuses a `{hoh}` line when `hoh` is null, so the hook falls through to a line that does not need the name, or stays silent.

- [ ] **Step 6: Run the regression files**

Run: `npx vitest run tests/bb-themes.test.js tests/bb-invisible-hoh.test.js tests/bb-replay-episode.test.js`
Expected: PASS. The Invisible HOH file is the one that catches an antagonist leaking a sealed name.

- [ ] **Step 7: Commit**

```bash
git add js/bb/themes.js js/bb/week.js tests/bb-themes.test.js
git commit -m "Somebody is watching the house now, and it has opinions"
```

---

### Task 4: The theme picker in config

**Files:**
- Modify: `js/core.js` (`defaultConfig()`, ~line 1335)
- Modify: `simulator.html` (config panel, after the `cfg-setting` group at line 258-265)
- Modify: `js/cast-ui.js` (config read ~line 915, config restore ~line 1068)
- Test: `tests/bb-themes.test.js`

**Interfaces:**
- Consumes: `THEME_LIST`, `BB_THEMES` from Task 1.
- Produces: `seasonConfig.theme` — a theme id or `'none'`.

- [ ] **Step 1: Write the failing test**

Append to `tests/bb-themes.test.js`:

```js
import { defaultConfig } from '../js/core.js';

describe('theme config', () => {
  it('defaults to no theme, so every existing season is unchanged', () => {
    expect(defaultConfig().theme).toBe('none');
  });

  it('offers an option in the markup for every registered theme', async () => {
    const fs = await import('node:fs');
    const html = fs.readFileSync('simulator.html', 'utf8');
    const select = html.match(/<select id="cfg-theme"[\s\S]*?<\/select>/);
    expect(select).not.toBeNull();
    expect(select[0]).toContain('value="none"');
    for (const id of THEME_LIST) {
      if (id === 'fixture' || id === 'voiced') continue; // test-only registrations
      expect(select[0], `${id} has an option`).toContain(`value="${id}"`);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/bb-themes.test.js -t "theme config"`
Expected: FAIL — `expected undefined to be 'none'`.

- [ ] **Step 3: Write minimal implementation**

In `js/core.js` `defaultConfig()`, immediately after the `setting:` line, add:

```js
    theme: 'none',            // Big Brother only: the season's premise. See js/bb/themes.js.
```

In `simulator.html`, immediately after the `</div>` closing the `cfg-setting` form group (line 265), add:

```html
            <div class="form-group" id="theme-group">
              <label class="form-label">Season Theme</label>
              <select id="cfg-theme" onchange="saveConfig()" class="form-input">
                <option value="none">— No theme (twists only) —</option>
                <option value="summer-of-temptation">🍎 Summer of Temptation (an offer a week, somebody else pays)</option>
              </select>
            </div>
```

In `js/cast-ui.js`, in the config read (~line 915, beside `setting:`), add:

```js
    theme:       g('cfg-theme')?.value || 'none',
```

In the config restore (~line 1068, beside the `cfg-setting` set), add:

```js
  set('cfg-theme', seasonConfig.theme || 'none');
```

Immediately after that line, hide the picker for shows that are not a house:

```js
  // Themes belong to the house. A beach season offering "Summer of Temptation"
  // is a question with no correct answer, the same reason the venue list is
  // scoped by format.
  const _themeGroup = g('theme-group');
  if (_themeGroup) _themeGroup.style.display = seasonConfig.format === 'big-brother' ? '' : 'none';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/bb-themes.test.js tests/format-scoped-config.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/core.js simulator.html js/cast-ui.js tests/bb-themes.test.js
git commit -m "A theme is a thing you pick, and only in a house"
```

---

### Task 5: The VP skin

**Files:**
- Modify: `js/vp-ui.js` (`renderVPScreen`, ~line 745-752)
- Modify: `simulator.html` (CSS, beside the existing `.rp-set-*` blocks)
- Test: `tests/bb-theme-vp.test.js` (create)

**Interfaces:**
- Consumes: `currentTheme`, `themeAccent` from Task 1.
- Produces: a `.rp-theme-<id>` class on `#vp-screen-content`, alongside the existing `.rp-set-<setting>` class.

- [ ] **Step 1: Write the failing test**

Create `tests/bb-theme-vp.test.js`:

```js
// The theme's skin.
//
// The setting already retints the reader per venue; a theme retints it per
// SEASON, on top. The rule that matters is the scoping one the setting skin
// established: a twist screen that brought its own identity must not have a
// season palette painted over it.
import { beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { seasonConfig } from '../js/core.js';
import { THEME_LIST, BB_THEMES, themeAccent, currentTheme } from '../js/bb/themes.js';

describe('theme skin', () => {
  beforeEach(() => {
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = 'summer-of-temptation';
  });

  it('has a CSS block for every registered theme', () => {
    const css = fs.readFileSync('simulator.html', 'utf8');
    for (const id of THEME_LIST) {
      if (id === 'fixture' || id === 'voiced') continue;
      expect(css, `.rp-theme-${id} exists`).toContain(`.rp-theme-${id}`);
    }
  });

  it('scopes the theme palette to .rp-page like the setting skin does', () => {
    const css = fs.readFileSync('simulator.html', 'utf8');
    const block = css.slice(css.indexOf('.rp-theme-summer-of-temptation'));
    expect(block.slice(0, 400)).toContain('.rp-page');
  });

  it('applies the theme class to the reader root', () => {
    const content = { className: 'rp-set-bb-house' };
    const applied = applyThemeClass(content.className);
    expect(applied).toContain('rp-theme-summer-of-temptation');
    expect(applied).toContain('rp-set-bb-house');
  });

  it('strips a previous theme class rather than stacking them', () => {
    const applied = applyThemeClass('rp-set-bb-house rp-theme-old-thing');
    expect(applied).not.toContain('rp-theme-old-thing');
    expect(applied).toContain('rp-theme-summer-of-temptation');
  });

  it('adds no theme class to an unthemed season', () => {
    seasonConfig.theme = 'none';
    expect(applyThemeClass('rp-set-bb-house')).toBe('rp-set-bb-house');
  });

  it('reports the theme accent for the reader to use', () => {
    expect(themeAccent()).toBe(BB_THEMES['summer-of-temptation'].palette.accent);
  });
});

// Mirrors the class computation in renderVPScreen so it can be tested without
// a full DOM render. Imported from vp-ui so the two cannot drift.
import { applyThemeClass } from '../js/vp-ui.js';
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/bb-theme-vp.test.js`
Expected: FAIL — `applyThemeClass is not exported`.

- [ ] **Step 3: Write minimal implementation**

In `js/vp-ui.js`, add the import beside the existing settings import:

```js
import { currentTheme } from './bb/themes.js';
```

Add the exported helper immediately above `export function renderVPScreen()` (~line 697):

```js
/**
 * The reader's class list, with the season's theme on it.
 *
 * Exported rather than inlined so the rule is testable without standing up a
 * DOM: strip any previous theme class, add this season's, leave the venue
 * class alone. The two skins stack — a Summer of Temptation season is still
 * in the house.
 */
export function applyThemeClass(className) {
  const base = String(className || '').replace(/\brp-theme-[\w-]+/g, '').replace(/\s+/g, ' ').trim();
  const theme = currentTheme();
  return theme ? `${base} rp-theme-${theme.id}`.trim() : base;
}
```

In `renderVPScreen`, replace the existing setting-skin line:

```js
    content.className = (content.className || '').replace(/\brp-set-[\w-]+/g, '').trim() + ` rp-set-${_set}`;
```

with:

```js
    content.className = applyThemeClass(
      (content.className || '').replace(/\brp-set-[\w-]+/g, '').trim() + ` rp-set-${_set}`);
```

In `simulator.html`, beside the existing `.rp-set-*` blocks, add:

```css
    /* Season themes. Stacked on top of the venue skin: a themed season is
       still in one of the four houses, and the theme only retints it. Scoped
       to .rp-page for the same reason the venue skin is — a twist screen that
       brought its own identity keeps it. */
    .rp-theme-summer-of-temptation .rp-page {
      --accent-gold: #c02040;
      --theme-accent: #c02040;
      --theme-glow: #ff4d6d;
      background-image:
        radial-gradient(circle at 12% 0%, rgba(192,32,64,.10), transparent 42%),
        radial-gradient(circle at 88% 100%, rgba(255,77,109,.07), transparent 46%);
    }
    .rp-theme-summer-of-temptation .rp-page h1,
    .rp-theme-summer-of-temptation .rp-page h2 { letter-spacing: .04em; }
    @media (prefers-reduced-motion: reduce) {
      .rp-theme-summer-of-temptation .rp-page { background-image: none; }
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/bb-theme-vp.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add js/vp-ui.js simulator.html tests/bb-theme-vp.test.js
git commit -m "The reader wears the season, not just the venue"
```

---

### Task 6: Transcripts and the VP screen for theme acts

**Files:**
- Modify: `js/bb-run.js` (`summariseWeek`, act switch ~line 1096)
- Modify: `js/text-backlog.js` (BB act switch ~line 5499)
- Modify: `js/vp-screens.js` (builder + act switch ~line 21241)
- Test: `tests/bb-themes.test.js`, `tests/bb-act-coverage.test.js`

**Interfaces:**
- Consumes: the `theme-beat` act from Task 3 — `{ type, hook, speaker, line, mood, themeId, players, badgeText, badgeClass }`.
- Produces: `rpBuildBBThemeBeat(ep, act) -> string` (HTML).

- [ ] **Step 1: Write the failing test**

Append to `tests/bb-themes.test.js`:

```js
import { summariseWeek } from '../js/bb-run.js';
import { rpBuildBBThemeBeat } from '../js/vp-screens.js';

describe('theme acts reach the audience', () => {
  const week = {
    num: 3, acts: [{
      type: 'theme-beat', hook: 'open', speaker: 'The Voice',
      line: 'Week 3. Begin.', mood: 'neutral', themeId: 'voiced',
      players: [], badgeText: 'The Voice', badgeClass: 'badge-twist',
    }],
  };

  it('writes the line into the week summary', () => {
    const text = summariseWeek(week).join('\n');
    expect(text).toContain('The Voice');
    expect(text).toContain('Week 3. Begin.');
  });

  it('builds a screen that shows the speaker and the line', () => {
    const html = rpBuildBBThemeBeat({ episode: 3 }, week.acts[0]);
    expect(html).toContain('The Voice');
    expect(html).toContain('Week 3. Begin.');
    expect(html).toContain('rp-page');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/bb-themes.test.js -t "theme acts"`
Expected: FAIL — `rpBuildBBThemeBeat is not exported`.

- [ ] **Step 3: Write minimal implementation**

In `js/bb-run.js` `summariseWeek`, add a case to the `switch (act.type)`:

```js
      case 'theme-beat':
        line('');
        line(`${act.speaker.toUpperCase()}`);
        line(`  "${act.line}"`);
        break;
```

In `js/text-backlog.js`, in the BB act switch (~line 5499, beside `case 'twist-announcement':`), add:

```js
      case 'theme-beat':
        sec(act.speaker.toUpperCase());
        ln(`"${act.line}"`);
        break;
```

In `js/vp-screens.js`, add the builder beside `rpBuildBBTwistAnnouncement` (~line 18836). Reuse that function's shell classes and structure — same wall-screen framing, new `bbth-` prefix:

```js
/**
 * The antagonist, saying one thing.
 *
 * Deliberately a single card rather than a sequence: the voice interrupts a
 * week that is already busy, and a full screen of reveals for one taunt would
 * cost more attention than the taunt is worth. The shell is
 * `rpBuildBBTwistAnnouncement`'s so a themed season reads as one show.
 */
export function rpBuildBBThemeBeat(ep, act) {
  const accent = act.mood === 'hostile' ? '#ff2d55' : 'var(--theme-accent, #c02040)';
  return `<div class="rp-page bbth-page" data-ambient="tension">
    <style>
      .bbth-wall{max-width:1100px;margin:0 auto;padding:48px 24px;text-align:center}
      .bbth-eye{width:96px;height:96px;margin:0 auto 24px;border-radius:50%;
        background:radial-gradient(circle at 50% 50%, ${accent} 0%, rgba(0,0,0,.9) 70%);
        box-shadow:0 0 48px ${accent};animation:bbth-pulse 3.2s ease-in-out infinite}
      @keyframes bbth-pulse{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.06);opacity:1}}
      @media(prefers-reduced-motion:reduce){.bbth-eye{animation:none}}
      .bbth-who{font-size:13px;letter-spacing:.32em;text-transform:uppercase;opacity:.7;margin-bottom:16px}
      .bbth-line{font-size:30px;line-height:1.4;max-width:760px;margin:0 auto;font-style:italic}
    </style>
    <div class="bbth-wall">
      <div class="bbth-eye" aria-hidden="true"></div>
      <div class="bbth-who">${act.speaker}</div>
      <div class="bbth-line">&ldquo;${act.line}&rdquo;</div>
    </div>
  </div>`;
}
```

In the act switch (~line 21241), beside `case 'twist-announcement':`, add:

```js
      case 'theme-beat':
        vpScreens.push({
          id: `theme-beat-${act.hook}`,
          label: act.speaker,
          html: rpBuildBBThemeBeat(view, act),
        });
        break;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/bb-themes.test.js tests/bb-act-coverage.test.js`
Expected: PASS. `bb-act-coverage` is the one that proves both writers handle the act and the screen is registered.

- [ ] **Step 5: Commit**

```bash
git add js/bb-run.js js/text-backlog.js js/vp-screens.js tests/bb-themes.test.js
git commit -m "What the antagonist said now survives into the transcript and the reader"
```

---

### Task 7: Summer of Temptation — the engine's proof

**Files:**
- Modify: `js/bb/themes-temptation.js` (fill in the arc and the voice)
- Test: `tests/bb-theme-temptation.test.js` (create)

**Interfaces:**
- Consumes: `registerTheme` from Task 1; the arc/voice contract from Tasks 2 and 3.
- Produces: a complete descriptor registered under `'summer-of-temptation'`.

Catalog ids this arc books, all verified present in `TWIST_CATALOG`:
`bb-den-of-temptation`, `bb-have-nots`, `bb-pandoras-box`, `bb-double-eviction`.

**Do not book the Halting Hex.** It is a *power* (`js/bb/powers.js:119`), not a schedulable twist card — it has no `TWIST_CATALOG` entry and Task 1's registry test will fail if the arc names it. It reaches a Temptation season the way it already reaches any season: as a grant from a distributor. `bb-pandoras-box` is the distributor the arc books for that purpose.

- [ ] **Step 1: Write the failing test**

Create `tests/bb-theme-temptation.test.js`:

```js
// Summer of Temptation, played.
//
// The theme is nearly pure composition — the Den, the powers shelf and the
// Halting Hex are all built — which is exactly why it is the first one. If the
// engine cannot assemble a season out of parts we already own, that is the
// cheapest possible week to find out.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { themeState } from '../js/bb/themes.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(extra = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', theme: 'summer-of-temptation' }, extra);
  seasonConfig.twistSchedule = [];
}

const play = (seed = 2026) => withSeededRandom(seed, () => simulateBBEpisode());

describe('Summer of Temptation', () => {
  beforeEach(() => house());

  it('installs itself and books its arc on the first episode', () => {
    play();
    const st = themeState();
    expect(st.id).toBe('summer-of-temptation');
    expect(st.booked.length).toBeGreaterThan(0);
    expect(seasonConfig.twistSchedule.every(t => t.source === 'theme')).toBe(true);
  });

  it('books the Den, because that is what the season is', () => {
    play();
    expect(themeState().booked).toContain('bb-den-of-temptation');
  });

  it('speaks in the first week', () => {
    const ep = play();
    const said = (ep.acts || []).filter(a => a.type === 'theme-beat');
    expect(said.length).toBeGreaterThan(0);
    expect(said[0].speaker).toBe('The Den');
  });

  it('leaves a week you booked yourself alone', () => {
    house();
    seasonConfig.twistSchedule = [{ id: 'mine', episode: 2, type: 'bb-roadkill' }];
    play();
    const wk2 = seasonConfig.twistSchedule.filter(t => Number(t.episode) === 2);
    expect(wk2).toHaveLength(1);
    expect(wk2[0].type).toBe('bb-roadkill');
  });

  it('plays a full season without throwing', () => {
    withSeededRandom(31, () => {
      let guard = 0;
      while ((gs.activePlayers || []).length > 3 && guard++ < 40) {
        if (!simulateBBEpisode()) break;
      }
      expect(gs.activePlayers.length).toBe(3);
    });
  });

  it('replays identically from the same seed', () => {
    const a = JSON.stringify(play(909).acts.map(x => x.type));
    house();
    const b = JSON.stringify(play(909).acts.map(x => x.type));
    expect(a).toBe(b);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/bb-theme-temptation.test.js`
Expected: FAIL — `booked.length` is 0, the arc is still empty.

- [ ] **Step 3: Write minimal implementation**

Replace the body of `js/bb/themes-temptation.js`:

```js
// Summer of Temptation (BB19).
//
// The house is offered something every week and the offer is FREE — refusing
// costs nothing, which is the only reason accepting is a decision. The
// season's cruelty is the part I had backwards from memory and the wiki
// corrected: the consequence does not land on the person who accepted. Paul
// took the Pendant; Ramses was cursed. That gives a blameless beneficiary, an
// innocent victim, and a house hunting a culprit it cannot identify.
//
// This theme is the theme engine's proof rather than its showpiece: the Den,
// the powers shelf and the Halting Hex are already built, so the arc is
// composition. If the engine cannot assemble a season out of parts we own,
// this is the cheapest week to discover it.
import { registerTheme } from './themes.js';

export default registerTheme({
  id: 'summer-of-temptation',
  name: 'Summer of Temptation',
  tagline: 'Every week, an offer. Somebody else pays for it.',
  house: 'bb-house',
  palette: { accent: '#c02040', ink: '#f3e8ea', paper: '#1a0a0e', glow: '#ff4d6d' },
  fonts: { display: '"Cinzel", Georgia, serif', body: '"Inter", system-ui, sans-serif' },

  antagonist: {
    name: 'The Den',
    mood: 'neutral',
    voice: {
      open: {
        neutral: [
          'Week {week}. The Den is open, and it is not asking twice.',
          'Somebody in this house wants something. Week {week} is where they admit it.',
          'The Den has been patient for {week} weeks. Patience is not a promise.',
          'Week {week}. There is a door, and it is unlocked, and that is all the Den will say.',
        ],
        hostile: [
          'Week {week}. The Den has stopped offering and started collecting.',
          'You have all taken something by now. Week {week} is the invoice.',
          'The Den remembers every yes. Week {week} remembers with it.',
          'Week {week}. Somebody is about to find out what they agreed to.',
        ],
      },
      noms: {
        neutral: [
          '{hoh} names {nominees}. The Den notes that neither of them was offered anything.',
          '{nominees}. The Den finds it interesting who {hoh} did not name.',
          '{hoh} has chosen {nominees}, which is a choice somebody could have prevented.',
          'On the block: {nominees}. Somewhere in this house is a person who could have stopped that and did not.',
        ],
        hostile: [
          '{hoh} names {nominees}, and the Den did not have to lift a finger.',
          '{nominees}. The Den is enjoying this more than {hoh} is.',
          '{hoh} thinks {nominees} was their idea. Let them.',
        ],
      },
      veto: {
        neutral: [
          'The veto has moved. The Den has not.',
          'A necklace changes a week. The Den changes a summer.',
          'Somebody just used a power they earned. How quaint.',
          'The veto is a small door. The Den is a large one.',
        ],
        hostile: [
          'The veto bought somebody a week. The Den is not in the week business.',
          'Use the necklace. The Den will still be here on Thursday.',
        ],
      },
      vote: {
        neutral: [
          '{evicted} leaves without ever being offered anything. The Den considers that a mercy.',
          '{evicted} is gone. The Den keeps the receipt.',
          'The house evicts {evicted}, and somebody in the room exhales for the wrong reason.',
          '{evicted} walks out. The offer stands for everyone else.',
        ],
        hostile: [
          '{evicted} is gone, and the Den notes that nobody has admitted anything yet.',
          '{evicted} leaves. The Den is running out of patience and people.',
        ],
      },
    },
  },

  // The offers escalate and the curse keeps landing on somebody blameless.
  // Pandora's Box is the late one on purpose: by then the house has watched
  // two people take something for free, so a box that charges for it reads as
  // the season finally presenting a bill. It is also the distributor that can
  // put the Halting Hex in somebody's hands, which is the BB19 ending.
  arc: [
    { at: { week: 2 }, book: 'bb-den-of-temptation' },
    { at: { week: 3 }, book: 'bb-have-nots' },
    { at: { week: 5 }, book: 'bb-den-of-temptation' },
    { at: { week: 6 }, mood: 'hostile' },
    { at: { fromEnd: 3 }, book: 'bb-pandoras-box', options: { prize: 'halting-hex' } },
    { at: { fromEnd: 1 }, book: 'bb-double-eviction' },
  ],

  books: ['bb-den-of-temptation', 'bb-pandoras-box'],
  weights: { 'bb-pandoras-box': 1.6, 'bb-prizes-and-punishments': 1.4 },
  bans: [],
  exclusive: [],
});
```

- [ ] **Step 4: Teach the arc to change mood**

The arc now contains a `{ at: { week: 6 }, mood: 'hostile' }` act, which `themeScheduleEntries` skips (no `book`). Add the mood application to `js/bb/themes.js`, and call it from the week:

```js
/**
 * Apply any non-booking arc acts scheduled for this week.
 *
 * Mood changes are the arc's other job: a heel turn is a register change plus
 * a palette change, not a second character.
 */
export function advanceThemeArc(weekNum, totalWeeks) {
  const theme = currentTheme();
  const st = themeState();
  if (!theme || !st) return null;
  for (const act of theme.arc || []) {
    if (!act || !act.mood) continue;
    const ep = act.at?.week != null
      ? Number(act.at.week)
      : Number(totalWeeks) - Number(act.at?.fromEnd || 0);
    if (Number(weekNum) === ep) setThemeMood(act.mood);
  }
  return st.mood;
}
```

In `js/bb/week.js`, change the `open` hook added in Task 3 to advance the arc first:

```js
  advanceThemeArc(week.num, (gs.bb?.theme?.booked?.length ? week.num + (gs.activePlayers || []).length - 3 : week.num));
  _themeSay(week, 'open', {});
```

Simplify: compute total weeks once from the house that walked in. Add near the top of `simulateBBWeek`, after `week.num` is known:

```js
  // Where the endgame is, counted from here: a house loses one a week and ends
  // at three.
  const _totalWeeks = week.num + Math.max(0, (gs.activePlayers || []).length - 3);
  advanceThemeArc(week.num, _totalWeeks);
```

and leave the `open` hook as the plain `_themeSay(week, 'open', {});` from Task 3. Add `advanceThemeArc` to the `themes.js` import line in `week.js`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/bb-theme-temptation.test.js tests/bb-themes.test.js`
Expected: PASS.

- [ ] **Step 6: Run the BB regression set**

Run: `npx vitest run tests/bb-act-coverage.test.js tests/bb-replay-episode.test.js tests/bb-invisible-hoh.test.js`
Expected: PASS. Kill any orphan vitest workers afterward.

- [ ] **Step 7: Play it in the browser**

This is the highest-value verification there is and it has found rules bugs no test caught. Serve the repo, open `simulator.html`, then in the console:

```js
window.initGameState();          // NOT a hand-rolled gs — it needs riPlayers etc.
seasonConfig.format = 'big-brother';
seasonConfig.theme  = 'summer-of-temptation';
for (let i = 0; i < 9 && gs.activePlayers.length > 3; i++) simulateBBEpisode();
buildVPScreens(gs.episodeHistory[0]);
```

Confirm by eye: the reader is red rather than gold, the Den speaks at the week open and at nominations, its register hardens from Week 6, and the Den of Temptation actually fires in Week 2 without you booking it.

- [ ] **Step 8: Commit and push**

```bash
git add js/bb/themes-temptation.js js/bb/themes.js js/bb/week.js tests/bb-theme-temptation.test.js
git commit -m "The Den opens on its own schedule now, and hardens when it stops being asked"
git pull --rebase --autostash && git push
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Identity (palette, fonts, house binding) | 1, 5 |
| House bindings incl. `bb-resort` = Casino | documented in spec; Task 1 test enforces the binding is a real house |
| Antagonist with state-reading voice + moods | 3, 7 |
| Arc: week-indexed acts, `fromEnd` for endgame | 2, 7 |
| Arc emits `twistSchedule` entries | 2 |
| Hand-booked twists win | 2 (test), 7 (played test) |
| Arc can change antagonist mood | 7 step 4 |
| Twist affinity: books / weights / bans / exclusive | 1 (shape), 7 (populated) |
| Arc can insert eliminations | **Deferred** — spec assigns this to the Mastermind theme (roadmap #4), not Tier 0. |
| Format-agnostic descriptor | 1 (structure carries no house vocabulary) |
| VP skin scoped to `.rp-page` | 5 |
| Both transcript writers + screen registration | 6 |
| Determinism / `stableRng` | 3, 7 |
| Theme picker in config, BB-only | 4 |
| Summer of Temptation as first theme | 7 |

**Deferred, deliberately:** `weights` and `bans` are carried on the descriptor and asserted for shape in Task 1, but nothing consumes them yet — they feed the randomiser, which is a separate surface. The first theme that needs a ban will wire them; adding a consumer with no caller now would be speculative.

**Placeholder scan:** none. Every code step contains the code.

**Type consistency:** `themeState()` returns `{ id, mood, booked, said }` in Tasks 2, 3 and 7. `themeVoice` returns `{ speaker, line, mood, hook }` in Task 3 and is consumed by `themeBeat` in the same task. `themeBeat`'s act shape in Task 3 matches what Task 6's transcript cases and `rpBuildBBThemeBeat` read. `themeScheduleEntries(theme, {weeks, existing})` has the same signature in Tasks 2 and 7.
