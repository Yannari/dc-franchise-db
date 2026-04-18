# Are We There Yeti? — Challenge Design Spec

**Date:** 2026-04-18  
**Phase:** Post-merge only  
**ID:** `are-we-there-yeti`  
**File:** `js/chal/are-we-there-yeti.js`  
**Immunity:** Winning pair (both safe)  
**Elimination:** Chef's choice via grudge meter (no tribal vote)  
**VP Theme:** Forest survival horror — moonlit canopy, campfire amber, isolation dread. NOT slasher.

---

## Overview

Random pairs dropped in woods by Chef. Race back to camp totem pole. Sasquatchanakwa is an active hunter escalating across phases with guaranteed cave convergence at night. Overnight deception with alliance-aware trust exploitation. Winning pair gets immunity. Chef picks elimination based on grudge meter + performance. 7-8 events per pair across phases.

Based on Total Drama Island S1E24 "Are We There Yeti?"

---

## Core Mechanics

### Pair Formation
Random shuffle of active players, split into pairs. If odd number, one trio (never two trios). No gender split, no alliance awareness — pure random forced proximity. Trio vs pair immunity: compare average personalScore per team (not combined), so trio isn't penalized for extra member. Trio gets slightly more events (scale event count by member count).

### Scoring
- `personalScores[name]` accumulates across all 5 phases
- ALL scoring proportional to stats (`stat * factor`), never threshold-gated
- Score range: roughly -8 to +12
- `ep.chalMemberScores = { ...personalScores }`

### Immunity
- Pair with highest combined `personalScores` wins
- Both members immune
- Tiebreaker: higher average (boldness + endurance) pair wins

### Elimination
- No tribal council. Chef announces at bonfire directly.
- `eliminationScore = personalScore * 0.4 - chefGrudge * 0.6 + noise(-0.5, 0.5)`
- Lowest eliminationScore among non-immune players = Chef's pick
- Chef gives grudge-flavored reason in confessional

### Event Anti-Repetition Rules
- Event pool draws without replacement per pair
- Sasquatchanakwa never does same encounter type twice
- Cross-pair events stay distinct (pair A gets river → pair B gets cliff)
- No two players get same confessional beat type
- Track `firedEvents` set per pair, check before firing

---

## Sasquatchanakwa AI

State object passed between phases:

```
sasquatch = {
  aggression: 0,       // escalates each phase (1→2→3)
  lastTarget: null,     // pair ID targeted last (alternates)
  chasesTriggered: 0,   // cap at 3 before cave convergence
  isProvoked: false,    // brave player stood ground
  provokedBy: null      // name of player who stood ground
}
```

**Phase 1 (aggression: 1) — Ambient.** Footprints, distant roar, broken branches, claw marks on trees. 1-2 hint events per pair. No direct contact. Lower boldness players get spooked confessional. Higher intuition players read signs correctly (+0.3).

**Phase 2 (aggression: 2) — Stalking.** Shadow glimpses, closer sounds, snapped branches nearby. One pair gets proximity event — Sasquatchanakwa circles their position. Brave player (boldness-proportional) can investigate:
- Stand ground: `boldness * 0.08 + physical * 0.05 + noise`. Success = scare it off, +1.0 score, -0.5 Chef grudge (impressed). Fail = chased, flee event.
- `isProvoked = true` if someone stood ground — Sasquatchanakwa remembers.

**Phase 3 (aggression: 3) — Attack.** Guaranteed multi-beat chase:
1. Catches pair with lower average (physical + boldness) first
2. Pursues second pair
3. Both pairs flee to same cave — forced convergence
4. Individual flee checks per player: `physical * 0.05 + endurance * 0.03 + noise`
5. Slowest gets "grabbed" moment (comedy, not injury — dragged by backpack, etc.)
6. Sasquatchanakwa circles cave entrance all night — prevents anyone leaving

**Phase 4 — Final chase.** Targets bottom 2 scorers in sprint. If player previously stood ground (`provokedBy`), Sasquatchanakwa avoids them. Otherwise standard flee check.

