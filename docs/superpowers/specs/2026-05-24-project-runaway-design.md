# Project Runaway — Twist Challenge Spec

**ID**: `project-runaway`  
**Phase**: Pre-merge  
**Style**: `social`  
**Series**: `dc5`  
**Inspiration**: DC5 "Project Runaway" (team fashion design, theme judging) + TDRI "Runaway Model" (catching wild creatures, dressing them, chaos)

---

## Overview

A 4-phase pre-merge fashion challenge. Tribes catch a wild island creature, assign roles (designer/model/gatherers), build matching outfits for both the creature and a team model, then compete in a runway show judged by the host. An optional berserk phase can flip close results.

---

## Phase 1: Creature Hunt

**Duration**: 3 beats  
**Goal**: Each tribe catches one creature from the island

### Creature Pool (8 types)

| Creature | Cooperation | Showmanship | Volatility | Catch Difficulty |
|----------|-------------|-------------|------------|-----------------|
| Mutant Frog | 7 | 4 | 3 | Low |
| Woolly Beaver | 5 | 6 | 5 | Medium |
| Giant Crab | 3 | 8 | 7 | High |
| Neon Parrot | 8 | 7 | 2 | Medium |
| Armored Turtle | 6 | 3 | 4 | Low |
| Electric Eel | 2 | 9 | 9 | High |
| Glitter Fox | 9 | 5 | 1 | Medium |
| Spiky Porcupine | 4 | 6 | 6 | High |

**Stat-priority for creature selection:**
- High-mental+intuition tribe → spots rare/high-showmanship creatures
- High-physical+boldness tribe → can catch difficult creatures
- Selection is semi-random: tribe's best scout (intuition) determines the pool of 3 creatures offered, then best hunter (physical+boldness) determines catch success

### Hunt Mechanics

**Beat 1: Scouting** — Highest-intuition player scouts. Roll determines which 3 creatures are available (better roll = rarer creatures in the pool).

**Beat 2: Chase** — Tribe sends 2-3 hunters. Physical + boldness + noise vs creature's catch difficulty. Social events fire: rivalries, teamwork, falls, near-misses.

**Beat 3: Capture** — Final catch attempt. If failed in Beat 2, the tribe gets a guaranteed catch of the easiest remaining creature. Success = tribe chooses from their scouted pool.

### Hunt Social Events
- Hunters from opposing tribes cross paths → trash talk / competitive one-up
- Hunter falls/gets hurt → teammate helps or leaves them
- Creature attacks during chase → physical check, popularity for heroics
- Rare: creature bonds with a specific player (cooperation bonus later)

### Scoring
- `chalMemberScores`: scouts +3, hunters +2-5 based on contribution
- Creature quality (cooperation + showmanship) feeds into Phase 3

---

## Phase 2: Design & Build

**Duration**: 4 beats  
**Goal**: Design and construct matching outfits for the model AND the creature

### Role Assignment (Priority Draft)

| Role | Selection Criteria | Count |
|------|-------------------|-------|
| Designer | Highest mental + strategic | 1 per tribe |
| Model | Highest social + boldness | 1 per tribe |
| Creature Handler | Highest intuition + temperament | 1 per tribe |
| Material Gatherers | Everyone else | 3-5 per tribe |

### Theme Assignment
Each tribe gets a random theme from:
- Island Castaway
- Island Getaway
- Tiki Royalty
- Shipwreck Chic
- Jungle Couture
- Coral Reef Glam
- Volcanic Vogue
- Moonlit Lagoon

### Beat Structure

**Each beat:**
1. **Gatherers** search for materials — roll based on physical + intuition + noise
   - Material types: fabric scraps, shells, flowers, feathers, vines, coral, driftwood, gems
   - Quality: poor / decent / excellent (affects outfit score)
   - 1-2 materials found per gatherer per beat
   
2. **Designer** works on the outfit — mental + strategic + noise
   - Each beat builds cumulative "design score"
   - Materials quality modifies the score
   - Designer must split attention between human outfit AND creature outfit
   
3. **Creature Handler** keeps the creature calm — intuition + temperament + noise
   - Success: creature stays cooperative, gets bonus cooperation for runway
   - Failure: creature agitates, potential material damage, cooperation penalty
   
