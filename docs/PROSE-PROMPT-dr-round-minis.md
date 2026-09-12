# Prose brief — Spill the T and Guess Who

Two minis in `js/dr/data/mini-voices.js` ship with their schema in place and
their pools empty. **Everything here is DIALOGUE, not narration.** That is the
whole point of the brief.

## Why these two had no voice at all

Every other mini tiers on `nailed / decent / flat` — a queen does a thing and
is scored on it. These two are not that. The host asks the **room** a question
and the room answers; nobody performs, so there is nothing to rank and the
three attempt tiers have no meaning. So both shipped with no entry, and the
coverage guard had been red on `guess-who` since the mini was built.

They tier on the per-round outcome the engine already decides instead.

## The house style, which these must follow

`reading` already sets it, and its own note says it best:

> the line is not a description of a read — it **IS** the read, in quotation
> marks, in her mouth, followed by what the room did with it. A line like
> "{a} reads {b} beautifully" is the thing this pool exists to replace.

Same rule here. These rounds are a room full of queens shouting at each other.
What is missing from the screen is not a paragraph about the round — it is the
**noise**.

So: put the words in somebody's mouth. Quotation marks. Then one short beat of
what the room did with it. Never "the room reacts to the result".

---

## Spill the T — `cast: 'vote'`

The host reads a superlative about the room, every queen writes a name, and
the names go up on a board. Queens who voted **with the majority** take the
round — it scores whether you know what everybody else thinks, not whether you
are good at something.

The question itself is **data** — written once in `js/dr/data/spill.js` and
asked verbatim on the card — so do not rewrite it. What is missing is the room.

`{a}` is **the queen the room named**.

| tier | what it is |
|---|---|
| `announce` | The host reads the question out. Her line, not a description of it. |
| `brutal` | The room piled on one queen and she has to answer it to their faces. |
| `pointed` | A clear answer with a bit of blood in it. She takes it or she does not. |
| `harmless` | The room split, or the answer was fond. Nobody is wounded. |
| `win` | She read the room better than anybody. What she says about that. |

Things to write, all spoken:

- the named queen answering back — "I'm SORRY?", "say it to my face then",
  or the one that lands hardest, taking it and agreeing
- a queen defending her vote out loud while the board is still up
- somebody who voted for her pretending she did not
- the room going up before anybody says anything articulate

`brutal` is where a friendship gets a dent in it. `harmless` should be warm —
the room laughing *with* her, and her enjoying it.

---

## Guess Who — `cast: 'guess'`

The mirror of the vote. Something belongs to one of them and the room works
out whose, so there **is** a right answer and the tally can be a room agreeing
on the wrong one. The reveal is the moment.

`{a}` is **the queen it belonged to**.

| tier | what it is |
|---|---|
| `announce` | The host puts it up and asks whose it is. Her line. |
| `nobody` | Not one of them knew. Her line about that. |
| `some` | Some of them knew her. What she says, and what the ones who guessed say. |
| `win` | She knew the room best. What she says about that. |

`nobody` is the one with the feeling in it. She has been living with these
people for weeks and not one of them knew this about her — that is a real
thing to say out loud, and it should be allowed to sting rather than being
played for a laugh every time. Some queens would cover it with a joke; write
both.

`some` is the opposite: the ones who guessed right get to say *why*, and
"because I pay attention to you" is a better line than any punchline.

The scene data carries `intimate` when the item is one you only know if you
know her well. A round flagged intimate raises the stakes of `nobody`
considerably.

---

## House rules

- Never write a name into a pool — `{a}` only here.
- No line under 80 characters.
- The prose renders what already happened. It never decides a result and never
  knows something the queen does not.
- Four lines that say four different things beat six that rephrase one.
- `MINI_VARIANTS` in `js/dr/data/mini-voices.js` says how many each tier wants.
