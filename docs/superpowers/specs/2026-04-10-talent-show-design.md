# Talent Show Design

**Date:** 2026-04-10
**Inspired by:** Total Drama Island S1E5 "Not Quite Famous"
**Type:** Schedulable challenge twist (pre-merge, tribe vs tribe)

---

## Overview

Talent show challenge. Each tribe auditions all members, captain picks 3 to perform on stage. Chef scores each act 0-9 on the Chef-O-Meter. Disasters, clutch performances, and villain sabotage create drama. Tribe with the highest total wins immunity. Two VP screens: casual auditions + stage show with animated score bars and audience reactions.

## TWIST_CATALOG Entry

```
id: 'talent-show'
emoji: '🎭'
name: 'Talent Show'
category: 'challenge'
phase: 'pre-merge'
engineType: 'talent-show'
minTribes: 2
incompatible: [all other challenge twists]
```

## Core Flow

1. **Auditions** — all tribe members audition. Captain (highest `social * 0.5 + strategic * 0.5`) picks top 3.
2. **The Show** — 3 performers per tribe. Each gets a fresh show score. Disaster/clutch/sabotage can fire.
3. **Result** — highest tribe total wins immunity. Lowest goes to tribal.
4. **Camp events** — 2 per tribe (1 positive, 1 negative).

Acts per tribe: 3 (unless tribe has exactly 2 members, then 2). All tribes always field 3 regardless of opponent tribe size.

## Talent Assignment

Talent type assigned based on player's highest stat combo:

| Talent Type | Primary Stat | Secondary Stat |
|---|---|---|
| Physical feat | physical | endurance |
| Performance art | social | boldness |
| Skill display | mental | intuition |
| Daredevil act | boldness | physical |
| Creative act | mental | social |

Player gets the category where `primary + secondary` is highest. Ties broken by random.

## Audition Scoring

```
auditionScore = primaryStat * 0.35 + secondaryStat * 0.25 + social * 0.15 + temperament * 0.10 + random(0, 3.0)
```

Top 3 scorers selected by captain. Heavy random (0-3.0) allows upsets — stat-weaker players can sneak in.

## Show Scoring

Each performer gets a fresh show score using the same formula with new random variance. Score mapped to Chef's 0-9 scale:

```
chefScore = Math.min(9, Math.max(0, Math.round(showScore - 2)))
```

### Disaster
- Chance: `(10 - temperament) * 0.03` — max 21% at temperament 3
- Effect: score drops to 1-2. Disaster flavor text plays.

### Surprise Hit (Clutch)
- Only eligible: lowest audition scorer of the 3 performers (the Harold role)
- Chance: `boldness * 0.02` — max 20% at boldness 10
- Effect: score boosted to 8-9. Clutch flavor text plays.

### Sabotage
- Only villain/schemer/mastermind archetypes on opposing tribe can attempt
- Max 1 sabotage per game
- Chance: `strategic * 0.03` — max 30% at strategic 10
- Target: highest audition scorer on the opposing tribe
- Effect: target's score drops by 3-4 points. Sabotage text plays before the act.
- Cannot sabotage own tribe

Disaster check fires first. If no disaster, clutch check. Both cannot fire on same act.

## Talent Pool — Specific Talents with Flavor Text

Each category has 6 talents. Each talent has 4 text variants: audition, performance, disaster, clutch.

### Physical Feat (physical + endurance)

**Gymnastics routine**
- Audition: Nails a backflip in the dirt. The tribe watches, impressed.
- Performance: Full floor routine — handsprings, aerials, stuck landing. Chef nods.
- Disaster: Lands wrong on the dismount. Ankle buckles. Limps offstage to silence.
- Clutch: Wobbles on the landing but saves it with a spin nobody saw coming. Perfect recovery.

