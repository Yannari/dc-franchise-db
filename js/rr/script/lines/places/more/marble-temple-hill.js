// Marble Temple Hill, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/marble-temple-hill.js: both run the ten hurdles side by side; at the
// high jump, a jumps and b watches; the ancient games are an Either/Or (a drives the chariot with b holding on in the
// back, or a wrestles the champion in the sand circle), so their lines gate on the side.
import { V, mergePools } from '../_kit.js';

const HU = { taskId: 'hurdles' };
const HJ = { taskId: 'high-jump' };
const AG = { taskId: 'ancient-games' };
const CH = { taskId: 'ancient-games', side: 'chariot' };
const WR = { taskId: 'ancient-games', side: 'wrestle' };

const hurdles = {
  'task-start.any': [
    { id: 'mth2.hu-s5', when: HU, turns: [
      { beat: '{a} crouches in a sprinter\'s start, fingers on the old marble line. {b} just stands there.' },
      { by: 'b', say: "We have to go together. You can't do a sprinter's start on your own." },
      { by: 'a', say: "Then crouch with me." },
      { beat: '{b} crouches down beside {a}.' },
    ] },
    { id: 'mth2.hu-s6', when: HU, turns: [
      { by: 'a', say: "Somebody ran here three thousand years ago. In sandals." },
      { by: 'b', say: "And they were faster than us." },
      { by: 'a', say: "Let's not think about that." },
    ] },
    { id: 'mth2.hu-s7', when: HU, turns: [
      { beat: '{b} takes a practice run at the first hurdle, stops, and measures it against {b.posAdj} hip.' },
      { by: 'b', say: "It comes up to here. That's so high." },
      { by: 'a', say: "Then lift your knees higher." },
    ] },
    { id: 'mth2.hu-s8', when: HU, turns: [
      { by: 'b', ...V("On three. One, two... wait, do we go on three or after three?", "On three or after three?", "On three?", "On THREE! Or AFTER three?", "Do we go on three, or just after three? I'd like to know.", "Three is a number, not a plan.") },
      { by: 'a', say: "On three." },
      { by: 'b', say: "Okay. Start again." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'mth2.hu-f5', when: HU, turns: [
      { beat: 'Ten hurdles, ten jumps, and the two of them land each one at exactly the same moment.' },
      { by: 'b', say: "Look back! Look! They're all still standing!" },
      { by: 'a', say: "I'm not looking back. Don't jinx it." },
    ] },
    { id: 'mth2.hu-f6', when: HU, turns: [
      { by: 'a', say: "Hup! Hup! Hup!" },
      { beat: '{a} shouts "hup" at every hurdle, {b} jumps on every "hup", and they cross the finish line with every hurdle standing.' },
      { by: 'b', say: "That really worked." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'mth2.hu-a5', when: HU, turns: [
      { by: 'b', say: "We jump too close to them. Take off further back. A whole step further back." },
      { by: 'a', say: "Then we'll land on them." },
      { by: 'b', say: "No, then we'll clear them. Trust me." },
      { beat: 'A step further back, and ten hurdles go by untouched. They cross the line side by side.' },
    ] },
    { id: 'mth2.hu-a6', when: HU, turns: [
      { beat: 'This time {a} and {b} walk the whole track first, counting out loud between every hurdle, then run it back to the start and go.' },
      { by: 'a', say: "Five, jump, five, jump, five, jump!" },
      { beat: 'Five steps, jump, all the way down, and every hurdle is still standing at the end.' },
      { by: 'b', say: "It worked! Counting worked!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'mth2.hu-t4', when: HU, turns: [
      { beat: '{a} and {b} walk back to the start line for another run, past a row of hurdles they knocked over last time, all still lying on the track.' },
      { by: 'a', say: "Those are our fault." },
      { by: 'b', say: "Pick them up. Come on." },
    ] },
    { id: 'mth2.hu-t5', when: HU, turns: [
      { by: 'b', say: "You jump like you're trying to get over a fence." },
      { by: 'a', say: "It is a fence!" },
      { by: 'b', say: "Just jump it! Don't climb it!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'mth2.hu-x4', when: HU, turns: [
      { beat: 'They clear the first nine perfectly. On the tenth, {a} lifts a knee too early and the hurdle goes over.' },
      { by: 'a', say: "Nine! We had nine!" },
      { by: 'b', say: "Nine isn't ten. Back to the start." },
    ] },
    { id: 'mth2.hu-x5', when: HU, turns: [
      { beat: '{a} and {b} land a hurdle at the same moment, drift into each other and go down together, with the hurdle under them.' },
      { by: 'b', say: "Your lane is over there!" },
      { by: 'a', say: "There are no lanes! Back to the start!" },
    ] },
  ],
  'task-done.any': [
    { id: 'mth2.hu-dn4', when: HU, turns: [
      { by: 'a', say: "Is there a medal? Do we get a medal?" },
      { by: 'b', say: "We get a tip." },
      { by: 'a', say: "That's still something." },
    ] },
    { id: 'mth2.hu-dn5', when: HU, turns: [
      { beat: 'At the end of the track, {a} turns and bows to the empty marble seats.' },
      { by: 'b', say: "Who are you bowing to?" },
      { by: 'a', say: "I don't know. It felt right." },
    ] },
    { id: 'mth2.hu-dn6', when: HU, turns: [
      { by: 'b', say: "My knees are killing me." },
      { by: 'a', say: "Mine too." },
      { by: 'b', say: "Come on. Nearly done." },
    ] },
  ],
};

const highJump = {
  'task-start.any': [
    { id: 'mth2.hj-s5', when: HJ, turns: [
      { beat: '{a} walks right up to the bar and stands under it, looking up at it from below.' },
      { by: 'a', say: "It's so high from here." },
      { by: 'b', say: "Don't look at it from there." },
    ] },
    { id: 'mth2.hj-s6', when: HJ, turns: [
      { by: 'b', say: "Curve your run-up. The good jumpers come in on a curve." },
      { by: 'a', say: "I can't even run in a straight line." },
      { by: 'b', say: "Then just try." },
    ] },
    { id: 'mth2.hj-s7', when: HJ, turns: [
      { beat: '{a} bounces on the spot, shakes out both arms, and does a little hop to warm up.' },
      { by: 'a', say: "That was just a warm-up." },
      { by: 'b', say: "Okay. Go." },
    ] },
    { id: 'mth2.hj-s8', when: HJ, turns: [
      { by: 'a', say: "Any way I like? So I could just climb over it?" },
      { by: 'b', say: "Without touching it." },
      { by: 'a', say: "Okay. Jumping it is." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'mth2.hj-f5', when: HJ, turns: [
      { beat: '{a} runs in on a long curve, plants a foot, and goes up and over the bar backwards.' },
      { by: 'b', say: "Where did that come from?" },
      { by: 'a', say: "I don't know. I just went for it." },
    ] },
    { id: 'mth2.hj-f6', when: HJ, turns: [
      { by: 'b', say: "Don't think. Just jump." },
      { beat: '{a} runs at the bar, leaps it with a squeal, and lands on the mat. The bar stays where it is.' },
      { by: 'a', say: "I did it! It stayed up!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'mth2.hj-a5', when: HJ, turns: [
      { by: 'b', say: "You're jumping forwards and hitting it. Go over backwards. Push your hips up." },
      { by: 'a', say: "Hips up. Okay." },
      { beat: '{a} turns, jumps, throws {a.posAdj} hips at the sky, and clears the bar with room to spare.' },
      { by: 'b', say: "That's it! That was perfect!" },
    ] },
    { id: 'mth2.hj-a6', when: HJ, turns: [
      { beat: 'After two knocks, {a} marks a take-off spot in the sand with {a.posAdj} heel, a long stride from the bar.' },
      { by: 'a', say: "I've been taking off too close. I've been jumping into it." },
      { beat: 'From the mark, {a} goes up early, goes up high, and comes down on the mat with the bar untouched.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'mth2.hj-t4', when: HJ, turns: [
      { beat: '{a} has run at the bar so many times that the run-up is worn into a little path.' },
      { by: 'a', say: "I've run up here so many times." },
      { by: 'b', say: "Then this is the time you go over it." },
    ] },
    { id: 'mth2.hj-t5', when: HJ, turns: [
      { by: 'b', say: "You keep looking at the mat. Look at the bar. The mat isn't going anywhere." },
      { by: 'a', say: "I'm scared of the bar." },
      { by: 'b', say: "Look at the bar! Not the mat!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'mth2.hj-x4', when: HJ, turns: [
      { beat: '{a} clears the bar, lands, punches the air, and the bar wobbles off its pegs and drops onto {a}\'s head.' },
      { by: 'a', say: "No! I'd already cleared it!" },
      { by: 'b', say: "That counts! Back up! Again!" },
    ] },
    { id: 'mth2.hj-x5', when: HJ, turns: [
      { beat: '{a} takes off on the wrong foot, turns halfway through the jump, and lands right on the bar.' },
      { by: 'a', say: "Does that count?" },
      { by: 'b', say: "No! Again!" },
    ] },
  ],
  'task-done.any': [
    { id: 'mth2.hj-dn4', when: HJ, turns: [
      { by: 'a', say: "How high was it? Really?" },
      { by: 'b', say: "Higher than your head." },
      { by: 'a', say: "I jumped higher than my own head." },
    ] },
    { id: 'mth2.hj-dn5', when: HJ, turns: [
      { beat: '{a} rolls off the landing mat and lies on the warm marble beside it, arms out.' },
      { by: 'b', say: "Up. There's a Don Box waiting." },
      { by: 'a', say: "One minute. Please." },
    ] },
    { id: 'mth2.hj-dn6', when: HJ, turns: [
      { by: 'b', say: "That looked so good from the side. Like a real athlete." },
      { by: 'a', say: "It didn't feel like it." },
      { by: 'b', say: "It looked great. Trust me." },
    ] },
  ],
};

const games = {
  'task-start.any': [
    { id: 'mth2.ag-s5', when: CH, turns: [
      { beat: 'The chariot is tiny, just a little wooden tub on two wheels. {b} steps into the back and it rocks forward.' },
      { by: 'b', say: "Is there a seat? Where's the seat?" },
      { by: 'a', say: "You stand. Charioteers stand. Hold on to the sides." },
    ] },
    { id: 'mth2.ag-s6', when: CH, turns: [
      { by: 'a', say: "Do they have names?" },
      { by: 'b', say: "I don't know. Just drive." },
      { by: 'a', say: "Okay. Easy, boys. Please be nice." },
    ] },
    { id: 'mth2.ag-s7', when: WR, turns: [
      { beat: 'The champion rubs oil on his arms, then holds the bottle out to {a}.' },
      { by: 'a', say: "Do I want to be oily?" },
      { by: 'b', say: "If he's oily and you're not, he can hold you and you can't hold him." },
      { by: 'a', say: "Pass the oil." },
    ] },
    { id: 'mth2.ag-s8', when: WR, turns: [
      { by: 'b', ...V("Three out of five. You can lose twice and still win.", "You can lose twice.", "Lose two, win three.", "You can LOSE twice and still WIN!", "It's three out of five, so you can lose twice and still win.", "You have two free failures. Spend them wisely.") },
      { by: 'a', say: "I'd rather not lose any times." },
      { by: 'b', say: "Then don't lose any. Go." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'mth2.ag-f5', when: CH, turns: [
      { beat: '{a} shakes the reins once, the horses settle into a smooth trot, and the chariot rolls all the way round the lap on both wheels.' },
      { by: 'b', say: "We didn't even wobble! Did you see? Not a wobble!" },
      { by: 'a', say: "I can't believe we didn't tip." },
    ] },
    { id: 'mth2.ag-f6', when: WR, turns: [
      { beat: '{a} grabs the champion round the middle and won\'t let go, and the champion steps backwards out of the circle. Three times.' },
      { by: 'b', say: "You pushed him out! Three times!" },
      { by: 'a', say: "He didn't know what to do!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'mth2.ag-a5', when: CH, turns: [
      { by: 'b', say: "You keep pulling both reins at once and the horses stop dead. Pull one, they turn. Pull both, they stop." },
      { by: 'a', say: "One turns, both stops." },
      { beat: 'One rein for the corners, no rein on the straights, and the chariot comes home on both wheels.' },
      { by: 'b', say: "You've got the hang of it!" },
    ] },
    { id: 'mth2.ag-a6', when: WR, turns: [
      { beat: 'Two falls down, {a} drops to the sand, grabs the champion\'s ankle and won\'t let go. He hops out of the circle trying to shake {a} off.' },
      { by: 'a', say: "One! Do it again!" },
      { beat: 'The ankle again, and again. Three falls, and the champion hands over the wreath, laughing.' },
      { by: 'b', say: "The ankle! That was so smart!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'mth2.ag-t4', when: CH, turns: [
      { beat: 'The horses have decided to go round the lap the other way, and the chariot is being dragged backwards round the first corner.' },
      { by: 'b', say: "We're going the wrong way!" },
      { by: 'a', say: "I don't know how to tell them which way's forwards!" },
    ] },
    { id: 'mth2.ag-t5', when: WR, turns: [
      { beat: 'The champion has {a} in a headlock.' },
      { by: 'a', say: "Hang on. I'm thinking." },
      { by: 'b', say: "Think faster! He's walking you to the edge!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'mth2.ag-x4', when: CH, turns: [
      { beat: 'Halfway round the lap, {b} loses grip in the back and slides out of the chariot into the sand. The horses don\'t notice.' },
      { by: 'b', say: "I fell out! Stop! You've lost me!" },
      { by: 'a', say: "You have to be in it! Back to the start!" },
    ] },
    { id: 'mth2.ag-x5', when: WR, turns: [
      { beat: '{a} runs at the champion, who steps aside. {a} runs straight on, out of the circle.' },
      { by: 'a', say: "I pushed myself out! He didn't even touch me!" },
      { by: 'b', say: "That's a fall! Go again!" },
    ] },
  ],
  'task-done.any': [
    { id: 'mth2.ag-dn4', when: CH, turns: [
      { beat: '{a} climbs down from the chariot and pats each horse on the neck. One of them nibbles {a}\'s sleeve.' },
      { by: 'a', say: "It likes me." },
      { by: 'b', say: "It's eating your sleeve. Come on." },
    ] },
    { id: 'mth2.ag-dn5', when: WR, turns: [
      { by: 'a', say: "I'm covered in sand and somebody else's oil." },
      { by: 'b', say: "And a laurel wreath." },
      { by: 'a', say: "It was worth it." },
    ] },
    { id: 'mth2.ag-dn6', when: AG, turns: [
      { beat: '{b} straightens the laurel wreath on {a}\'s head as they walk away from the temple columns.' },
      { by: 'b', say: "There. Perfect." },
      { by: 'a', say: "I can barely move my legs." },
    ] },
  ],
};

export default mergePools(hurdles, highJump, games);
