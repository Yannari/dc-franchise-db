# All Stars — a Drag Race mode

**Date:** 2026-09-08 · **revised** 2026-09-17
**Status:** design approved. Revised after reading the wikitext of all ten
All Stars seasons (§2), which changed three things: the era table is now
sourced rather than remembered, the spared bottom queen's chart record is
settled (§4), and the era-B extras are specified as mode-locked twists (§7.5).
Pass 1 is the spine; the extras are pass 2.
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

This split is load-bearing. "All Stars" names five different games. Read off
the season pages' own result legends on 2026-09-17, not remembered:

| era | seasons | rule |
|---|---|---|
| **A** teams | AS1 | queens compete in **pairs**; the pair is judged, lip syncs, and **both** go home together. Ran once, never repeated. |
| **B** legacy | AS2–AS4 | the **top two** lip sync for their legacy; the winner takes $10,000 **and the power to eliminate one of the bottom queens**, revealed on a lipstick. Extras by season: AS2's Revenge of the Queens (the eliminated cast returns, one wins her way back), AS3's Jury of Queer Peers (the eliminated queens pick the finalists), AS4's double win ($5k each, both hold the power) and **two queens crowned**. |
| **C** assassin | AS5, AS6, AS8 | the Top All Star lip syncs an **outside assassin** who never competes. She wins → she alone eliminates and takes the $10k; she loses → the tip **rolls over** and the remaining queens **vote** by majority, a tie handing the decision back to her. AS8 added the **Fame Games**: the eliminated queens keep competing for a separate prize decided by a fan vote. |
| **D** stars | AS7, AS9 | **no eliminations at all**. The top two lip sync for a star/badge — a point — and the winner also **gives** one to a queen who was not in the top (AS7 let her **block** instead; AS9 gave immunity from being "cut off"). Points decide the finalists, then a Lip Sync for the Crown bracket, 4 → 2 → 1. The non-finalists ran their own tournament for $50,000. |
| **E** tournament | AS10, AS11 | eighteen queens in **three groups of six**, each running its own three-episode bracket. Points: 3 for winning the legacy song, 2.5 for a tie, 2 for losing it, plus **MVQ points handed out by the bottom four**. At the end of a bracket the **lowest point total is cut with no lip sync at all**. Top three per group reach two semi-final episodes, then a three-round Smackdown for the Crown. Plus a **Wildcard**: a judge picks an eliminated queen to return. |

Constant across every era, and therefore part of the mode rather than any one
rule: a **talent/variety show premiere**, Snatch Game, each queen carrying an
**original season and original rank**, and $100,000 rising to $200,000 from AS7.

Era C's group vote is the one piece of All Stars that cannot be built as
specified — see §1's law. If era C is ever built, the vote must become something
else, and that is a decision for its own design, not a detail.

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

  **This rule has since been built**, as the Golden Beaver and the Golden
  Baguette (`js/dr/saves.js`, `seasonConfig.drSave`, documented in
  `docs/drag-race.md`): the holder, the three named in the bottom, the campaign
  in Untucked, `holderMind`'s strategy/merit/fair weights, the ceremony and the
  memory of debts, grudges and promises. Canada's All Stars ran the Beaver, so
  it belongs here as well as on a flagship season.

  So `save` is not a new build at all — it is **`drSave` made reachable from
  the All Stars dropdown**, and the two rules can also combine: on a bottom of
  three a Beaver save can take one queen out of danger, leaving the legacy
  winner a choice of two. The ordering rule already exists (`week.js` sorts
  `results` ahead of `untucked` on a holder night) and holds unchanged.

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

Revised 2026-09-17: the alumni are the *preferred* pool, not the only one. Any
roster queen can be cast and gets an invented past (§4.5), so the setup screen
should show which of the cast are real returnees and which are arriving with a
written history — an author choosing between them should be able to see it.

### The vocabulary consequence

**On `legacy` nobody in the bottom ever sings.** The queen who leaves does so
without performing at all, and the queens who survive did nothing to survive —
they were simply not picked. Every reader that infers "she lip synced" from a
bottom placement is wrong on this rule. This is the same bug class
`docs/drag-race.md` exists for, and it is where the defects will be.

