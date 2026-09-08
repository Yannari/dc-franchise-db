# Drag Race Plan 4 — The export, and every screen that reads it

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a Drag Race season and have the whole site render it correctly — the season page, the character article, the career dossier, the social feed, the rankings board, the player profile — in the show's own words, with no screen falling through to another show's shape.

**Architecture:** A third per-round export shape, `episodes[]`, carrying a placement grid instead of ballots. `js/dr/export.js` builds the season document; `roundLedger()` and `seasonRounds()` learn the new array through the registry rather than through a new branch; and every reader of `weeks`/`votingHistory` is swept, because the lesson from adding the third show was that a new field ships with two readers and nine blind spots.

**Tech Stack:** ES modules, no build step, vitest, plus the Cloudflare worker (`worker/worker-studio.js`) and `serve.py` for the local publish path.

**Spec:** `docs/superpowers/specs/2026-09-06-drag-race-design.md` §9, and `docs/ADDING-A-SHOW.md` §5, §6, §8, §14.1

**Depends on:** Plans 1–3.

## Global Constraints

- Everything in Plan 1's Global Constraints still applies, with the trailer
  ```
  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Y4XaJLLRHojvnzFuEVJsAt
  ```
- **`eliminated` is null on every drag row.** Every existing reader of that field means "the vote", and this show has none. Departures live on `exits[]` and are read through `roundExits()`. A reader that asks `row.eliminated === name` about a drag season is a bug, not a style choice.
- **The change is not the field, it is every reader that has to learn it exists** (`docs/ADDING-A-SHOW.md` §14.1). Task 3 is a sweep, not an edit.
- **A two-show boolean is a show list.** `hasBlock = bbWeeks.length > 0` in `season_ref.html` decides that page's entire layout by asking which array was non-empty. Task 4 replaces it with a registry read. `tests/show-list-duplication.test.js` counts these; the count must go down, never up.
- **Never invent a fact to satisfy a schema.** No jury, so no jury record. No ballots, so no `votingHistory`. `winner.vote` is a TALLY field and this show has no tally: leave it empty and put the finale's shape in its own field.

## File map

| File | Responsibility |
|---|---|
| `js/dr/export.js` | `episodes[]`, placements, winner, career stats, season details |
| `js/stats-export.js` | register the real builder, replacing Plan 1's refusal |
| `js/shows.js` | `roundsPath`, and the round-shape declaration the readers ask |
| `js/wiki-fill.js` | `roundLedger` reads the third array |
| `season_ref.html` | the Wiki tab's six branches |
| `js/wiki.js`, `js/wiki-view.js` | the career grid and the article's per-season block |
| `js/social/live.js`, `js/social/archive.js` | the feed reads placements, not ballots |
| `js/rankings-update.js`, `js/ranking-boards.js` | the board and its currencies |
| `worker/worker-studio.js`, `serve.py` | publish accepts the format |

---

### Task 1: The season document

**Files:**
- Create: `js/dr/export.js`
- Test: `tests/dr-export.test.js`

**Interfaces:**
- Consumes: a played season (`playDragSeason` result, or `gs.episodeHistory` rows).
- Produces:
  - `DRAG_FORMAT = 'drag-race'`
  - `seasonFilePath(n) → 'data/seasons/dr-<n>-data.json'`, `episodeStoreKey(n, e) → 'dr_episode_s<n>_e<e>'`, `analyticsKey(n) → 'AI_ANALYTICS_dr-<n>'`
  - `dragEpisodes(rows) → episodes[]`:
    ```js
    { episode, challenge: { id, name, format, stage }, mini: { id, name, winner } | null,
      judges: [ids], guest: { name, playerSlug } | null,
      runwayCategory, song: { title, artist } | null,
      placements: [{ name, playerSlug, result, panelRank, finalRank, storyline }],
      lipsync: { queens: [a, b], winner, loser, call, song } | null,
      exits: [{ name, playerSlug, verb, channel }],
      eliminated: null,
      twists: [] }
    ```
    `result` is `WIN|HIGH|SAFE|LOW|BTM|ELIM|OUT|WINNER|FINALIST`; `OUT` is a queen already gone (so the grid has a cell for everybody in every episode, which is what a track record chart needs).
  - `dragPlacements(rows, cast) → placements[]` in the manual's §5 shape: `{ name, playerSlug, placement, status }`, where `status` is `Winner` / `Runner-up` / `Finalist` / `Miss Congeniality` / the exit verb, capitalised.
  - `dragCareerStats(rows, name) → { wins, highs, lows, bottoms, lipsyncWins, congeniality }` matching the registry's `careerStats` keys under `dr.`.
  - `dragSeasonDetails(rows, n, name) → { season, format, placement, status, challengeWins, dr: {...} }`
  - `buildDragSeasonDocument(rows, { seasonNumber, twists, congeniality }) → doc` with `seasonNumber, format, seasonId, castSize, episodeCount, winner, winners, placements, episodes, twists, finale`. `winner.vote` is `''` and the finale's shape goes in `finale: { type, rounds, placements }`.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-export.test.js
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { buildDragSeasonDocument, dragEpisodes, dragPlacements, dragCareerStats,
  seasonFilePath, episodeStoreKey, analyticsKey } from '../js/dr/export.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'mastermind', 'goat'];
