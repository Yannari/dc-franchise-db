# Writing prompt — topping up the ritual pools

Hand this whole file to the writing model. It is self-contained; the repo is
needed to make the edits, not to understand the assignment.

**18 pools, ~112 lines.** Nothing here is new machinery and nothing is
unwritten. Every one of these pools already exists, already works, and is
simply **too small for how often it fires**. You are adding variants to
pools whose voice is already established — which means the existing lines in
each pool are your brief, and matching them matters more than inventing.

---

## Why these eighteen

Measured over twenty played seasons — 26,397 scenes carrying real prose.
**4.8% of everything a reader sees in a season is a line they already saw
earlier in that same season.** That number is not spread evenly:

| family | scenes | distinct kinds | repeats |
|---|---|---|---|
| **stage beats** | 8,965 | 31 | **9.4%** |
| **challenge beats** | 4,580 | 16 | **5.0%** |
| maxi events | 3,357 | 72 | 2.7% |
| werk events | 3,598 | 101 | 1.8% |
| untucked events | 2,103 | 58 | 1.0% |
| performance | 1,388 | 17 | 0.3% |

The event catalogues are healthy. The **rituals** are not, and it is
arithmetic rather than a failure of writing: a ritual beat fires in every
single episode, and it was written to the four-variant floor — a floor that
exists so a pool cannot repeat inside ONE episode, and which was never sized
for a pool that fires eight times a season.

`stage:result-safe` fires 7 times a season out of 4 lines. It repeats 54% of
the time. That is not a pool anybody wrote badly; it is a pool nobody
resized.

**Target = roughly the number of times it fires in a season**, so a season
can run without reaching for a line twice.

| pool | file | fires / season | lines now | write to | repeats today |
|---|---|---|---|---|---|
| `chal:host-arrives/arrival` | `challenge-beats.js` | 8.2 | **4** | **11** | 55% |
| `stage:result-safe/safe` | `stage-beats.js` | 7.0 | **4** | **9** | 54% |
| `stage:entrance/open` | `stage-beats.js` | 8.2 | **5** | **11** | 48% |
| `stage:deliberation-host/stood-by` | `deliberation-voices.js (HOST_CALL)` | 6.7 | **4** | **9** | 47% |
| `stage:deliberation/split` | `stage-beats.js` | 6.3 | **4** | **8** | 47% |
| `stage:panel-intro/michelle` | `stage-beats.js` | 8.2 | **8** | **11** | 35% |
| `chal:the-division/draft` | `challenge-beats.js` | 3.9 | **4** | **8** | 31% |
| `stage:results-hold/hold` | `stage-beats.js` | 8.2 | **10** | **11** | 29% |
| `stage:closing/close` | `stage-beats.js` | 8.0 | **10** | **10** | 26% |
| `stage:lipsync-suspense/held` | `stage-beats.js` | 7.9 | **10** | **10** | 25% |
| `stage:critique-reaction/relief` | `stage-beats.js` | 13.9 | **4** | **18** | 24% |
| `chal:the-division/solo` | `challenge-beats.js` | 2.0 | **4** | **8** | 20% |
| `maxi:sabotage` | `maxi-events.js` | 15.3 | **4** | **20** | 20% |
| `stage:result-win/win` | `stage-beats.js` | 7.8 | **4** | **10** | 18% |
| `stage:critique-reaction/sadness` | `stage-beats.js` | 12.2 | **4** | **16** | 15% |
| `stage:panel-intro/carson` | `stage-beats.js` | 2.2 | **4** | **8** | 14% |
| `stage:result-bottom/bottom` | `stage-beats.js` | 16.3 | **4** | **21** | 13% |
| `stage:panel-intro/law` | `stage-beats.js` | 2.0 | **4** | **8** | 12% |

**112 lines across 18 pools.**

---

## 0. THE HOUSE RULES

Enforced by `tests/dr-stage-beats.test.js` and `tests/dr-challenge-beats.test.js`.

1. **Add to the `lines` array. Change nothing else** — not `id`, not `note`,
   not `tierBy`, not the order, and not a single existing line. This is a
   top-up, not a rewrite. If an existing line is weak, leave it and write a
   better neighbour.
2. **Match the pool you are joining.** Each section below quotes one line
   already in that pool. Register, length and rhythm should sit beside it
   without announcing which ones are new. This is the whole job.
