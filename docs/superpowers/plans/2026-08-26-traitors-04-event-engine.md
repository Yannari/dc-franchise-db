# The Traitors — Plan 4: The event engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a castle where things happen between the beats, where what happened last week is why this week happens, and where no two seasons read the same.

**Architecture:** A new `js/tr/events.js` holds a registry of castle events, each declaring `weight(ctx)` over live state and a `fire(ctx, rng)` that writes consequences. `js/tr/threads.js` holds the continuity spine — events open, advance and close threads, and an event that advances one always outranks an event that starts something new. `js/tr/channel-audit.js` is the gate any event must pass before it is allowed to write a belief.

**Tech Stack:** ES modules, no build step. Vitest.

**Spec:** `docs/superpowers/specs/2026-08-25-traitors-design.md` — §5 is this plan. §7 (missions, powers) and §8 (endgame) are NOT.

---

## The constraint that shapes this whole plan

Every event that forms a belief is a **new evidence channel**. This project has shipped three bad ones and caught them all by measurement, never by reading the code:

- `_assess()`'s ground-truth valence — sanctioned design, but it supplied most of a headline number nobody had questioned.
- `murderCost.blames = livingTraitors(...)` — an evidence source reading ground truth, naming a real Traitor **84 times out of 84**.
- `clashTraced` — an **anti-signal** at 0.87× emission and 0.57× on surviving beliefs, pointing the room at innocents, because `formPreference` penalises murdering someone you clashed with.

And the calibration currently has **0.24pp of worst-block headroom on late lift**. A pool of 150 events that write beliefs will move that gate, and if it moves the wrong way nothing in a green suite will say which event did it.

**Therefore the governing rule of this plan:**

> **An event may write a belief only if its channel has been measured above an uninformative control. Bonds, state and residue are free; beliefs are earned.**

Task 4 builds the instrument that decides. It comes **before** the pool at scale, deliberately.

---

## Global Constraints

- **Branch `traitors`, worktree `../worktree-traitors`.** The main folder is on `main` with another session live in it. Never `git checkout` there.
- **`git add <explicit paths>`, never `-A`.** `git status --short` AND `git branch --show-current` before every commit.
- **Touched-file sweep before committing**, by PATH fragment (basename matches dozens of unrelated suites):
  ```bash
  for f in $(git diff --name-only); do grep -rl "$f" tests/ 2>/dev/null; done | sort -u
  ```
- **Never the full suite** — it exhausts memory. Named files only; kill orphan vitest workers after (filter on `vitest`, never all `node.exe`).
- **No bare `Math.random()`.** Every draw takes an injected `rng`. Seasons must replay identically; `rngFor` hashes its seed and must keep doing so.
- **Valid stats, the only nine:** `physical`, `endurance`, `mental`, `social`, `strategic`, `loyalty`, `boldness`, `intuition`, `temperament`.
- **The show stays NOT runnable.** Do not set `window._trRunnable`.
- **Do not touch `_assess()`** in `js/knowledge.js` — its ground-truth valence is sanctioned design (spec §4.2).
- **Exactly three `public`/`observed` alignment writes exist** (the turret, a banishment reveal, a recruit seeing the turret). **Add no fourth.** Everything an event writes about alignment is `deduced` or `rumor`.
- **Never widen a calibration band.** They were built after a placebo engine defeated an earlier set. If one fails, fix the design or report it.

## Eight lessons this project has paid for — every task inherits all eight

1. A test wrapped in `if (…) { assertions }` **cannot fail**. Eight instances so far.
2. A test must **exercise the rule it names**. If it names a condition, vary that condition.
3. A suppression test asserts **both directions from the same fixture**.
4. Property, or one draw of a coin? Probabilistic outcomes need **population assertions** — fresh world per attempt, bar below the measured rate with headroom, rate logged.
5. Every loop attempt starts from a **genuinely fresh world**. A half-reset leaks beliefs and inflates results.
6. **An extreme value is an anomaly to investigate, not a result to report.** A flat 0% or a clean 100% out of a probabilistic formula is a construction artifact until proven otherwise.
7. **A number inherited from a report is not a measurement** until re-derived against the current engine.
8. **Measure a channel against a control, never against a base rate.** `pushedThenDied` looked like 1.45× against a flat base and was 0.01× against "voted for any Faithful".

