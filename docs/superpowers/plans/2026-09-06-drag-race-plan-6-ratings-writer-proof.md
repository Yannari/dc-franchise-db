# Drag Race Plan 6 — Ratings, the writer, the franchise, and the proof

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the show. Wire the layers that can only be wired against a season that really happened — TV ratings, the audience award, the aftermath, the edit layer, the AI episode writer — connect queens to the rest of the franchise, and then prove the whole thing against the spec's measurement table.

**Architecture:** Almost all wiring. The one genuinely new piece is `readSignals` for this format, which the manual is emphatic can only be done after a season is played and printed, and which fails silently and permanently if it is guessed. Everything else attaches an existing show-agnostic system to fields that now exist.

**Tech Stack:** ES modules, vitest, the Cloudflare workers (`worker/worker-episode-live.js`, `worker/worker-season-live.js`).

**Spec:** `docs/superpowers/specs/2026-09-06-drag-race-design.md` §10–§13, and `docs/ADDING-A-SHOW.md` §2.5, §7, §8, §14.14.

**Depends on:** Plans 1–5, and **a published season on disk** (Plan 4 Task 8). Do not start Task 1 without one.

## Global Constraints

- Everything in Plan 1's Global Constraints still applies, with the trailer
  ```
  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Y4XaJLLRHojvnzFuEVJsAt
  ```
- **A ratings signal that reads zero is not an error, it is "this did not happen".** So a mis-wired signal produces a plausible number that is wrong for ever. The only check that works is printing every signal against a real season and reading them (manual §2.5).
- **Never rank by `gs.popularity`.** `audienceStanding()` is the comparable reading and it is show-agnostic; this show writes the ledger and reads the function.
- **Do not invent a fact to fill a field.** No jury record, no vote record, no advantage lifecycle.
- **Check correlations within groups, not pooled** (manual §14.8). This cast splits by drag style and by archetype; a pooled number can hide two opposite slopes.

---

### Task 1: The ratings signals

**Files:**
- Modify: `js/ratings.js` (`readSignals`)
- Create: `tools/print-drag-signals.mjs`
- Test: `tests/dr-ratings.test.js`

**Interfaces:**
- `readSignals(ep, prev, opts)` gains a `placements` branch, keyed on `roundShape(format)`. Where each of the eleven signals comes from on this show:

| Signal | Source on a drag episode | Why |
|---|---|---|
| `blindside` | `bend` — how far the host moved somebody, scaled by the field | This show's surprise is the panel being overruled, not a flipped vote |
| `predictable` | whether the maxi winner was already the frontrunner, and whether the bottom two were the two lowest-scoring performances | A season where the best queen wins every week has no show in it |
| `steamroll` | overlap of this week's top three with last week's | The same three at the top every week is the complaint |
| `likability` | `audienceStanding` spread across the cast | unchanged, show-agnostic |
| `powerShift` | a queen moving from the bottom to the win, or the reverse | the arc a viewer notices |
| `showmance` | romance events among the werk room events | the pool writes them |
| `twist` | `row.twists.length` plus a critique twist | unchanged |
| `returns` | zero for a regular season; the field exists for All Stars | honest zero, not a missing read |
| `mess` | the count of `confrontation`, `blow-up-continues`, `spotlight-hog`, `sabotage`, `stole-a-bit`, `dump` events | this show's mess is in the werk room and the lounge |
| `villainy` | events fired by villain-archetype queens, scaled | unchanged in spirit |
| `strategy` | the storyline beats recorded this episode | this show has no vote to be strategic about; its "game" is the edit |

