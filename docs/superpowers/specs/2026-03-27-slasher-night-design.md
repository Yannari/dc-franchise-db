# Slasher Night — Design Spec

**Date:** 2026-03-27
**Status:** Approved
**Replaces:** Current slasher-night twist (random slasher + victim, no challenge)

---

## Overview

A horror-themed survival challenge inspired by Total Drama's "Hook, Line, and Screamer" and classic slasher films (Scream, Friday the 13th, Halloween, Texas Chainsaw Massacre). Replaces both the immunity challenge AND tribal council for the episode. Players are hunted round by round. The lowest scorer is auto-eliminated (no vote). The last one standing wins immunity.

## Episode Flow

1. Normal pre-challenge camp events fire
2. Slasher Night **replaces** challenge + tribal — no separate immunity, no separate vote
3. Round-by-round survival with point scoring
4. Final showdown between last 2 players
5. Immunity Card → Elimination Card → WHY THEY DIDN'T SURVIVE → Aftermath

## Challenge Structure

### Rounds
- Number of rounds: `Math.ceil(activePlayers.length / 2)`
- 8 players = 4 rounds, 12 players = 6 rounds
- Each round: every surviving player gets 1-2 events
- 1-2 players caught per round (weighted random)
- Final round: last 2 players → Final Showdown (see below)

### Pairing Up (start of challenge)
Players naturally group based on bonds:
- **Bond >= 3:** Actively seek each other. Start together.
- **Bond 1-3:** Pair if nearby, won't go looking.
- **Bond <= 0:** Avoid each other.
- **Showmance pairs:** Always together (buddy system + "making out in the woods" danger).

### Group Size Effects
- **Solo:** +2 catch weight (very vulnerable), eligible for "go off alone" penalty
- **Pair:** Normal catch weight. Can warn/protect each other.
- **Group of 3+:** -1 catch weight (safety in numbers). But without a social 7+ leader, the group argues (-1 for everyone).

## Scoring System

### Base
- **+2 per round survived** (automatic for everyone still in)

### Positive Events

| Event | Points | Trigger | Bond consequence |
|-------|--------|---------|-----------------|
| Stand & Fight | +4 | physical 7+ / boldness 7+ | +0.3 with witnesses |
| Set a Trap | +3 | strategic 6+ / mental 7+ | — |
| Find a Hiding Spot | +2 | intuition 6+ | Lower catch chance this round |
| Warn an Ally | +2 | loyalty 6+ / bond >= 2 | +1.0 with warned player |
| Protect Someone | +3 | loyalty 7+ / ally nearby | +1.5 with protected player |
| Stay Calm | +1 | temperament 7+ | — |
| Rally the Group | +2 | social 7+ | +1 bonus for everyone nearby |
| Barricade | +2 | physical 6+ / mental 5+ | — |
| Distraction | +3 | strategic 7+ / boldness 5+ | — |
| Weapon Grab | +2 | physical 6+ / boldness 6+ | — |
| Rooftop Escape | +2 | physical 7+ / endurance 6+ | — |
| Read the Pattern | +3 | intuition 7+ / strategic 6+ | — |
| Accidental Hero | +4 | physical <= 5 + random (~10%) | Trips into slasher, saves everyone by accident. +0.5 bond with witnesses |
| Comfort Offering | +2 (both) | comforter: social 6+ / bond >= 2 / victim: temperament <= 4 | Calms a panicking ally. +1.0 bond. Prevents victim's panic event |
| The Decoy | +5 | strategic 7+ / loyalty 6+ / alliance nearby | Draws slasher away from group. +1.5 bond with saved. +3 catch weight next round |
| The Fake-Out | +3 | strategic 7+ / boldness 6+ | Plays dead, slasher walks past. Immune from catch this round. Witnesses may panic (-2) |
| Confession Under Pressure | +1 (both) | bond >= 3 + survived 2+ rounds together | Fear makes someone say something real. +2.0 bond |
| The Snack Break | +1 | endurance >= 7 + boldness <= 4 | Accidentally hides by being in the kitchen eating. Comedy moment |