**Targeting priority:** Prefers pair NOT targeted last (`lastTarget` alternation). Noisy/panicking players (low temperament) attract attention: `(10 - temperament) * 0.05` aggro weight.

**Score impacts (all proportional):**
- Flee successfully: `physical * 0.05 + endurance * 0.03`
- Stand ground: `boldness * 0.08 + physical * 0.05`
- Get caught/tripped: `-(10 - physical) * 0.15`
- Panic: `-(10 - temperament) * 0.1`

---

## Chef Grudge Meter

`chefGrudge[name]` accumulates alongside personalScores. Higher = Chef dislikes you more.

### Grudge Sources (+)
| Event | Grudge | Phase |
|-------|--------|-------|
| Sass/disrespect Chef at drop-off | +1.0 | 0 |
| Cowardice (flee without trying, panic at wildlife) | +0.5 | 1-3 |
| Waste supplies (drop map in river, break compass) | +0.5 | 1-2 |
| Get robbed overnight (weakness) | +0.5 | 3 |
| Successful theft (sneaky, not tough) | +1.0 | 3 |
| Eat Chef's food in sprint (sticky buns moment) | +2.0 | 4 |
| Whining/complaining (low temperament triggers) | +0.3 | any |
| Abandon partner during chase | +1.0 | 3-4 |
| Hoard supplies from partner | +0.5 | 1-3 |
| Set trap that backfires | +0.5 | 2 |
| Panic at Sasquatchanakwa (scream, freeze) | +0.5 | 2-3 |
| Argue with partner publicly | +0.3 | any |
| Get lost with the map | +0.5 | 1 |
| Refuse to jump/climb (cowardice at obstacle) | +0.5 | 1 |
| Sleep through theft (oblivious) | +0.3 | 3 |
| Cry on camera | +0.3 | any |

### Grudge Reducers (-)
| Event | Grudge | Phase |
|-------|--------|-------|
| Show respect to Chef directly | -0.5 | 0 |
| Brave wildlife encounter (stand ground) | -0.5 | 1-3 |
| Win physical feat (cliff jump, river cross) | -0.3 | 1-4 |
| Endure hardship silently (high temperament + endurance) | -0.3 | any |
| Build impressive shelter | -0.3 | 1 |
| Help injured/struggling teammate | -0.5 | any |
| Confront Sasquatchanakwa head-on | -0.8 | 2-3 |
| Catch a thief / expose deception | -0.5 | 3 |
| Share supplies with rival pair | -0.3 | 3 |
| Carry partner through obstacle | -0.5 | 1-4 |
| Resist food temptation in sprint | -0.3 | 4 |
| Finish sprint without complaint | -0.3 | 4 |
| Impress Chef with survival skill | -0.5 | 1-2 |
| Lead pair to correct path (good navigation) | -0.3 | 1 |

### Elimination Confessional Flavor
Chef's reason gated to highest grudge source:
- Food theft: "You ate my buns. MY buns. Get on the boat."
- Cowardice: "You screamed at a squirrel. I can't even look at you."
- Weakness/got robbed: "You let them take your map while you were SLEEPING."
- Abandonment: "You left your partner. In MY woods. Unforgivable."
- General low score: "You were the worst out there. Simple as that."
- Multiple grudge sources: "Where do I even start with you?"

---

## Phases

### Phase 0 — Drop Off (no scoring)

Chef helicopters in. Military tone. Dumps two supply bags, assigns pairs.

**Supply bag contents:** map, compass, bug spray, sleeping bag, binoculars. No food.

**Events:**
- Chef intro beat — warns about Sasquatchanakwa, explains race rules
- Per-player reaction confessional (archetype-gated):
  - villain/mastermind/schemer: sizing up partner, calculating advantage
  - hothead/chaos-agent: excited, wants to fight the Sasquatchanakwa
  - social-butterfly/showmancer: worried about sleeping outdoors
  - hero/loyal-soldier: protective of partner, focused on teamwork
  - underdog/floater: quiet determination, underestimated
  - challenge-beast: confident, treating it like a workout
  - wildcard: unpredictable reaction from dedicated pool
  - perceptive-player: already reading the other pair for weaknesses
  - goat: panicking
