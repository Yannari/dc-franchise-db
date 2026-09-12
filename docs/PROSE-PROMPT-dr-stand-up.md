# Prose brief — the Stand-Up Challenge

Two pools ship empty and fall back to neutral generic wording. Nothing is
broken; the screen just reads as "a performance" rather than as a stand-up.
This is what to write to give the night its own voice.

## Why these pools exist at all

The stand-up was pointed at the **roast's** prose. `serves: ['roast',
'stand-up']`, one voice for both, and every line said so. Played episode 13,
five queens, correctly headed *Stand-Up Challenge · five minutes, no net*, then
narrated:

> The room is not helping her. Quin delivers her bits to a panel that is
> smiling politely and **a polite smile during a roast** is the silence
> between laughs that are not coming.

> **A good roast from Gigi Cherie.** The material is prepared, the delivery is
> rehearsed…

> …which is the worst place a queen can be **on roast night**.

And underneath that, the slot picks were the **girl group's**: both challenges
declare `roles: 'slots'`, and the `slots` pick pool is written entirely about a
verse in a group number. So a queen choosing her place on a comedy bill was
told she had taken *"the verse with the most bars"*, *"the position with the
most real estate, the best placement in the number"*, and sent off *"counting
her bars"*. There is no number, no verse and no bars on a stand-up night.

Both are the bug class `CLAUDE.md` opens with: one challenge's vocabulary
printed over another.

## The thing to hold on to

**A roast has a target. A stand-up does not.** That is the whole difference and
every line should come from it.

On a roast the queens go after a guest of honour, the panel, and each other.
The person being roasted is *in the room, listening*. A bad roast joke is
cruel-and-unfunny, which is a specific kind of failure — you can see the target
deciding not to laugh.

On a stand-up there is nobody to aim at. It is five minutes of **her own
material about her own life** — her drag, her family, her body, her year — to
an audience that owes her nothing. The thing being judged is whether she is
funny with no victim to hide behind, and whether she has anything to say. A
queen who is only funny when she is reading somebody dies here.

Mechanically (`js/dr/chal/roast.js`, shared by both):

- **three bits**, scored separately; a bit under 4 is a *dud*
- **a room temperature** that every set before hers has already moved — a
  strong set warms the room for the next queen, a death cools it
- **slot difficulty** by position: first, middle, last

That temperature is the thing worth writing about. It is why the order matters
and it is the one mechanic the prose has never once mentioned.

---

## Pool 1 — performance

`js/dr/data/maxi-performance.js`, `family: 'stand-up'`. Five tiers, **4 lines
each**, ~2–4 sentences. `{a}` is the queen. No other placeholder.

| tier | note (already written) |
|---|---|
| `extraordinary` | Her own life, five minutes, and the room never stops laughing. |
| `strong` | Real jokes about herself, and they land. |
| `competent` | She gets through five minutes and some of it works. |
| `struggling` | The material is thin and there is no target to hide behind. |
| `collapse` | Five minutes is a very long time in silence. |

Things these lines can be about that the roast's cannot:

- **five minutes is long.** A roast set is a couple of minutes and three
  punchlines. Five minutes with nothing to say is an eternity, and the audience
  can feel her checking how much is left.
- **material about herself.** The queens who win this are the ones who tell the
  truth about something — and the ones who die are often the ones who wrote
  jokes instead of writing about anything.
- **the room she inherited.** She walks on after somebody who killed, or after
  somebody who died and left the audience embarrassed.
- **no target.** A queen whose whole act is reading other people has nothing to
  do with her hands here.

Avoid entirely: *roast*, *roasting*, *the target*, *the person she is roasting*,
*verse*, *bars*, *the number*, *eight-count*.

---

## Pool 2 — the pick

`js/dr/data/maxi-voices.js`, `kind('running-order', …)`. Four tiers, **6 lines
each** (`MAXI_VARIANTS` sizing). `{a}` is the queen, `{c}` is the challenge
name, `{d}` is the slot she got.

| tier | note (already written) |
|---|---|
| `got-it` | She got the spot on the bill she wanted, and on a comedy night that is most of the battle. |
| `settled` | Not the slot she wanted. She has to build the set around where she is. |
| `left-over` | She is going on where nobody wanted to go on. |
| `picked-last` | Last to choose, so she is taking whatever the room is by then. |

What a slot actually means here — this is the content:

- **first** is a cold room. Nobody has decided to laugh yet, and the first
  queen has to teach the audience that laughing is allowed. Brutal, and the
  panel knows it is brutal.
- **middle** is the safe, forgettable place. The room is warm and somebody else
  has already done the obvious jokes.
- **last** is a tired room that has heard four queens do a version of the same
  bit about the host. Closing is either a triumph or the worst slot on the bill
  and there is not much between.

A queen who knows comedy fights for a slot. A queen who does not, takes what is
left and finds out why nobody wanted it.

---

## House rules

- Never write a name into a pool — `{a}`, `{b}`, `{c}`, `{d}` only.
- No line under 80 characters (`tests/dr-challenge-beats.test.js` enforces it
  on the beats; keep to it here too).
- The prose renders what already happened. It never decides a result, never
  names a placement, and never knows something the queen does not.
- Four lines that say four different things beat six that rephrase one.
