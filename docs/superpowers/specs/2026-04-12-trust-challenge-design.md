# Who Can You Trust? Design

**Date:** 2026-04-12
**Inspired by:** Total Drama Island S1E11 "Who Can You Trust?"
**Type:** Schedulable challenge twist (pre-merge, tribe vs tribe)

---

## Overview

Three-round trust challenge. Chris deliberately pairs players for maximum drama — enemies, rivals, awkward combos. Each round is a different trust test (rock climb, fugu cooking, blind challenges). Pairs must negotiate roles, cooperate under pressure, and resist the temptation to sabotage. Stats drive the score, but bond + loyalty are significant bonuses that can swing outcomes. Low-temperament players crack under pressure. Hidden redemption moments create private bonds. The team that wins 2+ rounds wins immunity.

## TWIST_CATALOG Entry

```
id: 'trust-challenge'
emoji: '🤝'
name: "Who Can You Trust?"
category: 'challenge'
phase: 'pre-merge'
engineType: 'trust-challenge'
minTribes: 2
incompatible: [all other challenge twists]
```

---

## Pair Selection — Chris Picks for Entertainment

Chris assigns pairs to maximize drama variety across 3 rounds:

**Round 1 (Rock Climb) — Drama Pair:**
- Lowest bond pair on each tribe. Pure conflict. Will they sabotage or find common ground?
- If no pair has bond ≤ 1, pick the pair with the biggest archetype clash (villain+hero, schemer+loyal, etc.)

**Round 2 (Fugu Cook) — Wild Card Pair:**
- Showmance/spark pair (romantic tension under life-or-death cooking)
- OR archetype clash that isn't pure enemies (chaos-agent+mastermind, social-butterfly+loner)
- OR the most neutral pair (bond ~0, unknown chemistry — could go either way)

**Round 3 (Blind Challenges) — Remaining Players:**
- Use whoever hasn't competed yet. 3 blind sub-rounds need 3 pairs per tribe.
- 6-member tribe: 3 clean pairs (one per sub-round)
- 5-member tribe: 1 player reused in a second sub-round with a different partner
- 4-member tribe: 2 players reused
- 3-member tribe: everyone reused — all 3 possible pair combos used

No player repeats unless the tribe doesn't have enough members.

---

## Role Negotiation

Each trust test has 2 roles. The pair must figure out who does what.

```
negotiation = bond * 0.03 + avg_temperament * 0.04 + (10 - max_boldness) * 0.02 + random(0, 0.15)
```

**High negotiation (> 0.5):** Correct role assignment — best-stat player gets the matching role.

**Low negotiation (≤ 0.5):** Wrong assignment — ego clash or passive-aggression. The worse-stat player insists on the glory role.

**Events from negotiation:**
- Two high-boldness, low-temperament players → explosive argument (3-4 text variants)
- High bond → calm discussion ("You climb, I'll belay. I trust you.")
- Low bond + one high boldness → one player steamrolls the other
- Both low boldness → awkward silence, nobody wants to decide

---

## Round 1 — Extreme Rock Climb (Physical Trust)

**Roles:** Climber + Belayer

**Score:**
```
climbScore = climber.physical * 0.04 + climber.endurance * 0.03 + random(0, 0.12)
             + bond * 0.025 + belayer.loyalty * 0.02 + belayer.temperament * 0.015
```

**Obstacles (per-climber events, 2-3 fire per climb):**

| Obstacle | Trigger | Effect |
|---|---|---|
| Explosion | random 30% | Climber falls back. Endurance check to recover (+0.03 or -0.05) |
| Habanero spray | random 25% | Mental check to push through. Belayer can help (+bond bonus) or laugh |
| Oil slick | random 20% | Physical check to hold on. Fail = slip, time lost |
| Nail grab | random 15% | Pain moment. Endurance + temperament check. Low temp = screams, comedy |

**Belayer Sabotage (the Heather move):**
```
sabotageChance = (10 - loyalty) * 0.02 + (0 - bond) * 0.015 + (10 - temperament) * 0.01
```
Only fires if bond ≤ 0 AND archetype is villain/schemer/chaos-agent.
- Belayer drops the rope → climber falls, round auto-lost
- OR pulls the "second rope" humiliation (rips clothing) → climber humiliated, -0.1 score, massive bond crash -2.0, but +heat on saboteur
- Event: 3-4 text variants. "Heather smirks and lets go of the slack. Gwen plummets."

