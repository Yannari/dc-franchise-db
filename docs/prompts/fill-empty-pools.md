# Prompt — fill the empty prose tiers

Paste everything below the line into the writing model.

---

You are writing prose for a Drag Race season simulator. Your only job is to
fill in empty `lines: []` arrays. Do not change engine code, do not run tests,
do not create files.

**Working directory:** `C:\Users\yanna\OneDrive\Documents\GitHub\worktree-drag-race`

## Read first, for voice

- `js/dr/data/stage-beats.js` — read `result-win` and `result-bottom`. Those
  two are already written and are the exact register you are matching.
- `js/dr/data/crowning-beats.js` — the most recent pool, written to the same
  brief you are getting now.
- `js/dr/data/finale-beats.js` — the finale's own voice.

Every beat below carries a `note` and most carry a `writerNote` in the file
itself. **Those are your brief — read them before writing.**

## What to fill

### 1. `js/dr/data/stage-beats.js` — three calls that have never had words

The panel places every queen in one of six outcomes and only three of them
were ever written. On a thirteen-queen call, nine rows drew a portrait, a
rank arrow, a rubber stamp and said nothing.

| beat | tier | what it is |
|---|---|---|
| `result-high` | `high` | Top of the week and not the winner of it. |
| `result-low` | `low` | Safe, but the panel had a note — a warning with nothing attached to it. |
| `result-btm` | `btm` | Named in the bottom, made to stand there, then saved **before** the song. She does not lip sync and never gets to prove anything. |

**Six variants each. `{a}` is the queen.** These must not be one sentence with
the adjective swapped — they are three different experiences. `result-btm` is
the cruellest of the three and the one most worth writing well.

The host speaks these. His register here is warm, direct, unhurried.

### 2. `js/dr/data/finale-beats.js` — the finale's opening

The finale's first screen rendered a row of portraits under a line naming the
format, and nothing else. No narration at all.

| beat | tiers | what it is |
|---|---|---|
| `finale-open` | `bracket`, `showcase`, `duel` | The night opens. Three genuinely different nights: a lip sync bracket; they perform solo and the host cuts the field; or two queens and one song. No `{a}` — this beat is the night. |
| `finale-open-queen` | `open` | One finalist on the last day. `{a}` is the queen. |

**Six variants per tier.** For `finale-open-queen`: she has already survived
the competition and the only thing left is to be better than the people she
survived it with. Not all nerves — one of these should be a queen who is
genuinely enjoying it.

### 3. `js/dr/data/finale-beats.js` — the cast coming back

The entire eliminated cast returning was one paragraph.

| beat | tiers | what it is |
|---|---|---|
| `finale-return-queen` | `early`, `mid`, `late` | One returning queen. `{a}` is her, `{b}` is a finalist she reaches first. |

**Eight variants per tier**, and they must differ by *when she went home* —
that is the whole texture. The early boot nobody has seen since the premiere
arrives differently from the queen who left last week and has not slept.

### 4. `js/dr/data/stage-beats.js` — her last words, in her own voice

The lip sync screen now ends on a card that is just her: her portrait, her
name, and one thing she says. The light goes out on that portrait a beat
after you read it, so this line is the last thing on the screen and the last
thing anybody hears from her.

| beat | tiers | what it is |
|---|---|---|
| `sashay-words` | `predator`, `sunshine`, `firecracker`, `professional`, `scrapper` | Her own parting words, first person, in quotation marks. `{a}` is her. |

**Six variants per tier. Keep them SHORT — two or three sentences.** This is
a parting shot, not the goodbye speech; she gets a real speech on the very
next screen (`farewell`), and the two must not read the same. `farewell` is
the narrator describing her goodbye in the werk room afterwards. This is her,
out loud, on the stage, in the second after the host says her name.

**The shape is gratitude then the one-liner.** "Thank you for the
opportunity" is what every queen says and it should stay recognisable — what
makes the line hers is whatever she puts after it.

The five tiers are the **swagger groups** from `js/dr/data/runway-voices.js`,
the same five attitudes that have been narrating her runway walks all season,
so read `swaggerLinesFor` for the voice before writing:

- `predator` — leaves a threat behind, beautifully wrapped
- `sunshine` — means every word of it, no edge at all
- `firecracker` — loud, funny, refusing to be sad on camera
- `professional` — treats it as a result, takes it like one, shakes hands
- `scrapper` — points out she was never supposed to get this far

### 5. `js/dr/data/stage-beats.js` — the night the panel says nothing

On a Rate-a-Queen week the judges do not critique. That is the twist rather
than a side effect of it: the panel has handed the call to the room, so there
is nothing for four judges to say between the runway and the results. The
queens are still standing on that stage waiting to be told something, and what
they are told is that nobody is going to tell them anything.

