# All Stars — a Drag Race mode

**Date:** 2026-09-08
**Status:** design approved, no implementation plan yet
**Roadmap:** supersedes item 7 of `docs/drag-race.md` ("All Stars season type"),
which correctly called it "a format, not a twist" and "really items 4–6 plus a
different elimination model; it should be a season SHAPE like the premiere and
finale options, not a per-episode pin."

---

## 1. What this is

On the flagship, the panel ranks and the host decides alone. **On All Stars a
queen holds the exit**, and that single change is what turns Drag Race into a
strategy game of the kind the rest of this franchise already plays: the queens
in the bottom fight not to be picked, they plead, they promise, they band
together, and they remember what happened to them last season.

Under `legacy` she holds it outright — she names who goes. Under `save` she
holds one reprieve and the song decides the rest. Either way the authority has
left the panel, which is the thing all four eras have in common.

The panel still calls the top and the bottom. It no longer ends anybody.

### The law this must not break

CLAUDE.md's first rule for this show is that **there is no vote** — no ballot,
no numbers, no bloc that can deliver an outcome, and any sentence or reader
implying otherwise is a bug, because a model or a module carrying the Traitors
or Big Brother shape will supply a vote unasked.

**All Stars does not change that.** One queen decides, alone. The social layer
changes *what she wants*, never *who decides*. Every design decision below is
downstream of that sentence, and the alliance model was chosen specifically
because it cannot coordinate.

The three-step rule also holds unchanged: what she did, what the panel thought,
what somebody decided. The decision is computed before any prose exists, and the
ceremony renders it. **A ceremony that could change the target would be a second
source of truth for a night that already has one.**

---

## 2. A mode, not a format

Selecting All Stars turns on the returning cast, each queen's prior record
carried in and shown on screen, and the mode's vocabulary. **Which elimination
rule runs is a separate choice inside it.**

    drAllStars:     true | false        the mode
    drAllStarsRule: 'legacy' | 'save'   which rule, extensible

This split is load-bearing. "All Stars" names at least four different games:

| era | rule |
|---|---|
| AS2–AS4 | top two lip sync for their legacy; the winner eliminates via lipstick |
| AS5–AS6 | the challenge winner lip syncs an outside assassin; win and she eliminates |
| AS7 / AS9 | no eliminations at all; queens bank stars and the top scorers reach the finale |
| AS10–AS11 | bracket tournament, groups of six, points, merge to semi-finals |

Folding the rule into the mode flag would mean rebuilding the shape to get any
of the others. **`legacy` is the rule built in this pass.** `save` is specified
below as the seam's second member so the seam is designed against two real cases
rather than one, but it is not built here; the seam exists so the remaining eras
are additions rather than rewrites. It is the same shape the Secret Story design
landed on: a mode, not a theme.

Precedent for the shape itself is `drPremiere` / `drFinale` — defaulted in
`js/core.js:1700`, set from a dropdown in `js/cast-ui.js`, read once in
`js/dr/season.js:779`.

### The two rules

- **`legacy`** — the top two lip sync; the winner eliminates one of the bottom
  queens. Runs **from episode 1**. Already resolved by the engine
  (`js/dr/week.js:425`), and the per-episode `dr-legacy` twist
  (`js/core.js:975`) remains bookable on ordinary seasons.
- **`save`** — the top queen **saves** one of the bottom three; the remaining
  two lip sync for their lives. A different authority (mercy, not a scalp), and
  it reuses the ordinary lip sync wholesale rather than replacing it. That it
  slots in without touching the mode is the proof the seam is shaped right.

### The endgame is already correct

`js/dr/week.js:425` reads `cfg.legacy && bend.length >= 4`. Widened to *pin or
mode*, the existing guard does something useful for free: once the room is too
small to hold both a top two and a bottom to eliminate from, the week falls back
to the ordinary bottom-two lip sync on its own. No new endgame branch.

---

## 3. Slice 0 — the `.drag` round trip (enabling)

**This slice blocks every other one and is not optional.**

### What was measured

- `franchise_roster.json` has **never** contained the string `"drag"` in its
  entire git history. 0 of 194 roster players carry a craft block.
- `serve.py:42` already lists `drag` in `ROSTER_FIELDS`, and the Casting Studio
  already authors the whole block — craft, `style`, `traits`, `voice`, `family`
  (`js/studio.js:115`). **The write path exists and has never carried anything.**
- `dragOf()` (`js/dr/queen.js:62`) normalises every missing craft stat through
  `toStat`, which returns **5** for anything absent (`js/dr/queen.js:33`).
  `getDragCraft()` (`js/cast-ui.js:166`) returns `undefined` unless a slider
  moved.
