# Chain of Command — Design Spec

**Date:** 2026-05-19
**Category:** Elimination twist (voting replacement)
**Phase:** Post-merge only
**Minimum players:** 3

---

## Overview

Chain of Command replaces the normal tribal council vote with a public social selection chain. The immunity winner picks one player to save. That player picks the next, and so on. The last player left unpicked is eliminated. No vote — pure social pressure.

The twist creates a PUBLIC pecking order where every position carries meaning: early picks confirm loyalty, late picks signal expendability, and the last pick is a devastating public rejection.

---

## Core Mechanic

### Trigger

- TWIST_CATALOG: `{ id:'chain-of-command', emoji:'⛓️', name:'Chain of Command', category:'elim', phase:'post-merge', desc:'Immunity winner starts a chain by picking players safe one by one. Last unpicked is eliminated. No vote — pure social selection.', engineType:'chain-of-command', incompatible:['no-tribal','double-elim','double-boot','tied-destinies'] }`
- `applyTwist()` in twists.js sets `ep.isChainOfCommand = true`
- Minimum 3 active players to fire. If fewer than 3 remain when the twist is scheduled, fall through to normal tribal council

### Flow

1. Normal immunity challenge runs first (or twist challenge if scheduled)
2. Instead of tribal council, Chain of Command fires
3. Chris announces: "If anyone has a hidden immunity idol, you may play it now"
4. Idol holders who play are inserted as "safe" at position 1+ (right after immunity winner), removed from the unpicked pool — multiple idol plays allowed
5. Immunity winner picks first — selects one unpicked player to be "safe"
6. That picked player becomes the next picker, selects another safe player
7. Repeat until one player remains unpicked — they're eliminated
8. The tribal slot is used but the vote mechanic is replaced entirely

### Selection Algorithm (per pick)

- Build weighted pool from unpicked players
- Weight = `getPerceivedBond(picker, candidate)` normalized to 0–10 range + alliance membership bonus (+3 if same named alliance) + `noise(1.5)`
- Higher weight = picked earlier (save friends first)
- The picker never picks themselves (already safe)

---

## Bond Shifts & Consequences

### Immediate Bond Shifts (during the chain)

| Position | Shift | Reason |
|----------|-------|--------|
| Picks 1–2 (early) | picker→pickee `addBond(+1)` | Loyalty confirmed |
| Middle picks | No change | Neutral territory |
| Second-to-last pick | picker→pickee `addBond(-1)` | "You barely made it" |
| Eliminated → last picker | `addBond(-2)` | "You could have saved me" |
| Eliminated → immunity winner | `addBond(-1)` | Blame the one who started it |

### Hesitation Events

- When a picker has bond ≥ 3 with 2+ remaining unpicked players: 60% chance of a hesitation beat — archetype-driven narration where they visibly agonize
- When a picker has bond ≤ -2 with the person they're about to skip: 40% chance of a "cold shoulder" moment

### Camp Events Next Episode

Stored on `gs._chainCampEvents`, consumed and cleared by `generateCampEventsForGroup()` next episode.

| Event | Trigger | Effect |
|-------|---------|--------|
| Gratitude | Early picks (position 1–2) | Picked player thanks picker. `addBond(+1)`. `badgeText: 'Grateful'` |
| Confrontation | Last 2 picks before elimination | Late-picked player confronts picker. `addBond(-1)`. `badgeText: 'Resentful'` |
| Blame the winner | 30% chance | Eliminated player's closest ally confronts immunity winner. `addBond(-2)`. `badgeText: 'Blame'` |

Fire 1–2 camp events per episode, weighted by how dramatic the picks were.

### Popularity

| Moment | Delta |
|--------|-------|
| Immunity winner (power moment) | +2 |
| Eliminated player (sympathy) | +3 |
| Hesitation moment (drama) | +1 for the hesitating picker |

---

## Episode Integration

### Code Organization

- Chain logic: inline in `episode.js` (tribal replacement, same pattern as sudden-death/slasher-night)
- VP screens: in `vp-screens.js` (non-challenge VP)
- Text backlog: custom `_textChainOfCommand()` in `text-backlog.js`

### episode.js Flow

- After immunity challenge, before tribal council
- If `ep.isChainOfCommand && gs.isMerged`: run chain logic
- Set `ep.chainOfCommand` with full chain data
- Set `ep.eliminated` to last unpicked player
- Skip normal vote — but still run idol insertion and elimination processing
- Inject camp events for next episode via `gs._chainCampEvents`

### Data Shape: `ep.chainOfCommand`

