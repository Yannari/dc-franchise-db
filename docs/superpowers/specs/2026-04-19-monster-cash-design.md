# Monster Cash — Challenge Design Spec

**Date:** 2026-04-19
**Type:** Twist challenge (pre-merge + post-merge)
**Twist ID:** `monster-cash`
**Based on:** TDA S2E1 "Monster Cash"
**Structure:** Reskinned slasher-night with monster movie identity, escalating monster, film lot event pool

---

## Core Concept

Chef controls a mechanical animatronic monster that prowls an abandoned film lot, capturing contestants one by one. Players are *inside* the monster movie — destroyed city blocks, emergency broadcasts, rubble, sirens, the monster looming overhead. The monster starts clumsy and escalates to an unstoppable force by the final rounds. Last person standing wins.

---

## Phase Variants

### Pre-Merge (Tribe Immunity)

All players from all tribes run together on the film lot. Tribes are scored by the **average capture round** of their members (later capture = better score). Tribe with the best average wins immunity. Losing tribe goes to tribal council.

- `ep.isMonsterCash = true`
- Normal tribal flow (no `ep.noTribal`)
- Winner: tribe with highest average survival round
- If only one tribe has uncaptured members at the end, that tribe wins automatically
- Uneven tribes: average capture round normalizes for tribe size (no raw-sum advantage)

### Post-Merge (Individual)

Last person standing wins individual immunity. Lowest overall scorer is auto-eliminated — no tribal council.

- `ep.isMonsterCash = true`, `ep.noTribal = true`
- Final showdown between last 2 survivors (same pattern as slasher)
- Lowest scorer eliminated directly

---

## Monster Escalation System

The monster has a **threat level** (1–5) that increases proportionally across rounds. Round count scales with player count (like slasher).

| Level | Name | Behavior | Gameplay Effect |
|-------|------|----------|-----------------|
| 1 | Awakening | Clumsy, stumbling through props, breaks set pieces accidentally | Low catch rate. Bold moves rewarded: +3 bonus for risk events |
| 2 | Prowling | Getting its bearings, methodical searching | Moderate catch rate. Risk bonus drops to +1 |
| 3 | Rampaging | Fast, aggressive, knocking down buildings | High catch rate. Hiding bonuses doubled |
| 4 | Unstoppable | Shaking the ground, destroying cover | Very high catch rate. Hiding spots destroyed mid-round (event injected) |
| 5 | Final Form | Full Godzilla mode, nowhere left to hide | Guaranteed catch of lowest scorer. Only the best survive |

Threat level mapping: `threatLevel = Math.ceil((roundIndex + 1) / totalRounds * 5)`, clamped 1–5.

---

## Event Pool (Film Lot Themed)

All events carry point values and are selected per-player per-round based on stats, archetype, and threat level.

### Positive Events (+points)

| Event ID | Name | Points | Stat Driver | Description |
|----------|------|--------|-------------|-------------|
| `duck-behind-props` | Duck Behind Prop Building | +2 to +3 | mental | Use fake buildings as cover |
| `climb-scaffolding` | Climb Set Scaffolding | +2 to +4 | physical, endurance | Get high ground to spot the monster |
| `pyro-distraction` | Pyrotechnics Distraction | +3 | boldness | Set off film explosives to redirect the monster |
| `rally-survivors` | Rally Survivors | +2 | social | Organize a group to move together |
| `read-pattern` | Read Monster's Pattern | +3 | strategic, intuition | Predict where it's heading next |
| `sprint-back-lot` | Sprint Through Back Lot | +2 | physical | Raw speed escape through the lot |
| `guard-ally` | Guard an Ally | +2 | loyalty | Shield someone from being spotted. Bond boost. Heat reduction (-1.0) |
| `sacrifice-cover` | Sacrifice Hiding Spot | +3 | loyalty | Give up your cover for someone more vulnerable. Major bond boost. Heat reduction (-1.5) |

### Negative Events (-points / sabotage)

