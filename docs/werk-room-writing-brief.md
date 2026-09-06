# Werk Room Writing Brief

Hand this, plus `js/dr/data/werk-events.js`, to whoever is writing the prose.

---

You are writing the werk room scenes for a Drag Race simulator. The engine is
finished. Your job is the prose and only the prose.

## The file

`js/dr/data/werk-events.js` contains 62 events. Each one is fully specified —
an id, which scene of the week it belongs to, whether it needs one queen or
two, an eligibility test, and its consequences — **except** its `lines` array.

Fill in `lines`. Change nothing else. The ids, slots, `when` tests and
`effects` are referenced by the engine and by tests; moving them breaks the
build. Each event has a `note` field telling you exactly what happens in that
scene. Write that scene.

## The register — this is the part that matters

A werk room is thirteen drag queens getting ready in a room full of mirrors and
sewing machines, and the voice is specific:

- **Funny first.** These are performers. They are performing for each other
  constantly, even when nobody is watching.
- **Shade and warmth in the same breath.** They read each other for filth and
  then fix each other's zippers. A scene where somebody is cruel and then kind
  ninety seconds later is not a contradiction, it is the room.
- **Sincerity lands hard because it is rare.** When somebody drops the act and
  says something true, do not decorate it. Short sentences. Let it sit.
- **It is not a strategy game.** There is no vote here, nobody is counting
  numbers, nobody has an alliance. Cut any line that sounds like a house of
  schemers. The stakes are: am I good at this, does the room like me, will I
  still be here next week.
- **Specific beats general.** "She fixed the bodice at the shoulder" beats "she
  helped with the outfit."
- **Write the subtext, not the summary.** The best lines describe behaviour and
  let the reader draw the conclusion.

## Hard rules — all of these are tests, not preferences

1. **Placeholders.** `{a}` is the queen the scene is about. `{b}` is the other
   one in a pair event. **Never write a name.**
2. **NEVER use `{b}` in a `cast: 'solo'` event.** There is no second queen, so
   the line becomes permanently unusable. This exact mistake made half of a
   previous show's pool unreachable.
3. **No real people.** This universe has no celebrities outside its own reality
   shows. No real drag queens, no real recording artists, no real cities.
4. **This show's vocabulary only.** She is a *queen*. She *sashays away*. The
   contest is a *maxi challenge*. Never "houseguest", "castaway", "tribe",
   "eviction", "nominated", "veto", "traitor" — a guard rejects those outright.
   Also never call it a "competition"; it is a challenge.
5. **Never quote a stat.** "She cannot sew" is right. "Her design is 3" is not.
6. **Four variants minimum per event**, and they must be genuinely different
   beats — not one sentence reworded four times. The test rejects four variants
   that open with the same words.
7. **Prose, not captions.** Every line is at least a couple of sentences. If it
   reads like a stage direction it is too short.

## Two written examples

From `comforting` (pair — {a} comforts {b}):

> {b} is crying at her station and pretending she is not, which is somehow
> worse. {a} does not ask what is wrong. She sits down on the floor next to the
> chair, close enough that their shoulders touch, and stays there. After a
> while {b} starts talking. {a} mostly says "mm" and "yeah" and does not once
> try to make it better, which is exactly the correct thing to do.

From `reading-for-filth` (pair — {a} reads {b} and the room loves it):

> "I am not going to say anything about that outfit," says {a}, and then says
> three things about the outfit. {b} takes it like a professional — hand on
> chest, head back, howling — because the alternative is admitting it landed.

Four events are already written: `sewing-rescue`, `reading-for-filth`,
`comforting`, `the-empty-station`. Match that length and density.

## How to check your work

```
npx vitest run tests/dr-werk-events.test.js
```

It will tell you which events are still unwritten, and it will fail with the
event id if a line breaks any rule above.

## Suggested order

Work in batches of about ten events and run the test after each batch. The
events are grouped in the file by kind — the room and its machines, reading and
shade, the challenge, the emotional register, the funny ones, after an
elimination, and the room as a group. Doing one group at a time keeps the voice
consistent within a group, which matters more than consistency across them.
