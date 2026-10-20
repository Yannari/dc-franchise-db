// Outback Farm, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/outback-farm.js: both partners catch ten rabbits in a sack in the
// wheat (a badly tied sack lets them out, and the count goes back to what's still in it); the rare white rabbit is
// worth all ten; the farmer counts.
import { V, mergePools } from '../_kit.js';

const BN = { taskId: 'bunnies' };

const bunnies = {
  'task-start.any': [
    { id: 'obf2.bn-s1', when: BN, turns: [
      { beat: '{a} crouches low in the wheat, holding the sack open like a fishing net.' },
      { by: 'a', say: "I'll just wait here. They'll run in on their own." },
      { by: 'b', say: "Why would a rabbit run into a sack?" },
      { by: 'a', say: "Curiosity. Everyone's curious about a sack." },
    ] },
    { id: 'obf2.bn-s2', when: BN, turns: [
      { by: 'b', say: "They zigzag. So you don't chase where it is. You chase where it's going to zag." },
      { by: 'a', say: "How do I know where it's going to zag?" },
      { by: 'b', say: "You think like a rabbit." },
    ] },
    { id: 'obf2.bn-s3', when: BN, turns: [
      { beat: 'A rabbit sits up on its back legs a few feet from {b}, nose twitching, and stares right at {b.obj}.' },
      { by: 'b', say: "It's looking at me like it knows something." },
      { by: 'a', say: "It knows it's faster than you. Grab it!" },
    ] },
    { id: 'obf2.bn-s4', when: BN, turns: [
      { by: 'a', say: "Hold them by the scruff. Not the ears. The farmer said never the ears." },
      { by: 'b', ...V("Scruff. Got it. Where on a rabbit is the scruff?", "Where's the scruff on a rabbit?", "Where's the scruff?", "SCRUFF! Got it! WHERE is the scruff?", "Scruff, sure. Where exactly is a rabbit's scruff?", "Scruff. Got it. I have never located a scruff.") },
      { by: 'a', say: "The back of the neck. The furry bit. It's all furry bits." },
    ] },
    { id: 'obf2.bn-s5', when: BN, turns: [
      { beat: 'Far off in the wheat, a flash of white. Then it\'s gone.' },
      { by: 'a', say: "Did you see that? The white one!" },
      { by: 'b', say: "Forget the white one. Everybody's chasing the white one. We catch ten boring ones." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'obf2.bn-f1', when: BN, turns: [
      { beat: '{a} lies down flat in the wheat and stays still. One by one, the rabbits hop over to sniff {a.obj}, and one by one, {b} scoops them into the sack.' },
      { by: 'b', say: "Ten! You were bait! You were perfect bait!" },
      { by: 'a', say: "One of them sat on my face." },
    ] },
    { id: 'obf2.bn-f2', when: BN, turns: [
      { by: 'b', say: "Down the hole! It went down the hole! And came out of that hole!" },
      { beat: '{a} is already at the second hole, sack open. The rabbit runs straight in. The farmer, watching, laughs and holds up ten fingers.' },
      { by: 'a', say: "Every rabbit has a back door." },
    ] },
    { id: 'obf2.bn-f3', when: BN, turns: [
      { beat: '{b} walks into the wheat to tie a shoelace and comes back out holding the white rabbit, which was sitting on the shoe.' },
      { by: 'b', say: "It was just there. It was on my foot." },
      { by: 'a', say: "That's all ten! On your foot!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'obf2.bn-a1', when: BN, turns: [
      { by: 'a', say: "They're getting out through the corner of the sack. There's a hole." },
      { by: 'b', say: "Then I hold the corner shut while you fill it." },
      { beat: '{b} holds the corner shut with both fists. Ten rabbits go in, and ten stay in. The farmer counts them and nods.' },
    ] },
    { id: 'obf2.bn-a2', when: BN, turns: [
      { beat: 'After half an hour of diving, {a} gives up running and starts walking slowly, sack open, humming.' },
      { by: 'b', say: "What are you doing?" },
      { by: 'a', say: "Being a calm person who means no harm." },
      { beat: 'The calm person who means no harm walks out of the wheat with ten rabbits.' },
    ] },
    { id: 'obf2.bn-a3', when: BN, turns: [
      { by: 'b', say: "The white one keeps going under that fence. So we wait at the fence." },
      { beat: 'They wait at the fence. It takes eleven minutes. The white rabbit comes under the fence and straight into the sack.' },
      { by: 'a', say: "Patience! All ten! One fluffy one!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'obf2.bn-t1', when: BN, turns: [
      { by: 'a', say: "How many have we got?" },
      { beat: '{b} opens the sack a crack to count. Two rabbits jump straight out.' },
      { by: 'b', say: "Fewer than before I counted." },
    ] },
    { id: 'obf2.bn-t2', when: BN, turns: [
      { beat: '{a} is lying face down in the wheat, breathing hard, covered in seed heads.' },
      { by: 'a', say: "They're not even running from me any more. They're just stepping round me." },
      { by: 'b', say: "That's insulting. Get up and be scary." },
    ] },
    { id: 'obf2.bn-t3', when: BN, turns: [
      { by: 'b', say: "This one's kicking. It's kicking like a little horse." },
      { by: 'a', say: "Hold it against your chest! Calm it down!" },
      { by: 'b', say: "It doesn't want my chest! It wants freedom!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'obf2.bn-x1', when: BN, turns: [
      { beat: '{a} dives on a rabbit, lands on it with the sack, and sits up. The sack is empty. The rabbit is behind {a.obj}, eating.' },
      { by: 'a', say: "How? How is it behind me?" },
      { by: 'b', say: "Doesn't matter! Go again!" },
    ] },
    { id: 'obf2.bn-x2', when: BN, turns: [
      { beat: '{b} hands the sack to the farmer. He looks in, counts, and holds up nine fingers.' },
      { by: 'b', say: "Nine? Somebody escaped on the walk over!" },
      { by: 'a', say: "One more! Back in the wheat!" },
    ] },
    { id: 'obf2.bn-x3', when: BN, turns: [
      { beat: '{a} finally catches the white rabbit. It wriggles once, kicks {a} in the chin, and is gone.' },
      { by: 'a', say: "I had all ten in my hands! All ten!" },
      { by: 'b', say: "And now you've got none! After it!" },
    ] },
  ],
  'task-done.any': [
    { id: 'obf2.bn-dn1', when: BN, turns: [
      { beat: 'The farmer opens the sack at the edge of the field, and all ten rabbits run straight back into his wheat.' },
      { by: 'a', say: "He let them go! Right back into the field!" },
      { by: 'b', say: "That's the next team's problem. Glider." },
    ] },
    { id: 'obf2.bn-dn2', when: BN, turns: [
      { by: 'b', say: "I've got wheat in my teeth." },
      { by: 'a', say: "I've got a rabbit's foot in my pocket." },
      { by: 'b', say: "What? Put it back!" },
      { by: 'a', say: "It's lucky! Joking. It's a seed. It's a big seed." },
    ] },
    { id: 'obf2.bn-dn3', when: BN, turns: [
      { by: 'a', say: "Next is a glider. Over a valley. From a mountain." },
      { by: 'b', say: "After that? I'll fly it myself. I'll fly it with my arms." },
      { by: 'a', say: "Let's take the glider. Just to be safe." },
    ] },
  ],
};

export default mergePools(bunnies);
