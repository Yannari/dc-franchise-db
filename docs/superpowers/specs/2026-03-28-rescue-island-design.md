# Rescue Island (Edge of Extinction) — Design Spec

**Date:** 2026-03-28
**Status:** Approved
**Sub-project:** 2 of 3 (Redemption Island ✅ → Rescue Island → Config UI)

---

## Overview

Rescue Island is the Edge of Extinction format: ALL eliminated players go to the island instead of going home. They coexist, have a full social game (processing, bonding, grudges, strategy), and can choose to quit at any time. At configurable return points, ALL residents compete in a big return challenge — winner re-enters the game, losers join the jury.

## Key Differences from Redemption Island

| | Redemption Island | Rescue Island (this spec) |
|---|---|---|
| Arrival | Duel immediately on arrival | Join the group, no duel |
| Max residents | 1-2 (duel keeps it small) | Unlimited (everyone goes) |
| Between episodes | Solo survival | Full social game with events |
| Elimination from island | Lose a duel → gone | Only at return challenge (or quit) |
| Quit option | No | Yes — dramatic "raise the sail" exit |
| Return losers | Gone permanently | Join jury |
| Social dynamics | Minimal | Rich — grudges, alliances, processing |
| Tone | Gladiatorial | Psychological endurance |

## Config

- `cfg.ri` — boolean, enable (shared with RI — the format choice determines which system)
- `cfg.riFormat` — NEW: `'redemption'` (duels) or `'rescue'` (edge). Default: `'redemption'`
- `cfg.riReentryAt` — active player count for first return (default: merge point)
- `cfg.riReturnPoints` — 1 or 2 (default: 1)
- `cfg.riSecondReturnAt` — active player count for second return (default: 5)

When `cfg.riFormat === 'rescue'`:
- No duels fire between residents
- All eliminated players automatically go to Rescue Island (no choice — they can quit later)
- Island life events fire every episode
- Return challenge is a big multi-player competition

## Episode Flow (Rescue Island Active)

### When a player is voted out:
1. Player automatically goes to Rescue Island (no `simulateRIChoice` — everyone goes)
2. Add to `gs.riPlayers`
3. VP shows arrival scene: "{name} arrives at Rescue Island. {existingCount} players are already here."
4. Bond interactions on arrival: existing residents react based on bonds
   - Former ally arrives: +0.5 bond, "relief" event
   - Enemy arrives: -0.3 bond, "tension" event
   - Stranger arrives: neutral, "assessment" event

### Rescue Island Life (every episode):
Generate 2-4 events based on how many residents there are. Event pool:

**Processing events (emotional):**
- Vote processing: "{name} replays the vote. {pr.Sub} know{pr.sub==='they'?'':'s'} exactly who wrote {pr.pos} name."
- Grief: "{name} breaks down today. Not about the game — about what the game took."
- Acceptance: "{name} has stopped replaying the vote. Something shifted. {pr.Sub} {pr.sub==='they'?'are':'is'} here now. That's all that matters."
- Motivation: "{name} wakes up before everyone else. Runs the beach. Does push-ups by the water. The return challenge is coming."
- Regret: "{name} wishes {pr.sub} had played differently. The what-ifs are louder than the waves."

**Social events (between residents):**
- Shared enemy: "{a} and {b} were both voted out by {enemy}. The conversation writes itself." (+1.5 bond)
- Unlikely bond: "{a} and {b} never spoke in the main game. Out here, they find common ground." (+1.0 bond)
- Rivalry continues: "{a} and {b} brought their beef to Rescue Island. It hasn't cooled." (-1.0 bond)
- Game talk: "{a} and {b} compare notes. The picture of who's running the game gets clearer."
- Comfort: "{a} sits with {b} after a rough night. No strategy — just presence." (+0.5 bond)
- Argument: "{a} blames {b} for how the vote went. {b} disagrees. Loudly." (-1.5 bond)
- Alliance forming: "{a} and {b} make a pact — if either wins the return challenge, they play together." (+1.0 bond, flags a post-return alliance)

**Survival events:**
- Fishing: "{name} catches enough fish for the whole island. Respect earned." (+0.3 bond with all residents, endurance-scaled)
- Shelter: "{name} builds a windbreak. Nobody asked. Everyone benefits." (+0.2 bond with all, physical-scaled)
- Struggling: "{name} is barely eating. The island is taking a physical toll." (endurance <= 4)
- Thriving: "{name} looks stronger now than when {pr.sub} left the main game." (endurance >= 7)

