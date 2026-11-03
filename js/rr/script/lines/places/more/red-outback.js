// Red Outback, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/red-outback.js: a jumps at the bungee, b watches.
import { V, mergePools } from '../_kit.js';

const EC = { taskId: 'emu-catch' };
const ER = { taskId: 'emu-ride' };
const SB = { taskId: 'sheep-bungee' };
const SH = { taskId: 'shearing' };

const catchEmu = {
  'task-start.any': [
    { id: 'rob2.ec-s1', when: EC, turns: [
      { beat: '{a} picks up a halter and holds it out in front of {a.obj} like a lasso.' },
      { by: 'b', say: "What are you doing?" },
      { by: 'a', say: "I've seen it in films." },
      { by: 'b', say: "That's for horses." },
    ] },
    { id: 'rob2.ec-s2', when: EC, turns: [
      { by: 'a', say: "They're taller than me. Nobody said they'd be taller than me." },
      { by: 'b', ...V("Just look confident. Animals can smell fear.", "Look confident.", "Act brave.", "Look CONFIDENT! They can SMELL fear!", "Just try to look confident, they can smell fear.", "Smell like courage. Emus respect courage.") },
      { by: 'a', say: "Then I'm in trouble." },
    ] },
    { id: 'rob2.ec-s3', when: EC, turns: [
      { beat: 'An emu walks straight up to {b} and pecks the button off {b.posAdj} shirt.' },
      { by: 'b', say: "Hey!" },
      { by: 'a', say: "It's not scared of you. That's your emu." },
    ] },
    { id: 'rob2.ec-s4', when: EC, turns: [
      { by: 'b', say: "Quiet. Low. We sneak up on them." },
      { beat: '{a} and {b} creep across the corral, bent double. Every emu watches them do it.' },
      { by: 'a', say: "They can all see us." },
      { by: 'b', say: "Keep going anyway." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rob2.ec-f1', when: EC, turns: [
      { beat: '{a} throws the halter. It lands right over an emu\'s head.' },
      { by: 'a', say: "Did you see that? DID YOU SEE THAT?" },
      { by: 'b', say: "That was amazing!" },
    ] },
    { id: 'rob2.ec-f2', when: EC, turns: [
      { by: 'b', say: "Mine just walked up to me." },
      { by: 'a', say: "Mine chose you too. Look, it's following you." },
      { beat: 'Both emus follow {b}, and {a} slips a halter on each.' },
    ] },
    { id: 'rob2.ec-f3', when: EC, turns: [
      { beat: '{a} hums a low tune. The nearest emu goes completely still and lets the halter on.' },
      { by: 'b', say: "What was that song?" },
      { by: 'a', say: "I don't know. I made it up." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rob2.ec-a1', when: EC, turns: [
      { by: 'a', say: "Okay. New plan. You be the bait." },
      { by: 'b', say: "Why am I the bait?" },
      { by: 'a', say: "Because it keeps coming at you." },
      { beat: 'It comes straight at {b}. {a} gets the halter on it from behind.' },
    ] },
    { id: 'rob2.ec-a2', when: EC, turns: [
      { beat: '{b} is lying flat on the ground, covered in red dust, not moving.' },
      { by: 'b', say: "I'm going to stay here. Maybe one will come and look at me." },
      { beat: 'One does. It leans over to look at {b}, and {b} slips the halter round its neck.' },
      { by: 'a', say: "That's so smart!" },
    ] },
    { id: 'rob2.ec-a3', when: EC, turns: [
      { by: 'a', ...V("Stop. Stop running. We're doing this wrong.", "We're doing it wrong.", "Stop. Wrong.", "STOP running! We're doing this WRONG!", "Let's stop running, we're doing this all wrong.", "We are chasing. We should be inviting.") },
      { by: 'b', say: "Then how do we do it right?" },
      { by: 'a', say: "Watch the farmer. She's not running at all." },
      { beat: 'They copy the farmer: slow, side-on, halter low. The emu barely notices.' },
    ] },
    { id: 'rob2.ec-a4', when: EC, turns: [
      { beat: '{a} gets onto the emu backwards, facing its tail.' },
      { by: 'b', say: "You're on it backwards." },
      { by: 'a', say: "I'm on it. I'm not getting off now." },
    ] },
  ],
  'task-done.any': [
    { id: 'rob2.ec-dn1', when: EC, turns: [
      { by: 'a', say: "Do they have names?" },
      { by: 'b', say: "I don't know. Just ride." },
      { by: 'a', say: "Okay. Follow {b}." },
    ] },
    { id: 'rob2.ec-dn2', when: EC, turns: [
      { beat: '{a} and {b} ride out of the corral, wobbling, past the teams still chasing birds on foot.' },
      { by: 'b', say: "Don't look back. Don't wave. Just ride." },
      { by: 'a', say: "I'm not waving." },
    ] },
    { id: 'rob2.ec-dn3', when: EC, turns: [
      { by: 'b', say: "My legs are already numb and we haven't even left." },
      { by: 'a', say: "It's a long way to that rock." },
      { by: 'b', say: "Don't say that. Tell me it's close." },
      { by: 'a', say: "It's very big. That's why it looks close." },
    ] },
    { id: 'rob2.ec-dn4', when: EC, turns: [
      { beat: '{b} reads the tip out loud while the emu tries to eat it.' },
      { by: 'b', say: "It says ride to the hanging rock. Stop it! Don't eat the tip!" },
      { by: 'a', say: "Read it faster!" },
    ] },
    { id: 'rob2.ec-dn5', when: EC, turns: [
      { by: 'a', say: "We are riding emus." },
      { by: 'b', say: "We are riding emus." },
      { by: 'a', say: "Nobody's going to believe us." },
    ] },
  ],
};

const ride = {
  'ride.any': [
    { id: 'rob2.er-r1', when: ER, turns: [
      { beat: 'The emus stop dead at a water trough and drink. Nothing {a} and {b} do will make them move.' },
      { by: 'a', say: "Come on. Come ON. You can drink at the rock." },
      { by: 'b', say: "Let them drink. It's so hot." },
    ] },
    { id: 'rob2.er-r2', when: ER, turns: [
      { by: 'b', say: "Every bump goes straight up my spine." },
      { by: 'a', say: "Mine too." },
      { beat: '{a} bounces with every stride.' },
    ] },
    { id: 'rob2.er-r3', when: ER, turns: [
      { beat: 'The two emus decide to race each other and take off at full speed.' },
      { by: 'a', ...V("They're racing! Why are they racing?", "They're racing!", "Racing.", "They're RACING! WHY are they RACING?", "Why on earth are they racing each other?", "They have their own race. We are only passengers.") },
      { by: 'b', say: "I don't know, but mine's winning!" },
    ] },
    { id: 'rob2.er-r4', when: ER, turns: [
      { by: 'a', say: "Do you think it knows where the rock is?" },
      { by: 'b', say: "I hope so." },
      { by: 'a', say: "Just keep going." },
    ] },
  ],
};

const bungee = {
  'task-start.any': [
    { id: 'rob2.sb-s1', when: SB, turns: [
      { beat: 'The crew member double-checks the cord on {a}\'s ankles, then checks it a third time.' },
      { by: 'a', say: "Why are you checking it three times? Is it bad?" },
      { by: 'b', say: "It's fine! They're just being careful!" },
    ] },
    { id: 'rob2.sb-s2', when: SB, turns: [
      { by: 'a', say: "Talk to me. Say something. Anything." },
      { by: 'b', say: "Sheep are mostly wool. You can't hurt one by grabbing it." },
      { by: 'a', say: "Okay. That helps." },
    ] },
    { id: 'rob2.sb-s3', when: SB, turns: [
      { beat: '{a} shuffles to the very edge of the platform. Little red stones fall away into the air.' },
      { by: 'a', say: "Those stones took a long time to land." },
      { by: 'b', say: "Don't look. Just go." },
    ] },
    { id: 'rob2.sb-s4', when: SB, turns: [
      { by: 'b', say: "You've got this. You're the bravest person I know." },
      { by: 'a', say: "Okay. Okay." },
      { by: 'b', say: "Go." },
      { beat: '{a} goes, screaming the whole way down.' },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rob2.sb-f1', when: SB, turns: [
      { beat: 'At the bottom of the drop, {a} grabs a sheep with both arms. The rope yanks them both back into the sky.' },
      { by: 'b', say: "YES! Hold it! Don't let go!" },
      { by: 'a', say: "I've got it! I've got it!" },
    ] },
    { id: 'rob2.sb-f2', when: SB, turns: [
      { by: 'a', say: "That was easy. Why was that easy?" },
      { by: 'b', say: "Don't ask. Just hand me the sheep." },
      { beat: 'The sheep bleats loudly.' },
    ] },
    { id: 'rob2.sb-f3', when: SB, turns: [
      { beat: '{a} comes back up holding the sheep, both of them perfectly calm.' },
      { by: 'b', say: "You both look so relaxed." },
      { by: 'a', say: "I don't know. It just let me." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rob2.sb-a1', when: SB, turns: [
      { by: 'b', say: "You keep grabbing too early. Wait for the bottom." },
      { by: 'a', say: "The bottom comes very fast." },
      { by: 'b', say: "Then get ready early." },
      { beat: '{a} gets ready early, and grabs. A whole sheep comes up.' },
    ] },
    { id: 'rob2.sb-a2', when: SB, turns: [
      { beat: '{a} comes back up holding a sheep upside down. It wriggles free just over the edge.' },
      { by: 'a', say: "No! No no no! I had it!" },
      { by: 'b', say: "You had it upside down. Hug it, don't hold it." },
      { beat: 'Next jump, {a} hugs it. It stays.' },
    ] },
    { id: 'rob2.sb-a3', when: SB, turns: [
      { by: 'a', say: "Same sheep every time. The white one keeps dodging me." },
      { by: 'b', say: "They all look the same." },
      { by: 'a', say: "No. That one. It keeps moving away." },
      { beat: 'On the next jump, {a} grabs a different sheep.' },
    ] },
    { id: 'rob2.sb-a4', when: SB, turns: [
      { beat: 'Back on the platform, {a} wipes the dust off {a.posAdj} face and nods at the crew.' },
      { by: 'a', say: "Again. Now. Before I think about it." },
      { by: 'b', say: "That's it! Go!" },
      { beat: '{a} comes up with a sheep.' },
    ] },
  ],
  'task-done.any': [
    { id: 'rob2.sb-dn1', when: SB, turns: [
      { by: 'a', say: "My legs don't work. I think they're still down there." },
      { by: 'b', say: "Lean on me. I've got you. And the sheep." },
      { by: 'a', say: "Thanks." },
    ] },
    { id: 'rob2.sb-dn2', when: SB, turns: [
      { beat: '{a} and {b} carry the sheep between them down the path to the shed.' },
      { by: 'b', say: "It's heavier than it looks." },
      { by: 'a', say: "Everything today is." },
    ] },
    { id: 'rob2.sb-dn3', when: SB, turns: [
      { by: 'b', say: "How was it? Be honest." },
      { by: 'a', say: "For about one second, at the bottom, it was amazing." },
      { by: 'b', say: "And the rest?" },
      { by: 'a', say: "The rest was screaming." },
    ] },
    { id: 'rob2.sb-dn4', when: SB, turns: [
      { beat: 'The sheep stares at {a} and {b} without blinking.' },
      { by: 'a', say: "It's so nervous." },
      { by: 'b', say: "It's okay. We're nearly done." },
    ] },
    { id: 'rob2.sb-dn5', when: SB, turns: [
      { by: 'b', say: "I'm so proud of you. You jumped off a cliff." },
      { by: 'a', say: "For a sheep." },
      { by: 'b', say: "Still. You did it." },
    ] },
  ],
};

const shearing = {
  'task-start.any': [
    { id: 'rob2.sh-s1', when: SH, turns: [
      { beat: 'The old clippers cough into life, buzzing loudly. {b} nearly drops them.' },
      { by: 'b', say: "They're so loud." },
      { by: 'a', say: "And the sheep hates them." },
    ] },
    { id: 'rob2.sh-s2', when: SH, turns: [
      { by: 'a', say: "Sit it down. You sit them down on their bottom. Then they can't run." },
      { beat: '{b} sits the sheep down on its bottom. It sits there, looking very surprised.' },
      { by: 'b', say: "It worked. It's just sitting there." },
    ] },
    { id: 'rob2.sh-s3', when: SH, turns: [
      { by: 'b', say: "Long strokes. Long smooth strokes." },
      { by: 'a', say: "Okay." },
      { by: 'b', say: "Go slowly." },
    ] },
    { id: 'rob2.sh-s4', when: SH, turns: [
      { beat: 'A team at the next pen is already wading through a pile of wool.' },
      { by: 'a', say: "They're fast. How are they so fast?" },
      { by: 'b', say: "Don't watch them. Watch the sheep. Watch for the brand." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rob2.sh-f1', when: SH, turns: [
      { beat: 'Three strokes in, a corner of something dark shows under the wool.' },
      { by: 'a', say: "Is that it? Already?" },
      { by: 'b', say: "That's it! Three strokes! We picked the right sheep first time!" },
    ] },
    { id: 'rob2.sh-f2', when: SH, turns: [
      { by: 'b', say: "There! Under the tummy! The brand!" },
      { by: 'a', say: "On its tummy? Who puts a brand on a tummy?" },
      { by: 'b', say: "I don't care. We found it." },
    ] },
    { id: 'rob2.sh-f3', when: SH, turns: [
      { beat: '{a} holds, {b} shears, and the wool comes off in one big piece.' },
      { by: 'a', say: "Look at that. One piece." },
      { by: 'b', say: "And the brand underneath." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rob2.sh-a1', when: SH, turns: [
      { by: 'a', say: "Don't shear the whole thing. Just the back. The brand's always on the back." },
      { by: 'b', say: "Is it?" },
      { by: 'a', say: "It was on the back of theirs." },
      { beat: 'One stripe down the back of the next sheep, and there it is.' },
    ] },
    { id: 'rob2.sh-a2', when: SH, turns: [
      { beat: '{a} and {b} drag another sheep in from the pen. It\'s the fourth one.' },
      { by: 'b', say: "This one. I've got a good feeling about this one." },
      { by: 'a', say: "You had a good feeling about the last three." },
      { beat: 'This time, there\'s a brand.' },
    ] },
    { id: 'rob2.sh-a3', when: SH, turns: [
      { by: 'b', say: "Swap. You shear, I'll hold." },
      { by: 'a', say: "Okay. They're too strong for me." },
      { beat: 'They swap. {b} holds the sheep in a bear hug, and the brand shows inside a minute.' },
    ] },
    { id: 'rob2.sh-a4', when: SH, turns: [
      { beat: 'The farmer walks past and points one finger at a sheep in the corner of the pen.' },
      { by: 'a', say: "Is that a hint? Was that a hint?" },
      { by: 'b', say: "I'm taking it as a hint." },
      { beat: 'It was a hint. The brand is under the wool on its shoulder.' },
    ] },
  ],
  'task-done.any': [
    { id: 'rob2.sh-dn1', when: SH, turns: [
      { by: 'a', say: "I'm going to be finding wool for weeks." },
      { by: 'b', say: "It's in my ears. How is it in my ears?" },
      { by: 'a', say: "Mine too." },
    ] },
    { id: 'rob2.sh-dn2', when: SH, turns: [
      { beat: 'The farmer hands over the tip. {a} and {b} look up at the top of the hanging rock.' },
      { by: 'b', say: "We have to climb that? After all this?" },
      { by: 'a', say: "Last bit. Last bit, and then we sit down." },
    ] },
    { id: 'rob2.sh-dn3', when: SH, turns: [
      { by: 'b', say: "Bye, sheep. You'll grow it back." },
      { by: 'a', say: "Are you okay?" },
      { by: 'b', say: "I'm fine. It's been a long day." },
    ] },
    { id: 'rob2.sh-dn4', when: SH, turns: [
      { beat: '{a} and {b} run out of the shed with wool stuck to every part of them.' },
      { by: 'a', say: "Go, go, go! Up the rock!" },
      { by: 'b', say: "I'm going! I'm going!" },
    ] },
    { id: 'rob2.sh-dn5', when: SH, turns: [
      { by: 'a', say: "Emus, a cliff, and a haircut. What a day." },
      { by: 'b', say: "And it's not even over." },
      { by: 'a', say: "Don't say that." },
    ] },
  ],
};

export default mergePools(catchEmu, ride, bungee, shearing);