- `tools/print-drag-signals.mjs` reads the published season and prints an eleven-column table, one row per episode.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-ratings.test.js
import { describe, expect, it } from 'vitest';
import { readSignals, rawScore, BASE_TASTE } from '../js/ratings.js';
import { playDragSeason } from '../js/dr/season.js';
import { SHOWS } from '../js/shows.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'mastermind', 'goat', 'schemer', 'showmancer'];
function cast(n, seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: ARCH[i % ARCH.length], age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
const seasons = Array.from({ length: 12 }, (_, s) => playDragSeason({ cast: cast(12, 700 + s), seed: s }));

function signalsFor(rows) {
  const out = []; let prev = null;
  for (const row of rows) { const s = readSignals(row, prev, { format: 'drag-race' }); out.push(s); prev = s; }
  return out;
}

describe('the signals', () => {
  const all = seasons.flatMap(x => signalsFor(x.rows));
  const KEYS = Object.keys(BASE_TASTE.teens);

  it('reads every signal the taste table expects', () => {
    for (const s of all) for (const k of KEYS) {
      expect(Number.isFinite(s[k]), `${k} is not a number`).toBe(true);
      expect(s[k], `${k} out of range`).toBeGreaterThanOrEqual(0);
      expect(s[k], `${k} out of range`).toBeLessThanOrEqual(1);
    }
  });

  it('NOTHING is pinned — the manual\'s only real check', () => {
    for (const k of KEYS) {
      const vals = all.map(s => s[k]);
      const distinct = new Set(vals.map(v => Math.round(v * 20))).size;
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      console.log(`${k.padEnd(12)} mean=${mean.toFixed(3)} distinct=${distinct} min=${Math.min(...vals).toFixed(2)} max=${Math.max(...vals).toFixed(2)}`);
      if (k === 'returns') continue;   // honestly zero in a regular season
      expect(distinct, `${k} is pinned at one value — it is almost certainly mis-wired`).toBeGreaterThan(2);
    }
  });

  it('returns is honestly zero, and says so rather than being absent', () => {
    for (const s of all) expect(s.returns).toBe(0);
  });

  it('the show layer bites: the same week rates differently here than on the other shows', () => {
    const wk = { strategy: 0.5, predictable: 0.4, steamroll: 0.5, likability: 0.6, blindside: 0.5,
      powerShift: 0.4, showmance: 0.2, twist: 0.2, returns: 0, mess: 0.7, villainy: 0.5 };
    const dr = rawScore(wk, 'teens', 'drag-race');
    const bb = rawScore(wk, 'teens', 'big-brother');
    const td = rawScore(wk, 'teens', 'total-drama');
    expect(Math.abs(dr - bb)).toBeGreaterThan(1);
    expect(Math.abs(dr - td)).toBeGreaterThan(1);
    expect(SHOWS['drag-race'].audience.mess).toBeGreaterThan(1);
  });

  it('a messy week rates higher here than a quiet one', () => {
    const quiet = { strategy: 0.3, predictable: 0.6, steamroll: 0.4, likability: 0.6, blindside: 0.2,
      powerShift: 0.1, showmance: 0, twist: 0, returns: 0, mess: 0.05, villainy: 0.1 };
    const messy = { ...quiet, mess: 0.9, villainy: 0.7, powerShift: 0.6 };
    expect(rawScore(messy, 'teens', 'drag-race')).toBeGreaterThan(rawScore(quiet, 'teens', 'drag-race') + 2);
  });
});
```

- [ ] **Step 2: Run it to see what is pinned**

Run: `npx vitest run tests/dr-ratings.test.js`
Expected: FAIL, and the printed table names which signals are stuck. That table is the point of the task.

- [ ] **Step 3: Wire the branch**

In `js/ratings.js`, at the top of `readSignals`, branch on `roundShape(format) === 'placements'` and compute the eleven from the table above, reusing the shared helpers (`norm`, `clamp01`, `toneShare`) rather than writing new ones. Keep the ballot path untouched.

- [ ] **Step 4: The printer, and read it**

```js
// tools/print-drag-signals.mjs
import { readFileSync } from 'node:fs';
import { readSignals } from '../js/ratings.js';
const doc = JSON.parse(readFileSync(process.argv[2] || 'data/seasons/dr-1-data.json', 'utf8'));
const KEYS = ['strategy', 'predictable', 'steamroll', 'likability', 'blindside', 'powerShift',
  'showmance', 'twist', 'returns', 'mess', 'villainy'];
console.log(['ep', ...KEYS].map(k => k.padStart(11)).join(''));
let prev = null;
for (const e of doc.episodes) {
  const s = readSignals(e, prev, { format: 'drag-race' });
  console.log([String(e.episode), ...KEYS.map(k => (s[k] ?? 0).toFixed(2))].map(x => String(x).padStart(11)).join(''));
  prev = s;
}
```

Run `node tools/print-drag-signals.mjs` against the published season and **read the table**. Every column should move across the season. A column that is flat is mis-wired even if the test passes on synthetic seasons.

- [ ] **Step 5: Add the show to the distribution guard**

Add `'drag-race'` to `tests/ratings-distribution.test.js`'s per-show list, and write the measured bands into `CALIBRATION`'s comment for this show. That table is a snapshot and it rots; record the date.

- [ ] **Step 6: Run and commit**

Run: `npx vitest run tests/dr-ratings.test.js tests/ratings.test.js tests/ratings-distribution.test.js`

```bash
git add js/ratings.js tools/print-drag-signals.mjs tests/dr-ratings.test.js tests/ratings-distribution.test.js
git commit -m "feat(drag-race): ratings signals wired against a real season, with the printed table that proved it"
```

---

### Task 2: Miss Congeniality, and the audience

**Files:**
- Modify: `js/dr/season.js`, `js/dr/export.js`, `js/dr-run.js`
- Test: `tests/dr-audience.test.js`

**Interfaces:**
- The award is run by `runAudienceVote({ eligible, rng, blocks, scale })` from `js/audience.js` — **show-agnostic, and this show must not write its own** (manual §8). Eligible: everybody except the winner. Run once at the finale; stored on `state.congeniality`, exported as `doc.congeniality` and as `congeniality: true` on that queen's placement row.
- `gs.popularity` is written by every event (Plans 2–3, through `applyEvents`) and is never ranked by. One ledger is enough here: the audience knows nothing the cast does not, so there is no `affection`/`spectacle` split.
- `js/dr-run.js` passes a real `popDelta` into the week, so a played season's ledger matches a headless one's.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-audience.test.js
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { audienceStanding, audienceBoard } from '../js/audience.js';
import { buildDragSeasonDocument } from '../js/dr/export.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'social-butterfly'];
function cast(n, seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: ARCH[i % ARCH.length], age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}

describe('Miss Congeniality', () => {
  it('is awarded, is never the winner, and is on the document', () => {
    for (let s = 0; s < 12; s++) {
      const out = playDragSeason({ cast: cast(12, 800 + s), seed: s });
      expect(out.state.congeniality, `season ${s}`).toBeTruthy();
      expect(out.state.congeniality).not.toBe(out.winner);
      const doc = buildDragSeasonDocument(out.rows, { seasonNumber: 1, congeniality: out.state.congeniality });
      expect(doc.congeniality).toBe(out.state.congeniality);
      expect(doc.placements.find(p => p.congeniality).name).toBe(out.state.congeniality);
    }
  });
  it('is not simply whoever lasted longest', () => {
    const winners = [];
    for (let s = 0; s < 25; s++) {
      const out = playDragSeason({ cast: cast(12, 900 + s), seed: s });
      const doc = buildDragSeasonDocument(out.rows, { seasonNumber: 1, congeniality: out.state.congeniality });
      winners.push(doc.placements.find(p => p.name === out.state.congeniality).placement);
    }
    const mean = winners.reduce((a, b) => a + b, 0) / winners.length;
    expect(mean, 'congeniality is tracking placement').toBeGreaterThan(3);
    expect(new Set(winners).size, 'it always goes to the same finishing position').toBeGreaterThan(3);
  });
});

describe('popularity is a ledger, not a ranking', () => {
  it('audienceStanding does not simply restate placement', () => {
    const rows = [];
    for (let s = 0; s < 15; s++) {
      const out = playDragSeason({ cast: cast(12, 950 + s), seed: s });
      const gsLike = { popularity: out.state.popularity || {}, episodeHistory: out.rows };
      const doc = buildDragSeasonDocument(out.rows, { seasonNumber: 1 });
      for (const p of doc.placements) rows.push({ placement: p.placement, standing: audienceStanding(p.name, gsLike) });
    }
    const xs = rows.map(r => r.standing), ys = rows.map(r => r.placement);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
    const cov = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
    const sx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0)), sy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0));
    const r = sx && sy ? cov / (sx * sy) : 0;
    console.log(`audienceStanding vs placement: r=${r.toFixed(3)}`);
    expect(Math.abs(r), 'standing is placement measured twice').toBeLessThan(0.7);
  });
  it('the board ranks, and it is not the placement order', () => {
    const out = playDragSeason({ cast: cast(12, 999), seed: 4 });
    const gsLike = { popularity: out.state.popularity || {}, episodeHistory: out.rows };
    const board = audienceBoard({ eligible: out.state.castOrder, gs: gsLike });
    expect(board.length).toBe(12);
    const doc = buildDragSeasonDocument(out.rows, { seasonNumber: 1 });
    expect(board.map(b => b.name)).not.toEqual(doc.placements.map(p => p.name));
  });
});
```

- [ ] **Step 2: Run it, then wire it**

Run: `npx vitest run tests/dr-audience.test.js` — FAIL, then implement: keep a `state.popularity` ledger in the headless path mirroring what `dr-run.js` writes to `gs.popularity`, call `runAudienceVote` at the finale, store and export the result.

- [ ] **Step 3: Commit**

```bash
git add js/dr/season.js js/dr/export.js js/dr-run.js tests/dr-audience.test.js
git commit -m "feat(drag-race): Miss Congeniality through the shared audience vote, and a ledger nothing ranks by"
```

---

### Task 3: The aftermath and the edit layer

**Files:**
- Create: `js/dr/aftermath.js`
- Modify: `js/edit-layer.js` (a drag adapter)
- Test: `tests/dr-aftermath.test.js`

**Interfaces:**
- `buildDragAftermath(rows, { players }) → { screenTime, arcs, moments, awards }`:
  - `screenTime[name]` — scenes she appeared in, per episode and total.
  - `arcs` — `arcSummary(state.storylines)` at the finale.
  - `moments` — every performance with `moment: true`, every `assassin`, `roasted-the-panel`, `showstopper`, `stunt-landed`, and every double shantay.
  - `awards` — Miss Congeniality, most maxi wins, most lip syncs survived, the robbed queen, the biggest bend, the most improved (worst-to-best swing across the season).
- The edit layer's audience pulse gains a drag adapter reading screen time and moments, the same way the Big Brother one does.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-aftermath.test.js
import { describe, expect, it } from 'vitest';
import { buildDragAftermath } from '../js/dr/aftermath.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'schemer'];
function cast(n, seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: ARCH[i % ARCH.length], age: 21 + i, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
const out = playDragSeason({ cast: cast(12, 1200), seed: 3 });
const a = buildDragAftermath(out.rows, { players: Object.fromEntries(out.state.castOrder.map(n => [n, { name: n }])) });

describe('the aftermath', () => {
  it('counts screen time per queen and it is not uniform', () => {
    const vals = Object.values(a.screenTime).map(x => x.total);
    expect(vals.length).toBe(12);
    expect(Math.max(...vals)).toBeGreaterThan(Math.min(...vals) * 1.5);
  });
  it('collects the season\'s moments', () => {
    expect(Array.isArray(a.moments)).toBe(true);
    for (const m of a.moments) { expect(m.episode).toBeGreaterThan(0); expect(m.name).toBeTruthy(); expect(m.kind).toBeTruthy(); }
  });
  it('hands out awards that are not all the same person', () => {
    const names = Object.values(a.awards).map(x => x?.name).filter(Boolean);
    expect(names.length).toBeGreaterThanOrEqual(4);
    expect(new Set(names).size).toBeGreaterThan(1);
  });
  it('reports the arcs it followed', () => {
    expect(a.arcs.length).toBeGreaterThan(2);
    for (const arc of a.arcs) expect(arc.arc).toBeTruthy();
  });
  it('the most improved queen really improved', () => {
    const mi = a.awards.mostImproved;
    if (mi) {
      const rec = out.state.record[mi.name];
      const early = rec.slice(0, Math.ceil(rec.length / 2)).filter(r => r === 'WIN' || r === 'HIGH').length;
      const late = rec.slice(Math.ceil(rec.length / 2)).filter(r => r === 'WIN' || r === 'HIGH').length;
      expect(late).toBeGreaterThanOrEqual(early);
    }
  });
});
```

- [ ] **Step 2: Implement, run, commit**

Run: `npx vitest run tests/dr-aftermath.test.js`

```bash
git add js/dr/aftermath.js js/edit-layer.js tests/dr-aftermath.test.js
git commit -m "feat(drag-race): the aftermath — screen time, moments, arcs, and awards nobody sweeps"
```

---

### Task 4: The AI episode writer

**Files:**
- Modify: `worker/worker-episode-live.js` (a drag prompt), `js/broadcast.js` or whichever module builds the beat sheet (grep `worker-episode-live` for the client side)
- Test: `tests/dr-writer-prompt.test.js`

**Interfaces:**
- A `buildDragBeatSheet(row) → { header, beats: [] }` on the client: the episode's facts in order, taken from the row — the challenge and its description, the assignment, the werk room scenes, the performance highlights, the runway, the critiques with tones, Untucked, the result, the lip sync, the exit.
- A drag prompt in the worker with its own tone examples. **The worker falls back to Total Drama's tone examples for an unknown show, directly under its own instruction not to import another format's words** (manual §14.10) — so this show must have its own block, and the fallback must be checked.
- The prompt states: the show's vocabulary, that there is no vote and no jury, that the panel ranks and the host decides, that a queen's voice comes from her `drag.voice`, and that nothing may be invented that is not in the beat sheet.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-writer-prompt.test.js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildDragBeatSheet } from '../js/dr/writer.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const worker = readFileSync('worker/worker-episode-live.js', 'utf8');
const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n, seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r(), voice: 'Dry, fast, never explains the joke.' } }));
}
const { rows } = playDragSeason({ cast: cast(12, 1300), seed: 2 });

describe('the worker knows this show', () => {
  it('has its own prompt block, not a fallback to another show', () => {
    expect(worker).toMatch(/drag-race/);
    const dr = worker.slice(worker.indexOf('drag-race'));
    expect(dr).toMatch(/maxi challenge|runway|lip sync/i);
  });
  it('its tone examples do not mention another show', () => {
    const start = worker.indexOf("'drag-race'");
    const block = worker.slice(start, start + 4000);
    expect(foreignWordsIn(block.toLowerCase(), 'drag-race')).toEqual([]);
  });
});

describe('the beat sheet', () => {
  const sheet = buildDragBeatSheet(rows[3]);
  it('carries the episode in order and nothing invented', () => {
    expect(sheet.header).toMatch(/Episode 4/);
    expect(sheet.beats.length).toBeGreaterThan(8);
    const text = sheet.beats.join('\n');
    expect(text).toContain(rows[3].dr.challenge.name);
    for (const n of rows[3].dr.call.bottom) expect(text).toContain(n);
    expect(foreignWordsIn(text, 'drag-race')).toEqual([]);
  });
  it('states the mechanism, so the writer does not invent a vote', () => {
    const text = sheet.beats.join('\n').toLowerCase();
    expect(text).not.toMatch(/\bvote|ballot|jury\b/);
    expect(text).toMatch(/panel|judges/);
  });
  it('carries each queen\'s own voice for the ones who speak', () => {
    expect(sheet.voices || sheet.header).toBeTruthy();
    if (sheet.voices) for (const v of Object.values(sheet.voices)) expect(typeof v).toBe('string');
  });
});
```

- [ ] **Step 2: Implement, run, commit**

Run: `npx vitest run tests/dr-writer-prompt.test.js`, then send **one** real request and read the episode it writes before committing — this is the step that costs money per run, and the manual puts it last for that reason.

```bash
git add worker/worker-episode-live.js js/dr/writer.js tests/dr-writer-prompt.test.js
git commit -m "feat(drag-race): the episode writer's own prompt and beat sheet, verified against one real run"
```

---

### Task 5: Queens in the franchise

**Files:**
- Modify: `js/franchise-meta.js` (verify `hasFranchiseHistory` covers this show), `js/alumni.js`, `js/social/archive.js`, `js/life-hook.js`
- Test: `tests/dr-franchise.test.js`

**Interfaces:**
- A queen with a published drag season is an alumna: her placement, maxi wins, lip sync record, relationships and exit type reach the shared ledger, which makes her available to The Traitors as an Alumni contestant (manual §14.14) **without anybody adding a show list** — the eligible-source derivation reads `js/shows.js`.
- The life layer receives the season's broken pairs and formed sisterhoods the same way the other shows do.
- The social feed's archive builds drag posts from placements, not ballots (Plan 4 Task 3 did the read; this verifies the crowd's reaction shape).

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-franchise.test.js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SHOWS } from '../js/shows.js';
import { buildDragSeasonDocument } from '../js/dr/export.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n, seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
const doc = buildDragSeasonDocument(playDragSeason({ cast: cast(12, 1400), seed: 1 }).rows, { seasonNumber: 1 });

