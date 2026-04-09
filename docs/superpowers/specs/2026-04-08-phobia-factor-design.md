# Phobia Factor — Design Spec

## Overview

Pre-merge schedulable twist inspired by Total Drama Island's "Phobia Factor" episode. **Replaces the immunity challenge**. Each player is randomly assigned a fear. They confess their fears around the campfire, then Chris weaponizes it as the challenge. Each player faces their fear — conquer it or fail. Tribe with the best completion percentage wins immunity. Worst tribe goes to tribal. If a tribe is losing badly, their last player gets a triple-points clutch dare.

- **Twist ID**: `phobia-factor`
- **Category**: `immunity` (replaces challenge)
- **Phase**: Pre-merge only, not episode 1
- **Handles**: 2, 3, or 4+ tribes
- **Produces**: Winning tribe + losing tribe. Normal tribal follows.

## Episode Flow

1. **Cold Open** — normal
2. **Campfire Confession** — camp event: each player reveals their assigned fear. Bond boost between players who share fears. Vulnerability = trust.
3. **Chris Announcement** — "We watched the tapes. Today's challenge: face your fear."
4. **Phobia Factor Challenge** — each player faces their fear. Pass/fail per player. Tribe scores by completion percentage.
5. **Triple Points Clutch** — if a tribe is losing badly after all players go, one player gets offered a triple-points dare. Pass = tribe catches up. Fail = extra shame.
6. **Result** — best % wins immunity. Worst % goes to tribal. Normal tribal follows.

## Fear Assignment

Each player gets ONE fear randomly assigned from the `PHOBIA_POOL`. Fears are assigned at the start of the episode (before the campfire scene).

Two players CAN get the same fear (random chance). If they do:
- They face it together (side by side), even if on different tribes
- Both still individually pass or fail
- Creates a rivalry/bonding moment

## Fear Pool (Separate from Say Uncle / TDD)

4 categories, 15 fears each (60 total). Framed as phobias, not dares.

### Pain fears — things that hurt

| Title | Description |
|---|---|
| Hot Coals | Walk barefoot across hot coals. |
| Bee Stings | Stand still while bees land on you. |
| Ice Water Immersion | Submerge yourself in ice water for 10 seconds. |
| Cactus Walk | Walk through a cactus patch barefoot. |
| Electric Shock | Sit in a chair that delivers mild shocks. |
| Fire Walk | Walk between two walls of flame. |
| Pepper Spray | Stand in a mist of pepper spray. Eyes open. |
| Ant Swarm | Let fire ants crawl over your hands. |
| Jellyfish Touch | Touch a jellyfish with your bare hand. |
| Nail Bed | Lay on a bed of nails for 10 seconds. |
| Rubber Band Snap | Let the tribe snap rubber bands at your arms. |
| Slap Challenge | Get slapped across the face. Don't flinch. |
| Branding Iron | Hold a fake branding iron close to your skin. Don't pull away. |
| Sunburn Box | Sit in a box under heat lamps for 10 seconds. |
| Hail Storm | Stand under a machine that pelts you with ice. |

### Fear fears — things that terrify

| Title | Description |
|---|---|
| Snakes | Pick up a live snake. Hold it. |
| Spiders | Let a tarantula walk on your hand. |
| Buried Alive | Get sealed in a glass box under sand for 5 minutes. |
| Heights | Stand on the edge of a cliff. Look down. |
| Darkness | Get locked in a pitch-black room for 60 seconds. |
| Confined Spaces | Climb into a coffin. Lid closes. 10 seconds. |
| Deep Water | Get lowered into deep water in a shark cage. |
| Rats | Stand in a room full of rats. |
| Bats | Sit in a cave full of bats. Don't run. |
| Thunder | Sit through a simulated thunderstorm at close range. |
| Clowns | Sit in a room with a clown staring at you. |
| Being Chased | Get chased by a masked figure through the woods. |
| Wolves | Make eye contact with a wolf for 10 seconds. |
| Quicksand | Stand in quicksand up to your waist. Don't struggle. |
| Haunted House | Walk through a haunted house alone. |

### Gross fears — things that disgust