---

## File structure

| File | Responsibility | Task |
|---|---|---|
| `js/tr/threads.js` | Open / advance / close, and the residue later events cite | 1 |
| `js/tr/events.js` | The registry, `weight(ctx)`, the four guards, the runner | 2, 3 |
| `js/tr/channel-audit.js` | Measures a belief-writing channel against a control | 4 |
| `js/tr/castle/*.js` | The pool, one file per family | 5, 6 |
| `js/tr/headless.js` | Windows wired into the season loop | 3 |
| `js/tr/state.js` | `threads`, `residue`, cooldown ledgers | 1, 2 |
| `tests/tr-threads.test.js` · `tr-events.test.js` · `tr-castle.test.js` | New | 1–6 |
| `tests/tr-calibration.test.js` | Re-measured, bands inherited | 7 |

---

### Task 1: Threads — the continuity spine

**Files:** Create `js/tr/threads.js`; modify `js/tr/state.js`; create `tests/tr-threads.test.js`

**Interfaces:**
- Produces: `openThread(kind, parties, ep, seed)`, `advanceThread(id, ep, note)`, `closeThread(id, ep, outcome)`, `openThreadsFor(name, ep)`, `hottest(name, ep)`, `residueFor(name)`.

**Why threads exist (spec §5.1–5.2):** repetition does not come from reusing an event. It comes from every firing being **unconnected**, so nothing accumulates and each episode restarts from zero. A thread is what lets episode 7's accusation name episode 2 — because episode 2 wrote something down.

The shape, extending what `state.js` already declares:

```js
{ id, kind, parties: [], openedEp, lastEp, act, state: 'open'|'closed',
  beats: [{ ep, eventId, note }], heat, outcome }
```

**`heat` is not a mood.** It is what makes an old thread lose to a live one in `weight(ctx)`, and it decays — a suspicion nobody has fed in four rounds should stop shaping the season.

- [ ] **Step 1: Write the failing test**

Create `tests/tr-threads.test.js`:

```js
// A season is not forty incidents. It is a handful of stories that get picked
// up, escalated, and paid off — and the only reason an accusation in episode 7
// can name episode 2 is that episode 2 wrote something down.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { openThread, advanceThread, closeThread, openThreadsFor, hottest, residueFor }
  from '../js/tr/threads.js';
import roster from '../franchise_roster.json';

const CAST = roster.players.slice(0, 8).map(p => p.name);
beforeEach(() => {
  setPlayers(roster.players.slice(0, 8));
  setGs({ bonds: {}, activePlayers: [...CAST] });
  gs.tr = initTraitorsState();
});

describe('a thread accumulates', () => {
  it('remembers every beat, with the episode attached', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    advanceThread(t.id, 3, 'asked for a vote and did not get it');
    advanceThread(t.id, 4, 'broke the commitment at the table');
    const thread = gs.tr.threads.find(x => x.id === t.id);
    expect(thread.beats).toHaveLength(3);
    expect(thread.beats.map(b => b.ep)).toEqual([2, 3, 4]);
    expect(thread.lastEp).toBe(4);
  });

  it('gets hotter as it is fed', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    const cold = gs.tr.threads.find(x => x.id === t.id).heat;
    advanceThread(t.id, 3, 'again');
    advanceThread(t.id, 4, 'again');
    expect(gs.tr.threads.find(x => x.id === t.id).heat).toBeGreaterThan(cold);
  });

  it('cools when nobody feeds it, so a stale story stops steering the season', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    const atOpen = hottest(CAST[0], 2)?.heat ?? 0;
    const stale = hottest(CAST[0], 9)?.heat ?? 0;
    expect(stale).toBeLessThan(atOpen);
  });

  it('closes with an outcome, and stops being open', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    closeThread(t.id, 7, 'banished-and-was-faithful');
    expect(openThreadsFor(CAST[0], 7)).toHaveLength(0);
    expect(gs.tr.threads.find(x => x.id === t.id).outcome).toBe('banished-and-was-faithful');
  });

  it('leaves residue a later event can cite by episode', () => {
    const t = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    advanceThread(t.id, 4, 'broke the commitment at the table');
    const res = residueFor(CAST[0]);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0]).toHaveProperty('ep');
    expect(res[0]).toHaveProperty('note');
  });

  it('is deterministic — the same season replays the same threads', () => {
    const a = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    gs.tr = initTraitorsState();
    const b = openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    expect(a.id).toBe(b.id);
  });
});
```

