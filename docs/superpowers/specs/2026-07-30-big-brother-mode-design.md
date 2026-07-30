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

## Roadmap

Kept current as things land.

**Ordering rule: make it playable, then make it deep, then make it pretty.**
Content for an engine nobody can run is content nobody can see.

**Splitting rule: Codex is the smaller budget, so it buys the things that are
expensive to get wrong and cheap to write — contracts, state ownership, hook
signatures, adapters, invariants, validation. Claude has the larger budget and
takes everything that is expensive to write and cheap to correct — libraries,
volume, narration, integration, the site.** A rule of thumb: if getting it wrong
means a rewrite, it is Codex's; if getting it wrong means an edit, it is
Claude's.

Neither agent edits a file the other owns. Neither touches `js/episode.js`.

### Done

| | Owner |
|---|---|
| Data layer — format tag, Show selector, D1 `seasons.format` + `bb_appearances`, sync, export adapter, career merge | Claude |
| Week engine as acts, house-event scheduler + state API, twist catalog + Double Eviction, VP surface, competition contract | Codex |
| Event library — ceremonies (9), social (10), registry, shared-substrate read layer | Claude |

### In flight

| | Owner |
|---|---|
| Migration step 1 write half: `remember` → `rememberStrategy`, `setTarget` → shared intentions, relationship/showmance effects through shared APIs, `js/bb/shared-strategy.js`, then the threat/heat adapter | Codex |

---

### Phase 1 — make a season runnable *(the blocker for everything below)*

Nothing outside the tests dispatches the engine, and `houseEvents` defaults to
empty. A Big Brother season cannot be played, and if it could, the house would
be silent.

**Claude** — dispatch from the run surface when the season format is
`big-brother`; hand the engine the event and competition registries; set
`window._bbRunnable`; season setup that produces a house rather than tribes;
make one full season finish and export.

**Codex** — confirm the season entry point and its options contract, and say
what the run surface is allowed to assume between weeks.

### Phase 2 — competitions

Every week needs an HOH and a veto. The one library a week cannot open without.

**Claude** — `js/bb-comps/`: the competition library. Endurance, puzzle,
crapshoot, skill and question families, each with narration, per-player
performance and a stat mix that lets different archetypes win different weeks.
Plus the throwing-a-comp texture that makes Big Brother read as Big Brother.

**Codex** — the contract, scheduler and result validation in `js/bb/comps.js`;
guarantees the week engine can rely on (exactly one winner, eligibility, ties).

### Phase 3 — season modes and twists

Built before the volume because modes reshape the week itself; late means
rebuilding around them.

