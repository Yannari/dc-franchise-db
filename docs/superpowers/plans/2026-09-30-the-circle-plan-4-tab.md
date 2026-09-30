# The Circle — Plan 4: the Circle tab, the run loop, the runnable flag

> Executed inline (the user's standing rule: no subagents). Each task: RED →
> GREEN → play it in the real page → commit and push only on a green suite.

**Goal:** a person on the site picks The Circle, builds a cast, optionally
writes a Catfish Pool and Profile Plan overrides, books formats and twists on
the Season Timeline, and presses "Simulate Episode" through a whole season,
with re-runs, exactly as Perfect Match plays.

**Spec:** `docs/superpowers/specs/2026-09-29-the-circle-design.md` §4.2, §4.6,
§19, §22 item 4. **Pattern:** `js/pm-run.js` and its branches in
`js/run-ui.js` (simulateNext, _canReplay, replayEpisode, buildEpisodeMap,
the timeline's slots, randomize). ADDING-A-SHOW §2, §3, §10.

## Global constraints

- Importing `js/ci-run.js` IS the wiring (it sets `window._ciRunnable`); it is
  imported from `js/main.js`.
- The engine's `state` never crosses into `gs`: only the rows (and what a
  screen or the wiki reads) come back — the Big Brother 19MB lesson.
- Seed and cast order live on `gs.ci`, so a queue lost to a reload rebuilds
  the SAME season and drops what aired (ADDING-A-SHOW §11.5 O).
- A change that would rewrite an aired episode is never applied silently.
- CONFIG_SCOPE: a control is shown only where the Circle's engine reads it.
- Visual panels (cast overrides, Catfish Pool, Photos) get a mockup the user
  approves before they are built (the user's rule).

## Tasks

1. **The run loop.** `js/ci-run.js`: inputs from the cast and setup, the
   queue, `simulateCircleEpisode`, re-run by episode (the engine takes
   `rerolls`: a day's dice turn again, every earlier day identical),
   `circleSeasonShape` (days and slots for the timeline), the runnable flag.
   Dispatch in all `run-ui.js` sites; `main.js` import.
2. **An episode on screen now.** Until Plan 5's stages, an episode airs as its
   transcript (both message layers, host, scenes), in the VP.
3. **Defaults so a season runs unauthored.** `js/ci/faces.js` (all 84 faces
   tagged by looking at them, §4.6) and a default Catfish Pool of eight
   personas with faces chosen by fit.
4. **Season options** (§19.2): length, newcomer rule, who takes a persona,
   finalists, the AI player — CONFIG_SCOPE-scoped, in `simulator.html`.
5. **The Season Timeline**: the Circle's catalog cards (blockings, arrivals,
   powers, twists) bookable per episode; bookings become slots for the engine.
6. **Mockup, then the Cast tab's Profile Plan** overrides and the draw's
   result on each card (§4.2, §19.1).
7. **Mockup, then the Catfish Pool panel** (add, edit, duplicate, delete,
   face picker, "4 of 7 would be taken").
8. **Play it in the browser** end to end (Playwright), fix what it finds,
   full suite, docs, memory, push.

**Deferred to Plan 4b:** the Photos panel (§19.3: slots, prompts, IndexedDB,
season pack) — it is its own feature with its own storage.
