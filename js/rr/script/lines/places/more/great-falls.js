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
      { by: 'a', say: "Do I pull it or climb it?" },
      { by: 'b', say: "Hang off it. Let gravity do the pulling." },
    ] },
    { id: 'grf2.ws-s6', when: WS, turns: [
      { by: 'b', say: "Blow on it first. People blow on dice for luck." },
      { by: 'a', say: "It's a lever, not a dice." },
      { beat: '{a} blows on the lever anyway, then pulls it. Heart. Bell. Horseshoe.' },
      { by: 'b', say: "Blow harder next time." },
    ] },
    { id: 'grf2.ws-s7', when: WS, turns: [
      { beat: 'The old theatre hall is full of plastic flowers, a velvet curtain and an organ playing all by itself in the corner.' },
      { by: 'a', say: "Who's playing the organ?" },
      { by: 'b', ...V("Nobody. It's playing itself. Don't think about it.", "Nobody's playing it.", "Nobody.", "NOBODY! It's playing ITSELF!", "Nobody's playing it, so let's just try not to think about it.", "The organ got married here once and never left.") },
    ] },
    { id: 'grf2.ws-s8', when: WS, turns: [
      { by: 'a', say: "Three hearts. What do you get for three lemons?" },
      { by: 'b', say: "A divorce, probably." },
      { by: 'a', say: "Then I'm not pulling for lemons." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'grf2.ws-f5', when: WS, turns: [
      { beat: 'Heart, heart, heart. The machine rings, the organ plays louder, and out prints a picture of a dress with a train as long as a bus.' },
      { by: 'a', say: "That one. The one taking up half the room. It's right there." },
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
      { by: 'b', say: "You keep yanking it and the reels go too fast. Pull it like you're opening a fridge. Smooth." },
      { beat: '{a} pulls it like opening a fridge. Heart. Heart. Heart. The organ bursts into a wedding march.' },
      { by: 'a', say: "The fridge pull!" },
      { beat: 'The picture prints, the dress is three rails down, and the minister holds it up and smiles.' },
    ] },
    { id: 'grf2.ws-a6', when: WS, turns: [
      { beat: 'After two wrong dresses, {a} holds the printed picture up to the light and finds a tiny label number in the corner.' },
      { by: 'a', say: "There's a number on it! It's been there the whole time! Forty-two!" },
      { beat: 'Dress forty-two is on the back rail. It matches the picture exactly, and the minister hands over the tip.' },
      { by: 'b', say: "Read the small print. Always read the small print." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'grf2.ws-t4', when: WS, turns: [
      { beat: '{a} is swinging on the lever with both feet off the floor, and the reels are spinning so long the organ has started a second song.' },
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
      { by: 'b', say: "Machines do that! Pull again!" },
    ] },
    { id: 'grf2.ws-x5', when: WS, turns: [
      { beat: 'The minister looks at the dress {a} brings her, turns it round, and shows {a} the back. The picture\'s dress has no back at all.' },
      { by: 'a', say: "Where's the back gone? Who makes a dress with no back?" },
      { by: 'b', say: "Somebody brave! Back to the rails!" },
    ] },
  ],
  'task-done.any': [
    { id: 'grf2.ws-dn4', when: WS, turns: [
      { by: 'a', say: "Somebody's going to wear that dress one day." },
      { by: 'b', say: "And never know we fought a slot machine for it." },
      { by: 'a', say: "We should leave a note in the pocket." },
    ] },
    { id: 'grf2.ws-dn5', when: WS, turns: [
      { beat: 'The minister hands {a} the tip and a small paper certificate with a gold heart on it.' },
      { by: 'b', say: "What's the certificate for?" },
      { by: 'a', say: "I think it says we're married to the slot machine." },
    ] },
    { id: 'grf2.ws-dn6', when: WS, turns: [
      { by: 'b', say: "My arm hurts from watching you pull that lever." },
      { by: 'a', say: "My arm hurts from pulling it." },
      { by: 'b', say: "We both have arm pain. That's a kind of wedding." },
    ] },
  ],
};

const rope = {
  'task-start.any': [
    { id: 'grf2.tr-s5', when: TR, turns: [
      { beat: 'A worker clips {a} into the harness, tugs the strap twice, gives a thumbs up, and walks away very quickly.' },
      { by: 'a', say: "Why did he walk away so fast?" },
      { by: 'b', say: "He's got other people to clip. Don't read into it." },
    ] },
    { id: 'grf2.tr-s6', when: TR, turns: [
      { by: 'b', say: "The pole's longer than a car. How am I supposed to hold that?" },
      { by: 'a', say: "In the middle. Like a see-saw." },
      { by: 'b', say: "A see-saw over a waterfall." },
    ] },
    { id: 'grf2.tr-s7', when: TR, turns: [
      { beat: 'The spray from the falls soaks {a} and {b} in seconds, before either of them has even stepped onto the rope.' },
      { by: 'a', say: "Well, we can't get any wetter." },
      { by: 'b', say: "We can if we fall in." },
    ] },
    { id: 'grf2.tr-s8', when: TR, turns: [
      { by: 'a', ...V("Shoes off. My grandma walked on a wall barefoot once, and she said it's all in the toes.", "Shoes off. It's all in the toes.", "Toes.", "SHOES off! It's all in the TOES!", "Let's take our shoes off, because Grandma always said it's all in the toes.", "Toes are just little hands for brave people.") },
      { by: 'b', say: "Your grandma walked on a garden wall." },
      { by: 'a', say: "It was a high garden wall." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'grf2.tr-f5', when: TR, turns: [
      { beat: '{a} goes first, slow and steady through the spray, and calls back every wobbly bit to {b}, who walks it exactly the same way.' },
      { by: 'a', say: "Slippery bit here! Big wobble in the middle! Last bit's easy!" },
      { by: 'b', say: "You were right! The last bit was easy!" },
    ] },
    { id: 'grf2.tr-f6', when: TR, turns: [
      { by: 'b', say: "If I sing, I can't panic. Those are the rules." },
      { beat: '{b} sings the whole way across, loudly and badly, and {a} follows to the same tune. Neither one falls.' },
      { by: 'a', say: "The falls were louder than you. Just." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'grf2.tr-a5', when: TR, turns: [
      { by: 'a', say: "Every time the spray comes, I stop. And stopping's when I fall. So I walk through the spray. I don't wait for it to clear." },
      { beat: '{a} walks through the spray without stopping, comes out the other side still on the rope, and steps onto the far rim. {b} does it the same way.' },
      { by: 'b', say: "Through it! Never wait for it!" },
    ] },
    { id: 'grf2.tr-a6', when: TR, turns: [
      { beat: 'Winched back again, {b} stands at the start and walks along a line painted on the rock ten times before stepping back onto the rope.' },
      { by: 'b', say: "Practice. On the ground. Where nothing falls." },
      { beat: 'Then onto the rope, the same steps, the same rhythm, and {b} joins {a} on the far rim.' },
      { by: 'a', say: "You practised falling not to fall." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'grf2.tr-t4', when: TR, turns: [
      { beat: 'A bird lands on the end of {a}\'s balance pole and refuses to move.' },
      { by: 'a', say: "Get off! You're making it heavy on one side!" },
      { by: 'b', say: "Lean the other way! Lean away from the bird!" },
    ] },
    { id: 'grf2.tr-t5', when: TR, turns: [
      { by: 'b', say: "Are you walking or are you just standing very slowly?" },
      { by: 'a', say: "I'm walking in my head." },
      { by: 'b', say: "Walk with your feet!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'grf2.tr-x4', when: TR, turns: [
      { beat: '{a} turns round on the rope to wave at {b}, which is not something a person should do on a rope, and drops into the harness.' },
      { by: 'a', say: "I was being friendly!" },
      { by: 'b', say: "Be friendly on the ground! Winch back! Again!" },
    ] },
    { id: 'grf2.tr-x5', when: TR, turns: [
      { beat: 'The balance pole dips on one side, {a} grabs at it, the pole wins, and {a} swings off the rope and into the harness.' },
      { by: 'a', say: "The pole pulled me off! The pole is the problem!" },
      { by: 'b', say: "The pole was helping! Back to the start!" },
    ] },
  ],
  'task-done.any': [
    { id: 'grf2.tr-dn4', when: TR, turns: [
      { beat: '{a} steps off the rope onto solid rock and gets down on {a.posAdj} knees to pat the ground.' },
      { by: 'a', say: "Hello, ground. I missed you." },
      { by: 'b', say: "You were only gone ten minutes." },
    ] },
    { id: 'grf2.tr-dn5', when: TR, turns: [
      { by: 'b', say: "We should have waved to the people in the boats under us." },
      { by: 'a', say: "I wasn't letting go of that pole to wave at anybody." },
      { by: 'b', say: "They waved to us. It was rude not to." },
    ] },
    { id: 'grf2.tr-dn6', when: TR, turns: [
      { by: 'a', say: "I'll walk on any wobbly thing now. Bridges. Ladders. Anything." },
      { by: 'b', say: "That's great. Can we take the stairs, though?" },
      { by: 'a', say: "We can take the stairs." },
    ] },
  ],
};

export default mergePools(slots, rope);
