# High Roller's, Plan 2: The Room and the Roulette — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the money mean something — a room that opens on booked weeks, takes your BB Bucks on entry, and can beat you; plus the first game you can buy your way into.

**Architecture:** `js/bb/high-rollers-room.js` owns the room: who walks in, what they pay, and what they play. `js/bb/chopping-block-roulette.js` owns the first game. The room grants powers through the existing `grantPower` with `channel: 'purchase'` — the channel `bb-coin-of-destiny` has declared since it was written while nothing had money behind it. The Roulette resolves at the veto ceremony, ahead of the veto decision, the way BB23 played it.

**Tech Stack:** ES modules, no build step. Vitest. No new dependencies.

## Global Constraints

From `docs/superpowers/specs/2026-08-15-bb-high-rollers-theme-design.md` and this project's non-negotiables. Every task's requirements implicitly include these.

- **Entry is public; the amounts are not.** The house sees who walked into the room. Balances stay private — a surface may state what somebody was PAID this week (50/75/100) or what a game COST (50/125/250), never anybody's balance.
- **Paying is not winning.** Money is taken on ENTRY. A houseguest can pay 250 and walk out with nothing, in public. This is the whole point of a casino and no task may soften it.
- **One entry per game per houseguest per season.** Canon: "the competitions can only be played once."
- **A purchased power expires at the end of the week it was bought.** Canon: "the twists can only be used in the week they are purchased." Nothing bought may be banked into the endgame.
- **Prices, exact:** Veto Derby 50 (Plan 3), Chopping Block Roulette 125, Coin of Destiny 250.
- **No bare `Math.random()`.** Thread the week's `rng`, or default to `stableRng(...)` with the season salt — `stableRng('...', gs?.bb?.seasonSalt || 0, week?.num || 0)`. A bare call breaks the seeded-replay guards.
- **`!compressed` is NOT "once a week".** `simulateBBWeek` runs once per CYCLE. A `week-in-one` double eviction runs its second cycle UNCOMPRESSED (`js/bb-run.js:1027`), and a Split House runs one cycle per side. Anything that must happen once a calendar week gates on `week.segment` — see the BB Bucks payout at `js/bb/week.js:1449` for the working example.
- **Serialization:** everything stored on `gs` must survive `JSON.stringify`. No Sets, no functions.
- **Valid stats only:** `physical`, `endurance`, `mental`, `social`, `strategic`, `loyalty`, `boldness`, `intuition`, `temperament`.
- **Test command:** name the affected files — `npx vitest run tests/<file>.test.js`. NEVER `npm test`; the full suite eats memory in this repo. Kill orphaned vitest workers after the final run.

---

## File Structure

| File | Responsibility |
|---|---|
| `js/bb/high-rollers-room.js` | **Create.** Who enters, what they pay, what they win. Imports `bb-bucks.js`, `powers.js`, `players.js`, `bonds.js`. |
| `js/bb/chopping-block-roulette.js` | **Create.** The 125 game: safety, one removal, one random spin. |
| `tests/bb-high-rollers-room.test.js` | **Create.** Entry economics and the once-per-season rule. |
| `tests/bb-chopping-block-roulette.test.js` | **Create.** The removal, the spin's uniformity, the exclusion set. |
| `js/core.js` | **Modify.** `TWIST_CATALOG` entry for `bb-high-rollers-room`. |
| `js/bb/twist-contract.js` | **Modify.** Contract + announcement for the room. |
| `js/bb/week.js` | **Modify.** Dispatch the room after nominations; resolve the Roulette at the veto ceremony. |
| `js/bb-run.js`, `js/text-backlog.js`, `js/vp-screens.js` | **Modify.** Two acts in three writers, plus screens. |
| `js/bb/themes-high-rollers.js` | **Modify.** The arc finally books something. |

---

### Task 1: The room — who walks in and what it costs them

**Files:**
- Create: `js/bb/high-rollers-room.js`
- Test: `tests/bb-high-rollers-room.test.js`

