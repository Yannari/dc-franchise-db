# Hawaiian Punch — Finale Challenge Design Spec

**Date:** 2026-05-18
**Source:** Total Drama World Tour S3E26
**Type:** Finale format (dropdown option, not twist challenge)
**Format ID:** `hawaiian-punch`

---

## Overview

Hawaiian Punch is a finale format where the season winner is determined by a volcanic race challenge — no jury vote. Two finalists build sacrificial dummies resembling their opponent and race them up an active volcano. First to throw their dummy into the crater wins the million dollars.

**Entry:** Adaptive F3 or F2.
- **F3 (finaleSize=3):** Standard immunity challenge → bottom two jousting tiebreaker → loser eliminated → F2 volcano race
- **F2 (finaleSize=2):** Skip tiebreaker → straight to volcano race

**finaleSize lock:** Caps at F3 max. If user sets finaleSize=4, force it down to 3.

**Win condition:** Challenge-only. No FTC, no jury vote. Pure race outcome determines the season winner.

**Bench system:** Uses existing `generateBenchAssignments()` — eliminated players pick sides. Each finalist picks 1 assistant from their bench via `selectAssistants()`. `finaleAssistants` checkbox applies.

---

## Phase 0: Tiebreaker — Jousting Fire Dance Duel (F3 only)

Runs when `finaleSize >= 3` and 3 players remain after the immunity challenge. Immunity winner advances automatically. Bottom two enter the duel.

### Setup
Arena is a platform over shark-infested water. Each duelist gets a jousting stick, grass skirt, coconut bra (narrative flavor).

### Mechanic — Multi-Exchange Duel (3-5 exchanges)

Per exchange score:
```
physical * 0.35 + boldness * 0.3 + endurance * 0.2 + intuition * 0.15 + noise(2.5)
```

Exchange loser gets knocked back. Losing 2+ consecutive exchanges triggers a desperation rally chance (boldness-driven comeback bonus).

### Social Events (1-2 between every exchange, guaranteed at least 1)

Every social event has gameplay consequences — `addBond`, `popDelta`, or score modifiers. All events convey the stakes of the moment.

| Event | Mechanic | Consequence |
|-------|----------|-------------|
| **Crowd Roar** | Peanut gallery member shouts encouragement or taunts. Bond-driven: high bond = cheer, low bond = heckle. | `addBond +-0.5` between shouter and fighter |
| **Rival Fire** | If duelists have negative bond: taunt/staredown. | `popDelta` for both (crowd loves rivalry) |
| **Showmance Tension** | If either duelist has showmance with immunity winner or anyone watching: longing glance, "fight for me" energy. | `addBond +0.5` |
| **Desperation Plea** | Trailing fighter appeals to crowd. Social-driven. | Small score bonus next exchange on success, penalty on backfire (crowd boos) |
| **Shark Sighting** | Water churns. Boldness check — flincher vs stoic. | Flincher -0.5 next exchange, stoic +0.5. Crowd gasps. |
| **Immunity Winner Reaction** | Safe player watches nervously, strategically, or smugly depending on who they'd rather face. | Reveals preference. `popDelta` if crowd sees it as cowardly/calculating |

### Resolution
Player with more exchange wins advances. Tied → sudden-death exchange with `noise(4)` for higher variance. Loser knocked into water → shark narrative beat → eliminated.

### Consequences
- Bond shifts: winner +1 with immunity winner (mutual respect), loser farewell bonds
- `gs.popularity` for dramatic moments (rally, shark save)
- Camp event injection: "Jousting Duel Aftermath" with peanut gallery reactions

---

## Phase 1: Build the Dummy

Each finalist builds a sacrificial dummy resembling their opponent (wood + pineapples). Faster builder gets a head start in Phase 2.

### Score
```
mental * 0.3 + strategic * 0.25 + physical * 0.2 + intuition * 0.25 + noise(2.5)
```

**Assistant boost (if enabled):** `(assistantMental + assistantPhysical) * 0.15` added to finalist's score.

**Winner reward:** 20-second head start → flat +2.0 score carry-over into Phase 2.

**Loser consolation:** Chris offers a baby carriage that immediately breaks (narrative flavor, no mechanical effect).

### Social Events (2-3)

| Event | Mechanic | Consequence |
|-------|----------|-------------|
| **Sabotage Attempt** | Villain/schemer archetypes can sabotage opponent's dummy. Strategic vs opponent's intuition. | Success: -1.0 to opponent. Failure: caught, `popDelta -2`, `addBond -1.5` |
| **Assistant Chemistry** | Assistant and finalist work together. Bond-driven. | High bond: +0.3 bonus. Low bond: -0.3 penalty. `addBond +-0.5` |
| **Dummy Insult** | One finalist mocks opponent's dummy. Social check. | Crowd laughs: `popDelta +1`. Target flustered: -0.3 next phase. Target fires back (boldness): both `popDelta +1` |
| **Bench Rallying** | Bench members cheer. Larger bench = louder energy. | +0.2 per extra bench member over opponent's bench size, capped at +0.6 |

