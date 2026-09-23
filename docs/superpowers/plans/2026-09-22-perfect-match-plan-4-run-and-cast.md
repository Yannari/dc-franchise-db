# Perfect Match — Plan 4: the run tab and the cast setup

**Goal:** a Perfect Match season plays from the simulator itself — pick the
show, build the cast, set each islander up, press play, read the episode —
instead of only from `npm run pm:transcript`.

**Follows:** `docs/ADDING-A-SHOW.md` §2 (runnable flag, both dispatch sites),
§3 (CONFIG_SCOPE: a control shows only where the engine reads it), §8 (state
size), §11.5 A (written and shown to nobody), N/O (replay).

**Not here:** the real VP screens from mockup v2 (Plan 5). Until then an
episode opens on ONE interim screen, the transcript, so nothing the engine
writes goes unseen (§11.5 A).

---

## Task 1 — `js/pm-run.js`, the Traitors pattern

- On the first press, play the whole season headless into a queue, exactly as
  `js/tr-run.js` does. The engine replaces `gs`, so hold the setup's `gs`
  aside and put it back afterwards.
- Carry across only what the saved season needs:
  - the rows;
  - `gs.popularity`;
  - the relationship dimensions and bonds (the wiki and the social feed read
    them later);
  - `gs.pm = { seed, castOrder, setup, winners }`.

  Never carry the engine's `state`: its `history` holds every scene a second
  time, which is how Big Brother reached 19MB (memory: BB state bloat).
- Each press airs the next row, sets `gs.activePlayers` from `row.pm.villa`,
  and sets `gs.phase` (`villa`, then `complete`). The winners come from the
  final row.
- A lost queue rebuilds deterministically from `gs.pm.seed` and
  `gs.pm.castOrder`, then drops the episodes that already aired (§11.5 O).
- Re-running an episode: `pmCanRerun()` is false for now, and the refusal
  says why. There is no re-roll in the engine yet, and a replay that re-airs
  instead of re-running is §11.5 N.
- `window._pmRunnable = true` at the bottom. Import the module in
  `js/main.js`: importing it is the wiring.

## Task 2 — `js/run-ui.js`, every branch

This is the same list Drag Race and The Traitors needed:

1. `simulateNext`: dispatch, save, refresh the feed, auto-reveal, and set the
   viewing episode. Skip `updatePopularity`, because the engine writes its own
   ledger.
2. The replay path, and `canRerun`: refuse, with the reason.
3. The episode "why" line: who was dumped or who walked, and on the final,
   who won.
4. Timeline length: 16 episodes, fixed by `schedule.js`.
5. Phase label, the "complete" message, and episodes left.
6. Badges on the history list: dumped, walked, final winners.

Each item is checked by reading the run tab after a played season, not only by
a test.

## Task 3 — the interim episode screen

- Move the transcript renderer out of `tests/pm-transcript-audit.test.js` into
  `js/pm/transcript.js`. It renders scenes by phase, with hut lines, narrator
  lines, aired or not, and what the public made of each scene.
- `buildVPScreens` branch: a Perfect Match row gets one screen, "Episode N —
  the villa", built from it. The episode header shows couples, exits, and who
  rose and fell with the public.
- The text backlog is the same content as plain text, placed before
  `_textCampPost`.
- The test tool imports the moved renderer, so there is one renderer, not two
  (§11.5 Q).

## Task 4 — cast setup

- `seasonConfig.pmSetup[name] = { role, dialect, intent, persona, type:
  { looks, vibes }, looks, icks, interests, eyesOn, ex }`. This is exactly
  what `resolveIslander` reads. Every field is optional and rolls or defaults
  when blank; dialect falls back to the season default.
- The cast tab gets a Perfect Match panel: one row per islander.
  - **Role:** starter, bombshell or Casa, with suggested counts.
  - **Where they're from:** the 16 dialects.
  - **Intent**, and **persona** (auto unless set).
  - An expandable row for type, icks, interests, eyes-on and ex.

  The panel is scoped `['perfect-match']` in CONFIG_SCOPE.
- Season options, scoped the same way:
  - default dialect;
  - split-or-steal on or off (the UK dropped it, and the US still uses it).
- Validation before a season starts:
  - at least 10 starters, split evenly by gender;
  - enough bombshells and Casa arrivals for the schedule;
  - no unknown field values.

  The first failure is shown as a toast. Nothing is written silently.

## Task 5 — the setup blueprint and the show picker

- `quick-setup.js`: the blueprint seeds a default Perfect Match season,
  assigning roles by position (10 starters, 6 bombshells, 6 Casa).
- The show picker entry already exists (Plan 1): confirm it starts a season.

## Task 6 — guards

- `tests/format-scoped-config.test.js` covers the new controls.
- `tests/pm-run.test.js`, under jsdom:
  - play a season through `simulatePerfectMatchEpisode` to the end;
  - check that rows are stamped, `gs.phase` reaches `complete`, and the
    winners are set;
  - check that a lost queue rebuilds without restacking episodes that aired;
  - check that the saved `gs` has no engine `state` and stays under a size
    ceiling.
- Every run-ui branch is exercised once.

## Task 7 — read it in the browser

- Open `simulator.html`, pick Perfect Match, build the cast, and play all 16
  episodes.
- Read the interim screen, the timeline and the badges.
- Screenshot anything wrong. Fix it before closing the plan.

---

Commit per task, named files only. `ADDING-A-SHOW.md` §13's greps are re-run
at the end, in case a new show list crept in.
