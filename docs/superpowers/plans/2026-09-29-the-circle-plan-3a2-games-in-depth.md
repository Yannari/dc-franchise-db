# The Circle — Plan 3a+: every game in full

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline, no subagents). Steps use checkbox (`- [ ]`) syntax.

**Why this plan exists.** Plan 3a shipped 48 games that each air 10–17 lines: the rules, one or two answers, a winner. The user: *"I don't want to have to come tell you your simulator is very basic and redo everything again."* The real show gives a game 30–170 sentences (measured from the US transcripts: Most Likely ~30, Ice Breaker ~67, Ask Me Anything ~163, Trivia Night ~171). This plan plays every game the way the real show does, and makes thinness a failing test.

**Goal:** every game airs as a full segment — the alert and rules; the preparation (props at the door, the build, captains scouting profiles); every round with answers said aloud and the reason behind them, @-messages and replies, reactions in other apartments, conclusions drawn out loud; the reveal item by item with the tally; the verdict; the prize as a scene — with its own content per game, and what happened in it coming back in chats, ratings and the Hangout on later days.

**Architecture:** a game scene's data becomes a list of **beats** (`scene.data.beats: [{ phase, kind, ... }]`) that each runner emits as it plays; `script.js` renders one block per beat, from a **game-specific pool** (`g.<gameId>.<beat>`) when one exists and the family pool otherwise. Content a game needs to be real — trivia questions with answers, the facts players submit in guess games, the hashtags a photo is given, the portraits described — is data in `games-data.js` or lines in `js/ci/lines/g-*.js`. What a game did to people is kept in `state.gameMemory` and read by later chats, ballots and the Hangout.

**Spec:** §13 (games), §17 (writing). Research: the US transcripts (Springfield! Springfield!, seasons 1–6; `scratchpad/circle-tx/`).

## Global Constraints

- Everything in Plan 3a's constraints (proportional stats, nice archetypes never scheme, the engine writes no player English, own dice, US English, fluent not clever, no names in pools).
- **Depth is a test.** `tests/ci-depth.test.js` fails any aired game under its family's minimum or missing a phase.
- **Nothing invented.** A beat renders only what the engine decided (who answered what, who won, what was revealed). Trivia answers are right or wrong because the engine rolled them; a portrait is a jab because the maker's feelings made it one.
- **In-universe content only** (no real celebrities, brands or places).
- Commit after every task; named files only; push after every two tasks.

## Review Focus

1. A three-player late-season game still has every phase (fewer rounds shown, never an empty one).
2. A shared profile in a game: one answer, the argument visible where it matters (a make game, a statement), both people named in staging.
3. A catfish in a guess game: the fact they submit can contradict the persona, and the reveal shows who noticed.
4. Callbacks never cite a game the speaker did not see (all games are public, but a player who arrived after it did not see it).
5. Repetition: game-specific pools are small; a season never shows the same game twice, but the same family plays several times — family lines must not repeat inside one season.

---

## Depth targets (rendered transcript lines per aired game)

| Family | Minimum lines | Phases that must appear |
|---|---|---|
| statement | 45 | announce · every round (answers aloud ≥ 3, an @-exchange when there is a lone or surprising answer, reactions) · conclusions |
| name | 40 | announce · every round (the tally, ≥ 2 namers' reasons, the named player's reply) · aftermath |
| ask | 45 | announce · choosing (≥ 2 askers deciding) · every question and answer · guessing who asked · reactions |
| guess | 40 | announce · submitting (≥ 2) · every fact revealed with ≥ 2 guesses · who it really was · conclusions |
| make | 45 | announce · props · the build (≥ 4 makers, disasters and pride) · time's up · the reveal item by item (≥ 4) with reactions · likes tally · verdict · prize |
| photo | 35 | announce · choosing the photo (≥ 2) · every post with hashtags given by others · reactions · verdict |
| team | 60 | announce · captains scouting (≥ 3 profiles each) · every pick · every question (≥ 6) with answerer, answer, right/wrong, score · result · prize |
| gift | 35 | announce · choosing (≥ 3) · every gift revealed · thank-you notes · the one nobody picked |
| rival | 40 | announce · every statement · replies · reactions |
| flirt | 35 | announce · every pickup line · reactions · the vote · the date |