### Negative Events

| Event | Points | Trigger | Bond consequence |
|-------|--------|---------|-----------------|
| Scream / Panic | -3 | temperament <= 4 | Draws slasher attention |
| Run Blindly | -2 | boldness <= 4 / no ally | — |
| Freeze Up | -2 | boldness <= 3 | Easy target |
| Abandon Ally | -4 | loyalty <= 4 / ally in danger | -2.0 bond |
| Push Toward Slasher | -5 | schemer + desperate + bond <= 0 | -3.0 bond. They get caught instead |
| Trip & Fall | -1 | physical <= 4 | — |
| Go Off Alone | -2 | social <= 3 / lone wolf | — |
| Argue at Worst Time | -3 | temperament <= 3 + nearby ally | -1.0 bond, both exposed |
| Check the Noise | -2 | intuition <= 4 / boldness 5+ | — |
| False Sense of Safety | -3 | overconfidence (high score + boldness 6+) | — |
| Showmance Distraction | -3 | showmance pair + low strategic | — |
| Open a Door You Shouldn't | -2 | intuition <= 5 | — |
| Flashlight Dies | -1 | random | — |
| Scared by Teammate | -3 | temperament <= 5 + nearby ally | Mistakes ally for slasher. Screams, panics, blows cover. -0.5 bond (embarrassment) |
| Scare a Teammate (on purpose) | -1 (scarer) / -3 (victim) | scarer: boldness 7+ or chaos agent / victim: temperament <= 5 | Scarer thinks it's funny. Victim doesn't. Draws slasher. -1.0 bond |
| Betrayal Discovery | -2 | bond >= 2 but ally voted against them last ep | Finds proof mid-hiding. Distracted. Argument draws slasher. -1.5 bond |
| Rivalry Flares | -3 (both) | bond <= -3 + same area | Two enemies stuck together. Whispered argument escalates. +2 catch weight both |
| Someone Falls Asleep | -4 | endurance <= 4 + round 4+ | Adrenaline crash. Auto-caught if rolled. Anticlimactic exit |
| Alliance Fracture | -2 (abandoned) | ally has loyalty <= 4 + named alliance | Calls for help, ally does nothing. Alliance betrayal entry. -2.5 bond |
| Horror Movie Cliché | -2 | random | — |

### Diminishing Returns
If a player uses the same strategy (e.g. "set a trap") multiple rounds:
- Round 1: full points (+3)
- Round 2: -1 (+2)
- Round 3: -2 (+1)
- Forces variety. Well-rounded players adapt; one-trick players plateau.

### Overconfidence Penalty
If a player has the highest score in a round AND boldness >= 6: ~20% chance of an overconfidence event (-3 points). The better you're doing, the more likely you slip.

### Getting Caught
- Score freezes when caught
- Player is out of the challenge but NOT necessarily eliminated
- Catch targeting formula:
  ```
  catchWeight = max(0.1,
    (10 - boldness) * 0.3
    + (10 - intuition) * 0.2
    + (10 - physical) * 0.1
    + (isAlone ? 2 : 0)
    + (justScreamed ? 1.5 : 0)
    - (isHiding ? 3 : 0))
  ```

### When Your Partner Gets Caught
- **Loyalty 7+:** Try to save them (+3 protect, but higher catch risk next round)
- **Loyalty 4-6:** 50/50 help or run. The moment defines them.
- **Loyalty <= 3:** Run. Possible push-toward-slasher event. Score penalty + bond destruction.

### Alliance Coordination
Named alliances with 3+ members try to stick together:
- **Strategic hub:** Group hides and sets traps (+2 everyone, +3 leader)
- **Social hub:** Keeps everyone calm, prevents panic events
- **Physical hub:** Stands guard, fights off slasher

But bigger groups are LOUDER — the slasher is attracted to noise. Safer per person but more likely to be found.

## Final Showdown

Last 2 players remain. The slasher finds them both. One survives (immunity), one is caught. Determined by stat-weighted roll. How it plays out depends on both players' personalities.

### Winner Scenarios

