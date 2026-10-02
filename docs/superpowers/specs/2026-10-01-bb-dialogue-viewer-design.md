# Big Brother: dialogue engine and one-click-per-line viewer

Date: 2026-10-01. Status: design, awaiting review.
Source pattern: `docs/ADDING-A-SHOW.md` §17 (The Circle). This applies §17.1
and §17.2 to an existing show rather than a new one.

## 1. Goal

Big Brother episodes play as a TV programme you click through one line at a
time, and what you click through is **actual dialogue**: houseguests talking
to each other, Diary Room confessionals, the host on eviction night. The
narration paragraphs the house events print today ("X has washed up after Y
four days running...") are replaced by scripts.

Success means:

- **No repetition:** a viewer does not hear the same exchange twice in a season,
  measured, not eyeballed (section 7).
- **Real conversations:** each exchange has 3-6 turns, and its replies are
  written too. A scene is staged and spoken, never a description of a
  conversation.
- **Fluent English:** plain, natural, and true to the scene's logic, with jokes
  that land on the first read (memory: writing rules, jokes must make sense,
  scenes with real dialogue). Every batch is read in a real season before it
  counts.
- **One rule for what is said:** the engine decides what happened and the
  words render it. A line never contradicts the numbers, and nobody says
  anything they did not witness.

## 2. Where BB is today (2026-10-01)

- 358 house events in `js/bb-events/` (about 21k lines) and about 2,700
  hand-written prose lines across BB. An event's `fire()` picks one of about
  four narration paragraphs with `_variant` -> `bb/aired.js freshLine` (a
  per-week no-repeat step), applies effects, and returns
  `{ text, players, badgeText, badgeClass }`. The words do not depend on how
  the moment came out.
- Places that already lean toward dialogue: `bb/last-words.js` (1,022 lines),
  `bb/strategy.js`, `bb/jury-house.js`, `bb/vote-operation.js`.
- The viewer is a screen per act, plus about 40 custom twist screens
  (`js/vp-bb-*.js`) and the signature comp screens (`js/vp-bb-sig/`). Nothing
  is stepped.

## 3. Decisions taken

| # | Decision | Choice |
|---|---|---|
| D1 | Existing twist and comp screens | **Embedded as-is** as screens inside the stepped episode. Each becomes a stepped set later (phase 7). |
| D2 | Pool size | **Measured:** large enough that nobody hears an exchange twice in a season, with the tier table below as the floor and a sweep setting each pool's real size. Fluency is the bar. |
| D3 | First sets to mock up | Kitchen/living room, bedroom (whispers), HOH room, Diary Room, living-room ceremony, backyard. |

Pool floor (D2). The sweep in phase 4 raises any pool that misses section 7's
thresholds.

| How often it airs per season | Minimum entries per ending | Of which have no `when` |
|---|---|---|
| Every week (HOH reaction, nomination speech, veto meeting, campaign, eviction goodbye, DR) | 24 | 6 |
| Most weeks (pitches, deals, alliance meetings) | 12 | 4 |
| Occasional (friction, showmance, gossip) | 6 | 3 |
| Rare (twists, one-offs) | 4 | 3 |

## 4. Architecture

### 4.1 Shared script machinery: `js/script/` (new, shared by Circle and BB)

The Circle's picker (`js/ci/script.js pickEntry`, `note`, `wordsOf`, the
`SAME_DAY / RECENT / USED_DECAY / SAID_AGAIN` rules) is lifted into a
show-blind module. **It is not copied:** a second copy would repeat §11.5 Q, a
system duplicated without its hard-won parts.

- `js/script/pick.js`: `pickEntry(ledger, pools, key, facts, pairKey, rng,
  { speaker, clock })`. Here `ledger` is the usage record (uses, pairs, day,
  words, recent, by), owned by the caller's season, and `clock` is the
  caller's notion of "today" (the Circle: `state.day`; BB: section 4.3).
- `js/script/match.js`: `matches(when, facts)`, which validates against a
  per-show `FACT_KEYS` whitelist passed in.