---

## Phase 2: Uphill Race

Carry the dummy up the volcano. Physical endurance grind with terrain obstacles.

### Score
```
physical * 0.3 + endurance * 0.35 + boldness * 0.15 + temperament * 0.2 + noise(2.5)
```

**Phase 1 carry-over:** Build phase winner gets +2.0 head start.

**Wheelbarrow advantage:** Finalist with higher-bond assistant gets a wheelbarrow. Mechanical: +1.5 to race score. BUT wheelbarrow breaks at the lava river (end of Phase 2), forcing abandonment. Creates a false lead narrative.

### Terrain Events (3-4, sequential as they climb)

| Event | Mechanic | Consequence |
|-------|----------|-------------|
| **Stumble** | Endurance < 5 + bad noise = trip and drop dummy. | -1.0. Opponent can taunt (boldness) or help (loyalty >= 7: `addBond +2.0` but costs helper -0.5) |
| **Shortcut Spotted** | Intuition check. | Success: +1.0 + skip next obstacle. Failure: dead end, -0.5 |
| **Taunt from Above** | Leader taunts trailer. Social vs temperament. | Trailer keeps cool (temperament >= 6): no effect + `popDelta +1`. Loses cool: -0.5, aggressive push (physical check for +1.0 or -1.0) |
| **Bench Interference** | Assistant/bench throws help or distraction. | Water bottle: +0.3 recovery. Rock: opponent -0.3 if intuition fails to dodge |

---

## Phase 3: Lava River Crossing

Stepping stones across a river of lava. Ropes above each stone hold dangerous obstacles. Assistants and bench members cut ropes — but ropes don't necessarily match the correct contestant.

### Base Crossing Score
```
mental * 0.3 + intuition * 0.3 + physical * 0.2 + boldness * 0.2 + noise(2.5)
```

### Rope-Cutting System (Core Mechanic)

- 4-5 ropes total, each holding a trap (piano, cage, boulder, net, anvil)
- Each assistant/bench helper gets 1 cut attempt
- **Targeting:** Helper targets opponent's stepping stone. **30% mismatch chance** — rope drops trap on OWN finalist instead (like the show where Cody accidentally caged Heather)
- **Trap hit:** -2.0 to victim's score. Cage trap specifically: -3.0 total, but victim can escape with physical >= 6
- **Trap dodge:** Target rolls intuition + boldness vs difficulty. Dodge = no penalty + `popDelta +1`

### Special Events

| Event | Mechanic | Consequence |
|-------|----------|-------------|
| **Distraction Play** | Bench member shouts a lie ("Sierra is in danger!"). Social vs target's mental. Only works if distraction references someone target has bond >= 3 with. | Success: target turns, -1.5. Failure: no effect |
| **Counter-Block** | Assistants can block each other instead of cutting. Physical duel between assistants. | Winner's finalist is safe from one rope cut |

---

## Phase 4: Summit Showdown

Both reach the summit. Higher cumulative score from Phases 1-3 = arrives first. The mind games mechanic can flip everything.

### Arrival
Leader arrives first, about to throw dummy in. Trailer arrives desperate/crying.

### Mind Games (Trailing Finalist Only)

**Trigger conditions:** Trailer must have `social >= 5` OR active showmance with leader OR `bond >= 4` with leader.

**Attack types (picked by archetype):**

| Type | Archetypes | Attack Roll | Defense Roll |
|------|-----------|-------------|--------------|
| **Emotional Manipulation** | social-butterfly, showmancer, schemer | `social*0.4 + strategic*0.3 + boldness*0.3 + noise(3)` | `mental*0.4 + intuition*0.3 + temperament*0.3 + noise(2)` |
| **Taunt/Provocation** | hothead, villain, chaos-agent | `boldness*0.4 + social*0.3 + strategic*0.3 + noise(3)` | `temperament*0.5 + mental*0.3 + intuition*0.2 + noise(2)` |
| **Desperate Plea** | underdog, hero, loyal-soldier | `social*0.5 + loyalty*0.3 + intuition*0.2 + noise(3)` | `strategic*0.4 + boldness*0.3 + temperament*0.3 + noise(2)` |

**Showmance/high-bond vulnerability:** If leader has showmance with trailer OR bond >= 5, leader gets -2.0 to defense roll.

**Success = FLIP:** Trailer outmaneuvers leader, grabs dummy, throws it in first. `popDelta`: trailer +3 (iconic), leader -2 (got played).

**Failure:** Leader throws dummy in. Trailer `popDelta -1`, leader +1.

