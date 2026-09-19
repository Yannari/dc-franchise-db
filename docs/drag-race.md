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

### The chart's six results

| record | what happened |
|---|---|
| `WIN` | She won the maxi challenge. |
| `HIGH` | In the top, did not win. |
| `SAFE` | Neither top nor bottom. |
| `LOW` | **In the bottom, and not up for elimination.** |
| `BTM2` | In the bottom, lip synced, and survived. |
| `BTM3` | **All Stars only.** Named in a bottom of three, and not chosen. |
| `ELIM` | In the bottom, lip synced, and went home. |

`LOW` covers both the queen just above the bottom two and the queen named in a
bottom THREE and saved on the stage. The call still names three and saves one —
that is a real format and the engine still runs it — but the chart has one word
for her.

**There is no `BTM`.** This table used to carry one, on the reading that
"named in the bottom and saved" needed its own cell, and cited season 16's
wikitext as the verification. The counts were right and the conclusion was
wrong:

```
{{LOW}}            11
{{BTM|tomato|2}}   10     <- BTM2
{{BTM}}             1
```

One use in a whole season, against eleven LOWs, and the legend block lists no
BTM: its lightpink line is "The contestant was in the bottom, but was not up
for elimination". `GRID_RESULTS` still knows how to DRAW a `BTM` so a season
played while the engine emitted one still charts; nothing writes it.

Collapsing BTM2 into LOW writes a lip sync that never happened — which has
already been shipped twice here and caught twice.

**`BTM2` means two different weeks, and which one depends on the season's
shape.** On a flagship season she lip synced and survived it. On All Stars'
legacy rule NOBODY in the bottom sings — the winner of the top-two song picked
somebody else — so it means "named for elimination, and not chosen", and a
bottom of three records `BTM3`. That is one token carrying two meanings, which
is the exact collapse this section exists to prevent; it is tolerable only
because it cannot be ambiguous *within* a season. The mitigation is code, not
convention: `resultMeta(result, { shape })` in `js/dr/grid.js` derives the
cell's wording from the season, and `tests/dr-chart` asserts both legends.

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
| pinned stages | Every screen has one. The kit (frame, themes `stage`/`werk`/`lounge`/gold, banner, confetti, cut to camera) is `js/vp-dr/finale-stage.js`; `night-stage.js` (main stage, runway, critiques), `room-stage.js` (werk room, Untucked, prep/booth/rehearsal/set, every generic section, the sashay), `chal-stage.js` (mini, brief, draft, maxi), `call-stage.js` (the call), `lipsync-stage.js`, `save.js`, `js/vp-dr/finale-stage.js` (crown lip sync incl. bracket, showcase, interview, the cut), and the crowning's own stage in `js/vp-dr/crowning.js`: each builds one state per reveal step and applies it through `_drRevealExtra[suffix]`; always sticky, compact under 1000px tall (that media block goes LAST in the CSS) |
| confessionals | `js/dr/confessional.js`: staged surfaces are runway, lipsync, choice, maxi-pre and results (the call: WIN/HIGH land, the rest miss). A confessional's edit goes to `state.edit` and the caller's `popDelta`, never `state.popularity`, so the prose cannot steer arcs |
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

### The size of the call

The panel calls **six** queens most nights (76%), five or seven rarely (12% each), on any night with six or more in
the room, always a
win and at least one high, at most one LOW — and on a named bottom-three night no LOW at all, because the three named ARE the lows. Rooms of five or fewer keep what
they have. Double eliminations and bottom threes name their wider bottom
inside that count; a double win promotes a queen already called HIGH.
Guarded by `tests/dr-call-size.test.js`. On a Beaver or Baguette night the
named bottom is stamped LOW at the call; BTM2 lands after the save.

### The season's save (`js/dr/saves.js`)

One dropdown on the setup screen, `seasonConfig.drSave`, one save per season.
Checked against the fandom wikitext, not remembered.

