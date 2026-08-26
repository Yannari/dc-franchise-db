# The Traitors — Plan 3: Murder, the conclave, and recruitment

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder murder with a conclave that argues, gets it wrong, and leaves a trail — and let a Faithful change sides mid-season.

**Architecture:** A new `js/tr/murder.js` forms a per-Traitor preference, resolves it socially rather than correctly, and records who overruled whom. `js/tr/roles.js` gains recruitment, which mutates alignment mid-season and finally exercises the era model Plan 1 built. `js/tr/deduction.js` gains evidence source ② — murder-shaped inference — and the calibration re-measures everything, because the placebo-controlled gate from Plan 2 is now measuring a different game.

**Tech Stack:** ES modules, no build step. Vitest.

**Spec:** `docs/superpowers/specs/2026-08-25-traitors-design.md` — §6 is this plan. §7 (missions, powers) and §8 (endgame) are NOT.

## What Plan 2 left standing, and this plan must honour

- **The credibility ceiling.** Exactly two `public` alignment writes exist in the whole engine: `seedTraitorKnowledge` and `revealCascade`. **This plan adds a third legitimate one and no more** — a recruit learns their recruiter's alignment with certainty, because they are standing in the turret. Any other route breaks the format silently.
- **The gate is placebo-controlled.** Bands: `rate > 0.22`, `earlyLift < +5pp`, `lateLift > +15pp`, engine board precision > placebo + 0.15, engine growth > worst-k placebo growth + 5pp. The aggregate lift is a **logged diagnostic, never a gate** — it rewards belief coverage and is raised by injecting pure noise.
- **Never widen a band.** Every band in this plan's Task 7 is inherited. If one fails, fix the design or report it.
- **Deduplication.** Plan 2 deleted `ballotEvidence`'s re-walk of past reveals because re-learning the same fact strips the protective valence off innocents (`learn()` overwrites valence on a re-roll). **Do not reintroduce that shape.** Murder evidence must be emitted once, when it becomes knowable.

## Global Constraints

- **Branch `traitors`, worktree `../worktree-traitors`.** The main folder is on `main` with another session live in it. Never `git checkout` there.
- **`git add <explicit paths>`, never `-A`.** `git status --short` AND `git branch --show-current` before every commit.
- **Before committing, run the touched-file sweep and run what it prints:**
  ```bash
  for f in $(git diff --name-only); do grep -rl "$(basename "$f")" tests/ 2>/dev/null; done | sort -u
  ```
- **Never the full suite** (`npm test`) — it exhausts memory. Named files only; kill orphan vitest workers after (filter on `vitest` in the command line, never all `node.exe`).
- **No bare `Math.random()` in `js/tr/`.** Every draw takes an injected `rng`.
- **Valid stats, the only nine:** `physical`, `endurance`, `mental`, `social`, `strategic`, `loyalty`, `boldness`, `intuition`, `temperament`.
- **The show stays NOT runnable.** Do not set `window._trRunnable`.
- **Do not touch `_assess()` in `js/knowledge.js`.** Its ground-truth valence is intended design (spec §4.2), an intuition model.
- **Ask of every test: does this assert a property, or one draw of a coin?** Plan 2 shipped four tests that asserted luck. If an outcome depends on a probabilistic read, make it a population assertion over many seeds, set the bar below the measured rate with headroom, and log the rate.
- **Every seed-search loop must start each attempt from a genuinely fresh world** — `setGs` + `initTraitorsState` + `resetKnowledge`. A half-reset leaks beliefs and silently inflates results.

---

## File structure

| File | Responsibility | Task |
|---|---|---|
| `js/tr/murder.js` | Conclave: preference, argument, tension, target choice, Shields | 1,2,3 |
| `js/tr/deduction.js` | Evidence source ②: murder-shaped inference | 4 |
| `js/tr/roles.js` | Recruitment, the ultimatum, eras in anger | 5 |
| `js/tr/exit.js` | The banished player's speech, generated from their beliefs | 6 |
| `js/tr/headless.js` | Placeholder murder deleted; real conclave wired in | 7 |
| `js/tr/state.js` | `conclaveTension` shape, `loyaltyDebt` | 1,5 |
| `tests/tr-murder.test.js` | New | 1,2,3,4 |
| `tests/tr-recruitment.test.js` | New | 5,6 |
| `tests/tr-calibration.test.js` | Re-measured | 7 |

---

### Task 1: The conclave is an argument, not a calculation

**Files:** Create `js/tr/murder.js`; modify `js/tr/state.js`; create `tests/tr-murder.test.js`

**Interfaces:**
- Consumes: `livingTraitors`, `livingFaithfuls` from `js/tr/roles.js`; `pStats`, `getBond`. **Deliberately imports NOTHING from `js/tr/deduction.js`** — a Traitor reasons from public behaviour (who said their name out loud, who the room voted for), never from anyone's private beliefs. That restriction is the design, and keeping the import list empty is what enforces it.
- Produces: `formPreference(traitor, ep, rng) → { target, reason, conviction }`, `runConclave(ep, rng) → { decision, target, reason, decidedBy, argued[], overruled[] }`.

**The design (spec §6.2), and why it is not an optimiser:** nothing computes a best target. Each Traitor forms *their own* preference, weighted by *their own* read quality — `strategic` and `intuition` decide how well they weigh the tool-allocation logic, `boldness` how aggressive, their own bonds who they cannot bring themselves to name. **A low-`strategic` Traitor genuinely picks badly and nothing corrects them.** The room then resolves it *socially* — `social`, bond, and standing — so the best read in the room loses regularly. Disagreement writes `conclaveTension`: a ledger of who overruled whom on which night, which is what gives the endgame betrayal a date rather than a schedule.

- [ ] **Step 1: Extend the state**

In `js/tr/state.js`, `conclaveTension` is declared but shapeless. Replace its comment and give it a shape:

```js
    // Who overruled whom at the conclave, and on which night:
    //   [{ ep, winner, loser, target, theirTarget }]
    // Not a mood. By episode 8 there is not a set of three Traitors but a
    // faction with a history, and the endgame betrayal has a DATE attached
    // rather than a schedule. Read by the exit blowup and (later) the endgame.
    conclaveTension: [],
```

Note this changes the type from `{}` to `[]`. Update any assertion in `tests/traitors-registry.test.js` that pins the old shape — and if none exists, add one.

- [ ] **Step 2: Write the failing test**

Create `tests/tr-murder.test.js`:

