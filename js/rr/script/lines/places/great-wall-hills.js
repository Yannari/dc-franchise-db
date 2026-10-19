// Great Wall Hills' own lines (js/rr/places/great-wall-hills.js), 1:1 with the real leg ("New Beijinging"), written in
// our own words:
//   the skydive   All-In: strapped to an instructor, out of a little plane, into the stadium; the wind takes some
//                 teams to a car park instead.
//   the skewers   All-In: one partner threads and fries worms, scorpions and beetles, the other eats every one.
//   the rickshaw  Botch or Watch: one pulls the other up the mountain road to the wall; a wheel comes off, a driver
//                 finds every bump.
//   the wall      the wrong direction along the wall.
// Gated on place / taskId / mishap. a does the Botch, b rides.
import { V, mergePools } from './_kit.js';

const P = { place: 'great-wall-hills' };
const SK = { taskId: 'skydive' };
const SW = { taskId: 'skewers' };
const RK = { taskId: 'rickshaw' };
const don = say => ({ by: 'don', say });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'gwh.op1', when: P, turns: [
      { beat: 'Don stands on a watchtower on the great wall, the mountains rolling away behind him.' },
      don("Great Wall Hills! Home of the longest wall in the world, delicious street food, and a lot of stairs nobody warned me about."),
      don("Today our teams drop in from the sky, eat things they've never eaten, and pull each other up a mountain."),
      { beat: 'He sits down heavily on the wall.' },
      don("I walked up here. I'm getting a rickshaw down."),
    ] },
    { id: 'gwh.op2', when: P, turns: [
      don("Welcome to Great Wall Hills, home of ancient history, beautiful mountains, and food on sticks that looks back at you."),
      { beat: 'A street vendor offers him a skewer of something crunchy. He waves it away politely.' },
      don("No, thank you. I'm saving myself for the teams' reactions. Racers, your next Don Box is waiting!"),
    ] },
  ],
  'don-opener.bored': [
    { id: 'gwh.op3', when: P, turns: [
      { beat: 'Don stands in an enormous empty stadium, looking very small.' },
      don("Great Wall Hills. Huge wall, huge mountains, huge stadium. And one very important host."),
      don("Teams will be landing in here today. From a plane. Some of them in the right place."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'gwh.ar1', when: P, turns: [
      { beat: 'Through the cab window, the wall winds away over the mountains as far as they can see.' },
      { by: 'a', ...V("Look at it. It goes on forever. It just doesn't stop.", "It goes on forever.", "It never stops.", "LOOK at it! It goes on FOREVER! It just DOESN'T STOP!", "Look at it, it just goes on forever.", "It's a wall that forgot to end.") },
      { by: 'b', say: "Imagine building that. By hand." },
      { by: 'a', say: "Imagine walking it. Which we're probably about to do." },
    ] },
    { id: 'gwh.ar2', when: P, turns: [
      { by: 'b', say: "Smell that. Everything's frying. The whole street is frying something." },
      { by: 'a', say: "I'm starving." },
      { by: 'b', say: "Remember you said that. Remember it later." },
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'gwh.ad1', when: P, turns: [
      { beat: 'A small plane is waiting on the airfield, propellers already turning.' },
      { by: 'a', say: "Why is there a plane? We just got off a plane." },
      { by: 'b', ...V("That's a different plane. That's a jumping-out plane.", "That's a jumping-out plane.", "That one's for jumping.", "That's a DIFFERENT plane! That's a JUMPING-OUT plane!", "That's a different plane. It looks like a jumping-out plane.", "That plane has a door that stays open.") },
    ] },
    { id: 'gwh.ad2', when: P, turns: [
      { by: 'b', say: "Look at the stalls. Is that a scorpion? On a stick?" },
      { by: 'a', say: "Don't look at the stalls. Whatever you do, don't look at the stalls." },
      { by: 'b', say: "It's waving at me. The scorpion is waving." },
    ] },
  ],
};

// ── the skydive into the stadium ──
const skydive = {
  'don-demo.gag': [
    { id: 'gwh.sk-d1', when: SK, turns: [
      don("In this All-In, both partners make a tandem skydive into the stadium, where their next tip is waiting on the field."),
      { beat: 'Don is strapped to an instructor at the open door of the plane. He is gripping the door frame with both hands.' },
      don("I'm just showing them the harness. I'm not jumping. Why are you counting? Don't count!"),
    ] },
  ],
  'don-demo.dry': [
    { id: 'gwh.sk-d2', when: SK, turns: [
      don("Jump, steer for the stadium, land on the field, get your tip. Simple."),
      don("Watch out for the wind. Land outside the stadium and you'll be running in through the car park. With a parachute."),
      { beat: 'A gust of wind takes his hat clean off his head and over the stadium wall.' },
    ] },
  ],
  'task-start.any': [
    { id: 'gwh.sk-s1', when: SK, turns: [
      { beat: '{a} and {b} sit by the open door of the plane, each strapped to an instructor. The ground is a long way down.' },
      { by: 'a', say: "Whatever happens, I love you. Platonically. Or however we are." },
      { by: 'b', ...V("Don't say goodbye things! Why are you saying goodbye things?", "No goodbye things!", "Don't say that!", "DON'T say GOODBYE things! WHY are you saying GOODBYE things?", "Don't say goodbye things, why are you saying goodbye things?", "Save the farewell speech for the ground!") },
    ] },
    { id: 'gwh.sk-s2', when: SK, turns: [
      { by: 'b', say: "How do we steer?" },
      { by: 'a', say: "The instructor steers. We just scream." },
      { by: 'b', say: "I can do that. I'm very good at that." },
    ] },
    { id: 'gwh.sk-s3', when: SK, turns: [
      { beat: 'The instructor taps {a} on the shoulder. It\'s time.' },
      { by: 'a', say: "Now? Right now? Can I have a minute?" },
      { beat: 'There is no minute. Out they go.' },
    ] },
    { id: 'gwh.sk-s4', when: SK, turns: [
      { by: 'a', say: "Look for the stadium. It's the giant round thing." },
      { by: 'b', say: "Everything's a giant round thing from up here." },
      { by: 'a', say: "Then aim for the round thing with the people in it." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gwh.sk-f1', when: SK, turns: [
      { beat: 'Two parachutes open, and {a} and {b} float down right into the middle of the stadium.' },
      { by: 'b', ...V("That was the best thing that's ever happened to me!", "Best thing ever!", "Amazing!", "That was the BEST thing that's EVER happened to me!", "That was honestly the best thing that's ever happened to me!", "I've flown! I've actually flown!") },
      { by: 'a', say: "My legs are shaking. My whole body is shaking. Let's do it again." },
    ] },
    { id: 'gwh.sk-f2', when: SK, turns: [
      { by: 'a', say: "We landed! We landed in the stadium!" },
      { by: 'b', say: "I landed on my face, but I landed in the stadium." },
      { by: 'a', say: "Your face counts." },
    ] },
    { id: 'gwh.sk-f3', when: SK, turns: [
      { beat: '{a} touches down so gently it looks like {a.sub} stepped off a kerb.' },
      { by: 'b', say: "How did you do that? I bounced. I bounced twice." },
      { by: 'a', say: "I just kept my knees bent. Like the instructor said." },
    ] },
    { id: 'gwh.sk-f4', when: SK, turns: [
      { beat: '{a} and {b} land a few seconds apart, gather their parachutes and sprint for the tip on the centre spot.' },
      { by: 'b', say: "We just jumped out of a plane!" },
      { by: 'a', say: "And we can tell everyone at home we did it first try!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gwh.sk-a1', when: SK, turns: [
      { beat: 'The wind carries {a} and {b} right over the stadium wall and into a car park.' },
      { by: 'b', say: "We missed! We missed the whole stadium!" },
      { by: 'a', ...V("Then we run in! Grab the parachute and run!", "Grab the chute and run!", "Run in! Go!", "Then we RUN in! GRAB the parachute and RUN!", "Then we run in, grab the parachute and run!", "To the stadium, on foot, like common peasants!") },
    ] },
    { id: 'gwh.sk-a2', when: SK, turns: [
      { by: 'a', say: "We landed in a park. There's a man doing tai chi." },
      { by: 'b', say: "Ask him the way to the stadium." },
      { beat: 'The man points without stopping his tai chi. They run.' },
    ] },
    { id: 'gwh.sk-a3', when: SK, turns: [
      { beat: '{a} and {b} come through the stadium gates on foot, dragging their parachutes like enormous capes.' },
      { by: 'b', say: "Everybody else landed in here." },
      { by: 'a', say: "And we got to see the car park. Not everybody can say that." },
    ] },
    { id: 'gwh.sk-a4', when: SK, turns: [
      { by: 'b', say: "My parachute's tangled in a tree." },
      { by: 'a', say: "Unclip it! Leave it! Run!" },
      { beat: 'They leave the parachute in the tree and run for the stadium.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'gwh.sk-t1', when: SK, turns: [
      { beat: '{b} is still at the door of the plane, holding on to both sides of it.' },
      { by: 'b', say: "I can't! I can't let go! My hands won't let go!" },
      { by: 'a', say: "Your instructor is very patient, but the plane is running out of fuel!" },
    ] },
    { id: 'gwh.sk-t2', when: SK, turns: [
      { by: 'a', say: "Which way is the stadium? I can't see it! I can only see clouds!" },
      { by: 'b', ...V("Follow the other parachutes!", "Follow the others!", "Follow them!", "FOLLOW the OTHER parachutes!", "Just follow the other parachutes!", "Follow the herd of parachutes!") },
      { by: 'a', say: "Which ones? There are four of them, and they're all going different ways!" },
    ] },
    { id: 'gwh.sk-t3', when: SK, turns: [
      { beat: '{a} and {b} are drifting further and further from the stadium.' },
      { by: 'a', say: "The wind hates us. The wind has always hated us." },
      { by: 'b', say: "Pull left! Tell your instructor to pull left!" },
    ] },
  ],
  'task-done.any': [
    { id: 'gwh.sk-dn1', when: SK, turns: [
      { beat: '{a} and {b} pull the tip from the Don Box on the centre spot.' },
      { by: 'a', say: "Next stop, a food stall. Something on a stick." },
      { by: 'b', ...V("Food! I'm so hungry after that!", "Food! I'm starving!", "Food. Good.", "FOOD! I'm SO hungry after that!", "Food! I'm honestly starving after that!", "Sustenance! At last!") },
      { by: 'a', say: "It says exotic food. Exotic." },
    ] },
    { id: 'gwh.sk-dn2', when: SK, turns: [
      { by: 'b', say: "I've never done anything that scary in my life." },
      { by: 'a', say: "And now we never have to do it again." },
      { by: 'b', say: "Don't say never. This show hears never." },
    ] },
    { id: 'gwh.sk-dn3', when: SK, turns: [
      { beat: 'Their instructors pack up the parachutes. {a} and {b} are still grinning like children.' },
      { by: 'a', say: "Can we keep our helmets?" },
      { by: 'b', say: "We're in a race. Run." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gwh.sk-x1', when: SK, turns: [
      { beat: 'A gust swings {a} wide, over the stadium roof and away.' },
      { by: 'a', say: "Noooo! The stadium! It's going! It's leaving!" },
      { by: 'b', say: "The stadium isn't leaving! You are!" },
    ] },
    { id: 'gwh.sk-x2', when: SK, turns: [
      { beat: '{a} and {b} land in a pond just outside the stadium, with a splash.' },
      { by: 'b', ...V("We're in a pond. We jumped out of a plane into a pond.", "We're in a pond.", "A pond.", "We're in a POND! We jumped out of a PLANE into a POND!", "We're in a pond. We jumped out of a plane into a pond.", "We've landed in a pond. The ducks are judging us.") },
      { by: 'a', say: "At least it was soft." },
    ] },
    { id: 'gwh.sk-x3', when: SK, turns: [
      { beat: '{a} lands on the roof of a bus, which keeps driving.' },
      { by: 'a', say: "Stop the bus! Somebody stop the bus!" },
      { by: 'b', say: "Jump! Jump off the bus!" },
    ] },
  ],
};

// ── the skewers ──
const skewers = {
  'don-demo.gag': [
    { id: 'gwh.sw-d1', when: SW, turns: [
      don("In this All-In, one of you threads these local delicacies onto skewers and fries them. The other one eats them. All of them."),
      { beat: 'He picks up a skewer of scorpions, looks at it, and slowly puts it back down.' },
      don("They're very good for you. I'm told. By people who were paid to say it."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'gwh.sw-d2', when: SW, turns: [
      don("Worms. Scorpions. Beetles. Thread them, fry them, eat them. When the stall owner sees empty sticks, you get your tip."),
      don("And if it comes back up, you start again. With fresh worms."),
      { beat: 'Behind him, something on the tray is still moving.' },
    ] },
  ],
  'task-start.any': [
    { id: 'gwh.sw-s1', when: SW, turns: [
      { beat: '{a} picks up a worm between two fingers. It wriggles.' },
      { by: 'a', say: "It's alive. It's still alive." },
      { by: 'b', ...V("Then hurry up and fry it so it's not!", "Fry it, then!", "Fry it!", "Then HURRY UP and FRY it so it's NOT!", "Then hurry up and fry it so it isn't!", "Then end its suffering! And mine!") },
    ] },
    { id: 'gwh.sw-s2', when: SW, turns: [
      { by: 'b', say: "Who's eating?" },
      { by: 'a', say: "You're eating. I'm cooking. I've always been the cook." },
      { by: 'b', say: "You've never cooked anything in your life." },
      { by: 'a', say: "Then today's my first day." },
    ] },
    { id: 'gwh.sw-s3', when: SW, turns: [
      { beat: 'The tray is covered in things with too many legs.' },
      { by: 'b', say: "I'll eat anything except the scorpions." },
      { by: 'a', say: "It's mostly scorpions." },
    ] },
    { id: 'gwh.sw-s4', when: SW, turns: [
      { by: 'a', say: "Don't think of them as bugs. Think of them as crisps." },
      { by: 'b', say: "Crisps don't have faces." },
      { by: 'a', say: "Then don't look at the faces. Look at the money." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gwh.sw-f1', when: SW, turns: [
      { beat: '{b} eats the whole set without stopping, one crunch after another.' },
      { by: 'b', ...V("They taste like chicken. Crunchy chicken.", "Crunchy chicken.", "Like chicken.", "They taste like CHICKEN! CRUNCHY chicken!", "They honestly taste like crunchy chicken.", "They taste like chicken that went to war.") },
      { by: 'a', say: "You're a monster. I'm so proud of you." },
    ] },
    { id: 'gwh.sw-f2', when: SW, turns: [
      { by: 'a', say: "Eat them fast. Don't chew. Just swallow." },
      { beat: '{b} doesn\'t chew. {b} just swallows. All of them.' },
      { by: 'b', say: "I'm never going to tell my mother about this." },
    ] },
    { id: 'gwh.sw-f3', when: SW, turns: [
      { beat: '{b} eats a fried scorpion and then reaches for another without being asked.' },
      { by: 'a', say: "Are you enjoying that?" },
      { by: 'b', say: "I'm enjoying it a little bit, and I'm very confused about it." },
    ] },
    { id: 'gwh.sw-f4', when: SW, turns: [
      { by: 'b', say: "Done. Every stick. Look." },
      { by: 'a', say: "You didn't even pull a face." },
      { by: 'b', say: "I pulled a face on the inside." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gwh.sw-a1', when: SW, turns: [
      { beat: '{b} gets halfway through the second set before turning green.' },
      { by: 'a', say: "Hold it! Hold it in! Think of the money!" },
      { by: 'b', ...V("I'm thinking of the money and it's not helping!", "The money isn't helping!", "Not helping!", "I'm THINKING of the MONEY and it's NOT HELPING!", "I'm thinking of the money and it really isn't helping!", "The money cannot save me now!") },
      { beat: '{b} holds it in. Just.' },
    ] },
    { id: 'gwh.sw-a2', when: SW, turns: [
      { by: 'a', say: "Swap. You cook, I'll eat. You've done enough." },
      { by: 'b', say: "Is that allowed?" },
      { by: 'a', say: "It's allowed. Give me the sticks." },
      { beat: '{a} eats the next set in one go, and the stall owner nods.' },
    ] },
    { id: 'gwh.sw-a3', when: SW, turns: [
      { beat: 'Third set. {b} has a technique now: hold nose, eat, drink water, repeat.' },
      { by: 'b', say: "Hold nose. Eat. Water. Hold nose. Eat. Water." },
      { by: 'a', say: "It's like a dance. A horrible dance." },
    ] },
    { id: 'gwh.sw-a4', when: SW, turns: [
      { by: 'a', say: "Fry them longer. If they're really crunchy, you can't tell what they are." },
      { beat: 'The extra-crunchy scorpions go down much easier.' },
      { by: 'b', say: "You're a genius. A horrible genius." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'gwh.sw-t1', when: SW, turns: [
      { beat: '{b} is staring at a single worm on a stick, and has been for some time.' },
      { by: 'a', say: "It's just one worm. You've eaten twenty." },
      { by: 'b', say: "This one is looking at me." },
    ] },
    { id: 'gwh.sw-t2', when: SW, turns: [
      { by: 'b', ...V("I can't do another one. My mouth won't open.", "My mouth won't open.", "Can't do another.", "I CAN'T do another one! My MOUTH won't OPEN!", "I can't do another one, my mouth won't open.", "My mouth has gone on strike.") },
      { by: 'a', say: "Then I'll put it in. Open up. Here comes the aeroplane." },
      { by: 'b', say: "Don't you dare do the aeroplane." },
    ] },
    { id: 'gwh.sw-t3', when: SW, turns: [
      { beat: 'Team after team finishes and leaves. {a} and {b} are on their fourth set.' },
      { by: 'a', say: "We're the last ones at the stall." },
      { by: 'b', say: "Then we've got the best stall all to ourselves." },
    ] },
  ],
  'task-done.any': [
    { id: 'gwh.sw-dn1', when: SW, turns: [
      { beat: 'The stall owner looks at the empty sticks, then at {b}\'s face, and hands over the tip with a kind smile.' },
      { by: 'b', say: "The stall owner smiled at me. That's sympathy. That's a sympathy smile." },
      { by: 'a', say: "That's respect. Take the respect." },
    ] },
    { id: 'gwh.sw-dn2', when: SW, turns: [
      { by: 'a', say: "Rickshaw. Whoever didn't do the last Botch pulls the other one." },
      { by: 'b', ...V("I just ate twenty bugs. I'm not pulling anything.", "I just ate twenty bugs.", "I ate bugs. Not pulling.", "I just ATE twenty BUGS! I'm NOT pulling ANYTHING!", "I just ate twenty bugs, I'm not pulling anything.", "I've done my duty. Bugs were my duty.") },
      { by: 'a', say: "Then sit in the back. You've earned the back." },
    ] },
    { id: 'gwh.sw-dn3', when: SW, turns: [
      { beat: '{b} rinses {b.posAdj} mouth out with a whole bottle of water.' },
      { by: 'b', say: "Can you still smell it? On my breath?" },
      { by: 'a', say: "I'm going to stand over here, and you're going to stand over there." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gwh.sw-x1', when: SW, turns: [
      { beat: '{b} takes one bite, turns, and runs for the bin behind the stall.' },
      { by: 'a', say: "Fresh set, please. Sorry. Fresh set." },
      { by: 'b', say: "Make them crunchier. Please make them crunchier." },
    ] },
    { id: 'gwh.sw-x2', when: SW, turns: [
      { beat: '{a} drops the whole set of skewers in the hot oil, and they come out black.' },
      { by: 'a', say: "Burnt. They're burnt." },
      { by: 'b', say: "Good. Now I can't see their faces." },
    ] },
    { id: 'gwh.sw-x3', when: SW, turns: [
      { by: 'b', say: "There's one left. One." },
      { by: 'a', say: "Then eat it!" },
      { beat: '{b} drops it on the floor. The stall owner hands over a fresh full set.' },
    ] },
  ],
};

// ── the rickshaw (Botch or Watch) ──
const rickshaw = {
  'don-demo.gag': [
    { id: 'gwh.rk-d1', when: RK, turns: [
      don("In this Botch or Watch, whoever didn't do the last one pulls their partner in a rickshaw, all the way up the mountain road to the wall."),
      { beat: 'He sits in a rickshaw while an intern strains to pull it. It doesn\'t move.' },
      don("Pull, Josh. Pull! Put your back into it! Josh is very weak."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'gwh.rk-d2', when: RK, turns: [
      don("The road is steep and full of holes. Hit one too hard, and a wheel comes off. And passengers, no getting out to push. That's cheating."),
      { beat: 'He gives the rickshaw wheel a kick. It wobbles alarmingly.' },
      don("That's normal. Probably."),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'gwh.rk-w1', when: RK, turns: [
      { by: 'b', say: "It's pulling. You're the strong one. You carry the shopping." },
      { by: 'a', ...V("I carry the shopping because you won't.", "Because you won't.", "You won't carry it.", "I carry the SHOPPING because you WON'T!", "I carry the shopping because you never will.", "I carry the shopping because I'm the only one with arms.") },
      { by: 'b', say: "Exactly. Practice." },
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'gwh.rk-w2', when: RK, turns: [
      { by: 'a', say: "I'll pull. Get in. Sit back. Enjoy the view." },
      { by: 'b', say: "That's the nicest thing you've said all race." },
      { by: 'a', say: "Don't get used to it. It's only because you ate all those bugs." },
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'gwh.rk-w3', when: RK, turns: [
      { by: 'a', say: "You pull. I'm getting in." },
      { by: 'b', ...V("I've got bugs in my stomach! I can't pull!", "I'm full of bugs!", "Bugs! In me!", "I've got BUGS in my STOMACH! I CAN'T pull!", "I've got bugs in my stomach, I can't pull anything!", "My stomach is a bug zoo! I can't pull!") },
      { by: 'a', say: "Then pull carefully." },
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'gwh.rk-w4', when: RK, turns: [
      { by: 'b', say: "'Who has the legs for it?' Legs. It's going to be running." },
      { by: 'a', say: "Or climbing. Or kicking. Legs do lots of things." },
      { by: 'b', say: "Then it's you. You've got the better legs." },
    ] },
  ],
  'task-start.any': [
    { id: 'gwh.rk-s1', when: RK, turns: [
      { beat: '{b} climbs into the rickshaw and {a} picks up the poles.' },
      { by: 'b', say: "To the wall, please. And don't spare the horses." },
      { by: 'a', ...V("I'm the horses. I'm all the horses.", "I'm the horses.", "I'm the horse.", "I'm the HORSES! I'm ALL the HORSES!", "I'm the horses, though. I'm all of them.", "There are no horses. There is only me.") },
    ] },
    { id: 'gwh.rk-s2', when: RK, turns: [
      { beat: 'The road starts going up almost at once.' },
      { by: 'a', say: "Why is it uphill? Why is everything on this race uphill?" },
      { by: 'b', say: "Because the wall's at the top." },
    ] },
    { id: 'gwh.rk-s3', when: RK, turns: [
      { by: 'b', say: "Is it comfortable back here? It's very comfortable back here." },
      { by: 'a', say: "Don't. Don't talk about the comfort." },
      { by: 'b', say: "Okay. I'll enjoy it quietly." },
    ] },
    { id: 'gwh.rk-s4', when: RK, turns: [
      { beat: '{a} takes off at a sprint, and {b} grabs the sides to stay in.' },
      { by: 'b', say: "Pace yourself! It's a mountain!" },
      { by: 'a', say: "I'm pacing myself! This is the pace!" },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gwh.rk-f1', when: RK, turns: [
      { beat: '{a} pulls steadily up the mountain road, never stopping, while {b} calls out the bumps.' },
      { by: 'b', say: "Hole on the left! Rock on the right! Smooth for a bit!" },
      { by: 'a', say: "You're a very good passenger." },
    ] },
    { id: 'gwh.rk-f2', when: RK, turns: [
      { by: 'b', ...V("You're doing amazing! I've barely felt a bump!", "Barely a bump!", "Smooth ride!", "You're doing AMAZING! I've BARELY felt a BUMP!", "You're doing amazing, I've hardly felt a single bump!", "Five stars! I'm leaving a review!") },
      { by: 'a', say: "I'll take a tip. A real one. Money." },
      { beat: 'They reach the foot of the wall with the rickshaw in one piece.' },
    ] },
    { id: 'gwh.rk-f3', when: RK, turns: [
      { beat: '{a} overtakes two other rickshaws on the steepest part of the road.' },
      { by: 'b', say: "We're passing people! Wave at them!" },
      { by: 'a', say: "You wave. I'm busy being a horse." },
    ] },
    { id: 'gwh.rk-f4', when: RK, turns: [
      { by: 'a', say: "Talk to me. Tell me a story. It helps." },
      { by: 'b', say: "Once upon a time, someone pulled a rickshaw up a mountain and won a million dollars." },
      { by: 'a', say: "Good story. Keep going." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gwh.rk-a1', when: RK, turns: [
      { beat: 'A wheel drops into a pothole and comes clean off. {a} and {b} stare at it.' },
      { by: 'b', say: "Can you fix it?" },
      { by: 'a', say: "I can push it back on and hope." },
      { beat: 'Pushed back on and hoped for, the wheel holds the rest of the way.' },
    ] },
    { id: 'gwh.rk-a2', when: RK, turns: [
      { by: 'a', say: "I need to stop. Just for one second." },
      { by: 'b', ...V("You can stop. I'll sing to you.", "Stop. I'll sing.", "I'll sing.", "You can STOP! I'll SING to you!", "You can stop for a second. I'll sing to you.", "Rest, and I'll sing you a rickshaw ballad.") },
      { by: 'a', say: "That's not the encouragement you think it is." },
      { beat: 'Under threat of singing, {a} keeps going.' },
    ] },
    { id: 'gwh.rk-a3', when: RK, turns: [
      { beat: '{b} keeps leaning out to look at the view, and the rickshaw keeps tipping.' },
      { by: 'a', say: "Sit in the middle! Sit in the middle!" },
      { by: 'b', say: "Sorry! The middle has no view!" },
    ] },
    { id: 'gwh.rk-a4', when: RK, turns: [
      { by: 'a', say: "Zigzag. If I zigzag, it's less steep." },
      { beat: '{a} zigzags across the whole road, and it works.' },
      { by: 'b', say: "I feel seasick, but it's working." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'gwh.rk-t1', when: RK, turns: [
      { beat: '{a} is bent almost double, dragging the rickshaw one slow step at a time.' },
      { by: 'b', say: "Can I get out and walk? Just a little bit?" },
      { by: 'a', say: "No! You'll get us a penalty! Stay in and be heavy!" },
    ] },
    { id: 'gwh.rk-t2', when: RK, turns: [
      { by: 'a', ...V("How far? Please tell me it's not far.", "How far?", "Far?", "How FAR? PLEASE tell me it's NOT far!", "How far is it? Please tell me it's not far.", "How much further? Lie to me if you have to.") },
      { by: 'b', say: "I can see the wall! I can see it!" },
      { by: 'a', say: "Is it close?" },
      { by: 'b', say: "It's... visible." },
    ] },
    { id: 'gwh.rk-t3', when: RK, turns: [
      { beat: 'Every other rickshaw has gone past them. {a} is still going, very, very slowly.' },
      { by: 'b', say: "You're doing so well." },
      { by: 'a', say: "Don't lie to me while I'm pulling you." },
    ] },
  ],
  'task-done.any': [
    { id: 'gwh.rk-dn1', when: RK, turns: [
      { beat: '{a} drops the poles at the foot of the wall and lies flat on the ground.' },
      { by: 'b', ...V("You did it! You pulled me up a mountain!", "You pulled me up a mountain!", "You did it!", "You DID it! You PULLED me up a MOUNTAIN!", "You did it, you actually pulled me up a mountain!", "You hauled me up a mountain like a hero!") },
      { by: 'a', say: "Never again. Next time, you're the horse." },
    ] },
    { id: 'gwh.rk-dn2', when: RK, turns: [
      { by: 'b', say: "The tip says the Chill Zone is along the wall." },
      { by: 'a', say: "Which way along the wall?" },
      { by: 'b', say: "It doesn't say. It's a very long wall." },
    ] },
    { id: 'gwh.rk-dn3', when: RK, turns: [
      { beat: '{b} climbs out of the rickshaw and stretches like {b.sub}\'s just had a nap.' },
      { by: 'b', say: "That was lovely. Very relaxing." },
      { by: 'a', say: "I hate you. Give me the tip." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gwh.rk-x1', when: RK, turns: [
      { beat: 'The rickshaw hits a rock, and the whole thing tips over. {b} rolls out onto the road.' },
      { by: 'b', say: "Ow! Was that a pothole or was that you?" },
      { by: 'a', say: "Get back in! Quickly, before anyone sees!" },
    ] },
    { id: 'gwh.rk-x2', when: RK, turns: [
      { beat: 'A wheel snaps clean off and rolls away down the hill.' },
      { by: 'a', ...V("Wheel! Wheel! Come back!", "Wheel! Come back!", "Wheel!", "WHEEL! WHEEL! Come BACK!", "The wheel! Come back, wheel!", "Our wheel has abandoned us!") },
      { by: 'b', say: "It's not coming back. Go and get it." },
    ] },
    { id: 'gwh.rk-x3', when: RK, turns: [
      { beat: '{a} stops, gasping, and the rickshaw starts rolling backwards down the hill.' },
      { by: 'b', say: "We're going backwards! We're going backwards!" },
      { by: 'a', say: "Dig your feet in! No, wait, you can't! Hold on!" },
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'gwh.rk-v1', when: RK, turns: [
      { by: 'b', say: "You're a machine! You're a rickshaw machine!" },
      { by: 'a', say: "I'm a tired machine." },
      { by: 'b', say: "A tired, beautiful machine!" },
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'gwh.rk-v2', when: RK, turns: [
      { beat: '{b} grips the sides of the rickshaw every time it goes near the edge of the road.' },
      { by: 'b', say: "Not so close to the edge! Not so close!" },
      { by: 'a', say: "The edge is where the smooth bit is!" },
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'gwh.rk-v3', when: RK, turns: [
      { beat: '{b} quietly sticks one foot out and starts scooting the rickshaw along the ground.' },
      { by: 'a', say: "Are you pushing? You can't push! That's a penalty!" },
      { beat: 'A crew member on a scooter shakes their head at them. Thirty minutes.' },
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'gwh.rk-v4', when: RK, turns: [
      { beat: '{b} sits very still in the back, trying to make {b.ref} as light as possible.' },
      { by: 'a', say: "Why are you holding your breath?" },
      { by: 'b', say: "I'm being lighter." },
    ] },
  ],
  'helped-botch.any': [
    { id: 'gwh.rk-h1', when: RK, turns: [
      { beat: 'On the steepest bit, {b} hops out and pushes from behind, just for a moment.' },
      { by: 'a', say: "Get back in! Get back in before they see!" },
      { by: 'b', say: "I'm not here! I'm a gust of wind!" },
    ] },
  ],
};

// ── the wall ──
const wall = {
  'travel-mishap.any': [
    { id: 'gwh.wl-m1', when: { taskId: 'wall-walk', mishap: 'wrong-way' }, turns: [
      { by: 'a', say: "Left or right? It's a wall. It goes both ways forever." },
      { by: 'b', say: "Left. I've got a good feeling about left." },
      { beat: 'Left is the wrong way. They realise it at the third watchtower, and turn round.' },
      { by: 'a', say: "Your good feelings are terrible." },
    ] },
  ],
};

export default mergePools(place, skydive, skewers, rickshaw, wall);
