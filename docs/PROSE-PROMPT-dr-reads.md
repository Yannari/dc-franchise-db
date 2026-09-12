# Writing prompt — the library, and reads that are actually reads

Hand this whole file to the writing model. It is self-contained; the repo is
needed to make the edit, not to understand the assignment.

**~48 reads, across 12 angles × 4 performance tiers.** The engine is built,
wired and tested. Nothing here is broken today — the existing lines keep
working untouched — so this is an addition, and it can land one angle at a
time.

---

## The problem

A read on this show is specific. It is about **that queen**, and the joke is
the specificity:

> *"…I love your confidence. You're always telling yourself how you're
> beautiful, how you're talented, how you're gonna win… You're also a
> pathological liar."*

> *"…we know your biggest drag inspiration is [another queen]. You've got the
> dancing, the outrageous personality, the overbite and the back rolls!"*

Notice the shape. **Name. A set-up that sounds like a compliment. A swerve
that is the joke.** The second one is a list of three real compliments where
the fourth item is the knife. Neither works as a general statement — they
only land because they are true of one person.

Our pool could not be specific. Every line is written with `{b}` in it, which
means it has to be true of **whoever `{b}` turns out to be** — so every read
was general, and a general read is the one thing a library cannot survive:

> *"{b}, you are so talented. At things we have not seen yet."*

That is a fine line. It is also the only kind of line this pool could hold,
and a season of them reads as one joke told twelve times.

---

## What changed in the engine

A read now has an **angle**: what it is about, chosen from what is *actually
true* of the queen being read, tonight, from her record and her craft. The
angle is checked against her before any line is offered, so a read about a
queen who has never placed is never said to the one who won last week.

A line may declare the angle it needs:

```js
{ angle: 'never-won', line: '"{b}, five weeks in and the judges have said your name exactly…"' },
'"{b}, you are so talented. At things we have not seen yet."',   // untagged: always available
```

Untagged lines keep working exactly as they do now and are the floor. A
tagged line is offered only when its fact holds, and when one fits it is
preferred — a specific read is the better card every time.

---

## 0. THE HOUSE RULES

1. **`{a}` is the queen reading. `{b}` is the queen being read.** Never write
   a real name into a pool.
2. **NO REAL-WORLD REFERENCES.** This is the rule that makes the examples
   above a *structural* reference and not a source to borrow from. No films,
   no songs, no celebrities, no cities. The swerve has to be built out of
   something inside this universe — her record, her drag, the room.
3. **The line must be TRUE of the angle it is tagged with**, and true of
   nobody else in particular. `never-won` lines may state she has never won.
   They may not state how many weeks, because the engine knows the count and
   the line does not.
4. **Four variants minimum per tier you fill**, each a genuinely different
   joke — not one joke reworded. The suite fails near-duplicates.
5. **Dialogue first.** The read itself is the card. A sentence of narration
   after it is welcome — the room's reaction, what she does with her face —
   but the quote comes first and carries the weight. A card that is three
   lines of narration about a read that happened is the thing being fixed.
6. **The flat and passed tiers are not bad writing, they are bad READS**, and
   that is a craft of its own. See below.

## 1. The two dimensions

Every line lives at the crossing of **how it went** (which tier it is in) and
**what it was about** (its `angle` tag).

**How it went** — `js/dr/data/mini-voices.js`, the `reading` entry's tiers:

| tier | she… |
|---|---|
| `nailed` | destroyed the room. This is the read people quote afterwards. |
| `decent` | got a real laugh. Good, not the winner. |
| `flat` | said something that did not land, and she heard it not land. |
| `passed` | stood up and had nothing. |

**What it was about** — the angles, most specific first:

| angle | true when | the material |
|---|---|---|
| `the-frontrunner` | she has 2+ wins | she is winning and everybody has noticed |
| `been-in-the-bottom` | 2+ bottoms | she keeps ending up down there |
| `never-won` | 3+ weeks, never placed | the judges have never called her name |
| `always-safe` | safe nearly every week | she is invisible, week after week |
| `weak-design` | her worst craft is design | she cannot sew |
| `weak-dance` | " dance | she cannot move |
| `weak-singing` | " singing | she cannot sing |
| `weak-comedy` | " comedy | she is not funny |
| `weak-acting` | " acting | she cannot act |
| `weak-runway` | " runway | her looks do not land |
| `brand-new` | week 1–2 | nobody knows anything about her yet, and that is the read |
| *(untagged)* | always | the general pool that already exists |

**Where the volume is**, measured over 25 seasons and 246 reads — no angle
runs away with it, so every tier you fill will actually be seen:

```
been-in-the-bottom  15.0%     weak-comedy    8.5%
brand-new           13.0%     weak-runway    6.9%
weak-singing        13.0%     weak-acting    5.7%
the-frontrunner      9.8%     weak-design    4.9%
weak-dance           9.3%     never-won      4.9%
(untagged floor)     8.9%     always-safe    1.2%
```

`always-safe` is rare enough to leave for last; everything else earns its
four lines.

## 1b. A turn is several reads

She puts the glasses on and takes two or three of them apart before she sits
down. How many she gets through is a result, not a roll — three when she is
killing it, one when she is dying, one when she had nothing — and **her first
read is her best**, because she leads with the one she prepared and each later
one carries a small penalty.

That matters to you in one specific way: **a turn is read as a run.** Three
`nailed` lines in a row from the same queen should escalate, not restate. Give
the pool enough variety of SHAPE — a one-liner, a set-up with a turn, a read
that pretends to be a compliment all the way to the last word — that three
drawn together sound like somebody on a roll rather than one joke three times.

Measured over 28 libraries: 17.4 reads each, an even spread of one, two and
three per turn, and a line repeating inside the same library 1.0% of the time.
There is room for what you write.

## 2. How to write each tier

**`nailed`** — the swerve has to be genuinely funny and genuinely cruel, and
it must be about the angle. The compliment-then-knife shape is the reliable
one. Give her a beat of set-up so the turn has something to turn from.

**`decent`** — the joke works and is a bit obvious. Often the first thing
anybody would think of about that fact. It gets the laugh and does not get
quoted.

**`flat`** — this is the hardest one and the most fun. A flat read is not a
read with a weak punchline; it is usually one of: **cruelty with no joke in
it** ("you are just not very good"), **a joke about something nobody else
finds interesting**, **a read she explains afterwards**, or **a read of a
queen everybody likes, so the room turns on the reader instead.** Write the
failure mode, then one sentence of the room not giving it to her.

**`passed`** — she has nothing. Write the specific way she has nothing: an
opening she abandons, three false starts, a joke she clearly prepared for a
different queen, or a queen who simply says "I have got nothing" and sits
down. The angle still matters — the read she *couldn't* make was about
something.

## 3. Where it goes

`js/dr/data/mini-voices.js`, the entry with `id: 'reading'`. Add lines to the
existing tiers, tagging each with its angle. Change nothing else — not `id`,
not `cast`, not the tier ids.

```
npx vitest run tests/dr-mini-reading.test.js tests/dr-mini.test.js
```

Then read a rendered library end to end. The check no assertion makes is
whether twelve reads in a row are twelve different jokes:

```
npm run audit:dr-spec
```