**Interfaces:**
- Consumes: `balance`, `canAfford`, `spend` from `./bb-bucks.js`; `spendPull` from `./powers.js`; `pStats`, `pronouns` from `../players.js`; `stableRng` from `./knowledge.js`.
- Produces:
  - `ROOM_GAMES` — frozen array of `{id, name, price, powerId, blurb}`. This plan ships one entry (`chopping-block-roulette`, 125). Plan 3 adds the Derby, Plan 4 re-prices the Coin.
  - `hasPlayed(name, gameId) -> boolean` — reads `gs.bb.roomPlays`
  - `openRoom({week, house, hoh, nominees, rng}) -> act | null`
  - The act: `{type:'high-rollers-room', week, secret:false, entries:[{name, gameId, price, won}], declined:[...], beats:[...]}`

- [ ] **Step 1: Write the failing test**

Create `tests/bb-high-rollers-room.test.js`:

```javascript
// The room. Paying is not winning, and the door only opens once per game.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs } from '../js/core.js';
import { credit, balance } from '../js/bb/bb-bucks.js';
import { openRoom, hasPlayed, ROOM_GAMES } from '../js/bb/high-rollers-room.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'hero', 'schemer', 'floater', 'villain', 'goat', 'underdog', 'hothead'][i],
}));

// Deterministic rng; callers pass their own sequence.
const seq = values => { let i = 0; return () => values[i++ % values.length]; };

beforeEach(() => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { ...(gs.bb || {}), weeks: [], bucks: {}, roomPlays: {}, seasonSalt: 7 };
  NAMES.forEach(n => credit(n, 300));
});

const open = (rng = seq([0.1, 0.9, 0.4, 0.6])) => openRoom({
  week: { num: 5 }, house: NAMES, hoh: 'Bowie', nominees: ['Chase', 'Ripper'], rng,
});

describe('the price of a seat', () => {
  it('takes the money on ENTRY, not on winning', () => {
    const act = open(seq([0.01]));            // everybody keen
    const paid = act.entries.reduce((sum, e) => sum + e.price, 0);
    const held = NAMES.reduce((sum, n) => sum + balance(n), 0);
    expect(act.entries.length).toBeGreaterThan(0);
    expect(held).toBe(NAMES.length * 300 - paid);
    // and at least somebody paid without winning, or the format is a vending machine
    expect(act.entries.some(e => !e.won)).toBe(true);
  });

  it('never seats somebody who cannot afford the game', () => {
    gs.bb.bucks = Object.fromEntries(NAMES.map(n => [n, 10]));
    expect(open(seq([0.01])).entries).toHaveLength(0);
  });

  it('never lets a balance go negative', () => {
    open(seq([0.01]));
    NAMES.forEach(n => expect(balance(n)).toBeGreaterThanOrEqual(0));
  });
});

describe('one seat per game per season', () => {
  it('refuses a second entry to the same game', () => {
    const first = open(seq([0.01]));
    const played = first.entries.map(e => e.name);
    expect(played.length).toBeGreaterThan(0);
    played.forEach(n => expect(hasPlayed(n, 'chopping-block-roulette')).toBe(true));
    const second = open(seq([0.01]));
    second.entries.forEach(e => expect(played).not.toContain(e.name));
  });

  it('records the play even when they lost', () => {
    const act = open(seq([0.01]));
    const loser = act.entries.find(e => !e.won);
    expect(loser).toBeTruthy();
    expect(hasPlayed(loser.name, loser.gameId)).toBe(true);
  });

  it('survives a JSON round trip, because saves do', () => {
    open(seq([0.01]));
    const revived = JSON.parse(JSON.stringify(gs.bb.roomPlays));
    expect(Object.keys(revived).length).toBeGreaterThan(0);
  });
});

describe('who walks in', () => {
  it('a nominee is likelier to pay than a comfortable houseguest', () => {
    let nomEntries = 0, safeEntries = 0;
    for (let s = 0; s < 40; s++) {
      gs.bb.bucks = Object.fromEntries(NAMES.map(n => [n, 300]));
      gs.bb.roomPlays = {};
      const act = openRoom({ week: { num: 5 }, house: NAMES, hoh: 'Bowie',
        nominees: ['Chase', 'Ripper'], rng: seq([(s % 10) / 10, ((s * 3) % 10) / 10]) });
      for (const e of act?.entries || []) {
        if (['Chase', 'Ripper'].includes(e.name)) nomEntries++; else safeEntries++;
      }
    }
    expect(nomEntries / 2).toBeGreaterThan(safeEntries / 6);
  });

  it('the HOH does not buy a week they already own', () => {
    for (let s = 0; s < 20; s++) {
      gs.bb.roomPlays = {};
      const act = open(seq([(s % 10) / 10]));
      expect((act?.entries || []).map(e => e.name)).not.toContain('Bowie');
    }
  });

  it('returns null when nobody enters', () => {
    gs.bb.bucks = {};
    expect(open(seq([0.99]))).toBeNull();
  });
});

describe('the menu', () => {
  it('is frozen, so nothing can retune canon prices by accident', () => {
    expect(Object.isFrozen(ROOM_GAMES)).toBe(true);
    expect(ROOM_GAMES.find(g => g.id === 'chopping-block-roulette').price).toBe(125);
  });

  it('never states a balance in a beat', () => {
    credit('Zee', 4242);
    const act = open(seq([0.01]));
    expect((act.beats || []).some(b => b.text.includes('4242'))).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/bb-high-rollers-room.test.js`
