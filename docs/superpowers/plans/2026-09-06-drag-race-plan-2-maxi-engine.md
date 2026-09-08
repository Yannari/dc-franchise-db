# Drag Race Plan 2 — The maxi challenge engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Plan 1's two generic seams (`_assign` and `_prepare` in `js/dr/week.js`) with a spine plus one module per maxi type, so each challenge has its own assignment, its own preparation, its own performance mechanism, and its own consequences — and every event it fires changes a bond, a popularity number or a state flag.

**Architecture:** `js/dr/maxi.js` is the spine: it holds the module registry, runs the three hooks in order, and applies the events they return. A challenge module is a file under `js/dr/chal/` exporting `assign`, `prepare` and `perform` — any of which may be omitted, in which case the generic implementation in `js/dr/chal/_generic.js` runs. Nothing in `js/dr/` prints a sentence in this plan; scenes carry a `kind` and a data payload, and Plan 3 turns those into prose.

**Tech Stack:** ES modules, no build step, vitest. Seeded rng from `js/dr/rng.js` (Plan 1, Task 7).

**Spec:** `docs/superpowers/specs/2026-09-06-drag-race-design.md` §8

**Depends on:** Plan 1, complete and merged into the branch.

## Global Constraints

- Everything in Plan 1's Global Constraints still applies: branch `drag-race`, the nine person stats and seven craft stats and no others, proportional stats, `rng()` never `Math.random()`, no file holding a show list, prose deferred to Plan 3, run only the named tests, commit after every task with the trailer
  ```
  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Y4XaJLLRHojvnzFuEVJsAt
  ```
- **Every event has a consequence.** An entry in the `events` array that changes no bond, no popularity and no state is a bug, and `tests/dr-consequences.test.js` (Task 12) fails on it. This is the project's oldest rule (`ALL Social Events Must Have Consequences`) and the one most often broken.
- **Archetype behaviour is law.** Nice archetypes (hero, loyal-soldier, social-butterfly, showmancer, underdog, goat) NEVER sabotage, steal or scheme; they encourage, guard, help. Villain archetypes (villain, mastermind, schemer) may. Neutral archetypes (hothead, challenge-beast, wildcard, chaos-agent, floater, perceptive-player) may only with `strategic >= 6 && loyalty <= 4`. `js/dr/chal/_generic.js` exports the predicate; no module writes its own.
- **A role shifts probability, never caps it** (the user's correction). `ROLE_RANGES` from Plan 1 is the only mechanism; a module may add a role name to it but may not clamp a score.
- **The runway belongs to the challenge.** A design week's runway IS the built look; a Ball is three walks; a makeover walks the pair; everything else is one themed walk. Modules declare it through `meta.runway` (Plan 1, Task 6) and `perform` returns `runwayOverride` when it needs more than one walk.

## File map

| File | Responsibility |
|---|---|
| `js/dr/maxi.js` | hook contract, module registry, `runMaxi`, `applyEvents` |
| `js/dr/chal/_generic.js` | the default three hooks + the shared predicates every module uses |
| `js/dr/assign.js` | drafts, captains, team splits, pick conflicts |
| `js/dr/prep.js` | help, sabotage, the host walkthrough |
| `js/dr/chal/snatch-game.js` | character draft, turn-based taping |
| `js/dr/chal/ball.js` | three looks, one sewn |
| `js/dr/chal/girl-group.js` | verses, the booth, the spotlight hog |
| `js/dr/chal/rusical.js` | parts draft, live vocal choice |
| `js/dr/chal/makeover.js` | partners, resemblance |
| `js/dr/chal/roast.js` | running order, the two hard slots (also serves stand-up) |
| `js/dr/chal/talent-show.js` | the talent picked from her own stats |
| `js/dr/chal/lalaparuza.js` | the bracket |
| `js/dr/chal/design.js` | unconventional materials (also serves acting/commercial/improv flavour) |
| `js/dr/week.js` | calls `runMaxi` instead of its own seams |

---

### Task 1: The spine — `js/dr/maxi.js` and the generic module

**Files:**
- Create: `js/dr/maxi.js`, `js/dr/chal/_generic.js`
- Modify: `js/dr/week.js` (replace `_assign`, `_prepare` and the `doMaxi` closure)
- Test: `tests/dr-maxi-spine.test.js`

**Interfaces:**
- Consumes: `maxiById` (Plan 1 Task 6), `performQueen`/`blendScore`/`noise` (Plan 1 Task 7), `dragOf` (Plan 1 Task 3).
- Produces:

  ```js
  // js/dr/maxi.js
  export const CHAL_MODULES;                  // { [maxiId]: module }
  export function moduleFor(maxiId);          // module or the generic one
  export function runMaxi(ctx) → {
    assignment: { roles: {name: role}, teams: [[name]], order: [name], picks: {} },
    prep: { [name]: number },
    performances: { [name]: { perf, moment, risk, role, team, parts, detail } },
    runwayOverride: null | { walks: [{ category, sewn, categoryStyles }] },
    scenes: [{ step, kind, data }],
    events: [{ type, players: [], bond: [[a,b,delta]], pop: {name: delta}, state: {}, data: {} }],
  };
  export function applyEvents(events, ctx);   // writes bonds + popularity + state, returns a summary
  ```
  `ctx` is `{ living, players, maxi, rng, state, bond, addBond, popDelta, miniWinner, cfg }`.
- The three hooks a module may export, each pure apart from the `events` it returns:
  ```js
  assign(ctx) → { roles, teams, order, picks, scenes, events }
  prepare(ctx2) → { prep, scenes, events }            // ctx2 = ctx + { assignment }
  perform(ctx3) → { performances, runwayOverride, scenes, events }  // ctx3 = ctx2 + { prep }
  ```

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-maxi-spine.test.js
import { describe, expect, it, vi } from 'vitest';
import { runMaxi, applyEvents, moduleFor, CHAL_MODULES } from '../js/dr/maxi.js';
import * as generic from '../js/dr/chal/_generic.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, over = {}) => ({ name, slug: name.toLowerCase(), archetype: 'hero', age: 25,
  stats: Object.fromEntries(STATS.map(k => [k, 5])), drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5 }, ...over });
const CAST = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay'].map(n => mk(n));

function ctxFor(maxiId, seed = 1, over = {}) {
  const bonds = {};
  return {
    living: CAST.map(p => p.name), players: Object.fromEntries(CAST.map(p => [p.name, p])),
    maxi: maxiById(maxiId), rng: rngFor(seed),
    state: { record: Object.fromEntries(CAST.map(p => [p.name, []])), star: {}, flags: {} },
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0,
    addBond: (a, b, d) => { const k = [a, b].sort().join('|'); bonds[k] = (bonds[k] || 0) + d; },
    popDelta: vi.fn(), miniWinner: 'Ada', cfg: {}, _bonds: bonds, ...over,
  };
}

describe('the spine', () => {
  it('runs the three hooks and returns one entry per living queen', () => {
    const ctx = ctxFor('acting');
    const out = runMaxi(ctx);
    expect(Object.keys(out.performances).sort()).toEqual(CAST.map(p => p.name).sort());
    expect(Object.keys(out.prep).length).toBe(6);
    expect(out.assignment.order.length).toBe(6);
    for (const p of Object.values(out.performances)) expect(typeof p.perf).toBe('number');
  });
  it('falls back to the generic module for a type with no file', () => {
    expect(moduleFor('photoshoot')).toBe(generic);
    expect(runMaxi(ctxFor('photoshoot')).performances.Ada.perf).toBeTypeOf('number');
  });
  it('every registered module id is a real maxi type and exports at least one hook', () => {
    for (const [id, mod] of Object.entries(CHAL_MODULES)) {
      expect(maxiById(id), id).toBeTruthy();
      expect(!!(mod.assign || mod.prepare || mod.perform), id).toBe(true);
    }
  });
  it('the mini winner leads the order when the type drafts', () => {
    expect(runMaxi(ctxFor('snatch-game')).assignment.order[0]).toBe('Ada');
  });
  it('is seeded: the same seed gives the same result', () => {
    expect(JSON.stringify(runMaxi(ctxFor('acting', 4)).performances))
      .toBe(JSON.stringify(runMaxi(ctxFor('acting', 4)).performances));
  });
});

describe('applyEvents', () => {
  it('writes bonds, popularity and state, and reports what it wrote', () => {
    const ctx = ctxFor('acting');
    const summary = applyEvents([
      { type: 'help', players: ['Ada', 'Bee'], bond: [['Ada', 'Bee', 1.5]], pop: { Ada: 2 }, state: {}, data: {} },
      { type: 'sabotage', players: ['Cleo', 'Dot'], bond: [['Cleo', 'Dot', -2]], pop: { Cleo: -3 }, state: { blamed: 'Cleo' }, data: {} },
    ], ctx);
    expect(ctx._bonds['Ada|Bee']).toBe(1.5);
    expect(ctx._bonds['Cleo|Dot']).toBe(-2);
    expect(ctx.popDelta).toHaveBeenCalledWith('Ada', 2);
    expect(ctx.popDelta).toHaveBeenCalledWith('Cleo', -3);
    expect(ctx.state.flags.blamed).toBe('Cleo');
    expect(summary).toEqual({ bonds: 2, pop: 2, state: 1 });
  });
  it('refuses an event that changes nothing', () => {
    expect(() => applyEvents([{ type: 'nothing', players: ['Ada'], bond: [], pop: {}, state: {}, data: {} }], ctxFor('acting')))
      .toThrow(/consequence/i);
  });
});

