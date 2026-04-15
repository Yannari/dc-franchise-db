// js/chal/talent-show.js
import { gs, players } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord } from '../players.js';

// ══════════════════════════════════════════════════════════════════════
// ENGINE: TALENT SHOW — talent pool (30 talents, 5 categories)
// ══════════════════════════════════════════════════════════════════════

const TALENT_POOL = {
  physical: [
    { id: 'gymnastics', name: 'Gymnastics Routine',
      audition: (p, pr) => `${p} nails a backflip in the dirt. The tribe watches, impressed.`,
      performance: [
        (p, pr) => `The lights hit as ${p} walks to center stage. ${pr.Sub} ${pr.sub === 'they' ? 'roll' : 'rolls'} ${pr.posAdj} shoulders back. The crowd leans forward.`,
        (p, pr) => `Backflip. Handspring. Aerial cartwheel. Every landing sticks. The stage shakes with each impact but ${p} doesn't flinch.`,
        (p, pr) => `Stuck landing. Arms up. The tribe erupts. Chef's eyebrows go up — and that's as close to impressed as he gets.`,
      ],
      disaster: [
        (p, pr) => `${p} bounces onto the stage full of energy. Too much energy. The first handspring is already off-center.`,
        (p, pr) => `The aerial goes sideways. ${p} lands on ${pr.posAdj} ankle wrong — buckles — crashes into the edge of the stage. Gasps from the crowd.`,
        (p, pr) => `${p} ${pr.sub === 'they' ? 'limp' : 'limps'} off. The tribe stares at the floor. Chef marks his spoon without looking up.`,
      ],
      clutch: [
        (p, pr) => `${p} steps out looking stiff. Nervous. The tribe can see ${pr.posAdj} hands shaking from the front row.`,
        (p, pr) => `The first flip wobbles. But the second is cleaner. By the third, something clicks — ${p} launches into a spinning aerial nobody knew ${pr.sub} could do.`,
        (p, pr) => `Stuck landing. Dead silence — then the camp goes ballistic. Chef's spoon climbs higher than anyone expected.`,
      ],
    },
    { id: 'martial-arts', name: 'Martial Arts Demo',
      audition: (p, pr) => `${p} throws kicks at the air with scary precision. Nobody claps ironically.`,
      performance: [
        (p, pr) => `${p} walks to center stage barefoot. No music. No props. Just ${pr.posAdj} body and whatever's about to happen.`,
        (p, pr) => `Three rapid kicks. A spinning roundhouse that whistles through the air. Then the board — CRACK. Clean break. Splinters scatter.`,
        (p, pr) => `${p} bows. The tribe is too stunned to clap immediately. Then it hits. Chef nods once — high praise from him.`,
      ],
      disaster: [
        (p, pr) => `${p} takes position. Deep breath. The crowd is watching. The board is waiting.`,
        (p, pr) => `The spinning kick clips nothing but air. ${p} slips. Falls flat. The board sits there, unbroken and mocking.`,
        (p, pr) => `Dead silence. Someone coughs. ${p} picks ${pr.posAdj}self up and walks off. Chef doesn't even pick up his spoon.`,
      ],
      clutch: [
        (p, pr) => `${p} looks uncertain stepping out. The tribe saw better at auditions. This doesn't look like the same person.`,
        (p, pr) => `The first kick is sloppy. But then — focus. The roundhouse snaps. The flying knee connects with the board mid-air and CRACKS it clean.`,
        (p, pr) => `The crowd goes from worried to screaming. ${p} didn't just recover — ${pr.sub} peaked. Chef leans back, impressed.`,
      ],
    },
    { id: 'strength', name: 'Strength Display',
      audition: (p, pr) => `${p} lifts a log over ${pr.posAdj} head. Simple. Effective.`,
      performance: [
        (p, pr) => `${p} walks out, grabs the canoe by one end. No warm-up. No speech. Just raw intent.`,
        (p, pr) => `One clean lift. The canoe goes overhead. Then ${p} lowers it, puts a person in it, and lifts again. The stage groans.`,
        (p, pr) => `The camp watches in silence — then pure noise. Chef marks high. That was primal.`,
      ],
      disaster: [
        (p, pr) => `${p} steps up to the canoe with total confidence. Grips it. Plants ${pr.posAdj} feet. Here we go.`,
        (p, pr) => `It doesn't budge. ${p} strains harder. Face turns red. Veins. Nothing. The canoe wins.`,
        (p, pr) => `${p} lets go and walks off. The tribe tries not to make eye contact. Chef marks a 1 and moves on.`,
      ],
      clutch: [
        (p, pr) => `${p} looks nervous at the weight. This looked easier at auditions. The camp can see the doubt.`,
        (p, pr) => `Straining — the canoe barely lifts — starts to tip — and then ${p} ROARS and slams it overhead. One brutal push.`,
        (p, pr) => `The camp loses it. ${p} didn't do it pretty. ${pr.Sub} did it angry. Chef's spoon jumps. That was real.`,
      ],
    },
    { id: 'parkour', name: 'Parkour Run',
      audition: (p, pr) => `${p} vaults over a bench, rolls, sticks the landing. Quick and clean.`,
      performance: [
        (p, pr) => `${p} sizes up the obstacle course. Cracks ${pr.posAdj} neck. The tribe watches from the bleachers.`,
        (p, pr) => `Wall flip — clean. Rail slide — smooth. Precision jump to the stage mark — perfect. Every move connected.`,
        (p, pr) => `${p} sticks the final landing, arms wide. The camp erupts. Chef's spoon fills fast.`,
      ],
      disaster: [
        (p, pr) => `${p} sprints toward the first wall with total commitment. The approach is good. The execution is not.`,
        (p, pr) => `Clips the rail. Eats dirt. Rolls sideways into the front row. A camper spills their drink.`,
        (p, pr) => `${p} sits in the dirt for a long moment before standing up. The camp is quiet out of mercy. Chef marks low.`,
      ],
      clutch: [
        (p, pr) => `${p} hesitates at the start line. Auditions went better. The tribe can feel the nerves.`,
        (p, pr) => `The wall flip is shaky. The rail slide — ${p} slips — but grabs it one-handed, swings underneath, and launches onto the stage mark.`,
        (p, pr) => `The save was better than the trick. The camp screams. Chef's spoon shoots up. Improvised excellence.`,
      ],
    },
    { id: 'wrestling', name: 'Wrestling Showcase',
      audition: (p, pr) => `${p} throws a dummy around like it insulted ${pr.obj}.`,
      performance: [
        (p, pr) => `${p} drags the training dummy to center stage. The dummy didn't agree to this.`,
        (p, pr) => `Suplex. Slam. The dummy goes airborne, crashes backstage. ${p} stands over the wreckage, breathing hard.`,
        (p, pr) => `Terrifying. The tribe claps because they're scared not to. Chef marks high — respect for violence.`,
      ],
      disaster: [
        (p, pr) => `${p} grabs the dummy with authority. This should be quick and impressive.`,
        (p, pr) => `The dummy's arm catches on ${pr.posAdj} shirt. What follows is two minutes of ${p} wrestling with fabric. The dummy appears to be winning.`,
        (p, pr) => `${p} gives up and walks off. The dummy stays on stage. Someone has to go retrieve it. Chef gives a 1.`,
      ],
      clutch: [
        (p, pr) => `${p} looks unsure approaching the dummy. The camp saw better at auditions. This feels like a different person.`,
        (p, pr) => `First grab slips. The dummy catches on something — ${p} rips it free with a sudden fury, launches it into the rafters.`,
        (p, pr) => `Accidental intensity. That wasn't skill — that was rage. And it worked. Chef marks it up. The camp cheers the chaos.`,
      ],
    },
    { id: 'endurance-hold', name: 'Endurance Hold',
      audition: (p, pr) => `${p} holds a handstand for two minutes straight during auditions. No wobble.`,
      performance: [
        (p, pr) => `${p} assumes the position — plank on the stage edge, objects balanced on ${pr.posAdj} back. No movement. No complaints.`,
        (p, pr) => `One minute. Two minutes. Objects stacked higher. The crowd counts along. ${p} doesn't shake. Doesn't breathe hard.`,
        (p, pr) => `When ${p} finally releases, the crowd roars. Pure discipline. Chef's spoon goes high for the sheer control.`,
      ],
      disaster: [
        (p, pr) => `${p} sets up the hold. Looks strong. Looks steady. The first 30 seconds are fine.`,
        (p, pr) => `Then the shake starts. Objects slide. ${p} tries to correct — crashes. Everything scatters. Someone in the front row catches a book.`,
        (p, pr) => `${p} lies face-down on stage for a moment. The tribe watches in painful silence. Chef marks the minimum.`,
      ],
      clutch: [
        (p, pr) => `${p} gets into position but the shake is there from the start. The tribe winces. This doesn't look good.`,
        (p, pr) => `Forty seconds. A minute. The shake gets worse — but ${p} locks in. Jaw clenched. Eyes closed. Holds. And holds. And holds.`,
        (p, pr) => `When time runs out, ${p} collapses to applause. That wasn't talent — that was willpower. Chef slow-claps with the spoon hand.`,
      ],
    },
  ],
  performanceArt: [
    { id: 'singing', name: 'Singing',
      audition: (p, pr) => `${p} hums a few bars. Voice is actually good. Tribe goes quiet.`,
      performance: [
        (p, pr) => `The stage goes quiet as ${p} steps into the spotlight. ${pr.Sub} ${pr.sub === 'they' ? 'close' : 'closes'} ${pr.posAdj} eyes. No backing track. No safety net.`,
        (p, pr) => `The first note lands clean. Then the second. By the chorus, the entire camp is still. Even Chef stops scowling.`,
        (p, pr) => `${p} finishes. Silence. Then the applause hits all at once. Chef raises his spoon.`,
      ],
      disaster: [
        (p, pr) => `${p} takes the mic. The confidence from auditions is there. ${pr.Sub} ${pr.sub === 'they' ? 'open' : 'opens'} ${pr.posAdj} mouth.`,
        (p, pr) => `The first note cracks. ${p} tries to push through — cracks again. The mic picks up ${pr.posAdj} breathing. ${pr.Sub} ${pr.sub === 'they' ? 'stop' : 'stops'} mid-verse.`,
        (p, pr) => `${p} walks offstage. Nobody claps. Chef doesn't even lift the spoon.`,
      ],
      clutch: [
        (p, pr) => `${p} steps up looking nervous. Hands shaking. The tribe holds its breath.`,
        (p, pr) => `The first note cracks — ${p} pauses. Swallows. Then belts the next one raw and perfect. The camp goes silent for a completely different reason.`,
        (p, pr) => `${p} finishes and the eruption is instant. Chef's spoon hits high before the applause dies down.`,
      ],
    },
    { id: 'comedy', name: 'Comedy Standup',
      audition: (p, pr) => `${p} tells one joke at audition. Gets a real laugh, not a pity one.`,
      performance: [
        (p, pr) => `${p} walks up, grabs an invisible mic. "So... I've been living in the woods with strangers for a week now." Beat. "It's going GREAT."`,
        (p, pr) => `Five minutes. Every joke lands. Callbacks to camp moments that everyone recognizes. The timing is surgical.`,
        (p, pr) => `The camp is crying laughing. Even Chef cracks a smile — then immediately hides it. The spoon goes high.`,
      ],
      disaster: [
        (p, pr) => `${p} takes the stage with a grin. "Hey everyone. So—" Silence already feels wrong.`,
        (p, pr) => `First joke. Nothing. Second joke. A cough from the back. ${p} starts sweating. The third attempt dies in ${pr.posAdj} throat.`,
        (p, pr) => `${p} mumbles "thanks" and walks off to no applause. Chef marks a 1. Someone whispers "that was rough."`,
      ],
      clutch: [
        (p, pr) => `${p} opens with a joke that goes nowhere. Then another. The crowd shifts uncomfortably. This is dying.`,
        (p, pr) => `${p} stops. Looks at the crowd. "Okay, this is going terrible. Let me try something." Pivots to raw self-deprecation. The crowd breaks.`,
        (p, pr) => `By the end they're howling. The comeback was better than any prepared set. Chef's spoon jumps. Redemption.`,
      ],
    },
    { id: 'monologue', name: 'Dramatic Monologue',
      audition: (p, pr) => `${p} delivers three lines from memory. The vibe shifts. Everyone leans in.`,
      performance: [
        (p, pr) => `${p} walks to center stage. No props. No music. Just eye contact with the front row. The camp quiets down fast.`,
        (p, pr) => `Full monologue. Every pause hits. ${p} builds to a crescendo that pins people to their seats. Someone in the back has tears.`,
        (p, pr) => `Silence. Then thunderous applause. Chef marks high without hesitation. That was real.`,
      ],
      disaster: [
        (p, pr) => `${p} steps out, takes a breath, and begins. The first two lines are fine. Then the eyes go blank.`,
        (p, pr) => `Forgot the lines. Freezes. Mouth opens, nothing comes out. ${p} mumbles something that might be the next verse.`,
        (p, pr) => `${p} walks offstage staring at the ground. The tribe watches in secondhand agony. Chef gives mercy points.`,
      ],
      clutch: [
        (p, pr) => `${p} starts uncertain. The lines feel rehearsed. Flat. The camp's attention starts drifting.`,
        (p, pr) => `Then ${p} drops the script. Makes eye contact. Improvises from somewhere real. The words aren't written — they're lived.`,
        (p, pr) => `The camp is frozen. That wasn't an act. Chef's spoon rises slowly, like he's not sure what he just witnessed.`,
      ],
    },
    { id: 'dance', name: 'Dance Routine',
      audition: (p, pr) => `Quick choreo. Nothing fancy. But the rhythm is there and the confidence sells it.`,
      performance: [
        (p, pr) => `${p} waits for the imaginary beat to start. When it hits, ${pr.sub} ${pr.sub === 'they' ? 'move' : 'moves'}. The camp didn't know ${pr.sub} could move like that.`,
        (p, pr) => `Full choreographed routine. Uses the whole stage. Every beat lands. The rhythm is infectious — people start bobbing along.`,
        (p, pr) => `Final pose. Breathing hard but smiling. The tribe roars. Chef gives a solid score.`,
      ],
      disaster: [
        (p, pr) => `${p} starts strong. The first eight counts are smooth. The crowd is into it.`,
        (p, pr) => `Then ${p} steps on ${pr.posAdj} own foot. Stumbles. Tries to style it out — makes it worse. The rhythm is gone.`,
        (p, pr) => `${p} finishes awkwardly, half a beat off from the music in ${pr.posAdj} head. The clapping is polite at best. Chef shrugs.`,
      ],
      clutch: [
        (p, pr) => `${p} looks stiff walking out. The audition energy isn't there. The tribe braces for mediocre.`,
        (p, pr) => `First few moves are rough — then the beat takes over. ${p} stumbles into a slide that looks completely intentional. The crowd buys it.`,
        (p, pr) => `By the end ${pr.sub === 'they' ? "they're" : `${pr.sub}'s`} freestyling and the camp is clapping along. Chef gives it more than anyone expected.`,
      ],
    },
    { id: 'impressions', name: 'Impressions',
      audition: (p, pr) => `${p} does the host. It's uncanny. Even the host laughs.`,
      performance: [
        (p, pr) => `${p} walks out and immediately becomes someone else. The posture changes. The voice changes. The camp starts grinning.`,
        (p, pr) => `Five impressions back to back — the host, Chef, three campers. Each one is devastating. People are pointing and dying.`,
        (p, pr) => `The final impression nails someone in the front row. The camp loses it. Chef scores high while trying not to laugh.`,
      ],
      disaster: [
        (p, pr) => `${p} steps out confident. "Okay, you're gonna love this." Does the host's voice. It sounds nothing like the host.`,
        (p, pr) => `Tries Chef next. Even worse. The crowd isn't laughing with ${p}. Tries a tribemate — the tribemate's face says everything.`,
        (p, pr) => `${p} retreats to silence. Chef marks low. The real host whispers, "I don't sound like that."`,
      ],
      clutch: [
        (p, pr) => `${p} opens with two impressions that land flat. The crowd isn't connecting. This is going south.`,
        (p, pr) => `Last attempt — the host. ${p} nails it so perfectly that the host does a double-take. The camp ERUPTS.`,
        (p, pr) => `One good impression saved the whole set. Chef breaks character laughing and marks the spoon high.`,
      ],
    },
    { id: 'spoken-word', name: 'Spoken Word',
      audition: (p, pr) => `${p} recites something original. Short. Intense. The fire crackles louder.`,
      performance: [
        (p, pr) => `${p} steps up to the mic. No paper. No notes. Just ${p} and the fire crackling behind the stage.`,
        (p, pr) => `Full piece. Raw. Personal. About the island, the game, the people sitting right there. You can hear the silence between the words.`,
        (p, pr) => `When ${p} finishes, the camp doesn't clap immediately. They're processing. Then it comes — deep, real. Chef respects it.`,
      ],
      disaster: [
        (p, pr) => `${p} pulls out a crumpled paper. Smooths it against ${pr.posAdj} leg. Begins reading.`,
        (p, pr) => `Monotone. Every word lands flat. ${p} reads from the page without looking up. The connection isn't there. A cricket chirps.`,
        (p, pr) => `${p} finishes reading and folds the paper up. The polite clap is almost worse than silence. Chef marks low.`,
      ],
      clutch: [
        (p, pr) => `${p} starts from the paper, voice shaking. The words sound rehearsed and hollow. The camp is drifting.`,
        (p, pr) => `${p} stops. Puts the paper down. Makes eye contact with someone in the front row. Starts over — from memory, from the gut.`,
        (p, pr) => `Voice breaks on the last line. It's realer than anything prepared could be. The camp sits in stunned silence. Chef's spoon climbs.`,
      ],
    },
  ],
  skill: [
    { id: 'beatboxing', name: 'Beatboxing',
      audition: (p, pr) => `${p} drops a beat. It's actually complex. People start nodding.`,
      performance: [
        (p, pr) => `${p} leans into the mic. Tests it with a pop. The camp goes quiet, curious.`,
        (p, pr) => `Bass drop. Snare roll. Then layers — vocal scratch, melody, all at once. The sound shouldn't be possible from one person.`,
        (p, pr) => `${p} finishes with a final bass hit and the camp erupts. Chef's head was bobbing. He tries to pretend it wasn't. High marks.`,
      ],
      disaster: [
        (p, pr) => `${p} steps up to the mic. Breathes in. The first beat starts strong.`,
        (p, pr) => `Tries to speed up — chokes on ${pr.posAdj} own spit. Coughs into the mic. The speakers feed it back. Awful.`,
        (p, pr) => `${p} waves it off and walks backstage. The camp cringes. Chef marks bottom of the spoon.`,
      ],
      clutch: [
        (p, pr) => `${p} starts with a basic beat. Nothing special. The crowd's energy is flat. This isn't what auditions promised.`,
        (p, pr) => `Then the layers start. One by one. Bass, hi-hat, melody, harmony — building until it sounds like a full band.`,
        (p, pr) => `By the end, nobody can believe it's one person. The camp is on their feet. Chef's spoon hits the ceiling.`,
      ],
    },
    { id: 'card-tricks', name: 'Card Tricks',
      audition: (p, pr) => `${p} fans the deck. Pulls the right card. Clean. No fumbles.`,
      performance: [
        (p, pr) => `${p} fans a deck of cards and walks to the front row. "Pick a card." The camp leans in.`,
        (p, pr) => `The card vanishes. Reappears in someone's pocket. Then in Chef's hat. The moves are invisible — pure sleight of hand.`,
        (p, pr) => `For the finale, the entire deck rearranges itself mid-air. Gasps. Then applause. Chef scores high.`,
      ],
      disaster: [
        (p, pr) => `${p} pulls out the deck with a flourish. "Watch closely." The camp watches.`,
        (p, pr) => `Fumbles the fan. Drops the deck. Cards scatter everywhere. The hidden card falls out of ${pr.posAdj} sleeve. The trick is completely exposed.`,
        (p, pr) => `${p} picks up the cards in silence while the camp watches. Chef doesn't even bother scoring high enough for it to matter.`,
      ],
      clutch: [
        (p, pr) => `${p} starts the routine and it's rough. A card sticks. Another one bends wrong. The crowd sees the mechanics.`,
        (p, pr) => `On the final trick — drops everything. Reaches down. Catches a single card mid-air. Flips it. It's their card.`,
        (p, pr) => `The recovery is better than the trick would have been. The camp explodes. Chef marks it way up.`,
      ],
    },
    { id: 'speed-solve', name: 'Speed-Solving',
      audition: (p, pr) => `${p} solves a puzzle in 40 seconds at audition. Tribe times it.`,
      performance: [
        (p, pr) => `${p} sets three puzzles on a table. Cracks ${pr.posAdj} knuckles. The camp watches, skeptical.`,
        (p, pr) => `Hands blur. First puzzle done. Second puzzle done. For the third — ${p} puts on a blindfold. Solves it by feel. Under a minute.`,
        (p, pr) => `The camp is speechless. That wasn't a performance — that was a brain on display. Chef gives top marks.`,
      ],
      disaster: [
        (p, pr) => `${p} starts the puzzle with practiced confidence. The first moves are quick. This should be easy.`,
        (p, pr) => `Then ${p} freezes. Wrong piece. Backtracks. Wrong again. The clock is running and the crowd is watching the panic.`,
        (p, pr) => `Time runs out with one piece missing. ${p} stares at the puzzle. The camp stares at ${p}. Chef marks barely above zero.`,
      ],
      clutch: [
        (p, pr) => `${p} starts slow. Too slow. The crowd can see ${pr.sub === 'they' ? "they're" : `${pr.sub}'s`} overthinking every move. This might be a train wreck.`,
        (p, pr) => `Stuck on the last section. Ten seconds of nothing. Then ${p} closes ${pr.posAdj} eyes — and the hands move on their own. Click. Click. Done.`,
        (p, pr) => `Under a minute. The camp goes from worried to screaming. Chef's spoon jumps. That was dramatic.`,
      ],
    },
    { id: 'fire-staff', name: 'Fire Staff',
      audition: (p, pr) => `${p} spins a lit staff with precision. Controlled. Mesmerizing.`,
      performance: [
        (p, pr) => `The stage lights dim. ${p} steps out with a lit staff. The fire paints shadows on the curtain.`,
        (p, pr) => `Spins. Tosses. Catches behind the back. The fire traces arcs in the dark — controlled chaos. The camp is mesmerized.`,
        (p, pr) => `Final toss — high — spinning — caught clean. The camp exhales and erupts. Chef scores high in the glow.`,
      ],
      disaster: [
        (p, pr) => `${p} steps out with the lit staff. Spins it once — looks good. The camp holds its breath.`,
        (p, pr) => `The staff slips. Fire hits the ground. Someone stomps on it. Smoke billows. Someone shouts for water.`,
        (p, pr) => `The stage smells like burned grass. ${p} stands in the smoke, defeated. Chef gives a sympathy score.`,
      ],
      clutch: [
        (p, pr) => `${p} grips the staff too tight. The first spin is awkward. The flame wobbles. The camp winces.`,
        (p, pr) => `Deep breath — tosses high. Catches blind behind the back. The fire traces a perfect arc in the darkness.`,
        (p, pr) => `One move saved everything. The camp gasps, then roars. Chef's spoon goes higher than anyone expected.`,
      ],
    },
    { id: 'knife-throwing', name: 'Knife Throwing',
      audition: (p, pr) => `${p} plants three knives in a target. Thunk thunk thunk. Clean grouping.`,
      performance: [
        (p, pr) => `${p} faces the target. Three knives in hand. The camp goes dead quiet. Nobody blinks.`,
        (p, pr) => `Thunk. Thunk. Thunk. Three knives, tight grouping, center mass. Then the blindfold goes on. One more throw. Bullseye.`,
        (p, pr) => `The camp erupts. Chef marks high — the blindfold throw sold it.`,
      ],
      disaster: [
        (p, pr) => `${p} takes aim. The camp holds its breath. The first knife flies.`,
        (p, pr) => `It misses the target. Sticks in the stage floor. The second goes wide — lodges in a support beam. The crowd ducks.`,
        (p, pr) => `${p} puts the last knife down. Walks off. Smart move. Chef marks the minimum.`,
      ],
      clutch: [
        (p, pr) => `${p} looks shaky taking aim. First throw — off center. Second — barely hits the board. The crowd is nervous.`,
        (p, pr) => `Last throw. ${p} exhales. The knife leaves ${pr.posAdj} hand and curves — somehow — right into the bullseye.`,
        (p, pr) => `Nobody knows how that last one hit. Least of all ${p}. The camp screams. Chef's spoon jumps on the drama alone.`,
      ],
    },
    { id: 'rubiks', name: "Rubik's Cube Solve",
      audition: (p, pr) => `Sub-minute solve during audition. ${pr.PosAdj} hands blurring.`,
      performance: [
        (p, pr) => `${p} holds up two cubes. One in each hand. The camp starts counting along.`,
        (p, pr) => `Both hands move simultaneously — different patterns, different solutions. The crowd loses track trying to follow. It's inhuman.`,
        (p, pr) => `Click. Click. Both done. Under a minute. The camp counts the time and explodes. Chef gives full marks.`,
      ],
      disaster: [
        (p, pr) => `${p} holds up the cube. Starts turning. The first moves look practiced and confident.`,
        (p, pr) => `Then ${p} freezes. Turns one way. Back. The other way. The cube isn't cooperating. The seconds stretch out unbearably.`,
        (p, pr) => `Time runs out. The cube is half-solved. ${p} stares at it like it betrayed ${pr.obj}. Chef marks the bottom.`,
      ],
      clutch: [
        (p, pr) => `${p} starts solving and it's slow. Way slower than auditions. The crowd can see ${pr.sub === 'they' ? "they're" : `${pr.sub}'s`} second-guessing.`,
        (p, pr) => `Frozen for ten seconds. The camp thinks it's over. Then — a burst of rapid moves. Both hands flying.`,
        (p, pr) => `Click. Done. Just under the wire. The camp goes from funeral to frenzy. Chef marks it up high.`,
      ],
    },
  ],
  daredevil: [
    { id: 'fire-eating', name: 'Fire-Eating',
      audition: (p, pr) => `${p} breathes a small flame at audition. Controlled. Eyebrows intact.`,
      performance: [
        (p, pr) => `${p} steps out with a torch. The camp goes silent. The flame reflects in everyone's eyes.`,
        (p, pr) => `Deep breath — and the arc of flame lights up the entire stage. Then another, bigger. The heat reaches the front row.`,
        (p, pr) => `${p} extinguishes the torch with ${pr.posAdj} tongue. Bows. The camp erupts. Chef marks high for sheer guts.`,
      ],
      disaster: [
        (p, pr) => `${p} brings the torch to ${pr.posAdj} lips. Confident. The camp leans forward.`,
        (p, pr) => `The flame sputters — then licks ${pr.posAdj} face. ${p} recoils. Coughs smoke. The medic starts jogging over.`,
        (p, pr) => `${p} waves off the medic but the damage is done. Singed eyebrows and shattered confidence. Chef gives mercy points.`,
      ],
      clutch: [
        (p, pr) => `${p} lights the torch and hesitates. The flame looks bigger up close than it did at auditions. The camp can see the doubt.`,
        (p, pr) => `First attempt — the flame sputters weakly. Then ${p} commits. Full breath. The arc ROARS — biggest of the night.`,
        (p, pr) => `The camp screams. That wasn't technique — that was someone overcoming fear in real time. Chef's spoon flies up.`,
      ],
    },
    { id: 'knife-juggling', name: 'Knife Juggling',
      audition: (p, pr) => `${p} juggles two knives casually. No fear.`,
      performance: [
        (p, pr) => `${p} tosses one knife up. Catches it. Two. Three. The camp counts along.`,
        (p, pr) => `Four knives now. The pattern is hypnotic. ${p} adds a fifth — catches it between ${pr.posAdj} fingers without looking.`,
        (p, pr) => `All five land safely. The camp breathes again and applauds. Chef scores high for the controlled danger.`,
      ],
      disaster: [
        (p, pr) => `${p} starts with three knives. Clean pattern. Looking good. The crowd relaxes.`,
        (p, pr) => `The fourth knife wobbles — drops — sticks in the stage an inch from ${pr.posAdj} foot. The crowd gasps for all the wrong reasons.`,
        (p, pr) => `${p} backs away from the knife in the floor. The camp is white-knuckled. Chef gives a low score and a concerned look.`,
      ],
      clutch: [
        (p, pr) => `${p} starts juggling and it's shaky. A wobble on the second knife. The crowd tenses.`,
        (p, pr) => `The third knife fumbles — ${p} kicks it up with ${pr.posAdj} foot, catches it mid-air, and adds it back to the rotation without breaking rhythm.`,
        (p, pr) => `The save was more impressive than a clean run would have been. The camp goes wild. Chef marks it up.`,
      ],
    },
    { id: 'high-dive', name: 'High Dive',
      audition: (p, pr) => `${p} jumps off a tall stump into water. Clean entry.`,
      performance: [
        (p, pr) => `${p} climbs to the highest point at camp. Looks down. The camp looks up. It's far.`,
        (p, pr) => `Perfect form. Flip. Twist. The entry is clean — barely a splash. The lake doesn't even flinch.`,
        (p, pr) => `${p} surfaces to screaming. Chef scores high. That was textbook.`,
      ],
      disaster: [
        (p, pr) => `${p} stands at the top. Looks down. The crowd can see the resolve forming. ${pr.Sub} ${pr.sub === 'they' ? 'jump' : 'jumps'}.`,
        (p, pr) => `Over-rotates. The belly flop echoes across camp. The splash is enormous. The sound is worse.`,
        (p, pr) => `${p} surfaces to silence and sympathy. Chef marks low. The lake got the best performance.`,
      ],
      clutch: [
        (p, pr) => `${p} hesitates at the top. The crowd waits. The height seems to grow the longer ${pr.sub} ${pr.sub === 'they' ? 'stand' : 'stands'} there.`,
        (p, pr) => `${p} jumps — over-rotates — but somehow adjusts mid-air. The entry isn't pretty but it's clean enough.`,
        (p, pr) => `Surfaces to huge cheers. The crowd saw the save happen in real-time. Chef marks it up for the drama.`,
      ],
    },
    { id: 'eating-challenge', name: 'Eating Challenge',
      audition: (p, pr) => `${p} eats something terrible without flinching. Audition complete.`,
      performance: [
        (p, pr) => `The table is set. Hot sauce. Bugs. Mystery meat. Things that shouldn't be eaten. ${p} sits down and cracks ${pr.posAdj} knuckles.`,
        (p, pr) => `One by one. No hesitation. No face. The hot sauce goes down smooth. The bug crunches. The mystery meat disappears. ${p} doesn't even water up.`,
        (p, pr) => `${p} wipes ${pr.posAdj} mouth, stands, and takes a bow. The camp is horrified and impressed in equal measure. Chef scores high.`,
      ],
      disaster: [
        (p, pr) => `${p} looks at the table. Picks up the first item. Takes a bite. So far so good.`,
        (p, pr) => `The second item hits different. ${p} gags. Tries to swallow. Gags again. Runs offstage. Sounds of regret echo from backstage.`,
        (p, pr) => `The table sits there, mostly unconquered. The camp tries not to laugh. Chef marks the minimum.`,
      ],
      clutch: [
        (p, pr) => `${p} stares at the items on the table. The confidence from auditions is nowhere to be found. ${pr.PosAdj} face says "what did I sign up for."`,
        (p, pr) => `First item — almost quits. Second item — on the verge. Then something snaps. ${p} eats the rest without stopping. Asks for more.`,
        (p, pr) => `The camp goes from pity to pandemonium. Chef marks it up high. That was willpower, not talent — and somehow that's better.`,
      ],
    },
    { id: 'balance-walk', name: 'Balance Walk',
      audition: (p, pr) => `${p} walks a narrow beam without wobbling. Casual.`,
      performance: [
        (p, pr) => `The tightrope stretches over the campfire. ${p} puts one foot on it. The crowd holds its breath.`,
        (p, pr) => `Step by step. No wobble. For the last third, ${p} puts on a blindfold. The crowd gasps. The steps don't change.`,
        (p, pr) => `${p} reaches the end. Removes the blindfold. Steps down to thunderous applause. Chef's spoon goes high.`,
      ],
      disaster: [
        (p, pr) => `${p} gets on the rope. First few steps are solid. The crowd starts to relax.`,
        (p, pr) => `Then the wobble. ${p} overcorrects — and falls. Into the mud. Or worse, into the audience. Either way, it's over.`,
        (p, pr) => `${p} stands up covered in mud (or audience). The camp is torn between sympathy and laughter. Chef scores low.`,
      ],
      clutch: [
        (p, pr) => `${p} gets on the rope and immediately wobbles. The crowd inhales sharply. This looks bad from step one.`,
        (p, pr) => `Drops to one knee on the rope. Hangs there. The crowd thinks it's over — then ${p} stands back up. Finishes the walk. Nails the dismount.`,
        (p, pr) => `That knee-save was the most dramatic moment of the night. The camp erupts. Chef marks it way up.`,
      ],
    },
    { id: 'extreme-yoyo', name: 'Extreme Yo-Yo',
      audition: (p, pr) => `${p} does a few tricks. One goes wrong, string tangles, recovers fast.`,
      performance: [
        (p, pr) => `${p} pulls out a yo-yo. The camp smirks. Then ${p} starts spinning it at full speed. Nobody smirks anymore.`,
        (p, pr) => `Around the world. Walk the dog. Cradle. Every trick flows into the next — a blur of string and precision.`,
        (p, pr) => `Final trick — the yo-yo rockets out and snaps back into ${pr.posAdj} palm. Clean. The camp applauds the absurdity. Chef scores surprisingly high.`,
      ],
      disaster: [
        (p, pr) => `${p} pulls the yo-yo out. Confident. A few tricks should do it. The camp watches, amused.`,
        (p, pr) => `The string wraps around ${pr.posAdj} neck. Then ${pr.posAdj} arm. ${p} is being eaten by a yo-yo on stage. The tribe watches in horror.`,
        (p, pr) => `Someone has to untangle ${p}. The performance is officially a rescue operation. Chef gives a 1 for surviving.`,
      ],
      clutch: [
        (p, pr) => `${p} starts and it tangles immediately. The camp winces. This has "disaster" written all over it.`,
        (p, pr) => `${p} whips the string free — and in the same motion launches into the hardest trick clean. The yo-yo becomes a weapon of precision.`,
        (p, pr) => `From disaster to masterclass in three seconds. The camp is bewildered and impressed. Chef's spoon shoots up.`,
      ],
    },
  ],
  creative: [
    { id: 'instrument', name: 'Musical Instrument',
      audition: (p, pr) => `${p} plays a few chords. Melody is there. Tribe goes quiet for the right reasons.`,
      performance: [
        (p, pr) => `${p} picks up the instrument. Tunes it. The camp quiets down — they know what's coming.`,
        (p, pr) => `Original composition. Every chord hits. The fire crackles in time. It's not loud — it doesn't need to be.`,
        (p, pr) => `The last note fades. The camp sits with it for a moment. Then warm applause. Chef marks high.`,
      ],
      disaster: [
        (p, pr) => `${p} settles in and starts playing. The first few chords are promising.`,
        (p, pr) => `String breaks. The twang echoes through camp. ${p} tries to keep going — can't. Stops. Stares at the broken string.`,
        (p, pr) => `${p} sets the instrument down and walks off in silence. The camp doesn't know what to say. Chef marks low.`,
      ],
      clutch: [
        (p, pr) => `${p} starts playing and it's rough. Missed notes. Wrong chords. The camp politely watches.`,
        (p, pr) => `The string breaks — and ${p} doesn't stop. Starts humming the melody. Finger-tapping the body as percussion. It becomes something new.`,
        (p, pr) => `Haunting. The broken instrument made it better. The camp sits in stunned silence, then erupts. Chef's spoon climbs.`,
      ],
    },
    { id: 'painting', name: 'Painting/Drawing',
      audition: (p, pr) => `${p} sketches a portrait in two minutes. It's actually good.`,
      performance: [
        (p, pr) => `${p} sets up an easel on stage. Canvas. Paints. The camp watches, curious. Two minutes on the clock.`,
        (p, pr) => `Brush strokes. Fast, confident. The image takes shape — it's a portrait of the host. Every detail. The resemblance is uncanny.`,
        (p, pr) => `${p} turns the canvas around. Gasps. Laughter. Chef sees himself rendered perfectly. Marks high while trying not to smile.`,
      ],
      disaster: [
        (p, pr) => `${p} sets up the easel. Two minutes. The crowd watches the brush move with confident strokes.`,
        (p, pr) => `${p} turns the canvas. It looks like... a raccoon? Maybe? The host squints. The crowd squints harder.`,
        (p, pr) => `${p} tries to explain the artistic vision. Nobody's buying it. Chef marks low with a visible wince.`,
      ],
      clutch: [
        (p, pr) => `${p} starts painting and the first strokes look random. Messy. The crowd exchanges concerned looks.`,
        (p, pr) => `Nothing makes sense for 90 seconds. Then, in the last 30 — three decisive strokes bring the whole thing together. A face emerges.`,
        (p, pr) => `The reveal gets gasps. Nobody saw it coming. Chef's spoon goes high. Art takes time, even when it doesn't look like it.`,
      ],
    },
    { id: 'poetry', name: 'Poetry Recital',
      audition: (p, pr) => `${p} reads an original poem. Short. Three lines. They land.`,
      performance: [
        (p, pr) => `${p} walks to the mic. No paper. No notes. The camp quiets down. This is either brave or foolish.`,
        (p, pr) => `Full poem. About the island. The game. The people sitting right there. Every line is specific. Painful. Real.`,
        (p, pr) => `The last line lands like a punch. The camp is quiet — processing. Then deep, genuine applause. Chef marks high.`,
      ],
      disaster: [
        (p, pr) => `${p} pulls out a crumpled paper. Unfolds it. Begins reading without looking up.`,
        (p, pr) => `Every word is monotone. The poem might be good on paper. On stage, it's a grocery list. A cricket actually chirps.`,
        (p, pr) => `${p} finishes. Folds the paper. The applause is the kind that's worse than silence. Chef marks the minimum.`,
      ],
      clutch: [
        (p, pr) => `${p} starts reading from paper. It's flat. Rehearsed. The camp's attention is drifting.`,
        (p, pr) => `${p} stops. Crumples the paper. Makes eye contact with someone in the front row. Starts over — from memory. Voice shaking.`,
        (p, pr) => `The voice breaks on the last line. It's raw. Realer than anything written could be. The camp is stunned. Chef's spoon rises slow.`,
      ],
    },
    { id: 'magic', name: 'Magic Show',
      audition: (p, pr) => `One trick at audition. Clean vanish. Crowd leans in.`,
      performance: [
        (p, pr) => `${p} walks out in a makeshift cape. The camp is skeptical. Magic at camp? Really?`,
        (p, pr) => `A coin vanishes. A card appears behind someone's ear. For the finale — a full levitation illusion. The camp loses its mind.`,
        (p, pr) => `The reveal bow. The camp gives the biggest reaction of the night. Chef scores high. Showmanship counts.`,
      ],
      disaster: [
        (p, pr) => `${p} comes out with a top hat and confidence. "Watch closely." The camp watches.`,
        (p, pr) => `The coin doesn't vanish — it drops. The card was visible the whole time. The hidden dove escapes. Everything falls apart simultaneously.`,
        (p, pr) => `${p} stands in the wreckage of ${pr.posAdj} act surrounded by escaped props. Chef marks a 1.`,
      ],
      clutch: [
        (p, pr) => `${p} starts the first trick and it fails. Badly. The hidden mechanism is visible. The camp groans.`,
        (p, pr) => `${p} doesn't flinch. "That's what you THINK happened." Waves ${pr.posAdj} hand — the failed trick was the setup for a bigger one.`,
        (p, pr) => `The camp buys it. The save was smoother than the trick. Chef marks high, genuinely fooled.`,
      ],
    },
    { id: 'puppet-show', name: 'Puppet Show',
      audition: (p, pr) => `Quick bit with a sock puppet. Gets a laugh.`,
      performance: [
        (p, pr) => `${p} ducks behind a makeshift stage. A sock puppet appears. It starts talking. The camp laughs immediately.`,
        (p, pr) => `Full show — voices, story, callbacks to actual camp drama. The puppet roasts specific people by name. The targets love it.`,
        (p, pr) => `For the finale, the puppet takes a bow. Then ${p} stands up and bows. Double applause. Chef marks high, entertained.`,
      ],
      disaster: [
        (p, pr) => `The puppet appears. ${p} does a voice. It's... not great. But the effort is there.`,
        (p, pr) => `The puppet's head falls off. Stuffing spills out. ${p} tries to hold it together — literally. The seams keep splitting.`,
        (p, pr) => `${p} emerges from behind the stage holding a pile of felt. The camp gives sympathy laughs. Chef marks low.`,
      ],
      clutch: [
        (p, pr) => `${p} starts the puppet show and the voice is rough. The puppet is barely holding together. The camp braces.`,
        (p, pr) => `The head falls off. ${p} pauses — then picks it up. "This is what happens when you cross me." Uses the severed head as a prop.`,
        (p, pr) => `The improvisation kills. The camp laughs harder at the broken puppet than the working one. Chef's spoon shoots up.`,
      ],
    },
    { id: 'freestyle', name: 'Rap/Freestyle',
      audition: (p, pr) => `${p} spits 8 bars about camp life. Flow is there. Words are sharp.`,
      performance: [
        (p, pr) => `${p} asks for a beat. Someone starts clapping. Another person taps a table. That's enough.`,
        (p, pr) => `Eight bars. Then sixteen. Every line calls out real people, real events. The rhyme scheme holds. The flow is vicious.`,
        (p, pr) => `${p} drops the last line and the camp erupts. Even the people who got roasted are applauding. Chef marks high.`,
      ],
      disaster: [
        (p, pr) => `${p} starts freestyling. The first bar is fine. The second reaches for a rhyme that isn't there.`,
        (p, pr) => `Mumbles. Loses the beat. Tries to restart — the rhythm is gone. Stares at ${pr.posAdj} shoes. The clapping stops.`,
        (p, pr) => `${p} walks off mid-verse. The camp is quiet. Chef marks the minimum.`,
      ],
      clutch: [
        (p, pr) => `${p} starts and the flow is off. Wrong tempo. The crowd's clapping slows down. This is going nowhere.`,
        (p, pr) => `${p} stops. "Hold up." Restarts with a completely different flow — double-time, harder, sharper. Everything clicks.`,
        (p, pr) => `By the last bar the camp is standing. Chef's spoon hits the top. That restart was the most confident thing anyone did all night.`,
      ],
    },
  ],
};

