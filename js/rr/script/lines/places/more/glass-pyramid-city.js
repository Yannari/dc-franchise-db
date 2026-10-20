// Glass Pyramid City, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/glass-pyramid-city.js: both search the galleries for the head, body
// and legs and fit them on the plinth for the curator, past the loose show animals; at the runway, a walks the
// designer's outfit and b watches from the side.
import { V, mergePools } from '../_kit.js';

const BS = { taskId: 'broken-statue' };
const RW = { taskId: 'runway' };

const statue = {
  'task-start.any': [
    { id: 'gpc2.bs-s5', when: BS, turns: [
      { beat: '{a} and {b} stand at the empty plinth. A little card on it says only: "Please return me."' },
      { by: 'a', say: "Return you from where?" },
      { by: 'b', say: "From everywhere. That's the problem." },
      { by: 'a', say: "Head, body, legs. How hard can it be?" },
    ] },
    { id: 'gpc2.bs-s6', when: BS, turns: [
      { beat: 'A monkey in a tiny waistcoat runs past them down the gallery, holding a museum map.' },
      { by: 'b', say: "That monkey has a map." },
      { by: 'a', say: "Follow the monkey. The monkey knows the way." },
      { by: 'b', say: "The monkey is eating the map." },
    ] },
    { id: 'gpc2.bs-s7', when: BS, turns: [
      { by: 'a', ...V("Look for something that's lying down. Statues don't lie down.", "Look for a statue that's lying down.", "Look low.", "Look for anything LYING DOWN! Statues don't LIE DOWN!", "Let's look for anything lying down, because statues usually don't.", "A tired statue is a broken statue.") },
      { by: 'b', say: "That one's lying down." },
      { by: 'a', say: "That's a security guard having a nap." },
    ] },
    { id: 'gpc2.bs-s8', when: BS, turns: [
      { beat: 'A guard glares as {b} lifts a marble arm off a display to check underneath it.' },
      { by: 'b', say: "Sorry. Just looking. Not stealing." },
      { by: 'a', say: "Put the arm down. We don't need an arm." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gpc2.bs-f5', when: BS, turns: [
      { beat: 'A llama in a gallery doorway is chewing thoughtfully on something white. It\'s the statue\'s nose. The nose is attached to the head.' },
      { by: 'b', say: "Give it! Good llama. Nice llama. Let go!" },
      { beat: 'The llama lets go. The head, the body behind a sofa and the legs under a tablecloth all go on the plinth, and the curator nods.' },
    ] },
    { id: 'gpc2.bs-f6', when: BS, turns: [
      { by: 'a', say: "Every piece we need is the only thing in its room that isn't on a label." },
      { by: 'b', say: "So we read labels?" },
      { by: 'a', say: "We look for the thing with no label." },
      { beat: 'Three rooms, three unlabelled pieces, and the statue goes together whole on the first fit.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gpc2.bs-a5', when: BS, turns: [
      { by: 'b', say: "The curator keeps looking at the feet. The feet are wrong, not the legs." },
      { by: 'a', say: "Which way round are feet supposed to go?" },
      { by: 'b', say: "Toes at the front! Like ours!" },
      { beat: 'Toes at the front, the legs slot onto the plinth. The curator finally lets out a breath and hands over the tip.' },
    ] },
    { id: 'gpc2.bs-a6', when: BS, turns: [
      { beat: 'This time {a} carries the head in both arms like a baby, and {b} walks in front, clearing the way past the animals.' },
      { by: 'b', say: "Coming through! Precious cargo! Move, peacock!" },
      { beat: 'Nothing is dropped, nothing goes on upside down, and the curator agrees the statue is whole.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'gpc2.bs-t4', when: BS, turns: [
      { beat: '{a} is holding the marble body up on the plinth with both arms, red in the face, while {b} runs off to look for the legs.' },
      { by: 'a', say: "Hurry! It's very heavy! It's heavier than me!" },
      { by: 'b', say: "Then put it down!" },
      { by: 'a', say: "I can't put it down! I'll lose my place!" },
    ] },
    { id: 'gpc2.bs-t5', when: BS, turns: [
      { by: 'b', say: "I've been past this painting four times." },
      { by: 'a', say: "Same one?" },
      { by: 'b', say: "The lady in it is starting to recognise me." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gpc2.bs-x4', when: BS, turns: [
      { beat: 'The curator walks once round the statue, stops at the back, and taps the head. It\'s on facing the wall.' },
      { by: 'a', say: "From the front it looked fine!" },
      { by: 'b', say: "She looks at the back too. Off it comes. Again." },
    ] },
    { id: 'gpc2.bs-x5', when: BS, turns: [
      { beat: 'A juggler from the travelling show borrows the marble head from {b} for one trick, and doesn\'t give it back.' },
      { by: 'b', say: "That's ours! Bring it back!" },
      { by: 'a', say: "He's gone into another gallery! After him!" },
    ] },
  ],
  'task-done.any': [
    { id: 'gpc2.bs-dn4', when: BS, turns: [
      { by: 'b', say: "It's very beautiful, now it's in one piece." },
      { by: 'a', say: "Who broke it in the first place?" },
      { by: 'b', say: "I bet it was the bear." },
    ] },
    { id: 'gpc2.bs-dn5', when: BS, turns: [
      { beat: 'On the way out, {a} stops to straighten a painting. A guard steps forward. {a} steps back.' },
      { by: 'a', say: "It was crooked." },
      { by: 'b', say: "Leave the museum alone. We've done enough for the museum." },
    ] },
    { id: 'gpc2.bs-dn6', when: BS, turns: [
      { by: 'a', say: "We put back together something that's two thousand years old." },
      { by: 'b', say: "In an afternoon." },
      { by: 'a', say: "With a llama watching. Write that on the little card." },
    ] },
  ],
};

const runway = {
  'task-start.any': [
    { id: 'gpc2.rw-s5', when: RW, turns: [
      { beat: 'Two assistants lower an outfit onto {a} from above, on ropes. It is shaped like a chandelier.' },
      { by: 'a', say: "Am I wearing it, or is it wearing me?" },
      { by: 'b', say: "Don't ask questions. Fashion doesn't answer questions." },
    ] },
    { id: 'gpc2.rw-s6', when: RW, turns: [
      { by: 'b', say: "Walk, stop, pose, turn, walk back. Five things. You can do five things." },
      { by: 'a', say: "I can do five things in trainers." },
      { by: 'b', say: "Then pretend those are trainers." },
    ] },
    { id: 'gpc2.rw-s7', when: RW, turns: [
      { beat: '{a} steps up to the start of the runway, and the outfit\'s collar is so tall that {a} can only see straight ahead.' },
      { by: 'a', say: "I can't see the edges. Where does the runway end?" },
      { by: 'b', say: "Where the designer is. Walk until you can smell her perfume." },
    ] },
    { id: 'gpc2.rw-s8', when: RW, turns: [
      { by: 'a', say: "What pose do I do at the end?" },
      { by: 'b', say: "Something that says, 'I am expensive and I am tired of you.'" },
      { by: 'a', say: "I'm only half of that." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gpc2.rw-f5', when: RW, turns: [
      { beat: '{a} walks the length of the runway like {a.sub} own the building, stops, puts one hand on a hip, and stares the designer down.' },
      { by: 'b', say: "That's a stare! That's a whole stare!" },
      { beat: 'The designer stares back for a long second, then applauds.' },
    ] },
    { id: 'gpc2.rw-f6', when: RW, turns: [
      { by: 'a', say: "Pretend the statues are watching. Walk for the statues." },
      { beat: '{a} walks for the statues, poses for the statues, turns and walks back for the statues. The designer claps.' },
      { by: 'b', say: "The statues loved you. Everyone loved you." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gpc2.rw-a5', when: RW, turns: [
      { by: 'b', say: "You keep stopping because you're scared of the turn. So turn slowly. Like a cake in a microwave." },
      { by: 'a', say: "A cake in a microwave." },
      { beat: '{a} turns at the end like a cake in a microwave, slowly and steadily, and walks back without a wobble. The designer applauds.' },
      { by: 'a', say: "Microwave! The microwave saved me!" },
    ] },
    { id: 'gpc2.rw-a6', when: RW, turns: [
      { beat: 'New outfit, new walk. This time {a} hums a very serious song under {a.posAdj} breath and walks to the beat of it.' },
      { by: 'b', say: "What are you humming?" },
      { by: 'a', say: "Something sad. Very slow and very sad." },
      { beat: 'Slow and sad, {a} walks it perfectly, and the designer applauds.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'gpc2.rw-t4', when: RW, turns: [
      { beat: '{a} has stopped at the top of the runway and is staring at the long, empty stretch of it ahead.' },
      { by: 'a', say: "It's longer than it was a minute ago." },
      { by: 'b', say: "It's the same length! Walk it!" },
    ] },
    { id: 'gpc2.rw-t5', when: RW, turns: [
      { by: 'b', say: "That's the fifth outfit." },
      { by: 'a', say: "This one has a cage on it. With a bird in it." },
      { by: 'b', say: "Is it a real bird?" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gpc2.rw-x4', when: RW, turns: [
      { beat: '{a} spins at the end, and the outfit keeps spinning after {a} has stopped, taking {a} round again with it.' },
      { by: 'a', say: "I meant to do that!" },
      { by: 'b', say: "She didn't think so! New outfit!" },
    ] },
    { id: 'gpc2.rw-x5', when: RW, turns: [
      { beat: 'The outfit is so wide that halfway down the runway {a} gets stuck between two statues and has to stop.' },
      { by: 'a', say: "I'm wedged! The statues have got me!" },
      { by: 'b', say: "Back to the dressing room! Ask for a thinner one!" },
    ] },
  ],
  'task-done.any': [
    { id: 'gpc2.rw-dn4', when: RW, turns: [
      { beat: '{a} comes back from the dressing room in normal clothes and looks almost disappointed.' },
      { by: 'a', say: "I feel so small now." },
      { by: 'b', say: "You're the right size. You were the size of a sofa." },
    ] },
    { id: 'gpc2.rw-dn5', when: RW, turns: [
      { by: 'b', say: "She applauded. A real designer applauded you." },
      { by: 'a', say: "Put it on my gravestone." },
      { by: 'b', say: "Next to 'tripped twice'." },
    ] },
    { id: 'gpc2.rw-dn6', when: RW, turns: [
      { by: 'a', say: "Do you think I could do it for real? Model?" },
      { by: 'b', say: "In those outfits?" },
      { by: 'a', say: "In any outfit. I've got the stare now." },
    ] },
  ],
};

export default mergePools(statue, runway);