describe('the generic module', () => {
  it('canScheme follows the archetype rules', () => {
    expect(generic.canScheme(mk('V', { archetype: 'villain' }))).toBe(true);
    expect(generic.canScheme(mk('H', { archetype: 'hero' }))).toBe(false);
    expect(generic.canScheme(mk('N', { archetype: 'floater', stats: { strategic: 7, loyalty: 3 } }))).toBe(true);
    expect(generic.canScheme(mk('N2', { archetype: 'floater', stats: { strategic: 7, loyalty: 8 } }))).toBe(false);
    expect(generic.canScheme(mk('N3', { archetype: 'hothead', stats: { strategic: 3, loyalty: 2 } }))).toBe(false);
  });
  it('canHelp is true for everybody who is not actively scheming', () => {
    expect(generic.canHelp(mk('H', { archetype: 'hero' }))).toBe(true);
    expect(generic.canHelp(mk('V', { archetype: 'villain' }))).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-maxi-spine.test.js`
Expected: FAIL — cannot resolve `js/dr/maxi.js`.

- [ ] **Step 3: The generic module**

```js
// js/dr/chal/_generic.js — the default hooks, and the predicates every module shares
//
// A challenge module overrides the hooks it has an opinion about and lets the
// rest fall through to here. The PREDICATES live here and nowhere else: the
// archetype behaviour rules are one rule, and a module writing its own copy is
// how a hero came to sabotage a sewing machine.
import { dragOf } from '../queen.js';
import { performQueen, blendScore, noise } from '../perform.js';

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAINOUS = new Set(['villain', 'mastermind', 'schemer']);

/** May this queen sabotage, steal or scheme? The project's archetype law. */
export function canScheme(player) {
  const a = player?.archetype;
  if (VILLAINOUS.has(a)) return true;
  if (NICE.has(a)) return false;
  const s = player?.stats || {};
  return (Number(s.strategic) || 0) >= 6 && (Number(s.loyalty) ?? 10) <= 4;
}

/** Anybody can help. Kept as a function so a module never tests archetypes itself. */
export function canHelp() { return true; }

/** An event that changes nothing is not an event. Every module builds through this. */
export function evt(type, { players = [], bond = [], pop = {}, state = {}, data = {} } = {}) {
  return { type, players, bond, pop, state, data };
}

export function assign(ctx) {
  const { living, maxi, rng, miniWinner } = ctx;
  const order = [...living].sort(() => rng() - 0.5);
  if (miniWinner && order.includes(miniWinner)) { order.splice(order.indexOf(miniWinner), 1); order.unshift(miniWinner); }
  const teams = [];
  if (maxi.format === 'teams') {
    const half = Math.ceil(order.length / 2);
    teams.push(order.slice(0, half), order.slice(half));
  } else if (maxi.format === 'cast') teams.push([...order]);
  else if (maxi.format === 'pairs') for (let i = 0; i < order.length; i += 2) teams.push(order.slice(i, i + 2));
  const roles = {};
  order.forEach((n, i) => {
    roles[n] = !maxi.roles ? 'standard'
      : i === 0 ? 'lead' : i < 3 ? 'featured' : i < Math.max(3, order.length - 2) ? 'standard' : 'ensemble';
  });
  return { roles, teams, order, picks: {}, scenes: [{ step: 'choice', kind: 'assignment', data: { order, teams } }], events: [] };
}

export function prepare(ctx) {
  const { living, players, maxi } = ctx;
  const prep = {};
  for (const n of living) {
    const p = players[n], s = p.stats || {};
    prep[n] = (blendScore(dragOf(p), maxi.blend) - 5) * 0.1
      + ((Number(s.mental) || 5) - 5) * 0.03 + ((Number(s.strategic) || 5) - 5) * 0.02;
  }
  return { prep, scenes: [{ step: 'prep', kind: 'prep', data: {} }], events: [] };
}

export function perform(ctx) {
  const { living, players, maxi, assignment, prep, rng, state, bond } = ctx;
  const performances = {};
  for (const n of living) {
    const team = (assignment.teams || []).find(t => t.includes(n)) || null;
    const chemistry = team && team.length > 1
      ? team.filter(o => o !== n).reduce((s, o) => s + bond(n, o), 0) / (team.length - 1) * 0.1 : 0;
    const r = performQueen({ player: players[n], maxi, role: assignment.roles[n], prep: prep[n] || 0,
      chemistry, record: state.record[n] || [], rng });
    performances[n] = { ...r, role: assignment.roles[n], team: team ? assignment.teams.indexOf(team) : null, detail: {} };
  }
  return { performances, runwayOverride: null,
    scenes: [{ step: maxi.stage === 'pre' ? 'maxi-pre' : 'maxi-main', kind: 'performance', data: {} }], events: [] };
}

export { noise };
```

- [ ] **Step 4: The spine**

```js
// js/dr/maxi.js — one maxi challenge, whichever type it is (spec §8.1)
import * as generic from './chal/_generic.js';
import * as snatchGame from './chal/snatch-game.js';
import * as ball from './chal/ball.js';
import * as girlGroup from './chal/girl-group.js';
import * as rusical from './chal/rusical.js';
import * as makeover from './chal/makeover.js';
import * as roast from './chal/roast.js';
import * as talentShow from './chal/talent-show.js';
import * as lalaparuza from './chal/lalaparuza.js';
import * as design from './chal/design.js';

// A type with no entry runs the generic hooks, which is not a gap: a
// photoshoot is a solo craft check and the spine already models one.
export const CHAL_MODULES = {
  'snatch-game': snatchGame, ball, 'girl-group': girlGroup, rusical, makeover,
  roast, 'stand-up': roast, 'talent-show': talentShow, 'lipsync-challenge': lalaparuza,
  design, acting: design, commercial: design, improv: design,
};

export function moduleFor(maxiId) { return CHAL_MODULES[maxiId] || generic; }

/**
 * Run one maxi challenge end to end.
 *
 * Hooks are called in order and each sees what the last produced, so a module
 * can read its own assignment in `prepare` and its own prep in `perform`.
 * A module that omits a hook gets the generic one, which is why the fallbacks
 * are resolved per hook rather than per module.
 */
export function runMaxi(ctx) {
  const mod = moduleFor(ctx.maxi.id);
  const scenes = [], events = [];
  const take = r => { scenes.push(...(r.scenes || [])); events.push(...(r.events || [])); return r; };

  const a = take((mod.assign || generic.assign)(ctx));
  const assignment = { roles: a.roles, teams: a.teams || [], order: a.order, picks: a.picks || {} };

  const ctx2 = { ...ctx, assignment };
  const p = take((mod.prepare || generic.prepare)(ctx2));

  const ctx3 = { ...ctx2, prep: p.prep };
  const f = take((mod.perform || generic.perform)(ctx3));

  return { assignment, prep: p.prep, performances: f.performances,
    runwayOverride: f.runwayOverride || null, scenes, events };
}

/**
 * Write what the challenge did. THE ONE PLACE bonds and popularity move
 * during a maxi, so "did this event have a consequence" is answerable by
 * reading one function rather than nineteen.
 */
export function applyEvents(events, ctx) {
  const summary = { bonds: 0, pop: 0, state: 0 };
  for (const e of events || []) {
    const changes = (e.bond?.length || 0) + Object.keys(e.pop || {}).length + Object.keys(e.state || {}).length;
    if (!changes) {
      throw new Error(`drag-race: event "${e.type}" has no consequence — every event must move a bond, a popularity number or a state flag`);
    }
    for (const [a, b, d] of e.bond || []) { ctx.addBond(a, b, d); summary.bonds++; }
    for (const [n, d] of Object.entries(e.pop || {})) { ctx.popDelta(n, d); summary.pop++; }
    for (const [k, v] of Object.entries(e.state || {})) { (ctx.state.flags ||= {})[k] = v; summary.state++; }
  }
  return summary;
}
```

Create the nine `js/dr/chal/*.js` files named in the registry as one-line re-exports for now so the imports resolve:

```js
// js/dr/chal/snatch-game.js  (and the other eight, same body)
export * from './_generic.js';
```

Tasks 4–11 replace each body. `design.js` is imported by four ids on purpose: acting, commercial and improv share the build-and-perform shape and differ only in flavour, which Plan 3 supplies.

- [ ] **Step 5: Rewire `js/dr/week.js`**

Delete `_assign`, `_prepare`, `_teamOf` and the `doMaxi` closure. Import `runMaxi, applyEvents` from `./maxi.js`, and replace the assignment/prep/perform section with:

```js
  const maxiCtx = { living, players, maxi, rng, state, cfg,
    bond, addBond: ctx.addBond || (() => {}), popDelta: ctx.popDelta || (() => {}), miniWinner };
  const M = runMaxi(maxiCtx);
  applyEvents(M.events, maxiCtx);
  const assignment = M.assignment, prep = M.prep, performances = M.performances;
  for (const s of M.scenes) scenes.push({ step: s.step, kind: s.kind, data: s.data, text: '' });
```

Call it where `doMaxi()` was called for `stage === 'pre'`, and use the same result for `stage === 'main'` (run it once, place its scenes in the right step). The runway loop takes `M.runwayOverride` when it is set:

```js
  const walks = M.runwayOverride?.walks || [{ category, sewn: maxi.runway === 'design', categoryStyles: cfg.categoryStyles || [] }];
  for (const n of living) {
    const scored = walks.map(w => runwayScore({ player: P(n), category: w.category, sewn: w.sewn, categoryStyles: w.categoryStyles, rng }));
    runway[n] = { score: scored.reduce((s, x) => s + x.score, 0) / scored.length, fit: scored[0].fit, walks: scored.map(x => x.score) };
  }
```

`runDragWeek`'s `ctx` gains `addBond` and `popDelta`; `js/dr-run.js` passes real ones (`addBond` from `js/bonds.js`, and `popDelta = (n, d) => { (gs.popularity ||= {}); gs.popularity[n] = (gs.popularity[n] || 0) + d; }`), and `tests/dr-week.test.js` passes no-ops. Update `tests/dr-week.test.js`'s `ctxFor` accordingly.

- [ ] **Step 6: Run the tests**

Run: `npx vitest run tests/dr-maxi-spine.test.js tests/dr-week.test.js tests/dr-season.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add js/dr/maxi.js js/dr/chal js/dr/week.js js/dr-run.js tests/dr-maxi-spine.test.js tests/dr-week.test.js
git commit -m "feat(drag-race): maxi spine — hook contract, module registry, events with consequences"
```

---

### Task 2: Assignment — drafts, captains, and the conflicts they cause

**Files:**
- Create: `js/dr/assign.js`
- Test: `tests/dr-assign.test.js`

**Interfaces:**
- Consumes: `canScheme`, `evt` from `_generic.js`; `dragOf`.
- Produces:
  - `pickOrder({ living, miniWinner, mini, rng, state }) → [names]` — a `pick-order` mini puts its winner first and the rest in a seeded order; a `captain` mini gives captaincy, not order; no mini means seeded order.
  - `draftRoles({ order, roleNames, rng }) → { roles, picks }` — each queen in order takes the best role still free, where "best" is her own preference (`spotlight` desc) with a `boldness`-scaled chance of taking a smaller one on purpose.
  - `captainSplit({ order, captains, players, bond, rng }) → { teams, events }` — captains alternate picks; a captain takes a bonded queen when one is free, and a scheming captain dumps her lowest-bond rival on the other team, which fires a `dump` event (bond −1.5 both ways, popularity −2 for the captain).
  - `contestFor({ order, choices, players, rng }) → { picks, events }` — the shared "two queens want the same thing" resolver: the earlier pick keeps it, the later takes her second choice at a `penalty` of 0.8 and a `contest` event (bond −1.0, popularity 0 for the winner, +1 sympathy for the loser).
  - `ROLE_SPOTLIGHT = { lead: 1.0, featured: 0.7, standard: 0.45, ensemble: 0.2 }`

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-assign.test.js
import { describe, expect, it } from 'vitest';
import { pickOrder, draftRoles, captainSplit, contestFor, ROLE_SPOTLIGHT } from '../js/dr/assign.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, over = {}) => ({ name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])), drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5 }, ...over });
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay'];
const players = Object.fromEntries(NAMES.map(n => [n, mk(n)]));

describe('pickOrder', () => {
  it('a pick-order mini puts its winner first', () => {
    const o = pickOrder({ living: NAMES, miniWinner: 'Dot', mini: { buys: 'pick-order' }, rng: rngFor(1) });
    expect(o[0]).toBe('Dot'); expect(o.length).toBe(6); expect(new Set(o).size).toBe(6);
  });
  it('a captain mini does not reorder', () => {
    const o = pickOrder({ living: NAMES, miniWinner: 'Dot', mini: { buys: 'captain' }, rng: rngFor(1) });
    expect(o.length).toBe(6);
    expect(pickOrder({ living: NAMES, miniWinner: null, mini: null, rng: rngFor(1) })).toEqual(o);
  });
});

describe('draftRoles', () => {
  it('gives every queen a role and hands the first pick the biggest one most of the time', () => {
    let leadFirst = 0;
    for (let i = 0; i < 200; i++) {
      const { roles } = draftRoles({ order: NAMES, roleNames: ['lead', 'featured', 'featured', 'standard', 'standard', 'ensemble'], rng: rngFor(i) });
      expect(Object.keys(roles).length).toBe(6);
      if (roles.Ada === 'lead') leadFirst++;
    }
    expect(leadFirst / 200).toBeGreaterThan(0.6);
    expect(leadFirst / 200).toBeLessThan(1);   // boldness lets a queen duck the lead
  });
  it('records who picked what, in order', () => {
    const { picks } = draftRoles({ order: NAMES, roleNames: ['lead', 'featured', 'standard', 'standard', 'ensemble', 'ensemble'], rng: rngFor(3) });
    expect(picks.map(p => p.name)).toEqual(NAMES);
    expect(ROLE_SPOTLIGHT[picks[0].role]).toBeGreaterThanOrEqual(ROLE_SPOTLIGHT[picks[5].role]);
  });
});

describe('captainSplit', () => {
  const bond = (a, b) => (a === 'Ada' && b === 'Bee') || (a === 'Bee' && b === 'Ada') ? 6 : (a === 'Cleo' && b === 'Fay') || (a === 'Fay' && b === 'Cleo') ? -7 : 0;
  it('captains take their friends', () => {
    const { teams } = captainSplit({ order: NAMES, captains: ['Ada', 'Cleo'], players, bond, rng: rngFor(2) });
    expect(teams.length).toBe(2);
    expect(teams.flat().sort()).toEqual([...NAMES].sort());
    expect(teams.find(t => t.includes('Ada'))).toContain('Bee');
  });
  it('a scheming captain dumps her rival and pays for it', () => {
    const schemer = { ...players, Cleo: mk('Cleo', { archetype: 'villain' }) };
    const { teams, events } = captainSplit({ order: NAMES, captains: ['Ada', 'Cleo'], players: schemer, bond, rng: rngFor(5) });
    const dump = events.find(e => e.type === 'dump');
    expect(dump).toBeTruthy();
    expect(dump.bond.length).toBeGreaterThan(0);
    expect(dump.pop.Cleo).toBeLessThan(0);
    expect(teams.find(t => t.includes('Cleo'))).not.toContain('Fay');
  });
  it('a nice captain never dumps', () => {
    const { events } = captainSplit({ order: NAMES, captains: ['Ada', 'Bee'], players, bond, rng: rngFor(5) });
    expect(events.find(e => e.type === 'dump')).toBeUndefined();
  });
});

describe('contestFor', () => {
  it('the earlier pick keeps it, the later pays a penalty and both feel it', () => {
    const { picks, events } = contestFor({ order: ['Ada', 'Bee', 'Cleo'],
      choices: { Ada: ['Dolly', 'Cher'], Bee: ['Dolly', 'Tina'], Cleo: ['Tina', 'Cher'] }, players, rng: rngFor(1) });
    expect(picks.Ada.choice).toBe('Dolly');
    expect(picks.Bee.choice).toBe('Tina');
    expect(picks.Bee.penalty).toBeCloseTo(0.8);
    expect(picks.Cleo.choice).toBe('Cher');
    const c = events.find(e => e.type === 'contest');
    expect(c.players).toEqual(['Ada', 'Bee']);
    expect(c.bond[0][2]).toBeLessThan(0);
  });
  it('nobody who got a first choice pays anything', () => {
    const { picks, events } = contestFor({ order: ['Ada', 'Bee'], choices: { Ada: ['X'], Bee: ['Y'] }, players, rng: rngFor(1) });
    expect(picks.Ada.penalty).toBe(0); expect(picks.Bee.penalty).toBe(0);
    expect(events).toEqual([]);
  });
  it('a queen with nothing left takes a leftover and pays double', () => {
    const { picks } = contestFor({ order: ['Ada', 'Bee'], choices: { Ada: ['Solo'], Bee: ['Solo'] }, players, rng: rngFor(1) });
    expect(picks.Bee.choice).toBeTruthy();
    expect(picks.Bee.penalty).toBeCloseTo(1.6);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-assign.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```js
// js/dr/assign.js — who gets what, and the drama that causes (spec §8.2)
import { canScheme, evt } from './chal/_generic.js';

export const ROLE_SPOTLIGHT = { lead: 1.0, featured: 0.7, standard: 0.45, ensemble: 0.2 };

export function pickOrder({ living, miniWinner, mini, rng }) {
  const order = [...living].sort(() => rng() - 0.5);
  if (mini?.buys === 'pick-order' && miniWinner && order.includes(miniWinner)) {
    order.splice(order.indexOf(miniWinner), 1); order.unshift(miniWinner);
  }
  return order;
}

/**
 * Each queen takes the best role still free — usually. `boldness` cuts both
 * ways: a bold queen grabs the lead, a timid one ducks it on purpose, and
 * ducking is a decision the transcript can show.
 */
export function draftRoles({ order, roleNames, rng, players = {} }) {
  const free = [...roleNames].sort((a, b) => (ROLE_SPOTLIGHT[b] || 0) - (ROLE_SPOTLIGHT[a] || 0));
  const roles = {}, picks = [];
  for (const n of order) {
    if (!free.length) { roles[n] = 'ensemble'; picks.push({ name: n, role: 'ensemble', ducked: false }); continue; }
    const bold = (Number(players[n]?.stats?.boldness) || 5) / 10;
    const duck = free.length > 1 && rng() > bold * 0.9 + 0.1;
    const idx = duck ? Math.min(free.length - 1, 1 + Math.floor(rng() * (free.length - 1))) : 0;
    const role = free.splice(idx, 1)[0];
    roles[n] = role;
    picks.push({ name: n, role, ducked: duck });
  }
  return { roles, picks };
}

/** Captains alternate picks; friends first, and a schemer disposes of a rival. */
export function captainSplit({ order, captains, players, bond, rng }) {
  const teams = captains.map(c => [c]);
  const pool = order.filter(n => !captains.includes(n));
  const events = [];
  let turn = 0;
  while (pool.length) {
    const cap = captains[turn % captains.length];
    const capP = players[cap];
    const other = (turn + 1) % captains.length;
    // A schemer's first move is to make sure her worst enemy is somebody
    // else's problem: she does not pick them, and she says so.
    if (canScheme(capP) && pool.length > 1) {
      const worst = pool.reduce((w, n) => (bond(cap, n) < bond(cap, w) ? n : w), pool[0]);
      if (bond(cap, worst) <= -4 && !events.some(e => e.type === 'dump')) {
        teams[other].push(worst);
        pool.splice(pool.indexOf(worst), 1);
        events.push(evt('dump', { players: [cap, worst],
          bond: [[cap, worst, -1.5]], pop: { [cap]: -2 }, data: { captain: cap, dumped: worst } }));
        turn++;
        continue;
      }
    }
    const best = pool.reduce((b, n) => (bond(cap, n) > bond(cap, b) ? n : b), pool[0]);
    const chosen = bond(cap, best) > 2 ? best : pool[Math.floor(rng() * pool.length)];
    teams[turn % captains.length].push(chosen);
    pool.splice(pool.indexOf(chosen), 1);
    turn++;
  }
  return { teams, events };
}

/**
 * Two queens want the same character, the same part, the same song.
 * `choices` is her preference list, best first; the order decides who keeps it.
 */
export function contestFor({ order, choices, players, rng }) {
  const taken = new Set();
  const picks = {}, events = [];
  const holder = {};
  for (const n of order) {
    const wants = choices[n] || [];
    let got = null, penalty = 0, lostTo = null;
    for (let i = 0; i < wants.length; i++) {
      if (!taken.has(wants[i])) { got = wants[i]; penalty = i ? 0.8 : 0; if (i) lostTo = holder[wants[0]] || null; break; }
    }
    if (!got) {
      // Nothing on her list survived. She takes a leftover and it costs double.
      got = `leftover-${n}`; penalty = 1.6; lostTo = holder[wants[0]] || null;
    }
    taken.add(got); holder[got] = n;
    picks[n] = { choice: got, penalty, lostTo };
    if (lostTo) {
      events.push(evt('contest', { players: [lostTo, n], bond: [[lostTo, n, -1.0]],
        pop: { [n]: 1 }, data: { over: wants[0], keeper: lostTo, loser: n } }));
    }
  }
  void players; void rng;
  return { picks, events };
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-assign.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/dr/assign.js tests/dr-assign.test.js
git commit -m "feat(drag-race): assignment — pick order, role draft, captain split, pick conflicts"
```

---

### Task 3: Preparation — help, sabotage, the host's walkthrough

**Files:**
- Create: `js/dr/prep.js`
- Test: `tests/dr-prep.test.js`

**Interfaces:**
- Consumes: `canScheme`, `evt`; `dragOf`, `blendScore`, `noise`.
- Produces:
  - `prepareRoom({ living, players, maxi, assignment, rng, bond, state }) → { prep, scenes, events }` — the shared preparation every module's `prepare` calls (a module adds its own beats around it).
  - Base prep as in Plan 1, plus:
    - **help**: a queen with craft ≥ 7 in the challenge's heaviest stat and a bond ≥ 3 with a struggler (craft ≤ 4) helps: `+0.6` to the struggler, bond `+1.0`, popularity `+2` to the helper.
    - **sabotage**: `canScheme` and bond ≤ −3 → "advice" costing the victim `−0.7`, bond `−1.5`, popularity `−3` to the schemer. Never more than one per queen per week.
    - **shunned**: a queen whose mean bond with the room is ≤ −3 gets no help at all and `−0.3` (an absence with a consequence, so it is an event).
  - `walkthrough({ living, players, maxi, prep, rng, state }) → { notes, prep, events }` — one note per queen: `{ name, right: boolean, took: boolean, delta }`. The host is right `0.75` of the time; `intuition` decides whether she reads it right (`p = 0.25 + intuition/20`), `boldness` whether she acts (`p = 0.3 + boldness/16`). Taking right advice `+0.7`; taking wrong advice `−0.7`; ignoring right advice `−0.4`; ignoring wrong advice `+0.2`. Every note is an event (popularity ±1 for a visible course change).

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-prep.test.js
import { describe, expect, it } from 'vitest';
import { prepareRoom, walkthrough } from '../js/dr/prep.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}, over = {}) => ({ name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag }, ...over });

const design = maxiById('design');
function room(over = {}) {
  const players = { Pro: mk('Pro', { design: 9 }), Newbie: mk('Newbie', { design: 3 }),
    Snake: mk('Snake', { design: 8 }, { archetype: 'villain' }), Loner: mk('Loner', { design: 5 }) };
  const bonds = { 'Newbie|Pro': 5, 'Loner|Pro': -4, 'Loner|Snake': -4, 'Loner|Newbie': -4 };
  return { living: Object.keys(players), players, maxi: design,
    assignment: { roles: Object.fromEntries(Object.keys(players).map(n => [n, 'standard'])), teams: [], order: Object.keys(players) },
    rng: rngFor(1), bond: (a, b) => bonds[[a, b].sort().join('|')] || 0,
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {} }, ...over };
}

describe('prepareRoom', () => {
  it('a strong queen helps a struggling friend, and both feel it', () => {
    const { prep, events } = prepareRoom(room());
    const help = events.find(e => e.type === 'help');
    expect(help).toBeTruthy();
    expect(help.players).toEqual(['Pro', 'Newbie']);
    expect(help.pop.Pro).toBeGreaterThan(0);
    expect(help.bond[0][2]).toBeGreaterThan(0);
    expect(prep.Newbie).toBeGreaterThan(prep.Loner);
  });
  it('a villain sabotages an enemy; a hero never does', () => {
    const bonds = { 'Newbie|Snake': -6, 'Newbie|Pro': -6 };
    const r = room({ bond: (a, b) => bonds[[a, b].sort().join('|')] || 0 });
    const { events } = prepareRoom(r);
    const sab = events.filter(e => e.type === 'sabotage');
    expect(sab.length).toBe(1);
    expect(sab[0].players[0]).toBe('Snake');
    expect(sab[0].pop.Snake).toBeLessThan(0);
  });
  it('the shunned queen gets nothing, and that is an event with a cost', () => {
    const { events, prep } = prepareRoom(room());
    const sh = events.find(e => e.type === 'shunned');
    expect(sh.players).toEqual(['Loner']);
    expect(prep.Loner).toBeLessThan(0);
  });
  it('nobody is helped or sabotaged twice in one week', () => {
    const { events } = prepareRoom(room());
    const touched = events.filter(e => e.type === 'help' || e.type === 'sabotage').flatMap(e => e.players.slice(1));
    expect(new Set(touched).size).toBe(touched.length);
  });
});

describe('walkthrough', () => {
  it('gives every queen a note and moves her prep by what she did with it', () => {
    const r = room();
    const base = prepareRoom(r).prep;
    const { notes, prep, events } = walkthrough({ ...r, prep: { ...base } });
    expect(notes.length).toBe(4);
    for (const n of notes) {
      expect(typeof n.right).toBe('boolean');
      expect(typeof n.took).toBe('boolean');
      expect(prep[n.name] - base[n.name]).toBeCloseTo(n.delta);
    }
    expect(events.length).toBe(4);
    for (const e of events) expect(Object.keys(e.pop).length + e.bond.length).toBeGreaterThan(0);
  });
  it('high intuition takes good advice more often than low', () => {
    const smart = { ...room(), players: { A: mk('A', {}, { stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), intuition: 10, boldness: 10 } }) }, living: ['A'] };
    const dim = { ...room(), players: { A: mk('A', {}, { stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), intuition: 1, boldness: 10 } }) }, living: ['A'] };
    const rate = ctx => { let good = 0; for (let i = 0; i < 300; i++) { const w = walkthrough({ ...ctx, rng: rngFor(i), prep: { A: 0 } }); if (w.notes[0].right === w.notes[0].took) good++; } return good / 300; };
    expect(rate(smart)).toBeGreaterThan(rate(dim));
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-prep.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```js
// js/dr/prep.js — the werk room, before it is a performance (spec §8.3)
import { dragOf } from './queen.js';
import { blendScore, noise } from './perform.js';
import { canScheme, evt } from './chal/_generic.js';

/** The craft this challenge leans on hardest — who is a "pro" at it. */
function heaviestStat(maxi) {
  return Object.entries(maxi.blend).sort((a, b) => b[1] - a[1])[0][0];
}

export function prepareRoom({ living, players, maxi, assignment, rng, bond, state }) {
  const key = heaviestStat(maxi);
  const prep = {}, events = [], scenes = [];
  for (const n of living) {
    const p = players[n], s = p.stats || {};
    prep[n] = (blendScore(dragOf(p), maxi.blend) - 5) * 0.1
      + ((Number(s.mental) || 5) - 5) * 0.03 + ((Number(s.strategic) || 5) - 5) * 0.02;
  }

  const helped = new Set(), hurt = new Set(), acted = new Set();
  const meanBond = n => living.filter(o => o !== n).reduce((t, o) => t + bond(n, o), 0) / Math.max(1, living.length - 1);

  // Sabotage first, so a schemer's target is not "already fine because a
  // friend got there". A queen sabotages at most one rival a week.
  for (const n of living) {
    if (acted.has(n) || !canScheme(players[n])) continue;
    if (dragOf(players[n])[key] < 6) continue;
    const target = living.filter(o => o !== n && !hurt.has(o) && bond(n, o) <= -3)
      .sort((a, b) => bond(n, a) - bond(n, b))[0];
    if (!target) continue;
    prep[target] -= 0.7;
    hurt.add(target); acted.add(n);
    events.push(evt('sabotage', { players: [n, target], bond: [[n, target, -1.5]], pop: { [n]: -3 },
      data: { craft: key } }));
  }

  for (const n of living) {
    if (acted.has(n) || dragOf(players[n])[key] < 7) continue;
    const friend = living.filter(o => o !== n && !helped.has(o) && !hurt.has(o)
      && dragOf(players[o])[key] <= 4 && bond(n, o) >= 3)
      .sort((a, b) => bond(n, b) - bond(n, a))[0];
    if (!friend) continue;
    prep[friend] += 0.6;
    helped.add(friend); acted.add(n);
    events.push(evt('help', { players: [n, friend], bond: [[n, friend, 1.0]], pop: { [n]: 2 },
      data: { craft: key } }));
  }

  for (const n of living) {
    if (helped.has(n) || meanBond(n) > -3) continue;
    prep[n] -= 0.3;
    events.push(evt('shunned', { players: [n], pop: { [n]: -1 }, data: { craft: key } }));
  }

  scenes.push({ step: 'prep', kind: 'prep-room', data: { craft: key, helped: [...helped], hurt: [...hurt] } });
  void assignment; void state; void rng; void noise;
  return { prep, scenes, events };
}

/**
 * The host walks the room. She is right most of the time; whether the queen
 * HEARS it is intuition and whether she MOVES is boldness — so good advice
 * ignored and bad advice taken are both possible and both cost.
 */
export function walkthrough({ living, players, maxi, prep, rng, state }) {
  const notes = [], events = [];
  for (const n of living) {
    const s = players[n]?.stats || {};
    const right = rng() < 0.75;
    const reads = rng() < 0.25 + (Number(s.intuition) || 5) / 20;
    const acts = rng() < 0.30 + (Number(s.boldness) || 5) / 16;
    // She takes it when she reads it as worth taking and is willing to move.
    const took = (right ? reads : !reads) && acts;
    const delta = right ? (took ? 0.7 : -0.4) : (took ? -0.7 : 0.2);
    prep[n] = (prep[n] || 0) + delta;
    notes.push({ name: n, right, took, delta });
    events.push(evt('walkthrough', { players: [n], pop: { [n]: took ? 1 : -1 },
      data: { right, took, challenge: maxi.id } }));
  }
  void state;
  return { notes, prep, events };
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-prep.test.js`
Expected: PASS.

- [ ] **Step 5: Wire it into the generic module**

In `js/dr/chal/_generic.js`, replace the body of `prepare` with a call to `prepareRoom` followed by `walkthrough`, merging their events and scenes:

```js
import { prepareRoom, walkthrough } from '../prep.js';

export function prepare(ctx) {
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  return { prep: w.prep, scenes: [...r.scenes, { step: 'prep', kind: 'walkthrough', data: { notes: w.notes } }],
    events: [...r.events, ...w.events] };
}
```

- [ ] **Step 6: Run the tests**

Run: `npx vitest run tests/dr-prep.test.js tests/dr-maxi-spine.test.js tests/dr-week.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add js/dr/prep.js js/dr/chal/_generic.js tests/dr-prep.test.js
git commit -m "feat(drag-race): preparation — help, sabotage, shunning, the host walkthrough"
```

---

### Task 4: Snatch Game

**Files:**
- Create: `js/dr/data/snatch-characters.js`
- Rewrite: `js/dr/chal/snatch-game.js`
- Test: `tests/dr-chal-snatch.test.js`

**Interfaces:**
- Consumes: `pickOrder`, `contestFor` (Task 2); `prepareRoom`, `walkthrough` (Task 3); `performQueen`, `noise`.
- Produces:
  - `SNATCH_CHARACTERS` in the data file: `{ id, name, difficulty: 1..5, needs: 'comedy'|'acting', style }` — 30 fictional celebrity archetypes (a diva, a talk-show host, a horror actress, a pop star, a politician's wife …). No real people: this universe has none.
  - `chooseCharacters({ order, players, rng }) → { picks, events }` — each queen's preference list is the characters closest to her own `style` and within her craft (a low-comedy queen reaches for an easier one), resolved through `contestFor`.
  - `perform(ctx) → { performances, scenes, events }` — the taping runs `rounds = 6` questions; each round every queen answers, scoring `comedy*0.55 + acting*0.35 + charFit` where `charFit` is `+1.2` when the character suits her style and `−(difficulty - craft)*0.4` when she is out of her depth. A queen who scores below `3` on three rounds is **dying on the panel**: an event with popularity `−3` and a `dying` flag Plan 3 narrates. A queen who scores above `8.5` twice gets a `moment`. Two queens who play off each other (adjacent in the order, bond ≥ 2) fire a `double-act` event: both `+0.8`, bond `+1`.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-chal-snatch.test.js
import { describe, expect, it } from 'vitest';
import { SNATCH_CHARACTERS } from '../js/dr/data/snatch-characters.js';
import * as snatch from '../js/dr/chal/snatch-game.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';
import { runMaxi } from '../js/dr/maxi.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}, over = {}) => ({ name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag }, ...over });
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay'];
function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)]))) {
  const bonds = {};
  return { living: Object.keys(players), players, maxi: maxiById('snatch-game'), rng: rngFor(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {} },
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0, addBond: () => {}, popDelta: () => {},
    miniWinner: 'Ada', cfg: {} };
}

describe('the character list', () => {
  it('is thirty fictional archetypes, graded', () => {
    expect(SNATCH_CHARACTERS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(SNATCH_CHARACTERS.map(c => c.id)).size).toBe(SNATCH_CHARACTERS.length);
    for (const c of SNATCH_CHARACTERS) {
      expect(c.difficulty).toBeGreaterThanOrEqual(1);
      expect(c.difficulty).toBeLessThanOrEqual(5);
      expect(['comedy', 'acting']).toContain(c.needs);
    }
  });
});

describe('snatch game', () => {
  it('every queen leaves with a different character', () => {
    const { assignment } = runMaxi(ctx());
    const chosen = Object.values(assignment.picks).map(p => p.choice);
    expect(chosen.length).toBe(6);
    expect(new Set(chosen).size).toBe(6);
  });
  it('the first pick gets a first choice; a later queen may not', () => {
    const out = runMaxi(ctx(3));
    expect(out.assignment.picks.Ada.penalty).toBe(0);
    expect(Object.values(out.assignment.picks).some(p => p.penalty > 0)).toBe(true);
  });
  it('a comedy queen beats a fashion queen at this, on average', () => {
    const funny = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Bee' ? { comedy: 10, acting: 9 } : { comedy: 3, acting: 3 })]));
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      const out = runMaxi(ctx(i, funny));
      const best = Object.entries(out.performances).sort((a, b) => b[1].perf - a[1].perf)[0][0];
      if (best === 'Bee') wins++;
    }
    expect(wins / 40).toBeGreaterThan(0.5);
  });
  it('records the taping round by round and can kill somebody on the panel', () => {
    const weak = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Fay' ? { comedy: 1, acting: 1 } : { comedy: 8, acting: 8 })]));
    let died = false;
    for (let i = 0; i < 40 && !died; i++) {
      const out = runMaxi(ctx(i, weak));
      expect(out.performances.Fay.detail.rounds.length).toBe(6);
      if (out.events.some(e => e.type === 'dying' && e.players[0] === 'Fay')) died = true;
    }
    expect(died).toBe(true);
  });
  it('every event it fires has a consequence', () => {
    const out = runMaxi(ctx(7));
    for (const e of out.events) {
      expect(e.bond.length + Object.keys(e.pop).length + Object.keys(e.state).length, e.type).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-chal-snatch.test.js`
Expected: FAIL — data module not found.

- [ ] **Step 3: The characters**

```js
// js/dr/data/snatch-characters.js
//
// FICTIONAL ARCHETYPES, not real people: this universe has no celebrities
// outside its own reality shows (the user's rule, spec §4). Each is a
// recognisable comic shape a queen can play.
export const SNATCH_CHARACTERS = [
  { id: 'the-diva', name: 'The Ageless Diva', difficulty: 2, needs: 'comedy', style: 'glamour' },
  { id: 'talk-host', name: 'The Daytime Talk Host', difficulty: 2, needs: 'comedy', style: 'comedy' },
  { id: 'scream-queen', name: 'The Scream Queen', difficulty: 3, needs: 'acting', style: 'spooky' },
  { id: 'pop-brat', name: 'The Pop Brat', difficulty: 1, needs: 'comedy', style: 'club-kid' },
  { id: 'grande-dame', name: 'The Grande Dame of the Stage', difficulty: 4, needs: 'acting', style: 'broadway' },
  { id: 'weather-girl', name: 'The Local Weather Girl', difficulty: 1, needs: 'comedy', style: 'camp' },
  { id: 'fitness-guru', name: 'The Fitness Guru', difficulty: 2, needs: 'comedy', style: 'dancer' },
  { id: 'socialite', name: 'The Hotel Heiress', difficulty: 2, needs: 'comedy', style: 'glamour' },
  { id: 'crime-author', name: 'The True Crime Author', difficulty: 4, needs: 'acting', style: 'spooky' },
  { id: 'soap-villainess', name: 'The Soap Villainess', difficulty: 3, needs: 'acting', style: 'camp' },
  { id: 'chat-panellist', name: 'The Chat Show Panellist', difficulty: 3, needs: 'comedy', style: 'comedy' },
  { id: 'country-legend', name: 'The Country Legend', difficulty: 2, needs: 'comedy', style: 'pageant' },
  { id: 'runway-editor', name: 'The Runway Editor', difficulty: 4, needs: 'acting', style: 'fashion' },
  { id: 'child-star', name: 'The Grown Child Star', difficulty: 3, needs: 'comedy', style: 'camp' },
  { id: 'psychic', name: 'The Television Psychic', difficulty: 2, needs: 'comedy', style: 'spooky' },
  { id: 'girl-group-lead', name: 'The Girl Group Lead', difficulty: 2, needs: 'comedy', style: 'club-kid' },
  { id: 'cookery-host', name: 'The Cookery Show Host', difficulty: 1, needs: 'comedy', style: 'camp' },
  { id: 'first-lady', name: 'The Former First Lady', difficulty: 5, needs: 'acting', style: 'pageant' },
  { id: 'rock-widow', name: 'The Rock Widow', difficulty: 4, needs: 'acting', style: 'art' },
  { id: 'infomercial', name: 'The Infomercial Queen', difficulty: 1, needs: 'comedy', style: 'comedy' },
  { id: 'ballet-master', name: 'The Ballet Mistress', difficulty: 4, needs: 'acting', style: 'dancer' },
  { id: 'reality-mom', name: 'The Reality Show Mother', difficulty: 2, needs: 'comedy', style: 'glamour' },
  { id: 'jazz-singer', name: 'The Jazz Singer', difficulty: 3, needs: 'acting', style: 'broadway' },
  { id: 'gossip-columnist', name: 'The Gossip Columnist', difficulty: 3, needs: 'comedy', style: 'fashion' },
  { id: 'silent-star', name: 'The Silent Film Star', difficulty: 5, needs: 'acting', style: 'art' },
  { id: 'aerobics-queen', name: 'The Aerobics Queen', difficulty: 1, needs: 'comedy', style: 'dancer' },
  { id: 'opera-diva', name: 'The Opera Diva', difficulty: 5, needs: 'acting', style: 'broadway' },
  { id: 'game-show-host', name: 'The Game Show Host', difficulty: 2, needs: 'comedy', style: 'comedy' },
  { id: 'pageant-coach', name: 'The Pageant Coach', difficulty: 2, needs: 'comedy', style: 'pageant' },
  { id: 'club-legend', name: 'The Nightclub Legend', difficulty: 3, needs: 'comedy', style: 'club-kid' },
];
```

- [ ] **Step 4: The module**

```js
// js/dr/chal/snatch-game.js — the taping (spec §8.2, §8.5)
import { SNATCH_CHARACTERS } from '../data/snatch-characters.js';
import { pickOrder, contestFor } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise } from '../perform.js';
import { evt } from './_generic.js';

const ROUNDS = 6;

/** Her preference list: characters that suit her, that she can carry. */
function wantsFor(player) {
  const d = dragOf(player);
  return [...SNATCH_CHARACTERS]
    .map(c => ({ c, score: (c.style === d.style ? 3 : 0) + d[c.needs] - c.difficulty + (d.comedy - 5) * 0.2 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(x => x.c.id);
}

export function assign(ctx) {
  const { living, players, rng, miniWinner, cfg } = ctx;
  const order = pickOrder({ living, miniWinner, mini: cfg.mini || { buys: 'pick-order' }, rng });
  const choices = Object.fromEntries(order.map(n => [n, wantsFor(players[n])]));
  const { picks, events } = contestFor({ order, choices, players, rng });
  const roles = Object.fromEntries(order.map(n => [n, 'standard']));
  return { roles, teams: [], order, picks, events,
    scenes: [{ step: 'choice', kind: 'snatch-picks', data: { order, picks } }] };
}

export function prepare(ctx) {
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  return { prep: w.prep, events: [...r.events, ...w.events],
    scenes: [...r.scenes, { step: 'prep', kind: 'walkthrough', data: { notes: w.notes } }] };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng, bond } = ctx;
  const performances = {}, events = [], rounds = [];
  const charOf = n => SNATCH_CHARACTERS.find(c => c.id === assignment.picks[n]?.choice) || null;

  // Every queen answers every question; the taping is the record.
  const perRound = {};
  for (const n of living) perRound[n] = [];
  for (let r = 0; r < ROUNDS; r++) {
    const beat = [];
    for (const n of living) {
      const d = dragOf(players[n]), c = charOf(n);
      const fit = c ? (c.style === d.style ? 1.2 : 0) - Math.max(0, c.difficulty - d[c.needs] / 2) * 0.4 : -1;
      const score = d.comedy * 0.55 + d.acting * 0.35 + fit + (prep[n] || 0)
        - (assignment.picks[n]?.penalty || 0) + noise(rng, 2.2);
      perRound[n].push(Math.round(score * 100) / 100);
      beat.push({ name: n, score: Math.round(score * 100) / 100 });
    }
    rounds.push({ round: r + 1, answers: beat });
  }

  // Two queens next to each other who like each other build a bit together.
  for (let i = 1; i < assignment.order.length; i++) {
    const a = assignment.order[i - 1], b = assignment.order[i];
    if (bond(a, b) >= 2 && rng() < 0.4) {
      perRound[a] = perRound[a].map(s => s + 0.8);
      perRound[b] = perRound[b].map(s => s + 0.8);
      events.push(evt('double-act', { players: [a, b], bond: [[a, b, 1]], pop: { [a]: 2, [b]: 2 },
        data: { characters: [assignment.picks[a]?.choice, assignment.picks[b]?.choice] } }));
    }
  }

  for (const n of living) {
    const scores = perRound[n];
    const perf = scores.reduce((s, x) => s + x, 0) / scores.length;
    const flops = scores.filter(s => s < 3).length;
    const kills = scores.filter(s => s > 8.5).length;
    if (flops >= 3) {
      events.push(evt('dying', { players: [n], pop: { [n]: -3 }, state: { snatchDied: n },
        data: { character: assignment.picks[n]?.choice, flops } }));
    }
    performances[n] = {
      perf: Math.round(perf * 100) / 100,
      moment: kills >= 2,
      risk: (Number(players[n].stats?.boldness) || 5) / 10,
      role: 'standard', team: null,
      parts: { base: perf, prep: prep[n] || 0 },
      detail: { character: charOf(n)?.name || null, characterId: assignment.picks[n]?.choice || null,
        rounds: scores, flops, kills },
    };
  }
  return { performances, runwayOverride: null, events,
    scenes: [{ step: 'maxi-pre', kind: 'snatch-taping', data: { rounds } }] };
}
```

- [ ] **Step 5: Run the test**

Run: `npx vitest run tests/dr-chal-snatch.test.js tests/dr-maxi-spine.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/dr/data/snatch-characters.js js/dr/chal/snatch-game.js tests/dr-chal-snatch.test.js
git commit -m "feat(drag-race): Snatch Game — character draft, six-round taping, dying on the panel"
```

---

### Task 5: The Ball — three looks, one of them sewn

**Files:**
- Rewrite: `js/dr/chal/ball.js`
- Test: `tests/dr-chal-ball.test.js`

**Interfaces:**
- Produces:
  - `BALL_THEMES` — 12 three-category sets `{ id, name, categories: [{ label, styles: [style], sewn: boolean }] }`, exactly one `sewn: true` per set.
  - `assign(ctx)` picks a theme (from `cfg.ballTheme` or seeded) and gives everybody `standard`.
  - `prepare(ctx)` runs `prepareRoom` + `walkthrough`, then adds **construction**: the sewn look's quality is `design*0.7 + prep*1.2 + noise(2)`; below `3.5` fires a `wardrobe-malfunction` event (popularity `−2`, `state.malfunction`), above `8` a `showstopper` (popularity `+3`).
  - `perform(ctx) → { performances, runwayOverride: { walks: [3 walks] } }` — the maxi score is the mean of the three walks with the sewn one weighted double; `runwayOverride` hands `week.js` the three categories so the runway step scores them.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-chal-ball.test.js
import { describe, expect, it } from 'vitest';
import { BALL_THEMES } from '../js/dr/chal/ball.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { runMaxi } from '../js/dr/maxi.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}) => ({ name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag } });
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve'];
function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)]))) {
  return { living: Object.keys(players), players, maxi: maxiById('ball'), rng: rngFor(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {} },
    bond: () => 0, addBond: () => {}, popDelta: () => {}, miniWinner: null, cfg: {} };
}

