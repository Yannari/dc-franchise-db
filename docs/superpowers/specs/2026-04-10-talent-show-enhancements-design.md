# Talent Show Enhancements Design

**Date:** 2026-04-10
**Type:** Enhancement to existing talent-show challenge twist

---

## Overview

Three enhancements to the talent show:
1. **Backstage Social Events** — 2-3 drama scenes between auditions and the show
2. **Expanded Performance Descriptions** — 3-beat narratives (setup/act/landing) for all 30 talents × 3 outcomes
3. **Audition Drama Events** — 1 event per tribe during auditions

## 1. Backstage Social Events

**Timing:** After auditions, before the show. Stored as `ep.talentShow.backstageEvents[]`.

**Count:** 2-3 per episode (not per tribe). Each rolled independently. Max 3.

| Event | Chance | Trigger | Effect |
|---|---|---|---|
| Spy Mission | 25% per villain/schemer | Sends ally to watch other tribe rehearse | Reveals opponent's best performer for sabotage |
| Pep Talk | 30% per tribe if performer temperament <= 5 | High social non-performer comforts nervous performer | +1 temperament buff (reduces disaster ~3%) |
| Sabotage Setup | Auto if sabotage fires | The planning scene | Narrative buildup, +0.2 bond saboteur ↔ co-conspirator |
| Rivalry Confrontation | 20% if cross-tribe bond <= -2 | Rivals clash backstage | -0.4 bond between them |
| Accident | 15% per performer with temperament <= 4 | Practice goes wrong | -2 show score OR forces substitution |
| Secret Rehearsal | 20% if cut player has boldness >= 6 | Practices alone, spotted | 40% chance subbed in (Harold moment) |

**VP:** Shown as "BACKSTAGE" section — own VP screen between Auditions and The Show, or integrated into the Auditions screen at the bottom. Click-to-reveal cards with portraits + narrative text.

## 2. Expanded Performance Descriptions (3-Beat Narratives)

Each talent's performance/disaster/clutch expanded from 1 sentence to 3 beats:
- **Setup** — walking on stage, atmosphere, tension
- **Act** — the performance itself
- **Landing** — crowd reaction, ties to Chef score

All 270 sentences hand-written below. Stored as 3-element arrays.

### Physical Feat — Gymnastics Routine
**Performance:**
1. The lights hit as [p] walks to center stage. [Sub] [rolls/roll] [pos] shoulders back. The crowd leans forward.
2. Backflip. Handspring. Aerial cartwheel. Every landing sticks. The stage shakes with each impact but [p] doesn't flinch.
3. Stuck landing. Arms up. The tribe erupts. Chef's eyebrows go up — and that's as close to impressed as he gets.

**Disaster:**
1. [p] bounces onto the stage full of energy. Too much energy. The first handspring is already off-center.
2. The aerial goes sideways. [p] lands on [pos] ankle wrong — buckles — crashes into the edge of the stage. Gasps from the crowd.
3. [p] limps off. The tribe stares at the floor. Chef marks his spoon without looking up.

**Clutch:**
1. [p] steps out looking stiff. Nervous. The tribe can see [pos] hands shaking from the front row.
2. The first flip wobbles. But the second is cleaner. By the third, something clicks — [p] launches into a spinning aerial nobody knew [sub] could do.
3. Stuck landing. Dead silence — then the camp goes ballistic. Chef's spoon climbs higher than anyone expected.

### Physical Feat — Martial Arts Demo
**Performance:**
1. [p] walks to center stage barefoot. No music. No props. Just [pos] body and whatever's about to happen.
2. Three rapid kicks. A spinning roundhouse that whistles through the air. Then the board — CRACK. Clean break. Splinters scatter.
3. [p] bows. The tribe is too stunned to clap immediately. Then it hits. Chef nods once — high praise from him.

**Disaster:**
1. [p] takes position. Deep breath. The crowd is watching. The board is waiting.
2. The spinning kick clips nothing but air. [p] slips. Falls flat. The board sits there, unbroken and mocking.
3. Dead silence. Someone coughs. [p] picks [pos]self up and walks off. Chef doesn't even pick up his spoon.

**Clutch:**
1. [p] looks uncertain stepping out. The tribe saw better at auditions. This doesn't look like the same person.
2. The first kick is sloppy. But then — focus. The roundhouse snaps. The flying knee connects with the board mid-air and CRACKS it clean.
3. The crowd goes from worried to screaming. [p] didn't just recover — [sub] peaked. Chef leans back, impressed.