describe('queens join the franchise', () => {
  it('the Traitors casting derives its source shows from the registry', () => {
    const tr = readFileSync('js/tr/state.js', 'utf8') + readFileSync('js/alumni.js', 'utf8');
    expect(tr, 'a hardcoded two-show list would exclude every future show')
      .not.toMatch(/\['total-drama', *'big-brother'\]/);
    expect(Object.keys(SHOWS)).toContain('drag-race');
  });
  it('an appearance carries everything the ledger asks for', () => {
    for (const p of doc.placements) {
      expect(p.name && p.playerSlug && p.placement && p.status).toBeTruthy();
    }
    expect(doc.format).toBe('drag-race');
    expect(doc.seasonId).toBe('dr-1');
  });
  it('exports no jury and no vote record, because the show has neither', () => {
    expect(doc.votingHistory).toBeUndefined();
    expect(doc.juryVotes).toBeUndefined();
    expect(doc.winner.vote).toBe('');
  });
});
```

- [ ] **Step 2: Run it, fix what it names, commit**

```bash
git add js/franchise-meta.js js/alumni.js js/social/archive.js js/life-hook.js tests/dr-franchise.test.js
git commit -m "feat(drag-race): queens are franchise alumni, and no casting path holds a show list"
```

---

### Task 6: The proof

**Files:**
- Create: `tests/dr-spec.audit.test.js` (slow; add to `vitest.slow.js`)
- Modify: `docs/superpowers/specs/2026-09-06-drag-race-design.md` (the results table)
- Test: the above

**Interfaces:** none. This runs the spec's ten measurements over 100 seasons and writes the answers into the spec.

- [ ] **Step 1: Write the audit**

```js
// tests/dr-spec.audit.test.js
//
// THE SPEC'S OWN TABLE, measured. Slow by design: 100 seasons. Run it with
//   npx vitest run tests/dr-spec.audit.test.js
// and paste the printed table into the spec's §13.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { DRAG_SCREENS } from '../js/vp-dr/screens.js';
import { craftMean } from '../js/dr/queen.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'mastermind', 'goat', 'schemer', 'showmancer',
  'hothead', 'challenge-beast', 'social-butterfly', 'loyal-soldier', 'chaos-agent', 'underdog', 'perceptive-player'];