describe('ball themes', () => {
  it('every theme has three categories and exactly one sewn', () => {
    expect(BALL_THEMES.length).toBeGreaterThanOrEqual(12);
    for (const t of BALL_THEMES) {
      expect(t.categories.length).toBe(3);
      expect(t.categories.filter(c => c.sewn).length).toBe(1);
    }
  });
});

describe('the ball', () => {
  it('returns three walks for the runway step', () => {
    const out = runMaxi(ctx());
    expect(out.runwayOverride.walks.length).toBe(3);
    expect(out.runwayOverride.walks.filter(w => w.sewn).length).toBe(1);
  });
  it('a seamstress beats a stylist here', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Ada' ? { design: 10, runway: 6 } : { design: 3, runway: 8 })]));
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      const out = runMaxi(ctx(i, p));
      if (Object.entries(out.performances).sort((a, b) => b[1].perf - a[1].perf)[0][0] === 'Ada') wins++;
    }
    expect(wins / 40).toBeGreaterThan(0.45);
  });
  it('a bad build is a malfunction with a cost; a great one is a showstopper', () => {
    const bad = Object.fromEntries(NAMES.map(n => [n, mk(n, { design: 1 })]));
    const good = Object.fromEntries(NAMES.map(n => [n, mk(n, { design: 10 })]));
    const has = (players, type) => { for (let i = 0; i < 30; i++) { if (runMaxi(ctx(i, players)).events.some(e => e.type === type)) return true; } return false; };
    expect(has(bad, 'wardrobe-malfunction')).toBe(true);
    expect(has(good, 'showstopper')).toBe(true);
  });
  it('records all three looks per queen', () => {
    const out = runMaxi(ctx(2));
    expect(out.performances.Ada.detail.looks.length).toBe(3);
    expect(out.performances.Ada.detail.looks.filter(l => l.sewn).length).toBe(1);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-chal-ball.test.js`
Expected: FAIL — `BALL_THEMES` not exported.

- [ ] **Step 3: Implement**

```js
// js/dr/chal/ball.js — three looks, and only one of them is hers to build
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise } from '../perform.js';
import { evt } from './_generic.js';

export const BALL_THEMES = [
  { id: 'night-of-a-thousand', name: 'Night of a Thousand Somethings', categories: [
    { label: 'Opening number realness', styles: ['broadway', 'glamour'], sewn: false },
    { label: 'Street couture', styles: ['fashion', 'club-kid'], sewn: false },
    { label: 'Built from the archive', styles: ['art', 'fashion'], sewn: true } ] },
  { id: 'monster-ball', name: 'The Monster Ball', categories: [
    { label: 'Beautiful nightmare', styles: ['spooky', 'art'], sewn: false },
    { label: 'Creature of the deep', styles: ['art', 'camp'], sewn: false },
    { label: 'Homemade horror', styles: ['spooky', 'camp'], sewn: true } ] },
  { id: 'pageant-ball', name: 'The Pageant Ball', categories: [
    { label: 'Swimwear', styles: ['pageant', 'glamour'], sewn: false },
    { label: 'Evening gown', styles: ['pageant', 'glamour'], sewn: false },
    { label: 'Costume of your country', styles: ['pageant', 'camp'], sewn: true } ] },
  { id: 'metals-ball', name: 'The Precious Metals Ball', categories: [
    { label: 'Solid gold', styles: ['glamour', 'fashion'], sewn: false },
    { label: 'Silver screen', styles: ['glamour', 'broadway'], sewn: false },
    { label: 'Scrap metal couture', styles: ['art', 'club-kid'], sewn: true } ] },
  { id: 'travel-ball', name: 'The Departures Ball', categories: [
    { label: 'Airport arrivals', styles: ['fashion', 'glamour'], sewn: false },
    { label: 'Holiday of a lifetime', styles: ['camp', 'club-kid'], sewn: false },
    { label: 'Built from the duty free', styles: ['art', 'camp'], sewn: true } ] },
  { id: 'flora-ball', name: 'The Flora and Fauna Ball', categories: [
    { label: 'Garden party', styles: ['glamour', 'pageant'], sewn: false },
    { label: 'Bird of paradise', styles: ['art', 'club-kid'], sewn: false },
    { label: 'Grown, not bought', styles: ['art', 'fashion'], sewn: true } ] },
  { id: 'decades-ball', name: 'The Decades Ball', categories: [
    { label: 'Silver screen siren', styles: ['glamour', 'broadway'], sewn: false },
    { label: 'Disco inferno', styles: ['dancer', 'club-kid'], sewn: false },
    { label: 'The future, as we imagined it', styles: ['art', 'fashion'], sewn: true } ] },
  { id: 'royal-ball', name: 'The Royal Ball', categories: [
    { label: 'Coronation', styles: ['pageant', 'glamour'], sewn: false },
    { label: 'Scandal at court', styles: ['camp', 'spooky'], sewn: false },
    { label: 'Crown jewels, self-made', styles: ['art', 'fashion'], sewn: true } ] },
  { id: 'sport-ball', name: 'The Sport Ball', categories: [
    { label: 'Opening ceremony', styles: ['dancer', 'pageant'], sewn: false },
    { label: 'Locker room', styles: ['club-kid', 'camp'], sewn: false },
    { label: 'Trophy, built', styles: ['art', 'camp'], sewn: true } ] },
  { id: 'paper-ball', name: 'The Paper Ball', categories: [
    { label: 'Newsprint', styles: ['fashion', 'art'], sewn: false },
    { label: 'Wrapping paper', styles: ['camp', 'club-kid'], sewn: false },
    { label: 'Origami couture', styles: ['art', 'fashion'], sewn: true } ] },
  { id: 'weather-ball', name: 'The Elements Ball', categories: [
    { label: 'Fire', styles: ['club-kid', 'dancer'], sewn: false },
    { label: 'Water', styles: ['art', 'glamour'], sewn: false },
    { label: 'Storm, constructed', styles: ['art', 'spooky'], sewn: true } ] },
  { id: 'hometown-ball', name: 'The Hometown Ball', categories: [
    { label: 'Where you are from', styles: ['pageant', 'camp'], sewn: false },
    { label: 'Where you are going', styles: ['fashion', 'glamour'], sewn: false },
    { label: 'Made at home', styles: ['art', 'broadway'], sewn: true } ] },
];

export function assign(ctx) {
  const { living, rng, cfg } = ctx;
  const theme = BALL_THEMES.find(t => t.id === cfg.ballTheme) || BALL_THEMES[Math.floor(rng() * BALL_THEMES.length)];
  const roles = Object.fromEntries(living.map(n => [n, 'standard']));
  return { roles, teams: [], order: [...living], picks: { _theme: theme.id }, events: [],
    scenes: [{ step: 'maxi-announce', kind: 'ball-theme', data: { theme } }] };
}

export function prepare(ctx) {
  const { living, players, rng } = ctx;
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];
  const build = {};
  for (const n of living) {
    const d = dragOf(players[n]);
    const q = d.design * 0.7 + (w.prep[n] || 0) * 1.2 + noise(rng, 2);
    build[n] = Math.round(q * 100) / 100;
    if (q < 3.5) events.push(evt('wardrobe-malfunction', { players: [n], pop: { [n]: -2 },
      state: { [`malfunction:${n}`]: true }, data: { quality: build[n] } }));
    else if (q > 8) events.push(evt('showstopper', { players: [n], pop: { [n]: 3 }, data: { quality: build[n] } }));
  }
  return { prep: w.prep, events, buildQuality: build,
    scenes: [...r.scenes, { step: 'prep', kind: 'ball-build', data: { build } }] };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng } = ctx;
  const theme = BALL_THEMES.find(t => t.id === assignment.picks._theme) || BALL_THEMES[0];
  const performances = {}, events = [];
  for (const n of living) {
    const d = dragOf(players[n]);
    const looks = theme.categories.map(c => {
      const craft = c.sewn ? d.design : d.runway;
      const fit = c.styles.includes(d.style) ? 1.5 : 0;
      const s = craft * 0.8 + fit + (prep[n] || 0) + noise(rng, 1.8);
      return { label: c.label, sewn: !!c.sewn, score: Math.round(s * 100) / 100, fit: fit > 0 };
    });
    // The sewn look counts double: it is the only one she actually made.
    const weights = looks.map(l => (l.sewn ? 2 : 1));
    const perf = looks.reduce((s, l, i) => s + l.score * weights[i], 0) / weights.reduce((a, b) => a + b, 0);
    performances[n] = { perf: Math.round(perf * 100) / 100,
      moment: looks.some(l => l.score > 9.5), risk: (Number(players[n].stats?.boldness) || 5) / 10,
      role: 'standard', team: null, parts: { prep: prep[n] || 0 }, detail: { theme: theme.name, looks } };
  }
  return { performances, events,
    runwayOverride: { walks: theme.categories.map(c => ({ category: c.label, sewn: !!c.sewn, categoryStyles: c.styles })) },
    scenes: [{ step: 'maxi-main', kind: 'ball-walks', data: { theme: theme.name } }] };
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-chal-ball.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/dr/chal/ball.js tests/dr-chal-ball.test.js
git commit -m "feat(drag-race): the Ball — twelve themes, three walks, the sewn look weighted double"
```

---

### Task 6: Girl Group and Rumix — verses, the booth, the spotlight hog

**Files:**
- Rewrite: `js/dr/chal/girl-group.js`; register it for `rumix` and `music-video` in `js/dr/maxi.js`
- Test: `tests/dr-chal-girl-group.test.js`

**Interfaces:**
- Produces:
  - `assign(ctx)` — `captainSplit` when the mini bought a captaincy, otherwise a seeded split; `draftRoles` inside each team over `['lead', 'featured', 'standard', 'standard', 'ensemble', ...]`.
  - `prepare(ctx)` — `prepareRoom` + `walkthrough`, then **the verse**: `singing*0.5 + comedy*0.3 + mental*0.02` with `noise(2)`; below `3` fires `bad-verse` (popularity `−2`), above `8` `verse-of-the-week` (`+3`). Then **the booth**: a vocal coach note, `+0.5` if `singing ≥ 6`, `−0.5` otherwise (event either way).
  - `perform(ctx)` — per queen `singing*0.35 + dance*0.35 + comedy*0.15 + runway*0.15` scaled by role, plus `teamChem = mean bond within the team * 0.15`. Then two group events:
    - **spotlight hog**: the highest-`boldness` queen in a team with `canScheme` true steals focus: `+1.2` herself, `−0.5` to every teammate, bond `−1` with each, popularity `−2`.
    - **carried**: a queen whose own score is `< 4` on a team whose mean is `> 7` is carried: bond `+0.5` with the team's best, popularity `−1` for her, `+1` for the carrier.
  - Team result: the winning team is the higher mean; every member gets `+0.8`, and the losing team `−0.4`, so a standout on the losing team can still land high (the spec's rule).

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-chal-girl-group.test.js
import { describe, expect, it } from 'vitest';
import { runMaxi } from '../js/dr/maxi.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}, over = {}) => ({ name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag }, ...over });
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay'];
function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)])), maxiId = 'girl-group') {
  const bonds = {};
  return { living: Object.keys(players), players, maxi: maxiById(maxiId), rng: rngFor(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {} },
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0, addBond: (a, b, d) => { bonds[[a, b].sort().join('|')] = (bonds[[a, b].sort().join('|')] || 0) + d; },
    popDelta: () => {}, miniWinner: 'Ada', cfg: {} };
}

describe('girl group', () => {
  it('splits into teams and gives every queen a role and a verse', () => {
    const out = runMaxi(ctx());
    expect(out.assignment.teams.length).toBe(2);
    expect(out.assignment.teams.flat().sort()).toEqual([...NAMES].sort());
    for (const n of NAMES) {
      expect(out.performances[n].role).toBeTruthy();
      expect(typeof out.performances[n].detail.verse).toBe('number');
    }
  });
  it('a singer beats a designer here', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Cleo' ? { singing: 10, dance: 9 } : { singing: 3, dance: 3, design: 10 })]));
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      const out = runMaxi(ctx(i, p));
      if (Object.entries(out.performances).sort((a, b) => b[1].perf - a[1].perf)[0][0] === 'Cleo') wins++;
    }
    expect(wins / 40).toBeGreaterThan(0.5);
  });
  it('a bold villain hogs the spotlight and her team pays', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, {}, n === 'Bee' ? { archetype: 'villain', stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), boldness: 10 } } : {})]));
    let found = null;
    for (let i = 0; i < 40 && !found; i++) found = runMaxi(ctx(i, p)).events.find(e => e.type === 'spotlight-hog');
    expect(found).toBeTruthy();
    expect(found.players[0]).toBe('Bee');
    expect(found.pop.Bee).toBeLessThan(0);
    expect(found.bond.length).toBeGreaterThan(0);
  });
  it('a standout on the losing team can still out-score a passenger on the winning one', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Fay' ? { singing: 10, dance: 10, comedy: 10, runway: 10 } : { singing: 4, dance: 4 })]));
    let beat = 0;
    for (let i = 0; i < 40; i++) {
      const out = runMaxi(ctx(i, p));
      const fayTeam = out.assignment.teams.findIndex(t => t.includes('Fay'));
      const other = out.assignment.teams[1 - fayTeam] || [];
      if (other.some(n => out.performances.Fay.perf > out.performances[n].perf)) beat++;
    }
    expect(beat).toBeGreaterThan(30);
  });
  it('serves rumix and music-video too', () => {
    for (const id of ['rumix', 'music-video']) {
      const out = runMaxi(ctx(1, undefined, id));
      expect(Object.keys(out.performances).length).toBe(6);
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-chal-girl-group.test.js`
Expected: FAIL — the generic module has no `detail.verse`.

