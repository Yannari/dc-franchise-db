# Walk Like an Egyptian — Twist Challenge Design

**ID**: `walk-like-an-egyptian`
**Series**: `world-tour`
**Phase**: `pre-merge`
**Category**: `challenge`
**Engine Type**: `walk-like-an-egyptian`
**Min Tribes**: 2
**Emoji**: 🏛️

## Overview

Three-phase pre-merge tribe race inspired by Total Drama World Tour S3E1-2. Tribes race through an Egyptian pyramid (over or under), trek across the desert with reward animals, and weave boats to cross the crocodile-infested Nile. First tribe across wins immunity. Last tribe goes to tribal council.

**Unique mechanics**: Over/Under player choice, three-tier reward animal system (camel/goat/stick), Curse of the Mummified Dog, divining rod secret advantage, crocodile gauntlet.

**No singing.** The TDWT musical element is omitted entirely.

---

## Phase 1: Pyramid Over/Under

Each tribe member independently chooses to go **OVER** (climb the pyramid exterior) or **UNDER** (navigate the tunnels inside).

### Choice Logic (archetype + stat driven)

- Challenge-beasts, hotheads, heroes → bias OVER (physical confidence)
- Schemers, masterminds, perceptive-players → bias UNDER (calculated risk)
- Others → weighted by `physical` vs `mental` stat ratio with noise
- Wildcards, chaos-agents → coin flip with noise

### OVER Path (2-3 beats)

**Beat 1 — Ascent**: `physical * endurance` check with `noise(2.5)`. Failing = time penalty + comedy injury beat (sliding down, sand in eyes, sunburn). Top climbers who score well get a **summit view bonus** — they spot a shortcut usable in Phase 2.

**Beat 2 — Descent**: Players choose to **surf down** or **walk down**.
- Surf: requires `physical >= 5` + boldness check. Success = fast descent + style points. Failure = wipeout, can collide with other climbers (collision social event — bond penalty with victim, comedy narration).
- Walk: safe, slow, no drama.

### UNDER Path (3-4 beats)

**Beat 1 — Three Doors**: Each door has a symbol mapped to a stat pair:
- Door A (Eye of Horus) → `mental + intuition` — puzzle corridor with hieroglyph riddles
- Door B (Scarab) → `endurance + physical` — tight crawlspaces, physical obstacles
- Door C (Ankh) → `social + boldness` — bluff/charm past animated guardian traps

Players pick the door that best fits their stats (with noise — sometimes they pick wrong). Wrong door = slower but not dead-end. Right door = fast passage with a bonus beat.

**Beat 2 — Trap Encounters** (1-2 per player):
- **Scarab swarm**: `endurance` check. Pass = push through. Fail = panic, wrong turn, time loss.
- **Mummy scare**: `boldness` check. Pass = composure, find shortcut. Fail = panic sprint into dead end.
- **Collapsing passage**: `physical` check. Pass = dodge debris. Fail = buried briefly, dug out by teammate (bond boost with helper).

**Beat 3 — Mummified Dog**: One random UNDER player discovers a mummified dog in a burial chamber. They pet/disturb it, triggering the **Curse of the Mummified Dog**:
- Injected as a camp event with `badgeText: 'CURSED'`, `badgeClass: 'badge-danger'`
- Cursed player suffers bad luck modifier for Phases 2-3: targeted by crocs first, animal mishaps, navigation fumbles
- Curse persists as a `gs._mummifiedDogCurse = { player, expiresEp: gs.episode + 3 }` — affects future challenges for 3 episodes (animals act up around them, minor score penalties)

### Phase 1 Scoring

Individual time score per player based on path completion speed. Tribe average determines **finish order** for reward assignment:
- 1st place tribe → Camel
- 2nd place tribe → Goat
- Last place tribe → Stick

---

## Phase 2: Desert Trek

Tribe-level race across the desert to the Nile River. Reward animals create asymmetric advantages.

### Reward Animal Mechanics

**Camel** (1st place reward):
- Speed bonus (~15% faster base movement)
- Shade from sun = less fatigue accumulation
- Downside: stubborn — occasional refusal checks (`social` to coax it moving)

**Goat** (2nd place reward):
- Small speed bonus (~8%)
- Comedy weight distribution — players stack on goat (Alejandro balancing callback)
- `physical` check for the stacker to keep everyone balanced. Failure = pile collapse, time loss, comedy beat

**Stick** (last place reward):
- No speed bonus
- **Secret advantage**: it's a divining rod. `mental + intuition` check to discover this. If discovered, grants navigation bonus (auto-pass one navigation beat)
- **Losable**: stick holder can lose it to a bird/croc encounter. Lost stick = no advantage + Chris mockery + morale penalty

### Trek Structure (4-5 beats)

**Beat 1 — Leader Selection**: Tribe selects a navigator.
- Default: highest `strategic` player
- Hotheads/masterminds may challenge for leadership (`strategic + social` contest)
- Bad leader selection = friction camp event

