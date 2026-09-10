# Writing prompt — the top two, called before they sing

Hand this whole file to the writing model. It is self-contained; the repo is
needed to make the edit, not to understand the assignment.

**Two tiers, eight lines total.** They are the only thing left unwritten in a
fix that is otherwise shipped and tested.

---

## What happened, and why these lines do not exist yet

On a **Rate-a-Queen no-elimination night** the queens rank each other, the two
the room puts highest lip sync **for the win**, and nobody goes home. On a
**Lip Sync for Your Legacy** night the top two sing and the winner chooses who
leaves.

Both nights call the top two one at a time before the song. Until now they
were handed the ordinary `high` pool — the one for a queen who placed near the
top on a normal week — and **every line in it tells her she did not win**:

> "{a}, you did not win tonight." … "Not the winner — but one of the best."
> "she was good. Not the best — somebody else was the best."

Said to *both* queens, ninety seconds before one of them wins. The narration
knowing something false is the one thing this show's prose may not do, so the
beat now emits **nothing** for these two rather than saying the wrong thing.
That is the gap you are filling.

---

## 0. THE HOUSE RULES. Read these before writing a word.

Each is enforced by `tests/dr-stage-beats.test.js`.

1. **`{a}` is the queen. Never write a name into a pool.** `{a}` is filled at
   render time. No other placeholder is available in this beat — in
   particular **you do not know the song title here**, and you must not
   reference it.
2. **NEVER say or imply who wins.** This is the entire reason the tiers exist.
   No "and I think we all know how this ends", no leaning toward either of
   them. At this moment the result does not exist yet.
3. **NEVER say she did not win.** Equally false. She has not lost either.
4. **Four variants minimum per tier** (write six), each a genuinely different
   beat — not one sentence reworded. A near-duplicate fails the guard.
5. **Every line is prose, over 80 characters**, in the main stage's register:
   performance and verdict, tighter and more declarative than the werk room.
   A line is one to three sentences of host speech plus what the queen's body
   does with it. Read the `high`, `result-win` and `result-btm` pools in
   `js/dr/data/stage-beats.js` for the voice.
6. **No real people, no real-world references.** This show's vocabulary only.
7. **Never quote a stat by number.**

---

## 1. Where the lines go

`js/dr/data/stage-beats.js`, the beat with `id: 'result-high'`. Two empty
tiers sit at the end of its `tiers` array. Fill the `lines` arrays and change
nothing else — not `id`, not `note`, not the order.

```js
tier('win',    'The top two of the week. She is about to sing for it.', [ /* HERE */ ]),
tier('legacy', 'The top two. The winner of the song holds the power.', [ /* HERE */ ]),
```

## 2. What each tier is

### `win` — the Rate-a-Queen night

**Her situation:** the *queens* ranked this week, not the judges. The room put
her at the top. Nobody is going home tonight — the whole cast already knows
that. She is about to lip sync against the only other queen the room rated as
highly as her, and the prize is the week.

**What is available to play, and worth using across the six:**
- The room chose her. That is a different compliment from the panel choosing
  her, and it is the one thing this night has that no other night does — her
  competitors, who have every reason not to, said she was the best.
- There is no danger in the room, so the tension is pure ambition.
- She is being told she is one of two, and the other one is standing right
  there, and she is about to find out which.
- The host is enjoying this. Nobody can lose, so he does not have to be kind.

**Do not** write the ranking as though the panel produced it. **Do not**
suggest safety is a relief — she was never at risk.

### `legacy` — the Lip Sync for Your Legacy night

**Her situation:** she is top two, she is about to sing, and the winner does
not win a prize — the winner **chooses who leaves the competition tonight.**
Somebody in the room behind her is going home and the song decides who picks.

**What to play:**
- The prize is power, and power over people she has been living with.
- She is safe, and being safe is not the point and barely registers.
- The queens behind her are listening to this call knowing one of them is
  about to be chosen by whoever wins.
- The host does not enjoy this one the way he enjoys the other. Same call,
  colder room.

**Do not** name or hint at who she would pick. She has not won yet and the
choice is a later beat.

Keep the two tiers audibly different. If a line would work in both, it is
probably not doing the work of either.

---

## 3. When you are done

```
npx vitest run tests/dr-stage-beats.test.js tests/dr-season.test.js
```

`dr-stage-beats` holds the four-variant, no-duplicate, length and vocabulary
guards. Then read a real night — the pools are only actually good if the call
reads well end to end:

```
npm run audit:dr-spec
```