### Physical Feat — Strength Display
**Performance:**
1. [p] walks out, grabs the canoe by one end. No warm-up. No speech. Just raw intent.
2. One clean lift. The canoe goes overhead. Then [p] lowers it, puts a person in it, and lifts again. The stage groans.
3. The camp watches in silence — then pure noise. Chef marks high. That was primal.

**Disaster:**
1. [p] steps up to the canoe with total confidence. Grips it. Plants [pos] feet. Here we go.
2. It doesn't budge. [p] strains harder. Face turns red. Veins. Nothing. The canoe wins.
3. [p] lets go and walks off. The tribe tries not to make eye contact. Chef marks a 1 and moves on.

**Clutch:**
1. [p] looks nervous at the weight. This looked easier at auditions. The camp can see the doubt.
2. Straining — the canoe barely lifts — starts to tip — and then [p] ROARS and slams it overhead. One brutal push.
3. The camp loses it. [p] didn't do it pretty. [Sub] did it angry. Chef's spoon jumps. That was real.

### Physical Feat — Parkour Run
**Performance:**
1. [p] sizes up the obstacle course. Cracks [pos] neck. The tribe watches from the bleachers.
2. Wall flip — clean. Rail slide — smooth. Precision jump to the stage mark — perfect. Every move connected.
3. [p] sticks the final landing, arms wide. The camp erupts. Chef's spoon fills fast.

**Disaster:**
1. [p] sprints toward the first wall with total commitment. The approach is good. The execution is not.
2. Clips the rail. Eats dirt. Rolls sideways into the front row. A camper spills their drink.
3. [p] sits in the dirt for a long moment before standing up. The camp is quiet out of mercy. Chef marks low.

**Clutch:**
1. [p] hesitates at the start line. Auditions went better. The tribe can feel the nerves.
2. The wall flip is shaky. The rail slide — [p] slips — but grabs it one-handed, swings underneath, and launches onto the stage mark.
3. The save was better than the trick. The camp screams. Chef's spoon shoots up. Improvised excellence.

### Physical Feat — Wrestling Showcase
**Performance:**
1. [p] drags the training dummy to center stage. The dummy didn't agree to this.
2. Suplex. Slam. The dummy goes airborne, crashes backstage. [p] stands over the wreckage, breathing hard.
3. Terrifying. The tribe claps because they're scared not to. Chef marks high — respect for violence.

**Disaster:**
1. [p] grabs the dummy with authority. This should be quick and impressive.
2. The dummy's arm catches on [pos] shirt. What follows is two minutes of [p] wrestling with fabric. The dummy appears to be winning.
3. [p] gives up and walks off. The dummy stays on stage. Someone has to go retrieve it. Chef gives a 1.

**Clutch:**
1. [p] looks unsure approaching the dummy. The camp saw better at auditions. This feels like a different person.
2. First grab slips. The dummy catches on something — [p] rips it free with a sudden fury, launches it into the rafters.
3. Accidental intensity. That wasn't skill — that was rage. And it worked. Chef marks it up. The camp cheers the chaos.

### Physical Feat — Endurance Hold
**Performance:**
1. [p] assumes the position — plank on the stage edge, objects balanced on [pos] back. No movement. No complaints.
2. One minute. Two minutes. Objects stacked higher. The crowd counts along. [p] doesn't shake. Doesn't breathe hard.
3. When [p] finally releases, the crowd roars. Pure discipline. Chef's spoon goes high for the sheer control.

**Disaster:**
1. [p] sets up the hold. Looks strong. Looks steady. The first 30 seconds are fine.
2. Then the shake starts. Objects slide. [p] tries to correct — crashes. Everything scatters. Someone in the front row catches a book.
3. [p] lies face-down on stage for a moment. The tribe watches in painful silence. Chef marks the minimum.

**Clutch:**
1. [p] gets into position but the shake is there from the start. The tribe winces. This doesn't look good.
2. Forty seconds. A minute. The shake gets worse — but [p] locks in. Jaw clenched. Eyes closed. Holds. And holds. And holds.
3. When time runs out, [p] collapses to applause. That wasn't talent — that was willpower. Chef slow-claps with the spoon hand.

### Performance Art — Singing
**Performance:**
1. The stage goes quiet as [p] steps into the spotlight. [Sub] [closes/close] [pos] eyes. No backing track. No safety net.
2. The first note lands clean. Then the second. By the chorus, the entire camp is still. Even Chef stops scowling.
3. [p] finishes. Silence. Then the applause hits all at once. Chef raises his spoon.

**Disaster:**
1. [p] takes the mic. The confidence from auditions is there. [Sub] [opens/open] [pos] mouth.
2. The first note cracks. [p] tries to push through — cracks again. The mic picks up [pos] breathing. [Sub] [stops/stop] mid-verse.
3. [p] walks offstage. Nobody claps. Chef doesn't even lift the spoon.

