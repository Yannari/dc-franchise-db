# Cultural Reset — Design Spec

**Date:** 2026-03-28
**Status:** Approved
**Replaces:** Current cultural-reset twist (flat bond hits, generic narrative)

---

## Overview

A social bomb that exposes all alliances publicly, tests which ones are real, dissolves the fake ones, and forces every player to react based on personality. Alliances only — no advantage exposure. Tribal council still runs this episode.

## When

Post-merge or pre-merge. Phase: `'any'`. One-time event per season (scheduled via format designer).

## Episode Flow

1. Normal camp events fire
2. Cultural Reset announced — all active alliances publicly named
3. Each alliance tested: survive / crack / dissolve
4. Double-dipping players exposed (severity scales with conflict level)
5. Per-player personality reaction fires (camp event + bond changes)
6. Free agents scramble — immediate alliance reformation possible
7. Normal challenge + tribal council follows — chaos feeds directly into the vote

## Alliance Survival Check

Each active named alliance is evaluated:

| Outcome | Condition | What happens |
|---------|-----------|--------------|
| **Survives** | Avg bond >= 3 among active members, no betrayals in last 3 episodes | Alliance is now public but intact. Becomes a visible target. |
| **Cracks** | Avg bond 1-3, or exactly 1 betrayal in history | Members choose: loyalty 7+ recommits, loyalty <= 4 leaves, loyalty 5-6 is 50/50 roll. |
| **Dissolves** | Avg bond < 1, or 2+ betrayals, or only 1 active member | Alliance set to `active: false`. Members become free agents. |

### Cracking Mechanic

When an alliance cracks:
- Each active member rolls based on loyalty
- `loyalty >= 7`: stays (recommits)
- `loyalty <= 4`: leaves
- `loyalty 5-6`: `Math.random() < 0.5` → stays or leaves
- Players who leave get an `allianceQuits` entry
- If only 1 member remains after the crack, alliance dissolves
- Camp event per departure: "{name} looked at {alliance} and walked away."
- Camp event per recommitment: "{name} looked at {alliance} and chose to stay."

## Double-Dipping Exposure

Players in 2+ active alliances are flagged. Severity depends on whether their alliances conflict:

### Conflict Detection

Two alliances conflict if:
- Alliance A's stated target at formation or recent tribals is a member of Alliance B (or vice versa)
- Members of one alliance voted against members of the other in recent episodes
- Fallback: any two alliances that don't share all members are "non-overlapping" (mild conflict)

### Severity

| Level | Condition | Bond hit | Narrative |
|-------|-----------|----------|-----------|
| **Conflicting** | Alliances targeted each other's members | -2.5 with both groups | "Voting us out with one hand, shaking our hands with the other." |
| **Overlapping** | Same general direction, no direct conflict | -1.0 with both groups | "Playing multiple angles. Strategy, not betrayal." |

### Exposed Player Tracking

`twistObj.exposedPlayers` stores:
```js
{ name, alliances: [name1, name2], conflicting: boolean, severity: number }
```

## Per-Player Personality Reactions

Every active player gets a reaction based on their stats. Each reaction creates a camp event with bond consequences.

| Personality | Trigger | Reaction | Mechanical effect |
|-------------|---------|----------|-------------------|
| Strategic 7+ | Any | Pivots immediately. Proposes new deals. | "Strategic scramble" event. +0.5 bond with first ally approached. |
| Loyal 7+ | Was in exposed alliance | Devastated. Feels violated by the exposure itself. | Emotional → paranoid or desperate. -0.3 bond with everyone. |
| Bold 7+ | Was double-dipping | Owns it publicly. "I played both sides." | 50/50 roll: respect (+0.5 tribe bond) OR target (+1.5 heat next tribal). |
| Social <= 4 | Any | Withdraws from camp. Overwhelmed. | -0.5 bond with everyone. Emotional → uneasy. |
| Not in any alliance | N/A | Vindicated. The clean player. | +0.5 bond with everyone. Tribe trusts the outsider. |
| Temperament 7+ | Any | Stays calm. Doesn't overreact. | Emotional state unaffected. Others notice the composure. |
| Temperament <= 3 | Was in exposed alliance | Explodes. Confronts someone. | Blowup event. -1.0 bond with the person confronted. |
| Exposed double-dipper | Caught in 2+ alliances | In the spotlight for the wrong reasons. | Bond damage (scaled by conflict). Biggest target this tribal. |

### Priority

Reactions are not mutually exclusive — a player can be strategic + double-dipper + bold. Apply all that qualify. Bond effects stack.

## Camp Events Generated

### Exposure Events (1 per alliance)

- "{alliance} is now public knowledge. Every member, every target — the tribe knows."
- "The reset named {alliance}. {leader}'s face said everything."
- "{name} was in {alliance1} and {alliance2}. The tribe connected the dots in seconds."
- "{name} wasn't in any alliance. After the reset, that's the safest position in the game."

