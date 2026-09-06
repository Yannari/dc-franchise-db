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
