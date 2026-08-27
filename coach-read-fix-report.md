# Coaches twist — read-pass fix report

All five defects from `coach-read-report.md` fixed. Verified by regenerating
real headless-season text via `runHeadlessSeason({ twist:'coaches', ... captureText:true })`
and reading the actual `generateSummaryText(ep)` output (no hand fixtures),
same method the original report used.

## Fixes

1. **Coach elimination invisible downstream** (js/text-backlog.js, js/run-ui.js).
   - `_textWhyVote` now branches on `ep.coachElimination` before falling back
     to "No elimination this episode." — prints the coach's name, tribe,
     revoked banked training per contestant, and the grief/relief/unsettled
     reactions `eliminateCoach()` already computed but nobody read.
   - The "VOTED OUT THIS EPISODE:" summary now reports `"<Coach> — Coach
     Voted Out"` instead of "No elimination."
   - `js/run-ui.js`'s `getEpisodeEliminations()` (the single source every
     timeline/hub/retrospective view reads) now includes coach names from
     `ep.coachElimination`, so the season timeline, hub "last episode" card,
     and retrospective placements all stop reporting nobody left. Added a
     distinct "Coach Voted Out" episode-history pill alongside the existing
     generic "Coaches" pill.

2. **Coaching section printed after its own fallout** (js/episode.js).
   `coachFallout()`'s events were pushed into `ep.campEvents[tribe].pre`,
   which `_textCampPre` renders long before the `=== COACHING ===` section.
   Moved the push to `.pre` → `.post`, which text-backlog.js renders via
   `_textCampPost`, safely after `=== COACHING ===`. Verified in real output:
   `=== COACHING ===` at line 156, `[BREAKTHROUGH]`/`[LEFT OFF AGAIN]` fallout
   lines now at lines 236+ (`=== CAMP — POST-CHALLENGE ===`).

3. **`Banked: 0.00` sidebar bug** (js/vp-coaches.js). The sidebar's reveal
   state lived in a module-local `const _tvState = {}`, not `window._tvState`
   like every other twist VP builder. `_textTwistChallenge`'s forced-full-
   reveal Proxy only patches `window._tvState`, so the sidebar's local copy
   never saw the forced reveal and stayed at `idx: -1` — zero sessions ever
   counted into `bankedByCoach`. Switched `_ensureState`/`_buildSidebarContent`
   to read/write `window._tvState`, matching convention.

4. **Glued "P2left off by Coach_Ravu_1"** (js/vp-coaches.js). The visual gap
   between `.cb-ledger-name` and `.cb-ledger-coach` was CSS-only (`flex;
   gap:8px`), which doesn't survive HTML stripping. Added a literal space
   between the two `<span>`s.

5. **Double space "walks  P1 through"** (js/text-backlog.js). A stripped
   self-closing `<img>` (the `_avatar()` helper) leaves the literal spaces
   around it in the source template adjacent to each other. Added a
   whitespace-collapse step (`.replace(/[ \t]{2,}/g, ' ')`) to
   `_textTwistChallenge`'s HTML→text pipeline — fixes this challenge and
   protects every other VP-rendered text backlog from the same class of bug.

## Regression tests added

- `tests/coach-elimination-text.test.js` — two tests:
  - Samples seasons until a coach is voted out; asserts the text backlog
    never falls back to "No elimination" text, names the coach, contains
    "voted out", and that `getEpisodeEliminations(ep)` includes the coach.
  - Samples seasons until a coaching episode with fallout events occurs;
    asserts every fallout badge marker (`[BREAKTHROUGH]`, `[LEFT OFF AGAIN]`,
    etc.) appears AFTER `=== COACHING ===` in the generated text.
- Extracted the headless-season bootstrap from `tests/coach-season.test.js`
  into `tests/helpers/coach-season.js` (not a `.test.js` file) so the new
  test file can reuse it without re-executing `coach-season.test.js`'s own
  `describe` blocks (vitest re-runs any test file's top-level tests when
  imported). Added an optional `captureText` param that runs
  `generateSummaryText(ep)` at the correct point in the loop (while `gs`
  still reflects that episode).

## Verbatim excerpt — coach elimination now reading correctly

```
=== WHY THIS VOTE HAPPENED ===
Coach_Ravu_1 was voted out. The tribe cut its own coach.
  Tribe: Ravu
  Banked training revoked, effective immediately: P8 (-3.00), P4 (-3.00)
  Grief: P4 — genuinely torn up about it.
  Relief: P1 — glad to see him go.
  Unsettled: P2, P3, P6, P7, P8 — not sure how to feel.

VOTED OUT THIS EPISODE:
Coach_Ravu_1 — Coach Voted Out
```

## Test results

```
npx vitest run tests/coach-block.test.js tests/coach-elimination.test.js \
  tests/coach-save-card.test.js tests/coach-promotion.test.js \
  tests/coaches-state.test.js tests/coaches-training.test.js \
  tests/coach-ballot.test.js tests/coach-wiring.test.js \
  tests/coach-fallout.test.js tests/coach-backlog.test.js \
  tests/vp-coaches.test.js tests/coach-season.test.js \
  tests/coach-entry-point.test.js tests/coach-elimination-text.test.js

 Test Files  14 passed (14)
      Tests  74 passed (74)
```
