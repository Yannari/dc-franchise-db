# Drag Race — the premiere arrivals, writing brief

**For the prose session.** Three pools in `js/dr/data/entrances.js` are
exported, shaped, and deliberately **empty**. The engine and the screen are
already built against them: an empty pool means the beat does not happen yet,
so nothing renders a blank card, and the day a pool is filled the beat starts
appearing without a line of code being touched.

Two pools are already written and are the tone reference:
`ENTRANCE_LINES` (180 lines) and `ENTRANCE_REACTIONS` (32).

---

## The scene

The premiere's biggest sequence. Each queen comes through the door in order:

| beat | pool | status |
|---|---|---|
| `arrival:walk` | `ENTRANCE_LINES` — her line | **written** |
| `arrival:room` | `ENTRANCE_REACTIONS` — the room answers | **written** |
| `arrival:intro` | `ARRIVAL_INTROS` — who she is | **write this** |
| `arrival:backstory` | `ARRIVAL_BACKSTORY` — what is not on the CV | **write this** |
| `arrival:impression` | `ARRIVAL_IMPRESSIONS` — shady or nice | **write this** |
| `arrival:host` | `ARRIVAL_HOST` — RuPaul arrives, last | **write this** |

## The one rule that is not negotiable

**A queen can only be seen, answered or reacted to by queens who are already
in the room.** Queen four cannot get a look from queen nine. The engine
enforces it — `{b}` is drawn only from the queens already through the door,
and for the first queen, lines containing `{b}` are filtered out entirely
rather than substituted. So:

- **Write some lines in every pool with no `{b}` at all.** The first queen
  through the door has nobody, and a pool where every line names somebody
  leaves her with nothing to say.
- Never write "everybody", "the whole cast", "all twelve" — the room is
  still filling. "The three of them" is safe; "the room" is safe.

## Placeholders

| | |
|---|---|
| `{a}` | the arriving queen |
| `{b}` | a queen **already** in the room — never guaranteed to exist |
| `{city}` | her `hometown`, as authored in the Casting Studio |
| `{job}` | her `occupation`, as authored in the Casting Studio |
| `{years}` | how long she has been doing drag, a numeral |
| `{style}` | her drag style in words — "a pageant queen", "an art queen" |

## What to write

### `ARRIVAL_INTROS` — keyed by attitude: `big`, `dry`, `warm`
**8 per bucket, 24 total.** She tells the room who she is: name, city, what
she does, how long she has been doing drag. The attitude is the same one that
picked her entrance line, so the queen who arrived dry introduces herself dry.
Use `{city}`, `{job}` and `{years}` — a line that uses none of them is a line
that could belong to anybody.

**These are authored fields, not invented ones.** `hometown` and `occupation`
are boxes in the Casting Studio and 43 of the roster already have them filled.
A queen whose record has no hometown will simply never be handed a line that
asks for one — so **write several intros per bucket that use only `{years}`**,
or the queens without a profile get no introduction at all.

And note `ARRIVAL_BACKSTORY` is the FALLBACK: a player with an authored
`backstory` paragraph uses her own, because it is about her. The pool covers
the roster nobody has written up yet.

> *"I'm from {city}, I've been doing this {years} years, and I still have a
> day job I'm not going to tell you about."*

### `ARRIVAL_BACKSTORY` — keyed by drag style, all ten
**6 per style, 60 total.** The thing that is not on the CV. What a pageant
queen volunteers about herself and what an art queen volunteers are different
confessions — that is why this pool is keyed by style and the intro is not.

Keep it to one beat. Not a life story: the moment she decides to tell these
strangers something true. It can be funny. It should not be sad on purpose.

### `ARRIVAL_IMPRESSIONS` — keyed `nice` / `shady`
**10 per bucket, 20 total.** The premiere is where the season's relationships
are actually made, and this is the beat that makes them: somebody already in
the room watches her walk in and decides something.

**`{b}` is the one deciding and `{a}` is the new arrival** — the reverse of
every other pool here. Both names always exist in this pool, so `{b}` is safe
to use in every line.

The bond is already moving whether or not this pool has a sentence for it, so
these are the WORDS for a thing that has happened, not the cause of it. Shady
should be shady the way this show is shady: a look, an aside to somebody else,
a compliment with a shape to it. Not villainy.

### `ARRIVAL_HOST` — keyed by the room's mood: `loud`, `nervous`, `ready`
**5 per bucket, 15 total.** RuPaul comes through the door once the room is
full. `{a}` is RuPaul, `{b}` is the first queen who arrived. This is the beat
that turns a row of introductions into the start of a season, so it wants the
show's actual cadence — the greeting, the look at the room, and the line that
starts the competition.

## House rules

- **British-ish spelling, no em-dash spam, no emoji.**
- Prose only. No markup, no HTML, no stage directions in brackets.
- Every line is a complete thought that reads on its own — these are drawn
  independently and never in a fixed order.
- **Variety is the whole job.** Two queens getting the same line in one
  premiere is the single most visible failure this screen has. The engine
  draws without replacement while a pool lasts, so the pool size IS the
  ceiling: 8 per attitude covers a 13-queen cast, 6 per style covers the
  usual two-or-three queens sharing one.
- Match the register of `ENTRANCE_LINES`: specific, dry, spoken aloud. Not
  narrated, not wistful, no "little did she know".

## Where it goes

Straight into the three exported constants in `js/dr/data/entrances.js`.
Nothing else needs changing. `tests/dr-vp-werk.test.js` and
`tests/dr-arrivals.test.js` will start exercising the new beats on their own.