const TALENT_CATEGORIES = [
  { id: 'physical', stats: ['physical', 'endurance'] },
  { id: 'performanceArt', stats: ['social', 'boldness'] },
  { id: 'skill', stats: ['mental', 'intuition'] },
  { id: 'daredevil', stats: ['boldness', 'physical'] },
  { id: 'creative', stats: ['mental', 'social'] },
];

const SABOTAGE_TYPES = [
  { id: 'props', effect: 'disaster', // target uses disaster text — props are broken
    text: (saboteur, target, pr) => `Before the show, ${saboteur} got backstage access to ${target}'s setup. Wrong strings on the guitar. Marked cards. Loosened joints. When ${target} reaches for ${pr.posAdj} props on stage, nothing works right.`,
    stageText: (saboteur, target, pr) => `${target} reaches for ${pr.pos} equipment — something's wrong. The strings are off. The props don't fit. ${pr.Sub} ${pr.sub === 'they' ? 'try' : 'tries'} to adapt, but the whole act falls apart.`,
  },
  { id: 'rumors', effect: 'penalty', penalty: -2, // crowd hostile, Chef scores harsher
    text: (saboteur, target, pr) => `${saboteur} spent the afternoon whispering to anyone who'd listen: "${target} is going to throw the challenge." By showtime, the crowd's arms are crossed before ${target} even walks on.`,
    stageText: (saboteur, target, pr) => `${target} feels it from the first step. The crowd is cold. Every move gets judged harder. Even a good performance can't cut through the hostility ${saboteur} planted.`,
  },
  { id: 'psych', effect: 'tempDebuff', debuff: -3, // massive temperament drop → higher disaster chance
    text: (saboteur, target, pr) => `${saboteur} catches ${target} alone right before ${pr.sub} ${pr.sub === 'they' ? 'go' : 'goes'} on. Whispers something. ${target}'s face changes. Whatever ${saboteur} said, it landed.`,
    stageText: (saboteur, target, pr) => `${target} walks on stage but ${pr.sub} ${pr.sub === 'they' ? 'aren\'t' : 'isn\'t'} all there. The confidence from rehearsal is gone. ${pr.PosAdj} hands are shaking.`,
  },
  { id: 'replace', effect: 'selfScore0', // saboteur scores 0 on OWN act, but target gets massive temp debuff
    text: (saboteur, target, pr) => `${saboteur} doesn't perform ${pr.pos} talent. Instead, ${pr.sub} ${pr.sub === 'they' ? 'use' : 'uses'} ${pr.pos} stage time to publicly call out ${target}. Secrets. Accusations. The camp goes dead silent.`,
    stageText: (saboteur, target, pr) => `${saboteur} walks to center stage. No props. No act. Just a mic and a grudge. "${target}. Let's talk about what you really are." What follows is three minutes of calculated demolition. ${target} watches from the crowd, frozen.`,
  },
];

