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

### Climb Events (Deep Consequences)

| Event | Trigger | Deep Consequence |
|---|---|---|
| Explosion recovery | random 30%, endurance check | **Pass:** climber pushes through, +0.5 personal score, belayer impressed → bond +0.2. **Fail:** climber falls, belayer's reaction matters — high loyalty belayer catches them (bond +0.3), low loyalty belayer lets them dangle (bond -0.2). The catch/drop moment defines the pair's relationship going forward. |
| Habanero spray | random 25%, mental check | **Pass:** climber doesn't flinch, belayer gains respect. **Fail:** climber screams, grabs face, loses grip. Belayer's bond determines if they pull slack tight (saves them, bond +0.3) or laugh ("Not my problem"). Low temperament belayer might snap at Chris instead of helping. |
| Oil slick slip | random 20%, physical check | **Pass:** climber adjusts grip, keeps climbing. **Fail:** climber slides down. If belayer is paying attention (loyalty ≥ 5) → caught safely. If belayer is distracted (bond ≤ 0 or strategic ≥ 7 — thinking about the game instead of the rope) → climber hits the ground. Bond crash -0.5 + injury risk. |
| Belayer encouragement | bond ≥ 3 | Belayer shouts genuine encouragement. "You've got this! Keep going!" Climber gets +0.05 score boost. Bond +0.2. This moment gets referenced at tribal: "You were there for me on that wall." Becomes an alliance seed. |
| Belayer distraction | bond ≤ 0 | Belayer checks their nails, talks to spectators, looks bored. Climber notices. Bond -0.2. If climber falls during this → belayer reacts late, barely catches them. Camp event: "I saw you not paying attention. I was up there trusting you." Creates a tribal talking point. |
| Rope drop sabotage | villain/schemer + bond ≤ 0 | Belayer deliberately lets the rope go slack. Climber falls. Auto-lose round. Bond crash -2.0. Heat +2.5 for 3 episodes. BUT: the saboteur's own tribe reacts by archetype. Villains approve (+0.2 bond with other villains). Heroes/loyals are disgusted (-0.3 bond). Creates a tribal council wedge: "Do we vote out the saboteur or the person who provoked it?" |
| Humiliation pull | schemer + bond ≤ -1 | The Heather move — belayer pulls a second rope that embarrasses the climber (clothing rip, paint splash, etc.). Climber is humiliated but NOT dropped. Score -0.1, climber bond -1.5 with belayer. BUT: +3 popularity for the victim (sympathy) and -2 popularity for the saboteur. Camp event: everyone talks about it. The humiliator becomes the villain of the episode. Tribal target unless they have numbers. |
| Heroic catch | belayer saves falling climber after obstacle | Climber falls, belayer digs in and holds. The rope burns their hands but they don't let go. Bond +0.5. Climber: "You actually saved me." Belayer: "Don't make it weird." This is the moment enemies become allies. If the pair had bond ≤ 0 before this → camp event: "grudging respect." The save gets referenced in future episodes as a trust anchor. +1.5 personal score for belayer. |
| Summit moment | climber reaches top | If pair was enemies: "I didn't think you'd hold the rope." "I almost didn't." Bond +0.3 from shared adversity. If pair was friends: celebration, high-five at the bottom. If sabotage happened earlier in the climb: climber reaches top DESPITE the sabotage → hero moment, +2 popularity, saboteur exposed as petty. |

### Fugu Events (Deep Consequences)

