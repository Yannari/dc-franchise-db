// Torch Statue Harbour, second batch of challenge lines. Same rules as places/torch-statue-harbour.js:
// a pushes in the sewers, b rides.
import { V, mergePools } from '../_kit.js';

const SC = { taskId: 'statue-climb' };
const SW = { taskId: 'sewer' };
const AP = { taskId: 'big-apple' };

const statue = {
  'task-start.any': [
    { id: 'tsh2.sc-s1', when: SC, turns: [
      { beat: 'A sign at the bottom of the staircase reads "Please walk". {a} and {b} run past it.' },
      { by: 'b', say: "It says please walk." },
      { by: 'a', say: "It says please. That means it's optional." },
    ] },
    { id: 'tsh2.sc-s2', when: SC, turns: [
      { by: 'a', say: "Count the steps out loud. It helps." },
      { by: 'b', say: "One. Two. Three. Four." },
      { by: 'a', say: "Okay, stop. It doesn't help. It really doesn't help." },
    ] },
    { id: 'tsh2.sc-s3', when: SC, turns: [
      { beat: 'Another team thunders up the spiral right behind {a} and {b}, so close they can hear them breathing.' },
      { by: 'b', ...V("They're right behind us. Faster. Go faster.", "They're behind us. Faster.", "Faster!", "They're RIGHT behind us! FASTER!", "They're right behind us, so let's go a bit faster.", "I can hear their breath on my ankles.") },
      { by: 'a', say: "There's no room to go faster! It's a spiral!" },
    ] },
    { id: 'tsh2.sc-s4', when: SC, turns: [
      { by: 'b', say: "Why is there a pram at the top of a statue?" },
      { by: 'a', say: "Why is there anything anywhere on this race?" },
      { by: 'b', say: "Fair. Keep climbing." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tsh2.sc-f1', when: SC, turns: [
      { beat: '{a} and {b} burst into the crown, grab the nearest carriage and swing out of the window without stopping.' },
      { by: 'a', say: "Don't think! Just go!" },
      { by: 'b', say: "I'M NOT THINKING! I'M SCREAMING!" },
      { beat: 'They land at the boats, carriage and all, in one piece.' },
    ] },
    { id: 'tsh2.sc-f2', when: SC, turns: [
      { by: 'b', say: "Feet up! Tuck in! Like a bobsleigh!" },
      { beat: 'Tucked into the carriage, {a} and {b} whizz down the rope and bump gently into the boat.' },
      { by: 'a', say: "I want to do it again. Can we do it again?" },
    ] },
    { id: 'tsh2.sc-f3', when: SC, turns: [
      { beat: 'Halfway down, {a} lets go of the rope with one hand to wave at the boats.' },
      { by: 'b', say: "Both hands! BOTH HANDS!" },
      { by: 'a', say: "I'm waving at our future! Hi, future!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tsh2.sc-a1', when: SC, turns: [
      { by: 'a', say: "We went too fast at the top. Let's go slow out of the window." },
      { by: 'b', say: "Slow out of the window. Fast down the rope." },
      { beat: 'Slow out of the window, fast down the rope. The carriage stays straight all the way.' },
    ] },
    { id: 'tsh2.sc-a2', when: SC, turns: [
      { beat: 'Back in the crown for another try, {b} picks a different carriage from the row.' },
      { by: 'a', say: "Why that one?" },
      { by: 'b', say: "The last one had a squeaky wheel. It was cursed." },
      { beat: 'The new one is not cursed. They land smoothly.' },
    ] },
    { id: 'tsh2.sc-a3', when: SC, turns: [
      { by: 'b', ...V("Up again. All those stairs again. I hate this statue.", "Stairs again. I hate this statue.", "Stairs. Again.", "UP again! ALL those STAIRS again!", "Up all those stairs again, and I really hate this statue.", "The statue and I are no longer friends.") },
      { by: 'a', say: "Don't let her hear you. She's holding the rope." },
      { beat: 'Second time down, the statue seems to forgive them.' },
    ] },
    { id: 'tsh2.sc-a4', when: SC, turns: [
      { by: 'a', say: "Watch how they're doing it. They push off the wall first." },
      { by: 'b', say: "Push off the wall. Got it." },
      { beat: 'A push off the wall, and the carriage swings clear of the window frame.' },
    ] },
  ],
  'task-done.any': [
    { id: 'tsh2.sc-dn1', when: SC, turns: [
      { by: 'b', say: "My knees are shaking. Is that from the stairs or the rope?" },
      { by: 'a', say: "Both. Your knees have had a very full day." },
      { by: 'b', say: "And it's only the morning." },
    ] },
    { id: 'tsh2.sc-dn2', when: SC, turns: [
      { beat: '{a} and {b} drag the carriage off the boat and look back up at the crown, high above.' },
      { by: 'a', say: "We were up there. Right up there." },
      { by: 'b', say: "Wave at her. Say thank you." },
      { by: 'a', say: "Thank you, statue." },
    ] },
    { id: 'tsh2.sc-dn3', when: SC, turns: [
      { by: 'a', say: "Why do they want us to keep the pram?" },
      { by: 'b', say: "Maybe we're having a baby. On the race." },
      { by: 'a', say: "Read the tip, please. Just read the tip." },
    ] },
    { id: 'tsh2.sc-dn4', when: SC, turns: [
      { beat: 'The boat driver hands over the tip and points at a dark tunnel in the harbour wall.' },
      { by: 'b', say: "In there? With the pram?" },
      { by: 'a', say: "He's nodding. He's nodding very sadly." },
    ] },
    { id: 'tsh2.sc-dn5', when: SC, turns: [
      { by: 'a', say: "Three hundred and fifty steps, and one big slide. Not bad." },
      { by: 'b', say: "My legs say it was bad." },
      { by: 'a', say: "Your legs aren't on the team. You are." },
    ] },
  ],
};

const sewer = {
  'task-start.any': [
    { id: 'tsh2.sw-s1', when: SW, turns: [
      { beat: '{a} switches on the torch taped to the carriage. It lights up about one step of tunnel.' },
      { by: 'b', say: "That's it? That's the whole light?" },
      { by: 'a', say: "It's a pram torch. It's for small adventures." },
    ] },
    { id: 'tsh2.sw-s2', when: SW, turns: [
      { by: 'b', say: "Promise me something. If something grabs me, you run." },
      { by: 'a', say: "I'm not leaving you in a pram in a sewer." },
      { by: 'b', say: "Then push faster so nothing grabs me." },
    ] },
    { id: 'tsh2.sw-s3', when: SW, turns: [
      { beat: 'A drip from the ceiling lands right on {b}\'s head.' },
      { by: 'b', ...V("Something dripped on me. Don't tell me what it was.", "Something dripped. Don't tell me.", "Drip. Don't say it.", "Something DRIPPED on me! DON'T tell me what it WAS!", "Something just dripped on me, and please don't tell me what.", "The sewer has blessed me. I didn't ask to be blessed.") },
      { by: 'a', say: "It was water. Probably." },
    ] },
    { id: 'tsh2.sw-s4', when: SW, turns: [
      { by: 'a', say: "Hum something. If you're humming, I know you're still in there." },
      { beat: '{b} hums. It echoes all the way down the tunnel and comes back sounding like a ghost.' },
      { by: 'a', say: "Stop humming. Stop humming right now." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tsh2.sw-f1', when: SW, turns: [
      { by: 'b', say: "There! Light! Up ahead!" },
      { beat: 'A shaft of daylight falls through a grate onto the bottom of a ladder.' },
      { by: 'a', say: "Is it the park? Tell me it's the park." },
      { by: 'b', say: "It's grass! I can smell grass! I've never been so happy to smell grass!" },
    ] },
    { id: 'tsh2.sw-f2', when: SW, turns: [
      { beat: '{a} pushes without slowing down once, splashing through every puddle.' },
      { by: 'b', say: "I'm soaked. You've soaked me." },
      { by: 'a', say: "You're soaked, but you're winning. That's the deal." },
    ] },
    { id: 'tsh2.sw-f3', when: SW, turns: [
      { by: 'a', say: "Uphill. Water runs down, so the way out goes up." },
      { by: 'b', say: "How do you know that?" },
      { by: 'a', say: "I don't. But it worked." },
      { beat: 'Uphill leads them straight to the ladder.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tsh2.sw-a1', when: SW, turns: [
      { beat: 'The tunnel ends at a locked grate. {a} turns the carriage round, again.' },
      { by: 'b', say: "We've been here before. I recognise that rat." },
      { by: 'a', say: "Then we go the other way from the rat." },
      { beat: 'The other way from the rat is the right way.' },
    ] },
    { id: 'tsh2.sw-a2', when: SW, turns: [
      { by: 'b', say: "Listen. Can you hear traffic?" },
      { by: 'a', say: "Yes. Above us. That way." },
      { by: 'b', say: "Follow the cars. The park is next to the road." },
      { beat: 'They follow the sound of cars to the ladder.' },
    ] },
    { id: 'tsh2.sw-a3', when: SW, turns: [
      { beat: '{a} stops pushing, takes a breath, and wipes {a.posAdj} face with a sleeve.' },
      { by: 'a', say: "Okay. I'm calm. I'm calm in a sewer." },
      { by: 'b', ...V("You're doing so well. You're the best pusher in the world.", "You're the best pusher alive.", "Best pusher.", "You're doing SO well! The BEST pusher in the WORLD!", "You're doing so well, you're the best pusher in the world.", "History will remember you as a great pusher.") },
      { beat: 'Calm, {a} finds the right tunnel first time.' },
    ] },
    { id: 'tsh2.sw-a4', when: SW, turns: [
      { by: 'a', say: "Chalk. Have you got anything to mark the walls?" },
      { by: 'b', say: "I've got lip balm." },
      { by: 'a', say: "Mark the walls with lip balm." },
      { beat: 'With every wrong tunnel marked in lip balm, they find the ladder.' },
    ] },
  ],
  'task-done.any': [
    { id: 'tsh2.sw-dn1', when: SW, turns: [
      { beat: '{b} climbs out of the carriage and onto the grass, and lies down flat on it.' },
      { by: 'b', say: "I love grass. I love the sky. I love everything up here." },
      { by: 'a', say: "Get up. We've got an apple to find." },
    ] },
    { id: 'tsh2.sw-dn2', when: SW, turns: [
      { by: 'a', say: "I pushed you through a sewer. Remember that next time you're mad at me." },
      { by: 'b', say: "I'll remember it forever." },
      { by: 'a', say: "Good. Use it." },
    ] },
    { id: 'tsh2.sw-dn3', when: SW, turns: [
      { beat: 'A dog in the park sniffs {a} and {b}, sneezes, and walks away.' },
      { by: 'b', say: "Even the dog thinks we smell." },
      { by: 'a', say: "Dogs love bad smells. We smell worse than bad." },
    ] },
    { id: 'tsh2.sw-dn4', when: SW, turns: [
      { by: 'b', say: "Did we ever find out what was roaring?" },
      { by: 'a', say: "No. And I want it to stay that way." },
      { by: 'b', say: "Agreed. Some things should stay in the sewer." },
    ] },
    { id: 'tsh2.sw-dn5', when: SW, turns: [
      { beat: '{a} pours a puddle of sewer water out of each shoe.' },
      { by: 'a', say: "These were my good shoes." },
      { by: 'b', say: "They were your only shoes." },
      { by: 'a', say: "That's what made them good." },
    ] },
  ],
};

const apple = {
  'task-start.any': [
    { id: 'tsh2.ap-s1', when: AP, turns: [
      { beat: '{a} wades out up to the waist. The pond is green, cold, and full of floating leaves.' },
      { by: 'a', say: "It's cold. It's really, really cold." },
      { by: 'b', say: "Colder than the sewer?" },
      { by: 'a', say: "Cleaner than the sewer. I'll take it." },
    ] },
    { id: 'tsh2.ap-s2', when: AP, turns: [
      { by: 'b', say: "Open wide. Wider. Like a snake." },
      { by: 'a', say: "Snakes unhinge their jaws. I can't do that." },
      { by: 'b', say: "Not with that attitude." },
    ] },
    { id: 'tsh2.ap-s3', when: AP, turns: [
      { beat: 'A duck paddles over and floats next to {a}, watching closely.' },
      { by: 'a', say: "There's a duck. It's judging me." },
      { by: 'b', ...V("Ignore the duck. Focus on the apple.", "Ignore the duck.", "Apple. Not duck.", "IGNORE the DUCK! FOCUS on the APPLE!", "Just ignore the duck and focus on the apple.", "The duck is not your competition. Or is it?") },
    ] },
    { id: 'tsh2.ap-s4', when: AP, turns: [
      { by: 'a', say: "Which one? They're all huge." },
      { by: 'b', say: "The one with the longest stalk. Long stalk, easy bite." },
      { by: 'a', say: "That's actually smart." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tsh2.ap-f1', when: AP, turns: [
      { beat: '{a} bites the stalk, leans back and kicks for the bank, towing the apple behind like a boat.' },
      { by: 'b', say: "Swim! Swim! You're doing it!" },
      { by: 'a', say: "Mmmf! Mmmmf!" },
    ] },
    { id: 'tsh2.ap-f2', when: AP, turns: [
      { by: 'b', say: "Bring it here! I've got the carriage ready!" },
      { beat: '{a} drops the apple into the carriage with a wet thump and spits out a leaf.' },
      { by: 'a', say: "Done. First go. Push." },
    ] },
    { id: 'tsh2.ap-f3', when: AP, turns: [
      { beat: '{a} gets a perfect bite on the very first try and walks the apple out of the pond like a dog with a ball.' },
      { by: 'b', say: "Good! Good! Who's the best?" },
      { by: 'a', say: "Don't. Don't talk to me like a dog." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tsh2.ap-a1', when: AP, turns: [
      { by: 'b', say: "You're biting the side. Bite the top, where the stalk is." },
      { by: 'a', say: "The side was right there!" },
      { by: 'b', say: "The top. Trust me." },
      { beat: 'The top works. The apple comes out on the first pull.' },
    ] },
    { id: 'tsh2.ap-a2', when: AP, turns: [
      { beat: 'The apple slips out of {a}\'s mouth halfway to the bank and bobs away.' },
      { by: 'a', say: "It's escaping. The apple is escaping." },
      { by: 'b', say: "Chase it! It can't swim faster than you!" },
      { beat: 'It can\'t. {a} catches it at the edge and brings it in.' },
    ] },
    { id: 'tsh2.ap-a3', when: AP, turns: [
      { by: 'a', ...V("My jaw's locked. I can't open it any more.", "My jaw's locked.", "Jaw. Stuck.", "My JAW'S locked! I CAN'T open it!", "I think my jaw has locked, I can't open it any more.", "My jaw has gone on strike.") },
      { by: 'b', say: "Rest it. Count to ten. Then one big bite." },
      { beat: 'Ten seconds, one big bite, one apple on the bank.' },
    ] },
    { id: 'tsh2.ap-a4', when: AP, turns: [
      { beat: 'The apple falls out of the carriage on a bump in the path and rolls back down into the pond.' },
      { by: 'b', say: "No! Not the pond! Anywhere but the pond!" },
      { by: 'a', say: "This time I'm holding it in the pram with my chin." },
    ] },
  ],
  'task-done.any': [
    { id: 'tsh2.ap-dn1', when: AP, turns: [
      { beat: '{a} and {b} roll the carriage up to the fountain. A crowd of joggers stops to watch.' },
      { by: 'b', say: "Why are they clapping?" },
      { by: 'a', say: "Because we're pushing a giant apple in a pram. It's very impressive." },
    ] },
    { id: 'tsh2.ap-dn2', when: AP, turns: [
      { by: 'a', say: "I still have pond in my ears." },
      { by: 'b', say: "And a leaf in your hair." },
      { by: 'a', say: "Leave the leaf. It's a souvenir." },
    ] },
    { id: 'tsh2.ap-dn3', when: AP, turns: [
      { by: 'b', say: "A statue, a sewer and a pond. In one day." },
      { by: 'a', say: "Nobody back home is ever going to complain to me about their commute again." },
      { by: 'b', say: "They will. And you'll tell them this story. Twice." },
    ] },
    { id: 'tsh2.ap-dn4', when: AP, turns: [
      { beat: '{a} takes a huge bite out of the apple before they reach the fountain.' },
      { by: 'b', say: "You're eating it? It's ours to deliver!" },
      { by: 'a', say: "It's still a giant apple. Just slightly less giant." },
    ] },
    { id: 'tsh2.ap-dn5', when: AP, turns: [
      { by: 'a', say: "Run. The fountain's right there. Run!" },
      { by: 'b', say: "I'm running! The pram's heavy!" },
      { by: 'a', say: "It's an apple! How heavy can an apple be?" },
      { by: 'b', say: "This one? Very!" },
    ] },
  ],
};

export default mergePools(statue, sewer, apple);
