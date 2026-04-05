# Social Politics — Active Campaigning System

## Overview

Players don't actively campaign or politic between tribals. Camp events are reactive (things happen TO players) rather than proactive (players MAKE things happen). This system adds four types of political actions that high-social/strategic players initiate: side deals, info trades, loyalty tests, and vote pitches.

Also removes the shield network mechanic from `computeHeat` — vote pitches absorb that role with actual visible gameplay instead of silent heat math.

## Design Rules

- **ALL proportional.** No stat thresholds. Every stat point matters. A social 6 player is 60% as likely as a social 10 player, not "eligible vs not."
- **Budget:** 3-5 political actions per episode (camp actions). Vote pitches are separate (at tribal, 1-2 max).
- **Event cap bump:** increase `totalForGroup` by +3 to make room for political actions without cutting existing camp events.
- **Every action has consequences** — bond changes, state changes, knowledge tracking. No cosmetic-only actions.

## Action 1: Side Deals — `gs.sideDeals[]`

### Data Structure

```js
gs.sideDeals = [{
  players: [A, B],       // the two (or three) players
  initiator: A,          // who proposed
  madeEp: 3,            // episode formed
  type: 'f2',           // 'f2' or 'f3'
  active: true,          // false when broken
  genuine: true,         // false if initiator doesn't mean it
}]
```

### Flow

1. **Initiation weight:** `strategic * 0.04 + social * 0.04` — proportional, no threshold
2. **Partner selection:** highest bond player not already in a deal with initiator
3. **Acceptance:** `bond_with_initiator * 0.08 + social * 0.03 + (10 - existing_deals) * 0.05`
4. **Bond:** +1.0 both ways on acceptance
5. **Genuine check:** `loyalty * 0.1` chance of being genuine. Loyalty 3 = 30% genuine. Loyalty 9 = 90%. Non-genuine deals create perceived bond gap on partner.

### Breaking a Deal

- Voting against deal partner = `active: false`
- Bond damage: -2.0 (on top of normal betrayal damage)
- Camp event: `BROKEN DEAL` red badge
- Partner emotional state shifts to `paranoid` or `desperate`

### Multiple Conflicting Deals

- Max 3 active deals per player
- Discovery chance per episode per overlapping deal: `intuition * 0.03` (from other partners)
- Discovery: bond damage from both partners, camp event exposing the double-dealer

### VP Display

- Relationship section: `F2 DEAL` or `F3 DEAL` tag on pairs with active deals
- Camp event on formation with `SIDE DEAL` gold badge

### Camp Event Text (formation)

- "{A} pulled {B} aside after dark. The conversation lasted ten minutes. When they came back, something had changed."
- "{A} and {B} made a promise. Whether it means anything is a question for later."
- "{A} looked {B} in the eye and said two words: 'Final two.' {B} didn't hesitate."

### Camp Event Text (broken)

- "{A} voted out {B}'s deal partner. The promise from episode {madeEp} is dead."
- "{B} trusted {A}. That trust was specific — a final two deal, made in private. {A} just broke it in public."

## Action 2: Info Trades

### Flow

1. **Initiation weight:** `intuition * 0.04 + strategic * 0.03` — proportional
2. **Requires knowledge:** player must have something to trade (known idol holder, alliance target, advantage holder)
3. **Partner selection:** weighted by `bond * 0.06 + (10 - threatScore) * 0.02` — trade with trusted, non-threatening players
4. **Bond:** +0.5 both ways
5. **False info chance:** `(10 - loyalty) * 0.08`. Loyalty 3 = 56%. Loyalty 8 = 16%.
6. **True info:** target gains real `gs.publicKnowledge` entry. Feeds into targeting.
7. **False info:** target gains wrong knowledge. When acted on and disproven, bond -2.0 with liar + perceived bond correction.

### Knowledge Types

- Idol holder identity
- Alliance target
- Vote plan
- Advantage holder (vote steal, sole vote, etc.)

### Camp Event Text

- "{A} sat down next to {B} and said: 'I'm going to tell you something. And then you're going to owe me.' {B} listened."
- "{A} traded information for trust. Whether the information was real is another question."
- "A quiet exchange at the water well. {A} knows something {B} didn't. Now {B} knows too — or thinks they do."

### Badge

- `INFO TRADE` gold for real trades
- No badge for false ones (deception hidden until it unravels)

## Action 3: Loyalty Tests — `gs.loyaltyTests[]`

### Data Structure

```js
gs.loyaltyTests = [{
  tester: A,
  target: B,
  falseInfo: 'voting for X',  // what was planted
  plantedEp: 5,
  resolved: false,             // true when spread detected or 2 eps pass
}]
```

