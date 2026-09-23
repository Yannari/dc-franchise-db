# Perfect Match — Plan 5: the designed screens

**Goal:** an episode plays in the viewing party the way mockup v2
(`mockup/mockup-pm-vp-v2.html`, approved) plays its five sample screens: a
visual-novel stage pinned above the script, the Heart Map beside it, a Debug
screen behind the wrench. It replaces the interim one-screen-per-part-of-the-
day transcript (Plan 4), which stays as the text backlog and `pm:transcript`.

**Follows:** `docs/ADDING-A-SHOW.md` §6.5 (one state per step, whole-state
apply, fresh-only effects, sticky + compact-last CSS, `contain: inline-size`,
the spoiler rules, three sizes in the browser) and the user's verdicts on
mockup v1 (game feel, light-not-drawings scenery, both themes, public numbers
in Debug, relationships always visible).

## Decisions

- **A step is one spoken line.** The dialogue box types it; the speaker's bust
  is lit and pushed in on, everyone else in the scene is behind them, out of
  focus. A scene's staging is the caption on its first line, its beat on its
  last. A beach-hut cutaway and the voiceover are steps of their own (the hut
  on its own set). A scene with no lines is one step. ~100 scenes an episode
  is 250-300 clicks: the 15-20 minute episode the franchise targets.
- **A screen is a beat.** Each part of the day (`phasesOf`) is cut into
  screens of at most 20 steps, at scene boundaries, preferring to cut before a
  major moment, and named after the biggest thing on it. The night keeps its
  moment's title; a dumping gets the five-phase rail (Build-up · Verdict ·
  Reaction · Goodbye · Fallout). Target 12-20 screens an episode, measured.
- **The card is the scene.** One card per scene, filling in line by line, with
  the beach hut and the voiceover inside it and a "didn't air" tape on what
  the public never saw.
- **The stage reads the scene, never decides.** Set from the part of the day
  (sun for the day, dusk terrace, fire pit at night, the hut, Casa, the final
  studio), effects from the scene's kind and what the engine recorded
  (`extra`): neon for the night's moment, the text phone for a text, the
  heart-rate line, ballots dealt as cards, stick/twist, the final's board and
  envelope, a toast for a major moment, shake for a row. Pops say what the
  kind does (a kiss warms both; a steal cracks the one left).
- **The Heart Map never spoils.** It starts from the PREVIOUS episode's
  snapshot and changes only as the reveal passes a coupling, a dumping, a walk
  or an arrival; the episode's own end state appears on its last step.
  Relationship bars and labels (`relLabels`) are the start-of-episode ones for
  the same reason.
- **Debug** (`villa-debug`, behind `vp_debug` like the other shows): approval,
  fame and labels, emotions, and the romance / friendship grids.
- **Both themes**, following the site and switchable on the screen.

## Tasks

1. `js/vp-pm/steps.js` — pure: a row → screens → steps. Tests: every script
   line appears exactly once in order; screen count per episode; the rail;
   the heart map at rest equals the previous episode.
2. `js/vp-pm/style.js` — mockup v2's CSS, every class and keyframe prefixed
   `pmv-` (the VP page has its own `.card`, `.stage`, `@keyframes pop`).
3. `js/vp-pm/stage.js` — the stage's markup at rest and `apply(idx)`.
4. `js/vp-pm/heart.js` — the Heart Map and the relationships viewer.
5. `js/vp-pm/screens.js` — the screens, the reveal (`pmRevealNext/All/Reset`),
   the Debug screen; wired in `vp-screens.js`, the rail groups in `vp-ui.js`.
6. The browser at 1100x900, 946x720 and 400x800; the stage guard test.

## Shipped (2026-09-23)

`js/vp-pm/` — `steps.js` (pure), `style.js` (mockup v2's CSS, 27 keyframes and
~275 classes prefixed), `stage.js`, `heart.js`, `screens.js`. Wired in
`vp-screens.js` (replacing `perfectMatchScreens`, now deleted; the transcript
file keeps the order and the text backlog), `vp-ui.js` (the Debug group) and
`main.js` (`pmRevealNext/All/Reset`, `pmPick`, `pmTheme`).

Measured on the default 22 (seed 1): 18-21 screens an episode, 305-381 clicks;
the final ends on "The winners" (the board, then the envelope when split or
steal is on). Every scene line, voiceover and beach-hut line is exactly one
click, in order (`tests/pm-vp-steps.test.js`); at rest a screen has no bust,
no line and no card; the Heart Map at rest is the start of the episode and at
the last click the end.

Checked in the browser at 1100x900 (dark, a day screen and the recoupling),
and 400x800 (light, no horizontal scroll). Found that way: the envelope's SVG
group shared the card class (one phantom card a screen); the dialogue box hid
the busts to the chin (raised, and the stage made taller); the short-window
block beat the phone layout and flattened the stage (it now skips phones);
a screen revisited kept its old reveal position (it now restarts at rest).

Known limits: the Heart Map's feelings (arrows, bars, labels) are the start
of the episode's until its last click — the couples and exits move live, the
crushes do not, because the engine snapshots feelings once an episode. Secret
flirting is not drawn: the rows do not carry the secrets. The day is long
(ten screens of "The day" on a busy episode) because it IS a hundred scenes.
