# Career Fame — design spec

Design spec, 2026-08-07. **Sub-project F**, alongside the five in
`2026-08-07-multi-show-data-model-design.md`.

A player's standing across the whole franchise, expressed as 0–5 stars. It grows
with what they did on screen, fades while they are off it, and locks forever at
five.

---

## Why this exists

The franchise runs more than one show. A career is no longer "how did you do on
Total Drama" — it is everything a person has done across every show, and the site
has no way to express that. `tier` is a per-player quality ranking, not a career
arc. `gs.popularity` is per-season audience sentiment that never leaves memory.
Neither answers "how big a deal is this person".

Fame answers it in one number that a cast list, a player page or a returnee
draft can all read.

## What fame is

- **0 to 5 stars, in half-star steps.** Everybody who has ever played has a
  number; there is no "unrated" state.
- **Cumulative.** Each season played adds to it.
- **Decaying.** Each season that happens without you subtracts a little.
- **Locked at 5.** Once a player reaches five stars they stay there permanently,
  decay included. Famous and impossible to forget.

## Decisions taken

Settled during brainstorming, before this was written:

| | Decision |
|---|---|
| **Rankings are per show** | Each show gets its own S+..D board of its own cast. Fame reads both and rewards a real career on more than one. |
| **Score plus hard gates** | Not a pure formula and not a top-N curve. A score drives the stars, but five stars additionally *requires* more than one season. |
| **Decay, with a permanent top** | Fame fades while a player is off air, slowly. Reaching five stops that forever. |
| **Popularity matters a lot** | How the audience received a player in a season is a multiplier on that season's gain, not an additive bonus. |
| **Website now, hooks designed in** | Nothing in the simulator reads fame yet. The read API it would call is defined and exported. |
| **Derived, never stored** | Fame is recomputed from published data on demand. No `fame` field in any JSON. |

### Why derived rather than stored

Decay makes fame a function of *when you ask*, not only of a player's own record:
publishing Big Brother 2 changes the fame of somebody who last played in Total
Drama 6, without them doing anything. A stored field would therefore have to be
recomputed for **every player on every export**, and the first export path that
forgets leaves the file disagreeing with reality with nothing to catch it.

That is not hypothetical. `docs/superpowers/multishow-followups.md` §4 records
nine career totals that already disagree between two stored copies. Fame is the
worst possible candidate to make the tenth.

The five-star lock is the reason this is even possible without state: walking the
season timeline gives "was this player ever at five" for free, deterministically.

## Architecture

One module, `js/fame.js`. No DOM, no simulator imports, no side effects — which
is what lets both the site and (later) the simulator use it, and what makes it
testable in isolation.

```js
computeFame(playersDb, rankingsDb, seasonsDb) → Map<playerId, FameResult>
fameOf(playerId, playersDb, rankingsDb, seasonsDb) → FameResult
```

```js
FameResult = {
  stars,     // 0 .. 5 in 0.5 steps
  score,     // 0 .. 100, the raw number behind the stars
  locked,    // true once five stars was reached
  timeline,  // [{ seasonId, format, seasonNumber, event, delta, score }]
}
```

`timeline` is not decoration. It is how a page shows *how* a career got where it
is, and how a failing test names the exact season that went wrong.

### The walk

1. Order every season in the franchise chronologically across all shows.
   `seasons_database.json` carries `(format, seasonNumber)` for all of them.
2. For each player, walk that order once:
   - **season they appeared in** → accrue (below)
   - **season they missed** → decay
   - **score reaches the five-star threshold with 2+ seasons played** → lock, and
     apply no further decay
3. Map the final score to stars.

Season order across shows is by the order seasons were published, which is the
order they appear in `seasons_database.json`. Two shows airing concurrently is
out of scope; if it ever happens, the chronology needs a real date field.

## The model

### Stars from score

Thresholds, not division — the gates have to bite.

| Stars | 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Score ≥ | — | 5 | 12 | 20 | 30 | 40 | 52 | 64 | 76 | 86 | 95 |

Below 5 is zero stars.

### Per season played

```
gain = (placementBase × popularityFactor + seasonAwards) × showRankMultiplier
```

**placementBase**, from `seasonDetails[].status`, which both shows already write:

| Winner | Runner-up | Finalist | Jury | Pre-jury |
|---|---|---|---|---|
| 22 | 16 | 13 | 8 | 3 |

**popularityFactor** — 0.5 to 1.5. Rank the season's cast by their stored
popularity; the most popular gets 1.5, the least 0.5, everybody else spaced
linearly between by rank position. Rank rather than raw value, because the raw
numbers are unbounded and vary in scale between seasons. A multiplier rather than
a bonus on purpose: a forgettable winner should earn materially less than a
beloved one. This is the term that makes "if you were actually forgettable" bite.