**Beat 2-3 — Navigation Beats**: Each beat is a directional check.
- Navigator's `mental + intuition` vs difficulty with `noise(2.5)`
- Success = progress toward Nile
- Failure = lost time (running in circles past the same cactus)
- **Shortcut**: players with summit view bonus from Phase 1 can spot shortcuts. Shortcut attempt = `boldness` check. Success = huge time save. Failure = sandstorm penalty (entire tribe slowed).
- Divining rod (if discovered) auto-passes one navigation beat

**Beat 3 — Scarab Swarm Encounter**: Scarab mating season swarm hits all tribes simultaneously.
- Each player: `endurance + mental` check
- Panickers scatter (individual time loss)
- One player per tribe can attempt to **calm the scarabs**: `social + boldness` check. Success = tribe avoids swarm entirely (huge bonus). Failure = scarabs specifically chase that player (comedy beat, personal time loss)
- Cursed player attracts extra scarabs regardless

**Beat 4 — Social Events Window**: 2-3 social events fire between navigation beats:
- **Seduction/charm play**: villain/schemer targets rival on another tribe. `social * charm` vs target's `mental + intuition`. Success = target distracted (time penalty for their tribe), bond shift. Failure = rejected, ego bruise.
- **Alliance whispers**: intra-tribe deal-making. Bond boosts between participants, potential info sharing.
- **Blame spiral**: if tribe is lost, lowest-bond member gets scapegoated. Heat applied via `gs._egyptHeat = { target, amount, expiresEp }`.
- **Cursed player mishap**: reward animal acts up around cursed player. Camel bucks them off, goat headbutts them, stick snaps (if they're holding it).
- **Stick loss event**: last-place tribe's stick holder has a chance to lose it — bird swoops down and grabs it, or croc snaps it during a river preview.

**Beat 5 — Arrival**: Tribes arrive at the Nile in order determined by cumulative trek performance. First arrival gets first pick of weaving spot (calmer water = minor Phase 3 advantage).

### Phase 2 Scoring

Per-player scoring: navigation contributions, scarab handling, social event outcomes. Navigator gets bonus/penalty based on how many beats they passed/failed. Scarab calmers get big bonus. Players who caused the tribe to get lost get penalties.

---

## Phase 3: Nile Crossing

Weave a boat from river weeds, load the reward animal, row across the crocodile-infested Nile to the finish line.

### Beat 1 — Basket Weaving

Team coordination check. Each player contributes based on `mental + social` (cooperative craft work).
- One player per tribe can emerge as a **weaving prodigy** — highest `mental` player gets a mastery bonus that elevates the whole tribe's boat quality
- Bad weavers slow the team down (low `mental` = weaving mistakes, boat has weak spots)
- **Boat quality** determines: hit points (how many croc attacks before critical damage), rowing speed modifier, animal capacity

### Beat 2 — Animal Loading

Comedy/chaos beat. Each reward animal has loading difficulty:

**Camel**: stubborn, refuses to board.
- `social + patience(endurance)` checks to coax it in
- One player can try "speaking camel" — `boldness + social` check. Huge success = camel walks right in. Failure = camel spits on them (comedy, small score penalty)
- Multiple failures = time wasted as tribe argues about approach

**Goat**: easy to load but panics once on water.
- Loads quickly (minor time bonus)
- Triggers periodic goat-freak-out checks during rowing (rocks the boat, rowing disruption)

**Stick team**: no animal to load (time advantage!).
- If they still have the stick: small morale boost ("at least we have something")
- If stick was lost in Phase 2: nothing to load, nothing to show. Chris mockery camp event. Morale penalty.

### Beat 3 — Rowing & Crocodile Gauntlet

Multi-beat river crossing (3-4 rowing beats).

**Each rowing beat**:
- **Rowing check**: tribe average `physical + endurance`, modified by boat quality. Goat team gets periodic rocking penalties. Camel team's heavier boat is slower but sturdier (more HP).
- **Croc attacks** (1-2 per beat): target specific players. Target priority order:
  1. Cursed player (Mummified Dog) — always targeted first
  2. Lowest `physical` player
  3. Random
- **Croc defense**: `physical + boldness` check. Success = fend off, no damage. Failure = boat damage + personal time penalty.
- **Heroic protection**: hero/loyal-soldier/social-butterfly types can jump in to defend a targeted teammate. `physical + loyalty` check. Success = croc fended off, big bond boost with protected player, individual score bonus. Failure = both take penalties, but bond still boosts (appreciated the effort).
- Villain types can **shove someone toward a croc** as distraction — `scheming` check, if caught = massive heat + bond penalty with tribe.

**Social beats between rows**:
- Showmance moments (rowing in sync, eye contact, "our rhythm is perfect")
- Rivalry flare-ups (blame for weak rowing contribution)
- Heroic save callbacks (referencing croc defense from previous beat)

### Beat 4 — Final Sprint

Last stretch to the finish line.
- Damaged boats risk sinking — if boat HP is critical, tribe must **bail water** (`endurance` check) simultaneously with rowing
- One dramatic **boat sinking** possible for worst-condition tribe — they swim the last stretch. Massive time penalty but not elimination, just humiliation + comedy narration
- Photo finish possible between close tribes (closest margin determines if it's called dramatic or blowout)

### Finish Order & Results

- **1st tribe** → immunity, Winner's Area (first class)
- **2nd tribe** → safe, Loser Lounge (economy)
- **Last tribe** → tribal council

---

## Camp Event Injection

All camp events have `players: []` array + `badgeText`/`badgeClass`.

### During Challenge
- Mummified Dog Curse discovery (UNDER path)
- Collision wipeouts (OVER surf descent)
- Blame for bad navigation (Phase 2)
- Cross-tribe seduction attempts (Phase 2)
- Stick loss incident (Phase 2)
- Heroic croc saves (Phase 3)
- Villain croc shoves (Phase 3)

### Post-Challenge Persistent Effects
- `gs._mummifiedDogCurse = { player, expiresEp }` — cursed player has bad luck in future challenges for 3 episodes (animal mishaps, minor score penalties, targeted by wildlife)
- `gs._egyptHeat = { target, amount, expiresEp }` — blame heat from navigation failures
- Bond shifts from heroic saves, seduction, collision events
- Popularity changes: heroic croc saves (+pop), villain croc shoves (-pop if caught), scarab calming (+pop), cowardly surf refusal (minor -pop)

---

## Scoring Summary

### Per-Player (`chalMemberScores`)
| Source | Range | Notes |
|--------|-------|-------|
| Phase 1 path completion | 0-15 | Speed-based, door/path choice quality |
| Summit view bonus | +3 | OVER path high scorers only |
| Phase 2 navigation contribution | 0-10 | Navigator bonus/penalty, shortcut finding |
| Phase 2 scarab handling | 0-5 | Calmer gets big bonus |
| Phase 2 social events | -3 to +5 | Seduction success/failure, blame |
| Phase 3 weaving | 0-8 | Prodigy bonus for top weaver |
| Phase 3 rowing | 0-10 | Per-beat rowing contribution |
| Phase 3 croc defense | 0-8 | Per successful fend-off |
| Phase 3 heroic saves | +5 each | Protecting teammates |
| Immunity winner bonus | +active.length+5 | Guarantees #1 position |

### Tribe Placement
Tribe scores = average of member scores per phase. Cumulative across all three phases determines finish order. Scoring is balanced so no single phase dominates (each phase maxes ~15 per player).

---

## VP Identity: Ancient Egypt Expedition

### Theme Foundation
- CSS prefix: `eg-`
- Fonts: display = papyrus-style serif (Cinzel or similar), body = clean sans
- Color palette: sand gold (#C2A645), pharaoh blue (#1B4B7A), scarab green (#2D5F3E), terracotta (#B85C38), night purple (#2A1B3D)
- Phase-specific backgrounds: pyramid stone interior (Phase 1) → scorching orange desert (Phase 2) → dark blue-green Nile river (Phase 3)
- `max-width:1100px;margin:0 auto`

### Custom CSS Icons (no emoji)
- Climb/ascend, surf/slide, door/choice, scarab, mummy, curse, camel, goat, stick, navigation, sandstorm, crocodile, boat, weave, hero-save, villain-shove

### Environmental Animations
- Phase 1: sand particles drifting, torch flicker in tunnels
- Phase 2: heat shimmer effect, scarab swarm pulse
- Phase 3: water ripple, crocodile eye-blink in the dark

### HUD Overlay
- Expedition telemetry: GPS coordinates shifting, temperature rising (Phase 2), water depth (Phase 3)
- Tribe progress tracker updating per reveal

### Comm Chatter
- Phase 1: archaeological radio chatter ("Team Bravo, we've breached the lower chamber...")
- Phase 2: desert expedition comms ("Visibility dropping, sandstorm inbound...")
- Phase 3: river patrol warnings ("Movement detected at bearing 270, large reptilian...")

### Viewport
- Phase 1: pyramid cross-section showing OVER/UNDER paths
- Phase 2: desert horizon with heat distortion
- Phase 3: underwater view with croc shadows

### Telemetry Ticker
- Phase 1: "STRUCTURAL INTEGRITY 94% ... SCARAB DENSITY RISING ... PASSAGE TEMP 38°C"
- Phase 2: "WIND SPEED 45KPH ... UV INDEX EXTREME ... WATER RESERVES LOW"
- Phase 3: "CURRENT SPEED 4.2 KNOTS ... CROC PROXIMITY ALERT ... HULL INTEGRITY [degrading]"

### Sidebar
- Live tribe standings, per-player scores gated by reveal index
- Phase-specific data: door choices (P1), navigation map (P2), boat HP bars (P3)
- Never spoils future results

### Reveal Controls
- Fixed bottom bar with `NEXT` / `REVEAL ALL` + X/Y counter
- Auto-scroll to newly revealed content

---

## Anti-Reuse Clause

This challenge's visual identity is **Ancient Egyptian expedition**. No other challenge may use: hieroglyph card borders, papyrus/sand color palettes, archaeological radio chatter, pyramid cross-section viewports, or Nile-specific water theming. The scarab swarm animation, mummy scare beat, and crocodile gauntlet mechanics are exclusive to this challenge.
