# Writing prompt — the confessional

Hand this whole file to the writing model. It is self-contained; the repo is
needed to make the edit, not to understand the assignment.

**7 tiers, 6 lines each, ~42 lines.** The engine is built, wired and tested.
Every pool is empty, and an empty pool emits no card at all — so until these
are written the feature is silent, and the moment they are written it runs.

---

## What a confessional is here

One queen, alone, telling the camera what she thought of **something that just
happened in front of her**. It is drawn as a piece to camera — her face large,
a viewfinder, corner marks and a running tally light — and it sits in the
column directly beneath the scene it reacts to.

That is the whole design, and it is what makes the tiers what they are:

```
  [pair]  Jinx tells Gigi her silhouette reads flat.
          Gigi thanks her. Warmly. Twice.
          ↓ Jinx & Gigi -1

  [REC]   GIGI CHERIE
          It was done to her. She smiled in the room. She is not smiling here.
          "<your line goes here>"
          ↓ Gigi Cherie · audience -1
```

**A line that would read the same with no scene in front of it is not a
confessional.** It is a thought, and this show already has somewhere to put
thoughts. Every line must sound like an answer to something.

---

## 0. THE HOUSE RULES

Enforced by `tests/dr-confessional.test.js` and the drag prose guards.

1. **`{a}` is the queen talking. `{b}` is the other queen in the scene she is
   talking about.** Never write a real name into a pool.
2. **`{b}` DOES NOT EXIST in the `alone` tier** — that tier follows a scene
   with nobody else in it. A line using `{b}` there is dropped at runtime (it
   once shipped as *"Q9 looks at the camera about ."*), so it is a wasted
   line, not a crash.
3. **She does not know things she has not seen.** She is reacting to one
   scene. She has no idea how the week ends, who is going home, what the
   judges think, or what was said in a room she was not in. In `watched-*`
   she saw it from across the room — she may have missed the words.
4. **Six variants per tier, each a genuinely different beat**, not one
   sentence reworded. Prose, over 80 characters, and a queen's speaking voice
   rather than narration about her.
5. **No real people, no real-world references.** This show's vocabulary only.
6. **Never quote a stat by number.**
7. **Do not name the consequence.** The card already draws "audience −1"
   underneath. A line that says she knows the edit is watching breaks the
   frame.

---

## 1. Voice

This is the one place in the show where somebody says the true version out
loud. The room does the polite thing; the confessional is what she actually
thought while doing it.

- **Speech, not narration.** Mostly in quotation marks. Where you break out of
  quotes, keep it to what the camera can see her do — a pause, a look, a hand.
- **Short.** A confessional is a cutaway, not a monologue. Two or three
  sentences.
- **She is performing being honest**, which is not the same as being honest.
  The best ones let you see her deciding how much to say.
- **Funny is allowed and encouraged.** This is the show's comic engine.

---

## 2. The seven tiers

In `js/dr/data/confessional-lines.js`. Fill the `lines` arrays and change
nothing else — not `id`, not `note`, not `sign`, not the order.

`sign` is which way her edit moves and is already set; you are not choosing
it, you are writing to it.

| tier | what just happened | she is | sign |
|---|---|---|---|
| `did-warm` | she did the generous thing | the one who did it | +1 |
| `did-cold` | she was the cause of it going wrong | the one who did it | −1 |
| `taken-warm` | somebody was good to her | the one it happened to | +1 |
| `taken-cold` | it was done to her | the one it happened to | −1 |
| `watched-warm` | two of them got closer | a witness | +1 |
| `watched-cold` | she watched it go wrong | a witness | −1 |
| `alone` | a scene with only her in it | alone | −1 |

**The distinctions that matter most, because they are the easy ones to blur:**

- **`did-cold` is a confession.** She caused it, the room did not see her
  choose to, and the camera is the only place she will admit it. Only queens
  the engine allows to be shady ever speak this tier — villains, masterminds,
  schemers, and neutrals who are strategic and disloyal. Never a hero. So you
  can write it with teeth.
- **`taken-cold` is not shade, it is being hurt**, and *anybody* speaks it,
  hero included. She smiled in the room. She is not smiling here. Do not write
  it as revenge — write it as the moment she stops performing being fine.
- **`watched-cold` is the shady one** and is also gated to queens allowed
  shade. She was across the room. She enjoyed it more than she should have,
  and she half knows it.
- **`watched-warm` is not sweet.** Two other queens getting closer is a
  problem for her, and the interesting line is the one where she is generous
  out loud and counting in her head.
- **`alone` follows her own solo beat** — sewing, panicking, walking in early.
  It is the closest to the classic confessional and the only one with nobody
  else in it. **No `{b}`.**

Keep the tiers audibly apart. If a line would work in three of them, it is
doing the work of none.

**Who you are writing for, in the `watched-*` tiers.** The engine does not
pick a witness at random — it weights her by how strong a bond she has with
either queen in the scene, and `{b}` is whichever of the two she actually has
feelings about. So the speaker is nearly always somebody with a stake, and
`{b}` is the one she has it in. Write them as though she does. The engine
reads the SIZE of the bond and not its sign, though, so `{b}` may be her
closest ally or the queen she cannot stand — a line that assumes affection
will be wrong half the time. What settles which it is, is the tier.

---

## 3. When you are done

```
npx vitest run tests/dr-confessional.test.js tests/dr-werk-events.test.js
```

Then read a real season, which is the only check that actually matters here —
a confessional is judged against the card above it, and nothing but reading
the column will tell you whether it answers:

```
npm run audit:dr-spec
```
