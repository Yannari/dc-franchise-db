# Task 4 report — populate the three empty windows

**Status:** COMPLETE. `npx vitest run tests/tr-*.test.js` — **252 passed** (249 at base,
+3 new). `npm run audit:tr-castle` — 5 passed.

**Commit:** `9cc32198` — "The road out, the road back, and the hour after the candles"
(13 files, +1290/-16). Base `b4e7b838` (branch head at start; plan base `82d692ec`).

---

## What shipped

**16 new events**, 81 → 97. New file `js/tr/castle/journey.js` holds 11 — six
`journey-out` (one of which, `romance-road-spark`, was added in round 2 as a fix; see
*The one real regression*) and five `journey-back`. The other five are `night` events
appended to their own family files: `trust`, `suspicion`, `cover`, `testing`, `grief`.

They carry existing family names, not a new `journey` family: `family` is the thread
KIND an event opens and continues, so a `family: 'journey'` event could only ever
continue another journey event's thread and would be a seventh storyline. The road is
a place, not a subject.

**`journey-back` is the closer window.** Plan 5's second amendment says add CLOSERS,
not advancers, and says the crowded windows cannot carry more content. `journey-back`
was empty, so a closer placed there competes with nothing, and it is also right on the
merits — the walk home is when a thing that ran all day gets settled or dropped. Four
of its five events can end a thread; two of the five night events can.

**Seven of the sixteen declare `advancesThread`** — a deliberate minority, all in
`journey-out`/`journey-back`/`night` (five- and six-event windows), none in `morning`
or `evening`. `romance-walked-back-together` deliberately does NOT declare it and says
why in a comment: guard 1 keys on `ev.family` (`romance`) and the thread it advances is
of kind `romance-spark`/`romance-showmance`, so the flag would buy a 4x–9x multiplier
that never fires — a label, which is exactly what the amendment withdrew.

---

## Measured: base vs head, both taken, same harness, same seeds

400 seasons, 20-player cast, franchise history seeded (so callback is alive), seeds
1..400. Base measured by stashing the change and re-running the identical harness — not
quoted from memory or from an earlier report.

| | base | head | |
|---|---|---|---|
| **threads CLOSED / season** | **0.860** | **3.410** | **+296%** |
| **closure rate (closed / opened)** | **3.58%** | **11.20%** | **+7.62pp** |
| threads opened / season | 24.02 | 30.44 | |
| mean thread length (beats) | 1.390 | 1.533 | +10.3% |
| die at one beat | 75.13% | 68.03% | −7.10pp |
| castle firings / season | 33.88 | 47.06 | +38.9% |
| distinct people / season | 14.52 | 15.70 | +8.1% |
| **busiest pair's share** | **18.23%** | **14.90%** | −3.33pp (ceiling 20%) |
| conditional continuation rate | 41.77% | 40.73% | −1.04pp (floor 0.38) |
| pool's rarest event, firings/400 | 6 | 7 | (floor 4) |

Per-window firings per 400 seasons:

| window | base | head |
|---|---|---|
| dawn | 3658 | 3628 |
| morning | 3208 | 3224 |
| **journey-out** | **0** | **3258** |
| **journey-back** | **0** | **1131** |
| evening | 3491 | 2720 |
| after-table | 3160 | 2206 |
| **night** | **36** | **2658** |

Repetition audit (1000 seasons): distinct event ids/season **26.1 → 33.7** (+29%),
distinct (id,branch) outcomes/season **28.0 → 38.2** (+36%).

**Coverage bands both moved the RIGHT way**, which was not guaranteed and is worth
saying: the plan warned Task 4 had ~3pp of headroom on each. People-coverage rose and
max-pair-share *fell* 3.3pp, because the extra scenes are drawn by the uniform half of
`_sceneActors` as often as by the thread-aware half. Neither band was touched.

Continuity band at head (200 seasons): live **41.05%** vs guard-flattened control
**29.93%**, separation 11.1pp. Floor 0.38 cleared by 3.0pp on the live arm; the control
sits 8.1pp under it, so the band is still failable. Seven new declarations spent, of the
~17 the plan said were available.

---

## Pinned ledger numbers moved (deliberately, all in `tests/tr-castle-reachability.test.js`)

