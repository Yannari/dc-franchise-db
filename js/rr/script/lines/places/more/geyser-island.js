// Geyser Island, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/geyser-island.js: the telephone is Don's recorded phrase, a run
// through the geysers and the phrase said word for word to a local; feast is the whole traditional meal, fossil is
// chipping one out of the ice cave without cracking it.
import { V, mergePools } from '../_kit.js';

const TP = { taskId: 'telephone' };
const FF = { taskId: 'feast-fossil' };
const FEAST = { taskId: 'feast-fossil', side: 'feast' };
const FOSSIL = { taskId: 'feast-fossil', side: 'fossil' };

const telephone = {
  'task-start.any': [
    { id: 'gyi2.tp-s1', when: TP, turns: [
      { beat: '{b} writes the phrase on {b.posAdj} arm in pen, the way it sounds.' },
      { by: 'a', say: "Is that allowed?" },
      { by: 'b', say: "Nobody said it wasn't. I just wrote it how it sounds." },
    ] },
    { id: 'gyi2.tp-s2', when: TP, turns: [
      { by: 'a', say: "Play it again. Don pauses in the middle. Is the pause a word?" },
      { by: 'b', say: "That's just Don breathing." },
      { by: 'a', say: "Okay. Okay. No pause." },
    ] },
    { id: 'gyi2.tp-s3', when: TP, turns: [
      { beat: 'Across the field, a geyser blows a column of steam straight up into the air.' },
      { by: 'a', say: "Do we wait for that one to finish?" },
      { by: 'b', say: "There's always another one. We just run and keep the words in." },
    ] },
    { id: 'gyi2.tp-s4', when: TP, turns: [
      { by: 'b', say: "We need a trick to remember it." },
      { by: 'a', say: "Say it like a song. Every time." },
      { by: 'b', say: "Okay. Like a song." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gyi2.tp-f1', when: TP, turns: [
      { beat: '{a} and {b} arrive at the local, panting, and say the phrase together, perfectly.' },
      { beat: 'He nods, slowly, then hands them the tip.' },
      { by: 'a', say: "The song worked!" },
    ] },
    { id: 'gyi2.tp-f2', when: TP, turns: [
      { by: 'b', say: "Let me do it. I've got it. I've had it since the third listen." },
      { beat: '{b} says it once, cleanly. The local raises his eyebrows and hands over the tip.' },
      { by: 'a', say: "How did you do that?" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gyi2.tp-a1', when: TP, turns: [
      { by: 'a', say: "We keep losing it when the geysers go. So we say it out loud the whole way across." },
      { beat: '{a} and {b} jog through the steam saying the phrase out loud, over and over.' },
      { beat: 'The local listens, nods, and gives them the tip.' },
    ] },
    { id: 'gyi2.tp-a2', when: TP, turns: [
      { beat: 'Fifth time at the speaker box. {b} listens with both eyes shut, lips moving.' },
      { by: 'b', say: "It's 'hver', not 'fair'. It's softer. More breath." },
      { beat: 'Across the field, {b} says it softly. The local finally nods.' },
      { by: 'a', say: "That's it! That was the word!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'gyi2.tp-t1', when: TP, turns: [
      { by: 'a', say: "Was it 'bjarta' first, or 'hrumpen'?" },
      { by: 'b', say: "Bjarta. Then hrumpen." },
      { by: 'a', say: "Are you sure?" },
      { by: 'b', say: "No! Just go!" },
    ] },
    { id: 'gyi2.tp-t2', when: TP, turns: [
      { beat: '{a} stands at the speaker box, steaming gently, hair flat from three geysers in a row.' },
      { by: 'a', say: "I've heard this so many times." },
      { by: 'b', say: "Then you should know it by now!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gyi2.tp-x1', when: TP, turns: [
      { beat: '{a} says the phrase. The local starts to nod, then {a} adds "please" at the end, and he stops nodding.' },
      { by: 'b', say: "Why did you say please?" },
      { by: 'a', say: "I was just being polite! Fine! Back to the box!" },
    ] },
    { id: 'gyi2.tp-x2', when: TP, turns: [
      { by: 'b', say: "Wait. Did we say the middle bit? I think we skipped the middle bit." },
      { beat: 'The local holds up a finger and shakes his head. They skipped the middle bit.' },
      { by: 'a', say: "Back through the geysers. For the middle bit." },
    ] },
  ],
  'task-done.any': [
    { id: 'gyi2.tp-dn1', when: TP, turns: [
      { by: 'b', say: "Ask him what it means. Go on. Just ask." },
      { beat: '{a} asks. The local thinks, then points at the sky and makes a slurping noise.' },
      { by: 'a', say: "Okay. I still don't know. Helicopter." },
    ] },
    { id: 'gyi2.tp-dn2', when: TP, turns: [
      { by: 'a', say: "Say it to the helicopter pilot. See if it works on him too." },
      { by: 'b', say: "What if it's rude? What if it means something awful?" },
      { by: 'a', say: "Then we'll never know." },
    ] },
    { id: 'gyi2.tp-dn3', when: TP, turns: [
      { beat: '{a} and {b} walk off steaming, faces red from the hot water and the cold wind at the same time.' },
      { by: 'b', say: "My front is boiled and my back is frozen." },
      { by: 'a', say: "I know. It's so weird." },
    ] },
  ],
};

const feastFossil = {
  'task-start.any': [
    { id: 'gyi2.ff-s1', when: FEAST, turns: [
      { beat: 'The sheep\'s head on the plate is looking straight at {a}.' },
      { by: 'a', say: "It's looking at me. Can we turn it round?" },
      { by: 'b', say: "We have to eat it. Don't look at it." },
    ] },
    { id: 'gyi2.ff-s2', when: FEAST, turns: [
      { by: 'b', say: "Strategy. We eat the worst thing first, while we're still brave." },
      { by: 'a', say: "Which is the worst thing?" },
      { beat: 'They both look at the fermented shark.' },
    ] },
    { id: 'gyi2.ff-s3', when: FOSSIL, turns: [
      { beat: '{a} holds the pick up to the ice wall. Behind a foot of blue ice, the faint shape of a shell.' },
      { by: 'a', say: "There. Can you see it? A little curly one." },
      { by: 'b', say: "I see it. Just dig. Carefully." },
    ] },
    { id: 'gyi2.ff-s4', when: FOSSIL, turns: [
      { by: 'b', say: "Chip round it, not at it. Leave a big border of ice." },
      { by: 'a', say: "Okay. Leave a lot of ice." },
      { by: 'b', say: "A lot. Slowly." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gyi2.ff-f1', when: FEAST, turns: [
      { beat: '{b} eats the sheep\'s head with a completely straight face.' },
      { by: 'a', say: "You're not even making a face." },
      { by: 'b', say: "I didn't want to. Plate's empty. Let's go." },
    ] },
    { id: 'gyi2.ff-f2', when: FOSSIL, turns: [
      { beat: 'The block of ice around the fossil comes away all at once. {a} catches it in both mittens.' },
      { by: 'a', say: "Is it whole? Check it. I can't look." },
      { by: 'b', say: "It's whole. Not a scratch. First one." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gyi2.ff-a1', when: FEAST, turns: [
      { by: 'a', say: "We switch dishes. I'll do the shark this time." },
      { by: 'b', say: "Are you sure?" },
      { beat: 'It works. The second plate goes back clean.' },
    ] },
    { id: 'gyi2.ff-a2', when: FOSSIL, turns: [
      { beat: 'After two cracked shells, {b} warms the ice with {b.posAdj} breath and slides the fossil out.' },
      { by: 'b', say: "Breath. Warm breath. It melts just enough." },
      { by: 'a', say: "That's so smart!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'gyi2.ff-t1', when: FEAST, turns: [
      { by: 'b', say: "The shot burns all the way down. And then it keeps burning." },
      { by: 'a', say: "Eat something." },
      { by: 'b', say: "The only thing left is the sheep's head!" },
    ] },
    { id: 'gyi2.ff-t2', when: FOSSIL, turns: [
      { beat: 'Ice chips cover {a} from head to boots. The fossil has barely moved.' },
      { by: 'a', say: "I've been digging for so long, and it's barely moved." },
      { by: 'b', say: "Go round it! Not at it!" },
    ] },
    { id: 'gyi2.ff-t3', when: FF, turns: [
      { by: 'a', say: "We could switch. The other side's right there." },
      { by: 'b', say: "And waste everything we've done?" },
      { by: 'a', say: "We've barely done anything." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gyi2.ff-x1', when: FEAST, turns: [
      { beat: 'The cook lifts their plate, finds one small grey cube hiding under a lettuce leaf, and puts down a whole new plate.' },
      { by: 'a', say: "One cube! One cube and we start again?" },
      { by: 'b', say: "How did we miss that?" },
    ] },
    { id: 'gyi2.ff-x2', when: FOSSIL, turns: [
      { beat: 'A hairline crack runs straight across the shell as it comes out of the wall.' },
      { by: 'b', say: "It's a tiny crack. Maybe they won't notice." },
      { by: 'a', say: "They'll notice. Find another one." },
    ] },
    { id: 'gyi2.ff-x3', when: FF, turns: [
      { by: 'a', say: "Is that it? Did we do it?" },
      { beat: 'The man at the hut shakes his head and points them back in.' },
      { by: 'b', say: "We did not do it. Again." },
    ] },
  ],
  'task-done.any': [
    { id: 'gyi2.ff-dn1', when: FEAST, turns: [
      { by: 'a', say: "I can still taste the shark. I think I'll always taste the shark." },
      { by: 'b', say: "Eat a mint." },
      { by: 'a', say: "I don't think a mint can fix this." },
    ] },
    { id: 'gyi2.ff-dn2', when: FOSSIL, turns: [
      { beat: '{a} carries the fossil out of the cave held up in front of {a.obj}.' },
      { by: 'b', say: "If you trip now, I'll never forgive you." },
      { by: 'a', say: "I won't trip. I promise." },
    ] },
    { id: 'gyi2.ff-dn3', when: FF, turns: [
      { by: 'b', say: "Rock wall. Chill Zone. Then something hot to drink." },
      { by: 'a', say: "And something to eat that hasn't been buried first." },
      { by: 'b', say: "We'll ask first next time. Every time." },
    ] },
  ],
};

export default mergePools(telephone, feastFossil);
