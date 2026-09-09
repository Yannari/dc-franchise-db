# Writing prompt — the Rumix and the Music Video

Hand this whole file to the writing model. Everything it needs to know is in
here; it should not have to open the repo to understand the assignment, though
it will need the repo to make the edits.

The engine for both challenges is built and shipped. **Only the prose is
missing.** Every pool below exists, is wired, and is currently EMPTY — the
Rumix and the music video are narrating with the `generic` fallback wording,
which reads as "a performance" instead of "this performance". That is the whole
job: replace the fallback with words that could only be about this challenge.

---

## 1. What these two challenges ARE

They used to be the same challenge. `js/dr/maxi.js` mapped `girl-group`,
`rumix` and `music-video` to one module, so all three ran the same draft, prep,
performance and prose. They have their own modules now, and the words have to
catch up.

### The Rumix — `js/dr/chal/rumix.js`

The wiki calls it the **Verse Challenge**. Every queen writes and records her
own verse to one track, and then performs it **live on the main stage** with
choreography. There are **no teams**. Nobody shares a score with anybody.

Four things happen, in this order, and the prose should know all four:

1. **The order is contested.** Queens choose which verse slot they want.
   Closing the track is the hard one and opening it is the other hard one —
   the opener has to establish a song nobody has heard yet, the closer has to
   land after everybody else already has. The middle is where nothing much
   happens to you either way. A bold queen wants to close; a nervous one wants
   the middle.
2. **She writes four bars in the werk room.** Each bar is scored separately, so
   "one great line and three nothings" is a real shape. A **hook** is one bar
   clearly better than her own others — not a good average, a line the room
   repeats. Bars below the filler line are filler and the panel counts them.
3. **She records it in a booth with a vocal coach.** THE PANEL HEARS THE
   RECORDING. A good session can lift a weak verse; it cannot invent one. A bad
   session can lose a verse she genuinely wrote. Both directions fire.
4. **She performs it live** to her own vocal, with choreography. The verse is
   already on tape and cannot be improved here — what is decided on the stage
   is whether she can stand inside it.

### The Music Video — `js/dr/chal/music-video.js`

The whole cast shoots one video. It is **taped and played back** to the panel;
she cannot fix it on stage. There are **no teams**.

1. **She does not choose.** The host casts it — lead down to ensemble — and the
   screen shows a CALL SHEET, not a draft. Occasionally the host deliberately
   hands a big part to a queen who has been safe for weeks. "You were GIVEN the
   lead and did nothing with it" is a different critique from "you took it",
   and this format only produces the first one.
2. **The studio day is the challenge.** She shoots with a **director** who is
   not on the panel and does not score her. He forms an impression of how she
   was to work with — did she read the note, could she do the thing he asked
   for, did she come apart on the ninth take, did she argue — and **he tells
   the panel**. This is the only challenge in the show where flopping the prep
   costs her on the main stage.
3. **Being findable** is the whole risk of a small part. A queen in the
   ensemble who never finds the camera is not in the video at all.
4. **Takes** are counted. Not a score — a fact about her day.

---

## 2. THE HOUSE RULES. Read these before writing a word.

These are not style preferences. Breaking any of them ships a bug.

- **`{a}` is the queen. `{b}` is the other queen** in a two-person event. Never
  write a name into a pool — names are filled at render time.
- **`{j}` is the judge, `{c}` the challenge name, `{o}` her drag style, `{p}`
  her problem** — in the critique pools only, matching the existing entries.
- **No real people and no real places.** This universe has no celebrities
  outside its own reality shows.
- **This show's words only.** No "evicted", no "voted out", no "tribe", no
  "houseguest", no "camp". There is no vote in this show at all — the panel
  ranks and the host decides. Any sentence implying otherwise is a bug, and
  `tests/dr-*.test.js` will catch it.
- **Never name a stat or a number.** Not "her boldness", not "a seven".
- **Prose, not captions.** Look at what is already in these files: full
  sentences with a rhythm, two to four of them, that read like somebody
  watching. Not bullet points with a full stop.
- **Four genuinely different variants per tier**, minimum — six or eight where
  the note below says so. Different *content*, not the same sentence reworded.
  These fire once per queen per episode, so a repeat is visible immediately.
- **Write the craft seriously.** This is the thing the queens came to do. A
  collapse should be painful to read; an extraordinary should feel like the
  clip that gets posted.
- **Fill the `lines` arrays and change nothing else.** Do not touch `id`,
  `note`, `family`, `serves`, `label`, or any field name.

---

## 3. Exactly what to fill in

Six pools across five files. Every one already has its entry with a `note`
telling you what that slot is for — the note is the spec, follow it.

### A. `js/dr/data/maxi-performance.js` — the per-queen performance beat

The biggest and most important job. **Fires once per queen, every episode**, so
it is the most-read prose in the show and the most obvious when it repeats.

