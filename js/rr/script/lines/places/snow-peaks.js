// Snow Peaks' own lines (js/rr/places/snow-peaks.js), in our own words:
//   the cable car  up the mountain: it stops halfway, swinging.
//   the sausage    All-In: crank a mountain of meat into one giant sausage, sit on it, ride it down the slope round the
//                  goats; a split sausage, a goat or a fall off the back and it's up the hill to grind another.
//   the slap dance Botch or Watch: in lederhosen on a light-up pad, stamp and slap to the arrows; a buzz for every wrong
//                  step, three misses and the song starts again. a dances, b watches.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'snow-peaks' };
const SG = { taskId: 'sausage' };
const SD = { taskId: 'slap-dance' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'snp.op1', when: P, turns: [
      beat("Don stands on a snowy mountaintop in a wool jumper with a reindeer on it, a cowbell clanking somewhere behind him."),
      don("Welcome to Snow Peaks! Land of chocolate, cheese, cuckoo clocks, and mountains so pretty they look fake. I checked. They're real."),
      don("Today, teams make a sausage the size of a canoe and ride it down this mountain. Then they dance. In leather shorts. I fought for this leg."),
      beat('A cow with a huge bell round its neck wanders past behind him, clanking.'),
    ] },
    { id: 'snp.op2', when: P, turns: [
      don("Snow Peaks. Clean air, clean streets, and trains that run on time to the second. I've never felt so badly organised in my life."),
      don("Racers, take the cable car up the mountain. It's perfectly safe. It's only stopped halfway once today."),
      beat('Above him, a cable car glides up the wire.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'snp.op3', when: P, turns: [
      beat("Don sits in a mountain hut by the window, a pot of melted cheese bubbling in front of him, dipping bread on a long fork."),
      don("Snow Peaks. I have cheese. You have a cable car. Off you go."),
      don("Off you go, racers!"),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'snp.ar1', when: P, turns: [
      beat("The cable car rises over the trees, and the mountains appear all round them: white peaks, blue sky, a green valley far below."),
      by('a', "It's like a postcard. It's like being inside a postcard."),
      by('b', "There's a little village down there. It looks like a toy."),
      by('a', "I want to live there."),
    ] },
    { id: 'snp.ar2', when: P, turns: [
      by('b', "Listen. Can you hear the cowbells? From all the way down there?"),
      by('a', "Every cow in the valley has a bell."),
      by('b', "That's the most peaceful noise I've ever heard."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'snp.ad1', when: P, turns: [
      by('a', "The tip says 'sausage'. And then it says 'slope'."),
      by('b', "Why are those two words next to each other?"),
      by('a', "I'm scared to find out."),
    ] },
    { id: 'snp.ad2', when: P, turns: [
      by('b', "'Who has rhythm?' You have rhythm."),
      by('a', "Only at weddings."),
      by('b', "That still counts."),
    ] },
  ],
};

// ── the cable car (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'snp.tm1', when: { taskId: 'cable-car', mishap: 'cable-car-stops' }, turns: [
      beat("Halfway up the mountain, the cable car jolts and stops, swinging gently over a very long drop."),
      by('a', "Why have we stopped? Why are we swinging?"),
      by('b', "Don't look down. Whatever you do, don't look down."),
      beat('Twenty very long minutes later, the cable car jerks, and climbs again.'),
    ] },
  ],
};

