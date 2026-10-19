// Savanna Falls' own lines (js/rr/places/savanna-falls.js), 1:1 with the real leg ("My Way or Zimbabwe"), in our own
// words:
//   the jeep       driving yourselves across the savanna: lost in the bush, stuck in the mud.
//   the falls      over the edge in a raft, both faces in one selfie on the way down; a photo of spray means carrying
//                  the raft back up.
//   the rhino      Botch or Watch: one poses with a white rhino, the other takes the picture; too close, too fast or
//                  too rude and it charges.
//   the village    a rhino follows somebody all the way to the mat.
// Gated on place / taskId / mishap. a does the Botch (poses), b takes the photo.
import { V, mergePools } from './_kit.js';

const P = { place: 'savanna-falls' };
const FS = { taskId: 'falls-selfie' };
const RH = { taskId: 'rhino' };
const don = say => ({ by: 'don', say });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'svf.op1', when: P, turns: [
      { beat: 'Don stands at the edge of the great falls, shouting over the roar of the water.' },
      don("Savanna Falls! Home of the biggest waterfall you've ever seen, wild animals, and spray that is ruining my hair!"),
      don("Teams must drive themselves to the falls, go over them in a raft, and pose with a white rhino."),
      { beat: 'A wave of spray soaks him from head to toe.' },
      don("Somebody get me a towel! And a hair dryer! And a new hairdresser!"),
    ] },
    { id: 'svf.op2', when: P, turns: [
      don("Welcome to Savanna Falls, home of lions, elephants, rhinos, and a waterfall so loud I can't hear myself talk. Which is a tragedy."),
      { beat: 'A giraffe wanders past behind him, very slowly, and looks at the camera.' },
      don("Don't look at the giraffe. Look at me. I'm the host."),
    ] },
  ],
  'don-opener.bored': [
    { id: 'svf.op3', when: P, turns: [
      { beat: 'Don sits in a jeep with the engine running, safely away from everything.' },
      don("Savanna Falls. There are rhinos out there, and I am in here. Let's keep it that way."),
      don("Teams, your jeeps are waiting at the airport. Drive safely. Or quickly. You choose."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'svf.ar1', when: P, turns: [
      { beat: 'The jeep crests a hill, and the whole savanna opens up below them, golden and endless.' },
      { by: 'a', ...V("Look. Look at all of it. It goes on forever.", "It goes on forever.", "Look at it all.", "LOOK! Look at ALL of it! It goes on FOREVER!", "Look at it all, it just goes on forever.", "It's the edge of the world, and it's golden.") },
      { by: 'b', say: "Is that an elephant? That's an elephant! A real elephant!" },
      { by: 'a', say: "Don't stop the jeep. Wave at it from the jeep." },
    ] },
    { id: 'svf.ar2', when: P, turns: [
      { beat: 'Far away, a huge white cloud of spray rises from the ground.' },
      { by: 'b', say: "What's that cloud? Is it a fire?" },
      { by: 'a', say: "It's the waterfall. That's how big the waterfall is. It makes its own clouds." },
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'svf.ad1', when: P, turns: [
      { by: 'a', say: "We're driving ourselves? Across the savanna? With lions in it?" },
      { by: 'b', ...V("Lions don't attack jeeps. I read that somewhere.", "Lions don't attack jeeps.", "Lions leave jeeps alone.", "Lions DON'T attack JEEPS! I READ that somewhere!", "Lions don't attack jeeps. I'm sure I read that.", "Lions respect vehicles. It's a known fact. Probably.") },
      { by: 'a', say: "Where? Where did you read that?" },
    ] },
    { id: 'svf.ad2', when: P, turns: [
      { by: 'b', say: "I can hear the waterfall from here. We're miles away and I can hear it." },
      { by: 'a', say: "Please don't let the challenge be the waterfall." },
      { by: 'b', say: "It's always the waterfall." },
    ] },
  ],
};

// ── the drive and the run (mishaps) ──
const roads = {
  'travel-mishap.any': [
    { id: 'svf.tm1', when: { taskId: 'jeep', mishap: 'lost-in-the-bush' }, turns: [
      { beat: 'The track has disappeared. There is nothing but long grass in every direction.' },
      { by: 'a', say: "Where's the road? There was a road a minute ago." },
      { by: 'b', ...V("Follow the cloud. The waterfall cloud. Drive towards the cloud.", "Drive towards the cloud.", "Follow the cloud.", "FOLLOW the CLOUD! The WATERFALL cloud! DRIVE towards the CLOUD!", "Just follow the cloud from the waterfall. Drive towards it.", "The cloud is our compass now.") },
      { beat: 'They drive towards the cloud. It takes twenty-five minutes longer than the road would have.' },
    ] },
    { id: 'svf.tm2', when: { taskId: 'jeep', mishap: 'stuck-in-mud' }, turns: [
      { beat: 'The jeep sinks into a mud hole up to its doors, wheels spinning.' },
      { by: 'b', say: "Push. One of us has to get out and push." },
      { by: 'a', say: "And one of us has to drive. I'm driving." },
      { beat: '{b} pushes. {b} ends up covered from head to foot in mud. The jeep comes free.' },
    ] },
    { id: 'svf.tm3', when: { taskId: 'village-run', mishap: 'rhino-chase' }, turns: [
      { beat: 'A rhino has decided to follow {a} and {b}. It is getting closer.' },
      { by: 'a', say: "Why is it following us? What did we do?" },
      { by: 'b', ...V("Don't stop to ask it! Run!", "Run!", "Don't ask! Run!", "DON'T stop to ASK it! RUN!", "Don't stop to ask it, just run!", "Philosophy later! Running now!") },
    ] },
  ],
};

// ── over the falls ──
const falls = {
  'don-demo.gag': [
    { id: 'svf.fs-d1', when: FS, turns: [
      don("In this All-In, both partners raft over the edge of the falls, and take a team selfie on the way down with this waterproof camera."),
      { beat: 'He holds up the camera and takes a selfie of his own face. He checks it. He takes another one.' },
      don("Both faces in the picture. A good, clear picture. Like this one. Of me. Look at that jaw."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'svf.fs-d2', when: FS, turns: [
      don("Blurry photo, half a face, or a photo of a lot of water, and you carry your raft back up and go again."),
      don("A good selfie gets your next tip. I'm not going over. I don't need to. I already have good selfies."),
      { beat: 'He pats his hair, checks it in the camera screen, and nods. Still perfect.' },
    ] },
  ],
  'task-start.any': [
    { id: 'svf.fs-s1', when: FS, turns: [
      { beat: '{a} and {b} sit in the raft at the top of the falls. The roar is deafening.' },
      { by: 'a', say: "Who's holding the camera?" },
      { by: 'b', ...V("You! You've got the longer arms!", "You! Longer arms!", "You hold it!", "YOU! You've got the LONGER ARMS!", "You hold it, you've got the longer arms!", "You! Your arms were made for selfies!") },
      { by: 'a', say: "My arms are going to be holding on to the raft!" },
    ] },
    { id: 'svf.fs-s2', when: FS, turns: [
      { by: 'b', say: "Smile. Remember to smile. It's a selfie. People smile in selfies." },
      { by: 'a', say: "I'm going to be screaming. Screaming is a kind of smile." },
      { by: 'b', say: "It's the exact opposite of a smile." },
    ] },
    { id: 'svf.fs-s3', when: FS, turns: [
      { beat: 'A crew member pushes the raft off. It slides towards the edge, faster and faster.' },
      { by: 'a', say: "Wait! I'm not ready! Is the camera on? Is it on?" },
      { by: 'b', say: "It's on! Point it at us! Point it at us now!" },
    ] },
    { id: 'svf.fs-s4', when: FS, turns: [
      { by: 'a', say: "Okay. On the way down, I hold it out, we both lean in, and click." },
      { by: 'b', say: "That's a very calm plan for falling off a waterfall." },
      { by: 'a', say: "It's the only plan I've got." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'svf.fs-f1', when: FS, turns: [
      { beat: 'The crew member flicks through the camera at the bottom and holds it up: two screaming faces, perfectly in frame.' },
      { by: 'b', say: "Look at us! We look terrified!" },
      { by: 'a', ...V("We look amazing! That's going on my wall!", "That's going on my wall!", "Framing it.", "We look AMAZING! That's going on my WALL!", "We look amazing, that's going straight on my wall!", "Frame it! Frame it in gold!") },
    ] },
    { id: 'svf.fs-f2', when: FS, turns: [
      { by: 'a', say: "Did we get it? Tell me we got it!" },
      { by: 'b', say: "We got it! We got it on the first go!" },
      { by: 'a', say: "I'm never doing that again, and I'm also so glad I did it." },
    ] },
    { id: 'svf.fs-f3', when: FS, turns: [
      { beat: 'In the photo, {a} is screaming and {b} is laughing, and behind them the whole falls is a white wall of water.' },
      { by: 'b', say: "That's the best photo anyone's ever taken of me." },
      { by: 'a', say: "You're laughing. Why were you laughing?" },
      { by: 'b', say: "Your face. Your face going over." },
    ] },
    { id: 'svf.fs-f4', when: FS, turns: [
      { by: 'b', say: "How did you even keep the camera steady?" },
      { by: 'a', say: "I don't know. I think I blacked out, and my arm did it on its own." },
      { by: 'b', say: "Your arm is a professional." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'svf.fs-a1', when: FS, turns: [
      { beat: 'Back at the top with the raft for a second go.' },
      { by: 'b', say: "This time, take the picture before the big drop. While we can still see." },
      { by: 'a', say: "Before the drop. Before the drop. Got it." },
      { beat: 'They take it just before the drop. Both faces, perfectly clear.' },
    ] },
    { id: 'svf.fs-a2', when: FS, turns: [
      { by: 'a', ...V("Hold my arm! Hold my arm steady while I click!", "Hold my arm steady!", "Hold my arm!", "HOLD my ARM! Hold my ARM steady while I CLICK!", "Hold my arm steady while I take it!", "Steady my arm! Be my tripod!") },
      { beat: '{b} grabs {a}\'s arm, they both lean in, and the camera clicks.' },
      { by: 'b', say: "Teamwork! We're a team!" },
    ] },
    { id: 'svf.fs-a3', when: FS, turns: [
      { beat: 'Third time over. This time, both of them are laughing instead of screaming.' },
      { by: 'a', say: "It's actually fun now that we know we survive it." },
      { by: 'b', say: "Fun? Fun? Okay. A bit fun." },
    ] },
    { id: 'svf.fs-a4', when: FS, turns: [
      { by: 'b', say: "Wipe the lens. The lens is wet. That's why it's blurry." },
      { by: 'a', say: "It's a waterfall. The lens is always going to be wet." },
      { by: 'b', say: "Wipe it anyway." },
      { beat: '{a} wipes it on {a.posAdj} shirt, which is also wet. The photo comes out clear anyway.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'svf.fs-t1', when: FS, turns: [
      { beat: '{a} and {b} are carrying the raft back up the path for the fourth time.' },
      { by: 'a', say: "This raft is getting heavier every time." },
      { by: 'b', say: "That's because it's full of water. Tip it out." },
    ] },
    { id: 'svf.fs-t2', when: FS, turns: [
      { by: 'b', ...V("Every photo's just spray. White spray. Like a cloud.", "Every photo's just spray.", "All spray.", "EVERY photo's just SPRAY! White SPRAY! Like a CLOUD!", "Every single photo is just white spray, like a cloud.", "We've taken four photos of a cloud.") },
      { by: 'a', say: "Then we hold the camera closer. Right in front of our faces." },
      { by: 'b', say: "Right in front. Closer than a selfie has ever been." },
    ] },
    { id: 'svf.fs-t3', when: FS, turns: [
      { beat: 'Other teams are showing off their perfect selfies on the way to the park.' },
      { by: 'a', say: "Everybody's got one but us." },
      { by: 'b', say: "Then ours is going to be the best one. Back up the hill." },
    ] },
  ],
  'task-done.any': [
    { id: 'svf.fs-dn1', when: FS, turns: [
      { beat: 'The crew member hands over the tip with the camera.' },
      { by: 'a', say: "A rhino. We have to take a picture with a rhino." },
      { by: 'b', ...V("A rhino? A real, live rhino?", "A real rhino?", "A live rhino?", "A RHINO? A REAL, LIVE RHINO?", "A rhino? A real, live, actual rhino?", "A rhino. The tank of the animal world.") },
    ] },
    { id: 'svf.fs-dn2', when: FS, turns: [
      { by: 'b', say: "We just went over a waterfall. We actually went over a waterfall." },
      { by: 'a', say: "And we've got the photo to prove it." },
      { by: 'b', say: "Nobody at home is going to believe us. Show them the photo." },
    ] },
    { id: 'svf.fs-dn3', when: FS, turns: [
      { beat: '{a} and {b} squeeze the water out of their clothes and run for the jeep.' },
      { by: 'a', say: "I'm going to be wet for the rest of my life." },
      { by: 'b', say: "It's hot. You'll be dry in ten minutes." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'svf.fs-x1', when: FS, turns: [
      { beat: 'The crew member checks the camera. The photo is of {a}\'s ear, very close up.' },
      { by: 'a', say: "That's my ear. That's just my ear." },
      { by: 'b', say: "It's a lovely ear. Back up the hill." },
    ] },
    { id: 'svf.fs-x2', when: FS, turns: [
      { beat: 'Halfway down, the camera flies out of {a}\'s hand and lands in the river.' },
      { by: 'a', ...V("The camera! I dropped the camera!", "I dropped the camera!", "The camera!", "The CAMERA! I DROPPED the CAMERA!", "Oh no, I dropped the camera!", "The camera has gone to live with the fish!") },
      { by: 'b', say: "They'll give us another one. And another go. Up we go." },
    ] },
    { id: 'svf.fs-x3', when: FS, turns: [
      { beat: 'The photo shows {b} perfectly. {a} is just a blur of screaming.' },
      { by: 'b', say: "I look great. You look like a ghost." },
      { by: 'a', say: "I was screaming too hard. Again. We go again." },
    ] },
  ],
};

// ── the rhino (Botch or Watch) ──
const rhino = {
  'don-demo.gag': [
    { id: 'svf.rh-d1', when: RH, turns: [
      don("In this Botch or Watch, whoever didn't do the last one poses next to a white rhino, while their partner takes the picture."),
      { beat: 'Behind him, the rhino lifts its head and stares at him.' },
      don("Get too close, or annoy it, and it charges. Just don't... don't look at it like I'm looking at it. Why is it looking at me?"),
    ] },
  ],
  'don-demo.dry': [
    { id: 'svf.rh-d2', when: RH, turns: [
      don("Walk up slowly. Stand still. Smile. Your partner takes the picture from behind the ranger's line."),
      don("One clear photo, both of you, poser and rhino. And please, nobody insult the rhino. It's very sensitive."),
      { beat: 'The rhino snorts, very loudly. Don takes a large step back.' },
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'svf.rh-w1', when: RH, turns: [
      { by: 'b', say: "You're posing. You're the photogenic one." },
      { by: 'a', ...V("Am I photogenic enough for a rhino?", "Photogenic for a rhino?", "For a rhino?", "Am I PHOTOGENIC enough for a RHINO?", "Am I photogenic enough for a rhino, though?", "Is my face rhino-ready?") },
      { by: 'b', say: "The rhino will love you. Everybody loves you." },
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'svf.rh-w2', when: RH, turns: [
      { by: 'a', say: "I'll pose. I've always wanted to meet a rhino." },
      { by: 'b', say: "Have you? Since when?" },
      { by: 'a', say: "Since about two minutes ago, when I realised it was this or the camera." },
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'svf.rh-w3', when: RH, turns: [
      { by: 'b', say: "You're posing. I'm taking the picture. From a long way away." },
      { by: 'a', say: "Why do I always get the dangerous one?" },
      { by: 'b', say: "Because I'm better at photos." },
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'svf.rh-w4', when: RH, turns: [
      { by: 'a', say: "'Who wants a portrait?' A painting? Are we being painted?" },
      { by: 'b', say: "We're in a national park. It's going to be an animal." },
      { by: 'a', say: "Then it's you. Animals like you." },
    ] },
  ],
  'task-start.any': [
    { id: 'svf.rh-s1', when: RH, turns: [
      { beat: '{a} walks slowly towards the rhino. It keeps chewing. It is enormous.' },
      { by: 'a', say: "Hello. Hi. Hello, big friend." },
      { by: 'b', ...V("Don't talk to it! Just stand next to it!", "Don't talk to it!", "Don't chat!", "DON'T talk to it! Just STAND next to it!", "Don't talk to it, just stand next to it!", "No small talk with the rhino!") },
    ] },
    { id: 'svf.rh-s2', when: RH, turns: [
      { by: 'b', say: "Closer. You need to be closer. You're not in the frame." },
      { by: 'a', say: "How close?" },
      { by: 'b', say: "Closer than you want to be." },
    ] },
    { id: 'svf.rh-s3', when: RH, turns: [
      { beat: '{b} kneels behind the ranger\'s line with the camera. {a} edges towards the rhino, step by step.' },
      { by: 'a', say: "Is it looking at me? Tell me it's not looking at me." },
      { by: 'b', say: "It's not looking at you. It's looking past you. Keep going." },
    ] },
    { id: 'svf.rh-s4', when: RH, turns: [
      { by: 'a', say: "What's the plan if it charges?" },
      { by: 'b', say: "Run." },
      { by: 'a', say: "That's not a plan. That's just a word." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'svf.rh-f1', when: RH, turns: [
      { beat: '{a} stands perfectly still beside the rhino and smiles. The rhino doesn\'t even look up. Click.' },
      { by: 'b', say: "Got it! You and a rhino! In one picture!" },
      { by: 'a', ...V("I'm going to walk away very slowly now.", "Walking away. Slowly.", "Slowly now.", "I'm going to WALK AWAY very SLOWLY now!", "I'm going to walk away now, very, very slowly.", "I shall retreat with dignity and great slowness.") },
    ] },
    { id: 'svf.rh-f2', when: RH, turns: [
      { by: 'a', say: "Should I put my hand on it? Is that too much?" },
      { by: 'b', say: "Don't touch it! Just stand there! Click! Got it!" },
      { by: 'a', say: "I nearly touched a rhino." },
    ] },
    { id: 'svf.rh-f3', when: RH, turns: [
      { beat: 'The rhino turns its head towards the camera at exactly the right moment, like it knows it\'s being photographed.' },
      { by: 'b', say: "It posed! The rhino posed!" },
      { by: 'a', say: "It's a professional. We should be paying it." },
    ] },
    { id: 'svf.rh-f4', when: RH, turns: [
      { by: 'b', say: "That's the best photo of the whole race. You, a rhino, and the sunset." },
      { by: 'a', say: "Is the rhino smiling?" },
      { by: 'b', say: "The rhino is very calm. Calm is the rhino's smile." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'svf.rh-a1', when: RH, turns: [
      { beat: 'Second time, {a} approaches the rhino from the side, very slowly, humming softly.' },
      { by: 'b', say: "Why are you humming?" },
      { by: 'a', say: "It's a lullaby. I'm calming it down." },
      { beat: 'Whether it\'s the lullaby or not, the rhino stays calm. Click.' },
    ] },
    { id: 'svf.rh-a2', when: RH, turns: [
      { by: 'b', say: "Stand still this time! You moved! You keep moving!" },
      { by: 'a', ...V("Because there's a rhino! Next to me! I'm allowed to move!", "There's a rhino! I'm allowed to move!", "There's a rhino!", "Because there's a RHINO! NEXT to me! I'm ALLOWED to MOVE!", "Because there's a rhino right next to me! I'm allowed to move!", "There's a rhino! Movement is a natural response!") },
      { beat: '{a} freezes, rigid as a statue. Click. Perfect.' },
    ] },
    { id: 'svf.rh-a3', when: RH, turns: [
      { beat: 'This time, {b} gets the camera ready before {a} even starts walking.' },
      { by: 'b', say: "I'll take it the second you're close. Don't wait for me." },
      { by: 'a', say: "Fast. Fast is good. Fast is very good." },
    ] },
    { id: 'svf.rh-a4', when: RH, turns: [
      { by: 'a', say: "Last time, I think I said something rude to it by accident." },
      { by: 'b', say: "You said its horn was crooked." },
      { by: 'a', say: "This time I'll say nothing. Nothing at all. I'll just smile." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'svf.rh-t1', when: RH, turns: [
      { beat: '{a} has been chased away three times. The rhino seems to recognise {a.obj} now.' },
      { by: 'b', say: "It knows you. It's seen you three times. It knows you." },
      { by: 'a', say: "Then it should know I'm harmless!" },
    ] },
    { id: 'svf.rh-t2', when: RH, turns: [
      { by: 'a', ...V("My legs are shaking too much. I can't stand still.", "My legs won't stop shaking.", "Can't stand still.", "My LEGS are SHAKING too much! I CAN'T stand STILL!", "My legs are shaking too much to stand still.", "My knees are performing a dance of fear.") },
      { by: 'b', say: "Then sit down. Sit down next to it. Sitting is still." },
      { by: 'a', say: "Sitting next to a rhino. Okay. That's a sentence I never thought I'd say." },
    ] },
    { id: 'svf.rh-t3', when: RH, turns: [
      { beat: 'Every other team has got their picture. The rhino has gone to lie down, and won\'t get up.' },
      { by: 'b', say: "It's taking a nap." },
      { by: 'a', say: "Then I'll pose with a napping rhino. It's still a rhino." },
    ] },
  ],
  'task-done.any': [
    { id: 'svf.rh-dn1', when: RH, turns: [
      { beat: 'The ranger checks the picture and nods. {a} jogs back across the grass, never turning {a.posAdj} back on the rhino.' },
      { by: 'b', say: "You did it. You stood next to a rhino." },
      { by: 'a', ...V("I'm going to tell my grandchildren about this.", "I'll tell my grandchildren.", "Grandchildren will hear this.", "I'm going to tell my GRANDCHILDREN about THIS!", "I'm going to tell my grandchildren about this one day.", "This will be told for generations.") },
    ] },
    { id: 'svf.rh-dn2', when: RH, turns: [
      { by: 'a', say: "Chill Zone. In the village. We run." },
      { by: 'b', say: "Run quietly. Don't wake any other rhinos." },
      { by: 'a', say: "Tiptoe-run. We tiptoe-run." },
    ] },
    { id: 'svf.rh-dn3', when: RH, turns: [
      { beat: '{b} looks at the photo again on the camera screen and laughs.' },
      { by: 'b', say: "Your face. You look like you're about to faint." },
      { by: 'a', say: "I was about to faint. That's my honest face." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'svf.rh-x1', when: RH, turns: [
      { beat: 'The rhino lifts its head, snorts, and charges. {a} runs faster than {a.sub} has ever run in {a.posAdj} life.' },
      { by: 'a', say: "Did you get it? Did you get the picture?" },
      { by: 'b', say: "I got a picture of you running! It's a great picture! It doesn't count!" },
    ] },
    { id: 'svf.rh-x2', when: RH, turns: [
      { beat: '{a} sneezes. The rhino turns. {a} runs.' },
      { by: 'a', ...V("It was a sneeze! It was just a sneeze!", "Just a sneeze!", "I sneezed!", "It was a SNEEZE! It was JUST a SNEEZE!", "It was only a sneeze, I swear!", "A sneeze! An innocent sneeze!") },
      { by: 'b', say: "The rhino didn't know that!" },
    ] },
    { id: 'svf.rh-x3', when: RH, turns: [
      { beat: 'The picture comes out perfectly. Of {a}, alone. The rhino has wandered out of frame.' },
      { by: 'b', say: "The rhino left. It just walked off." },
      { by: 'a', say: "Even the rhino doesn't want to be photographed with me." },
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'svf.rh-v1', when: RH, turns: [
      { by: 'b', say: "You're doing it! You're so brave! Smile!" },
      { by: 'a', say: "Stop shouting! You'll scare it!" },
      { by: 'b', say: "I'm whisper-shouting!" },
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'svf.rh-v2', when: RH, turns: [
      { beat: '{b}\'s hands are shaking so much that the camera keeps going out of focus.' },
      { by: 'b', say: "Hold still! No, I mean me! I need to hold still!" },
      { by: 'a', say: "Hurry up! It's sniffing me!" },
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'svf.rh-v3', when: RH, turns: [
      { beat: '{b} steps over the ranger\'s line to get a better angle.' },
      { by: 'b', say: "Just one step! One step closer for the shot!" },
      { beat: 'The ranger blows a whistle and points back at the line. Thirty minutes.' },
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'svf.rh-v4', when: RH, turns: [
      { beat: '{b} doesn\'t make a sound, holding the camera, finger on the button, barely breathing.' },
      { by: 'a', say: "Say something! Is it working?" },
      { by: 'b', say: "Shhh. I'm a nature photographer now." },
    ] },
  ],
  'helped-botch.any': [
    { id: 'svf.rh-h1', when: RH, turns: [
      { beat: 'When the ranger looks away, {b} throws a bunch of grass towards the rhino to keep it busy.' },
      { by: 'a', say: "Did you just feed it? We're not allowed to feed it!" },
      { by: 'b', say: "It's not feeding. It's distracting. Smile!" },
    ] },
  ],
};

export default mergePools(place, roads, falls, rhino);