- Grudge seed: players who sass Chef (+1.0), players who show respect (-0.5)
- Chef departs via helicopter — "Don't die. The paperwork is BRUTAL."

### Phase 1 — Navigation (7-8 events across both pairs, 3-4 per pair)

Each pair navigates forest toward camp. Navigation approach stat-driven:

**Map reading:** `mental * 0.15 + intuition * 0.1 + noise(-1.5, 1.5)`  
High = correct direction, shortcut found. Low = map upside down, wasted time.

**Compass + steady pace:** `endurance * 0.12 + mental * 0.08 + noise`  
Reliable but slow. Moderate score, low variance.

**Boldness shortcut:** `boldness * 0.15 + physical * 0.1 + noise`  
Cliff jump, river crossing. High risk/reward.

**Event pool (draw without replacement, cross-pair distinct):**
- River crossing — physical + boldness proportional. Fail = lose supplies, comedy beat.
- Cliff/mountain climb for vantage — physical + mental. Success = spot camp direction, +1.0.
- Getting lost — low mental = circle back, time penalty -1.0. Partner frustration beat.
- Map upside down — mental check. Fail = wrong direction for a phase. Comedy confessional.
- Quicksand/mud pit — physical + endurance to escape. Partner help = bond boost.
- Animal encounter (non-Sasquatchanakwa) — bear, skunk, porcupine. Boldness check.
- Supply discovery — random find: rope, flare, extra food, first aid kit. +0.5 + utility later.
- Pair argument — bond check. Low bond = argument, both -0.3. High bond = strategize, both +0.3.
- Compass malfunction — intuition check to notice. Fail = wrong direction.
- Landmark recognition — mental + intuition. Success = shortcut, +0.8.
- Partner injury — one player trips/sprains. Helper gets +0.5 and -0.5 grudge. Abandoner gets +1.0 grudge.
- Foraging attempt — endurance + intuition. Find berries/fish = +0.5. Fail = eat wrong thing, -0.5.
- Sasquatchanakwa hint events (1-2 per pair): footprints, distant roar, claw marks. Tension only.

Score per event: +0.3 to +2.0 success, -0.3 to -1.5 failure. All proportional.

### Phase 2 — Traps & Theft (7-8 events across both pairs)

Pairs become aware of each other's position. Trap-setting and supply stealing begin.

**Trap eligibility (per CLAUDE.md archetype rules):**
- Villain/schemer/mastermind: always eligible
- Neutral archetypes (strategic >= 6 AND loyalty <= 4): eligible
- Nice archetypes: NEVER trap. Can set defensive measures (trip wire alarm, decoy trail, guard supplies)

**Trap types:**
- **Snare** — catches pursuer. `strategic * 0.1 + mental * 0.08` to set. `physical * 0.1 + intuition * 0.05` to escape. Delay penalty -0.8 on victim.
- **False trail** — `mental * 0.1 + strategic * 0.08` to set. `intuition * 0.12 + mental * 0.05` to detect. Fooled = wasted time, -1.0.
- **Supply steal attempt** — `social * 0.1 + strategic * 0.08` vs target `intuition * 0.1 + mental * 0.06`. Success = steal map/compass/binoculars. +1.0 thief, -1.0 victim.
- **Pit trap** — `physical * 0.08 + strategic * 0.08` to dig. Victim falls in: -1.0, comedy beat. Backfire chance if low mental: trapper falls in own pit, +0.5 grudge.
- **Decoy camp** — `strategic * 0.1 + social * 0.05` to set. Rivals waste time investigating. -0.5 to fooled pair.

**Counter-play:**
- High intuition detects traps: `intuition * 0.12 + noise` → avoid + gain intel (+0.5)
- Perceptive-player archetype: auto-detect first trap encountered
- Caught trappers: bond damage with victim, +0.5 grudge

