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
      { by: 'b', say: "From all over the museum." },
      { by: 'a', say: "Head, body, legs. How hard can it be?" },
    ] },
    { id: 'gpc2.bs-s6', when: BS, turns: [
      { beat: 'A guard walks past them down the gallery, watching them closely.' },
      { by: 'b', say: "He's watching us." },
      { by: 'a', say: "Just don't touch anything we don't need to." },
      { by: 'b', say: "Okay. Head first." },
    ] },
    { id: 'gpc2.bs-s7', when: BS, turns: [
      { by: 'a', say: "Look for something on the floor. Statues don't lie on the floor." },
      { by: 'b', say: "That one's on the floor." },
      { by: 'a', say: "That's part of the exhibit. Keep looking." },
    ] },
    { id: 'gpc2.bs-s8', when: BS, turns: [
      { beat: 'A guard glares as {b} lifts a marble arm off a display to check underneath it.' },
      { by: 'b', say: "Sorry. Just looking. Not stealing." },
      { by: 'a', say: "Put the arm down. We don't need an arm." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gpc2.bs-f5', when: BS, turns: [
      { beat: 'The head is sitting on a windowsill in the first gallery, half hidden behind a curtain.' },
      { by: 'b', say: "There! Behind the curtain!" },
      { beat: 'The head, the body behind a sofa and the legs under a tablecloth all go on the plinth, and the curator nods.' },
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
      { beat: 'This time {a} carries the head in both arms, and {b} walks in front, clearing the way.' },
      { by: 'b', say: "Excuse us! Coming through!" },
      { beat: 'Nothing is dropped, nothing goes on upside down, and the curator agrees the statue is whole.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'gpc2.bs-t4', when: BS, turns: [
      { beat: '{a} is holding the marble body up on the plinth with both arms, red in the face, while {b} runs off to look for the legs.' },
      { by: 'a', say: "Hurry! It's so heavy!" },
      { by: 'b', say: "Then put it down!" },
      { by: 'a', say: "I can't put it down! I'll lose my place!" },
    ] },
    { id: 'gpc2.bs-t5', when: BS, turns: [
      { by: 'b', say: "I've been past this painting four times." },
      { by: 'a', say: "Same one?" },
      { by: 'b', say: "This museum is huge." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gpc2.bs-x4', when: BS, turns: [
      { beat: 'The curator walks once round the statue, stops at the back, and taps the head. It\'s on facing the wall.' },
      { by: 'a', say: "From the front it looked fine!" },
      { by: 'b', say: "She looks at the back too. Off it comes. Again." },
    ] },
    { id: 'gpc2.bs-x5', when: BS, turns: [
      { beat: 'The marble head slips out of {b}\'s hands, and a guard steps in and takes it back to its room.' },
      { by: 'b', say: "No! Wait! That's ours!" },
      { by: 'a', say: "He's taking it back! We have to start again!" },
    ] },
  ],
  'task-done.any': [
    { id: 'gpc2.bs-dn4', when: BS, turns: [
      { by: 'b', say: "It's very beautiful, now it's in one piece." },
      { by: 'a', say: "Who broke it in the first place?" },
      { by: 'b', say: "I don't know. Not us." },
    ] },
    { id: 'gpc2.bs-dn5', when: BS, turns: [
      { beat: 'On the way out, {a} stops to straighten a painting. A guard steps forward. {a} steps back.' },
      { by: 'a', say: "It was crooked." },
      { by: 'b', say: "Leave the museum alone. We've done enough for the museum." },
    ] },
    { id: 'gpc2.bs-dn6', when: BS, turns: [
      { by: 'a', say: "We put back together something that's two thousand years old." },
      { by: 'b', say: "In an afternoon." },
      { by: 'a', say: "With a bear in the room." },
    ] },
  ],
};

const runway = {
  'task-start.any': [
    { id: 'gpc2.rw-s5', when: RW, turns: [
      { beat: 'Two assistants lower an outfit onto {a} from above, on ropes. It\'s huge.' },
      { by: 'a', say: "How am I meant to walk in this?" },
      { by: 'b', say: "Slowly. Just walk slowly." },
    ] },
    { id: 'gpc2.rw-s6', when: RW, turns: [
      { by: 'b', say: "Walk, stop, pose, turn, walk back. Five things. You can do five things." },
      { by: 'a', say: "I can do five things in trainers." },
      { by: 'b', say: "Then pretend those are trainers." },
    ] },
    { id: 'gpc2.rw-s7', when: RW, turns: [
      { beat: '{a} steps up to the start of the runway, and the outfit\'s collar is so tall that {a} can only see straight ahead.' },
      { by: 'a', say: "I can't see the edges. Where does the runway end?" },
      { by: 'b', say: "Where the designer is. Walk until you see her." },
    ] },
    { id: 'gpc2.rw-s8', when: RW, turns: [
      { by: 'a', say: "What pose do I do at the end?" },
      { by: 'b', say: "Something big. Hand on your hip." },
      { by: 'a', say: "Okay. Hand on hip." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gpc2.rw-f5', when: RW, turns: [
      { beat: '{a} walks the length of the runway, stops, puts one hand on a hip, and looks straight at the designer.' },
      { by: 'b', say: "Yes! Hold it!" },
      { beat: 'The designer stares back for a long second, then applauds.' },
    ] },
    { id: 'gpc2.rw-f6', when: RW, turns: [
      { by: 'a', say: "Pretend nobody's watching. Just walk." },
      { beat: '{a} walks to the end, poses, turns and walks back. The designer claps.' },
      { by: 'b', say: "She loved it!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gpc2.rw-a5', when: RW, turns: [
      { by: 'b', say: "You keep stopping because you're scared of the turn. So turn slowly." },
      { by: 'a', say: "Slowly. Okay." },
      { beat: '{a} turns at the end slowly and steadily, and walks back without a wobble. The designer applauds.' },
      { by: 'a', say: "Slowly worked!" },
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
      { by: 'a', say: "It's so long." },
      { by: 'b', say: "It's the same length! Walk it!" },
    ] },
    { id: 'gpc2.rw-t5', when: RW, turns: [
      { by: 'b', say: "That's the fifth outfit." },
      { by: 'a', say: "This one's even bigger." },
      { by: 'b', say: "You can do this. One more." },
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
      { by: 'a', say: "I'm stuck!" },
      { by: 'b', say: "Back to the dressing room! Ask for a thinner one!" },
    ] },
  ],
  'task-done.any': [
    { id: 'gpc2.rw-dn4', when: RW, turns: [
      { beat: '{a} comes back from the dressing room in normal clothes and looks almost disappointed.' },
      { by: 'a', say: "I feel so small now." },
      { by: 'b', say: "That outfit was so big." },
    ] },
    { id: 'gpc2.rw-dn5', when: RW, turns: [
      { by: 'b', say: "She applauded. A real designer applauded you." },
      { by: 'a', say: "I'll never forget that." },
      { by: 'b', say: "Me neither." },
    ] },
    { id: 'gpc2.rw-dn6', when: RW, turns: [
      { by: 'a', say: "Do you think I could do it for real? Model?" },
      { by: 'b', say: "In those outfits?" },
      { by: 'a', say: "Maybe. I think I've got the walk now." },
    ] },
  ],
};

export default mergePools(statue, runway);