**Emotional State Debuff:**
Players who had a friend eliminated last episode, a showmance breakup, or a betrayal this season: -0.05 to their score. They can't focus.

---

## Round 2 — Fugu Sashimi (Food Trust)

**Roles:** Cook + Eater

**Cook Score:**
```
cookScore = cook.intuition * 0.04 + cook.mental * 0.03 + random(0, 0.12)
            + bond * 0.02 + cook.loyalty * 0.02
```

**Poisoning Check:**
```
poisonRisk = (10 - cook.mental) * 0.03 + (10 - cook.intuition) * 0.02 + random(0, 0.1)
```
If poisonRisk > 0.4 → eater gets food poisoned:
- `gs.lingeringInjuries[eater] = { ep, duration: 1, type: 'food-poisoned', penalty: 1.0 + random() }`
- Eater is incapacitated for the rest of the challenge (can't compete in round 3)
- Team auto-loses round 2

**Eater Trust/Hesitation:**
```
hesitation = (0 - bond) * 0.03 + (10 - boldness) * 0.02 + random(0, 0.1)
```
If hesitation > 0.4 → eater stalls, looks terrified:
- Boldness check to force themselves to eat. Fail = refuses to eat, auto-lose round 2.
- Success = eats despite fear, +0.3 bond with cook (overcoming distrust)

**Cook Sabotage:**
- Bond ≤ -1 AND villain/schemer: `(10 - loyalty) * 0.02` chance to deliberately botch it
- Not lethal but guarantees poisoning + extra bond crash
- Camp event: "Did they do that on purpose?"

**Events:**
| Event | Trigger | Effect |
|---|---|---|
| Perfect dish | cookScore > 0.6 | Eater is stunned. "This is actually... incredible?" Bond +0.4 |
| Suspicious eater | bond ≤ 0, eater sniffs food | Comedy moment. "You first." |
| Poisoning drama | poisonRisk fires | The Trent moment — face whack, screaming, collapse. Injury system. |
| Cook confidence | cook.intuition ≥ 7 | "Trust me, I know what I'm doing." Eater relaxes slightly. |
| Eater bravery | eater eats despite fear | Heroic moment. Bond +0.3, popularity +1. |
| Cook panic | cook.mental ≤ 4 | "Wait, which part is poisonous again?" Comedy + terror. |

---

## Round 3 — Three Blind Challenges (Blind Trust)

Best of 3 sub-rounds. New pair each sub-round (or reused if tribe is small). Each sub-round is an independent competition — tribe that wins 2+ sub-rounds wins round 3.

### 3a. Blind William Tell

**Roles:** Shooter (blindfolded) + Target (arrow on head)

**Score:**
```
tellScore = shooter.intuition * 0.03 + random(0, 0.2)
            + bond * 0.03 + shooter.loyalty * 0.025 + shooter.temperament * 0.015
```

High variance (random 0-0.2) — blindfolded shooting is mostly luck.

**Miss events:**
- Near miss → apple hits target's face. Bond -0.2, comedy
- Wild miss → shooter hits audience/animals/Chris. Comedy gold
- The Sadie moment: very low intuition + low temperament → shooter keeps firing after the round is over. Hits everything except the arrow. 3-4 text variants.

**Target trust:** Low bond target flinches/dodges, making it harder for shooter (+0.05 penalty to score).

### 3b. Blind Trapeze

**Roles:** Jumper (blindfolded, on platform) + Catcher (on trapeze, calls timing)

**Score:**
```
trapezeScore = catcher.physical * 0.03 + random(0, 0.15)
               + bond * 0.03 + catcher.loyalty * 0.025 + catcher.temperament * 0.015
```

**Communication quality:**
```
communication = bond * 0.04 + temperament * 0.03 + loyalty * 0.02
```
Low communication = bad timing call. Jumper falls in jellyfish pond.

**Events:**
| Event | Trigger | Effect |
|---|---|---|
| Perfect catch | score > 0.6 | Dramatic mid-air catch. Bond +0.4, crowd cheers |
| Bad timing | communication < 0.3 | Jumper falls in jellyfish. Minor injury. Bond -0.3 |
| Catcher sabotage | bond ≤ -1, villain archetype | Deliberately calls "jump" at wrong time. Auto-fail. Bond crash. |
| Trust leap | jumper.boldness ≥ 7 | Jumps without waiting for call. Either heroic or disastrous. |
| Frozen jumper | jumper.boldness ≤ 3 | Can't jump. Partner has to talk them through it. Time penalty. |

### 3c. Blind Toboggan

**Roles:** Driver (blindfolded) + Navigator (shouts directions)

**Score:**
```
tobogganScore = driver.physical * 0.03 + navigator.intuition * 0.03 + random(0, 0.15)
                + bond * 0.03 + loyalty * 0.025 + temperament * 0.015
```

**Explosions:** Random 20% chance per section of course. Driver has to react to navigator's warning. Low communication = hit the explosion (-0.08).

**Rule-Break Check (the DJ moment):**
```
ruleBreakChance = (10 - strategic) * 0.02 + emotionalTrigger * 0.15
```
Emotional trigger = player has an unresolved emotional event this episode (friend's pet, showmance drama, etc.)
- Driver removes blindfold → sees the emotional thing → instant disqualification EVEN IF THEY WERE WINNING
- Winning on the course + DQ = devastating dramatic reversal
- The pair was first but the rule break gives the win to the other team

---

## Hidden Moments (Private Bond Shifts)

Once per challenge, a **private moment** can fire for a player NOT competing in the current round:

**The Redemption Act:**
```
redemptionChance = loyalty * 0.02 + (10 - boldness) * 0.015 + random(0, 0.1)
```
Only fires for players with archetype villain/schemer/hothead/chaos-agent (unlikely candidates for kindness).
- The player secretly does something kind: helps an injured competitor, finds a lost item, covers for someone's mistake
- Only ONE other player witnesses it (highest intuition bystander)
- Private bond +0.5 between the kind player and the witness
- Creates asymmetric knowledge: witness knows the player has a soft side, player doesn't know they were seen
- Camp event: private confessional from the witness. "I saw what [name] did. Maybe they're not so bad."
- The kind player denies it if confronted: "Whatever. I don't know what you're talking about."

**The Witness Response** (archetype-flavored):
- If witness is hero/loyal: genuine respect. "I won't tell anyone."
- If witness is schemer/villain: files it as leverage. "Interesting. That could be useful."
- If witness has a showmance/spark with the kind player: romantic moment. "You're actually nice." → spark intensity +0.3

---

## Personal Scoring → `chalMemberScores` (podium/bomb tracking)

Every player gets a personal score accumulated across all rounds they participate in. Stored in `ep.chalMemberScores` and fed to `updateChalRecord(ep)` for top 3 (podium) / bottom 3 (bomb) tracking.

| Action | Score |
|---|---|
| Won a round (both pair members) | +2.0 |
| Lost a round | -0.5 |
| Correct role assignment (negotiation success) | +0.5 |
| Wrong role (ego clash) | -0.5 |
| Sabotaged partner | -2.0 + heat |
| Overcame distrust (hesitation → ate/jumped anyway) | +1.5 |
| Got poisoned | -1.0 |
| Got dropped/fell | -0.5 |
| Perfect catch/dish/climb | +1.5 |
| Wild miss (Sadie moment) | -1.0 but comedy |
| Rule break (DQ) | -2.0 |
| Redemption act (witness saw) | +1.0 (hidden) |
| Private bond moment | +0.5 |
| Spectator (didn't compete in any round) | +0.0 (neutral) |

**Balance target:** Players who competed in winning rounds avg ~3.0-4.0. Players who competed in losing rounds avg ~0.5-1.0. Saboteurs/DQ avg -1.0 to -2.0. Non-participants get 0 (no podium or bomb — they didn't play).

**MVP:** Highest personal score on winning team. +2 popularity.

---

## Winner Determination

Team that wins 2+ out of 3 rounds wins immunity.
- **3+ tribes:** Each tribe competes in each round. Best score per round = wins that round. Tribe with most round wins = winner. Tiebreak: total score across all rounds.
- **2 tribes:** Head-to-head per round.
- If a round is DQ'd (rule break), the other team wins that round automatically.
- If both teams DQ in the same round, lower penalty score wins.

---

## Heat Integration

`gs._trustHeat` — same `{ amount, expiresEp }` pattern.

| Source | Heat | Duration |
|---|---|---|
| Sabotaged partner (team lost) | +2.5 | 3 episodes |
| Sabotaged partner (team won anyway) | +1.0 | 1 episode |
| Rule break DQ (team lost because of it) | +2.0 | 2 episodes |
| Caused food poisoning deliberately | +2.0 | 2 episodes |
| Dropped partner on climb | +1.5 | 2 episodes |

---

## Events Pool (~35 types)

### Negotiation Events
| Event | Trigger | Text variants |
|---|---|---|
| Ego clash | both boldness ≥ 6 | "I'M climbing." "No, I'M climbing." Neither budges. |
| Calm discussion | bond ≥ 3, avg temperament ≥ 6 | They talk it through like adults. Rare. |
| Steamroll | one boldness ≥ 7, other ≤ 4 | One player takes over. The other quietly fumes. |
| Awkward silence | both boldness ≤ 4 | Nobody wants to decide. They stare at each other. |
| Strategic assignment | one strategic ≥ 7 | "You're better at this. I'll support." Optimal roles. |

### Climb Events
| Event | Trigger | 
|---|---|
| Explosion recovery | endurance check |
| Habanero spray | mental check |
| Oil slick slip | physical check |
| Belayer encouragement | bond ≥ 3 |
| Belayer distraction | bond ≤ 0 |
| Rope drop sabotage | villain + bond ≤ 0 |
| Humiliation pull | schemer + bond ≤ 0 |
| Heroic catch | belayer saves falling climber, bond +0.5 |
| Summit moment | climber reaches top, celebration/relief |

### Fugu Events
| Event | Trigger |
|---|---|
| Perfect dish | high cookScore |
| Suspicious eater | bond ≤ 0 |
| Poisoning collapse | poisonRisk fires |
| Cook confidence | intuition ≥ 7 |
| Eater bravery | ate despite fear |
| Cook panic | mental ≤ 4 |
| Deliberate botch | villain sabotage |
| "You first" standoff | both low boldness |

### Blind Challenge Events
| Event | Trigger |
|---|---|
| Perfect catch/hit | high score |
| Face hit (William Tell) | low score |
| Wild shooter (Sadie) | very low intuition + temperament |
| Jellyfish fall (trapeze) | bad communication |
| Trust leap | high boldness jumper |
| Frozen jumper | low boldness |
| Explosion dodge (toboggan) | navigator warning + driver reaction |
| Rule break DQ | emotional trigger |
| Navigator screaming | low temperament navigator |
| Wrong direction call | bond ≤ 0, navigator gives bad directions |

### Social/Drama Events
| Event | Trigger |
|---|---|
| Redemption act | villain does something kind |
| Witness moment | someone sees the redemption |
| Post-round argument | pair that lost, low temperament |
| Post-round bonding | pair that won, bond boost |
| Spectator reaction | watching players react to drama |
| "I told you so" | pair member who wanted the other role |
| Grudging respect | enemy pair that succeeded together |

---

## VP Screen — Overdrive

### Theme
Trust/danger aesthetic — split dual-tone backgrounds (one side per pair member), rope textures, blindfold overlays, trust/distrust visual language. Each round has its own sub-theme.

**Page background:** `linear-gradient(180deg, #060a14 0%, #0d1117 40%, #0a0d17 100%)` with subtle rope-pattern CSS overlay

### CSS Animations
```css
@keyframes trustGlow {
  0%, 100% { box-shadow: 0 0 0 rgba(56,189,248,0); }
  50% { box-shadow: 0 0 20px rgba(56,189,248,0.4); }
}
@keyframes distrustCrack {
  0% { opacity: 0; transform: scaleY(0); }
  50% { opacity: 1; transform: scaleY(1.2); }
  100% { opacity: 0.8; transform: scaleY(1); }
}
@keyframes ropeDrop {
  0% { transform: translateY(-30px); opacity: 0; }
  60% { transform: translateY(5px); opacity: 1; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes ropeSnap {
  0% { transform: translateY(0); }
  20% { transform: translateY(-10px); }
  100% { transform: translateY(80px); opacity: 0; }
}
@keyframes climbUp {
  0% { transform: translateY(20px); opacity: 0.5; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes poisonPulse {
  0%, 100% { filter: hue-rotate(0deg); }
  50% { filter: hue-rotate(80deg) brightness(0.8); }
}
@keyframes blindfoldReveal {
  0% { clip-path: inset(0 0 0 100%); }
  100% { clip-path: inset(0 0 0 0); }
}
@keyframes jellyZap {
  0%, 100% { opacity: 0.3; }
  10%, 30%, 50% { opacity: 1; text-shadow: 0 0 8px #38bdf8; }
  20%, 40% { opacity: 0.5; }
}
@keyframes tobogganShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px) rotate(-1deg); }
  75% { transform: translateX(4px) rotate(1deg); }
}
@keyframes trustBuild {
  0% { width: 0; }
  100% { width: var(--trust-pct); }
}
@keyframes secretGlow {
  0%, 100% { box-shadow: 0 0 0 rgba(250,204,21,0); border-color: rgba(250,204,21,0.2); }
  50% { box-shadow: 0 0 20px rgba(250,204,21,0.15); border-color: rgba(250,204,21,0.5); }
}
```

### Page Structure

1. **Header** — "WHO CAN YOU TRUST?" in cyan (#38bdf8) with `trustGlow` animation. Rope-textured divider below. Subtitle: tribe matchup.

2. **Pair Reveal Cards** — per round, dramatic pair reveal:
   - Split card: left portrait vs right portrait with a **crack** or **chain** between them
   - **Enemy pairs** (bond ≤ 0): red crack line between portraits with `distrustCrack` animation. Text: "Chris pairs the rivals."
   - **Neutral pairs** (bond 1-3): grey chain link. Text: "Chris picks an interesting combo."
   - **Allied pairs** (bond ≥ 4): blue chain with glow. Text: "Can trust survive the test?"
   - **Trust meter bar** under each pair: animated gradient from red → yellow → green based on `bond * 0.05 + loyalty * 0.04`. Uses `trustBuild` animation on reveal.
   - Role badges appear below portraits with `ropeDrop` animation: 🧗 CLIMBER / 🪢 BELAYER, 🔪 COOK / 😰 EATER, etc.

3. **Round Sections** (click-to-reveal, each with its own visual theme):

   **ROUND 1 — EXTREME ROCK CLIMB:**
   - Rocky cliff background gradient (dark brown → grey)
   - Events use `climbUp` animation as they appear
   - Sabotage event: `ropeSnap` animation on the rope between portraits — the visual connection breaks
   - Obstacle events: small explosion/oil/pepper emoji effects
   - Summit success: portraits rise to top with `climbUp`, green glow

   **ROUND 2 — FUGU SASHIMI:**
   - Kitchen/danger background (dark with subtle green poison tint)
   - Cook events: plate emoji with steam
   - Poisoning event: eater portrait gets `poisonPulse` animation — green tint pulsing
   - "You first" standoff: both portraits face each other with question marks
   - Perfect dish: golden plate reveal

   **ROUND 3 — BLIND CHALLENGES:**
   - Dark background with blindfold motif (horizontal stripe overlay at 30% opacity)
   - Sub-round headers: 🎯 BLIND WILLIAM TELL / 🎪 BLIND TRAPEZE / 🛷 BLIND TOBOGGAN
   - Blind events use `blindfoldReveal` — content slides in from behind a "blindfold" clip-path
   - Jellyfish fall: `jellyZap` animation on the portrait (electric blue flashes)
   - Toboggan events: `tobogganShake` on the event card
   - Rule break DQ: red X stamp slams over the winning result. `distrustCrack` animation.
   - Wild shooter (Sadie moment): apple emojis flying in random directions (CSS scatter)

4. **Round Result Cards:**
   - Split comparison: left tribe vs right tribe
   - Winner side glows green (`trustGlow`), loser side dims
   - Score numbers animate in with `scoreReveal` (reuse from Hell's Kitchen)
   - Key moment quote in italic below

5. **Hidden Moment Card** (if redemption fired):
   - Gold border with `secretGlow` animation (pulsing warm glow)
   - "🔒 PRIVATE MOMENT — Only [witness] saw this"
   - Two portraits: the kind player + the witness
   - Event text in warm gold (#fbbf24)
   - Feels different from all other cards — quiet, intimate, secret

6. **Final Scoreboard:**
   - Rounds won displayed as large checkmarks (✓) or X marks per tribe
   - 2/3 or 3/3 = winner celebration
   - Loser tribe: "TRIBAL COUNCIL" stamp
   - MVP spotlight card with trust theme (chain link emoji)

7. **NEXT / REVEAL ALL buttons** — `rp-btn` class, sticky bottom

### Card Design Details

**Trust Meter (on pair cards):**
```
┌─────────────────────────────────┐
│  [Portrait A]  ⛓️  [Portrait B]  │
│   CLIMBER          BELAYER       │
│                                  │
│  TRUST: ████████░░░░ 65%         │
│         red    yellow   green    │
│                                  │
│  "Chris pairs the rivals..."     │
└─────────────────────────────────┘
```

**Sabotage Card:**
```
┌──────────────────────────────────┐
│  ⚠️ SABOTAGE                      │
│                                   │
│  [Portrait A]  💔  [Portrait B]   │
│     ~~rope snaps animation~~      │
│                                   │
│  "Heather smirks and lets go     │
│   of the slack. Gwen plummets."  │
│                                   │
│  Bond: -2.0 | Heat: +2.5         │
└──────────────────────────────────┘
```

**Poisoning Card:**
```
┌──────────────────────────────────┐
│  ☠️ FOOD POISONING                │
│                                   │
│  [Portrait - green pulse anim]    │
│                                   │
│  "Trent bites in. Hits himself.  │
│   Screams. Laughs. Turns pale.   │
│   Collapses."                     │
│                                   │
│  Injury: 1 episode | Round lost   │
└──────────────────────────────────┘
```

**Rule Break DQ Card:**
```
┌──────────────────────────────────┐
│  ❌ DISQUALIFIED                   │
│                                   │
│  [Winning score]  ← VOIDED       │
│     ~~red X stamp animation~~     │
│                                   │
│  "DJ removes his blindfold.      │
│   They won the race — but broke  │
│   the one rule that mattered."    │
│                                   │
│  Other team wins by default.      │
└──────────────────────────────────┘
```

---

## Camp Events

**Positive:**
- Trust Built (pair that overcame low bond to win)
- Redemption Witness (private moment camp event)
- Bravery Award (eater who ate despite fear)
- Perfect Catch (blind trapeze hero)

**Negative:**
- Saboteur (dropped partner, botched food, bad timing)
- Rule Breaker (DQ'd the team)
- Wild Shooter (Sadie moment — hit everyone)
- Poisoner (caused food poisoning)
- Ego Clash (wrong role assignment cost the round)

---

## Episode History

```
ep.isTrustChallenge = true
ep.trustChallenge = {
  pairs: { tribeName: { round1: [a,b], round2: [a,b], round3a: [a,b], round3b: [a,b], round3c: [a,b] } },
  roles: { tribeName: { round1: { climber, belayer }, round2: { cook, eater }, ... } },
  negotiation: { tribeName: { round1: { score, correct, event }, ... } },
  roundScores: { tribeName: { round1: score, round2: score, round3a: score, round3b: score, round3c: score } },
  roundWinners: { round1: tribeName, round2: tribeName, round3: tribeName },
  events: [],
  timeline: [],
  sabotage: [],
  poisoned: [],
  ruleBreak: null,
  redemption: null,
  winner, loser, mvp
}
```

---

## Text Backlog

`_textTrustChallenge(ep, ln, sec)` — pair assignments, role negotiation results, per-round events + scores, blind sub-round results, final result.

## Cold Open Recap

Winner, any sabotage, any poisoning, any rule-break DQ, redemption moment if any.

## Timeline Tag

`tcTag` — "Trust Challenge" in cyan (#38bdf8).

## Debug Challenge Tab

Pair assignments with bond/loyalty values, negotiation scores, per-round raw scores + trust modifiers, event log, personal score breakdown.

---

## Edge Cases

- **3+ tribes:** Each tribe competes independently per round. Best score wins the round.
- **3-member tribe:** All 3 pair combos used across rounds. Everyone competes twice.
- **Poisoned player can't compete in round 3:** Tribe has fewer available players. Remaining players fill in.
- **Both pairs sabotage in same round:** Both auto-lose. Round declared a draw. Neither gets a point.
- **Rule break on round 3c with team winning 2-0:** The DQ doesn't matter — team already won 2 rounds. DQ only matters if the round matters.
- **Balanced scoring:** Trust modifiers ensure pairs with good bonds have an edge but stats still matter. Neither dominates.
