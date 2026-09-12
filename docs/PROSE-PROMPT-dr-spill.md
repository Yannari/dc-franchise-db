# Writing prompt — Spill the T, and what it costs the queen the room names

Hand this whole file to the writing model. It is self-contained; the repo is
needed to make the edit, not to understand the assignment.

**~24 lines: 3 tiers × 4 on one beat, plus 3 events × 4.** The engine is
built, wired, measured and tested. Nothing here is broken today — every pool
below ships empty on purpose, and an empty pool emits no card rather than a
blank one — so this is an addition, and it can land one tier at a time.

---

## 0. What the mini IS, because it is not like the others

Every other mini on this show is a queen doing a thing and being scored on how
well she did it. She reads somebody, she dances, she lip syncs into a hairbrush
in the werk room. There is a performance and the performance is the card.

**Spill the T has no performance.** The host asks the room a question about
itself — *"Who is the next queen to go home?"* — every queen writes an answer,
and the answers are read out. And the scoring is the part everybody gets wrong
on first hearing: **you do not win by being right. You win by agreeing with
everybody else.** The queens who answered with the majority take the round, so
the skill being tested is knowing what the room thinks, which is not a thing
this show has ever scored before.

So the cards are:

1. **The question**, asked. Already written — it is data
   (`js/dr/data/spill.js`) and drawn verbatim. Do not touch it.
2. **The tally**, drawn as a bar chart with the named queen pulled out in
   front. Data. Do not touch it.
3. **Her face.** ← this is the assignment.

She is standing in a room where six of the eight people she lives with have
just said, out loud, with her watching, that they think she is the next one
going home. It is Monday. She has not sewn a stitch. That is the whole beat,
and right now the screen draws the count and then moves on.

---

## 1. THE HOUSE RULES

1. **`{a}` is the queen the room named. `{b}`, where a beat has one, is the
   other queen in the scene.** Never write a real name into a pool.
2. **NO REAL-WORLD REFERENCES.** No films, songs, celebrities, cities,
   countries. Everything is built out of this universe: her record, the room,
   the week in front of her.
3. **She does not know the future and neither do you.** She has not been
   critiqued. Nothing has been judged. A line that treats the room's guess as
   a verdict is writing the end of the episode into its second scene.
4. **The room is not a villain.** Most of the queens who named her were
   answering honestly — the game rewards agreeing with everybody, so naming
   the obvious answer is the *correct play*, not a knife. The lines that land
   hardest know this: nobody in the room did anything wrong and it still hurts.
5. **Four variants minimum per tier you fill**, each a genuinely different
   moment — not one moment reworded. The suite fails near-duplicates.
6. **Prose brevity.** Say what happened and stop. See
   `docs/PROSE-PROMPT-dr-confessionals.md` for the house voice.

---

## 2. The beat: `mini-named`

`js/dr/data/challenge-beats.js`, the entry with `id: 'mini-named'`. Three
tiers, chosen by the question's **sting** — the same question does not land the
same way, and the tier is the difference between an afternoon ruined and a
laugh.

| tier | fired by | she has just been told |
|---|---|---|
| `brutal` | sting ≥ 0.7 | she is the next to go home / the shadiest in the room / the one most likely to crack / all talk with nothing to show |
| `pointed` | 0.3 – 0.7 | she is invisible — "could leave tomorrow and nobody would notice" — or she is the biggest threat, which is a compliment the room is also warning each other about |
| `harmless` | < 0.3 | something kind. Best friend material, or the one who would spend the money sensibly |

**`brutal`** is the reason this mini exists. The useful writing question is not
*how sad is she* but *what does she do with her hands for the next four
seconds*: the laugh that starts a beat too late, the thanking-them-for-their
honesty that fools nobody, the one who agrees with it out loud because agreeing
first is the only move left. Write one reaction, specifically. Do not write a
paragraph of her interior weather.

**`pointed`** is the awkward middle and the hardest to write, because she has
to decide, on camera, whether to take it well — and both choices cost her
something. "Invisible" is the interesting one: there is no insult to push back
against, which is exactly why it sticks.

**`harmless`** is a laugh and a round of applause and it genuinely costs
nothing. Write it light. It is also the tier that makes the other two land, so
do not skip it as filler.

---

## 3. The events: `js/dr/data/maxi-events.js`

Three entries, all `from: 'mini'`, all with `lines: []` today. These are the
*consequences* — they have already moved bonds and popularity by the time the
card draws, so write what the change looks like, never announce the number.

| id | cast | what happened |
|---|---|---|
| `named-by-the-room` | solo (`{a}` = the named queen) | Most of the room said her name on a question that stings. The accusers are the room; do not name one. |
| `named-her-to-her-face` | pair (`{a}` said it, `{b}` was named) | `{a}` and `{b}` are **close** — this only fires when the bond was genuinely there — and `{a}` said it anyway, in front of her. This is the one that costs something, and the engine only ever fires ONE of these per round, so it is the card the round is remembered for. |
| `nobody-said-her-name` | solo | Four questions about this room and `{a}` did not come up once. Not as a threat, not as a target, not as anything. The quietest bad news in the episode. |

`named-her-to-her-face` is the best material in the file. Two notes that make
it work: **`{a}` is not sorry in most of them** — she answered honestly, and
the honest answer was her friend — and the scene is usually not the naming but
the thirty seconds *after*, when they have to go back to stations next to each
other.

`nobody-said-her-name` should never be angry. She was not attacked. She was
not thought about, which is worse and much quieter, and a line that has her
storming off has misread it.

---

## 4. Where it goes, and how to check it

- The beat: `js/dr/data/challenge-beats.js`, `id: 'mini-named'` — fill the
  three tiers' `lines` arrays. Change nothing else, not the tier ids.
- The events: `js/dr/data/maxi-events.js`, the three ids above — fill `lines`.
  `cast` is already right; leave it.

```
npx vitest run tests/dr-mini-spill.test.js tests/dr-event-reach.test.js
```

Then read a real one end to end. The check no assertion makes is whether four
rounds in a row read as four different afternoons:

```
npm run audit:dr-spec
```
