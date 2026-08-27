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

---
---

# Task 4 — ROUND 2 (review response)

**Status: COMPLETE.** `tr-*` suite **256 passed** (254 at round-1 head + 2 new guards; one
round-1 guard was replaced, one round-1 unit test was superseded and one added).
`audit:tr-castle` 5 passed. Commit `290e6d24` — "A floor keyed per event cannot see a
branch die" (9 files, +695/−110).

All seven items addressed. Two extra defects found while fixing R4, and one more found by
re-reading the dump; all three fixed and guarded.

## R1 — floors keyed per EVENT cannot see a branch die

Reproduced the review's proof exactly: `const quietScore = 0;` in `trust-fall-into-step`
kills a branch worth 172 firings/400 seasons and 252 tests stay green.

Added **`THE BRANCH FLOOR`** in `tests/tr-castle-reachability.test.js`: the pool produces
**164 (event, branch) pairs**, the set is PINNED, and each pair must be produced ≥4 times
per 400 seasons — the same floor the rarest whole event gets. `branch` is now collected on
every firing in the sweep. The pin catches deletion; the floor catches decay — a floor
over the keys that are *present* can never see a branch that vanished entirely.

The test header states the shape once, naming all three places this file made the same
mistake (CLOSER FLOOR — fixed in round 1 after its own mutation exposed it; OUTCOME-BRANCH
FLOOR — already correct; DEAD-EVENT SWEEP — the one review caught).

- **Mutation:** `const quietScore = 0;` in `trust-fall-into-step` (`journey.js`).
- **Result: RED** — `a branch appeared or disappeared: expected 163 to deeply equal 164`.
  Reverted → GREEN.

## R2 — the branches the redistribution starved

It was red on arrival, as predicted. Measured, 400 seasons:

| branch | base | r1 head | r2 head |
|---|---|---|---|
| `callback-different-show-different-person:redemption` | 14 | **3** | 7 |
| `romance-liability-exposed:exposes` | 4 | **2** | ≥10 |
| `romance-liability-exposed:oblivious` | — | **3** | 5 |
| `trust-secret-swap:leakedAccident` | 18 | 5 | ≥10 |
| `trust-vote-commitment-test:kept` | 21 | 7 | ≥10 |
| `testing-loyalty-oath:reluctant` | 19 | 7 | ≥10 |

**Every one of 164 branches is now ≥4; the minimum is 5.**

Fixed by **relocation, not reweighting** — and relocation rather than a second door,
because the floor is keyed per (event, branch): a *new* event's branches are new keys and
leave the starved one exactly where it was. Relocation is also the only content-neutral
lever here. Moving a scene out of a crowded window gives it more draws *and* gives
everything left behind more room:

- `trust-secret-swap` evening → **journey-out** (the road out is where you tell someone something)
- `callback-different-show-different-person` after-table → **journey-out**
- `romance-liability-exposed` after-table → **night**. This one needed its `exposes` line
  pool rewritten: the only thing holding it in after-table was two lines putting the
  doubter on their feet *at the table*. Said out loud in a corridor at two in the morning
  is the same public act and a better scene — the person hears it from them, not from the
  room. It forks **four** ways on ~25 firings/400 seasons, so every branch of it sat at or
  under the floor; volume was the only fix.

Plus one new event, `romance-showmance-on-the-way-back` (journey-back, rare, closer,
`became-showmance`): romance still had exactly **one** door onto escalation
(`romance-showmance-forms`, evening), so every event downstream of a showmance was a
function of how many draws evening got. Round 1 fixed the spark door and left this one.

**A bug in my own new content, found here:** the first version used
`findOpenThread(kind, exactPair)`. `romance.js` documents at length that a party-exact
lookup measured ZERO escalations over 60 seasons, because the runner redraws one specific
pair about once in 300 draws. My event drew 21 firings/400 seasons for it; switching to
`_threadForActors` (now imported, per R7) took it to 81 and `romance-walked-back-together`
from 24 to 140.

Family totals, 400 seasons: romance **358 base → 914** (r1: 802), callback **1829 → 1701**
(r1: 1428 — relocation returned most of what round 1 cost it).

## R3 — the em-dash guard was fitted to the fix

Confirmed: 15 of 3703 beats still shipped three dashes because the offending dash was in
the HOST note, and my regex only inspected the quoted half.

- **Source:** `citeMoments` now checks *both* sides of the splice —
  `quoted.includes('—') || String(against || '').includes('—')`.
- **Guard rewritten from the defect's description**, as instructed:
  `note.split('—').length > 3`. RED at round-1 head unmutated; 0 of 2691 at round-2 head.
- **Mutation:** drop the `|| String(against ...)` half. **RED** — `9 of 2781 notes hold
  more than one em-dash pair`. Reverted → GREEN.

## R4 — one sentence quoted into up to eight beats

