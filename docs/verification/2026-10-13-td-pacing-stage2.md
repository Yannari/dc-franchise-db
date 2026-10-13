# TD director pacing, stage 2: a scene proposed is not a scene aired — 2026-10-13

Stage 2 of the pacing plan (see the [stage 1 baseline](2026-10-12-td-pacing-baseline.md)): every story builder the
coming shared budget may cut now proposes its scene, and what that scene spends is spent only when the director
accepts it. The director still accepts exactly what it accepted before; selection is unchanged (stage 3 changes it).

## What moved

`js/td/story/commit.js` keeps each candidate's changes beside it (a WeakMap: nothing is stored on the saved scene).
The director's day loop accepts a scene where it used to push it (`accept`), and that runs its changes, once.

| Builder | Spent on acceptance now, not on proposal |
|---|---|
| turns.js | the setup marked paid off |
| followups.js | the setup marked done, its chapter counted |
| witness.js (morning-after) | the stance marked answered |
| arcs.js | the arc's step, its last airing, its last partner; the camp game's book |
| director: mentor arc | the arc starting at all, then each step |
| director: kindred | the shared thing recorded, the camp's book, the check-in |
| director: kits (bit, clash, callback, deep, life, solo) | the kit lines (kits.js), the person's kit book, who teased whom |
| director: threads, running gags, psyche, blame | the thread or gag stage, the inner-life book, the team's blame record |
| the long scene (an engine moment written out) | its kit lines and its writer's records |
| the story writer, in draft (`ctx.draft`) | the line counted as said (pick.js ledger), the episode's used scenes, the franchise's seen count, first-impression lines |

Not moved, on purpose: the vote talk, openers, the Tribal and day one write immediately (they always air); a scene's
place is still held at once, because two proposals from one call must not take the same spot, and holding a spot
spends no story; an engine moment's "aired" mark is the selection itself; per-day scratch (the vote talk's recall
set) never outlives the day.

A safeguard: when a camp's day is final, any aired scene still holding uncommitted changes commits them, so nothing
on screen can leave its lines unspent. In five measured seasons it never fired.

## Verification

- **2a (builders): byte-identical.** With every builder's own state moved to acceptance and the writer untouched,
  all 40 baseline runs reproduced the committed fingerprints exactly (history, bonds, story state, RNG calls,
  winner): 40/40.
- **2b (writer in draft): an intended change.** A written-then-dropped proposal no longer counts its line as said.
  Once one pick differs, everything after it in the season can differ, so the 40 runs no longer match the baseline
  fingerprints (0/40); that is the change, not a regression. Across five seasons, 1,562 changes were proposed,
  1,496 committed and 66 never accepted; 0 aired scenes needed the late safeguard.
- `tests/td-commit.test.js`: a discarded proposal changes nothing and can be proposed again; an accepted one changes
  it once; a competing proposal for a setup already paid off has nothing to tell; the saved scene carries nothing;
  the writer in draft spends on acceptance and the writer outside draft spends at once.
- Tests that call a builder in place of the director now accept its scene the way the director does
  (td-followups, td-firstpair, td-kit-exchanges).
- 55 test files, 453 tests: all TD, coach, and the Big Brother and Circle suites that share the line picker.

The stage 5 comparison reruns the same matrix into a new directory; the stage 1 evidence is left as it was.
