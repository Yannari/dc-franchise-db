# RI Duel Narration Overhaul

## Problem

Redemption Island duels are flat. Challenge names (Fire-Making, Speed Puzzle) are decorative labels disconnected from the exchange narration underneath. Exchanges are isolated stat comparisons with generic one-sentence text — no rising tension, no comeback story, no sense that you're watching a real battle. The whole duel reads like a stat report.

## Solution

Replace the abstract exchange system with a **challenge-driven narration engine**. Each duel picks a concrete challenge from a bank of 18 challenges. The challenge defines its own stat pair, 3-phase structure with dramatic names, multi-beat narration that describes what players are physically doing, score-aware host commentary, and breathing moments between phases that affect gameplay.

## Challenge Bank Structure

Each challenge is a self-contained narration package:

```javascript
{
  id: 'fire-making',
  name: 'Fire-Making',
  desc: 'Build a fire high enough to burn through the rope.',
  primary: 'endurance',
  secondary: 'physical',
  phases: [
    { name: 'The Spark', tag: 'opening' },
    { name: 'Building the Flame', tag: 'pivot' },
    { name: 'Burn the Rope', tag: 'climax' },
  ],
  narration: {
    opening: { winDom: [...], winClose: [...], loseHard: [...], loseCollapse: [...] },
    pivot:   { winDom: [...], winClose: [...], loseHard: [...], loseCollapse: [...] },
    climax:  { winDom: [...], winClose: [...], loseHard: [...], loseCollapse: [...] },
  },
  host: {
    opener: [...],
    after1: { leading: [...], tied: [...], trailing: [...] },
    after2: { leading: [...], tied: [...], matchPoint: [...], dominant: [...] },
    closer: { dominant: [...], close: [...], comeback: [...], sweep: [...] },
  },
}
```

### Key properties

- **3 phases per challenge** with thematic names shown in VP instead of "Exchange 1/2/3"
- **Phase tags** (`opening`, `pivot`, `climax`) drive the story arc — climax narration is always the most intense
- **Multi-beat narration** — each variant is 2-3 short paragraphs describing what players physically do in that challenge
- **Score-aware host** — host commentary between phases knows who's leading, if tied, if someone's about to sweep or come back
- **Stats fixed per challenge** — fire-making always tests endurance+physical. No random stat pairs.

## Challenge Roster (18 Challenges)

### Physical-Heavy
| # | ID | Name | Stats | Description |
|---|---|---|---|---|
| 1 | `fire-making` | Fire-Making | endurance + physical | Build a fire high enough to burn through the rope |
| 2 | `rope-chop` | Rope Chop | physical + temperament | Chop through thick rope with a machete |
| 3 | `log-roll` | Log Roll | physical + endurance | Balance on a spinning log over water |
| 4 | `climbing-wall` | Climbing Wall | physical + boldness | Scale a wall and ring a bell |

### Endurance-Heavy
| # | ID | Name | Stats | Description |
|---|---|---|---|---|
| 5 | `endurance-hold` | Endurance Hold | endurance + temperament | Hold position on a perch. Last one standing. |
| 6 | `water-carry` | Water Carry | endurance + physical | Fill a bucket by carrying water in leaky containers |
| 7 | `hand-on-idol` | Hand on Idol | endurance + loyalty | Keep your hand on the idol. Last to let go wins. |

### Mental-Heavy
| # | ID | Name | Stats | Description |
|---|---|---|---|---|
| 8 | `slide-puzzle` | Slide Puzzle | mental + strategic | Complete a slide puzzle under pressure |
| 9 | `memory-sequence` | Memory Sequence | mental + intuition | Memorize and recreate a symbol sequence |
| 10 | `card-stacking` | Card Stacking | mental + temperament | Build a house of cards to a target height |

### Precision / Skill
| # | ID | Name | Stats | Description |
|---|---|---|---|---|
| 11 | `precision-toss` | Precision Toss | physical + mental | Toss rings/sandbags onto targets |
| 12 | `slingshot-gallery` | Slingshot Gallery | intuition + physical | Hit targets with a slingshot |
| 13 | `balance-beam` | Balance Beam | temperament + mental | Cross a beam while stacking blocks |

### Mixed / Utility
| # | ID | Name | Stats | Description |
|---|---|---|---|---|
| 14 | `blindfold-maze` | Blindfold Maze | intuition + boldness | Navigate a maze blindfolded using only touch |
| 15 | `knot-untying` | Knot Untying | mental + endurance | Untie a series of complex knots under time pressure |
| 16 | `dig-and-search` | Dig & Search | physical + intuition | Dig through sand to find buried keys/bags |
| 17 | `obstacle-course` | Obstacle Course | physical + strategic | Sprint through a multi-stage obstacle course |
| 18 | `bocce-bombs` | Bocce Bombs | temperament + strategic | Roll balls closest to a target marker |