- [ ] **Step 3: Implement**

```js
// js/dr/chal/girl-group.js — verses, the booth, and who takes the front
// Serves girl-group, rumix and music-video: one track, parts, a group number.
import { pickOrder, draftRoles, captainSplit, ROLE_SPOTLIGHT } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise, ROLE_RANGES } from '../perform.js';
import { canScheme, evt } from './_generic.js';

const PART_LADDER = ['lead', 'featured', 'featured', 'standard', 'standard', 'ensemble', 'ensemble', 'ensemble'];

export function assign(ctx) {
  const { living, players, rng, miniWinner, bond, cfg, maxi } = ctx;
  const order = pickOrder({ living, miniWinner, mini: cfg.mini || null, rng });
  const events = [];
  let teams;
  if (maxi.format === 'cast') teams = [[...order]];
  else if (cfg.mini?.buys === 'captain' && miniWinner) {
    const second = order.find(n => n !== miniWinner);
    const split = captainSplit({ order, captains: [miniWinner, second], players, bond, rng });
    teams = split.teams; events.push(...split.events);
  } else {
    const half = Math.ceil(order.length / 2);
    teams = [order.slice(0, half), order.slice(half)];
  }
  const roles = {}, picks = {};
  for (const t of teams) {
    const d = draftRoles({ order: t, roleNames: PART_LADDER.slice(0, t.length), rng, players });
    Object.assign(roles, d.roles);
    for (const p of d.picks) picks[p.name] = { choice: p.role, penalty: 0, ducked: p.ducked };
  }
  return { roles, teams, order, picks, events,
    scenes: [{ step: 'choice', kind: 'group-parts', data: { teams, roles } }] };
}

export function prepare(ctx) {
  const { living, players, rng } = ctx;
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];
  const verse = {}, booth = {};
  for (const n of living) {
    const d = dragOf(players[n]), s = players[n].stats || {};
    const v = d.singing * 0.5 + d.comedy * 0.3 + (Number(s.mental) || 5) * 0.02 + noise(rng, 2);
    verse[n] = Math.round(v * 100) / 100;
    if (v < 3) events.push(evt('bad-verse', { players: [n], pop: { [n]: -2 }, data: { verse: verse[n] } }));
    else if (v > 8) events.push(evt('verse-of-the-week', { players: [n], pop: { [n]: 3 }, data: { verse: verse[n] } }));
    const ok = d.singing >= 6;
    booth[n] = ok ? 0.5 : -0.5;
    w.prep[n] = (w.prep[n] || 0) + booth[n];
    events.push(evt('booth', { players: [n], pop: { [n]: ok ? 1 : -1 }, data: { ok, singing: d.singing } }));
  }
  return { prep: w.prep, events, verse,
    scenes: [...r.scenes, { step: 'prep', kind: 'recording-booth', data: { verse, booth } }] };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng, bond } = ctx;
  const performances = {}, events = [];
  const teamOf = n => assignment.teams.find(t => t.includes(n)) || [];
  const raw = {};
  for (const n of living) {
    const d = dragOf(players[n]);
    const team = teamOf(n);
    const chem = team.length > 1 ? team.filter(o => o !== n).reduce((s, o) => s + bond(n, o), 0) / (team.length - 1) * 0.15 : 0;
    const range = ROLE_RANGES[assignment.roles[n]] ?? 1;
    const base = d.singing * 0.35 + d.dance * 0.35 + d.comedy * 0.15 + d.runway * 0.15;
    raw[n] = (base - 5) * range + 5 + (prep[n] || 0) + chem + noise(rng, 2.2 * range);
  }

  // Somebody takes the front. It works for her and costs the room.
  for (const team of assignment.teams) {
    if (team.length < 3) continue;
    const hog = team.filter(n => canScheme(players[n]))
      .sort((a, b) => (Number(players[b].stats?.boldness) || 5) - (Number(players[a].stats?.boldness) || 5))[0];
    if (!hog || rng() > (Number(players[hog].stats?.boldness) || 5) / 12) continue;
    raw[hog] += 1.2;
    const others = team.filter(n => n !== hog);
    for (const o of others) raw[o] -= 0.5;
    events.push(evt('spotlight-hog', { players: [hog, ...others],
      bond: others.map(o => [hog, o, -1]), pop: { [hog]: -2 }, data: { team } }));
  }

  // Somebody is carried, and the room knows it.
  for (const team of assignment.teams) {
    if (team.length < 3) continue;
    const mean = team.reduce((s, n) => s + raw[n], 0) / team.length;
    const weakest = team.reduce((w, n) => (raw[n] < raw[w] ? n : w), team[0]);
    const best = team.reduce((b, n) => (raw[n] > raw[b] ? n : b), team[0]);
    if (raw[weakest] < 4 && mean > 7) {
      events.push(evt('carried', { players: [best, weakest], bond: [[best, weakest, 0.5]],
        pop: { [weakest]: -1, [best]: 1 }, data: { mean: Math.round(mean * 100) / 100 } }));
    }
  }

  // The team result, then the individual inside it.
  const means = assignment.teams.map(t => t.reduce((s, n) => s + raw[n], 0) / Math.max(1, t.length));
  const bestTeam = means.indexOf(Math.max(...means));
  for (const n of living) {
    const ti = assignment.teams.findIndex(t => t.includes(n));
    const teamBonus = assignment.teams.length < 2 ? 0 : ti === bestTeam ? 0.8 : -0.4;
    const perf = raw[n] + teamBonus;
    performances[n] = { perf: Math.round(perf * 100) / 100,
      moment: perf > 11, risk: (Number(players[n].stats?.boldness) || 5) / 10,
      role: assignment.roles[n], team: ti,
      parts: { prep: prep[n] || 0, teamBonus },
      detail: { verse: ctx.verse?.[n] ?? null, teamWon: ti === bestTeam, teamMean: Math.round(means[ti] * 100) / 100 } };
  }
  return { performances, runwayOverride: null, events,
    scenes: [{ step: 'maxi-pre', kind: 'group-number', data: { teams: assignment.teams, means, bestTeam } }] };
}
```