```js
// The conclave is where the Traitors get it wrong.
//
// Nothing here computes an optimal target. Each Traitor forms their own
// preference from their own read, the room resolves it on social weight rather
// than correctness, and the loser remembers. That last part is the point: by
// the endgame there is not a set of Traitors but a faction with a history, and
// this file is where the history is written.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { resetKnowledge } from '../js/knowledge.js';
import { recordAlignment } from '../js/tr/roles.js';
import { seedTraitorKnowledge } from '../js/tr/deduction.js';
import { formPreference, runConclave } from '../js/tr/murder.js';
import { setBond } from '../js/bonds.js';
import roster from '../franchise_roster.json';

const CAST = roster.players.slice(0, 10).map(p => p.name);
const TRAITORS = CAST.slice(0, 3);
function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function world(cast = CAST, traitors = TRAITORS) {
  setPlayers(roster.players.slice(0, 10));
  setGs({ bonds: {}, activePlayers: [...cast] });
  gs.tr = initTraitorsState();
  resetKnowledge();
  traitors.forEach(n => recordAlignment(n, true, 1, 'selection'));
  cast.filter(n => !traitors.includes(n)).forEach(n => recordAlignment(n, false, 1, 'selection'));
  seedTraitorKnowledge(1);
}

beforeEach(() => world());

describe('each traitor forms their own preference', () => {
  it('never names a fellow traitor', () => {
    for (const t of TRAITORS) {
      const p = formPreference(t, 2, seededRng(5));
      expect(TRAITORS, `${t} wanted to murder a fellow traitor`).not.toContain(p.target);
    }
  });

  it('gives a reason, because the reason drives the consequence', () => {
    const p = formPreference(TRAITORS[0], 2, seededRng(5));
    expect(typeof p.reason).toBe('string');
    expect(p.reason.length).toBeGreaterThan(0);
  });

  it('does not all agree — the room has to argue about something', () => {
    // Population, not one draw: preference is stat-weighted with noise.
    let disagreed = 0;
    for (let s = 1; s <= 60; s++) {
      world();
      const picks = TRAITORS.map(t => formPreference(t, 2, seededRng(s)).target);
      if (new Set(picks).size > 1) disagreed++;
    }
    const rate = disagreed / 60;
    console.log(`[population] conclaves with a genuine disagreement: ${(rate * 100).toFixed(1)}%`);
    expect(rate, 'the traitors always want the same person — nothing to argue about')
      .toBeGreaterThan(0.5);
  });

  it('a traitor will not name someone they are close to', () => {
    const t = TRAITORS[0];
    const cold = formPreference(t, 2, seededRng(9)).target;
    world();
    setBond(t, cold, 9);
    const warm = formPreference(t, 2, seededRng(9)).target;
    expect(warm, 'a close friend was named exactly as readily as a stranger').not.toBe(cold);
  });
});

describe('the room resolves it socially, not correctly', () => {
  it('records who was overruled, and on which night', () => {
    const r = runConclave(3, seededRng(11));
    expect(r.target).toBeTruthy();
    expect(TRAITORS).not.toContain(r.target);
    expect(Array.isArray(r.argued)).toBe(true);
    expect(r.argued.length).toBe(TRAITORS.length);
    for (const o of r.overruled) {
      expect(o).toMatchObject({ ep: 3, target: r.target });
      expect(o.theirTarget).not.toBe(r.target);
    }
  });

  it('writes the overrule to the season ledger, not just the return value', () => {
    runConclave(3, seededRng(11));
    if (gs.tr.conclaveTension.length) {
      expect(gs.tr.conclaveTension[0]).toHaveProperty('winner');
      expect(gs.tr.conclaveTension[0]).toHaveProperty('loser');
      expect(gs.tr.conclaveTension[0].ep).toBe(3);
    }
  });

  it('the loudest traitor does not always win — that would be a calculation', () => {
    let winners = new Set();
    for (let s = 1; s <= 60; s++) {
      world();
      const r = runConclave(3, seededRng(s));
      if (r.decidedBy) winners.add(r.decidedBy);
    }
    expect(winners.size, 'the same traitor decides every single conclave').toBeGreaterThan(1);
  });

  it('a lone traitor argues with nobody and still picks', () => {
    world(CAST, [CAST[0]]);
    const r = runConclave(3, seededRng(4));
    expect(r.target).toBeTruthy();
    expect(r.overruled).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-murder.test.js
```
Expected: FAIL — cannot resolve `js/tr/murder.js`.

- [ ] **Step 4: Write `js/tr/murder.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// tr/murder.js — the conclave, and the trail it leaves
// ══════════════════════════════════════════════════════════════════════
//
// Nothing in this file computes a best target, and that is deliberate. If it
// did, every season would be the same season: three optimisers agreeing, a
// clean kill every night, and no reason for the Traitors ever to fall out.
//
// Instead each Traitor forms their OWN preference from their OWN read quality,
// the room resolves the disagreement on social weight rather than on who is
// right, and the loser remembers. That last part is why the endgame betrayal
// has a date on it instead of a schedule.
import { gs } from '../core.js';
import { pStats } from '../players.js';
import { getBond } from '../bonds.js';
import { livingTraitors, livingFaithfuls } from './roles.js';

/**
 * One Traitor's private opinion about who should die tonight.
 *
 * `conviction` is how hard they will push it in the room, and it comes from
 * their own confidence rather than from whether they are right — a certain
 * fool argues harder than a hesitant strategist, which is the whole reason the
 * room can make a bad decision.
 */
export function formPreference(traitor, ep, rng = Math.random) {
  const targets = livingFaithfuls(ep).filter(n => n !== traitor);
  if (!targets.length) return { target: null, reason: 'nobody left', conviction: 0 };
  const st = pStats(traitor);
  const read = ((st.strategic || 5) * 0.6 + (st.intuition || 5) * 0.4) / 10;

  const scored = targets.map(name => {
    const ts = pStats(name);
    // TOOL ALLOCATION, the format's own logic: murder is for the people the
    // table will never remove. A beloved, obviously-Faithful player can only
    // be taken this way — and a SUSPICIOUS Faithful is worth more alive,
    // because the table will spend itself on them for free.
    const beloved = ((ts.social || 5) / 10);
    const heat = _publicHeatAgainst(name, ep);      // how suspected they already are
    let score = beloved * 1.1 - heat * 1.3;

    // The one who is onto them. Read off PUBLIC behaviour only — a Traitor
    // cannot see beliefs, only who has been saying their name out loud.
    score += _accusedMe(traitor, name, ep) * 1.4;

    // How well they weigh any of it. A poor read flattens the whole
    // calculation toward noise, which is how a bad Traitor picks badly.
    score *= 0.4 + read * 0.6;

    // Never someone they visibly clashed with — the room connects it by
    // breakfast — and never someone they cannot bring themselves to name.
    const bond = getBond(traitor, name);
    if (bond > 0) score -= (bond / 10) * 0.9;
    if (bond < -4) score -= 0.6;

    return { name, score: score + rng() * 0.5 };
  }).sort((a, b) => b.score - a.score);

  const pick = scored[0];
  return {
    target: pick.name,
    reason: _reasonFor(traitor, pick.name, ep),
    conviction: Math.max(0.1, Math.min(1, (pick.score - (scored[1]?.score ?? 0)) + read * 0.5)),
  };
}

/** How much heat this player is already carrying in public. */
function _publicHeatAgainst(name, ep) {
  const rounds = gs.tr?.rounds || [];
  const recent = rounds.slice(-2);
  let votes = 0, ballots = 0;
  for (const r of recent) {
    for (const b of (r.ballots || [])) {
      if (b.channel !== 'banishment') continue;
      ballots++;
      if (b.voted === name) votes++;
    }
  }
  return ballots ? votes / ballots : 0;
}

/** Has `name` publicly named `traitor` at a Round Table? Public information only. */
function _accusedMe(traitor, name, ep) {
  const rounds = gs.tr?.rounds || [];
  let hits = 0;
  for (const r of rounds) {
    if ((r.accusations || []).some(a => a.accuser === name && a.target === traitor)) hits++;
    if ((r.ballots || []).some(b => b.voter === name && b.voted === traitor)) hits++;
  }
  return Math.min(1, hits * 0.5);
}

/** Why this name, in words the VP and the evidence layer can both read. */
function _reasonFor(traitor, name, ep) {
  if (_accusedMe(traitor, name, ep) > 0) return 'onto-me';
  if (_publicHeatAgainst(name, ep) > 0.25) return 'wasted-decoy';  // a bad reason, deliberately reachable
  const ts = pStats(name);
  if ((ts.social || 5) >= 7) return 'beloved';
  return 'convenient';
}

/**
 * The argument, and its result.
 *
 * Resolved on social weight and conviction — NOT on whose read is better. The
 * best read in the room loses regularly, and that is the mechanism by which
 * the Traitors murder the wrong person and then have to live with each other.
 */
export function runConclave(ep, rng = Math.random) {
  const traitors = livingTraitors(ep);
  if (!traitors.length) return { decision: 'none', target: null, argued: [], overruled: [] };

  const argued = traitors.map(t => ({ traitor: t, ...formPreference(t, ep, rng) }))
    .filter(p => p.target);
  if (!argued.length) return { decision: 'none', target: null, argued: [], overruled: [] };

  const weighted = argued.map(p => ({
    ...p,
    weight: ((pStats(p.traitor).social || 5) / 10) * 0.7 + p.conviction * 0.5 + rng() * 0.4,
  })).sort((a, b) => b.weight - a.weight);

  const winner = weighted[0];
  const overruled = weighted.slice(1)
    .filter(p => p.target !== winner.target)
    .map(p => ({ ep, winner: winner.traitor, loser: p.traitor,
      target: winner.target, theirTarget: p.target }));

  // The ledger. "I told you not to kill her" needs a night attached to it.
  (gs.tr.conclaveTension ||= []).push(...overruled);

  return { decision: 'murder', target: winner.target, reason: winner.reason,
    decidedBy: winner.traitor, argued, overruled };
}
```

