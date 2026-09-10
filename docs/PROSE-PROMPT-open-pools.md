# Writing prompt — the pools still empty

Hand this whole file to the writing model. It is self-contained: everything
needed to understand the assignment is here, though the repo is needed to make
the edits.

This supersedes `docs/PROSE-PROMPT-rumix-music-video.md`, which is now almost
entirely written. **Everything below was measured, not remembered** — the
codebase reports its own backlog, and this is that report:

```
unwrittenChallengeTiers   4   the-division/paired,
                              paired-off/{dumped-on, looked-after, next-name}
unwrittenCritiqueVoices   4   delivery:blunt/{praise,fault}, delivery:kind/{praise,fault}
unwrittenMaxiEvents       2   handed-the-hardest, paired-them-well
unwrittenMaxiVoices       0   — written
```

The first three lines are §7, all of them the makeover, all of them new. The
`studio-taping`, `pick:group-slots` and rumix pools this file was originally
written for have since been filled and their sections below are kept only
because the house rules and the method still apply.

**10 slots, about 50 lines.** Run the same report when you are done and only
`unwrittenCritiqueVoices` — §6, which is somebody's design decision — should
still print.

---

## 0. THE HOUSE RULES. Read these before writing a word.

Not style preferences — breaking any of them ships a bug that a test will
catch or, worse, that no test will.

- **Fill the `lines` arrays and change nothing else.** Never touch `id`,
  `note`, `family`, `kind` or any other field name.
- **Placeholders are filled at render time. Never type a name into a pool.**
  `{a}` the queen · `{b}` the other queen in a two-queen beat · `{m}` whoever
  is running the room · `{j}` the judge speaking · `{c}` the challenge name ·
  `{d}` the thing she picked · `{o}` her drag style · `{p}` her problem ·
  `{y}` the style a judge leans for or against.
  **Each pool below says which of these it may use. Using one it does not have
  prints the literal `{x}` on screen** — that has already happened once, and
  `tests/dr-placeholders.test.js` now exists because of it.
- **No real people, no real places, no real brands.** This universe has no
  celebrities outside its own reality shows. The judges are the exception:
  RuPaul, Michelle Visage, Carson Kressley, Ross Mathews, Law Roach, TS
  Madison and Jamal Sims are this show's panel and may be named through `{j}`
  or `{m}`.
- **This show's words only.** No *evicted*, *voted out*, *tribe*, *houseguest*,
  *camp*, *mission*, *jury*. **There is no vote in this show at all** — the
  panel ranks and the host decides. A sentence implying otherwise is the bug
  the whole vocabulary guard exists for. ("mission" has already tripped it
  once, in the idiom "a rescue mission".)
- **Never name a stat or a number.** Not "her boldness", not "a seven".
- **Prose, not captions.** Two to four full sentences with a rhythm, written
  like somebody watching. Read the neighbouring entries in each file first.
- **Genuinely different variants** — different content, not the same sentence
  reworded. Most of these fire once per queen per episode, so a repeat is
  visible on the first playthrough.

---

## 1. `studio-taping` — acting and the commercial, on a set

**File:** `js/dr/data/challenge-beats.js`, `id: 'studio-taping'`
**Placeholders:** `{a}`, `{m}`, `{c}` · **4 tiers × 4 lines = 16**

The scripted parody and the thirty-second advert are **taped on a set** with a
director behind a monitor. `{m}` is **Michelle Visage** on both — her authored
voice is *"Direct and technical. Hard on construction and a hidden waist, soft
on a live vocal, and never softens a note to be liked."*

Three things this pool must respect:

1. **It is a TAPING, never a rehearsal.** That word belongs to the room where a
   dance number is taught, and there is a separate pool for it. This is a
   script, a camera, a monitor and somebody behind it.
2. **It is not the music video.** `studio-day` is that pool and it talks about
   the call sheet, the shot list and building the video around her. Borrowing
   those words here is the exact bug this beat was split out to stop.
3. **The commercial is written and directed by the queens themselves** (the
   wiki is explicit). Michelle gives notes on that one rather than calling the
   shots — a line must work for both a parody she is directing and an advert
   she is only watching.

**At least half the lines should carry something she actually says**, with the
real note in it. Compare:

> ✗ The director's note was about scale: play it smaller for the lens.
> ✓ "Smaller," {m} says, without looking up from the monitor. "The lens is
>   eighteen inches from your face and you are playing to a balcony."

| tier | what it is |
|---|---|
| `made-the-scene` | She gave her something better than what was written. |
| `takes-direction` | A note, a take, and on to the next setup. |
| `many-resets` | They go again, and again, and the room feels the afternoon. |
| `argued-with-him` | She was asked for something and said no, in front of the crew. |

`argued-with-him` is a two-hander by definition and should read like an
exchange, not a summary of one. (The tier id says "him" and the person is
Michelle — the id is frozen because the engine writes it; the prose says
"she".)