**Martial arts demo**
- Audition: Throws kicks at the air with scary precision. Nobody claps ironically.
- Performance: Board breaks. Roundhouse. Flying knee. The stage shakes.
- Disaster: Tries a spinning kick, slips, falls flat. The board doesn't break. Neither does the silence.
- Clutch: Almost loses balance on the flying kick — catches it mid-air and SNAPS the board clean. Gasps.

**Strength display**
- Audition: Lifts a log over their head. Simple. Effective.
- Performance: Deadlifts a canoe. Then puts a person in it and lifts again.
- Disaster: The canoe doesn't budge. Strains. Face goes red. Nothing.
- Clutch: Struggling — the canoe starts to tip — then SLAMS it overhead with a roar. Standing ovation.

**Parkour run**
- Audition: Vaults over a bench, rolls, sticks the landing. Quick and clean.
- Performance: Full obstacle run — wall flip, rail slide, precision jump to the stage.
- Disaster: Clips the rail. Eats dirt. Rolls into the front row.
- Clutch: Slips on the rail — but grabs it one-handed, swings, lands on the stage mark. Showstopper.

**Wrestling showcase**
- Audition: Throws a dummy around like it insulted them.
- Performance: Suplexes a training dummy off the stage. The crowd flinches.
- Disaster: The dummy fights back. Or rather, gets tangled. Embarrassing struggle.
- Clutch: The dummy catches on something — rips it free mid-move and launches it into the lake. Legend.

**Endurance hold**
- Audition: Holds a handstand for two minutes straight during auditions. No wobble.
- Performance: Planks on the edge of the stage while balancing objects. Pure control.
- Disaster: Arms give out. Crashes down. Objects scatter everywhere.
- Clutch: Arms shaking, sweat dripping — holds it. And holds it. And holds it. Chef slow-claps.

### Performance Art (social + boldness)

**Singing**
- Audition: Hums a few bars. Voice is actually good. Tribe goes quiet.
- Performance: Full song. No backing track. Just voice. The forest goes still.
- Disaster: Voice cracks on the high note. Tries to recover. Cracks again. Walks off.
- Clutch: Voice cracks — pauses — then belts the note raw and perfect. Chills.

**Comedy standup**
- Audition: Tells one joke at audition. Gets a real laugh, not a pity one.
- Performance: Five minutes. Reads the crowd. Callbacks. Timing. They're crying laughing.
- Disaster: Opens with a joke. Silence. Tries another. Worse silence. Panic sweats.
- Clutch: Bombing hard — then pivots to self-roast. "This is going great, right?" The crowd loses it.

**Dramatic monologue**
- Audition: Delivers three lines from memory. The vibe shifts. Everyone leans in.
- Performance: Full monologue. Eye contact. Pauses that hit. Someone in the back is crying.
- Disaster: Forgets the lines. Freezes. Mumbles something. Walks offstage staring at the ground.
- Clutch: Goes blank — improvises from the heart. It's not the script. It's better.

**Dance routine**
- Audition: Quick choreo. Nothing fancy. But the rhythm is there and the confidence sells it.
- Performance: Full choreographed piece. Uses the whole stage. Every beat lands.
- Disaster: Steps on own foot. Stumbles. Tries to style it out. Doesn't work.
- Clutch: Stumbles mid-spin — turns it into a slide. The crowd thinks it was planned.

**Impressions**
- Audition: Does the host. It's uncanny. Even the host laughs.
- Performance: Five impressions in a row — host, Chef, tribemates. Each one lands.
- Disaster: Does an impression of someone in the audience. It's mean. Nobody laughs.
- Clutch: The first three are rough — then nails the host so perfectly that Chef breaks character laughing.

**Spoken word**
- Audition: Recites something original. Short. Intense. The fire crackles louder.
- Performance: Full piece. Raw. Personal. You can hear the silence between the words.
- Disaster: Mumbles. Loses the thread. Reads from a crumpled paper. Nobody connects.
- Clutch: Loses the paper — recites from memory. Voice shaking. Realer than the rehearsed version.

### Skill Display (mental + intuition)

