# Big Brother house life as storylines — design

Date: 2026-10-05. Status: approved in conversation, awaiting spec review.
Follows `2026-10-01-bb-dialogue-viewer-design.md` (the stepped viewer) and replaces
its House Life airing model.

## 1. Why

The user, reading real seasons, 2026-10-05:

> the conversation dont really make sense they always cut short or too short and
> they are often chronologically not reliable and nonsensical we need a big
> overhaul theres still no setup in a lot they just happens randomly for no reason

Every line in the user's pasted day 1 was traced to its source. The faults are
structural:

1. **House life is 22–30 unrelated snippets per stretch.** About 380 events in
   `js/bb-events/` each fire on their own weight and write their own 2–5 line
   exchange (`scheduleHouseBeats`, `houseAct` in `js/bb/week.js`). Nothing
   links one to the next. "Can you not make fun of me" fires with no mockery
   on record. "I'm sorry, I didn't mean it like that" fires with no offence.
2. **Lines presume a history nobody checked.** Pools written for mid-season
   fire on night one: "Where's the vote?" (`social.js`), "Explain your vote to
   me" (`talk.confront.calculated`), "everything Brightly said this week"
   (`scheme.js sx.3`).
3. **Multi-day stories collapse into one beat.** The kiss-trap scheme
   (`schemes.js kissTrap`) airs only its payoff confessional ("Hicks got Chase
   out of the room. I did the rest").
4. **The viewer merged anything sharing a person** into one "conversation"
   (`conversationsOf`, `js/vp-bb-ep/steps.js`). It also brought in speakers
   who were never staged.
5. **Recorded reasons can be false on screen.** A `genuine-deal` alliance on
   night one says "Everybody else's has fallen apart."

The patches of 2026-10-05 (`withSetups`, aside rules, the first-night
past-tense filter, `alliance.why.*`, pre-show couples at move-in) treat
symptoms. The unit is wrong: house life is built from snippets, not
conversations.

## 2. Decisions taken with the user

| Question | Decision |
|---|---|
| Depth | **Storylines**: house life is driven by storylines with cause, development and payoff |
| Density | **3–5 long scenes per stretch** between ceremonies, each about 8–20 lines (some kinds longer, §5) |
| Off-camera causes | **Allowed, but said plainly**: a scene that depends on something not shown opens with a confessional (or, failing that, a one-line caption) saying what happened |
| Approach | **A: a storyline layer over the existing events.** Events still decide every game consequence; the layer decides what airs and writes it |
| Writing | Whole scenes written as one piece, in the voice of real Big Brother houseguests, with a rhythm per kind of scene (§5); never repetitive (§6) |

## 3. Architecture

```
houseAct(phase)                          js/bb/week.js (unchanged order)
  scheduleHouseBeats(...)                22–30 events fire; consequences applied (unchanged)
  file each fired beat ──► storylines    js/bb/story/storylines.js   gs.bb.storylines
  director(stretch)    ──► 3–5 steps     js/bb/story/director.js
  write(step)          ──► act.scenes[]  js/bb/story/write.js + js/bb/story/lines/*.js
viewer (js/vp-bb-ep) and text backlog read act.scenes
```

### 3.1 Storylines (`js/bb/story/storylines.js`)

A storyline is a thread the house is living through:

```
{ id, type, people: [..], since: {week, phase}, status: 'live' | 'resolved',
  steps: [{ step, week, phase, beatId, eventId, outcome, seenBy: [..],
            aired: bool, facts: {...} }],
  data: { allianceId?, showmanceId?, schemeId?, target?, ... } }
```

The first types are listed below. Each has named steps, and a step may
require earlier ones.

| Type | Keyed by | Steps (in order) |
|---|---|---|
| `alliance` | alliance id | pitch → formed → recruit → crack → betrayal / collapse |
| `feud` | pair | friction → argument → apology (accepted / refused) or war → truce |
| `showmance` | showmance id | spark → flirt → declaration → hiding → strain → breakup |
| `target` | (hunter, target) | doubt → case-building → pitch to others → block / backdoor talk |
| `vote` | week | count → check → flip / hold → fallout |
| `scheme` | scheme id | plan → lure / setup → execution → discovery / fallout |
| `lie` | (liar, claim) | told → doubted → caught |
| `tie` | kinship pair | arrival (move-in) → keeping it secret → suspicion → reveal |
| `life` | room / day | banter, homesickness, chores, bits (single-step, self-contained) |

Every fired beat is filed by a `file(beat)` function, one per event family. It
names the storyline and the step. A beat that names no storyline counts as
`life` if self-contained; otherwise it stays off camera. The store
serialises with the season (plain data). Old seasons without it still play,
because the viewer falls back to the snippet view (§7).

### 3.2 Director (`js/bb/story/director.js`)

At the end of each stretch:

1. Candidates: every storyline that gained a step this stretch.
2. Rank by stakes: the step's drama, the people's screen presence
   (`spotlightOrder`), whether it pays off an aired setup, and variety (no
   two scenes of the same type back to back, no person in more than two scenes
   a stretch).
3. Keep a step only if it can be **understood**: every earlier step it
   depends on aired, or can be recapped from a recorded fact (§4.3).
4. Take 3–5. The rest stay off camera; their consequences already happened.

### 3.3 Determinism

The words draw from their own `stableRng`, as now, never the engine's dice. The
same seed gives the same season. `tests/bb-talk.test.js` (a season played muted
must match one played with words) keeps proving this. The one intentional
change to what fires is §4.1.

## 4. Causes

### 4.1 An event needs its cause on record (engine)

A reaction event declares `needs(house, ctx)`. Its weight is 0 when the need is
unmet. Needs read the existing memory (`api.remember`, `remembers`, `grudge`,
`worstMemory` in `js/bb-events/_read.js`), the week history and the
storylines.

| Event kind | Needs |
|---|---|
| apology | an offence on record between the pair |
| "stop making fun of me" | a joke at their expense that landed badly |
| vote confrontation | a vote has happened and the ballot broke a promise |
| exposure ("none of it fits") | the person told two different stories, on record |
| scheme payoff | the plan and setup steps, on earlier days |
| alliance naming | the pitch or bonding step |
| comfort | a cause: nominated, betrayed, a fight |

Schemes become multi-step storylines across days instead of one beat. This
moves which events fire. Before shipping, measure with `npm run audit:bb-comps`
and the alliance and vote audits against the current baseline.

### 4.2 No line presumes a past the house has not had (writing)

A pool entry may carry `presumes: [...]` from a fixed list:
- `vote`: an eviction vote has happened;
- `week`: a week has passed;
- `hoh`: an HOH exists;
- `evicted`: somebody has left;
- `history`: the pair has a recorded past.

The writer skips entries whose presumptions are false. A guard scans every
pool for tell-tale words (yesterday, last night, this week, your vote, the
block, last time, again, used to…). It fails any entry that uses one without
the matching tag. Existing pools are tagged once, and the guard stops drift.

### 4.3 Saying an off-camera cause plainly

When a step depends on an unaired step, the scene opens with a confessional by
a participant who knows the cause. It says who did what to whom, and when,
built only from the recorded fact. Example:

> **Caleb · DR:** Millie made a joke about my job last night. In front of
> everybody. And everybody laughed.

If no participant would say it, a one-line caption does instead. A recap is
never invented. It has no source but the memory record.

### 4.4 Week one

On move-in night the only history is pre-show ties and move-in itself. The
first stretch's storylines can only start things: first impressions, a pitch,
a couple keeping their secret, someone left out.

## 5. Writing

### 5.1 Research and the style guide

Before any pool is written, `docs/bb-dialogue-style.md` is compiled from real
transcripts. BB22 episodes 20 and 21 have been read (subslikescript.com). Read
more first: a premiere (strangers meeting), a big fight episode, a showmance
episode, a double eviction. Patterns found so far:

1. Strategy talk is short turns: "Yeah." "Okay." "For real?" "It's done."
2. Constant checking: "You swear, David?" / "I'm done. It's done."
3. Repetition for emphasis: "Lock them. Keep them locked. Lock them."
4. Specifics over feelings-words: vote counts, names, who shook on what.
5. Fillers and hedges: "I mean", "like", "literally", "at the end of the
   day", "I'm just saying".
6. Affection through mock insult: "You're going to make me cry. You are the
   worst. I hate you so much."
7. A visible purpose and procedure: "Can I talk to you?" / "You want to
   talk?" / "Yeah."
8. Pushback on logic: "So why are we going to backdoor him? No, come on."
9. The Diary Room carries the why and the gap between said and meant.
10. Scenes chain through people: what one person learns, the next scene
    carries.

### 5.2 A rhythm per kind of scene

| Kind | Rhythm |
|---|---|
| strategy check / vote count | short turns, confirming, repeating, specifics |
| big argument | starts low and escalates; long turns listing grievances; interruptions ("—"); talking past each other; the room reacting; walking out mid-line; a parting shot; 12–30 lines |
| declaration / heart-to-heart | slow; one long, halting, honest turn; pauses as stage directions; a joke to break tension; built from the couple's own aired history |
| pitch | one long persuasive turn laying out the plan, then careful questions |
| breakdown / goodbye | long fragmented turns trailing off; the comforter says less |
| banter / bits | rapid riffs on the line before; the group joins in |
| group meeting | four or five voices, side comments, one person trying to run it |

### 5.3 Scene form

- A scene is **one storyline step**, written **whole**: 8–20 lines (arguments
  and heart-to-hearts may run longer), every line answering the one before.
  Scenes are never assembled from independently written parts.
- Pool key: `story.<type>.<step>.<outcome>`. Entries filter on facts: the
  pair's band (friends / cold / enemies), the speakers' registers, room,
  third person present, `presumes`.
- Slots for specifics from the record: `{target}`, `{count}`, `{comp}`,
  `{lastVote}`, `{said}` (a recorded remark), `{when}` (last night / this
  morning / at the veto meeting), `{room}`. Specifics are what make two
  scenes of the same step read differently.
- Core lines carry register variants (schemer, fiery, shy, sweet, competitor,
  cool, plain), so the same scene in two mouths sounds different.
- Staging: who goes looking for whom, and why; a third person on stage only if
  the engine recorded them as a witness.
- Confessionals: one or two from people in the scene, about this scene only,
  saying only what they know (existing witness rules).
- The user's standing rules apply: real spoken dialogue, plain fluent English,
  jokes that land on first read, no invented family or pets.

## 6. Repetition

A season airs roughly 150–250 scenes. Four layers:

1. **Pool size by measured frequency.** A full-season sweep counts how often
   each `story.<type>.<step>.<outcome>` airs. Each pool carries comfortably
   more entries than its 95th-percentile count per season.
2. **The picker's existing rules** (`js/script/pick.js`): never the same entry
   for the same pair, never the same sentence twice in one act, steep decay
   for reuse across a season.
3. **Register variants and specific slots** (§5.3).
4. **A repetition audit** over full seasons, with thresholds that must pass:
   - entry reuse per season;
   - sentence reuse per season;
   - shared word runs (five or more identical words) between any two scenes.

   It also checks rhythm against the transcripts: mean words per turn and the
   share of short replies per scene kind.

## 7. Viewer and transcript

- `bbWeekSteps` builds one House Life screen per stretch from `act.scenes`.
  Each scene sets its room, cast, camera and music (bed by scene kind).
  Confessionals cut to the Diary Room set.
- `conversationsOf` and the snippet airing (`chooseAired`, `withSetups`) are
  kept only for seasons saved without `act.scenes`, and for the toggle while
  the new view beds in. They are removed when every storyline type has
  landed.
- The text backlog writes the same scenes line for line, before
  `_textCampPost` (project rule).

## 8. Guards

1. Every aired scene's cause is on record and on screen (aired earlier, or
   recapped).
2. `presumes` guard (§4.2).
3. Witness rules: nobody says what they could not know.
4. Repetition audit thresholds (§6).
5. Rhythm per scene kind (§6).
6. Muted-words parity (`tests/bb-talk.test.js`).
7. Act coverage and render completeness, extended to `act.scenes`.

Every storyline type also ends with a printed real-roster season, read in
full. Most real defects on this project were found by reading output, not by a
suite going red.

## 9. Build order

1. Research: more transcripts → `docs/bb-dialogue-style.md`.
2. Storyline store, filing, `needs` gates, `presumes` tags and guard.
3. Director, `act.scenes`, viewer and backlog reading them; the toggle.
4. Storyline types, most common first, each written, read, audited, committed
   and pushed:
   - alliance;
   - feud;
   - showmance;
   - target and vote talk;
   - schemes;
   - pre-show ties;
   - everyday life.
5. Remove the snippet view.

## 10. Out of scope

- Ceremonies, competitions and twist sets (Phase 7) keep their stepped screens.
  Their own lines are not rewritten here, though the `presumes` guard covers
  their pools too.
- Other shows. The storyline layer is Big Brother's. Whether The Traitors or
  Drag Race want it is a later question.