**Improv and the roast get no card here.** Improv is unscripted and the roast
is written alone and delivered live, so neither has an afternoon anybody could
form a view of. Never write a line that assumes a rehearsal happened.

---

## 2. `the-division` — two tiers that were saying the wrong thing

**File:** `js/dr/data/challenge-beats.js`, `id: 'the-division'`
**Placeholders:** `{a}`, `{c}` · **2 tiers × 4 lines = 8**

`the-division` is the once-a-night line telling the room how it is being split.
It used to infer *captains* from "this challenge groups people", so the acting
challenge and the commercial both opened with **"Two captains. The host names
them and the room splits — the people doing the choosing and the people being
chosen."** Neither has a captain in it and nobody chooses a teammate on either.
These two tiers exist so it can stop lying, and they are empty because silence
was better than the false line.

| tier | what it is |
|---|---|
| `two-casts` | **The acting challenge, one of its two shapes.** The room is cut in half and each half plays the same six-part script — two casts of one scene, judged against each other. Not two teams building different things: the same words, twice, and the comparison is the whole point. |
| `pairs` | **The commercial.** Two by two, and each pair is handed a product with a trap in it. |

Write these as the ROOM hearing the news, in the register of the tiers already
in that beat (`draft`, `captains`, `solo`, `cast` are all written — read them
first). No queen is named: this beat fires once, for everybody.

---

## 3. Four events in the writing room and on set

**File:** `js/dr/data/maxi-events.js` · **4 events × 4 lines = 16**
**Placeholders:** `{a}`, `{b}` — all four are `cast: 'pair'`, so `{b}` is
required and is the other queen.

These fire only when the engine actually made them happen, so each line must
describe that specific thing rather than a mood. They exist because the Rumix
and the music video were split out of the girl group and lost its social layer
in the process — these four are what put it back, and each one moves a real
bond and a real popularity number.

| id | challenge | what happened |
|---|---|---|
| `workshopped` | Rumix | `{a}` sat down and helped `{b}` write her verse. It shows on the tape. |
| `read-her-verse` | Rumix | `{a}` heard `{b}` rehearsing through a wall and told the room it was terrible. **`{b}` still has to go and perform it.** |
| `upstaged-her` | music video | `{a}` stepped into `{b}`'s shot and it worked. `{b}` watched it back on the monitor. |
| `covered-for-her` | music video | `{a}` quietly told `{b}` where the mark was between setups, and saved her a take. |

Two of these are unkind and two are not, and the unkind ones are only ever
fired by a queen the archetype rules allow to scheme — so write them as
somebody doing a thing on purpose, not as an accident.

---

## 4. `pick:group-slots` — the girl group draft

**File:** `js/dr/data/maxi-voices.js`, `kind('group-slots', ...)`
**Placeholders:** `{a}`, `{d}`, `{c}` · **4 tiers, and the floors differ**

This one is **not empty — it has one line per tier and needs six to eight.**
It is the only pool currently failing a test: `tests/dr-mini-lipsync-voices.js`
enforces a higher floor here because the beat fires once per queen, and a
thirteen-queen room exhausts a four-line pool and starts repeating verbatim.

| tier | has | needs | what it is |
|---|---|---|---|
| `got-it` | 1 | **6** | She got the position she wanted, and it is worth wanting. |
| `settled` | 1 | **8** | Not what she came for, but she can build on it. |
| `left-over` | 1 | **6** | What nobody else wanted, and she knows why. |
| `picked-last` | 1 | **6** | Barely a position at all. |

**`{d}` is the slot and every line must reach for it.** It resolves to *Lead*,
*Featured*, *Standard* or *Ensemble* — a position in the number, not a
character — and the prose has to know what each one IS: the lead has the most
verse and the front of the choreography; featured has a strong slot with room
to stand out; standard is a solid verse and a place in the number; ensemble is
backup, fewest bars, most choreography, smallest spotlight. A test fails any
written tier that never uses `{d}`, because eleven cards saying "the pick" and
"it" is what this pool was built to replace.

Keep the one existing line in each tier and write around it.

---

## 5. How to know you are done

```
npx vitest run tests/dr-maxi-prose.test.js tests/dr-challenge-beats.test.js \
  tests/dr-mini-lipsync-voices.test.js tests/dr-brief-voices.test.js \
  tests/dr-placeholders.test.js tests/dr-event-reach.test.js
```

Then re-run the backlog report and expect silence:

```js
// each of these should return []
unwrittenChallengeTiers()   // js/dr/data/challenge-beats.js
unwrittenCritiqueVoices()   // js/dr/data/critique-voices.js
unwrittenMaxiEvents()       // js/dr/data/maxi-events.js
unwrittenMaxiVoices()       // js/dr/data/maxi-voices.js
```

**A green suite does not mean you are done** — an unwritten pool is *reported*,
not failed, everywhere except `pick:group-slots`. Read the counts.

And then the thing that actually matters, which no test does: **play a season
with these challenges pinned and read the output in order, as a viewer.** Every
real prose bug in this project was found that way and not one was found by an
assertion. The specific thing to watch for is a line that would be equally true
of a different challenge. If it would be, it is not written yet.

