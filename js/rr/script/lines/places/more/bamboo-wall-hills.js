// Bamboo Wall Hills, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/bamboo-wall-hills.js: both run the wall section, tower to tower, to
// the last tower before the monk's gong; at the banquet table, a eats every bite of the delicacies and b watches.
import { V, mergePools } from '../_kit.js';

const WL = { taskId: 'wall-race' };
const DL = { taskId: 'delicacies' };

const wall = {
  'task-start.any': [
    { id: 'bwh2.wl-s5', when: WL, turns: [
      { beat: 'Far away along the ridge, on the last watchtower, a tiny figure in orange stands beside a gong, perfectly still.' },
      { by: 'a', say: "That's the monk? That dot?" },
      { by: 'b', say: "That's the monk. Run." },
    ] },
    { id: 'bwh2.wl-s6', when: WL, turns: [
      { by: 'b', say: "How long is his timer?" },
      { by: 'a', say: "Nobody knows. Only him." },
      { by: 'b', say: "Then let's just run as fast as we can." },
    ] },
    { id: 'bwh2.wl-s7', when: WL, turns: [
      { beat: '{a} takes the first steps two at a time, then one at a time, then one at a time with a hand on {a.posAdj} knee.' },
      { by: 'a', say: "Whoever built this wall did not want anybody to climb it." },
      { by: 'b', say: "That's kind of the point of a wall." },
    ] },
    { id: 'bwh2.wl-s8', when: WL, turns: [
      { by: 'a', say: "Is it towers we're counting, or hills?" },
      { by: 'b', say: "Towers. Every hill has a tower." },
      { by: 'a', say: "It feels like a lot more than seven." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'bwh2.wl-f5', when: WL, turns: [
      { beat: '{a} and {b} pass tower after tower without a word, saving every breath for the steps, and burst into the last tower as the monk lifts his mallet.' },
      { by: 'b', say: "Don't swing it! We're here! We're both here!" },
      { beat: 'The monk lowers the mallet, and nods.' },
    ] },
    { id: 'bwh2.wl-f6', when: WL, turns: [
      { by: 'a', say: "Count the steps. Out loud. It stops me thinking about how many are left." },
      { beat: 'Six hundred and twelve steps later, counted every one, they walk into the last tower. The gong is silent.' },
      { by: 'b', say: "Six hundred and twelve! We did it!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'bwh2.wl-a5', when: WL, turns: [
      { by: 'b', say: "We always lose it in the middle. The bit where it's steepest. So we save our legs for the middle." },
      { by: 'a', say: "Go slow at the start? On purpose?" },
      { by: 'b', say: "Slow at the start, fast in the middle, crawl at the end." },
      { beat: 'Slow, then fast, then slow, and they fall into the last tower with the gong still quiet.' },
    ] },
    { id: 'bwh2.wl-a6', when: WL, turns: [
      { beat: 'Back at the start again, {a} watches the monk through the mist and times the gong against {a.posAdj} own heartbeat.' },
      { by: 'a', say: "He waits till the first team's nearly there. We just need to be first." },
      { beat: 'They run harder than they\'ve run all day and reach the last tower ahead of the gong.' },
      { by: 'b', say: "We made it! Just!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'bwh2.wl-t4', when: WL, turns: [
      { beat: 'A tour group fills a narrow stretch of the wall, taking photos, and won\'t move for {a} or {b}.' },
      { by: 'a', say: "Excuse me. Sorry. Excuse me." },
      { by: 'b', say: "Squeeze past! Say sorry and squeeze past!" },
    ] },
    { id: 'bwh2.wl-t5', when: WL, turns: [
      { by: 'b', say: "I think the towers are getting further apart." },
      { by: 'a', say: "They're getting further apart because we're getting slower." },
      { by: 'b', say: "Don't say that. Even if it's true." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'bwh2.wl-x4', when: WL, turns: [
      { beat: '{a} and {b} come through the last tower door together, and the monk, very calmly, points at the gong. It\'s still humming.' },
      { by: 'a', say: "It's still humming! That means it was just now!" },
      { by: 'b', say: "Just now is too late! Back to the start!" },
    ] },
    { id: 'bwh2.wl-x5', when: WL, turns: [
      { beat: '{a} and {b} sprint into a watchtower, punching the air, and find it empty. It\'s the second-to-last one. BONG.' },
      { by: 'a', say: "We were celebrating at the wrong tower!" },
      { by: 'b', say: "Count them next time! Back to the start!" },
    ] },
  ],
  'task-done.any': [
    { id: 'bwh2.wl-dn4', when: WL, turns: [
      { beat: 'The monk lets {a} tap the gong, very gently, once.' },
      { by: 'a', say: "I hit the gong. That felt so good." },
      { by: 'b', say: "How did it feel?" },
      { by: 'a', say: "So good. After all that." },
    ] },
    { id: 'bwh2.wl-dn5', when: WL, turns: [
      { by: 'b', say: "We have to walk back down eventually." },
      { by: 'a', say: "Can we rest first?" },
      { by: 'b', say: "Today. The banquet's at the bottom." },
    ] },
    { id: 'bwh2.wl-dn6', when: WL, turns: [
      { beat: '{a} leans out of the tower window and looks back along the ridge at the wall, snaking away into the mist.' },
      { by: 'a', say: "Look at it. You can't even see where we started." },
      { by: 'b', say: "Good. Let's never see it again." },
    ] },
  ],
};

const bowl = {
  'task-start.any': [
    { id: 'bwh2.dl-s5', when: DL, turns: [
      { beat: 'The cook ties a napkin round {a}\'s neck, pats {a.posAdj} cheek, and steps back to watch.' },
      { by: 'a', say: "She's being so kind. That makes it worse." },
      { by: 'b', say: "She's proud of her cooking." },
      { by: 'a', say: "I know. I don't want to let her down." },
    ] },
    { id: 'bwh2.dl-s6', when: DL, turns: [
      { by: 'b', say: "Eat the one she won't name first. Then everything after it is easy." },
      { by: 'a', say: "Or I eat it last, and maybe I'll be too full to care." },
      { by: 'b', say: "Just get it over with." },
    ] },
    { id: 'bwh2.dl-s7', when: DL, turns: [
      { beat: '{a} pokes the soup with a chopstick, and something in it bobs up.' },
      { by: 'a', say: "What is that? What's in there?" },
      { by: 'b', say: "Don't ask! Just drink it!" },
    ] },
    { id: 'bwh2.dl-s8', when: DL, turns: [
      { by: 'a', say: "Can I have something to wash it down?" },
      { beat: 'The cook smiles and sets down a cup of tea with a dried flower floating in it.' },
      { by: 'a', say: "Thank you. That's so kind." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'bwh2.dl-f5', when: DL, turns: [
      { beat: '{a} eats with eyes shut, chopsticks moving fast, crunching, slurping, swallowing, and opens them to an empty bowl.' },
      { by: 'a', say: "Is it gone? Did I eat it all? I didn't look." },
      { by: 'b', say: "All of it! She's clapping!" },
    ] },
    { id: 'bwh2.dl-f6', when: DL, turns: [
      { by: 'a', say: "Talk to me while I eat. About anything. About the weather." },
      { by: 'b', say: "Okay. When we get home, I'm making you dinner. Anything you want." },
      { beat: 'Bite by bite, the bowl empties, and the cook takes it back with both hands and a deep bow.' },
      { by: 'a', say: "I'm holding you to that dinner." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'bwh2.dl-a5', when: DL, turns: [
      { by: 'b', say: "You keep gagging on the scorpions because you bite the tail. Snap the tail off. Eat it last, on its own." },
      { by: 'a', say: "Eat the tail on its own? That's not better." },
      { by: 'b', say: "Small pieces. Trust me." },
      { beat: 'Small pieces, one at a time, and the second bowl goes down and stays down. The cook nods.' },
    ] },
    { id: 'bwh2.dl-a6', when: DL, turns: [
      { beat: 'Third bowl. {a} asks the cook how she eats it. She eats a scorpion in two quick bites, smiling, and nods at {a}.' },
      { by: 'a', say: "Okay. Quick. Like it's nothing." },
      { beat: 'Quickly, without stopping, {a} works through the bowl, and the cook laughs and hands over the tip.' },
      { by: 'b', say: "You did it! She showed you!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'bwh2.dl-t4', when: DL, turns: [
      { beat: '{a} has the thousand-year egg in {a.posAdj} mouth and hasn\'t swallowed it, chewed it or moved for twenty seconds.' },
      { by: 'b', say: "Swallow. Just swallow. One swallow." },
      { by: 'a', say: "Mm-mm. Mm-mm." },
    ] },
    { id: 'bwh2.dl-t5', when: DL, turns: [
      { by: 'a', say: "Every time I finish something, there's more under it." },
      { by: 'b', say: "It's nearly done. Keep going." },
      { by: 'a', say: "It's never going to be done." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'bwh2.dl-x4', when: DL, turns: [
      { beat: '{a} finishes the bowl, sits back, and gags, and a bit of it comes back up onto the table.' },
      { by: 'a', say: "That doesn't count. That was nothing." },
      { by: 'b', say: "It was something! She's pointing at a new bowl!" },
    ] },
    { id: 'bwh2.dl-x5', when: DL, turns: [
      { beat: '{a} drops the last scorpion off the chopsticks. It bounces off the table and over the edge of the wall.' },
      { by: 'a', say: "It fell! Does that count?" },
      { by: 'b', say: "Not unless it's in you! New bowl!" },
    ] },
  ],
  'task-done.any': [
    { id: 'bwh2.dl-dn4', when: DL, turns: [
      { by: 'b', say: "What did the one with no name taste like?" },
      { by: 'a', say: "I don't know. I didn't want to know." },
      { by: 'b', say: "Fair enough." },
    ] },
    { id: 'bwh2.dl-dn5', when: DL, turns: [
      { beat: 'The cook wraps a fried scorpion in a paper napkin and presses it into {a}\'s hand as a gift for the road.' },
      { by: 'a', say: "For later. Thank you. So much." },
      { by: 'b', say: "Are you going to eat it later?" },
      { by: 'a', say: "No. Never. But it was nice of her." },
    ] },
    { id: 'bwh2.dl-dn6', when: DL, turns: [
      { by: 'a', say: "I can't believe what I ate today." },
      { by: 'b', say: "And you're still standing." },
      { by: 'a', say: "Just about. Don't make me move yet." },
    ] },
  ],
};

export default mergePools(wall, bowl);