| Event ID | Name | Points | Stat Driver | Description |
|----------|------|--------|-------------|-------------|
| `lure-monster` | Lure Monster Toward Rival | -1 self | strategic, boldness | Direct sabotage. Applies catch boost to target. Heat +1.5 |
| `trip-someone` | Trip Someone While Running | -2 to victim | physical | Desperation move. Heat +1.5 |
| `use-decoy` | Use Someone as Decoy | -1 self | strategic | Hide behind another player. Cowardice heat +2.0 |
| `shove-from-cover` | Shove Someone Out of Cover | -2 to victim | physical, boldness | Take their hiding spot. Major heat +2.0 |
| `panic-freeze` | Panic Freeze | -2 self | temperament (low) | Stats fail, can't move. No heat (self-inflicted) |
| `debris-hit` | Knocked Over by Debris | -1 self | — (luck) | Environmental bad luck, monster destroys nearby structure |
| `cover-destroyed` | Monster Destroys Your Cover | -1 self | — (threat level >= 4) | Hiding spot removed mid-round. Only at high threat levels |

### Archetype Enforcement

- **Villain archetypes** (villain, mastermind, schemer): Full access to all sabotage events
- **Nice archetypes** (hero, loyal-soldier, social-butterfly, showmancer, underdog, goat): NEVER sabotage. Get guard-ally, sacrifice-cover, rally-survivors instead
- **Neutral archetypes** (hothead, challenge-beast, wildcard, chaos-agent, floater, perceptive-player): Sabotage only with strategic >= 6 AND loyalty <= 4

### Event Selection Logic

Each player picks 1–2 events per round. Selection weighted by:
- Stat alignment (high physical → more sprint/climb events)
- Threat level (higher threat → more hiding events, fewer bold moves)
- Archetype (enforced restrictions above)
- Bond targets (sabotage targets enemies, guard targets allies)

---

## Capture Mechanic

### Per-Round Catch Resolution

1. Calculate **catch score** per surviving player: `catchScore = baseCatchRate(threatLevel) - playerRoundScore - survivalBonuses + catchBoosts`
2. Player with highest catch score is captured
3. Ties broken by: most negative events > fewer positive events > random
4. Captured player deposited into bounce house (narrative)

### Base Catch Rates by Threat Level

| Threat | Base Rate |
|--------|-----------|
| 1 | 0.15 |
| 2 | 0.30 |
| 3 | 0.50 |
| 4 | 0.70 |
| 5 | 1.00 (guaranteed lowest scorer caught) |

### Rescue Mechanic

High-loyalty allies (loyalty >= 7, bond >= 4 with caught player) can attempt rescue:
- Success chance: `loyalty * 0.1 + bond * 0.05`
- Success: caught player freed, rescuer takes -2 point penalty
- Rescue **disabled at threat level 5** — the monster is too powerful
- Max 1 rescue attempt per round

### Survival Bonus

+2 points to all uncaught players each round (same as slasher).

### Final Showdown (Post-Merge Only)

Last 2 survivors compete in a final showdown. Weighted by cumulative score + physical/mental/endurance stats. Winner gets immunity. Loser is NOT auto-eliminated — only the lowest overall scorer across all rounds is eliminated.

---

## Film Lot Locations

Rotate each round. Affect available events and narrative flavor.

| Location | Event Modifiers |
|----------|----------------|
| Stage 5 — Monster Movie Set | Prop buildings available, scaffolding climbable |
| Back Lot — Outdoor Streets | Sprint bonuses, open ground (less cover) |
| Prop Warehouse | Best hiding, but monster can collapse shelves |
| Main Street Set | Pyrotechnics available, fake storefronts |
| Craft Services Tent | Food-related comedy beats, debris from tables |
| Parking Structure | Multi-level, climb bonuses, echo detection risk |

---

## Heat Tracking

State key: `gs._monsterCashHeat`

Structure: `{ [victimName]: { target, amount, expiresEp } }`

| Event | Heat Amount | Expires |
|-------|------------|---------|
| Lure monster toward rival | +1.5 | ep + 2 |
| Trip someone | +1.5 | ep + 2 |
| Use decoy | +2.0 | ep + 2 |
| Shove from cover | +2.0 | ep + 2 |
| Guard ally | -1.0 (reduction) | immediate |
| Sacrifice hiding spot | -1.5 (reduction) | immediate |

