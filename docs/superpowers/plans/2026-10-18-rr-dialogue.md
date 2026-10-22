# The Ridonculous Race, sub-project 2: dialogue — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
> **Writers:** the user allows subagents for this show's WRITING only (2026-10-18). Every task marked ✍ hands its
> pools to writer subagents with the brief in Task 4; wiring, tests, gates, the director and the season reads stay
> inline.

**Goal:** a played leg becomes an episode a viewer reads like the real show: the director chooses what airs, every
moment is a whole human exchange in the speakers' voices, every team is seen at every task, and the season's
storylines carry from leg to leg.

**Architecture:** type A dialogue (manual §19.1) with a race director. The engine already decides and records every
moment (`js/rr/scenes.js`, the catalogue). This plan adds: a snapshot of what each scene may know, taken when it is
played; `js/rr/script/` (roles, facts, writer, pools, voices, identity kits) ported from The Challenge's
`js/ch/script/`; `js/rr/story/` (the director, previously/next time); and the episode text the viewer will play.

**Tech stack:** ES modules, vitest. Shared: `js/script/pick.js` (repetition rules), `js/script/rng.js`
(`stableRng`), `js/td/story/voice.js` (voice tags) and `voice-family-map.js`, The Challenge's `variantFails` gate.

**Spec:** `docs/superpowers/specs/2026-10-18-ridonculous-race-design.md` §8 (dialogue), §9 (the viewer it feeds),
§12 (the first audit). The contract: `docs/ridonculous-race-scenes.md`. Voices: `docs/ridonculous-race-identities.md`.
The real show: `docs/ridonculous-race-research.md`. House style: `docs/td-dialogue-style.md`. The manual: §19.

## Global Constraints

- The engine decides; the words describe what it decided. A line never settles an outcome or claims a fact the record
  doesn't have (§19.1).
- Words are written after the leg is played and read only the scene's own record and snapshot, never live state.
- Nobody refers to what they didn't see (`scene.seenBy`); teams at different places literally didn't see each other.
- The user's writing rules: human dialogue, strong characterization, **no clever lines**, each line answers the one
  before, Don dry and self-absorbed, never an announcer. A confessional says the feeling and its reason.
- No real place names (CLAUDE.md World Tour rule). No vote words: no "vote", "ballot", "tribal", "jury", "evicted",
  "nominated", "Arena" (the show has no vote; §19.4 "the format's own words").
- Group scenes never count heads ("you three"); a room's size varies.
- Valid stats only, valid archetypes only; nice archetypes never scheme in words either.
- `{a}` `{b}`… filled at render; pronouns through `{a.sub}` etc.; no name written into a pool.
- Every pool: at least 2 entries with no `when`; an entry naming a time of day needs a fact for it.
- Commit by path, push after each task.

## Review Focus

1. A scene whose speakers are on different teams at different stretches never airs as a conversation (the
   presence rule, checked on aired scenes, not on the engine record).
2. A leg where one team is hours behind: it is still seen at every task, and the episode doesn't stall on it.
3. A custom identity: it hears only voice lines, never a built-in identity's specific lines, and `{identity}` prints
   its own name.
4. An ending pool with no entry for this ending: the kind's `.any` speaks; a kind with no pool at all is never aired
   silently as a blank scene.
5. The same exchange twice in a season, or one person saying the same line twice: never (pick.js ledger), even on a
   12-leg season with few places repeating.

---

### Task 1: What a scene may know (the snapshot)

**Files:** Modify `js/rr/scenes.js`, `js/rr/tasks.js`, `js/rr/leg.js`. Test `tests/rr-snap.test.js`.

**Produces:**
- `scene.data.snap`, taken in `playScene` and `emit`: `{ leg, legs, phase: 'early'|'mid'|'late', tod: minutes of
  day, rank: perceived 0..1 for the centre team, band: 'enemies'|'cold'|'neutral'|'friends' between A and B,
  bandX: same between the two teams, allied, rivalry, couple, rel, relFam: 'family'|'romantic'|'friends'|'rivals',
  identity (both teams), money, broke, snapped, place, stretchKind, taskTypes, fails, side }`.
- `state.taskLog`: one row per team per task stretch per leg `{ leg, team, stretch, kind, side, who, attempts, fails,
  switched, quit, from, to }` (tasks.js; the attempts table is overwritten when a place repeats).

