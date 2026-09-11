# Writing prompt — the cold open is the same night

Hand this whole file to the writing model. It is self-contained; the repo is
needed to make the edits, not to understand the assignment.

**14 events, 24 lines to change.** This is not new writing and not a rewrite.
It is a **clock change**: the scenes are right, the beats are right, the
characters are right, and they are all happening several hours too late.

---

## The mistake

The cold open is the queens walking back into the werk room **minutes after
the elimination**. Still in drag. Still in the shoes. The station of whoever
just left is still warm, the lipstick is still wet on the mirror, and nobody
has been to bed.

It was written as the next morning. `week.js` said so in its own comment —
*"the cold open is the morning AFTER an elimination"* — and the pool followed
it faithfully: "morning", "coffee", "by lunch", "she never took the makeup
off". Meanwhile `werk-morning` is **also** the morning; it is the very next
card on screen, subtitled "morning". A season played the same time of day
twice and the first one was in the wrong clothes.

Found by reading a rendered episode. Nothing was broken and no test could
see it.

Four events that were really about a working day rather than about a
departure have already **moved** to `werk-morning` — `nickname`,
`settling-in`, `coffee-and-silence`, `still-in-last-nights-face`. You do not
need to touch those. The fourteen below belong in the cold open; they just
need to be happening tonight.

---

## 0. THE HOUSE RULES

1. **Change the clock, keep the beat.** Do not rewrite a line into a different
   scene. Same characters, same action, same consequence, same length, same
   joke if there is one — moved from the next morning to twenty minutes ago.
2. **Only touch the lines that are wrong.** Each event below says how many.
   The others in the same pool are already right and must be left alone.
3. **Fix the `note` too where it is flagged.** It is drawn on the card as the
   subtitle, so "The morning after…" is on screen.
4. **`{a}` `{b}` `{c}` are the queens.** Never write a real name.
5. **Prose, over 80 characters**, in the werk room's register — intimate and
   funny, looser than the main stage. Match the pool you are in.
6. Nothing else changes: not `id`, not `slot`, not `when`, not `effects`.

## 1. What replaces what

The banned words are `morning`, `coffee`, `breakfast`, `by lunch`,
`overnight`, `slept`, `asleep`, `woke`, `tomorrow`, `next day`, `yesterday`,
`last night`, `all night`. A guard lists them
(`tests/dr-cold-open-clock.test.js`).

`last night` and `yesterday` are on that list for the same reason `morning`
is: **the elimination was an hour ago.** It is not last night. It is tonight,
and it is still going.

What you have instead, and it is richer than what you are losing:

- **They are still in drag.** Corsets, heels, a full face, and nobody has
  changed. That is the single most useful detail this slot has and the old
  version threw it away by putting everyone in the morning.
- **The room is too bright and too quiet.** They have come from a stage.
- **The physical comedy of undressing** while having a serious conversation —
  lashes, wigs on heads, somebody talking through a mouthful of hairpins.
- **Nobody has processed it yet.** The morning-after version let queens
  arrive with a settled opinion. Tonight they do not have one, and reaching
  for one out loud is better than having it.
- **It is late.** Exhaustion, adrenaline, the particular honesty of both.

A good rule for a swap: if the line says *"by lunch somebody had put a wig
head on the chair"*, the same joke tonight is somebody doing it **now**,
while the others watch, because nobody can look at the empty chair yet.

---

## 2. The fourteen

| event | cast | lines | lines to fix | the word that gives it away |
|---|---|---|---|---|
| `winner-glow` | solo | 4 | **1** |  |
| `bottom-hangover` | solo | 4 | **2** |  |
| `chaotic-good` | solo | 4 | **2** |  |
| `the-empty-station` | solo | 4 | **0** | last night (in the note too) |
| `the-mirror-message` | solo | 4 | **1** |  |
| `relief-and-guilt` | solo | 4 | **3** |  |
| `one-less-friend` | solo | 4 | **2** |  |
| `one-less-enemy` | solo | 4 | **1** |  |
| `unpacking-the-night` | pair | 4 | **4** |  |
| `frontrunner-cooling` | solo | 4 | **1** |  |
| `never-in-the-bottom` | solo | 4 | **2** |  |
| `bottom-solidarity` | pair | 4 | **1** |  |
| `someone-is-missing` | group | 4 | **3** | morning (in the note too) |
| `the-empty-chair` | pair | 4 | **1** |  |

---

### `winner-glow`

*Last week she won, and she walks back into the room differently.*

1 of 4 lines are on the wrong clock. One of them:

> Different energy to {a} this morning. Arrived first, set up without rushing, been humming since she sat down. She looks lighter. She looks like a queen who proved something last week and is still carrying the proof.

### `bottom-hangover`

*She survived the lip sync and has to walk back in and be normal.*

