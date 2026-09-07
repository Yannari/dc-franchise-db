# Drag Race — what playing a season found

Findings from playing seasons and reading the output, in the order they were
found. Started at the end of Plan 1, Task 14 (the browser run), and continued
by Plans 3 and 5, which each require their own read.

Nothing in this file was found by a test. Every entry is something that passed
every assertion in the suite and was still wrong.

---

## Plan 1, Task 14 — the first season played in a browser

Thirteen queens, standard premiere, top-4 finale, played through the real run
loop on `simulator.html`.

### 1. The host's bend was doing nothing at all

**What the output showed.** Reading the per-episode dump, `biggestBend` was 0
on eight of nine episodes and 1 on the ninth. The panel's ranking and the final
ranking were the same board almost every week.

**What that meant.** Step 3 of the three-step engine — the host deciding — was
inert. The "robbed" badge could never fire, and the design's whole premise
(that the three steps can disagree) was not reachable. Measured over 100
seasons: the host moved **0.02 queens per episode** and had **never once**
moved anybody two places.

**Why.** Two compounding arithmetic mistakes.

*Star power was read raw.* `star` is 0–10, so its term was always positive: it
lifted every queen at once and cancelled out. What matters is not how big a
star she is but how big a star she is compared to the room she is in.

*And it was divided by a constant.* Star power is a weighted mean of five
terms, so it regresses hard — across 520 queens it ran 2.9 to 7.8 with the
middle eighty percent inside **4.3–6.6**. Divided by a fixed 5, that became a
bend of ±0.16, and two adjacent queens must differ by more than
`1/(maxMove × strength)` to trade places. They never did.

**Fixed** by centring on the cast's mean and dividing by the cast's own
standard deviation, making it a z-score: the most watchable queen of *this*
cast gets the full allowance whether the season is full of personalities or
full of wallpaper.

### 2. And then it was doing too much

With the z-score in, the host changed something on **75%** of episodes. Tuned
`BEND_STRENGTH` against the spec's target and measured the curve over 100
seasons at 13 queens:

| strength | episodes the host changed |
|---|---|
| 0.45 | 21% |
| **0.50** | **33%  ← the spec's target** |
| 0.60 | 50% |
| 0.70 | 66% |
| 0.80 | 75% |

**A tension worth knowing about, and left unresolved on purpose.** The spec
asks for two things at once: a change on about one episode in three, *and* the
occasional two-place move that makes a robbery. One continuous knob cannot
deliver both — single swaps arrive long before two-place jumps, so the strength
that produces any big moves (0.80+) has the host meddling three weeks in four.
At 0.50 the two-place move never happens.

That is the correct state for now rather than a compromise, because the input
designed to produce the dramatic cases is not wired yet: `storylineNeed` is all
zeros until Plan 3's arc tracker fills it, and it is the term meant to be
occasionally *large* — the underdog who needs a win this week, the fighter who
has earned the benefit of a toss-up. Star power and track record are mild and
always-on by nature; they should nudge, not overrule.

**For Plan 3:** re-measure both numbers together when the tracker lands. Do not
raise `BEND_STRENGTH` to fake the tail.

### 3. One queen won five of nine maxi challenges

**What the output showed.** In the first season played, Cassandra Vye won
episodes 1, 6, 7, 8 and 9.

**Measured over 100 seasons**, the most wins by a single queen:

| wins | seasons |
|---|---|
| 2 | 4 |
| 3 | 22 |
| 4 | 31 |
| 5 | 14 |
| 6 | 13 |
| 7 | 9 |
| 8 | 5 |
| 9 | 2 |

So a queen takes 4+ in 74 seasons of 100 and 6+ in 29. That is high: on the
real show three or four wins is a dominant season and six is almost unheard of.

**Where it comes from.** Two positive feedback loops pointing the same way —
`nervesFor` pays +0.3 for a recent win, and each judge's memory pays +0.3 for a
win and decays slowly. Winning makes winning likelier.

**Not fixed in Plan 1**, and deliberately: the honest lever is
`storylineNeed`, which is the term that exists to spread the wins around (a
season needs more than one story). Tuning the feedback loops now would be
guessing before the thing designed to counteract them exists. After the fix to
the bend, the same measurement in a played season showed wins spread across six
different queens with a top of four, which is the right shape.

