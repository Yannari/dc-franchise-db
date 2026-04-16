# Hide and Be Sneaky Overdrive — Design Spec

**Date:** 2026-04-15
**Scope:** Animation, narrative depth, gameplay mechanics for existing Hide and Be Sneaky challenge
**File:** `js/chal/hide-and-be-sneaky.js` (primary), minor touches to integration files

---

## 1. CSS Animations

All animations in the `NV_STYLES` constant.

- **Scan-sweep reveal:** Each step fades in with left-to-right green scanline wipe (0.3s, clip-path animation)
- **SOAKED splash:** Discovery card shakes (translateX jitter) + blue water overlay fades out (scale 1→1.5, opacity 0.6→0)
- **Chase beat slide-in:** Each beat slides from right with staggered delay. Green beats smooth, red beats jitter.
- **Discovery pulse:** FOUND badge pulses red 3x (0.4s each, box-shadow glow)
- **Last Operative Standing:** Card drops from top with bounce + gold glow pulse on portrait
- **Night-vision flicker:** Whole page subtle opacity flicker (0.97-1.0, every 4s)
- **Reveal button glow:** NEXT SCAN pulses green (box-shadow)

---

## 2. Host Commentary (Chris Quips)

`CHRIS_QUIPS` pool object with categories: `roundEarly`, `roundMid`, `roundLate`, `catchEmbarrassing`, `catchClose`, `catchNormal`, `escapeSuccess`, `betrayal`, `loyal`, `showdown`, `lastStanding`, `chefFrustration`, `stalkerCaught`, `stalkerSurvived`.

4-5 quips per category. Selected during simulation based on context, stored on `ep.hideAndBeSneaky.chrisQuips = { [stepKey]: quipText }`.

Rendered as italic caption above the relevant card:
```
"This is almost too easy." — Chris McLean
```

Chef frustration fires on no-catch rounds. Chef taunts fire on discovery (before chase beats), contextualized by archetype/spot/survival time.

---

## 3. Showmance & Romance Integration

- **Phase 1 showmance moment:** `_checkShowmanceChalMoment()` fires for pairs hiding nearby. Bond +1, romance intensity +1, hiding quality -0.5 each.
- **Phase 2 romance spark:** During solidarity/buddy events, `_challengeRomanceSpark()` fires if `romanticCompat(a, b)`. Once per challenge.
- **Showmance discovery reaction:** When partner gets caught, hidden partner takes -1.0 quality penalty + bond +1 + reaction narrative.
- **Debrief reunion:** Brief reunion text based on outcome (both survived / one immune / both caught).

Stored in `ep.hideAndBeSneaky.showmanceMoments[]`.

---

## 4. Cold Open Hook

Selected at end of simulation. Priority order:
1. Home base escape
2. Showdown winner's flashiest beat (combat/window/last-stand)
3. Betrayal that led to a catch
4. Embarrassing catch
5. Last operative standing
6. Stalker strategy

Stored as `ep.hideAndBeSneaky.coldOpen = { type, text, player }`.

Text backlog injects as `sec('COLD OPEN'); ln(coldOpen.text);` before challenge section.

VP shows as first step — dramatic teaser card with silhouetted portrait.

---

## 5. Stalker Strategy Overdrive

### Setup (Phase 1)
Narrative beat: "Instead of hiding, [name] started following Chef..."

### Per-Round Beat
Dedicated mini-event each round for active stalker. Beat pool: close-call, mimicry, near-blown, aggressive, intel, shadow, distract-others.

Check: `boldness * 0.4 + intuition * 0.3 + physical * 0.3 + noise` vs 5.5.
- Pass: quality +0.5, dramatic text
- Fail: quality -0.5, suspicion +1
- Suspicion 3: Chef catches on, unique confrontation with one escape attempt

### Showdown
Unique Izzy-style combat beat: +3 chase score, popularity +2.

### VP
Purple border cards, eye emoji, "STALKER FEED" sub-header.

Stored in `ep.hideAndBeSneaky.stalkerArc = { player, beats[], suspicion, outcome }`.

---

## 6. Relocation Story

When reposition event fires:
1. Pick new available spot from `HIDING_SPOTS`
2. Update `spotAssignments[player]`
3. Recalculate quality for new spot with +1.0 bonus
4. Text: "[Name] sensed Chef approaching [old]. Silently crept to [new]."

VP card shows old spot (crossed out) and new spot (green). Net quality delta displayed.

---

## 7. Status Tracker Sidebar

Persistent header at top of VP:
```
HIDDEN: 12 | CAUGHT: 0 | IMMUNE: 0
```

Updated by `_hsReveal` after each step based on step type. Counts flash green/red on change.

Each step stores `hiddenDelta`, `caughtDelta`, `immuneDelta` during `rpBuild`.

---

## 8. Chef Personality & Multi-Beat Events

### Chef Taunts
8-10 discovery taunts contextualized by archetype/spot/survival. Rendered before chase beats.

### Chef Frustration
No-catch rounds get a frustration beat as its own step. Pool of 4-5 lines.

### Multi-Beat Setpieces (30% chance)
Some events expand to 2-3 beats:
- **Skunk:** approach → freeze → spray → scream
- **Shared spot:** face-to-face → whisper argument → voices rise
- **Bug swarm:** descend → endure → swat → blown

Stored as `evt.multibeat = [line1, line2, line3]`. VP renders stacked within event card.

---

## 9. Timeline Tag & Badge Registration

### Timeline
`ep.hideAndBeSneaky.timelineTag = 'Hide and Be Sneaky'` with night-vision green.

### Badge Registration
Register in badge lookup system:

| Badge ID | Text | Color |
|---|---|---|
| `hideSeekImmune` | Won Hide & Seek | gold |
| `hideSeekTracker` | Betrayed | red |
| `hideSeekLoyal` | Stayed Loyal | green |
| `hideSeekStalker` | Stalked Chef | purple |
| `hideSeekFlush` | Embarrassing Catch | gray |
| `hideSeekClutch` | Home Base Escape | gold |