---

### Task 1: The depth test (RED first)

**Files:** Create `tests/ci-depth.test.js`

Plays five seasons (seeds 2, 7, 19, 31, 44) with the transcript harness's cast (including the shared pair), renders every aired game with `blockText`, and asserts per family: rendered lines ≥ the minimum above; each required phase has at least one block (`block.phase`); a statement or name game shows a block for **every** round it played. Prints ours-vs-real per family.

- [ ] Write it; run → RED (families at 10–17 lines). Commit the red test only in the same commit as Task 2's first green family — never commit red.

### Task 2: Beats in the engine, and game memory

**Files:** `js/ci/games.js`, `js/ci/state.js`, `tests/ci-games.test.js`

Each runner pushes beats as it plays: `{ phase: 'announce'|'prep'|'round'|'reveal'|'verdict'|'aftermath'|'prize', kind, ...facts }`. The facts are the engine's (who, what answer, the stat that drove it, right/wrong, likes so far). `state.gameMemory.push({ day, gameId, kind, by, about, detail })` for every public act with a target: named-bad, named-good, called-catfish (an ask catfish question), jab, kind portrait, last pick, gift, rival, lone answer, failed catfish question, won. Tests: every family emits its phases; memory records each targeted act; the beats of a 3-player game are complete.

### Task 3: Content that makes a game real

**Files:** `js/ci/games-data.js`, `tests/ci-games.test.js`

- Trivia banks per category (8 in-universe questions each, with the answer and a plausible wrong answer); an answerer is right with probability `mental/12 + rng*0.3`.
- Guess-game fact banks per prompt (8 answers each, each with a `stat` lean) — a player's fact is drawn by their stats; a catfish's fact can contradict the persona (age, job, family) and becomes a knowledge slip.
- Photo-game hashtag banks (the room's hashtags).
- Pickup lines for Talk Flirty to Me; roast jokes; poem/rap first lines — written in pools (Task 5–9), not data.

### Task 4: Builders render beats

**Files:** `js/ci/script.js`, `js/ci/transcript.js`, `tests/ci-script.test.js`

One block per beat, key `g.<gameId>.<beatKind>` when the pool exists, else `game.<family>.<beatKind>`; `{q}`, `{ans}`, `{game}` plus new text slots `{n}` (a number: likes, score) and `{x}` (a content string: a trivia answer, a fact, a hashtag). Blocks carry `phase`. The transcript prints phase sub-headers for games ("— The build", "— The reveal").

### Tasks 5–9: The pools, family by family, every game its own

Each task: family pools for every beat kind (≥ 6 plain entries each), **and game-specific pools for every game in the family** where the content differs (the build of a cake is not the build of a mannequin; a Most Likely named-reply is not an award acceptance). Then read one season's worth of that family's games, fix, commit.

- 5: statement + name (13 games; per-prompt answer lines and named replies)
- 6: ask + guess (11 games)
- 7: make (12 games; build, reveal and verdict per game)
- 8: team + photo (7 games; scouting, picks, questions, posts, hashtags)
- 9: gift + rival + flirt (5 games)

### Task 10: Games come back

**Files:** `js/ci/script.js`, `js/ci/lines/g-callbacks.js`

Chats between two players with a game-memory entry between them in the last three days get a callback block ("After what you said in Most Likely…"); a ballot whose bottom reason matches a memory entry cites it; the Hangout discussing a player cites their game. Tests: a callback cites only a game both saw; nice players never throw a jab back.

### Task 11: The same audit everywhere else

Measure ours vs real for parties, Circle Chat, the Hangout, statuses and likes, visits and goodbyes; deepen whatever is under the real show's length the same way (a party becomes a night: dancing alone, party photos posted and judged, the party game, flirting, a group chat named and joined), and add each to the depth test.

### Task 12: Read, fix, measure, push

Read two full seasons; fix; print the depth table (ours vs real) in the commit message; merge `origin/main`; push; 0 apart.
