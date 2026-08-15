# High Roller's, Plan 1: The Money and the Theme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the High Roller's theme with a working BB Bucks economy that accrues every week and is announced to the house — the foundation the room and its games are built on.

**Architecture:** A new leaf module `js/bb/bb-bucks.js` owns the ledger (`gs.bb.bucks`, a flat `{name: number}` map) and the weekly audience payout. `js/bb/week.js` calls it once a week, gated on the *theme declaring an economy* rather than on the theme's id, so a future theme can reuse the currency without touching the engine. The payout is an act (`bb-bucks`) handled by all three transcript writers, and the ledger is snapshotted per week so replays show that week's money rather than live state. The theme itself is the standard five-edit descriptor.

**Tech Stack:** ES modules, no build step. Vitest for tests. No new dependencies.

## Global Constraints

Copied from `docs/superpowers/specs/2026-08-15-bb-high-rollers-theme-design.md` and the project's non-negotiables. Every task's requirements implicitly include these.

- **Canon income tiers, exactly:** top 3 by audience vote get **100**, next 3 get **75**, everyone else gets **50**.
- **Bucks carry over** between weeks. Nothing resets them.
- **The ledger is private.** No surface may show one houseguest another's balance. What is public is the announced payout, and nothing else.
- **No bare `Math.random()`** anywhere in this slice. Use the `rng` passed in, or `stableRng(...)` from `js/bb/knowledge.js` — a bare call breaks the seeded-replay guards (`project_bb_seeded_season`).
- **Serialization:** the ledger is plain numbers keyed by name. No Sets, no functions, no `prepGsForSave` work.
- **Theme descriptor files never import `themes.js`.** That is a circular import and ESM hoisting hits `BB_THEMES` in the temporal dead zone. The registry imports themes; never the reverse.
- **Colour forms live on `.rp-page`, not `:root`.** A custom property is computed where it is declared, so `--bbx-danger: rgb(var(--bbx-danger-rgb))` in `:root` bakes in the default before a theme can move it. `tests/bb-themes.test.js` pins this.
- **Valid stats only:** `physical`, `endurance`, `mental`, `social`, `strategic`, `loyalty`, `boldness`, `intuition`, `temperament`.
- **Test command:** name the affected files — `npx vitest run tests/<file>.test.js`. Never `npm test` (the full run eats memory; audits are excluded from it anyway).

---

## File Structure

| File | Responsibility |
|---|---|
| `js/bb/bb-bucks.js` | **Create.** The ledger and the weekly audience payout. A leaf: imports `core.js`, `players.js`, `knowledge.js`, nothing from `week.js`. |
| `js/bb/themes-high-rollers.js` | **Create.** The theme descriptor — palette, fonts, the Pit Boss's voice pools, the arc. Plain default-exported object. |
| `tests/bb-bucks.test.js` | **Create.** Ledger and payout units. |
| `tests/bb-theme-high-rollers.test.js` | **Create.** Descriptor + skin + payout-in-a-real-week. |
| `js/bb/themes.js:36-53` | **Modify.** Import and register the descriptor. |
| `js/bb/week.js:1157` | **Modify.** Call the payout once a week; snapshot the ledger. |
| `js/bb-run.js:231` | **Modify.** Carry `bucksLedger` onto the episode; handle the act in `summariseWeek`. |
| `js/text-backlog.js:5661` | **Modify.** Handle the act in the in-app summary. |
| `js/vp-screens.js:22237` | **Modify.** Handle the act in the visual player. |
| `js/vp-screens.js:16446-16549` | **Modify.** Add `_bbChipBand`, drawn beside `_bbPowerBand` on House Life. |
| `js/vp-screens.js:18952` | **Modify.** Add the `_rpThemeBeatPitBoss` branch. |
| `css/simulator.css` | **Modify.** The `.rp-theme-high-rollers` block, warm and hostile. |
| `simulator.html:274` | **Modify.** The `<option>` in the `cfg-theme` select. |

---

### Task 1: The ledger and the weekly payout

**Files:**
- Create: `js/bb/bb-bucks.js`
- Test: `tests/bb-bucks.test.js`

**Interfaces:**
- Consumes: `gs` from `../core.js`; `stableRng` from `./knowledge.js`.
- Produces:
  - `balance(name) -> number`
  - `canAfford(name, amount) -> boolean`
  - `spend(name, amount) -> boolean` (false and no mutation when short)
  - `credit(name, amount) -> number` (new balance)
  - `bucksLedgerFor(house) -> Array<{name, balance}>`
  - `awardWeeklyBucks({week, house, rng}) -> {type:'bb-bucks', week, payouts, beats} | null`
  - `PAYOUT_TIERS` — frozen `[{count:3, amount:100}, {count:3, amount:75}]`, remainder 50.

- [ ] **Step 1: Write the failing test**

Create `tests/bb-bucks.test.js`:

```javascript
// The money. Canon tiers, canon carry-over, and a ledger nobody else can read.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs } from '../js/core.js';
import { balance, canAfford, spend, credit, bucksLedgerFor,
  awardWeeklyBucks, PAYOUT_TIERS } from '../js/bb/bb-bucks.js';

const HOUSE = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly'];

// A deterministic rng so a payout is reproducible inside one test.
function seq(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

beforeEach(() => {
  gs.bb = { weeks: [], bucks: {} };
  gs.popularity = {};
});

describe('the ledger', () => {
  it('starts everybody at nothing', () => {
    expect(balance('Bowie')).toBe(0);
  });

  it('credits and reads back', () => {
    credit('Bowie', 100);
    credit('Bowie', 50);
    expect(balance('Bowie')).toBe(150);
  });

  it('refuses to spend money that is not there', () => {
    credit('Bowie', 50);
    expect(canAfford('Bowie', 125)).toBe(false);
    expect(spend('Bowie', 125)).toBe(false);
    expect(balance('Bowie')).toBe(50);
  });

  it('spends what is there', () => {
    credit('Bowie', 125);
    expect(spend('Bowie', 125)).toBe(true);
    expect(balance('Bowie')).toBe(0);
  });

  it('survives a round trip through JSON, because saves do', () => {
    credit('Bowie', 75);
    const revived = JSON.parse(JSON.stringify(gs.bb.bucks));
    expect(revived.Bowie).toBe(75);
  });
});

describe('the weekly payout', () => {
  it('pays the canon tiers: three at 100, three at 75, the rest at 50', () => {
    const act = awardWeeklyBucks({ week: { num: 1 }, house: HOUSE, rng: seq([0.1, 0.4, 0.7]) });
    const amounts = act.payouts.map(p => p.amount).sort((a, b) => b - a);
    expect(amounts.filter(a => a === 100)).toHaveLength(3);
    expect(amounts.filter(a => a === 75)).toHaveLength(3);
    expect(amounts.filter(a => a === 50)).toHaveLength(HOUSE.length - 6);
  });

  it('pays every houseguest exactly once', () => {
    const act = awardWeeklyBucks({ week: { num: 1 }, house: HOUSE, rng: seq([0.2, 0.5, 0.9]) });
    expect(act.payouts.map(p => p.name).sort()).toEqual([...HOUSE].sort());
  });

  it('writes the payout into the ledger and carries it across weeks', () => {
    awardWeeklyBucks({ week: { num: 1 }, house: HOUSE, rng: seq([0.2, 0.5, 0.9]) });
    const afterOne = HOUSE.map(balance);
    awardWeeklyBucks({ week: { num: 2 }, house: HOUSE, rng: seq([0.3, 0.6, 0.8]) });
    HOUSE.forEach((name, i) => expect(balance(name)).toBeGreaterThan(afterOne[i] - 1));
    // Nobody can be poorer after a payout than before one.
    expect(HOUSE.every(n => balance(n) >= 100)).toBe(true);
  });

  it('leans towards the houseguests the audience actually likes', () => {
    gs.popularity = { Bowie: 9, Chase: 9, Ripper: 9 };
    let top = 0;
    for (let s = 0; s < 60; s++) {
      gs.bb.bucks = {};
      const rng = seq([(s % 10) / 10, ((s * 3) % 10) / 10, ((s * 7) % 10) / 10]);
      const act = awardWeeklyBucks({ week: { num: 1 }, house: HOUSE, rng });
      const hundreds = act.payouts.filter(p => p.amount === 100).map(p => p.name);
      top += hundreds.filter(n => ['Bowie', 'Chase', 'Ripper'].includes(n)).length;
    }
    // 3 of 8 at random would be ~67 over 60 draws of 3. Weighted must beat that clearly.
    expect(top).toBeGreaterThan(90);
  });

  it('pays nobody in a house too small to have tiers', () => {
    expect(awardWeeklyBucks({ week: { num: 1 }, house: ['Bowie', 'Chase'], rng: seq([0.5]) })).toBeNull();
  });

  it('names a real tier on every payout, for the transcript', () => {
    const act = awardWeeklyBucks({ week: { num: 1 }, house: HOUSE, rng: seq([0.2, 0.5, 0.9]) });
    expect(act.type).toBe('bb-bucks');
    expect(act.beats.length).toBeGreaterThan(0);
    act.payouts.forEach(p => expect(['top', 'middle', 'floor']).toContain(p.tier));
  });

  it('never reports another houseguest\'s balance in a beat', () => {
    credit('Bowie', 500);
    const act = awardWeeklyBucks({ week: { num: 2 }, house: HOUSE, rng: seq([0.2, 0.5, 0.9]) });
    expect(act.beats.some(b => b.text.includes('500'))).toBe(false);
  });

  it('frozen tiers, so nothing downstream can retune canon by accident', () => {
    expect(Object.isFrozen(PAYOUT_TIERS)).toBe(true);
  });
});

describe('the snapshot', () => {
  it('reports a balance for every houseguest in the room', () => {
    credit('Bowie', 100);
    const ledger = bucksLedgerFor(HOUSE);
    expect(ledger).toHaveLength(HOUSE.length);
    expect(ledger.find(l => l.name === 'Bowie').balance).toBe(100);
    expect(ledger.find(l => l.name === 'Chase').balance).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/bb-bucks.test.js`