const AUDIENCE_REACTIONS = {
  high: {
    hero: p => `${p}: "That's my tribe right there. That's what we do."`,
    loyal: p => `${p}: "That's my tribe right there."`,
    villain: p => `${p} slow-claps. Calculating. Already thinking about how to use this.`,
    schemer: p => `${p} slow-claps. Filing it away.`,
    floater: p => `${p} claps along. Relieved someone else carried the weight.`,
    showmancer: p => `${p} locks eyes with the performer. That was attractive.`,
    wildcard: p => `${p} loses it. Standing on the bench screaming.`,
    'chaos-agent': p => `${p} loses it. Standing on the bench screaming.`,
    mastermind: p => `${p} nods. That just bought the tribe safety. Good.`,
    _default: p => `${p} nods approvingly.`,
  },
  mid: {
    hero: p => `${p}: "Good effort." Means it, kind of.`,
    villain: p => `${p} is unimpressed. Expected more.`,
    floater: p => `${p} claps at the same speed as everyone else.`,
    mastermind: p => `${p}: "We need the next act to be better."`,
    _default: p => `${p} gives a polite clap.`,
  },
  low: {
    hero: p => `${p} looks away. Doesn't pile on. But the disappointment is visible.`,
    loyal: p => `${p} looks away. The disappointment is visible.`,
    villain: p => `${p} smirks. Files it away. That's a vote target now.`,
    schemer: p => `${p} smirks. That's a vote target now.`,
    floater: p => { const pr = pronouns(p); return `${p} cringes. Glad it wasn't ${pr.obj} up there.`; },
    showmancer: p => { const pr = pronouns(p); return `${p} covers ${pr.pos} mouth. Second-hand embarrassment.`; },
    wildcard: p => `${p} laughs out loud. Can't help it. Gets dirty looks.`,
    'chaos-agent': p => `${p} laughs out loud. Can't help it.`,
    mastermind: p => `${p} is already running numbers. Can the other two acts make up for this?`,
    _default: p => `${p} winces.`,
  },
  sabotage: {
    hero: p => `${p} is furious. Stands up. Has to be held back.`,
    loyal: p => `${p}: shock. Disbelief. Then quiet rage.`,
    villain: p => { const pr = pronouns(p); return `${p} is impressed despite ${pr.ref}.`; },
    'social-butterfly': p => `${p} immediately comforts the victim.`,
    _default: p => `${p} stares in disbelief.`,
  },
};