---

## 6. The fifth pool, which is somebody's design decision

`delivery:blunt/{praise,fault}` and `delivery:kind/{praise,fault}` in
`js/dr/data/critique-voices.js` are also empty — **4 slots, 6 lines each, 24
lines** — and they are listed last because they are the only ones here that
predate this work and may be empty on purpose.

They are a **clause appended to a critique**, not a sentence: look at
`CRITIQUE_BIAS` directly above them, whose lines all begin with an em dash and
continue the sentence before. They fire only when the judge is at one end of
the panel's warmth range, because a note about *how* somebody spoke, attached
to every critique every week, stops being a note.

- **`blunt`** — the hard seat. She does not soften it, does not wrap it in a
  joke, and does not care whether the queen is about to cry. Law and Michelle
  live here. `praise` from her almost never happens and the room knows it.
- **`kind`** — the soft seat. Ross lives here. Careful: kind is not weak — a
  gentle pan from somebody who clearly wanted her to do well lands harder than
  a blunt one.

The clause is about the DELIVERY and never the fault: the reason line before it
has already said what was wrong. Ask before writing these — if they were left
empty deliberately, adding them changes how every critique in the show reads.

---

## 7. The makeover, where nobody picked and nobody was cast

**This is the live one.** The other sections are history; these six pools are
empty right now and a makeover episode is quietly poorer for it.

**What changed, and why these exist.** The makeover used to run a draft:
everybody ranked the partners, the picks were handed out in order. It was wrong
twice over — mechanically, because every queen ranked them off the same number
and so wanted the same man and lost him ("not her first choice" on seven cards
in a row is a queue, not a draft), and about the show, because there is no
scramble for a makeover partner. **The mini winner is handed the whole room and
pairs everybody**, which is a far better mechanic: it gives one queen real power
over everybody's week, and what she does with it is the story. She keeps the
best for herself. She can hand her rival the hardest man in the room, in front
of everybody, smiling.

That created a third state the screen had no words for — *paired by another
queen*, which is neither choosing nor being cast by the host — and until these
pools exist it borrows the music video's call sheet, which is how "the role
exists in the video" came to print over a challenge about a wig.

### 7a. `the-division/paired` — `js/dr/data/challenge-beats.js`

**1 slot, 4 lines.** Fires ONCE, before anybody is paired. Placeholders: **none
at all** — this beat is `scope: 'once'` and has no queen attached. Writing `{a}`
here prints the literal `{a}` on screen; that exact bug has already shipped once
on this beat family.

Read the `draft` and `captains` tiers directly above it in the file — same job,
same register. The content: the host says who won the mini and that she is
pairing the room. Then the room does the arithmetic. Everybody is now waiting to
find out what one person thinks of them, out loud, and there is nothing they can
do about it. This is not a draft — nobody is counting slots, and nobody gets a
turn.

### 7b. `paired-off` — `js/dr/data/challenge-beats.js`

**3 slots, 4 lines each.** Fires once **per queen**, after the division, as she
finds out who she is working with. Placeholders: **`{a}`** the queen being
paired, **`{b}`** the queen doing the pairing. Nothing else.

The tiers are what was *meant* by it. The engine already decided which one —
never write a line that argues with its tier.

- **`dumped-on`** — `{b}` gave `{a}` the hardest partner in the room and the
  room understood it immediately. One a night, so it should read as an event.
  `{a}`'s reaction is the interesting half: this is a challenge she now has to
  win from behind, and saying so out loud makes her sound like she is making
  excuses before she starts.
- **`looked-after`** — `{b}` deliberately gave `{a}` somebody she can work with.
  Careful: this is generosity, not a gift-wrapped win. The partner still has to
  be turned into a queen and the room noticing the kindness has its own cost —
  a visible alliance on a night the panel is watching everybody.
- **`next-name`** — no message in it. `{a}` was simply next. Most of the room is
  this tier, so these four lines carry the volume and must not be
  interchangeable. Write the *specific* small thing: sizing him up, the first
  handshake, the exact moment she realises what she has been given.

### 7c. `handed-the-hardest` and `paired-them-well` — `js/dr/data/maxi-events.js`

**2 slots, 4 lines each.** These are the werk room *events* behind the two
pointed tiers, and they are a different camera: 7b is `{a}` finding out, this is
the room watching `{b}` do it. Placeholders: **`{a}` is the queen doing the
pairing, `{b}` the one receiving it** — the opposite way round from 7b, so check
yourself twice.

Both already carry consequences in the engine (bond and popularity move on
`{a}`), so the prose must earn them: `handed-the-hardest` costs `{a}` standing
because the room saw it and did not like it, and `paired-them-well` buys her
some. Write what makes that true — the pause before the name, who looks at whom,
what is said in the smallest possible voice afterwards. Do not have `{b}`
retaliate: the engine has not decided that.
