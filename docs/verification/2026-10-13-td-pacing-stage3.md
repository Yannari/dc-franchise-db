# TD director pacing, stage 3: one budget for the day — 2026-10-13

Stage 3 of the pacing plan ([stage 1 baseline](2026-10-12-td-pacing-baseline.md), [stage 2](2026-10-13-td-pacing-stage2.md)).
About fifteen systems used to fill a camp's day, each by its own rule (`cap`, `ROOM`, `cutCap`, `capR`, a length check),
with a 22-scene trim at the end. Now every system proposes, and one selector (`director.js selectScenes`) decides what
airs, with a recorded reason for every proposal.

## The rule

| Tier | What | Room |
|---|---|---|
| must | opener, duel return, auction, day-one pair; the vote's information (each plan, the swing, a doubt that breaks, the target's scene, the spark, warnings, advantage decisions, a new alliance); the plan's cause; a pitch to turn on a friend; the coaching twist's scene | always airs |
| due | follow-ups, turns, the morning after a fight, thread steps, arc and mentor chapters, a kindred check-in or betrayal | up to the ceiling (22) |
| story | storyline steps, challenge moments, returnee pasts, group scenes, deep confessionals, a doubt that holds, the decoy's nerves | up to the target (18) |
| colour | kits, games, solos, running gags, psyche, banter, day-one set pieces, kindred discoveries, quick cuts | up to the target (18) |

- The morning is selected first (target 8 on a tribal night, 9 otherwise; ceiling 10/11), the evening gets what the day
  has left, less one place for the late passes (somebody nobody heard from, a defence's setup, must-air moments).
- Spoken turns: colour stops at 110 a day, story and due at 130 (the morning gets half). Must is never cut.
- Within a tier, proposal order. A builder's candidates past its old quota (two more storyline steps, two more quick
  cuts) are proposed as extras and rank after their tier: they fill a quiet day only.
- Same written scene twice: dropped. One person's bit a day, one payoff a day between the same two people (claims).
- A dropped proposal changes nothing (stage 2) and gives back the engine moment it claimed (`commit.js onDiscard`).
- `ep.tdDirectorLog[camp][phase]`: one compact string a proposal, `+reason|source|tier|kind|who|turns`. The Debug
  screen's new **Director** tab reads it (`td/story/director-debug.js`).

The user's calls (2026-10-13): a dropped payoff stays due for two episodes (follow-ups went from 3 to 2; the witness
morning-after stays next-morning only, its lines say "last night"); colour fills a quiet day to 18 with candidates
something really proposed, never invented filler.

## Fixed along the way (found reading the stage-3 output)

- **Rival plans led by the person going home, twice.** `rivalLead` put the boot in every bloc they belonged to, so they
  led each rival plan: Leshawna, "Aubrey is coming after me" and then "Heather is putting my name out there" to the
  same two people; Duncan the same on the world-tour merge. The boot is now on the plan whose name they wrote, nobody
  leads two, and nobody already in one rival plan sits in another unless it is the name they wrote. Camp-days with
  two rival plans by the same people: **12 → 0**.
- **The same count line in two plans.** `vp2` whole-scene templates are copied under one id per case, so the per-episode
  rule (by id) never matched; Gwen and Lake both said "Even if one of ours flips, we've still got the numbers". The
  episode rule now also compares an entry's first spoken line, and a vote talk's optional beats (pushback, count,
  button) and whole scenes take nothing rather than a repeat (`ctx.epFresh`). Episodes where that line airs twice: 1 → 0.
- `nvt.f2` ("I'm actually going to make the merge") aired on the merge episode itself: now pre-merge only.
- A late scene's bond changes (a plan's cause, group scenes, quick cuts) were never applied: `applyStoryFx` ran before
  they were added. It runs after selection now, on everything that airs.
- A replaced opener and a plan's cause are copies of a scene; the copy now carries the scene's pending changes (`adopt`).
- `tests/td-island-script.test.js` went red on the new seasons (9 of 416 island scenes repeated, guard 2%): the generic
  training and Edge-rest pools ran dry on a six-week stay. Added six stat-neutral training versions (the pool is the
  fallback for every kind of training, so none names a body part) and five rest versions: **3 of 416**. The guard was
  not loosened.

## Measured: the same 40-run matrix, stage 1 vs stage 3

`npm run audit:td-pacing` with `TD_PACING_OUT=docs/superpowers/audits/2026-10-13-td-pacing-stage3`; the stage-1
evidence is untouched. Traced and plain runs matched 40/40 (the observer changes nothing). The seasons are not paired:
stage 2's draft writer and this stage both change the story from the first difference on, so these are distributions.

| Per camp-day | Stage 1 | Stage 3 |
|---|---|---|
| scenes (min/p25/median/p75/p90/max) | 7/15/17/20/22/26 | 6/15/17/17/18/21 |
| over 22 | 6 of 840 | 0 |
| tribal nights | 7/16/19/21/22/26 | 6/16/17/17/18/21 |
| safe days | 7/14/15/17/18/21 | 10/14/15/16/17/18 |
| spoken turns | 26/74/90/110/124/166 | 24/75/86/97/109/133 |
| confessional turns, p90 / max | 27 / 40 | 24 / 29 |
| longest heavy run, median / max | 5 / 11 | 5 / 15 |
| fresh central pairs | 22.0% | 22.9% |
| episodes with a 40+ character line said twice | 105 of 560 | 59 of 560 |

- Scenes in all: 14,480 → 13,412. Vote scenes 3,479 → 3,284 (vote scenes a tribal night 6.09 → 5.79); their share
  rose 24.0% → 24.5% because colour gave way. Kits 2,296 → 1,640, camp games 471 → 365, quick cuts 966 → 918.
- Selector reasons over the matrix: 5,093 must, 1,281 due, 3,633 story, 3,266 colour, 197 extras with room; dropped
  2,369 for room, 150 for talk, 165 claimed, 51 the same scene.
- Payoffs: follow-ups 135 aired (stage 1: 135), turns 144 (155), morning-afters 167 (137). Dropped: 4, 2 and 5, all
  "claimed" (the pair already had a payoff that day). None reached the ceiling, so none was deferred for room.

## What it does not do yet (stages 4 and 5)

- **Who gets the last places.** Within colour the order is proposal order, so kits win over quick cuts and games
  (quick cuts aired 123 of 285 proposals in the first run). The decoy's nerves scene, in story, is dropped for room on
  the busiest nights (119 times). Rolling dominance and fresh-pair scoring (stage 4) are what should choose here.
- **Rhythm.** A merge tribal night is now a short morning and an evening that is nearly all vote: the longest run of
  heavy scenes went up (max 11 → 15) because the colour between them went first. Stage 5.
- **Writing found in the reads, not fixed here:** the kit callback's answer bank is six fixed lines in stilted
  English ("Let us ask. I have already reached the limit of what I can confidently make up."); "Joining in. I want to
  find out whether I can keep up." is said twice in one episode in 33 episodes (kits.js ANSWER).

## Verification

- `tests/td-budget.test.js` (new, 9): must past the ceiling, colour to the target, due to the ceiling and deferred
  with a reason, story before colour and extras last, the same scene/claims, the talk budget, the log round-trip, and
  a dropped proposal giving back its claim.
- All 25 TD test files (219 tests); coach, backlog, camp-access and folding-camp suites (31 files, 197 tests), on
  the final code.
- `docs/superpowers/audits/2026-10-13-td-pacing-stage3/`: the matrix's evidence, with the heaviest, longest and
  quietest reads per venue.
