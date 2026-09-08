# Drag Race prose brief — hand this to the writing model

You are writing prose pools for a Drag Race season simulator. The engine is
built and tested; every pool below is an empty array waiting for lines. You are
filling arrays, not designing anything.

There are two files and 167 empty tiers. **Do one file at a time, and inside a
file do one family/style at a time.** Do not attempt all of it in one pass —
the pools are deliberately fillable in slices, and a slice that is fully written
switches on cleanly while everything else keeps its current fallback prose.

Every file has a long header comment explaining what it is for and why it is
shaped the way it is. **Read the header before writing a single line.** The
notes on each individual tier tell you what that tier is for; they are
instructions, not decoration.

---

## The two files

### 1. `js/dr/data/runway-voices.js` — 99 tiers, ~396 lines

The runway walk, in the queen's own voice. Three pools that get concatenated
into one paragraph per walk at render time:

| Pool | Keyed by | Tiers | What it says |
|---|---|---|---|
| `RUNWAY_THEMES` | 8 theme families × 3 fits | 24 | what she brought for this category, and whether the prompt suits her |
| `RUNWAY_VOICES` | 10 drag styles × 5 score tiers | 50 | how the look read on the walk, in her craft's language |
| `RUNWAY_SWAGGER` | 5 archetype groups × 5 score tiers | 25 | what a woman like her thinks about that result |

**First person, unquoted.** This is her voiceover running over her own walk —
the show's own device. Not "she walks out"; not a quoted line of dialogue.
"I built this in four days and I can feel the front row stop talking."

### 2. `js/dr/data/brief-voices.js` — 68 tiers, ~272 lines

The maxi challenge announcement, in the challenge's own words. 17 challenge
families, each with a `brief` (how the host explains it) and three reaction
tiers (`delighted` / `braced` / `dreading` — how it lands on a specific queen).

**Third person here.** This is the werk room with a camera in it, not a
voiceover. The register is intimate and funny: people who have not yet had to
perform.

---

## The rule that will get you rejected

**Each pool knows ONLY its own axis.** Three sentences from three pools are
glued together, and none of them has seen the others.

- A **theme** line knows the category and whether it suits her. It must NOT say
  how the look landed — it lands identically on a stunning walk and a disaster.
- A **voice** line knows how it landed and what craft she does. It must NOT name
  the garment, the fabric or the colour — the theme line already chose those,
  and chose different ones last week.
- A **swagger** line knows *only* how the walk went. It must not name the
  garment, the category, the colour or the concept. It is the last sentence of
  the paragraph and has to read as one after any two lines that preceded it.
  A swagger line saying "and the feathers were worth it" is broken, because the
  theme line it lands after may have been about a suit.

The same applies in the brief file: a `brief` line addresses the whole room and
must not single out a queen; a `reaction` line is about one queen.

## The rule that is the entire point of the files

**Say what she is actually going to have to do, and in whose voice.**

A line that would print correctly under any family, or in any drag style's
mouth, is a line that has not been written yet. That is the bug both files exist
to fix. The old generic pool had queens reacting to a Talent Show — one woman
alone on a bare stage with one rehearsal slot — by "casting", "choreographing"
and "picking fabric", because those sentences were written for a girl group
number and printed under every challenge in the game.

So:

- A `delighted` reaction to a **Snatch Game** is her already knowing which
  character she is doing. To a **Rusical** it is a trained singer hearing there
  is a live band. To a **Talent Show** it is a woman who has had the same
  eight-minute act since she was twenty-two and has finally been asked for it.
  Three different weeks, three different sentences.
- A **fashion** queen walking a stunning look talks about proportion and line
  and the exact weight of the fabric. A **camp** queen at the same tier talks
  about the moment the joke lands and the fact that she meant every stupid inch
  of it. A **pageant** queen talks about the years of it and the fact that this
  is what she is FOR.
- The failure tiers separate hardest of all. A fashion queen's `disaster` is a
  taste failure she diagnosed before she reached the mark. A club-kid queen's
  `disaster` is that the room did not get it — which is not the same admission.

Check the `solo` flag on each brief family. A solo challenge's prose may never
reach for a team, a group, casting or co-stars. This is enforced by a test.

## Mechanical rules — all enforced by tests, all will fail the build

1. **Four variants minimum per tier**, and they must be genuinely different
   beats, not one sentence reworded. A guard compares shared vocabulary across
   whole lines and rejects anything over 60% overlap.
2. **Prose, not captions.** Over 80 characters in the brief file; over 40 in the
   runway file (those are clauses of a shared paragraph, not whole paragraphs).
3. **No real people.** No celebrities, no real drag queens, no real places. This
   universe contains only its own reality shows.
4. **This show's vocabulary only.** Never `tribe`, `tribal council`, `camper`,
   `immunity`, `voted out`, `idol`, `merge`, `jury`, `juror`, `houseguest`,
   `evicted`, `nominated`, `the block`, `head of household`, `veto`, `traitor`,
   `banished`, `round table`. A courtroom scene part called "The Jury" had to be
   renamed for exactly this reason.
5. **Never quote a stat by number.** No "her design is a 9". Say what it looks
   like, not what it scores.
6. **Placeholders.** Only these, and only where allowed:
   - `{a}` — the queen. Reaction lines yes; brief lines no. In the runway file
     she is speaking, so `{a}` is rarely right — a queen in the third person is
     doing a bit, and only some styles can carry that bit.
   - `{c}` — the category (runway file) or the challenge name (brief file).
     **REQUIRED in every theme line** and forbidden in voice and swagger lines.

## How to check your work

```
npx vitest run tests/dr-runway-voices.test.js tests/dr-brief-voices.test.js
```

Both print exactly which tiers are still empty and fail with the specific rule
and the specific line that broke it. Run this after every slice.

## What "tier" means here — it is ranked, not scored

Nothing is a fixed threshold. The engine ranks the queens who walked *tonight*
and cuts the field, so `stunning` means best in this room on this night, and a
`weak` on a strong night is a look that would have been fine two weeks ago.
Write to the room, not to a score. Same for the brief's three aptitudes: they
are the top, middle and bottom of the room for *this* challenge's scoring blend.

## Where to start

`brief-voices.js`, family `talent-show`. Its note says in full detail why it
exists, and its four tiers are the ones that produced the bug report. Get those
sixteen lines right, run the test, and the rest of the file is the same job
seventeen times.
