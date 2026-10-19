// Red Outback's own lines (js/rr/places/red-outback.js), from World Tour's outback leg adapted for pairs, in our own
// words:
//   the corral     catching an emu each: they're fast, they kick, they bolt with the halter on.
//   the emu ride   across the red plain to the hanging rock: an emu that throws you, a kangaroo.
//   the bungee     Botch or Watch: off the rock towards the sheep pen, grab a sheep at the bottom, hold on.
//   the shearing   shear until the brand shows; a bald blank sheep means another sheep.
// Gated on place / taskId / mishap. a jumps, b watches.
import { V, mergePools } from './_kit.js';

const P = { place: 'red-outback' };
const EC = { taskId: 'emu-catch' };
const ER = { taskId: 'emu-ride' };
const SB = { taskId: 'sheep-bungee' };
const SH = { taskId: 'shearing' };
const don = say => ({ by: 'don', say });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'rob.op1', when: P, turns: [
      { beat: 'Don stands on the red plain in a wide-brimmed hat with corks dangling from it, swatting at flies.' },
      don("Red Outback! Home of red dirt, blue skies, and every fly in the world. They've all come to see me."),
      don("Teams must catch an emu, ride it to the hanging rock, bungee off the rock for a sheep, and shear it."),
      { beat: 'A fly lands on his nose. He goes cross-eyed looking at it.' },
      don("Get off. Get off my nose. That's my best feature."),
    ] },
    { id: 'rob.op2', when: P, turns: [
      don("G'day, racers! Welcome to the Red Outback, home of kangaroos, emus, and the reddest dirt you'll ever get stuck in your shoes."),
      { beat: 'A kangaroo hops up behind him and looks over his shoulder at the camera.' },
      don("Is there something behind me? There's something behind me. I'm not going to turn round."),
    ] },
  ],
  'don-opener.bored': [
    { id: 'rob.op3', when: P, turns: [
      { beat: 'Don sits on a camping chair in the shade of a truck, a cold drink in his hand.' },
      don("Red Outback. Very big. Very red. Very hot."),
      don("The teams will be riding emus. I'll be riding this chair."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'rob.ar1', when: P, turns: [
      { beat: 'The road runs straight across the red plain for as far as they can see.' },
      { by: 'a', ...V("It's so red. Everything is red. The ground, the rocks, all of it.", "Everything's red.", "So red.", "It's SO RED! EVERYTHING is RED!", "It's so red, absolutely everything is red.", "We've landed on Mars. A sunny Mars.") },
      { by: 'b', say: "And there's nothing. Nothing in any direction." },
      { by: 'a', say: "There's that rock. That giant rock. That's probably where we're going." },
    ] },
    { id: 'rob.ar2', when: P, turns: [
      { by: 'b', say: "Look! A kangaroo! A real kangaroo!" },
      { by: 'a', say: "There's another one. And another one. There's a whole gang of them." },
      { by: 'b', say: "A mob. A group of kangaroos is a mob." },
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'rob.ad1', when: P, turns: [
      { by: 'a', say: "The flies. Why are there so many flies?" },
      { by: 'b', ...V("Don't open your mouth. Whatever you do, don't open your mouth.", "Keep your mouth shut.", "Mouth shut.", "DON'T open your MOUTH! Whatever you DO, DON'T open your MOUTH!", "Whatever you do, don't open your mouth.", "Seal your mouth. The flies are watching.") },
      { by: 'a', say: "Mmm-hmm." },
    ] },
    { id: 'rob.ad2', when: P, turns: [
      { beat: 'A huge flightless bird stares at them over a fence, very unfriendly.' },
      { by: 'b', say: "Is that an emu? Why is it looking at us like that?" },
      { by: 'a', say: "Because it knows something we don't." },
    ] },
  ],
};

// ── catch your emu ──
const catchEmu = {
  'don-demo.gag': [
    { id: 'rob.ec-d1', when: EC, turns: [
      don("In this All-In, each of you catches an emu, gets a halter on it, and climbs on. Then you ride it to the hanging rock."),
      { beat: 'He approaches an emu with a halter. The emu kicks the halter out of his hand and runs off.' },
      don("They're a little shy. You'll need to be gentle. And fast. And maybe wear a helmet."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'rob.ec-d2', when: EC, turns: [
      don("Emus can run at fifty kilometres an hour. You can't. So don't chase them. Be smarter than the emu."),
      don("Easier said than done. Emus are very smart. Smarter than some of you."),
      { beat: 'Behind him, an emu pecks a crew member\'s clipboard out of his hands.' },
    ] },
  ],
  'task-start.any': [
    { id: 'rob.ec-s1', when: EC, turns: [
      { beat: '{a} and {b} climb into the corral. A dozen emus turn and stare at them at exactly the same moment.' },
      { by: 'a', say: "They're all looking at us." },
      { by: 'b', ...V("Pick one. Pick the calmest one. Pick that one.", "Pick the calmest.", "That one. The calm one.", "PICK one! PICK the CALMEST one! Pick THAT one!", "Pick one, the calmest one, that one there.", "Choose the emu with the kindest eyes.") },
    ] },
    { id: 'rob.ec-s2', when: EC, turns: [
      { by: 'b', say: "How do you catch an emu?" },
      { by: 'a', say: "Slowly. You walk up slowly and you don't look it in the eye." },
      { by: 'b', say: "Where did you learn that?" },
      { by: 'a', say: "I'm guessing. I'm guessing very confidently." },
    ] },
    { id: 'rob.ec-s3', when: EC, turns: [
      { beat: '{a} holds out a handful of seed. Five emus come running at once.' },
      { by: 'a', say: "Too many! Too many emus!" },
      { by: 'b', say: "Pick one! Grab one! Any one!" },
    ] },
    { id: 'rob.ec-s4', when: EC, turns: [
      { by: 'a', say: "You go left, I go right, we trap it in the corner." },
      { by: 'b', say: "That's a very good plan." },
      { by: 'a', say: "It's a plan for a sheepdog. Let's see if it works for us." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rob.ec-f1', when: EC, turns: [
      { beat: '{a} walks up to an emu so calmly that it just lets {a.obj} put the halter on.' },
      { by: 'b', say: "How did you do that? It just let you!" },
      { by: 'a', ...V("I told it we were friends. It believed me.", "I said we were friends.", "We're friends now.", "I told it we were FRIENDS! It BELIEVED me!", "I just told it we were friends, and it believed me.", "I spoke to its soul. We understand each other.") },
    ] },
    { id: 'rob.ec-f2', when: EC, turns: [
      { by: 'b', say: "Corner it! Left! Now!" },
      { beat: 'The corner plan works. Two emus, two halters, and {a} and {b} climb aboard.' },
      { by: 'a', say: "It worked! The sheepdog plan worked!" },
    ] },
    { id: 'rob.ec-f3', when: EC, turns: [
      { beat: '{b} grew up on a farm and catches an emu in about ten seconds.' },
      { by: 'b', say: "Grab the neck, gently, then the halter. Like that." },
      { by: 'a', say: "You've done this before." },
      { by: 'b', say: "I've done chickens. Emus are just big chickens." },
    ] },
    { id: 'rob.ec-f4', when: EC, turns: [
      { by: 'a', say: "Mine's sitting down. It's just sitting down next to me." },
      { by: 'b', say: "Then halter it while it's sitting!" },
      { beat: 'The halter goes on. The emu stands up, with {a} on its back, looking very surprised.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rob.ec-a1', when: EC, turns: [
      { beat: '{a} gets up out of the dirt for the third time, red from head to foot.' },
      { by: 'b', say: "Stop chasing it! You'll never catch it chasing it!" },
      { by: 'a', say: "Then what do I do?" },
      { by: 'b', say: "Stand still and let it come to you." },
    ] },
    { id: 'rob.ec-a2', when: EC, turns: [
      { by: 'a', ...V("Seed. We need seed. Get the bag of seed.", "Get the seed.", "Seed!", "SEED! We NEED seed! Get the BAG of SEED!", "We need seed, get the bag of seed.", "Bribery. Emus respect bribery.") },
      { beat: 'With a handful of seed, the emu follows {a} like a puppy, right into the halter.' },
      { by: 'b', say: "Bribery works on everything." },
    ] },
    { id: 'rob.ec-a3', when: EC, turns: [
      { beat: 'The emu bolts with the halter half on. {b} runs after it, waving both arms.' },
      { by: 'b', say: "Come back! You've got our halter!" },
      { by: 'a', say: "Don't chase it! Go round! Go round the other way!" },
    ] },
    { id: 'rob.ec-a4', when: EC, turns: [
      { by: 'b', say: "That one. The old one in the corner. It looks tired." },
      { by: 'a', say: "Tired is good. Tired is slow." },
      { beat: 'The tired old emu barely notices them putting the halter on.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'rob.ec-t1', when: EC, turns: [
      { beat: '{a} and {b} have been chasing emus round the corral for twenty minutes. The emus look delighted.' },
      { by: 'a', say: "They think it's a game. They're having fun." },
      { by: 'b', say: "I'm not having fun. I'm having the opposite of fun." },
    ] },
    { id: 'rob.ec-t2', when: EC, turns: [
      { by: 'b', ...V("It kicked me! The emu kicked me!", "It kicked me!", "Kicked!", "It KICKED me! The EMU KICKED me!", "That emu just kicked me!", "I've been kicked by a giant chicken!") },
      { by: 'a', say: "Are you okay?" },
      { by: 'b', say: "I'm okay. My pride isn't." },
    ] },
    { id: 'rob.ec-t3', when: EC, turns: [
      { beat: 'Everybody else has ridden out of the corral. {a} and {b} are still on foot.' },
      { by: 'a', say: "The emus that are left are the fast ones." },
      { by: 'b', say: "Then we need to be faster. Or cleverer. Probably cleverer." },
    ] },
  ],
  'task-done.any': [
    { id: 'rob.ec-dn1', when: EC, turns: [
      { beat: '{a} and {b} sit on their emus, holding the halters, and take the tip.' },
      { by: 'a', say: "The hanging rock. That way. On these." },
      { by: 'b', ...V("How do you steer an emu?", "How do we steer?", "Steering?", "How do you STEER an EMU?", "How exactly do you steer an emu?", "Where are the emu's controls?") },
    ] },
    { id: 'rob.ec-dn2', when: EC, turns: [
      { by: 'b', say: "We caught emus. We actually caught emus." },
      { by: 'a', say: "Nobody back home is going to believe that." },
      { by: 'b', say: "I'm telling everyone anyway." },
    ] },
    { id: 'rob.ec-dn3', when: EC, turns: [
      { beat: 'Both emus set off at once, at a speed neither of them expected.' },
      { by: 'a', say: "Hold on! Hold on!" },
      { by: 'b', say: "I'm holding on! I'm holding on to feathers!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'rob.ec-x1', when: EC, turns: [
      { beat: '{a} dives for an emu and lands face first in the red dirt. The emu runs off.' },
      { by: 'a', say: "Missed. Missed it." },
      { by: 'b', say: "You've got dirt in your eyebrows." },
    ] },
    { id: 'rob.ec-x2', when: EC, turns: [
      { beat: '{b} gets onto an emu, which immediately throws {b.obj} off into the fence.' },
      { by: 'b', ...V("It doesn't want me! It actually doesn't want me!", "It doesn't want me!", "Rejected!", "It DOESN'T want me! It ACTUALLY doesn't want me!", "It doesn't want me at all!", "I've been rejected by a bird.") },
      { by: 'a', say: "Try a different one. One that likes you." },
    ] },
    { id: 'rob.ec-x3', when: EC, turns: [
      { beat: 'The emu takes the halter in its beak and walks off with it.' },
      { by: 'a', say: "It stole the halter. The emu stole our halter." },
      { by: 'b', say: "Get it back. Get it back before it eats it." },
    ] },
  ],
};

// ── the emu ride ──
const ride = {
  'ride.any': [
    { id: 'rob.er-r1', when: ER, turns: [
      { beat: '{a} and {b} bounce across the red plain on emus, the hanging rock getting slowly bigger.' },
      { by: 'b', say: "This is the strangest thing I've ever done." },
      { by: 'a', ...V("We're riding giant birds across the outback. Of course it's the strangest thing.", "We're riding giant birds.", "Giant birds. Yes.", "We're RIDING GIANT BIRDS across the OUTBACK! Of COURSE it's strange!", "We're riding giant birds across the outback, of course it's strange.", "We are bird-knights now.") },
    ] },
    { id: 'rob.er-r2', when: ER, turns: [
      { by: 'a', say: "It won't go straight. It keeps going sideways." },
      { by: 'b', say: "Lean the way you want to go. Mine goes where I lean." },
      { by: 'a', say: "I'm leaning! It's ignoring the lean!" },
    ] },
    { id: 'rob.er-r3', when: ER, turns: [
      { beat: 'A mob of kangaroos hops alongside them for a while, curious.' },
      { by: 'b', say: "We're racing kangaroos on emus. This is the best day of my life." },
      { by: 'a', say: "The kangaroos are winning." },
    ] },
    { id: 'rob.er-r4', when: ER, turns: [
      { by: 'a', say: "How long have we been riding?" },
      { by: 'b', say: "About an hour. The rock still looks the same size." },
      { by: 'a', say: "It's a very big rock. It's further away than it looks." },
    ] },
  ],
  'travel-mishap.any': [
    { id: 'rob.er-m1', when: { ...ER, mishap: 'emu-throws' }, turns: [
      { beat: 'The emu stops dead, and {a} flies over its head into the red dirt.' },
      { by: 'b', say: "Are you okay? Did it throw you?" },
      { by: 'a', say: "It stopped. It just stopped. And I didn't." },
      { beat: 'It takes twenty minutes and a lot of seed to get the emu moving again.' },
    ] },
    { id: 'rob.er-m2', when: { ...ER, mishap: 'kangaroo' }, turns: [
      { beat: 'A big kangaroo bounds out of the scrub, squares up to {b}, and kicks {b.obj} clean off the emu.' },
      { by: 'b', ...V("A kangaroo kicked me! A kangaroo!", "A kangaroo kicked me!", "Kangaroo!", "A KANGAROO kicked me! A KANGAROO!", "A kangaroo just kicked me off!", "I've been boxed by a kangaroo!") },
      { by: 'a', say: "It's standing there like it wants another go. Get back on. Quickly." },
    ] },
  ],
};

// ── the bungee for a sheep (Botch or Watch) ──
const bungee = {
  'don-demo.gag': [
    { id: 'rob.sb-d1', when: SB, turns: [
      don("In this Botch or Watch, whoever didn't do the last one bungee jumps off the hanging rock, grabs a sheep from the pen at the bottom, and holds on as the rope pulls them back up."),
      { beat: 'He leans over the edge and looks down at the sheep pen. A sheep looks back up at him.' },
      don("The sheep are fine with this. I asked. Well, I asked a man who asked the sheep."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'rob.sb-d2', when: SB, turns: [
      don("Jump, grab, hold on. Come up with nothing, or drop the sheep, and you jump again."),
      don("And it has to be a whole sheep. Not just wool. We've had that before."),
      { beat: 'He holds up a handful of wool, very disappointed.' },
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'rob.sb-w1', when: SB, turns: [
      { by: 'b', say: "It's a jump. You're the jumper. You jump off things all the time." },
      { by: 'a', ...V("I jump off diving boards. Into pools. This is a cliff.", "Diving boards. This is a cliff.", "This is a cliff.", "I jump off DIVING BOARDS! Into POOLS! This is a CLIFF!", "I jump off diving boards into pools, this is a cliff.", "Diving boards are cliffs for beginners.") },
      { by: 'b', say: "A diving board is just a small cliff." },
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'rob.sb-w2', when: SB, turns: [
      { by: 'a', say: "I'll do it. I've always wanted to bungee jump." },
      { by: 'b', say: "And grab a sheep at the bottom?" },
      { by: 'a', say: "That part I'm less sure about." },
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'rob.sb-w3', when: SB, turns: [
      { by: 'b', say: "You're jumping. I'm not jumping off a cliff for a sheep." },
      { by: 'a', say: "And I am?" },
      { by: 'b', say: "You're braver. And you've got longer arms." },
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'rob.sb-w4', when: SB, turns: [
      { by: 'a', say: "'Who wants to take the plunge?' A plunge. Off that big rock." },
      { by: 'b', say: "Then it's you. You love a plunge." },
      { by: 'a', say: "I love a plunge into a swimming pool." },
    ] },
  ],
  'task-start.any': [
    { id: 'rob.sb-s1', when: SB, turns: [
      { beat: '{a} stands on the platform at the edge of the rock, the bungee cord clipped to {a.posAdj} ankles.' },
      { by: 'a', say: "The sheep look very small from up here." },
      { by: 'b', ...V("They'll get bigger on the way down. Go!", "They'll get bigger. Go!", "Go!", "They'll GET BIGGER on the way DOWN! GO!", "They'll get bigger as you fall, go!", "Fall towards them and they'll grow!") },
    ] },
    { id: 'rob.sb-s2', when: SB, turns: [
      { by: 'b', say: "Arms out. Grab the first one you see. Don't be picky." },
      { by: 'a', say: "I'm not going to be picky about a sheep." },
      { by: 'b', say: "You're picky about everything." },
    ] },
    { id: 'rob.sb-s3', when: SB, turns: [
      { beat: 'A crew member counts down from three.' },
      { by: 'a', say: "Wait, is it on three, or after three?" },
      { beat: 'It was on three. {a} goes on four, screaming.' },
    ] },
    { id: 'rob.sb-s4', when: SB, turns: [
      { by: 'a', say: "If I don't come back, tell everyone I died holding a sheep." },
      { by: 'b', say: "You're not going to die. You're on a rope." },
      { by: 'a', say: "Tell them anyway. It's a good way to go." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rob.sb-f1', when: SB, turns: [
      { beat: '{a} drops, swoops over the pen, scoops up a sheep and is pulled back up the cliff holding it tight.' },
      { by: 'b', ...V("You got one! First go!", "First go!", "Got one!", "You GOT one! FIRST GO!", "You got one! First go!", "A sheep, straight from the sky, on the first try!") },
      { by: 'a', say: "It's looking at me. It's very unhappy with me." },
    ] },
    { id: 'rob.sb-f2', when: SB, turns: [
      { by: 'a', say: "Got it! Got the sheep! Pull me up!" },
      { by: 'b', say: "They're pulling you! Hold on to it!" },
      { by: 'a', say: "I'm holding on to it like it's a million dollars!" },
    ] },
    { id: 'rob.sb-f3', when: SB, turns: [
      { beat: '{a} comes back up over the edge with a sheep in a perfect hug.' },
      { by: 'b', say: "That was beautiful. That was like a film." },
      { by: 'a', say: "The sheep didn't think it was beautiful." },
    ] },
    { id: 'rob.sb-f4', when: SB, turns: [
      { by: 'b', say: "You barely even screamed." },
      { by: 'a', say: "I screamed on the inside. Very loudly. The sheep heard it." },
      { beat: '{a} hands the sheep over, still trembling.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rob.sb-a1', when: SB, turns: [
      { beat: 'Second jump. This time {a} goes with arms already wide open.' },
      { by: 'b', say: "Arms out! Arms out! Now grab!" },
      { beat: '{a} grabs a sheep at the very bottom of the swing and holds on all the way up.' },
      { by: 'a', say: "Arms out. Who knew." },
    ] },
    { id: 'rob.sb-a2', when: SB, turns: [
      { by: 'b', ...V("Aim for the fat ones. The fat ones don't run.", "The fat ones.", "Aim fat.", "AIM for the FAT ones! The FAT ones DON'T RUN!", "Aim for the fat ones, they don't run away.", "Target the round sheep. They're too comfortable to flee.") },
      { beat: 'The fat sheep doesn\'t run. {a} comes back up with it.' },
      { by: 'a', say: "It's very heavy. You were right. It's very heavy." },
    ] },
    { id: 'rob.sb-a3', when: SB, turns: [
      { beat: '{a} comes up the first time holding a handful of wool and nothing else.' },
      { by: 'b', say: "That's wool. That's not a sheep." },
      { by: 'a', say: "Then I'm going again. And this time I'm grabbing the whole thing." },
    ] },
    { id: 'rob.sb-a4', when: SB, turns: [
      { by: 'a', say: "I keep closing my eyes on the way down. That's why I miss." },
      { by: 'b', say: "Then keep them open. Look at the sheep. Be one with the sheep." },
      { beat: 'Eyes open, one with the sheep, {a} gets one.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'rob.sb-t1', when: SB, turns: [
      { beat: '{a} is standing on the platform again, after the fourth missed jump, very pale.' },
      { by: 'a', say: "I don't think my stomach can do another one." },
      { by: 'b', say: "Your stomach doesn't have to. Just your arms." },
    ] },
    { id: 'rob.sb-t2', when: SB, turns: [
      { by: 'a', ...V("The sheep know now. They see me coming and they run.", "The sheep see me coming.", "They run now.", "The SHEEP KNOW now! They SEE me COMING and they RUN!", "The sheep know now, they see me coming and run.", "The sheep have learned. They're organised.") },
      { by: 'b', say: "Then come down quicker than they can run." },
      { by: 'a', say: "Faster than a running sheep. Okay. That's a sentence." },
    ] },
    { id: 'rob.sb-t3', when: SB, turns: [
      { beat: 'Every other team has their sheep. {a} is about to jump for the fifth time.' },
      { by: 'b', say: "This is the one. I can feel it. This is the sheep." },
      { by: 'a', say: "You said that about the last three sheep." },
    ] },
  ],
  'task-done.any': [
    { id: 'rob.sb-dn1', when: SB, turns: [
      { beat: '{a} hands the sheep to {b}, who holds it like a very large, very angry baby.' },
      { by: 'b', say: "Now we shear it? Now we take its clothes off?" },
      { by: 'a', say: "That's one way of putting it." },
    ] },
    { id: 'rob.sb-dn2', when: SB, turns: [
      { by: 'a', say: "Never again. I'm never jumping off anything ever again." },
      { by: 'b', ...V("You loved it. I saw your face. You loved it.", "You loved it.", "You loved it. I saw.", "You LOVED it! I SAW your FACE! You LOVED it!", "You loved it, I saw your face.", "Your face betrayed your joy.") },
      { by: 'a', say: "I loved it a little bit. Don't tell anyone." },
    ] },
    { id: 'rob.sb-dn3', when: SB, turns: [
      { beat: 'The sheep bleats loudly, right in {a}\'s ear.' },
      { by: 'a', say: "It's complaining. It's been complaining since the bottom." },
      { by: 'b', say: "So would you." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'rob.sb-x1', when: SB, turns: [
      { beat: '{a} swoops down, grabs, misses, and is yanked back up with empty arms.' },
      { by: 'a', say: "Missed! The sheep moved! It saw me and it moved!" },
      { by: 'b', say: "Back to the platform. Go again." },
    ] },
    { id: 'rob.sb-x2', when: SB, turns: [
      { beat: '{a} grabs a sheep, and halfway up, the sheep wriggles free and drops back into the pen, perfectly fine.' },
      { by: 'b', ...V("You dropped it! You had it, and you dropped it!", "You dropped it!", "Dropped it!", "You DROPPED it! You HAD it, and you DROPPED it!", "You had it and you dropped it!", "The sheep escaped! The sheep has won this round!") },
      { by: 'a', say: "It wriggled! Sheep are very wriggly!" },
    ] },
    { id: 'rob.sb-x3', when: SB, turns: [
      { beat: '{a} comes back up holding a very surprised goat.' },
      { by: 'b', say: "That's a goat. That's not a sheep. That's a goat." },
      { by: 'a', say: "They all look the same upside down!" },
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'rob.sb-v1', when: SB, turns: [
      { by: 'b', say: "You're flying! You look amazing! Grab it!" },
      { by: 'a', say: "Aaaaaah!" },
      { by: 'b', say: "That's the spirit!" },
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'rob.sb-v2', when: SB, turns: [
      { beat: '{b} can\'t look, and peeks out between {b.posAdj} fingers as {a} falls.' },
      { by: 'b', say: "Is the rope holding? Tell me the rope's holding!" },
      { by: 'a', say: "The rope is holding! I'm the one who's not!" },
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'rob.sb-v3', when: SB, turns: [
      { beat: '{b} climbs down into the pen to round up a sheep and hold it in place for {a}.' },
      { by: 'b', say: "Here! This one! I'm holding it still for you!" },
      { beat: 'A crew member points {b} back up the cliff. Thirty minutes.' },
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'rob.sb-v4', when: SB, turns: [
      { beat: '{b} stands perfectly still at the edge, holding {b.posAdj} breath every time {a} drops.' },
      { by: 'a', say: "Breathe! You're making me nervous!" },
      { by: 'b', say: "I'll breathe when you've got a sheep." },
    ] },
  ],
  'helped-botch.any': [
    { id: 'rob.sb-h1', when: SB, turns: [
      { beat: 'When nobody\'s looking, {b} throws a handful of seed into the pen, right under the drop.' },
      { by: 'a', say: "Why are all the sheep underneath me?" },
      { by: 'b', say: "No idea. Sheep just like you. Grab one." },
    ] },
  ],
};

// ── the shearing ──
const shearing = {
  'don-demo.gag': [
    { id: 'rob.sh-d1', when: SH, turns: [
      don("In this All-In, shear your sheep with these clippers until you find the race's brand. Only some of the sheep have one."),
      { beat: 'He tries the clippers on a sheep. The sheep shakes its whole body and sprays wool in his face.' },
      don("Pfft. Pfft. It's in my mouth. There's wool in my mouth."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'rob.sh-d2', when: SH, turns: [
      don("Shear it all. If there's no brand, back to the pen for another sheep, and start again."),
      don("The sheep won't mind. It's very hot out here. They'll be grateful. Eventually."),
      { beat: 'A freshly shorn sheep trots past behind him, looking cold and furious.' },
    ] },
  ],
  'task-start.any': [
    { id: 'rob.sh-s1', when: SH, turns: [
      { beat: '{a} holds the sheep while {b} switches on the clippers. The sheep does not like the noise.' },
      { by: 'b', say: "Hold it still. Hold it still!" },
      { by: 'a', ...V("I'm holding it! It's holding me back!", "I'm holding it!", "Holding!", "I'm HOLDING it! It's HOLDING me BACK!", "I'm holding it, and it's fighting back!", "I'm wrestling it! It's winning!") },
    ] },
    { id: 'rob.sh-s2', when: SH, turns: [
      { by: 'a', say: "Where do you even start?" },
      { by: 'b', say: "The belly. Shepherds always start at the belly. I've seen it on television." },
      { by: 'a', say: "You've seen everything on television." },
    ] },
    { id: 'rob.sh-s3', when: SH, turns: [
      { beat: 'Wool starts flying everywhere: in their hair, their eyes, their mouths.' },
      { by: 'b', say: "There's wool in my mouth." },
      { by: 'a', say: "Don't open your mouth, then." },
    ] },
    { id: 'rob.sh-s4', when: SH, turns: [
      { by: 'a', say: "Talk to it. Calm it down. Sheep like being talked to." },
      { by: 'b', say: "Shh, shh. Good sheep. Lovely sheep. You're going to look so cool." },
      { beat: 'The sheep stops struggling, just a little.' },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rob.sh-f1', when: SH, turns: [
      { beat: 'The last of the wool comes off, and there on the sheep\'s back is the race\'s brand.' },
      { by: 'b', ...V("The brand! It's got the brand! First sheep!", "Brand! First sheep!", "The brand!", "The BRAND! It's GOT the BRAND! FIRST SHEEP!", "It's got the brand! On the very first sheep!", "The mark of destiny! On sheep number one!") },
      { by: 'a', say: "We got a lucky sheep. Thank you, lucky sheep." },
    ] },
    { id: 'rob.sh-f2', when: SH, turns: [
      { by: 'a', say: "Is that a mark? Under there? Keep going!" },
      { beat: '{b} clears the last patch, and the brand shows clear as day.' },
      { by: 'b', say: "Brand! We've got the brand!" },
    ] },
    { id: 'rob.sh-f3', when: SH, turns: [
      { beat: '{a} and {b} shear the sheep fast and neat, like they\'ve done it all their lives.' },
      { by: 'a', say: "We're actually good at this." },
      { by: 'b', say: "Who knew we were natural shepherds?" },
    ] },
    { id: 'rob.sh-f4', when: SH, turns: [
      { by: 'b', say: "Look at it. It looks so much happier now." },
      { by: 'a', say: "It looks so much colder now." },
      { by: 'b', say: "Happier and colder. Like anyone after a haircut." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rob.sh-a1', when: SH, turns: [
      { beat: 'The second sheep comes out bare and blank too. {a} and {b} go back to the pen for a third.' },
      { by: 'a', say: "This one. This one's got a guilty face." },
      { by: 'b', say: "A guilty face means it's hiding a brand." },
      { beat: 'The guilty-faced sheep is hiding a brand.' },
    ] },
    { id: 'rob.sh-a2', when: SH, turns: [
      { by: 'b', ...V("Feel the wool first. The branded ones have a bump.", "Feel for a bump.", "Feel first.", "FEEL the wool FIRST! The BRANDED ones have a BUMP!", "Feel through the wool first, the branded ones have a bump.", "Check for a brand bump. Like reading Braille.") },
      { beat: 'They feel every sheep in the pen until one has a bump. It has the brand.' },
      { by: 'a', say: "Your bump theory worked." },
    ] },
    { id: 'rob.sh-a3', when: SH, turns: [
      { beat: 'This time they shear only a strip down the sheep\'s back, checking for the brand, before shearing the rest.' },
      { by: 'a', say: "Check first, shear later. Why didn't we do that before?" },
      { by: 'b', say: "Because we had wool in our eyes." },
    ] },
    { id: 'rob.sh-a4', when: SH, turns: [
      { by: 'a', say: "Watch which pen the other teams take their sheep from." },
      { by: 'b', say: "That's not cheating, is it?" },
      { by: 'a', say: "It's watching. Watching isn't cheating." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'rob.sh-t1', when: SH, turns: [
      { beat: 'A small mountain of wool has piled up around {a} and {b}. Three sheep, no brand.' },
      { by: 'b', say: "We've shorn half the farm." },
      { by: 'a', say: "And none of them have the brand. The farmer's going to have very cold sheep." },
    ] },
    { id: 'rob.sh-t2', when: SH, turns: [
      { by: 'a', ...V("My arms are so tired. These clippers weigh a ton.", "My arms are so tired.", "Arms gone.", "My ARMS are SO TIRED! These CLIPPERS weigh a TON!", "My arms are so tired, these clippers are heavy.", "The clippers have defeated my arms.") },
      { by: 'b', say: "Swap. I'll clip, you hold. Holding's easier." },
      { by: 'a', say: "Holding is not easier. The sheep fights the holder." },
    ] },
    { id: 'rob.sh-t3', when: SH, turns: [
      { beat: 'The sheep breaks free halfway through and runs round the shed, half bald, with {a} chasing it.' },
      { by: 'b', say: "Catch it! It's half done!" },
      { by: 'a', say: "It's very fast for a half-bald sheep!" },
    ] },
  ],
  'task-done.any': [
    { id: 'rob.sh-dn1', when: SH, turns: [
      { beat: '{a} and {b} show the brand to the farmer, who nods and hands over the tip.' },
      { by: 'b', say: "The Chill Zone's on top of the rock. Up there." },
      { by: 'a', ...V("Up there. Of course it's up there.", "Of course it's up there.", "Up there. Naturally.", "UP there! Of COURSE it's UP there!", "Up there, of course. It's always up there.", "Up the rock, naturally. Everything ends up.") },
    ] },
    { id: 'rob.sh-dn2', when: SH, turns: [
      { by: 'a', say: "I'm covered in wool. I'm half sheep now." },
      { by: 'b', say: "You look like a cloud. A very sweaty cloud." },
      { by: 'a', say: "Let's go before the sheep wants its wool back." },
    ] },
    { id: 'rob.sh-dn3', when: SH, turns: [
      { beat: 'The shorn sheep trots away, looking about half its size and very offended.' },
      { by: 'b', say: "Goodbye, sheep. Thank you for your brand." },
      { by: 'a', say: "It's never going to forgive us." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'rob.sh-x1', when: SH, turns: [
      { beat: 'The last of the wool comes off. The sheep is completely bare. No brand.' },
      { by: 'b', say: "Nothing. Nothing at all." },
      { by: 'a', say: "Another sheep. Back to the pen." },
    ] },
    { id: 'rob.sh-x2', when: SH, turns: [
      { beat: 'The clippers jam full of wool and stop dead.' },
      { by: 'a', ...V("They've stopped! The clippers have stopped!", "They've stopped!", "Jammed!", "They've STOPPED! The CLIPPERS have STOPPED!", "The clippers have jammed up and stopped!", "The clippers are choking on wool!") },
      { by: 'b', say: "Clean them out! Pull the wool out!" },
    ] },
    { id: 'rob.sh-x3', when: SH, turns: [
      { beat: 'Halfway through, the sheep jumps the fence and disappears across the plain.' },
      { by: 'b', say: "It's gone. Our sheep has gone." },
      { by: 'a', say: "Back to the pen. And this time, I'm sitting on it." },
    ] },
  ],
};

export default mergePools(place, catchEmu, ride, bungee, shearing);
