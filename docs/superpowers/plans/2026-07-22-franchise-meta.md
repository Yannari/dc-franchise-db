# Franchise Meta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persistent franchise ledger + four meta mechanics (reputation threat, carried relationships, learned behavior, narrative callbacks) so returnees carry real history between seasons.

**Architecture:** New module `js/franchise-meta.js` (imports ONLY `core.js` — this is a hard constraint, see below) owns an in-memory ledger + `META_WEIGHTS` + pure functions. Persistence lives in `js/savestate.js` (new IndexedDB object store, DB version 2). Recording hooks into `finale.js`; meta build hooks into `initGameState()`; mechanics are small proportional multipliers at existing roll sites.

**Tech Stack:** Vanilla ES modules (no build step), IndexedDB, vitest + jsdom headless harness (`tests/helpers/season-harness.js`).

## Global Constraints

- **Import rule:** `franchise-meta.js` may import ONLY `core.js`. `bonds.js → players.js` and `savestate.js` will import franchise-meta; importing them back creates a cycle. Bond keys are duplicated locally as `[a,b].sort().join('||')` (matches `bKey` in bonds.js:7).
- All gameplay effects are **proportional multipliers** — never `if (stat >= X)` gates.
- `gs.franchiseMeta` must be plain serializable data: no functions, no Sets (use object maps).
- Only the 9 valid stats; only the 15 valid archetypes; `pronouns()` has no `Pos` property.
- Narrative callback text: **4+ variants per category**.
- Camp events need `players: []` + `badgeText`/`badgeClass` + real consequences.
- Windows PowerShell environment; run tests with `npx vitest run <file>`.
- Commit after every task. Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Ledger persistence + module skeleton

**Files:**
- Create: `js/franchise-meta.js`
- Modify: `js/savestate.js:11-24` (DB version + store), `js/savestate.js` (two new helpers + load/persist functions)
- Modify: `js/main.js` (import + module spread + startup load)
- Test: `tests/franchise-meta.test.js`

**Interfaces:**
- Produces: `franchiseLedger` (exported let, shape `{ seasons: {} }`), `setFranchiseLedger(obj)`, `META_WEIGHTS` (exported const) from `franchise-meta.js`; `loadFranchiseLedgerFromDb()`, `persistFranchiseLedger()` (async, exported) from `savestate.js`.

- [ ] **Step 1: Write the failing test**

Create `tests/franchise-meta.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { franchiseLedger, setFranchiseLedger, META_WEIGHTS } from '../js/franchise-meta.js';

describe('franchise-meta skeleton', () => {
  it('exposes an empty ledger and weights', () => {
    expect(franchiseLedger).toEqual({ seasons: {} });
    expect(META_WEIGHTS.repThreatFactor).toBeGreaterThan(0);
  });
  it('setFranchiseLedger replaces the ledger', () => {
    setFranchiseLedger({ seasons: { '10': { seasonName: 'X', players: {} } } });
    expect(franchiseLedger.seasons['10'].seasonName).toBe('X');
    setFranchiseLedger({ seasons: {} });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/franchise-meta.test.js`
Expected: FAIL — cannot resolve `../js/franchise-meta.js`.

- [ ] **Step 3: Create `js/franchise-meta.js`**

```javascript
// Franchise meta — persistent cross-season history (ledger) + season-start
// meta profiles. IMPORT RULE: this module imports ONLY core.js; bonds.js and
// savestate.js import US, so importing them back would create a cycle.
import { gs, players, seasonConfig } from './core.js';

// Must match bKey() in bonds.js (can't import it — cycle via players.js).
export function metaBondKey(a, b) { return [a, b].sort().join('||'); }

export let franchiseLedger = { seasons: {} };
export function setFranchiseLedger(v) { franchiseLedger = v && v.seasons ? v : { seasons: {} }; }

export const META_WEIGHTS = {
  // Mechanic 1 — reputation threat
  repThreatFactor: 0.35,      // threatScore multiplier bump at repScore 1.0
  repDecayPerEpisode: 0.06,   // résumé fades as the season progresses
  repDecayFloor: 0.3,
  // Mechanic 2 — carried relationship bond seeds
  bondAllies: 3,
  bondBetrayedVictim: -5,     // victim's side toward their betrayer
  bondBetrayedBetrayer: -1.5, // betrayer's side (asymmetric)
  bondBlindsideVictim: -4,
  bondRivals: -3,
  bondShowmanceIntact: 4,
  bondShowmanceBroken: -3,
  bondOlderSeasonScale: 0.5,  // shared seasons before the most recent one
  bondClamp: 6,               // seeded starting bonds never exceed ±6
  // Mechanic 3 — learned behavior multipliers (max effect at flag = 1.0)
  idolParanoiaSearchBoost: 0.75,
  idolParanoiaSuspicion: 0.5,
  blindsideWarinessSense: 0.6,
  knownSchemerDetection: 0.4,
  // Mechanic 4 — narrative callbacks
  calloutTextChance: 0.5
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/franchise-meta.test.js` — Expected: PASS.

- [ ] **Step 5: Add the ledger object store to `js/savestate.js`**

Read `js/savestate.js` first. Change lines 11-24 (constants + `_openDB`):

```javascript
const DB_NAME = 'dc_franchise_db';
const DB_VERSION = 2;
const STORE_NAME = 'gameState';
const LEDGER_STORE = 'franchiseLedger';
```

and in `_openDB` replace the `onupgradeneeded` line with:

```javascript
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      if (!db.objectStoreNames.contains(LEDGER_STORE)) db.createObjectStore(LEDGER_STORE);
    };
```

Below `_idbKeys()` (after line 69) add ledger helpers + load/persist (import `setFranchiseLedger, franchiseLedger` from `./franchise-meta.js` at the top of savestate.js):

```javascript
export function _idbLedgerPut(key, value) {
  return _openDB().then(db => new Promise((resolve) => {
    const tx = db.transaction(LEDGER_STORE, 'readwrite');
    tx.objectStore(LEDGER_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  })).catch(() => {});
}

export function _idbLedgerGet(key) {
  return _openDB().then(db => new Promise((resolve) => {
    const tx = db.transaction(LEDGER_STORE, 'readonly');
    const req = tx.objectStore(LEDGER_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(undefined);
  })).catch(() => undefined);
}

// Load ledger into franchise-meta's memory at startup. Never blocks the sim.
export async function loadFranchiseLedgerFromDb() {
  try {
    const stored = await _idbLedgerGet('ledger');
    if (stored && stored.seasons) setFranchiseLedger(stored);
  } catch (e) { console.warn('Franchise ledger load failed — starting empty.', e); }
}

export async function persistFranchiseLedger() {
  try { await _idbLedgerPut('ledger', JSON.parse(JSON.stringify(franchiseLedger))); }
  catch (e) { console.warn('Franchise ledger save failed.', e); }
}
```