| Method | Trigger | Description |
|--------|---------|-------------|
| Fights the slasher | physical 8+ / boldness 7+ | Overpowers them. Raw strength. +0.3 bond with tribe. |
| Outsmarts | strategic 7+ / mental 8+ | Sets a trap, lures slasher into it. Strategic respect. |
| Outlasts | endurance 8+ | Runs until the slasher gives up. Pure stamina. |
| Uses shield | schemer + low loyalty + bond <= 0 with other | Pushes the other toward slasher. Wins but -3.0 bond, tribe saw it. |
| Terror escape | low stats, high randomness | Just runs screaming and gets lucky. Comedy moment. |
| Talks down | social 8+ | Somehow confuses or disarms the slasher. Tribe is stunned. |

### Loser Scenarios (how the other gets caught)

| Method | Trigger | Description |
|--------|---------|-------------|
| Pushed as shield | winner is schemer | Used as bait. -3.0 bond with winner. Tribe remembers. |
| Freezes | boldness <= 4 | Can't move while winner escapes. |
| Trips | physical <= 4 | Classic horror fall. |
| Wrong direction | intuition <= 4 | Runs the wrong way. |
| Heroic sacrifice | loyalty 8+ / bond >= 4 with winner | CHOOSES to go down so winner survives. +3.0 bond, legendary exit. |
| Outsmarted by slasher | mental <= 4 | Focused on wrong thing. |

## Elimination & Immunity

- **Last one standing = automatic immunity winner** (regardless of score)
- **Lowest total score = auto-eliminated** (no vote, no tribal council)
- Everyone in between is safe — their scores, actions, and bond changes carry forward