- [ ] **Step 2: Run it and watch it fail.** `npx vitest run tests/tr-threads.test.js`

- [ ] **Step 3: Extend state**

In `js/tr/state.js`, replace the `threads` comment and add two fields:

```js
    // Open narrative threads. See spec 5.2. An event that ADVANCES one of these
    // always outranks an event that opens something new — that single rule is
    // what stops a season reading as forty unconnected incidents.
    threads: [],

    // What events have written down, keyed by player: [{ ep, note, threadId }].
    // This is why episode 7's accusation can name episode 2. Without it every
    // event is a sentence nobody can refer back to.
    residue: {},

    // Three cooldown scopes: by event id, by player, by PAIR. The pair scope is
    // the one that matters — without it the same two people have the same
    // conversation four times and the season reads as a loop.
    cooldowns: { event: {}, player: {}, pair: {} },
```

- [ ] **Step 4: Write `js/tr/threads.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// tr/threads.js — the reason a season is a story and not a list
// ══════════════════════════════════════════════════════════════════════
//
// Repetition does not come from reusing an event. It comes from every firing
// being UNCONNECTED, so nothing accumulates and each episode restarts from
// zero. A thread is the accumulator: it is opened by one event, fed by others,
// and eventually paid off or abandoned.
//
// `heat` is what makes a live story beat a stale one when the runner picks. It
// decays on purpose — a suspicion nobody has mentioned in four rounds should
// stop steering the castle, or the season's second half is decided by its first.
import { gs } from '../core.js';

/** Deterministic id: same parties, same kind, same episode → same thread. */
function _id(kind, parties, ep) {
  return `${kind}:${[...parties].sort().join('|')}:${ep}`;
}

export function openThread(kind, parties, ep, seed = '') {
  if (!gs.tr) return null;
  const id = _id(kind, parties, ep);
  const existing = gs.tr.threads.find(t => t.id === id);
  if (existing) return existing;
  const t = { id, kind, parties: [...parties], openedEp: ep, lastEp: ep,
    state: 'open', beats: [{ ep, eventId: seed, note: seed }], heat: 1, outcome: null };
  gs.tr.threads.push(t);
  _writeResidue(t, ep, seed);
  return t;
}

export function advanceThread(id, ep, note = '', eventId = '') {
  const t = gs.tr?.threads?.find(x => x.id === id);
  if (!t || t.state !== 'open') return null;
  t.beats.push({ ep, eventId, note });
  t.lastEp = ep;
  t.heat = Math.min(4, t.heat + 1);
  _writeResidue(t, ep, note);
  return t;
}

export function closeThread(id, ep, outcome) {
  const t = gs.tr?.threads?.find(x => x.id === id);
  if (!t) return null;
  t.state = 'closed';
  t.outcome = outcome;
  t.lastEp = ep;
  return t;
}

/** Heat as it stands at `ep` — one point of decay per round of silence. */
export function heatAt(t, ep) {
  return Math.max(0, t.heat - Math.max(0, ep - t.lastEp) * 0.5);
}

export function openThreadsFor(name, ep) {
  return (gs.tr?.threads || [])
    .filter(t => t.state === 'open' && t.parties.includes(name) && heatAt(t, ep) > 0);
}

/** The story most worth continuing for this person right now. */
export function hottest(name, ep) {
  const open = openThreadsFor(name, ep)
    .map(t => ({ ...t, heat: heatAt(t, ep) }))
    .sort((a, b) => b.heat - a.heat);
  return open[0] || null;
}

/** What has been written down about this person, oldest first. */
export function residueFor(name) {
  return (gs.tr?.residue?.[name] || []);
}

function _writeResidue(t, ep, note) {
  if (!note) return;
  for (const p of t.parties) {
    (gs.tr.residue[p] ||= []).push({ ep, note, threadId: t.id });
  }
}
```

