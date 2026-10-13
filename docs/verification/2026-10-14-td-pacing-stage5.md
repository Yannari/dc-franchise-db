# TD director pacing, stage 5: rhythm, and the whole plan measured — 2026-10-14

Stage 5 of the pacing plan ([stage 4](2026-10-13-td-pacing-stage4.md)). Measured first on the stage-4 matrix: 426 of
1,680 stretches of a day (a morning or an evening) ran five heavy scenes or more in a row, and the runs were nearly all
the vote block at the end of a tribal night (2,418 of their 2,782 scenes in the scramble and before-tribal windows).

## The rule

- **Tone, explicit** (`director.js toneOf`): 'H' the game (the vote, a scheme, a fight, a betrayal, a warning, an
  advantage decision), 'L' a breather from it (a person's own thing, friends, a game, a joke, a flirt, two people
  finding what they share, a lesson), 'N' neither. From what the scene is, not from its words.
- **A breather in selection** (`selectScenes`, `rhythm`): a stretch with five heavy scenes kept and not one light one
  gets back the best light scene the budget dropped (by airtime), up to the ceiling and the talk ceiling.
- **A breather in the order** (`breathe`): the longest heavy run of five or more gets the nearest light scene from
  earlier in the same stretch cut into it, at most twice a stretch. Only at a thread's start (before a plan, another
  plan, the target's or a decoy's scene, or where the window changes), never in a run's first two or last two scenes,
  never between a plan and its swing or its doubt. Only a written scene from a kind that does not depend on its hour
  (a kit, a game, friends, a flirt, a lesson; never the challenge talk, the opener or the vote), restaged in the window
  it now airs in, and only at a spot nobody else uses then. Chaining runs after, so it can still run on from a neighbour.

Read on the output: the breather lands where an edit cuts away, between the plans and the walk to the vote (Owen's
doubt about writing Bowie, then Lake and Millie getting to know each other on the dock, then Bruno sure it's him).

## Measured

Stage 4 (couples) against stage 5, the same 40 seasons:

| Per stretch of the day | Stage 4 | Stage 5 |
|---|---|---|
| Stretches with a heavy run of 5+ | 426 of 1,680 | 215 of 1,680 |
| Longest heavy run (p75 / p90 / p95 / max) | 5 / 6 / 7 / 12 | 3 / 5 / 6 / 11 |
| Longest heavy run per camp-day (median / p90) | 5 / 7 | 3 / 6 |
| Breathers given back by selection | 0 | 223 |

Unchanged within noise: the airtime spread (paired: Gini 0.132 → 0.132, fresh pairs 19.1% → 19.3%), scenes a day
(median 17, p90 18, max 21, none over 22), spoken turns (86/108 → 87/109), payoffs (follow-ups 138 → 132, morning-afters
161 → 172, turns 142 → 149).

**What it cannot fix: late merge evenings with nothing light proposed.** The heaviest days left are post-merge tribal
nights in coach seasons where the evening is the vote and nothing else: no light scene was proposed at all (the
director log shows only vote scenes, a turn, deep confessionals). By episodes 12 and 13 a person's own kit material is
mostly spent, games run every other episode, the challenge banter steps aside when a turn airs. That is a supply
question for the writing (kits, the evening's own colour after the merge), for the season read.

## The whole plan: stage 1 baseline against stage 5

The same matrix (five venues, two seeds, romance on and off, coaches on and off; 840 camp-days a run of 40):

| | Stage 1 | Stage 5 |
|---|---|---|
| Scenes a camp-day (median / p90 / max) | 17 / 22 / 26 | 17 / 18 / 21 |
| Tribal nights | 19 / 22 / 26 | 17 / 18 / 21 |
| Safe days | 15 / 18 / 21 | 15 / 17 / 18 |
| Days over 22 scenes | 6 | 0 |
| Spoken turns a camp-day (median / p90 / max) | 90 / 124 / 166 | 87 / 109 / 140 |
| Longest heavy run a camp-day (median / p90) | 5 / 8 | 3 / 6 |
| Vote scenes, share of all | 24.0% | 23.8% |
| Episodes where a 40+ character line is said twice | 105 of 560 | 68 of 560 |
| Top speaker of a 3-episode window, x an equal share (median / p90) | 1.43 / 1.71 | 1.39 / 1.66 |
| Quietest person (median / worst) | 0.61 / 0.20 | 0.63 / 0.27 |
| Fresh central pairs after episode 1 | 17.8% | 19.2% |
| Rival plans by the same people in one evening | 12 camp-days | 0 |

Not better: the "cover" scenes written in at the end for somebody nobody heard from rose 11 → 29 (the budget trims
colour that used to carry the quiet; stage 4 brought it to 22, and the breathers take some of those places). And the
top pair's worst window is 0.29 → 0.32 (couples now pass the old cap, by the user's choice). Both are small.

## Verification

- `tests/td-budget.test.js` (+4): tone; a breather cut into the vote block at a thread's start, staged in its new
  window, the vote's order untouched; a short run left alone and no two scenes in one spot at one time; selection's
  breather within the ceiling and only with the rhythm on.
- All 25 TD test files (231 tests); coach, backlog, camp, continuity-audit, season-hub suites.
- `docs/superpowers/audits/2026-10-14-td-pacing-stage5/`. `globalThis.__tdNoRhythm` turns stage 5 off for a control arm
  (nothing in the app sets it).
