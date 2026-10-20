// Pampas Ranch's own lines (js/rr/places/pampas-ranch.js), 1:1 with the real legs ("Last Tango", "Ice Dancers"), in our
// own words:
//   the taxi       to the academy: a parade in the street.
//   the dance      All-In: the close embrace, the sharp turns, the leg flicks, the dip; danced for the instructor until
//                  she claps.
//   the emu        Botch or Watch: on horseback, swing the boleadoras and wrap them gently round the emu's legs; a miss,
//                  a fall or a tangle in the grass and it's back for the ropes. a rides, b watches from the fence.
//   the walk       leading the emu to the cliff: it runs off.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'pampas-ranch' };
const TG = { taskId: 'tango' };
const EM = { taskId: 'emu' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'pmp.op1', when: P, turns: [
      beat("Don stands in a cobbled street outside a dance hall, a rose between his teeth, which he takes out to speak."),
      don("Welcome to Pampas Ranch! A city of passion, music and steak, and beyond it, grass as far as the eye can see. And emus. So many emus."),
      don("Today, teams dance, then ride, then catch a bird with a rope. I've been told it doesn't hurt the bird. I've also been told that about dancing."),
      beat('He tries a dramatic dance turn on the cobbles, catches his heel, and recovers with great dignity.'),
    ] },
    { id: 'pmp.op2', when: P, turns: [
      don("Pampas Ranch. The dance here is slow, close, and dramatic. The men are slow, close and dramatic. Even the waiters are dramatic."),
      don("Racers, taxis to the dance academy. Wear something you can move in. Or don't. Rip a seam. It's dramatic."),
      beat('Accordion music swells from a café behind him. A waiter places a coffee in his hand, dramatically.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'pmp.op3', when: P, turns: [
      beat("Don sits on a fence on the open grassland, a gaucho's flat hat on his head, chewing a long piece of grass."),
      don("Pampas Ranch. Lots of grass. Lots of sky. Taxis are in the city."),
      don("Go dance. Then come back and catch my emu. It's the one that keeps staring at me."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'pmp.ar1', when: P, turns: [
      beat("The taxi rolls through streets of brightly painted walls, and through every open window comes the sound of an accordion."),
      by('a', "Everybody's dancing. On the street. In the middle of the day."),
      by('b', "It's like the whole city is one big dance hall."),
      by('a', "I've never wanted to dance so much in my life."),
    ] },
    { id: 'pmp.ar2', when: P, turns: [
      beat("Out on the grassland, the sky is enormous, the grass is gold, and in the distance, a line of emus is running."),
      by('b', "Look at them go. They're so fast."),
      by('a', "And we have to catch one. On a horse."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'pmp.ad1', when: P, turns: [
      by('a', "The tip says 'dance'. In front of a teacher. Who'll judge us."),
      by('b', "You dance at every wedding."),
      by('a', "That's not dancing. That's waving my arms after cake."),
    ] },
    { id: 'pmp.ad2', when: P, turns: [
      by('b', "'Who can ride a horse?' I've never been on a horse."),
      by('a', "Have you been near a horse?"),
      by('b', "I've seen one on television."),
    ] },
  ],
};

// ── the taxi and the walk (mishaps) ──
const roads = {
  'travel-mishap.any': [
    { id: 'pmp.tm1', when: { taskId: 'academy-taxi', mishap: 'parade-in-the-street' }, turns: [
      beat("The taxi turns a corner straight into a parade: drums, flags, dancers, and absolutely no way through."),
      by('a', "Can we go round it?"),
      by('b', "It's the whole street. It is the street now."),
      beat('Twenty minutes later, the last drummer passes, and the taxi pushes on.'),
    ] },
    { id: 'pmp.tm2', when: { taskId: 'emu-walk', mishap: 'emu-runs-off' }, turns: [
      beat("Halfway to the cliff, the emu sees something in the grass, pulls its rope out of {a}'s hands, and runs."),
      by('a', "Come back! We just caught you!"),
      by('b', "Run! After it! It's faster than us, but run!"),
      beat('Twenty minutes later, they find it standing in a puddle, looking pleased with itself.'),
    ] },
  ],
};

// ── the dance (All-In) ──
const dance = {
  'don-demo.gag': [
    { id: 'pmp.tg-d1', when: TG, turns: [
      don("In this All-In, learn the famous dance. The close embrace, the turns, the flicks, the dip at the end. Then dance it for the instructor."),
      beat("The instructor sweeps Don into a dance, spins him twice, and dips him so low his hair touches the floor."),
      don("I wasn't ready. I wasn't ready for that. Can somebody help me up?"),
    ] },
  ],
  'don-demo.dry': [
    { id: 'pmp.tg-d2', when: TG, turns: [
      don("A wrong step, a stumble, or a dip that ends on the floor, and you go back to the lessons and try again."),
      don("When the instructor claps, the tip is yours. She has never clapped for me. I'm not bitter. I'm a little bitter."),
      beat('The instructor, behind him, crosses her arms and does not clap.'),
    ] },
  ],
  'task-start.any': [
    { id: 'pmp.tg-s1', when: TG, turns: [
      beat("{a} and {b} stand in front of the mirrors, holding each other the way the instructor showed them. Very close. Very stiffly."),
      by('a', "This feels very close."),
      by('b', "It's supposed to be close. Stop leaning backwards."),
    ] },
    { id: 'pmp.tg-s2', when: TG, turns: [
      by('b', "Slow, slow, quick, quick, slow. That's the whole thing."),
      by('a', "Which bit is the quick bit?"),
      by('b', "The quick bit is the bit after the slow bit."),
    ] },
    { id: 'pmp.tg-s3', when: TG, turns: [
      beat("{a} tries the leg flick and kicks {b} sharply in the shin."),
      by('b', "Ow! Flick the air! Not me!"),
      by('a', "You were in the air!"),
    ] },
    { id: 'pmp.tg-s4', when: TG, turns: [
      by('a', "Look at me with passion. She said passion."),
      by('b', "This is my passion face."),
      by('a', "That's your sneezing face."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'pmp.tg-f1', when: TG, turns: [
      beat("The music starts, and {a} and {b} glide across the floor, turn, flick, and end in a perfect dip. The instructor claps once, sharply."),
      by('b', "She clapped! She clapped!"),
      by('a', "Did you see my flick? Did everybody see my flick?"),
    ] },
    { id: 'pmp.tg-f2', when: TG, turns: [
      by('a', "Don't think. Just feel it. Just feel the music."),
      beat("They stop thinking. They feel the music. The instructor smiles, and claps."),
      by('b', "We felt it! We actually felt it!"),
    ] },
    { id: 'pmp.tg-f3', when: TG, turns: [
      beat("{a} dips {b} at the end so dramatically that a rose falls out of nowhere onto the floor."),
      by('b', "Where did the rose come from?"),
      by('a', "Doesn't matter. She's clapping."),
    ] },
    { id: 'pmp.tg-f4', when: TG, turns: [
      by('b', "First try! We're dancers! Real dancers!"),
      by('a', "We should do this at the next wedding."),
      by('b', "We're doing this at every wedding, forever."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'pmp.tg-a1', when: TG, turns: [
      by('b', "She said we looked scared. So, no more scared. We look at each other like we mean it."),
      beat("They look at each other like they mean it, and dance it all the way through. The instructor claps."),
      by('a', "Like we mean it! That was the whole secret!"),
    ] },
    { id: 'pmp.tg-a2', when: TG, turns: [
      beat("This time {a} counts out loud, under {a.posAdj} breath, the whole way through, and doesn't miss a single step."),
      by('a', "Slow, slow, quick, quick, slow, and dip!"),
      beat("The dip holds. The instructor claps. The tip is theirs."),
    ] },
    { id: 'pmp.tg-a3', when: TG, turns: [
      by('a', "We keep falling on the dip. So I lean, and you hold. You don't lean. You just hold."),
      beat("{b} holds. {a} leans. The dip is perfect, and the instructor applauds."),
      by('b', "I'm holding! I'm a holder! I'm a natural holder!"),
    ] },
    { id: 'pmp.tg-a4', when: TG, turns: [
      beat("The instructor takes {b}'s place for one run-through, showing {a} every step, then steps back. The next try is perfect."),
      by('a', "One lesson from her, and suddenly I can dance."),
      by('b', "Suddenly I'm jealous."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'pmp.tg-t1', when: TG, turns: [
      beat("{a} and {b} are going in opposite directions, still holding hands, like a door that won't close."),
      by('a', "Which way are we going?"),
      by('b', "I'm going left! You're supposed to go left too!"),
    ] },
    { id: 'pmp.tg-t2', when: TG, turns: [
      by('b', "I can't do the flick. My leg doesn't flick."),
      by('a', "Everyone's leg flicks."),
      by('b', "Mine thuds."),
    ] },
    { id: 'pmp.tg-t3', when: TG, turns: [
      beat("The instructor watches them, sighs, and shakes her head before they've even finished."),
      by('a', "She didn't even let us finish."),
      by('b', "She didn't need to. She could tell."),
    ] },
  ],
  'task-done.any': [
    { id: 'pmp.tg-dn1', when: TG, turns: [
      by('a', "I want to take lessons when we get home."),
      by('b', "You hated it for the first hour."),
      by('a', "And loved it for the last five minutes. That's how love works."),
    ] },
    { id: 'pmp.tg-dn2', when: TG, turns: [
      beat("{a} and {b} leave the dance academy still holding hands, still doing tiny steps down the street."),
      by('b', "We can stop dancing now."),
      by('a', "I can't. My feet won't stop."),
    ] },
    { id: 'pmp.tg-dn3', when: TG, turns: [
      by('b', "Horses next. And emus. And ropes."),
      by('a', "From dancing to catching birds. What a day."),
      by('b', "What a strange, strange day."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'pmp.tg-x1', when: TG, turns: [
      beat("{a} goes for the dip, {b} goes for a turn, and both of them end up on the floor."),
      by('a', "That was not the dip."),
      by('b', "That was a fall. Back to the lesson."),
    ] },
    { id: 'pmp.tg-x2', when: TG, turns: [
      beat("They finish the dance, breathless, arms up. The instructor shakes her head and points at the mirrors."),
      by('b', "What was wrong?"),
      by('a', "She says it was 'polite'. Apparently polite is bad."),
    ] },
    { id: 'pmp.tg-x3', when: TG, turns: [
      beat("{b} steps on {a}'s foot, then the other foot, and they stop in the middle of the routine."),
      by('a', "Both feet! You got both feet!"),
      by('b', "Again. From the start. I'll look down this time."),
    ] },
  ],
};

// ── the emu (Botch or Watch: a rides, b watches from the fence) ──
const emu = {
  'don-demo.gag': [
    { id: 'pmp.em-d1', when: EM, turns: [
      don("In this Botch or Watch, ride out on horseback and catch your team's emu with these. Boleadoras: three weights on a rope. Swing, throw, wrap the legs."),
      beat('He swings the boleadoras over his head, lets go, and they wrap round his own legs. He falls over very slowly.'),
      don("Like that. But round the emu. Not round you. That's important."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'pmp.em-d2', when: EM, turns: [
      don("Miss, fall off the horse, or tangle the ropes in the grass, and you ride back to the gaucho for another go. The other one of you watches from the fence."),
      don("Wrap them gently, so the emu stops, not falls. Bring your emu back on a lead, and you get the next tip."),
      beat("The gaucho, behind him, demonstrates. One throw. The emu stops dead, unhurt and a bit embarrassed."),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'pmp.em-w1', when: EM, turns: [
      by('b', "You did the last one? No. I did. So you're riding."),
      by('a', "I've never been on a horse."),
      by('b', "Well, now you'll have been on one."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'pmp.em-w2', when: EM, turns: [
      by('a', "I'll ride. I went pony trekking when I was ten."),
      by('b', "Did you stay on?"),
      by('a', "Most of the time."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'pmp.em-w3', when: EM, turns: [
      by('b', "The horse looked at me. It looked at me like it didn't like me. You go."),
      by('a', "It looked at me the same way."),
      by('b', "It looked at you nicer."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'pmp.em-w4', when: EM, turns: [
      by('a', "'Who can ride a horse?' That's you. You had riding lessons."),
      by('b', "Twice. I had two riding lessons."),
      by('a', "That's two more than me."),
    ] },
  ],
  'task-start.any': [
    { id: 'pmp.em-s1', when: EM, turns: [
      beat("{a} climbs onto the horse, swings the boleadoras over {a.posAdj} head, and immediately drops them."),
      by('a', "They're heavier than they look."),
      by('b', "Everything's heavier than it looks. Pick them up!"),
    ] },
    { id: 'pmp.em-s2', when: EM, turns: [
      by('b', "Ride up beside it. Not behind it. Beside it."),
      by('a', "How do I make the horse go beside things?"),
      by('b', "Ask it nicely?"),
    ] },
    { id: 'pmp.em-s3', when: EM, turns: [
      beat("{a}'s horse trots out onto the grass. The emu watches it come, completely calm, and then runs."),
      by('a', "It's running! It's so fast!"),
      by('b', "Follow it! Swing!"),
    ] },
    { id: 'pmp.em-s4', when: EM, turns: [
      by('a', "What if I hit it? What if I hurt it?"),
      by('b', "Aim for the legs. Low and gentle."),
      by('a', "Low and gentle. On a moving horse. At a moving bird."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'pmp.em-f1', when: EM, turns: [
      beat("{a} swings once, twice, and lets go. The boleadoras spin through the air and wrap neatly round the emu's legs. It stops."),
      by('a', "I got it! I got it first throw!"),
      by('b', "You're a gaucho! You're an actual gaucho!"),
    ] },
    { id: 'pmp.em-f2', when: EM, turns: [
      by('b', "Now! Throw it now!"),
      beat("{a} throws on {b}'s shout. The emu stops, looks down at its legs, and looks back at {a}, offended."),
      by('a', "Sorry! Sorry! You're caught!"),
    ] },
    { id: 'pmp.em-f3', when: EM, turns: [
      beat("{a} rides alongside the emu, matches its speed, and drops the boleadoras right round its legs. The gaucho whistles."),
      by('b', "He whistled! The gaucho whistled at you!"),
      by('a', "That's the best compliment I've ever had."),
    ] },
    { id: 'pmp.em-f4', when: EM, turns: [
      by('a', "First throw. I'm a natural."),
      by('b', "You've never even seen an emu before today."),
      by('a', "A natural."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'pmp.em-a1', when: EM, turns: [
      by('b', "You keep throwing too high. Throw at its knees."),
      beat("{a} throws at its knees. The ropes wrap round, gently, and the emu stops."),
      by('a', "Knees! Emus have knees!"),
    ] },
    { id: 'pmp.em-a2', when: EM, turns: [
      beat("Third ride out. {a} stops chasing, lets the horse walk, and waits for the emu to come closer before throwing."),
      by('a', "Let it come to you. Then throw."),
      beat("The emu comes closer. {a} throws. The emu is caught."),
    ] },
    { id: 'pmp.em-a3', when: EM, turns: [
      by('a', "I watched the gaucho. He swings it slower. Not fast. Slow, and then let go."),
      beat("{a} swings it slow, and lets go. The boleadoras wrap round the emu's legs."),
      by('b', "Slow works! Why does slow always work?"),
    ] },
    { id: 'pmp.em-a4', when: EM, turns: [
      beat("After falling off the horse once and missing three times, {a} finally gets the emu."),
      by('a', "Got it! Finally got it!"),
      by('b', "You're covered in grass! But you got it!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'pmp.em-t1', when: EM, turns: [
      beat("{a}'s horse has stopped to eat grass and won't go anywhere, while the emu stands just out of reach, watching."),
      by('a', "Move, horse! The emu's right there!"),
      by('b', "It's eating! Wait for it to finish!"),
    ] },
    { id: 'pmp.em-t2', when: EM, turns: [
      by('b', "That's the fifth miss."),
      by('a', "I know. I've been counting too."),
      by('b', "The emu's been counting. It looks smug."),
    ] },
    { id: 'pmp.em-t3', when: EM, turns: [
      beat("The boleadoras are tangled round the horse's saddle. {a} is trying to untangle them while the horse walks in circles."),
      by('a', "I've caught the horse. I've caught my own horse."),
      by('b', "Untangle it! Quickly!"),
    ] },
  ],
  'task-done.any': [
    { id: 'pmp.em-dn1', when: EM, turns: [
      by('a', "Now we walk it to the cliff. On a lead."),
      by('b', "Like a dog."),
      by('a', "A very big, very angry dog."),
    ] },
    { id: 'pmp.em-dn2', when: EM, turns: [
      beat("{a} and {b} walk away across the grassland, leading the emu on a rope, the emu walking very proudly ahead."),
      by('b', "It's leading us."),
      by('a', "As long as it's going the right way."),
    ] },
    { id: 'pmp.em-dn3', when: EM, turns: [
      by('b', "We caught an emu. With a rope. From a horse."),
      by('a', "I'm putting that on my CV."),
      by('b', "Under 'skills'."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'pmp.em-x1', when: EM, turns: [
      beat("{a} throws the boleadoras. They sail right over the emu's head and land in the grass."),
      by('a', "Too high! Way too high!"),
      by('b', "Ride back for another set!"),
    ] },
    { id: 'pmp.em-x2', when: EM, turns: [
      beat("{a}'s horse stops suddenly. {a} doesn't, and slides off over its head into the grass."),
      by('a', "I'm fine! The grass is soft!"),
      by('b', "Get back on! The emu's getting away!"),
    ] },
    { id: 'pmp.em-x3', when: EM, turns: [
      beat("The boleadoras wrap round a bush instead of the emu, and the emu runs off laughing. Well, it looks like laughing."),
      by('a', "I caught a bush."),
      by('b', "We don't need a bush! Back for the ropes!"),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'pmp.em-v1', when: EM, turns: [
      by('b', "You can do it! You're a cowboy! A gaucho! A cowboy-gaucho!"),
      by('a', "Stop shouting! You're scaring the emu!"),
      by('b', "The emu should be scared! You're coming for it!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'pmp.em-v2', when: EM, turns: [
      beat("{b} grips the fence with both hands, watching {a} bounce in the saddle."),
      by('b', "Hold on. Hold on with your knees. Please hold on."),
      by('a', "I am holding on! It's just very bouncy!"),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'pmp.em-v3', when: EM, turns: [
      beat("{b} climbs over the fence and runs out to chase the emu towards {a}."),
      by('b', "I'll push it to you! Get ready!"),
      beat('The gaucho shouts something sharp and points {b} back behind the fence. A penalty.'),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'pmp.em-v4', when: EM, turns: [
      beat("{b} sits on the fence without a word, chewing a piece of grass, eyes never leaving {a}."),
      by('a', "Are you watching?"),
      by('b', "Every second. I don't trust that horse."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'pmp.em-h1', when: EM, turns: [
      beat("While the gaucho isn't looking, {b} tosses a handful of grain over the fence, right where {a} is waiting."),
      by('a', "The emu's coming straight to me! Why?"),
      by('b', "No idea! Lucky! Throw!"),
    ] },
  ],
};

export default mergePools(place, roads, dance, emu);
