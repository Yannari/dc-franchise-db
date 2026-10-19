// Celebrating, rewritten to the standard: quick hits (2 to 5 lines), about what they just did (the task's type),
// who they are to each other (relFam) and where they are (at: task or mat). `hug`: they did it. `gloat-at-others`:
// they did it, and the teams still stuck get to hear about it. `jinx`: one of them says it out loud.
import { V } from '../places/_kit.js';

const HUG = 'celebrate.hug', GLOAT = 'celebrate.gloat-at-others', JINX = 'celebrate.jinx';
const T = (extra = {}) => ({ at: 'task', ...extra });

export default {
  retire: [HUG, GLOAT, JINX, 'celebrate.any'],
  pools: {
    [HUG]: [
      // what they just did
      { id: 'ce.h-wet1', when: T({ taskType: 'water' }), turns: [
        { beat: '{a} climbs out of the water and hugs {b}, completely soaked.' },
        { by: 'b', ...V("You're getting me wet. You're getting me so wet.", "You're soaking me.", "You're getting me wet.", "You're getting me SO WET!", "Okay, you're getting me really wet.", "You're transferring the lake onto me.") },
        { by: 'a', ...V("I know. That's the hug.", "I know. That's the hug.", "Yes. That's the hug.", "I KNOW! That's the HUG!", "I know. That's kind of the point of the hug.", "I know. You're welcome. Hug.") },
      ] },
      { id: 'ce.h-wet2', when: T({ taskType: 'water' }), turns: [
        { by: 'a', ...V("Is there something on my face? There's something on my face.", "Something is on my face. I can feel it.", "There's something on my face.", "There's SOMETHING on my FACE!", "Is there something on my face? I can feel something.", "Something has made a home on my face.") },
        { by: 'b', say: "It's a leaf. Hold still." },
        { beat: '{b} picks the leaf off, and then hugs {a} anyway, wet and all.' },
      ] },
      { id: 'ce.h-up1', when: T({ taskType: 'heights' }), turns: [
        { beat: 'Both feet back on solid ground, {a} grabs {b} and does not let go.' },
        { by: 'a', ...V("Ground. Beautiful ground. I'm never leaving the ground again.", "Ground. I'm never leaving it again.", "Solid ground. Never leaving it.", "GROUND, beautiful GROUND, and I'm never LEAVING it again!",
          "We're on the ground. I'm never leaving the ground again, I swear.", "Ground. I love you, ground. You never let me down.") },
        { by: 'b', ...V("We have a flight later.", "We have a flight later.", "There's a flight later.", "We have a FLIGHT later!", "We do have a flight later, though.", "Our next stop is literally the sky.") },
        { by: 'a', say: "Don't." },
      ] },
      { id: 'ce.h-up2', when: T({ taskType: 'heights' }), turns: [
        { by: 'b', ...V("You did it. You actually looked down and you still did it.", "You looked down and still did it.", "You looked down. You still did it.", "You DID it! You looked DOWN and still did it!", "You did it! You looked down and you still did it!", "You looked down, and the down looked back, and you did it anyway.") },
        { by: 'a', ...V("I only looked down once. By accident.", "Once. By accident.", "Once. Accidentally.", "Only ONCE! By ACCIDENT!", "Only once, and it was an accident.", "Only once. It was an accident. The down surprised me.") },
        { beat: 'They hug, and {a} is still shaking a little.' },
      ] },
      { id: 'ce.h-eat1', when: T({ taskType: 'stomach' }), turns: [
        { beat: '{b} goes in for a hug, then stops halfway.' },
        { by: 'b', ...V("I'm so proud of you. I'm hugging you from here, though.", "Proud of you. Hugging you from here.", "So proud. From over here.", "I'm SO proud of you! I'm hugging you from HERE, though!",
          "I'm so proud of you. I'm just going to hug you from over here.", "I'm proud of you from a respectful smelling distance.") },
        { by: 'a', ...V("Get over here.", "Get over here.", "Come here.", "Get OVER here!", "Come here, please.", "Come here. Experience my breath.") },
        { by: 'b', say: "Absolutely not." },
      ] },
      { id: 'ce.h-eat2', when: T({ taskType: 'stomach' }), turns: [
        { by: 'a', ...V("I can still taste it. Is that going to stop? Tell me it stops.", "I can still taste it. Does it stop?", "I can still taste it. Tell me it stops.", "I can STILL taste it! Tell me it STOPS!",
          "I can still taste it. Is that going to stop at some point?", "I can still taste it. It's moved in. It has a lease.") },
        { by: 'b', say: "It stops. Probably. Hug?" },
        { by: 'a', say: "Hug." },
      ] },
      { id: 'ce.h-brain1', when: T({ taskType: 'brains' }), turns: [
        { by: 'b', ...V("You figured it out! How did you figure that out?", "You figured it out. How?", "How did you figure that out?", "You FIGURED it OUT! How did you DO that?", "You figured it out! How did you do that?", "You figured it out. Did you always have a brain like that?") },
        { by: 'a', ...V("I have no idea. It just clicked. Don't ask me to do it again.", "No idea. It clicked. Don't ask me again.", "It clicked. Don't make me do it again.", "I have NO idea! It just CLICKED! Don't ask me to do it AGAIN!",
          "Honestly, I have no idea. It just clicked. Please don't ask me to do it again.", "No idea. It clicked. It may never click again. Treasure this.") },
        { beat: '{b} hugs {a} hard enough to lift {a.obj} off the ground.' },
      ] },
      { id: 'ce.h-arms1', when: T({ taskType: 'strength' }), turns: [
        { beat: '{a} drops to the ground, arms shaking, and {b} drops down next to {a.obj}.' },
        { by: 'a', ...V("I can't feel my arms. Hug me. I can't hug you back.", "Can't feel my arms. Hug me. I can't hug back.", "Hug me. My arms are gone.", "I can't FEEL my ARMS! HUG me! I can't hug you BACK!",
          "I can't feel my arms. You'll have to hug me, I can't hug back.", "My arms have left. Please hug what's left of me.") },
        { by: 'b', say: "Done. That one counts double." },
      ] },
      { id: 'ce.h-hands1', when: T({ taskType: 'hands' }), turns: [
        { by: 'b', ...V("Look at it. We made that. With our hands.", "We made that. With our hands.", "Look. We made that.", "LOOK at it, we MADE that with our own HANDS!", "Look at it. We actually made that, with our hands.", "Look at it. It's ugly and it's ours.") },
        { by: 'a', say: "It's terrible." },
        { by: 'b', say: "It's terrible, and it counts. Come here." },
      ] },
      // who they are to each other
      { id: 'ce.h-fam1', when: T({ relFam: 'family' }), turns: [
        { by: 'a', ...V("Mom is going to hear about this. From me. Twice.", "Mom's hearing about this. Twice.", "Mom's going to hear about this. Twice.", "MOM is going to hear about this! TWICE!", "Mom is going to hear about this from me, maybe twice.", "Mom is getting a full report, with diagrams.") },
        { by: 'b', ...V("She's going to say she always knew we could.", "She'll say she always knew.", "She'll say she knew we could.", "She's going to SAY she ALWAYS knew!", "She's going to say she always knew we could do it.", "She'll say she knew. She didn't know.") },
        { by: 'a', say: "She did not always know." },
        { beat: 'They hug anyway, the way only family can, which is mostly elbows.' },
      ] },
      { id: 'ce.h-love1', when: { relFam: 'romantic' }, turns: [
        { beat: '{a} kisses {b} on the forehead, and then on the cheek, and then {b} pushes {a.obj} away, laughing.' },
        { by: 'b', ...V("We're in a race! People are watching!", "We're in a race. People are watching.", "People are watching. It's a race.", "We're in a RACE! People are WATCHING!", "We're in a race, people are watching!", "We're in a race. There are cameras. And a goat.") },
        { by: 'a', ...V("Let them watch.", "Let them.", "Let them watch.", "LET them watch!", "Let them watch, then.", "Let them. It's good television.") },
      ] },
      { id: 'ce.h-exes1', when: { relFam: 'exes' }, turns: [
        { beat: 'Without thinking, {a} and {b} hug. Then they both remember, and step back fast.' },
        { by: 'a', ...V("That was a race hug.", "Race hug.", "That was a race hug.", "That was a RACE hug!", "That was just a race hug, right?", "That was a race hug. Purely athletic.") },
        { by: 'b', ...V("Completely a race hug.", "Race hug. Obviously.", "Totally a race hug.", "COMPLETELY a race hug!", "Yeah, totally a race hug.", "A strictly professional race hug.") },
        { beat: 'Neither of them looks at the other for a while.' },
      ] },
      // at the mat
      { id: 'ce.h-mat1', when: { at: 'mat' }, turns: [
        { beat: '{a} and {b} collapse on the grass beside the mat and lie there.' },
        { by: 'a', ...V("I'm not getting up until the next leg.", "Not getting up till next leg.", "I'm staying here till the next leg.", "I'm NOT getting up until the NEXT LEG!", "I'm not getting up until the next leg, I mean it.", "This is my home now. Forward my mail.") },
        { by: 'b', say: "Fair." },
      ] },
      { id: 'ce.h-mat2', when: { at: 'mat' }, turns: [
        { by: 'b', ...V("We made it. We're still in it.", "We made it. Still in.", "Made it. Still in.", "We MADE it! We're STILL in it!", "We made it. We're still in this.", "We made it. We remain. We endure.") },
        { by: 'a', say: "Hug me before I fall asleep standing up." },
        { beat: 'They hug, and lean on each other, and stay like that for a while.' },
      ] },
      // anywhere
      { id: 'ce.h-any1', turns: [
        { by: 'a', ...V("Did that just work? First go?", "That worked? First go?", "First go. That worked.", "Did that just WORK? First GO?", "Did that actually just work?", "Did that work? Is the universe feeling okay?") },
        { by: 'b', say: "It worked. Don't touch anything." },
        { beat: 'They hug very carefully, as if the luck might fall off.' },
      ] },
      { id: 'ce.h-any2', turns: [
        { beat: '{a} goes for a high five. {b} goes for a hug. It turns into something that is neither.' },
        { by: 'b', say: "What was that?" },
        { by: 'a', ...V("I don't know. Let's never talk about it.", "No idea. Let's never discuss it.", "No idea. Never speak of it.", "I don't KNOW! Let's NEVER talk about it!", "I don't know, honestly. Let's not talk about it.", "No idea. It was a new handshake. It's retired.") },
      ] },
    ],

    [GLOAT]: [
      { id: 'ce.g-task1', when: T(), turns: [
        { beat: '{a} holds the tip up high, so the teams still working can see it.' },
        { by: 'a', ...V("Good luck, everybody! You're going to need it!", "Good luck, all. You'll need it.", "Good luck. You'll need it.", "GOOD LUCK, everybody! You're going to NEED it!", "Good luck, everybody! You'll need it, honestly!", "Good luck, everyone! Luck is all you have now!") },
        { by: 'b', ...V("Why would you say that to them?", "Why would you say that?", "Why say that to them?", "WHY would you say that to them?", "Why would you say that to them, though?", "Why would you say that out loud, with your mouth?") },
        { by: 'a', say: "What? I said good luck." },
        { by: 'b', say: "You said they'd need it. They heard the 'need it' part." },
      ] },
      { id: 'ce.g-task2', when: T(), turns: [
        { by: 'a', ...V("Oh, is that still going badly over there? That's so sad. Anyway, bye!", "Still going badly over there? Sad. Bye.", "Still going badly? Sad. Anyway. Bye.", "Oh, is that STILL going badly over there? That's so SAD, anyway, BYE!",
          "Oh no, is that still going badly over there? That's sad. Anyway, bye!", "Oh, still going badly? My condolences. Anyway, we're leaving.") },
        { beat: 'Somebody behind them throws something. It misses.' },
        { by: 'b', say: "Keep walking. Don't turn around. Keep walking." },
      ] },
      { id: 'ce.g-task3', when: T(), turns: [
        { by: 'a', ...V("We should do a lap. A victory lap. Right past everybody.", "Victory lap. Right past everybody.", "Victory lap. Past all of them.", "We should do a VICTORY lap, right past EVERYBODY!",
          "Should we do a little victory lap? Just past everybody?", "We should do a victory lap. Slowly. With waving.") },
        { by: 'b', ...V("We are not doing a victory lap. We have a plane to catch.", "No victory lap. We have a plane.", "No lap. We have a plane.", "We are NOT doing a victory lap! We have a PLANE!", "We're not doing a lap. We've got a plane to catch.", "No laps. The plane does not wait for laps.") },
        { by: 'a', say: "A small lap." },
        { by: 'b', say: "Walk." },
      ] },
      { id: 'ce.g-mat1', when: { at: 'mat' }, turns: [
        { beat: 'From the comfort of the Chill Zone, {a} watches the next team stagger in.' },
        { by: 'a', ...V("Look at them. They look terrible. We look amazing.", "They look terrible. We look amazing.", "They look awful. We look great.", "LOOK at them, they look TERRIBLE, and we look AMAZING!", "Look at them. They look terrible, and we look amazing.", "They look like a bad day. We look like a good one.") },
        { by: 'b', say: "We looked exactly like that an hour ago." },
        { by: 'a', say: "Nobody saw that. This is what people will remember." },
      ] },
      { id: 'ce.g-mat2', when: { at: 'mat' }, turns: [
        { by: 'a', ...V("Somebody bring us a cushion. Champions need cushions.", "Cushion, please. Champions.", "A cushion for the champions, please.", "Somebody bring us a CUSHION! CHAMPIONS need cushions!", "Could somebody bring us a cushion? We're champions now.", "A cushion. For the champions. Velvet, if you have it.") },
        { by: 'b', say: "We came in fourth." },
        { by: 'a', say: "Fourth is a kind of champion." },
      ] },
      { id: 'ce.g-any1', turns: [
        { by: 'a', ...V("Do you think they saw us win? I want them to have seen us win.", "Did they see us win? I want them to have.", "I hope they saw us win. I really do.", "Do you think they SAW us win? I want them to have SEEN it!",
          "Do you think they saw us? I really want them to have seen us win.", "I hope they saw. I hope they'll remember it at night.") },
        { by: 'b', say: "We didn't win anything. We just finished first at one thing." },
        { by: 'a', say: "Finishing first at one thing is winning." },
      ] },
      { id: 'ce.g-any2', turns: [
        { by: 'a', ...V("Should we wave? I think we should wave at them.", "Should we wave at them?", "We should wave at them.", "Should we WAVE? I think we should WAVE at them!",
          "Should we wave at them? I kind of want to wave.", "Let's wave. A slow, royal wave.") },
        { by: 'b', say: "Do not wave." },
        { beat: '{a} waves. Several people wave back with exactly one finger.' },
      ] },
    ],

    [JINX]: [
      { id: 'ce.j-1', turns: [
        { by: 'a', ...V("That's it. We're winning this whole thing. I can feel it.", "We're winning this. I can feel it.", "We're winning the whole thing. I feel it.", "That's IT! We're WINNING this whole THING! I can FEEL it!",
          "I really think we're winning this whole thing. I can feel it.", "We're winning this. I can feel it in my knees.") },
        { by: 'b', ...V("Don't say that. Don't ever say that out loud.", "Don't say that. Ever.", "Never say that out loud.", "DON'T say that! Don't EVER say that out LOUD!", "Please don't say that out loud.", "Take it back. Take it back before the race hears you.") },
        { by: 'a', say: "Why? It's true." },
        { beat: 'Somewhere nearby, something falls over with a crash.' },
      ] },
      { id: 'ce.j-2', turns: [
        { by: 'a', ...V("Honestly, the rest of this leg is going to be easy.", "The rest of this leg's going to be easy.", "Rest of the leg is easy now.", "Honestly? The rest of this leg is going to be EASY!",
          "Honestly, I think the rest of this leg is going to be really easy.", "The rest of this leg is a walk in a very nice park.") },
        { by: 'b', say: "Why would you say that?" },
        { by: 'a', say: "Because it's true?" },
        { by: 'b', ...V("Nothing is true out here. Knock on something.", "Nothing's true out here. Knock on wood.", "Knock on something. Now.", "NOTHING is true out here! KNOCK on something!", "Nothing is true out here. Please knock on something.", "Knock on wood. Knock on anything. Knock on me.") },
        { beat: '{a} looks around, finds nothing made of wood, and knocks on {b}\'s head.' },
      ] },
      { id: 'ce.j-3', when: { relFam: 'family' }, turns: [
        { by: 'a', ...V("I'm already planning what we do with the money.", "Planning what to do with the money.", "I'm planning the money already.", "I'm ALREADY planning what we do with the MONEY!", "I'm already planning what we're going to do with the money.", "I've spent the money. In my head. Twice.") },
        { by: 'b', say: "Grandma used to say that right before she lost at bingo." },
        { by: 'a', say: "Grandma won at bingo all the time." },
        { by: 'b', say: "Not after she said that." },
      ] },
      { id: 'ce.j-4', when: { at: 'task' }, turns: [
        { by: 'a', ...V("We're so far ahead nobody's catching us now.", "Nobody's catching us now.", "We're too far ahead to catch.", "We're SO far ahead NOBODY'S catching us now!", "We're so far ahead now, I don't think anyone can catch us.", "We are so far ahead we're in next week.") },
        { by: 'b', say: "There's a team right behind us." },
        { beat: 'There is, in fact, a team right behind them.' },
        { by: 'a', say: "Okay, so nobody's catching us if we run." },
      ] },
      { id: 'ce.j-5', turns: [
        { by: 'a', ...V("Say it with me. Easiest leg ever.", "Easiest leg ever. Say it.", "Easiest leg ever. Say it with me.", "Say it with ME! EASIEST leg EVER!", "Come on, say it with me: easiest leg ever.", "Repeat after me. Easiest. Leg. Ever.") },
        { by: 'b', say: "No." },
        { by: 'a', say: "Why not?" },
        { by: 'b', say: "Because the last time you said easiest anything, we got lost in a car park for three hours." },
      ] },
      { id: 'ce.j-6', when: { relFam: 'romantic' }, turns: [
        { by: 'a', ...V("We are the best team in this race. Admit it.", "Best team in the race. Admit it.", "Admit it. We're the best team.", "We are the BEST team in this RACE! ADMIT it!", "We're the best team in this race, admit it.", "We are the best team in this race and also the best looking.") },
        { by: 'b', say: "Don't make me say it. Every time we say it, something happens." },
        { by: 'a', say: "Nothing ever happens." },
        { by: 'b', say: "Something always happens." },
      ] },
    ],
  },
};
