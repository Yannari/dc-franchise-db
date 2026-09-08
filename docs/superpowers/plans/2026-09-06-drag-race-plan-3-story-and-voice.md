# Drag Race Plan 3 — Storylines, the werk room, Untucked, and the words

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the season a story and a voice. The storyline tracker assigns arcs and feeds the host's bend; the werk room and Untucked turn the social engine into scenes with consequences; the critique twists run; and every scene the engine has been emitting as `{ step, kind, data }` since Plan 1 gets real prose, in the show's own vocabulary, archetype-driven, with enough variants that a season does not repeat itself.

**Architecture:** Three engine modules (`storylines.js`, `social.js`, `untucked.js`) and a text layer under `js/dr/text/`. The text layer is a pure function of a scene: `render(scene, ctx) → string`, with one pool file per scene `kind`. Nothing in the engine may build a sentence, and nothing in the text layer may decide an outcome — that separation is what lets prose be rewritten without touching a result, and it is what `tests/dr-text-purity.test.js` enforces.

**Tech Stack:** ES modules, no build step, vitest. Prose pools are written by an Opus writing subagent per the user's standing instruction (memory `feedback_opus_for_writing`): dispatch the pool, review the output, commit it. The engine code around them is ordinary implementation work.

**Spec:** `docs/superpowers/specs/2026-09-06-drag-race-design.md` §5, §6.5, §6.6, §7

**Depends on:** Plans 1 and 2, complete.

## Global Constraints

- Everything in Plan 1's Global Constraints still applies, with the trailer
  ```
  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Y4XaJLLRHojvnzFuEVJsAt
  ```
- **The vocabulary is the registry's.** Every noun a pool uses comes from `showWords('drag-race')` or is a drag noun on the guard's own list (`queen`, `runway`, `lip sync`, `werk room`, `untucked`, `shantay`, `sashay`, `maxi challenge`, `main stage`). No `tribe`, `camp`, `house`, `jury`, `merge`, `evicted`, `nominated`, `banished`, `castle`, `mission` — in either direction. `tests/show-vocabulary.test.js` walks this show automatically and `tests/dr-prose.test.js` (Task 11) reads real output.
- **Four variants minimum per narration category**, and archetype-driven: a villain, a hero and a goat react differently to the same event. `_pickUnique` prevents a repeat inside one episode.
- **A character never says what she cannot know.** Critique lines come from the judge's own view; werk room lines come from that queen's own bonds and record; nothing reads the panel's ranking before the critiques, and nothing reads star power at all — it is hidden from the cast by construction.
- **Read the output.** Task 11 dumps a full season transcript and requires a human read. Every prose bug in this project's history was found that way and none by an assertion.

## File map

| File | Responsibility |
|---|---|
| `js/dr/storylines.js` | arc assignment, beats, `storylineNeed`, flips |
| `js/dr/social.js` | werk room beats: cold open, morning, elimination day |
| `js/dr/untucked.js` | the lounge, amplified by the critiques |
| `js/dr/critiques.js` | per-judge lines, the twists, reactions as scenes |
| `js/dr/text/index.js` | `renderScene`, `_pickUnique`, the pool registry |
| `js/dr/text/pools/*.js` | one file per scene kind |
| `js/dr/text/voices.js` | judge voice shaping, queen voice shaping |
| `js/dr/transcript.js` | the episode text backlog |
| `js/dr/week.js` | calls all of the above in the right steps |

---

### Task 1: The storyline tracker

**Files:**
- Create: `js/dr/storylines.js`
- Test: `tests/dr-storylines.test.js`

**Interfaces:**
- Consumes: `state` (Plan 1 Task 10), `craftMean`/`starPower` (Plan 1 Task 3), bonds.
- Produces:
  - `ARCS = ['frontrunner','underdog','villain','fighter','rivalry','sisters','robbed']`
  - `assignStorylines({ cast, state, bond, rng }) → [{ id, arc, players: [names], since: 1, beats: [], alive: true }]` — at season start: `frontrunner` = highest `craftMean × star`; `underdog` = low star, mid craft; `villain` = a villain/schemer archetype with the highest boldness; `rivalry` = the lowest-bond pair among high-star queens; `sisters` = the highest-bond pair. `fighter` and `robbed` are **earned**, not assigned, so they are absent at episode 1.
  - `storylineNeed(storylines, { living, episode, totalEpisodes, state }) → { [name]: -1..1 }` — what each arc wants THIS week, bounded: the frontrunner wants early wins and one mid-season stumble; the underdog wants a win around 60% of the way through; the villain wants to survive to the back half; the fighter wants the benefit of a toss-up; the rivalry wants both in the same call; the sisters want neither in the bottom against the other; the robbed queen wants nothing (she is a label the audience applies, not an agenda).
  - `recordBeat(storylines, { episode, row, state }) → storylines` — after a week: appends beats, earns `fighter` (two lip sync wins), earns `robbed` (bent down two places twice), flips `villain` → `redeemed` on a `help` event plus a top placement, kills an arc whose player has left, and marks `frontrunner` `stumbled` on a bottom-two.
  - `arcSummary(storylines) → [{ arc, players, beats: n, alive }]` for the screens.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-storylines.test.js
import { describe, expect, it } from 'vitest';
import { ARCS, assignStorylines, storylineNeed, recordBeat, arcSummary } from '../js/dr/storylines.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}, over = {}) => ({ name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag }, ...over });

const CAST = [
  mk('Star', { acting: 9, comedy: 9, dance: 9, design: 9, runway: 9, lipsync: 9, singing: 9 }),
  mk('Mouse', { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5 }, { archetype: 'floater' }),
  mk('Snake', {}, { archetype: 'villain', stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), boldness: 10 } }),
  mk('Foe', {}, { archetype: 'wildcard' }),
  mk('Sis', {}), mk('Kid', {}),
];
const state = () => ({ record: Object.fromEntries(CAST.map(p => [p.name, []])),
  star: { Star: 9, Mouse: 2, Snake: 8, Foe: 7, Sis: 5, Kid: 4 },
  lipsyncRecord: Object.fromEntries(CAST.map(p => [p.name, []])), out: [] });
const bonds = { 'Foe|Snake': -8, 'Kid|Sis': 8 };
const bond = (a, b) => bonds[[a, b].sort().join('|')] || 0;

describe('assignStorylines', () => {
  const sl = assignStorylines({ cast: CAST, state: state(), bond, rng: rngFor(1) });
  it('assigns the four opening arcs and not the two earned ones', () => {
    const arcs = sl.map(s => s.arc);
    expect(arcs).toContain('frontrunner');
    expect(arcs).toContain('underdog');
    expect(arcs).toContain('villain');
    expect(arcs).toContain('rivalry');
    expect(arcs).toContain('sisters');
    expect(arcs).not.toContain('fighter');
    expect(arcs).not.toContain('robbed');
    for (const a of arcs) expect(ARCS).toContain(a);
  });
  it('picks the right people', () => {
    expect(sl.find(s => s.arc === 'frontrunner').players).toEqual(['Star']);
    expect(sl.find(s => s.arc === 'villain').players).toEqual(['Snake']);
    expect(sl.find(s => s.arc === 'rivalry').players.sort()).toEqual(['Foe', 'Snake']);
    expect(sl.find(s => s.arc === 'sisters').players.sort()).toEqual(['Kid', 'Sis']);
  });
});

describe('storylineNeed', () => {
  it('is bounded and only names living queens', () => {
    const sl = assignStorylines({ cast: CAST, state: state(), bond, rng: rngFor(1) });
    const need = storylineNeed(sl, { living: ['Star', 'Mouse', 'Snake'], episode: 3, totalEpisodes: 10, state: state() });
    for (const [n, v] of Object.entries(need)) {
      expect(['Star', 'Mouse', 'Snake']).toContain(n);
      expect(v).toBeGreaterThanOrEqual(-1); expect(v).toBeLessThanOrEqual(1);
    }
  });
  it('wants the frontrunner up early and the underdog up at the turn', () => {
    const sl = assignStorylines({ cast: CAST, state: state(), bond, rng: rngFor(1) });
    const living = CAST.map(p => p.name);
    const early = storylineNeed(sl, { living, episode: 2, totalEpisodes: 10, state: state() });
    const mid = storylineNeed(sl, { living, episode: 6, totalEpisodes: 10, state: state() });
    expect(early.Star).toBeGreaterThan(0);
    expect(mid.Mouse).toBeGreaterThan(early.Mouse);
  });
});

