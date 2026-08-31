# Cast Profile Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a published `franchise_roster.json` profile safely previewable and selectively loadable into Cast Studio while deriving the legacy voice database from the roster-authored voice.

**Architecture:** Put schema validation, diffing, selection defaults, and selective application in a small pure module. Cast Studio owns only rendering and draft wiring. The Studio worker persists structured `voice` and `profileSources`; publishing projects roster voices into `voice-profiles.json` for existing consumers.

**Tech Stack:** Browser ES modules, IndexedDB/localStorage, Cloudflare Worker + D1, Vitest/jsdom, JSON.

**Spec:** `docs/superpowers/specs/2026-08-26-favorites-continuity-profile-import-design.md`

## Global Constraints

- `franchise_roster.json` is the authored source for reusable character profiles.
- `voice-profiles.json` remains a generated compatibility projection in this iteration.
- Import matches by stable slug and never silently overwrites a nonblank value.
- Only `physical`, `endurance`, `mental`, `social`, `strategic`, `loyalty`, `boldness`, `intuition`, and `temperament` are valid stats.
- Unknown canon facts stay blank; invalid ISO birthdates are rejected.
- Source kinds are `source-canon`, `simulator-continuity`, `interpretation`, or `authored`.
- Applying an import changes only the unsaved Studio draft.

---

### Task 1: Pure profile import contract

**Files:**
- Create: `js/profile-import.js`
- Test: `tests/profile-import.test.js`

**Interfaces:**
- Produces: `PROFILE_GROUPS`, `PROFILE_SOURCE_KINDS`, `validatePublishedProfile(profile)`, `diffPublishedProfile(current, published)`, `applyProfileSelection(current, published, selectedKeys)`, and `selectProfileVoice({ localVoice, rosterVoice, legacyVoice })`.

- [ ] **Step 1: Write failing contract tests**

```js
import { describe, expect, it } from 'vitest';
import {
  applyProfileSelection, diffPublishedProfile,
  selectProfileVoice, validatePublishedProfile,
} from '../js/profile-import.js';

const stats = { physical:5,endurance:6,mental:7,social:8,strategic:9,
  loyalty:4,boldness:7,intuition:8,temperament:6 };

describe('published profile import', () => {
  it('selects blank fields but protects existing authored values', () => {
    const rows = diffPublishedProfile(
      { name:'Julia', slug:'julia', personality:'My edit', hometown:'' },
      { name:'Julia', slug:'julia', personality:'Published', hometown:'Toronto' });
    expect(rows.find(r => r.key === 'hometown').selected).toBe(true);
    expect(rows.find(r => r.key === 'personality').selected).toBe(false);
  });

  it('applies only checked fields without mutating either input', () => {
    const current = { name:'Julia', slug:'julia', personality:'Mine', hometown:'' };
    const published = { name:'Julia', slug:'julia', personality:'Theirs', hometown:'Toronto' };
    expect(applyProfileSelection(current, published, ['hometown']))
      .toEqual({ ...current, hometown:'Toronto' });
    expect(current.hometown).toBe('');
  });

  it('rejects unknown stats and malformed dates', () => {
    expect(validatePublishedProfile({ slug:'julia', stats:{ ...stats, luck:10 } }).errors)
      .toContain('Unknown stat: luck');
    expect(validatePublishedProfile({ slug:'julia', birthdate:'July 4' }).errors)
      .toContain('birthdate must use YYYY-MM-DD');
  });

  it('uses local, then roster, then legacy voice', () => {
    expect(selectProfileVoice({ localVoice:'local', rosterVoice:'roster', legacyVoice:'legacy' })).toBe('local');
    expect(selectProfileVoice({ localVoice:'', rosterVoice:'roster', legacyVoice:'legacy' })).toBe('roster');
    expect(selectProfileVoice({ localVoice:'', rosterVoice:'', legacyVoice:'legacy' })).toBe('legacy');
  });
});
```

- [ ] **Step 2: Run the test and verify the missing-module failure**

