// Jungle Ruins, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/jungle-ruins.js: both follow the painted stones over the piranha
// log and past the caterpillars to the ruins; then both pick idols out of the carved wall until the old guide's coin
// scratches real gold.
import { V, mergePools } from '../_kit.js';

const JT = { taskId: 'jungle-trail' };
const GI = { taskId: 'golden-idol' };

const trail = {
  'task-start.any': [
    { id: 'jgr2.jt-s5', when: JT, turns: [
      { beat: 'Ten steps into the trees, the light goes green and the air goes hot and wet.' },
      { by: 'b', say: "I've only been in here a minute and I'm already damp." },
      { by: 'a', say: "Everybody's damp. The trees are damp." },
      { by: 'b', say: "I hate it." },
    ] },
    { id: 'jgr2.jt-s6', when: JT, turns: [
      { by: 'a', say: "If you see a caterpillar, just tell me. Don't scream." },
      { by: 'b', say: "Why not scream?" },
      { by: 'a', say: "Because if you scream, I'll run, and we'll lose the trail." },
    ] },
    { id: 'jgr2.jt-s7', when: JT, turns: [
      { beat: '{a} pushes through a curtain of vines and comes out the other side with three of them wrapped round {a.posAdj} neck.' },
      { by: 'a', say: "Help. I'm stuck." },
      { by: 'b', say: "Pull them off. Come on." },
    ] },
    { id: 'jgr2.jt-s8', when: JT, turns: [
      { by: 'b', ...V("The mud's up to my ankles. My shoe is in there somewhere.", "I've lost a shoe in the mud.", "Lost a shoe.", "My SHOE! The mud TOOK my shoe!", "The mud's up to my ankles, and I think my shoe is still down there.", "The jungle has my shoe now. It can keep it.") },
      { beat: '{b} pulls {b.posAdj} foot out, and the shoe stays in the mud.' },
      { by: 'a', say: "Grab it! Quick! Put it back on!" },
    ] },
  ],
  'task-try.first-try': [
    { id: 'jgr2.jt-f5', when: JT, turns: [
      { beat: 'A huge caterpillar drops from a branch. {b} catches it on a big leaf, sets it on a log, and keeps walking.' },
      { by: 'a', say: "You just moved it. Like it was nothing." },
      { by: 'b', say: "Don't talk about it. Just walk." },
      { beat: 'Stone by stone, they come out at the foot of the ruins without stopping once.' },
    ] },
    { id: 'jgr2.jt-f6', when: JT, turns: [
      { by: 'a', say: "Don't stop on the log. Whatever you do, don't stop on the log." },
      { beat: 'They cross the log at a steady jog, splash through the mud, and the painted stones lead them straight out of the trees.' },
      { by: 'b', say: "We did it! We didn't even slip!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'jgr2.jt-a5', when: JT, turns: [
      { by: 'b', say: "The stones are painted on the side facing the ruins. We've been looking at the backs." },
      { by: 'a', say: "So we look back over our shoulders?" },
      { by: 'b', say: "We look back and walk forward." },
      { beat: 'Looking back, walking forward, they spot every stone, and the trees open onto the ruins.' },
    ] },
    { id: 'jgr2.jt-a6', when: JT, turns: [
      { beat: 'Back at the log again, {a} takes off both shoes and crosses barefoot, toes gripping the wet bark.' },
      { by: 'a', say: "It's easier barefoot!" },
      { beat: '{b} does the same, and both of them reach the far side and run the rest of the trail to the foot of the ruins.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'jgr2.jt-t4', when: JT, turns: [
      { beat: 'The trail splits in two. There\'s a painted stone on each side.' },
      { by: 'a', say: "Two stones. Two ways. Which one's ours?" },
      { by: 'b', say: "I don't know. Pick one." },
    ] },
    { id: 'jgr2.jt-t5', when: JT, turns: [
      { by: 'b', say: "There's one on your sleeve. Don't look. Keep walking." },
      { by: 'a', say: "How big?" },
      { by: 'b', say: "I said don't look!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'jgr2.jt-x4', when: JT, turns: [
      { beat: 'A vine that {a} grabs for balance on the log isn\'t tied to anything, and {a} goes into the stream holding it.' },
      { by: 'a', say: "The vine wasn't tied to anything!" },
      { by: 'b', say: "Out! Back to the last stone! Go again!" },
    ] },
    { id: 'jgr2.jt-x5', when: JT, turns: [
      { beat: 'The red stone they\'ve been following for five minutes turns out to be a red leaf.' },
      { by: 'b', say: "That's a leaf. We've been following a leaf." },
      { by: 'a', say: "Back to the last real stone." },
    ] },
  ],
  'task-done.any': [
    { id: 'jgr2.jt-dn4', when: JT, turns: [
      { by: 'b', say: "Check my hair. Is there anything living in my hair?" },
      { beat: '{a} checks, and pulls out a leaf.' },
      { by: 'a', say: "Just a leaf. You're fine." },
    ] },
    { id: 'jgr2.jt-dn5', when: JT, turns: [
      { beat: '{a} and {b} come out of the trees into the sunlight, mud to the knees, and sit down on the bottom step of the ruins.' },
      { by: 'a', say: "Thirty seconds. We sit for thirty seconds." },
      { by: 'b', say: "Twenty. Somebody's coming out of the trees behind us." },
    ] },
    { id: 'jgr2.jt-dn6', when: JT, turns: [
      { by: 'a', say: "We walked through a whole jungle. On foot. On purpose." },
      { by: 'b', say: "People pay to do that." },
      { by: 'a', say: "Not me. Never again." },
    ] },
  ],
};

const idol = {
  'task-start.any': [
    { id: 'jgr2.gi-s5', when: GI, turns: [
      { beat: '{b} taps an idol with a fingernail. It sounds dull. {b} taps the next. Dull again.' },
      { by: 'b', say: "Gold should ring. Shouldn't it?" },
      { by: 'a', say: "Keep tapping. Find one that rings." },
    ] },
    { id: 'jgr2.gi-s6', when: GI, turns: [
      { by: 'a', say: "Every carving is a man holding something." },
      { by: 'b', say: "So find the man holding a little gold idol." },
      { by: 'a', say: "That's too easy." },
      { by: 'b', say: "Look anyway." },
    ] },
    { id: 'jgr2.gi-s7', when: GI, turns: [
      { beat: '{a} picks up an idol and rubs it with a thumb. A smear of gold paint comes off on {a.posAdj} skin.' },
      { by: 'a', say: "This one's coming off. On me." },
      { by: 'b', say: "Then it's paint. Real gold doesn't rub off." },
    ] },
    { id: 'jgr2.gi-s8', when: GI, turns: [
      { by: 'b', say: "If you were an ancient king, where would you hide the real one?" },
      { by: 'a', say: "Somewhere low. Where nobody looks." },
      { beat: 'They both look down at the bottom row of niches, right at floor level.' },
    ] },
  ],
  'task-try.first-try': [
    { id: 'jgr2.gi-f5', when: GI, turns: [
      { beat: '{b} taps along a whole row of idols, until one of them rings.' },
      { by: 'b', say: "That one! That one rang!" },
      { beat: 'The guide scratches it with her coin. Bright gold underneath.' },
      { by: 'a', say: "You found it by listening!" },
    ] },
    { id: 'jgr2.gi-f6', when: GI, turns: [
      { by: 'a', say: "Every carving faces outward. Except that jaguar. It's looking at one niche." },
      { beat: '{a} takes the idol the jaguar is staring at to the guide. Her coin scratches pure gold.' },
      { by: 'b', say: "The jaguar was looking at it the whole time!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'jgr2.gi-a5', when: GI, turns: [
      { by: 'b', say: "We've got gold paint all over our hands from the fakes. So we pick one that doesn't leave any." },
      { beat: 'They rub idol after idol on their sleeves. Paint, paint, paint, and then one that leaves nothing at all.' },
      { by: 'a', say: "That one's clean!" },
      { beat: 'The guide scratches it. Gold. She hands over the tip.' },
    ] },
    { id: 'jgr2.gi-a6', when: GI, turns: [
      { beat: 'After three fakes, {a} sits on the step beside the guide and watches her face as the next team hands her an idol.' },
      { by: 'a', say: "She glances up at the wall before she scratches. At one spot. Every time." },
      { beat: '{a} climbs to that spot, brings down the idol, and the coin scratches gold.' },
      { by: 'b', say: "You watched her! That's so smart!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'jgr2.gi-t4', when: GI, turns: [
      { beat: '{a} and {b} are each holding an idol and won\'t let the other one take theirs to the guide.' },
      { by: 'a', say: "Mine's heavier." },
      { by: 'b', say: "Mine's shinier." },
    ] },
    { id: 'jgr2.gi-t5', when: GI, turns: [
      { by: 'b', say: "We've tried that one. And that one. And that one twice." },
      { by: 'a', say: "Twice? Why did we try it twice?" },
      { by: 'b', say: "Because they all look exactly the same!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'jgr2.gi-x4', when: GI, turns: [
      { beat: 'The guide scratches the idol, and the yellow paint peels off, showing grey clay underneath.' },
      { by: 'a', say: "That's not gold. That's barely paint." },
      { by: 'b', say: "Back up. Choose again." },
    ] },
    { id: 'jgr2.gi-x5', when: GI, turns: [
      { beat: '{b} hands the guide an idol with total confidence. She scratches it, and then shows {b} the clay with a very small shrug.' },
      { by: 'b', say: "I was so sure." },
      { by: 'a', say: "You're always so sure. Back to the wall." },
    ] },
  ],
  'task-done.any': [
    { id: 'jgr2.gi-dn4', when: GI, turns: [
      { by: 'a', say: "Fifty idols in that wall, and one's real. Who thought of that?" },
      { by: 'b', say: "Someone who really didn't want it stolen." },
      { by: 'a', say: "And we found it anyway." },
    ] },
    { id: 'jgr2.gi-dn5', when: GI, turns: [
      { beat: 'The guide puts the real idol back in its niche, then shuffles three of the fakes around it.' },
      { by: 'b', say: "She's hiding it again. For the next team." },
      { by: 'a', say: "Good luck to them." },
    ] },
    { id: 'jgr2.gi-dn6', when: GI, turns: [
      { by: 'b', say: "My fingers are all gold." },
      { by: 'a', say: "That's just paint from the fakes." },
      { by: 'b', say: "I know. It won't come off." },
    ] },
  ],
};

export default mergePools(trail, idol);