| Title | Description |
|---|---|
| Worms | Jump into a pool of worms. Submerge. |
| Leeches | Sit in a barrel of leeches. |
| Cockroaches | Let cockroaches crawl on your face. |
| Sewage | Snorkel in swamp water. Face down. |
| Rotten Food | Eat a spoonful of week-old camp food. |
| Maggots | Let maggots be spread on your back. Lay still. |
| Fish Guts | Stick your hands into a bucket of fish guts. |
| Slug Bath | Lay in a bathtub of slugs. |
| Bird Droppings | Stand under a birdcage. Look up. |
| Dumpster | Sit inside a closed dumpster for 30 seconds. |
| Mystery Meat | Eat a mystery meat patty. Don't ask what it is. |
| Swamp Mud | Get buried in swamp mud up to your neck. |
| Catfish | Kiss a live catfish on the mouth. |
| Roadkill | Lay your head on a roadkill pillow. |
| Nose Hair Pull | Have all your nose hairs pulled at once. |

### Humiliation fears — things that shame

| Title | Description |
|---|---|
| Green Jelly Pool | Dive into a pool of green jelly from a high board. |
| Chicken Costume | Wear a chicken costume and cluck for 60 seconds. |
| Public Singing | Sing your worst song in front of everyone. |
| Baby Outfit | Wear a baby outfit and cry for your bottle. |
| Clown Makeup | Get full clown makeup. Do a routine. |
| Wedgie Walk | Give yourself a wedgie and walk the length of camp. |
| Dance Solo | Dance alone in front of everyone. No music. |
| Love Confession | Confess love to the person you like least. On camera. |
| Dunce Cap | Wear a dunce cap and sit in the corner while everyone watches. |
| Ugly Wig | Wear the ugliest wig imaginable. All day. |
| Cow Costume | Wear a cow costume. Parade around camp. Moo on command. |
| Truth Serum | Answer any question the tribe asks. Honestly. |
| Belly Flop | Do a belly flop off the dock. Maximum splash. |
| Being Mocked | Stand on stage while the tribe roasts you for 60 seconds. |
| Walk of Shame | Walk a lap around camp while everyone slow-claps. |

## Survival Roll

Same stat mapping as Say Uncle:

```
score = primaryStat * 0.07 + secondaryStat * 0.04 + (Math.random() * 0.25 - 0.05)
passThreshold = 0.45
```

| Category | Primary | Secondary |
|---|---|---|
| Pain | Endurance | Physical |
| Fear | Boldness | Endurance |
| Gross | Boldness | Physical |
| Humiliation | Boldness | `(10 - social)` |

No fatigue — each player only faces ONE fear. No multi-round scaling needed.

## Triple Points Clutch

After all players have gone, check if any tribe is losing badly:

**Trigger**: Losing tribe's completion % is 20+ percentage points behind the leader.