**Beatboxing**
- Audition: Drops a beat. It's actually complex. People start nodding.
- Performance: Full routine — bass, snare, vocal scratch, melody. All at once. Inhuman.
- Disaster: Tries to go too fast. Chokes on spit. Coughs into the mic.
- Clutch: Keeps building layers until it sounds like a full band. Nobody can believe it's one person.

**Card tricks**
- Audition: Fans the deck. Pulls the right card. Clean. No fumbles.
- Performance: Full act — cards appear, vanish, end up in someone's pocket. Gasps throughout.
- Disaster: Drops the deck. Cards scatter. The trick is exposed. Everyone sees the double lift.
- Clutch: Drops the deck — catches a single card mid-air. It's their card. Mic drop.

**Speed-solving**
- Audition: Solves a puzzle in 40 seconds at audition. Tribe times it.
- Performance: Solves three puzzles simultaneously. Blindfolded for the last one.
- Disaster: Can't find the last piece. Panics. Time runs out with one piece missing.
- Clutch: Stuck on the last move — closes eyes — solves it by feel. Record time.

**Fire staff**
- Audition: Spins a lit staff with precision. Controlled. Mesmerizing.
- Performance: Full fire performance — spins, tosses, catches behind the back. Shadows dance.
- Disaster: The staff slips. Fire hits the ground. Someone stomps it out. Smoke everywhere.
- Clutch: Tosses high — catches blind behind the back. The fire traces an arc in the dark. Perfect.

**Knife throwing**
- Audition: Plants three knives in a target. Thunk thunk thunk. Clean grouping.
- Performance: Full act — throws blindfolded. Splits a fruit on someone's head.
- Disaster: Misses the target. Knife sticks in the stage. Awkward silence. Very awkward.
- Clutch: Last throw goes wide — then curves and hits the bullseye. Nobody knows how.

**Rubik's cube solve**
- Audition: Sub-minute solve during audition. Hands blurring.
- Performance: Solves two cubes simultaneously — one in each hand. Audience counts along.
- Disaster: Gets stuck. Turns and turns. Time passes. Still stuck. People start looking away.
- Clutch: Frozen for 10 seconds — then a burst of moves and both cubes lock in. Under a minute.

### Daredevil Act (boldness + physical)

**Fire-eating**
- Audition: Breathes a small flame at audition. Controlled. Eyebrows intact.
- Performance: Full fire-breathing display — arcs of flame light up the stage.
- Disaster: Singes own face. Coughs smoke. Medic jogs over.
- Clutch: Flame sputters — then ROARS. Biggest arc of the night. The crowd screams.

**Knife juggling**
- Audition: Juggles two knives casually. No fear.
- Performance: Three knives. Then four. Catches the last one between fingers.
- Disaster: Drops one. It sticks in the stage an inch from their foot. Everyone gasps for the wrong reason.
- Clutch: Fumbles the third — kicks it up with their foot and catches it. Unplanned but incredible.

**High dive**
- Audition: Jumps off a tall stump into water. Clean entry.
- Performance: Full dive from the highest point at camp. Flip. Twist. Barely a splash.
- Disaster: Belly flop. The sound echoes. The water doesn't forgive.
- Clutch: Over-rotates — somehow adjusts mid-air and enters clean. The splash is nothing.

**Eating challenge**
- Audition: Eats something terrible without flinching. Audition complete.
- Performance: Eats progressively worse things on stage. Hot sauce. Bugs. Mystery meat. Never flinches.
- Disaster: Gags on the second item. Runs offstage. Sounds of regret from backstage.
- Clutch: On the verge of puking — swallows it, smiles, and asks for more. The crowd is horrified and impressed.

**Balance walk**
- Audition: Walks a narrow beam without wobbling. Casual.
- Performance: Walks a tightrope over the campfire. Blindfolded for the last third.
- Disaster: Falls off. Into the mud. Or worse, into the audience.
- Clutch: Wobbles — drops to one knee on the rope — stands back up and finishes. Nails the dismount.

