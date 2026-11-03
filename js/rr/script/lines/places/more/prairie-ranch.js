// Prairie Ranch, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/prairie-ranch.js: at the cliff top, both eat a whole pot of pork and
// beans down to the tip taped to the bottom (beans left or brought back up, and the cook tops it up); in the barn, a
// rides the mechanical bull for eight seconds, one hand on the rope, and b watches from behind the rail.
import { V, mergePools } from '../_kit.js';

const BE = { taskId: 'beans' };
const BU = { taskId: 'bull' };

const beans = {
  'task-start.any': [
    { id: 'prr2.be-s1', when: BE, turns: [
      { beat: '{a} dips a spoon in and lifts it, and looks at it for a long time.' },
      { by: 'a', say: "There's so much fat in it." },
      { by: 'b', say: "Don't look at it. Just eat." },
    ] },
    { id: 'prr2.be-s2', when: BE, turns: [
      { by: 'b', say: "You eat the left side, I eat the right. We meet in the middle." },
      { by: 'a', say: "Okay. Left side." },
      { by: 'b', say: "Go." },
    ] },
    { id: 'prr2.be-s3', when: BE, turns: [
      { beat: 'The wind blows across the cliff top, and the smell of a dozen pots of beans rolls over {a} and {b} at once.' },
      { by: 'a', say: "Everything smells of beans." },
      { by: 'b', say: "Breathe through your mouth." },
      { by: 'a', say: "That doesn't help!" },
    ] },
    { id: 'prr2.be-s4', when: BE, turns: [
      { by: 'a', say: "Is there a trick to eating fast?" },
      { by: 'b', say: "Don't chew too much. Just swallow." },
      { by: 'a', say: "Okay. Okay." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'prr2.be-f1', when: BE, turns: [
      { beat: 'Their spoons hit the bottom of the pot at the same moment with a clang. The tip is taped right between them.' },
      { by: 'a', say: "We did it! The tip!" },
      { by: 'b', say: "Don't move too fast. Gently." },
    ] },
    { id: 'prr2.be-f2', when: BE, turns: [
      { by: 'b', say: "We've been eating in silence for twenty minutes." },
      { by: 'a', say: "I can't talk. I'm too full." },
      { beat: '{a} scrapes the last spoonful and peels off the tip. The cook raises his eyebrows and nods.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'prr2.be-a1', when: BE, turns: [
      { by: 'a', say: "We keep slowing down at halfway. So we don't stop at halfway. We don't even notice halfway." },
      { beat: 'They don\'t notice halfway. They don\'t notice three-quarters. They notice the bottom, and the tip.' },
      { by: 'b', say: "We didn't even stop!" },
    ] },
    { id: 'prr2.be-a2', when: BE, turns: [
      { beat: 'After the cook tops them up again, {b} tips the pot on its side and eats from the edge.' },
      { by: 'b', say: "This is easier." },
      { beat: 'Spoon by spoon, they get all the way down to the tip.' },
      { by: 'a', say: "It's empty! Finally!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'prr2.be-t1', when: BE, turns: [
      { by: 'b', say: "I've unbuttoned my jeans." },
      { by: 'a', say: "It's that bad?" },
      { by: 'b', say: "Yes. It's that bad." },
    ] },
    { id: 'prr2.be-t2', when: BE, turns: [
      { beat: '{a} holds a full spoon in front of {a.posAdj} mouth and has been holding it there for a minute.' },
      { by: 'b', say: "Eat it." },
      { by: 'a', say: "I'm waiting until I can." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'prr2.be-x1', when: BE, turns: [
      { beat: '{b} lifts the empty pot, but under the rim a whole crust of beans has stuck to the sides. The cook points at it and fetches the ladle.' },
      { by: 'b', say: "Those were stuck on!" },
      { by: 'a', say: "They still count. Scrape the sides this time." },
    ] },
    { id: 'prr2.be-x2', when: BE, turns: [
      { beat: '{a} stands up too fast, goes grey, and sits straight back down. The cook is already walking over with more beans.' },
      { by: 'a', say: "I'm fine! I'm fine!" },
      { by: 'b', say: "He saw. Spoon in. Again." },
    ] },
  ],
  'task-done.any': [
    { id: 'prr2.be-dn1', when: BE, turns: [
      { by: 'b', say: "The tip says the barn. The bull." },
      { by: 'a', say: "I don't want to ride it after all those beans." },
      { by: 'b', say: "Neither of us does." },
    ] },
    { id: 'prr2.be-dn2', when: BE, turns: [
      { beat: '{a} and {b} walk away from the table very slowly.' },
      { by: 'a', say: "Don't jog. Whatever happens, don't jog." },
      { by: 'b', say: "I wasn't going to." },
    ] },
    { id: 'prr2.be-dn3', when: BE, turns: [
      { by: 'a', say: "Thank you, cook." },
      { by: 'b', say: "Why are you thanking him?" },
      { by: 'a', say: "Because they were actually good." },
    ] },
  ],
};

const bull = {
  'task-start.any': [
    { id: 'prr2.bu-s1', when: BU, turns: [
      { beat: '{a} pats the side of the mechanical bull. It is cold and smells of old leather and hay.' },
      { by: 'a', say: "Please be nice to me." },
      { by: 'b', say: "It's a machine. It's not going to be nice." },
    ] },
    { id: 'prr2.bu-s2', when: BU, turns: [
      { by: 'b', say: "Right hand on the rope, left hand up in the air. Don't touch the bull with the free hand." },
      { by: 'a', say: "What if I need it?" },
      { by: 'b', say: "Then you start again. Keep it up." },
    ] },
    { id: 'prr2.bu-s3', when: BU, turns: [
      { beat: 'The cowboy at the controls looks at {a}, looks at the dial, and turns it up one notch with a little smile.' },
      { by: 'a', say: "What did he just do?" },
      { by: 'b', say: "Nothing. He did nothing. Don't look at him." },
    ] },
    { id: 'prr2.bu-s4', when: BU, turns: [
      { by: 'a', say: "If I'm thrown off, aim me at the hay." },
      { by: 'b', say: "I'll be right here." },
      { by: 'a', say: "Okay. Here we go." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'prr2.bu-f1', when: BU, turns: [
      { beat: 'The bull bucks. {a} goes loose and moves with it, and is still sitting there when the timer hits eight.' },
      { by: 'b', say: "You just went with it!" },
      { by: 'a', say: "Staying loose works." },
    ] },
    { id: 'prr2.bu-f2', when: BU, turns: [
      { by: 'a', say: "One, two, three..." },
      { beat: '{a} counts out loud, louder on every buck, and is shouting "EIGHT!" as the bull stops dead.' },
      { by: 'b', say: "First go! Not a single wobble!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'prr2.bu-a1', when: BU, turns: [
      { by: 'b', say: "It always spins left after the second buck. Lean right before it does." },
      { beat: '{a} leans right before it spins left, and stays on, right through to eight.' },
      { by: 'a', say: "You figured it out!" },
      { by: 'b', say: "I've been watching it throw you for twenty minutes." },
    ] },
    { id: 'prr2.bu-a2', when: BU, turns: [
      { beat: 'Covered in hay, {a} climbs on for the fifth time, wraps the rope round {a.posAdj} hand twice, and stares straight ahead.' },
      { by: 'a', say: "Not looking at it. Not thinking about it. Just sitting." },
      { beat: '{a} gets to eight, and the cowboy tips his hat.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'prr2.bu-t1', when: BU, turns: [
      { by: 'a', say: "I feel sick. I feel so sick." },
      { by: 'b', say: "Don't think about it!" },
      { by: 'a', say: "I can't think about anything else!" },
    ] },
    { id: 'prr2.bu-t2', when: BU, turns: [
      { beat: '{a} lies on {a.posAdj} back in the hay, looking up at the barn roof, for the fourth time.' },
      { by: 'a', say: "I've seen this roof so many times now." },
      { by: 'b', say: "Then get back on." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'prr2.bu-x1', when: BU, turns: [
      { beat: '{a} stays on through a huge buck, cheers, waves the free arm, and slides straight off the side.' },
      { by: 'b', say: "You were celebrating at five!" },
      { by: 'a', say: "It felt like eight! Back on!" },
    ] },
    { id: 'prr2.bu-x2', when: BU, turns: [
      { beat: 'The bull spins one way and {a} keeps going the other, and lands in the hay facing the wrong direction.' },
      { by: 'a', say: "Which way is the bull? Where's it gone?" },
      { by: 'b', say: "Behind you! Climb back on it!" },
    ] },
  ],
  'task-done.any': [
    { id: 'prr2.bu-dn1', when: BU, turns: [
      { by: 'a', say: "Am I still moving? I feel like I'm still moving." },
      { by: 'b', say: "You're standing still." },
      { by: 'a', say: "Everything's still moving." },
    ] },
    { id: 'prr2.bu-dn2', when: BU, turns: [
      { beat: '{a} walks out of the barn bow-legged, picking hay out of {a.posAdj} collar.' },
      { by: 'b', say: "Run to the cliff. The Chill Zone's at the cliff." },
      { by: 'a', say: "I'll walk. I can't run." },
    ] },
    { id: 'prr2.bu-dn3', when: BU, turns: [
      { by: 'b', say: "Beans, then a bull. Who planned this?" },
      { by: 'a', say: "Don." },
      { by: 'b', say: "Of course it was." },
    ] },
  ],
};

export default mergePools(beans, bull);
