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

Seven pools across six files. Every one already has its entry with a `note`
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

### F. `js/dr/data/challenge-beats.js` — the two beats the shoot day needs

**Added after the first pass, because the shoot had no screen.** The music
video computes a director's impression per queen and feeds it to the panel, and
it reached the viewer as one scene carrying data and no words — so the whole
mechanic was invisible and the challenge still read like the one it was split
out of. Reported as "we don't have a video moment with the director". These two
pools are that moment.

**`id: 'call-sheet'`** — per queen, on the draft screen. She finds out what she
is playing at the same moment everybody else does, and she had no say in it.
Four tiers, **4 lines each**:

| tier | what it is |
|---|---|
| `lead` | Handed the whole video. She did not ask for it and now she owns it. |
| `featured` | A real part, and the pressure of having been named. |
| `standard` | Something to do, nothing that will carry her. |
| `ensemble` | The back of the frame. She has to make herself findable. |

Do not write these as picks. Nobody chose anything — that is the entire point,
and the old draft prose ("she grabs the role everybody knew had the material")
is what these replace.

**`id: 'studio-day'`** — per queen, on the prep screen, one card each the way
the host's walkthrough gives one card each. This is the director. He is not on
the panel, he does not score her, and he **will tell the panel how the day
went**. Four tiers, **4 lines each**:

| tier | what it is |
|---|---|
| `made-the-day` | He starts building the video around her. |
| `easy` | She takes the note, gives him the take, he moves on. |
| `slow` | They get there. Getting there takes most of the afternoon. |
| `argued` | She was asked for something and told him no, in front of the crew. |

**32 lines.** Keep him unnamed, or give him a role rather than a name — "the
director" is what every other professional in this show is called, and this
universe has no real people in it.

**`the-division`, `tier('cast', ...)`** — the once-per-episode beat that tells
the room how it is being split. It has `draft`, `captains` and `solo`; `cast`
is new and empty. **4 lines**: no draft at all, the host reads out who is
playing what, and the room hears its own casting. Very different energy from
`solo` — this is one production with a call sheet, not thirteen queens each
doing their own thing.

**`id: 'booth-session'`** — per queen, on **The Booth** screen. Her hour with
the vocal producer. This is the one that decides what the panel hears, and
until now nine queens in a twelve-queen room recorded a vocal the episode never
mentioned. Four tiers, **4 lines each**:

| tier | what it is |
|---|---|
| `got-it-on-tape` | The take is better than the verse. He found something in her. |
| `clean-session` | In, done, out. No drama and no rescue needed. |
| `many-takes` | They get there, and everybody knows how long it took. |
| `could-not-get-it` | She wrote it and she cannot sing it. The tape is what the panel hears. |

The producer is unnamed, like the director — a role, not a person.

**52 lines in this section.**

### G. The track and the concept are already written

You do not need to write these, but the prose should USE them. Every Rumix now
draws a named track from `RUMIX_TRACKS` in `js/dr/chal/rumix.js` — it carries a
`title`, a `sound` and, most usefully, an `asks`: what that particular song
demands of a verse. A ballad leaves space that exposes filler; a trap beat has
gaps with nowhere to hide. Every music video draws from `VIDEO_CONCEPTS` in
`js/dr/chal/music-video.js` — a `title`, a `setting` the crew built and a `look`
she is put in.

Both reach the beats on their scene data. Lines that reach for them will read as
being about that night; lines that do not will read as being about the format.

### H. REWRITE THE THREE PREP POOLS — she has a name now, and she talks

**This supersedes what is already written in `booth-session`, `studio-day` and
`call-sheet`.** Those pools were filled while the person running the room was
an anonymous "the director" and "the vocal producer", referred to throughout as
**he**. Both of those are now wrong.

**The person running the room is Michelle Visage.** She is a permanent judge on
this show — `js/dr/data/judges.js`, with an authored voice: *"Direct and
technical. Hard on construction and a hidden waist, soft on a live vocal, and
never softens a note to be liked."* She directs the video shoot and she runs
the recording booth. `js/dr/data/judges.js` `MENTORS` is the map; Jamal Sims
takes a room that has to learn choreography.

Three things follow, and all three are required:

1. **`{m}` is her name.** It is filled at render time exactly like `{a}`.
   Never type "Michelle" into a pool — use `{m}`, so a season that swaps the
   mentor still reads correctly.