4. **Model** practices — social + boldness + noise
   - Builds "presentation score" used in Phase 3
   - Can assist designer (sacrifice practice for outfit quality)

### Build Social Events (1 guaranteed per beat)

| Event | Trigger | Consequence |
|-------|---------|-------------|
| Design Argument | Random pair | Bond -0.3, designer score -1 or +1 (conflict sparks creativity) |
| Material Theft | Villain archetype | Steals 1 material from enemy tribe. If caught: massive heat |
| Creature Spook | Handler failure | Creature damages 1 material. Handler takes blame |
| Fitting Moment | Model + Designer | Bond +0.4, model presentation +1 |
| Inspiration Strike | Designer high roll | Double design score this beat. Teammates impressed |
| Fabric Fight | Two gatherers find same item | Physical check, loser gets nothing. Bond -0.5 |
| Creature Bond | Handler critical success | Creature bonds with handler — +3 cooperation for runway |
| Sabotage Frame | Villain catches material theft | Blames teammate. Framed player takes heat |

### Scoring
- `chalMemberScores`: Designer +3-6/beat, Model +2-4/beat, Handler +2-3/beat, Gatherers +1-3/beat
- Outfit quality = designer score + material quality average
- Creature outfit quality = designer score * 0.5 + creature cooperation

---

## Phase 3: Runway Show

**Duration**: 2 segments per tribe (model walk + creature walk)  
**Goal**: Host judges both outfits. Total score determines immunity winner.

### Runway Sequence

**Per tribe:**
1. Model walks the runway
2. Creature walks (or is dragged/carried) the runway
3. Host commentary + scoring

### Scoring Criteria (Host judges each 1-10)

| Criterion | Formula | Weight |
|-----------|---------|--------|
| Outfit Creativity | designer_score * 0.6 + material_quality * 0.4 + noise(1.5) | 25% |
| Theme Fit | strategic_alignment * 0.7 + material_thematic_match * 0.3 + noise(1.5) | 20% |
| Model Presentation | model_social * 0.4 + model_boldness * 0.3 + practice_score * 0.3 + noise(1.5) | 25% |
| Creature Cooperation | creature_coop_stat * 0.5 + handler_score * 0.3 + creature_outfit_quality * 0.2 + noise(2.0) | 30% |

**Creature Cooperation is weighted highest** because it's the wildcard — high risk/high reward choice matters here.

### Runway Events (during the walk)

| Event | Trigger | Effect |
|-------|---------|--------|
| Perfect Strut | Model high roll | Presentation +2, popularity +1 |
| Trip/Stumble | Model low roll | Presentation -2, popularity -1 |
| Creature Shows Off | High showmanship creature | Cooperation +2, crowd loves it |
| Creature Refuses | Low cooperation + bad roll | Cooperation -3, embarrassment |
| Creature Eats Outfit | Volatility check failed | Cooperation -5, outfit destroyed moment |
| Outfit Falls Apart | Low material quality + noise | Creativity -3, sabotage exposed if applicable |
| Crowd Gasps | Excellent outfit + high model | All scores +1, hero moment |

### Winner Determination
- Total score = sum of all 4 criteria (weighted)
- Tribe averages across members who contributed (per-member scoring)
- Winning tribe gets immunity
- Losing tribe goes to tribal council

---

## Phase 4: Creature Berserk (Optional — ~40% chance)

**Trigger condition**: Any creature with volatility >= 6 AND cooperation score during runway < 4

### Berserk Sequence

1. **Creature escapes** — kidnaps a random non-tribe-member (host, judge stand-in, or sit-out player)
2. **Rescue race** — both tribes send their fastest 2-3 players
3. **Rescue mechanics**:
   - Physical + boldness + endurance vs creature's volatility
   - 3 beats: track → chase → capture
   - Social events during chase (rivalry, helping, cowardice)

### Result Impact
- Rescue hero tribe gets a **score bonus of +5 to +10** (scaled to closeness of runway result)
- This CAN flip a result where the gap was < 8 points
- It CANNOT flip a blowout (gap > 15 points)
- Rescue hero player gets +5 chalMemberScores, +3 popularity
- If no rescue within 3 beats: host "handles it" offscreen, no flip