function cast(n = 12, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Queen${i + 1}`, slug: `queen${i + 1}`,
    gender: ['f', 'm', 'nb'][i % 3], archetype: ARCH[i % ARCH.length], age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
const C = cast(12, 2);
const season = playDragSeason({ cast: C, seed: 8 });
const doc = buildDragSeasonDocument(season.rows, { seasonNumber: 1, twists: [] });

describe('keys and paths', () => {
  it('are all prefixed dr', () => {
    expect(seasonFilePath(3)).toBe('data/seasons/dr-3-data.json');
    expect(episodeStoreKey(3, 5)).toBe('dr_episode_s3_e5');
    expect(analyticsKey(3)).toBe('AI_ANALYTICS_dr-3');
  });
});

describe('episodes[]', () => {
  const eps = dragEpisodes(season.rows);
  it('has one entry per episode with a cell for every queen', () => {
    expect(eps.length).toBe(season.rows.length);
    for (const e of eps) {
      expect(e.placements.length).toBe(C.length);
      for (const p of e.placements) {
        expect(['WIN', 'HIGH', 'SAFE', 'LOW', 'BTM', 'ELIM', 'OUT', 'WINNER', 'FINALIST']).toContain(p.result);
        expect(p.playerSlug).toBeTruthy();
      }
    }
  });
  it('never sets eliminated, and puts departures on exits', () => {
    for (const e of eps) {
      expect(e.eliminated).toBe(null);
      for (const x of e.exits) { expect(x.verb).toBe('sashayed away'); expect(x.channel).toBe('lipsync'); }
    }
    const gone = eps.flatMap(e => e.exits.map(x => x.name));
    expect(gone.length).toBe(C.length - season.finale.placements.length);
    expect(new Set(gone).size).toBe(gone.length);
  });
  it('carries the panel rank beside the final rank, so a robbery is in the data', () => {
    const withBend = eps.flatMap(e => e.placements).filter(p => p.panelRank != null && p.finalRank != null);
    expect(withBend.length).toBeGreaterThan(0);
    expect(withBend.some(p => p.panelRank !== p.finalRank)).toBe(true);
  });
  it('records the challenge, the judges and the song', () => {
    for (const e of eps.slice(0, -1)) {
      expect(e.challenge.name).toBeTruthy();
      expect(e.judges.length).toBeGreaterThanOrEqual(3);
      expect(e.lipsync?.song || e.song?.title).toBeTruthy();
    }
  });
});

describe('placements[] and the winner', () => {
  it('is ordered, complete, and uses the show\'s own statuses', () => {
    expect(doc.placements.length).toBe(C.length);
    expect(doc.placements.map(p => p.placement)).toEqual([...doc.placements.map(p => p.placement)].sort((a, b) => a - b));
    expect(doc.placements[0].placement).toBe(1);
    expect(doc.placements[0].status).toBe('Winner');
    expect(doc.placements[1].status).toBe('Runner-up');
    expect(doc.placements[doc.placements.length - 1].status).toBe('Sashayed away');
    for (const p of doc.placements) expect(p.playerSlug).toBeTruthy();
  });
  it('names one winner and invents no tally', () => {
    expect(doc.winner.name).toBe(season.winner);
    expect(doc.winner.runnerUp).toBe(season.runnerUp);
    expect(doc.winner.vote).toBe('');
    expect(doc.winners.length).toBe(1);
    expect(doc.finale.type).toBeTruthy();
    expect(doc.finale.rounds.length).toBeGreaterThan(0);
  });
  it('declares itself', () => {
    expect(doc.format).toBe('drag-race');
    expect(doc.seasonId).toBe('dr-1');
    expect(doc.castSize).toBe(C.length);
    expect(doc.episodeCount).toBe(season.rows.length);
    expect(Array.isArray(doc.votingHistory)).toBe(false);
    expect(doc.weeks).toBeUndefined();
  });
});

describe('career stats', () => {
  it('count what this show has and nothing it does not', () => {
    const s = dragCareerStats(season.rows, season.winner);
    expect(Object.keys(s).sort()).toEqual(['bottoms', 'congeniality', 'highs', 'lipsyncWins', 'lows', 'wins']);
    for (const v of Object.values(s)) expect(Number.isFinite(v)).toBe(true);
    const total = season.rows.reduce((n, r) => n + (r.dr?.call?.win?.length || 0), 0);
    const allWins = C.reduce((n, p) => n + dragCareerStats(season.rows, p.name).wins, 0);
    expect(allWins).toBe(total);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-export.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```js
// js/dr/export.js — the season, as a document (spec §9, manual §5)
//
// THE THIRD ROUND SHAPE. Total Drama exports `votingHistory[]` (ballots),
// Big Brother exports `weeks[]` (a block and a vote). This show has neither:
// a week is a PLACEMENT for every queen, and the departure is decided by one
// person after a lip sync. Reusing either array would have meant either
// inventing ballots or borrowing a layout built around a block — and
// `season_ref.html` decides its whole shape from which array is non-empty,
// so borrowing `weeks` would have drawn a Power of Veto column over a runway.
import { showWords } from '../shows.js';

export const DRAG_FORMAT = 'drag-race';

const slugOf = n => String(n || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
const cap = s => String(s || '').replace(/^./, c => c.toUpperCase());

export function seasonFilePath(seasonNumber) { return `data/seasons/dr-${seasonNumber}-data.json`; }
export function episodeStoreKey(seasonNumber, episode) { return `dr_episode_s${seasonNumber}_e${episode}`; }
export function analyticsKey(seasonNumber) { return `AI_ANALYTICS_dr-${seasonNumber}`; }

/** Everybody who ever walked in, in cast order. */
function castOf(rows) {
  const seen = [];
  for (const r of rows) for (const n of (r.houseAtStart || [])) if (!seen.includes(n)) seen.push(n);
  for (const r of rows) for (const n of Object.keys(r.dr?.record || {})) if (!seen.includes(n)) seen.push(n);
  return seen;
}

const slugFor = (rows, name) => {
  for (const r of rows) {
    const hit = (r.exits || []).find(x => x.name === name);
    if (hit?.slug) return hit.slug;
  }
  return slugOf(name);
};

/**
 * One row per episode, with a cell for EVERY queen — including the ones
 * already gone (`OUT`). A track record chart is a grid, and a grid with holes
 * in it cannot be drawn from a list of only the people who were there.
 */
export function dragEpisodes(rows) {
  const cast = castOf(rows);
  const w = showWords(DRAG_FORMAT);
  const out = [];
  const goneBefore = new Set();
  for (const r of rows) {
    const dr = r.dr || {};
    const call = dr.call || { win: [], high: [], safe: [], low: [], bottom: [] };
    const bend = Object.fromEntries((dr.bend || []).map(b => [b.name, b]));
    const storyline = {};
    for (const s of dr.storylines || []) for (const n of s.players) storyline[n] = s.arc;
    const leaving = new Set((r.exits || []).map(x => x.name));
    const placements = cast.map(name => {
      let result;
      if (dr.finale) {
        result = name === dr.finale.winner ? 'WINNER'
          : (dr.finale.placements || []).includes(name) ? 'FINALIST' : 'OUT';
      } else if (goneBefore.has(name)) result = 'OUT';
      else if (leaving.has(name)) result = 'ELIM';
      else if (call.win.includes(name)) result = 'WIN';
      else if (call.high.includes(name)) result = 'HIGH';
      else if (call.bottom.includes(name)) result = 'BTM';
      else if (call.low.includes(name)) result = 'LOW';
      else result = 'SAFE';
      return { name, playerSlug: slugFor(rows, name), result,
        panelRank: bend[name]?.panelRank ?? null, finalRank: bend[name]?.finalRank ?? null,
        storyline: storyline[name] || null };
    });
    for (const n of leaving) goneBefore.add(n);
    out.push({
      episode: Number(dr.ep ?? r.num),
      challenge: dr.challenge ? { ...dr.challenge } : null,
      mini: dr.mini ? { id: dr.mini.id, name: dr.mini.name, winner: dr.mini.winner } : null,
      judges: [...(dr.judges || [])],
      guest: dr.guest ? { name: dr.guest.name, playerSlug: dr.guest.slug || slugOf(dr.guest.name) } : null,
      runwayCategory: dr.runway?.category || null,
      song: dr.lipsync ? { title: dr.lipsync.song, artist: dr.lipsync.artist } : null,
      placements,
      lipsync: dr.lipsync ? { queens: [...dr.lipsync.queens], winner: dr.lipsync.winner,
        loser: dr.lipsync.loser, call: dr.lipsync.call, song: dr.lipsync.song } : null,
      exits: (r.exits || []).map(x => ({ name: x.name, playerSlug: x.slug || slugOf(x.name),
        verb: x.verb || w.exit, channel: x.channel || 'lipsync' })),
      // THE VOTE FIELD, AND IT IS ALWAYS NULL. This show does not vote. Every
      // reader that means "the vote" is correct to find nothing here; readers
      // that mean "who left" use exits[] through roundExits().
      eliminated: null,
      twists: [...(r.twists || [])],
    });
  }
  return out;
}

export function dragPlacements(rows, { congeniality = null } = {}) {
  const cast = castOf(rows);
  const w = showWords(DRAG_FORMAT);
  const finaleRow = [...rows].reverse().find(r => r.dr?.finale);
  const finale = finaleRow?.dr?.finale;
  const exitOrder = [];
  for (const r of rows) for (const x of (r.exits || [])) exitOrder.push({ name: x.name, verb: x.verb || w.exit, ep: r.num });
  const out = [];
  const finalists = finale?.placements || [];
  finalists.forEach((name, i) => out.push({ name, playerSlug: slugFor(rows, name), placement: i + 1,
    status: i === 0 ? 'Winner' : i === 1 ? 'Runner-up' : 'Finalist' }));
  // Everybody else, latest exit first.
  const rest = exitOrder.slice().reverse();
  let place = finalists.length;
  for (const x of rest) {
    if (out.some(p => p.name === x.name)) continue;
    place += 1;
    out.push({ name: x.name, playerSlug: slugFor(rows, x.name), placement: place, status: cap(x.verb) });
  }
  // Anybody the loop never saw (a cast member with no exit and no finale slot).
  for (const n of cast) {
    if (out.some(p => p.name === n)) continue;
    place += 1;
    out.push({ name: n, playerSlug: slugFor(rows, n), placement: place, status: cap(w.exit) });
  }
  if (congeniality) {
    const row = out.find(p => p.name === congeniality);
    if (row) row.congeniality = true;
  }
  return out.sort((a, b) => a.placement - b.placement);
}

export function dragCareerStats(rows, name) {
  const s = { wins: 0, highs: 0, lows: 0, bottoms: 0, lipsyncWins: 0, congeniality: 0 };
  for (const r of rows) {
    const call = r.dr?.call;
    if (call) {
      if (call.win?.includes(name)) s.wins++;
      if (call.high?.includes(name)) s.highs++;
      if (call.low?.includes(name)) s.lows++;
      if (call.bottom?.includes(name)) s.bottoms++;
    }
    const ls = r.dr?.lipsync;
    if (ls && ls.winner === name) s.lipsyncWins++;
    for (const round of r.dr?.finale?.rounds || []) if (round.winner === name) s.lipsyncWins++;
  }
  return s;
}

export function dragSeasonDetails(rows, seasonNumber, name, placements = dragPlacements(rows)) {
  const p = placements.find(x => x.name === name) || { placement: placements.length, status: '' };
  const dr = dragCareerStats(rows, name);
  return { season: seasonNumber, format: DRAG_FORMAT, placement: p.placement, status: p.status,
    challengeWins: dr.wins, dr };
}

export function buildDragSeasonDocument(rows, { seasonNumber = 1, twists = [], congeniality = null } = {}) {
  const placements = dragPlacements(rows, { congeniality });
  const finaleRow = [...rows].reverse().find(r => r.dr?.finale);
  const finale = finaleRow?.dr?.finale || null;
  const winnerName = finale?.winner || placements[0]?.name || null;
  const runnerUp = finale?.runnerUp || placements[1]?.name || null;
  const winners = winnerName ? [{ name: winnerName, playerSlug: slugFor(rows, winnerName) }] : [];
  return {
    seasonNumber, format: DRAG_FORMAT, seasonId: `dr-${seasonNumber}`,
    castSize: placements.length, episodeCount: rows.length,
    winners,
    // `vote` IS A TALLY and this show holds no vote. Empty rather than
    // borrowed prose: the Traitors put its endgame sentence here and the feed
    // read two numbers out of it as a jury verdict on a show with no jury.
    winner: winnerName ? { name: winnerName, playerSlug: slugFor(rows, winnerName), vote: '', runnerUp } : null,
    placements,
    episodes: dragEpisodes(rows),
    finale: finale ? { type: finale.type, rounds: finale.rounds, placements: finale.placements } : null,
    congeniality,
    twists: [...twists],
  };
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-export.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/dr/export.js tests/dr-export.test.js
git commit -m "feat(drag-race): the season document — episodes[] placement grid, no ballots, no invented tally"
```

---

### Task 2: Registering the real exporter

**Files:**
- Modify: `js/stats-export.js` (replace Plan 1's refusal; add the merge helpers beside the Traitors ones)
- Test: `tests/dr-export-register.test.js`

**Interfaces:**
- Produces:
  - `exportDragRaceSeason(onStatus)` — reads `gs.episodeHistory` (filtered to `format === 'drag-race'`), builds the document, writes `data/seasons/dr-N-data.json` through the same path the other shows use, and updates `seasons_database.json` and `players_database.json` with `seasonDetails[].format = 'drag-race'` stamped on every appearance.
  - `mergeDragSeason(db, doc)` and `mergeDragSeasonsDatabase(db, doc)` mirroring `mergeBigBrotherSeason`.
  - Registration: `registerSeasonExporter('drag-race', exportDragRaceSeason)`.
- The refusal stays for the case that matters: if `gs.episodeHistory` holds no drag rows, throw by name rather than exporting an empty or a Total Drama season.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-export-register.test.js
import { describe, expect, it } from 'vitest';
import { seasonExporterFor, mergeDragSeason, mergeDragSeasonsDatabase } from '../js/stats-export.js';
import { buildDragSeasonDocument } from '../js/dr/export.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 10, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
const doc = buildDragSeasonDocument(playDragSeason({ cast: cast(10, 1), seed: 3 }).rows, { seasonNumber: 1 });

describe('registration', () => {
  it('the drag exporter is not the default show\'s', async () => {
    const fn = seasonExporterFor('drag-race');
    expect(fn).toBeTruthy();
    expect(fn).not.toBe(seasonExporterFor('total-drama'));
  });
  it('refuses by name when there is nothing to export', async () => {
    await expect(seasonExporterFor('drag-race')()).rejects.toThrow(/Drag Race/);
  });
});

describe('merging into the databases', () => {
  it('stamps the format on every appearance', () => {
    const players = { players: [] };
    const out = mergeDragSeason(players, doc);
    const rows = out.players.flatMap(p => p.seasonDetails || []);
    expect(rows.length).toBe(doc.placements.length);
    for (const r of rows) expect(r.format).toBe('drag-race');
    for (const r of rows) expect(r.dr).toBeTruthy();
  });
  it('never merges a drag appearance into a Total Drama career', () => {
    const players = { players: [{ name: 'Q1', slug: 'q1', seasons: [1],
      seasonDetails: [{ season: 1, placement: 4, status: 'Eliminated' }] }] };
    const out = mergeDragSeason(players, doc);
    const q1 = out.players.find(p => p.slug === 'q1');
    expect(q1.seasonDetails.length).toBe(2);
    const td = q1.seasonDetails.find(d => !d.format || d.format === 'total-drama');
    const dr = q1.seasonDetails.find(d => d.format === 'drag-race');
    expect(td.placement).toBe(4);
    expect(dr).toBeTruthy();
    expect(dr).not.toBe(td);
  });
  it('adds one row to seasons_database with the right identity', () => {
    const db = mergeDragSeasonsDatabase({ seasons: [] }, doc);
    const row = db.seasons.find(s => s.format === 'drag-race');
    expect(row.seasonNumber).toBe(1);
    expect(row.seasonId).toBe('dr-1');
    expect(row.winner).toBe(doc.winner.name);
    expect(row.castSize).toBe(doc.castSize);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-export-register.test.js`
Expected: FAIL — `mergeDragSeason` not exported.

- [ ] **Step 3: Implement**

In `js/stats-export.js`, replace `exportDragRaceSeason` with the real builder, following `exportAndFillBigBrotherSeason` for the file-writing and status-callback shape, and add `mergeDragSeason` / `mergeDragSeasonsDatabase` next to their Big Brother counterparts. The three rules to keep:

```js
export async function exportDragRaceSeason(onStatus) {
  const rows = (gs?.episodeHistory || []).filter(r => seasonFormat(r) === 'drag-race');
  if (!rows.length) {
    // Refusing by name, not exporting an empty season or the default show's.
    throw new Error(`${SHOWS['drag-race'].name}: no episodes recorded for this season yet.`);
  }
  const doc = buildDragSeasonDocument(rows, {
    seasonNumber: Number(seasonConfig.seasonNumber) || 1,
    twists: _extractTwists(seasonConfig),
    congeniality: gs.drCongeniality || null,
  });
  ...same write path as the house's...
}
registerSeasonExporter('drag-race', exportDragRaceSeason);
```

`mergeDragSeason` must match an existing player by **slug**, append `dragSeasonDetails(...)` rather than replacing, and never touch a detail row whose `format` differs. That is `_tagSeasonDetail`'s split-brain guard, which knew only Big Brother (manual §14.5): extend it to read the registry instead of naming a show.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/dr-export-register.test.js tests/season-format.test.js tests/dr-export.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/stats-export.js tests/dr-export-register.test.js
git commit -m "feat(drag-race): the real exporter, and a format-aware split-brain guard on appearances"
```

---

### Task 3: The reader sweep — every consumer of a round array

**Files:**
- Modify: `js/shows.js` (`roundsPath`, `roundShape()`), `js/wiki-fill.js` (`roundLedger`), `js/social/live.js`, `js/social/archive.js`, and whatever the sweep finds
- Test: `tests/dr-readers.test.js`

**This is the §14.1 task: the change is not the field, it is every reader.** Before writing code, produce the list:

```bash
grep -rn "\.weeks\b\|votingHistory" --include=*.js --include=*.html . \
  | grep -v node_modules | grep -v "^./tests/" | grep -v "\.claude/"
```

Every hit is a reader that must either handle `episodes`, or be proved not to run for this show. Record the list in the commit message with a verdict per file.

**Interfaces:**
- Produces:
  - `roundShape(format) → 'ballots' | 'weeks' | 'placements'` in `js/shows.js`, declared in the registry entry as `roundShape: 'placements'` for this show. **Every branch that currently asks which array is non-empty asks this instead.**
  - `seasonRounds(gs, format)` already reads `roundsPath`; confirm `'dr.episodes'` resolves, and make the exported document's `episodes` reachable the same way.
  - `roundLedger(doc)` gains the third array: rows come from `doc.episodes` when present; the facts line becomes, for a placement round: the maxi winner, the tops, the bottoms, the lip sync and its song, and the exits through `roundExits()`. No `votes:` line, because there is no ballot.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-readers.test.js
import { describe, expect, it } from 'vitest';
import { roundShape, seasonRounds, roundExits, SHOWS } from '../js/shows.js';
import { roundLedger } from '../js/wiki-fill.js';
import { buildDragSeasonDocument } from '../js/dr/export.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 10, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
const season = playDragSeason({ cast: cast(10, 5), seed: 9 });
const doc = buildDragSeasonDocument(season.rows, { seasonNumber: 1 });

describe('the registry answers the shape question', () => {
  it('every show declares one, and they are the three that exist', () => {
    for (const [fmt, s] of Object.entries(SHOWS)) {
      expect(['ballots', 'weeks', 'placements'], `${fmt}`).toContain(roundShape(fmt));
      void s;
    }
    expect(roundShape('drag-race')).toBe('placements');
    expect(roundShape('big-brother')).toBe('weeks');
    expect(roundShape('total-drama')).toBe('ballots');
    expect(roundShape('nonsense')).toBe('ballots');   // the default show's
  });
});

describe('roundLedger reads the third array', () => {
  const rows = roundLedger(doc);
  it('produces one entry per episode, named in the show\'s word', () => {
    expect(rows.length).toBe(doc.episodes.length);
    expect(rows[0].label || rows[0].title || '').toMatch(/Episode/i);
  });
  it('states what happened without inventing a vote', () => {
    const text = rows.map(r => (r.facts || []).join(' ')).join(' ');
    expect(text).not.toMatch(/votes:/);
    expect(text).toMatch(/won the maxi challenge|lip sync/i);
    expect(foreignWordsIn(text, 'drag-race')).toEqual([]);
  });
  it('names who left, with this show\'s verb', () => {
    const withExit = rows.filter(r => (r.facts || []).some(f => /sashayed away/.test(f)));
    expect(withExit.length).toBeGreaterThan(0);
  });
});

describe('roundExits on a placement round', () => {
  it('reads exits[] and never falls back to eliminated', () => {
    for (const e of doc.episodes) {
      const x = roundExits(e, 'drag-race');
      expect(x.length).toBe(e.exits.length);
      for (const one of x) { expect(one.verb).toBe('sashayed away'); expect(one.channel).toBe('lipsync'); }
    }
  });
});

describe('seasonRounds finds the live array', () => {
  it('resolves dr.episodes off gs', () => {
    const gs = { dr: { episodes: season.rows } };
    expect(seasonRounds(gs, 'drag-race').length).toBe(season.rows.length);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-readers.test.js`
Expected: FAIL — `roundShape` not exported.

- [ ] **Step 3: Implement**

Add to `js/shows.js`:

```js
/**
 * WHICH SHAPE THIS SHOW'S ROUNDS ARE IN, declared rather than guessed.
 *
 * Three exist: `ballots` (Total Drama and The Traitors, a votingHistory[] of
 * who wrote whose name), `weeks` (Big Brother, a block and a vote), and
 * `placements` (Drag Race, a grid of results with no ballot anywhere).
 *
 * Every screen that used to ask "is `weeks` non-empty?" asks this. That
 * question was a two-show world wearing a boolean: `season_ref.html` sets
 * `hasBlock = bbWeeks.length > 0` and decides its ENTIRE layout from it, so a
 * third show exporting `weeks` would have been drawn a Power of Veto column,
 * and a fourth exporting neither array was drawn nothing at all.
 */
export function roundShape(format) {
  return SHOWS[format]?.roundShape || SHOWS[DEFAULT_FORMAT].roundShape || 'ballots';
}
```

and `roundShape: 'placements'` to the drag entry, `'weeks'` to Big Brother, `'ballots'` to Total Drama and The Traitors.

In `roundLedger`, take the rows from `doc.episodes` when the shape is `placements`, and build the facts from the placement round:

```js
    if (shape === 'placements') {
      const call = { win: [], high: [], low: [], btm: [] };
      for (const p of r.placements || []) {
        if (p.result === 'WIN') call.win.push(p.name);
        else if (p.result === 'HIGH') call.high.push(p.name);
        else if (p.result === 'LOW') call.low.push(p.name);
        else if (p.result === 'BTM' || p.result === 'ELIM') call.btm.push(p.name);
      }
      if (r.challenge?.name) facts.push(`the maxi challenge was ${r.challenge.name}`);
      if (call.win.length) facts.push(`${call.win.join(' and ')} won the maxi challenge`);
      if (call.high.length) facts.push(`high: ${call.high.join(', ')}`);
      if (call.low.length) facts.push(`low: ${call.low.join(', ')}`);
      if (r.lipsync) facts.push(`${r.lipsync.queens.join(' and ')} lip synced to "${r.lipsync.song}"`);
      if (r.runwayCategory) facts.push(`the runway category was ${r.runwayCategory}`);
    }
```

leaving the ballot branch untouched. The exits clause below it already reads `roundExits()`, which needs no change.

In `js/social/live.js` and `js/social/archive.js`: both iterate rounds and read ballots. Gate the ballot reading on `roundShape(format) !== 'placements'`, and give the placement shape its own event derivation (a win, a bottom two, a lip sync, an exit). **This is where the Traitors bug lived** — the archive rendered private ballots because it iterated without asking — so the shape check goes at the top of the loop, not inside a branch.

- [ ] **Step 4: Run the sweep and the tests**

Run the grep from the task header, resolve every hit, then:
`npx vitest run tests/dr-readers.test.js tests/show-vocabulary.test.js tests/show-list-duplication.test.js tests/tr-export.test.js tests/wiki.test.js`
Expected: PASS. The duplication guard's ternary count must not have gone up.

- [ ] **Step 5: Commit**

```bash
git add js/shows.js js/wiki-fill.js js/social tests/dr-readers.test.js
git commit -m "feat(drag-race): roundShape() replaces the which-array-is-non-empty question; the ledger and feed learn placements"
```

---

### Task 4: The season page's Wiki tab

**Files:**
- Modify: `season_ref.html` (the six branches, ~lines 843–1300)
- Test: `tests/e2e/dr-season-page.spec.js` (Playwright, against real published data) and `tests/dr-season-page.test.js` (jsdom, against a fixture)

**Interfaces:**
- The tab must render, for a `placements` season: the memory wall, the **track record grid** (this show's version of the voting grid — the same builder Plan 5's VP uses, so there is one grid in the codebase), the competition history (maxi wins, lip syncs), the game history, the trivia, and the season facts box.
- The five things that must NOT draw: the block column, the veto column, the nominations row, the jury ballots block, the vote tally.
- `hasBlock` becomes `roundShape(format) === 'weeks'`. Every other `bbWeeks.length` test in the file becomes a `roundShape` test. **This removes a hoisted two-show boolean the duplication guard counts** (manual §14.4), so its count goes down in this commit.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-season-page.test.js
// @vitest-environment jsdom
//
// The season page is 3,000 lines of inline script, so this drives the ONE
// function that decides the tab's shape rather than loading the page: the
// builder is extracted in step 3 for exactly that reason.
import { describe, expect, it } from 'vitest';
import { buildWikiTab } from '../js/season-wiki-tab.js';
import { buildDragSeasonDocument } from '../js/dr/export.js';
import { buildBigBrotherSeasonDocument } from '../js/stats-export.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 11, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
const doc = buildDragSeasonDocument(playDragSeason({ cast: cast(11, 3), seed: 4 }).rows, { seasonNumber: 1 });
const html = buildWikiTab(doc);

describe('the drag season page', () => {
  it('draws a track record grid with a cell per queen per episode', () => {
    expect(html).toMatch(/track-record|trackRecord/);
    for (const p of doc.placements) expect(html, `${p.name} missing`).toContain(p.name);
    const cells = (html.match(/data-result="/g) || []).length;
    expect(cells).toBe(doc.placements.length * doc.episodes.length);
  });
  it('draws no block, no veto, no nominations, no jury, no tally', () => {
    for (const gone of ['Power of Veto', 'On the block', 'Head of Household', 'Nominated', 'Jury', 'votes:']) {
      expect(html, `${gone} drawn over a runway`).not.toContain(gone);
    }
  });
  it('speaks this show\'s words only', () => {
    expect(foreignWordsIn(html.replace(/<[^>]+>/g, ' '), 'drag-race')).toEqual([]);
    expect(html).toMatch(/maxi challenge/i);
    expect(html).toMatch(/sashayed away/i);
  });
  it('states the season facts without a week count', () => {
    expect(html).toMatch(/Episodes/);
    expect(html).not.toMatch(/>Weeks</);
  });
  it('still draws a house correctly', () => {
    const bb = buildBigBrotherSeasonDocument
      ? buildWikiTab({ format: 'big-brother', seasonNumber: 1, placements: [{ name: 'A', playerSlug: 'a', placement: 1, status: 'Winner' }],
        weeks: [{ week: 1, hoh: 'A', initialNominees: ['B'], vetoWinner: 'A', evicted: 'B', votes: { B: 3 } }] })
      : '';
    expect(bb).toContain('Head of Household');
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-season-page.test.js`
Expected: FAIL — `js/season-wiki-tab.js` does not exist.

- [ ] **Step 3: Extract the builder, then teach it the third shape**

`season_ref.html`'s Wiki tab is an inline script that cannot be tested or reused. Extract the tab builder into `js/season-wiki-tab.js` exporting `buildWikiTab(doc)`, and have the page call it. Keep the extraction mechanical — move, do not rewrite — then make these changes inside it:

1. `const shape = roundShape(doc.format);` replaces `const hasBlock = bbWeeks.length > 0;`, and `hasBlock` becomes `shape === 'weeks'`.
2. `const rounds = shape === 'placements' ? doc.episodes : (bbWeeks.length ? bbWeeks : tdRounds);`
3. The grid: for `placements`, draw the track record chart from `js/dr/grid.js` (Plan 5 Task 2 creates it; if Plan 5 has not run yet, create `js/dr/grid.js` in this task with `buildTrackRecordGrid(doc) → html` and Plan 5 imports it — **one builder, three readers**, per the spec).
4. Competition history: for `placements`, maxi wins and lip sync wins per queen, from `episodes[].placements` and `episodes[].lipsync`.
5. The facts box: `Episodes` always; `Weeks` only when `shape === 'weeks'`.
6. Trivia: the drag lines come from the show's own vocabulary — "won N maxi challenges", "was in the bottom N times", "never sashayed away", "won every lip sync she was in". **No sentence generated here may be false on another show**, which is the trap this file has now sprung twice.

- [ ] **Step 4: The e2e arm**

Add the published drag season to `tests/e2e/show-pages.spec.js`'s per-show list (it already runs one season per show that has rounds). It will only pass after Task 8 publishes one; leave it and let Task 8 turn it green.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/dr-season-page.test.js tests/show-list-duplication.test.js tests/show-vocabulary.test.js`
Expected: PASS, and the duplication guard's ternary/boolean count is LOWER than before this commit. Record the before and after numbers in the commit message.

- [ ] **Step 6: Commit**

```bash
git add season_ref.html js/season-wiki-tab.js js/dr/grid.js tests/dr-season-page.test.js
git commit -m "feat(drag-race): the season page reads roundShape, not which array was non-empty"
```

---

### Task 5: The character article and the career dossier

**Files:**
- Modify: `js/wiki-view.js` (the per-season block, the round grid's cell rules), `js/wiki.js` (`_weekRowsFromDoc`)
- Test: `tests/dr-article.test.js`

**Interfaces:**
- `_weekRowsFromDoc(found, name)` gains a third branch: for a `placements` document, one row per episode with `{ episode, result, challenge, note }`, running to the LAST episode where the queen's result is not `OUT` (the same rule the Battle Back fix established — do not stop at the first exit).
- `js/wiki-view.js`'s infobox per-season block shows, for a drag season: placement, status, maxi wins, lip syncs won, times in the bottom — from `seasonDetails[].dr`, via the registry's `articleStats` (Plan 1 already declared them, so this is a wiring check rather than a new map).
- The round grid's cell rules gain the six drag results with their conventional colours: WIN gold, HIGH light blue, SAFE grey, LOW orange, BTM red, ELIM dark red, OUT blank, WINNER crown, FINALIST band.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-article.test.js
import { describe, expect, it } from 'vitest';
import { renderArticle } from '../js/wiki-view.js';
import { buildDossier } from '../js/wiki.js';
import { buildDragSeasonDocument } from '../js/dr/export.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 10, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: ['f', 'nb'][i % 2],
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
const season = playDragSeason({ cast: cast(10, 7), seed: 2 });
const doc = buildDragSeasonDocument(season.rows, { seasonNumber: 1 });
const winner = doc.placements[0], booted = doc.placements[doc.placements.length - 1];

const playerFor = p => ({ id: p.playerSlug, name: p.name,
  seasonDetails: [{ season: 1, format: 'drag-race', placement: p.placement, status: p.status,
    challengeWins: 1, dr: { wins: 1, highs: 2, lows: 1, bottoms: 1, lipsyncWins: 0, congeniality: 0 } }],
  story: 'They arrived early, made themselves useful, and stayed useful.' });

describe('the character article', () => {
  it('describes a winner and a boot in this show\'s words', () => {
    for (const p of [winner, booted]) {
      const html = renderArticle(playerFor(p), { docs: [doc] });
      const text = html.replace(/<[^>]+>/g, ' ');
      expect(foreignWordsIn(text, 'drag-race'), p.name).toEqual([]);
      expect(text).toContain(p.name);
    }
  });
  it('says sashayed away, never evicted or voted out', () => {
    const text = renderArticle(playerFor(booted), { docs: [doc] }).replace(/<[^>]+>/g, ' ');
    expect(text).toMatch(/sashayed away/i);
    expect(text).not.toMatch(/evicted|voted out|banished/i);
  });
  it('the infobox counts maxi wins and lip syncs, not immunity', () => {
    const html = renderArticle(playerFor(winner), { docs: [doc] });
    expect(html).toMatch(/Maxi challenge wins/i);
    expect(html).toMatch(/Lip syncs won/i);
    expect(html).not.toMatch(/Immunity/i);
  });
});

describe('the career grid', () => {
  it('runs to the queen\'s last episode, not the first blank', () => {
    const d = buildDossier({ name: winner.name, id: winner.playerSlug,
      seasonDetails: [{ season: 1, format: 'drag-race', placement: 1, status: 'Winner' }] }, { docs: [doc] });
    const rows = d.seasons?.[0]?.weekRows || d.weekRows || [];
    expect(rows.length).toBe(doc.episodes.length);
    expect(rows[rows.length - 1].result).toMatch(/WINNER|WIN/);
  });
  it('a queen who left mid-season has OUT cells after her exit, not missing rows', () => {
    const d = buildDossier({ name: booted.name, id: booted.playerSlug,
      seasonDetails: [{ season: 1, format: 'drag-race', placement: booted.placement, status: booted.status }] }, { docs: [doc] });
    const rows = d.seasons?.[0]?.weekRows || d.weekRows || [];
    const elim = rows.findIndex(r => r.result === 'ELIM');
    expect(elim).toBeGreaterThanOrEqual(0);
    for (const r of rows.slice(elim + 1)) expect(r.result).toBe('OUT');
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-article.test.js`
Expected: FAIL — the grid has no placements branch.

- [ ] **Step 3: Implement**

Both files already branch per round shape; add the third branch to each, reading `roundShape(doc.format)` rather than testing an array. In `js/wiki-view.js`, add the six result classes to the cell rules with the community's colours, and take the per-season stat rows from `articleStats` in the registry (already declared) rather than adding a map.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/dr-article.test.js tests/wiki.test.js tests/show-vocabulary.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/wiki-view.js js/wiki.js tests/dr-article.test.js
git commit -m "feat(drag-race): the article and career grid read the placement shape"
```

---

### Task 6: The rankings board

**Files:**
- Modify: `js/rankings-update.js` (a `'drag-race'` config), `js/ranking-boards.js` (`rankings_dr.json`), `player.html` (already registry-driven — verify)
- Test: `tests/dr-rankings.test.js`

**Interfaces:**
- The board's currencies, chosen against the manual §14.9 warning that a count of anything a longer run accumulates is placement measured twice:
  - `comp1` **Maxi wins**, weight `1.4` — the show's own currency, and a win is not available to somebody who left.
  - `comp2` **Lip syncs won**, weight `1.1` — surviving the bottom is this show's veto: won under pressure, and it says little about where you finished.
  - `comp3` **Highs**, weight `0.4` — thin on purpose; it accumulates with rounds survived.
  - `adv` — **absent**. This show has no advantage lifecycle, and an empty column contributes nothing rather than a penalty (the Traitors' `strategic` column precedent).
  - A **penalty** column: `bottoms`, weight `−0.5`, which is the one currency that runs the other way and is what separates a queen who cruised from one who was saved four times.
- `_drBoardStats(doc, name)` in `js/dr/export.js` returns those four numbers, and `js/rankings-update.js` reads them through the same per-format config shape the other shows use.
- **Density must be reported beside the correlation** (§14.9): the test prints how many player-seasons each column is non-zero for.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-rankings.test.js
import { describe, expect, it } from 'vitest';
import { BOARD_FILES } from '../js/ranking-boards.js';
import { RANKING_CONFIG } from '../js/rankings-update.js';
import { buildDragSeasonDocument, dragBoardStats } from '../js/dr/export.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 12, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}

describe('the board', () => {
  it('has its own file, never the default show\'s', () => {
    expect(BOARD_FILES['drag-race']).toBe('rankings_dr.json');
    expect(BOARD_FILES['drag-race']).not.toBe(BOARD_FILES['total-drama']);
  });
  it('prices the show\'s own currencies and no advantage lifecycle', () => {
    const c = RANKING_CONFIG['drag-race'];
    expect(c.comp1.label).toMatch(/maxi/i);
    expect(c.comp2.label).toMatch(/lip sync/i);
    expect(c.comp1.weight).toBeGreaterThan(c.comp3.weight);
    expect(c.adv).toBeFalsy();
    expect(c.penalty.weight).toBeLessThan(0);
  });
});

describe('the currencies, measured', () => {
  const docs = Array.from({ length: 20 }, (_, s) =>
    buildDragSeasonDocument(playDragSeason({ cast: cast(12, 300 + s), seed: s }).rows, { seasonNumber: s + 1 }));
  const rows = docs.flatMap(d => d.placements.map(p => ({ placement: p.placement, ...dragBoardStats(d, p.name) })));

  const corr = key => {
    const xs = rows.map(r => r[key]), ys = rows.map(r => r.placement);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
    const cov = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
    const sx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0)), sy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0));
    return sx && sy ? cov / (sx * sy) : 0;
  };
  const density = key => rows.filter(r => r[key] > 0).length / rows.length;

  it('reports correlation AND density for each column', () => {
    for (const k of ['maxiWins', 'lipsyncWins', 'highs', 'bottoms']) {
      console.log(`${k.padEnd(12)} r=${corr(k).toFixed(3)}  density=${(density(k) * 100).toFixed(0)}%`);
    }
    // Nothing may be placement measured twice: the -0.924 case from the manual.
    for (const k of ['maxiWins', 'lipsyncWins', 'highs']) {
      expect(Math.abs(corr(k)), `${k} is placement wearing a hat`).toBeLessThan(0.85);
    }
    // A column nobody ever scores is decoration.
    for (const k of ['maxiWins', 'lipsyncWins', 'bottoms']) {
      expect(density(k), `${k} fires for nobody`).toBeGreaterThan(0.05);
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-rankings.test.js`
Expected: FAIL — no `drag-race` entry.

- [ ] **Step 3: Implement**

Add `dragBoardStats(doc, name) → { maxiWins, lipsyncWins, highs, bottoms }` to `js/dr/export.js`, `'drag-race': 'rankings_dr.json'` to `BOARD_FILES`, and the config to `js/rankings-update.js` following the Traitors entry's shape, with the weights above and a comment carrying the measured correlation and density from Step 2's printout. **Write the real measured numbers into the comment, not the expected ones.**

- [ ] **Step 4: Run the tests, read the printout**

Run: `npx vitest run tests/dr-rankings.test.js`
Expected: PASS. Read the four printed lines: if `maxiWins` correlates past `−0.8`, the column is placement in disguise and its weight must come down.

- [ ] **Step 5: Commit**

```bash
git add js/rankings-update.js js/ranking-boards.js js/dr/export.js tests/dr-rankings.test.js
git commit -m "feat(drag-race): the ranking board — maxi wins, lip syncs, a bottoms penalty, with measured density"
```

---

### Task 7: Publish

**Files:**
- Modify: `worker/worker-studio.js` (the publish validator), `serve.py` (the local write path)
- Test: `tests/dr-publish.test.js`

**Interfaces:**
- `POST /api/publish-season` accepts `format: 'drag-race'` because it validates against the registry, which already knows it. **Verify rather than assume**: the endpoint's format check is a registry read in one place and a literal list in another; find both.
- The file lands at `data/seasons/dr-1-data.json`; `seasons_database.json` gains a row with `format: 'drag-race'`; `players_database.json` appearances carry `format`.
- D1: `seasons` and `appearances` are keyed `(format, season_number)` already; confirm the insert path passes the format rather than defaulting it.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-publish.test.js
//
// A source-and-shape guard: the worker is Cloudflare-bound, so this proves the
// validator knows the format and the document satisfies what publish demands.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SHOWS } from '../js/shows.js';
import { buildDragSeasonDocument } from '../js/dr/export.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const worker = readFileSync('worker/worker-studio.js', 'utf8');
const serve = readFileSync('serve.py', 'utf8');
const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 10) {
  const rng = rngFor(1); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
const doc = buildDragSeasonDocument(playDragSeason({ cast: cast(), seed: 1 }).rows, { seasonNumber: 1 });

describe('publish', () => {
  it('validates the format against the registry, not a literal list', () => {
    expect(worker).not.toMatch(/\['total-drama', *'big-brother'\]/);
    expect(worker).toMatch(/SHOWS|KNOWN_FORMATS|registry/);
  });
  it('the document carries everything publish demands', () => {
    for (const k of ['seasonNumber', 'format', 'seasonId', 'placements', 'winner', 'twists']) {
      expect(doc[k], `missing ${k}`).toBeDefined();
    }
    for (const p of doc.placements) {
      expect(p.name).toBeTruthy(); expect(p.playerSlug).toBeTruthy();
      expect(Number.isFinite(p.placement)).toBe(true); expect(p.status).toBeTruthy();
    }
    expect(doc.episodes.length).toBeGreaterThan(0);
  });
  it('the file path and the registry agree', () => {
    expect(doc.seasonId).toBe(`${SHOWS['drag-race'].prefix}-1`);
  });
  it('serve.py can write a dr season', () => {
    expect(serve).toMatch(/seasons|publish/);
    expect(serve).not.toMatch(/td-\{|season\{n\}-data/);
  });
});
```

- [ ] **Step 2: Run it, fix what it names**

Run: `npx vitest run tests/dr-publish.test.js`
Expected: it names whichever half of the validator holds a literal list. Replace that list with a registry read.

- [ ] **Step 3: Commit**

```bash
git add worker/worker-studio.js serve.py tests/dr-publish.test.js
git commit -m "feat(drag-race): publish validates against the registry, and accepts a dr season"
```

---

### Task 8: Play one, publish it, and read every page

**Files:** none new; this is the manual's step 6, and nothing replaces it.

- [ ] **Step 1: Play a full season in the browser**

`python serve.py`, open `simulator.html`, Drag Race, 13 queens from the roster, set a timeline with all six tentpoles pinned, play to the crown.

- [ ] **Step 2: Export and publish it**

Use the export button. Confirm on disk: `data/seasons/dr-1-data.json` exists, carries `format: 'drag-race'`, `episodes[]` with a full grid, `placements[]` with 13 rows, `winner` with an empty `vote`, and no `weeks` or `votingHistory` key.

- [ ] **Step 3: Open every page and read it**

| Page | What must be true |
|---|---|
| `season_ref.html?season=dr-1` | the track record grid draws, no block/veto/jury, the facts box says Episodes |
| the Wiki tab | every round line reads as this show; no "votes:" |
| a winner's article | crowned, maxi wins, lip syncs, no immunity |
| a mid-boot's article | "sashayed away", grid ends with OUT cells |
| `player.html?p=<slug>` | the drag season appears with the right icon and accent |
| the social feed | posts about wins, bottoms and lip syncs; nothing about a vote |
| `rankings.html?show=drag-race` | either the board or an honest "not ranked yet" |
| `franchise.html`, `seasons.html`, `compare.html`, `leaderboards.html` | the show is listed with its own name and emoji |

Write what you find into `docs/drag-race-season-read.md` (the file Plan 3 Task 9 started), and fix it.

- [ ] **Step 4: Run the whole show-guard set**

Run:
```
npx vitest run tests/dr-export.test.js tests/dr-export-register.test.js tests/dr-readers.test.js tests/dr-season-page.test.js tests/dr-article.test.js tests/dr-rankings.test.js tests/dr-publish.test.js tests/show-vocabulary.test.js tests/show-list-duplication.test.js tests/season-format.test.js tests/ratings.test.js
npx playwright test tests/e2e/show-pages.spec.js
```
Expected: all PASS, including the e2e arm that was waiting for real data.

- [ ] **Step 5: Commit and push**

```bash
git add data/seasons/dr-1-data.json seasons_database.json players_database.json docs/drag-race-season-read.md
git commit -m "feat(drag-race): first season published, and the page-by-page read that followed"
git push
```

---

## Self-review against the spec

- §9's export shape: Task 1, with `eliminated: null` and `exits[]` as the spec demands. Registration and the database merges: Task 2. The reader sweep the manual's §14.1 asks for: Task 3, which also replaces the hoisted two-show boolean §14.4 names. The screens in §10 and the manual's §6 table: Tasks 4–6. Publish: Task 7. The manual's step 6, playing and publishing one season before the screens are trusted: Task 8.
- Deferred to Plan 5: the VP screens and the interactive version of the track record chart. `js/dr/grid.js` is created here because the season page needs it first, and Plan 5 imports the same builder — one grid, three readers.
- Deferred to Plan 6: `readSignals`, the AI episode prompt, the ratings calibration, and the final measurement table.
- Type consistency: `episodes[].placements[].result` uses the same nine values as `state.record`; `roundShape()` is the only shape question anywhere; `dragBoardStats` and `dragCareerStats` are separate on purpose — the board prices what it prices, the career counts what happened.
