# TD: suspense and shock at Tribal — 2026-10-14

Step 4 of the story rework ([step 3](2026-10-14-td-story-step3.md)): "the suspense, the shock at tribal". Read first on
the stepped Tribal of a played season (vp-td-ep tdTribalScreen, as text), then measured over six seasons (78 nights).

## What the read found

- The host's questions came from the day, but missed its two sharpest kinds of moment now that the day airs them: a
  pitch to turn on a friend that the friend heard about, and a lie the cameras saw.
- "You wrote Courtney?" at the campfire: at a marshmallow, Gilded Chris or barf-bag ceremony nobody hears the votes,
  so nobody can catch a teammate's wrong ballot.
- The clock ran backwards: a revote at 9:20, the ceremony at 9:30, then the Dock of Shame at 9:10.
- Two voters in one revote said the same line ("The room's landing on Bowie. I'm not going to be the one holding it up").
- A walk to the dock came back word for word in one season (Yul with Julia, Bowie with Duncan); the host's opening
  question did too.

## What changed

- **Two new questions** (`tribal.js tribalQA`, `lines/n-tqa5.js`). *turned*: the friend somebody tried to turn
  against is asked about it in front of everybody, with the one who pitched it and the one who told sitting there
  ("I know what you said to Owen. Owen told me word for word." / "I did. Sorry, Julia. You asked the wrong person.").
  *lied*: a lie the cameras saw and somebody believed: the host asks where the trouble is, the liar and the one it was
  about at the same fire, and nobody exposes it ("Yul looked out for me today. That's more than I can say for some
  people." / "Was that about me?" / "If it fits.").
- **A wrong ballot caught at the reading** only where the votes are read aloud (fact `count`); elsewhere only the one who
  wrote it knows, in a confessional.
- **The night's clock only runs forward** (`steps.js forwardClock`): a scene stamped earlier than the one before moves
  on, with every later one, keeping their gaps.
- **Revote lines** are never repeated in one night; a small list that runs out falls back to the general one of the same
  meaning (held, flipped), and settling on a name has five ways to say it, not two.
- **The walk to the dock** takes a walk the season hasn't heard from every exit pool first, then the least-heard of the
  big general pool before the small ones. **The opener** is fresh only: when a season has heard them all, the host goes
  straight to the sharp questions.

## Measured, six seasons, 78 nights

| | Before | After |
|---|---|---|
| Question lines repeated within a season | 15 | 0 |
| Walk-out lines repeated within a season | 32 | 17 |
| Nights where the clock runs backwards | (seen) | 0 |
| Revote nights with a repeated line | 7 | 0 |
| *turned* / *lied* asked | 0 / 0 | 4 / 1 |

The walk-outs that still repeat are pools spent by a season of friend walks; the user's call was not to write more just
to fill.

## Verification

- All 25 TD test files (231 tests).
- Read: every *turned* and *lied* exchange the six seasons asked.