**Clutch:**
1. [p] steps up looking nervous. Hands shaking. The tribe holds its breath.
2. The first note cracks — [p] pauses. Swallows. Then belts the next one raw and perfect. The camp goes silent for a completely different reason.
3. [p] finishes and the eruption is instant. Chef's spoon hits high before the applause dies down.

### Performance Art — Comedy Standup
**Performance:**
1. [p] walks up, grabs an invisible mic. "So... I've been living in the woods with strangers for a week now." Beat. "It's going GREAT."
2. Five minutes. Every joke lands. Callbacks to camp moments that everyone recognizes. The timing is surgical.
3. The camp is crying laughing. Even Chef cracks a smile — then immediately hides it. The spoon goes high.

**Disaster:**
1. [p] takes the stage with a grin. "Hey everyone. So—" Silence already feels wrong.
2. First joke. Nothing. Second joke. A cough from the back. [p] starts sweating. The third attempt dies in [pos] throat.
3. [p] mumbles "thanks" and walks off to no applause. Chef marks a 1. Someone whispers "that was rough."

**Clutch:**
1. [p] opens with a joke that goes nowhere. Then another. The crowd shifts uncomfortably. This is dying.
2. [p] stops. Looks at the crowd. "Okay, this is going terrible. Let me try something." Pivots to raw self-deprecation. The crowd breaks.
3. By the end they're howling. The comeback was better than any prepared set. Chef's spoon jumps. Redemption.

### Performance Art — Dramatic Monologue
**Performance:**
1. [p] walks to center stage. No props. No music. Just eye contact with the front row. The camp quiets down fast.
2. Full monologue. Every pause hits. [p] builds to a crescendo that pins people to their seats. Someone in the back has tears.
3. Silence. Then thunderous applause. Chef marks high without hesitation. That was real.

**Disaster:**
1. [p] steps out, takes a breath, and begins. The first two lines are fine. Then the eyes go blank.
2. Forgot the lines. Freezes. Mouth opens, nothing comes out. [p] mumbles something that might be the next verse.
3. [p] walks offstage staring at the ground. The tribe watches in secondhand agony. Chef gives mercy points.

**Clutch:**
1. [p] starts uncertain. The lines feel rehearsed. Flat. The camp's attention starts drifting.
2. Then [p] drops the script. Makes eye contact. Improvises from somewhere real. The words aren't written — they're lived.
3. The camp is frozen. That wasn't an act. Chef's spoon rises slowly, like he's not sure what he just witnessed.

### Performance Art — Dance Routine
**Performance:**
1. [p] waits for the imaginary beat to start. When it hits, [sub] [moves/move]. The camp didn't know [sub] could move like that.
2. Full choreographed routine. Uses the whole stage. Every beat lands. The rhythm is infectious — people start bobbing along.
3. Final pose. Breathing hard but smiling. The tribe roars. Chef gives a solid score.

**Disaster:**
1. [p] starts strong. The first eight counts are smooth. The crowd is into it.
2. Then [p] steps on [pos] own foot. Stumbles. Tries to style it out — makes it worse. The rhythm is gone.
3. [p] finishes awkwardly, half a beat off from the music in [pos] head. The clapping is polite at best. Chef shrugs.

**Clutch:**
1. [p] looks stiff walking out. The audition energy isn't there. The tribe braces for mediocre.
2. First few moves are rough — then the beat takes over. [p] stumbles into a slide that looks completely intentional. The crowd buys it.
3. By the end [sub's/they're] freestyling and the camp is clapping along. Chef gives it more than anyone expected.

### Performance Art — Impressions
**Performance:**
1. [p] walks out and immediately becomes someone else. The posture changes. The voice changes. The camp starts grinning.
2. Five impressions back to back — the host, Chef, three campers. Each one is devastating. People are pointing and dying.
3. The final impression nails someone in the front row. The camp loses it. Chef scores high while trying not to laugh.

**Disaster:**
1. [p] steps out confident. "Okay, you're gonna love this." Does the host's voice. It sounds nothing like the host.
2. Tries Chef next. Even worse. The crowd isn't laughing with [p]. Tries a tribemate — the tribemate's face says everything.
3. [p] retreats to silence. Chef marks low. The real host whispers, "I don't sound like that."

**Clutch:**
1. [p] opens with two impressions that land flat. The crowd isn't connecting. This is going south.
2. Last attempt — the host. [p] nails it so perfectly that the host does a double-take. The camp ERUPTS.
3. One good impression saved the whole set. Chef breaks character laughing and marks the spoon high.