Expected: FAIL — `Failed to resolve import "../js/bb/bb-bucks.js"`.

- [ ] **Step 3: Write the implementation**

Create `js/bb/bb-bucks.js`:

```javascript
// ══════════════════════════════════════════════════════════════════════
// bb/bb-bucks.js — the first currency this simulator has ever had
// ══════════════════════════════════════════════════════════════════════
//
// BB23's High Roller's Room ran on money, and money is the one thing every
// other twist in this game has managed without: a power is granted or it is
// not, and the decision behind it is a probability. A balance is different.
// It is a fact a houseguest carries between weeks, it is spent once, and
// spending it in week six is a decision not to spend it in week nine.
//
// Income is an AUDIENCE vote, which is the detail that makes this worth
// building rather than a scoreboard. The money follows who is WATCHED, not who
// is good — so the quiet strong player is poor, and the payout, which is
// announced, tells the whole house every week who the audience loves. That
// leak is a real fact the room can act on before a single dollar is spent.
//
// The ledger itself is private, per canon: a houseguest knows their own
// balance and nobody has a scoreboard of everybody else's savings. What the
// house sees is the announced tiers and, later, who walks into the room. Three
// facts and a lot of inference, which is a better shape than a public number
// that removes the inference.
import { gs } from '../core.js';

/**
 * The canon tiers, frozen.
 *
 * "The three houseguests who received the most votes would receive $100 in BB
 * Bucks. The next three would receive $75, and the remaining houseguests would
 * receive $50." Everybody is paid something every week, which is what makes
 * saving possible for the people the audience is ignoring — slowly.
 */
export const PAYOUT_TIERS = Object.freeze([
  Object.freeze({ count: 3, amount: 100, tier: 'top' }),
  Object.freeze({ count: 3, amount: 75, tier: 'middle' }),
]);
const FLOOR = Object.freeze({ amount: 50, tier: 'floor' });

/** The ledger, created on first touch so a pre-feature save can grow one. */
function ledger() {
  if (!gs.bb) gs.bb = {};
  if (!gs.bb.bucks) gs.bb.bucks = {};
  return gs.bb.bucks;
}

export function balance(name) {
  return ledger()[name] || 0;
}

export function canAfford(name, amount) {
  return balance(name) >= amount;
}

export function credit(name, amount) {
  const l = ledger();
  l[name] = (l[name] || 0) + amount;
  return l[name];
}

/** Take the money. Returns false and changes nothing when they are short. */
export function spend(name, amount) {
  if (!canAfford(name, amount)) return false;
  ledger()[name] -= amount;
  return true;
}

/** Everybody's balance, for a snapshot. Never rendered to the house. */
export function bucksLedgerFor(house = gs.activePlayers || []) {
  return house.filter(Boolean).map(name => ({ name, balance: balance(name) }));
}

const TOP_LINE = [
  n => `${n} takes the top of the vote and a hundred with it, which is the audience telling this house something it did not ask to be told.`,
  n => `A hundred for ${n}. Somebody out there is watching ${n} more closely than anybody in that room is.`,
  n => `${n} is paid at the top. The number is public and so, therefore, is how much the audience likes ${n}.`,
  n => `The floor pays ${n} a hundred, and every houseguest does that arithmetic in silence.`,
];
const FLOOR_LINE = [
  n => `${n} is paid fifty, which is the floor, and the floor is a verdict.`,
  n => `Fifty for ${n} — the amount you get for being in the building.`,
  n => `${n} collects the minimum and says nothing about it, which is the correct play and does not help.`,
  n => `The floor pays ${n} fifty. Saving it is now a plan rather than a preference.`,
];

/**
 * Draw `n` names without replacement, weighted by popularity.
 *
 * The same weighting the audience vote already uses in `care-package.js`
 * (`max(0.6, 3 + popularity)`), and the same reason: a pure ranking hands the
 * top tier to the identical three people for fifteen weeks, which is a
 * scoreboard rather than a vote. The floor of 0.6 means an unpopular
 * houseguest is unlikely rather than ineligible.
 */
function drawWeighted(pool, n, rng) {
  const left = pool.map(name => ({
    name, weight: Math.max(0.6, 3 + (gs.popularity?.[name] || 0)),
  }));
  const picked = [];
  while (picked.length < n && left.length) {
    const total = left.reduce((sum, e) => sum + e.weight, 0);
    let roll = rng() * total;
    let idx = 0;
    while (idx < left.length - 1 && roll > left[idx].weight) { roll -= left[idx].weight; idx++; }
    picked.push(left.splice(idx, 1)[0].name);
  }
  return picked;
}

/**
 * The week's payout.
 *
 * @returns {object|null} the act, or null in a house too small for tiers
 */
export function awardWeeklyBucks({ week, house = [], rng = Math.random } = {}) {
  const room = house.filter(Boolean);
  // Six is the smallest house the canon tiers describe. Below it the "top
  // three" and the "next three" are the whole room and the vote says nothing.
  if (room.length < 7) return null;

  const payouts = [];
  let pool = [...room];
  for (const tier of PAYOUT_TIERS) {
    const won = drawWeighted(pool, tier.count, rng);
    for (const name of won) {
      credit(name, tier.amount);
      payouts.push({ name, amount: tier.amount, tier: tier.tier });
    }
    pool = pool.filter(n => !won.includes(n));
  }
  for (const name of pool) {
    credit(name, FLOOR.amount);
    payouts.push({ name, amount: FLOOR.amount, tier: FLOOR.tier });
  }

  // Two beats, not fifteen: the transcript wants the shape of the vote, not a
  // reading of the whole ledger. And a beat may never state a balance — only
  // what was paid this week, which is the part the house was told.
  const beats = [];
  const topName = payouts.find(p => p.tier === 'top')?.name;
  const floorName = payouts.find(p => p.tier === 'floor')?.name;
  if (topName) {
    beats.push({ text: TOP_LINE[Math.floor(rng() * TOP_LINE.length)](topName),
      players: [topName], badgeText: 'PAID AT THE TOP', badgeClass: 'gold' });
  }
  if (floorName) {
    beats.push({ text: FLOOR_LINE[Math.floor(rng() * FLOOR_LINE.length)](floorName),
      players: [floorName], badgeText: 'PAID THE FLOOR', badgeClass: 'grey' });
  }

  return { type: 'bb-bucks', week: week?.num || 0, secret: false, payouts, beats };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/bb-bucks.test.js`
