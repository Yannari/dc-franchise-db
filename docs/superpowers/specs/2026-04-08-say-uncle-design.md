# Say Uncle (No Pain No Game) — Design Spec

## Overview

Post-merge schedulable twist inspired by Total Drama Island's "No Pain, No Game" / "Say Uncle" challenge. **Replaces the immunity challenge** for that episode. Players endure tortures — survive 10 seconds or you're out. Dominant performances unlock the power to pick a victim and choose their dare category (with backfire risk). Last player standing wins immunity. Normal tribal council follows.

- **Twist ID**: `say-uncle`
- **Category**: `immunity` (replaces challenge, NOT elimination)
- **Phase**: Post-merge only
- **Schedulable**: Yes, via twist schedule
- **Produces**: Immunity winner + challenge placements. Normal tribal follows (vote, alliances, idols all apply).

## Challenge Flow

### Each Round

1. **Player selected** — randomly from remaining players (unless previous round had a dominator pick)
2. **Wheel spins** — random dare category assigned (unless dominator chose the category)
3. **Random dare** drawn from that category's pool
4. **Player attempts it** — stat roll determines outcome:
   - **Fail** (roll < passThreshold) → player is OUT ("said uncle"). Next player chosen **randomly**.
   - **Pass** (roll >= passThreshold but < dominantThreshold) → player survives, moves on. Next player chosen **randomly**.
   - **Dominant pass** (roll >= dominantThreshold) → player dominates. They **pick the next victim AND choose the dare category**. If victim passes, **picker is eliminated instead** (backfire).

### Dominator Pick Round

