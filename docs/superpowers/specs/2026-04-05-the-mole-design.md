# The Mole — Design Spec

**Date:** 2026-04-05
**Status:** Approved
**Type:** Season-level twist (not an archetype)

---

## Overview

A secret saboteur twist. One or two players are assigned as Moles by production (random or user-chosen). They play the regular game but secretly sabotage challenges, leak info, disrupt votes, and stir conflict — all while trying to stay hidden. High-intuition players accumulate suspicion and can eventually expose the Mole, triggering a dramatic fallout. The Mole can be voted out normally at any time.

---

## Config

| Setting | Key | Values |
|---------|-----|--------|
| The Mole | `cfg-mole` | `'disabled'` (default), `'1-random'`, `'2-random'`, `'choose'` |
| Mole Player(s) | `cfg-molePlayers` | Player multi-select (up to 2), only shown when `'choose'` |
| Coordination | `cfg-mole-coordination` | `'independent'` (default), `'coordinated'` — only shown when 2 Moles |

Stored in `seasonConfig.mole`, `seasonConfig.molePlayers`, `seasonConfig.moleCoordination`.

---

## Assignment

- Fires in `initGame()` after cast is finalized.
- `'1-random'` / `'2-random'`: truly random selection, no stat bias. Any archetype can be picked.
- `'choose'`: uses `seasonConfig.molePlayers` array.
- The Mole's archetype stays unchanged — a loyal-soldier Mole is a loyal-soldier who happens to be The Mole.

### State

```
gs.moles = [
  {
    player: 'Name',
    exposed: false,
    exposedEp: null,
    exposedBy: null,
    suspicion: {},          // { observerName: float }
    sabotageCount: 0,
    sabotageLog: [],        // [{ ep, type, details }]
    leaks: [],              // [{ ep, leakedTo, info }]
    layingLow: false,       // true when heat >= 3
    resistance: 0.5         // stealth multiplier, erodes with sabotage
  }
]
```

`gs.moles` added to `SET_FIELDS` if any Set types are used (currently all primitives, so no action needed unless Sets are added later).

---

## Coordination Modes

