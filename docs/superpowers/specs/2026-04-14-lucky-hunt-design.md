# Lucky Hunt — Challenge Twist Design Spec

## Overview

**Challenge name:** Lucky Hunt
**Twist ID:** `lucky-hunt`
**Phase:** Post-merge only
**Type:** Individual immunity. One player wins immunity from a treasure chest.
**Inspiration:** TDI S1E16 "Search and Do Not Destroy"

A scavenger hunt where every player draws a random clue to a random location, searches for a key, and opens a treasure chest. The hunt itself is a shuffled stream of attempts, events, and social schemes — all interleaved chronologically with causal dependencies. One chest contains immunity. Some keys are duds. Some chests are booby traps.

Alongside the challenge, a **standalone social manipulation camp event system** fires based on cast composition. These events (forge notes, spread lies, kiss traps, campaign rallies) can fire in ANY episode but fire more frequently during Lucky Hunt.

---

## System 1: The Lucky Hunt Challenge

### Phase Structure

```
Round 1: CLUE DRAW
  - Each player draws a random plank from a bucket
  - Plank depicts a location where their key is hidden
  - Difficulty is pure random (Easy/Medium/Hard/Nightmare)
  - Per-player reaction text based on difficulty + personality

Round 2-3: THE HUNT (shuffled stream)
  - A pool of player attempts + hunt events, shuffled randomly
  - NO fixed order — attempts and events interleave
  - After each action, world state updates (who has key, who doesn't, who's stuck)
  - Events check live state before firing (can't steal from keyless player, can't sabotage someone who already succeeded)
  - Continues until all players have attempted or time pressure kicks in

Round 4: SOCIAL SCHEMES
  - Social manipulation events fire during the hunt downtime
  - Check live state: bonds, showmances, alliances, who's vulnerable
  - Only fires if eligible schemers exist (strategic >= 6, loyalty <= 4)

Round 5: LAST CHANCE
  - Players who haven't found their key get one final attempt
  - Time pressure: slightly lower success chance (rushed)
  - No more hunt events — just raw attempts

Round 6: CHEST CEREMONY
  - Players with working keys open chests one at a time
  - Rewards revealed: immunity, advantage, food, booby trap, etc.
  - Players with dud keys get nothing (key doesn't fit)
  - Players who never found their key watch

Round 7: AFTERMATH
  - Campaign rally, comfort victim, expose schemer
  - These fire as camp events in the normal system
```

### Hunt Difficulty Tiers

Assignment is **pure random** — Chris draws from a bucket. A physical beast might get "poetry book," a nerd might get "bear den." The mismatch IS the comedy.

**Easy (6+ locations):**
- Flaming hoop (jump through, grab key)
- Unlocked cabin drawer (just open it)
- Top of the flagpole (climb up)
- Inside a hollow log (reach in blind)
- Hanging from the dock ladder (lean over water)
- Buried under the cold campfire pit (dig)
- Behind the amphitheater seats (crawl under)
- Inside the canteen (ask nicely... just kidding, sneak)

**Medium (6+ locations):**
- Shark-infested lake (key on a pole in the water)
- Beehive (key wired to the hive structure)
- Crocodile bridge (key under a rickety bridge between crocs)
- Inside the confessional outhouse plumbing
- Suspended over a mud pit on a rope
- Tied to a buoy in the rapids
- Inside a woodpecker's tree (the bird fights back)
- Guarded by a territorial goose