| Event | Trigger | Deep Consequence |
|---|---|---|
| Perfect dish | cookScore > 0.6 | Eater takes a bite, eyes widen. "This is... actually incredible?" The moment redefines the pair. Bond +0.4. If they were enemies: "I hate that you're good at this." Camp event: unlikely compliment. If cook is a villain/schemer: reveals hidden competence — they're not just scheming, they have skills. Changes how others perceive them. |
| Suspicious eater | bond ≤ 0, eater sniffs food | Eater picks up the dish, smells it, pokes it with a fork. "You first." Cook: "It's fine!" Eater: "Then YOU eat it." Standoff. If cook eats a bite first (loyalty ≥ 6) → eater relaxes, bond +0.3. If cook refuses → eater's suspicion deepens, bond -0.3. Spectators watch and form opinions about who's trustworthy. |
| Poisoning collapse | poisonRisk > 0.4 | The Trent moment. Eater takes a bite → face whack → screams → laughs → turns pale → collapses. Injury system: 1-2 episodes of lingering sickness. Eater can't compete in round 3. If cook TRIED their best (loyalty ≥ 5): "I'm so sorry, I tried!" Bond +0.1 (honest failure). If cook was negligent (mental ≤ 4): bond -0.5, camp event: "They almost killed me and they don't even care." If deliberate: see sabotage below. |
| Cook confidence | cook intuition ≥ 7 | "Trust me. I know exactly what I'm doing." Cook works with precision. Eater watches, impressed. If cook actually delivers (high score): eater gains lasting trust → bond +0.3 + camp event about competence. If cook was confident but dish is mediocre: "All that confidence and THIS is what you made?" Bond damage proportional to how confident they were. |
| Eater bravery | hesitation check passed despite fear | Eater is visibly terrified but eats anyway. "If I die, you're going home next." Takes the bite. If dish is good → bond +0.4, +1 popularity for bravery. The pair earned each other's respect through mutual risk. If dish is bad but not poisonous → "I can't believe I trusted you." Bond -0.3 but +0.5 popularity (they were brave even though it sucked). |
| Cook panic | cook mental ≤ 4 | "Wait... which part is poisonous again?!" Cook stares at the fish with terror. Eater: "YOU DON'T KNOW?!" Low temperament eater may storm off (auto-lose). High temperament eater talks cook through it (bond +0.3, coach moment). If cook panics AND eater helps → the EATER saves the dish. Role reversal. +1.5 personal for eater. |
| Deliberate botch | villain/schemer + bond ≤ -1 | Cook intentionally prepares it wrong. Not to kill — to make them sick enough to suffer. Guarantees poisoning. Bond crash -2.0. Heat +2.0 for 2 episodes. Camp event: "Did they poison them on purpose?" Other players' reactions depend on their bond with the cook: allies look away, enemies demand accountability. Creates a tribal storyline about whether the cook can be trusted. |
| "You first" standoff | both boldness ≤ 4 | Neither wants to eat the fish. Neither wants to cook it. They stand there, staring at each other, while the other team finishes. Comedy moment but real consequences: time penalty on score -0.05. Low temperament player eventually snaps: "FINE, I'll do it!" and grabs the knife. The one who breaks first gets +0.5 personal score for stepping up. |

### Blind Challenge Events (Deep Consequences)

| Event | Trigger | Deep Consequence |
|---|---|---|
| Perfect hit (William Tell) | high tellScore | Shooter knocks the arrow clean off. Target doesn't flinch. Pure trust. Bond +0.4. "I told you I wouldn't miss." Camp event: becomes a trust reference for the rest of the season. The pair is now a proven unit. |
| Face hit | low tellScore | Apple hits the target's face instead of the arrow. Target recoils in pain. Shooter: "Are you okay?!" or "Oops" (temperament determines reaction). Bond -0.3 if shooter seems to not care. +0.1 if genuinely sorry. Comedy moment but the target remembers — camp event: "You hit me in the face and LAUGHED." |
| Wild shooter (Sadie moment) | intuition ≤ 3 + temperament ≤ 4 | Shooter keeps firing after the round is called. Hits target, spectators, animals, Chris. Nobody is safe. Comedy gold but -1.0 personal score. Target loses ALL trust: bond -0.5. Camp event: everyone references it. "Remember when Sadie almost killed everyone?" Becomes that player's defining moment. Spectators who got hit: bond -0.2 with shooter. |
| Perfect catch (trapeze) | high trapezeScore | Dramatic mid-air catch. Jumper lands in catcher's arms. Moment of genuine trust. Bond +0.5. If showmance pair: romantic moment → spark intensity +0.3, `_challengeRomanceSpark`. If enemies: "I can't believe you actually caught me." Grudging respect that shifts the entire dynamic. |
| Jellyfish fall | communication < 0.3 | Catcher calls "JUMP!" at the wrong time. Jumper leaps into jellyfish-filled water. Electric stings, screaming, comedy. Minor injury (1 ep, low penalty). Bond -0.4. BUT: if catcher is genuinely sorry (loyalty ≥ 6, temperament ≥ 5) → helps pull them out → partial bond recovery +0.2. If catcher LAUGHS → bond crash -0.8. Camp event: "You dropped me in JELLYFISH." Tribal ammunition. |
| Catcher sabotage (trapeze) | villain + bond ≤ -1 | Deliberately calls jump at the wrong time. Jumper falls in jellyfish. Auto-fail. Same heat/bond consequences as rope drop sabotage. The visual: the catcher watches the jumper fall and doesn't move. Everyone sees it. Heat +2.0. |
| Trust leap | jumper boldness ≥ 7 | Jumper doesn't wait for the call. Just jumps. If catcher was ready → perfect catch, bond +0.5, "You PSYCHO!" + laughter. If catcher wasn't ready → miss, jellyfish. The jumper's boldness either creates a legendary moment or a catastrophe. Either way, it's compelling. |
| Frozen jumper | jumper boldness ≤ 3 | Can't jump. Stands on the platform frozen. Catcher has to talk them down. "I'll catch you. I promise." If bond ≥ 2: eventually jumps, bond +0.3 (trust earned). If bond ≤ 0: "Why would I trust YOU?" Refuses. Time penalty. The refusal is honest — and it reveals how broken the pair is. Camp event: the frozen moment is discussed. |
| Explosion dodge (toboggan) | random 20%, communication check | Navigator screams a direction. Driver reacts. High communication → dodge, score +0.03. Low communication → hit, score -0.08. Low temperament navigator screams contradicting directions: "LEFT! NO, RIGHT! NO, LEFT!" Driver ignores them → crashes OR trusts them → survives. The chaos of blind trust. |
| Rule break DQ | emotional trigger | The DJ/Bunny moment. Driver removes blindfold because something emotional happens (sees a friend hurt, hears a showmance partner, etc.). They were WINNING — but the DQ voids everything. Bond with partner: partner WANTED to win but the driver chose something personal over the game. Strategic partner: bond -0.5 ("You cost us the win for THAT?"). Loyal/hero partner: bond +0.3 ("I get it. Some things matter more."). Creates a tribal debate: was it selfish or noble? |
| Navigator screaming | temperament ≤ 3 | Navigator loses it. Screams every direction at once, panics, can't communicate clearly. Driver is navigating blind with a screaming partner. Score -0.05. Comedy moment. Low temperament navigator + low bond driver = driver ignores navigator entirely and steers by instinct (physical check). |
| Wrong direction (sabotage) | bond ≤ 0, navigator intentionally misleads | Navigator gives deliberately bad directions. "Turn LEFT" when they should turn right. Driver crashes. If driver realizes (intuition ≥ 6): "You did that on purpose." Bond crash -1.0. If driver doesn't realize: blames themselves. Navigator gets away with it — until someone reviews the footage at camp. Delayed bond crash next episode. |

