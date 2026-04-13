# Say Uncle Overdrive — Design Spec

## Summary

Overhaul the Say Uncle challenge from a flat stat-roll loop into a 4-phase medieval torture game show ("The Dungeon of Misfortune") with rich narrative, spectator reactions from the pillory, showmance moments between phases, expanded text pools, and a fully themed VP experience.

Core mechanics (survival roll, targeting, backfire, scoring) are unchanged. This is a narrative and structural wrapper around working engine logic.

## Theme: The Dungeon of Misfortune

Medieval torture chamber meets game show. The host plays the Executioner-Showman — half carnival barker, half dungeon master. Stone walls, torchlight flicker, neon Wheel of Misfortune at the center. Eliminated players are locked in a wooden pillory and watch the rest of the challenge.

### VP Palette

| Element | Color | Usage |
|---|---|---|
| Background | `#1a1a2e` (dark stone grey) | Page background, dungeon walls |
| Torchlight | `#e8a035` (warm amber) | Headers, host text, phase dividers |
| Pain | `#da3633` (red) | Pain category dares |
| Fear | `#8957e5` (purple) | Fear category dares |
| Gross | `#3fb950` (green) | Gross category dares |
| Humiliation | `#db61a2` (pink) | Humiliation category dares |
| Dominance/Immunity | `var(--accent-gold)` | Dominant results, winner |
| Pillory | `#8b6914` (muted amber) | Eliminated player frames |
| Backfire | `#da3633` | Backfire badges and text |

### Pillory Portraits

Eliminated players' faces appear in wooden pillory frame styling — a bordered portrait treatment that evokes the wooden stocks. These portraits accumulate as the challenge progresses, building a visual "audience" watching from the sidelines.

## Phase Structure

The existing round loop is wrapped in 4 phases. Phase transitions trigger based on remaining player count, scaling naturally with cast size.

### Phase 1: The Wheel

- **Who:** All players participate.
- **Picks:** None. Pure random dares from the wheel.
- **Purpose:** Establishes who's tough and who's shaky. First eliminations.
- **Fatigue:** Low (early rounds).
- **Phase break:** Host commentary on who looked strong/weak. No spectators yet (or very few).

### Phase 2: The Gauntlet

- **Who:** Surviving players from Phase 1.
- **Picks:** Dominators get pick power. Targeted dares, backfires kick in.
- **Purpose:** Social game begins. Multiple rounds. Bulk of eliminations happen here.
- **Fatigue:** Escalating.
- **Transition:** Triggers when remaining count drops to 3-4 players.
- **Phase break:** Pillory crowd grows. Spectator reactions (taunting, sympathy). Showmance moments if a partner was just eliminated or both are still in.

### Phase 3: The Rack

- **Who:** Final 3-4 players.
- **Picks:** Continue. Every dare matters.
- **Purpose:** High-stakes endgame. Pillory crowd is vocal.
- **Fatigue:** High.
- **Transition:** Triggers when remaining count drops to 2.
- **Phase break:** Showmance moments (partner in pillory watching). Host builds toward the final. Full pillory audience reacting.

### Phase 4: The Final Sentence

- **Who:** Final 2 players.
- **Picks:** If one was picked, backfire still applies.
- **Purpose:** One dare decides immunity.
- **After:** Victory moment. Whole cast reacts — pillory and winner.

### Phase Thresholds

Based on remaining player count, not fixed round numbers:
- Phase 1 → Phase 2: after all players have faced at least one dare (one full rotation)
- Phase 2 → Phase 3: when remaining count ≤ max(3, floor(startingCount * 0.3))
- Phase 3 → Phase 4: when remaining count = 2

## Engine Changes

### simulateSayUncle(ep) modifications

The function keeps its existing internal structure. Changes:

1. **Phase tracking:** Add `currentPhase` variable. Track phase transitions based on remaining count thresholds. Store phase metadata on each round object: `round.phase = currentPhase`.

2. **Phase break generation:** At each phase transition, generate:
   - Host transition line (from text pool)
   - Spectator reactions from pillory (bond-based: allies encourage, enemies taunt)
   - Showmance check via `_checkShowmanceChalMoment()` pattern
   - Romance spark check via `_challengeRomanceSpark()` pattern
   - Store as `ep.sayUncle.phaseBreaks[]` array of `{ afterPhase, hostLine, spectatorReactions[], showmanceMoment?, romanceSpark? }`

3. **Pillory tracking:** Build `ep.sayUncle.pillory[]` as players are eliminated. Each entry: `{ name, eliminatedInPhase, eliminatedInRound, wasBackfire }`.

4. **Spectator reactions during dares (Phase 3+):** For each dare in Phase 3 and the Final Sentence, generate 1-2 spectator reactions from pillory players based on bonds. Store on the round object: `round.spectatorReactions[]`. Flavor text only — no gameplay impact.

5. **Host commentary:** Add `round.hostLine` to each round — wheel spin narration, dare introduction, result commentary. Text pool per phase.

6. **Phase 1 rotation:** In Phase 1, ensure every player faces exactly one dare before transitioning to Phase 2 (one full rotation through the shuffled player list).

### Data stored on ep.sayUncle

Existing (unchanged):
- `rounds[]`, `placements[]`, `backfires[]`, `eliminated[]`, `immunityWinner`, `playerCount`

New:
- `phases[]` — metadata per phase: `{ phase: 1-4, name: string, startRound, endRound, startingPlayers, eliminatedInPhase[] }`
- `phaseBreaks[]` — between-phase content: `{ afterPhase, hostLine, spectatorReactions[], showmanceMoment?, romanceSpark? }`
- `pillory[]` — eliminated player tracking for VP rendering
- Each round gets: `round.phase`, `round.hostLine`, `round.spectatorReactions[]` (Phase 3+ only)

