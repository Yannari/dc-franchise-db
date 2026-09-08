# Drag Race

The franchise's fourth show. Slug `drag-race`, prefix `dr`, seasons at
`data/seasons/dr-N-data.json`. Everything about its identity — its name, its
vocabulary, its round shape — comes from `js/shows.js` and nowhere else.

Read `docs/ADDING-A-SHOW.md` before touching anything that generates a
sentence about a season. The plans in `docs/superpowers/plans/2026-09-06-
drag-race-plan-*.md` hold the detail; this is the map.

## The format

A cast of queens, one werk room, no tribes and no house. Each episode:

1. a **mini challenge** — small, fast, usually buys an advantage
2. a **maxi challenge** — the main event, one of nineteen types
3. a **runway** category on the main stage
4. **critiques** from the panel, then **Untucked** while they deliberate
5. the **call** — win, high, safe, low, and the bottom
6. a **lip sync** between the bottom two; one stays, one sashays away

**There is no vote.** Not a ballot, not a jury, not an alliance that can
deliver numbers. The panel ranks and the host decides alone. This is the
single most important fact about the show and the one a writer or a reader
carrying the other two formats will get wrong — the AI prompt, the beat sheet
and the ratings reader each say it out loud for that reason.

### The two bottom calls are different nights

| record | what happened |
|---|---|
| `BTM2` | She lip synced and survived. |
| `BTM` | She was named in the bottom and saved **before** the song. |
| `LOW` | Safe, but critiqued. |

Verified against season 16's wikitext, where `{{BTM|tomato|2}}` appears ten
times and a plain `{{BTM}}` once. Collapsing them writes a lip sync that never
happened — which has already been shipped twice here and caught twice.

### The finale

Its own night and its own eight screens, taken from five seasons of wikitext
rather than assumed, because the eras differ mechanically:

- **S9** — a lip sync *bracket*: two semis then a final; the semi losers share
  3rd/4th. Nobody is cut before the songs.
- **S16 / S17** — a "Grande Finale Eleganza" runway, then each finalist
  performs an **individual original number**, then the host **cuts** the field
  to two, then those two lip sync for the crown.

So the showcase runs on every format and only `perform-then-lipsync` scores by
it. A screen that implied otherwise would claim a mechanic the season did not
run. The order is: the eliminated cast returns → the runway → one-on-one
interviews → the showcase → the cut → the crown lip sync → Miss Congeniality →
the runner-up → the crowning → "now prance, my queens".

The crown reads three things — the lip sync (largest), tonight's showcase, and
the season's record — weighted and never decisive. Weekly lip syncs read none
of it on purpose: the panel has already spoken.

### The reunion

Optional (`drReunion`), between the last elimination and the crowning, which is
where the real track record chart puts its Reunion column. It eliminates
nobody, and it is the only episode that reads the **whole season** rather than
the row in front of it. Every topic is derived — the worst pair who actually
shared scenes, the best record to go home early, the queen who was safe half
the season. A quiet season gets a short reunion, and that is correct.

## The three-step engine

Every night runs in three steps, and the separation is the point:

1. **What she did** — `js/dr/perform.js`, `js/dr/lipsync.js`. Craft, role,
   nerves, noise. Reaches for no judge and no storyline.
2. **What the panel thought** — `js/dr/judging.js`. Each judge has a taste and
   a memory; `panelRanking` merges their views.
3. **What the host decided** — `hostBend` in the same file. He may move a queen
   at most two places, and never past the bounds (the panel's bottom two
   cannot win; its first cannot end up in the bottom two).

**An engine change that lets the text layer decide a result is a bug.** The
prose renders what already happened; a second opinion living in the narration
is how a screen ends up crowning somebody the chart does not.

## The queen model

Nine shared stats (`physical` … `temperament`, exactly as everywhere else in
the franchise) plus seven **drag craft** stats on `player.drag`:

`acting`, `comedy`, `dance`, `design`, `runway`, `lipsync`, `singing`

