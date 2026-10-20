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
      { by: 'b', say: "Nobody said it wasn't. It says 'hurdy gurdy blerg'. That can't be right." },
    ] },
    { id: 'gyi2.tp-s2', when: TP, turns: [
      { by: 'a', say: "Play it again. Don pauses in the middle. Is the pause a word?" },
      { by: 'b', say: "The pause is Don breathing." },
      { by: 'a', say: "I'm not risking it. I'm doing the pause." },
    ] },
    { id: 'gyi2.tp-s3', when: TP, turns: [
      { beat: 'Across the field, a geyser blows a column of steam straight up into the air.' },
      { by: 'a', say: "Do we wait for that one to finish?" },
      { by: 'b', say: "There's always another one. We just run and keep the words in." },
    ] },
    { id: 'gyi2.tp-s4', when: TP, turns: [
      { by: 'b', say: "We need a trick. Turn every word into a picture." },
      { by: 'a', say: "The first word is a duck in a hat." },
      { by: 'b', say: "Perfect. The second word is the duck falling over." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gyi2.tp-f1', when: TP, turns: [
      { beat: '{a} and {b} arrive at the local, panting, and say the phrase in perfect unison, like a school choir.' },
      { beat: 'He nods, slowly, then hands them the tip.' },
      { by: 'a', say: "The duck in a hat! It worked!" },
    ] },
    { id: 'gyi2.tp-f2', when: TP, turns: [
      { by: 'b', say: "Let me do it. I've got it. I've had it since the third listen." },
      { beat: '{b} says it once, cleanly. The local raises his eyebrows and hands over the tip.' },
      { by: 'a', say: "Show-off. Brilliant, but a show-off." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gyi2.tp-a1', when: TP, turns: [
      { by: 'a', say: "We keep losing it when the geysers go. So we say it out loud the whole way across." },
      { beat: '{a} and {b} jog through the steam chanting the phrase at the top of their voices. They arrive still chanting it.' },
      { beat: 'The local covers his ears, nods, and gives them the tip just to make them stop.' },
    ] },
    { id: 'gyi2.tp-a2', when: TP, turns: [
      { beat: 'Fifth time at the speaker box. {b} listens with both eyes shut, lips moving.' },
      { by: 'b', say: "It's 'hver', not 'fair'. Breathy. Like fogging up a window." },
      { beat: 'Across the field, {b} fogs up the window. The local finally nods.' },
      { by: 'a', say: "You did the window! It was the window!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'gyi2.tp-t1', when: TP, turns: [
      { by: 'a', say: "Was the duck in a hat the first word or the third word?" },
      { by: 'b', say: "First. The third word is the duck crying." },
      { by: 'a', say: "Why is the duck crying?" },
      { by: 'b', say: "Because of you!" },
    ] },
    { id: 'gyi2.tp-t2', when: TP, turns: [
      { beat: '{a} stands at the speaker box, steaming gently, hair flat from three geysers in a row.' },
      { by: 'a', say: "I've heard Don say this forty times. I hate his voice now." },
      { by: 'b', say: "You hated his voice before." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gyi2.tp-x1', when: TP, turns: [
      { beat: '{a} says the phrase. The local starts to nod, then {a} adds "please" at the end, and he stops nodding.' },
      { by: 'b', say: "Why did you say please?" },
      { by: 'a', say: "I was being polite! Fine! Back to the box!" },
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
      { by: 'a', say: "Great. That clears it up. Helicopter." },
    ] },
    { id: 'gyi2.tp-dn2', when: TP, turns: [
      { by: 'a', say: "Say it to the helicopter pilot. See if it works on him too." },
      { by: 'b', say: "What if it's rude? What if it means something awful?" },
      { by: 'a', say: "Then we'll find out from the sky." },
    ] },
    { id: 'gyi2.tp-dn3', when: TP, turns: [
      { beat: '{a} and {b} walk off steaming, faces red from the hot water and the cold wind at the same time.' },
      { by: 'b', say: "My front is boiled and my back is frozen." },
      { by: 'a', say: "You're a baked potato with a freezer in it." },
    ] },
  ],
};

const feastFossil = {
  'task-start.any': [
    { id: 'gyi2.ff-s1', when: FEAST, turns: [
      { beat: 'The sheep\'s head on the plate is looking straight at {a}.' },
      { by: 'a', say: "It's looking at me. Can we turn it round?" },
      { by: 'b', say: "We have to eat it. It can look at you while it happens." },
    ] },
    { id: 'gyi2.ff-s2', when: FEAST, turns: [
      { by: 'b', say: "Strategy. We eat the worst thing first, while we're still brave." },
      { by: 'a', say: "Which is the worst thing?" },
      { beat: 'They both look at the fermented shark. It looks back. In a way.' },
    ] },
    { id: 'gyi2.ff-s3', when: FOSSIL, turns: [
      { beat: '{a} holds the pick up to the ice wall. Behind a foot of blue ice, the faint shape of a shell.' },
      { by: 'a', say: "There. Can you see it? A little curly one." },
      { by: 'b', say: "I see it. Don't fall in love. Just dig." },
    ] },
    { id: 'gyi2.ff-s4', when: FOSSIL, turns: [
      { by: 'b', say: "Chip round it, not at it. Leave a big border of ice." },
      { by: 'a', say: "Like cutting round a cake." },
      { by: 'b', say: "A frozen cake. A million years old. With a pick." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gyi2.ff-f1', when: FEAST, turns: [
      { beat: '{b} eats the sheep\'s head with a look of grim focus, like someone filling in a tax form.' },
      { by: 'a', say: "You're not even making a face." },
      { by: 'b', say: "I'm making it on the inside. Plate's empty. Let's go." },
    ] },
    { id: 'gyi2.ff-f2', when: FOSSIL, turns: [
      { beat: 'The block of ice around the fossil comes away all at once. {a} catches it in both mittens.' },
      { by: 'a', say: "Is it whole? Check it. I can't look." },
      { by: 'b', say: "It's whole. Not a scratch. First one." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gyi2.ff-a1', when: FEAST, turns: [
      { by: 'a', say: "We switch dishes. I eat yours, you eat mine. Someone else's horrible is easier." },
      { by: 'b', say: "That makes no sense." },
      { beat: 'It makes no sense, and it works. The second plate goes back clean.' },
    ] },
    { id: 'gyi2.ff-a2', when: FOSSIL, turns: [
      { beat: 'After two cracked shells, {b} warms the ice with {b.posAdj} breath and slides the fossil out like a drawer.' },
      { by: 'b', say: "Breath. Warm breath. It melts just enough." },
      { by: 'a', say: "You breathed a fossil out of a wall!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'gyi2.ff-t1', when: FEAST, turns: [
      { by: 'b', say: "The shot burns all the way down. And then it keeps burning." },
      { by: 'a', say: "Eat something to put it out." },
      { by: 'b', say: "The only thing left to eat is the sheep's eye!" },
    ] },
    { id: 'gyi2.ff-t2', when: FOSSIL, turns: [
      { beat: 'Ice chips cover {a} from head to boots. The fossil has barely moved.' },
      { by: 'a', say: "I've dug out half the cave and none of the fossil." },
      { by: 'b', say: "The cave was never the point!" },
    ] },
    { id: 'gyi2.ff-t3', when: FF, turns: [
      { by: 'a', say: "We could switch. The other side's right there." },
      { by: 'b', say: "And waste everything we've done?" },
      { by: 'a', say: "What we've done is suffer. I'll happily waste that." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gyi2.ff-x1', when: FEAST, turns: [
      { beat: 'The cook lifts their plate, finds one small grey cube hiding under a lettuce leaf, and puts down a whole new plate.' },
      { by: 'a', say: "One cube! One cube and we start again?" },
      { by: 'b', say: "Who hid it under the lettuce? Was that you?" },
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
      { by: 'a', say: "The shark will eat the mint." },
    ] },
    { id: 'gyi2.ff-dn2', when: FOSSIL, turns: [
      { beat: '{a} carries the fossil out of the cave held up in front of {a.obj}, like a waiter with a cake.' },
      { by: 'b', say: "If you trip now, I'll never forgive you." },
      { by: 'a', say: "If I trip now, I'll never forgive me." },
    ] },
    { id: 'gyi2.ff-dn3', when: FF, turns: [
      { by: 'b', say: "Rock wall. Chill Zone. Then something hot to drink." },
      { by: 'a', say: "And something to eat that hasn't been buried first." },
      { by: 'b', say: "We'll check before we eat anything here. Ask every time." },
    ] },
  ],
};

export default mergePools(telephone, feastFossil);
