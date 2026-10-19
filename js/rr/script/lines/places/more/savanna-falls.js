// Savanna Falls, second batch of challenge lines. Same rules as places/savanna-falls.js: a poses with the rhino,
// b takes the photo.
import { V, mergePools } from '../_kit.js';

const FS = { taskId: 'falls-selfie' };
const RH = { taskId: 'rhino' };

const falls = {
  'task-start.any': [
    { id: 'svf2.fs-s1', when: FS, turns: [
      { beat: 'The raft wobbles in the fast water above the falls. Spray drifts up over the edge like smoke.' },
      { by: 'b', say: "You can't even see the bottom. It's just mist." },
      { by: 'a', say: "Good. If I can't see it, it isn't there." },
    ] },
    { id: 'svf2.fs-s2', when: FS, turns: [
      { by: 'a', say: "Practise the face now. Show me your selfie face." },
      { beat: '{b} pulls a big, bright, terrified smile.' },
      { by: 'a', say: "Perfect. Do that on the way down." },
    ] },
    { id: 'svf2.fs-s3', when: FS, turns: [
      { by: 'b', ...V("Strap the camera to your wrist. If you drop it, we're doing this twice.", "Strap it to your wrist.", "Wrist strap. Now.", "STRAP it to your WRIST! Drop it and we do this TWICE!", "Please strap the camera to your wrist, or we'll be doing this twice.", "The camera and your wrist are now married.") },
      { by: 'a', say: "Strapped. Double strapped." },
      { by: 'b', say: "Triple it." },
    ] },
    { id: 'svf2.fs-s4', when: FS, turns: [
      { beat: 'Right at the edge, the raft stops for one long second, hanging in the air.' },
      { by: 'a', say: "Why have we stopped?" },
      { by: 'b', say: "We haven't stopped. We're about to very much not stop." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'svf2.fs-f1', when: FS, turns: [
      { beat: 'Over the edge, {a} holds the camera out at arm\'s length and clicks, again and again, all the way down.' },
      { by: 'b', say: "How many did you take?" },
      { by: 'a', say: "About forty. One of them has to be good." },
      { beat: 'One of them is perfect.' },
    ] },
    { id: 'svf2.fs-f2', when: FS, turns: [
      { by: 'b', say: "Lean in! Cheek to cheek!" },
      { beat: '{a} and {b} squash their faces together as the raft drops. Click.' },
      { by: 'a', say: "That's the closest we've ever been." },
      { by: 'b', say: "And we were falling off a waterfall." },
    ] },
    { id: 'svf2.fs-f3', when: FS, turns: [
      { beat: 'The raft lands with a huge splash and bobs back up. {a} holds the camera up out of the water.' },
      { by: 'a', say: "It's dry! The camera's dry! I'm not, but it is!" },
      { by: 'b', say: "Priorities. Good." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'svf2.fs-a1', when: FS, turns: [
      { by: 'b', say: "We're carrying this raft up the hill again." },
      { by: 'a', say: "We're carrying it up the hill again, and this time I'm not closing my eyes." },
      { beat: 'Eyes open, camera out, and this time both faces are in the picture.' },
    ] },
    { id: 'svf2.fs-a2', when: FS, turns: [
      { beat: 'The crew member shows them the last photo: a blur of white water and one ear.' },
      { by: 'a', say: "Whose ear is that?" },
      { by: 'b', say: "Does it matter? It's not a face!" },
      { by: 'a', say: "Next time, faces. Not ears." },
    ] },
    { id: 'svf2.fs-a3', when: FS, turns: [
      { by: 'a', ...V("You take it this time. My hands are shaking too much.", "You take it this time.", "You. Camera.", "YOU take it this time! My hands are SHAKING!", "Would you take it this time? My hands are shaking too much.", "My hands have resigned. You are the photographer now.") },
      { by: 'b', say: "Give it here." },
      { beat: '{b}\'s hands are steady all the way down. The picture is sharp.' },
    ] },
    { id: 'svf2.fs-a4', when: FS, turns: [
      { beat: '{a} and {b} sit in the raft at the top for the third time, completely soaked.' },
      { by: 'b', say: "We know what happens. We fall, we scream, we click." },
      { by: 'a', say: "Fall, scream, click." },
      { beat: 'Fall, scream, click. Both faces, in focus.' },
    ] },
  ],
  'task-done.any': [
    { id: 'svf2.fs-dn1', when: FS, turns: [
      { by: 'a', say: "Can we keep the photo? I want it on my wall." },
      { by: 'b', say: "You look like you're being eaten by the water." },
      { by: 'a', say: "Exactly. That's why I want it on my wall." },
    ] },
    { id: 'svf2.fs-dn2', when: FS, turns: [
      { beat: '{a} and {b} drag the raft out of the pool at the bottom and collapse on the rocks.' },
      { by: 'b', say: "I've got water in places I didn't know I had." },
      { by: 'a', say: "Get up. The tip. Get the tip." },
    ] },
    { id: 'svf2.fs-dn3', when: FS, turns: [
      { by: 'b', say: "My heart's still going a hundred miles an hour." },
      { by: 'a', say: "Mine stopped somewhere near the top." },
      { by: 'b', say: "Well, start it again. We've got to run." },
    ] },
    { id: 'svf2.fs-dn4', when: FS, turns: [
      { beat: 'A rainbow hangs in the spray over the pool as {a} and {b} climb out.' },
      { by: 'a', say: "Look. A rainbow." },
      { by: 'b', say: "We nearly died and we got a rainbow." },
      { by: 'a', say: "That's a good deal." },
    ] },
    { id: 'svf2.fs-dn5', when: FS, turns: [
      { by: 'a', say: "I'm going to tell everyone I wasn't scared." },
      { by: 'b', say: "There's a photo." },
      { by: 'a', say: "I'll say it's someone else." },
    ] },
  ],
};

const rhino = {
  'task-start.any': [
    { id: 'svf2.rh-s1', when: RH, turns: [
      { beat: 'The ranger points at a line of white stones on the grass and says something firm.' },
      { by: 'b', say: "We can't go past the stones. Only the poser can." },
      { by: 'a', say: "So it's just me and the rhino." },
      { by: 'b', say: "And me. With a camera. Far away." },
    ] },
    { id: 'svf2.rh-s2', when: RH, turns: [
      { by: 'a', say: "How do I look? Do I look calm?" },
      { by: 'b', ...V("You look like someone about to stand next to a rhino.", "You look nervous.", "Nervous.", "You look like someone about to stand next to a RHINO!", "You look exactly like someone about to stand next to a rhino.", "You look like a snack that's trying to be brave.") },
      { by: 'a', say: "Then I look right." },
    ] },
    { id: 'svf2.rh-s3', when: RH, turns: [
      { beat: 'The rhino lifts its head, sniffs the air, and goes back to eating grass.' },
      { by: 'a', say: "Did it smell me? It smelled me." },
      { by: 'b', say: "It smelled you and decided you weren't interesting. That's good!" },
    ] },
    { id: 'svf2.rh-s4', when: RH, turns: [
      { by: 'b', say: "Walk like you belong here." },
      { by: 'a', say: "I don't belong here. Nobody belongs next to a rhino." },
      { by: 'b', say: "The rhino does. Walk like the rhino." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'svf2.rh-f1', when: RH, turns: [
      { beat: '{a} steps up beside the rhino, gives a small thumbs up, and holds very still. Click.' },
      { by: 'b', say: "That's it! That's the picture!" },
      { by: 'a', say: "I'm going to walk away now. Very slowly. Don't cheer." },
    ] },
    { id: 'svf2.rh-f2', when: RH, turns: [
      { by: 'b', say: "Smile! Big smile! Not that big!" },
      { beat: '{a} tones it down to a small, polite smile. The rhino keeps chewing. Click.' },
      { by: 'a', say: "Was that one okay?" },
      { by: 'b', say: "You look like you're at a wedding. A rhino wedding. It's perfect." },
    ] },
    { id: 'svf2.rh-f3', when: RH, turns: [
      { beat: 'A small bird hops onto the rhino\'s back just as {b} takes the picture.' },
      { by: 'b', say: "There's a bird in it! It's even better with a bird!" },
      { by: 'a', say: "Can I come back now? Please?" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'svf2.rh-a1', when: RH, turns: [
      { by: 'b', say: "You keep walking straight at it. Come in from the side." },
      { by: 'a', say: "Why the side?" },
      { by: 'b', say: "Because it can't see you as well from the side. The ranger said." },
      { beat: 'From the side, the rhino barely notices. Click.' },
    ] },
    { id: 'svf2.rh-a2', when: RH, turns: [
      { beat: 'The rhino snorts and stamps once. {a} is back behind the stones before anyone can blink.' },
      { by: 'a', say: "It stamped! It actually stamped!" },
      { by: 'b', say: "Wait for it to calm down. Then try again. Slower." },
      { beat: 'Slower works. The second picture is perfect.' },
    ] },
    { id: 'svf2.rh-a3', when: RH, turns: [
      { by: 'a', ...V("I'm going to pretend it's a cow. A big grey cow.", "It's a cow. A big cow.", "Cow. Grey cow.", "It's a COW! A big GREY COW!", "I'll just pretend it's a very big grey cow.", "It's a cow with a very serious horn.") },
      { by: 'b', say: "Whatever works." },
      { beat: 'Pretending it\'s a cow works. {a} stands right beside it and the camera clicks.' },
    ] },
    { id: 'svf2.rh-a4', when: RH, turns: [
      { by: 'b', say: "The light's behind you. I can only see your outline." },
      { by: 'a', say: "Then you move! I'm not moving! It's a rhino!" },
      { beat: '{b} moves along the line of stones until the sun is behind {b.obj}. Click. Two faces, one human, one rhino.' },
    ] },
  ],
  'task-done.any': [
    { id: 'svf2.rh-dn1', when: RH, turns: [
      { by: 'a', say: "Please tell me it's not following me." },
      { by: 'b', say: "It's not following you." },
      { by: 'a', say: "Are you just saying that?" },
      { by: 'b', say: "Run, and don't look back." },
    ] },
    { id: 'svf2.rh-dn2', when: RH, turns: [
      { beat: '{a} gets back behind the stones and hugs {b} so hard the camera nearly falls.' },
      { by: 'a', say: "Never again. Never ever again." },
      { by: 'b', say: "You were so brave. You were so, so brave." },
    ] },
    { id: 'svf2.rh-dn3', when: RH, turns: [
      { by: 'b', say: "This is the best photo we'll ever have." },
      { by: 'a', say: "We've got the waterfall one." },
      { by: 'b', say: "This one has a rhino. A rhino beats a waterfall." },
    ] },
    { id: 'svf2.rh-dn4', when: RH, turns: [
      { beat: 'The ranger hands over the tip and points down the dusty track towards the village.' },
      { by: 'a', say: "The Chill Zone's in the village. We're nearly there." },
      { by: 'b', say: "Walk. Don't run. Running makes rhinos curious." },
    ] },
    { id: 'svf2.rh-dn5', when: RH, turns: [
      { by: 'a', say: "My legs are shaking. Look at them." },
      { by: 'b', say: "That's adrenaline." },
      { by: 'a', say: "That's a rhino. That's what a rhino does to legs." },
    ] },
  ],
};

export default mergePools(falls, rhino);