3. **Every variant is a genuinely different beat**, not a reworded one. The
   suite fails near-duplicates inside a tier, and it will catch you adding
   the same sentence with different adjectives seven times.
4. **Placeholders:** `{a}` the queen, `{b}` a second queen, `{j}` the judge
   speaking, `{s}` the lip sync song, `{c}` the runway category, `{m}`
   whoever is running the room. **Use only the ones the existing lines in
   that pool already use** — a placeholder the caller does not fill ships to
   the screen as literal braces.
5. **Never write a real name into a pool.** No real people, no real-world
   places or shows. This universe is its own.
6. **Never quote a stat by number.**
7. **Prose, over 80 characters.** The main stage is performance and verdict —
   tighter and more declarative than the werk room.

## 1. The trap in this particular job

These fire **every episode**, which is exactly why they are thin and also why
they are the easiest place in the show to write filler. A reader meets
`result-safe` twelve times a season. Twelve ways of saying "you are safe" is
a real writing problem and the wrong solution is twelve rewordings.

**Give each variant a different thing to be about.** The call is the same; the
room is not. Who is standing there, how the night has gone, whether the group
is large or small, what the host is doing while saying it, who reacts and how.
A pool of twelve earns its place when a reader could tell you which episode a
line came from.

**And stay inside what the beat knows.** A `result-safe` line does not know
who wins. An `entrance` line does not know how the challenge goes. The most
common way a topped-up pool breaks a season is a new line that is more
specific than the moment allows.

---

## 2. The pools

Each heading gives the current count, the target, the tier's own note, how
often it fires, and one line already in the pool to write beside.

### `chal:host-arrives/arrival` — 4 → 11

*She has news and is going to take her time with it.*

Fires **8.2× a season**, repeats **55%** of the time today.

> The door goes and it is her. Out of drag, in a suit that costs more than anybody's entire wardrobe. The whole room stops mid-sentence. She lets the silence run a second longer than it needs to. She always does. Then: "Ladies."

### `stage:result-safe/safe` — 4 → 9

*You are safe. You may leave the stage.*

Fires **7.0× a season**, repeats **54%** of the time today.

> "You are safe." The words are delivered to the group and not to anyone in particular, which is the point. Being safe means you are neither the best nor the worst and tonight that is all you get. The safe queens nod and walk to …

### `stage:entrance/open` — 5 → 11

*He takes the stage and the room becomes the main stage.*

Fires **8.2× a season**, repeats **48%** of the time today.

> The lights drop and the werk room disappears and what replaces it is the main stage. The host walks out in a gown that could pay rent for a year and a wig that has its own postcode. "Hello, hello, hello!" she says, and the room …

### `stage:deliberation-host/stood-by` — 4 → 9

*What the host does with the board the panel handed her.*

Fires **6.7× a season**, repeats **47%** of the time today.

> The host looks at the board the panel built and leaves it where it is, which is not indecision — it is the host agreeing with the argument, or at least agreeing enough not to overrule it, and agreement from the host is its own …

### `stage:deliberation/split` — 4 → 8

*The judges genuinely disagree, and it is close.*

Fires **6.3× a season**, repeats **47%** of the time today.

> The panel does not agree. One judge argues for the look, another argues for the performance, and a third is going back through her notes with the expression of somebody who has changed her mind twice and is about to change it a …

### `stage:panel-intro/michelle` — 8 → 11

*Permanent, so she is introduced every single week and this tier is read more often than any other in the file — it wants the most variants. The running joke is the bluntness, and the fact that she has never once softened a note to be liked.*

Fires **8.2× a season**, repeats **35%** of the time today.

> "She don't wanna be your best friend, baby — she wants to see your WAIST. The one and only {j}!" {j} does not argue with either half of that sentence. She nods once, pats her own corset, and mouths "cinch it" at the curtain where …

### `chal:the-division/draft` — 4 → 8

*A pick order, and everybody can count.*

Fires **3.9× a season**, repeats **31%** of the time today.

> The pick order is announced and the room becomes a maths class. Everybody is counting — how many queens, how many slots, where they fall. The queen picking first tries not to look too pleased. The queen picking last tries not to …

### `stage:results-hold/hold` — 10 → 11

*She stops, and the room stops with her.*

