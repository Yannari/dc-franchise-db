// Ice River, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/ice-river.js: both partners jump floe to floe across the river
// (a dunk means swimming back and starting again); then one rides the sled and one pulls it, flag to flag, to the
// ice cliff, swapping when the puller gives out.
import { V, mergePools } from '../_kit.js';

const IF = { taskId: 'ice-floes' };
const SL = { taskId: 'sled' };

const floes = {
  'task-start.any': [
    { id: 'icr2.if-s5', when: IF, turns: [
      { beat: 'A floe the size of a door drifts past, turning slowly, with a seagull standing on it.' },
      { by: 'b', say: "If it holds a seagull, it'll hold me." },
      { by: 'a', say: "You're heavier than a seagull." },
      { by: 'b', say: "Not by as much as you think." },
    ] },
    { id: 'icr2.if-s6', when: IF, turns: [
      { by: 'a', say: "Arms out. Knees bent. Like surfing." },
      { by: 'b', say: "You've never surfed." },
      { by: 'a', say: "I've never ice-floed either. I'm guessing at all of it." },
    ] },
    { id: 'icr2.if-s7', when: IF, turns: [
      { beat: '{b} dips one finger in the river and pulls it straight back out.' },
      { by: 'b', say: "We are not falling in. That's the whole plan. That's it." },
      { by: 'a', say: "Great plan. Very detailed." },
    ] },
    { id: 'icr2.if-s8', when: IF, turns: [
      { by: 'a', ...V("The far bank looks further away every time I look at it.", "The far bank keeps moving.", "It's far.", "The far bank is getting FURTHER away!", "It's strange, the far bank looks further away every time I check.", "I think the far bank is drifting too.") },
      { by: 'b', say: "Then stop looking at it and look at the ice." },
      { beat: 'They both look at the ice. A chunk breaks off the edge and floats away.' },
    ] },
  ],
  'task-try.first-try': [
    { id: 'icr2.if-f5', when: IF, turns: [
      { beat: '{a} jumps, {b} jumps, and every floe they land on dips, creaks and holds, all the way across.' },
      { by: 'a', say: "Don't talk. Don't breathe. Just land." },
      { by: 'b', say: "We landed! We're on dirt! I love dirt!" },
    ] },
    { id: 'icr2.if-f6', when: IF, turns: [
      { by: 'b', say: "Jump when it's closest. Not before. Not after." },
      { beat: 'They count each floe in, jump at the exact closest moment, and step onto the far bank one after the other.' },
      { by: 'a', say: "We were like frogs. Very cold, very good frogs." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'icr2.if-a5', when: IF, turns: [
      { by: 'a', say: "Every time we jump, we land and then stand still. And then it tips." },
      { by: 'b', say: "So we don't stand still." },
      { by: 'a', say: "Land and go. Land and go." },
      { beat: 'Land and go, land and go, and they cross before a single floe has time to tip.' },
    ] },
    { id: 'icr2.if-a6', when: IF, turns: [
      { beat: 'Dripping, teeth chattering, {b} watches the river for a full minute before jumping again, and picks the thickest ice on the water.' },
      { by: 'b', say: "That one's got a dent where somebody stood on it. It held them." },
      { beat: 'It holds {b}, and the next one holds both of them, and then there\'s solid ground.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'icr2.if-t4', when: IF, turns: [
      { beat: '{a} is on one floe, {b} on another, and the two floes are slowly drifting apart.' },
      { by: 'b', say: "Where are you going? Come back!" },
      { by: 'a', say: "I'm not going anywhere! The river is!" },
    ] },
    { id: 'icr2.if-t5', when: IF, turns: [
      { by: 'a', say: "There's nothing coming. There's no floe. It's just water." },
      { by: 'b', say: "Then we wait on this one." },
      { by: 'a', say: "This one's getting smaller." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'icr2.if-x4', when: IF, turns: [
      { beat: '{b} lands on a floe that looked solid. It turns out to be mostly slush, and {b} sinks through it like a spoon through ice cream.' },
      { by: 'b', say: "That was a lie! That ice lied to me!" },
      { by: 'a', say: "Swim! Back to the bank! Again!" },
    ] },
    { id: 'icr2.if-x5', when: IF, turns: [
      { beat: '{a} and {b} both jump for the same floe at the same moment, collide in mid-air and drop into the river together.' },
      { by: 'a', say: "That one was mine!" },
      { by: 'b', say: "Nothing is anyone's! Back to the start!" },
    ] },
  ],
  'task-done.any': [
    { id: 'icr2.if-dn4', when: IF, turns: [
      { beat: '{a} wrings a stream of river water out of one sleeve.' },
      { by: 'a', say: "I'm taking some of that river with me." },
      { by: 'b', say: "It'll freeze on you." },
      { by: 'a', say: "Then I'll have my own floe." },
    ] },
    { id: 'icr2.if-dn5', when: IF, turns: [
      { by: 'b', say: "Look back. Look at all the ice we jumped on." },
      { beat: 'They look back. Every floe they stood on has already drifted downstream and out of sight.' },
      { by: 'a', say: "Nobody's ever going to believe us." },
    ] },
    { id: 'icr2.if-dn6', when: IF, turns: [
      { by: 'a', say: "A sled next. I hope it's a sled with a heater in it." },
      { by: 'b', say: "It's a sled. It has wood in it." },
      { by: 'a', say: "Then I hope I'm the one sitting down." },
    ] },
  ],
};

const sled = {
  'task-start.any': [
    { id: 'icr2.sl-s5', when: SL, turns: [
      { by: 'a', say: "Who pulls first?" },
      { by: 'b', say: "Whoever loses rock, paper, scissors." },
      { beat: '{a} throws rock. {b} throws paper, and climbs onto the sled with a smile.' },
      { by: 'a', say: "Best of three." },
    ] },
    { id: 'icr2.sl-s6', when: SL, turns: [
      { beat: '{a} steps into the harness and leans forward. The ropes creak. The sled does not move.' },
      { by: 'a', say: "Is the brake on? Does a sled have a brake?" },
      { by: 'b', say: "It's frozen to the ground. Kick it." },
    ] },
    { id: 'icr2.sl-s7', when: SL, turns: [
      { by: 'b', say: "First flag's that red dot. I think. Or it's a bird." },
      { by: 'a', say: "Pull towards the bird." },
      { by: 'b', say: "If it flies away, we're lost." },
    ] },
    { id: 'icr2.sl-s8', when: SL, turns: [
      { beat: '{b} settles on the sled, pulls a blanket over {b.posAdj} knees, and waves {a} on like a queen in a carriage.' },
      { by: 'b', say: "Onward." },
      { by: 'a', say: "Say onward one more time, and you're pulling." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'icr2.sl-f5', when: SL, turns: [
      { by: 'a', say: "Sing something. I pull better with a song." },
      { beat: '{b} sings the only song {b.sub} know all the words to, nine times in a row, and {a} pulls them flag to flag to the ice cliff.' },
      { by: 'a', say: "I never want to hear that song again. Thank you." },
    ] },
    { id: 'icr2.sl-f6', when: SL, turns: [
      { beat: 'The snow is hard and smooth, the flags are close together, and the sled slides behind {a} like it wants to go.' },
      { by: 'b', say: "Is it supposed to be this easy?" },
      { by: 'a', say: "Don't ask that. It hears you." },
      { beat: 'It doesn\'t hear them. They reach the ice cliff without a single tip.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'icr2.sl-a5', when: SL, turns: [
      { by: 'b', say: "We're both pulling now. Forget riding. Two in the harness." },
      { by: 'a', say: "The rules say one rides." },
      { by: 'b', say: "Then the sled rides. We pull it empty, and I get on at the end." },
      { beat: 'They pull it side by side, and {b} jumps on for the last few metres as it slides up to the ice cliff.' },
    ] },
    { id: 'icr2.sl-a6', when: SL, turns: [
      { beat: 'Back at the last flag again, {a} ties a scarf round the harness rope so it stops slipping out of {a.posAdj} frozen hands.' },
      { by: 'a', say: "Now I've got a grip. Now we go." },
      { beat: 'With a grip, {a} doesn\'t stop once, and the sled bumps up to the foot of the ice cliff.' },
      { by: 'b', say: "That scarf deserves a medal." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'icr2.sl-t4', when: SL, turns: [
      { beat: '{a} pulls and pulls, and {b} turns round on the sled to look back at how far they\'ve come. It is not far.' },
      { by: 'b', say: "I can still see the river." },
      { by: 'a', say: "Don't tell me that. Lie to me." },
    ] },
    { id: 'icr2.sl-t5', when: SL, turns: [
      { by: 'b', say: "You've slowed down. You're barely walking." },
      { by: 'a', say: "Want to swap?" },
      { by: 'b', say: "No. I want you to speed up." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'icr2.sl-x4', when: SL, turns: [
      { beat: 'The sled slides sideways down a slope, overtakes {a}, and drags {a} backwards down the hill by the harness.' },
      { by: 'a', say: "The sled is pulling me! That's the wrong way round!" },
      { by: 'b', say: "Back up to the last flag! Again!" },
    ] },
    { id: 'icr2.sl-x5', when: SL, turns: [
      { beat: 'They\'ve been following a flag for ten minutes when it flaps, stretches its wings and flies off.' },
      { by: 'b', say: "That was a bird. I told you it might be a bird." },
      { by: 'a', say: "Back to the last real flag. Don't speak to me." },
    ] },
  ],
  'task-done.any': [
    { id: 'icr2.sl-dn4', when: SL, turns: [
      { beat: '{a} drops the harness at the foot of the ice cliff and falls backwards into the snow, arms out.' },
      { by: 'b', say: "Are you making a snow angel?" },
      { by: 'a', say: "I'm making a snow nap." },
    ] },
    { id: 'icr2.sl-dn5', when: SL, turns: [
      { by: 'b', say: "We should take the sled home. Put it in the garden." },
      { by: 'a', say: "It doesn't snow where we live." },
      { by: 'b', say: "Then you can pull me across the grass." },
    ] },
    { id: 'icr2.sl-dn6', when: SL, turns: [
      { by: 'a', say: "Did the bear follow us? Look behind me. Don't make it obvious." },
      { beat: '{b} looks. Far away, the polar bear is lying on its back in the snow, asleep.' },
      { by: 'b', say: "It got bored of us." },
    ] },
  ],
};

export default mergePools(floes, sled);
