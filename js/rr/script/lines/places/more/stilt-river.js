// Stilt River, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/stilt-river.js: at the river bank, the teams that arrive together
// are one Superteam catching six catfish by hand out of the muddy shallows into the fisherman's basket (one that
// wriggles out swims off and has to be caught again); in the tunnels, both crawl with one torch through the traps
// (trapdoors into mud, tripwires that drop sand, dead ends) to the Don Box with the map out.
import { V, mergePools } from '../_kit.js';

const CF = { taskId: 'catfish' };
const TN = { taskId: 'tunnels' };

const catfish = {
  'task-start.any': [
    { id: 'str2.cf-s1', when: CF, turns: [
      { beat: '{a} wades in up to the knees, and the mud sucks both feet down.' },
      { by: 'a', say: "I'm stuck. My shoes are stuck." },
      { by: 'b', say: "Leave them. Go barefoot." },
    ] },
    { id: 'str2.cf-s2', when: CF, turns: [
      { by: 'b', say: "Feel along the bank. They hide in the holes under the roots." },
      { by: 'a', say: "You want me to put my hand in a hole in a river?" },
      { by: 'b', say: "That's where they are." },
    ] },
    { id: 'str2.cf-s3', when: CF, turns: [
      { beat: 'The old fisherman taps his basket with his pipe, holds up six fingers, then points at the water.' },
      { by: 'a', say: "Six. We need six. Between all of us." },
      { by: 'b', say: "Then let's get ours in first." },
      { by: 'a', say: "We're all on the same team." },
    ] },
    { id: 'str2.cf-s4', when: CF, turns: [
      { by: 'a', say: "Has anybody here ever caught a fish?" },
      { by: 'b', say: "With a rod. Once. I didn't catch anything." },
      { by: 'a', say: "Great." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'str2.cf-f1', when: CF, turns: [
      { beat: '{b} plunges both arms into a hole under the roots and pulls out a catfish as long as a leg, whiskers twitching.' },
      { by: 'b', say: "It was just sitting in there!" },
      { by: 'a', say: "Basket! Basket! Quick!" },
    ] },
    { id: 'str2.cf-f2', when: CF, turns: [
      { by: 'a', say: "Everybody, make a circle. Close it slowly. Nobody splash." },
      { beat: 'The circle closes. Inside it, the water churns with fish, and six hands come up holding catfish.' },
      { by: 'b', say: "Six! All at once! The fisherman's clapping!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'str2.cf-a1', when: CF, turns: [
      { by: 'b', say: "They slide out because we squeeze. Don't squeeze. Hold them close." },
      { beat: '{a} hugs the next catfish to {a.posAdj} chest, wades out and lowers it into the basket.' },
      { by: 'a', say: "That works! Don't squeeze!" },
    ] },
    { id: 'str2.cf-a2', when: CF, turns: [
      { beat: 'After half an hour of empty hands, {a} lies down flat in the shallows and lets the mud settle round {a.obj}.' },
      { by: 'a', say: "If I stay still, they'll come to me." },
      { beat: 'A catfish swims right up to sniff {a}\'s ear. {a} grabs it. It\'s the sixth.' },
      { by: 'b', say: "That's six! You did it!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'str2.cf-t1', when: CF, turns: [
      { by: 'a', say: "How many in the basket?" },
      { by: 'b', say: "Four. No, three. One just climbed out." },
      { by: 'a', say: "How? How did it get out?" },
    ] },
    { id: 'str2.cf-t2', when: CF, turns: [
      { beat: '{a} and {b} wrestle the same catfish from opposite ends. It slips out of the middle and swims off between them.' },
      { by: 'b', say: "You had the head! Why did you let go of the head?" },
      { by: 'a', say: "I thought you had the head!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'str2.cf-x1', when: CF, turns: [
      { beat: '{a} wades back to the basket with a catfish, trips on a root, and throws it straight back into the river.' },
      { by: 'a', say: "No! I dropped it!" },
      { by: 'b', say: "Get another one!" },
    ] },
    { id: 'str2.cf-x2', when: CF, turns: [
      { beat: '{b} lifts something heavy and slimy out of the mud. It\'s a log.' },
      { by: 'b', say: "It felt like a fish!" },
      { by: 'a', say: "It's a log! Back in!" },
    ] },
  ],
  'task-done.any': [
    { id: 'str2.cf-dn1', when: CF, turns: [
      { beat: 'The fisherman counts six, puts the lid on the basket, and hands the tips out to everybody with a nod.' },
      { by: 'a', say: "Good luck, everybody!" },
      { by: 'b', say: "Now we race them. Now they're the enemy again." },
    ] },
    { id: 'str2.cf-dn2', when: CF, turns: [
      { by: 'b', say: "I found my shoe! It was under a fish!" },
      { by: 'a', say: "Where's the other one?" },
      { by: 'b', say: "Still in the river." },
    ] },
    { id: 'str2.cf-dn3', when: CF, turns: [
      { beat: '{a} and {b} squelch up the bank, mud to the elbows, weed stuck to their faces.' },
      { by: 'a', say: "We're so muddy." },
      { by: 'b', say: "I don't care. We did it." },
    ] },
  ],
};

const tunnels = {
  'task-start.any': [
    { id: 'str2.tn-s1', when: TN, turns: [
      { beat: '{a} crawls in on hands and knees. The torch beam shows a tunnel that goes on, and on, and gets smaller.' },
      { by: 'a', say: "It gets smaller. Why does it get smaller?" },
      { by: 'b', say: "It might open up again. Keep going." },
      { by: 'a', say: "You don't know that." },
    ] },
    { id: 'str2.tn-s2', when: TN, turns: [
      { by: 'b', say: "If you feel a wire, stop and say 'wire'. Don't say anything else." },
      { by: 'a', say: "What if it's something else?" },
      { by: 'b', say: "Then just say stop." },
    ] },
    { id: 'str2.tn-s3', when: TN, turns: [
      { beat: 'Somewhere deep in the tunnels, a trapdoor bangs and someone yells.' },
      { by: 'a', say: "That was a trapdoor." },
      { by: 'b', say: "Then we know which way not to go." },
    ] },
    { id: 'str2.tn-s4', when: TN, turns: [
      { by: 'a', say: "Who carries the torch?" },
      { by: 'b', say: "Whoever's in front. Whoever's behind holds the front one's ankle." },
      { by: 'a', say: "And if the front one gets scared?" },
      { by: 'b', say: "Then we swap." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'str2.tn-f1', when: TN, turns: [
      { beat: 'The torch catches the edge of a red box at the end of a short side tunnel.' },
      { by: 'a', say: "Is that it? Already? That was too easy." },
      { by: 'b', say: "Don't say that yet. Grab the map and go." },
    ] },
    { id: 'str2.tn-f2', when: TN, turns: [
      { by: 'b', say: "Every tunnel with sand on the floor has a trap. Clean floors only." },
      { beat: 'The clean floors take them round three corners and straight to the Don Box. The map is inside.' },
      { by: 'a', say: "That was so smart." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'str2.tn-a1', when: TN, turns: [
      { by: 'a', say: "Turn the torch off. Look for light coming from somewhere." },
      { by: 'b', say: "You want less light?" },
      { beat: 'In the dark, a faint red glow shows at the end of one tunnel. It\'s the light on the Don Box. They crawl straight to it.' },
      { by: 'a', say: "Turning it off worked!" },
    ] },
    { id: 'str2.tn-a2', when: TN, turns: [
      { beat: 'Covered in mud from the last trapdoor, {b} taps the floor ahead with the torch before every single move.' },
      { by: 'b', say: "Tap, then crawl. Every time." },
      { beat: 'The tapping finds two trapdoors and steers round both. At the end is the Don Box, and the map.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'str2.tn-t1', when: TN, turns: [
      { by: 'a', say: "Something just ran over my hand." },
      { by: 'b', say: "What kind of something?" },
      { by: 'a', say: "I don't know! Keep going!" },
    ] },
    { id: 'str2.tn-t2', when: TN, turns: [
      { beat: '{a} and {b} sit at a junction of four tunnels, torch flickering, mud drying on their faces.' },
      { by: 'b', say: "We've tried this one, and this one. Have we tried this one?" },
      { by: 'a', say: "I've lost count." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'str2.tn-x1', when: TN, turns: [
      { beat: '{a} puts a hand on a stone that looks like every other stone. The ceiling opens, and a bucket of sand lands on {a.posAdj} head.' },
      { by: 'b', say: "Are you okay?" },
      { by: 'a', say: "I'm fine. Back to the junction." },
    ] },
    { id: 'str2.tn-x2', when: TN, turns: [
      { beat: 'The torch rolls out of {b}\'s hand, down a slope, and goes out with a plop in a puddle.' },
      { by: 'b', say: "I've lost the torch." },
      { by: 'a', say: "Feel along the left wall. Back to the last junction, in the dark. Go." },
    ] },
  ],
  'task-done.any': [
    { id: 'str2.tn-dn1', when: TN, turns: [
      { beat: '{a} and {b} crawl out into the evening light, blinking, holding the map up like a trophy.' },
      { by: 'a', say: "Daylight! Proper daylight!" },
      { by: 'b', say: "It's nearly sunset. Proper daylight's nearly over. Run." },
    ] },
    { id: 'str2.tn-dn2', when: TN, turns: [
      { by: 'b', say: "I'm never complaining about a small room again." },
      { by: 'a', say: "You complained about the plane seat." },
      { by: 'b', say: "That was a different kind of small." },
    ] },
    { id: 'str2.tn-dn3', when: TN, turns: [
      { by: 'a', say: "Temple path. The Chill Zone's at the temple." },
      { by: 'b', say: "Please tell me it's not underground." },
      { by: 'a', say: "It's on a hill. In the open." },
    ] },
  ],
};

export default mergePools(catfish, tunnels);