Fires **8.2× a season**, repeats **29%** of the time today.

> The host looks at the queens still on the stage and takes a breath that the room takes with her. Whatever she says next changes somebody's night, and the pause before she says it is the loudest silence the stage has produced.

### `stage:closing/close` — 10 → 10

*If you cannot love yourself, how in the hell are you going to love somebody else?*

Fires **8.0× a season**, repeats **26%** of the time today.

> The stage is one queen shorter and everybody standing on it can feel the gap. The host does not hurry through it. She waits until the room is with her, asks it the question she asks every week, and gets the answer she always gets …

### `stage:lipsync-suspense/held` — 10 → 10

*The pause before she says a name.*

Fires **7.9× a season**, repeats **25%** of the time today.

> "I have made my decision." The host looks at both queens and lets the sentence hang there, and the hanging is the beat.

### `stage:critique-reaction/relief` — 4 → 18

*She had prepared for worse and it shows.*

Fires **13.9× a season**, repeats **24%** of the time today.

> {a} exhales. It is the exhale of somebody who has been breathing shallowly for the last ten minutes without noticing, and the depth of it says everything about what she thought was coming. She closes her eyes for one second, …

### `chal:the-division/solo` — 4 → 8

*Everybody is on their own this week.*

Fires **2.0× a season**, repeats **20%** of the time today.

> No teams. No partners. No captain, no draft, no safety net. Everybody is on her own this week. The room is relieved they cannot be dragged down and terrified they have nobody to hide behind.

### `maxi:sabotage` — 4 → 20

*{a} quietly makes {b} worse at the thing she is about to be judged on.*

Fires **15.3× a season**, repeats **20%** of the time today.

> {a} offers {b} a suggestion and the suggestion is wrong. Not obviously wrong — wrong in the way that will only become visible under the stage lights, when the proportions read differently and the hem sits where it should not — …

### `stage:result-win/win` — 4 → 10

*Condragulations. She has won the week.*

Fires **7.8× a season**, repeats **18%** of the time today.

> "Condragulations, {a}." The word fills the stage and {a} takes a breath so deep it moves her shoulders. She has won the week. The panel is smiling, the safe queens in the back are watching on the monitor, and for one moment — …

### `stage:critique-reaction/sadness` — 4 → 16

*She holds it together for exactly as long as she has to.*

Fires **12.2× a season**, repeats **15%** of the time today.

> {a} nods through it. She nods and she nods and the nodding is the thing that is keeping her face together, because as long as she is nodding she is agreeing and agreeing is a posture and a posture is not crying. She holds it. She …

### `stage:panel-intro/carson` — 4 → 8

*Puns first, fashion second. He will pun back and the host knows it, so this introduction is a setup rather than a punchline.*

Fires **2.2× a season**, repeats **14%** of the time today.

> "Also joining us — the man who puts the PUN in pun-dit — {j}!" {j} grins and fires back something worse and better at the same time, and the host pretends not to laugh and fails. "Oh, you came to PLAY tonight," she says, and {j} …

### `stage:result-bottom/bottom` — 4 → 21

*I am sorry, my dear. You are up for elimination.*

Fires **16.3× a season**, repeats **13%** of the time today.

> "I am sorry, my dear, but you are up for elimination." The words arrive and {a} receives them standing straight with her chin up because she has been preparing for this moment since the critiques started and the preparation is …

### `stage:panel-intro/law` — 4 → 8

*A fashion authority, unimpressed by default. The host introduces him the way you introduce weather that is about to happen to somebody.*

Fires **2.0× a season**, repeats **12%** of the time today.

> "The LEGENDARY {j}!" The host says it with weight and {j} does not wave, does not stand, does not smile — he nods, once, with the economy of a man who has dressed people for a living. "Ooh, girl, he is already judging," the host …

---

## 3. When you are done

```
npx vitest run tests/dr-stage-beats.test.js tests/dr-challenge-beats.test.js
```

Those hold the four-variant floor, the no-near-duplicates check, the
length floor and the vocabulary guard. `dr-stage-beats` also prints a
"thin for a ritual" list — the pools in this document should fall off it.

Then read a real season, which is the only check that finds the thing the
suite cannot: a pool of twelve that is really one line written twelve ways.

```
npm run audit:dr-spec
```
