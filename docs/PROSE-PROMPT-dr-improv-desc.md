# Writing prompt — the Improv Challenge description

Hand this whole file to the writing model. It is self-contained; the repo is
needed to make the edit, not to understand the assignment.

**One paragraph, ~250 words of source, in one field.** The smallest brief in
this set and the one with the most specific failure to correct: the
description of this challenge describes a challenge the engine does not play.

---

## What is wrong

`js/dr/data/challenges.js`, the entry with `id: 'improv'`, field `desc`. It
currently reads:

> Queens are **paired into scenes** with a premise and a character each but no
> script at all, and play them out in front of the host and **a comedy coach
> who feed in twists partway through**. Each scene runs until the host calls
> it, and **every pair gets the same number of twists** thrown at them.
> **Blocking a partner**, reaching for the same joke twice, or freezing the
> moment the twist lands is what dies out there. The queen who keeps the scene
> alive and gets the biggest laugh wins.

Almost every clause is false. There are no pairs, no partner to block, no
coach, no twists fed in, and no scene that runs until the host calls it. The
engine has played this solo in every season ever generated — `assign` in
`js/dr/chal/acting.js` returns `teams: []` and `division: 'solo'`, and the
catalogue's `format` field has just been corrected from `pairs` to `solo` to
match. The `desc` is the last thing still describing the old idea, and it is
the one the viewer actually reads: it is drawn on the challenge screen and is
the only place they are told what the queens are doing.

---

## What actually happens

Read from the engine, not remembered:

- **Each queen is alone.** No partner, no team, no group.
- **She is given one character, cold.** They are drawn from a list and no two
  queens get the same one. The flavour of them, so you can pitch the writing
  right: *a psychic who is always slightly wrong*, *a tour guide of a building
  she has never entered*, *a wine expert tasting tap water*, *a newsreader
  whose autocue has failed*, *a life coach whose own life is visibly
  collapsing*, *a translator who does not speak either language*.
- **There is no rehearsal and no preparation of any kind.** The engine
  short-circuits the whole prep afternoon for this challenge and emits a scene
  called `no-rehearsal`. The module's own comment: *"IMPROV HAS NO REHEARSAL.
  That is the point of improv."* Nothing she could have practised counts.
- **Nerve is the biggest single term in the score** — bigger than comedy,
  bigger than acting. A cautious queen with better craft loses to a fearless
  one who commits. That is deliberate and it is what makes this a different
  challenge from the acting week.
- **Freezing is the failure.** A queen who hesitates on the mark loses it
  outright, and the less nerve she has the likelier it is — the timid freeze
  roughly a third of the time, the fearless almost never.

## What to write

One paragraph replacing `desc`. The house rule for a challenge description in
this franchise is that it states four things **in this order**:

1. **The set-up** — what is on the stage and what each queen has.
2. **The mechanic** — what she actually does, step by step.
3. **What goes wrong** — the failure that costs you.
4. **The win condition** — said outright, using the word "wins".

Keep what was good about the old one: it was concrete and it had a voice. Just
make it true.

**Things to make sure land:** that she is alone; that she gets the character
cold with nothing prepared; that the premise is a person rather than a scene;
that commitment beats polish here; and that freezing is what kills you.

**Do not** invent machinery to replace the machinery you are deleting. No
twists, no timer, no coach, no scene partner, no rounds — if it is not in the
list above, the engine does not do it, and a description that promises a
mechanic is a promise the night will not keep. That is the whole reason this
brief exists.

---

## The guard

`tests/dr-catalogue.test.js` already enforces the shape:

```js
expect(m.desc.length).toBeGreaterThan(200);          // long enough to explain
expect(m.desc.split(/[.!?] /).length).toBeGreaterThan(2);   // not one sentence
expect(m.desc).toMatch(/fail|wrong|sink|bur|lose|los|dies|cost|bomb/i);
expect(m.desc).toMatch(/\bwins?\b/i);
```

So: over 200 characters, at least three sentences, it must name the failure,
and it must contain the word "wins".

```
npx vitest run tests/dr-catalogue.test.js
```

**The guard that would have caught this now exists**, and improv is its one
documented exception:

```js
const PENDING = new Set(['improv']);
```

**When you have rewritten the desc, delete that entry.** A companion test
asserts the current improv desc still trips the guard, so it goes red the
moment the prose is fixed and tells you to remove the exception — the list
only ever shrinks.

A note on the shape of that check, because it constrains your wording: it
looks for a **collaborator**, not an opponent — `partner`, `teammate`,
`paired into/with/up`, `in teams`, `as a team`. A bare "pair" is fine
(`lipsync-challenge` says "each pair performs head to head" and that is a
bracket, not a team). You will not trip it by accident writing what actually
happens, because what actually happens involves nobody else at all.
