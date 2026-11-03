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
      { beat: 'A pigeon lands on the platform rail, then flies away.' },
      { by: 'a', say: "I don't want to be up here." },
      { by: 'b', say: "I know. Start washing. The faster we go, the faster it's over." },
    ] },
    { id: 'gtg2.ss-s2', when: SQ, turns: [
      { by: 'b', say: "Soap first, then squeegee. Soap, squeegee. Soap, squeegee." },
      { by: 'a', say: "Okay. Soap, squeegee." },
      { by: 'b', say: "Keep saying it. It stops me looking down." },
    ] },
    { id: 'gtg2.ss-s3', when: SV, turns: [
      { beat: '{a} takes a practice swing. The racket slips out of {a.posAdj} sweaty hand and clatters across the court.' },
      { by: 'b', say: "Hold it tighter." },
      { by: 'a', say: "It's forty degrees up here. My hands are so sweaty." },
    ] },
    { id: 'gtg2.ss-s4', when: SV, turns: [
      { by: 'a', say: "Where does it aim? Does it aim at you, or just near you?" },
      { by: 'b', say: "At you, I think." },
      { by: 'a', say: "Great." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gtg2.ss-f1', when: SQ, turns: [
      { beat: 'The inspector leans out of the window, runs his white glove down their last pane, and holds it up. Still white.' },
      { by: 'a', say: "It's clean! It's still white!" },
      { by: 'b', say: "First go!" },
    ] },
    { id: 'gtg2.ss-f2', when: SQ, turns: [
      { by: 'b', say: "You do the top half of the pane, I do the bottom half. Then we move down." },
      { beat: 'They work down the column together, never crossing each other\'s strokes. Every pane passes.' },
      { by: 'a', say: "We're actually good at this." },
    ] },
    { id: 'gtg2.ss-f3', when: SV, turns: [
      { beat: 'The launcher fires. {a} ducks, and the ball hits the racket, held over {a.posAdj} head, and drops just over the net.' },
      { by: 'b', say: "It's in! It's in!" },
      { by: 'a', say: "I can't believe that worked!" },
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
      { by: 'b', say: "It worked! No streaks!" },
    ] },
    { id: 'gtg2.ss-a2', when: SQ, turns: [
      { beat: 'Back at the top for the second wash, {b} uses {b.posAdj} own sleeve on every corner the squeegee can\'t reach.' },
      { by: 'b', say: "It's always the corners." },
      { beat: 'The inspector checks every corner. He nods.' },
    ] },
    { id: 'gtg2.ss-a3', when: SV, turns: [
      { by: 'b', say: "You're too close to the net. Back to the back line." },
      { by: 'a', say: "The back line is where the fence is." },
      { beat: 'From the back line, {a} gets a full second to see it coming, swings, and the ball lands in.' },
      { by: 'a', say: "I had time to see it!" },
    ] },
    { id: 'gtg2.ss-a4', when: SV, turns: [
      { beat: 'Eight balls in the fence. On the ninth, {a} just holds the racket out flat.' },
      { by: 'a', say: "I'm not swinging any more. I'm just holding it." },
      { beat: 'The ball bounces off the racket and drops over the net, in.' },
      { by: 'b', say: "That's it! It worked!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'gtg2.ss-t1', when: SQ, turns: [
      { by: 'a', say: "There's a family having breakfast on the other side of this window." },
      { by: 'b', say: "Don't look at them. Wash." },
      { by: 'a', say: "The little one's waving. I have to wave back." },
    ] },
    { id: 'gtg2.ss-t2', when: SV, turns: [
      { beat: '{a} stands in a ready crouch, bouncing on {a.posAdj} toes, while the launcher hums and does nothing.' },
      { by: 'a', say: "Why isn't it firing?" },
      { by: 'b', say: "Just stay ready!" },
    ] },
    { id: 'gtg2.ss-t3', when: SS, turns: [
      { by: 'b', say: "We could switch. The other side's waiting." },
      { by: 'a', say: "The other side is worse." },
      { by: 'b', say: "Okay. We stay." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gtg2.ss-x1', when: SQ, turns: [
      { beat: 'The squeegee slips out of {b}\'s hand, bounces off the rail and drops out of sight. A crew member passes up a new one.' },
      { by: 'b', say: "I'm not looking where it went." },
      { by: 'a', say: "Don't look! Go back up and do it again!" },
    ] },
    { id: 'gtg2.ss-x2', when: SQ, turns: [
      { beat: 'The inspector points at one pane in the middle of the column. There\'s a handprint on it.' },
      { by: 'a', say: "Who did that?" },
      { by: 'b', say: "You did that. You grabbed it when the wind came. Second wash." },
    ] },
    { id: 'gtg2.ss-x3', when: SV, turns: [
      { beat: '{a} returns the ball perfectly. It sails over the net, over the far line, and off the edge of the roof.' },
      { by: 'b', say: "That was a good shot. But it's out." },
      { by: 'a', say: "So close! Again!" },
    ] },
    { id: 'gtg2.ss-x4', when: SV, turns: [
      { beat: 'The ball hits the frame of the racket with a clang and spins straight up into the air.' },
      { by: 'a', say: "Is it coming down in? Please come down in!" },
      { beat: 'It comes down outside the line.' },
    ] },
  ],
  'task-done.any': [
    { id: 'gtg2.ss-dn1', when: SQ, turns: [
      { beat: 'The platform touches down on the roof with a bump. {a} steps off and lies flat on the warm concrete.' },
      { by: 'a', say: "Solid ground. Finally." },
      { by: 'b', say: "We're still on the roof." },
      { by: 'a', say: "I don't care. It's solid." },
    ] },
    { id: 'gtg2.ss-dn2', when: SV, turns: [
      { by: 'a', say: "Bye, machine." },
      { by: 'b', say: "Don't stand in front of it!" },
      { beat: 'They run for the lift.' },
    ] },
    { id: 'gtg2.ss-dn3', when: SS, turns: [
      { by: 'b', say: "Gold market next. Don't touch anything." },
      { by: 'a', say: "I won't. I promise." },
      { by: 'b', say: "Good. Let's go." },
    ] },
  ],
};

export default mergePools(squeegeeServe);