import { addBond, getBond } from '../bonds.js';

export function simulateTalentShow(ep) {
  const tribes = gs.tribes.filter(t => t.members.filter(m => gs.activePlayers.includes(m)).length >= 2);
  if (tribes.length < 2) return;

  const tribeMembers = tribes.map(t => ({
    name: t.name,
    members: t.members.filter(m => gs.activePlayers.includes(m))
  }));

  // ── Assign talent type to each player based on highest stat combo ──
  function assignTalent(name) {
    const s = pStats(name);
    let bestCat = TALENT_CATEGORIES[0], bestScore = 0;
    TALENT_CATEGORIES.forEach(cat => {
      const score = s[cat.stats[0]] + s[cat.stats[1]] + Math.random() * 2;
      if (score > bestScore) { bestScore = score; bestCat = cat; }
    });
    const pool = TALENT_POOL[bestCat.id];
    const talent = pool[Math.floor(Math.random() * pool.length)];
    return { category: bestCat.id, primaryStat: bestCat.stats[0], secondaryStat: bestCat.stats[1], talent };
  }

  // ── Audition scoring ──
  function auditionScore(name, talent) {
    const s = pStats(name);
    return s[talent.primaryStat] * 0.35 + s[talent.secondaryStat] * 0.25 + s.social * 0.15 + s.temperament * 0.10 + Math.random() * 3.0;
  }

  // ── Show scoring (fresh random) ──
  function showScore(name, talent) {
    const s = pStats(name);
    return s[talent.primaryStat] * 0.35 + s[talent.secondaryStat] * 0.25 + s.social * 0.15 + s.temperament * 0.10 + Math.random() * 3.0;
  }

  function chefScore(raw) {
    return Math.min(9, Math.max(0, Math.round(raw - 2)));
  }

  // ── Auditions ──
  const auditions = {};
  const captains = {};
  tribeMembers.forEach(t => {
    // Captain: highest social+strategic
    const captain = t.members.slice().sort((a, b) => {
      const sA = pStats(a), sB = pStats(b);
      return (sB.social * 0.5 + sB.strategic * 0.5) - (sA.social * 0.5 + sA.strategic * 0.5);
    })[0];
    captains[t.name] = captain;

    // Everyone auditions — pre-render all text (functions don't survive JSON serialization)
    const results = t.members.map(name => {
      const talentInfo = assignTalent(name);
      const score = auditionScore(name, talentInfo);
      const pr = pronouns(name);
      const t_ = talentInfo.talent;
      return {
        name,
        category: talentInfo.category,
        primaryStat: talentInfo.primaryStat,
        secondaryStat: talentInfo.secondaryStat,
        talentName: t_.name,
        talentId: t_.id,
        // Pre-rendered text strings (survive serialization)
        // 3-beat arrays: [setup, act, landing]
        auditionText: t_.audition(name, pr),
        performanceText: Array.isArray(t_.performance) ? t_.performance.map(fn => fn(name, pr)) : [t_.performance(name, pr)],
        disasterText: Array.isArray(t_.disaster) ? t_.disaster.map(fn => fn(name, pr)) : [t_.disaster(name, pr)],
        clutchText: Array.isArray(t_.clutch) ? t_.clutch.map(fn => fn(name, pr)) : [t_.clutch(name, pr)],
        auditionScore: score,
        selected: false,
      };
    }).sort((a, b) => b.auditionScore - a.auditionScore);

    // Top 3 selected (or 2 if tribe has exactly 2 members)
    const actsCount = Math.min(3, t.members.length);
    results.slice(0, actsCount).forEach(r => { r.selected = true; });
    auditions[t.name] = results;
  });

  // ── Audition Drama (1 per tribe, priority order) ──
  const auditionDrama = {};
  tribeMembers.forEach(t => {
    const results = auditions[t.name] || [];
    const captain = captains[t.name];
    const selected = results.filter(r => r.selected);
    const cut = results.filter(r => !r.selected);
    if (!selected.length) return;

    // Priority 1: Captain's Controversial Cut — cut player within 0.5 of 3rd pick (needs cuts)
    const thirdPick = selected[selected.length - 1];
    const closestCut = cut.find(c => c.name !== captain); // highest-scoring cut player (not the captain)
    if (closestCut && thirdPick && closestCut.name !== captain && Math.abs(closestCut.auditionScore - thirdPick.auditionScore) < 0.5) {
      const arch = players.find(p => p.name === closestCut.name)?.archetype || '';
      const pr = pronouns(closestCut.name);
      const text = ['hero', 'loyal', 'protector'].includes(arch)
        ? `${closestCut.name} stares at ${captain}. "You're cutting me? After what I did for this tribe?" The silence is brutal.`
        : ['villain', 'schemer', 'mastermind'].includes(arch)
        ? `${closestCut.name} smiles. Cold. "Fine. Remember this when we're at tribal." ${captain} pretends not to hear.`
        : `${closestCut.name} takes it hard. Scored nearly as high as the people who made it. ${captain}'s call. Not everyone agrees.`;
      addBond(closestCut.name, captain, -0.4);
      auditionDrama[t.name] = { type: 'controversialCut', players: [closestCut.name, captain], text, badge: 'CONTROVERSIAL CUT', badgeClass: 'red' };
      return;
    }

    // Priority 2: Last Spot Fight — 3rd and 4th within 0.3
    if (closestCut && thirdPick && Math.abs(closestCut.auditionScore - thirdPick.auditionScore) < 0.3) {
      addBond(closestCut.name, thirdPick.name, -0.3);
      auditionDrama[t.name] = {
        type: 'lastSpotFight',
        players: [thirdPick.name, closestCut.name],
        text: `${thirdPick.name} and ${closestCut.name} both know only one of them is getting on that stage. ${thirdPick.name} got it. ${closestCut.name} hasn't stopped staring since.`,
        badge: 'FIGHT FOR THE SPOT', badgeClass: 'red'
      };
      return;
    }

    // Priority 3: Diva Moment — highest scorer with boldness >= 7
    const topScorer = selected[0];
    const topS = pStats(topScorer.name);
    if (topS.boldness >= 7) {
      const lowBoldness = t.members.filter(m => m !== topScorer.name && pStats(m).boldness < 5);
      lowBoldness.forEach(m => addBond(m, topScorer.name, -0.2));
      auditionDrama[t.name] = {
        type: 'divaMoment',
        players: [topScorer.name],
        text: `${topScorer.name} scored highest and wants everyone to know it. "I go first. I close the show. I AM the show." Half the tribe rolls their eyes.`,
        badge: 'DIVA', badgeClass: 'gold'
      };
      return;
    }

    // Priority 4: Terrible Audition Roast — lowest score < 2.0
    const worst = results[results.length - 1];
    if (worst && worst.auditionScore < 2.0) {
      const reactor = t.members.find(m => m !== worst.name && pStats(m).social >= 5) || t.members.find(m => m !== worst.name);
      const rPr = pronouns(reactor);
      addBond(worst.name, reactor, -0.1);
      auditionDrama[t.name] = {
        type: 'terribleAudition',
        players: [worst.name, reactor],
        text: `${worst.name}'s audition was... something. ${reactor} covers ${rPr.posAdj} mouth trying not to laugh. "Was that... on purpose?"`,
        badge: 'ROASTED', badgeClass: 'red'
      };
      return;
    }

    // Priority 5: Confidence Boost — high social selected encourages cut player
    const supporter = selected.find(s => pStats(s.name).social >= 6);
    if (supporter && cut.length) {
      const cutPlayer = cut[0];
      addBond(supporter.name, cutPlayer.name, 0.3);
      addBond(cutPlayer.name, supporter.name, 0.3);
      auditionDrama[t.name] = {
        type: 'confidenceBoost',
        players: [supporter.name, cutPlayer.name],
        text: `${supporter.name} finds ${cutPlayer.name} after the audition. "Hey. You were good. This doesn't mean anything about you." ${cutPlayer.name} nods. Needed to hear that.`,
        badge: 'ENCOURAGEMENT', badgeClass: 'gold'
      };
    }
  });

  // ── Sabotage check (villain/schemer on opposing tribe, max 1) ──
  let sabotage = null;
  tribeMembers.forEach(t => {
    if (sabotage) return;
    t.members.forEach(name => {
      if (sabotage) return;
      const s = pStats(name);
      const arch = players.find(p => p.name === name)?.archetype || '';
      // Block nice archetypes entirely — they don't sabotage
      if (['hero', 'loyal', 'loyal-soldier', 'protector', 'social-butterfly', 'showmancer'].includes(arch)) return;
      // Proportional sabotage chance — every stat point matters, no thresholds
      // villain/schemer/mastermind: strategic drives it, low social boosts it
      // chaos-agent: mental drives it
      // hothead: strategic drives it, social dampens it
      // everyone else with the right stats: tiny base chance
      let sabChance = 0;
      if (['villain', 'schemer', 'mastermind'].includes(arch)) {
        sabChance = s.strategic * 0.03 + (10 - s.social) * 0.01 + s.boldness * 0.008;
      } else if (arch === 'chaos-agent') {
        sabChance = s.mental * 0.02 + s.boldness * 0.01;
      } else if (arch === 'hothead') {
        sabChance = s.strategic * 0.025 + s.boldness * 0.01 - s.social * 0.015;
      } else {
        // Non-blocked archetypes: very low base from boldness + low loyalty
        sabChance = s.boldness * 0.005 + (10 - s.loyalty) * 0.005 - 0.05;
      }
      if (Math.random() >= Math.max(0, sabChance)) return;
      // Pick target: highest audition scorer on an opposing tribe
      const otherTribes = tribeMembers.filter(ot => ot.name !== t.name);
      const targets = otherTribes.flatMap(ot => (auditions[ot.name] || []).filter(a => a.selected));
      if (!targets.length) return;
      const target = targets.sort((a, b) => b.auditionScore - a.auditionScore)[0];
      // Only allow 'replace' (diary reading) if saboteur is a performer — they need stage time to hijack
      const isPerformer = (auditions[t.name] || []).some(a => a.name === name && a.selected);
      const availableTypes = isPerformer ? SABOTAGE_TYPES : SABOTAGE_TYPES.filter(st => st.id !== 'replace');
      const sabType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      sabotage = {
        saboteur: name, saboteurTribe: t.name,
        target: target.name, targetTribe: otherTribes.find(ot => (auditions[ot.name] || []).some(a => a.name === target.name))?.name,
        type: sabType.id, effect: sabType.effect,
        text: sabType.text(name, target.name, pronouns(target.name)),
        stageText: sabType.stageText(name, target.name, pronouns(target.name)),
      };
    });
  });

  // ── Backstage Events (2-3 between auditions and show) ──
  const backstageEvents = [];
  const maxBackstage = 6;

  // Spy Mission — villain/schemer sends ally to watch other tribe rehearse (max 1)
  let _spyFired = false;
  if (backstageEvents.length < maxBackstage) {
    tribeMembers.forEach(t => {
      if (backstageEvents.length >= maxBackstage || _spyFired) return;
      t.members.forEach(name => {
        if (backstageEvents.length >= maxBackstage || _spyFired) return;
        const arch = players.find(p => p.name === name)?.archetype || '';
        const _niceArchs = ['hero', 'loyal', 'loyal-soldier', 'protector', 'social-butterfly', 'showmancer'];
        if (_niceArchs.includes(arch)) return; // nice archetypes don't spy
        const _spyS = pStats(name);
        // Proportional: strategic drives spy missions
        if (Math.random() >= _spyS.strategic * 0.025) return; // strategic 8 = 20%, strategic 5 = 12%
        const ally = t.members.find(m => m !== name && getBond(name, m) >= 1);
        if (!ally) return;
        const otherTribes = tribeMembers.filter(ot => ot.name !== t.name);
        const targetTribe = otherTribes[Math.floor(Math.random() * otherTribes.length)];
        const bestPerformer = (auditions[targetTribe.name] || []).filter(a => a.selected).sort((a, b) => b.auditionScore - a.auditionScore)[0];
        if (!bestPerformer) return;
        const pr = pronouns(name);
        // Consequence: spy intel forces sabotage to target this specific player
        if (!ep._spyIntel) ep._spyIntel = {};
        ep._spyIntel[name] = bestPerformer.name; // saboteur → forced target
        // Bond boost: teamwork between sender and spy
        addBond(name, ally, 0.4);
        addBond(ally, name, 0.3);
        _spyFired = true;
        backstageEvents.push({
          type: 'spyMission', players: [name, ally, bestPerformer.name],
          text: `${name} sends ${ally} to spy on ${targetTribe.name}'s rehearsal. ${ally} comes back with intel: "${bestPerformer.name} is their best. That's who we target."`,
          badge: 'SPY MISSION', badgeClass: 'gold',
        });
      });
    });
  }

  // Sabotage Setup — narrative card if sabotage fires
  if (sabotage && backstageEvents.length < maxBackstage) {
    const pr = pronouns(sabotage.saboteur);
    backstageEvents.push({
      type: 'sabotageSetup', players: [sabotage.saboteur],
      text: sabotage.type === 'props'
        ? `${sabotage.saboteur} sneaks backstage to ${sabotage.target}'s setup. ${pr.Sub} ${pr.sub === 'they' ? 'tamper' : 'tampers'} with the props — loosened joints, wrong strings, marked cards. By the time ${sabotage.target} notices, it'll be too late.`
        : sabotage.type === 'rumors'
        ? `${sabotage.saboteur} works the crowd before the show. "I heard ${sabotage.target} is planning to throw the challenge." The whisper spreads. By showtime, half the audience believes it.`
        : sabotage.type === 'psych'
        ? `${sabotage.saboteur} finds ${sabotage.target} alone backstage. A few words — quiet, personal, calculated. ${sabotage.target}'s face changes. Whatever ${sabotage.saboteur} said, it hit a nerve.`
        : sabotage.type === 'replace'
        ? `${sabotage.saboteur} isn't rehearsing ${pr.posAdj} act. ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} rehearsing something else entirely — something aimed at ${sabotage.target}. This won't be a performance. It'll be a public execution.`
        : `${sabotage.saboteur} slips away while the tribe rehearses. ${pr.Sub} ${pr.sub === 'they' ? 'have' : 'has'} a plan for ${sabotage.target}.`,
      badge: 'SABOTAGE SETUP', badgeClass: 'red',
    });
    addBond(sabotage.saboteur, sabotage.target, -0.2);
  }

  // Pep Talk — high social non-performer comforts nervous performer
  if (backstageEvents.length < maxBackstage) {
    tribeMembers.forEach(t => {
      if (backstageEvents.length >= maxBackstage) return;
      const selected = (auditions[t.name] || []).filter(a => a.selected);
      // Proportional: lower temperament = more likely to need a pep talk
      const nervousPerformer = selected.slice().sort((a, b) => pStats(a.name).temperament - pStats(b.name).temperament)[0];
      if (!nervousPerformer || Math.random() >= (10 - pStats(nervousPerformer.name).temperament) * 0.06) return; // temp 3 = 42%, temp 7 = 18%
      const nonPerformers = t.members.filter(m => !selected.some(s => s.name === m));
      const talker = nonPerformers.sort((a, b) => pStats(b).social - pStats(a).social)[0];
      if (!talker) return;
      const pr = pronouns(nervousPerformer.name);
      // Buff: +1 temperament for the show (stored on performer object)
      nervousPerformer._tempBuff = (nervousPerformer._tempBuff || 0) + 1;
      addBond(nervousPerformer.name, talker, 0.3);
      backstageEvents.push({
        type: 'pepTalk', players: [talker, nervousPerformer.name],
        text: `${talker} finds ${nervousPerformer.name} backstage, pacing. "Hey. You practiced this. You're ready." ${nervousPerformer.name} takes a breath. ${pr.Sub} needed that.`,
        badge: 'PEP TALK', badgeClass: 'gold',
      });
    });
  }

  // Rivalry Confrontation — cross-tribe bond <= -2 (max 1 per episode)
  let _rivalryFired = false;
  if (backstageEvents.length < maxBackstage) {
    const allPlayers = tribeMembers.flatMap(t => t.members);
    for (let i = 0; i < allPlayers.length && backstageEvents.length < maxBackstage && !_rivalryFired; i++) {
      for (let j = i + 1; j < allPlayers.length; j++) {
        if (_rivalryFired) break;
        const a = allPlayers[i], b = allPlayers[j];
        const aTribe = tribeMembers.find(t => t.members.includes(a))?.name;
        const bTribe = tribeMembers.find(t => t.members.includes(b))?.name;
        if (aTribe === bTribe) continue;
        if (getBond(a, b) > -2) continue; // bond <= -2 required
        if (Math.random() >= 0.25) continue;
        addBond(a, b, -0.4);
        _rivalryFired = true;
        const _rivalryTexts = [
          `${a} and ${b} cross paths backstage. Words are exchanged. It starts quiet and gets loud. Someone has to step between them.`,
          `${a} spots ${b} near the stage. Neither looks away. The tension is thick enough to cut. A tribemate pulls ${a} back before it escalates.`,
          `${b} bumps into ${a} backstage. "Watch it." "Make me." It takes three people to keep them apart.`,
          `${a} makes a comment about ${b}'s audition. ${b} hears it. The conversation that follows isn't about talent.`,
        ];
        backstageEvents.push({
          type: 'rivalryConfrontation', players: [a, b],
          text: _rivalryTexts[Math.floor(Math.random() * _rivalryTexts.length)],
          badge: 'RIVALRY', badgeClass: 'red',
        });
        break;
      }
    }
  }

  // Accident — performer with temperament <= 4 practicing backstage
  if (backstageEvents.length < maxBackstage) {
    tribeMembers.forEach(t => {
      if (backstageEvents.length >= maxBackstage) return;
      const selected = (auditions[t.name] || []).filter(a => a.selected);
      // Proportional: lower temperament = more accident-prone
      const clumsy = selected.slice().sort((a, b) => pStats(a.name).temperament - pStats(b.name).temperament)[0];
      if (!clumsy || Math.random() >= (10 - pStats(clumsy.name).temperament) * 0.04) return; // temp 2 = 32%, temp 6 = 16%
      const pr = pronouns(clumsy.name);
      // Coin flip: self-injury (-2 score) or prop break (substitution)
      if (Math.random() < 0.5) {
        clumsy._scorePenalty = (clumsy._scorePenalty || 0) - 2;
        backstageEvents.push({
          type: 'accidentInjury', players: [clumsy.name],
          text: `${clumsy.name} was practicing backstage and something went wrong. ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} nursing ${pr.posAdj} hand. "I'm fine. I can still go." ${pr.Sub} ${pr.sub === 'they' ? 'aren\'t' : 'isn\'t'} fine.`,
          badge: 'ACCIDENT', badgeClass: 'red',
        });
      } else {
        // Substitution: swap with best non-selected
        const cut = (auditions[t.name] || []).filter(a => !a.selected);
        const sub = cut[0]; // best cut player
        if (sub) {
          clumsy.selected = false;
          sub.selected = true;
          backstageEvents.push({
            type: 'accidentSubstitution', players: [clumsy.name, sub.name],
            text: `${clumsy.name} broke something backstage — ${pr.posAdj} props are ruined. ${sub.name} gets the call. "You're in." The Harold moment.`,
            badge: 'SUBSTITUTION', badgeClass: 'gold',
          });
        }
      }
    });
  }

  // Secret Rehearsal — cut player with boldness >= 6, practicing alone
  if (backstageEvents.length < maxBackstage) {
    tribeMembers.forEach(t => {
      if (backstageEvents.length >= maxBackstage) return;
      const cut = (auditions[t.name] || []).filter(a => !a.selected);
      // Proportional: higher boldness = more likely to keep practicing after being cut
      const bold = cut.slice().sort((a, b) => pStats(b.name).boldness - pStats(a.name).boldness)[0];
      if (!bold || Math.random() >= pStats(bold.name).boldness * 0.04) return; // boldness 8 = 32%, boldness 5 = 20%
      // 40% chance of being subbed in
      if (Math.random() < 0.40) {
        const selected = (auditions[t.name] || []).filter(a => a.selected);
        const weakest = selected[selected.length - 1]; // lowest scorer
        if (weakest) {
          weakest.selected = false;
          bold.selected = true;
          const pr = pronouns(bold.name);
          backstageEvents.push({
            type: 'secretRehearsalSubIn', players: [bold.name, weakest.name],
            text: `Someone spots ${bold.name} practicing alone behind the cabins. Word gets back to the captain. "${bold.name} looks good." A last-minute swap. ${weakest.name} is out. ${bold.name} is in.`,
            badge: 'SECRET REHEARSAL', badgeClass: 'gold',
          });
        }
      } else {
        // Even without a sub-in, the practice pays off — score buff if they perform later
        bold._tempBuff = (bold._tempBuff || 0) + 1.5;
        backstageEvents.push({
          type: 'secretRehearsalAlone', players: [bold.name],
          text: `${bold.name} didn't make the cut, but ${pronouns(bold.name).sub} ${pronouns(bold.name).sub === 'they' ? 'haven\'t' : 'hasn\'t'} stopped practicing. Alone. Behind the cabins. The extra reps won't go to waste.`,
          badge: 'SECRET REHEARSAL', badgeClass: 'gold',
        });
      }
    });
  }

  // Stage Fright — performer panicking, considering dropping out
  if (backstageEvents.length < maxBackstage) {
    tribeMembers.forEach(t => {
      if (backstageEvents.length >= maxBackstage) return;
      const selected = (auditions[t.name] || []).filter(a => a.selected);
      // Proportional: low boldness + low temperament = stage fright. Higher stats = less fear.
      const scared = selected.slice().sort((a, b) => {
        const aS = pStats(a.name), bS = pStats(b.name);
        return (aS.boldness + aS.temperament) - (bS.boldness + bS.temperament);
      })[0];
      const _fearScore = scared ? ((10 - pStats(scared.name).boldness) * 0.02 + (10 - pStats(scared.name).temperament) * 0.02) : 0;
      if (!scared || Math.random() >= _fearScore) return; // boldness 3+temp 3 = 28%, boldness 7+temp 7 = 12%
      const pr = pronouns(scared.name);
      const _texts = [
        `${scared.name} is pacing behind the stage. "I can't do this. I can't go out there." ${pr.PosAdj} hands are shaking.`,
        `${scared.name} is sitting alone, head in ${pr.posAdj} hands. "What if I freeze?" The doubt is eating ${pr.obj} alive.`,
        `${scared.name} tried to leave twice. Both times someone brought ${pr.obj} back. The show starts in five minutes.`,
      ];
      backstageEvents.push({
        type: 'stageFright', players: [scared.name],
        text: _texts[Math.floor(Math.random() * _texts.length)],
        badge: 'STAGE FRIGHT', badgeClass: 'red',
      });
      scared._tempDebuff = (scared._tempDebuff || 0) + 1; // nerves make disaster more likely
    });
  }

  // Trash Talk — bold player taunts a performer from another tribe
  if (backstageEvents.length < maxBackstage) {
    tribeMembers.forEach(t => {
      if (backstageEvents.length >= maxBackstage) return;
      // Proportional: boldness drives trash talk. Block nice archetypes.
      const _niceArchs = ['hero', 'loyal', 'loyal-soldier', 'protector', 'social-butterfly', 'showmancer'];
      const trashCandidates = t.members.filter(m => !_niceArchs.includes(players.find(p => p.name === m)?.archetype || ''));
      const trashTalker = trashCandidates.sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
      if (!trashTalker || Math.random() >= pStats(trashTalker).boldness * 0.035) return; // boldness 8 = 28%, boldness 5 = 17%
      const otherTribes = tribeMembers.filter(ot => ot.name !== t.name);
      const targetTribe = otherTribes[Math.floor(Math.random() * otherTribes.length)];
      const targetPerformer = (auditions[targetTribe.name] || []).filter(a => a.selected)[0];
      if (!targetPerformer) return;
      const _texts = [
        `${trashTalker} corners ${targetPerformer.name} near the stage. "You know you're going to choke, right? Everyone knows." ${targetPerformer.name} says nothing.`,
        `${trashTalker} walks past ${targetPerformer.name} and mutters: "Save yourself the embarrassment." Loud enough for everyone to hear.`,
        `${trashTalker} watches ${targetPerformer.name} warm up and laughs. "That's your act? Seriously?" The confidence drain is visible.`,
      ];
      addBond(targetPerformer.name, trashTalker, -0.3);
      backstageEvents.push({
        type: 'trashTalk', players: [trashTalker, targetPerformer.name],
        text: _texts[Math.floor(Math.random() * _texts.length)],
        badge: 'TRASH TALK', badgeClass: 'red',
      });
    });
  }

  // Alliance Huddle — alliance members strategize about who should perform
  if (backstageEvents.length < maxBackstage) {
    const activeAlliances = (gs.namedAlliances || []).filter(a => a.active && a.members.length >= 3);
    if (activeAlliances.length && Math.random() < 0.30) {
      const alliance = activeAlliances[Math.floor(Math.random() * activeAlliances.length)];
      const huddle = alliance.members.filter(m => gs.activePlayers.includes(m)).slice(0, 3);
      if (huddle.length >= 2) {
        backstageEvents.push({
          type: 'allianceHuddle', players: huddle,
          text: `${huddle.join(' and ')} pull each other aside. Quick whispers. They're not just thinking about the show — they're thinking about what comes after. If they lose, who goes home?`,
          badge: 'ALLIANCE HUDDLE', badgeClass: 'gold',
        });
        // Small bond reinforcement
        for (let i = 0; i < huddle.length; i++) {
          for (let j = i + 1; j < huddle.length; j++) {
            addBond(huddle[i], huddle[j], 0.3);
          }
        }
      }
    }
  }

  // Pre-Show Jitters — general mood event (always available as filler)
  if (backstageEvents.length < maxBackstage && backstageEvents.length < 3) {
    const randomPerformer = Object.values(auditions).flatMap(a => a.filter(r => r.selected))[Math.floor(Math.random() * 6)] || Object.values(auditions).flatMap(a => a.filter(r => r.selected))[0];
    if (randomPerformer) {
      const pr = pronouns(randomPerformer.name);
      const _texts = [
        `The stage is set. The curtain's about to go up. ${randomPerformer.name} takes one last look at ${pr.posAdj} hands. Still shaking. Good.`,
        `Someone peeks through the curtain. "Chef looks angry." "Chef always looks angry." "No, like... MORE angry." The performers exchange glances.`,
        `The camp is buzzing. Everyone's picking their seats. The performers backstage can hear the noise building. This is real now.`,
        `${randomPerformer.name} rehearses ${pr.posAdj} opening one more time. Mumbles it under ${pr.posAdj} breath. Adjusts ${pr.posAdj} stance. Nods. Ready. Maybe.`,
      ];
      backstageEvents.push({
        type: 'preShowJitters', players: [randomPerformer.name],
        text: _texts[Math.floor(Math.random() * _texts.length)],
        badge: 'PRE-SHOW', badgeClass: 'gold',
      });
    }
  }

  // ── Backstage fallback: guarantee at least 2 events ──
  if (backstageEvents.length < 3) {
    // Fallback pep talk: find ANY performer + ANY non-performer with decent social
    for (const t of tribeMembers) {
      if (backstageEvents.length >= 2) break;
      const selected = (auditions[t.name] || []).filter(a => a.selected);
      const nonPerformers = t.members.filter(m => !selected.some(s => s.name === m));
      const talker = nonPerformers.find(m => pStats(m).social >= 4);
      const performer = selected[0];
      if (talker && performer && !backstageEvents.some(e => e.type === 'pepTalk' && e.players.includes(talker))) {
        const pr = pronouns(performer.name);
        const _pepTexts = [
          `${talker} finds ${performer.name} backstage. "You've got this." ${performer.name} nods. Simple words, but they land.`,
          `${talker} catches ${performer.name} staring at the stage. "Nervous?" "Terrified." "Good. Means you care." ${performer.name} half-smiles.`,
          `${talker} sits next to ${performer.name}. Doesn't say anything for a while. Then: "I'd pick you every time." ${performer.name} takes a breath.`,
        ];
        backstageEvents.push({
          type: 'pepTalk', players: [talker, performer.name],
          text: _pepTexts[Math.floor(Math.random() * _pepTexts.length)],
          badge: 'PEP TALK', badgeClass: 'gold',
        });
        addBond(performer.name, talker, 0.3);
      }
    }
  }

  // ── Apply spy intel to sabotage targeting ──
  if (sabotage && ep._spyIntel?.[sabotage.saboteur]) {
    const spiedTarget = ep._spyIntel[sabotage.saboteur];
    // Override sabotage target if the spied player is a selected performer
    const allSelected = Object.values(auditions).flatMap(a => a.filter(r => r.selected));
    if (allSelected.some(s => s.name === spiedTarget)) {
      sabotage.target = spiedTarget;
      sabotage.spyAssisted = true;
    }
  }

  // ── The Show: perform acts (interleaved) ──
  const performances = [];
  const maxActs = Math.max(...Object.values(auditions).map(a => a.filter(r => r.selected).length));
  for (let actIdx = 0; actIdx < maxActs; actIdx++) {
    tribeMembers.forEach(t => {
      const selected = (auditions[t.name] || []).filter(r => r.selected);
      if (actIdx >= selected.length) return;
      const performer = selected[actIdx];
      const name = performer.name;
      const pr = pronouns(name);
      const s = pStats(name);

      let rawScore = showScore(name, performer);
      let outcome = 'normal';

      // Backstage modifiers
      if (performer._tempBuff) rawScore += performer._tempBuff * 0.3; // pep talk temperament buff
      if (performer._scorePenalty) rawScore += performer._scorePenalty; // accident penalty

      // Sabotage effects (type-specific)
      const isSabotaged = sabotage?.target === name;
      const sabType = isSabotaged ? SABOTAGE_TYPES.find(st => st.id === sabotage.type) : null;
      if (isSabotaged && sabType) {
        if (sabType.effect === 'disaster') {
          // Props sabotage: force disaster outcome (use disaster text)
          rawScore = 1 + Math.random();
          outcome = 'disaster';
        } else if (sabType.effect === 'penalty') {
          // Rumors: score penalty, crowd hostile
          rawScore += sabType.penalty || -2;
          outcome = 'sabotaged';
        } else if (sabType.effect === 'tempDebuff') {
          // Psych warfare: temperament drop → increased disaster chance (don't force it)
          outcome = 'sabotaged'; // mark as sabotaged for VP
        }
        // 'selfScore0' (replace) is handled separately — affects the saboteur's own act, not the target's
      }

      // Check if saboteur replaced their own act (type 'replace') — applies to saboteur, not target
      const isSaboteurReplacingAct = sabotage?.saboteur === name && sabotage?.type === 'replace';
      if (isSaboteurReplacingAct) {
        rawScore = 0; // saboteur scores 0 — didn't perform a talent
        outcome = 'saboteurReplace';
        const _sabTarget = sabotage.target;

        // ── SOCIAL DESTRUCTION: the real payoff ──
        // Target's OWN tribe takes bond damage — the diary/secrets are about THEM
        // (crushes, complaints, real opinions — now public)
        const _sabTargetTribe = tribeMembers.find(tm => tm.members.includes(_sabTarget));
        if (_sabTargetTribe) {
          _sabTargetTribe.members.filter(m => m !== _sabTarget).forEach(m => {
            addBond(m, _sabTarget, -0.5); // hurt — the diary said things about them
          });
        }
        // Only close friends rally — people with existing bond >= 2 comfort the target
        gs.activePlayers.forEach(m => {
          if (m === name || m === _sabTarget) return;
          const bond = getBond(m, _sabTarget);
          if (bond >= 2) addBond(m, _sabTarget, 0.5); // close friend rallies
          if (bond <= -1) addBond(m, name, 0.2); // people who disliked the victim warm to the saboteur
        });
        // Target: sympathy boost (victim edit). Saboteur: popularity tanks (villain edit).
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[_sabTarget] = (gs.popularity[_sabTarget] || 0) + 3; // sympathy underdog
        gs.popularity[name] = (gs.popularity[name] || 0) - 4; // saboteur villain edit
        // Target: temperament debuff for their performance
        const targetPerformer = Object.values(auditions).flatMap(a => a).find(a => a.name === _sabTarget && a.selected);
        if (targetPerformer) targetPerformer._tempDebuff = (targetPerformer._tempDebuff || 0) + 3;

        // ── SABOTEUR CONSEQUENCES ──
        // +bigMoves credit (this IS a big move, even if evil)
        const _sabState = gs.playerStates?.[name] || {};
        _sabState.bigMoves = (_sabState.bigMoves || 0) + 1;
        if (!gs.playerStates) gs.playerStates = {};
        gs.playerStates[name] = _sabState;
        if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
        if (!gs.bigMoveEarnersThisEp.includes(name)) gs.bigMoveEarnersThisEp.push(name);
        // Heat: massive target on their back
        if (!gs._talentShowHeat) gs._talentShowHeat = {};
        gs._talentShowHeat[name] = { amount: 2.0, expiresEp: ((gs.episode || 0) + 1) + 2 };
        // Saboteur's own tribe: mixed reactions
        const _sabOwnTribe = tribeMembers.find(tm => tm.members.includes(name));
        if (_sabOwnTribe) {
          _sabOwnTribe.members.filter(m => m !== name).forEach(m => {
            const mArch = players.find(p => p.name === m)?.archetype || '';
            if (['villain', 'schemer', 'mastermind'].includes(mArch)) {
              addBond(m, name, 0.2); // respect the play
            } else {
              addBond(m, name, -0.3); // that was cruel
            }
          });
        }
        // Cross-tribe: everyone hates the saboteur
        gs.activePlayers.filter(p => p !== name && !(_sabOwnTribe?.members.includes(p))).forEach(p => {
          addBond(p, name, -0.5);
        });
      }

      // Disaster check (fires normally, but psych sabotage increases chance via temp debuff)
      if (outcome === 'normal' || outcome === 'sabotaged') {
        const tempMod = (performer._tempDebuff || 0);
        const effectiveTemp = Math.max(0, s.temperament - tempMod);
        const disasterChance = (10 - effectiveTemp) * 0.03;
        if (outcome !== 'disaster' && Math.random() < disasterChance) {
          rawScore = 1 + Math.random();
          outcome = 'disaster';
        }
      }

      // Clutch check: only for lowest audition scorer of the selected 3
      const lowestAuditioner = selected[selected.length - 1]?.name;
      if (outcome === 'normal' && name === lowestAuditioner) {
        const clutchChance = s.boldness * 0.02;
        if (Math.random() < clutchChance) {
          rawScore = 8 + Math.random();
          outcome = 'clutch';
        }
      }

      const chef = chefScore(rawScore);
      const _preBeats = outcome === 'disaster' ? performer.disasterText
        : outcome === 'clutch' ? performer.clutchText
        : performer.performanceText; // array of [setup, act, landing]
      // Replace the landing beat (3rd) with a score-reactive line — pre-rendered text
      // assumes success but the actual Chef score may be low
      const _scoreLandings = chef >= 8
        ? [`${name} finishes. The camp erupts. Chef's spoon shoots to ${chef}. That was special.`]
        : chef >= 6
        ? [`${name} finishes to solid applause. Chef gives a ${chef}. Respectable — the tribe will take it.`]
        : chef >= 4
        ? [`${name} finishes. Polite clapping. Chef marks a ${chef}. Not what the tribe was hoping for.`]
        : chef >= 2
        ? [`${name} finishes to near-silence. Chef's spoon barely moves. A ${chef}. That hurt.`]
        : [`${name} finishes — if you can call it that. Chef marks a ${chef}. Nobody makes eye contact.`];
      const performanceBeats = Array.isArray(_preBeats) && _preBeats.length >= 2
        ? [_preBeats[0], _preBeats[1], _scoreLandings[0]]
        : _preBeats;

      // Audience reactions (2-3 from same tribe)
      const reactors = t.members.filter(m => m !== name).slice(0, 3);
      const scoreLevel = chef >= 7 ? 'high' : chef <= 3 ? 'low' : 'mid';
      const reactions = reactors.map(r => {
        const rArch = players.find(p => p.name === r)?.archetype || '_default';
        const pool = isSabotaged ? AUDIENCE_REACTIONS.sabotage : AUDIENCE_REACTIONS[scoreLevel];
        const fn = pool[rArch] || pool._default;
        return { name: r, text: fn(r) };
      });

      performances.push({
        name, tribe: t.name, talent: performer.talentName, talentId: performer.talentId,
        category: performer.category,
        auditionScore: performer.auditionScore,
        showScore: rawScore, chefScore: chef, outcome,
        performanceBeats: outcome === 'saboteurReplace'
          ? [`${name} was supposed to perform ${performer.talentName}. Instead, ${pronouns(name).sub} ${pronouns(name).sub === 'they' ? 'walk' : 'walks'} to the mic with something else in mind.`,
             sabotage.stageText,
             `Chef marks a 0. No talent was performed. But the damage is done.`]
          : performanceBeats,
        // Sabotage card: on TARGET's act (including replace type). Never on saboteur's own act.
        sabotageText: isSabotaged ? sabotage.text : null,
        sabotageStageText: isSabotaged ? (sabotage.type === 'replace'
          ? `${sabotage.saboteur} used ${pronouns(sabotage.saboteur).posAdj} stage time to publicly attack ${name}. The fallout is still landing.`
          : sabotage.stageText) : null,
        sabotageType: isSabotaged ? sabotage.type : (isSaboteurReplacingAct ? 'saboteurReplace' : null),
        reactions,
      });
    });
  }

  // ── Determine winner/loser ──
  const tribeScores = {};
  tribeMembers.forEach(t => { tribeScores[t.name] = 0; });
  performances.forEach(p => { tribeScores[p.tribe] += p.chefScore; });

  const sortedTribes = Object.entries(tribeScores).sort(([,a], [,b]) => b - a);
  const winnerName = sortedTribes[0][0];
  const loserName = sortedTribes[sortedTribes.length - 1][0];
  const winner = gs.tribes.find(t => t.name === winnerName);
  const loser = gs.tribes.find(t => t.name === loserName);

  // ── chalMemberScores: only performers ──
  const playerScores = {};
  performances.forEach(p => { playerScores[p.name] = p.showScore; });

  // ── Set ep fields ──
  ep.winner = winner;
  ep.loser = loser;
  ep.challengeType = 'tribe';
  ep.tribalPlayers = [...loser.members];
  ep.challengeLabel = 'Talent Show';
  ep.challengeCategory = 'social';
  ep.challengeDesc = 'Camp talent show. Each tribe auditions, captain picks 3 acts. Chef scores 0-9.';
  ep.chalMemberScores = playerScores;
  ep.chalSitOuts = {};
  updateChalRecord(ep);

  // ── Camp events (2 per tribe) ──
  if (!ep.campEvents) ep.campEvents = {};
  tribeMembers.forEach(t => {
    const key = t.name;
    if (!ep.campEvents[key]) ep.campEvents[key] = { pre: [], post: [] };
    if (!ep.campEvents[key].post) ep.campEvents[key].post = [];

    const tribePerfs = performances.filter(p => p.tribe === t.name);
    const tribeAuditions = auditions[t.name] || [];

    // ── POSITIVE ──
    // Unlikely Hero: lowest auditioner who clutched
    const clutchPerf = tribePerfs.find(p => p.outcome === 'clutch');
    // Standing Ovation: highest chef score
    const bestPerf = tribePerfs.slice().sort((a, b) => b.chefScore - a.chefScore)[0];
    // Team Support: highest social non-performer
    const nonPerformers = t.members.filter(m => !tribePerfs.some(p => p.name === m));
    const supporter = nonPerformers.sort((a, b) => pStats(b).social - pStats(a).social)[0];

    if (clutchPerf) {
      const pr = pronouns(clutchPerf.name);
      ep.campEvents[key].post.push({
        type: 'talentShowUnlikelyHero', players: [clutchPerf.name],
        text: `Nobody expected ${clutchPerf.name} to steal the show. ${pr.Sub} almost didn't make the cut. Then ${pr.sub} walked on stage and changed everything.`,
        consequences: '+0.4 bond from tribemates, +2 popularity.',
        badgeText: 'UNLIKELY HERO', badgeClass: 'gold'
      });
      t.members.filter(m => m !== clutchPerf.name).forEach(m => addBond(m, clutchPerf.name, 0.4));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[clutchPerf.name] = (gs.popularity[clutchPerf.name] || 0) + 2; // underdog clutch = fan favourite moment
    } else if (bestPerf && bestPerf.chefScore >= 7) {
      const pr = pronouns(bestPerf.name);
      ep.campEvents[key].post.push({
        type: 'talentShowStandingOvation', players: [bestPerf.name],
        text: `${bestPerf.name} brought the house down. Chef gave ${pr.obj} a ${bestPerf.chefScore}. The tribe carried ${pr.obj} off the stage.`,
        consequences: '+0.5 bond from tribemates, +2 popularity.',
        badgeText: 'STANDING OVATION', badgeClass: 'gold'
      });
      t.members.filter(m => m !== bestPerf.name).forEach(m => addBond(m, bestPerf.name, 0.5));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[bestPerf.name] = (gs.popularity[bestPerf.name] || 0) + 2;
    } else if (supporter) {
      const pr = pronouns(supporter);
      ep.campEvents[key].post.push({
        type: 'talentShowTeamSupport', players: [supporter, ...(tribePerfs[0] ? [tribePerfs[0].name] : [])],
        text: `${supporter} didn't perform, but ${pr.sub} ${pr.sub === 'they' ? 'were' : 'was'} the loudest voice in the crowd. Every cheer, every clap — the performers felt it.`,
        consequences: '+0.3 bond with performers.',
        badgeText: 'TEAM SUPPORT', badgeClass: 'gold'
      });
      tribePerfs.forEach(p => addBond(p.name, supporter, 0.3));
    }

    // ── NEGATIVE ──
    const sabotaged = sabotage && sabotage.saboteurTribe !== t.name && tribePerfs.some(p => p.outcome === 'sabotaged');
    const disasterPerf = tribePerfs.find(p => p.outcome === 'disaster');
    const bitterReject = tribeAuditions.find((a, idx) => !a.selected && idx < 4); // close to cutoff

    if (sabotaged && sabotage) {
      const pr = pronouns(sabotage.saboteur);
      ep.campEvents[key].post.push({
        type: 'talentShowSabotageFallout', players: [sabotage.target, sabotage.saboteur],
        text: `What ${sabotage.saboteur} did to ${sabotage.target} won't be forgotten. The tribe is furious.`,
        consequences: '-0.5 bond with saboteur, +1.5 heat.',
        badgeText: 'SABOTAGE', badgeClass: 'red'
      });
      t.members.forEach(m => addBond(m, sabotage.saboteur, -0.5));
      if (!gs._talentShowHeat) gs._talentShowHeat = {};
      gs._talentShowHeat[sabotage.saboteur] = { amount: 1.5, expiresEp: ((gs.episode || 0) + 1) + 2 };
    } else if (disasterPerf) {
      const pr = pronouns(disasterPerf.name);
      ep.campEvents[key].post.push({
        type: 'talentShowDisaster', players: [disasterPerf.name],
        text: `${disasterPerf.name} choked on stage. Chef gave ${pr.obj} a ${disasterPerf.chefScore}. The tribe tries not to talk about it. They fail.`,
        consequences: '-0.3 bond from tribemates, +0.5 heat, -1 popularity.',
        badgeText: 'STAGE DISASTER', badgeClass: 'red'
      });
      t.members.filter(m => m !== disasterPerf.name).forEach(m => addBond(m, disasterPerf.name, -0.3));
      if (!gs._talentShowHeat) gs._talentShowHeat = {};
      gs._talentShowHeat[disasterPerf.name] = { amount: 0.5, expiresEp: ((gs.episode || 0) + 1) + 1 };
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[disasterPerf.name] = (gs.popularity[disasterPerf.name] || 0) - 1; // stage disaster = cringe edit
    } else if (bitterReject) {
      const captain = captains[t.name];
      const pr = pronouns(bitterReject.name);
      ep.campEvents[key].post.push({
        type: 'talentShowBitterReject', players: [bitterReject.name, captain],
        text: `${bitterReject.name} was THIS close to making the cut. ${captain} chose someone else. ${pr.Sub} ${pr.sub === 'they' ? 'haven\'t' : 'hasn\'t'} forgotten.`,
        consequences: '-0.4 bond with captain.',
        badgeText: 'BITTER REJECTION', badgeClass: 'red'
      });
      addBond(bitterReject.name, captain, -0.4);
    }
  });

  // ── Store data ──
  ep.talentShow = {
    auditions, performances, captains, sabotage,
    auditionDrama, backstageEvents,
    tribeScores,
    winner: winnerName, loser: loserName,
    mvp: performances.slice().sort((a, b) => b.showScore - a.showScore)[0]?.name || null,
  };
}

