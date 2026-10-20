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
      { by: 'b', say: "Don't look at the mirror. The mirror is not our friend." },
      { by: 'a', say: "The mirror is very honest." },
    ] },
    { id: 'pmp2.tg-s6', when: TG, turns: [
      { by: 'b', say: "She says the man leads. Or the tall one. Or whoever wants it more." },
      { by: 'a', say: "I want it more." },
      { by: 'b', say: "I want it more than you want it more." },
      { beat: 'They both try to lead, and walk into each other like two shopping trolleys.' },
    ] },
    { id: 'pmp2.tg-s7', when: TG, turns: [
      { beat: 'The instructor clicks her fingers for the beat. {a} clicks along, a beat behind.' },
      { by: 'a', say: "Am I on time?" },
      { by: 'b', say: "You're on time for the next song." },
      { by: 'a', say: "Then we'll be ready for that one." },
    ] },
    { id: 'pmp2.tg-s8', when: TG, turns: [
      { by: 'a', ...V("Chin up. Chest out. Look at me like I owe you money.", "Chin up. Glare at me.", "Chin up.", "Chin UP! Chest OUT! Look at me like I OWE you!", "Chin up, chest out, and look at me like I owe you a little money.", "Look at me like I sold you a broken bicycle.") },
      { by: 'b', say: "You do owe me money." },
      { by: 'a', say: "Perfect. Hold that face." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'pmp2.tg-f5', when: TG, turns: [
      { beat: 'Every turn lands, every flick snaps, and when {b} goes down into the dip, {b.sub} holds it without a wobble.' },
      { by: 'b', say: "Is she clapping? I can't see, I'm upside down." },
      { by: 'a', say: "She's clapping. You can come up now." },
    ] },
    { id: 'pmp2.tg-f6', when: TG, turns: [
      { by: 'a', say: "Pretend we're in an old film. Black and white. Somebody's about to cry." },
      { beat: 'They dance it like an old film. Somebody, at the back of the hall, actually does cry. The instructor claps.' },
      { by: 'b', say: "Who's crying? Why is the piano player crying?" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'pmp2.tg-a5', when: TG, turns: [
      { by: 'b', say: "Stop watching your feet. Watch my face. My face knows where we're going." },
      { by: 'a', say: "Your face looks terrified." },
      { by: 'b', say: "Terrified and correct." },
      { beat: 'Eyes locked, no looking down, they get through the whole routine, and the instructor finally claps.' },
    ] },
    { id: 'pmp2.tg-a6', when: TG, turns: [
      { beat: 'Between tries, {a} and {b} practise the dip in the corridor, over and over, until a cleaner has to step round them.' },
      { by: 'a', say: "Once more. For real this time." },
      { beat: 'The dip comes down smooth and stops an inch above the boards. The instructor claps twice.' },
      { by: 'b', say: "Two claps! Is that better than one clap?" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'pmp2.tg-t4', when: TG, turns: [
      { beat: '{a} and {b} are stuck in the close embrace, cheek to cheek, neither of them sure who moves next.' },
      { by: 'a', say: "Are you going?" },
      { by: 'b', say: "I thought you were going." },
      { by: 'a', say: "We can't just stand here hugging." },
    ] },
    { id: 'pmp2.tg-t5', when: TG, turns: [
      { by: 'b', say: "She keeps saying a word. What's the word?" },
      { by: 'a', say: "I think it means 'more'. Or 'stop'. Or 'why'." },
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
      { by: 'b', say: "It was right there! It looked like you!" },
      { by: 'a', say: "Back to the lesson. Leave the coat stand out of it." },
    ] },
  ],
  'task-done.any': [
    { id: 'pmp2.tg-dn4', when: TG, turns: [
      { by: 'b', say: "My back's never going to be straight again after that dip." },
      { by: 'a', say: "Good thing we're riding horses next." },
      { by: 'b', say: "That's not a good thing. That's the opposite." },
    ] },
    { id: 'pmp2.tg-dn5', when: TG, turns: [
      { beat: 'On the steps outside, {a} spins {b} once more, for no reason at all.' },
      { by: 'b', say: "The music stopped ten minutes ago." },
      { by: 'a', say: "Not for me it didn't." },
    ] },
    { id: 'pmp2.tg-dn6', when: TG, turns: [
      { by: 'a', say: "She clapped. A woman who has never clapped in her life clapped at us." },
      { by: 'b', say: "She clapped at everybody, I think." },
      { by: 'a', say: "Let me have this." },
    ] },
  ],
};

const emu = {
  'task-start.any': [
    { id: 'pmp2.em-s5', when: EM, turns: [
      { beat: 'The gaucho hands {a} the boleadoras. Three leather balls clack together on their ropes.' },
      { by: 'a', say: "It's like a very heavy yo-yo. Three yo-yos. Tied together." },
      { by: 'b', say: "You were terrible at yo-yos." },
      { by: 'a', say: "That's why I'm on a horse this time." },
    ] },
    { id: 'pmp2.em-s6', when: EM, turns: [
      { by: 'b', say: "Which one's ours? They all look the same." },
      { by: 'a', say: "Ours has a red tag on its neck. And a really bad attitude." },
      { beat: 'The emu with the red tag turns its head and stares at {a} without blinking.' },
      { by: 'b', say: "Yes. That's ours." },
    ] },
    { id: 'pmp2.em-s7', when: EM, turns: [
      { beat: '{a}\'s horse sets off at a walk, then a trot, then something bouncier that has no name.' },
      { by: 'a', say: "How do I stop it bouncing?" },
      { by: 'b', say: "Bounce with it! Be one with the bounce!" },
    ] },
    { id: 'pmp2.em-s8', when: EM, turns: [
      { by: 'a', say: "Swing it over my head. Like a helicopter." },
      { by: 'b', say: "Not too close to your head. You've only got the one." },
      { beat: 'The boleadoras whirl round once, and the horse flattens its ears.' },
    ] },
  ],
  'task-try.first-try': [
    { id: 'pmp2.em-f5', when: EM, turns: [
      { beat: 'The emu cuts left. {a} cuts left with it, swings once and lets go, and the ropes coil round both its legs like a ribbon on a present.' },
      { by: 'b', say: "Gift-wrapped! You gift-wrapped an emu!" },
      { by: 'a', say: "Nobody's ever going to want this present." },
    ] },
    { id: 'pmp2.em-f6', when: EM, turns: [
      { by: 'a', say: "I'm just going to throw it and hope." },
      { beat: '{a} throws it and hopes. The boleadoras catch the emu round the legs, and it sits down in the grass, sulking.' },
      { by: 'b', say: "Hope works! Write that down!" },
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
      { by: 'b', say: "All in the wrist! He could've said that at the start!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'pmp2.em-t4', when: EM, turns: [
      { beat: 'The emu has stopped running and started walking in a slow circle round {a}\'s horse, out of throwing range.' },
      { by: 'a', say: "It's circling me. Why is it circling me?" },
      { by: 'b', say: "It's hunting you now. You've lost control of this." },
    ] },
    { id: 'pmp2.em-t5', when: EM, turns: [
      { by: 'b', ...V("Your swing goes round and round and then just stops. You have to let go!", "You keep forgetting to let go!", "Let go!", "You have to LET GO! LET GO of it!", "You swing it beautifully, but then you forget to let go.", "You're swinging it like you want to keep it.") },
      { by: 'a', say: "I'm scared I'll hit the horse." },
      { by: 'b', say: "You're going to hit the horse anyway at this rate." },
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
      { by: 'a', say: "Wrong bird. Back to the gaucho." },
    ] },
  ],
  'task-done.any': [
    { id: 'pmp2.em-dn4', when: EM, turns: [
      { beat: '{a} slides off the horse and walks over to {b} like a cowboy who has been riding for a month.' },
      { by: 'b', say: "Why are you walking like that?" },
      { by: 'a', say: "I don't have a choice anymore." },
    ] },
    { id: 'pmp2.em-dn5', when: EM, turns: [
      { by: 'a', say: "We should give it a name. We're going to be walking together a while." },
      { by: 'b', say: "Something strong. Something proud." },
      { by: 'a', say: "Mister Legs." },
    ] },
    { id: 'pmp2.em-dn6', when: EM, turns: [
      { beat: 'The gaucho unwraps the emu\'s legs, hands {a} the lead, and tips his hat.' },
      { by: 'b', say: "He tipped his hat! That's like a medal, out here!" },
      { by: 'a', say: "I'm keeping the hat-tip forever. I'm framing it." },
    ] },
  ],
};

export default mergePools(dance, emu);