describe('recordBeat', () => {
  const base = () => assignStorylines({ cast: CAST, state: state(), bond, rng: rngFor(1) });
  const row = over => ({ num: 1, dr: { call: { win: [], high: [], safe: [], low: [], bottom: [] },
    bend: [], lipsync: null, events: [], ...over } });

  it('earns the fighter after two lip sync wins', () => {
    const st = state(); st.lipsyncRecord.Kid = ['W', 'W'];
    const sl = recordBeat(base(), { episode: 4, row: row({}), state: st });
    expect(sl.find(s => s.arc === 'fighter')?.players).toEqual(['Kid']);
  });
  it('earns the robbed queen after two downward bends', () => {
    let sl = base(); const st = state();
    for (const ep of [2, 3]) sl = recordBeat(sl, { episode: ep, state: st,
      row: row({ bend: [{ name: 'Sis', panelRank: 1, finalRank: 3 }] }) });
    expect(sl.find(s => s.arc === 'robbed')?.players).toEqual(['Sis']);
  });
  it('flips the villain when she helps somebody and lands on top', () => {
    const sl = recordBeat(base(), { episode: 5, state: state(),
      row: row({ call: { win: ['Snake'], high: [], safe: [], low: [], bottom: [] },
        events: [{ type: 'help', players: ['Snake', 'Kid'] }] }) });
    const v = sl.find(s => s.arc === 'villain');
    expect(v.flipped).toBe('redeemed');
    expect(v.beats.some(b => b.kind === 'redemption')).toBe(true);
  });
  it('kills an arc when its queen goes home, and records a stumble', () => {
    const st = state(); st.out = ['Star'];
    const sl = recordBeat(base(), { episode: 6, state: st,
      row: row({ call: { win: [], high: [], safe: [], low: [], bottom: ['Star', 'Kid'] } }) });
    const f = sl.find(s => s.arc === 'frontrunner');
    expect(f.beats.some(b => b.kind === 'stumble')).toBe(true);
    expect(f.alive).toBe(false);
  });
  it('summarises for a screen', () => {
    const s = arcSummary(base());
    expect(s.length).toBeGreaterThan(3);
    for (const x of s) { expect(x.arc).toBeTruthy(); expect(Array.isArray(x.players)).toBe(true); }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-storylines.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```js
// js/dr/storylines.js — the season's arcs (spec §7)
//
// An arc WANTS things, and what it wants reaches the week only through
// `storylineNeed` → `hostBend`, which is bounded (Plan 1 Task 8). Nothing here
// can send anybody home or hand anybody a win: it can lean, and the screen
// shows the lean beside the panel's own ranking.
import { craftMean } from './queen.js';

export const ARCS = ['frontrunner', 'underdog', 'villain', 'fighter', 'rivalry', 'sisters', 'robbed'];

const VILLAINOUS = new Set(['villain', 'mastermind', 'schemer']);

export function assignStorylines({ cast, state, bond, rng }) {
  const names = cast.map(p => p.name);
  const star = n => state.star?.[n] ?? 5;
  const out = [];
  const add = (arc, players, extra = {}) => out.push({ id: `${arc}-1`, arc, players, since: 1, beats: [], alive: true, ...extra });

  const byPresence = [...cast].sort((a, b) => (craftMean(b) * star(b.name)) - (craftMean(a) * star(a.name)));
  add('frontrunner', [byPresence[0].name]);

  // Low star, middling craft: somebody the room is not watching yet.
  const under = [...cast].filter(p => p.name !== byPresence[0].name)
    .sort((a, b) => (star(a.name) - craftMean(a) * 0.3) - (star(b.name) - craftMean(b) * 0.3))[0];
  if (under) add('underdog', [under.name]);

  const villain = [...cast].filter(p => VILLAINOUS.has(p.archetype))
    .sort((a, b) => (Number(b.stats?.boldness) || 5) - (Number(a.stats?.boldness) || 5))[0];
  if (villain) add('villain', [villain.name]);

  let worst = null, best = null;
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = names[i], b = names[j], v = bond(a, b);
      const heat = star(a) + star(b);
      if (v <= -5 && (!worst || v < worst.v || (v === worst.v && heat > worst.heat))) worst = { a, b, v, heat };
      if (v >= 5 && (!best || v > best.v)) best = { a, b, v };
    }
  }
  if (worst) add('rivalry', [worst.a, worst.b].sort());
  if (best) add('sisters', [best.a, best.b].sort());
  void rng;
  return out;
}

/** What each arc wants this week, as a bend input in [-1, 1]. */
export function storylineNeed(storylines, { living, episode, totalEpisodes, state }) {
  const need = Object.fromEntries(living.map(n => [n, 0]));
  const phase = totalEpisodes > 1 ? (episode - 1) / (totalEpisodes - 1) : 0;   // 0 → 1
  const bump = (n, v) => { if (n in need) need[n] = Math.max(-1, Math.min(1, need[n] + v)); };

  for (const s of storylines) {
    if (!s.alive) continue;
    const [a, b] = s.players;
    switch (s.arc) {
      case 'frontrunner':
        // Up early, and one stumble in the middle third — once.
        if (phase < 0.35) bump(a, 0.5);
        else if (phase < 0.65 && !s.beats.some(x => x.kind === 'stumble')) bump(a, -0.35);
        break;
      case 'underdog': {
        // A win around 60% of the way in, and more urgently if she has none.
        const won = (state.record?.[a] || []).includes('WIN');
        if (!won) bump(a, Math.max(0, 1 - Math.abs(phase - 0.6) * 3) * 0.7);
        break;
      }
      case 'villain':
        if (phase < 0.7) bump(a, 0.25);
        else bump(a, -0.2);
        break;
      case 'fighter':
        bump(a, 0.4);
        break;
      case 'rivalry':
        // Both of them in the same conversation: lean both toward the middle
        // ranks so a shared call is likelier than one high and one gone.
        bump(a, 0.15); bump(b, 0.15);
        break;
      case 'sisters':
        // Keep them apart from a lip sync against each other, for now.
        if (phase < 0.75) { bump(a, 0.1); bump(b, 0.1); }
        break;
      default: break;   // 'robbed' is a label, not an agenda
    }
  }
  return need;
}

export function recordBeat(storylines, { episode, row, state }) {
  const call = row.dr?.call || { win: [], high: [], low: [], bottom: [] };
  const bend = row.dr?.bend || [];
  const events = row.dr?.events || [];
  const out = storylines.map(s => ({ ...s, beats: [...s.beats], players: [...s.players] }));
  const find = arc => out.find(s => s.arc === arc);
  const beat = (s, kind, data = {}) => s.beats.push({ episode, kind, ...data });

  for (const s of out) {
    const [a, b] = s.players;
    if (s.arc === 'frontrunner') {
      if (call.win.includes(a)) beat(s, 'win');
      if (call.bottom.includes(a)) beat(s, 'stumble');
    }
    if (s.arc === 'underdog' && call.win.includes(a)) beat(s, 'breakthrough');
    if (s.arc === 'villain') {
      const helped = events.some(e => e.type === 'help' && e.players[0] === a);
      if (helped && (call.win.includes(a) || call.high.includes(a))) {
        s.flipped = 'redeemed';
        beat(s, 'redemption');
      } else if (events.some(e => ['sabotage', 'stole-a-bit', 'spotlight-hog', 'dump'].includes(e.type) && e.players[0] === a)) {
        beat(s, 'villainy', { event: events.find(e => e.players[0] === a).type });
      }
    }
    if (s.arc === 'rivalry' && [a, b].every(n => [...call.win, ...call.high, ...call.low, ...call.bottom].includes(n))) {
      beat(s, 'collision');
    }
    if (s.arc === 'sisters' && call.bottom.includes(a) && call.bottom.includes(b)) beat(s, 'sisters-in-the-bottom');
    // An arc whose people are gone is over.
    if (s.players.some(n => (state.out || []).includes(n))) s.alive = false;
  }

  // Earned: the fighter.
  if (!find('fighter')) {
    const fighter = Object.entries(state.lipsyncRecord || {})
      .find(([, r]) => r.filter(x => x === 'W').length >= 2);
    if (fighter) out.push({ id: 'fighter-1', arc: 'fighter', players: [fighter[0]], since: episode,
      beats: [{ episode, kind: 'earned' }], alive: true });
  }

  // Earned: the robbed queen. Two downward bends of two places or more.
  const downs = (state._drBendDowns ||= {});
  for (const x of bend) if (x.finalRank - x.panelRank >= 2) downs[x.name] = (downs[x.name] || 0) + 1;
  if (!find('robbed')) {
    const robbed = Object.entries(downs).find(([, c]) => c >= 2);
    if (robbed) out.push({ id: 'robbed-1', arc: 'robbed', players: [robbed[0]], since: episode,
      beats: [{ episode, kind: 'earned' }], alive: true });
  }
  return out;
}

export function arcSummary(storylines) {
  return storylines.map(s => ({ arc: s.arc, players: [...s.players], beats: s.beats.length,
    alive: !!s.alive, flipped: s.flipped || null }));
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-storylines.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/dr/storylines.js tests/dr-storylines.test.js
git commit -m "feat(drag-race): the storyline tracker — five opening arcs, two earned, bounded wants"
```

---

### Task 2: Wire the storylines into the week

**Files:**
- Modify: `js/dr/week.js` (the `storylineNeed` placeholder from Plan 1, and the row)
- Modify: `js/dr/season.js` (assign at season start, record after each week)
- Modify: `js/dr/state.js` (`storylines: []` already declared; add `_drBendDowns: {}`)
- Test: `tests/dr-storyline-wiring.test.js`

**Interfaces:**
- Consumes: Task 1.
- Produces: `row.dr.storylines` — the arc summary AT THAT EPISODE (a snapshot, not the live list, so a replayed episode 4 shows episode 4's arcs); `row.dr.storylineNeed` — what the tracker asked for, so the screen can show the lean; `state.storylines` — the live list.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-storyline-wiring.test.js
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'mastermind', 'goat'];
function cast(n = 12, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: ARCH[i % ARCH.length], age: 20 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}

describe('storylines in a played season', () => {
  const { rows, state } = playDragSeason({ cast: cast(12, 3), seed: 5 });

  it('every episode snapshots its own arcs', () => {
    for (const row of rows) {
      expect(Array.isArray(row.dr.storylines)).toBe(true);
      expect(row.dr.storylines.length).toBeGreaterThan(0);
      for (const s of row.dr.storylines) expect(s.arc).toBeTruthy();
    }
  });
  it('the snapshot grows over the season rather than being the same list', () => {
    const first = rows[0].dr.storylines.reduce((s, x) => s + x.beats, 0);
    const last = rows[rows.length - 2].dr.storylines.reduce((s, x) => s + x.beats, 0);
    expect(last).toBeGreaterThan(first);
  });
  it('records what the tracker asked for, so a screen can show the lean', () => {
    const need = rows[2].dr.storylineNeed;
    expect(need).toBeTruthy();
    for (const v of Object.values(need)) { expect(v).toBeGreaterThanOrEqual(-1); expect(v).toBeLessThanOrEqual(1); }
  });
  it('an arc whose queen leaves is marked dead, not deleted', () => {
    const dead = state.storylines.filter(s => !s.alive);
    const gone = new Set(state.out);
    for (const s of dead) expect(s.players.some(n => gone.has(n))).toBe(true);
  });
  it('most seasons get at least one arc to a second beat', () => {
    let ok = 0;
    for (let s = 0; s < 20; s++) {
      const out = playDragSeason({ cast: cast(12, 100 + s), seed: s });
      if (out.state.storylines.some(x => x.beats.length >= 2)) ok++;
    }
    expect(ok / 20).toBeGreaterThan(0.7);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-storyline-wiring.test.js`
Expected: FAIL — `row.dr.storylines` is undefined.

- [ ] **Step 3: Wire it**

In `js/dr/season.js`, after `initDragState`:

```js
import { assignStorylines, storylineNeed, recordBeat, arcSummary } from './storylines.js';
...
  state.storylines = assignStorylines({ cast, state, bond, rng });
```

Pass the total episode count and the tracker into each week: `_weekCfg(..., { totalEpisodes: weeks + 1 })`, and after every `runDragWeek` and the finale:

```js
    state.storylines = recordBeat(state.storylines, { episode: row.num, row, state });
```

In `js/dr/week.js`, replace the placeholder line

```js
  const storylineNeed = Object.fromEntries(living.map(n => [n, 0]));   // Plan 3 fills this
```

with

```js
  const need = storylineNeedFor(state.storylines || [], { living, episode: cfg.num,
    totalEpisodes: cfg.totalEpisodes || 12, state });
```

(importing `storylineNeed as storylineNeedFor`), pass `need` to `hostBend`, and add to `row.dr`:

```js
      storylines: arcSummary(state.storylines || []),
      storylineNeed: need,
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/dr-storyline-wiring.test.js tests/dr-season.test.js tests/dr-week.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/dr/week.js js/dr/season.js js/dr/state.js tests/dr-storyline-wiring.test.js
git commit -m "feat(drag-race): storylines drive the host's lean and snapshot per episode"
```

---

### Task 3: The werk room — cold open, morning, elimination day

**Files:**
- Create: `js/dr/social.js`
- Test: `tests/dr-social.test.js`

**Interfaces:**
- Consumes: bonds, archetypes, `state.record`, `canScheme`, `evt`.
- Produces:
  - `WERK_EVENTS` — the pool definitions, each `{ id, step, weight(ctx) → number, fire(ctx) → { players, bond, pop, state, data } }`. Twenty of them across three steps:
    - **cold-open** (5): `mirror-read` (everyone reads the message the exit left), `relief`, `guilt` (the queen who sent her home), `alliance-formed` (two queens who both survived a scare), `the-empty-station`.
    - **werk-morning** (8): `debrief`, `apology`, `confrontation` (a carried-over Untucked fight), `strategy-talk`, `first-impression-shift`, `sisterhood`, `read-the-room`, `nobody-talks-to-her`.
    - **werk-elim-day** (7): `getting-ready`, `borrowed-lashes` (a favour), `shade-in-the-mirror`, `pep-talk`, `bragging`, `nerves`, `the-quiet-one`.
  - `runWerkRoom({ step, living, players, rng, bond, state, lastRow, budget }) → { scenes, events }` — draws `budget` events by weight without repeating an id in one episode, guarantees at least one per step, and every fired event returns real consequences (the spine's `applyEvents` would throw otherwise).
  - `WERK_BUDGET = { 'cold-open': 2, 'werk-morning': 3, 'werk-elim-day': 2 }`, scaled down when fewer than six queens remain (`Math.max(1, Math.round(budget * living.length / 10))`).

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-social.test.js
import { describe, expect, it } from 'vitest';
import { WERK_EVENTS, WERK_BUDGET, runWerkRoom } from '../js/dr/social.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, over = {}) => ({ name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5 }, ...over });
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay', 'Gigi', 'Hex'];
const players = Object.fromEntries(NAMES.map((n, i) => [n, mk(n, i === 0 ? { archetype: 'villain' } : {})]));
const bonds = { 'Ada|Bee': -7, 'Cleo|Dot': 7, 'Eve|Fay': 4 };
function ctx(step, seed = 1, over = {}) {
  return { step, living: [...NAMES], players, rng: rngFor(seed),
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0,
    state: { record: Object.fromEntries(NAMES.map(n => [n, ['SAFE']])), flags: {}, out: ['Gone'],
      lastReaction: {} },
    lastRow: { exits: [{ name: 'Gone', verb: 'sashayed away' }],
      dr: { call: { win: ['Cleo'], high: [], safe: [], low: [], bottom: ['Dot', 'Gone'] },
        lipsync: { winner: 'Dot', loser: 'Gone' }, reactions: {} } },
    budget: WERK_BUDGET[step], ...over };
}

describe('the werk room pool', () => {
  it('has twenty events across the three steps, each with a weight and a fire', () => {
    expect(WERK_EVENTS.length).toBeGreaterThanOrEqual(20);
    const steps = new Set(WERK_EVENTS.map(e => e.step));
    expect([...steps].sort()).toEqual(['cold-open', 'werk-elim-day', 'werk-morning']);
    for (const e of WERK_EVENTS) {
      expect(typeof e.weight).toBe('function');
      expect(typeof e.fire).toBe('function');
      expect(e.id).toBeTruthy();
    }
  });
});

describe('runWerkRoom', () => {
  it('fires at least one scene per step and never repeats an id', () => {
    for (const step of ['cold-open', 'werk-morning', 'werk-elim-day']) {
      const out = runWerkRoom(ctx(step));
      expect(out.scenes.length).toBeGreaterThan(0);
      expect(out.scenes.every(s => s.step === step)).toBe(true);
      const ids = out.events.map(e => e.type);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
  it('every event it fires has a consequence and names real queens', () => {
    for (let s = 0; s < 40; s++) {
      for (const step of ['cold-open', 'werk-morning', 'werk-elim-day']) {
        for (const e of runWerkRoom(ctx(step, s)).events) {
          expect(e.bond.length + Object.keys(e.pop).length + Object.keys(e.state).length, e.type).toBeGreaterThan(0);
          for (const n of e.players) expect([...NAMES, 'Gone']).toContain(n);
        }
      }
    }
  });
  it('a confrontation needs a real feud, and a sisterhood needs a real bond', () => {
    let conf = null, sis = null;
    for (let s = 0; s < 60 && (!conf || !sis); s++) {
      const out = runWerkRoom(ctx('werk-morning', s));
      conf ||= out.events.find(e => e.type === 'confrontation');
      sis ||= out.events.find(e => e.type === 'sisterhood');
    }
    if (conf) expect(bonds[[...conf.players].sort().join('|')] ?? 0).toBeLessThan(0);
    if (sis) expect(bonds[[...sis.players].sort().join('|')] ?? 0).toBeGreaterThan(0);
  });
  it('a nice queen never fires a shade or a scheme event', () => {
    const NICE_BAD = new Set(['shade-in-the-mirror', 'read-the-room', 'bragging']);
    for (let s = 0; s < 60; s++) {
      for (const e of runWerkRoom(ctx('werk-elim-day', s)).events) {
        if (!NICE_BAD.has(e.type)) continue;
        expect(['villain', 'mastermind', 'schemer', 'hothead', 'chaos-agent', 'wildcard', 'challenge-beast', 'floater', 'perceptive-player'])
          .toContain(players[e.players[0]].archetype);
      }
    }
  });
  it('scales down for a small cast', () => {
    const small = runWerkRoom(ctx('werk-morning', 1, { living: ['Ada', 'Bee', 'Cleo'] }));
    expect(small.scenes.length).toBeGreaterThan(0);
    expect(small.scenes.length).toBeLessThanOrEqual(WERK_BUDGET['werk-morning']);
    for (const e of small.events) for (const n of e.players) expect(['Ada', 'Bee', 'Cleo', 'Gone']).toContain(n);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-social.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```js
// js/dr/social.js — the werk room, three times an episode (spec §5 steps 1, 2, 8)
//
// The shape is the house's event engine: a weighted pool, a budget per step,
// and every fired event returns consequences rather than a sentence. The
// sentence is Plan 3's text layer, keyed by the event id.
import { canScheme, evt } from './chal/_generic.js';

export const WERK_BUDGET = { 'cold-open': 2, 'werk-morning': 3, 'werk-elim-day': 2 };

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const pairsOf = living => { const out = []; for (let i = 0; i < living.length; i++) for (let j = i + 1; j < living.length; j++) out.push([living[i], living[j]]); return out; };
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const worstPair = (living, bond) => pairsOf(living).sort((a, b) => bond(...a) - bond(...b))[0] || null;
const bestPair = (living, bond) => pairsOf(living).sort((a, b) => bond(...b) - bond(...a))[0] || null;

export const WERK_EVENTS = [
  // ── the cold open: the room, minutes after somebody left ──────────
  { id: 'mirror-read', step: 'cold-open', weight: ctx => (ctx.lastRow?.exits?.length ? 3 : 0),
    fire: ctx => { const who = ctx.lastRow.exits[0].name; const reader = pick(ctx.rng, ctx.living);
      return { players: [reader, who], pop: { [reader]: 1 }, data: { gone: who } }; } },
  { id: 'relief', step: 'cold-open', weight: ctx => (ctx.lastRow?.dr?.call?.bottom?.length ? 2.5 : 0),
    fire: ctx => { const saved = ctx.lastRow.dr.lipsync?.winner; const n = ctx.living.includes(saved) ? saved : pick(ctx.rng, ctx.living);
      return { players: [n], pop: { [n]: 1 }, state: { [`survived:${n}`]: true }, data: {} }; } },
  { id: 'guilt', step: 'cold-open', weight: ctx => (ctx.lastRow?.dr?.lipsync?.loser ? 1.5 : 0),
    fire: ctx => { const gone = ctx.lastRow.dr.lipsync.loser;
      const friend = ctx.living.filter(n => ctx.bond(n, gone) > 3)[0] || pick(ctx.rng, ctx.living);
      return { players: [friend, gone], pop: { [friend]: 1 }, data: { gone } }; } },
  { id: 'alliance-formed', step: 'cold-open', weight: ctx => (ctx.living.length > 4 ? 2 : 0),
    fire: ctx => { const [a, b] = bestPair(ctx.living, ctx.bond) || [pick(ctx.rng, ctx.living), pick(ctx.rng, ctx.living)];
      return a === b ? null : { players: [a, b], bond: [[a, b, 1.2]], data: {} }; } },
  { id: 'the-empty-station', step: 'cold-open', weight: () => 1.5,
    fire: ctx => { const n = pick(ctx.rng, ctx.living); return { players: [n], pop: { [n]: 1 }, data: { gone: ctx.lastRow?.exits?.[0]?.name || null } }; } },

  // ── the morning after ─────────────────────────────────────────────
  { id: 'debrief', step: 'werk-morning', weight: () => 3,
    fire: ctx => { const [a, b] = bestPair(ctx.living, ctx.bond) || []; if (!a) return null;
      return { players: [a, b], bond: [[a, b, 0.5]], data: {} }; } },
  { id: 'apology', step: 'werk-morning', weight: ctx => (worstPair(ctx.living, ctx.bond) && ctx.bond(...worstPair(ctx.living, ctx.bond)) < -2 ? 2 : 0),
    fire: ctx => { const [a, b] = worstPair(ctx.living, ctx.bond);
      const sorry = NICE.has(ctx.players[a].archetype) ? a : NICE.has(ctx.players[b].archetype) ? b : a;
      const other = sorry === a ? b : a;
      return { players: [sorry, other], bond: [[a, b, 1.5]], pop: { [sorry]: 2 }, data: {} }; } },
  { id: 'confrontation', step: 'werk-morning', weight: ctx => { const p = worstPair(ctx.living, ctx.bond); return p && ctx.bond(...p) <= -5 ? 3 : 0; },
    fire: ctx => { const [a, b] = worstPair(ctx.living, ctx.bond);
      return { players: [a, b], bond: [[a, b, -1.5]], pop: { [a]: -1, [b]: -1 }, state: { feud: `${a}|${b}` }, data: {} }; } },
  { id: 'strategy-talk', step: 'werk-morning', weight: ctx => (ctx.living.filter(n => canScheme(ctx.players[n])).length ? 2 : 0),
    fire: ctx => { const s = pick(ctx.rng, ctx.living.filter(n => canScheme(ctx.players[n])));
      const mark = pick(ctx.rng, ctx.living.filter(n => n !== s)); if (!s || !mark) return null;
      return { players: [s, mark], bond: [[s, mark, 0.4]], data: {} }; } },
  { id: 'first-impression-shift', step: 'werk-morning', weight: ctx => (ctx.living.length > 5 ? 1.5 : 0),
    fire: ctx => { const a = pick(ctx.rng, ctx.living); const b = pick(ctx.rng, ctx.living.filter(n => n !== a));
      if (!b) return null; return { players: [a, b], bond: [[a, b, ctx.rng() < 0.5 ? 1 : -1]], data: {} }; } },
  { id: 'sisterhood', step: 'werk-morning', weight: ctx => { const p = bestPair(ctx.living, ctx.bond); return p && ctx.bond(...p) >= 4 ? 2.5 : 0; },
    fire: ctx => { const [a, b] = bestPair(ctx.living, ctx.bond);
      return { players: [a, b], bond: [[a, b, 1]], pop: { [a]: 1, [b]: 1 }, data: {} }; } },
  { id: 'read-the-room', step: 'werk-morning', weight: ctx => (ctx.living.filter(n => canScheme(ctx.players[n])).length ? 2 : 0),
    fire: ctx => { const s = pick(ctx.rng, ctx.living.filter(n => canScheme(ctx.players[n])));
      const mark = pick(ctx.rng, ctx.living.filter(n => n !== s)); if (!s || !mark) return null;
      return { players: [s, mark], bond: [[s, mark, -0.8]], pop: { [s]: 1 }, data: {} }; } },
  { id: 'nobody-talks-to-her', step: 'werk-morning', weight: ctx => {
      const lonely = ctx.living.find(n => ctx.living.filter(o => o !== n).every(o => ctx.bond(n, o) <= 0));
      return lonely ? 2 : 0; },
    fire: ctx => { const n = ctx.living.find(x => ctx.living.filter(o => o !== x).every(o => ctx.bond(x, o) <= 0));
      return n ? { players: [n], pop: { [n]: -2 }, data: {} } : null; } },

  // ── elimination day ───────────────────────────────────────────────
  { id: 'getting-ready', step: 'werk-elim-day', weight: () => 3,
    fire: ctx => { const n = pick(ctx.rng, ctx.living); return { players: [n], pop: { [n]: 1 }, data: {} }; } },
  { id: 'borrowed-lashes', step: 'werk-elim-day', weight: ctx => (ctx.living.length > 3 ? 2 : 0),
    fire: ctx => { const a = pick(ctx.rng, ctx.living); const b = pick(ctx.rng, ctx.living.filter(n => n !== a));
      if (!b) return null; return { players: [a, b], bond: [[a, b, 0.8]], pop: { [a]: 1 }, data: {} }; } },
  { id: 'shade-in-the-mirror', step: 'werk-elim-day', weight: ctx => (ctx.living.filter(n => canScheme(ctx.players[n])).length ? 2.5 : 0),
    fire: ctx => { const s = pick(ctx.rng, ctx.living.filter(n => canScheme(ctx.players[n])));
      const mark = ctx.living.filter(n => n !== s).sort((a, b) => ctx.bond(s, a) - ctx.bond(s, b))[0];
      if (!s || !mark) return null;
      return { players: [s, mark], bond: [[s, mark, -1]], pop: { [s]: -1 }, data: {} }; } },
  { id: 'pep-talk', step: 'werk-elim-day', weight: ctx => {
      const shaken = ctx.living.find(n => (ctx.state.record[n] || []).slice(-1)[0] === 'BTM');
      return shaken ? 2.5 : 0; },
    fire: ctx => { const shaken = ctx.living.find(n => (ctx.state.record[n] || []).slice(-1)[0] === 'BTM');
      const friend = ctx.living.filter(n => n !== shaken).sort((a, b) => ctx.bond(shaken, b) - ctx.bond(shaken, a))[0];
      if (!shaken || !friend) return null;
      return { players: [friend, shaken], bond: [[friend, shaken, 1.2]], pop: { [friend]: 2 }, data: {} }; } },
  { id: 'bragging', step: 'werk-elim-day', weight: ctx => {
      const winner = ctx.living.find(n => (ctx.state.record[n] || []).slice(-1)[0] === 'WIN');
      return winner && !NICE.has(ctx.players[winner].archetype) ? 2 : 0; },
    fire: ctx => { const w = ctx.living.find(n => (ctx.state.record[n] || []).slice(-1)[0] === 'WIN');
      const others = ctx.living.filter(n => n !== w);
      return w ? { players: [w, ...others], bond: others.map(o => [w, o, -0.4]), pop: { [w]: -1 }, data: {} } : null; } },
  { id: 'nerves', step: 'werk-elim-day', weight: () => 2,
    fire: ctx => { const n = ctx.living.slice().sort((a, b) =>
        (Number(ctx.players[a].stats?.temperament) || 5) - (Number(ctx.players[b].stats?.temperament) || 5))[0];
      return { players: [n], pop: { [n]: -1 }, data: {} }; } },
  { id: 'the-quiet-one', step: 'werk-elim-day', weight: ctx => (ctx.living.length > 5 ? 1.5 : 0),
    fire: ctx => { const n = ctx.living.slice().sort((a, b) =>
        (Number(ctx.players[a].stats?.social) || 5) - (Number(ctx.players[b].stats?.social) || 5))[0];
      return { players: [n], pop: { [n]: -1 }, data: {} }; } },
];

export function runWerkRoom(ctx) {
  const { step, living, rng } = ctx;
  const budget = Math.max(1, Math.round((ctx.budget ?? WERK_BUDGET[step] ?? 2) * Math.min(1, living.length / 10) + 0.4));
  const pool = WERK_EVENTS.filter(e => e.step === step);
  const used = new Set();
  const scenes = [], events = [];
  for (let i = 0; i < budget; i++) {
    const weighted = pool.filter(e => !used.has(e.id)).map(e => ({ e, w: Math.max(0, e.weight(ctx)) })).filter(x => x.w > 0);
    if (!weighted.length) break;
    const total = weighted.reduce((s, x) => s + x.w, 0);
    let r = rng() * total, chosen = weighted[weighted.length - 1].e;
    for (const x of weighted) { r -= x.w; if (r <= 0) { chosen = x.e; break; } }
    used.add(chosen.id);
    const out = chosen.fire(ctx);
    if (!out) continue;
    events.push(evt(chosen.id, out));
    scenes.push({ step, kind: chosen.id, data: { players: out.players, ...out.data } });
  }
  // A step that produced nothing is a step with no content; take the highest
  // weighted event unconditionally rather than printing an empty room.
  if (!scenes.length && pool.length) {
    const fallback = pool.slice().sort((a, b) => b.weight(ctx) - a.weight(ctx))[0];
    const out = fallback.fire(ctx);
    if (out) { events.push(evt(fallback.id, out)); scenes.push({ step, kind: fallback.id, data: { players: out.players, ...out.data } }); }
  }
  return { scenes, events };
}
```

- [ ] **Step 4: Wire it into the week**

In `js/dr/week.js`, replace the three placeholder `say(...)` calls for `cold-open`, `werk-morning` and `werk-elim-day` with:

```js
  const werk = step => {
    const r = runWerkRoom({ step, living, players, rng, bond, state, lastRow: last,
      budget: WERK_BUDGET[step] });
    applyEvents(r.events, maxiCtx);
    for (const s of r.scenes) scenes.push({ ...s, text: '' });
    allEvents.push(...r.events);
  };
```
called at each of the three steps, with `allEvents` accumulated onto `row.dr.events`.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/dr-social.test.js tests/dr-week.test.js tests/dr-consequences.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/dr/social.js js/dr/week.js tests/dr-social.test.js
git commit -m "feat(drag-race): the werk room — twenty weighted events across three steps, all with consequences"
```

---

### Task 4: Critiques, reactions, and the two twists

**Files:**
- Create: `js/dr/critiques.js`
- Modify: `js/dr/week.js`
- Test: `tests/dr-critiques.test.js`

**Interfaces:**
- Consumes: `judgeViews` output (Plan 1 Task 8), `reactionFor` (Plan 1 Task 10), the panel.
- Produces:
  - `critiqueLines({ panel, views, call, entries, rng }) → [{ judge, queen, tone: 'praise'|'mixed'|'pan', reasons: ['challenge'|'runway'|'risk'|'polish'|'record'], rank }]` — one line per judge per critiqued queen, tone from that judge's own view relative to her median, reasons from which term contributed most. **A judge never cites a term her taste weights below 0.1.**
  - `runReactions({ call, bend, players, state, rng }) → { reactions, scenes, events }` — the reaction from Plan 1's `reactionFor`, now as scenes with consequences: `crash-out` (popularity `−2`, `state.crashedOut`), `blow-up` (popularity `−1`, `state.blewUpAtPanel`, and every judge's memory gets `−0.3` next week), `tears` (popularity `+1`), `joy` (`+2`), `sadness` (`0` pop but bond `+0.5` with anyone who consoles), `relief` (`+1`), `idgaf` (`−1`).
  - `whoShouldGoHome({ living, players, bond, state, rng }) → { votes: {name: target}, scenes, events }` — each queen names somebody: reads perceived bonds (protects the highest bond, names the lowest), a `loyalty ≥ 8` queen in the bottom names herself, a `canScheme` queen names the biggest threat by track record. Every naming is an event: bond `−1.5` between namer and named, popularity `−1` for naming a friend.
  - `rateAQueen({ living, players, bond, state, rng }) → { grid: {name: {name: 1..10}}, scenes, events }` — everybody rates everybody from perceived bond plus their record; the aggregate is read aloud, and the lowest-rated queen takes popularity `−2` while the highest takes `+2`.
  - Both twists fire only when the episode's schedule asks (`cfg.critiqueTwist === 'who-should-go' | 'rate-a-queen'`), which the timeline picker writes.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-critiques.test.js
import { describe, expect, it } from 'vitest';
import { critiqueLines, runReactions, whoShouldGoHome, rateAQueen } from '../js/dr/critiques.js';
import { panelFor } from '../js/dr/judges.js';
import { judgeViews } from '../js/dr/judging.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, over = {}) => ({ name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5 }, ...over });
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay'];
const players = Object.fromEntries(NAMES.map(n => [n, mk(n)]));
const entries = NAMES.map((n, i) => ({ name: n, style: 'comedy', perf: 9 - i, runway: 5 + (i % 3), risk: 0.5, polish: 5 }));
const panel = panelFor({ rotatingId: 'law' });
const call = { win: ['Ada'], high: ['Bee'], safe: ['Cleo', 'Dot'], low: ['Eve'], bottom: ['Fay', 'Eve'] };
const bonds = { 'Ada|Bee': 8, 'Cleo|Fay': -8 };
const bond = (a, b) => bonds[[a, b].sort().join('|')] || 0;
const state = () => ({ record: Object.fromEntries(NAMES.map(n => [n, ['SAFE', 'HIGH']])), flags: {}, lastReaction: {} });

describe('critiqueLines', () => {
  const views = judgeViews(panel, entries, {}, rngFor(1));
  const lines = critiqueLines({ panel, views, call, entries, rng: rngFor(2) });
  it('gives every judge a line about every critiqued queen', () => {
    const critiqued = [...call.win, ...call.high, ...call.low, ...new Set(call.bottom)];
    for (const j of panel) for (const q of new Set(critiqued)) {
      expect(lines.find(l => l.judge === j.id && l.queen === q), `${j.id} on ${q}`).toBeTruthy();
    }
    expect(lines.every(l => ['praise', 'mixed', 'pan'].includes(l.tone))).toBe(true);
  });
  it('a judge never cites a term she does not care about', () => {
    for (const l of lines) {
      const j = panel.find(x => x.id === l.judge);
      for (const r of l.reasons) if (['challenge', 'runway', 'risk', 'polish'].includes(r)) {
        expect(j.taste[r], `${j.id} cited ${r}`).toBeGreaterThanOrEqual(0.1);
      }
    }
  });
  it('the winner is praised more than the bottom', () => {
    const t = q => lines.filter(l => l.queen === q).filter(l => l.tone === 'praise').length;
    expect(t('Ada')).toBeGreaterThan(t('Fay'));
  });
});

describe('runReactions', () => {
  it('turns a verdict into a scene with a cost', () => {
    const bend = NAMES.map((n, i) => ({ name: n, panelRank: i + 1, finalRank: i + 1, bend: 0 }));
    const out = runReactions({ call, bend, players, state: state(), rng: rngFor(3) });
    for (const [n, r] of Object.entries(out.reactions)) {
      expect(['crash-out', 'blow-up', 'tears', 'joy', 'sadness', 'relief', 'idgaf']).toContain(r);
      expect(out.scenes.find(s => s.data.players[0] === n)).toBeTruthy();
    }
    for (const e of out.events) expect(e.bond.length + Object.keys(e.pop).length + Object.keys(e.state).length).toBeGreaterThan(0);
  });
  it('a blow-up is remembered by the panel', () => {
    let found = null;
    for (let s = 0; s < 80 && !found; s++) {
      const bend = NAMES.map((n, i) => ({ name: n, panelRank: 1, finalRank: i + 1, bend: 0 }));
      const hot = Object.fromEntries(NAMES.map(n => [n, mk(n, { stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), temperament: 1, boldness: 10 } })]));
      found = runReactions({ call, bend, players: hot, state: state(), rng: rngFor(s) }).events.find(e => e.type === 'blow-up');
    }
    expect(found).toBeTruthy();
    expect(Object.keys(found.state).some(k => k.startsWith('blewUpAtPanel'))).toBe(true);
  });
});

describe('the twists', () => {
  it('who should go home reads bonds and costs the namer', () => {
    const out = whoShouldGoHome({ living: NAMES, players, bond, state: state(), rng: rngFor(1) });
    expect(Object.keys(out.votes).length).toBe(6);
    expect(out.votes.Ada).not.toBe('Bee');       // she protects her friend
    expect(out.votes.Cleo).toBe('Fay');           // she names her enemy
    for (const e of out.events) expect(e.bond.length + Object.keys(e.pop).length).toBeGreaterThan(0);
  });
  it('a loyal queen in the bottom can name herself', () => {
    const loyal = Object.fromEntries(NAMES.map(n => [n, mk(n, { stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), loyalty: 10 } })]));
    const st = state(); st.record.Eve = ['BTM'];
    const out = whoShouldGoHome({ living: NAMES, players: loyal, bond, state: st, rng: rngFor(4) });
    expect(Object.entries(out.votes).some(([k, v]) => k === v)).toBe(true);
  });
  it('rate-a-queen produces a full grid and pays the top and bottom', () => {
    const out = rateAQueen({ living: NAMES, players, bond, state: state(), rng: rngFor(2) });
    for (const n of NAMES) {
      expect(Object.keys(out.grid[n]).sort()).toEqual(NAMES.filter(x => x !== n).sort());
      for (const v of Object.values(out.grid[n])) { expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(10); }
    }
    const pops = out.events.flatMap(e => Object.values(e.pop));
    expect(Math.max(...pops)).toBeGreaterThan(0);
    expect(Math.min(...pops)).toBeLessThan(0);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-critiques.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```js
// js/dr/critiques.js — what the panel says, and what it does to her (spec §6.5, §6.6)
import { reactionFor } from './week.js';
import { canScheme, evt } from './chal/_generic.js';

/** One line per judge per critiqued queen, sourced from that judge's own view. */
export function critiqueLines({ panel, views, call, entries, rng }) {
  const critiqued = [...new Set([...call.win, ...call.high, ...call.low, ...call.bottom])];
  const byName = Object.fromEntries(entries.map(e => [e.name, e]));
  const lines = [];
  for (const j of panel) {
    const rows = views[j.id] || [];
    const median = rows.length ? rows[Math.floor(rows.length / 2)].view : 0;
    for (const q of critiqued) {
      const row = rows.find(r => r.name === q);
      if (!row) continue;
      const e = byName[q] || { perf: 5, runway: 5, risk: 0.5, polish: 5 };
      // What moved this judge most about her: only terms this judge weighs.
      const terms = [['challenge', j.taste.challenge * e.perf], ['runway', j.taste.runway * e.runway],
        ['risk', j.taste.risk * e.risk * 10], ['polish', j.taste.polish * (e.polish ?? 5)]]
        .filter(([k]) => (j.taste[k] || 0) >= 0.1)
        .sort((a, b) => b[1] - a[1]);
      const reasons = terms.slice(0, 2).map(([k]) => k);
      const tone = row.view > median + 1 ? 'praise' : row.view < median - 1 ? 'pan' : 'mixed';
      lines.push({ judge: j.id, queen: q, tone, reasons, rank: row.rank, view: row.view });
    }
  }
  void rng;
  return lines;
}

const REACTION_COST = {
  'crash-out': { pop: -2, state: n => ({ [`crashedOut:${n}`]: true }) },
  'blow-up': { pop: -1, state: n => ({ [`blewUpAtPanel:${n}`]: true }) },
  tears: { pop: 1, state: () => ({}) },
  joy: { pop: 2, state: () => ({}) },
  sadness: { pop: 0, state: () => ({}) },
  relief: { pop: 1, state: () => ({}) },
  idgaf: { pop: -1, state: () => ({}) },
};

export function runReactions({ call, bend, players, state, rng }) {
  const finalRank = Object.fromEntries(bend.map(b => [b.name, b.finalRank]));
  const critiqued = [...new Set([...call.win, ...call.high, ...call.low, ...call.bottom])];
  const reactions = {}, scenes = [], events = [];
  const n = bend.length || critiqued.length || 1;
  for (const q of critiqued) {
    const s = players[q]?.stats || {};
    // What she THOUGHT she did, from her own read of the room. Never the panel.
    const expected = Math.max(1, Math.round(n / 2 - ((Number(s.intuition) || 5) - 5) * 0.4));
    const r = reactionFor({ expected, received: finalRank[q] ?? n, temperament: s.temperament, boldness: s.boldness, rng });
    reactions[q] = r;
    state.lastReaction[q] = r;
    const cost = REACTION_COST[r] || REACTION_COST.sadness;
    const stateWrites = cost.state(q);
    // A reaction with no pop delta still has to change something, so sadness
    // writes a consoling bond instead of nothing.
    const consoler = r === 'sadness' ? Object.keys(players).filter(x => x !== q)[0] : null;
    events.push(evt(`reaction:${r}`, {
      players: consoler ? [q, consoler] : [q],
      pop: cost.pop ? { [q]: cost.pop } : {},
      bond: consoler ? [[q, consoler, 0.5]] : [],
      state: stateWrites,
      data: { reaction: r, expected, received: finalRank[q] ?? n },
    }));
    scenes.push({ step: 'critiques', kind: `reaction-${r}`, data: { players: [q], reaction: r } });
  }
  return { reactions, scenes, events };
}

/** "Who should go home tonight, and why?" A belief, never a fact. */
export function whoShouldGoHome({ living, players, bond, state, rng }) {
  const votes = {}, scenes = [], events = [];
  const record = state.record || {};
  const threatOf = n => (record[n] || []).filter(r => r === 'WIN' || r === 'HIGH').length;
  for (const n of living) {
    const others = living.filter(o => o !== n);
    if (!others.length) continue;
    const s = players[n]?.stats || {};
    const inBottom = (record[n] || []).slice(-1)[0] === 'BTM';
    let target;
    if ((Number(s.loyalty) || 5) >= 8 && inBottom && rng() < 0.5) target = n;               // names herself
    else if (canScheme(players[n])) target = others.sort((a, b) => threatOf(b) - threatOf(a))[0];
    else target = others.sort((a, b) => bond(n, a) - bond(n, b))[0];
    votes[n] = target;
    const namedAFriend = target !== n && bond(n, target) > 3;
    events.push(evt('who-should-go', {
      players: target === n ? [n] : [n, target],
      bond: target === n ? [] : [[n, target, -1.5]],
      pop: namedAFriend ? { [n]: -1 } : target === n ? { [n]: 1 } : {},
      data: { self: target === n },
    }));
    scenes.push({ step: 'critiques', kind: 'who-should-go', data: { players: [n, target], self: target === n } });
  }
  return { votes, scenes, events };
}

/** Everybody ranks everybody, and it is read out. */
export function rateAQueen({ living, players, bond, state, rng }) {
  const grid = {}, scenes = [], events = [];
  const record = state.record || {};
  const merit = n => 5 + (record[n] || []).filter(r => r === 'WIN').length * 1.5
    + (record[n] || []).filter(r => r === 'HIGH').length * 0.5
    - (record[n] || []).filter(r => r === 'BTM').length;
  for (const n of living) {
    grid[n] = {};
    for (const o of living) {
      if (o === n) continue;
      const raw = merit(o) + bond(n, o) * 0.3 + (rng() - 0.5) * 2;
      grid[n][o] = Math.max(1, Math.min(10, Math.round(raw)));
    }
  }
  const mean = n => { const vals = living.filter(o => o !== n).map(o => grid[o][n]); return vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length); };
  const ranked = [...living].sort((a, b) => mean(b) - mean(a));
  const top = ranked[0], bottom = ranked[ranked.length - 1];
  if (top && bottom && top !== bottom) {
    events.push(evt('rate-a-queen', { players: [top, bottom], pop: { [top]: 2, [bottom]: -2 },
      data: { top, bottom, means: Object.fromEntries(living.map(n => [n, Math.round(mean(n) * 10) / 10])) } }));
    scenes.push({ step: 'critiques', kind: 'rate-a-queen', data: { players: ranked, top, bottom } });
  }
  return { grid, scenes, events };
}
```

Move `reactionFor` from `js/dr/week.js` into `js/dr/critiques.js` and re-export it from `week.js` so Plan 1's test import keeps working, or update that import; either is fine, but do one of them and say which in the commit.

- [ ] **Step 4: Wire it into the week**

In `js/dr/week.js`, at the critiques step: build `entries` (already there), call `critiqueLines`, then `runReactions`, then the twist if `cfg.critiqueTwist` names one. Put `critiqueLines` on `row.dr.critiques`, the twist result on `row.dr.critiqueTwist`, and merge every event through `applyEvents`.

Add `critiqueTwist` to the timeline picker in `js/run-ui.js` (`_drPickers`): a sixth select with `— no twist —`, `Who should go home?`, `Rate-a-queen`, writing `seasonConfig.drSchedule[].critiqueTwist`.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/dr-critiques.test.js tests/dr-week.test.js tests/dr-consequences.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/dr/critiques.js js/dr/week.js js/run-ui.js tests/dr-critiques.test.js
git commit -m "feat(drag-race): critiques — per-judge lines from her own view, reactions with costs, both twists"
```

---

### Task 5: Untucked

**Files:**
- Create: `js/dr/untucked.js`
- Test: `tests/dr-untucked.test.js`

**Interfaces:**
- Consumes: the critiques and reactions from Task 4, bonds, `state.flags`.
- Produces:
  - `UNTUCKED_EVENTS` — 14 events in three acts: **the safe queens** (`relief-toast`, `reading-the-tops`, `predicting-the-bottom`, `side-eye`), **the tops and bottoms return** (`the-door-opens`, `what-did-they-say`, `hugging-the-bottom`, `the-winner-gloats`, `the-defence`), **the fight** (`blow-up-continues`, `defending-her-sister`, `crying-in-the-bathroom`, `the-apology-that-is-not-one`, `the-alliance-hardens`).
  - `runUntucked({ living, players, rng, bond, state, call, reactions, critiques, twist }) → { scenes, events }` — amplification is the point: an event's weight is multiplied by `1 + heat`, where `heat` counts `crash-out`/`blow-up` reactions this week, `pan` critiques, and any `state.flags.feud`. A week with no drama still fires two quiet events; a week with three crash-outs fires up to six.
  - `UNTUCKED_MAX = 6`, `UNTUCKED_MIN = 2`.
  - Consequences are heavier than the werk room's because the room has just been judged: bond deltas up to `±2.5`, popularity up to `±3`.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-untucked.test.js
import { describe, expect, it } from 'vitest';
import { UNTUCKED_EVENTS, UNTUCKED_MAX, UNTUCKED_MIN, runUntucked } from '../js/dr/untucked.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, over = {}) => ({ name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5 }, ...over });
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay'];
const players = Object.fromEntries(NAMES.map((n, i) => [n, mk(n, i === 0 ? { archetype: 'villain' } : {})]));
const bonds = { 'Ada|Fay': -8, 'Bee|Cleo': 7 };
const call = { win: ['Bee'], high: ['Cleo'], safe: ['Dot', 'Eve'], low: ['Ada'], bottom: ['Ada', 'Fay'] };
const critiques = [{ judge: 'rupaul', queen: 'Fay', tone: 'pan', reasons: ['challenge'], rank: 6 },
  { judge: 'michelle', queen: 'Bee', tone: 'praise', reasons: ['runway'], rank: 1 }];
function ctx(reactions, seed = 1, over = {}) {
  return { living: [...NAMES], players, rng: rngFor(seed),
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0,
    state: { record: Object.fromEntries(NAMES.map(n => [n, ['SAFE']])), flags: {}, lastReaction: reactions },
    call, reactions, critiques, twist: null, ...over };
}

describe('the untucked pool', () => {
  it('is fourteen events across three acts', () => {
    expect(UNTUCKED_EVENTS.length).toBeGreaterThanOrEqual(14);
    const acts = new Set(UNTUCKED_EVENTS.map(e => e.act));
    expect([...acts].sort()).toEqual(['fight', 'return', 'safe']);
  });
});

describe('runUntucked', () => {
  it('always produces something, and never more than the cap', () => {
    const quiet = runUntucked(ctx({ Bee: 'joy', Ada: 'relief', Fay: 'sadness' }));
    expect(quiet.scenes.length).toBeGreaterThanOrEqual(UNTUCKED_MIN);
    expect(quiet.scenes.length).toBeLessThanOrEqual(UNTUCKED_MAX);
  });
  it('a hot week fires more than a quiet one', () => {
    const quiet = [], hot = [];
    for (let s = 0; s < 30; s++) {
      quiet.push(runUntucked(ctx({ Bee: 'relief', Ada: 'relief', Fay: 'relief' }, s)).scenes.length);
      hot.push(runUntucked(ctx({ Bee: 'joy', Ada: 'crash-out', Fay: 'blow-up', Cleo: 'crash-out' }, s)).scenes.length);
    }
    const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
    expect(mean(hot)).toBeGreaterThan(mean(quiet));
  });
  it('every event has a consequence and names living queens', () => {
    for (let s = 0; s < 50; s++) {
      for (const e of runUntucked(ctx({ Ada: 'blow-up', Fay: 'tears' }, s)).events) {
        expect(e.bond.length + Object.keys(e.pop).length + Object.keys(e.state).length, e.type).toBeGreaterThan(0);
        for (const n of e.players) expect(NAMES).toContain(n);
      }
    }
  });
  it('a fight needs a feud or a blow-up, not just a bad night', () => {
    let fight = null;
    for (let s = 0; s < 60 && !fight; s++) fight = runUntucked(ctx({ Ada: 'blow-up' }, s)).events.find(e => e.type === 'blow-up-continues');
    expect(fight).toBeTruthy();
    expect(fight.players).toContain('Ada');
    let none = true;
    for (let s = 0; s < 60 && none; s++) if (runUntucked(ctx({ Bee: 'joy', Cleo: 'relief' }, s), 0).events.some(e => e.type === 'blow-up-continues')) none = false;
    expect(none).toBe(true);
  });
  it('a sister defends her sister', () => {
    let d = null;
    for (let s = 0; s < 60 && !d; s++) d = runUntucked(ctx({ Cleo: 'tears' }, s)).events.find(e => e.type === 'defending-her-sister');
    if (d) expect(bonds[[...d.players].sort().join('|')] ?? 0).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-untucked.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```js
// js/dr/untucked.js — the lounge, with the volume up (spec §5 step 13)
//
// Same engine as the werk room, one difference that is the whole point: the
// weights are multiplied by how badly the critiques went. A quiet week is two
// scenes of relief; a week with two crash-outs and a pan is a fight.
import { canScheme, evt } from './chal/_generic.js';

export const UNTUCKED_MIN = 2;
export const UNTUCKED_MAX = 6;

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const pairs = living => { const o = []; for (let i = 0; i < living.length; i++) for (let j = i + 1; j < living.length; j++) o.push([living[i], living[j]]); return o; };
const hotReactions = new Set(['crash-out', 'blow-up']);

export const UNTUCKED_EVENTS = [
  // ── act one: the safe queens, alone ───────────────────────────────
  { id: 'relief-toast', act: 'safe', weight: ctx => (ctx.call.safe.length ? 3 : 0),
    fire: ctx => { const who = ctx.call.safe.filter(n => ctx.living.includes(n)); if (who.length < 2) return null;
      return { players: who, bond: [[who[0], who[1], 0.8]], pop: Object.fromEntries(who.map(n => [n, 1])), data: {} }; } },
  { id: 'reading-the-tops', act: 'safe', weight: ctx => (ctx.call.safe.some(n => canScheme(ctx.players[n])) ? 2.5 : 0),
    fire: ctx => { const reader = ctx.call.safe.filter(n => canScheme(ctx.players[n]))[0];
      const target = ctx.call.win[0] || ctx.call.high[0]; if (!reader || !target) return null;
      return { players: [reader, target], bond: [[reader, target, -1.2]], pop: { [reader]: 1 }, data: {} }; } },
  { id: 'predicting-the-bottom', act: 'safe', weight: () => 2,
    fire: ctx => { const a = pick(ctx.rng, ctx.call.safe.length ? ctx.call.safe : ctx.living);
      const t = pick(ctx.rng, ctx.call.bottom.length ? ctx.call.bottom : ctx.living.filter(n => n !== a));
      if (!a || !t || a === t) return null;
      return { players: [a, t], bond: [[a, t, -0.5]], data: {} }; } },
  { id: 'side-eye', act: 'safe', weight: ctx => (ctx.living.length > 4 ? 1.5 : 0),
    fire: ctx => { const p = pairs(ctx.living).sort((x, y) => ctx.bond(...x) - ctx.bond(...y))[0]; if (!p) return null;
      return { players: p, bond: [[p[0], p[1], -0.6]], data: {} }; } },

  // ── act two: the door opens ───────────────────────────────────────
  { id: 'the-door-opens', act: 'return', weight: () => 3,
    fire: ctx => { const back = [...ctx.call.win, ...ctx.call.bottom].filter(n => ctx.living.includes(n));
      if (!back.length) return null;
      return { players: back, pop: Object.fromEntries(back.map(n => [n, 1])), data: {} }; } },
  { id: 'what-did-they-say', act: 'return', weight: ctx => (ctx.call.bottom.length ? 3 : 0),
    fire: ctx => { const b = ctx.call.bottom.filter(n => ctx.living.includes(n))[0];
      const asker = ctx.call.safe.filter(n => n !== b)[0] || ctx.living.find(n => n !== b);
      if (!b || !asker) return null;
      return { players: [asker, b], bond: [[asker, b, 0.6]], data: {} }; } },
  { id: 'hugging-the-bottom', act: 'return', weight: ctx => (Object.values(ctx.reactions || {}).some(r => r === 'tears') ? 3 : 0),
    fire: ctx => { const crying = Object.entries(ctx.reactions || {}).find(([, r]) => r === 'tears')?.[0];
      if (!crying || !ctx.living.includes(crying)) return null;
      const friend = ctx.living.filter(n => n !== crying).sort((a, b) => ctx.bond(crying, b) - ctx.bond(crying, a))[0];
      if (!friend) return null;
      return { players: [friend, crying], bond: [[friend, crying, 2]], pop: { [friend]: 2, [crying]: 1 }, data: {} }; } },
  { id: 'the-winner-gloats', act: 'return', weight: ctx => { const w = ctx.call.win[0];
      return w && canScheme(ctx.players[w]) ? 2.5 : 0; },
    fire: ctx => { const w = ctx.call.win[0]; const others = ctx.living.filter(n => n !== w);
      if (!w || !others.length) return null;
      return { players: [w, ...others], bond: others.map(o => [w, o, -0.8]), pop: { [w]: -2 }, data: {} }; } },
  { id: 'the-defence', act: 'return', weight: ctx => (ctx.critiques || []).some(c => c.tone === 'pan') ? 2.5 : 0,
    fire: ctx => { const panned = (ctx.critiques || []).find(c => c.tone === 'pan' && ctx.living.includes(c.queen))?.queen;
      if (!panned) return null;
      const doubter = ctx.living.filter(n => n !== panned).sort((a, b) => ctx.bond(panned, a) - ctx.bond(panned, b))[0];
      if (!doubter) return null;
      return { players: [panned, doubter], bond: [[panned, doubter, -1.5]], pop: { [panned]: 1 }, data: {} }; } },

  // ── act three: the fight ──────────────────────────────────────────
  { id: 'blow-up-continues', act: 'fight', weight: ctx => (Object.values(ctx.reactions || {}).includes('blow-up') ? 4 : 0),
    fire: ctx => { const who = Object.entries(ctx.reactions || {}).find(([, r]) => r === 'blow-up')?.[0];
      if (!who || !ctx.living.includes(who)) return null;
      const target = ctx.living.filter(n => n !== who).sort((a, b) => ctx.bond(who, a) - ctx.bond(who, b))[0];
      if (!target) return null;
      return { players: [who, target], bond: [[who, target, -2.5]], pop: { [who]: -2, [target]: 1 },
        state: { feud: `${who}|${target}` }, data: {} }; } },
  { id: 'defending-her-sister', act: 'fight', weight: ctx => { const p = pairs(ctx.living).find(x => ctx.bond(...x) >= 5); return p ? 3 : 0; },
    fire: ctx => { const p = pairs(ctx.living).sort((a, b) => ctx.bond(...b) - ctx.bond(...a))[0]; if (!p) return null;
      const [a, b] = p;
      const attacker = ctx.living.filter(n => n !== a && n !== b).sort((x, y) => ctx.bond(b, x) - ctx.bond(b, y))[0];
      if (!attacker) return null;
      return { players: [a, attacker, b], bond: [[a, attacker, -1.5], [a, b, 1]], pop: { [a]: 2 }, data: {} }; } },
  { id: 'crying-in-the-bathroom', act: 'fight', weight: ctx => (Object.values(ctx.reactions || {}).some(r => hotReactions.has(r)) ? 2.5 : 0.5),
    fire: ctx => { const who = Object.entries(ctx.reactions || {}).find(([, r]) => hotReactions.has(r))?.[0]
        || ctx.call.bottom.find(n => ctx.living.includes(n));
      if (!who || !ctx.living.includes(who)) return null;
      return { players: [who], pop: { [who]: 1 }, data: {} }; } },
  { id: 'the-apology-that-is-not-one', act: 'fight', weight: ctx => (ctx.state.flags?.feud ? 2.5 : 0),
    fire: ctx => { const [a, b] = String(ctx.state.flags.feud).split('|');
      if (!ctx.living.includes(a) || !ctx.living.includes(b)) return null;
      return { players: [a, b], bond: [[a, b, -0.8]], pop: { [a]: -1 }, data: {} }; } },
  { id: 'the-alliance-hardens', act: 'fight', weight: ctx => (ctx.state.flags?.feud ? 2 : 1),
    fire: ctx => { const p = pairs(ctx.living).sort((a, b) => ctx.bond(...b) - ctx.bond(...a))[0]; if (!p) return null;
      return { players: p, bond: [[p[0], p[1], 1.5]], state: { pact: `${p[0]}|${p[1]}` }, data: {} }; } },
];

/** How bad was tonight? Drives how many scenes the lounge gets. */
function heatOf(ctx) {
  const hot = Object.values(ctx.reactions || {}).filter(r => hotReactions.has(r)).length;
  const pans = (ctx.critiques || []).filter(c => c.tone === 'pan').length;
  const feud = ctx.state.flags?.feud ? 1 : 0;
  return hot * 0.8 + pans * 0.15 + feud * 0.5;
}

export function runUntucked(ctx, heatOverride) {
  const heat = heatOverride == null ? heatOf(ctx) : heatOverride;
  const budget = Math.max(UNTUCKED_MIN, Math.min(UNTUCKED_MAX, Math.round(UNTUCKED_MIN + heat)));
  const used = new Set();
  const scenes = [], events = [];
  for (let i = 0; i < budget; i++) {
    const weighted = UNTUCKED_EVENTS.filter(e => !used.has(e.id))
      .map(e => ({ e, w: Math.max(0, e.weight(ctx)) * (e.act === 'fight' ? 1 + heat : 1) }))
      .filter(x => x.w > 0);
    if (!weighted.length) break;
    const total = weighted.reduce((s, x) => s + x.w, 0);
    let r = ctx.rng() * total, chosen = weighted[weighted.length - 1].e;
    for (const x of weighted) { r -= x.w; if (r <= 0) { chosen = x.e; break; } }
    used.add(chosen.id);
    const out = chosen.fire(ctx);
    if (!out) continue;
    events.push(evt(chosen.id, out));
    scenes.push({ step: 'untucked', kind: chosen.id, data: { players: out.players, act: chosen.act, ...out.data } });
  }
  return { scenes, events };
}
```

- [ ] **Step 4: Wire it into the week**

In `js/dr/week.js`, replace the placeholder `say('untucked', ...)` with a `runUntucked` call taking the reactions and critiques from Task 4, applying its events and pushing its scenes.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/dr-untucked.test.js tests/dr-week.test.js tests/dr-consequences.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/dr/untucked.js js/dr/week.js tests/dr-untucked.test.js
git commit -m "feat(drag-race): Untucked — three acts, amplified by how badly the critiques went"
```

---

### Task 6: The text layer — the renderer and its rules

**Files:**
- Create: `js/dr/text/index.js`, `js/dr/text/voices.js`
- Test: `tests/dr-text-engine.test.js`, `tests/dr-text-purity.test.js`

**Interfaces:**
- Produces:
  - `registerPool(kind, entries)` — `entries` is an array of functions `(ctx) → string` or of strings with `{tokens}`; the registry is `POOLS`.
  - `renderScene(scene, ctx) → string` — picks a variant for `scene.kind`, never repeating one within `ctx.episode` (a `Set` on `ctx._used`), and fills tokens.
  - Tokens, resolved by `fill(template, ctx)`: `{a}` `{b}` `{c}` (scene players by position), `{A}` (capitalised), `{they}` `{them}` `{their}` `{theirs}` `{They}` (pronouns of `{a}` via `pronounsOf`), `{gone}`, `{challenge}`, `{song}`, `{judge}`, `{queen}`/`{queens}`/`{round}`/`{exit}` from `showWords('drag-race')`. An unresolved token is a thrown error, not a printed brace.
  - `_pickUnique(kind, entries, ctx)` — the anti-repetition draw.
  - `voiceOf(player) → { archetypeTone, styleTone, voice }` in `voices.js`, and `judgeVoice(judge) → { tone, tics: [] }`; pools take these to shape a line rather than each pool inventing a personality.
- Rules the purity test enforces:
  - No file under `js/dr/text/` imports anything from `js/dr/` other than `text/`, `queen.js`, `shows.js` and `pronouns-of.js`. Text cannot reach a simulation function.
  - No file outside `js/dr/text/` builds a sentence: `js/dr/*.js` (excluding `text/`) must contain no string literal longer than 40 characters containing a space, except in comments.
  - Every `kind` emitted by any engine module has a pool with at least four entries.

- [ ] **Step 1: Write the failing tests**

```js
// tests/dr-text-engine.test.js
import { describe, expect, it } from 'vitest';
import { renderScene, registerPool, POOLS, fill } from '../js/dr/text/index.js';
import '../js/dr/text/pools/index.js';

const ctxFor = (over = {}) => ({ episode: 1, _used: new Set(),
  players: { Ada: { name: 'Ada', gender: 'f', archetype: 'villain', drag: { style: 'comedy' } },
    Bee: { name: 'Bee', gender: 'nb', archetype: 'hero', drag: { style: 'fashion' } } },
  challenge: { name: 'Snatch Game' }, ...over });

describe('the renderer', () => {
  it('fills every token it advertises', () => {
    const s = fill('{A} told {b} that {they} would win the {challenge}.',
      { ...ctxFor(), scene: { data: { players: ['Ada', 'Bee'] } } });
    expect(s).toBe('Ada told Bee that she would win the Snatch Game.');
  });
  it('uses they/them when the queen has no gender', () => {
    const ctx = ctxFor(); ctx.players.Ada.gender = '';
    expect(fill('{They} walked.', { ...ctx, scene: { data: { players: ['Ada'] } } })).toBe('They walked.');
  });
  it('throws on an unknown token rather than printing a brace', () => {
    expect(() => fill('{nonsense}', { ...ctxFor(), scene: { data: { players: ['Ada'] } } })).toThrow(/nonsense/);
  });
  it('never repeats a variant inside one episode until the pool is exhausted', () => {
    registerPool('test-kind', ['one {a}', 'two {a}', 'three {a}', 'four {a}']);
    const ctx = ctxFor();
    const seen = new Set();
    for (let i = 0; i < 4; i++) seen.add(renderScene({ step: 'x', kind: 'test-kind', data: { players: ['Ada'] } }, ctx));
    expect(seen.size).toBe(4);
  });
  it('every registered pool has at least four variants', () => {
    for (const [kind, entries] of Object.entries(POOLS)) {
      expect(entries.length, `${kind} has ${entries.length} variants`).toBeGreaterThanOrEqual(4);
    }
  });
});
```

```js
// tests/dr-text-purity.test.js
//
// The separation this guards: the engine decides, the text layer speaks.
// Break it and a prose rewrite changes a result, or a result change silently
// stops being narrated.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { POOLS } from '../js/dr/text/index.js';
import '../js/dr/text/pools/index.js';

const walk = dir => readdirSync(dir).flatMap(f => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : [];
});
const ENGINE = walk('js/dr').filter(p => !p.includes(`${'text'}`));
const TEXT = walk('js/dr/text');
const strip = src => src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter(l => !l.trim().startsWith('//')).join('\n');

describe('text purity', () => {
  it('the text layer imports no simulation module', () => {
    const ALLOWED = /^(\.\.\/)*(text\/|queen\.js|rng\.js|\.\.\/shows\.js|\.\.\/pronouns-of\.js|\.\/|\.\.\/\.\.\/shows\.js|\.\.\/\.\.\/pronouns-of\.js)/;
    for (const f of TEXT) {
      for (const m of readFileSync(f, 'utf8').matchAll(/from '([^']+)'/g)) {
        const spec = m[1];
        if (!spec.startsWith('.')) continue;
        expect(ALLOWED.test(spec.replace(/^\.\//, '')), `${f} imports ${spec}`).toBe(true);
      }
    }
  });
  it('no engine module writes a sentence', () => {
    for (const f of ENGINE) {
      const src = strip(readFileSync(f, 'utf8'));
      for (const m of src.matchAll(/'([^'\\]{40,})'|`([^`\\$]{40,})`/g)) {
        const lit = m[1] || m[2];
        if (!/\s/.test(lit)) continue;
        expect.fail(`${f} contains prose: "${lit.slice(0, 60)}..."`);
      }
    }
  });
  it('every scene kind the engine can emit has a pool', () => {
    const kinds = new Set();
    for (const f of ENGINE) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/kind: *'([a-z0-9-]+)'/g)) kinds.add(m[1]);
      for (const m of src.matchAll(/id: *'([a-z0-9-]+)', *(?:step|act):/g)) kinds.add(m[1]);
      for (const m of src.matchAll(/kind: *`reaction-\$\{[^}]+\}`/g)) {
        for (const r of ['crash-out', 'blow-up', 'tears', 'joy', 'sadness', 'relief', 'idgaf']) kinds.add(`reaction-${r}`);
      }
    }
    const missing = [...kinds].filter(k => !POOLS[k]);
    expect(missing, `no pool for: ${missing.join(', ')}`).toEqual([]);
  });
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run tests/dr-text-engine.test.js tests/dr-text-purity.test.js`
Expected: FAIL — the text layer does not exist.

- [ ] **Step 3: Implement the renderer**

```js
// js/dr/text/index.js — the engine decides; this speaks (spec §5)
//
// A pool entry is a template string or a function of the render context.
// Nothing here may import a simulation module: see tests/dr-text-purity.test.js
// for why, and what happens when that line blurs.
import { showWords } from '../../shows.js';
import { pronounsOf } from '../../pronouns-of.js';

export const POOLS = {};

export function registerPool(kind, entries) {
  if (!Array.isArray(entries) || entries.length < 4) {
    throw new Error(`drag-race text: pool "${kind}" needs at least four variants, got ${entries?.length ?? 0}`);
  }
  POOLS[kind] = (POOLS[kind] || []).concat(entries);
}

const W = () => showWords('drag-race');

/** Resolve one token, or throw. A printed brace is worse than a crash. */
function token(name, ctx) {
  const players = (ctx.scene?.data?.players) || [];
  const w = W();
  const byPos = { a: players[0], b: players[1], c: players[2] };
  const lower = name.toLowerCase();
  if (lower in byPos && byPos[lower] != null) {
    const nm = byPos[lower];
    return name === name.toUpperCase() || name[0] === name[0].toUpperCase() ? nm : nm;
  }
  const subject = byPos.a ? ctx.players?.[byPos.a] : null;
  const pr = pronounsOf(subject?.gender);
  const map = {
    they: pr.sub, them: pr.obj, their: pr.posAdj, theirs: pr.pos, themself: pr.ref,
    They: pr.Sub, Them: pr.Obj, Their: pr.PosAdj,
    gone: ctx.gone || ctx.scene?.data?.gone, challenge: ctx.challenge?.name,
    song: ctx.song?.title, judge: ctx.judge?.name, category: ctx.scene?.data?.category,
    queen: w.player, queens: w.players, round: w.round, exit: w.exit, host: w.host,
    maxi: w.challenge,
  };
  if (name in map && map[name] != null) return String(map[name]);
  throw new Error(`drag-race text: unknown or unresolved token "{${name}}" in kind "${ctx.scene?.kind}"`);
}

export function fill(template, ctx) {
  return String(template).replace(/\{(\w+)\}/g, (_, name) => token(name, ctx));
}

export function _pickUnique(kind, entries, ctx) {
  ctx._used ||= new Set();
  const free = entries.filter((_, i) => !ctx._used.has(`${kind}#${i}`));
  const pool = free.length ? free : entries;
  const idx = Math.floor((ctx.rng ? ctx.rng() : Math.random()) * pool.length);
  const chosen = pool[idx];
  ctx._used.add(`${kind}#${entries.indexOf(chosen)}`);
  return chosen;
}

export function renderScene(scene, ctx) {
  const entries = POOLS[scene.kind];
  if (!entries) throw new Error(`drag-race text: no pool for scene kind "${scene.kind}"`);
  const c = { ...ctx, scene };
  const chosen = _pickUnique(scene.kind, entries, c);
  const out = typeof chosen === 'function' ? chosen(c) : chosen;
  return fill(out, c);
}
```

```js
// js/dr/text/voices.js — how a line sounds, without deciding what it says
const ARCH_TONE = {
  villain: 'cutting', mastermind: 'measured', schemer: 'sly', hothead: 'loud',
  'challenge-beast': 'blunt', 'social-butterfly': 'warm', 'loyal-soldier': 'steady',
  wildcard: 'unpredictable', 'chaos-agent': 'gleeful', floater: 'careful',
  underdog: 'hopeful', hero: 'generous', villain2: 'cruel', goat: 'grateful',
  'perceptive-player': 'watchful', showmancer: 'flirtatious',
};
const STYLE_TONE = {
  pageant: 'polished', comedy: 'quick', fashion: 'cool', camp: 'silly', 'club-kid': 'wild',
  spooky: 'dry', broadway: 'theatrical', dancer: 'physical', glamour: 'grand', art: 'oblique',
};

export function voiceOf(player) {
  return {
    archetypeTone: ARCH_TONE[player?.archetype] || 'plain',
    styleTone: STYLE_TONE[player?.drag?.style] || 'plain',
    voice: player?.drag?.voice || player?.voice || '',
  };
}

export function judgeVoice(judge) {
  return { tone: judge?.voice || '', tics: judge?.petPeeve ? [judge.petPeeve] : [] };
}
```

- [ ] **Step 4: Run the engine test only**

Run: `npx vitest run tests/dr-text-engine.test.js`
Expected: FAIL on "every registered pool" until Task 7 lands, PASS on the rest. That is the correct intermediate state; the purity test's third assertion is also expected red until Task 7. Record both in the commit message.

- [ ] **Step 5: Commit**

```bash
git add js/dr/text/index.js js/dr/text/voices.js tests/dr-text-engine.test.js tests/dr-text-purity.test.js
git commit -m "feat(drag-race): the text renderer — tokens, anti-repetition, purity guards (pools land next)"
```

---

### Task 7: The pools — every line the show prints

**Files:**
- Create: `js/dr/text/pools/index.js` (imports every pool file), and one file per group:
  `werk-room.js`, `untucked.js`, `challenge.js`, `critiques.js`, `lipsync.js`, `arrivals.js`, `host.js`, `storyline.js`
- Test: `tests/dr-text-pools.test.js`

**This is the writing task.** Per the user's standing instruction (memory `feedback_opus_for_writing`), dispatch each pool file to an **Opus writing subagent** with a brief containing: the show vocabulary block, the archetype list and what each sounds like (`voices.js`), the token list from Task 6, the required variant count, and the ban on other shows' nouns. Review the returned prose against the rules below before committing it. Write the engine's registration code yourself; only the prose is delegated.

**Interfaces:**
- Every pool registers through `registerPool(kind, entries)`. Required kinds and counts:

| File | Kinds | Variants each |
|---|---|---|
| `werk-room.js` | the 20 `WERK_EVENTS` ids | 6 |
| `untucked.js` | the 14 `UNTUCKED_EVENTS` ids | 6 |
| `challenge.js` | `assignment`, `prep`, `prep-room`, `walkthrough`, `performance`, `snatch-picks`, `snatch-taping`, `ball-theme`, `ball-build`, `ball-walks`, `group-parts`, `recording-booth`, `group-number`, `rusical-cast`, `vocal-choice`, `rusical-performance`, `makeover-pairs`, `makeover-build`, `makeover-reveal`, `roast-order`, `writing-room`, `roast-set`, `talent-picks`, `rehearsal`, `talent-acts`, `bracket-picks`, `bracket`, `material-picks`, `workroom-build`, `parts-draft`, `design-performance`, and the challenge event ids (`help`, `sabotage`, `shunned`, `contest`, `dump`, `dying`, `double-act`, `wardrobe-malfunction`, `showstopper`, `bad-verse`, `verse-of-the-week`, `booth`, `spotlight-hog`, `carried`, `live-vocal`, `invisible`, `reunion`, `dressed-herself-better`, `bombed`, `roasted-the-panel`, `stole-a-bit`, `stunt-landed`, `stunt-failed`, `wrong-talent`, `assassin`, `picked-on`, `glue-gun`) | 5 |
| `critiques.js` | `critique-praise`, `critique-mixed`, `critique-pan` (per judge id, so 7 × 3 sub-pools), the 7 `reaction-*` kinds, `who-should-go`, `rate-a-queen` | 6 |
| `lipsync.js` | `lipsync-intro`, `lipsync-verse`, `lipsync-chorus`, `lipsync-hook`, `lipsync-ending`, `shantay`, `sashay`, `double-shantay`, `double-sashay`, `stunt` | 8 |
| `arrivals.js` | `entrance` (by archetype: 15 sub-pools), `mirror-message`, `last-words` | 8 |
| `host.js` | `maxi-announce`, `main-stage-open`, `runway-category`, `results-tops`, `results-bottoms`, `crowning` | 6 |
| `storyline.js` | `arc-frontrunner`, `arc-underdog`, `arc-villain`, `arc-fighter`, `arc-rivalry`, `arc-sisters`, `arc-robbed`, `arc-redemption`, `arc-stumble` | 5 |

- Per-judge critique pools use a compound kind: `critique:${judgeId}:${tone}`, and `critiques.js` exports `critiqueKind(judgeId, tone)` so the renderer and the transcript agree.
- Entrance lines are chosen by archetype and shaped by the queen's `drag.style` and craft: the pool entry is a function taking `ctx` so it can read `ctx.players[a].drag`.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-text-pools.test.js
import { describe, expect, it } from 'vitest';
import { POOLS, renderScene } from '../js/dr/text/index.js';
import '../js/dr/text/pools/index.js';
import { WERK_EVENTS } from '../js/dr/social.js';
import { UNTUCKED_EVENTS } from '../js/dr/untucked.js';
import { JUDGES } from '../js/dr/data/judges.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const ARCHETYPES = ['mastermind', 'schemer', 'hothead', 'challenge-beast', 'social-butterfly',
  'loyal-soldier', 'wildcard', 'chaos-agent', 'floater', 'underdog', 'hero', 'villain', 'goat',
  'perceptive-player', 'showmancer'];

const ctx = (over = {}) => ({ episode: 1, _used: new Set(), rng: rngFor(1),
  players: {
    Ada: { name: 'Ada', gender: 'f', archetype: 'villain', drag: { style: 'comedy', traits: ['wit'] } },
    Bee: { name: 'Bee', gender: 'nb', archetype: 'hero', drag: { style: 'fashion', traits: [] } },
    Cleo: { name: 'Cleo', gender: 'f', archetype: 'goat', drag: { style: 'pageant', traits: [] } },
  },
  challenge: { name: 'Snatch Game' }, song: { title: 'Toxic', artist: 'Britney Spears' },
  judge: JUDGES[0], gone: 'Dot', ...over });

describe('coverage', () => {
  it('every werk room and untucked event has six variants', () => {
    for (const e of [...WERK_EVENTS, ...UNTUCKED_EVENTS]) {
      expect(POOLS[e.id], `no pool for ${e.id}`).toBeTruthy();
      expect(POOLS[e.id].length, e.id).toBeGreaterThanOrEqual(6);
    }
  });
  it('every judge has praise, mixed and pan', () => {
    for (const j of JUDGES) for (const tone of ['praise', 'mixed', 'pan']) {
      const k = `critique:${j.id}:${tone}`;
      expect(POOLS[k], `no pool ${k}`).toBeTruthy();
      expect(POOLS[k].length).toBeGreaterThanOrEqual(6);
    }
  });
  it('every archetype has an entrance line', () => {
    for (const a of ARCHETYPES) {
      expect(POOLS[`entrance:${a}`], `no entrance pool for ${a}`).toBeTruthy();
      expect(POOLS[`entrance:${a}`].length).toBeGreaterThanOrEqual(8);
    }
  });
});

describe('every variant renders and stays in its own show', () => {
  it('renders without throwing and says nothing from another show', () => {
    const players = ['Ada', 'Bee', 'Cleo'];
    for (const kind of Object.keys(POOLS)) {
      for (let i = 0; i < POOLS[kind].length; i++) {
        const c = ctx({ _used: new Set() });
        let out;
        expect(() => { out = renderScene({ step: 'x', kind, data: { players, category: 'Feathers', act: 'safe' } }, c); },
          `${kind} variant ${i} threw`).not.toThrow();
        expect(out.length, `${kind} variant ${i} is empty`).toBeGreaterThan(10);
        expect(foreignWordsIn(out, 'drag-race'), `${kind}: "${out}"`).toEqual([]);
        expect(out, `${kind} left a token`).not.toMatch(/[{}]/);
      }
    }
  });
  it('does not repeat itself across a long episode', () => {
    const c = ctx();
    const lines = [];
    for (const e of WERK_EVENTS.slice(0, 6)) {
      lines.push(renderScene({ step: e.step, kind: e.id, data: { players: ['Ada', 'Bee'] } }, c));
    }
    expect(new Set(lines).size).toBe(lines.length);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-text-pools.test.js`
Expected: FAIL — no pool files.

- [ ] **Step 3: Write the registration skeleton yourself**

```js
// js/dr/text/pools/index.js — every pool, loaded for its side effect
import './werk-room.js';
import './untucked.js';
import './challenge.js';
import './critiques.js';
import './lipsync.js';
import './arrivals.js';
import './host.js';
import './storyline.js';
```

Each file's shape, with `werk-room.js` as the worked example the writing brief carries:

```js
// js/dr/text/pools/werk-room.js
import { registerPool } from '../index.js';

registerPool('mirror-read', [
  '{A} reads the message {gone} left on the mirror out loud, and the room goes quiet.',
  '"{gone} was here" is still on the glass. {A} reads it twice before anyone else says anything.',
  '{A} finds the mirror message first. {They} does not wipe it off.',
  'The lipstick on the mirror is {gone}’s handwriting. {A} reads it to the room.',
  '{A} stands at the mirror a long time before {they} reads what {gone} wrote.',
  'Nobody wants to be the one to read it, so {A} does.',
]);
// ... one registerPool per event id in this step
```

- [ ] **Step 4: Dispatch the writing**

One Opus writing subagent per pool file, in parallel where they do not share a file. The brief for each:

> Write prose variants for the Drag Race simulator's `<file>` pool. This is a fictional drag competition in an original universe: no real people, no real places. Vocabulary you MAY use: queen, queens, werk room, main stage, runway, maxi challenge, mini challenge, lip sync, shantay, sashay, Untucked, the bottom, safe, condragulations. Vocabulary you may NEVER use, because it belongs to other shows in this franchise: tribe, camp, campfire, idol, merge, tribal council, contestant, voted out, house, houseguest, eviction, evicted, nominated, the block, veto, jury, juror, castle, banished, murder, traitor, faithful, mission, roundtable.
> Tokens available: `{a}` `{b}` `{c}` for the scene's players in order, `{A}` capitalised, `{they}` `{them}` `{their}` `{They}` for `{a}`'s pronouns (never assume gender), `{gone}` for the departed queen, `{challenge}`, `{song}`, `{judge}`, `{category}`, `{queen}` `{queens}` `{round}` `{exit}` from the registry.
> For each kind listed, write N distinct variants. They must differ in structure, not only in adjective. At least two should be from a queen's point of view and at least two from the room's. Never state a result the scene does not carry: a werk room line may not say who wins. Keep each under 200 characters. Return a single JS file calling `registerPool` once per kind.

Review each returned file against: the vocabulary ban, the token list, four-plus structurally different variants, nothing that decides an outcome, and no line that reads as a stage direction rather than narration.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/dr-text-pools.test.js tests/dr-text-engine.test.js tests/dr-text-purity.test.js`
Expected: PASS, all three, including the coverage assertion that was red in Task 6.

- [ ] **Step 6: Commit**

```bash
git add js/dr/text/pools tests/dr-text-pools.test.js
git commit -m "feat(drag-race): the pools — every scene kind has six-plus variants in the show's own words"
```

---

### Task 8: Rendering the scenes, and the transcript

**Files:**
- Create: `js/dr/transcript.js`
- Modify: `js/dr/week.js` (fill `scene.text`), `js/dr/season.js` (arrivals, crowning)
- Modify: `js/text-backlog.js` (dispatch a drag-race episode)
- Test: `tests/dr-transcript.test.js`

**Interfaces:**
- Produces:
  - `renderRow(row, ctx) → row` — walks `row.dr.scenes` and fills `scene.text` via `renderScene`, with one `_used` set per episode so nothing repeats within it.
  - `transcriptFor(row, { players }) → string` — the episode text backlog: a header (`DRAG RACE — EPISODE N`), then one `=== SECTION ===` per step in `SCENE_STEPS` order carrying its scenes' text, then the critiques as `JUDGE: line`, the results block, the lip sync beats, and the exit. It is a complete retranscription of what the screens will show (the project's text-backlog rule).
  - `generateDragSummaryText(ep) → string` exported for `js/text-backlog.js`, which dispatches on `ep.format === 'drag-race'` beside the Traitors branch.
- `js/dr/season.js` gains: an `arrivals` scene list on episode one (`entrance:<archetype>` per queen, in cast order), and a `crowning` scene on the finale row.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-transcript.test.js
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { transcriptFor } from '../js/dr/transcript.js';
import { SCENE_STEPS } from '../js/dr/week.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'mastermind', 'goat', 'schemer', 'showmancer'];
function cast(n = 12, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Queen${i + 1}`, slug: `queen${i + 1}`,
    gender: ['f', 'm', 'nb'][i % 3], archetype: ARCH[i % ARCH.length], age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}