`ctx.verse` reaches `perform` because the spine spreads the `prepare` result into `ctx3`; add `verse: p.verse` to the `ctx3` construction in `js/dr/maxi.js` (`const ctx3 = { ...ctx2, prep: p.prep, verse: p.verse, buildQuality: p.buildQuality };`) so Task 5's `buildQuality` and this task's `verse` both arrive. Register the module for the three ids in `CHAL_MODULES`.

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-chal-girl-group.test.js tests/dr-chal-ball.test.js tests/dr-maxi-spine.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/dr/chal/girl-group.js js/dr/maxi.js tests/dr-chal-girl-group.test.js
git commit -m "feat(drag-race): girl group, rumix, music video — verses, the booth, spotlight hog, carried"
```

---

### Task 7: The Rusical — parts, and whether she sings it live

**Files:**
- Rewrite: `js/dr/chal/rusical.js`
- Test: `tests/dr-chal-rusical.test.js`

**Interfaces:**
- Produces:
  - `RUSICALS` — 8 shows `{ id, name, parts: [{ role, name, spotlight, needs: 'singing'|'acting'|'dance' }] }`, always one lead, two or three featured, the rest ensemble.
  - `assign(ctx)` — `contestFor` over the named parts (her preference is `spotlight` weighted by whether the part's `needs` is her strength), so two queens wanting the lead is a scene.
  - `prepare(ctx)` — `prepareRoom` + `walkthrough`, then **the live vocal choice**: a queen with `singing ≥ 7` or `boldness ≥ 8` sings live; live is `±1.5` swing against `±0.4` for lip syncing to the recording. The choice is an event either way (popularity `+2` for a live vocal that lands, `−2` for one that does not; `0` bond change is not allowed, so the pop delta carries it).
  - `perform(ctx)` — `singing*0.35 + acting*0.3 + dance*0.25 + runway*0.1` scaled by the part's `spotlight` through `ROLE_RANGES`, plus the live-vocal swing. **Ensemble invisibility**: an ensemble queen scoring under `5` fires `invisible` (popularity `−1`), which is the "she disappeared" note the panel gives.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-chal-rusical.test.js
import { describe, expect, it } from 'vitest';
import { RUSICALS } from '../js/dr/chal/rusical.js';
import { runMaxi } from '../js/dr/maxi.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}, over = {}) => ({ name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag }, ...over });
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay'];
function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)]))) {
  return { living: Object.keys(players), players, maxi: maxiById('rusical'), rng: rngFor(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {} },
    bond: () => 0, addBond: () => {}, popDelta: () => {}, miniWinner: 'Ada', cfg: {} };
}

describe('rusicals', () => {
  it('are eight shows with one lead each', () => {
    expect(RUSICALS.length).toBeGreaterThanOrEqual(8);
    for (const r of RUSICALS) {
      expect(r.parts.filter(p => p.role === 'lead').length).toBe(1);
      expect(r.parts.length).toBeGreaterThanOrEqual(6);
      for (const p of r.parts) expect(['singing', 'acting', 'dance']).toContain(p.needs);
    }
  });
});

describe('the rusical', () => {
  it('casts every queen in a named part, the mini winner first in line', () => {
    const out = runMaxi(ctx());
    expect(Object.keys(out.assignment.picks).length).toBe(6);
    expect(out.performances.Ada.detail.part).toBeTruthy();
    expect(new Set(Object.values(out.assignment.picks).map(p => p.choice)).size).toBe(6);
  });
  it('a singer who takes the lead can win big or bomb', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Ada' ? { singing: 9, acting: 8 } : {})]));
    const scores = Array.from({ length: 60 }, (_, i) => runMaxi(ctx(i, p)).performances.Ada.perf);
    const m = scores.reduce((a, b) => a + b, 0) / scores.length;
    const sd = Math.sqrt(scores.reduce((a, b) => a + (b - m) ** 2, 0) / scores.length);
    expect(m).toBeGreaterThan(6);
    expect(sd).toBeGreaterThan(1.2);
  });
  it('records the live-vocal decision and pays for it either way', () => {
    const belter = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Bee' ? { singing: 10 } : { singing: 2 })]));
    const out = runMaxi(ctx(2, belter));
    expect(typeof out.performances.Bee.detail.live).toBe('boolean');
    const ev = out.events.filter(e => e.type === 'live-vocal');
    expect(ev.length).toBeGreaterThan(0);
    for (const e of ev) expect(Object.keys(e.pop).length).toBeGreaterThan(0);
  });
  it('an ensemble queen who does nothing is noted', () => {
    const weak = Object.fromEntries(NAMES.map(n => [n, mk(n, { singing: 1, acting: 1, dance: 1, runway: 1 })]));
    let seen = false;
    for (let i = 0; i < 30 && !seen; i++) seen = runMaxi(ctx(i, weak)).events.some(e => e.type === 'invisible');
    expect(seen).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-chal-rusical.test.js`
Expected: FAIL — `RUSICALS` not exported.

- [ ] **Step 3: Implement**

```js
// js/dr/chal/rusical.js — an original musical, cast in a draft
import { pickOrder, contestFor } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise, ROLE_RANGES } from '../perform.js';
import { evt } from './_generic.js';

const P = (role, name, spotlight, needs) => ({ role, name, spotlight, needs });

export const RUSICALS = [
  { id: 'divas-live', name: 'Divas Live On Ice', parts: [
    P('lead', 'The Headliner', 1.0, 'singing'), P('featured', 'The Rival', 0.7, 'acting'),
    P('featured', 'The Manager', 0.7, 'acting'), P('standard', 'The Skater', 0.45, 'dance'),
    P('standard', 'The Commentator', 0.45, 'acting'), P('ensemble', 'The Chorus', 0.2, 'dance'),
    P('ensemble', 'The Rink Staff', 0.2, 'dance')] },
  { id: 'moulin-ru', name: 'The Moulin Ru', parts: [
    P('lead', 'The Sparkling Diamond', 1.0, 'singing'), P('featured', 'The Poet', 0.7, 'singing'),
    P('featured', 'The Duke', 0.7, 'acting'), P('standard', 'The Doorman', 0.45, 'acting'),
    P('standard', 'The Absinthe Fairy', 0.45, 'dance'), P('ensemble', 'The Can-Can Line', 0.2, 'dance'),
    P('ensemble', 'The Patrons', 0.2, 'acting')] },
  { id: 'space-station', name: 'Space Station Sisters', parts: [
    P('lead', 'The Captain', 1.0, 'acting'), P('featured', 'The Engineer', 0.7, 'singing'),
    P('featured', 'The Alien', 0.7, 'dance'), P('standard', 'The Medic', 0.45, 'singing'),
    P('standard', 'The Cadet', 0.45, 'acting'), P('ensemble', 'The Crew', 0.2, 'dance')] },
  { id: 'high-school', name: 'Herstory High', parts: [
    P('lead', 'The Prom Queen', 1.0, 'singing'), P('featured', 'The Outcast', 0.7, 'acting'),
    P('featured', 'The Coach', 0.7, 'dance'), P('standard', 'The Nerd', 0.45, 'acting'),
    P('standard', 'The Jock', 0.45, 'dance'), P('ensemble', 'The Hall Monitors', 0.2, 'acting'),
    P('ensemble', 'The Marching Band', 0.2, 'dance')] },
  { id: 'wild-west', name: 'Gunslingers of Gulch City', parts: [
    P('lead', 'The Sheriff', 1.0, 'acting'), P('featured', 'The Saloon Singer', 0.7, 'singing'),
    P('featured', 'The Outlaw', 0.7, 'dance'), P('standard', 'The Barkeep', 0.45, 'acting'),
    P('standard', 'The Preacher', 0.45, 'singing'), P('ensemble', 'The Townsfolk', 0.2, 'acting')] },
  { id: 'soap-opera', name: 'As the Wig Turns', parts: [
    P('lead', 'The Matriarch', 1.0, 'acting'), P('featured', 'The Long-Lost Twin', 0.7, 'acting'),
    P('featured', 'The Doctor', 0.7, 'singing'), P('standard', 'The Nurse', 0.45, 'singing'),
    P('standard', 'The Lawyer', 0.45, 'acting'), P('ensemble', 'The Mourners', 0.2, 'dance')] },
  { id: 'fairy-tale', name: 'Once Upon a Werk Room', parts: [
    P('lead', 'The Princess', 1.0, 'singing'), P('featured', 'The Witch', 0.7, 'acting'),
    P('featured', 'The Woodcutter', 0.7, 'dance'), P('standard', 'The Mirror', 0.45, 'acting'),
    P('standard', 'The Godmother', 0.45, 'singing'), P('ensemble', 'The Forest', 0.2, 'dance')] },
  { id: 'disco-inferno', name: 'Disco Inferno: The Musical', parts: [
    P('lead', 'The Dancefloor Queen', 1.0, 'dance'), P('featured', 'The DJ', 0.7, 'singing'),
    P('featured', 'The Bouncer', 0.7, 'acting'), P('standard', 'The Regular', 0.45, 'dance'),
    P('standard', 'The New Girl', 0.45, 'singing'), P('ensemble', 'The Crowd', 0.2, 'dance')] },
];

export function assign(ctx) {
  const { living, players, rng, miniWinner, cfg } = ctx;
  const show = RUSICALS.find(r => r.id === cfg.rusical) || RUSICALS[Math.floor(rng() * RUSICALS.length)];
  const order = pickOrder({ living, miniWinner, mini: cfg.mini || { buys: 'pick-order' }, rng });
  const parts = show.parts.slice(0, Math.max(order.length, 1));
  while (parts.length < order.length) parts.push(P('ensemble', `The Chorus ${parts.length}`, 0.2, 'dance'));
  const choices = Object.fromEntries(order.map(n => {
    const d = dragOf(players[n]);
    return [n, [...parts].sort((a, b) => (b.spotlight * 2 + d[b.needs]) - (a.spotlight * 2 + d[a.needs])).map(p => p.name)];
  }));
  const { picks, events } = contestFor({ order, choices, players, rng });
  const roles = {};
  for (const n of order) roles[n] = parts.find(p => p.name === picks[n].choice)?.role || 'ensemble';
  return { roles, teams: [[...order]], order, picks: { ...picks, _show: show.id }, events,
    scenes: [{ step: 'choice', kind: 'rusical-cast', data: { show: show.name, picks } }] };
}

export function prepare(ctx) {
  const { living, players, rng } = ctx;
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];
  const live = {};
  for (const n of living) {
    const d = dragOf(players[n]), s = players[n].stats || {};
    live[n] = d.singing >= 7 || (Number(s.boldness) || 5) >= 8;
    const landed = live[n] && d.singing >= 6;
    events.push(evt('live-vocal', { players: [n], pop: { [n]: live[n] ? (landed ? 2 : -2) : 0.5 },
      data: { live: live[n], singing: d.singing } }));
  }
  return { prep: w.prep, events, live,
    scenes: [...r.scenes, { step: 'prep', kind: 'vocal-choice', data: { live } }] };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng, live } = ctx;
  const show = RUSICALS.find(r => r.id === assignment.picks._show) || RUSICALS[0];
  const performances = {}, events = [];
  for (const n of living) {
    const d = dragOf(players[n]);
    const partName = assignment.picks[n]?.choice;
    const part = show.parts.find(p => p.name === partName) || { role: 'ensemble', spotlight: 0.2, needs: 'dance', name: partName };
    const range = ROLE_RANGES[part.role] ?? 1;
    const isLive = !!(live && live[n]);
    const base = d.singing * 0.35 + d.acting * 0.3 + d.dance * 0.25 + d.runway * 0.1;
    const liveSwing = isLive ? noise(rng, 1.5) + (d.singing - 5) * 0.2 : noise(rng, 0.4);
    const perf = (base - 5) * range + 5 + (prep[n] || 0) - (assignment.picks[n]?.penalty || 0)
      + liveSwing + noise(rng, 2.0 * range);
    if (part.role === 'ensemble' && perf < 5) {
      events.push(evt('invisible', { players: [n], pop: { [n]: -1 }, data: { part: part.name } }));
    }
    performances[n] = { perf: Math.round(perf * 100) / 100, moment: perf > 11,
      risk: isLive ? 0.8 : 0.3, role: part.role, team: 0,
      parts: { prep: prep[n] || 0, liveSwing }, detail: { show: show.name, part: part.name, live: isLive } };
  }
  return { performances, runwayOverride: null, events,
    scenes: [{ step: 'maxi-main', kind: 'rusical-performance', data: { show: show.name } }] };
}
```

