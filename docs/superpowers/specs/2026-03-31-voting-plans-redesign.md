# Voting Plans Screen — Redesign

**Date:** 2026-03-31
**Status:** Approved

## Overview
Redesign `rpBuildVotingPlans` from outcome-based (groups votes by actual results) to alliance-first (shows what each alliance planned). No spoilers — the Voting Plans screen is pre-tribal. Conflicted players get "why vote / why not" reasoning for each option. Modern, icon-rich, visually striking.

## Layout Flow

### 1. Header
- Episode number, tribe name, "Voting Plans" title
- Immune players (green shield icon)
- No-vote players (red X icon, journey/beware reason)

### 2. Alliance Plans
Each named alliance with 2+ members at tribal gets a card:
- Alliance name + member count + "can vote" count
- TARGET: name + threat category + icon
- Member list: name only, no outcome
  - ⚠ badge on conflicted members (multi-alliance or bond conflict)
  - Muted for no-vote members
  - Spearheader labeled
- Split vote indicator if active: "SPLIT VOTE — also targeting [secondary]"

### 3. Conflicted Players (the drama section)
Only players who are genuinely torn. Two qualifying conditions:
- **Multi-alliance**: in 2+ alliances with different targets
- **Bond conflict**: alliance target is someone they have bond ≥ 3 with

For each conflicted player, show each possible path:
- Alliance name → target name
- **Why vote**: 1-2 sentences — the strategic/alliance reason to follow this plan
- **Why not**: 1-2 sentences — the personal/tactical reason to break from it
- **Wild card → ???**: hint that they might go completely off-script. Generic dramatic text.

### 4. Independent Votes
Players not in any named alliance at tribal. Minimal — just name + brief context ("unaligned", "playing solo", "holds an idol").

### 5. Going into Tribal
- Primary target: name + alliance backing + committed vote count
- Counter target: name + alliance backing + vote count
- One-line tension summary: "X conflicted players could swing the outcome"

### 6. Advantages in Play
- Idol holders with icon
- KiP / Extra Vote / Super Idol with context
- "An idol play tonight could change everything" if relevant

### 7. Key Confessionals
- Keep existing confessional section — one first-person quote per notable player
- These are pre-tribal thoughts, not outcomes

## What's Removed
- ~~Vote groups by target~~ — replaced by Alliance Plans
- ~~"Possible Flip" on most players~~ — replaced by selective Conflicted Players
- ~~Original Alliance Plans section~~ (the one I added earlier) — that was post-vote; now the entire Voting Plans IS the alliance plans
- ~~Outcome indicators~~ (checkmarks, red X, "→ voted [name]") — no spoilers

## Conflicted Player Reasoning Generation
The "why vote / why not" text is generated from game state:
- **Why vote**: alliance consensus, member count, threat category of target, shared enemies
- **Why not**: strong bond with target (`bond >= 3` → "the bond runs too deep"), competing alliance loyalty, personal grudge against a different player, new alliance (bonds too fresh)
- **Wild card**: generic dramatic text selected by personality (bold → "might go for the biggest name in the room", strategic → "three plans and none of them feel right")

## Swing Vote Qualification (tightened)
Only flag as conflicted/swing:
1. Player in 2+ alliances with DIFFERENT targets at tribal
2. Player in 1 alliance but has bond ≥ 3 with the alliance's target
3. Player in 1 alliance but loyalty ≤ 4 AND has bond ≥ 3 with someone targeted by a different plan

NOT a swing: generic loyal player, player who just has low loyalty, player whose reason text happens to contain "for now"

## Visual Design
- Modern dark theme matching existing VP aesthetic
- Icons: shield (immune), skull (target), chain-link (alliance), warning triangle (conflicted), question mark (wild card), sword (split vote)
- Alliance cards: indigo/purple border theme (consistency with alliance color language)
- Conflicted section: gold/amber border theme (warning, tension)
- Target badges: red background with threat category
- Clean typography: alliance names in display font, member names in system font
- Smooth animations: `slideInLeft` on cards, staggered by 80ms
- Portraits: use `rpPortrait()` for all player references

## Data Sources
- `ep.alliances` — alliance plans (target, members, label, type, splitTarget)
- `ep.splitVotePlans` — split vote assignments
- `gs.namedAlliances` — alliance metadata (formed ep, betrayals)
- `gs.knownIdolHoldersThisEp` / `gs.knownIdolHoldersPersistent` — idol awareness
- `ep.advantagesPreTribal` — advantage state before tribal
- `ep.votingLog` — NOT used for plan display (that's the outcome); only used for confessionals

## Implementation
- Rewrite `rpBuildVotingPlans(ep)` from scratch
- Remove the old `targetGroups` / `mainPlans` / `soloVotes` pipeline
- Build from `ep.alliances` (alliance-first)
- New helper: `generateConflictedReasoning(player, alliances)` — produces why/why-not text for each path
- New helper: `isGenuineSwing(voter, alliances)` — replaces `isUnstableReason`
- Keep: `targetCategory()`, `reasonToConf()`, advantage displays, confessional section
- Remove: `matchAlliance()` (no longer needed — alliances are the source, not reconstructed)
