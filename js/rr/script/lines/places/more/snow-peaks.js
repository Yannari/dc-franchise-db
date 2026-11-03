// Snow Peaks, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/snow-peaks.js: both crank the meat into one sausage and ride it
// down the slope round the goats; at the slap dance, a dances on the light-up pad in lederhosen and b watches.
import { V, mergePools } from '../_kit.js';

const SG = { taskId: 'sausage' };
const SD = { taskId: 'slap-dance' };

const sausage = {
  'task-start.any': [
    { id: 'snp2.sg-s5', when: SG, turns: [
      { beat: '{b} lifts the lid of the meat bin, looks inside, and puts the lid back down.' },
      { by: 'b', say: "That's a lot of meat." },
      { by: 'a', say: "That's one sausage." },
      { by: 'b', say: "That's a huge sausage." },
    ] },
    { id: 'snp2.sg-s6', when: SG, turns: [
      { by: 'a', say: "You crank, I'll hold the skin. Don't crank faster than I can hold." },
      { beat: '{b} cranks faster than {a} can hold, and the sausage skin wriggles out of {a.posAdj} hands.' },
      { by: 'a', say: "Slower! I can't hold it!" },
    ] },
    { id: 'snp2.sg-s7', when: SG, turns: [
      { by: 'b', ...V("Measure it against us. Lie down next to it.", "Lie down next to it.", "Measure it.", "Lie DOWN next to it! MEASURE it!", "Could you lie down beside it so we can measure, please?", "We need a sausage the length of a friendship.") },
      { beat: '{a} lies down on the floor of the hut beside the sausage. It comes up to {a.posAdj} knees.' },
      { by: 'a', say: "Keep cranking. A lot more cranking." },
    ] },
    { id: 'snp2.sg-s8', when: SG, turns: [
      { beat: 'At the top of the slope, a goat wanders over and sniffs the end of the sausage.' },
      { by: 'a', say: "Get it away from the sausage." },
      { by: 'b', say: "Shoo. Shoo!" },
    ] },
  ],
  'task-try.first-try': [
    { id: 'snp2.sg-f5', when: SG, turns: [
      { beat: '{a} and {b} tuck their knees up, grip the sausage tight, and shoot down the slope, past every goat, over the line.' },
      { by: 'a', say: "That was so fast!" },
      { by: 'b', say: "That was amazing!" },
    ] },
    { id: 'snp2.sg-f6', when: SG, turns: [
      { by: 'b', say: "Goat on the left! Goat on the right! Goat in the middle!" },
      { by: 'a', say: "Go between them!" },
      { beat: 'The sausage goes between three goats and slides over the bottom line in one piece.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'snp2.sg-a5', when: SG, turns: [
      { by: 'a', say: "Last time we sat on it too far back. All the weight in the middle this time." },
      { by: 'b', say: "We'll be sitting on top of each other." },
      { by: 'a', say: "Then we sit on top of each other." },
      { beat: 'Squashed together in the middle, they ride the sausage straight and level all the way to the bottom line.' },
    ] },
    { id: 'snp2.sg-a6', when: SG, turns: [
      { beat: 'This time {b} rubs snow along the bottom of the new sausage before they get on, until it\'s smooth and shiny.' },
      { by: 'b', say: "Making it smooth. Like skis." },
      { by: 'a', say: "Does that work?" },
      { beat: 'The smoothed sausage slides much faster, and they cross the line without a single wobble.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'snp2.sg-t4', when: SG, turns: [
      { beat: 'The grinder handle has jammed. {a} is hanging off it with both hands and both feet off the floor.' },
      { by: 'a', say: "It's stuck! Something's stuck in it!" },
      { by: 'b', say: "Push! Push it!" },
    ] },
    { id: 'snp2.sg-t5', when: SG, turns: [
      { by: 'b', say: "We're going too slow. A sausage shouldn't go this slow." },
      { by: 'a', say: "Lean forward!" },
      { by: 'b', say: "Faster! People are walking past us!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'snp2.sg-x4', when: SG, turns: [
      { beat: 'The sausage hits a bump, bends in the middle, and throws {a} and {b} into the snow.' },
      { by: 'b', say: "It bent! It bent in half!" },
      { by: 'a', say: "Back up the hill. A stiffer one this time." },
    ] },
    { id: 'snp2.sg-x5', when: SG, turns: [
      { beat: 'Before they\'ve even pushed off, the end of their sausage splits open on a rock.' },
      { by: 'a', say: "No! It's split!" },
      { by: 'b', say: "It's too short now! Back to the grinder!" },
    ] },
  ],
  'task-done.any': [
    { id: 'snp2.sg-dn4', when: SG, turns: [
      { by: 'b', say: "Does anyone eat it after? Do they cook the sausages?" },
      { by: 'a', say: "We sat on it." },
      { by: 'b', say: "Good point." },
    ] },
    { id: 'snp2.sg-dn5', when: SG, turns: [
      { beat: '{a} gets up from the bottom of the slope with a long greasy stripe down the back of {a.posAdj} trousers.' },
      { by: 'a', say: "How bad is it?" },
      { by: 'b', say: "You don't want to know." },
    ] },
    { id: 'snp2.sg-dn6', when: SG, turns: [
      { by: 'a', say: "I'm never eating a sausage again." },
      { by: 'b', say: "Me neither." },
      { by: 'a', say: "Let's go." },
    ] },
  ],
};

const slap = {
  'task-start.any': [
    { id: 'snp2.sd-s5', when: SD, turns: [
      { beat: '{a} steps onto the pad in lederhosen. The braces are too long, and the shorts are falling down.' },
      { by: 'a', say: "Is this how they're supposed to fit?" },
      { by: 'b', say: "Pull them up. Tighten the braces." },
    ] },
    { id: 'snp2.sd-s6', when: SD, turns: [
      { by: 'b', say: "It's just like clapping." },
      { by: 'a', say: "I'm bad at clapping." },
      { by: 'b', say: "You'll be fine." },
    ] },
    { id: 'snp2.sd-s7', when: SD, turns: [
      { beat: 'Before the music starts, {a} tests one arrow with a toe. It buzzes.' },
      { by: 'a', say: "It's live! It's already live!" },
      { by: 'b', say: "That one doesn't count. The music hasn't started." },
    ] },
    { id: 'snp2.sd-s8', when: SD, turns: [
      { by: 'a', say: "Slap the thigh, slap the shoe, stamp the arrow. Thigh, shoe, arrow." },
      { by: 'b', say: "You've got it." },
      { by: 'a', say: "I've got it when it's slow. It's not going to be slow." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'snp2.sd-f5', when: SD, turns: [
      { beat: '{a} hits every arrow with small, careful steps, slapping in perfect time.' },
      { by: 'b', say: "You're doing it! Keep going!" },
      { by: 'a', say: "Don't make me laugh! I'll miss!" },
      { beat: 'The song ends. One buzz. The judge nods.' },
    ] },
    { id: 'snp2.sd-f6', when: SD, turns: [
      { by: 'a', say: "Just slap. Don't think." },
      { beat: '{a} slaps, stamps and slaps through the whole song, with only one buzz.' },
      { by: 'b', say: "One buzz! You did it!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'snp2.sd-a5', when: SD, turns: [
      { by: 'b', say: "You keep going early on the slow bit in the middle. Wait for it." },
      { by: 'a', say: "Wait for it. Okay." },
      { beat: '{a} holds still through the slow bit, and finishes the song with two buzzes.' },
      { by: 'a', say: "It worked! Waiting worked!" },
    ] },
    { id: 'snp2.sd-a6', when: SD, turns: [
      { beat: 'Third start. {a} kicks off the long socks and dances barefoot, feeling every arrow on the pad.' },
      { by: 'a', say: "I can feel them! I can feel where they are!" },
      { beat: 'Barefoot, {a} misses only one arrow all song, and the judge hands over the tip.' },
      { by: 'b', say: "Your feet are blue. But you did it." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'snp2.sd-t4', when: SD, turns: [
      { beat: 'The arrows are coming in pairs now. {a} is trying to stamp two at once and slap a shoe at the same time.' },
      { by: 'a', say: "Two at once? How do I do two at once?" },
      { by: 'b', say: "Jump! Land on both! Jump!" },
    ] },
    { id: 'snp2.sd-t5', when: SD, turns: [
      { by: 'b', say: "That's two misses. Two. Don't miss again." },
      { by: 'a', say: "Don't tell me! It makes it worse!" },
      { beat: 'An arrow comes down. {a} freezes, looking at it.' },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'snp2.sd-x4', when: SD, turns: [
      { beat: '{a} slaps a thigh too hard, loses count, and stamps three wrong arrows. Buzz, buzz, buzz.' },
      { by: 'a', say: "That was my fault! All of it!" },
      { by: 'b', say: "Shake it off! Start again!" },
    ] },
    { id: 'snp2.sd-x5', when: SD, turns: [
      { beat: 'One of {a}\'s braces snaps loose, and {a} stops dancing to hold up the shorts. Three buzzes.' },
      { by: 'a', say: "The shorts! The shorts fell down!" },
      { by: 'b', say: "Tie them up and go again!" },
    ] },
  ],
  'task-done.any': [
    { id: 'snp2.sd-dn4', when: SD, turns: [
      { by: 'a', say: "I've been buzzed so many times." },
      { by: 'b', say: "But you did it." },
      { by: 'a', say: "I'll be hearing that song all night." },
    ] },
    { id: 'snp2.sd-dn5', when: SD, turns: [
      { beat: 'An old man in the crowd shakes {a}\'s hand and slaps his own thigh, twice, and smiles.' },
      { by: 'b', say: "He liked it!" },
      { by: 'a', say: "I think that's good." },
    ] },
    { id: 'snp2.sd-dn6', when: SD, turns: [
      { by: 'b', say: "Can we go now? Before they put on another song?" },
      { by: 'a', say: "I never want to see another arrow." },
      { by: 'b', say: "Come on. Let's go." },
    ] },
  ],
};

export default mergePools(sausage, slap);
