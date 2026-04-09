# Reward Trip Bonding Backfire

## Overview

When a post-merge reward winner picks companions, the left-behind players occasionally channel their resentment into action — forming a counter-alliance (if they already have strong bonds) or a loose voting bloc (if they don't). Rare event (~5-8% effective fire rate) with real gameplay consequences.

## Trigger (all gates must pass)

1. **Post-merge individual reward** — tribe rewards don't create personal snub dynamics
2. **Meaningful snub** — at least 1 left-behind player had bond >= 3 with the winner (expected to be picked, wasn't)
3. **Left-behind cohesion** — among the non-picked players, at least 2 share bond >= 1.5 with each other
4. **15% roll** — `Math.random() < 0.15` after all gates pass

Effective fire rate: ~5-8% of individual reward episodes after gate filtering.

## Paths

Score the left-behind group's average pairwise bond to determine outcome:

### Path A — Counter-Alliance (avg pairwise bond >= 2.0)

- Forms a real `gs.namedAlliances` entry via `nameNewAlliance()` (normal random name, no special flavor)
- **Members**: all left-behind players with bond >= 1.0 with the snubbed player(s), capped at `Math.floor(activePlayers.length / 2) - 1` (can't be instant majority — they still need to recruit at tribal)
- **Bond boost** among members: +0.4 (shared grievance)
- **Heat on reward winner**: +1.5 for 1 episode
- **Heat on companions**: +0.8 for 1 episode (guilt by association)
- Alliance persists — `formAlliances` uses it at future tribals

### Path B — Voting Bloc (avg pairwise bond < 2.0)

- No formal alliance — mechanical effects only
- **Bond boost** among snubbed left-behind players (bond >= 3 with winner): +0.3 per pair
- **Heat on reward winner**: +1.0 for 1 episode
- **Side deal** created between the two highest-bonded snubbed players (F2 pact, `genuine` based on loyalty + bond per usual formula)

## Camp Events

Both paths inject into `ep.campEvents[gs.mergeName || 'merge'].post`:

### Path A

```js
{
  type: 'rewardBackfireAlliance',
  players: [/* alliance members */],
  text: `While ${winner} was off enjoying the ${rewardLabel}, the ones left behind started talking. Really talking. By sundown, ${memberList} had something — not just anger, but a plan.`,
  consequences: `Alliance formed. Heat on ${winner} +1.5.`
}
```

Badge: **BACKFIRE** / red-orange

### Path B

```js
{
  type: 'rewardBackfireBloc',
  players: [/* snubbed pair */],
  text: `${player1} and ${player2} sat by the fire, watching the empty shelter. "Funny how ${winner} picks ${companion} over us." The conversation didn't end there.`,
  consequences: `Bonds strengthened. Heat on ${winner} +1.0.`
}
```

Badge: **LEFT BEHIND** / muted red (reuses existing left-behind styling)

## Episode History

Stored on `twistObj` (reward challenge data):

```js
twistObj.rewardBackfire = {
  fired: true,
  path: 'alliance' | 'bloc',
  snubbedPlayers: [...],          // players with bond >= 3 who weren't picked
  leftBehindGroup: [...],         // all non-picked players
  allianceName: '...' | null,     // path A only
  allianceMembers: [...] | null,  // path A only
  blocPair: [p1, p2] | null,     // path B only — side deal pair
  heatTarget: winner,
  heatCompanions: [...],
};
```

Saved through `patchEpisodeHistory` alongside existing reward fields.

## Heat Application

Temporary heat stored in `gs._rewardBackfireHeat`:

```js
gs._rewardBackfireHeat = {
  targets: {
    [winner]: 1.5,        // or 1.0 for bloc path
    [companion1]: 0.8,    // alliance path only
    [companion2]: 0.8,    // alliance path only
  },
  expiresEp: currentEp + 1
};
```

- Applied additively in `computeHeat` when checking `gs._rewardBackfireHeat.targets[playerName]`
- Cleared at episode start when `gs.episode >= expiresEp`

## VP Integration

In the existing reward challenge VP screen (`rpBuildRewardChallenge`), after companion picks and snub cards:

- **Path A**: Red-orange BACKFIRE card showing alliance formation. Names the members. "While [winner] feasted, the camp organized."
- **Path B**: Muted red card showing the bond shifts / side deal. "The ones left behind found common ground."

Slots naturally after the existing LEFT BEHIND snub cards.

## Badge Registration

In `rpBuildCampTribe` badge block:

| Type | Badge Text | Badge Class |
|------|-----------|-------------|
| `rewardBackfireAlliance` | BACKFIRE | red-orange (e.g. `badge-backfire`) |
| `rewardBackfireBloc` | LEFT BEHIND | muted red (existing styling) |

## Scope

### Included
- Engine mechanic (trigger + two paths)
- Camp events with consequences
- Episode history tracking
- Temporary heat system
- VP card on reward screen
- Badge registration

### Not Included (YAGNI)
- No special alliance naming flavor
- No Mole system interaction
- No multi-episode grudge tracking (heat expires, bonds do long-term work)
- No viewer popularity effects
- No text backlog entry (can add later if needed)