- `js/ci/script.js` re-exports through the shared module. The Circle's tests
  (`ci-repetition`, `ci-season-read`, `ci-run`) must pass unchanged, and that
  is the proof the extraction lost nothing.
- `js/bb/aired.js freshLine` is retired once the last caller is converted.

### 4.2 Scenes: decided, then written (`js/bb/scenes.js`, new)

- `addScene(week, kind, who, data, seenBy)`. `kind` names the pool family,
  `who` the roles (`a`, `b`, `c`, `hoh`, `host`), `data` what was decided
  (`ending: warm | neutral | cold`, or a kind-specific `result` such as
  `agreed | refused | lied`), and `seenBy` who was in the room.
- **The event contract changes.** `fire()` decides the outcome first, applies
  effects, then calls `addScene` and returns `{ scene, players, badgeText,
  badgeClass }` with no `text`. During migration an unconverted event keeps
  returning `text`, and the writer wraps it as a one-step `narration` scene
  (section 5, phase 2), so the viewer works from day one.
- **Knowledge has a witness.** Every belief or knowledge write that a scene
  causes goes through `nudgeBelief(..., scene)` and **throws** if the player is
  not in `scene.seenBy`. This sits in front of the existing `bb/knowledge.js`
  and `bb/deals.js` belief writes, not beside them.
- **Written after it is played** (§11.5 V). `writeWeek(week)` runs at the end
  of the week, over the recorded scenes, in order. A scene whose people differ
  from the week's end (an eviction, a Battle Back return, a twin swap) carries
  `people`, so the writer reads the house as it was at that scene.

### 4.3 BB's clock and facts

- **`clock` is a BB day:** `week.num * 10 + dayIndex`, where `dayIndex` comes
  from the act order (HOH 0, nominations 1, veto 2, veto ceremony 3, campaign
  4, eviction 5). "The same day" means the same act of the same week.
- **`BB_FACT_KEYS`** is a whitelist in `js/bb/script-facts.js`, and a test
  refuses any other key. The starting set is `ending`, `result`, `intent`,
  `act`, `hoh`, `nominee`, `vetoHolder`, `onBlock`, `jury`, `alliance`,
  `showmance`, `blindside`, `expected`, `early`, `late`, `final`, `havenot`,
  `returnee`, `twin`, `mood`, `register`, `band`, `known`, `lie`, `reason`.
  New keys are added with the pool that needs them.
- `factsFor(scene)` computes them from the record: the scene's own data, the
  week's state at that scene, and the speaker's beliefs (never the truth they
  have not seen).

### 4.4 Pools: scripts, not templates (`js/bb/lines/*.js`)

- An entry is `{ id, when, turns: [{ by, say | dr | beat }] }`.
  - `say` is a line spoken in the room.
  - **`dr` is a Diary Room confessional**, which the viewer renders as a cut
    to the DR set and back. The Circle has no equivalent; it is BB's
    signature.
  - `beat` is a stage direction.
- `{a}`, `{b}`, `{hoh}` and the pronoun slots (`{a.obj}`, `{a.posAdj}`) are
  filled at render time. A name is never written into a pool.
- Pools are keyed `<family>.<intent-or-kind>.<ending>`, for example
  `pitch.target.cold`, `hohroom.visit.warm`, `dr.nominated.blindsided`.
- Every pool keeps at least three entries with no `when`, so a scene always
  finds a line.
- Vocabulary comes from the show registry (`js/shows.js`) and is never
  hardcoded.

### 4.5 Talk as intents (`js/bb/talk.js`, new)

House conversation becomes a set of intents, each with a utility computed from
stats, bonds and beliefs, the same way the Circle's `chat.js INTENTS` work.
Stats are proportional, never thresholds (franchise rule).

Starting set: `pitch-target`, `ask-safety`, `float-deal`, `campaign`,
`confront`, `comfort`, `gossip`, `debrief`, `test-loyalty`, `hoh-visit`,
`who-are-you-putting-up`.