**Extreme yo-yo**
- Audition: Does a few tricks. One goes wrong, string tangles, recovers fast.
- Performance: Full speed routine — around the world, walk the dog, cradle, all flawless.
- Disaster: String wraps around own neck. Tribe watches in horror. Has to be untangled.
- Clutch: String tangles — whips it free and launches into the hardest trick clean. Nobody saw that coming.

### Creative Act (mental + social)

**Musical instrument**
- Audition: Plays a few chords. Melody is there. Tribe goes quiet for the right reasons.
- Performance: Full song. Original composition. The fire crackles in time.
- Disaster: String breaks mid-song. Tries to keep going. Can't. Stops. Silence.
- Clutch: String breaks — switches to humming the melody while finger-tapping the body. Haunting.

**Painting/drawing**
- Audition: Sketches a portrait in two minutes. It's actually good.
- Performance: Live portrait of the host. Every detail. Reveals it at the end. Gasps.
- Disaster: The portrait looks nothing like anyone. Maybe a raccoon? The host squints.
- Clutch: Running out of time — last three strokes bring the whole thing together. It's perfect.

**Poetry recital**
- Audition: Reads an original poem. Short. Three lines. They land.
- Performance: Full poem. About the island, the game, the people. Specific. Painful. Real.
- Disaster: Reads from paper. Monotone. Nobody connects. A cricket literally chirps.
- Clutch: Puts the paper down. Makes eye contact. Recites from the gut. Voice breaks. It hits.

**Magic show**
- Audition: One trick at audition. Clean vanish. Crowd leans in.
- Performance: Full act — levitation illusion, escape trick, finale with fire. Theatrical.
- Disaster: The trick fails. The hidden card falls out. The rabbit escapes. Everything falls apart.
- Clutch: Trick fails — plays it off as part of the act. "That's what you THINK happened." Recovers brilliantly.

**Puppet show**
- Audition: Quick bit with a sock puppet. Gets a laugh.
- Performance: Full show — voices, story, callbacks to camp drama. The puppet roasts people.
- Disaster: The puppet falls apart. Literally. Stuffing everywhere.
- Clutch: Puppet's head falls off — uses it as a prop. "This is what happens when you cross me." Biggest laugh of the night.

**Rap/freestyle**
- Audition: Spits 8 bars about camp life. Flow is there. Words are sharp.
- Performance: Full freestyle — calls out names, references real events, rhyme scheme holds.
- Disaster: Rhyme falls apart. Mumbles. Loses the beat. Stares at shoes.
- Clutch: Goes off-beat — stops — restarts with a completely different flow that's twice as hard. Jaw drop.

## Sabotage Types

Max 1 per game. Villain/schemer/mastermind on opposing tribe.

| Sabotage | Text |
|---|---|
| Read their diary | Reads private writings aloud to the audience. Target is humiliated. The crowd is silent — then the whispering starts. |
| Swap their props | Replaced the performer's props with broken/wrong ones. They reach for the guitar — wrong strings. The cards — marked. |
| Spread pre-show rumors | Told everyone the performer was planning to throw the challenge. The crowd is hostile before the act even starts. |
| Psychological warfare | Whispered something to the performer right before they went on stage. Whatever it was, it worked. They look shaken. |

## Audience Reactions

After each Chef-O-Meter reveal, show 2-3 tribemate reactions based on archetype + score.

### High score (7-9)
- Hero/loyal: "That's my tribe right there. That's what we do."
- Villain/schemer: Slow clap. Calculating. Already thinking about how to use this.
- Floater: Claps along. Relieved someone else carried the weight.
- Showmancer: Locks eyes with the performer. That was attractive.
- Wildcard/chaos: Loses it. Standing on the bench screaming.
- Strategic: Nods. That just bought the tribe safety. Good.

