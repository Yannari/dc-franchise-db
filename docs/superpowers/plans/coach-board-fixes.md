# Coaches' Board — fixes from the owner's first look in a browser

## Fix 1 — dead reveal buttons (critical)
`js/vp-coaches.js` was never imported by `js/main.js`, so `coachRevealNext`/
`coachRevealAll` never reached `window`, and the inline `onclick` handlers on
the board's buttons resolved to nothing.

- Added `import * as vpCoachesMod from './vp-coaches.js';` to `js/main.js`
  (next to the other `vp-*` imports) and added `vpCoachesMod` to the
  `extractedModules` spread array that hangs every export onto `window`.
- **Verified, not assumed**: wrote a throwaway vitest+jsdom test that
  imports the real `js/main.js` (stubbing only `window.matchMedia`, which
  jsdom lacks) and asserted `typeof window.coachRevealNext === 'function'`,
  `coachRevealAll`, and `rpBuildCoachBoard` the same way. All three passed
  before the scratch test was deleted. This is meaningful because
  `window[key] = val` assignments from the module spread run *before*
  `await init()` at the bottom of `main.js`, so even if `init()` throws in
  a bare jsdom (it does, for unrelated reasons), the wiring under test is
  already in place by then.

## Fix 2 — avatar portraits everywhere a person is named
Replaced the old bare `${name}` text and the old `_slug()`/`_avatar()`
helpers (which guessed a slug from the display name) with a version that
looks the player up in `players` and resolves the slug via
`resolveAvatarSlug()` from `js/players.js` — the same function the rest of
the app uses, so `-returnee` variants resolve correctly too.

Every `_avatar()` call now renders an `<img>` + a hidden text-fallback
`<span>` toggled by `onerror`, matching the `rpPortrait()` pattern in
`js/vp-screens.js`. Applied to:
- the coach on each session card header
- the coach + contestant named inside every drill narration line
- the contestant in each passed-over ledger row
- the coach and every trained/passed-over name in the sidebar

Added a `cb-av-onlight` modifier class (border/fill swapped to the cork
palette) for avatars sitting on the ledger's cork background and the
sidebar's parchment panel, where the chalk-white default border and fill
were invisible.

## Fix 3 & 4 — the passed-over ledger
**Fix 3**: "left off by X" read as a data gap, not a slight. Replaced with
4 rotating variants per case (seeded by name, not random) that say plainly
that the contestant got no session while others were trained. Section
heading changed from "Left Off the Board" to "Passed Over Tonight".

**Fix 4** (owner follow-up after seeing the live board): the ledger was one
row *per coach* who skipped a contestant, so a contestant ignored by both
coaches on a 2-coach tribe produced two separate rows and buried the fact
that they had nobody. Reworked to group by **contestant**: one row per
skipped contestant, naming every coach who passed on them
(`_joinCoaches()` — "Wayne", "Wayne or Julia", "Wayne, Julia, or Toby").
When the coach list covers every coach on that tribe, the row switches to
a separate escalated text pool ("every coach on the tribe skipped X
tonight — nobody trained them", etc.) and gets a `cb-ledger-row-total`
visual treatment (red left-bar + tint) so a unanimous skip reads as more
pointed than a one-coach skip at a glance.

Also bumped the reveal counter from `"0 / 3"` to `"0 / 3 sessions"` (both
the initial render and the live DOM update in `_reapplyVisibility`) — with
the buttons previously dead, the ledger was the only thing visible on the
board, and a bare `0 / 3` gave no hint that clicking would reveal actual
coaching sessions rather than the screen being broken.

## Verification
- `npx vitest run tests/vp-coaches.test.js tests/coach-backlog.test.js
  tests/coach-wiring.test.js` — 16/16 passed.
- Regenerated `coaches-board-preview.html` from a scratch test rendering
  `rpBuildCoachBoard()` with two tribes, one damaging (negative-gain)
  session, a single-coach skip (Raj), and a unanimous two-coach skip
  (Damien). Confirmed in the output: portraits + fallback spans present on
  every named person, no `undefined` anywhere, Damien's row carries
  `cb-ledger-row-total` and the "clean sweep of neglect" wording, Raj's row
  reads "sat out Wayne's sessions this week", the damaging session shows
  `-0.40 boldness, cost` in red, buttons carry
  `onclick="coachRevealNext('cb-board',4)"` /
  `coachRevealAll('cb-board',4)`, and the counter reads `0 / 4 sessions`.
  Scratch test files deleted after use; the regenerated preview HTML is
  kept as a checked-in artifact per the existing convention.