### Independent (default)
- Moles don't know about each other.
- Can accidentally sabotage each other (leak each other's info, throw a challenge that hurts the other).
- One Mole's exposure doesn't affect the other's suspicion.

### Coordinated
- Moles know each other's identity.
- Bond floor: bond between them can't drop below **+3** (secret alliance).
- They avoid sabotaging each other's plans — engine skips sabotage actions that would directly harm the other Mole.
- **Joint sabotage:** coordinated Moles can execute combined actions (e.g., synchronized info leak, double vote disruption). Joint actions are more impactful but generate **1.5x suspicion** (two people acting in sync is more suspicious).
- If one is exposed, the other gets a **+0.8 suspicion spike** with all players who witnessed the exposure (association risk), but is NOT auto-revealed.

---

## Stealth System

### Detection Resistance
- Base resistance: **0.5x** (suspicion gains are halved).
- Erodes with sabotage: `resistance = Math.max(0.15, 0.5 - sabotageCount * 0.03)`.
- After ~12 sabotage acts, resistance is near minimum (0.14).
- Post-exposure: resistance set to **1.0** (no stealth bonus).

### Laying Low Heat Decay
- When `computeHeat(mole) >= 3`: Mole skips all sabotage for the episode, `layingLow = true`.
- While laying low: heat decays at **1.5x normal rate**.
- Mole-specific "laying low" camp events fire instead (buddy-buddy bonding, being helpful, deflecting with charm).
- Heat threshold is checked at start of the sabotage phase — once committed to laying low, no sabotage that episode.

---

## Sabotage Actions

All gated by: `computeHeat(mole) < 3` (not laying low) AND Mole is not exposed.

Each action rolls independently per episode. Each successful sabotage increments `sabotageCount` and logs to `sabotageLog`.

### 1. Challenge Throws (pre-merge only)
- **Probability:** 30% per tribe challenge
- **Effect:** Mole's stat contribution reduced by 40%
- **Bypasses** normal challenge throw gates (heat >= 2, strategic reasoning) — the Mole throws because they're told to, not because it's strategic
- **Detection:** Existing throw detection (`intuition * 0.015` from tribemates), modified by Mole's stealth resistance

### 2. Info Leaks
- **Probability:** 25% per episode
- **Gate:** Mole must be in an alliance with actionable intel (vote target, idol knowledge)
- **Effect:** Target of the leak gains knowledge — feeds into `computeHeat` targeting adjustments. Bond +0.3 between Mole and leak recipient ("helpful" relationship building).
- **Trail:** Logged to `gs.moles[].leaks[]` for exposure system.

### 3. Vote Disruption
- **Probability:** 20% per tribal attended
- **Effect:** One of:
  - Mole votes off-plan (against alliance consensus) — rogue vote
  - Mole whispers bad targeting info to 1 voter, flipping their vote (corrupted vote pitch)
- **Consequence:** Can cause vote splits, miscommunications, wrong-target eliminations.

### 4. Advantage Sabotage
- **Probability:** 35% per episode while holding an advantage
- **Gate:** Mole holds an idol or advantage in `gs.advantages`
- **Effect:** One of:
  - Plant false idol location info (feeds into existing `gs._falseInfoPlanted`)
  - Leak advantage existence to a rival (advantage becomes known)
  - Play advantage at non-critical moment (waste it)
- **Feeds into** existing false info blowup system (`checkFalseInfoBlowup`).

### 5. Bond Sabotage
- **Probability:** 20% per episode
- **Effect:** Mole picks two players with `getBond(a, b) >= 2` and creates friction.
  - Bond delta: **-0.8 to -1.5** between the two targets (proportional to Mole's social stat: `social * 0.12 + 0.5`).
  - Mole fabricates quotes, exaggerates conflicts, plays telephone.

---

## Suspicion & Detection

### Suspicion Accumulation
- Per-sabotage: nearby players (same tribe/merge group) roll for suspicion gain.
- Roll: `intuition * 0.04 * moleResistance` — high-intuition players catch more.
- Suspicion is **per-observer**: `gs.moles[].suspicion[observerName] += roll`.
- Witnessing specific evidence gives targeted bumps:
  - Saw challenge throw: +0.4 to witnesses
  - Info they leaked comes back around: +0.3 to the player who traces it
  - Vote disruption where Mole was the only one off-plan: +0.5 to alliance members
  - Bond sabotage where fabricated quote is traced: +0.3

### Exposure Trigger
- Any single player's suspicion reaches **threshold 3.0** → exposure fires.
- The exposer confronts the Mole or tells the tribe — dramatic camp event.
- Spread: exposer's social stat determines how many players hear immediately. `social * 0.15` = fraction of tribe that learns this episode. Rest learn via bond-based spread over 1-2 episodes.

### Post-Exposure Consequences
- `gs.moles[].exposed = true`, `exposedEp` and `exposedBy` set.
- Stealth resistance → **1.0** (no detection bonus).
- All held advantages become **public knowledge** (everyone knows what they have — not confiscated, but revealed).
- Heat spike: **+3.0 heat** for 2 episodes.
- Bond damage: **-1.5** with all players except their closest ally (highest bond).
- Mole stays in the game — survival mode begins.
- Camp events shift from sabotage to survival narratives.

---

## Camp Events Library

Each category needs 3-5 narrative variants. All events MUST have gameplay consequences (bond changes, state changes, suspicion changes).

### Sabotage Events (pre-exposure)

**Challenge Throw:**
- "Just didn't have it today" — sandbagging with a straight face
- Deliberate fumble disguised as exhaustion
- Suspiciously poor performance from someone who should dominate
- "Helped" the wrong part of the challenge, slowing the tribe

**Info Leak:**
- Innocent campfire chat that's actually intelligence extraction
- Slipping info during reward or downtime
- Whispering to the "wrong person" — oops, or was it?
- Bonding session that becomes a confession extraction

**Vote Disruption:**
- Planting seeds of doubt about the consensus target
- "I heard they're coming for you" — misdirection whisper
- Suggesting a split vote that benefits the wrong side
- Last-minute name drop that fractures the plan

**Bond Sabotage:**
- Fabricating a quote: "You know what [X] said about you?"
- Exaggerating a minor disagreement into a feud
- Playing telephone — twisting words as they pass through
- Strategic empathy: "I'm worried about you, [X] has been talking..."

**Advantage Sabotage:**
- "Accidentally" flashing an idol during a conversation
- Feeding false idol location to a rival
- Wasting an advantage play on a safe vote
- Planting wrong info about advantage rules

### Laying Low Events (heat >= 3)
- Buddy-buddy bonding: being extra helpful, carrying firewood, cooking
- Deflecting with charm: making everyone laugh, changing the subject
- Playing the loyal ally: checking in with alliance, affirming commitments
- Strategic invisibility: avoiding strategic conversations entirely

### Post-Exposure Survival Events
- Scrambling: trying to build new alliances from scratch
- Denial: "I was playing the game just like everyone else"
- Playing victim: "Production put me up to this, I had no choice"
- Attempting to flip the narrative: "At least I was honest about being strategic"
- Desperation pitch: offering information/advantages for safety

---

## VP Integration

### Badges
- **MOLE** (dark purple) — on all sabotage events. Viewer-only context (in-fiction, players don't see this label).
- **LAYING LOW** (muted gray) — on laying low events.
- **EXPOSED** (red) — on the exposure moment and all post-exposure events.
- **JOINT SABOTAGE** (dark purple, double icon) — coordinated Mole actions.

### Camp Overview Additions
- **Mole Suspicion Meter** — viewer-only section showing per-player suspicion levels toward each Mole. Hidden scoreboard feel. Only appears when Mole twist is active.
- After exposure: suspicion section replaced with "MOLE EXPOSED" banner and heat tracker.

### Sabotage Events in Camp Screens
- Mole sabotage events render in the normal camp events flow with MOLE badge.
- Two-player events (bond sabotage, info leak) get duo portrait treatment.
- Challenge throws appear in the challenge screen as a subtle note (viewer-only).

---

## Engine Integration Points

| System | Integration |
|--------|-------------|
| `initGame()` | Assignment, `gs.moles` initialization |
| `simulateTribeChallenge()` | Challenge throw injection (pre-merge) |
| `generateCampEventsForGroup()` | Mole camp events (sabotage, laying low, post-exposure) |
| `simulateVotes()` | Vote disruption (rogue vote, corrupted pitch) |
| `computeHeat()` | Laying low heat decay 1.5x, post-exposure +3.0 spike |
| `checkIdolPlays()` / `checkNonIdolAdvantageUse()` | Advantage sabotage (waste play, false info plant) |
| `addBond()` | Bond sabotage delta injection |
| `rpBuildCampTribe()` | MOLE / EXPOSED badge rendering |
| `rpBuildRelationships()` | Suspicion meter (viewer-only) |
| `prepGsForSave()` / `repairGsSets()` | Serialize `gs.moles` array |
| `patchEpisodeHistory()` | Save Mole state to episode snapshot |

---

## Scope Notes

- The Mole is a **twist**, not an archetype. The player's original archetype drives their stats, personality, and non-Mole behavior.
- Mole sabotage is **probabilistic** — they don't act every episode, and laying low is a deliberate choice driven by heat.
- Post-exposure, the Mole plays a normal game with massive disadvantages — no special elimination or immunity.
- Mole eliminated via normal vote → goes to jury/RI like anyone else. No special exit.
- If Mole is eliminated before exposure, the twist is never revealed to other players (but VP shows it to the viewer).