Most of these already exist as events (`bb-events/deals.js`, `social.js`,
`schemes.js`, `alliance-life.js`), so they are converted, not duplicated.
Nice archetypes never scheme, and neutrals need `strategic >= 6 && loyalty <=
4`, unchanged.

Airing (`js/bb/airing.js`): ceremony scenes always air, and talk airs by drama
up to a per-act cap. A new intent that adds talk raises the cap; one that
swaps talk does not (§17.5 displacement).

### 4.6 Voice layer

Per-houseguest register on top of the pool line, reusing `js/ci/voice.js
byAuthored` for spoken text (not the emoji and hashtag tokens, which are
Circle-only). It reads `voice` only when a human authored it; an inferred
voice is never used.

### 4.7 The viewer: `js/vp-bb-ep/` (new)

Mirrors `js/vp-ci/`:

- `steps.js` (pure): a played week row in, screens out. One screen per aired
  scene, one step per turn, each step carrying `key`, `on: {a,b,c}` and its
  set. Embedded legacy screens (D1) are a single step that renders the
  existing `rpBuildBB*` HTML.
- `stage.js`: `stageInner(row, screen, idx, fresh)` paints "the first N lines
  have happened", with only the newest animating. Never `scrollIntoView`.
- `sets/`: kitchen, bedroom, HOH room, Diary Room, ceremony, backyard (D3).
  Later: have-not room, storage, jury house, comp arena. Scenery is SVG,
  light-only, and works in both themes.
- `sidebar.js` is gated by steps played: HOH, nominees, veto, alliances and
  the relationship lines that moved.
- `teasers.js` ("Previously", "Coming up"; never a key that spoils an
  outcome), `web-stage.js` (end-of-episode relationship web), `debug.js`
  (stats and what each scene decided), `sound.js` (a bed per set, a cue per
  step key).
- **The text backlog is generated from the same steps,** so the transcript and
  the viewer cannot drift.

### 4.8 Music and sound: `js/vp-bb-ep/sound.js` (new)

Built the way the Circle's `js/vp-ci/sound.js` is (with Perfect Match's
`js/vp-pm/sound.js` and the Traitors' `js/vp-tr/sfx.js` as further references),
through the shared `js/audio.js` singleton so the viewer's music on/off and
volume settings hold.

- **Beds:** one bed per kind of scene, from your own tracks in
  `assets/audio/bb/`. A kind with several tracks keeps one per screen
  (`variantOf`), so the same scene does not always sound the same. A bed whose
  file is missing plays silence, never a pad. The starting list, with what each
  should feel like, goes in `docs/bb-music.md`, which is the download list:
  - `bb-morning`: wake-up music, the house starts the day
  - `bb-house`: kitchen, backyard and everyday talk; light, easy
  - `bb-scheming`: bedroom whispers, pitches and deals; sneaky suspense
  - `bb-drama`: confrontations and blow-ups; tense
  - `bb-hoh`: the HOH room; a little glossy, a little lonely
  - `bb-diary`: the Diary Room; a soft pulse under confessionals
  - `bb-comp`: competitions; game-show energy
  - `bb-ceremony`: nominations and the veto meeting; slow build
  - `bb-eviction`: live eviction night; the host's theme and suspense
  - `bb-goodbye`: right after an eviction; shock, sad
  - `bb-jury`: the jury house
  - `bb-finale` and `bb-winner`
- **Stings:** one per moment: the HOH key, the nomination keys turning, the
  veto medallion going on and coming off, "by a vote of...", the front door,
  the Diary Room cut, a twist alert, the winner. Your file goes in
  `assets/audio/bb/sfx/` once you have it; until then a synthesized sting
  stands in (rendered like `tools/circle-make-stings.py`), so the show has
  sound from the start.
- **When** is read off the step (its block key and its set), the way the stage
  draws, so a step can never sound like something that is not on screen. Only
  a click plays a sting; Reveal all and a fresh paint are silent. A Diary Room
  `dr` turn ducks the bed and swaps to `bb-diary`, then restores it on the cut
  back.
