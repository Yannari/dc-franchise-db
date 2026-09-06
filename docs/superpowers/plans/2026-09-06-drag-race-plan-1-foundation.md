# Drag Race Plan 1 — Foundation and a playable headless season

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register Drag Race as the fourth show and play a full regular season headless and from the run tab, with a generic maxi challenge, the three-step decision engine, the lip sync, and one episode row per week — no VP, no text pools, no per-type challenges yet.

**Architecture:** A registry entry in `js/shows.js` plus a bespoke engine under `js/dr/` behind `window._drRunnable`, dispatched from `js/dr-run.js` the way `js/tr-run.js` dispatches The Traitors (whole season played in one call, rows queued, one row shifted per press). The queen's craft lives in a `drag` block on the roster record; judges, songs and the challenge catalogue are JS data modules (this repo has no build step and imports no JSON). The week is a spine of steps writing one `episodeHistory` row stamped `format: 'drag-race'`.

**Tech Stack:** ES modules, no build step, vitest (`npm test` fast lane; season-playing tests are named in `vitest.slow.js`), a seeded rng from `tests/helpers/rng.js` for the engine tests.

**Spec:** `docs/superpowers/specs/2026-09-06-drag-race-design.md`

## Global Constraints

- Branch `drag-race`, worktree `C:\Users\yanna\OneDrive\Documents\GitHub\worktree-drag-race`. Never merge to main mid-build.
- Slug `drag-race`, prefix `dr`. A bare integer season is Total Drama, forever.
- Valid person stats: `physical, endurance, mental, social, strategic, loyalty, boldness, intuition, temperament`. Craft stats: `acting, comedy, dance, design, runway, lipsync, singing`. Nothing else, ever.
- Stats are proportional: `stat * factor`, never `if (stat >= X)` for gameplay.
- Every `Math.random()` in the engine goes through the season rng passed in (`rng()`), so a seeded season replays bit-identically (see `project_bb_seeded_season`).
- No file may hold its own show list. `tests/show-list-duplication.test.js` enforces it: read `SHOWS` from `js/shows.js`.
- Every sentence a screen prints about this show takes its words from the registry `words` block.
- `gs.popularity` is written, never ranked by.
- Prose pools are NOT in this plan (Plan 3). Where a step needs a line, it prints a minimal factual sentence built from names and results only.
- Commit after every task, with the trailer:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Y4XaJLLRHojvnzFuEVJsAt
  ```
- Run only the tests named in each task, never `npm test` in full (see memory `feedback_dont_run_full_suite`). Task 14 runs the show guards once.

## File map

| File | Responsibility |
|---|---|
| `js/shows.js` | registry entry (Task 1) |
| `js/social/adapter.js` | `SHOW_WORDS['drag-race']` vocabulary (Task 1) |
| `tests/helpers/show-vocabulary.js` | `VOCAB['drag-race']` own words (Task 1) |
| `js/core.js` | `formatIsRunnable` branch, `defaultConfig` dr fields (Tasks 1, 2) |
| `js/quick-setup.js` | `SHOW_TAGS`, `HOSTS_BY_FORMAT`, `CONFIG_SCOPE`, `blueprintFor` (Tasks 1, 2) |
| `js/settings.js` | `SETTINGS_BY_FORMAT['drag-race']` (Task 1) |
| `simulator.html` | show option, `sec-dr-options` (Tasks 1, 2) |
| `js/dr/queen.js` | `dragOf`, `starPower`, constants (Task 3) |
| `js/studio.js`, `worker/worker-studio.js`, `serve.py`, `worker/roster_drag_migration.sql` | the `drag` block persists (Task 4) |
| `js/dr/data/judges.js`, `js/dr/judges.js` | judge profiles, guest taste, the panel (Task 5) |
| `js/dr/data/challenges.js`, `js/dr/data/minis.js`, `js/dr/data/songs.js` | catalogues (Task 6) |
| `js/dr/perform.js` | step 1: performance + runway (Task 7) |
| `js/dr/judging.js` | steps 2–3: views, panel ranking, host bend, calling the week (Task 8) |
| `js/dr/lipsync.js` | lip sync score + the call (Task 9) |
| `js/dr/state.js`, `js/dr/week.js` | season state, the 16-step week (Task 10) |
| `js/dr/season.js` | premiere/finale types, the loop (Task 11) |
| `js/dr-run.js`, `js/main.js`, `js/run-ui.js` | runnable flag + dispatch (Task 12) |
| `js/run-ui.js` | episode card, badges, timeline picker (Task 13) |
| `js/stats-export.js` | refusing exporter (Task 14) |

---

### Task 1: Registry entry and vocabulary

**Files:**
- Modify: `js/shows.js` (after the `traitors` entry, before the closing `};` of `SHOWS`)
- Modify: `js/social/adapter.js` (`SHOW_WORDS`, after the `traitors` block)
- Modify: `tests/helpers/show-vocabulary.js` (`VOCAB`)
- Modify: `js/core.js:1529-1536` (`formatIsRunnable`)
- Modify: `js/quick-setup.js:454-458` (`SHOW_TAGS`), `js/quick-setup.js:948-983` (`HOSTS_BY_FORMAT`)
- Modify: `js/settings.js:25-28`
- Modify: `simulator.html:228-232`
- Test: `tests/dr-registry.test.js`

**Interfaces:**
- Produces: `SHOWS['drag-race']` with `words`, `exitVerbs` via `words.exit` and `words.exitDq`, `careerStats`, `audience`, `polls`; `formatIsRunnable('drag-race')` reads `window._drRunnable`.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-registry.test.js
import { describe, expect, it } from 'vitest';
import { SHOWS, showWords, exitVerbs, formatPrefix, seasonId } from '../js/shows.js';
import { formatIsRunnable, SEASON_FORMATS } from '../js/core.js';
import { words as socialWords } from '../js/social/adapter.js';
import { VOCAB } from './helpers/show-vocabulary.js';
import { hostOptionsForFormat, SHOWS as PICKER } from '../js/quick-setup.js';
import { settingsForFormat } from '../js/settings.js';

describe('drag-race registry entry', () => {
  it('is registered with prefix dr', () => {
    expect(SHOWS['drag-race']).toBeTruthy();
    expect(formatPrefix('drag-race')).toBe('dr');
    expect(seasonId('drag-race', 1)).toBe('dr-1');
    expect(SEASON_FORMATS).toContain('drag-race');
  });
  it('speaks its own words', () => {
    const w = showWords('drag-race');
    expect(w.player).toBe('queen');
    expect(w.players).toBe('queens');
    expect(w.round).toBe('Episode');
    expect(w.exit).toBe('sashayed away');
    expect(w.challenge).toBe('maxi challenge');
    expect(w.audienceAward).toBe('Miss Congeniality');
    expect(exitVerbs('drag-race')).toEqual(['sashayed away', 'disqualified']);
  });
  it('declares an audience overlay, career stats and polls', () => {
    const s = SHOWS['drag-race'];
    expect(s.audience.mess).toBeGreaterThan(1);
    expect(s.careerStats.map(([k]) => k)).toContain('dr.wins');
    expect(s.polls.length).toBeGreaterThanOrEqual(3);
  });
  it('is not runnable until the engine sets the flag', () => {
    delete globalThis.window;
    expect(formatIsRunnable('drag-race')).toBe(false);
  });
  it('has social vocabulary, guard vocabulary, a host, and a setting', () => {
    expect(socialWords('drag-race').eliminated).toBe('sashayed away');
    expect(socialWords('drag-race').nominationLabel).toBe(null);
    expect(VOCAB['drag-race'].own).toContain('lip sync');
    expect(hostOptionsForFormat('drag-race')[0]).toEqual({ value: 'RuPaul', label: 'RuPaul' });
    expect(settingsForFormat('drag-race')).toEqual(['dr-werkroom']);
    expect(PICKER.find(p => p.id === 'drag-race')?.tag).toMatch(/runway/i);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-registry.test.js`
Expected: FAIL — `SHOWS['drag-race']` undefined.

- [ ] **Step 3: Add the registry entry**

In `js/shows.js`, after the `traitors` entry's closing `},` add:

```js
  // ── DRAG RACE ──────────────────────────────────────────────────────
  //
  // The first show on this engine with NO BALLOTS. A panel ranks the week,
  // the bottom two lip sync, the host alone decides who leaves. So a round
  // exports `episodes[]` (placements), never votingHistory or weeks, and
  // `eliminated` is null on every row — readers take departures off
  // `exits[]` through roundExits(). Spec: docs/superpowers/specs/
  // 2026-09-06-drag-race-design.md §0, §9.
  'drag-race': {
    prefix: 'dr', name: 'Drag Race', short: 'DR', emoji: '👑', accent: '#ff2d95',
    roundsPath: 'dr.episodes',
    words: { player: 'queen', players: 'queens', round: 'Episode',
      exit: 'sashayed away', exitAction: 'send home',
      // The second door. Read through exitVerbs(); never printed as the first.
      exitDq: 'disqualified',
      challenge: 'maxi challenge', comp: 'maxi challenge', comps: 'maxi challenges won',
      compBeast: 'challenge queen', compWon: 'maxi challenges',
      milestone: 'the finale',
      audienceAward: 'Miss Congeniality',
      fanWords: ['runway', 'lip sync', 'werk room', 'untucked', 'shantay', 'sashay',
        'maxi challenge', 'snatch game', 'main stage', 'condragulations'],
      host: 'RuPaul' },
    // What this show is for, as the ratings read it: mess and personality,
    // not the vote. PROVISIONAL until a season is played (§2.5 of the manual).
    audience: { strategy: 0.4, blindside: 0.7, mess: 1.4, predictable: 0.8,
      steamroll: 1.2, showmance: 0.6, twist: 0.9 },
    careerStats: [
      ['dr.wins',         'totalMaxiWins'],
      ['dr.highs',        'totalHighs'],
      ['dr.lows',         'totalLows'],
      ['dr.bottoms',      'totalBottoms'],
      ['dr.lipsyncWins',  'totalLipsyncWins'],
      ['dr.congeniality', 'totalCongeniality'],
    ],
    articleStats: {
      career: [['maxiWins', 'Maxi challenge wins'], ['lipsyncWins', 'Lip syncs won']],
      season: [['dr.wins', 'Maxi challenge wins'], ['dr.lipsyncWins', 'Lip syncs won'],
        ['dr.bottoms', 'Times in the bottom']],
      comps: [['dr.wins', 'Maxi challenge wins'], ['dr.highs', 'Highs'],
        ['dr.lows', 'Lows'], ['dr.bottoms', 'Bottoms']],
    },
    polls: ['Who wins the next maxi challenge?', 'Who lip syncs next week?',
      'Who was robbed this week?', 'Who takes the crown?'],
  },
```

Then change `exitVerbs`:

```js
export function exitVerbs(format) {
  const w = showWords(format);
  return [w.exit, w.exitMurder, w.exitDq].filter(Boolean);
}
```

- [ ] **Step 4: The runnable flag branch**

In `js/core.js` `formatIsRunnable`, after the `traitors` line:

```js
  if (fmt === 'drag-race') return typeof window !== 'undefined' && !!window._drRunnable;
```

- [ ] **Step 5: Social vocabulary**

In `js/social/adapter.js`, after the `traitors` block of `SHOW_WORDS`:

```js
  'drag-race': {
    name: 'Drag Race', short: 'DR',
    episode: 'episode', Episode: 'Episode', episodeShort: 'Ep',
    elimination: 'elimination', eliminated: 'sashayed away',
    challenge: 'maxi challenge', home: 'werk room',
    // No ballot of any kind in a regular season. The panel and the host decide.
    vote: null, finalVote: null,
    comps: ['maxi challenge', 'lip sync'],
    danger: 'the bottom', Danger: 'The bottom', onDanger: 'in the bottom',
    nominated: 'landed in the bottom', nominee: 'a bottom queen',
    Pawn: 'A safe queen', pawn: 'a safe queen',
    Ceremony: 'The main stage', ceremony: 'the main stage',
    jury: null, safe: 'safe',
    nominationLabel: null,
    polls: [
      { id: 'win', text: 'Who wins the next maxi challenge?' },
      { id: 'lipsync', text: 'Who lip syncs next week?' },
      { id: 'robbed', text: 'Who was robbed this week?' },
    ],
  },
```

Check that `words(fmt)` in the same file tolerates `vote: null` and `jury: null` — search for `.vote` and `.jury` consumers in `js/social/*.js`; each one must guard `if (!w.vote)` and print nothing. Add the guard where missing.

- [ ] **Step 6: Guard vocabulary, hosts, settings, picker, HTML**

`tests/helpers/show-vocabulary.js`, in `VOCAB`:

```js
  'drag-race': {
    own: [
      'queen', 'queens', 'runway', 'lip sync', 'lip-sync', 'lipsync', 'werk room',
      'untucked', 'shantay', 'sashay', 'sashayed away', 'maxi challenge',
      'mini challenge', 'snatch game', 'main stage', 'condragulations',
      'bottom two', 'safe', 'miss congeniality',
    ],
  },
```

`js/quick-setup.js` `SHOW_TAGS`: add `'drag-race': 'Werk room, runway, lip sync for your life',`.
`HOSTS_BY_FORMAT`: add

```js
  'drag-race': [
    { value: 'RuPaul', label: 'RuPaul' },
  ],
```

`js/settings.js` `SETTINGS_BY_FORMAT`: add `'drag-race': ['dr-werkroom'],` and a `dr-werkroom` entry in `SEASON_SETTINGS` with the same shape as `bb-house` (name `'The Werk Room'`, `format: 'drag-race'`, no venue events).

`simulator.html` line 231, add:

```html
                <option value="drag-race">Drag Race — werk room, runway, lip sync for your life</option>
```

- [ ] **Step 7: Run the test and the registry guards**

Run: `npx vitest run tests/dr-registry.test.js tests/show-list-duplication.test.js tests/ratings.test.js tests/show-switcher.test.js tests/show-vocabulary.test.js`
Expected: all PASS. If `show-vocabulary` fails on the fixture, the failure names the leaked word: fix the registry `words`, not the test.

- [ ] **Step 8: Commit**

```bash
git add js/shows.js js/core.js js/social/adapter.js js/quick-setup.js js/settings.js simulator.html tests/helpers/show-vocabulary.js tests/dr-registry.test.js
git commit -m "feat(drag-race): registry entry, vocabulary, runnable flag"
```

---

### Task 2: Setup scope and the show's own options

**Files:**
- Modify: `js/core.js` `defaultConfig()` (~line 1640)
- Modify: `js/quick-setup.js` `CONFIG_SCOPE` (line 1049+), `blueprintFor` (line 40+)
- Modify: `simulator.html` after `sec-tr-options` block (line 666+)
- Test: `tests/dr-setup.test.js`

**Interfaces:**
- Produces on `seasonConfig`: `drPremiere` ('standard'|'talent-show'|'design'|'runway'|'girl-groups'|'split'|'porkchop'), `drFinale` ('top4'|'top3'|'top2'|'perform-then-lipsync'), `drDoubleShantay` (bool), `drDoubleSashay` (bool), `drImmunity` (bool), `drTripleLipsync` (bool), `drSchedule` ([]), `drJudgeWeights` ({}).

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-setup.test.js
import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../js/core.js';
import { configScopeFor, blueprintFor } from '../js/quick-setup.js';

