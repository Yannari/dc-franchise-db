# Drag Race — the mini challenge and the lip sync. 61 tiers, ~330 lines.

Two new files, both empty:

- **`js/dr/data/mini-voices.js`** — 35 tiers, ~230 lines
- **`js/dr/data/lipsync-voices.js`** — 26 tiers, ~104 lines

Check your work with:

```
npx vitest run tests/dr-mini-lipsync-voices.test.js
```

It names every tier still short and fails with the exact line and rule that
broke. Both files have long headers; read the header and the per-tier notes
before writing — the notes are instructions.

Do one mini at a time, and one tempo at a time. Each file falls back to the
existing generic prose per key, so a finished slice switches on cleanly while
everything else stays as it is.

---

# Part 1 — the mini challenge

## Why it needs rewriting

A Werk Room Dance-Off — the music starts with no warning, eight counts, nobody
says a word — was narrated like this:

> She is funny enough, quick enough, and game enough that the host smiles…
> the timing of a person who has done this exact thing in a bar at two in the
> morning…

Nobody is telling a joke. Those sentences were written for a reading challenge
and they print, word for word, under all seven minis, because `mini-attempt`
had three tiers keyed on how well she did and no idea what she was doing.

## The seven minis, and what each one physically is

Each gets 5 tiers: `announce`, `nailed`, `decent`, `flat`, `win`.

| id | What she is actually doing | Names another queen? |
|---|---|---|
| `reading` | Stands up and takes **one queen** apart, to her face, and it has to be funny rather than cruel | **yes** |
| `puppets` | Handed a puppet of another queen and has to **be her** — voice, walk, the thing she says and doesn't know she says — while that queen watches | **yes** |
| `quick-drag` | A full look, face and all, against a clock that is far too short. A race, in silence | no |
| `photoshoot` | One frame each, with something going wrong **in shot** — water, wind, something thrown. The face has to stay right | no |
| `dance-off` | Music with **no warning**, eight counts. No costume, no concept, no preparation. A body, a floor, a circle | no |
| `quiz` | A quiz about the queens, scored on how funny the **wrong** answers are | **yes** |
| `wig-swap` | She styles another queen's wig, then has to **wear** the one that queen did for her | **yes** (partner) |

## `{b}` is the biggest win in this file

Four of the seven are aimed at somebody. The engine has recorded **who** since
the day it was written — `detail[queen] = { target }` — and not one line has
ever said her name. "She reads the room" is not what happens in a reading
challenge: she reads **one queen**, who is standing right there, and the two of
them still have to work together tomorrow.

So in those four, use `{b}` and use it often. A test enforces both halves: a
solo mini may not use `{b}` at all, and a targeting mini whose written tiers
**never** reach for it is rejected as having been written like a solo.

The `announce` tier is exempt — it addresses the room before anybody is picked.

## The variant floor is NOT four

`mini-attempt` fires **once per living queen** — thirteen times in a premiere —
and the tiers split the field roughly 30 / 40 / 30. Four variants cannot cover
five queens, and the dump that produced this file printed one line **twice** in
a single mini, eight rows apart.

| Tier | Variants required |
|---|---|
| `announce` | 4 |
| `nailed` | **6** |
| `decent` | **8** |
| `flat` | **6** |
| `win` | 4 |

The draw is without replacement inside an episode, so hitting these numbers
removes the repeat outright rather than making it less likely.

## Placeholders

- `{a}` — the queen performing. Any attempt or win tier.
- `{b}` — who she went after, or her partner. **Only** in `reading`, `puppets`,
  `quiz`, `wig-swap`. Rejected in the other three.
- `{c}` — the mini's name.
- `{s}` — **rejected.** That is the lip sync's song and belongs to Part 2 only.

---

# Part 2 — the lip sync

## Why it needs rewriting

`lipsync-beat` had four tiers keyed on how well she did and nothing about the
record she was doing it to, so a queen fighting for her life to a six-minute
ballad and one doing it to a hyperpop banger got the same paragraph. The old
prose put dance breaks over songs that have none.

The song is not decoration. `js/dr/data/songs.js` tags every title, and its own
header says the narration should build a beat out of `hook`. It never did —
`lipsyncScore` reads those tags to decide who **wins**, and the words
describing the win read none of them.

