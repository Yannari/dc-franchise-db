# Volunteer Exile Duel — Design Spec

**Date:** 2026-04-06
**Status:** Approved
**Type:** Probabilistic moment (rare camp event)

---

## Overview

A bold or hot-headed player deliberately asks to be voted out so they can face a rival at the exile duel. The tribe decides whether to grant the request. If the volunteer wins the duel, they return with a grudge bonus. If they lose, they're gone — but they chose it.

---

## Prerequisite

- Exile Duel twist must be active on this episode
- Someone must be on exile/RI to duel against
- The volunteer must have bond <= -3 with that person (genuine rivalry)
- Episode >= 3
- Once per game per player (`gs._volunteerExileUsed` Set)

---

## Trigger

Fires during pre-tribal camp phase in `checkMoleSabotage`-adjacent area (after camp events, before tribal).

**Probability:** `boldness * 0.03 + (10 - temperament) * 0.02`
- Boldness 9, temperament 2: 0.27 + 0.16 = 43% — very likely for hotheads
- Boldness 5, temperament 5: 0.15 + 0.10 = 25% — moderate
- Boldness 3, temperament 8: 0.09 + 0.04 = 13% — unlikely for calm players
- All proportional per Stat Philosophy Rule 1

---

## The Volunteer Moment

**Camp event** with VOLUNTEER DUEL badge:
- 3-4 narrative variants based on temperament:
  - Low temperament (hothead): explosive announcement, personal vendetta
  - High boldness (brave): calculated declaration, confident challenge
  - Mixed: emotional but controlled request
- Players: [volunteer, rival on exile]

---

## Vote Influence

**Heat boost:** Volunteer gets +2.0 heat — they want to be targeted.

**Vote reasoning adapts:**
- `buildVoteReason`: "volunteered to face [rival] at the duel — the tribe granted the request"
- If tribe votes someone else: "[volunteer] volunteered for the duel but the tribe had other priorities"
- Voting plans show the volunteer's request as a targeting factor

**Alliance behavior:**
- Alliance members with bond >= 2 to the volunteer are more likely to vote for them (respecting the request): +0.3 vote weight toward volunteer
- Alliance members with bond < 0 may ignore the request

---

## Duel Outcomes

### Volunteer Wins (Return with Grudge Bonus)
- Heat reduction: **-2.0** for 2 episodes
- Bond damage with defeated rival: **-2.0**
- Popularity boost: **+5**
- Camp event on return: GRUDGE MATCH badge — "They asked to be sent here. They won."

### Volunteer Loses
- Permanently eliminated
- Exit quote reflects the choice: "I chose this. I'd do it again."

---

## WHY Section

- Voted out + volunteered: "X volunteered to be eliminated — asked the tribe to send them to face [rival] at the duel. The tribe agreed."
- NOT voted out: "X volunteered for the duel against [rival], but the tribe had other plans."
- Won the duel: "X volunteered to face [rival] — and won. The gamble paid off."
- Lost the duel: "X volunteered to face [rival] — and lost. The boldest move of the season ended their game."

---

## Debug Tab

In the "Hidden Moves" tab:
- **VOLUNTEER DUEL** section (only appears when event fired)
- Shows: volunteer name, rival name, whether tribe granted it, duel result (if applicable)

---

## State

```
ep.volunteerDuel = {
  volunteer: 'Name',
  rival: 'Name',           // person on exile/RI
  granted: true/false,      // did the tribe vote them out?
  duelResult: 'won'/'lost'  // set after duel resolves (null until then)
}
```

Stored on `ep` and saved to `gs.episodeHistory` via `patchEpisodeHistory`.

---

## Engine Integration

| System | Change |
|--------|--------|
| `generateCampEventsForGroup` or new `checkVolunteerExileDuel(ep)` | Trigger check, camp event generation |
| `computeHeat` | +2.0 heat when volunteer is active |
| `simulateVotes` / `buildVoteReason` | Vote reasoning reflects volunteer request |
| `formAlliances` | Alliance vote targeting considers volunteer request |
| RI duel resolution | Apply grudge bonus on win, exit quote on loss |
| `patchEpisodeHistory` | Save `ep.volunteerDuel` data |
| `rpBuildDebug` | Volunteer Duel section in Hidden Moves tab |
| `rpBuildVotes` / WHY section | Volunteer-aware elimination reasoning |
| `_textTheVotes` / `_textWhyVote` | Text backlog for volunteer duel |

---

## Scope Notes

- Only fires when exile duel twist is running — no exile duel, no volunteer
- Once per game per player — bold players don't spam it
- The tribe can reject the request — the volunteer doesn't control the vote
- Compatible with all other twists (Mole, Tied Destinies, etc.)
- Small feature: 1 camp event, 1 heat modifier, vote reason adjustments, duel outcome handling, debug display
