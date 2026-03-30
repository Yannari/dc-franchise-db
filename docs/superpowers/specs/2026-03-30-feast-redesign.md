# The Feast / Merge Feast — Redesign

**Date:** 2026-03-30
**Status:** Approved

## Overview
Both feast twists generate personality-driven social events instead of flat bond boosts. Event count scales with cast size. Mix of strategic deals, emotional connections (positive AND negative), intel leaks, and power dynamics.

## Shared Mechanics
- Event count: `Math.floor(activePlayers / 3) + 2`
- Base bond boost: all non-hostile pairs get `+0.3 + highestSocial * 0.04` (proportional)
- Event selection: weighted by personalities present (not random)
- VP: dedicated feast screen with event cards

## Event Types

### 1. Strategic Deal
- Two players use the feast to align. May form alliance.
- Weight: `max(strategic_A, strategic_B) * 0.05`
- Bond: +0.8
- Can trigger `_createAlliance` if bond passes threshold

### 2. Emotional Connection (Positive)
- Players who weren't close find common ground
- Weight: `max(social_A, social_B) * 0.04`
- Bond: +0.5 to +1.0 (scales with social)
- Text: genuine human moments — shared stories, laughter, vulnerability

### 3. Emotional Moment (Negative)
- Old tension resurfaces at the table
- Weight: `max((10 - temperament_A), (10 - temperament_B)) * 0.03`
- Bond: -0.5 to -1.0 (scales with inverse temperament)
- Text: arguments, passive-aggressive comments, betrayal callouts

### 4. Intel Leak
- Someone says too much. Listener picks up advantage/vote intel.
- Weight: `listener.intuition * 0.04` (intuitive players notice)
- Leaker: bold or low-temperament player
- Effect: feeds `knownIdolHolders` or `eavesdropBoost`

### 5. Cross-Tribe Sizing Up (pre-merge only)
- Players evaluate threats from other tribes for first time
- Weight: `strategic * 0.03`
- Effect: heat adjustments for players seen as threats

### 6. Power Revealed
- The dominant player becomes visible. Deference patterns noticed.
- Weight: `(strategic + social) * 0.02`
- Effect: highest threat player gets +0.3 heat, observers get strategic awareness

## The Feast (Pre-merge)
- `phase: 'pre-merge'` (was `'any'` — change to restrict)
- Cross-tribe focus: event pairs prioritize different tribes
- Can trigger cross-tribe alliance formation
- "Sizing up" events fire here
- Base bond boost: +0.3

## Merge Feast (Post-merge)
- Bigger bond swings: base +0.5
- Alliance reshuffling: existing alliances tested
- "Power revealed" events more common
- No cross-tribe sizing (everyone's merged)

## Implementation
- Replace the shared `the-feast` / `merge-reward` engine block
- Add `rpBuildFeast(ep)` VP screen
- Save `ep.feastEvents` to episode history
- Add feast screen to VP flow after twists
