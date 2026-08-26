# Coaches Twist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Total Drama twist in which each tribe carries one to three coaches — franchise winners and finalists who train, advise and manipulate but never compete — who can be voted out, and who become full players if they survive to the merge.

**Architecture:** Coaches live in `players` (so `pStats`, `pronouns`, archetype and bonds resolve) but stay out of `gs.activePlayers` until promotion. That single split is the twist: 135 modules read `gs.activePlayers` to decide eligibility for challenges, ballots, immunity, jury and placements, and a coach does none of those things. Promotion is one push into that array. Everything else is a small number of deliberate wirings: the training bank, the ballot's target list, and the presentation.

**Tech Stack:** ES modules, no build step. Vitest for tests (`npx vitest run tests/<file>`). jsdom for anything touching the DOM.

**Spec:** `docs/superpowers/specs/2026-08-26-coaches-twist-design.md`

## Global Constraints

- **Valid stats, the only nine:** `physical`, `endurance`, `mental`, `social`, `strategic`, `loyalty`, `boldness`, `intuition`, `temperament`. Never invent one.
- **Valid archetypes, the only fifteen:** `mastermind`, `schemer`, `hothead`, `challenge-beast`, `social-butterfly`, `loyal-soldier`, `wildcard`, `chaos-agent`, `floater`, `underdog`, `hero`, `villain`, `goat`, `perceptive-player`, `showmancer`.
- **Proportional always.** `stat * factor`, never `if (stat >= X)` for gameplay. Thresholds only for choosing narrative text. Archetype supplies a bias multiplier; stats do the work.
- **Coaches never cast a ballot.** They may be voted for. Anything that reaches into a vote is inert in their hands.
- **A coach's power always targets somebody else.** Self-directed advantages are inert until promotion.
- **Vocabulary comes from the show registry** (`js/shows.js`, `total-drama`): *contestants*, *voted out*, *Episode*, *challenge*. No `nominated`, `evicted`, `HOH` or `veto` may appear in any generated sentence.
- **Camp events must have consequences** and carry `players: []` plus `badgeText` / `badgeClass`.
- **Training cap:** 3.0 total per contestant across all stats and all coaches, matching `RI_TRAINING_CAP` in `js/rescue-island.js:473`.
- **Noise floor:** every stat check uses `noise(2.5)` minimum.
- **Never `git add -A`.** Stage the files each task names. Another session edits this repo concurrently.

## File Structure

| file | responsibility |
|---|---|
| `js/coaches.js` (new) | state, selectors, training bank, revocation. Near-leaf: imports `core.js`, `players.js`, `bonds.js`, `fame.js`, `shows.js` only. |
| `js/coach-agenda.js` (new) | the proportional maths — awe, agenda mix, session targeting. Pure functions, no `gs` writes, so it is testable without a game. |
| `js/coach-episode.js` (new) | the per-episode coaching block: run sessions, apply bonds, emit fallout. Owns the `gs` mutations. |
| `js/vp-coaches.js` (new) | the Coaches' Board VP screen and its reveal handlers. |
| `js/voting.js` | +`extraTargets` parameter so coaches are candidates without being voters. |
| `js/core.js` | TWIST_CATALOG entry. |
| `js/twists.js` | `engineType` → `ep.isCoaches` flag. |
| `js/episode.js` | dispatch, elimination hook, promotion at merge, episode history. |
| `js/vp-screens.js` | register the board's screens. |
| `js/text-backlog.js` | retranscription before `_textCampPost`. |
| `js/main.js` | module spread. |
| `js/run-ui.js` | timeline badge. |

Split three ways because the pure maths (`coach-agenda.js`) is the part worth testing exhaustively and the part most likely to need tuning; keeping it free of `gs` means its tests need no game state at all.

---

### Task 1: Coach state and selectors

**Files:**
- Create: `js/coaches.js`
- Test: `tests/coaches-state.test.js`

**Interfaces:**
- Consumes: `gs`, `players` from `js/core.js`
- Produces: `isCoach(name) -> boolean`, `coachesOf(tribeName) -> coach[]`, `activeCoaches() -> coach[]`, `addCoach({name, tribe, sessionsPerEp}) -> coach`, `removeCoach(name) -> void`

- [ ] **Step 1: Write the failing test**

```js
// tests/coaches-state.test.js
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, setGs } from '../js/core.js';
import { addCoach, activeCoaches, coachesOf, isCoach, removeCoach } from '../js/coaches.js';

beforeEach(() => { setGs({ activePlayers: ['Bowie', 'Millie'], coaches: [], coachTraining: {} }); });

describe('a coach is a person who is not on the roster', () => {
  it('registers a coach without adding them to activePlayers', () => {
    addCoach({ name: 'Julia', tribe: 'Red' });
    expect(isCoach('Julia')).toBe(true);
    // The whole architecture in one assertion: 135 modules read this list to
    // decide who competes, votes, holds immunity and takes a placement.
    expect(gs.activePlayers).not.toContain('Julia');
  });

  it('does not think a contestant is a coach', () => {
    expect(isCoach('Bowie')).toBe(false);
  });

  it('finds the coaches on one tribe', () => {
    addCoach({ name: 'Julia', tribe: 'Red' });
    addCoach({ name: 'Yul', tribe: 'Blue' });
    expect(coachesOf('Red').map(c => c.name)).toEqual(['Julia']);
  });

  it('drops a coach who has been voted out', () => {
    addCoach({ name: 'Julia', tribe: 'Red' });
    removeCoach('Julia');
    expect(isCoach('Julia')).toBe(false);
    expect(activeCoaches()).toEqual([]);
  });

  it('survives being asked before any coach exists', () => {
    setGs({ activePlayers: [] });
    expect(isCoach('Anybody')).toBe(false);
    expect(activeCoaches()).toEqual([]);
    expect(coachesOf('Red')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/coaches-state.test.js`
Expected: FAIL — cannot resolve `../js/coaches.js`

- [ ] **Step 3: Write `js/coaches.js`**

```js
// Coaches — franchise winners and finalists who train a tribe without playing.
//
// THE ARCHITECTURE IS ONE SPLIT. A coach is in `players`, so pStats, pronouns,
// archetype and romanticCompat all resolve for them. A coach is NOT in
// `gs.activePlayers`, which 135 modules read to decide who competes, votes,
// holds immunity, sits on the jury and takes a placement — none of which a
// coach does. Being outside that array is not a workaround for the twist, it
// IS the twist, and promotion at the merge is one push into it.
import { gs } from './core.js';

/** Every coach still standing. */
export function activeCoaches() {
  return (gs.coaches || []).filter(c => !c.promoted);
}

export function isCoach(name) {
  return activeCoaches().some(c => c.name === name);
}

export function coachRecord(name) {
  return activeCoaches().find(c => c.name === name) || null;
}

export function coachesOf(tribeName) {
  return activeCoaches().filter(c => c.tribe === tribeName);
}

/**
 * Sessions scale with tribe size so somebody is always left out. A budget that
 * covers everyone produces no favouritism, and favouritism is the twist.
 */
export function sessionsFor(tribeSize) {
  return Math.max(1, Math.floor(tribeSize / 3));
}

export function addCoach({ name, tribe, sessionsPerEp = 2 }) {
  if (!gs.coaches) gs.coaches = [];
  const record = { name, tribe, saveCard: 'unused', promoted: false, sessionsPerEp };
  gs.coaches.push(record);
  return record;
}

export function removeCoach(name) {
  if (!gs.coaches) return;
  gs.coaches = gs.coaches.filter(c => c.name !== name);
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/coaches-state.test.js`
Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git add js/coaches.js tests/coaches-state.test.js
git commit -m "coaches: a person in the cast who is not on the roster"
```

---

### Task 2: The training bank

**Files:**
- Modify: `js/coaches.js`
- Test: `tests/coaches-training.test.js`

**Interfaces:**
- Consumes: `isCoach` from Task 1
- Produces: `bankTraining(coach, contestant, stat, amount) -> number` (the amount actually banked after the cap), `trainingBonus(contestant, stat) -> number`, `trainingTotal(contestant) -> number`, `revokeCoachTraining(coach) -> {contestant: {stat: amount}}`

- [ ] **Step 1: Write the failing test**

```js
// tests/coaches-training.test.js
import { beforeEach, describe, expect, it } from 'vitest';
import { setGs } from '../js/core.js';
import { addCoach, bankTraining, revokeCoachTraining, trainingBonus, trainingTotal } from '../js/coaches.js';

beforeEach(() => {
  setGs({ activePlayers: ['Evie'], coaches: [], coachTraining: {} });
  addCoach({ name: 'Julia', tribe: 'Red' });
  addCoach({ name: 'Yul', tribe: 'Red' });
});