Expected: FAIL — `Failed to resolve import "../js/bb/high-rollers-room.js"`.

- [ ] **Step 3: Write the implementation**

Create `js/bb/high-rollers-room.js`. Requirements, all pinned by the tests above:

- `ROOM_GAMES` frozen, one entry this plan:
  `{ id:'chopping-block-roulette', name:'Chopping Block Roulette', price:125, powerId:null, blurb:'…' }`
  (`powerId` is null because the Roulette's effect is resolved by the ceremony rather than by a registry power. Plan 3's Derby and Plan 4's Coin fill this in.)
- `gs.bb.roomPlays` is `{ [name]: [gameId, …] }` — plain arrays, JSON-safe. Create it on first touch, like `bb-bucks.js` does with its ledger.
- **The entry decision.** For each houseguest except the HOH, in a house where they can afford the game and have not played it:
  - `need` — 1.0 on the block, otherwise scaled by how exposed they are (no strong bonds, no immunity). Keep it proportional; never `if (stat >= X)`.
  - `nerve` — from `boldness` and `temperament`.
  - Feed both to `spendPull({need, weeksLeft, nerve, exposes: true})` from `powers.js`, which is the existing shape for exactly this decision. Do not reinvent it. `exposes: true` because walking into the room is public.
- **Take the money on entry** via `spend(name, game.price)`, before the game runs. A failed `spend` means no seat.
- **Run the game.** This task does NOT implement the Roulette itself — Task 2 does. Here, call an injected `play` function if one is supplied, else decide the win with a plain stat-plus-noise check so the module is testable alone. Task 2 wires the real game in.
- **Beats:** who walked in (public), and who paid and lost. Never a balance. Give at least 4 line variants per category — this project's standard.
- Return `null` when nobody entered.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/bb-high-rollers-room.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/bb/high-rollers-room.js tests/bb-high-rollers-room.test.js
git commit -m "feat(bb): the High Roller's Room — money leaves on the way in"
```

---

### Task 2: Chopping Block Roulette

**Files:**
- Create: `js/bb/chopping-block-roulette.js`
- Test: `tests/bb-chopping-block-roulette.test.js`
- Modify: `js/bb/high-rollers-room.js` (wire the real game in)

**Interfaces:**
- Produces:
  - `playRoulette({name, house, nominees, hoh, protectedNames, rng}) -> {won, removed, replacement, beats}`
  - `spinReplacement({eligible, rng}) -> string` — uniform, exported so the test can prove uniformity.

**The rules, from the wiki, in full:** win it and you get three things at once — safety for the week; the power to remove ONE initial nominee, who is then safe for the rest of the week and **cannot be the replacement**; and then you **spin**, and the replacement is drawn at random from every eligible houseguest with equal odds, chosen by nobody including you.

The randomness is the mechanic. The HOH loses the block and gains nobody to blame, because no hand picked the replacement.

- [ ] **Step 1: Write the failing test**

Create `tests/bb-chopping-block-roulette.test.js`:

```javascript
// The spin nobody chose.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs } from '../js/core.js';
import { playRoulette, spinReplacement } from '../js/bb/chopping-block-roulette.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'hero', 'schemer', 'floater', 'villain', 'goat', 'underdog', 'hothead'][i],
}));