Expected: PASS, all cases.

- [ ] **Step 5: Commit**

```bash
git add js/bb/bb-bucks.js tests/bb-bucks.test.js
git commit -m "feat(bb): BB Bucks — the first currency, on canon audience tiers"
```

---

### Task 2: Pay the house once a week

**Files:**
- Modify: `js/bb/week.js:1157` (after the week object is built), and `js/bb/week.js:5809` (beside the power ledger snapshot)
- Modify: `js/bb-run.js:231` (carry the snapshot onto the episode)
- Test: `tests/bb-theme-high-rollers.test.js` (created here, extended in Task 4)

**Interfaces:**
- Consumes: `awardWeeklyBucks`, `bucksLedgerFor` from Task 1; `currentTheme` from `./themes.js`.
- Produces: `week.bucksLedger` — `Array<{name, balance}>`; `ep.bucksLedger` — the same array on the episode; an act of type `bb-bucks` in `week.acts`.

The gate is **the theme declaring an economy**, not its id. A theme is a schedule, a voice and a skin; giving the engine a capability to look for is how the fourth theme's currency becomes available to a fifth without another engine edit.

- [ ] **Step 1: Write the failing test**

Create `tests/bb-theme-high-rollers.test.js`:

```javascript
// The money, in a real week.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { balance } from '../js/bb/bb-bucks.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house({ theme = 'high-rollers' } = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', theme });
  seasonConfig.twistSchedule = [];
}

describe('the floor pays every week', () => {
  it('pays the house on a High Roller\'s season', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      expect(NAMES.every(n => balance(n) >= 50)).toBe(true);
    });
  });

  it('pays nobody on a season running another theme', () => {
    withSeededRandom(7, () => {
      house({ theme: 'summer-of-mystery' });
      simulateBBEpisode();
      expect(NAMES.every(n => balance(n) === 0)).toBe(true);
    });
  });

  it('pays nobody on an unthemed season', () => {
    withSeededRandom(7, () => {
      house({ theme: 'none' });
      simulateBBEpisode();
      expect(NAMES.every(n => balance(n) === 0)).toBe(true);
    });
  });

  it('emits the act into the week', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      const week = gs.bb.weeks[0];
      expect(week.acts.some(a => a.type === 'bb-bucks')).toBe(true);
    });
  });

  it('snapshots the ledger onto the week, so a replay shows that week\'s money', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      const one = gs.bb.weeks[0].bucksLedger;
      simulateBBEpisode();
      const two = gs.bb.weeks[1].bucksLedger;
      expect(one.find(l => l.name === 'Bowie').balance)
        .toBeLessThan(two.find(l => l.name === 'Bowie').balance);
    });
  });

  it('carries the snapshot onto the episode', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      const ep = gs.episodeHistory[gs.episodeHistory.length - 1];
      expect(Array.isArray(ep.bucksLedger)).toBe(true);
      expect(ep.bucksLedger.length).toBe(NAMES.length);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/bb-theme-high-rollers.test.js`
Expected: FAIL — the balances are all 0, and there is no `bb-bucks` act. (The `theme: 'high-rollers'` season also resolves to no theme until Task 4; that is fine, these first failures are the ones that matter.)

