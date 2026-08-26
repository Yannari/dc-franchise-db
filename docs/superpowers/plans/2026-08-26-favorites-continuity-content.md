# Favorites Continuity Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Research, author, and verify source profiles and a continuity bible for Bowie, Mike, Millie, Thom, Grett, Gabby, James, Lake, Yul, Natalia, Julia, and DJ.

**Architecture:** Source canon is stored as structured roster biography/characterization with field-level provenance. Archived simulator events remain in a separate continuity bible, with a compact episode-writer context generated from it. Thom uses Tom's source canon plus only the archived Thom Seasons 11/13 history.

**Tech Stack:** JSON, Markdown, repository season datasets, official/reference web sources, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-26-favorites-continuity-profile-import-design.md`

## Global Constraints

- Never present an unsupported birthday, hometown, ethnicity, nationality, occupation, or sexuality as canon.
- Separate source canon, simulator continuity, and interpretation explicitly.
- Use only the nine valid stats and proportional gameplay interpretation.
- Preserve all archived placements and deeds exactly; do not invent votes or season events.
- Thom receives Tom's canon personality and Thom's Seasons 11/13 history; archived Tom Season 7 remains separate.
- Profile prose is paraphrased; citations link to sources without copying long wiki passages.
- Generated Total Drama writing uses Total Drama vocabulary from `js/shows.js`.

---

### Task 1: Research ledger and archive extraction

**Files:**
- Create: `docs/continuity/fans-vs-favorites-favorites-sources.md`
- Create: `data/continuity/fans-vs-favorites-favorites-history.json`
- Test: `tests/favorites-continuity-data.test.js`

**Interfaces:**
- Produces: one source ledger section and one normalized history record per Favorite, keyed by roster slug.

- [ ] **Step 1: Write the failing data-contract test**

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const expected = ['bowie','mike','millie','thom','grett','gabby','james','lake','yul','natalia','julia','dj'];
const history = JSON.parse(readFileSync('data/continuity/fans-vs-favorites-favorites-history.json','utf8'));

describe('Favorites continuity history', () => {
  it('contains the finalized cast once each', () => {
    expect(Object.keys(history.players).sort()).toEqual([...expected].sort());
  });
  it('keeps Thom and archived Tom distinct', () => {
    expect(history.players.thom.canonIdentity).toBe('Tom');
    expect(history.players.thom.appearances.map(x => x.season)).toEqual([11,13]);
    expect(history.players).not.toHaveProperty('tom');
  });
});
```

- [ ] **Step 2: Run the contract test and verify missing-file failure**

Run: `npx vitest run tests/favorites-continuity-data.test.js`

Expected: FAIL because the history JSON does not exist.

- [ ] **Step 3: Research canon with traceable sources**

For each character, record page title, resolved URL, accessed date, supported fields, and whether the source is official or community-maintained. Start from the Total Drama Wiki pages for Bowie, Mike, Millie, Julia, and DJ; Total Drama's Ridonculous Race pages for relevant source details; and the Disventure Camp Wiki character pages for Tom, Grett, Gabby, James, Lake, Yul, and Natalia. Use official show material when a wiki claim is disputed. Record “not officially stated” rather than filling gaps.

- [ ] **Step 4: Extract simulator history mechanically**

Read all `data/seasons/season*-data.json` files. For each exact archived name, copy structured placement, story, gameplayStyle, keyMoments, statistics, alliances, rivalries, and any available personality/quotes/trivia. Store appearances chronologically. For Thom, query only `name === 'Thom'`, then add `canonIdentity: 'Tom'`; never ingest the `name === 'Tom'` Season 7 record.

- [ ] **Step 5: Run the data contract test**

Run: `npx vitest run tests/favorites-continuity-data.test.js`

Expected: PASS.

- [ ] **Step 6: Commit the research ledger and normalized archive**

```bash
git add docs/continuity/fans-vs-favorites-favorites-sources.md data/continuity/fans-vs-favorites-favorites-history.json tests/favorites-continuity-data.test.js
git commit -m "docs: collect Favorites canon and season history"
```

### Task 2: Publish the twelve structured source profiles

**Files:**
- Modify: `franchise_roster.json`
- Modify: `voice-profiles.json`
- Test: `tests/favorites-profile-data.test.js`

**Interfaces:**
- Consumes: source ledger and normalized history from Task 1; Cast Profile Import feature from the companion plan.
- Produces: complete roster `voice`, `personality`, `backstory`, verified biography fields, gameplay interpretation, and `profileSources` for all twelve slugs.

- [ ] **Step 1: Write failing roster assertions**

```js
const roster = JSON.parse(readFileSync('franchise_roster.json','utf8')).players;
for (const slug of expected) {
  const p = roster.find(x => x.slug === slug);
  expect(p, slug).toBeTruthy();
  expect(p.voice.length, `${slug} voice`).toBeGreaterThan(80);
  expect(p.personality.length, `${slug} personality`).toBeGreaterThan(180);
  expect(p.backstory.length, `${slug} backstory`).toBeGreaterThan(120);
  expect(p.profileSources.personality.length, `${slug} sources`).toBeGreaterThan(0);
  expect(Object.keys(p.stats).sort()).toEqual([...VALID_STATS].sort());
}
```

Also assert that blank unknown dates stay absent/empty and that every source kind belongs to the allowed set.

- [ ] **Step 2: Run the profile test and verify failure**

Run: `npx vitest run tests/favorites-profile-data.test.js`

Expected: FAIL because the structured voice/provenance fields are not complete.

- [ ] **Step 3: Author source-grounded profiles**

For each Favorite, write: concise voice rules; long personality; pre-show/source backstory; verified demographics; behavioral boundaries; one valid archetype; and nine balanced stats. Treat stats as interpretation and cite them accordingly. Keep season accomplishments out of backstory and personality unless they changed an enduring behavior described in the later continuity bible.

