# TV Ratings — how the season went down with the country

**Status:** design, approved sketch, not yet built
**Date:** 2026-08-20

## What this is

A season-level audience meter. Every week the show airs, four demographics
form an opinion about what they just watched; those opinions move a number;
the number lands the finished season in a tier from Dogwater to Iconic.

The whole thing is a READER. It runs no simulation of its own and invents no
new events. Every signal it uses is already written into the episode record by
the engine that produced it, which is why it can be derived backwards over
every season already played — the same philosophy as the franchise ledger and
the voting analytics. Fifteen seasons get tiers the day it ships.

## Non-goals

- No Nielsen fiction — no households, no ad revenue, no timeslot.
- No cancellation. A Dogwater season still finishes.
- No second opinion engine. Ratings do not re-derive per-player popularity;
  they read it. `gs.popularity` and the edit layer remain the only writers of
  what the audience thinks of a PERSON. Ratings are what the audience thinks
  of a SEASON.

---

## 1. Where it lives

New module `js/ratings.js`. A near-leaf: imports `core.js`, `tone.js` and
`shows.js`, and nothing that imports it back.

It is called from the same place `updateEditLayer(ep)` is called, immediately
after it, at every episode-complete site. One clock, not two. It may read
`ep.editSnapshot` (the edit layer has already written it by then) but never
writes to `gs.edit`.

**Why not inside `js/edit-layer.js`:** that file is per-player — screen time,
confessionals, reads, fan drift. Ratings are per-season and are consumed by
pages that never load a player read. Same call site, separate file.

State: `gs.ratings = { weeks: [...], demos: {...}, momentum: n, v: RATINGS_V }`.
Plain objects and numbers only — no Sets, no functions, it has to survive
`JSON.stringify` like everything else on `gs`.

---

## 2. The signals

One episode record in, one `signals` object out, every field a plain 0..1.
`readSignals(ep, prev)` is pure and exported, because the retroactive pass and
the live pass must not be able to disagree.

Both shows, read from each show's own shape — the recurring bug class in this
repo is one show's vocabulary printed over the other, so every signal that
branches does it explicitly and takes its words from the registry entry.

| Signal | What it measures | Read from |
|---|---|---|
| `blindside` | how little the boot saw it coming | TD: `ep.defections.length`, `ep.votingLog` split. BB: `ep.voteOperation` flips + the betrayal ledger |
| `powerShift` | power crossed a line this week | this week's HOH / immunity holder vs. which alliance ran last week's boot |
| `steamroll` | one bloc has decided N weeks running | running streak — the ONLY signal with memory |
| `predictable` | the boot was the obvious boot | was the leaving player already the week's stated target |
| `showmance` | romance on screen | active showmances + sparks this week |
| `twist` | something happened to the format | `ep` twist flags + the week's twist acts |
| `likability` | how much the country likes who is left | mean `gs.popularity` of the remaining cast |
| `villainy` | how much of the cast is playing dirty | villain / mastermind / schemer share + villainous tone share via `classifyEventTone` |
| `mess` | scrappy, chaotic, unpolished | comic + emotional tone share of the week's events |
| `strategy` | real game being played | strategic tone share, vote-operation depth, alliance moves |
| `returns` | somebody came back or arrived | returnee / intruder / battle-back this week |

Nothing here is a threshold. Every one is proportional, per the house rule —
thresholds only choose narration.

---

## 3. The four demographics

Each demographic is a weighted sum over the signals plus its own aversions,
and each holds its own score. They are the point of the feature: four numbers
that disagree are interesting, one number is a scoreboard.

| | Teens | Young Adults | Middle Aged | Older |
|---|---|---|---|---|
| showmance | **+++** | + | **−−** | · |
| twist | **+++** | + | **−** | **−−** |
| powerShift | **++** | ++ | + | · |
| blindside | + | **+++** | + | · |
| steamroll | **−−** | **−−−** | · | **+** |
| strategy | · | + | **+++** | ++ |
| predictable | − | **−−** | **−−−** | · |
| mess | + | **++** | **−−** | **−** |
| likability | + | · | · | **+++** |
| villainy | + | + | · | **−−−** |
| returns | ++ | + | **−** | − |

Read across the rows and the tastes are legible: Older viewers will happily
watch a competent alliance run the house for six weeks and be furious about a
villain edit; Young Adults will abandon that same season by week three and
want the mess. A season cannot please all four, which is the design.

Each demographic's weights live in one frozen table in `js/ratings.js` with a
sentence per row explaining the taste, so the table can be tuned later without
guessing what it meant.

**The overall rating** is the mean of the four. Exposed alongside them, never
instead of them.

---

## 4. Momentum

A week's raw score does not become the new rating. It moves it, and how far it
moves depends on where the season already was:

```
raw      = weighted signals for this demographic, 0..100
delta    = raw - current
momentum = -2..+2, incremented on consecutive moves the same direction
```

- **Good weeks scale with momentum.** `up = delta * (0.35 + momentum * 0.08)`.
  A rising season converts a great week almost fully; a struggling one gets a
  fraction of the same week. Winning an audience back is slower than losing
  them, which is the same lesson as the race-challenge momentum rule.
- **Bad weeks land at full weight,** momentum or not. `down = delta * 0.45`.
  Audiences leave faster than they arrive.

Momentum is per-season, not per-demographic — the show has a trajectory; the
four groups ride it at their own weights.

Week one has no previous week, so it sets the baseline directly rather than
drifting from a fictional 50.

---

## 5. Tiers

| Tier | Band |
|---|---|
| Dogwater | under 25 |
| Bad | 25 – 37 |
| Okay | 38 – 49 |
| Average | 50 – 59 |
| Good | 60 – 71 |
| Great | 72 – 84 |
| Iconic | 85 and up |

The tier is computed from the **back-weighted mean of every week**, not the
final week: a season that collapsed in the middle and recovered on finale
night is not Iconic, and a season that was must-watch for eight weeks is not
Bad because the finale was a coronation. Late weeks count roughly double early
ones.

Live seasons show a provisional tier "through week N". Finished seasons stamp
the tier onto the ledger record.

---

## 6. The consequence

The house rule is that nothing is cosmetic. Ratings have two.

**a. Engagement changes how sharply the public votes.**

Public votes today are popularity-weighted picks — care package, America's
Nominee, America's Favourite and the Total Drama fan campaign all shape a pool
by `gs.popularity`. Engagement scales that spread:

```
engagement = clamp(rating / 55, 0.45, 1.6)
weight     = base + popularity * engagement
```

A high-rated season has a big, attentive electorate and its vote follows
popularity sharply. A Dogwater season's vote is a handful of people and comes
out close to random — the favourite can simply lose. That is sampling error,
modelled the honest way, and it means a bad season is genuinely less
predictable in its audience twists rather than just labelled worse.

**b. A season's tier feeds the life layer.**

Being on an Iconic season is worth more afterwards than being on a Dogwater
one. The tier becomes a multiplier in the follower model, which slots straight
into the machinery Dramagram already has.

---

## 7. Surfaces

**Season Overview tab** — the home of it. The Overview is already a
"through Episode N" cumulative ledger with an Audience pulse section, which
resolves the one open question: the weekly data belongs here precisely because
the Overview is cumulative. It gets a new section:

- the tier, large, with the current number
- the **trajectory** — every week's rating as an inline SVG curve (SVG, not
  CSS bars — house rule), with the twist weeks marked
- four demographic rows, each with its own number, its own trend arrow, and
  one generated sentence about what moved that group this week

**Seasons list and franchise pages** — a tier badge per season. Cheapest
surface, works retroactively on everything already played.

**VP** — one compact card at the end of the episode: the overnight number, the
trend, and the demographic that moved most. One card, not a screen. This is
the piece to cut first if it turns out to be noise between episodes.

**Text backlog** — the same overnight line, in prose. Every feature needs VP
and backlog both.

---

## 8. Retroactive derivation

`ratingsForSeason(episodeHistory, meta)` is a pure function over a finished
season's history and returns the full week series, demographics and tier. The
live path calls the same `readSignals` per episode, so a replayed season and a
lived one cannot produce different ratings.

Ledger records get `ratingsV`. When the version moves, a finished season's
ratings are re-derived from its save — the same heal pattern the ledger record
already uses. (That heal is being built in a parallel session in
`js/franchise-meta.js`; ratings reuses the pattern and does not touch that
file until it lands.)

---

## 9. Tests

- every tier is reachable across played seasons — a band nothing can reach is
  a band that does not exist
- the four demographics diverge: a season where all four agree every week
  means the weight table is not doing anything
- momentum asymmetry: the same great week lifts a rising season more than a
  falling one; the same bad week costs both the same
- both shows: signals read from Total Drama and Big Brother episode records,
  and no ratings sentence prints one show's vocabulary over the other
- serialization: `gs.ratings` survives save and load
- retro equals live: deriving a season's ratings from history equals what the
  live pass produced
- engagement consequence: a low-rated season's public vote is measurably
  closer to random than a high-rated one's

## 10. Build order

1. `js/ratings.js` — signals, weights, momentum, tiers, both entry points
2. Overview section (tier, curve, four demographics)
3. Retro derivation and tier badges on seasons / franchise
4. Engagement consequence in the public votes
5. VP card and text backlog line
6. Life-layer tier multiplier