Heat flows into `computeHeat` for targeting in future episodes.

---

## Capture Animations (Escalating with Threat Level)

### Anti-Reuse Clause
Monster Cash capture animations must NOT reuse slasher's VHS static/signal-lost aesthetic. The identity is monster movie destruction, not horror VHS.

### Threat 1–2: Comedic Captures

- Monster bumbles into player, stumbles over props
- Player does exaggerated cartoon stumble/trip
- Monster awkwardly scoops them up, almost drops them
- Deposited into bounce house with a comedic bounce
- Portrait gets a wobbly, hand-stamped "CAPTURED" mark
- Mild screen wobble, dust puff particles
- Optional: player yells a one-liner

### Threat 3: Tense Captures

- Monster shadow grows over the player's portrait from below
- Ground-shake animation, debris falls
- Monster grabs player — firm, deliberate
- Player dragged off-screen with skid marks
- Portrait cracks (single fracture line)
- Emergency broadcast ticker scrolls across bottom
- Moderate screen shake, smoke particles increase

### Threat 4–5: Terrifying Captures

- Full VP screen takeover — city destruction fills background
- Dramatic slow-motion claw reaching down
- Sirens blare, emergency broadcast interrupts the VP feed
- Screen goes to brief static burst
- Portrait shatters like glass (fragment animation)
- "CAPTURED" slams down with impact tremor effect
- Screen cracks spread across the VP shell
- Rubble particles rain down
- At threat 5: building collapse animation behind the capture

### Animation Implementation

All capture animations use CSS keyframes + JS-triggered class additions (no external libraries). Key classes:
- `.monster-capture-comedy` — wobble + bounce
- `.monster-capture-tense` — shadow grow + crack
- `.monster-capture-terror` — full takeover + shatter
- `.monster-screen-shake` — viewport shake at varying intensities
- `.monster-rubble-rain` — falling debris particles
- `.monster-emergency-ticker` — scrolling broadcast bar

---

## VP Theme — Inside the Monster Movie

### Shell

