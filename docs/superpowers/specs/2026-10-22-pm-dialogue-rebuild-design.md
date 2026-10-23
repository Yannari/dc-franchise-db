# Perfect Match: the dialogue rebuilt from scratch

Decided with the user, 2026-10-22. Read with `docs/ADDING-A-SHOW.md` §19 (Perfect Match is type D:
couples on the type A director) and the memory `project_pm_dialogue_rebuild`.

## 1. Why

The user, reading played seasons: the conversations are "really bad and only 1-2 sentences", "written
like it's been badly translated from another language", "everything is out of nowhere, no directing
line", "watch a Love Island transcript". Not salvageable: rebuild, and keep the volume, because the
volume is what kept a season from repeating itself.

Measured (2026-10-22):

| | Perfect Match now | Love Island (920 speaker turns, 14 official clips) |
|---|---|---|
| words a turn | 6.5 | 14.5 (median 8) |
| turns of 10+ words | rare | 43% (12% are 30+) |
| turns a conversation | median 2, p90 4 | 15-40 |
| why the scene happens | nothing: each event is an independent random draw | always something earlier ("How was your chat with Shakira?") |

The cause is structural, not only the words: `events.js generateEpisodeEvents` draws every event as an
independent weighted kind with a fresh cast, and `makeEvent` writes its script on the spot, so no line
can know what the day is about.

## 2. What the user decided

- **A mix.** A director plus scenes built from movements for the everyday conversations; whole
  hand-written scripts for the big moments (rows, declarations, Casa returns, dumpings, Movie Night,
  recouplings).
- **Everyday conversations are long too** ("not just for ceremonies, for everyday too").
- **Tiers.** About 125 engine events an episode, about 90 aired (the public ledger, unchanged). What is
  WRITTEN: ~20-25 FEATURED scenes (15-30 turns), ~25-35 SHORT scenes (4-8 turns), the rest a one-line
  "meanwhile" note plus the reader. ~600-900 clicks an episode.
- **The old voice overlays are retired** (`js/pm/lines/voices/`, batches 1-168). Personality chooses
  movements and has whole options of its own; never a clipped or shouted copy of a neutral line.
- **Everything before the first read**, ceremonies included.

## 3. How real Love Island talks (the study, 66 official clips)

Material: official channel clips, subtitles only, in the session scratchpad (`litx/`). Studied, never
copied: no line from a transcript goes into the game.