Every stat appears in at least 3 challenges. No two challenges share the exact same stat pair. Every archetype has challenges where they shine.

## Multi-Beat Narration & Story Arc

### Phase position shapes tone

- **Opening** (`tag: 'opening'`) — Setting the scene. Players approach stations. First moves. Establishing confidence vs. shakiness.
- **Pivot** (`tag: 'pivot'`) — The score matters. If trailing, the narration is desperate. If dominant, the leader cruises. Acknowledges stakes.
- **Climax** (`tag: 'climax'`) — Everything rides on this. If 1-1, sudden death energy. If 2-0, fighting for dignity. Maximum intensity.

### Narration format

Each variant is 2-3 short paragraphs. Example — Fire-Making, climax, winClose:

> *Both fires are flickering — neither has caught fully. ${winnerName} cups ${prW.pos} hands around the base, feeding it oxygen. The kindling catches.*
>
> *${loserName}'s flame surges for a second — then dies. ${prL.Sub} scramble${prL.sub==='they'?'':'s'} for more tinder but it's too late.*
>
> *${winnerName}'s fire licks the rope. One strand snaps. Then another. The flag drops.*

### Outcome categories (same 4 as current, per phase)

- **winDom** (margin >= 2.5) — Dominant victory. Winner is clearly superior.
- **winClose** (margin < 2.5) — Tight win. Both gave everything.
- **loseCollapse** (margin >= 2.5) — Loser fell apart. Pressure crushed them. (Mirror of winDom from the loser's POV.)
- **loseHard** (margin < 2.5) — Loser fought well but wasn't enough. (Mirror of winClose from the loser's POV.)

Narration selection: pick one winner line + one loser line, concatenate. This gives 2 paragraphs minimum per phase. For climax phases, a third "moment" paragraph fires from a shared dramatic finisher pool.

4+ text variants per outcome per phase = minimum 48 narration strings per challenge (3 phases x 4 outcomes x 4 variants).

### Score-aware host commentary

Host lines between phases react to the running score:

- `after1.leading`: "One round in and ${leader} is looking SHARP. ${trailer} needs to respond RIGHT NOW."
- `after1.trailing`: "${trailer} is on the ropes. One more and it's done."
- `after2.matchPoint`: "${leader} wins this next one and it's OVER."
- `after2.tied`: "We are TIED one apiece. This is EVERYTHING right here."
- `closer.comeback`: "WHAT a comeback! Down 0-1 and ${winner} claws all the way back!"
- `closer.sweep`: "Three for three. That is TOTAL DOMINATION."
- `closer.close`: "By the THINNEST of margins. ${winner} survives to fight another day."
- `closer.dominant`: "${winner} made that look EASY. Wow."

4+ variants per host slot.

### Bond modifiers

Existing bond-aware suffixes (hatred, tension, respect, friendship) continue to append at 55% rate on top of challenge-specific narration. No changes needed.

## Breathing Moments

Between each phase (after host commentary), exactly 1 breathing moment fires. These are character-driven beats with **real gameplay consequences**.

### Strategic moments (archetype/stat gated)

| Event | Requirement | Effect | Narration |
|---|---|---|---|
| **Psych-Out** | villain/schemer/mastermind OR strategic >= 7 | `addBond(a, b, -1)`, target gets -0.3 momentum | Trash talk or intimidation stare |
| **Self-Talk** | boldness >= 6 | Mental state -> `obsessed` (+0.5 bonus) | Player hypes themselves up |
| **Read the Opponent** | intuition >= 6 | +0.5 momentum next phase | Player studies opponent's technique |

### Social moments (bond/emotion driven)

| Event | Requirement | Effect | Narration |
|---|---|---|---|
| **Respectful Nod** | bond >= 1 | `addBond(a, b, +1)` | Competitors acknowledge each other |
| **Sideline Encouragement** | 3+ RI residents | `addBond(spectator, competitor, +1)`, +0.3 momentum | Spectator shouts support |
| **Breakdown Moment** | losing AND temperament <= 4 | Mental state -> `broken` (-0.5 bonus) | Tears, frustration, visible cracking |
| **Grudge Flare** | bond <= -3 | `addBond(a, b, -1)`, both +0.3 momentum | Enemies fuel each other's fire |

### Neutral moments (environmental)

| Event | Requirement | Effect | Narration |
|---|---|---|---|
| **Equipment Trouble** | random ~15% | -0.5 momentum | Gear malfunction, slippery hands, station issue |
| **Second Wind** | trailing AND (loyalty >= 6 OR endurance >= 7) | Mental state -> `focused`, clears `broken` | Losing player digs deep |
| **Crowd Energy** | random ~20% | Both +0.2 momentum | Host or moment electrifies both players |

### Breathing moment rules

