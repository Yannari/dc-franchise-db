# Coach Against Coach — implementation notes

**Status:** Done. Commit `208d2955`.

**Files:** `js/coach-deals.js` (new), `js/coach-episode.js` (non-aggression
enforcement in candidate filtering), `js/alliances.js` (`_coachFallMod`
targeting hook), `js/episode.js` (call site next to `runCoachingBlock`),
`tests/coach-deals.test.js` (new).

## Tests

`npx vitest run tests/coach-deals.test.js tests/coach-block.test.js
tests/coach-fallout.test.js tests/coaches-state.test.js
tests/coach-wiring.test.js`

```
Test Files  5 passed (5)
     Tests  44 passed (44)
```

Also re-ran the full existing coach suite (17 files, 79 tests) — all pass,
nothing regressed by the non-aggression candidate filter or the
`_coachFallMod` addition to alliances.js targeting.

## Real season — verbatim generated text

Ran `runHeadlessSeason({ twist: 'coaches', coachesPerTribe: 2 })` from
`tests/helpers/coach-season.js` across 11 seeded seasons (stopped once 3
sealed deals were found). A sealed deal, exactly as it renders in
`generateSummaryText`'s CAMP — POST-CHALLENGE section:

> **[COACHES' TRUCE]** Coach_Ravu_2 and Coach_Ravu_1 shake on leaving each
> other's protégés alone, an arrangement neither of them needed a witness
> for.

Full text-backlog line format: `- [COACHES' TRUCE] <text>`.

## Observed rate

Across 198 episode-tribe checks (11 seasons, 2 coaches/tribe, pre-merge
only): 19 total deal-channel events fired (~9.6%), of which 3 sealed
(~1.5%) — all three that sealed were non-aggression. Trade and the-fall
each triggered a proposal at least once but were rejected in this sample;
the-fall additionally requires genuine vulnerability (avg bond with the
tribe pulling it under a −1 average) which is rarer pre-merge than a
Support/Control coach's ordinary agenda pull. Breaking a live deal wasn't
observed in this sample — it requires a live deal to survive to a second
episode AND a Disrupt-leaning coach on that tribe.

This is a genuinely rare event at these odds, comparable to other
low-frequency coach fallout beats. It fires correctly and is mechanically
real when it does; it is not a common weekly beat pre-merge with only 2
coaches/tribe and ~10 pre-merge episodes.

## Design decisions

- **Reused, not duplicated:** `agendaMix` from `coach-agenda.js` drives
  offer/accept/break, never a bare archetype check. `addBond`/`getBond`
  carry every consequence. `_coachTargetDanger`'s existing coach-targeting
  slot in `alliances.js` gained one sibling term (`_coachFallMod`) rather
  than a new targeting system — a coach still never votes or attacks, only
  becomes a more attractive target.
- **non-aggression is enforced, not just narrated:** `coach-episode.js`'s
  `runCoachingBlock` filters a rival's strongly-bonded protégés out of the
  candidate pool via `nonAggressionBars()` before `pickSessionTargets` ever
  runs.
- **trade** swaps bond standing over two protégés outright (one each way) —
  a real, testable state change, not a flavor line.
- **the-fall** sets `gs._coachFallHeat[faller] = <this episode>`, read by
  the same pre-merge targeting formula as `_coachTargetDanger` and
  `_volunteerDuelHeat`, and immediately banks the protection bond on the
  survivor toward the faller's real protégés (bond ≥ 3).
- **Breaking** is exclusively a Disrupt-leaning move (`agendaMix.disrupt`),
  with type-specific fallout: non-aggression breaks trigger an immediate
  poach (bond swap toward the breaker); the-fall breaks let the survivor
  undo the protection they banked, or let the faller cancel their own
  scheduled fall.

## Concerns

- Rate is low pre-merge with the default 2-coaches-per-tribe / ~10-episode
  window; a season builder wanting more Coach Against Coach drama would
  need more pre-merge episodes or a higher `coachesPerTribe`, not a code
  change.
- A protégé filtered out by an active non-aggression pact still accrues a
  `coachPassedOverNotices` resentment tick in `coachFallout` (they read as
  "neglected" rather than "protected"). Left as-is: from the protégé's own
  perspective, still not getting sessions from their own coach is the same
  experience whether the cause is favoritism or a truce, and splitting that
  narration further felt like scope creep on this task.
- No VP-screen-specific rendering was added for these event types (unlike
  `coachFallout`'s events, which also have none) — they render through the
  existing generic camp-event badge fallback in both the text backlog and
  `vp-screens.js`. Consistent with how `coachFallout` already ships, but if
  the Coaches' Board VP screen (`js/vp-coaches.js`) is extended later, a
  dedicated card style for these three event types would read better than
  the generic fallback.
