# Show-aware list pages — design spec

Design spec, 2026-08-07. **Sub-project B** of the five in
`2026-08-07-multi-show-data-model-design.md`, reduced in scope (see below).

The site holds two shows and cannot tell them apart. This makes the per-show
lists say which show they are showing, lets a visitor switch, and fixes the two
places where two shows silently become one.

---

## Why now

Big Brother 1 is published. `seasons_database.json` holds 14 Total Drama seasons
and 1 Big Brother season; 18 players have a career in both shows. The site reads
all of it as one undifferentiated pile.

It is already visibly wrong. `/api/leaderboard` reports Wayne with **3 seasons**
— two Total Drama and one Big Brother, blended, with no way to ask for either.

## Scope

Sub-project B as originally drawn covers seven pages and about 5,350 lines, and
they do not want the same treatment. They split three ways:

| Kind | Pages | What they want |
|---|---|---|
| Per-show lists | `seasons`, `rankings`, `awards` | a switcher — **this spec** |
| Cross-show careers | `compare`, `franchise` | must NOT filter; a later pass |
| Awkward | `leaderboards`, `timeline` | leaderboards' API bug is here; its UI and the timeline are a later pass |

**In scope:**
- `js/show-switcher.js` — the shared control, its state, its URL handling
- `seasons.html`, `awards.html`, `rankings.html` made show-aware
- the empty state for a show with no ranking board
- fame stars on the rankings rows
- `/api/leaderboard` gains an optional `format`
- the bonds `SELECT DISTINCT` collapse in `/api/relationships`
- one registry for shows — no module keeps its own copy
- first tests for the worker's SQL

**Out of scope:** `compare`, `franchise`, `timeline`, the leaderboards *page* UI,
authoring a Big Brother ranking board, and extracting a shared page shell.

## Decisions taken

| | Decision |
|---|---|
| **One shared module** | Not a switcher copy-pasted per page, and not a page-shell refactor. |
| **Everything by default, grouped by show** | Nothing hidden; the switcher narrows. The franchise reads as one thing with two shows. |
| **State lives in the URL** | `?show=big-brother`. Shareable, back/forward works, and testable by loading a URL rather than driving clicks. |
| **Honest empty state** | A show with no ranking board says so and says where boards come from. |
| **Adding a show is one registry edit** | Nothing in the shared layer may hold its own list of shows. |

## Architecture

### `js/show-switcher.js`

```js
mountShowSwitcher(mountEl, { formats, onChange }) → { current(), set(format) }
currentShow() → string          // reads the URL; for code that only wants to know
export const ALL = 'all'
```

- **`formats` is passed in, never hardcoded.** Each page derives it from the data
  it already loaded — the distinct `format` values in its own JSON. A season in a
  new format makes the option appear with no edit to this module.
- Labels and emoji come from `SHOWS` in `js/shows.js`.
- `?show=<format>` filters; absent or `?show=all` shows everything. An
  unrecognised value falls back to `all` rather than erroring — a stale link
  should degrade, not break.
- Changing the switcher does `pushState`; `popstate` re-renders.
- The module owns the control and the state. It never touches a page's list.

Pages keep their own rendering:

```js
const sw = mountShowSwitcher(el, { formats, onChange: render });
function render() {
  const show = sw.current();
  // ALL → group under per-show headings, default format first
  // otherwise → flat, that show only
}
```

**Grouped means real headings**, not concatenation: a "Total Drama" heading over
its 14 seasons and a "Big Brother" heading over its 1. That is what makes one
Big Brother season read as deliberate rather than lost.

### One registry

`js/shows.js` already holds `prefix`, `name`, `short` and `emoji` per format. It
becomes the only place that knows them.

The same map currently exists in **three** places:

- `js/shows.js` — the registry
- `js/fame.js:102` — a private `PREFIX`, written during sub-project F
- `worker/worker-studio.js:547` — `SEASON_FILE_PREFIX`

Both copies are deleted and import `formatPrefix` instead. `js/shows.js` imports
nothing, so wrangler bundles it into the worker cleanly. This is not tidying: the
worker copy decides season **filenames**, so a third show missing from it writes
its season over another show's file — the same collision that nearly destroyed
Total Drama 1's episode log, waiting to happen again.

`_rebuildByShow` in `js/stats-export.js` branches on `format` to decide which
career totals a show contributes. That list moves into the `SHOWS` entry, so a
new show declares its stat fields instead of editing an `if`.

### What adding a show actually costs

Written down so the next one is a known quantity. A third show needs:

1. **One `SHOWS` entry** — prefix, name, short, emoji, career stat fields.
2. **An engine** — its own `js/<show>/*` modules. Not removable by any registry;
   this is the show itself.
3. **An export adapter** — an extractor and merges, as
   `extractBigBrotherSeasonTemplate` / `mergeBigBrotherSeason*` are for the house.
4. **A narrative prompt branch** in `worker/worker-season-live.js`.

Everything else — switcher options, season filenames, season IDs, badges,
grouping, fame — follows from the registry entry.

The goal is not a free third show. It is that **nothing silently needs updating**:
every remaining per-show place is one this list tells you about, rather than one
discovered when two seasons overwrite each other.

## The pages

**`seasons.html`** — season cards grouped under per-show headings, each carrying
a show badge. Formats derived from `seasons_database.json`.

**`awards.html`** — the same treatment. Awards belong to a season and inherit its
show.

**`rankings.html`** — the per-show board.
- Total Drama renders as today, from `rankings_database.json`.
- A show with no board shows: *"No Big Brother rankings yet — rankings are
  generated from current-season.html once a season is finished."* Visible and
  explained rather than broken, and it disappears on its own when a board exists.
- **Fame stars go on the player rows**, reusing `renderStars` from
  `js/fame-stars.js`. This is the page where they add most.

## The two data bugs

### `/api/leaderboard` is format-blind

Six stats blend the shows: `wins`, `finals`, `avgPlacement`, `juryVotes`,
`votesAgainst`, `seasons`.

It gains an optional `format` parameter that restricts the underlying
appearances. **The default stays all-shows**, deliberately: sub-project A's
constraint was that a Big Brother appearance must never drop a player off a
Total Drama board, and changing the default would do exactly that to every
existing caller.

With `?format=big-brother`, Wayne's 3 seasons correctly becomes 1.

### The bonds query collapses two relationships into one

In `worker/worker-studio.js`, the bonds `SELECT DISTINCT` ignores `bonds.format`.
A pair bonded in Total Drama 1 **and** Big Brother 1 returns a single row — one
relationship gone from the response entirely. That is silent data loss, not a
display ambiguity.

Adding `format` to the query fixes it, and fixes its sibling:
`GROUP_CONCAT(them.season_number)` yields `"1,1"` for a castmate shared across
both shows, which becomes the season IDs (`td-1,bb-1`) instead.

## Testing

**The worker's SQL, for the first time.** `node:sqlite` ships with the Node in
use here, so the queries run against a real database built from
`worker/multishow_schema.sql`, seeded with two-show rows.

This closes a gap recorded in `multishow-followups.md` §5: nothing tests the
worker SQL or the migration file, and a future edit that reintroduces
`a.challenge_wins` — the column the migration removed — or drops a `format`
predicate from the castmate join passes CI green today. Both bugs happened
during that branch and were caught only by hand-running probes.

Covered:
- the leaderboard filter: a two-show player's totals under each `format`, and
  unfiltered
- the default is unchanged: no player drops off a board that has no `format`
- the bonds pair bonded in both shows returns **two** rows, with distinguishable
  season IDs

**The switcher:** URL parsing, unknown values falling back to `all`, formats
derived from data rather than hardcoded, `popstate` re-rendering.

**A registry guard:** a test asserting no second format→prefix map has appeared
outside `js/shows.js`. An assertion about the shape of the code, because the
three copies proved that the rule cannot enforce itself — and the two that
existed were both written by someone who knew the rule.

**The pages, in a browser:** each renders both groups unfiltered and one group
under `?show=`, driven by URL rather than clicks. Playwright is installed as an
npm package; the MCP server is not reliably connected, so tests drive it directly.

## Open questions, deliberately not decided here

`franchise.totalSeasons` reads 14 while `seasons_database.json` holds 15 records.
With two shows it is ambiguous whether that field counts seasons or names the
highest Total Drama season number, and `awards.html` already disagrees with
itself (falling back to `seasons.length`). No page in this spec reads it. It
belongs with `compare`/`franchise`, which is where cross-show display rules get
settled.

`player.html:410` fetches a season document as `'data/seasons/season' + sd.season
+ '-data.json'` — season number only, no format. For a Big Brother season detail
that resolves to Total Drama's file. It is the read-side twin of the publish
collision already fixed in the worker, and it is now reachable, because Big
Brother season details exist. Not in scope here — no page in this spec reads
season documents — but it should be fixed in the pass that owns `player.html`.