| Save | Source (wiki chronology) | Who decides | When |
|---|---|---|---|
| **Golden Chocolate Bar** `chocolate` | US S14: bars arrive with the full cast (June Jambalaya, ep 3, first to open); found once (Bosco, ep 12) | luck | from the first night the WHOLE cast is in the room (a split season: the rejoin); a queen the lip sync sends home opens hers |
| **Badonka Dunk Tank** `tank` | US S17: introduced ep 1; dunks on eps 2 and 5; four misses in a row (eps 6-9); retired by a mini challenge on ep 10 with 8 left | luck | from ep 1. The row (how many levers, which are live) is fixed at the season's start and never rewired; every pulled lever is spent, hit or miss; the pick is uniform among the levers left; the tank is done once every live lever is found (`save:drained`), or at `drTankRetire` queens (8) if one is still hidden. `drTankLevers` (6) |
| **Golden Beaver** `beaver` | Canada S4-S6, CvtW S2 (used on ep 1); two winners = two saves (S6 ep 3) | the maxi winner(s) | every elimination week, never the semi-final; a bottom three, or a bottom four on a double win |
| **Golden Baguette** `baguette` | France S4 eps 2-6: last week's eliminated queen hands it over | the queen she hands it to | every week after an elimination, never the semi-final; no elimination last week = no baguette |

Settings: `drGoldenBars` (1-3 golden bars), `drTankLevers` (5-10),
`drTankLive` (1-3 live levers; always one pull per queen), `drTankRetire`.

**The night's order on a Beaver or Baguette week** (wiki: the bottom is known
before Untucked): critiques → **the call** (the named bottom three stamped
LOW; the call does not say who sings) → **Untucked with the campaign** →
**the save ceremony** → the lip sync. `week.js` sorts `results` ahead of
`untucked` on these nights and `dragScreens` moves the call screen with it.

**The campaign** (`runCampaign`, inside Untucked, stage on top of the lounge):
1. *Pitch*: each bottom queen makes her case with a reason from where she
   stands: friend, no threat, did better tonight, track record, cannot win
   the song, "give me the song", a deal, a debt called in. A reason's weight
   depends on the holder: "no threat" works on a strategist, "I deserved it"
   on a fair-minded queen.
2. *Pushback*: 2-3 exchanges hanging off the pitches: rebuttals, a counter
   pitch, an exposed deal, a shouting match, a throw under the bus, and the
   queen answered firing back (clap-back).
3. *Answer*: the holder stalls, gives false hope (remembered), snaps, or asks
   "why you?" (the better talker gains).
Plus a friend vouching, a safe villain stirring the pot (caught by a sharp
holder), and a holder torn between friends. Nice archetypes never make deals
or throw anyone under the bus. Every move moves bonds or popularity and a plea
weight the decision reads.

**How the holder weighs it** (`holderMind`): three pulls, and every queen has
all three: *strategy* (strategic, low loyalty), *merit* (boldness,
intuition) and *fair* (social, loyalty). The archetype tilts them (villains
×1.6 strategy, nice queens ×0.45 strategy and ×1.3 fair, challenge beasts
×1.3 merit) and never zeroes one, so a hero still wants to win. They sum to
one. `ballotSelfishness` (zero for nice queens) is still what the legacy
choice and Rate-a-Queen use; the save no longer does.

**Already saved** (`timesSaved`, from `saves.uses`): a queen never saved can
pitch "it's my turn" (`pitch-my-turn`); one who was saved before can be told
"you've had your turn" (`rebut-turn-over`), both more likely the more saves
she has had. She can answer with what she did since (`saved-delivered`, a
merit answer). The holder can reply "I'm not keeping score"
(`holder-no-score`, merit) or "everybody gets a turn" (`holder-fair`).
In the decision the history is a penalty scaled by *fair* and softened by
*merit* × her wins and highs since the save. It is a probability, never a
rule. Why labels: `spread` (her top pick lost it to her history; that queen
takes it personally), `merit-again`, `favorite` (her friend, saved by her
again: the two singers cool on her). Over 40 seeds the Beaver's repeat-save
rate went from 37.6% to 30.0%, and the Baguette's from 31.5% to 27.4%.