### Survival roll, targeting, category pick, backfire

All unchanged. No mechanical changes.

### No heat system

Bond adjustments from picks/backfires already capture social fallout. No `gs._sayUncleHeat`.

## Text Pools

### Host Commentary (new)

**Phase intro lines (3-5 per phase):**
- Phase 1 "The Wheel": Executioner-Showman introduces the dungeon, explains the wheel
- Phase 2 "The Gauntlet": "Now it gets personal. You survived the wheel. But can you survive each other?"
- Phase 3 "The Rack": "Three left. The wheel is almost done. But the worst dares are still on it."
- Phase 4 "The Final Sentence": "Two remain. One dare. One winner."

**Wheel spin narration (3-5 lines):**
- "The wheel turns... slows... lands on [category]."
- Varies by category — pain gets ominous, humiliation gets theatrical

**Between-phase transitions (3-5 per break):**
- Escalating tension. Acknowledge who just fell. Tease what's coming.

### Spectator Reactions from Pillory (new)

Bond-based selection from eliminated players:
- **Ally (bond ≥ 3):** Encouraging — "Come on, you got this", fist clench, nervous watching
- **Enemy (bond ≤ -3):** Taunting — smirk, laugh, "about time"
- **Neutral:** Just watching — wince, look away, muted reaction
- **Showmance partner:** Special pool — can't look, grips the pillory, whispers encouragement
- **Backfire reaction:** Crowd goes wild when a picker gets burned — 3-5 lines

3-5 lines per bond type. Selected based on bond between spectator and active player.

### Showmance Moments (between phases only)

Fire at phase breaks using existing patterns:
- Partner just eliminated → pillory separation moment
- Both still in → tension of competing against each other
- Partner watching from pillory → encouragement/fear beat
- Romance spark possibility for players bonding through shared suffering

Use `_checkShowmanceChalMoment()` for existing showmances, `_challengeRomanceSpark()` for new sparks.

### Expanded Existing Pools

| Pool | Current count | Target count |
|---|---|---|
| Survive (pass) | 4 | 8 |
| Survive (dominant) | 3 + 3 archetype | 6 + 4 archetype |
| Fail | 5 | 8 |
| Pick (confident) | 3 | 5 |
| Pick (hesitant) | 3 | 5 |
| Backfire | 3 | 6 |
| Called-it | 3 | 6 |

## VP Screens (rebuilt)

### Screen 1: The Dungeon (announcement)

- Dark stone background with torchlight glow effect at edges
- "THE DUNGEON OF MISFORTUNE" title in torchlight amber with text-shadow glow
- "Torture Endurance Challenge" subtitle
- Host quote as Executioner-Showman (3-5 rotating quotes themed to the dungeon)
- Wheel of Misfortune graphic: 4 colored sections (pain/fear/gross/humiliation) with category labels
- Rules in medieval scroll/parchment-styled cards (stone-textured backgrounds)
- Stakes card (player count, phase count)
- Player portraits "entering the dungeon"

### Screen 2: The Torture (phase-by-phase sequential reveal)

- **Phase header cards:** Phase name + number, escalation indicator, remaining player count
- **Per-round cards:**
  - Player portrait + "faces the Wheel of Misfortune..."
  - Wheel spin → category reveal (colored border matching category)
  - Dare card (title + description) with category-colored left border
  - Result badge: DOMINATED (gold) / SURVIVED (green) / SAID UNCLE (red)
  - Host line
  - Reaction text
  - Backfire section (if applicable) — picker portrait in `elim` style
  - Called-it section (if applicable)
  - Pick Next Victim section — picker → victim portrait arrow
  - Spectator reactions (Phase 3+) — small pillory portraits with speech bubbles
- **Phase break cards:** Between phases
  - Host transition line
  - Spectator reactions with pillory portraits
  - Showmance moment (if triggered) — styled distinctly
  - "THE GAUNTLET BEGINS" / "THE RACK" / "THE FINAL SENTENCE" phase transition title
- **Pillory section:** Grows at the bottom of each phase. Eliminated player portraits in wooden-frame styling (pillory border treatment). Accumulates across phases.
- **Final Sentence:** Dramatic card before last dare — VS layout with both finalists, full pillory audience below

Interactive: NEXT / REVEAL ALL buttons (same system as current, themed to match)

### Screen 3: Immunity + Placements

- Winner portrait with torchlight glow halo effect
- "LAST ONE STANDING" in gold
- Archetype label
- Placement order with pillory-themed badges:
  - Winner = "WINNER" (gold)
  - Backfire = "BACKFIRE" (red)
  - Others = placement number in muted amber
- Full pillory cast shown

## Text Backlog

Restructure from flat round list to phase-grouped output:
- Phase header line
- Per-round: player, category, dare, result, reaction, backfire/called-it/pick details
- Phase break: host line, spectator reactions, showmance moment
- Final placement listing

## Cold Open

Already exists. Expand text to reference the Dungeon of Misfortune theme, phases, and pillory.

## Camp Events

Existing three event types (sayUncleWinner, sayUncleBackfire, sayUncleDominated) remain. Badges unchanged. No new event types needed.

## What's NOT Changing

- Survival roll formula and thresholds
- Victim targeting algorithm
- Category pick logic
- Backfire mechanics
- Scoring (placement-based chalMemberScores)
- Camp event boosts
- Dare pool (80 dares across 4 categories)
- Timeline tag
- Debug challenge tab
- updateChalRecord integration
- No heat system