When a player dominates:
1. Dominator picks a victim (targeting logic: bond + heat + weak stats + challenge history)
2. Dominator picks a dare **category** (strategic — pick the victim's weakest stat category)
3. Random dare drawn from that category
4. Victim attempts it:
   - **Victim passes** → **BACKFIRE**: picker is OUT. Victim now has pick power (they earned it).
   - **Victim fails** → victim is OUT. Next player chosen **randomly** (picker does NOT get to pick again).

### Final Two

One of the two remaining players gets a dare. Pass = they win immunity. Fail = the other player wins.

### Special: Victim Passes Dominantly on Backfire

If the backfire victim not only passes but gets a **dominant pass**, they earn the pick power themselves — they can now pick the next victim and category. Double humiliation for the original picker.

## Dare Categories & Survival Roll

### Formula

```
survivalScore = primaryStat * 0.07 + secondaryStat * 0.04 - fatigue + (Math.random() * 0.15)
passThreshold = 0.35
dominantThreshold = 0.50
```

| Category | Primary Stat | Secondary Stat | What it tests |
|---|---|---|---|
| **Pain** | Endurance | Physical | Can your body take it? |
| **Fear** | Boldness | Endurance | Can you hold still while terrified? |
| **Gross** | Boldness | Physical | Can you stomach it for 10 seconds? |
| **Humiliation** | Boldness | `(10 - social)` | Can you endure the shame? |

### Fatigue

Same curve as Triple Dog Dare:
```
fatigue = Math.pow(roundNum, 1.5) * 0.006
```
- Round 1-3: negligible
- Round 5-7: noticeable
- Round 10+: heavy
- Round 15+: brutal

## Dare Pool (Separate from TDD)

Say Uncle dares are about **surviving something done TO you** for 10 seconds, not about willingness to do something gross. Different energy from TDD.

### Pain (20 dares)
Endurance/physical tests — can your body take it?

| Title | Description |
|---|---|
| Turtle Puck Shots | Stand in a hockey net while Chef fires angry snapping turtles at you. |
| Electric Shock Chair | Sit in the chair. Mild shocks every 2 seconds. Don't stand up. |
| Ant Hill Sit | Sit on an active anthill for 10 seconds. No brushing them off. |
| Wooden Shorts | Wear wooden shorts while a woodpecker goes to town. |
| Spike Bed | Lay down on a bed of blunt spikes. Stay flat. 10 seconds. |
| Hot Coal Walk | Walk barefoot across hot coals. One direction. No stopping. |
| Ice Bucket Burial | Get buried under 50 pounds of ice. Stay still. |
| Water Balloon Headshots | Stand still while Chef launches water balloons at your face. |
| Yellow Jacket | Have your front covered in bees. Don't swat. |
| Grizzly Bear Log Roll | Survive 10 seconds of log rolling against a grizzly bear. |
| Cactus Shirt | Wear a shirt lined with cactus needles. Hug yourself. |
| Fire Ant Gloves | Wear gloves full of fire ants. Keep them on. |
| Rubber Band Barrage | Stand still while the tribe snaps rubber bands at you. 10 seconds. |
| Cattle Prod Poke | One poke every 3 seconds. Four total. Don't move. |
| Frozen Hands | Grip two blocks of ice. Hold on for 10 seconds. |
| Wrecking Ball Dodge | Stand in a circle while a wrecking ball swings. Don't leave the circle. |
| Tar and Feather | Get tarred and feathered. Stand there and take it. |
| Pepper Spray Breeze | Stand downwind of a pepper spray fan. Eyes open. |
| Nail Bed Press | Lay face-down on a bed of nails. Weight placed on your back. |
| Thunder Clap Drums | Sit between two massive drums being hammered. Don't cover your ears. |

### Fear (20 dares)
Survive 10 seconds with something terrifying.

| Title | Description |
|---|---|
| Snake Box | Step into a box full of snakes. Stay inside. 10 seconds. |
| Sasquatchanakwa Crate | Get inside a wooden crate with Sasquatchanakwa. Survive. |
| Jellyfish Pool | Jump into a pool of jellyfish. Stay submerged. |
| Tarantula Face Walk | Let a tarantula walk across your face. Mouth closed. Eyes open. |
| Scorpion Pit | Stand in a pit of scorpions. Don't move. |
| Bat Cave Sit | Sit in a dark cave full of bats. Don't run. |
| Wolf Staredown | Make eye contact with a wolf for 10 seconds. Don't look away. |
| Shark Cage Dunk | Get lowered into shark-infested water in a rusty cage. |
| Cliff Edge Blindfold | Stand blindfolded on the edge of a cliff. Don't step back. |
| Coffin Close | Lay in a coffin. Lid closes. 10 seconds in the dark. |
| Croc Teeth Cleaning | Put your hand in a crocodile's mouth. Clean a tooth. |
| Dark Room | Sit alone in a pitch-black room. Sounds play. Don't scream. |
| Rat Swarm | Stand still while rats climb over you. |
| Piranha Pedicure | Dip your feet in piranha water. They nibble. Don't pull out. |
| Wasp Nest Poke | Poke a wasp nest with a short stick. Stand your ground. |
| Skunk Jump | Jump over a line of skunks between rocks. Don't get sprayed. |
| Bull Pen | Stand in a bull pen. Don't run. Don't wave anything red. |
| Haunted Maze Sprint | Sprint through a haunted maze. Finish in 10 seconds. |
| Bear Cave Nap | Lay down at the entrance of a bear cave. Close your eyes. |
| Quicksand Stand | Stand in quicksand up to your waist. Don't panic. Don't struggle. |

### Gross (20 dares)
Endure something disgusting on or in your body for 10 seconds.

| Title | Description |
|---|---|
| Lake Leeches Barrel | Sit in a barrel full of water and lake leeches. |
| Poison Ivy Spa | Have your face wrapped in poison ivy. Don't scratch. |
| Nose Hair Pull | Have all your nose hairs pulled at once. Don't flinch. |
| Manure Face Mask | Get a face mask made of actual manure. Sit with it. |
| Got Milk? | Attempt to milk an angry goat. Whatever happens, happens. |
| Goo Shoes | Wear shoes filled with mystery goo. Walk 20 steps. |
| Worm Bath Soak | Lay in a bathtub full of worms. Submerge. |
| Dumpster Dive Sit | Sit inside a dumpster. Lid closes. Breathe through your mouth. |
| Maggot Massage | Lay still while maggots are spread across your back. |
| Fish Scale Facial | Get a facial made of fish scales and fish oil. |
| Sewage Snorkel | Snorkel in murky swamp water. Face down. 10 seconds. |
| Slug Trail Necklace | Wear a necklace of live slugs. They leave trails. |
| Mystery Goo Helmet | Wear a helmet filled with unknown slime. It drips down your face. |
| Swamp Mud Burial | Get buried in swamp mud up to your neck. Don't gag. |
| Bird Dropping Shower | Stand under a birdcage. Look up. 10 seconds. |
| Catfish Kiss | Kiss a live catfish. On the mouth. Hold it. |
| Rotten Egg Sauna | Sit in a sauna filled with rotten egg smell. Breathe normally. |
| Cockroach Crown | Wear a crown of live cockroaches on your head. |
| Blister Beetle Bracelet | Wear a bracelet of blister beetles. They secrete. Don't remove it. |
| Roadkill Pillow | Lay your head on a roadkill pillow. Close your eyes. 10 seconds. |

### Humiliation (20 dares)
Endure social pain — tests ego, pride, dignity.

| Title | Description |
|---|---|
| Cow Costume Parade | Wear a cow costume. Parade around camp. Moo on command. |
| Wawanakwa Hair Salon | Get a haircut from Chef. With a chainsaw. |
| Baby Diaper Dance | Wear a diaper. Do a baby dance. In front of everyone. |
| Tickle Onslaught | Endure one minute of constant tickling from two people. |
| Voice to Self | Listen to a recording of your own voice on repeat. Don't cringe. |
| Marshmallow Waxing | Get your face waxed using melted marshmallows. |
| Wedgie Marathon | Give yourself a wedgie. Walk the length of camp. Waving. |
| Clown Makeover | Full clown makeup. Nose. Wig. Do a routine. |
| Public Love Letter | Read a love letter you wrote (to no one) aloud to the tribe. |
| Stand-Up About Yourself | Do 60 seconds of stand-up comedy roasting yourself. |
| Dunce Cap Walk | Wear a dunce cap. Sit in the corner. Everyone watches. |
| Sing Your Worst Moment | Sing a song about your most embarrassing game moment. |
| Kiss the Fish | Kiss a dead fish on camera. Maintain eye contact with the tribe. |
| Belly Flop Contest | Do a belly flop off the dock. Maximum splash. Maximum pain. |
| Dance Battle Solo | Dance battle against nobody. No music. Full commitment. |
| Serenade Your Enemy | Serenade the person you like least. Be romantic. |
| Wear Rival's Clothes | Wear your rival's clothes for the rest of the day. Their style. |
| Human Piñata | Get hung up like a piñata. Tribe throws soft balls at you. |
| Truth Serum | Answer any question the tribe asks. Honestly. For 60 seconds. |
| Walk of Shame Lap | Walk a lap around camp while everyone slow-claps. |

## Victim Targeting (Dominator Pick)

When a player dominates and picks their victim:

```
targetWeight = (-bond * 0.3) + (heat * 0.2) 
             + ((10 - target.physical) * 0.1) 
             + ((10 - target.endurance) * 0.1) 
             + ((10 - target.boldness) * 0.1) 
             + challengeWeakness * 0.2
             + allianceOutsider * 0.3
```

- Pick enemies / outsiders (bond + heat)
- Pick weak players (low stats = more likely to fail = safe pick)
- Avoid picking challenge beasts (high stats = backfire risk)
- Alliance members avoid picking each other

### Category Selection (Dominator Chooses)

The dominator picks the category strategically — targeting the victim's weakest stat:
- Victim has low endurance → pick **Pain**
- Victim has low boldness → pick **Fear**
- Victim has low physical → pick **Gross**
- Victim has high social (image-conscious) → pick **Humiliation**

Formula: pick the category where the victim's survival score would be lowest.

## Backfire Rule

### Victim Fails
- Victim is OUT of the challenge
- Next player chosen **randomly** (picker does NOT pick again)
- Bond: `-0.2` victim → picker (resentment)
- Camp event: CALLED IT badge for picker

### Victim Passes (Normal)
- **Picker is OUT** (backfire)
- Victim picks the next target (earned the power)
- Bond: `-0.3` picker → victim (embarrassment), `+0.3` victim → picker (respect)
- Camp event: BACKFIRE badge

### Victim Passes Dominantly
- Picker is OUT (backfire)
- Victim earns full dominator power (pick victim + category)
- Extra bond swing: `-0.5` picker, `+0.5` victim
- Camp event: BACKFIRE + DIDN'T FLINCH badges

## Challenge Standings

Elimination order from the challenge = placement (reversed):
- **Last standing** = 1st place, immunity winner, challenge standout
- **Runner-up** = 2nd place, strong showing
- **First few out** = bottom, weak link
- **Backfire victims** = extra shame (bad read on opponent)

These feed into the existing podium / standout / weak-link system for tribal targeting.

## Reactions

### Surviving a dare
- Normal pass: `"Teeth clenched. Eyes shut. Ten seconds never felt so long. But {name} made it."`
- Dominant pass: `"{name} didn't flinch. Didn't blink. Looked at the host and said 'next.'"`
- Archetype variants: heroes grit through, villains smirk, chaos agents enjoy it

### Failing a dare
- `"{name} tapped out at 8 seconds."` / `"Said uncle before the timer hit 5."` / `"The body quit before the brain did."`

### Picking a victim
- Confident pick (weak target): `"{name} points at {target}. 'Your turn.' No hesitation."`
- Risky pick (strong target): `"{name} picks {target}. Bold move. Could backfire."`
- Personal pick (enemy): `"{name} locks eyes with {target}. This one's personal."`

### Backfire moment
- `"The look on {picker}'s face when {victim} doesn't flinch. That backfire is going to sting longer than the dare."`
- `"{victim} walks out untouched. {picker} walks to the stocks. The tribe saw everything."`

### Category pick reasoning
- `"{picker} knows {victim}'s weakness. {category}. Calculated."`

## VP Presentation

### Screen 1: Say Uncle Announcement
- Title: "SAY UNCLE" with Wheel of Misfortune visual
- Rules explanation: survive 10 seconds or you're out, dominate to pick, backfire rule
- All player portraits

### Screen 2: The Rounds — Sequential click-to-reveal
Same system as TDD (NEXT button + REVEAL ALL):
- Who's up (random selection or "PICKED BY [dominator]")
- Dare reveal (category color + title + description)
- Attempt result (survived / dominated / failed) with reaction text
- Backfire moment (dramatic when it happens)
- "The Stocks" bar at top showing eliminated players accumulating (grayed out)
- Remaining player count updating

### Screen 3: Immunity Winner
- Winner portrait + "LAST ONE STANDING"
- Full placement order (last out to first out)
- Backfire log (who picked whom and what happened)

## Episode History Fields

```javascript
ep.sayUncle = {
  rounds: [{
    roundNum: 1,
    player: 'Leshawna',
    pickedBy: null,               // null = random, playerName = dominator pick
    pickerCategory: null,         // null = wheel spin, categoryName = dominator chose
    dareCategory: 'pain',
    dareTitle: 'Turtle Puck Shots',
    dareText: 'Stand in a hockey net while Chef fires angry snapping turtles at you.',
    result: 'pass',               // 'pass' | 'dominant' | 'fail'
    reaction: '...',
    backfire: null,               // null or { picker, eliminated: true }
  }],
  placements: ['Leshawna', 'Eva', ...],  // winner first, first-out last
  eliminated: ['Harold', 'DJ', ...],      // in elimination order
  backfires: [{ picker: 'Bridgette', victim: 'Eva', round: 5 }],
  immunityWinner: 'Leshawna',
  playerCount: 10,
};
```

## Camp Events

| Event Type | Badge | Bond Effect | When |
|---|---|---|---|
| `sayUncleEndured` | ENDURED | +0.2 respect | Normal pass |
| `sayUncleDominated` | DIDN'T FLINCH | +0.3 intimidation | Dominant pass |
| `sayUncleBackfire` | BACKFIRE | -0.3 picker, +0.3 victim | Picker's victim passes |
| `sayUncleCalledIt` | CALLED IT | -0.2 victim→picker | Picker's victim fails |
| `sayUncleFailed` | SAID UNCLE | weak link perception | Failed a dare |
| `sayUncleWinner` | LAST ONE STANDING | +popularity | Won immunity |

## Text Backlog

`_textSayUncle(ep, ln, sec)` — outputs all rounds, picks, backfires, placements.

## Integration Points

- **Twist catalog**: `TWIST_CATALOG` entry with `category: 'immunity'`, `phase: 'post-merge'`
- **Episode flow**: Sets `ep.isSayUncle = true`. Replaces the immunity challenge block. Normal tribal still fires after.
- **`simulateEpisode`**: After say uncle runs, set `ep.immunityWinner`, then continue to normal tribal flow.
- **Challenge placements**: `ep.chalPlacements` populated from say uncle results so the existing challenge standings/podium system works.
- **Advantages**: Idols and advantages ARE playable at tribal (say uncle replaces challenge, not tribal).
- **patchEpisodeHistory**: Must include `sayUncle` field.

## Scope Boundaries

- **NOT implementing**: Phobia Factor (pre-merge, separate twist, designed later)
- **NOT implementing**: Triple Dog Dare modifications (already done)
- **Dare pool is separate** from TDD — different dares, same 4 categories
- **No persistent effects** — challenge results feed into tribal but don't carry between episodes