- **Border:** Destroyed cityscape silhouette. Buildings progressively crumble as rounds advance.
- **Background:** Dark sky with smoke/dust particle layer. Monster silhouette grows larger in the background each round (starts distant, ends filling the sky).
- **Bottom bar:** Emergency broadcast ticker — scrolling alerts ("MONSTER SIGHTED IN SECTOR 7", "ALL CONTESTANTS PROCEED TO SHELTER", "THIS IS NOT A DRILL").
- **Rubble pile:** Captured player portraits (small, X'd out) accumulate in a growing rubble pile at the bottom corner.

### Screens

| Screen | Content |
|--------|---------|
| `rpBuildMonsterCashTitleCard` | "NOW PLAYING" film reel intro, scratched film overlay, retro monster movie title font, Chris as director intro |
| `rpBuildMonsterCashRounds` | Per-round event cards with location labels, monster threat indicator, capture sequences. Click-to-reveal per round. |
| `rpBuildMonsterCashShowdown` | Final 2 showdown (post-merge). Split screen, monster closing in, dramatic last stand. |
| `rpBuildMonsterCashImmunity` | Winner reveal — monster retreats, winner stands in rubble, spotlight. |
| `rpBuildMonsterCashElimination` | Lowest scorer revealed, walk of shame through destroyed set. |
| `rpBuildMonsterCashLeaderboard` | Final scores, capture order, MVP moments. Film credits scroll style. |

### Round Display Structure

Each round shows:
1. **Location header** — "STAGE 5 — MONSTER MOVIE SET" with set-piece art
2. **Threat level indicator** — Monster icon with level bar (fills red as threat rises)
3. **Event cards** — Player portrait + event text + point badge (green positive, red negative)
4. **Capture card** — If someone caught: full capture animation sequence (escalating per threat)
5. **Survivor count** — "X REMAIN" counter with tension styling
6. **Chris commentary** — Director megaphone style quote

### Visual Primitives (Anti-Reuse)

These are Monster Cash's unique visual elements — do NOT reuse in other challenges:
- Destroyed cityscape shell border
- Monster silhouette growth in background
- Emergency broadcast ticker
- Rubble pile body count
- Film reel title card with scratched overlay
- Escalating capture animations (comedy → terror)
- Threat level indicator bar
- Screen crack propagation
- Clapperboard snap transitions

---

## Text Backlog

`_textMonsterCash(ep, ln, sec)` in `js/chal/monster-cash.js`:

```
=== MONSTER CASH ===
Film Lot Challenge — {location rotation summary}
Monster Threat Escalation: Awakening → Prowling → Rampaging → Unstoppable → Final Form

ROUND 1 (Threat: Awakening) — {location}
  {top positive event text}
  {sabotage event if any}
  CAPTURED: {name} ({capture description})
  Chris: "{commentary}"

...repeat per round...

FINAL SHOWDOWN:
  {survivor 1} vs {survivor 2}
  Winner: {name} ({method})

CAPTURE ORDER: {first caught} → ... → {last caught}
IMMUNITY: {winner}
ELIMINATED: {name} (lowest scorer, {score})

SABOTAGE SUMMARY:
  {saboteur} → {victim}: {event} (heat: {amount})
HEROIC ACTS:
  {hero} → {ally}: {event} (bond boost)
```

---

## Integration

### Twist Registration (`js/twists.js`)

- ID: `monster-cash`
- Guard: >= 4 active players
- Pre-merge: allowed (tribe immunity mode)
- Post-merge: allowed (individual, auto-elimination)
- Mutually exclusive with: `slasher-night`, `sudden-death`, `triple-dog-dare`, `hide-and-be-sneaky`, `off-the-chain`
- Sets: `ep.isMonsterCash = true`
- Post-merge also sets: `ep.noTribal = true`

### Episode Flow (`js/episode.js`)

- If `ep.isMonsterCash`: call `simulateMonsterCash(ep)`
- Skip main `updateChalRecord` (add to skip list)
- Pre-merge: proceed to tribal with losing tribe
- Post-merge: lowest scorer auto-eliminated, skip tribal

### Challenge Registry (`js/main.js`)

Map `'monster-cash'` → `{ simulate: simulateMonsterCash, rpBuild: [all VP builders], text: _textMonsterCash }`

### Episode History Fields

```js
gs.episodeHistory.push({
  // ... standard fields ...
  monsterCash: ep.monsterCash || null,  // full challenge data
});
```

### `ep.monsterCash` Structure

```js
{
  rounds: [{ roundNum, threatLevel, location, events: [], captured: null, rescueAttempt: null, survivors: [], chrisLine }],
  scores: { [name]: totalScore },
  capturedOrder: [name, ...],
  finalShowdown: { survivor1, survivor2, winner, method },
  immunityWinner: name,
  eliminated: name,
  leaderboard: [{ name, score, capturedRound, events }],
  monsterLevels: [{ round, level, name }],
  // Overdrive fields
  filmTitle: string,
  chrisOpener: string,
  chrisCloser: string,
  actBreaks: [roundIndex, ...],
  locations: [string, ...],
}
```

---

## Popularity

| Moment | Delta |
|--------|-------|
| Guard ally | +1 |
| Sacrifice hiding spot | +2 |
| Rally survivors | +1 |
| Last person standing (winner) | +3 |
| Sabotage (any) | -1 |
| Use decoy / shove from cover | -2 |

Pattern: `if (!gs.popularity) gs.popularity = {}; gs.popularity[name] = (gs.popularity[name] || 0) + delta;`

---

## Showmance Moments

If challenge has downtime between rounds or hiding phases:
- Showmance pairs hiding together get a moment (huddle in cover, whispered reassurance)
- `_checkShowmanceChalMoment()` called per round if pair both surviving
- Guard-ally events between showmance partners get enhanced text

---

## File Structure

All simulation + VP + text backlog in a single file: `js/chal/monster-cash.js`

Follows the pattern of `js/chal/slasher-night.js`:
- Simulation function (~500-600 LOC)
- Text backlog function (~60 LOC)
- VP screen builders (~800-1000 LOC)
- Helper functions (event selection, catch targeting, animations)