## Pool 1 — tempo × 4 score tiers (16 tiers)

Tempo, not mood, because **tempo changes the job**:

| Tempo | The job |
|---|---|
| `ballad` | Slow, nowhere to hide. No choreography to fall back on and no beat to ride. A face, a pair of hands, and the discipline not to fill the silence with tricks |
| `mid` | A build. Give everything in the first verse and there is nothing left when the song finally opens up |
| `dance` | A groove, not a sprint. Hips, control, sitting in the pocket. The trap is treating it like an uptempo |
| `uptempo` | Fast and it does not stop. Cardio as much as performance — keep up, keep the words, keep the face doing something while the lungs give out |

Score tiers: `legendary`, `strong`, `trying`, `lost`. Ranked against the queens
in *this* lip sync, usually two people — so `legendary` is winning it well and
`lost` is being visibly beaten. Four tiers exist because a triple or a
lalaparuza puts more bodies on the stage.

## Pool 2 — hook × 2 outcomes (10 tiers)

Every song names the one place a lip sync is decided, and it is the **same
place for both queens**, which is what makes it worth narrating. Two outcomes
only: she took it or she did not. There is no middle at a key change.

| Hook | The moment |
|---|---|
| `key-change` | The song lifts a whole step and everybody knows it is coming, including both queens |
| `breakdown` | Everything drops out. A bar of almost nothing, and whatever she does in the gap is what the edit uses |
| `spoken` | A spoken passage. No melody to ride, no choreography that fits. Acting, mid-lip-sync |
| `dance-break` | The vocal stops and the track keeps going. Pure movement, nothing to hide behind |
| `none` | **No moment at all.** The song hands nobody a gift. These lines are about the ABSENCE of one — she has to build a moment, or she waits for one that is never coming |

This renders as a **second, shorter line** after the tempo beat, so write it as
a moment rather than a summary. It lands after a line it has never seen, so it
may not restate how the overall performance went — only what happened at this
one point in the song.

## The rule that is not negotiable

**NEVER QUOTE A LYRIC.** `{s}` is the song's **title** and that is the only
part of it that may appear. No lines from the song, no paraphrase of its words,
not one clause. This is not a style note — it is the rule the entire song bank
is built on. `songs.js` exists because real titles are used as names and
nothing else.

Use `{s}` sparingly even so. Naming the song every line reads like a caption.

## Register

The highest stakes in the show. Two queens are lip syncing for their lives in
front of a panel that has already decided everything except this, and one of
them is leaving. The werk room is funny; the main stage is verdict; this is
neither. Keep it physical: what her body is doing, what the room is doing, what
the other queen can see out of the corner of her eye.

---

# Rules both files share — all enforced

1. **Third person.** These are not voiceovers; the runway pools are the
   exception in this show, not the rule.
2. **Meet the variant floor.** 4 everywhere except the mini attempt tiers above.
   Variants must be different beats, not one sentence reworded — the guard
   rejects over 60% shared vocabulary across whole lines.
3. **Prose, not captions.** Over 60 characters.
4. **No real people** beyond the host, the six authored judges, and the artist a
   song title belongs to.
5. **This show's vocabulary only.** Never `tribe`, `tribal council`, `camper`,
   `immunity`, `voted out`, `idol`, `merge`, `jury`, `juror`, `houseguest`,
   `evicted`, `nominated`, `the block`, `head of household`, `veto`, `traitor`,
   `banished`, `round table`.
6. **Never quote a stat by number.**
7. **Straight quotes only.** `'` and `"`, never `'` `'` `"` `"`. A curly quote
   used as a string delimiter is a syntax error that breaks the entire build,
   and it has already happened once today.

## The instruction underneath all of it

Say what she is **physically doing**, in the words that belong to this
particular mini or this particular song. A `nailed` on a dance-off is eight
counts of something the room did not know she had; on a photoshoot it is one
frame with a bucket of water hitting her and her face still right; on a reading
challenge it is one sentence about `{b}` that takes the whole room out.

A line that would print correctly under any of the seven minis, or over any
tempo, is a line that has not been written yet.
