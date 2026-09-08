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

---

# Part 3 — the maxi draft and the walkthrough

**`js/dr/data/maxi-voices.js`** — 33 tiers, ~200 lines.

The maxi *performance* is already written and already specific. These are the
two beats on the same night that were not.

## `PICK_VOICES` — 4 role kinds × 4 outcomes (16 tiers)

Eleven pick cards printed on one Snatch Game and between them they said "the
pick", "it", "this one" and "what is available" — on a night where the thing
being picked is a person she has to *be* for six questions.

**`{d}` is the thing she got**, already resolved to a readable name. Use it in
most lines; a tier that never reaches for it is rejected.

| Kind | What `{d}` is | Which challenges |
|---|---|---|
| `characters` | A person she now has to BE — voice, hair, six answers. The most consequential pick in the season | Snatch Game |
| `parts` | A scripted role with lines already written. Size, jokes and fit all decided before she opens her mouth | acting, improv, music video, Rusical |
| `slots` | Real estate in a group number — a verse, an eight-count, a place in the running order | choreography, girl group, roast, rumix, singing, stand-up |
| `partner` | **A person, not a thing.** The queen she has to make over, or the one she has to face | makeover, lip sync challenge |

Outcomes: `got-it`, `settled`, `left-over`, `picked-last`.

**`{d}` is not always pretty** — a title-cased slug for anything without an
authored name, so it can read "Red Lame" or "Slot Three". Write around it as an
object: *"she got {d}"* is safe, *"the {d} she had been planning all week"* is
not. A leftover resolves to the phrase "what nobody else wanted", so
`left-over` lines must read correctly with that in place of a name.

## `WALKTHROUGH_VOICES` — 17 families (17 tiers)

The host walks the room mid-build and stops at each station. This printed the
**same paragraph six times** in one prep room — four variants against ten fires
— and it was wrong anyway: *"looks at what she is building"* over a Snatch
Game, where nothing is built. It also promised *"the thing is specific"* and
was never specific.

**So say the note.** Not that a note was given — what it was about. A Snatch
Game note is the character choice and whether she has jokes for it. A design
note is construction and whether the material is used or hidden. A Rusical note
is whether she knows the words yet.

**One tier per family, no good/bad split.** The host's note is neither, and how
a queen takes it is a separate beat that already exists. Write the range inside
the pool — some notes are a rescue, some are a warning.

**Eight variants**, because it fires once per queen.

Placeholders: `{a}`, `{c}`, `{d}` (pick pool only). No `{b}`, no `{j}`, no `{s}`.

---

# Part 4 — the deliberation

**`js/dr/data/deliberation-voices.js`** — 11 tiers, ~60 lines.

## Why this is the most valuable of the four

The whole reason the judging engine has a step 2 is that judges weigh
different things — Law puts 0.55 on the runway, Ross 0.20 — which is what lets
a look queen and a comedy queen genuinely disagree about the same night, and
what makes "she was robbed" possible at all.

All of it was computed every week and thrown away, and it turned out to be
worse than that: **no screen in the entire viewing party referenced the
deliberation.** The beat had written prose, fired every week, and was drawn
nowhere. It is now the close of the critiques screen — the safe are dismissed
at the top, the rest are critiqued through the middle, then they all go to
Untucked and the panel talks with the stage empty.

## `ADVOCACY` — 4 taste dimensions × 2 stances (8 tiers, 6 variants)

For each queen the panel is furthest apart on, the judge who ranked her
**highest** speaks for her and the judge who ranked her **lowest** speaks
against. That pairing is measured, not assigned.

What each argues *from* is the dimension the two of them **differ on most** —
so it really is Michelle on the runway against RuPaul on the challenge.

| Dimension | What that judge is watching |
|---|---|
| `challenge` | What the queen DID. Forgives a bad look for a good night; unmoved by a beautiful queen who did nothing |
| `runway` | The garment. Construction, proportion, whether the idea survived a body. Can be entirely uninterested in how funny somebody was |
| `risk` | The nerve. Would rather see an ambitious mess than a safe success, and says so |
| `polish` | Whether it was *finished*. Unimpressed by a good idea badly made |

Stances: `champion`, `dismiss`.

## `HOST_CALL` — 3 outcomes (3 tiers, 4 variants)

`hostBend` reorders the panel's board, and that reorder is the most
consequential decision of the night. Recorded on every row since the engine was
written, shown only as a small badge, never spoken.

- `lifted` — she moves `{a}` **up**, overruling people who just spent ten
  minutes explaining why she should be lower
- `dropped` — she moves `{a}` **down**. Harder to do and harder to say
- `stood-by` — she leaves the board alone. **No queen was moved, so `{a}` is
  rejected here** — it would render empty

She does not argue in the panel's terms. They are arguing about a garment and a
performance; she is thinking about a season.

## Register — different from everywhere else in the show

**A closed room.** Nobody is performing. The queens are in Untucked and cannot
hear this, and judges who are warm on the main stage are blunt here. This is
the only place where a judge says what she actually thinks without softening it
for the person standing in front of her.

Placeholders: `{a}` the queen, `{j}` the judge speaking, `{e}` the judge on the
other side (advocacy only — the host pool has no second judge and rejects both
`{j}` and `{e}`).

---

# Part 5 — two more pools, added later

## `maxi-events.js` — the Rusical's words (2 events, 4+ lines each)

`shaky-on-the-words` and `lost-the-words`. **These are a mechanic, not a
mood** — both move her score and her popularity, and which one fires comes
out of the draft: `depth` is how far down her own list she fell, so the queen
who was beaten to the part she prepared for has had one afternoon to learn a
different set of words. Measured across eight seasons: 80% solid, 12% shaky,
7% lost, **zero at depth 0** and clustering at depth 5–8.

- `shaky-on-the-words` — she has most of them and not all. A phrase goes, she
  catches up, and anybody watching her mouth knows. A note, not a verdict.
- `lost-the-words` — she loses them completely, on a stage, with a live band
  that does not stop for her. Worth writing what she **does** about it:
  standing there is one performance and inventing something is another.

## `challenge-beats.js` — `mini-turn` (3 tiers, written; extend if you like)

The host calling each queen up in a targeting mini: `first`, `next`, `last`.
**This beat is exempt from the 80-character floor** — it is a name shouted
over a noisy room, and "And last but not least... {a}!" is exactly right at
thirty-two characters.

## `mini-voices.js` — `passed` for `puppets` and `quiz`

`reading/passed` is written; the other two targeting minis have the tier and
the note and no lines. She stands up, opens her mouth, and has nothing —
rare, earned, and the moment everybody remembers. Only `targets` minis have
it: you cannot pass a dance-off, you dance badly, which is `flat`.