2 of 4 lines are on the wrong clock. One of them:

> {a} is back and trying to be normal about it, which means she is not normal about it. Laughs too hard at the first joke, works too fast, talks too much. The lip sync was last night and it is still in her body — the adrenaline, the relief, the fear she will be …

### `chaotic-good`

*She does something completely unhinged and harmless and everyone loves it.*

2 of 4 lines are on the wrong clock. One of them:

> {a} arrives wearing the wig from last night’s runway as a hat — upside down, sunglasses perched on top. Acts like nothing is unusual. Pours coffee into a mug that says something unprintable. Starts the day like this is a normal person doing a normal thing.

### `the-empty-station`

*She looks at the station of whoever went home last night.*

0 of 4 lines are on the wrong clock. One of them:

> One station emptier and nobody has said so. {a} keeps almost looking at it. When she finally does, it is only for a second, then she picks her own brush up like nothing happened. That is what the room does now.

### `the-mirror-message`

*She reads the message the eliminated queen left in lipstick.*

1 of 4 lines are on the wrong clock. One of them:

> {a} is the one who reads the mirror message out loud, because someone has to. Reads it clearly, no commentary, and the room is quiet for a moment that belongs to the queen who left it. Nobody touches the mirror for the rest of the morning.

### `relief-and-guilt`

*She is glad it was not her and hates being glad.*

3 of 4 lines are on the wrong clock. One of them:

> First thing {a} feels sitting down this morning is glad. Second thing is ashamed of being glad. She was in the bottom. She stayed. The other queen went home. Somewhere in the middle of that is a person who is grateful it was not her, and she does not like …

### `one-less-friend`

*The queen who went home was the one she was closest to.*

2 of 4 lines are on the wrong clock. One of them:

> The queen who went home was the one {a} sat with, ate with, talked to at the end of every day. {a} looks at the empty station and does not cry, which is somehow more noticeable. She moves through the morning like she is looking for someone who is not there. …

### `one-less-enemy`

*The queen who went home was the one she could not stand, and she is not pretending otherwise.*

1 of 4 lines are on the wrong clock. One of them:

> The station is empty and {a} is lighter this morning. Physically lighter, like she has been carrying something that just got put down. She does not say anything unkind. She does not have to. The absence of grief is loud enough.

### `unpacking-the-night`

*They go back over what happened on the main stage, still processing it.*

4 of 4 lines are on the wrong clock. One of them:

> {a} and {b} are still processing last night. "Did you see her face when they called the bottom?" They go through it moment by moment — the call, the reaction, the lip sync, the decision — trying to make sense of it now that the adrenaline is gone.

### `frontrunner-cooling`

*She was the one to beat and has not been called in weeks.*

1 of 4 lines are on the wrong clock. One of them:

> {a} won twice early and has not been called since. She is doing the arithmetic in the mirror this morning. Nobody has said anything. Nobody needs to. She knows what a cooling frontrunner looks like.

### `never-in-the-bottom`

*She has never stood in the bottom, and it has started to frighten her.*

2 of 4 lines are on the wrong clock. One of them:

> {a} has never been in the bottom. Not once. She used to say that with her chest. This morning she says it to the mirror and hears how it sounds: untested. Everyone left has fought for her spot at least once. She has not.

### `bottom-solidarity`

*Two queens who have both been down there find each other.*

1 of 4 lines are on the wrong clock. One of them:

> {a} and {b} have both stood in that bottom and neither has to explain what the walk back feels like. They end up at the same station at the same hour for the third morning running. Neither planned it. Both needed it.

### `someone-is-missing`

*The morning after, and the room is arranged around a gap.*

3 of 4 lines are on the wrong clock. One of them:

> The station is still there. {a} sets her bag down two stations over and does not look at it. {b} puts a coffee on the empty counter like it is an altar offering and {c} says "girl, she is not dead" but does not move it, and by lunch somebody has parked a wig …

### `the-empty-chair`

*{a} and {b} both look at the station and neither of them takes it, and the not-taking goes on for the rest of the day.*

1 of 4 lines are on the wrong clock. One of them:

> The chair is there and nobody is in it. {a} and {b} both see it at the same time. Hits different when it is real — the person who sat there yesterday is gone and the room is one voice quieter. They look at each other. Look away.

---

## 3. When you are done

```
npx vitest run tests/dr-cold-open-clock.test.js tests/dr-werk-events.test.js
```

`dr-cold-open-clock` currently **reports** the backlog rather than failing on
it. When the count reaches zero, open that file and flip the reporting test
to a real assertion — the comment in it says exactly how. A reporting test
that is never flipped is a rule that has quietly stopped being one.

Then read a rendered cold open end to end. The thing to check is that it
sounds like people who have just walked off a stage, not people who have had
a night's sleep and a coffee:

```
npm run audit:dr-spec
```