export function _textTalentShow(ep, ln, sec) {
  if (!ep.isTalentShow || !ep.talentShow) return;
  const ts = ep.talentShow;
  sec('TALENT SHOW');
  Object.entries(ts.auditions).forEach(([tribe, results]) => {
    ln(`${tribe} (Captain: ${ts.captains[tribe]})`);
    results.forEach(r => ln(`  ${r.selected ? '+' : '-'} ${r.name} — ${r.talentName || r.talent?.name || '?'} (${r.auditionScore.toFixed(1)})`));
  });
  // Audition drama
  if (ts.auditionDrama) {
    Object.entries(ts.auditionDrama).forEach(([tribe, drama]) => {
      ln(`  ${tribe} DRAMA: [${drama.badge}] ${drama.text}`);
    });
  }
  // Backstage
  if (ts.backstageEvents?.length) {
    ln('');
    ln('BACKSTAGE:');
    ts.backstageEvents.forEach(evt => ln(`  [${evt.badge}] ${evt.text}`));
  }
  if (ts.sabotage) ln(`SABOTAGE: ${ts.sabotage.saboteur} sabotaged ${ts.sabotage.target} (${ts.sabotage.type})`);
  ln('');
  ts.performances.forEach(p => {
    const tag = p.outcome === 'disaster' ? ' [DISASTER]' : p.outcome === 'clutch' ? ' [CLUTCH]' : p.outcome === 'sabotaged' ? ' [SABOTAGED]' : '';
    ln(`${p.tribe} — ${p.name}: ${p.talent} — Chef: ${p.chefScore}/9${tag}`);
    const beats = p.performanceBeats || (typeof p.performanceText === 'string' ? [p.performanceText] : p.performanceText) || [];
    beats.forEach(b => { if (b) ln(`  ${b}`); });
  });
  ln(`Final: ${Object.entries(ts.tribeScores).map(([t, s]) => `${t} ${s}`).join(' — ')}`);
  ln(`Winner: ${ts.winner}. ${ts.loser} goes to tribal.`);
  if (ts.mvp) ln(`MVP: ${ts.mvp}`);
}

