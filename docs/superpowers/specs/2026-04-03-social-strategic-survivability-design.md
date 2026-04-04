# Social/Strategic Survivability Mechanics

## Problem

High-threat social/strategic players (e.g. Bowie at 9.3 threat) generate massive heat post-merge but have no defensive tools to leverage their stats. Challenge beasts survive by winning immunity. Social/strategic players need their own survival path — not as reliable as immunity, but meaningful enough that their stats matter defensively.

## Design Philosophy

- **Helpful but not equivalent to immunity.** These mechanics improve odds but don't replace needing alliances, idols, and luck.
- **Behavior > stats.** The CLAUDE.md rule applies — stats set tendency, but the mechanics should create visible actions and consequences.
- **Every mechanic must be VP-visible.** Camp events fire when the mechanic activates meaningfully, with bond consequences.

## Mechanic 1: Scramble Effect

### What It Does

When a social/strategic player is under high heat (>3), they "work the camp" to reduce pressure. The higher their social and strategic stats, the more effective the scramble.

### Location

Inside `computeHeat`, at the end, post-merge only. Applies after all other heat modifiers.

### Formula

```js
if (gs.phase === 'post-merge' && heat > 3) {
  const scramblePower = s.social * 0.04 + s.strategic * 0.04;
  heat -= scramblePower;
}
```

### Examples

| Player Profile | social | strategic | Heat Reduction |
|---|---|---|---|
| Bowie (mastermind) | 10 | 10 | -0.80 |
| Mid-tier social | 7 | 5 | -0.48 |
| Low social/strategic | 4 | 3 | -0.28 |

### Camp Event

**Trigger:** scramblePower >= 0.5 AND Math.random() < 0.35 (~35% chance per episode).

**Text variants** (use pronouns(name)):
- "{name} pulled three people aside before tribal. By sundown, the conversation had shifted."
- "Nobody's sure who changed the plan. {name} knows."
- "{name} spent the afternoon making rounds. By dinner, {pr.pos} name wasn't coming up anymore."
- "The vote was locked — until {name} had a conversation with the right person at the right time."

**Bond consequence:** +0.3 bond with 1-2 random allies in the tribe (representing social capital spent).

**Badge:** `scramble` — "Worked the camp to deflect votes"

---

## Mechanic 2: Shield Network

### What It Does

High-strategic players keep bigger targets around as shields. When someone else at tribal has higher heat, the strategic player benefits from hiding behind them. Occasionally fires an active camp event where the player visibly steers the tribe toward the bigger target.

### Location

Inside `computeHeat`, post-merge only. After the scramble effect.

### Formula

```js
if (s.strategic >= 6 && gs.phase === 'post-merge') {
  const highestOtherHeat = Math.max(...otherPlayersHeat);
  if (highestOtherHeat > heat) {
    const shieldBonus = Math.min(0.6, (highestOtherHeat - heat) * 0.15) * (s.strategic * 0.1);
    heat -= shieldBonus;
  }
}
```

### Dependency Note

Shield network requires knowing other players' heat values. Since `computeHeat` is called per-player, this needs a two-pass approach:
1. First pass: compute raw heat for all tribal players (without shield network)
2. Second pass: apply shield network using the raw heat values

### Examples

| Player Profile | strategic | Heat Gap | Shield Bonus |
|---|---|---|---|
| Bowie (strategic 10) | 10 | 3.0 | -0.45 |
| Mid-tier strategic | 7 | 2.0 | -0.21 |
| Strategic 5 | 5 | any | 0 (below threshold) |

### Camp Event (Active Shield Steering)

**Trigger:** shieldBonus > 0.3 AND Math.random() < 0.25 (~25% chance).

**Text variants:**
- "{name} mentioned the challenge wins at dinner. Not loudly. Just enough. The tribe did the rest."
- "Every conversation {name} had today ended the same way — with someone else's name."
- "{name} doesn't need to campaign against anyone. {pr.Sub} just ask{pr.sub==='they'?'':'s'} the right questions and let the tribe connect the dots."
- "The target shifted overnight. {name} was the last person seen talking to the swing vote."

**Bond consequence:** -0.3 bond with the meatshield player, BUT only 20% chance of getting caught. Creates future drama — the shield might realize they're being used.

**Badge:** `shield-steer` — "Redirected attention toward a bigger target"

---

## Implementation Notes

### Two-Pass Heat Computation

`computeHeat` is currently a single-function call per player. Shield network requires knowing other players' heat. Options:
- Add a `rawHeatCache` object that stores first-pass results, then apply shield network in a second loop wherever `computeHeat` is called for tribal groups.
- The scramble effect does NOT need the two-pass approach (it only uses the player's own heat).

### Where computeHeat Is Called

The main call site is in `simulateVotes` where heat is computed for all tribal players. The two-pass logic should live there, not inside `computeHeat` itself. `computeHeat` gets a new optional parameter `rawHeatMap` — when provided, shield network applies.

### Event Injection

Both camp events push into `ep.campEvents[campKey].pre` following existing patterns. Badge text/class registered in `rpBuildCampTribe()`.

### What This Does NOT Change

- `threatScore()` formula stays as-is
- Cast builder `threat()` display stays as-is
- Pre-merge targeting is unchanged (challenge weakness still dominates)
- The existing scramble mechanic in `simulateVotes` (line 6849) is separate and still works — that's about sensing you're targeted and joining a safe bloc. These new mechanics are about reducing heat *before* vote decisions happen.
