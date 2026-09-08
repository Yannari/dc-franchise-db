# Drag Race — the drag family events (36 lines)

These nine events are the **only unwritten pools left** in the werk room and
Untucked. Everything else fires: 17 friend-gated events and 25 enemy-gated ones
are written and firing today. The family engine is finished — houses, kinship,
the tree, the pre-alliance warmth — and each of these emits **nothing** until it
has lines, because an unwritten tier is skipped rather than drawn blank.

**4 lines per event, 9 events, 36 lines.**

---

## What a drag family is here

Two queens arrive already related. Only **mother**, **daughter** and **sister**
are ever written down by an author; aunts, cousins, grandmothers and great-aunts
are computed from those, so a line may be about any of them.

Two facts change the writing and are worth holding on to:

- **A line is obvious. A house is not.** Two queens with the same surname get
  asked about it at the door, in front of everybody. Two queens who came up in
  the same bar look like two queens who happen to do the same kind of drag, and
  the room only ever learns it because one of them decides to say so.
- **A family is a pre-alliance, not protection.** It is warmth, a head start and
  somebody in your corner. The panel has never heard of it.

## House style

Match the existing werk/Untucked pools exactly — read `js/dr/data/werk-events.js`
before writing. Present tense, third person, camera-in-the-room. Dialogue in
double quotes inside the line. No stage directions, no headings, no names: use
the placeholders, which are substituted at runtime.

- `{a}` — the queen the event is *about*
- `{b}` — the other one
- `{c}`, `{d}` — bystanders (group events only)

Never write a queen's real name, a season number, or the word "drag family" as a
label. **Never state the exact kinship term in the line** unless it is `mother`
or `daughter` — the engine computes "her aunt" and "her great-aunt" and the same
line is reused across all of them.

The four lines for one event must be **four different scenes**, not four
rewordings: different rooms, different people talking first, different endings.
Two of the four should carry dialogue; one should carry none.

---

## WERK ROOM — `js/dr/data/werk-events.js`

### 1. `same-name-question` — pair, werk room, first episode only
**Fires when:** they share a surname, so the room can see it, on day one.
**Effects:** bond +1, both gain popularity.

Somebody has noticed `{a}` and `{b}` have the same name and asks the room the
obvious question. Both of them have been waiting for it since the door opened,
and one of them is enjoying it more than the other. This is a small public event
in the life of the season — write the room hearing it, not just the two of them.

### 2. `the-house-confession` — pair, prep, from episode 2
**Fires when:** they are family and *nothing gives it away*.
**Effects:** bond +1.5, `{a}` gains popularity.

Nobody could have guessed. They came up in the same bar and read as two queens
who happen to do the same kind of drag. One of them says it out loud, and saying
it is a **decision**: it makes them a bloc in everybody's head from that moment.
Write the beat before she says it.

### 3. `mother-teaching` — pair, prep
**Fires when:** `{a}` is `{b}`'s drag mother.
**Effects:** bond +1.5, both gain popularity.

`{a}` does what a drag mother does: takes the thing out of `{b}`'s hands and
shows her, without being asked and without softening it. Nobody else in this
room could say it to `{b}` that way and both of them know it. Warm, but not
gentle — the note lands harder from her than it would from anyone.

### 4. `out-of-her-shadow` — pair, werk room, from episode 2
**Fires when:** `{b}` is `{a}`'s drag mother.
**Effects:** bond **−2**, `{a}` gains popularity.

`{a}` is tired of being introduced as somebody's daughter. She did not come here
to be anybody's anything. **She is right**, and the writing has to let her be
right — this is the first real crack in a house and not a tantrum.

### 5. `the-room-notices-the-bloc` — **group**, elimination day, from episode 2
**Fires when:** two of them are family and at least one other queen is there.
**Effects:** bond −1, both of the family lose popularity.

`{c}` has worked out that `{a}` and `{b}` will never be a problem for each
other, which makes them a bloc whether they meant to be one or not. **Nobody
accuses anybody.** Everybody adjusts. Write the adjustment.

---

## UNTUCKED — `js/dr/data/untucked-events.js`

The werk room is where a family is a head start. Untucked is where the bill
arrives.

### 6. `both-of-us-down-here` — pair, arrival
**Fires when:** they are family and **both are in the bottom**.
**Effects:** bond +1, both gain a lot of popularity.

The worst night either of them will have. One of them is about to send the other
home. Neither can say the useful thing, because the useful thing is "I hope it
is you". Write around the sentence neither will say.

### 7. `she-defends-her-family` — **group**, middle
**Fires when:** two of them are family, with others in the room.
**Effects:** bond −1.5 (with `{c}`), `{a}` gains popularity.

`{c}` says something about `{b}`, and `{a}` does not let it go. The room finds
out what that bond is worth when it is tested in public rather than at a sewing
machine. Give `{c}` a real point — this is better if she is not wrong.

### 8. `you-are-not-my-mother-here` — pair, middle
**Fires when:** `{b}` is `{a}`'s drag mother and `{a}` is in the bottom.
**Effects:** bond **−2**, `{a}` gains popularity.

`{b}` gives `{a}` a note the way she has given it for years, and `{a}` finally
says the thing she has been holding since day one: this is not the bar, and
`{b}` is not her mother in this room. It should hurt both of them.

### 9. `proud-of-you-anyway` — pair, late
**Fires when:** they are family and one of them is about to lip sync for her life.
**Effects:** bond +2, `{a}` gains popularity.

The thing families say before somebody goes out to fight for her life. Not
strategy, not for the camera, and the last private thing either of them gets.
Keep it short and let it be plain — this is the one that should not be clever.

---

## Delivering it

Fill the `lines: []` array on each event, in place, in the two files named
above. Four strings each, single-quoted or double-quoted to match the
surrounding pool, escaping whatever the quote style needs.

`tests/dr-prose-counts.test.js` counts them and `tests/dr-event-reach.test.js`
proves each one can actually fire.