- Consequence: **a roster queen nobody authored plays a whole season with seven
  flat fives** — identical on the exact seven stats that decide the show. This
  is the state the 13 `dr-1` alumni are in.
- The *record* persists well. `players_database.json` carries per-appearance
  `dr: {wins, highs, lows, bottoms, lipsyncWins, congeniality}` plus
  `totalMaxiWins`, `totalLipsyncWins`, `totalBottoms`, `bestPlacement`. The
  résumé survives; the queen does not.

### The fix, in two halves

1. **Authoring** — already works. Needs use, not code.
2. **Write-back** — when a drag season publishes, record the craft each queen
   *actually played with*. This half does not exist and All Stars depends on it.

**Craft goes on the appearance, not only on the roster row.** Add it beside the
existing `dr: {...}` block in `seasonDetails[]`, written by
`exportDragRaceSeason` (`js/stats-export.js:2422`). An author may change a queen
between seasons; the appearance records what she was *that* season, and All
Stars casts from her most recent one.

`drag.style` and `drag.voice` stay authored. CLAUDE.md is explicit that they are
used only when a human set them and never inferred, because an inferred voice is
a character the rest of the franchise has never met. Write-back records what was
*played*; it does not invent what was never set.

### Known related hazard

`project_publish_wipes_authored_fields`: `franchise_roster.json` is regenerated
wholesale from D1 and has eaten researched authored fields twice. Any write-back
must survive a publish, and that is a test, not a hope.

### The guard that matters

**A returnee whose craft is the flat default block is a failed cast, not a valid
one.** Without this assertion All Stars silently ships thirteen identical queens
and every result becomes noise — the kind of defect this project's history says
a passing suite never catches.

---

## 4. Slice 1 — the mode and the shape

- `drAllStars` / `drAllStarsRule` in `js/core.js` defaults, a dropdown in
  `js/cast-ui.js`, read in `js/dr/season.js`.
- `js/dr/week.js:425` widened from pin-only to pin-or-mode.
- Casting draws `alumniPool({ format: 'drag-race' })` (`js/alumni.js:63`), with
  each queen's craft taken from her most recent appearance.

### Be honest about the pool

There are **13 drag alumni, all from `dr-1`**. The first All Stars is season one
returning nearly whole. That is what All Stars 1 actually was, so it is not
wrong — but the designer must **say what the pool is** and let the author swap
queens in the Studio, rather than silently shipping a rerun labelled All Stars.

### The vocabulary consequence

CLAUDE.md already distinguishes the two bottom calls: `BTM2` lip synced and
survived, `BTM` was named and saved before the song. **On `legacy`, `BTM2` can
never happen** — nobody in the bottom ever sings, and the queen who leaves does
so without performing at all.

Every reader that infers "she lip synced" from a bottom placement is wrong on
this rule. This is the same bug class `docs/drag-race.md` exists for, and it is
where the defects will be.

**`sent home by` is deliberately NOT a track-record field.** It matters to the
relationship layer, not the record. The chart shows the exit; the ledger and the
bonds carry who did it.

---

## 5. Slice 2 — the lipstick ceremony

The decision is made in a new pure `js/dr/legacy.js` before any prose exists,
returning **the target and the reason she picked her**. Extracted rather than
widened in place: `js/dr/week.js:718` holds it inline today and it is about to
grow four inputs. The reason must explain a *move*, not a feeling — the shape
`rate.js` already landed on.

### The night, in order

1. **Untucked** — the campaign floor (§6).
2. **The deliberation screen** — the winner alone with the lipsticks.
3. **The reveal** — she walks out, names her, the room answers.
4. **Her last words** — the eliminated queen never performed, so `sashay-words`
   does not fit her; she needs her own pool.

### The reader learns with the queen

Nothing on the sidebar, the chart or the results may know the target before the
reveal step. `legacy.js` computes it early, so this is purely a VP gating job —
`tests/dr-vp-spoilers.test.js` already polices the class.

### Two mechanical constraints, both from existing scars

- **A scene must be pushed after its own marker.** `sceneSections` files a scene
  by array position; getting this wrong left "Elimination Day" empty on eight
  episodes of nine. The ceremony gets its own marker kind and everything lands
  behind it.
- **Pools go in a new `js/dr/data/legacy-beats.js`**, not into `stage-beats.js`,
  which is already ~1100 lines with a guard suite walking all of it. A
  mode-specific ritual should be separable.

### The screen

A lipstick wall — tubes standing with the bottom queens' names, the chosen one
turning to reveal. Built out of what the ceremony physically *is*, not another
card stack with a new accent colour.

### Already committed

