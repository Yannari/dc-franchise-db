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
      { beat: '{b} crouches. Both their knees click at the same time.' },
    ] },
    { id: 'mth2.hu-s6', when: HU, turns: [
      { by: 'a', say: "Somebody ran here three thousand years ago. In sandals." },
      { by: 'b', say: "And probably knocked over a hurdle." },
      { by: 'a', say: "They didn't have hurdles. They had rocks." },
    ] },
    { id: 'mth2.hu-s7', when: HU, turns: [
      { beat: '{b} takes a practice run at the first hurdle, stops, and measures it against {b.posAdj} hip.' },
      { by: 'b', say: "It comes up to here. Here is very high." },
      { by: 'a', say: "Lift your knees higher than here." },
    ] },
    { id: 'mth2.hu-s8', when: HU, turns: [
      { by: 'b', ...V("On three. One, two... wait, do we go on three or after three?", "On three or after three?", "On three?", "On THREE! Or AFTER three?", "Do we go on three, or just after three? I'd like to know.", "Three is a number, not a plan.") },
      { by: 'a', say: "On three." },
      { by: 'b', say: "Then I was already late. Start again." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'mth2.hu-f5', when: HU, turns: [
      { beat: 'Ten hurdles, ten jumps, and the two of them land each one with the same slap of feet, like one runner with four legs.' },
      { by: 'b', say: "Look back! Look! They're all still standing!" },
      { by: 'a', say: "I'm not looking back. If I look back, one will fall over just to spite me." },
    ] },
    { id: 'mth2.hu-f6', when: HU, turns: [
      { by: 'a', say: "Hup! Hup! Hup!" },
      { beat: '{a} shouts "hup" at every hurdle, {b} jumps on every "hup", and they cross the finish line with every hurdle standing.' },
      { by: 'b', say: "I'm never going to be able to hear 'hup' again without jumping." },
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
      { by: 'b', say: "Maths! We beat the hurdles with maths!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'mth2.hu-t4', when: HU, turns: [
      { beat: '{a} and {b} walk back to the start line for another run, past a row of hurdles they knocked over last time, all still lying on the track.' },
      { by: 'a', say: "Those are our fault." },
      { by: 'b', say: "Pick them up. They'll know if we don't." },
    ] },
    { id: 'mth2.hu-t5', when: HU, turns: [
      { by: 'b', say: "You jump like you're trying to get over a fence." },
      { by: 'a', say: "It is a fence! A little fence!" },
      { by: 'b', say: "Hurdlers don't climb, they glide!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'mth2.hu-x4', when: HU, turns: [
      { beat: 'They clear the first nine perfectly. On the tenth, {a} lifts a knee too early and the hurdle goes over with a hollow clack.' },
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
      { by: 'a', say: "A tip is a paper medal." },
    ] },
    { id: 'mth2.hu-dn5', when: HU, turns: [
      { beat: 'At the end of the track, {a} turns and bows to the empty marble seats.' },
      { by: 'b', say: "Who are you bowing to?" },
      { by: 'a', say: "The ancient crowd. They're very quiet, but they loved it." },
    ] },
    { id: 'mth2.hu-dn6', when: HU, turns: [
      { by: 'b', say: "My knees are older than this stadium now." },
      { by: 'a', say: "Your knees were already older than this stadium." },
      { by: 'b', say: "And now they're older still." },
    ] },
  ],
};

const highJump = {
  'task-start.any': [
    { id: 'mth2.hj-s5', when: HJ, turns: [
      { beat: '{a} walks right up to the bar and stands under it, looking up at it from below.' },
      { by: 'a', say: "From here it looks like a ceiling." },
      { by: 'b', say: "Don't stand under it. You'll get ideas." },
    ] },
    { id: 'mth2.hj-s6', when: HJ, turns: [
      { by: 'b', say: "Curve your run-up. The good jumpers come in on a curve." },
      { by: 'a', say: "I can't even run in a straight line." },
      { by: 'b', say: "Then you're halfway to a curve." },
    ] },
    { id: 'mth2.hj-s7', when: HJ, turns: [
      { beat: '{a} bounces on the spot, shakes out both arms, and does a little hop to warm up. The hop is very small.' },
      { by: 'a', say: "That was a warm-up hop. The real one's bigger." },
      { by: 'b', say: "Much bigger. Please." },
    ] },
    { id: 'mth2.hj-s8', when: HJ, turns: [
      { by: 'a', say: "Any way I like? So I could just climb over it?" },
      { by: 'b', say: "Without touching it." },
      { by: 'a', say: "Climbing without touching. That's just jumping again." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'mth2.hj-f5', when: HJ, turns: [
      { beat: '{a} runs in on a long curve, plants a foot, and goes up and over the bar backwards, like {a.sub} have been doing it for years.' },
      { by: 'b', say: "Where did that come from?" },
      { by: 'a', say: "Fear. Pure fear. It's very springy." },
    ] },
    { id: 'mth2.hj-f6', when: HJ, turns: [
      { by: 'b', say: "Pretend the bar is a snake. Get over the snake." },
      { beat: '{a} runs at the snake, leaps it with a squeal, and lands on the mat. The bar stays where it is.' },
      { by: 'a', say: "Never tell me it's a snake again. But it worked." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'mth2.hj-a5', when: HJ, turns: [
      { by: 'b', say: "You're jumping forwards and hitting it with your bottom. Turn round. Go over backwards, bottom up." },
      { by: 'a', say: "Bottom up." },
      { beat: '{a} turns, jumps, throws {a.posAdj} hips at the sky, and clears the bar with room to spare.' },
      { by: 'b', say: "Bottom up! Words to live by!" },
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
      { by: 'a', say: "I've made a path. I've made a path to failure." },
      { by: 'b', say: "Make it a path to the bar and over it." },
    ] },
    { id: 'mth2.hj-t5', when: HJ, turns: [
      { by: 'b', say: "You keep looking at the mat. Look at the bar. The mat isn't going anywhere." },
      { by: 'a', say: "The mat's soft. The mat's my friend." },
      { by: 'b', say: "The bar is your enemy! Look at your enemy!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'mth2.hj-x4', when: HJ, turns: [
      { beat: '{a} clears the bar, lands, punches the air, and the bar wobbles off its pegs and drops onto {a}\'s head.' },
      { by: 'a', say: "It waited! It waited until I was celebrating!" },
      { by: 'b', say: "That counts! Back up! Again!" },
    ] },
    { id: 'mth2.hj-x5', when: HJ, turns: [
      { beat: '{a} takes off on the wrong foot, turns halfway through the jump, and lands sitting on the bar like a swing.' },
      { by: 'a', say: "I'm on it. Does on it count?" },
      { by: 'b', say: "On isn't over! Off you get! Again!" },
    ] },
  ],
  'task-done.any': [
    { id: 'mth2.hj-dn4', when: HJ, turns: [
      { by: 'a', say: "How high was it? Really?" },
      { by: 'b', say: "Higher than your head." },
      { by: 'a', say: "I jumped over my own head. Tell everyone." },
    ] },
    { id: 'mth2.hj-dn5', when: HJ, turns: [
      { beat: '{a} rolls off the landing mat and lies on the warm marble beside it, arms out.' },
      { by: 'b', say: "Up. There's a Don Box waiting." },
      { by: 'a', say: "Tell it I'll be there in a minute." },
    ] },
    { id: 'mth2.hj-dn6', when: HJ, turns: [
      { by: 'b', say: "That looked so good from the side. Like a real athlete." },
      { by: 'a', say: "From the inside it felt like falling up some stairs." },
      { by: 'b', say: "Nobody saw the inside." },
    ] },
  ],
};

const games = {
  'task-start.any': [
    { id: 'mth2.ag-s5', when: CH, turns: [
      { beat: 'The chariot is tiny, just a little wooden tub on two wheels. {b} steps into the back and it tips forward onto the horses.' },
      { by: 'b', say: "Is there a seat? Where's the seat?" },
      { by: 'a', say: "You stand. Charioteers stand. Hold on to the sides." },
    ] },
    { id: 'mth2.ag-s6', when: CH, turns: [
      { by: 'a', say: "Which horse is which? I need to know their names." },
      { by: 'b', say: "Left horse and right horse." },
      { by: 'a', say: "Hello, Left. Hello, Right. Please don't kill us." },
    ] },
    { id: 'mth2.ag-s7', when: WR, turns: [
      { beat: 'The champion rubs oil on his arms, then holds the bottle out to {a}, politely.' },
      { by: 'a', say: "Do I want to be oily?" },
      { by: 'b', say: "If he's oily and you're not, he can hold you and you can't hold him." },
      { by: 'a', say: "Pass the oil." },
    ] },
    { id: 'mth2.ag-s8', when: WR, turns: [
      { by: 'b', ...V("Three out of five. You can lose twice and still win.", "You can lose twice.", "Lose two, win three.", "You can LOSE twice and still WIN!", "It's three out of five, so you can lose twice and still win.", "You have two free failures. Spend them wisely.") },
      { by: 'a', say: "I'd rather not lose any times." },
      { by: 'b', say: "That's the dream. Go and live it." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'mth2.ag-f5', when: CH, turns: [
      { beat: '{a} shakes the reins once, the horses settle into a smooth trot, and the chariot rolls all the way round the lap on both wheels.' },
      { by: 'b', say: "We didn't even wobble! Did you see? Not a wobble!" },
      { by: 'a', say: "I've never driven anything with a face before. It's easier." },
    ] },
    { id: 'mth2.ag-f6', when: WR, turns: [
      { beat: '{a} grabs the champion round the middle and simply refuses to let go. The champion, confused, steps backwards out of the circle. Three times.' },
      { by: 'b', say: "You hugged him out of the circle!" },
      { by: 'a', say: "He didn't know what to do with a hug! Nobody hugs him!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'mth2.ag-a5', when: CH, turns: [
      { by: 'b', say: "You keep pulling both reins at once and the horses stop dead. Pull one, they turn. Pull both, they stop." },
      { by: 'a', say: "One turns, both stops." },
      { beat: 'One rein for the corners, no rein on the straights, and the chariot comes home on both wheels.' },
      { by: 'b', say: "You've learned to speak horse!" },
    ] },
    { id: 'mth2.ag-a6', when: WR, turns: [
      { beat: 'Two falls down, {a} drops to the sand, grabs the champion\'s ankle and refuses to let go. He hops out of the circle trying to shake {a} off.' },
      { by: 'a', say: "One! Do it again!" },
      { beat: 'Ankle, hop, out of the circle. And again. Three falls, and the champion hands over the wreath, still hopping.' },
      { by: 'b', say: "The ankle! Nobody guards the ankle!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'mth2.ag-t4', when: CH, turns: [
      { beat: 'The horses have decided to go round the lap the other way, and the chariot is being dragged backwards round the first corner.' },
      { by: 'b', say: "We're going backwards! Does backwards count?" },
      { by: 'a', say: "I don't know how to tell them which way's forwards!" },
    ] },
    { id: 'mth2.ag-t5', when: WR, turns: [
      { beat: 'The champion has {a} in a headlock. A very gentle, very firm headlock.' },
      { by: 'a', say: "This is fine. I'm thinking." },
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
      { beat: '{a} runs at the champion, who steps aside like a bullfighter. {a} runs straight on, out of the circle, on {a.posAdj} own.' },
      { by: 'a', say: "I pushed myself out! He didn't even touch me!" },
      { by: 'b', say: "That's a fall! Go again!" },
    ] },
  ],
  'task-done.any': [
    { id: 'mth2.ag-dn4', when: CH, turns: [
      { beat: '{a} climbs down from the chariot and pats each horse on the neck. Right horse nibbles {a}\'s sleeve.' },
      { by: 'a', say: "Right likes me." },
      { by: 'b', say: "Right is eating you. Come on." },
    ] },
    { id: 'mth2.ag-dn5', when: WR, turns: [
      { by: 'a', say: "I'm covered in sand and somebody else's oil." },
      { by: 'b', say: "And a laurel wreath." },
      { by: 'a', say: "The wreath makes it worth it. Mostly." },
    ] },
    { id: 'mth2.ag-dn6', when: AG, turns: [
      { beat: '{b} straightens the laurel wreath on {a}\'s head as they walk away from the temple columns.' },
      { by: 'b', say: "There. Now you look like a statue." },
      { by: 'a', say: "Good. I feel like one. I can't move my legs." },
    ] },
  ],
};

export default mergePools(hurdles, highJump, games);