describe('the transcript', () => {
  const c = cast(12, 4);
  const { rows } = playDragSeason({ cast: c, seed: 6 });
  const players = Object.fromEntries(c.map(p => [p.name, p]));

  it('every scene on every row has real text', () => {
    for (const row of rows) {
      for (const s of row.dr.scenes) {
        expect(typeof s.text, `${row.num}/${s.kind}`).toBe('string');
        expect(s.text.length, `${row.num}/${s.kind} is empty`).toBeGreaterThan(10);
        expect(s.text, `${row.num}/${s.kind} left a token`).not.toMatch(/[{}]/);
      }
    }
  });
  it('reads as one show, in its own words', () => {
    for (const row of rows) {
      const t = transcriptFor(row, { players });
      expect(foreignWordsIn(t, 'drag-race'), `episode ${row.num}`).toEqual([]);
      expect(t).toMatch(/DRAG RACE — EPISODE/);
      expect(t.length).toBeGreaterThan(800);
    }
  });
  it('sections follow the running order', () => {
    const t = transcriptFor(rows[2], { players });
    const seen = SCENE_STEPS.filter(s => t.includes(`=== ${s.toUpperCase().replace(/-/g, ' ')} ===`));
    const idx = seen.map(s => t.indexOf(`=== ${s.toUpperCase().replace(/-/g, ' ')} ===`));
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
    expect(seen.length).toBeGreaterThan(6);
  });
  it('carries the critiques, the result and the exit', () => {
    const t = transcriptFor(rows[1], { players });
    expect(t).toMatch(/=== CRITIQUES ===/);
    expect(t).toMatch(/RuPaul:|Michelle Visage:/);
    expect(t).toMatch(/=== RESULTS ===/);
    expect(t).toMatch(/sashayed away/);
  });
  it('the premiere carries an entrance line for every queen', () => {
    const t = transcriptFor(rows[0], { players });
    for (const p of c) expect(t, `${p.name} did not walk in`).toContain(p.name);
    expect(t).toMatch(/=== ARRIVALS ===/);
  });
  it('the finale crowns somebody in words', () => {
    const t = transcriptFor(rows[rows.length - 1], { players });
    expect(t).toMatch(/=== CROWNING ===/);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-transcript.test.js`
Expected: FAIL — `js/dr/transcript.js` not found.

- [ ] **Step 3: Implement**

```js
// js/dr/transcript.js — the episode, as text (the project's text-backlog rule)
//
// A complete retranscription of what the screens show. Everything here reads
// the ROW, never live state, so a transcript of episode 3 is episode 3 even
// after the season has ended.
import { renderScene } from './text/index.js';
import { SCENE_STEPS } from './week.js';
import { judgeById } from './judges.js';
import { showWords } from '../shows.js';

/** Fill every scene's text, once, with one anti-repetition set per episode. */
export function renderRow(row, { players }) {
  const ctx = { episode: row.num, _used: new Set(), players,
    challenge: row.dr?.challenge, song: row.dr?.lipsync ? { title: row.dr.lipsync.song } : null,
    gone: row.exits?.[0]?.name || null,
    rng: (() => { let s = (row.num || 1) * 9301 + 49297; return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff); })() };
  for (const scene of row.dr?.scenes || []) {
    if (scene.text) continue;
    try { scene.text = renderScene(scene, { ...ctx, judge: scene.data?.judge ? judgeById(scene.data.judge) : null }); }
    catch (e) { scene.text = ''; scene.textError = String(e.message || e); }
  }
  return row;
}

const HEAD = s => `=== ${s.toUpperCase().replace(/-/g, ' ')} ===`;

export function transcriptFor(row, { players }) {
  renderRow(row, { players });
  const L = [];
  const ln = s => L.push(s);
  const w = showWords('drag-race');
  ln(`DRAG RACE — EPISODE ${row.dr?.ep ?? row.num}`);
  ln('═'.repeat(46));
  if (row.dr?.challenge) ln(`${w.challenge}: ${row.dr.challenge.name}`);
  if (row.dr?.judges?.length) ln(`On the panel: ${row.dr.judges.map(id => judgeById(id)?.name || id).join(', ')}`);

  const byStep = {};
  for (const s of row.dr?.scenes || []) (byStep[s.step] ||= []).push(s);
  const order = [...new Set(['arrivals', ...SCENE_STEPS, 'crowning'])];
  for (const step of order) {
    const scenes = byStep[step];
    if (!scenes || !scenes.length) continue;
    ln(''); ln(HEAD(step));
    for (const s of scenes) if (s.text) ln(`  ${s.text}`);
  }

  if (row.dr?.critiques?.length) {
    ln(''); ln(HEAD('critiques'));
    const byQueen = {};
    for (const c of row.dr.critiques) (byQueen[c.queen] ||= []).push(c);
    for (const [queen, lines] of Object.entries(byQueen)) {
      ln(`  ${queen}:`);
      for (const c of lines) ln(`    ${judgeById(c.judge)?.name || c.judge}: ${c.text || `[${c.tone}]`}`);
    }
  }

  if (row.dr?.call) {
    ln(''); ln(HEAD('results'));
    const c = row.dr.call;
    if (c.win?.length) ln(`  Winner: ${c.win.join(' and ')}`);
    if (c.high?.length) ln(`  High: ${c.high.join(', ')}`);
    if (c.safe?.length) ln(`  Safe: ${c.safe.join(', ')}`);
    if (c.low?.length) ln(`  Low: ${c.low.join(', ')}`);
    if (c.bottom?.length) ln(`  Bottom two: ${c.bottom.join(' and ')}`);
  }

  if (row.dr?.lipsync) {
    const ls = row.dr.lipsync;
    ln(''); ln(HEAD('lip sync'));
    ln(`  ${ls.queens.join(' vs ')} — "${ls.song}" by ${ls.artist}`);
    if (ls.call === 'double-shantay') ln('  Both stay.');
    else if (ls.call === 'double-sashay') ln('  Both go.');
    else if (ls.winner) ln(`  ${ls.winner} stays.`);
  }

  if (row.exits?.length) {
    ln(''); ln(HEAD('exit'));
    for (const x of row.exits) ln(`  ${x.name} — ${x.verb}.`);
  }
  if (row.dr?.finale) {
    ln(''); ln(HEAD('crowning'));
    ln(`  ${row.dr.finale.winner} is crowned. ${row.dr.finale.runnerUp} is the runner-up.`);
  }
  if (row.dr?.living?.length) { ln(''); ln(`  ${row.dr.living.length} ${w.players} left: ${row.dr.living.join(', ')}`); }
  return L.join('\n');
}

export function generateDragSummaryText(ep, players = {}) {
  return transcriptFor(ep, { players });
}
```

- [ ] **Step 4: Arrivals, crowning, and the backlog dispatch**

In `js/dr/season.js`: on the first row, push one scene per queen in cast order, `{ step: 'arrivals', kind: `entrance:${player.archetype}`, data: { players: [name] } }`, and on the finale row `{ step: 'crowning', kind: 'crowning', data: { players: placements } }`.

In `js/dr/week.js`: after building the row, call `renderRow(row, { players })` so every scene has text before the row is stored.

In `js/text-backlog.js`: import `generateDragSummaryText` and dispatch beside the Traitors branch — `if (ep.format === 'drag-race') return generateDragSummaryText(ep, Object.fromEntries((players||[]).map(p => [p.name, p])));`

Also fill `critique.text` in `js/dr/week.js`: for each critique line, `renderScene({ kind: critiqueKind(c.judge, c.tone), data: { players: [c.queen], judge: c.judge } }, ctx)`.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/dr-transcript.test.js tests/dr-text-pools.test.js tests/show-vocabulary.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/dr/transcript.js js/dr/week.js js/dr/season.js js/text-backlog.js tests/dr-transcript.test.js
git commit -m "feat(drag-race): scenes render to prose, and an episode transcribes end to end"
```

---

### Task 9: Read a season and fix what you find

**Files:**
- Create: `tools/dump-drag-season.mjs`
- Create: `docs/drag-race-season-read.md` (the findings)
- Modify: whatever the read exposes
- Test: `tests/dr-prose.test.js`

**This task is not optional and cannot be replaced by an assertion.** Every prose bug in this project's history was found by dumping real output and reading it; none was found by a test (memory `feedback_read_the_output`).

**Interfaces:**
- `node tools/dump-drag-season.mjs [seed] [cast]` prints a full season transcript to stdout and writes `tmp/drag-season-<seed>.txt`.
- `tests/dr-prose.test.js` — the mechanical half: over 10 seasons, no episode repeats a line, no line exceeds 300 characters, no line contains a double space or a stray brace, every queen who appears in a scene's `players` is named in its text, and the ratio of distinct lines to total lines is above 0.8.

- [ ] **Step 1: Write the dumper**

```js
// tools/dump-drag-season.mjs — play a season and print it, for reading
import { playDragSeason } from '../js/dr/season.js';
import { transcriptFor } from '../js/dr/transcript.js';
import { rngFor } from '../js/dr/rng.js';
import { mkdirSync, writeFileSync } from 'node:fs';

const seed = Number(process.argv[2] || 1);
const size = Number(process.argv[3] || 13);
const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'mastermind', 'goat', 'schemer', 'showmancer',
  'hothead', 'challenge-beast', 'social-butterfly', 'loyal-soldier', 'chaos-agent', 'underdog', 'perceptive-player'];
const NAMES = ['Vega Sharpe', 'Miss Tallulah', 'Kiki Vandross', 'Bianca Sol', 'Roxy Vaudeville',
  'Delphine Cru', 'Hex Marlowe', 'Sunday Best', 'Ivy Sinclair', 'Mona Lisa Frost', 'Peach Melba',
  'Cassandra Vye', 'Juno Blaze', 'Petra Chrome', 'Odette Mourning', 'Bunny Belladonna'];
const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
const cast = Array.from({ length: size }, (_, i) => ({
  name: NAMES[i % NAMES.length], slug: `q${i + 1}`, gender: ['f', 'nb', 'm'][i % 3],
  archetype: ARCH[i % ARCH.length], age: 21 + Math.floor(rng() * 20),
  stats: Object.fromEntries(STATS.map(k => [k, r()])),
  drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r(),
    style: ['pageant', 'comedy', 'fashion', 'camp', 'club-kid', 'spooky', 'broadway', 'dancer', 'glamour', 'art'][i % 10] },
}));
const players = Object.fromEntries(cast.map(p => [p.name, p]));
const { rows, winner, runnerUp } = playDragSeason({ cast, seed });
const text = rows.map(row => transcriptFor(row, { players })).join('\n\n' + '─'.repeat(60) + '\n\n')
  + `\n\nWINNER: ${winner}\nRUNNER-UP: ${runnerUp}\n`;
mkdirSync('tmp', { recursive: true });
writeFileSync(`tmp/drag-season-${seed}.txt`, text);
console.log(text);
```

- [ ] **Step 2: Write the mechanical guard**

```js
// tests/dr-prose.test.js
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { transcriptFor } from '../js/dr/transcript.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'mastermind', 'goat', 'schemer', 'showmancer'];
function cast(n, seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`,
    gender: ['f', 'm', 'nb'][i % 3], archetype: ARCH[i % ARCH.length], age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}

describe('prose quality, mechanically', () => {
  const seasons = Array.from({ length: 10 }, (_, s) => {
    const c = cast(12, 200 + s);
    const { rows } = playDragSeason({ cast: c, seed: s });
    return { c, rows, players: Object.fromEntries(c.map(p => [p.name, p])) };
  });

  it('no episode repeats a line, and a season is mostly distinct', () => {
    let total = 0, distinct = new Set();
    for (const { rows, players } of seasons) {
      for (const row of rows) {
        const lines = row.dr.scenes.map(s => s.text).filter(Boolean);
        expect(new Set(lines).size, `episode ${row.num} repeats itself`).toBe(lines.length);
        for (const l of lines) { total++; distinct.add(l); }
        void players;
      }
    }
    expect(distinct.size / total, 'the season repeats itself across episodes').toBeGreaterThan(0.8);
  });
  it('no line is malformed', () => {
    for (const { rows } of seasons) for (const row of rows) for (const s of row.dr.scenes) {
      if (!s.text) continue;
      expect(s.text.length, `${s.kind} is too long`).toBeLessThan(300);
      expect(s.text, `${s.kind} has a double space`).not.toMatch(/ {2}/);
      expect(s.text, `${s.kind} has a stray brace`).not.toMatch(/[{}]/);
      expect(s.text.trim(), `${s.kind} is untrimmed`).toBe(s.text);
      expect(s.textError, `${s.kind} failed to render: ${s.textError}`).toBeFalsy();
    }
  });
  it('a scene names the queens it is about', () => {
    for (const { rows } of seasons.slice(0, 3)) for (const row of rows) for (const s of row.dr.scenes) {
      const named = s.data?.players || [];
      if (!named.length || !s.text) continue;
      expect(s.text, `${s.kind} does not name ${named[0]}`).toContain(named[0]);
    }
  });
  it('a full transcript is substantial', () => {
    for (const { rows, players } of seasons.slice(0, 3)) {
      const t = rows.map(r => transcriptFor(r, { players })).join('\n');
      expect(t.length).toBeGreaterThan(15000);
    }
  });
});
```

- [ ] **Step 3: Run the guard**

Run: `npx vitest run tests/dr-prose.test.js`
Expected: PASS. Fix pools, not the thresholds.

- [ ] **Step 4: DUMP AND READ**

Run:
```
node tools/dump-drag-season.mjs 1 13
node tools/dump-drag-season.mjs 7 12
node tools/dump-drag-season.mjs 42 14
```

Read all three, start to finish. Write `docs/drag-race-season-read.md` recording, for each finding: what the line said, what it should have said, and which file you changed. What to look for, from this project's history:

- a sentence that could be about a different show (furniture, not just nouns)
- a line that states a result the scene cannot know
- a queen described in the wrong pronouns
- an event that fires every episode, or one that never fires
- a critique that praises what the judge does not care about
- an Untucked scene that is calm after a crash-out
- the same structure four times with different names
- an entrance line that does not match the archetype it is filed under
- the transcript opening with a spoiler (the Traitors bug: the header naming who went home before the lip sync)

- [ ] **Step 5: Fix what you found, then re-dump and re-read one season**

- [ ] **Step 6: Commit**

```bash
git add tools/dump-drag-season.mjs tests/dr-prose.test.js docs/drag-race-season-read.md js/dr
git commit -m "test(drag-race): prose guard, season dumper, and the fixes the first read found"
git push
```

---

## Self-review against the spec

- §7 storylines: Tasks 1–2, with the arcs, the earned ones, and the bounded wants. §5 steps 1, 2, 8: Task 3. §6.5 reactions and §6.6 twists: Task 4. §5 step 13 Untucked: Task 5. Every line the show prints: Tasks 6–8. The read-the-output law: Task 9.
- The spec's measurement "every storyline reaches its second beat in ≥70% of seasons" is asserted in Task 2; the rest are Plan 6's.
- Deferred: the VP screens that display all of this (Plan 5), the export (Plan 4), the AI episode writer's own prompt (Plan 6).
- Type consistency: a scene is `{ step, kind, data, text }` throughout; an event is `{ type, players, bond, pop, state, data }`; `critiqueKind(judgeId, tone)` is the only builder of a critique pool key.
