# Schoolyard Pick — Design Spec

**Date:** 2026-04-07
**Status:** Approved
**Type:** Schedulable twist (pre-merge only, replaces tribe swap)

---

## Overview

Captains draft teams schoolyard-style. Each pick creates a public pecking order — early picks are valued, late picks are humiliated. Last picked player gets shame/anger/fire-to-prove reactions. Odd player count sends the unpicked person to exile, returning next episode to the tribe that just lost someone at tribal.

---

## Config

- Twist catalog: `schoolyard-pick`, category `team`, phase `pre-merge`
- Incompatible with: `no-tribal`, `elimination-swap` (same episode)
- Replaces random tribe swap when scheduled

---

## Captain Selection

**Primary:** Two best individual performers from the most recent challenge.
- Uses `chalMemberScores` from the previous episode — highest individual scores across all tribes
- If both top performers were on the same tribe, pick the best from each tribe

**Fallback (no challenge data):** Random — two players drawn at random

---

## Draft Mechanics

### Pick Order
Alternating: Captain A picks first, Captain B, A, B, A, B... until all players are assigned (or one remains for exile).

### Pick Logic (mix-based on captain personality)

Each captain scores every available player and picks the highest-scoring one.

**Strategic captain (strategic >= 7):**
- Score: `challengeWeakness(player) * -0.6 + getBond(captain, player) * 0.4`
- Picks for tribe strength first, bonds second

**Social captain (social >= 7):**
- Score: `getBond(captain, player) * 0.6 + challengeWeakness(player) * -0.4`
- Picks allies first, strength second

**Bold captain (boldness >= 7):**
- Score: `Math.max(0, -getBond(captain, player)) * 0.5 + threatScore(player) * 0.5`
- Picks rivals/enemies to keep close + high-threat players to control

**Default:**
- Score: `challengeWeakness(player) * -0.5 + getBond(captain, player) * 0.5`
- Balanced strength and bond

All scores include `+ Math.random() * 0.5` for variance.

---

## Emotional Reactions (Proportional + Archetype)

### Base Proportional Scores
- **Anger:** `(10 - temperament) * 0.1`
- **Shame:** `temperament * 0.08`
- **Fire-to-prove:** `boldness * 0.1`

### Archetype Modifiers
| Archetype | Anger | Shame | Fire |
|-----------|-------|-------|------|
| villain/schemer | +0.3 | — | — |
| hero | — | +0.2 | — |
| hothead/chaos-agent | +0.4 | — | — |
| challenge-beast | — | — | +0.4 |
| underdog | — | — | +0.3 |
| floater | — | +0.3 | — |
| social-butterfly | +0.1 | +0.2 | — |

The DOMINANT reaction (highest combined score) determines the camp event type and text.

---

## Odd Player Count → Exile

When the player count is odd, the last unpicked player goes to exile.

**Exile rules:**
- Skips the challenge and tribal this episode
- Removed from `gs.activePlayers` temporarily (same pattern as exile duel)
- Rejoins the tribe that LOSES a member at tribal — placed on that tribe at the start of next episode
- NOT compatible with no-tribal or elimination-swap that episode (twist is blocked if those are also scheduled)

**Exile return (next episode):**
- Player is added to the losing tribe's roster
- Camp events fire on the new tribe:

**Arrival event** (bond-driven):
- Average bond with new tribemates determines reception
- High bond: warm welcome, "We're glad to have you"
- Low bond: cold reception, "Another mouth to feed"
- Negative bond: hostile, "Great. Just what we needed."

**Proving event** (dominant emotion):
- Anger: confrontational — calls out the captains, burns bridges with old allies, channels rage into camp conflict
- Shame: quiet work ethic — does everything around camp without being asked, earns grudging respect
- Fire-to-prove: beast mode — dominates the next challenge, announces their presence

**Archetype-specific return events:**
- Villain: immediately starts scheming against the captains who left them out
- Hero: returns quietly, earns respect through work ethic, becomes the underdog the tribe rallies around
- Challenge-beast: returns and dominates the next challenge — the tribe realizes they made a mistake
- Underdog: this is their origin story — the narrative shifts to their comeback arc
- Floater: tries to blend in, but the exile label follows them

---

## Even Player Count → Last Picked

When even, everyone gets drafted. The last person picked gets:
- Bond damage: `-0.5` with the captain who picked them last
- Shame/anger/fire camp event based on dominant emotion
- The tribe knows they were last — creates social dynamic for the rest of pre-merge

---

## Bond Consequences

| Pick position | Bond with captain |
|---------------|-------------------|
| 1st-2nd pick | +0.4 (chosen first = highly valued) |
| 3rd-4th pick | +0.2 (solid pick) |
| Middle picks | +0.1 (average) |
| Second-to-last | -0.2 (afterthought) |
| Last pick | -0.5 (publicly humiliated) |

Bond with the OTHER captain (who didn't pick them): -0.2 for late picks (rejected).

---

## VP Screen

**Dedicated "Schoolyard Pick" screen** inserted before camp events.

- Title: "SCHOOLYARD PICK"
- Captains shown at top with portraits + "CAPTAIN" badge
- Click-to-reveal draft: each pick revealed one at a time, alternating columns (Captain A's team left, Captain B's team right)
- Pick order numbers shown (#1, #2, #3...)
- Last pick highlighted in red with "LAST PICKED" label
- If odd: exile player shown at bottom with "SENT TO EXILE" label
- Emotional reaction text shown for the last pick / exile player

---

## Text Backlog

`_textSchoolyardPick(ep, ln, sec)` covering:
- Captain names
- Full draft order
- Last picked player + emotional reaction
- Exile player if odd

---

## State

```
ep.schoolyardPick = {
  captains: ['Name1', 'Name2'],
  captainSource: 'challenge' | 'random',
  picks: [{ captain: 'Name', picked: 'Name', pickNumber: 1 }],
  lastPicked: 'Name',
  exiled: 'Name' | null,
  dominantEmotion: 'anger' | 'shame' | 'fire',
  emotionScores: { anger: 0.7, shame: 0.3, fire: 0.5 },
  newTribes: [{ name, members }]
}
```

---

## Engine Integration

| System | Change |
|--------|--------|
| Twist catalog | Add `schoolyard-pick` entry |
| `applyTwist` | Handle `schoolyard-pick` engine type — generate captains, run draft, assign tribes |
| `buildVPScreens` | Insert Schoolyard Pick screen before camp events |
| `rpBuildSchoolyardPick(ep)` | NEW — click-to-reveal draft screen |
| `generateCampEventsForGroup` | Inject last-picked/exile shame events |
| `patchEpisodeHistory` | Save `ep.schoolyardPick` |
| Exile return (next episode) | Add exile player to losing tribe, inject return camp events |
| `_textSchoolyardPick` | NEW — text backlog formatter |
| `buildEpisodeMap` | No change needed (same player count as tribe swap) |
