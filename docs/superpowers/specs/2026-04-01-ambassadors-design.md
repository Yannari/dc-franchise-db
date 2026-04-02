# Ambassadors Twist — Design Spec

## Overview

Koh-Lanta-style pre-merge twist. Each tribe names one ambassador. Ambassadors meet privately and must agree on one player to eliminate. If they can't agree, one ambassador is eliminated via rock draw. Fires on the merge episode, before the merge itself.

Supports **2 tribes** (1v1 negotiation) and **3+ tribes** (majority-rules negotiation with coalition dynamics).

Schedulable twist: `id: 'ambassadors'`, `phase: 'pre-merge'`, `engineType: 'ambassadors'`.

## Trigger

Fires on the merge episode (when `_willMerge` is true), before the immunity challenge. Requires 2+ tribes with 2+ members each.

## Episode Flow

```
Ambassador Selection → Ambassador Meeting → Elimination OR Rock Draw → Merge → Challenge → Camp → Tribal → Votes
```

The ambassador elimination happens FIRST. The eliminated player never merges.

## Ambassador Selection

Each tribe selects one ambassador. Score per player:

```
ambassadorScore = social * 0.3 + strategic * 0.3 + avgBondWithTribe * 0.4 + (Math.random() * 1.0)
```

- `avgBondWithTribe`: average bond with all tribemates. Trusted players score higher.
- Small randomness so it's not 100% predictable.
- The highest-scoring player on each tribe becomes ambassador.

**Selection camp events** (one per tribe, fires before the meeting):
- Who was picked and why — personality-driven text
- Tribe's reaction: confident ("we're sending our best") or nervous ("this could go wrong")
- The passed-over player who wanted to go but wasn't picked: slight bond hit if they feel snubbed

## Ambassador Meeting — Negotiation

The two ambassadors meet privately. The negotiation outcome depends on their personalities.

### Negotiation Archetypes (determined by stats + archetype)

Each ambassador is categorized:

- **Manipulator**: `(archetype === 'schemer' || archetype === 'mastermind') && strategic >= 7`  
  OR `strategic >= 8 && loyalty <= 4`
- **Villain**: `archetype === 'villain'` OR `boldness >= 8 && loyalty <= 3`
- **Dealmaker**: `strategic >= 6 && social >= 5 && !manipulator && !villain`
- **Loyal Shield**: `loyalty >= 7 && social >= 5`
- **Emotional Pitch**: `social >= 7 && strategic < 6`

Priority: Manipulator > Villain > Dealmaker > Loyal Shield > Emotional Pitch (first match wins).

## 3+ Tribe Mechanics

When 3+ tribes exist, all ambassadors meet simultaneously.

### Majority Rules
- Ambassadors need a **majority** (2 out of 3, 3 out of 4, etc.) to agree on a target
- Two ambassadors can team up against the third — the third tribe's member goes home
- This creates a natural "two vs one" dynamic where each ambassador tries not to be the odd one out

### Coalition Formation
Each ambassador evaluates the others. For each possible coalition partner:
```
coalitionScore = bond * 0.3 + strategicAlignment * 0.3 + sharedEnemyBonus * 0.2 + Math.random() * 0.2
```
- `strategicAlignment`: both want the same target type (highest threat, personal enemy, etc.)
- `sharedEnemyBonus`: +0.3 if both dislike the same potential target

The two ambassadors with the highest mutual coalition scores pair up. The third is isolated.

### The Odd One Out
The isolated ambassador has two options:
- **Counter-offer**: propose a different target to break the coalition. Chance: `social * 0.06 + strategic * 0.04`. If successful, new coalition forms.
- **Accept**: go along with the majority. Bond -0.5 with the coalition (resentment).
- **Refuse**: if the isolated ambassador won't accept AND can't counter → rock draw among ALL ambassadors.

### Target Selection (3+ tribes)
The coalition picks a target from the **isolated ambassador's tribe** (proportional to threat score). The isolated ambassador can counter-propose someone from a coalition tribe — but needs to flip one coalition member.