- [ ] Test: every catalogue scene of a played season has `data.snap` with every key; `snap.band` matches the bond at
  the scene (play a scene, change the bond, the snap holds); `taskLog` has one row per team per task per leg.
- [ ] FAIL → implement → PASS → commit `feat(rr): every scene keeps what it may know`.

### Task 2: Roles, slots and facts

**Files:** Create `js/rr/script/roles.js`, `js/rr/script/facts.js`. Test `tests/rr-script.test.js`.

**Produces:**
- `rolesOf(scene, state) -> { roles: {a,b,c,d,e,f}, ending, slots } | null`: by cast — `team` a,b = the two
  partners (a = the one the scene is about: the doer, the scared one, the lover); `teams` a,b = centre team, c,d =
  the other; `group` a..f = the seated; `local` adds slot `{local}` (a role word: "the driver", "the judge");
  `don` speaker `don`. Slots: `{identity}` `{identityB}` (team names), `{team}` `{teamB}`, `{place}`, `{task}`
  (the stretch label), `{side}`, `{partner}` of a, `{crush}`, `{target}`, `{reward}`, `{penalty}`, `{amount}`.
- `RR_FACT_KEYS` (the whitelist): ending, phase, early, late, band, bandX, allied, rival, couple, rel, relFam,
  identity, identityB, idGood, idBad (the task is one the identity is good/bad at), behind (rank > 0.66), ahead
  (rank < 0.33), broke, snapped, tod: 'night'|'morning'|'day'|'evening', stretchKind, fails (0|1|'many'), switched,
  quit, first (first meeting), place, cause (the kind that chained it), threadStep, register, registerB.
- `factsFor(scene, roles, state)` reads only `scene.data` and `scene.data.snap`.

- [ ] Test: roles for one scene of every cast; facts use only whitelisted keys; facts never change when live state
  changes after the scene.
- [ ] FAIL → implement → PASS → commit `feat(rr): who plays which part, and what a line may know`.

### Task 3: The writer, the pools' home, and the gates

**Files:** Create `js/rr/script/write.js`, `js/rr/script/lines/index.js`, `js/rr/script/identity.js`. Test
`tests/rr-dialogue.test.js`.

**Produces:**
- Pools keyed `<kind>.<ending>` with `<kind>.any`; entry `{ id, when?, place?, turns: [{ by, say|conf|beat, v?, id?,
  opt?, when?, keep? }] }`. `by` ∈ a..f, `don`, `local`.
- `writeScene(state, scene) -> { lines: [{kind, by, text, voice}], lineId } | null` — pickEntry with the ledger, the
  Challenge's `voicedLine` (archetype leads, the Fiore rule, two loud/odd lines a speaker), `fill`, the presence and
  needs checks, openers.
- **The identity layer** (`identity.js`): a turn `{ by: 'a', id: '<hook>' }` speaks the speaker's team identity line
  for that hook (hooks: `good`, `bad`, `win`, `struggle`, `lose`, `quit`, `about-friction`, `about-friend`,
  `arrive`, `mat-first`, `mat-last`, `elim`); a custom identity takes its voice identity's VOICE lines only; a team
  with no identity, or a hook with nothing, takes the turn's own `say`.
- **The relationship layer**: entries gated on `rel`/`relFam`; `voicedLine` prefers a `v.rel:<relFam>` variant
  when the speaker's team has one.
- **The gates** in `index.js` (run at load, like The Challenge's): `variantFails` (fragments, dropped meaning, stock,
  nameless) on every variant.
- **The rules test** (`rr-dialogue.test.js`): every catalogue kind with a pool has ≥2 no-`when` entries per pool;
  every `when` key is whitelisted; every token is a known role or slot; no real place names; no vote words; no head
  counts in group pools; no `{a}` in a line `a` says about themselves; an asking turn's `keep` words survive in
  every variant; every entry's turns are 3–12 long and a conversation entry (cast teams/team) 6–12.

- [ ] Test first with two hand-written pools (one partner kind, one Don kind), then the writer → PASS → commit.

### Task 4: The writers' brief (inline) and the first family ✍

**Files:** Create `docs/rr-writers-brief.md`. Pools `js/rr/script/lines/partners*.js`.

The brief every writer subagent gets, verbatim plus its family's part:
- the show and the situation comedy it lives on (research doc Parts 1–2: what Ridonculous scenes sound like, the
  contradictions between partners, Don);
