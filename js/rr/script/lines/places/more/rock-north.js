// Rock North, second batch of challenge lines. Same rules as places/rock-north.js: a does the air guitar, b watches.
import { V, mergePools } from '../_kit.js';

const SA = { taskId: 'sauna' };
const IR = { taskId: 'ice-river' };
const AG = { taskId: 'air-guitar' };

const sauna = {
  'task-start.any': [
    { id: 'rn2.sa-s1', when: SA, turns: [
      { beat: 'An attendant pours a ladle of water on the hot stones. A wall of steam rolls over {a} and {b}.' },
      { by: 'b', say: "Why did he do that? Why would anyone do that?" },
      { by: 'a', say: "To make it hotter. That's his whole job." },
      { by: 'b', say: "I hate his whole job." },
    ] },
    { id: 'rn2.sa-s2', when: SA, turns: [
      { by: 'a', say: "Breathe through your nose. Slowly." },
      { by: 'b', say: "My nose is on fire." },
      { by: 'a', say: "Then breathe through your mouth. Slowly." },
      { by: 'b', say: "Now my mouth is on fire." },
    ] },
    { id: 'rn2.sa-s3', when: SA, turns: [
      { beat: 'The clock on the wall says ten minutes. It doesn\'t seem to be moving.' },
      { by: 'a', ...V("Is that clock broken? It hasn't moved since we sat down.", "Is that clock broken?", "Clock's stuck.", "Is that clock BROKEN? It hasn't MOVED!", "I think that clock might be broken, it hasn't moved at all.", "Time doesn't work in here. Time has melted.") },
      { by: 'b', say: "Don't look at it. Clocks hate being watched." },
    ] },
    { id: 'rn2.sa-s4', when: SA, turns: [
      { by: 'b', say: "My hat's making it worse. Can I take my hat off?" },
      { by: 'a', say: "Clothes on. All of them. That's the rule." },
      { by: 'b', say: "My hat is a clothes. Okay. Hat on." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rn2.sa-f1', when: SA, turns: [
      { beat: '{a} and {b} sit back to back, holding each other up, eyes closed, for the full ten minutes.' },
      { by: 'b', say: "Are you asleep?" },
      { by: 'a', say: "No. I'm somewhere very cold, in my head. Don't wake me." },
      { beat: 'The bell rings. They\'re through.' },
    ] },
    { id: 'rn2.sa-f2', when: SA, turns: [
      { by: 'a', say: "Sing something. Something long." },
      { beat: '{b} sings a very long song with a lot of verses. By the last verse, the bell rings.' },
      { by: 'a', say: "That's the best song you've ever sung." },
    ] },
    { id: 'rn2.sa-f3', when: SA, turns: [
      { beat: 'Around them, other racers fan themselves and groan. {a} and {b} sit as calm as two stones.' },
      { by: 'a', say: "Are we the only ones not dying?" },
      { by: 'b', say: "Don't say it out loud. Just keep not dying." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rn2.sa-a1', when: SA, turns: [
      { by: 'a', say: "Last time you got up at minute nine. Minute nine!" },
      { by: 'b', say: "I know. I've thought about it every second since." },
      { by: 'a', say: "This time, sit on your hands." },
      { beat: '{b} sits on {b.posAdj} hands for ten whole minutes. The bell rings.' },
    ] },
    { id: 'rn2.sa-a2', when: SA, turns: [
      { beat: 'Back in the heat, {a} hums the same calm note over and over.' },
      { by: 'b', say: "What is that?" },
      { by: 'a', say: "It's the sound of an air conditioner. I'm being an air conditioner." },
      { by: 'b', say: "Do it louder. It's working." },
    ] },
    { id: 'rn2.sa-a3', when: SA, turns: [
      { by: 'b', ...V("Count down from six hundred. In your head. One number a second.", "Count down from six hundred.", "Six hundred. Count.", "COUNT down from SIX HUNDRED! One number a SECOND!", "Let's count down from six hundred, one number a second.", "Six hundred seconds. Each one a tiny enemy.") },
      { by: 'a', say: "What if I lose count?" },
      { by: 'b', say: "Start from three hundred. Nobody will know." },
      { beat: 'Counting, they make it to the bell.' },
    ] },
    { id: 'rn2.sa-a4', when: SA, turns: [
      { beat: '{a} and {b} sit down on the top bench by mistake and slide straight down to the bottom one.' },
      { by: 'a', say: "Bottom bench. Cooler. Last time we sat at the top like idiots." },
      { by: 'b', say: "Like hot idiots." },
    ] },
  ],
  'task-done.any': [
    { id: 'rn2.sa-dn1', when: SA, turns: [
      { by: 'b', say: "My face is melting. Is my face still on my head?" },
      { by: 'a', say: "Mostly. Some of it's on your coat." },
      { by: 'b', say: "Leave it. I don't care. I'm alive." },
    ] },
    { id: 'rn2.sa-dn2', when: SA, turns: [
      { beat: 'The door opens, and the freezing air outside hits {a} and {b} like a slap.' },
      { by: 'a', say: "Oh, that's nice. That's so nice." },
      { by: 'b', say: "Enjoy it. In a minute we'll be begging to go back in." },
    ] },
    { id: 'rn2.sa-dn3', when: SA, turns: [
      { by: 'a', say: "I think I lost a whole bucket of water in there." },
      { by: 'b', say: "Drink something. Anything." },
      { by: 'a', say: "There's a river right there." },
      { by: 'b', say: "Not that." },
    ] },
    { id: 'rn2.sa-dn4', when: SA, turns: [
      { beat: '{a} unzips {a.posAdj} coat. A cloud of steam pours out of it.' },
      { by: 'b', say: "You're smoking." },
      { by: 'a', say: "I'm cooking. There's a difference." },
    ] },
    { id: 'rn2.sa-dn5', when: SA, turns: [
      { by: 'b', say: "Ten minutes felt like ten years." },
      { by: 'a', say: "And look at us. Ten years older." },
      { by: 'b', say: "Speak for yourself. I'm glowing." },
    ] },
  ],
};

const river = {
  'task-start.any': [
    { id: 'rn2.ir-s1', when: IR, turns: [
      { beat: 'Steam rises off {a} and {b} as they stand at the edge of the ice-cold river.' },
      { by: 'b', say: "We're steaming. We look like dragons." },
      { by: 'a', say: "Dragons don't cross frozen rivers." },
      { by: 'b', say: "These ones do." },
    ] },
    { id: 'rn2.ir-s2', when: IR, turns: [
      { by: 'a', say: "Jump when it comes close. Don't jump when it's going away." },
      { by: 'b', say: "How do I know if it's coming or going?" },
      { by: 'a', say: "If it's getting bigger, it's coming." },
    ] },
    { id: 'rn2.ir-s3', when: IR, turns: [
      { beat: 'A slab of ice the size of a door drifts past, with a bird standing on it.' },
      { by: 'b', ...V("That bird's doing it. If a bird can do it, we can do it.", "If a bird can, we can.", "Bird did it.", "That BIRD'S doing it! If a BIRD can, WE can!", "If that bird can ride the ice, so can we.", "The bird is our teacher now.") },
      { by: 'a', say: "The bird can fly if it falls." },
    ] },
    { id: 'rn2.ir-s4', when: IR, turns: [
      { by: 'a', say: "Arms out. Like a tightrope walker." },
      { by: 'b', say: "I've never walked a tightrope." },
      { by: 'a', say: "Neither have I. Arms out anyway." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rn2.ir-f1', when: IR, turns: [
      { beat: '{a} leaps to the first floe. It wobbles, settles. {b} lands right behind.' },
      { by: 'a', say: "Next one! Before it moves!" },
      { beat: 'Floe after floe, they hop across without a single slip and land on the far bank.' },
      { by: 'b', say: "We should do this professionally." },
    ] },
    { id: 'rn2.ir-f2', when: IR, turns: [
      { by: 'b', say: "Don't stop! If you stop, it sinks!" },
      { by: 'a', say: "Does it?" },
      { by: 'b', say: "I don't know! Don't stop!" },
      { beat: 'Nobody stops. They make it across.' },
    ] },
    { id: 'rn2.ir-f3', when: IR, turns: [
      { beat: 'A huge floe drifts right up to the bank. {a} and {b} jump on it together and ride it across like a ferry.' },
      { by: 'a', say: "Free ferry!" },
      { by: 'b', say: "Best ferry I've ever been on." },
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
      { by: 'a', say: "Again. N-now. Before I f-freeze solid." },
      { by: 'b', say: "That's the fastest I've ever seen you move." },
      { beat: 'Fast and angry, {a} makes it all the way across.' },
    ] },
    { id: 'rn2.ir-a3', when: IR, turns: [
      { by: 'a', ...V("We go together. You on my floe, me on your floe. Nobody alone.", "We go together.", "Together.", "We go TOGETHER! NOBODY alone!", "Let's go together, so nobody's on a floe alone.", "Two people, one floe, one destiny.") },
      { by: 'b', say: "What if it sinks with two?" },
      { by: 'a', say: "Then we sink together." },
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
      { by: 'b', say: "Hot sauna. Cold river. What's next? A volcano?" },
      { by: 'a', say: "Don't give them ideas." },
    ] },
    { id: 'rn2.ir-dn3', when: IR, turns: [
      { by: 'a', say: "Feel my hand. Feel how cold it is." },
      { by: 'b', say: "That's not a hand. That's a fish." },
      { by: 'a', say: "Hold it anyway. It needs warming." },
    ] },
    { id: 'rn2.ir-dn4', when: IR, turns: [
      { beat: 'The cab driver turns the heater all the way up as {a} and {b} climb in, dripping.' },
      { by: 'b', say: "I love you. Not you. The heater." },
      { by: 'a', say: "I love the heater too." },
    ] },
    { id: 'rn2.ir-dn5', when: IR, turns: [
      { by: 'b', say: "We just crossed a river on ice. Like explorers." },
      { by: 'a', say: "Explorers had better coats." },
      { by: 'b', say: "Explorers didn't have a sauna first." },
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
      { by: 'b', say: "Remember the face. The face is half of it." },
      { by: 'a', say: "Which face?" },
      { by: 'b', say: "The face like you've just tasted something amazing. Do that the whole time." },
    ] },
    { id: 'rn2.ag-s3', when: AG, turns: [
      { beat: 'A roadie hands {a} nothing at all, very seriously, like it\'s a priceless guitar.' },
      { by: 'a', say: "Thank you. I'll look after it." },
      { by: 'b', ...V("You're already doing it! You're already a rock star!", "You're already a rock star!", "Rock star!", "You're ALREADY doing it! You're a ROCK STAR!", "Look at that, you're already a rock star.", "The air guitar has chosen you.") },
    ] },
    { id: 'rn2.ag-s4', when: AG, turns: [
      { by: 'a', say: "What if they boo?" },
      { by: 'b', say: "Then you play louder." },
      { by: 'a', say: "It's an air guitar. It doesn't go louder." },
      { by: 'b', say: "It does if you believe." },
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
      { beat: '{a} waves the whole crowd from left to right like a sea. They follow every move.' },
      { by: 'a', say: "I control them. I control them all." },
      { by: 'b', say: "Please don't let it go to your head." },
    ] },
    { id: 'rn2.ag-f3', when: AG, turns: [
      { beat: '{a} pretends to smash the guitar on the floor. The crowd roars.' },
      { by: 'a', say: "Was that okay? I broke my air guitar." },
      { by: 'b', say: "It was perfect. They'll get you another one." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rn2.ag-a1', when: AG, turns: [
      { by: 'b', say: "You're too stiff. You look like a robot playing a guitar." },
      { by: 'a', say: "Then I'll be a robot rock star." },
      { beat: '{a} plays the next song like a robot, very stiff and very serious. The crowd thinks it\'s hilarious.' },
    ] },
    { id: 'rn2.ag-a2', when: AG, turns: [
      { beat: 'Between songs, {a} wipes {a.posAdj} face and looks down at {b} at the side of the stage.' },
      { by: 'a', say: "They hate me." },
      { by: 'b', say: "They don't know you yet. Show them the shower version." },
      { by: 'a', say: "The shower version. Okay." },
      { beat: 'The shower version fills the meter.' },
    ] },
    { id: 'rn2.ag-a3', when: AG, turns: [
      { by: 'a', ...V("I'm going to play to you. Just you. Forget the crowd.", "I'll play to you.", "Just you.", "I'm playing to YOU! FORGET the crowd!", "I'm just going to play to you and forget the crowd.", "You are my only audience. My audience of one.") },
      { by: 'b', say: "Then play to me! I'm screaming for you!" },
      { beat: '{b} screams for {a}, and soon the whole crowd is screaming too.' },
    ] },
    { id: 'rn2.ag-a4', when: AG, turns: [
      { beat: 'The drummer gives {a} a wink and starts a much faster beat.' },
      { by: 'b', say: "Faster! He's helping you! Go faster!" },
      { beat: 'At the faster speed, {a}\'s air guitar finally looks like it\'s on fire. The meter fills.' },
    ] },
  ],
  'task-done.any': [
    { id: 'rn2.ag-dn1', when: AG, turns: [
      { by: 'a', say: "Did you see me? Did you SEE me?" },
      { by: 'b', say: "Everyone saw you. Everyone in the city saw you." },
      { by: 'a', say: "I'm never going to be this cool again." },
    ] },
    { id: 'rn2.ag-dn2', when: AG, turns: [
      { beat: '{a} walks off stage into {b}\'s arms, completely out of breath.' },
      { by: 'b', say: "You were incredible. Where did that come from?" },
      { by: 'a', say: "From the air. It came from the air." },
    ] },
    { id: 'rn2.ag-dn3', when: AG, turns: [
      { by: 'b', say: "Somebody asked me for your autograph." },
      { by: 'a', say: "Really?" },
      { by: 'b', say: "No. But they will." },
    ] },
    { id: 'rn2.ag-dn4', when: AG, turns: [
      { beat: 'Backstage, {a} sits down and stares at {a.posAdj} empty hands.' },
      { by: 'a', say: "I miss it already. My guitar." },
      { by: 'b', say: "It's still there. It's always there. That's the beauty of it." },
    ] },
    { id: 'rn2.ag-dn5', when: AG, turns: [
      { by: 'a', say: "Thank you! Thank you, everybody! Goodnight!" },
      { by: 'b', say: "They've gone. You're talking to an empty corridor." },
      { by: 'a', say: "The corridor loved it." },
    ] },
  ],
};

export default mergePools(sauna, river, guitar);