**Important:** `resetSeason()` (savestate.js:671) calls `_idbClear()` which only clears `STORE_NAME` — verify it does NOT touch `LEDGER_STORE` (that's the point of the separate store: wiping saves must not wipe history).

- [ ] **Step 6: Wire into `js/main.js`**

Read `js/main.js`. Add `import * as franchiseMetaMod from './franchise-meta.js';` next to the other module imports and add `franchiseMetaMod` to the module spread array (the one that exposes everything on `window`). Near startup (after the existing initial load logic runs), add:

```javascript
loadFranchiseLedgerFromDb();
```

(`loadFranchiseLedgerFromDb` reaches `window` via the savestate module spread; call it as a bare name if main.js already does that for other savestate functions, otherwise import it explicitly.)

- [ ] **Step 7: Run full test suite to check nothing broke**

Run: `npx vitest run` — Expected: all existing tests PASS (the harness stubs `indexedDB` with an in-memory shim; if the shim lacks `objectStoreNames.contains`, guard with `db.objectStoreNames?.contains?.(...) !== true` is NOT needed — check the shim in `tests/helpers/season-harness.js:39` and only adapt if a test actually fails).

- [ ] **Step 8: Commit**

```
git add js/franchise-meta.js js/savestate.js js/main.js tests/franchise-meta.test.js
git commit -m "feat: franchise ledger persistence layer + franchise-meta module skeleton"
```

---

### Task 2: Season record derivation + finale recording hook

**Files:**
- Modify: `js/franchise-meta.js` (add `deriveSeasonRecord`, `recordSeasonToLedger`)
- Modify: `js/finale.js:1960-1962` (hook before `window.saveGameState()`)
- Modify: `js/social-manipulation.js:7-30` (`_generateExposeSchemer` — count catches)
- Test: `tests/franchise-meta.test.js`

**Interfaces:**
- Consumes: `franchiseLedger`, `setFranchiseLedger` (Task 1).
- Produces: `deriveSeasonRecord() → { seasonName, players: { [name]: record } } | null` and `recordSeasonToLedger(ep) → boolean` (true if a record was written), both exported from franchise-meta.js. Record shape (the ledger contract from the spec):
  `{ placement, winner, finalist, episodesLasted, blindsided, blindsidedBy: [], blindsidesAuthored, idolsFound, idolsPlayed, idoledOut, betrayed: [], betrayedBy: [], allies: [], showmances: [{partner, ended}], rivals: [], chalWins, schemesCaught }`

- [ ] **Step 1: Write the failing tests**

Append to `tests/franchise-meta.test.js`:

```javascript
import { setGs, setPlayers, setSeasonConfig, defaultConfig } from '../js/core.js';
import { deriveSeasonRecord, recordSeasonToLedger } from '../js/franchise-meta.js';

function fabricateFinishedSeason() {
  setPlayers([
    { name: 'Ava', isReturnee: false }, { name: 'Ben', isReturnee: false },
    { name: 'Cy', isReturnee: false }, { name: 'Dee', isReturnee: false }
  ]);
  setSeasonConfig({ ...defaultConfig(), seasonNumber: 15, name: 'Test Season', franchiseMeta: true });
  setGs({
    phase: 'complete',
    finaleResult: { winner: 'Ava', finalists: ['Ava', 'Ben'] },
    episodeHistory: [
      { num: 1, eliminated: 'Dee', immunityWinner: 'Ava',
        votingLog: [ { voter: 'Ava', voted: 'Dee' }, { voter: 'Ben', voted: 'Dee' }, { voter: 'Cy', voted: 'Dee' }, { voter: 'Dee', voted: 'Ben' } ],
        defections: [ { player: 'Cy' }, { player: 'Ben' } ],
        idolPlays: [] },
      { num: 2, eliminated: 'Cy', immunityWinner: 'Ava',
        votingLog: [ { voter: 'Ava', voted: 'Cy' }, { voter: 'Ben', voted: 'Cy' }, { voter: 'Cy', voted: 'Ben' } ],
        defections: [],
        idolPlays: [ { player: 'Ava', votesNegated: 1 } ] }
    ],
    bonds: { 'Ava||Ben': 4.0, 'Ben||Cy': -5.0 },
    advantages: [], namedAlliances: [ { name: 'Core Four', members: ['Ava', 'Ben'] } ],
    showmances: [ { a: 'Ava', b: 'Ben', broken: false } ],
    schemesCaught: { 'Cy': 1 }
  });
}

describe('deriveSeasonRecord', () => {
  it('derives placements, winner, blindside, idols, allies, showmances, rivals', () => {
    fabricateFinishedSeason();
    const rec = deriveSeasonRecord();
    expect(rec.players['Ava']).toMatchObject({ placement: 1, winner: true, finalist: true, chalWins: 2, idolsPlayed: 1 });
    expect(rec.players['Ben'].placement).toBe(2);
    expect(rec.players['Cy'].placement).toBe(3);
    expect(rec.players['Dee']).toMatchObject({ placement: 4, blindsided: true });
    expect(rec.players['Dee'].blindsidedBy).toEqual(expect.arrayContaining(['Cy', 'Ben']));
    expect(rec.players['Cy'].betrayed).toContain('Dee');       // flipped onto Dee
    expect(rec.players['Dee'].betrayedBy).toContain('Cy');
    expect(rec.players['Ava'].allies).toContain('Ben');
    expect(rec.players['Ava'].showmances).toEqual([{ partner: 'Ben', ended: 'intact' }]);
    expect(rec.players['Ben'].rivals).toContain('Cy');          // bond -5
    expect(rec.players['Cy'].schemesCaught).toBe(1);
  });
  it('returns null when seasonNumber is 0', () => {
    fabricateFinishedSeason();
    setSeasonConfig({ ...defaultConfig(), seasonNumber: 0 });
    expect(deriveSeasonRecord()).toBeNull();
  });
});

describe('recordSeasonToLedger', () => {
  it('writes the season record idempotently', () => {
    setFranchiseLedger({ seasons: {} });
    fabricateFinishedSeason();
    expect(recordSeasonToLedger({})).toBe(true);
    expect(recordSeasonToLedger({})).toBe(true);
    expect(Object.keys(franchiseLedger.seasons)).toEqual(['15']);
    expect(franchiseLedger.seasons['15'].players['Ava'].winner).toBe(true);
  });
});
```

(`franchiseLedger` and `setFranchiseLedger` are already imported at the top from Task 1's test.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/franchise-meta.test.js`
Expected: FAIL — `deriveSeasonRecord` is not exported.

- [ ] **Step 3: Implement in `js/franchise-meta.js`**

```javascript
// ── Season record derivation (runs once when a finale completes) ──────────
function _bootOf(ep) {
  return ep.eliminated || ep.firstEliminated || ep.suddenDeathEliminated
    || ep.emissaryEliminated || ep.hpTiebreakerEliminated || ep.tiedDestiniesCollateral || null;
}

export function deriveSeasonRecord() {
  const seasonNum = seasonConfig?.seasonNumber || 0;
  if (!seasonNum || !gs) return null;
  const hist = gs.episodeHistory || [];
  const fin = gs.finaleResult || {};
  const winner = fin.winner || null;
  const finalists = (fin.finalists || []).map(f => typeof f === 'string' ? f : f?.name).filter(Boolean);
  const names = (players || []).map(p => p.name);

  // Boot order → placements. Winner is 1; other finalists follow; boots fill
  // from last place upward; anyone unaccounted (quits, edge formats) slots
  // into the remaining gaps in roster order.
  const boots = [];
  for (const ep of hist) { const b = _bootOf(ep); if (b && !boots.includes(b)) boots.push(b); }
  const placement = {};
  let place = names.length;
  for (const b of boots) { if (!placement[b] && b !== winner && !finalists.includes(b)) placement[b] = place--; }
  if (winner) placement[winner] = 1;
  let fp = 2;
  for (const f of finalists) { if (f !== winner && !placement[f]) placement[f] = fp++; }
  for (const n of names) { if (!placement[n]) placement[n] = fp++; }

  const rec = { seasonName: seasonConfig?.name || `Season ${seasonNum}`, players: {} };
  for (const n of names) {
    const elimEp = hist.find(ep => _bootOf(ep) === n) || null;
    const ownBallot = elimEp?.votingLog?.find(v => v.voter === n) || null;
    const votersAgainst = (elimEp?.votingLog || []).filter(v => v.voted === n).map(v => v.voter);
    const flippers = (elimEp?.defections || []).map(d => d.player).filter(Boolean);
    const blindsided = !!elimEp && !!(elimEp.votingLog || []).length
      && (flippers.length >= 2 || (!!ownBallot && ownBallot.voted !== n && votersAgainst.length >= 3));
    const idolsPlayed = hist.reduce((s, ep) => s + (ep.idolPlays || [])
      .filter(ip => ip.player === n && !ip.fake && !ip.failed).length, 0);
    const idoledOut = !!elimEp && (elimEp.idolPlays || []).some(ip => ip.player !== n && (ip.votesNegated || 0) > 0);
    const betrayed = [];
    for (const ep of hist) {
      const b = _bootOf(ep); if (!b || b === n) continue;
      const flipped = (ep.defections || []).some(d => d.player === n);
      const votedForBoot = (ep.votingLog || []).some(v => v.voter === n && v.voted === b);
      if (flipped && votedForBoot && !betrayed.includes(b)) betrayed.push(b);
    }
    const allies = [];
    for (const al of (gs.namedAlliances || [])) {
      if (!(al.members || []).includes(n)) continue;
      for (const m of al.members) { if (m !== n && !allies.includes(m) && !betrayed.includes(m)) allies.push(m); }
    }
    const showmances = (gs.showmances || [])
      .filter(sh => sh.a === n || sh.b === n)
      .map(sh => ({ partner: sh.a === n ? sh.b : sh.a, ended: sh.broken ? 'breakup' : 'intact' }));
    const rivals = names.filter(o => o !== n && (gs.bonds?.[metaBondKey(n, o)] ?? 0) <= -4);
    rec.players[n] = {
      placement: placement[n], winner: n === winner, finalist: finalists.includes(n) || n === winner,
      episodesLasted: elimEp ? elimEp.num : hist.length,
      blindsided, blindsidedBy: blindsided ? (flippers.length ? flippers : votersAgainst.slice(0, 2)) : [],
      blindsidesAuthored: 0, // filled in the second pass below
      idolsFound: idolsPlayed + (gs.advantages || []).filter(a => a.holder === n && a.type === 'idol').length,
      idolsPlayed, idoledOut, betrayed,
      betrayedBy: [], // second pass
      allies, showmances, rivals,
      chalWins: hist.filter(ep => ep.immunityWinner === n).length,
      schemesCaught: gs.schemesCaught?.[n] || 0
    };
  }
  // Second pass: mirror betrayals + credit blindside authors.
  for (const n of names) {
    for (const victim of rec.players[n].betrayed) {
      if (rec.players[victim] && !rec.players[victim].betrayedBy.includes(n)) rec.players[victim].betrayedBy.push(n);
    }
  }
  for (const n of names) {
    const r = rec.players[n];
    if (r.blindsided) for (const author of r.blindsidedBy) {
      if (rec.players[author]) rec.players[author].blindsidesAuthored++;
    }
  }
  return rec;
}

// Idempotent: keyed by season number; live records always overwrite backfill.
export function recordSeasonToLedger(_ep) {
  if (seasonConfig?.franchiseMeta === false) return false;
  const rec = deriveSeasonRecord();
  if (!rec) return false;
  franchiseLedger.seasons[String(seasonConfig.seasonNumber)] = rec;
  return true;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/franchise-meta.test.js` — Expected: PASS.

- [ ] **Step 5: Add the finale hook**

Read `js/finale.js` around line 1955-1963. Immediately BEFORE `window.saveGameState();` (line 1962), insert:

```javascript
  try {
    if (window.recordSeasonToLedger?.(ep)) window.persistFranchiseLedger?.();
  } catch (e) { console.warn('Franchise ledger record failed:', e); }
```

Also handle the unset-season-number notice: `recordSeasonToLedger` returns false when `seasonNumber` is 0 — add after the try/catch:

```javascript
  if (!(seasonConfig?.seasonNumber) && seasonConfig?.franchiseMeta !== false) {
    console.warn('Season number not set — this season was not added to franchise history.');
  }
```

(Use the window-call pattern — finale.js already calls `window.saveGameState()` this way; the headless harness leaves `window.persistFranchiseLedger` undefined, which the optional chain tolerates.)

- [ ] **Step 6: Count scheme catches**

Read `js/social-manipulation.js` lines 7-30 (`_generateExposeSchemer`). Right after the `gs._schemeHeat[schemer] = ...` line (~18), add:

```javascript
  if (!gs.schemesCaught) gs.schemesCaught = {};
  gs.schemesCaught[schemer] = (gs.schemesCaught[schemer] || 0) + 1;
```

- [ ] **Step 7: Run the full-season audit to confirm end-to-end recording**

Run: `npx vitest run tests/full-season-audit.test.js --reporter=verbose`
Expected: PASS (finale hook is a no-op-safe try/catch; harness seasons may have seasonNumber 0, which skips recording cleanly).

- [ ] **Step 8: Commit**

```
git add js/franchise-meta.js js/finale.js js/social-manipulation.js tests/franchise-meta.test.js
git commit -m "feat: derive season records and write franchise ledger at finale"
```

---

### Task 3: Season-start meta build (profiles + seeded bonds)

**Files:**
- Modify: `js/franchise-meta.js` (add `buildFranchiseMeta`)
- Modify: `js/savestate.js:530-635` (`initGameState` — build meta, seed bonds, add gs field)
- Modify: `js/core.js:920-939` (`defaultConfig` — add `franchiseMeta: true`, `seasonNumber: 0`)
- Test: `tests/franchise-meta.test.js`

**Interfaces:**
- Consumes: `franchiseLedger` (Tasks 1-2).
- Produces: `buildFranchiseMeta(cast, cfg) → { profiles: { [name]: { seasonsPlayed, repScore, resume: [], idolParanoia, blindsideWariness, knownSchemer } }, seededPairs: [ { a, b, bondDelta, reason, kind } ] } | null`. Stored as `gs.franchiseMeta` (plain data). `kind` ∈ `'allies' | 'betrayal' | 'blindside' | 'rivals' | 'showmance-intact' | 'showmance-broken'` — camp events (Task 7) branch on it.

- [ ] **Step 1: Write the failing tests**

Append to `tests/franchise-meta.test.js`:

```javascript
import { buildFranchiseMeta } from '../js/franchise-meta.js';

function seedLedgerS12() {
  setFranchiseLedger({ seasons: { '12': { seasonName: 'S12', players: {
    'Fiore': { placement: 1, winner: true, finalist: true, episodesLasted: 18, blindsided: false,
      blindsidedBy: [], blindsidesAuthored: 2, idolsFound: 1, idolsPlayed: 1, idoledOut: false,
      betrayed: ['Thom'], betrayedBy: [], allies: ['MacArthur'], showmances: [], rivals: [], chalWins: 4, schemesCaught: 1 },
    'Thom': { placement: 5, winner: false, finalist: false, episodesLasted: 14, blindsided: true,
      blindsidedBy: ['Fiore'], blindsidesAuthored: 0, idolsFound: 0, idolsPlayed: 0, idoledOut: true,
      betrayed: [], betrayedBy: ['Fiore'], allies: [], showmances: [{ partner: 'MacArthur', ended: 'intact' }],
      rivals: [], chalWins: 0, schemesCaught: 0 },
    'MacArthur': { placement: 3, winner: false, finalist: true, episodesLasted: 17, blindsided: false,
      blindsidedBy: [], blindsidesAuthored: 1, idolsFound: 0, idolsPlayed: 0, idoledOut: false,
      betrayed: [], betrayedBy: [], allies: ['Fiore'], showmances: [{ partner: 'Thom', ended: 'intact' }],
      rivals: [], chalWins: 2, schemesCaught: 0 }
  } } } });
}

describe('buildFranchiseMeta', () => {
  const cast = [
    { name: 'Fiore', isReturnee: true }, { name: 'Thom', isReturnee: true },
    { name: 'MacArthur', isReturnee: true }, { name: 'Newbie', isReturnee: false }
  ];
  it('builds profiles only for returnees with history', () => {
    seedLedgerS12();
    const meta = buildFranchiseMeta(cast, { franchiseMeta: true });
    expect(meta.profiles['Fiore'].repScore).toBeGreaterThan(0.5);   // winner
    expect(meta.profiles['Fiore'].resume.length).toBeGreaterThan(0);
    expect(meta.profiles['Thom'].blindsideWariness).toBeGreaterThan(0);
    expect(meta.profiles['Thom'].idolParanoia).toBeGreaterThan(0);  // idoled out + blindsided
    expect(meta.profiles['Fiore'].knownSchemer).toBeGreaterThan(0); // betrayer + caught scheming
    expect(meta.profiles['Newbie']).toBeUndefined();
  });
  it('seeds asymmetric betrayal bonds and ally/showmance bonds', () => {
    seedLedgerS12();
    const meta = buildFranchiseMeta(cast, { franchiseMeta: true });
    const betrayal = meta.seededPairs.find(p => p.kind === 'betrayal');
    expect(betrayal).toBeTruthy(); // Fiore betrayed Thom
    const allies = meta.seededPairs.find(p => p.kind === 'allies' && [p.a, p.b].includes('MacArthur'));
    expect(allies.bondDelta).toBeGreaterThan(0);
    const showmance = meta.seededPairs.find(p => p.kind === 'showmance-intact');
    expect(showmance.bondDelta).toBeGreaterThan(0);
    for (const p of meta.seededPairs) expect(Math.abs(p.bondDelta)).toBeLessThanOrEqual(6);
  });
  it('returns null when toggled off or when no returnee has history', () => {
    seedLedgerS12();
    expect(buildFranchiseMeta(cast, { franchiseMeta: false })).toBeNull();
    expect(buildFranchiseMeta([{ name: 'Newbie', isReturnee: false }], { franchiseMeta: true })).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/franchise-meta.test.js` — Expected: FAIL — `buildFranchiseMeta` not exported.

- [ ] **Step 3: Implement `buildFranchiseMeta` in `js/franchise-meta.js`**

```javascript
// ── Season-start meta build ───────────────────────────────────────────────
function _historyFor(name) {
  const out = []; // [{ seasonNum, rec }] sorted oldest → newest
  for (const [num, season] of Object.entries(franchiseLedger.seasons)) {
    if (season.players?.[name]) out.push({ seasonNum: Number(num), rec: season.players[name], seasonName: season.seasonName });
  }
  return out.sort((a, b) => a.seasonNum - b.seasonNum);
}

function _resumeLines(name, history) {
  const lines = [];
  for (const { seasonNum, rec } of history) {
    if (rec.winner) lines.push(`Won Season ${seasonNum}`);
    else if (rec.finalist) lines.push(`Finalist in Season ${seasonNum} (${_ordinal(rec.placement)})`);
    else if (rec.blindsided) lines.push(`Blindsided in Season ${seasonNum} (${_ordinal(rec.placement)})`);
    else lines.push(`Placed ${_ordinal(rec.placement)} in Season ${seasonNum}`);
    if (rec.blindsidesAuthored >= 2) lines.push(`Orchestrated ${rec.blindsidesAuthored} blindsides in Season ${seasonNum}`);
    if (rec.idolsPlayed >= 1) lines.push(`Played ${rec.idolsPlayed} idol${rec.idolsPlayed > 1 ? 's' : ''} in Season ${seasonNum}`);
    if (rec.chalWins >= 3) lines.push(`${rec.chalWins} immunity wins in Season ${seasonNum}`);
  }
  return lines;
}
function _ordinal(n) { const s = ['th','st','nd','rd'], v = n % 100; return n + (s[(v-20)%10] || s[v] || s[0]); }

export function buildFranchiseMeta(cast, cfg) {
  if (cfg?.franchiseMeta === false) return null;
  const W = META_WEIGHTS;
  const profiles = {};
  for (const p of cast) {
    if (!p.isReturnee) continue;
    const history = _historyFor(p.name);
    if (!history.length) continue;
    let wins = 0, finals = 0, bsAuth = 0, chalW = 0, idolsP = 0, idoledOut = 0, blindsided = 0, betrayedCt = 0, caught = 0;
    for (const { rec } of history) {
      wins += rec.winner ? 1 : 0; finals += rec.finalist && !rec.winner ? 1 : 0;
      bsAuth += rec.blindsidesAuthored || 0; chalW += rec.chalWins || 0; idolsP += rec.idolsPlayed || 0;
      idoledOut += rec.idoledOut ? 1 : 0; blindsided += rec.blindsided ? 1 : 0;
      betrayedCt += (rec.betrayed || []).length; caught += rec.schemesCaught || 0;
    }
    profiles[p.name] = {
      seasonsPlayed: history.length,
      repScore: Math.min(1, (wins * 3 + finals * 1.5 + bsAuth * 0.6 + chalW * 0.25 + idolsP * 0.4) / 6),
      resume: _resumeLines(p.name, history),
      idolParanoia: Math.min(1, idoledOut * 0.6 + blindsided * 0.3),
      blindsideWariness: Math.min(1, blindsided * 0.5),
      knownSchemer: Math.min(1, betrayedCt * 0.35 + caught * 0.4 + bsAuth * 0.25)
    };
  }
  if (!Object.keys(profiles).length) return null;

  // Seeded pairs — only between two cast members who BOTH have profiles.
  // Most recent shared season at full weight; older ones scaled down.
  const seeded = {}; // key → { a, b, bondDelta, reason, kind }
  const inCast = new Set(Object.keys(profiles));
  const seasonNums = Object.keys(franchiseLedger.seasons).map(Number).sort((a, b) => b - a);
  seasonNums.forEach((num, idx) => {
    const scale = idx === 0 ? 1 : Math.pow(W.bondOlderSeasonScale, idx);
    const season = franchiseLedger.seasons[String(num)];
    const add = (a, b, delta, reason, kind) => {
      if (!inCast.has(a) || !inCast.has(b) || a === b) return;
      const key = metaBondKey(a, b) + '::' + kind;
      if (seeded[key]) { seeded[key].bondDelta += delta * scale * 0.5; return; } // stacking, diminishing
      seeded[key] = { a, b, bondDelta: delta * scale, reason: `${reason} (Season ${num})`, kind };
    };
    for (const [name, rec] of Object.entries(season.players || {})) {
      for (const ally of rec.allies || []) add(name, ally, W.bondAllies, `Rode together to the end`, 'allies');
      for (const victim of rec.betrayed || []) {
        add(victim, name, W.bondBetrayedVictim, `${name} betrayed ${victim}`, 'betrayal');
        add(name, victim, W.bondBetrayedBetrayer, `${name} betrayed ${victim}`, 'betrayal');
      }
      if (rec.blindsided) for (const author of rec.blindsidedBy || []) {
        add(name, author, W.bondBlindsideVictim, `${author} blindsided ${name}`, 'blindside');
      }
      for (const rival of rec.rivals || []) add(name, rival, W.bondRivals, `Old rivalry`, 'rivals');
      for (const sh of rec.showmances || []) {
        if (sh.ended === 'intact') add(name, sh.partner, W.bondShowmanceIntact, `Showmance that lasted`, 'showmance-intact');
        else add(name, sh.partner, W.bondShowmanceBroken, `Showmance that ended badly`, 'showmance-broken');
      }
    }
  });
  // Betrayal/blindside adds are directional (a = the one whose feeling it is);
  // collapse duplicates and clamp. History biases — it does not predetermine.
  const seededPairs = Object.values(seeded).map(sp => ({
    ...sp, bondDelta: Math.max(-W.bondClamp, Math.min(W.bondClamp, sp.bondDelta))
  }));
  return { profiles, seededPairs };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/franchise-meta.test.js` — Expected: PASS. (If the asymmetric betrayal test fails because both directions collapse into one bond key: the `'::' + kind` suffix keeps kinds separate, but the two betrayal directions share a key — fix by including the direction in the key for directional kinds: `key = a + '>>' + b + '::' + kind` for `betrayal`/`blindside`, symmetric `metaBondKey` for the rest.)

- [ ] **Step 5: Integrate into `initGameState` (`js/savestate.js`)**

Read `js/savestate.js:530-635`. After the hero/villain rivalry seeding block (ends ~line 569), add:

```javascript
  // Franchise meta: profiles + cross-season bond seeds (no-op without returnee history)
  let _fMeta = null;
  try { _fMeta = buildFranchiseMeta(players, seasonConfig); }
  catch (e) { console.warn('Franchise meta build failed — season runs without it.', e); }
  if (_fMeta) {
    for (const sp of _fMeta.seededPairs) {
      const k = bKey(sp.a, sp.b);
      bonds[k] = Math.max(-META_WEIGHTS.bondClamp, Math.min(META_WEIGHTS.bondClamp, (bonds[k] || 0) + sp.bondDelta));
    }
  }
```

(`bKey` is already imported/available in savestate.js — verify; if not, import it from `./bonds.js`. Import `buildFranchiseMeta, META_WEIGHTS` from `./franchise-meta.js`.) Note: directional betrayal deltas both land on the same symmetric bond here (real bonds are symmetric); the asymmetry lives in the *perceived* layer via the profile flags — the victim's `blindsideWariness` — and in callback text. That matches how the sim models perception.

Then inside the `setGs({ ... })` object (lines 587-635) add the field:

```javascript
    franchiseMeta: _fMeta,
```

- [ ] **Step 6: Add config defaults (`js/core.js`)**

Read `js/core.js:920-939` (`defaultConfig`). Add to the returned object:

```javascript
    franchiseMeta: true,
    seasonNumber: 0,
```

- [ ] **Step 7: Run the full suite**

Run: `npx vitest run` — Expected: PASS (harness casts have no `isReturnee` + empty ledger → `buildFranchiseMeta` returns null → zero effect).

- [ ] **Step 8: Commit**

```
git add js/franchise-meta.js js/savestate.js js/core.js tests/franchise-meta.test.js
git commit -m "feat: build franchise meta profiles and seed cross-season bonds at season start"
```

---

### Task 4: Mechanic 1 — reputation threat multiplier

**Files:**
- Modify: `js/players.js:171-216` (`threatScore`)
- Test: `tests/franchise-meta.test.js`

**Interfaces:**
- Consumes: `gs.franchiseMeta.profiles[name].repScore` (Task 3), `META_WEIGHTS` (Task 1).
- Produces: `threatScore` output scaled by `1 + effectiveRep * repThreatFactor` where `effectiveRep = repScore * max(repDecayFloor, 1 - gs.episode * repDecayPerEpisode)`. Flows automatically into `computeHeat` (alliances.js:94) and jury logic — no edits needed there.

- [ ] **Step 1: Write the failing test**

Append to `tests/franchise-meta.test.js` (import `threatScore` from `../js/players.js`; note players.js may pull in more modules — if the import chain breaks under vitest, import via the harness bootstrap pattern instead: `import '../tests/helpers/season-harness.js'` style setup used by existing tests — check how `tests/full-season-audit.test.js` imports modules and mirror it):

```javascript
import { threatScore } from '../js/players.js';

describe('reputation threat multiplier', () => {
  it('raises threatScore for a decorated returnee, decaying over episodes', () => {
    fabricateFinishedSeason(); // any valid gs; then attach meta
    gs.episode = 1;
    gs.franchiseMeta = { profiles: { 'Ava': { repScore: 1.0 } }, seededPairs: [] };
    const withRep = threatScore('Ava');
    gs.franchiseMeta = null;
    const withoutRep = threatScore('Ava');
    expect(withRep).toBeGreaterThan(withoutRep);
    gs.franchiseMeta = { profiles: { 'Ava': { repScore: 1.0 } }, seededPairs: [] };
    gs.episode = 12; // decayed résumé
    const lateRep = threatScore('Ava');
    expect(lateRep).toBeLessThan(withRep);
    expect(lateRep).toBeGreaterThan(withoutRep); // floor keeps some effect
  });
});
```

(`gs` import comes from `../js/core.js` — already used via `setGs`; the test mutates fields directly which is fine since `gs` is a live reference. `threatScore` needs `pStats` — give the fabricated players stats: extend `fabricateFinishedSeason` player objects with a full valid 9-stat block, e.g. `stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 }` — check `pStats` in players.js for the exact property it reads and match it.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/franchise-meta.test.js` — Expected: FAIL — withRep equals withoutRep.

- [ ] **Step 3: Implement in `js/players.js`**

Add import at top: `import { META_WEIGHTS } from './franchise-meta.js';` (franchise-meta imports only core.js — no cycle).

In `threatScore` (line ~214), replace:

```javascript
  const total = _chal * 0.33 + _soc * 0.33 + _strat * 0.33;
```

with:

```javascript
  let total = _chal * 0.33 + _soc * 0.33 + _strat * 0.33;
  // Franchise meta: résumé makes returnees read as bigger threats, strongest
  // early — survivors "prove themselves" as current threats and the résumé fades.
  const _rep = gs?.franchiseMeta?.profiles?.[name]?.repScore || 0;
  if (_rep > 0) {
    const _decay = Math.max(META_WEIGHTS.repDecayFloor, 1 - (gs.episode || 0) * META_WEIGHTS.repDecayPerEpisode);
    total *= 1 + _rep * _decay * META_WEIGHTS.repThreatFactor;
  }
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/franchise-meta.test.js` then `npx vitest run` — Expected: all PASS.

- [ ] **Step 5: Commit**

```
git add js/players.js tests/franchise-meta.test.js
git commit -m "feat: reputation threat multiplier in threatScore with early-season emphasis"
```

---

### Task 5: Mechanic 3 — learned behavior multipliers

**Files:**
- Modify: `js/advantages.js:66` (idol search roll)
- Modify: `js/advantage-intel.js:52-62` (`assessIdolExposure` — reader-side suspicion)
- Modify: `js/social-manipulation.js:73-84` (`_generateForgeNote` — detection resistance)
- Modify: `js/voting.js:1197-1209` (preemptive sense) and `js/voting.js:1244` (`_senseChance`)
- Test: manual multiplier checks are impractical at these roll sites; verified via the Task 9 integration run. Each edit is a one-line proportional factor — review by reading.

**Interfaces:**
- Consumes: `gs.franchiseMeta.profiles[name].{idolParanoia, blindsideWariness, knownSchemer}` (Task 3), `META_WEIGHTS` (Task 1). Import `META_WEIGHTS` from `./franchise-meta.js` in each touched file.

- [ ] **Step 1: Idol search boost (`js/advantages.js:66`)**

Read the surrounding block first. Change the roll to:

```javascript
      const _metaFind = 1 + (gs.franchiseMeta?.profiles?.[name]?.idolParanoia || 0) * META_WEIGHTS.idolParanoiaSearchBoost;
      if (Math.random() < (0.004 + epScale + s.intuition * 0.001 + s.strategic * 0.0005 + eavBoostFind) * _metaFind) {
```

Apply the same `* _metaFind` factor to the legacy-find roll at line ~83 (compute `_metaFind` once above both).

- [ ] **Step 2: Idol suspicion (`js/advantage-intel.js`)**

Read `assessIdolExposure` (line 52). Where each observer's read is rolled (~line 61-62, the `readSkill`/`perceivedRisk` computation per person), scale the observer's read skill:

```javascript
    const _metaSus = 1 + (gs.franchiseMeta?.profiles?.[person]?.idolParanoia || 0) * META_WEIGHTS.idolParanoiaSuspicion;
```

and multiply the observer's notice chance / read-skill term by `_metaSus` (adapt the variable name to what the function actually uses — read the 15 lines first; the rule is: the paranoid OBSERVER suspects more, the holder's side is untouched).

- [ ] **Step 3: Scheme detection (`js/social-manipulation.js:73-84`)**

In `_generateForgeNote`, after `const resistance = rStats.mental * 0.08 + rStats.intuition * 0.05;` add:

```javascript
  const _metaSchemer = (gs.franchiseMeta?.profiles?.[schemer]?.knownSchemer || 0) * META_WEIGHTS.knownSchemerDetection;
  const resistanceTotal = resistance * (1 + _metaSchemer);
```

and use `resistanceTotal` in place of `resistance` in the belief comparison (`belief > resistanceTotal + 0.3`). ("We've all seen her season — watch her.")

- [ ] **Step 4: Blindside wariness (`js/voting.js`)**

Preemptive strike (~line 1204): the roll `Math.random() < s.intuition * 0.03` becomes:

```javascript
    const _metaWary = 1 + (gs.franchiseMeta?.profiles?.[voter]?.blindsideWariness || 0) * META_WEIGHTS.blindsideWarinessSense;
    ... Math.random() < s.intuition * 0.03 * _metaWary ...
```

Self-preservation scramble (~line 1244): multiply `_senseChance` the same way (the player whose name is being sensed-for gets the factor — read the block to identify the right variable).

- [ ] **Step 5: Run full suite + one headless season**

Run: `npx vitest run` — Expected: PASS (all factors are 1.0 when `gs.franchiseMeta` is null).

- [ ] **Step 6: Commit**

```
git add js/advantages.js js/advantage-intel.js js/social-manipulation.js js/voting.js
git commit -m "feat: learned-behavior multipliers (idol paranoia, blindside wariness, known schemer)"
```

---

### Task 6: Mechanic 4a — vote-reason and jury-speech callbacks

**Files:**
- Modify: `js/voting.js:417-432` (`buildVoteReason`)
- Modify: `js/finale.js:2660-2700` (`simulateJuryVote` `_jrReason` pools)

**Interfaces:**
- Consumes: `gs.franchiseMeta.profiles[name].{repScore, resume}` and `gs.franchiseMeta.seededPairs` (Task 3), `META_WEIGHTS.calloutTextChance`.

- [ ] **Step 1: Vote-reason résumé/grudge branch (`js/voting.js`)**

Read `buildVoteReason` (line 402) and the branch region 417-432. Add a new branch BEFORE the existing `grudge/threat` block (so meta callbacks take priority when they exist, gated by chance):

```javascript
  const _fm = gs.franchiseMeta;
  if (_fm && Math.random() < META_WEIGHTS.calloutTextChance) {
    const _grudge = (_fm.seededPairs || []).find(sp =>
      sp.a === voter && sp.b === target && (sp.kind === 'betrayal' || sp.kind === 'blindside' || sp.kind === 'rivals'));
    if (_grudge && (type === 'grudge' || type === 'threat' || type === 'memory')) {
      return pick([
        `${_grudge.reason}. Some debts follow you into a new season.`,
        `This isn't strategy. This is ${_grudge.reason.toLowerCase()} — and tonight it gets settled.`,
        `${target} thinks the past stays in the past. It doesn't.`,
        `Last time, ${target} wrote the ending. This time ${voter === target ? '' : 'I'} hold the pen.`
      ]);
    }
    const _rep = _fm.profiles?.[target];
    if (_rep && _rep.repScore >= 0.4 && type === 'threat') {
      const _line = _rep.resume[0] || 'a résumé like that';
      return pick([
        `${_line}. You don't let a player like that reach the end twice.`,
        `${target} has already proven ${target === voter ? '' : 'they'} can win this game. That's exactly why it ends tonight.`,
        `Everyone keeps talking about ${target}'s history. I'd rather make it history.`,
        `We all watched ${target}'s season. Nobody should be surprised by this vote.`
      ]);
    }
  }
```

(`pick` and `META_WEIGHTS` — verify `pick` is in scope in voting.js; import `META_WEIGHTS` from `./franchise-meta.js`.)

- [ ] **Step 2: Jury speech legacy lines (`js/finale.js`)**

Read the `_jrReason` pool region (2660-2700). Where the value-based reasons are picked (~2682), add a legacy branch before it:

```javascript
      const _fmProf = gs.franchiseMeta?.profiles?.[pick];
      if (_fmProf && Math.random() < 0.35) {
        _jrReason = window.pick ? window.pick([
          `"Two seasons. Same result. ${pick} just plays this game at a different level."`,
          `"I watched ${pick}'s first season from my couch and this one from the jury bench. The growth is undeniable."`,
          `"${pick} came back with a target the size of a résumé and STILL made it here. That's my winner."`,
          `"History repeats itself. ${pick} made sure of it."`
        ]) : _jrReason;
      }
```

Adapt to the local helper the file actually uses for random picks (finale.js has its own `pick`/`_pick` — read the surrounding code and use the same one; the variable holding the juror's chosen finalist may not be named `pick` — use the actual local name from the file, likely the winner-vote target variable used at line 2700's `votedFor`).

- [ ] **Step 3: Run full suite**

Run: `npx vitest run` — Expected: PASS.

- [ ] **Step 4: Commit**

```
git add js/voting.js js/finale.js
git commit -m "feat: franchise-history callbacks in vote reasons and jury speeches"
```

---

### Task 7: Mechanic 4b — cold open résumé intros + history camp events

**Files:**
- Modify: `js/vp-screens.js:556-610` (`_rpBuildDockArrival` returnee cards)
- Modify: `js/camp-events.js` (inside `generateCampEventsForGroup`, line 429+)

**Interfaces:**
- Consumes: `gs.franchiseMeta.profiles[name].resume`, `gs.franchiseMeta.seededPairs` (kinds: `allies`, `betrayal`, `blindside`, `rivals`, `showmance-intact`, `showmance-broken`), `META_WEIGHTS`. Camp events use `gs._metaCalloutsFired` (object map, NOT a Set — serialization) to fire each pair's event once per season.

- [ ] **Step 1: Cold open résumé lines (`js/vp-screens.js`)**

Read `_rpBuildDockArrival` (556-610). Where each returnee arrival card is rendered (the `isReturnee` branch near the `RETURNING` badge at ~601), append a résumé line under the badge when a profile exists:

```javascript
    const _fmResume = gs.franchiseMeta?.profiles?.[a.name]?.resume || [];
    const _resumeHtml = _fmResume.length
      ? `<div class="rp-resume-line" style="font-size:11px;opacity:.75;margin-top:3px;">${_fmResume.slice(0, 2).join(' · ')}</div>`
      : '';
```

and inject `${_resumeHtml}` into the returnee card markup after the badge. Also, in the returning-player host monologue branch (line 577-581), when ledger facts exist for at least one returnee, swap the generic line for a specific one:

```javascript
    const _decorated = arrivals.filter(a => a.isReturnee && gs.franchiseMeta?.profiles?.[a.name]?.resume?.length);
    // if _decorated.length, use: `"They've played before — and the tapes don't lie. ${_decorated.slice(0,2).map(a => `${a.name}: ${gs.franchiseMeta.profiles[a.name].resume[0]}.`).join(' ')} They all came back for more. ..."`
```

Write the full monologue string in the same voice as the existing 577-581 lines (4 variants not required here — it's one composed line from real facts).

- [ ] **Step 2: History camp events (`js/camp-events.js`)**

Read `generateCampEventsForGroup` (line 429) and one existing event push for the exact object shape (lines 456-457). Inside the function, after `numEvents` planning but before returning, add a history-event block:

```javascript
  // Franchise meta: once-per-season history moments between returnees who share a past.
  const _fm = gs.franchiseMeta;
  if (_fm && group.length >= 2) {
    if (!gs._metaCalloutsFired) gs._metaCalloutsFired = {};
    const _pairs = (_fm.seededPairs || []).filter(sp =>
      group.includes(sp.a) && group.includes(sp.b) && !gs._metaCalloutsFired[sp.a + '||' + sp.b + '::' + sp.kind]);
    for (const sp of _pairs) {
      if (Math.random() > 0.25) continue; // ~1-2 fire per season, spread out
      gs._metaCalloutsFired[sp.a + '||' + sp.b + '::' + sp.kind] = true;
      const A = sp.a, B = sp.b, pa = pronouns(A);
      if (sp.kind === 'betrayal' || sp.kind === 'blindside') {
        addBond(A, B, -0.5);
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[A] = (gs.popularity[A] || 0) + 0.5; // sympathy for the wronged
        events.push({ type: 'metaGrudge', players: [A, B],
          text: pick([
            `${A} finally says it to ${B}'s face: "${sp.reason}. I haven't forgotten." The whole camp goes quiet.`,
            `${A} and ${B} circle each other all morning. ${sp.reason} — some wounds don't close between seasons.`,
            `${B} tries to laugh off the past. ${A} isn't laughing. ${sp.reason}, and ${pa.sub} came back to settle it.`,
            `Old business surfaces at the fire: ${sp.reason}. ${A} wants an apology. ${B} offers strategy instead. It goes badly.`
          ]),
          consequences: `Bond ${A}↔${B} −0.5. ${A} gains sympathy.`,
          badgeText: 'OLD WOUNDS', badgeClass: 'red' });
      } else if (sp.kind === 'allies' || sp.kind === 'showmance-intact') {
        addBond(A, B, +0.5);
        events.push({ type: 'metaReunion', players: [A, B],
          text: pick([
            `${A} and ${B} fall back into their old rhythm within minutes. ${sp.reason} — and everyone else at camp notices the shorthand.`,
            `No pitch needed: ${A} and ${B} shared a foxhole once. ${sp.reason}. The trust is already built.`,
            `${A} catches ${B}'s eye across camp and grins. ${sp.reason}. The band might be getting back together.`,
            `Veterans move different: ${A} and ${B} debrief by the water like no time passed at all. ${sp.reason}.`
          ]),
          consequences: `Bond ${A}↔${B} +0.5. Their closeness is public knowledge.`,
          badgeText: 'REUNION', badgeClass: 'gold' });
      } else { // rivals, showmance-broken
        addBond(A, B, -0.3);
        events.push({ type: 'metaAwkward', players: [A, B],
          text: pick([
            `${A} and ${B} get assigned the same chore and say maybe nine words total. ${sp.reason} — the tension is its own third player.`,
            `Everyone can feel it: ${A} and ${B} have history. ${sp.reason}. Nobody asks. Everybody watches.`,
            `${B} picks the far side of camp. ${A} pretends not to notice. ${sp.reason}, and neither wants to relive it.`,
            `A too-long silence when ${A} and ${B} end up alone at the fire. ${sp.reason}. Some things don't need a confessional.`
          ]),
          consequences: `Bond ${A}↔${B} −0.3. Camp reads the tension.`,
          badgeText: 'HISTORY', badgeClass: 'red' });
      }
    }
  }
```

Verify `pronouns`, `addBond`, `pick` are already imported in camp-events.js (they are used throughout — confirm at the top of the file). Note the ep-scope gotcha: `ep` is NOT reliably available in `generateCampEventsForGroup` — this block doesn't use it.

- [ ] **Step 3: Run full suite + eyeball a season**

Run: `npx vitest run` — Expected: PASS. These events flow into VP + text backlog automatically through the existing camp-event pipeline (camp events render in VP camp screens and `_textCampPost`), satisfying the VP + text-backlog rule without new screens.

- [ ] **Step 4: Commit**

```
git add js/vp-screens.js js/camp-events.js
git commit -m "feat: cold-open resume intros and once-per-season history camp events"
```

---

### Task 8: UI — config toggle, history panel, wipe controls, backfill import

**Files:**
- Modify: `js/cast-ui.js` (`saveConfig` ~770, `renderConfig` ~815, new panel + import functions)
- Modify: `js/franchise-meta.js` (add `backfillFromSeasonsDb`, `clearPlayerHistory`, `wipeLedger`, `franchiseHistorySummary`)
- Modify: `simulator.html` (config checkbox, history panel container, import/wipe buttons)
- Test: `tests/franchise-meta.test.js` (backfill mapping only)

**Interfaces:**
- Consumes: `franchiseLedger`, `setFranchiseLedger` (Task 1); FileReader import pattern from `importCast` (cast-ui.js:295); config wiring pattern (`cfg-*` ids).
- Produces: `backfillFromSeasonsDb(json) → number` (seasons imported), `franchiseHistorySummary(name) → [{ seasonNum, seasonName, line }]`, `clearPlayerHistory(name)`, `wipeLedger()` — all in franchise-meta.js. UI functions `importFranchiseHistory(event)`, `renderFranchiseHistoryPanel()` in cast-ui.js.

- [ ] **Step 1: Write the failing backfill test**

Append to `tests/franchise-meta.test.js`:

```javascript
import { backfillFromSeasonsDb, franchiseHistorySummary, wipeLedger } from '../js/franchise-meta.js';

describe('backfillFromSeasonsDb', () => {
  it('imports placements defensively and never overwrites live-recorded seasons', () => {
    setFranchiseLedger({ seasons: { '11': { seasonName: 'Live S11', players: { 'Fiore': { placement: 2, winner: false, finalist: true } } } } });
    const n = backfillFromSeasonsDb({ seasons: [
      { seasonNumber: 10, seasonName: 'S10', winner: { name: 'Fiore' },
        players: [ { name: 'Fiore', placement: 1 }, { name: 'Thom', placement: 7 } ] },
      { seasonNumber: 11, seasonName: 'Should Not Overwrite', winner: { name: 'X' }, players: [] }
    ] });
    expect(n).toBe(1); // season 11 already live-recorded → skipped
    expect(franchiseLedger.seasons['10'].players['Fiore'].winner).toBe(true);
    expect(franchiseLedger.seasons['10'].players['Thom'].placement).toBe(7);
    expect(franchiseLedger.seasons['11'].seasonName).toBe('Live S11');
    // relationship facts absent in export schema → empty arrays, not undefined
    expect(franchiseLedger.seasons['10'].players['Thom'].betrayed).toEqual([]);
    wipeLedger();
    expect(franchiseLedger.seasons).toEqual({});
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/franchise-meta.test.js` — Expected: FAIL — `backfillFromSeasonsDb` not exported.

- [ ] **Step 3: Implement ledger utilities in `js/franchise-meta.js`**

```javascript
// ── Backfill from exported seasons_database.json ──────────────────────────
// Defensive mapping: the export DB carries placements/winners but not
// relationship facts — those stay empty for backfilled seasons (they
// contribute reputation, not carried relationships). Live-recorded seasons
// always win over backfill.
function _emptyRecord() {
  return { placement: 0, winner: false, finalist: false, episodesLasted: 0,
    blindsided: false, blindsidedBy: [], blindsidesAuthored: 0,
    idolsFound: 0, idolsPlayed: 0, idoledOut: false,
    betrayed: [], betrayedBy: [], allies: [], showmances: [], rivals: [],
    chalWins: 0, schemesCaught: 0, backfilled: true };
}

export function backfillFromSeasonsDb(json) {
  const seasons = Array.isArray(json?.seasons) ? json.seasons : [];
  let imported = 0;
  for (const s of seasons) {
    const num = s?.seasonNumber; if (!num) continue;
    const existing = franchiseLedger.seasons[String(num)];
    if (existing && !Object.values(existing.players || {}).every(p => p.backfilled)) continue; // live wins
    const winnerName = s.winner?.name || s.winner || null;
    const roster = Array.isArray(s.players) ? s.players : (Array.isArray(s.placements) ? s.placements : (Array.isArray(s.cast) ? s.cast : []));
    const rec = { seasonName: s.seasonName || s.name || `Season ${num}`, players: {} };
    for (const p of roster) {
      const name = p?.name || (typeof p === 'string' ? p : null); if (!name) continue;
      const r = _emptyRecord();
      r.placement = p.placement || p.finish || 0;
      r.winner = name === winnerName || r.placement === 1;
      r.finalist = r.winner || r.placement === 2 || r.placement === 3;
      r.chalWins = p.chalWins || p.immunityWins || 0;
      r.episodesLasted = p.episodesLasted || 0;
      rec.players[name] = r;
    }
    if (winnerName && !rec.players[winnerName]) { const r = _emptyRecord(); r.placement = 1; r.winner = true; r.finalist = true; rec.players[winnerName] = r; }
    if (!Object.keys(rec.players).length) continue;
    franchiseLedger.seasons[String(num)] = rec;
    imported++;
  }
  return imported;
}

export function franchiseHistorySummary(name) {
  return _historyFor(name).map(({ seasonNum, seasonName, rec }) => ({
    seasonNum, seasonName,
    line: `${rec.winner ? '🏆 Won' : _ordinal(rec.placement)}${rec.blindsided ? ' · blindsided' : ''}${rec.idolsPlayed ? ` · ${rec.idolsPlayed} idol${rec.idolsPlayed > 1 ? 's' : ''}` : ''}${rec.chalWins ? ` · ${rec.chalWins}W` : ''}${rec.backfilled ? ' · (imported)' : ''}`
  }));
}

export function clearPlayerHistory(name) {
  for (const season of Object.values(franchiseLedger.seasons)) delete season.players?.[name];
}

export function wipeLedger() { franchiseLedger.seasons = {}; }
```

Note: `_historyFor` must also return `seasonName` — it already does (Task 3 included it in the pushed object; verify).

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/franchise-meta.test.js` — Expected: PASS.

- [ ] **Step 5: Config toggle wiring**

Read the relevant regions of `js/cast-ui.js` and `simulator.html`. In `simulator.html`, next to the season-number input (`cfg-season-number`), add:

```html
<label><input type="checkbox" id="cfg-franchise-meta" checked> Franchise history (returnees carry reputation & grudges)</label>
```

In `saveConfig` (~line 770 area) add: `franchiseMeta: g('cfg-franchise-meta')?.checked !== false,`
In `renderConfig` add the matching checkbox write-back (mirror how other checkboxes like `cfg-finale-assistants` are rendered).

- [ ] **Step 6: History panel + import/wipe controls**

In `simulator.html`, inside the cast-builder area (near the roster/import controls), add:

```html
<div id="franchise-history-panel" style="margin-top:10px;"></div>
<button onclick="document.getElementById('fh-import-input').click()">📥 Import history from seasons_database.json</button>
<input type="file" id="fh-import-input" accept=".json" style="display:none" onchange="importFranchiseHistory(event)">
<button onclick="wipeFranchiseHistory()">🗑 Wipe franchise history</button>
```

In `js/cast-ui.js` add (imports: `franchiseHistorySummary, backfillFromSeasonsDb, wipeLedger, clearPlayerHistory, franchiseLedger` from `./franchise-meta.js`; `persistFranchiseLedger` from `./savestate.js`):

```javascript
export function renderFranchiseHistoryPanel() {
  const el = document.getElementById('franchise-history-panel'); if (!el) return;
  const rows = players.filter(p => p.isReturnee).map(p => {
    const hist = franchiseHistorySummary(p.name);
    if (!hist.length) return `<div class="fh-row"><b>${p.name}</b> — no recorded history</div>`;
    return `<div class="fh-row"><b>${p.name}</b> — ${hist.map(h => `S${h.seasonNum}: ${h.line}`).join(' | ')}
      <button onclick="clearFranchisePlayerHistory('${p.name.replace(/'/g, "\\'")}')" style="margin-left:6px;">clear</button></div>`;
  });
  const total = Object.keys(franchiseLedger.seasons).length;
  el.innerHTML = `<div style="font-size:12px;opacity:.8;">Franchise ledger: ${total} season${total === 1 ? '' : 's'} recorded</div>` + rows.join('');
}

export function importFranchiseHistory(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const n = backfillFromSeasonsDb(JSON.parse(e.target.result));
      persistFranchiseLedger();
      renderFranchiseHistoryPanel();
      alert(`Imported ${n} season${n === 1 ? '' : 's'} into franchise history.`);
    } catch { alert('Invalid seasons_database.json file.'); }
  };
  reader.readAsText(file); event.target.value = '';
}

export function clearFranchisePlayerHistory(name) {
  clearPlayerHistory(name); persistFranchiseLedger(); renderFranchiseHistoryPanel();
}

export function wipeFranchiseHistory() {
  if (!confirm('Wipe ALL franchise history? This cannot be undone.')) return;
  wipeLedger(); persistFranchiseLedger(); renderFranchiseHistoryPanel();
}
```

Call `renderFranchiseHistoryPanel()` at the end of `renderCast()` (find it in cast-ui.js) so the panel refreshes with the roster. All four functions reach `window` via the main.js module spread (cast-ui is already spread — verify).

- [ ] **Step 7: Manual smoke test in the browser**

Open `simulator.html`. Verify: checkbox renders and persists; panel shows "0 seasons recorded"; import button accepts a seasons_database.json (use the one from your Downloads/exports if available) and the panel updates; wipe works with confirm.

- [ ] **Step 8: Commit**

```
git add js/franchise-meta.js js/cast-ui.js simulator.html tests/franchise-meta.test.js
git commit -m "feat: franchise history UI - config toggle, history panel, backfill import, wipe"
```

---

### Task 9: Integration + balance verification

**Files:**
- Create: `tests/franchise-meta-integration.test.js`

**Interfaces:**
- Consumes: everything above + the harness (`tests/helpers/season-harness.js`: `makeCast`, `runOneSeason`).

- [ ] **Step 1: Write the integration test**

Create `tests/franchise-meta-integration.test.js` (mirror the harness import/bootstrap of `tests/full-season-audit.test.js` — copy its setup lines 1-55 pattern or import the shared helper):

```javascript
import { describe, it, expect } from 'vitest';
import { makeCast, runOneSeason } from './helpers/season-harness.js';
import * as core from '../js/core.js';
import { setFranchiseLedger, franchiseLedger, buildFranchiseMeta } from '../js/franchise-meta.js';

describe('franchise meta end-to-end', () => {
  it('season 1 records a ledger; season 2 with returnees gets meta effects; sim completes', () => {
    setFranchiseLedger({ seasons: {} });
    // Season 1 — fresh cast, seasonNumber set so recording fires
    runOneSeason({ seasonNumber: 21, franchiseMeta: true }, 14);
    expect(franchiseLedger.seasons['21']).toBeTruthy();
    const s1players = Object.keys(franchiseLedger.seasons['21'].players);
    expect(s1players.length).toBe(14);
    const s1winner = Object.entries(franchiseLedger.seasons['21'].players).find(([, r]) => r.winner);
    expect(s1winner).toBeTruthy();

    // Season 2 — half the cast returns
    const cast2 = makeCast(14);
    const returningNames = s1players.slice(0, 7);
    for (let i = 0; i < 7; i++) { cast2[i].name = returningNames[i]; cast2[i].isReturnee = true; }
    core.setPlayers(cast2);
    const meta = buildFranchiseMeta(cast2, { franchiseMeta: true });
    expect(meta).toBeTruthy();
    expect(Object.keys(meta.profiles).length).toBeGreaterThan(0);

    runOneSeason({ seasonNumber: 22, franchiseMeta: true }, 14); // must not crash with meta active
    expect(core.gs.phase).toBe('complete');
    expect(franchiseLedger.seasons['22']).toBeTruthy();
  }, 120000);

  it('meta effects shift, never dominate: returnees are not auto-booted or auto-winners over 6 seasons', () => {
    // Balance smoke: pre-seed a decorated returnee, run several seasons,
    // check they neither always go first nor always win.
    setFranchiseLedger({ seasons: { '30': { seasonName: 'S30', players: {
      'MetaVet': { placement: 1, winner: true, finalist: true, episodesLasted: 16, blindsided: false,
        blindsidedBy: [], blindsidesAuthored: 3, idolsFound: 2, idolsPlayed: 2, idoledOut: false,
        betrayed: [], betrayedBy: [], allies: [], showmances: [], rivals: [], chalWins: 5, schemesCaught: 0 }
    } } } });
    let firstBoots = 0, wins = 0;
    for (let s = 0; s < 6; s++) {
      const cast = makeCast(12);
      cast[0].name = 'MetaVet'; cast[0].isReturnee = true;
      core.setPlayers(cast);
      runOneSeason({ seasonNumber: 0, franchiseMeta: true }, 12); // seasonNumber 0 → no ledger pollution
      const firstBoot = core.gs.episodeHistory.map(ep => ep.eliminated).find(Boolean);
      if (firstBoot === 'MetaVet') firstBoots++;
      if (core.gs.finaleResult?.winner === 'MetaVet') wins++;
    }
    expect(firstBoots).toBeLessThan(6); // elevated threat, but not a scripted first boot
    expect(wins).toBeLessThan(6);
  }, 600000);
});
```

**Adapt to the harness's actual API:** read `tests/helpers/season-harness.js` first — `runOneSeason(configOverride, castSize)` may build its own cast internally, which would overwrite `core.setPlayers`. If so, extend the harness with an optional `cast` parameter (`runOneSeason(configOverride, castSize, cast = null)` that uses the provided cast instead of `makeCast`) — a 3-line change; keep it backward-compatible.

- [ ] **Step 2: Run it**

Run: `npx vitest run tests/franchise-meta-integration.test.js --reporter=verbose`
Expected: PASS. If the balance test is flaky at 6 seasons, raise to 10 seasons and loosen only to `< n` (a decorated vet first-booted or winning EVERY time is the failure being guarded).

- [ ] **Step 3: Run the complete suite + existing audits**

Run: `npx vitest run` and `npm run audit:season`
Expected: all PASS — zero-meta seasons must be byte-for-byte unaffected (all multipliers are exactly 1.0 with `gs.franchiseMeta = null`).

- [ ] **Step 4: Manual browser pass**

Open `simulator.html`: run a short season with `seasonNumber` set, finish the finale, then start a new season reusing 2+ cast members marked returnee. Verify: history panel shows their record; cold open shows résumé lines; at least one OLD WOUNDS / REUNION / HISTORY camp event appears across the season; vote reasons occasionally cite history.

- [ ] **Step 5: Commit**

```
git add tests/franchise-meta-integration.test.js tests/helpers/season-harness.js
git commit -m "test: franchise meta end-to-end recording, meta effects, and balance guard"
```
