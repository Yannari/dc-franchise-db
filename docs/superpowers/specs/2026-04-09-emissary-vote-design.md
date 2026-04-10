# Emissary Vote Design

**Date:** 2026-04-09
**Inspired by:** Disventure Camp 1
**Type:** Schedulable twist (pre-merge only, double elimination)

---

## Overview

The winning tribe sends an emissary to the losing tribe's tribal council. After the normal vote eliminates one player, the emissary eliminates a second player by personal choice. No idols, no blocking — the emissary points, that person is gone. Double elimination every time this twist fires.

## TWIST_CATALOG Entry

```
id: 'emissary-vote'
emoji: '🕵️'
name: 'Emissary Vote'
category: 'elim'
phase: 'pre-merge'
desc: 'Winning tribe sends an emissary to losing tribe\'s tribal. After the normal vote, the emissary eliminates a second player.'
engineType: 'emissary-vote'
incompatible: ['ambassador', 'double-tribal', 'multi-tribal', 'kidnapping']
minTribes: 2
```

## Emissary Selection (in `applyTwist`)

Fires post-immunity. From the winning tribe, each player gets a volunteer score:

```
score = boldness * 0.06 + strategic * 0.05 + social * 0.04 + random(0, 0.15)
```

Highest scorer volunteers. Stored as `ep.emissary = { name, tribe }`.

### Camp event on winning tribe
"[Emissary] volunteers to visit [losing tribe]'s tribal council" with archetype-flavored dialogue:
- Villain/schemer: scheming about the opportunity
- Hero/loyal: reluctant duty
- Strategic types: calculating opportunity

### Own tribe bond shifts
- Tribemates: +0.3 bond with emissary for stepping up
- High-intuition tribemates toward villain/schemer emissaries: -0.2 (suspicion of motives)

## Scouting Period

After emissary selection, before tribal council. The emissary visits the losing tribe's camp. Existing cross-tribe bonds (from feasts, swaps, pre-game) factor into all interactions.

### Scouting Events (2-3, pushed to `ep.campEvents[loserTribeName].post`)

1. **Pitches** (1-2 events) — Losing tribe members approach the emissary trying to influence their pick. Most likely pitchers: high social, high strategic, or high-heat players feeling threatened. They pitch against their lowest-bond rivals. Emissary's receptiveness scales with `bond(emissary, pitcher) + pitcher.social * factor`.

2. **Observation** (1 event) — Emissary reads tribe dynamics. High intuition/mental emissary: picks up on cracks (lowest internal bonds, isolated players). Low intuition: surface-level read (threat scores only).

3. **Alliance offer** (optional) — If emissary has existing bond >= 3.0 with someone on the losing tribe, they may make a cross-tribe F2 pact. Stored in `gs.sideDeals[]`.

All events use `players: [emissary, otherPlayer]` array for VP portrait rendering.

Stored as `ep.emissaryScoutEvents[]` for VP.

## Emissary Pick Logic (`simulateEmissaryVote(ep)`)

Called after `resolveVotes` completes normal tribal elimination. Emissary picks from remaining tribal players (excluding the just-eliminated player and anyone immune).

### Target scoring

```
targetScore = threatScore(target) * 0.30
            + pitchInfluence * 0.25
            - bond(emissary, target) * 0.20
            + heat(target) * 0.15
            + random(0, 0.10)
```

- **Threat:** emissary gravitates toward threats (proportional)
- **Pitch influence:** scouting pitches against this target carry weight. Multiple pitches stack.
- **Bond protection:** positive bonds reduce targeting. Negative bonds increase it.
- **Heat:** tribe pariah is a safe/easy pick
- **Random:** gut factor

### Archetype modifiers on emissary
- Villain/schemer: threat weight 0.40 (strategic elimination)
- Hero/loyal: bond weight 0.30 (protects friends, targets strangers)
- Floater: heat weight 0.25 (follows the crowd read)

### No protection
No idol plays, no blocking. The emissary picks and that person is eliminated.

### Elimination handling
Both eliminations (normal vote + emissary pick) go through `handleAdvantageInheritance` and `isRIStillActive()` check independently. Normal elimination first, emissary pick second.

Stored as `ep.emissaryPick = { name, reason }`.

## Bond Consequences

### Losing tribe toward emissary
- Eliminated player's closest allies (bond >= 2.0): **-1.5 bond** with emissary, scaled proportionally (`bond * 0.15`). Grudge carries to merge.
- Players who wanted the pick gone (had them as vote target or pitched against them): **+0.8 bond** with emissary.
- Neutral players: **-0.3 bond** with emissary. General resentment toward outside interference.

### Emissary's own tribe toward emissary
- Eliminated a high-threat player: **+0.4 bond** from strategic tribemates
- Eliminated a low-threat/sympathetic player: **-0.3 bond** from hero/loyal tribemates

### Heat
- Emissary: **+1.5 heat** for 2 episodes (target on their back)

### Popularity
- Emissary: **-2 like** (villain edit)
- Emissary-eliminated player: **+3 underdog** (sympathy)

## VP Screens

### `rpBuildEmissaryVote(ep)` — 3-phase click-to-reveal

1. **Emissary Selection** — Winning tribe shown, volunteer steps forward. Card with emissary portrait, stats, archetype-flavored quote. Uses `_tvState['emissarySelect']`.

2. **Scouting Period** — Emissary arrives at losing tribe camp. Click-to-reveal each scout event (pitches, observations, alliance offers). Portraits for emissary + each interaction partner.

3. **The Pick** — After normal tribal results, new screen: emissary stands, dramatic reveal of who they point at. Eliminated player's portrait + reason text. Bond consequence summary below.

### Badges in `rpBuildCampTribe()`
- `EMISSARY` — on emissary's scouting events
- `EMISSARY PICK` — on the elimination
- `PITCH` — on losing tribe members who lobbied the emissary

### Registration
In `buildVPScreens()` — inserts after tribal council screen when `ep.emissary` exists.

## Text Backlog

### `_textEmissaryVote(ep, ln, sec)`
- Emissary selection line
- Each scouting event summarized
- Normal tribal result
- Emissary pick + reason
- Bond consequence summary

## Episode History Fields
- `ep.emissary = { name, tribe }`
- `ep.emissaryScoutEvents = [...]`
- `ep.emissaryPick = { name, reason }`
- `ep.emissaryBondShifts = [...]`

## Edge Cases
- **2-person losing tribe:** Normal vote eliminates one, emissary pick eliminates the other = tribe wiped. Surviving tribes continue. (Same as any double-elimination edge case.)
- **Emissary's pick is on RI:** Goes through `isRIStillActive()` like any elimination.
- **Emissary has no bonds with losing tribe:** Defaults to threat + heat scoring (bond term is zero).
- **Twist fires same episode as other advantage plays:** Emissary pick happens after all idol/advantage resolution. Advantages already played don't protect against the pick.
