// Red Sand Desert's own lines (js/rr/places/red-sand-desert.js), 1:1 with the real leg (Ridonculous Race ep. 2,
// the wiki's "None Down, Eighteen to Go - Part 2"):
//   the spices   All-In "The spice is right": five spices, nobody checks, "ideally cumin, cinnamon, paprika, saffron
//                and ginger". The ones who know pick fast (two partners recite the same spice together); the ones who
//                don't guess; one partner won't let the other touch a jar, then blames them at the stew.
//   the camel    to the restaurant in the desert: a camel goes down, a camel stops, the Vegans walk beside theirs
//                and start a campaign.
//   the stew     Botch or Watch with the team's own spices: the wrong ones burn; a partner tips the whole bowl in
//                (against the rules); one gulp and the eater can't see; camel drool to cool a burning mouth.
// Gated on place / taskId / picked / mishap (a place's own line wins whenever one fits).
import { V, mergePools } from './_kit.js';

const P = { place: 'red-sand-desert' };
const SP = { taskId: 'spices' };
const CM = { taskId: 'camel' };
const ST = { taskId: 'stew' };

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'rsd.op1', when: P, turns: [
      { by: 'don', say: "Welcome to the Red Sand Desert, where the sand really is red, as far as you can see!" },
      { beat: 'A hot wind blows sand across the road behind him.' },
      { by: 'don', say: "I'm told that isn't a fact. It is now. The first flight just landed, the second is in the air, and the third is still at the airport, eating airport sandwiches." },
    ] },
    { id: 'rsd.op2', when: P, turns: [
      { by: 'don', say: "This is the Red Sand Desert, home of the oldest spice market for a thousand miles, and a lot of very grumpy camels!" },
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
      { beat: 'The cab door opens on red dunes that run all the way to the sky.' },
      { by: 'a', ...V("It's actually red. I thought that was just a name.",
        "It's red. I thought that was just a name.", "So it's actually red. Huh. I thought that was a name.", "It's ACTUALLY red! I thought it was just a NAME!",
        "Oh wow. It's really red. I thought that was just a name.", "It's red. Someone painted a whole desert and didn't tell anyone.") },
      { by: 'b', ...V("Everything's red. My shoes are already red.",
        "My shoes are red already. Great.", "My shoes are red now. That was fast.", "My SHOES are already RED!",
        "My shoes are already red, look.", "My shoes have joined the desert. They're red now.") },
      { by: 'a', ...V("Smell that, though. That's spices. There's a market somewhere close.",
        "Smell that. Spices. The market's close.", "That smell is spices. The market must be close.", "Smell THAT, it's spices, the market has to be RIGHT there!",
        "Can you smell that? It's spices. The market must be close.", "Smell that. The air is seasoned.") },
    ] },
    { id: 'rsd.ar2', when: P, turns: [
      { by: 'a', ...V("Okay, it's beautiful, but it's also a hundred degrees, and I'm wearing a sweater.",
        "It's beautiful, it's a hundred degrees, and I'm in a sweater.", "It's beautiful, it's a hundred degrees, and I'm wearing a sweater.", "It's BEAUTIFUL, but it's a HUNDRED degrees and I'm in a SWEATER!",
        "It's so beautiful, but it's really hot, and I wore a sweater.", "It's beautiful, and I'm being slowly baked inside my sweater.") },
      { by: 'b', ...V("Take the sweater off.", "Then take it off.", "So take it off.", "Then TAKE IT OFF!", "You can take it off, you know.", "Take it off. Give it to a camel.") },
      { by: 'a', say: "I can't. The tip's in the pocket." },
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'rsd.ar3', when: P, turns: [
      { beat: 'The wind picks up a sheet of sand and throws it across the road.' },
      { by: 'a', ...V("How do people find anything out here? It all looks the same.",
        "How does anyone find anything here? It's all the same.", "It all looks the same. How does anyone find anything?", "How does ANYONE find ANYTHING out here? It's all the SAME!",
        "It all looks the same. How are we supposed to find anything?", "Every direction is the same direction. How is that allowed?") },
      { by: 'b', ...V("We follow the tip. The tip says spice corner. We find the spice corner.",
        "Follow the tip. It says spice corner. We find it.", "The tip says spice corner. So we find the spice corner.", "We follow the TIP! It says SPICE CORNER!",
        "We just follow the tip. It says spice corner, so we look for that.", "We follow the tip. The tip knows. Trust the tip.") },
      { by: 'a', say: "Okay. Let's find it." },
    ] },
  ],
};

