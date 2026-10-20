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
      { beat: '{a} dips a spoon in and lifts it. A single strand of pork fat hangs off it, all the way back to the pot.' },
      { by: 'a', say: "It's attached. The spoonful is attached to the rest of it." },
      { by: 'b', say: "Bite through the string and keep going." },
    ] },
    { id: 'prr2.be-s2', when: BE, turns: [
      { by: 'b', say: "You eat the left side, I eat the right. We meet in the middle." },
      { by: 'a', say: "Like a tunnel. Two crews, one tunnel." },
      { by: 'b', say: "A tunnel made of beans. Dig." },
    ] },
    { id: 'prr2.be-s3', when: BE, turns: [
      { beat: 'The wind blows across the cliff top, and the smell of a dozen pots of beans rolls over {a} and {b} at once.' },
      { by: 'a', say: "Even the wind smells of beans." },
      { by: 'b', say: "Breathe through your mouth." },
      { by: 'a', say: "My mouth is where the beans go!" },
    ] },
    { id: 'prr2.be-s4', when: BE, turns: [
      { by: 'a', say: "Is there a trick to eating fast?" },
      { by: 'b', ...V("Don't chew. Beans don't need chewing. They're soft.", "Don't chew. They're soft.", "No chewing.", "DON'T chew! Beans are SOFT!", "Try not to chew, beans are soft enough already.", "Chewing is a choice. Today we choose not to.") },
      { by: 'a', say: "That sounds wrong, and I'm going to do it." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'prr2.be-f1', when: BE, turns: [
      { beat: 'Their spoons hit the bottom of the pot at the same moment with a clang. The tip is taped right between them.' },
      { by: 'a', say: "We met in the middle! The tunnel works!" },
      { by: 'b', say: "Don't celebrate too hard. Gently. Everything gently." },
    ] },
    { id: 'prr2.be-f2', when: BE, turns: [
      { by: 'b', say: "We've been eating in silence for twenty minutes." },
      { by: 'a', say: "Because talking lets air in, and air takes up bean room." },
      { beat: '{a} scrapes the last spoonful and peels off the tip. The cook raises his eyebrows and nods.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'prr2.be-a1', when: BE, turns: [
      { by: 'a', say: "We keep slowing down at halfway. So we don't stop at halfway. We don't even notice halfway." },
      { beat: 'They don\'t notice halfway. They don\'t notice three-quarters. They notice the bottom, and the tip.' },
      { by: 'b', say: "Where did halfway go?" },
    ] },
    { id: 'prr2.be-a2', when: BE, turns: [
      { beat: 'After the cook tops them up again, {b} tips the pot on its side and eats from the edge, like a trough.' },
      { by: 'b', say: "Gravity helps. Let the beans come to us." },
      { beat: 'The beans come to them, all the way down to the tip.' },
      { by: 'a', say: "That's not elegant, but it's empty." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'prr2.be-t1', when: BE, turns: [
      { by: 'b', say: "I've unbuttoned my jeans." },
      { by: 'a', say: "It's that bad?" },
      { by: 'b', say: "It's a pot of beans. Of course it's that bad." },
    ] },
    { id: 'prr2.be-t2', when: BE, turns: [
      { beat: '{a} holds a full spoon in front of {a.posAdj} mouth and has been holding it there for a minute.' },
      { by: 'b', say: "It won't eat itself." },
      { by: 'a', say: "I'm waiting for room to come free." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'prr2.be-x1', when: BE, turns: [
      { beat: '{b} lifts the empty pot, but under the rim a whole crust of beans has stuck to the sides. The cook points at it and fetches the ladle.' },
      { by: 'b', say: "Those were stuck on! They don't count!" },
      { by: 'a', say: "They count to him. Spoons up. Scrape the sides this time." },
    ] },
    { id: 'prr2.be-x2', when: BE, turns: [
      { beat: '{a} stands up too fast, goes grey, and sits straight back down. The cook is already walking over with more beans.' },
      { by: 'a', say: "I didn't! Nothing came up! Nearly nothing!" },
      { by: 'b', say: "He saw nearly. Spoon in. Again." },
    ] },
  ],
  'task-done.any': [
    { id: 'prr2.be-dn1', when: BE, turns: [
      { by: 'b', say: "The tip says the barn. The bull." },
      { by: 'a', say: "Whoever rides it shouldn't be the one who just ate a pot of beans." },
      { by: 'b', say: "We both just ate a pot of beans." },
    ] },
    { id: 'prr2.be-dn2', when: BE, turns: [
      { beat: '{a} and {b} walk away from the table very carefully, like two people carrying soup inside themselves.' },
      { by: 'a', say: "Don't jog. Whatever happens, don't jog." },
      { by: 'b', say: "I wasn't going to jog. I'm never jogging again." },
    ] },
    { id: 'prr2.be-dn3', when: BE, turns: [
      { by: 'a', say: "Thank you, cook." },
      { by: 'b', say: "Why are you thanking him?" },
      { by: 'a', say: "Because if he likes us, maybe he'll never make us eat beans again." },
    ] },
  ],
};

const bull = {
  'task-start.any': [
    { id: 'prr2.bu-s1', when: BU, turns: [
      { beat: '{a} pats the side of the mechanical bull. It is cold and smells of old leather and hay.' },
      { by: 'a', say: "Good bull. Kind bull. We're friends, you and me." },
      { by: 'b', say: "It's a machine. It doesn't have friends." },
    ] },
    { id: 'prr2.bu-s2', when: BU, turns: [
      { by: 'b', say: "Right hand on the rope, left hand up in the air. Don't touch the bull with the free hand." },
      { by: 'a', say: "What if it needs to be touched?" },
      { by: 'b', say: "It'll cost you eight seconds. Keep it in the air." },
    ] },
    { id: 'prr2.bu-s3', when: BU, turns: [
      { beat: 'The cowboy at the controls looks at {a}, looks at the dial, and turns it up one notch with a little smile.' },
      { by: 'a', say: "What did he just do?" },
      { by: 'b', say: "Nothing. He did nothing. Don't look at him." },
    ] },
    { id: 'prr2.bu-s4', when: BU, turns: [
      { by: 'a', say: "If I'm thrown off, aim me at the hay." },
      { by: 'b', say: "I can't aim you. I'm behind a rail." },
      { by: 'a', say: "Aim me with your mind." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'prr2.bu-f1', when: BU, turns: [
      { beat: 'The bull bucks. {a} goes with it, loose as a rag doll, and is still sitting there, smiling, when the timer hits eight.' },
      { by: 'b', say: "You were all floppy!" },
      { by: 'a', say: "You can't throw off a floppy person. Science." },
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
      { by: 'a', say: "You figured out the bull!" },
      { by: 'b', say: "I've been watching it throw you for twenty minutes." },
    ] },
    { id: 'prr2.bu-a2', when: BU, turns: [
      { beat: 'Covered in hay, {a} climbs on for the fifth time, wraps the rope round {a.posAdj} hand twice, and stares straight ahead.' },
      { by: 'a', say: "Not looking at it. Not thinking about it. Just sitting." },
      { beat: 'Just sitting gets {a} to eight. The cowboy tips his hat.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'prr2.bu-t1', when: BU, turns: [
      { by: 'a', say: "The beans. The beans are moving." },
      { by: 'b', say: "Don't think about the beans!" },
      { by: 'a', say: "I'm sitting on a bucking bull! They're all I can think about!" },
    ] },
    { id: 'prr2.bu-t2', when: BU, turns: [
      { beat: '{a} lies on {a.posAdj} back in the hay, looking up at the barn roof, for the fourth time.' },
      { by: 'a', say: "There's a bird's nest up there. I know it very well now." },
      { by: 'b', say: "Stop learning about the roof and get back on." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'prr2.bu-x1', when: BU, turns: [
      { beat: '{a} stays on through a huge buck, cheers, waves the free arm, and slides straight off the side.' },
      { by: 'b', say: "You were celebrating at five!" },
      { by: 'a', say: "Five felt like eight! Back on!" },
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
      { by: 'a', say: "The barn's moving, then." },
    ] },
    { id: 'prr2.bu-dn2', when: BU, turns: [
      { beat: '{a} walks out of the barn bow-legged, picking hay out of {a.posAdj} collar.' },
      { by: 'b', say: "Run to the cliff. The Chill Zone's at the cliff." },
      { by: 'a', say: "I'll walk to the cliff. Like a cowboy. Cowboys never run." },
    ] },
    { id: 'prr2.bu-dn3', when: BU, turns: [
      { by: 'b', say: "Beans, then a bull. Who planned this leg?" },
      { by: 'a', say: "Somebody who wanted to watch." },
      { by: 'b', say: "Don. It was Don. It's always Don." },
    ] },
  ],
};

export default mergePools(beans, bull);