- [ ] **Step 4: Regenerate compatibility voices**

Use the same roster-to-voice projection implemented in the companion plan. Confirm that each of the twelve `voice-profiles.json` entries equals the composed roster voice and is not independently edited prose.

- [ ] **Step 5: Run data and existing bio tests**

Run: `npx vitest run tests/favorites-profile-data.test.js tests/bio.test.js tests/roster-bio-fields.test.js`

Expected: PASS.

- [ ] **Step 6: Commit the structured profiles**

```bash
git add franchise_roster.json voice-profiles.json tests/favorites-profile-data.test.js
git commit -m "data: publish Favorites source profiles"
```

### Task 3: Author the full continuity bible

**Files:**
- Create: `docs/continuity/fans-vs-favorites-favorites-bible.md`
- Test: `tests/favorites-continuity-data.test.js`

**Interfaces:**
- Consumes: normalized history JSON and structured roster profiles.
- Produces: twelve writing-reference entries and a cross-cast relationship map.

- [ ] **Step 1: Extend the failing bible completeness test**

Assert that the Markdown contains one stable heading marker per slug, all archived season numbers found in the normalized history, and the required section labels `Canon baseline`, `Simulator chronology`, `Evolution`, `Current motivation`, `Voice`, `Behavioral boundaries`, `Favorites relationships`, and `Open hooks`.

- [ ] **Step 2: Run the continuity test and verify failure**

Run: `npx vitest run tests/favorites-continuity-data.test.js`

Expected: FAIL because the bible does not exist.

- [ ] **Step 3: Write each character entry**

Reconcile canon with archived deeds without flattening either. Describe behavior rather than labels: how anger appears at camp, how trust changes their vote conversations, what they conceal in confessionals, how they respond under pressure, and what they would never do. Give every unresolved hook a named counterpart and an archived cause.

- [ ] **Step 4: Add the cross-cast relationship map**

Document direct shared-history links first, including Bowie–Julia. Mark pairs without shared history as “no established simulator relationship” instead of inventing familiarity. Identify likely friction or affinity separately as interpretation.

- [ ] **Step 5: Run the continuity test**

Run: `npx vitest run tests/favorites-continuity-data.test.js`

Expected: PASS.

- [ ] **Step 6: Commit the bible**

```bash
git add docs/continuity/fans-vs-favorites-favorites-bible.md tests/favorites-continuity-data.test.js
git commit -m "docs: add Fans vs Favorites continuity bible"
```

### Task 4: Generate compact episode-writer context

**Files:**
- Create: `data/continuity/fans-vs-favorites-favorites-context.json`
- Create: `scripts/build-favorites-context.mjs`
- Modify: `package.json`
- Test: `tests/favorites-continuity-data.test.js`

**Interfaces:**
- Consumes: normalized history JSON, roster profiles, and full bible.
- Produces: `{ season, cast, franchiseContext }` ready to paste/load into the existing episode writer without mixing biography and career history.

- [ ] **Step 1: Add a failing compact-context test**

Assert all twelve names appear exactly once, the context contains placements and unresolved relationships, no entry exceeds the chosen 1,200-character per-player ceiling, and Thom's context mentions Seasons 11/13 but not Tom's Season 7.

- [ ] **Step 2: Run the test and verify failure**

Run: `npx vitest run tests/favorites-continuity-data.test.js`

Expected: FAIL because the context artifact and generator do not exist.

- [ ] **Step 3: Implement deterministic context generation**

Read the structured history and roster. Produce per-player blocks in finalized cast order with source baseline, chronological results, key relationships, evolution, and open hooks. Do not call an AI service; the output must be reproducible and reviewable. Add `"build:favorites-context": "node scripts/build-favorites-context.mjs"` to `package.json`.

- [ ] **Step 4: Generate and test the artifact**

Run: `npm run build:favorites-context`

Run: `npx vitest run tests/favorites-continuity-data.test.js`

Expected: generation exits 0 and tests pass.

- [ ] **Step 5: Commit the writer context**

```bash
git add data/continuity/fans-vs-favorites-favorites-context.json scripts/build-favorites-context.mjs package.json tests/favorites-continuity-data.test.js
git commit -m "feat: generate Favorites episode context"
```

### Task 5: Final verification

**Files:**
- Modify only if required by failures: Favorites profile/content files from Tasks 1–4.

**Interfaces:**
- Consumes: all content tasks and the completed profile import feature.
- Produces: verified profiles loadable in Cast Studio and continuity context ready for episode writing.

- [ ] **Step 1: Run focused verification**

Run: `npm run build:favorites-context`

Run: `npx vitest run tests/favorites-profile-data.test.js tests/favorites-continuity-data.test.js tests/bio.test.js tests/roster-bio-fields.test.js`

Expected: PASS.

- [ ] **Step 2: Run the full suite and file checks**

Run: `npm test`

Run: `git diff --check`

Expected: all tests pass and no whitespace errors are reported.

- [ ] **Step 3: Verify Cast Studio manually**

Open each of the twelve Favorites in `simulator.html`, preview the published profile, confirm provenance and protected conflict defaults, apply it, save, and reload. Confirm the compact franchise context can be placed in the existing Franchise Context field and that Thom is described as Tom in source characterization but only carries Thom's Seasons 11/13 career.

- [ ] **Step 4: Commit verification fixes if any**

```bash
git add franchise_roster.json voice-profiles.json docs/continuity data/continuity scripts/build-favorites-context.mjs package.json tests/favorites-profile-data.test.js tests/favorites-continuity-data.test.js
git commit -m "fix: verify Favorites continuity package"
```