### Flow

1. **Initiation weight:** `strategic * 0.05 + (10 - loyalty) * 0.03` — schemers test more
2. **Target selection:** weighted by `(10 - bond) * 0.05 + strategic * 0.03` — test people you're unsure about
3. **Plant:** A tells target a specific false piece of info
4. **Spread check (each subsequent episode):** other players who interact with target roll `target's (10 - loyalty) * 0.06 + social * 0.02`
5. **If spreads:** leaker exposed. Bond -1.5. Badge: `FAILED TEST` red. Target is known untrustworthy.
6. **If no spread after 2 episodes:** trust earned. Bond +0.8. Badge: `TRUST EARNED` green.
7. **Counter-detection:** target intuition * 0.05 chance of realizing they're being tested. If caught: tester looks manipulative, bond -1.0, target warns allies.

### Camp Event Text (planted)

- "{A} told {B} something very specific. Something that isn't true. Now {A} waits."
- "A test disguised as a conversation. {A} planted a seed with {B}. If it grows somewhere it shouldn't, {A} will know who to cut."

### Camp Event Text (spread detected)

- "{A} planted a seed. It grew. Now {A} knows exactly who can't keep their mouth shut."
- "The false information came back. {A} heard it from {C} — which means {B} talked. Trust revoked."

### Camp Event Text (passed)

- "{A} told {B} something nobody else knows. {B} kept it quiet. That means something."
- "Two episodes. Not a word. {B} passed a test they didn't know they were taking."

## Action 4: Vote Pitches (replaces Shield Network)

### Flow

1. **When:** during `simulateVotes`, after alliance targets are set, before individual vote decisions
2. **Who pitches:** each player at tribal rolls `social * 0.05 + strategic * 0.03 + boldness * 0.02`. Max 1-2 pitchers per tribal.
3. **Trigger:** pitcher disagrees with alliance target OR is unallied and wants to redirect
4. **Pitch target:** pitcher proposes alternative name via `pickTarget` from their perspective
5. **Flip check per voter:** `pitcher_social * 0.03 + bond_with_pitcher * 0.04 - voter_loyalty * 0.02 - bond_with_current_target * 0.03`
6. **Cap:** max 2 voters flip per pitch

### Consequences

- **Success (1+ flips):** +0.3 bond with flipped voters. Camp event shows the scramble. If pitch target goes home: "orchestrated the vote" narrative.
- **Failure (0 flips):** +0.3 heat next episode. Camp event: failed pitch visible.

### Badge

- `VOTE PITCH` gold for successful
- No badge for failed (camp event only)

### Integration

New block inside `simulateVotes`, after alliance targets set, before the main voter loop. Flipped voters change their `target` variable — rest of vote logic proceeds normally.

## Shield Network Removal

### What Gets Removed

- Shield network block in `computeHeat` (~15 lines starting at `if (gs.phase === 'post-merge' && s.strategic >= 8)`)
- `gs._shieldActivations` tracking
- Shield save in `ep._debugShield`
- Shield section in debug screen (Hidden Moves tab)
- Shield camp events in `generateCampEvents` (`shieldSteer`, `shieldCaught`)

### What Stays

- Scramble effect (different mechanic — reduces own heat)
- Vote pitches absorb the "redirect votes toward bigger target" role

## Debug Screen Integration

### This Episode Tab

- Active side deals (who + when)
- Info trades this episode (who traded what, real or false)
- Loyalty tests in progress (planted, waiting for resolution)
- Vote pitches this episode (who pitched, proposed target, who flipped, success/fail)

### Hidden Moves Tab

- Side deals formed this episode
- Info trades this episode
- Loyalty tests this episode (planted or resolved)
- Vote pitches this episode (replaces shield history)

### Perceived Bonds Tab

- Non-genuine side deals show as perception gap source

## Function Architecture

- `checkSocialPolitics(ep)` — main function, called during `generateCampEvents` after main event pool. Handles side deals, info trades, loyalty tests. Budget: 3-5 total.
- `checkLoyaltyTestResolution(ep)` — called each episode, checks pending tests for spread/pass
- `checkSideDealBreaks(ep)` — called after vote resolution, detects broken deals
- `checkConflictingDeals(ep)` — called each episode, rolls discovery chance for multi-deal players
- Vote pitch logic lives inline in `simulateVotes`

## Implementation Order

1. Remove shield network
2. Core functions: `checkSocialPolitics`, side deals + info trades
3. Loyalty tests (requires multi-episode tracking)
4. Vote pitches (requires `simulateVotes` integration)
5. Debug screen updates
6. VP display (F2 DEAL tags, camp events)