- [ ] **Step 5: Run, then commit**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-murder.test.js tests/traitors-registry.test.js
for f in $(git diff --name-only); do grep -rl "$(basename "$f")" tests/ 2>/dev/null; done | sort -u
git branch --show-current && git status --short
git add js/tr/murder.js js/tr/state.js tests/tr-murder.test.js tests/traitors-registry.test.js
git commit -m "The conclave argues, and the loser remembers the date"
```

---

### Task 2: A wrong target costs something specific

**Files:** Modify `js/tr/murder.js`; append to `tests/tr-murder.test.js`

**Interfaces:** Produces `murderCost(target, reason, ep) → { kind, cost, blames }`.

**The design (spec §6.4):** each mistake has its own downstream consequence, and they are different consequences. This is what makes the conclave's badness legible instead of merely random.

| Mistake | Cost |
|---|---|
| Killed someone due to be banished tomorrow | Wasted; the table must now hunt properly |
| Killed a **suspicious** Faithful | Own decoy destroyed; the votes have nowhere safe to land |
| Killed someone who visibly clashed with Traitor X | **X takes suspicion directly** |
| Killed someone who had been defending X | X loses cover and does not realise until the next table |

- [ ] **Step 1: Write the failing test**

Append to `tests/tr-murder.test.js`:

```js
import { murderCost } from '../js/tr/murder.js';
import { recordRound } from '../js/tr/deduction.js';