### Performance Art — Spoken Word
**Performance:**
1. [p] steps up to the mic. No paper. No notes. Just [p] and the fire crackling behind the stage.
2. Full piece. Raw. Personal. About the island, the game, the people sitting right there. You can hear the silence between the words.
3. When [p] finishes, the camp doesn't clap immediately. They're processing. Then it comes — deep, real. Chef respects it.

**Disaster:**
1. [p] pulls out a crumpled paper. Smooths it against [pos] leg. Begins reading.
2. Monotone. Every word lands flat. [p] reads from the page without looking up. The connection isn't there. A cricket chirps.
3. [p] finishes reading and folds the paper up. The polite clap is almost worse than silence. Chef marks low.

**Clutch:**
1. [p] starts from the paper, voice shaking. The words sound rehearsed and hollow. The camp is drifting.
2. [p] stops. Puts the paper down. Makes eye contact with someone in the front row. Starts over — from memory, from the gut.
3. Voice breaks on the last line. It's realer than anything prepared could be. The camp sits in stunned silence. Chef's spoon climbs.

### Skill Display — Beatboxing
**Performance:**
1. [p] leans into the mic. Tests it with a pop. The camp goes quiet, curious.
2. Bass drop. Snare roll. Then layers — vocal scratch, melody, all at once. The sound shouldn't be possible from one person.
3. [p] finishes with a final bass hit and the camp erupts. Chef's head was bobbing. He tries to pretend it wasn't. High marks.

**Disaster:**
1. [p] steps up to the mic. Breathes in. The first beat starts strong.
2. Tries to speed up — chokes on [pos] own spit. Coughs into the mic. The speakers feed it back. Awful.
3. [p] waves it off and walks backstage. The camp cringes. Chef marks bottom of the spoon.

**Clutch:**
1. [p] starts with a basic beat. Nothing special. The crowd's energy is flat. This isn't what auditions promised.
2. Then the layers start. One by one. Bass, hi-hat, melody, harmony — building until it sounds like a full band.
3. By the end, nobody can believe it's one person. The camp is on their feet. Chef's spoon hits the ceiling.

### Skill Display — Card Tricks
**Performance:**
1. [p] fans a deck of cards and walks to the front row. "Pick a card." The camp leans in.
2. The card vanishes. Reappears in someone's pocket. Then in Chef's hat. The moves are invisible — pure sleight of hand.
3. For the finale, the entire deck rearranges itself mid-air. Gasps. Then applause. Chef scores high.

**Disaster:**
1. [p] pulls out the deck with a flourish. "Watch closely." The camp watches.
2. Fumbles the fan. Drops the deck. Cards scatter everywhere. The hidden card falls out of [pos] sleeve. The trick is completely exposed.
3. [p] picks up the cards in silence while the camp watches. Chef doesn't even bother scoring high enough for it to matter.

**Clutch:**
1. [p] starts the routine and it's rough. A card sticks. Another one bends wrong. The crowd sees the mechanics.
2. On the final trick — drops everything. Reaches down. Catches a single card mid-air. Flips it. It's their card.
3. The recovery is better than the trick would have been. The camp explodes. Chef marks it way up.

### Skill Display — Speed-Solving
**Performance:**
1. [p] sets three puzzles on a table. Cracks [pos] knuckles. The camp watches, skeptical.
2. Hands blur. First puzzle done. Second puzzle done. For the third — [p] puts on a blindfold. Solves it by feel. Under a minute.
3. The camp is speechless. That wasn't a performance — that was a brain on display. Chef gives top marks.

**Disaster:**
1. [p] starts the puzzle with practiced confidence. The first moves are quick. This should be easy.
2. Then [p] freezes. Wrong piece. Backtracks. Wrong again. The clock is running and the crowd is watching the panic.
3. Time runs out with one piece missing. [p] stares at the puzzle. The camp stares at [p]. Chef marks barely above zero.

**Clutch:**
1. [p] starts slow. Too slow. The crowd can see [sub's/they're] overthinking every move. This might be a train wreck.
2. Stuck on the last section. Ten seconds of nothing. Then [p] closes [pos] eyes — and the hands move on their own. Click. Click. Done.
3. Under a minute. The camp goes from worried to screaming. Chef's spoon jumps. That was dramatic.

### Skill Display — Fire Staff
**Performance:**
1. The stage lights dim. [p] steps out with a lit staff. The fire paints shadows on the curtain.
2. Spins. Tosses. Catches behind the back. The fire traces arcs in the dark — controlled chaos. The camp is mesmerized.
3. Final toss — high — spinning — caught clean. The camp exhales and erupts. Chef scores high in the glow.

