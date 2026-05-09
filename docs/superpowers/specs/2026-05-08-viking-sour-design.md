# Viking Sour — Challenge Design Spec

**Date:** 2026-05-08
**Phase:** Pre-merge only
**chalStyle:** `adventure`
**chalSeries:** `world-tour`
**Origin:** Total Drama World Tour S3E17 "Sweden Sour" (no real country names in narration)

---

## Overview

Three-phase pre-merge challenge. Tribes decipher shredded blueprints to build viking longships, launch and sail through icy waters, then engage in a naval battle with dual win condition: capture the flag or sink the enemy's boat. An advantage chain links each phase — Phase 1 winner gets flint for cannons, Phase 2 winner picks battle position.

---

## Phase 1: Blueprint Assembly

### Setup
Each tribe receives a pile of wooden pieces, allen keys, sledgehammers, and a stack of shredded blueprint fragments. Nobody knows what they're building.

### Mechanics

**Blueprint deciphering:** Each tribe starts at 0% clarity. Per round, each member attempts to piece together fragments:
- `mental * 0.4 + intuition * 0.3 + noise(2.5)` → fragment quality
- Tribe clarity accumulates across members each round

**Eureka moments:** When a player rolls `mental + intuition + noise(2.5) > 16`, they have a breakthrough ("IT'S A BOAT!"). Gives +25% clarity boost. Rare — expect 1-2 across all tribes total.

**Assembly progress:** Once clarity > 30%, tribes can start building. Per member build contribution:
- `physical * 0.4 + mental * 0.3 + teamwork_avg * 0.3`
- Higher clarity = more efficient building (fewer wasted pieces)

**Teamwork average:** Average bond score among all pairs within the tribe, normalized to 0-10: `(avg_bond + 10) / 2`. Social events during assembly directly affect this.

**Build quality:** Final score (0-100) based on clarity achieved + assembly efficiency. Carries forward as boat HP in Phase 3:
- Quality 80+ = sturdy (100 HP)
- Quality 50-80 = decent (75 HP)
- Quality <50 = leaky (50 HP)

### Social Events (2-3 per tribe)
- **Argument** — low-bond pair clashes over approach, costs build time. Bond -1 between them. Score: -2 both.
- **Sabotage** — villain hides pieces from another tribe. If caught (intuition check by victim tribe), score -5 for saboteur, bond hit. If uncaught, enemy tribe loses a build round.
- **Flirting distraction** — showmancer pair gets distracted mid-build. Score -3 for the distracted player. Bond +1 between pair.
- **Leadership clash** — two high-strategic players argue over approach. Loser determined by `strategic + social + noise(2.5)`. Loser: -2 score. Winner gets slight build speed boost.
- **Eureka credit steal** — schemer claims credit for someone else's eureka. Bond -2 between them. Pop -1 for schemer if caught.

### Winner
First tribe to reach 100% assembly progress. Reward: **flint rocks** (fire cannons from round 1 in Phase 3 + 3 bonus ammo).

### Scoring (chalMemberScores)
- Eureka moment: +10
- Assembly contribution: +3 to +8 based on individual build rolls
- Winning tribe: +5 bonus to all members
- Sabotage caught: -5
- Argument: -2 to both players
- Flirting distraction: -3
- Leadership clash loser: -2

---

## Phase 2: Launch & Sail

### Launch
Each tribe pushes their boat from frozen shore into the water.
- Per member: `physical * 0.5 + endurance * 0.3 + noise(2.5)`
- Tribe push force = sum of contributions
- Low build quality = heavier boat (higher push threshold)

**Ice break moment:** A bold/physical player can attempt a dramatic move to crack the ice and create a launch path.
- `boldness + physical + noise(2.5) > 12` = success, massive time save
- Failure = pratfall, minor time penalty. Score -3.
- Success: score +8.

### Sailing
3-segment race through icy waters to the battle zone.

**Per-segment speed:**
`(endurance_avg * 0.4 + physical_avg * 0.3 + build_quality * 0.3) + noise(2)`

Better boat = faster sailing.

### Wind/Current Events (1 per segment, random)
- **Favorable wind** — bonus speed, no stat check
- **Ice floe collision** — physical check to dodge. Failure = boat HP damage (5-10)
- **Current drag** — endurance check. Failure = time penalty
- **Whale sighting** — comedic narration, no mechanical effect

### Social Events (1-2 across the sail)
- **Alliance whispers** — two players bond while rowing. Bond +2. No score impact.
- **Seasickness** — low endurance player slows the tribe. Score -4.
- **Rivalry rowing** — two enemies row out of sync. Score -2 to both. Time penalty.
- **Captain encouragement** — high social player rallies crew. Speed boost for segment. Bond +1 to all pairs involving the encourager.

### Finish Order
- 1st arrival: picks battle position (closer to flag OR further from enemy cannons)
- Build quality carries forward as boat HP

### Scoring
- Ice break hero success: +8
- Ice break failure: -3
- Per-segment sailing contribution: +2 to +5 based on rolls
- Seasickness: -4
- Rivalry rowing: -2 to both

---

## Phase 3: Viking Naval Battle

### Setup
Tribes at starting positions on the water. Flag at a neutral midpoint. Dual win condition: **capture the flag** OR **sink the enemy's boat** (HP to 0).

**Max rounds: 12.**

### Cannon Mechanics
- Flint tribe (Phase 1 winner): can fire from round 1. 8-10 base ammo + 3 bonus = 11-13 total.
- Other tribes: must improvise fire each round. Per-member attempt: `mental * 0.4 + boldness * 0.3 + noise(2.5) > 6`. Success = cannons unlocked for that tribe permanently.
- Cannon accuracy: `physical * 0.3 + intuition * 0.4 + noise(2.5)`. Hit threshold varies by range.
- Ammo: 8-10 shots per tribe (without flint bonus).
- Damage per hit: 15-25 HP (with noise).
- Boat sinks at 0 HP.