**Quit temptation events:**
- Considering: "{name} stares at the path off the island for a long time today."
- Trigger: low boldness (<= 3) + been on RI for 3+ episodes + emotional state is desperate
- ~15% chance per qualifying episode
- If fires: "{name} raises the sail. {pr.Sub} {pr.sub==='they'?'are':'is'} done. The island loses one more."
- Consequence: player permanently eliminated (not jury — they chose to leave)
- Camp event on main game next ep: "Word reaches camp that {name} left Rescue Island. One less person to worry about at the return challenge."

### Return Challenge:
When active players drop to return point:
1. ALL Rescue Island residents compete
2. Challenge from a large pool — endurance-heavy (the island tests endurance):
   - Endurance hold, obstacle course, fire-making, puzzle race, balance endurance, memory under pressure
3. Weighted by stats + time on island (longer = more prepared, slight bonus: +0.5 per episode on RI)
4. Winner re-enters the game
5. ALL losers join the jury (they experienced the game, they have opinions)
6. Re-entry effects:
   - Winner gets bond adjustments based on RI relationships
   - Alliances formed on RI carry into the game (flagged as `fromRI: true`)
   - Active players react: allies celebrate, enemies worry, neutral players assess
   - Winner's emotional state → confident (they earned this)

### Second Return (if configured):
- Only residents who arrived AFTER the first return compete
- Same process — winner re-enters, losers join jury
- By this point the jury is massive (which is the Edge of Extinction trade-off)

## VP Screens

### Rescue Island Arrival (after elimination)
- Dark beach theme
- Eliminated player portrait walking onto the island
- Existing residents shown (greyed slightly — they're already there)
- Arrival reaction text based on who's already there

### Rescue Island Life (per episode — dedicated screen)
- Dark atmospheric theme (isolated, harsh)
- All residents shown with "Day X" counters
- Event cards with typed badges:
  - PROCESSING (amber)
  - BONDING (green)
  - RIVALRY (red)
  - GAME TALK (gold)
  - STRUGGLING (red)
  - THRIVING (green)
  - QUIT (red, dramatic)
- Relationship web between residents (simple bond indicators)

### Return Challenge Screen
- Epic reveal: "From Rescue Island... {count} players compete for one spot back in the game."
- All competitor portraits in a grid
- Interactive placement reveal (like immunity challenge — last-to-first)
- Winner: "RETURNS TO THE GAME" gold badge, confetti
- Losers: "JOINS THE JURY" grey badge
- Winner confessional: quote about fighting back

### Re-entry Camp Reaction
- Active tribe reacts to the returnee
- Per-player reaction cards (like Cultural Reset reactions):
  - Former ally: celebration
  - Enemy: worry
  - Strategic player: assessing the threat
  - The returnee's first confessional back in the game

## Engine State

```js
// When cfg.riFormat === 'rescue':
gs.riPlayers = []              // names on Rescue Island (reused from RI)
gs.riArrivalEp = {}            // { [name]: episode number they arrived }
gs.riLifeEvents = {}           // { [name]: [{ ep, text, type }] } — accumulated (reused)
gs.riQuits = []                // names of players who quit RI
gs.riReturnCount = 0           // reused from RI
gs.riAlliancesFormed = []      // [{ members: [a, b], formedOnRI: true, ep }]
```

## Episode History Save

```js
riLifeEvents: ep.riLifeEvents || [],
riArrival: ep.riArrival || null,     // { name, existingResidents: [...] }
riQuit: ep.riQuit || null,           // { name, daysOnIsland }
riReturnChallenge: ep.riReturnChallenge || null, // { winner, losers, challenge }
```

## Interaction with Jury Life

When `cfg.riFormat === 'rescue'`:
- Jury life events do NOT fire for RI residents (they're on RI, not jury)
- Once a player loses the return challenge and joins the jury, THEN jury life kicks in
- RI life events and jury life events are separate pools with different tones:
  - RI life: hungry, competitive, fighting to return
  - Jury life: processing, watching, judging

## Priority

HIGH — completes the parallel-track system. RI (duels) is done. This adds the full social Edge experience. Touches: elimination flow, new life event generator, new VP screens, return challenge, jury handoff.
