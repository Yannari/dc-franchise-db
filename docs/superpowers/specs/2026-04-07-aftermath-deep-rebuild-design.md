# Aftermath Show — Deep Rebuild Spec

**Date:** 2026-04-07
**Status:** Approved (replaces surface-level implementation)
**Type:** Rebuild of existing feature

---

## Problem

The current Aftermath implementation is surface-level. Template strings with names inserted. Generic questions. Vague consequences. Every Aftermath feels the same. The system needs to read the ACTUAL season story and generate content from real game data.

---

## Core Principle

**Every line of Aftermath content must reference something that ACTUALLY happened in the game.** No generic templates. No "who do you blame?" with a canned response. Every question, every answer, every reaction must pull from episode history, bond data, vote logs, alliance records, and player state.

---

## Segment 1: Opening

Chris's intro is SPECIFIC to this season's state:

**Data sources:** `gs.episodeHistory` (recent eliminations), `gs.namedAlliances` (dominant alliance), `gs.moles` (if active), recent blindsides, rivalry data.

**Generated intro structure:**
1. Season status: "We're down to [X] players. [Y] have fallen."
2. Recent drama summary: references the 2-3 biggest events since last Aftermath — specific names, specific moments. Examples:
   - "[Alliance] just blindsided [Player] — nobody saw it coming."
   - "The Mole was exposed and [Player] is picking up the pieces."
   - "[Player] and [Player]'s rivalry exploded at tribal."
3. Tonight's preview: "Tonight we hear from [guests] — and trust me, they have a LOT to say."

Not randomly selected — built by scanning episode history for the highest-drama events.

---

## Segment 2: Interviews

Each interview is a **conversation with arc**, not a Q&A checklist.

### Phase 1: The Entrance (light)
- Crowd reaction (popularity-gated, unchanged)
- Chris's opening line references their SPECIFIC game: "You came in as part of [Alliance]. By episode [X] that was over. What happened?"
- The opening is built from: their alliance history, how long they lasted, how they were eliminated

### Phase 2: The Story (escalation)
Questions generated from the player's ACTUAL game events. The system scans their history and builds questions from what happened to them:

**Question generators (each checks if the data exists, skips if not):**