### Social/Drama Events (Deep Consequences)

| Event | Trigger | Deep Consequence |
|---|---|---|
| Redemption act | villain/schemer/hothead does something kind during round they're not competing in | See Hidden Moments section above. The key: this creates ASYMMETRIC information. The witness knows something nobody else does. This becomes leverage, blackmail, or genuine connection depending on the witness's archetype. The kind player's reputation doesn't change publicly — only privately with the witness. |
| Witness moment | highest-intuition bystander sees the redemption | The witness's reaction depends on THEIR archetype, not the redeemer's. Hero witness: quiet respect, won't exploit it. Schemer witness: files it for later. Showmance witness: sees a new side of them, spark grows. This is a slow-burn narrative seed that pays off episodes later. |
| Post-round argument | pair that lost, at least one temperament ≤ 4 | The losing pair explodes at each other. "This is YOUR fault." "MY fault? You couldn't even hold a ROPE." Bond -0.5. Other tribe members pick sides — allies of each player back their friend, creating a camp rift. If the argument gets physical (both temperament ≤ 3, both boldness ≥ 6): someone has to break it up. Camp event: "The fight after the trust challenge." |
| Post-round bonding | pair that won, bond started below 2 | The unexpected part: enemies who succeed together bond MORE than friends who succeed. The surprise of working together overcomes the hostility. Bond +0.5 (higher than normal win bonus). Camp event: "I didn't think we could do it." "Neither did I." Creates a new alliance possibility from a pair nobody expected. |
| Spectator reaction | watching players react to key moments | Players on the sideline react to what they see. If they watch a sabotage: bond -0.3 with the saboteur. If they watch a heroic catch: bond +0.2 with the hero. If they watch a poisoning: fear of the cook. Spectator reactions create SECONDARY bond changes that ripple through the tribe. |
| "I told you so" | pair member who argued for the other role assignment, and their role assignment failed | "I SAID I should climb. But no, you had to be the hero." Bond -0.3. If the arguer was right (their stats were better for the role): +0.5 personal score, camp event about being ignored. If the arguer was wrong (they would have done worse): the other player fires back and the arguer loses credibility. |
| Grudging respect | enemy pair (bond ≤ 0) that won their round | The most powerful social event. Two people who hate each other just proved they can work together. Bond +0.5. The grudging respect isn't friendship — it's acknowledgment. "I don't like you. But you held the rope." Camp event: other players notice the shift. Alliance possibilities open. If either player is a schemer: they file this as useful information for later. |

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
