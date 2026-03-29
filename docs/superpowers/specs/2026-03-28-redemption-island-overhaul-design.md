# Redemption Island (Duels) Overhaul — Design Spec

**Date:** 2026-03-28
**Status:** Approved
**Sub-project:** 1 of 3 (Redemption Island → Rescue Island → Config UI)
**Replaces:** Current 2nd Chance Isle system (bare-minimum duels, no life events, thin VP)

---

## Overview

Redemption Island is the duel format: when voted out, players go to RI instead of going home. When a new player arrives, they duel the current resident. Loser goes home permanently. Winner stays. At configurable return points, the surviving RI player re-enters the game. Between duels, RI has its own mini-narrative — pre-duel tension, processing the vote, sizing up the opponent.

## Key Differences from Rescue Island (Sub-project 2)

| | Redemption Island (this spec) | Rescue Island (future) |
|---|---|---|
| Format | 1v1 duels on arrival | All eliminees coexist |
| Elimination from RI | Lose a duel → gone permanently | Only at return challenge |
| Quit option | No (you duel or you don't) | Yes (raise the sail) |
| Max residents | 1 (winner stays until next arrival) | Unlimited |
| Losers at return | Gone permanently | Join jury |
| Social game | Minimal (only 1-2 people at a time) | Full (multiple residents) |
| Tone | Gladiatorial, intense | Endurance, psychological |

## Config

Existing settings kept, clarified:
- `cfg.ri` — boolean, enable Redemption Island
- `cfg.riReentryAt` — active player count that triggers first return (default: merge point)
- NEW: `cfg.riReturnPoints` — 1 or 2 (default: 1). If 2, second return fires at F5.
- NEW: `cfg.riSecondReturnAt` — active player count for second return (default: 5)

## Episode Flow (RI Active)

### When a player is voted out:
1. `simulateRIChoice(name)` — player decides to go to RI or go home
   - **Current:** random coin flip based on physical+strategic
   - **New:** personality-driven decision with more variance:
     - Bold 7+ or physical 7+: always goes to RI (fighters)
     - Strategic 7+: goes to RI if they think they can win (~80%)
     - Loyalty 7+ with strong bonds in main game: goes to RI (wants back for allies)
     - Low boldness (<= 3) + low physical (<= 4): may go home (~40% chance)
     - Desperate emotional state: always goes to RI (nothing to lose)
   - VP shows the choice moment: portrait + "REDEMPTION ISLAND" or "WENT HOME" badge

### When RI has 2+ players (duel fires):
1. Duel between the existing resident and the new arrival
2. Challenge type randomly selected from a pool (not just physical):
   - Fire-making (endurance + physical)
   - Speed puzzle (mental + strategic)
   - Endurance hold (endurance + temperament)
   - Precision toss (physical + mental)
   - Balance beam (endurance + temperament + mental)
   - Memory challenge (mental + intuition)
3. Winner stays on RI, loser goes home permanently
4. If loser was post-merge: they join the jury (they experienced enough game to judge)
   Pre-merge losers: gone entirely

### RI Life Events (between duels):
Each episode where RI has a resident, generate 1-2 events:

**Solo events (1 resident):**
- Processing the vote: "{name} replays tribal in {pr.pos} head. The name {pr.sub} trusted most wrote {pr.pos} name."
- Training: "{name} spends the day running the beach, building fire, lifting rocks. Whatever comes next, {pr.sub}'ll be ready."
- Reflection: "{name} sits alone watching the sunset. The game feels very far away — and very close."
- Motivation: "{name} carves a mark in the shelter wall. One for each day survived. The marks are adding up."

**Pre-duel events (2 residents, new arrival):**
- Sizing up: "{resident} watches {arrival} walk onto the beach. {pr.Sub} know{pr.sub==='they'?'':'s'} what this means."
- History: "{resident} and {arrival} were on the same tribe. The awkwardness is thick."
- Enemy arrives: "{arrival} is the person who orchestrated {resident}'s elimination. This duel is personal." (if bond <= -2)
- Ally arrives: "{resident} sees {arrival} and the relief is visible. Then the reality hits — one of them is going home." (if bond >= 3)
- Trash talk: "{arrival} tells {resident} exactly how this is going to go. {resident} says nothing. Just stares." (bold 7+ arrival)

**Post-duel events (after duel resolves):**
- Winner relief: "{winner} watches {loser} leave. {pr.Sub} sit{pr.sub==='they'?'':'s'} down on the beach. Still here."
- Winner hardened: "{winner} has survived {duelCount} duels now. The fire in {pr.pos} eyes is different."
- Loser exit (graceful): "{loser} shakes {winner}'s hand. 'You earned it.' Then {pr.sub} walk{pr.sub==='they'?'':'s'} away."
- Loser exit (bitter): "{loser} doesn't look back. The game took everything and gave nothing."
- Loser exit (emotional): "{loser} breaks down. Not because of the duel — because it's really over now."

### Return Challenge:
When active players drop to `riReentryAt`:
1. All RI residents compete (usually just 1, but could be 2 if timing aligns)
2. Challenge uses the same varied pool as duels
3. Winner re-enters the game, joins smallest tribe (pre-merge) or merged tribe
4. Re-entry camp event: tribe reacts to the returnee
   - Allies celebrate (+1.0 bond with former allies)
   - Enemies worry (-0.5 bond with people who voted them out)
   - Neutral players assess the threat
5. Returnee gets softened bonds (time on RI shifts perspective): extreme negative bonds move toward -1

### Second Return (if configured):
At `riSecondReturnAt` (default F5):
- Same process — RI resident(s) compete
- Winner re-enters at a critical moment (late game)
- Post-merge returnees who lose: join jury

## Duel Challenge Pool

```js
const RI_DUEL_CHALLENGES = [
  { id: 'fire-making', name: 'Fire-Making', desc: 'First to build a sustainable fire wins.',
    stat: s => s.endurance * 0.5 + s.physical * 0.4 + s.temperament * 0.1 },
  { id: 'speed-puzzle', name: 'Speed Puzzle', desc: 'First to complete a slide puzzle wins.',
    stat: s => s.mental * 0.6 + s.strategic * 0.3 + s.temperament * 0.1 },
  { id: 'endurance-hold', name: 'Endurance Hold', desc: 'Hold position as long as possible. Last one standing wins.',
    stat: s => s.endurance * 0.6 + s.physical * 0.2 + s.temperament * 0.2 },
  { id: 'precision-toss', name: 'Precision Toss', desc: 'Toss rings onto a series of posts. Most accuracy wins.',
    stat: s => s.physical * 0.4 + s.mental * 0.3 + s.temperament * 0.3 },
  { id: 'balance-beam', name: 'Balance Beam', desc: 'Navigate a narrow beam while carrying a stack of blocks.',
    stat: s => s.endurance * 0.3 + s.temperament * 0.4 + s.mental * 0.3 },
  { id: 'memory', name: 'Memory Challenge', desc: 'Memorize a sequence and recreate it. Precision under pressure.',
    stat: s => s.mental * 0.5 + s.intuition * 0.3 + s.temperament * 0.2 },
];
```

## VP Screens

### RI Choice Screen (after elimination)
- Eliminated player's portrait
- Decision moment: "{name} has a choice. Redemption Island — or home."
- Result: "REDEMPTION ISLAND" gold badge or "WENT HOME" grey badge
- Brief text based on personality

### RI Life Screen (per episode with a resident)
- Dark, isolated theme — different from main game camps
- Resident portrait with "Day X on Redemption Island" counter
- 1-2 life events with badges
- If new arrival this episode: pre-duel tension event

### RI Duel Screen (when 2+ residents)
- Face-off layout (like Second Life showdown): both portraits, VS divider
- Challenge type + description
- Suspense narration (2-3 scenes, varied by challenge type — reuse the Second Life narration pattern)
- Result: winner "STAYS" green badge, loser "ELIMINATED" red badge + exit scene
- Loser gets a torch snuff moment

### RI Return Screen (at return point)
- Dramatic reveal: "From Redemption Island..."
- Returnee portrait with "RETURNS TO THE GAME" gold badge
- Tribe reaction events
- Bond shift summary

## Engine State

```js
gs.riPlayers = []           // names of players currently on RI (existing)
gs.riDuelHistory = []       // [{ ep, resident, arrival, winner, loser, challengeType }]
gs.riLifeEvents = {}        // { [name]: [{ ep, text, type }] } — accumulated RI life events
gs.riReturnCount = 0        // how many returns have happened (0, 1, or 2)
```

## Episode History Save

```js
riDuel: ep.riDuel || null,          // { winner, loser, challengeLabel, ... } (exists, needs enrichment)
riChoice: ep.riChoice || null,      // 'REDEMPTION ISLAND' | 'WENT HOME' (exists)
riLifeEvents: ep.riLifeEvents || [],// life events this episode
riReentry: ep.riReentry || null,    // { winner, losers, challengeType } (exists, needs enrichment)
```

## Priority

HIGH — the system exists but is broken. Every piece partially works but nothing connects properly. This overhaul makes RI feel like a real parallel track, not an afterthought.