// ── the spices: five out of dozens, nobody checks, the stew finds out ──
const spices = {
  'don-demo.gag': [
    { id: 'rsd.sp-d1', when: SP, turns: [
      { beat: 'Don stands in front of a kiosk stacked to the roof with open baskets of spice.' },
      { by: 'don', say: "Five spices for a stew. Ideally cumin, cinnamon, paprika, saffron and ginger. I'm not going to tell you which basket is which." },
      { beat: 'He leans over a red basket, breathes in, and sneezes so hard his sunglasses land in it.' },
      { by: 'don', say: "That one's paprika. You're welcome. Somebody get my glasses." },
    ] },
  ],
  'don-demo.dry': [
    { id: 'rsd.sp-d2', when: SP, turns: [
      { by: 'don', say: "Nobody checks your spices here. You pick five, you pay, you go." },
      { beat: 'The merchant behind him smiles and says nothing at all.' },
      { by: 'don', say: "You find out whether you picked right at the next stop. With a spoon." },
    ] },
  ],
  'task-start.any': [
    { id: 'rsd.sp-s1', when: SP, turns: [
      { beat: '{a} and {b} stop at the kiosk. Dozens of baskets, every colour, every smell.' },
      { by: 'b', ...V("The tip tells us which ones. Cumin, cinnamon, paprika, saffron, ginger.",
        "Tip says cumin, cinnamon, paprika, saffron, ginger.", "Cumin, cinnamon, paprika, saffron, ginger. That's the list.", "The tip TELLS us! Cumin, cinnamon, paprika, saffron, GINGER!",
        "Okay, the tip tells us which ones: cumin, cinnamon, paprika, saffron and ginger.", "The tip has given us a shopping list. Cumin, cinnamon, paprika, saffron, ginger.") },
      { by: 'a', ...V("Great. Which one's cumin?", "Great. Which one is cumin?", "Great. And which one's cumin?", "GREAT! Which one is CUMIN?",
        "Great... which one is cumin, though?", "Wonderful. Which one of you is cumin?") },
      { by: 'b', say: "It doesn't say." },
    ] },
    { id: 'rsd.sp-s2', when: SP, turns: [
      { by: 'a', ...V("Don't touch anything yet. Smell first, then touch.",
        "Smell first. Then touch.", "Smell first, touch after.", "DON'T touch anything! SMELL first!",
        "Let's not touch anything yet, okay? Just smell first.", "Smell first. Touching is for later. Like a museum.") },
      { beat: '{b} already has a hand in the nearest basket. It comes out bright yellow.' },
      { by: 'b', say: "Too late. Is yellow saffron?" },
      { by: 'a', ...V("Saffron is red. Little red threads. I'm almost sure.", "Saffron's red. Little threads. Almost sure.", "Saffron is red. Little threads, I think.", "Saffron is RED! Little red THREADS!",
        "I think saffron is red, actually. Little red threads.", "Saffron is red threads. Like a doll's hair, but expensive.") },
    ] },
    { id: 'rsd.sp-s3', when: SP, turns: [
      { by: 'a', ...V("Let me do this one. I cook.", "I'll do this. I cook.", "I've got this one. I cook.", "Let ME do this one! I COOK!",
        "Can I do this one? I cook, kind of.", "Step back. You're in the presence of a cook.") },
      { by: 'b', say: "You cook pasta." },
      { by: 'a', say: "That's still cooking. Hand me that bag." },
    ] },
    { id: 'rsd.sp-s4', when: SP, turns: [
      { beat: 'Three teams are already at the baskets, sniffing and arguing.' },
      { by: 'b', ...V("Everybody's already here. We're going to have to guess.", "Everyone's here. We'll have to guess.", "They're all here already. We're guessing.", "EVERYBODY'S already here! We have to GUESS!",
        "Everybody's already here... we might have to guess.", "Everybody beat us to the smelling. We'll have to guess.") },
      { by: 'a', say: "We're not guessing. We smell every one." },
      { by: 'b', ...V("Everything here smells like dinner.", "Everything smells like dinner.", "It all smells like dinner.", "EVERYTHING smells like dinner!",
        "Um, everything here smells like dinner.", "The whole kiosk is dinner. I'm standing in dinner.") },
    ] },
  ],
  'task-try.first-try': [
    // all five right
    { id: 'rsd.sp-r1', when: { ...SP, picked: 'right' }, turns: [
      { beat: '{a} walks along the baskets and drops a scoop into a bag at five of them without stopping.' },
      { by: 'b', ...V("How do you know which one's saffron?", "How do you know saffron?", "How do you know which one's saffron?", "How do you KNOW which one's SAFFRON?",
        "Wait, how do you know which one is saffron?", "How do you know saffron? Did saffron tell you?") },
      { by: 'a', say: "Look at the prices. Saffron is the really expensive one." },
    ] },
    { id: 'rsd.sp-r2', when: { ...SP, picked: 'right' }, turns: [
      { beat: '{a} and {b} point at the same basket at the same moment.' },
      { by: 'a', ...V("Cumin.", "Cumin.", "Cumin.", "CUMIN!", "Cumin?", "Cumin.") },
      { by: 'b', ...V("Cumin. And cinnamon, there.", "Cumin. Cinnamon's there.", "Cumin. And that's cinnamon.", "CUMIN! And CINNAMON, there!",
        "Cumin. And I think that's the cinnamon.", "Cumin. And cinnamon, hiding over there.") },
      { by: 'a', ...V("Did we just say that at the same time?", "We just said that together.", "We said that at the same time.", "Did we just say that at the SAME TIME?",
        "Did we just say that at the same time? That's kind of amazing.", "We just spoke in stereo. That's never happened.") },
      { by: 'b', say: "Okay. Paprika, saffron, ginger. Go." },
    ] },
    // three or four right
    { id: 'rsd.sp-m1', when: { ...SP, picked: 'mostly' }, turns: [
      { by: 'a', say: "Four I'm sure about. The fifth one, I'm not sure." },
      { by: 'b', ...V("We don't have time to find out. Bag it.", "No time. Bag it.", "No time to find out. Bag it.", "We don't have TIME! BAG it!",
        "We don't really have time to find out. Just bag it.", "We'll find out together, at the stew. Bag it.") },
      { beat: '{a} bags the fifth one and sniffs it one more time on the way out, frowning.' },
    ] },
    { id: 'rsd.sp-m2', when: { ...SP, picked: 'mostly' }, turns: [
      { by: 'b', ...V("Is this cinnamon?", "Cinnamon?", "This one's cinnamon, right?", "Is THIS cinnamon?", "Is this one cinnamon, do you think?", "Is this cinnamon, or is it pretending?") },
      { beat: '{a} smells it for a long time.' },
      { by: 'a', say: "That's cinnamon. I think. Put it in." },
    ] },
    // two or fewer: guessing, and the partner who wouldn't let the other help
    { id: 'rsd.sp-w1', when: { ...SP, picked: 'wrong' }, turns: [
      { by: 'a', ...V("Don't touch anything. I've got this.", "Don't touch. I've got this.", "Hands off. I've got this one.", "Don't TOUCH anything! I've GOT this!",
        "Can you not touch anything? I've got this, I promise.", "Hands behind your back. I'm the spice person today.") },
      { by: 'b', ...V("You're guessing.", "You're guessing.", "That's guessing.", "You're GUESSING!", "I think you're guessing, though.", "You're guessing with a straight face.") },
      { by: 'a', say: "I'm not guessing. I'm sure." },
      { by: 'b', say: "You're guessing." },
    ] },
    { id: 'rsd.sp-w2', when: { ...SP, picked: 'wrong' }, turns: [
      { beat: 'Another team runs past them with five full bags and the next tip.' },
      { by: 'a', ...V("Grab five. Any five. They're leaving!", "Grab any five. They're leaving.", "Any five. Go. They're leaving.", "GRAB five, ANY five, they're LEAVING!",
        "Just grab any five, okay? They're already leaving!", "Grab five. Any five. Destiny will sort it out.") },
      { by: 'b', ...V("This one's green. Stew isn't green.", "This one's green. Stew isn't green.", "It's green. Stew's not green.", "This one's GREEN! Stew isn't GREEN!",
        "Um, this one's green. Stew isn't green, is it?", "This one is green. Stew has never been green.") },
      { by: 'a', say: "We don't have time! Go!" },
    ] },
  ],
  'task-done.any': [
    { id: 'rsd.sp-dn1', when: SP, turns: [
      { beat: '{a} and {b} run from the kiosk with the tip and five little bags of spice.' },
      { by: 'a', ...V("Wait, we have to keep these? They're coming with us?",
        "We keep these? They're coming with us?", "Wait. These come with us? All of them?", "Wait, we KEEP these? They're COMING with us?",
        "Oh, wait, we have to keep these? They're coming with us?", "The spices are coming with us. They're part of the team now.") },
      { by: 'b', ...V("Read the tip. They go in a stew at the next stop.",
        "Read the tip. They go in a stew.", "They go in a stew at the next stop. Read it.", "READ the tip! They go in a STEW!",
        "It says they go in a stew at the next stop.", "Read it. They're going into a stew. Ours. To eat.") },
      { by: 'a', ...V("Then I really hope that brown one was cumin.",
        "Then I hope the brown one was cumin.", "So the brown one had better be cumin.", "Then I REALLY hope that brown one was CUMIN!",
        "Then I really hope that brown one was cumin.", "Then the brown one had better be cumin, for its own sake.") },
    ] },
    { id: 'rsd.sp-dn2', when: { ...SP, picked: 'wrong' }, turns: [
      { by: 'b', ...V("Can I ask what the green one was?", "What was the green one?", "So what was the green one?", "Can I ASK what the GREEN one was?",
        "Can I ask what the green one was, though?", "May I ask who the green one is?") },
      { by: 'a', say: "I don't know. It was green." },
      { by: 'b', say: "We're about to find out, aren't we?" },
    ] },
  ],
};