**Disaster:**
1. [p] steps out with the lit staff. Spins it once — looks good. The camp holds its breath.
2. The staff slips. Fire hits the ground. Someone stomps on it. Smoke billows. Someone shouts for water.
3. The stage smells like burned grass. [p] stands in the smoke, defeated. Chef gives a sympathy score.

**Clutch:**
1. [p] grips the staff too tight. The first spin is awkward. The flame wobbles. The camp winces.
2. Deep breath — tosses high. Catches blind behind the back. The fire traces a perfect arc in the darkness.
3. One move saved everything. The camp gasps, then roars. Chef's spoon goes higher than anyone expected.

### Skill Display — Knife Throwing
**Performance:**
1. [p] faces the target. Three knives in hand. The camp goes dead quiet. Nobody blinks.
2. Thunk. Thunk. Thunk. Three knives, tight grouping, center mass. Then the blindfold goes on. One more throw. Bullseye.
3. The camp erupts. Chef marks high — the blindfold throw sold it.

**Disaster:**
1. [p] takes aim. The camp holds its breath. The first knife flies.
2. It misses the target. Sticks in the stage floor. The second goes wide — lodges in a support beam. The crowd ducks.
3. [p] puts the last knife down. Walks off. Smart move. Chef marks the minimum.

**Clutch:**
1. [p] looks shaky taking aim. First throw — off center. Second — barely hits the board. The crowd is nervous.
2. Last throw. [p] exhales. The knife leaves [pos] hand and curves — somehow — right into the bullseye.
3. Nobody knows how that last one hit. Least of all [p]. The camp screams. Chef's spoon jumps on the drama alone.

### Skill Display — Rubik's Cube Solve
**Performance:**
1. [p] holds up two cubes. One in each hand. The camp starts counting along.
2. Both hands move simultaneously — different patterns, different solutions. The crowd loses track trying to follow. It's inhuman.
3. Click. Click. Both done. Under a minute. The camp counts the time and explodes. Chef gives full marks.

**Disaster:**
1. [p] holds up the cube. Starts turning. The first moves look practiced and confident.
2. Then [p] freezes. Turns one way. Back. The other way. The cube isn't cooperating. The seconds stretch out unbearably.
3. Time runs out. The cube is half-solved. [p] stares at it like it betrayed [pos]. Chef marks the bottom.

**Clutch:**
1. [p] starts solving and it's slow. Way slower than auditions. The crowd can see [sub's/they're] second-guessing.
2. Frozen for ten seconds. The camp thinks it's over. Then — a burst of rapid moves. Both hands flying.
3. Click. Done. Just under the wire. The camp goes from funeral to frenzy. Chef marks it up high.

### Daredevil Act — Fire-Eating
**Performance:**
1. [p] steps out with a torch. The camp goes silent. The flame reflects in everyone's eyes.
2. Deep breath — and the arc of flame lights up the entire stage. Then another, bigger. The heat reaches the front row.
3. [p] extinguishes the torch with [pos] tongue. Bows. The camp erupts. Chef marks high for sheer guts.

**Disaster:**
1. [p] brings the torch to [pos] lips. Confident. The camp leans forward.
2. The flame sputters — then licks [pos] face. [p] recoils. Coughs smoke. The medic starts jogging over.
3. [p] waves off the medic but the damage is done. Singed eyebrows and shattered confidence. Chef gives mercy points.

**Clutch:**
1. [p] lights the torch and hesitates. The flame looks bigger up close than it did at auditions. The camp can see the doubt.
2. First attempt — the flame sputters weakly. Then [p] commits. Full breath. The arc ROARS — biggest of the night.
3. The camp screams. That wasn't technique — that was someone overcoming fear in real time. Chef's spoon flies up.

### Daredevil Act — Knife Juggling
**Performance:**
1. [p] tosses one knife up. Catches it. Two. Three. The camp counts along.
2. Four knives now. The pattern is hypnotic. [p] adds a fifth — catches it between [pos] fingers without looking.
3. All five land safely. The camp breathes again and applauds. Chef scores high for the controlled danger.

**Disaster:**
1. [p] starts with three knives. Clean pattern. Looking good. The crowd relaxes.
2. The fourth knife wobbles — drops — sticks in the stage an inch from [pos] foot. The crowd gasps for all the wrong reasons.
3. [p] backs away from the knife in the floor. The camp is white-knuckled. Chef gives a low score and a concerned look.

**Clutch:**
1. [p] starts juggling and it's shaky. A wobble on the second knife. The crowd tenses.
2. The third knife fumbles — [p] kicks it up with [pos] foot, catches it mid-air, and adds it back to the rotation without breaking rhythm.
3. The save was more impressive than a clean run would have been. The camp goes wild. Chef marks it up.

