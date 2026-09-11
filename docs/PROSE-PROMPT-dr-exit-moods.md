# Writing prompt — how she is taking it

Hand this whole file to the writing model. It is self-contained; the repo is
needed to make the edit, not to understand the assignment.

**7 tiers, 6 lines each, ~42 lines.** One new beat, `sashay-mood`. The engine
is built, wired, measured and tested. Every pool is empty, and an empty pool
emits no card at all — so the exit reads exactly as it does today until these
are written, and changes the moment they are.

---

## The problem this fixes

**Every queen leaves this show gracious.**

Not a writing choice — a missing axis. The four beats of an elimination are
`lipsync-sashay`, `sashay-words`, `farewell` and `mirror-message`. Three are
`tierBy: 'always'` — one pool, no variation by anything. The fourth,
`sashay-words`, keys on **swagger**, which is her runway persona: predator,
sunshine, firecracker, professional, scrapper. Five personalities and one
emotion. Its own writer note says the quiet part out loud:

> Every queen thanks the show — that part is ritual and should stay
> recognisable.

Meanwhile the engine has always known how she is feeling. `reactions[n]` —
`blow-up`, `crash-out`, `tears`, `sadness`, `idgaf`, `relief`, `joy` — is
computed every week from her temperament and how far the call fell below what
she expected. It is read in exactly one place: the critique-reaction beat. It
never reached the door. Measured on a played season, episode three:

> **Q8 · reaction at the call: `crash-out`**
> *"They counted me out on day one. I stayed until now. That maths is mine
> and nobody can take it."* Q8 taps her chest once and exits with the walk of
> someone who outperformed every prediction.

She fell apart on the main stage and left composed, proud and walking tall.

## What you are writing, and what you are NOT

`sashay-mood` sits **beside** her parting shot, not instead of it. The order
on screen is:

```
  the host       "…now, sashay away."
  [sashay-mood]  ← YOU ARE HERE. The room watches her take it.
  [sashay-words] Her own last words, in quotes, in her persona voice.
  [farewell]     The goodbyes around the room.
  [mirror-message] The lipstick on the glass.
```

**She has not spoken yet.** That is the single most important constraint
here. This beat is the narrator on her face, her hands, her shoulders, what
the room does around her — the seconds between the verdict and her answer.

The point of splitting it this way is that a firecracker can be **visibly
devastated** and then still go out loud. Neither beat could say that alone.

---

## 0. THE HOUSE RULES

Enforced by `tests/dr-stage-beats.test.js` and `tests/dr-exit-mood.test.js`.

1. **`{a}` is her. There is no `{b}`.** No other placeholder is available.
2. **Narrator, not speech. No quotation marks, no dialogue for her.** Her
   words are the next beat and putting them here says the same thing twice
   and steals the better version's moment. The host may not speak here
   either — he has just finished.
3. **She does not know what happens next.** No "she would return", no "the
   season would miss her", no knowledge of where she placed overall.
4. **Six variants per tier, each a genuinely different beat**, not one
   sentence reworded. The suite fails near-duplicates inside a tier.
5. **Prose, over 80 characters.** Main-stage register: performance and
   verdict, tighter and more declarative than the werk room.
6. **No real people, no real-world references.** This universe is its own.
7. **Never quote a stat by number.**

## 1. The trap

Six of these seven moods are some flavour of *bad*, and the failure mode is
forty-two lines of a woman being sad in slightly different words.

**Separate them by what the body is doing, not by how upset she is.** Bitter
and gutted are not the same intensity of one feeling — they point in opposite
directions. Bitter looks outward and holds itself very still; gutted looks
inward and stops holding anything. Resigned has already finished feeling it.
Relieved is not sad at all. If a line would sit in three tiers, it belongs in
none.

And **give the room something to do.** The other queens are standing right
there, and what they do — move toward her, not move at all, look away, start
crying first — is half of what tells the reader which of these it is.

---

## 2. The seven moods

In `js/dr/data/stage-beats.js`, the beat with `id: 'sashay-mood'`. Fill the
`lines` arrays and change nothing else. The logic that picks them is
`js/dr/exit-mood.js`; the share is measured over forty played seasons.

### `bitter` — 6% of exits
*She is angry, and it is at people rather than at the result.*

She went off **in front of everybody** at the call — that is what `blow-up`
means and it is the only thing that routes here. Then she lost. The anger has
nowhere to go and she is not putting it away for the cameras. Play: a
stillness that is not calm, a queen who will not look at one specific person,
politeness deployed as a weapon, the room deciding not to approach.
**Do not** make her shout — she already did that, and this is after.

### `gutted` — 33% of exits
*She does not hold it together.*

The biggest tier and the one most at risk of being generic. `crash-out` or
`tears` at the call, or a temperament that was never going to survive this.
Play: the specific mechanics of falling apart — the hand over the mouth, the
legs, the make-up, needing to be held up, the sound before the sound.
Physical, precise, and different every time.

### `robbed` — 7% of exits
*It was close and she believes she won it.*

Only routes here if she has **placed before** — a WIN or a HIGH in her
record — and lost the song by almost nothing. So she has evidence and she
knows it. Play: the double-take, the look at the judges rather than the
floor, a queen doing arithmetic in real time, disbelief that has not yet
become anger. **Do not** let her be right or wrong; the narration does not
adjudicate.

### `blindsided` — 30% of exits
*She had never been in the bottom before tonight.*

The other big one. First time down here, and it was the last time. She has no
practice at this. Play: the gap between the queen who walked out this morning
and the one standing here, a body that does not know the choreography of
losing, looking for somebody to confirm this is real.

### `relieved` — 8% of exits
*It is over and she is all right about that.*

`idgaf` or `relief`, and a temperament high enough to mean it rather than
perform it. Play: shoulders down, the first real breath in weeks, a queen who
is lighter than she has been since the premiere — and the faint
embarrassment of being visibly fine when everybody expects devastation.

### `resigned` — 7% of exits
*She has been down here before and saw it coming.*

Two or more bottoms already. She has done the walk, she has done the song,
she has run out of ways to survive it. Play: efficiency. She has already
finished feeling this, some of it days ago. Nothing is a surprise and that
is its own sadness.

### `composed` — 8% of exits
*She takes it cleanly, and the composure is the story.*

The default, and it must not read as the absence of a mood. She is choosing
this, deliberately, in front of cameras, and choosing it costs something.
Play: the decision being visible; a queen who worked out backstage exactly
how she wanted to be remembered leaving.

---

## 3. When you are done

```
npx vitest run tests/dr-stage-beats.test.js tests/dr-exit-mood.test.js
```

Then read real exits end to end — mood beat, then her parting shot, then the
farewell. The thing to check is that the two beats are not saying the same
thing twice, which no assertion can see:

```
npm run audit:dr-spec
```