**Defensive measures (nice archetypes):**
- Trip wire alarm: alerts to approaching rival. `intuition * 0.08 + loyalty * 0.05`
- Decoy trail away from own camp: `mental * 0.08`
- Guard supplies: `loyalty * 0.08 + endurance * 0.05`. Theft auto-fails against guarded supplies.

**Sasquatchanakwa stalking events:** Shadow glimpses, closer sounds. One pair gets proximity event. Stand-ground opportunity for brave players.

**Additional events:**
- Rival pair spotted — pair interaction beat. Taunt, threat, or nervous acknowledgment.
- Double-back ambush — `strategic * 0.1` to set. Surprise encounter with rival pair.
- Trap backfire — low mental trapper's own trap catches them. Comedy. +0.5 grudge.
- Supply negotiation — cross-pair players with bond >= 2 can trade. Both +0.3.
- Binocular spying — spot rival pair's position. `intuition * 0.08`. Success = know their heading.

### Phase 3 — Overnight Camp (Sasquatchanakwa Convergence, 7-8 events)

The setpiece phase. Sasquatchanakwa forces both pairs into one cave.

**Beat 1 — Sasquatchanakwa attack.**
Multi-beat chase. Catches pair with lower avg (physical + boldness) first, then second pair. Individual flee checks: `physical * 0.05 + endurance * 0.03 + noise`. Slowest = grabbed moment (comedy — dragged by backpack, caught on branch). All four players end up in cave.

**Beat 2 — Cave convergence.**
Both pairs forced together. Bats sub-event: `temperament * 0.05` check, fail = panic -0.3. Initial tension beat based on cross-pair bonds. Rivals size each other up. Allies from different pairs reconnect.

**Beat 3 — Social manipulation (the Heather moment).**
Alliance-aware negotiation engine:

*Cooperation checks:*
- Bond >= 2 across pairs: genuine cooperation, share supplies. Both +0.5, bond +0.3.
- Bond 0 to 2: neutral, wary coexistence. Minor events.
- Bond <= -2: pretend cooperation. Deception setup.

*Theft attempts (schemer/villain archetypes):*
- Attack: `social * 0.12 + strategic * 0.08 + noise`
- Defense: `intuition * 0.12 + mental * 0.08 + noise`
- Perceived bond gap amplifier: if perceived bond >> real bond, defense penalized by `(perceivedBond - realBond) * 0.15`
- Success: steal map/supplies, +1.5 thief, -1.5 victim. Victim wakes to find stuff gone.
- Partial (close roll): steal one item. +0.8 / -0.8.
- Caught: bond -2.0, thief -1.0 score, +1.0 Chef grudge.

*Nice archetype guard:*
- Guard watch quality: `loyalty * 0.1 + endurance * 0.05`
- If guarding, theft auto-fails against that player's supplies.

**Beat 4 — Sleep watch.**
Who volunteers? High loyalty = volunteer watch. Low loyalty + high strategic = pretend to sleep, actually scheme.
- Watchers: +0.3 score, -0.3 grudge (Chef respects vigilance).
- Sleep-through-theft: -0.5 score, +0.3 grudge.
- Nightmare event (low temperament, random): -0.3, confessional comedy.

**Beat 5 — Morning aftermath.**
Theft discovered (if any). Confrontation event — bond consequences fire. Betrayal heat stored for downstream tribal targeting. Both pairs split. Pre-sprint confessionals.

**Additional overnight events:**
- Campfire stories — social * 0.05 bond boost with listeners. +0.2 per participant.
- Vulnerability confession — like Camp Castaways. High social + low temperament. Bond boost.
- Partner argument over strategy — temperament check. Fail = -0.3 both.
- Shared food moment — if anyone found food in phase 1. Bond +0.3 with sharers.
- Sasquatchanakwa circling sounds — tension beat. Low boldness = scared, -0.2.
- Insomnia — high mental players stay awake thinking. Strategic planning beat. +0.2.
- Alliance whisper — cross-pair allies scheme quietly. Strategic + social check.

