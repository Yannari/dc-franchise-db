# Writing prompt — Guess Who, and the queen the room could not place

Hand this whole file to the writing model. It is self-contained; the repo is
needed to make the edit, not to understand the assignment.

**12 lines: 3 events × 4 variants.** The engine is built, wired, measured and
tested. Every pool below ships empty on purpose — an event with no prose emits
no card rather than a blank one — so this is an addition and it can land one
event at a time.

---

## 0. What the mini IS

Something belonging to one of the queens goes up with no name on it: a wig, a
shoe, a padding, a perfume, a baby photo, a work station an hour before the
runway. Everybody else writes down whose they think it is. The answers go up
together, and then the owner is revealed.

**There is a right answer, and that is the whole design.** Its sister mini,
Spill the T, has no right answer and pays you for agreeing with the room. This
one pays you for being right — so a room that agrees on the wrong name is not
a consensus, it is eight queens who do not know her.

What the engine actually scores is **how well she knows the woman next to
her**. A guess is built from the bond (doubled on the intimate items — a
perfume is knowable only from having stood beside somebody), plus how much the
thing in front of her looks like the answer, plus her intuition as noise.
Measured over forty seasons: a queen close to the owner gets it right 58% of
the time, a stranger 5%, chance 9%.

So the queen nobody can place is the queen nobody talks to. The episode gets
to say that without anybody having to say it — which is the job of the lines
below.

---

## 1. THE HOUSE RULES

1. **`{a}` and `{b}` as tagged per event below.** Never write a real name into
   a pool.
2. **NO REAL-WORLD REFERENCES.** No films, songs, celebrities, brands, cities.
   Everything comes from inside this universe: the room, the week, the work.
3. **Never name the object.** The engine picks which item went up (ten of
   them) and the card already says which. A line that says "her wig" prints
   over the round about a baby photo.
4. **Nobody did anything wrong.** This is the difference between this mini and
   the reading challenge. Not recognising somebody's handwriting is not an
   insult, nobody meant it, and it still lands — the lines that work know that
   and do not reach for a villain.
5. **Four variants minimum per event**, each a genuinely different moment. The
   suite fails near-duplicates.
6. **Prose brevity.** Say what happened and stop.

---

## 2. The three events

All in `js/dr/data/maxi-events.js`, all `from: 'mini'`, all with `lines: []`
today. They are consequences — the popularity and the bonds have already moved
by the time the card draws — so write what the change looks like and never
announce a number.

### `nobody-knew-it-was-hers` — solo, `{a}` is the owner

Zero. Not one queen in the room got it. Fires on about a fifth of rounds.

This is the best material in the file and the easiest to overwrite. She was
not attacked and there is nothing to push back against, which is exactly why
it sticks — the useful question is what she does in the four seconds while the
room is still looking at the board. The one that is *charming* about it is as
true as the one that goes quiet. Avoid: a speech about being overlooked, and
anything that has her decide to "show them" this week — she does not get an
arc out of a mini challenge.

### `the-room-knew-her-instantly` — solo, `{a}` is the owner

Nearly half the room, or more, named her the second it went up. Fires on about
one round in seven.

She is identifiable by one object, which is the entire job — write it as the
win it is. But there is a second note available and it is the more interesting
one: being this legible means everybody in that room can predict her, and at
least one of these four lines should know that.

### `her-own-girl-missed-it` — pair, `{a}` guessed, `{b}` owns it

`{a}` and `{b}` are genuinely close — the engine only fires this when the bond
was really there — and `{a}` wrote down somebody else's name. Only ever one of
these per round, so it is the card the round is remembered for.

Two notes that make it work: **`{a}` is usually not sorry**, because she was
guessing in good faith and had no idea, and the scene is rarely the guess
itself — it is the thirty seconds afterwards, when the two of them have to go
back to stations next to each other. One of the four should be `{b}` letting
it go, and meaning it.

---

## 3. Where it goes, and how to check it

Fill the `lines` arrays on those three ids in `js/dr/data/maxi-events.js`.
Change nothing else — not `cast`, not `from`, not the notes.

```
npx vitest run tests/dr-mini-guess.test.js tests/dr-event-reach.test.js
```

Then play one and read it. The check no assertion makes is whether the three
of them sound like three different afternoons in the same room:

```
npm run audit:dr-spec
```
