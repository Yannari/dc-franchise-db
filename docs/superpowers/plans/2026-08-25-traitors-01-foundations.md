# The Traitors — Plan 1: Foundations

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register The Traitors as a third show so it can be configured but not run, and remove every place a third show would silently be described as Total Drama.

**Architecture:** No engine in this plan. One registry entry in `js/shows.js`, the eight identity duplicate-maps collapsed into it, a registry flag that lets franchise history come from the appearance ledger instead of a hand-ticked checkbox, format-scoped setup controls, and a runnable flag that stays off. Every task leaves the site working.

**Tech Stack:** ES modules, no build step. Vitest (`npm test`). Playwright for e2e (`npm run test:e2e`).

**Spec:** `docs/superpowers/specs/2026-08-25-traitors-design.md`

## Global Constraints

- **Branch `traitors`, in the worktree at `../worktree-traitors`.** The main repo folder is checked out on `main` with another session actively editing it. Never `git checkout` in the main folder.
- **`git add <explicit paths>`, never `-A`.** Run `git status --short` AND `git branch --show-current` immediately before every commit.
- **A bare integer is Total Drama, permanently.** `season=14` is Total Drama 14; every other show is prefixed. Never break this.
- **Prefix is `tr`, chosen once.** It decides every filename and storage key (`data/seasons/tr-1-data.json`, `tr_episode_s1_e1`, `AI_ANALYTICS_tr-1`, `rankings_tr.json`). Changing it later orphans every file already written.
- **Slug is `traitors`.** Used in `SHOWS`, `CONFIG_SCOPE`, `TWIST_CATALOG.format`, and `seasonDetails[].format`.
- **Do not run the full test suite.** Run named test files only. The full run eats memory; audits are excluded from `npm test` deliberately. Kill orphan vitest workers after.
- **Valid stats are exactly:** `physical`, `endurance`, `mental`, `social`, `strategic`, `loyalty`, `boldness`, `intuition`, `temperament`. No others exist.
- **No `Math.random()`** in any code a seeded season replays. Use `stableRng` from `js/bb/knowledge.js`.

---

## File structure

| File | Responsibility | Task |
|---|---|---|
| `js/shows.js` | The registry. Gains a `traitors` entry, plus `showIcon()`/`showAccent()`/`showPrefix()` accessors so the eight identity maps can be deleted | 1, 2 |
| `player.html`, `js/wiki.js`, `js/wiki-view.js`, `season_ref.html`, `current-season.html`, `compare.html`, `franchise.html`, `js/alumni.js` | Eight identity maps, deleted and replaced with registry reads | 2 |
| `js/franchise-meta.js` | Gains a registry-driven history gate | 3 |
| `js/quick-setup.js` | `CONFIG_SCOPE`, show picker, host options, blueprint | 4 |
| `js/core.js` | `formatIsRunnable` learns `traitors`; `gs.tr` state shape | 5 |
| `tests/traitors-registry.test.js` | New. Registry correctness and the no-duplicate-maps guard | 1, 2 |
| `tests/format-scoped-config.test.js` | Extended for the third show | 4 |

---

### Task 1: Register the show

**Files:**
- Modify: `js/shows.js` (add one entry to `SHOWS`)
- Test: `tests/traitors-registry.test.js` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `SHOWS.traitors` with `prefix: 'tr'`, `name: 'The Traitors'`, `short: 'TR'`, `emoji`, `words`, `careerStats`, `audience`, and `historyFromLedger: true` (consumed by Task 3). Twenty-three modules already import `SHOWS` and need nothing further.

**Why `audience` ships now, not later:** `tests/ratings.test.js` requires every registered show to declare an overlay, and requires that the same week not rate identically on two shows. The spec's §2 said to defer it; that is wrong and this task corrects it. The values here are **provisional** and get calibrated in a later plan against a played season.

**Why `audienceAward` is omitted rather than set to `null`:** the manual is explicit — a show with no such award leaves the field out and calls nothing. Whether The Traitors gets one is an open question in spec §14; omitting is the reversible choice.

- [ ] **Step 1: Write the failing test**

Create `tests/traitors-registry.test.js`:

```js
// The Traitors, as the registry sees it. Everything downstream of a show —
// filenames, storage keys, every sentence a screen generates about a season —
// comes from this entry, so it is worth asserting rather than assuming.
import { describe, expect, it } from 'vitest';
import { SHOWS } from '../js/shows.js';

describe('the traitors registry entry', () => {
  it('is registered with the prefix every filename depends on', () => {
    const tr = SHOWS['traitors'];
    expect(tr, 'no traitors entry in js/shows.js').toBeTruthy();
    expect(tr.prefix).toBe('tr');
    expect(tr.name).toBe('The Traitors');
    expect(tr.short).toBe('TR');
    expect(tr.emoji).toBeTruthy();
  });

  it('does not collide with another show on prefix or name', () => {
    const prefixes = Object.values(SHOWS).map(s => s.prefix);
    expect(new Set(prefixes).size, 'two shows share a prefix').toBe(prefixes.length);
    const names = Object.values(SHOWS).map(s => s.name);
    expect(new Set(names).size, 'two shows share a name').toBe(names.length);
  });

  it('speaks its own language, and never another show\'s', () => {
    const w = SHOWS['traitors'].words;
    expect(w.round).toBe('Episode');
    expect(w.exit).toBe('banished');
    expect(w.player).toBe('player');
    // The two words that shipped as bugs on the other shows.
    expect(w.exit).not.toBe('evicted');
    expect(w.exit).not.toBe('voted out');
    expect(w.player).not.toBe('houseguest');
    expect(w.player).not.toBe('contestant');
  });

  it('omits audienceAward rather than naming an award the format lacks', () => {
    expect('audienceAward' in SHOWS['traitors'].words).toBe(false);
  });

  it('declares an audience overlay, which tests/ratings.test.js requires', () => {
    const a = SHOWS['traitors'].audience;
    expect(a, 'no audience overlay — the show would rate as generic reality TV').toBeTruthy();
    // Must not be a copy of another show's, or the same week rates identically.
    expect(a).not.toEqual(SHOWS['big-brother'].audience);
    expect(a).not.toEqual(SHOWS['total-drama'].audience);
  });

  it('declares careerStats so a season rolls up into a career', () => {
    const cs = SHOWS['traitors'].careerStats;
    expect(Array.isArray(cs)).toBe(true);
    expect(cs.length).toBeGreaterThan(0);
    for (const row of cs) expect(row).toHaveLength(2);
  });

  it('takes its franchise history from the ledger, not a checkbox', () => {
    expect(SHOWS['traitors'].historyFromLedger).toBe(true);
    // The other two shows must NOT gain this behaviour.
    expect(SHOWS['total-drama'].historyFromLedger).toBeFalsy();
    expect(SHOWS['big-brother'].historyFromLedger).toBeFalsy();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd ../worktree-traitors && npx vitest run tests/traitors-registry.test.js
```

Expected: FAIL — `no traitors entry in js/shows.js`.

- [ ] **Step 3: Add the entry**

In `js/shows.js`, add after the `'big-brother'` entry, inside `SHOWS`:

```js
  // ── The Traitors ────────────────────────────────────────────────────
  // An all-alumni social deduction format. Two things about it break
  // assumptions the other two shows never tested:
  //
  // 1. It has TWO exit verbs. `words.exit` is 'banished' because that is the
  //    vote, and a vote is what most screens are describing. But a murder is
  //    not a banishment, and any sentence about a departure must read the
  //    round's own exit channel rather than this default. Printing "banished"
  //    over a murder is the same bug as "evicted" over a camp.
  // 2. Every player has franchise history and NOBODY is returning to this
  //    show — the two things `isReturnee` has safely meant at once for fifteen
  //    seasons. `historyFromLedger` below is that split.
  'traitors': {
    prefix: 'tr', name: 'The Traitors', short: 'TR', emoji: '🗡️',
    words: { player: 'player', players: 'players', round: 'Episode', exit: 'banished',
      comp: 'mission', comps: 'missions won', compBeast: 'mission asset',
      compWon: 'missions' },
      // audienceAward is deliberately absent: the format has no in-show award
      // and the manual says a show without one leaves the field out and calls
      // nothing. Inventing a name would be worse than having none.

    // Reputation and grudges come from the appearance ledger rather than from
    // the per-season Returning checkbox. On the other two shows those coincide,
    // because a returnee is the only person with history worth carrying. Here
    // every player has history, so the checkbox would have to be ticked twenty
    // times a season to enable a system that already knows the answer — and the
    // day one is missed, that player walks in with no reputation and nothing
    // reports it. Read by buildFranchiseMeta().
    historyFromLedger: true,

    // PROVISIONAL. tests/ratings.test.js requires an overlay at registration and
    // requires it to differ from every other show's, so this cannot wait for the
    // ratings pass — but it has not been measured against a played season yet
    // and must be recalibrated there.
    //
    // The reasoning behind the shape: this show sells the betrayal, not the
    // arithmetic that produced it. A banishment that lands on a Traitor is the
    // event of the week, so `blindside` is the highest multiplier on the board.
    // `predictable` is punished hard because a season where the Faithfuls are
    // simply right every week has no show in it. Romance exists but is not what
    // anybody tuned in for.
    audience: { strategy: 1.15, blindside: 1.4, mess: 1.1, predictable: 0.6,
      steamroll: 1.1, showmance: 0.85 },

    // roundsAsTraitor rather than seasonsAsTraitor: recruitment means the role
    // is not a season-level property of a person.
    careerStats: [
      ['tr.missionsWon',     'totalMissionsWon'],
      ['tr.shieldsWon',      'totalShieldsWon'],
      ['tr.roundsAsTraitor', 'totalRoundsAsTraitor'],
      ['tr.timesRecruited',  'totalTimesRecruited'],
      ['tr.timesMurdered',   'totalTimesMurdered'],
      ['tr.timesBanished',   'totalTimesBanished'],
    ],
  },
```

