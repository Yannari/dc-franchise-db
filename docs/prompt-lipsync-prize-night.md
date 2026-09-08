# Prompt — the prize-night lip sync pools

You are writing prose for a Drag Race simulator. Fill six empty tier pools in
`js/dr/data/stage-beats.js`. The schema, the engine wiring and the guards are
already written and committed — **do not change any code, only fill the empty
`[]` line arrays.**

## The night you are writing

Most weeks, the bottom two lip sync **for their lives**: one is saved
("shantay, you stay"), one goes home ("sashay away"). Those pools exist and
are full. You are writing the two nights that are **not** that:

- **`win`** — a for-the-win night. The **top two** queens of the week sing.
  Nobody is in the bottom, nobody can be eliminated, and the winner of the
  song wins the week.
- **`legacy`** — the top two sing, nobody is in danger, and the **winner of
  the song chooses which queen in the bottom goes home.**

Right now both nights fall through to the elimination pools, so the host says
"the half where somebody stays and the half where somebody goes" over a night
nobody could lose, and **the queen who won the song is never named on her own
screen.** That is what you are fixing.

## THE ONE RULE THAT MATTERS

Nobody is saved on these nights, so **the survival vocabulary is not
available.** A guard rejects any line in these pools containing:

    shantay · sashay · you stay · are safe · you're safe · is safe ·
    save yourself · for your life · elimination · going home · goes home · go home

The runner-up especially is **not** told she is safe, not saved, not staying —
she was never at risk. She is a queen who came **second in a fight for a
prize.** Write her that way.

(The one exception: `lipsync-legacy-choice`, where a queen genuinely IS sent
home — see its note below. Even there, prefer "she names her", "she is out",
"her season ends" over the banned phrasings.)

## Format

Each pool is a JS array of double-quoted strings inside
`tier('<id>', '<note>', [ ... ])`. Escape inner double quotes as `\"`.
Placeholders are substituted at render time:

| token | is |
|---|---|
| `{a}` | first named queen (see each beat) |
| `{b}` | second named queen — **only** in `lipsync-legacy-choice` |
| `{s}` | the song title |

**Never write a real name into a pool.** A beat whose `{a}` is listed as
"none" gets no name at all — write it so it reads correctly with nobody named.

## What to write

| beat / tier | lines | `{a}` is | who is speaking |
|---|---|---|---|
| `lipsync-intro` / `win` | 10 | none | host, before the song |
| `lipsync-intro` / `legacy` | 10 | none | host, before the song |
| `lipsync-win-name` / `win` | 10 | the winner | host |
| `lipsync-win-name` / `legacy` | 10 | the winner | host |
| `lipsync-win-reaction` / `predator` | 6 | the winner | **the queen herself** |
| `lipsync-win-reaction` / `sunshine` | 6 | the winner | the queen herself |
| `lipsync-win-reaction` / `firecracker` | 6 | the winner | the queen herself |
| `lipsync-win-reaction` / `professional` | 6 | the winner | the queen herself |
| `lipsync-win-reaction` / `scrapper` | 6 | the winner | the queen herself |
| `lipsync-win-runnerup` / `win` | 8 | the runner-up | host |
| `lipsync-win-runnerup` / `legacy` | 8 | the runner-up | host |
| `lipsync-legacy-choice` / `choice` | 8 | winner (`{b}` = the queen she sends home) | host + winner |
| `lipsync-call` / `for-the-win` | 4 | none | narrator, fallback |
| `lipsync-call` / `legacy` | 4 | none | narrator, fallback |

### Beat notes

- **`lipsync-intro`** — the speech before the music. The `life` pool (already
  written, read it) promises an elimination; yours must promise a prize
  instead. Name the song with `{s}`. No queen is named here.
- **`lipsync-win-name`** — the counterpart of "shantay, you stay". She says
  the winner's name out loud. `win`: the song won her the week —
  "condragulations" is the show's word and is allowed. `legacy`: the song won
  her the **power to eliminate**, which is a heavier thing to hand somebody.
  Vary what surrounds the announcement and what `{a}` does when she hears it.
- **`lipsync-win-reaction`** — **the card the whole change exists for.** An
  elimination ends with a portrait of the queen and one sentence in her own
  first-person voice; a win had no such card, which is why the night read
  flat. This is it. Write first person, in quotes, plus a short line of what
  she does. Tier by how she carries herself:
  - `predator` (villain / mastermind / schemer) — she expected this and says so
  - `sunshine` (hero / loyal-soldier / social-butterfly / showmancer) — delighted, hides none of it
  - `firecracker` (hothead / chaos-agent / wildcard) — the adrenaline has nowhere to go
  - `professional` (challenge-beast / perceptive-player) — takes it like a craftsman, not a fan
  - `scrapper` (underdog / goat / floater) — she has not had much, and she knows what this is
- **`lipsync-win-runnerup`** — she lost the song. She is not in danger and
  never was. `win`: she came second for the week. `legacy`: she came second
  for the power, and **somebody else now holds it and is about to use it** —
  which is its own sting.
- **`lipsync-legacy-choice`** — the moment nothing has ever narrated. `{a}`
  holds the power and spends it on `{b}`. Both names appear in the same
  sentence. Give the room a reaction.
- **`lipsync-call`** — a plain fallback paragraph used only if the named
  beats above are unavailable. **No names**, so describe the verdict without
  claiming to say it.

## Quality bar (all enforced by `tests/dr-stage-beats.test.js`)

- **Over 80 characters** per line. Prose, not a caption — the existing pools
  run two to four sentences and yours should match.
- **No two lines in a tier may share most of their vocabulary.** A guard
  compares whole lines and rejects the same beat reworded. Vary the *shape*,
  not just the adjectives: some lines lead with the host, some with the
  queen's body, some with the room.
- **Speak this show only.** No `evicted`, `nominated`, `on the block`,
  `houseguest`, `tribal council`, `banished`, `Round Table`, `merge`, `jury`.
- **Present tense, third person** for narration; first person inside quotes.
- Match the register of the pools already in the file — read `lipsync-shantay`
  and `sashay-words` first. They are the tonal target: unsentimental, specific
  about bodies and faces, no exclamation marks, no summarising the season.

## Check your work

```
npx vitest run tests/dr-stage-beats.test.js --reporter=verbose
```

It prints what is still unwritten and fails on any rule above. All 14 tiers
listed as "still to write" should be gone when you are done.
