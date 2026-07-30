# Big Brother mode — design

**Status:** approved design, not yet built
**Branch:** `big-brother`
**Date:** 2026-07-30

## What this is

A second game format for the simulator: a Big Brother season, run in the same
world as the Total Drama seasons — same character roster, same avatars, same
franchise — but with its own rules engine, its own twists, and its own rankings.

The existing format is **Total Drama**, not Survivor. It borrows Survivor's
structure, but the data tag is `total-drama` so nobody reading this in a year
wonders why the seasons are labelled as another show.

## Why it is not a reskin

Total Drama's power is *diffuse*: nobody can point at you, and you play to avoid
being the swing. Big Brother's power is **directed** — one person nominates, and
the rest of the house spends the week managing that person. That single
difference produces pawns, backdoors, non-aggression deals, and campaigning to
stay, none of which the current engine has any concept of.

Two more consequences:

- **The veto changes the target after nominations**, so a plan has to survive a
  mid-week reversal. Nothing in the Total Drama flow works that way.
- **Winning can be a liability.** Taking HOH forces you to make enemies. The
  current targeting logic cannot express "I would rather not win this."

House life is not camp life either: have-nots, punishments, the diary room, and
24/7 proximity with no tribe to retreat to.

## What actually transfers

Roughly 40%, concentrated in the parts that are least fun to rebuild.

| Transfers | Does not |
|---|---|
| Bonds, perceived bonds, trust, betrayal detection | Tribal council, immunity, merge |
| Romance and showmances | Camp life events |
| Threat perception, popularity | Targeting logic (different power structure) |
| Roster in D1, avatars, voice profiles | Twist catalog (all Total Drama) |
| VP kit, text backlog, AI writer, save/load | Strategy layer, week structure, finale |
| Franchise ledger, the site | Challenge *meaning* (a comp can be a curse) |

## Architecture

```
        ┌──────────────── shared world ────────────────┐
        │ core.js · bonds · players · romance          │
        │ roster (D1) · avatars · VP kit · save/load   │
        │ franchise ledger · AI writer · the site      │
        └───────────────┬──────────────┬───────────────┘
                        │              │
              episode.js (Total Drama) js/bb/*.js (Big Brother)
              7,500 lines, untouched    new engine
```

Two engines over one world. `episode.js` holds Total Drama's *rules*; Big
Brother does not belong inside it. A parallel orchestrator importing the same
primitives means nothing that works today can regress, because nothing that
works today changes.

Proposed modules under `js/bb/`:

| Module | Responsibility |
|---|---|
| `week.js` | the orchestrator: HOH → noms → veto → eviction |
| `strategy.js` | nomination targets, veto decisions, comp throwing |
| `house-events.js` | house life, distinct from camp events |
| `bb-twists.js` | the Big Brother twist catalog |
| `bb-vp.js` | the week as acts in the visual player |

## An episode is a week

One episode resolves HOH, nominations, veto, the veto ceremony, the replacement
nominee and the eviction, and ends with someone leaving. This keeps the
invariant every other system relies on — **an episode ends in a boot** — so the
ledger, the live-season overlay, placements and the VP need no new concepts.

The visual player presents the week as acts, so it still *feels* like separate
nights without the data pretending to be.

## Data model

A season carries a format tag. Per-season stats keep the genuinely shared fields
flat and nest only what is format-specific:

```json
{ "season": 16, "format": "big-brother",
  "placement": 3, "status": "Jury", "votesReceived": 4, "juryVotes": 2,
  "bb": { "hohWins": 2, "vetoWins": 1, "timesNominated": 3, "timesSaved": 1 } }
```

`placement`, `status`, `votesReceived`, `juryVotes` and `finalVote` mean the same
thing in both shows, so they stay flat and every existing reader — `player.html`,
`compare.html`, the leaderboards, the D1 sync — keeps working untouched. Only
displays that show comp stats need to know `bb` exists.

Nesting *everything* under `totalDrama: {}` / `bigBrother: {}` would give the
same separation while forcing roughly twenty readers to learn two shapes, for no
additional benefit.

**In D1:** `seasons` gains a `format` column. Big Brother stats go in a new
`bb_appearances` table rather than widening `appearances` with columns that
would be null for almost every row.

## Twists are format-scoped

The entire `TWIST_CATALOG` is Total Drama. Big Brother uses none of it and has
its own canon — Double Eviction, Battle Back, Coup d'état, Pandora's Box,
Diamond Veto.

Each catalog entry gains a `format` field, defaulting to `total-drama`, and the
twist picker only offers a season its own. The Big Brother catalog is a separate
body of design work and should not be rushed to fill the list.

## Crossover is the exception

Total Drama and Big Brother are two different shows in the same universe. A
character *can* appear on both, but most will not.

This is why:

- **Rankings are per-format.** A combined leaderboard would rank people who
  never played the same game. `rankings_database.json` gains a `format` key; a
  crossover star gets two honest scores instead of one blended one.
- **The site groups rather than merges.** `player.html` shows a Total Drama
  block and a Big Brother block; most characters have one, and a crossover
  reads as a feature. `leaderboards.html` gains a format switch beside the stat
  picker, `devotees.html` a format filter, `seasons.html` grouped runs.

What stays shared is the character: one Alejandro, one avatar, one voice
profile, whichever show he is on.

## The writer

`current-season.html` becomes format-aware rather than being duplicated: it
reads the season's format and switches its beat sheet and prompts — challenge
and tribal beats for Total Drama, HOH/noms/veto/eviction for Big Brother. One
page, one Control Room, one place a bug gets fixed.

## Build order

1. **The week engine.** HOH → noms → veto → eviction, headless. No UI, no VP, no
   writer. Success: a house of 16 produces plausible evictions week after week
   down to a final 3.
2. **The strategy layer.** Who a bot nominates and why; pawns and backdoors;
   whether to use the veto; when winning is bad for you. This is what makes it
   Big Brother rather than a weekly lottery.
3. **VP screens.** The week as acts.
4. **Site and writer.** Format tags, grouped views, format-aware beats.

Steps 1 and 2 are the project. Steps 3 and 4 follow patterns that already exist.

## Branch

Work on `big-brother`, merged when a season can run start to finish. Not for the
site's safety — the engine is additive — but because this is weeks of work and
Total Drama seasons should keep publishing from `main` throughout.

## Explicitly out of scope

- Live feeds, or any real-time notion of a week
- A separate site or a second database
- Cross-format combined rankings
- Rewriting or refactoring `episode.js`
- Porting Total Drama twists to Big Brother

## Open questions

- **Jury start.** Total Drama uses the merge as the signal; Big Brother has no
  merge, so the jury needs an explicit point (e.g. opens at 9 remaining).
- **Final 3.** Real Big Brother uses a three-part HOH. Worth building, or does
  the existing finale suffice for a first version?
- **Comp variety.** Which of the 90 post-merge/any challenges make sense as
  comps, and which need Big Brother equivalents (endurance wall, OTEV, mental).
- **House size.** Big Brother runs 16; Total Drama seasons run 18–24. Does the
  strategy layer hold at 24?
