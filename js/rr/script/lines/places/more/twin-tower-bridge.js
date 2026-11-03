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
      { by: 'a', say: "That's so creepy." },
      { by: 'b', say: "It's like a film." },
      { by: 'a', say: "Read it." },
    ] },
    { id: 'ttb2.kd-s6', when: KD, turns: [
      { by: 'b', say: "'I have teeth but cannot bite, I guard you in the day and night.'" },
      { by: 'a', say: "A dog?" },
      { by: 'b', say: "The portcullis. The gate with the spikes." },
    ] },
    { id: 'ttb2.kd-s7', when: KD, turns: [
      { beat: 'A raven lands on the wall beside {a} and watches the lantern with one black eye.' },
      { by: 'a', say: "Is the raven part of it?" },
      { by: 'b', say: "I don't know." },
      { beat: 'The raven croaks once and flies off into the dark.' },
    ] },
    { id: 'ttb2.kd-s8', when: KD, turns: [
      { by: 'a', say: "You hold the lantern. I'll hold the note." },
      { by: 'b', say: "Can I hold your hand too?" },
      { by: 'a', say: "Okay. Yes. Hold my hand." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'ttb2.kd-f5', when: KD, turns: [
      { beat: 'Cannon, cobbled lane, dungeon cell: {a} reads each riddle aloud once and {b} is already running to the answer.' },
      { by: 'a', say: "Last note: 'He stands where the river can see him.'" },
      { beat: 'One guard faces the river. They stand in front of him. He hands over the tip without a flicker.' },
      { by: 'b', say: "That was so fast!" },
    ] },
    { id: 'ttb2.kd-f6', when: KD, turns: [
      { by: 'b', say: "This note's in mirror writing. Hold it up to the lantern glass." },
      { beat: 'Backwards in the lantern glass, the words read right. Every note after it falls into place, and the last points to one guard.' },
      { by: 'a', say: "That's the guard! It's him!" },
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
      { by: 'a', say: "The floor! We forgot to check the floor!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'ttb2.kd-t4', when: KD, turns: [
      { beat: '{a} and {b} stand in front of a row of identical guards, identical hats, identical faces, completely still.' },
      { by: 'a', say: "They all look exactly the same." },
      { by: 'b', say: "Look closely. One of them has to be different." },
    ] },
    { id: 'ttb2.kd-t5', when: KD, turns: [
      { by: 'b', say: "'The more you take, the more you leave behind.'" },
      { by: 'a', say: "Money? I don't know." },
      { by: 'b', say: "Footsteps. It's footsteps." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'ttb2.kd-x4', when: KD, turns: [
      { beat: '{a} and {b} stand in front of a guard for a whole minute, and then realise he\'s a statue.' },
      { by: 'a', say: "He's a statue. We've been waiting for a statue." },
      { by: 'b', say: "They all look the same in the fog. Back to the last note." },
    ] },
    { id: 'ttb2.kd-x5', when: KD, turns: [
      { beat: 'The note says "the third cell". {a} and {b} search the third cell from the left. The note meant the right.' },
      { by: 'b', say: "Why does nobody say which end they're counting from?" },
      { by: 'a', say: "Back to the last clue. Count from both ends this time." },
    ] },
  ],
  'task-done.any': [
    { id: 'ttb2.kd-dn4', when: KD, turns: [
      { beat: 'As {a} and {b} walk away, the guard who gave them the tip stays perfectly still.' },
      { by: 'a', say: "He didn't even blink." },
      { by: 'b', say: "I don't know how they do it." },
    ] },
    { id: 'ttb2.kd-dn5', when: KD, turns: [
      { by: 'b', say: "I want a hat like that. A big fur one." },
      { by: 'a', say: "You'd have to stand still all day." },
      { by: 'b', say: "I couldn't do that." },
    ] },
    { id: 'ttb2.kd-dn6', when: KD, turns: [
      { by: 'a', say: "The kidnapper left eight notes. Eight. He didn't kidnap anybody." },
      { by: 'b', say: "It was just for the race." },
      { by: 'a', say: "Good. Come on." },
    ] },
  ],
};

const jewel = {
  'task-start.any': [
    { id: 'ttb2.cj-s5', when: CJ, turns: [
      { beat: '{a} breathes on a ring to polish it on {a.posAdj} sleeve. The fog on the stone stays for a second, then fades.' },
      { by: 'b', say: "Wait. Do that to all of them. Real diamonds clear straight away." },
      { by: 'a', say: "How do you know that?" },
      { by: 'b', say: "From a film." },
    ] },
    { id: 'ttb2.cj-s6', when: CJ, turns: [
      { by: 'a', say: "Twenty. Twenty of them, and only one's real." },
      { by: 'b', say: "Then we take our time." },
      { by: 'a', say: "Okay." },
    ] },
    { id: 'ttb2.cj-s7', when: CJ, turns: [
      { beat: 'The keeper hands {a} a pair of white gloves. They\'re much too big.' },
      { by: 'a', say: "These are huge." },
      { by: 'b', say: "Just be careful." },
    ] },
    { id: 'ttb2.cj-s8', when: CJ, turns: [
      { by: 'b', say: "Turn them over. Fakes always have a little stamp underneath." },
      { by: 'a', say: "Really?" },
      { by: 'b', say: "Sometimes. Just check." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'ttb2.cj-f5', when: CJ, turns: [
      { beat: '{a} breathes on stone after stone. Every one stays foggy. Then one clears in a blink.' },
      { by: 'a', say: "That one. The fog didn't stay." },
      { beat: 'The keeper holds the ring to the light, turns it once, and nods.' },
      { by: 'b', say: "That's so smart!" },
    ] },
    { id: 'ttb2.cj-f6', when: CJ, turns: [
      { by: 'a', say: "This crown's got a dent in it. A small one. On the back." },
      { by: 'b', say: "A dent's bad, isn't it?" },
      { by: 'a', say: "A real crown's been worn. It's old." },
      { beat: 'The keeper holds the dented crown up to the light, and nods. Real.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'ttb2.cj-a5', when: CJ, turns: [
      { by: 'b', say: "Stop picking the ones in the middle! They put the shiniest ones in the middle to trick you!" },
      { beat: '{a} goes to the far corner of the velvet and picks up a small sceptre with a dusty orb on top. The keeper holds it up and nods.' },
      { by: 'a', say: "It was hiding in the corner!" },
      { by: 'b', say: "That's so smart!" },
    ] },
    { id: 'ttb2.cj-a6', when: CJ, turns: [
      { beat: 'After three fakes, {a} rubs the pearls of a necklace gently against {a.posAdj} front teeth, one by one, the way the keeper does.' },
      { by: 'a', say: "These ones are smooth. Fake. This one's gritty." },
      { beat: 'The keeper raises an eyebrow, then holds the gritty necklace up to the light, and slowly nods.' },
      { by: 'b', say: "That worked? That actually worked?" },
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
      { by: 'a', say: "She's watching my hands." },
      { by: 'b', say: "You keep holding them so close to your face." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'ttb2.cj-x4', when: CJ, turns: [
      { beat: 'The keeper turns the ring {a} chose over. On the inside of the band, in tiny letters, it says SOUVENIR.' },
      { by: 'a', say: "How did I miss that?" },
      { by: 'b', say: "You didn't read it! Back to the table!" },
    ] },
    { id: 'ttb2.cj-x5', when: CJ, turns: [
      { beat: 'The keeper holds the crown {a} chose up to the light. The light shines straight through the red stone. Glass.' },
      { by: 'a', say: "Glass? It looked so real!" },
      { by: 'b', say: "Put it back! Choose again!" },
    ] },
  ],
  'task-done.any': [
    { id: 'ttb2.cj-dn4', when: CJ, turns: [
      { by: 'b', say: "How much do you think it was worth?" },
      { by: 'a', say: "More than everything we own." },
      { by: 'b', say: "I didn't want to drop it." },
    ] },
    { id: 'ttb2.cj-dn5', when: CJ, turns: [
      { beat: 'The keeper takes back her white gloves from {a} finger by finger, very slowly, without a word.' },
      { by: 'a', say: "She's checking I didn't keep anything." },
      { by: 'b', say: "Did you?" },
    ] },
    { id: 'ttb2.cj-dn6', when: CJ, turns: [
      { by: 'a', say: "Nineteen fakes on that table. Who makes nineteen fakes?" },
      { by: 'b', say: "Somebody who's very good at fakes." },
      { by: 'a', say: "Come on. The Chill Zone." },
    ] },
  ],
};

export default mergePools(kidnapper, jewel);