- [ ] **Step 3: Wire the payout into the week**

In `js/bb/week.js`, add to the import block near line 91:

```javascript
import { awardWeeklyBucks, bucksLedgerFor } from './bb-bucks.js';
```

and near the other theme import in that file (`currentTheme` may already be imported — check before adding a duplicate):

```javascript
import { currentTheme } from './themes.js';
```

Then immediately after the `week.blocReads` line (~1167), insert:

```javascript
  // ── the audience pays the house ──
  //
  // Gated on the theme DECLARING an economy rather than on its id: a theme is
  // a schedule, a voice and a skin, and the engine asking "does this season
  // run on money?" is how the fifth theme gets a currency without a sixth
  // engine edit. It also keeps an unthemed season exactly as it was.
  //
  // First thing in the week, before anybody nominates anybody, because the
  // payout is information — it tells the room who the audience is watching,
  // and the room is allowed to act on that all week.
  if (currentTheme()?.economy === 'bb-bucks') {
    try {
      const payout = awardWeeklyBucks({ week, house, rng });
      if (payout) week.acts.push(addBeats(payout, { players: payout.payouts.map(p => p.name).slice(0, 4) }));
    } catch { /* money is not load-bearing for the week */ }
  }
```

Then beside the power-ledger snapshot at `js/bb/week.js:5809`, add:

```javascript
  week.bucksLedger = bucksLedgerFor(house);
```

- [ ] **Step 4: Carry it onto the episode**

In `js/bb-run.js`, at line 231 beside `powerLedger`, add:

```javascript
    bucksLedger: (week.bucksLedger || []).map(l => ({ ...l })),
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/bb-theme-high-rollers.test.js`
Expected: the "pays nobody" cases PASS. The four positive cases still FAIL, because `high-rollers` is not a registered theme until Task 4. That is the expected intermediate state — do not chase it here.

Run the regression check that this did not disturb an ordinary week:
`npx vitest run tests/bb-act-coverage.test.js tests/bb-themes.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/bb/week.js js/bb-run.js tests/bb-theme-high-rollers.test.js
git commit -m "feat(bb): pay the house weekly when the theme declares an economy"
```

---

### Task 3: The act, in all three transcripts

**Files:**
- Modify: `js/bb-run.js:1609` (`summariseWeek`)
- Modify: `js/text-backlog.js:5661`
- Modify: `js/vp-screens.js:22237`
- Test: `tests/bb-act-coverage.test.js` (existing guard — no new test file)

`tests/bb-act-coverage.test.js` plays real weeks, collects the act types the engine actually emitted, and asserts each is handled by both writers. An act handled in one writer and not the other is the failure this project has shipped once per slice for eleven slices — this task exists so it is not twelve.

- [ ] **Step 1: Run the guard to see it fail**

The guard's `house()` helper takes a `theme` option. Add a case to `tests/bb-act-coverage.test.js` in the same style as the existing ones, so the guard actually plays a High Roller's season:

```javascript
  it('transcribes every act a High Roller\'s season emits', () => {
    withSeededRandom(11, () => {
      house([], { theme: 'high-rollers' });
      simulateBBEpisode();
      simulateBBEpisode();
      const emitted = new Set(gs.bb.weeks.flatMap(w => w.acts.map(a => a.type)));
      expect(emitted).toContain('bb-bucks');
      for (const type of emitted) {
        expect(runCases.has(type) || FOLDED.has(type)).toBe(true);
        expect(backlogCases.has(type) || FOLDED.has(type)).toBe(true);
      }
    });
  });
```

Read the top of the existing file first and match its actual helper names (`runCases`, `backlogCases`, `FOLDED`) — they are established there; use whatever it really calls them rather than these if they differ.

Run: `npx vitest run tests/bb-act-coverage.test.js`
Expected: FAIL — `bb-bucks` is handled by neither writer.

- [ ] **Step 2: Handle it in `summariseWeek`**

In `js/bb-run.js`, in the switch at ~1609, beside `case 'theme-beat':`:

```javascript
      case 'bb-bucks': {
        const top = act.payouts.filter(p => p.tier === 'top').map(p => p.name);
        lines.push(`THE VOTE: the audience pays out. ${top.join(', ')} take the top of the vote.`);
        for (const b of act.beats || []) lines.push(`  ${b.text}`);
        break;
      }
```

Match the surrounding cases' actual accumulator name (`lines` here is illustrative — read the neighbouring cases and use theirs).

- [ ] **Step 3: Handle it in the backlog**

In `js/text-backlog.js`, in the switch at ~5661:

```javascript
      case 'bb-bucks': {
        const top = (act.payouts || []).filter(p => p.tier === 'top').map(p => p.name);
        sec('THE AUDIENCE PAYS');
        ln(`The vote is announced. ${top.join(', ')} are paid at the top of it, and everybody in that room now knows who the audience is watching.`);
        for (const b of act.beats || []) ln(b.text);
        break;
      }
```

