# Kristal-talKs exit interviews — Big Brother first — Implementation Plan

> **For agentic workers:** executed natively in this session (the user forbids
> subagents). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** every Big Brother boot records a Kristal-talKs exit interview the
week they leave; it changes the season (popularity, bonds when heard); it is
published with the season and heard on `kristal.html`.

**Architecture:** a show-blind core (`js/exit-interview/core.js`) decides an
interview from a FACTS object and delivers it to whoever may hear it; a show
adapter (`js/bb/exit-interview.js`) builds the facts from the week and calls
the core at the end of every week and at the finale. Decisions live in
`gs.exitInterviews` (so reruns re-roll and replays keep them), ride the season
document to `seasons_database.json`, and the site composes the words
(`js/kristal-exit.js` + `js/kristal-exit-lines.js`) the way debriefs are
composed today.

**Tech Stack:** ES modules, no build step; vitest + jsdom.

**Spec:** `docs/superpowers/specs/2026-10-21-kristal-exit-interviews-design.md`

## Global Constraints

- Every boot gets one, jurors included, the week they leave; finalists each get their own on finale night, after the result.
- A player who can still come back (a living Camp Comeback camper) waits until the door closes.
- They only know what they knew the night they left. Kristal knows the aired votes (the audience saw them); the guest's own guess comes from PERCEIVED bonds and can be wrong.
- Bonds move when the named person HEARS it. Out (non-juror): hears the week it airs and everything earlier the week they leave. Jurors and campers: sequestered until the final vote is done.
- Nothing in the simulator's viewer or text backlog (the user's decision).
- Effects: stats are proportional (`stat * factor`, no thresholds for gameplay); nice archetypes never go vicious on air.
- No number on the site may depend on which words were drawn (`tests/kristal.test.js` parity rule).
- Pronouns: `pronouns(name)` / they only for nonbinary players. Natural spoken voice; no stacked fragments; no forced jokes.
- Commit by path after checking the index is empty; push after each task.

## Review Focus

1. A double eviction / duo-week second evictee: two interviews in one week, each knowing the other left with them.
2. A walkout or expulsion week (`week.departure`): no votes, no "who flipped" questions.
3. Camp Comeback: an evicted camper records nothing until the camp resolves; the one who returns records nothing.
4. A returnee (Bonus Life, battle back, camp return) evicted a second time gets a second interview (`kind: 'again'`).
5. An old save with no `gs.exitInterviews`: the week runs, the export publishes `[]`, the page shows no in-season period.

---

### Task 1: The show-blind core — deciding an interview

**Files:**
- Create: `js/exit-interview/core.js`
- Test: `tests/exit-interview-core.test.js`

**Interfaces — Produces:**
- `decideExitInterview(facts, { rng, earlier = [] }) -> record`
- `EXIT_KINDS`, `MOODS`, `SEGMENTS`, `STANCES` arrays.
- facts: `{ show, week, guest, with?, how: 'evicted'|'walked'|'expelled'|'medical'|'finalist', placement?, juror, firstBoot, again, votesAgainst, votesTotal, backdoor, flippers[], suspected[], partner?, partnerStillIn, allies[], rivals[], stillIn[], outNow[], profile:{archetype,stats}, heardAboutMe:[{id, from, stance}], predictFrom: [[name, weight]] }`
- record: `{ id, show, week, guest, with, kind, mood, juror, placement, segments[], named:[{who, stance, still, heat}], truth:{flippers, suspected, right}|null, prediction, caller, answerBack:[{id, who, stance}], heat, reception:'warm'|'mixed'|'cold', effects:{popularity:{}, bonds:[]}, heardBy:{} }`

- [ ] Tests: kind is `'blindside'` when the guest's suspected list is empty and votes were cast; `'walked'` for how=walked and no `truth`; `'first-boot'` when firstBoot; `'finalist'` on how=finalist; `'again'` when again. Mood distribution responds to temperament proportionally (hothead-low-temperament casts mostly bitter, a hero mostly gracious) over 200 draws. Segments: 1–3, never `caller` without `outNow`, never `answer-back` without `heardAboutMe`, never the same set three interviews running (`earlier`). Prediction is always in `stillIn` (or null when empty). Nice archetypes never `drag`. `named` never contains the guest.
- [ ] Implement; run `npx vitest run tests/exit-interview-core.test.js`; commit.

### Task 2: The core — effects and hearing

**Files:** Modify `js/exit-interview/core.js`; Test `tests/exit-interview-core.test.js`

