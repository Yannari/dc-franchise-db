# Trust Challenge — Narrative Arc Redesign

## Problem
Events fire randomly and dump in order. No story structure. Reads like a bullet list, not a show.

## Solution
Each round generates events in a 4-beat narrative arc:

### 1. SETUP (always fires)
- Pair steps up. First impressions. Body language.
- Negotiation happens here.
- Establishes the dynamic: enemies, strangers, allies.
- "Mike and Hicks step up. They barely look at each other."

### 2. RISING ACTION (1-3 events)
- Obstacles/challenges test the pair.
- Trust is built or broken through specific moments.
- Each event builds on the previous one — not random.
- If the first obstacle shows distrust, the second should escalate it.
- If the first shows a save, the second can show growing confidence.

### 3. CLIMAX (1 event)
- The defining moment. The thing that determines win or lose.
- Sabotage, heroic catch, poisoning, perfect dish, wild miss.
- This is the peak drama — everything before led here.

### 4. RESOLUTION (always fires)
- What changed between them. The aftermath.
- "I didn't think you'd hold the rope." "Neither did I."
- Bond change narrative. Grudging respect or deeper hatred.
- Sets up camp events and tribal consequences.

## Implementation Approach
Instead of generating events independently (random checks), generate them as a STORY:
1. Determine the arc type based on bond + stats + randomness (trust-building, sabotage, disaster, triumph)
2. Pick events that fit the arc in order
3. Each event's text references what came before
4. The resolution references the whole journey

## Arc Types

### Trust Building (bond starts low, pair succeeds)
SETUP: tension → RISING: obstacle, belayer helps → CLIMAX: climber saved by belayer → RESOLUTION: grudging respect

### Betrayal (bond low, sabotage fires)
SETUP: hostility → RISING: belayer distracted, climber struggling → CLIMAX: sabotage/rope drop → RESOLUTION: fury, camp drama

### Smooth Run (bond high, pair in sync)
SETUP: confident → RISING: obstacles handled easily → CLIMAX: summit/perfect dish → RESOLUTION: strengthened bond

### Disaster (low stats, things go wrong)
SETUP: nervous → RISING: mistake, panic → CLIMAX: poisoning/fall/failure → RESOLUTION: blame or forgiveness

### Redemption (starts bad, ends good)
SETUP: hostility → RISING: first obstacle goes badly → CLIMAX: belayer saves climber despite hating them → RESOLUTION: "maybe you're not so bad"

## Each Round Tells ONE Story Per Pair
- No more 3 distraction events in a row
- No heroic catch followed by distraction (contradiction)
- Events build toward the climax logically
- The resolution always references what happened