const seq = values => { let i = 0; return () => values[i++ % values.length]; };

beforeEach(() => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { ...(gs.bb || {}), weeks: [], bucks: {}, roomPlays: {}, seasonSalt: 7 };
});

const play = (rng, over = {}) => playRoulette({
  name: 'Zee', house: NAMES, nominees: ['Chase', 'Ripper'], hoh: 'Bowie',
  protectedNames: ['Bowie'], rng, ...over,
});

describe('the spin', () => {
  it('is uniform over the eligible set', () => {
    const eligible = ['Scary', 'Nichelle', 'Axel', 'Brightly'];
    const counts = {};
    for (let i = 0; i < 4000; i++) {
      const pick = spinReplacement({ eligible, rng: seq([i / 4000]) });
      counts[pick] = (counts[pick] || 0) + 1;
    }
    // Every eligible name comes up, and none takes more than 35% of 4000.
    eligible.forEach(n => expect(counts[n]).toBeGreaterThan(0));
    Object.values(counts).forEach(c => expect(c).toBeLessThan(1400));
  });

  it('never lands on the removed nominee', () => {
    for (let s = 0; s < 60; s++) {
      const r = play(seq([0.01, s / 60, (s * 7 % 60) / 60]));
      if (!r.won || !r.removed) continue;
      expect(r.replacement).not.toBe(r.removed);
    }
  });

  it('never lands on the winner, the HOH, or the remaining nominee', () => {
    for (let s = 0; s < 60; s++) {
      const r = play(seq([0.01, s / 60, (s * 3 % 60) / 60]));
      if (!r.won || !r.replacement) continue;
      expect(['Zee', 'Bowie']).not.toContain(r.replacement);
      expect(r.replacement).not.toBe(r.removed === 'Chase' ? 'Ripper' : 'Chase');
    }
  });

  it('takes one nominee down and puts exactly one up', () => {
    const r = play(seq([0.01, 0.3, 0.5]));
    if (!r.won) return;
    expect(['Chase', 'Ripper']).toContain(r.removed);
    expect(r.replacement).toBeTruthy();
  });
});

describe('losing it', () => {
  it('is possible — a paid seat is not a win', () => {
    let losses = 0;
    for (let s = 0; s < 60; s++) if (!play(seq([0.99, s / 60])).won) losses++;
    expect(losses).toBeGreaterThan(0);
  });

  it('changes nothing when lost', () => {
    const r = play(seq([0.999]));
    if (r.won) return;
    expect(r.removed).toBeNull();
    expect(r.replacement).toBeNull();
  });
});