**For Plan 3:** measure this again with the tracker wired. If the top queen
still takes 6+ in a fifth of seasons, halve the win terms in `nervesFor` and
`judgeMemoryAfter` rather than adding a new mechanism.

### 4. A double shantay carries an extra queen into the finale

**What the output showed.** Thirteen queens, a double shantay in episode six,
and **five** finalists rather than four.

**This is correct** — a double shantay means nobody goes home — and the finale
places the extra queen rather than dropping her. Recorded because the real show
answers it with a later double elimination and this engine does not, so a
season with a double shantay is one episode "behind" for the rest of its run.
Pinned by a test so it stays deliberate.

**For Plan 2 or 3:** consider a compensating double elimination.

### 5. Rates that were already right

Measured over 100 seasons, against the spec's targets:

| | measured | target |
|---|---|---|
| double shantay | 0.06 per season | ≤ 0.34 |
| double sashay | 0.35 per season | ≤ 0.34 |

The double sashay is marginally over and worth re-checking after Plan 2, but
both are rare events rather than weekly outcomes, which was the point.

### 6. The craft stats drive the season; the crown is partly a lottery

The spec asks that the best craft line win 40–60% of seasons. That target was
written before the finale shape was chosen and is not reachable with a top-4
lip sync tournament — three lip syncs among four finalists is deliberately part
lottery, exactly as on the real show. Measuring the crown alone measures the
tournament, not the season.

Measured over 200 seasons:

| | measured | chance |
|---|---|---|
| best craft reaches the finale | 77.5% | 33% |
| best craft takes the crown | 22.0% | 8.3% |
| best lip syncer takes the crown | 25.0% | 8.3% |

So craft strongly decides who gets there, and the finale is a real contest once
they arrive.

**For Plan 6:** reconcile the spec's §13 table with these two numbers rather
than the single one it currently names.

---

## Plan 4, Task 8 — the first season published, and every page read against it

`node tools/dr-publish-season.mjs 7 13` plays a season from THIRTEEN REAL
ROSTER PLAYERS, builds the document, runs both database merges and writes the
three files a publish writes. Cameron won; the cast was Cameron, Karol, Aiden,
Sanders, Duncan, Justin, Gerry, Brody, Ivy, Diego, Nessa, Gyselle, Kai.

Then every page's builder was rendered against that real document and read.
Six things came out of the reading. All six passed the whole suite.

### 1. The roster carries drag craft for NOBODY

`franchise_roster.json` has 194 players and **0** with any authored drag
stats. `dragOf` fills a missing stat with 5, so a cast taken off the roster is
thirteen identical queens as far as craft is concerned, and the season is
decided by star power, archetype and noise alone.

**Measured rather than assumed** (`tools/dr-flat-roster.mjs`, 40 seasons per
arm, the same thirteen players each time so the comparison is about the craft
and not about who was drawn):

| arm | most maxis by one queen | queens who won any |
|---|---|---|
| roster as it is | 4.45 | 4.15 |
| same cast, craft varied | 4.97 | 3.63 |

Smaller than expected, and in the opposite direction to the guess: varying
craft **concentrates** the wins rather than spreading them. So the show is
playable from the roster today — it just does not differentiate by craft, and
craft moves a season less than star power does.

**Two things follow.** The cast builder already has drag sliders
(`getDragCraft` in `js/cast-ui.js`), so this is authorable per season and is
not blocking. And the second row is a calibration question for Plan 6: if
seven craft stats swing the win spread by half a win across a whole season,
they are quieter than they look on paper.

### 2. Every eliminated queen's article said she played ten episodes

The infobox counts `weekRows.length`. That was the same number as "rounds she
was in" for as long as every grid stopped at its player's exit — and Task 5
deliberately stopped doing that, because a track record chart's rows have to
run to the end of the season or the columns cannot line up. So the first queen
eliminated was credited with **ten episodes on a season she was in for one**,
directly above her own row saying "1 episode played".

