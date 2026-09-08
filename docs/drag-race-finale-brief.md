# Writing brief — the Drag Race finale

**For a dedicated writing session.** The engine, the eight screens and the
transcript are built and verified; the prose in `js/dr/data/finale-beats.js` is
a working first pass written to get the plumbing right, and it is meant to be
replaced. Nothing about the structure needs to change to swap the lines out —
each pool is a plain array of strings and the file is the only thing to edit.

## What already works (do not change)

- `js/dr/finale.js` picks a line per beat and fills `{a}` with a queen's name.
- `js/dr/season.js` decides everything factual: who is cut, who lip syncs, who
  is crowned. **The prose never decides anything.** A line must never state a
  result the engine did not produce.
- Any pool can grow or shrink freely. More variants is strictly better.

## The night, in order

Each entry is one `id` in `FINALE_BEATS`. `scope` says how often it fires.

| id | scope | what it is |
|---|---|---|
| `finale-return` | once | Every queen sent home this season walks back in. |
| `finale-eleganza` | once | Host opens the night, names the category: **Grande Finale Eleganza**. |
| `finale-walk` | per finalist | One finalist on the finale runway. |
| `finale-interview` | per finalist | One-on-one with the host: *why should it be you?* |
| `finale-showcase-open` | once | The final maxi: individual show-stopping **original numbers**. |
| `finale-showcase` | per finalist | Her solo number. Three tiers: `killed` / `strong` / `shaky`. |
| `finale-cut` | once | The field becomes two. **Only on `perform-then-lipsync`.** |
| `finale-cut-reaction` | per cut queen | A finalist who stops one name short. |
| `finale-crown-lipsync` | once | "Two queens stand before me." Lip sync **for the crown**. |
| `finale-congeniality` | once | Miss Congeniality. `{a}` is the winner. |
| `finale-runnerup` | once | The runner-up is named. `{a}` is the runner-up. |
| `finale-crowning` | once | The crowning itself. `{a}` is the winner. |
| `finale-speech` | once | What the winner says with the crown on. |
| `finale-prance` | once | The last line of the season. |

## Rules the lines have to keep

1. **`{a}` is a queen's name.** It is substituted at render time. Never write a
   real name into a pool.
2. **There is no vote.** No ballot, no jury, no campaigning, no numbers. The
   panel ranks and the host decides. A line implying otherwise is a bug.
3. **Never name a placement the engine did not assign.** A `finale-walk` line
   cannot hint she wins; the same pool is used for the queen who comes fourth.
4. **The showcase tiers are outcomes, not opinions.** A `shaky` line has to
   read as a number that did not land — the engine has already decided it did
   not, and the screen prints the score beside it.
5. **The host's own words are quoted, not paraphrased.** These are the ones
   that must appear verbatim somewhere in their pool:
   - "Two queens stand before me."
   - "Con-drag-ulations" / "America's Next Drag Superstar"
   - "Now let the music play" · "Prance, my queens"
   - "If you can't love yourself, how in the hell are you gonna love somebody
     else?"
   - Elsewhere in the season: "Shantay, you stay" · "Sashay away" · "I'm sorry
     my dear, but you are getting the porkchop" (first elimination only).
6. **No real geography, no real celebrities** beyond the host and the regular
   panel. The simulator is its own universe.
7. **"Camp" means a style, never a place.**

## Tone

Funny and sincere in the same breath, and it has to be both. The reads are fast
and cruel and land between people who like each other. Underneath it these are
performers who gave something up to be here, and the finale is the one night
the show stops undercutting that. Comedy with no cost is not this show;
sincerity with no jokes in it is not either.

The finale runs **once per season**, so repetition pressure is far lower than
the werk room's — 6–10 variants per beat is plenty, and depth beats volume
here. The interviews and the winner's speech carry the most weight: they are
the only places a queen speaks at length about why any of this mattered.

## How to check the work

```
node -e "…"  # or simply:
npx vitest run tests/dr-vp-summary.test.js
```

Then read a real finale transcript rather than trusting the tests — that is how
every defect in this build was actually found:

```
node tools/dr-print-aftermath.mjs 4 12
```
