# Trust Challenge VP Bugs — To Fix Next Session

## Bug 1: Empty clicks / invisible events
- Some timeline items render as invisible cards
- NEXT button clicks through them with no visual change
- Root cause: VP doesn't render all event types from the timeline

## Bug 2: Events leaking between rounds
- Round 1 heroic event (Zoey/Hicks rope catch) appears in Round 3 Blind Trapeze
- Likely the VP is iterating the timeline and not filtering by round

## Bug 3: AUTO-LOSS shows with no explanation
- Fugu round shows "AUTO-LOSS" but no poisoning or refusal event card
- The event IS in the timeline (poisoning or eater-refused) but the VP doesn't render it
- Need clear "EATER REFUSED" or "FOOD POISONED" card before the AUTO-LOSS label

## Bug 4: Missing sub-round result cards
- Round 3 doesn't show individual William Tell/Trapeze/Toboggan winner cards
- Only the overall Round 3 result shows

## Bug 5: First click still sometimes empty
- Fixed the header skip but pair-cards might also auto-show without needing a click

## Bug 6: Negotiation text role mismatch (FIXED)
- "You're better at this" didn't reference the actual role — FIXED in last commit

## Bug 7: "spectators" term (FIXED)
- Changed to "other players on the ground" — FIXED in last commit

## Root Cause Analysis
The VP (rpBuildTrustChallenge) builds its own steps array from tc.timeline + tc data,
but the mapping between timeline event types and VP render paths is incomplete.
Many event types (poison-honest, poison-negligent, eater-refused, cook-panic-saved, etc.)
don't have matching render branches in the VP.

## Fix Approach
The VP event renderer should be generic — any item with `kind: 'event'` + `text` + `players`
should render as an event card regardless of specific type. The type only affects the
border color and badge. This is how paintball and Hell's Kitchen work.
