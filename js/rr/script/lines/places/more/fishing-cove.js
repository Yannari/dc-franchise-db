// Fishing Cove, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/fishing-cove.js: both partners drink the vinegar glass, say the
// fisherman's dialect sentence back word for word, and kiss the cod; spit, a wrong word or a flinch starts it again.
import { V, mergePools } from '../_kit.js';

const WR = { taskId: 'welcome-rite' };

const rite = {
  'task-start.any': [
    { id: 'fsc2.wr-s5', when: WR, turns: [
      { beat: 'The fisherman lifts the cod by the tail and lays it on the table with a wet slap, facing {a}.' },
      { by: 'a', say: "Why is it facing me?" },
      { by: 'b', say: "Because it's chosen you." },
      { by: 'a', say: "I didn't enter anything. I didn't sign up to be chosen." },
    ] },
    { id: 'fsc2.wr-s6', when: WR, turns: [
      { by: 'b', say: "Let's split it. You remember the first half of the sentence, I'll remember the end." },
      { by: 'a', say: "We both have to say all of it." },
      { by: 'b', say: "Then we'll whisper our halves to each other really quickly." },
    ] },
    { id: 'fsc2.wr-s7', when: WR, turns: [
      { beat: 'The fisherman pours the glasses right to the brim. The smell reaches {a} and {b} before the glasses do.' },
      { by: 'a', ...V("My eyes are watering. I haven't even picked it up yet.", "My eyes are already watering.", "Eyes. Watering.", "My EYES are watering and I haven't even TOUCHED it!", "My eyes are watering a little, and I haven't even picked it up.", "This drink is crying for me in advance.") },
      { by: 'b', say: "That's the welcome. The welcome is in your eyes." },
    ] },
    { id: 'fsc2.wr-s8', when: WR, turns: [
      { by: 'a', say: "Is the cod fresh? Did he catch it today?" },
      { by: 'b', say: "Does it matter?" },
      { by: 'a', say: "It matters a lot to my mouth." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'fsc2.wr-f5', when: WR, turns: [
      { beat: '{a} and {b} clink glasses, drink at the same moment, put the glasses down at the same moment and make the same face.' },
      { by: 'b', say: "Don't stop. Words. Fish. Go." },
      { beat: 'Sentence, word for word. Fish, full on the lips. The fisherman stands up and shakes both their hands.' },
    ] },
    { id: 'fsc2.wr-f6', when: WR, turns: [
      { by: 'a', say: "I'm just going to say it like my grandpa talks after his dinner." },
      { beat: '{a} says the sentence like a grandpa after dinner, low and grumbly. Every word is right. The fisherman roars with laughter.' },
      { by: 'b', say: "Now kiss the fish like a grandpa." },
      { beat: 'The cod gets a kiss. The fisherman declares them honorary locals.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fsc2.wr-a5', when: WR, turns: [
      { by: 'b', say: "We keep flinching because we're looking at its eyes. So we look at its tail." },
      { by: 'a', say: "How do I kiss the front and look at the back?" },
      { by: 'b', say: "Lean in from the side. Like a film star." },
      { beat: 'Both of them kiss it from the side like film stars, and neither of them flinches. The fisherman pours himself a drink to celebrate.' },
    ] },
    { id: 'fsc2.wr-a6', when: WR, turns: [
      { beat: 'This time {a} makes the fisherman say the sentence three times, and mouths every word along with him.' },
      { by: 'a', say: "Three more times. I'm learning it like a song." },
      { beat: '{a} says it back, perfectly. So does {b}. The glass goes down, the cod gets kissed, and the fisherman thumps the table: locals.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'fsc2.wr-t4', when: WR, turns: [
      { beat: 'Every time the fisherman says the sentence, he says it a little differently. {a} and {b} look at each other.' },
      { by: 'a', say: "That was a different word in the middle that time. Wasn't it?" },
      { by: 'b', say: "I think he's having fun with us." },
    ] },
    { id: 'fsc2.wr-t5', when: WR, turns: [
      { by: 'b', say: "That's my third glass of this." },
      { by: 'a', say: "How do you feel?" },
      { by: 'b', say: "Like a pickled egg." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'fsc2.wr-x4', when: WR, turns: [
      { beat: '{b} gets the sentence word for word and is so happy about it that {b.sub} kiss {a} instead of the cod.' },
      { by: 'a', say: "Not me! The fish!" },
      { by: 'b', say: "Sorry! Sorry! He's shaking his head! From the start!" },
    ] },
    { id: 'fsc2.wr-x5', when: WR, turns: [
      { beat: '{a} gets the glass down, gets the sentence right, and coughs halfway through the cod kiss, straight into the cod.' },
      { by: 'a', say: "Does that count? I was touching it the whole time!" },
      { by: 'b', say: "It doesn't count! New glass! Again!" },
    ] },
  ],
  'task-done.any': [
    { id: 'fsc2.wr-dn4', when: WR, turns: [
      { by: 'a', say: "My lips still taste like the sea. And not the nice part of the sea." },
      { by: 'b', say: "There's a nice part of the sea?" },
      { by: 'a', say: "Not near that cod, there isn't." },
    ] },
    { id: 'fsc2.wr-dn5', when: WR, turns: [
      { beat: 'As {a} and {b} leave, the fisherman waves the cod\'s fin at them from the doorway, like it\'s waving goodbye.' },
      { by: 'b', say: "It's waving." },
      { by: 'a', say: "Don't wave back. If you wave back, he'll want another kiss." },
    ] },
    { id: 'fsc2.wr-dn6', when: WR, turns: [
      { by: 'b', say: "I can say one sentence in the local dialect now. Perfectly." },
      { by: 'a', say: "Which you don't understand." },
      { by: 'b', say: "I'm going to say it at parties anyway." },
    ] },
  ],
};

export default mergePools(rite);
