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
3. **Defaults so a season runs unauthored.** A default Catfish Pool of eight
   personas. *(Faces: the first pass tagged the 84 guest images in
   `js/ci/faces.js`; removed the same day when the user chose to make the
   catfish images themselves. Personas carry a `look` line instead.)*
4. **Season options** (§19.2): length, newcomer rule, who takes a persona,
   finalists, the AI player — CONFIG_SCOPE-scoped, in `simulator.html`.
5. **The Season Timeline**: the Circle's catalog cards (blockings, arrivals,
   powers, twists) bookable per episode; bookings become slots for the engine.
6. **Mockup, then the Cast tab's Profile Plan** overrides and the draw's
   result on each card (§4.2, §19.1).
   *Rulings (user, 2026-09-30): "do what the other simulators do": no draw
   preview. Like the villa panel, a blank field is decided when the season is
   dealt and each card shows the result once it is. A mode pin
   (honest/polished/edited) went into the engine; the reason override did not
   (a reason follows from the persona and the stats).*
7. **Mockup, then the Catfish Pool panel** (add, edit, duplicate, delete,
   the author's own image per persona, "4 of 7 would be taken").
8. **Play it in the browser** end to end (Playwright), fix what it finds,
   full suite, docs, memory, push.

**Deferred to Plan 4b:** the Photos panel (§19.3: slots, prompts, IndexedDB,
season pack) — it is its own feature with its own storage.

## Status (2026-09-30): Tasks 1-8 done, on main

What playing it in the browser found, that no test had:
- Quick Setup blocked Start on a Circle cast ("not assigned to a tribe").
- The hub showed the final cast on a reviewed episode (rows had no snapshot).
- saveConfig would have dropped the Profile Plan and the Pool on every save.
- Circle rows had no `exits`, so every screen said "Nobody was blocked". Rows
  now carry exits (who, the profile, who blocked, the channel), and the hub
  says "X was blocked by A and B", with the corner "How it was decided".
- The villa's option cards and Drag Race's save showed on every show.
- The catfish rate was calibrated on synthetic casts: 14% on the real roster.
  The audit now plays `rosterCast`; the motive is recalibrated on it
  (33% catfish, 37% catfish wins, 200/200 seasons finish).

Left for later:
- The Episode Format Designer's show toggle lists only Total Drama and Big
  Brother.
- Villa, castle and runway still get Total Drama's Quick Structure card.
- Drag Race's hub corner still says "No standard vote" (its words, not ours).
- The Objectives card waits for the Circle's ledger (Plan 6).
- ~~The Photos panel is Plan 4b.~~ Done 2026-09-30 (below).
- The screens (Plan 5) still show the persona's initial, not its image.

## Plan 4b: the Photos panel (2026-09-30, mockup v3 approved)

A third tab in the Circle view (js/ci-photos-ui.js; rules in js/ci/photos.js).
The show's own look: the ring logo, the players' "Circle, ..." commands, the
pink ALERT!, the profile card. Personas and Players tabs, a row of avatars
whose rings fill as photos are added, one person's slots at a time, and a
console that types the prompt.

- Slots per PERSON, never per episode: a per-episode list would reveal who is
  blocked and who wins. Persona: profile, earned, means something, naughty,
  nice, throwback, childhood. Player: the same plus "real me"; once dealt, a
  player behind a persona keeps only "real me".
- Fallbacks: earned -> profile; a player's profile and real me -> portrait;
  posted photos have none (the post shows without an image). A season never
  waits on art.
- A batch drop sorts files by name (`sienna-naughty.png`); the rest wait in a
  tray. Images are cropped square, shrunk to 512px, and kept in IndexedDB.
- A season pack (export/import JSON with the images) gives another person the
  same faces. Publishing through the cloud waits for Plan 6.
- Still to do in Plan 5: the screens read `photoFor` to show these.