### Rock Draw (3+ tribes)
If no majority forms: rock draw among ALL ambassadors. One eliminated at random.

---

### Negotiation Outcomes — All 15 Pairings (2-Tribe Mode)

Each pairing sets the INITIAL dynamic — who has the natural advantage in the room. But the actual outcome is **stat-resolved**: the archetype sets the stage, stats + bonds + rolls determine what actually happens. A Manipulator USUALLY controls the Emotional Pitch — but a bold, high-temperament Emotional player can resist. Nothing is guaranteed.

**Resistance check** — whenever one ambassador tries to dominate the other:
```
resistChance = defender.boldness * 0.06 + defender.temperament * 0.04 + (10 - attacker.social) * 0.02
```
If resistance fires: the dynamic flips. The "weaker" archetype stands their ground. The narrative changes from domination to standoff.

---

#### 1. Manipulator vs Manipulator
- Mutual recognition. Neither can outplay the other. Cold, calculated negotiation.
- Target: highest threat score across both tribes that neither is bonded with (>= 3).
- Agreement: high (~75%). `0.4 + avgStrategic * 0.04`. Both are rational enough to deal.
- Bond: mutual respect +0.3 between ambassadors. Neither trusts the other but both respect the game.
- Narrative: chess match. Both see through each other's tactics. The deal is clean — but neither turns their back walking away.

#### 2. Manipulator vs Villain
- Initial dynamic: the manipulator tries to steer the villain's anger toward a useful target. The villain wants blood, the manipulator wants strategy.
- **Resistance check (villain resisting manipulation):** `villain.boldness * 0.06 + villain.intuition * 0.04`. High boldness villains see through it.
- If villain resists: power struggle → agreement drops to `0.1 + bond * 0.05`. Likely rocks.
- If villain doesn't resist: manipulator redirects the villain's rage. Agreement: `0.2 + manipulator.strategic * 0.05 + bond * 0.08`.
- If agreed: target is the villain's enemy BUT the manipulator chose WHICH enemy.
- Bond: manipulator -0.3 with villain (the villain senses something). Villain +0 (got a kill).
- Narrative: the manipulator speaks calmly. The villain speaks loudly. One of them is in control — and it's not always the one who thinks they are.

#### 3. Manipulator vs Dealmaker
- Initial dynamic: the manipulator tries to twist "fair" to serve themselves. The dealmaker wants logic.
- **Resistance check (dealmaker seeing through it):** `dealmaker.intuition * 0.05 + dealmaker.strategic * 0.03`. Smart dealmakers catch the manipulation.
- If dealmaker sees through it: negotiation resets to Dealmaker vs Dealmaker dynamic. Honest deal. Manipulator's agenda exposed.
- If not: the manipulator's target gets framed as the "logical choice." Agreement: `0.3 + bond * 0.08 + manipulator.social * 0.03` (~70%).
- Bond: if caught: dealmaker -0.5 with manipulator. If not: dealmaker +0.2 (thinks it was fair).
- Narrative: the manipulator frames everything as strategy. The dealmaker either nods along — or stops mid-sentence and says "Wait. That's not what's happening here."

#### 4. Manipulator vs Loyal Shield
- Initial dynamic: the manipulator tries to logic the loyal player into betraying their tribe.
- **Resistance check (loyalty holding firm):** `loyalShield.loyalty * 0.07 + loyalShield.temperament * 0.03`. High loyalty = very hard to break.
- If loyal shield resists: rocks. The manipulator hit an immovable wall. Loyal shield +0.5 with own tribe (stood firm).
- If loyalty cracks: agreement `0.15 + manipulator.strategic * 0.05 + bond * 0.06`. Target is from the loyal shield's tribe. Devastating betrayal.
- Bond: if cracked: loyal shield -1.5 with eliminated tribemate's closest ally. Manipulator +0.5 with own tribe.
- Narrative: the manipulator chips away at the loyalty. Finds the crack — or doesn't. When loyalty holds, the manipulator hits a wall they can't talk through and both know what comes next.