describe('drag-race setup scope', () => {
  it('defaults every dr field', () => {
    const c = defaultConfig();
    expect(c.drPremiere).toBe('standard');
    expect(c.drFinale).toBe('top4');
    expect(c.drDoubleShantay).toBe(true);
    expect(c.drDoubleSashay).toBe(false);
    expect(c.drImmunity).toBe(false);
    expect(c.drTripleLipsync).toBe(false);
    expect(c.drSchedule).toEqual([]);
    expect(c.drJudgeWeights).toEqual({});
  });
  it('shows only what the engine reads', () => {
    const s = configScopeFor('drag-race');
    expect(s.sections).toContain('sec-dr-options');
    expect(s.fields).toEqual(expect.arrayContaining(['cfg-dr-premiere', 'cfg-dr-finale',
      'cfg-dr-double-shantay', 'cfg-dr-double-sashay', 'cfg-dr-immunity', 'cfg-dr-triple']));
    for (const gone of ['cfg-teams', 'cfg-merge', 'cfg-days', 'cfg-theme', 'cfg-tr-pot', 'f-tribe']) {
      expect(s.fields).not.toContain(gone);
    }
    for (const gone of ['idol', 'ri', 'mole', 'coaches', 'advantages']) {
      expect(s.accordions).not.toContain(gone);
    }
    expect(s.accordions).toContain('popularity');
  });
  it('draws a blueprint for a stage, not a camp', () => {
    const segs = blueprintFor({ format: 'drag-race', drFinale: 'top4' }, 14);
    expect(segs.map(x => x.label)).toEqual(['14 queens', 'one werk room', 'finale at top 4']);
    expect(segs.every(x => x.ok)).toBe(true);
    expect(blueprintFor({ format: 'drag-race' }, 5)[0].ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-setup.test.js`
Expected: FAIL — `drPremiere` undefined.

- [ ] **Step 3: Defaults**

In `defaultConfig()` in `js/core.js`, after the `romance: 'enabled',` line add:

```js
    // Drag Race (spec §5). Read only by js/dr/*; scoped in CONFIG_SCOPE.
    drPremiere: 'standard', drFinale: 'top4',
    drDoubleShantay: true, drDoubleSashay: false, drImmunity: false, drTripleLipsync: false,
    drSchedule: [], drJudgeWeights: {},
```

Also in the `localStorage` restore line (~1818) add `if (seasonConfig.drSchedule) seasonConfig.drSchedule = seasonConfig.drSchedule.filter(Boolean);` beside the `bbCompSchedule` filter.

- [ ] **Step 4: Scope map**

In `CONFIG_SCOPE.accordions` change `popularity: ['total-drama', 'big-brother', 'traitors']` to include `'drag-race'`. In `fields` add:

```js
    'cfg-dr-premiere':       ['drag-race'],
    'cfg-dr-finale':         ['drag-race'],
    'cfg-dr-double-shantay': ['drag-race'],
    'cfg-dr-double-sashay':  ['drag-race'],
    'cfg-dr-immunity':       ['drag-race'],
    'cfg-dr-triple':         ['drag-race'],
```

In `sections` add `'sec-dr-options': ['drag-race'], 'sec-dr-divider': ['drag-race'],` and add `'drag-race'` to `'sec-settings-mechanics'` (popularity lives there).

- [ ] **Step 5: Blueprint**

In `blueprintFor`, after `const castle = ...` add `const stage = seasonFormat(config) === 'drag-race';` and before the `if (castle)` block:

```js
  if (stage) {
    segs.length = 0;
    segs.push({ label: `${N} queen${N === 1 ? '' : 's'}`, ok: N >= 8 && N <= 16,
      why: N >= 8 && N <= 16 ? undefined : 'Cast 8 to 16 queens' });
    segs.push({ label: 'one werk room', ok: true });
    const fin = { top4: 4, top3: 3, top2: 2, 'perform-then-lipsync': 4 }[config.drFinale || 'top4'] || 4;
    segs.push({ label: `finale at top ${fin}`, ok: N > fin,
      why: N > fin ? undefined : 'More queens than finalists' });
    return segs;
  }
```

- [ ] **Step 6: The HTML**

In `simulator.html`, directly after the `sec-tr-options` section's closing `</div>` (find the `sec-tr-divider` element and insert before it):

```html
            <div class="setup-section-label" id="sec-dr-options">MAIN STAGE OPTIONS</div>
            <div class="bbopt-fixed">
              <span class="bbopt-fixed-k">Verdict</span>
              <span>The panel ranks the week, the bottom two lip sync, the host decides who goes.</span>
            </div>
            <div class="form-group">
              <label class="form-label">Premiere</label>
              <select id="cfg-dr-premiere" onchange="saveConfig()" class="form-input">
                <option value="standard">Standard — a maxi challenge from episode one</option>
                <option value="talent-show">Talent show</option>
                <option value="design">Design challenge</option>
                <option value="runway">Runway only</option>
                <option value="girl-groups">Girl groups</option>
                <option value="split">Split premiere — two halves, two winners</option>
                <option value="porkchop">Porkchop premiere — a lip sync elimination on night one</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Finale</label>
              <select id="cfg-dr-finale" onchange="saveConfig()" class="form-input">
                <option value="top4">Top 4 lip sync tournament</option>
                <option value="top3">Top 3 lip sync tournament</option>
                <option value="top2">Top 2 lip sync for the crown</option>
                <option value="perform-then-lipsync">Final performance, then the host picks two to lip sync</option>
              </select>
            </div>
            <div class="form-group"><label><input type="checkbox" id="cfg-dr-double-shantay" onchange="saveConfig()"> Double shantay allowed (earned, never rolled)</label></div>
            <div class="form-group"><label><input type="checkbox" id="cfg-dr-double-sashay" onchange="saveConfig()"> Double sashay allowed (earned, never rolled)</label></div>
            <div class="form-group"><label><input type="checkbox" id="cfg-dr-immunity" onchange="saveConfig()"> Early wins carry immunity (seasons 1–5 style)</label></div>
            <div class="form-group"><label><input type="checkbox" id="cfg-dr-triple" onchange="saveConfig()"> Triple lip sync on a bottom tie</label></div>
            <div class="setup-divider" id="sec-dr-divider"></div>
```

Then in `js/cast-ui.js` `saveConfig()` and `applySeasonConfig()` (grep `cfg-tr-pot` to find both), read and write the six controls the same way the Traitors fields are: `seasonConfig.drPremiere = _g('cfg-dr-premiere').value`, checkboxes via `.checked`.

- [ ] **Step 7: Run tests**

Run: `npx vitest run tests/dr-setup.test.js tests/format-scoped-config.test.js`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add js/core.js js/quick-setup.js js/cast-ui.js simulator.html tests/dr-setup.test.js
git commit -m "feat(drag-race): setup scope, premiere/finale options, blueprint"
```

---

### Task 3: The queen model

**Files:**
- Create: `js/dr/queen.js`
- Test: `tests/dr-queen.test.js`

**Interfaces:**
- Produces:
  - `DRAG_STATS = ['acting','comedy','dance','design','runway','lipsync','singing']`
  - `DRAG_STYLES = ['pageant','comedy','fashion','camp','club-kid','spooky','broadway','dancer','glamour','art']`
  - `dragOf(player) → { acting..singing (1–10, default 5), style, traits: [], voice: '' }` — never throws, never mutates.
  - `craftMean(player) → number`
  - `starPower(player, rng) → number in [0, 10]`, per spec §3 weights.
  - `expectedStyleFor(player) → style` (highest craft → a style) used when `style` is missing.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-queen.test.js
import { describe, expect, it } from 'vitest';
import { DRAG_STATS, DRAG_STYLES, dragOf, craftMean, starPower } from '../js/dr/queen.js';
import { seededRandom } from '../tests/helpers/rng.js';

const base = { name: 'Q', archetype: 'villain', age: 22,
  stats: { physical: 5, endurance: 5, mental: 5, social: 8, strategic: 5, loyalty: 3, boldness: 9, intuition: 5, temperament: 5 } };

describe('dragOf', () => {
  it('fills every craft stat at 5 when absent and clamps 1..10', () => {
    const d = dragOf(base);
    for (const k of DRAG_STATS) expect(d[k]).toBe(5);
    expect(dragOf({ ...base, drag: { comedy: 14, dance: -2 } }).comedy).toBe(10);
    expect(dragOf({ ...base, drag: { comedy: 14, dance: -2 } }).dance).toBe(1);
  });
  it('derives a style when none is authored, and keeps an authored one', () => {
    expect(DRAG_STYLES).toContain(dragOf({ ...base, drag: { comedy: 9 } }).style);
    expect(dragOf({ ...base, drag: { comedy: 9 } }).style).toBe('comedy');
    expect(dragOf({ ...base, drag: { style: 'spooky' } }).style).toBe('spooky');
    expect(dragOf({ ...base, drag: { style: 'nonsense' } }).style).not.toBe('nonsense');
  });
  it('craftMean averages the seven', () => {
    expect(craftMean({ ...base, drag: { acting: 10, comedy: 10, dance: 10, design: 10, runway: 10, lipsync: 10, singing: 10 } })).toBe(10);
  });
});

describe('starPower', () => {
  it('is hidden-shaped: proportional, bounded, seeded', () => {
    const rng = seededRandom(7);
    const a = starPower({ ...base, drag: { comedy: 9, acting: 9, lipsync: 9 } }, seededRandom(7));
    const b = starPower({ ...base, archetype: 'floater', age: 30, stats: { ...base.stats, social: 2, boldness: 2 },
      drag: { comedy: 2, acting: 2, lipsync: 2 } }, seededRandom(7));
    expect(a).toBeGreaterThan(b);
    expect(a).toBeLessThanOrEqual(10); expect(b).toBeGreaterThanOrEqual(0);
    expect(starPower(base, seededRandom(3))).toBe(starPower(base, seededRandom(3)));
    expect(starPower(base, seededRandom(3))).not.toBe(starPower(base, seededRandom(4)));
    void rng;
  });
  it('bumps the very young and the veteran, not the middle', () => {
    const at = age => starPower({ ...base, age }, seededRandom(1));
    expect(at(21)).toBeGreaterThan(at(30));
    expect(at(41)).toBeGreaterThan(at(30));
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-queen.test.js`
Expected: FAIL — cannot resolve `js/dr/queen.js`.

- [ ] **Step 3: Implement**

```js
// js/dr/queen.js — what a queen is made of (spec §3)
//
// Layer 1 is the roster record everybody else has: nine stats and an
// archetype, read by the werk room's social engine. Layer 2 is the `drag`
// block below, read ONLY by the judging pipeline. Star power is neither: it
// is computed once per season, kept on gs.dr.star, shown to nobody.
export const DRAG_STATS = ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing'];
export const DRAG_STYLES = ['pageant', 'comedy', 'fashion', 'camp', 'club-kid', 'spooky',
  'broadway', 'dancer', 'glamour', 'art'];
export const DRAG_TRAITS = ['padded', 'bearded', 'big-wigs', 'high-concept', 'seamstress',
  'choreographer', 'hometown-pageant', 'live-vocalist', 'stunt-queen', 'body', 'face', 'wit'];

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const toStat = v => { const n = Number(v); return Number.isFinite(n) ? clamp(Math.round(n), 1, 10) : 5; };

// A style a queen's stats suggest, used when nothing is authored. The map is
// deliberately NOT one-to-one: several styles share a craft, and the tie goes
// to the first listed.
const STYLE_BY_CRAFT = { comedy: 'comedy', design: 'fashion', runway: 'glamour',
  dance: 'dancer', singing: 'broadway', acting: 'camp', lipsync: 'club-kid' };

export function expectedStyleFor(player) {
  const d = player?.drag || {};
  let best = 'pageant', bestV = -1;
  for (const k of DRAG_STATS) {
    const v = toStat(d[k]);
    if (v > bestV) { bestV = v; best = STYLE_BY_CRAFT[k] || 'pageant'; }
  }
  return best;
}

export function dragOf(player) {
  const d = (player && player.drag) || {};
  const out = {};
  for (const k of DRAG_STATS) out[k] = toStat(d[k]);
  out.style = DRAG_STYLES.includes(d.style) ? d.style : expectedStyleFor(player);
  out.traits = Array.isArray(d.traits) ? d.traits.filter(t => DRAG_TRAITS.includes(t)).slice(0, 3) : [];
  out.voice = typeof d.voice === 'string' ? d.voice : '';
  return out;
}

export function craftMean(player) {
  const d = dragOf(player);
  return DRAG_STATS.reduce((s, k) => s + d[k], 0) / DRAG_STATS.length;
}

// Archetype → how much a camera wants them. Villains and wildcards are
// television; floaters and goats are not. A scale, not a gate.
const ARCH_STAR = { villain: 1.0, 'chaos-agent': 0.95, wildcard: 0.9, showmancer: 0.85,
  mastermind: 0.8, schemer: 0.8, hothead: 0.8, 'social-butterfly': 0.75, hero: 0.7,
  'challenge-beast': 0.6, underdog: 0.6, 'perceptive-player': 0.5, 'loyal-soldier': 0.45,
  floater: 0.3, goat: 0.25 };

/** Spec §3: entertainment .35, personality .30, age .15, body/look .10, roll .10. */
export function starPower(player, rng = Math.random) {
  const d = dragOf(player);
  const s = (player && player.stats) || {};
  const entertainment = (d.comedy + d.acting + d.lipsync) / 3;            // 1..10
  const personality = ((Number(s.social) || 5) * 0.5 + (Number(s.boldness) || 5) * 0.5) * 0.6
    + (ARCH_STAR[player?.archetype] ?? 0.5) * 10 * 0.4;                  // 1..10
  const age = Number(player?.age) || 27;
  const ageScore = age < 24 ? 8 : age > 38 ? 8 : 4;                       // bump at both ends
  const look = 4 + d.traits.filter(t => ['padded', 'body', 'face', 'big-wigs', 'bearded'].includes(t)).length * 2;
  const roll = rng() * 10;
  return clamp(entertainment * 0.35 + personality * 0.30 + ageScore * 0.15
    + Math.min(10, look) * 0.10 + roll * 0.10, 0, 10);
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-queen.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/dr/queen.js tests/dr-queen.test.js
git commit -m "feat(drag-race): queen model — craft block, style, hidden star power"
```

---

### Task 4: The `drag` block persists — Studio, worker, serve.py

**Files:**
- Modify: `js/studio.js` (draft defaults ~line 153, editor HTML ~line 1595, listeners ~line 1828, `_save` ~line 2614)
- Modify: `worker/worker-studio.js:64` (`ROSTER_FIELDS`), `rosterSave` (~line 688), every row→object mapper (grep `profile_sources`)
- Create: `worker/roster_drag_migration.sql`
- Modify: `serve.py` `_clean_roster_entry` (line 56)
- Test: `tests/dr-studio-drag.test.js`

**Interfaces:**
- Produces: a roster record carrying `drag: { acting, comedy, dance, design, runway, lipsync, singing, style, traits, voice }`, round-tripping Studio → D1 → Publish → `franchise_roster.json`. The worker stores it as one JSON column `drag TEXT`: nothing sorts by a craft stat in SQL, and the block has a style and a trait list.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-studio-drag.test.js
// A source guard, because the Studio and the worker are DOM- and D1-bound.
// Memory project_publish_wipes_authored_fields: a field the worker does not
// carry is deleted by the next Publish. So the guard is on the WORKER.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { DRAG_STATS } from '../js/dr/queen.js';

const worker = readFileSync('worker/worker-studio.js', 'utf8');
const studio = readFileSync('js/studio.js', 'utf8');
const serve = readFileSync('serve.py', 'utf8');
const sql = readFileSync('worker/roster_drag_migration.sql', 'utf8');

describe('the drag block survives every hop', () => {
  it('worker carries drag in ROSTER_FIELDS, the INSERT and the row reader', () => {
    expect(worker).toMatch(/ROSTER_FIELDS = \[[^\]]*'drag'/);
    expect(worker).toMatch(/drag=excluded\.drag/);
    expect(worker).toMatch(/drag: *row\.drag \? JSON\.parse\(row\.drag\) : null/);
  });
  it('D1 has the column', () => {
    expect(sql).toMatch(/ALTER TABLE roster ADD COLUMN drag TEXT/);
  });
  it('the Studio sends it and edits every craft stat', () => {
    expect(studio).toMatch(/entry\.drag = /);
    for (const k of DRAG_STATS) expect(studio).toContain(`data-dk="${k}"`);
  });
  it('serve.py keeps it', () => {
    expect(serve).toMatch(/'drag'/);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-studio-drag.test.js`
Expected: FAIL on the first assertion.

- [ ] **Step 3: Worker**

`worker/roster_drag_migration.sql`:

```sql
-- Drag Race craft block, one JSON column. Nothing sorts by a craft stat in
-- SQL, and the block carries a style and a trait list, so seven INTEGER
-- columns would be the wrong shape. Apply once:
--   npx wrangler d1 execute <db> --file=worker/roster_drag_migration.sql
ALTER TABLE roster ADD COLUMN drag TEXT;
```

In `worker/worker-studio.js`:
- `ROSTER_FIELDS`: append `'drag'`.
- In `rosterSave`, after `profileSources` is built:

```js
  let drag = null;
  if (payload.drag != null) {
    if (typeof payload.drag !== 'object' || Array.isArray(payload.drag)) {
      throw new ValidationError('drag must be an object');
    }
    const DRAG_KEYS = ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing'];
    const clean = {};
    for (const k of DRAG_KEYS) {
      const n = Number(payload.drag[k]);
      if (Number.isFinite(n)) clean[k] = Math.max(1, Math.min(10, Math.round(n)));
    }
    if (typeof payload.drag.style === 'string' && payload.drag.style) clean.style = payload.drag.style;
    if (Array.isArray(payload.drag.traits)) clean.traits = payload.drag.traits.filter(t => typeof t === 'string').slice(0, 3);
    if (typeof payload.drag.voice === 'string' && payload.drag.voice.trim()) clean.voice = payload.drag.voice.trim();
    drag = JSON.stringify(clean);
  }
```

- Add `drag` to the INSERT column list, one more `?`, bind `drag` in the same position, and `drag=excluded.drag` in the `ON CONFLICT` clause.
- In every function that maps a D1 row back to an object (grep `profile_sources` — `rosterList` and the publish builder), add `drag: row.drag ? JSON.parse(row.drag) : null` and delete the key when it is null before returning.

- [ ] **Step 4: serve.py**

In `_clean_roster_entry`, the allowed-key list gets `'drag'`; when the value is a dict, copy it unchanged.

- [ ] **Step 5: Studio**

In `js/studio.js`:
- Draft defaults (~line 153): add `drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, style: '', traits: [], voice: '' },`.
- Draft-from-existing (~line 1125, beside `archetype: base.archetype || ''`): add `drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, style: '', traits: [], voice: '', ...(base.drag || {}) },`.
- Near `_statOf` (~line 98): `const _hasDrag = d => Object.values(d.drag || {}).some(v => (typeof v === 'number' && v !== 5) || (typeof v === 'string' && v) || (Array.isArray(v) && v.length));`
- Editor HTML, directly after the `st-sliders` block (~line 1595):

```js
        <details class="st-panel" id="st-drag-panel" ${_hasDrag(d) ? 'open' : ''}>
          <summary>Drag Race — craft</summary>
          <div class="st-sliders">${['acting','comedy','dance','design','runway','lipsync','singing'].map(k => `
            <label class="st-slider"><span>${k}</span>
              <input type="range" min="1" max="10" value="${d.drag[k]}" data-dk="${k}">
              <b id="st-dk-${k}">${d.drag[k]}</b></label>`).join('')}</div>
          <label class="st-field">Style
            <select id="st-f-drag-style" class="st-input">
              <option value="">— derive from stats —</option>
              ${['pageant','comedy','fashion','camp','club-kid','spooky','broadway','dancer','glamour','art']
                .map(s => `<option value="${s}" ${d.drag.style === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select></label>
          <label class="st-field">Traits (comma-separated, up to 3)
            <input id="st-f-drag-traits" class="st-input" value="${_esc((d.drag.traits || []).join(', '))}"></label>
          <label class="st-field">Persona voice
            <textarea id="st-f-drag-voice" class="st-input st-area" rows="3">${_esc(d.drag.voice || '')}</textarea></label>
        </details>
```

- Listeners (~line 1828), beside the stat slider listener:

```js
  ed.querySelectorAll('input[data-dk]').forEach(el => el.addEventListener('input', e => {
    const k = e.target.dataset.dk; d.drag[k] = +e.target.value;
    const b = ed.querySelector(`#st-dk-${k}`); if (b) b.textContent = String(d.drag[k]);
  }));
  ed.querySelector('#st-f-drag-style')?.addEventListener('change', e => { d.drag.style = e.target.value; });
  ed.querySelector('#st-f-drag-traits')?.addEventListener('input', e => {
    d.drag.traits = e.target.value.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);
  });
  ed.querySelector('#st-f-drag-voice')?.addEventListener('input', e => { d.drag.voice = e.target.value; });
```

- In `_save`, after the `bio` loop: `if (_hasDrag(d)) entry.drag = { ...d.drag };` (place it where `entry` is assembled; grep `continuityNote` in `_save` to find the spot).

- [ ] **Step 6: Run the test**

Run: `npx vitest run tests/dr-studio-drag.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add js/studio.js worker/worker-studio.js worker/roster_drag_migration.sql serve.py tests/dr-studio-drag.test.js
git commit -m "feat(drag-race): the drag block persists through Studio, D1 and publish"
```

---

### Task 5: Judges — profiles, guest taste, the panel

**Files:**
- Create: `js/dr/data/judges.js`
- Create: `js/dr/judges.js`
- Test: `tests/dr-judges.test.js`

**Interfaces:**
- Produces:
  - `JUDGES` (7): `{ id, name, permanent, portrait, portraitStage?, voice, taste: { challenge, runway, risk, polish }, styleBias: { [style]: number }, petPeeve, softSpot }`. Taste sums to 1.
  - `judgeById(id)`
  - `guestTaste(player) → { id: 'guest:'+slug, name, guest: true, portrait: null, taste, styleBias, warmth, voiceHint }`
  - `panelFor({ rotatingId, guest, weights }) → [rupaul, michelle, rotating, guest?]`; `weights[id]` overrides `taste` and is renormalised.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-judges.test.js
import { describe, expect, it } from 'vitest';
import { JUDGES } from '../js/dr/data/judges.js';
import { judgeById, guestTaste, panelFor } from '../js/dr/judges.js';

const sum = t => Object.values(t).reduce((a, b) => a + b, 0);

describe('judges data', () => {
  it('has the seven, two permanent, tastes summing to 1', () => {
    expect(JUDGES.map(j => j.id).sort()).toEqual(['carson', 'jamal', 'law', 'michelle', 'ross', 'rupaul', 'ts'].sort());
    expect(JUDGES.filter(j => j.permanent).map(j => j.id).sort()).toEqual(['michelle', 'rupaul']);
    for (const j of JUDGES) expect(Math.abs(sum(j.taste) - 1)).toBeLessThan(1e-9);
    expect(judgeById('rupaul').portrait).toBe('assets/avatars/rupaul.png');
    expect(judgeById('rupaul').portraitStage).toBe('assets/avatars/rupaul-drag.png');
  });
});

describe('guestTaste', () => {
  it('derives taste from stats: mental → polish, boldness → risk', () => {
    const nerd = guestTaste({ name: 'N', slug: 'n', archetype: 'perceptive-player',
      stats: { mental: 10, social: 5, boldness: 1, strategic: 5 } });
    const daredevil = guestTaste({ name: 'D', slug: 'd', archetype: 'wildcard',
      stats: { mental: 1, social: 5, boldness: 10, strategic: 5 } });
    expect(nerd.taste.polish).toBeGreaterThan(daredevil.taste.polish);
    expect(daredevil.taste.risk).toBeGreaterThan(nerd.taste.risk);
    expect(Math.abs(sum(nerd.taste) - 1)).toBeLessThan(1e-9);
    expect(nerd.id).toBe('guest:n');
  });
});

describe('panelFor', () => {
  it('seats the two permanents, the rotating judge, and the guest, in that order', () => {
    const p = panelFor({ rotatingId: 'law', guest: { name: 'G', slug: 'g', archetype: 'hero', stats: {} } });
    expect(p.map(j => j.id)).toEqual(['rupaul', 'michelle', 'law', 'guest:g']);
  });
  it('applies authored weight overrides and renormalises', () => {
    const p = panelFor({ rotatingId: 'ross', weights: { michelle: { runway: 0.8, challenge: 0.2, risk: 0, polish: 0 } } });
    expect(p[1].taste.runway).toBeCloseTo(0.8);
    expect(p[0].taste).toEqual(judgeById('rupaul').taste);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-judges.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Data**

```js
// js/dr/data/judges.js — the panel, authored (spec §4)
//
// Taste: how much of a verdict comes from the challenge, the runway, the
// risk she took, and polish. Sum to 1. styleBias: a soft spot (+) or an
// impatience (−) per drag style, in points on a 10-point view.
export const JUDGES = [
  { id: 'rupaul', name: 'RuPaul', permanent: true,
    portrait: 'assets/avatars/rupaul.png', portraitStage: 'assets/avatars/rupaul-drag.png',
    voice: 'Warm, oracular, decides in one sentence; loves a story and a comeback.',
    taste: { challenge: 0.45, runway: 0.25, risk: 0.20, polish: 0.10 },
    styleBias: { comedy: 0.4, camp: 0.3, pageant: 0.1, art: -0.1 },
    petPeeve: 'a queen who plays it safe', softSpot: 'a big personality' },
  { id: 'michelle', name: 'Michelle Visage', permanent: true,
    portrait: 'assets/avatars/michellevisage.png',
    voice: 'Direct, technical, the hidden-waist speech; hard on construction, soft on a live vocal.',
    taste: { challenge: 0.40, runway: 0.40, risk: 0.05, polish: 0.15 },
    styleBias: { pageant: 0.4, fashion: 0.3, glamour: 0.2, 'club-kid': -0.2 },
    petPeeve: 'a hidden waist', softSpot: 'a live vocal' },
  { id: 'carson', name: 'Carson Kressley', permanent: false,
    portrait: 'assets/avatars/carson.png',
    voice: 'Puns first, fashion second; delighted by camp and a good reveal.',
    taste: { challenge: 0.35, runway: 0.40, risk: 0.15, polish: 0.10 },
    styleBias: { camp: 0.4, comedy: 0.3, fashion: 0.2, spooky: -0.1 },
    petPeeve: 'a look with no idea', softSpot: 'a joke that lands' },
  { id: 'ross', name: 'Ross Mathews', permanent: false,
    portrait: 'assets/avatars/ross.png',
    voice: 'Enthusiastic, comedy-minded, cries easily; forgives a look for a performance.',
    taste: { challenge: 0.55, runway: 0.20, risk: 0.15, polish: 0.10 },
    styleBias: { comedy: 0.5, camp: 0.3, broadway: 0.2, art: -0.1 },
    petPeeve: 'dead air in a bit', softSpot: 'a heartfelt moment' },
  { id: 'law', name: 'Law Roach', permanent: false,
    portrait: 'assets/avatars/law.png',
    voice: 'Fashion authority, unimpressed by default; a look either is or is not.',
    taste: { challenge: 0.25, runway: 0.55, risk: 0.10, polish: 0.10 },
    styleBias: { fashion: 0.6, art: 0.3, glamour: 0.2, comedy: -0.2, camp: -0.2 },
    petPeeve: 'a cheap fabric', softSpot: 'proportion' },
  { id: 'ts', name: 'TS Madison', permanent: false,
    portrait: 'assets/avatars/ts.png',
    voice: 'Loud, loving, street; rewards nerve and a body, reads a coward.',
    taste: { challenge: 0.40, runway: 0.25, risk: 0.30, polish: 0.05 },
    styleBias: { 'club-kid': 0.3, dancer: 0.3, comedy: 0.2, pageant: 0.1, art: -0.1 },
    petPeeve: 'no nerve', softSpot: 'a stunt' },
  { id: 'jamal', name: 'Jamal Sims', permanent: false,
    portrait: 'assets/avatars/jamal.png',
    voice: 'Choreographer; watches feet and counts; kind about effort, exact about timing.',
    taste: { challenge: 0.50, runway: 0.20, risk: 0.10, polish: 0.20 },
    styleBias: { dancer: 0.5, broadway: 0.3, 'club-kid': 0.1, fashion: -0.1 },
    petPeeve: 'being off the count', softSpot: 'a clean eight' },
];
```

- [ ] **Step 4: Logic**

```js
// js/dr/judges.js — who sits on the panel tonight, and how each one sees
import { JUDGES } from './data/judges.js';

export function judgeById(id) { return JUDGES.find(j => j.id === id) || null; }

const norm = t => {
  const s = Object.values(t).reduce((a, b) => a + b, 0) || 1;
  return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v / s]));
};

// Archetype → what the guest forgives (spec §4).
const ARCH_BIAS = {
  villain: { comedy: 0.3, spooky: 0.2, pageant: -0.2 },
  hero: { pageant: 0.2, glamour: 0.2 },
  'social-butterfly': { camp: 0.2, comedy: 0.2 },
  'challenge-beast': { dancer: 0.3, 'club-kid': 0.1 },
  mastermind: { art: 0.2, fashion: 0.2 },
  schemer: { comedy: 0.2, spooky: 0.1 },
};

/** A franchise alumni as a guest judge. Taste derived, never authored. */
export function guestTaste(player) {
  const s = (player && player.stats) || {};
  const n = k => (Number(s[k]) || 5) / 10;                    // 0.1..1
  const taste = norm({
    challenge: 0.30 + n('strategic') * 0.20,
    runway:    0.20 + (1 - n('mental')) * 0.10,
    risk:      0.05 + n('boldness') * 0.30,
    polish:    0.05 + n('mental') * 0.30,
  });
  return {
    id: 'guest:' + (player.slug || String(player.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    name: player.name, permanent: false, guest: true, portrait: null,
    taste, styleBias: ARCH_BIAS[player.archetype] || {},
    // How warm the critique voice is: social 10 gives almost no negative lines.
    warmth: n('social'),
    voiceHint: player.voice || '',
  };
}

/**
 * Tonight's panel: RuPaul, Michelle, the rotating judge picked in the
 * timeline, the guest (a roster player) if any. `weights` are the setup
 * screen's per-judge overrides, `{ [judgeId]: { challenge, runway, risk, polish } }`.
 */
export function panelFor({ rotatingId = 'carson', guest = null, weights = {} } = {}) {
  const seat = j => {
    const w = weights && weights[j.id];
    return w ? { ...j, taste: norm({ ...j.taste, ...w }) } : j;
  };
  const out = [seat(judgeById('rupaul')), seat(judgeById('michelle'))];
  const rot = judgeById(rotatingId);
  if (rot && !rot.permanent) out.push(seat(rot));
  if (guest) out.push(seat(guestTaste(guest)));
  return out;
}
```

- [ ] **Step 5: Run the test**

Run: `npx vitest run tests/dr-judges.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/dr/data/judges.js js/dr/judges.js tests/dr-judges.test.js
git commit -m "feat(drag-race): judges — authored panel, derived guest taste"
```

---

### Task 6: Catalogues — maxi challenges, minis, songs

**Files:**
- Create: `js/dr/data/challenges.js`, `js/dr/data/minis.js`, `js/dr/data/songs.js`
- Test: `tests/dr-catalogue.test.js`

**Interfaces:**
- Produces:
  - `MAXI_TYPES` (18): `{ id, name, tentpole, stage:'pre'|'main', format:'solo'|'pairs'|'teams'|'cast'|'partnered', blend:{craft:weight}, runway:'themed'|'design'|'ball'|'makeover', assignment:'none'|'draft'|'captains'|'host'|'random', roles:null|'characters'|'parts'|'slots', chalStyle, minCast, desc }`. Blends sum to 1.
  - `TENTPOLES = ['snatch-game','ball','girl-group','makeover','roast','rusical']`, `maxiById(id)`
  - `MINI_TYPES`: `{ id, name, buys:'pick-order'|'captain'|'first-pick'|'prize', blend }`, `miniById(id)`
  - `SONGS`: `{ title, artist, tempo, mood, hook }`, `songById(title)`

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-catalogue.test.js
import { describe, expect, it } from 'vitest';
import { MAXI_TYPES, TENTPOLES, maxiById } from '../js/dr/data/challenges.js';
import { MINI_TYPES } from '../js/dr/data/minis.js';
import { SONGS } from '../js/dr/data/songs.js';
import { DRAG_STATS } from '../js/dr/queen.js';

describe('maxi catalogue', () => {
  it('has the eighteen types from the fan wiki', () => {
    expect(MAXI_TYPES.length).toBe(18);
    expect(new Set(MAXI_TYPES.map(m => m.id)).size).toBe(18);
    for (const t of TENTPOLES) expect(maxiById(t)?.tentpole).toBe(true);
  });
  it('every entry is well-formed', () => {
    for (const m of MAXI_TYPES) {
      const sum = Object.values(m.blend).reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - 1), m.id).toBeLessThan(1e-9);
      for (const k of Object.keys(m.blend)) expect(DRAG_STATS, `${m.id}.${k}`).toContain(k);
      expect(['pre', 'main']).toContain(m.stage);
      expect(['solo', 'pairs', 'teams', 'cast', 'partnered']).toContain(m.format);
      expect(['themed', 'design', 'ball', 'makeover']).toContain(m.runway);
      expect(m.desc.length, m.id).toBeGreaterThan(200);
      expect(m.minCast).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('minis and songs', () => {
  it('minis buy something in the maxi', () => {
    expect(MINI_TYPES.length).toBeGreaterThanOrEqual(6);
    for (const m of MINI_TYPES) expect(['pick-order', 'captain', 'first-pick', 'prize']).toContain(m.buys);
  });
  it('songs are tagged', () => {
    expect(SONGS.length).toBeGreaterThanOrEqual(30);
    for (const s of SONGS) {
      expect(['ballad', 'mid', 'dance', 'uptempo']).toContain(s.tempo);
      expect(['sad', 'fierce', 'funny', 'sexy', 'rage']).toContain(s.mood);
      expect(['breakdown', 'key-change', 'spoken', 'dance-break', 'none']).toContain(s.hook);
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-catalogue.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `js/dr/data/challenges.js`**

Every `desc` states set-up, mechanic, what goes wrong, and win condition (the project's challenge-description rule, two sentences and 200+ characters minimum). These are the exact eighteen:

```js
// js/dr/data/challenges.js — the eighteen maxi types (spec §8.5)
export const TENTPOLES = ['snatch-game', 'ball', 'girl-group', 'makeover', 'roast', 'rusical'];

export const MAXI_TYPES = [
  { id: 'acting', name: 'Acting Challenge', tentpole: false, stage: 'pre', format: 'teams',
    blend: { acting: 0.6, comedy: 0.3, runway: 0.1 }, runway: 'themed', assignment: 'draft', roles: 'parts',
    chalStyle: 'comedy', minCast: 6,
    desc: 'The queens are split into casts for a scripted parody and each one takes a part with its own lines and a costume waiting on the rack. They rehearse, get one walkthrough from the host, then shoot the scene in front of a director who does not do a second take. Forgetting lines, stepping on a scene partner or playing every part the same way is what buries you. The queen whose part lands hardest on screen and on the runway wins.' },
  { id: 'ball', name: 'The Ball', tentpole: true, stage: 'main', format: 'solo',
    blend: { design: 0.45, runway: 0.45, dance: 0.1 }, runway: 'ball', assignment: 'none', roles: null,
    chalStyle: 'physical', minCast: 5,
    desc: 'Three categories are announced and each queen must present three looks on the main stage: two pulled and styled from what she brought, and one built from scratch in the werk room from the fabric and trims on the wall. She has one working day to sew, fit and finish before the runway. A look that falls apart, a category missed or a sewn piece that reads as a bedsheet is what sinks a queen. The strongest trio of looks across all three categories wins.' },
  { id: 'choreography', name: 'Choreography Challenge', tentpole: false, stage: 'main', format: 'teams',
    blend: { dance: 0.6, singing: 0.2, runway: 0.2 }, runway: 'themed', assignment: 'captains', roles: 'slots',
    chalStyle: 'physical', minCast: 6,
    desc: 'Teams learn and perform a full dance number staged by a professional choreographer, with a formation for every eight-count and a featured solo in each routine. They rehearse in the studio, then perform it live on the main stage to the judges and a crowd. Missing the count, blowing a formation or being visibly carried by the group is what costs you. The cleanest team wins as a group and the standout dancer takes the individual win.' },
  { id: 'commercial', name: 'Commercial Challenge', tentpole: false, stage: 'pre', format: 'pairs',
    blend: { acting: 0.45, comedy: 0.45, runway: 0.1 }, runway: 'themed', assignment: 'random', roles: null,
    chalStyle: 'comedy', minCast: 4,
    desc: 'Pairs write, shoot and star in a thirty-second advert for a product the host names, with a set, a prop table and a camera crew that gives them one afternoon. They pitch the concept, play every role themselves and deliver the tagline to camera. A concept nobody can follow, a partner left with nothing to do or a tagline that dies are what fail an advert. The spot the judges would actually air wins.' },
  { id: 'design', name: 'Design Challenge', tentpole: false, stage: 'main', format: 'solo',
    blend: { design: 0.7, runway: 0.3 }, runway: 'design', assignment: 'none', roles: null,
    chalStyle: 'physical', minCast: 4,
    desc: 'Each queen builds a runway look from a fixed set of unconventional materials she is handed in the werk room, with a sewing machine, a glue gun and one day. She must design, construct and finish a look that walks, then present it on the main stage as her runway. A garment that is still wet, that does not close or that hides the material instead of using it is what sends you to the bottom. The look the panel would put on a magazine cover wins.' },
  { id: 'girl-group', name: 'Girl Group Challenge', tentpole: true, stage: 'pre', format: 'teams',
    blend: { singing: 0.35, dance: 0.35, comedy: 0.15, runway: 0.15 }, runway: 'themed', assignment: 'captains', roles: 'slots',
    chalStyle: 'physical', minCast: 6,
    desc: 'The queens form girl groups, each writes and records her own verse of an original track, and the group learns a full choreography from a professional before filming the music video. Verses are written in the werk room, recorded in a booth with a vocal coach, then rehearsed and shot. A verse with no hook, a queen who cannot find the beat or a group that lets one member hog the spotlight is what loses. The group with the tightest video wins, and its strongest member takes the win.' },
  { id: 'improv', name: 'Improv Challenge', tentpole: false, stage: 'pre', format: 'pairs',
    blend: { acting: 0.5, comedy: 0.5 }, runway: 'themed', assignment: 'draft', roles: 'parts',
    chalStyle: 'comedy', minCast: 4,
    desc: 'Queens are paired into scenes with a premise and a character each but no script, and play them out in front of the host and a comedy coach who feed in twists mid-scene. Each scene runs until the host calls it, and every pair gets the same number of twists. Blocking a partner, going for the same joke twice or freezing when the twist lands is what dies. The queen who keeps the scene alive and gets the biggest laugh wins.' },
  { id: 'lipsync-challenge', name: 'Lip Sync LaLaPaRUza', tentpole: false, stage: 'main', format: 'solo',
    blend: { lipsync: 0.6, dance: 0.3, acting: 0.1 }, runway: 'themed', assignment: 'draft', roles: null,
    chalStyle: 'physical', minCast: 6,
    desc: 'A bracket of lip syncs on the main stage: queens choose their opponents in an order decided by the mini challenge, each pair performs a song, and the loser drops into the next round of losers while the winner rests. Rounds continue until one queen is left unbeaten. Losing the words, standing still on a dance break or leaving your stunt half-done is what sends you down the bracket. The last queen standing wins.' },
  { id: 'makeover', name: 'Makeover Challenge', tentpole: true, stage: 'main', format: 'partnered',
    blend: { design: 0.35, runway: 0.35, acting: 0.15, comedy: 0.15 }, runway: 'makeover', assignment: 'draft', roles: null,
    chalStyle: 'social', minCast: 4,
    desc: 'Each queen is paired with a partner who has never done drag — a member of the pit crew, a family member, or an eliminated queen — and must turn them into her drag sister: a look for each, a shared name, a family resemblance. She builds and paints both in one day, then they walk the runway together. A partner who cannot walk in the shoes, a pair with no resemblance or a queen who dressed herself better than her sister is what fails. The most convincing family wins.' },
  { id: 'music-video', name: 'Music Video Challenge', tentpole: false, stage: 'pre', format: 'cast',
    blend: { dance: 0.4, acting: 0.3, singing: 0.2, runway: 0.1 }, runway: 'themed', assignment: 'host', roles: 'parts',
    chalStyle: 'physical', minCast: 5,
    desc: 'The whole cast shoots a music video for a track the host owns, with the host assigning parts from featured verses down to background dancers. They learn choreography and their lines, then film in one long day of takes. Missing your mark, sleepwalking through a verse or being unable to be seen behind the featured queen is what sinks you. The queen the camera keeps finding wins.' },
  { id: 'photoshoot', name: 'Photoshoot Challenge', tentpole: false, stage: 'pre', format: 'solo',
    blend: { runway: 0.5, acting: 0.3, comedy: 0.2 }, runway: 'themed', assignment: 'none', roles: null,
    chalStyle: 'social', minCast: 4,
    desc: 'Each queen shoots a themed editorial with a photographer and a set that fights back: wind, water, a moving platform, a co-star that will not cooperate. She has a set number of frames to get one shot that tells the story, and the set resets between queens. A blank face, fighting the set instead of using it, or a look that does not read on camera is what fails. The queen with the frame the judges would print wins.' },
  { id: 'roast', name: 'The Roast', tentpole: true, stage: 'main', format: 'solo',
    blend: { comedy: 0.7, acting: 0.2, runway: 0.1 }, runway: 'themed', assignment: 'draft', roles: 'slots',
    chalStyle: 'comedy', minCast: 5,
    desc: 'Each queen writes and delivers a stand-up set roasting a guest of honour and the panel, in a running order decided by the mini challenge: opening the show and closing it are the two hardest slots. Sets are written in the werk room and delivered live to the room. A joke that does not land, a set that runs long or a queen who roasts the room instead of the honouree is what dies on stage. The queen with the biggest laughs wins.' },
  { id: 'rumix', name: 'Rumix Challenge', tentpole: false, stage: 'pre', format: 'cast',
    blend: { singing: 0.4, dance: 0.4, comedy: 0.2 }, runway: 'themed', assignment: 'draft', roles: 'slots',
    chalStyle: 'physical', minCast: 5,
    desc: 'The remaining queens each write a verse for a remix of one of the host’s songs, record it with a vocal coach, then learn one group choreography and film the number together. Verse order is drafted, and the last verse has to close the track. A verse that does not rhyme, a recording the coach cannot save or a queen who gets lost in the choreography is what fails. The queen whose verse and performance carry the track wins.' },
  { id: 'runway-challenge', name: 'Runway Challenge', tentpole: false, stage: 'main', format: 'solo',
    blend: { runway: 0.8, design: 0.2 }, runway: 'ball', assignment: 'none', roles: null,
    chalStyle: 'social', minCast: 4,
    desc: 'No maxi in the werk room: the queens present three looks each on the main stage across three categories announced at the start of the day, with a short window to style and repair. Each walk is judged on its own before the three are weighed together. A category missed, a walk with no story or a look that repeats the last one is what fails. The strongest trio of walks wins.' },
  { id: 'rusical', name: 'The Rusical', tentpole: true, stage: 'main', format: 'cast',
    blend: { singing: 0.35, acting: 0.3, dance: 0.25, runway: 0.1 }, runway: 'themed', assignment: 'draft', roles: 'parts',
    chalStyle: 'comedy', minCast: 6,
    desc: 'The whole cast stages an original musical on the main stage, with parts from the lead down to the ensemble handed out in a draft, and a choice for the leads between singing live and lip syncing to a recording. They learn the songs and the staging with a choreographer and a vocal coach, then perform it once, live. A lead who cannot hold the tune, an ensemble member who disappears or a part played without any character is what fails. The performance the panel cannot stop talking about wins.' },
  { id: 'singing', name: 'Singing Challenge', tentpole: false, stage: 'main', format: 'solo',
    blend: { singing: 0.6, acting: 0.2, runway: 0.2 }, runway: 'themed', assignment: 'draft', roles: 'slots',
    chalStyle: 'social', minCast: 4,
    desc: 'Each queen performs one song live on the main stage with a live band, chosen from a list in an order set by the mini challenge, with one rehearsal with the musical director. She must sing, not lip sync, and sell the song to the room. A cracked note, a forgotten lyric or a performance that stands still is what fails. The queen the band would take on tour wins.' },
  { id: 'snatch-game', name: 'Snatch Game', tentpole: true, stage: 'pre', format: 'solo',
    blend: { comedy: 0.55, acting: 0.35, runway: 0.1 }, runway: 'themed', assignment: 'draft', roles: 'characters',
    chalStyle: 'comedy', minCast: 5,
    desc: 'Each queen picks a celebrity to impersonate on a spoof panel game show hosted by the host, with two guest contestants asking fill-in-the-blank questions. She sits on the panel in character for the whole taping, answering every question as that celebrity and playing off the other queens. Picking a character nobody knows, breaking character or going the whole game without a laugh is what dies on the panel. The funniest celebrity in the room wins.' },
  { id: 'stand-up', name: 'Stand-Up Challenge', tentpole: false, stage: 'main', format: 'solo',
    blend: { comedy: 0.65, acting: 0.25, runway: 0.1 }, runway: 'themed', assignment: 'draft', roles: 'slots',
    chalStyle: 'comedy', minCast: 4,
    desc: 'Each queen writes and performs a five-minute stand-up set for a live audience in a running order decided by the mini challenge, with one coaching session from a working comic. She has to open, land three bits and get off on a laugh. Bombing the opener, running out of material or rushing the punchline is what fails. The queen the audience laughed at the most wins.' },
  { id: 'talent-show', name: 'Talent Show Extravaganza', tentpole: false, stage: 'main', format: 'solo',
    blend: { comedy: 0.25, singing: 0.25, dance: 0.25, lipsync: 0.25 }, runway: 'themed', assignment: 'none', roles: null,
    chalStyle: 'social', minCast: 4,
    desc: 'Each queen performs a talent of her own choosing on the main stage — a live vocal, a comedy set, a dance number, a burlesque routine, a lip sync with a stunt — chosen from what she is best at, with a rehearsal slot and a one-line introduction. Every act gets the same stage and the same time. Choosing a talent you do not have, a routine that has no ending or an act that is only a runway walk is what fails. The act the room would pay to see again wins.' },
];

export function maxiById(id) { return MAXI_TYPES.find(m => m.id === id) || null; }
```

The talent show's even blend is the generic fallback; Plan 2's `talent-show.js` picks the talent from the queen's own stats and substitutes that talent's blend.

- [ ] **Step 4: Minis and songs**

```js
// js/dr/data/minis.js
export const MINI_TYPES = [
  { id: 'reading', name: 'Reading Is Fundamental', buys: 'pick-order', blend: { comedy: 0.8, acting: 0.2 } },
  { id: 'puppets', name: 'Puppet Parody', buys: 'first-pick', blend: { comedy: 0.7, acting: 0.3 } },
  { id: 'quick-drag', name: 'Quick Drag', buys: 'captain', blend: { design: 0.5, runway: 0.5 } },
  { id: 'photoshoot', name: 'Photoshoot Mini', buys: 'pick-order', blend: { runway: 0.7, acting: 0.3 } },
  { id: 'dance-off', name: 'Werk Room Dance-Off', buys: 'captain', blend: { dance: 0.8, lipsync: 0.2 } },
  { id: 'quiz', name: 'Herstory Quiz', buys: 'prize', blend: { comedy: 0.3, acting: 0.3, runway: 0.4 } },
  { id: 'wig-swap', name: 'Wig Swap', buys: 'first-pick', blend: { design: 0.6, runway: 0.4 } },
];
export function miniById(id) { return MINI_TYPES.find(m => m.id === id) || null; }
```

```js
// js/dr/data/songs.js — real titles as names only (the user's call, spec §1)
export const SONGS = [
  { title: 'Emotion', artist: 'Carly Rae Jepsen', tempo: 'uptempo', mood: 'fierce', hook: 'key-change' },
  { title: 'Stronger', artist: 'Kelly Clarkson', tempo: 'uptempo', mood: 'rage', hook: 'breakdown' },
  { title: 'Since U Been Gone', artist: 'Kelly Clarkson', tempo: 'uptempo', mood: 'rage', hook: 'breakdown' },
  { title: 'Believe', artist: 'Cher', tempo: 'dance', mood: 'sad', hook: 'key-change' },
  { title: 'Toxic', artist: 'Britney Spears', tempo: 'dance', mood: 'sexy', hook: 'dance-break' },
  { title: 'Womanizer', artist: 'Britney Spears', tempo: 'dance', mood: 'fierce', hook: 'breakdown' },
  { title: 'Vogue', artist: 'Madonna', tempo: 'dance', mood: 'fierce', hook: 'spoken' },
  { title: 'Express Yourself', artist: 'Madonna', tempo: 'uptempo', mood: 'fierce', hook: 'none' },
  { title: 'I Will Survive', artist: 'Gloria Gaynor', tempo: 'dance', mood: 'rage', hook: 'none' },
  { title: 'Total Eclipse of the Heart', artist: 'Bonnie Tyler', tempo: 'ballad', mood: 'sad', hook: 'breakdown' },
  { title: 'Without You', artist: 'Mariah Carey', tempo: 'ballad', mood: 'sad', hook: 'key-change' },
  { title: 'Emotions', artist: 'Mariah Carey', tempo: 'mid', mood: 'sexy', hook: 'key-change' },
  { title: 'Firework', artist: 'Katy Perry', tempo: 'mid', mood: 'fierce', hook: 'key-change' },
  { title: 'Roar', artist: 'Katy Perry', tempo: 'mid', mood: 'fierce', hook: 'none' },
  { title: 'Bad Romance', artist: 'Lady Gaga', tempo: 'dance', mood: 'fierce', hook: 'breakdown' },
  { title: 'Telephone', artist: 'Lady Gaga', tempo: 'dance', mood: 'funny', hook: 'spoken' },
  { title: 'Single Ladies', artist: 'Beyoncé', tempo: 'uptempo', mood: 'fierce', hook: 'dance-break' },
  { title: 'Halo', artist: 'Beyoncé', tempo: 'ballad', mood: 'sad', hook: 'key-change' },
  { title: 'Umbrella', artist: 'Rihanna', tempo: 'mid', mood: 'sexy', hook: 'none' },
  { title: 'S&M', artist: 'Rihanna', tempo: 'dance', mood: 'sexy', hook: 'breakdown' },
  { title: 'Whip My Hair', artist: 'Willow', tempo: 'uptempo', mood: 'funny', hook: 'dance-break' },
  { title: 'Barbie Girl', artist: 'Aqua', tempo: 'dance', mood: 'funny', hook: 'spoken' },
  { title: 'Call Me Maybe', artist: 'Carly Rae Jepsen', tempo: 'uptempo', mood: 'funny', hook: 'none' },
  { title: 'Chandelier', artist: 'Sia', tempo: 'mid', mood: 'sad', hook: 'breakdown' },
  { title: 'Elastic Heart', artist: 'Sia', tempo: 'mid', mood: 'rage', hook: 'breakdown' },
  { title: 'Fighter', artist: 'Christina Aguilera', tempo: 'uptempo', mood: 'rage', hook: 'key-change' },
  { title: 'Beautiful', artist: 'Christina Aguilera', tempo: 'ballad', mood: 'sad', hook: 'none' },
  { title: 'Wrecking Ball', artist: 'Miley Cyrus', tempo: 'ballad', mood: 'sad', hook: 'breakdown' },
  { title: 'Party in the U.S.A.', artist: 'Miley Cyrus', tempo: 'uptempo', mood: 'funny', hook: 'none' },
  { title: 'Bang Bang', artist: 'Jessie J', tempo: 'uptempo', mood: 'fierce', hook: 'spoken' },
  { title: 'Love Shack', artist: 'The B-52s', tempo: 'uptempo', mood: 'funny', hook: 'spoken' },
  { title: 'Nasty', artist: 'Janet Jackson', tempo: 'dance', mood: 'fierce', hook: 'dance-break' },
  { title: 'Rhythm Nation', artist: 'Janet Jackson', tempo: 'dance', mood: 'fierce', hook: 'dance-break' },
  { title: 'Hung Up', artist: 'Madonna', tempo: 'dance', mood: 'sexy', hook: 'none' },
  { title: 'Cut to the Feeling', artist: 'Carly Rae Jepsen', tempo: 'uptempo', mood: 'fierce', hook: 'key-change' },
  { title: 'Break My Soul', artist: 'Beyoncé', tempo: 'dance', mood: 'fierce', hook: 'breakdown' },
];
export function songById(title) { return SONGS.find(s => s.title === title) || null; }
```

- [ ] **Step 5: Run the test**

Run: `npx vitest run tests/dr-catalogue.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/dr/data/challenges.js js/dr/data/minis.js js/dr/data/songs.js tests/dr-catalogue.test.js
git commit -m "feat(drag-race): catalogues — 18 maxi types, minis, song bank"
```

---

### Task 7: Step 1 — performance and runway (ground truth)

**Files:**
- Create: `js/dr/rng.js`, `js/dr/perform.js`
- Test: `tests/dr-perform.test.js`

**Interfaces:**
- Consumes: `dragOf` (Task 3), a maxi `meta` (Task 6).
- Produces:
  - `rngFor(seed) → () => number` in `js/dr/rng.js`: the same mulberry32 as `tests/helpers/rng.js` `seededRandom`, copied so the engine never imports from `tests/`. Must return the identical sequence for the same seed (the tests seed with `seededRandom` and compare).
  - `noise(rng, amt) → number` in `[-amt, +amt]` (the engine's ONE noise helper; every file in `js/dr/` imports it from here).
  - `blendScore(drag, blend) → number` (1..10 weighted mean).
  - `ROLE_RANGES = { lead: 1.35, featured: 1.15, standard: 1.0, ensemble: 0.75 }` — spec §8.2: a role widens or narrows the swing, never caps.
  - `performQueen({ player, maxi, role='standard', prep=0, chemistry=0, record=[], rng }) → { perf, moment, risk, parts }` where `perf` is unbounded-ish (typically 0..14), `moment` boolean (≈ 1 in 12), `risk` in 0..1, `parts` the breakdown for the screen.
  - `runwayScore({ player, category, sewn=false, rng }) → { score, fit, parts }` — `runway * 0.6 + fit(category) * 0.25 + fit(style) * 0.15`, with `design` replacing `runway` when `sewn`.
  - `nervesFor(record, temperament) → number` — last two results: each `BTM` is −0.6 (or +0.3 when temperament ≥ 7, proportional: `(temperament - 5) * 0.12 - 0.6`), each `WIN` is +0.3.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-perform.test.js
import { describe, expect, it } from 'vitest';
import { performQueen, runwayScore, nervesFor, blendScore, ROLE_RANGES, noise } from '../js/dr/perform.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { seededRandom } from './helpers/rng.js';

const q = (drag, stats = {}) => ({ name: 'Q', archetype: 'hero', drag,
  stats: { boldness: 5, temperament: 5, mental: 5, strategic: 5, ...stats } });
const mean = (f, n = 400) => { let s = 0; for (let i = 0; i < n; i++) s += f(i); return s / n; };

describe('performQueen', () => {
  it('is proportional to the blended craft', () => {
    const roast = maxiById('roast');
    const hi = mean(i => performQueen({ player: q({ comedy: 9, acting: 8 }), maxi: roast, rng: seededRandom(i) }).perf);
    const lo = mean(i => performQueen({ player: q({ comedy: 2, acting: 3 }), maxi: roast, rng: seededRandom(i) }).perf);
    expect(hi - lo).toBeGreaterThan(3);
  });
  it('a lead role widens the spread both ways, ensemble narrows it', () => {
    const rus = maxiById('rusical');
    const spread = role => {
      const xs = Array.from({ length: 400 }, (_, i) => performQueen({ player: q({ singing: 5 }), maxi: rus, role, rng: seededRandom(i) }).perf);
      const m = xs.reduce((a, b) => a + b, 0) / xs.length;
      return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
    };
    expect(spread('lead')).toBeGreaterThan(spread('ensemble') * 1.3);
    expect(ROLE_RANGES.lead).toBeGreaterThan(ROLE_RANGES.ensemble);
  });
  it('boldness widens variance, chemistry and prep add', () => {
    const acting = maxiById('acting');
    const sd = b => {
      const xs = Array.from({ length: 400 }, (_, i) => performQueen({ player: q({ acting: 5 }, { boldness: b }), maxi: acting, rng: seededRandom(i) }).perf);
      const m = xs.reduce((a, c) => a + c, 0) / xs.length;
      return Math.sqrt(xs.reduce((a, c) => a + (c - m) ** 2, 0) / xs.length);
    };
    expect(sd(10)).toBeGreaterThan(sd(1));
    const base = performQueen({ player: q({ acting: 5 }), maxi: acting, rng: seededRandom(1) }).perf;
    const boosted = performQueen({ player: q({ acting: 5 }), maxi: acting, prep: 1.5, chemistry: 1, rng: seededRandom(1) }).perf;
    expect(boosted - base).toBeCloseTo(2.5, 5);
  });
  it('moments are rare and seeded', () => {
    const snatch = maxiById('snatch-game');
    let n = 0;
    for (let i = 0; i < 1200; i++) if (performQueen({ player: q({ comedy: 6 }), maxi: snatch, rng: seededRandom(i) }).moment) n++;
    expect(n / 1200).toBeGreaterThan(0.05); expect(n / 1200).toBeLessThan(0.12);
    expect(performQueen({ player: q({}), maxi: snatch, rng: seededRandom(9) }).perf)
      .toBe(performQueen({ player: q({}), maxi: snatch, rng: seededRandom(9) }).perf);
  });
});

describe('runway and nerves', () => {
  it('scores the sewn look on design, the styled look on runway', () => {
    const p = q({ runway: 9, design: 2 });
    expect(runwayScore({ player: p, category: 'red', rng: seededRandom(1) }).score)
      .toBeGreaterThan(runwayScore({ player: p, category: 'red', sewn: true, rng: seededRandom(1) }).score);
  });
  it('a category that fits her style scores higher', () => {
    const p = q({ runway: 6, style: 'spooky' });
    const fit = runwayScore({ player: p, category: 'night of a thousand ghouls', categoryStyles: ['spooky'], rng: seededRandom(2) });
    const miss = runwayScore({ player: p, category: 'pageant perfection', categoryStyles: ['pageant'], rng: seededRandom(2) });
    expect(fit.score).toBeGreaterThan(miss.score);
  });
  it('nerves read the last two results through temperament', () => {
    expect(nervesFor(['SAFE', 'BTM'], 3)).toBeLessThan(0);
    expect(nervesFor(['SAFE', 'BTM'], 9)).toBeGreaterThan(nervesFor(['SAFE', 'BTM'], 3));
    expect(nervesFor(['WIN', 'WIN'], 5)).toBeGreaterThan(0);
    expect(nervesFor([], 5)).toBe(0);
  });
  it('noise is symmetric and bounded', () => {
    const xs = Array.from({ length: 2000 }, (_, i) => noise(seededRandom(i), 2.5));
    expect(Math.max(...xs)).toBeLessThanOrEqual(2.5); expect(Math.min(...xs)).toBeGreaterThanOrEqual(-2.5);
    expect(Math.abs(xs.reduce((a, b) => a + b, 0) / xs.length)).toBeLessThan(0.15);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-perform.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

First `js/dr/rng.js`: copy the body of `seededRandom` from `tests/helpers/rng.js` verbatim and export it as `rngFor`. Then:

```js
// js/dr/perform.js — step 1 of three: what she DID (spec §6.1)
//
// Nothing in here knows a judge exists. The number this produces is the
// ground truth the audience saw; the panel sees it through taste in
// judging.js and the host bends it there. Keep it that way: a "the judges
// would like this" term in this file is the bug the three-step design exists
// to prevent.
import { dragOf, DRAG_STYLES } from './queen.js';

/** THE noise helper for js/dr/. Symmetric, bounded, seeded. */
export function noise(rng, amt = 2.5) { return (rng() - 0.5) * 2 * amt; }

export function blendScore(drag, blend) {
  let s = 0, w = 0;
  for (const [k, v] of Object.entries(blend || {})) { s += (drag[k] || 5) * v; w += v; }
  return w ? s / w : 5;
}

// A role scales the SWING, not the ceiling (spec §8.2). A lead can win big
// or bomb; the ensemble mostly lands in the middle.
export const ROLE_RANGES = { lead: 1.35, featured: 1.15, standard: 1.0, ensemble: 0.75 };

/** Last two results, through temperament. Proportional: no thresholds. */
export function nervesFor(record = [], temperament = 5) {
  const t = Number(temperament) || 5;
  let n = 0;
  for (const r of record.slice(-2)) {
    if (r === 'BTM') n += (t - 5) * 0.12 - 0.6;       // t=3: -0.84  t=5: -0.6  t=9: -0.12
    else if (r === 'WIN') n += 0.3;
  }
  return n;
}

/**
 * One queen, one maxi, one performance.
 *   prep       from prepare() — Plan 2 supplies it; 0 here
 *   chemistry  mean perceived bond of her team, scaled by the caller (0 solo)
 *   record     her results so far, e.g. ['SAFE','HIGH','BTM']
 */
export function performQueen({ player, maxi, role = 'standard', prep = 0, chemistry = 0, record = [], rng = Math.random }) {
  const d = dragOf(player);
  const s = (player && player.stats) || {};
  const base = blendScore(d, maxi.blend);                         // 1..10
  const range = ROLE_RANGES[role] ?? 1.0;
  const bold = (Number(s.boldness) || 5) / 10;                    // 0.1..1
  const risk = bold * (0.5 + rng() * 0.5);                        // 0..1, how big she went
  const swing = noise(rng, (2.5 + bold * 2.0) * range);           // spec: noise(2.5 + boldness*0.2) scaled by role
  const nerves = nervesFor(record, s.temperament);
  const momentRoll = rng();
  const moment = momentRoll < (1 / 12);                            // ≈ 8%
  const momentBonus = moment ? 2.0 + bold : 0;
  const perf = (base - 5) * range + 5 + swing + prep + chemistry + nerves + momentBonus;
  return {
    perf: Math.round(perf * 100) / 100, moment, risk,
    parts: { base, range, swing, prep, chemistry, nerves, momentBonus },
  };
}

/** Does this runway category call for her style? 1 fits, 0.5 neutral, 0 clashes. */
function fitFor(style, categoryStyles = []) {
  if (!categoryStyles.length) return 0.5;
  return categoryStyles.includes(style) ? 1 : 0;
}

/**
 * One walk. `sewn` puts the look on `design`; `categoryStyles` is the list of
 * styles the category rewards (a Ball or design week passes them; a plain
 * themed runway passes none and everybody sits at neutral).
 */
export function runwayScore({ player, category = '', sewn = false, categoryStyles = [], rng = Math.random }) {
  const d = dragOf(player);
  const craft = sewn ? d.design : d.runway;
  const fit = fitFor(d.style, categoryStyles);
  const score = craft * 0.6 + (fit * 10) * 0.25 + (DRAG_STYLES.includes(d.style) ? 10 : 5) * 0.15 * 0.5
    + noise(rng, 1.5);
  return { score: Math.round(score * 100) / 100, fit, parts: { craft, fit, category, sewn } };
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-perform.test.js`
Expected: PASS. If the moment-rate assertion is off, the bound is on `1/12` exactly; do not widen the test, fix the roll.

- [ ] **Step 5: Commit**

```bash
git add js/dr/perform.js tests/dr-perform.test.js
git commit -m "feat(drag-race): performance step — craft blend, role swing, nerves, moments, runway"
```

---

### Task 8: Steps 2 and 3 — the panel sees, the host decides

**Files:**
- Create: `js/dr/judging.js`
- Test: `tests/dr-judging.test.js`

**Interfaces:**
- Consumes: a panel from `panelFor` (Task 5), performance entries from Task 7.
- Produces:
  - `judgeViews(panel, entries, memory, rng) → views` where `entries = [{ name, style, perf, runway, risk, polish }]`, `memory = { [judgeId]: { [name]: number } }` (prior verdict weight), and `views = { [judgeId]: [{ name, view, rank }] }` sorted best-first per judge.
  - `panelRanking(views) → [{ name, meanRank, spread, panelRank }]` best-first; `spread` is max−min of per-judge ranks.
  - `isSplitPanel(ranking) → boolean` (top-2 or bottom-2 differ across judges).
  - `hostBend(ranking, ctx) → [{ name, panelRank, finalRank, bend }]` with `ctx = { star: {name:0..10}, storylineNeed: {name:-1..1}, trackPull: {name:-1..1}, split }`. Bounds: panel bottom-two cannot finish 1st; panel 1st cannot finish in the bottom two; max move 2 places (3 on a split week).
  - `callWeek(finalRanking, { castSize, immune=[], tripleOnTie=false }) → { win:[], high:[], safe:[], low:[], bottom:[] }`. Counts: cast ≥12 → 3 up/3 down (1 win + 2 high, 1 low + 2 bottom); 9–11 → 2 up/3 down; ≤8 → 2/2. `immune` names skip the bottom and the next one drops in.
  - `judgeMemoryAfter(memory, panel, call) → memory` — bottoms −0.4 per judge, wins +0.3, decays ×0.7 each week.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-judging.test.js
import { describe, expect, it } from 'vitest';
import { judgeViews, panelRanking, isSplitPanel, hostBend, callWeek, judgeMemoryAfter } from '../js/dr/judging.js';
import { panelFor } from '../js/dr/judges.js';
import { seededRandom } from './helpers/rng.js';

const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const entries = names.map((name, i) => ({ name, style: 'comedy', perf: 10 - i * 0.6, runway: 5 + (i % 3), risk: 0.5, polish: 5 }));
const panel = panelFor({ rotatingId: 'law' });

describe('judgeViews and panelRanking', () => {
  it('ranks every entry per judge, best first, and merges', () => {
    const v = judgeViews(panel, entries, {}, seededRandom(1));
    expect(Object.keys(v)).toEqual(['rupaul', 'michelle', 'law']);
    expect(v.rupaul.length).toBe(12);
    expect(v.rupaul[0].rank).toBe(1);
    const r = panelRanking(v);
    expect(r[0].panelRank).toBe(1);
    expect(r.map(x => x.name)).toContain('A');
    expect(r.find(x => x.name === 'A').meanRank).toBeLessThan(r.find(x => x.name === 'L').meanRank);
  });
  it('a fashion judge lifts a runway queen the comedy judge does not', () => {
    const e = [{ name: 'Look', style: 'fashion', perf: 5, runway: 10, risk: 0.2, polish: 8 },
      { name: 'Bit', style: 'comedy', perf: 9, runway: 3, risk: 0.8, polish: 3 }];
    const v = judgeViews(panelFor({ rotatingId: 'law' }), e, {}, seededRandom(3));
    expect(v.law[0].name).toBe('Look');
    const v2 = judgeViews(panelFor({ rotatingId: 'ross' }), e, {}, seededRandom(3));
    expect(v2.ross[0].name).toBe('Bit');
  });
  it('memory drags a repeat bottom down', () => {
    const e = [{ name: 'X', style: 'camp', perf: 6, runway: 6, risk: 0.5, polish: 5 },
      { name: 'Y', style: 'camp', perf: 6, runway: 6, risk: 0.5, polish: 5 }];
    const v = judgeViews(panel, e, { rupaul: { X: -1.2 }, michelle: { X: -1.2 }, law: { X: -1.2 } }, seededRandom(4));
    expect(v.rupaul[0].name).toBe('Y');
  });
});

describe('hostBend', () => {
  const ranking = names.map((name, i) => ({ name, panelRank: i + 1, meanRank: i + 1, spread: 0 }));
  it('never lifts a panel bottom-two to the win, never drops the panel first into the bottom two', () => {
    const star = Object.fromEntries(names.map(n => [n, n === 'L' ? 10 : 0]));
    const out = hostBend(ranking, { star, storylineNeed: { L: 1 }, trackPull: { L: 1 }, split: true });
    expect(out.find(x => x.name === 'L').finalRank).toBeGreaterThan(1);
    const out2 = hostBend(ranking, { star: { A: 0 }, storylineNeed: { A: -1 }, trackPull: { A: -1 }, split: true });
    expect(out2.find(x => x.name === 'A').finalRank).toBeLessThan(11);
  });
  it('moves at most two places, three on a split week', () => {
    const star = Object.fromEntries(names.map(n => [n, n === 'F' ? 10 : 0]));
    const calm = hostBend(ranking, { star, storylineNeed: { F: 1 }, trackPull: { F: 1 }, split: false });
    expect(6 - calm.find(x => x.name === 'F').finalRank).toBeLessThanOrEqual(2);
    const split = hostBend(ranking, { star, storylineNeed: { F: 1 }, trackPull: { F: 1 }, split: true });
    expect(6 - split.find(x => x.name === 'F').finalRank).toBeLessThanOrEqual(3);
    expect(6 - split.find(x => x.name === 'F').finalRank).toBeGreaterThanOrEqual(1);
  });
  it('with no agenda the ranking is untouched and every finalRank is unique', () => {
    const out = hostBend(ranking, { star: {}, storylineNeed: {}, trackPull: {}, split: false });
    expect(out.map(x => x.finalRank)).toEqual(names.map((_, i) => i + 1));
  });
});

describe('callWeek and memory', () => {
  const fr = n => Array.from({ length: n }, (_, i) => ({ name: names[i], finalRank: i + 1 }));
  it('sizes the tops and bottoms by cast', () => {
    expect(callWeek(fr(12), { castSize: 12 })).toEqual({ win: ['A'], high: ['B', 'C'], safe: ['D', 'E', 'F', 'G', 'H', 'I'], low: ['J'], bottom: ['K', 'L'] });
    const ten = callWeek(fr(10), { castSize: 10 });
    expect(ten.win).toEqual(['A']); expect(ten.high).toEqual(['B']); expect(ten.bottom).toEqual(['I', 'J']);
    const six = callWeek(fr(6), { castSize: 6 });
    expect(six.high).toEqual(['B']); expect(six.low).toEqual([]); expect(six.bottom).toEqual(['E', 'F']);
  });
  it('immunity lifts a queen out of the bottom and pulls the next one in', () => {
    const c = callWeek(fr(12), { castSize: 12, immune: ['L'] });
    expect(c.bottom).toEqual(['J', 'K']); expect(c.safe).toContain('L');
  });
  it('memory decays and records', () => {
    const m = judgeMemoryAfter({ rupaul: { A: 1 } }, panel, { win: ['B'], bottom: ['A'], high: [], low: [], safe: [] });
    expect(m.rupaul.A).toBeCloseTo(1 * 0.7 - 0.4);
    expect(m.michelle.B).toBeCloseTo(0.3);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-judging.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```js
// js/dr/judging.js — steps 2 and 3 (spec §6.2–6.4)
import { noise } from './perform.js';

/** Each judge sees every entry through taste, style bias and memory. */
export function judgeViews(panel, entries, memory = {}, rng = Math.random) {
  const out = {};
  for (const j of panel) {
    const mem = (memory && memory[j.id]) || {};
    const rows = entries.map(e => {
      const t = j.taste;
      const view = t.challenge * e.perf + t.runway * e.runway + t.risk * (e.risk * 10)
        + t.polish * (e.polish ?? 5) + ((j.styleBias || {})[e.style] || 0) + (mem[e.name] || 0)
        + noise(rng, 1.0);
      return { name: e.name, view: Math.round(view * 100) / 100 };
    });
    rows.sort((a, b) => b.view - a.view);
    rows.forEach((r, i) => { r.rank = i + 1; });
    out[j.id] = rows;
  }
  return out;
}

/** Mean rank across the panel, best first, with the spread recorded. */
export function panelRanking(views) {
  const ids = Object.keys(views);
  const byName = {};
  for (const id of ids) for (const r of views[id]) (byName[r.name] ||= []).push(r.rank);
  const rows = Object.entries(byName).map(([name, ranks]) => ({
    name, meanRank: ranks.reduce((a, b) => a + b, 0) / ranks.length,
    spread: Math.max(...ranks) - Math.min(...ranks), ranks,
  }));
  rows.sort((a, b) => a.meanRank - b.meanRank || a.name.localeCompare(b.name));
  rows.forEach((r, i) => { r.panelRank = i + 1; });
  return rows;
}

/** Split: the judges do not agree on the top two or the bottom two. */
export function isSplitPanel(ranking) {
  const n = ranking.length;
  const top = ranking.slice(0, 2), bottom = ranking.slice(-2);
  return [...top, ...bottom].some(r => r.spread >= Math.max(2, Math.floor(n / 4)));
}

/**
 * The host reorders within bounds (spec §6.3):
 *   bend = star*0.4 + storylineNeed*0.4 + trackPull*0.2   (star scaled 0..1)
 * A panel bottom-two never wins; a panel first is never in the bottom two;
 * nobody moves more than 2 places (3 on a split week).
 */
export function hostBend(ranking, { star = {}, storylineNeed = {}, trackPull = {}, split = false } = {}) {
  const n = ranking.length;
  const maxMove = split ? 3 : 2;
  const rows = ranking.map(r => {
    const bend = ((star[r.name] || 0) / 10) * 0.4 + (storylineNeed[r.name] || 0) * 0.4 + (trackPull[r.name] || 0) * 0.2;
    // A bend of ±1 is worth maxMove places of "desire"; the sort below turns
    // desire into a position and the clamp keeps it honest.
    const desired = r.panelRank - bend * maxMove;
    return { name: r.name, panelRank: r.panelRank, bend: Math.round(bend * 1000) / 1000, desired };
  });
  rows.sort((a, b) => a.desired - b.desired || a.panelRank - b.panelRank);
  rows.forEach((r, i) => { r.finalRank = i + 1; });
  // Enforce the bounds by swapping offenders back toward their panel rank.
  const fix = () => {
    let changed = false;
    rows.sort((a, b) => a.finalRank - b.finalRank);
    for (const r of rows) {
      const tooFar = Math.abs(r.finalRank - r.panelRank) > maxMove;
      const bottomWon = r.panelRank >= n - 1 && r.finalRank === 1;
      const firstSunk = r.panelRank === 1 && r.finalRank >= n - 1;
      if (tooFar || bottomWon || firstSunk) {
        const target = r.finalRank < r.panelRank
          ? Math.max(r.finalRank + 1, r.panelRank - maxMove)
          : Math.min(r.finalRank - 1, r.panelRank + maxMove);
        const other = rows.find(o => o.finalRank === target);
        if (other) { other.finalRank = r.finalRank; r.finalRank = target; changed = true; }
      }
    }
    return changed;
  };
  for (let i = 0; i < n * 2 && fix(); i++) { /* converge */ }
  rows.sort((a, b) => a.finalRank - b.finalRank);
  return rows.map(({ name, panelRank, finalRank, bend }) => ({ name, panelRank, finalRank, bend }));
}

/** Win / high / safe / low / bottom, sized by cast (spec §6.4). */
export function callWeek(finalRanking, { castSize, immune = [], tripleOnTie = false } = {}) {
  const n = castSize || finalRanking.length;
  const up = n >= 12 ? 3 : 2;
  const down = n >= 9 ? 3 : 2;
  const order = [...finalRanking].sort((a, b) => a.finalRank - b.finalRank).map(r => r.name);
  const top = order.slice(0, up);
  let rest = order.slice(up);
  const eligibleBottom = rest.filter(nm => !immune.includes(nm));
  const bottomBlock = eligibleBottom.slice(-down);
  const bottom = bottomBlock.slice(-2);
  const low = bottomBlock.slice(0, -2);
  const safe = rest.filter(nm => !bottomBlock.includes(nm));
  void tripleOnTie; // a tie is a ranking-level event; season.js passes 3 names when it fires
  return { win: [top[0]], high: top.slice(1), safe, low, bottom };
}

/** Judges remember: decay, then tonight's verdict. */
export function judgeMemoryAfter(memory, panel, call) {
  const out = {};
  for (const j of panel) {
    const prev = (memory && memory[j.id]) || {};
    const m = {};
    for (const [k, v] of Object.entries(prev)) m[k] = v * 0.7;
    for (const nm of call.bottom || []) m[nm] = (m[nm] || 0) - 0.4;
    for (const nm of call.win || []) m[nm] = (m[nm] || 0) + 0.3;
    out[j.id] = m;
  }
  return out;
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-judging.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/dr/judging.js tests/dr-judging.test.js
git commit -m "feat(drag-race): judging — per-judge views, panel ranking, bounded host bend, calling the week"
```

---

### Task 9: The lip sync and the call

**Files:**
- Create: `js/dr/lipsync.js`
- Test: `tests/dr-lipsync.test.js`

**Interfaces:**
- Consumes: `dragOf`, `noise`, a song (Task 6).
- Produces:
  - `lipsyncScore({ player, song, lipsyncRecord=[], lastReaction=null, rng }) → { score, stunt, beats:[{beat, delta}] }` per spec §6.7. `lipsyncRecord` is `['W','L',...]`; `lastReaction` is a reaction id (`'crash-out'`/`'blow-up'` cost −0.8).
  - `lipsyncCall({ a, b, bendA=0, bendB=0, allowDoubleShantay, allowDoubleSashay }) → { call:'shantay'|'double-shantay'|'double-sashay', winner, loser, gap }`. Bends are the host bend at HALF weight (spec §6.7) already scaled by the caller: pass `bend * 0.5 * 1.5` (i.e. up to ±0.75 points).
  - Bars: double shantay needs both ≥ 8.5 and `|gap| < 0.6`; double sashay needs both ≤ 3.5.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-lipsync.test.js
import { describe, expect, it } from 'vitest';
import { lipsyncScore, lipsyncCall } from '../js/dr/lipsync.js';
import { songById } from '../js/dr/data/songs.js';
import { seededRandom } from './helpers/rng.js';

const q = (drag, stats = {}) => ({ name: 'Q', archetype: 'hero', drag, stats: { boldness: 5, temperament: 5, ...stats } });
const mean = (f, n = 400) => { let s = 0; for (let i = 0; i < n; i++) s += f(i); return s / n; };

describe('lipsyncScore', () => {
  it('lipsync is the heaviest stat; dance always counts; the mood stat matters', () => {
    const sad = songById('Halo');
    const ls = mean(i => lipsyncScore({ player: q({ lipsync: 9, dance: 3, acting: 3 }), song: sad, rng: seededRandom(i) }).score);
    const ac = mean(i => lipsyncScore({ player: q({ lipsync: 3, dance: 3, acting: 9 }), song: sad, rng: seededRandom(i) }).score);
    const dn = mean(i => lipsyncScore({ player: q({ lipsync: 3, dance: 9, acting: 3 }), song: sad, rng: seededRandom(i) }).score);
    expect(ls).toBeGreaterThan(ac); expect(ac).toBeGreaterThan(dn);
    const up = songById('Single Ladies');
    const dnUp = mean(i => lipsyncScore({ player: q({ lipsync: 3, dance: 9, acting: 3 }), song: up, rng: seededRandom(i) }).score);
    expect(dnUp).toBeGreaterThan(dn);
  });
  it('a lip sync record gives confidence, a crash-out costs', () => {
    const s = songById('Toxic');
    const fresh = mean(i => lipsyncScore({ player: q({}), song: s, rng: seededRandom(i) }).score);
    const vet = mean(i => lipsyncScore({ player: q({}), song: s, lipsyncRecord: ['W', 'W'], rng: seededRandom(i) }).score);
    const shaken = mean(i => lipsyncScore({ player: q({}), song: s, lastReaction: 'crash-out', rng: seededRandom(i) }).score);
    expect(vet).toBeGreaterThan(fresh); expect(shaken).toBeLessThan(fresh);
  });
  it('narrates in beats', () => {
    const r = lipsyncScore({ player: q({}), song: songById('Believe'), rng: seededRandom(2) });
    expect(r.beats.map(b => b.beat)).toEqual(['verse', 'chorus', 'hook', 'ending']);
  });
});

describe('lipsyncCall', () => {
  it('shantay to the higher score, sashay to the lower', () => {
    const c = lipsyncCall({ a: { name: 'A', score: 7 }, b: { name: 'B', score: 5 } });
    expect(c).toMatchObject({ call: 'shantay', winner: 'A', loser: 'B' });
  });
  it('double shantay only with the box on, both high, and close', () => {
    const hi = { a: { name: 'A', score: 9 }, b: { name: 'B', score: 8.7 } };
    expect(lipsyncCall({ ...hi }).call).toBe('shantay');
    expect(lipsyncCall({ ...hi, allowDoubleShantay: true }).call).toBe('double-shantay');
    expect(lipsyncCall({ a: { name: 'A', score: 9 }, b: { name: 'B', score: 7 }, allowDoubleShantay: true }).call).toBe('shantay');
  });
  it('double sashay only with the box on and both terrible', () => {
    const lo = { a: { name: 'A', score: 2 }, b: { name: 'B', score: 3 } };
    expect(lipsyncCall({ ...lo }).call).toBe('shantay');
    expect(lipsyncCall({ ...lo, allowDoubleSashay: true }).call).toBe('double-sashay');
  });
  it('the host bend can flip a close one, never a blowout', () => {
    expect(lipsyncCall({ a: { name: 'A', score: 6.2 }, b: { name: 'B', score: 6.0 }, bendB: 0.75 }).winner).toBe('B');
    expect(lipsyncCall({ a: { name: 'A', score: 8 }, b: { name: 'B', score: 5 }, bendB: 0.75 }).winner).toBe('A');
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-lipsync.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```js
// js/dr/lipsync.js — the lip sync for your life (spec §6.7)
import { dragOf } from './queen.js';
import { noise } from './perform.js';

const MOOD_STAT = { sad: 'acting', funny: 'comedy', fierce: 'boldness', rage: 'boldness', sexy: 'boldness' };

export function lipsyncScore({ player, song, lipsyncRecord = [], lastReaction = null, rng = Math.random }) {
  const d = dragOf(player);
  const s = (player && player.stats) || {};
  const up = song.tempo === 'uptempo' || song.tempo === 'dance';
  const moodKey = MOOD_STAT[song.mood] || 'acting';
  const moodStat = moodKey === 'boldness' ? (Number(s.boldness) || 5) : d[moodKey];
  const bold = (Number(s.boldness) || 5) / 10;
  const stuntRoll = rng();
  const stunt = stuntRoll < bold * 0.6 ? (rng() < 0.75 ? 'landed' : 'failed') : 'none';
  const stuntPts = stunt === 'landed' ? 1.0 : stunt === 'failed' ? -0.8 : 0;
  const wins = lipsyncRecord.filter(r => r === 'W').length;
  const confidence = Math.min(1.2, wins * 0.4) - (lastReaction === 'crash-out' || lastReaction === 'blow-up' ? 0.8 : 0);
  const core = d.lipsync * 0.45 + d.dance * (0.15 + (up ? 0.15 : 0)) + moodStat * 0.20;
  const score = core + stuntPts + confidence + noise(rng, 2.5);
  // Four beats so a screen can narrate the arc; the deltas sum to the noise.
  const beats = ['verse', 'chorus', 'hook', 'ending'].map(beat => ({ beat, delta: Math.round(noise(rng, 0.6) * 100) / 100 }));
  return { score: Math.round(score * 100) / 100, stunt, beats, parts: { core, stuntPts, confidence } };
}

export function lipsyncCall({ a, b, bendA = 0, bendB = 0, allowDoubleShantay = false, allowDoubleSashay = false }) {
  const sa = a.score + bendA, sb = b.score + bendB;
  const gap = Math.round((sa - sb) * 100) / 100;
  if (allowDoubleShantay && a.score >= 8.5 && b.score >= 8.5 && Math.abs(gap) < 0.6) {
    return { call: 'double-shantay', winner: null, loser: null, gap };
  }
  if (allowDoubleSashay && a.score <= 3.5 && b.score <= 3.5) {
    return { call: 'double-sashay', winner: null, loser: null, gap };
  }
  const winner = sa >= sb ? a.name : b.name;
  const loser = winner === a.name ? b.name : a.name;
  return { call: 'shantay', winner, loser, gap };
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-lipsync.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/dr/lipsync.js tests/dr-lipsync.test.js
git commit -m "feat(drag-race): the lip sync — song-tagged score, the call, double shantay/sashay gates"
```

---

### Task 10: Season state and the week spine

**Files:**
- Create: `js/dr/state.js`, `js/dr/week.js`
- Test: `tests/dr-week.test.js`

**Interfaces:**
- Consumes: Tasks 3, 5, 6, 7, 8, 9.
- Produces:
  - `initDragState({ cast, seed, rng }) → state`:
    ```js
    { seed, castOrder: [names], living: [names], out: [],
      record: { [name]: ['WIN'|'HIGH'|'SAFE'|'LOW'|'BTM'|'ELIM'...] },
      lipsyncRecord: { [name]: ['W'|'L'] },
      star: { [name]: 0..10 },          // hidden, computed once
      memory: {},                        // judge memory, Task 8 shape
      lastReaction: { [name]: id|null },
      lastWinner: null, episodes: [], winner: null, runnerUp: null, storylines: [] }
    ```
    Plain values only (survives JSON).
  - `runDragWeek(state, cfg, ctx) → row` where
    `cfg = { num, maxiId, miniId|null, rotatingId, guest|null, songTitle|null, judgeWeights, immunity, allowDoubleShantay, allowDoubleSashay, tripleOnTie, noElimination=false }`,
    `ctx = { rng, players: {name: player}, bond: (a,b)=>number in -10..10 }`.
    Mutates `state` (record, living, memory, lastWinner) and returns the `episodeHistory` row:
    ```js
    { num, format: 'drag-race', eliminated: null, exits: [{ name, slug, verb, channel }],
      twists: [], houseAtStart: [names], airedEvents: [],
      dr: { ep: num, challenge: { id, name, format, stage }, mini: { id, name, winner } | null,
            judges: [ids], guest: { name, slug } | null,
            assignment: { roles: {name: role}, teams: [[names]], order: [names] },
            performances: { [name]: { perf, moment, risk, role, parts } },
            runway: { category, [name]: { score, fit } },
            panel: { views, ranking, split }, bend: [{ name, panelRank, finalRank, bend }],
            call: { win, high, safe, low, bottom },
            reactions: { [name]: id },
            lipsync: { song, artist, queens: [a, b], scores: {a: n, b: n}, call, winner, loser } | null,
            record: { [name]: [...] }, living: [names], scenes: [{ step, text }] } }
    ```
  - `reactionFor({ expected, received, temperament, boldness, rng }) → 'crash-out'|'blow-up'|'tears'|'joy'|'sadness'|'relief'|'idgaf'`
  - `SCENE_STEPS` — the 16 step ids in order: `cold-open, werk-morning, mini, maxi-announce, choice, prep, maxi-pre, werk-elim-day, main-stage, runway, maxi-main, critiques, untucked, results, lipsync, exit`.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-week.test.js
import { describe, expect, it } from 'vitest';
import { initDragState, runDragWeek, reactionFor, SCENE_STEPS } from '../js/dr/week.js';
import { seededRandom } from './helpers/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 12, seed = 1) {
  const rng = seededRandom(seed);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f', archetype: i % 2 ? 'villain' : 'hero', age: 22 + i,
    stats: Object.fromEntries(STATS.map(k => [k, 2 + Math.floor(rng() * 9)])),
    drag: { acting: 2 + Math.floor(rng() * 9), comedy: 2 + Math.floor(rng() * 9), dance: 2 + Math.floor(rng() * 9),
      design: 2 + Math.floor(rng() * 9), runway: 2 + Math.floor(rng() * 9), lipsync: 2 + Math.floor(rng() * 9), singing: 2 + Math.floor(rng() * 9) },
  }));
}
const ctxFor = (c, seed = 3) => ({ rng: seededRandom(seed), players: Object.fromEntries(c.map(p => [p.name, p])), bond: () => 0 });
const cfg = (over = {}) => ({ num: 1, maxiId: 'acting', miniId: 'reading', rotatingId: 'ross', guest: null, songTitle: 'Toxic',
  judgeWeights: {}, immunity: false, allowDoubleShantay: false, allowDoubleSashay: false, tripleOnTie: false, ...over });

describe('initDragState', () => {
  it('seats the cast, computes hidden star power once, and is plain data', () => {
    const c = cast();
    const st = initDragState({ cast: c, seed: 5, rng: seededRandom(5) });
    expect(st.living.length).toBe(12);
    expect(Object.keys(st.star).length).toBe(12);
    expect(JSON.parse(JSON.stringify(st))).toEqual(st);
  });
});

describe('runDragWeek', () => {
  it('plays one week: a win, a bottom two, one exit, a row the site can read', () => {
    const c = cast();
    const st = initDragState({ cast: c, seed: 5, rng: seededRandom(5) });
    const row = runDragWeek(st, cfg(), ctxFor(c));
    expect(row.format).toBe('drag-race');
    expect(row.eliminated).toBe(null);
    expect(row.exits.length).toBe(1);
    expect(row.exits[0].verb).toBe('sashayed away');
    expect(row.exits[0].channel).toBe('lipsync');
    expect(row.dr.call.win.length).toBe(1);
    expect(row.dr.call.bottom.length).toBe(2);
    expect(row.dr.call.bottom).toContain(row.exits[0].name);
    expect(st.living.length).toBe(11);
    expect(st.record[row.dr.call.win[0]]).toEqual(['WIN']);
    expect(st.record[row.exits[0].name]).toEqual(['ELIM']);
    expect(row.dr.lipsync.song).toBe('Toxic');
    expect(row.dr.scenes.map(s => s.step)).toEqual(SCENE_STEPS.filter(s => s !== 'maxi-main'));
    expect(row.houseAtStart.length).toBe(12);
    expect(row.dr.panel.ranking.length).toBe(12);
    expect(row.dr.bend.length).toBe(12);
    expect(Object.keys(row.dr.reactions).length).toBe(6); // 3 up, 3 down
  });
  it('a main-stage maxi runs after the runway, a pre one before', () => {
    const c = cast();
    const st = initDragState({ cast: c, seed: 5, rng: seededRandom(5) });
    const steps = runDragWeek(st, cfg({ maxiId: 'roast' }), ctxFor(c)).dr.scenes.map(s => s.step);
    expect(steps.indexOf('maxi-main')).toBeGreaterThan(steps.indexOf('runway'));
    expect(steps).not.toContain('maxi-pre');
  });
  it('no mini means the host arrives at the maxi announcement', () => {
    const c = cast();
    const st = initDragState({ cast: c, seed: 5, rng: seededRandom(5) });
    const row = runDragWeek(st, cfg({ miniId: null }), ctxFor(c));
    expect(row.dr.mini).toBe(null);
    expect(row.dr.scenes.map(s => s.step)).not.toContain('mini');
  });
  it('immunity keeps last week\'s winner out of the bottom', () => {
    const c = cast();
    const st = initDragState({ cast: c, seed: 5, rng: seededRandom(5) });
    const r1 = runDragWeek(st, cfg({ num: 1, immunity: true }), ctxFor(c, 1));
    const w = r1.dr.call.win[0];
    // Force the worst possible week for the winner and check she still cannot be in the bottom.
    st.memory = {}; c.forEach(p => { if (p.name === w) p.drag = { acting: 1, comedy: 1, dance: 1, design: 1, runway: 1, lipsync: 1, singing: 1 }; });
    const r2 = runDragWeek(st, cfg({ num: 2, immunity: true }), ctxFor(c, 2));
    expect(r2.dr.call.bottom).not.toContain(w);
    expect(r2.dr.call.safe).toContain(w);
  });
  it('a no-elimination week has no exit and no lip sync loser', () => {
    const c = cast();
    const st = initDragState({ cast: c, seed: 5, rng: seededRandom(5) });
    const row = runDragWeek(st, cfg({ noElimination: true }), ctxFor(c));
    expect(row.exits).toEqual([]);
    expect(st.living.length).toBe(12);
    expect(row.dr.lipsync.loser).toBe(null);
  });
  it('is bit-identical on the same seed', () => {
    const a = runDragWeek(initDragState({ cast: cast(), seed: 9, rng: seededRandom(9) }), cfg(), ctxFor(cast(), 9));
    const b = runDragWeek(initDragState({ cast: cast(), seed: 9, rng: seededRandom(9) }), cfg(), ctxFor(cast(), 9));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe('reactionFor', () => {
  it('reads the gap through temperament', () => {
    const r = (expected, received, temperament, seed = 1) => reactionFor({ expected, received, temperament, boldness: 5, rng: seededRandom(seed) });
    expect(['crash-out', 'blow-up', 'tears']).toContain(r(2, 11, 2));
    expect(['joy', 'relief']).toContain(r(6, 1, 6));
    expect(['relief', 'idgaf', 'sadness']).toContain(r(6, 6, 5));
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-week.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: State**

```js
// js/dr/state.js — everything a Drag Race season remembers. Plain values only.
import { starPower } from './queen.js';

export function initDragState({ cast, seed = 1, rng = Math.random }) {
  const names = cast.map(p => p.name);
  const star = {};
  for (const p of cast) star[p.name] = Math.round(starPower(p, rng) * 100) / 100;
  return {
    seed, castOrder: [...names], living: [...names], out: [],
    record: Object.fromEntries(names.map(n => [n, []])),
    lipsyncRecord: Object.fromEntries(names.map(n => [n, []])),
    star, memory: {}, lastReaction: Object.fromEntries(names.map(n => [n, null])),
    lastWinner: null, episodes: [], winner: null, runnerUp: null, storylines: [],
  };
}
```

- [ ] **Step 4: The week**

```js
// js/dr/week.js — the sixteen steps of an episode (spec §5), generic version.
//
// Plan 1 plays every maxi through the same spine with the catalogue's blend;
// Plan 2 replaces `_assign`/`_prepare` per type through the hooks in
// js/dr/maxi.js and Plan 3 replaces the `scenes` lines with real pools.
// Nothing here prints a sentence with any show's furniture in it: the lines
// are names and results, and they exist so the transcript has a row per step.
import { dragOf } from './queen.js';
import { maxiById } from './data/challenges.js';
import { miniById } from './data/minis.js';
import { SONGS, songById } from './data/songs.js';
import { panelFor } from './judges.js';
import { performQueen, runwayScore, blendScore, noise } from './perform.js';
import { judgeViews, panelRanking, isSplitPanel, hostBend, callWeek, judgeMemoryAfter } from './judging.js';
import { lipsyncScore, lipsyncCall } from './lipsync.js';
import { showWords } from '../shows.js';

export const SCENE_STEPS = ['cold-open', 'werk-morning', 'mini', 'maxi-announce', 'choice', 'prep',
  'maxi-pre', 'werk-elim-day', 'main-stage', 'runway', 'maxi-main', 'critiques', 'untucked',
  'results', 'lipsync', 'exit'];

const slugOf = n => String(n).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

/** How she takes the verdict. expected/received are ranks (1 = best). */
export function reactionFor({ expected, received, temperament = 5, boldness = 5, rng = Math.random }) {
  const gap = received - expected;                      // + means worse than she thought
  const t = (Number(temperament) || 5) / 10, b = (Number(boldness) || 5) / 10;
  const heat = gap * (1 - t) + noise(rng, 1.5);          // low temperament amplifies
  if (heat > 4) return b > 0.5 ? 'blow-up' : 'crash-out';
  if (heat > 2) return rng() < 0.5 ? 'tears' : 'sadness';
  if (heat < -3) return 'joy';
  if (heat < -1) return 'relief';
  return rng() < 0.4 ? 'idgaf' : (gap > 0 ? 'sadness' : 'relief');
}

/** Roles per format: leads for a cast/teams show, standard otherwise. Plan 2 replaces this per type. */
function _assign(maxi, living, rng, miniWinner) {
  const roles = {}, teams = [];
  const order = [...living].sort(() => rng() - 0.5);
  if (miniWinner && order.includes(miniWinner)) { order.splice(order.indexOf(miniWinner), 1); order.unshift(miniWinner); }
  if (maxi.format === 'teams') {
    const half = Math.ceil(order.length / 2);
    teams.push(order.slice(0, half), order.slice(half));
  } else if (maxi.format === 'cast') {
    teams.push([...order]);
  } else if (maxi.format === 'pairs') {
    for (let i = 0; i < order.length; i += 2) teams.push(order.slice(i, i + 2));
  }
  order.forEach((n, i) => {
    roles[n] = !maxi.roles ? 'standard'
      : i === 0 ? 'lead' : i < 3 ? 'featured' : i < Math.max(3, order.length - 2) ? 'standard' : 'ensemble';
  });
  return { roles, teams, order };
}

/** Plan 1: prep is craft-only. Plan 2 adds help, sabotage, the walkthrough. */
function _prepare(player, maxi, ctx) {
  const d = dragOf(player);
  const s = player.stats || {};
  return (blendScore(d, maxi.blend) - 5) * 0.1 + ((Number(s.mental) || 5) - 5) * 0.03 + ((Number(s.strategic) || 5) - 5) * 0.02;
}

function _teamOf(teams, name) { return teams.find(t => t.includes(name)) || null; }

export function runDragWeek(state, cfg, ctx) {
  const { rng, players, bond = () => 0 } = ctx;
  const maxi = maxiById(cfg.maxiId);
  if (!maxi) throw new Error(`unknown maxi challenge "${cfg.maxiId}"`);
  const living = [...state.living];
  const P = n => players[n];
  const scenes = [];
  const say = (step, text) => scenes.push({ step, text });
  const words = showWords('drag-race');

  // 1–2. cold open, werk room morning
  const last = state.episodes[state.episodes.length - 1];
  say('cold-open', last && last.exits.length ? `${last.exits.map(x => x.name).join(' and ')} ${last.exits[0].verb}. The mirror is read.`
    : 'The werk room, before anyone has been sent home.');
  say('werk-morning', `${living.length} ${words.players} start the day.`);

  // 3. mini
  let mini = null, miniWinner = null;
  if (cfg.miniId) {
    const m = miniById(cfg.miniId);
    if (m) {
      const scored = living.map(n => ({ n, s: blendScore(dragOf(P(n)), m.blend) + noise(rng, 3) })).sort((a, b) => b.s - a.s);
      miniWinner = scored[0].n;
      mini = { id: m.id, name: m.name, winner: miniWinner, buys: m.buys };
      say('mini', `${m.name}: ${miniWinner} wins.`);
    }
  }
  // 4–5. announce, choice
  say('maxi-announce', `The maxi challenge is ${maxi.name}.`);
  const assignment = _assign(maxi, living, rng, miniWinner);
  say('choice', assignment.teams.length ? `Teams: ${assignment.teams.map(t => t.join(', ')).join(' | ')}.`
    : `${assignment.order[0]} picks first.`);

  // 6. prep
  const prep = Object.fromEntries(living.map(n => [n, _prepare(P(n), maxi, ctx)]));
  say('prep', `${living.length} ${words.players} prepare.`);

  // 7 / 11. the maxi
  const performances = {};
  const doMaxi = () => {
    for (const n of living) {
      const team = _teamOf(assignment.teams, n);
      const chemistry = team && team.length > 1
        ? team.filter(o => o !== n).reduce((s, o) => s + bond(n, o), 0) / (team.length - 1) * 0.1 : 0;
      const r = performQueen({ player: P(n), maxi, role: assignment.roles[n], prep: prep[n], chemistry,
        record: state.record[n], rng });
      performances[n] = { ...r, role: assignment.roles[n], team: team ? assignment.teams.indexOf(team) : null };
    }
  };
  if (maxi.stage === 'pre') { doMaxi(); say('maxi-pre', `${maxi.name} is performed.`); }

  // 8–10. elimination day, main stage, runway
  say('werk-elim-day', `${living.length} ${words.players} get into drag.`);
  const panel = panelFor({ rotatingId: cfg.rotatingId, guest: cfg.guest, weights: cfg.judgeWeights });
  say('main-stage', `The panel: ${panel.map(j => j.name).join(', ')}.`);
  const category = cfg.runwayCategory || 'category is: ' + maxi.name;
  const runway = { category };
  for (const n of living) {
    const sewn = maxi.runway === 'design' || maxi.runway === 'ball';
    const r = runwayScore({ player: P(n), category, sewn, categoryStyles: cfg.categoryStyles || [], rng });
    runway[n] = { score: r.score, fit: r.fit };
  }
  say('runway', `Category: ${category}.`);
  if (maxi.stage === 'main') { doMaxi(); say('maxi-main', `${maxi.name} is performed on the main stage.`); }

  // 12. critiques → panel views, ranking, bend, call
  const entries = living.map(n => ({ name: n, style: dragOf(P(n)).style, perf: performances[n].perf,
    runway: runway[n].score, risk: performances[n].risk, polish: (Number(P(n).stats?.mental) || 5) }));
  const views = judgeViews(panel, entries, state.memory, rng);
  const ranking = panelRanking(views);
  const split = isSplitPanel(ranking);
  const trackPull = {};
  for (const n of living) {
    const rec = state.record[n];
    const safeRun = rec.slice(-5).filter(r => r === 'SAFE').length;
    const btms = rec.filter(r => r === 'BTM').length;
    trackPull[n] = Math.min(1, safeRun * 0.2) - Math.min(1, btms * 0.34);
  }
  const storylineNeed = Object.fromEntries(living.map(n => [n, 0]));   // Plan 3 fills this
  const bend = hostBend(ranking, { star: state.star, storylineNeed, trackPull, split });
  const immune = cfg.immunity && state.lastWinner && cfg.num <= 5 ? [state.lastWinner] : [];
  const call = callWeek(bend, { castSize: living.length, immune, tripleOnTie: cfg.tripleOnTie });
  say('critiques', `Tops: ${[...call.win, ...call.high].join(', ')}. Bottoms: ${[...call.low, ...call.bottom].join(', ')}.`);

  // reactions for everyone critiqued
  const reactions = {};
  const finalRank = Object.fromEntries(bend.map(b => [b.name, b.finalRank]));
  for (const n of [...call.win, ...call.high, ...call.low, ...call.bottom]) {
    const s = P(n).stats || {};
    const expected = Math.max(1, Math.round(living.length / 2 - ((dragOf(P(n)).runway - 5) + (Number(s.intuition) || 5) - 5) * 0.4
      - state.star[n] * 0.2));
    reactions[n] = reactionFor({ expected, received: finalRank[n], temperament: s.temperament, boldness: s.boldness, rng });
    state.lastReaction[n] = reactions[n];
  }
  say('untucked', `${call.safe.length} safe ${words.players} wait.`);
  say('results', `${call.win.join(' and ')} ${call.win.length > 1 ? 'win' : 'wins'}. ${call.bottom.join(' and ')} lip sync.`);

  // 15. lip sync
  const song = (cfg.songTitle && songById(cfg.songTitle)) || pick(rng, SONGS);
  let lipsync = null;
  const exits = [];
  if (call.bottom.length >= 2) {
    const [a, b] = call.bottom;
    const sa = lipsyncScore({ player: P(a), song, lipsyncRecord: state.lipsyncRecord[a], lastReaction: reactions[a], rng });
    const sb = lipsyncScore({ player: P(b), song, lipsyncRecord: state.lipsyncRecord[b], lastReaction: reactions[b], rng });
    const bendOf = n => (bend.find(x => x.name === n)?.bend || 0) * 0.75;
    const lc = cfg.noElimination
      ? { call: 'shantay', winner: sa.score >= sb.score ? a : b, loser: null, gap: sa.score - sb.score }
      : lipsyncCall({ a: { name: a, score: sa.score }, b: { name: b, score: sb.score }, bendA: bendOf(a), bendB: bendOf(b),
          allowDoubleShantay: cfg.allowDoubleShantay, allowDoubleSashay: cfg.allowDoubleSashay });
    lipsync = { song: song.title, artist: song.artist, queens: [a, b], scores: { [a]: sa.score, [b]: sb.score },
      beats: { [a]: sa.beats, [b]: sb.beats }, stunts: { [a]: sa.stunt, [b]: sb.stunt }, call: lc.call, winner: lc.winner, loser: lc.loser, gap: lc.gap };
    if (lc.call === 'double-shantay') { state.lipsyncRecord[a].push('W'); state.lipsyncRecord[b].push('W'); }
    else if (lc.call === 'double-sashay') { exits.push(a, b); state.lipsyncRecord[a].push('L'); state.lipsyncRecord[b].push('L'); }
    else {
      state.lipsyncRecord[lc.winner].push('W');
      if (lc.loser) { state.lipsyncRecord[lc.loser].push('L'); exits.push(lc.loser); }
    }
    say('lipsync', `${a} vs ${b} — ${song.title}. ${lc.call === 'shantay' ? `${lc.winner} shantays.` : lc.call}.`);
  }

  // record + living
  for (const n of living) {
    const r = exits.includes(n) ? 'ELIM' : call.win.includes(n) ? 'WIN' : call.high.includes(n) ? 'HIGH'
      : call.low.includes(n) ? 'LOW' : call.bottom.includes(n) ? 'BTM' : 'SAFE';
    state.record[n].push(r);
  }
  state.living = living.filter(n => !exits.includes(n));
  state.out.push(...exits);
  state.lastWinner = call.win[0] || null;
  state.memory = judgeMemoryAfter(state.memory, panel, call);
  const exitRows = exits.map(n => ({ name: n, slug: P(n).slug || slugOf(n), verb: words.exit, channel: 'lipsync' }));
  say('exit', exitRows.length ? exitRows.map(x => `${x.name} ${x.verb}.`).join(' ') : 'Nobody goes home tonight.');

  const row = {
    num: cfg.num, format: 'drag-race', eliminated: null, exits: exitRows, twists: [],
    houseAtStart: living, airedEvents: [],
    dr: { ep: cfg.num, challenge: { id: maxi.id, name: maxi.name, format: maxi.format, stage: maxi.stage },
      mini, judges: panel.map(j => j.id), guest: cfg.guest ? { name: cfg.guest.name, slug: cfg.guest.slug || slugOf(cfg.guest.name) } : null,
      assignment, performances, runway, panel: { views, ranking, split }, bend, call, reactions, lipsync,
      record: JSON.parse(JSON.stringify(state.record)), living: [...state.living], scenes },
  };
  state.episodes.push(row);
  return row;
}
```

- [ ] **Step 5: Run the test**

Run: `npx vitest run tests/dr-week.test.js`
Expected: PASS. The immunity test forces the winner to all-1 craft: if it fails, the bug is in `callWeek`'s `immune` handling, not the test.

- [ ] **Step 6: Commit**

```bash
git add js/dr/state.js js/dr/week.js tests/dr-week.test.js
git commit -m "feat(drag-race): season state and the sixteen-step week spine"
```

---

### Task 11: The season loop — premiere types, the schedule, the finale

**Files:**
- Create: `js/dr/season.js`
- Test: `tests/dr-season.test.js`

**Interfaces:**
- Consumes: Task 10, catalogues.
- Produces:
  - `buildSchedule({ episodes, castSize, pinned = [], rng }) → [{ episode, maxiId, miniId, rotatingId, songTitle }]` — pinned entries (`seasonConfig.drSchedule` rows: `{ episode, maxiId?, miniId?|null, rotatingId?, guest?, songTitle? }`) are kept; gaps filled: the six tentpoles once each (never episode 1 unless pinned, never the last two), no two consecutive episodes with the same `chalStyle`, `minCast` respected against the projected cast size, minis on by default (`miniId` random from `MINI_TYPES`), rotating judge cycles through the five non-permanents.
  - `episodesFor(castSize, finaleType) → number` of weeks before the finale (one exit per week down to the finale size).
  - `playDragSeason({ cast, seed = 1, config = {}, bond = () => 0 }) → { rows, state, winner, runnerUp, finale }`; `config` reads `drPremiere, drFinale, drDoubleShantay, drDoubleSashay, drImmunity, drTripleLipsync, drSchedule, drJudgeWeights`.
  - `runFinale(state, cfg, ctx) → row` — a row with `dr.finale = { type, rounds: [{ a, b, song, winner }], winner, runnerUp, placements: [names best-first] }` and `exits: []` (finalists do not "sashay away"; the finale row's `dr.finale.placements` is the truth).

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-season.test.js
import { describe, expect, it } from 'vitest';
import { playDragSeason, buildSchedule, episodesFor } from '../js/dr/season.js';
import { TENTPOLES, maxiById } from '../js/dr/data/challenges.js';
import { seededRandom } from './helpers/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 14, seed = 1) {
  const rng = seededRandom(seed);
  const r = () => 2 + Math.floor(rng() * 9);
  return Array.from({ length: n }, (_, i) => ({ name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f',
    archetype: ['villain', 'hero', 'floater', 'wildcard'][i % 4], age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}

describe('buildSchedule', () => {
  it('books every tentpole once, keeps pins, never repeats a style back to back', () => {
    const s = buildSchedule({ episodes: 11, castSize: 14, pinned: [{ episode: 3, maxiId: 'snatch-game' }], rng: seededRandom(2) });
    expect(s.length).toBe(11);
    expect(s.find(e => e.episode === 3).maxiId).toBe('snatch-game');
    for (const t of TENTPOLES) expect(s.filter(e => e.maxiId === t).length).toBe(1);
    for (let i = 1; i < s.length; i++) expect(maxiById(s[i].maxiId).chalStyle).not.toBe(maxiById(s[i - 1].maxiId).chalStyle);
    expect(s.every(e => e.rotatingId)).toBe(true);
  });
  it('respects minCast late in the season', () => {
    const s = buildSchedule({ episodes: 11, castSize: 14, pinned: [], rng: seededRandom(4) });
    s.forEach((e, i) => expect(maxiById(e.maxiId).minCast).toBeLessThanOrEqual(14 - i));
  });
  it('episodesFor counts down to the finale', () => {
    expect(episodesFor(14, 'top4')).toBe(10);
    expect(episodesFor(12, 'top3')).toBe(9);
    expect(episodesFor(12, 'top2')).toBe(10);
  });
});

describe('playDragSeason', () => {
  it('plays a standard season to a crown', () => {
    const { rows, winner, runnerUp, finale, state } = playDragSeason({ cast: cast(14), seed: 7, config: { drFinale: 'top4' } });
    expect(rows.length).toBe(11);
    expect(rows.slice(0, 10).every(r => r.exits.length === 1)).toBe(true);
    expect(rows[10].dr.finale.type).toBe('top4');
    expect(finale.placements.length).toBe(4);
    expect(winner).toBe(finale.placements[0]);
    expect(runnerUp).toBe(finale.placements[1]);
    expect(state.living).toEqual(finale.placements.slice(0, 4).sort());
    expect(rows.every(r => r.format === 'drag-race' && r.eliminated === null)).toBe(true);
    expect(rows.every((r, i) => r.num === i + 1)).toBe(true);
  });
  it('the four finale types all crown somebody', () => {
    for (const drFinale of ['top4', 'top3', 'top2', 'perform-then-lipsync']) {
      const out = playDragSeason({ cast: cast(12), seed: 3, config: { drFinale } });
      expect(out.winner, drFinale).toBeTruthy();
      expect(out.runnerUp, drFinale).toBeTruthy();
      expect(out.winner).not.toBe(out.runnerUp);
    }
  });
  it('premiere types shape episode one', () => {
    expect(playDragSeason({ cast: cast(12), seed: 1, config: { drPremiere: 'talent-show' } }).rows[0].dr.challenge.id).toBe('talent-show');
    expect(playDragSeason({ cast: cast(12), seed: 1, config: { drPremiere: 'design' } }).rows[0].dr.challenge.id).toBe('design');
    const pork = playDragSeason({ cast: cast(12), seed: 1, config: { drPremiere: 'porkchop' } });
    expect(pork.rows[0].dr.challenge.id).toBe('runway-challenge');
    expect(pork.rows[0].exits.length).toBe(1);
    const split = playDragSeason({ cast: cast(14), seed: 1, config: { drPremiere: 'split' } });
    expect(split.rows[0].houseAtStart.length).toBe(7);
    expect(split.rows[1].houseAtStart.length).toBe(7);
    expect(split.rows[0].exits.length + split.rows[1].exits.length).toBe(0);
    expect(split.rows[2].houseAtStart.length).toBe(14);
  });
  it('is bit-identical on the same seed and differs on another', () => {
    const a = JSON.stringify(playDragSeason({ cast: cast(12), seed: 11 }).rows);
    const b = JSON.stringify(playDragSeason({ cast: cast(12), seed: 11 }).rows);
    const c = JSON.stringify(playDragSeason({ cast: cast(12), seed: 12 }).rows);
    expect(a).toBe(b); expect(a).not.toBe(c);
  });
  it('the best craft line wins between 40 and 60 percent of seasons', () => {
    let best = 0; const N = 60;
    for (let s = 0; s < N; s++) {
      const c = cast(12, 100 + s);
      const mean = p => Object.values(p.drag).reduce((x, y) => x + y, 0) / 7;
      const top = [...c].sort((x, y) => mean(y) - mean(x))[0].name;
      if (playDragSeason({ cast: c, seed: s }).winner === top) best++;
    }
    expect(best / N).toBeGreaterThan(0.30); expect(best / N).toBeLessThan(0.70);
  });
});
```

The last test is the spec's first measurement at a loose band; Plan 6 tightens it to 40–60 over 100 seasons once every layer is in.

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-season.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```js
// js/dr/season.js — a whole season, no UI (spec §5)
import { initDragState, runDragWeek } from './week.js';
import { MAXI_TYPES, TENTPOLES, maxiById } from './data/challenges.js';
import { MINI_TYPES } from './data/minis.js';
import { JUDGES } from './data/judges.js';
import { SONGS, songById } from './data/songs.js';
import { rngFor } from './rng.js';
import { panelFor } from './judges.js';
import { performQueen } from './perform.js';
import { judgeViews, panelRanking, hostBend } from './judging.js';
import { lipsyncScore } from './lipsync.js';

const FINALE_SIZE = { top4: 4, top3: 3, top2: 2, 'perform-then-lipsync': 4 };
const PREMIERE_MAXI = { 'talent-show': 'talent-show', design: 'design', runway: 'runway-challenge',
  'girl-groups': 'girl-group', porkchop: 'runway-challenge' };
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

export function episodesFor(castSize, finaleType = 'top4') {
  return castSize - (FINALE_SIZE[finaleType] || 4);
}

export function buildSchedule({ episodes, castSize, pinned = [], rng = Math.random, premiere = 'standard' }) {
  const out = [];
  const rotating = JUDGES.filter(j => !j.permanent).map(j => j.id);
  const used = new Set();
  const byEp = Object.fromEntries(pinned.filter(p => p && p.episode != null).map(p => [Number(p.episode), p]));
  const tentpolesLeft = TENTPOLES.filter(t => !Object.values(byEp).some(p => p.maxiId === t));
  // Where the tentpoles go: spread across episodes 2..episodes-2, one each.
  const slots = [];
  for (let e = 2; e <= episodes - 2; e++) if (!byEp[e] || !byEp[e].maxiId) slots.push(e);
  const tentpoleAt = {};
  for (const t of tentpolesLeft) {
    if (!slots.length) break;
    const i = Math.floor(rng() * slots.length);
    tentpoleAt[slots.splice(i, 1)[0]] = t;
  }
  let prevStyle = null;
  for (let e = 1; e <= episodes; e++) {
    const pin = byEp[e] || {};
    const alive = castSize - (e - 1);
    let maxiId = pin.maxiId || (e === 1 && PREMIERE_MAXI[premiere]) || tentpoleAt[e] || null;
    if (!maxiId) {
      const pool = MAXI_TYPES.filter(m => !m.tentpole && !used.has(m.id) && m.minCast <= alive && m.chalStyle !== prevStyle);
      const fallback = MAXI_TYPES.filter(m => !m.tentpole && m.minCast <= alive && m.chalStyle !== prevStyle);
      maxiId = pick(rng, pool.length ? pool : fallback.length ? fallback : MAXI_TYPES.filter(m => m.minCast <= alive)).id;
    }
    used.add(maxiId);
    prevStyle = maxiById(maxiId).chalStyle;
    out.push({
      episode: e, maxiId,
      miniId: 'miniId' in pin ? pin.miniId : pick(rng, MINI_TYPES).id,
      rotatingId: pin.rotatingId || rotating[(e - 1) % rotating.length],
      guest: pin.guest || null,
      songTitle: pin.songTitle || pick(rng, SONGS).title,
    });
  }
  return out;
}

function _weekCfg(sch, config, num, extra = {}) {
  return { num, maxiId: sch.maxiId, miniId: sch.miniId, rotatingId: sch.rotatingId, guest: sch.guest,
    songTitle: sch.songTitle, judgeWeights: config.drJudgeWeights || {},
    immunity: !!config.drImmunity, allowDoubleShantay: config.drDoubleShantay !== false,
    allowDoubleSashay: !!config.drDoubleSashay, tripleOnTie: !!config.drTripleLipsync, ...extra };
}

/** One lip sync between two finalists, no bend: the crown is earned on the stage. */
function _duel(state, a, b, ctx, song) {
  const sa = lipsyncScore({ player: ctx.players[a], song, lipsyncRecord: state.lipsyncRecord[a], rng: ctx.rng });
  const sb = lipsyncScore({ player: ctx.players[b], song, lipsyncRecord: state.lipsyncRecord[b], rng: ctx.rng });
  const winner = sa.score >= sb.score ? a : b;
  return { a, b, song: song.title, scores: { [a]: sa.score, [b]: sb.score }, winner, loser: winner === a ? b : a };
}

export function runFinale(state, cfg, ctx) {
  const { rng } = ctx;
  const type = cfg.type || 'top4';
  const finalists = [...state.living].sort(() => rng() - 0.5);
  const rounds = [];
  let placements = [];
  const song = () => pick(rng, SONGS);
  if (type === 'top4' || (type === 'top3' && finalists.length === 4)) {
    const s1 = _duel(state, finalists[0], finalists[1], ctx, song());
    const s2 = _duel(state, finalists[2], finalists[3], ctx, song());
    const f = _duel(state, s1.winner, s2.winner, ctx, song());
    rounds.push(s1, s2, f);
    placements = [f.winner, f.loser, s1.loser, s2.loser];
  } else if (type === 'top3') {
    const s1 = _duel(state, finalists[0], finalists[1], ctx, song());
    const f = _duel(state, s1.winner, finalists[2], ctx, song());
    rounds.push(s1, f);
    placements = [f.winner, f.loser, s1.loser];
  } else if (type === 'top2') {
    const f = _duel(state, finalists[0], finalists[1], ctx, song());
    rounds.push(f);
    placements = [f.winner, f.loser, ...finalists.slice(2)];
  } else { // perform-then-lipsync
    const maxi = maxiById('talent-show');
    const perf = Object.fromEntries(finalists.map(n => [n, performQueen({ player: ctx.players[n], maxi, record: state.record[n], rng })]));
    const panel = panelFor({ rotatingId: cfg.rotatingId || 'carson', guest: cfg.guest || null, weights: cfg.judgeWeights || {} });
    const entries = finalists.map(n => ({ name: n, style: 'pageant', perf: perf[n].perf, runway: 5, risk: perf[n].risk, polish: 5 }));
    const ranking = panelRanking(judgeViews(panel, entries, state.memory, rng));
    const bend = hostBend(ranking, { star: state.star, storylineNeed: {}, trackPull: {}, split: false });
    const [a, b, ...rest] = bend.map(x => x.name);
    const f = _duel(state, a, b, ctx, song());
    rounds.push(f);
    placements = [f.winner, f.loser, ...rest];
    state.finalePerformance = perf;
  }
  state.winner = placements[0]; state.runnerUp = placements[1];
  const row = {
    num: cfg.num, format: 'drag-race', eliminated: null, exits: [], twists: [],
    houseAtStart: [...state.living], airedEvents: [],
    dr: { ep: cfg.num, challenge: { id: 'finale', name: 'The Finale', format: 'solo', stage: 'main' },
      finale: { type, rounds, winner: placements[0], runnerUp: placements[1], placements },
      record: JSON.parse(JSON.stringify(state.record)), living: [...state.living],
      scenes: [{ step: 'main-stage', text: `Finale: ${finalists.join(', ')}.` },
        ...rounds.map(r => ({ step: 'lipsync', text: `${r.a} vs ${r.b} — ${r.song}. ${r.winner} wins.` })),
        { step: 'exit', text: `${placements[0]} is crowned. ${placements[1]} is the runner-up.` }] },
  };
  for (const n of state.living) state.record[n].push(n === placements[0] ? 'WINNER' : 'FINALIST');
  state.episodes.push(row);
  return row;
}

export function playDragSeason({ cast, seed = 1, config = {}, bond = () => 0 }) {
  const rng = rngFor(seed);
  const state = initDragState({ cast, seed, rng });
  const players = Object.fromEntries(cast.map(p => [p.name, p]));
  const ctx = { rng, players, bond };
  const finaleType = config.drFinale || 'top4';
  const premiere = config.drPremiere || 'standard';
  const rows = [];
  let num = 1;

  // Split premiere: two halves, one maxi each, no exit; the season proper starts at episode 3.
  if (premiere === 'split' && cast.length >= 10) {
    const order = [...state.castOrder].sort(() => rng() - 0.5);
    const halves = [order.slice(0, Math.ceil(order.length / 2)), order.slice(Math.ceil(order.length / 2))];
    for (const half of halves) {
      const sch = buildSchedule({ episodes: 1, castSize: half.length, pinned: [], rng, premiere: 'talent-show' })[0];
      const saved = state.living; state.living = half;
      rows.push(runDragWeek(state, _weekCfg(sch, config, num++, { noElimination: true }), ctx));
      state.living = saved;
    }
  }
  const weeks = episodesFor(cast.length, finaleType) - (premiere === 'porkchop' ? 0 : 0);
  const schedule = buildSchedule({ episodes: weeks, castSize: cast.length, pinned: config.drSchedule || [], rng,
    premiere: premiere === 'split' ? 'standard' : premiere });
  for (const sch of schedule) {
    if (state.living.length <= (FINALE_SIZE[finaleType] || 4)) break;
    rows.push(runDragWeek(state, _weekCfg(sch, config, num++), ctx));
  }
  const last = schedule[schedule.length - 1] || {};
  const finale = runFinale(state, { num: num++, type: finaleType, rotatingId: last.rotatingId, guest: null, judgeWeights: config.drJudgeWeights }, ctx);
  rows.push(finale);
  return { rows, state, winner: state.winner, runnerUp: state.runnerUp, finale: finale.dr.finale };
}
```

`porkchop` is a `runway-challenge` premiere with a normal lip sync exit, which `PREMIERE_MAXI` already gives it; the difference from `runway` is narrated by Plan 3. `rngFor` is the engine's own seeded generator from Task 7 (`js/dr/rng.js`); the engine never imports from `tests/`.

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-season.test.js`
Expected: PASS. If the tentpole-once test fails, the leak is `used`: a pinned tentpole must be added to `used` before the loop.

- [ ] **Step 5: Commit**

```bash
git add js/dr/season.js tests/dr-season.test.js
git commit -m "feat(drag-race): the season — schedule builder, premiere types, four finale types"
```

---

### Task 12: `js/dr-run.js` — the runnable flag and both dispatch points

**Files:**
- Create: `js/dr-run.js`
- Modify: `js/main.js` (import beside `trRunMod`, add to the module spread at ~line 254)
- Modify: `js/run-ui.js` — imports (~line 22), `simulateNext()` (~line 1296, before the castle branch), `replayEpisode()` (~lines 1489–1500)
- Test: `tests/dr-run.test.js`

**Interfaces:**
- Consumes: `playDragSeason` (Task 11), `gs`, `players`, `seasonConfig`, `seasonFormat` from `js/core.js`, `getPerceivedBond` from `js/bonds.js`.
- Produces:
  - `isDragSeason() → boolean`
  - `simulateDragEpisode() → row | null` — plays the whole season on first call into `gs._drQueue` (seed on `gs._drSeed`), shifts one row per call onto `gs.episodeHistory`, sets `gs.activePlayers = row.dr.living`, `gs.episode = row.num`, `gs.phase = 'stage' | 'complete'`, `gs.dr = { star, record, ... }` mirror of the state for screens, and `gs.drWinner` on the finale row.
  - `dragEpisodesLeft() → number`
  - `window._drRunnable = true` at module bottom.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-run.test.js — the stage is REACHABLE (same shape as tests/tr-run.test.js)
import { afterAll, describe, expect, it } from 'vitest';
import { gs as gsRef, setGs, setPlayers, players, seasonConfig, formatIsRunnable, defaultConfig } from '../js/core.js';
import { isDragSeason, simulateDragEpisode, dragEpisodesLeft } from '../js/dr-run.js';
import { roundExits } from '../js/shows.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const CAST = Array.from({ length: 12 }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
  stats: Object.fromEntries(STATS.map(k => [k, 5])), drag: { acting: 3 + (i % 7), comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5 } }));

let gsDescribed = false;
function stage(cfg = {}) {
  if (!gsDescribed) { Object.defineProperty(globalThis, 'gs', { configurable: true, get: () => gsRef, set: v => setGs(v) }); gsDescribed = true; }
  setPlayers(CAST.map(p => ({ ...p })));
  Object.assign(seasonConfig, defaultConfig(), { format: 'drag-race', seasonNumber: 1, ...cfg });
  setGs({ episodeHistory: [], activePlayers: CAST.map(p => p.name), eliminated: [], popularity: {}, bonds: {}, episode: 0 });
}
afterAll(() => { delete globalThis.gs; });

describe('dr-run', () => {
  it('sets the runnable flag by being imported', () => {
    globalThis.window = globalThis.window || {};
    expect(formatIsRunnable('drag-race')).toBe(true);
  });
  it('knows a drag season from the config', () => {
    stage(); expect(isDragSeason()).toBe(true);
    Object.assign(seasonConfig, { format: 'traitors' }); expect(isDragSeason()).toBe(false);
  });
  it('plays one row per press onto gs.episodeHistory and finishes with a crown', () => {
    stage();
    const r1 = simulateDragEpisode();
    expect(r1.num).toBe(1); expect(gsRef.episodeHistory.length).toBe(1);
    expect(gsRef.activePlayers.length).toBe(11);
    expect(roundExits(r1, 'drag-race')[0].verb).toBe('sashayed away');
    expect(dragEpisodesLeft()).toBe(8);
    let row = r1, guard = 0;
    while (row && guard++ < 20) row = simulateDragEpisode();
    expect(gsRef.phase).toBe('complete');
    expect(gsRef.episodeHistory.length).toBe(9);
    expect(gsRef.drWinner).toBeTruthy();
    expect(gsRef.episodeHistory.every(r => r.format === 'drag-race')).toBe(true);
  });
  it('rebuilds the same season from the seed after the queue is lost', () => {
    stage();
    const first = [simulateDragEpisode(), simulateDragEpisode()].map(r => JSON.stringify(r.dr.call));
    const seed = gsRef._drSeed;
    delete gsRef._drQueue;
    const third = simulateDragEpisode();
    expect(third.num).toBe(3);
    expect(gsRef._drSeed).toBe(seed);
    expect(JSON.stringify(gsRef.episodeHistory.slice(0, 2).map(r => r.dr.call))).toBe(JSON.stringify(first));
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-run.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `js/dr-run.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// dr-run.js — the run loop's main-stage branch, and the runnable flag
// ══════════════════════════════════════════════════════════════════════
//
// Same shape as js/tr-run.js: the engine plays the whole season in one call
// (js/dr/season.js) and the rows are queued on gs._drQueue; each press of
// "Simulate Episode N" shifts one onto gs.episodeHistory. The seed lives on
// gs._drSeed so a lost queue (reload, older save) rebuilds the SAME season and
// drops the rows that already aired.
import { gs, players, seasonConfig, seasonFormat } from './core.js';
import { getPerceivedBond } from './bonds.js';
import { playDragSeason } from './dr/season.js';

export const isDragSeason = () => seasonFormat(seasonConfig) === 'drag-race';

function _seed() {
  if (!gs._drSeed) {
    gs._drSeed = (Number(seasonConfig.seasonNumber) || 0) * 1000 + Math.floor(Math.random() * 1000) + 1;
  }
  return gs._drSeed;
}

function _config() {
  return {
    drPremiere: seasonConfig.drPremiere, drFinale: seasonConfig.drFinale,
    drDoubleShantay: seasonConfig.drDoubleShantay, drDoubleSashay: seasonConfig.drDoubleSashay,
    drImmunity: seasonConfig.drImmunity, drTripleLipsync: seasonConfig.drTripleLipsync,
    drSchedule: (seasonConfig.drSchedule || []).filter(Boolean),
    drJudgeWeights: seasonConfig.drJudgeWeights || {},
  };
}

function _playWholeSeason() {
  const cast = (players || []).filter(p => p && p.name);
  if (cast.length < 4) return false;
  const bond = (a, b) => { try { return getPerceivedBond(a, b) || 0; } catch { return 0; } };
  const out = playDragSeason({ cast, seed: _seed(), config: _config(), bond });
  gs._drQueue = out.rows;
  gs.dr = { star: out.state.star, castOrder: out.state.castOrder };
  gs._drResult = { winner: out.winner, runnerUp: out.runnerUp };
  return true;
}

export function simulateDragEpisode() {
  if (!gs) return null;
  if (!Array.isArray(gs._drQueue)) {
    const aired = (gs.episodeHistory || []).length;
    if (!_playWholeSeason()) return null;
    if (aired > 0) gs._drQueue = gs._drQueue.slice(aired);
  }
  const row = (gs._drQueue || []).shift();
  if (!row) { gs.phase = 'complete'; return null; }
  (gs.episodeHistory ||= []).push(row);
  gs.activePlayers = [...(row.dr?.living || [])];
  gs.episode = row.num;
  gs.eliminated = [...(gs.eliminated || []), ...row.exits.map(x => x.name)];
  if (row.dr?.finale) {
    gs.phase = 'complete';
    gs.drWinner = row.dr.finale.winner || null;
    gs.drRunnerUp = row.dr.finale.runnerUp || null;
  } else {
    gs.phase = gs._drQueue.length ? 'stage' : 'complete';
  }
  return row;
}

export function dragEpisodesLeft() { return Array.isArray(gs?._drQueue) ? gs._drQueue.length : 0; }

if (typeof window !== 'undefined') window._drRunnable = true;
```

- [ ] **Step 4: Wire the dispatch**

`js/main.js`: beside `import * as trRunMod from './tr-run.js';` add `import * as drRunMod from './dr-run.js';` and add `drRunMod` to the module spread array next to `trRunMod`.

`js/run-ui.js` imports: `import { isDragSeason, simulateDragEpisode } from './dr-run.js';`

In `simulateNext()`, immediately before the `if (isTraitorsSeason()) {` block:

```js
  // ── THE MAIN STAGE ────────────────────────────────────────────────
  // Fourth engine, fourth branch, on the FORMAT alone (see the castle's note).
  if (isDragSeason()) {
    _saveEpisodeCheckpoint();
    const drEp = simulateDragEpisode();
    if (!drEp) {
      alert(gs.activePlayers && gs.activePlayers.length
        ? 'This season is already complete.'
        : 'Add queens to Cast Builder first.');
      return;
    }
    // Popularity: the engine writes nothing here in Plan 1; Plan 3 adds the
    // per-scene ledger. updatePopularity reads a Total Drama episode and is
    // deliberately not called.
    _refreshFeed();
    _autoRevealSpoiler(drEp.num);
    viewingEpNum = drEp.num;
    renderRunTab();
    document.getElementById('run-main').scrollTop = 0;
    return;
  }
```

In `replayEpisode()`: change `if (isBigBrotherSeason() || isTraitorsSeason()) _saveEpisodeCheckpoint();` to include `|| isDragSeason()`, and the engine choice to:

```js
    ep = isDragSeason()
      ? simulateDragEpisode()
      : isTraitorsSeason()
        ? simulateTraitorsEpisode()
        : isBigBrotherSeason()
          ? (simulateBBEpisode() || runBBFinale())
          : (gs.phase === 'finale' ? simulateFinale() : simulateEpisode());
```

Search `run-ui.js` for every other `isTraitorsSeason()` read (the hub card ~line 389, the "season complete" test, the finale-size guard) and add the drag branch beside each with the same meaning; `tests/dr-run.test.js` covers the engine, the rest is checked by opening the app in Task 14.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/dr-run.test.js tests/tr-run.test.js tests/season-format.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/dr-run.js js/main.js js/run-ui.js tests/dr-run.test.js
git commit -m "feat(drag-race): dr-run — runnable flag, queued season, both dispatch points"
```

---

### Task 13: The run tab — episode card, badges, the timeline pickers

**Files:**
- Create: `js/dr/badges.js`
- Modify: `js/run-ui.js` — `renderEpisodeHistory` (~line 1100), `buildHubAftermath` (~line 321), `renderTimeline` (~line 2818), and the picker helpers next to `_setBBComp` (~line 2515)
- Test: `tests/dr-run-ui.test.js`

**Interfaces:**
- Produces:
  - `DR_BADGES = [{ id, text, color, when: row => boolean }]` in `js/dr/badges.js`: `win` (gold), `double-shantay`, `double-sashay`, `finale`, `moment` (any performance with `moment`), `split-panel`, `robbed` (any queen whose `finalRank - panelRank >= 2`).
  - `dragBadges(row) → html` (pills, same markup as `_traitorsBadges`).
  - `_setDRPick(ep, key, value)` writing `seasonConfig.drSchedule` entries `{ episode, maxiId, miniId, rotatingId, guest, songTitle }` (a cleared picker removes the key; an entry with only `episode` is removed).
  - Timeline rows for a drag season show five selects: maxi (all 18, grouped tentpoles first), mini (`— none —` + `MINI_TYPES`), judge (the five rotating), guest (`— none —` + every roster character not in the cast, from `FRANCHISE_ROSTER.players` in `js/cast-ui.js`; the stored value is the whole `{ name, slug, archetype, stats, voice }` so the engine needs no roster), song (`— roll —` + `SONGS`).

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-run-ui.test.js
import { describe, expect, it } from 'vitest';
import { DR_BADGES, dragBadges } from '../js/dr/badges.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const CAST = Array.from({ length: 12 }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
  stats: Object.fromEntries(STATS.map(k => [k, 5])), drag: { acting: 3 + (i % 7), comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5 } }));

describe('badges', () => {
  const { rows } = playDragSeason({ cast: CAST, seed: 2, config: { drDoubleShantay: true } });
  it('every episode carries a win badge, the finale carries the finale badge', () => {
    for (const r of rows.slice(0, -1)) expect(dragBadges(r)).toContain('Win');
    expect(dragBadges(rows[rows.length - 1])).toContain('Finale');
  });
  it('speaks no other show\'s words', () => {
    for (const r of rows) expect(foreignWordsIn(dragBadges(r).replace(/<[^>]+>/g, ' '), 'drag-race')).toEqual([]);
  });
  it('robbed fires only when the host moved somebody two places', () => {
    const robbed = DR_BADGES.find(b => b.id === 'robbed');
    expect(robbed.when({ dr: { bend: [{ name: 'A', panelRank: 1, finalRank: 3 }] } })).toBe(true);
    expect(robbed.when({ dr: { bend: [{ name: 'A', panelRank: 1, finalRank: 2 }] } })).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-run-ui.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Badges**

```js
// js/dr/badges.js — the pills on an episode card, off the RECORD
export const DR_BADGES = [
  { id: 'win', text: 'Win', color: '#f2c14e', when: r => !!(r.dr && r.dr.call && r.dr.call.win && r.dr.call.win.length) },
  { id: 'double-shantay', text: 'Double shantay', color: '#4ade80', when: r => r.dr?.lipsync?.call === 'double-shantay' },
  { id: 'double-sashay', text: 'Double sashay', color: '#f85149', when: r => r.dr?.lipsync?.call === 'double-sashay' },
  { id: 'moment', text: 'Moment', color: '#c084fc', when: r => Object.values(r.dr?.performances || {}).some(p => p.moment) },
  { id: 'split-panel', text: 'Split panel', color: '#60a5fa', when: r => !!r.dr?.panel?.split },
  { id: 'robbed', text: 'Robbed', color: '#fb923c', when: r => (r.dr?.bend || []).some(b => b.finalRank - b.panelRank >= 2) },
  { id: 'finale', text: 'Finale', color: '#ff2d95', when: r => !!r.dr?.finale },
];

export function dragBadges(row) {
  const pill = (text, color) => `<span class="ep-hist-tag" style="background:${color}22;color:${color}">${text}</span>`;
  let out = '';
  for (const b of DR_BADGES) { let on = false; try { on = !!b.when(row); } catch { on = false; } if (on) out += pill(b.text, b.color); }
  return out;
}
```

- [ ] **Step 4: Episode card and hub**

In `js/run-ui.js`:
- Import `dragBadges` and `MAXI_TYPES`, `MINI_TYPES`, `SONGS`, `JUDGES`.
- Add `const _isStageRow = ep => !!ep && ep.format === 'drag-race';` beside `_isCastleRow`.
- In `renderEpisodeHistory`, before the castle card, add a card of the same shape for `_isStageRow(ep)`: title `Episode N`, the exits via `roundExits(ep, 'drag-race')` (finale row: `ep.dr.finale.winner + ' crowned'`), and `dragBadges(ep)`.
- In `buildHubAftermath`, beside the traitors branch: `else if (seasonFormat(ep) === 'drag-race') { const exits = roundExits(ep, 'drag-race'); why = ep.dr?.finale ? `${ep.dr.finale.winner} was crowned.` : exits.length ? exits.map(x => `${x.name} ${x.verb} after the lip sync.`).join(' ') : 'Nobody was sent home tonight.'; }`
- Wherever the hub reads `nextScheduled` (~line 406) the drag branch's fallback text is `'Standard episode — the schedule decides the maxi'`.

- [ ] **Step 5: Timeline pickers**

Next to `_setBBComp`:

```js
function _drEntry(ep) { return (seasonConfig.drSchedule || []).find(c => c && Number(c.episode) === Number(ep)); }

export function _setDRPick(ep, key, value) {
  if (!seasonConfig.drSchedule) seasonConfig.drSchedule = [];
  let entry = _drEntry(ep);
  if (!entry) { entry = { episode: Number(ep) }; seasonConfig.drSchedule.push(entry); }
  if (key === 'guest') {
    const pool = (typeof FRANCHISE_ROSTER !== 'undefined' && FRANCHISE_ROSTER?.players) || [];
    const p = pool.find(x => x.slug === value);
    if (p) entry.guest = { name: p.name, slug: p.slug, archetype: p.archetype, stats: { ...(p.stats || {}) }, voice: p.voice || '' };
    else delete entry.guest;
  } else if (key === 'miniId' && value === 'none') entry.miniId = null;
  else if (value) entry[key] = value;
  else delete entry[key];
  if (Object.keys(entry).length === 1) seasonConfig.drSchedule = seasonConfig.drSchedule.filter(c => c !== entry);
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTimeline();
}

function _drPickers(ep) {
  const e = _drEntry(ep) || {};
  const sel = (key, opts, cur, title) => `<select onchange="event.stopPropagation();_setDRPick(${ep},'${key}',this.value)" onclick="event.stopPropagation()" title="${title}" style="font-size:10px;background:#1e1e2e;color:#cdd6f4;border:1px solid rgba(255,45,149,0.35);border-radius:3px;padding:1px 2px;margin:2px 2px 0 0;max-width:100%">`
    + opts.map(([v, label]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${label}</option>`).join('') + '</select>';
  const tent = MAXI_TYPES.filter(m => m.tentpole), rest = MAXI_TYPES.filter(m => !m.tentpole);
  const pool = (typeof FRANCHISE_ROSTER !== 'undefined' && FRANCHISE_ROSTER?.players) || [];
  const castNames = new Set((players || []).map(p => p.name));
  return sel('maxiId', [['', '— maxi: let the schedule decide —'], ...tent.map(m => [m.id, '★ ' + m.name]), ...rest.map(m => [m.id, m.name])], e.maxiId || '', 'Maxi challenge')
    + sel('miniId', [['', '— mini: random —'], ['none', 'No mini challenge'], ...MINI_TYPES.map(m => [m.id, m.name])], e.miniId === null ? 'none' : (e.miniId || ''), 'Mini challenge')
    + sel('rotatingId', [['', '— judge: rotate —'], ...JUDGES.filter(j => !j.permanent).map(j => [j.id, j.name])], e.rotatingId || '', 'Rotating judge')
    + sel('guest', [['', '— guest: none —'], ...pool.filter(p => !castNames.has(p.name)).map(p => [p.slug, p.name])], e.guest?.slug || '', 'Guest judge')
    + sel('songTitle', [['', '— song: roll —'], ...SONGS.map(s => [s.title, `${s.title} — ${s.artist}`])], e.songTitle || '', 'Lip sync song');
}
```

In `renderTimeline`, add `const isStage = seasonFormat(seasonConfig) === 'drag-race';` beside `isHouse`, suppress the MERGE marker for it (`!isHouse && !isStage && ...`), and inside the per-episode card markup append `${isStage && !isFinale ? _drPickers(ep) : ''}` where the Big Brother comp pickers are appended (grep `_bbCompPickers` or the call that renders `bbCompSchedule` selects, and add the drag call beside it). Expose `_setDRPick` on `window` the way `_setBBComp` is (it is exported; `main.js` spreads run-ui's exports).

- [ ] **Step 6: Run the tests**

Run: `npx vitest run tests/dr-run-ui.test.js tests/dr-run.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add js/dr/badges.js js/run-ui.js tests/dr-run-ui.test.js
git commit -m "feat(drag-race): run tab — episode card, badges, timeline pickers for maxi/mini/judge/guest/song"
```

---

### Task 14: The refusing exporter, the guards, and a season played by hand

**Files:**
- Modify: `js/stats-export.js` (~line 2983, beside the traitors registration)
- Modify: `docs/ADDING-A-SHOW.md` §13 count paragraph
- Test: existing guards

- [ ] **Step 1: Register a refusal**

```js
export async function exportDragRaceSeason() {
  throw new Error(
    `${SHOWS['drag-race'].name} has no export path yet — Plan 4 builds the episodes[] shape. `
    + `Refusing rather than exporting it as ${SHOWS[DEFAULT_FORMAT].name}.`);
}
registerSeasonExporter('drag-race', exportDragRaceSeason);
```

- [ ] **Step 2: Run every show guard**

Run:
```
npx vitest run tests/dr-registry.test.js tests/dr-setup.test.js tests/dr-queen.test.js tests/dr-studio-drag.test.js tests/dr-judges.test.js tests/dr-catalogue.test.js tests/dr-perform.test.js tests/dr-judging.test.js tests/dr-lipsync.test.js tests/dr-week.test.js tests/dr-season.test.js tests/dr-run.test.js tests/dr-run-ui.test.js tests/show-list-duplication.test.js tests/show-vocabulary.test.js tests/format-scoped-config.test.js tests/ratings.test.js tests/show-switcher.test.js tests/season-format.test.js tests/no-direct-avatar-paths.test.js tests/tr-run.test.js
```
Expected: all PASS. `show-list-duplication` fails if any file you touched added a `=== 'drag-race' ?` two-way ternary: replace it with a registry read or an `if` on the row's `format` beside the existing branches.

- [ ] **Step 3: Re-derive the counts**

Run the §13 commands from `docs/ADDING-A-SHOW.md` and write the new `big-brother` mention counts for `js/core.js` and `js/stats-export.js` into its counts paragraph, in this commit.

- [ ] **Step 4: Play a season in the browser**

Start the local server (`python serve.py`), open `simulator.html`, pick Drag Race in Quick Setup, add 12 queens from the roster (any characters; their `drag` block defaults to 5s), press Simulate through to the crown. Confirm: the episode cards render with badges, the hub says who sashayed away, the timeline shows the five pickers, no console error. Fix what you find; this step is the manual's step 6 and nothing replaces it.

- [ ] **Step 5: Commit**

```bash
git add js/stats-export.js docs/ADDING-A-SHOW.md
git commit -m "feat(drag-race): refusing exporter; guards green; first season played end to end"
git push -u origin drag-race
```

---

## Self-review against the spec

- §2 registry: Task 1. §3 queen + star: Tasks 3, 4. §4 judges: Task 5. §5 season/episode: Tasks 10, 11, 12. §6 decision engine: Tasks 7, 8, 9. §8.1 spine hooks: the `_assign`/`_prepare` seams in Task 10 are what Plan 2 replaces per type. §8.5 catalogue: Task 6. §11 manual rules: runnable flag (12), `episodeHistory` with `eliminated: null` + `exits` (10), `CONFIG_SCOPE` (2), vocabulary guard (1).
- Not in this plan by design: storylines (§7) beyond the `storylineNeed` seam, social hooks (§7), text pools, export (§9), screens and the chart (§10), ratings signals and the writer. Plans 2–6.
- Type consistency: `row.dr.call` is `{ win, high, safe, low, bottom }` everywhere; `state.record` values are `WIN|HIGH|SAFE|LOW|BTM|ELIM|WINNER|FINALIST`; `exits[]` entries carry `channel: 'lipsync'`.
