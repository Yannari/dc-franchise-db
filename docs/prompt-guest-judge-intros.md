# Prompt — the guest judge introductions

You are writing prose for a Drag Race simulator. Fill five empty tier pools in
`js/dr/data/stage-beats.js`, on the beat `panel-intro`. The schema, the engine
and the guards are already written and committed — **do not change any code,
only fill the empty `[]` line arrays.**

## The moment

The main stage. RuPaul introduces the panel one seat at a time before the
critiques. Four seats are permanent judges with their own written pools; the
fifth is a **guest judge**, and she is the one you are writing.

A guest is not a celebrity. **This universe has no famous people outside its own
reality shows**, so a guest judge is a franchise alumnus — somebody the audience
watched compete for a whole season on Total Drama, Big Brother or The Traitors,
and who is famous enough that the ledger grades her S+, S or A.

That is the whole point of the beat: a permanent judge is a taste, but a guest
arrives carrying **a season the viewer already watched**. The introduction should
feel like a door opening on somebody with history.

## THE ONE RULE THAT MATTERS

Two placeholders, filled at render time:

| token | is | example |
|---|---|---|
| `{j}` | her name | `Wayne` |
| `{k}` | her credit | `the winner of Total Drama 13` |

**`{k}` is the only claim about her past any line may make.** It is derived from
the appearance record, so it is always true. **Never invent a second one** — no
"who needs no introduction", no "back from her legendary run", no reference to a
rivalry, a win, a season number or anything she did that is not inside `{k}`.
The host inventing a past is worse than the host saying nothing.

Every line may assume `{k}` is present and reads naturally in a sentence:
*"joining us tonight — {k}, {j}!"* → *"joining us tonight — the winner of Total
Drama 13, Wayne!"*

**Never write a real name into a pool.**

## Format

Each pool is a JS array of double-quoted strings inside
`tier('<id>', '<note>', [ ... ])`. Escape inner double quotes as `\"`.

## What to write — five pools, 6 lines each

The five are the show's existing archetype grouping (from
`js/dr/data/runway-voices.js`), not a new taxonomy. Write the **room's reaction**
as much as the host's sentence — the difference between these tiers is how the
audience and the panel receive her.

| tier | archetypes | who walks in |
|---|---|---|
| `guest-predator` | villain, mastermind, schemer | The room knows what she did and she has not apologised for it. The applause has an edge — some of it is admiration and some of it is not. She is comfortable with that. |
| `guest-sunshine` | hero, loyal-soldier, social-butterfly, showmancer | Loved, and the welcome is uncomplicated. The queens are pleased to see her. Nothing here is complicated and the beat should not pretend otherwise. |
| `guest-firecracker` | hothead, chaos-agent, wildcard | Unpredictable, and the panel is visibly braced. Whatever she is about to say in the critiques, nobody can guess it — including the host, who enjoys that. |
| `guest-professional` | challenge-beast, perceptive-player | She won things. The respect is for the record rather than the personality, and the room is a little more formal for it. |
| `guest-scrapper` | underdog, goat, floater | She was not supposed to get as far as she did and everybody remembers it. The welcome has real affection in it, and a note of surprise that has never quite worn off. |

## Quality bar (enforced by `tests/dr-stage-beats.test.js`)

- **Over 80 characters** per line. Prose, not a caption — two to three sentences,
  matching the pools already in the file.
- **No two lines in a tier may share most of their vocabulary.** A guard compares
  whole lines and rejects the same beat reworded. Vary the shape: some lead with
  the host's sentence, some with the room, some with what she does as she sits.
- **Speak this show only.** No `evicted`, `nominated`, `on the block`,
  `houseguest`, `tribal council`, `banished`, `Round Table`, `merge`, `jury`.
  She may have come from those shows; this stage does not use their words.
- **Present tense, third person** outside the quotes; the host's words in quotes.
- Read `panel-intro`'s existing `guest` and `guest-credited` tiers first — they
  are the register to match, and they are also the fallbacks you are replacing.
- **The host is warm here.** He is pleased to have her. Even the predator's
  welcome is a welcome.

## Check your work

```
npx vitest run tests/dr-stage-beats.test.js --reporter=verbose
```

It prints what is still unwritten and fails on any rule above. All five tiers
listed as "still to write" should be gone when you are done.