**Mechanic**:
- One player from the losing tribe is chosen (lowest boldness — they're the one who needs redemption)
- The dare is from the HARDEST category for that player (their weakest stat)
- **Pass** = tribe gets 3 completions added (can overturn the result)
- **Fail** = no change, extra shame camp event

**Only one clutch per game** — only the worst-performing tribe gets offered.

## Scoring

```
tribeScore = completions / totalMembers (percentage)
```

- **Best %** = wins immunity (safe)
- **Worst %** = goes to tribal
- **Middle tribes** (3+ tribes) = safe
- **Tie**: tribe with more total completions wins. Still tied = random.

Results feed into the existing `ep.winner` / `ep.loser` system so normal tribal flow works.

## Campfire Confession Scene

Fires as a pre-camp event at the START of the episode (after cold open).

Each player gets a `phobiaConfession` camp event:
- Text: "{Player} stares into the fire. 'I'm afraid of {fear}.' The tribe goes quiet."
- Archetype-flavored reactions (villain tries to hide it, hero admits it openly, etc.)
- Players who share the same fear: bond boost (+0.2) + shared moment text

The confessions are the setup — the challenge is the payoff.

## Reactions

### Conquered
- `"{name} closes {pronoun} eyes. Heart pounding. But {pronoun} does it. The fear doesn't own {pronoun} anymore."`
- `"{name} is shaking the whole time. But {pronoun} lasted. And that's enough."`
- Archetype: hero = stoic, villain = smirk, chaos agent = enjoyed it

### Failed
- `"{name} freezes. Can't move. Can't breathe. The fear wins this one."`
- `"{name} tries to step forward. Every muscle says no. {Pronoun} backs away."`
- `"{name} starts — then stops. 'I can't. I'm sorry.' The tribe watches {pronoun} sit down."`

### Clutch Pass
- `"Triple points on the line. The whole tribe is watching. {name} stares at {fear}. And does it."`

### Clutch Fail
- `"{name} can't. Not with everyone watching. Not with this. The tribe's hope dies right there."`

### Shared Fear
- `"{player1} and {player2} face {fear} together. Side by side. One conquers it. The other doesn't. That'll be a conversation later."`

## VP Presentation

### Screen 1: Campfire Confessions
Sequential click-to-reveal. Each player's portrait + their fear confession. Shared fears highlighted with a link indicator. Sets the mood before the challenge.

### Screen 2: Phobia Factor Announcement
Chris reveals the challenge. "We watched the tapes." All players shown with their assigned fears. Rules: conquer your fear, tribe with best % wins.

### Screen 3: The Challenge
Tribe-by-tribe results. Click to reveal each player's attempt:
- Player portrait + fear title + description
- Pass (CONQUERED badge, green) or Fail (COULDN'T DO IT badge, red)
- Reaction text
- Running tribe score updating after each reveal
- Shared fears shown side by side

### Screen 4: Triple Points (if triggered)
Dramatic clutch dare reveal. One player, one chance, triple stakes. Pass/fail with reaction.

### Screen 5: Results
Winning tribe celebration. Losing tribe to tribal. Tribe scores displayed.

## Episode History Fields

```javascript
ep.phobiaFactor = {
  fears: { playerName: { category: 'fear', title: 'Snakes', desc: 'Pick up a live snake. Hold it.' } },
  sharedFears: [{ players: ['DJ', 'Lindsay'], fear: 'Snakes' }],
  results: { playerName: 'pass' | 'fail' },
  tribeScores: { tribeName: { completions: 3, total: 5, percentage: 0.60 } },
  clutch: { player: 'Courtney', fear: { category, title, desc }, result: 'fail', tribe: 'Killer Bass' } | null,
  winningTribe: 'Screaming Gophers',
  losingTribe: 'Killer Bass',
  confessions: [{ player: 'DJ', fear: 'Snakes', reaction: '...' }],
};
```

## Camp Events

| Event Type | Badge | Bond | When |
|---|---|---|---|
| `phobiaConfession` | CONFESSION | +0.2 shared fears | Campfire scene |
| `phobiaConquered` | CONQUERED | +respect | Player passed |
| `phobiaFailed` | COULDN'T DO IT | weak link | Player failed |
| `phobiaClutchPass` | CLUTCH | +huge respect | Triple points passed |
| `phobiaClutchFail` | CHOKED | -respect, shame | Triple points failed |
| `phobiaSharedFear` | SHARED FEAR | +0.2 bond | Two players same fear |

## Text Backlog

`_textPhobiaFactor(ep, ln, sec)` — outputs confessions, per-player results by tribe, clutch dare, final scores.

## Integration Points

- **Twist catalog**: `TWIST_CATALOG` entry, `category: 'immunity'`, `phase: 'pre-merge'`
- **Episode flow**: `ep.isPhobiaFactor = true`. Replaces `simulateTribeChallenge`. Sets `ep.winner`, `ep.loser`, `ep.challengeType = 'tribe'` so normal tribal flow works.
- **Guard**: pre-merge only, not episode 1 (`epNum >= 2`), 2+ tribes
- **Merge episode**: same guard as Say Uncle — check `_suMerging` pattern for merge-episode compatibility
- **patchEpisodeHistory**: include `phobiaFactor` field
- **VP registration**: replace normal challenge screen when active
- **Aftermath**: confessions + clutch moments as unseen footage / truth or anvil sources

## Scope Boundaries

- **NOT implementing**: personalized/archetype-based fear assignment (purely random)
- **Dare pool is separate** from Say Uncle and TDD
- **No persistent effects** — fears don't carry between episodes
- **Pre-merge only** — post-merge has Say Uncle and Triple Dog Dare