- [ ] **Step 5: Run, sweep, commit**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-threads.test.js tests/traitors-registry.test.js
for f in $(git diff --name-only); do grep -rl "$f" tests/ 2>/dev/null; done | sort -u
git branch --show-current && git status --short
git add js/tr/threads.js js/tr/state.js tests/tr-threads.test.js
git commit -m "Episode seven can name episode two, because episode two wrote it down"
```

---

### Task 2: The event contract and the four guards

**Files:** Create `js/tr/events.js`; create `tests/tr-events.test.js`

**Interfaces:** Produces `registerEvent(def)`, `eligible(ctx)`, `pickEvent(ctx, rng)`, `EVENTS`.

An event is:

```js
{ id, family, window, oncePerSeason?, writesBelief?,
  weight(ctx) → number,        // 0 means not eligible now
  fire(ctx, rng) → { consequences } }
```

**`weight(ctx)` is a function, and most events are 0 most of the time.** That is the anti-repetition mechanism: an event with sharp preconditions fires once a season and reads as authored rather than rolled.

**The four guards (spec §5.4):**

1. **Continuation beats novelty** — an event advancing an open thread gets a multiplier. This is the single most important rule in the plan.
2. **Rare-state amplification** — an event whose preconditions are rare is weighted **up** when eligible, never down. Content gated behind a rare state and weighted normally never fires: you have shipped events you believe are in the game. **`weight()` and `fire()` must agree** — a test enforces it.
3. **Cooldowns at three scopes** — event, player, and **pair**. The pair scope is the one that matters; without it the same two people have the same conversation four times.
4. **Acts** — early/middle/late multipliers. An episode-2 castle must not sound like an episode-9 castle.

- [ ] **Step 1: Write the failing test**

Create `tests/tr-events.test.js`:

```js
// The engine that decides what happens tonight.
//
// Most events are weight 0 most of the time, and that is the point: an event
// with sharp preconditions fires once a season and reads as authored. What
// stops a season looping is not more events — it is that a live story beats a
// fresh one, that the same pair cannot repeat themselves, and that the castle
// in episode 9 does not sound like the castle in episode 2.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { openThread } from '../js/tr/threads.js';
import { registerEvent, eligible, pickEvent, validateRegistry, EVENTS, _resetRegistry }
  from '../js/tr/events.js';
import roster from '../franchise_roster.json';

const CAST = roster.players.slice(0, 8).map(p => p.name);
function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function ctxFor(ep = 3, window = 'evening') {
  return { ep, window, act: ep <= 3 ? 'early' : ep <= 7 ? 'middle' : 'late',
    living: [...CAST], rng: seededRng(1) };
}
beforeEach(() => {
  setPlayers(roster.players.slice(0, 8));
  setGs({ bonds: {}, activePlayers: [...CAST] });
  gs.tr = initTraitorsState();
  _resetRegistry();
});

describe('the contract', () => {
  it('catches an event whose weight and fire disagree about eligibility', () => {
    // The BB Hacker lesson: an event that weights itself eligible and then
    // declines to do anything is content you believe is in the game and is not.
    //
    // This is a SWEEP, not a registration-time check. Validating by execution
    // at registration would fire the event against the live season and write
    // bonds, threads and residue as an import side effect — a worse bug than
    // the one being guarded.
    registerEvent({ id: 'broken', family: 'suspicion', window: 'evening',
      weight: () => 5, fire: () => null });
    registerEvent({ id: 'honest', family: 'suspicion', window: 'evening',
      weight: () => 5, fire: () => ({ ok: true }) });
    const broken = validateRegistry(() => ctxFor(), seededRng(1));
    expect(broken).toContain('broken');
    expect(broken).not.toContain('honest');
  });

  it('treats weight 0 as not eligible', () => {
    registerEvent({ id: 'never', family: 'suspicion', window: 'evening',
      weight: () => 0, fire: () => ({ ok: true }) });
    expect(eligible(ctxFor()).map(e => e.id)).not.toContain('never');
  });

  it('only offers events for the current window', () => {
    registerEvent({ id: 'night-only', family: 'grief', window: 'night',
      weight: () => 5, fire: () => ({ ok: true }) });
    expect(eligible(ctxFor(3, 'evening')).map(e => e.id)).not.toContain('night-only');
    expect(eligible(ctxFor(3, 'night')).map(e => e.id)).toContain('night-only');
  });
});

