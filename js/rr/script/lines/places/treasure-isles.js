// Treasure Isles' own lines (js/rr/places/treasure-isles.js), 1:1 with the real leg ("Bahamarama"), in our own words:
//   the museum     hundreds of rolled-up maps, waxwork pirates, a tug-of-war over one map; only the ones with the
//                  race's logo count.
//   the jet skis   out to the islands: a partner who can't steer, a jet ski that runs dry.
//   the doubloons  Botch or Watch: down into the underwater tunnels with the map and a tank of air; a wrong turn, a
//                  tank running low, a diver who can't stand small spaces.
// Gated on place / taskId / mishap. a dives, b waits in the boat.
import { V, mergePools } from './_kit.js';

const P = { place: 'treasure-isles' };
const PM = { taskId: 'pirate-map' };
const JS = { taskId: 'jet-ski' };
const DB = { taskId: 'doubloons' };
const don = say => ({ by: 'don', say });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'tri.op1', when: P, turns: [
      { beat: 'Don stands on a dock in a pirate hat, holding a plastic sword.' },
      don("Ahoy! Welcome to the Treasure Isles, home of white sand, blue water, and real pirate treasure. Somewhere."),
      don("Teams must find a treasure map in the pirate museum, ride jet skis out to the islands, and dive for gold."),
      { beat: 'A seagull lands on his hat. He stays very still.' },
      don("Is it still there? Don't tell me. Somebody take it off. Gently. It's looking at me."),
    ] },
    { id: 'tri.op2', when: P, turns: [
      don("Welcome to the Treasure Isles, home of palm trees, crystal water, and a tan that is finally coming along nicely."),
      { beat: 'He admires his arm in the sunlight.' },
      don("Today's leg is a treasure hunt. The prize is your next tip. And, if you're last, a ticket home. Arr!"),
    ] },
  ],
  'don-opener.bored': [
    { id: 'tri.op3', when: P, turns: [
      { beat: 'Don lies in a hammock between two palm trees, a straw hat over his face.' },
      don("Treasure Isles. Pirates. Maps. Gold. Diving."),
      { beat: 'He lifts the hat just enough to look at the camera.' },
      don("I'll be here. Racers, the museum's that way. Wake me up at the Chill Zone."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'tri.ar1', when: P, turns: [
      { beat: 'The water is so clear that the boats in the harbour look like they\'re floating in the air.' },
      { by: 'a', ...V("Look at the water. You can see right to the bottom.", "You can see the bottom.", "See-through water.", "LOOK at the WATER! You can see RIGHT to the BOTTOM!", "Look at the water, you can see all the way to the bottom.", "The sea here is made of glass.") },
      { by: 'b', say: "Is that a turtle? That's a turtle!" },
      { by: 'a', say: "This is the most beautiful place we've ever been." },
    ] },
    { id: 'tri.ar2', when: P, turns: [
      { by: 'b', say: "Pirates used to live here. Real pirates." },
      { by: 'a', say: "And there's treasure. There's always treasure where there were pirates." },
      { by: 'b', say: "Then we're going to find it." },
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'tri.ad1', when: P, turns: [
      { by: 'a', say: "Islands. Water everywhere. There's going to be swimming, isn't there?" },
      { by: 'b', ...V("Or boats. It might be boats.", "Might be boats.", "Or boats.", "Or BOATS! It MIGHT be BOATS!", "It might just be boats, though.", "Perhaps the sea will be kind and give us boats.") },
      { by: 'a', say: "It's never just boats." },
    ] },
    { id: 'tri.ad2', when: P, turns: [
      { by: 'b', say: "I'm going to burn. Look at me. I'm already burning." },
      { by: 'a', say: "We've been here three minutes." },
      { by: 'b', say: "And I'm already pink." },
    ] },
  ],
};

// ── the pirate museum ──
const museum = {
  'don-demo.gag': [
    { id: 'tri.pm-d1', when: PM, turns: [
      don("In this All-In, teams search this pirate museum for a treasure map with the Ridonculous Race logo on it."),
      { beat: 'He unrolls a map. It\'s a map of a supermarket.' },
      don("Not that one. The museum has a lot of maps. Most of them are useless. Like this one. Which is a map of a supermarket."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'tri.pm-d2', when: PM, turns: [
      don("Look for the logo. No logo, no good. Find a map with the logo, and the tip comes with it."),
      { beat: 'A waxwork pirate behind him slowly tips over and falls on the floor.' },
      don("Please don't break the pirates. We have to pay for the pirates."),
    ] },
  ],
  'task-start.any': [
    { id: 'tri.pm-s1', when: PM, turns: [
      { beat: '{a} and {b} burst into the museum. There are maps everywhere: in barrels, in chests, on the walls.' },
      { by: 'a', say: "You take the barrels. I'll take the chests." },
      { by: 'b', ...V("What am I looking for again?", "What am I looking for?", "Looking for what?", "What am I LOOKING for AGAIN?", "Sorry, what am I looking for again?", "What does treasure look like, roughly?") },
      { by: 'a', say: "The logo. The race logo. In the corner." },
    ] },
    { id: 'tri.pm-s2', when: PM, turns: [
      { by: 'b', say: "There must be a thousand maps in here." },
      { by: 'a', say: "Then we look at a thousand maps." },
      { by: 'b', say: "That's a lot of maps." },
    ] },
    { id: 'tri.pm-s3', when: PM, turns: [
      { beat: 'A waxwork pirate stands in the corner, one eye covered, holding a rolled-up map.' },
      { by: 'a', say: "Check his map. The pirate's map." },
      { by: 'b', say: "I'm not taking a map off a pirate. Even a wax one." },
    ] },
    { id: 'tri.pm-s4', when: PM, turns: [
      { by: 'a', say: "Think like a pirate. Where would a pirate hide a map?" },
      { by: 'b', say: "In a treasure chest?" },
      { by: 'a', say: "That's what everybody's thinking. Think like a clever pirate." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tri.pm-f1', when: PM, turns: [
      { beat: '{b} unrolls the third map {b.sub} touches. There, in the corner, is the logo.' },
      { by: 'b', ...V("Got it! Got it! Third map!", "Third map. Got it.", "Got it!", "GOT it! GOT it! THIRD MAP!", "I've got it! Only the third map!", "Treasure found! The third scroll!") },
      { by: 'a', say: "How? How did you do that so fast?" },
    ] },
    { id: 'tri.pm-f2', when: PM, turns: [
      { by: 'a', say: "Inside the ship's wheel. There's a map rolled up inside the ship's wheel." },
      { beat: 'It has the logo on it.' },
      { by: 'b', say: "You thought like a clever pirate." },
    ] },
    { id: 'tri.pm-f3', when: PM, turns: [
      { beat: '{a} and {b} work along a wall of maps, one unrolling, one checking, side by side.' },
      { by: 'b', say: "Logo! Top left! That's ours!" },
      { by: 'a', say: "We're very good at this. Why are we so good at this?" },
    ] },
    { id: 'tri.pm-f4', when: PM, turns: [
      { by: 'b', say: "This map's newer than the others. The paper's whiter." },
      { by: 'a', say: "Because it was made for the race last week. Open it." },
      { beat: 'It\'s got the logo. They\'re out of the museum before most teams are in it.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tri.pm-a1', when: PM, turns: [
      { beat: '{a} and {b} are surrounded by a pile of unrolled maps, none of them right.' },
      { by: 'b', say: "Stop unrolling them all the way. Just look at the corner." },
      { by: 'a', say: "Just the corner. Smart." },
      { beat: 'Corner by corner, they find it in two minutes.' },
    ] },
    { id: 'tri.pm-a2', when: PM, turns: [
      { by: 'a', ...V("We've checked the whole downstairs. It's upstairs. It has to be upstairs.", "It's upstairs.", "Upstairs.", "We've checked the WHOLE DOWNSTAIRS! It's UPSTAIRS! It HAS to be upstairs!", "We've checked all of downstairs. It must be upstairs.", "The treasure is above us. I feel it.") },
      { beat: 'It is upstairs, in a chest under a stuffed parrot.' },
      { by: 'b', say: "The parrot was guarding it." },
    ] },
    { id: 'tri.pm-a3', when: PM, turns: [
      { beat: 'Another team grabs the other end of the map {a} has just found.' },
      { by: 'a', say: "Let go! I found it first!" },
      { beat: '{a} pulls, the other team lets go, and {a} lands on {a.posAdj} back still holding the map. It has the logo.' },
    ] },
    { id: 'tri.pm-a4', when: PM, turns: [
      { by: 'b', say: "Every map in here has a skull on it. How is anybody supposed to find a logo among all these skulls?" },
      { by: 'a', say: "Look for the one that's not a skull." },
      { by: 'b', say: "That's the first useful thing you've said today." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'tri.pm-t1', when: PM, turns: [
      { beat: 'Team after team runs out of the museum, maps in hand. {a} and {b} are still searching.' },
      { by: 'a', say: "Everybody's found one. Where are they all finding them?" },
      { by: 'b', say: "Somewhere we're not looking. Look somewhere stupid." },
    ] },
    { id: 'tri.pm-t2', when: PM, turns: [
      { by: 'b', ...V("I'm seeing maps when I close my eyes.", "I see maps when I close my eyes.", "Maps everywhere.", "I'm SEEING MAPS when I CLOSE my EYES!", "I'm seeing maps even when I close my eyes now.", "Maps have entered my soul.") },
      { by: 'a', say: "Then open your eyes, and see the right one." },
      { by: 'b', say: "I'll try. But if I see one more skull, I'm screaming." },
    ] },
    { id: 'tri.pm-t3', when: PM, turns: [
      { beat: '{a} has climbed onto a display ship and is searching its cabin.' },
      { by: 'b', say: "Are you allowed up there?" },
      { by: 'a', say: "Nobody said I wasn't." },
    ] },
  ],
  'task-done.any': [
    { id: 'tri.pm-dn1', when: PM, turns: [
      { beat: '{a} and {b} run out of the museum holding the map up like a trophy.' },
      { by: 'b', say: "Jet skis! The tip says jet skis!" },
      { by: 'a', ...V("I've always wanted to drive a jet ski!", "I've always wanted a jet ski!", "Jet skis!", "I've ALWAYS wanted to drive a JET SKI!", "I've always, always wanted to drive a jet ski!", "Jet skis! Today I become a sea creature!") },
    ] },
    { id: 'tri.pm-dn2', when: PM, turns: [
      { by: 'a', say: "Don't lose the map. Whatever happens, don't lose the map." },
      { by: 'b', say: "I'm putting it down my shirt." },
      { by: 'a', say: "Then don't get your shirt wet." },
    ] },
    { id: 'tri.pm-dn3', when: PM, turns: [
      { beat: '{b} studies the map as they run. There is a big red X out in the water.' },
      { by: 'b', say: "X marks the spot. It actually says X marks the spot." },
      { by: 'a', say: "Pirates were never very original." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'tri.pm-x1', when: PM, turns: [
      { beat: '{a} unrolls a map triumphantly. It\'s a map of a different island entirely.' },
      { by: 'a', say: "No logo. Just an island." },
      { by: 'b', say: "Put it back and keep looking." },
    ] },
    { id: 'tri.pm-x2', when: PM, turns: [
      { beat: '{b} pulls a map out of a barrel, and the whole barrel tips over, maps everywhere.' },
      { by: 'b', ...V("Well, now they're all out.", "Now they're all out.", "All out now.", "WELL, now they're ALL OUT!", "Well, at least they're all out now.", "Behold, an organised mess.") },
      { by: 'a', say: "Check them all. Quickly." },
    ] },
    { id: 'tri.pm-x3', when: PM, turns: [
      { beat: 'The map {a} grabs is glued to the wall. It\'s part of an exhibit.' },
      { by: 'a', say: "It won't come off. Why won't it come off?" },
      { by: 'b', say: "Because it's in a frame. It's art. Leave the art." },
    ] },
  ],
};

// ── the jet skis ──
const jetSkis = {
  'ride.any': [
    { id: 'tri.js-r1', when: JS, turns: [
      { beat: '{a} and {b} roar across the bright blue water, spray flying off both sides.' },
      { by: 'b', ...V("This is the best thing we've done all race!", "Best thing all race!", "Best thing yet!", "This is the BEST thing we've done ALL RACE!", "This is honestly the best thing we've done all race!", "I'm a dolphin! A motorised dolphin!") },
      { by: 'a', say: "Hold on! Wave coming!" },
    ] },
    { id: 'tri.js-r2', when: JS, turns: [
      { by: 'a', say: "Which way are the islands?" },
      { by: 'b', say: "Follow the map. The X is past the two little islands." },
      { by: 'a', say: "Everything out here is little islands." },
    ] },
    { id: 'tri.js-r3', when: JS, turns: [
      { beat: 'A pod of dolphins swims alongside them for a while, leaping out of the water.' },
      { by: 'b', say: "Dolphins! Real dolphins! Racing us!" },
      { by: 'a', say: "And they're winning." },
    ] },
    { id: 'tri.js-r4', when: JS, turns: [
      { by: 'a', say: "Is the map still dry?" },
      { by: 'b', say: "Mostly. The bottom half's a bit soggy." },
      { by: 'a', say: "Is the X in the bottom half?" },
    ] },
  ],
  'travel-mishap.any': [
    { id: 'tri.js-m1', when: { ...JS, mishap: 'cant-steer' }, turns: [
      { beat: 'The jet ski goes round in a big slow circle, then another one.' },
      { by: 'b', say: "Why are we going in circles? Turn the handle!" },
      { by: 'a', say: "I am turning the handle! It doesn't like me!" },
      { beat: 'They swap. {b} steers them straight there, twenty minutes later than they should have been.' },
    ] },
    { id: 'tri.js-m2', when: { ...JS, mishap: 'runs-dry' }, turns: [
      { beat: 'The engine coughs, splutters, and goes quiet. The jet ski drifts.' },
      { by: 'a', say: "Is it out of fuel? How is it out of fuel?" },
      { by: 'b', ...V("Paddle! Paddle with your hands!", "Paddle with your hands!", "Paddle!", "PADDLE! PADDLE with your HANDS!", "Start paddling with your hands!", "Paddle like the ancient sailors!") },
      { beat: 'A rescue boat tows them the last stretch. It takes a while.' },
    ] },
  ],
};

// ── the doubloons (Botch or Watch) ──
const doubloons = {
  'don-demo.gag': [
    { id: 'tri.db-d1', when: DB, turns: [
      don("In this Botch or Watch, whoever is holding the tip dives into the underwater tunnels with the map, to find a bag of gold doubloons."),
      { beat: 'He holds up a scuba mask. He tries it on. It squashes his face, and his hair.' },
      don("Your air won't last forever. Run low, and you come back up for a new tank. Can somebody take this off? It's crushing my cheekbones."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'tri.db-d2', when: DB, turns: [
      don("Mask on, tank on, follow the map. The bag of doubloons is in there somewhere. Your partner waits in the boat."),
      don("Bring up the gold, and your next tip is yours. Real gold. Well. Chocolate gold. But it's very good chocolate."),
      { beat: 'He takes a bite out of a gold coin, to prove it. It is very good chocolate.' },
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'tri.db-w1', when: DB, turns: [
      { by: 'b', say: "You're holding the tip. It's you. That's the rule." },
      { by: 'a', ...V("I didn't know that was the rule when I picked it up!", "Didn't know that was the rule!", "Nobody told me!", "I DIDN'T KNOW that was the rule when I PICKED it UP!", "I didn't know that was the rule when I picked it up!", "I was tricked by paper!") },
      { by: 'b', say: "And that's why I let you hold it." },
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'tri.db-w2', when: DB, turns: [
      { by: 'a', say: "Give me the tip. I'll dive. I've done this on holiday." },
      { by: 'b', say: "You snorkelled once. In a hotel pool." },
      { by: 'a', say: "Same thing, but deeper." },
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'tri.db-w3', when: DB, turns: [
      { beat: '{b} quietly slips the tip into {a}\'s pocket before they reach the boat.' },
      { by: 'a', say: "Why is the tip in my pocket?" },
      { by: 'b', say: "Because you're the one holding it. Have a good dive." },
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'tri.db-w4', when: DB, turns: [
      { by: 'a', say: "'Who can hold their breath?' Under the water. It's diving." },
      { by: 'b', say: "Then it's you. You can hold your breath for ages." },
      { by: 'a', say: "That was a party trick. In a bath." },
    ] },
  ],
  'task-start.any': [
    { id: 'tri.db-s1', when: DB, turns: [
      { beat: '{a} sits on the edge of the boat in a mask and tank, looking down at the dark mouth of the tunnel.' },
      { by: 'a', say: "It's very dark in there." },
      { by: 'b', ...V("It's a tunnel. Tunnels are dark. That's what makes them tunnels.", "Tunnels are dark.", "It's a tunnel.", "It's a TUNNEL! Tunnels are DARK! That's what MAKES them tunnels!", "It's a tunnel, they're always dark.", "Darkness is a tunnel's whole personality.") },
      { by: 'a', say: "Thank you. Very helpful." },
    ] },
    { id: 'tri.db-s2', when: DB, turns: [
      { by: 'b', say: "Left, right, right, then the big cave. That's what the map says." },
      { by: 'a', say: "Left, right, right, big cave. Left, right, right, big cave." },
      { beat: '{a} rolls backwards off the boat and disappears.' },
    ] },
    { id: 'tri.db-s3', when: DB, turns: [
      { by: 'a', say: "How do I breathe in this thing again?" },
      { by: 'b', say: "Normally. Just breathe normally. Through your mouth." },
      { by: 'a', say: "Nothing about this is normal." },
    ] },
    { id: 'tri.db-s4', when: DB, turns: [
      { beat: '{a} puts on the mask, and {b} checks the straps three times.' },
      { by: 'b', say: "If you get scared, come straight up. Gold isn't worth it." },
      { by: 'a', say: "A million dollars is." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tri.db-f1', when: DB, turns: [
      { beat: 'Bubbles rise from the tunnel for a long time. Then {a} bursts out of the water holding a heavy bag.' },
      { by: 'a', ...V("Gold! I found the gold!", "Found the gold!", "Gold!", "GOLD! I FOUND the GOLD!", "I found it! I found the gold!", "Treasure! I am a pirate now!") },
      { by: 'b', say: "First go! You did it first go!" },
    ] },
    { id: 'tri.db-f2', when: DB, turns: [
      { by: 'b', say: "How was it? What was it like?" },
      { by: 'a', say: "Beautiful. Fish everywhere. Little blue ones. And then a big bag of gold." },
      { by: 'b', say: "That sounds like a dream." },
    ] },
    { id: 'tri.db-f3', when: DB, turns: [
      { beat: '{a} comes up with the doubloons and plenty of air left in the tank.' },
      { by: 'a', say: "I followed the map exactly. Left, right, right, big cave." },
      { by: 'b', say: "Exactly like I said. I'm a great map reader." },
    ] },
    { id: 'tri.db-f4', when: DB, turns: [
      { by: 'a', say: "There was a turtle. It showed me the way." },
      { by: 'b', say: "A turtle showed you the way?" },
      { by: 'a', say: "I followed it, and it went right to the gold. Best partner I've ever had. No offence." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tri.db-a1', when: DB, turns: [
      { beat: 'Second tank, second dive. This time {a} counts the turns out loud into the mask.' },
      { by: 'b', say: "I can hear you counting! Through the water! Keep counting!" },
      { beat: '{a} comes up with the bag, grinning around the mouthpiece.' },
    ] },
    { id: 'tri.db-a2', when: DB, turns: [
      { by: 'a', ...V("I went left at the first fork. It should have been right.", "Wrong fork. Should've been right.", "Wrong way at the fork.", "I went LEFT at the FIRST FORK! It SHOULD have been RIGHT!", "I took the wrong fork, it should have been right.", "The fork deceived me.") },
      { by: 'b', say: "Then right this time. Right, right, right." },
      { beat: 'Right, right, right, and the bag of gold is waiting in the big cave.' },
    ] },
    { id: 'tri.db-a3', when: DB, turns: [
      { beat: '{a} comes up gasping, the tank empty, and pulls on a fresh one without a word.' },
      { by: 'b', say: "Are you okay? Do you want to stop?" },
      { by: 'a', say: "I could see it. I could see the gold. I'm going back." },
    ] },
    { id: 'tri.db-a4', when: DB, turns: [
      { by: 'b', say: "Breathe slower. You're using all your air because you're panicking." },
      { by: 'a', say: "I'm not panicking." },
      { by: 'b', say: "Your bubbles are panicking." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'tri.db-t1', when: DB, turns: [
      { beat: '{a} is clinging to the side of the boat, mask pushed up, breathing hard.' },
      { by: 'a', say: "The tunnels are so small. The walls are so close." },
      { by: 'b', say: "Then don't look at the walls. Look at the light at the end." },
    ] },
    { id: 'tri.db-t2', when: DB, turns: [
      { by: 'b', ...V("How long have you been down there? You keep coming up.", "You keep coming up.", "Back up again?", "How LONG have you BEEN down there? You KEEP coming UP!", "You keep coming back up, how long have you been down?", "You've surfaced more than a whale today.") },
      { by: 'a', say: "Every time I get to the big cave, I forget which way is out." },
      { by: 'b', say: "Then on the way in, count the turns. On the way out, count them backwards." },
    ] },
    { id: 'tri.db-t3', when: DB, turns: [
      { beat: 'Other divers keep surfacing with their bags of gold. {a} keeps surfacing with nothing.' },
      { by: 'b', say: "There's still gold down there. There's still our gold." },
      { by: 'a', say: "There'd better be." },
    ] },
  ],
  'task-done.any': [
    { id: 'tri.db-dn1', when: DB, turns: [
      { beat: '{a} drops the bag of doubloons into the boat. It lands with a heavy, golden clunk.' },
      { by: 'b', say: "We're rich! We're pirate rich!" },
      { by: 'a', ...V("It's chocolate. Don said it was chocolate.", "It's chocolate.", "Chocolate gold.", "It's CHOCOLATE! Don SAID it was CHOCOLATE!", "It's chocolate, though. Don said it was chocolate.", "It's sweet treasure. Edible riches.") },
      { by: 'b', say: "Then we're chocolate rich." },
    ] },
    { id: 'tri.db-dn2', when: DB, turns: [
      { by: 'a', say: "The tip says the harbour. The Chill Zone's on the beach." },
      { by: 'b', say: "Then we're nearly done. Back to the jet ski." },
      { by: 'a', say: "I'm driving this time. I've earned it." },
    ] },
    { id: 'tri.db-dn3', when: DB, turns: [
      { beat: '{a} sits in the bottom of the boat, peeling off the mask, hair flat to {a.posAdj} head.' },
      { by: 'b', say: "You look like a drowned cat." },
      { by: 'a', say: "A drowned cat with gold." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'tri.db-x1', when: DB, turns: [
      { beat: '{a} surfaces, tank empty, holding nothing.' },
      { by: 'a', say: "Ran out. I ran out of air. I was so close." },
      { by: 'b', say: "New tank. Go again." },
    ] },
    { id: 'tri.db-x2', when: DB, turns: [
      { beat: 'The map floats up to the surface on its own, soggy, without {a}.' },
      { by: 'b', ...V("The map! The map's come up without you!", "The map's come up alone!", "The map! Alone!", "The MAP! The MAP'S come up WITHOUT you!", "The map's floated up without you!", "The map has escaped! Without its owner!") },
      { beat: '{a} surfaces a moment later, looking very lost.' },
    ] },
    { id: 'tri.db-x3', when: DB, turns: [
      { beat: '{a} comes up with a bag, opens it in the boat. It\'s full of seashells.' },
      { by: 'a', say: "Seashells. It's a decoy. There's a decoy bag." },
      { by: 'b', say: "Of course there's a decoy bag. Back down." },
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'tri.db-v1', when: DB, turns: [
      { beat: '{b} leans over the side of the boat, shouting at the bubbles.' },
      { by: 'b', say: "Go! Go! You've got this!" },
      { by: 'a', say: "Mmmph! Mmmph mmph!" },
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'tri.db-v2', when: DB, turns: [
      { beat: '{b} watches the bubbles, counting the seconds under {b.posAdj} breath.' },
      { by: 'b', say: "Why have the bubbles stopped? Have the bubbles stopped?" },
      { by: 'a', say: "I'm right here! I came up behind you!" },
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'tri.db-v3', when: DB, turns: [
      { beat: '{b} grabs a spare mask and jumps into the water to point the way.' },
      { by: 'a', say: "You're not allowed in! Get out!" },
      { beat: 'The boat captain hauls {b} back in by the collar. Thirty minutes.' },
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'tri.db-v4', when: DB, turns: [
      { beat: '{b} sits very still in the boat, eyes fixed on the water, holding the empty map case.' },
      { by: 'a', say: "Are you okay up there?" },
      { by: 'b', say: "I'm being calm for both of us." },
    ] },
  ],
  'helped-botch.any': [
    { id: 'tri.db-h1', when: DB, turns: [
      { beat: '{b} leans over the side and shouts directions down at the bubbles.' },
      { by: 'b', say: "Right! It's right! The big rock, then right!" },
      { by: 'a', say: "You're not supposed to help! And I can't hear you underwater!" },
    ] },
  ],
};

export default mergePools(place, museum, jetSkis, doubloons);