### Daredevil Act — High Dive
**Performance:**
1. [p] climbs to the highest point at camp. Looks down. The camp looks up. It's far.
2. Perfect form. Flip. Twist. The entry is clean — barely a splash. The lake doesn't even flinch.
3. [p] surfaces to screaming. Chef scores high. That was textbook.

**Disaster:**
1. [p] stands at the top. Looks down. The crowd can see the resolve forming. [Sub] [jumps/jump].
2. Over-rotates. The belly flop echoes across camp. The splash is enormous. The sound is worse.
3. [p] surfaces to silence and sympathy. Chef marks low. The lake got the best performance.

**Clutch:**
1. [p] hesitates at the top. The crowd waits. The height seems to grow the longer [sub] [stands/stand] there.
2. [p] jumps — over-rotates — but somehow adjusts mid-air. The entry isn't pretty but it's clean enough.
3. Surfaces to huge cheers. The crowd saw the save happen in real-time. Chef marks it up for the drama.

### Daredevil Act — Eating Challenge
**Performance:**
1. The table is set. Hot sauce. Bugs. Mystery meat. Things that shouldn't be eaten. [p] sits down and cracks [pos] knuckles.
2. One by one. No hesitation. No face. The hot sauce goes down smooth. The bug crunches. The mystery meat disappears. [p] doesn't even water up.
3. [p] wipes [pos] mouth, stands, and takes a bow. The camp is horrified and impressed in equal measure. Chef scores high.

**Disaster:**
1. [p] looks at the table. Picks up the first item. Takes a bite. So far so good.
2. The second item hits different. [p] gags. Tries to swallow. Gags again. Runs offstage. Sounds of regret echo from backstage.
3. The table sits there, mostly unconquered. The camp tries not to laugh. Chef marks the minimum.

**Clutch:**
1. [p] stares at the items on the table. The confidence from auditions is nowhere to be found. [pos] face says "what did I sign up for."
2. First item — almost quits. Second item — on the verge. Then something snaps. [p] eats the rest without stopping. Asks for more.
3. The camp goes from pity to pandemonium. Chef marks it up high. That was willpower, not talent — and somehow that's better.

### Daredevil Act — Balance Walk
**Performance:**
1. The tightrope stretches over the campfire. [p] puts one foot on it. The crowd holds its breath.
2. Step by step. No wobble. For the last third, [p] puts on a blindfold. The crowd gasps. The steps don't change.
3. [p] reaches the end. Removes the blindfold. Steps down to thunderous applause. Chef's spoon goes high.

**Disaster:**
1. [p] gets on the rope. First few steps are solid. The crowd starts to relax.
2. Then the wobble. [p] overcorrects — and falls. Into the mud. Or worse, into the audience. Either way, it's over.
3. [p] stands up covered in mud (or audience). The camp is torn between sympathy and laughter. Chef scores low.

**Clutch:**
1. [p] gets on the rope and immediately wobbles. The crowd inhales sharply. This looks bad from step one.
2. Drops to one knee on the rope. Hangs there. The crowd thinks it's over — then [p] stands back up. Finishes the walk. Nails the dismount.
3. That knee-save was the most dramatic moment of the night. The camp erupts. Chef marks it way up.

### Daredevil Act — Extreme Yo-Yo
**Performance:**
1. [p] pulls out a yo-yo. The camp smirks. Then [p] starts spinning it at full speed. Nobody smirks anymore.
2. Around the world. Walk the dog. Cradle. Every trick flows into the next — a blur of string and precision.
3. Final trick — the yo-yo rockets out and snaps back into [pos] palm. Clean. The camp applauds the absurdity. Chef scores surprisingly high.

**Disaster:**
1. [p] pulls the yo-yo out. Confident. A few tricks should do it. The camp watches, amused.
2. The string wraps around [pos] neck. Then [pos] arm. [p] is being eaten by a yo-yo on stage. The tribe watches in horror.
3. Someone has to untangle [p]. The performance is officially a rescue operation. Chef gives a 1 for surviving.

**Clutch:**
1. [p] starts and it tangles immediately. The camp winces. This has "disaster" written all over it.
2. [p] whips the string free — and in the same motion launches into the hardest trick clean. The yo-yo becomes a weapon of precision.
3. From disaster to masterclass in three seconds. The camp is bewildered and impressed. Chef's spoon shoots up.