Add `live: p.live` to the spine's `ctx3` construction beside `verse` and `buildQuality`.

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-chal-rusical.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/dr/chal/rusical.js js/dr/maxi.js tests/dr-chal-rusical.test.js
git commit -m "feat(drag-race): the Rusical — eight shows, a parts draft, the live vocal gamble"
```

---

### Task 8: The Makeover — a partner, and a family resemblance

**Files:**
- Rewrite: `js/dr/chal/makeover.js`
- Test: `tests/dr-chal-makeover.test.js`

**Interfaces:**
- Produces:
  - `PARTNER_POOLS = { 'pit-crew': [...], 'family': [...], 'eliminated': null }` — the first two are 12 generated partners each `{ id, name, ease: 1..10 }` (`ease` is how well they take to it: a dancer partner walks, a shy one does not); `eliminated` means the module builds partners from `state.out` (the queens already sent home), each with `ease` from her own `runway`.
  - `assign(ctx)` — the pool comes from `cfg.makeoverPool` (default `'pit-crew'`); queens draft partners through `contestFor`; when the pool is `eliminated`, a queen paired with somebody she has a bond with fires a `reunion` event (bond `+1.5`, popularity `+2` both).
  - `prepare(ctx)` — `prepareRoom` + `walkthrough`, then **the build for two**: `design*0.5 + partner.ease*0.3 + prep`. A queen whose own look out-scores her partner's by more than `3` fires `dressed-herself-better` (popularity `−2`).
  - `perform(ctx) → { performances, runwayOverride: { walks: [{ category: 'the pair', ... }] } }` — score is `resemblance*0.4 + partnerLook*0.35 + ownLook*0.25`, where `resemblance = 10 - |ownLook - partnerLook| - (10 - ease)*0.3`.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-chal-makeover.test.js
import { describe, expect, it } from 'vitest';
import { PARTNER_POOLS } from '../js/dr/chal/makeover.js';
import { runMaxi } from '../js/dr/maxi.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}) => ({ name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag } });
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot'];
function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)])), cfg = {}, out = []) {
  const bonds = { 'Ada|Gone': 7 };
  return { living: Object.keys(players), players, maxi: maxiById('makeover'), rng: rngFor(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {}, out },
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0, addBond: () => {}, popDelta: () => {},
    miniWinner: 'Ada', cfg };
}

describe('partner pools', () => {
  it('has a pit crew and a family pool, each graded by ease', () => {
    for (const key of ['pit-crew', 'family']) {
      expect(PARTNER_POOLS[key].length).toBeGreaterThanOrEqual(12);
      for (const p of PARTNER_POOLS[key]) { expect(p.ease).toBeGreaterThanOrEqual(1); expect(p.ease).toBeLessThanOrEqual(10); }
    }
    expect(PARTNER_POOLS.eliminated).toBe(null);
  });
});

describe('the makeover', () => {
  it('pairs everybody and walks the pair', () => {
    const out = runMaxi(ctx());
    expect(Object.keys(out.assignment.picks).filter(k => !k.startsWith('_')).length).toBe(4);
    expect(out.runwayOverride.walks.length).toBe(1);
    expect(out.performances.Ada.detail.partner).toBeTruthy();
    expect(typeof out.performances.Ada.detail.resemblance).toBe('number');
  });
  it('eliminated queens can be the partners, and a friend coming back is a moment', () => {
    const out = runMaxi(ctx(1, undefined, { makeoverPool: 'eliminated' }, ['Gone', 'Past']));
    expect(['Gone', 'Past']).toContain(out.performances.Ada.detail.partner);
    const reunion = out.events.find(e => e.type === 'reunion');
    if (reunion) { expect(reunion.bond[0][2]).toBeGreaterThan(0); expect(Object.keys(reunion.pop).length).toBe(2); }
  });
  it('out-dressing your own sister is a note against you', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, { runway: 10, design: 1 })]));
    let seen = false;
    for (let i = 0; i < 30 && !seen; i++) seen = runMaxi(ctx(i, p)).events.some(e => e.type === 'dressed-herself-better');
    expect(seen).toBe(true);
  });
  it('a strong designer makes the more convincing family', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Cleo' ? { design: 10 } : { design: 2 })]));
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      const o = runMaxi(ctx(i, p));
      if (Object.entries(o.performances).sort((a, b) => b[1].perf - a[1].perf)[0][0] === 'Cleo') wins++;
    }
    expect(wins / 40).toBeGreaterThan(0.45);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-chal-makeover.test.js`
Expected: FAIL — `PARTNER_POOLS` not exported.

- [ ] **Step 3: Implement**

```js
// js/dr/chal/makeover.js — turn a stranger into your sister
import { pickOrder, contestFor } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise } from '../perform.js';
import { evt } from './_generic.js';

const crew = (name, ease) => ({ id: name.toLowerCase().replace(/\W+/g, '-'), name, ease });

export const PARTNER_POOLS = {
  'pit-crew': [crew('Marco', 8), crew('Devon', 6), crew('Rafa', 9), crew('Ty', 5), crew('Bruno', 7),
    crew('Kai', 8), crew('Sol', 4), crew('Ivo', 6), crew('Nate', 9), crew('Quin', 5),
    crew('Ash', 7), crew('Rome', 6)],
  family: [crew('Her mother', 4), crew('Her brother', 6), crew('Her sister', 8), crew('Her father', 3),
    crew('Her cousin', 7), crew('Her best friend', 9), crew('Her aunt', 5), crew('Her nephew', 6),
    crew('Her uncle', 3), crew('Her twin', 9), crew('Her neighbour', 5), crew('Her drag mother', 10)],
  // Built at run time from the queens already sent home.
  eliminated: null,
};

function poolFor(cfg, state, players) {
  if (cfg.makeoverPool === 'eliminated') {
    return (state.out || []).map(n => ({ id: n.toLowerCase(), name: n,
      ease: players[n] ? dragOf(players[n]).runway : 7, isQueen: true }));
  }
  return PARTNER_POOLS[cfg.makeoverPool] || PARTNER_POOLS['pit-crew'];
}

export function assign(ctx) {
  const { living, players, rng, miniWinner, cfg, state, bond } = ctx;
  const pool = poolFor(cfg, state, players);
  const order = pickOrder({ living, miniWinner, mini: cfg.mini || { buys: 'pick-order' }, rng });
  const choices = Object.fromEntries(order.map(n => {
    const scored = [...pool].map(p => ({ p, s: p.ease + (p.isQueen ? bond(n, p.name) * 0.5 : 0) + rng() }));
    return [n, scored.sort((a, b) => b.s - a.s).map(x => x.p.name)];
  }));
  const { picks, events } = contestFor({ order, choices, players, rng });
  for (const n of order) {
    const partner = picks[n].choice;
    if (pool.find(p => p.name === partner)?.isQueen && bond(n, partner) >= 4) {
      events.push(evt('reunion', { players: [n, partner], bond: [[n, partner, 1.5]],
        pop: { [n]: 2, [partner]: 2 }, data: { partner } }));
    }
  }
  return { roles: Object.fromEntries(order.map(n => [n, 'standard'])), teams: [], order,
    picks: { ...picks, _pool: cfg.makeoverPool || 'pit-crew' }, events,
    scenes: [{ step: 'choice', kind: 'makeover-pairs', data: { picks } }] };
}

export function prepare(ctx) {
  const { living, players, assignment, rng, cfg, state } = ctx;
  const pool = poolFor(cfg, state, players);
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];
  const looks = {};
  for (const n of living) {
    const d = dragOf(players[n]);
    const partner = pool.find(p => p.name === assignment.picks[n]?.choice) || { name: 'a stranger', ease: 5 };
    const own = d.runway * 0.8 + (w.prep[n] || 0) + noise(rng, 1.5);
    const theirs = d.design * 0.5 + partner.ease * 0.3 + (w.prep[n] || 0) + noise(rng, 1.8);
    looks[n] = { own: Math.round(own * 100) / 100, partner: Math.round(theirs * 100) / 100, partnerName: partner.name, ease: partner.ease };
    if (own - theirs > 3) {
      events.push(evt('dressed-herself-better', { players: [n], pop: { [n]: -2 },
        data: { own: looks[n].own, partner: looks[n].partner } }));
    }
  }
  return { prep: w.prep, events, looks,
    scenes: [...r.scenes, { step: 'prep', kind: 'makeover-build', data: { looks } }] };
}

export function perform(ctx) {
  const { living, players, prep, rng, looks } = ctx;
  const performances = {}, events = [];
  for (const n of living) {
    const L = (looks && looks[n]) || { own: 5, partner: 5, partnerName: 'a stranger', ease: 5 };
    const resemblance = 10 - Math.abs(L.own - L.partner) - (10 - L.ease) * 0.3 + noise(rng, 1.2);
    const perf = resemblance * 0.4 + L.partner * 0.35 + L.own * 0.25;
    performances[n] = { perf: Math.round(perf * 100) / 100, moment: resemblance > 9 && perf > 9,
      risk: (Number(players[n].stats?.boldness) || 5) / 10, role: 'standard', team: null,
      parts: { prep: prep[n] || 0 },
      detail: { partner: L.partnerName, resemblance: Math.round(resemblance * 100) / 100,
        ownLook: L.own, partnerLook: L.partner } };
  }
  return { performances, events,
    runwayOverride: { walks: [{ category: 'the pair', sewn: false, categoryStyles: [] }] },
    scenes: [{ step: 'maxi-main', kind: 'makeover-reveal', data: {} }] };
}
```

Add `looks: p.looks` to the spine's `ctx3`.

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-chal-makeover.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/dr/chal/makeover.js js/dr/maxi.js tests/dr-chal-makeover.test.js
git commit -m "feat(drag-race): the makeover — partner pools, resemblance, out-dressing your sister"
```

---

### Task 9: The Roast and stand-up — the running order is the challenge

**Files:**
- Rewrite: `js/dr/chal/roast.js` (registered for `roast` and `stand-up`)
- Test: `tests/dr-chal-roast.test.js`

**Interfaces:**
- Produces:
  - `SLOT_DIFFICULTY = { first: 1.4, last: 1.25, middle: 1.0 }` — a range multiplier, not a cap: opening and closing swing harder both ways.
  - `assign(ctx)` — the mini winner picks her slot first (`contestFor` over slot numbers); her preference is `boldness`-driven (a bold queen takes the closer, a timid one hides in the middle).
  - `prepare(ctx)` — `prepareRoom` + `walkthrough`, then **writing**: three bits per queen, each `comedy*0.6 + acting*0.25 + prep` with `noise(2.5)`; a bit under `3` is a dud.
  - `perform(ctx)` — the set is the mean of the three bits times the slot range, plus **room temperature**: each queen's score is nudged by `+0.3` per preceding queen who scored over `8` (a hot room) and `−0.3` per preceding queen who scored under `4` (a dead room), capped at `±1.2`. Events: `bombed` (all three bits under `4`; popularity `−3`), `roasted-the-panel` (a queen with `boldness ≥ 8` who scores over `8`; popularity `+4`, and a `panelRoasted` state flag Plan 3 uses in the critiques), `stole-a-bit` (a `canScheme` queen adjacent in the order to somebody with a better written set: she reuses the angle, `+0.8` herself, `−0.6` the victim, bond `−2`).

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-chal-roast.test.js
import { describe, expect, it } from 'vitest';
import { SLOT_DIFFICULTY } from '../js/dr/chal/roast.js';
import { runMaxi } from '../js/dr/maxi.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}, over = {}) => ({ name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag }, ...over });
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve'];
function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)])), maxiId = 'roast') {
  const bonds = {};
  return { living: Object.keys(players), players, maxi: maxiById(maxiId), rng: rngFor(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {} },
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0, addBond: () => {}, popDelta: () => {},
    miniWinner: 'Ada', cfg: {} };
}

describe('the roast', () => {
  it('the two hard slots swing harder than the middle', () => {
    expect(SLOT_DIFFICULTY.first).toBeGreaterThan(SLOT_DIFFICULTY.middle);
    expect(SLOT_DIFFICULTY.last).toBeGreaterThan(SLOT_DIFFICULTY.middle);
  });
  it('gives everybody a slot and three bits', () => {
    const out = runMaxi(ctx());
    const slots = NAMES.map(n => out.performances[n].detail.slot);
    expect(new Set(slots).size).toBe(5);
    for (const n of NAMES) expect(out.performances[n].detail.bits.length).toBe(3);
  });
  it('a comic beats a look queen', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Dot' ? { comedy: 10, acting: 8 } : { comedy: 2, runway: 10 })]));
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      const o = runMaxi(ctx(i, p));
      if (Object.entries(o.performances).sort((a, b) => b[1].perf - a[1].perf)[0][0] === 'Dot') wins++;
    }
    expect(wins / 40).toBeGreaterThan(0.6);
  });
  it('a dead room drags the next queen down and a hot one lifts her', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, { comedy: 5 })]));
    const out = runMaxi(ctx(3, p));
    const byslot = NAMES.map(n => out.performances[n]).sort((a, b) => a.detail.slot - b.detail.slot);
    for (const q of byslot) expect(typeof q.detail.roomTemp).toBe('number');
    expect(Math.abs(byslot[byslot.length - 1].detail.roomTemp)).toBeLessThanOrEqual(1.2);
  });
  it('bombing, roasting the panel and stealing a bit all have consequences', () => {
    const flop = Object.fromEntries(NAMES.map(n => [n, mk(n, { comedy: 1, acting: 1 })]));
    const bold = Object.fromEntries(NAMES.map(n => [n, mk(n, { comedy: 10 }, { stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), boldness: 10 } })]));
    const snake = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Bee' ? { comedy: 3 } : { comedy: 9 }, n === 'Bee' ? { archetype: 'villain' } : {})]));
    const has = (players, type) => { for (let i = 0; i < 40; i++) { const e = runMaxi(ctx(i, players)).events.find(x => x.type === type); if (e) return e; } return null; };
    expect(has(flop, 'bombed').pop).toBeTruthy();
    expect(has(bold, 'roasted-the-panel').pop).toBeTruthy();
    const steal = has(snake, 'stole-a-bit');
    expect(steal.bond[0][2]).toBeLessThan(0);
  });
  it('serves the stand-up challenge too', () => {
    expect(Object.keys(runMaxi(ctx(1, undefined, 'stand-up')).performances).length).toBe(5);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-chal-roast.test.js`
Expected: FAIL — `SLOT_DIFFICULTY` not exported.

- [ ] **Step 3: Implement**

```js
// js/dr/chal/roast.js — a running order, three bits, and a room that gets colder
import { pickOrder, contestFor } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise } from '../perform.js';
import { canScheme, evt } from './_generic.js';

// Opening and closing swing hardest: nobody is warm yet, and everybody has
// heard the good jokes already. A multiplier on the spread, never a ceiling.
export const SLOT_DIFFICULTY = { first: 1.4, last: 1.25, middle: 1.0 };

const slotKind = (i, n) => (i === 0 ? 'first' : i === n - 1 ? 'last' : 'middle');

export function assign(ctx) {
  const { living, players, rng, miniWinner, cfg } = ctx;
  const order = pickOrder({ living, miniWinner, mini: cfg.mini || { buys: 'pick-order' }, rng });
  const slots = order.map((_, i) => `slot-${i + 1}`);
  const choices = Object.fromEntries(order.map(n => {
    const bold = (Number(players[n].stats?.boldness) || 5) / 10;
    // A bold queen wants the closer; a nervous one wants the middle.
    return [n, [...slots].sort((a, b) => {
      const ia = Number(a.split('-')[1]) - 1, ib = Number(b.split('-')[1]) - 1;
      const want = i => (bold > 0.6 ? -(i === slots.length - 1 ? 2 : i === 0 ? 1 : 0)
        : Math.abs(i - (slots.length - 1) / 2));
      return want(ia) - want(ib);
    })];
  }));
  const { picks, events } = contestFor({ order, choices, players, rng });
  return { roles: Object.fromEntries(order.map(n => [n, 'standard'])), teams: [], order, picks, events,
    scenes: [{ step: 'choice', kind: 'roast-order', data: { picks } }] };
}

export function prepare(ctx) {
  const { living, players, rng } = ctx;
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];
  const bits = {};
  for (const n of living) {
    const d = dragOf(players[n]);
    bits[n] = Array.from({ length: 3 }, () =>
      Math.round((d.comedy * 0.6 + d.acting * 0.25 + (w.prep[n] || 0) + noise(rng, 2.5)) * 100) / 100);
  }
  // A schemer next to a better-written set takes the angle for herself.
  const order = ctx.assignment.order;
  for (let i = 1; i < order.length; i++) {
    const thief = order[i], mark = order[i - 1];
    if (!canScheme(players[thief])) continue;
    const mine = bits[thief].reduce((a, b) => a + b, 0), theirs = bits[mark].reduce((a, b) => a + b, 0);
    if (theirs - mine < 4 || rng() > 0.5) continue;
    bits[thief] = bits[thief].map(b => b + 0.8);
    bits[mark] = bits[mark].map(b => b - 0.6);
    events.push(evt('stole-a-bit', { players: [thief, mark], bond: [[thief, mark, -2]],
      pop: { [thief]: -1 }, data: {} }));
    break;
  }
  return { prep: w.prep, events, bits,
    scenes: [...r.scenes, { step: 'prep', kind: 'writing-room', data: { bits } }] };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng, bits } = ctx;
  const performances = {}, events = [];
  const order = [...living].sort((a, b) =>
    Number(String(assignment.picks[a]?.choice || 'slot-99').split('-')[1])
    - Number(String(assignment.picks[b]?.choice || 'slot-99').split('-')[1]));
  let temp = 0;
  order.forEach((n, i) => {
    const kind = slotKind(i, order.length);
    const range = SLOT_DIFFICULTY[kind];
    const myBits = (bits && bits[n]) || [5, 5, 5];
    const mean = myBits.reduce((a, b) => a + b, 0) / myBits.length;
    const roomTemp = Math.max(-1.2, Math.min(1.2, temp));
    const perf = (mean - 5) * range + 5 + roomTemp - (assignment.picks[n]?.penalty || 0) + noise(rng, 1.2 * range);
    const s = players[n].stats || {};
    if (myBits.every(b => b < 4)) {
      events.push(evt('bombed', { players: [n], pop: { [n]: -3 }, state: { [`bombed:${n}`]: true }, data: { slot: i + 1 } }));
    }
    if ((Number(s.boldness) || 5) >= 8 && perf > 8) {
      events.push(evt('roasted-the-panel', { players: [n], pop: { [n]: 4 }, state: { panelRoasted: n }, data: { slot: i + 1 } }));
    }
    temp += perf > 8 ? 0.3 : perf < 4 ? -0.3 : 0;
    performances[n] = { perf: Math.round(perf * 100) / 100, moment: perf > 10,
      risk: (Number(s.boldness) || 5) / 10, role: 'standard', team: null,
      parts: { prep: prep[n] || 0, roomTemp },
      detail: { slot: i + 1, slotKind: kind, bits: myBits, roomTemp: Math.round(roomTemp * 100) / 100,
        duds: myBits.filter(b => b < 3).length } };
  });
  return { performances, runwayOverride: null, events,
    scenes: [{ step: 'maxi-main', kind: 'roast-set', data: { order } }] };
}
```