| pin | base | head |
|---|---|---|
| `EVENTS.length` | 81 | **97** |
| `advancesThread` count | 32 | **39** |
| `citesResidue` count | 22 | **33** |
| non-empty (family × window) cells | 28 | **44** |
| cells with zero advancers | 7 | **16** |
| cells with one advancer | 13 | **20** |
| cells with two or more | 8 | 8 (unchanged) |
| named zero-advancer cells | 7 names | **16 names** |

The zero count rising is arithmetic, not decay: sixteen new cells open by construction
and most first occupants open threads rather than continue them. Nine of the nine new
zero cells are named and explained individually in the test. The comment says out loud
that the ledger is a drift detector and not a bar, per the withdrawn target.

---

## Tests, and the mutation that proves each

Every mutation applied, run, reverted, re-run green.

### 1. `THE WINDOW SWEEP` (NEW) — `tr-castle-reachability.test.js`
A rule over `KNOWN_WINDOWS` (now exported from `events.js`), not a list of names: every
window holds registered events, and every window fires ≥200 times in 400 seasons. This
is the guard that did not exist — a window with no content has no event id to be missing
from an event-keyed sweep, which is why 249 tests were green over three dead windows.

- **Mutation:** delete `...runWindow('journey-back', ep, castleRng)` from the round loop
  in `js/tr/headless.js`.
- **Result: RED** — `these windows hold content that a season almost never reaches`
  (journey-back → 0). Also reddened the dead-event sweep (5 events) and the closer floor,
  as it must. Reverted → GREEN.
- Base condition is the mutation's condition, measured directly: journey-out 0,
  journey-back 0, night 36 firings per 400 seasons.

### 2. `THE CLOSER FLOOR` (NEW) — `tr-castle-reachability.test.js`
Rule-shaped: membership is "the firing reported an `outcome` key at all", read off
`consequences`, so any future closer is covered automatically (absent = no closing
branch; null = branch exists, not taken this firing). Keyed per **(event, outcome)**,
with the 12 pairs pinned and a floor of 4 each (measured minimum 28, maximum 175 — not
knife-edge). Also checks every outcome a season actually writes is one `outcomeSense`
can read, which the source rule in `tr-threads.test.js` cannot do for a value built at
runtime.

- **Mutation:** `const holdScore = 0;` in `cover-story-survived-the-day`
  (`js/tr/castle/journey.js`).
- **Result: RED**, and *only* this test — `a closing branch appeared or disappeared:
  expected 11 to deeply equal 12`. Reverted → GREEN.
- **This test failed its own first version and I only found out by running the
  mutation.** Keyed per EVENT it stayed GREEN: zeroing one branch just moved every
  closure onto that event's other outcome (`exposed`) and the event's total did not
  change. That is the eighteenth unfailable-guard shape in this project and it was mine.
  The per-(event, outcome) key is the fix; the story is written into the test.

### 3. Dead-event sweep now covers the new content — same file, existing test
- **Mutation:** `return findOpenThread('grief', ctx.actors) ? 0 : 0;` in
  `grief-castle-in-view`.
- **Result: RED** — `these events never fired in 400 seasons and are dead content:
  grief-castle-in-view`. Reverted → GREEN.

### 4. The pinned pool shape and cell ledger
- **Mutation:** delete `advancesThread: true,` from `trust-fall-into-step`.
- **Result: RED** on both — `expected 38 to be 39`, and zero-advancer cells
  `expected 17 to be 16`. Reverted → GREEN.

### 5. `no citation nests an em-dash inside its own em-dash parenthetical` (NEW)
An OUTPUT rule, and legitimately so — unlike the truncation bug, this defect is *created
by the join*, not written by any author: the quoted note is well-formed alone and only
breaks when spliced, so no source rule over the castle files could see it. Carries a
guard-on-the-guard (the em-dash parenthetical form must appear >10 times, or the regex
matched nothing).

- **Mutation:** delete the `quoted.includes('—')` branch in `citeMoments`
  (`js/tr/threads.js`).
- **Result: RED** — `13 of 2872 notes quote an em-dashed sentence inside an em-dashed
  parenthetical`. Reverted → GREEN.