**No attempt (conditions not met):** Straight sprint to the rim. `physical * 0.3 + boldness * 0.4 + endurance * 0.3 + noise(2)` final check added to cumulative score.

### Winner
Whoever throws their dummy into the volcano first wins the season.

### Post-Victory: Volcanic Eruption (Narrative Only)
- Volcano erupts (pineapples angered the volcano gods)
- Everyone runs — chaos narrative
- No mechanical effect on winner
- Optional: feral cameo if returning player twist is active (narrative easter egg)

---

## VP Theme — Tiki Volcano (from mockup)

The approved mockup (`Hawaiian Punch _standalone_.html`) is the visual source of truth. VP builders must reproduce it exactly.

### Key Visual Elements

- **Top bar:** `LIVE` pill + `SEASON FINALE` badge (gold border) + scrolling ticker + `PUNCH.TV` branding
- **Tab navigation:** 6 tabs — Title (00), Tiebreaker (01), Joust (02), Volcano Race (03), Summit (04), Endings (05). Active tab = red pill, inactive = muted
- **Color palette:** Deep navy-black `#0a1929` background, volcanic red accents, coral/salmon stat bars, magenta and teal per-seed accents, gold titles, warm bone text
- **Finalist cards:** Circle avatar with colored ring (seed-matched), name in caps, archetype subtitle, 4 stat display bars
- **Moon:** Persistent top-right decorative moon across all phases
- **Collapsible sections:** FINAL THREE, PEANUT GALLERY, VOLCANO LAB, HAZARD LOG, PRIZE STATUS — each with colored dot avatars
- **Hazard Log table:** Hazard name + status pill (KO, BITE, CROSSED, MISSED, HIT, CRITICAL, ONGOING)
- **Prize Status:** Giant `$1M` with recovery bar and last-seen text
- **Sticky reveal controls:** PREV / counter / NEXT at bottom
- **Ember/lava particles** in background (with `prefers-reduced-motion` fallback)
- **Section headers:** Gold/yellow with decorative markers

### Stat Display Mapping
Mockup shows `CHARM`, `STRENGTH`, `STRATEGY`, `LIKEABLE` as display-friendly aliases. Map to actual stat keys during implementation.

### CSS Prefix
`hp-` (Hawaiian Punch)

### Phase-Specific Backgrounds
1. **Build** — beach at dusk, warm amber/purple sky, tiki torches
2. **Uphill Race** — jungle canopy, volcanic grays, steam vents
3. **Lava Crossing** — volcanic hellscape, black rock, glowing lava rivers, heat shimmer
4. **Summit** — ash and fire, dark sky, floating embers, crater rim

---

## Integration Points

### Files to Update

1. **`simulator.html`** — Add `<option value="hawaiian-punch">Hawaiian Punch (Volcano Race — No Jury)</option>` to finale format dropdown
2. **`js/core.js`** — No TWIST_CATALOG entry needed (this is a finale format, not a twist)
3. **`js/finale.js`** — Main simulation logic: tiebreaker duel + 4-phase volcano race inside `simulateFinale()`, gated by `cfg.finaleFormat === 'hawaiian-punch'`
4. **`js/cast-ui.js`** — finaleSize cap logic: if hawaiian-punch selected, cap finaleSize at 3 (like koh-lanta caps at 4)
5. **`js/chal/hawaiian-punch.js`** — VP builder functions only (rpBuild screens). No simulation logic.
6. **`js/vp-screens.js`** — Import VP builders, register screens for finale replay
7. **`js/vp-finale.js`** — May need hawaiian-punch branch for finale VP rendering
8. **`js/text-backlog.js`** — Text backlog for Hawaiian Punch finale
9. **`js/main.js`** — Import hawaiian-punch module
10. **`js/savestate.js`** — Ensure hawaiian-punch episode data survives save/load

### Existing Infrastructure Reused
- `generateBenchAssignments()` — bench picking
- `selectAssistants()` — assistant selection
- `simulateIndividualChallenge()` — initial immunity challenge (before tiebreaker)
- Finale camp override — `generateFinaleCampOverride()`
- Standard `updateChalRecord` — skipped (finale, not regular challenge)

### F3 Cut Guard
Hawaiian Punch must be added to the `_needsF3Cut` exclusion list alongside `final-challenge`, `olympic-relay`, `koh-lanta` — it handles its own F3→F2 cut via the tiebreaker.

### F4 Cut Guard
Hawaiian Punch must be added to the F4 cut exclusion list — it doesn't support F4 entry.

---

## Anti-Reuse Clause

Hawaiian Punch's visual identity is **Tiki Volcano broadcast** — navy/crimson/gold palette, ember particles, moon element, hazard log table, $1M prize tracker. No other challenge should use this combination. The broadcast TV framing (LIVE pill, PUNCH.TV, scrolling ticker) is unique to this finale format.