// ── the camel to the restaurant: one goes down, one stops, the Vegans walk ──
const camel = {
  'travel-mishap.any': [
    { id: 'rsd.cm-d1', when: { ...CM, mishap: 'camel-down' }, turns: [
      { beat: "Halfway across a dune, the camel's legs fold, and it lies down in the sand with {a} and {b} still on it." },
      { by: 'a', ...V("Is it dead? Did we kill it?", "Is it dead? Did we kill it?", "Did we kill it? Is it dead?", "Is it DEAD? Did we KILL it?",
        "Oh no. Is it dead? Did we kill it?", "Is it dead? Is this how we go out, as camel killers?") },
      { by: 'b', ...V("It's breathing. It's just done.", "It's breathing. It's done.", "It's breathing. It's just finished.", "It's BREATHING! It's just DONE!",
        "It's breathing, it's okay. I think it's just done.", "It's breathing. It has simply retired.") },
      { by: 'a', say: "Get up! Please!" },
      { beat: 'They slide off and start pulling on the rope. The camel doesn\'t move.' },
    ] },
    { id: 'rsd.cm-d2', when: { ...CM, mishap: 'camel-down' }, turns: [
      { beat: 'The camel kneels down, slowly, and stays down.' },
      { by: 'b', say: "Please get up. Please." },
      { by: 'a', ...V("It's not listening. We walk it in. Grab the rope.", "It's not listening. Grab the rope.", "Not listening. Grab the rope, we walk it in.", "It's NOT listening! Grab the ROPE!",
        "I don't think it's listening. Let's walk it in. Grab the rope.", "It has stopped listening to humans. Rope. We walk.") },
    ] },
    { id: 'rsd.cm-s1', when: { ...CM, mishap: 'camel-stops' }, turns: [
      { beat: 'The camel stops dead beside a dry bush and starts eating it.' },
      { by: 'a', ...V("Come on. Please. We're in a race.", "Come on. We're in a race.", "Please. We're in a race.", "Come ON! We're in a RACE!",
        "Come on, please? We're in a race.", "Come on. We're in a race. You're in a race too. Technically.") },
      { by: 'b', ...V("It doesn't care about the race.", "It doesn't care.", "It doesn't care about the race.", "It doesn't CARE about the RACE!",
        "I don't think it cares about the race.", "It has never once cared about a race.") },
      { by: 'a', say: "Come on! Please!" },
      { beat: 'Two teams ride past them.' },
    ] },
    { id: 'rsd.cm-s2', when: { ...CM, mishap: 'camel-stops' }, turns: [
      { by: 'b', ...V("Why did it stop? Did I say something?", "Why'd it stop? Was it me?", "It stopped. Did I say something?", "Why did it STOP? Did I SAY something?",
        "Why did it stop? Did I say something wrong?", "It stopped. Did I insult it? I didn't mean to insult it.") },
      { by: 'a', say: "You kicked it too hard." },
      { beat: 'The camel waits a long minute, then starts walking again on its own.' },
    ] },
    // the Vegans won't ride (the real leg: they walked beside their camel and started a campaign)
    { id: 'rsd.cm-w1', when: { ...CM, mishap: 'walks-beside' }, turns: [
      { beat: '{a} and {b} walk beside their camel, holding its rope, while other teams ride past.' },
      { by: 'a', say: "She's tired. We walk her in." },
      { by: 'b', say: "We're losing so much time." },
      { by: 'a', say: "I know. But she won't go." },
    ] },
    { id: 'rsd.cm-w2', when: { ...CM, mishap: 'walks-beside' }, turns: [
      { by: 'b', say: "Come on, girl. Please." },
      { beat: "The camel spits on the sand next to {b}'s shoe." },
      { by: 'a', say: "She doesn't like us." },
    ] },
  ],
};

