# The Sucky Outdoors Design

**Date:** 2026-04-10
**Inspired by:** Total Drama Island S1E6 "The Sucky Outdoors"
**Type:** Schedulable challenge twist (pre-merge, tribe vs tribe)

---

## Overview

Overnight survival challenge. Tribes camp in the woods, drama happens through 5 phases, and the first tribe to return to camp in the morning wins immunity. Every event contributes to a personal survival score (feeds chalMemberScores for top 3/bottom 3). Getting lost is devastating — late arrival can auto-lose the challenge for your tribe.

## TWIST_CATALOG Entry

```
id: 'sucky-outdoors'
emoji: '🏕️'
name: 'The Sucky Outdoors'
category: 'challenge'
phase: 'pre-merge'
engineType: 'sucky-outdoors'
minTribes: 2
incompatible: [all other challenge twists]
```

## Core Structure

**Function:** `simulateSuckyOutdoors(ep)` — runs 5 phases, generates events, calculates scores, determines winner/loser.

**Navigator:** Highest `mental * 0.5 + strategic * 0.3 + intuition * 0.2` per tribe. Leads hike and camp setup.

**Winner determination:** Tribe survival score = sum of all personal scores + camp quality bonus + morning race bonus. Highest total wins. Exception: if a tribe has lost members who arrive after all other tribes finish → auto-loss regardless of score.

**Personal scoring:** Every event adds/deducts from individual players. Accumulated into `ep.chalMemberScores` for podium/bomb tracking.

## Phase 1: Announcement + Hike (3-4 events per tribe)

| Event | Stat Driver | Personal Score | Bond Effect |
|---|---|---|---|
| Navigator leads well | mental * 0.06 + intuition * 0.04 | +2.0 navigator | +0.3 tribemates→navigator |
| Navigator gets confused | (10-mental) * 0.04 | -2.0 navigator | -0.2 tribemates→navigator |
| Someone lags behind | (10-endurance) * 0.04 | -1.0 lagger | -0.2 from annoyed tribemate |
| Food spotted on trail | intuition * 0.04 | +1.5 spotter | +0.2 from grateful tribe |
| Argument about direction | boldness * 0.03 for both + bond <= 0 | -0.5 both | -0.3 bond between arguers |
| Bonding on the trail | social * 0.04 + bond >= 1 | +0.5 both | +0.4 bond between pair |
| Someone wanders off | (10-loyalty) * 0.03 + boldness * 0.02 | -1.5 wanderer | camp event |
| Scary noise on hike | (10-boldness) * 0.03 | -0.5 panicker, +0.5 brave | +0.3 brave→panicker |

## Phase 2: Setup Camp (3-4 events per tribe)

| Event | Stat Driver | Personal Score | Bond Effect |
|---|---|---|---|
| Shelter building | endurance * 0.04 + mental * 0.03 (top 2) | +2.0 per builder | +0.2 tribemates→builders |
| Fire starting | mental * 0.05 + boldness * 0.02 | +1.5 fire starter | +0.3 from cold tribemates |
| Food hunt — fishing | physical * 0.04 + intuition * 0.03 | +1.5 fisher | +0.3 from grateful tribe |
| Food hunt — foraging | intuition * 0.04 + mental * 0.02 | +1.0 forager | +0.2 from tribe |
| Division of labor argument | (10-loyalty) * 0.03 + boldness * 0.03 | -0.5 both arguers | -0.3 bond |
| Refuses to help | (10-loyalty) * 0.04 + (10-social) * 0.02 | -1.5 slacker | -0.3 from all tribemates |
| Shelter collapses | (10-mental) * 0.03 for worst builder | -1.0 builder | -0.2 tribe→builder |
| Camp quality check | avg tribe endurance+mental | tribe camp quality score | — |

**Camp quality:** `avg(endurance + mental) / 2` across all tribe members. Affects Phase 4 severity.

## Phase 3: Nightfall (4-5 events per tribe)

| Event | Stat Driver | Personal Score | Bond Effect |
|---|---|---|---|
| Ghost story | boldness * 0.04 + social * 0.03 | +1.0 storyteller | +0.2 from entertained |
| Scared by ghost story | (10-boldness) * 0.04 | -0.5 scared player | — |
| Fireside bonding | social * 0.05 (highest social pair) | +0.5 both | +0.5 bond |
| Showmance moment | existing showmance or romanticCompat + bond >= 3 | +0.5 both | +0.3 bond |
| Strategic whispers | strategic * 0.04 + (10-loyalty) * 0.02 | +0.5 schemer | -0.2 if overheard |
| Prank | boldness * 0.04 + (10-loyalty) * 0.02 | -1.0 prankster | -0.4 pranked target |
| Can't sleep — anxious | (10-temperament) * 0.04 | -0.5 anxious player | — |
| Stargazing confession | social * 0.03 + temperament * 0.03 | +1.0 both | +0.5 bond (deep moment) |
| Overheard scheming | intuition * 0.04 (listener) | +0.5 listener, -0.5 schemer | -0.4 listener→schemer |

