# Lucky Hunt — Challenge Twist Design Spec

## Overview

**Challenge name:** Lucky Hunt
**Twist ID:** `lucky-hunt`
**Phase:** Post-merge only
**Type:** Individual immunity. One player wins immunity from a treasure chest.
**Inspiration:** TDI S1E16 "Search and Do Not Destroy"

A scavenger hunt where every player draws a random clue to a random location, searches for a key, and opens a treasure chest. The hunt is a **single chronological timeline** — attempts, social events, and schemes all interleave in real time with causal dependencies. One chest contains immunity. Some keys are duds. Some chests are booby traps.

Two independent systems ship together:
1. **Lucky Hunt** — the challenge twist (scavenger hunt, keys, chests, immunity)
2. **Social Manipulation Camp Events** — standalone camp events that fire in any episode. During Lucky Hunt they fire more frequently and interleave with the hunt timeline.

---

## System 1: The Lucky Hunt Challenge

### The Timeline Algorithm

The hunt is NOT phases → it's a **single event queue** processed sequentially. Each event checks live state before firing. The algorithm:

```
1. SEED the queue:
   - For each player: add a clueDraw event (always fires first)
   - For each player: add 1-3 huntAttempt events (based on difficulty — harder = more attempts needed)
   - Scan eligible pairs/players and pre-roll hunt events (help, sabotage, steal, etc.)
   - Scan eligible schemers and pre-roll social events (forge note, lies, etc.)
   - Each event has a "timing" weight: early (0.0-0.3), mid (0.3-0.7), late (0.7-1.0)

2. SORT the queue:
   - clueDraws always go first (timing 0.0)
   - Everything else sorted by timing weight + small random jitter
   - This creates natural flow: draws → early attempts → events interleave → late attempts

3. PROCESS sequentially:
   For each event in queue:
     - CHECK preconditions against live state
     - If preconditions fail → SKIP (event becomes invalid)
     - If preconditions pass → EXECUTE, update live state, push to timeline
     - After execution: check if any REACTIVE events should trigger (panic after scary attempt, comfort after scheme, expose after scheme)

4. LAST CHANCE pass:
   - Any player who never found their key gets one final attempt (reduced chance)

5. CHEST CEREMONY:
   - Players with working keys open chests in random order
   - Immunity reveal is always last (dramatic pacing)

6. AFTERMATH:
   - Campaign rally, comfort, exposure events fire (check live state from everything above)
```

### Live State Object

The state that events check/modify during processing:

```javascript
const huntState = {
  // Per-player tracking
  players: {
    [name]: {
      difficulty: 'easy'|'medium'|'hard'|'nightmare',
      location: { id, name, tier, description },
      keyFound: false,        // true when they find their key
      keyStolen: false,       // true if someone stole their found key
      dudKey: false,          // true if their key is a dud (rolled at find time)
      frozen: false,          // true if panicked/frozen (needs help to unfreeze)
      sabotagedBy: null,      // name of saboteur (applies penalty to next attempt)
      helpedBy: null,         // name of helper (applies bonus to next attempt)
      attemptsMade: 0,        // how many attempts so far
      maxAttempts: 1-3,       // based on difficulty
      successChance: number,  // current modified success chance
      hasChest: false,        // true after chest ceremony
      chestReward: null,      // what they got
      stolenKeyFrom: null,    // if they stole, who from
      emotionalState: 'normal'|'devastated'|'furious'|'elated', // from social events
    }
  },
  // Global tracking
  keysInPlay: number,         // how many keys have been found (not stolen back)
  schemesExecuted: [],        // track what schemes fired (prevent duplicates)
  witnessedEvents: [],        // who saw what (for exposure/gossip)
};
```

### Difficulty Assignment & Location Pool

**Assignment:** Pure random from a weighted bucket. The bucket contains difficulty tokens in a ratio that produces the right distribution:

| Cast size | Easy | Medium | Hard | Nightmare |
|---|---|---|---|---|
| 8-10 | 3 | 3 | 2 | 1 |
| 11-14 | 4 | 4 | 3 | 2 |
| 15-18 | 5 | 5 | 4 | 2 |

Players draw blindly. Excess tokens are discarded. This means in a 13-player game, someone WILL draw Nightmare.

