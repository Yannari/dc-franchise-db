# All Stars — pass 1 (the spine) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking. (This repo's owner has a standing instruction: **work inline, no
> subagents.** Do not dispatch subagent-driven development for this plan.)

**Goal:** Make All Stars a playable season shape on Drag Race: a returning cast
who arrive with a past, and a weekly rule where the top two lip sync and the
winner chooses who goes home.

**Architecture:** A mode flag plus a rule dropdown (`drAllStars`,
`drAllStarsRule`) on the existing setup screen. The mode fills in each queen's
past and craft at cast time and flips `cfg.legacy` for every week, which the
engine already resolves. The decision itself moves out of an inline ternary in
`week.js` into a pure `js/dr/legacy.js`, reading a shared power ledger extracted
from `js/dr/saves.js`, and the lipstick ceremony renders what it returns.

**Tech Stack:** ES modules, no build step. Vitest (`npx vitest run <file>`).
Browser check via `python serve.py 8080` (already running as a background task —
do not start a second one).

**Spec:** `docs/superpowers/specs/2026-09-08-drag-race-all-stars-design.md`
(revised 2026-09-17). Read it before Task 1; every task argues from it.

## Global Constraints

- **THERE IS NO VOTE.** No ballot, no numbers, no bloc that delivers an outcome.
  One queen decides, alone. Any sentence or reader implying otherwise is a bug.
  (The Jury of Queer Peers is pass 2 and is the one documented exception: queens
  already eliminated, choosing who competes, ending nobody.)
- **The three-step rule holds:** what she did → what the panel thought → what
  somebody decided. The decision is computed before any prose exists; prose
  renders it. A ceremony that could change the target is a second source of truth.
- **Valid stats, exactly these nine:** `physical`, `endurance`, `mental`,
  `social`, `strategic`, `loyalty`, `boldness`, `intuition`, `temperament`.
- **Valid drag craft, exactly these seven** (on `player.drag`): `acting`,
  `comedy`, `dance`, `design`, `runway`, `lipsync`, `singing`.
- **Stats are proportional:** `stat * factor`, never `if (stat >= X)` for
  gameplay. Thresholds only for choosing narrative text.
- **`player.drag.style` and `player.drag.voice` are AUTHORED** — used only when
  a human set them, never inferred. Derived *numbers* are fine; a derived voice
  is a character the franchise has never met.
- **Archetype rules unchanged:** nice archetypes (`hero`, `loyal-soldier`,
  `social-butterfly`, `showmancer`, `underdog`, `goat`) never scheme or sabotage;
  neutrals need `strategic >= 6 && loyalty <= 4`. They all still *eliminate* —
  even a nice queen wants to win — they just reach for a different reason.
- **A scene must be pushed after its own marker.** `sceneSections` files scenes
  by array position; getting this wrong left "Elimination Day" empty on eight
  episodes of nine.
- **Every new screen follows `docs/ADDING-A-SHOW.md` §6.5** (the pinned stage:
  one state per reveal step, `wireStage`, nothing lit at rest, alphabetical
  lines, room at the start of the night).
- **Commit in the worktree** `C:\Users\yanna\OneDrive\Documents\GitHub\worktree-drag-race`
  on branch `drag-race`, then sync `main` (see the sync block in Task 12).
- Commit messages end with:
  `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`
- **Do not run the whole suite.** Name the affected files. Audits are excluded
  from `npm test` and run through `npm run audit:dr-spec`.

---

## File Structure

**Created**

| file | responsibility |
|---|---|
| `js/dr/past.js` | What a queen already did: her original season, rank, wins, how she went out, her unfinished business — read from a stored season or invented deterministically. Also derives a craft block for a queen nobody authored. Pure. |
| `js/dr/power.js` | The power ledger, extracted from `saves.js`: who has been spared, who owes whom, promises made and broken, grudges. Written by both the save and the legacy choice. Pure. |
| `js/dr/legacy.js` | The decision: given the song's winner and the bottom, who goes home and *why*. Pure, called before any prose. |
| `js/dr/data/legacy-beats.js` | The ceremony's lines: the deliberation, the reveal, the room's answer, and her last words (she never performed, so `sashay-words` does not fit her). |
| `js/vp-dr/legacy-stage.js` | The lipstick wall: tubes standing with the bottom queens' names, the chosen one turning around. A pinned stage per §6.5. |
| `tests/dr-past.test.js` | Task 1. |
| `tests/dr-all-stars.test.js` | Tasks 2, 3, 5, 8 — the mode end to end. |
| `tests/dr-legacy.test.js` | Tasks 6, 7, 9 — the decision and its scenes. |

**Modified**

| file | change |
|---|---|
| `js/core.js:1715` | `drAllStars` / `drAllStarsRule` defaults. |
| `simulator.html:825` | The dropdown, beside the finale shape. |
| `js/cast-ui.js:1313`, `:1491` | Collect and restore the two keys. |
| `js/dr/season.js:511` (`weekCfg`), `:1112` (`playDragSeason`) | Flip `legacy` from the mode; fill pasts and craft at cast time. |
| `js/dr/week.js:829`, `:1437`, `:1537` | Call `legacy.js` instead of the inline ternary; record `BTM2`/`BTM3` for the spared. |
| `js/dr/grid.js:51` | `BTM3`; labels derived from the season's shape. |
| `js/dr/saves.js:202` | Re-export the ledger from `power.js` (behaviour-preserving). |
| `js/dr/arrivals.js:83` | The entrance reads her past. |
| `js/vp-dr/screens.js` | The ceremony's section and its stage. |
| `js/stats-export.js:2422` | Craft write-back onto the appearance. |
| `docs/drag-race.md` | The mode, the chart's new row, TODO item 7. |
| `tests/dr-spec-audit.test.js` | The All Stars measurements. |

---

## Task 1: `js/dr/past.js` — a queen with a past

**Files:**
- Create: `js/dr/past.js`
- Test: `tests/dr-past.test.js`

**Interfaces:**
- Consumes: `dragOf`, `DRAG_STATS` from `js/dr/queen.js`; `rngFor` from `js/dr/rng.js`.
- Produces:
  - `queenPast(player, { seasons = [], rng }) -> { real, season, rank, of, wins, exit, business }`
  - `derivedCraft(player) -> { acting, comedy, dance, design, runway, lipsync, singing }`
  - `castPasts({ cast, seasons = [], seed }) -> { [name]: past }`
  - `craftIsFlat(player) -> boolean`

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-past.test.js
// ══════════════════════════════════════════════════════════════════════
// tests/dr-past.test.js — what a queen already did (js/dr/past.js)
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { queenPast, derivedCraft, castPasts, craftIsFlat } from '../js/dr/past.js';
import { DRAG_STATS } from '../js/dr/queen.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

function queen(name, over = {}) {
  return {
    name, slug: name.toLowerCase(), archetype: 'wildcard', age: 28,
    stats: Object.fromEntries(STATS.map((k, i) => [k, ((i * 3 + name.length) % 10) + 1])),
    ...over,
  };
}

describe('an invented past', () => {
  it('is the same past every time, for the same queen and seed', () => {
    const a = castPasts({ cast: [queen('Ripper'), queen('Brightly')], seed: 7 });
    const b = castPasts({ cast: [queen('Ripper'), queen('Brightly')], seed: 7 });
    expect(a).toEqual(b);
    expect(a.Ripper.real).toBe(false);
  });

  it('never makes her a former winner — only a real season can do that', () => {
    for (let s = 1; s <= 40; s++) {
      const p = castPasts({ cast: [queen(`Q${s}`)], seed: s })[`Q${s}`];
      expect(p.rank).toBeGreaterThan(1);
    }
  });

  it('gives her a season, a field size her rank fits in, and unfinished business', () => {
    const p = castPasts({ cast: [queen('Ripper')], seed: 3 }).Ripper;
    expect(p.season).toBeGreaterThan(0);
    expect(p.rank).toBeLessThanOrEqual(p.of);
    expect(typeof p.business).toBe('string');
    expect(p.business.length).toBeGreaterThan(0);
  });
});

describe('a real past', () => {
  const seasons = [{
    season: 1,
    placements: [
      { name: 'Ripper', place: 1, wins: 3 },
      { name: 'Brightly', place: 2, wins: 1 },
      { name: 'MK', place: 3, wins: 0 },
    ],
  }];

  it('is read from the stored season, winner and all', () => {
    const p = queenPast(queen('Ripper'), { seasons });
    expect(p).toMatchObject({ real: true, season: 1, rank: 1, of: 3, wins: 3 });
  });

  it('beats an invented one', () => {
    const p = castPasts({ cast: [queen('Ripper'), queen('Nobody')], seasons, seed: 5 });
    expect(p.Ripper.real).toBe(true);
    expect(p.Nobody.real).toBe(false);
  });
});