**Claude** — `js/bb-twists/`: AI Arena and Block Buster first, then one-shot
powers (Diamond Veto, Coup d'état, Halting Hex), then Battle of the Block,
Festie Besties, Camp Comeback.

**Signature competitions belong to this phase, not to phase 2.** OTEV, BB
Comics, Hide and Go Veto and the rest are the Big Brother equivalent of a Total
Drama twist challenge — a specific named competition with its own mechanic — and
the library shipped in phase 2 is deliberately the generic layer underneath
them, the same way Total Drama's generic challenge sits under its twist
challenges.

The distinction is mechanical, not decorative, and it is the reason they are
worth doing properly rather than quickly. A generic competition resolves once:
score everybody, sort, done — so the best player on paper wins unless the noise
is large. A signature competition has STRUCTURE. Rounds that score independently
let a mediocre houseguest survive six of them and knock the strongest player out
third. Strikes punish one bad moment more than a slow average. An asymmetric
competition has one houseguest playing a different game from everyone else.
That structure is what produces winners a single sort never would, and building
it as a stat mix with a nicer name would miss the entire point.

**Codex** — mode-versus-twist plumbing: how a mode is enabled at setup,
consulted every week, and switched off at a house size; three-nominee support in
the week contract; catalog placeholders.

### Phase 4 — event volume

From 19 events toward the 80–120 the acts model needs.

**Claude** — `deals` (pitches, final-two deals, vote-flipping, jury management)
and `house-life` (have-nots, slop, chores, pranks, sleep, the diary room), then
deepen ceremonies and social with the relationship dimensions now readable.

**Codex** — nothing, unless the scheduler needs a new slot type.

### Phase 5 — site, VP polish and the writer

Genuinely blocked until a season can finish.

**Claude** — grouped player pages, format switches on `leaderboards.html` and
`devotees.html`, grouped `seasons.html`, format-aware beats in
`current-season.html`, MANUAL, and the AI writer's Big Brother voice.

**Codex** — VP act screens keep pace with the engine.

---

### Two gaps that make Big Brother thinner than Total Drama

Both are places where existing depth simply does not run. Split by the same rule:

* **Alliances form, but almost never.** ~~Nothing writes `gs.namedAlliances`~~ —
  the lifecycle adapter has landed. Measured across thirty seasons afterwards,
  however, it produced **3 named alliances in total, in 2 of 30 seasons**, so
  `allianceStrength()` is still zero in nearly every decision it feeds. Worth a
  look at whether formation is gated too tightly or is only reachable from a
  path that rarely runs. *Claude's* events are unaffected either way: they prefer
  a real alliance and fall back to people aligned in practice, which is doing all
  of the work at present.
* **Perceived bonds — CLOSED.** The house-context adapter has landed and works:
  measured over thirty seasons, the house's read of a relationship now differs
  from the truth for **32.2% of surviving pairs**. Houseguests can finally
  misjudge each other, which is what a blindside is made of.

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
| Strategic memory, intentions, knowledge, reputation primitives | TD targeting/heat orchestration, week structure, finale |
| Franchise ledger, the site | Challenge *meaning* (a comp can be a curse) |

## Shared-system audit — 2026-07-30

Big Brother must reuse the strategic substrate already built for Total Drama.
It must not reuse Total Drama's round controller. The useful boundary is:
**share state and decision semantics; adapt format evidence; keep format rules
separate.** Reimplementing bonds, memory, intentions, information flow, social
standing, or pitch psychology under `gs.bb` would produce two shallower
simulators whose contestants behave differently for accidental reasons.

### Reuse classification

| Classification | Existing systems | Big Brother rule |
|---|---|---|
| **Direct shared primitive** | scalar and perceived bonds; relationship dimensions and decision profiles; semantic relationship causes (`recordBetrayal`, `recordProtection`, loyalty/respect/attraction); strategic-memory read/write; knowledge facts, beliefs and confidence; player stats and base threat; named-alliance, side-deal and showmance state; pure pitch-response and competing-pitch evaluators | Import and use the public API. These systems own their canonical `gs` state in both formats. |
| **Reuse through a BB adapter** | composite threat/heat; intentions; strategic reputation; social-status roles; knowledge propagation contacts; alliance lifecycle, betrayal detection and repair; pitch leaks/counterplay; showmance formation; perceived-bond triggers and recovery | Preserve the shared model, but supply Big Brother's house, week, ballots, competition record and power actions as evidence. Do not fake a tribe, merge, immunity challenge or Tribal Council to make an existing orchestrator run. |
| **Total Drama only** | `computeHeat` as a whole; `formAlliances`; `pickTarget`; `simulateVotes`; immunity/idol/Shot-in-the-Dark/revote logic; tribe and camp grouping; challenge record updates; camp-event and episode orchestration | Do not call from Big Brother. Equivalent BB decisions belong in `js/bb/strategy.js` and `js/bb/week.js`, composed from the shared primitives above. |

Some functions sit on both sides of the boundary. `players.threatScore`, for
example, combines broadly useful bonds, alliances and competition evidence, but
currently relies on browser globals and Total Drama-shaped challenge history.
Its formula is reusable; calling it headlessly from BB is not yet safe.
Likewise, `alliances.computeHeat` begins with useful social pressure and then
accumulates immunity, idol, tribe and challenge-specific modifiers. BB must not
copy that function or inherit those modifiers accidentally.

### Canonical shared state

There is one source of truth for each cross-format concept:

| Concept | Canonical state |
|---|---|
| Bonds and perceived bonds | `gs.bonds`, `gs.perceivedBonds` |
| Directional trust, loyalty, respect and attraction | `gs.relationshipDimensions` |
| Reasons a relationship changed | `gs.relationshipCauses` |
| Strategic memories | `gs.strategicMemories` |
| Personal facts, rumors and beliefs | `gs.knowledge` |
| Persistent plans and endgame intentions | `gs.intentions` |
| Alliances and private deals | `gs.namedAlliances`, `gs.sideDeals` |
| Showmances | `gs.showmances` |
| Popularity, social roles and reputation | `gs.popularity`, `gs.socialStatus`, `gs.strategicReputations` |

`gs.bb` owns only format facts: weeks, outgoing HOH, nominees, veto and vote
records, BB competition statistics, twist/mode state, and BB-specific heat
evidence such as pawn use, backdoor attempts and public nomination promises.
It must not contain a second strategic-memory, alliance, relationship,
intention, knowledge, showmance or reputation model.

In particular, `gs.bb.house.memories` is not a decision store. The house-event
API's `remember` operation writes through `rememberStrategy(...)`. An event may
also retain a small render/debug receipt (`eventId`, actors, week and memory
reference), but strategy never reads that receipt. `setTarget` similarly writes
the actor's shared intention through the BB intentions adapter; it cannot create
an isolated `gs.bb.house.targets` truth. Any temporary target cache is derived
and disposable.

### The BB strategic adapter

Codex owns a thin adapter under `js/bb/` that composes public shared APIs. It
does not fork their formulas or state. The adapter provides four boundaries:

1. **House context:** active houseguests are the social group. No fake
   `gs.isMerged`, tribe or camp is introduced.
2. **Round evidence:** a completed week is normalized as strategic evidence:
   `{ num, format, votingLog, eliminated, pitches, alliances,
   competitionResults, powerActions }`. `ballots` map to `votingLog` only at
   this boundary; the public BB week contract remains unchanged.
3. **Threat and heat:** start with shared player threat, bonds, perceived bonds,
   memories, reputation, social role and alliance position, then add named BB
   contributions for HOH/veto wins, nominations, pawns, backdoors, promises and
   recent power use. Total Drama `_...Heat` fields are never read.
4. **Decision effects:** campaign pitches use the existing pitch-response,
   competing-pitch, leak and counterplay semantics; eviction results feed the
   shared betrayal/alliance-repair, memory, knowledge, reputation and intention
   systems through normalized evidence.

The adapter must accept an explicit RNG wherever the BB engine already does.
It must not reach for `Math.random`, browser globals, VP state or DOM state.

### Migration order and acceptance criteria

1. Route house-event `remember`, `setTarget`, relationship changes and
   showmance effects to the canonical stores above.
2. Replace duplicated `bbThreat`/heat inputs with the BB adapter while keeping
   nomination, veto, comp-throwing and eviction decisions BB-specific.
3. Rebuild campaign resolution on the shared pitch evaluators, preserving the
   current BB ballot and variable-campaign-beat contracts.
4. Feed each eviction through normalized betrayal, alliance, memory and
   knowledge evidence.
5. Add BB evidence providers for intentions, reputation and social-status roles;
   add house-context adapters for information spread and romance lifecycle.

Contract tests must prove that a BB week changes canonical shared state, that
later BB decisions read those changes, and that an equivalent Total Drama
season remains unchanged. Tests must also reject duplicate strategic stores
under `gs.bb`, TD-only heat keys in BB decisions, browser globals, and calls to
`episode.js`. A fixed seed must reproduce the same strategic consequences.

If an extraction or new public hook is needed inside an existing shared module,
Claude owns that shared-file edit under the ownership protocol below. Codex
defines and tests the BB-side adapter contract in `js/bb/`; neither agent copies
the shared implementation to avoid crossing the ownership line.

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
| `shared-strategy.js` | BB context/evidence adapters over shared strategic APIs |
| `house-events.js` | house life, distinct from camp events |
| `bb-twists.js` | the Big Brother twist catalog |
| `bb-vp.js` | the week as acts in the visual player |

## A week is an episode, built from acts — not from days

One episode resolves HOH, nominations, veto, the veto ceremony, the replacement
nominee and the eviction, and ends with someone leaving. This keeps the
invariant every other system relies on — **an episode ends in a boot** — so the
ledger, the live-season overlay, placements and the VP need no new concepts.

**REVISED 2026-07-30: no days.** An earlier draft simulated seven numbered days.
That is dropped. A Big Brother week is built the way a Total Drama episode is
built — as a run of **acts**, with social beats between them — and for the same
reason: acts are what the VP renders, what the text backlog transcribes, and
what events hang off. The day numbers were scaffolding on top of acts that
already existed, and they multiplied the content bill without adding structure.

```
ACT  HOH competition        -> winner (outgoing HOH cannot play)
       > social beats: pitches, "don't put me up" deals, alliance check-ins
ACT  Nomination ceremony    -> 2 nominees (target / pawn / backdoor)
       > social beats: betrayal reads, comfort, panic
ACT  Veto competition       -> player draw, then a winner
       > social beats: lobbying the veto holder
ACT  Veto ceremony          -> used or not; replacement if used
       > social beats: the backdoor lands, or the plan survives
ACT  Campaign               -> nominees work the house, votes drift
ACT  Eviction               -> house votes, HOH breaks ties
```

This is the Total Drama shape exactly: camp events, a multi-beat challenge,
post-challenge fallout, then a vote that sends someone home.

**What must NOT be lost with the days.** The reason the days were there in the
first place still stands: if a week runs HOH → noms → veto → eviction with
nothing between, the eviction is decided the moment nominations land and the
format collapses into a comp lottery. So **the eviction is still not a single
roll at the end.** Each nominee enters the Campaign act with a vote count
implied by existing bonds, and the campaign beats move it. The same nominee with
the same bonds survives or leaves depending on how that act goes.

The Campaign act therefore carries **a variable number of beats, not a fixed
two** — the same way a Total Drama challenge fires a variable number of social
events between its phases. Fewer, denser beats that each change something beat
seven days of filler.

This reuses the bond, trust, perceived-bond and social-manipulation systems
already in the engine — the part of the codebase best suited to Big Brother.

### Required engine change (Codex)

`js/bb/week.js` currently emits `week.days[]` with numbered entries. It becomes
`week.acts[]`, entries keyed by `type` only, with no `day` field and no
assumption of exactly two campaign entries. The act types themselves are already
right — `hoh`, `nominations`, `veto`, `veto-ceremony`, `campaign`, `eviction` —
so this is a rename plus dropping the numbering, not a redesign.

Integration is unaffected: the export adapter reads only week-level fields
(`hoh`, `vetoWinner`, `initialNominees`, `finalNominees`, `votes`), so nothing in
`js/stats-export.js` depends on days and nothing there needs to change.

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

### Season modes are not scheduled twists

Some Big Brother mechanics reshape every week for a long stretch of the season.
They are configured like Rescue Island: enabled at season setup, consulted by
the week engine every round, and automatically switched off at a defined house
size. They do **not** occupy one slot in the twist schedule.

The two nominee-arena formats are related but distinct modes:

| Mode | Weekly structure | Canonical duration | Simulator default |
|---|---|---|---|
| **AI Arena** (BB26) | HOH names three nominees. After the veto ceremony, all three remaining nominees compete immediately before eviction; the winner becomes safe and the house votes between the other two. | Ran through the pre-jury game and ended as the season reached nine remaining. | Active while a week opens with 10+ houseguests; switches off once 9 remain. |
| **BB Block Buster** (BB27) | Same three-nominee/live-safety structure, but established as the season's standing eviction format rather than an AI-themed temporary power. | Continued into jury. The final Block Buster decided seventh place, leaving the final six; the following accelerated eviction used the traditional format. | Active while a week opens with 7+ houseguests; switches off once 6 remain. |

Both modes therefore need the same engine capabilities—three initial/final
nominees, three-person campaign tallies, a safety competition between campaign
and eviction, and ballots recalculated after one nominee comes down—but they
must remain separate catalog/config entries because their duration and season
identity differ. Their stop point should be configurable; the canonical values
above are defaults, not hard-coded universal rules.

Future season-long formats such as Battle of the Block, Festie Besties, teams,
or Camp Comeback belong in this same **mode** layer. One-shot powers such as a
Diamond Veto, Coup d'état, or Halting Hex remain scheduled twists.

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

1. **The week engine.** The acts, headless. No UI, no VP, no writer.
   Success: a house of 16 produces plausible evictions week after week down to a
   final 3, **and the campaign beats visibly move votes** — a nominee's fate is
   not settled at the nomination ceremony. Twist hooks exist but no twist is
   implemented yet.
2. **The strategy layer.** Who a bot nominates and why; pawns and backdoors;
   whether to use the veto; when winning is bad for you; how a nominee campaigns
   and who is persuadable. This is what makes it Big Brother rather than a
   weekly lottery.
3. **The twist catalog.** Double Eviction first — it exercises the week hooks
   hardest and proves the engine can compress.
4. **VP screens.** The acts.
5. **Site and writer.** Format tags, grouped views, format-aware beats.

Codex owns the contracts and architecture needed by steps 1–4: the week and
strategy engines, schedulers, catalog placeholders, hook contracts and VP
surface. Claude owns the volume within those contracts: production events,
competition families and individual twist implementations. Step 5 remains
Claude integration and becomes fully actionable once a Big Brother season can
finish — except the data-layer groundwork (format tags, D1 schema), which is
unblocked and can start immediately.

Steps 1 and 2 are the project. The rest follows patterns that already exist.

## Division of work

Two agents are building this in parallel: **Codex** on the engine, **Claude** on
integration and audit. The split is by **file ownership**, because that is where
collisions actually happen — not by feature.

**Nobody edits a file the other owns.** If a change seems to need one, say so
instead of making it.

### Codex owns — engine contracts and architecture

```
js/bb/week.js          the week orchestrator (acts, not days)
js/bb/strategy.js      nominations, veto decisions, campaigning, comp throwing
js/bb/shared-strategy.js  house context, normalized week evidence, shared-state
                         writes, and BB threat/heat composition
js/bb/house-events.js  the event SCHEDULER + state API (not the events
                       themselves — see "Who writes the events" below)
js/bb/comps.js         competition CONTRACT + scheduler + result validation
                       (not the competition library)
js/bb/bb-twists.js     twist/mode CATALOG + generic hook plumbing + placeholders
                       (not individual twist implementations, except the
                       existing Double Eviction proof of concept)
js/bb/bb-vp.js         the week as acts in the visual player
tests/bb-*.test.js     engine tests (this glob is Codex's — integration
                       tests must NOT be named bb-*)
```

Codex's smaller usage budget is reserved for the work that prevents rewrites:
stable contracts, state ownership, hook signatures, validation, invariants,
placeholders, and architectural audits. Codex does not spend that budget writing
large libraries of competitions or implementing every catalogued twist.

### Claude owns — integration (all existing files)

```
js/core.js             season format tag, format field on TWIST_CATALOG
tests/season-format.test.js  format helpers + the export adapter
js/main.js             module registration
worker/*.sql           seasons.format, bb_appearances
worker/worker-studio.js  sync + publish for Big Brother seasons
js/stats-export.js     exporting a Big Brother season
js/bb-events/*.js      the event LIBRARY — social, deals, house life,
                       ceremonies (a sibling directory, so no file in
                       js/bb/ is ever touched by both agents)
js/bb-comps/*.js       the competition LIBRARY — HOH, veto, arena,
                       tiebreaker and special-mode competitions
js/bb-twists/*.js      individual twist/mode IMPLEMENTATIONS — one module per
                       mechanic or tightly related family
player.html, devotees.html, leaderboards.html, seasons.html   grouped views
current-season.html    format-aware beat sheet
MANUAL.md
```

These are the files with the traps — name-derived avatar paths, storage-key
mismatches, the publish pipeline, the D1 sync. They should be changed by the
agent that has been in them.

Claude also owns the volume-heavy research and implementation work: expanding
the 80–120 event library, researching recurring Big Brother competitions,
writing competition narration/variants, and implementing catalogued twists.
Claude's tests for these libraries use names such as
`tests/competition-big-brother-*.test.js` and
`tests/twist-big-brother-*.test.js`; the `tests/bb-*.test.js` glob remains
Codex-owned contract/invariant coverage.

### Off limits to both

`js/episode.js`. Total Drama's rules stay untouched; that is the whole point of
the two-engine split. If Big Brother appears to need a change there, it is a
design problem, not an implementation one.

## Who writes the events

Dropping days changed this number a lot, and for the better. A season is 10-13
weeks of roughly six acts, with social beats between them: on the order of
**50-70 social beats per season**, not the 70-90 days an earlier draft implied.
A library of **80-120 events** covers that with the variety this project
expects, against the 200+ the day model demanded.

That is still an entire Total Drama challenge pack's worth of writing, and still
more than one file should hold or one agent should write alone - but it is a
season's worth of work rather than two.

So events split from the machinery that fires them:

**Codex owns the scheduler.** `js/bb/house-events.js` decides which slots exist
on a given act, how many fire, and who is eligible; it also exposes the state
API events are allowed to call. Codex additionally owns the contract and
scheduler in `js/bb/comps.js`, because competition results feed directly into
week outcomes; Claude owns the competition implementations registered through
that contract.

**Claude owns the library.** `js/bb-events/` holds the events themselves, split
by category so the files stay small and neither agent ever opens the other's:

```
js/bb-events/social.js      showmances, fights, friendships, paranoia, trust
js/bb-events/deals.js       pitches, final-two deals, vote flips, jury management
js/bb-events/house-life.js  have-nots, slop, chores, pranks, sleep, diary room
js/bb-events/ceremonies.js  nomination, veto and eviction speeches
```

A sibling directory rather than `js/bb/events/` purely so the ownership rule
stays mechanical: no file under `js/bb/` is ever touched by both agents.

### The event contract - agree before writing 200 of anything

This is the real risk. Two hundred events written against a shape the scheduler
does not accept is two hundred events thrown away. Every event is a plain
object:

```js
{
  id: 'showmance-first-flirt',
  category: 'social',
  // 0 means ineligible. Proportional, never a threshold - the house rule
  // about stats applies here exactly as it does in Total Drama.
  weight(house, ctx) { return number },
  // Returns a beat. Mutating house state happens ONLY through `api`, so the
  // engine keeps ownership of its own state.
  fire(house, ctx, api) {
    return { text, players: [], badgeText, badgeClass };
  }
}
```

`ctx` carries the act: `{ act, beat, hoh, nominees, vetoWinner, week }`.

`api` is Codex's to define and is the only way an event changes anything:
`addBond`, `popDelta`, `showmance`, `suspicion`, `setTarget`, `remember`.

Two rules carry over from Total Drama unchanged, and are not negotiable:

- **Every event has a consequence.** No purely cosmetic beats. If one houseguest
  does something to another, it moves a bond, a target, or a reputation.
- **`players: []` and a badge are required** on every event, so the visual
  player and the text backlog can both render it.

Sequencing: the contract and one vertical slice first - a single category, ten
events, running end to end through the scheduler - before either agent writes at
volume. Ten events that work are worth more than two hundred that were guessed.

## Who writes competitions and twists

The same scheduler/library split used for house events applies here.

**Codex defines the contracts and placeholders:**

- `js/bb/comps.js` defines how a competition is registered, weighted, run and
  returned to the week engine. It validates participants, placements, winner,
  thrown attempts, stat profile and event consequences.
- `js/bb/bb-twists.js` keeps the serializable catalog, distinguishes scheduled
  twists from season modes, and defines the hook/state capabilities each
  implementation may use.
- Codex supplies contract fixtures, invariant tests, and architectural review.

**Claude implements the libraries:**

- `js/bb-comps/` contains researched competition families and their narration.
  Big Brother Wiki is the broad index; consequential rules and timing should be
  cross-checked against CBS episode guides when possible.
- `js/bb-twists/` contains actual twist and season-mode mechanics. The catalog
  entry remains a placeholder until its module and tests exist.
- Claude handles the large mechanical volume: individual variants, balance,
  text, and simulator-facing integration.

Neither agent edits the other's directory. A Claude implementation registers
against or is passed into the Codex-owned contract; it does not add special-case
logic directly to `week.js`. One competition family and one unimplemented twist
must pass end to end before either library expands at volume.

### Committing and pushing

File ownership says who may *edit* a file. It said nothing about who *commits*
one, and that gap broke the repository once already: the engine lived only in a
working tree while a committed integration test imported it, so a fresh clone
failed at import. The site was unaffected — nothing loads `js/bb` yet — but the
test suite was broken for anyone without that tree.

Rules, in order of how much trouble they save:

1. **If you create a file, commit it.** Never leave a new file uncommitted once
   anything committed imports it. Ownership is about editing, not about who
   presses commit.
2. **And never commit code that imports an uncommitted file.** This is the same
   rule from the other side, and it is the half that keeps getting missed — it
   broke `main` twice in one day, both times by committing a test against a file
   the other agent had written but not yet committed. Before pressing commit,
   check what the other agent has in flight; if your work imports any of it,
   commit it together or wait.
3. **Both agents push to `main`.** Branch only if Big Brother starts changing
   shared files — the site pages, `episode.js` — which the design says it must
   not. A long-lived branch would drift badly here, because the Casting Studio
   commits to `main` from the live site continuously.
4. **`git pull --rebase` before every push.** Those Studio commits land between
   your commit and your push more often than you would think.
5. **Stage your own paths explicitly.** `git add js/bb/...`, never `git add -A`,
   or you will sweep up the other agent's half-finished work.
6. **Never amend or force-push shared history.** Two agents and a live site pull
   from it.

A quick way to catch violations 1 and 2: clone `HEAD` into a temp directory and
run the suite there. If it fails, something is only in a working tree. This
takes about ninety seconds and has caught the problem every time it has
happened, which is more than reading the diff has managed.

### The contract between them

Agree this **before either starts**, because it is the only real coupling:

1. **Entry point — SETTLED 2026-07-30.** The engine does **not** take an `ep`.
   It is called as `simulateBBWeek(options) -> week` and integration reads the
   returned object. Chosen over an `ep`-shaped signature so the engine stays
   headless and testable; the adapting happens on the integration side, which is
   where the `ep` conventions live anyway.

   ```js
   simulateBBWeek({ rng?, hooks?, house? }) -> week
   simulateBBSeason({ rng?, hooks?, finaleSize? }) -> { weeks, finalists }
   ```

   The `week` object is the integration surface:

   | Field | Meaning |
   |---|---|
   | `num`, `format` | week number, always `'big-brother'` |
   | `houseAtStart` | who was in the house when the week opened |
   | `hoh` | Head of Household |
   | `plan` | `{ target, pawn, backdoorTarget, rankings }` — the HOH's intent |
   | `initialNominees` / `finalNominees` | before and after the veto ceremony |
   | `vetoWinner` | who won the veto |
   | `preCampaignVotes` / `votes` | the tally before and after the campaign act |
   | `ballots` | per voter: `{ voter, evict, margin, changed, changedBy }` |
   | `voteChanges` | how many votes the campaign moved |
   | `tieBreak` | `{ voter, evict }` when the HOH broke a tie, else null |
   | `evicted` | who left |
   | `acts[]` | the week's acts, each `{ type, … }` — no day numbers, and a variable number of `campaign` entries |

   It also mutates shared state: `gs.activePlayers`, `gs.eliminated`,
   `gs.episode`, and `gs.bb` (`outgoingHoh`, `weeks[]`, `stats{}`).
2. **What the engine may import** from the shared world: `core.js` state;
   `bonds.js`, `relationships.js`, `relationship-events.js`, `players.js`,
   `romance.js`, `strategy-memory.js`, `knowledge.js`, `intentions.js`,
   `reputation.js`, `social-status.js`, `alliances.js` and `voting.js` through
   the direct/adapter boundary in the shared-system audit; and the VP kit for
   presentation. Permission to import a module is not permission to call its
   Total Drama-only orchestrators. It must not import from `episode.js`.
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
