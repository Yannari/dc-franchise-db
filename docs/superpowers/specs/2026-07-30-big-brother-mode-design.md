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

## The longer goal this serves

Big Brother is the second show in what is meant to become a shared reality-TV
universe: Total Drama, Big Brother, then formats like Traitors, Drag Race, Love
Island, House of Villains. The point is the **résumé** — a Traitors cast that
contains a Love Island winner and a Drag Race villain, each carrying what they
did elsewhere.

Two consequences for this design, both already reflected below:

- **The character is the shared object**, and each show is a lens on them. That
  is why the roster, avatars and voice profiles stay shared while the rules,
  twists and per-season stats are per-format.
- **Adding show number three must not require touching shows one and two.** The
  two-engines-over-one-world split is chosen for that, not just for Big Brother.

A cross-show **fame level** — forgotten through to legend, earned in every show
and read by every show — is the connective tissue that makes a résumé mean
something: casting weight, how a house reads a newcomer, jury bias toward a
famous player. It is **not part of this spec** and should be designed once two
formats exist and there is something real to be famous for.

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

## An episode is a week, and a week is seven days

One episode resolves HOH, nominations, veto, the veto ceremony, the replacement
nominee and the eviction, and ends with someone leaving. This keeps the
invariant every other system relies on — **an episode ends in a boot** — so the
ledger, the live-season overlay, placements and the VP need no new concepts.

But the week must simulate **days**, not resolve as one block. Big Brother is a
social game first: if the week is HOH → noms → veto → eviction with nothing
between, the eviction is decided the moment nominations land and the format
collapses into a comp lottery.

```
DAY 1  HOH comp                     -> winner (outgoing HOH cannot play)
       scramble: pitches, "don't put me up" deals, alliance check-ins
DAY 2  Nomination ceremony          -> 2 nominees (target / pawn / backdoor)
       fallout: betrayal reads, comfort, panic
DAY 3  Veto player draw + comp      -> veto winner
       lobbying the veto holder
DAY 4  Veto ceremony                -> used or not; replacement if used
       the backdoor lands, or the plan survives
DAY 5  Campaigning                  -> nominees work the house, votes drift
DAY 6  Campaigning                  -> deals harden or break
DAY 7  Eviction vote                -> house votes, HOH breaks ties
```

The mechanical consequence is the important part: **the eviction is not a single
roll at the end.** Each nominee starts the campaign phase with a vote count
implied by existing bonds, and days 5–6 move it. The same nominee with the same
bonds survives or leaves depending on how those days go. This is what makes it a
social game, and it reuses the bond, trust, perceived-bond and social-
manipulation systems already in the engine — the part of the codebase best
suited to Big Brother.

The visual player presents the seven days as acts, which is also better viewing
than one long block.

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

Big Brother twists are **not decoration** — several rewrite the week's shape, so
the week engine must expose hooks for them from the start rather than have them
retrofitted:

| Twist | What it changes |
|---|---|
| Double Eviction | a compressed second week runs inside one episode |
| Diamond Veto | the veto holder names the replacement, not the HOH |
| Coup d'état | the nominations are overridden after the ceremony |
| Battle Back | an evicted player re-enters (the Rescue Island precedent) |
| Pandora's Box | an HOH-only gamble: a reward paired with a house-wide cost |

The engine therefore needs interception points at: HOH result, nomination
result, veto participants, veto outcome, replacement choice, vote eligibility,
and eviction result.

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

1. **The week engine.** The seven days, headless. No UI, no VP, no writer.
   Success: a house of 16 produces plausible evictions week after week down to a
   final 3, **and the campaign days visibly move votes** — a nominee's fate is
   not settled at the nomination ceremony. Twist hooks exist but no twist is
   implemented yet.
2. **The strategy layer.** Who a bot nominates and why; pawns and backdoors;
   whether to use the veto; when winning is bad for you; how a nominee campaigns
   and who is persuadable. This is what makes it Big Brother rather than a
   weekly lottery.
3. **The twist catalog.** Double Eviction first — it exercises the week hooks
   hardest and proves the engine can compress.
4. **VP screens.** The seven days as acts.
5. **Site and writer.** Format tags, grouped views, format-aware beats.

Steps 1–4 are Codex: they all live in `js/bb/`, including the VP screens.
Step 5 is Claude, and only becomes possible once a Big Brother season can
finish — except the data-layer groundwork (format tags, D1 schema), which is
unblocked and can start immediately.

Steps 1 and 2 are the project. The rest follows patterns that already exist.

## Division of work

Two agents are building this in parallel: **Codex** on the engine, **Claude** on
integration and audit. The split is by **file ownership**, because that is where
collisions actually happen — not by feature.

**Nobody edits a file the other owns.** If a change seems to need one, say so
instead of making it.

### Codex owns — the engine (all new files)

```
js/bb/week.js          the seven-day orchestrator
js/bb/strategy.js      nominations, veto decisions, campaigning, comp throwing
js/bb/house-events.js  house life between ceremonies
js/bb/bb-twists.js     the Big Brother twist catalog
js/bb/bb-vp.js         the week as acts in the visual player
tests/bb-*.test.js     tests for the above
```

Greenfield. Nothing here exists yet, so nothing here can break the live site.

### Claude owns — integration (all existing files)

```
js/core.js             season format tag, format field on TWIST_CATALOG
js/main.js             module registration
worker/*.sql           seasons.format, bb_appearances
worker/worker-studio.js  sync + publish for Big Brother seasons
js/stats-export.js     exporting a Big Brother season
player.html, devotees.html, leaderboards.html, seasons.html   grouped views
current-season.html    format-aware beat sheet
MANUAL.md
```

These are the files with the traps — name-derived avatar paths, storage-key
mismatches, the publish pipeline, the D1 sync. They should be changed by the
agent that has been in them.

### Off limits to both

`js/episode.js`. Total Drama's rules stay untouched; that is the whole point of
the two-engine split. If Big Brother appears to need a change there, it is a
design problem, not an implementation one.

### The contract between them

Agree this **before either starts**, because it is the only real coupling:

1. **Entry point.** What the host calls to run a week, and what it returns.
   Proposed: `simulateBigBrotherWeek(ep)` — mirrors `simulateEpisode(ep)`, sets
   `ep.evicted`, `ep.hoh`, `ep.nominees`, `ep.vetoWinner`, `ep.replacementNominee`,
   `ep.days[]`, and calls `updateChalRecord(ep)`.
2. **What the engine may import** from the shared world: `core.js` state,
   `bonds.js`, `players.js`, `romance.js`, `voting.js`, the VP kit. It must not
   import from `episode.js`.
3. **The `bb: {}` blob fields** a finished season records per player:
   `hohWins`, `vetoWins`, `timesNominated`, `timesSaved`, `timesOnTheBlock`.
4. **Twist hook signatures** — the seven interception points listed above.

Once those four are fixed, both sides can work without blocking each other.

### Audit

Claude reviews each milestone when Codex marks it done: behaviour against this
spec, the shared-world contract, whether anything leaked into an owned file, and
a headless run of a full season. Findings go back as a list, not as edits to
Codex's files.

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
