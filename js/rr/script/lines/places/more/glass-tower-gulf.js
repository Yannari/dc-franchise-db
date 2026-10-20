// Glass Tower Gulf, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/glass-tower-gulf.js: Squeegee is a whole column of windows from a
// swaying platform, checked by an inspector with a white glove; Serve is one ball from the toughest launcher in the
// world, returned inside the lines.
import { V, mergePools } from '../_kit.js';

const SQ = { taskId: 'squeegee-serve', side: 'squeegee' };
const SV = { taskId: 'squeegee-serve', side: 'serve' };
const SS = { taskId: 'squeegee-serve' };

const squeegeeServe = {
  'task-start.any': [
    { id: 'gtg2.ss-s1', when: SQ, turns: [
      { beat: 'A pigeon lands on the platform rail, looks at {a} and {b}, and decides it is safer to fly away.' },
      { by: 'a', say: "Even the pigeon doesn't want to be up here." },
      { by: 'b', say: "The pigeon has wings. We have a bucket. Start washing." },
    ] },
    { id: 'gtg2.ss-s2', when: SQ, turns: [
      { by: 'b', say: "Soap first, then squeegee. Soap, squeegee. Soap, squeegee." },
      { by: 'a', say: "Why are you saying it like a dance?" },
      { by: 'b', say: "Because if it's a dance I won't look down." },
    ] },
    { id: 'gtg2.ss-s3', when: SV, turns: [
      { beat: '{a} takes a practice swing. The racket slips out of {a.posAdj} sweaty hand and clatters across the court.' },
      { by: 'b', say: "Hold it tighter." },
      { by: 'a', say: "It's forty degrees up here. Everything's slippery. My soul is slippery." },
    ] },
    { id: 'gtg2.ss-s4', when: SV, turns: [
      { by: 'a', say: "Where does it aim? Does it aim at you, or just near you?" },
      { by: 'b', ...V("At you. It's been aiming at people all day.", "At you. All day.", "You.", "AT you! It's been aiming at people ALL DAY!", "At you, I think. It has been all day.", "It aims at your hopes. And then your knees.") },
      { by: 'a', say: "Then I'll stand somewhere else." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gtg2.ss-f1', when: SQ, turns: [
      { beat: 'The inspector leans out of the window, runs his white glove down their last pane, and holds it up. Still white.' },
      { by: 'a', say: "Still white! The glove's still white!" },
      { by: 'b', say: "First go! Frame that glove!" },
    ] },
    { id: 'gtg2.ss-f2', when: SQ, turns: [
      { by: 'b', say: "You do the top half of the pane, I do the bottom half. Then we move down." },
      { beat: 'They work down the column like a machine, never crossing each other\'s strokes. Every pane passes.' },
      { by: 'a', say: "We should do this for a living. On the ground." },
    ] },
    { id: 'gtg2.ss-f3', when: SV, turns: [
      { beat: 'The launcher fires. {a} squeals, ducks, and the ball hits the racket, held over {a.posAdj} head, and drops just over the net.' },
      { by: 'b', say: "It's in! You hid from it and it's in!" },
      { by: 'a', say: "That was the plan. That was totally the plan." },
    ] },
    { id: 'gtg2.ss-f4', when: SV, turns: [
      { by: 'b', say: "Watch the machine, not the ball. It twitches before it fires." },
      { beat: 'The machine twitches. {a} swings early, and the ball rockets back into the far corner, inside the line.' },
      { by: 'a', say: "It twitched! I saw it twitch!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gtg2.ss-a1', when: SQ, turns: [
      { by: 'a', say: "The streaks are from the sun. The soap dries before we wipe it. So we do one pane at a time, fast." },
      { beat: 'One pane at a time, soap and wipe before the sun can get to it. The glove comes back white.' },
      { by: 'b', say: "We beat the sun! Nobody beats the sun!" },
    ] },
    { id: 'gtg2.ss-a2', when: SQ, turns: [
      { beat: 'Back at the top for the second wash, {b} uses {b.posAdj} own sleeve on every corner the squeegee can\'t reach.' },
      { by: 'b', say: "It's always the corners. Nobody ever does the corners." },
      { beat: 'The inspector checks every corner. He nods.' },
    ] },
    { id: 'gtg2.ss-a3', when: SV, turns: [
      { by: 'b', say: "You're too close to the net. Back to the back line." },
      { by: 'a', say: "The back line is where the fence is." },
      { beat: 'From the back line, {a} gets a full second to see it coming, swings, and the ball lands in.' },
      { by: 'a', say: "A second! A whole second! Luxury!" },
    ] },
    { id: 'gtg2.ss-a4', when: SV, turns: [
      { beat: 'Eight balls in the fence. On the ninth, {a} simply holds the racket out flat, like a tray.' },
      { by: 'a', say: "I'm not swinging any more. I'm a wall." },
      { beat: 'The ball bounces off the wall and drops over the net, in.' },
      { by: 'b', say: "Be the wall! You were the wall!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'gtg2.ss-t1', when: SQ, turns: [
      { by: 'a', say: "There's a family having breakfast on the other side of this window." },
      { by: 'b', say: "Don't look at them. Wash." },
      { by: 'a', say: "The little one's waving. I have to wave back. It's the law." },
    ] },
    { id: 'gtg2.ss-t2', when: SV, turns: [
      { beat: '{a} stands in a ready crouch, bouncing on {a.posAdj} toes, while the launcher hums and does nothing.' },
      { by: 'a', say: "Why isn't it firing? It's waiting for me to relax." },
      { by: 'b', say: "Don't relax! That's what it wants!" },
    ] },
    { id: 'gtg2.ss-t3', when: SS, turns: [
      { by: 'b', say: "We could switch. The other side's waiting." },
      { by: 'a', say: "The other side is either a machine gun or a cliff made of glass." },
      { by: 'b', say: "And this side is also one of those." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gtg2.ss-x1', when: SQ, turns: [
      { beat: 'The squeegee slips out of {b}\'s hand, bounces off the rail and drops out of sight. A crew member passes up a new one.' },
      { by: 'b', say: "I'm not looking where it went." },
      { by: 'a', say: "Don't look! Go back up and do it again!" },
    ] },
    { id: 'gtg2.ss-x2', when: SQ, turns: [
      { beat: 'The inspector points at one pane in the middle of the column. There is a handprint on it. A big one.' },
      { by: 'a', say: "Who did that?" },
      { by: 'b', say: "You did that. You grabbed it when the wind came. Second wash." },
    ] },
    { id: 'gtg2.ss-x3', when: SV, turns: [
      { beat: '{a} returns the ball perfectly. It sails over the net, over the far line, and off the edge of the roof.' },
      { by: 'b', say: "That was a beautiful shot. Into the sea." },
      { by: 'a', say: "It was in my heart! Again!" },
    ] },
    { id: 'gtg2.ss-x4', when: SV, turns: [
      { beat: 'The ball hits the frame of the racket with a clang and spins straight up into the air.' },
      { by: 'a', say: "Is it coming down in? Please come down in!" },
      { beat: 'It comes down on {a}\'s head. Not in.' },
    ] },
  ],
  'task-done.any': [
    { id: 'gtg2.ss-dn1', when: SQ, turns: [
      { beat: 'The platform touches down on the roof with a bump. {a} steps off and lies flat on the warm concrete.' },
      { by: 'a', say: "Solid ground. I love you, ground." },
      { by: 'b', say: "It's a roof." },
      { by: 'a', say: "Don't ruin it." },
    ] },
    { id: 'gtg2.ss-dn2', when: SV, turns: [
      { by: 'a', say: "I'm going to wave at the machine. One last wave." },
      { by: 'b', say: "Don't! It'll fire!" },
      { beat: 'It fires. They run for the lift.' },
    ] },
    { id: 'gtg2.ss-dn3', when: SS, turns: [
      { by: 'b', say: "Gold market next. Anything we touch costs a year of our wages." },
      { by: 'a', say: "Then we don't touch anything. We point with our elbows." },
      { by: 'b', say: "Elbows only. Good plan." },
    ] },
  ],
};

export default mergePools(squeegeeServe);