`citeMoments` now leads with **the oldest prior moment nobody has quoted yet**, falling
back to a days-only citation when every one has been used. Deterministic (it reads the
thread's own beat log — no rng), so replay is unaffected. `_head()` already took only the
first *sentence*, which is what made the old "always lead with the opening beat" rule
unnecessary in the first place.

Most-quoted sentence in one season: **4 → 1**.

- **New guard:** `no sentence is quoted into more than three notes of one season`.
- **Mutation:** `const lead = prior[0];` in place of the `prior.find(...)`. **RED** —
  `one sentence was quoted into more than three beats of a single season`. Reverted → GREEN.

### Two further defects that R4's fix CREATED, found by re-reading the dump

Varying the lead broke the assumption every `since` in that function rested on — that the
quoted moment was the earliest. Two real beats came out of the engine naming real days in
an order that cannot have happened:

> "It went back to day 7 — *Somebody tried to pull at Axel's alibi* — and it had not
> stopped since: **day 5**."
>
> "It had been going on since **day 2**, and again on **day 1**."

`since` is now anchored to `prior[0]` and never to the lead, and the quoting form's
connective no longer claims an ordering at all ("and it did not stop there"). New unit
test in `tr-threads.test.js` with **two scenarios**, because the two citation forms come
from different branches, and **a mutation named for each**:

- quoting form → restore `and it had not stopped since:` → **RED** (`a citation whose lead
  is not the earliest moment must not say "since"`).
- days-only form → `since day ${prior[prior.length - 1].ep}` → **RED** (`"since" named day
  6 while the sentence also names 4`).

Two round-1 unit tests in `tr-threads.test.js` were superseded and updated with the
reasoning written in, not deleted: R2's rule is "never quote a sentence back at itself",
not "never quote when the *oldest* moment happens to be that sentence" — with a lead that
can be chosen, it now quotes day 3 instead of discarding it as collateral. The R2
invariant it protects (the head appears in the note exactly once) is unchanged and still
asserted.

## R5 — `grief-shorter-column` had R4's sibling problem

Same fix as `grief-nobody-sleeps`: **four pools of four lines** (`solo-first`,
`solo-again`, `pair-first`, `pair-again`) on the two real axes — who is present, and
whether this is the first shorter road or another in a series — and a **branch label that
carries which**, so the audit's (id, branch) table can see it at all.

## R6 — tense splice

"The castle **is** very quiet at night once there **are** fewer people in it, and {a}
noticed." → "The castle **went** very quiet at night once there **were** fewer people in
it, and {a} noticed."

## R7 — duplicated cap

`MAX_ACTIVE_ROMANCES` and `_activeRomanceCount()` are now **exported from `romance.js`**
and imported by `journey.js`; both local copies deleted. Applied the same rule a second
time to `_threadForActors`, which R2's fix needed — a second copy of that would have
re-learned its two documented fixes the hard way.

## An eighth defect, found by re-reading the dump

> "Carrie didn't hide how hard it hit them. **somebody** sat with them and let it be quiet
> for a while."

Three events fill an absent partner with the stand-in "somebody" — substitution, not
deletion, as the existing source rule requires — and when the token opened a sentence the
stand-in opened it in lower case. Added `_sentenceCase()` (exported from `cover.js`,
applied at all three call sites; a no-op on every authored line, which all begin
capitalised) and an output guard, which is the right shape here because this defect *is*
unambiguous in the finished string.

- **Mutation:** drop the wrapper in `grief-morning-reaction`. **RED** — `14 of 2789 notes
  open a sentence in lower case`. Reverted → GREEN.
- **The first mutation I tried did not redden**: dropping the wrapper from `_fillPartner`
  in `cover.js` left it green, because cover's line pools never put `{b}` at the start of a
  sentence. That is a fact about the test and it is written into the test: the wrapper
  there is insurance against a future line, not a fix for a live defect. Same lesson as the
  closer floor in round 1 — I only know because I ran it.

## Pinned ledger, base → round 1 → round 2

| pin | base | r1 | r2 |
|---|---|---|---|
| `EVENTS.length` | 81 | 97 | **98** |
| `advancesThread` | 32 | 39 | 39 |
| `citesResidue` | 22 | 33 | 33 |
| cells | 28 | 44 | **45** |
| zero-advancer cells | 7 | 16 | **18** |
| one | 13 | 20 | **17** |
| two-plus | 8 | 8 | **10** |
| closing (event, outcome) pairs | — | 12 | **13** |
| (event, branch) pairs | — | — | **164 (new pin)** |

Two cells gained a second advancer in the relocations, which is why `many` rose.

## Distribution, round 1 → round 2 (400 seasons)

evening 2720 → 2647, after-table 2206 → 2100, journey-out 3258 → 3241, journey-back
1131 → **1216**, night 2658 → 2563. Repetition audit: distinct ids/season 33.7 → **34.2**,
distinct (id,branch) 38.2 → **39.0**, cross-season Jaccard 0.382 → **0.360** (base 0.333 —
most of round 1's regression on that diagnostic is back). Closure rate holds at 11.2%.
Zero dead events, zero starved branches, zero 3-dash notes, zero lowercase sentence starts.

## Concerns

1. **`max single (event,branch) firings in one season` is still 5**, now
   `grief-nobody-sleeps:awake-paranoid` (base's worst was 4). Both R5-shaped events have
   been split as far as their real state axes go; going further would mean inventing
   distinctions the engine does not have. `cooldown: { player: 5 }` remains the lever if
   Task 6 wants it down.
2. **The minimum branch is 5 against a floor of 4** — `romance-liability-exposed`'s
   four-way fork on a rare event. The sweep is deterministic (seeds 1..400), so this is a
   bar and not a coin, exactly as the rarest-event floor argues for itself; but it is the
   thinnest thing in the pool and a future content change will trip it first.
3. **I ran `git stash` in this shared worktree and it popped an unrelated stash**
   (`WIP on main`) over the tree, conflicting three `bb-*` files. Nothing was lost — the
   stash entry was kept and `git reset --hard HEAD` restored everything — but base-vs-head
   measurement in this worktree must not use `git stash`. I used a file swap instead
   afterwards. Flagging it because Task 5 will want the same base measurements.
4. **Carried, not addressed:** pair-keyed suspicion threads reading directionally
   incoherent when cited, as recorded by review. journey-back cites more often than
   anything before it, so this is now more visible; noted, not redesigned.
