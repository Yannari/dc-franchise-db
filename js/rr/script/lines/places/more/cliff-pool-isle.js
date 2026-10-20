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
      { beat: '{a} peers over the edge. Far below, the lagoon is a small green coin with foam round it.' },
      { by: 'a', say: "From up here it looks like a puddle." },
      { by: 'b', say: "It's a big puddle. A deep puddle." },
      { by: 'a', say: "Puddles aren't deep. That's what makes them puddles." },
    ] },
    { id: 'cpi2.fd-s6', when: FD, turns: [
      { by: 'b', say: "Shoes off, or shoes on?" },
      { by: 'a', say: "On for the jump. Then I'll want them for the cliff." },
      { by: 'b', say: "You'll want them for about a second, and then they'll be full of water." },
    ] },
    { id: 'cpi2.fd-s7', when: FD, turns: [
      { beat: 'A local kid runs past {a}, jumps off the falls without stopping, and waves from the water.' },
      { by: 'b', say: "That child just did it. Without even looking." },
      { by: 'a', say: "That child doesn't have anything to lose." },
    ] },
    { id: 'cpi2.fd-s8', when: FD, turns: [
      { by: 'a', ...V("If I don't come up, tell everyone I was brave.", "If I don't come up, say I was brave.", "Say I was brave.", "If I don't COME UP, tell them I was BRAVE!", "If I don't come up, please tell everyone I was brave about it.", "If the lagoon keeps me, I want a statue.") },
      { by: 'b', say: "You'll come up. You float. You float in the bath." },
      { by: 'a', say: "This isn't a bath." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'cpi2.fd-f5', when: FD, turns: [
      { beat: '{a} jumps, hits the water like a pencil, and comes up a breath later with a little chest held over {a.posAdj} head.' },
      { by: 'b', say: "Already? You were down there two seconds!" },
      { by: 'a', say: "It was right under me. I landed on it." },
      { beat: 'The climb up the path is careful and slow, and the chest goes down at {b}\'s feet.' },
    ] },
    { id: 'cpi2.fd-f6', when: FD, turns: [
      { by: 'b', say: "Wait. Look. The sun's on the water. You can see the bottom." },
      { beat: '{a} waits for the sun, sees a little brass lock glinting, jumps straight at it, and comes up with the chest.' },
      { by: 'a', say: "The sun's on our side!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'cpi2.fd-a5', when: FD, turns: [
      { by: 'b', say: "You keep coming up for air too early. Take a big breath at the top. Big. Bigger." },
      { beat: '{a} takes the biggest breath of {a.posAdj} life, jumps, stays down twice as long, and comes up clutching a chest.' },
      { by: 'a', say: "I could have stayed down there all day!" },
      { beat: 'Then the slow climb, the last step, and the chest set down at the top of the falls.' },
    ] },
    { id: 'cpi2.fd-a6', when: FD, turns: [
      { beat: 'This time {a} tucks the chest inside {a.posAdj} shirt for the climb, both hands free for the rocks.' },
      { by: 'a', say: "Hands for climbing. Shirt for treasure." },
      { beat: 'Every handhold, every step, and the chest stays in the shirt all the way to the top.' },
      { by: 'b', say: "You look pregnant with treasure. I love it." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'cpi2.fd-t4', when: FD, turns: [
      { beat: '{a} is halfway up the cliff path, chest under one arm, and has stopped on a ledge to breathe.' },
      { by: 'a', say: "Who made this path? Who decided this was a path?" },
      { by: 'b', say: "Keep coming! You're more than halfway!" },
    ] },
    { id: 'cpi2.fd-t5', when: FD, turns: [
      { by: 'b', say: "You've been down there a long time. Come up." },
      { beat: 'Bubbles. Then nothing. Then more bubbles. Then {a}, without a chest.' },
      { by: 'a', say: "There's an eel! Nobody mentioned an eel!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'cpi2.fd-x4', when: FD, turns: [
      { beat: '{a} comes up with a chest, opens it to check, and it\'s full of nothing but sand. It\'s not one of the treasure chests at all.' },
      { by: 'a', say: "That's somebody's lunchbox!" },
      { by: 'b', say: "Leave it! Back up and jump again!" },
    ] },
    { id: 'cpi2.fd-x5', when: FD, turns: [
      { beat: '{a} gets to the very top of the path, reaches up to hand {b} the chest, and it slips out of both their hands and over the edge.' },
      { by: 'b', say: "That was both of us! That was both of us!" },
      { by: 'a', say: "It was mostly you! Back to the edge!" },
    ] },
  ],
  'task-done.any': [
    { id: 'cpi2.fd-dn4', when: FD, turns: [
      { by: 'b', say: "What's in it? Open it. I want to see the treasure." },
      { beat: '{a} opens the little chest. Inside is the tip, rolled up and tied with string, and one small, unhappy crab.' },
      { by: 'a', say: "The crab can stay here." },
    ] },
    { id: 'cpi2.fd-dn5', when: FD, turns: [
      { beat: '{a} pours a jet of water out of each ear, one after the other.' },
      { by: 'a', say: "I can hear the waterfall inside my head." },
      { by: 'b', say: "That's the actual waterfall. It's right there." },
    ] },
    { id: 'cpi2.fd-dn6', when: FD, turns: [
      { by: 'a', say: "Next time there's a Botch or Watch with water, it's yours." },
      { by: 'b', say: "We'll see what it is first." },
      { by: 'a', say: "You'll see what it is from the top of a waterfall." },
    ] },
  ],
};

const bobsled = {
  'task-start.any': [
    { id: 'cpi2.bs-s5', when: BS, turns: [
      { beat: '{a} and {b} look at the sled. It\'s painted with flowers, and somebody has written a name on the side: Lightning.' },
      { by: 'b', say: "It's called Lightning." },
      { by: 'a', say: "Then it had better go like it." },
    ] },
    { id: 'cpi2.bs-s6', when: BS, turns: [
      { by: 'a', say: "Who sits in front?" },
      { by: 'b', say: "Whoever's least scared of seeing it coming." },
      { by: 'a', say: "Then nobody sits in front." },
    ] },
    { id: 'cpi2.bs-s7', when: BS, turns: [
      { beat: 'At the top of the track, an old man with a stopwatch nods at them, raises one finger, and drops it.' },
      { by: 'b', say: "Was that go? Was that a go?" },
      { by: 'a', say: "Everything's a go! Push!" },
    ] },
    { id: 'cpi2.bs-s8', when: BS, turns: [
      { by: 'b', ...V("Helmets on. Chin straps tight. Knees in.", "Helmets. Straps. Knees.", "Helmets.", "Helmets ON! Straps TIGHT! Knees IN!", "Let's get the helmets on, straps tight, and knees tucked in.", "Fold up small, like a deckchair.") },
      { by: 'a', say: "My knees don't go in that far." },
      { by: 'b', say: "They do today." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'cpi2.bs-f5', when: BS, turns: [
      { beat: 'Run one: fast. Run two: faster. Run three: so fast {b} screams the whole way down. The total flashes up well under the board.' },
      { by: 'a', say: "Were you screaming the whole way?" },
      { by: 'b', say: "I was screaming in a fast way. It helped." },
    ] },
    { id: 'cpi2.bs-f6', when: BS, turns: [
      { by: 'a', say: "Don't brake. Don't touch anything. Just let it go." },
      { beat: 'They never touch the brake, never lean wrong, and three clean runs add up to a time under the board.' },
      { by: 'b', say: "We didn't do anything and we won!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'cpi2.bs-a5', when: BS, turns: [
      { by: 'a', say: "The fast teams all run the push in step. Left, right, left. Like soldiers." },
      { by: 'b', say: "Left, right, left, jump." },
      { beat: 'Left, right, left, jump, three times over, and the new total sneaks under the board.' },
      { by: 'b', say: "Soldiers! We're sled soldiers!" },
    ] },
    { id: 'cpi2.bs-a6', when: BS, turns: [
      { beat: 'Before the next set, {b} goes along the bottom of the sled with a rag, wiping off the dust and sand from the track.' },
      { by: 'b', say: "It's been sliding on dirt. No wonder it's slow." },
      { beat: 'Clean, the sled slides like soap, and three runs later the total beats the board by a second.' },
      { by: 'a', say: "A rag! We beat the board with a rag!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'cpi2.bs-t4', when: BS, turns: [
      { beat: 'At the top of the track, {a} and {b} are pushing the sled up the walk-back path, for the third time.' },
      { by: 'a', say: "Nobody said we'd have to carry it back up." },
      { by: 'b', say: "Nobody said a lot of things." },
    ] },
    { id: 'cpi2.bs-t5', when: BS, turns: [
      { by: 'b', say: "We were faster on the first run than the third. Why are we getting slower?" },
      { by: 'a', say: "Because we're getting tired." },
      { by: 'b', say: "The sled isn't tired! The sled should be getting faster!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'cpi2.bs-x4', when: BS, turns: [
      { beat: '{a} and {b} both jump in at the same moment, from the same side, and the sled tips over onto the track before it\'s even moving.' },
      { by: 'b', say: "We tipped at the start! That's a new low!" },
      { by: 'a', say: "Back to the top! New set of three!" },
    ] },
    { id: 'cpi2.bs-x5', when: BS, turns: [
      { beat: 'Two runs are fast, and the third, with a goat standing on the track at the bottom bend, is not. The total misses by a second.' },
      { by: 'a', say: "A goat! Who lets a goat on a bobsled track?" },
      { by: 'b', say: "This island! Back up! Again!" },
    ] },
  ],
  'task-done.any': [
    { id: 'cpi2.bs-dn4', when: BS, turns: [
      { beat: 'The old man with the stopwatch writes their total on the board in chalk and underlines it twice.' },
      { by: 'a', say: "He underlined it. That's good, right?" },
      { by: 'b', say: "Twice. That's very good." },
    ] },
    { id: 'cpi2.bs-dn5', when: BS, turns: [
      { by: 'b', say: "I want to go home and build one of those in our garden." },
      { by: 'a', say: "Our garden's flat." },
      { by: 'b', say: "Then we'll build it on the stairs." },
    ] },
    { id: 'cpi2.bs-dn6', when: BS, turns: [
      { by: 'a', say: "My legs are still going round the bends." },
      { by: 'b', say: "My stomach is still at the top." },
      { by: 'a', say: "Somebody should go back up and get it." },
    ] },
  ],
};

export default mergePools(dive, bobsled);
