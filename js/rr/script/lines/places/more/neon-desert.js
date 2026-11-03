// Neon Desert, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/neon-desert.js: Buggy is a works the remote of a dune buggy big
// enough to ride while b clings on and grabs three flags, all inside a minute; Magic is a locked in a cage with a
// sleeping lion while b pulls the right one of six levers to make a vanish before it wakes.
import { V, mergePools } from '../_kit.js';

const BM = { taskId: 'buggy-magic' };
const BUGGY = { taskId: 'buggy-magic', side: 'buggy' };
const MAGIC = { taskId: 'buggy-magic', side: 'magic' };

const buggyMagic = {
  'task-start.any': [
    { id: 'nde2.bm-s1', when: BUGGY, turns: [
      { beat: '{b} sits on the buggy, which is only just big enough, holding on with one hand.' },
      { by: 'b', say: "There's no seatbelt. Why is there no seatbelt?" },
      { by: 'a', say: "Just hold on tight." },
    ] },
    { id: 'nde2.bm-s2', when: BUGGY, turns: [
      { by: 'a', say: "The flags are on the left. All three. So I keep the left side close." },
      { by: 'b', say: "Close, not on top of. Don't drive me into a pole." },
      { by: 'a', say: "I won't. I promise." },
    ] },
    { id: 'nde2.bm-s3', when: MAGIC, turns: [
      { beat: 'The magician swirls his cape, opens the cage, and waves {a} inside. The lion, in the corner, is snoring.' },
      { by: 'a', say: "It's so big. Nobody said it would be this big." },
      { by: 'b', say: "It's asleep. You'll be fine." },
    ] },
    { id: 'nde2.bm-s4', when: MAGIC, turns: [
      { by: 'b', say: "Which one? Which lever?" },
      { by: 'a', say: "Just pull the lever!" },
      { by: 'b', say: "I'm trying! I'm not sure!" },
    ] },
  ],
  'task-try.first-try': [
    { id: 'nde2.bm-f1', when: BUGGY, turns: [
      { beat: '{a} takes the buggy round the course in one long smooth curve. {b} snatches all three flags without the buggy even slowing.' },
      { by: 'b', say: "Forty seconds! We did it!" },
      { by: 'a', say: "That was so fast!" },
    ] },
    { id: 'nde2.bm-f2', when: BUGGY, turns: [
      { by: 'b', say: "Flag one! Flag two! Flag... three!" },
      { beat: 'The buggy skids to a stop at the finish post with sand spraying out in a fan. The clock says fifty-four.' },
      { by: 'a', say: "I can't believe it!" },
    ] },
    { id: 'nde2.bm-f3', when: MAGIC, turns: [
      { beat: '{b} pulls the second lever. A trapdoor opens, the cage floor drops, and {a} is gone in a puff of smoke. The lion doesn\'t move.' },
      { by: 'b', say: "Second lever! First pull!" },
      { beat: 'A muffled voice comes up through the floorboards.' },
      { by: 'a', say: "I'm under the stage! It worked!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'nde2.bm-a1', when: BUGGY, turns: [
      { by: 'a', say: "The buggy turns late. So I start turning before I want to." },
      { beat: '{a} turns before {a.sub} wants to, every corner. The buggy slides past every pole exactly where {b} can grab the flag.' },
      { by: 'b', say: "Three! And under the minute!" },
    ] },
    { id: 'nde2.bm-a2', when: BUGGY, turns: [
      { beat: 'After three runs, {b} stops leaning out for the flags and holds one arm out wide the whole way round instead.' },
      { by: 'b', say: "Just drive me past them!" },
      { beat: 'The flags hit {b}\'s arm one, two, three, and the clock stops at fifty-six.' },
    ] },
    { id: 'nde2.bm-a3', when: MAGIC, turns: [
      { by: 'b', say: "The magician's eyes go to the lever every time it's right. He can't help it." },
      { beat: '{b} watches the magician, not the levers. His eyes flick left. {b} pulls the lever on the left. {a} vanishes.' },
      { by: 'a', say: "Did I do it? Did you do it? It's very dark down here!" },
    ] },
    { id: 'nde2.bm-a4', when: MAGIC, turns: [
      { beat: 'Third time in the cage, {a} stops panicking, lies down flat on the cage floor, and closes {a.posAdj} eyes.' },
      { by: 'a', say: "If I'm still, it won't notice me." },
      { beat: 'The lion stays asleep long enough for {b} to find the right lever. The floor drops, and {a} disappears.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'nde2.bm-t1', when: BUGGY, turns: [
      { by: 'b', say: "We're in the dune. We're stuck in the dune." },
      { by: 'a', say: "The wheels are spinning! I'm pressing everything!" },
      { by: 'b', say: "You're digging us a hole! Stop pressing everything!" },
    ] },
    { id: 'nde2.bm-t2', when: MAGIC, turns: [
      { beat: 'The lion rolls over in its sleep and lays one huge paw across {a}\'s foot.' },
      { by: 'a', say: "It's touching me. Its paw is on my foot." },
      { by: 'b', say: "Don't move! Don't move!" },
    ] },
    { id: 'nde2.bm-t3', when: BM, turns: [
      { by: 'a', say: "Do we switch? Lion or buggy?" },
      { by: 'b', say: "I don't know." },
      { by: 'a', say: "Let's just try the other one." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'nde2.bm-x1', when: BUGGY, turns: [
      { beat: '{b} grabs the third flag just as the horn sounds for the end of the minute.' },
      { by: 'b', say: "I had it! I had it before the horn!" },
      { by: 'a', say: "The horn says no! Back to the start!" },
    ] },
    { id: 'nde2.bm-x2', when: BUGGY, turns: [
      { beat: 'The buggy hits a bump, and {b} flies off the back into the sand, still holding the first flag.' },
      { by: 'a', say: "You fell off!" },
      { by: 'b', say: "I've still got the flag! Okay. Again!" },
    ] },
    { id: 'nde2.bm-x3', when: MAGIC, turns: [
      { beat: '{b} pulls a lever. A spotlight swings round and shines directly on the lion\'s face. It opens one eye.' },
      { by: 'a', say: "Why would you light it up?" },
      { by: 'b', say: "I didn't know! Start again!" },
    ] },
    { id: 'nde2.bm-x4', when: MAGIC, turns: [
      { beat: 'The trapdoor opens under {b} instead, and {b} drops out of sight. {a} is still in the cage.' },
      { by: 'a', say: "Wrong one! You're the one who disappeared!" },
      { beat: 'The magician sighs, and they start again from the top.' },
    ] },
  ],
  'task-done.any': [
    { id: 'nde2.bm-dn1', when: BUGGY, turns: [
      { by: 'b', say: "I've got sand in every pocket." },
      { by: 'a', say: "I've got a sore thumb from the remote." },
      { by: 'b', say: "We both did great." },
    ] },
    { id: 'nde2.bm-dn2', when: MAGIC, turns: [
      { by: 'a', say: "There's a whole room under that stage." },
      { by: 'b', say: "Don't tell me. I don't want to know how it works." },
      { by: 'a', say: "I was in a cage with a lion." },
    ] },
    { id: 'nde2.bm-dn3', when: BM, turns: [
      { beat: '{a} and {b} run out of the desert towards the theatre doors, which are lit up with a thousand flashing bulbs.' },
      { by: 'b', say: "Is the Chill Zone a casino? It looks like a casino." },
      { by: 'a', say: "Everything here looks like a casino." },
    ] },
  ],
};

export default mergePools(buggyMagic);