| Trigger | Question | Answer source |
|---------|----------|---------------|
| Had an alliance that dissolved | "Walk us through what happened with [Alliance]." | Alliance betrayal data, who defected, which episode |
| Was betrayed by a specific person (voted by ally with bond >= 3) | "[Betrayer] was your closest ally. Then [they] wrote your name. What happened?" | Vote log, bond trajectory |
| Had a showmance | "The whole tribe was talking about you and [Partner]. Where does that stand now?" | Showmance data, phase, breakup status |
| Was Mole victim (sabotaged 2+ times) | "Looking back, does anything feel... off? Like someone was working against you?" | Mole sabotage log targeting this player |
| Had a rivalry (bond <= -5 with someone) | "You and [Rival]. The viewers saw everything. What's your side?" | Bond history, camp events between them |
| Played an idol | "That idol play in episode [X]. Walk us through the decision." | Idol play data |
| Made a big move (defection, spearheaded a vote) | "Episode [X] — you flipped. That changed the game. Was it worth it?" | Defection data, vote log |
| Was a challenge threat | "You dominated challenges. Did that help or hurt you?" | chalRecord data |
| Had a perceived bond gap (thought someone was their ally but wasn't) | "You thought [X] had your back. The data says otherwise." | perceivedBonds data |
| Had side deals | "You made a [type] deal with [Player]. Was it ever real?" | sideDeals data |

Each question picks 5-6 from whatever triggers are available. Priority: rare/dramatic triggers first (showmance, Mole, betrayal), common triggers fill the rest.

### Phase 3: The Hard Question (peak)
The ONE most dramatic moment from their game — Chris brings up specific evidence:
- "Let me show you something." — plays back a vote log entry, a bond score, a sabotage record
- This is the moment the player can't dodge

### Phase 4: Closure
- "Any last words for the people still playing?"
- Archetype-driven closing, but referencing specific active players by name
- Gallery reactions based on actual bonds with the interviewee

### Between Questions
- **Chris reacts** to each answer — pushes back ("That's not what the votes say"), agrees ("Fair point"), or escalates ("Let's dig into that")
- **Gallery members mentioned by name** get reaction lines
- **Crowd reactions** tied to the drama level of the answer

---

## Segment 3: Truth or Anvil

Chris has RECEIPTS. The secret is the biggest gap between presentation and reality.

**Secret selection priority (scans game data for the most dramatic contradiction):**

1. **Vote lie:** Player told alliance they'd vote [X], actually voted [Y]. Source: vote log + alliance target mismatch.
2. **Fake deal:** Player had a side deal they never intended to honor (`genuine: false`). Source: `gs.sideDeals`.
3. **Perceived bond gap:** Player told [X] they were tight. Real bond was negative. Source: `gs.perceivedBonds`.
4. **Double agent:** Player was in 2+ alliances with conflicting targets. Source: `gs.namedAlliances` membership overlap.
5. **Hidden advantage:** Player found an idol/advantage and never told anyone. Source: `gs.advantages` + `idolFinds` with no corresponding confession event.
6. **Mole identity:** Player was the Mole and wasn't exposed. Source: `gs.moles`.

**The flow:**
1. Chris sets up: references what the player CLAIMED. "You told [X] you were loyal to [Alliance]. You said you'd never write their name down."
2. "Is that the truth?"
3. Truth/lie decision: `loyalty * 0.08 + temperament * 0.03`
4. **If truth:** Chris confirms. The specific revealed data is listed (bond scores, vote entries, deal terms). Affected active players named with specific consequences for next episode.
5. **If lie:** "ANVIL." Chris plays the tape — the SPECIFIC contradicting evidence. Vote log entry shown. Bond score displayed. "The record shows you voted [Y] on episode [X]. That's not what you just told us." Gallery erupts.

**Consequences are specific:**
- "[Affected player] will learn about this. Bond with [Revealed player's ally] drops by -1.0 next episode."
- "This blows up [Alliance name]'s trust. Expect confrontation at camp."

---

## Segment 4: Fan Call

A full mini-interview with 3-4 exchanges, not one question.

**Fan types (randomly selected):**
- **Superfan:** Knows everything. Asks detailed game questions. "In episode [X] the vote split 4-3. Were you the swing vote?"
- **Drama fan:** Only cares about relationships. "Are you and [Showmance partner] still talking? The fans need to know."
- **Hater:** Grills the player. "You had the worst strategic read of anyone this season. How do you explain episode [X]?"
- **Supporter:** Wholesome questions. "You inspired a lot of people out there. What kept you going?"

**Each fan asks 3 questions:**
1. Opening question (references specific game moment)
2. Follow-up based on the answer's tone (if defensive → push harder, if honest → go deeper)
3. Final question (the spicy one)

**Between questions:**
- Player answers (archetype-driven tone + game-data content)
- Chris moderates: "Okay, okay, let's move on" or "No, I want to hear this"
- Gallery reaction if someone is mentioned

**Fan questions pull from the SAME data sources as interviews** — vote logs, bonds, alliances, challenges. Not generic "who's playing the best game?"

---

## Segment 5: Unseen Footage

Each clip is a **mini-scene with dialogue**, not a description line.

**Clip structure:**
1. **Setup:** Chris: "What you're about to see happened on Day [X], right before tribal..."
2. **The scene:** 3-5 lines of reconstructed dialogue between the players involved:
   - Mole sabotage: the actual whisper, the fabricated quote, the manipulation
   - Secret deal: the handshake conversation, the promises made
   - Betrayal planning: "I'm voting [X] tonight. Are you in?"
   - Perceived bond gap: one player confiding in someone who's actually plotting against them
3. **Aftermath reaction:** Gallery member who's in the clip: "I had NO idea that was happening."
4. **Chris ties it together:** "Three days later, [X] was eliminated. Now you know why."

**Clip selection:** Scan all episodes since last Aftermath. Score each potential clip by: number of active players affected, bond magnitude, drama type. Pick top 2-3.

---

## Segment 6: Aftermath Moments (MULTIPLE per show)

Not one random type — ALL moments that have valid triggers fire.

**Trigger conditions (all that apply fire, in order):**

1. **Confrontation** — two interviewees with bond <= -3. Chris puts them next to each other. "Let's address the elephant in the room." Both get to speak. References the specific incident that caused the rift. This MUST fire if the conditions exist.

2. **Gallery Eruption** — gallery member with bond <= -5 with an interviewee. They stand up mid-interview. "I've been sitting here for [X] episodes waiting to say this." References specific betrayal/incident.

3. **Emotional Moment** — interviewee who was betrayed by their closest ally (bond was >= 5, voted out by that person). The weight of it hits during the interview. Chris gives them space.

4. **Standing Ovation** — ONLY for popularity >= 8. References the specific moments that made fans love them: "After episode [X] when you [specific action], the fan vote went through the roof."

5. **Host Roast** — Chris roasts active players with game-specific lines. Each roast references an actual game event, not just archetype: "[Player] has been in 4 alliances and betrayed 3 of them — that's not strategy, that's a pattern."

**Multiple moments per show.** A confrontation AND a gallery eruption AND a standing ovation can all happen in the same Aftermath if the conditions are met. Each gets its own card/section.

**If NO conditions are met** — no moment fires. Don't force it. An empty moment slot is better than a fake one.

---

## Reunion Specifics (Finale)

The Reunion follows the same deep principles but with ALL players:

**Season Awards** pull from actual data:
- **Best Blindside:** Episode with highest vote margin where eliminated player had "comfortable" emotional state
- **Biggest Betrayal:** The defection with the highest pre-betrayal bond score (the closer they were, the worse the betrayal)
- **Best Alliance:** Longest-lasting active alliance with fewest betrayals relative to episodes active
- **Most Dramatic Moment:** Episode event that caused the largest single popularity shift
- **Fan Favorite:** Highest popularity score with their arc graph
- **Best Move:** The single defection/idol play/advantage use that had the biggest impact on the game outcome

**Season Rating** based on actual drama metrics: blindside count, idol plays, alliance betrayals, Mole acts, close votes, rock draws, fire-making duels.

---

## Data Architecture

Every piece of content is generated by scanning these data sources:

| Source | What it provides |
|--------|-----------------|
| `gs.episodeHistory[].votingLog` | Who voted for who, vote reasons, defections |
| `gs.episodeHistory[].votes` | Vote tallies |
| `gs.episodeHistory[].alliances` | Alliance targets, membership at time of vote |
| `gs.episodeHistory[].defections` | Who betrayed their alliance |
| `gs.episodeHistory[].idolPlays` | Idol/advantage plays |
| `gs.episodeHistory[].campEvents` | Camp events that happened |
| `gs.bonds` / `getBond()` | Current bond state |
| `gs.perceivedBonds` | Perception gaps |
| `gs.namedAlliances` | Alliance history (active + dissolved) |
| `gs.sideDeals` | F2/F3 deals, genuine or fake |
| `gs.showmances` | Showmance status |
| `gs.moles` | Mole data, sabotage log |
| `gs.popularity` | Popularity scores |
| `gs.playerStates` | Emotional state, big moves count |
| `gs.chalRecord` | Challenge wins/bombs |

No content should exist that doesn't trace back to one of these sources.

---

## What Changes From Current Implementation

| Component | Current (surface) | Rebuilt (deep) |
|-----------|------------------|----------------|
| Host intro | Generic drama-level line | Specific references to recent events by name |
| Interview questions | Pool of 12 generic templates | Generated from player's actual game events |
| Interview answers | Archetype-template responses | References specific episodes, names, moments |
| Truth or Anvil | Random secret from game data | Highest-drama contradiction with specific receipts |
| Fan Call | 1 generic question | 3-4 exchanges with fan personality + game-data questions |
| Unseen Footage | Description line | Mini-scene with reconstructed dialogue |
| Aftermath Moment | 1 random type | All qualifying moments fire |
| Standing Ovation | No popularity gate | Only fires for popularity >= 8 with specific reason |
| Gallery reactions | Random emoji text | Bond-driven reactions referencing specific incidents |
| Consequences | "This changes things" | Specific: "[Player] confronts [Player] about [thing]. Bond -1.0." |

---

## Scope

This is a REBUILD of `generateAftermathShow` and all `rpBuildAftermath*` functions. The config, CSS, and VP sidebar integration remain the same. The data structure stays compatible. Only the content generation and rendering get deeper.