Again: read the neighbouring cases and use their real `ln`/`sec` helpers.

- [ ] **Step 4: Handle it in the visual player**

In `js/vp-screens.js`, in the switch at ~22237, add a `case 'bb-bucks':` that pushes a screen in exactly the shape its neighbours use. Do not invent a new screen contract — copy the adjacent case's `vpScreens.push({ id, label, html })` shape and render: the three tiers as three rows, names and amounts, and the act's beats beneath. **No balances** — only this week's payout.

- [ ] **Step 5: Run the guard**

Run: `npx vitest run tests/bb-act-coverage.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/bb-run.js js/text-backlog.js js/vp-screens.js tests/bb-act-coverage.test.js
git commit -m "feat(bb): transcribe the payout in all three writers"
```

---

### Task 4: The theme descriptor

**Files:**
- Create: `js/bb/themes-high-rollers.js`
- Modify: `js/bb/themes.js:36-53`
- Modify: `simulator.html:274`
- Test: `tests/bb-theme-high-rollers.test.js` (extend), `tests/bb-themes.test.js` (existing guard)

**Interfaces:**
- Produces: a default-exported descriptor with `id: 'high-rollers'`, `economy: 'bb-bucks'` (the flag Task 2 gates on), `palette`, `fonts`, `antagonist.voice`, `arc`, `books: []`, `weights`, `bans: []`, `exclusive: []`.

- [ ] **Step 1: Write the failing test**

Append to `tests/bb-theme-high-rollers.test.js`:

```javascript
import { themeById, themeScheduleEntries } from '../js/bb/themes.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

describe('the descriptor', () => {
  const theme = () => themeById('high-rollers');

  it('is registered', () => {
    expect(theme()).toBeTruthy();
    expect(theme().name).toBe("High Roller's");
  });

  it('declares the economy the engine gates on', () => {
    expect(theme().economy).toBe('bb-bucks');
  });

  it('binds to the resort', () => {
    expect(theme().house).toBe('bb-resort');
  });

  it('has a Pit Boss with both registers at every hook', () => {
    const voice = theme().antagonist.voice;
    for (const hook of ['open', 'noms', 'veto', 'vote', 'finale', 'crown']) {
      expect(voice[hook].neutral.length).toBeGreaterThanOrEqual(4);
      expect(voice[hook].hostile.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('never says "the house" for the room — that is the roster\'s word', () => {
    const voice = theme().antagonist.voice;
    const all = Object.values(voice).flatMap(h => [...h.neutral, ...h.hostile]);
    expect(all.some(line => /\bthe house\b/i.test(line))).toBe(false);
  });

  it('turns cold before the endgame at every cast size', () => {
    for (const weeks of [9, 12, 15, 17]) {
      const entries = themeScheduleEntries(theme(), { weeks });
      const turn = entries.find(e => e.mood === 'hostile');
      expect(turn).toBeTruthy();
      expect(turn.episode).toBeLessThan(weeks);
    }
  });

  it('books no twists yet — the room is Plan 2', () => {
    expect(theme().books).toEqual([]);
  });

  it('is offered in the config select, which is hand-written markup', () => {
    const html = readFileSync(fileURLToPath(new URL('../simulator.html', import.meta.url)), 'utf8');
    const select = html.match(/<select id="cfg-theme"[\s\S]*?<\/select>/)[0];
    expect(select).toContain('value="high-rollers"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/bb-theme-high-rollers.test.js`
Expected: FAIL — `themeById('high-rollers')` is null.

- [ ] **Step 3: Write the descriptor**

Create `js/bb/themes-high-rollers.js`. Follow `js/bb/themes-mystery.js` for shape and comment density — the descriptor files in this project explain *why* the season is the way it is, and a bare data object would be the odd one out.

The content requirements, all of which the tests above pin:

- `id: 'high-rollers'`, `name: "High Roller's"`, `house: 'bb-resort'`, `economy: 'bb-bucks'`.
- `tagline` — one line in the Pit Boss's register.
- `palette: { accent: '#c9a227', ink: '#f2e6c8', paper: '#0b0708', glow: '#f0d585' }` — brass on black lacquer. **Not green**: Summer of Mystery owns green and no two themes share a surface.
- `fonts` — a display serif with real weight to it and a plain body face, in the same fallback-chain style as the other three.
- `antagonist: { name: 'The Pit Boss', mood: 'neutral', voice: {...} }` with `open`, `noms`, `veto`, `vote`, `finale`, `crown`, each with `neutral` and `hostile` arrays of **at least 4** lines.
  - **Neutral** is hospitality: the floor is delighted you are playing, the drinks are comped, and it is counting the whole time. Never threatens.
  - **Hostile** is not anger, it is accounting: the comps have stopped and the markers are being called in.
  - **The lines may never contain "the house"** — the roster owns that phrase and the antagonist saying it makes `summariseWeek` ambiguous. Say *the floor*, *the room*, *the edge*.
  - Tokens available: `{week}`, `{hoh}`, `{nominees}`, `{veto}`, `{evicted}`, `{margin}`, `{finalists}`, `{winner}` — same set the other three use.
