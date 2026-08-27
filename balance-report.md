# Coach first-boot rate — honest measurement (2026-08-26)

## Context
`tests/coach-season.test.js` had 7 `runHeadlessSeason` calls; only one was
seeded. The balance test ("does not let coaches be booted every single time
either") ran 20 unseeded seasons and produced 11/20 on one run and 14/20 on
another run of the *same* code, against an assertion of `toBeLessThan(14)`.
The threshold sat exactly on the observed noise edge, so the test's
pass/fail outcome was effectively a coin flip unrelated to any real
regression.

## Fix
Every season-running test in the file now seeds `Math.random` via the same
LCG helper already used by `tests/full-season-audit.test.js`, with a
distinct fixed seed per test, restored in a `finally` block. No production
code was touched.

## Measurement
5 fixed seeds, 20 seasons each, run against the current committed
`js/alliances.js` (commit `113b49db`, "Wire awe's positive half into coach
targeting"):

| Seed    | First boot was a coach |
|---------|-------------------------|
| 777001  | 6/20  |
| 777002  | 9/20  |
| 777003  | 14/20 |
| 777004  | 8/20  |
| 777005  | 12/20 |

**Mean: 9.8/20. Observed range: 6-14/20.**

## Threshold decision
Set the assertion to `toBeLessThan(18)` — 4 above the highest seed actually
observed (14), comfortably outside the 6-14 range seen across 5 independent
draws. This is far enough above normal variation that it won't fire on
ordinary noise, while still catching a real regression (e.g. if awe/training
cost stopped mattering and coaches started eating the first boot in nearly
every season).

## Design note (not fixed, per instructions)
A ~49% average first-boot rate (9.8/20) for coaches is a real design
signal worth a human look — coaches are eliminated first roughly every other
season. This report only measures and documents that; no production code
was changed to move the number.