Run: `npx vitest run tests/profile-import.test.js`

Expected: FAIL because `js/profile-import.js` does not exist.

- [ ] **Step 3: Implement the pure module**

Define ordered groups for Identity, Biography, Characterization, Gameplay, and Interview. Validate exact stat keys, values from 1 through 10, ISO dates that round-trip through `Date`, matching slugs, and source objects shaped as `{ label, url?, kind }`. Diff scalar fields, stats as one row, and the interview as one row; deep-clone applied arrays/objects with `structuredClone` or JSON fallback.

```js
export const PROFILE_SOURCE_KINDS = new Set([
  'source-canon', 'simulator-continuity', 'interpretation', 'authored',
]);
export const PROFILE_GROUPS = Object.freeze({
  Identity: ['name','gender','sexuality','ethnicity','nationality','descriptor'],
  Biography: ['birthdate','age','hometown','occupation','backstory'],
  Characterization: ['personality','voice'],
  Gameplay: ['archetype','stats'],
  Interview: ['castingInterview'],
});
```

- [ ] **Step 4: Run the focused tests**

Run: `npx vitest run tests/profile-import.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the pure contract**

```bash
git add js/profile-import.js tests/profile-import.test.js
git commit -m "feat: add published profile import contract"
```

### Task 2: Roster voice and provenance persistence

**Files:**
- Modify: `js/studio.js` (`_blankChar`, `_editBySlug`, `_save`, `_exportRepo`)
- Modify: `worker/worker-studio.js` (roster row mapping, upsert, publish projection)
- Modify: `worker/queries.js` (profile columns in roster queries)
- Test: `tests/roster-bio-fields.test.js`
- Test: `tests/profile-import.test.js`

**Interfaces:**
- Consumes: `selectProfileVoice` from Task 1.
- Produces: roster records containing optional `voice` and `profileSources`; legacy voices derived from each roster record during publish/export.

- [ ] **Step 1: Add failing persistence assertions**

Add tests that read Studio and worker source and assert:

```js
expect(studio).toMatch(/voice:\s*d\.voice/);
expect(studio).toMatch(/profileSources:\s*d\.profileSources/);
expect(worker).toMatch(/profile_sources/);
expect(worker).toMatch(/row\.voice/);
```

Add a pure assertion that `selectProfileVoice` gives roster voice precedence over legacy voice when no local Studio voice exists.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npx vitest run tests/profile-import.test.js tests/roster-bio-fields.test.js`

Expected: FAIL because roster voice/provenance are not persisted or published.

- [ ] **Step 3: Extend Studio draft loading and saving**

Import `selectProfileVoice`. Add `profileSources:{}` to `_blankChar`. In `_editBySlug`, resolve the prose voice with:

```js
const legacyVoice = await _existingVoice(base.name);
const voice = selectProfileVoice({
  localVoice: rich?.voice || '',
  rosterVoice: base.voice || '',
  legacyVoice,
});
```

Carry `profileSources` through `_draft`, `entry`, and `rich`. Put raw `voice` on `entry`; continue composing the biography lead only for the compatibility projection.

- [ ] **Step 4: Extend worker storage and publishing**

Add nullable `voice TEXT` and `profile_sources TEXT` handling to the existing D1 roster migration/upsert/query path. Parse/stringify provenance defensively. When publishing, emit `voice` and `profileSources` in roster rows, and generate each compatibility entry with the same biography-lead composition rules used by Studio rather than treating D1 voice as a second authored database.

- [ ] **Step 5: Make export derive all migrated voices from roster data**

Change `_exportRepo` so every roster row with `voice` overwrites the matching compatibility profile. Only characters without roster voice fall back to existing `voice-profiles.json` or IndexedDB voice.

- [ ] **Step 6: Run focused and worker tests**

Run: `npx vitest run tests/profile-import.test.js tests/roster-bio-fields.test.js tests/live-sync-show.test.js`

Expected: PASS.