**Max attempts per difficulty:**
- Easy: 1 (you get one shot, it's easy)
- Medium: 2 (might need a second try)
- Hard: 2 (but both are harder)
- Nightmare: 3 (multiple attempts at a brutal location)

**Location pool — 30+ unique locations, each with a stat profile that determines HOW you approach it:**

#### Easy Locations (8)

| Location | Primary stat | Description | Flavor |
|---|---|---|---|
| Flaming hoop | boldness | Key hanging inside a ring of fire. Jump through. | Classic TDI spectacle. Bold players don't flinch. |
| Cabin drawer | mental | Key in an unlocked drawer... but which cabin? Which drawer? 40 drawers total. | Puzzle, not danger. Smart players check systematically. |
| Flagpole top | physical | Key clipped to the top of the flagpole. 30 feet up. | Pure climb. Strong players scramble up. |
| Hollow log | boldness | Key inside a log. Something is living in there. Probably harmless. Probably. | Reach in blind. Bold players don't hesitate. |
| Dock ladder | physical | Key dangling from the dock ladder, 2 feet above the water. Easy reach... if you don't mind getting wet. | Trivial but wet. Physical players don't care. |
| Campfire pit | endurance | Key buried under the old campfire. Dig through ash and dirt. Takes 20 minutes. | Not hard, just tedious. Endurance players keep digging. |
| Amphitheater seats | mental | Key taped under one of 200 seats. No clue which one. | Grid search. Smart players divide the rows logically. |
| Canteen shelf | social | Key on the top shelf of the canteen. Intern is guarding it. Talk your way in or sneak. | Charm or stealth. Social players sweet-talk the intern. |

#### Medium Locations (8)

| Location | Primary stat | Description | Flavor |
|---|---|---|---|
| Shark lake | boldness + physical | Key on a pole in the lake. Sharks circle it. Lure them away, then dive. | Trent's challenge. Requires courage AND speed. |
| Beehive | boldness + mental | Key wired into a beehive. Remove it without disturbing the bees. Steady hands. | Izzy's territory. Calm, precise, don't panic. |
| Crocodile bridge | boldness + physical | Key under a rickety bridge between two crocs. Reach down while they watch. | Leshawna's challenge. Nerve + reach. |
| Outhouse plumbing | endurance + mental | Key somewhere in the confessional plumbing system. Gross but not dangerous. | Endurance to keep going, mental to find the right pipe. |
| Mud pit rope | physical + endurance | Key suspended on a rope over a mud pit. Climb the rope, grab the key, don't fall. | Strength challenge. Fall = muddy restart. |
| Rapids buoy | physical + boldness | Key tied to a buoy in white water. Swim out, grab it, swim back without drowning. | Physical plus nerve. Current is strong. |
| Woodpecker tree | boldness + physical | Key in a woodpecker hole. The bird attacks anyone who reaches in. | Requires speed and tolerance for being pecked. |
| Territorial goose | boldness | A goose guards the key. THE goose. It has a reputation. | 90% boldness check. The goose is genuinely terrifying. |

#### Hard Locations (8)

| Location | Primary stat | Description | Flavor |
|---|---|---|---|
| Chef's fridge | strategic + boldness | Key inside Chef's refrigerator. Chef cleans for fingerprints daily. He has a cleaver. | Heather's challenge. Need a plan AND nerve. Stealth approach. |
| Bear den | physical + boldness | Key on a cord around a sleeping bear's neck. Remove without waking it. | Owen's challenge. Delicate for big hands. Physical to escape if it wakes. |
| Septic tank | endurance + mental | Key at the bottom of the septic tank. You're going in. | Geoff's challenge. Horrifying but survivable if you don't quit. |
| Hornets cliff | physical + boldness + endurance | Key inside a hornets' nest on a cliff ledge. Climb + extract + survive stings. | Multi-stat gauntlet. |
| Cage over lake | mental + physical | Key locked in a cage dangling over the lake. Cage is locked. Pick it or break it. | Puzzle lock + strength to not fall. |
| Shower drain | mental + endurance | Key deep in the shower drain pipe system. Crawl through pipes in the dark. | Claustrophobia test. Mental to navigate, endurance to keep going. |
| Cliff bottom | physical + endurance | Key at the base of the 1000-foot cliff. Climb down, grab it, climb back up. | Same cliff from Cliff Dive. Physical endurance marathon. |
| Raccoon nest | physical + boldness | Key in a raccoon family's nest. They fight as a unit. There are six of them. | It's a fight. The raccoons are organized. |

#### Nightmare Locations (4)

| Location | Primary stat | Description | Flavor |
|---|---|---|---|
| Snake-skunk den | boldness + endurance + mental | Key in a pit with snakes AND skunks. Get sprayed AND bitten. Extract the key from the middle. | The worst of both worlds. You WILL smell. You WILL get bitten. |
| Underwater cave | physical + endurance + mental | Key in an underwater cave. Hold breath, navigate in the dark, find it by feel. | Drowning risk. Multi-stat. The darkness is the real enemy. |
| Cliff rope | physical + boldness + endurance | Key hanging from a fraying rope on the cliff face. Climb out on the rope. It's swaying. | Heights + physical + the rope WILL fray more as you climb. |
| Electrical panel | mental + boldness | Key inside a live electrical panel. One wrong touch = shock. Need to identify the safe path. | Puzzle under threat. Smart players map the circuit. Bold players just go. |

### Success Formula (Deep)

Base success chance per attempt:

```javascript
function calcSuccessChance(player, location, huntState) {
  const s = pStats(player);
  const loc = location;
  
  // Base from difficulty tier
  const tierBase = { easy: 0.40, medium: 0.20, hard: 0.10, nightmare: 0.05 };
  let chance = tierBase[loc.tier];
  
  // Stat contributions — each location emphasizes different stats
  // loc.statWeights = { boldness: 0.05, physical: 0.03, ... }
  Object.entries(loc.statWeights).forEach(([stat, weight]) => {
    chance += s[stat] * weight;
  });
  
  // Modifiers from hunt events
  const ps = huntState.players[player];
  if (ps.helpedBy) chance += 0.15;
  if (ps.sabotagedBy) chance -= 0.15;
  if (ps.frozen) chance = 0; // can't attempt while frozen
  if (ps.attemptsMade > 0) chance += 0.05 * ps.attemptsMade; // learn from failures
  
  // Emotional state from social events
  if (ps.emotionalState === 'devastated') chance -= 0.15; // crying, can't focus
  if (ps.emotionalState === 'furious') chance += 0.05;     // anger as fuel
  if (ps.emotionalState === 'elated') chance += 0.05;      // confidence boost
  
  return Math.max(0.05, Math.min(0.95, chance));
}
```

Each location has its own `statWeights` object so the same player has different chances at different locations. A physical beast at the flagpole (physical-weighted) has a great chance. The same player at the electrical panel (mental-weighted) struggles.

**Attempt-to-attempt learning:** Each failed attempt adds +0.05 to the next try. You learn from mistakes. This means Hard locations (2 attempts) can go from ~45% → ~50%. Nightmare locations (3 attempts) can go from ~35% → ~40% → ~45%. Players don't just re-roll — they adapt.

### Per-Player Narrative Arc

Every player gets a **4-beat story** for their hunt. The text is generated from pools keyed by location + stat tier + outcome.

**Beat 1 — Clue Draw (always fires, Round 1)**
Player pulls their plank. Text describes what's on it and their reaction.
- Text is keyed by: difficulty tier + player boldness tier (brave/mid/timid)
- Brave player at Easy: confidence, swagger
- Timid player at Nightmare: dread, panic
- Brave player at Nightmare: excitement, "finally a real challenge"
- Chris commentary fires for ~40% of draws (the funny ones)

**Beat 2 — Arrive at Location (first attempt)**
Player reaches their spot. Text describes what they see.
- Text is keyed by: specific location + player boldness tier
- Each of the 28 locations has 3 arrive texts (brave/mid/timid perspective)

**Beat 3 — Attempt (per attempt, 1-3 times)**
Player tries to get the key. The approach depends on their highest stat.
- Physical-dominant player: brute force approach
- Mental-dominant: clever/puzzle approach  
- Social-dominant: talk/charm approach (works at some locations)
- Bold-dominant: reckless rush approach
- Text is keyed by: location + approach type + success/fail
- Each location has 3-4 attempt texts per approach type per outcome
- Failed attempts have consequences: injury text, humiliation, setback description

**Beat 4 — Result (after final attempt)**
The outcome: got the key, got a dud, or never found it.
- Success: celebration text, keyed by personality
- Dud: frustration text (you did the work but the key is worthless)
- Failure: shame/despair text, keyed by how badly they failed
- Chris commentary fires for dramatic results (~50% chance)

### Hunt Events (Deep Mechanics)

Events pre-roll during queue seeding. Each has a **trigger check** (can it happen?), a **timing weight** (when in the hunt), and a **precondition check** (is it still valid when it fires?).

#### Help Ally
- **Trigger:** Player A has found their key. Player B hasn't. Bond(A,B) >= 3. A's loyalty >= 5.
- **Timing:** Mid-to-late (0.4-0.7). You need to have found your own key first.
- **Precondition:** A still has key (not stolen). B still hasn't found theirs.
- **Mechanic:** A goes to B's location. A's relevant stats combine with B's for B's next attempt (+0.15 bonus). A might also provide an approach B couldn't think of (if A's mental > B's, text describes A figuring out the puzzle).
- **Text:** 4 variants per relationship tier (close allies vs. casual friends). Text describes HOW they help — physically (holding the rope), mentally (figuring out the trick), emotionally (calming a panicked player).
- **Bond:** +0.5 both directions. If B succeeds on the boosted attempt, additional +0.3.
- **Camp event:** `luckyHuntHelped` — "{A} left their own hunt to help {B}. That's not strategy. That's loyalty." Badge: HELPED (green).
- **Narrative example:** *Trent's already done. He sees Gwen at the skunk pit, covering her nose. "What if we flush them out?" He grabs a bucket. Twenty minutes later, Gwen has her key and Trent has a new skunk-related memory.*

#### Sabotage Rival
- **Trigger:** Player A has bond <= -2 with player B, OR A has strategic >= 6 and wants B gone. B hasn't found their key yet.
- **Timing:** Early-to-mid (0.2-0.5). Sabotage is most effective before the target finds their key.
- **Precondition:** B hasn't found their key yet. A hasn't been caught sabotaging already this hunt.
- **Mechanic:** A interferes with B's hunt. Methods depend on A's stats:
  - Physical >= 7: move the key, block the path, scare away B
  - Strategic >= 7: mislabel B's clue, send them to wrong location, swap signs
  - Social >= 7: distract B with conversation, waste their time
- **Success:** B's next attempt gets -0.15 penalty. If B fails and A's sabotage was the margin, B knows something's wrong.
- **Detection:** `B.intuition * 0.06 + B.mental * 0.03` vs `A.strategic * 0.05 + A.social * 0.03`. If B detects: bond -1.0, A gets `gs._luckyHuntHeat[A] = { amount: 1.5, expiresEp: currentEp + 2 }`, camp event SABOTEUR CAUGHT.
- **If undetected:** B just thinks they failed. No bond change. A smirks.
- **Text:** 4 variants per method (physical/strategic/social sabotage), 3 variants for caught vs. uncaught.
- **Camp event (if caught):** `luckyHuntSabotaged` — "{A} sabotaged {B}'s hunt. {B} found out." Badge: SABOTEUR (red).

#### Trade Intel
- **Trigger:** Two players encounter each other at nearby locations. Bond >= 0 between them.
- **Timing:** Early (0.1-0.4). Happens on the way to locations.
- **Precondition:** Neither player has been in a hostile event with the other this hunt.
- **Mechanic:** They share info about what they've seen. Both get +0.05 success boost to their next attempt. BUT if one player has strategic >= 7 AND bond < 2, they might **lie** — give bad intel that causes -0.05 penalty instead. The victim detects the lie with intuition vs. strategic check.
- **Text:** 3 variants for genuine trade, 3 for liar gets away, 2 for liar gets caught.
- **Bond:** +0.2 for genuine trade, -0.3 if lied and caught, no change if lied and uncaught.

#### Steal Key
- **Trigger:** Player A wants player B's key. A has boldness >= 7 OR (strategic >= 7 AND physical >= 5). B has ALREADY found their key.
- **Timing:** Mid-to-late (0.5-0.8). You wait until someone finds their key, then take it.
- **Precondition:** B has a found key (keyFound = true, keyStolen = false). A hasn't already stolen.
- **Mechanic:** This is the nuclear option. A takes B's key and B's chest assignment. B reverts to keyFound = false and must re-find their original key (which A left behind) or find a new one. A abandons their own location entirely.
  - Success chance: `A.physical * 0.06 + A.boldness * 0.04 + A.strategic * 0.03 - B.physical * 0.04` (you're literally taking something from someone)
  - If B is physically stronger and alert, the steal fails. A is humiliated.
- **Success consequences:**
  - A gets B's key and chest assignment (potentially the immunity chest)
  - B loses their key, is devastated/furious (emotionalState update)
  - Bond: -2.0 both directions
  - Every witness (players at nearby locations): bond with A drops -0.5
  - Heat: `gs._luckyHuntHeat[A] = { amount: 2.0, expiresEp: currentEp + 2 }`
  - Camp event: `luckyHuntStolen` — Badge: KEY STOLEN (red)
- **Failure consequences:**
  - A looks foolish. B still has their key.
  - Bond: -1.5. A gets heat: 1.0 for 2 episodes.
  - Text describes the failed grab, B's reaction.
- **Text:** 4 success variants (sneaky theft, bold grab, strategic misdirection, brute force), 3 failure variants.
- **Narrative example:** *Heather watches Duncan pocket his key. She waits until he's walking back, falls into step beside him, and bumps his shoulder. When he looks down, the key is gone. "Looking for something?" She's already walking the other way.*

#### Ambush/Scare
- **Trigger:** Player A has physical >= 7. Player B is currently at their location, mid-attempt. Bond(A,B) < 0 OR A just wants entertainment.
- **Timing:** Mid (0.3-0.6).
- **Precondition:** B is currently attempting (attemptsMade < maxAttempts, hasn't succeeded yet).
- **Mechanic:** A shows up and disrupts B's attempt. Methods:
  - Make a loud noise to scare B mid-attempt
  - Physically block B's path
  - Appear suddenly in a scary location (jump scare at the bear den)
- **Consequence:** B's current attempt gets -0.10 penalty. If B was already nervous (boldness <= 4), this can trigger a Panic/Freeze event.
- **Bond:** -0.5 from B to A. +0.2 from witnesses (entertainment value).
- **Popularity:** A +1 (villain entertainment), B -0 (victim, no blame).

#### Panic/Freeze
- **Trigger:** Player with boldness <= 3 draws a Hard or Nightmare location. OR a player gets ambushed/scared at a dangerous location.
- **Timing:** On first arrival at location, or immediately after an ambush.
- **Mechanic:** Player freezes. `frozen = true`. They CANNOT attempt until someone helps them (an ally arrives and snaps them out of it) or they self-recover.
  - Self-recovery: Each subsequent queue tick, `boldness * 0.08 + loyalty * 0.02` chance to unfreeze (team obligation helps). If still frozen by Last Chance round, auto-unfreeze with -0.10 penalty.
  - Helped recovery: If an ally with bond >= 2 has found their key, they can help. Ally's social * 0.05 + bond * 0.03 = unfreeze chance. 
- **Text:** 3 variants for the freeze (terror, paralysis, breakdown), 3 for self-recovery (deep breath, shame-motivated, anger-motivated), 3 for helped recovery.
- **personalScore:** -1.0 for freezing. +0.5 for whoever helps them recover.

#### Showoff
- **Trigger:** Player with boldness >= 8 at Easy or Medium location. ~40% chance on successful attempt.
- **Timing:** Attached to the attempt event.
- **Mechanic:** Instead of just finding the key, the player does it spectacularly. Backflip through the flaming hoop. One-handed shark dodge. Catches the key mid-fall.
- **Text:** 4 variants per location tier (easy showoff vs. medium showoff). Text emphasizes style over substance.
- **Consequences:** Popularity +2. personalScore +1.0. All players who witness: bond +0.2 (impressed) or -0.1 if they have bond <= -3 (annoyed by showboating).

#### Unlikely Teamup
- **Trigger:** Two players with bond <= -1 are assigned locations near each other. ~20% chance.
- **Timing:** Mid (0.4-0.6).
- **Precondition:** Neither has found their key yet. Neither has a hostile event with the other this hunt.
- **Mechanic:** They reluctantly cooperate. One holds the rope while the other climbs. One distracts the goose while the other grabs the key. Both get +0.05 to their next attempt.
- **Text:** 4 variants scaled by hostility level. Low hostility: grudging cooperation. High hostility: barely civil, but it works.
- **Bond:** +0.5 (grudging respect). This is one of the few ways to repair a bad bond during a challenge.

#### Discovery
- **Trigger:** Player with intuition >= 6 searching a Hard or Nightmare location. ~15% chance.
- **Timing:** During an attempt (success or fail).
- **Precondition:** Something exists to discover. Checks: does any player have a hidden advantage? Is any alliance secret? Has a scheme been planned?
- **Mechanic:** While searching the location, the player finds something extra — a note someone hid, evidence of an alliance, a clue about a hidden idol. This information enters the player's knowledge and influences their voting/targeting decisions.
- **What they can find:**
  - Another player's hidden advantage location (if idol hunt system is active)
  - Evidence of a secret alliance (letters, notes from camp)
  - A scheme in progress (they find the forged note before the victim does)
- **Text:** 3 variants per discovery type.
- **Camp event:** `luckyHuntDiscovery` — Badge: FOUND SOMETHING (blue).

### Chest Ceremony (Deep)

After all hunts and last-chance attempts, players with working keys open chests.

**Chest assignment algorithm:**
1. Count players with working keys (foundKey = true, dudKey = false, keyStolen = false)
2. Create a chest pool sized to match
3. Shuffle rewards into chests:
   - 1 Immunity (always present)
   - 1 Booby trap (always present)
   - 1 Shareable reward (always present if 4+ key-finders)
   - 0-1 Advantage (if advantage system enabled, 50% chance)
   - Fill rest with food/comfort items
4. Assign chests to players randomly (or to their stolen-chest assignment if key was stolen)
5. Reveal in order — save immunity for last (dramatic pacing)

**Reward details:**

**Immunity:** The one that matters. Invincibility at tonight's tribal. Sets `ep.immunityWinner`. If the immunity winner was also a schemer or saboteur — that's the Heather moment (you can't vote them out even though everyone wants to).

**Advantage (0-1):** If it fires, it's one of: extra vote, vote steal, or idol clue. Pushed to `gs.advantages[]`. The player who gets this has a secret they can deploy in future tribals.

**Shareable Reward:** Food basket, care package, or luxury item. The player MUST choose one other player to share with (the choice is mandatory, not optional). This is a public social declaration.
- Bond +1.0 with the chosen person
- Bond -0.3 with EVERY other player (jealousy — "why not me?")
- If survival active: both players get +8 survival food
- Camp event: `luckyHuntShared` — "{player} shared their reward with {chosen}. Everyone else noticed."
- The choice creates narrative: sharing with your ally is safe, sharing with a rival is a peace offering, sharing with your showmance is romantic, sharing with someone random is suspicious.

**Food/Comfort Items:** Named items with flavor text. Each gives:
- Popularity +1 (you have something nice)
- If survival active: +5 survival food to merge camp
- The item itself is cosmetic but memorable (Geoff's cologne, Owen's chips)

Item pool (randomly assigned):
- Chips and a candy bar
- Cologne ("Cleaver Body Spray — cuts through the stink")
- Toaster (why? nobody knows)
- Leg lamp (a prize from a strange Christmas)
- Two ships in a bottle
- Accordion (nobody asked for this)
- Body spray (industrial strength)
- Gift certificate to nowhere
- A pillow (actually the best prize on the island)
- Mystery meat jerky (Chef's recipe)

**Booby Trap:** One chest explodes on opening. Type is random:
- Paint bomb (player is covered in paint for the rest of the episode)
- Skunk spray (player smells terrible, everyone avoids them)
- Glitter cannon (player sparkles, can't be taken seriously)
- Spring-loaded boxing glove (classic)
- Smoke bomb (player can't see for a minute, stumbles around)

Consequences: Popularity -1. Humiliation text. Chris laughs. Everyone laughs. The player does not laugh.

**Dud keys:** ~15% of players who found a key discover it doesn't fit any chest. They try each chest, getting increasingly frustrated. The dud moment should have 4-5 text variants:
- Calm acceptance
- Explosive anger (low temperament)
- Quiet devastation
- Blaming Chris
- Trying to force the lock

**No key found:** Players who never completed the hunt watch the ceremony from the sidelines. 3-4 text variants:
- Bitter watching
- Relieved (they didn't want the chest anyway — coping)
- Plotting revenge against whoever sabotaged them
- Just tired

---

## System 2: Social Manipulation Camp Events (Standalone, Deep)

These events fire through the normal camp event system. They are NOT part of the Lucky Hunt challenge code. They check for eligible schemers and viable targets every episode. During Lucky Hunt episodes, they also interleave with the hunt timeline (firing in Round 4 of the hunt, and during aftermath).

### Schemer Eligibility

Not every strategic player is a schemer. The threshold:
- `strategic >= 6` AND `loyalty <= 4` — the classic manipulator profile
- OR `strategic >= 8` regardless of loyalty — genius-level strategists scheme even if loyal (they rationalize it)
- OR archetype in `['villain', 'mastermind', 'schemer', 'black-widow']` — archetype overrides stats

A schemer won't scheme against someone with bond >= 5 (genuine ally) unless their loyalty is <= 2 (truly ruthless).

### Target Selection

Schemers don't pick randomly. They pick the target that benefits them most:
1. **Showmance pair** — highest priority. Breaking a couple weakens two threats at once.
2. **Strong bond pair** that doesn't include the schemer — second priority. Isolate one of them.
3. **Alliance they're not in** — third priority. Fracture the opposition.
4. **Specific rival** — if the schemer has bond <= -3 with someone, they might scheme specifically to get that person voted out.

The schemer's target selection is itself a weighted roll:
```javascript
targetScore = (isShowmance ? 3 : 0)
            + (bondStrength * 0.5)
            + (isThreat ? 2 : 0)
            + (personalGrudge ? abs(bond) * 0.3 : 0)
            + Math.random() * 2; // some unpredictability
```

### Event Types (Deep)

#### Forge Note
**What it is:** The schemer writes a fake note, allegedly from Player Y, and plants it where Player X will find it. The note contains something hurtful — "I'm only keeping you around because you're easy to beat" or "I'm voting for you next."

**Detailed mechanic:**
1. Schemer picks target pair (X reads the note, Y is allegedly the author)
2. Note quality: `schemer.strategic * 0.1 + schemer.social * 0.05` (how convincing is the forgery?)
3. X discovers the note. X's reaction depends on:
   - X's mental score: high mental = skeptical, examines the handwriting, questions the source
   - X's bond with Y: high bond = harder to believe, low bond = easy to believe
   - X's intuition: might detect the forgery
4. **Belief check:** `noteQuality + (5 - bond(X,Y)) * 0.1` vs `X.mental * 0.08 + X.intuition * 0.05`
   - If X believes: bond(X,Y) drops -1.0 to -3.0 proportional to how convincing the note was. X's emotionalState → 'furious' or 'devastated' depending on their temperament.
   - If X is skeptical: bond(X,Y) drops only -0.5 (seed of doubt planted). X starts watching Y.
   - If X detects forgery: X knows it's fake. X's intuition check reveals the schemer: `X.intuition * 0.06` vs `schemer.strategic * 0.05`. If caught → Expose Schemer event triggers.
5. **Text:** 5 variants for the note content (harsh, cruel, dismissive, strategic, personal). 3 variants for X believing it. 3 for X doubting it. 2 for X catching it.

#### Spread Lies
**What it is:** The schemer approaches Player X directly and tells them that Player Y has been saying terrible things behind X's back.

**Detailed mechanic:**
1. Schemer approaches X. Chooses a lie theme:
   - "Y thinks your game is pathetic" (targets pride)
   - "Y is planning to vote you out next" (targets security)
   - "Y called you [something mean]" (targets emotions)
   - "Y told me they're using you" (targets trust)
2. Lie delivery: `schemer.social * 0.08 + schemer.strategic * 0.04` = persuasion power
3. X's resistance: `X.social * 0.06 + X.intuition * 0.04 + bond(X,Y) * 0.03`
   - High social X can read the schemer's body language
   - High intuition X senses something's off
   - High bond with Y makes X harder to turn
4. **Outcomes:**
   - X buys it fully: bond(X,Y) drops -1.5. X confronts Y (creates a CONFRONTATION sub-event: Y is confused, denies it, bond further erodes -0.5 because X doesn't believe the denial)
   - X is uncertain: bond(X,Y) drops -0.5. No confrontation but X is suspicious. perceived bond drops further.
   - X doesn't buy it: X suspects the schemer. bond(X, schemer) drops -0.5. X might warn Y.
   - X is offended by the attempt: bond(X, schemer) drops -1.0. X tells others. Mini-expose.
5. **The confrontation sub-event** (fires only on full buy-in): X approaches Y angrily. Y is blindsided. Other players witness. The argument is public. Even if Y is innocent, the damage is done — the perception changes.

#### Kiss Trap (The Heather Move)
**What it is:** The schemer engineers a scene designed to make it look like Player A (in a showmance with Player B) is cheating. The schemer (or an accomplice) kisses A, and B is lured to witness it.

**Detailed mechanic — 5 steps:**

1. **Target selection:** Schemer identifies a showmance (A + B). Schemer decides who to "kiss" (A) and who sees it (B). Usually A is the one more likely to be confused/manipulated. B is the one with lower mental (more likely to believe what they see).

2. **Accomplice recruitment:** The schemer needs someone to either:
   - Lure B to the location at the right moment (accomplice.social >= 5, bond with schemer >= 2)
   - OR the schemer lures B themselves (riskier, schemer.social >= 7)
   - Accomplice doesn't need to know the full plan. They might be told "bring B to the dock, I have a surprise."

3. **The setup:** Schemer approaches A with a manipulation:
   - Fake tears: "I'm having such a hard time, nobody likes me" (schemer.social check)
   - Emotional bait: "Y said terrible things about you" (lie → confusion → vulnerability)
   - Direct: just kiss them (requires boldness >= 7, risky)
   - A's resistance: `A.loyalty * 0.06 + bond(A,B) * 0.04 + A.intuition * 0.03`
   
4. **The witness moment:** B arrives and sees A + schemer in a compromising position.
   - B's reaction depends on: bond(A,B), B's temperament, B's mental
   - High temperament B: controlled fury, walks away, processes later
   - Low temperament B: immediate explosion, screaming, crying
   - High mental B: suspects a setup, looks for the schemer's accomplice
   - B's belief check: `(10 - B.mental) * 0.08 + (10 - B.intuition) * 0.04` = how much they believe what they saw

5. **Fallout cascade:**
   - Bond(A,B): drops -2.0 to -4.0 proportional to B's belief
   - A is confused/horrified (they didn't plan this). A.emotionalState → 'devastated'
   - B.emotionalState → 'devastated' or 'furious'
   - If B has low temperament: B confronts A publicly. The whole camp sees. Everyone takes sides.
   - Showmance status: if bond drops below 0, showmance can be destroyed entirely
   - Accomplice: if their role is discovered, they take heat too (-0.5 bond from everyone)
   - Schemer: if undetected, sits back and watches. If detected (A or B figures it out later), massive heat.

**Detection chain:**
- Immediate: B.intuition >= schemer.strategic + 2 → B sees through it on the spot. "This was a setup." Schemer exposed.
- Delayed: After the aftermath, if any player with intuition >= 7 observed the sequence, they piece it together. Exposure fires next round.
- Never: If nobody's intuition is high enough, the truth never comes out. The damage is permanent.

**This is the RAREST event.** Requirements: showmance exists, schemer strategic >= 7, accomplice available, both A and B must be reachable. When it fires, it's the episode.

#### Campaign Rally (The Leshawna Move)
**What it is:** A social player is so angry about what happened (a scheme, a betrayal, a sabotage) that they rally the group to vote someone out.

**Trigger:** A player with social >= 6 witnesses or learns about a scheme/betrayal. They're motivated by: loyalty to the victim (bond >= 3), hatred of the schemer (bond <= -2), or general moral outrage (loyalty >= 7).

**Mechanic:**
1. Rallier approaches players one by one. For each player:
   - Base influence: `rallier.social * 0.05 + bond(rallier, target) * 0.03`
   - Target's existing opinion matters: if they already dislike the scheme target, easier to flip
   - Target's loyalty matters: high loyalty players are more swayed by "they wronged someone" arguments
2. Each approached player either:
   - Agrees: they'll vote the rallier's target. Heat applied to target.
   - Declines: they have their own agenda. No effect.
   - Counter-argues: they think the rallier is wrong. Bond with rallier drops -0.2.
3. **Heat result:** Target gets `agreedPlayers * 0.5` heat, capped at 3.0. Expires in 2 episodes.
4. **The tragic irony:** If the rallied target has immunity (from the Lucky Hunt chest), the campaign successfully turns the vote... against someone else. The wrong person goes home. Just like TDI.

#### Whisper Campaign
**What it is:** Subtler than a rally. The schemer plants individual seeds with different people, each one a slightly different version of the truth.

**Mechanic:** Similar to Campaign Rally but:
- Lower per-person influence: `schemer.strategic * 0.04 + bond * 0.02`
- Harder to trace: victim needs intuition >= schemer.strategic to figure out who's behind it
- Can target a specific narrative: "I heard they're coming for you next" (paranoia) or "they don't respect you" (ego)
- Works on more people (can approach 5-6 players vs. rally's 3-4)
- But each individual influence is smaller

#### Expose Schemer
**What it is:** A player catches a scheme in progress and calls it out publicly.

**Trigger:** Fires as a REACTION to any social manipulation event. The exposer needs:
- Intuition >= 6
- Was present/nearby when the scheme happened
- Passes detection check: `exposer.intuition * 0.06` vs `schemer.strategic * 0.05`

**Mechanic:**
1. Exposer announces what they saw/figured out
2. The group reacts. Schemer is confronted.
3. **Consequences for schemer:**
   - Bond -0.5 to -1.0 from EVERY player (public disgrace)
   - Heat: +2.0 for 3 episodes
   - If schemer had immunity, they're safe but universally hated (sets up a revenge arc)
4. **Consequences for exposer:**
   - Bond +0.3 from everyone (hero moment)
   - Popularity +2
   - If the schemer has allies, those allies' bond with exposer drops -0.5 (shooting the messenger)
5. **Consequences for victim:**
   - Sympathy bond: +0.3 from everyone
   - Emotional recovery: emotionalState → 'normal' (the truth helps)
   - If their showmance/bond was damaged by the scheme, partial repair (+1.0 bond back)

#### Comfort Victim
**What it is:** A compassionate player comforts someone who was hurt by a scheme.

**Trigger:** Fires as a REACTION to any social event that set a player's emotionalState to 'devastated'. The comforter needs:
- Loyalty >= 6 OR bond >= 3 with victim
- Not involved in the scheme

**Mechanic:**
1. Comforter finds the victim (crying in the cabin, sitting alone on the dock)
2. Text describes the conversation — empathetic, real, not strategic
3. **Bond:** +1.0 to +2.0 between comforter and victim, proportional to comforter's social + loyalty
4. **Alliance formation:** If bond(comforter, victim) >= 4 after the boost, check for alliance formation trigger. Shared trauma bonds people.
5. **Emotional recovery:** Victim's emotionalState upgrades from 'devastated' to 'furious' (anger is more functional than despair) or 'normal' if comforter's social >= 8

### The Heather Sequence (Full Chain)

When all conditions align, the events chain:

```
1. Forge Note → schemer plants fake note from A to B
2. B reads note → bond(A,B) damaged, B is upset
3. Kiss Trap → schemer kisses A, B witnesses
4. B's world collapses → bond(A,B) potentially destroyed, showmance threatened
5. Victim (A or B) cries → emotionalState = 'devastated'
6. Comfort → loyal player finds victim, bonds form
7. Expose (if high-intuition player pieces it together) → schemer exposed, heat
8. Campaign Rally → social player rallies votes against the "cheater" or schemer
9. Chest Ceremony reveals schemer has immunity → can't vote them out
10. Wrong person goes home → tragic, dramatic, unforgettable

Total probability when conditions are met: ~5-10%
When it happens, it generates 8-12 timeline events and fundamentally reshapes the game.
```

---

## VP Screen (Deep)

**Theme:** Pirate treasure map aesthetic.
- Parchment background with aged texture
- Compass rose in the corner
- Each player's hunt location marked with an X on a stylized map
- Chest icons for the ceremony
- Red wax seal motif for reveals

**Click-to-reveal flow — one unified timeline:**
Each click reveals the next event in chronological order. The VP screen should feel like watching the episode — cut between players, interleave stories, build tension.

1. **Chris Announcement** — Pirate costume, cannon fires, challenge explained
2. **Clue Draws** — 2-3 per click. Player portrait + plank image + reaction text + Chris commentary
3. **The Hunt** — Each event is one click. Mix of:
   - Hunt attempts (player portrait, location art, attempt text, result)
   - Hunt events (two portraits, event text, consequence badges)
   - Social schemes (dramatic framing, bold text, emotional reactions)
   - The timeline should feel like TV editing — cut to Owen stuck with the bear, cut to Heather scheming, cut back to Owen still stuck
4. **Chest Ceremony** — One chest per click. Save immunity for last. Booby trap gets a special explosion animation.
5. **Aftermath** — Campaign, comfort, exposure. Each is one click.

**Special VP moments:**
- Key steal gets a dramatic full-width card with both portraits
- Kiss trap gets a multi-panel sequence (setup → kiss → witness → breakdown)
- Immunity reveal gets a gold-bordered celebration card
- Booby trap gets a red-bordered explosion card

**Debug tab:** Per-player table:
| Player | Difficulty | Location | Attempts | Key Found | Dud | Chest Reward | Helped By | Sabotaged By | Stolen From | Stolen By | Schemes | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

---

## Data Shape (Final)

```javascript
ep.luckyHunt = {
  timeline: [
    // Every event in chronological order — this IS the narrative
    { type: 'announcement', text },
    { type: 'clueDraw', player, difficulty, location, text, chrisLine },
    { type: 'huntAttempt', player, attemptNum, success, text, personalScores, approachType },
    { type: 'huntEvent', subtype, players, text, consequences, personalScores, detected },
    { type: 'socialScheme', subtype, players, text, consequences, personalScores, exposed, chainId },
    { type: 'lastChance', player, success, text, personalScores },
    { type: 'chestOpen', player, reward: { type, name, description }, text, chrisLine },
    { type: 'aftermath', subtype, players, text, consequences, personalScores },
  ],

  // Per-player summary for debug/backlog
  huntResults: {
    [playerName]: {
      difficulty, location: { id, name, tier },
      foundKey: bool, dudKey: bool,
      chestReward: null | { type, name },
      helpedBy: null | name,
      sabotagedBy: null | name,
      stolenFrom: null | name,
      stolenBy: null | name,
      attemptsMade: number,
      personalScore: number,
      emotionalState: string,
    },
  },

  // Challenge outcome
  immunityWinner: name,
  chestRewards: { [playerName]: { type, name } },
  keyFinders: [names],        // everyone who found a working key
  dudKeys: [names],           // everyone whose key was a dud
  noKey: [names],             // everyone who never found their key
};
```

**Heat tracking:**
- `gs._luckyHuntHeat` — saboteurs and thieves caught during the hunt. `{ [name]: { amount, expiresEp } }`
- `gs._schemeHeat` — schemers exposed via social manipulation events. Global (not challenge-specific). `{ [name]: { amount, expiresEp } }`

**Survival integration:** Food/comfort chest rewards add to `gs.tribeFood[gs.mergeName || 'merge']` when survival system is active.

**Camp events generated:** All social manipulation events go through the normal camp event system with standard structure: `{ type, players[], text, consequences, badgeText, badgeClass }`.

---

## Twist Catalog Entry

```javascript
{ 
  id: 'lucky-hunt', 
  emoji: '🗝️', 
  name: 'Lucky Hunt', 
  category: 'challenge', 
  phase: 'post-merge', 
  desc: 'Scavenger hunt for keys to treasure chests. Random difficulty, random locations. Find your key, open your chest — one has immunity, one is a booby trap. Help allies, sabotage rivals, steal keys, or scheme in the chaos.',
  engineType: 'lucky-hunt',
  incompatible: [all other challenge replacements]
}
```

---

## Badge Registration

**Hunt badges:**
- `luckyHuntHelped` — HELPED (green)
- `luckyHuntSabotaged` — SABOTAGED (red)
- `luckyHuntSaboteurCaught` — SABOTEUR (red)
- `luckyHuntStolen` — KEY STOLEN (red)
- `luckyHuntShowoff` — SHOWOFF (gold)
- `luckyHuntPanic` — FROZE (red)
- `luckyHuntDiscovery` — FOUND SOMETHING (blue)
- `luckyHuntBoobyTrap` — BOOBY TRAPPED (red)
- `luckyHuntDud` — DUD KEY (red)
- `luckyHuntShared` — SHARED REWARD (green)

**Social manipulation badges (global, not Lucky Hunt-specific):**
- `socialForgeNote` — FORGED NOTE (red)
- `socialSpreadLies` — LIED TO (red)
- `socialKissTrap` — KISS TRAP (red)
- `socialHeartbroken` — HEARTBROKEN (red)
- `socialConfrontation` — CONFRONTATION (red)
- `socialCampaignRally` — CAMPAIGNED (blue)
- `socialWhispers` — WHISPERS (blue)
- `socialExposed` — EXPOSED (gold)
- `socialCaught` — CAUGHT (red)
- `socialComforted` — COMFORTED (green)
