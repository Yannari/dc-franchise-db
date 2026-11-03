// Coast Palace, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/coast-palace.js: at the shark, a is in the water and b shouts from
// the boat; at the sand palace, both build and the little surfer boy judges.
import { V, mergePools } from '../_kit.js';

const SH = { taskId: 'shark' };
const SP = { taskId: 'sand-palace' };

const shark = {
  'task-start.any': [
    { id: 'cpl2.sh-s1', when: SH, turns: [
      { beat: '{a} pulls the mask down. It immediately fogs up on the inside.' },
      { by: 'a', say: "I can't see anything." },
      { by: 'b', say: "Spit in it! That's what divers do!" },
      { by: 'a', say: "Okay. Okay. Gross, but okay." },
    ] },
    { id: 'cpl2.sh-s2', when: SH, turns: [
      { by: 'b', say: "Remember, the tip's clipped on. You unclip it. You don't pull." },
      { by: 'a', say: "Unclip it. Okay." },
      { by: 'b', say: "You'll be fine. Just unclip it." },
    ] },
    { id: 'cpl2.sh-s3', when: SH, turns: [
      { beat: '{a} climbs down one rung, then climbs straight back up one rung.' },
      { by: 'b', say: "Come on. You have to go down." },
      { by: 'a', say: "I'm going. I'm going. Give me a second." },
    ] },
    { id: 'cpl2.sh-s4', when: SH, turns: [
      { by: 'a', say: "What do I do if it bumps me?" },
      { by: 'b', say: "It won't. Just stay still." },
      { beat: '{a} lowers into the water, breathing fast.' },
    ] },
  ],
  'task-try.first-try': [
    { id: 'cpl2.sh-f1', when: SH, turns: [
      { beat: 'The fin comes past close enough to touch, and {a} flicks the clip open with two fingers.' },
      { by: 'b', say: "That was so smooth!" },
      { by: 'a', say: "Thank you. Now get me out." },
    ] },
    { id: 'cpl2.sh-f2', when: SH, turns: [
      { by: 'a', say: "I've got it! I've got the tip!" },
      { by: 'b', say: "Get out! Quick!" },
      { beat: '{a} climbs out onto the boat, shaking.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'cpl2.sh-a1', when: SH, turns: [
      { by: 'b', say: "Stop kicking! Every time you kick, it swims wide!" },
      { by: 'a', say: "I'm kicking because I don't want to sink!" },
      { by: 'b', say: "Hold the ladder with one hand and float!" },
      { beat: '{a} hangs off the ladder, completely still. The shark cruises in close, and the tip comes off in {a.posAdj} hand.' },
    ] },
    { id: 'cpl2.sh-a2', when: SH, turns: [
      { beat: 'Four passes in, {a} has stopped screaming and started humming.' },
      { by: 'b', say: "Are you humming?" },
      { by: 'a', say: "It calms me down. Shh. Here it comes." },
      { beat: 'Mid-hum, {a} unclips the tip clean off the fin.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'cpl2.sh-t1', when: SH, turns: [
      { by: 'a', say: "Is it me, or is it getting closer every lap?" },
      { by: 'b', say: "It's getting closer because you keep moving towards it! Then away! Pick one!" },
      { beat: '{a} drifts out from the ladder, then paddles straight back to it.' },
    ] },
    { id: 'cpl2.sh-t2', when: SH, turns: [
      { beat: 'On the boat, {b} is acting out the grab with both hands, over and over.' },
      { by: 'b', say: "Like this! Reach, pinch, pull!" },
      { by: 'a', say: "It's different when it's right there!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'cpl2.sh-x1', when: SH, turns: [
      { beat: '{a} grabs the fin itself instead of the clip. The shark doesn\'t like that, and rolls away.' },
      { by: 'b', say: "The clip! Not the fin! Never the fin!" },
      { by: 'a', say: "They're right next to each other! Okay! Again!" },
    ] },
    { id: 'cpl2.sh-x2', when: SH, turns: [
      { by: 'a', say: "Here it comes. Here it comes. Here it..." },
      { beat: 'It comes, and goes, and {a} is still saying "here it comes."' },
      { by: 'b', say: "That was it! That was the one! Next lap!" },
    ] },
  ],
  'task-done.any': [
    { id: 'cpl2.sh-dn1', when: SH, turns: [
      { beat: '{a} sits on the deck in a towel, staring at the sea.' },
      { by: 'a', say: "I can't believe I did that." },
      { by: 'b', say: "You screamed the whole time." },
      { by: 'a', say: "I know. But I did it." },
    ] },
    { id: 'cpl2.sh-dn2', when: SH, turns: [
      { by: 'b', say: "Next one's on a beach. With sand. No teeth." },
      { by: 'a', say: "Good. I never want to see the sea again." },
      { by: 'b', say: "We'll see. Come on." },
    ] },
    { id: 'cpl2.sh-dn3', when: SH, turns: [
      { beat: 'As the boat turns for shore, the fin follows it for a little while.' },
      { by: 'a', say: "Why is it following us?" },
      { by: 'b', say: "I don't know. Don't look at it. Drive faster." },
    ] },
  ],
};

const palace = {
  'task-start.any': [
    { id: 'cpl2.sp-s1', when: SP, turns: [
      { beat: '{a} holds the photo up against the real palace on the cliff, squinting from one to the other.' },
      { by: 'a', say: "It's smaller in the photo." },
      { by: 'b', say: "It doesn't matter. Ours just has to look like it. Dig." },
    ] },
    { id: 'cpl2.sp-s2', when: SP, turns: [
      { by: 'b', say: "You do walls, I do towers. Nobody touches anybody else's bit." },
      { by: 'a', say: "What about the gardens?" },
      { by: 'b', say: "We'll do the gardens together." },
    ] },
    { id: 'cpl2.sp-s3', when: SP, turns: [
      { beat: 'The little judge walks past, sees their bucket and quietly shakes his head.' },
      { by: 'a', say: "He's already judging us. We haven't even started." },
      { by: 'b', say: "Then let's give him something to look at." },
    ] },
    { id: 'cpl2.sp-s4', when: SP, turns: [
      { by: 'a', say: "How far up is the tide going to come?" },
      { by: 'b', say: "See the line of seaweed? Not past that." },
      { by: 'a', say: "Then we build behind the seaweed." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'cpl2.sp-f1', when: SP, turns: [
      { beat: 'The boy crouches down level with their gate and looks through it, one eye shut, for a long time.' },
      { by: 'a', say: "What's he looking for?" },
      { beat: 'He stands up, nods once, and hands over the tip.' },
      { by: 'b', say: "I don't know. But we got it." },
    ] },
    { id: 'cpl2.sp-f2', when: SP, turns: [
      { by: 'b', say: "We even did the guards. Look, two little guards, out of pebbles." },
      { beat: 'The boy picks up one pebble guard, turns it over, and puts it back exactly where it was. Then he nods.' },
      { by: 'a', say: "He liked the guards!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'cpl2.sp-a1', when: SP, turns: [
      { by: 'a', say: "He keeps pointing at the left tower. What's wrong with the left tower?" },
      { by: 'b', say: "It's leaning. It's been leaning the whole time. I didn't want to say." },
      { beat: '{a} props it straight with a wet fist of sand. The boy walks round once and hands over the tip.' },
    ] },
    { id: 'cpl2.sp-a2', when: SP, turns: [
      { beat: 'The second wave in a row takes their front wall. {b} builds a little wall in front of the wall.' },
      { by: 'b', say: "A wall in front of the wall. For the waves." },
      { by: 'a', say: "That's so smart." },
      { beat: 'The next wave stops dead at the sea wall. The boy nods.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'cpl2.sp-t1', when: SP, turns: [
      { by: 'a', say: "Every time I put a roof on, it falls through the tower." },
      { by: 'b', say: "Palaces don't have flat roofs. Make it pointy." },
      { by: 'a', say: "I can't do pointy! Sand doesn't do pointy!" },
    ] },
    { id: 'cpl2.sp-t2', when: SP, turns: [
      { beat: 'A gust of wind blows sand across the gardens, and flattens them.' },
      { by: 'b', say: "No! The gardens!" },
      { by: 'a', say: "Okay. We'll do them again." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'cpl2.sp-x1', when: SP, turns: [
      { beat: 'The boy counts their towers on his fingers. He holds up five, then points at the photo, which has six.' },
      { by: 'a', say: "We built six. I'm sure we built six." },
      { by: 'b', say: "One fell in. Build it again." },
    ] },
    { id: 'cpl2.sp-x2', when: SP, turns: [
      { by: 'b', say: "What's he saying? He's saying something." },
      { beat: 'The boy points at their gardens and shakes his head.' },
      { by: 'a', say: "Gardens again. Back to the gardens." },
    ] },
  ],
  'task-done.any': [
    { id: 'cpl2.sp-dn1', when: SP, turns: [
      { by: 'a', say: "I've got sand everywhere." },
      { by: 'b', say: "We'll wash it off later." },
      { by: 'a', say: "Not in that sea." },
    ] },
    { id: 'cpl2.sp-dn2', when: SP, turns: [
      { beat: 'As they leave, the boy is already frowning at the palace next door.' },
      { by: 'b', say: "We passed. He was so strict." },
      { by: 'a', say: "Stricter than the shark." },
      { by: 'b', say: "Way scarier than the shark." },
    ] },
    { id: 'cpl2.sp-dn3', when: SP, turns: [
      { by: 'a', say: "I'm going to miss our palace." },
      { by: 'b', say: "It'll be gone by tonight." },
      { by: 'a', say: "I know. I took a picture." },
    ] },
  ],
};

export default mergePools(shark, palace);