### Alliance Outcome Events

- **Survived:** "{alliance} is still standing — and now the whole tribe knows it. That's either strength or a target."
- **Cracked:** "{name} looked at {alliance} and walked away. {other} stayed. The alliance is half of what it was."
- **Dissolved:** "{alliance} is done. The bonds weren't strong enough to survive the light."

### Personality Reaction Events

- **Strategic pivot:** "{name} pulled three people aside within ten minutes of the reset. The new game starts now."
- **Loyal devastation:** "{name} sat by the fire for an hour after the reset. Didn't talk to anyone."
- **Bold ownership:** "{name} stood up at camp and said it out loud: 'Yeah, I was in both. And I'd do it again.'"
- **Withdrawal:** "{name} disappeared after the reset. Found by the water. Alone."
- **Confrontation:** "{name} walked straight up to {enemy}. 'You were in {alliance}? While telling me you were with me?' The camp went quiet."
- **Vindication:** "Nobody was looking at {name} before the reset. Now everyone is. And for once, that's a good thing."
- **Calm composure:** "While the camp burned around {pr.obj}, {name} sat still. Watching. Thinking. That composure is either admirable or terrifying."

### Scramble Events (post-reset, pre-tribal)

- "{name} approaches {target} for a new alliance. 'Everything just changed. We need to talk.'"
- "{name} and {target} find each other after the reset. Former enemies, potential new allies."
- "The free agents are circling. {name} has no alliance and everyone knows it — that's power, if {pr.sub} play{pr.sub==='they'?'':'s'} it right."

## VP Screen Design

### Cultural Reset Screen (replaces generic twist scene)

**Theme:** `tod-dusk` — amber/orange tones, tension without pure darkness.

**Layout:**
1. **Title:** "Cultural Reset" with 🔄 icon
2. **Announcement text:** "Every secret in the game was laid bare at once."
3. **Alliance cards** — one per active alliance:
   - Alliance name + member portraits
   - Average bond indicator (colored bar: green high, red low)
   - Outcome badge: SURVIVED (green) / CRACKED (amber) / DISSOLVED (red)
   - If cracked: show who stayed vs who left
4. **Exposed Players section** — double-dippers highlighted:
   - Portrait + both alliance names
   - Conflict level badge: CONFLICTING (red) or OVERLAPPING (amber)
5. **Free Agents section** — players now without an alliance:
   - Portraits with "FREE AGENT" badge
6. **Personality Reactions** — per-player moment cards:
   - Portrait + reaction text + badge (PIVOTING / DEVASTATED / OWNS IT / WITHDRAWN / VINDICATED / COMPOSED / EXPLODES)

### Badge System (rpBuildCampTribe)

New event types for badge handling:
- `culturalResetExposure` → "EXPOSED" (red)
- `culturalResetSurvived` → "ALLIANCE SURVIVED" (green)
- `culturalResetCracked` → "ALLIANCE CRACKED" (amber)
- `culturalResetDissolved` → "DISSOLVED" (red)
- `culturalResetVindicated` → "VINDICATED" (green)
- `culturalResetPivot` → "PIVOTING" (gold)
- `culturalResetBlowup` → "EXPLODES" (red)

## Engine Integration

### State Changes

- `gs.namedAlliances` modified: weak alliances set `active: false`, cracked alliances lose members
- `gs.playerStates[name].emotional` updated for affected players
- Bond changes via `addBond()` — all proportional, no flat values
- `twistObj` stores: `revealedAlliances`, `exposedPlayers`, `allianceOutcomes` (survive/crack/dissolve per alliance), `personalityReactions`

### Interaction with Other Systems

- `formAlliances()` runs AFTER the reset — new voting blocs form from the rubble
- `computeHeat()` picks up the new bond landscape
- `checkAllianceRecruitment()` fires post-tribal as normal — free agents are prime recruitment targets
- Camp events from the reset inject into `ep.campEvents` for the VP to display

### Episode History Save

```js
culturalReset: {
  revealedAlliances: [...],
  allianceOutcomes: { [allianceName]: 'survived'|'cracked'|'dissolved' },
  exposedPlayers: [...],
  personalityReactions: [...],
  freeAgents: [...],
  crackDecisions: [{ player, alliance, stayed: boolean }]
}
```

## No Advantage Exposure

The reset is purely social. Hidden Immunity Idols, Second Life Amulets, Extra Votes, Vote Steals, KiP — all stay secret. The reset tests relationships, not preparation.

## Priority

HIGH — the twist already exists but is hollow. This fills it with meaningful social mechanics that genuinely reshape the game. Touches: `applyTwist` (cultural-reset handler), `generateTwistScenes`, camp events, bond system, alliance system, VP screen builder, badge handling.