```javascript
{
  immunityWinner: 'Alex',
  idolPlays: [{ player: 'Sam', position: 1 }],  // or empty array
  chain: [
    { position: 0, player: 'Alex', pickedBy: null, type: 'immunity' },
    { position: 1, player: 'Sam', pickedBy: null, type: 'idol' },
    { position: 2, player: 'Dana', pickedBy: 'Alex', type: 'pick', hesitation: false },
    { position: 3, player: 'Kai', pickedBy: 'Dana', type: 'pick', hesitation: true, hesitationText: '...' },
    // ...
    { position: 7, player: 'Riley', pickedBy: null, type: 'eliminated' }
  ],
  eliminated: 'Riley',
  bondShifts: [{ from: 'Riley', to: 'Kai', delta: -2 }, ...]
}
```

### Episode History

Add `isChainOfCommand: ep.isChainOfCommand || false, chainOfCommand: ep.chainOfCommand || null` to ALL `gs.episodeHistory.push` calls in episode.js (4+ locations).

### twists.js

Add `engineType === 'chain-of-command'` → `ep.isChainOfCommand = true` mapping in `applyTwist()`. Also add to `_engineFlagMap`.

---

## VP Screens — Military Tribunal Theme

### Visual Identity

- CSS prefix: `coc-`
- Fonts: `'Black Ops One'` (display) + `'Share Tech Mono'` (body)
- Palette: olive drab (#4a5028), brass (#b8860b), gunmetal (#2a3439), khaki (#c3b091), red alert (#cc3333)
- Background: dark gunmetal with subtle radar sweep animation
- Icons: CSS-only dog tags, chain links, clearance stamps, crosshairs
- `max-width:1100px;margin:0 auto` on shell
- `@media(prefers-reduced-motion:reduce)` fallback on all animations

### Screen 1: Briefing Card

- "CHAIN OF COMMAND" stencil header with classified stamp overlay
- Rules explanation text
- Immunity winner portrait with brass star badge
- Player count + chain length info

### Screen 2: Chain Formation (click-to-reveal)

Each pick is a card with:
- Chain link connector to previous pick (CSS animated)
- Picker's portrait (pb-xs) with "SELECTED BY" label
- Picked player's portrait (lg) with dog tag showing position number
- "CLEARANCE GRANTED" stamp animation on reveal
- Reaction text — archetype-driven, 4+ variants per position tier (early/middle/late)
- Hesitation beats: separate yellow "DELIBERATION" card before the pick
- Idol plays: red "OVERRIDE — IMMUNITY PROTOCOL" card
- Last person: no picker, red "CLEARANCE DENIED" stamp, elimination card with torch-snuff effect and archetype-driven last words

### Screen 3: Pecking Order Summary

- Full chain displayed vertically with chain-link connectors
- All portraits in order, position numbers as dog tag badges
- Bond shift annotations (green +1, red -2) next to relevant pairs
- "MISSION COMPLETE" footer with eliminated player's final portrait greyed out

### Sidebar

Live-updating chain tracker — portraits appear one by one as reveals progress, gated by `_tvState`. Empty slots show as classified redacted blocks until revealed. Rebuilt via innerHTML replacement on every reveal click.

### Controls

Sticky fixed bottom bar with reveal next/all buttons + counter by ID. Auto-scroll via `scrollIntoView({ behavior: 'smooth', block: 'center' })`.

---

## Text Backlog

Custom `_textChainOfCommand(ep, ln, sec)` in text-backlog.js. Renders:

```
═══ CHAIN OF COMMAND ═══
[Immunity winner] holds the power. The chain begins.

[Idol plays if any]
Sam plays a Hidden Immunity Idol — automatically safe.

Pick 1: Alex saves Dana. "I trust you with my life in this game."
Pick 2: Dana saves Kai. [hesitation text if any]
...
ELIMINATED: Riley. No one saved them. Last words: "..."

Bond shifts:
  Riley → Kai: -2 (abandoned)
  Alex → Dana: +1 (loyalty confirmed)
```

Placed in `generateSummaryText()` after challenge text, before `_textCampPost`. Gated by `ep.isChainOfCommand && ep.chainOfCommand`.

### Timeline Badge (run-ui.js)

`⛓️ Chain of Command` pill, styled olive/brass to match military theme.

---

## Integration Checklist

1. **core.js** — TWIST_CATALOG entry
2. **twists.js** — `applyTwist()` flag + `_engineFlagMap`
3. **episode.js** — chain logic after immunity challenge, before tribal; episode history fields in all push calls
4. **vp-screens.js** — 3 VP screens (briefing, chain formation, pecking order summary) + sidebar + CSS
5. **text-backlog.js** — `_textChainOfCommand()` + call in `generateSummaryText()`
6. **run-ui.js** — timeline badge
7. **camp-events.js** — consume `gs._chainCampEvents` for next-episode events
