// Red Sand Desert, second batch of challenge lines. Same rules as places/red-sand-desert.js: the spices gate on
// what the team picked (nobody checks at the market; the stew finds out), a eats the stew, b watches.
import { V, mergePools } from '../_kit.js';

const SP = { taskId: 'spices' };
const CM = { taskId: 'camel' };
const ST = { taskId: 'stew' };

const spices = {
  'task-start.any': [
    { id: 'rsd2.sp-s1', when: SP, turns: [
      { beat: 'A cloud of red powder puffs up as {b} pokes a basket. {b} sneezes three times.' },
      { by: 'a', say: "That's paprika. That's definitely paprika." },
      { by: 'b', say: "How do you know?" },
      { by: 'a', say: "Because you sneezed it all over me." },
    ] },
    { id: 'rsd2.sp-s2', when: SP, turns: [
      { by: 'b', say: "Read me the list again." },
      { by: 'a', say: "'Ideally cumin, cinnamon, paprika, saffron and ginger.'" },
      { by: 'b', say: "Ideally. What does ideally mean?" },
      { by: 'a', say: "It means nobody's checking. Until the stew." },
    ] },
    { id: 'rsd2.sp-s3', when: SP, turns: [
      { beat: 'The merchant offers {a} a tiny spoon to taste from. {a} tastes one and goes bright red.' },
      { by: 'a', ...V("Not that one. Whatever that one is, not that one.", "Not that one.", "No. Not that.", "NOT that one! WHATEVER it is, NOT that one!", "Whatever that one is, please let's not pick it.", "That one is a fire wearing a powder costume.") },
      { by: 'b', say: "Was it hot?" },
      { by: 'a', say: "So hot." },
    ] },
    { id: 'rsd2.sp-s4', when: SP, turns: [
      { by: 'a', say: "Smell everything. Write nothing down. Trust your nose." },
      { by: 'b', say: "Okay. I'll try." },
      { by: 'a', say: "Just smell them." },
    ] },
  ],
  'task-done.any': [
    { id: 'rsd2.sp-dn1', when: { ...SP, picked: 'right' }, turns: [
      { by: 'b', say: "I'm sure about these. I'm really sure." },
      { by: 'a', say: "Don't be sure. Being sure is how it goes wrong." },
      { by: 'b', say: "Okay. I'm pretty sure." },
    ] },
    { id: 'rsd2.sp-dn2', when: { ...SP, picked: ['mostly', 'wrong'] }, turns: [
      { beat: '{a} holds the five little bags up to the light, one by one, frowning.' },
      { by: 'a', say: "Four of these are spices. I'm not sure about the fifth." },
      { by: 'b', say: "What else could it be?" },
      { by: 'a', say: "I don't know. That's the problem." },
    ] },
    { id: 'rsd2.sp-dn3', when: SP, turns: [
      { by: 'a', say: "Put them somewhere safe. Not your pocket." },
      { by: 'b', say: "Why not my pocket?" },
      { by: 'a', say: "Because you'll lose them. Put them in the bag." },
    ] },
    { id: 'rsd2.sp-dn4', when: SP, turns: [
      { beat: 'The merchant waves goodbye to {a} and {b} with a big, knowing smile.' },
      { by: 'b', say: "Why is he smiling like that?" },
      { by: 'a', say: "I don't know. Maybe we got one wrong." },
      { by: 'b', say: "Don't look back. Walk faster." },
    ] },
  ],
};

const camel = {
  'ride.any': [
    { id: 'rsd2.cm-r1', when: CM, turns: [
      { beat: 'The camel kneels down to let them on, then stands up back legs first. {a} and {b} slide forwards.' },
      { by: 'a', say: "Nobody said it stands up backwards!" },
      { by: 'b', say: "Hold on to the hump! Hold the hump!" },
    ] },
    { id: 'rsd2.cm-r2', when: CM, turns: [
      { by: 'b', say: "Are the spices okay? Check the spices." },
      { by: 'a', say: "They're fine. They're in the bag. The bag's on the camel." },
      { by: 'b', say: "The camel's sniffing the bag." },
      { by: 'a', say: "Move it! Move the bag!" },
    ] },
    { id: 'rsd2.cm-r3', when: CM, turns: [
      { beat: 'The wind picks up and blows red sand straight into {a} and {b}\'s faces.' },
      { by: 'a', ...V("Close your mouth. Close everything. The sand gets in everything.", "Close your mouth.", "Mouth shut.", "CLOSE your mouth! The SAND gets in EVERYTHING!", "Close your mouth, the sand gets into everything.", "Seal every hole in your face.") },
      { by: 'b', say: "Mm-hmm." },
    ] },
    { id: 'rsd2.cm-r4', when: CM, turns: [
      { by: 'b', say: "Does it have a name?" },
      { by: 'a', say: "I don't know. It's slow, though." },
      { by: 'b', say: "Come on, camel. You can do it." },
    ] },
  ],
};