| beat | tiers | what it is |
|---|---|---|
| `rate-announce` | `announce` | The host says the panel is sitting this one out. **No `{a}`** — it is said to everybody. |
| `call-stakes` | `life`, `win`, `legacy` | After the top and bottom are called: what the song is actually FOR. `{a}` and `{b}` are the two who will sing it. |

**Six variants per tier.**

`rate-announce`: he is enjoying this and should not hide it. The sentence
underneath is "I am taking my own power away and handing it to the people you
have been living with", and every queen does that arithmetic in real time. Say
what they have to do — rank each other, top to bottom — and what it decides:
the top of the week and the bottom of it. **Do not say who wins or who lip
syncs**; that is the call and it has not happened yet.

`call-stakes` is one or two sentences, said last, after the names. Two queens
about to lip sync is the same picture whether they are fighting to survive or
fighting to win, and the call never said which — that is the whole job.
`life` is the ordinary night, the bottom two for their lives. `win` is the top
two and nobody is going home. `legacy` is the top two, and the winner decides
who does.

### 6. `js/dr/data/split-beats.js` — the two halves meet

A split premiere runs the cast in two halves over two episodes and nobody goes
home. Then the room DOUBLES: everybody walks into a werk room with twice as
many people in it, and half of them are strangers who have already been on
television. That moment did not exist — the engine restored the full cast with
one line of state and said nothing about it — so the most distinctive thing a
split premiere does was the one thing it never showed.

| beat | tiers | what it is |
|---|---|---|
| `rejoin-open` | `open` | The door opens and the room is twice the size. **No `{a}`** — naming one queen makes it her scene instead of the room's. |
| `rejoin-read` | `threat`, `warm`, `unimpressed` | `{a}` sizing up `{b}`, who was in the OTHER half. They have never shared a room and `{a}` has already watched her compete. |
| `rejoin-winners` | `winners` | The two queens who each won their own half, meeting. `{a}` won the first night, `{b}` the second. |

**Six variants per tier.** The specific strangeness to write is that she has an
opinion about somebody she has never met, formed entirely from watching her
work — and the meeting either confirms it or does not. For `rejoin-winners`:
each of them has been the best queen in the room for a week and exactly one of
them is about to stop being that. Neither says so.

`rejoin-read` carries a bond consequence that only fires if the line exists, so
an unwritten tier costs nothing and a written one changes the season.

### 6. `js/dr/data/returnee-beats.js` — the Returning Queen twist

A queen the show already sent home walks back into the werk room and back
into the competition. The engine, the twist card, the timeline dropdown and
the screen are all built; only the prose is empty.

| beat | tiers | what it is |
|---|---|---|
| `return-door` | `door` | Something is happening that is not on the schedule. **Do not name her** — naming her here throws away the only surprise the twist has. |
| `return-walk` | `early`, `mid`, `late` | She walks in. Tiered by how she went out, because that is what she is walking back in against. |
| `return-room` | `room` | The room reacting. `{a}` is her, `{b}` is the queen who reaches her first. |
| `return-rule` | `rule` | The host says what is now true: back in, record intact, starting tonight. |

**Six variants per tier.** Read the `writerNote` on each beat in the file —
especially `return-room`, which is the beat the whole twist turns on and the
one a lazy version gets wrong by making the room simply happy. It is good news
for her friends and bad news for everybody's odds, and most of them feel both
and can only show one. And it is bad news in a specific way: every queen still
standing survived a night this one did not, and the show has just decided that
did not count.

## Rules — enforced by tests, the build fails on any of them

- **Placeholders are `{a}` and `{b}` only.** Never a real name, never an
  invented queen name. Use `{b}` only where the beat's `note` defines it.
- **Prose, not captions.** Several full sentences. Close third person,
  specific, unsentimental — earn the emotion by describing behaviour rather
  than naming feelings.
- **Never state a cast size or a count of queens.** No "the other three", no
  "eight queens", no "there are two of us left". The cast is configurable.
  `tests/dr-prose-counts.test.js` fails the build on this.
- **Never say "the house"**, even meaning the auditorium. It is correct
  English and it is Big Brother's central noun, so a Drag Race transcript
  carrying it reads as the wrong show. Say the seats, the front rows, the
  audience, out front. The last pool used it five times and the vocabulary
  guard caught every one.
- **This show's vocabulary only.** Queens, the werk room, the main stage, the
  panel, sashay, lip sync, maxi and mini challenge. Never a houseguest, a
  camper, a tribe, a jury, an eviction or a vote — **there is no vote in this
  show.** The panel ranks and the host decides.
- **No backticks anywhere in these files.** This repo has been broken three
  times by one inside a template literal.
- Change nothing but the contents of `lines: []`. Not an id, not a tier id,
  not a note, not the order. Every id is named by engine code; a renamed one
  silently stops being drawn.

## When you are done

Report the per-tier variant counts and anything you could not fill. An
unwritten tier emits no scene rather than an empty card, so partial work is
safe to leave.