### Camp Event Injection
- `iib-berserk-rescue`: rescue hero credited
- `iib-berserk-blame`: handler of berserk creature takes heat from their tribe

---

## VP Identity: Fashion Magazine

**CSS prefix**: `pr-` (project-runaway)  
**Fonts**: Display serif (Playfair Display) + clean sans-serif (Inter/Lato)  
**Palette**: Rose gold, champagne, black, white, splash of creature-specific accent color

### Visual Primitives (unique to this challenge)
- **Fabric swatch cards** — event cards have textured backgrounds (linen, silk, denim patterns via CSS)
- **Spotlight stage** — runway events have radial gradient spotlight effect
- **Magazine rating badges** — scores shown as editorial star ratings
- **Creature portrait cards** — each creature type has a unique CSS-drawn silhouette
- **Material rack sidebar** — live-updating inventory of gathered materials per tribe
- **Runway walkway** — central visual element during Phase 3, with position markers

### Screen Structure
1. **Title Card** — challenge name, theme assignments, host intro
2. **Creature Hunt** — beat-by-beat scouting/chase/capture with creature reveal
3. **Design Studio** — role assignments, material gathering, design progress bar
4. **Runway Show** — model walk, creature walk, scoring breakdown, winner announcement
5. **Berserk Chase** (if triggered) — rescue race with result flip drama
6. **Final Results** — winner tribe, immunity, tribal council assignment

### Sidebar (live-updating)
- **Phase 1**: Creature tracker — which creatures are spotted/caught per tribe
- **Phase 2**: Material inventory + design progress meter + creature cooperation gauge
- **Phase 3**: Live scoring breakdown per criterion as it's revealed
- **Phase 4**: Rescue progress + score gap visualization

### Reveal System
- Standard `_tvState` with `idx: -1`, `_reapplyVisibility` pattern
- Each phase has its own screenKey
- Sidebar updates via innerHTML replacement on every reveal

---

## Scoring Balance

### Phase Contribution to chalMemberScores
- Phase 1 (Hunt): 0-8 per player
- Phase 2 (Build): 0-24 per player (across 4 beats)
- Phase 3 (Runway): 0-10 per player (model/handler get more)
- Phase 4 (Berserk): 0-5 per player (rescue only)

### Immunity winner bonus
Standard massive bonus: `maxOther + active.length + 5` — but applied to the MODEL of the winning tribe (face of the victory)

### Tribe scoring
Average per member, NEVER raw sums. Accounts for tribes of different sizes (sit-outs already excluded).

---

## Integration Checklist

Per CLAUDE.md "How to Create a New Twist Challenge":
1. `js/chal/project-runaway.js` — simulation + VP builders
2. `js/core.js` — TWIST_CATALOG entry
3. `js/twists.js` — engineType → flag mapping
4. `js/episode.js` — 7 integration points
5. `js/vp-screens.js` — screen registration
6. `js/text-backlog.js` — `_textTwistChallenge()` call
7. `js/main.js` — module import
8. `js/run-ui.js` — episode history badge

---

## Anti-Reuse Clause

This challenge's visual language must NOT be reused:
- Fabric swatch card textures are unique to Project Runaway
- Magazine-style rating badges belong here only
- Spotlight runway gradient is this challenge's signature
- Creature silhouette cards are challenge-specific CSS art
- No other challenge uses a "material rack" sidebar pattern

---

## Key Design Decisions

1. **Creature Cooperation is the highest-weighted score** — this ensures the creature-catching phase actually matters and creates tension between safe/boring creatures vs flashy/volatile ones
2. **Berserk is optional (40%)** — prevents the challenge from always having the same structure, adds replayability
3. **Berserk can flip close results only** — respects the runway as the primary determinant while giving underdogs a chance
4. **Sabotage exists but is punished** — villain archetypes can steal/spook but detection has real consequences (bonds, heat, camp events)
5. **Model role is high-stakes** — one player represents the tribe. Social butterflies/showmancers shine here.