describe('continuation beats novelty', () => {
  it('an event advancing a live thread outranks an identical fresh one', () => {
    registerEvent({ id: 'fresh', family: 'suspicion', window: 'evening',
      weight: () => 5, fire: () => ({ ok: true }) });
    registerEvent({ id: 'continues', family: 'suspicion', window: 'evening',
      advancesThread: true, weight: () => 5, fire: () => ({ ok: true }) });
    openThread('suspicion', [CAST[0], CAST[1]], 2, 'eavesdrop');
    const ctx = { ...ctxFor(), actors: [CAST[0], CAST[1]] };
    const scored = eligible(ctx);
    const fresh = scored.find(e => e.id === 'fresh');
    const cont = scored.find(e => e.id === 'continues');
    expect(cont.score, 'a live story did not beat a fresh one').toBeGreaterThan(fresh.score);
  });
});

describe('the guards', () => {
  it('amplifies a rare event when it finally becomes eligible', () => {
    registerEvent({ id: 'common', family: 'trust', window: 'evening',
      weight: () => 5, fire: () => ({ ok: true }) });
    registerEvent({ id: 'rare', family: 'trust', window: 'evening', rare: true,
      weight: (c) => (c.ep === 6 ? 5 : 0), fire: () => ({ ok: true }) });
    const scored = eligible(ctxFor(6));
    const rare = scored.find(e => e.id === 'rare');
    const common = scored.find(e => e.id === 'common');
    expect(rare.score, 'a rare event was not amplified when it became eligible')
      .toBeGreaterThan(common.score);
  });

  it('will not repeat the same PAIR, which is what makes a season loop', () => {
    registerEvent({ id: 'pairtalk', family: 'trust', window: 'evening',
      weight: () => 5, fire: () => ({ ok: true }) });
    const ctx = { ...ctxFor(), actors: [CAST[0], CAST[1]] };
    pickEvent(ctx, seededRng(2));
    const after = eligible({ ...ctx, ep: ctx.ep });
    expect(after.map(e => e.id), 'the same pair was offered the same event again')
      .not.toContain('pairtalk');
  });

  it('will not fire a oncePerSeason event twice', () => {
    registerEvent({ id: 'signature', family: 'suspicion', window: 'evening',
      oncePerSeason: true, weight: () => 9, fire: () => ({ ok: true }) });
    pickEvent(ctxFor(), seededRng(3));
    expect(eligible(ctxFor(5)).map(e => e.id)).not.toContain('signature');
  });

  it('shifts the centre of gravity between acts', () => {
    registerEvent({ id: 'warm', family: 'trust', window: 'evening',
      acts: { early: 2, middle: 1, late: 0.3 }, weight: () => 5, fire: () => ({ ok: true }) });
    registerEvent({ id: 'paranoid', family: 'suspicion', window: 'evening',
      acts: { early: 0.3, middle: 1, late: 2 }, weight: () => 5, fire: () => ({ ok: true }) });
    const early = eligible(ctxFor(2));
    const late = eligible(ctxFor(9));
    expect(early.find(e => e.id === 'warm').score)
      .toBeGreaterThan(early.find(e => e.id === 'paranoid').score);
    expect(late.find(e => e.id === 'paranoid').score)
      .toBeGreaterThan(late.find(e => e.id === 'warm').score);
  });
});
```

- [ ] **Step 2: Run it and watch it fail.**

- [ ] **Step 3: Implement `js/tr/events.js`** — the registry, `weight(ctx)` scoring with all four guards applied as multipliers, and `pickEvent` recording the three cooldowns. Match the shapes the test asserts exactly.

**How the weight/fire agreement is validated, and how it is NOT.** `registerEvent`
must **never call `fire()`**. Firing an event writes bonds, state, residue and
threads — validating by execution would mutate a live season at import time,
which is a worse bug than the one being guarded against.

Instead `registerEvent` validates *shape* (both are functions, `id` unique,
`window` known), and the agreement itself is checked by a **sandboxed sweep**:

```js
/**
 * Does every registered event that CLAIMS to be eligible actually fire?
 *
 * The BB Hacker lesson: an event that weights itself in and then declines to
 * do anything is content you believe is in the game and is not. It cannot be
 * checked at registration, because firing has side effects — so this runs
 * against a throwaway world and is called by a test, never by the engine.
 */
