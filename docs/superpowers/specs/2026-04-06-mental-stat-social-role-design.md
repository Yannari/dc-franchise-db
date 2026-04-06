# Mental Stat — Non-Challenge Social Role

**Date:** 2026-04-06
**Status:** Approved
**Type:** Stat rebalance (small, targeted)

---

## Overview

The mental stat is almost entirely a challenge stat. This adds a secondary social role: **information processing**. High-mental players are better at detecting deception, spotting patterns, and seeing through lies — boosting existing intuition-based checks rather than creating new systems.

---

## Philosophy

- **Intuition** = gut feeling, reading people, sensing something's off
- **Mental** = processing data, recognizing patterns, crunching the math
- Intuition remains the PRIMARY detection stat. Mental is a SECONDARY boost (~30-40% of intuition's weight)
- A player with high intuition + low mental = gut-reader (feels it, can't explain why)
- A player with low intuition + high mental = analyst (doesn't read rooms, but crunches data)
- A player with both high = full package (Dawn from Survivor)

---

## Changes

### 1. Fake Idol Detection
- **Current:** `intuition * rate`
- **New:** `intuition * rate + mental * rate * 0.35`
- **Effect:** Smart players spot fake idols faster

### 2. Mole Suspicion Gain
- **Current:** `intuition * 0.04 * (1.1 - resistance)`
- **New:** `(intuition * 0.04 + mental * 0.015) * (1.1 - resistance)`
- **Effect:** Smart players notice sabotage patterns sooner

### 3. Perceived Bond Correction
- **Current:** `intuition * 0.07`
- **New:** `intuition * 0.07 + mental * 0.025`
- **Effect:** Smart players realize faster when bonds aren't what they seem

### 4. Info Broker Exposure
- **Current:** `intuition * 0.04`
- **New:** `intuition * 0.04 + mental * 0.015`
- **Effect:** Smart players catch double agents sooner

### 5. False Info Blowup Detection
- **Current:** intuition-based check
- **New:** + mental * 0.3 factor
- **Effect:** Smart players see through planted lies

---

## What Does NOT Change

- Challenge formulas (mental already heavily used)
- Threat score formula (already includes mental)
- Vote miscommunication (already uses mental)
- Camp event selection weights
- Any threshold checks (all changes are proportional per Stat Philosophy Rule 1)

---

## Implementation Notes

- All changes are proportional: `mental * factor` — every point matters
- No new functions needed — just modify existing detection formulas
- Search for all `intuition * 0.04` and `intuition * 0.07` patterns to find integration points
- Mole suspicion: the `(1.1 - resistance)` wrapper stays, mental is added inside the base rate
- Test: a mental-10 player should detect ~35% faster than a mental-1 player (same intuition)

---

## Scope

Small — 5 formula modifications, no new systems, no new events, no VP changes.