### Creative Act — Musical Instrument
**Performance:**
1. [p] picks up the instrument. Tunes it. The camp quiets down — they know what's coming.
2. Original composition. Every chord hits. The fire crackles in time. It's not loud — it doesn't need to be.
3. The last note fades. The camp sits with it for a moment. Then warm applause. Chef marks high.

**Disaster:**
1. [p] settles in and starts playing. The first few chords are promising.
2. String breaks. The twang echoes through camp. [p] tries to keep going — can't. Stops. Stares at the broken string.
3. [p] sets the instrument down and walks off in silence. The camp doesn't know what to say. Chef marks low.

**Clutch:**
1. [p] starts playing and it's rough. Missed notes. Wrong chords. The camp politely watches.
2. The string breaks — and [p] doesn't stop. Starts humming the melody. Finger-tapping the body as percussion. It becomes something new.
3. Haunting. The broken instrument made it better. The camp sits in stunned silence, then erupts. Chef's spoon climbs.

### Creative Act — Painting/Drawing
**Performance:**
1. [p] sets up an easel on stage. Canvas. Paints. The camp watches, curious. Two minutes on the clock.
2. Brush strokes. Fast, confident. The image takes shape — it's a portrait of the host. Every detail. The resemblance is uncanny.
3. [p] turns the canvas around. Gasps. Laughter. Chef sees himself rendered perfectly. Marks high while trying not to smile.

**Disaster:**
1. [p] sets up the easel. Two minutes. The crowd watches the brush move with confident strokes.
2. [p] turns the canvas. It looks like... a raccoon? Maybe? The host squints. The crowd squints harder.
3. [p] tries to explain the artistic vision. Nobody's buying it. Chef marks low with a visible wince.

**Clutch:**
1. [p] starts painting and the first strokes look random. Messy. The crowd exchanges concerned looks.
2. Nothing makes sense for 90 seconds. Then, in the last 30 — three decisive strokes bring the whole thing together. A face emerges.
3. The reveal gets gasps. Nobody saw it coming. Chef's spoon goes high. Art takes time, even when it doesn't look like it.

### Creative Act — Poetry Recital
**Performance:**
1. [p] walks to the mic. No paper. No notes. The camp quiets down. This is either brave or foolish.
2. Full poem. About the island. The game. The people sitting right there. Every line is specific. Painful. Real.
3. The last line lands like a punch. The camp is quiet — processing. Then deep, genuine applause. Chef marks high.

**Disaster:**
1. [p] pulls out a crumpled paper. Unfolds it. Begins reading without looking up.
2. Every word is monotone. The poem might be good on paper. On stage, it's a grocery list. A cricket actually chirps.
3. [p] finishes. Folds the paper. The applause is the kind that's worse than silence. Chef marks the minimum.

**Clutch:**
1. [p] starts reading from paper. It's flat. Rehearsed. The camp's attention is drifting.
2. [p] stops. Crumples the paper. Makes eye contact with someone in the front row. Starts over — from memory. Voice shaking.
3. The voice breaks on the last line. It's raw. Realer than anything written could be. The camp is stunned. Chef's spoon rises slow.

### Creative Act — Magic Show
**Performance:**
1. [p] walks out in a makeshift cape. The camp is skeptical. Magic at camp? Really?
2. A coin vanishes. A card appears behind someone's ear. For the finale — a full levitation illusion. The camp loses its mind.
3. The reveal bow. The camp gives the biggest reaction of the night. Chef scores high. Showmanship counts.

**Disaster:**
1. [p] comes out with a top hat and confidence. "Watch closely." The camp watches.
2. The coin doesn't vanish — it drops. The card was visible the whole time. The hidden dove escapes. Everything falls apart simultaneously.
3. [p] stands in the wreckage of [pos] act surrounded by escaped props. Chef marks a 1.

**Clutch:**
1. [p] starts the first trick and it fails. Badly. The hidden mechanism is visible. The camp groans.
2. [p] doesn't flinch. "That's what you THINK happened." Waves [pos] hand — the failed trick was the setup for a bigger one.
3. The camp buys it. The save was smoother than the trick. Chef marks high, genuinely fooled.

### Creative Act — Puppet Show
**Performance:**
1. [p] ducks behind a makeshift stage. A sock puppet appears. It starts talking. The camp laughs immediately.
2. Full show — voices, story, callbacks to actual camp drama. The puppet roasts specific people by name. The targets love it.
3. For the finale, the puppet takes a bow. Then [p] stands up and bows. Double applause. Chef marks high, entertained.

**Disaster:**
1. The puppet appears. [p] does a voice. It's... not great. But the effort is there.
2. The puppet's head falls off. Stuffing spills out. [p] tries to hold it together — literally. The seams keep splitting.
3. [p] emerges from behind the stage holding a pile of felt. The camp gives sympathy laughs. Chef marks low.

