// Torch Statue Harbour's own lines (js/rr/places/torch-statue-harbour.js), from World Tour's city leg adapted for pairs,
// in our own words:
//   the statue    up the spiral stairs to the crown, a baby carriage on a rope, the ride down to the boats.
//   the sewers    Botch or Watch: push your partner in the carriage through the tunnels; the smell, the dark, the roar.
//   the pond      one partner fetches a giant apple with their mouth only; the snapping turtle; the wrong carriage.
// Gated on place / taskId. a pushes in the sewers, b rides.
import { V, mergePools } from './_kit.js';

const P = { place: 'torch-statue-harbour' };
const SC = { taskId: 'statue-climb' };
const SW = { taskId: 'sewer' };
const AP = { taskId: 'big-apple' };
const don = say => ({ by: 'don', say });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'tsh.op1', when: P, turns: [
      { beat: 'Don stands on a ferry in the harbour, the giant torch statue rising behind him.' },
      don("Torch Statue Harbour! Home of the tallest lady in the world, the busiest streets, and pizza the size of a bike wheel."),
      don("Teams must climb the statue to the crown, push their partner through the sewers in a baby carriage, and fish a giant apple out of a pond."),
      { beat: 'He takes a bite of an enormous slice of pizza.' },
      don("Mm. I'll be at the fountain. Eating more of this."),
    ] },
    { id: 'tsh.op2', when: P, turns: [
      don("Welcome to Torch Statue Harbour, home of bright lights, big dreams, and taxis that will not stop for me no matter how famous I am."),
      { beat: 'A taxi speeds straight past him, splashing him with a puddle.' },
      don("That's the fourth one. The fourth! Racers, your boat to the statue is waiting. Unlike that taxi."),
    ] },
  ],
  'don-opener.bored': [
    { id: 'tsh.op3', when: P, turns: [
      { beat: 'Don stands in the park, holding a coffee, watching a man walk nine dogs at once.' },
      don("Torch Statue Harbour. Busy, loud, and very, very busy."),
      don("Teams, the statue's out in the harbour. The sewers are underneath us. I'm staying up here."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'tsh.ar1', when: P, turns: [
      { beat: 'The boat swings round, and the giant statue towers over them, torch raised to the sky.' },
      { by: 'a', ...V("She's huge. She's so much bigger than I thought.", "She's huge.", "So much bigger.", "She's HUGE! She's SO much BIGGER than I thought!", "She's enormous, so much bigger than I imagined.", "She's a giant. A copper giant with a torch.") },
      { by: 'b', say: "I've wanted to see her since I was little." },
      { by: 'a', say: "And now we get to climb her. Respectfully." },
    ] },
    { id: 'tsh.ar2', when: P, turns: [
      { by: 'b', say: "Look at all those buildings. They go up forever." },
      { by: 'a', say: "Everything here is the biggest version of itself." },
      { by: 'b', say: "Even the pigeons are bigger. Look at that pigeon." },
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'tsh.ad1', when: P, turns: [
      { by: 'a', say: "Why are there baby carriages hanging off the statue?" },
      { by: 'b', ...V("Oh no. Oh no, we're going to be in them, aren't we.", "We're going in them, aren't we.", "Oh no.", "Oh NO! Oh NO, we're going to BE in them, aren't we!", "Oh no. We're going to end up in those, aren't we?", "Those carriages have our names on them. I can feel it.") },
      { by: 'a', say: "One of us is. I can feel it." },
    ] },
    { id: 'tsh.ad2', when: P, turns: [
      { beat: 'A horrible smell drifts up from a grate in the street.' },
      { by: 'b', say: "What is that smell?" },
      { by: 'a', say: "The sewers. Please, please don't let it be the sewers." },
    ] },
  ],
};

// ── up to the crown ──
const statue = {
  'don-demo.gag': [
    { id: 'tsh.sc-d1', when: SC, turns: [
      don("In this All-In, both partners climb up inside the statue to the crown, haul in a baby carriage, and ride it down the rope to the boats."),
      { beat: 'He looks up at the crown, a very long way above him.' },
      don("There are three hundred and fifty-four steps. I've been told. By an intern. Who's still up there. Getting his breath back."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'tsh.sc-d2', when: SC, turns: [
      don("Climb to the crown. Grab a carriage. Ride it down. If the carriage tangles, or you let go, back up you go."),
      don("Both of you need to make it down with the carriage. You'll be needing it later."),
      { beat: 'A baby carriage dangles from the crown, swinging gently in the wind.' },
    ] },
  ],
  'task-start.any': [
    { id: 'tsh.sc-s1', when: SC, turns: [
      { beat: '{a} and {b} start up the narrow spiral staircase inside the statue. It goes round and round and round.' },
      { by: 'a', say: "This staircase is making me dizzy." },
      { by: 'b', ...V("Don't look up. Don't look down. Look at the step in front of you.", "Look at the next step.", "Just the next step.", "DON'T look UP! DON'T look DOWN! Look at the STEP in FRONT of you!", "Don't look up or down, just look at the step in front of you.", "Only the next step exists. The rest is a rumour.") },
    ] },
    { id: 'tsh.sc-s2', when: SC, turns: [
      { by: 'b', say: "We're climbing up the inside of a statue. People pay to do this." },
      { by: 'a', say: "People pay to do this slowly. We're doing it fast." },
      { by: 'b', say: "We're the only ones running." },
    ] },
    { id: 'tsh.sc-s3', when: SC, turns: [
      { beat: 'It\'s hot inside the statue, and the metal walls hum in the wind.' },
      { by: 'a', say: "Is it moving? I think the statue's moving." },
      { by: 'b', say: "She's swaying. Statues sway. Keep climbing." },
    ] },
    { id: 'tsh.sc-s4', when: SC, turns: [
      { by: 'a', say: "How many steps is it?" },
      { by: 'b', say: "Don said three hundred and something." },
      { by: 'a', say: "The something is what worries me." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tsh.sc-f1', when: SC, turns: [
      { beat: '{a} and {b} reach the crown, haul in a carriage, and ride it all the way down the rope, whooping.' },
      { by: 'b', ...V("That was amazing! Like a zipline, but with a pram!", "Like a zipline with a pram!", "Pram zipline!", "That was AMAZING! Like a ZIPLINE, but with a PRAM!", "That was amazing, like a zipline but in a pram!", "We flew in a pram, like the world's bravest babies!") },
      { by: 'a', say: "I'm keeping the carriage. I love the carriage." },
    ] },
    { id: 'tsh.sc-f2', when: SC, turns: [
      { by: 'a', say: "The view from the crown. Look. The whole city." },
      { by: 'b', say: "We can look at the view on the way down! Grab the carriage!" },
      { beat: 'They grab the carriage, look at the view on the way down, and land perfectly.' },
    ] },
    { id: 'tsh.sc-f3', when: SC, turns: [
      { beat: '{a} takes the stairs two at a time and is first to the crown, with {b} right behind.' },
      { by: 'b', say: "How are you not tired?" },
      { by: 'a', say: "I'm very tired. I'm just tired quickly." },
    ] },
    { id: 'tsh.sc-f4', when: SC, turns: [
      { by: 'b', say: "Hold the rope with both hands. Don't let go, whatever happens." },
      { by: 'a', say: "Both hands. Whatever happens." },
      { beat: 'Something happens, a lot of wind, but neither lets go, and they land with the carriage.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tsh.sc-a1', when: SC, turns: [
      { beat: 'Back at the crown for a second go, {b} checks the carriage rope for tangles before they set off.' },
      { by: 'b', say: "No knots. No twists. This time it's smooth." },
      { by: 'a', say: "It was smooth last time until it wasn't." },
      { beat: 'This time it stays smooth all the way down.' },
    ] },
    { id: 'tsh.sc-a2', when: SC, turns: [
      { by: 'a', ...V("Three hundred and fifty steps again. I don't think I can do it again.", "Three hundred and fifty steps again?", "All the steps again?", "THREE HUNDRED and FIFTY steps AGAIN! I don't think I can DO it again!", "Three hundred and fifty steps again? I don't know if I can.", "The staircase calls us back. It's a cruel staircase.") },
      { by: 'b', say: "Then we do it slowly. Slow is still up." },
      { beat: 'Slow is still up. They make it, and ride down properly.' },
    ] },
    { id: 'tsh.sc-a3', when: SC, turns: [
      { beat: 'Halfway down the rope, the carriage spins and tangles. They have to climb all the way back up.' },
      { by: 'b', say: "Lean back this time. Lean back and it won't spin." },
      { by: 'a', say: "Lean back. Okay. Leaning back." },
    ] },
    { id: 'tsh.sc-a4', when: SC, turns: [
      { by: 'a', say: "Let's ride down together. In one carriage. It's more stable." },
      { by: 'b', say: "Is that allowed?" },
      { by: 'a', say: "Nobody said it wasn't." },
      { beat: 'Squeezed into one carriage, they slide down together. It works.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'tsh.sc-t1', when: SC, turns: [
      { beat: '{b} is sitting on a step halfway up the statue, not moving.' },
      { by: 'b', say: "My legs. My legs have stopped. Tell them to start." },
      { by: 'a', say: "Legs. Start. Please." },
    ] },
    { id: 'tsh.sc-t2', when: SC, turns: [
      { beat: 'At the crown, the wind is so strong the carriage keeps blowing back in through the window.' },
      { by: 'a', ...V("The wind won't let us go!", "The wind won't let us go!", "Wind's too strong!", "The WIND won't LET us GO!", "The wind just won't let us go!", "The sky is pushing us back in!") },
      { by: 'b', say: "Wait for a gap! Wait for the wind to breathe!" },
    ] },
    { id: 'tsh.sc-t3', when: SC, turns: [
      { beat: 'Team after team rides down past them while {a} and {b} are still climbing.' },
      { by: 'b', say: "Everyone's going down, and we're still going up." },
      { by: 'a', say: "Then we'll be the last ones down. Someone has to be." },
    ] },
  ],
  'task-done.any': [
    { id: 'tsh.sc-dn1', when: SC, turns: [
      { beat: '{a} and {b} land in the boat at the statue\'s foot, carriage and all, and grab the tip.' },
      { by: 'a', say: "The sewers. It says the sewers." },
      { by: 'b', ...V("No. No. Not the sewers. Anything but the sewers.", "Not the sewers.", "No. Sewers.", "NO! NO! NOT the SEWERS! ANYTHING but the SEWERS!", "No, please, not the sewers. Anything but the sewers.", "The sewers. The worst word in the language.") },
    ] },
    { id: 'tsh.sc-dn2', when: SC, turns: [
      { by: 'b', say: "We climbed a statue. We actually climbed a statue." },
      { by: 'a', say: "And slid down her in a pram." },
      { by: 'b', say: "Nobody back home is going to believe us." },
    ] },
    { id: 'tsh.sc-dn3', when: SC, turns: [
      { beat: '{a} pats the side of the baby carriage fondly.' },
      { by: 'a', say: "This is our carriage now. We need it for later." },
      { by: 'b', say: "I don't like what later sounds like." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'tsh.sc-x1', when: SC, turns: [
      { beat: 'The carriage tangles in its rope halfway down and stops dead, swinging over the harbour.' },
      { by: 'a', say: "We're stuck. We're stuck in the air in a pram." },
      { by: 'b', say: "Climb back up the rope! Back to the crown!" },
    ] },
    { id: 'tsh.sc-x2', when: SC, turns: [
      { beat: '{b} lets go of the rope for one second to wave at a tourist boat, and the carriage swings back to the crown.' },
      { by: 'b', ...V("I waved! I only waved!", "I only waved!", "I waved!", "I WAVED! I ONLY WAVED!", "I only waved at them!", "A friendly wave! Punished!") },
      { by: 'a', say: "No waving. Never wave. Again." },
    ] },
    { id: 'tsh.sc-x3', when: SC, turns: [
      { beat: '{a} reaches the crown, looks out of the window, and climbs straight back in.' },
      { by: 'a', say: "Nope. Too high. I need a minute." },
      { by: 'b', say: "We're on the clock! Take a quick minute!" },
    ] },
  ],
};

// ── the sewers (Botch or Watch) ──
const sewer = {
  'don-demo.gag': [
    { id: 'tsh.sw-d1', when: SW, turns: [
      don("In this Botch or Watch, whoever didn't do the last one pushes their partner in the baby carriage, through the sewers, all the way to the park."),
      { beat: 'He stands at the top of a sewer ladder in a gas mask, his voice muffled.' },
      don("Mmmph mmph mmph. Sorry. The smell. Passengers stay in the carriage. And if you hear a roar, it's probably nothing."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'tsh.sw-d2', when: SW, turns: [
      don("Follow the tunnels to the ladder into the park. A wrong turn ends at a grate, and you push all the way back."),
      don("And the passenger stays in the carriage the whole way. The whole way. No matter what you see."),
      { beat: 'Somewhere far below, something big splashes.' },
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'tsh.sw-w1', when: SW, turns: [
      { by: 'b', say: "It's pushing. You push. I'll ride." },
      { by: 'a', ...V("Why am I always the one pushing?", "Why do I always push?", "Always me pushing.", "Why am I ALWAYS the one PUSHING?", "Why is it always me doing the pushing?", "I am forever the engine of this team.") },
      { by: 'b', say: "Because you're good at it, and I'm good at riding." },
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'tsh.sw-w2', when: SW, turns: [
      { by: 'a', say: "Get in. I'll push. You've done enough today." },
      { by: 'b', say: "You'd push me through a sewer for me?" },
      { by: 'a', say: "I'd push you through a sewer for a million dollars. You're a bonus." },
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'tsh.sw-w3', when: SW, turns: [
      { beat: '{b} climbs into the carriage before {a} can say anything.' },
      { by: 'a', say: "You've just decided I'm pushing?" },
      { by: 'b', say: "I'm already in. It'd be rude to get out." },
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'tsh.sw-w4', when: SW, turns: [
      { by: 'a', say: "'Who can push?' We've got a pram. Somebody pushes, somebody rides." },
      { by: 'b', say: "Then you push. You're stronger." },
      { by: 'a', say: "Every single time you say I'm stronger, I end up pushing something." },
    ] },
  ],
  'task-start.any': [
    { id: 'tsh.sw-s1', when: SW, turns: [
      { beat: '{a} pushes the carriage, with {b} in it, down a ramp into the dark sewer tunnel.' },
      { by: 'b', say: "The smell. The smell is like a living thing." },
      { by: 'a', ...V("Breathe through your mouth.", "Mouth-breathe.", "Use your mouth.", "BREATHE through your MOUTH!", "Just breathe through your mouth.", "Breathe through your mouth. Your nose is retired.") },
      { by: 'b', say: "Then I can taste it." },
    ] },
    { id: 'tsh.sw-s2', when: SW, turns: [
      { by: 'a', say: "Which way? Left tunnel or right tunnel?" },
      { by: 'b', say: "The one that smells less." },
      { by: 'a', say: "They both smell exactly the same." },
    ] },
    { id: 'tsh.sw-s3', when: SW, turns: [
      { beat: 'The water is ankle deep and cold, and the carriage wheels squeak with every turn.' },
      { by: 'b', say: "This is the most uncomfortable I've ever been in a pram." },
      { by: 'a', say: "How many prams have you been in?" },
    ] },
    { id: 'tsh.sw-s4', when: SW, turns: [
      { by: 'b', say: "Did you hear that? Something roared. Something roared!" },
      { by: 'a', say: "It's the pipes. It's just the pipes. Pipes roar." },
      { by: 'b', say: "Pipes don't roar." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tsh.sw-f1', when: SW, turns: [
      { beat: '{a} pushes the carriage through the tunnels without a single wrong turn and finds the ladder into the park.' },
      { by: 'b', ...V("Daylight! Air! Real air!", "Daylight! Air!", "Air!", "DAYLIGHT! AIR! REAL AIR!", "Daylight! Real air, finally!", "The surface! Sweet surface air!") },
      { by: 'a', say: "I'm never going to get this smell off me." },
    ] },
    { id: 'tsh.sw-f2', when: SW, turns: [
      { by: 'a', say: "Follow the arrows. Somebody painted arrows on the walls." },
      { by: 'b', say: "Who paints arrows in a sewer?" },
      { by: 'a', say: "A kind person. A kind sewer person." },
    ] },
    { id: 'tsh.sw-f3', when: SW, turns: [
      { beat: 'A pair of eyes glows in the dark ahead. {a} pushes faster and the eyes stay behind.' },
      { by: 'b', say: "Was that an alligator? That was an alligator." },
      { by: 'a', say: "It was a very large rat. Keep telling yourself it was a very large rat." },
    ] },
    { id: 'tsh.sw-f4', when: SW, turns: [
      { by: 'b', say: "You're going so fast. Slow down for the corners." },
      { by: 'a', say: "I'm not slowing down in a sewer. Hold on." },
      { beat: 'They take every corner on two wheels and reach the ladder in record time.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tsh.sw-a1', when: SW, turns: [
      { beat: 'Back from a dead end, {a} stops at the junction and sniffs the air.' },
      { by: 'a', say: "The air's fresher this way. That's the way out." },
      { by: 'b', say: "Fresher? Nothing down here is fresher." },
      { beat: 'Fresher it is. The ladder\'s round the next bend.' },
    ] },
    { id: 'tsh.sw-a2', when: SW, turns: [
      { by: 'b', ...V("Left at every fork. If we always go left, we'll find it.", "Always left.", "Left every time.", "LEFT at EVERY FORK! If we ALWAYS go LEFT, we'll FIND it!", "Go left at every fork, we'll find it eventually.", "Left, always left. The left-hand rule of mazes.") },
      { beat: 'Left at every fork, and eventually, there\'s the ladder.' },
      { by: 'a', say: "Your maze rule worked." },
    ] },
    { id: 'tsh.sw-a3', when: SW, turns: [
      { beat: 'The carriage wheel comes loose. {a} jams it back on and keeps pushing, wobbling.' },
      { by: 'b', say: "Is that wheel going to stay on?" },
      { by: 'a', say: "It's going to stay on through sheer stubbornness." },
    ] },
    { id: 'tsh.sw-a4', when: SW, turns: [
      { by: 'a', say: "Talk to me. Tell me which way. You're facing forwards." },
      { by: 'b', say: "Right! Then straight! Then right again!" },
      { beat: 'With {b} calling the turns, they make it out.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'tsh.sw-t1', when: SW, turns: [
      { beat: '{a} is pushing slower and slower through the deepening water.' },
      { by: 'b', say: "Can I get out and walk? Just for a bit?" },
      { by: 'a', say: "No! You stay in the pram! That's the rule!" },
    ] },
    { id: 'tsh.sw-t2', when: SW, turns: [
      { by: 'a', ...V("We've been down here forever. I've forgotten what the sun looks like.", "I've forgotten the sun.", "We've been here forever.", "We've been DOWN here FOREVER! I've FORGOTTEN what the SUN looks like!", "We've been down here forever, I've forgotten what the sun looks like.", "I live in the sewer now. I have a sewer name.") },
      { by: 'b', say: "It's yellow. Round. Warm. You'll see it again." },
      { by: 'a', say: "Yellow, round, warm. Okay. Keep describing it while I push." },
    ] },
    { id: 'tsh.sw-t3', when: SW, turns: [
      { beat: 'Something splashes in the dark tunnel behind them.' },
      { by: 'b', say: "It's following us. Push faster. Push faster!" },
      { by: 'a', say: "I'm pushing as fast as a person can push a pram!" },
    ] },
  ],
  'task-done.any': [
    { id: 'tsh.sw-dn1', when: SW, turns: [
      { beat: '{a} and {b} climb the ladder into the park, hauling the carriage up behind them.' },
      { by: 'b', say: "Grass! Trees! Sunshine!" },
      { by: 'a', ...V("I'm never going underground again. Ever.", "Never going underground again.", "No more underground.", "I'm NEVER going UNDERGROUND AGAIN! EVER!", "I'm never going underground again, I swear.", "I'm a surface creature now. Forever.") },
    ] },
    { id: 'tsh.sw-dn2', when: SW, turns: [
      { by: 'a', say: "The tip says the park pond. A giant apple." },
      { by: 'b', say: "A giant apple? What's a giant apple?" },
      { by: 'a', say: "I don't know, but it smells better than the sewer." },
    ] },
    { id: 'tsh.sw-dn3', when: SW, turns: [
      { beat: 'A passing jogger takes one sniff of {a} and {b} and runs the other way.' },
      { by: 'b', say: "We smell terrible." },
      { by: 'a', say: "We smell like we won a sewer." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'tsh.sw-x1', when: SW, turns: [
      { beat: 'The tunnel ends in a rusty grate. No way through.' },
      { by: 'b', say: "Dead end. Back. All the way back." },
      { by: 'a', say: "In reverse. Pushing a pram backwards through a sewer. My life." },
    ] },
    { id: 'tsh.sw-x2', when: SW, turns: [
      { beat: '{b} steps out of the carriage to look round a corner. A crew member blows a whistle.' },
      { by: 'b', ...V("I just wanted to see! One step!", "One step!", "I just looked!", "I just WANTED to SEE! ONE STEP!", "I only stepped out to see round the corner!", "A single step! For science!") },
      { by: 'a', say: "Back in the pram. Back to the start." },
    ] },
    { id: 'tsh.sw-x3', when: SW, turns: [
      { beat: 'A real alligator raises its head out of the water in front of them.' },
      { by: 'a', say: "Back. Back up. Very slowly." },
      { by: 'b', say: "Another way. We'll find another way. Any other way." },
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'tsh.sw-v1', when: SW, turns: [
      { by: 'b', say: "Go! Go! You're doing amazing! Faster!" },
      { by: 'a', say: "You're cheering from a pram!" },
      { by: 'b', say: "The best seat in the house!" },
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'tsh.sw-v2', when: SW, turns: [
      { beat: '{b} grips the sides of the carriage, eyes darting into every dark corner.' },
      { by: 'b', say: "What's that? What was that noise? Is that the thing?" },
      { by: 'a', say: "It's dripping! It's all just dripping!" },
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'tsh.sw-v3', when: SW, turns: [
      { beat: '{b} reaches out of the carriage and starts pulling them along the wall by the pipes.' },
      { by: 'a', say: "Stop helping! You're not allowed to help!" },
      { beat: 'A crew member with a torch shakes their head. Thirty minutes.' },
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'tsh.sw-v4', when: SW, turns: [
      { beat: '{b} sits very still in the carriage, holding {b.posAdj} nose, saying nothing.' },
      { by: 'a', say: "Are you okay back there?" },
      { by: 'b', say: "Mmm-hmm. Not opening my mouth. Ever." },
    ] },
  ],
  'helped-botch.any': [
    { id: 'tsh.sw-h1', when: SW, turns: [
      { beat: 'On a steep ramp, {b} quietly hops out of the carriage and pushes from the side.' },
      { by: 'a', say: "Get back in! Get back in before the crew sees!" },
      { by: 'b', say: "I'm a very heavy baby who stretches." },
    ] },
  ],
};

// ── the giant apple ──
const apple = {
  'don-demo.gag': [
    { id: 'tsh.ap-d1', when: AP, turns: [
      don("In this All-In, one partner wades into the pond and fetches a giant apple, using only their mouth. No hands!"),
      { beat: 'He wades in and tries to bite an apple the size of a beach ball. It bobs away. He chases it.' },
      don("It's harder than it looks. The apple has a mind of its own."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'tsh.ap-d2', when: AP, turns: [
      don("Mouth only. Use your hands, and the apple goes back. Then load it in the carriage and push it to the fountain."),
      don("And watch out for the turtles. They bite. Ask the intern."),
      { beat: 'Behind him, an intern is rubbing the back of his shorts.' },
    ] },
  ],
  'task-start.any': [
    { id: 'tsh.ap-s1', when: AP, turns: [
      { beat: '{a} wades into the pond. The apples are enormous, bobbing like footballs.' },
      { by: 'a', say: "How do I even get my mouth round that?" },
      { by: 'b', ...V("Bite the stalk! Grab it by the stalk!", "The stalk! Bite the stalk!", "Bite the stalk!", "BITE the STALK! GRAB it by the STALK!", "Go for the stalk, bite the stalk!", "The stalk is its handle! Bite its handle!") },
    ] },
    { id: 'tsh.ap-s2', when: AP, turns: [
      { by: 'b', say: "Who's going in? Who's getting wet?" },
      { by: 'a', say: "I'll go. I've got the bigger mouth." },
      { by: 'b', say: "You do have the bigger mouth." },
    ] },
    { id: 'tsh.ap-s3', when: AP, turns: [
      { beat: 'Something brushes past {a}\'s leg in the murky water.' },
      { by: 'a', say: "Something touched me. Something just touched my leg." },
      { by: 'b', say: "Apples don't have hands. Keep going." },
    ] },
    { id: 'tsh.ap-s4', when: AP, turns: [
      { by: 'a', say: "Hands behind my back. Hold my hands behind my back so I don't cheat." },
      { by: 'b', say: "That's very honest of you." },
      { by: 'a', say: "It's not honest. I don't trust myself." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tsh.ap-f1', when: AP, turns: [
      { beat: '{a} sinks {a.posAdj} teeth into the stalk and drags the giant apple to the bank in one go.' },
      { by: 'b', say: "Got it! Into the carriage! Into the carriage!" },
      { by: 'a', ...V("My jaw. My jaw is never going to close again.", "My jaw won't close.", "Jaw. Stuck.", "My JAW! My JAW is NEVER going to CLOSE again!", "My jaw is never going to close properly again.", "My mouth is now permanently apple-shaped.") },
    ] },
    { id: 'tsh.ap-f2', when: AP, turns: [
      { by: 'b', say: "Push it with your nose! Roll it to the edge!" },
      { beat: '{a} nudges the apple across the pond with {a.posAdj} nose, like a seal, all the way to the bank.' },
      { by: 'b', say: "You're a seal! A brilliant seal!" },
    ] },
    { id: 'tsh.ap-f3', when: AP, turns: [
      { beat: '{a} and {b} load the apple into the carriage and push it towards the fountain at a run.' },
      { by: 'a', say: "We're pushing an apple in a pram through a park." },
      { by: 'b', say: "Everybody's staring." },
    ] },
    { id: 'tsh.ap-f4', when: AP, turns: [
      { by: 'a', say: "That was easy. Why did everyone say it was hard?" },
      { by: 'b', say: "Because everyone else doesn't have a mouth like yours." },
      { by: 'a', say: "I'll take that as a compliment." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tsh.ap-a1', when: AP, turns: [
      { beat: 'Second try. This time {a} goes for a smaller apple near the edge.' },
      { by: 'b', say: "Smart! The little one! It's still giant, but it's a little giant!" },
      { beat: 'The little giant apple comes out on the first bite.' },
    ] },
    { id: 'tsh.ap-a2', when: AP, turns: [
      { by: 'a', ...V("It keeps rolling away! Every time I bite, it rolls!", "It keeps rolling away!", "It rolls!", "It KEEPS ROLLING AWAY! Every TIME I bite, it ROLLS!", "It keeps rolling away from me every time I bite!", "The apple fears my teeth!") },
      { by: 'b', say: "Pin it against the bank! Then bite!" },
      { beat: 'Pinned against the bank, the apple has nowhere to go.' },
    ] },
    { id: 'tsh.ap-a3', when: AP, turns: [
      { beat: 'They\'re halfway to the fountain when the apple bounces out. Back to the pond.' },
      { by: 'b', say: "Sit on it this time. Get in the carriage and hold it." },
      { by: 'a', say: "I'm sitting in a pram, holding a giant apple. My life has gone very strange." },
    ] },
    { id: 'tsh.ap-a4', when: AP, turns: [
      { by: 'b', say: "Turn round. Go in backwards. Bite it from behind." },
      { by: 'a', say: "Apples don't have a behind." },
      { by: 'b', say: "Then bite it from the other side. Just try." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'tsh.ap-t1', when: AP, turns: [
      { beat: 'A snapping turtle clamps onto the back of {a}\'s shorts.' },
      { by: 'a', say: "Something's biting me! Something's biting my shorts!" },
      { by: 'b', say: "It's a turtle! Don't use your hands! Mouth only!" },
    ] },
    { id: 'tsh.ap-t2', when: AP, turns: [
      { by: 'a', ...V("My teeth hurt. All of my teeth hurt.", "My teeth hurt.", "Teeth hurt.", "My TEETH hurt! ALL of my TEETH hurt!", "All of my teeth hurt now.", "My teeth have filed a complaint.") },
      { by: 'b', say: "One more try. One more bite. You can do one more bite." },
      { by: 'a', say: "One more bite. Then I'm getting dentures." },
    ] },
    { id: 'tsh.ap-t3', when: AP, turns: [
      { beat: 'Every other team has its apple. {a} is still splashing in the pond.' },
      { by: 'b', say: "They took all the easy apples." },
      { by: 'a', say: "There are no easy apples. They're all giants." },
    ] },
  ],
  'task-done.any': [
    { id: 'tsh.ap-dn1', when: AP, turns: [
      { beat: '{a} and {b} push the carriage up to the fountain, apple safely inside.' },
      { by: 'b', say: "We made it! Apple and all!" },
      { by: 'a', say: "Let's just check it's our carriage this time." },
      { by: 'b', say: "Why wouldn't it be our carriage?" },
    ] },
    { id: 'tsh.ap-dn2', when: AP, turns: [
      { by: 'a', say: "Can we eat the apple now?" },
      { by: 'b', ...V("You've had your mouth on it. You can have the whole thing.", "It's all yours.", "You eat it.", "You've had your MOUTH on it! You can have the WHOLE thing!", "You've had your mouth all over it, it's all yours.", "The apple is yours, by right of bite.") },
      { by: 'a', say: "Then I'm eating it at the Chill Zone. All of it." },
    ] },
    { id: 'tsh.ap-dn3', when: AP, turns: [
      { beat: '{a} wrings out {a.posAdj} soaking wet clothes as they reach the fountain.' },
      { by: 'a', say: "I smell like a sewer and a pond." },
      { by: 'b', say: "But you've got an apple." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'tsh.ap-x1', when: AP, turns: [
      { beat: '{a} gets the apple to the bank, then grabs it with both hands without thinking.' },
      { by: 'b', say: "Hands! You used your hands!" },
      { by: 'a', say: "Reflex! It was a reflex!" },
    ] },
    { id: 'tsh.ap-x2', when: AP, turns: [
      { beat: 'The apple slips out of {a}\'s teeth and floats back into the middle of the pond.' },
      { by: 'a', ...V("Come back! Come back, apple!", "Come back, apple!", "Apple!", "COME BACK! COME BACK, APPLE!", "Come back here, apple!", "The apple has chosen freedom!") },
      { by: 'b', say: "It's not coming back. Go and get it." },
    ] },
    { id: 'tsh.ap-x3', when: AP, turns: [
      { beat: 'They push a carriage to the fountain. A baby inside it starts to cry.' },
      { by: 'a', say: "That's not our apple. That's a baby." },
      { by: 'b', say: "That's not our carriage! Back! Back to the pond! Give the baby back!" },
    ] },
  ],
};

export default mergePools(place, statue, sewer, apple);
