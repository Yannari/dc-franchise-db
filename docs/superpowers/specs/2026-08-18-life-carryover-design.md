# Life carryover: the season reads the life back

**Status:** built 2026-08-18
**Companion to:** `2026-08-18-life-layer-design.md` (the life layer itself)

## The gap

The life layer is one-directional. A season is exported, the off-season is
resolved, and characters acquire relationships, homes, children and feuds. Then
the next season starts and **the simulator knows none of it**. Alejandro and
Lindsay have been living together for two years; cast them both and the engine
introduces them as strangers with a bond of zero and waits to see whether a
spark forms.

That is also why the life layer's best idea is currently toothless. *Being cast
is the test* — one partner alone for three months on camera, shipped with
somebody else — is already in the resolver's rates (`castAlone`, `castTogether`,
`neitherCast`). But the strain is applied AFTER the season, to a relationship the
season itself never knew existed, so nothing in the episodes ever caused it.

There is a precedent for the fix and it should be followed rather than reinvented:
`buildFranchiseMeta()` already turns past seasons into `seededPairs` (old allies,
betrayals, blindsides, rivals, past showmances) which `initGameState()` folds
into the starting bonds. This is the same shape of problem with a different
source.

## What carries

Read from the **approved** life log only, at season start, for every cast member.
`stateOf(slug, log)` already returns `{ relationship: { stage, with } }`.

| Situation | What the season starts with |
|---|---|
| Couple, both cast | An **established showmance** in `gs.showmances` + a strong positive bond |
| Couple, one cast alone | No showmance. A `partnerAtHome` marker on the player, a first-episode camp event, and a standing pull on their behaviour |
| Exes, both cast | A **negative** bond seed, scaled by how it ended and how long ago |
| Married / children together, both cast | As "couple", stronger, and harder for the season to break |
| Anything else (job, home, feud, bereavement) | **Nothing mechanical.** Flavour only — see "What deliberately does not carry" |

### Numbers

Bond seeds, clamped by the existing `META_WEIGHTS.bondClamp` and applied through
the same asymmetric clamp `initGameState` already uses, so a seed can never pull
an out-of-range bond inward:

| Stage | Bond |
|---|---|
| dating | +2 |
| public | +3 |
| living-together | +4 |
| engaged | +5 |
| married | +6 |
| a child together | +1 on top |

| Ended as | Bond |
|---|---|
| quietly-ended | −1 |
| broke-up | −2.5 |
| separated / divorced | −4 |

Ex-seeds decay with distance: full weight if it ended in the last off-season,
×0.6 one further back, ×0.3 beyond that. A break-up from six years ago is a fact
about them, not a live wound.

### The showmance it creates

`phase: 'established'` rather than `'spark'`, `origin: 'arrived-together'`,
`episodesActive` seeded from how long they have been together, and `sparkEp: 0`
so nothing reads it as having formed this season. Carried couples are **exempt from the max 4 active showmances cap**, and count
toward it when the season decides whether to form a NEW one. The cap exists to
stop the engine inventing a soap; refusing to represent a couple who really are
together would be denying a fact rather than declining to invent one. The
consequence is real and intended: cast five existing couples and the season
forms no new showmances at all, because the house is already full of them.

Verified on the real franchise: a returning cast of eleven produced five carried
couples, all established, none invented.

This one is load-bearing for correctness, not just flavour: the whole romance
pipeline (jealousy, love triangles, breakups, `_checkShowmanceChalMoment`) keys
off `gs.showmances`, so a couple that is not in there is a couple the season
cannot dramatise, test or break.

### The partner at home

The case the design cares most about, and the one with no mechanism today.

- `p.partnerAtHome = { slug, name, stage }` on the cast member.
- A first-episode camp event: they tell somebody who they left behind.
- A standing effect while the season runs: they are **less** available to a new
  showmance (a real reduction, not a block — this is the test, and people fail
  it), and any spark that does form is flagged `overlapping: true`.
- If an overlapping spark reaches showmance, the season records it, and the next
  off-season resolves the obvious: the relationship at home ends. The engine
  already has the rate; this gives it a cause.

## What deliberately does not carry

Jobs, homes, degrees, pets, tattoos, bereavements. They are most of the log and
seeding a bond off "both bought a house" would be noise dressed as continuity.
They stay in the wiki and on Dramagram, where they are read rather than played.

**Feuds are the arguable one and the answer is no, for now.** `franchiseMeta`
already seeds rivalry from what happened in the GAME, which is a stronger and
better-evidenced source than a proposed off-season feud, and stacking both would
double-count the same grudge — a mistake this file has made before (see the
betrayal/blindside dedupe in `buildFranchiseMeta`). Revisit once the two sources
can be reconciled.

## Where the code goes

New leaf module **`js/life-cast.js`**:

```js
lifeSeeds(cast, log, seasons) -> {
  pairs:       [{ a, b, bondDelta, reason, kind }],   // same shape as seededPairs
  showmances:  [{ players:[a,b], stage, since }],
  soloPartners:[{ name, whom, whomName, stage }],
}
```

- Names, not slugs, on the way out — the sim is name-keyed throughout and the
  translation belongs at this boundary, once.
- Pure. It takes the log; it does not fetch. Testable without a browser.

Hooked in exactly two places, both beside the franchise-meta seeding that
already exists:

1. `initGameState()` in `js/savestate.js` — bonds, showmances, `partnerAtHome`.
2. `retrofitFranchiseMeta()` in `js/franchise-meta.js` — the same, for a season
   started before the log existed, under its existing "nothing simulated yet"
   guard.

The log is loaded once at boot into `window.__lifeLog` via the shared
`loadLifeLog()` in `js/life-hook.js` — endpoint first, static file second. If it
is missing, `lifeSeeds` returns empty and the season runs exactly as it does
today. A life layer must never be able to stop a season starting.

`seasonConfig.lifeCarryover`, default **on**, off for a franchise that wants a
clean slate.

## Both shows

`gs.showmances` is shared by Total Drama and Big Brother (`js/bb/blocs.js` reads
it for couple blocs), so one mechanism serves both. The **words** must not be:
the camp event and any narration take their vocabulary from the show registry
per the standing rule, since "arrived at camp together" over a house is the
recurring bug this project has a document about.

## How it will be judged

Not by whether it runs. By reading a played season:

- A cast couple must be visible in episode one, be dramatised during the season,
  and still be a couple at the finale unless something in the episodes broke them.
- A player cast without their partner must have that fact appear in the season,
  and must sometimes — not always, and not rarely — fail the test.
- Exes must read as exes: cold, and pointedly so, without a betrayal in the game
  to explain it.
- A franchise with no life log must produce a season byte-identical to today's.

## Open question for the author

**Should a season be able to CREATE a relationship that the life layer then
inherits without the finale?** Today a showmance only becomes a life
relationship if it survives to the export and shows up in `seasonDetails`. A
showmance that forms in episode 3 and breaks in episode 9 leaves no trace in the
life log at all. That is probably right — it happened on television and the
world moved on — but it is worth deciding rather than defaulting.
