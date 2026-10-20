// Haunted Castle, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/haunted-castle.js: at the coffin, a pushes and b lies inside; at
// the gym, a does the split on the beam and the somersault onto the vault, and b watches from the bench.
import { V, mergePools } from '../_kit.js';

const CF = { taskId: 'coffin' };
const GY = { taskId: 'gym' };

const coffin = {
  'task-start.any': [
    { id: 'hcs2.cf-s1', when: CF, turns: [
      { beat: 'A candle gutters in the coffin hall. Somewhere above them, a door creaks shut on its own.' },
      { by: 'b', say: "Who shut that?" },
      { by: 'a', say: "The wind. Probably the wind. Keep reading names." },
    ] },
    { id: 'hcs2.cf-s2', when: CF, turns: [
      { by: 'b', say: "If I'm going in a coffin, I want a pillow." },
      { by: 'a', say: "There's no pillow. It's a coffin." },
      { beat: '{b} folds up {b.posAdj} jacket, puts it at the head end, and lies down like a pharaoh.' },
    ] },
    { id: 'hcs2.cf-s3', when: CF, turns: [
      { beat: '{a} lifts the lid of a coffin with their names on it. There is already a plastic skeleton inside.' },
      { by: 'a', say: "Somebody's in our coffin." },
      { by: 'b', say: "Well, he'll have to share. Move over, mate." },
    ] },
    { id: 'hcs2.cf-s4', when: CF, turns: [
      { by: 'a', say: "Arms in. Keep your arms in. If an arm falls out, that's a wobble." },
      { by: 'b', say: "And hold the lid. Got it." },
      { by: 'a', ...V("Hold the lid, keep your arms in, and don't sit up when I go over bumps.", "Lid held, arms in, no sitting up.", "Arms in. Lid on.", "HOLD the lid! Arms IN! Don't SIT UP!", "Just hold the lid, keep your arms in, and stay lying down for me.", "Be a very well-behaved dead person.") },
    ] },
  ],
  'task-try.first-try': [
    { id: 'hcs2.cf-f1', when: CF, turns: [
      { beat: '{a} steers the coffin down the hill like a pram, one hand on the lid, humming a lullaby.' },
      { by: 'b', say: "Are you humming me to sleep?" },
      { beat: 'The coffin rolls to a stop beside its grave. The grave digger hands over the tip.' },
      { by: 'a', say: "Sleep later. Out you get." },
    ] },
    { id: 'hcs2.cf-f2', when: CF, turns: [
      { by: 'b', say: "That's it? We're here? I didn't even feel the hill." },
      { by: 'a', say: "I took the grass. Grass is softer than gravel." },
      { by: 'b', say: "Best coffin ride I've ever had." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'hcs2.cf-a1', when: CF, turns: [
      { by: 'a', say: "Every time I push from the end, it goes sideways. So I steer from the side." },
      { beat: '{a} walks alongside the coffin like a nurse with a trolley, and it goes perfectly straight all the way to the graveyard.' },
      { by: 'b', say: "Nurse! You're a coffin nurse!" },
    ] },
    { id: 'hcs2.cf-a2', when: CF, turns: [
      { beat: 'This time {b} lies with both feet jammed against the end and both hands pressing the lid shut, stiff as a plank.' },
      { by: 'b', say: "Go! I'm a brick! Nothing can tip a brick!" },
      { beat: 'Nothing tips the brick. The grave digger takes one look and hands over the tip.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'hcs2.cf-t1', when: CF, turns: [
      { by: 'b', say: "It's very dark in here. And it smells of old wood." },
      { by: 'a', say: "It's a coffin. That's what they smell like." },
      { by: 'b', say: "How long have we been going? It feels like a year." },
    ] },
    { id: 'hcs2.cf-t2', when: CF, turns: [
      { beat: 'Another team\'s coffin overtakes them on the path, wheels rattling.' },
      { by: 'a', say: "How are they going so fast?" },
      { by: 'b', say: "Their dead person is lighter. Don't look at me like that." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'hcs2.cf-x1', when: CF, turns: [
      { beat: 'Halfway down, {b} sneezes. The lid jumps off, and the coffin swerves into a hedge.' },
      { by: 'a', say: "You sneezed! Dead people don't sneeze!" },
      { by: 'b', say: "This one does! Back up the hill!" },
    ] },
    { id: 'hcs2.cf-x2', when: CF, turns: [
      { beat: '{a} takes the fork past the crooked tree. It ends at a wall, and a gardener waving them back to the gate.' },
      { by: 'b', say: "Why have we stopped? Why is a man shouting?" },
      { by: 'a', say: "Wrong path. Start again from the gate." },
    ] },
  ],
  'task-done.any': [
    { id: 'hcs2.cf-dn1', when: CF, turns: [
      { beat: '{b} sits up in the coffin, grey with dust, and looks around the graveyard.' },
      { by: 'b', say: "I've seen the other side. It was mostly the inside of a lid." },
      { by: 'a', say: "Great. Get out. There are horses." },
    ] },
    { id: 'hcs2.cf-dn2', when: CF, turns: [
      { by: 'a', say: "Next time you push me. That's fair." },
      { by: 'b', say: "Next time there isn't a coffin." },
      { by: 'a', say: "On this race? There's always a coffin." },
    ] },
    { id: 'hcs2.cf-dn3', when: CF, turns: [
      { by: 'b', say: "Do we leave the coffin here?" },
      { by: 'a', say: "What else would we do with it?" },
      { by: 'b', say: "I don't know. I'd got quite fond of it." },
    ] },
  ],
};

const gym = {
  'task-start.any': [
    { id: 'hcs2.gy-s1', when: GY, turns: [
      { beat: 'The coach chalks her hands, claps once, and a cloud of white dust hangs in the cold air of the hall.' },
      { by: 'a', say: "Should I chalk my hands?" },
      { by: 'b', say: "Chalk everything. Chalk your legs. Chalk your soul." },
    ] },
    { id: 'hcs2.gy-s2', when: GY, turns: [
      { by: 'a', say: "Arms up when I land. They always put their arms up." },
      { by: 'b', say: "That's the bit you're worried about? The arms?" },
      { by: 'a', say: "It's the only bit I know how to do." },
    ] },
    { id: 'hcs2.gy-s3', when: GY, turns: [
      { beat: '{a} stands at the end of the run-up, staring down at the vault, bouncing on {a.posAdj} toes.' },
      { by: 'b', say: "Go when you're ready!" },
      { by: 'a', say: "I'll never be ready! I'm going now!" },
    ] },
    { id: 'hcs2.gy-s4', when: GY, turns: [
      { by: 'b', say: "Remember, she wants a full split. Not a nearly." },
      { by: 'a', say: "My nearly is very good." },
      { by: 'b', say: "She doesn't want very good nearly. She wants the floor." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'hcs2.gy-f1', when: GY, turns: [
      { beat: '{a} slides down into the split on the beam slowly, steadily, and stops flat. The hall is silent. The coach nods.' },
      { by: 'b', say: "Where did that come from?" },
      { by: 'a', say: "I don't know. I'm as shocked as you are." },
    ] },
    { id: 'hcs2.gy-f2', when: GY, turns: [
      { beat: 'After the vault, {a} lands, throws both arms up and holds the pose until the coach looks.' },
      { by: 'a', say: "Arms! I did the arms!" },
      { by: 'b', say: "And everything before the arms! First go!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'hcs2.gy-a1', when: GY, turns: [
      { by: 'b', say: "You run up too slowly. You need speed to get over. Run like you're late for a train." },
      { beat: '{a} sprints like {a.sub} is late for a train, flips over the vault and lands it.' },
      { by: 'a', say: "I've been late for a lot of trains. It helped." },
    ] },
    { id: 'hcs2.gy-a2', when: GY, turns: [
      { beat: 'On the third go, {a} breathes out all the way, and sinks down into the split until {a.posAdj} legs touch the beam.' },
      { by: 'a', say: "Breathe out. That was it the whole time. Breathe out." },
      { beat: 'The coach makes a small mark on her clipboard, and waves them out.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'hcs2.gy-t1', when: GY, turns: [
      { by: 'a', say: "My legs are shaking. Both legs. In two different directions." },
      { by: 'b', say: "Make them shake the same way!" },
      { by: 'a', say: "They don't take instructions!" },
    ] },
    { id: 'hcs2.gy-t2', when: GY, turns: [
      { beat: '{a} stands at the end of the run-up for the fourth time while the coach taps her foot.' },
      { by: 'b', say: "The run-up doesn't get shorter if you stare at it." },
      { by: 'a', say: "Nothing in this hall gets shorter. I've checked." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'hcs2.gy-x1', when: GY, turns: [
      { beat: '{a} gets the split, then tries to stand up out of it and topples off the beam sideways onto the mat.' },
      { by: 'b', say: "You were done! You only had to stand up!" },
      { by: 'a', say: "Standing up is the hardest part! Again!" },
    ] },
    { id: 'hcs2.gy-x2', when: GY, turns: [
      { beat: '{a} runs at the vault, puts both hands on it, and stops dead, still standing on the floor.' },
      { by: 'a', say: "That was a practice one." },
      { by: 'b', say: "She doesn't do practice ones! Back to the beam!" },
    ] },
  ],
  'task-done.any': [
    { id: 'hcs2.gy-dn1', when: GY, turns: [
      { by: 'a', say: "Do you think she'll coach me? Properly? I've got a gift." },
      { by: 'b', say: "She sent you back four times." },
      { by: 'a', say: "That's how you know she cares." },
    ] },
    { id: 'hcs2.gy-dn2', when: GY, turns: [
      { beat: '{a} limps out of the hall into the dark, one hand on the small of {a.posAdj} back.' },
      { by: 'b', say: "Race you to the Chill Zone." },
      { by: 'a', say: "That's cruel and you know it." },
    ] },
    { id: 'hcs2.gy-dn3', when: GY, turns: [
      { by: 'b', say: "I'm going to show everybody back home. I filmed it in my head." },
      { by: 'a', say: "Delete it. Delete the vault bit." },
      { by: 'b', say: "I can't. It's in there forever. The landing too." },
    ] },
  ],
};

export default mergePools(coffin, gym);
