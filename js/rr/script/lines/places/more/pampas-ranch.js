// Pampas Ranch, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/pampas-ranch.js: the dance is danced by both for the instructor
// until she claps; at the emu, a rides out with the boleadoras and b watches from the fence.
import { V, mergePools } from '../_kit.js';

const TG = { taskId: 'tango' };
const EM = { taskId: 'emu' };

const dance = {
  'task-start.any': [
    { id: 'pmp2.tg-s5', when: TG, turns: [
      { beat: '{a} catches sight of the two of them in the wall of mirrors and stops dead.' },
      { by: 'a', say: "Is that what we look like? From the outside?" },
      { by: 'b', say: "Don't look at the mirror. Look at me." },
      { by: 'a', say: "We look so stiff." },
    ] },
    { id: 'pmp2.tg-s6', when: TG, turns: [
      { by: 'b', say: "She says one of us leads." },
      { by: 'a', say: "I want it more." },
      { by: 'b', say: "No, I want to lead." },
      { beat: 'They both try to lead, and walk straight into each other.' },
    ] },
    { id: 'pmp2.tg-s7', when: TG, turns: [
      { beat: 'The instructor clicks her fingers for the beat. {a} clicks along, a beat behind.' },
      { by: 'a', say: "Am I on time?" },
      { by: 'b', say: "You're a beat late." },
      { by: 'a', say: "Okay. Okay. Again." },
    ] },
    { id: 'pmp2.tg-s8', when: TG, turns: [
      { by: 'a', say: "Chin up. Chest out. Look at me like you mean it." },
      { by: 'b', say: "Like this?" },
      { by: 'a', say: "Yes. Hold that face." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'pmp2.tg-f5', when: TG, turns: [
      { beat: 'Every turn lands, every flick snaps, and when {b} goes down into the dip, {b.sub} holds it without a wobble.' },
      { by: 'b', say: "Is she clapping? I can't see, I'm upside down." },
      { by: 'a', say: "She's clapping. You can come up now." },
    ] },
    { id: 'pmp2.tg-f6', when: TG, turns: [
      { by: 'a', say: "Pretend we're in an old film. Really dramatic." },
      { beat: 'They dance it like an old film, slow and dramatic, and the instructor claps.' },
      { by: 'b', say: "She clapped! She actually clapped!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'pmp2.tg-a5', when: TG, turns: [
      { by: 'b', say: "Stop watching your feet. Watch my face. My face knows where we're going." },
      { by: 'a', say: "Your face looks terrified." },
      { by: 'b', say: "I know where we're going, though." },
      { beat: 'Eyes locked, no looking down, they get through the whole routine, and the instructor finally claps.' },
    ] },
    { id: 'pmp2.tg-a6', when: TG, turns: [
      { beat: 'Between tries, {a} and {b} practise the dip in the corridor, over and over, until a cleaner has to step round them.' },
      { by: 'a', say: "Once more. For real this time." },
      { beat: 'The dip comes down smooth and stops an inch above the boards. The instructor claps twice.' },
      { by: 'b', say: "Two claps!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'pmp2.tg-t4', when: TG, turns: [
      { beat: '{a} and {b} are stuck in the close embrace, cheek to cheek, neither of them sure who moves next.' },
      { by: 'a', say: "Are you going?" },
      { by: 'b', say: "I thought you were going." },
      { by: 'a', say: "Somebody has to move." },
    ] },
    { id: 'pmp2.tg-t5', when: TG, turns: [
      { by: 'b', say: "She keeps saying a word. What's the word?" },
      { by: 'a', say: "I think it means 'more'." },
      { beat: 'The instructor says the word again, louder, and does a leg flick so sharp the air cracks.' },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'pmp2.tg-x4', when: TG, turns: [
      { beat: 'The leg flick goes well. Too well. {a}\'s shoe flies off and skids across the floor to the instructor\'s feet.' },
      { by: 'a', say: "That's mine. Sorry. That's mine." },
      { by: 'b', say: "Put it back on. We're going again." },
    ] },
    { id: 'pmp2.tg-x5', when: TG, turns: [
      { beat: 'Halfway through the sharp turns, {b} spins the wrong way and ends up dancing with the coat stand.' },
      { by: 'b', say: "Sorry! I lost you!" },
      { by: 'a', say: "Back to the lesson." },
    ] },
  ],
  'task-done.any': [
    { id: 'pmp2.tg-dn4', when: TG, turns: [
      { by: 'b', say: "My back's never going to be straight again after that dip." },
      { by: 'a', say: "Good thing we're riding horses next." },
      { by: 'b', say: "That's not going to help my back." },
    ] },
    { id: 'pmp2.tg-dn5', when: TG, turns: [
      { beat: 'On the steps outside, {a} spins {b} once more, for no reason at all.' },
      { by: 'b', say: "The music stopped." },
      { by: 'a', say: "I don't care. I loved that." },
    ] },
    { id: 'pmp2.tg-dn6', when: TG, turns: [
      { by: 'a', say: "She clapped for us." },
      { by: 'b', say: "She clapped at everybody, I think." },
      { by: 'a', say: "Let me enjoy it." },
    ] },
  ],
};

const emu = {
  'task-start.any': [
    { id: 'pmp2.em-s5', when: EM, turns: [
      { beat: 'The gaucho hands {a} the boleadoras. Three leather balls clack together on their ropes.' },
      { by: 'a', say: "They're so heavy." },
      { by: 'b', say: "You'll be fine. Just practise once." },
      { by: 'a', say: "Okay. Okay." },
    ] },
    { id: 'pmp2.em-s6', when: EM, turns: [
      { by: 'b', say: "Which one's ours? They all look the same." },
      { by: 'a', say: "Ours has a red tag on its neck." },
      { beat: 'The emu with the red tag turns its head and stares at {a} without blinking.' },
      { by: 'b', say: "Yes. That's ours." },
    ] },
    { id: 'pmp2.em-s7', when: EM, turns: [
      { beat: '{a}\'s horse sets off at a walk, then a trot, then something much bouncier.' },
      { by: 'a', say: "How do I stop it bouncing?" },
      { by: 'b', say: "Go with it! Move with it!" },
    ] },
    { id: 'pmp2.em-s8', when: EM, turns: [
      { by: 'a', say: "Swing it over my head. Like a helicopter." },
      { by: 'b', say: "Not too close to your head!" },
      { beat: 'The boleadoras whirl round once, and the horse flattens its ears.' },
    ] },
  ],
  'task-try.first-try': [
    { id: 'pmp2.em-f5', when: EM, turns: [
      { beat: 'The emu cuts left. {a} cuts left with it, swings once and lets go, and the ropes coil round both its legs.' },
      { by: 'b', say: "You got it! First throw!" },
      { by: 'a', say: "I can't believe that worked!" },
    ] },
    { id: 'pmp2.em-f6', when: EM, turns: [
      { by: 'a', say: "I'm just going to throw it and hope." },
      { beat: '{a} throws. The boleadoras catch the emu round the legs, and it sits down in the grass.' },
      { by: 'b', say: "It worked!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'pmp2.em-a5', when: EM, turns: [
      { by: 'b', say: "Stop chasing it into the tall grass! The ropes keep catching!" },
      { by: 'a', say: "Where then?" },
      { by: 'b', say: "The track! Wait till it's on the track!" },
      { beat: '{a} waits until the emu steps onto the bare track, throws, and the ropes wrap clean round its legs.' },
    ] },
    { id: 'pmp2.em-a6', when: EM, turns: [
      { beat: 'Back at the gaucho for another set of ropes, {a} asks him something. He answers with one word and a flick of the wrist.' },
      { by: 'a', say: "Wrist. He said wrist. It's all in the wrist." },
      { beat: 'One flick of the wrist later, the boleadoras wrap round the emu\'s legs and it stops, stunned.' },
      { by: 'b', say: "It worked! It's all in the wrist!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'pmp2.em-t4', when: EM, turns: [
      { beat: 'The emu has stopped running and started walking in a slow circle round {a}\'s horse, out of throwing range.' },
      { by: 'a', say: "It's circling me. Why is it circling me?" },
      { by: 'b', say: "It's playing with you. Wait for it." },
    ] },
    { id: 'pmp2.em-t5', when: EM, turns: [
      { by: 'b', ...V("Your swing goes round and round and then just stops. You have to let go!", "You keep forgetting to let go!", "Let go!", "You have to LET GO! LET GO of it!", "You swing it beautifully, but then you forget to let go.", "You're swinging it like you want to keep it.") },
      { by: 'a', say: "I'm scared I'll hit the horse." },
      { by: 'b', say: "You won't. Just let go." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'pmp2.em-x4', when: EM, turns: [
      { beat: 'The boleadoras hit the emu in the side, bounce off, and the emu breaks into a sprint across the plain.' },
      { by: 'a', say: "That was supposed to wrap!" },
      { by: 'b', say: "It bounced! Go and get the ropes and try again!" },
    ] },
    { id: 'pmp2.em-x5', when: EM, turns: [
      { beat: '{a} lets go a moment too early, and the boleadoras fly backwards, straight past {b}\'s fence post.' },
      { by: 'b', say: "That was me! You nearly caught me!" },
      { by: 'a', say: "Sorry! Back to the gaucho." },
    ] },
  ],
  'task-done.any': [
    { id: 'pmp2.em-dn4', when: EM, turns: [
      { beat: '{a} slides off the horse and walks over to {b} very stiffly.' },
      { by: 'b', say: "Why are you walking like that?" },
      { by: 'a', say: "My legs are so sore." },
    ] },
    { id: 'pmp2.em-dn5', when: EM, turns: [
      { by: 'a', say: "Come on. We have to walk it all the way." },
      { by: 'b', say: "Okay. Slowly." },
      { by: 'a', say: "Easy. Easy." },
    ] },
    { id: 'pmp2.em-dn6', when: EM, turns: [
      { beat: 'The gaucho unwraps the emu\'s legs, hands {a} the lead, and tips his hat.' },
      { by: 'b', say: "He tipped his hat at you!" },
      { by: 'a', say: "That made my day." },
    ] },
  ],
};

export default mergePools(dance, emu);
