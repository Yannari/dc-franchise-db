# Stolen Credit — Design Spec

## Overview

A probabilistic camp event where a bold player publicly takes credit for another player's big move. Creates a multi-episode drama arc: theft one episode, potential confrontation the next. Shifts jury perception (bigMoves) and damages relationships.

## Trigger

Fires in `generateCampEvents` post-phase. Checks if a `bigMoves` increment happened this episode for any player at this camp. If so, rolls for a credit stealer.

**Conditions:**
- Episode >= 2 (need at least one tribal for big moves to exist)
- A player at this camp earned a `bigMoves` increment this episode (the "architect")
- A different player at the same camp has `boldness >= 6` (potential stealer)
- Stealer and architect are NOT in the same alliance with bond >= 3 (allies don't steal from allies)
- `gs.stolenCreditFired` is not set (once per game)

## Roll

```
stolenCreditChance = boldness * 0.015 + (bond_with_architect <= -1 ? 0.05 : 0)
```

- Boldness 5 = 7.5%, boldness 6 = 9%, boldness 8 = 12%, boldness 10 = 15%
- +5% bonus if stealer already dislikes the architect (bond <= -1)

## Stealer Selection

From all players at the same camp who are NOT the architect:
- Must have `boldness >= 6`
- If multiple candidates, pick highest `boldness * 0.6 + social * 0.4` (charismatic bullies steal credit best)
- Exclude players in a strong alliance with the architect (same alliance, bond >= 3)

## Theft Effects (same episode, post-phase camp event)

**bigMoves transfer:**
- Stealer: `bigMoves += 1`
- Architect: `bigMoves -= 1` (floor at 0)

**Bond damage:**
- Architect's bond toward stealer: `-(1.5 + stealer's boldness * 0.1)`

**State:**
- `gs.stolenCredit = { stealer, architect, ep, confronted: false }`
- `gs.stolenCreditFired = true` (once per game flag)

**Camp event:** type `'stolenCredit'`, badge text `'STOLEN CREDIT'`, badge class `'gold'`

### Theft Event Text

**Stealer's action** — branches on boldness:

**Boldness >= 8** (shameless, loud):
- 3-4 variants. Stealer retells the move at the campfire as if they masterminded it. Names drop. Hand gestures. The tribe listens. The architect watches from across camp.
- Example: `"[Stealer] is holding court at the fire, retelling the blindside like [sub] drew it up on a whiteboard. 'I pulled [target] aside before tribal and told [obj] exactly what was going to happen.' [Architect] is sitting three feet away. [Sub] didn't say a word."`

**Boldness 6-7** (conversational hijack):
- 3-4 variants. Stealer slides into group discussions and reframes. Subtler but effective. "Yeah WE pulled that off" (meaning "I").
- Example: `"[Stealer] keeps saying 'we' but meaning 'I'. Every time someone brings up last tribal, [sub] [sub==='they'?'steer':'steers'] the story. [Architect] notices. Everyone else doesn't."`

**Architect's reaction in the same event** (brief — NOT the confrontation, that's next episode):

- **Temperament >= 7** (composed): Quiet disbelief. Says nothing. Burns inside. Confessional: "I'm watching someone take credit for MY move and I can't even—" [cuts off].
- **Temperament <= 4** (hothead): Visible anger but swallows it — for now. Jaw clenched, walks away from the fire. Everyone notices.
- **Temperament 5-6** (mid): Forced smile, eye roll, confessional vent. "If [stealer] wants to tell people [sub] did that, fine. The jury will know the truth. I hope."

Each combination (stealer boldness tier x architect temperament tier) has 2-3 text variants selected via hash-based `_pick`.

## Confrontation Check (NEXT episode, pre-phase camp)

Fires if `gs.stolenCredit` exists, `!gs.stolenCredit.confronted`, and it's been 1-2 episodes since the theft.

**Confrontation roll:**
```
confrontChance = architect_boldness * 0.08 + (10 - architect_temperament) * 0.05
```

- Bold hothead (bold 8, temp 2): 64% + 40% = guaranteed
- Bold composed (bold 8, temp 8): 64% + 10% = 74%
- Meek hothead (bold 3, temp 2): 24% + 40% = 64%
- Meek composed (bold 3, temp 8): 24% + 10% = 34%

**If confrontation doesn't fire:** small bond decay (`-0.3` architect → stealer), resentment simmers quietly. No camp event.

**If 2 episodes pass without confrontation:** `gs.stolenCredit` expires (set `confronted: true`). The architect let it go.

### Confrontation Event

Camp event: type `'stolenCreditConfrontation'`, badge text `'CONFRONTATION'`, badge class `'red'`

Two beats in one event text block:

**Beat 1 — The Callout** (architect speaks). Branches on architect personality:

**Hothead** (temperament <= 4): Explosive, public, everyone hears.
- `"[Architect] snaps. It's been building since last tribal. 'You sat there and did NOTHING and then you told everyone it was YOUR move? Say it to my face, [Stealer]. Say it right now.' The camp goes dead silent."`
- `"[Architect] doesn't plan it. It just comes out — at the well, in front of three people. 'You want to know who ACTUALLY flipped the vote? Because it wasn't [Stealer]. Ask me. Ask anyone who was actually paying attention.' [Stealer] puts down [pos] canteen."`

**Bold** (boldness >= 7, temperament >= 5): Calculated confrontation. Not a meltdown — a move.
- `"[Architect] pulls [Stealer] aside after the challenge. 'We both know what happened at that tribal. You didn't orchestrate anything. I did. And if you keep telling people otherwise, I'll make sure the jury knows exactly who did what.' It's not a threat. It's a promise."`
- `"[Architect] waits until the right moment — when enough people are listening. 'Hey [Stealer], tell them again about how you planned the blindside. I love that story. Especially the part where I came to YOU with the plan.' [Stealer]'s smile freezes."`

**Emotional crack** (boldness <= 5, temperament >= 5): Wasn't planning to confront. It spills out.
- `"[Architect] didn't mean to say anything. But sitting there listening to [Stealer] take credit one more time — something breaks. 'That was MY move. You know it was my move. Why are you doing this?' The rawness catches everyone off guard."`
- `"It happens at the worst possible time — right before tribal. [Architect]'s voice cracks: 'I just — I can't listen to this anymore. [Stealer] didn't do anything. I did. And I'm tired of pretending otherwise.' The tribe freezes."`

**Beat 2 — The Response + Outcome**

Determined by stat comparison:
```
architectScore = architect.social + architect.strategic
stealerScore = stealer.social + stealer.boldness
```

**Architect wins** (`architectScore > stealerScore`):
- Architect reclaims partial credit: `bigMoves += 0.5`
- Stealer loses face: `bigMoves -= 0.5`
- Stealer bond drop with 1-2 tribe witnesses: `-0.5` each (people see through stealer)
- Stealer heat: `+0.3` for 1 episode (via `gs.stolenCreditHeat`)
- Text: Stealer backtracks, gets caught in contradictions, tribe sees through it
  - `"[Stealer] tries to laugh it off, but [Architect] has receipts. [Sub] names the conversation, the timing, the exact words. [Stealer] has nothing. The tribe watches [Stealer] shrink. Nobody believes [pos] version anymore."`

**Architect loses** (`stealerScore >= architectScore`):
- Architect looks petty: `bigMoves -= 0.5` (now -1.5 total from original move)
- Architect bond drop with 1-2 witnesses: `-0.3` each (tribe sees architect as dramatic/bitter)
- Text: Stealer dismisses it smoothly, architect can't prove it, tribe sides with stealer
  - `"[Stealer] doesn't flinch. 'I don't know what [Architect] is talking about. We all saw what happened. I'm sorry [sub] [sub==='they'?'feel':'feels'] that way.' It's so smooth it almost sounds sincere. The tribe nods along. [Architect] looks like the petty one."`

**Both outcomes:**
- Bond between architect and stealer: `-1.0` additional
- `gs.stolenCredit.confronted = true` (consumed)

## State

- `gs.stolenCreditFired` — boolean, once-per-game flag
- `gs.stolenCredit` — `{ stealer, architect, ep, confronted }` — active theft tracking, expires after 2 episodes
- `gs.stolenCreditHeat` — `{ player, ep }` — heat boost for stealer after losing confrontation (1 episode)
- `ep.stolenCreditEvents` — saved to episodeHistory for VP

## computeHeat Integration

```js
if (gs.stolenCreditHeat?.player === name && gs.stolenCreditHeat.ep >= currentEp - 1) heat += 0.3;
```

## VP Display

- Theft event: gold "STOLEN CREDIT" badge in camp events, shows stealer + architect portraits
- Confrontation event: red "CONFRONTATION" badge, shows both portraits
- Both render via existing `rpBuildCampTribe` badge logic (add to `badgeText`/`badgeClass` block)

## Constraints

- Once per game (`gs.stolenCreditFired`)
- Episode >= 2
- Pre-merge and post-merge both eligible
- Stealer must have `boldness >= 6`
- Stealer and architect cannot be strong allies (same alliance, bond >= 3)
- `bigMoves` transfer uses floor of 0 (can't go negative)