### WHY THEY DIDN'T SURVIVE (replaces WHY THIS VOTE HAPPENED)
Bullet points:
- Key negative events that tanked their score
- Who they were (or weren't) with
- The moment it went wrong
- Their final score vs the next-lowest
- Not a vote explanation — a survival failure explanation

## Social Consequences (persist after challenge)

| Action | Bond change |
|--------|------------|
| Protecting someone | +1.5 |
| Warning someone | +1.0 |
| Surviving together to the end | +0.5 with everyone still standing |
| Abandoning someone | -2.0 |
| Using as shield | -3.0 |
| Arguing during crisis | -1.0 |
| Heroic sacrifice (final showdown) | +3.0 with winner, +0.5 with tribe |

These feed directly into next episode's alliance formation, vote targeting, and camp dynamics.

## Event Pool — Scene Examples

### Positive Events (3+ variants each for replayability)

**Stand & Fight:**
- "{name} grabs a canoe paddle and swings at the slasher. Direct hit. The slasher staggers."
- "{name} picks up a rock the size of {pr.pos} head. The slasher reconsiders."
- "{name} squares up. No weapon, just fists. The slasher takes a step back."
- "{name} rips a branch off a tree and holds it like a bat. 'Come on then.'"

**Set a Trap:**
- "{name} rigs a tripwire using fishing line across the path. The slasher goes down hard."
- "{name} leaves a trail leading to a pit. It works."
- "{name} sets up chairs in a maze pattern near the shelter. The slasher gets tangled."
- "{name} pours cooking oil across the mess hall floor. The slasher slides into the wall."

**Find a Hiding Spot:**
- "{name} slides under the cabin and doesn't breathe for two minutes."
- "{name} finds a hollow tree trunk. The slasher walks right past."
- "{name} slips behind the waterfall. Invisible."
- "{name} climbs inside the supply crate. Darkness. Silence. Safety."

**Warn an Ally:**
- "{name} spots the slasher heading toward {ally}. One whistle — their signal. {ally} vanishes."
- "{name} grabs {ally}'s arm and pulls {pr.obj} into the bush. Just in time."
- "{name} throws a pebble at {ally}'s foot. {ally} looks up, sees the shadow, and moves."

**Protect Someone:**
- "{name} stands between {ally} and the slasher. {pr.Sub} {pr.sub==='they'?'are':'is'} not moving."
- "{name} shoves {ally} behind {pr.obj}. 'Run. I got this.'"
- "{name} throws {pr.ref} in the slasher's path so {ally} can escape."

### Negative Events (3+ variants each)

**Scream:**
- "{name} sees a shadow and screams. The entire camp knows where {pr.sub} {pr.sub==='they'?'are':'is'} now."
- "{name} hears a branch snap and lets out a sound that echoes off the mountains."
- "{name} tries to hold it in. {pr.Sub} can't. The scream comes out strangled and worse."

**Abandon Ally:**
- "{name} hears {ally} yell for help. {pr.Sub} calculates the odds and keeps running."
- "{name} sees {ally} cornered and decides that's not {pr.pos} problem."
- "{name} whispers 'sorry' and disappears into the dark. {ally} heard it."

**Push Toward Slasher:**
- "{name} shoves {victim} into the slasher's path and disappears."
- "{name} redirects the slasher by pointing at {victim}'s hiding spot."
- "{name} trips {victim} and uses the head start to escape."

**Scared by Teammate:**
- "{name} rounds a corner and sees {ally} in the dark. {pr.Sub} scream{pr.sub==='they'?'':'s'} before {pr.sub} even realize{pr.sub==='they'?'':'s'} who it is. Half the camp heard that."
- "{ally} steps out of a cabin doorway. {name} swings at {pr.obj} before recognizing the face. Both of them are shaking."
- "{ally} is wearing a towel over {pr.pos} head. {name} sees the silhouette and bolts. By the time {name} stops running, {pr.sub} {pr.sub==='they'?'are':'is'} three hundred feet from camp."
- "{name} walks into the bathroom and sees {ally}'s shadow in the mirror. The scream is loud enough to echo. {ally} just stands there, confused."
- "{name} and {ally} walk toward each other in the dark. Neither sees the other. They collide. Both scream. The slasher now knows exactly where they are."

**Scare a Teammate (on purpose):**
- "{scarer} hides behind a tree and jumps out at {victim}. {victim} screams so loud the birds take off. {scarer} is doubled over laughing. The slasher is now heading their way."
- "{scarer} sneaks up behind {victim} and grabs {pr.pos} shoulders. {victim} nearly passes out. {scarer} thinks it's the funniest thing that's happened all night."
- "{scarer} puts on a mask they found in the supply shed and walks toward {victim}. {victim} doesn't recognize {scarer} for a full five seconds. Those five seconds cost both of them."
- "{scarer} whispers {victim}'s name from behind a bush in a low voice. {victim} freezes, then runs. {scarer} can't stop laughing. The slasher can't stop listening."

**Accidental Hero:**
- "{name} trips and falls into the slasher, knocking them both down. Everyone escapes. {name} has no idea what just happened."
- "{name} stumbles backward into a shelf. The shelf falls on the slasher. Pure accident. {name} is a hero and has no idea why."
- "{name} throws a coconut in panic. It hits the slasher square in the mask. The slasher drops. Nobody is more surprised than {name}."

**Comfort Offering:**
- "{ally} finds {name} curled up behind the cabin, shaking. {ally} sits next to {pr.obj}. 'Hey. We're getting out of this.' {name} nods. They move together."
- "{ally} puts a hand on {name}'s shoulder. 'Breathe. I'm right here.' {name} stops shaking. They both make it through this round."
- "{name} is hyperventilating behind the mess hall. {ally} crouches down. Doesn't say anything. Just stays. That's enough."

**The Decoy:**
- "{name} runs out into the open, waving and yelling. The slasher turns. The group behind the cabin escapes. {name} barely makes it back."
- "{name} throws a lit torch down the trail and sprints the other way. The slasher follows the light. The alliance owes {name} their game tonight."
- "{name} starts banging pots together near the kitchen. Every head turns — including the slasher's. The group behind {name} disappears into the dark."

**The Fake-Out:**
- "{name} plays dead. Face down in the dirt. The slasher walks past. When the footsteps fade, {name} gets up and runs."
- "{name} goes completely limp behind a bush. The slasher looks right at {pr.obj}. Keeps walking. {name} doesn't exhale for another thirty seconds."
- "{name} collapses dramatically in the open. The slasher prods {pr.obj} with a boot. {name} doesn't flinch. The slasher moves on. Performance of a lifetime."

**Confession Under Pressure:**
- "Hiding in the dark, {name} tells {ally} something real. Not strategy — something personal. The kind of thing you only say when you think you might not make it."
- "{name} and {ally} are pressed against the same wall, breathing hard. {name} says 'If we don't make it — I want you to know I had your back the whole time.' The silence after is different."
- "The fear strips everything else away. {name} tells {ally} the truth about how {pr.sub} feel{pr.sub==='they'?'':'s'} about this game, about the alliances, about what matters. {ally} listens."

**The Snack Break:**
- "{name} is in the kitchen making a sandwich. The slasher walks past the window. {name} doesn't notice. Somehow this works."
- "While everyone else is running for their lives, {name} finds leftover rice in the pot and eats it. Standing in the kitchen. In the dark. Completely fine."
- "{name} opens the fridge. The light illuminates the whole kitchen. The slasher is outside. {name} grabs a mango and closes it. Oblivious and alive."

**Betrayal Discovery:**
- "While hiding in the supply shed, {name} finds a note {ally} wrote. It has {name}'s name on it. The trust dies right there in the dark."
- "{name} overhears {ally} whispering to someone else: 'We get rid of {name} next.' Hiding two feet away. Hearing every word."
- "In the panic, {ally}'s bag spills open. {name} sees the vote parchment. {pr.Sub} read{pr.sub==='they'?'':'s'} {pr.pos} own name. The look {name} gives {ally} says everything."

**Rivalry Flares:**
- "{name} and {enemy} end up in the same hiding spot. Neither will leave. The whispered argument escalates. The slasher doesn't even need to look."
- "{name} sees {enemy} hiding behind the same rock. 'Are you serious.' The mutual disgust is louder than either of them intended."
- "{name} and {enemy} are forced to share a cabin. They'd rather face the slasher. Almost do."

**Someone Falls Asleep:**
- "{name} hasn't slept in two days. {pr.Sub} sit{pr.sub==='they'?'':'s'} down behind the cabin for 'just a second.' The next thing {pr.sub} know{pr.sub==='they'?'':'s'}, the slasher is standing over {pr.obj}."
- "The adrenaline crash hits {name} like a wall. Eyes close. Just for a moment. When they open, the mask is three feet away."
- "{name} leans against a tree and the exhaustion wins. {pr.Sub} wake{pr.sub==='they'?'':'s'} up to a hand on {pr.pos} shoulder. It's not a friend."

**Alliance Fracture:**
- "{name} calls out for {ally}. {ally} is right there. {ally} does nothing. The alliance dies in that silence."
- "{name} reaches for {ally}'s hand. {ally} pulls away. Turns. Runs. {name} stands there for a second too long."
- "The slasher is closing in. {name} looks at {ally} — 'Help me.' {ally} looks back. Then {ally} looks away. That's the answer."

**Horror Movie Cliché:**
- "{name} says 'I think we're safe now.' Nobody should ever say that."
- "{name} says 'I'll be right back.' {pr.Sub} won't."
- "{name} asks 'Did you hear that?' — the last useful question anyone asks tonight."
- "{name} suggests they split up. That is never the answer."
- "{name} opens the basement door. There's no reason to open the basement door."

### Caught Scenes

- **Grabbed from behind** (low intuition): "A hand on the shoulder. By the time {name} turns around, it's over."
- **Cornered** (dead end): "{name} hits a wall. The slasher blocks the only exit."
- **Outsmarted** (mental <= 5): "The slasher herded {name} exactly where it wanted."
- **Betrayed by noise** (just screamed): "{name}'s own voice gave {pr.obj} away."
- **Partner caught first**: "{name} watches {ally} go down. The hesitation costs everything."
- **Jumped from above** (random): "The slasher drops from the roof. {name} never looked up."
- **Lured by fake sound** (intuition <= 4): "A voice calls {name}'s name. It's not who {pr.sub} think{pr.sub==='they'?'':'s'}."
- **Exhaustion** (endurance <= 4, late round): "{name} can't run anymore. The slasher didn't hurry."
- **Overconfidence** (high score): "{name} thought {pr.sub} had it figured out. The slasher doesn't follow rules."
- **Found hiding**: "The slasher checks under the cabin. {name} is there. Eyes meet."
- **The slow walk** (low boldness): "The slasher doesn't even run. It walks. {name} knows and can't do anything."

### Between-Round Atmosphere

- "A scream cuts through the night. Then silence. Someone is gone."
- "The rain starts. Visibility drops to nothing."
- "The slasher's chainsaw revs in the distance. Closer than last time."
- "The camp lights flicker and die. Pure dark from here."
- "Something drags across the ground near the mess hall."
- "The remaining players can hear each other's breathing. The slasher can too."
- "A cabin door slams shut on its own."
- "The fire pit goes cold. The only light left is the moon."

## VP Visual Design

### Particle Profile
New `'slasher'` profile:
- Slow-moving dark particles (fog/mist, not embers)
- Muted grays and dark blues
- Occasional red flicker when someone gets caught

### Color Palette
- Background: `tod-deepnight` but darker — near-black with cold blue undertones
- Caught/elimination: blood red (`#da3633`)
- Warnings: sickly amber (`#d29922`)
- Survival: ghostly white
- Caught player portraits: desaturated + red-tinted border
- Slasher portrait (`slasher.png`): subtle pulsing red glow

### Per-Screen Atmosphere

| Screen | Treatment |
|--------|-----------|
| Announcement | Slow fade-in from black. Slasher portrait center with red glow pulse. Text appears line by line with delay. Fog particles. |
| Round Reveal | Each round darker (background -5% per round). Caught players' cards have red top border. Surviving portraits have faint green pulse. |
| Final Showdown | Full-screen face-off. Both portraits large. Background flickers (dying flashlight). Winner gets gold glow, loser desaturates. |
| Immunity Card | Dawn breaks. Background lightens. Warm tones. Relief. Gold immunity badge. |
| Elimination Card | Back to dark. Red-dominant. Fear-themed quote. Torch snuff flame effect. |
| Leaderboard | Dark theme. Green for positive, red for negative. Score bars animate like vote tally. |

### Reduced Motion
`prefers-reduced-motion`: fog particles disabled, fade-ins instant, portrait pulses off. Static dark theme maintained.

## Engine Integration

### State
- `ep.slasherNight = true` — flags the episode type
- `ep.slasherRounds[]` — per-round data: events, caught players, scores
- `ep.slasherScores = { [name]: number }` — running score per player
- `ep.slasherCaughtOrder = [{ name, round, score }]` — elimination order
- `ep.slasherPairings = { [name]: [allies] }` — who paired with who
- `ep.slasherFinalShowdown = { winner, loser, winMethod, loseMethod }` — final 2
- `ep.slasherEliminated` — lowest scorer (auto-eliminated)
- `ep.slasherImmunityWinner` — last one standing

### History Save
All slasher data saved to `gs.episodeHistory` entry with full round-by-round data so VP can replay.

### Existing Systems Affected
- `simulateEpisode()` — new early-return path for slasher night (like no-tribal)
- `generateCampEvents()` — runs normally before slasher night
- `updatePlayerStates()` — runs after, emotional states affected by slasher actions
- `detectBetrayals()` — skipped (no vote), but abandonment events create similar bond damage
- `rpBuildCampTribe()` — badge handling for slasher events in camp display
- Camp Overview + Aftermath flow normally after
- Episode history: `challengeType: 'slasher-night'`

## Assets
- `slasher.png` — slasher portrait/icon for VP screens (provided by user)

## Priority
HIGH — replaces a dead feature (current slasher-night is random + cosmetic) with a complete self-contained challenge system. Touches: engine (new challenge type), VP (7 new screens), camp events (bond consequences), visual (new particle profile + atmosphere).
