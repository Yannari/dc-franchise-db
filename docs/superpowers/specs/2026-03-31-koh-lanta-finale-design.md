# Koh-Lanta Finale Format — Design

**Date:** 2026-03-31
**Status:** Approved

## Overview
New `finaleFormat: 'koh-lanta'` option. F4 Orienteering Race eliminates last place, F3 Perch endurance challenge determines immunity winner, winner picks one opponent for F2 FTC. Fire-making moves from checkbox to dropdown option alongside this.

## UI Changes
- Remove "Firemaking Final Elimination" checkbox
- Add to finaleFormat dropdown:
  - `'fire-making'` — Fire-Making (F4 decision + duel, F3 FTC)
  - `'koh-lanta'` — Koh-Lanta (F4 orienteering, F3 perch, F2 FTC)
- Both `fire-making` and `koh-lanta` lock finaleSize slider to 4
- `seasonConfig.firemaking` derived from `finaleFormat === 'fire-making'` (backward compat)

## Flow

### 1. The Orienteering Race (F4 → F3)

**Navigation puzzle race.** 4 players with maps and compasses. Find beacons in the jungle, decode color+number directions, find the dagger. First 3 back are safe. Last eliminated.

**Score:** `mental * 0.3 + intuition * 0.25 + physical * 0.2 + endurance * 0.15 + strategic * 0.1 + random * 2.5`

**4 staged narrative beats:**
1. **"GO"** — all 4 run into the jungle with maps and compasses. Setup text.
2. **First horn** — highest scorer returns with their dagger. Safe. Others hear the horn — pressure spikes.
3. **Second horn** — second highest returns. Two safe. Two still searching. Wrong turns, retracing steps.
4. **Third horn / Elimination** — third returns. Last player emerges empty-handed. Eliminated on the spot.

**Drama:** each horn is a beat. The narrative describes the last two in the jungle — one finds it, one doesn't. The loser walks back knowing it's over.

**Data:** `ep.klOrienteering = { placements: [1st, 2nd, 3rd, 4th], eliminated, scores: {}, stages: [...] }`

### 2. The Perch (F3 → F2 + immunity winner)

**Multi-phase shrinking platform endurance.** 3 players stand on perches. Platform shrinks in stages. Players drop when they can't hold.

**4 Phases:**
1. **Full platform (21×16 cm)** — easiest. All 3 score. Nobody drops. Settling in narrative.
2. **First peg removed (16×16)** — harder. Scores rerolled. Weakest player wobbles. Might drop (40% chance if cumulative lowest).
3. **Second peg removed (10×16)** — tight. Guaranteed drop by end of this phase. Down to 2. Dramatic exit.
4. **Final stage (10×10 / one foot)** — the showdown. Extended narrative. Shaking, sweat, eye contact, willpower. Final roll determines winner.

**Per-phase score:** `endurance * 0.4 + temperament * 0.3 + physical * 0.2 + mental * 0.1 + random * 2`

Cumulative scoring — previous phases carry weight. Strong early can fade. Barely-holding-on can outlast through temperament.

**Narrative per phase:**
- Mechanism description (pulling cords to remove pegs)
- Player adjustments, body language, signs of fatigue
- Drop scene: foot slips, tries to recover, falls
- Final showdown: extended, the two staring each other down

**Data:** `ep.klPerch = { phases: [...], dropOrder: [3rd, 2nd], winner, scores: {} }`

### 3. The Choice (immunity winner picks F2 opponent)

**Same blend as fire-making decision:**
- `strategic * 0.1` chance of using jury projection (pick who you can beat)
- Otherwise: bond-based (pick your closest ally)

**The unchosen player is eliminated (3rd place, goes to jury).**

**Data:** `ep.klChoice = { winner, chosen, eliminated, reason: 'strategic'|'bond' }`

### 4. F2 FTC

Standard jury vote between the final two. `projectJuryVotes` + `applyFTCSwingVotes`.

## VP Screens

1. **"The Orienteering Race"** — staged narrative with 4 beats (go, horn, horn, elimination). Challenge description. Player portraits with placements. Elimination card for 4th.
2. **"The Perch"** — 4-phase staged narrative. Platform dimensions shown. Drop scenes. Final showdown. Winner revealed with immunity badge.
3. **"The Choice"** — immunity winner center. Chosen = "FINAL TWO" green. Eliminated = "3RD PLACE" red. Reason text (strategic/bond).
4. **"Final Tribal Council"** — standard FTC screens with F2.

## Engine Integration

- In `simulateFinale()`: new code path for `cfg.finaleFormat === 'koh-lanta'`
- Runs: orienteering → eliminate 4th → perch → determine winner → choice → eliminate 3rd → F2 FTC
- `handleAdvantageInheritance` called for both eliminations
- Both eliminated players go to jury

## Finale Format Dropdown Consolidation

Remove the firemaking checkbox. The dropdown becomes the single source of truth:

| Format | finaleSize | FTC size | F4 mechanic |
|---|---|---|---|
| Council Vote | configurable (2-4) | matches size | cut if needed |
| Jury Cut | configurable | matches size | jury decides |
| Fan Vote | configurable | matches size | fans pick |
| Final Challenge | configurable | matches size | grand challenge |
| Fire-Making | locked 4 | F3 | decision + fire duel |
| Koh-Lanta | locked 4 | F2 | orienteering + perch + choice |

`seasonConfig.firemaking` becomes a computed property: `true` when `finaleFormat === 'fire-making'`.

## Backward Compatibility

- Old saves with `firemaking: true` + `finaleFormat: 'fire-making'` continue to work
- Old saves with `firemaking: true` + `finaleFormat: 'traditional'` → engine checks both `cfg.firemaking` and `cfg.finaleFormat === 'fire-making'`
- The checkbox removal is UI-only — the config key persists for old saves
