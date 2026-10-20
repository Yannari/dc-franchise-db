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
      { by: 'b', say: "That's one sausage for a giant." },
    ] },
    { id: 'snp2.sg-s6', when: SG, turns: [
      { by: 'a', say: "You crank, I'll hold the skin. Don't crank faster than I can hold." },
      { beat: '{b} cranks faster than {a} can hold. The sausage skin balloons and wriggles out of {a.posAdj} hands like a fire hose.' },
      { by: 'a', say: "Slower! It's alive! It's getting away!" },
    ] },
    { id: 'snp2.sg-s7', when: SG, turns: [
      { by: 'b', ...V("Measure it against us. Lie down next to it.", "Lie down next to it.", "Measure it.", "Lie DOWN next to it! MEASURE it!", "Could you lie down beside it so we can measure, please?", "We need a sausage the length of a friendship.") },
      { beat: '{a} lies down on the floor of the hut beside the sausage. It comes up to {a.posAdj} knees.' },
      { by: 'a', say: "Keep cranking. A lot more cranking." },
    ] },
    { id: 'snp2.sg-s8', when: SG, turns: [
      { beat: 'At the top of the slope, a goat wanders over and sniffs the end of the sausage with great interest.' },
      { by: 'a', say: "Don't let it eat our sled." },
      { by: 'b', say: "Shoo. Shoo! This is transport, not lunch." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'snp2.sg-f5', when: SG, turns: [
      { beat: '{a} and {b} tuck their knees up, grip the sausage like a motorbike, and shoot down the slope, past every goat, over the line.' },
      { by: 'a', say: "Faster than the cable car!" },
      { by: 'b', say: "Faster than anything I've ever sat on!" },
    ] },
    { id: 'snp2.sg-f6', when: SG, turns: [
      { by: 'b', say: "Goat on the left! Goat on the right! Goat in the middle!" },
      { by: 'a', say: "Go between them!" },
      { beat: 'The sausage threads between three goats like a needle and slides over the bottom line in one piece.' },
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
      { by: 'b', say: "Waxing it. Skiers wax their skis." },
      { by: 'a', say: "Skiers don't wax meat." },
      { beat: 'The waxed sausage slides like it\'s on rails, and they cross the line without a single wobble.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'snp2.sg-t4', when: SG, turns: [
      { beat: 'The grinder handle has jammed. {a} is hanging off it with both hands and both feet off the floor.' },
      { by: 'a', say: "It's stuck! There's a bone in it! Or a goat!" },
      { by: 'b', say: "Bounce! Bounce on it!" },
    ] },
    { id: 'snp2.sg-t5', when: SG, turns: [
      { by: 'b', say: "We're going too slow. A sausage shouldn't go this slow." },
      { by: 'a', say: "How fast should a sausage go?" },
      { by: 'b', say: "Faster than walking! People are walking past us!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'snp2.sg-x4', when: SG, turns: [
      { beat: 'The sausage hits a bump, bends in the middle like a hinge, and folds {a} and {b} up into the snow.' },
      { by: 'b', say: "It folded! A sausage can fold?" },
      { by: 'a', say: "Back up the hill. A stiffer one this time." },
    ] },
    { id: 'snp2.sg-x5', when: SG, turns: [
      { beat: 'Before they\'ve even pushed off, a goat bites the end off their sausage and trots away with it.' },
      { by: 'a', say: "Hey! That was the back half!" },
      { by: 'b', say: "It's too short now! Back to the grinder!" },
    ] },
  ],
  'task-done.any': [
    { id: 'snp2.sg-dn4', when: SG, turns: [
      { by: 'b', say: "Does anyone eat it after? Do they cook the sausages?" },
      { by: 'a', say: "We sat on it. We slid down a mountain on it." },
      { by: 'b', say: "So that's a no." },
    ] },
    { id: 'snp2.sg-dn5', when: SG, turns: [
      { beat: '{a} gets up from the bottom of the slope with a long greasy stripe down the back of {a.posAdj} trousers.' },
      { by: 'a', say: "How bad is it?" },
      { by: 'b', say: "Every dog on this mountain is going to follow you home." },
    ] },
    { id: 'snp2.sg-dn6', when: SG, turns: [
      { by: 'a', say: "Somewhere, a butcher is very confused about why we wanted so much." },
      { by: 'b', say: "And a goat's very happy." },
      { by: 'a', say: "Let's go before the goat wants more." },
    ] },
  ],
};

const slap = {
  'task-start.any': [
    { id: 'snp2.sd-s5', when: SD, turns: [
      { beat: '{a} steps onto the pad in lederhosen. The braces are too long, and the shorts are somewhere around {a.posAdj} knees.' },
      { by: 'a', say: "Is this how they're supposed to fit?" },
      { by: 'b', say: "Pull them up. You can't dance in a skirt." },
    ] },
    { id: 'snp2.sd-s6', when: SD, turns: [
      { by: 'b', say: "Think of it as clapping. With your legs." },
      { by: 'a', say: "I can barely clap with my hands." },
      { by: 'b', say: "Then you're starting from the bottom. That's fine." },
    ] },
    { id: 'snp2.sd-s7', when: SD, turns: [
      { beat: 'Before the music starts, {a} tests one arrow with a toe. It buzzes.' },
      { by: 'a', say: "It's live! It's already live!" },
      { by: 'b', say: "That's a practice buzz. That one doesn't count. Probably." },
    ] },
    { id: 'snp2.sd-s8', when: SD, turns: [
      { by: 'a', say: "Slap the thigh, slap the shoe, stamp the arrow. Thigh, shoe, arrow." },
      { by: 'b', say: "You've got it." },
      { by: 'a', say: "I've got it when it's slow. It's not going to be slow." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'snp2.sd-f5', when: SD, turns: [
      { beat: '{a} goes stiff as a board and hits every arrow with tiny, perfect, robot movements, slapping like clockwork.' },
      { by: 'b', say: "You're doing it like a cuckoo clock!" },
      { by: 'a', say: "Don't make me laugh! I'll miss!" },
      { beat: 'The song ends. One buzz. The judge nods.' },
    ] },
    { id: 'snp2.sd-f6', when: SD, turns: [
      { by: 'a', say: "Just pretend there's a wasp on my leg. Slap the wasp." },
      { beat: '{a} slaps the wasp, stamps the wasp, and slaps the wasp off a shoe, through the whole song, with only one buzz.' },
      { by: 'b', say: "Best wasp fight I've ever seen." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'snp2.sd-a5', when: SD, turns: [
      { by: 'b', say: "You keep going early on the slow bit in the middle. Wait for it. Let the accordion breathe." },
      { by: 'a', say: "Let the accordion breathe." },
      { beat: '{a} lets the accordion breathe, holds still through the slow bit, and finishes the song with two buzzes.' },
      { by: 'a', say: "It breathed! I let it breathe!" },
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
      { by: 'a', say: "I need a third leg! Nobody said I needed a third leg!" },
      { by: 'b', say: "Jump! Land on both! Jump!" },
    ] },
    { id: 'snp2.sd-t5', when: SD, turns: [
      { by: 'b', say: "That's two misses. Two. Don't miss again." },
      { by: 'a', say: "Don't tell me the number! The number makes it worse!" },
      { beat: 'An arrow comes down. {a} freezes, looking at it.' },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'snp2.sd-x4', when: SD, turns: [
      { beat: '{a} slaps a thigh so hard that {a.sub} yelp, lose count, and stamp three arrows that aren\'t there. Buzz, buzz, buzz.' },
      { by: 'a', say: "That was my own fault! Every one of those!" },
      { by: 'b', say: "Shake it off! Start again!" },
    ] },
    { id: 'snp2.sd-x5', when: SD, turns: [
      { beat: 'One of {a}\'s braces snaps loose and smacks {a} in the face. {a} stops dancing to hold up the shorts. Three buzzes.' },
      { by: 'a', say: "The shorts attacked me!" },
      { by: 'b', say: "Tie them up and go again!" },
    ] },
  ],
  'task-done.any': [
    { id: 'snp2.sd-dn4', when: SD, turns: [
      { by: 'a', say: "I've been buzzed so many times, I think I can charge a phone." },
      { by: 'b', say: "Hold it near your ear and we'll see." },
      { by: 'a', say: "Don't. I'll start dancing again." },
    ] },
    { id: 'snp2.sd-dn5', when: SD, turns: [
      { beat: 'An old man in the crowd shakes {a}\'s hand and slaps his own thigh, very seriously, twice.' },
      { by: 'b', say: "What does that mean?" },
      { by: 'a', say: "I think I've been accepted into something." },
    ] },
    { id: 'snp2.sd-dn6', when: SD, turns: [
      { by: 'b', say: "Can we go now? Before they put on another song?" },
      { by: 'a', say: "I'm not stepping on anything square ever again." },
      { by: 'b', say: "Then don't look at the pavement." },
    ] },
  ],
};

export default mergePools(sausage, slap);