// ── the stew: their own spices, one partner eats every drop, the other watches ──
const stew = {
  'don-demo.gag': [
    { id: 'rsd.st-d1', when: ST, turns: [
      { beat: 'A huge pot bubbles over a fire. The chef stirs it with a spoon the size of an oar.' },
      { by: 'don', say: "Every team brings the five spices they picked at the market. The chef puts them in the stew. One of you eats the whole bowl." },
      { by: 'don', say: "If you picked well, it's dinner. If you didn't, good luck!" },
      { beat: 'The chef holds out a spoonful to Don. Don takes a step back.' },
    ] },
  ],
  'don-demo.dry': [
    { id: 'rsd.st-d2', when: ST, turns: [
      { by: 'don', say: "One partner eats. The other one watches and can't help. Anything comes back up, you start a new bowl." },
      { beat: 'He looks into the pot and makes a face.' },
      { by: 'don', say: "So keep it down!" },
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'rsd.st-w1', when: ST, turns: [
      { beat: "{a} and {b} read the board. Who's got a cast-iron stomach?" },
      { by: 'b', say: "That's you. You eat anything." },
      { by: 'a', say: "Fine. I'll eat it." },
      { by: 'b', say: "I'll cheer you on." },
    ] },
  ],
  'whose-botch.pushed': [
    // pushed: a is the partner doing the pushing, b ends up eating
    { id: 'rsd.st-w2', when: ST, turns: [
      { by: 'a', ...V("You're eating it. You picked the spices.", "You picked the spices. You eat it.", "You picked them. You eat it.", "You're EATING it! YOU picked the spices!",
        "I think you should eat it, since you picked the spices.", "You picked the spices. Now the spices pick you.") },
      { by: 'b', ...V("We both picked the spices!", "We both picked them.", "We both picked them!", "We BOTH picked the spices!",
        "But we both picked the spices...", "We both picked them. We are both guilty.") },
      { by: 'a', ...V("You picked the green one. I said no to the green one.", "You picked the green one. I said no.", "The green one was yours. I said no.", "YOU picked the GREEN one! I said NO to the green one!",
        "You picked the green one, though. I did say no to it.", "The green one was your idea. The green one is your problem.") },
      { beat: '{b} takes the bowl and stares into it for a long time.' },
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'rsd.st-w3', when: ST, turns: [
      { by: 'a', ...V("Give it to me. I've eaten worse, and you gag at mayonnaise.", "Give it here. You gag at mayonnaise.", "I'll eat it. You gag at mayonnaise.", "Give it to ME! You GAG at MAYONNAISE!",
        "I'll do it. You gag at mayonnaise, and I don't mind.", "Give it to me. You and mayonnaise are still not speaking.") },
      { by: 'b', ...V("That's not fair, mayonnaise is a lot.", "Mayonnaise is a lot. That's fair.", "Mayonnaise is a lot, to be fair.", "That's not FAIR! Mayonnaise is a LOT!",
        "Okay, but mayonnaise is a lot. Thank you, though.", "Mayonnaise is a lot. Everyone knows that. Thank you.") },
      { by: 'a', say: "I know. Sit down. I've got this." },
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'rsd.st-w4', when: ST, turns: [
      { by: 'b', ...V("Cast-iron stomach. That's food. It's going to be food.", "Cast-iron stomach means food.", "Cast-iron stomach. It's food.", "Cast-iron STOMACH! It's going to be FOOD!",
        "Cast-iron stomach... it's going to be food, isn't it?", "A cast-iron stomach. Food is coming for one of us.") },
      { by: 'a', ...V("Then it's me. I'll eat anything.", "Then me. I'll eat anything.", "Me, then. I'll eat anything.", "Then it's ME! I'll eat ANYTHING!",
        "Then it should be me. I'll eat pretty much anything.", "Then me. I have never met a food I couldn't defeat.") },
      { beat: 'The chef sets down a bowl the size of a hubcap.' },
      { by: 'a', say: "Okay. Maybe not anything." },
    ] },
  ],
  // against the rules (the real leg: a partner tipped the whole bowl in, and nobody penalised it)
  'helped-botch.any': [
    { id: 'rsd.st-h1', when: ST, turns: [
      { beat: '{b} takes a spoonful, chews, and dabs the corners of {b.posAdj} mouth with a napkin. Then does it again.' },
      { by: 'a', say: "Faster! We're in a race!" },
      { beat: "{a} grabs the bowl and tips the whole thing into {b}'s mouth." },
      { by: 'b', ...V("That's not allowed! You're not allowed to help!", "That's not allowed. You can't help.", "You're not allowed to help. That's not allowed.", "That's NOT allowed! You're NOT allowed to HELP!",
        "That's not allowed, I don't think! You're not supposed to help!", "That was illegal! You're a criminal now!") },
      { by: 'a', say: "Sorry! I panicked!" },
    ] },
    { id: 'rsd.st-h2', when: ST, turns: [
      { beat: "{a} can't watch anymore and picks up the spoon." },
      { by: 'a', say: "Open. Just open your mouth." },
      { by: 'b', ...V("You can't feed me. That's helping.", "You can't feed me. That's helping.", "Feeding me is helping. You can't.", "You can't FEED me! That's HELPING!",
        "You can't feed me, that counts as helping.", "You can't feed me. That's a rule. I think it's a rule.") },
      { by: 'a', say: "Okay. Okay. Sorry." },
    ] },
  ],
  'task-start.any': [
    { id: 'rsd.st-s1', when: ST, turns: [
      { beat: 'The chef sets a bowl down in front of {a}. It is a very deep bowl.' },
      { by: 'a', say: "Why is it so deep?" },
      { by: 'b', ...V("Don't look at the bottom. Just take the first spoon.", "Don't look down. First spoon.", "First spoon. Don't look at the bottom.", "DON'T look at the bottom! Just take the FIRST SPOON!",
        "Don't look at the bottom. Just take the first spoonful.", "Don't look into the bowl. The bowl looks back.") },
      { by: 'a', say: "Okay. Okay. Here I go." },
    ] },
    { id: 'rsd.st-s2', when: { ...ST, picked: ['wrong', 'mostly'] }, turns: [
      { beat: '{a} takes a first spoonful. A long pause. Then {a.posAdj} eyes start to water.' },
      { by: 'b', ...V("Is it bad? It's bad. How bad?", "How bad is it?", "Is it bad? How bad?", "Is it BAD? It's BAD! HOW bad?",
        "Is it bad? How bad is it?", "Rate it. One to ten. Ten is the sun.") },
      { by: 'a', ...V("It's hot. It's so hot. I think the green one was a pepper.", "It's hot. The green one was a pepper.", "It's so hot. I think the green one was a pepper.", "It's SO hot, I think the green one was a PEPPER!",
        "It's so hot. I think the green one was a pepper.", "It's hot. The green one was a pepper wearing a spice costume.") },
    ] },
    { id: 'rsd.st-s3', when: { ...ST, picked: 'right' }, turns: [
      { beat: '{a} takes a first careful spoonful.' },
      { by: 'a', ...V("Wait. This is actually good. Like, really good.", "This is actually good.", "Wait. This is good. Really good.", "Wait, this is ACTUALLY good! Like, REALLY good!",
        "Oh. This is actually really good.", "Wait. This is good. I'd order this. I'd tip.") },
      { by: 'b', ...V("Don't say that. You'll jinx it. Eat.", "Don't say that. Eat.", "Don't jinx it. Eat.", "DON'T say that, you'll JINX it, just EAT!",
        "Don't say that, you'll jinx it. Just keep eating.", "Don't compliment the stew. The stew will get ideas. Eat.") },
      { by: 'a', ...V("We picked the right spices. We actually picked the right spices.", "We picked the right spices.", "We picked the right ones. We actually did.", "We picked the RIGHT spices! We ACTUALLY did!",
        "We picked the right spices. I can't believe it.", "We picked the right spices. We're chefs now. Both of us.") },
    ] },
    // the blame (the real leg: the partner who wouldn't let the other touch a jar blamed them for the spices)
    { id: 'rsd.st-s4', when: { ...ST, picked: 'wrong' }, turns: [
      { beat: '{a} sips, coughs, and glares at {b}.' },
      { by: 'a', ...V("This is your fault. This is what you picked.", "Your fault. You picked this.", "This is your fault. You picked these.", "This is YOUR fault! This is what YOU picked!",
        "This is kind of your fault. You picked these.", "This is your fault. Your spices did this to me.") },
      { by: 'b', ...V("I didn't pick anything! You wouldn't let me touch a single jar!", "I didn't pick anything. You wouldn't let me touch a jar.", "You wouldn't let me touch a single jar.", "I didn't PICK anything! You wouldn't let me touch a SINGLE JAR!",
        "I didn't pick anything, though. You wouldn't let me touch a single jar.", "I picked nothing. I was banned from the jars. You banned me.") },
      { by: 'a', ...V("Okay. We're not talking about this. I'm eating.", "Not talking about it. I'm eating.", "We're not talking about this. I'm eating.", "We're NOT talking about this! I'm EATING!",
        "Okay. Let's not talk about it. I'm eating.", "We'll discuss the jars later. I'm busy dying.") },
    ] },
  ],
  'task-try.first-try': [
    { id: 'rsd.st-f1', when: ST, turns: [
      { beat: '{a} eats without stopping, spoon after spoon, and turns the empty bowl upside down.' },
      { by: 'b', ...V("You didn't even breathe. How did you not even breathe?", "You didn't even breathe. How did you not breathe?", "You didn't breathe once. Not once. How?", "You didn't even BREATHE! HOW?",
        "You didn't even stop to breathe. How?", "You didn't breathe. Are you a fish?") },
      { by: 'a', ...V("If I'd stopped, I'd never have started again. Get the tip.", "If I stopped, I wasn't starting again. Get the tip.", "If I'd stopped, I'd have quit. Get the tip.", "If I'd STOPPED, I'd never have STARTED again! Get the TIP!",
        "If I'd stopped, I wouldn't have been able to start again. Can you get the tip?", "Stopping was never an option. Breathing was a luxury. Get the tip.") },
    ] },
    // one gulp, and the spice takes the eater's sight for a while (the real leg: the son dragged his father to the mat)
    { id: 'rsd.st-f2', when: ST, turns: [
      { beat: '{a} lifts the bowl with both hands and drinks the whole thing in one go.' },
      { by: 'a', say: "Done! Oh my God. My eyes are watering." },
      { by: 'b', say: "You did it! Are you okay?" },
      { by: 'a', say: "I can't see anything! It's so hot!" },
      { by: 'b', ...V("Okay. Hold my arm. I'll steer.", "Hold my arm. I'll steer.", "Okay. Hold my arm. I'm steering.", "OKAY, hold my ARM, I'll STEER!",
        "Okay, okay. Hold my arm and I'll steer you.", "Hold my arm. I'm your eyes now. Left foot.") },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rsd.st-af1', when: ST, turns: [
      { beat: 'The chef sets down another fresh bowl. {a} has been here a while.' },
      { by: 'b', ...V("Small spoons. Little ones. Don't think about the bowl.", "Small spoons. Don't think about the bowl.", "Little spoons. Don't think about the bowl at all.", "SMALL spoons, little ones, and don't THINK about the bowl!",
        "Try small spoons. Little ones. Don't think about the whole bowl.", "Small spoons. Pretend each one is its own tiny meal.") },
      { by: 'a', say: "I'm not thinking about anything." },
      { beat: "This time it stays down. {a} pushes the empty bowl at the chef and doesn't look at it." },
    ] },
    // the partner who won't let it come back up (the real leg: "swallow it")
    { id: 'rsd.st-af2', when: ST, turns: [
      { beat: '{a} stops mid-spoon, cheeks full, eyes huge.' },
      { by: 'b', ...V("Don't you dare. Swallow it. Swallow it right now.", "Don't. Swallow it. Right now.", "Don't you dare. Swallow it right now.", "Don't you DARE, SWALLOW it, RIGHT NOW!",
        "Please don't. Just swallow it, okay? Right now.", "Don't you dare. That stew lives in you now. Swallow.") },
      { beat: '{a} swallows. It takes a long time.' },
      { by: 'a', ...V("I hate you. Give me the next spoon.", "Hate you. Next spoon.", "I hate you. Next spoon.", "I HATE you! Give me the NEXT spoon!",
        "I kind of hate you right now. Give me the next spoon.", "I hate you, and I need you. Next spoon.") },
    ] },
  ],
  'task-try.struggling': [
    { id: 'rsd.st-st1', when: ST, turns: [
      { beat: '{a} is on a fresh bowl again, pale, holding the spoon like it weighs something.' },
      { by: 'b', ...V("You've got this. You've done most of it before. Twice.", "You've done most of it twice already.", "You've done most of it before. Twice, even.", "You've GOT this! You've done most of it TWICE!",
        "You can do it. You've already done most of it before. Twice, actually.", "You've eaten this stew more than the chef has. You've got this.") },
      { by: 'a', say: "That's the problem. I've already had two bowls." },
      { by: 'b', say: "This is the last one. I promise." },
    ] },
    { id: 'rsd.st-st2', when: { ...ST, picked: ['wrong', 'mostly'] }, turns: [
      { by: 'a', ...V("Every bowl's the same bowl. It's the green one. It's always the green one.", "Every bowl's the same. It's the green one.", "Every bowl is the same bowl. It's the green one.", "Every bowl's the SAME bowl! It's the GREEN one, it's ALWAYS the green one!",
        "Every bowl is the same bowl. It's that green one, every time.", "Every bowl is the same bowl. The green one follows me.") },
      { by: 'b', ...V("Hold your nose. You can't taste it if you can't smell it.", "Hold your nose. No smell, no taste.", "Hold your nose. Then you can't taste it.", "HOLD your NOSE! You can't TASTE it if you can't SMELL it!",
        "Try holding your nose. You can't taste it if you can't smell it.", "Hold your nose. Trick your mouth.") },
      { beat: '{a} holds {a.posAdj} nose with one hand and eats with the other, very slowly.' },
    ] },
  ],
  'task-done.any': [
    { id: 'rsd.st-dn1', when: ST, turns: [
      { beat: 'The chef looks into the empty bowl and hands {b} the tip.' },
      { by: 'b', say: "I'm so proud of you." },
      { by: 'a', say: "I can't feel my mouth." },
    ] },
    { id: 'rsd.st-dn2', when: ST, turns: [
      { beat: '{a} and {b} run out of the restaurant tent and into the heat, tip in hand.' },
      { by: 'b', ...V("Chill Zone's on foot from here. Can you run?", "Chill Zone's on foot. Can you run?", "It's on foot from here. Can you run?", "Chill Zone's on FOOT! Can you RUN?",
        "The Chill Zone's on foot from here. Can you run?", "We run from here. Can your stomach run?") },
      { by: 'a', say: "I can run. Slowly." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'rsd.st-x1', when: ST, turns: [
      { beat: 'Halfway through the bowl, {a} stops, turns, and runs for the sand behind the tent.' },
      { by: 'b', ...V("No, no, no. Not now. You were halfway.", "Not now. You were halfway.", "No. Not now. You were halfway there.", "NO, no, NO! You were HALFWAY!",
        "Oh no. You were halfway there.", "No. You were halfway. Halfway is so close to all the way.") },
      { beat: 'The chef calmly ladles a brand new bowl.' },
    ] },
    { id: 'rsd.st-x2', when: ST, turns: [
      { by: 'a', ...V("I can't. It's too hot. I need water.", "Too hot. I need water.", "I can't, it's too hot. I need water.", "I can't, it's too HOT, I need WATER!",
        "I can't, it's too hot. I really need some water.", "Too hot. I need a lake. A small one is fine.") },
      { by: 'b', say: "Not too much water. Breathe through your nose." },
      { by: 'a', say: "My nose is on fire too." },
    ] },
    // camel drool (the real leg: the eater drank a camel's drool to cool down, and the whole tent nearly lost it)
    { id: 'rsd.st-x3', when: ST, turns: [
      { beat: "{a} reaches for the jug and drinks half of it in one go." },
      { by: 'a', say: "That's so much better." },
      { by: 'b', say: "Too much! You'll be too full!" },
      { beat: 'A minute later, {a} gags, and it all comes back up.' },
      { by: 'a', say: "That made it worse." },
    ] },
  ],
};

// ── the rest of the set: enough of each moment for twelve teams, the watching partner, the camel ride ──
const more = {
  'task-try.first-try': [
    { id: 'rsd.sp-r3', when: { ...SP, picked: 'right' }, turns: [
      { by: 'b', ...V("Paprika is the red one that makes you sneeze. Saffron is the red one that costs money.",
        "Paprika's the red sneezy one. Saffron's the red expensive one.", "Paprika is red and makes you sneeze. Saffron is red and costs money.", "Paprika is the red one that makes you SNEEZE, saffron is the red one that costs MONEY!",
        "So paprika is the red one that makes you sneeze, and saffron is the red one that costs money.", "Paprika is the loud red one. Saffron is the rich red one.") },
      { by: 'a', ...V("How do you know all this?", "How do you know this?", "How do you know all of this?", "How do you KNOW all this?",
        "How do you even know all this?", "Where has this knowledge been hiding all these years?") },
      { by: 'b', say: "I cook. A lot. Trust me." },
    ] },
    { id: 'rsd.sp-r4', when: { ...SP, picked: 'right' }, turns: [
      { beat: '{a} holds up a little bag of something pale and knobbly.' },
      { by: 'a', say: "Ginger. It looks like a little root." },
      { by: 'b', ...V("That's five. That's all five. Pay the man.", "That's five. Pay him.", "That's all five. Pay the man.", "That's FIVE, that's ALL five, PAY the man!",
        "That's all five, I think. Let's pay him and go.", "That's five. Our work here is done. Pay the man.") },
      { beat: 'The merchant nods at the five little bags before he takes the money.' },
    ] },
    { id: 'rsd.sp-m3', when: { ...SP, picked: 'mostly' }, turns: [
      { by: 'a', ...V("Cumin, cinnamon, paprika, ginger. What does saffron look like?", "Cumin, cinnamon, paprika, ginger. Saffron?", "That's four. What does saffron look like?", "Cumin, cinnamon, paprika, GINGER! What does SAFFRON look like?",
        "That's cumin, cinnamon, paprika and ginger. What does saffron look like?", "Four found. Saffron is still out there somewhere.") },
      { by: 'b', ...V("Yellow? Saffron rice is yellow. Get the yellow one.", "Saffron rice is yellow. Yellow one.", "Saffron rice is yellow, so the yellow one.", "Saffron rice is YELLOW, get the YELLOW one!",
        "Saffron rice is yellow, so maybe the yellow one?", "Saffron rice is yellow. Logic says the yellow one.") },
      { beat: '{a} grabs a scoop of bright yellow powder. Two baskets over, a few red threads sit untouched.' },
    ] },
    { id: 'rsd.sp-m4', when: { ...SP, picked: 'mostly' }, turns: [
      { by: 'b', say: "We've got four that smell right and one I'm not sure about." },
      { by: 'a', say: "It smells okay. Keep it." },
      { by: 'b', say: "Into a stew, though?" },
    ] },
    { id: 'rsd.sp-w3', when: { ...SP, picked: 'wrong' }, turns: [
      { beat: '{a} and {b} have been smelling baskets for so long that neither of them can smell anything at all.' },
      { by: 'b', say: "I can't smell anything anymore." },
      { by: 'a', say: "Then we pick by colour. Two brown, two red, one orange." },
      { by: 'b', ...V("That's not how spices work.", "That's not how spices work.", "Spices don't work like that.", "That's NOT how spices WORK!",
        "I don't think that's how spices work.", "Spices do not work by colour. I'm fairly sure.") },
      { by: 'a', say: "Do you have a better idea?" },
    ] },
    { id: 'rsd.sp-w4', when: { ...SP, picked: 'wrong' }, turns: [
      { by: 'a', say: "Excuse me, which one is cumin? Please?" },
      { beat: 'The merchant smiles and spreads his hands over all of them.' },
      { by: 'b', say: "He's not going to tell us. Just take that one." },
    ] },
    { id: 'rsd.st-f3', when: { ...ST, picked: 'right' }, turns: [
      { beat: '{a} eats steadily, spoon after spoon, and actually slows down near the end to enjoy it.' },
      { by: 'b', say: "Are you enjoying it? We're in a race!" },
      { by: 'a', say: "We picked the right spices. It's actually good." },
      { beat: 'The bowl is empty. The chef nods and hands over the tip.' },
    ] },
    { id: 'rsd.st-f4', when: ST, turns: [
      { by: 'b', ...V("You can do this. Just pretend it's soup from home.", "Pretend it's soup from home.", "You can do this. Pretend it's soup from home.", "You can DO this, pretend it's SOUP from HOME!",
        "You can do this. Just pretend it's soup from home, okay?", "You can do this. It's soup from home. It's home soup.") },
      { by: 'a', say: "Soup from home isn't this hot." },
      { beat: '{a} eats it anyway, all of it, without stopping, and puts the spoon down with a shaking hand.' },
    ] },
  ],
  'task-done.any': [
    { id: 'rsd.sp-dn3', when: SP, turns: [
      { beat: '{a} and {b} come out of the kiosk with their five bags and squint at the tip.' },
      { by: 'a', ...V("Camel to a restaurant in the desert. A camel. We're getting on a camel.", "Camel to a restaurant. We're getting on a camel.", "A camel to a restaurant in the desert. We ride a camel.", "A CAMEL to a restaurant, we're getting on a CAMEL!",
        "We take a camel to a restaurant in the desert. We're actually getting on a camel.", "A camel. To a restaurant. In a desert. This is my life now.") },
      { by: 'b', ...V("I've never been on anything taller than a bike.", "Tallest thing I've ridden is a bike.", "I've never ridden anything taller than a bike.", "I've NEVER been on anything taller than a BIKE!",
        "I've never been on anything taller than a bike, you know.", "The tallest thing I've ever ridden is a bike, and I fell off.") },
      { beat: 'They run for the camels anyway.' },
    ] },
    { id: 'rsd.st-dn3', when: ST, turns: [
      { beat: '{a} sets down the empty bowl, stands up, and sits right back down.' },
      { by: 'b', ...V("Up. Come on. The Chill Zone is that way.", "Up. The Chill Zone's that way.", "Come on, up. The Chill Zone is that way.", "UP, come ON, the Chill Zone is THAT way!",
        "Come on, up you get. The Chill Zone is that way.", "Up. The Chill Zone awaits. It's that way.") },
      { by: 'a', say: "Give me one second. I feel so full." },
      { beat: '{b} hauls {a} up by both hands, and they run.' },
    ] },
  ],
  // the camel ride itself: the first teams on it, seen riding (director: a ride that is the leg's signature)
  'ride.any': [
    { id: 'rsd.cm-r1', when: CM, turns: [
      { beat: '{a} and {b} sway across the dunes on a camel that walks like it has all day.' },
      { by: 'b', ...V("I'm going to be sick before we even get to the stew.", "I'll be sick before the stew.", "I'm going to be sick before we get to the stew.", "I'm going to be SICK before we even get to the STEW!",
        "I think I'm going to be sick before we even get to the stew.", "My breakfast is riding a different camel than I am.") },
      { by: 'a', ...V("Look at the horizon. Don't look down, look at the horizon.", "Look at the horizon, not down.", "Horizon. Don't look down, look at the horizon.", "Look at the HORIZON, don't look DOWN!",
        "Try looking at the horizon. Don't look down.", "Look at the horizon. The horizon is calm. Be the horizon.") },
      { by: 'b', say: "The horizon's moving too." },
    ] },
    { id: 'rsd.cm-r2', when: CM, turns: [
      { by: 'a', ...V("Why is it so tall? Nobody said it would be this tall.", "Why's it this tall? Nobody said.", "Why is it so tall? Nobody mentioned tall.", "Why is it SO TALL? Nobody said it would be THIS tall!",
        "Why is it so tall? Nobody told us it would be this tall.", "It's so tall. I can see tomorrow from up here.") },
      { by: 'b', say: "It's so high up here." },
      { beat: 'The camel turns its head round and looks at {b}.' },
      { by: 'b', say: "Sorry. Sorry. Good camel." },
    ] },
    { id: 'rsd.cm-r3', when: CM, turns: [
      { beat: 'Another team on another camel comes up the dune beside them.' },
      { by: 'a', say: "Can we make it go faster?" },
      { by: 'b', ...V("You kick a little, I think. Gently.", "Kick a little. Gently.", "I think you kick it a little. Gently.", "You KICK a little, I think, GENTLY!",
        "I think you kick it a little. Really gently, though.", "You kick a little. Politely. Like knocking on a door.") },
      { beat: '{a} kicks gently. The camel stops, then speeds up.' },
    ] },
    { id: 'rsd.cm-r4', when: CM, turns: [
      { beat: 'The sun is high, the sand is red, and the camel is in no hurry at all.' },
      { by: 'b', ...V("Okay, I'll admit it. This is kind of amazing.", "Okay. This is kind of amazing.", "I'll admit it. This is kind of amazing.", "Okay, I'll ADMIT it, this is kind of AMAZING!",
        "Okay, I'll admit it. This is actually kind of amazing.", "I'll admit it. I'm on a camel, in a desert, and it's amazing.") },
      { by: 'a', ...V("We're in a race, and you're enjoying the view.", "We're racing and you're enjoying the view.", "It's a race, and you're enjoying the view.", "We're in a RACE, and you're enjoying the VIEW!",
        "We're in a race, and you're enjoying the view?", "We're in a race, and you've gone on holiday.") },
      { by: 'b', say: "I know. It's still amazing." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'rsd.st-af3', when: { ...ST, picked: ['wrong', 'mostly'] }, turns: [
      { beat: 'A third bowl. {a} stares into it.' },
      { by: 'b', say: "It's the same bowl. You've nearly done it twice." },
      { by: 'a', say: "Nearly isn't done." },
      { beat: 'This time {a} gets to the bottom, and it stays there.' },
    ] },
    { id: 'rsd.st-af4', when: ST, turns: [
      { by: 'a', ...V("Okay. New plan. I'm not tasting it. I'm just swallowing.", "New plan. No tasting. Just swallowing.", "New plan. I'm not tasting, I'm just swallowing.", "Okay, NEW plan, I'm not TASTING it, I'm just SWALLOWING!",
        "Okay, new plan. I'm not going to taste it, I'm just going to swallow.", "New plan. My mouth is closed for business. Only my throat is working.") },
      { by: 'b', ...V("Is that a real plan?", "Is that a plan?", "That's a real plan?", "Is that a REAL plan?", "Is that a real plan, though?", "Is that a plan, or a wish?") },
      { beat: 'It turns out to be a real plan. The bowl is empty in under a minute.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'rsd.st-st3', when: ST, turns: [
      { beat: '{a} has been at the stew for so long that the chef has sat down to watch.' },
      { by: 'a', ...V("He's watching me. Why is he watching me?", "Why is the chef watching me?", "He's watching me. Why is he doing that?", "He's WATCHING me! WHY is he watching me?",
        "Why is the chef watching me? It's making it worse.", "The chef is watching. I'm his entertainment now.") },
      { by: 'b', say: "I don't know. Ignore him. Eat." },
      { by: 'a', say: "Okay. Okay. Watch this." },
    ] },
  ],
  // the partner watching the stew: cheering, nerves, too quiet, and helping when they mustn't
  'watching-botch.cheer': [
    { id: 'rsd.st-wc1', when: ST, turns: [
      { by: 'b', ...V("You're doing it! Look at you! Spoon, swallow, spoon, swallow!", "You're doing it. Spoon, swallow, spoon, swallow.", "Look at you. Spoon, swallow, spoon, swallow.", "You're DOING it, look at YOU, spoon, swallow, SPOON, swallow!",
        "You're doing it! Look at you go! Spoon, swallow, spoon, swallow!", "You're doing it, you're a stew champion, spoon and swallow!") },
      { by: 'a', say: "Stop counting!" },
      { by: 'b', ...V("Spoon! Swallow! I'm so proud of you!", "Spoon. Swallow. Proud of you.", "Spoon, swallow. I'm so proud of you.", "SPOON, SWALLOW, I'm SO proud of you!",
        "Spoon, swallow. I'm so proud of you, honestly.", "Spoon and swallow, and I'm going to write a song about this!") },
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'rsd.st-wn1', when: ST, turns: [
      { beat: '{b} watches {a} eat through the gaps between {b.posAdj} fingers.' },
      { by: 'b', ...V("I can't look. Tell me when it's over. Actually don't, I'll look.", "Can't look. Tell me when it's over. No, I'll look.", "I can't look. Tell me when it's done. Actually, I'll look.", "I CAN'T look, tell me when it's OVER, actually DON'T, I'll look!",
        "I can't look. Tell me when it's over. Actually, no, I'll look.", "I can't watch. I can't not watch. This is torture for both of us.") },
      { by: 'a', say: "You're making me nervous. Look somewhere else." },
      { beat: '{b} turns away and looks out at the desert.' },
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'rsd.st-wi1', when: ST, turns: [
      { by: 'b', ...V("Less chewing. More swallowing. Tilt the bowl, tilt it!", "Less chewing. More swallowing. Tilt the bowl.", "Chew less, swallow more. Tilt the bowl.", "Less CHEWING, more SWALLOWING, tilt the bowl, TILT it!",
        "Try chewing less and swallowing more. Tilt the bowl, maybe?", "Less chewing. More swallowing. Tilt the bowl like a cup.") },
      { by: 'a', ...V("You're not allowed to tell me how to eat!", "You can't tell me how to eat.", "You're not allowed to tell me how to eat.", "You're NOT allowed to tell me how to EAT!",
        "I don't think you're allowed to tell me how to eat!", "You're not allowed to coach my eating!") },
      { beat: 'A crew member at the edge of the tent writes something down.' },
      { by: 'b', say: "Was that coaching? I was just cheering." },
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'rsd.st-wq1', when: ST, turns: [
      { beat: '{b} sits on a cushion across from {a} and says nothing at all, just watching.' },
      { by: 'a', ...V("You're very quiet.", "You're quiet.", "You're very quiet over there.", "You're VERY quiet!", "You're being very quiet.", "You're very quiet. It's unsettling.") },
      { by: 'b', say: "If I talk, you'll stop eating." },
      { beat: '{a} nods and keeps eating.' },
    ] },
  ],
};

export default mergePools(place, spices, camel, stew, more);