- Exactly 1 breathing moment per gap (2 per duel total)
- Each has `players[]` array + `badgeText` + `badgeClass` for camp event injection
- Each has challenge-themed narration text (equipment trouble in fire-making = flint slips; in puzzle = piece jams)
- Archetype/stat gating ensures personality drives what happens
- Stored in duel result data so VP can render them

## Data Shape

The duel result object:

```javascript
{
  challenge: { id, name, desc, primary, secondary },
  phases: [
    {
      name: 'The Spark', tag: 'opening',
      scores: { playerA: 7.2, playerB: 5.8 },
      winner: 'playerA', margin: 1.4,
      narration: '...(multi-beat)...',
    },
    // ...phase 2, phase 3
  ],
  breathingMoments: [
    { type: 'psych-out', player: 'A', target: 'B', text: '...', bondDelta: -1, momentumDelta: -0.3 },
    { type: 'second-wind', player: 'B', text: '...', mentalShift: 'focused' },
  ],
  host: { opener: '...', after1: '...', after2: '...', closer: '...' },
  winner, loser, survivors,
  isThreeWay, duelists,
  tiebreaker,
  streakData, preStreakData,
}
```

This replaces the current `exchanges` array. The `phases` array serves the same role but with richer data.

## VP Screen Layout

Click-to-reveal sequence (each is 1 step):

1. Arena header + VS faceoff + pre-duel tension cards (visible immediately)
2. Host opener (challenge-specific)
3. Phase 1 card — phase name, multi-beat narration, winner tag, margin, running score
4. Host commentary (score-aware)
5. Breathing moment card (dashed border, amber glow, consequence badge)
6. Phase 2 card
7. Host commentary (escalated)
8. Breathing moment card
9. Phase 3 card (climax intensity)
10. Tiebreaker (if needed)
11. Host closer (score-aware: comeback/sweep/close/dominant)
12. Result cards (survives/eliminated)

Total steps: 10-12 depending on tiebreaker.

Breathing moment cards are visually distinct:
- Dashed border, amber/warm glow background
- Player portrait(s) + event type badge
- Consequence tag (e.g. "BOND -1", "MOMENTUM +0.5", "MENTAL: BROKEN")

## Files Changed

### `rescue-island.js`
- **Remove**: `RI_DUEL_CHALLENGES`, `STAT_PAIR_NAMES`, `_generateExchange`, `_generateUniqueExchanges`, `_pickNarrationStyle`, `_exchangeNarration` (entire narration block)
- **Add**: `DUEL_CHALLENGE_BANK` — array of 18 challenge objects with phases, narration pools, host pools
- **Add**: `_phaseNarration(challenge, phaseTag, winnerName, loserName, margin, bond)` — multi-beat challenge-specific narration
- **Add**: `_hostLine(challenge, slot, context)` — score-aware host commentary
- **Add**: `_pickBreathingMoment(duelists, riList, phaseIdx, score)` — selects and applies a breathing moment
- **Modify**: `_runExchanges` -> `_runPhases` — uses challenge-defined stats, fires breathing moments between phases, passes phase tag to narration
- **Modify**: `simulateRIDuel` — picks challenge from bank, builds richer result object with `challenge`, `phases`, `breathingMoments`, `host`

### `vp-screens.js`
- **Modify**: `rpBuildRIDuel` — render phase names instead of "Exchange N", multi-beat narration, breathing moment cards between phases, score-aware host lines
- **Remove**: `_riExchangeIcon` lookup (replace with challenge-aware icon)
- **Adjust**: click-to-reveal step count for breathing moments (10-12 steps)

### `text-backlog.js`
- **Modify**: RI duel text generation to include phase names, multi-beat narration, breathing moments, host commentary

## What Stays the Same

- Momentum system, mental states, training bonuses (existing infrastructure)
- Bond modifier suffixes (55% append rate)
- Tiebreaker system (random stat, sudden death)
- Pre-duel social events (life on island)
- Post-duel reaction events
- Win streak tracking + `preStreakData` spoiler fix
- 3-way duel support
- Reentry duel (5-phase) — uses same challenge bank but picks a different challenge. 5 phases cycle through `opening, pivot, climax, pivot, climax` tags for narration. 4 breathing moments fire between phases.
- VP shell, CSS, embers, torch animations
- `_resolveExchanges` logic (now `_resolvePhases`, same algorithm)

## Narration Volume Estimate

Per challenge:
- 3 phases x 4 outcomes x 4 variants = 48 narration strings (each 2-3 paragraphs)
- Host: opener(4) + after1(8) + after2(12) + closer(12) = 36 host strings
- Breathing moment text: 10 event types x 4 variants = 40 strings (shared across challenges but with challenge-specific flavor for equipment trouble)

Total: ~84 unique strings per challenge. 18 challenges = ~1,512 narration strings.

Host commentary and breathing moments can be partially shared across challenges (only equipment trouble needs per-challenge flavor). Realistic unique text: ~900-1000 strings.