- the format of a pool, the roles and slots of its cast, the facts it may gate on, the hooks;
- the rules (Global Constraints) and the §19.4 bug-class table, as a checklist to run on every entry;
- per kind: what happened, how each ending changes things (the catalogue row), what the speakers know;
- voice: base lines in plain speech, then `v` variants for the five families (sharp, dry, loud, soft, odd) on the
  turns that carry character, and `v['rel:<fam>']` where how siblings say it differs from how exes do;
- 3–5 entries per ending pool, 2+ with no `when`; length by moment (a tip read: 3–5 lines; a fight, a crush, a
  confession: 8–12).

Each writer returns a JS module; I run the rules test and the gates, send failures back with the lines and why, and
commit when green.

- [ ] ✍ Family 1 (partners, 26 kinds): the bulk of every episode.
- [ ] Rules test green; commit `feat(rr): the partners' lines`.

### Task 5: Every team at every task (task beats) ✍

**Files:** `js/rr/script/lines/tasks*.js`; director hook in Task 9.

- Kinds the director makes from `state.taskLog` (no engine scene needed): `task-start` (the tip read, the pick),
  `task-try` (endings `first-try`, `after-fails`, `struggling`, `switched`, `quit`), `task-done`, by task type
  (`when: { stretchKind, idGood, idBad, fails }`), with identity hooks.
- [ ] ✍ Pools; rules test; commit.

### Task 6: Teams together, rooms, romance ✍ (families 2, 3, 4)

- [ ] ✍ Pools; romance pools gated on `couple`/`threadStep` (a confession attempt that is interrupted is written
  as interrupted; a crush thread's step sets what they already admitted); commit.

### Task 7: Locals, money, information, sabotage, body, place ✍ (families 5–10)

- [ ] ✍ Pools; sabotage lines only from the doer's side when `seenBy` says the victim didn't see; commit.

### Task 8: Don, the twists, the interviews, the mat ✍ (families 11–13 + the mat ceremony)

- Don's voice: dry, bored, self-absorbed, mean in small ways, never an announcer; his place lines (`don-place`),
  the fake-out, the elimination, the Boomerang board, the rules read once.
- The mat ceremony writer (`js/rr/script/mat.js`): order, penalties, the reward, the elimination, the exit
  interview, the console, the goodbye kiss — in the real show's order.
- [ ] ✍ Pools; mat.js; commit.

### Task 9: The director

**Files:** Create `js/rr/story/director.js`. Test `tests/rr-director.test.js`.

**Produces:** `airLeg(state, legResult) -> { segments: [{ scene?, kind, stretch, t, place, teams, lines }] }`:
- candidates from the leg's scenes and the task log, tiered **must** (Don's opener, every mat placement, the
  elimination, twists, a sabotage seen, a betrayal, a blow-up, a confession, a medevac), **due** (every team's task
  beats: at least one per team per task stretch), **story** (thread steps, chains, the season's 3–4 followed arcs),
  **colour** (the rest), against a leg budget (my call: 55–75 scenes for 12 teams, scaling with teams racing);
- the season's followed arcs: the threads with the most aired steps, plus any thread one step from its payoff;
- cut by the clock (cross-cutting teams at the same minute), with the last two teams interleaved at the end when
  they are within 30 minutes (suspense), and the mat in arrival order;
- the §19.2 guards per leg (same two people ≤3 alone together, no warm scene after a fight that leg, one blow-up a
  team, one romance a person, nobody after they left);
- a chained scene never airs before its cause; a scene whose cause didn't air carries a recap beat.

- [ ] Tests: every team appears at every task stretch it ran; must-tier scenes all air; guards hold; aired order is
  non-decreasing in clock time except the interleave; budget respected → commit.

### Task 10: Previously, next time, and the episode text

**Files:** `js/rr/story/previously.js`, `js/rr/episode.js`, extend `js/rr/transcript.js`
(`episodeText(state, leg)` prints what aired, with lines). `npm run rr:read` writes `transcripts/rr-read-<seed>.txt`.

- [ ] Test: "previously" names only what aired; next time names nothing that hasn't happened; the text has every
  aired line → commit.

### Task 11: The season read loop (§19.3), three seasons

- [ ] Season 1, 2, 3 (12, 8, 18 teams; different routes): read each episode as a viewer, list every wrong line with
  why, fix where it belongs (§19.4), re-dump, commit per episode read. Writers get rewrites back with the exact lines.
- [ ] Audit additions: repetition per kind, the share of aired scenes per family, any kind×ending that aired with
  no pool → commit `test(rr): dialogue read-outs in the audit`.
