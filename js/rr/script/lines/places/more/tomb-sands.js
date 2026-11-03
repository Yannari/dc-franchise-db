// Tomb Sands, second batch of challenge lines. Same rules as places/tomb-sands.js: the pyramid is an Either/Or
// (over the steps, or under through the tomb), so its start and try lines gate on the side.
import { V, mergePools } from '../_kit.js';

const OVER = { taskId: 'pyramid', side: 'over' };
const UNDER = { taskId: 'pyramid', side: 'under' };
const PY = { taskId: 'pyramid' };
const CM = { taskId: 'tomb-camel' };
const RB = { taskId: 'reed-boat' };

const pyramid = {
  'task-start.any': [
    { id: 'tms2.ov-s1', when: OVER, turns: [
      { beat: '{a} hauls {a.ref} up onto the first giant step and reaches a hand down for {b}.' },
      { by: 'a', say: "Grab on. One step at a time." },
      { by: 'b', say: "That's going to take forever." },
      { by: 'a', say: "Then we'd better start." },
    ] },
    { id: 'tms2.ov-s2', when: OVER, turns: [
      { by: 'b', ...V("The stones are hot. They're really hot. I can feel it through my gloves.", "The stones are burning.", "Hot. Very hot.", "The stones are HOT! I can feel it through my GLOVES!", "These stones are really hot, I can feel it through my gloves.", "The pyramid has been sunbathing for four thousand years.") },
      { by: 'a', say: "Then don't stop on them. Keep moving." },
      { by: 'b', say: "Okay. Okay." },
    ] },
    { id: 'tms2.un-s1', when: UNDER, turns: [
      { beat: 'The tomb door creaks shut behind {a} and {b}. Their torch flickers.' },
      { by: 'b', say: "Did the door just close by itself?" },
      { by: 'a', say: "It's the wind. Keep going." },
      { by: 'b', say: "I don't like this." },
    ] },
    { id: 'tms2.un-s2', when: UNDER, turns: [
      { by: 'a', say: "Pictures on every wall. They're telling a story." },
      { by: 'b', say: "What story?" },
      { by: 'a', say: "I don't know. Let's just find the way out." },
      { by: 'b', say: "Okay. Keep going." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tms2.ov-f1', when: OVER, turns: [
      { beat: '{a} and {b} climb in perfect rhythm, one boosting, the other pulling, all the way to the top.' },
      { by: 'b', say: "We're doing it!" },
      { by: 'a', say: "Now we have to get down." },
    ] },
    { id: 'tms2.ov-f2', when: OVER, turns: [
      { by: 'a', say: "Don't look at the top. Just look at the next step." },
      { beat: 'Step after step, they never look up, until suddenly there are no more steps.' },
      { by: 'b', say: "We're at the top? Already? I didn't even notice!" },
    ] },
    { id: 'tms2.un-f1', when: UNDER, turns: [
      { beat: '{b} spots a scratch on the floor in front of one of the doorways.' },
      { by: 'b', say: "Look. Footprints. Somebody's been this way and come back out." },
      { by: 'a', say: "Then follow them." },
      { beat: 'The footprints lead them straight out into the sun.' },
    ] },
    { id: 'tms2.un-f2', when: UNDER, turns: [
      { by: 'a', say: "There's something in that corner. Wrapped in bandages." },
      { by: 'b', say: "Don't stop. Don't look. It's just a statue." },
      { beat: 'They walk past it without looking, and the corridor ends in daylight.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tms2.ov-a1', when: OVER, turns: [
      { beat: 'Halfway up, {b} sits down on a step and won\'t get up.' },
      { by: 'b', say: "I need one minute. One minute, sitting on a pyramid." },
      { by: 'a', say: "You get thirty seconds, and then I'm pulling." },
      { beat: 'Thirty seconds, one pull, and they reach the top.' },
    ] },
    { id: 'tms2.ov-a2', when: OVER, turns: [
      { by: 'a', say: "Back down the far side. Feet first. Slowly." },
      { by: 'b', say: "That's how I slipped last time." },
      { by: 'a', say: "Then sit down and slide off each step." },
      { beat: 'Sitting and sliding down, they make it all the way.' },
    ] },
    { id: 'tms2.un-a1', when: UNDER, turns: [
      { beat: 'Scarabs pour out of a crack in the wall. {a} and {b} back away, then turn and run the other way.' },
      { by: 'b', say: "Not that way! Back!" },
      { by: 'a', say: "Then the other doorway. The last one. It has to be." },
      { beat: 'It\'s the right one.' },
    ] },
    { id: 'tms2.un-a2', when: UNDER, turns: [
      { by: 'a', say: "Stop. Look at the symbols again. The eye was on the tip." },
      { by: 'b', say: "There was an eye on the tip?" },
      { by: 'a', say: "Tiny. In the corner. We should have read it properly." },
      { beat: 'The eye doorway leads out of the tomb.' },
    ] },
  ],
  'task-done.any': [
    { id: 'tms2.py-dn1', when: PY, turns: [
      { by: 'a', say: "Four thousand years old, and we climbed it." },
      { by: 'b', say: "My legs are dead." },
      { by: 'a', say: "We did it, though." },
    ] },
    { id: 'tms2.py-dn2', when: PY, turns: [
      { beat: '{a} and {b} stagger out on the far side of the pyramid. A camel handler waves them over.' },
      { by: 'b', say: "Please tell me the camel does the walking." },
      { by: 'a', say: "The camel does the walking." },
    ] },
    { id: 'tms2.py-dn3', when: PY, turns: [
      { by: 'b', say: "Take a picture of me. With the pyramid." },
      { by: 'a', say: "We don't have a camera. They took everything at the start." },
      { by: 'b', say: "Then I'll just remember it." },
    ] },
    { id: 'tms2.py-dn4', when: PY, turns: [
      { beat: '{a} pours a small heap of sand out of each shoe.' },
      { by: 'a', say: "There's so much sand in my shoes." },
      { by: 'b', say: "Mine too." },
    ] },
  ],
};

const camel = {
  'ride.any': [
    { id: 'tms2.cm-r1', when: CM, turns: [
      { beat: 'The camel stops to chew on a dry bush and won\'t move until it\'s finished.' },
      { by: 'a', say: "It's eating. In the middle of a race." },
      { by: 'b', say: "I'm so hungry too." },
    ] },
    { id: 'tms2.cm-r2', when: CM, turns: [
      { by: 'b', say: "Hold me tighter. I'm sliding off the back." },
      { by: 'a', say: "Hold on to me. I've got you." },
      { by: 'b', say: "Okay. Thank you." },
    ] },
    { id: 'tms2.cm-r3', when: CM, turns: [
      { beat: 'The dunes go on and on, each one the same as the last, the sun beating down.' },
      { by: 'a', say: "Have we passed that dune before?" },
      { by: 'b', say: "They all look the same. Just trust the camel." },
    ] },
    { id: 'tms2.cm-r4', when: CM, turns: [
      { by: 'a', say: "Its breath. Have you smelled its breath?" },
      { by: 'b', say: "Every time it turns round." },
      { by: 'a', say: "Just keep going." },
    ] },
  ],
};

const reed = {
  'task-start.any': [
    { id: 'tms2.rb-s1', when: RB, turns: [
      { by: 'a', say: "The reeds are sharp. Mind your fingers." },
      { by: 'b', say: "Too late. I've cut my finger." },
      { by: 'a', say: "Wrap it. Keep going." },
    ] },
    { id: 'tms2.rb-s2', when: RB, turns: [
      { beat: '{b} lies down on the pile of reeds to see if it\'s long enough.' },
      { by: 'b', say: "It's as long as me. Is that enough?" },
      { by: 'a', say: "It has to be as long as both of us." },
      { by: 'b', say: "Then we need more reeds." },
    ] },
    { id: 'tms2.rb-s3', when: RB, turns: [
      { by: 'a', say: "Front, back, sides. A boat's just a big bundle with a pointy front." },
      { by: 'b', say: "Do you know that?" },
      { by: 'a', say: "No. But it makes sense." },
    ] },
    { id: 'tms2.rb-s4', when: RB, turns: [
      { beat: 'At the next bundle along, another team has already launched their boat.' },
      { by: 'b', say: "They're already on the water!" },
      { by: 'a', say: "Let's just build ours." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tms2.rb-f1', when: RB, turns: [
      { beat: 'The reed boat glides out onto the river as smooth as a canoe.' },
      { by: 'a', say: "It's actually good. We built a good boat." },
      { by: 'b', say: "Don't say it out loud. You'll jinx it." },
      { beat: 'They land on the far bank, dry.' },
    ] },
    { id: 'tms2.rb-f2', when: RB, turns: [
      { by: 'b', say: "Paddle together. Left, right. Left, right." },
      { by: 'a', say: "Your left or my left?" },
      { by: 'b', say: "Just copy me!" },
      { beat: 'Copying works. They paddle straight across without spinning once.' },
    ] },
    { id: 'tms2.rb-f3', when: RB, turns: [
      { beat: 'A crocodile surfaces right beside the boat, and sinks again.' },
      { by: 'a', say: "Did you see that?" },
      { by: 'b', say: "Who cares? Paddle!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tms2.rb-a1', when: RB, turns: [
      { beat: 'The second boat starts sinking at the back. {a} and {b} shuffle to the front and paddle like mad.' },
      { by: 'b', say: "Faster! It's sinking from the back!" },
      { by: 'a', say: "Then paddle faster!" },
      { beat: 'They make it to the far bank, just.' },
    ] },
    { id: 'tms2.rb-a2', when: RB, turns: [
      { by: 'a', say: "The ropes slipped. We tied them round the outside." },
      { by: 'b', say: "Where should they go?" },
      { by: 'a', say: "Through the middle. Like stitches." },
      { beat: 'Stitched through the middle, the new boat holds together all the way across.' },
    ] },
    { id: 'tms2.rb-a3', when: RB, turns: [
      { beat: '{a} and {b} wring out their clothes on the bank and start again from a fresh pile of reeds.' },
      { by: 'b', say: "We know what we're doing now." },
      { by: 'a', say: "This one won't sink." },
    ] },
    { id: 'tms2.rb-a4', when: RB, turns: [
      { by: 'b', say: "One of us paddles. The other one bails." },
      { by: 'a', say: "With what?" },
      { by: 'b', say: "Your hat." },
      { beat: 'One paddles, one bails with a hat, and the boat makes it to the far bank.' },
    ] },
  ],
  'task-done.any': [
    { id: 'tms2.rb-dn1', when: RB, turns: [
      { by: 'b', say: "Should we take the boat with us?" },
      { by: 'a', say: "It's falling apart." },
      { by: 'b', say: "It got us here, though." },
    ] },
    { id: 'tms2.rb-dn2', when: RB, turns: [
      { beat: '{a} and {b} jump onto the far bank and run, without looking back at the water.' },
      { by: 'a', say: "Don't look at the river. Never look at the river again." },
      { by: 'b', say: "What's in the river?" },
      { by: 'a', say: "Crocodiles. Just run." },
    ] },
    { id: 'tms2.rb-dn3', when: RB, turns: [
      { by: 'a', say: "We built a boat out of reeds and crossed a river full of crocodiles." },
      { by: 'b', say: "Nobody's going to believe us." },
      { by: 'a', say: "I can't believe it." },
    ] },
    { id: 'tms2.rb-dn4', when: RB, turns: [
      { beat: 'The tip is pinned to a post on the bank, wet from the river spray.' },
      { by: 'b', say: "The Chill Zone. It's back at the pyramid." },
      { by: 'a', say: "Okay. Let's go." },
    ] },
    { id: 'tms2.rb-dn5', when: RB, turns: [
      { by: 'b', say: "I'm soaked, I'm covered in sand, and I smell like a camel." },
      { by: 'a', say: "You look great, though." },
      { by: 'b', say: "Thanks. Come on." },
    ] },
  ],
};

export default mergePools(pyramid, camel, reed);