export function validateRegistry(makeCtx, rng) {
  const broken = [];
  for (const ev of EVENTS) {
    const ctx = makeCtx(ev);              // a fresh sandbox world per event
    if (ev.weight(ctx) <= 0) continue;    // not claiming eligibility: fine
    if (ev.fire(ctx, rng) == null) broken.push(ev.id);
  }
  return broken;
}
```

The test asserting `registerEvent` throws on disagreement (in the brief above)
must therefore be rewritten to call `validateRegistry` and assert the broken
list contains that event — the throw belongs to the sweep, not the registration.

- [ ] **Step 4: Run, sweep, commit**

```bash
git add js/tr/events.js tests/tr-events.test.js
git commit -m "Most events are weight zero most of the time, and that is the point"
```

---

### Task 3: The runner — beats and windows

**Files:** Modify `js/tr/events.js`, `js/tr/headless.js`; append to `tests/tr-events.test.js`

**Interfaces:** Produces `runWindow(window, ep, rng) → firedEvents[]`.

**The shape of a round (spec §5.6):** four mechanical **beats** — breakfast, mission, Round Table, conclave — punctuating seven social **windows**. 4–8 events draw across the windows per round.

| window | content |
|---|---|
| *dawn* | the empty chair, before it is announced |
| *morning* | grief, first reads, the counting begins |
| *journey-out* | **the format's own gift** — the show documents that players get their most private game conversations riding to missions |
| *journey-back* | debrief, blame for a failed mission |
| *evening* | campaigning; vote pitches live here |
| *after-table* | the reckoning. Someone was just revealed. Bonds shatter |
| *night* | bedrooms, fear, romance |

**Wiring order matters and is a contract.** The existing loop's comment already says why: both evidence sources read the round that just CLOSED, so they run before `runRoundTable` opens a new one. Windows slot around that; the *after-table* window runs after the reveal cascade, and *night* runs after the conclave.

- [ ] Steps: failing test asserting each window fires only its own events and that a round produces 4–8 total; implement `runWindow`; wire the seven windows into `playTraitorsSeason`; keep the `evidence` injection point intact (the placebo control depends on it); run; commit.

---

### Task 4: The channel audit — the gate a belief-writing event must pass

**Files:** Create `js/tr/channel-audit.js`; create `tests/tr-channel-audit.test.js`

**Interfaces:** Produces `measureChannel({ source, seasons, control }) → { n, hitRate, base, ratio, controlRatio, edge }`.

**This task is the reason the plan is ordered this way.** Three bad evidence channels have shipped in this project, and every one was caught by measurement rather than by reading code. Lesson 8 is the specific form: **measure a channel against a control, never against a base rate.** `pushedThenDied` read 1.45× against a flat base and **0.01×** against "voted for any Faithful".

The audit runs a set of seasons, tags every belief with the event that produced it, and reports for each channel:
- `n` — emissions
- `hitRate` — how often the belief names a real Traitor
- `base` — the Traitor density **at the round the belief was formed**, never a season-wide average
- `ratio` — hitRate / base
- `controlRatio` — the same statistic for an uninformative control drawn the same way
- `edge` — ratio − controlRatio

**The rule it enforces:** an event may set `writesBelief: true` only if its measured `edge` is positive with a margin. An event whose channel is at or below its control is a **false-positive generator** — it points the room at innocents, and this project has already shipped one (`clashTraced`, deleted at 0.87× emission and 0.57× on surviving beliefs).

- [ ] **Step 1: Write the failing test.** Three cases, and the third is the one that matters:

```js
// The instrument that decides whether an event has earned the right to write a
// belief. Three bad channels have shipped in this project and every one was
// caught here rather than by reading code.
describe('the channel audit', () => {
  it('passes a channel that genuinely knows something', () => {
    // Synthetic: names a real Traitor 60% of the time against a ~21% base.
    const r = measureChannel({ source: 'synthetic-informed', seasons: 40, control: 'any-faithful' });
    expect(r.n).toBeGreaterThan(200);          // non-vacuity: it must have fired
    expect(r.edge).toBeGreaterThan(0.15);
  });

  it('FAILS a channel that is merely structurally enriched', () => {
    // The pushedThenDied shape: looks strong against a flat base, ~0.01x
    // against "voted for any Faithful". If the audit passes this, it is
    // measuring the same thing the old bands measured and is worthless.
    const r = measureChannel({ source: 'synthetic-structural', seasons: 40, control: 'any-faithful' });
    expect(r.ratio, 'looks informative against a naive base').toBeGreaterThan(1.1);
    expect(r.edge, 'but has no edge over an uninformative control').toBeLessThan(0.05);
  });

  it('FAILS an anti-signal outright', () => {
    // The clashTraced shape: 0.87x at emission. It points the room at
    // innocents. An audit that does not catch this has no purpose.
    const r = measureChannel({ source: 'synthetic-anti', seasons: 40, control: 'any-faithful' });
    expect(r.ratio).toBeLessThan(1);
    expect(r.edge).toBeLessThan(0);
  });

  it('bases every ratio on the density at the round the belief was formed', () => {
    // NOT a season-wide average. The murder only ever removes Faithfuls, so
    // Traitor density climbs all season and a flat base double-counts that
    // drift as if it were signal.
    const r = measureChannel({ source: 'synthetic-informed', seasons: 40, control: 'any-faithful' });
    expect(r.base).toBeGreaterThan(0.15);
    expect(r.base).toBeLessThan(0.35);
  });
});
```

- [ ] **Step 2: Run it and watch it fail.**

- [ ] **Step 3: Implement `js/tr/channel-audit.js`.** It plays seasons with belief-tagging enabled, groups emissions by their `source` string, and for each reports `{ n, hitRate, base, ratio, controlRatio, edge }`. The control draws the same number of (observer, subject) pairs the same way but from an uninformative rule, so the comparison is like-for-like. Base is computed **per emission** from the living population at that round and averaged, never taken season-wide.

- [ ] **Step 4: Verify against the real engine, not just synthetics.** Run the audit over the shipped `pushedThenDied` channel and confirm it reports an edge near the known ~0.01×. If it reports materially more, the audit is measuring the wrong thing and must be fixed before any event uses it. Report the number.

- [ ] **Step 5: Commit.**

---

### Task 5: The castle pool — a representative slice

**Files:** Create `js/tr/castle/{trust,suspicion,grief,cover}.js`; create `tests/tr-castle.test.js`

Four of the seven families, built to the shape the rest will follow. **Branching over variants (spec §5.5):** text variants stop repetition of *wording*, not of *shape*. The loyalty test is not one event with eight phrasings — it is a check that forks **kept / broken / deflected / turned back on the asker**, each writing different residue and opening different downstream events.

**Every event must have a consequence** — evidence, bond/state, or pot/power. An event that does none is cosmetic and does not ship. **Default to bonds, state and residue.** A belief requires a passing channel audit from Task 4.

**Role overrides archetype (spec §5.9):** `CLAUDE.md` says nice archetypes never scheme. A `hero` who accepts recruitment **is a Traitor** and must lie daily. Role decides permission; archetype decides competence — a hero-turned-Traitor schemes and is visibly bad at it.

- [ ] Steps: failing tests for one event per family including a four-way branch and a role-overrides-archetype case; implement; verify every event has a consequence; commit.

---

### Task 6: Scale, and the dead-event audit

**Files:** Create `js/tr/castle/{romance,callback,testing}.js`; extend all four from Task 5; append tests

**Volume target: ~150 castle events** across the seven families, plus a Traitor-only pool. Big Brother's continuity catalogue is 47 across 5 files on a show where competitions carry much of the weight; this show has no comps to hide behind.

**The dead-event audit is the deliverable, not the count.** Run 20 seasons and assert **every registered event fired at least once**. An event that never fires is content you believe is in the game and is not — the exact failure rare-state amplification exists to prevent. Report the firing distribution, not just the pass.

**The franchise-callback family is the one nothing else in the franchise can do:** two players with real history from a past season, read from the appearance ledger. Free, and unique to this simulator.

- [ ] Steps: author the pool; the dead-event audit; a repetition audit (no pair repeats an event, no season fires the same event more than its cooldown allows); commit.

---

### Task 7: Recalibrate

**Files:** Modify `tests/tr-calibration.test.js`

**The bands are inherited and must not be widened.** Current, on 12 decorrelated blocks × 200 seasons:

```
hit rate 33.30% (>22)  | early 5.76pp (<10)  | late 18.31pp (>15, worst 15.24)
growth margin 14.57pp (>5) | board 1.878 (>placebo+0.15) | victim social +1.060 (>+0.5)
```

**Late lift has 0.24pp of worst-block headroom.** Events that write beliefs will move it. If it goes red, **diagnose which channel did it using Task 4's audit** — that is what the audit is for — and either fix that event or stop and report.

Two known debts to settle here, both from Plan 3:
- `M.pushedThenDied = 0.36` was swept **with `clashTraced` present**. Re-derive it against the current engine; the honest question is whether 0.36 is now too **low**.
- Confirm the early band still cannot be tightened: a placebo must be red, and the Task-7 oracle is now structurally impossible, so nothing tighter would catch more.

- [ ] Steps: measure all bands across 12 decorrelated blocks before and after the pool; re-derive `pushedThenDied`; add a band asserting **thread continuity** — that a meaningful share of events advance an existing thread rather than opening one, which is the plan's central claim and currently unmeasured; run; commit; push.

---

## Done when

- A season produces 4–8 castle events per round across seven windows.
- Threads open, advance, close, cool, and are cited by later events.
- No event fires that a cooldown should have blocked; no pair repeats itself.
- **Every registered event fires at least once across 20 seasons.**
- **No event writes a belief without a passing channel audit.**
- Every inherited band is green on 12 decorrelated blocks, **none widened**.
- `npx vitest run tests/tr-{threads,events,castle,channel-audit,calibration,deduction,roundtable,murder,recruitment}.test.js` green.

## Explicitly NOT in this plan

Missions, the pot, Shield/Dagger/Seer (Plan 5) · the endgame (Plan 5) · export and co-winners (Plan 6) · all VP and screens (Plan 7) · evidence sources ③–⑥ beyond what a channel audit admits.

## Carried forward

- **Plan 5** — Traitors still cannot accuse each other (0 in 1,996); the endgame requires it, barred in both `debate()` and `chooseBanishmentVote()`. Late lift is the load-bearing gate with 0.24pp headroom. `M.pushedThenDied` needs re-deriving.
- **Plan 6** — `js/player-trivia.js` hands a Traitors line Total Drama's noun and counters.
- **Plan 7** — `js/wiki-view.js` renders "Challenge wins" and "Voted to evict" on a Traitors article; `tests/show-vocabulary.test.js`'s `EXCLUSIVE` map has no `traitors` key. `murderCost.blames`, `conclaveTension` and `loyaltyDebt` are all written and unread, waiting for VP.
- **Anywhere** — `'a burn names somebody real'` still asserts inside `if (sp.burns)`. A voter in both a ballot and a revote is indicted twice.
- 7 test failures inherited from `main` predate all of this.
