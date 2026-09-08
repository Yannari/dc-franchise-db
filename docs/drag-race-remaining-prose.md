# Drag Race — everything still waiting on prose. 60 slots.

You are filling empty `lines` arrays in an existing simulator. **Do not change
any other field** — ids, phases, casts, `when`, `effects` and weights are all
engine and are already correct. Every slot below has a `note` written for you;
the note says what the scene is and it is an instruction, not a description.

Check your work as you go:

```
npx vitest run tests/dr-werk-events.test.js tests/dr-untucked-events.test.js \
  tests/dr-mini-lipsync-voices.test.js tests/dr-stage-beats.test.js
```

Each guard names the exact line and the exact rule that broke.

**An empty tier emits no scene at all** — so nothing you have not written can
appear as a blank card, and nothing changes on screen until you fill it.

---

## The rules, all enforced

1. **Four variants minimum** per slot (six where the note says six), and they
   must be different beats rather than one sentence reworded. The guard
   compares shared vocabulary across whole lines and rejects over 60% overlap.
2. **Prose, not a caption.** Over 80 characters, except where noted.
3. **Straight quotes only** — `'` and `"`. A curly quote used as a string
   delimiter is a syntax error that breaks the whole build. This has happened.
4. **No real people** beyond the host and the six authored judges.
5. **This show's vocabulary only.** Never `tribe`, `tribal council`, `camper`,
   `immunity`, `voted out`, `idol`, `merge`, `jury`, `juror`, `houseguest`,
   `evicted`, `nominated`, `the block`, `head of household`, `veto`, `traitor`,
   `banished`, `round table`. Also never the word **`competition`** in a werk
   room event — that guard is separate and it is strict.
6. **Never quote a stat by number.**
7. **Every line must name its subject** with `{a}`.

### Placeholders

| | |
|---|---|
| `{a}` | the queen it is about |
| `{b}` | the other one — **pair and group casts only** |
| `{c}`, `{d}` | the rest of the room — **group cast only.** In a solo or pair pool they render as an empty string mid-sentence, and the guard rejects them |

---

## 1. `js/dr/data/werk-events.js` — 18 slots

The werk room. Intimate, funny, quick; people mid-job with glue guns and half
a face on. Third person.

```
alone-in-the-room-early   naming-the-frontrunner   unsolicited-advice
the-early-favourite       borrowed-and-not-returned  second-guessing-out-loud
the-loud-one              she-can-actually-sew     copying-her-idea
talking-about-home        nobody-helps-her         the-mirror-pep-talk
packing-early             the-promise              last-drink-together
reading-the-mirror        relief-badly-hidden      the-empty-chair
```

Six of these are `cast: 'group'` — three or four queens, where `{c}` and `{d}`
are the rest of the room. **Use them.** A group scene that only ever names
`{a}` and `{b}` has been written as a pair, and the whole reason the cast
exists is that most of what happens in that room happens in front of people.

## 2. `js/dr/data/untucked-events.js` — 20 slots

Backstage while the judges deliberate. The queens are out of drag or halfway
out of it, there are drinks, and the thing everybody is actually thinking
about is who is going home. Higher tension than the werk room and more honest,
because the stage is over.

```
straight-to-the-mirror   pouring-for-everybody    nobody-says-it
still-in-the-wig         the-whole-room-turns     laughed-at-the-wrong-time
holding-the-room         that-is-not-what-i-said  apology-not-accepted
defended-by-somebody     reading-the-room-wrong   the-monitor
called-out-for-the-edit  not-your-turn            fixing-her-face-for-her
the-group-hug            unfinished-business      said-out-loud-at-last
she-goes-quiet           nothing-left-to-say
```

Eight are `group`. Untucked is the one segment where the entire cast is in
shot at once — a fight has an audience, and being the queen who watched it is
its own scene.

## 3. `js/dr/data/maxi-events.js` — 2 slots, the Rusical's words

`shaky-on-the-words` and `lost-the-words`.

**These are a mechanic, not a mood.** Both move her score and her popularity,
and which fires comes out of the draft: a queen beaten to the part she
prepared for has had one afternoon to learn a different set of words.
Measured: 80% solid, 12% shaky, 7% lost, **zero at draft depth 0**.

For `lost-the-words`, write what she **does** about it — standing there is one
performance and inventing something is another.

## 4. `js/dr/data/mini-voices.js` — 2 slots

`puppets/passed` and `quiz/passed`. **4 variants each.**

She stands up, opens her mouth, and has nothing. Rare and earned — the moment
everybody remembers. `reading/passed` is already written; match its shape, not
its words.

## 5. `js/dr/data/deliberation-voices.js` — 8 slots, **6 variants each**

The panel arguing with the stage empty and the queens in Untucked. This is the
only place a judge says what she actually thinks without softening it for
somebody standing in front of her.

`advocacy:{challenge|runway|risk|polish}/{champion|dismiss}`

For each contested queen the engine picks the judge who ranked her **highest**
to speak for her and the one who ranked her **lowest** to speak against, and
each argues from **the dimension the two of them differ on most** — so it
really is Michelle on the runway against RuPaul on the challenge.

`{a}` the queen, `{j}` the judge speaking, `{e}` the judge on the other side.

## 6. `js/dr/data/stage-beats.js` — 6 slots

**`results-hold/hold`** — 10 variants. The pause before the last call of the
night. It does **not** know whether what follows is a win or an elimination,
so a line that assumes either is wrong half the time.

**`sashay-words/{predator|sunshine|firecracker|professional|scrapper}`** —
the eliminated queen's last words to the room, by archetype group. A villain's
exit is not a hero's. She has just been told she is going, the other queens
are standing there, and this is the last thing she says to them.

---

## The instruction underneath all of it

**Say what is actually happening to these specific people.** The bug every one
of these pools was built to fix is prose that would print unchanged over any
queen on any night — "she looks at her for a long time before speaking, and
the pause is its own critique" is good writing about nothing. Name the thing,
name the moment, and let the archetype and the room decide the words.