describe('what a bad murder costs', () => {
  it('names the decoy the traitors just destroyed', () => {
    // A Faithful the room was already voting for is worth more alive.
    recordRound({ ep: 2, banished: null, banishedWasTraitor: false, murdered: null,
      ballots: CAST.map(v => ({ voter: v, voted: CAST[5], channel: 'banishment' })) });
    const c = murderCost(CAST[5], 'wasted-decoy', 3);
    expect(c.kind).toBe('decoy-destroyed');
    expect(c.cost).toBeGreaterThan(0);
  });

  it('points suspicion at the traitor who had visibly clashed with the victim', () => {
    setBond(TRAITORS[0], CAST[6], -8);
    const c = murderCost(CAST[6], 'convenient', 3);
    expect(c.kind).toBe('clash-traced');
    expect(c.blames).toContain(TRAITORS[0]);
  });

  it('says nothing interesting about a clean kill', () => {
    const c = murderCost(CAST[7], 'beloved', 3);
    expect(c.kind).toBe('clean');
    expect(c.blames).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run it and watch it fail.** `npx vitest run tests/tr-murder.test.js -t 'what a bad murder costs'`

- [ ] **Step 3: Implement**

Append to `js/tr/murder.js`:

```js
/**
 * What this particular murder cost the Traitors.
 *
 * Not a score — a NAMED consequence, because the whole point of letting the
 * conclave be wrong is that the audience can see which wrong thing it did. A
 * flat "bad kill" penalty would be indistinguishable from noise.
 *
 * `blames` is the list of Traitors the room can legitimately reason toward
 * from this kill alone. Task 4 turns it into evidence; nothing else may.
 */
export function murderCost(target, reason, ep) {
  const heat = _publicHeatAgainst(target, ep);

  // The room was already spending itself on this person. Killing them hands
  // the Faithfuls their votes back and forces them to hunt properly.
  if (heat > 0.25) return { kind: 'decoy-destroyed', cost: heat, blames: [] };

  // A Traitor who visibly hated the victim is the first name the room reaches
  // for at breakfast, and it is reaching correctly.
  const clashed = livingTraitors(ep).filter(t => getBond(t, target) <= -6);
  if (clashed.length) return { kind: 'clash-traced', cost: 0.5, blames: clashed };

  return { kind: 'clean', cost: 0, blames: [] };
}
```

- [ ] **Step 4: Run, then commit**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-murder.test.js
git branch --show-current && git status --short
git add js/tr/murder.js tests/tr-murder.test.js
git commit -m "A bad kill costs something the room can name"
```

---

### Task 3: Shields, and the murder that kills nobody

**Files:** Modify `js/tr/murder.js`, `js/tr/state.js`; append to `tests/tr-murder.test.js`

**Interfaces:** Produces `grantShield(name, ep)`, `isShielded(name)`, `resolveMurder(ep, rng) → { target, blocked, victim, cost }`.

**Why the blocked murder matters more than the Shield (spec §6.5):** nobody dies, every chair is full at breakfast, and the room learns that **the Traitors tried and hit a Shield.** That narrows who they wanted, confirms a Shield was live, and hands a high-`mental` player a genuine counting argument. It is one of the best deduction sources in the format, it is free, and it is easy to forget to fire.

Shields are won in missions (Plan 5). Until then this task provides the mechanism and the test grants them directly.

- [ ] **Step 1: Write the failing test**

Append to `tests/tr-murder.test.js`:

```js
import { grantShield, isShielded, resolveMurder } from '../js/tr/murder.js';

describe('the shield, and the night nobody dies', () => {
  it('blocks the murder and kills nobody', () => {
    const r1 = resolveMurder(3, seededRng(7));
    world();
    grantShield(r1.target, 3);
    const r2 = resolveMurder(3, seededRng(7));
    expect(r2.target).toBe(r1.target);
    expect(r2.blocked).toBe(true);
    expect(r2.victim).toBeNull();
    expect(gs.activePlayers).toContain(r1.target);
  });

  it('is spent even when it blocks — it does not carry over', () => {
    const t = resolveMurder(3, seededRng(7)).target;
    world();
    grantShield(t, 3);
    resolveMurder(3, seededRng(7));
    expect(isShielded(t)).toBe(false);
  });

  it('records the blocked attempt, because the room can see nobody died', () => {
    const t = resolveMurder(3, seededRng(7)).target;
    world();
    grantShield(t, 3);
    const r = resolveMurder(3, seededRng(7));
    expect(r.blocked).toBe(true);
    expect(gs.tr.blockedMurders).toContainEqual(expect.objectContaining({ ep: 3 }));
  });

  it('an unshielded murder removes exactly one living faithful', () => {
    const before = [...gs.activePlayers];
    const r = resolveMurder(3, seededRng(7));
    expect(r.blocked).toBe(false);
    expect(gs.activePlayers).toHaveLength(before.length - 1);
    expect(gs.activePlayers).not.toContain(r.victim);
    expect(TRAITORS).not.toContain(r.victim);
  });
});
```

- [ ] **Step 2: Run it and watch it fail.**

- [ ] **Step 3: Extend state**

In `js/tr/state.js`, add beside `shieldedThisRound`:

```js
    // Nights the Traitors struck and nobody died: [{ ep, target }].
    // The TARGET is stored because the VP shows it — the audience knows who
    // was nearly murdered. The room does not, and must not: only the FACT of
    // a blocked attempt is public, which is what Task 4 reads.
    blockedMurders: [],
```

- [ ] **Step 4: Implement**

Append to `js/tr/murder.js`:

```js
/** Won in a mission (Plan 5). Protects against the NEXT murder only. */
export function grantShield(name, ep) {
  if (!gs.tr) return;
  if (!(gs.tr.shieldedThisRound instanceof Set)) gs.tr.shieldedThisRound = new Set(gs.tr.shieldedThisRound || []);
  gs.tr.shieldedThisRound.add(name);
}

export function isShielded(name) {
  const s = gs.tr?.shieldedThisRound;
  return s instanceof Set ? s.has(name) : (s || []).includes(name);
}

/**
 * Run the conclave and carry out the decision.
 *
 * A blocked murder is not a non-event. Nobody dies, every chair is full at
 * breakfast, and the room learns the Traitors TRIED and hit a Shield — which
 * narrows who they wanted and proves a Shield was live. That is one of the
 * strongest deduction sources the format has, and it costs nothing except
 * remembering to record it.
 */
export function resolveMurder(ep, rng = Math.random) {
  const decision = runConclave(ep, rng);
  if (!decision.target) return { target: null, blocked: false, victim: null, cost: null };

  const target = decision.target;
  const cost = murderCost(target, decision.reason, ep);

  if (isShielded(target)) {
    gs.tr.shieldedThisRound.delete(target);   // spent even though it blocked
    (gs.tr.blockedMurders ||= []).push({ ep, target });
    return { target, blocked: true, victim: null, cost, decision };
  }

  gs.activePlayers = (gs.activePlayers || []).filter(n => n !== target);
  return { target, blocked: false, victim: target, cost, decision };
}
```

- [ ] **Step 5: Run, then commit**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-murder.test.js
git branch --show-current && git status --short
git add js/tr/murder.js js/tr/state.js tests/tr-murder.test.js
git commit -m "The night nobody dies tells the room the most"
```

---

### Task 4: Evidence source ② — murder-shaped inference

**Files:** Modify `js/tr/deduction.js`; append to `tests/tr-murder.test.js`

**Interfaces:** Produces `murderEvidence(ep, rng)`.

**The design (spec §4.4 ②) — the strongest logic in the format:**
- **You pushed X's name at the table, and X died that night.** You had reason to want them gone before anyone else did.
- **The victim was whoever was closest to catching someone.**
- **A blocked murder** proves a Shield was live and narrows the field.
- **`murderCost.blames`** — a Traitor who visibly clashed with the victim.

**THE RULE PLAN 2 PAID FOR:** emit each inference **exactly once**, when it becomes knowable. Do **not** re-walk history every round. Re-learning the same fact overwrites the protective valence of innocents (`learn()` overwrites on a re-roll at `confidence × 0.6`) and makes the room *worse*. Plan 2 deleted exactly that shape from `ballotEvidence` and it was worth 0.20–0.23× of lift.

- [ ] **Step 1: Write the failing test**

Append to `tests/tr-murder.test.js`:

```js
import { murderEvidence } from '../js/tr/deduction.js';
import { suspicion } from '../js/tr/deduction.js';

describe('reading the murder', () => {
  it('suspects whoever pushed the victim right before the victim died', () => {
    // Population — the read runs through _assess and is probabilistic.
    let hits = 0;
    const N = 100;
    for (let s = 1; s <= N; s++) {
      world();
      const victim = CAST[8], pusher = CAST[4], quiet = CAST[7];
      recordRound({ ep: 2, banished: null, banishedWasTraitor: false, murdered: victim,
        ballots: [{ voter: pusher, voted: victim, channel: 'banishment' },
                  { voter: quiet,  voted: CAST[9], channel: 'banishment' }],
        accusations: [{ accuser: pusher, target: victim }] });
      gs.activePlayers = CAST.filter(n => n !== victim);
      murderEvidence(3, seededRng(s));
      if (suspicion(CAST[3], pusher, 3) > suspicion(CAST[3], quiet, 3)) hits++;
    }
    const rate = hits / N;
    console.log(`[population] pusher out-suspected the quiet player: ${(rate * 100).toFixed(1)}%`);
    expect(rate, 'pushing a name the night the name died bought no suspicion at all')
      .toBeGreaterThan(0.15);
  });

  it('emits each murder exactly once, never re-walking history', () => {
    const victim = CAST[8];
    recordRound({ ep: 2, banished: null, banishedWasTraitor: false, murdered: victim,
      ballots: [{ voter: CAST[4], voted: victim, channel: 'banishment' }],
      accusations: [{ accuser: CAST[4], target: victim }] });
    gs.activePlayers = CAST.filter(n => n !== victim);
    const first = murderEvidence(3, seededRng(2));
    const second = murderEvidence(4, seededRng(2));
    expect(second.filter(e => e.ep === 2), 'episode 2 was re-read in episode 4').toHaveLength(0);
  });

  it('never breaks the credibility ceiling', () => {
    const victim = CAST[8];
    recordRound({ ep: 2, banished: null, banishedWasTraitor: false, murdered: victim,
      ballots: [{ voter: CAST[4], voted: victim, channel: 'banishment' }],
      accusations: [{ accuser: CAST[4], target: victim }] });
    gs.activePlayers = CAST.filter(n => n !== victim);
    murderEvidence(3, seededRng(2));
    for (const observer of gs.activePlayers) {
      for (const subject of gs.activePlayers) {
        expect(suspicion(observer, subject, 3)).toBeLessThan(0.63);
      }
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail.**

- [ ] **Step 3: Implement**

Append to `js/tr/deduction.js` (import `livingTraitors` is already there; you will need `gs.tr.blockedMurders`):

```js
// How loud each murder-shaped inference is. Smaller than the ballot weights on
// purpose: a murder is one data point a night, and the ballot record is many.
const M = {
  pushedThenDied:  0.30,   // you wanted them gone, and they went
  clashTraced:     0.36,   // murderCost named you
};

/**
 * Evidence source 2 — what a murder tells the room about the living.
 *
 * EMITTED EXACTLY ONCE, for the round that just happened. This is not a
 * stylistic choice: Plan 2 measured that re-walking history every round makes
 * the room WORSE, because learn() overwrites a belief's valence on a re-roll
 * and a protective 'false' is stored at x0.6 — so repetition strips protection
 * off precisely the innocent people the evidence indicts. Deleting that shape
 * from ballotEvidence was worth 0.20-0.23x of lift. Do not reintroduce it here.
 */
export function murderEvidence(ep, rng = Math.random) {
  const rounds = gs.tr?.rounds || [];
  const round = rounds[rounds.length - 1];
  // ONLY the round that just closed. `>= ep` would not be enough: it stops a
  // same-episode re-read but happily re-emits an OLD round every round after
  // it, which is precisely the re-walk Plan 2 deleted from ballotEvidence for
  // costing 0.20-0.23x of lift. The equality is the guard.
  if (!round || round.ep !== ep - 1) return [];
  const living = gs.activePlayers || [];
  const formed = [];

  // A blocked attempt is public: nobody died and everybody can count chairs.
  // It teaches that a Shield was live, which is information about the GAME
  // rather than about a person, so it forms no belief here — it is read by
  // the VP and by a later plan's counting argument. Recorded for both.
  const blocked = (gs.tr?.blockedMurders || []).some(b => b.ep === round.ep);

  if (round.murdered && !blocked) {
    // You pushed their name at the table, and that night they died.
    const pushers = new Set([
      ...(round.accusations || []).filter(a => a.target === round.murdered).map(a => a.accuser),
      ...(round.ballots || []).filter(b => b.channel === 'banishment' && b.voted === round.murdered)
        .map(b => b.voter),
    ]);
    for (const pusher of pushers) {
      if (!living.includes(pusher)) continue;
      for (const observer of living) {
        if (observer === pusher) continue;
        const belief = learn(observer, alignmentFactId(pusher), {
          source: `wanted ${round.murdered} gone the night ${round.murdered} died`,
          sourceType: 'deduced', confidence: M.pushedThenDied * 1.6, ep, rng,
        });
        if (belief) formed.push({ observer, subject: pusher, ep: round.ep, kind: 'pushed-then-died' });
      }
    }

    // murderCost named somebody: a Traitor who visibly hated the victim.
    for (const blamed of (round.murderCost?.blames || [])) {
      if (!living.includes(blamed)) continue;
      for (const observer of living) {
        if (observer === blamed) continue;
        const belief = learn(observer, alignmentFactId(blamed), {
          source: `made no secret of hating ${round.murdered}`,
          sourceType: 'deduced', confidence: M.clashTraced * 1.6, ep, rng,
        });
        if (belief) formed.push({ observer, subject: blamed, ep: round.ep, kind: 'clash-traced' });
      }
    }
  }

  return formed;
}
```

- [ ] **Step 4: Run, then commit**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-murder.test.js tests/tr-deduction.test.js
for f in $(git diff --name-only); do grep -rl "$(basename "$f")" tests/ 2>/dev/null; done | sort -u
git branch --show-current && git status --short
git add js/tr/deduction.js tests/tr-murder.test.js
git commit -m "Pushing a name the night that name dies is evidence"
```

---

### Task 5: Recruitment — a win condition changes mid-season

**Files:** Modify `js/tr/roles.js`, `js/tr/state.js`; create `tests/tr-recruitment.test.js`

**Interfaces:** Produces `canRecruit(ep)`, `chooseRecruit(ep, rng)`, `offerRecruitment(target, ep, rng, { mode }) → { accepted, mode, recruiter }`.

**The design (spec §6.6).** Available the night after a Traitor is banished. Murder **or** recruit — and if they recruit, **nobody dies that night regardless of the answer**.

Acceptance, all proportional: `loyalty` → refuse (the high-loyalty Faithful who dies for it); `boldness` and `strategic` → accept (it *is* protection plus information); bond with the recruiter → accept; **position** (someone accused at last night's table accepts, someone safe refuses); archetype leans (hero and loyal-soldier refuse; villain, schemer, mastermind accept).

**Two delivery modes, differing mechanically — this is the elegant part:**
- **By note** — anonymous. Refusal is survivable; the refuser never learned who asked. They do, however, now know a recruitment happened, which is information the room lacks.
- **The Ultimatum** — face-to-face, only with one Traitor left. Accept or be murdered on the spot, **because they have seen your face.** Refusal must be fatal.

**This task finally exercises the era model.** `truthAtLearn()` has existed since Plan 1 with no production caller. After a flip, a belief formed in episode 3 was *correct when formed*, and nothing may retroactively mark it wrong.

**The third and last legitimate `public` write:** a recruit who accepts learns their recruiter's alignment with certainty — they are standing in the turret. Add no other.

- [ ] **Step 1: Write the failing test**

Create `tests/tr-recruitment.test.js`:

```js
// Recruitment is the only thing in this engine that changes what a player is
// trying to win. Everything else moves beliefs; this moves the truth.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { resetKnowledge, believes } from '../js/knowledge.js';
import { recordAlignment, alignmentAt, truthAtLearn, canRecruit, offerRecruitment, chooseRecruit }
  from '../js/tr/roles.js';
import { alignmentFactId, seedTraitorKnowledge, recordRound } from '../js/tr/deduction.js';
import roster from '../franchise_roster.json';

const CAST = roster.players.slice(0, 10).map(p => p.name);
function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function world(traitors = CAST.slice(0, 2)) {
  setPlayers(roster.players.slice(0, 10));
  setGs({ bonds: {}, activePlayers: [...CAST] });
  gs.tr = initTraitorsState();
  resetKnowledge();
  traitors.forEach(n => recordAlignment(n, true, 1, 'selection'));
  CAST.filter(n => !traitors.includes(n)).forEach(n => recordAlignment(n, false, 1, 'selection'));
  seedTraitorKnowledge(1);
}
beforeEach(() => world());

describe('when the traitors may recruit at all', () => {
  it('not until one of them has been banished', () => {
    expect(canRecruit(3)).toBe(false);
  });
  it('the night after a traitor is banished', () => {
    recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
    gs.activePlayers = CAST.filter(n => n !== CAST[0]);
    expect(canRecruit(4)).toBe(true);
  });
});

describe('the flip', () => {
  beforeEach(() => {
    recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
    gs.activePlayers = CAST.filter(n => n !== CAST[0]);
  });

  it('changes what the recruit is trying to win, from that episode on', () => {
    const r = offerRecruitment(CAST[5], 4, () => 0.01, { mode: 'note' });   // forced accept
    expect(r.accepted).toBe(true);
    expect(alignmentAt(CAST[5], 4)).toBe('traitor');
    expect(alignmentAt(CAST[5], 2), 'the flip rewrote who they were BEFORE it').toBe('faithful');
  });

  it('does not retroactively make an earlier correct read wrong', () => {
    expect(truthAtLearn(CAST[5], 2)).toBe(false);
    offerRecruitment(CAST[5], 4, () => 0.01, { mode: 'note' });
    expect(truthAtLearn(CAST[5], 2), 'a correct episode-2 read was rewritten as a mistake').toBe(false);
    expect(truthAtLearn(CAST[5], 5)).toBe(true);
  });

  it('lets an accepted recruit see the turret, and nobody else', () => {
    const r = offerRecruitment(CAST[5], 4, () => 0.01, { mode: 'note' });
    const b = believes(CAST[5], alignmentFactId(r.recruiter), 4);
    expect(b, 'the recruit does not know who they just joined').toBeTruthy();
    expect(b.effectiveConfidence).toBeGreaterThanOrEqual(0.99);
    // And still nobody else can be certain of anything.
    const outsider = CAST.find(n => n !== CAST[5] && n !== r.recruiter && gs.activePlayers.includes(n));
    const ob = believes(outsider, alignmentFactId(r.recruiter), 4);
    if (ob) expect(ob.effectiveConfidence).toBeLessThan(0.63);
  });

  it('records how and when, because a two-night traitor owes nobody anything', () => {
    offerRecruitment(CAST[5], 4, () => 0.01, { mode: 'note' });
    const flip = gs.tr.roleHistory.find(r => r.name === CAST[5] && r.via === 'recruitment');
    expect(flip).toMatchObject({ from: 'faithful', to: 'traitor', ep: 4 });
  });
});

describe('refusing', () => {
  beforeEach(() => {
    recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
    gs.activePlayers = CAST.filter(n => n !== CAST[0]);
  });

  it('by note: survivable, and they never learn who asked', () => {
    const r = offerRecruitment(CAST[5], 4, () => 0.99, { mode: 'note' });   // forced refuse
    expect(r.accepted).toBe(false);
    expect(gs.activePlayers).toContain(CAST[5]);
    const b = believes(CAST[5], alignmentFactId(r.recruiter), 4);
    expect(b, 'an anonymous note told them who sent it').toBeNull();
  });

  it('by ultimatum: fatal, because they have seen the face', () => {
    const r = offerRecruitment(CAST[5], 4, () => 0.99, { mode: 'ultimatum' });
    expect(r.accepted).toBe(false);
    expect(gs.activePlayers, 'they refused an ultimatum and lived').not.toContain(CAST[5]);
  });

  it('a high-loyalty faithful refuses more often than a bold strategist', () => {
    // Population: acceptance is proportional, not a threshold.
    const rate = (name) => {
      let yes = 0;
      for (let s = 1; s <= 80; s++) {
        world();
        recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
        gs.activePlayers = CAST.filter(n => n !== CAST[0]);
        if (offerRecruitment(name, 4, seededRng(s), { mode: 'note' }).accepted) yes++;
      }
      return yes / 80;
    };
    // Must exclude the Traitors themselves — offering recruitment to somebody
    // who is already a Traitor is meaningless and would silently make this
    // test measure nothing.
    const TRAITOR_NAMES = CAST.slice(0, 2);
    const byLoyalty = [...roster.players.slice(0, 10)]
      .filter(p => !TRAITOR_NAMES.includes(p.name) && p.name !== CAST[0])
      .sort((a, b) => (b.stats.loyalty || 5) - (a.stats.loyalty || 5));
    const loyal = byLoyalty[0].name, disloyal = byLoyalty[byLoyalty.length - 1].name;
    const rLoyal = rate(loyal), rDisloyal = rate(disloyal);
    console.log(`[population] ${loyal} (loyal) accepts ${(rLoyal * 100).toFixed(0)}%, ` +
                `${disloyal} accepts ${(rDisloyal * 100).toFixed(0)}%`);
    expect(rLoyal, 'loyalty made no difference to whether they turned').toBeLessThan(rDisloyal);
  });
});
```

- [ ] **Step 2: Run it and watch it fail.**

- [ ] **Step 3: Extend state**

In `js/tr/state.js`:

```js
    // A recruiter's fate is tied to their recruit's: [{ recruiter, recruit, ep }].
    // A recruit banished soon after may burn the person who turned them, which
    // is the worst outcome in the format and the reason recruitment is a
    // decision with a tail rather than a free extra body.
    loyaltyDebt: [],
```

- [ ] **Step 4: Implement in `js/tr/roles.js`**

```js
/** Recruitment opens only once the Faithfuls have actually banished a Traitor. */
export function canRecruit(ep) {
  const banishedTraitor = (gs.tr?.rounds || []).some(r => r.banishedWasTraitor);
  return banishedTraitor && livingTraitors(ep).length > 0;
}

/**
 * Who do the Traitors approach?
 *
 * Not simply the strongest player. The sophisticated play is somebody whose
 * banishment would hurt, who has credibility with the room — and, best of all,
 * somebody already suspicious of them, because turning them neutralises the
 * threat instead of merely removing it.
 */
export function chooseRecruit(ep, rng = Math.random) {
  const traitors = livingTraitors(ep);
  const pool = livingFaithfuls(ep);
  if (!traitors.length || !pool.length) return null;
  const recruiter = traitors[Math.floor(rng() * traitors.length)];
  const scored = pool.map(name => {
    const st = pStats(name);
    const credibility = ((st.social || 5) + (st.temperament || 5)) / 20;
    const bond = Math.max(0, getBond(recruiter, name)) / 10;
    return { name, score: credibility * 0.8 + bond * 0.6 + rng() * 0.5 };
  }).sort((a, b) => b.score - a.score);
  return { recruiter, target: scored[0].name };
}

/**
 * The offer, and the flip.
 *
 * The two delivery modes differ MECHANICALLY, not in flavour. A note is
 * anonymous, so refusing it is survivable — the refuser never learned who
 * asked. An ultimatum is face to face, and refusal has to be fatal for exactly
 * one reason: they have seen your face.
 */
export function offerRecruitment(target, ep, rng = Math.random, { mode = 'note', recruiter = null } = {}) {
  const from = recruiter || chooseRecruit(ep, rng)?.recruiter;
  if (!from || !target) return { accepted: false, mode, recruiter: null };

  const st = pStats(target);
  const arch = players.find(p => p.name === target)?.archetype || 'floater';
  // Proportional, never a threshold. Loyalty is the spine of it: a high-loyalty
  // Faithful refuses and dies for it, which is the most characterful outcome
  // this mechanic has.
  let p = 0.30
    + ((st.boldness || 5) / 10) * 0.22
    + ((st.strategic || 5) / 10) * 0.22
    - ((st.loyalty || 5) / 10) * 0.42
    + Math.max(0, getBond(target, from)) / 10 * 0.18;
  // Position: somebody the room went after last night has far less to lose.
  if (_wasAccusedLastRound(target)) p += 0.18;
  if (['hero', 'loyal-soldier'].includes(arch)) p -= 0.15;
  if (['villain', 'schemer', 'mastermind'].includes(arch)) p += 0.15;
  // An ultimatum is not a better pitch — it is a worse alternative.
  if (mode === 'ultimatum') p += 0.25;

  const accepted = rng() < Math.max(0.02, Math.min(0.95, p));

  if (accepted) {
    recordAlignment(target, true, ep, mode === 'ultimatum' ? 'ultimatum' : 'recruitment');
    // THE THIRD AND LAST legitimate `public` alignment write in this engine.
    // They are standing in the turret; there is nothing to deduce.
    learn(target, alignmentFactId(from),
      { source: 'the turret', sourceType: 'public', ep, rng: () => 0 });
    learn(from, alignmentFactId(target),
      { source: 'the turret', sourceType: 'public', ep, rng: () => 0 });
    (gs.tr.loyaltyDebt ||= []).push({ recruiter: from, recruit: target, ep });
  } else if (mode === 'ultimatum') {
    // They have seen the face. This is why the rule exists.
    gs.activePlayers = (gs.activePlayers || []).filter(n => n !== target);
  }

  return { accepted, mode, recruiter: from };
}

function _wasAccusedLastRound(name) {
  const rounds = gs.tr?.rounds || [];
  const last = rounds[rounds.length - 1];
  if (!last) return false;
  return (last.ballots || []).some(b => b.channel === 'banishment' && b.voted === name);
}
```

Add the imports `roles.js` now needs: `players` and `pStats`, `getBond`, `learn`, `alignmentFactId`. **Check for a circular import** — `roles.js` importing `alignmentFactId` from `deduction.js` while `deduction.js` imports from `roles.js` is a cycle. `alignmentFactId` is DEFINED in `roles.js` and re-exported by `deduction.js`, so use the local definition and do not import it back.

- [ ] **Step 5: Run, then commit**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-recruitment.test.js tests/tr-deduction.test.js tests/tr-murder.test.js
for f in $(git diff --name-only); do grep -rl "$(basename "$f")" tests/ 2>/dev/null; done | sort -u
git branch --show-current && git status --short
git add js/tr/roles.js js/tr/state.js tests/tr-recruitment.test.js
git commit -m "A note can be refused; a face cannot"
```

---

### Task 6: The exit blowup

**Files:** Create `js/tr/exit.js`; append to `tests/tr-recruitment.test.js`

**Interfaces:** Produces `exitSpeech(name, ep, rng) → { burns, target, conviction, text }`.

**The design (spec §6.7) — general, never special-cased.** Big Brother already generates exit blowups from the leaver's beliefs with conviction as headroom (`js/bb/jury-house.js`). The same machine runs here: a banished player's speech comes from what they *believe*, and whether they burn someone runs off `loyalty` × time-served × conviction.

The recruit case then falls out on its own: **someone recruited two nights ago has almost no loyalty to the Traitors**, so their burn probability is naturally high, while a Traitor of nine rounds' standing goes quietly. Rare in practice, never special-cased, and able to surprise in configurations nobody anticipated.

**It needs rare-state amplification** (spec §5.4 ①) or it will never be seen: a mechanism that can only fire in a narrow window must be weighted *up* inside that window, or you have shipped content that never appears.

- [ ] **Step 1: Write the failing test**

Append to `tests/tr-recruitment.test.js`:

```js
import { exitSpeech } from '../js/tr/exit.js';

describe('the way somebody leaves', () => {
  beforeEach(() => {
    recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
    gs.activePlayers = CAST.filter(n => n !== CAST[0]);
  });

  it('a two-night recruit burns their recruiter far more often than a founder does', () => {
    const burnRate = (setup) => {
      let burns = 0;
      for (let s = 1; s <= 80; s++) {
        world();
        recordRound({ ep: 3, banished: CAST[0], banishedWasTraitor: true, murdered: null, ballots: [] });
        gs.activePlayers = CAST.filter(n => n !== CAST[0]);
        const who = setup(s);
        if (exitSpeech(who, 5, seededRng(s)).burns) burns++;
      }
      return burns / 80;
    };
    const fresh = burnRate((s) => {
      offerRecruitment(CAST[5], 4, () => 0.01, { mode: 'note' });
      return CAST[5];
    });
    const founder = burnRate(() => CAST[1]);   // traitor since episode 1
    console.log(`[population] fresh recruit burns ${(fresh * 100).toFixed(0)}%, ` +
                `founder burns ${(founder * 100).toFixed(0)}%`);
    expect(fresh, 'a two-night recruit is as loyal as a nine-round traitor').toBeGreaterThan(founder);
  });

  it('a burn names somebody real, and never the speaker', () => {
    offerRecruitment(CAST[5], 4, () => 0.01, { mode: 'note' });
    for (let s = 1; s <= 40; s++) {
      const sp = exitSpeech(CAST[5], 5, seededRng(s));
      if (sp.burns) {
        expect(gs.activePlayers).toContain(sp.target);
        expect(sp.target).not.toBe(CAST[5]);
      }
    }
  });

  it('a faithful can leave angry too, and be wrong about who', () => {
    let named = 0;
    for (let s = 1; s <= 60; s++) {
      world();
      const sp = exitSpeech(CAST[7], 5, seededRng(s));
      if (sp.target) named++;
    }
    expect(named, 'no faithful ever says anything on the way out').toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run it and watch it fail.**

- [ ] **Step 3: Implement `js/tr/exit.js`**

```js
// ══════════════════════════════════════════════════════════════════════
// tr/exit.js — what somebody says on the way out
// ══════════════════════════════════════════════════════════════════════
//
// Generated from what the leaver BELIEVES, never from what is true, which is
// why a Faithful can leave furious and name entirely the wrong person.
//
// The famous case falls out of the general rule rather than being written as a
// special case: somebody recruited two nights ago has almost no loyalty to the
// people who turned them, so their burn probability is naturally high, while a
// Traitor of nine rounds' standing goes quietly. Nobody had to script that.
import { gs } from '../core.js';
import { pStats } from '../players.js';
import { alignmentAt } from './roles.js';
import { suspicionBoard } from './deduction.js';

/** How many rounds this person has been what they currently are. */
function _tenure(name, ep) {
  const flips = (gs.tr?.roleHistory || []).filter(r => r.name === name);
  const last = flips[flips.length - 1];
  return Math.max(0, ep - (last?.ep ?? 1));
}

/**
 * The speech.
 *
 * RARE-STATE AMPLIFICATION (spec 5.4): a fresh recruit being banished is a
 * narrow window, and a mechanism that can only fire in a narrow window must be
 * weighted UP inside it or it never appears at all — content that exists in
 * the code and never in a season. The `+0.35` below is that amplification and
 * is the reason this is worth building.
 */
export function exitSpeech(name, ep, rng = Math.random) {
  const st = pStats(name);
  const isTraitor = alignmentAt(name, ep) === 'traitor';
  const tenure = _tenure(name, ep);

  // Who they blame. A Traitor burns an ALLY (they know); a Faithful burns
  // whoever they suspect (they usually do not).
  let target = null, conviction = 0;
  if (isTraitor) {
    const allies = (gs.activePlayers || []).filter(n => n !== name && alignmentAt(n, ep) === 'traitor');
    target = allies[Math.floor(rng() * allies.length)] ?? null;
    conviction = 1;
  } else {
    const board = suspicionBoard(name, ep).filter(r => r.score > 0);
    target = board[0]?.name ?? null;
    conviction = board[0]?.score ?? 0;
  }
  if (!target) return { burns: false, target: null, conviction: 0, text: '' };

  // Loyalty is the spine; time served is what loyalty is TO. A two-night
  // recruit has had no time to acquire any.
  let p = 0.15
    + (1 - (st.loyalty || 5) / 10) * 0.45
    + conviction * 0.30
    - Math.min(0.35, tenure * 0.05);
  if (isTraitor && tenure <= 2) p += 0.35;          // rare-state amplification
  if ((st.temperament || 5) <= 3) p += 0.12;        // some people simply cannot hold it

  const burns = rng() < Math.max(0.02, Math.min(0.95, p));
  return {
    burns, target, conviction,
    text: burns ? `${name} names ${target} on the way out.` : `${name} says nothing useful.`,
  };
}
```

- [ ] **Step 4: Run, then commit**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-recruitment.test.js
git branch --show-current && git status --short
git add js/tr/exit.js tests/tr-recruitment.test.js
git commit -m "A two-night traitor owes the turret nothing"
```

---

### Task 7: Delete the placeholder, and re-measure everything

**Files:** Modify `js/tr/headless.js`, `tests/tr-calibration.test.js`

**This task is the gate again, and the bands are inherited.** Plan 2's placebo-controlled gate was measured against a game with a *random* murder. This plan replaces it with a murder that reasons, adds a second evidence source, and lets players change sides. **Every number will move.** The bands do not.

**Expect the faithful win rate to FALL.** Plan 2 closed at 58% and noted the format should lean Traitor. A conclave that murders the coalition-builder instead of a random Faithful should push it down. If it does not, say so — that is a finding about the target reasoning, not a band to adjust.

- [ ] **Step 1: Wire the real murder**

In `js/tr/headless.js`: delete `_placeholderMurder` entirely, import `resolveMurder` from `./murder.js` and `murderEvidence` from `./deduction.js`, and replace both call sites. Order within a round matters and must be:

1. `ballotEvidence(ep, rng)` — read last round's ballots
2. `murderEvidence(ep, rng)` — read last round's murder, ONCE
3. `runRoundTable(ep, rng)` — debate, vote, reveal cascade
4. `resolveMurder(ep, rng)` — the conclave and the kill
5. record `murderCost` onto the round so `murderEvidence` can read it next round

Recruitment: when `canRecruit(ep)` and the Traitors choose it over a murder, **no murder happens that night regardless of the answer** — that is the format's rule, not an implementation shortcut. Keep the choice crude and seeded; this plan is not the endgame:

```js
  // Recruit rather than murder when the pact is thin and somebody is takeable.
  // Deliberately simple: the interesting decision is WHO (chooseRecruit) and
  // whether they accept, not this coin. A later plan can make it strategic.
  const wantsRecruit = canRecruit(ep)
    && livingTraitors(ep).length < 3
    && rng() < 0.45;
  let murdered = null, recruited = null;
  if (wantsRecruit) {
    const pick = chooseRecruit(ep, rng);
    if (pick) recruited = offerRecruitment(pick.target, ep, rng,
      { mode: livingTraitors(ep).length === 1 ? 'ultimatum' : 'note', recruiter: pick.recruiter });
  } else {
    const m = resolveMurder(ep, rng);
    murdered = m.victim;
    // murderEvidence reads this NEXT round; it must be on the round record.
    const rounds = gs.tr.rounds;
    if (rounds.length) { rounds[rounds.length - 1].murdered = murdered;
                         rounds[rounds.length - 1].murderCost = m.cost; }
  }
```

Note the ultimatum fires only with one Traitor left, which is the format's own rule and the reason refusal is fatal there.

Keep the `evidence` injection point intact: the placebo control in `tests/tr-calibration.test.js` depends on it.

- [ ] **Step 2: Run the gate and READ THE NUMBERS**

```bash
cd ../worktree-traitors && npx vitest run tests/tr-calibration.test.js --reporter=verbose
```

Record every printed value. Compare against Plan 2's close-out:

```
rate 31.8% | early -5.7pp | late +25.5pp | board 2.11x vs placebo 1.70x
growth 31.2pp vs worst-k placebo 16.2pp | faithful win 58.0% | plurality 34.2%
```

- [ ] **Step 3: If a band fails, diagnose — do not tune**

Suspects, in order:
1. **Murder evidence is emitted more than once.** Grep for any re-walk of history. Plan 2 measured this costing 0.20–0.23× of lift.
2. **The conclave is too good.** If the Traitors reliably murder the coalition-builder, Faithful detection collapses and the win rate craters below the 10% sanity floor. The fix is the noise term in `formPreference`, not the band.
3. **The conclave is too bad**, and murders read as random — the game barely changed from Plan 2's placeholder.
4. **Recruitment is firing too often**, so alignment churns and no read survives long enough to matter.

Report which, with numbers.

- [ ] **Step 4: Add the bands this plan earns**

Two behaviours are new and must be pinned, or a later plan can regress them invisibly:

```js
  it('MURDERS THE COALITION: the victim is better connected than average', () => {
    // The visibility trap, from the Traitors' side: murder is the only tool
    // that works on somebody the table will never remove. If this fails, the
    // conclave is picking at random and Task 1's tool-allocation logic is not
    // doing anything.
    let victimSocial = 0, victims = 0, fieldSocial = 0, field = 0;
    seasons.forEach(s => s.log.forEach(r => {
      if (!r.murdered) return;
      victimSocial += (pStats(r.murdered).social || 5); victims++;
      (r.livingAtMurder || []).forEach(n => { fieldSocial += (pStats(n).social || 5); field++; });
    }));
    expect(victims, 'no murders happened at all').toBeGreaterThan(200);
    const vAvg = victimSocial / victims, fAvg = fieldSocial / field;
    console.log(`victim social ${vAvg.toFixed(2)} vs field ${fAvg.toFixed(2)}`);
    expect(vAvg, 'the conclave murders at random — tool allocation is inert')
      .toBeGreaterThan(fAvg);   // measure first, then raise this to fAvg + a real margin
  });

  it('A BLOCKED MURDER IS VISIBLE: nights nobody dies actually happen', () => {
    // Non-vacuity. If zero blocked murders occur across 200 seasons the shield
    // path is dead code, and the "night nobody dies" event — one of the
    // format's best deduction sources — has never once fired in a season.
    const blocked = seasons.reduce((n, s) => n + (s.blockedMurders?.length || 0), 0);
    console.log(`blocked murders across ${seasons.length} seasons: ${blocked}`);
    expect(blocked, 'the shield path never fired — the event is dead code')
      .toBeGreaterThan(0);
  });
```

`livingAtMurder` and `blockedMurders` do not exist on the log yet — add them in `headless.js` as **data the harness records**, not behaviour. Measure both metrics first, then set each band below the measured value with real headroom, and log the value so a future reader knows what it was. Note that until Plan 5 awards Shields in missions, blocked murders can only occur if the harness grants one; if the count is structurally zero, say so and mark the band as awaiting Plan 5 rather than deleting it.

- [ ] **Step 5: Full verification and commit**

```bash
cd ../worktree-traitors
npx vitest run tests/tr-calibration.test.js tests/tr-deduction.test.js tests/tr-roundtable.test.js tests/tr-murder.test.js tests/tr-recruitment.test.js
for f in $(git diff --name-only); do grep -rl "$(basename "$f")" tests/ 2>/dev/null; done | sort -u
git branch --show-current && git status --short
git add js/tr/headless.js tests/tr-calibration.test.js
git commit -m "The murder reasons now, and every number moved"
git push
```

---

## Done when

- The placeholder murder is gone and no code path picks a victim at random.
- A conclave argues, records who was overruled, and can be wrong in named ways.
- A blocked murder happens, is recorded, and is visible to the room.
- Murder evidence is emitted **exactly once** per murder.
- A Faithful can be recruited; refusing a note is survivable and refusing an ultimatum is not; an episode-3 read of a player recruited in episode 8 is still correct.
- Every inherited band is green **without being widened**, plus the two new ones.
- `npx vitest run tests/tr-{calibration,deduction,roundtable,murder,recruitment}.test.js` green.

## Explicitly NOT in this plan

Missions, the prize pot, Dagger, Seer (Plan 5) · the endgame and the banish-or-end loop (Plan 5) · threads, cooldowns, acts, residue and the castle event pool (Plan 4) · export and co-winners (Plan 6) · all VP and screens (Plan 7) · evidence sources ③–⑥.

## Carried forward

- **Plan 5** — Traitors still cannot accuse each other (0 in 1,996). The endgame *requires* it; the path is barred in both `debate()` and `chooseBanishmentVote()`.
- **Plan 6** — `js/player-trivia.js` hands a Traitors line Total Drama's noun and counters.
- **Plan 7** — `js/wiki-view.js` renders "Challenge wins" and "Voted to evict" on a Traitors article; `tests/show-vocabulary.test.js`'s `EXCLUSIVE` map has no `traitors` key.
- **Anywhere** — a voter appearing in both a ballot and a revote is indicted twice in one round.
- 7 test failures inherited from `main` predate all of this: `wiki.test.js` (2), `bb-twist-compatibility.test.js` (4), `bond-lean.test.js` (1).