Add `bits: p.bits` to the spine's `ctx3`.

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-chal-roast.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/dr/chal/roast.js js/dr/maxi.js tests/dr-chal-roast.test.js
git commit -m "feat(drag-race): the roast and stand-up — slot draft, three bits, room temperature"
```

---

### Task 10: The Talent Show — she picks the act she can actually do

**Files:**
- Rewrite: `js/dr/chal/talent-show.js`
- Test: `tests/dr-chal-talent.test.js`

**Interfaces:**
- Produces:
  - `TALENTS = [{ id, name, blend, risk }]` — `live-vocal` (singing .8, acting .2, risk .8), `comedy-set` (comedy .8, acting .2, .6), `dance-number` (dance .9, lipsync .1, .4), `burlesque` (dance .5, runway .5, .5), `lip-sync-stunt` (lipsync .7, dance .3, .9), `quick-change` (design .5, runway .5, .7), `character-monologue` (acting .8, comedy .2, .5), `aerial` (dance .6, runway .4, 1.0).
  - `chooseTalent(player, rng) → talent` — the highest-scoring talent by her own blend, with a `boldness`-scaled chance of picking the riskier one instead (that is the "she went for it" beat).
  - `perform(ctx)` — score is her talent's blend times `1 + risk*0.25` on success and `1 - risk*0.35` on failure, where failure chance is `0.15 + risk*0.2 - craft/40`. Events: `stunt-landed` (popularity `+3`), `stunt-failed` (`−2`), `wrong-talent` (a queen whose chosen talent's craft is below `4` — she picked something she cannot do; popularity `−2`).
  - The talent show is also the **premiere** for `drPremiere: 'talent-show'` and the performance round of the `perform-then-lipsync` finale, so `perform` must work with as few as two queens.

- [ ] **Step 1: Write the failing test**

```js
// tests/dr-chal-talent.test.js
import { describe, expect, it } from 'vitest';
import { TALENTS, chooseTalent } from '../js/dr/chal/talent-show.js';
import { runMaxi } from '../js/dr/maxi.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}, over = {}) => ({ name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag }, ...over });
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot'];
function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)]))) {
  return { living: Object.keys(players), players, maxi: maxiById('talent-show'), rng: rngFor(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {} },
    bond: () => 0, addBond: () => {}, popDelta: () => {}, miniWinner: null, cfg: {} };
}

describe('talents', () => {
  it('are eight acts with blends over real craft stats', () => {
    expect(TALENTS.length).toBeGreaterThanOrEqual(8);
    const CRAFT = ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing'];
    for (const t of TALENTS) {
      expect(Math.abs(Object.values(t.blend).reduce((a, b) => a + b, 0) - 1)).toBeLessThan(1e-9);
      for (const k of Object.keys(t.blend)) expect(CRAFT).toContain(k);
      expect(t.risk).toBeGreaterThan(0);
    }
  });
});

describe('chooseTalent', () => {
  it('a singer sings and a dancer dances', () => {
    expect(chooseTalent(mk('S', { singing: 10, dance: 2, comedy: 2, lipsync: 2, runway: 2, design: 2, acting: 2 }), rngFor(1)).id).toBe('live-vocal');
    expect(chooseTalent(mk('D', { dance: 10, singing: 2, comedy: 2, lipsync: 2, runway: 2, design: 2, acting: 2 }), rngFor(1)).id).toBe('dance-number');
  });
  it('a bold queen sometimes reaches for the riskier act', () => {
    const p = mk('B', { singing: 8, dance: 8, lipsync: 8 }, { stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), boldness: 10 } });
    const ids = new Set(Array.from({ length: 60 }, (_, i) => chooseTalent(p, rngFor(i)).id));
    expect(ids.size).toBeGreaterThan(1);
  });
});

describe('the talent show', () => {
  it('records the act and whether it landed', () => {
    const out = runMaxi(ctx());
    for (const n of NAMES) {
      expect(out.performances[n].detail.talent).toBeTruthy();
      expect(typeof out.performances[n].detail.landed).toBe('boolean');
    }
  });
  it('a stunt landing pays and failing costs', () => {
    const has = type => { for (let i = 0; i < 60; i++) { const e = runMaxi(ctx(i)).events.find(x => x.type === type); if (e) return e; } return null; };
    expect(has('stunt-landed').pop).toBeTruthy();
    expect(Object.values(has('stunt-failed').pop)[0]).toBeLessThan(0);
  });
  it('picking an act you cannot do is its own note', () => {
    const bad = Object.fromEntries(NAMES.map(n => [n, mk(n, { acting: 2, comedy: 2, dance: 2, design: 2, runway: 2, lipsync: 2, singing: 2 })]));
    let seen = false;
    for (let i = 0; i < 30 && !seen; i++) seen = runMaxi(ctx(i, bad)).events.some(e => e.type === 'wrong-talent');
    expect(seen).toBe(true);
  });
  it('works with two queens, for the finale', () => {
    const two = { Ada: mk('Ada'), Bee: mk('Bee') };
    expect(Object.keys(runMaxi(ctx(1, two)).performances).length).toBe(2);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npx vitest run tests/dr-chal-talent.test.js`
Expected: FAIL — `TALENTS` not exported.

- [ ] **Step 3: Implement**

```js
// js/dr/chal/talent-show.js — the act is hers to choose, and that is the test
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { blendScore, noise } from '../perform.js';
import { evt } from './_generic.js';

export const TALENTS = [
  { id: 'live-vocal', name: 'A live vocal', blend: { singing: 0.8, acting: 0.2 }, risk: 0.8 },
  { id: 'comedy-set', name: 'A comedy set', blend: { comedy: 0.8, acting: 0.2 }, risk: 0.6 },
  { id: 'dance-number', name: 'A dance number', blend: { dance: 0.9, lipsync: 0.1 }, risk: 0.4 },
  { id: 'burlesque', name: 'A burlesque routine', blend: { dance: 0.5, runway: 0.5 }, risk: 0.5 },
  { id: 'lip-sync-stunt', name: 'A lip sync with a stunt', blend: { lipsync: 0.7, dance: 0.3 }, risk: 0.9 },
  { id: 'quick-change', name: 'A quick-change reveal', blend: { design: 0.5, runway: 0.5 }, risk: 0.7 },
  { id: 'character-monologue', name: 'A character monologue', blend: { acting: 0.8, comedy: 0.2 }, risk: 0.5 },
  { id: 'aerial', name: 'An aerial routine', blend: { dance: 0.6, runway: 0.4 }, risk: 1.0 },
];

/** What she is best at — unless she is bold enough to reach past it. */
export function chooseTalent(player, rng = Math.random) {
  const d = dragOf(player);
  const ranked = [...TALENTS].map(t => ({ t, s: blendScore(d, t.blend) })).sort((a, b) => b.s - a.s);
  const bold = (Number(player.stats?.boldness) || 5) / 10;
  if (ranked.length > 1 && rng() < bold * 0.35) {
    // She reaches: the best act among those riskier than her safest choice.
    const riskier = ranked.slice(1, 4).filter(x => x.t.risk > ranked[0].t.risk);
    if (riskier.length) return riskier[0].t;
  }
  return ranked[0].t;
}

export function assign(ctx) {
  const { living, players, rng } = ctx;
  const picks = {};
  for (const n of living) picks[n] = { choice: chooseTalent(players[n], rng).id, penalty: 0 };
  return { roles: Object.fromEntries(living.map(n => [n, 'standard'])), teams: [], order: [...living], picks, events: [],
    scenes: [{ step: 'choice', kind: 'talent-picks', data: { picks } }] };
}

export function prepare(ctx) {
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  return { prep: w.prep, events: [...r.events, ...w.events],
    scenes: [...r.scenes, { step: 'prep', kind: 'rehearsal', data: { notes: w.notes } }] };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng } = ctx;
  const performances = {}, events = [];
  for (const n of living) {
    const d = dragOf(players[n]);
    const talent = TALENTS.find(t => t.id === assignment.picks[n]?.choice) || TALENTS[2];
    const craft = blendScore(d, talent.blend);
    const failChance = Math.max(0.02, 0.15 + talent.risk * 0.2 - craft / 40);
    const landed = rng() > failChance;
    const perf = craft * (landed ? 1 + talent.risk * 0.25 : 1 - talent.risk * 0.35)
      + (prep[n] || 0) + noise(rng, 2.0);
    if (landed && talent.risk >= 0.7) {
      events.push(evt('stunt-landed', { players: [n], pop: { [n]: 3 }, data: { talent: talent.id } }));
    } else if (!landed) {
      events.push(evt('stunt-failed', { players: [n], pop: { [n]: -2 }, data: { talent: talent.id } }));
    }
    if (craft < 4) {
      events.push(evt('wrong-talent', { players: [n], pop: { [n]: -2 }, data: { talent: talent.id, craft: Math.round(craft * 10) / 10 } }));
    }
    performances[n] = { perf: Math.round(perf * 100) / 100, moment: landed && perf > 10,
      risk: talent.risk, role: 'standard', team: null, parts: { prep: prep[n] || 0, craft },
      detail: { talent: talent.name, talentId: talent.id, landed } };
  }
  return { performances, runwayOverride: null, events,
    scenes: [{ step: 'maxi-main', kind: 'talent-acts', data: {} }] };
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/dr-chal-talent.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/dr/chal/talent-show.js tests/dr-chal-talent.test.js
git commit -m "feat(drag-race): the talent show — eight acts, chosen from her own stats, with a risk she can miss"
```

---

### Task 11: LaLaPaRUza and the design family

**Files:**
- Rewrite: `js/dr/chal/lalaparuza.js`, `js/dr/chal/design.js`
- Test: `tests/dr-chal-lalaparuza.test.js`, `tests/dr-chal-design.test.js`

**Interfaces:**
- `lalaparuza.js`:
  - `assign(ctx)` — the mini winner chooses her opponent first; `contestFor` over opponent names, so being picked is a thing that happens to you.
  - `perform(ctx)` — a losers' bracket: each round, unbeaten queens pair off and lip sync (`lipsyncScore` from Plan 1 Task 9 with a random song); losers drop a tier. Runs until one queen is unbeaten. `perf` is `5 + wins*1.6 - losses*0.9`. Events: `assassin` (three wins; popularity `+4`), `picked-on` (a queen chosen first by two different queens; popularity `+1`, bond `−1` with each chooser).
- `design.js` (serving `design`, `acting`, `commercial`, `improv`):
  - `MATERIALS` — 14 unconventional material sets `{ id, name, difficulty }`.
  - `assign(ctx)` — `contestFor` over the material sets for `design`; for `acting`/`commercial`/`improv` a `draftRoles` over parts and a pairing.
  - `prepare(ctx)` — `prepareRoom` + `walkthrough`, then the build/rehearsal: `blendScore * 0.8 - difficulty*0.3 + prep`, with a `glue-gun` event (a burn: `−0.5`, popularity `+1` for carrying on) at `rng() < 0.15`.
  - `perform(ctx)` — the catalogue blend as usual, plus for `design` a `runwayOverride` of one walk that IS the built look (`sewn: true`).

- [ ] **Step 1: Write the failing tests**

```js
// tests/dr-chal-lalaparuza.test.js
import { describe, expect, it } from 'vitest';
import { runMaxi } from '../js/dr/maxi.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}) => ({ name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag } });
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay'];
function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)]))) {
  return { living: Object.keys(players), players, maxi: maxiById('lipsync-challenge'), rng: rngFor(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {},
      lipsyncRecord: Object.fromEntries(Object.keys(players).map(n => [n, []])) },
    bond: () => 0, addBond: () => {}, popDelta: () => {}, miniWinner: 'Ada', cfg: {} };
}

describe('lalaparuza', () => {
  it('runs a bracket to exactly one unbeaten queen', () => {
    const out = runMaxi(ctx());
    const unbeaten = Object.entries(out.performances).filter(([, p]) => p.detail.losses === 0);
    expect(unbeaten.length).toBe(1);
    expect(out.performances[unbeaten[0][0]].perf).toBe(Math.max(...Object.values(out.performances).map(p => p.perf)));
  });
  it('records every duel with its song', () => {
    const out = runMaxi(ctx(2));
    const duels = out.scenes.find(s => s.kind === 'bracket').data.duels;
    expect(duels.length).toBeGreaterThanOrEqual(3);
    for (const d of duels) { expect(d.song).toBeTruthy(); expect([d.a, d.b]).toContain(d.winner); }
  });
  it('a lip sync assassin is paid for it', () => {
    const p = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Eve' ? { lipsync: 10, dance: 10 } : { lipsync: 2, dance: 2 })]));
    let e = null;
    for (let i = 0; i < 40 && !e; i++) e = runMaxi(ctx(i, p)).events.find(x => x.type === 'assassin');
    expect(e).toBeTruthy();
    expect(Object.values(e.pop)[0]).toBeGreaterThan(0);
  });
});
```

```js
// tests/dr-chal-design.test.js
import { describe, expect, it } from 'vitest';
import { MATERIALS } from '../js/dr/chal/design.js';
import { runMaxi } from '../js/dr/maxi.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}) => ({ name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag } });
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot'];
function ctx(maxiId, seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)]))) {
  return { living: Object.keys(players), players, maxi: maxiById(maxiId), rng: rngFor(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {} },
    bond: () => 0, addBond: () => {}, popDelta: () => {}, miniWinner: 'Ada', cfg: {} };
}

describe('materials', () => {
  it('are fourteen graded sets', () => {
    expect(MATERIALS.length).toBeGreaterThanOrEqual(14);
    for (const m of MATERIALS) { expect(m.difficulty).toBeGreaterThanOrEqual(1); expect(m.difficulty).toBeLessThanOrEqual(5); }
  });
});

