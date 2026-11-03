// Great Falls, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/great-falls.js: at the wedding chapel, a pulls the slot machine for
// three hearts and finds the matching dress on the rails while b watches from the pews; at the tightrope, both walk it
// one after the other with the balance pole, and a fall into the harness is the winch back to the start.
import { V, mergePools } from '../_kit.js';

const WS = { taskId: 'wedding-slots' };
const TR = { taskId: 'tightrope' };

const slots = {
  'task-start.any': [
    { id: 'grf2.ws-s5', when: WS, turns: [
      { beat: '{a} walks up to the slot machine. The lever is taller than {a.obj}, with a heart-shaped knob on the top.' },
      { by: 'a', say: "How do I even pull that?" },
      { by: 'b', say: "Both hands. Hang off it." },
    ] },
    { id: 'grf2.ws-s6', when: WS, turns: [
      { by: 'b', say: "Blow on it first. For luck." },
      { by: 'a', say: "It's a lever." },
      { beat: '{a} blows on the lever anyway, then pulls it. Heart. Bell. Horseshoe.' },
      { by: 'b', say: "Okay, that didn't work. Pull again." },
    ] },
    { id: 'grf2.ws-s7', when: WS, turns: [
      { beat: 'The old theatre hall is full of plastic flowers, a velvet curtain and an organ playing in the corner.' },
      { by: 'a', say: "Why is there an organ?" },
      { by: 'b', say: "It's a wedding chapel. Don't think about it." },
    ] },
    { id: 'grf2.ws-s8', when: WS, turns: [
      { by: 'a', say: "Three hearts. Come on." },
      { by: 'b', say: "Come on, hearts." },
      { by: 'a', say: "I'm trying!" },
    ] },
  ],
  'task-try.first-try': [
    { id: 'grf2.ws-f5', when: WS, turns: [
      { beat: 'Heart, heart, heart. The machine rings, and out prints a picture of a dress with a really long train.' },
      { by: 'a', say: "That one. The really long one. It's right there." },
      { beat: '{a} drags it out from the end of the rail. The minister holds it up beside the picture and claps.' },
    ] },
    { id: 'grf2.ws-f6', when: WS, turns: [
      { by: 'b', say: "Count the buttons on the picture. Then count the buttons on the dresses." },
      { by: 'a', say: "Fourteen. Fourteen buttons down the back." },
      { beat: '{a} counts down the rail, finds the one dress with fourteen buttons, and the minister nods and hands over the tip.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'grf2.ws-a5', when: WS, turns: [
      { by: 'b', say: "You keep yanking it and the reels go too fast. Pull it smooth." },
      { beat: '{a} pulls it smoothly. Heart. Heart. Heart. The organ bursts into a wedding march.' },
      { by: 'a', say: "Smooth worked!" },
      { beat: 'The picture prints, the dress is three rails down, and the minister holds it up and smiles.' },
    ] },
    { id: 'grf2.ws-a6', when: WS, turns: [
      { beat: 'After two wrong dresses, {a} holds the printed picture up to the light and finds a tiny label number in the corner.' },
      { by: 'a', say: "There's a number on it! It's been there the whole time! Forty-two!" },
      { beat: 'Dress forty-two is on the back rail. It matches the picture exactly, and the minister hands over the tip.' },
      { by: 'b', say: "The number! It was there the whole time!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'grf2.ws-t4', when: WS, turns: [
      { beat: '{a} is swinging on the lever with both feet off the floor, and the reels keep spinning.' },
      { by: 'a', say: "Stop! Stop on a heart! Please!" },
      { by: 'b', say: "It can't hear you! It's a machine!" },
    ] },
    { id: 'grf2.ws-t5', when: WS, turns: [
      { by: 'b', say: "That dress is the same as the last one you took back." },
      { by: 'a', say: "It's different. Look at the veil." },
      { by: 'b', say: "They both have the same veil! You've brought the same dress twice!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'grf2.ws-x4', when: WS, turns: [
      { beat: 'Heart. Heart. And the third reel stops on a heart, wobbles, and clicks on to a horseshoe.' },
      { by: 'a', say: "It was on a heart! It moved! I saw it move!" },
      { by: 'b', say: "It's a machine! Pull again!" },
    ] },
    { id: 'grf2.ws-x5', when: WS, turns: [
      { beat: 'The minister looks at the dress {a} brings her, turns it round, and points at the back. The dress in the picture has an open back.' },
      { by: 'a', say: "The back? I didn't look at the back!" },
      { by: 'b', say: "Look at the back! Back to the rails!" },
    ] },
  ],
  'task-done.any': [
    { id: 'grf2.ws-dn4', when: WS, turns: [
      { by: 'a', say: "Somebody's going to wear that dress one day." },
      { by: 'b', say: "And they'll never know what we went through." },
      { by: 'a', say: "That was so hard." },
    ] },
    { id: 'grf2.ws-dn5', when: WS, turns: [
      { beat: 'The minister hands {a} the tip and a small paper certificate with a gold heart on it.' },
      { by: 'b', say: "What's the certificate for?" },
      { by: 'a', say: "I don't know. I think it's just for fun." },
    ] },
    { id: 'grf2.ws-dn6', when: WS, turns: [
      { by: 'b', say: "My arm hurts from watching you pull that lever." },
      { by: 'a', say: "My arm hurts from pulling it." },
      { by: 'b', say: "Come on. Tightrope next." },
    ] },
  ],
};

const rope = {
  'task-start.any': [
    { id: 'grf2.tr-s5', when: TR, turns: [
      { beat: 'A worker clips {a} into the harness, tugs the strap twice, gives a thumbs up, and walks away very quickly.' },
      { by: 'a', say: "Why did he walk away so fast?" },
      { by: 'b', say: "He's busy. Don't worry about it." },
    ] },
    { id: 'grf2.tr-s6', when: TR, turns: [
      { by: 'b', say: "This pole is so long. How do I hold it?" },
      { by: 'a', say: "In the middle. Keep it level." },
      { by: 'b', say: "Okay. Level." },
    ] },
    { id: 'grf2.tr-s7', when: TR, turns: [
      { beat: 'The spray from the falls soaks {a} and {b} in seconds, before either of them has even stepped onto the rope.' },
      { by: 'a', say: "Well, we can't get any wetter." },
      { by: 'b', say: "Don't say that." },
    ] },
    { id: 'grf2.tr-s8', when: TR, turns: [
      { by: 'a', say: "Shoes off. It's easier in bare feet." },
      { by: 'b', say: "Are you sure?" },
      { by: 'a', say: "No. But it feels right." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'grf2.tr-f5', when: TR, turns: [
      { beat: '{a} goes first, slow and steady through the spray, and calls back every wobbly bit to {b}, who walks it exactly the same way.' },
      { by: 'a', say: "Slippery bit here! Big wobble in the middle! Last bit's easy!" },
      { by: 'b', say: "You were right! The last bit was easy!" },
    ] },
    { id: 'grf2.tr-f6', when: TR, turns: [
      { by: 'b', say: "If I sing, I can't panic." },
      { beat: '{b} sings the whole way across, and {a} follows to the same song. Neither one falls.' },
      { by: 'a', say: "That actually worked." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'grf2.tr-a5', when: TR, turns: [
      { by: 'a', say: "Every time the spray comes, I stop. And stopping's when I fall. So I walk through the spray. I don't wait for it to clear." },
      { beat: '{a} walks through the spray without stopping, comes out the other side still on the rope, and steps onto the far rim. {b} does it the same way.' },
      { by: 'b', say: "It worked! Just keep walking!" },
    ] },
    { id: 'grf2.tr-a6', when: TR, turns: [
      { beat: 'Winched back again, {b} stands at the start and walks along a line painted on the rock ten times before stepping back onto the rope.' },
      { by: 'b', say: "Practice first. On the ground." },
      { beat: 'Then onto the rope, the same steps, the same rhythm, and {b} joins {a} on the far rim.' },
      { by: 'a', say: "Practising worked!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'grf2.tr-t4', when: TR, turns: [
      { beat: 'A gust of wind pushes the end of {a}\'s balance pole down.' },
      { by: 'a', say: "The wind! It's pushing me over!" },
      { by: 'b', say: "Lean the other way! Lean against it!" },
    ] },
    { id: 'grf2.tr-t5', when: TR, turns: [
      { by: 'b', say: "Are you moving?" },
      { by: 'a', say: "I'm trying. I'm scared." },
      { by: 'b', say: "Just one step! One!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'grf2.tr-x4', when: TR, turns: [
      { beat: '{a} turns round on the rope to wave at {b}, loses balance, and drops into the harness.' },
      { by: 'a', say: "I only waved!" },
      { by: 'b', say: "Don't wave! Back to the start!" },
    ] },
    { id: 'grf2.tr-x5', when: TR, turns: [
      { beat: 'The balance pole dips on one side, {a} grabs at it, and swings off the rope and into the harness.' },
      { by: 'a', say: "The pole pulled me off!" },
      { by: 'b', say: "Keep it level! Back to the start!" },
    ] },
  ],
  'task-done.any': [
    { id: 'grf2.tr-dn4', when: TR, turns: [
      { beat: '{a} steps off the rope onto solid rock and gets down on {a.posAdj} knees to pat the ground.' },
      { by: 'a', say: "Ground. Solid ground." },
      { by: 'b', say: "You did it. You actually did it." },
    ] },
    { id: 'grf2.tr-dn5', when: TR, turns: [
      { by: 'b', say: "We should have waved to the people in the boats under us." },
      { by: 'a', say: "I wasn't letting go of that pole to wave at anybody." },
      { by: 'b', say: "They were waving at us!" },
    ] },
    { id: 'grf2.tr-dn6', when: TR, turns: [
      { by: 'a', say: "After that, I'm not scared of anything." },
      { by: 'b', say: "That's great. Can we just walk now?" },
      { by: 'a', say: "We can just walk." },
    ] },
  ],
};

export default mergePools(slots, rope);
