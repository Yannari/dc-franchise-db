// Red Sand Desert's own lines (js/rr/places/red-sand-desert.js): Don's opener, the arrival, and every moment
// at its two challenges. The spices: forty baskets, five to pick, the merchant says yes or no to the whole set.
// The stew: the chef cooks it with the spices the team picked, one partner eats it all, the other watches.
// Gated on place / taskId (strong facts: these win over the general lines when they fit).
import { V, mergePools } from './_kit.js';
const P = { place: 'red-sand-desert' };
const SP = { taskId: 'spices' };
const ST = { taskId: 'stew' };

// three sections with the same pool keys (the place, then each challenge), merged at the bottom
const place = {
  'don-opener.annoyed': [
    { id: 'rsd.op1', when: P, turns: [
      { beat: 'Wind blows red sand across the dunes and straight into Don\'s face. He spits some out.' },
      { by: 'don', say: "Welcome to the Red Sand Desert. It's red, it's sand, and it's in my teeth." },
      { by: 'don', say: "Today the teams will shop for spices, ride camels, and eat a stew they cooked themselves without knowing it. I've seen the stew. Good luck." },
    ] },
    { id: 'rsd.op2', when: P, turns: [
      { by: 'don', say: "This is the Red Sand Desert, home of the oldest spice market for a thousand miles, and a camel that bit my producer this morning." },
      { beat: 'Somewhere behind him, a camel makes a long, rude noise.' },
      { by: 'don', say: "That's the one. The teams will be riding its friends." },
    ] },
  ],
  'don-opener.bored': [
    { id: 'rsd.op3', when: P, turns: [
      { beat: 'Don sits on a folding chair under a tent flap, fanning himself with a stack of tips.' },
      { by: 'don', say: "Red Sand Desert. Hot in the day, cold at night, sandy the whole time." },
      { by: 'don', say: "Spices, camels, stew. If the teams are lucky, they'll only taste one of those." },
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'rsd.ar1', when: P, turns: [
      { beat: 'The taxi door opens on red dunes that run all the way to the sky.' },
      { by: 'a', ...V("It's actually red. I thought that was just a name.",
        "It's red. I thought that was just a name.", "So it's actually red. Huh.", "It's ACTUALLY red! I thought it was just a NAME!",
        "Oh wow. It's really red. I thought that was just a name.", "It's red. Someone painted a whole desert and didn't tell anyone.") },
      { by: 'b', ...V("Everything's red. My shoes are already red.",
        "My shoes are red already. Great.", "My shoes are red now. That was fast.", "My SHOES are already RED!",
        "My shoes are already red, look.", "My shoes have joined the desert. They're red now.") },
      { by: 'a', ...V("Smell that, though. That's spices. There's a market somewhere close.",
        "Smell that. Spices. The market's close.", "That smell is spices. The market's close.", "Smell THAT, it's spices, the market has to be RIGHT there!",
        "Can you smell that? It's spices. The market must be close.", "Smell that. The air is seasoned.") },
    ] },
    { id: 'rsd.ar2', when: P, turns: [
      { by: 'a', ...V("Okay, it's beautiful, but it's also a hundred degrees, and I'm wearing a sweater.",
        "It's beautiful, it's a hundred degrees, and I'm in a sweater.", "It's beautiful, it's a hundred degrees, and I'm wearing a sweater.", "It's BEAUTIFUL, but it's a HUNDRED degrees and I'm in a SWEATER!",
        "It's so beautiful, but it's really hot, and I wore a sweater.", "It's beautiful, and I'm being slowly baked inside my sweater.") },
      { by: 'b', ...V("Take the sweater off.", "Then take it off.", "So take it off.", "Then TAKE IT OFF!", "You can take it off, you know.", "Take it off. Give it to a camel.") },
      { by: 'a', ...V("I can't. It's got the tip in the pocket, and I don't trust myself with pockets right now.",
        "Can't. The tip's in the pocket, and I don't trust pockets today.", "The tip's in the pocket. I'm not risking it.", "I CAN'T, the tip's in the POCKET and I don't trust myself with pockets!",
        "I can't. The tip's in the pocket, and I'm scared I'll lose it.", "The tip lives in the sweater now. We're a package.") },
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'rsd.ar3', when: P, turns: [
      { beat: 'The wind picks up a sheet of sand and throws it across the road.' },
      { by: 'a', ...V("How do people find anything out here? It all looks the same.",
        "How does anyone find anything here? It's all the same.", "It all looks the same. How does anyone find anything?", "How does ANYONE find ANYTHING out here? It's all the SAME!",
        "It all looks the same. How are we supposed to find anything?", "Every direction is the same direction. How is that allowed?") },
      { by: 'b', ...V("We follow the tip. The tip says spice market. We find the spice market.",
        "Follow the tip. It says spice market. We find the market.", "The tip says spice market. So we find it.", "We follow the TIP! It says SPICE MARKET!",
        "We just follow the tip. It says spice market, so we look for that.", "We follow the tip. The tip knows. Trust the tip.") },
      { by: 'a', ...V("And if the spice market looks like sand too?",
        "And if the market looks like sand too?", "And if that looks like sand too?", "And if the spice market looks like SAND too?",
        "What if the spice market looks like sand too, though?", "What if the market is also sand? What then?") },
    ] },
  ],

};

// ── the spices: forty baskets, five for the stew, a yes or no for the whole set ──
const spices = {
  'don-demo.gag': [
    { id: 'rsd.sp-d1', when: SP, turns: [
      { beat: 'Don stands between two rows of open baskets, every one a different colour.' },
      { by: 'don', say: "Forty spices. Five of them go into the old desert stew. Pick the right five and the merchant gives you your tip." },
      { beat: 'He sniffs the nearest basket and sneezes so hard his sunglasses fall off.' },
      { by: 'don', say: "Pick the wrong five, and you'll find out at the next stop. Bless me." },
    ] },
  ],
  'don-demo.dry': [
    { id: 'rsd.sp-d2', when: SP, turns: [
      { by: 'don', say: "The merchant won't tell you which spice is wrong. Just whether all five are right." },
      { beat: 'The merchant, behind him, shakes his head slowly at nothing in particular.' },
      { by: 'don', say: "That's his no. You'll be seeing a lot of it." },
    ] },
  ],
  'task-start.any': [
    { id: 'rsd.sp-s1', when: SP, turns: [
      { beat: '{a} and {b} stop in front of the baskets. Forty of them, all colours, all smells.' },
      { by: 'b', ...V("Five. We need five. Out of all of these.",
        "Five out of all of these. Great.", "Five. Out of forty.", "FIVE? Out of ALL of these?",
        "We need five out of all of these... okay.", "Five spices. Forty choices. I've had easier exams.") },
      { by: 'a', ...V("Stew. Think about what goes in stew. Something red, something hot, something that smells like a kitchen.",
        "Think stew. Something red, something hot, something that smells like a kitchen.", "It's stew. Red, hot, and something that smells like a kitchen.", "Think about STEW! Something red, something HOT, something that smells like a kitchen!",
        "Let's think about stew. Something red, something hot, something that smells like home cooking.", "Think like a stew. What would a stew want to be wearing?") },
      { by: 'b', ...V("Everything here smells like a kitchen.",
        "Everything smells like a kitchen.", "They all smell like a kitchen.", "EVERYTHING smells like a kitchen!",
        "Um, everything here smells like a kitchen.", "The whole market is a kitchen. I'm inside a kitchen.") },
    ] },
    { id: 'rsd.sp-s2', when: SP, turns: [
      { by: 'a', ...V("Don't touch anything yet. Smell first, then touch.",
        "Smell first. Then touch.", "Smell first, touch after.", "DON'T touch anything! SMELL first!",
        "Let's not touch anything yet, okay? Just smell first.", "Smell first. Touching is for later. Like a museum.") },
      { beat: '{b} already has a hand in the nearest basket. It comes out bright yellow.' },
      { by: 'b', ...V("Too late. Is yellow a stew colour?",
        "Too late. Is yellow a stew colour?", "Too late. Yellow. Is that stew?", "Too LATE! Is YELLOW a stew colour?",
        "Sorry, too late. Is yellow a stew colour, do you think?", "Too late. My hand is yellow now. Is that a stew hand?") },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rsd.sp-f1', when: SP, turns: [
      { beat: '{a} and {b} put five little bags on the counter. The merchant looks at them for a long time.' },
      { by: 'b', ...V("Why is he taking so long? Is it bad? It's bad.",
        "Why so long? It's bad.", "He's taking a long time. It's bad.", "Why is he taking SO LONG? It's BAD!",
        "Why is he taking so long? Is it bad?", "He's thinking. Nobody thinks that long about a good answer.") },
      { beat: 'The merchant nods once and hands over the tip.' },
      { by: 'a', ...V("First try. I told you the brown one was cumin.",
        "First try. The brown one was cumin. Told you.", "First try. Brown one was cumin.", "FIRST TRY! I TOLD you the brown one was cumin!",
        "First try! See, the brown one was cumin.", "First try. The brown one and I understood each other.") },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rsd.sp-af1', when: SP, turns: [
      { beat: 'The merchant has shaken his head at them more times than either of them wants to count.' },
      { by: 'a', ...V("Okay. Swap the orange one for the dark red one. Last idea I've got.",
        "Swap the orange for the dark red. Last idea.", "Orange out, dark red in. That's all I've got.", "Swap the ORANGE for the DARK RED! That's my LAST idea!",
        "Let's swap the orange one for the dark red one. It's the last idea I have.", "The orange one has betrayed us. Bring in the dark red.") },
      { by: 'b', ...V("We tried the dark red already.", "We tried the dark red.", "Already tried that one.", "We TRIED the dark red!",
        "I think we tried the dark red already...", "The dark red has been here before. It knows the way.") },
      { by: 'a', ...V("Not with the green one. Just hand it over.", "Not with the green. Hand it over.", "Not with the green one. Go.", "NOT with the GREEN one! Hand it OVER!",
        "Not with the green one, though. Let's just try it.", "Not with the green one. The green one changes everything.") },
      { beat: 'The merchant nods. {b} nearly drops the tip.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'rsd.sp-st1', when: SP, turns: [
      { beat: '{a} is sitting on the ground with five bags in a row, smelling them one at a time.' },
      { by: 'a', ...V("I can't smell anything anymore. My nose gave up an hour ago.",
        "My nose quit an hour ago.", "I can't smell anything now. My nose is done.", "I can't SMELL anything anymore! My nose is DONE!",
        "I can't smell anything anymore. I think my nose gave up.", "My nose has left the race. It's on a flight home.") },
      { by: 'b', ...V("Then look at them. Which one looks like it doesn't belong in stew?",
        "Then look. Which one doesn't belong in stew?", "Then look at them. Which one doesn't belong?", "Then LOOK at them! Which one DOESN'T belong?",
        "Then let's just look. Which one doesn't look like it goes in a stew?", "Then use your eyes. Which one looks like a dessert?") },
      { by: 'a', ...V("All of them. None of this looks like stew. Stew is brown.",
        "None of it looks like stew. Stew's brown.", "None of them. Stew is brown.", "NONE of them! Stew is BROWN!",
        "None of them, honestly. Stew is brown.", "None. Stew is brown. These are a sunset.") },
    ] },
  ],
  'task-done.any': [
    { id: 'rsd.sp-dn1', when: SP, turns: [
      { beat: '{a} and {b} run from the market with the tip and five little bags of spice.' },
      { by: 'a', ...V("Wait, we have to keep these? They're coming with us?",
        "We keep these? They're coming with us?", "Wait. These come with us? All of them?", "Wait, we KEEP these? They're COMING with us?",
        "Oh, wait, we have to keep these? They're coming with us?", "The spices are coming with us. They're part of the team now.") },
      { by: 'b', ...V("Read the tip. They go in the stew at the next stop.",
        "Read the tip. They go in the stew.", "They go in the stew. Next stop.", "READ the tip! They go in the STEW!",
        "It says they go in the stew at the next stop.", "Read it. They're going into a stew. Ours. To eat.") },
      { by: 'a', ...V("Then I really hope that brown one was cumin.",
        "Then I hope the brown one was cumin.", "So the brown one had better be cumin.", "Then I REALLY hope that brown one was CUMIN!",
        "Then I really hope that brown one was cumin.", "Then the brown one had better be cumin, for its own sake.") },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'rsd.sp-x1', when: SP, turns: [
      { beat: 'The merchant looks at the five bags, then shakes his head and pushes them back.' },
      { by: 'b', ...V("Which one? Can you just tell us which one?", "Which one? Just tell us which one.", "Which one is wrong?", "WHICH one? Can you just TELL us which ONE?",
        "Could you maybe tell us which one is wrong? Please?", "Which one? Point with your eyebrows. I'll understand.") },
      { beat: 'The merchant smiles and shakes his head again.' },
      { by: 'a', ...V("He's not going to tell us. Come on. Back to the baskets.", "He won't tell us. Back to the baskets.", "He won't say. Come on, back to the baskets.", "He's NOT going to tell us! Back to the BASKETS!",
        "He's not going to tell us. Let's go back to the baskets.", "He has taken a vow of silence. Back to the baskets.") },
    ] },
    // "wrong again": a second miss at least
    { id: 'rsd.sp-x2', when: { ...SP, fails: 'many' }, turns: [
      { by: 'a', ...V("Wrong again. It has to be the yellow one.", "Wrong again. It's the yellow one.", "Wrong. It's the yellow.", "WRONG again! It HAS to be the YELLOW one!",
        "Wrong again. I think it has to be the yellow one.", "Wrong again. The yellow one has been lying to us all along.") },
      { by: 'b', ...V("You said it was the yellow one last time, and we changed the yellow one.",
        "You said that last try, and we changed the yellow one.", "You said that last time, and we already changed the yellow one.", "You SAID that last time, and we CHANGED the yellow one!",
        "You said that on the last try, and we did change the yellow one.", "The yellow one has been changed twice. It's a different yellow now.") },
      { by: 'a', ...V("Then it's the other yellow one.", "Then the other yellow one.", "The other yellow, then.", "Then it's the OTHER yellow one!",
        "Then maybe it's the other yellow one.", "Then it's the other yellow one. There are always two.") },
    ] },
  ],

};

// ── the stew: their own spices, one partner eats every drop, the other watches ──
const stew = {
  'don-demo.gag': [
    { id: 'rsd.st-d1', when: ST, turns: [
      { beat: 'A huge pot bubbles over a fire. The chef stirs it with a spoon the size of an oar.' },
      { by: 'don', say: "Every team brings the five spices they picked at the market. The chef puts them in the stew. One of you eats the whole bowl." },
      { by: 'don', say: "If you picked well, it's dinner. If you didn't, it's revenge." },
      { beat: 'The chef holds out a spoonful to Don. Don takes a step back.' },
    ] },
  ],
  'don-demo.dry': [
    { id: 'rsd.st-d2', when: ST, turns: [
      { by: 'don', say: "One partner eats. The other one watches and can't help. Anything comes back up, you start a new bowl." },
      { beat: 'He looks into the pot and makes a face.' },
      { by: 'don', say: "I'd keep it down." },
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'rsd.st-w1', when: ST, turns: [
      { beat: '{a} and {b} read the board. Who\'s got a cast-iron stomach?' },
      { by: 'b', ...V("That's you. You ate a gas station burrito at three in the morning and felt fine.",
        "That's you. Gas station burrito, three a.m., fine.", "You. You ate a gas station burrito at three a.m.", "That's YOU! You ate a GAS STATION BURRITO at three in the MORNING!",
        "I think that's you. You ate that gas station burrito at three in the morning and you were fine.", "That's you. Your stomach has survived things science can't explain.") },
      { by: 'a', ...V("That burrito and I have an understanding. Fine. I'll eat it.",
        "Me and that burrito understand each other. Fine.", "That burrito and I understand each other. Fine. I'll eat it.", "That burrito and I have an UNDERSTANDING, so FINE, I'll eat it!",
        "Okay, that's fair. I'll eat it.", "Fine. My stomach was built for this moment.") },
      { by: 'b', ...V("I'll cheer. From very far away.", "I'll cheer from far away.", "I'll cheer. From back here.", "I'll CHEER! From VERY far away!",
        "I'll be cheering. From over here.", "I'll cheer from a safe smelling distance.") },
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'rsd.st-w2', when: ST, turns: [
      { by: 'b', ...V("You're eating it. You picked the spices.", "You picked the spices. You eat it.", "You picked them. You eat it.", "You're EATING it! YOU picked the spices!",
        "I think you should eat it, since you picked the spices.", "You picked the spices. Now the spices pick you.") },
      { by: 'a', ...V("We both picked the spices!", "We BOTH picked them.", "We both picked them.", "We BOTH picked the spices!",
        "But we both picked the spices...", "We both picked them. We are both guilty.") },
      { by: 'b', ...V("You picked the yellow one. I said no to the yellow one.", "You picked the yellow one. I said no.", "The yellow one was yours. I said no.", "YOU picked the YELLOW one! I said NO to the yellow one!",
        "You picked the yellow one, though. I did say no to it.", "The yellow one was your idea. The yellow one is your problem.") },
      { beat: '{a} takes the bowl and stares into it for a long time.' },
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'rsd.st-w3', when: ST, turns: [
      { by: 'a', ...V("Give it to me. I've eaten worse, and you gag at mayonnaise.", "Give it here. You gag at mayonnaise.", "I'll eat it. You gag at mayo.", "Give it to ME! You GAG at MAYONNAISE!",
        "I'll do it. You gag at mayonnaise, and I don't mind.", "Give it to me. You and mayonnaise are still not speaking.") },
      { by: 'b', ...V("That's not fair, mayonnaise is a lot.", "Mayonnaise is a lot. That's fair.", "Mayonnaise is a lot, to be fair.", "That's not FAIR! Mayonnaise is a LOT!",
        "Okay, but mayonnaise is a lot. Thank you, though.", "Mayonnaise is a lot. Everyone knows that. Thank you.") },
      { by: 'a', ...V("I know. Sit down and watch me be a hero.", "I know. Sit and watch.", "I know. Sit down and watch me be a hero.", "I KNOW! Sit DOWN and watch me be a HERO!",
        "I know. Sit down and watch me do this.", "I know. Sit down and witness history.") },
    ] },
  ],
  'task-start.any': [
    { id: 'rsd.st-s1', when: ST, turns: [
      { beat: 'The chef sets a bowl down in front of {a}. It is a very deep bowl.' },
      { by: 'a', ...V("Why is it that deep? Who needs a bowl that deep?", "Why's it so deep? Who needs that?", "That bowl is too deep.", "Why is it SO DEEP? Who NEEDS a bowl that deep?",
        "Why is it so deep? Nobody needs a bowl that deep.", "That isn't a bowl. That's a well with a handle.") },
      { by: 'b', ...V("Don't look at the bottom. Just take the first spoon.", "Don't look down. First spoon.", "First spoon. Don't look at the bottom.", "DON'T look at the bottom! Just take the FIRST SPOON!",
        "Don't look at the bottom. Just take the first spoonful.", "Don't look into the bowl. The bowl looks back.") },
      { by: 'a', ...V("It's looking at me. Something in there is looking at me.", "Something in there is looking at me.", "Something in there's looking at me.", "It's LOOKING at me! Something in there is LOOKING at me!",
        "I think something in there is looking at me.", "Something in there has eyes, and it's using them.") },
    ] },
    { id: 'rsd.st-s2', when: ST, turns: [
      { beat: '{a} takes a first spoonful. A long pause. Then {a.posAdj} eyes start to water.' },
      { by: 'b', ...V("Is it bad? It's bad. How bad?", "How bad is it?", "How bad?", "Is it BAD? It's BAD! HOW bad?",
        "Is it bad? How bad is it?", "Rate it. One to ten. Ten is the sun.") },
      { by: 'a', ...V("It's hot. It's so hot. I think the yellow one was a pepper.", "It's hot. The yellow one was a pepper.", "Hot. Yellow one was a pepper.", "It's SO hot, I think the yellow one was a PEPPER!",
        "It's so hot. I think the yellow one was a pepper.", "It's hot. The yellow one was a pepper wearing a spice costume.") },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rsd.st-f1', when: ST, turns: [
      { beat: '{a} eats without stopping, spoon after spoon, and turns the empty bowl upside down.' },
      { by: 'b', ...V("You didn't even breathe. How did you not even breathe?", "You didn't even breathe. How did you not breathe?", "You didn't breathe once. Not once. How?", "You didn't even BREATHE! HOW?",
        "You didn't even stop to breathe. How?", "You didn't breathe. Are you a fish?") },
      { by: 'a', ...V("If I'd stopped, I'd never have started again. Get the tip.", "If I stopped, I wasn't starting again. Tip.", "If I stopped, I'd have quit. Tip.", "If I'd STOPPED, I'd never have STARTED again! Get the TIP!",
        "If I'd stopped, I wouldn't have been able to start again. Can you get the tip?", "Stopping was never an option. Breathing was a luxury. Get the tip.") },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rsd.st-af1', when: ST, turns: [
      { beat: 'The chef sets down another fresh bowl. {a} has been here a while.' },
      { by: 'b', ...V("Small spoons. Little ones. Don't think about the bowl.", "Small spoons. Don't think about the bowl.", "Little spoons. Forget the bowl.", "SMALL spoons, little ones, and don't THINK about the bowl!",
        "Try small spoons. Little ones. Don't think about the whole bowl.", "Small spoons. Pretend each one is its own tiny meal.") },
      { by: 'a', ...V("I'm not thinking about anything. I'm a machine.", "I'm not thinking. I'm a machine.", "Not thinking. Machine.", "I'm not THINKING about ANYTHING! I'm a MACHINE!",
        "I'm not thinking about anything. I'm just eating.", "I'm not thinking. I'm a stew machine. Beep.") },
      { beat: 'This time it stays down. {a} pushes the empty bowl at the chef and doesn\'t look at it.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'rsd.st-st1', when: ST, turns: [
      { beat: '{a} is on a fresh bowl again, pale, holding the spoon like it weighs something.' },
      { by: 'b', ...V("You've got this. You've done most of it before. Twice.", "You've done most of it twice already.", "You've done most of it before. Twice.", "You've GOT this! You've done most of it TWICE!",
        "You can do it. You've already done most of it before. Twice, actually.", "You've eaten this stew more than the chef has. You've got this.") },
      { by: 'a', ...V("That's the problem. My stomach remembers the last two.", "My stomach remembers the last two. That's the problem.", "My stomach remembers. That's the problem.", "That's the PROBLEM! My STOMACH remembers the last TWO!",
        "That's the problem, though. My stomach remembers the last two.", "That's the problem. My stomach has a very good memory.") },
      { by: 'b', ...V("Then tell your stomach this is the last one.", "Tell your stomach it's the last one.", "Tell it this is the last one.", "Then TELL your stomach it's the LAST ONE!",
        "Then just tell your stomach this is the last one.", "Then make your stomach a promise. This is the last one.") },
    ] },
  ],
  'task-done.any': [
    { id: 'rsd.st-dn1', when: ST, turns: [
      { beat: 'The chef looks into the empty bowl and hands {b} the tip.' },
      { by: 'b', ...V("I'm so proud of you. Don't breathe on me.", "Proud of you. Don't breathe on me.", "Proud of you. Don't breathe near me.", "I'm SO proud of you! DON'T breathe on me!",
        "I'm so proud of you. Maybe don't breathe on me, though.", "I'm proud of you, and I'll be proud from over here.") },
      { by: 'a', ...V("I can't feel my mouth. Is my mouth still there?", "Can't feel my mouth. Is it there?", "I can't feel my mouth.", "I can't FEEL my MOUTH! Is it still THERE?",
        "I can't feel my mouth. Is it still there?", "My mouth has left. It didn't say goodbye.") },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'rsd.st-x1', when: ST, turns: [
      { beat: 'Halfway through the bowl, {a} stops, turns, and runs for the sand behind the tent.' },
      { by: 'b', ...V("No, no, no. Not now. You were halfway.", "Not now. You were halfway.", "You were halfway.", "NO, no, NO! You were HALFWAY!",
        "Oh no. You were halfway there.", "No. You were halfway. Halfway is so close to all the way.") },
      { beat: 'The chef calmly ladles a brand new bowl.' },
    ] },
    { id: 'rsd.st-x2', when: ST, turns: [
      { by: 'a', ...V("I can't. It's too hot. I need water.", "Too hot. I need water.", "Too hot. Water.", "I can't, it's too HOT, I need WATER!",
        "I can't, it's too hot. I really need some water.", "Too hot. I need a lake. A small one is fine.") },
      { by: 'b', ...V("No water. It says no water. Breathe through your nose.", "No water. Breathe through your nose.", "No water, it says no water. Breathe through your nose.", "NO WATER! It SAYS no water! Breathe through your NOSE!",
        "It says no water, sorry. Try breathing through your nose.", "No water allowed. Breathe like a dragon. Out the nose.") },
      { by: 'a', ...V("My nose is on fire too.", "My nose is on fire too.", "Nose is on fire too.", "My NOSE is on FIRE TOO!",
        "My nose is on fire too, though.", "My nose is also on fire. Everything is on fire.") },
    ] },
  ],
};

export default mergePools(place, spices, stew);