describe('training is banked per coach', () => {
  it('sums a contestant’s bonus across every coach who taught them', () => {
    bankTraining('Julia', 'Evie', 'endurance', 1.0);
    bankTraining('Yul', 'Evie', 'endurance', 0.5);
    expect(trainingBonus('Evie', 'endurance')).toBeCloseTo(1.5);
  });

  it('gives back exactly what one coach built, and only that', () => {
    // This is why the store is keyed by coach first: gs.riTraining is keyed by
    // player and cannot answer "what did THIS coach build?", which is the one
    // question voting a coach out has to ask.
    bankTraining('Julia', 'Evie', 'endurance', 1.0);
    bankTraining('Yul', 'Evie', 'endurance', 0.5);
    const lost = revokeCoachTraining('Julia');
    expect(lost).toEqual({ Evie: { endurance: 1.0 } });
    expect(trainingBonus('Evie', 'endurance')).toBeCloseTo(0.5);
  });

  it('caps a contestant at 3.0 across all stats and all coaches', () => {
    bankTraining('Julia', 'Evie', 'endurance', 2.5);
    const banked = bankTraining('Yul', 'Evie', 'mental', 1.5);
    expect(banked, 'only the headroom is taken').toBeCloseTo(0.5);
    expect(trainingTotal('Evie')).toBeCloseTo(3.0);
  });

  it('lets a bad coach do damage past the cap', () => {
    // The cap bounds help, not harm. A temperament-2 coach teaching temperament
    // must be able to make somebody worse however much good they have banked.
    bankTraining('Julia', 'Evie', 'endurance', 3.0);
    bankTraining('Yul', 'Evie', 'temperament', -1.2);
    expect(trainingBonus('Evie', 'temperament')).toBeCloseTo(-1.2);
  });

  it('returns zero for a contestant nobody has trained', () => {
    expect(trainingBonus('Nobody', 'mental')).toBe(0);
    expect(trainingTotal('Nobody')).toBe(0);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/coaches-training.test.js`
Expected: FAIL — `bankTraining is not a function`

- [ ] **Step 3: Append to `js/coaches.js`**

```js
/** Matches RI_TRAINING_CAP in js/rescue-island.js — one banked ceiling. */
export const COACH_TRAINING_CAP = 3.0;

/** Everything positive banked on this contestant, across every coach. */
export function trainingTotal(contestant) {
  let sum = 0;
  for (const perCoach of Object.values(gs.coachTraining || {})) {
    for (const amount of Object.values(perCoach[contestant] || {})) {
      if (amount > 0) sum += amount;
    }
  }
  return sum;
}

export function trainingBonus(contestant, stat) {
  let sum = 0;
  for (const perCoach of Object.values(gs.coachTraining || {})) {
    sum += perCoach[contestant]?.[stat] || 0;
  }
  return sum;
}

/**
 * Bank a session's result. Returns what was actually banked.
 *
 * The cap bounds HELP only. A negative amount always lands in full: a coach
 * below 5 in a stat teaches badly, and a contestant already at the ceiling must
 * still be able to be made worse.
 */
export function bankTraining(coach, contestant, stat, amount) {
  if (!gs.coachTraining) gs.coachTraining = {};
  if (!gs.coachTraining[coach]) gs.coachTraining[coach] = {};
  if (!gs.coachTraining[coach][contestant]) gs.coachTraining[coach][contestant] = {};

  let take = amount;
  if (amount > 0) take = Math.min(amount, Math.max(0, COACH_TRAINING_CAP - trainingTotal(contestant)));
  const slot = gs.coachTraining[coach][contestant];
  slot[stat] = (slot[stat] || 0) + take;
  return take;
}

/**
 * Delete everything one coach built and hand it back.
 *
 * Called when a coach is voted out. The returned map is what the tribe just
 * lost, and the fallout events narrate it.
 */
export function revokeCoachTraining(coach) {
  const lost = (gs.coachTraining || {})[coach] || {};
  if (gs.coachTraining) delete gs.coachTraining[coach];
  return lost;
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/coaches-training.test.js`
Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git add js/coaches.js tests/coaches-training.test.js
git commit -m "coaches: bank training per coach, so a vote can take it back"
```

---

### Task 3: Awe from the fame gap

**Files:**
- Create: `js/coach-agenda.js`
- Test: `tests/coach-awe.test.js`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure)
- Produces: `aweOf({ gap, stats, archetype }) -> number` — positive means impressed, negative means "reads him as a résumé"

- [ ] **Step 1: Write the failing test**

```js
// tests/coach-awe.test.js
import { describe, expect, it } from 'vitest';
import { aweOf } from '../js/coach-agenda.js';

const stats = over => ({
  physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
  loyalty: 5, boldness: 5, intuition: 5, temperament: 5, ...over,
});

describe('being impressed by a famous coach', () => {
  it('does nothing between equals', () => {
    expect(aweOf({ gap: 0, stats: stats(), archetype: 'goat' })).toBe(0);
  });

  it('lands hardest on someone looking for a leader', () => {
    const goat = aweOf({ gap: 5, stats: stats({ strategic: 2, boldness: 2, intuition: 2 }), archetype: 'goat' });
    const beast = aweOf({ gap: 5, stats: stats({ strategic: 2, boldness: 2, intuition: 2 }), archetype: 'challenge-beast' });
    expect(goat).toBeGreaterThan(beast);
  });

  it('inverts for the strategic — a résumé, not a hero', () => {
    // The same gap that makes a goat deferential makes a mastermind target him,
    // because a five-star finalist is the most dangerous person in camp.
    expect(aweOf({ gap: 5, stats: stats(), archetype: 'mastermind' })).toBeLessThan(0);
    expect(aweOf({ gap: 5, stats: stats(), archetype: 'perceptive-player' })).toBeLessThan(0);
  });

  it('is proportional, not a lookup — stats move it inside one archetype', () => {
    const dim = aweOf({ gap: 5, stats: stats({ strategic: 2 }), archetype: 'goat' });
    const sharp = aweOf({ gap: 5, stats: stats({ strategic: 8 }), archetype: 'goat' });
    expect(sharp).toBeLessThan(dim);
    expect(sharp, 'a sharp goat is still a goat, not a mastermind').toBeGreaterThan(0);
  });

  it('scales with the size of the gap', () => {
    const small = aweOf({ gap: 1, stats: stats({ strategic: 2 }), archetype: 'underdog' });
    const large = aweOf({ gap: 5, stats: stats({ strategic: 2 }), archetype: 'underdog' });
    expect(large).toBeGreaterThan(small);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/coach-awe.test.js`
Expected: FAIL — cannot resolve `../js/coach-agenda.js`

- [ ] **Step 3: Write `js/coach-agenda.js`**

```js
// The proportional half of the coaches twist: awe, agendas, and who gets a
// session. Pure functions with no gs access, so they can be tested to death
// without a game — which matters, because this is the part that needs tuning.
//
// EVERY TABLE HERE IS A BIAS, NEVER AN ASSIGNMENT. Archetype leans; the stats
// decide how far. Two coaches sharing an archetype must not behave the same.

/** How receptive each archetype is to fame. Negative reads it as a threat. */
const AWE_BIAS = {
  goat: 1.0, 'loyal-soldier': 0.9, underdog: 0.85,
  'social-butterfly': 0.6, showmancer: 0.6, floater: 0.55, hothead: 0.5, wildcard: 0.5,
  'challenge-beast': 0.25, 'chaos-agent': 0.25,
  hero: 0.5,
  // A résumé, not a hero. The same gap that makes a goat deferential makes
  // these four target him sooner.
  mastermind: -0.8, schemer: -0.7, villain: -0.7, 'perceptive-player': -0.9,
};

/**
 * How impressed one contestant is by one coach.
 *
 * Positive is deference, negative is "I know exactly what that record means".
 * The three stat terms do most of the work, so a goat with strategic 8 is much
 * harder to impress than a goat with strategic 2, and a mastermind with
 * intuition 2 can be caught looking up to somebody in spite of himself.
 */
export function aweOf({ gap, stats, archetype }) {
  if (!gap) return 0;
  const bias = AWE_BIAS[archetype] ?? 0.5;
  return gap * bias
    * ((10 - stats.strategic) / 10)
    * ((10 - stats.boldness) / 10)
    * ((10 - stats.intuition) / 10);
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/coach-awe.test.js`
Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git add js/coach-agenda.js tests/coach-awe.test.js
git commit -m "coaches: fame reads both ways off one gap"
```

---

### Task 4: The agenda mix

**Files:**
- Modify: `js/coach-agenda.js`
- Test: `tests/coach-agenda.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `agendaMix({ stats, archetype, vulnerability }) -> {control, win, support, survive, disrupt}` — each 0..1, and `dominantAgenda(mix) -> string`

- [ ] **Step 1: Write the failing test**

```js
// tests/coach-agenda.test.js
import { describe, expect, it } from 'vitest';
import { agendaMix, dominantAgenda } from '../js/coach-agenda.js';

const stats = over => ({
  physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
  loyalty: 5, boldness: 5, intuition: 5, temperament: 5, ...over,
});

describe('what a coach wants is a mix, not a label', () => {
  it('gives every coach some of all five', () => {
    const mix = agendaMix({ stats: stats(), archetype: 'hero', vulnerability: 0 });
    for (const k of ['control', 'win', 'support', 'survive', 'disrupt']) {
      expect(mix[k], k).toBeGreaterThanOrEqual(0);
    }
  });

  it('collapses a loyal mastermind’s appetite for control', () => {
    // The correction that matters: archetype leans, stats decide. A mastermind
    // at loyalty 9 has the mind for control and no appetite for the betrayal
    // it needs.
    const ruthless = agendaMix({ stats: stats({ strategic: 9, loyalty: 1 }), archetype: 'mastermind', vulnerability: 0 });
    const loyal = agendaMix({ stats: stats({ strategic: 9, loyalty: 9 }), archetype: 'mastermind', vulnerability: 0 });
    expect(loyal.control).toBeLessThan(ruthless.control);
    expect(loyal.support).toBeGreaterThan(ruthless.support);
  });

  it('gives a strategic hero real control without making him a villain', () => {
    const plain = agendaMix({ stats: stats({ strategic: 2 }), archetype: 'hero', vulnerability: 0 });
    const sharp = agendaMix({ stats: stats({ strategic: 9 }), archetype: 'hero', vulnerability: 0 });
    expect(sharp.control).toBeGreaterThan(plain.control);
  });

  it('drifts everybody toward survival as the vote closes in', () => {
    const safe = agendaMix({ stats: stats(), archetype: 'hero', vulnerability: 0 });
    const doomed = agendaMix({ stats: stats(), archetype: 'hero', vulnerability: 1 });
    expect(doomed.survive).toBeGreaterThan(safe.survive);
  });

  it('reads Ara as almost pure control', () => {
    // schemer, strategic 8, loyalty 1, temperament 2 — every stat agrees with
    // the archetype instead of pulling against it.
    const ara = agendaMix({
      stats: stats({ strategic: 8, loyalty: 1, boldness: 9, temperament: 2, social: 5 }),
      archetype: 'schemer', vulnerability: 0,
    });
    expect(dominantAgenda(ara)).toBe('control');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/coach-agenda.test.js`
Expected: FAIL — `agendaMix is not a function`

- [ ] **Step 3: Append to `js/coach-agenda.js`**

```js
/** Which way each archetype leans. Multiplied against stats, never consulted alone. */
const AGENDA_BIAS = {
  mastermind:          { control: 1.0, win: 0.5, support: 0.2, survive: 0.4, disrupt: 0.2 },
  schemer:             { control: 0.95, win: 0.4, support: 0.2, survive: 0.5, disrupt: 0.3 },
  villain:             { control: 0.9, win: 0.4, support: 0.1, survive: 0.4, disrupt: 0.5 },
  'challenge-beast':   { control: 0.3, win: 1.0, support: 0.4, survive: 0.3, disrupt: 0.2 },
  hero:                { control: 0.3, win: 0.6, support: 1.0, survive: 0.3, disrupt: 0.1 },
  'loyal-soldier':     { control: 0.2, win: 0.5, support: 1.0, survive: 0.4, disrupt: 0.1 },
  'social-butterfly':  { control: 0.4, win: 0.3, support: 0.9, survive: 0.4, disrupt: 0.2 },
  showmancer:          { control: 0.3, win: 0.3, support: 0.9, survive: 0.4, disrupt: 0.3 },
  goat:                { control: 0.1, win: 0.2, support: 0.5, survive: 1.0, disrupt: 0.2 },
  floater:             { control: 0.2, win: 0.3, support: 0.5, survive: 0.9, disrupt: 0.3 },
  underdog:            { control: 0.3, win: 0.4, support: 0.6, survive: 0.9, disrupt: 0.2 },
  'chaos-agent':       { control: 0.3, win: 0.2, support: 0.2, survive: 0.3, disrupt: 1.0 },
  hothead:             { control: 0.3, win: 0.5, support: 0.3, survive: 0.3, disrupt: 0.9 },
  wildcard:            { control: 0.3, win: 0.3, support: 0.3, survive: 0.3, disrupt: 0.9 },
  'perceptive-player': { control: 0.7, win: 0.4, support: 0.5, survive: 0.6, disrupt: 0.2 },
};

const DEFAULT_BIAS = { control: 0.4, win: 0.4, support: 0.4, survive: 0.4, disrupt: 0.4 };

/**
 * The five things a coach can spend influence on, all at once.
 *
 * `vulnerability` is 0..1 — how close this coach is to being voted out. It
 * lifts `survive` for everybody, which is why any coach drifts toward
 * self-preservation as the vote nears, whatever they came in wanting.
 */
export function agendaMix({ stats, archetype, vulnerability = 0 }) {
  const b = AGENDA_BIAS[archetype] || DEFAULT_BIAS;
  return {
    control: (stats.strategic / 10) * ((10 - stats.loyalty) / 10) * b.control,
    support: (stats.loyalty / 10) * (stats.social / 10) * b.support,
    win:     (stats.mental / 10) * (stats.intuition / 10) * b.win,
    survive: Math.min(1, vulnerability) * b.survive,
    disrupt: (stats.boldness / 10) * ((10 - stats.temperament) / 10) * b.disrupt,
  };
}

export function dominantAgenda(mix) {
  return Object.entries(mix).sort((a, b) => b[1] - a[1])[0][0];
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/coach-agenda.test.js`
Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git add js/coach-agenda.js tests/coach-agenda.test.js
git commit -m "coaches: an agenda is a mix the stats decide"
```

---

### Task 5: What a session teaches, and who gets it

**Files:**
- Modify: `js/coach-agenda.js`
- Test: `tests/coach-sessions.test.js`

**Interfaces:**
- Consumes: `agendaMix` from Task 4
- Produces: `teachableStat(coachStats) -> stat`, `sessionGain(coachStat, bond, roll) -> number`, `pickSessionTargets({coach, candidates, sessions, roll}) -> string[]`

- [ ] **Step 1: Write the failing test**

```js
// tests/coach-sessions.test.js
import { describe, expect, it } from 'vitest';
import { pickSessionTargets, sessionGain, teachableStat } from '../js/coach-agenda.js';

const stats = over => ({
  physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
  loyalty: 5, boldness: 5, intuition: 5, temperament: 5, ...over,
});

describe('a coach teaches what they are good at', () => {
  it('picks their strongest discipline', () => {
    expect(teachableStat(stats({ endurance: 9 }))).toBe('endurance');
    expect(teachableStat(stats({ strategic: 10, endurance: 9 }))).toBe('strategic');
  });
});

describe('a bad coach teaches badly', () => {
  it('helps when the coach is good at it', () => {
    expect(sessionGain(9, 5, () => 0.5)).toBeGreaterThan(0);
  });

  it('DAMAGES when the coach is bad at it', () => {
    // Not a smaller bonus — damage. A temperament-2 coach running temperament
    // sessions teaches a contestant to detonate.
    expect(sessionGain(2, 5, () => 0.5)).toBeLessThan(0);
  });

  it('teaches better to somebody who trusts them', () => {
    expect(sessionGain(9, 8, () => 0.5)).toBeGreaterThan(sessionGain(9, -8, () => 0.5));
  });
});

describe('who gets the session', () => {
  const candidates = [
    { name: 'Evie', stats: stats({ endurance: 2, social: 2, strategic: 2 }), bond: 0, atRisk: 0 },
    { name: 'Finn', stats: stats({ endurance: 8, social: 9, strategic: 9 }), bond: 0, atRisk: 0 },
  ];

  it('sends a challenge-beast after the biggest gain', () => {
    const picked = pickSessionTargets({
      coach: { stats: stats({ endurance: 9 }), archetype: 'challenge-beast', vulnerability: 0 },
      candidates, sessions: 1, roll: () => 0.5,
    });
    expect(picked, 'the weakest gains most').toEqual(['Evie']);
  });

  it('sends a mastermind after the vote', () => {
    const picked = pickSessionTargets({
      coach: { stats: stats({ strategic: 9, loyalty: 1 }), archetype: 'mastermind', vulnerability: 0 },
      candidates, sessions: 1, roll: () => 0.5,
    });
    expect(picked, 'influence over improvement').toEqual(['Finn']);
  });

  it('never spends more sessions than it has', () => {
    const picked = pickSessionTargets({
      coach: { stats: stats(), archetype: 'hero', vulnerability: 0 },
      candidates, sessions: 1, roll: () => 0.5,
    });
    expect(picked).toHaveLength(1);
  });

  it('leaves somebody out, which is the whole point', () => {
    const picked = pickSessionTargets({
      coach: { stats: stats(), archetype: 'hero', vulnerability: 0 },
      candidates, sessions: 1, roll: () => 0.5,
    });
    expect(picked.length).toBeLessThan(candidates.length);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/coach-sessions.test.js`
Expected: FAIL — `teachableStat is not a function`

- [ ] **Step 3: Append to `js/coach-agenda.js`**

```js
const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

/** You teach what you are good at. Ties go to the earlier key, deterministically. */
export function teachableStat(coachStats) {
  return STAT_KEYS.reduce((best, k) => (coachStats[k] > coachStats[best] ? k : best), STAT_KEYS[0]);
}

/**
 * What one session moves.
 *
 * Centred on 5: above it a coach helps, below it they do damage. Bond scales
 * it because you teach best whoever trusts you, and a contestant who resents
 * their coach learns nothing from him.
 */
export function sessionGain(coachStat, bond, roll = Math.random) {
  const skill = (coachStat - 5) / 5;              // −1 .. +1
  const trust = 1 + (bond / 20);                  // bond is −10..+10
  const noise = 0.75 + roll() * 0.5;              // ×0.75 .. ×1.25
  return skill * trust * noise;
}

/**
 * Who a coach spends their sessions on.
 *
 * Weighted and summed, never thresholded. The agenda mix supplies the weights,
 * so the same candidate list produces different picks for a challenge-beast
 * and a mastermind — and different picks for two masterminds whose loyalty
 * differs.
 */
export function pickSessionTargets({ coach, candidates, sessions, roll = Math.random }) {
  const mix = agendaMix({ stats: coach.stats, archetype: coach.archetype, vulnerability: coach.vulnerability });
  const discipline = teachableStat(coach.stats);

  const scored = candidates.map(c => {
    const gain   = (10 - (c.stats[discipline] ?? 5)) / 10;
    const swing  = ((c.stats.social + c.stats.strategic) / 20);
    const bond   = (c.bond + 10) / 20;
    const risk   = c.atRisk || 0;
    const score = mix.win     * gain
                + mix.control * swing
                + mix.support * (gain * 0.6 + risk * 0.4)
                + mix.survive * swing
                + mix.disrupt * (0.5 + (roll() - 0.5))
                + 0.15 * bond;
    return { name: c.name, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, sessions).map(s => s.name);
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/coach-sessions.test.js`
Expected: PASS, 7 tests

- [ ] **Step 5: Commit**

```bash
git add js/coach-agenda.js tests/coach-sessions.test.js
git commit -m "coaches: sessions are scarce and the pick is visible"
```

---

### Task 6: The coaching block

**Files:**
- Create: `js/coach-episode.js`
- Test: `tests/coach-block.test.js`

**Interfaces:**
- Consumes: everything from Tasks 1–5, `addBond`/`getBond` from `js/bonds.js`, `pStats` from `js/players.js`
- Produces: `runCoachingBlock(ep, tribe) -> { sessions: [{coach, contestant, stat, gain}], passedOver: [{coach, contestant}] }`, written to `ep.coachData`

- [ ] **Step 1: Write the failing test**

```js
// tests/coach-block.test.js
import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { getBond } from '../js/bonds.js';
import { addCoach, trainingBonus } from '../js/coaches.js';
import { runCoachingBlock } from '../js/coach-episode.js';

const stats = over => ({
  physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
  loyalty: 5, boldness: 5, intuition: 5, temperament: 5, ...over,
});

beforeEach(() => {
  setPlayers([
    { name: 'Julia', archetype: 'schemer', stats: stats({ endurance: 9 }) },
    { name: 'Evie',  archetype: 'goat',    stats: stats({ endurance: 2 }) },
    { name: 'Finn',  archetype: 'chaos-agent', stats: stats({ endurance: 8 }) },
  ]);
  setGs({ activePlayers: ['Evie', 'Finn'], coaches: [], coachTraining: {}, bonds: {}, episode: 3 });
  addCoach({ name: 'Julia', tribe: 'Red', sessionsPerEp: 1 });
});

const tribe = { tribeName: 'Red', members: ['Evie', 'Finn'] };

describe('the coaching block', () => {
  it('banks training for whoever got the session', () => {
    const out = runCoachingBlock({ num: 3 }, tribe, () => 0.5);
    expect(out.sessions).toHaveLength(1);
    const s = out.sessions[0];
    expect(trainingBonus(s.contestant, s.stat)).not.toBe(0);
  });

  it('builds a bond with whoever it trained', () => {
    const out = runCoachingBlock({ num: 3 }, tribe, () => 0.5);
    expect(getBond('Julia', out.sessions[0].contestant)).toBeGreaterThan(0);
  });

  it('costs a bond with whoever it passed over — this is the resentment', () => {
    // No new stat. Being passed over lowers the coach bond, and the alliance
    // and voting code already reads bonds when choosing targets, so the
    // coalition assembles itself out of machinery that already exists.
    const out = runCoachingBlock({ num: 3 }, tribe, () => 0.5);
    expect(out.passedOver.length).toBeGreaterThan(0);
    expect(getBond('Julia', out.passedOver[0].contestant)).toBeLessThan(0);
  });

  it('writes what happened onto the episode for the VP to read', () => {
    const ep = { num: 3 };
    runCoachingBlock(ep, tribe, () => 0.5);
    expect(ep.coachData.Red.sessions).toHaveLength(1);
  });

  it('does nothing on a tribe with no coaches', () => {
    const ep = { num: 3 };
    const out = runCoachingBlock(ep, { tribeName: 'Blue', members: ['Evie'] }, () => 0.5);
    expect(out.sessions).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/coach-block.test.js`
Expected: FAIL — cannot resolve `../js/coach-episode.js`

- [ ] **Step 3: Write `js/coach-episode.js`**

```js
// The per-episode coaching block: run the sessions, move the bonds, record
// what happened. This is the only file in the twist that writes to `gs`; the
// maths lives in coach-agenda.js and the store in coaches.js.
import { gs, players } from './core.js';
import { pStats } from './players.js';
import { addBond, getBond } from './bonds.js';
import { bankTraining, coachesOf, sessionsFor } from './coaches.js';
import { pickSessionTargets, sessionGain, teachableStat } from './coach-agenda.js';

/** How close this coach is to being voted out, 0..1. Lifts their survive agenda. */
function vulnerabilityOf(coachName, tribe) {
  const bonds = tribe.members.map(m => getBond(coachName, m));
  if (!bonds.length) return 0.5;
  const avg = bonds.reduce((a, b) => a + b, 0) / bonds.length;
  return Math.max(0, Math.min(1, (5 - avg) / 15));
}

export function runCoachingBlock(ep, tribe, roll = Math.random) {
  const coaches = coachesOf(tribe.tribeName);
  const sessions = [], passedOver = [];

  for (const coach of coaches) {
    const coachStats = pStats(coach.name);
    const archetype = players.find(p => p.name === coach.name)?.archetype;
    const budget = coach.sessionsPerEp || sessionsFor(tribe.members.length);
    const discipline = teachableStat(coachStats);

    const candidates = tribe.members.map(name => ({
      name, stats: pStats(name), bond: getBond(coach.name, name), atRisk: 0,
    }));

    const picked = pickSessionTargets({
      coach: { stats: coachStats, archetype, vulnerability: vulnerabilityOf(coach.name, tribe) },
      candidates, sessions: budget, roll,
    });

    for (const contestant of picked) {
      const gain = sessionGain(coachStats[discipline], getBond(coach.name, contestant), roll);
      const banked = bankTraining(coach.name, contestant, discipline, gain);
      // Attention builds attachment whether or not the teaching was any good.
      addBond(coach.name, contestant, 1);
      sessions.push({ coach: coach.name, contestant, stat: discipline, gain: banked });
    }

    for (const name of tribe.members) {
      if (picked.includes(name)) continue;
      // Resentment IS a bond, not a new stat.
      addBond(coach.name, name, -0.5);
      passedOver.push({ coach: coach.name, contestant: name });
    }
  }

  if (!ep.coachData) ep.coachData = {};
  ep.coachData[tribe.tribeName] = { sessions, passedOver };
  return { sessions, passedOver };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/coach-block.test.js`
Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git add js/coach-episode.js tests/coach-block.test.js
git commit -m "coaches: run the block, and let the bonds carry the resentment"
```

---

### Task 7: Training reaches the challenge

**Files:**
- Modify: `js/challenges-core.js` (the individual and tribe scoring paths)
- Test: `tests/coach-challenge-bonus.test.js`

**Interfaces:**
- Consumes: `trainingBonus` from Task 2
- Produces: nothing new — a contestant's effective stat in a challenge is `pStats(name)[stat] + trainingBonus(name, stat)`

- [ ] **Step 1: Write the failing test**

```js
// tests/coach-challenge-bonus.test.js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('banked training is worth something', () => {
  it('is added to the stat the challenge actually reads', () => {
    // Rescue Island already does exactly this with _getTrainingBonus; the
    // coaches' bank has to reach the same place or the whole twist is a number
    // nobody ever feels.
    const core = readFileSync('js/challenges-core.js', 'utf8');
    expect(core, 'challenges-core must import the coach bank')
      .toMatch(/import \{[^}]*trainingBonus[^}]*\} from '\.\/coaches\.js'/);
    expect(core, 'and apply it where a stat is read')
      .toMatch(/trainingBonus\(/);
  });

  it('does not put coaches in a challenge', () => {
    const core = readFileSync('js/challenges-core.js', 'utf8');
    // Coaches are not in gs.activePlayers, so nothing here should need to
    // filter them out — if a filter appears, the architecture has leaked.
    expect(core).not.toMatch(/isCoach\(/);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/coach-challenge-bonus.test.js`
Expected: FAIL — no import of `trainingBonus`

- [ ] **Step 3: Wire it in `js/challenges-core.js`**

Add at the top:

```js
import { trainingBonus } from './coaches.js';
```

Then at every place a contestant's stat is read for scoring, add the bank. The
pattern to follow is `js/rescue-island.js:521`:

```js
// before
const primaryVal = s[challenge.primary];
// after
const primaryVal = s[challenge.primary] + trainingBonus(name, challenge.primary);
```

Apply to both the primary and secondary stat reads in
`simulateIndividualChallenge` and `simulateTribeChallenge`. Do not filter
anything: coaches are not in `gs.activePlayers`, so they never reach this code.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/coach-challenge-bonus.test.js tests/coach-training.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/challenges-core.js tests/coach-challenge-bonus.test.js
git commit -m "coaches: banked training reaches the stat the challenge reads"
```

---

### Task 8: A target who is not a voter

**Files:**
- Modify: `js/voting.js:817` (`simulateVotes`)
- Test: `tests/coach-ballot.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `simulateVotes(tribalPlayers, immuneName, alliances, lostVotes, openVote, extraTargets = [])` — `extraTargets` may receive votes and never cast them

- [ ] **Step 1: Write the failing test**

```js
// tests/coach-ballot.test.js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('a coach can be voted for and never votes', () => {
  it('takes a separate list of targets', () => {
    // simulateVotes uses ONE list for both the voters and the candidates, so a
    // coach cannot be added to it — they would start casting ballots. The
    // target list has to be separate, which is the same boundary as "coaches
    // never touch the ballot", stated twice.
    const voting = readFileSync('js/voting.js', 'utf8');
    expect(voting).toMatch(/export function simulateVotes\([^)]*extraTargets/);
  });

  it('never adds an extra target to the voter pool', () => {
    const voting = readFileSync('js/voting.js', 'utf8');
    const fn = voting.slice(voting.indexOf('export function simulateVotes'));
    const body = fn.slice(0, fn.indexOf('\nexport '));
    // The voter pool must be built from tribalPlayers alone.
    expect(body).not.toMatch(/eligibleVoters[^\n]*extraTargets/);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/coach-ballot.test.js`
Expected: FAIL — signature has no `extraTargets`

- [ ] **Step 3: Change the signature in `js/voting.js`**

```js
/**
 * @param extraTargets names that may RECEIVE votes but never cast one.
 *   Coaches. The voter pool is built from `tribalPlayers` alone; only the
 *   candidate pool is widened. Adding a coach to `tribalPlayers` instead would
 *   hand them a ballot, which the twist forbids.
 */
export function simulateVotes(tribalPlayers, immuneName, alliances, lostVotes = [], openVote = false, extraTargets = []) {
```

Inside, wherever the list of people who can be voted FOR is built, use
`[...tribalPlayers, ...extraTargets]`; leave every voter-pool construction
reading `tribalPlayers` untouched.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/coach-ballot.test.js tests/voting*.test.js`
Expected: PASS — and no existing voting test regresses, because `extraTargets` defaults to empty

- [ ] **Step 5: Commit**

```bash
git add js/voting.js tests/coach-ballot.test.js
git commit -m "voting: a target list separate from the voter list"
```

---

### Task 9: Elimination, and what it costs

**Files:**
- Modify: `js/coach-episode.js`
- Test: `tests/coach-elimination.test.js`

**Interfaces:**
- Consumes: `revokeCoachTraining`, `removeCoach` from Tasks 1–2
- Produces: `eliminateCoach(ep, coachName) -> { lost, reactions: [{contestant, kind, bond}] }`

- [ ] **Step 1: Write the failing test**

```js
// tests/coach-elimination.test.js
import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { addBond } from '../js/bonds.js';
import { addCoach, bankTraining, isCoach, trainingBonus } from '../js/coaches.js';
import { eliminateCoach } from '../js/coach-episode.js';

const stats = () => ({ physical:5,endurance:5,mental:5,social:5,strategic:5,loyalty:5,boldness:5,intuition:5,temperament:5 });

beforeEach(() => {
  setPlayers([
    { name: 'Julia', archetype: 'schemer', stats: stats() },
    { name: 'Evie',  archetype: 'goat',    stats: stats() },
    { name: 'Finn',  archetype: 'villain', stats: stats() },
  ]);
  setGs({ activePlayers: ['Evie', 'Finn'], coaches: [], coachTraining: {}, bonds: {}, episode: 5 });
  addCoach({ name: 'Julia', tribe: 'Red' });
  bankTraining('Julia', 'Evie', 'endurance', 1.4);
});

describe('voting out a coach', () => {
  it('destroys what they built — the cost that makes them worth keeping', () => {
    eliminateCoach({ num: 5 }, 'Julia');
    expect(trainingBonus('Evie', 'endurance')).toBe(0);
  });

  it('takes them off the coach list', () => {
    eliminateCoach({ num: 5 }, 'Julia');
    expect(isCoach('Julia')).toBe(false);
  });

  it('makes a close protégé grieve and a distant one shrug', () => {
    addBond('Julia', 'Evie', 8);
    addBond('Julia', 'Finn', -6);
    const out = eliminateCoach({ num: 5 }, 'Julia');
    const evie = out.reactions.find(r => r.contestant === 'Evie');
    const finn = out.reactions.find(r => r.contestant === 'Finn');
    expect(evie.kind).toBe('grief');
    expect(finn.kind).toBe('relief');
  });

  it('reports what was lost so the fallout can name it', () => {
    const out = eliminateCoach({ num: 5 }, 'Julia');
    expect(out.lost).toEqual({ Evie: { endurance: 1.4 } });
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/coach-elimination.test.js`
Expected: FAIL — `eliminateCoach is not a function`

- [ ] **Step 3: Append to `js/coach-episode.js`**

```js
import { coachRecord, removeCoach, revokeCoachTraining } from './coaches.js';

/**
 * A coach is voted out.
 *
 * The mechanical cost is revocation — everything they banked leaves with them,
 * immediately and visibly, which is what makes a coach who did his job
 * expensive to cut. The rest is the twist's largest emotional beat and must
 * not be silent.
 */
export function eliminateCoach(ep, coachName) {
  const record = coachRecord(coachName);
  const tribe = record?.tribe;
  const lost = revokeCoachTraining(coachName);

  const reactions = [];
  for (const name of (gs.activePlayers || [])) {
    const bond = getBond(coachName, name);
    // Thresholds are allowed here: this chooses narrative text, not gameplay.
    const kind = bond >= 5 ? 'grief' : bond <= -3 ? 'relief' : 'unsettled';
    reactions.push({ contestant: name, kind, bond });
  }

  removeCoach(coachName);
  if (!ep.coachElimination) ep.coachElimination = [];
  ep.coachElimination.push({ coach: coachName, tribe, lost, reactions });
  return { lost, reactions };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/coach-elimination.test.js`
Expected: PASS, 4 tests

- [ ] **Step 5: Commit**

```bash
git add js/coach-episode.js tests/coach-elimination.test.js
git commit -m "coaches: an elimination that takes the training with it"
```

---

### Task 10: The save card

**Files:**
- Modify: `js/coach-episode.js`
- Test: `tests/coach-save-card.test.js`

**Interfaces:**
- Consumes: `coachRecord` from Task 1, `getBond`
- Produces: `offerSaveCard(ep, coachName, tribe) -> { played: boolean, replacement: string|null, reason: string }`

- [ ] **Step 1: Write the failing test**

```js
// tests/coach-save-card.test.js
import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { addBond } from '../js/bonds.js';
import { addCoach, coachRecord } from '../js/coaches.js';
import { offerSaveCard } from '../js/coach-episode.js';

const stats = () => ({ physical:5,endurance:5,mental:5,social:5,strategic:5,loyalty:5,boldness:5,intuition:5,temperament:5 });

beforeEach(() => {
  setPlayers([
    { name: 'Julia', archetype: 'schemer', stats: stats() },
    { name: 'Evie', archetype: 'goat', stats: stats() },
    { name: 'Finn', archetype: 'hero', stats: stats() },
  ]);
  setGs({ activePlayers: ['Evie', 'Finn'], coaches: [], coachTraining: {}, bonds: {}, episode: 6 });
  addCoach({ name: 'Julia', tribe: 'Red' });
});

const tribe = { tribeName: 'Red', members: ['Evie', 'Finn'] };

describe('the save card', () => {
  it('needs every contestant to agree', () => {
    addBond('Julia', 'Evie', 9);
    addBond('Julia', 'Finn', -8);   // one holdout is enough
    const out = offerSaveCard({ num: 6 }, 'Julia', tribe);
    expect(out.played).toBe(false);
  });

  it('plays when the tribe is unanimous', () => {
    addBond('Julia', 'Evie', 9);
    addBond('Julia', 'Finn', 8);
    const out = offerSaveCard({ num: 6 }, 'Julia', tribe);
    expect(out.played).toBe(true);
    expect(coachRecord('Julia').saveCard).toBe('used');
  });

  it('makes the coach name who dies for it', () => {
    // The tribe agrees to save him; HE chooses who goes instead. That turns
    // protection into a poisoned gift and guarantees it creates the next
    // resentment rather than resolving the current one.
    addBond('Julia', 'Evie', 9);
    addBond('Julia', 'Finn', 8);
    const out = offerSaveCard({ num: 6 }, 'Julia', tribe);
    expect(tribe.members).toContain(out.replacement);
  });

  it('never picks another coach as the replacement', () => {
    addCoach({ name: 'Yul', tribe: 'Red' });
    addBond('Julia', 'Evie', 9);
    addBond('Julia', 'Finn', 8);
    const out = offerSaveCard({ num: 6 }, 'Julia', tribe);
    expect(out.replacement).not.toBe('Yul');
  });

  it('cannot be played twice', () => {
    addBond('Julia', 'Evie', 9);
    addBond('Julia', 'Finn', 8);
    offerSaveCard({ num: 6 }, 'Julia', tribe);
    const second = offerSaveCard({ num: 7 }, 'Julia', tribe);
    expect(second.played).toBe(false);
    expect(second.reason).toBe('already-used');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/coach-save-card.test.js`
Expected: FAIL — `offerSaveCard is not a function`

- [ ] **Step 3: Append to `js/coach-episode.js`**

```js
/**
 * One card per coach, playable only if every contestant on the tribe agrees.
 *
 * Unanimity is the twist's difficulty dial. A tribe that cannot agree argues
 * and loses its coach anyway, which is also a scene.
 */
export function offerSaveCard(ep, coachName, tribe) {
  const record = coachRecord(coachName);
  if (!record) return { played: false, replacement: null, reason: 'not-a-coach' };
  if (record.saveCard !== 'unused') return { played: false, replacement: null, reason: 'already-used' };

  // Every contestant must be willing. A threshold is fine here: it is a yes/no
  // question, not a scaled gameplay effect.
  const holdout = tribe.members.find(m => getBond(coachName, m) < 0);
  if (holdout) return { played: false, replacement: null, reason: `holdout:${holdout}` };

  // He chooses. Never another coach — the card removes a contestant.
  const replacement = tribe.members
    .slice()
    .sort((a, b) => getBond(coachName, a) - getBond(coachName, b))[0] || null;

  record.saveCard = 'used';
  if (!ep.coachSaves) ep.coachSaves = [];
  ep.coachSaves.push({ coach: coachName, tribe: tribe.tribeName, replacement });
  return { played: true, replacement, reason: 'unanimous' };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/coach-save-card.test.js`
Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git add js/coach-episode.js tests/coach-save-card.test.js
git commit -m "coaches: a save the tribe grants and the coach spends"
```

---

### Task 11: The advantages law

**Files:**
- Modify: `js/advantages.js`
- Test: `tests/coach-advantages.test.js`

**Interfaces:**
- Consumes: `isCoach`, `coachRecord` from Task 1
- Produces: `coachCanPlay(type) -> boolean`, `giveAdvantage(coachName, contestant, advantage) -> boolean`

- [ ] **Step 1: Write the failing test**

```js
// tests/coach-advantages.test.js
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { addCoach, coachRecord } from '../js/coaches.js';
import { coachCanPlay, giveAdvantage } from '../js/advantages.js';

const stats = () => ({ physical:5,endurance:5,mental:5,social:5,strategic:5,loyalty:5,boldness:5,intuition:5,temperament:5 });

beforeEach(() => {
  setPlayers([{ name: 'Julia', archetype: 'schemer', stats: stats() }, { name: 'Evie', archetype: 'goat', stats: stats() }]);
  setGs({ activePlayers: ['Evie'], coaches: [], coachTraining: {}, advantages: [] });
  addCoach({ name: 'Julia', tribe: 'Red' });
});

describe('a coach’s power always targets somebody else', () => {
  it('refuses everything self-directed', () => {
    expect(coachCanPlay('idol')).toBe(false);
    expect(coachCanPlay('legacy')).toBe(false);
    expect(coachCanPlay('amulet')).toBe(false);
    expect(coachCanPlay('extra-vote')).toBe(false);
    expect(coachCanPlay('vote-steal')).toBe(false);
  });

  it('allows what acts on another player', () => {
    expect(coachCanPlay('kip')).toBe(true);
    expect(coachCanPlay('fake-idol')).toBe(true);
  });

  it('refuses vote-stopper even though it targets somebody else', () => {
    // Deliberate. "Coaches never touch the ballot" is a cleaner promise than
    // the targeting rule, and a coach reaching invisibly into a pre-merge vote
    // makes the vote unreadable in a game where reading it is the sport.
    expect(coachCanPlay('vote-stopper')).toBe(false);
  });
});

describe('handing one over', () => {
  it('moves the advantage and burns the save card', () => {
    gs.advantages.push({ holder: 'Julia', type: 'idol' });
    expect(giveAdvantage('Julia', 'Evie', gs.advantages[0])).toBe(true);
    expect(gs.advantages[0].holder).toBe('Evie');
    expect(coachRecord('Julia').saveCard).toBe('used');
  });

  it('refuses when the card is already spent', () => {
    coachRecord('Julia').saveCard = 'used';
    gs.advantages.push({ holder: 'Julia', type: 'idol' });
    expect(giveAdvantage('Julia', 'Evie', gs.advantages[0])).toBe(false);
    expect(gs.advantages[0].holder).toBe('Julia');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/coach-advantages.test.js`
Expected: FAIL — `coachCanPlay is not a function`

- [ ] **Step 3: Append to `js/advantages.js`**

```js
import { coachRecord } from './coaches.js';

/**
 * ONE LAW: a coach's power always has a target other than the coach.
 *
 * No list is needed for the usual cases — anything self-directed is inert —
 * but two are named explicitly. Vote Stopper targets somebody else and is
 * still refused, because "coaches never touch the ballot" is a cleaner promise
 * than the targeting rule and a hidden hand in a pre-merge vote makes the vote
 * unreadable.
 */
const COACH_PLAYABLE = new Set(['kip', 'fake-idol', 'team-switch', 'loan', 'second-opinion']);

export function coachCanPlay(type) {
  return COACH_PLAYABLE.has(type);
}

/**
 * Hand an advantage to a contestant. It costs the coach their save card.
 *
 * Surrendering the protection that keeps you alive to arm a favourite is
 * meant to be a hard choice, not a reflex.
 */
export function giveAdvantage(coachName, contestant, advantage) {
  const record = coachRecord(coachName);
  if (!record || record.saveCard !== 'unused') return false;
  if (!advantage || advantage.holder !== coachName) return false;
  advantage.holder = contestant;
  advantage.givenBy = coachName;
  record.saveCard = 'used';
  return true;
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/coach-advantages.test.js tests/advantage*.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/advantages.js tests/coach-advantages.test.js
git commit -m "coaches: one law decides every advantage"
```

---

### Task 12: Promotion at the merge

**Files:**
- Modify: `js/coach-episode.js`
- Test: `tests/coach-promotion.test.js`

**Interfaces:**
- Consumes: `activeCoaches`, `gs.activePlayers`
- Produces: `promoteCoaches(ep) -> [{name, stake}]`

- [ ] **Step 1: Write the failing test**

```js
// tests/coach-promotion.test.js
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { addCoach, bankTraining, isCoach, trainingBonus } from '../js/coaches.js';
import { promoteCoaches } from '../js/coach-episode.js';

const stats = () => ({ physical:5,endurance:5,mental:5,social:5,strategic:5,loyalty:5,boldness:5,intuition:5,temperament:5 });

beforeEach(() => {
  setPlayers([
    { name: 'Julia', archetype: 'schemer', stats: stats() },
    { name: 'Evie', archetype: 'goat', stats: stats() },
  ]);
  setGs({ activePlayers: ['Evie'], coaches: [], coachTraining: {}, bonds: {}, isMerged: true });
  addCoach({ name: 'Julia', tribe: 'Red' });
});

describe('promotion', () => {
  it('puts them on the roster, which is the whole architecture paying off', () => {
    promoteCoaches({ num: 10 });
    expect(gs.activePlayers).toContain('Julia');
    expect(isCoach('Julia')).toBe(false);
  });

  it('leaves the training they gave with the people they gave it to', () => {
    bankTraining('Julia', 'Evie', 'endurance', 1.5);
    promoteCoaches({ num: 10 });
    expect(trainingBonus('Evie', 'endurance')).toBeCloseTo(1.5);
  });

  it('arrives having trained nobody on themselves', () => {
    promoteCoaches({ num: 10 });
    expect(trainingBonus('Julia', 'endurance')).toBe(0);
  });

  it('rewards a coach whose protégés are still standing', () => {
    bankTraining('Julia', 'Evie', 'endurance', 1.5);
    const [out] = promoteCoaches({ num: 10 });
    expect(out.stake, 'a surviving protégé is worth something').toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/coach-promotion.test.js`
Expected: FAIL — `promoteCoaches is not a function`

- [ ] **Step 3: Append to `js/coach-episode.js`**

```js
import { activeCoaches } from './coaches.js';

/**
 * Every surviving coach becomes a full player.
 *
 * One push into gs.activePlayers, after which 135 modules begin treating them
 * as contestants without being told. They arrive with their bonds, their
 * banked advantages, and NO training on themselves — a real weakness, since
 * they spent the whole pre-merge improving other people.
 *
 * The stake is the one exception: a coach whose protégés are still standing
 * arrives sharper, so coaching well is not merely a way to stay alive.
 */
export function promoteCoaches(ep) {
  const promoted = [];
  for (const coach of activeCoaches()) {
    const built = gs.coachTraining?.[coach.name] || {};
    const surviving = Object.keys(built).filter(n => (gs.activePlayers || []).includes(n));
    const stake = Math.min(1.5, surviving.length * 0.5);

    coach.promoted = true;
    if (!gs.activePlayers.includes(coach.name)) gs.activePlayers.push(coach.name);
    if (stake > 0) bankTraining(coach.name, coach.name, 'strategic', stake);

    promoted.push({ name: coach.name, stake, surviving });
  }
  if (promoted.length) ep.coachPromotions = promoted;
  return promoted;
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/coach-promotion.test.js`
Expected: PASS, 4 tests

- [ ] **Step 5: Commit**

```bash
git add js/coach-episode.js tests/coach-promotion.test.js
git commit -m "coaches: promotion is one push, and coaching well pays"
```

---

### Task 13: Wire the twist into the engine

**Files:**
- Modify: `js/core.js` (TWIST_CATALOG), `js/twists.js`, `js/episode.js`, `js/main.js`, `js/run-ui.js`
- Test: `tests/coach-wiring.test.js`

**Interfaces:**
- Consumes: `runCoachingBlock`, `eliminateCoach`, `promoteCoaches`
- Produces: `ep.isCoaches`, `ep.coachData`

- [ ] **Step 1: Write the failing test**

```js
// tests/coach-wiring.test.js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(f, 'utf8');

describe('the twist is reachable', () => {
  it('is in the catalog with a phase and a style', () => {
    const core = read('js/core.js');
    expect(core).toMatch(/id:\s*'coaches'/);
    expect(core, 'the randomizer needs a style').toMatch(/id:\s*'coaches'[\s\S]{0,400}chalStyle/);
  });

  it('sets its flag in applyTwist', () => {
    expect(read('js/twists.js')).toMatch(/engineType === 'coaches'/);
  });

  it('runs the block and promotes at the merge', () => {
    const ep = read('js/episode.js');
    expect(ep).toMatch(/runCoachingBlock\(/);
    expect(ep).toMatch(/promoteCoaches\(/);
  });

  it('survives a reload — the data is on the episode history', () => {
    // Missing this is why a VP shows nothing on replay. Every push needs it.
    const ep = read('js/episode.js');
    const pushes = ep.split('gs.episodeHistory.push').length - 1;
    const carried = ep.split('coachData:').length - 1;
    expect(carried, `${pushes} history pushes, ${carried} carry coachData`).toBe(pushes);
  });

  it('is on the module spread and the timeline', () => {
    expect(read('js/main.js')).toMatch(/coach-episode\.js/);
    expect(read('js/run-ui.js')).toMatch(/isCoaches/);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/coach-wiring.test.js`
Expected: FAIL — no `id: 'coaches'` in the catalog

- [ ] **Step 3: Make the five edits**

`js/core.js` — TWIST_CATALOG:

```js
{ id:'coaches', emoji:'📋', name:'Coaches', category:'twist',
  chalStyle:'social', phase:'pre-merge',
  desc:'Each tribe carries one to three former winners and finalists who train the contestants but never compete. They cannot vote and they can be voted out. Survive to the merge and they finally play.',
  engineType:'coaches', incompatible:[] },
```

`js/twists.js` — in `applyTwist`:

```js
} else if (engineType === 'coaches') {
  ep.isCoaches = true;
```

`js/episode.js`:

```js
import { eliminateCoach, promoteCoaches, runCoachingBlock } from './coach-episode.js';
import { coachesOf, isCoach } from './coaches.js';
```

- after camp events are generated for a tribe, and before the challenge:
  `if (ep.isCoaches) runCoachingBlock(ep, tribe);`
- where `simulateVotes` is called, pass the coaches as targets:
  `simulateVotes(ep.tribalPlayers, ep.immunityWinner, alliances, lostVotes, openVote, coachesOf(tribeName).map(c => c.name))`
- where an elimination is applied, branch:
  `if (isCoach(ep.eliminated)) eliminateCoach(ep, ep.eliminated); else /* existing path */`
- at the merge, once `gs.isMerged` becomes true: `if (ep.isCoaches) promoteCoaches(ep);`
- add `coachData: ep.coachData || null, isCoaches: ep.isCoaches || false` to **every**
  `gs.episodeHistory.push` call — there are four or more; find them with
  `grep -n "episodeHistory.push" js/episode.js`.

`js/main.js`:

```js
import * as coachEpisodeMod from './coach-episode.js';
// add coachEpisodeMod to the module spread array
```

`js/run-ui.js` — a timeline pill alongside the other twist badges, gated on
`ep.isCoaches`.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/coach-wiring.test.js`
Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git add js/core.js js/twists.js js/episode.js js/main.js js/run-ui.js tests/coach-wiring.test.js
git commit -m "coaches: wire the twist into the episode"
```

---

### Task 14: The Coaches' Board — VP screen

**Files:**
- Create: `js/vp-coaches.js`
- Modify: `js/vp-screens.js`
- Test: `tests/vp-coaches.test.js`

**Interfaces:**
- Consumes: `ep.coachData`
- Produces: `rpBuildCoachBoard(ep)`, `coachRevealNext(key, total)`, `coachRevealAll(key, total)`

- [ ] **Step 1: Write the failing test**

```js
// @vitest-environment jsdom
// tests/vp-coaches.test.js
import { describe, expect, it } from 'vitest';
import { rpBuildCoachBoard } from '../js/vp-coaches.js';

const ep = {
  num: 4,
  coachData: {
    Red: {
      sessions: [{ coach: 'Julia', contestant: 'Evie', stat: 'endurance', gain: 0.8 }],
      passedOver: [{ coach: 'Julia', contestant: 'Finn' }],
    },
  },
};

describe('the coaches’ board', () => {
  it('draws the session that happened', () => {
    const html = rpBuildCoachBoard(ep);
    expect(html).toContain('Julia');
    expect(html).toContain('Evie');
    expect(html).toContain('endurance');
  });

  it('names who was passed over — the neglect is the story', () => {
    expect(rpBuildCoachBoard(ep)).toContain('Finn');
  });

  it('uses Total Drama words and no Big Brother ones', () => {
    const html = rpBuildCoachBoard(ep).toLowerCase();
    for (const wrong of ['evicted', 'nominated', 'houseguest', 'head of household', 'veto']) {
      expect(html, `${wrong} must never appear on a Total Drama screen`).not.toContain(wrong);
    }
  });

  it('renders nothing rather than throwing on an episode with no coaching', () => {
    expect(() => rpBuildCoachBoard({ num: 1 })).not.toThrow();
  });

  it('carries its own class prefix and a reduced-motion fallback', () => {
    const html = rpBuildCoachBoard(ep);
    expect(html).toMatch(/cb-/);
    expect(html).toMatch(/prefers-reduced-motion/);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/vp-coaches.test.js`
Expected: FAIL — cannot resolve `../js/vp-coaches.js`

- [ ] **Step 3: Write `js/vp-coaches.js`**

Build the board with the `cb-` prefix, following the pattern in
`js/chal/crazy-fun-time.js`:

- `_shell(content, ep)` wrapper carrying the CSS: a playbook and chalkboard
  world — drawn plays, hand-marked stat columns, chalk dust. Two fonts, its own
  palette, `max-width:1100px;margin:0 auto`, atmosphere at `top:46px` so it
  never covers `.rp-nav`, and `@media(prefers-reduced-motion:reduce)` disabling
  every animation.
- One step div per session: `id="cb-step-{suffix}-{i}"`, click-to-reveal via
  `_tvState`, `idx: -1` to start.
- Passed-over contestants render as a separate marked column, not as a card —
  the absence should look like an absence.
- A live sidebar `id="cb-sidebar-inner"` carrying the tribe's stat board, each
  coach's banked total and their standing with every contestant, rebuilt by
  `_updateSidebar()` from **both** `coachRevealNext` and `coachRevealAll`, and
  gated by `_tvState[key].idx` so it never shows a session not yet revealed.
- `_reapplyVisibility(suffix, upToIdx, total)` looping 0→idx on every click.
- Icons are CSS-drawn via a local `_icon(type)`. **No emoji.**

Register in `js/vp-screens.js`:

```js
import { rpBuildCoachBoard } from './vp-coaches.js';
// inside buildVPScreens, before the camp-events screen:
} else if (ep.isCoaches && ep.coachData) {
  vpScreens.push({ id:'cb-board', label:'Coaches', html: rpBuildCoachBoard(ep) });
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/vp-coaches.test.js`
Expected: PASS, 5 tests

- [ ] **Step 5: Render it and look at it**

Run the app, play an episode with the twist, and open the board. Assertions do
not tell you whether a screen is legible — this project has shipped features
that were written, wired, tested and drew nothing. Check the sidebar updates on
every click, that nothing is spoiled ahead, and that it does not cover the nav.

- [ ] **Step 6: Commit**

```bash
git add js/vp-coaches.js js/vp-screens.js tests/vp-coaches.test.js
git commit -m "coaches: the board, and what it costs to be left off it"
```

---

### Task 15: Fallout camp events

**Files:**
- Modify: `js/coach-episode.js`
- Test: `tests/coach-fallout.test.js`

**Interfaces:**
- Consumes: `runCoachingBlock` output from Task 6
- Produces: `coachFallout(ep, tribe, blockResult) -> campEvent[]`

- [ ] **Step 1: Write the failing test**

```js
// tests/coach-fallout.test.js
import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { addCoach } from '../js/coaches.js';
import { coachFallout } from '../js/coach-episode.js';

const stats = () => ({ physical:5,endurance:5,mental:5,social:5,strategic:5,loyalty:5,boldness:5,intuition:5,temperament:5 });

beforeEach(() => {
  setPlayers([
    { name: 'Julia', archetype: 'schemer', stats: stats() },
    { name: 'Evie', archetype: 'goat', stats: stats() },
    { name: 'Finn', archetype: 'villain', stats: stats() },
  ]);
  setGs({ activePlayers: ['Evie', 'Finn'], coaches: [], coachTraining: {}, bonds: {} });
  addCoach({ name: 'Julia', tribe: 'Red' });
});

const block = {
  sessions: [{ coach: 'Julia', contestant: 'Evie', stat: 'endurance', gain: 0.8 }],
  passedOver: [{ coach: 'Julia', contestant: 'Finn' }],
};

describe('the fallout', () => {
  it('produces events for both halves', () => {
    const out = coachFallout({ num: 4 }, { tribeName: 'Red', members: ['Evie', 'Finn'] }, block);
    expect(out.length).toBeGreaterThan(0);
  });

  it('gives every event the players it is about', () => {
    const out = coachFallout({ num: 4 }, { tribeName: 'Red', members: ['Evie', 'Finn'] }, block);
    for (const e of out) {
      expect(Array.isArray(e.players), 'a camp event without players is not one').toBe(true);
      expect(e.players.length).toBeGreaterThan(0);
      expect(e.badgeText, 'every camp event needs an explicit badge').toBeTruthy();
      expect(e.badgeClass).toBeTruthy();
    }
  });

  it('never prints another show’s vocabulary', () => {
    const out = coachFallout({ num: 4 }, { tribeName: 'Red', members: ['Evie', 'Finn'] }, block);
    const text = out.map(e => e.text).join(' ').toLowerCase();
    for (const wrong of ['evicted', 'nominated', 'houseguest', 'veto']) {
      expect(text).not.toContain(wrong);
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/coach-fallout.test.js`
Expected: FAIL — `coachFallout is not a function`

- [ ] **Step 3: Append to `js/coach-episode.js`**

Write `coachFallout(ep, tribe, blockResult)` returning camp events. The board
shows the session; these are what it caused, so they must not restate it:

- **positive** — a breakthrough, a contestant defending their coach unprompted,
  a bond formed
- **negative** — the passed-over contestant noticing, two protégés comparing
  notes, a poached protégé caught between coaches, bad advice detonating

Four or more text variants per category, chosen with `pick()`. Every event
carries `players: []`, `badgeText`, `badgeClass`, and a real consequence —
`addBond`, a popularity delta, or a state change. Take every noun from
`showWords('total-drama')`; nothing here may print a nomination or an eviction.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/coach-fallout.test.js`
Expected: PASS, 3 tests

- [ ] **Step 5: Commit**

```bash
git add js/coach-episode.js tests/coach-fallout.test.js
git commit -m "coaches: the board shows the session, camp shows what it cost"
```

---

### Task 16: Text backlog

**Files:**
- Modify: `js/text-backlog.js`
- Test: `tests/coach-backlog.test.js`

**Interfaces:**
- Consumes: `rpBuildCoachBoard` from Task 14
- Produces: coaching narration inside `generateSummaryText()`

- [ ] **Step 1: Write the failing test**

```js
// tests/coach-backlog.test.js
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('the coaching reaches the backlog', () => {
  it('renders the board through the generic twist renderer', () => {
    const backlog = readFileSync('js/text-backlog.js', 'utf8');
    expect(backlog).toMatch(/rpBuildCoachBoard/);
    expect(backlog).toMatch(/_textTwistChallenge\([^)]*coachData/);
  });

  it('comes before the camp post section', () => {
    // A backlog that trails the camp events reads the episode out of order.
    const backlog = readFileSync('js/text-backlog.js', 'utf8');
    expect(backlog.indexOf('rpBuildCoachBoard')).toBeLessThan(backlog.indexOf('_textCampPost'));
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/coach-backlog.test.js`
Expected: FAIL — no reference to `rpBuildCoachBoard`

- [ ] **Step 3: Wire it in `js/text-backlog.js`**

```js
import { rpBuildCoachBoard } from './vp-coaches.js';

// inside generateSummaryText(), in the twist block, BEFORE _textCampPost:
if (ep.coachData) {
  _textTwistChallenge(ep, ln, sec, 'coachData', 'COACHING', [rpBuildCoachBoard]);
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/coach-backlog.test.js`
Expected: PASS, 2 tests

- [ ] **Step 5: Dump a real backlog and read it**

Play a season with the twist, generate the summary text, and read the coaching
section end to end. Every prose bug in this project has been found this way and
none by a test. Look for: the wrong show's words, a coach named as competing, a
session with no consequence, and repetition across episodes.

- [ ] **Step 6: Commit**

```bash
git add js/text-backlog.js tests/coach-backlog.test.js
git commit -m "coaches: the board, retranscribed"
```

---

### Task 17: A season end to end

**Files:**
- Test: `tests/coach-season.test.js`

**Interfaces:**
- Consumes: everything

- [ ] **Step 1: Write the failing test**

```js
// tests/coach-season.test.js
import { describe, expect, it } from 'vitest';

// Uses the headless season harness — see tests/full-season-audit.test.js for
// the bootstrap this copies.
describe('a season with coaches', () => {
  it('never lets a coach appear in a challenge result', async () => {
    const season = await runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2 });
    for (const ep of season.episodes) {
      const scored = Object.keys(ep.chalMemberScores || {});
      for (const coach of season.coachNames) {
        expect(scored, `${coach} competed in episode ${ep.num}`).not.toContain(coach);
      }
    }
  });

  it('never records a vote cast by a coach', async () => {
    const season = await runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2 });
    for (const ep of season.episodes) {
      for (const v of (ep.votes || [])) {
        expect(season.coachNames, `${v.voter} cast a ballot`).not.toContain(v.voter);
      }
    }
  });

  it('lets a coach be voted out', async () => {
    const seasons = await Promise.all(Array.from({ length: 20 }, () =>
      runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2 })));
    const anyBooted = seasons.some(s => s.episodes.some(e => s.coachNames.includes(e.eliminated)));
    expect(anyBooted, 'in 20 seasons no coach was ever voted out').toBe(true);
  });

  it('does not let coaches be booted every single time either', async () => {
    // The free-boot problem, measured. If a coach is the first elimination in
    // nearly every season, the training cost and the awe are not biting.
    const seasons = await Promise.all(Array.from({ length: 20 }, () =>
      runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2 })));
    const firstBootWasCoach = seasons.filter(s =>
      s.coachNames.includes(s.episodes.find(e => e.eliminated)?.eliminated)).length;
    expect(firstBootWasCoach, `${firstBootWasCoach}/20 first boots were coaches`).toBeLessThan(14);
  });

  it('promotes whoever survived to the merge', async () => {
    const season = await runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2 });
    const merged = season.episodes.find(e => e.coachPromotions);
    if (!merged) return;   // every coach was voted out; a legitimate season
    for (const p of merged.coachPromotions) {
      expect(season.finalActivePlayers).toContain(p.name);
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/coach-season.test.js`
Expected: FAIL — `runHeadlessSeason is not defined`

- [ ] **Step 3: Build on the existing harness**

Copy the bootstrap from `tests/full-season-audit.test.js`, which already runs
headless seasons in vitest + jsdom, and add a `coachesPerTribe` option that
calls `addCoach` for the named coaches after the cast is built.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/coach-season.test.js`
Expected: PASS, 5 tests

- [ ] **Step 5: Read the balance numbers**

The fourth test is the one that matters. If nearly every first boot is a coach,
the twist has the failure the spec is built to prevent, and the tuning levers
are: the training cost (raise `sessionGain`), awe (raise `AWE_BIAS` for the
receptive archetypes), or session scarcity (`sessionsFor`).

- [ ] **Step 6: Commit**

```bash
git add tests/coach-season.test.js
git commit -m "coaches: measure the free-boot problem across twenty seasons"
```

---

## Self-Review Notes

Checked against the spec:

- Architecture, state, attention, fame, agendas, advantages law, vote, save
  card, elimination, promotion, VP, camp fallout, text backlog — all covered.
- **The Challenge section of the spec is only half implemented.** Task 7 lands
  the training bonus, but the pre-challenge "read" and the coach-named reaction
  beat are not built. Both are additive and neither blocks anything; they
  belong in a follow-up rather than being smuggled in as a step nobody tested.
- **Coach Against Coach is not built.** The spec describes non-aggression,
  trades and taking-the-fall pacts. Poaching falls out of Task 5 for free
  (a villain's bias sends him at whoever a rival trained), but the deal channel
  does not. Follow-up.
- Types are consistent: `bankTraining` returns the amount taken everywhere it
  is called; `trainingBonus(contestant, stat)` keeps that argument order in
  Tasks 2, 7, 12; `runCoachingBlock(ep, tribe, roll)` matches its call in
  Task 13.
