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
      { by: 'a', say: "It means nobody's checking. And it means we'll pay for it later." },
    ] },
    { id: 'rsd2.sp-s3', when: SP, turns: [
      { beat: 'The merchant offers {a} a tiny spoon to taste from. {a} tastes one and goes bright red.' },
      { by: 'a', ...V("Not that one. Whatever that one is, not that one.", "Not that one.", "No. Not that.", "NOT that one! WHATEVER it is, NOT that one!", "Whatever that one is, please let's not pick it.", "That one is a fire wearing a powder costume.") },
      { by: 'b', say: "Was it nice?" },
      { by: 'a', say: "It was a lot." },
    ] },
    { id: 'rsd2.sp-s4', when: SP, turns: [
      { by: 'a', say: "Smell everything. Write nothing down. Trust your nose." },
      { by: 'b', say: "My nose has never been trusted with anything." },
      { by: 'a', say: "Today's its big day." },
    ] },
  ],
  'task-done.any': [
    { id: 'rsd2.sp-dn1', when: { ...SP, picked: 'right' }, turns: [
      { by: 'b', say: "I'm sure about these. I'm really sure." },
      { by: 'a', say: "Don't be sure. Being sure is how it goes wrong." },
      { by: 'b', say: "Okay. I'm quietly sure." },
    ] },
    { id: 'rsd2.sp-dn2', when: { ...SP, picked: ['mostly', 'wrong'] }, turns: [
      { beat: '{a} holds the five little bags up to the light, one by one, frowning.' },
      { by: 'a', say: "Four of these are spices. I'm not sure about the fifth." },
      { by: 'b', say: "What else could it be?" },
      { by: 'a', say: "I don't want to say." },
    ] },
    { id: 'rsd2.sp-dn3', when: SP, turns: [
      { by: 'a', say: "Put them somewhere safe. Not your pocket." },
      { by: 'b', say: "Why not my pocket?" },
      { by: 'a', say: "Because the last thing you put in your pocket was a sandwich, and you sat on it." },
    ] },
    { id: 'rsd2.sp-dn4', when: SP, turns: [
      { beat: 'The merchant waves goodbye to {a} and {b} with a big, knowing smile.' },
      { by: 'b', say: "Why is he smiling like that?" },
      { by: 'a', say: "He knows something. He knows what we picked." },
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
      { by: 'b', say: "Is the camel eating the bag?" },
      { by: 'a', say: "...Not any more." },
    ] },
    { id: 'rsd2.cm-r3', when: CM, turns: [
      { beat: 'The wind picks up and blows red sand straight into {a} and {b}\'s faces.' },
      { by: 'a', ...V("Close your mouth. Close everything. The sand gets in everything.", "Close your mouth.", "Mouth shut.", "CLOSE your mouth! The SAND gets in EVERYTHING!", "Close your mouth, the sand gets into everything.", "Seal every hole in your face.") },
      { by: 'b', say: "Mmmf." },
    ] },
    { id: 'rsd2.cm-r4', when: CM, turns: [
      { by: 'b', say: "Do camels have names?" },
      { by: 'a', say: "This one's called Not Fast." },
      { by: 'b', say: "Come on, Not Fast. You can do it." },
    ] },
  ],
};

const stew = {
  'task-start.any': [
    { id: 'rsd2.st-s1', when: ST, turns: [
      { beat: 'The chef tips the team\'s five spices into the pot one bag at a time, sniffing after each.' },
      { by: 'b', say: "He's sniffing it. Why is he sniffing it?" },
      { by: 'a', say: "He's judging us. The chef is judging our spices." },
    ] },
    { id: 'rsd2.st-s2', when: { ...ST, picked: 'right' }, turns: [
      { by: 'a', say: "It smells amazing. It actually smells like dinner." },
      { by: 'b', say: "Then eat it before it changes its mind." },
      { by: 'a', say: "It's a stew. It doesn't have a mind." },
      { by: 'b', say: "Everything on this race has a mind." },
    ] },
    { id: 'rsd2.st-s3', when: { ...ST, picked: ['mostly', 'wrong'] }, turns: [
      { beat: 'A thin wisp of black smoke rises from the bowl as the chef sets it down.' },
      { by: 'a', say: "Is it smoking? Food shouldn't smoke." },
      { by: 'b', ...V("That's just steam. Dark steam. Eat it.", "That's steam. Eat it.", "Steam. Eat.", "That's just STEAM! DARK steam! EAT it!", "I'm sure that's just steam, a bit dark, but eat it.", "It's steam that has seen things.") },
    ] },
    { id: 'rsd2.st-s4', when: ST, turns: [
      { by: 'b', say: "Little sips. Then big sips. Then the whole thing." },
      { by: 'a', say: "That's three steps. I can only do one." },
      { by: 'b', say: "Then just do the whole thing." },
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
      { by: 'a', say: "Respect. He made me eat that, and I respect him for it." },
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
      { by: 'a', say: "I'm going to find the grey one and have words with it." },
      { beat: 'Angry at the grey spice, {a} finishes the whole bowl.' },
    ] },
    { id: 'rsd2.st-a3', when: ST, turns: [
      { by: 'a', ...V("Water. I need water. A lake of water.", "I need water.", "Water!", "WATER! I need WATER! A LAKE of water!", "Could I please have some water, a whole lake of it?", "Bring me every drop of water in the desert.") },
      { by: 'b', say: "No water! Water makes it worse! Eat bread!" },
      { beat: 'Bread between every spoonful, and {a} gets through the bowl.' },
    ] },
    { id: 'rsd2.st-a4', when: ST, turns: [
      { beat: '{a} pauses with the spoon halfway, takes a deep breath, and closes {a.posAdj} eyes.' },
      { by: 'b', say: "What are you doing?" },
      { by: 'a', say: "Pretending it's ice cream." },
      { beat: 'It isn\'t ice cream, but the bowl gets finished.' },
    ] },
  ],
  'task-done.any': [
    { id: 'rsd2.st-dn1', when: ST, turns: [
      { by: 'a', say: "My lips are numb. Are my lips still there?" },
      { by: 'b', say: "They're there. They're very red." },
      { by: 'a', say: "Don't touch them. They'll burn your fingers." },
    ] },
    { id: 'rsd2.st-dn2', when: ST, turns: [
      { beat: '{a} stands up from the table very slowly, holding the edge.' },
      { by: 'b', say: "Are you okay to walk?" },
      { by: 'a', say: "I'm okay to walk. I'm not okay to talk about it." },
    ] },
    { id: 'rsd2.st-dn3', when: { ...ST, picked: 'right' }, turns: [
      { by: 'b', say: "Was it actually good?" },
      { by: 'a', say: "It was really good. Can we come back here on holiday?" },
      { by: 'b', say: "After the race. With a much smaller bowl." },
    ] },
    { id: 'rsd2.st-dn4', when: { ...ST, picked: ['mostly', 'wrong'] }, turns: [
      { by: 'a', say: "Next time, I'm picking the spices." },
      { by: 'b', say: "We picked them together." },
      { by: 'a', say: "Next time I'm picking them alone." },
    ] },
    { id: 'rsd2.st-dn5', when: ST, turns: [
      { beat: 'The chef hands over the tip, and pats {a} gently on the shoulder.' },
      { by: 'b', say: "He's proud of you." },
      { by: 'a', say: "He's sorry for me. That's different." },
    ] },
  ],
};

export default mergePools(spices, camel, stew);