- [ ] **Step 4: Run the new test and the guards a registry entry activates**

```bash
cd ../worktree-traitors && npx vitest run tests/traitors-registry.test.js tests/ratings.test.js tests/show-switcher.test.js tests/show-vocabulary.test.js
```

Expected: `traitors-registry` PASS, `ratings` PASS, `show-switcher` PASS.

**`show-vocabulary` may fail, and that is useful.** It walks *every registered format*, so the show just joined it. Read the failure before fixing anything:
- If it fails because Traitors output contains another show's words, that is a real bug — fix the vocabulary.
- If it **passes with nothing rendered** (no season data exists yet), record that in the commit message. The manual documents this exact failure mode: a guard that passes because there was nothing to check is worse than none. It gets real coverage in the plan that publishes a season.

- [ ] **Step 5: Commit**

```bash
cd ../worktree-traitors
git branch --show-current   # must print: traitors
git status --short
git add js/shows.js tests/traitors-registry.test.js
git commit -m "The registry learns a show with two ways to leave it"
```

---

### Task 2: Collapse the eight identity maps

**Files:**
- Modify: `js/shows.js` (add accessors)
- Modify: `player.html`, `js/wiki.js`, `js/wiki-view.js`, `season_ref.html`, `current-season.html`, `compare.html`, `franchise.html`, `js/alumni.js`
- Test: `tests/traitors-registry.test.js` (extend)

**Interfaces:**
- Consumes: `SHOWS.traitors` from Task 1.
- Produces: `showIcon(fmt)`, `showAccent(fmt)`, `showPrefix(fmt)`, `showShort(fmt)` exported from `js/shows.js`, alongside the existing `showName()` and `showWords()`.

**Why now:** the manual puts this second on purpose. The show is a registry entry with no data, so the diff is small and the failure mode is obvious. It converts eight chances to forget the show into zero. Doing it after the engine exists means eight silent mislabels found weeks later.

**Note for the implementer:** the line numbers below come from `docs/ADDING-A-SHOW.md` §9 and drift. Re-derive the list first (Step 1) and trust the command over the table.

- [ ] **Step 1: Re-derive the duplicate list**

```bash
cd ../worktree-traitors
EX='node_modules|\.claude/'
grep -rn "'total-drama'" --include=*.html --include=*.js . | grep -Ev "$EX" | grep -v "^./tests/" \
  | grep -E "\{ ?'total-drama'|'total-drama':" | grep -v "js/shows.js" \
  | awk -F: '{print $1}' | sort -u
```

Expected: the 13 files from §9. Eight are identity and get collapsed; five are per-show **data** and stay exactly where they are — `js/settings.js` (venues), `js/rankings-update.js` (ranking weights), `js/quick-setup.js` (config scope), `js/social/adapter.js` and `worker/worker-season-live.js` (vocabulary). **Do not touch those five.**

- [ ] **Step 2: Write the failing test**

Append to `tests/traitors-registry.test.js`:

```js
import { readFileSync } from 'node:fs';
import { showIcon, showAccent, showPrefix, showShort } from '../js/shows.js';

describe('identity lives only in the registry', () => {
  it('exposes every identity field a screen needs', () => {
    expect(showPrefix('traitors')).toBe('tr');
    expect(showShort('traitors')).toBe('TR');
    expect(showIcon('traitors')).toBe(SHOWS['traitors'].emoji);
    expect(typeof showAccent('traitors')).toBe('string');
    // An unknown format must not throw, and must not silently be Total Drama.
    expect(() => showIcon('nope')).not.toThrow();
  });

  // Each of these files held its own copy of the show list. Every one was a
  // place a third show could be forgotten, and none of them errored — they
  // described the new show as Total Drama.
  const COLLAPSED = [
    'player.html', 'js/wiki.js', 'js/wiki-view.js', 'season_ref.html',
    'current-season.html', 'compare.html', 'franchise.html', 'js/alumni.js',
  ];

  it.each(COLLAPSED)('%s holds no show list of its own', (file) => {
    const src = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    // An object literal keyed by show slug is the shape being banned.
    expect(src, `${file} still maps show identity locally`)
      .not.toMatch(/['"]total-drama['"]\s*:/);
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

```bash
cd ../worktree-traitors && npx vitest run tests/traitors-registry.test.js
```

Expected: FAIL on `showIcon is not a function`, then FAIL for each of the eight files.

- [ ] **Step 4: Add the accessors**

In `js/shows.js`, beside the existing `showName()`/`showWords()`:

```js
// Identity accessors. These exist so that no screen has to hold its own copy of
// the show list. Eight files did, none of them errored, and every one was a
// place a third show would have been drawn as Total Drama.
//
// Unknown formats return a neutral value rather than falling back to the
// default show: being told nothing is recoverable, being told the wrong show is
// not.
export function showPrefix(fmt) { return SHOWS[fmt]?.prefix || ''; }
export function showShort(fmt)  { return SHOWS[fmt]?.short  || ''; }
export function showIcon(fmt)   { return SHOWS[fmt]?.emoji  || ''; }
export function showAccent(fmt) { return SHOWS[fmt]?.accent || 'var(--accent)'; }
```

Then add an `accent` to each of the three entries, taking the current values out of `js/wiki-view.js`'s `SHOW_META` so nothing changes visually. For Traitors use a colour no other show uses.

- [ ] **Step 5: Collapse the eight files, one at a time**

For each file: read it, find the map named in §9, delete it, and replace every read with the accessor. **Commit after each file** so a mistake is one revert.

Worked example — `js/wiki.js` currently holds:

```js
const SHOW_NAMES = { 'total-drama': 'Total Drama', 'big-brother': 'Big Brother' };
// ... later ...
const label = SHOW_NAMES[fmt] || 'Total Drama';
```

becomes:

```js
import { showName } from './shows.js';
// ... later ...
const label = showName(fmt);
```

The eight, with the identifiers to remove:

| File | Remove |
|---|---|
| `player.html` | `SHOW_PREFIX`, `NAMES`, `ICONS`, `SHOW_NAMES` (×2), and the literal `['total-drama', 'big-brother']` |
| `js/wiki.js` | `SHOW_NAMES` |
| `js/wiki-view.js` | `SHOW_META` (name, short, emoji, accent) |
| `season_ref.html` | `SHOW_NAMES` |
| `current-season.html` | `CS_SHOWS` |
| `compare.html` | `CMP_SHOW_LABEL` |
| `franchise.html` | `SHOW_LABEL` |
| `js/alumni.js` | `_SHOW_NAMES` |

**`player.html` is the hard one** — five maps plus a hardcoded two-element array that must become `Object.keys(SHOWS)`. Do it last, and check the page renders for a Total Drama player, a Big Brother player, and someone with both.

**Warning:** `compare.html` is being edited by another session on `main`. Re-check before starting; if it is still dirty there, do that file last and keep the diff minimal.

- [ ] **Step 6: Run the tests**

```bash
cd ../worktree-traitors && npx vitest run tests/traitors-registry.test.js tests/show-vocabulary.test.js tests/wiki.test.js
```

Expected: all PASS.

- [ ] **Step 7: Verify the pages actually render**

Assertions do not prove a page draws — this is the documented failure mode of the last guard written here. Open each and confirm the show name, icon and accent appear for a Total Drama season and a Big Brother season:

```bash
cd ../worktree-traitors && python -m http.server 8123
```

Visit `player.html`, `season_ref.html`, `current-season.html`, `compare.html`, `franchise.html`. Nothing should have changed visually.

- [ ] **Step 8: Commit**

```bash
cd ../worktree-traitors
git branch --show-current
git status --short
git add js/shows.js js/wiki.js js/wiki-view.js js/alumni.js player.html season_ref.html current-season.html compare.html franchise.html tests/traitors-registry.test.js
git commit -m "Eight files stop keeping their own list of what shows exist"
```

---

### Task 3: Franchise history from the ledger

**Files:**
- Modify: `js/franchise-meta.js:505`
- Test: `tests/traitors-registry.test.js` (extend)

**Interfaces:**
- Consumes: `SHOWS.traitors.historyFromLedger` from Task 1.
- Produces: `buildFranchiseMeta(cast, cfg)` builds profiles for every player with ledger history when the season's format sets `historyFromLedger`, and is unchanged for Total Drama and Big Brother.

**The finding that shrinks this task:** `franchise-meta.js` line 505 is `if (!p.isReturnee) continue;` and line 507 is already `if (!history.length) continue;`. The ledger check is already there. So this is a gate change, not new logic. It must stay format-scoped: deleting 505 outright would give Total Drama and Big Brother reputation profiles for players nobody marked as returning, which is a behaviour change to two working shows.

- [ ] **Step 1: Write the failing test**

Append to `tests/traitors-registry.test.js`:

```js
import { buildFranchiseMeta, setFranchiseLedger, activeSeasons }
  from '../js/franchise-meta.js';