- **Processing** follows the Circle soundtrack: trim silence, level to -17 dB,
  re-encode at 128 kbps, with per-file `lift` for a track that would clip. Levels
  are checked by measuring, not by ear (memory: PM soundtrack).
- **The embedded legacy screens (D1)** keep the sound they already have; the
  bed only changes when a stepped screen asks for one.
- `tests/bb-vp-sound.test.js`: every set and every stepped scene kind maps to a
  bed in the catalog; no sting fires on Reveal all; every file named in the
  catalog exists or is listed as pending in `docs/bb-music.md`.

## 5. Phases

| Phase | Deliverable | Done when |
|---|---|---|
| 0 | `mockup/mockup-bb-*.html`: the six D3 sets, static, both themes | You approve them |
| 1 | `js/script/` extraction, `bb/scenes.js`, `writeWeek`, `BB_FACT_KEYS`, the witness rule | Circle tests pass unchanged; a BB season round-trips its scenes through JSON |
| 2 | `js/vp-bb-ep/` viewer playing every week, with unconverted events as one-step narration and legacy screens embedded | Every week of 3 real-roster seasons renders, and the "nothing before its line" test passes |
| 3 | Music and sound (section 4.8): bed catalog and step-driven switching, synthesized stings, `docs/bb-music.md` download list; your tracks processed and wired as they arrive | Sound test passes; one season played through with sound on |
| 4 | The weekly loop as dialogue: HOH reaction, HOH-room visits, nomination speech, veto pick, veto meeting, campaigning, eviction speeches and goodbye, DR confessionals throughout; pool sizes set by sweep | Section 7 thresholds pass; 3 seasons read |
| 5 | Talk intents (section 4.5) replacing the strategic events | Displacement measured (§17.5); thresholds pass; seasons read |
| 6 | House life, friction, showmance and the rest of `bb-events/`, converted a file batch at a time | Each batch: thresholds and a season read; `freshLine` deleted at the end |
| 7 | Twists, jury house and finale as stepped sets, one at a time, each mocked up first, each with its own bed and stings | The legacy screen is removed from the embed list |

## 6. Rules that carry over unchanged

- Valid stats only, proportional mechanics, and archetype behaviour rules.
- Every scene has a consequence (bond, belief, popularity or state). A scene
  whose `fire()` changes nothing is refused, as with Drag Race's
  `applyWerkScene`.
- BB's vocabulary only: it evicts, it nominates, and it has a jury. No other
  show's words.
- Seeded replay: the picker takes the season's `stableRng`, never bare
  `Math.random` (memory: BB seeded season).

## 7. Tests and measurements

- `tests/bb-repetition.test.js` over 50+ seeded real-roster seasons: under 12%
  of lines repeat one already heard that season, under 1.5% are a person
  repeating themselves, and 0 exchanges repeat within a week. It also prints
  the hardest-worked pools (plays, distinct entries, worst repeat), which is
  how pool sizes get set.
- `tests/bb-script-facts.test.js`: every `when` key is in `BB_FACT_KEYS`, and
  every pool has at least 3 entries with no `when` and meets its tier floor.
- `tests/bb-vp-steps.test.js`: renders every step of every screen of 3 real
  seasons and checks no result is on stage before the step that says it, and
  the sidebar never shows ahead.
- `tests/bb-witness.test.js`: a belief write from a scene the player was not
  in throws.
- `tests/bb-season-read.test.js` collects each bug class a season read finds,
  with the fix (§17.3 style). Every new test is checked by putting the bug back
  and watching it fail (§17.7).
- **The season read itself:** a scratch test writes 3 real-roster seasons to
  files and they are read. A mechanical scan covers unfilled slots,
  `undefined`, a speaker naming themselves, an evicted houseguest speaking,
  the same line twice in a week, and talk about something one of the pair did
  not see.

## 8. Out of scope

- AI-worker episode writing for BB (`js/episode-stage.js` is TD-only and
  stays so).
- Changing BB's game rules, comps or twist mechanics. Only how they are
  spoken and shown changes.
- New twists.