**The chat.** "You okay? / Yeah, you?" → a question with a purpose, tied to something that happened
("How was your chat with X?", "What are you looking for in here?", "Who've you got your eye on?") → a long
answer that rambles and restarts ("like", "to be fair", "you know what I mean?", "honestly") → a probe or
a tease → the turn (reassure / keep options open / flirt back / shut it down) → a close ("I'm excited for
bed tonight", a kiss, "go on then, back to the others").

**The morning debrief.** Girls on the daybeds or the boys on the terrace. "Tell us everything" → a
concrete detail ("he just put his arm round me") → teasing ("look at the smile on you") → each person's
own status in a line or two → banter.

**A row.** Its cause is quoted ("you said 'it'd be interesting to see if she's all mouth'") → denial or
minimising ("it was a miscommunication") → "you said what you said" → a friend mediates ("just
apologise") → a walk-off → both sides picked over by the group, then the beach hut from each side.

**A bombshell.** Hyped introductions (age, job, how long single, their type), the boys getting
territorial, "what's your plan?", first impressions in the hut.

**A thread across days.** One couple: catch-up → first kiss → "I'm catching feelings" → reassurance after
a date with someone else → the "are we exclusive?" talk → support after an accusation at the fire pit.

**Texture.** Short reactions between long turns ("Mhm", "Stop", "No way", "Shut up"). Jokes come from the
moment ("What if I say no?" / "Then I'll call Sammy"). The narrator's comic aside sits over the scene. A
beach hut is one feeling and its reason, then often a joke.

## 4. The architecture

### 4.1 The engine keeps deciding; it stops writing

- `makeEvent` stops calling `scriptFor`, `hutFor` and `narratorFor`. It stores what the words will need,
  at fire time: `ev.facts` (the `factsFor` result for its cast), the ending (`ev.extra.close`, already
  decided here), the moods and feelings (already kept).
- **Threads in the event stream.** The day generator stops being blind: after an aired event, its
  follow-ups gain weight for the people in it later that day and the next (a pull → the partner's
  "how was your chat?" and a girls' or boys' debrief about it; a row → clear-the-air or a cold shoulder;
  a kiss → a debrief; a bombshell → the boys' reaction and a pull). Follow-ups are real events with
  their own consequences, as every event must have. This reshuffles every season, which is accepted
  for a rebuild.

### 4.2 The director (`js/pm/story/director.js`), once an episode, at its end

1. **Threads.** Group the episode's events (and the last two episodes') by the pair or storyline they
   belong to: a couple, a pull and its fallout, a row, a bombshell, a rivalry, triangle, game or arc
   (those systems already tag their events).
2. **Tiers.** Score each thread by heat (secrets, majors, firsts, rows, arrivals) and give the episode an
   A, B and C story. Their events become FEATURED; colour from the rest becomes SHORT; everything else is
   a NOTE (a one-line "meanwhile"). Ceremonies and their parts are always featured.
3. **Causes.** Each featured or short scene gets `cause` facts: the earlier event in its thread that
   aired, said the way people say it ("your chat with Valentina", "what Georgia said at the fire pit",
   "last night in the Hideaway"). A callback is only allowed when that event aired before this one.
4. **Order.** Within a part of the day, a thread's scenes run in cause order; threads interleave the
   way an edit does (A, B, A, C, A).
5. **Writing.** Scripts are written now, in that order, so an earlier scene's words exist for a later
   quote (Movie Night clips, a declaration quoting a moment). The episode's random stream for words
   (`scriptRng`) keeps prose from moving any result.
6. **The guards** from §19.2.4 that fit a villa: nobody who has left talks; no warm scene for a pair on
   the day they rowed, before the row is made up; no apology before the row; the same moment between
   the same two people once a day; one romance a person a day.

### 4.3 The writer: movements and whole scripts

**Movements** (everyday featured scenes). A conversation kind is a plan: an ordered list of movement
slots, each a pool of multi-turn exchanges (2-8 turns each) chosen by facts and personality.

```
chat (a pulls b):     open → purpose → answer → probe → [tangent] → turn → close
debrief (group):      open → recount → tease → round (each person's status) → [banter] → close
friendship (2-4):     open → topic → [story] → back-and-forth → close
loyalty (partners):   open → the worry (cause) → reassurance → [tease] → promise → close
deep chat:            open → the question → long answer → their answer → what it means → close
```

- Every movement entry is written for its POSITION: it answers the movement before it. A slot's pool
  has entries keyed on what the previous slot decided (the answer's stance, the ending), so seams don't
  show.
- `[tangent]` and `[banter]` are optional: they make length and comedy without changing the outcome.
- Personality: entries carry `when` on persona, intent, voice tags and mood; a flirty probe, a blunt
  probe, a nervous answer are whole options, not variants of one line.
- The ending the engine decided (`ev.extra.close`) picks the turn and the close. Words never decide.

**Whole scripts** (big moments and short scenes): one entry, start to finish, 15-40 turns for big
moments, 4-8 for short scenes, gated by facts. Rows, declarations, exclusive and official asks, Casa
returns, dumpings and their build-up, Movie Night reactions, recouplings, the final, the reunion.

**Beach hut and narrator** are rewritten in the same register: the hut says one feeling and its reason
about THIS scene's cause; the narrator's line is a comic aside on what just aired.

### 4.4 The words (`docs/pm-dialogue-style.md`)

Casual Love Island English. UK by default; the dialect slots stay (`{~mate}`, `{~yeah}`), so US, Irish,
Australian and second-language islanders still sound like themselves. Long, loose answers with
restarts and fillers; short reactions between; every scene names its subject; nobody knows what they
did not see; no essay register, no quoting a line back, no invented backstory. The bug classes in
ADDING-A-SHOW §19.4 all apply.

### 4.5 The viewer and the backlog

- `vp-pm/steps.js` plays the director's order. A NOTE is a single caption step ("Meanwhile, Kai and
  Freya make breakfast together") with no clicks inside it.
- `transcript.js` prints featured and short scenes in full and notes as one line; unaired events stay
  in the reader with "didn't air".

## 5. Volume

| tier | a season (≈25 episodes) | written as |
|---|---|---|
| featured everyday | ~550 scenes | movements: ~5 slots × pools of ~40-120 entries each per kind |
| big moments | ~200 scenes | whole scripts, 3+ per gate |
| short | ~750 scenes | whole short scripts |
| notes | the rest | one-line templates per kind |

Repetition rules carry over from `pickScript` (nobody says the same thing twice in a season; an entry
airs once a season; least-aired comes back when a needed pool runs dry), applied per movement. Measured
with a pool-wear probe over four seasons, like TD's.

## 6. Build order (everything before the user's first read)

1. Style guide from the study (`docs/pm-dialogue-style.md`).
2. Plumbing: facts stored at fire time, scripts written at episode end by the director, tiers, the note
   step in the viewer and the transcript. The old pools stay as the fallback while new ones grow.
3. The director: threads, tiers, causes, order; follow-up weighting in the day generator.
4. Movement plans and pools for the most-aired kinds first: chat/pull, friendship, loyalty, kiss,
   deep chat, debrief, gossip, comedy, comfort/advice, argument, ick.
5. Every other kind: whole scripts for big moments and ceremonies, short scripts, notes.
6. Beach hut and narrator.
7. Delete the old pools and the voice overlays; tests rewritten for the new shapes.
8. The season-read loop (§19.3) on the user's own cast until it reads like Love Island; then hand it over.

## 7. Tests that hold it

- Conversation shape: featured scenes ≥ 12 turns; the share of turns ≥ 10 words near the transcripts'.
- Every featured scene has a cause, and the cause aired before it.
- No line names a person who has left, a scene that hasn't aired, or a place the scene isn't in.
- Readability: no fragment strings, no sentence cut to a word or two (the `unreadable` rule).
- Pool wear over four seasons under a ceiling.
- The `pm-lines` well-formedness rules (ids, speakers, facts, slots, regional words, other shows' words).

## 8. Status (2026-10-22, built)

Everything in §6 is built except deleting the old pools outright (see below).

- **Director:** `js/pm/story/director.js` — tiers (decided as each scene fires, not at
  episode end: the engine's later scenes, Movie Night and the reunion read earlier
  scenes' words), `after` causes per talk file, registers from voice tags.
- **Writer:** `js/pm/talk/` — 90+ kinds as movement files (`build`, `extend` for the
  measured extra pools in `talk/more/`), `leads` (a fact that must lead: `rowedToday`),
  `stages` (a short scene that opens on dialogue still says where it is), notMorning
  (a line assuming the day is under way never plays at breakfast), `tiered: false`
  for ceremonies and storylines.
- **Voice overlays retired** (168 batches deleted); voice picks whole movements.
- **Measured** on the user's Season 1 cast: ~22 featured / ~20 short / ~50 notes and
  550-800 clicks an episode; 10.1 words a turn (32% at 10+, against Love Island's 43%:
  openers and reactions are short by nature); 89% of aired lines from the new files.
- **Kept on purpose:** the old pools that still read well and are mostly ceremony beats
  or games (intro tapes, the host at the fire pit, challenges and kiss games, Movie
  Night reactions, the blow-up thread, votes and grudges, the final's film). They pass
  every rule in tests/pm-lines.test.js, including the brand-name guard.
- **Guards:** tests/pm-talk.test.js (plans, placeholders, regional words, other shows'
  words, brands, fragments, a played season's misses and length), tests/pm-script.test.js
  (making-up follows a real row, "thanks for yesterday" follows a real yesterday).