Do not invent more. A challenge asks for a *blend* of these; `blendScore`
answers it. `player.drag.style` is an authored drag style and
`player.drag.voice` is an authored voice for the AI writer — both are used only
when a human set them, never inferred, because an inferred voice is a character
the rest of the franchise has never met.

Romance uses `js/attraction.js`, the franchise's own compatibility rule, so
this show never pairs people the rest of the franchise would not. It is capped
at two pairs a season on purpose: the show is about the work.

## Where things live

| area | files |
|---|---|
| season loop | `js/dr/season.js`, `js/dr/week.js`, `js/dr-run.js` |
| the three steps | `js/dr/perform.js`, `js/dr/judging.js`, `js/dr/lipsync.js` |
| werk room | `js/dr/werk.js`, `js/dr/prep.js`, `js/dr/data/werk-events.js` |
| challenges | `js/dr/maxi.js`, `js/dr/assign.js`, `js/dr/chal/*.js` |
| stage & prose | `js/dr/stage.js`, `js/dr/data/*-beats.js` |
| finale & reunion | `js/dr/finale.js`, `js/dr/reunion.js` |
| export & ledger | `js/dr/export.js`, `js/dr/grid.js`, `js/stats-export.js` |
| viewing party | `js/vp-dr/*.js` (26 screens; `screens.js` is the registry) |
| AI writer | `js/dr/writer.js`, `worker/worker-episode-live.js` |
| aftermath | `js/dr/aftermath.js`, `js/edit-layer.js` |

## Adding a maxi challenge type

1. Add the entry to `js/dr/data/challenges.js` — `id`, `name`, `format`,
   `blend`, and a `desc` that says what the queens physically **do**. The desc
   is the only place anybody is told the rules; the narration says what
   happened, not what the rules were.
2. Create `js/dr/chal/<id>.js` exporting `assign`, `prepare`, `perform`. The
   generic module handles anything that needs no special mechanic.
3. Give it a panel in `detailFor()` in `js/vp-dr/challenge.js`. Nine of
   nineteen types had none and drew a portrait, a score bar and no words —
   found by the audit, not by a test.
4. Add prose to `js/dr/data/maxi-events.js` and, if it needs its own beats,
   `js/dr/data/challenge-beats.js`.
5. Run `npm run audit:dr-spec` and read measurement 5.

## Adding a judge

`js/dr/data/judges.js`: an `id`, a `name`, a `taste` (`challenge`, `runway`,
`risk`, `polish` weights) and an optional `styleBias`. Portraits live at
`assets/avatars/<id>.png` and are panel portraits, not player ones — they do
not belong in the player catalog, and `gen-avatar-manifest.mjs --check` listing
them as "unregistered" is expected.

## The measurements

`npm run audit:dr-spec` — a hundred seasons, ten measurements, every rate
printed beside its chance line. As of the last run:

| measurement | value | note |
|---|---|---|
| winner's maxi wins | 2.59 | was 1.03 before the finale read the record |
| winners with zero maxi wins | 23% | upsets stay reachable |
| best résumé wins the crown | 42% | chance 25% |
| top queen's share of maxi wins | 50% | **runs hot** — real show ~30% |
| BTM / BTM2 | 400 / 800 | both reachable |
| oversized finales | 0 | every double shantay repaid |
| claimed-but-empty screens | 0 | of 1,632 rendered |
| record-driven scenes per season | 10.7 | 17 events, none unreachable |
| seasons with a romance beat | 21% | 0 over the cap of two |
| Miss Congeniality awarded | 100% | never to the winner |

**The one open calibration** is domination. The top queen takes about half a
season's maxi challenges where the real show's most dominant winners take three
or four of twelve. It is structural rather than a stray constant: the same
queen tops the challenge 39% of weeks, the runway 43%, and star power 91% (a
season constant by design), and the host's lean then lifts her again. Widening
the runway's week-to-week variance to 4.5 moved it four points; weighting the
challenge performance at a twentieth moved it none. Closing it means reworking
what the panel weighs, which is a design decision.

## Twists

### Built

Four, in `TWIST_CATALOG` (js/core.js), booked from the Episode Format Designer.