**Clutch:**
1. [p] starts the puppet show and the voice is rough. The puppet is barely holding together. The camp braces.
2. The head falls off. [p] pauses — then picks it up. "This is what happens when you cross me." Uses the severed head as a prop.
3. The improvisation kills. The camp laughs harder at the broken puppet than the working one. Chef's spoon shoots up.

### Creative Act — Rap/Freestyle
**Performance:**
1. [p] asks for a beat. Someone starts clapping. Another person taps a table. That's enough.
2. Eight bars. Then sixteen. Every line calls out real people, real events. The rhyme scheme holds. The flow is vicious.
3. [p] drops the last line and the camp erupts. Even the people who got roasted are applauding. Chef marks high.

**Disaster:**
1. [p] starts freestyling. The first bar is fine. The second reaches for a rhyme that isn't there.
2. Mumbles. Loses the beat. Tries to restart — the rhythm is gone. Stares at [pos] shoes. The clapping stops.
3. [p] walks off mid-verse. The camp is quiet. Chef marks the minimum.

**Clutch:**
1. [p] starts and the flow is off. Wrong tempo. The crowd's clapping slows down. This is going nowhere.
2. [p] stops. "Hold up." Restarts with a completely different flow — double-time, harder, sharper. Everything clicks.
3. By the last bar the camp is standing. Chef's spoon hits the top. That restart was the most confident thing anyone did all night.

## 3. Audition Drama Events

**Timing:** During auditions, after scores calculated. 1 event per tribe. Shown in Auditions VP as highlighted drama cards.

**Priority order (first match, max 1 per tribe):**

### Captain's Controversial Cut
- **Trigger:** Captain cuts someone within 0.5 of the 3rd pick's score
- **Effect:** -0.4 bond captain ↔ cut player
- **Text variants by cut player archetype:**
  - Hero/loyal: "[cut] stares at [captain]. 'You're cutting me? After what I did for this tribe?' The silence is brutal."
  - Villain/schemer: "[cut] smiles. Cold. 'Fine. Remember this when we're at tribal.' [captain] pretends not to hear."
  - Default: "[cut] takes it hard. Scored nearly as high as the people who made it. [captain]'s call. Not everyone agrees."

### Last Spot Fight
- **Trigger:** 3rd and 4th auditioners within 0.3 of each other
- **Effect:** -0.3 bond between the two
- **Text:** "[player3] and [player4] both know only one of them is getting on that stage. [player3] got it. [player4] hasn't stopped staring since."

### Diva Moment
- **Trigger:** Highest scorer has boldness >= 7 (narrative text selection)
- **Effect:** -0.2 bond with low-boldness tribemates
- **Text:** "[diva] scored highest and wants everyone to know it. 'I go first. I close the show. I AM the show.' Half the tribe rolls their eyes."

### Terrible Audition Roast
- **Trigger:** Lowest scorer has audition score < 2.0
- **Effect:** -0.1 bond from embarrassment
- **Text:** "[worst]'s audition was... something. [reactor] covers [pos] mouth trying not to laugh. 'Was that... on purpose?'"

### Confidence Boost
- **Trigger:** High social selected player + any cut player
- **Effect:** +0.3 bond between them
- **Text:** "[supporter] finds [cut] after the audition. 'Hey. You were good. This doesn't mean anything about you.' [cut] nods. Needed to hear that."

**Stored:** `ep.talentShow.auditionDrama[tribeName] = { type, players, text, bondChanges }`

## VP Changes

### Auditions Screen
- After each tribe's audition results, show the drama event card if one fired
- Drama cards have colored left-border (gold for positive, red for negative) + badge

### New Screen: "Backstage" (between Auditions and The Show)
- Click-to-reveal backstage events
- Each event: portraits + narrative text + badge (SPY MISSION / PEP TALK / SABOTAGE SETUP / RIVALRY / ACCIDENT / SECRET REHEARSAL)
- Casual feel (same as auditions screen, but with a "backstage" vibe — darker, conspiratorial)

### Show Screen
- Performance text now renders as 3 paragraphs with stagger animation
- Setup paragraph fades in first, Act second, Landing with the Chef-O-Meter

## Data Changes

- `ep.talentShow.backstageEvents[]` — array of backstage event objects
- `ep.talentShow.auditionDrama[tribeName]` — per-tribe drama event
- Talent pool: `performance`/`disaster`/`clutch` become 3-element arrays of functions
- Pre-rendered at simulation time as `performanceSetup`/`performanceAct`/`performanceLanding` (3 strings per outcome)