const STYLES = ['pageant', 'comedy', 'fashion', 'camp', 'club-kid', 'spooky', 'broadway', 'dancer', 'glamour', 'art'];
function cast(n, seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`,
    gender: ['f', 'm', 'nb'][i % 3], archetype: ARCH[i % ARCH.length], age: 20 + (i % 22),
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r(),
      style: STYLES[i % STYLES.length] } }));
}

describe('the spec, measured over 100 seasons', () => {
  const N = 100;
  const seasons = Array.from({ length: N }, (_, s) => {
    const c = cast(13, 2000 + s);
    return { c, out: playDragSeason({ cast: c, seed: s, config: { drDoubleShantay: true, drDoubleSashay: true } }) };
  });
  const report = {};

  it('1. the best craft line wins 40-60% of seasons', () => {
    const hits = seasons.filter(({ c, out }) =>
      out.winner === [...c].sort((a, b) => craftMean(b) - craftMean(a))[0].name).length;
    report['best craft wins'] = `${(hits / N * 100).toFixed(1)}%`;
    expect(hits / N).toBeGreaterThanOrEqual(0.40);
    expect(hits / N).toBeLessThanOrEqual(0.60);
  });

  it('2. the panel and the final ranking differ on about one episode in three', () => {
    let eps = 0, diff = 0;
    for (const { out } of seasons) for (const row of out.rows) {
      if (!row.dr?.bend?.length) continue;
      eps++;
      if (row.dr.bend.some(b => b.panelRank !== b.finalRank)) diff++;
    }
    report['panel ≠ final'] = `${(diff / eps * 100).toFixed(1)}% of episodes`;
    expect(diff / eps).toBeGreaterThan(0.20);
    expect(diff / eps).toBeLessThan(0.50);
  });

  it('3. the host moves somebody more than one place at most one episode in five', () => {
    let eps = 0, big = 0;
    for (const { out } of seasons) for (const row of out.rows) {
      if (!row.dr?.bend?.length) continue;
      eps++;
      if (row.dr.bend.some(b => Math.abs(b.finalRank - b.panelRank) >= 2)) big++;
    }
    report['bend ≥ 2 places'] = `${(big / eps * 100).toFixed(1)}% of episodes`;
    expect(big / eps).toBeLessThanOrEqual(0.20);
  });

  it('4. every storyline reaches its second beat in at least 70% of seasons', () => {
    const ok = seasons.filter(({ out }) => out.state.storylines.some(s => s.beats.length >= 2)).length;
    report['arc reaches beat 2'] = `${(ok / N * 100).toFixed(0)}% of seasons`;
    expect(ok / N).toBeGreaterThanOrEqual(0.70);
  });

  it('5. a double shantay and a double sashay are each at most one per three seasons', () => {
    const count = call => seasons.reduce((n, { out }) =>
      n + out.rows.filter(r => r.dr?.lipsync?.call === call).length, 0);
    const ds = count('double-shantay'), dz = count('double-sashay');
    report['double shantay'] = `${ds} in ${N} seasons`;
    report['double sashay'] = `${dz} in ${N} seasons`;
    expect(ds / N).toBeLessThanOrEqual(0.34);
    expect(dz / N).toBeLessThanOrEqual(0.34);
  });

  it('6. a queen surviving three or more lip syncs happens, and is rare', () => {
    const fighters = seasons.filter(({ out }) =>
      Object.values(out.state.lipsyncRecord).some(r => r.filter(x => x === 'W').length >= 3)).length;
    report['3+ lip sync wins'] = `${fighters} of ${N} seasons`;
    expect(fighters).toBeGreaterThan(0);
    expect(fighters / N).toBeLessThan(0.5);
  });

  it('7. every screen renders on every episode', () => {
    let drawn = 0;
    for (const { out } of seasons.slice(0, 10)) for (const row of out.rows) for (const s of DRAG_SCREENS) {
      if (!s.when(row)) continue;
      const html = s.build(row);
      expect(html.length, `${s.id} ep${row.num}`).toBeGreaterThan(200);
      drawn++;
    }
    report['screens rendered'] = String(drawn);
    expect(drawn).toBeGreaterThan(1000);
  });

  it('8. no vocabulary leak in either direction', () => {
    let checked = 0;
    for (const { out } of seasons.slice(0, 10)) for (const row of out.rows) for (const sc of row.dr.scenes) {
      if (!sc.text) continue;
      expect(foreignWordsIn(sc.text, 'drag-race'), `${sc.kind}: ${sc.text}`).toEqual([]);
      checked++;
    }
    report['lines checked'] = String(checked);
    expect(checked).toBeGreaterThan(2000);
  });

  it('9. popularity against placement, PER STYLE, never past -0.6', () => {
    const byStyle = {};
    for (const { c, out } of seasons) {
      const place = Object.fromEntries(out.state.castOrder.map((n, i) => [n, i]));
      const finalOrder = [...out.state.out].reverse();
      out.state.castOrder.forEach(n => { place[n] = finalOrder.indexOf(n) >= 0 ? finalOrder.indexOf(n) + 1 : 0; });
      for (const p of c) {
        const style = p.drag.style;
        (byStyle[style] ||= []).push({ pop: (out.state.popularity || {})[p.name] || 0, place: place[p.name] });
      }
    }
    for (const [style, rows] of Object.entries(byStyle)) {
      const xs = rows.map(r => r.pop), ys = rows.map(r => r.place);
      const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
      const cov = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
      const sx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0)), sy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0));
      const r = sx && sy ? cov / (sx * sy) : 0;
      report[`pop~place (${style})`] = r.toFixed(3);
      expect(Math.abs(r), `${style}: popularity is placement measured twice`).toBeLessThan(0.6);
    }
  });

  it('10. prints the table', () => {
    console.log('\n' + Object.entries(report).map(([k, v]) => `${k.padEnd(26)} ${v}`).join('\n') + '\n');
    expect(Object.keys(report).length).toBeGreaterThan(8);
  });
});
```

- [ ] **Step 2: Run it, fix what fails, run again**

Run: `npx vitest run tests/dr-spec.audit.test.js`

A failure here is a real finding about the engine, not a test to loosen. The likely ones and where they come from:

- best-craft-wins too high → the host bend is too weak or the noise too small (Plan 1 Task 7's `noise`, Task 8's `maxMove`)
- panel ≠ final too rare → judge taste spread too narrow (Plan 1 Task 5's `taste` weights)
- an arc never reaching beat 2 → `storylineNeed` is bounded too tightly, or arcs die too fast (Plan 3 Task 1)
- doubles too common → the bars in Plan 1 Task 9 are too loose
- a per-style correlation past `−0.6` → some style's queens accrue popularity only by surviving; the fix is an event that pays that style earlier

- [ ] **Step 3: Write the table into the spec**

Replace the spec's §13 target table with a two-column version: the target, and the measured value with today's date. Keep the targets visible so a future drift is legible.

- [ ] **Step 4: Register as slow, and commit**

Add the file to `vitest.slow.js`, verify it is not collected by `npm test`.

```bash
git add tests/dr-spec.audit.test.js vitest.slow.js docs/superpowers/specs/2026-09-06-drag-race-design.md
git commit -m "test(drag-race): the spec measured over 100 seasons, with the numbers written back into it"
```

---

### Task 7: Close the show out

**Files:**
- Modify: `docs/ADDING-A-SHOW.md`, `CLAUDE.md`, `README.md` if it lists shows
- Create: `docs/drag-race.md`

- [ ] **Step 1: Re-derive the manual's counts**

Run every command in `docs/ADDING-A-SHOW.md` §13. Write the new numbers into its counts paragraph in this commit — the instruction is only worth as much as the re-run. Note what adding a fourth show found that the third did not, in a new §15, following §14's format: what was already broken, what only a fourth show could reveal, and what the next show should do differently.

- [ ] **Step 2: Write the show's own doc**

`docs/drag-race.md`: the format, the three-step decision engine and why it is three steps, the queen model, where each thing lives, how to add a maxi challenge type, how to add a judge, and the measurement table. Short; the plans hold the detail.

- [ ] **Step 3: Update `CLAUDE.md`**

Add the Drag Race section: the craft stats and the ban on inventing more, the archetype rules as they apply here, the three-step rule (an engine change that lets the text layer decide a result is a bug), the scene/event shapes, and the file map.

- [ ] **Step 4: Run everything the show owns, once**

```
npx vitest run tests/dr-*.test.js tests/show-vocabulary.test.js tests/show-list-duplication.test.js tests/format-scoped-config.test.js tests/ratings.test.js tests/season-format.test.js tests/no-direct-avatar-paths.test.js
npx vitest run tests/dr-balance.audit.test.js tests/dr-spec.audit.test.js
npx playwright test tests/e2e/show-pages.spec.js tests/e2e/dr-vp.spec.js
```

Then kill any orphan vitest workers (the memory's standing note) and report the results honestly, including anything still red.

- [ ] **Step 5: Commit and push**

```bash
git add docs CLAUDE.md README.md
git commit -m "docs(drag-race): the show's own doc, the manual's re-derived counts, and a §15 for the fourth show"
git push
```

- [ ] **Step 6: Decide the merge with the user**

The branch has never been merged (the standing rule from The Traitors). Ask the user whether to merge `drag-race` to `main` now or keep it separate, and follow `superpowers:finishing-a-development-branch` for whichever they choose.

---

## Self-review against the spec

- §2.5 of the manual (the ratings reader, wired only after a played season, verified by printing): Task 1. §8's popularity and audience rules: Task 2. §10's aftermath and edit layer: Task 3. §7's AI layer: Task 4. §14.14's alumni ledger: Task 5. The spec's §13 measurement table: Task 6. The manual's §13 re-derivation and a §15 for what the fourth show found: Task 7.
- Out of scope for the whole six-plan sequence, as the spec says: All Stars formats, the look book, international variants, and guest judges with history against a queen. All Stars gets its own spec after a regular season has been played, which by the end of this plan it has.
