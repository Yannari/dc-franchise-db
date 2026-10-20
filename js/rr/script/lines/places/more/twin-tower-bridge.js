// Twin Tower Bridge, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/twin-tower-bridge.js: both follow the kidnapper's riddle notes
// through the fortress by lantern to the one silent guard in a fur hat; at the jewel vault, a picks from the velvet
// table for the keeper and b watches from the rope.
import { V, mergePools } from '../_kit.js';

const KD = { taskId: 'kidnapper' };
const CJ = { taskId: 'crown-jewel' };

const kidnapper = {
  'task-start.any': [
    { id: 'ttb2.kd-s5', when: KD, turns: [
      { beat: 'The first note is made of letters cut out of newspapers and glued on, every one a different size.' },
      { by: 'a', say: "He's gone to so much effort." },
      { by: 'b', say: "He's a kidnapper with a lot of free time." },
      { by: 'a', say: "And a lot of glue." },
    ] },
    { id: 'ttb2.kd-s6', when: KD, turns: [
      { by: 'b', say: "'I have teeth but cannot bite, I guard you in the day and night.'" },
      { by: 'a', say: "A dog?" },
      { by: 'b', say: "The portcullis. The gate with the spikes. It's always the gate." },
    ] },
    { id: 'ttb2.kd-s7', when: KD, turns: [
      { beat: 'A raven lands on the wall beside {a} and watches the lantern with one black eye.' },
      { by: 'a', say: "Is the raven part of it?" },
      { by: 'b', say: "Everything in here feels part of it." },
      { beat: 'The raven croaks once and flies off into the dark, which doesn\'t help at all.' },
    ] },
    { id: 'ttb2.kd-s8', when: KD, turns: [
      { by: 'a', ...V("You hold the lantern. I hold the note. Nobody holds my hand.", "You do the lantern, I'll do the note.", "Lantern. Note. Go.", "YOU hold the lantern! I hold the NOTE!", "You hold the lantern, I'll hold the note, and maybe hold my hand a little.", "You're the light, I'm the brains, and the fortress is the problem.") },
      { by: 'b', say: "Why can't I hold your hand?" },
      { by: 'a', say: "Because then I'll know you're scared too." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'ttb2.kd-f5', when: KD, turns: [
      { beat: 'Cannon, cobbled lane, dungeon cell: {a} reads each riddle aloud once and {b} is already running to the answer.' },
      { by: 'a', say: "Last note: 'He stands where the river can see him.'" },
      { beat: 'One guard faces the river. They stand in front of him. He hands over the tip without a flicker.' },
      { by: 'b', say: "We should rob banks. We'd never get caught." },
    ] },
    { id: 'ttb2.kd-f6', when: KD, turns: [
      { by: 'b', say: "This note's in mirror writing. Hold it up to the lantern glass." },
      { beat: 'Backwards in the lantern glass, the words read right. Every note after it falls into place, and the last points to one guard.' },
      { by: 'a', say: "The guard's twitching! He's not supposed to twitch! It's him!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'ttb2.kd-a5', when: KD, turns: [
      { by: 'a', say: "Every note is tied with a ribbon. A red one, then a blue one... the last one's green." },
      { by: 'b', say: "The guards have coloured badges on their coats." },
      { by: 'a', say: "Find the green badge." },
      { beat: 'One guard has a green badge. They stand in front of him. He hands over the tip, still staring at nothing.' },
    ] },
    { id: 'ttb2.kd-a6', when: KD, turns: [
      { beat: 'Back at the dungeon cell for the second time, {b} holds the lantern low and finds words scratched into the floor that they missed.' },
      { by: 'b', say: "The real clue's down here! The note was only half of it!" },
      { beat: 'The scratched words lead to the bell tower, and to the guard at its door, who hands over the tip.' },
      { by: 'a', say: "Floor! We forgot to read the floor!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'ttb2.kd-t4', when: KD, turns: [
      { beat: '{a} and {b} stand in front of a row of identical guards, identical hats, identical faces, completely still.' },
      { by: 'a', say: "They're copies. Somebody's made copies of one guard." },
      { by: 'b', say: "That one breathed. I think." },
    ] },
    { id: 'ttb2.kd-t5', when: KD, turns: [
      { by: 'b', say: "'The more you take, the more you leave behind.'" },
      { by: 'a', say: "Money? Biscuits?" },
      { by: 'b', say: "Biscuits? How would you leave biscuits behind?" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'ttb2.kd-x4', when: KD, turns: [
      { beat: '{a} and {b} plant themselves in front of a guard, wait a whole minute, and then notice he\'s a statue.' },
      { by: 'a', say: "He's stone. We've been waiting for a stone man." },
      { by: 'b', say: "To be fair, so are the real ones. Back to the last note." },
    ] },
    { id: 'ttb2.kd-x5', when: KD, turns: [
      { beat: 'The note says "the third cell". {a} and {b} search the third cell from the left. The note meant the right.' },
      { by: 'b', say: "Why does nobody say which end they're counting from?" },
      { by: 'a', say: "Back to the last clue. Count from both ends this time." },
    ] },
  ],
  'task-done.any': [
    { id: 'ttb2.kd-dn4', when: KD, turns: [
      { beat: 'As {a} and {b} walk away, the guard who gave them the tip lets out the tiniest sigh.' },
      { by: 'a', say: "Did he just sigh?" },
      { by: 'b', say: "Don't turn round. Let him have his sigh." },
    ] },
    { id: 'ttb2.kd-dn5', when: KD, turns: [
      { by: 'b', say: "I want a hat like that. A big fur one." },
      { by: 'a', say: "You'd have to stand still all day." },
      { by: 'b', say: "I could stand still all day. I've been training for that my whole life." },
    ] },
    { id: 'ttb2.kd-dn6', when: KD, turns: [
      { by: 'a', say: "The kidnapper left eight notes. Eight. He didn't kidnap anybody." },
      { by: 'b', say: "He kidnapped our tip." },
      { by: 'a', say: "And we rescued it. Put that in the papers." },
    ] },
  ],
};

const jewel = {
  'task-start.any': [
    { id: 'ttb2.cj-s5', when: CJ, turns: [
      { beat: '{a} breathes on a ring to polish it on {a.posAdj} sleeve. The fog on the stone stays for a second, then fades.' },
      { by: 'b', say: "Wait. Do that to all of them. Real diamonds clear straight away." },
      { by: 'a', say: "How do you know that?" },
      { by: 'b', say: "A film. A heist film." },
    ] },
    { id: 'ttb2.cj-s6', when: CJ, turns: [
      { by: 'a', say: "Twenty. Twenty of them, and only one's real." },
      { by: 'b', say: "That's nineteen chances to be wrong." },
      { by: 'a', say: "Thank you. That's very helpful." },
    ] },
    { id: 'ttb2.cj-s7', when: CJ, turns: [
      { beat: 'The keeper hands {a} a pair of white gloves. They\'re three sizes too big.' },
      { by: 'a', say: "I've got the hands of a giant now." },
      { by: 'b', say: "Careful. Giants drop things." },
    ] },
    { id: 'ttb2.cj-s8', when: CJ, turns: [
      { by: 'b', say: "Turn them over. Fakes always have a little stamp underneath." },
      { by: 'a', say: "Like a price?" },
      { by: 'b', say: "Like 'made somewhere cheap'." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'ttb2.cj-f5', when: CJ, turns: [
      { beat: '{a} breathes on stone after stone. Every one stays foggy. Then one clears in a blink.' },
      { by: 'a', say: "That one. The fog didn't stay." },
      { beat: 'The keeper holds the ring to the light, turns it once, and nods.' },
      { by: 'b', say: "Breath! You found it with breath!" },
    ] },
    { id: 'ttb2.cj-f6', when: CJ, turns: [
      { by: 'a', say: "This crown's got a dent in it. A small one. On the back." },
      { by: 'b', say: "A dent's bad, isn't it?" },
      { by: 'a', say: "A real crown's been worn. Somebody's dropped it once." },
      { beat: 'The keeper holds the dented crown up to the light, and nods. Real.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'ttb2.cj-a5', when: CJ, turns: [
      { by: 'b', say: "Stop picking the ones in the middle! They put the shiniest ones in the middle to trick you!" },
      { beat: '{a} goes to the far corner of the velvet and picks up a small sceptre with a dusty orb on top. The keeper holds it up and nods.' },
      { by: 'a', say: "It was hiding in the corner!" },
      { by: 'b', say: "Like you at a party!" },
    ] },
    { id: 'ttb2.cj-a6', when: CJ, turns: [
      { beat: 'After three fakes, {a} rubs the pearls of a necklace gently against {a.posAdj} front teeth, one by one.' },
      { by: 'a', say: "These ones are smooth. Fake. This one's gritty." },
      { beat: 'The keeper looks horrified, then holds the gritty necklace up to the light, and slowly nods.' },
      { by: 'b', say: "You licked the crown jewels!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'ttb2.cj-t4', when: CJ, turns: [
      { beat: '{a} is holding a crown in each hand at arm\'s length, weighing them, eyes shut.' },
      { by: 'a', say: "They weigh exactly the same." },
      { by: 'b', say: "Then open your eyes and look!" },
    ] },
    { id: 'ttb2.cj-t5', when: CJ, turns: [
      { by: 'b', say: "Is the keeper even breathing? She hasn't moved." },
      { by: 'a', say: "She's watching my hands. She thinks I'll steal something." },
      { by: 'b', say: "You keep holding them up to your face. You look like you're going to." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'ttb2.cj-x4', when: CJ, turns: [
      { beat: 'The keeper turns the ring {a} chose over. On the inside of the band, in tiny letters, it says SOUVENIR.' },
      { by: 'a', say: "How did I miss that?" },
      { by: 'b', say: "You didn't read it! Back to the table!" },
    ] },
    { id: 'ttb2.cj-x5', when: CJ, turns: [
      { beat: 'The keeper holds the crown {a} chose up to the light. The light shines straight through the red stone, like a sweet.' },
      { by: 'a', say: "That's a sweet. Is that a sweet?" },
      { by: 'b', say: "Don't eat it! Put it back! Choose again!" },
    ] },
  ],
  'task-done.any': [
    { id: 'ttb2.cj-dn4', when: CJ, turns: [
      { by: 'b', say: "How much do you think it was worth?" },
      { by: 'a', say: "More than everything we own." },
      { by: 'b', say: "More than everything our street owns." },
    ] },
    { id: 'ttb2.cj-dn5', when: CJ, turns: [
      { beat: 'The keeper takes back her white gloves from {a} finger by finger, very slowly, without a word.' },
      { by: 'a', say: "I think she's checking I didn't keep anything inside them." },
      { by: 'b', say: "Did you?" },
    ] },
    { id: 'ttb2.cj-dn6', when: CJ, turns: [
      { by: 'a', say: "Nineteen fakes on that table. Who makes nineteen fakes?" },
      { by: 'b', say: "Somebody who's very good at fakes." },
      { by: 'a', say: "Let's not ask where they got the real one from." },
    ] },
  ],
};

export default mergePools(kidnapper, jewel);
