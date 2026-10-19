// Great Wall Hills, second batch of challenge lines. Same rules as places/great-wall-hills.js: at the skewers a
// cooks and b eats; at the rickshaw a pulls and b rides.
import { V, mergePools } from '../_kit.js';

const SK = { taskId: 'skydive' };
const SW = { taskId: 'skewers' };
const RK = { taskId: 'rickshaw' };

const skydive = {
  'task-start.any': [
    { id: 'gwh2.sk-s1', when: SK, turns: [
      { beat: 'The little plane rattles as it climbs. {b} grips the bench with both hands.' },
      { by: 'b', say: "Is it supposed to shake like this?" },
      { by: 'a', say: "Yes. Probably. We're getting out of it anyway." },
    ] },
    { id: 'gwh2.sk-s2', when: SK, turns: [
      { by: 'a', say: "My instructor just gave me a thumbs up." },
      { by: 'b', say: "That's good." },
      { by: 'a', say: "He was laughing when he did it." },
      { by: 'b', say: "That's less good." },
    ] },
    { id: 'gwh2.sk-s3', when: SK, turns: [
      { beat: 'The door slides open. Wind howls into the plane.' },
      { by: 'b', ...V("I take back everything I said about wanting adventure. Every word.", "I take it all back.", "Take it back.", "I take back EVERYTHING I said about ADVENTURE!", "I'd like to take back everything I ever said about wanting adventure.", "Adventure was a mistake. I'm returning it.") },
      { by: 'a', say: "Too late. Adventure's here." },
    ] },
    { id: 'gwh2.sk-s4', when: SK, turns: [
      { by: 'a', say: "On the way down, look at me. I want to see your face." },
      { by: 'b', say: "Why?" },
      { by: 'a', say: "So I can remember it forever. And laugh." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gwh2.sk-f1', when: SK, turns: [
      { beat: 'The parachutes open with a snap, and suddenly it\'s quiet. {a} and {b} drift side by side.' },
      { by: 'b', say: "It's so quiet up here." },
      { by: 'a', say: "Enjoy it. The stadium's coming up fast." },
      { beat: 'They land on the grass, right in the middle.' },
    ] },
    { id: 'gwh2.sk-f2', when: SK, turns: [
      { by: 'a', say: "There! The round one with the grass! Steer left!" },
      { by: 'b', say: "I'm not steering! He's steering!" },
      { beat: 'The instructors steer left. Both of them land inside the stadium.' },
    ] },
    { id: 'gwh2.sk-f3', when: SK, turns: [
      { beat: '{a} lands, rolls and pops up with both arms in the air. A few people in the stands clap.' },
      { by: 'a', say: "Did you see that? I stuck the landing!" },
      { by: 'b', say: "I saw. I was lying on my back, but I saw." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gwh2.sk-a1', when: SK, turns: [
      { beat: '{a} and {b} land in a field of cabbages a long way from the stadium.' },
      { by: 'b', say: "Cabbages. We're in cabbages." },
      { by: 'a', say: "The stadium's that way. I can see the lights. Run!" },
    ] },
    { id: 'gwh2.sk-a2', when: SK, turns: [
      { by: 'b', say: "We're on a roof. Why are we on a roof?" },
      { by: 'a', say: "The wind. The wind did it." },
      { beat: 'A worker opens a door in the roof and waves them down the stairs.' },
      { by: 'b', say: "Thank you! Which way's the stadium?" },
    ] },
    { id: 'gwh2.sk-a3', when: SK, turns: [
      { by: 'a', ...V("Grab a bike. There's a whole row of bikes. We'll bring it back.", "Grab a bike.", "Bike. Go.", "GRAB a BIKE! There's a whole ROW of them!", "There's a row of bikes, let's grab one and bring it back.", "Two wheels, one dream.") },
      { by: 'b', say: "Is that allowed?" },
      { by: 'a', say: "There's a man waving at us to take one. It's allowed." },
      { beat: 'They pedal into the stadium side by side, parachutes flapping behind them.' },
    ] },
    { id: 'gwh2.sk-a4', when: SK, turns: [
      { beat: '{b} lands in a fountain in a square outside the stadium and sits up, soaked.' },
      { by: 'b', say: "I'm okay! I'm in a fountain, but I'm okay!" },
      { by: 'a', say: "Get out of the fountain! The stadium's across the road!" },
    ] },
  ],
  'task-done.any': [
    { id: 'gwh2.sk-dn1', when: SK, turns: [
      { by: 'a', say: "My ears won't pop. Everything sounds like I'm under water." },
      { by: 'b', say: "WHAT?" },
      { by: 'a', say: "Exactly." },
    ] },
    { id: 'gwh2.sk-dn2', when: SK, turns: [
      { beat: '{a} and {b} look up at the sky they\'ve just fallen out of.' },
      { by: 'b', say: "We were up there. Right up there." },
      { by: 'a', say: "And now we're down here. That's the best part." },
    ] },
    { id: 'gwh2.sk-dn3', when: SK, turns: [
      { by: 'b', say: "I want to call my mum. I want to tell her I jumped out of a plane." },
      { by: 'a', say: "She'll say you're mad." },
      { by: 'b', say: "She'll be right." },
    ] },
    { id: 'gwh2.sk-dn4', when: SK, turns: [
      { beat: 'The instructors high-five {a} and {b} and start rolling up the parachutes.' },
      { by: 'a', say: "Thank you! Thank you for not dropping me!" },
      { by: 'b', say: "Mine said I screamed the whole way. I didn't think I was screaming." },
    ] },
    { id: 'gwh2.sk-dn5', when: SK, turns: [
      { by: 'a', say: "Next tip. Food. Something on a stick." },
      { by: 'b', say: "After that, I could eat anything." },
      { by: 'a', say: "Remember you said that." },
    ] },
  ],
};

const skewers = {
  'task-start.any': [
    { id: 'gwh2.sw-s1', when: SW, turns: [
      { beat: '{a} drops the first skewer into the hot oil. It sizzles and pops loudly.' },
      { by: 'b', say: "It's screaming. The beetle's screaming." },
      { by: 'a', say: "That's the oil. Beetles don't scream." },
      { by: 'b', say: "This one does." },
    ] },
    { id: 'gwh2.sw-s2', when: SW, turns: [
      { by: 'b', say: "How long do I have to chew?" },
      { by: 'a', say: "As little as possible." },
      { by: 'b', say: "That's the best plan you've ever had." },
    ] },
    { id: 'gwh2.sw-s3', when: SW, turns: [
      { beat: 'The stall owner hands {b} a tiny cup of tea to wash things down.' },
      { by: 'b', ...V("That's not enough tea. I need a bucket of tea.", "I need more tea.", "More tea.", "That's NOT enough tea! I need a BUCKET!", "That's not nearly enough tea, I'll need a bucket.", "Bring me a lake of tea.") },
      { by: 'a', say: "Start with the cup. Then we'll talk about buckets." },
    ] },
    { id: 'gwh2.sw-s4', when: SW, turns: [
      { by: 'a', say: "Close your eyes. I'll put it in your mouth." },
      { by: 'b', say: "That sounds worse." },
      { by: 'a', say: "Then open your eyes and look at the sky." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gwh2.sw-f1', when: SW, turns: [
      { beat: '{b} crunches through a scorpion, swallows, and nods slowly.' },
      { by: 'b', say: "Salty. Crunchy. Like a crisp with legs." },
      { by: 'a', say: "Are you going to be okay?" },
      { by: 'b', say: "Give me the next one before I change my mind." },
    ] },
    { id: 'gwh2.sw-f2', when: SW, turns: [
      { by: 'a', say: "Last stick. Last one. Then we're free." },
      { beat: '{b} eats the last stick in one go and slams it down on the counter.' },
      { by: 'b', say: "Done! Every leg! Every wing!" },
    ] },
    { id: 'gwh2.sw-f3', when: SW, turns: [
      { beat: 'The stall owner watches {b} eat everything without blinking and gives a small round of applause.' },
      { by: 'a', say: "He's clapping for you." },
      { by: 'b', say: "Tell him the worms were a bit chewy." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gwh2.sw-a1', when: SW, turns: [
      { by: 'a', say: "Don't look at them. Look at me. Look at my face." },
      { by: 'b', say: "Your face isn't helping." },
      { by: 'a', say: "Then look at the money in your head. A big pile of it." },
      { beat: 'Thinking about the money, {b} gets through the whole set.' },
    ] },
    { id: 'gwh2.sw-a2', when: SW, turns: [
      { beat: '{b} spits a beetle back into a bowl. The stall owner shakes his head and puts out a fresh set.' },
      { by: 'b', say: "Sorry! Sorry. It looked at me." },
      { by: 'a', say: "Fresh set. This time, no looking back at them." },
    ] },
    { id: 'gwh2.sw-a3', when: SW, turns: [
      { by: 'a', ...V("Count them down with me. Ten bugs. Then nine. Then eight.", "Let's count them down.", "Countdown.", "COUNT them down! TEN bugs! NINE! EIGHT!", "Let's count them down together, ten, then nine, then eight.", "Each bug a step closer to freedom.") },
      { by: 'b', say: "Ten." },
      { by: 'a', say: "Good. Nine." },
      { beat: 'They count all the way down to zero. The tray is empty.' },
    ] },
    { id: 'gwh2.sw-a4', when: SW, turns: [
      { beat: '{a} dips each skewer in a pot of hot sauce before handing it over.' },
      { by: 'b', say: "Now it's burning. Now everything's burning." },
      { by: 'a', say: "But you can't taste the bug." },
      { by: 'b', say: "I can't taste anything. Give me the rest." },
    ] },
  ],
  'task-done.any': [
    { id: 'gwh2.sw-dn1', when: SW, turns: [
      { by: 'b', say: "There's a leg in my teeth. A tiny leg." },
      { by: 'a', say: "Leave it. You can get it out in the rickshaw." },
      { by: 'b', say: "I'm going to be thinking about that leg all day." },
    ] },
    { id: 'gwh2.sw-dn2', when: SW, turns: [
      { beat: '{a} hands {b} a whole bottle of water. {b} drinks it in one go.' },
      { by: 'a', say: "Better?" },
      { by: 'b', say: "No. But wetter." },
    ] },
    { id: 'gwh2.sw-dn3', when: SW, turns: [
      { by: 'a', say: "I'm so proud of you. You ate a scorpion." },
      { by: 'b', say: "Three scorpions." },
      { by: 'a', say: "I'm three times as proud." },
    ] },
    { id: 'gwh2.sw-dn4', when: SW, turns: [
      { beat: 'The stall owner offers {b} one more skewer, for free.' },
      { by: 'b', say: "No, thank you. That's very kind. No." },
      { by: 'a', say: "Say it nicer." },
      { by: 'b', say: "That was the nicest no I have." },
    ] },
    { id: 'gwh2.sw-dn5', when: SW, turns: [
      { by: 'a', say: "Don't breathe on me." },
      { by: 'b', say: "I'm going to breathe on you for the rest of the race." },
      { by: 'a', say: "That's fair. I made you eat bugs." },
    ] },
  ],
};

const rickshaw = {
  'task-start.any': [
    { id: 'gwh2.rk-s1', when: RK, turns: [
      { beat: '{a} lifts the rickshaw poles. The whole thing is heavier than it looks.' },
      { by: 'a', say: "What have you got in your pockets?" },
      { by: 'b', say: "Nothing. It's just me. And the bugs I ate." },
    ] },
    { id: 'gwh2.rk-s2', when: RK, turns: [
      { by: 'b', say: "I'll call out the turns. You just pull." },
      { by: 'a', say: "There's one road. It goes up." },
      { by: 'b', say: "Then I'll call out the ups." },
    ] },
    { id: 'gwh2.rk-s3', when: RK, turns: [
      { beat: 'Another team\'s rickshaw rattles past on the first bend, its passenger waving.' },
      { by: 'b', ...V("They waved at us. They're waving at us. Pull harder.", "They waved. Pull harder.", "Harder!", "They WAVED at us! PULL HARDER!", "They just waved at us, so let's pull a bit harder.", "That wave was a challenge. Accept the challenge.") },
      { by: 'a', say: "I'm pulling as hard as a person can pull." },
    ] },
    { id: 'gwh2.rk-s4', when: RK, turns: [
      { by: 'a', say: "Small steps. Small steps all the way up." },
      { by: 'b', say: "Do you want me to get out and push?" },
      { by: 'a', say: "You can't. You have to ride. Just sit very lightly." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'gwh2.rk-f1', when: RK, turns: [
      { beat: '{a} finds a steady rhythm, step after step, and doesn\'t stop once all the way up.' },
      { by: 'b', say: "You're like a machine. A pulling machine." },
      { by: 'a', say: "Don't talk to the machine. The machine is concentrating." },
    ] },
    { id: 'gwh2.rk-f2', when: RK, turns: [
      { by: 'b', say: "Left side's smoother! Go on the left!" },
      { beat: 'The left side is smoother. {a} pulls the rickshaw up the road like it\'s on rails.' },
      { by: 'a', say: "Keep telling me which side's smoother." },
    ] },
    { id: 'gwh2.rk-f3', when: RK, turns: [
      { beat: 'The wall appears at the top of the hill, stretching off over the mountains.' },
      { by: 'b', say: "There it is! The wall! You're nearly there!" },
      { by: 'a', say: "It's huge. Why is it so huge?" },
      { by: 'b', say: "It's the wall! It's meant to be huge!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gwh2.rk-a1', when: RK, turns: [
      { by: 'b', say: "Walk backwards. Pull it up backwards. Your legs will thank you." },
      { by: 'a', say: "My legs don't thank anyone." },
      { beat: 'Backwards works. Slowly, steadily, they reach the top.' },
    ] },
    { id: 'gwh2.rk-a2', when: RK, turns: [
      { beat: 'The rickshaw rolls back a few steps on the steep part before {a} can grab it.' },
      { by: 'a', say: "Hold the brake! Is there a brake?" },
      { by: 'b', say: "There's a stick! I'll jam it in the wheel!" },
      { beat: 'With a stick in the wheel at every stop, they inch their way to the top.' },
    ] },
    { id: 'gwh2.rk-a3', when: RK, turns: [
      { by: 'a', ...V("Talk to me. Tell me anything. Tell me about your day.", "Talk to me.", "Talk.", "TALK to me! Tell me ANYTHING!", "Please talk to me, tell me anything.", "Narrate my suffering. It helps.") },
      { by: 'b', say: "Well, this morning I jumped out of a plane and ate a scorpion." },
      { by: 'a', say: "Same. Small world." },
      { beat: 'Laughing, {a} pulls the last stretch without noticing.' },
    ] },
    { id: 'gwh2.rk-a4', when: RK, turns: [
      { beat: '{a} stops at the side of the road, hands on knees, breathing hard.' },
      { by: 'b', say: "Do you want water?" },
      { by: 'a', say: "I want a car. But water's fine." },
      { beat: 'After the water, {a} gets the rickshaw moving again, all the way to the wall.' },
    ] },
  ],
  'task-done.any': [
    { id: 'gwh2.rk-dn1', when: RK, turns: [
      { by: 'b', say: "Thank you. Seriously. That was really nice of you." },
      { by: 'a', say: "Remember this when it's your turn." },
      { by: 'b', say: "I'll remember it forever. Or until my turn." },
    ] },
    { id: 'gwh2.rk-dn2', when: RK, turns: [
      { beat: '{a} drops the poles and lies down on the cool stones at the foot of the wall.' },
      { by: 'a', say: "Leave me here. Go on without me." },
      { by: 'b', say: "We're a team. Get up. I'll carry the water." },
    ] },
    { id: 'gwh2.rk-dn3', when: RK, turns: [
      { by: 'a', say: "My arms are so long now. Look. They've stretched." },
      { by: 'b', say: "They look the same." },
      { by: 'a', say: "They feel a metre long." },
    ] },
    { id: 'gwh2.rk-dn4', when: RK, turns: [
      { beat: '{b} climbs out of the rickshaw and looks down the long road they came up.' },
      { by: 'b', say: "You pulled me up all of that?" },
      { by: 'a', say: "All of it. Every metre." },
      { by: 'b', say: "I'd hug you, but you're very sweaty." },
    ] },
    { id: 'gwh2.rk-dn5', when: RK, turns: [
      { by: 'a', say: "Where's the tip? Read it. I can't lift my hands." },
      { by: 'b', say: "'Walk along the wall to the Chill Zone.'" },
      { by: 'a', say: "Walk. I can walk. Walking is easy now." },
    ] },
  ],
};

export default mergePools(skydive, skewers, rickshaw);
