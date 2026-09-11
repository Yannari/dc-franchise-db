# Writing prompt — confessionals on the stage, the runway, the song and the draft

Hand this whole file to the writing model. It is self-contained; the repo is
needed to make the edit, not to understand the assignment.

**16 tiers, 6 lines each, ~96 lines.** The engine is built, wired, measured
and tested. Every one of these pools is empty, and an empty pool emits no card
at all — so the feature is silent until they are written, and runs the moment
they are.

This is the **second** confessional brief. `docs/PROSE-PROMPT-dr-confessionals.md`
covered the werk room and its seven tiers, and those are written. Read its
voice section (§1) — it applies here unchanged and is not repeated.

---

## What changed, and why these are different tiers

A werk-room confessional reacts to **two queens and a bond**: somebody did
something to somebody, and it warmed or cooled. That gave the first seven
tiers their axis — *did it / had it done / watched it*, by *warm / cold*.

These four surfaces are not that shape. A runway walk, a lip sync, a pick at
the draft and a moment in the challenge are **one queen and a result**. There
is no pair and no bond to move, which is exactly why they carried no
confessional at all: measured over thirty seasons, four of the episode's
twenty-four steps had three hundred between them and the other twenty had
none.

So the axis here is:

> **`mine` or `hers`** × **`landed` or `missed`**

- **mine** — it was her walk, her song, her pick, her moment.
- **hers** — she watched another queen have it.
- **landed / missed** — read off the scene's own number (the walk's score, the
  lip sync score, the challenge performance, whether she lost the pick at the
  draft), compared against the **median for that step on that night**. So it
  means *her standing among the others tonight*, not an absolute.

The surface supplies the vocabulary, and that is the whole reason there are
sixteen tiers rather than four: *"I thought the look was going to read"* and
*"I watched her fight for her life up there"* are not the same sentence with a
noun swapped.

---

## 0. THE HOUSE RULES

Enforced by `tests/dr-confessional.test.js` and the drag prose guards.

1. **`{a}` is the queen talking.** Never write a real name into a pool.
2. **`{b}` EXISTS ONLY IN THE `hers` TIERS.** A `mine` confessional is about
   her own walk and has nobody else in it. A `{b}` in a `mine` pool is dropped
   at runtime — a wasted line, not a crash.
3. **She does not know the result.** This is the sharpest rule here and the
   easiest to break. A runway confessional happens before the critiques. A
   lip sync confessional does not know who is staying. A draft confessional
   does not know whether the team worked. **She has an opinion, not an
   outcome.** Never write "and that is why I won this week."
4. **Never name the consequence.** The card draws "audience −1" underneath.
5. **Six variants per tier, each a genuinely different beat**, not one
   sentence reworded. Prose, over 80 characters, in her speaking voice.
6. **No real people, no real-world references.** This show's vocabulary only.
7. **Never quote a stat by number.**
8. **`{b}` may be her closest ally or the queen she cannot stand.** The engine
   weights the speaker by the SIZE of her bond to `{b}`, not its sign — so a
   `hers` line that assumes affection is wrong half the time. Write them as
   two people with history, and let the tier say whether it is warm.

---

## 1. The sixteen tiers

In `js/dr/data/confessional-lines.js`. Fill the `lines` arrays and change
nothing else — not `id`, not `note`, not `sign`, not the order.

### `runway-*` — the walk

She is in the look, on the runway, in front of the panel. The category is the
brief and the look is the answer to it.

| tier | she is |
|---|---|
| `runway-mine-landed` | in a look she knows worked. The nerve of having pulled it off. |
| `runway-mine-missed` | in a look that did not read. She knew on the second step. |
| `runway-hers-landed` | watching `{b}` walk something better than hers. |
| `runway-hers-missed` | watching `{b}`'s look fall apart in front of the panel. |

Play: the gap between what it looked like in the workroom and what it looks
like out there; the queens watching from the back; knowing before the judges
do.

### `lipsync-*` — the song

Two queens on the mark. The rest of the cast is watching from the back of the
stage. She does **not** know who stays.

| tier | she is |
|---|---|
| `lipsync-mine-landed` | one of the two, and she gave it everything and knows it. |
| `lipsync-mine-missed` | one of the two, and it got away from her. |
| `lipsync-hers-landed` | watching `{b}` be undeniable up there. |
| `lipsync-hers-missed` | watching `{b}` lose it in front of everybody. |

Play: adrenaline and what it does to memory; watching somebody fight for their
life when you have a history with them; the safe queens at the back who are
doing arithmetic and know they should not be.

### `choice-*` — the draft

Picking teams, slots, verses, partners. Somebody gets what she wanted and
somebody is left with what is left.

| tier | she is |
|---|---|
| `choice-mine-landed` | holding the slot or the partner she wanted. |
| `choice-mine-missed` | holding what nobody else took. |
| `choice-hers-landed` | watching `{b}` take the thing that was going well. |
| `choice-hers-missed` | watching `{b}` end up with the scraps. |

Play: the order of the picks as a scoreboard nobody admits is one; being
polite about a slot you hate; pretending a bad slot is a gift.

### `maxipre-*` — the moment in the challenge

The acting scene, the Snatch Game seat, the verse — the part of the challenge
where it either happened or it did not. **This is not the runway and not the
panel.** It is the work itself.

| tier | she is |
|---|---|
| `maxipre-mine-landed` | fresh off a moment that worked. |
| `maxipre-mine-missed` | fresh off a moment that died in the room. |
| `maxipre-hers-landed` | having watched `{b}` land hers. |
| `maxipre-hers-missed` | having watched `{b}`'s die. |

Play: the silence after a joke that did not land; knowing mid-take; a room of
queens who are also competitors deciding whether to laugh.

---

## 2. Where to be careful

- **`hers-missed` is the shade tier** in each surface, and the engine only
  hands it to a queen sharp enough to speak it — weighted by archetype, by
  strategic-over-loyal, and by how she feels about `{b}`. So write them with
  teeth; a limp one wastes the only tier with permission.
- **`mine-missed` is not shade.** She is being hard on herself and *anybody*
  speaks it, hero included. Write it as honesty, not self-flagellation.
- **`hers-landed` is not sweet.** Somebody else being good is a problem for
  her, and the best line is the one where she is generous out loud and
  counting in her head.
- **Keep the four surfaces audibly apart.** If a line would work on the runway
  and in the lip sync, it is doing the work of neither. The test that catches
  near-duplicates only looks inside a tier; these four will read as one voice
  if you let them.

---

## 3. When you are done

```
npx vitest run tests/dr-confessional.test.js
```

`tests/dr-confessional.test.js` asserts the outstanding backlog **as an exact
list**, so it will go red as you fill pools — that is deliberate. Delete each
id from the expected array in the "reports the backlog exactly" test as you
finish its tier, which is the moment to check the tier really is done.

Then read a real season. A confessional is judged against the card above it,
and nothing but reading the column will tell you whether it answers:

```
npm run audit:dr-spec
```
