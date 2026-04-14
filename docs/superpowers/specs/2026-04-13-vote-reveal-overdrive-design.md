# Vote Reveal Overdrive — "Live Results Night"

## Overview

Transform the tribal council vote reveal from a simple card-flip sequence into a reality TV broadcast experience. The tally becomes a full-width leaderboard that takes center stage, each vote click triggers a multi-beat dramatic sequence, and threshold moments (ties, near-majority, majority) fire escalating visual reactions. Click-driven throughout — no auto-pacing.

## Current State

- Vote cards in a list with a tally sidebar (flex: 2 of 5)
- Single 0.5s card flip animation (`tvFlip` keyframes, rotateY)
- Tally: 3px thin bars, 18px count numbers, opacity fade-in on first vote
- `tv-tally-leading` class turns bar/count red for the leader
- `_tvState[epNum]` tracks revealed count, tallyCounts, flipping lock
- `tvRevealNext()` handles one-at-a-time reveal, `tvRevealAll()` for instant
- Post-reveal: torch snuff with canvas particle effect (3s)

## Design

### 1. Tally Leaderboard (replaces sidebar)

The tally moves from a narrow sidebar to a **full-width leaderboard above the vote cards**. Layout changes from horizontal (tally beside cards) to vertical (tally stacked on top, cards below).

**Each tally row contains (left to right):**
- CSS torch icon (decorative, not load-bearing for information)
- Player portrait (32px round)
- Player name
- Thick horizontal bar (14px tall, rounded, proportional to votes)
- Vote count number (28px, bold)

**Row states:**
- **0 votes**: dimmed (opacity 0.4), torch unlit, bar empty
- **Has votes**: full opacity, torch lit, bar filled
- **Leading**: red glow border, faster torch flicker, red bar (`#da3633`), red count
- **Tied for lead**: both rows pulse alternately, bars flash red/amber
- **Majority reached**: losing rows grey out + torches snuff (small particle puff). Winner row solid red, torch at max.

Rows appear on first vote received — slide in from left with fade (not just opacity).

### 2. Vote Card Reveal Sequence

Each click of "Read the Vote" triggers a 4-beat sequence (~1.5s total):

**Beat 1 — Spotlight (0 to 0.2s)**
- All other cards + tally dim to opacity 0.7
- Next card gets a blue-white glow border

**Beat 2 — Flip (0.2 to 0.7s)**
- Existing card flip animation (kept)
- Card content fades in at midpoint (existing)

**Beat 3 — Vote Flies (0.7 to 1.1s)**
- Voted-for name highlights briefly in the card
- Ghost copy of the name animates upward from card to the matching tally row
- Translucent trail (`#f85149` at 60% opacity) fades as it reaches the bar
- If first vote for this person, the tally row slides in at this moment

**Beat 4 — Tally Reacts (1.1 to 1.5s)**
- Bar width animates to new proportion (spring ease)
- Count does scale bounce (1.0 → 1.3 → 1.0)
- Torch flame grows
- Lead change: old leader loses red glow, new leader gains it
- Full opacity restored (spotlight ends)
- `tv-latest` stays on the card

Button re-enables after beat 4. Clicks cannot overlap.

**"Reveal All"** skips beats 1 and 3, flips all cards and slams final tally state immediately.

### 3. Threshold Reactions

Extra effects fire after Beat 4 at key milestones:

**Tie vote:**
- Both leading tally rows pulse with alternating red/amber borders (2s loop, continues until tie broken)
- Small "TIED" badge appears between them (9px, uppercase, pill style)

**One vote away (majority - 1):**
- Banner slides down below tally: "ONE VOTE AWAY"
- Leading player's torch flicker speeds up
- Banner dismisses on next click

**Majority reached:**
- Brief full-screen red flash (0.15s, `rgba(248,81,73,0.12)` overlay)
- All non-eliminated tally rows grey out, torches snuff with small particle puff
- Eliminated player's row stays red, torch at max
- Button text changes to "The [Nth] person voted out..." — clicking scrolls to results + fires existing torch snuff sequence

**Normal vote (no milestone):** Beat 4 plays cleanly with no extras.

### 4. Visual Styling

**Tally container:**
- Background: `#0a0e14`
- Border: `1px solid #1a1f28`, radius `14px`
- Padding: `16px 18px`
- Header: "THE VOTES" — 10px, weight 800, tracking 3px, color `#e3b341` (gold)

**Tally bars:**
- Track: `#161b22`
- Fill: `#30363d` (default), `#da3633` (leading), `#d29922` (tied)
- Radius: `7px`, height: `14px`
- Transition: `width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)` (spring overshoot)

**Torch icons (CSS only):**
- Layered `box-shadow` + shaped `border-radius` (50% 50% 50% 50% / 60% 60% 40% 40%)
- 3 sizes: unlit (6px, `#1a1f28`), low (10px, `#c45a1a`), high (16px, `#e8873a`)
- Flicker: reuses existing `torchFlicker` at varied speeds (3.5s default, 2s leading, 1.2s at majority-1)

**Vote fly trail:**
- Ghost text: `#f85149` at 60% opacity, blurs to 0 over flight path
- CSS absolute position tween or `motion-path`, whichever performs better

**Spotlight dim:**
- Overlay: `rgba(0,0,0,0.25)` on full `.rp-page`
- Current card: `position: relative; z-index: 2` above the dim
- In: 0.2s, out: 0.3s

**"ONE VOTE AWAY" banner:**
- Background: `rgba(248,81,73,0.08)`, border: `1px solid rgba(248,81,73,0.25)`
- Radius: `8px`, padding: `6px 14px`
- Font: 11px, weight 700, tracking 2px, color `#f85149`
- Slides from `translateY(-10px)` to 0, 0.3s

**Full-screen flash:**
- Absolute overlay, `rgba(248,81,73,0.12)` → transparent, 0.15s
- `pointer-events: none`

### 5. Compatibility Notes

- Must work with multi-tribal episodes (each tribal gets its own tally leaderboard instance)
- Must work with fresh vote (vote wipe) — separate leaderboard for `_fvId`
- Must work with revote rounds — revote tally panel gets same leaderboard treatment
- Extra vote / vote steal / black vote cards retain their existing accent styling; the fly animation uses the same trail regardless of vote type
- `_tvState` gains no new persistent fields — all animation state is transient CSS classes
- Existing `tvShowResults()` and `torchSnuffFx()` are unchanged; the overdrive layers on top