**seasonAwards** — read from `seasons_database.json`'s per-season `awards` block,
which stores exactly three: `fanFavorite`, `bestStrategic` and
`mostChallengeWins`. Fan Favourite is +10; the other two are +4 each. The cap of
+12 therefore only binds if the block grows later.

Note the season *document* (`bb-1-data.json` and friends) carries around thirty
award categories written by the narrative worker, but only these three are folded
into the seasons database. Fame reads the database, not the document, so it sees
three. Widening that is a data-model change and is out of scope here.

**showRankMultiplier** — the player's tier on *that show's* board:

| S+ | S | A | B | C | D |
|---|---|---|---|---|---|
| 1.5 | 1.35 | 1.2 | 1.05 | 0.9 | 0.75 |

### Career events, applied where they become true in the walk

- **Multi-show bonus** — +8 at the first season of a second show, +8 again for a
  third, capped +16. This is what "doing multiple shows increases your chance of
  five stars" means mechanically: it raises the ceiling, it does not grant the
  star.
- **Records** — +6 per franchise record held, capped +12, applied at the player's
  last appearance. Records come from `franchise_database.json`'s `records`
  (challenge, voting, strategic, social), which name a holder each.

### Per season missed

**−1.2, floored at 0.** A player absent for all fifteen existing seasons sheds
about 18 points — roughly one star. Being off air fades you; it does not erase
you.

### Gates

- **Five stars requires 2+ seasons played.** One season cannot reach it at any
  score. A single spectacular run makes you a 4.5-star one-hit wonder.
- **Reaching five locks permanently.** No decay afterwards, ever.
- 4.5 and below are score-only.

### Calibration

**The weights above are a first pass and are expected to move.** They are
asserted by a distribution test over the real roster rather than trusted:

- at most a handful of players at 5 stars
- the bulk of the roster between 1 and 3
- nobody with a single forgettable season above 2 stars
- not everybody on the same number (the failure mode the fallbacks below could
  cause)

If tuning is needed, the weights change and that test changes with them,
deliberately.

## Two missing inputs, and their fallbacks

Both inputs fame leans on hardest are absent from published data today. Both get
a stated fallback so fame works now and sharpens later.

### Popularity is live-only

`gs.popularity` never reaches the published files. Verified against a real Big
Brother export: absent from the season document's `placements` and from
`players_database.json`'s `seasonDetails`. Only the fan-favourite *winner*
escapes.

**Change:** write each player's season popularity into their season detail, in
both export paths.

**Fallback:** `popularityFactor` = **1.0 (neutral)** wherever popularity is
missing. The fourteen finished Total Drama seasons were exported before this
existed and that data is not recoverable from the published files, so they use
the neutral factor until re-exported. Inventing a number would look authoritative
and be wrong.

### Per-show rankings do not exist

`rankings_database.json` is a single board of 152 players, written for Total
Drama careers, with no `format` field.

**Change:** tag the existing board `total-drama` and add a Big Brother board.
Authoring a board is a human job — the entries carry hand-written `reasoning`,
`title` and `emoji` — so this spec does not generate one.

**Fallback:** `showRankMultiplier` = **1.0** for any show without a board, so a
Big Brother career counts at face value rather than being silently zeroed.

## Scope

**In:**
- `js/fame.js` — the module, the walk, the model
- a shared star renderer (half-star capable; tooltip shows score and locked state)
- **one page wired end to end** — the player page — as proof
- popularity written into season details in both export paths
- `format` on the rankings database, and the per-show lookup
- the test suite below

**Out:**
- stars on seasons, rankings, leaderboards, cast lists and the timeline — those
  pages belong to sub-projects B and D, which are about those pages anyway. This
  spec must not quietly become "touch every page".
- authoring the Big Brother ranking board
- any simulator behaviour reading fame
- backfilling popularity into the fourteen historical Total Drama seasons

## Testing

- **The walk** — accrual maths per placement tier; decay flooring at 0; the
  2-season gate refusing five stars however high the score; the lock surviving an
  absence long enough to have decayed the player below the threshold.
- **Determinism** — same inputs, same output. This recomputes on every page load.
- **Calibration over the real 152-player roster** — the distribution assertions
  above. The one that matters: without it the weights rot silently.
- **Fallbacks** — a player with neither popularity nor a ranked show still scores
  sensibly rather than 0, and the roster does not collapse onto one value.
- **Cross-show** — a player with seasons in both shows gets the multi-show bonus
  once, at the right season, and their two shows' rankings apply to the right
  seasons.

## Open question, deliberately not decided here

`franchise.totalSeasons` currently reads 14 while `seasons_database.json` holds
15 records. With two shows it is ambiguous whether that field is a count of
seasons or the highest Total Drama season number, and `awards.html` already
disagrees with itself about it (falling back to `seasons.length`). Fame does not
read it. It is recorded in `multishow-followups.md` §3 and belongs to whichever
sub-project settles cross-format display rules.