## Phase 4: The Night (3-4 events per tribe)

Severity scales with camp quality — lower quality = more bad events.

| Event | Stat Driver | Personal Score | Bond Effect |
|---|---|---|---|
| Rainstorm | camp quality: bad = everyone -1.0, good = no penalty | proportional | — |
| Bear encounter | boldness * 0.04 (brave), (10-boldness) * 0.04 (panicker) | +1.5 brave, -1.0 panicker | +0.3 brave→panicker |
| Someone gets lost | (10-intuition) * 0.03 + (10-mental) * 0.02 | -3.0 lost player | tribe morning race penalty |
| Tent/shelter fire | (10-temperament) * 0.03 | -2.0 culprit | -0.3 from all tribemates |
| Nightmare/sleep talking | (10-temperament) * 0.03 | -0.5 dreamer | comedy camp event |
| Cuddling for warmth | bond >= 2 or showmance | +0.5 both | +0.3 bond |
| Bear costume prank | boldness * 0.03 + (10-loyalty) * 0.03 (chaos archetype) | -1.0 prankster, -0.5 scared | -0.4 from scared targets |
| Someone sneaks off alone | (10-social) * 0.03 | -0.5 loner | camp event |

## Phase 5: Morning Race (1-2 events per tribe)

| Event | Stat Driver | Personal Score | Bond Effect |
|---|---|---|---|
| Sprint back | physical * 0.04 + endurance * 0.03 per player | top scorer +2.0 | — |
| Lost member delays | per lost player: -5.0 tribe penalty | — | -0.5 tribe→lost player |
| Shortcut found | intuition * 0.04 + mental * 0.03 | +2.0 finder | +0.3 from tribe |
| Carries injured/slow teammate | loyalty * 0.04 + physical * 0.03 | +1.5 carrier | +0.5 bond carrier→carried |

## Lost Player Consequences

Getting lost is the biggest game-changer — the Katie & Sadie moment.

| Consequence | Impact |
|---|---|
| Personal score | -3.0 (automatic bomb candidate) |
| Tribe morning race penalty | -5.0 per lost player |
| Late arrival auto-loss | If lost players arrive AFTER other tribes finish → tribe auto-loses regardless of score |
| Bond damage | -0.5 from all tribemates |
| Heat | +2.0 for 2 episodes |
| Camp event | "COST THE TRIBE" badge |

**Lost pair:** Two players with bond >= 3 who both get lost → +0.3 bond (survived together), but tribe penalty doubles.

**Who gets lost:** `(10 - intuition) * 0.02 + (10 - mental) * 0.015`. Players who wandered off during hike have higher chance at night. Max 2 lost per tribe.

**Late arrival:** Lost members return with delay `(10 - intuition) * 0.5` — if this exceeds other tribes' race time, auto-loss.

## VP Screen

**`rpBuildSuckyOutdoors(ep)`** — single VP screen, click-to-reveal per phase.

- Phase headers: ANNOUNCEMENT + HIKE → SETUP CAMP → NIGHTFALL → THE NIGHT → MORNING RACE
- Background darkens through phases (tod-dawn → tod-dusk → tod-deepnight → tod-deepnight → tod-dawn)
- Events as cards with portraits, narrative, personal score badges
- Lost player: dramatic red LOST card
- Morning race: tribe race comparison, lost player late arrival
- Final: winner announcement + COST THE TRIBE card if applicable

## Camp Event Badges

NAVIGATOR, SHELTER BUILT, FIRE STARTED, PROVIDER, GHOST STORY, FIRESIDE, PRANK, BEAR ENCOUNTER, LOST, COST THE TRIBE, SHORTCUT, CARRIED, STAGE FRIGHT, SLACKER, WANDERED OFF

## Text Backlog

`_textSuckyOutdoors(ep, ln, sec)` — per-phase event summaries + final scores.

## Cold Open Recap

Winner, final score, lost players if any, MVP.

## Timeline Tag

`soTag` — "Sucky Outdoors" in green.

## Debug Challenge Tab

Full personal score breakdown per player, per-phase scores, camp quality, morning race calculation.

## Episode History

- `ep.isSuckyOutdoors = true`
- `ep.suckyOutdoors = { phases, navigator, campQuality, survivalScores, personalScores, lostPlayers, winner, loser }`

## Edge Cases

- **3+ tribes:** All camp overnight. Highest survival score wins. Lowest goes to tribal.
- **Multiple lost players across tribes:** Each tribe's penalty independent. Auto-loss only if YOUR lost players arrive after ALL other tribes finish.
- **Entire tribe gets lost:** Shouldn't happen (max 2 lost per tribe). But if it did, guaranteed auto-loss.
- **Tied survival scores:** Tiebreaker = tribe with fewer lost players. If still tied, higher camp quality.
- **Nice archetypes:** Block hero/loyal/protector from pranks and scheming events. They can still get scared, get lost, etc.