describe('the design family', () => {
  it('a design week walks the look it built', () => {
    const out = runMaxi(ctx('design'));
    expect(out.runwayOverride.walks.length).toBe(1);
    expect(out.runwayOverride.walks[0].sewn).toBe(true);
    expect(out.performances.Ada.detail.material).toBeTruthy();
  });
  it('acting, commercial and improv all run and pair people up', () => {
    for (const id of ['acting', 'commercial', 'improv']) {
      const out = runMaxi(ctx(id, 3));
      expect(Object.keys(out.performances).length).toBe(4);
      expect(out.assignment.teams.length).toBeGreaterThan(0);
    }
  });
  it('the glue gun bites, and carrying on is worth something', () => {
    let e = null;
    for (let i = 0; i < 60 && !e; i++) e = runMaxi(ctx('design', i)).events.find(x => x.type === 'glue-gun');
    expect(e).toBeTruthy();
    expect(Object.values(e.pop)[0]).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run tests/dr-chal-lalaparuza.test.js tests/dr-chal-design.test.js`
Expected: FAIL — both modules are still `export * from './_generic.js'`.

- [ ] **Step 3: Implement `js/dr/chal/lalaparuza.js`**

```js
// js/dr/chal/lalaparuza.js — a bracket, and being chosen is a thing done to you
import { pickOrder, contestFor } from '../assign.js';
import { prepareRoom } from '../prep.js';
import { lipsyncScore } from '../lipsync.js';
import { SONGS } from '../data/songs.js';
import { evt } from './_generic.js';

export function assign(ctx) {
  const { living, players, rng, miniWinner, cfg } = ctx;
  const order = pickOrder({ living, miniWinner, mini: cfg.mini || { buys: 'pick-order' }, rng });
  // Everybody names who they would rather face: the weakest lip syncer they can see.
  const choices = Object.fromEntries(order.map(n => [n,
    order.filter(o => o !== n).sort((a, b) => (players[a].drag?.lipsync || 5) - (players[b].drag?.lipsync || 5))]));
  const { picks, events } = contestFor({ order, choices, players, rng });
  const chosenCount = {};
  for (const n of order) chosenCount[picks[n].choice] = (chosenCount[picks[n].choice] || 0) + 1;
  for (const [name, count] of Object.entries(chosenCount)) {
    if (count >= 2 && living.includes(name)) {
      const choosers = order.filter(n => picks[n].choice === name);
      events.push(evt('picked-on', { players: [name, ...choosers],
        bond: choosers.map(c => [name, c, -1]), pop: { [name]: 1 }, data: { count } }));
    }
  }
  return { roles: Object.fromEntries(order.map(n => [n, 'standard'])), teams: [], order, picks, events,
    scenes: [{ step: 'choice', kind: 'bracket-picks', data: { picks } }] };
}

export function prepare(ctx) {
  const r = prepareRoom(ctx);
  return { prep: r.prep, events: r.events, scenes: r.scenes };
}

export function perform(ctx) {
  const { living, players, prep, rng, state } = ctx;
  const wins = Object.fromEntries(living.map(n => [n, 0]));
  const losses = Object.fromEntries(living.map(n => [n, 0]));
  const duels = [], events = [];
  let alive = [...living];
  let guard = 0;
  while (alive.length > 1 && guard++ < 20) {
    const next = [];
    for (let i = 0; i + 1 < alive.length; i += 2) {
      const a = alive[i], b = alive[i + 1];
      const song = SONGS[Math.floor(rng() * SONGS.length)];
      const sa = lipsyncScore({ player: players[a], song, lipsyncRecord: state.lipsyncRecord?.[a] || [], rng });
      const sb = lipsyncScore({ player: players[b], song, lipsyncRecord: state.lipsyncRecord?.[b] || [], rng });
      const winner = sa.score + (prep[a] || 0) >= sb.score + (prep[b] || 0) ? a : b;
      const loser = winner === a ? b : a;
      wins[winner]++; losses[loser]++;
      duels.push({ a, b, song: song.title, scores: { [a]: sa.score, [b]: sb.score }, winner, loser });
      next.push(winner);
    }
    if (alive.length % 2) next.push(alive[alive.length - 1]);   // a bye
    alive = next;
  }
  const performances = {};
  for (const n of living) {
    if (wins[n] >= 3) events.push(evt('assassin', { players: [n], pop: { [n]: 4 },
      state: { assassin: n }, data: { wins: wins[n] } }));
    performances[n] = { perf: Math.round((5 + wins[n] * 1.6 - losses[n] * 0.9) * 100) / 100,
      moment: wins[n] >= 3, risk: 0.6, role: 'standard', team: null,
      parts: { prep: prep[n] || 0 }, detail: { wins: wins[n], losses: losses[n] } };
  }
  return { performances, runwayOverride: null, events,
    scenes: [{ step: 'maxi-main', kind: 'bracket', data: { duels } }] };
}
```

- [ ] **Step 4: Implement `js/dr/chal/design.js`**

```js
// js/dr/chal/design.js — build it, or act it: the shape is the same
// Serves design, acting, commercial and improv.
import { pickOrder, contestFor, draftRoles } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { blendScore, noise, ROLE_RANGES } from '../perform.js';
import { evt } from './_generic.js';

export const MATERIALS = [
  { id: 'newspaper', name: 'Newspaper and tape', difficulty: 3 },
  { id: 'garden', name: 'Garden centre', difficulty: 4 },
  { id: 'kitchen', name: 'Kitchen supplies', difficulty: 4 },
  { id: 'hardware', name: 'Hardware store', difficulty: 5 },
  { id: 'toy-box', name: 'The toy box', difficulty: 3 },
  { id: 'party-shop', name: 'Party shop', difficulty: 2 },
  { id: 'pet-store', name: 'Pet store', difficulty: 5 },
  { id: 'stationery', name: 'Stationery cupboard', difficulty: 3 },
  { id: 'camping', name: 'Camping gear', difficulty: 4 },
  { id: 'bathroom', name: 'Bathroom cabinet', difficulty: 5 },
  { id: 'sports-kit', name: 'Sports kit', difficulty: 3 },
  { id: 'curtains', name: 'Curtains and upholstery', difficulty: 2 },
  { id: 'car-parts', name: 'Car parts', difficulty: 5 },
  { id: 'sweet-shop', name: 'Sweet shop', difficulty: 3 },
];

const IS_DESIGN = id => id === 'design';

export function assign(ctx) {
  const { living, players, rng, miniWinner, cfg, maxi } = ctx;
  const order = pickOrder({ living, miniWinner, mini: cfg.mini || { buys: 'pick-order' }, rng });
  if (IS_DESIGN(maxi.id)) {
    const choices = Object.fromEntries(order.map(n => {
      const d = dragOf(players[n]);
      return [n, [...MATERIALS].sort((a, b) => (d.design - a.difficulty) - (d.design - b.difficulty) || rng() - 0.5).map(m => m.id)];
    }));
    const { picks, events } = contestFor({ order, choices, players, rng });
    return { roles: Object.fromEntries(order.map(n => [n, 'standard'])), teams: [], order, picks, events,
      scenes: [{ step: 'choice', kind: 'material-picks', data: { picks } }] };
  }
  // acting / commercial / improv: pairs or casts, with parts drafted.
  const teams = [];
  if (maxi.format === 'pairs') { for (let i = 0; i < order.length; i += 2) teams.push(order.slice(i, i + 2)); }
  else { const half = Math.ceil(order.length / 2); teams.push(order.slice(0, half), order.slice(half)); }
  const roles = {}, picks = {};
  for (const t of teams) {
    const d = draftRoles({ order: t, roleNames: ['lead', 'featured', 'standard', 'standard', 'ensemble'].slice(0, t.length), rng, players });
    Object.assign(roles, d.roles);
    for (const p of d.picks) picks[p.name] = { choice: p.role, penalty: 0, ducked: p.ducked };
  }
  return { roles, teams, order, picks, events: [],
    scenes: [{ step: 'choice', kind: 'parts-draft', data: { teams, roles } }] };
}

export function prepare(ctx) {
  const { living, players, assignment, rng, maxi } = ctx;
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];
  const build = {};
  for (const n of living) {
    const d = dragOf(players[n]);
    const mat = IS_DESIGN(maxi.id) ? MATERIALS.find(m => m.id === assignment.picks[n]?.choice) : null;
    const q = blendScore(d, maxi.blend) * 0.8 - (mat ? mat.difficulty * 0.3 : 0) + (w.prep[n] || 0) + noise(rng, 1.5);
    build[n] = { quality: Math.round(q * 100) / 100, material: mat ? mat.name : null };
    if (rng() < 0.15) {
      w.prep[n] = (w.prep[n] || 0) - 0.5;
      events.push(evt('glue-gun', { players: [n], pop: { [n]: 1 }, data: { material: build[n].material } }));
    }
  }
  return { prep: w.prep, events, build,
    scenes: [...r.scenes, { step: 'prep', kind: IS_DESIGN(maxi.id) ? 'workroom-build' : 'rehearsal', data: { build } }] };
}

export function perform(ctx) {
  const { living, players, maxi, assignment, prep, rng, bond, build } = ctx;
  const performances = {}, events = [];
  for (const n of living) {
    const d = dragOf(players[n]);
    const range = ROLE_RANGES[assignment.roles[n]] ?? 1;
    const team = (assignment.teams || []).find(t => t.includes(n)) || null;
    const chem = team && team.length > 1
      ? team.filter(o => o !== n).reduce((s, o) => s + bond(n, o), 0) / (team.length - 1) * 0.12 : 0;
    const base = blendScore(d, maxi.blend);
    const perf = (base - 5) * range + 5 + (prep[n] || 0) + chem
      - (assignment.picks[n]?.penalty || 0) + noise(rng, 2.3 * range);
    performances[n] = { perf: Math.round(perf * 100) / 100, moment: perf > 11,
      risk: (Number(players[n].stats?.boldness) || 5) / 10,
      role: assignment.roles[n], team: team ? assignment.teams.indexOf(team) : null,
      parts: { prep: prep[n] || 0, chem },
      detail: { material: build?.[n]?.material || null, buildQuality: build?.[n]?.quality ?? null } };
  }
  return { performances, events,
    runwayOverride: IS_DESIGN(maxi.id)
      ? { walks: [{ category: 'the look you built', sewn: true, categoryStyles: ['art', 'fashion'] }] } : null,
    scenes: [{ step: maxi.stage === 'pre' ? 'maxi-pre' : 'maxi-main', kind: 'design-performance', data: {} }] };
}
```

Add `build: p.build` to the spine's `ctx3`.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/dr-chal-lalaparuza.test.js tests/dr-chal-design.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/dr/chal/lalaparuza.js js/dr/chal/design.js js/dr/maxi.js tests/dr-chal-lalaparuza.test.js tests/dr-chal-design.test.js
git commit -m "feat(drag-race): the bracket and the design family — materials, parts, the glue gun"
```

---

### Task 12: The consequence audit and the balance measurements

**Files:**
- Create: `tests/dr-consequences.test.js`
- Create: `tests/dr-balance.audit.test.js` (an AUDIT: add it to `vitest.slow.js`, not to `npm test`)
- Modify: `vitest.slow.js`
- Test: both of the above

**Interfaces:** none new. This task proves the plan.

- [ ] **Step 1: Write the consequence sweep**

```js
// tests/dr-consequences.test.js
//
// THE RULE THIS ENFORCES is the project's oldest and most-broken one: an event
// that changes nothing is decoration. Every maxi type is played here and every
// event it can fire is checked, so a module added later cannot quietly ship a
// cosmetic beat.
import { describe, expect, it } from 'vitest';
import { MAXI_TYPES } from '../js/dr/data/challenges.js';
import { runMaxi, applyEvents } from '../js/dr/maxi.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'mastermind', 'goat', 'schemer', 'loyal-soldier'];
function cast(n, seed) {
  const rng = rngFor(seed);
  const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: ARCH[i % ARCH.length], age: 20 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
function ctxFor(maxi, seed) {
  const c = cast(Math.max(maxi.minCast, 8), seed);
  const bonds = {};
  for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) {
    bonds[[c[i].name, c[j].name].sort().join('|')] = Math.round((rngFor(seed + i * 31 + j)() - 0.5) * 16);
  }
  return { living: c.map(p => p.name), players: Object.fromEntries(c.map(p => [p.name, p])),
    maxi, rng: rngFor(seed),
    state: { record: Object.fromEntries(c.map(p => [p.name, []])), flags: {}, out: ['Gone', 'Past'],
      lipsyncRecord: Object.fromEntries(c.map(p => [p.name, []])) },
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0,
    addBond: (a, b, d) => { const k = [a, b].sort().join('|'); bonds[k] = (bonds[k] || 0) + d; },
    popDelta: () => {}, miniWinner: c[0].name, cfg: {} };
}

describe('every event, on every maxi type, changes something', () => {
  for (const maxi of MAXI_TYPES) {
    it(`${maxi.id}`, () => {
      const seen = new Set();
      for (let s = 0; s < 25; s++) {
        const ctx = ctxFor(maxi, s);
        const out = runMaxi(ctx);
        expect(Object.keys(out.performances).length).toBe(ctx.living.length);
        for (const n of ctx.living) expect(Number.isFinite(out.performances[n].perf), `${maxi.id}/${n}`).toBe(true);
        for (const e of out.events) {
          seen.add(e.type);
          const changes = e.bond.length + Object.keys(e.pop).length + Object.keys(e.state).length;
          expect(changes, `${maxi.id}: event "${e.type}" is cosmetic`).toBeGreaterThan(0);
          expect(Array.isArray(e.players) && e.players.length, `${maxi.id}: "${e.type}" names nobody`).toBeTruthy();
        }
        expect(() => applyEvents(out.events, ctx)).not.toThrow();
      }
      // A type whose 25 seeds fired nothing at all has no social layer.
      expect(seen.size, `${maxi.id} fired no events in 25 runs`).toBeGreaterThan(0);
    });
  }
});

describe('archetype law', () => {
  it('no nice archetype ever sabotages, steals, dumps or hogs', () => {
    const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
    const BAD = new Set(['sabotage', 'stole-a-bit', 'dump', 'spotlight-hog']);
    for (const maxi of MAXI_TYPES) {
      for (let s = 0; s < 12; s++) {
        const ctx = ctxFor(maxi, s + 500);
        for (const e of runMaxi(ctx).events) {
          if (!BAD.has(e.type)) continue;
          const actor = ctx.players[e.players[0]];
          expect(NICE.has(actor.archetype), `${maxi.id}: ${actor.archetype} fired ${e.type}`).toBe(false);
        }
      }
    }
  });
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run tests/dr-consequences.test.js`
Expected: PASS. A failure names the module and the event: fix the module, never the sweep.

- [ ] **Step 3: Write the balance audit**

```js
// tests/dr-balance.audit.test.js
//
// AN AUDIT, not a guard: it plays 60 seasons and prints a table. Named in
// vitest.slow.js so `npm test` does not run it; run it deliberately with
//   npx vitest run tests/dr-balance.audit.test.js
// after changing any blend, weight or noise amount.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { MAXI_TYPES } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'mastermind', 'goat', 'schemer', 'loyal-soldier'];
function cast(n, seed) {
  const rng = rngFor(seed);
  const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: ARCH[i % ARCH.length], age: 20 + (i % 20),
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
}
const craftMean = p => Object.values(p.drag).reduce((a, b) => a + b, 0) / 7;

describe('balance over 60 seasons', () => {
  const N = 60;
  const seasons = Array.from({ length: N }, (_, s) => {
    const c = cast(13, 1000 + s);
    return { c, out: playDragSeason({ cast: c, seed: s, config: { drDoubleShantay: true } }) };
  });

  it('the best craft line wins between 30 and 70 percent (spec target 40-60 at Plan 6)', () => {
    const hits = seasons.filter(({ c, out }) =>
      out.winner === [...c].sort((a, b) => craftMean(b) - craftMean(a))[0].name).length;
    console.log(`best-craft winner: ${(hits / N * 100).toFixed(1)}%`);
    expect(hits / N).toBeGreaterThan(0.30);
    expect(hits / N).toBeLessThan(0.70);
  });

  it('no single maxi type decides the season on its own', () => {
    // A type whose winner takes the crown far more often than chance is a
    // type that is worth too much: report the table and fail past 3x.
    const byType = {};
    for (const { out } of seasons) {
      for (const row of out.rows) {
        const id = row.dr?.challenge?.id; if (!id || id === 'finale') continue;
        const w = row.dr.call.win[0]; if (!w) continue;
        byType[id] ||= { wins: 0, crowned: 0 };
        byType[id].wins++;
        if (w === out.winner) byType[id].crowned++;
      }
    }
    const base = Object.values(byType).reduce((s, x) => s + x.crowned, 0)
      / Math.max(1, Object.values(byType).reduce((s, x) => s + x.wins, 0));
    for (const [id, x] of Object.entries(byType).sort((a, b) => b[1].wins - a[1].wins)) {
      console.log(`${id.padEnd(20)} wins ${String(x.wins).padStart(3)}  → crown ${(x.crowned / x.wins * 100).toFixed(0)}%`);
      if (x.wins >= 20) expect(x.crowned / x.wins, `${id} is worth too much`).toBeLessThan(base * 3);
    }
  });

  it('every maxi type is reachable and produces a spread', () => {
    const seen = new Set();
    for (const { out } of seasons) for (const row of out.rows) if (row.dr?.challenge?.id) seen.add(row.dr.challenge.id);
    const missing = MAXI_TYPES.map(m => m.id).filter(id => !seen.has(id));
    console.log(`types never scheduled in ${N} seasons: ${missing.join(', ') || 'none'}`);
    expect(missing.length, `never scheduled: ${missing.join(', ')}`).toBeLessThanOrEqual(2);
    for (const { out } of seasons.slice(0, 10)) {
      for (const row of out.rows) {
        if (!row.dr?.performances) continue;
        const vals = Object.values(row.dr.performances).map(p => p.perf);
        expect(Math.max(...vals) - Math.min(...vals), `${row.dr.challenge.id} produced no spread`).toBeGreaterThan(1);
      }
    }
  });

  it('help, sabotage and the walkthrough all actually fire', () => {
    const counts = {};
    for (const { out } of seasons) for (const row of out.rows) for (const e of row.dr?.events || []) counts[e.type] = (counts[e.type] || 0) + 1;
    console.log(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join('\n'));
    for (const must of ['help', 'sabotage', 'walkthrough']) {
      expect(counts[must], `${must} never fired in ${N} seasons`).toBeGreaterThan(0);
    }
  });
});
```

For the last assertion `runDragWeek` must keep the events on the row: add `events: M.events` to `row.dr` in `js/dr/week.js`.

- [ ] **Step 4: Register the audit as slow**

Add `'tests/dr-balance.audit.test.js'` to `SLOW_GLOBS` in `vitest.slow.js`, with a one-line comment saying it plays 60 seasons. Verify it is collected by the slow config and not by the default one:

```
npx vitest list --config vitest.sim.config.js | grep dr-balance
npx vitest list | grep dr-balance || echo "correctly excluded from npm test"
```

- [ ] **Step 5: Run everything this plan touched**

Run:
```
npx vitest run tests/dr-maxi-spine.test.js tests/dr-assign.test.js tests/dr-prep.test.js tests/dr-chal-snatch.test.js tests/dr-chal-ball.test.js tests/dr-chal-girl-group.test.js tests/dr-chal-rusical.test.js tests/dr-chal-makeover.test.js tests/dr-chal-roast.test.js tests/dr-chal-talent.test.js tests/dr-chal-lalaparuza.test.js tests/dr-chal-design.test.js tests/dr-consequences.test.js tests/dr-week.test.js tests/dr-season.test.js tests/dr-run.test.js
npx vitest run tests/dr-balance.audit.test.js
```
Expected: all PASS, and READ the audit's printed tables. Anything that looks wrong in them is a real finding: this project's prose and balance bugs have all been found by reading output, never by an assertion.

- [ ] **Step 6: Commit**

```bash
git add tests/dr-consequences.test.js tests/dr-balance.audit.test.js vitest.slow.js js/dr/week.js
git commit -m "test(drag-race): consequence sweep over all 18 types, and the 60-season balance audit"
git push
```

---

## Self-review against the spec

- §8.1 spine and per-type files: Task 1. §8.2 formats, assignment, roles, conflicts: Tasks 2, 4–11. §8.3 preparation with help, sabotage and the walkthrough: Task 3. §8.4 consequences: enforced by `applyEvents` (Task 1) and swept by Task 12. §8.5 the catalogue's named mechanisms: Snatch Game (4), Ball (5), girl group / rumix / music video (6), Rusical (7), makeover (8), roast / stand-up (9), talent show (10), LaLaPaRUza and the design family (11); the remaining types — choreography, photoshoot, runway-challenge, singing — run the generic hooks with their own blends, which is the correct model for a solo craft check.
- The user's two corrections are both honoured: roles scale the spread through `ROLE_RANGES` and never cap (Tasks 2, 6, 7, 9), and the runway follows the challenge through `runwayOverride` (Tasks 5, 8, 11).
- Deferred: prose for every scene `kind` (Plan 3), storylines feeding `storylineNeed` (Plan 3), Untucked (Plan 3), VP screens (Plan 5).
- Type consistency: every module returns `performances[name] = { perf, moment, risk, role, team, parts, detail }`; every event is `{ type, players, bond, pop, state, data }`; every scene is `{ step, kind, data }` with `step` drawn from `SCENE_STEPS`.