- `arc`: the mood turn only, in both required forms (a `frac` for long seasons and a `fromEnd` backstop, because a `frac` turn alone lands after the endgame has begun on a short season):

```javascript
  arc: [
    { at: { frac: 0.55 }, mood: 'hostile' },
    { at: { fromEnd: 8 }, mood: 'hostile' },
  ],
```

- `books: []`, `weights: {}`, `bans: []`, `exclusive: []`. The room and its games are Plan 2; booking a twist that has no engine is how a theme ships a week that does nothing.

- [ ] **Step 4: Register it**

In `js/bb/themes.js`, beside the other three imports (~line 38):

```javascript
import HIGH_ROLLERS from './themes-high-rollers.js';
```

and add it to the `BB_THEMES` object at line 48, keyed by its id.

- [ ] **Step 5: Add the config option**

In `simulator.html`, after line 273 inside the `cfg-theme` select:

```html
                <option value="high-rollers">🎲 High Roller's (the floor pays you, and the floor always wins)</option>
```

- [ ] **Step 6: Run the tests**

Run: `npx vitest run tests/bb-theme-high-rollers.test.js tests/bb-themes.test.js`
Expected: PASS — including the four Task 2 cases that were waiting on registration, and the existing registry guard (`only books twists that exist`, `binds every theme to a house the format actually has`, and the `cfg-theme` option check).

- [ ] **Step 7: Commit**

```bash
git add js/bb/themes-high-rollers.js js/bb/themes.js simulator.html tests/bb-theme-high-rollers.test.js
git commit -m "feat(bb): High Roller's — the Pit Boss, and a season that runs on money"
```

---

### Task 5: The skin — warm salon, cold count room

**Files:**
- Modify: `css/simulator.css` (add a `.rp-theme-high-rollers` block beside the other three)
- Modify: `js/vp-screens.js:18952` (the `rpBuildBBThemeBeat` dispatch) and a new `_rpThemeBeatPitBoss` beside `_rpThemeBeatMystery` at ~19093
- Test: `tests/bb-theme-vp.test.js` (existing), `tests/bb-themes.test.js` (existing — it pins where the colour forms live)

- [ ] **Step 1: Write the failing test**

Append to `tests/bb-theme-high-rollers.test.js`:

```javascript
describe('the skin', () => {
  const css = () => readFileSync(fileURLToPath(new URL('../css/simulator.css', import.meta.url)), 'utf8');

  it('has its own theme block', () => {
    expect(css()).toContain('.rp-theme-high-rollers');
  });

  it('goes COLD when the comps stop, not red like the others', () => {
    const block = css().match(/\.rp-theme-high-rollers[\s\S]*?(?=\n\/\* ──|\n\.rp-theme-(?!high-rollers))/)[0];
    const hostile = block.match(/\.rp-theme-high-rollers\.rp-theme-hostile[\s\S]*?\}/)[0];
    // The turn is a temperature flip: the warm brass tokens are replaced, and
    // what replaces them is not another warm colour.
    expect(hostile).toMatch(/--bbx/);
    expect(hostile).not.toMatch(/#c9a227/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/bb-theme-high-rollers.test.js`
Expected: FAIL — no `.rp-theme-high-rollers` in the stylesheet.

- [ ] **Step 3: Write the CSS**

Find the existing `.rp-theme-summer-of-mystery` block in `css/simulator.css` and add the new one beside it, matching its structure exactly — same tokens, same selectors, same ordering.

Two hard requirements:

1. **The colour forms live on `.rp-page`**, below the theme class — never on `:root`. A custom property is computed where it is declared, so a form declared in `:root` bakes in the default before a theme can move it. `tests/bb-themes.test.js` pins this; the mystery block is the working example to copy.
2. **The hostile block flips temperature.** Neutral is warm: brass `#c9a227`, ivory ink, black lacquer paper, low lamplight glow. Hostile is the count room: steel, hard blue-white fluorescent, high contrast, every warm tone gone. This is the only theme on the shelf that escalates cold — the other two go red and Summer of Mystery drains warm — so a reviewer comparing the two blocks should be able to see the difference at a glance.

- [ ] **Step 4: Write the theme beat**

In `js/vp-screens.js`, add to the dispatch at line 18952:

```javascript
  if (act?.themeId === 'high-rollers') return _rpThemeBeatPitBoss(ep, act);
```

