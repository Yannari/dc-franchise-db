# TD: let the game's own story air — 2026-10-14

The user, reading played seasons: "we definitely don't have enough events, it becomes rather boring, there's barely
any strategy... they talk like two or three times and it's over... where's the story, the drama, the comedy, the
romance, the strategy, the plan... the suspense, the shock at tribal... this is so repetitive and boring."

## What the matrix said

The engine made about 21 storyline moments a camp-day (friendship 4.7, rivalry 3.4, alliance 2.9, the bottom 2.7,
schemes 1.6, idols 0.9, romance 0.7). About 1 in 5 aired. The director's main loop took 2 to 5 of them a stretch of
the day, and nobody could be in more than two counting the opener and the vote talk (that one rule cut about 9,000
moments over 40 seasons). The room left went to colour (kits, games, solos) and to vote talk built from the same few
template lines. A day was 16 scenes: vote talk 3.8, colour 2.8, strategy outside the vote 1.8, drama 0.5, romance 0.26.

## What changed

- The day is thirty and more (`DAY_BUDGET` 30 target, 36 ceiling; the user's choice), talk scaled to match.
- Up to twelve storyline moments a stretch are proposed, in the storyline's own drama order; the budget chooses (story
  before colour, the airtime spread of stage 4). The per-person cap on them is six (it was two).
- Two follow-ups a morning and three serial stories a stretch (a clash's follow-up kept taking the one slot).
- Fixed on the way, each found by reading or measuring the new output:
  - **Drafts repeated lines inside an episode.** A proposal spends its line only if it airs, so several drama scenes
    proposed in one stretch all took the same fresh reaction. A draft now holds its entry for the episode at once
    (`write.js epDraft`), and a bystander's line the episode has used is left out rather than said again.
  - **The kit callback.** Its first pair aired in 61 of 560 episodes ("Joining in. I want to find out whether I can keep
    up."), because the first callback about anybody took pair one, and the bank read like a translation ("Let us ask").
    Ten new pairs in plain English, predictions only, chosen per person and never twice in an episode; its record now
    moves only if the scene airs.
  - **Two scenes on one spot at one time** (more scenes per day): a written scene that would share its spot and its
    stretch moves to the next stretch where the spot is free.
  - **The hour a scene says it is.** A morning window after the challenge is the afternoon, an evening one before it is
    the afternoon, and a scene whose stage directions say it is late or dark is the evening.
  - **Backspace bytes for `\b`.** A Python heredoc in this shell halves backslashes, so `\b` became a backspace byte in
    regexes in `director.js` (new), `kits.js` (the money filter), `previously.js`, `vp-bb-ep/steps.js` (the BB meal
    staging) and `tests/knowledge-integration.test.js`, all of which silently matched nothing. All fixed.

## Measured

Same 40 seasons, stage 5 against now:

| A camp-day | Stage 5 | Now |
|---|---|---|
| Scenes | 16.1 | 23.2 |
| Vote talk | 3.84 | 3.87 |
| Strategy outside the vote | 1.80 | 4.09 |
| Drama | 0.51 | 1.69 |
| Friendship | 1.01 | 1.84 |
| Romance | 0.26 | 0.42 |
| Payoffs (follow-ups, turns, arcs) | 1.24 | 1.99 |
| Episodes with a long line said twice | 68 of 560 | 31 of 560 |
| Top speaker / quietest, median, x an equal share | 1.39 / 0.63 | 1.34 / 0.66 |

Days do not reach thirty yet (median 24, max 31): the long-scene pools run dry (`friend.rideordie` was wanted 235 times
more than it could be written), and one storyline steps once a stretch. More scenes need more writing, which is the
season read's work.

## Not done yet (the user's list)

The vote talk is still built from a few template beats ("They're a group. A real one...", "day one" lines on later
episodes); strategy needs to grow through the day from what happened; Tribal needs its suspense and shock. Next: the
strategy and the plan, then Tribal, then the full read for broken English.

## Verification

- All 25 TD test files (231 tests); 33 BB viewer test files; `tests/knowledge-integration.test.js` with its regex fixed.
- `docs/superpowers/audits/2026-10-14-td-story-step1/`.
