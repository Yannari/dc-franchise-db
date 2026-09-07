# Prompt — fill `js/dr/data/crowning-beats.js`

Paste everything below the line into the writing model.

---

You are writing prose for a Drag Race season simulator. Your only job is to
fill in the empty `lines: []` arrays in one file. Do not change engine code,
do not run tests, do not create or edit any other file.

**Working directory:** `C:\Users\yanna\OneDrive\Documents\GitHub\worktree-drag-race`
**The file:** `js/dr/data/crowning-beats.js`

## Read these first

- `js/dr/data/crowning-beats.js` — the file you are filling. Its header
  explains what the ceremony is and why it is slow, and every beat carries a
  `writerNote` telling you exactly what that beat has to do. **The
  `writerNote` on each beat is your brief. Follow it.**
- `js/dr/data/finale-beats.js` — the pool this one extends. Match its voice
  exactly. Note its header: the show's real catchphrases are quoted, never
  paraphrased.
- `js/dr/data/werk-events.js` and `js/dr/data/untucked-events.js` — more of
  the same voice, in a smaller room.

## What you are fixing

The crowning ran in five lines and was over. A season builds for ten episodes
and its payoff arrived and left inside one screen-scroll. It read as a
summary of a ceremony rather than a ceremony.

A crowning is theatre with a hold in it: a room that has been assembled, a
line of people who have to stand in it while it happens to them, and a host
whose whole craft that night is making a known result take a long time to
arrive. Write that.

## The staging you are writing against

`js/vp-dr/crowning.js` draws the room as a stage: a line of lit name plates,
one per finalist, with her season's record under her name. As placements are
called from the bottom up, plates go dark one at a time until two are lit,
then one, and the last one gets a crown.

So **the reader can see who is still standing.** Your prose never has to list
them, never has to recite a résumé, and never has to say how many are left.

## Rules — all enforced by tests, the build fails on any of them

- **Placeholders are `{a}` and `{b}` only.** Never a real name, never an
  invented queen name. Each beat's `note` says what `{a}` and `{b}` are. Do
  not use `{b}` in a beat whose note does not define it.
- **Six variants minimum per tier. Ten for `crown-place`**, which fires once
  per finalist and is the beat a reader sees most. They must be genuinely
  different — a different angle, a different detail, a different emotional
  register. Not one sentence reworded six ways. This is the most important
  instruction in the prompt: the repetition ceiling in this project has never
  been the number of events, it has always been too few distinct lines inside
  one of them.
- **Prose, not captions.** Several full sentences per line. The register is
  close third person, specific, unsentimental — it earns emotion by
  describing behaviour rather than naming feelings.
- **Never state a cast size or a count of queens.** No "the other three", no
  "eight queens", no "there are two of us left". The cast is configurable and
  a finale can be a top two, three, four or five.
  `tests/dr-prose-counts.test.js` fails the build on this, and it is the
  easiest rule to break here because a ceremony wants to count.
- **This show's vocabulary only.** Queens, the werk room, the main stage, the
  panel, sashay, lip sync, maxi and mini challenge. Never a houseguest, a
  camper, a tribe, a jury, an eviction or a vote — **there is no vote in this
  show.** The panel ranks and the host decides.
- **The host's catchphrases are quoted exactly**, and everything around them
  varies:
  - `crown-name` — "Con-drag-ulations, you are the winner of this season of
    Drag Race."
  - `crown-prance` — "Now let the music play" and "Now prance, my queens."
- **No backticks anywhere in the file.** This repo has been broken three
  times by a backtick inside a template literal.
- Change nothing but the contents of `lines: []`. Not an id, not a tier id,
  not a `note`, not the order. Every id is named by `js/dr/finale.js` and by
  the screen; a renamed one silently stops being drawn.

## Order of work

The file is safe to fill a beat at a time — an unwritten tier emits no scene
rather than an empty card. If you are working in passes, do them in this
order, because these carry the most weight:

1. `crown-place` (ten variants — the spine of the ceremony)
2. `crown-name`, `crown-runnerup`
3. `crown-final-two`, `crown-envelope` (three tiers)
4. `crown-speech` (three tiers)
5. `crown-hall`, `crown-summon`, `crown-address`
6. `crown-congeniality`, `crown-regalia`, `crown-cast`, `crown-prance`

## When you are done

Report: the per-tier variant counts, and any tier you could not fill.
`unwrittenCrowningTiers()` at the bottom of the file lists what is still
empty.
