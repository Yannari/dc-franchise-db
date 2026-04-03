# Exile Format — Design Spec

**Date:** 2026-04-03

## Overview

Season-wide Exile system that runs every episode automatically (like Journey). Each episode, one player is sent to Exile Island to search for advantages, then returns to attend tribal normally. They are NOT safe — exile is a search opportunity, not protection.

## Settings

- `seasonConfig.exile` — boolean toggle (Enable Exile checkbox)
- `seasonConfig.exilePhase` — `'pre'` | `'post'` | `'both'` (dropdown)
- UI location: Season Setup, near the Journey toggle
- Stops at F4 (`gs.activePlayers.length <= 4`)
- Incompatible with the one-off exile-island TWIST (can't schedule both)

## Flow Per Episode

### Pre-Merge (when `exilePhase` is `'pre'` or `'both'`)

1. Challenge runs, winning tribe identified
2. Winning tribe collectively picks one member of the **losing** tribe to send to exile
   - Selection: weighted random by `intuition * 0.35 + strategic * 0.15 + 0.5` (same as current exile twist)
   - The winning tribe chooses — this is a strategic weapon
3. `gs.exiledThisEp = exiledPlayer` — excludes them from camp events
4. Exiled player searches Exile Island — same find chain as current exile twist:
   - Idol (13-22%), Second Life (4-6%), SNP (3-5%), Sole Vote (3-5%), Extra Vote (8-18%), Idol Clue (15-25%), Nothing (55-84%)
   - All rolls modified by `intuition * 0.01`
   - Respects `sources.includes('exile')` per advantage type
   - Respects advantage count caps and `oncePer` settings
   - If no advantages available → idol clue or nothing
5. Exiled player returns — `gs.exiledThisEp = null` cleared before tribal
6. Player attends tribal normally (can vote, can be voted out)

### Post-Merge (when `exilePhase` is `'post'` or `'both'`)

1. Individual challenge runs, immunity winner identified
2. Immunity winner picks one non-immune player to exile
   - Selection: same weighted random formula from eligible pool
3. Same search → return → attend tribal flow

### Multi-Tribal / Double-Tribal / Slasher Night

Exile does NOT fire on these special episode types (same guard as current exile twist: `!ep.isMultiTribal && !ep.isDoubleTribal && !ep.isSlasherNight`).

## Engine Mechanics

### Trigger Point

Fires post-challenge, before camp events — same position as the current exile-island twist handler. Uses a new function `handleExileFormat(ep)` called from `simulateEpisode` after challenge results.

### State

- `gs.exiledThisEp` — existing field, reused
- `ep.exileFormatData` — `{ exiled, chooser, chooserTribe, chooserMembers, exileFound }` for VP rendering
- No new gs fields needed beyond what already exists

### Advantage Search

Reuses the existing exile search chain (lines ~17688-17737). Extracted into a shared helper `searchExileIsland(exiled, ep)` called by both the twist handler and the format handler.

### Clearing Exile Before Tribal

After the search completes, `gs.exiledThisEp` is set to `null` so the exiled player is included in `ep.tribalPlayers` and can vote/be voted out. The exile happened between challenge and camp — by tribal time, they're back.

### Bond Consequences

- Exiled player: `-0.3` bond with the chooser/choosing tribe (being sent away stings)
- If they found something: mild suspicion from tribemates next episode (they were alone on exile — people assume they searched)

### Incompatibility

- The one-off exile-island TWIST and the exile FORMAT cannot coexist. If `seasonConfig.exile` is enabled, the exile-island twist should be blocked in the twist catalog (add to `incompatible` or disable in UI).

## VP Rendering

Reuses the existing exile VP scene from the twist handler. Shows:
- Who was exiled and by whom
- What they found (or that they found nothing)
- Appears in the twist slot of the VP screen order

## What This Does NOT Do

- No exile at F4 or smaller
- No exile on multi-tribal / double-tribal / slasher episodes
- No safety from tribal — exile is a search trip, not protection
- No new advantage types — uses existing find chain
- No exile on episodes without a challenge result (no-tribal twists)
