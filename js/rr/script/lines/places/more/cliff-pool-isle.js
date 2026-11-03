// Cliff Pool Isle, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/cliff-pool-isle.js: at the falls, a jumps, brings a chest up off the
// bottom of the lagoon and carries it up the cliff path while b waits at the top; at the bobsled, both push and ride
// three runs whose total has to beat the board.
import { V, mergePools } from '../_kit.js';

const FD = { taskId: 'falls-dive' };
const BS = { taskId: 'bobsled' };

const dive = {
  'task-start.any': [
    { id: 'cpi2.fd-s5', when: FD, turns: [
      { beat: '{a} looks over the edge. The lagoon is a long way down.' },
      { by: 'a', say: "From up here it looks so small." },
      { by: 'b', say: "It's big. It's deep. You'll be fine." },
      { by: 'a', say: "Okay. Okay. I believe you." },
    ] },
    { id: 'cpi2.fd-s6', when: FD, turns: [
      { by: 'b', say: "Shoes off, or shoes on?" },
      { by: 'a', say: "On for the jump. Then I'll want them for the cliff." },
      { by: 'b', say: "They'll be full of water, but okay." },
    ] },
    { id: 'cpi2.fd-s7', when: FD, turns: [
      { beat: 'A local kid runs past {a}, jumps off the falls without stopping, and waves from the water.' },
      { by: 'b', say: "That child just did it. Without even looking." },
      { by: 'a', say: "Okay. If a kid can do it, I can do it." },
    ] },
    { id: 'cpi2.fd-s8', when: FD, turns: [
      { by: 'a', say: "I'm so scared. Okay. I'm going." },
      { by: 'b', say: "You'll be fine. I'm right here." },
      { by: 'a', say: "Okay. On three." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'cpi2.fd-f5', when: FD, turns: [
      { beat: '{a} jumps, goes in straight, and comes up a breath later with a little chest held over {a.posAdj} head.' },
      { by: 'b', say: "Already? You were down there two seconds!" },
      { by: 'a', say: "It was right under me. I landed on it." },
      { beat: 'The climb up the path is careful and slow, and the chest goes down at {b}\'s feet.' },
    ] },
    { id: 'cpi2.fd-f6', when: FD, turns: [
      { by: 'b', say: "Wait. Look. The sun's on the water. You can see the bottom." },
      { beat: '{a} waits for the sun, sees a little brass lock glinting, jumps straight at it, and comes up with the chest.' },
      { by: 'a', say: "Got it! Got it!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'cpi2.fd-a5', when: FD, turns: [
      { by: 'b', say: "You keep coming up for air too early. Take a big breath at the top. Big. Bigger." },
      { beat: '{a} takes the biggest breath of {a.posAdj} life, jumps, stays down twice as long, and comes up clutching a chest.' },
      { by: 'a', say: "That's it! That's the trick!" },
      { beat: 'Then the slow climb, the last step, and the chest set down at the top of the falls.' },
    ] },
    { id: 'cpi2.fd-a6', when: FD, turns: [
      { beat: 'This time {a} tucks the chest inside {a.posAdj} shirt for the climb, both hands free for the rocks.' },
      { by: 'a', say: "Now I've got both hands for the rocks." },
      { beat: 'Every handhold, every step, and the chest stays in the shirt all the way to the top.' },
      { by: 'b', say: "That's smart. That's so smart." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'cpi2.fd-t4', when: FD, turns: [
      { beat: '{a} is halfway up the cliff path, chest under one arm, and has stopped on a ledge to breathe.' },
      { by: 'a', say: "This path is so steep. I need a second." },
      { by: 'b', say: "Keep coming! You're more than halfway!" },
    ] },
    { id: 'cpi2.fd-t5', when: FD, turns: [
      { by: 'b', say: "You've been down there a long time. Come up." },
      { beat: 'Bubbles. Then nothing. Then more bubbles. Then {a}, without a chest.' },
      { by: 'a', say: "I couldn't see anything! It's all rocks down there!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'cpi2.fd-x4', when: FD, turns: [
      { beat: '{a} comes up with a box, opens it to check, and it\'s full of sand. It\'s not one of the treasure chests.' },
      { by: 'a', say: "That's not one of them!" },
      { by: 'b', say: "Leave it! Back up and jump again!" },
    ] },
    { id: 'cpi2.fd-x5', when: FD, turns: [
      { beat: '{a} gets to the very top of the path, reaches up to hand {b} the chest, and it slips out of both their hands and over the edge.' },
      { by: 'b', say: "No! It slipped!" },
      { by: 'a', say: "I know. Back to the edge. Go." },
    ] },
  ],
  'task-done.any': [
    { id: 'cpi2.fd-dn4', when: FD, turns: [
      { by: 'b', say: "What's in it? Open it. I want to see the treasure." },
      { beat: '{a} opens the little chest. Inside is the tip, rolled up and tied with string.' },
      { by: 'a', say: "It's the tip. Let's go." },
    ] },
    { id: 'cpi2.fd-dn5', when: FD, turns: [
      { beat: '{a} pours a jet of water out of each ear, one after the other.' },
      { by: 'a', say: "I've got water in my ears." },
      { by: 'b', say: "You'll be fine. Come on." },
    ] },
    { id: 'cpi2.fd-dn6', when: FD, turns: [
      { by: 'a', say: "Next time there's a Botch or Watch with water, it's yours." },
      { by: 'b', say: "We'll see what it is first." },
      { by: 'a', say: "No. It's yours. I did this one." },
    ] },
  ],
};

const bobsled = {
  'task-start.any': [
    { id: 'cpi2.bs-s5', when: BS, turns: [
      { beat: '{a} and {b} look at the sled. It\'s painted with flowers, and somebody has written a name on the side: Lightning.' },
      { by: 'b', say: "It's called Lightning." },
      { by: 'a', say: "Let's hope it's fast." },
    ] },
    { id: 'cpi2.bs-s6', when: BS, turns: [
      { by: 'a', say: "Who sits in front?" },
      { by: 'b', say: "You. You're braver than me." },
      { by: 'a', say: "Fine. I'll go in front." },
    ] },
    { id: 'cpi2.bs-s7', when: BS, turns: [
      { beat: 'At the top of the track, an old man with a stopwatch nods at them, raises one finger, and drops it.' },
      { by: 'b', say: "Was that go? Was that a go?" },
      { by: 'a', say: "I think so! Push!" },
    ] },
    { id: 'cpi2.bs-s8', when: BS, turns: [
      { by: 'b', ...V("Helmets on. Chin straps tight. Knees in.", "Helmets. Straps. Knees.", "Helmets.", "Helmets ON! Straps TIGHT! Knees IN!", "Let's get the helmets on, straps tight, and knees tucked in.", "Fold up small, like a deckchair.") },
      { by: 'a', say: "Okay. Okay, I'm ready." },
      { by: 'b', say: "Let's go." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'cpi2.bs-f5', when: BS, turns: [
      { beat: 'Run one: fast. Run two: faster. Run three: so fast {b} screams the whole way down. The total flashes up well under the board.' },
      { by: 'a', say: "Were you screaming the whole way?" },
      { by: 'b', say: "I couldn't help it! We did it, though!" },
    ] },
    { id: 'cpi2.bs-f6', when: BS, turns: [
      { by: 'a', say: "Don't brake. Don't touch anything. Just let it go." },
      { beat: 'They never touch the brake, never lean wrong, and three clean runs add up to a time under the board.' },
      { by: 'b', say: "We did it! We beat the board!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'cpi2.bs-a5', when: BS, turns: [
      { by: 'a', say: "The fast teams all push in step. Left, right, left." },
      { by: 'b', say: "Left, right, left, jump." },
      { beat: 'Left, right, left, jump, three times over, and the new total sneaks under the board.' },
      { by: 'b', say: "That's it! Running in step works!" },
    ] },
    { id: 'cpi2.bs-a6', when: BS, turns: [
      { beat: 'Before the next set, {b} goes along the bottom of the sled with a rag, wiping off the dust and sand from the track.' },
      { by: 'b', say: "It's been sliding on dirt. No wonder it's slow." },
      { beat: 'Clean, the sled slides much faster, and three runs later the total beats the board by a second.' },
      { by: 'a', say: "That's it! It was the dirt the whole time!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'cpi2.bs-t4', when: BS, turns: [
      { beat: 'At the top of the track, {a} and {b} are pushing the sled up the walk-back path, for the third time.' },
      { by: 'a', say: "Nobody said we'd have to carry it back up." },
      { by: 'b', say: "I know. Keep pushing." },
    ] },
    { id: 'cpi2.bs-t5', when: BS, turns: [
      { by: 'b', say: "We were faster on the first run than the third. Why are we getting slower?" },
      { by: 'a', say: "Because we're getting tired." },
      { by: 'b', say: "Then we need to push harder. Come on, one more." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'cpi2.bs-x4', when: BS, turns: [
      { beat: '{a} and {b} both jump in at the same moment, from the same side, and the sled tips over onto the track before it\'s even moving.' },
      { by: 'b', say: "We tipped at the start! Before it even moved!" },
      { by: 'a', say: "Back to the top! New set of three!" },
    ] },
    { id: 'cpi2.bs-x5', when: BS, turns: [
      { beat: 'Two runs are fast, and the third, where they brake on the bottom bend, is not. The total misses by a second.' },
      { by: 'a', say: "One second! We missed it by one second!" },
      { by: 'b', say: "Back up. Again." },
    ] },
  ],
  'task-done.any': [
    { id: 'cpi2.bs-dn4', when: BS, turns: [
      { beat: 'The old man with the stopwatch writes their total on the board in chalk and underlines it twice.' },
      { by: 'a', say: "He underlined it. That's good, right?" },
      { by: 'b', say: "Twice. That's very good." },
    ] },
    { id: 'cpi2.bs-dn5', when: BS, turns: [
      { by: 'b', say: "That was so much fun. I want to do it again." },
      { by: 'a', say: "We're in a race." },
      { by: 'b', say: "I know. Later, then." },
    ] },
    { id: 'cpi2.bs-dn6', when: BS, turns: [
      { by: 'a', say: "My legs are still going round the bends." },
      { by: 'b', say: "My stomach is still at the top." },
      { by: 'a', say: "Me too. Give me a second." },
    ] },
  ],
};

export default mergePools(dive, bobsled);