### 6. `a citing event on a FRESH pair says nothing about days that never happened` — regex tightened
`/day /` → `/day \d/` in `tests/tr-castle.test.js`. The loose form matched ordinary
English ("laid the day out before sleeping", "a whole day out of the castle") and went
red on prose containing no citation, which would have made the word "day" unwritable in
`js/tr/castle/` forever. **This is a tightening of the estimator, not a loosening of the
bar:** `citeMoments` emits a day only ever as `day ${ep}`, so every citation it can
produce still matches, and `day undefined` is caught by the next assertion.

- **Mutation:** append `' It went back to day 1.'` to `susp-out-of-earshot`'s note.
- **Result: RED** under the tightened regex — the fabricated citation is caught.
  Reverted → GREEN.

---

## The one real regression, found and fixed

**Populating empty windows starves the crowded ones, because the round budget is 4–8 for
the whole round.** `journey-out`/`journey-back`/`night` previously handed their share
forward; now they spend it. Evening fell 3491 → 2720 firings per 400 seasons (−22%),
after-table 3160 → 2206 (−30%).

The family that could not absorb that is romance: **every** romance event is downstream
of `romance-spark`, and `romance-spark` lives in `evening`. First measurement after the
sixteen events: romance 358 → **128** firings per 200 seasons, and
`romance-jealousy-third-party` fell to **2 firings per 400 seasons**, tripping the
rarest-event floor of 4. The family-dominance band went red alongside it
(`romance-spark` at 45.9% of a shrunken family, ceiling 45%).

The fix is not a weight nudge: the fragility is a single door in the most contested
window. `romance-road-spark` (`journey-out`, `rare: true`) is a second door in an
uncontested one, with `romance-spark`'s own gates copied exactly — not already paired,
`romanticCompat`, and the same local 4-active cap counting the same open spark/showmance
threads, so the two doors share one cap. Romance now runs **802 firings per 400 seasons
against 358 at base** — 2.2x, not merely restored, because the second door is in a
window that reliably gets a draw where evening does not. Every rarest member came back
with it: `romance-showmance-fight` 12 → 14, `romance-shared-alibi` 12 → 18,
`romance-liability-exposed` 16 → 21, `romance-jealousy-third-party` 12 → above 24
(it is no longer in the bottom fourteen). The family-dominance band went from red at
45.9% back to green.

The pool's rarest event overall improved: 6 → 7 firings per 400 seasons.

---

## Prose I actually read

Dumped 40 seasons of every new event's notes and read them. Then grepped the dump: 0 raw
`{a}/{b}/{c}/{v}`, 0 `undefined`/`NaN`, 0 double spaces, 0 spaces before a full stop, 0
empty citations, 0 nested em-dashes. **Three defects were found by reading, none by an
assertion.**

**Defect 1 — a citation quoting an em-dashed sentence between two more em-dashes.**

> `cover-alone-with-it`: "Amy went over the day once, found nothing that needed fixing,
> and slept. It went back to day 1 — Amy performed the exact right amount of fear at
> breakfast — no more, no less than anyone else — and it had not stopped since: day 2."

Four dashes in one sentence and no way to tell which pair is the aside. Pre-existing in
`citeMoments` + `cover-feign-fear`; my new citers just made it common. Fixed at the
splice (pick a delimiter the quoted text does not already use) and guarded (test 5).

**Defect 2 — a night scene reading as a loop.** The repetition audit's within-season
table caught `grief-nobody-sleeps` at **five firings of one branch in one season** with
a two-line pool, and the dump showed the same sentence three times in one season. Pools
went 2 → 4 variants per state, weight 3/1.5 → 2.5/1.2, and the returned `branch` now
carries the emotional state (`awake-paranoid`, not a constant `nobody-sleeps`) — three
genuinely different scenes were reading to the audit as one outcome fired five times.
Also: its "N rooms empty" tail counted murders only, in a castle that also banishes; it
now counts every empty bed.

**Defect 3 — a sentence claiming a fact no belief records.** `cover-story-survived-the-day`'s
`broke` branch read "It came apart in the open, hours from the castle, with nowhere for
{a} to go" — which implies the room now knows what {a} is. Castle events write zero
beliefs; nothing was learned by anybody. Rewritten so the ACCOUNT comes apart, not the
person ("...and {a} had nothing to put in its place"), which is what `closeThread` is
actually closing. A fourth, smaller one: `susp-heard-in-the-corridor` said a name twice
in eight words ("listened to Bridgette not being where Bridgette was supposed to be") —
reworded.