2. **She is "she".** Every "he" in those three pools is a bug now.
3. **SHE IS ON THE PANEL.** That is the point of her being a judge rather than
   a hired stranger: she is not sending a report to the judges, she is a judge
   who was in the room, and the critique later can be *"I was on that set."*
   The engine already models this — her own view of the queen carries the full
   weight of the day and the other three seats get half.

**And these pools want DIALOGUE, not reported speech.** This is the note that
prompted the rewrite: every line currently narrates what she thought instead of
letting her say it. Compare:

> ✗ The director's note was about scale: play it smaller for the lens.
> ✓ "Smaller," {m} says, without looking up from the monitor. "The lens is
>   eighteen inches from your face and you are playing to a balcony."

Aim for **at least half the lines in each tier carrying a spoken line of hers**,
and write it in her voice — direct, technical, specific about the craft, never
softened to be liked. She is not cruel; she is exact. Give her the actual note:
what she wants smaller, which bar was flat, where the mark is.

The queen may answer. `argued` in `studio-day` is a two-hander by definition —
somebody was asked for something and said no, out loud, in front of a crew —
and it should read like an exchange rather than a summary of one.

**Same three pools, same tier counts as sections F. 52 lines, rewritten.**

### I. `rehearsal` — the afternoon on the number, run by Jamal

**Both challenges share this one.** A Rumix is performed live with
choreography and a music video is danced, and neither had a rehearsal in the
engine or on screen: the number simply existed on the night, learned by
nobody. It has its own screen now, **Rehearsal**, between the booth and the
shoot.

`{m}` here is **Jamal Sims**, not Michelle — the choreographer takes any room
that has to learn a number, and `MENTOR_BY_BEAT` in `js/dr/data/judges.js` is
what says so. His authored voice: *"A choreographer watching feet and
counting. Kind about effort, exact about timing, and he can tell who learned
it this morning."* Same dialogue rule as section H: at least half the lines
should have him actually saying something, and what he says is a count, a
correction, or a name.

Four tiers, **4 lines each**:

| tier | what it is |
|---|---|
| `first-pass` | She has it after one run and spends the rest of the day helping. |
| `got-there` | It takes the afternoon and by the end of it she has the number. |
| `behind-the-count` | She is a half-count late all day and she knows it. |
| `still-counting` | The room moves on without her. She is mouthing numbers. |

All four fire — measured across 25 seasons: got-there 101, behind-the-count 71,
first-pass 53, still-counting 27.

Two events go with it, **4 lines each**: `picked-it-up` (she has the whole
number after one run and spends the afternoon helping) and `cannot-count` (the
room moves on and she is still mouthing numbers, and everybody saw).

**24 lines.**

### J. `studio-taping` — acting and the commercial, on a set

**Acting and the commercial now have the director's read too**, which is what
the music video was the prototype for. Same mechanic: the day forms a bounded
opinion of her, that opinion reaches the panel, and the person who formed it is
sitting on it.

**It is a TAPING, not a rehearsal.** That word belongs to the room where a
number is taught — the choreography beat in section I owns it. This is a set: a
script, a camera, a monitor, and Michelle behind it, which is what the show
actually looks like. Writing "rehearsal" into this pool is describing the wrong
room.

**It is a separate pool from `studio-day` and must stay one.** That pool talks
about the call sheet, the shot list and building the video around her. This is
a scene being blocked and a product being sold.

`{m}` is **Michelle Visage** on both. The wiki is explicit that the queens
write and direct the commercial themselves — she is the one giving notes, not
the one making it, and a line should not have her calling the shots on that
one the way she does on a scripted parody.

**Three challenges in this family and only two have a day.** Improv is
unscripted by definition and the roast is written alone and delivered live, so
neither gets a card. Never write a line that assumes a rehearsal happened, and
remember the pool is shared between a scripted scene and a thirty-second
advert — a line has to work for both.

Four tiers, **4 lines each**:

| tier | what it is |
|---|---|
| `made-the-scene` | She gave her something better than what was written. |
| `takes-direction` | A note, a take, and on to the next setup. |
| `many-resets` | They go again, and again, and the room feels the afternoon. |
| `argued-with-him` | She was asked for something and said no, in front of the crew. |

Same dialogue rule as section H: at least half the lines carrying something
Michelle actually says, in her own voice — direct, technical, exact about the
craft, never softened to be liked.

**16 lines.**

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