### Mid score (4-6)
- Hero/loyal: Polite clap. "Good effort." Means it, kind of.
- Villain/schemer: Unimpressed. Expected more.
- Floater: Claps at the same speed as everyone else.
- Strategic: "We need the next act to be better."

### Low score (1-3)
- Hero/loyal: Looks away. Doesn't pile on. But the disappointment is visible.
- Villain/schemer: Smirks. Files it away. That's a vote target now.
- Floater: Cringes. Glad it wasn't them up there.
- Showmancer: Covers mouth. Second-hand embarrassment.
- Wildcard/chaos: Laughs out loud. Can't help it. Gets dirty looks.
- Strategic: Already running numbers. Can the other two acts make up for this?

### Sabotage moment (from sabotaged tribe)
- Hero: Furious. Stands up. Has to be held back.
- Loyal: Shock. Disbelief. Then quiet rage.
- Villain on same tribe: Impressed despite themselves.
- Social butterfly: Immediately comforts the victim.

## VP Screens

### Screen 1: "Auditions" (`rpBuildTalentAuditions`)
- Casual camp feel (tod-dawn)
- Click-to-reveal per tribe
- Captain portrait + CAPTAIN badge
- Each auditioner: portrait, talent type, audition flavor text, score, SELECTED/CUT badge
- Bitter rejection highlighted if close to cutoff

### Screen 2: "The Show" (`rpBuildTalentShow`)
- Stage atmosphere (tod-deepnight), spotlight glow effects
- Click-to-reveal per act (interleaved: Act 1 from each tribe, Act 2, Act 3)
- Each act card:
  - Large centered performer portrait with spotlight glow
  - Talent name + tribe color
  - Performance text (normal/disaster/clutch variant)
  - Sabotage card before the act if sabotage fired
  - **Chef-O-Meter bar**: 9 segments, green fills left-to-right up to score, orange/red for empty. Chef emoji on left. Score number on right. CSS animation on reveal.
  - 2-3 audience reaction portraits with speech bubble text below the bar
- Final: scoreboard with tribe totals, winner announcement

## Camp Events (2 per tribe)

### Positive (pick 1)
- **Standing Ovation**: tribe's highest show scorer. +0.5 bond from tribemates, +2 popularity.
- **Unlikely Hero**: lowest audition scorer of the 3 who crushed the show. +0.4 bond.
- **Team Support**: highest social non-performer who cheered from sidelines. +0.3 bond with performers.

### Negative (pick 1)
- **Sabotage Fallout** (priority if sabotage fired): saboteur exposed/suspected. -0.5 bond, +1.5 heat.
- **Stage Disaster**: player who choked. -0.3 bond from tribemates, +0.5 heat.
- **Bitter Rejection**: highest audition score who got cut. -0.4 bond with captain.

## Episode History Fields
- `ep.isTalentShow = true`
- `ep.talentShow = { auditions, performances, captains, sabotage, chefScores, winner, loser, mvp }`
- `ep.chalMemberScores` — from show scores (not audition scores)

## Text Backlog
`_textTalentShow(ep, ln, sec)` — audition results, each performance with score, disaster/clutch/sabotage, final scores + winner.

## Cold Open Recap
Recap card: winner, final score, MVP, sabotage if any.

## Timeline Tag
`tsTag` — "Talent Show" in purple.

## Debug Challenge Tab
- Full audition scores per tribe (ranked)
- Show scores per performer with Chef-O-Meter values
- Sabotage detail if it fired

## Edge Cases
- **3+ tribes**: all perform. Acts interleaved. Highest total wins. Lowest goes to tribal. Tiebreaker: lowest best individual act.
- **Tribe with 2 members**: 2 acts instead of 3.
- **Sabotage + disaster on same target**: sabotage fires first (pre-show), disaster can still fire during the act. Cumulative — score tanks hard.
- **Captain picks themselves**: allowed if they auditioned well.
- **Same talent type on same tribe**: allowed. Two singers scored independently.
- **Generic twist screen**: excluded (has dedicated VP).