**Hard (6+ locations):**
- Chef's kitchen refrigerator (Chef guards it with a cleaver)
- Bear den (key around the bear's neck)
- Communal washroom septic tank (key at the bottom)
- Inside a hornets' nest on a cliff ledge
- Locked in a cage dangling over the lake
- Inside the communal shower drain pipes
- At the bottom of the 1000-foot cliff (climb down)
- In the raccoon nest (raccoon family defends)

**Nightmare (4+ locations):**
- Snake pit + skunk combo den
- Underwater cave (hold breath + navigate dark)
- Suspended from the cliff face on a fraying rope
- Inside the live electrical panel in the mess hall basement

Each location has **4-5 text variants per beat** (draw reaction, arrive, attempt, result) so the same location plays differently based on the player's stats and personality.

### Success Formula

Success chance is proportional to stats vs difficulty tier:

| Tier | Formula | Avg chance |
|---|---|---|
| Easy | `boldness * 0.05 + physical * 0.03 + 0.40` | ~70-80% |
| Medium | `boldness * 0.05 + physical * 0.04 + mental * 0.02 + 0.20` | ~55-65% |
| Hard | `boldness * 0.04 + physical * 0.03 + mental * 0.03 + strategic * 0.02 + 0.10` | ~40-55% |
| Nightmare | `boldness * 0.04 + physical * 0.04 + mental * 0.03 + endurance * 0.02 + 0.05` | ~30-50% |

**Modifiers applied during the hunt:**
- Helped by ally: +0.15
- Sabotaged by rival: -0.15
- Key stolen (someone took your found key): success reverts, you lose it
- Panic/freeze (boldness <= 3 at Hard/Nightmare): -0.10 and narrative beat
- Last-chance round: -0.05 (time pressure)

**Dud key chance:** ~15% flat. You find the key but it doesn't open any chest.

### Hunt Events (fire during Rounds 2-3, shuffled with attempts)

All events check **live state** before firing. Each has real gameplay consequences.

| Event | Condition | Mechanic | Consequence |
|---|---|---|---|
| **Help Ally** | Helper already found key. Target struggling (hasn't found yet). Bond >= 3. | Helper's stats boost target's next attempt +0.15. Helper loses nothing (already found key). | Bond +0.5 between them. Camp event: HELPED. |
| **Sabotage Rival** | Saboteur hasn't found own key OR doesn't care. Target hasn't found yet. Bond <= -2 OR strategic >= 6. | Target's success chance reduced -0.15. Saboteur might get caught (target intuition vs saboteur strategic). | If caught: bond -1.0, saboteur gets heat. If uncaught: target fails/harder. |
| **Trade Intel** | Two players encounter each other. Neither hostile (bond >= 0). | Both get +0.05 success boost. If one is strategic >= 7, they might lie (give bad intel = -0.05 to the other). | Bond +0.2 (or -0.3 if lied and caught). |
| **Steal Key** | Stealer has boldness >= 7 OR strategic >= 7. Target just found their key. | Stealer takes target's key AND their chest assignment. Stealer's original key/location is gone. Target must re-find or fail. | Bond -2.0. Huge heat if witnessed. Camp event: KEY STOLEN. |
| **Ambush/Scare** | Physical >= 7. Target at their location, currently attempting. | Target gets spooked, attempt disrupted. -0.10 to current attempt. | Bond -0.5. Popularity +1 for ambusher (entertainment). |
| **Panic/Freeze** | Player with boldness <= 3 at Hard or Nightmare location. | Player freezes. Auto-fail current attempt unless someone helps within the next few events. | personalScore -1.0. Narrative beat. |
| **Showoff** | Boldness >= 8. Easy or Medium location. | Player completes spectacularly — backflip through the hoop, one-handed grab, etc. | Popularity +2. personalScore +1.0. Bond +0.2 from witnesses. |
| **Unlikely Teamup** | Two players with bond <= -1 end up at adjacent locations. Random ~20% chance. | They reluctantly cooperate on something. Both get +0.05 success. | Bond +0.5 (grudging respect). |
| **Discovery** | Player with intuition >= 6 searching a Hard/Nightmare location. ~15% chance. | Stumbles onto intel: another player's hidden advantage, a secret alliance, or evidence of a scheme. | Information flows into targeting/voting. Camp event: DISCOVERED SOMETHING. |

### Chest Rewards

Players with working keys open chests. Rewards shuffled each game.

| Reward | Count | Effect |
|---|---|---|
| **Immunity** | 1 | Invincibility this tribal. |
| **Advantage** | 0-1 (if advantage system enabled) | Extra vote, vote steal, or idol clue. Pushed to `gs.advantages[]`. |
| **Shareable Reward** | 1 | Food basket. Player chooses ONE person to share with. Bond +1.0 with them, -0.3 with everyone not chosen (jealousy). Survival boost if survival system active. |
| **Food/Comfort Items** | Fill remaining slots | Chips, cologne, toaster, leg lamp, ships in a bottle, accordion, body spray, candy bar. Survival boost (+5 `gs.tribeFood` for merge camp) if survival active. Popularity +1. |
| **Booby Trap** | 1 | Paint bomb, skunk spray, or glitter cannon. Humiliation. Popularity -1. |

**Dud keys** (~15%): Player found a key but it doesn't open any chest. They watch.
**No key found**: Player never completed the hunt. They watch.

---

## System 2: Social Manipulation Camp Events (Standalone)

These are **regular camp events** that fire in the normal camp event system. NOT tied to Lucky Hunt. They fire whenever conditions are met — any episode, any challenge. During Lucky Hunt episodes, their fire rate is boosted (~40% vs ~15%).

### Trigger Conditions

- At least one eligible **schemer**: `strategic >= 6` AND `loyalty <= 4`
- A viable **target** exists: showmance pair, strong bond pair (>= 4), exposed alliance
- Random gate: ~15% per eligible schemer per episode (bumped to ~40% during Lucky Hunt)

### Event Types

**Forge Note**
- Schemer writes a fake note, plants it for the target to find
- Target reads it → bond damage with the person "named" in the note
- Damage: -1.0 to -3.0 based on target's mental (high mental = suspicious = less damage)
- Exposure check: target's intuition vs schemer's strategic. If exposed, schemer takes heat.
- Badge: FORGED NOTE (red)

**Spread Lies**
- Schemer tells player X that player Y said terrible things about them
- If X's social >= schemer's strategic: X doesn't buy it (fail)
- Success: X's bond with Y drops -1.5, X is angry
- Failure: X suspects schemer, bond with schemer drops -0.5
- Badge: LIED TO (red)

**Kiss Trap**
- Schemer targets a showmance. Engineers a scene that looks like infidelity.
- Requires: a showmance exists, schemer has an accomplice (bond >= 2 with schemer), showmance partner can be lured to witness
- Success: showmance partner sees the "kiss." Bond damage -2.0 to -4.0. Potential showmance destruction. Accomplice also takes heat.
- Failure: target doesn't show up, or sees through it. Schemer exposed.
- This is the RAREST event. Needs perfect conditions. When it fires, it's devastating.
- Badge: KISS TRAP (red) / HEARTBROKEN (red) on victim

**Campaign Rally**
- Social player (social >= 6) rallies others to vote a specific target after the challenge
- Players with bond >= 2 to rallier are influenced. Each has `rallier.social * 0.05` chance to flip vote.
- Target gets +1.5 heat for 2 episodes
- Badge: CAMPAIGNED (blue)

**Whisper Campaign**
- Subtler than rally. Schemer plants seeds with individuals privately.
- Smaller per-player influence but harder to trace back
- If caught (target's intuition >= schemer's strategic): whisper is exposed, schemer takes heat
- Badge: WHISPERS (blue)

**Expose Schemer**
- Player with intuition >= 6 catches a scheme in progress
- Fires as a REACTION to another social event (forge note, lies, kiss trap)
- Schemer exposed publicly: bond -0.5 to -1.0 from everyone, +2.0 heat
- Victim gets sympathy: bond +0.3 from everyone
- Badge: EXPOSED (gold) on exposer, CAUGHT (red) on schemer

**Comfort Victim**
- Player with loyalty >= 6 comforts someone who was schemed against
- Fires as a REACTION to forge note, lies, or kiss trap targeting someone
- Bond +1.0 to +2.0 between comforter and victim
- Potential alliance formation trigger
- Badge: COMFORTED (green)

### The Heather Sequence

When conditions align perfectly (schemer strategic >= 7, a showmance exists, an accomplice with bond >= 2 exists, the showmance partner can witness), the full chain can fire:

1. Forge Note → lure victim to location
2. Kiss Trap → schemer kisses the showmance target, partner witnesses
3. Victim cries → emotional devastation
4. Comfort from ally → someone steps in
5. Campaign Rally → rallier campaigns to vote out the "cheater" or the schemer
6. But schemer has immunity → wrong person goes home

This full chain is maybe 5-10% occurrence when conditions are met. It's the episode-defining moment.

---

## VP Screen

**Theme:** Pirate treasure map aesthetic. Parchment background, compass rose, X-marks-the-spot.

**Click-to-reveal flow — one unified timeline:**
1. Chris announcement (pirate costume, cannon)
2. Clue draws (one player at a time, reaction text)
3. THE HUNT — interleaved attempts + events + schemes in chronological order
4. Chest ceremony — one by one reveal
5. Aftermath — campaign, comfort, fallout

Each click advances the timeline by one event. The story unfolds chronologically — a hunt attempt, then a sabotage, then another attempt, then a scheme, all mixed.

**Debug tab:** Per-player row: difficulty, location, success chance, key result, chest reward, hunt events involving them, social events involving them.

**Text backlog:** Full chronological narrative. Each event is a line or block.

---

## Data Shape

```javascript
ep.luckyHunt = {
  timeline: [
    // Every event in chronological order
    { type: 'clueDraw', player, difficulty, location, text, reaction },
    { type: 'huntAttempt', player, success, text, personalScores },
    { type: 'huntEvent', subtype: 'help'|'sabotage'|'steal'|'ambush'|'panic'|'showoff'|'teamup'|'tradeIntel'|'discovery', players, text, consequences, personalScores },
    { type: 'socialScheme', subtype: 'forgeNote'|'spreadLies'|'kissTrap'|'campaignRally'|'whisperCampaign'|'exposeSchemer'|'comfortVictim', players, text, consequences, personalScores },
    { type: 'lastChance', player, success, text, personalScores },
    { type: 'chestOpen', player, reward: { type, name, description }, text },
  ],
  huntResults: {
    // Per-player summary
    playerName: { difficulty, location, foundKey, dudKey, chestReward, helpedBy, sabotagedBy, stolenFrom, stolenBy },
  },
  immunityWinner: name,
  chestRewards: { playerName: { type, name } },
};
```

**Camp events generated:** Social manipulation events go through normal camp event system with standard structure: `{ type, players[], text, consequences, badgeText, badgeClass }`.

**Heat tracking:** `gs._luckyHuntHeat` for saboteurs caught. `gs._schemeHeat` for schemers exposed (this one is global, not challenge-specific, since social manipulation fires in any episode).

**Survival integration:** Food/comfort chest rewards add to `gs.tribeFood[mergeCampKey]` when survival system is active.

---

## Twist Catalog Entry

```javascript
{ 
  id: 'lucky-hunt', 
  emoji: '🗝️', 
  name: 'Lucky Hunt', 
  category: 'challenge', 
  phase: 'post-merge', 
  desc: 'Scavenger hunt for keys to treasure chests. Random locations, random difficulty. Find your key, open your chest. One chest has immunity. Some keys are duds. Help allies, sabotage rivals, or scheme in the chaos.',
  engineType: 'lucky-hunt',
  incompatible: [all other challenge replacements]
}
```

---

## Camp Event Badge Registration

New badge types to register:
- `luckyHuntHelped` — HELPED (green)
- `luckyHuntSabotaged` — SABOTAGED (red)
- `luckyHuntStolen` — KEY STOLEN (red)
- `luckyHuntShowoff` — SHOWOFF (gold)
- `luckyHuntPanic` — FROZE (red)
- `luckyHuntDiscovery` — DISCOVERED SOMETHING (blue)
- `luckyHuntBoobyTrap` — BOOBY TRAPPED (red)
- `luckyHuntDud` — DUD KEY (red)
- `socialForgeNote` — FORGED NOTE (red)
- `socialSpreadLies` — LIED TO (red)
- `socialKissTrap` — KISS TRAP (red)
- `socialHeartbroken` — HEARTBROKEN (red)
- `socialCampaignRally` — CAMPAIGNED (blue)
- `socialWhispers` — WHISPERS (blue)
- `socialExposed` — EXPOSED (gold)
- `socialCaught` — CAUGHT (red)
- `socialComforted` — COMFORTED (green)