### Phase 4 — Final Sprint (4-5 events)

Race to totem pole. Base sprint speed:

```
sprintScore = personalScore + physical * 0.1 + endurance * 0.08 + noise(-1.0, 1.0)
```

**Stolen supply advantages:**
- Has map (stolen or kept): +0.8 (know the route)
- Has compass: +0.5 (direction confidence)
- Has binoculars: +0.3 (spot totem pole from distance)

**Distraction events (personality-driven upsets):**

*Food temptation (the Owen moment):*
- Triggers for players with temperament <= 4 AND endurance <= 5
- Resist: `mental * 0.1 + strategic * 0.08 + noise`. Success = +0.5. Fail = veer off, -2.0 score.
- Chef grudge on food eater: +2.0 (biggest single grudge hit — "those were MY sticky buns")

*Tantrum slowdown:*
- Players with temperament <= 3 who got robbed overnight
- Rage-quit moment: -1.0 score, comedy confessional

*Risky shortcut:*
- Boldness >= 6 players attempt. `physical * 0.1 + boldness * 0.08 + noise`
- Success = +1.5, leapfrog ahead. Fail = -1.0, stumble/fall.

*Sasquatchanakwa final appearance:*
- Chases bottom 2 scorers. Flee: `physical * 0.1 + endurance * 0.08`
- Fail = dragged back, -1.5. Pass = adrenaline boost, +0.5.
- Previously provoked player exempt (Sasquatchanakwa remembers).

*Partner boost:*
- Pair bond >= 3: faster partner encourages slower. Slower gets +0.5.

*Exhaustion collapse:*
- Low endurance players (endurance <= 3): chance of collapse near finish. -1.0.
- Partner carry: if partner physical >= 7, can carry. Carrier +0.5, -0.3 grudge.

*Final dash:*
- Last 2 players get desperation beat. `boldness * 0.08 + endurance * 0.05`.
- All-or-nothing lunge at totem pole.

**Resolution:**
- Sort all players by sprintScore (includes accumulated personalScore)
- Pair with highest combined sprintScore wins. Both immune.
- Chef picks elimination from non-immune: `personalScore * 0.4 - chefGrudge * 0.6 + noise(-0.5, 0.5)`. Lowest = eliminated.

---

## VP Theme — Forest Survival Horror

### Palette
- Deep forest green: `#1a2e1a`
- Amber campfire: `#d4850a`
- Moonlight silver: `#c8d0dc`
- Shadow black: `#0d1117`
- Sasquatchanakwa eye glow (monster beats only): `#ff4d00`

### Anti-Reuse Clause
No other challenge may use: campfire-amber palette, moonlit canopy layering, found-footage grain with forest backdrop, or "Chef's grudge" UI widget.

### Typography
- Primary: rough handwritten face (woodsy survival feel)
- Chef commentary: blocky stencil — military field report scrawl
- Phase headers: burnt-wood texture lettering

### Background Layers
- Base: dark forest canopy, parallax trees at edges
- Moonlight filtering through branches (CSS radial gradient, shifts per phase):
  - Phase 0-1: twilight blue-green
  - Phase 2: deep dusk purple
  - Phase 3: full dark, campfire amber glow from center
  - Phase 4: dawn breaking, golden light from right edge

### Card Treatment
- Events on torn notebook pages (kraft paper texture), pinned to corkboard-bark background
- Sasquatchanakwa events: camera shake effect, static grain burst, red-orange border pulse
- Chef grudge events: red stamp overlay — "NOTED." or "UNACCEPTABLE." or "STRIKE."
- Theft/deception events: ink smudge effect, crossed-out text revealing true action underneath
- Brave moments: golden firelight border, ember particles

### Reveal Mechanic
Step-based like Camp Castaways. `_tvState[key]` with `idx: -1`, click-to-reveal. Each phase is its own VP screen.