| Twist | Booking | What it does |
|---|---|---|
| **No Elimination** | per episode | Announced before the challenge. Judged and ranked normally, the bottom two still lip sync, both walk back in. Season runs one episode **longer**. Not a double shantay. |
| **Double Elimination** | per episode | The panel calls three or four to the bottom, they lip sync together, the two weakest go. Season runs one episode **shorter**. Cancels out against a No Elimination. |
| **LaLaPaRUza Smackdown** | season-wide | The whole eliminated cast returns one episode before the finale and lip syncs each other out in rounds. Changes no placement. |
| **Returning Queen** | per episode | One eliminated queen re-enters with her record intact. Pick her or leave it random. Season runs one episode **longer**. |

Season-level format options live on the setup screen, not in the twist list:
premiere shape (standard / talent show / design / runway / girl groups /
split / porkchop), finale shape (top 4 / top 3 / top 2 / perform-then-lip-sync),
double shantay, double sashay, early-win immunity, triple lip sync on a tie.

### TODO

Ordered by what the engine can already carry. Nothing below exists — checked
for `badge`, `power`, `advantage`, `assassin`, `legacy`, `block`, `wildcard`,
`golden` and `chocolate` in `js/dr/` first, because this repo has shipped the
same feature twice by not looking.

**Cheap — a flag and a rule, no new screen**

1. **Reunion toggle.** Not a new twist: the reunion is BUILT, tested
   (`tests/dr-reunion.test.js`) and documented above, and `config.drReunion` is
   read by `playDragSeason` — but nothing in `cast-ui.js` or `simulator.html`
   ever sets it. It is reachable only from a test. Written-but-unreachable,
   this project's signature bug class. One checkbox.
2. **Wildcard entry.** A queen who never competed walks in mid-season. The
   Returning Queen engine already handles a bigger room and a longer season;
   this differs only in where she comes from (the franchise roster, not
   `state.out`) and in having no record to keep.
3. **Immunity charm.** A maxi win buys immunity for a chosen later week rather
   than automatically the next one. `drImmunity` already models the seasons
   1–5 rule; this is the same field with a player-held trigger.

**Medium — needs a decision the engine does not currently make**

4. **Rate-a-Queen.** The queens rank each other and it feeds the call. The
   engine has bonds, perceived threat and a jury-style read already; the new
   part is letting a queen's ranking be strategic rather than honest.
5. **The Block.** A queen blocks another from something she won. Needs a
   holder, a target and a window — the shape of a Big Brother power, which
   `js/bb/` has and `js/dr/` does not.
6. **Lip Sync for Your Legacy.** The All Stars inversion: the top two lip sync
   and the WINNER eliminates. Changes who decides, which is the deepest
   assumption in `js/dr/judging.js` — the panel ranks and the host decides,
   stated in every prose brief in the repo. Worth doing, worth doing carefully.

**Expensive — a format, not a twist**

7. **All Stars season type.** Badges, the winner-decides rule, no lip sync for
   survival. Really items 4–6 plus a different elimination model; it should be
   a season SHAPE like the premiere and finale options, not a per-episode pin.
8. **Audience save / fan vote.** The edit layer already tracks popularity and
   screen time, so the input exists. The question is whether a viewer vote can
   overturn the panel, which is the same authority question as item 6.
9. **Two winners.** The finale can already run four shapes; a double crown
   changes what `placements[0]` means for the chart, the article, the
   franchise ledger and every reader of `finale.winner`.

**Known constraint on any new per-episode twist**

The tentpole schedule has only episodes 2..N-2 to work with, and at a cast of
ten or fewer it cannot already fit the six tentpoles it has. A twist that
consumes an episode slot makes that worse. See the note in `buildSchedule`.

## Known gaps

- The Ball supports three categories per theme (twelve themes, so it does not
  repeat, but a four-category ball is not expressible).
- `minNative: 0` on `alumniPool` returns an empty pool rather than topping up —
  the guard is `native.length >= minNative`, so zero means "no natives is
  already enough". Real callers pass six.
- The live tab has never been played end to end in a browser; everything
  measured here is headless.