// ── the giant sausage (All-In) ──
const sausage = {
  'don-demo.gag': [
    { id: 'snp.sg-d1', when: SG, turns: [
      don("In this All-In, crank this mountain of meat through the grinder into one giant sausage, long enough for both of you to sit on."),
      beat('He turns the grinder handle once, then lets go and wipes his hand on a cloth.'),
      don("Then you ride it down the slope. Like a sled. Made of sausage. I didn't invent it. I just love it."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'snp.sg-d2', when: SG, turns: [
      don("If your sausage splits, if you hit a goat, or if either of you falls off the back, you climb back up and make a new sausage."),
      don("Cross the line at the bottom, both of you on the sausage, and the next tip is yours. The goats don't move. Plan around the goats."),
      beat('A mountain goat on the slope watches a sausage slide past, completely unbothered.'),
    ] },
  ],
  'task-start.any': [
    { id: 'snp.sg-s1', when: SG, turns: [
      beat("{a} cranks the grinder while {b} feeds in the meat, and slowly, very slowly, a sausage starts to grow."),
      by('a', "This is so weird."),
      by('b', "Keep cranking. It needs to be as long as both of us."),
    ] },
    { id: 'snp.sg-s2', when: SG, turns: [
      by('b', "How long is long enough?"),
      by('a', "Long enough that we both fit on it, and don't fall off."),
      by('b', "Okay. Really long."),
    ] },
    { id: 'snp.sg-s3', when: SG, turns: [
      beat("{a} and {b} carry their sausage out of the hut like a log, and lay it at the top of the slope."),
      by('a', "Front or back?"),
      by('b', "Front. I want to see where we're going."),
    ] },
    { id: 'snp.sg-s4', when: SG, turns: [
      by('a', "Steer with your feet. Left foot down, go left. Right foot down, go right."),
      by('b', "Are you sure?"),
      by('a', "No! Just try it!"),
    ] },
  ],
  'task-try.first-try': [
    { id: 'snp.sg-f1', when: SG, turns: [
      beat("{a} and {b} push off, and the sausage flies down the slope, swerving round one goat, two goats, and over the line."),
      by('b', "We did it! We made it down!"),
      by('a', "First try! Did you see me steer round that goat?"),
    ] },
    { id: 'snp.sg-f2', when: SG, turns: [
      by('a', "Lean left! Lean left!"),
      beat("They lean left together, and the sausage swings round a goat by a whisker and slides across the finish."),
      by('b', "We missed it! Just!"),
    ] },
    { id: 'snp.sg-f3', when: SG, turns: [
      beat("Their sausage is so long and so straight that it slides down the mountain like a toboggan, perfectly."),
      by('b', "We made the perfect sausage!"),
      by('a', "I'm actually proud of that."),
    ] },
    { id: 'snp.sg-f4', when: SG, turns: [
      by('b', "First go! No goats hit!"),
      by('a', "I'm never eating a sausage again."),
      by('b', "But we did it."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'snp.sg-a1', when: SG, turns: [
      by('b', "It split because we packed it too full. This time, a bit less meat."),
      beat("A bit less meat, a bit more care, and the second sausage holds all the way down the slope."),
      by('a', "Less meat worked!"),
    ] },
    { id: 'snp.sg-a2', when: SG, turns: [
      beat("Third ride. {a} and {b} hold on so tight to the sausage and each other that nothing could knock them off. They cross the line."),
      by('a', "We stayed on! We actually stayed on!"),
      by('b', "I'm covered in snow and meat, but we stayed on!"),
    ] },
    { id: 'snp.sg-a3', when: SG, turns: [
      by('a', "We keep hitting that goat. So we go right. Way right. Away from the goat."),
      beat("They go way right, miss the goat by a mile, and slide over the line."),
      by('b', "We missed it!"),
    ] },
    { id: 'snp.sg-a4', when: SG, turns: [
      beat("{a} ties both ends of the new sausage twice, and this one survives every bump on the way down."),
      by('a', "Double knots! Double knots on everything!"),
      by('b', "Finally."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'snp.sg-t1', when: SG, turns: [
      beat("{a} has been cranking the grinder for twenty minutes, and the sausage is about the length of a shoe."),
      by('a', "That's it? That's all twenty minutes made?"),
      by('b', "Crank faster! I'll feed faster!"),
    ] },
    { id: 'snp.sg-t2', when: SG, turns: [
      by('b', "The goat. The goat's standing right in the middle. Again."),
      by('a', "Why does it always stand there?"),
      by('b', "I don't know. Just go round it."),
    ] },
    { id: 'snp.sg-t3', when: SG, turns: [
      beat("The sausage is spinning slowly in circles halfway down the slope, {a} and {b} still sitting on it."),
      by('a', "Why are we going round?"),
      by('b', "Stick your feet out! Steer!"),
    ] },
  ],
  'task-done.any': [
    { id: 'snp.sg-dn1', when: SG, turns: [
      by('a', "I smell like a butcher's shop."),
      by('b', "On a ski slope."),
      by('a', "We both smell like meat."),
    ] },
    { id: 'snp.sg-dn2', when: SG, turns: [
      beat("{a} and {b} jog away from the slope, leaving their sausage behind in the snow."),
      by('b', "Should we take it?"),
      by('a', "No. Leave it."),
    ] },
    { id: 'snp.sg-dn3', when: SG, turns: [
      by('b', "Dancing next. In leather shorts."),
      by('a', "Is that worse than the sausage?"),
      by('b', "We're about to find out."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'snp.sg-x1', when: SG, turns: [
      beat("Halfway down the slope, the sausage splits open with a pop, and {a} and {b} slide off into the snow."),
      by('a', "It burst! Our sausage burst!"),
      by('b', "Back up! Grind another!"),
    ] },
    { id: 'snp.sg-x2', when: SG, turns: [
      beat("The sausage slides straight into a goat. The goat doesn't move, the sausage stops, and {a} and {b} fly off the front."),
      by('b', "The goat! We hit the goat!"),
      by('a', "Back to the top! Again!"),
    ] },
    { id: 'snp.sg-x3', when: SG, turns: [
      beat("{b} slides off the back of the sausage halfway down, and {a} crosses the line alone."),
      by('a', "Did we do it? Where are you?"),
      by('b', "Up here! It has to be both of us! Back up!"),
    ] },
  ],
};

// ── the slap dance (Botch or Watch: a dances, b watches) ──
const slap = {
  'don-demo.gag': [
    { id: 'snp.sd-d1', when: SD, turns: [
      don("In this Botch or Watch, put on these leather shorts, step onto the dance pad, and do the mountain's slap dance. Stamp the arrows, slap your thighs, slap your shoes."),
      beat('He steps onto a pad to show them, misses the first arrow, and jumps as a small buzz goes through him.'),
      don("Ow. Every wrong step gives you a little buzz. That was a little buzz. It felt like a big buzz."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'snp.sd-d2', when: SD, turns: [
      don("Three misses in one song, and the song starts again. The other one of you can only watch!"),
      don("Finish a song with fewer than three misses, and the next tip is yours. It's a very fast song."),
      beat('The music starts behind him: an accordion, playing very, very fast.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'snp.sd-w1', when: SD, turns: [
      by('b', "You did the last one? No, I did. So it's you."),
      by('a', "Do I have to?"),
      by('b', "Put on the shorts."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'snp.sd-w2', when: SD, turns: [
      by('a', "I'll do it. I'm great at the dancing game at the arcade."),
      by('b', "The arcade game doesn't shock you."),
      by('a', "Then I'll be careful."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'snp.sd-w3', when: SD, turns: [
      by('b', "I'm not wearing leather shorts. Absolutely not. You."),
      by('a', "Why is it always me in the costume?"),
      by('b', "Because you're better at dancing."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'snp.sd-w4', when: SD, turns: [
      by('a', "'Who has rhythm?' You were in a band."),
      by('b', "I played the triangle."),
      by('a', "That still counts."),
    ] },
  ],
  'task-start.any': [
    { id: 'snp.sd-s1', when: SD, turns: [
      beat("{a} steps onto the dance pad in leather shorts and long socks, and looks down at the arrows lighting up."),
      by('a', "Do I look ridiculous?"),
      by('b', "A bit. Dance anyway."),
    ] },
    { id: 'snp.sd-s2', when: SD, turns: [
      by('b', "Watch the screen, not your feet. Your feet will figure it out."),
      by('a', "I'll try."),
      by('b', "Just watch the screen."),
    ] },
    { id: 'snp.sd-s3', when: SD, turns: [
      beat("The accordion music starts. {a} stamps, slaps a thigh, slaps a shoe, and misses the next arrow completely."),
      by('a', "Ow! It's fast! It's so fast!"),
      by('b', "Keep going! That's only one!"),
    ] },
    { id: 'snp.sd-s4', when: SD, turns: [
      by('a', "Which is the slap? The slap after the stamp, or before?"),
      by('b', "After. Stamp, slap, slap, stamp."),
      by('a', "Stamp, slap, slap, stamp."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'snp.sd-f1', when: SD, turns: [
      beat("{a} stamps and slaps through the whole song without missing a single arrow. The crowd of locals cheers."),
      by('b', "Not one buzz! Not one!"),
      by('a', "I did it! I actually did it!"),
    ] },
    { id: 'snp.sd-f2', when: SD, turns: [
      by('a', "Two misses! Only two!"),
      beat("The song ends. Two misses. The judge nods, and hands over the tip."),
      by('b', "Two is less than three! You did it!"),
    ] },
    { id: 'snp.sd-f3', when: SD, turns: [
      beat("{a} gets into the rhythm and starts adding extra slaps and spins of {a.posAdj} own, and the locals clap along."),
      by('b', "You're showing off now!"),
      by('a', "I'm feeling it!"),
    ] },
    { id: 'snp.sd-f4', when: SD, turns: [
      by('b', "First song. Done. And you looked amazing."),
      by('a', "Did I?"),
      by('b', "You looked like you were having fun."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'snp.sd-a1', when: SD, turns: [
      by('b', "You're watching your feet. Watch the screen. Only the screen."),
      beat("{a} watches only the screen. One miss. Then none. The song ends."),
      by('a', "One miss! Watching the screen worked!"),
    ] },
    { id: 'snp.sd-a2', when: SD, turns: [
      beat("Third song. {a} is red from slapping, sweating in the snow, and finally finishes with only two buzzes."),
      by('a', "Two! Only two!"),
      by('b', "Your thighs are bright red! But you did it!"),
    ] },
    { id: 'snp.sd-a3', when: SD, turns: [
      by('a', "I'm going to count out loud. Stamp, slap, slap, stamp. Every beat."),
      beat("{a} counts every beat out loud, the whole way through, and only misses once."),
      by('b', "Counting worked!"),
    ] },
    { id: 'snp.sd-a4', when: SD, turns: [
      beat("After two failed songs, {a} finally stops thinking and just dances, and gets through with one miss."),
      by('a', "I stopped thinking! Thinking was the problem!"),
      by('b', "That's it! You did it!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'snp.sd-t1', when: SD, turns: [
      beat("{a} is a beat behind on every arrow, slapping the wrong thigh at the wrong time."),
      by('a', "I can't keep up! The accordion is too fast!"),
      by('b', "Just keep going!"),
    ] },
    { id: 'snp.sd-t2', when: SD, turns: [
      by('b', "That's the fourth time you've started the song."),
      by('a', "I know. I'm trying."),
      by('b', "You're getting closer every time."),
    ] },
    { id: 'snp.sd-t3', when: SD, turns: [
      beat("{a} gets a buzz, jumps, lands on the wrong arrow, and gets another buzz."),
      by('a', "No! No!"),
      by('b', "Breathe! Find the beat again!"),
    ] },
  ],
  'task-done.any': [
    { id: 'snp.sd-dn1', when: SD, turns: [
      by('a', "My thighs. My poor thighs."),
      by('b', "You slapped them very hard."),
      by('a', "I know. They really hurt."),
    ] },
    { id: 'snp.sd-dn2', when: SD, turns: [
      beat("{a} walks off the stage still in the leather shorts, getting a round of applause from the locals."),
      by('b', "They loved you!"),
      by('a', "I'm actually going to miss the shorts."),
    ] },
    { id: 'snp.sd-dn3', when: SD, turns: [
      by('b', "That accordion is going to be stuck in my head forever."),
      by('a', "Stamp, slap, slap, stamp."),
      by('b', "Come on. Let's go."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'snp.sd-x1', when: SD, turns: [
      beat("Buzz. Buzz. Buzz. Three misses in the first ten seconds. The music stops."),
      by('a', "That was fast! That was so fast!"),
      by('b', "Again! From the start!"),
    ] },
    { id: 'snp.sd-x2', when: SD, turns: [
      beat("{a} slaps so hard on one beat that {a} loses balance and falls off the pad completely."),
      by('a', "I fell off!"),
      by('b', "It counts as three misses! Again!"),
    ] },
    { id: 'snp.sd-x3', when: SD, turns: [
      beat("{a} makes it to the last few arrows with two misses, then misses the very last one. Buzz."),
      by('a', "The last one! The very last one!"),
      by('b', "So close! Again!"),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'snp.sd-v1', when: SD, turns: [
      by('b', "Go on! Slap it! Slap it like you mean it!"),
      by('a', "I am slapping it like I mean it!"),
      by('b', "Harder!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'snp.sd-v2', when: SD, turns: [
      beat("{b} flinches every time the pad buzzes, as if {b} is the one being shocked."),
      by('b', "Ow. Sorry. That looked painful."),
      by('a', "Why are you saying ow? I'm the one getting buzzed!"),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'snp.sd-v3', when: SD, turns: [
      beat("{b} jumps onto the second pad and starts dancing alongside {a} to show the steps."),
      by('b', "Copy me! Copy me!"),
      beat('The judge stops the music and points {b} off the stage. A penalty.'),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'snp.sd-v4', when: SD, turns: [
      beat("{b} watches without a word, mouthing the steps along with every arrow."),
      by('a', "Are you counting?"),
      by('b', "Every beat."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'snp.sd-h1', when: SD, turns: [
      beat("While the judge looks at his watch, {b} claps the beat, very quietly, from the side of the stage."),
      by('a', "Keep clapping! It helps!"),
      by('b', "Okay. I'll keep clapping."),
    ] },
  ],
};

export default mergePools(place, roads, sausage, slap);