### Round Structure
Each round: assign roles → fire cannons → sail progress → repair → social/battle event check → damage/sink check → flag grab check.

**Role assignment per member (AI-driven by archetype + stats):**
- **Sail** — contribute to flag progress
- **Fire cannon** — attempt to hit enemy
- **Repair** — restore boat HP

**Sail progress:** `physical_avg * 0.4 + endurance_avg * 0.3 + noise(2)` of assigned sailors. Accumulates until flag is reached.

**Repair:** `physical * 0.3 + mental * 0.3 + noise(2)` per repairer. Restores 5-15 HP per round.

**Flag grab:** When a tribe reaches the flag, one member attempts: `physical * 0.3 + boldness * 0.4 + noise(2.5) > 5`. Failure = flag slips, need another round.

### Battle Events (5-8 across the fight)

**Gameplay-only:**
- **Ram attempt** — tribe uses full sailing power to ram enemy. `physical_avg + endurance_avg + noise(3) > 12`. Hit = 30 HP to enemy, 10 HP self-damage. Miss = wasted round. Score: miss -3.
- **Weather squall** — sudden storm. Cannon accuracy -3 for 2 rounds. Both boats take 5 HP environmental damage. Endurance check to keep sailing progress.
- **Friendly fire** — low intuition + bad luck. Hits own mast. -10 HP self, lose 1 round sailing. Score -5.

**Gameplay + social:**
- **Boarding raid** — bold player leaps to enemy boat. `boldness + physical + noise(2.5) > 11`. Success = steal 2 ammo + sabotage next repair. Bond shift (respect or hatred) between raider and victim. Score: success +8, failure -4 (falls in water, out 2 rounds).
- **Flag interference** — swimmer jumps overboard to block enemy flag grab. `physical + endurance + noise(2.5)` vs grabber's roll. Delays capture 1 round. Bond +1 respect between the two.
- **Patch job genius** — high mental player invents creative repair from debris. Restores 25 HP (one-time per tribe). Bond +1 from grateful teammates.

**Gameplay + popularity:**
- **Human cannonball** — a high-boldness + high-physical player (`boldness > 7` AND `physical > 6`) volunteers to BE the ammo. 40 HP damage to enemy. Destroys boat if HP < 40. Player is injured (out of challenge). Pop +4, score +12.
- **Heroic shield** — hero/loyal player dives in front of cannon blast. Saves 20 HP. Player's stats halved for remaining rounds. Pop +3, score +6.
- **Flaming ammo** — tribe HP < 30% triggers desperation. Double damage but burns 2 ammo per shot. Pop +1 for courage.

**Social + popularity:**
- **Cowardly abandon post** — low boldness player panics, hides below deck. Out 2 rounds. Bond hit from disgusted teammates. Pop -2, score -6.
- **Battle cry rally** — high social player fires up crew. +2 bonus to ALL tribe actions next round. Bond +1 from rallier to crew.

**Strategy + social:**
- **Mutiny attempt** — if tribe avg bond < -2, a schemer tries to convince others to throw the challenge. `strategic + social + noise(2.5) > 13` and target's `loyalty < 5`. Success = tribe's sailing progress resets to zero. Failure = mutineer exposed, massive heat. Score: failure -8.
- **Cannon sabotage** — villain jams enemy's cannon (if close enough). Next enemy shot auto-misses. If caught (intuition check), schemer exposed. Bond hit + pop loss.

**Social only:**
- **Alliance pitch mid-battle** — with 3+ tribes, losing tribe proposes ceasefire to another. Bond check between tribe members. Success = temporary ceasefire, both focus the third tribe.

### End Conditions
- Tribe captures the flag → wins tribal immunity
- Boat sinks to 0 HP → that tribe loses, goes to tribal council
- Timeout after 12 rounds → closest to flag wins immunity, furthest goes to tribal
- With 3+ tribes: worst-performing tribe goes to tribal, others safe

### Scoring
- Cannon hit: +5
- Cannon miss: -1
- Flag grab success: +15
- Boarding raid success: +8
- Boarding raid failure: -4
- Human cannonball: +12
- Heroic shield: +6
- Repair contribution: +3 per round
- Sail contribution: +2 per round
- Friendly fire: -5
- Cowardly abandon: -6
- Mutiny failure: -8
- Ram miss: -3

---

## VP Theme

**Frozen viking longship aesthetic.** Icy blues, dark wood browns, runic gold accents. Phase-specific environments:
- Phase 1: Frozen workshop — wood shavings, blueprint fragments, torchlight
- Phase 2: Icy channel — cracking ice, northern lights, churning water
- Phase 3: Open sea battle — cannon smoke, splashing waves, burning ships

**Unique visual identity:** Runic CSS icons (hammer, shield, cannon, flag, longship). No emoji. Sidebar: live-updating ship HP bars, ammo counters, flag distance tracker. Map: top-down sea view with ship positions and flag.

---

## Integration

- **ID:** `viking-sour`
- **Phase:** `pre-merge`
- **chalStyle:** `adventure`
- **chalSeries:** `world-tour`
- **Files:** `js/chal/viking-sour.js` + standard 7-file integration
- **Incompatible with:** all other challenge twist IDs
- **Camp events:** blueprint arguments, sailing alliances, battle heroics — all with `players[]` + badge
- **Popularity:** eureka (+2), human cannonball (+4), heroic shield (+3), cowardly abandon (-2), sabotage caught (-1)
