// Don checking teams in at each place's Chill Zone, in his real voice (docs/rr-writers-brief.md: upbeat, slick, vain,
// one jab or one aside, and on to the next team), about the place they've just raced. Only the middle and near the top
// of the order: first place and the last teams in have their own moments. A place's line wins whenever one fits.
import { V } from '../_kit.js';

const don = say => ({ by: 'don', say });
const at = (place, matPlace) => ({ place, matPlace });
const m = (id, place, matPlace, ...turns) => ({ id, when: at(place, matPlace), turns });

const HC = 'home-city', RSD = 'red-sand-desert', ITC = 'iron-tower-city', GWH = 'great-wall-hills', RN = 'rock-north',
  SVF = 'savanna-falls', TRI = 'treasure-isles', TMS = 'tomb-sands', TSH = 'torch-statue-harbour', ROB = 'red-outback',
  FMI = 'fire-mountain-isle';

export default {
  'don-place.plain': [
    // Home City: the end of leg one, at the island airport
    m('mat.hc1', HC, 'mid', don("{team}, you're team number {number}! Your very first Chill Zone. How does it feel?"),
      { by: 'a', say: "Like we've only just started." }, don("You have! Isn't it wonderful? Only the whole world to go.")),
    m('mat.hc2', HC, 'mid', don("{team}, {placing}! One leg down, and you're still speaking to each other. That's rare."),
      { by: 'b', say: "We're barely speaking." }, don("Barely counts!")),
    m('mat.hc3', HC, 'top', don("{team}, you're {placing}! Great start. Don't peak too early."),
      { by: 'a', ...V("Is that a thing?", "That's a thing?", "Peak?", "Is that a THING?", "Is peaking early really a thing?", "Can a person peak on day one?") }, don("I peaked at birth. It's been a long plateau of handsome.")),
    m('mat.hc4', HC, 'mid', don("{team}, team number {number}. The airport's right there. Tomorrow, the world."),
      { by: 'b', say: "Which bit of the world?" }, don("Ooh, I'd love to tell you. I won't, but I'd love to.")),
    // Red Sand Desert: the Chill Zone in the dunes
    m('mat.rsd1', RSD, 'mid', don("{team}, you're {placing}! You smell like stew. Please stand downwind."),
      { by: 'a', say: "Which way is downwind?" }, don("Away from me. It's always away from me.")),
    m('mat.rsd2', RSD, 'mid', don("{team}, team number {number}. How was the stew?"),
      { by: 'b', say: "Do you really want to know?" }, don("No. Next!")),
    m('mat.rsd3', RSD, 'top', don("{team}, {placing} place! Sand in your hair, sand in your shoes, and a top finish."),
      { by: 'a', say: "Sand everywhere." }, don("Everywhere. I found some in my eyebrow. My eyebrow!")),
    m('mat.rsd4', RSD, 'mid', { beat: '{a} and {b} slide down the last dune on their bottoms and onto the mat.' },
      don("{team}, you're {placing}! Nice entrance. Very low to the ground."), { by: 'b', say: "It was faster than walking." }),
    // Iron Tower City: by the museum
    m('mat.itc1', ITC, 'mid', don("{team}, you're team number {number}! And you've brought your cheese. Lovely."),
      { by: 'a', say: "Do you want some?" }, don("It's been in a river and a cave. I'll pass.")),
    m('mat.itc2', ITC, 'mid', don("{team}, {placing}! Did you keep the caricature? Show me. Oh. Oh dear."),
      { by: 'b', say: "It's a good likeness, though." }, don("That's what worries me.")),
    m('mat.itc3', ITC, 'top', don("{team}, {placing} place! Very stylish city, very stylish finish."),
      { by: 'a', say: "Thank you!" }, don("I meant the city. But you're fine. Fine-ish.")),
    m('mat.itc4', ITC, 'mid', don("{team}, you're {placing}. You came out of the catacombs smelling like history. And feet."),
      { by: 'b', say: "That's the cheese." }, don("I really hope so.")),
    // Great Wall Hills: on the wall
    m('mat.gwh1', GWH, 'mid', don("{team}, team number {number}! You walked along the wall to get here. Great wall, right?"),
      { by: 'a', say: "Was that a pun?" }, don("That was a great pun. On a great wall. Next!")),
    m('mat.gwh2', GWH, 'mid', don("{team}, you're {placing}! How were the skewers?"),
      { by: 'b', say: "Crunchy." }, don("Crunchy. That's the word everyone uses. Then they go a bit quiet.")),
    m('mat.gwh3', GWH, 'top', don("{team}, {placing}! A plane, some bugs and a rickshaw, and you're near the top. Look at you."),
      { by: 'a', say: "Look at us!" }, don("I said look at you. I'm already looking at me.")),
    m('mat.gwh4', GWH, 'mid', { beat: '{a} and {b} limp along the top of the wall to the mat.' },
      don("{team}, you're team number {number}. The wall's been here two thousand years. You look like you've walked all of it."),
      { by: 'b', say: "We feel like it." }),
    // Rock North: backstage
    m('mat.rn1', RN, 'mid', don("{team}, you're {placing}! Rock and roll! Please don't throw anything."),
      { by: 'a', say: "We don't have anything to throw." }, don("The last team threw a shoe. A real one.")),
    m('mat.rn2', RN, 'mid', don("{team}, team number {number}. Hot sauna, cold river, loud stage. How are your ears?"),
      { by: 'b', say: "WHAT?" }, don("Exactly.")),
    m('mat.rn3', RN, 'top', don("{team}, {placing} place! You're rocking it. Literally. Rock North. Get it?"),
      { by: 'a', say: "We get it." }, don("I worked on that one all morning.")),
    m('mat.rn4', RN, 'mid', don("{team}, you're {placing}. Still steaming from the sauna, I see."),
      { by: 'b', say: "Still frozen from the river, actually." }, don("Both! The full experience!")),
    // Savanna Falls: the village
    m('mat.svf1', SVF, 'mid', don("{team}, you're team number {number}! Did a rhino follow you here?"),
      { by: 'a', say: "No! Did one follow somebody?" }, don("Let's just say the mat's been moved twice.")),
    m('mat.svf2', SVF, 'mid', don("{team}, {placing}! Show me the waterfall picture. Ha! Look at your faces!"),
      { by: 'b', say: "We were falling off a waterfall." }, don("And it shows. Beautifully.")),
    m('mat.svf3', SVF, 'top', don("{team}, you're {placing}! Wild animals, wild water, and a wild finish!"),
      { by: 'a', say: "Is everything wild today?" }, don("Except me. I'm very calm. Very tame. Very handsome.")),
    m('mat.svf4', SVF, 'mid', don("{team}, you're {placing}. Wet, dusty, and safe. That's a hat trick."),
      { by: 'b', say: "Is it?" }, don("It is today.")),
    // Treasure Isles: the beach
    m('mat.tri1', TRI, 'mid', don("{team}, you're team number {number}! Welcome to the beach. Don't get comfortable."),
      { by: 'a', say: "Too late." }, don("I can see that. You're lying in the sand.")),
    m('mat.tri2', TRI, 'mid', don("{team}, {placing}! Did you find the doubloons?"),
      { by: 'b', say: "We found chocolate." }, don("Pirate chocolate. The best kind. Give me one.")),
    m('mat.tri3', TRI, 'top', don("{team}, you're {placing}! Sun, sea, and a top finish. Now this is my kind of leg."),
      { by: 'a', say: "Did you do any of it?" }, don("I did the sun part. Very hard. Look at this tan.")),
    m('mat.tri4', TRI, 'mid', { beat: '{a} and {b} wade out of the water and onto the mat, dripping.' },
      don("{team}, team number {number}. You're dripping on my mat. That's a {placing}-place drip."), { by: 'b', say: "Sorry." }),
    // Tomb Sands: at the foot of the pyramid
    m('mat.tms1', TMS, 'mid', don("{team}, you're {placing}! The pyramid's been here four thousand years. You got here today. Well done."),
      { by: 'a', say: "Is that a compliment?" }, don("From me? Always. Mostly.")),
    m('mat.tms2', TMS, 'mid', don("{team}, team number {number}! Over or under?"),
      { by: 'b', say: "Through it." }, don("Through it! That's not even one of the options. I love it.")),
    m('mat.tms3', TMS, 'top', don("{team}, {placing} place! A pharaoh would be proud. I'm a little bit proud."),
      { by: 'a', say: "Only a little?" }, don("I save the big pride for my reflection.")),
    m('mat.tms4', TMS, 'mid', don("{team}, you're {placing}. No crocodiles ate you. That's the main thing."),
      { by: 'b', say: "That was a low bar." }, don("And you cleared it! Next!")),
    // Torch Statue Harbour: the park fountain
    m('mat.tsh1', TSH, 'mid', don("{team}, you're team number {number}! You smell like a sewer. And a pond. Both at once."),
      { by: 'a', say: "Is that bad?" }, don("It's a new smell. Science would like a word.")),
    m('mat.tsh2', TSH, 'mid', don("{team}, {placing}! Nice apple. Did you bite it?"),
      { by: 'b', say: "That's how we carried it." }, don("Ah. Then you can keep it.")),
    m('mat.tsh3', TSH, 'top', don("{team}, you're {placing}! The big city, a big statue, and a big finish!"),
      { by: 'a', say: "And a big apple." }, don("And a big apple. Okay, I see what you did there. I'll allow it.")),
    m('mat.tsh4', TSH, 'mid', { beat: '{a} and {b} push the baby carriage onto the mat, the giant apple still inside.' },
      don("{team}, team number {number}. Congratulations, it's an apple."), { by: 'b', say: "We're very proud." }),
    // Red Outback: on top of the hanging rock
    m('mat.rob1', ROB, 'mid', don("{team}, you're {placing}! You've got wool in your hair. All of your hair."),
      { by: 'a', say: "It's everywhere." }, don("You look like a sheep that's lost a fight with a sheep.")),
    m('mat.rob2', ROB, 'mid', don("{team}, team number {number}! How did you find the emus?"),
      { by: 'b', say: "They found us." }, don("That's how it works out here. Everything finds you. Especially the flies.")),
    m('mat.rob3', ROB, 'top', don("{team}, {placing} place, on top of the rock and near the top of the race! Great view, isn't it?"),
      { by: 'a', say: "It's beautiful." }, don("Not as beautiful as me in this hat. But close.")),
    m('mat.rob4', ROB, 'mid', don("{team}, you're {placing}. You jumped off this rock earlier. Now you're standing on it. Full circle."),
      { by: 'b', say: "I'd rather not think about it." }, don("Then don't! Think about me instead. Everyone else does.")),
    // Fire-Mountain Isle: on the volcano
    m('mat.fmi1', FMI, 'mid', don("{team}, you're team number {number}! You climbed a volcano. I took the helicopter."),
      { by: 'a', say: "There's a helicopter?" }, don("For hosts. And their hair.")),
    m('mat.fmi2', FMI, 'mid', don("{team}, {placing}! Did the statue look like you?"),
      { by: 'b', say: "Too much like us." }, don("And now it's in a volcano. There's a lesson there somewhere.")),
    m('mat.fmi3', FMI, 'top', don("{team}, you're {placing}! Lava, lagoon, and a top finish. Hot stuff!"),
      { by: 'a', say: "Was that a pun?" }, don("It was a volcano pun. They're the hottest kind.")),
    m('mat.fmi4', FMI, 'mid', { beat: '{a} and {b} stumble onto the mat at the rim, singed and soaked.' },
      don("{team}, you're {placing}. You look like you've been through fire and water. Because you have."), { by: 'b', say: "Both. In one day." }),
  ],
};
