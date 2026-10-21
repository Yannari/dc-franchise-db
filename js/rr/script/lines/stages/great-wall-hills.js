// Great Wall Hills' challenges, stage by stage (js/rr/places/great-wall-hills.js `stages`; director.js stageBeats).
//   the skydive  the-door -> the-jump -> the-drift -> the-landing -> centre-tip      (All-In: both jump, each with an instructor)
//   the skewers  the-tray -> thread-em -> the-fryer -> eat-em -> empty-sticks        (All-In: one skewers and fries, one eats)
//   the rickshaw pick-up -> the-climb -> the-bump -> the-wall                        (Botch or Watch: a pulls, b rides)
// The wind carries a team off course and down outside the stadium; anything that comes back up means a fresh set; a
// passenger never gets out to push. The instructor and the street cook are the place's own locals.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the skydive ──
    { id: 'gwh.st.do1', when: at('skydive', 'the-door'), turns: [
      beat('The side door of the little plane slides open, and the wind roars in. Far below, the city looks like a map, and the stadium looks like a bowl.'),
      by('a', "That's where we're landing? That tiny bowl?"),
      by('b', "It's not tiny. It's just very, very far away."),
    ] },
    { id: 'gwh.st.do2', when: at('skydive', 'the-door'), turns: [
      by('b', "Are you strapped in? Tight?"),
      beat('{a}\'s instructor gives the straps a hard tug and a thumbs-up, and shuffles them both to the edge of the door.'),
      by('a', "I'm strapped to a stranger, and we're about to fall out of a plane together. This is so intimate."),
    ] },
    { id: 'gwh.st.ju1', when: at('skydive', 'the-jump'), turns: [
      beat('On three, the instructors jump, and {a} and {b} go out of the door with them, screaming all the way down.'),
      by('a', "Aaaaaaaaaaah!"),
      by('b', "Aaaaaaaaaaah! This is amazing! Aaaaaaah!"),
    ] },
    { id: 'gwh.st.ju2', when: at('skydive', 'the-jump'), turns: [
      by('b', "See you down there!"),
      beat('{b} tumbles out of the plane, and {a} follows one second later, arms and legs spread wide like a starfish.'),
      by('a', "My face is flapping! I can feel my whole face flapping!"),
    ] },
    { id: 'gwh.st.dr1', when: at('skydive', 'the-drift'), turns: [
      beat('The parachutes pop open with a huge jolt, and suddenly everything is quiet. They float down over the city, gently swinging.'),
      by('b', "Steer for the stadium. Pull left. No, the other left."),
      by('a', "The instructor's steering! I'm just a passenger! I'm luggage!"),
    ] },
    { id: 'gwh.st.dr2', when: at('skydive', 'the-drift'), turns: [
      by('a', "We're right over it. We're going to land right in the middle."),
      beat('The stadium grows bigger and bigger under them, until they can see the white lines on the green field.'),
      by('b', "This is the best thing I've ever done in my whole life."),
    ] },
    { id: 'gwh.st.la1', when: at('skydive', 'the-landing'), turns: [
      beat('{a}\'s feet touch the grass, run a few steps, and the parachute flops down behind like a giant tired jellyfish.'),
      by('a', "I landed! I'm on the ground! I love the ground!"),
      beat('{b} lands a few seconds later, much less gracefully, on {b.posAdj} bottom.'),
    ] },
    { id: 'gwh.st.la2', when: at('skydive', 'the-landing'), turns: [
      by('b', "Legs up, legs up, and... down."),
      beat('{b} lands right on the halfway line, stays standing, and throws both arms up in the air like a gymnast.'),
      by('a', "Show-off."),
    ] },
    { id: 'gwh.st.ct1', when: at('skydive', 'centre-tip'), turns: [
      beat('They unclip, shake hands with their instructors, and sprint to the tip box in the centre circle.'),
      by('b', "\"Make your way to the food stall.\" Food! I'm starving!"),
      by('a', "Me too. Jumping out of a plane really works up an appetite."),
    ] },
    { id: 'gwh.st.ct2', when: at('skydive', 'centre-tip'), turns: [
      by('a', "Can we do that again? Can we just do that again instead of the rest of the race?"),
      by('b', "No. Read the tip."),
      beat('{a} reads the tip, still grinning, with grass in {a.posAdj} hair.'),
    ] },

    // ── the skewers ──
    { id: 'gwh.st.tr1', when: at('skewers', 'the-tray'), turns: [
      beat('At the food stall, the cook pushes a tray across the counter: worms, scorpions, beetles and one seahorse, lined up neatly like party snacks.'),
      by('b', "Oh no. Oh no, no, no."),
      by('a', "I'll put them on the sticks. You eat them."),
      by('b', "Why do I always get the eating?"),
    ] },
    { id: 'gwh.st.tr2', when: at('skewers', 'the-tray'), turns: [
      by('a', "Look at them all. It's like a tiny zoo."),
      by('b', "It's a tiny zoo I have to eat, so please stop calling it a zoo."),
      beat('The cook hands {a} a bundle of bamboo sticks and nods at the tray.'),
    ] },
    { id: 'gwh.st.th1', when: at('skewers', 'thread-em'), turns: [
      beat('{a} threads a worm onto the first stick, then a scorpion, then a beetle, making a little kebab of nightmares.'),
      by('a', "It's like making a necklace. A horrible, crunchy necklace."),
      by('b', "Please don't describe it. Just do it quietly."),
    ] },
    { id: 'gwh.st.th2', when: at('skewers', 'thread-em'), turns: [
      by('a', "Two of each on every stick, like the photo."),
      beat('{a} works quickly and neatly, and the skewers pile up on the counter, each one exactly like the last.'),
      by('b', "You're weirdly good at that."),
    ] },
    { id: 'gwh.st.fr1', when: at('skewers', 'the-fryer'), turns: [
      beat('The skewers go into the hot oil with a huge, angry sizzle, and the bugs curl up and turn golden.'),
      by('b', "They actually smell good. Why do they smell good?"),
      by('a', "Everything smells good deep-fried. That's the trick."),
    ] },
    { id: 'gwh.st.fr2', when: at('skewers', 'the-fryer'), turns: [
      by('a', "Golden brown. Crispy. Just how you like them."),
      by('b', "I have never liked them. I've never had them."),
      beat('{a} lifts the skewers out of the oil and lays them on a plate in front of {b}.'),
    ] },
    { id: 'gwh.st.ea1', when: at('skewers', 'eat-em'), turns: [
      beat('{b} picks up the first skewer, closes {b.posAdj} eyes, and bites the scorpion off the end.'),
      by('b', "It's crunchy. It's like a crisp. A crisp with legs."),
      by('a', "Keep going! You've got this!"),
    ] },
    { id: 'gwh.st.ea2', when: at('skewers', 'eat-em'), turns: [
      by('a', "Just think of them as chicken. Very small chicken."),
      by('b', "Chicken doesn't have this many legs."),
      beat('{b} works through the skewers one by one, chewing fast and swallowing hard, until there\'s only one left.'),
    ] },
    { id: 'gwh.st.ea3', when: at('skewers', 'eat-em'), turns: [
      beat('{b} gets to the seahorse and stops.'),
      by('b', "It's so cute. I can't eat something so cute."),
      by('a', "It's fried. It's not cute anymore. It's lunch."),
      beat('{b} eats it, and says sorry to it first.'),
    ] },
    { id: 'gwh.st.es1', when: at('skewers', 'empty-sticks'), turns: [
      beat('{b} lays the last empty stick on the plate. The cook counts the sticks, nods, and slides over the tip.'),
      by('b', "I'm never eating anything again. Not even a sandwich."),
      by('a', "You were incredible. Read the tip and try not to burp."),
    ] },
    { id: 'gwh.st.es2', when: at('skewers', 'empty-sticks'), turns: [
      by('a', "\"Pull your partner by rickshaw to the wall.\" Pull? Like a horse?"),
      by('b', "You pull. I'm full of bugs. I need to sit down."),
      beat('They run for the rickshaws.'),
    ] },

    // ── the rickshaw ──
    { id: 'gwh.st.pu1', when: at('rickshaw', 'pick-up'), turns: [
      beat('A row of red-seated rickshaws waits at the bottom of the mountain road, and the road goes up, and up, and up.'),
      by('b', "I'll sit, and you'll pull. That's the rule."),
      by('a', "I didn't make that rule. Who made that rule?"),
    ] },
    { id: 'gwh.st.pu2', when: at('rickshaw', 'pick-up'), turns: [
      by('a', "Get in. Hold on. Don't wave at people."),
      beat('{b} climbs into the seat and settles back like royalty.'),
      by('b', "To the wall, please. And don't spare the horses."),
    ] },
    { id: 'gwh.st.cl1', when: at('rickshaw', 'the-climb'), turns: [
      beat('{a} leans into the handles and pulls. The rickshaw creaks, rolls, and starts up the hill, slowly and steadily.'),
      by('b', "Faster! The others are catching up!"),
      by('a', "You could be lighter! That would also help!"),
    ] },
    { id: 'gwh.st.cl2', when: at('rickshaw', 'the-climb'), turns: [
      by('b', "You're doing great. Left, right, left, right."),
      beat('{a} pulls up the long slope one step at a time, red-faced and puffing, with {b} counting out the rhythm.'),
      by('a', "Stop counting. Counting makes me want to stop."),
    ] },
    { id: 'gwh.st.bu1', when: at('rickshaw', 'the-bump'), turns: [
      beat('The road turns to broken stone. The rickshaw bounces and rattles over every crack, and {b} bounces with it.'),
      by('b', "Ow! Ow! Ow! You're hitting every bump!"),
      by('a', "There's nothing but bumps! The road is made of bumps!"),
    ] },
    { id: 'gwh.st.bu2', when: at('rickshaw', 'the-bump'), turns: [
      by('b', "Big hole on the left!"),
      beat('{a} swerves round the hole just in time, and the rickshaw tilts up on one wheel and comes back down with a bang.'),
      by('a', "Still in one piece? Both of us?"),
    ] },
    { id: 'gwh.st.wa1', when: at('rickshaw', 'the-wall'), turns: [
      beat('At the top of the road, the great wall rises out of the hills, winding away along the ridge in both directions.'),
      by('b', "Look at that! It goes on forever!"),
      by('a', "I'm not looking at anything. I'm lying down for one second."),
    ] },
    { id: 'gwh.st.wa2', when: at('rickshaw', 'the-wall'), turns: [
      by('b', "We made it. You pulled me all the way up a mountain."),
      by('a', "You owe me. You owe me so much."),
      beat('The tip says to walk along the wall to the Chill Zone, and they set off.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the skydive ──
    { id: 'gwh.sf.do1', when: at('skydive', 'the-door'), turns: [
      beat('{a} gets to the open door, looks down, and grabs both sides of the doorframe.'),
      by('a', "No. I've changed my mind. I want to go home."),
      by('b', "You can't go home! We're in a plane!"),
    ] },
    { id: 'gwh.sf.do2', when: at('skydive', 'the-door'), turns: [
      by('b', "Just a second. I need to say goodbye to everybody I've ever met."),
      beat('{b}\'s instructor waits. The plane circles round the city again, which costs them a whole lap.'),
      by('a', "Are you done? Have you said goodbye to your dentist yet?"),
    ] },
    { id: 'gwh.sf.dr1', when: at('skydive', 'the-drift'), turns: [
      beat('A gust of wind catches the parachute and carries {a} away from the stadium, over a road, and towards a car park.'),
      by('a', "Wrong way! The stadium's that way!"),
      by('b', "Tell the wind, not me!"),
    ] },
    { id: 'gwh.sf.dr2', when: at('skydive', 'the-drift'), turns: [
      by('a', "Are we going to make it?"),
      beat('They do not make it. They float gently down into a park outside the stadium, right next to a family having a picnic.'),
      by('b', "Sorry! Hello! We have to run!"),
    ] },
    { id: 'gwh.sf.la1', when: at('skydive', 'the-landing'), turns: [
      beat('{b} hits the grass running, trips over the parachute lines, and rolls across the field like a burrito.'),
      by('b', "I'm okay! I'm wrapped up, but I'm okay!"),
      by('a', "Hold still. I'll unroll you."),
    ] },
    { id: 'gwh.sf.la2', when: at('skydive', 'the-landing'), turns: [
      by('a', "Legs up! Legs up!"),
      beat('{a} forgets to put {a.posAdj} legs up and lands bottom first, sliding across the grass for several metres.'),
      by('a', "That was the plan. That was totally the plan."),
    ] },

    // ── the skewers ──
    { id: 'gwh.sf.tr1', when: at('skewers', 'the-tray'), turns: [
      beat('One of the scorpions on the tray twitches its tail.'),
      by('b', "That one moved! That one is alive!"),
      by('a', "It's not alive. It's just... settling."),
    ] },
    { id: 'gwh.sf.tr2', when: at('skewers', 'the-tray'), turns: [
      by('b', "I'm not eating anything that's looking at me."),
      beat('{b} turns every single bug on the tray round so that it faces away, which takes a very long time.'),
      by('a', "Are you done?"),
    ] },
    { id: 'gwh.sf.th1', when: at('skewers', 'thread-em'), turns: [
      beat('{a} pushes the stick through a beetle, and it flies off the end, bounces off the counter and lands in somebody\'s soup at the next stall.'),
      by('a', "Sorry! Very sorry! That's mine!"),
      by('b', "You don't want it back. Get a new one."),
    ] },
    { id: 'gwh.sf.th2', when: at('skewers', 'thread-em'), turns: [
      by('a', "Ow! It pinched me! The scorpion pinched me!"),
      by('b', "It's dead!"),
      by('a', "It doesn't know that!"),
    ] },
    { id: 'gwh.sf.fr1', when: at('skewers', 'the-fryer'), turns: [
      beat('{a} leaves the skewers in the oil a bit too long, and they come out black, smoking, and shrivelled into little crunchy commas.'),
      by('b', "I'm not eating charcoal. Fry a new batch."),
      by('a', "It's extra crispy! People pay extra for extra crispy!"),
    ] },
    { id: 'gwh.sf.fr2', when: at('skewers', 'the-fryer'), turns: [
      by('a', "How long do they go in for?"),
      beat('The cook holds up two fingers. {a} thinks it means two minutes. It meant twenty seconds, and the skewers are ruined.'),
      by('b', "Start again. Watch the cook's fingers this time."),
    ] },
    { id: 'gwh.sf.ea1', when: at('skewers', 'eat-em'), turns: [
      beat('{b} gets the worm down, and the beetle, and then the scorpion, and then all of it comes straight back up.'),
      by('b', "I'm sorry! It was the legs! It was all the legs!"),
      beat('The cook sighs, and slides a fresh tray of bugs across to {a}.'),
    ] },
    { id: 'gwh.sf.ea2', when: at('skewers', 'eat-em'), turns: [
      by('a', "Why have you stopped?"),
      by('b', "There's one more on the stick, and I can't do it. I physically can't."),
      beat('{b} leaves one beetle on the last stick, which means the whole set has to be done again.'),
    ] },

    // ── the rickshaw ──
    { id: 'gwh.sf.cl1', when: at('rickshaw', 'the-climb'), turns: [
      beat('Halfway up the steepest bit, {a}\'s legs stop. The rickshaw stops too, and then starts rolling slowly backwards.'),
      by('b', "Backwards! We're going backwards!"),
      by('a', "I know! I can feel it! I'm trying!"),
    ] },
    { id: 'gwh.sf.cl2', when: at('rickshaw', 'the-climb'), turns: [
      by('b', "Can I get out and push?"),
      by('a', "No! It's against the rules! Sit down!"),
      beat('{a} sits down on the road for a breather, still holding the handles, while another team pulls past them.'),
    ] },
    { id: 'gwh.sf.bu1', when: at('rickshaw', 'the-bump'), turns: [
      beat('The rickshaw hits a big crack in the road, and one of the wheels pops off and goes rolling down the hill without them.'),
      by('b', "Our wheel! Our wheel is leaving!"),
      by('a', "Stay there. Don't get out. I'll go and get it."),
    ] },
    { id: 'gwh.sf.bu2', when: at('rickshaw', 'the-bump'), turns: [
      by('a', "Hold on tight!"),
      beat('{a} hits a pothole at full speed, the rickshaw tips over on its side, and {b} rolls out onto the road.'),
      by('b', "I'm out! Does that count as getting out? I didn't mean to get out!"),
    ] },
  ],
};
