# Prompt — fill the five empty prose tiers

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