describe('franchise history on a show where everyone has some', () => {
  // Two players with real ledger history; NEITHER is ticked as returning.
  const cast = [
    { name: 'Gwen',  isReturnee: false },
    { name: 'Owen',  isReturnee: false },
  ];

  // The ledger is module state reached through activeSeasons(), not a field on
  // gs — setFranchiseLedger is how the existing franchise-meta tests seed it.
  beforeEach(() => {
    setFranchiseLedger({ seasons: {} });
    activeSeasons()['3'] = { seasonName: 'Season 3', players: {
      Gwen: { placement: 1, winner: true, chalWins: 3, blindsidesAuthored: 2 },
      Owen: { placement: 2, finalist: true, chalWins: 1 },
    } };
  });

  it('gives a Traitors cast profiles without a single checkbox ticked', () => {
    const meta = buildFranchiseMeta(cast, { format: 'traitors' });
    expect(meta, 'no meta built — every prior is dead').toBeTruthy();
    expect(Object.keys(meta.profiles).sort()).toEqual(['Gwen', 'Owen']);
    expect(meta.profiles.Gwen.repScore).toBeGreaterThan(0);
  });

  it('does NOT change Total Drama, where the checkbox still means something', () => {
    expect(buildFranchiseMeta(cast, { format: 'total-drama' })).toBeNull();
  });

  it('does NOT change Big Brother either', () => {
    expect(buildFranchiseMeta(cast, { format: 'big-brother' })).toBeNull();
  });

  it('still skips a Traitors player with no history at all', () => {
    const meta = buildFranchiseMeta(
      [...cast, { name: 'Nobody', isReturnee: false }], { format: 'traitors' });
    expect(Object.keys(meta.profiles)).not.toContain('Nobody');
  });
});
```

Add `beforeEach` to the vitest import at the top of the file.

- [ ] **Step 2: Run it and watch it fail**

```bash
cd ../worktree-traitors && npx vitest run tests/traitors-registry.test.js -t 'franchise history'
```

Expected: FAIL — `no meta built`, because `isReturnee` is false for everyone.

- [ ] **Step 3: Change the gate**

In `js/franchise-meta.js`, at the top of the file add to the existing imports:

```js
import { SHOWS } from './shows.js';
import { seasonFormat } from './core.js';
```

(If `seasonFormat` is already imported, do not import it twice.)

Then replace line 505:

```js
    if (!p.isReturnee) continue;
```

with:

```js
    // WHO CARRIES HISTORY INTO THIS SEASON.
    //
    // On Total Drama and Big Brother that is the returnees, and the checkbox is
    // the right answer: coming back to the same show is what makes a past
    // season relevant, and casting a player who happens to have played before
    // does not make them a returnee here.
    //
    // On a crossover show the two come apart. Everyone has history, nobody is
    // returning to THIS show, and requiring twenty ticked boxes to switch on a
    // system that can already read the ledger means the day one is missed, that
    // player walks in with no reputation and no grudges and nothing says so.
    //
    // The line below this one already skips anyone the ledger has nothing for,
    // so a show that opts in needs no other check.
    if (!fromLedger && !p.isReturnee) continue;
```

and immediately above the `for (const p of cast)` loop:

```js
  const fromLedger = !!SHOWS[seasonFormat(cfg)]?.historyFromLedger;