#### What the spared queen's cell says — settled 2026-09-17

This paragraph previously read "`BTM` was named and saved before the song",
which was true of the docs when it was written and is not true of them now:
`docs/drag-race.md` has since **removed `BTM`** from the chart, on the season 16
wikitext (one bare `{{BTM}}` against eleven `{{LOW}}`, and no `BTM` line in the
legend at all). `GRID_RESULTS` can still *draw* one; nothing writes it.

The decision here is **not** to bring it back. The record is the **size of the
bottom she was named in**:

| bottom | record | means |
|---|---|---|
| two named, one goes | `BTM2` | named for elimination, not chosen |
| three named, one goes | `BTM3` | named for elimination, not chosen |

`BTM3` is new to `GRID_RESULTS` and scores as `BTM2` does. The real chart draws
these cells exactly this way, so the shape is the show's own.

**The risk, stated so it is not discovered later:** `BTM2` means two different
things in two different season shapes — "lip synced and survived" on a flagship
season, "named and spared" here. That is one token with two meanings, which is
precisely the collapse this show's docs warn has already shipped twice. It is
acceptable **only** because it cannot be ambiguous *within* a season: on
`legacy` no bottom queen ever sings, so there is no other reading available.
The mitigation is not a convention, it is code — **the cell's label and title
are derived from the season's shape**, so an All Stars chart's legend reads "the
bottom two — named for elimination, not chosen", and `js/dr/grid.js` takes the
shape as an input rather than assuming the flagship. A test asserts both
legends, because a static map is exactly how the two meanings would silently
merge again.

**`sent home by` is deliberately NOT a track-record field.** It matters to the
relationship layer, not the record. The chart shows the exit; the ledger and the
bonds carry who did it.

---

## 4.5 Slice 1b — the arrivals: a queen with a past

Added 2026-09-17. The premiere is the part of All Stars that is *least* like a
flagship season and the spec did not cover it: the first episode is about
reputation, not introduction. Nobody is meeting anybody.

A new pure module, `js/dr/past.js`, answers one question — **what did this queen
already do?** — and returns her original season, her original rank, her maxi
wins, how she went out, and one piece of unfinished business.

**Real when it exists, invented when it does not.** If she competed in a stored
`dr-N` season, the answer is read from it (`dragPlacements`, plus
`js/franchise-meta.js` for who she has history with). If she never has, the show
invents a past deterministically from her stats and the season seed, and
**writes it onto the season**, so it never drifts between replays, screens or
articles. Authored always wins over both.

This is what makes the mode usable at all today: there are 13 drag alumni and
they are all from `dr-1`, so a real-history-only rule would mean All Stars could
only ever re-run season one.

Then the premiere reads it:

- entrances reference the past instead of a first impression;
- the room's reaction scales with what she did before — a former winner walking
  in is not the queen who went home first;
- her prior record feeds the threat read the rest of the engine already uses,
  which is also what the legacy decision reaches for (§6).

### What invention does *not* fix

An invented past does not give her a drag craft block. §3's finding stands
unchanged: a roster queen nobody authored plays with **seven flat fives** on the
exact seven stats that decide the show, and thirteen of those is not a cast, it
is noise.

So craft is **derived** at cast time the same way — deterministic, stored on the
season, spread from her nine shared stats — and §3's guard changes from "must be
authored" to **"must not be flat"**, which catches both the unauthored queen and
a failed derivation. `drag.style` and `drag.voice` stay authored-only and are
never inferred, exactly as CLAUDE.md requires: a derived *number* is a
calibration, an invented *voice* is a character the franchise has never met.

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

**Revised 2026-09-17: this is built, for the save.** `runCampaign`
(`js/dr/saves.js:264`) already runs pitches, pushback and an answer, with a
reason weighted by *who is listening* — "no threat" lands on a strategist, "I
deserved it" on a fair-minded queen — plus a friend vouching, a villain
stirring, false hope that is remembered, and every move paying into bonds or
popularity. `holderMind` supplies the three weights and `settleMemory` the
debts, grudges and promises.