and write `_rpThemeBeatPitBoss(ep, act)` beside `_rpThemeBeatMystery` (~19093), following that function's structure. The visual language is the pit: a brass rail, a felt surface, the Pit Boss's line set like a floor announcement. On a hostile beat it is lit by the count-room fluorescents instead.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/bb-theme-high-rollers.test.js tests/bb-theme-vp.test.js tests/bb-themes.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add css/simulator.css js/vp-screens.js tests/bb-theme-high-rollers.test.js
git commit -m "feat(bb): the pit, and the count room it turns into"
```

---

### Task 6: The chip count on House Life

**Files:**
- Modify: `js/vp-screens.js:16446` (add `_bbChipBand` beside `_bbPowerBand`) and `js/vp-screens.js:16549` (draw it)
- Test: `tests/bb-theme-high-rollers.test.js` (extend)

The band shows **this week's announced payout** and nothing else. It must not become a savings scoreboard — that is the canon call the spec made, and the inference is the point.

- [ ] **Step 1: Write the failing test**

Append to `tests/bb-theme-high-rollers.test.js`:

```javascript
import { buildVPScreens } from '../js/vp-screens.js';

describe('the chip band', () => {
  it('shows the week\'s payout on House Life and never a balance', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      simulateBBEpisode();   // week 2, so balances are 100-200 and distinct from payouts
      const ep = gs.episodeHistory[gs.episodeHistory.length - 1];
      const screens = buildVPScreens(ep);
      const html = screens.map(s => s.html).join('');
      expect(html).toMatch(/THE FLOOR PAYS|CHIP COUNT/i);
      // A payout is 50, 75 or 100. A week-2 balance is not, and must not appear.
      const balances = ep.bucksLedger.map(l => l.balance).filter(b => ![0, 50, 75, 100].includes(b));
      for (const b of balances) expect(html).not.toContain(`>${b}<`);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/bb-theme-high-rollers.test.js`
Expected: FAIL — no band in the output.

- [ ] **Step 3: Write the band**

In `js/vp-screens.js`, add `_bbChipBand(ep)` immediately after `_bbPowerBand` (which ends before line 16549). Model it on `_bbPowerBand`: return `''` when there is nothing to draw, escape every name with `_bbEsc`, use `_bbAvatar` for portraits.

It reads the week's `bb-bucks` act from `ep` (the same place the other bands find their data — check how `_bbPowerBand` gets `ep.powerLedger` and follow that route), groups the payouts into the three tiers, and draws them as three rows: **100 / 75 / 50**, names under each.

Then draw it at line 16549, beside the power band:

```javascript
      ${_bbPowerBand(ep)}
      ${_bbChipBand(ep)}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/bb-theme-high-rollers.test.js`
Expected: PASS.

- [ ] **Step 5: Verify the whole slice together**

Run: `npx vitest run tests/bb-bucks.test.js tests/bb-theme-high-rollers.test.js tests/bb-themes.test.js tests/bb-theme-vp.test.js tests/bb-act-coverage.test.js`
Expected: PASS, all files.

Then kill any orphaned vitest workers before moving on (this project's test runs leave them behind).

- [ ] **Step 6: Commit and push**

```bash
git add js/vp-screens.js tests/bb-theme-high-rollers.test.js
git commit -m "feat(bb): the chip count band — what the floor paid, never what anybody saved"
git push origin main
```

---

## What this plan deliberately does not build

Three follow-on plans, each shippable on its own, written when this one lands:

- **Plan 2 — the room and the Chopping Block Roulette.** `js/bb/high-rollers-room.js`, the entry decision (`spendPull` is the existing shape for it), money taken on entry and not on winning, once-per-game-per-season, and the Roulette's safety + removal + random spin. The arc books the three room weeks at `fromEnd` 8/7/6. This is the plan that makes the money mean something.
- **Plan 3 — the Veto Derby and the two-holder veto week.** The largest engine change in the slice: `js/bb/week.js:3893` onward has only ever had one veto holder, and the Derby's canon order is bettor decides → HOH replaces → PoV winner decides → HOH may replace again.
- **Plan 4 — the Coin to canon, and the Wildcard.** Extending `js/bb/coin-of-destiny.js` from a nomination swap to an anonymous HOH who runs the whole week including the post-veto replacement, and the Wildcard's bloc-based solo safety that costs a punishment.

## Self-review notes

- **Spec coverage for this plan's scope:** identity §1 → Tasks 4 and 5; the currency §2 → Tasks 1, 2, 3, 6; integration checklist items 1–5 → Tasks 4 and 5; item 9 (the chip band) → Task 6; item 10 (both writers) → Task 3. Spec §3, §4, §5 and the arc's room bookings in §6 are explicitly deferred to Plans 2–4 above; §6's mood turn is in Task 4.
- **Interface consistency:** `awardWeeklyBucks` / `bucksLedgerFor` / `balance` / `spend` / `credit` / `canAfford` / `PAYOUT_TIERS` are defined in Task 1 and used under those exact names in Tasks 2 and 6. The gate field is `economy: 'bb-bucks'` in both Task 2's engine check and Task 4's descriptor. The snapshot is `week.bucksLedger` in Task 2 and `ep.bucksLedger` in Tasks 2 and 6.
- **Known soft spot:** Tasks 3, 5 and 6 tell the implementer to match neighbouring code rather than quoting the full surrounding function, because those three switch statements and two band builders are long and their real helper names must be read from the file. Every such step names the exact file and line to read first.
