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
      { beat: '{a} wades in up to the knees. The mud swallows both feet and does not give them back.' },
      { by: 'a', say: "I'm stuck. The river has my shoes." },
      { by: 'b', say: "Then you're barefoot now. Like a real fisherman." },
    ] },
    { id: 'str2.cf-s2', when: CF, turns: [
      { by: 'b', say: "Feel along the bank. They hide in the holes under the roots." },
      { by: 'a', say: "You want me to put my hand in a hole in a river?" },
      { by: 'b', say: "Where else would a fish be?" },
    ] },
    { id: 'str2.cf-s3', when: CF, turns: [
      { beat: 'The old fisherman taps his basket with his pipe, holds up six fingers, then points at the water.' },
      { by: 'a', say: "Six. We need six. Between all of us." },
      { by: 'b', say: "Then let's get ours in before the others get theirs." },
      { by: 'a', say: "We're on the same side." },
    ] },
    { id: 'str2.cf-s4', when: CF, turns: [
      { by: 'a', say: "Has anybody here ever caught a fish?" },
      { by: 'b', ...V("With a rod. Once. It was a sock.", "With a rod, once. A sock.", "A sock, once.", "With a ROD! ONCE! It was a SOCK!", "Once, with a rod, and it turned out to be a sock.", "I once caught a sock. It fought harder than you'd think.") },
      { by: 'a', say: "Great. We're experts." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'str2.cf-f1', when: CF, turns: [
      { beat: '{b} plunges both arms into a hole under the roots and pulls out a catfish as long as a leg, whiskers twitching.' },
      { by: 'b', say: "It was just sitting in there! Like a lodger!" },
      { by: 'a', say: "Basket! Basket! Before it moves out!" },
    ] },
    { id: 'str2.cf-f2', when: CF, turns: [
      { by: 'a', say: "Everybody, make a circle. Close it slowly. Nobody splash." },
      { beat: 'The circle closes. Inside it, the water boils with fish. Six hands come up holding catfish.' },
      { by: 'b', say: "Six! All at once! The fisherman's clapping!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'str2.cf-a1', when: CF, turns: [
      { by: 'b', say: "They slide out because we squeeze. Don't squeeze. Hug." },
      { beat: '{a} hugs the next catfish to {a.posAdj} chest like a baby, wades out and lowers it into the basket.' },
      { by: 'a', say: "Hug, don't squeeze! It's a whole philosophy!" },
    ] },
    { id: 'str2.cf-a2', when: CF, turns: [
      { beat: 'After half an hour of empty hands, {a} lies down flat in the shallows and lets the mud settle round {a.obj}.' },
      { by: 'a', say: "If I'm part of the river, they won't see me coming." },
      { beat: 'A catfish swims right up to sniff {a}\'s ear. {a} grabs it. It\'s the sixth.' },
      { by: 'b', say: "You were a log! You were a log the whole time!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'str2.cf-t1', when: CF, turns: [
      { by: 'a', say: "How many in the basket?" },
      { by: 'b', say: "Four. No, three. One just climbed out." },
      { by: 'a', say: "Climbed? Fish don't climb!" },
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
      { by: 'a', say: "I gave it back! I didn't mean to give it back!" },
      { by: 'b', say: "It was very grateful! Get another one!" },
    ] },
    { id: 'str2.cf-x2', when: CF, turns: [
      { beat: '{b} lifts something heavy and slimy out of the mud with a cry of triumph. It is a log.' },
      { by: 'b', say: "It felt like a fish! It had a fish shape!" },
      { by: 'a', say: "It has a log shape! Back in!" },
    ] },
  ],
  'task-done.any': [
    { id: 'str2.cf-dn1', when: CF, turns: [
      { beat: 'The fisherman counts six, puts the lid on the basket, and hands the tips out to everybody with a nod.' },
      { by: 'a', say: "Good luck, everybody! Not too much luck!" },
      { by: 'b', say: "Now we race them. Now they're the enemy again." },
    ] },
    { id: 'str2.cf-dn2', when: CF, turns: [
      { by: 'b', say: "I found my shoe! It was under a fish!" },
      { by: 'a', say: "Where's the other one?" },
      { by: 'b', say: "Still in the river. It lives there now." },
    ] },
    { id: 'str2.cf-dn3', when: CF, turns: [
      { beat: '{a} and {b} squelch up the bank, mud to the elbows, whiskers of weed stuck to their faces.' },
      { by: 'a', say: "We look like catfish." },
      { by: 'b', say: "We've earned it. We're one of them now." },
    ] },
  ],
};

const tunnels = {
  'task-start.any': [
    { id: 'str2.tn-s1', when: TN, turns: [
      { beat: '{a} crawls in on hands and knees. The torch beam shows a tunnel that goes on, and on, and gets smaller.' },
      { by: 'a', say: "It gets smaller. Why does it get smaller?" },
      { by: 'b', say: "Maybe it gets bigger again after the small bit." },
      { by: 'a', say: "You don't know that." },
    ] },
    { id: 'str2.tn-s2', when: TN, turns: [
      { by: 'b', say: "If you feel a wire, stop and say 'wire'. Don't say anything else." },
      { by: 'a', say: "What if I feel a spider?" },
      { by: 'b', say: "Then say 'wire' anyway. Keep it simple." },
    ] },
    { id: 'str2.tn-s3', when: TN, turns: [
      { beat: 'Somewhere deep in the tunnels, a trapdoor bangs and someone yells. Then there is a long, wet slurp.' },
      { by: 'a', say: "That was a mud one." },
      { by: 'b', say: "Then we'll know which way not to go. Follow the slurp, and go the other way." },
    ] },
    { id: 'str2.tn-s4', when: TN, turns: [
      { by: 'a', say: "Who carries the torch?" },
      { by: 'b', say: "Whoever's in front. Whoever's behind holds the front one's ankle." },
      { by: 'a', say: "And if the front one gets scared?" },
      { by: 'b', say: "Then the back one gets the torch. And the front." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'str2.tn-f1', when: TN, turns: [
      { beat: 'The torch catches the edge of a red box at the end of a short side tunnel.' },
      { by: 'a', say: "Is that it? Already? That was too easy." },
      { by: 'b', say: "Don't say easy in a tunnel full of traps. Grab the map and go." },
    ] },
    { id: 'str2.tn-f2', when: TN, turns: [
      { by: 'b', say: "Every tunnel with sand on the floor has a trap. Clean floors only." },
      { beat: 'Clean floors only takes them round three corners and straight to the Don Box. The map is inside.' },
      { by: 'a', say: "You're a tunnel genius. Where did you learn that?" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'str2.tn-a1', when: TN, turns: [
      { by: 'a', say: "Turn the torch off. Look for light coming from somewhere." },
      { by: 'b', say: "You want less light?" },
      { beat: 'In the dark, a faint red glow shows at the end of one tunnel. It\'s the light on the Don Box. They crawl straight to it.' },
      { by: 'a', say: "Less light, more box!" },
    ] },
    { id: 'str2.tn-a2', when: TN, turns: [
      { beat: 'Covered in mud from the last trapdoor, {b} taps the floor ahead with the torch before every single move.' },
      { by: 'b', say: "Tap. Crawl. Tap. Crawl. Nothing gets us twice." },
      { beat: 'The tapping finds two trapdoors and steers round both. At the end is the Don Box, and the map.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'str2.tn-t1', when: TN, turns: [
      { by: 'a', say: "Something just ran over my hand." },
      { by: 'b', say: "What kind of something?" },
      { by: 'a', say: "The kind with feet! Lots of feet!" },
    ] },
    { id: 'str2.tn-t2', when: TN, turns: [
      { beat: '{a} and {b} sit at a junction of four tunnels, torch flickering, mud drying on their faces.' },
      { by: 'b', say: "We've tried this one, and this one. Have we tried this one?" },
      { by: 'a', say: "I've lost count. I've lost my sense of direction. I've lost a shoe." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'str2.tn-x1', when: TN, turns: [
      { beat: '{a} puts a hand on a stone that looks like every other stone. The ceiling opens, and a bucket of sand lands on {a.posAdj} head.' },
      { by: 'b', say: "Are you okay?" },
      { by: 'a', say: "I'm a beach now. Back to the junction." },
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
      { by: 'b', say: "Is the temple in a tunnel?" },
      { by: 'a', say: "It's on a hill. In the open. With sky." },
    ] },
  ],
};

export default mergePools(catfish, tunnels);