describe('the empty board', () => {
  it('refuses rather than crashing when nobody is eligible for the chair', () => {
    const r = playRoulette({ name: 'Zee', house: ['Zee', 'Bowie', 'Chase', 'Ripper'],
      nominees: ['Chase', 'Ripper'], hoh: 'Bowie', protectedNames: ['Bowie'], rng: seq([0.01, 0.3]) });
    // Everybody left is the winner, the HOH or a nominee — no legal replacement.
    expect(r.replacement).toBeNull();
    expect(r.removed).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/bb-chopping-block-roulette.test.js`
Expected: FAIL — unresolved import.

- [ ] **Step 3: Write the implementation**

Create `js/bb/chopping-block-roulette.js`.

- **Winning is genuinely losable.** A pass/fail check against a standard, `mental`/`intuition`-weighted with `rng` noise, tuned so roughly a third of entrants lose. Canon: score above zero or you have bought nothing.
- **The removal.** If the winner is themselves a nominee, they come down (their own safety does it). Otherwise they remove the nominee they most want safe — highest `getPerceivedBond` — with noise so a season does not repeat itself.
- **The spin.** `spinReplacement` over the eligible set: the whole house minus the winner, the HOH, the removed nominee, the remaining nominee(s), and everybody in `protectedNames`. Uniform — `Math.floor(rng() * eligible.length)`, no weighting of any kind. This is the one place in this codebase where a decision must NOT read stats or bonds.
- **The empty board.** If no eligible name remains, the power does nothing: return `{won:true, removed:null, replacement:null}` with a beat saying the chair could not be filled. Same rule the veto ceremony already applies at `js/bb/week.js:3957`. Never crash, never return an undefined name — `gs.bb.stats[replacement]` blows up on one, and that has crashed a real season before.
- Beats: 4+ variants each for the win, the removal, the spin landing, and the loss.

Then wire it into `js/bb/high-rollers-room.js` as the `chopping-block-roulette` game's play function.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/bb-chopping-block-roulette.test.js tests/bb-high-rollers-room.test.js`
Expected: PASS, both files.

- [ ] **Step 5: Commit**

```bash
git add js/bb/chopping-block-roulette.js js/bb/high-rollers-room.js tests/bb-chopping-block-roulette.test.js
git commit -m "feat(bb): Chopping Block Roulette — the replacement nobody chose"
```

---

### Task 3: Wire the room into the week

**Files:**
- Modify: `js/core.js` (`TWIST_CATALOG`), `js/bb/twist-contract.js`, `js/bb/week.js`
- Test: `tests/bb-high-rollers-room.test.js` (extend with engine-level cases)

**Where each piece goes:**

- **The room opens AFTER the nomination ceremony.** Its entry decision reads `nominees`, and "am I on the block" is the strongest term in it. Find the nomination ceremony in `js/bb/week.js` and dispatch after it, before the veto competition.
- **The Roulette resolves AT the veto ceremony, BEFORE the veto decision** — the way BB23 played it (the winner used it at the veto meeting; the actual PoV was separate). Resolve it just before `let vetoDecision = shouldUseVeto(...)` (~`js/bb/week.js:3921`). The block the veto then reasons about is the post-Roulette block.
- **The removed nominee must be safe for the rest of the week**, so add them to the `protectedNames` list built at `js/bb/week.js:3978` — otherwise the veto's replacement chooser can put them straight back up.
- **Gate the room on the calendar week**, not the cycle: `week.segment == null || week.segment === 1`, plus `!compressed`. See the BB Bucks payout at `js/bb/week.js:1449`.

**`TWIST_CATALOG` entry** in `js/core.js`, following the `bb-den-of-temptation` entry's shape and its `desc` standard — the `desc` is the only place the viewer is told how the thing works, so it states the set-up, the mechanic, what goes wrong, and what winning gets you:

```javascript
{ id:'bb-high-rollers-room', emoji:'🎲', name:"The High Roller's Room", format:'big-brother',
  category:'advantages', phase:'any',
  desc:'<the room opens; entry is public; you pay on the way IN; the game can beat you; '
     + 'each game once per season; anything bought dies at the end of the week>',
  incompatible:[] },
```

Derive `incompatible` rather than guessing: the Roulette rewrites the block, so check it against every twist that also shapes the block (`bb-battle-of-the-block`, `bb-roadkill`, `bb-americas-nominee`, the Block Buster, `bb-den-of-temptation`) and against `twistModeClashes`. The Den's catalog comment explains how that theme became compatible with everything by TAKING a chair rather than adding one — read it before deciding. State your reasoning in the report.

**`twist-contract.js`**: a contract entry with an `announcement` (`name`, `rule`, `sting`) so the house is told the room is open, and `acquisition: { channel: 'purchase', secrecy: 'public' }`.

- [ ] **Step 1: Write the failing engine test**

Append to `tests/bb-high-rollers-room.test.js` a block that runs a real themed season with the room booked, and asserts:
- the room emits exactly ONE `high-rollers-room` act on a normal week
- a double-eviction week emits exactly one (not one per cycle)
- when somebody wins the Roulette, the week's block afterwards does not contain the removed nominee, and does contain the spun replacement
- the removed nominee is not the replacement, and is not re-nominated by the veto ceremony later that week

Model the harness on the engine-level tests already in `tests/bb-theme-high-rollers.test.js` — same `seedGame` + `Object.assign(globalThis, …)` + `withSeededRandom` shape. Read that file first and match it.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/bb-high-rollers-room.test.js`
Expected: FAIL — no act is emitted; the twist does not exist yet.

- [ ] **Step 3: Implement the wiring**

Catalog entry, contract entry, the `twists.has('bb-high-rollers-room')` dispatch block after nominations (follow the `bb-den-of-temptation` block at `js/bb/week.js:2395` for the pattern, including its `try/catch`), and the Roulette resolution at the veto ceremony.

- [ ] **Step 4: Verify**

Run: `npx vitest run tests/bb-high-rollers-room.test.js tests/bb-act-coverage.test.js tests/bb-themes.test.js`
Expected: the room cases PASS. `bb-act-coverage` will FAIL naming `high-rollers-room` as untranscribed — that is Task 4's job and the correct intermediate state. Do not add transcript cases here.

- [ ] **Step 5: Commit**

```bash
git add js/core.js js/bb/twist-contract.js js/bb/week.js tests/bb-high-rollers-room.test.js
git commit -m "feat(bb): open the room after nominations, spin the block at the veto"
```

---

### Task 4: The room in three transcripts

**Files:**
- Modify: `js/bb-run.js`, `js/text-backlog.js`, `js/vp-screens.js`
- Test: `tests/bb-act-coverage.test.js` (existing guard)

Two act types need handling in all three writers: `high-rollers-room` and, if Task 2 emits it separately, the Roulette's resolution. An act handled in one writer and not the others falls silently through the switch — the failure this project has shipped once per slice for eleven slices, and which was red on `main` as recently as this week.

Read the `bb-bucks` cases added in Plan 1 as your precedent; they are in all three files and are the freshest example. Use each file's real helpers (`line(...)` in bb-run.js; `sec`/`ln`/`beats` in text-backlog.js; the neighbouring `vpScreens.push({id,label,html})` shape in vp-screens.js).

**Content requirements:** who walked in and what it cost them (public), who won and who paid for nothing, and on a Roulette win: the removal, the spin, and who the wheel landed on. **Never a balance.**

The VP screen is the room itself — a table, the game's price on it, and the wheel. This project's VP standard is CSS/SVG primitives, never emoji, and the theme's brass-on-black palette is already in `css/simulator.css` under `.rp-theme-high-rollers`. Render the screens in a browser and look at them before you call this done; that is how Plan 1 caught an SVG bug no assertion could see.

- [ ] **Step 1: Run the guard, see it name the act**

Run: `npx vitest run tests/bb-act-coverage.test.js`
Expected: FAIL naming `high-rollers-room`.

- [ ] **Step 2: Add the cases in all three writers**

- [ ] **Step 3: Verify**

Run: `npx vitest run tests/bb-act-coverage.test.js`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add js/bb-run.js js/text-backlog.js js/vp-screens.js
git commit -m "feat(bb): transcribe the room in all three writers"
```

---

### Task 5: The arc finally books something

**Files:**
- Modify: `js/bb/themes-high-rollers.js`
- Test: `tests/bb-theme-high-rollers.test.js`

Plan 1 shipped `books: []`, which is why picking this theme stamped an empty timeline while the other three stamp several cards. Three things go in:

```javascript
arc: [
  // Prizes and Punishments — the wrapped-box veto, which asks the casino's own
  // question: what did you actually come here for. Already built and wired.
  { at: { week: 3 }, book: 'bb-prizes-and-punishments' },

  // the turn — see the note below on which anchor really fires
  { at: { frac: 0.55 }, mood: 'hostile' },
  { at: { fromEnd: 8 }, mood: 'hostile' },

  // the room, at the canon final eleven / ten / nine
  { at: { fromEnd: 8 }, book: 'bb-high-rollers-room' },
  { at: { fromEnd: 7 }, book: 'bb-high-rollers-room' },
  { at: { fromEnd: 6 }, book: 'bb-high-rollers-room' },

  // The Coin — BB23's 250-buck game, already built. Plan 4 prices it into the
  // room; until then it runs on its own buy-in, which is a probability.
  { at: { fromEnd: 5 }, book: 'bb-coin-of-destiny' },
],
books: ['bb-high-rollers-room', 'bb-coin-of-destiny', 'bb-prizes-and-punishments'],
```

**Do not change the two mood anchors.** `fromEnd: 8` fires before `frac: 0.55` at every cast up to sixteen weeks; that is inherited from `resolveArcWeek`, all four themes share it, and the behaviour was ruled correct — `fromEnd: 8` is a house-size anchor and a final eleven IS the canon room opening. The comment in the file already says so; leave it.

- [ ] **Step 1: Write the failing test**

Extend `tests/bb-theme-high-rollers.test.js`: the theme books all three twists; the room lands three times at a final eleven, ten and nine across casts 12–20; every booked id exists in `TWIST_CATALOG` (the registry guard in `tests/bb-themes.test.js` also covers this, so run it too); and the arc emits nothing the incompatibility resolver would throw away.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/bb-theme-high-rollers.test.js`
Expected: FAIL — `books` is empty.

- [ ] **Step 3: Write the arc**

- [ ] **Step 4: Verify the whole slice**

Run: `npx vitest run tests/bb-high-rollers-room.test.js tests/bb-chopping-block-roulette.test.js tests/bb-theme-high-rollers.test.js tests/bb-themes.test.js tests/bb-bucks.test.js tests/bb-act-coverage.test.js`
Expected: PASS, all files. Then kill orphaned vitest workers.

- [ ] **Step 5: Commit**

```bash
git add js/bb/themes-high-rollers.js tests/bb-theme-high-rollers.test.js
git commit -m "feat(bb): the floor finally has a schedule"
```

---

## What this plan deliberately does not build

- **Plan 3 — the Veto Derby and the two-holder veto week.** The largest engine change of the three: `js/bb/week.js` has only ever had one veto holder, and the Derby's canon order is bettor decides → HOH replaces → PoV winner decides → HOH may replace again.
- **Plan 4 — the Coin to canon, and the adapted Wildcard.** Extending `js/bb/coin-of-destiny.js` from a nomination swap to an anonymous HOH who runs the whole week including the post-veto replacement, pricing it at 250 inside the room, and the Wildcard's random-draw solo safety that costs a punishment.
- **The theme explainer** (`docs/superpowers/specs/2026-08-15-bb-theme-explainer-design.md`) — approved and parked, to build after the games.

## Self-review notes

- **Spec coverage:** §3 (the room) → Tasks 1, 3, 4. §4's Chopping Block Roulette → Tasks 2, 3, 4. §6's arc → Task 5, including the amendment that the theme must book the two twists it already owns. §4's Veto Derby and Coin rework, and §5's Wildcard, are explicitly Plans 3–4.
- **Interface consistency:** `ROOM_GAMES` / `hasPlayed` / `openRoom` are defined in Task 1 and used under those names in Tasks 2 and 3. `playRoulette` / `spinReplacement` are defined in Task 2 and consumed in Task 3. The act type string is `high-rollers-room` in Tasks 1, 3 and 4.
- **Known soft spot:** Task 3 asks the implementer to derive the `incompatible` list rather than handing one over, because it depends on how the Roulette interacts with every other block-shaping twist — a judgment the plan cannot make honestly without the code in front of it. The task requires the reasoning be stated in the report so a reviewer can check it.