So the work is **not writing a campaign engine, it is unwelding the one that
exists**: `runCampaign` takes `saves` and asks it `timesSaved`, so the ledger
must come out into a neutral **power ledger** that both the save and the legacy
choice write to. Then "she saved me twice" and "she sent my best friend home"
live in one account, which is what §6's fallout paragraph needs and what makes
Revenge of the Queens mean anything (§7).

One thing genuinely changes: **the lobbying happens before anyone knows who
will hold the power.** On the save the holder is the maxi winner, already known.
On `legacy` the power belongs to whoever wins a song that has not happened yet,
so the pitches go to whoever the critiques favoured — and a queen who spent her
Untucked working the wrong person wasted it. `campaignTargets` takes the
likely top rather than the known holder; that is the one new input.

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

## 7. Pass 2 — the era-B extras, mode-locked

Revised 2026-09-17. These are **twists, booked per episode from the designer,
and offered only while All Stars mode is on** — they are era-B's own furniture,
not things that should appear on a flagship season. (The earlier draft of this
section proposed the jury as a twist "usable on ordinary seasons too"; that is
reversed. A jury of eliminated queens deciding a flagship finale is a different
show.)

### The gate is one line, in one place

`twistsForFormat` (`js/core.js:1626`) is the single chokepoint every consumer
already goes through — the Episode Format Designer (`js/run-ui.js:4020`) and
`dr-run.js`'s validation map (`js/dr-run.js:78`). A `requires: 'allStars'` field
on a catalog entry, filtered there against the season config, **hides it from
the designer and makes a stale booking drop out of a season whose mode was
turned off**, with no list retyped anywhere. Anything less than this chokepoint
is how this repo ends up with eight copies of one show list.

### The three

1. **Revenge of the Queens** (AS2 ep 5) — the eliminated cast returns and one
   wins her way back in. `dr-returnee` already handles the bigger room and the
   longer season; what is new is the night itself and that the returning queen
   **remembers who sent her home**, which the power ledger (§6) already records.
2. **Jury of Queer Peers** (AS3) — the eliminated queens' ballots decide the
   finalists instead of the host. This *is* a ballot, and it does not break §1's
   law: the law is that **the room** cannot vote anybody out. These queens are
   already out, they end nobody, and they choose only who competes for the
   crown. That distinction gets written into the code's comments, because a
   reader who finds a ballot in `js/dr/` will otherwise assume it is the bug.
3. **The double win** (AS4) — both of the top two win the legacy song, each
   takes $5,000, and **both hold the power**. Needs a bottom wide enough to
   spend two on, so it books against a bottom three or four and is incompatible
   with a bottom two. The **double crown** at the finale needs no build:
   `js/dr/season.js:953` already runs it (gated on two great final performances
   within 0.6) and `js/dr/grid.js:201` already draws co-winners — it needs
   reaching from the All Stars setup, which is the reunion's bug class exactly.

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

Resolved 2026-09-17:

- ~~Cast size given a 13-queen pool~~ — no longer the binding constraint. §4.5
  lets a queen with no drag history be cast with an invented past, so the pool
  is the roster and the real seasons are a bonus. Cast size stays the ordinary
  setup field; the real All Stars ran 8, 10, 12, 13 and 18.
- ~~Whether the deliberation screen is its own VP section~~ — its own, per §5:
  it has its own marker kind so its scenes file behind it, which is the
  `sceneSections` scar.
- The chart record for a spared bottom queen — settled in §4.

Still open:

- Whether a queen's **invented** past may include having *won* her original
  season. A former winner changes the room's reaction and the threat read
  sharply, and inventing one is a strong claim about a queen the franchise may
  later actually play. Leaning: invented pasts cap at runner-up, and only a
  real stored season can make a queen a former winner.
- The prize wording: $200,000 is era-correct from AS7 and this is era B, whose
  seasons paid $100,000. Probably an author-visible number rather than a
  constant.