Two families: `family: 'rumix'` and `family: 'music-video'`. Each has five
tiers — `extraordinary`, `strong`, `competent`, `struggling`, `collapse` — and
each tier needs **4 lines**. That is **40 paragraphs**.

Tier notes are already written. Read `family: 'girl-group'` and
`family: 'snatch-game'` in the same file for the register and the length.

The tier is her rank in the room tonight, not an absolute score, so
`competent` means "mid-pack" rather than "adequate".

### B. `js/dr/data/brief-voices.js` — the announcement and how it lands

`fam('rumix', ...)` and `fam('music-video', ...)`. Each needs:

- `tier('brief', ...)` — **4 lines**, how the host explains this challenge.
- `tier('delighted', ...)`, `tier('braced', ...)`, `tier('dreading', ...)` —
  **4 lines each**, how it lands on a queen whose craft suits it well, middling,
  or badly. Third person, werk room, she has not performed yet.

That is **16 lines per family, 32 total**.

### C. `js/dr/data/maxi-voices.js` — the host's walkthrough

`walk('rumix', ...)` and `walk('music-video', ...)`. **8 lines each** — the
floor is higher here because it fires once per queen and a thirteen-queen room
exhausts a small pool and starts repeating verbatim. That has happened before
in this file and the comment above the pool says so.

The host stops at her station and gives a note. Sometimes she is right and the
queen ignores it; sometimes she is wrong and the queen takes it. Do not resolve
which — the engine decides that, the line just has to work either way.

**16 lines.**

### D. `js/dr/data/critique-voices.js` — the panel, on the main stage

`chal('rumix', ...)` and `chal('music-video', ...)`, each with a `praise` tier
and a `fault` tier, **6 lines each**. `{j}` is the judge speaking, `{a}` the
queen. Half of these should be in the judge's own quoted voice — look at
`chal('girl-group', ...)` directly above for the mix.

For the music video, the fault tier is where the **director's report** belongs:
"I heard you were difficult on set" is a real critique this show gives.

**24 lines.**

### E. `js/dr/data/maxi-events.js` — the nine things that can happen

Each fires only when the engine actually made it happen, so the line must
describe a specific thing, not a mood. **4 lines each, 36 total.**

The Rumix (`from: 'rumix'`):

| id | what happened |
|---|---|
| `booth-rescue` | The verse on paper was worse than the verse on tape. The session saved it. |
| `booth-lost-it` | She wrote something real and could not get it on tape. The panel hears the tape. |
| `lifted-a-bar` | **pair** — `{a}` took a line off `{b}`, who was writing at the next station. |
| `no-verse` | Four bars of filler. There is no verse, and a solo stage cannot hide it. |
| `quotable-bar` | One line better than everything around it, and she landed it live. The cast will quote it. |

The shoot (`from: 'music-video'`):

| id | what happened |
|---|---|
| `cast-forward` | The host hands a big part to a queen who has been safe for weeks. She did not ask for it. |
| `director-loved-her` | She made the day. The director says so, and he says it to the panel. |
| `director-wrote-her-off` | She cost the day — and possibly argued about it. The panel will hear that too. |
| `lost-in-the-background` | A small part and she never found the camera. There is nothing of her in the edit. |

`lifted-a-bar` is the only `cast: 'pair'` one — it is the only one that may use
`{b}`.

---

## 4. How to know it worked

```
npx vitest run tests/dr-maxi-prose.test.js tests/dr-brief-voices.test.js \
  tests/dr-mini-lipsync-voices.test.js tests/dr-challenge-voice.test.js \
  tests/dr-event-reach.test.js tests/dr-prose-counts.test.js
```

`dr-maxi-prose` prints the backlog as it goes — `rumix/collapse (0/4)` and so
on — so run it once before starting and the list is your checklist. The variant
floors are enforced, the vocabulary guard is enforced, and a pool that is still
empty is reported rather than failing, which means **a green suite does not
mean you are done** — read the printed counts.

Then, and this matters more than the suite:

```
node -e "..."   # play a season with both pinned and READ the output
```

Every real prose bug in this project was found by dumping a real episode and
reading it, and not one was found by a passing test. Pin both challenges onto a
season, print the narration in order, and read it as a viewer. The specific
thing to watch for: a line that would be equally true of a different challenge.
If it would, it is not written yet.

---

## 5. What NOT to do

- Do not touch `js/dr/chal/rumix.js` or `js/dr/chal/music-video.js`. The
  simulation is done and correct; if the prose wants a fact the engine does not
  produce, say so rather than adding it.
- Do not copy lines from the `girl-group` family and swap the nouns. That is
  the exact bug this work exists to fix — a queen who flopped a music video was
  being narrated forgetting the choreography of a group number she was never
  in.
- Do not write about teams, groups, formations or shared scores in either
  family. Neither challenge has them.
- Do not mention a vote, a jury, or anybody being voted out.