**The ceremony** (`save-hold`): the host invokes the power in the wiki's
words ("You've earned the power of the Golden Beaver" / "Heavy is the hand
who holds the Beaver. Who do you want to save from the chomping block?"),
the holder speaks to each of the three (friend / rival / threat / pleaded /
neutral), a wait, the name on a flip-in card, the host ("Well I'll be damned!
... You are out of the woods this week."), reactions (saved, hurt, bitter,
"you told me not to worry", stoic), confessionals (the holder's reason and
the sorest of the two), then the lip sync.

**Memory** on `state.saves`: `debts`, `grudges`, `promises` (void unless the
deal was taken; kept or broken the next time the promiser holds power;
broken = a cold-open fight next week via `fallout`) and `hopes` (false hope
costs bond). Wiki basis: Denim's "I'm gonna need to make a lot of new best
friends", Nearah Nuff's "It's time to kiss some ass", Melinda Verga's "Are
there going to be alliances?", Kiki Coe and Melinda Verga saving each other.

Rules that bite:
- **Still no vote.** Canada's All Stars 1 ran the beaver as a room vote; that
  version is deliberately not built.
- **A save is a marker, not a result.** A luck save leaves her `BTM2` (she lip
  synced and stayed); a holder save leaves her `LOW` (named in the bottom and
  not up for elimination). `row.dr.save.saved` carries who, and the chart draws
  the fandom's `#ffed00` border from it. Export: `placements[].saved`.
- **`lipsync.loser` is who lost the SONG.** `lipsync.saved` is who stayed
  anyway. Every reader that took `loser` to mean "went home" was fixed
  (results screen, writer brief, `_stateFromHistory`).
- A holder night freezes `callAtCall` with all three in the bottom — the
  call, the critiques and Untucked happen before the save.
- Its own dice (`saveRng`, one draw off the week's stream, only on a save
  season), so a season with no save replays exactly as before.
- Three screens (`js/vp-dr/save.js`) on three steps: `save-intro`,
  `save-hold` (between the call and the song), `save-luck` (between the song
  and the exit). A queen who tried her luck and missed says goodbye on the
  luck screen, after the bar.
- Measured over 30 seasons of 13: chocolate saves 0.8 a season, the tank
  0.77 at 6 levers / 1 live (drained before 8 queens 23 of 30), 1.03 at 10 / 2,
  3.0 at 6 / 3 (S17 had 2), two-beaver nights 6 in 30 seasons, the
  baguette's holder saves herself 42% (France: 2 of 5), first baguette ep 2.
- Lines: `js/dr/data/save-beats.js`.

### All Stars (`drAllStars`)

A season SHAPE, chosen on the setup screen beside the premiere and the finale,
with its own rule dropdown (`drAllStarsRule`) because "All Stars" names five
different games — the era table is in
`docs/superpowers/specs/2026-09-08-drag-race-all-stars-design.md`, read off all
ten seasons' wikitext.

| rule | what runs |
|---|---|
| `legacy` (AS2–AS4) | the **top two** lip sync; the winner eliminates one of the bottom queens, revealed on a lipstick |
| `save` (Canada) | the built Golden Beaver / Baguette, reachable from here — the rule DEALS one (the Beaver) if the author has not picked a save, or it would promise a save season and run none |

**The night**: mini → maxi → runway → critiques → **the call** → **Untucked**
→ the legacy lip sync → the ceremony → exit. The call comes BEFORE the lounge,
which is the format's own order and the reason All Stars' Untucked is what it
is: the bottom is working two queens who might be holding the lipstick in
twenty minutes. (It ran the other way round at first, with the room lobbying
whoever the critiques had favoured — a guess.) The same reorder the Beaver and
Baguette nights use, in `week.js` and `screensFor`.

**The call is six**: the top two, one queen in the top who is not one of them,
one queen in the bottom who is NOT up for elimination, and the two who are.
The lipstick chooses between exactly those two. It was five with no LOW at all
until 2026-09-18, because the top-two block emptied `low` and put the whole
bottom up for elimination.

| result | what it means here |
|---|---|
| `WIN` | won the maxi and the Lip Sync for Your Legacy |
| `TOP2` | the top two — sang for the power and lost it (PPE 4.5) |
| `HIGH` | in the top, not one of the two |
| `LOW` | in the bottom, not up for elimination |
| `BTM2` | up for elimination, not chosen |
| `ELIM` | up for elimination, and named on the lipstick |

**The cast arrives with a past** (`js/dr/past.js`). Her original season, rank,
wins and unfinished business: read from a stored `dr-N` season when she really
played one, invented deterministically and FROZEN onto the season when she has
not — there are thirteen drag alumni in the franchise and all are from `dr-1`,
so a real-history-only rule would mean All Stars could only re-run season one.
An invented past never crowns her; only a stored season makes a former winner.
Craft is derived the same way for a queen nobody authored, because `dragOf`
turns a missing craft stat into 5 and thirteen queens on seven flat fives is
not a cast. The exporter writes the craft she PLAYED with onto her appearance.

**The bottom is named.** The host tells those queens they are up for
elimination and they stand there while the top two sing — the surprise is
which of them, not whether. (This was not true at first: the call named nobody
on a legacy night, so the winner picked out of the whole room and a queen the
panel had called safe could go home recorded `SAFE`.)

**Who she sends home** (`chooseElimination`, `js/dr/legacy.js`): the three
pulls from `powerMind` weigh her résumé and wins, where the panel ranked her,
what she said in Untucked, and what these two already did to each other. Both
reads are **ranks within that bottom**, because the panel's ordinal against a
compressed threat score let the panel's last win 93% of the time whatever the
holder wanted. Measured over 40 seasons: the panel's last 76.5%, the biggest
threat 23.5%, which is about where the era sits. It returns its own REASON, so
the ceremony cannot narrate a decision the chart did not record.

**Still no vote.** One queen decides, alone. The campaign in Untucked reaches
her as a plea weight and nothing else is counted — and it happens BEFORE the
song, so the bottom works whoever the critiques favoured and a queen can spend
her whole night on the wrong person.

**The ledger** (`js/dr/power.js`) is shared with the season's save: one queen
sparing another and one queen ending another are the same fact about the same
relationship.

**The room already knows each other.** Queens out of the same past season
arrive as friends, rivals, or "she beat me in the song that ended my season"
(`sharedHistory`). It lands as real bonds through the caller's ledger, so every
bond-gated thing in the engine sees it, and a sent-home pair writes a grudge the
lipstick reads. The premiere has the meeting; one callback a week keeps it
alive after that (least-recently-used pair, draw-without-replacement lines).

**And it never invents over a real record.** A pair whose pasts are BOTH real
gets only what the franchise holds: the stored season document's own lip syncs
and All Stars exits (`js/dr/history.js`, fetched once by `loadDragHistory`),
the ledger's allies and rivals, and otherwise `mates` — the one thing still
true. The ledger cannot count a drag maxi win (it counts `immunityWinner` and
`vetoWinner`, which this show never stamps), so a season with no published
document carries `winsKnown: false` and the wins clause is dropped rather than
reported as zero. Inventing is for a queen the franchise has never played.

**Alliances** (`js/dr/alliances.js`) are derived from bonds every episode by
the shared bloc rule in `js/alliance-blocs.js` — the Traitors' own, extracted
rather than copied. Three to a circle, nothing serialised, and a bloc BIASES a
queen's decision without ever coordinating, which is what keeps it legal on a
show with no vote. Drawn in the rail ("Aligned") on the werk room, Untucked,
the critiques and the call.

**The season says its own name**: the host welcomes them, explains that the top
two sing and the winner decides, and names the prize; the screens carry a gold
All Stars chip (`_setAllStars`). The entrances and introductions come from the
returnee pools — the flagship's are a first-timer's ("I can't believe I'm
standing here").

**Spending the lipstick costs her.** Every queen still in the room who was close
to the one named holds it against the holder and pays a bond for it, so the
choice is a running account rather than a per-week roll.

**Screens**: the arrivals carry her record; the ceremony is its own section
(`The Lipstick`), a counter with one tube per queen in the bottom and the
chosen one turning around. Measurements: `npm run audit:dr-spec`, the "forty
All Stars seasons" block.

#### The weighing (`js/dr/data/legacy-weigh.js`)

The ceremony was one line of deliberation and one of confession, so a season
of them read identically — "boring and repetitive", with no sense of the
struggle or of the absence of one. It is a scene now, in three parts:

* **whether it is hard.** `chooseElimination` returns `close`, the raw gap
  between the name she wrote and the one she nearly wrote. Under 0.4 she
  agonises (≈35% of nights), over it she does not, and `open.close` vs
  `open.clear` are different nights of television. The first version scaled
  the gap against the pool spread, which on a bottom of two is always 1.0 —
  so "she agonised" never fired once.
* **what each name is to her.** One beat per queen in that bottom, keyed on
  what is actually true tonight: `threat`, `friend`, `pleaded`, `spared`,
  `panel-last`, `cold`, `plain`.
* **what it costs**, to camera, after the room has watched her do it —
  keyed on what she actually spent (`friend` / `strategy` / `room` / `none`).

`threatOf` reads the season body, not just the trophies. It counted wins,
highs and last season's placement and nothing else, so the queen it named
"the biggest threat" had the LOWER points per episode 48% of the time, with
both numbers printed on the chart beside the sentence. PPE is 28% of the read
now, centred so SAFE is ordinary rather than evidence: disagreement 48% → 14%,
guarded at 25% in `tests/dr-all-stars.test.js`.

The reason label is also gated on the panel agreeing. `panel` claimed the
judges' verdict about a queen the panel had ranked HIGHER on 6% of nights;
it now falls through to the real term, or to `own-read`.

#### Both of them won it (AS4)

The chart legend for All Stars 4, verbatim: *"The contestant was in the Top 2
and they both won the Lip Sync for your Legacy. They won $5,000 and the power
to eliminate another contestant."* Half the prize each, and a lipstick each.
No flag — it is the legacy rule's own, and it is rare on its own terms.

**It reads the same fact as the double shantay**, and for the same reason:
whether both of them were extraordinary is a fact about the stage, not
something the host's agenda gets to manufacture. So it uses the RAW scores and
the same two thresholds (`GREAT` 7.0, `CLOSE` 0.6, now exported from
`lipsync.js` rather than copied). Guarded on `living.length >= 7`, which is
the guard the double Beaver already uses, for the same reason: two lipsticks
can cost two queens. **Measured: 2.8% of legacy nights** over 60 seasons — 13
doubles, 8 of them agreeing and 5 splitting.

**What the wiki does not show is two lipsticks being SPENT.** The one episode
it happened on (AS4 ep 5, "Roast in Peace") recorded *Eliminated: None*,
because the LaLaPaRuZa ran the following week and superseded both powers. So
the resolution is ours:

* **they choose independently.** Same rule, same inputs, different woman
  reading them — her bonds, her grudges, who pleaded with HER in Untucked.
  Handing the second holder the first one's name would be a conference, and a
  conference is the vote this show does not have.
* **two holders make two exits POSSIBLE, not mandatory.** Same name on both
  tubes and one queen goes home, having just been named independently by two
  women who never compared notes (`legacy:double-agreed`). Different names and
  the season loses two (`legacy:double-split`).
* **nobody says goodbye until every tube is turned.** The exit beats moved out
  of the per-holder loop; inside it, a split sent the first queen off with her
  last words while the second lipstick was still closed.
* **no shadow lipstick.** Nobody lost, so nobody is left holding a secret for
  next week's cold open. `lipsync.shadowSealed` is the night's own record of
  whether it sealed one — `state.shadowLipstick` is a single slot overwritten
  every week, and the first guard written against it passed with the bug
  planted back in.

**What the show did that this cannot**: AS4's double night was called with a
bottom FOUR where its neighbours had a bottom two. We cannot widen the bottom
to match, because our host names it AT THE CALL, before the song — a bottom
that grew because both queens won would be a call that already knew the
result. Both holders choose from the bottom as named, which is also why they
can land on one name.

The singular fields are unchanged: `eliminated` and `chosenBy` are still one
name each, belonging to the higher-scoring holder, because the chart, the
stage, the exports and the social pack all read them that way. The double
ADDS `winners`, `spentBy`, `eliminatedAll` and `agreed`.

#### Revenge of the Queens (`js/dr/revenge.js`, `drAllStarsTwist: 'revenge'`)

AS2 episode 5, read off the wikitext. The first build was a lip sync bracket
on an episode of its own, which is the reunion Smackdown wearing a different
name. What it really is:

1. every queen the season sent home **walks back in**, in reverse elimination
   order — last boot first
2. each is **paired** with a queen still competing, by bond: her closest ally
   in the room. A leftover joins an existing returner as a trio (`second`)
3. the maxi is performed in those pairs and **judged on the pair**
   (`pairJudging`, the mate's craft folded in at weight 0.45), so a returner
   can carry the queen she stands with or sink her — which is the only thing
   that makes the pairing a stake rather than a staging note
4. the panel names the **top two couples**. The bottom couples lose, and
   their returning halves are out for good — they are not in the call
5. the two returners from the top couples **lip sync against each other**.
   That duel is the night's only song; the bottom does not sing and the top
   two do not either, because the queens fighting for a season back are the
   ones with something to win
6. the winner is back in the room **and takes the night's WIN on her chart**
   (`1:BTM2 2:BTM2 3:SAFE 4:ELIM 5:OUT 6:WIN 7:SAFE 8:FINALIST`). The record
   loop walks the ROOM, and she was not in it, so she used to get a blank
   cell on the night she came back
7. and the night still has a bottom and still sends somebody home

The pairing is drawn everywhere it matters: a pair rail in the sidebar
(`_pairRail`), on the critiques, and on the call — without it the viewer had
no way to tell an eliminated queen from an active one on any of three screens.
One episode, `drAllStarsTwistEp` to pin it.

#### The Jury of Queer Peers (`js/dr/jury.js`, `drAllStarsJury`)

AS3's rule: the queens already out come back on finale night and choose which
two finalists sing for the crown. **This is the only ballot on this show and
it does not break the first law** — the ROOM never votes, and these queens are
not the room. They are already out, they end nobody, and every finalist they
vote on has survived the whole season. That argument lives in the file header
too, because a reader who finds a ballot in `js/dr/` will assume the bug is
back.

A juror votes for the queen she likes, adjusted by what she thinks of the
season that queen played, and against the queen who ended her own run — bonds,
the chart and the power ledger, so the ballot is deterministic and consumes no
game rng. The tier that carried it names the beat she speaks
(`friend` / `season` / `tonight` / `circle` / `respect-despite` /
`least-worst`, in `js/dr/data/jury-beats.js`), and a close ballot draws
`agonised`. The finalist the jury does not send through gets a chart cell of
her own and the last word (`cutWords`). Checkbox gated on a showcase finale.

#### The cold open (`js/dr/coldopen.js`)

It was ONE werk event drawn off a single fact — somebody left — so a night
with a challenge, a winner, a bottom and a song in it produced a card about an
empty chair, and the episode that had just happened was never discussed by the
people it happened to. It is a written scene now, built from `state.lastWeek`:

somebody **reads the mirror message** out loud (`MIRROR`, five kinds, built
from 117 real farewell messages off the wiki: warm, blessing, shade, joke,
defiant), the room **talks about the challenge**, **congratulates the winner**
— who answers gracious, hungry or guilty — the **bottom says how it felt**
(sad, angry, fine, or genuinely not bothered), somebody **airs the drama**,
and somebody says what **being safe** costs her.

**A bottom queen did not necessarily sing.** On a legacy night the top two
sing and the bottom waits to hear a name, so every line that assumes a song
carries a `when` tag. This shipped broken once ("I sang for my life and I am
still in this competition", from a queen who never took the stage) and the
first guard for it was unfailable — its word boundaries arrived from a bash
heredoc as literal backspace characters, so the pattern matched nothing and
the test passed forever on a pool with an offender in it.

#### The Untucked campaign (`js/dr/saves.js`)

The lounge is where the bottom works the queen holding the power, and it runs
BEFORE the song on an All Stars night, so a queen can spend her whole night on
the wrong person. The circle rounds are `circle-vouch`, `circle-holder`,
`circle-split` and `circle-alone` — the last gated on `spokenFor.size`, which
took it from 198 firings to 67, because a queen "standing alone" while three
people had just spoken for her was the most common beat in the lounge. Blocs
(`js/dr/alliances.js`) bias who speaks up. The same improvement runs on the
Beaver and Baguette nights, which share the reordered week.

### TODO

Four saves shipped outside this list: the chocolate bar, the dunk tank, the
Golden Beaver and the Golden Baguette (above).

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

7. ~~**All Stars season type.**~~ **PASS 1 AND 2 SHIPPED** — see "All Stars"
   above. Pass 1 was the mode, the returning cast with a past, the legacy rule
   and the lipstick ceremony; pass 2 was Revenge of the Queens, the Jury of
   Queer Peers, the weighing, the cold open, the Untucked campaign and the
   **double win** (both queens take the Legacy lip sync and a lipstick each).
   The era is done. A double CROWN at the finale is a different feature and is
   still item 9.
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