```

- [ ] **Step 4: Run the tests**

```bash
cd ../worktree-traitors && npx vitest run tests/traitors-registry.test.js tests/franchise-meta.test.js
```

Expected: PASS. If `tests/franchise-meta.test.js` does not exist, run only the first.

- [ ] **Step 5: Commit**

```bash
cd ../worktree-traitors
git branch --show-current
git status --short
git add js/franchise-meta.js tests/traitors-registry.test.js
git commit -m "A crossover cast carries its history without ticking twenty boxes"
```

---

### Task 4: Setup scope — configurable, not runnable

**Files:**
- Modify: `js/quick-setup.js` (`SHOWS` picker ~425, `CONFIG_SCOPE` ~993, `HOSTS_BY_FORMAT`, `blueprintFor`)
- Test: `tests/format-scoped-config.test.js` (extend)

**Interfaces:**
- Consumes: `SHOWS.traitors` from Task 1.
- Produces: `configScopeFor('traitors')` returns only controls this engine will read; `hostOptionsForFormat('traitors')` returns a Traitors host list; `blueprintFor({ format: 'traitors' }, n)` returns segments.

**The rule being encoded:** a control is shown only if that format's engine reads the value. Traitors has **no tribes, no merge, no idols, no advantages, no Shot in the Dark, no Rescue Island, no jury, no have-nots, no veto, no day count.** Adding the format to controls it does not read is the exact mistake this map exists to prevent — a Shot in the Dark toggle on a Traitors screen tells the reader the castle might have one.

- [ ] **Step 1: Write the failing test**

Append to `tests/format-scoped-config.test.js`:

```js
describe('the castle shows only its own controls', () => {
  it('hides every mechanic The Traitors does not have', () => {
    const tr = configScopeFor('traitors');
    for (const gone of ['tiebreaker', 'ri', 'sid', 'blackvote', 'aftermathshow',
                        'journey', 'exile', 'fan', 'idol', 'advantages', 'qem',
                        'survival', 'mole']) {
      expect(tr.accordions, `${gone} still shown in a castle`).not.toContain(gone);
    }
    for (const gone of ['cfg-days', 'cfg-teams', 'cfg-merge', 'cfg-finale-format',
                        'cfg-finale-assistants', 'cfg-finale', 'f-tribe']) {
      expect(tr.fields, `${gone} still shown in a castle`).not.toContain(gone);
    }
    expect(tr.sections).not.toContain('sec-tribes');
    expect(tr.sections).not.toContain('sec-season-options');
  });

  it('hides Big Brother\'s house furniture too', () => {
    const tr = configScopeFor('traitors');
    for (const gone of ['cfg-bb-havenots', 'cfg-bb-safety', 'cfg-bb-safety-stops',
                        'cfg-bb-havenot-count', 'cfg-bb-departures', 'cfg-bb-interview',
                        'cfg-theme']) {
      expect(tr.fields, `${gone} leaked from the house into the castle`).not.toContain(gone);
    }
    expect(tr.sections).not.toContain('sec-bb-options');
    expect(tr.sections).not.toContain('bb-options-body');
  });

  it('keeps the audience, which every show has', () => {
    expect(configScopeFor('traitors').accordions).toContain('popularity');
    expect(configScopeFor('traitors').sections).toContain('sec-settings-mechanics');
  });

  it('shows its own controls', () => {
    const tr = configScopeFor('traitors');
    expect(tr.sections).toContain('sec-tr-options');
    expect(tr.fields).toContain('cfg-tr-traitor-count');
    expect(tr.fields).toContain('cfg-tr-selection');
    // ...and those must not appear on the other two shows.
    expect(configScopeFor('total-drama').fields).not.toContain('cfg-tr-traitor-count');
    expect(configScopeFor('big-brother').sections).not.toContain('sec-tr-options');
  });

  it('offers the castle its own host, and not the other shows\' hosts', () => {
    const tr = hostOptionsForFormat('traitors');
    expect(tr.length).toBeGreaterThan(0);
    expect(tr.map(h => h.value)).not.toContain('Chris');
    expect(tr.map(h => h.value)).not.toContain('Don');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd ../worktree-traitors && npx vitest run tests/format-scoped-config.test.js -t 'castle'
```

Expected: FAIL on `sec-tr-options` not present.

- [ ] **Step 3: Add the show to the picker**

In `js/quick-setup.js`, the `SHOWS` array (~425) — note its own comment already anticipates this:

```js
const SHOWS = [
  { id: 'total-drama', name: 'Total Drama', tag: 'Tribes, challenges, tribal council', icon: '🎬' },
  { id: 'big-brother', name: 'Big Brother', tag: 'One house, HOH, veto, live eviction', icon: '🏠' },
  { id: 'traitors',    name: 'The Traitors', tag: 'A castle, a round table, a murder every night', icon: '🗡️' },
];
```

- [ ] **Step 4: Scope the config**

In `CONFIG_SCOPE` (~993), add `'traitors'` to **only** these existing entries:

```js
    popularity: ['total-drama', 'big-brother', 'traitors'],   // a castle has an audience too
```
```js
    'sec-settings-mechanics': ['total-drama', 'big-brother', 'traitors'],
```

Add nothing else to any existing entry. Then add the show's own controls:

```js
  fields: {
    // ... existing ...
    'cfg-tr-traitor-count':  ['traitors'],
    'cfg-tr-selection':      ['traitors'],   // random | chosen
    'cfg-tr-pot':            ['traitors'],
  },
  sections: {
    // ... existing ...
    'sec-tr-options':        ['traitors'],
    'sec-tr-divider':        ['traitors'],
  },
```

- [ ] **Step 5: Add the host**

`HOSTS_BY_FORMAT` (~913) is a flat map of format to `{ value, label }` list.
`hostOptionsForFormat` falls back to Total Drama's list for an unknown format,
which is exactly the silent mislabel to avoid — a castle hosted by Chris
McLean. Add:

```js
  'traitors': [
    { value: 'Alistair', label: 'Alistair Crane' },
    { value: 'Claudia',  label: 'Claudia Winterbourne' },
  ],
```

Names are placeholders for the franchise's own host and can be changed freely;
what must hold is that neither `Chris` nor `Don` appears, which the test asserts.

- [ ] **Step 6: Teach `blueprintFor` the shape**

`blueprintFor(config, castSize)` (~43) builds an array of
`{ label, ok, why }` segments and returns early for a house. A castle needs its
own early return for the same reason: no tribes, no merge, and **no jury at
all**, so falling through to the Total Drama path would draw a merge segment
over a show that has none.

Add immediately after the `const house = ...` line:

```js
  const castle = seasonFormat(config) === 'traitors';
```

and immediately after the first `segs.push({ label: `${N} ${...}` ... })` block,
before `if (house) {`:

```js
  // A castle has no tribes, no merge and no jury. What it does have is a
  // ratio: too few Traitors and one lucky banishment ends the season in
  // episode four, too many and the Faithfuls cannot help but find one.
  if (castle) {
    const asked = Number(config.traitorCount) || 0;
    const max = Math.max(2, Math.min(5, Math.round(N * 0.25)));
    const countOk = asked >= 2 && asked <= max;
    segs.push({ label: 'one castle', ok: true });
    segs.push({
      label: `${asked} traitor${asked === 1 ? '' : 's'}`,
      ok: countOk,
      why: countOk ? undefined : `A cast of ${N} supports 2 to ${max} traitors`,
    });
    const endOk = finaleSize >= 2 && finaleSize < N;
    segs.push({
      label: `endgame at ${finaleSize}`,
      ok: endOk,
      why: endOk ? undefined : `The endgame must start at 2+ and below ${N}`,
    });
    return segs;
  }
```

Note the first segment's label already reads `player` for any non-house format,
which is Traitors' word too — no change needed there.

- [ ] **Step 7: Run the tests**

```bash
cd ../worktree-traitors && npx vitest run tests/format-scoped-config.test.js tests/traitors-registry.test.js
```

Expected: PASS.

- [ ] **Step 8: Verify on the actual screen**

```bash
cd ../worktree-traitors && python -m http.server 8123
```

Open `simulator.html`, pick **The Traitors** in the show picker, and confirm: no tribes section, no idol/advantage accordions, no have-nots, no veto, the audience toggle present, and the Traitors options section visible. Then switch back to Total Drama and confirm its screen is unchanged.

- [ ] **Step 9: Commit**

```bash
cd ../worktree-traitors
git branch --show-current
git status --short
git add js/quick-setup.js tests/format-scoped-config.test.js
git commit -m "The setup screen offers a castle nothing a castle does not have"
```

---

### Task 5: State shape and the runnable flag, off

**Files:**
- Modify: `js/core.js` (`formatIsRunnable` ~1408)
- Create: `js/tr/state.js`
- Test: `tests/traitors-registry.test.js` (extend)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `initTraitorsState()`, `prepTrForSave(gs)`, `repairTrSets(gs)` from `js/tr/state.js`; `formatIsRunnable('traitors')` returns `false` until `window._trRunnable` is set.

**Why the flag exists:** so a half-built show cannot be started by somebody clicking through the setup screen — which is precisely our situation for the whole of the next several plans. It stays off until the engine can finish a season.

- [ ] **Step 1: Write the failing test**

Append to `tests/traitors-registry.test.js`:

```js
import { formatIsRunnable } from '../js/core.js';
import { initTraitorsState, prepTrForSave, repairTrSets } from '../js/tr/state.js';

describe('a castle nobody can start yet', () => {
  afterEach(() => { delete globalThis.window?._trRunnable; });

  it('is not runnable while the engine is unbuilt', () => {
    expect(formatIsRunnable({ format: 'traitors' })).toBe(false);
  });

  it('becomes runnable only when the engine says so', () => {
    globalThis.window = globalThis.window || {};
    globalThis.window._trRunnable = true;
    expect(formatIsRunnable({ format: 'traitors' })).toBe(true);
  });

  it('leaves the other two shows alone', () => {
    expect(formatIsRunnable({ format: 'total-drama' })).toBe(true);
  });
});

describe('traitors state survives a round trip through JSON', () => {
  it('starts empty and well-formed', () => {
    const tr = initTraitorsState();
    expect(tr.alignment).toEqual({});
    expect(tr.roleHistory).toEqual([]);
    expect(tr.pot).toBe(0);
    expect(tr.threads).toEqual([]);
    expect(tr.conclaveTension).toEqual({});
  });

  it('restores Sets that JSON.stringify would have flattened', () => {
    const g = { tr: initTraitorsState() };
    g.tr.shieldedThisRound = new Set(['Gwen']);
    const revived = JSON.parse(JSON.stringify(prepTrForSave(g)));
    expect(Array.isArray(revived.tr.shieldedThisRound)).toBe(true);
    repairTrSets(revived);
    expect(revived.tr.shieldedThisRound instanceof Set).toBe(true);
    expect(revived.tr.shieldedThisRound.has('Gwen')).toBe(true);
  });
});
```

Add `afterEach` to the vitest import.

- [ ] **Step 2: Run it and watch it fail**

```bash
cd ../worktree-traitors && npx vitest run tests/traitors-registry.test.js -t 'castle nobody'
```

Expected: FAIL — cannot resolve `js/tr/state.js`.

- [ ] **Step 3: Create the state module**

Create `js/tr/state.js`:

```js
// ══════════════════════════════════════════════════════════════════════
// tr/state.js — everything a Traitors season remembers
// ══════════════════════════════════════════════════════════════════════
//
// Kept in one place because two of these fields are the kind that get added
// ad hoc during a build and then quietly fail to serialize. Functions do not
// survive JSON.stringify and neither do Sets, so anything set-shaped is
// declared here and repaired here rather than discovered missing after a
// season is saved.

/** A season's Traitors state, empty. */
export function initTraitorsState() {
  return {
    // name -> 'traitor' | 'faithful'. Ground truth. The audience sees this;
    // the players never do.
    alignment: {},

    // Every change of allegiance, in order: { name, from, to, ep, via }.
    // `via` is 'selection' | 'recruitment' | 'ultimatum'. This is what makes
    // alignment ERAS possible — a player who flips in episode 8 was genuinely
    // a Faithful in episode 3, and a belief formed then was correct when it
    // was formed.
    roleHistory: [],

    // The shared prize fund. Nobody votes for it and only the winning faction
    // collects it, which is the whole strategic sting of a mission.
    pot: 0,
    potCeiling: 0,

    // Open narrative threads — see spec section 5.2. Events prefer to advance
    // one of these over starting something new, which is the single rule that
    // keeps a season from reading as forty unconnected incidents.
    threads: [],

    // Who overruled whom at the conclave, and on which night. Not a mood: this
    // is the ledger the endgame betrayal is eventually justified by.
    conclaveTension: {},

    // Set-shaped, so it must be declared here. Cleared each round.
    shieldedThisRound: new Set(),
  };
}

/** Field names on gs.tr that hold Sets and need flattening before a save. */
const TR_SETS = ['shieldedThisRound'];

/** Flatten Sets so the state survives JSON.stringify. Returns the same object. */
export function prepTrForSave(g) {
  if (!g?.tr) return g;
  for (const key of TR_SETS) {
    if (g.tr[key] instanceof Set) g.tr[key] = [...g.tr[key]];
  }
  return g;
}

/** Rebuild Sets after a load. Idempotent, and safe on a state that never had them. */
export function repairTrSets(g) {
  if (!g?.tr) return g;
  for (const key of TR_SETS) {
    if (!(g.tr[key] instanceof Set)) g.tr[key] = new Set(g.tr[key] || []);
  }
  return g;
}
```

- [ ] **Step 4: Teach `formatIsRunnable` the show**

In `js/core.js`, in `formatIsRunnable` (~1408), add before the final `return false`:

```js
  // Off until the engine can finish a season. The flag exists so a half-built
  // show cannot be started by somebody clicking through the setup screen.
  if (fmt === 'traitors') return typeof window !== 'undefined' && !!window._trRunnable;
```

- [ ] **Step 5: Run the tests**

```bash
cd ../worktree-traitors && npx vitest run tests/traitors-registry.test.js tests/format-scoped-config.test.js
```

Expected: PASS.

- [ ] **Step 6: Confirm the show cannot be started**

```bash
cd ../worktree-traitors && python -m http.server 8123
```

Open `simulator.html`, pick The Traitors, configure a season, and confirm the run control refuses to start it. This is the deliverable of the whole plan: a show that exists everywhere the site looks, and runs nowhere.

- [ ] **Step 7: Commit**

```bash
cd ../worktree-traitors
git branch --show-current
git status --short
git add js/core.js js/tr/state.js tests/traitors-registry.test.js
git commit -m "The castle exists on every screen and opens for nobody"
git push
```

---

## Done when

- The Traitors appears in the show switcher, the setup screen and every identity-bearing page, in its own words.
- No file outside `js/shows.js` holds a list of what shows exist.
- A Traitors cast gets franchise reputation with no checkbox ticked; Total Drama and Big Brother are unchanged.
- The season cannot be started.
- `npx vitest run tests/traitors-registry.test.js tests/format-scoped-config.test.js tests/show-vocabulary.test.js tests/ratings.test.js tests/show-switcher.test.js tests/wiki.test.js` is green.

## The plan series

This is plan 1 of 7 for sub-project 1. Each produces working, testable software.

| # | Plan | Spec §13 steps |
|---|---|---|
| **1** | **Foundations** — registry, identity collapse, history gate, config scope, state (this plan) | 1–5 |
| 2 | **The deduction slice** — alignment facts and eras, ballot evidence, suspicion→ballot, Round Table, reveal cascade, headless season. **The risk step: if a Round Table does not produce a believable banishment, stop** | 6 |
| 3 | **Murder and roles** — conclave, preference and argument, target reasoning, Shields, blocked-murder, recruitment, eras in anger, exit blowup | 7–8 |
| 4 | **The event engine** — threads, weighting, cooldowns, acts, residue, the castle pool at scale | 9 |
| 5 | **Missions, powers, endgame** — pot, Dagger, Seer, murder variants, banish-or-end, twist catalog, dispatch, runnable on | 10–11 |
| 6 | **Export and publish** — `careerStats`, the co-winner decision, D1, one season end to end | 12–13 |
| 7 | **VP, text backlog, screens** — observer contract, the conclave screen, audience/fame/rankings wiring | 14–15 |

Ratings (spec sub-project 3) and the interactive mode (sub-project 2) get their own plans after a season has been played.