export function rpBuildTalentAuditions(ep) {
  const ts = ep.talentShow;
  if (!ts?.auditions) return null;

  const stateKey = `ts_aud_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const tribeNames = Object.keys(ts.auditions);
  const totalItems = tribeNames.length;
  const allRevealed = state.idx >= totalItems - 1;

  const _tsReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  let html = `<div class="rp-page tod-dawn">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:#8b5cf6;text-shadow:0 0 20px rgba(139,92,246,0.3);margin-bottom:6px">🎭 TALENT SHOW — AUDITIONS</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:20px">Each tribe auditions. Captain picks the 3 best acts for the show.</div>`;

  tribeNames.forEach((tribeName, tIdx) => {
    const isVisible = tIdx <= state.idx;
    if (!isVisible) {
      html += `<div style="padding:14px;margin-bottom:6px;border:1px solid var(--border);border-radius:8px;opacity:0.12;text-align:center;color:var(--muted)">${tribeName} Auditions</div>`;
      return;
    }

    const tc = tribeColor(tribeName);
    const captain = ts.captains[tribeName];
    const results = ts.auditions[tribeName] || [];

    html += `<div style="margin-bottom:16px;padding:14px;border-radius:10px;border:1px solid ${tc}44;background:${tc}08;animation:scrollDrop 0.3s var(--ease-broadcast) both">`;
    html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <div style="font-family:var(--font-display);font-size:14px;letter-spacing:1px;color:${tc}">${tribeName.toUpperCase()} AUDITIONS</div>`;
    if (captain) {
      html += `<div style="display:flex;align-items:center;gap:4px;margin-left:auto">
        ${rpPortrait(captain, 'xs')}
        <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f0a500">CAPTAIN</span>
      </div>`;
    }
    html += `</div>`;

    results.forEach((r, i) => {
      const pr = pronouns(r.name);
      const badgeColor = r.selected ? '#3fb950' : (i === 3 ? '#f0a500' : '#f85149');
      const badgeText = r.selected ? 'SELECTED' : (i === 3 ? 'CLOSE CALL' : 'CUT');
      const opacity = r.selected ? '1' : '0.5';
      html += `<div style="display:flex;align-items:center;gap:10px;padding:8px;margin-bottom:4px;border-radius:6px;background:rgba(255,255,255,0.02);opacity:${opacity}">
        ${rpPortrait(r.name, 'sm')}
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:600;color:#e6edf3">${r.name}</div>
          <div style="font-size:10px;color:#8b949e">${r.talentName || r.talent?.name || '?'}</div>
          <div style="font-size:10px;color:#6e7681;font-style:italic;margin-top:2px">${r.auditionText || ''}</div>
        </div>
        <div style="text-align:right">
          <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${badgeColor};background:${badgeColor}18;padding:2px 6px;border-radius:3px">${badgeText}</span>
          <div style="font-size:10px;color:#8b949e;margin-top:2px">${r.auditionScore.toFixed(1)}</div>
        </div>
      </div>`;
    });

    // Audition drama card (if one fired for this tribe)
    const drama = ts.auditionDrama?.[tribeName];
    if (drama) {
      const dColor = drama.badgeClass === 'gold' ? '#f0a500' : '#f85149';
      html += `<div style="margin-top:10px;padding:10px;border-radius:8px;
        border-left:3px solid ${dColor};background:${dColor}08;
        animation:scrollDrop 0.3s var(--ease-broadcast) both">
        <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${dColor}">${drama.badge}</span>
        <div style="display:flex;gap:6px;margin:6px 0">
          ${(drama.players || []).map(p => rpPortrait(p, 'xs')).join('')}
        </div>
        <div style="font-size:11px;color:#cdd9e5;font-style:italic;line-height:1.5">${drama.text}</div>
      </div>`;
    }

    html += `</div>`;
  });

  if (!allRevealed) {
    html += `<div style="position:sticky;bottom:0;padding:12px 0;text-align:center;background:linear-gradient(transparent,var(--bg-primary) 30%)">
      <button class="rp-btn" onclick="${_tsReveal(state.idx + 1)}">NEXT (${state.idx + 2}/${totalItems})</button>
      <button class="rp-btn rp-btn-secondary" onclick="${_tsReveal(totalItems - 1)}" style="margin-left:8px">REVEAL ALL</button>
    </div>`;
  }

  html += `</div>`;
  return html;
}

export function rpBuildTalentBackstage(ep) {
  const ts = ep.talentShow;
  const events = ts?.backstageEvents;
  if (!events?.length) return null;

  const stateKey = `ts_back_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];
  const allRevealed = state.idx >= events.length - 1;

  const _bsReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  let html = `<div class="rp-page tod-dusk" style="background:linear-gradient(180deg,rgba(25,18,35,1) 0%,rgba(15,12,20,1) 100%)">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:24px;letter-spacing:2px;text-align:center;
      color:#8b5cf6;text-shadow:0 0 20px rgba(139,92,246,0.3);margin-bottom:4px">BACKSTAGE</div>
    <div style="text-align:center;font-size:11px;color:#6e7681;margin-bottom:20px;letter-spacing:1px">
      Between auditions and the show, things happen in the shadows.</div>`;

  events.forEach((evt, i) => {
    const isVisible = i <= state.idx;
    if (!isVisible) {
      html += `<div style="padding:12px;margin-bottom:6px;border:1px solid var(--border);border-radius:8px;
        opacity:0.1;text-align:center;color:var(--muted);font-style:italic">Something is happening backstage...</div>`;
      return;
    }
    const bColor = evt.badgeClass === 'gold' ? '#f0a500' : evt.badgeClass === 'red' ? '#f85149' : '#8b5cf6';
    html += `<div style="padding:14px;margin-bottom:8px;border-radius:10px;
      border-left:3px solid ${bColor};
      background:linear-gradient(135deg,${bColor}08 0%,transparent 60%);
      animation:scrollDrop 0.3s var(--ease-broadcast) both">
      <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${bColor}">${evt.badge}</span>
      <div style="display:flex;gap:8px;margin:8px 0">
        ${(evt.players || []).map(p => rpPortrait(p, 'sm')).join('')}
      </div>
      <div style="font-size:12px;color:#cdd9e5;line-height:1.6;font-style:italic">${evt.text}</div>
    </div>`;
  });

  if (!allRevealed) {
    html += `<div style="position:sticky;bottom:0;padding:12px 0;text-align:center;
      background:linear-gradient(transparent,rgba(15,12,20,1) 30%)">
      <button class="rp-btn" onclick="${_bsReveal(state.idx + 1)}">NEXT (${state.idx + 2}/${events.length})</button>
      <button class="rp-btn rp-btn-secondary" onclick="${_bsReveal(events.length - 1)}" style="margin-left:8px">REVEAL ALL</button>
    </div>`;
  }

  html += `</div>`;
  return html;
}

export function rpBuildTalentShowStage(ep) {
  const ts = ep.talentShow;
  if (!ts?.performances?.length) return null;

  const stateKey = `ts_show_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const totalItems = ts.performances.length;
  const allRevealed = state.idx >= totalItems - 1;

  const _tsReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  // Live scoreboard
  const revealedScores = {};
  Object.keys(ts.tribeScores).forEach(t => { revealedScores[t] = 0; });
  ts.performances.forEach((p, i) => { if (i <= state.idx) revealedScores[p.tribe] += p.chefScore; });

  // ═══ STAGE AMBIENCE ═══
  // Deep dark stage with red velvet curtain drapes at top, wood floor at bottom, spotlight cone
  let html = `<div class="rp-page" style="
    background:
      linear-gradient(180deg, #2a0a0a 0%, #1a0505 4%, #0d0915 12%, #08060f 30%, #0a0710 70%, #1a1008 92%, #2a1a0c 100%);
    position:relative;overflow:hidden;
  ">`;

  // Curtain drapes (CSS pseudo-elements via inline divs)
  html += `<div style="position:absolute;top:0;left:0;right:0;height:60px;pointer-events:none;
    background:linear-gradient(180deg,
      #5c1515 0%, #4a1010 30%, #3a0a0a 60%, transparent 100%);
    mask-image:linear-gradient(180deg, black 0%, black 50%, transparent 100%);
    -webkit-mask-image:linear-gradient(180deg, black 0%, black 50%, transparent 100%);
  "></div>`;
  // Left curtain fold
  html += `<div style="position:absolute;top:0;left:0;width:30px;height:200px;pointer-events:none;
    background:linear-gradient(90deg, #6b1a1a 0%, #4a1010 40%, transparent 100%);
    opacity:0.6;
  "></div>`;
  // Right curtain fold
  html += `<div style="position:absolute;top:0;right:0;width:30px;height:200px;pointer-events:none;
    background:linear-gradient(-90deg, #6b1a1a 0%, #4a1010 40%, transparent 100%);
    opacity:0.6;
  "></div>`;
  // Stage floor (wood planks at bottom)
  html += `<div style="position:absolute;bottom:0;left:0;right:0;height:40px;pointer-events:none;
    background:linear-gradient(0deg, #3d2b1a 0%, #2a1c10 60%, transparent 100%);
    opacity:0.5;
  "></div>`;

  // Header
  html += `<div style="position:relative;z-index:1">
    <div class="rp-eyebrow" style="color:#8b6040">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:30px;letter-spacing:4px;text-align:center;
      color:#f0a500;text-shadow:0 0 40px rgba(240,165,0,0.5),0 0 80px rgba(240,165,0,0.2);
      margin-bottom:4px">THE TALENT SHOW</div>
    <div style="text-align:center;font-size:11px;color:#8b7060;margin-bottom:16px;letter-spacing:1px">
      CHEF SCORES EACH ACT 0–9 &nbsp;·&nbsp; HIGHEST TOTAL WINS IMMUNITY</div>`;

  // ═══ SCOREBOARD (gilded frame look) ═══
  html += `<div style="display:flex;justify-content:center;gap:20px;margin:0 auto 20px;padding:12px 20px;
    border-radius:8px;border:1px solid rgba(240,165,0,0.15);
    background:linear-gradient(135deg,rgba(240,165,0,0.04) 0%,rgba(0,0,0,0.3) 100%);
    box-shadow:inset 0 1px 0 rgba(240,165,0,0.1),0 4px 20px rgba(0,0,0,0.4)">`;
  Object.entries(revealedScores).forEach(([tribe, score], i, arr) => {
    const tc = tribeColor(tribe);
    const isWinner = allRevealed && tribe === ts.winner;
    html += `<div style="text-align:center;${isWinner ? 'text-shadow:0 0 15px ' + tc + ',0 0 30px ' + tc : ''}">
      <div style="font-family:var(--font-display);font-size:${isWinner ? '32' : '24'}px;color:${tc};font-weight:700;
        ${isWinner ? 'animation:scrollDrop 0.4s var(--ease-broadcast) both' : ''}">${score}</div>
      <div style="font-size:9px;color:${tc};opacity:0.7;letter-spacing:1px;text-transform:uppercase">${tribe}</div>
    </div>`;
    if (i < arr.length - 1) html += `<div style="font-size:18px;color:#3d2b1a;align-self:center">·</div>`;
  });
  html += `</div>`;

  // ═══ PER-ACT CARDS ═══
  ts.performances.forEach((perf, i) => {
    const isVisible = i <= state.idx;
    if (!isVisible) {
      // Dimmed placeholder — like an unlit stage
      html += `<div style="padding:20px;margin-bottom:8px;border-radius:10px;
        background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.04);
        text-align:center;color:#3d2b1a;font-size:12px;font-style:italic;
        letter-spacing:1px">Act ${i + 1} — waiting in the wings...</div>`;
      return;
    }

    const tc = tribeColor(perf.tribe);
    const isDisaster = perf.outcome === 'disaster';
    const isClutch = perf.outcome === 'clutch';
    const isSabotaged = perf.outcome === 'sabotaged' || !!perf.sabotageText || !!perf.sabotageType;
    const spotlightColor = isDisaster ? '#f85149' : isClutch ? '#f0a500' : isSabotaged ? '#da3633' : tc;

    // Act card with spotlight cone
    html += `<div style="position:relative;margin-bottom:12px;padding:20px;border-radius:12px;
      background:radial-gradient(ellipse 70% 120% at 50% -10%, ${spotlightColor}18 0%, transparent 70%),
        linear-gradient(180deg,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.4) 100%);
      border:1px solid ${spotlightColor}22;
      box-shadow:0 0 40px ${spotlightColor}08,inset 0 1px 0 rgba(255,255,255,0.03);
      animation:scrollDrop 0.4s var(--ease-broadcast) both">`;

    // Sabotage pre-card
    if (isSabotaged && (perf.sabotageText || perf.sabotageStageText)) {
      const _sabText = perf.sabotageStageText || perf.sabotageText;
      const _saboteur = ts.sabotage?.saboteur;
      html += `<div style="padding:12px;margin-bottom:14px;border-radius:8px;
        background:linear-gradient(135deg,rgba(218,54,51,0.12) 0%,rgba(218,54,51,0.04) 100%);
        border:1px solid rgba(218,54,51,0.25);
        box-shadow:0 0 20px rgba(218,54,51,0.08)">
        <div style="font-size:10px;font-weight:800;letter-spacing:2px;color:#da3633;margin-bottom:8px">🗡️ SABOTAGED BY ${(_saboteur || 'UNKNOWN').toUpperCase()}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          ${_saboteur ? rpPortrait(_saboteur, 'sm') : ''}
          <span style="font-size:11px;color:#da3633">→</span>
          ${rpPortrait(perf.name, 'sm')}
        </div>
        <div style="font-size:12px;color:#e6edf3;font-style:italic;line-height:1.5">${_sabText}</div>
      </div>`;
    }

    // ═══ PERFORMER: centered with spotlight glow ═══
    html += `<div style="text-align:center;margin-bottom:14px;position:relative">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        width:120px;height:120px;border-radius:50%;
        background:radial-gradient(circle,${spotlightColor}20 0%,${spotlightColor}08 40%,transparent 70%);
        pointer-events:none"></div>
      <div style="position:relative;display:inline-block;
        border-radius:12px;padding:4px;
        box-shadow:0 0 20px ${spotlightColor}30,0 0 60px ${spotlightColor}10;
        border:2px solid ${spotlightColor}30">
        ${rpPortrait(perf.name, 'md')}
      </div>
      <div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:#e6edf3;
        margin-top:8px;text-shadow:0 0 10px rgba(0,0,0,0.5)">${perf.name}</div>
      <div style="font-size:10px;color:${tc};letter-spacing:1px;text-transform:uppercase;margin-top:2px">${perf.tribe}</div>
      <div style="font-size:11px;color:#8b7060;margin-top:4px">${perf.talent}</div>
    </div>`;

    // Outcome badge (prominent, centered)
    if (isDisaster) {
      html += `<div style="text-align:center;margin-bottom:10px">
        <span style="font-size:11px;font-weight:800;letter-spacing:2px;color:#f85149;
          background:rgba(248,81,73,0.15);padding:5px 14px;border-radius:20px;
          border:1px solid rgba(248,81,73,0.3);
          box-shadow:0 0 15px rgba(248,81,73,0.15)">💥 DISASTER</span>
      </div>`;
    }
    if (isClutch) {
      html += `<div style="text-align:center;margin-bottom:10px">
        <span style="font-size:11px;font-weight:800;letter-spacing:2px;color:#f0a500;
          background:rgba(240,165,0,0.15);padding:5px 14px;border-radius:20px;
          border:1px solid rgba(240,165,0,0.3);
          box-shadow:0 0 15px rgba(240,165,0,0.15)">⭐ SURPRISE HIT</span>
      </div>`;
    }

    // 3-beat performance narrative
    const beats = perf.performanceBeats || (typeof perf.performanceText === 'string' ? [perf.performanceText] : perf.performanceText) || [''];
    beats.forEach((beat, bIdx) => {
      if (!beat) return;
      const delay = bIdx * 0.15;
      const opacity = bIdx === 0 ? '0.7' : bIdx === 2 ? '1' : '0.85';
      const size = bIdx === 1 ? '13px' : '11px'; // act text is larger
      html += `<div style="font-size:${size};color:#cdd9e5;text-align:center;line-height:1.7;
        margin-bottom:${bIdx < 2 ? '8' : '16'}px;font-style:italic;max-width:360px;margin-left:auto;margin-right:auto;
        opacity:${opacity};text-shadow:0 1px 2px rgba(0,0,0,0.3);
        animation:scrollDrop 0.3s var(--ease-broadcast) both;animation-delay:${delay}s">${beat}</div>`;
    });

    // ═══ CHEF-O-METER (spoon-style, bigger, bouncier) ═══
    const scoreColor = perf.chefScore >= 7 ? '#3fb950' : perf.chefScore >= 4 ? '#f0a500' : '#f85149';
    html += `<div style="display:flex;align-items:center;justify-content:center;gap:10px;
      margin-bottom:12px;padding:10px;border-radius:8px;
      background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.05)">
      <div style="font-size:28px;filter:drop-shadow(0 0 8px rgba(240,165,0,0.3))">👨‍🍳</div>
      <div style="display:flex;gap:3px;align-items:center">`;
    for (let seg = 0; seg < 9; seg++) {
      const filled = seg < perf.chefScore;
      const segBg = filled ? scoreColor : 'rgba(255,255,255,0.06)';
      const delay = filled ? seg * 0.08 : 0;
      html += `<div style="width:22px;height:18px;border-radius:3px;
        background:${segBg};
        ${filled ? `box-shadow:0 0 6px ${scoreColor}40;animation:scrollDrop 0.3s var(--ease-broadcast) both;animation-delay:${delay}s` : ''}
      "></div>`;
    }
    html += `</div>
      <div style="font-family:var(--font-display);font-size:24px;font-weight:800;
        color:${scoreColor};text-shadow:0 0 12px ${scoreColor}40;min-width:28px;text-align:center">${perf.chefScore}</div>
    </div>`;

    // ═══ AUDIENCE REACTIONS (speech bubbles that pop in) ═══
    if (perf.reactions?.length) {
      html += `<div style="margin-top:10px;padding-top:10px;
        border-top:1px solid rgba(255,255,255,0.04)">
        <div style="font-size:8px;font-weight:700;letter-spacing:1.5px;color:#3d2b1a;
          text-transform:uppercase;margin-bottom:8px;text-align:center">AUDIENCE</div>`;
      perf.reactions.forEach((r, rIdx) => {
        html += `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;
          animation:scrollDrop 0.25s var(--ease-broadcast) both;animation-delay:${0.5 + rIdx * 0.12}s">
          ${rpPortrait(r.name, 'xs')}
          <div style="position:relative;flex:1;padding:6px 10px;border-radius:8px;border-top-left-radius:2px;
            background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06)">
            <span style="font-size:10px;color:#a0a0a0;font-style:italic;line-height:1.4">${r.text}</span>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    html += `</div>`; // end act card
  });

  // ═══ FINAL RESULT ═══
  if (allRevealed) {
    const wTC = tribeColor(ts.winner);
    const lTC = tribeColor(ts.loser);
    html += `<div style="padding:20px;margin-top:14px;border-radius:12px;
      border:2px solid ${wTC};
      background:radial-gradient(ellipse at 50% 0%, ${wTC}15 0%, transparent 60%),
        linear-gradient(180deg,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.4) 100%);
      box-shadow:0 0 40px ${wTC}15;
      text-align:center;animation:scrollDrop 0.5s var(--ease-broadcast) both">
      <div style="font-family:var(--font-display);font-size:22px;letter-spacing:3px;
        color:${wTC};text-shadow:0 0 20px ${wTC},0 0 40px ${wTC}80;
        margin-bottom:6px">${ts.winner.toUpperCase()} WINS</div>
      <div style="font-size:12px;color:#8b949e;margin-bottom:8px">${ts.loser} goes to tribal council.</div>
      <div style="font-size:11px;color:#6e7681;margin-bottom:10px">
        Final: ${Object.entries(revealedScores).map(([t, s]) => {
          const tc2 = tribeColor(t);
          return `<span style="color:${tc2};font-weight:700">${t} ${s}</span>`;
        }).join(' <span style="color:#3d2b1a">·</span> ')}</div>
      ${ts.mvp ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06)">
        <div style="font-size:8px;font-weight:700;letter-spacing:1.5px;color:#f0a500;margin-bottom:6px">SHOW MVP</div>
        ${rpPortrait(ts.mvp, 'sm')}
        <div style="font-size:11px;color:#e6edf3;margin-top:4px">${ts.mvp}</div>
      </div>` : ''}
    </div>`;
  }

  // ═══ NEXT ACT BUTTON ═══
  if (!allRevealed) {
    html += `<div style="position:sticky;bottom:0;padding:14px 0;text-align:center;
      background:linear-gradient(transparent,#0a0710 25%)">
      <button class="rp-btn" style="background:linear-gradient(135deg,#f0a500,#d4900a);color:#000;font-weight:700;
        border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:12px;letter-spacing:1px;
        box-shadow:0 0 15px rgba(240,165,0,0.2)"
        onclick="${_tsReveal(state.idx + 1)}">NEXT ACT (${state.idx + 2}/${totalItems})</button>
      <button class="rp-btn rp-btn-secondary" onclick="${_tsReveal(totalItems - 1)}" style="margin-left:8px">REVEAL ALL</button>
    </div>`;
  }

  html += `</div>`; // close z-index wrapper
  html += `</div>`; // close rp-page
  return html;
}