Fixed by counting the rounds that were hers: anything marked `OUT` was not.
A regression I introduced two tasks earlier, invisible to the suite, obvious
in the first article I read.

### 3. The feed named the same queen twice a week and never named the other one

`drEvents` read the bottom two off the `BTM` column. The queen who goes home
is marked `ELIM`, so that column holds only the one who SURVIVED — who is
also the lip sync winner. Every week the feed emitted `nomination(Gyselle)`
and `domination(Gyselle)` about one person and never once named the queen
standing next to her.

The pair who lip synced IS the bottom two, by definition. This is the third
time this exact mistake has been made in this show's code (the season page's
game history and `dragBoardStats` were the other two), which is worth
recording on its own: **`BTM` is not the bottom two, it is the survivor of
it.**

### 4. The ledger's finale round had no account of itself

`roundLedger` on the last episode produced "the maxi challenge was The Finale"
and stopped. A finale has no maxi winner, no call and no exit, so every clause
the placement branch knew was silent — on the one night the season is about,
in the fact block the AI article writer is prompted with. It names the
finalists and the crowning now.

### 5. A generated sentence used a pronoun it had no right to

The season page's trivia said "**Brody** won 3 lip syncs for **her** life".
Two things wrong: the sentence is about a roster player whose pronouns that
module cannot see, and the show's own phrase is second person ("lip sync for
YOUR life"), so the third-person rewrite was never going to read right.
"Survived the lip sync 3 times" sidesteps both.

The neighbouring line said "was in the bottom **0 times**" — a number where a
word belongs. It says "never landed in the bottom".

### 6. What the merges did to 169 existing players — checked, not assumed

Publishing writes into `players_database.json` and `seasons_database.json`,
which hold fourteen seasons of finished data. Verified before committing:

- 169 → 170 players (one queen, Nessa, was new), 15 → 16 season rows.
- **No player lost**, no badge lost, no season detail lost, across all 169.
- 12 existing players gained a drag appearance; every one of them is a Total
  Drama alum whose camp seasons are untouched.
- `latestAvatarFile` moved from absent to `''` on three players. Harmless:
  `_rebuildByShow` skips rows with no `avatarFile`, so the drag row never
  shadows a real portrait, and every reader guards with `||` or `_safeFile`.

### 7. A guard that had been skipping for two shows woke up and failed on itself

`tests/e2e/show-pages.spec.js` has a test called "a two-show career is
described as two careers", and its own comment says:

> Nobody in the franchise has crossed shows yet, so today this skips; the day
> somebody returns across one it starts guarding, without anybody remembering
> to come back and rename them.

Publishing thirteen roster players into a drag season is that day. Twelve of
them are Total Drama alumni, so the franchise has twelve crossed careers where
it had none, and the test ran for the first time since it was written.

**And it failed on its own show list.** The body held
`const NAME = { 'total-drama': 'Total Drama', 'big-brother': 'Big Brother' }`
with a `NAME[f] || f` fallback, so it asserted the page contains
"1 drag-race" — while `player.html`, which reads `_showNameOf` off the
registry, correctly says "1 Drag Race". The page was right and the guard was
wrong, in the file whose entire purpose is catching duplicate show lists.

Worth keeping in mind for the fifth show: a test that skips is a test whose
assertions have never run, and the day it stops skipping it is as unproven as
code written that morning. This one had been skipping since it was written.

### Still open, and deliberately not fixed here

- **D1 has no per-show appearance table for this show.** `td_appearances` and
  `bb_appearances` exist; the third and fourth shows have neither, so a
  published drag season syncs its placement and status and none of its
  maxi/lip-sync counts. The Traitors is in the same position. The base
  `appearances` row is format-keyed and correct.
- **`player.seasons` is a bare array of numbers.** Duncan's drag season 1
  collides with his Total Drama season 1, so nothing is pushed. No corruption
  — `seasonDetails` is format-tagged and is what every reader uses — but it is
  the show-blind field the project already has a note about, now with a second
  show actually colliding in it.
- **The live tab is unverified.** Everything above was rendered headlessly.
  That `simulator.html` runs a drag season through the real run loop and that
  the export button fires still wants one click-through.
