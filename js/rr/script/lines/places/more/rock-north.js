// Rock North, second batch of challenge lines. Same rules as places/rock-north.js: a does the air guitar, b watches.
import { V, mergePools } from '../_kit.js';

const SA = { taskId: 'sauna' };
const IR = { taskId: 'ice-river' };
const AG = { taskId: 'air-guitar' };

const sauna = {
  'task-start.any': [
    { id: 'rn2.sa-s1', when: SA, turns: [
      { beat: 'An attendant pours a ladle of water on the hot stones. A wall of steam rolls over {a} and {b}.' },
      { by: 'b', say: "Why did he do that?" },
      { by: 'a', say: "To make it hotter." },
      { by: 'b', say: "Please make him stop." },
    ] },
    { id: 'rn2.sa-s2', when: SA, turns: [
      { by: 'a', say: "Breathe through your nose. Slowly." },
      { by: 'b', say: "I can't. It burns." },
      { by: 'a', say: "Then through your mouth. Slowly." },
      { by: 'b', say: "That burns too." },
    ] },
    { id: 'rn2.sa-s3', when: SA, turns: [
      { beat: 'The clock on the wall says ten minutes. It doesn\'t seem to be moving.' },
      { by: 'a', ...V("Is that clock broken? It hasn't moved since we sat down.", "Is that clock broken?", "Clock's stuck.", "Is that clock BROKEN? It hasn't MOVED!", "I think that clock might be broken, it hasn't moved at all.", "Time doesn't work in here. Time has melted.") },
      { by: 'b', say: "Don't look at it. It'll feel longer." },
    ] },
    { id: 'rn2.sa-s4', when: SA, turns: [
      { by: 'b', say: "My hat's making it worse. Can I take my hat off?" },
      { by: 'a', say: "Clothes on. All of them. That's the rule." },
      { by: 'b', say: "Fine. Hat on." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rn2.sa-f1', when: SA, turns: [
      { beat: '{a} and {b} sit back to back, holding each other up, eyes closed, for the full ten minutes.' },
      { by: 'b', say: "Are you asleep?" },
      { by: 'a', say: "No. I'm just trying not to think about it." },
      { beat: 'The bell rings. They\'re through.' },
    ] },
    { id: 'rn2.sa-f2', when: SA, turns: [
      { by: 'a', say: "Sing something. Something long." },
      { beat: '{b} sings a song, quietly, all the way through. By the last verse, the bell rings.' },
      { by: 'a', say: "That really helped." },
    ] },
    { id: 'rn2.sa-f3', when: SA, turns: [
      { beat: 'Around them, other racers fan themselves and groan. {a} and {b} sit perfectly still.' },
      { by: 'a', say: "Are we the only ones not dying?" },
      { by: 'b', say: "Don't say it out loud. Just keep not dying." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rn2.sa-a1', when: SA, turns: [
      { by: 'a', say: "Last time you got up at minute nine. Minute nine!" },
      { by: 'b', say: "I know. I'm not doing that again." },
      { by: 'a', say: "This time, hold on to the bench, and don't let go." },
      { beat: '{b} holds on to the bench for ten whole minutes. The bell rings.' },
    ] },
    { id: 'rn2.sa-a2', when: SA, turns: [
      { beat: 'Back in the heat, {a} hums the same calm note over and over.' },
      { by: 'b', say: "What is that?" },
      { by: 'a', say: "It helps me stay calm. Try it." },
      { by: 'b', say: "Okay. Keep doing it." },
    ] },
    { id: 'rn2.sa-a3', when: SA, turns: [
      { by: 'b', ...V("Count down from six hundred. In your head. One number a second.", "Count down from six hundred.", "Six hundred. Count.", "COUNT down from SIX HUNDRED! One number a SECOND!", "Let's count down from six hundred, one number a second.", "Six hundred seconds. Each one a tiny enemy.") },
      { by: 'a', say: "What if I lose count?" },
      { by: 'b', say: "Then just start again. It still helps." },
      { beat: 'Counting, they make it to the bell.' },
    ] },
    { id: 'rn2.sa-a4', when: SA, turns: [
      { beat: '{a} and {b} sit on the bottom bench this time.' },
      { by: 'a', say: "Bottom bench. Cooler. Last time we sat at the top." },
      { by: 'b', say: "Never again." },
    ] },
  ],
  'task-done.any': [
    { id: 'rn2.sa-dn1', when: SA, turns: [
      { by: 'b', say: "I'm so hot. I can't feel my face." },
      { by: 'a', say: "Your face is bright red." },
      { by: 'b', say: "I don't care. We did it." },
    ] },
    { id: 'rn2.sa-dn2', when: SA, turns: [
      { beat: 'The door opens, and the freezing air outside hits {a} and {b} like a slap.' },
      { by: 'a', say: "Oh, that's nice. That's so nice." },
      { by: 'b', say: "Enjoy it. We're about to go in the river." },
    ] },
    { id: 'rn2.sa-dn3', when: SA, turns: [
      { by: 'a', say: "I think I lost a whole bucket of water in there." },
      { by: 'b', say: "Drink something. Anything." },
      { by: 'a', say: "Later. We have to cross the river." },
      { by: 'b', say: "Okay. After the river." },
    ] },
    { id: 'rn2.sa-dn4', when: SA, turns: [
      { beat: '{a} unzips {a.posAdj} coat. A cloud of steam pours out of it.' },
      { by: 'b', say: "You're steaming." },
      { by: 'a', say: "I know. I feel like I'm cooking." },
    ] },
    { id: 'rn2.sa-dn5', when: SA, turns: [
      { by: 'b', say: "Ten minutes felt like ten years." },
      { by: 'a', say: "But we did it." },
      { by: 'b', say: "We did. Come on." },
    ] },
  ],
};

const river = {
  'task-start.any': [
    { id: 'rn2.ir-s1', when: IR, turns: [
      { beat: 'Steam rises off {a} and {b} as they stand at the edge of the ice-cold river.' },
      { by: 'b', say: "We're steaming. Look at us." },
      { by: 'a', say: "This is going to be such a shock." },
      { by: 'b', say: "Just go fast. Don't stop." },
    ] },
    { id: 'rn2.ir-s2', when: IR, turns: [
      { by: 'a', say: "Jump when it comes close. Don't jump when it's going away." },
      { by: 'b', say: "How do I know if it's coming or going?" },
      { by: 'a', say: "Watch it. If it's getting closer, jump." },
    ] },
    { id: 'rn2.ir-s3', when: IR, turns: [
      { beat: 'A slab of ice the size of a door drifts past, with a bird standing on it.' },
      { by: 'b', say: "There's a bird on that one. If it holds a bird, it holds me." },
      { by: 'a', say: "It doesn't. A bird weighs nothing. Pick a bigger one." },
    ] },
    { id: 'rn2.ir-s4', when: IR, turns: [
      { by: 'a', say: "Arms out. Like a tightrope walker." },
      { by: 'b', say: "Like this?" },
      { by: 'a', say: "Like that. Go." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rn2.ir-f1', when: IR, turns: [
      { beat: '{a} leaps to the first floe. It wobbles, settles. {b} lands right behind.' },
      { by: 'a', say: "Next one! Before it moves!" },
      { beat: 'Floe after floe, they hop across without a single slip and land on the far bank.' },
      { by: 'b', say: "We did it! We didn't even get wet!" },
    ] },
    { id: 'rn2.ir-f2', when: IR, turns: [
      { by: 'b', say: "Don't stop! If you stop, it sinks!" },
      { by: 'a', say: "Does it?" },
      { by: 'b', say: "I don't know! Don't stop!" },
      { beat: 'Nobody stops. They make it across.' },
    ] },
    { id: 'rn2.ir-f3', when: IR, turns: [
      { beat: 'A huge floe drifts right up to the bank. {a} and {b} jump on it together and ride it across like a ferry.' },
      { by: 'a', say: "It's taking us across!" },
      { by: 'b', say: "Don't move! Just stay on!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rn2.ir-a1', when: IR, turns: [
      { by: 'b', say: "I'm so cold I can't feel my feet. I can't tell if I'm on the ice." },
      { by: 'a', say: "I'll tell you. You're on the ice. Now jump." },
      { beat: '{a} calls every jump, and {b} makes them all.' },
    ] },
    { id: 'rn2.ir-a2', when: IR, turns: [
      { beat: '{a} climbs out of the water, teeth chattering, and runs straight back to the start.' },
      { by: 'a', say: "Again. N-now. Before I think about it." },
      { by: 'b', say: "Go! I'm right behind you!" },
      { beat: 'This time {a} makes it all the way across.' },
    ] },
    { id: 'rn2.ir-a3', when: IR, turns: [
      { by: 'a', say: "We go together. Same floe, every time." },
      { by: 'b', say: "What if it sinks with two?" },
      { by: 'a', say: "Then pick big ones." },
      { beat: 'It doesn\'t sink. Two at a time, they cross.' },
    ] },
    { id: 'rn2.ir-a4', when: IR, turns: [
      { beat: 'This time {b} waits on the bank, watching the floes for a long time before moving.' },
      { by: 'b', say: "They come in a line every minute or so. Wait for the line." },
      { beat: 'The line comes. They run across it like stepping stones.' },
    ] },
  ],
  'task-done.any': [
    { id: 'rn2.ir-dn1', when: IR, turns: [
      { by: 'a', say: "I can't feel my fingers. Can you open the tip?" },
      { by: 'b', say: "I can't feel mine either." },
      { beat: '{b} opens the tip with {b.posAdj} teeth.' },
    ] },
    { id: 'rn2.ir-dn2', when: IR, turns: [
      { beat: '{a} and {b} jog on the spot on the far bank, trying to warm up.' },
      { by: 'b', say: "Hot sauna, then a cold river. My body doesn't know what's happening." },
      { by: 'a', say: "Mine neither. Keep moving." },
    ] },
    { id: 'rn2.ir-dn3', when: IR, turns: [
      { by: 'a', say: "Feel my hand. Feel how cold it is." },
      { by: 'b', say: "It's freezing!" },
      { by: 'a', say: "I know. Hold it." },
    ] },
    { id: 'rn2.ir-dn4', when: IR, turns: [
      { beat: 'The cab driver turns the heater all the way up as {a} and {b} climb in, dripping.' },
      { by: 'b', say: "Oh my God, the heater. I love the heater." },
      { by: 'a', say: "Turn it up more, please!" },
    ] },
    { id: 'rn2.ir-dn5', when: IR, turns: [
      { by: 'b', say: "We just crossed a river on ice. Like explorers." },
      { by: 'a', say: "Explorers had better coats than us." },
      { by: 'b', say: "And they didn't sit in a sauna first." },
    ] },
  ],
};

const guitar = {
  'task-start.any': [
    { id: 'rn2.ag-s1', when: AG, turns: [
      { beat: 'The lights come up, white and blinding. {a} can\'t see a single face in the crowd.' },
      { by: 'a', say: "I can't see them. I can't see anyone." },
      { by: 'b', say: "Good! Then pretend they aren't there!" },
      { by: 'a', say: "I can hear them, though." },
    ] },
    { id: 'rn2.ag-s2', when: AG, turns: [
      { by: 'b', say: "Make faces. The face is half of it." },
      { by: 'a', say: "What kind of faces?" },
      { by: 'b', say: "Big ones. Like you're really feeling it." },
    ] },
    { id: 'rn2.ag-s3', when: AG, turns: [
      { beat: 'A roadie pretends to hand {a} a guitar, very seriously.' },
      { by: 'a', say: "Thank you. Okay. Here we go." },
      { by: 'b', say: "You're already doing it! Go!" },
    ] },
    { id: 'rn2.ag-s4', when: AG, turns: [
      { by: 'a', say: "What if they boo?" },
      { by: 'b', say: "Then you play louder." },
      { by: 'a', say: "It's an air guitar. There's nothing to play louder." },
      { by: 'b', say: "Then move more. Bigger." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rn2.ag-f1', when: AG, turns: [
      { beat: 'On the first big chord, {a} spins round in a full circle and lands on one knee.' },
      { by: 'b', say: "The meter's going up! It's going up!" },
      { beat: 'The meter goes all the way up. The crowd chants.' },
      { by: 'a', say: "Are they chanting for me? They're chanting for me!" },
    ] },
    { id: 'rn2.ag-f2', when: AG, turns: [
      { by: 'b', say: "Wave at them! Make them wave back!" },
      { beat: '{a} waves both arms from side to side, and the whole crowd copies.' },
      { by: 'a', say: "Look at them! They're doing it!" },
      { by: 'b', say: "Please don't let it go to your head." },
    ] },
    { id: 'rn2.ag-f3', when: AG, turns: [
      { beat: '{a} pretends to smash the guitar on the floor. The crowd roars.' },
      { by: 'a', say: "Was that okay? Was that too much?" },
      { by: 'b', say: "It was perfect. They loved it." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rn2.ag-a1', when: AG, turns: [
      { by: 'b', say: "You're too stiff. Loosen up." },
      { by: 'a', say: "I'm trying! I don't know how!" },
      { beat: '{a} plays the next song with {a.posAdj} whole body, and the crowd starts to cheer.' },
    ] },
    { id: 'rn2.ag-a2', when: AG, turns: [
      { beat: 'Between songs, {a} wipes {a.posAdj} face and looks down at {b} at the side of the stage.' },
      { by: 'a', say: "They hate me." },
      { by: 'b', say: "They don't know you yet. Do it like you do at home." },
      { by: 'a', say: "Like at home. Okay." },
      { beat: '{a} goes for it, and the meter fills.' },
    ] },
    { id: 'rn2.ag-a3', when: AG, turns: [
      { by: 'a', ...V("I'm going to play to you. Just you. Forget the crowd.", "I'll play to you.", "Just you.", "I'm playing to YOU! FORGET the crowd!", "I'm just going to play to you and forget the crowd.", "You are my only audience. My audience of one.") },
      { by: 'b', say: "Then play to me! I'm screaming for you!" },
      { beat: '{b} screams for {a}, and soon the whole crowd is screaming too.' },
    ] },
    { id: 'rn2.ag-a4', when: AG, turns: [
      { beat: 'The drummer gives {a} a wink and starts a much faster beat.' },
      { by: 'b', say: "Faster! He's helping you! Go faster!" },
      { beat: 'At the faster beat, {a} finally lets go, and the meter fills.' },
    ] },
  ],
  'task-done.any': [
    { id: 'rn2.ag-dn1', when: AG, turns: [
      { by: 'a', say: "Did you see me? Did you SEE me?" },
      { by: 'b', say: "Everyone saw you. Everyone in the city saw you." },
      { by: 'a', say: "That was the best thing I've ever done." },
    ] },
    { id: 'rn2.ag-dn2', when: AG, turns: [
      { beat: '{a} walks off stage into {b}\'s arms, completely out of breath.' },
      { by: 'b', say: "You were incredible. Where did that come from?" },
      { by: 'a', say: "I don't know. I just went for it." },
    ] },
    { id: 'rn2.ag-dn3', when: AG, turns: [
      { by: 'b', say: "Everybody was screaming." },
      { by: 'a', say: "For me?" },
      { by: 'b', say: "For you. Come on, the Chill Zone." },
    ] },
    { id: 'rn2.ag-dn4', when: AG, turns: [
      { beat: 'Backstage, {a} sits down and stares at {a.posAdj} empty hands.' },
      { by: 'a', say: "I can't believe I did that." },
      { by: 'b', say: "I can. You were amazing." },
    ] },
    { id: 'rn2.ag-dn5', when: AG, turns: [
      { by: 'a', say: "Thank you! Thank you, everybody! Goodnight!" },
      { by: 'b', say: "Okay, they can't hear you. We're backstage." },
      { by: 'a', say: "I don't care. That was amazing." },
    ] },
  ],
};

export default mergePools(sauna, river, guitar);