### Screens
1. **The Drop Off** — Chef's briefing, pair assignments, supply bags
2. **The Trail: Pair [A]** — navigation events for pair A
3. **The Trail: Pair [B]** — navigation events for pair B
4. **Traps & Tricks** — cross-pair interactions, trap events
5. **The Night** — Sasquatchanakwa convergence, cave, overnight deception
6. **The Sprint** — race to totem, distractions, Sasquatchanakwa final chase
7. **Chef's Verdict** — elimination announcement, grudge meter reveal, final confessional

### Distinct From
- **Slasher Night:** no blood, no kill framing, no predator-prey hunt UI, no elimination-round structure
- **Camp Castaways:** no surveillance green, no tannoy timestamps, no broadcast monitor, no Mr. Coconut
- **Wawanakwa Gone Wild:** no animal trophy cards, no hunter scoreboards, no safari aesthetic
- **Hide and Be Sneaky:** no night-vision cam, no betrayal spotlight, no Chef-with-water-gun

---

## Engine Integration

### Episode.js Hook
```
} else if (ep.isAreWeThereYeti) {
  simulateAreWeThereYeti(ep);
  // No ep.tribalPlayers — Chef eliminates directly, no tribal
  ep.noTribal = true;
}
```

### Twist Flags
- `ep.isAreWeThereYeti = true` — set in twists.js
- `ep.areWeThereYeti` — data object for VP (timeline, pairs, personalScores, chefGrudge, sasquatch state, elimination)
- `ep.noTribal = true` — Chef decides, skip tribal council
- `ep.chefEliminated` — name of Chef's pick

### Data Object
```
ep.areWeThereYeti = {
  timeline,
  pairs: [{ label: 'A', members: [...] }, { label: 'B', members: [...] }],
  personalScores: { ...personalScores },
  chefGrudge: { ...chefGrudge },
  sasquatch: { ...finalSasquatchState },
  supplies: { ...supplyTracking },
  immunityPair: 'A' or 'B',
  immunityWinners: [name1, name2],
  chefEliminated: name,
  chefReason: 'string',
  stolenItems: [{ thief, victim, item, phase }],
  trapsSet: [{ setter, type, target, result }]
}
```

### Required Outputs (per CLAUDE.md)
- `ep.chalMemberScores` — personal scores for heat/targeting
- `updateChalRecord(ep)` with member scores
- Debug challenge tab data
- VP screens (7 screens)
- Text backlog (`_textAreWeThereYeti`)
- Cold open text
- Timeline tags for episode history
- Badge text/class for all event types
- Popularity changes for heroic/villain/coward moments
- Showmance moments if pair contains showmance partners

### Sudden Death Compatibility
If `ep.isSuddenDeath`: run full challenge simulation (all phases, VP data populated), then use lowest scorer as auto-eliminated instead of Chef's pick. Chef still gives grudge-flavored commentary but framed as "last place = gone."

---

## File Structure

Single file: `js/chal/are-we-there-yeti.js`

Internal phase functions:
- `_phaseDropOff(pairs, timeline, chefGrudge, sasquatch)`
- `_phaseNavigation(pairs, timeline, personalScores, chefGrudge, sasquatch, supplies, firedEvents)`
- `_phaseTrapsTheft(pairs, timeline, personalScores, chefGrudge, sasquatch, supplies, firedEvents)`
- `_phaseOvernight(pairs, timeline, personalScores, chefGrudge, sasquatch, supplies, firedEvents)`
- `_phaseSprint(pairs, timeline, personalScores, chefGrudge, sasquatch, supplies, firedEvents)`

Exports:
- `simulateAreWeThereYeti(ep)` — main simulate
- `rpBuildYetiDropOff(ep)` — VP screen 1
- `rpBuildYetiTrail(ep, pair)` — VP screen 2-3 (per pair)
- `rpBuildYetiTraps(ep)` — VP screen 4
- `rpBuildYetiNight(ep)` — VP screen 5
- `rpBuildYetiSprint(ep)` — VP screen 6
- `rpBuildYetiVerdict(ep)` — VP screen 7
- `_textAreWeThereYeti(ep)` — text backlog
