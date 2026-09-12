# Writing prompt — Untucked, after "Who should go home?"

Hand this whole file to the writing model. It is self-contained; the repo is
needed to make the edit, not to understand the assignment.

**20 lines: 5 events × 4 variants.** The engine is built, wired and tested.
The five pools are EMPTY and the show runs fine without them — an event with
no lines is skipped before it can be chosen, so nothing is broken today and
each pool can land on its own.

---

## What just happened, in the fiction

On the main stage the host asked the room: **"Who should go home tonight, and
why?"** Every queen answered out loud, by name, in front of the queen she
named. The board went up — most-named first — and then everybody went
backstage to Untucked and sat on a couch together.

That is the whole premise. The naming is public, it is recent, and the person
you named is in the room.

This is the only pool in the file gated on what happened in the *critiques*
rather than on who somebody is. Write it as fallout, not as general backstage
tension.

---

## The five events

Each needs **four variants** that are four different beats, not one beat
reworded. Assume the engine picked a pair for whom the gate is true — you
never have to establish that she was named, only play it.

### 1. `named-me-to-my-face` — pair, arrival phase

`{a}` was named on stage. `{b}` is one of the queens who named her, and they
are now backstage together. `{a}` speaks first.

Effects already applied: their bond −2, `{a}` +1 with the audience. So `{a}`
comes out of this looking better than `{b}` does. She does not have to win the
exchange, but the room should be on her side.

### 2. `named-by-a-friend` — pair, arrival phase

The same, except **`{b}` is somebody `{a}` actually liked** (bond ≥ 3 before
tonight). This is the one that leaves a mark: bond −3, `{a}` +2, `{b}` −2.

Do not write it as a bigger version of #1. A rival naming you is an insult; a
friend naming you is a re-evaluation of the whole season so far. Quieter, if
anything.

### 3. `the-pile-on` — solo, middle phase

**Three or more** queens named `{a}`. She is alone in this one — no `{b}` —
sitting in a room with the people who did it, and there is no single person to
be angry at.

Effects: `{a}` +3 with the audience, and she ends the scene `rattled`.

### 4. `named-herself-backstage` — solo, arrival phase

`{a}` said **her own name** on that stage. The engine only does this for a
queen with high loyalty who was already in the bottom, and it calls it "the
most sympathetic thing anybody does all night and it is not a strategy."

Effects: `{a}` +4 with the audience — the largest single audience gain in the
file — and she ends `low`.

The room does not know how to handle her. Write that, rather than writing her
being sad.

### 5. `defends-the-name` — pair, middle phase

`{a}` named `{b}`, and `{a}` is **not apologising for it** — out loud, to her
face, in the room. The engine only offers this to a queen who is allowed to
scheme.

Effects: bond −2, `{a}` −2 with the audience, `{b}` +1. So this one costs the
speaker. She is being honest and the room does not thank her for it.

---

## Voice

Read the rest of `js/dr/data/untucked-events.js` before writing — it is the
register, and these lines have to sit beside it without a seam. What that file
does, consistently:

**Report the body, not the feeling.** Never "she was furious". The line that
works is the one that describes what a camera would see.

> `{b}` reaches for `{a}`'s arm the second they are backstage. `{a}` moves it.
> Not dramatically — just out of reach — and `{b}` sees her do it.

**Let the small line carry it.** The quoted dialogue is short and flat. The
narration does the work around it.

> "I had to pick somebody," `{b}` says. "You had eleven other options," `{a}`
> says.

**Undercut instead of escalating.** The file's best lines get quieter at the
moment another writer would get louder.

> She is not crying and she is not shouting; she is doing the arithmetic in
> front of the people who made it.

**Name nobody.** No queen names, no season references, no real people. The
engine fills `{a}` `{b}` `{c}` `{d}` at render time and a name in a pool is a
bug — `tests/dr-untucked-events.test.js` fails on one.

**Do not write RuPaul.** He is on the main stage; this room is the queens.

---

## Hard constraints

The suite enforces all of these, so a line that breaks one will fail before it
ships:

- **Four variants per event**, all four a different beat. `tooSimilar()` in
  `tests/dr-untucked-events.test.js` rejects two that are the same moment
  reworded.
- **Only `{a}` `{b}` `{c}` `{d}`.** Any other `{token}` fails. (`{q}` was used
  as a stand-in for a quote mark once and reached the screen as
  `"{q}You said my name.{q}"` — that is what the guard is for.)
- **Solo events use `{a}` only.** No `{b}` in #3 or #4 — there is no second
  queen and the renderer will not fill one.
- `{c}` and `{d}` are the rest of the couch when you want them: the queen who
  says nothing, the one who laughs at the wrong moment. Optional.
- **Double quotes inside the JS string need escaping** — `\"like this\"`.
- Length: roughly 200–400 characters, matching what is already in the file.

---

## Where it goes

`js/dr/data/untucked-events.js`. Find each id and fill its `lines: []`:

```js
ev({
  id: 'named-me-to-my-face', phase: 'arrival', cast: 'pair', weight: 6,
  note: 'She said the name on stage. Backstage the name is sitting right there.',
  arcs: ['narrator', 'villain'], when: f => f.bNamedA,
  partners: (a, h) => h.namersOf(a),
  effects: { bond: -2, pop: { a: 1 } },
  lines: [],   // <- four here
}),
```

Change nothing else. The gating, the effects, the partner hooks and the
weights are measured and wired — `tests/dr-who-should-go.test.js` asserts the
confrontation only ever happens with a queen who actually named her, and that
the fallout reaches the room on most nights the twist is booked.

Run `npx vitest run tests/dr-untucked-events.test.js tests/dr-who-should-go.test.js`
when the lines are in.