describe('derived craft', () => {
  it('is never flat — seven fives is not a queen', () => {
    for (let i = 0; i < 30; i++) {
      const d = derivedCraft(queen(`Q${i}`));
      const vals = DRAG_STATS.map(k => d[k]);
      expect(new Set(vals).size).toBeGreaterThan(1);
      for (const v of vals) { expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(10); }
    }
  });

  it('is deterministic', () => {
    expect(derivedCraft(queen('Ripper'))).toEqual(derivedCraft(queen('Ripper')));
  });

  it('spots the flat default block it exists to prevent', () => {
    expect(craftIsFlat({ name: 'X' })).toBe(true);
    expect(craftIsFlat({ name: 'X', drag: Object.fromEntries(DRAG_STATS.map(k => [k, 5])) })).toBe(true);
    expect(craftIsFlat({ name: 'X', drag: { ...Object.fromEntries(DRAG_STATS.map(k => [k, 5])), dance: 9 } })).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-past.test.js`
Expected: FAIL — `Failed to resolve import "../js/dr/past.js"`.

- [ ] **Step 3: Write the module**

```js
// js/dr/past.js
// ══════════════════════════════════════════════════════════════════════
// dr/past.js — what she already did, before this season
// ══════════════════════════════════════════════════════════════════════
//
// All Stars' premiere is the one episode of this show that is NOT an
// introduction. Nobody is meeting anybody: the room already knows who won
// what, who went home first, and who has something to prove. So every queen
// needs an answer to one question before the door opens.
//
// ── REAL WHEN IT EXISTS, INVENTED WHEN IT DOES NOT ────────────────────
//
// There are thirteen drag alumni in this franchise and all of them come from
// `dr-1`. A real-history-only rule would mean All Stars could never be
// anything but season one run again, so a queen with no history gets one
// written for her — deterministically, from her stats and the season's seed,
// and FROZEN onto the season by `castPasts` so it cannot drift between a
// replay, a screen and an article.
//
// An invented past caps at runner-up. A former winner changes the room's
// reaction and the threat read sharply, and inventing one is a strong claim
// about a queen the franchise may yet actually play; only a stored season
// makes a winner.
import { DRAG_STATS, dragOf } from './queen.js';
import { rngFor } from './rng.js';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const stat = (p, k) => {
  const n = Number(p?.stats?.[k]);
  return Number.isFinite(n) ? clamp(n, 1, 10) : 5;
};

/* A stable number from a name, so two queens with the same stats do not get
   the same past and the same craft. Not the game rng: this must survive a
   replay that draws a different number of times. */
function hashOf(s) {
  let h = 2166136261;
  for (const ch of String(s || '')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

/* ── UNFINISHED BUSINESS ──────────────────────────────────────────────
   One line, chosen from where she actually stands rather than at random: the
   queen who came second wants the crown, the queen who went out first wants
   to be seen at all. This is the sentence the entrance is built on. */
function businessFor(rank, of, wins) {
  const share = rank / Math.max(2, of);
  if (rank === 1) return 'she has nothing to prove and everything to defend';
  if (rank === 2) return 'she was one song away, and she has thought about it since';
  if (wins >= 2) return 'she won more than anybody and still went home';
  if (share <= 0.35) return 'she got close enough to taste it';
  if (share >= 0.8) return 'she went home before the room knew who she was';
  return 'she was good and it was not enough';
}

/** Her real record, from a stored season, or null. */
function realPast(name, seasons) {
  for (const s of seasons || []) {
    const list = s?.placements || [];
    const row = list.find(p => p?.name === name);
    if (!row) continue;
    const rank = Number(row.place) || list.length;
    return {
      real: true, season: Number(s.season) || 0, rank, of: list.length,
      wins: Number(row.wins) || 0,
      exit: rank === 1 ? 'crowned' : rank <= 3 ? 'finalist' : 'eliminated',
      business: businessFor(rank, list.length, Number(row.wins) || 0),
    };
  }
  return null;
}

/**
 * What she did, before this.
 *
 * `seasons` is `[{ season, placements: [{ name, place, wins }] }]` — the shape
 * `dragPlacements` already produces. Absent, everything is invented.
 */
export function queenPast(player, { seasons = [], rng = null } = {}) {
  const name = player?.name || '';
  const real = realPast(name, seasons);
  if (real) return real;
  const h = rng ? rng() : hashOf(name);
  const h2 = hashOf(`${name}|of`);
  /* The field she came out of and where she landed in it. Her craft and her
     boldness pull the rank up; the room she was in is 8..14 queens. */
  const of = 8 + Math.floor(h2 * 7);
  const strength = (DRAG_STATS.reduce((s, k) => s + dragOf(player)[k], 0) / DRAG_STATS.length
    + stat(player, 'boldness')) / 2 / 10;
  // 2 is the ceiling: an invented past never crowns her.
  const rank = clamp(Math.round(of - (of - 2) * (strength * 0.7 + h * 0.3)), 2, of);
  const wins = rank <= 3 ? Math.round(strength * 2) : rank <= of / 2 ? Math.round(strength) : 0;
  return {
    real: false, season: 1 + Math.floor(hashOf(`${name}|season`) * 9), rank, of, wins,
    exit: rank <= 3 ? 'finalist' : 'eliminated',
    business: businessFor(rank, of, wins),
  };
}

/* ── THE CRAFT A QUEEN NOBODY AUTHORED WOULD OTHERWISE NOT HAVE ───────
   `dragOf` normalises every missing craft stat to 5, so a roster queen with
   no authored block plays a whole season with SEVEN FLAT FIVES — identical on
   the exact seven numbers that decide this show. Thirteen of those is not a
   cast, it is noise, and every result of the season means nothing.

   So craft is derived from the nine shared stats she does have, the way
   `expectedStyleFor` already derives a style: a blend per craft, plus a
   stable per-queen offset so seven crafts are not a linear function of nine
   stats and two queens with similar stats are not the same performer.
   AUTHORED ALWAYS WINS — this is only ever a fallback. */
const CRAFT_BLEND = {
  acting: ['social', 'mental'],
  comedy: ['social', 'boldness'],
  dance: ['physical', 'endurance'],
  design: ['mental', 'intuition'],
  runway: ['boldness', 'temperament'],
  lipsync: ['physical', 'boldness'],
  singing: ['intuition', 'temperament'],
};

export function derivedCraft(player) {
  const out = {};
  for (const k of DRAG_STATS) {
    const [a, b] = CRAFT_BLEND[k];
    const base = (stat(player, a) + stat(player, b)) / 2;
    const off = (hashOf(`${player?.name || ''}|${k}`) - 0.5) * 4;
    out[k] = clamp(Math.round(base + off), 1, 10);
  }
  return out;
}

/** Is her craft the flat default block — the failed cast this guards against? */
export function craftIsFlat(player) {
  const d = dragOf(player);
  return new Set(DRAG_STATS.map(k => d[k])).size <= 1;
}

/**
 * Every queen's past, frozen for the season.
 *
 * Called once at cast time and written onto the state, so nothing downstream
 * can re-derive a different answer.
 */
export function castPasts({ cast = [], seasons = [], seed = 1 } = {}) {
  const rng = rngFor(seed * 31 + 17);
  const out = {};
  for (const p of cast) out[p.name] = queenPast(p, { seasons, rng });
  return out;
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/dr-past.test.js`
Expected: PASS (11 assertions across 8 tests).

- [ ] **Step 5: Commit**

```bash
git add js/dr/past.js tests/dr-past.test.js
git commit -m "feat(drag-race): a queen's past, read from a stored season or written for her

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: The mode — config, dropdown, and a cast that arrives with a past

**Files:**
- Modify: `js/core.js:1715`, `simulator.html:825`, `js/cast-ui.js:1313` and `:1491`,
  `js/dr/season.js:1112`
- Test: `tests/dr-all-stars.test.js`

**Interfaces:**
- Consumes: `castPasts`, `derivedCraft`, `craftIsFlat` (Task 1).
- Produces: `seasonConfig.drAllStars` (boolean), `seasonConfig.drAllStarsRule`
  (`'legacy' | 'save'`), and on the season state: `state.allStars =
  { rule, pasts: { [name]: past } }`. Later tasks read `state.allStars`.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-all-stars.test.js
// ══════════════════════════════════════════════════════════════════════
// tests/dr-all-stars.test.js — the All Stars mode (spec 2026-09-08)
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'schemer', 'mastermind', 'underdog'];

// Deliberately WITHOUT a drag block: this is the unauthored roster queen the
// mode has to be able to cast.
function bareCast(n, seed) {
  const rng = rngFor(seed * 7919 + 13); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
    archetype: ARCH[i % ARCH.length], age: 22 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
  }));
}

function season(seed, config = {}, cast = null) {
  const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
  return playDragSeason({
    cast: cast || bareCast(10, seed), seed: seed * 101 + 7, config,
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
    popDelta: () => {},
  });
}

describe('the mode', () => {
  it('is off unless asked for, and off changes nothing', () => {
    const a = season(4);
    const b = season(4, { drAllStars: false });
    expect(JSON.stringify(a.rows)).toBe(JSON.stringify(b.rows));
  });

  it('gives every queen a past, frozen on the season', () => {
    const res = season(4, { drAllStars: true });
    const pasts = res.state.allStars.pasts;
    expect(Object.keys(pasts)).toHaveLength(10);
    for (const p of Object.values(pasts)) {
      expect(p.rank).toBeGreaterThan(0);
      expect(typeof p.business).toBe('string');
    }
    expect(season(4, { drAllStars: true }).state.allStars.pasts).toEqual(pasts);
  });

  it('never casts a queen with the flat default craft block', () => {
    const res = season(4, { drAllStars: true });
    const crafts = res.state.allStars.craft;
    expect(Object.keys(crafts)).toHaveLength(10);
    for (const c of Object.values(crafts)) {
      expect(new Set(Object.values(c)).size).toBeGreaterThan(1);
    }
  });

  it('records the rule it ran', () => {
    expect(season(4, { drAllStars: true }).state.allStars.rule).toBe('legacy');
    expect(season(4, { drAllStars: true, drAllStarsRule: 'save' }).state.allStars.rule).toBe('save');
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-all-stars.test.js`
Expected: FAIL — `Cannot read properties of undefined (reading 'pasts')`.

- [ ] **Step 3: Add the defaults**

In `js/core.js`, at line 1715, the drag block currently reads:

```js
    drPremiere: 'standard', drFinale: 'top4',
```

Change to:

```js
    drPremiere: 'standard', drFinale: 'top4',
    /* ── ALL STARS: A MODE, AND SEPARATELY A RULE ──
       "All Stars" names five different games (see the spec's era table), so
       the rule is its own key. Folding it into the flag would mean rebuilding
       the shape to reach any of the others. `legacy` is era B: the top two
       sing and the winner eliminates. `save` is the Beaver/Baguette, which
       already exists — the mode only makes it reachable from here. */
    drAllStars: false, drAllStarsRule: 'legacy',
```

- [ ] **Step 4: Add the dropdown**

In `simulator.html`, immediately after the `cfg-dr-finale` select block that
ends near line 833, add:

```html
            <div class="form-group">
              <label class="form-label">All Stars</label>
              <select id="cfg-dr-all-stars" onchange="saveConfig()" class="form-input">
                <option value="off">Off — the panel ranks, the host decides</option>
                <option value="legacy">All Stars: Lip Sync for Your Legacy</option>
                <option value="save">All Stars: the save (Beaver / Baguette)</option>
              </select>
              <div class="form-hint">A returning cast who arrive with a past. On
                <b>Legacy</b> the top two lip sync and the winner chooses who goes
                home; on <b>the save</b> the top queen saves one of the bottom
                three and the song decides the rest.</div>
            </div>
```

- [ ] **Step 5: Collect and restore it**

In `js/cast-ui.js`, after line 1313 (`drFinale:`), add:

```js
    /* One control, two keys: the dropdown reads "off" or a rule name, and the
       engine wants a flag and a rule. Kept as two keys because the rule must
       survive turning the mode off and on again. */
    drAllStars:  (g('cfg-dr-all-stars')?.value || 'off') !== 'off',
    drAllStarsRule: (g('cfg-dr-all-stars')?.value || 'off') === 'save' ? 'save' : 'legacy',
```

And after line 1491 (`set('cfg-dr-finale', …)`), add:

```js
  set('cfg-dr-all-stars', seasonConfig.drAllStars
    ? (seasonConfig.drAllStarsRule === 'save' ? 'save' : 'legacy') : 'off');
```

- [ ] **Step 6: Fill in the cast at the top of the season**

In `js/dr/season.js`, add to the imports at the top of the file:

```js
import { castPasts, derivedCraft, craftIsFlat } from './past.js';
```

In `playDragSeason`, immediately after
`const players = Object.fromEntries(cast.map(p => [p.name, p]));`, add:

```js
  /* ── ALL STARS: THE CAST ARRIVES HAVING ALREADY DONE SOMETHING ──────
     Both halves are computed ONCE and frozen onto the state. A past
     re-derived per screen is a past that disagrees with itself between the
     chart, the article and the room; and craft re-derived per week would
     change who is good at what halfway through a season.

     The craft fill is not a nicety. `dragOf` normalises a missing craft stat
     to 5, so an unauthored roster queen plays with seven flat fives on the
     exact seven numbers that decide this show — measured: 0 of 194 roster
     players have ever carried a craft block. Authored always wins. */
  if (config.drAllStars) {
    const rule = config.drAllStarsRule === 'save' ? 'save' : 'legacy';
    const pasts = castPasts({ cast, seasons: config.drPastSeasons || [], seed });
    const craft = {};
    for (const p of cast) {
      if (craftIsFlat(p)) {
        craft[p.name] = derivedCraft(p);
        p.drag = { ...(p.drag || {}), ...craft[p.name] };
      } else {
        craft[p.name] = Object.fromEntries(
          Object.entries(p.drag || {}).filter(([, v]) => typeof v === 'number'));
      }
    }
    state.allStars = { rule, pasts, craft };
  }
```

- [ ] **Step 7: Run the tests**

Run: `npx vitest run tests/dr-all-stars.test.js`
Expected: PASS (4 tests).

- [ ] **Step 8: Prove the mode-off season is untouched**

Run: `npx vitest run tests/dr-saves.test.js tests/dr-season.test.js`
Expected: PASS, unchanged. (If `tests/dr-season.test.js` does not exist, use
`npx vitest run tests/dr-week.test.js` — list the dr test files first with
`ls tests/dr-*.test.js` and run the three closest to the season loop.)

- [ ] **Step 9: Commit**

```bash
git add js/core.js simulator.html js/cast-ui.js js/dr/season.js tests/dr-all-stars.test.js
git commit -m "feat(drag-race): the All Stars mode, and a cast that arrives with a past

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: The weekly rule, and the endgame that already handles itself

**Files:**
- Modify: `js/dr/season.js:511` (`weekCfg`)
- Test: `tests/dr-all-stars.test.js` (append)

**Interfaces:**
- Consumes: `state.allStars.rule` (Task 2).
- Produces: `cfg.legacy === true` on every week of a `legacy` season, which
  `js/dr/week.js:829` already resolves.

- [ ] **Step 1: Write the failing test**

Append to `tests/dr-all-stars.test.js`:

```js
describe('the legacy rule', () => {
  const weekly = res => res.rows.filter(r => r.dr && !r.dr.finale);

  it('runs on every week with a room big enough for it', () => {
    const res = season(9, { drAllStars: true });
    const wide = weekly(res).filter(r => (r.dr.call?.safe?.length ?? 0) + 4 >= 4
      && r.dr.lipsync && r.dr.living?.length >= 4);
    expect(wide.length).toBeGreaterThan(3);
    for (const r of wide) expect(r.dr.lipsync.legacy).toBe(true);
  });

  it('nobody in the bottom ever sings on a legacy night', () => {
    const res = season(9, { drAllStars: true });
    for (const r of weekly(res)) {
      if (!r.dr.lipsync?.legacy) continue;
      const singers = r.dr.lipsync.singers || [r.dr.lipsync.a, r.dr.lipsync.b].filter(Boolean);
      for (const q of (r.dr.call?.bottom || [])) expect(singers).not.toContain(q);
    }
  });

  it('falls back to an ordinary bottom-two song once the room is too small', () => {
    const res = season(9, { drAllStars: true });
    const small = weekly(res).filter(r => (r.dr.living?.length ?? 0) < 4 && r.dr.lipsync);
    for (const r of small) expect(r.dr.lipsync.legacy).toBeFalsy();
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-all-stars.test.js -t "legacy rule"`
Expected: FAIL — `expected undefined to be true` on `lipsync.legacy`.

- [ ] **Step 3: Flip the flag in `weekCfg`**

In `js/dr/season.js`, inside `weekCfg`, after the `tripleOnTie` line, add:

```js
    /* ── THE ALL STARS RULE IS A SEASON'S, NOT A WEEK'S ──
       A pin still works (`week.legacy`, booked from the designer on an
       ordinary season). The mode simply says it every week, and `week.js`
       needs no change for it: its gate is
       `cfg.legacy && bend.length >= 4`, so once the room is too small to
       hold both a top two and a bottom to eliminate from, the week falls
       back to an ordinary bottom-two lip sync on its own. No endgame branch
       to write and none to forget. */
    legacy: !!extra.legacy
      || (!!config.drAllStars && (config.drAllStarsRule || 'legacy') === 'legacy'),
```

Then check the two existing call sites that spread `legacy` in (`season.js:339`
and `:1517`): both pass `...(week.legacy ? { legacy: true } : {})` through
`extra`, which the line above now reads. Leave them as they are.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/dr-all-stars.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add js/dr/season.js tests/dr-all-stars.test.js
git commit -m "feat(drag-race): All Stars runs the legacy rule every week, and folds at the end

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: The chart — `BTM3`, and a legend that knows what season it is

**Files:**
- Modify: `js/dr/grid.js:51` (`GRID_RESULTS`, `ORDER_OF`, `PPE_POINTS`, the
  renderer near `:361` and the legend near `:433`)
- Test: `tests/dr-grid.test.js` (append; create if absent)

**Interfaces:**
- Produces: `GRID_RESULTS.BTM3`, and
  `resultMeta(result, { shape = 'flagship' }) -> { label, short, title, color, ink }`
  — used by the renderer and the legend. Task 5 writes the records it draws.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-grid.test.js  (append, or create with these imports)
import { describe, expect, it } from 'vitest';
import { GRID_RESULTS, PPE_POINTS, resultMeta, ppeFor } from '../js/dr/grid.js';

describe('the bottom, on an All Stars chart', () => {
  it('has a cell for a bottom of three', () => {
    expect(GRID_RESULTS.BTM3).toBeTruthy();
    expect(PPE_POINTS.BTM3).toBe(PPE_POINTS.BTM2);
  });

  it('says what the cell MEANS in the season it is drawn for', () => {
    expect(resultMeta('BTM2', { shape: 'flagship' }).title).toMatch(/lip synced/i);
    expect(resultMeta('BTM2', { shape: 'all-stars' }).title).toMatch(/not chosen/i);
    expect(resultMeta('BTM2', { shape: 'all-stars' }).title).not.toMatch(/lip synced/i);
    expect(resultMeta('BTM3', { shape: 'all-stars' }).title).toMatch(/not chosen/i);
  });

  it('scores a spared queen the same either way', () => {
    expect(ppeFor([{ result: 'BTM3' }, { result: 'WIN' }])).toBe(3);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-grid.test.js`
Expected: FAIL — `expected undefined to be truthy` for `GRID_RESULTS.BTM3`.

- [ ] **Step 3: Add the result and the shape-aware labels**

In `js/dr/grid.js`, after the `BTM2` entry, add:

```js
  /* ── THE BOTTOM THREE, WHICH ONLY ALL STARS PRODUCES ──
     On the legacy rule the winner of the song chooses out of a named bottom,
     so the queens who survive did not sing and did not do anything: they were
     not picked. The record is the SIZE OF THE BOTTOM she was named in, which
     is how the real chart draws these cells.
     The retired `BTM` above is NOT reused for this. It is retired on the
     season 16 wikitext (one bare use against eleven LOWs, no legend entry)
     and bringing it back to mean a third thing is how a chart ends up with
     two words for one night. */
  BTM3: { label: 'BTM3', short: 'BTM3', title: 'The bottom three — lip synced, and survived', color: '#f98080', ink: '#2b0000' },
```

In `ORDER_OF`, change:

```js
  WINNER: 0, WIN: 1, FINALIST: 2, HIGH: 3, SAFE: 4, LOW: 5, BTM: 6, BTM2: 7, ELIM: 8, OUT: 9,
```

to:

```js
  WINNER: 0, WIN: 1, FINALIST: 2, HIGH: 3, SAFE: 4, LOW: 5, BTM: 6, BTM3: 6.5, BTM2: 7, ELIM: 8, OUT: 9,
```

In `PPE_POINTS`, add `BTM3: 1` beside `BTM2: 1`.

Then add, immediately after the `PPE_POINTS` block:

```js
/* ── WHAT A CELL MEANS DEPENDS ON THE SEASON IT IS IN ─────────────────
   `BTM2` is two different weeks. On a flagship season she lip synced and
   survived it. On All Stars' legacy rule NOBODY in the bottom sings — the
   winner of the top-two song simply chose somebody else — so the same token
   means "named for elimination, and not chosen".
   That is one word with two meanings, which is exactly the collapse this
   show's docs exist to prevent, and it is only tolerable because it cannot be
   ambiguous WITHIN a season: on the legacy rule there is no other reading
   available. The mitigation is not a convention, it is this function. A
   static map is how the two meanings would silently merge again. */
const ALL_STARS_TITLES = {
  BTM2: 'The bottom two — named for elimination, and not chosen',
  BTM3: 'The bottom three — named for elimination, and not chosen',
  ELIM: 'Named for elimination, and chosen by the winner of the song',
  WIN: 'Won the maxi challenge and the Lip Sync for Your Legacy',
  HIGH: 'Among the top two — lost the Lip Sync for Your Legacy',
};

/** A cell's look and its wording, for the shape of season being drawn. */
export function resultMeta(result, { shape = 'flagship' } = {}) {
  const base = GRID_RESULTS[result] || GRID_RESULTS.SAFE;
  if (shape !== 'all-stars') return base;
  const title = ALL_STARS_TITLES[result];
  return title ? { ...base, title } : base;
}
```

- [ ] **Step 4: Use it in the renderer and the legend**

At `js/dr/grid.js:361`, replace:

```js
      const meta = GRID_RESULTS[c.result] || GRID_RESULTS.SAFE;
```

with:

```js
      const meta = resultMeta(c.result, { shape });
```

and at the legend near `:433`, replace the `Object.entries(GRID_RESULTS)` source
with the same shape-aware lookup:

```js
  const legend = Object.entries(GRID_RESULTS)
    .map(([k, v]) => [k, resultMeta(k, { shape })])
```

Both need `shape` in scope. In the function that builds the grid, derive it once
from the season it was handed:

```js
  /* An All Stars season's chart says different things in the same colours —
     see `resultMeta`. Taken from the season rather than assumed. */
  const shape = rows?.[0]?.dr?.allStars || last?.dr?.allStars ? 'all-stars' : 'flagship';
```

(Task 5 writes `row.dr.allStars`.)

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/dr-grid.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/dr/grid.js tests/dr-grid.test.js
git commit -m "feat(drag-race): a bottom-three cell, and a legend that knows which season it is

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Recording the spared queens

**Files:**
- Modify: `js/dr/week.js:1537` (the result ladder) and the row it returns near `:1619`
- Test: `tests/dr-all-stars.test.js` (append)

**Interfaces:**
- Consumes: `cfg.legacy` (Task 3).
- Produces: `row.dr.allStars = { rule }` (read by Task 4's `shape`), and
  `BTM2`/`BTM3` in `state.record` for queens named in the bottom and not chosen.

- [ ] **Step 1: Write the failing test**

Append to `tests/dr-all-stars.test.js`:

```js
describe('the chart on a legacy night', () => {
  const weekly = res => res.rows.filter(r => r.dr && !r.dr.finale);

  it('records the size of the bottom she was named in', () => {
    const res = season(11, { drAllStars: true });
    let checked = 0;
    for (const r of weekly(res)) {
      if (!r.dr.lipsync?.legacy) continue;
      const bottom = r.dr.call?.bottom || [];
      if (bottom.length < 2) continue;
      const want = bottom.length >= 3 ? 'BTM3' : 'BTM2';
      const cells = r.dr.placements || [];
      for (const q of bottom) {
        const cell = cells.find(c => c.name === q);
        if (!cell) continue;
        expect(['ELIM', want]).toContain(cell.result);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(4);
  });

  it('marks the row as All Stars so the chart can word itself', () => {
    const res = season(11, { drAllStars: true });
    for (const r of weekly(res)) expect(r.dr.allStars?.rule).toBe('legacy');
    expect(weekly(season(11)).every(r => !r.dr.allStars)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-all-stars.test.js -t "chart on a legacy night"`
Expected: FAIL — the spared queens record `BTM2` where the bottom was three, and
`r.dr.allStars` is undefined.

- [ ] **Step 3: Record it**

In `js/dr/week.js`, in the result ladder near line 1537, change:

```js
            : call.bottom.includes(n) ? 'BTM2'
```

to:

```js
            /* ── THE BOTTOM, AND WHETHER SHE SANG IN IT ──
               On an ordinary night the bottom IS the lip sync, so BTM2 says
               she sang and survived. On a legacy night nobody in the bottom
               sings — the winner of the top-two song picked somebody else —
               and the record is the size of the bottom she was named in.
               `js/dr/grid.js` words the cell from the season's shape; this
               only has to write the right one. */
            : call.bottom.includes(n)
              ? (legacy && call.bottom.length >= 3 ? 'BTM3' : 'BTM2')
```

Then in the returned row near line 1619, inside the `dr` object, add:

```js
      /* WHICH GAME THIS WEEK WAS. The chart's words depend on it (BTM2 means
         two different weeks) and so does every reader that would otherwise
         infer a lip sync from a bottom placement. */
      allStars: cfg.legacy || cfg.allStarsRule ? { rule: cfg.legacy ? 'legacy' : 'save' } : null,
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/dr-all-stars.test.js tests/dr-grid.test.js`
Expected: PASS.

- [ ] **Step 5: Check nothing else read `BTM2` as "she sang"**

Run: `grep -rn "BTM2" js/ --include=*.js | grep -v "js/dr/grid.js"`

For each hit, confirm it does not print or imply a lip sync for a bottom queen.
The known ones are `js/dr/export.js`, `js/dr/season.js` (`RECORD_POINTS`),
`js/vp-dr/chart.js` and `js/dr/week.js` itself. Add `BTM3` alongside `BTM2` in
`RECORD_POINTS` (`js/dr/season.js`, value `-1.25`) and in the exporter's label
list, and fix any sentence that claims a song.

- [ ] **Step 6: Commit**

```bash
git add js/dr/week.js js/dr/season.js js/dr/export.js tests/dr-all-stars.test.js
git commit -m "feat(drag-race): the queens the winner did not pick, on the chart

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: The power ledger, unwelded from the save

**Files:**
- Create: `js/dr/power.js`
- Modify: `js/dr/saves.js:202` (move `timesSaved`, `deliveredSince`, `holderMind`
  and the memory helpers out, re-export them)
- Test: `tests/dr-legacy.test.js`

**Interfaces:**
- Produces:
  - `powerMind(player) -> { strategy, merit, fair }` (the function `holderMind`
    is today; `saves.js` re-exports it under its old name)
  - `timesSpared(ledger, q) -> number`
  - `deliveredSince(ledger, q, state) -> { wins, highs }`
  - `recordUse(ledger, { ep, holder, picks })` — appends to `ledger.uses`
  - `initLedger() -> { uses: [], debts: [], grudges: [], promises: [], hopes: [] }`
- The ledger's shape is **unchanged** from `saves.uses`, so seasons already
  stored keep working and `saves.js` passes its own object in.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-legacy.test.js
// ══════════════════════════════════════════════════════════════════════
// tests/dr-legacy.test.js — the power ledger and the legacy choice
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { powerMind, timesSpared, recordUse, initLedger } from '../js/dr/power.js';
import { holderMind, timesSaved } from '../js/dr/saves.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const q = (name, archetype, over = {}) => ({
  name, archetype,
  stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), ...over },
});

describe('the power ledger', () => {
  it('counts who has been spared, whoever spared her', () => {
    const l = initLedger();
    recordUse(l, { ep: 2, holder: 'A', picks: [{ saved: 'B' }] });
    recordUse(l, { ep: 4, holder: 'C', picks: [{ saved: 'B' }] });
    expect(timesSpared(l, 'B')).toBe(2);
    expect(timesSpared(l, 'A')).toBe(0);
  });

  it('is the same ledger the save writes — one account, not two', () => {
    const l = initLedger();
    recordUse(l, { ep: 2, holder: 'A', picks: [{ saved: 'B' }] });
    expect(timesSaved(l, 'B')).toBe(timesSpared(l, 'B'));
  });
});

describe('powerMind', () => {
  it('is what holderMind was — the save keeps its name', () => {
    const p = q('A', 'villain', { strategic: 9, loyalty: 2 });
    expect(powerMind(p)).toEqual(holderMind(p));
  });

  it('never zeroes a pull: even a hero wants to win', () => {
    const m = powerMind(q('H', 'hero', { social: 9, loyalty: 9 }));
    expect(m.strategy).toBeGreaterThan(0);
    expect(m.strategy + m.merit + m.fair).toBeCloseTo(1, 6);
  });

  it('leans a villain toward strategy and a hero toward fair', () => {
    const v = powerMind(q('V', 'villain', { strategic: 8, loyalty: 3 }));
    const h = powerMind(q('H', 'hero', { strategic: 8, loyalty: 3 }));
    expect(v.strategy).toBeGreaterThan(h.strategy);
    expect(h.fair).toBeGreaterThan(v.fair);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-legacy.test.js`
Expected: FAIL — `Failed to resolve import "../js/dr/power.js"`.

- [ ] **Step 3: Create the module by MOVING code, not retyping it**

Create `js/dr/power.js` and move these four things out of `js/dr/saves.js`
verbatim: `NICE_MIND`, `VILLAIN_MIND`, `MERIT_MIND`, `holderMind` (renamed
`powerMind`), `timesSaved` (renamed `timesSpared`), `lastSavedEp` and
`deliveredSince`. `stat` is a small local helper in `saves.js`; copy it in.

```js
// js/dr/power.js
// ══════════════════════════════════════════════════════════════════════
// dr/power.js — who holds power on this show, and what it has already cost
// ══════════════════════════════════════════════════════════════════════
//
// One account, written by every mechanic that puts an exit in a queen's hands.
// It was welded to the season's save: `runCampaign` took `saves` and asked it
// `timesSaved`, so the Beaver's memory and All Stars' memory would have been
// two ledgers that never met — and "she saved me twice" and "she sent my best
// friend home" are the same fact about the same relationship.
//
// The SHAPE is unchanged from `saves.uses` on purpose: seasons already stored
// keep reading, and js/dr/saves.js passes its own object straight in.
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const stat = (p, k) => {
  const n = Number(p?.stats?.[k]);
  return Number.isFinite(n) ? clamp(n, 1, 10) : 5;
};

export function initLedger() {
  return { uses: [], debts: [], grudges: [], promises: [], hopes: [] };
}

/** One spend of the power, appended in the order it happened. */
export function recordUse(ledger, { ep, holder, picks = [] } = {}) {
  (ledger.uses ||= []).push({ ep: Number(ep) || 0, holder, picks });
  return ledger;
}

/* ── THE THREE PULLS EVERY QUEEN HAS ──────────────────────────────────
     strategy  win the game with it                     strategic, low loyalty
     merit     give it to whoever deserved it            boldness, intuition
     fair      spread it around, reward the people       social, loyalty
   The archetype leans on them and never zeroes one: a hero still wants to
   win, a villain still notices who was robbed. Normalised, so they sum to
   one. `ballotSelfishness` stays what Rate-a-Queen uses, where the
   nice-queen zero is the rule. */
const NICE_MIND = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN_MIND = new Set(['villain', 'mastermind', 'schemer']);
const MERIT_MIND = new Set(['challenge-beast', 'hothead', 'perceptive-player']);

export function powerMind(p) {
  const a = p?.archetype || '';
  const s = stat(p, 'strategic') / 10;
  const l = stat(p, 'loyalty') / 10;
  const strat = 0.05 + s * (1.2 - l) * (VILLAIN_MIND.has(a) ? 1.6 : NICE_MIND.has(a) ? 0.45 : 1);
  const merit = 0.1 + (stat(p, 'boldness') + stat(p, 'intuition')) / 20 * (MERIT_MIND.has(a) ? 1.3 : 1);
  const fair = 0.1 + (stat(p, 'social') + stat(p, 'loyalty')) / 20
    * (NICE_MIND.has(a) ? 1.3 : VILLAIN_MIND.has(a) ? 0.5 : 1);
  const t = strat + merit + fair;
  return { strategy: strat / t, merit: merit / t, fair: fair / t };
}

/** How many times the power has already spared `q` this season. */
export function timesSpared(ledger, q) {
  return (ledger?.uses || []).reduce((n, u) => n + (u.picks || []).filter(x => x.saved === q).length, 0);
}

/** The last episode she was spared on, or 0. */function lastSparedEp(ledger, q) {
  return (ledger?.uses || []).filter(u => (u.picks || []).some(x => x.saved === q))
    .reduce((m, u) => Math.max(m, Number(u.ep) || 0), 0);
}

/** What she did with it: wins and highs on the chart since she was spared. */
export function deliveredSince(ledger, q, state) {
  const ep = lastSparedEp(ledger, q);
  if (!ep) return { wins: 0, highs: 0 };
  const rec = (state?.record?.[q] || []).slice(ep);
  return { wins: rec.filter(r => r === 'WIN').length, highs: rec.filter(r => r === 'HIGH').length };
}
```

Fix the stray newline before `function lastSparedEp` when you paste it.

- [ ] **Step 4: Re-export from `saves.js` under the old names**

In `js/dr/saves.js`, delete the moved blocks and add near the top:

```js
/* THE LEDGER LIVES IN js/dr/power.js NOW. It is shared with the legacy choice
   (All Stars), because one queen sparing another and one queen ending another
   are the same account. Re-exported under the names four files and two test
   suites already call, so this move changes no behaviour — which the existing
   dr-saves suite is the guard for. */
import { powerMind, timesSpared, deliveredSince, recordUse, initLedger } from './power.js';
export { deliveredSince, recordUse, initLedger };
export const holderMind = powerMind;
export const timesSaved = timesSpared;
```

- [ ] **Step 5: Run both suites — the old one is the guard**

Run: `npx vitest run tests/dr-legacy.test.js tests/dr-saves.test.js`
Expected: PASS, and `dr-saves` must be **unchanged** (same number of tests
passing as before the move; if anything fails, the move was not
behaviour-preserving — do not "fix" the save's behaviour to match).

- [ ] **Step 6: Commit**

```bash
git add js/dr/power.js js/dr/saves.js tests/dr-legacy.test.js
git commit -m "refactor(drag-race): one power ledger, shared by the save and the legacy choice

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: `js/dr/legacy.js` — who she sends home, and why

**Files:**
- Create: `js/dr/legacy.js`
- Modify: `js/dr/week.js:1437` (replace the inline ternary)
- Test: `tests/dr-legacy.test.js` (append)

**Interfaces:**
- Consumes: `powerMind`, `timesSpared` (Task 6); `state.allStars.pasts` (Task 2).
- Produces:
  `chooseElimination({ winner, pool, players, bond, state, ledger, pleas = {}, panelOrder = [], rng }) -> { target, why, reason }`
  where `why` is one of `'threat' | 'panel' | 'grudge' | 'friendship' | 'pleaded'`
  and `reason` is a short clause naming the move (not a feeling).

- [ ] **Step 1: Write the failing test**

Append to `tests/dr-legacy.test.js`:

```js
import { chooseElimination } from '../js/dr/legacy.js';

const base = {
  players: {}, bond: () => 0, ledger: initLedger(), pleas: {},
  state: { record: {}, allStars: { pasts: {} } },
  rng: () => 0.5,
};

function setup(over = {}) {
  const players = {
    Villain: q('Villain', 'villain', { strategic: 9, loyalty: 2, boldness: 8 }),
    Hero: q('Hero', 'hero', { social: 9, loyalty: 9 }),
    Threat: q('Threat', 'challenge-beast', { physical: 9 }),
    Weak: q('Weak', 'floater'),
    Friend: q('Friend', 'social-butterfly'),
  };
  return {
    ...base, players,
    state: {
      record: { Threat: ['WIN', 'WIN', 'HIGH'], Weak: ['LOW', 'BTM2', 'SAFE'], Friend: ['SAFE', 'SAFE', 'LOW'] },
      allStars: { pasts: { Threat: { rank: 2, of: 12, wins: 3, real: false } } },
    },
    ...over,
  };
}

describe('the legacy choice', () => {
  it('always names somebody from the bottom, never one of the two who sang', () => {
    const r = chooseElimination({
      ...setup(), winner: 'Villain', pool: ['Threat', 'Weak', 'Friend'],
      panelOrder: ['Friend', 'Weak', 'Threat'],
    });
    expect(['Threat', 'Weak', 'Friend']).toContain(r.target);
    expect(r.target).not.toBe('Villain');
    expect(typeof r.reason).toBe('string');
    expect(r.reason.length).toBeGreaterThan(0);
  });

  it('is deterministic for the same night', () => {
    const args = { ...setup(), winner: 'Villain', pool: ['Threat', 'Weak'], panelOrder: ['Weak', 'Threat'] };
    expect(chooseElimination(args)).toEqual(chooseElimination(args));
  });

  it('sends the threat home more often for a villain than for a hero', () => {
    const count = (who) => {
      let n = 0;
      for (let s = 0; s < 60; s++) {
        const rng = (() => { let x = s + 1; return () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648; })();
        const r = chooseElimination({
          ...setup(), winner: who, pool: ['Threat', 'Weak'],
          panelOrder: ['Weak', 'Threat'], rng,
        });
        if (r.target === 'Threat') n++;
      }
      return n;
    };
    expect(count('Villain')).toBeGreaterThan(count('Hero'));
  });

  it('takes the queen the panel ranked last more often for a hero', () => {
    let panelLast = 0;
    for (let s = 0; s < 60; s++) {
      const rng = (() => { let x = s + 7; return () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648; })();
      const r = chooseElimination({
        ...setup(), winner: 'Hero', pool: ['Threat', 'Weak'],
        panelOrder: ['Weak', 'Threat'], rng,
      });
      if (r.target === 'Weak') panelLast++;
    }
    expect(panelLast).toBeGreaterThan(30);
  });

  it('remembers who sent her home last time she was in this room', () => {
    const ledger = initLedger();
    ledger.grudges.push({ by: 'Weak', against: 'Villain' });
    const withGrudge = (l) => {
      let n = 0;
      for (let s = 0; s < 60; s++) {
        const rng = (() => { let x = s + 3; return () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648; })();
        const r = chooseElimination({
          ...setup(), ledger: l, winner: 'Villain', pool: ['Weak', 'Friend'],
          panelOrder: ['Friend', 'Weak'], rng,
        });
        if (r.target === 'Weak') n++;
      }
      return n;
    };
    expect(withGrudge(ledger)).toBeGreaterThan(withGrudge(initLedger()));
  });

  it('spares a queen who worked her in Untucked', () => {
    const args = {
      ...setup(), winner: 'Villain', pool: ['Weak', 'Friend'], panelOrder: ['Friend', 'Weak'],
    };
    const noPlea = chooseElimination(args).target;
    const pleaded = chooseElimination({ ...args, pleas: { Villain: { [noPlea]: 6 } } }).target;
    expect(pleaded).not.toBe(noPlea);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-legacy.test.js`
Expected: FAIL — `Failed to resolve import "../js/dr/legacy.js"`.

- [ ] **Step 3: Write the decision**

```js
// js/dr/legacy.js
// ══════════════════════════════════════════════════════════════════════
// dr/legacy.js — the All Stars choice: who the winner of the song sends home
// ══════════════════════════════════════════════════════════════════════
//
// THIS IS NOT A VOTE. One queen decides, alone, out of the bottom the panel
// named. Nobody else's preference is added up anywhere; what the room did in
// Untucked reaches her as a plea WEIGHT on her own read, which is the same
// shape the season's save already uses.
//
// ── WHY IT IS ITS OWN FILE ────────────────────────────────────────────
//
// It was one line in js/dr/week.js: `appetite >= 0.4 ? pool[0] : pool[last]` —
// the biggest threat or the panel's last, on a single number. That is a coin
// with two faces, and it could not see a grudge, a friendship, a plea or a
// track record. Extracted rather than widened in place because the night's
// prose asks it for a REASON as well as a name, and a decision that returns
// its own reason cannot drift from the one the screen prints.
//
// The reason explains a MOVE, not a feeling — the shape js/dr/rate.js landed
// on. "She has won twice and I cannot beat that in a song" is a reason; "I
// don't like her" is a mood.
import { powerMind, timesSpared } from './power.js';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/* How much of a problem she is, to the queen holding the lipstick. Her season
   so far, and what she already did before she walked in — an All Stars room
   knows which of them has a crown at home. */
const RECORD_WEIGHT = { WIN: 1, HIGH: 0.5, SAFE: 0, LOW: -0.25, BTM2: -0.4, BTM3: -0.4, ELIM: 0 };

function threatOf(q, { state }) {
  const rec = state?.record?.[q] || [];
  const form = rec.reduce((s, r) => s + (RECORD_WEIGHT[r] ?? 0), 0) / Math.max(1, rec.length);
  const past = state?.allStars?.pasts?.[q];
  /* A finalist last time is a finalist this time until she proves otherwise.
     Scaled by where she placed in the field she was in, so second of twelve
     reads stronger than second of eight. */
  const resume = past ? clamp(1 - (past.rank - 1) / Math.max(2, past.of - 1), 0, 1) : 0.35;
  return clamp(form * 0.6 + resume * 0.4, -1, 1.2);
}

/** Does she have a reason to want this one gone, from before tonight? */
function grudgeOf(winner, q, ledger) {
  const owed = (ledger?.grudges || [])
    .filter(g => (g.by === q && g.against === winner) || (g.by === winner && g.against === q)).length;
  return clamp(owed * 0.5, 0, 1.5);
}

/**
 * Who goes home.
 *
 * `pool` is the bottom, in the panel's own order, worst LAST — the same order
 * `panelOrder` carries. `pleas[winner][queen]` is what Untucked bought her.
 * Returns `{ target, why, reason }` and decides nothing else.
 */
export function chooseElimination({
  winner, pool = [], players = {}, bond = () => 0, state = {},
  ledger = {}, pleas = {}, panelOrder = [], rng = Math.random,
} = {}) {
  const live = pool.filter(q => q && q !== winner);
  if (!live.length) return { target: null, why: null, reason: '' };
  const mind = powerMind(players[winner]);
  const order = panelOrder.length ? panelOrder : live;
  const mine = pleas[winner] || {};
  const scored = live.map(q => {
    const threat = threatOf(q, { state });
    /* The panel's own last is the polite answer AND the honest one: the room
       already said she was the weakest of the three tonight. */
    const panelRank = order.indexOf(q);
    const panelLast = panelRank < 0 ? 0 : (panelRank + 1) / order.length;
    const b = Number(bond(winner, q)) || 0;
    const plea = Number(mine[q]) || 0;
    const spared = timesSpared(ledger, q);
    const score =
      // strategy: end the queen who can actually beat her
      mind.strategy * (threat * 1.6 + grudgeOf(winner, q, ledger) * 0.8)
      // merit: the panel ranked her last and that is the answer
      + mind.merit * panelLast * 1.4
      // fair: it is somebody's turn, and it is not her friend's
      + mind.fair * (panelLast * 0.6 + clamp(spared, 0, 3) * 0.25)
      // a friend is harder to end, whoever she is
      - clamp(b, -10, 10) / 10 * (0.5 + mind.fair)
      // and what she said in Untucked is worth something
      - plea * 0.12
      // a nudge, so a room of similar queens is not deterministic
      + (rng() - 0.5) * 0.25;
    return { q, score, threat, panelLast, b, plea };
  }).sort((a, b) => b.score - a.score);
  const top = scored[0];
  /* WHY, from what actually dominated her score — not from her archetype,
     which would let the label and the decision disagree. */
  const parts = [
    ['threat', mind.strategy * top.threat * 1.6],
    ['panel', mind.merit * top.panelLast * 1.4],
    ['grudge', mind.strategy * grudgeOf(winner, top.q, ledger) * 0.8],
  ].sort((a, b) => b[1] - a[1]);
  const why = parts[0][1] > 0 ? parts[0][0] : 'panel';
  const REASON = {
    threat: 'she is the one in that bottom who could take this from me',
    panel: 'the panel already said she was the weakest of them tonight',
    grudge: 'she has had this coming since the last time we were in a room together',
  };
  return { target: top.q, why, reason: REASON[why] };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/dr-legacy.test.js`
Expected: PASS. If the villain/hero split test fails, the strategy and merit
coefficients (1.6 and 1.4) are the dials — adjust and re-run; do **not** add an
`if (archetype === …)` branch, which would break the proportional-stats rule.

- [ ] **Step 5: Use it in `week.js`**

Add to the imports in `js/dr/week.js`:

```js
import { chooseElimination } from './legacy.js';
```

Then replace the whole `if (legacy) { … }` block at line 1437:

```js
    if (legacy) {
      const pool = bend.slice(2).map(r => r.name).filter(n => n !== a && n !== b);
      if (pool.length) {
        /* ── SHE SPENDS IT ── js/dr/legacy.js decides, and returns the reason
           the ceremony prints, so the screen cannot narrate a different
           decision from the one the chart records. Still not a vote: one
           queen, alone, out of the bottom the panel named. */
        const choice = chooseElimination({
          winner: lc.winner, pool, players: Object.fromEntries(living.map(n => [n, P(n)])),
          bond: (x, y) => ctx.bond?.(x, y) || 0, state,
          ledger: state.power || (state.power = { uses: [], debts: [], grudges: [], promises: [], hopes: [] }),
          pleas: legacyPleas, panelOrder: pool, rng,
        });
        if (choice.target) {
          exits.push(choice.target);
          lipsync.eliminated = choice.target;
          lipsync.chosenBy = lc.winner;
          lipsync.legacy = true;
          lipsync.why = choice.why;
          lipsync.reason = choice.reason;
          say('lipsync', 'legacy-choice', {
            winner: lc.winner, eliminated: choice.target, pool,
            why: choice.why, reason: choice.reason,
          });
        }
      }
    }
```

Declare `let legacyPleas = {};` near the top of the elimination section (it is
filled in Task 8; an empty object is correct until then).

- [ ] **Step 6: Run the week's tests**

Run: `npx vitest run tests/dr-all-stars.test.js tests/dr-legacy.test.js tests/dr-saves.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add js/dr/legacy.js js/dr/week.js tests/dr-legacy.test.js
git commit -m "feat(drag-race): the legacy choice reads the room, and says why

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Untucked, where the bottom works a queen who does not hold the power yet

**Files:**
- Modify: `js/dr/saves.js:232` (`campaignTargets`), `js/dr/week.js` (the Untucked
  block near `:969`)
- Test: `tests/dr-all-stars.test.js` (append)

**Interfaces:**
- Consumes: `runCampaign` (unchanged), `chooseElimination`'s `pleas` (Task 7).
- Produces: `campaignTargets({ saves, winners, giver, pool, living, bond, likelyTop = [] })`
  — the extra `likelyTop` argument, used on a legacy night; and
  `legacyPleas` filled in `week.js`.

- [ ] **Step 1: Write the failing test**

Append to `tests/dr-all-stars.test.js`:

```js
describe('the campaign on a legacy night', () => {
  const weekly = res => res.rows.filter(r => r.dr && !r.dr.finale);

  it('happens, and it happens before the song', () => {
    const res = season(21, { drAllStars: true });
    const scenes = weekly(res).flatMap(r => r.dr.scenes || []);
    const camp = scenes.filter(s => String(s.kind || '').startsWith('save:')
      || String(s.kind || '').startsWith('legacy:pitch'));
    expect(camp.length).toBeGreaterThan(0);
    for (const r of weekly(res)) {
      const list = r.dr.scenes || [];
      const iPitch = list.findIndex(s => String(s.kind || '').startsWith('legacy:pitch'));
      const iSong = list.findIndex(s => s.step === 'lipsync');
      if (iPitch >= 0 && iSong >= 0) expect(iPitch).toBeLessThan(iSong);
    }
  });

  it('works the queens the critiques favoured, not the eventual winner', () => {
    const res = season(21, { drAllStars: true });
    let seen = 0;
    for (const r of weekly(res)) {
      const pitches = (r.dr.scenes || []).filter(s => String(s.kind || '') === 'legacy:pitch');
      if (!pitches.length) continue;
      const top = [...(r.dr.callAtCall?.high || []), ...(r.dr.callAtCall?.win || [])];
      for (const p of pitches) {
        for (const who of (p.data?.players || []).slice(1)) {
          if (top.length) expect(top).toContain(who);
        }
        seen++;
      }
    }
    expect(seen).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-all-stars.test.js -t "campaign on a legacy night"`
Expected: FAIL — no `legacy:pitch` scenes exist.

- [ ] **Step 3: Teach `campaignTargets` about a power nobody holds yet**

In `js/dr/saves.js`, replace `campaignTargets` with:

```js
/**
 * Who the bottom is working on.
 *
 * The beaver's winners, or — on a baguette night — the queen the room expects
 * the baguette to go to: the giver's closest friend who is not herself in the
 * bottom.
 *
 * ── AND ON A LEGACY NIGHT, NOBODY HOLDS IT YET ──
 * The power belongs to whoever wins a song that has not happened. So the
 * bottom works the queens the critiques favoured, which is what the real
 * seasons show: the lobbying is in Untucked, before the top two sing, and a
 * queen who spent it on the wrong person spent it for nothing. `likelyTop` is
 * the call as it stood at the call — see `callAtCall` in js/dr/week.js.
 */
export function campaignTargets({ saves, winners = [], giver = null, pool, living, bond, likelyTop = [] }) {
  if (likelyTop.length) return likelyTop.filter(q => !pool.includes(q));
  if (saves?.kind === 'beaver') return winners.filter(Boolean);
  if (!giver) return [];
  const likely = living.filter(q => !pool.includes(q))
    .sort((a, b) => (Number(bond(giver, b)) || 0) - (Number(bond(giver, a)) || 0))[0];
  return likely ? [likely] : [];
}
```

- [ ] **Step 4: Run the campaign on a legacy night in `week.js`**

In the Untucked block of `js/dr/week.js` (near line 969, where the save's
campaign runs), add a legacy branch. It runs the same three rounds against the
likely top, and keeps the pleas for Task 7's call:

```js
  /* ── THE CAMPAIGN, ON A NIGHT NOBODY HOLDS THE POWER YET ────────────
     The same three rounds the save's campaign runs — pitch, pushback, answer —
     but aimed at the queens the panel just praised, because the lipstick will
     belong to whichever of them wins the song. Her pleas reach the decision
     as a weight (js/dr/legacy.js), never as a vote, and nothing here can move
     a queen who does not end up holding it. */
  if (legacy && call.bottom.length) {
    const likelyTop = [...(callAtCall?.win || []), ...(callAtCall?.high || [])]
      .filter(Boolean).slice(0, 3);
    const targets = campaignTargets({
      saves: state.saves || {}, pool: call.bottom, living, bond: (x, y) => ctx.bond?.(x, y) || 0,
      likelyTop,
    });
    if (targets.length) {
      const camp = runCampaign({
        saves: state.saves || { kind: 'legacy', uses: [] }, targets, pool: call.bottom,
        living, players: Object.fromEntries(living.map(n => [n, P(n)])),
        bond: (x, y) => ctx.bond?.(x, y) || 0, rng, ep: cfg.num, state,
      });
      for (const e of camp.events) {
        werkEvents.push({ type: 'legacy:campaign', players: [e.a, e.b].filter(Boolean), ...e });
        scenes.push({
          step: 'untucked', kind: 'legacy:pitch',
          data: { players: [e.a, e.b].filter(Boolean), round: e.round },
          text: e.text || '',
        });
      }
      legacyPleas = camp.pleas;
    }
  }
```

Note: `callAtCall` is assigned later in the file for the top-two split. Hoist its
declaration above this block (`let callAtCall = null;`) if it is not already
above — check with `grep -n "callAtCall" js/dr/week.js` and move the `let` line,
not the assignment.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/dr-all-stars.test.js tests/dr-saves.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/dr/saves.js js/dr/week.js tests/dr-all-stars.test.js
git commit -m "feat(drag-race): the bottom campaigns before anybody holds the lipstick

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: The ceremony's scenes and its lines

**Files:**
- Create: `js/dr/data/legacy-beats.js`
- Modify: `js/dr/week.js:78` (`SCENE_STEPS`), and the legacy block from Task 7
- Test: `tests/dr-legacy.test.js` (append)

**Interfaces:**
- Consumes: `chooseElimination`'s `{ target, why, reason }` (Task 7).
- Produces: `LEGACY_BEATS` (`deliberate`, `reveal`, `roomAnswer`, `lastWords`)
  and `legacyLine(pool, vars)`; scenes on the new step `'legacy-choice'` with
  kinds `legacy:deliberate`, `legacy:reveal`, `legacy:room`, `legacy:last-words`.

- [ ] **Step 1: Write the failing test**

Append to `tests/dr-legacy.test.js`:

```js
import { playDragSeason } from '../js/dr/season.js';
import { LEGACY_BEATS, legacyLine } from '../js/dr/data/legacy-beats.js';
import { sceneSections } from '../js/vp-dr/screens.js';

describe('the ceremony', () => {
  it('has a line for every reason the decision can return', () => {
    for (const why of ['threat', 'panel', 'grudge']) {
      expect(LEGACY_BEATS.deliberate[why]?.length).toBeGreaterThan(0);
    }
    expect(LEGACY_BEATS.lastWords.length).toBeGreaterThan(0);
  });

  it('fills the names in', () => {
    const line = legacyLine(LEGACY_BEATS.reveal, { h: 'Ripper', x: 'Brightly' });
    expect(line).toContain('Brightly');
    expect(line).not.toContain('{');
  });

  it('files its scenes in their own section, after their marker', () => {
    const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
    const STATSL = ['physical', 'endurance', 'mental', 'social', 'strategic',
      'loyalty', 'boldness', 'intuition', 'temperament'];
    const cast = Array.from({ length: 10 }, (_, i) => ({
      name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
      archetype: ['villain', 'hero', 'floater', 'wildcard'][i % 4], age: 25 + i,
      stats: Object.fromEntries(STATSL.map((k, j) => [k, ((i + j) % 10) + 1])),
    }));
    const res = playDragSeason({
      cast, seed: 404, config: { drAllStars: true },
      bond: (a, b) => bonds[key(a, b)] || 0,
      addBond: (a, b, d) => { const k = key(a, b); bonds[k] = (bonds[k] || 0) + d; },
      popDelta: () => {},
    });
    const row = res.rows.filter(r => r.dr && !r.dr.finale)
      .find(r => (r.dr.scenes || []).some(s => s.kind === 'legacy:reveal'));
    expect(row).toBeTruthy();
    const list = row.dr.scenes;
    const iMarker = list.findIndex(s => s.step === 'legacy-choice');
    const iReveal = list.findIndex(s => s.kind === 'legacy:reveal');
    expect(iMarker).toBeGreaterThanOrEqual(0);
    expect(iReveal).toBeGreaterThanOrEqual(iMarker);
    const sections = sceneSections(list, row);
    const own = sections.find(s => (s.items || []).some(x => x.kind === 'legacy:reveal'));
    expect(own).toBeTruthy();
    expect(own.items.length).toBeGreaterThan(1);
  });

  it('gives the queen who never performed her own goodbye', () => {
    const bonds = {};
    const STATSL = ['physical', 'endurance', 'mental', 'social', 'strategic',
      'loyalty', 'boldness', 'intuition', 'temperament'];
    const cast = Array.from({ length: 10 }, (_, i) => ({
      name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
      archetype: 'wildcard', age: 25 + i,
      stats: Object.fromEntries(STATSL.map((k, j) => [k, ((i * j) % 10) + 1])),
    }));
    const res = playDragSeason({
      cast, seed: 77, config: { drAllStars: true },
      bond: () => 0, addBond: () => {}, popDelta: () => {},
    });
    const rows = res.rows.filter(r => r.dr?.lipsync?.legacy && r.dr.lipsync.eliminated);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      const words = (r.dr.scenes || []).filter(s => s.kind === 'legacy:last-words');
      expect(words.length).toBe(1);
      expect(words[0].data.players).toContain(r.dr.lipsync.eliminated);
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-legacy.test.js -t "ceremony"`
Expected: FAIL — `Failed to resolve import "../js/dr/data/legacy-beats.js"`.

- [ ] **Step 3: Write the pools**

```js
// js/dr/data/legacy-beats.js
// ══════════════════════════════════════════════════════════════════════
// dr/data/legacy-beats.js — the lipstick ceremony's lines
// ══════════════════════════════════════════════════════════════════════
//
// Its own file rather than js/dr/data/stage-beats.js, which is already ~1100
// lines with a guard suite walking all of it: a ritual only one season shape
// runs should be separable from the ones every season runs.
//
// `{h}` is the queen holding the lipstick, `{x}` the queen she names, `{p}`
// the bottom she chose out of. Names are filled at render time — never write
// one into a pool.
export const LEGACY_BEATS = {
  /* SHE GOES BACKSTAGE ALONE. Keyed by the reason js/dr/legacy.js actually
     returned, so the deliberation cannot argue for a different decision from
     the one the night recorded. */
  deliberate: {
    threat: [
      '{h} turns the two tubes over in her hands. One of these names is the only queen down there who could take this from her.',
      'Backstage, {h} is not thinking about tonight. She is thinking about the four weeks after it.',
    ],
    panel: [
      '{h} does not have to think for long. The panel said who the weakest of them was, out loud, twenty minutes ago.',
      '{h} weighs the tubes and finds the choice already made for her: the room ranked them, and she agrees with the room.',
    ],
    grudge: [
      '{h} has waited a long time to hold one of these with {x}\u2019s name on the other end of it.',
      'Backstage, {h} is very calm, and that is the part that should worry {x}.',
    ],
  },
  /* THE WALK BACK OUT, AND THE TUBE TURNED AROUND. */
  reveal: [
    '{h} walks back out with the lipstick closed in her fist, holds it up, and turns it around. It says {x}.',
    'The tube turns. {x}.',
    '{h} lets the room look at the back of her hand for a moment longer than it needs, then shows it: {x}.',
  ],
  /* HOW THE ROOM TAKES IT. Nobody sang, so there is nothing to blame but her. */
  roomAnswer: [
    'Nobody moves. There was no song to lose, so there is nothing to say about it.',
    'A sound goes through the room that is not quite a gasp \u2014 the bottom knew one of them was going and none of them knew which.',
    '{x} nods, once, like she had already worked it out.',
  ],
  /* HER LAST WORDS, AND WHY THEY ARE NOT `sashay-words`.
     That pool is written for a queen who just lip synced for her life and
     lost it. This queen performed nothing: she stood in a line and somebody
     else chose. It is a different exit and it needs its own voice. */
  lastWords: [
    '"I didn\u2019t get to fight for it," {x} says. "That\u2019s the part I\u2019ll be chewing on."',
    '"{h} played it exactly the way I\u2019d have played it," {x} says, and almost means it.',
    '"No song, no chance, no hard feelings," {x} says. Two of those are true.',
    '"I came back to prove something and I got sent home by somebody\u2019s strategy," {x} says. "Put that on the poster."',
  ],
};

/** One line, names filled. `pool` may be an array or a keyed bucket. */
export function legacyLine(pool, vars = {}, rng = Math.random) {
  const list = Array.isArray(pool) ? pool : [];
  if (!list.length) return '';
  const line = list[Math.floor(rng() * list.length) % list.length];
  return String(line).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}
```

- [ ] **Step 4: Add the step and push the scenes**

In `js/dr/week.js`, in `SCENE_STEPS`, change:

```js
  'critiques', 'untucked', 'results', 'save-campaign', 'save-hold', 'lipsync', 'save-luck', 'exit',
```

to:

```js
  /* `legacy-choice` is the All Stars ceremony: the winner of the song alone
     with the lipsticks, the reveal, and the goodbye of a queen who never
     performed. AFTER `lipsync`, because she wins the song before she spends
     it, and before `exit`. */
  'critiques', 'untucked', 'results', 'save-campaign', 'save-hold', 'lipsync',
  'legacy-choice', 'save-luck', 'exit',
```

Then in the legacy block from Task 7, after `lipsync.reason = choice.reason;`,
replace the single `say('lipsync', 'legacy-choice', …)` with the marker and the
four scenes, in order:

```js
          /* THE MARKER FIRST, THEN ITS SCENES. `sceneSections` files a scene
             by array position, so a scene pushed before its own marker lands
             in the previous section — which left "Elimination Day" empty on
             eight episodes of nine, once. */
          say('legacy-choice', 'legacy-choice', {
            winner: lc.winner, eliminated: choice.target, pool,
            why: choice.why, reason: choice.reason,
          });
          const lv = { h: lc.winner, x: choice.target, p: pool.join(', ') };
          const push = (kind, players, pool2) => scenes.push({
            step: 'legacy-choice', kind, data: { players, holder: lc.winner, ...lv },
            text: legacyLine(pool2, lv, rng),
          });
          push('legacy:deliberate', [lc.winner], LEGACY_BEATS.deliberate[choice.why] || LEGACY_BEATS.deliberate.panel);
          push('legacy:reveal', [lc.winner, choice.target], LEGACY_BEATS.reveal);
          push('legacy:room', [choice.target], LEGACY_BEATS.roomAnswer);
          push('legacy:last-words', [choice.target], LEGACY_BEATS.lastWords);
```

Add the import: `import { LEGACY_BEATS, legacyLine } from './data/legacy-beats.js';`

- [ ] **Step 5: Open a VP section for the ceremony**

In `js/vp-dr/screens.js`, find the SECTIONS registry and add an entry for the
new marker beside the lip sync's, so `sceneSections` opens a section on
`legacy-choice`:

```js
  { key: 'legacy', suffix: 'legacy', step: 'legacy-choice', phase: 'stage',
    title: 'The Lipstick', subtitle: 'the winner of the song decides',
    marker: 'legacy-choice' },
```

Match the exact field names the neighbouring entries use — read three of them
first and copy the shape rather than these names if they differ.

- [ ] **Step 6: Run the tests**

Run: `npx vitest run tests/dr-legacy.test.js tests/dr-all-stars.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add js/dr/data/legacy-beats.js js/dr/week.js js/vp-dr/screens.js tests/dr-legacy.test.js
git commit -m "feat(drag-race): the lipstick ceremony, and a goodbye for a queen who never sang

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: The lipstick wall — the screen

**Files:**
- Create: `js/vp-dr/legacy-stage.js`
- Modify: `js/vp-dr/screens.js` (render the stage for the new section)
- Test: `tests/dr-legacy-stage.test.js`

**Interfaces:**
- Consumes: the `legacy-choice` scenes (Task 9); `shell`, `engine`, `face`,
  `wireStage` from `js/vp-dr/finale-stage.js`.
- Produces: `LEGACY_STAGE_CSS`, `lipstickStage(row, list, { ep, bottom, uid }) -> { html, apply, states }`.

- [ ] **Step 1: Read the pattern before writing anything**

Read `docs/ADDING-A-SHOW.md` §6.5 and `js/vp-dr/room-stage.js` end to end. The
stage must: return `{ html, apply, states }` with one state per reveal step, be
wrapped in `<!--dr-chrome-->`, use `position:sticky; top:6px`, carry
`contain:inline-size; min-width:0; max-width:100%`, put the
`@media (max-height: 999px)` compact block LAST, and include a reduced-motion
block.

- [ ] **Step 2: Write the failing test**

```js
// tests/dr-legacy-stage.test.js
import { describe, expect, it } from 'vitest';
import { lipstickStage, LEGACY_STAGE_CSS } from '../js/vp-dr/legacy-stage.js';

const ep = { num: 5, format: 'drag-race' };

describe('the lipstick wall', () => {
  const bottom = ['Brightly', 'MK', 'Ripper'];
  const list = [
    { kind: 'legacy:deliberate', who: 'Julia' },
    { kind: 'legacy:reveal', who: 'Julia', target: 'MK' },
    { kind: 'legacy:room', who: 'MK' },
    { kind: 'legacy:last-words', who: 'MK' },
  ];

  it('stands a tube up for every queen in the bottom', () => {
    const st = lipstickStage({ num: 5 }, list, { ep, bottom, uid: 't1' });
    for (const q of bottom) expect(st.html).toContain(q);
  });

  it('never says whose name is on the lipstick before it is turned around', () => {
    const st = lipstickStage({ num: 5 }, list, { ep, bottom, uid: 't2' });
    // The markup may name the bottom (they are standing there) but must not
    // mark one as chosen at rest.
    expect(st.html).not.toMatch(/class="[^"]*\bchosen\b/);
    expect(st.states[0].chosen).toBeFalsy();
    expect(st.states[1].chosen).toBe('MK');
  });

  it('has one state per step, and a compact block last', () => {
    const st = lipstickStage({ num: 5 }, list, { ep, bottom, uid: 't3' });
    expect(st.states).toHaveLength(list.length);
    const i = LEGACY_STAGE_CSS.lastIndexOf('@media (max-height: 999px)');
    expect(i).toBeGreaterThan(-1);
    expect(LEGACY_STAGE_CSS.slice(i)).not.toMatch(/@media \(min-width/);
    expect(LEGACY_STAGE_CSS).toMatch(/prefers-reduced-motion/);
    expect(LEGACY_STAGE_CSS).toMatch(/contain:\s*inline-size/);
  });
});
```

- [ ] **Step 3: Run it to make sure it fails**

Run: `npx vitest run tests/dr-legacy-stage.test.js`
Expected: FAIL — module not found.

- [ ] **Step 4: Build the stage**

Create `js/vp-dr/legacy-stage.js`, importing `shell`, `engine`, `face`, `esc`
and `wireStage` from `./finale-stage.js` exactly as `js/vp-dr/night-stage.js`
does. The stage is:

- a dressing-room counter, dark, with one **lipstick tube** standing per bottom
  queen — inline SVG for the tube (never CSS divs for an object), her name on a
  card at its base, all of them unlit at rest;
- state `legacy:deliberate` — the counter lit, the holder's face at the mirror,
  the tubes in shadow, one picked up and turned over in the hand;
- state `legacy:reveal` — the chosen tube rises, rotates to face the room, its
  name card flips from blank to the name, and a `--fx` glow lands on that queen;
- state `legacy:room` — the other tubes fall back to the counter;
- state `legacy:last-words` — the chosen queen's face alone, the counter dim.

The one-shot effects (the rotation, the flip) play only when `fresh`, per §6.5;
`engine()` paints the whole state every time so a re-render does not replay
them. `states[i].chosen` is null until the reveal step — that is what the
spoiler test asserts.

- [ ] **Step 5: Wire it into the section**

In `js/vp-dr/screens.js`, in the builder for the `legacy` section, build the
stage from the section's own scene list and call `wireStage('legacy', st, ep, _state)`,
following exactly what the runway/critiques sections do (`js/vp-dr/stage.js`).
Include `LEGACY_STAGE_CSS` in the `<style>` block for that screen only.

- [ ] **Step 6: Run the tests**

Run: `npx vitest run tests/dr-legacy-stage.test.js tests/dr-vp-spoilers.test.js`
Expected: `dr-legacy-stage` PASS. `dr-vp-spoilers` must not gain failures —
it has two pre-existing ones (the smackdown champion plinth and
`dr-vp-stage`'s "final rank"); compare against
`git stash && npx vitest run tests/dr-vp-spoilers.test.js` if unsure.

- [ ] **Step 7: Look at it in a browser**

The server is already running (`python serve.py 8080`). Play an All Stars season
in the app, open the Lipstick screen, and check it at **1100×900, 946×720 and
400×800** with Playwright. Screenshots must be written under
`dc-franchise-db/.playwright-mcp`. Confirm: nothing is lit before the first
reveal, the chosen tube's name is unreadable until it turns, no horizontal
scroll at 400px, and the stage stays pinned while the cards scroll.

- [ ] **Step 8: Commit**

```bash
git add js/vp-dr/legacy-stage.js js/vp-dr/screens.js tests/dr-legacy-stage.test.js
git commit -m "feat(drag-race): the lipstick wall, one tube per queen in the bottom

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: The arrivals read her past

**Files:**
- Modify: `js/dr/arrivals.js:83` (`arrivalScenes`), `js/dr/week.js` (pass the
  pasts through to it)
- Test: `tests/dr-all-stars.test.js` (append)

**Interfaces:**
- Consumes: `state.allStars.pasts` (Task 2).
- Produces: `arrivalScenes({ …, pasts = {} })` — an extra beat, kind
  `arrival:resume`, and `data.past` on the `walk` beat.

- [ ] **Step 1: Write the failing test**

Append to `tests/dr-all-stars.test.js`:

```js
describe('the arrivals, on All Stars', () => {
  it('say what she already did', () => {
    const res = season(31, { drAllStars: true });
    const premiere = res.rows.find(r => r.dr && !r.dr.finale);
    const resumes = (premiere.dr.scenes || []).filter(s => s.kind === 'arrival:resume');
    expect(resumes.length).toBeGreaterThan(4);
    for (const s of resumes) {
      expect(s.text.length).toBeGreaterThan(10);
      expect(s.text).not.toMatch(/\{/);
    }
  });

  it('do not, on an ordinary season', () => {
    const premiere = season(31).rows.find(r => r.dr && !r.dr.finale);
    expect((premiere.dr.scenes || []).filter(s => s.kind === 'arrival:resume')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-all-stars.test.js -t "arrivals, on All Stars"`
Expected: FAIL — no `arrival:resume` scenes.

- [ ] **Step 3: Add the beat**

In `js/dr/arrivals.js`, accept `pasts = {}` in `arrivalScenes`'s options, and
after the `intro` beat for each queen, push:

```js
    /* ── WHAT THE ROOM ALREADY KNOWS ABOUT HER ──────────────────────
       All Stars' premiere is not an introduction: the room knows who won
       what. So the entrance carries her record rather than a first
       impression. Skipped entirely when there is no past — an ordinary
       season's premiere is unchanged, beat for beat. */
    const past = pasts[name];
    if (past) {
      const place = past.rank === 1 ? 'won it'
        : past.rank === 2 ? 'came second'
          : `went out ${past.rank}${past.rank === 3 ? 'rd' : 'th'} of ${past.of}`;
      const wins = past.wins === 1 ? 'one maxi win'
        : past.wins > 1 ? `${past.wins} maxi wins` : 'no wins at all';
      out.push({
        step: 'arrivals', kind: 'arrival:resume',
        data: { players: [name], past, confessional: false },
        text: `Season ${past.season}: she ${place}, with ${wins}. ${past.business[0].toUpperCase()}${past.business.slice(1)}.`,
      });
    }
```

Match the local variable names (`out`, `name`) to the surrounding code — read the
beat above it first.

In `js/dr/week.js`, at the `arrivalScenes({ … })` call site, add
`pasts: state.allStars?.pasts || {}`.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/dr-all-stars.test.js tests/dr-arrivals.test.js`
Expected: PASS. (If `tests/dr-arrivals.test.js` does not exist, skip it.)

- [ ] **Step 5: Commit**

```bash
git add js/dr/arrivals.js js/dr/week.js tests/dr-all-stars.test.js
git commit -m "feat(drag-race): an All Stars entrance carries her record, not a first impression

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Craft write-back, the measurements, and the docs

**Files:**
- Modify: `js/stats-export.js:2422` (`exportDragRaceSeason`),
  `tests/dr-spec-audit.test.js`, `docs/drag-race.md`
- Test: `tests/dr-all-stars.test.js` (append)

**Interfaces:**
- Consumes: `state.allStars.craft` (Task 2).
- Produces: `seasonDetails[].dr.craft` on each appearance — so the *next* All
  Stars casts a queen with the craft she actually played with.

- [ ] **Step 1: Write the failing test**

Append to `tests/dr-all-stars.test.js`:

```js
import { exportDragRaceSeason } from '../js/stats-export.js';

describe('what the season leaves behind', () => {
  it('records the craft each queen actually played with', () => {
    const res = season(41, { drAllStars: true });
    const doc = exportDragRaceSeason
      ? exportDragRaceSeason({ rows: res.rows, state: res.state, seasonNumber: 2 })
      : null;
    if (!doc) return; // exporter not reachable headless; covered by the app test
    const details = doc.seasonDetails || [];
    expect(details.length).toBeGreaterThan(0);
    for (const d of details) {
      expect(d.dr?.craft).toBeTruthy();
      expect(new Set(Object.values(d.dr.craft)).size).toBeGreaterThan(1);
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-all-stars.test.js -t "leaves behind"`
Expected: FAIL — `expected undefined to be truthy` on `d.dr.craft`.

- [ ] **Step 3: Write the craft onto the appearance**

In `js/stats-export.js`, where `exportDragRaceSeason` builds each queen's `dr`
block in `seasonDetails`, add:

```js
      /* ── THE CRAFT SHE PLAYED WITH, ON THE APPEARANCE ──────────────
         Not only on the roster row. An author may change a queen between
         seasons, and All Stars casts from her most recent appearance, so the
         record has to say what she was THAT season. Written for every drag
         season, not only All Stars: the mode is what needs it, but the fact
         is true of all of them.
         Related hazard: franchise_roster.json is regenerated wholesale from
         D1 and has eaten authored fields twice, so this lives on the
         appearance where a publish cannot reach it. */
      craft: (state?.allStars?.craft?.[name])
        || Object.fromEntries(Object.entries(playerOf(name)?.drag || {})
          .filter(([, v]) => typeof v === 'number')),
```

Match `playerOf`/`name` to the surrounding code's own accessors.

- [ ] **Step 4: Add the measurements**

In `tests/dr-spec-audit.test.js`, add an All Stars block that plays 40 seasons
with `{ drAllStars: true }` and prints, beside each number, the line the real
show suggests:

```js
  /* ── ALL STARS ── the numbers to watch, and why each one is here.
     Per this project's history every real defect on this show came from this
     audit or from reading output — not one from a passing suite going red. */
  it('All Stars: who the lipstick actually goes to', () => {
    const N = 40;
    let choices = 0, panelLast = 0, threat = 0, grudge = 0, repeatBottom = 0;
    const perHolder = {};
    for (let s = 1; s <= N; s++) {
      const res = season(s, { drAllStars: true });
      const seenBottom = {};
      for (const r of res.rows.filter(x => x.dr?.lipsync?.legacy && x.dr.lipsync.eliminated)) {
        choices++;
        if (r.dr.lipsync.why === 'panel') panelLast++;
        if (r.dr.lipsync.why === 'threat') threat++;
        if (r.dr.lipsync.why === 'grudge') grudge++;
        perHolder[r.dr.lipsync.chosenBy] = (perHolder[r.dr.lipsync.chosenBy] || 0) + 1;
        for (const q of (r.dr.call?.bottom || [])) {
          if (seenBottom[q]) repeatBottom++;
          seenBottom[q] = true;
        }
      }
    }
    const pc = n => `${(n / Math.max(1, choices) * 100).toFixed(1)}%`;
    console.log(`  legacy choices: ${choices} over ${N} seasons`);
    console.log(`  the panel's last: ${pc(panelLast)}  (the polite answer; the real seasons lean here)`);
    console.log(`  the biggest threat: ${pc(threat)}   (AS2-AS4 read as roughly a third)`);
    console.log(`  an old grudge: ${pc(grudge)}`);
    console.log(`  named in the bottom twice: ${repeatBottom}`);
    const top = Object.values(perHolder).sort((a, b) => b - a)[0] || 0;
    console.log(`  the busiest holder held ${top} of them (domination watch)`);
    expect(choices).toBeGreaterThan(N);
  });
```

- [ ] **Step 5: Run the audit and READ the output**

Run: `npm run audit:dr-spec`

Read the printed numbers. The one to distrust is "the biggest threat": if it is
near 0% or near 100%, the coefficients in `js/dr/legacy.js` are not doing what
the test in Task 7 suggested — the suite can pass on two seeds and still be
degenerate over forty seasons. Then print a real transcript and read it:

```bash
node -e "1" # then play a season in the app and read its backlog end to end
```

Check specifically: does any sentence imply a vote? Does anything claim a bottom
queen lip synced? Is the eliminated queen ever named before the reveal?

- [ ] **Step 6: Update the docs**

In `docs/drag-race.md`:
- add the mode to **The format** (the weekly order on a legacy night, and that
  the panel no longer ends anybody);
- add `BTM3` to the chart's table, with the "named for elimination, and not
  chosen" wording and the note that `BTM2` means two different things in two
  different shapes, resolved by `resultMeta`;
- rewrite TODO item 7: pass 1 shipped, and the extras (Revenge of the Queens,
  the Jury of Queer Peers, the double win) are pass 2, mode-locked;
- note that items 4 and 6 of that list are now part of the shipped mode.

- [ ] **Step 7: Commit and sync**

```bash
git add js/stats-export.js tests/dr-spec-audit.test.js tests/dr-all-stars.test.js docs/drag-race.md
git commit -m "feat(drag-race): the craft she played with survives the season, and the All Stars measurements

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"

# Sync, in this order. Never touch the other session's uncommitted files in the
# main repo.
git push origin drag-race
cd /c/Users/yanna/OneDrive/Documents/GitHub/dc-franchise-db
git merge --ff-only drag-race || {
  cd /c/Users/yanna/OneDrive/Documents/GitHub/worktree-drag-race
  git merge --no-edit main && git push origin drag-race
  cd /c/Users/yanna/OneDrive/Documents/GitHub/dc-franchise-db && git merge --ff-only drag-race
}
git push origin main
git rev-list --left-right --count main...drag-race   # must print "0  0"
```

---

## Self-Review

**Spec coverage**

| spec section | task |
|---|---|
| §1 the law (no vote) | Global Constraints; Task 7's header comment; Task 12 step 5 reads output for it |
| §2 mode + rule dropdown, extensible | Task 2 |
| §2 `save` = the built Beaver/Baguette | Task 2 (the dropdown's third option); no engine work, as specified |
| §2 the endgame folds itself | Task 3 |
| §3 craft round trip + not-flat guard | Task 1 (`craftIsFlat`, `derivedCraft`), Task 2 (applied at cast), Task 12 (write-back) |
| §4 the mode and the shape | Tasks 2, 3 |
| §4 the spared queen's cell | Tasks 4, 5 |
| §4.5 the arrivals | Tasks 1, 11 |
| §5 the lipstick ceremony, its own section, its own beats file | Tasks 9, 10 |
| §5 the reader learns with the queen | Task 10 step 2's spoiler test, step 7's browser check |
| §6 Untucked as the campaign floor | Task 8 |
| §6 the power ledger, unwelded | Task 6 |
| §6 the read (threat, grudge, bond, panel rank, archetype) | Task 7 |
| §7 the era-B extras | **pass 2, not in this plan** — deliberate |
| §9 measurements | Task 12 |

**Deliberately deferred to pass 2** (spec §6's alliance extraction, §7's three
extras). The alliance bloc extraction from `js/tr/alliances.js` is *not* in pass
1: `chooseElimination` reads bond directly, which is a strict subset of what a
bloc would tell it, so the extraction is additive rather than blocking. Note it
in the pass-2 plan, with the Traitors suite as its guard.

**Placeholders:** none. Every code step carries the code. Two steps
(Task 10 step 4, Task 12 step 3) describe a structure and name the file to copy
the shape from rather than inventing names for code the executor must read
first — both say exactly which file and which lines.

**Type consistency:** `initLedger` / `recordUse` / `timesSpared` /
`deliveredSince` / `powerMind` are used under those names in Tasks 6, 7 and 8;
`saves.js` re-exports `holderMind` and `timesSaved` for the existing callers.
`chooseElimination` returns `{ target, why, reason }` in Task 7 and is consumed
with those three fields in Tasks 7 (week.js), 9 (beats keyed by `why`) and 12
(the audit reads `lipsync.why`). `resultMeta(result, { shape })` is defined in
Task 4 and used in Task 4 only. `state.allStars = { rule, pasts, craft }` is
written in Task 2 and read in Tasks 5, 7, 11 and 12 under those keys.
