// Swamp Prison, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/swamp-prison.js: in the cell, four ways out (the spoon and the soft
// wall, the guard, the hidden key, the air vent); on the bank, a raft from the junk pile, sailed down the river to the
// dock, where the Chill Zone is.
import { V, mergePools } from '../_kit.js';

const CL = { taskId: 'prison-cell' };
const RF = { taskId: 'swamp-raft' };

const cell = {
  'task-start.any': [
    { id: 'swp2.cl-s1', when: CL, turns: [
      { beat: '{a} sits on the bunk. It creaks, sags, and a cloud of dust rises out of the mattress.' },
      { by: 'a', say: "This place is so old." },
      { by: 'b', say: "Get up and search. Come on." },
    ] },
    { id: 'swp2.cl-s2', when: CL, turns: [
      { by: 'b', say: "We split it. You try the guard, I try the walls." },
      { by: 'a', say: "Why do I get the guard?" },
      { by: 'b', say: "Because you're good at talking." },
    ] },
    { id: 'swp2.cl-s3', when: CL, turns: [
      { beat: '{a} picks up the spoon from the tin plate and holds it up.' },
      { by: 'a', say: "This could be our way out." },
      { by: 'b', say: "That's a teaspoon. It's so small." },
    ] },
    { id: 'swp2.cl-s4', when: CL, turns: [
      { by: 'a', say: "How long would it take to dig out with that?" },
      { by: 'b', say: "Too long. Try the walls first." },
      { by: 'a', say: "Okay. I'll find the soft spot." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'swp2.cl-f1', when: CL, turns: [
      { beat: '{b} reaches straight up and lifts the lampshade. Taped inside it is a key.' },
      { by: 'a', say: "How did you know?" },
      { by: 'b', say: "My dad hides the spare key there. Every time. Let's go." },
    ] },
    { id: 'swp2.cl-f2', when: CL, turns: [
      { by: 'a', say: "Sir. Are you having a long day?" },
      { beat: 'The guard opens his mouth to answer, closes it again, sighs from somewhere very deep, and unlocks the door.' },
      { by: 'b', say: "What did you say to him?" },
      { by: 'a', say: "I just asked how his day was." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'swp2.cl-a1', when: CL, turns: [
      { by: 'b', say: "Stop digging where it's dry. Dig where it's damp. Damp is soft." },
      { beat: '{a} moves the spoon to a dark, damp patch near the floor. The brick there crumbles away, and daylight pours in.' },
      { by: 'a', say: "That's it! It's coming away!" },
    ] },
    { id: 'swp2.cl-a2', when: CL, turns: [
      { beat: 'After three sad stories, {a} tries a joke instead. It is a terrible joke.' },
      { by: 'b', say: "That's your best joke?" },
      { beat: 'The guard snorts, tries to hold it in, snorts again, and opens the cell door just so he can walk away and laugh.' },
      { by: 'a', say: "It worked, didn't it?" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'swp2.cl-t1', when: CL, turns: [
      { by: 'a', say: "The spoon's bent." },
      { by: 'b', say: "Bend it back!" },
      { by: 'a', say: "If I bend it back, it'll snap!" },
    ] },
    { id: 'swp2.cl-t2', when: CL, turns: [
      { beat: 'From the next cell, another team cheers. Their door clangs open. {a} and {b} stand at their own bars, listening.' },
      { by: 'b', say: "How did they get out?" },
      { by: 'a', say: "I don't know. I'm not asking. We'll get there." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'swp2.cl-x1', when: CL, turns: [
      { beat: '{a} wriggles up into the air vent, crawls ten feet, and comes face to face with a grille that\'s welded shut.' },
      { by: 'a', say: "Dead end! Back out! Back out backwards!" },
      { by: 'b', say: "Feet first, then. Try something else." },
    ] },
    { id: 'swp2.cl-x2', when: CL, turns: [
      { beat: '{b} pulls a key out from behind the toilet, shoves it in the lock and turns. It doesn\'t turn. It\'s a key to something else.' },
      { by: 'b', say: "Then what does this one open?" },
      { by: 'a', say: "Nothing in here. Keep looking." },
    ] },
  ],
  'task-done.any': [
    { id: 'swp2.cl-dn1', when: CL, turns: [
      { by: 'a', say: "I'm keeping the spoon." },
      { by: 'b', say: "Leave the spoon. Let's go." },
      { by: 'a', say: "Fine. Bye, spoon." },
    ] },
    { id: 'swp2.cl-dn2', when: CL, turns: [
      { beat: '{a} and {b} sprint past the guard on the way to the gate. He tips his cap to them.' },
      { by: 'b', say: "Did he just say goodbye?" },
      { by: 'a', say: "Don't look back. Just go." },
    ] },
    { id: 'swp2.cl-dn3', when: CL, turns: [
      { by: 'b', say: "Tip says build a raft. Out of junk. To the dock." },
      { by: 'a', say: "Out of jail and straight into a swamp." },
      { by: 'b', say: "It smells so bad out here." },
    ] },
  ],
};

const raft = {
  'task-start.any': [
    { id: 'swp2.rf-s1', when: RF, turns: [
      { beat: '{a} rolls a barrel into the shallows. It floats. {a} stands on it. It stops floating.' },
      { by: 'a', say: "One barrel's not enough." },
      { by: 'b', say: "We need more. At least four." },
    ] },
    { id: 'swp2.rf-s2', when: RF, turns: [
      { by: 'b', say: "Four barrels. One on each corner." },
      { by: 'a', say: "And the door on top." },
      { by: 'b', say: "And the door on top. Tie everything." },
    ] },
    { id: 'swp2.rf-s3', when: RF, turns: [
      { beat: 'Something long and lumpy drifts past in the brown water, very slowly. It might be a log.' },
      { by: 'a', say: "Was that a log?" },
      { by: 'b', say: "It was a log. Build faster." },
    ] },
    { id: 'swp2.rf-s4', when: RF, turns: [
      { by: 'a', say: "Is it ready? Can we go?" },
      { by: 'b', say: "One more knot. Then we go." },
      { by: 'a', say: "Okay. Hurry." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'swp2.rf-f1', when: RF, turns: [
      { beat: '{a} and {b} push off from the bank. The raft sits flat and steady on the water, and doesn\'t even rock.' },
      { by: 'b', say: "It floats! It floats like a real boat!" },
      { by: 'a', say: "Don't say that. Not yet." },
    ] },
    { id: 'swp2.rf-f2', when: RF, turns: [
      { by: 'a', say: "Paddle together. Left, right. Left, right." },
      { beat: 'Left, right, all the way down the river, round the cypress trees and up to the dock without a single bump.' },
      { by: 'b', say: "We're so good at this!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'swp2.rf-a1', when: RF, turns: [
      { by: 'b', say: "The ropes keep slipping because the planks are wet. Tie them on the dry bank and carry it in." },
      { beat: 'They build it on the bank, tie everything tight, and drag the whole thing into the river. It holds, all the way to the dock.' },
      { by: 'a', say: "It held! It's holding!" },
    ] },
    { id: 'swp2.rf-a2', when: RF, turns: [
      { beat: 'The second raft has {a} at the front with a long pole, pushing off the bottom of the river.' },
      { by: 'a', say: "It's shallow! We don't paddle, we push!" },
      { by: 'b', say: "Push us to the dock, then!" },
      { beat: '{a} pushes them all the way to the dock.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'swp2.rf-t1', when: RF, turns: [
      { by: 'a', say: "Something just touched my foot under the water." },
      { by: 'b', say: "Was it a fish?" },
      { by: 'a', say: "I don't want to know what it was. Paddle." },
    ] },
    { id: 'swp2.rf-t2', when: RF, turns: [
      { beat: 'The raft is going down the river sideways, very slowly, while {a} and {b} paddle in two different directions.' },
      { by: 'b', say: "We're going sideways." },
      { by: 'a', say: "Stop! Same side! Paddle on the same side!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'swp2.rf-x1', when: RF, turns: [
      { beat: '{b} climbs onto the raft. The barrels roll out from underneath it like marbles, and the door lands flat in the water.' },
      { by: 'b', say: "I barely touched it!" },
      { by: 'a', say: "Fish out the barrels! We go again!" },
    ] },
    { id: 'swp2.rf-x2', when: RF, turns: [
      { beat: 'The current pulls the raft into a low branch. It scrapes {a} straight off the back into the river.' },
      { by: 'a', say: "The branch! I didn't see the branch!" },
      { by: 'b', say: "Swim back! I'll bring what's left of the raft!" },
    ] },
  ],
  'task-done.any': [
    { id: 'swp2.rf-dn1', when: RF, turns: [
      { beat: '{a} steps off the raft onto the dock, and behind them, the raft starts to come apart.' },
      { by: 'b', say: "Did you see that? Just in time." },
      { by: 'a', say: "It lasted just long enough." },
    ] },
    { id: 'swp2.rf-dn2', when: RF, turns: [
      { by: 'a', say: "We actually built a boat." },
      { by: 'b', say: "And it actually floated." },
      { by: 'a', say: "Come on. Don's waiting." },
    ] },
    { id: 'swp2.rf-dn3', when: RF, turns: [
      { beat: '{a} and {b} climb onto the dock, green with swamp weed from the knees down.' },
      { by: 'b', say: "We're covered in swamp." },
      { by: 'a', say: "I don't care. Come on. We're nearly there." },
    ] },
  ],
};

export default mergePools(cell, raft);
