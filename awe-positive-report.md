# Awe's positive half — report

## Job 1: wire awe's positive half

`_coachTargetDanger` in `js/alliances.js` now composes both signs of `aweOf`
into one score instead of only consuming the negative half:

- Computes `aweOf({ gap, stats, archetype })` for every attacker in the
  attacking group (previously only the lead hub attacker), using the same
  `stars` proxy `defaultFameGapOf` already uses (coach `stars`, default 4.5;
  newbie proxy 0 was not reused directly — the existing code already treated
  the coach's own stars as the "gap" against each attacker's fame reading, so
  that convention was kept, extended from one attacker to the mean of the
  group).
- Takes the mean awe across the group.
- One multiplier, `attackerBias = max(0.1, 1 + clamp(-meanAwe, -0.9, 2))`:
  negative mean awe (résumé-as-threat) raises danger up to 3x, exactly as
  before; positive mean awe (deference) now lowers it, down to 0.1x. Fully
  proportional, no thresholds — only the two clamp bounds exist to keep the
  multiplier from going negative/unbounded.
- Single call site (`pickTarget`'s pre-merge branch) updated to pass the full
  `attackers` array instead of just `_hub`.

Tests added in `tests/coach-target-danger.test.js` (exported `_coachTargetDanger`
for direct testing):
- A receptive group (goats, low strategic/boldness/intuition) scores strictly
  lower danger for the same coach than an equally-famous coach facing a
  mastermind group — and the receptive score falls below the no-training
  baseline while the strategic score rises above it, proving the positive half
  is actually moving the number.
- A mixed group's score falls between the two pure-group scores (the mean, not
  a double application of both halves).
- Non-coach name returns 0.

## Job 2: seed the flaky season test

`tests/coach-season.test.js`, "promotes whoever survived to the merge":
seeded with the same LCG pattern used in `tests/full-season-audit.test.js`
(`vi.spyOn(Math, 'random').mockImplementation(lcg(20260826))`) so the season is
reproducible. Also strengthened the assertion to the real invariant per the
brief: a promoted coach must be EITHER still in `activePlayersAfter` at the
merge OR provably eliminated in that same episode or later — never silently
unaccounted for. Belt-and-suspenders: seeding removes the flake in practice,
and the invariant holds even if a different seed is substituted later.

No production code was touched for this fix.

## Balance re-measurement (post-Job-1)

Measured over 20 unseeded seasons (same `runHeadlessSeason({ twist: 'coaches',
coachesPerTribe: 2 })` harness the existing balance tests use):

- **First eliminations that were a coach: 10/20** (previously 11/20 with only
  the negative half wired).
- **Seasons with a coach voted out at all: 20/20** (twist remains active in
  every season; not inert).

The change from 11/20 to 10/20 first-boots is a small, noisy move given the
sample size (a separate ad hoc run under the verbose reporter measured 13/20
on a different unseeded draw, underscoring how much this single number swings
run to run at n=20). It does not show a strong directional effect either way.
This is reported as measured, per instructions — no tuning was done to hit a
target, and the balance call (whether ~50% coach-first-boot is desirable) is
left to the human.

## Concerns

- The first-boot rate is noisy at n=20 (10/20 vs. 13/20 across two unseeded
  draws in this session). A larger sample (e.g. 100 seasons) would be needed
  to say with confidence whether Job 1 moved the rate at all, versus just
  reading sampling noise.
- `_coachTargetDanger`'s awe-per-attacker computation reuses the coach's
  `stars` value as the fame "gap" fed to `aweOf` (matching the pre-existing
  convention in this function, not `defaultFameGapOf`'s two-tier contestant
  proxy) — flagged in case a future pass wants the two gap computations
  unified.