#### 5. Manipulator vs Emotional Pitch
- Initial dynamic: the manipulator exploits feelings as leverage. The most insidious pairing.
- **Resistance check (emotional player seeing through it):** `emotional.intuition * 0.05 + emotional.boldness * 0.04 + emotional.temperament * 0.02`. Perceptive or bold emotional players can sense the fakeness.
- If emotional resists: the emotional player calls out the manipulation. "You don't actually care about this — you're using me." Negotiation resets to neutral. Agreement: `0.2 + bond * 0.08`. Emotional player +0.3 self-respect.
- If not: the manipulator mirrors their energy, matches vulnerability with fake openness. Agreement: `0.25 + manipulator.social * 0.04 + bond * 0.1`. Target: manipulator's choice, framed emotionally.
- Bond: if manipulated: +0.3 in the moment, -0.5 next episode when they realize (camp event: "I got played"). If resisted: -0.3 with manipulator (trust broken).
- Narrative: the manipulator mirrors the emotional player's energy. The emotional player feels heard — genuinely or deceptively. The truth comes out later.

#### 6. Villain vs Villain
- Two villains. Two agendas. Pure power struggle. Neither compromises.
- Agreement: very low (~15%). Only if they share a common enemy (`both have bond <= -2 with someone`). `0.05 + sharedEnemyBonus * 0.3`.
- If agreed: they bond over mutual hatred. Target is the shared enemy. Ruthless.
- If disagreed: rocks. Neither blinks. Both accept the risk. This is the most explosive outcome.
- Bond: if agreed +0.5 (respect between killers). If rocks: surviving villain +0 (doesn't care), eliminated villain's tribe -0.5 with survivor (they took our person).
- Narrative: two predators in a room. No pleasantries. No strategy talk. Just demands and counter-demands. When it goes to rocks, neither is surprised.

#### 7. Villain vs Dealmaker
- The villain wants a personal target. The dealmaker wants the rational pick. Clash of approaches.
- Agreement: `0.25 + dealmaker.strategic * 0.04 + bond * 0.06`. The dealmaker can work with anyone — even a villain — if the logic is sound.
- If the villain's personal target also happens to be a high threat: easy agreement (the villain gets their kill, the dealmaker gets the "right" pick).
- If not: the dealmaker pushes back. The villain escalates. Agreement drops to `0.1 + bond * 0.05`.
- Bond: dealmaker -0.3 with villain if it felt coerced. +0.2 if the deal made sense.
- Narrative: the dealmaker tries to have a rational conversation. The villain keeps circling back to the same name. The dealmaker decides whether it's worth fighting over.

#### 8. Villain vs Loyal Shield
- Classic hero-vs-villain standoff. The villain demands. The loyal shield refuses to be bullied.
- Agreement: very low (~10-20%). `0.05 + bond * 0.05`. Almost guaranteed rocks unless there's pre-existing respect.
- The loyal shield won't sacrifice a tribemate to appease a villain. The villain won't back down. Standoff.
- Bond: if rocks, surviving player gets +0.5 respect from own tribe (stood their ground). Eliminated player's tribe mourns.
- Narrative: the villain pushes. The loyal player doesn't flinch. The room gets colder. Neither speaks for a long time. Then rocks.

#### 9. Villain vs Emotional Pitch
- Initial dynamic: the villain bulldozes. Intimidation vs. vulnerability.
- **Resistance check (emotional player standing up):** `emotional.boldness * 0.06 + emotional.temperament * 0.03 + (10 - villain.social) * 0.02`. Bold emotional players find the courage.
- If emotional resists: rocks. The emotional player found something they didn't know they had. +0.5 bond with own tribe (stood up to the bully). +0.3 with jury/viewers (character moment).
- If emotional crumbles: agreement `0.15 + emotional.social * 0.04 + bond * 0.06`. They agreed to something they don't believe in. Guilt camp event next episode.
- Bond: if crumbled: emotional -0.5 with self (regret), guilt event. If resisted: emotional +0.5 with tribe.
- Narrative: the villain speaks with finality. The emotional player's voice shakes. Do they fold or do they find something? The answer defines the rest of their game.

#### 10. Dealmaker vs Dealmaker
- Clean strategic deal. Both evaluate threats rationally.
- Target: highest `threatScore` across both tribes, excluding anyone either ambassador has bond >= 3 with.
- Agreement: near-guaranteed (~90%). `0.5 + avgStrategic * 0.04 + bond * 0.05`.
- Bond: +0.5 between ambassadors (mutual respect). Target's tribe resents the ambassador who agreed to give them up (-0.5 with tribemates).
- Narrative: handshake deal. Numbers exchanged. Threat levels compared. No emotion. Pure game. The cleanest outcome — and somehow the coldest.

#### 11. Dealmaker vs Loyal Shield
- The dealmaker wants a rational call. The loyal shield refuses to sacrifice anyone from their tribe.
- Agreement: `0.2 + dealmaker.strategic * 0.05 + bond * 0.08 - loyalShield.loyalty * 0.04`. (~30-50%)
- If agreed: target is from the loyal shield's tribe (the dealmaker won the argument). Loyal shield feels terrible but couldn't argue with the logic.
- If disagreed: rocks. The loyal shield chose their tribe over their own safety.
- Narrative: the dealmaker makes a logical case. The loyal shield knows it's right — but can't bring themselves to do it. The silence between them says everything.

#### 12. Dealmaker vs Emotional Pitch
- The emotional pitcher makes a heartfelt case. The dealmaker listens but evaluates coldly.
- Agreement: `0.3 + bond * 0.1 + emotional.social * 0.04`. (~45-65%) Emotional pitch can work if bond is positive.
- Target: compromise. Not the coldest strategic pick, not the most emotional. Someone both can live with.
- Bond: +0.3 between ambassadors (genuine connection formed during the meeting).
- Narrative: the emotional player's speech lands. The dealmaker doesn't cry — but they nod. The deal isn't perfect for either of them. It's human.

#### 13. Loyal Shield vs Loyal Shield
- Both refuse to sacrifice tribemates. Neither budges.
- Agreement: very low (~15-25%). Only if they share a strong enemy (both have bond <= -2 with someone). `0.05 + sharedEnemyBonus * 0.3 + bond * 0.05`.
- Most likely outcome: rocks. Both ambassadors put themselves at risk to protect their tribe.
- Bond: +0.5 between ambassadors if rocks (mutual respect for each other's sacrifice). Eliminated player's tribe gets +0.5 internal bond (shared loss).
- Narrative: heroic standoff. Both know they might go home. Neither blinks. The respect between them is visible — but it doesn't change anything.

#### 14. Loyal Shield vs Emotional Pitch
- The emotional player tries to find common ground through feeling. The loyal player is rigid but not cold.
- Agreement: moderate (~35-50%). `0.15 + bond * 0.1 + emotional.social * 0.04`.
- If agreed: the emotional player broke through the loyalty wall. Target is someone both feel conflicted about — but the emotional connection between ambassadors made the deal possible.
- If disagreed: the loyal player held firm. Rocks. But the emotional player's attempt wasn't wasted — bond +0.3 between them regardless.
- Narrative: the emotional player speaks from the heart. The loyal player listens — really listens. Something shifts. Or it doesn't. Either way, neither leaves the meeting angry.

#### 15. Emotional Pitch vs Emotional Pitch
- Two emotional players trying to connect. Raw, honest, messy.
- Agreement: high if bond is positive (~55-75%). `0.2 + bond * 0.12 + avgSocial * 0.03`.
- Target: the person who "deserves it least" — lowest social + lowest avg bond with both tribes. They pick the person nobody would fight for.
- Bond: +0.5 between ambassadors (real connection formed). Both feel the weight of what they did.
- Narrative: tears, honesty, vulnerability. The deal feels right even if it's messy. They hug before going back to camp. Both know the game changes after this.

### Disagreement → Rock Draw

When ambassadors can't agree:
- **2 tribes**: rock draw between the 2 ambassadors. 50/50. One goes home.
- **3+ tribes**: rock draw among ALL ambassadors who couldn't form a majority. Each has equal chance.
- The eliminated ambassador's tribe loses a member right before merge.
- Massive drama: the ambassador was supposed to protect their tribe and ended up being the one eliminated.
- Bond: surviving ambassador(s) get -1.0 with eliminated (guilt/relief). Eliminated ambassador's tribe gets +0.5 bond with each other (shared loss).

### Target Selection (when agreed)

The ambassadors agree on a target. Selection priority:

1. **Manipulator's pick**: whoever the manipulator wants (personal agenda)
2. **Villain's pick**: lowest bond target (personal grudge)
3. **Shared enemy**: someone both ambassadors have bond <= -1 with
4. **Highest threat**: highest `threatScore` that neither ambassador has bond >= 3 with
5. **Weakest link**: lowest `challengeWeakness` score (the "easy consensus")

The agreed target is eliminated without a vote. They never see the merge.

## State

```js
ep.ambassadors = {
  tribes: [{ name, ambassador, score, runner-up }],
  meeting: {
    ambassadors: [name1, name2],
    types: [type1, type2],  // 'manipulator'|'villain'|'dealmaker'|'loyal-shield'|'emotional'
    agreed: boolean,
    target: name || null,    // who they agreed to eliminate (null if rocks)
    targetReason: string,
    rockDrawLoser: name || null,
    narrative: string[],     // multi-beat narrative text
  },
  eliminated: name,
  eliminatedByRocks: boolean,
};
```

Saved to `ep.twists[]` as the twist object and to episode history.

## Camp Events

### Pre-Meeting (selection events, one per tribe)

**Ambassador chosen — confident tribe:**
- `"The tribe chose [ambassador]. [pr.Sub] [pr.sub==='they'?'walk':'walks'] toward the meeting point with the weight of [tribeSize] people on [pr.pos] shoulders. [tribe] believes in [pr.obj]."`

**Ambassador chosen — nervous tribe:**
- `"[ambassador] was selected, but the tribe isn't sure. [pr.Sub] [pr.sub==='they'?'don't':'doesn't'] have the strongest strategic mind — but [pr.sub] [pr.sub==='they'?'have':'has'] the trust. Whether that's enough is about to be tested."`

**Runner-up snubbed:**
- `"[runnerUp] wanted to go. The tribe picked [ambassador] instead. [ruPr.Sub] said nothing — but the look on [ruPr.pos] face said everything."`

### Meeting Narrative (2-3 beats per negotiation)

Each archetype pairing produces unique multi-beat text:

**Beat 1: The Arrival** — both ambassadors arrive. First impressions. Do they know each other? Bond check.

**Beat 2: The Pitch** — each ambassador makes their case. Personality-driven dialogue. The manipulator steers. The villain demands. The dealmaker proposes. The loyal shield resists. The emotional pitcher pleads.

**Beat 3: The Outcome** — agreement or deadlock. If agreed: who goes and why. If rocks: the moment of truth.

### Post-Meeting — The Return (BIGGEST DRAMA MOMENT)

Each ambassador returns to their tribe to announce the result. This is where the real emotions happen — before the elimination is even announced publicly. One tribe celebrates, one tribe mourns, or both tribes process the rocks.

**Separate camp events per tribe, shown BEFORE the elimination card.**

---

#### Scenario A: Ambassador protected the tribe (other tribe's member eliminated)

**Ambassador returns — hero's welcome:**
- Ambassador walks back. Tribe reads the face. Relief floods camp.
- Bond: ambassador +0.3 with every tribemate (delivered for the tribe)
- If ambassador is a Loyal Shield type: extra +0.2 ("this is what loyalty looks like")
- If ambassador is a Manipulator and tribe finds out HOW: mixed reaction — respect for result, unease about method

Text variants (personality-driven):
- Bold ambassador: `"[ambassador] walks back into camp with a look that says everything. 'We're good.' The tribe exhales. [pr.Sub] doesn't explain how — and nobody asks."`
- Social ambassador: `"[ambassador] comes back and immediately hugs [closestTribemate]. 'I did it. We're safe.' The tears are real. The tribe gathers around."`
- Strategic ambassador: `"[ambassador] sits down at the fire and lays it out cold. Who the target is. Why. How the negotiation went. The tribe listens. Nobody interrupts."`

---

#### Scenario B: Ambassador sacrificed a tribemate (own tribe's member eliminated)

**The hardest return.** The ambassador agreed to send one of their own home.

**Target's reaction** — personality-driven, creates lasting bond damage:
- **Bold/hothead target** (temperament <= 4 OR boldness >= 7): Explosive. Confrontation in front of the whole tribe.
  - `"[target] stares at [ambassador]. 'You had ONE job. Protect us. And you gave ME up?' The camp goes dead silent. [ambassador] has nothing. [target] walks to [pr.pos] bag and starts packing. [pr.Sub] ${pr.sub==='they'?'don\'t':'doesn\'t'} look back."`
  - Bond: target → ambassador: -3.0 (deep betrayal). This carries into jury if post-merge elimination.
  
- **Loyal target** (loyalty >= 7): Quiet devastation. The betrayal cuts deeper because they trusted the ambassador.
  - `"[target] doesn't yell. ${pr.Sub} just ${pr.sub==='they'?'look':'looks'} at [ambassador] and ${pr.sub==='they'?'say':'says'}: 'I trusted you.' It's the last thing ${pr.sub} ${pr.sub==='they'?'say':'says'} before walking away. The tribe has never been this quiet."`
  - Bond: target → ambassador: -2.5. Target → tribe: +0.5 (sympathy).
  
- **Strategic target** (strategic >= 7): Cold acceptance. Understands the game but files it away.
  - `"[target] nods slowly. 'Smart move. I would've done the same thing.' [pr.Sub] ${pr.sub==='they'?'pause':'pauses'}. 'No I wouldn't. I would have fought harder for my people.' [ambassador] has no response."`
  - Bond: target → ambassador: -1.5 (respect but resentment). If target makes jury, this becomes a pointed FTC question.
  
- **Social/emotional target** (social >= 7): Heartbreak. Not anger — grief.
  - `"[target]'s face crumbles. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} understand. ${pr.Sub} did everything right at camp — provided, bonded, worked. And someone ${pr.sub} never got to face decided ${pr.pos} fate. [ambassador] can't look at ${pr.obj}."`
  - Bond: target → ambassador: -2.0. Tribe: divided — some blame the ambassador, some understand.

**Tribe reaction** to losing a member:
- Tribemates close to the target: bond -1.0 with ambassador ("you sold us out")
- Tribemates who weren't close to the target: bond -0.3 with ambassador (uncomfortable but they understand)
- If the ambassador was manipulated (by a Manipulator ambassador): bond -0.5 EXTRA when tribe learns the truth

---

#### Scenario C: Ambassador eliminated by rock draw

**The tribe learns their ambassador is gone.**

- `"[ambassador] doesn't come back. The other tribe's ambassador walks over with the news. [pr.Sub] drew the wrong rock. The tribe stares at [pr.pos] empty torch."`
- Bond: all tribemates +0.5 with each other (shared loss, they band together)
- If ambassador was Loyal Shield: tribe +0.8 internal bond (the sacrifice is honored)
- The other ambassador who survived: -0.5 with the fallen ambassador's tribe (guilt, resentment)
- Narrative: `"[survivor] walks past [fallenAmbassador]'s tribe on the way back. Nobody speaks. There's nothing to say."`

---

#### Scenario D: Rock draw from the eliminated ambassador's perspective

**The ambassador who drew the wrong rock — their exit.**

- `"[ambassador] reaches into the bag. One rock. The wrong color. ${pr.Sub} ${pr.sub==='they'?'close':'closes'} ${pr.pos} eyes. ${pr.Sub} came here to protect ${pr.pos} tribe — and now ${pr.sub} ${pr.sub==='they'?'are':'is'} the one going home."`
- Personality-driven exit quotes:
  - Bold: `"I'd do it again. I'd volunteer again. At least I went down swinging — not hiding behind someone else's name."`
  - Loyal: `"Tell them I tried. Tell them I didn't give anyone up. The rock took me — not the game."`
  - Strategic: `"Bad luck. That's all this is. I played it right and the rock said no. That's the cruelest part."`
  - Emotional: `"I just wanted to protect them. That's all I wanted to do. And I couldn't even do that."`

---

### Elimination Card

Shown AFTER the return drama, before the merge announcement. Different from a regular vote-out card.

**"ELIMINATED BY AMBASSADORS"** — special badge, purple/gold theme.

Two variants:

**Agreed elimination:**
- `"[Ordinal] player eliminated — by ambassadors, not by vote."`
- Exit quote referencing the ambassador meeting: personality-driven
- Bold target: `"Two people I never got to face decided my fate. That's not the game — that's a backroom deal. And I'll remember every word."`
- Loyal target: `"I would have fought for my tribe. I would have stood in that room and refused. But I never got the chance."`
- Strategic target: `"It was the right move. I hate it — but it was right. I just wish I'd been the one making it."`
- Social target: `"I thought the bonds I built would protect me. They didn't. The game happened in a room I wasn't in."`

**Rock draw elimination:**
- `"[Ordinal] player eliminated — by rock draw at the ambassador meeting."`
- Exit quote from Scenario D above.

## VP Screens

### Screen 1: Ambassador Selection (`rpBuildAmbassadorSelection`)
Purple/gold theme. Both tribes shown side by side with ambassador highlighted, runner-up dimmed.

### Screen 2: The Meeting (`rpBuildAmbassadorMeeting`)
Ambassador portraits face each other. Negotiation narrative unfolds beat by beat (interactive — click to advance like Fan Campaign). Archetype labels shown.

### Screen 3: The Return (`rpBuildAmbassadorReturn`)
Split screen — each tribe's camp shown simultaneously. The ambassador returns. Drama events fire. Target reacts. Tribe processes.

### Screen 4: Elimination (`rpBuildAmbassadorElimination`)
Elimination card with "ELIMINATED BY AMBASSADORS" badge. Exit quote. Transition to merge announcement.

## Constraints

- Pre-merge only, requires 2+ tribes with 2+ members each
- Fires on the merge episode (before merge)
- Schedulable twist — not automatic
- One ambassador per tribe (2 tribes = 2 ambassadors, 3 tribes = 3 ambassadors)
- 2 tribes: 1v1 negotiation (15 archetype pairings)
- 3+ tribes: majority-rules coalition (2 team up, 1 is odd one out)
- Eliminated player does NOT go to jury (pre-merge elimination)
- Incompatible with no-tribal episodes
- Archetype pairings set the TENDENCY — stats + bonds + resistance checks determine actual outcome

## computeHeat / Targeting Impact

- The ambassador meeting is a one-time event — no persistent heat changes
- Bond changes from the negotiation carry into the merged game
- The surviving ambassador's reputation carries forward:
  - Manipulator who played the other → known as untrustworthy (bond -0.5 with other tribe members who learn what happened)
  - Loyal shield who went to rocks and survived → respected (+0.3 with own tribe)