const stew = {
  'task-start.any': [
    { id: 'rsd2.st-s1', when: ST, turns: [
      { beat: 'The chef tips the team\'s five spices into the pot one bag at a time, sniffing after each.' },
      { by: 'b', say: "He's sniffing it. Why is he sniffing it?" },
      { by: 'a', say: "I don't know. Maybe he can tell." },
    ] },
    { id: 'rsd2.st-s2', when: { ...ST, picked: 'right' }, turns: [
      { by: 'a', say: "It smells amazing. It actually smells like dinner." },
      { by: 'b', say: "Then eat it quick." },
      { by: 'a', say: "I am. I am." },
      { by: 'b', say: "Go!" },
    ] },
    { id: 'rsd2.st-s3', when: { ...ST, picked: ['mostly', 'wrong'] }, turns: [
      { beat: 'A thin wisp of black smoke rises from the bowl as the chef sets it down.' },
      { by: 'a', say: "Is it smoking? Food shouldn't smoke." },
      { by: 'b', say: "That's just steam. Eat it." },
    ] },
    { id: 'rsd2.st-s4', when: ST, turns: [
      { by: 'b', say: "Little sips. Then big sips. Then the whole thing." },
      { by: 'a', say: "Okay. Little sips first." },
      { by: 'b', say: "Go." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rsd2.st-f1', when: { ...ST, picked: 'right' }, turns: [
      { beat: '{a} eats the whole bowl and wipes it clean with a piece of bread.' },
      { by: 'a', say: "That was the best thing I've eaten all week." },
      { by: 'b', say: "You picked well. We picked well!" },
    ] },
    { id: 'rsd2.st-f2', when: ST, turns: [
      { by: 'b', say: "Don't stop. If you stop, you'll taste it." },
      { beat: '{a} doesn\'t stop. Spoon, spoon, spoon, until there\'s nothing left.' },
      { by: 'a', say: "I tasted it anyway." },
      { by: 'b', say: "But it's gone!" },
    ] },
    { id: 'rsd2.st-f3', when: ST, turns: [
      { beat: '{a} finishes, puts the spoon down neatly, and gives the chef a little bow.' },
      { by: 'b', say: "Why are you bowing?" },
      { by: 'a', say: "To say thank you. It was actually really good." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rsd2.st-a1', when: ST, turns: [
      { by: 'b', say: "Hold your nose. If you can't smell it, you can't taste it." },
      { beat: '{a} holds {a.posAdj} nose with one hand and eats with the other.' },
      { by: 'a', say: "It's working. It's working a little." },
      { beat: 'A little is enough. The bowl is empty.' },
    ] },
    { id: 'rsd2.st-a2', when: { ...ST, picked: ['mostly', 'wrong'] }, turns: [
      { beat: '{a} stares at the fresh bowl, then at {b}.' },
      { by: 'a', say: "Which one was it? Which spice did this?" },
      { by: 'b', say: "The grey one. It was definitely the grey one." },
      { by: 'a', say: "I'm never eating anything grey again." },
      { beat: 'Spoon after spoon, {a} finishes the whole bowl.' },
    ] },
    { id: 'rsd2.st-a3', when: ST, turns: [
      { by: 'a', say: "Water. I need water." },
      { by: 'b', say: "Not water! Water makes it worse! Eat bread!" },
      { beat: 'Bread between every spoonful, and {a} gets through the bowl.' },
    ] },
    { id: 'rsd2.st-a4', when: ST, turns: [
      { beat: '{a} pauses with the spoon halfway, takes a deep breath, and closes {a.posAdj} eyes.' },
      { by: 'b', say: "What are you doing?" },
      { by: 'a', say: "Pretending it's ice cream." },
      { beat: 'It doesn\'t work, but the bowl gets finished.' },
    ] },
  ],
  'task-done.any': [
    { id: 'rsd2.st-dn1', when: ST, turns: [
      { by: 'a', say: "My lips are numb. Are my lips still there?" },
      { by: 'b', say: "They're there. They're very red." },
      { by: 'a', say: "Everything hurts." },
    ] },
    { id: 'rsd2.st-dn2', when: ST, turns: [
      { beat: '{a} stands up from the table very slowly, holding the edge.' },
      { by: 'b', say: "Are you okay to walk?" },
      { by: 'a', say: "I'm okay to walk. Just slowly." },
    ] },
    { id: 'rsd2.st-dn3', when: { ...ST, picked: 'right' }, turns: [
      { by: 'b', say: "Was it actually good?" },
      { by: 'a', say: "It was really good. Can we come back here on holiday?" },
      { by: 'b', say: "After the race. With a much smaller bowl." },
    ] },
    { id: 'rsd2.st-dn4', when: { ...ST, picked: ['mostly', 'wrong'] }, turns: [
      { by: 'a', say: "Next time, I'm picking the spices." },
      { by: 'b', say: "We picked them together." },
      { by: 'a', say: "I know. It was actually good." },
    ] },
    { id: 'rsd2.st-dn5', when: ST, turns: [
      { beat: 'The chef hands over the tip, and pats {a} gently on the shoulder.' },
      { by: 'b', say: "He's proud of you." },
      { by: 'a', say: "I think he's sorry for me." },
    ] },
  ],
};

export default mergePools(spices, camel, stew);
