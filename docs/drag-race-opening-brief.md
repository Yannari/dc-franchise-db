# Drag Race — the main stage opening. 11 tiers, ~44 lines.

You are filling empty `lines` arrays in **`js/dr/data/stage-beats.js`**. Nothing
else in that file, and no other file. Everything else in it is already written
and must not be touched.

Check your work with:

```
npx vitest run tests/dr-stage-beats.test.js
```

It names every tier still empty and fails with the exact line and exact rule
that broke.

---

## What you are writing

The main stage opening used to be one paragraph doing four jobs at once: the
lights, the panel, the engines and the category. So the panel — four people
with authored tastes whose public disagreement twenty minutes later is the
whole point of the judging engine — arrived on screen as a row of portraits
nobody had said a word to.

It is now three beats, in this order:

| Beat | Fires | Job |
|---|---|---|
| `entrance` | once | the host takes the stage |
| `panel-intro` | **once per judge** | she presents that judge, with a joke at their expense |
| `category-call` | once | the engines line, and what they are walking in |

You are writing 11 tiers across those three.

---

## 1. `entrance/open` — 4+ lines

The host takes the stage and the room becomes the main stage.

**She does NOT introduce the panel here and does NOT name the category.** Both
have their own beat immediately after this one. This is the welcome and nothing
else: the lights, the room, the change in temperature, and the fact that she is
in drag now — which is what makes the main stage the main stage, because in the
werk room that morning she was in a suit.

Placeholders: **none are legal here.** `{c}` and `{j}` are both rejected by the
guard, and `{a}` renders as an empty string.

---

## 2. `panel-intro` — 8 tiers, 4+ lines each

The host presents one judge. Fires once per judge on tonight's panel, in
seating order. `{j}` is that judge's name.

**Write each tier to that specific judge.** This is the entire reason the beat
is tiered by who is sitting there rather than being one pool. One generic "and
joining us tonight…" with a name swapped in is precisely the failure this
replaced. Carson will do the bit back at her; Law will look at her until she
stops. That difference has to be on the page.

Here is the authored panel — this is canon, do not invent traits:

| Tier | Judge | Voice | Soft spot | Pet peeve |
|---|---|---|---|---|
| `michelle` | Michelle Visage | Direct and technical. Hard on construction and a hidden waist, never softens a note to be liked. | a live vocal | a hidden waist |
| `carson` | Carson Kressley | Puns first, fashion second. Delighted by camp, a reveal, and anybody willing to look ridiculous on purpose. | a joke that lands | a look with no idea behind it |
| `ross` | Ross Mathews | Enthusiastic and comedy-minded, cries easily, will forgive a look entirely for a performance that moved him. | a heartfelt moment | dead air in the middle of a bit |
| `law` | Law Roach | Fashion authority, unimpressed by default. A look either is or it is not, and he will not pretend otherwise to be nice. | proportion | a cheap fabric under a good idea |
| `ts` | TS Madison | Loud, loving and unfiltered. Rewards nerve and a body, and reads a coward the second she sees one. | a stunt she did not see coming | no nerve |
| `jamal` | Jamal Sims | A choreographer watching feet and counting. Kind about effort, exact about timing, can tell who learned it this morning. | a clean eight | being off the count |

**Michelle is permanent — she is introduced every single week, and the other
five rotate one at a time.** Her tier is read several times more often than any
other tier in this file. Give it the most variants and the widest spread; six
or eight is not too many.

Two more tiers, both for a guest judge drawn from the franchise's own roster:

- **`guest`** — no credit is known. The line may name `{j}` and **claim nothing
  else about her.** It is the fallback and has to read correctly for a total
  stranger the host is meeting for the first time.
- **`guest-credited`** — `{k}` is a ready-made phrase such as *"the winner of
  the ninth season"* and drops straight into the sentence. **Never invent a
  credit.** `{k}` is the only claim about her past these lines may make.

**Pronouns.** The six permanent and rotating judges are a fixed known cast:
Michelle and TS are she/her, Carson, Ross, Law and Jamal are he/him. A **guest**
is drawn at random from a 194-person roster and could be anyone, so the two
guest tiers must stay pronoun-free — use `{j}` again, or they/them.

Placeholders here: `{j}` in any tier, `{k}` in `guest-credited` only. **`{c}` is
rejected** — the category has not been announced yet and naming it here is a
spoiler. `{a}` renders empty.

---

## 3. `category-call` — 2 tiers, 4+ lines each

The engines line, and the category. **`{c}` is tonight's category and every
single line must contain it** — this beat is the only thing in the whole episode
that tells the viewer what the queens were asked to walk in. The guard checks
every line individually.

The ordinary tier (`call`) is already written. Here are two of its lines, so you
can match the register:

> "Gentlemen!" The host lets the word carry. "Start your engines." She names
> {c} and the room shifts into the register it uses only for the main stage —
> quieter, sharper, the kind of attention that has a judgement in it. "And may
> the best woman win." The runway lights come up. The first queen walks.

> The panel is seated, the guest looks delighted to be there, and the host does
> the thing where she waits a beat too long on purpose. Then: {c}, delivered
> like a dare. The first queen is already at the top of the runway with her
> shoulders back.

You are writing the two variant nights:

- **`sewn`** — a design week or a Ball. She **made** the look, so the category
  is the brief she sewed to and the judgement is on the building, not on what
  she packed. `{c}` is that brief.
- **`ball`** — three categories in one night. The host names all of them and
  lets the room work out how much sewing that was. `{c}` is the primary one.

Placeholders: `{c}`, required. `{j}` and `{k}` are rejected. `{a}` renders empty.

---

## The rules the guard enforces

1. **Four variants minimum per tier**, and they must be different beats, not one
   sentence reworded. The guard compares shared vocabulary across whole lines
   and rejects anything over 60% overlap. A shared catchphrase at the front is
   fine — three winner's lines all open "Condragulations" and that is correct.
2. **Prose, not a caption.** Over 80 characters. In practice these run to a
   short paragraph; look at the `call` examples above for length.
3. **No real people** beyond the six named judges and the host, who are the
   show's own cast. No other celebrities, no real drag queens, no real places.
4. **This show's vocabulary only.** Never `tribe`, `tribal council`, `camper`,
   `immunity`, `voted out`, `idol`, `merge`, `jury`, `juror`, `houseguest`,
   `evicted`, `nominated`, `the block`, `head of household`, `veto`, `traitor`,
   `banished`, `round table`.
5. **Never quote a stat by number.**
6. **Placeholders**, per beat, exactly as listed above. Anything not listed is
   rejected outright, and `{a}` — while it will not fail the guard — renders as
   an empty string in all 11 of these tiers, because none of them is about a
   specific queen.

## Register

Different from the werk room, and the file's own header says why. The werk room
is intimate and funny. **The main stage is performance and verdict**: tighter,
more declarative, everybody aware of the camera. The host is warm and enjoying
herself and is also the person who decides who goes home.

Refer to the host as **the host**, and as **she** — on this stage she is in
drag. Existing prose in this file establishes both.