The `legacy` prose tiers scaffolded in `d84a21b9` (`lipsync-intro/legacy`,
`lipsync-win-name/legacy`, `lipsync-win-runnerup/legacy`,
`lipsync-legacy-choice/choice`, `lipsync-call/legacy`) become load-bearing here.
`js/dr/week.js:726` currently emits the choice through `say()`, which writes
`text: ''`, and nothing in `js/` renders that kind — so today a legacy
elimination is narrated by nothing at all.

---

## 6. Slice 3 — the social layer

### Untucked is the campaign floor

`runUntucked` already exists — four phases, scaled to the room. On All Stars it
finally has stakes, because the bottom queens are pleading to somebody who will
actually decide. New mode-gated event families: pleading, promising,
alliance-making, throwing another queen under the bus, calling in a debt from a
past season.

### Alliances: extract, do not copy, and take the right donor

Two systems exist and they are **not** interchangeable.

- `js/alliances.js` (Total Drama) is **vote-shaped** — it forms alliances to
  deliver numbers at tribal, computes heat, handles betrayals at a ballot.
  **Wrong donor.** Reusing it drags vote machinery onto a show whose first law
  is that there is no vote.
- `js/tr/alliances.js` (Traitors) is the right one and nearly a drop-in: blocs
  derived fresh from the bond graph each episode (no persistent state to
  serialise or repair); deterministic, with a hashed tie-break rather than the
  game rng, so replays hold; capped blocs with free agents simply absent; and
  critically **blocs bias individual decisions and do not coordinate** — the
  exact drag constraint, arrived at independently for the castle.

**Extract the bloc-former into a shared module** taking
`(living, getBond, affinityOf)`; both the castle and the drag mode call it. Do
not copy it: `tests/helpers/show-vocabulary.js` records that two copies of one
rule has bitten this repo at least four times, and the failure is always the
same — one copy is extended, the other silently stops guarding.

The extraction must be **behaviour-preserving**, with the existing Traitors
suite as the guard; that module is shipped and merged.

`allianceVoteBias` (`js/tr/alliances.js:194`) gets a vote-neutral sibling for the
drag call site: *she is in my bloc, so I do not reach for her lipstick.*

### Season memory is a new wire

`js/franchise-meta.js` already models returnee reputation, betrayals and
grudges — and **`js/dr/` reads none of it**; zero references in the directory.
All Stars is the first drag feature to open that file. "She sent me home last
season" becomes a real input.

### The read

`legacy.js` takes four inputs — **threat**, **bloc membership**, **franchise
grudge**, and **where the room ranked her** — gated by archetype, so a hero takes
the polite answer and a villain takes the scalp. The franchise archetype rules
apply unchanged: nice archetypes never scheme, neutrals need
`strategic >= 6 && loyalty <= 4`.

### The fallout

The lipstick is public. The choice pays back into bonds and into the franchise
ledger, and next week's campaigning knows what she did. **The choice becomes a
running account rather than a per-week roll** — which is the entire reason to
build the read at all.

---

## 7. Slice 4 — the jury twist (independent)

The eliminated queens return to decide the finale rather than the host (AS3's
rule). Built as a **bookable twist in `TWIST_CATALOG`, usable on ordinary
seasons too**, not baked into the mode.

Non-elimination weeks need no work: `dr-no-elimination` already exists and is
already bookable.

---

## 8. Out of scope

- The assassin, stars and bracket eras. The seam exists for them; they are not
  built here.
- `save` itself. Specified in §2 so the seam is designed against two cases, and
  built immediately after `legacy` rather than alongside it.
- Campaigning that can *move* the winner's decision mid-ceremony. The pleading
  happens in Untucked and feeds the read; there is no persuasion check between
  the song and the reveal.
- Any ballot, anywhere, for any reason.

---

## 9. How we will know it works

Per this project's history, every real defect on this show came from
`npm run audit:dr-spec` or from printing output and reading it — **not one came
from a passing suite going red.** So:

1. **Play All Stars seasons and read the transcripts.** The first questions to
   ask of the output: does any sentence imply a vote? Does any reader claim a
   bottom queen lip synced? Is the winner ever named before the reveal?
2. **`npm run audit:dr-spec`** extended with All Stars measurements —
   distribution of who gets picked, how often the bloc protects, how often a
   grudge decides, and whether one queen dominates the choice the way the top
   queen already dominates maxi wins (~50% vs the real show's ~30%, documented
   and hot).
3. **The flat-craft guard** from §3.
4. **The Traitors suite green** across the alliance extraction.

---

## 10. Open questions

- Cast size for an All Stars season, given a 13-queen pool.
- Whether the deliberation screen is its own VP section or a phase of the
  existing lip sync screen.