- [ ] **Step 7: Commit persistence**

```bash
git add js/studio.js worker/worker-studio.js worker/queries.js tests/profile-import.test.js tests/roster-bio-fields.test.js
git commit -m "feat: make roster own profile voice and sources"
```

### Task 3: Preview and selective import UI

**Files:**
- Modify: `js/studio.js` (`_renderEditor`, editor event wiring, modal rendering)
- Test: `tests/profile-import-ui.test.js`

**Interfaces:**
- Consumes: `diffPublishedProfile`, `applyProfileSelection`, and `validatePublishedProfile` from Task 1.
- Produces: `_openPublishedProfilePreview(published)` and a `Load published profile` editor action.

- [ ] **Step 1: Write failing jsdom interaction tests**

Mount an editor draft with a blank hometown and edited personality, click Load, and assert that the preview selects hometown but not personality. Apply the default selection and assert the draft changes without `_save` being called. Add cases for Cancel and an invalid source kind.

```js
expect(document.querySelector('[data-profile-key="hometown"]').checked).toBe(true);
expect(document.querySelector('[data-profile-key="personality"]').checked).toBe(false);
expect(saveSpy).not.toHaveBeenCalled();
```

- [ ] **Step 2: Run the UI test and verify failure**

Run: `npx vitest run tests/profile-import-ui.test.js`

Expected: FAIL because the button and preview do not exist.

- [ ] **Step 3: Render the action and accessible preview**

Add the button only when `_roster()` contains the current slug. Render a `<dialog id="st-profile-import">` with grouped diff rows, current/published values, provenance badges, and checkboxes. Provide Fill blanks, Select all, Cancel, and Apply selected. Use text nodes or `_esc` for every profile value and source label.

- [ ] **Step 4: Apply only to the draft and rerender**

On Apply, collect checked `data-profile-key` values, call `applyProfileSelection`, replace `_draft`, and call `renderStudio()`. Do not call `_save`, `_idbPut`, `_persistRoster`, or any endpoint. Display validation errors inside the dialog and leave unsafe fields unchecked.

- [ ] **Step 5: Add responsive and reduced-motion styles**

Keep the dialog usable below 720px, make value columns stack on narrow screens, preserve visible focus rings, and include the existing `@media(prefers-reduced-motion:reduce)` behavior for dialog transitions.

- [ ] **Step 6: Run focused UI tests**

Run: `npx vitest run tests/profile-import-ui.test.js tests/profile-import.test.js`

Expected: PASS.

- [ ] **Step 7: Commit the UI**

```bash
git add js/studio.js tests/profile-import-ui.test.js
git commit -m "feat: preview published Cast Studio profiles"
```

### Task 4: Regression and browser verification

**Files:**
- Modify if required by failures: `js/profile-import.js`, `js/studio.js`, `worker/worker-studio.js`, `worker/queries.js`
- Test: `tests/profile-import.test.js`
- Test: `tests/profile-import-ui.test.js`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: verified import feature ready for profile content.

- [ ] **Step 1: Run the complete unit suite**

Run: `npm test`

Expected: all tests pass. Investigate failures without changing unrelated behavior.

- [ ] **Step 2: Run syntax and whitespace checks**

Run: `node --check js/profile-import.js`

Run: `node --check js/studio.js`

Run: `node --check worker/worker-studio.js`

Run: `git diff --check`

Expected: all commands exit 0.

- [ ] **Step 3: Verify in the browser**

Open `simulator.html`, enter Create Character, open a roster Favorite, and verify: preview opens; blank fields are selected; edited fields are protected; source labels render; Cancel changes nothing; Apply changes the draft only; Save persists; reload preserves the values; Export produces the same composed compatibility voice.

- [ ] **Step 4: Commit any verification fixes**

```bash
git add js/profile-import.js js/studio.js worker/worker-studio.js worker/queries.js tests/profile-import.test.js tests/profile-import-ui.test.js
git commit -m "fix: harden published profile import"
```