**Interfaces — Produces:**
- `applyRecording(record, ops)` — popularity for the guest (by mood × social) and for each named still-in person (by stance × guest's own popularity); the guest learns the truth on the tape (`truth.flippers` not in `suspected` lose bond with the guest). `ops = { addBond(a,b,d), addPopularity(name,d), popularityOf(name) }`.
- `deliverInterviews(records, { at, canHear(name), ops }) -> [{id, hearer}]` — each named person who can hear and has not heard: bond(hearer, guest) by stance × (0.6 + (10 - temperament) × 0.08); stamps `heardBy[hearer] = at`.
- `heardAbout(records, name) -> [{id, from, stance}]` — what `name` has heard said about them.

- [ ] Tests: a drag heard moves the bond down, a praise up, temperament 2 more than temperament 8; nothing moves for someone who cannot hear; a second delivery changes nothing; truth reveal hits only the flippers the guest missed.
- [ ] Implement; run; commit.

### Task 3: Big Brother adapter and the hooks

**Files:**
- Create: `js/bb/exit-interview.js`
- Modify: `js/bb/week.js` (one call before `return week` in `simulateBBWeek`, and before the departure path's return), `js/bb-finale.js` (after America's Favourite)
- Test: `tests/bb-exit-interview.test.js` (plays a season on the played path like `tests/bb-season-export.test.js`)

**Interfaces — Produces:**
- `recordBBExits(week, { rng }) -> record[]` — who left for good this week (evicted, secondEvicted, a departure, a camp that resolved), minus anyone back in the house or a living camper; builds facts; decides; applies; then delivers to the out-and-unsequestered.
- `recordBBFinaleExits(finale, { rng }) -> record[]` — one per finalist (`how: 'finalist'`), then delivers to everyone.

- [ ] Tests: after a full season every evictee has exactly one record unless they returned (then two, the second `again`); every finalist one; no juror heard anything before the final vote (`heardBy` stamps ≤ finale week only after); a walkout week's record has `truth: null`; `gs.popularity` differs from a run with the hook stubbed out; every `prediction` was in the house the week it was made.
- [ ] Implement; run the new test plus `tests/bb-week.test.js tests/bb-season-export.test.js tests/bb-finale-night.test.js`; commit.

### Task 4: Publishing

**Files:** Modify `js/stats-export.js` (`buildBigBrotherSeasonDocument`, `mergeBigBrotherSeasonsDatabase`); Test `tests/bb-season-export.test.js`

- [ ] Test: the document carries `exitInterviews` (no `heardBy`, no functions); the seasons row carries the same array; a document without it publishes `[]`.
- [ ] Implement; run; commit.

### Task 5: The site — episodes, words, followers

**Files:**
- Create: `js/kristal-exit.js` (`composeExit(ep, { words, earlier, salt }) -> { coldOpen, exchanges, rapid, hook }`), `js/kristal-exit-lines.js` (every word)
- Modify: `js/kristal.js` (`podcastFor` builds `kind: 'exit'` episodes per season row before its debrief, `period: sid + ':live'`; `EXIT_FOLLOWERS`, `exitFollowerDelta(ep)`; debrief story gets `prediction` from the guest's exit record), `js/kristal-voice.js` (a `the-prediction` exchange when `story.prediction`), `kristal.html` (period key `e.period || e.afterSeason`, "During …" tab label, an exchange `speaker`, signed follower aftermath), `js/dramagram.js` (exit gain via `exitFollowerDelta`)
- Test: `tests/kristal-exit.test.js`, plus `tests/kristal.test.js` stays green

- [ ] Tests: a row with N records yields N exit episodes, in week order, before the debrief; listeners/tier/reception identical under two salts; a cold reception gives a negative follower delta, warm positive, and an exit is worth less than a debrief of the same tier; no transcript contains `undefined`, `{`, or a name not in the season; the guest never names someone as still in who had left by that week; a debrief guest with an exit prediction gets the playback exchange.
- [ ] Implement; run; commit.

### Task 6: Season read and docs

- [ ] Dump the transcripts of three seeded BB seasons to a scratch file; read every one; fix repetition and wrong-knowledge lines; measure exact-line repeats per season (target: no line twice in a season).
- [ ] ADDING-A-SHOW.md: "Exit interviews" — what a new show supplies (facts adapter, who waits, hook points, the row field).
- [ ] Run the full suite's fast set; commit; push.

Total Drama and the other six shows follow as their own plans, reusing Tasks 1, 2 and 5.