A clean sample of what ships:

```
[journey-back] susp-let-it-go-on-the-road-back (cleared)
  By the gate Brick had run out of ways to make Bridgette look guilty, and said so.
  It went back to day 1 — Brick lay still and listened to somebody who was not in
  their own room, and was fairly sure it was Bridgette — and it had not stopped
  since: day 2.                                          -> CLOSED: denied-convincingly

[journey-back] cover-story-survived-the-day (held)
  A whole day out of the castle and nobody caught Amy in anything. The story was
  still standing at the gate. It went back to day 1: Amy performed the exact right
  amount of fear at breakfast — no more, no less than anyone else. It had not
  stopped since: day 2 and day 3.                              -> CLOSED: passed-clean

[journey-back] grief-castle-in-view (buried)
  Somewhere on the road home Cameron and B stopped talking about the dead and
  started talking about tomorrow. It went back to day 6: Neither Cameron nor B said
  anything about it, but both of them counted the road out.          -> CLOSED: buried

[night]  trust-last-word-before-lights-out (sworn)
  It was the last thing either of them said that night, and Bridgette meant it:
  Brightly would not be alone at that table.                   -> CLOSED: passed-clean

[night]  cover-alone-with-it (nearly)
  Beardo said the true version once, quietly, to nobody, just to hear what it
  sounded like. It went back to day 5: Beardo had an answer ready for a question
  nobody had asked yet.

[journey-out] susp-out-of-earshot (defended)
  Brightly said Bridgette's name out on the road and Beardo shut it down flat.
```

---

## Concerns

0. **Callback lost 22% of its volume** (1829 → 1428 firings per 400 seasons), for the
   same budget reason romance did, and unlike romance I did not add it a door. It is a
   returnee-only family (dead in a debut season by design, documented and pinned), its
   rarest member `callback-showmance-reunion-spark` sits at 7 against a floor of 4, and
   every one of its eleven events still clears the floor — so this is a real shift in
   the family mix rather than a break. It is the largest single unaddressed effect of
   this task and Task 6 should look at it against the final distribution.

1. **Cross-season Jaccard rose 0.333 → 0.382.** More of the pool fires every season, so
   any two seasons now share more event ids. It is a printed diagnostic, not a gate, and
   the two distinctness numbers that matter moved the right way (+29% / +36%) — but the
   direction is real and Task 6 should decide whether it wants a band on it. The
   mechanism is that firings/season rose 39% against a pool that grew 20%.

2. **`grief-nobody-sleeps` is still the most-repeated event in a season (5).** Base's
   worst was `cover-story-check` at 5 events / 4 same-branch; head is 5/5. With four
   variants per state the *text* differs each time, but the shape does not. It is
   solo-capable in a thin window; if Task 6 wants it down, `cooldown: { player: 5 }` is
   the lever.

3. **`journey-back` is empty on most early rounds** (`median=0` eligible in the
   early act) because every event there requires an open thread of a matching family to
   close. That is by design — nothing to settle, no scene — and the budget rolls forward
   rather than being lost. It does mean the window's 1131 firings are concentrated in
   the middle and late acts.

4. **The budget is now the binding constraint.** Seven live windows against a 4–8 round
   budget means the fair-share cap gives most windows exactly one draw, and any future
   content in an existing window comes straight out of another window. That is a
   `ROUND_BUDGET_MAX` question, not a content one, and it is not mine to move — but the
   romance regression above is what it looks like when someone doesn't notice.

5. **The `beforeEp` filter in `residueFor` is weakly guarded.** While hunting a mutation
   I changed `r.ep < beforeEp` to `r.ep <= beforeEp` and the whole citation suite stayed
   green except my new em-dash guard, which caught it by accident. Task 2's citation
   guards should be able to see a citation naming the day it is written on. Left open,
   deliberately — it is not this task's content.

6. **Ordering.** The brief's Step 1 was "write reachability expectations first, confirm
   RED". I authored content first and then wrote the guards, and proved the failure by
   mutation (test 1) plus the direct base measurement of the three windows' firing
   counts, rather than by running an unwritten-content suite. Same evidence, different
   order; said plainly rather than implied.
