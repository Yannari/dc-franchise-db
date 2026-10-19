// Skyline City's own lines (js/rr/places/skyline-finale.js), 1:1 with the real finale (the wiki's "A Million Ways to
// Lose a Million Dollars"), written in our own words: the drive in (traffic, a flat), 86 flights to the deck and the
// briefcase, the midpoint, the boathouse (the wrong one, after asking a candy-floss seller), the buoys and the
// combination, the run to the stage. Everything here is the last time: the last stairs, the last tip.
import { V, mergePools } from './_kit.js';

const P = { place: 'skyline-finale' };
const TS = { taskId: 'tower-stairs' };
const BU = { taskId: 'buoys' };
const FR = { taskId: 'footrace' };
const don = say => ({ by: 'don', say });

// ── the place: the finale ──
const place = {
  'don-opener.annoyed': [
    { id: 'sky.op1', when: P, turns: [
      { beat: 'Don stands on a rooftop high above Skyline City, in his very best suit.' },
      don("Welcome to Skyline City, home of the tallest buildings, the busiest streets, and the end of the Ridonculous Race!"),
      don("Our finalists have to drive themselves into the city, climb to the top of the skyscraper for a briefcase, and race to the park."),
      { beat: 'He straightens his tie and smiles into the camera.' },
      don("The last team to the midpoint Chill Zone is out. The first team to the final Chill Zone wins one million dollars. I've had this suit pressed for weeks."),
    ] },
    { id: 'sky.op2', when: P, turns: [
      don("This is it, everybody! The final leg of the Ridonculous Race!"),
      don("All around the world, all those legs, all those tips, all those very, very bad smells. And it all comes down to this."),
      { beat: 'A helicopter passes low overhead. Don\'s hair holds firm. He looks very proud of his hair.' },
      don("One team is going to be a million dollars richer by tonight. Let's find out who!"),
    ] },
  ],
  'don-opener.bored': [
    { id: 'sky.op3', when: P, turns: [
      { beat: 'Don is in a make-up chair on the rooftop, a stylist working on his hair, when the camera starts.' },
      don("Is that us? We're on? It's the finale. I need to look perfect. One more minute."),
      { beat: 'The stylist steps back. Don checks every angle in a hand mirror.' },
      don("Perfect. Welcome to Skyline City, everybody. The final leg starts now!"),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'sky.ar1', when: P, turns: [
      { beat: 'The plane comes in low over the skyline, and every finalist presses their face to the window.' },
      { by: 'a', ...V("This is it. The last place. The last leg.", "The last leg. This is it.", "This is it.", "This is IT! The LAST place! The LAST leg!", "This is really it. The last place, the last leg.", "The final city. The end of the map.") },
      { by: 'b', say: "We made it to the end. Whatever happens, we made it to the end." },
      { by: 'a', say: "Whatever happens, we're winning." },
    ] },
    { id: 'sky.ar2', when: P, turns: [
      { by: 'b', say: "Look at all those buildings. Somewhere out there is a million dollars." },
      { by: 'a', say: "Somewhere out there is a stage, and everybody we beat sitting in front of it." },
      { by: 'b', ...V("Let's give them something to watch.", "Let's give them a show.", "Give them a show.", "Let's GIVE them something to WATCH!", "Let's give them something worth watching.", "Let's give the bleachers a finale.") },
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'sky.ad1', when: P, turns: [
      { by: 'a', say: "I feel sick. I've felt sick since the plane took off." },
      { by: 'b', say: "That's the money. That's what a million dollars feels like before you've got it." },
      { by: 'a', say: "I don't like it. I'd like to feel it after." },
    ] },
    { id: 'sky.ad2', when: P, turns: [
      { beat: 'The traffic outside the airport is bumper to bumper as far as the eye can see.' },
      { by: 'b', say: "We have to drive in that?" },
      { by: 'a', ...V("We have to drive in that, to win a million dollars.", "For a million dollars, yes.", "For the money. Yes.", "We have to DRIVE in THAT, to win a MILLION DOLLARS!", "We have to drive in that, yes, to win a million dollars.", "We must brave the traffic for the treasure.") },
    ] },
  ],
};

// ── the drive in and the boathouse (travel mishaps) ──
const roads = {
  'travel-mishap.any': [
    { id: 'sky.tm1', when: { taskId: 'cab', mishap: 'traffic-jam' }, turns: [
      { beat: 'The taxi sits in a sea of cars that hasn\'t moved in ten minutes.' },
      { by: 'a', say: "Of all the days. The last day. And it's the worst traffic in the world." },
      { by: 'b', ...V("Lean on the horn. Everybody here leans on the horn.", "Lean on the horn.", "Use the horn.", "LEAN on the HORN! EVERYBODY here leans on the HORN!", "Just lean on the horn. Everybody else is doing it.", "Honk. Honk like you mean it. It's the local language.") },
      { beat: 'They lean on the horn. Nothing moves.' },
    ] },
    { id: 'sky.tm2', when: { taskId: 'cab', mishap: 'flat-tyre' }, turns: [
      { beat: 'Bang. The taxi lurches, and the steering wheel pulls hard to one side.' },
      { by: 'b', say: "Was that a tyre? Please don't tell me that was a tyre." },
      { by: 'a', say: "That was a tyre." },
      { by: 'b', say: "There's a subway entrance. Leave it. We run." },
    ] },
    { id: 'sky.tm3', when: { taskId: 'boathouse', mishap: 'wrong-boathouse' }, turns: [
      { by: 'a', say: "Excuse me! Which way to the boathouse?" },
      { beat: 'A candy-floss seller points confidently across the park. They run all the way there.' },
      { by: 'b', ...V("There are no boats here. This boathouse has no boats.", "This boathouse has no boats.", "No boats here.", "There are NO BOATS here! This boathouse has NO BOATS!", "There aren't any boats here, this boathouse has no boats.", "A boathouse without boats. Just a house.") },
      { by: 'a', say: "Never trust a man selling candy floss." },
    ] },
  ],
};

// ── 86 flights to the deck ──
const stairs = {
  'don-demo.gag': [
    { id: 'sky.ts-d1', when: TS, turns: [
      don("Teams must climb eighty-six flights of stairs to the observation deck, where a briefcase with their name on it is waiting, along with their next tip."),
      { beat: 'He looks up the stairwell. It goes up forever.' },
      don("I'll be taking the elevator. I'm the host. It's in my contract."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'sky.ts-d2', when: TS, turns: [
      don("Eighty-six flights. No elevator for racers. Both partners have to reach the top before the briefcase is theirs."),
      don("Some of our finalists did a tower on the very first day of this race. Let's see if they've learned anything."),
      { beat: 'He presses the elevator button and waits, whistling.' },
    ] },
  ],
  'task-start.any': [
    { id: 'sky.ts-s1', when: TS, turns: [
      { beat: '{a} and {b} burst through the stairwell door and look up.' },
      { by: 'a', say: "We started this race on a tower. We're finishing it on one." },
      { by: 'b', ...V("At least this time we know what's coming.", "At least we know what's coming.", "We know what's coming.", "At LEAST this time we KNOW what's COMING!", "At least this time we know exactly what's coming.", "This time, we're veterans of stairs.") },
    ] },
    { id: 'sky.ts-s2', when: TS, turns: [
      { by: 'b', say: "Eighty-six flights. Less than the first tower." },
      { by: 'a', say: "We're a lot more tired than we were on the first tower." },
      { by: 'b', say: "Don't do maths. Just climb." },
    ] },
    { id: 'sky.ts-s3', when: TS, turns: [
      { beat: '{a} stretches {a.posAdj} calves on the bottom step.' },
      { by: 'b', say: "We don't have time to stretch!" },
      { by: 'a', say: "We don't have time for a cramp either. Thirty seconds." },
    ] },
    { id: 'sky.ts-s4', when: TS, turns: [
      { by: 'a', say: "Last stairs of the whole race. After this, we never climb anything again." },
      { by: 'b', say: "I'm moving into a bungalow." },
      { by: 'a', say: "We're both moving into bungalows." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'sky.ts-f1', when: TS, turns: [
      { beat: '{a} and {b} climb in perfect step, never stopping, counting the flights out loud together.' },
      { by: 'b', say: "Eighty-four. Eighty-five." },
      { by: 'a', say: "Eighty-six! There it is! There's the briefcase!" },
    ] },
    { id: 'sky.ts-f2', when: TS, turns: [
      { by: 'a', ...V("We're flying up these. We're actually flying.", "We're flying up these.", "We're flying.", "We're FLYING up these! We're ACTUALLY flying!", "We're honestly flying up these stairs.", "We have become one with the stairs.") },
      { by: 'b', say: "A month of stairs and airports will do that to you." },
      { beat: 'They reach the deck together, and the briefcase with their name on it is waiting.' },
    ] },
    { id: 'sky.ts-f3', when: TS, turns: [
      { beat: '{a} takes the stairs two at a time, {b} right behind, neither of them saying a word the whole way up.' },
      { by: 'b', say: "That's the fastest we've ever done anything." },
      { by: 'a', say: "That's what a million dollars does." },
    ] },
    { id: 'sky.ts-f4', when: TS, turns: [
      { by: 'b', say: "Remember the first day? I had to stop every ten flights." },
      { by: 'a', say: "And now?" },
      { by: 'b', say: "Now I'm not stopping until there's a cheque in my hand." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'sky.ts-a1', when: TS, turns: [
      { beat: '{b} grabs {b.posAdj} leg on the landing, face twisted. Cramp.' },
      { by: 'b', say: "Banana. Do we have a banana? I packed a banana for exactly this." },
      { by: 'a', ...V("It's black. It's completely black.", "It's black.", "Black banana.", "It's BLACK! It's COMPLETELY BLACK!", "That banana is completely black, though.", "That banana has seen things.") },
      { by: 'b', say: "Give it to me." },
    ] },
    { id: 'sky.ts-a2', when: TS, turns: [
      { by: 'a', say: "I need ten seconds. Ten seconds and then I'm fine." },
      { by: 'b', say: "Ten seconds. Then we go." },
      { beat: 'Ten seconds become thirty. Then they go, slower, but they go.' },
    ] },
    { id: 'sky.ts-a3', when: TS, turns: [
      { beat: '{a} sits down on a step halfway up, completely out of breath.' },
      { by: 'b', say: "Get up. We didn't come all the way round the world to sit on a step." },
      { by: 'a', say: "This is a very nice step. I've earned this step." },
      { by: 'b', say: "You've earned a million dollars. Get up." },
    ] },
    { id: 'sky.ts-a4', when: TS, turns: [
      { by: 'a', say: "What floor is this? Why is there never a number?" },
      { by: 'b', say: "There's a number. It says fifty-one." },
      { by: 'a', say: "Fifty-one. That's more than half. That's practically the top." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'sky.ts-t1', when: TS, turns: [
      { beat: 'Another team\'s footsteps echo from above. They are a long way ahead.' },
      { by: 'b', say: "They're ahead. They're way ahead." },
      { by: 'a', say: "They have to get down again too. It's not over at the top." },
    ] },
    { id: 'sky.ts-t2', when: TS, turns: [
      { by: 'a', ...V("My legs have stopped working. They've done their last stairs.", "My legs have stopped.", "Legs are done.", "My LEGS have STOPPED working! They've DONE their LAST stairs!", "My legs have stopped working. They've done all the stairs they're ever going to do.", "My legs have retired. They want a party.") },
      { by: 'b', say: "Then hold on to my bag, and I'll pull you." },
      { by: 'a', say: "Pull, then. I'm not proud. Pull me up." },
    ] },
    { id: 'sky.ts-t3', when: TS, turns: [
      { beat: '{a} and {b} are climbing in silence, one hand each on the rail, very, very slowly.' },
      { by: 'b', say: "Talk to me. Say anything. Tell me what you'll buy." },
      { by: 'a', say: "A lift. I'm going to buy a lift for my house." },
    ] },
  ],
  'task-done.any': [
    { id: 'sky.ts-dn1', when: TS, turns: [
      { beat: '{a} and {b} burst out onto the observation deck. The whole city spreads out below them.' },
      { by: 'b', say: "There's our briefcase. It's got our names on it." },
      { by: 'a', ...V("The tip says the park. The midpoint. If we're last, we're out.", "The park. The midpoint. Last is out.", "Park. Midpoint. Don't be last.", "The tip says the PARK! The MIDPOINT! If we're LAST, we're OUT!", "The tip says the park, the midpoint. If we're last there, we're out.", "To the park. Last one there goes home.") },
    ] },
    { id: 'sky.ts-dn2', when: TS, turns: [
      { by: 'a', say: "The briefcase is locked." },
      { by: 'b', say: "Of course it's locked. Nothing on this show opens the first time." },
      { by: 'a', say: "Then we take it with us. Run." },
    ] },
    { id: 'sky.ts-dn3', when: TS, turns: [
      { beat: '{a} grabs the briefcase and hugs it to {a.posAdj} chest.' },
      { by: 'b', say: "Don't get attached to it. It's not the money." },
      { by: 'a', say: "It's money-adjacent. I'm attached." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'sky.ts-x1', when: TS, turns: [
      { beat: '{a} reaches the deck alone. {b} is still three floors down.' },
      { by: 'a', say: "Come on! It won't give me the briefcase without you!" },
      { by: 'b', say: "I'm coming! I'm coming! Stop shouting at me while I'm coming!" },
    ] },
    { id: 'sky.ts-x2', when: TS, turns: [
      { beat: '{a} and {b} come out on the wrong floor, a quiet office full of very confused people.' },
      { by: 'b', say: "This isn't the deck. This is accounts." },
      { by: 'a', say: "Sorry. Sorry, everyone. Back to the stairs." },
    ] },
    { id: 'sky.ts-x3', when: TS, turns: [
      { by: 'a', say: "I can't. I have to stop. Just for a minute." },
      { beat: '{a} sits on the stairs, head between {a.posAdj} knees, while the minutes tick by.' },
      { by: 'b', say: "Take your minute. But it's the last minute you get." },
    ] },
  ],
};

// ── the buoys and the combination ──
const buoys = {
  'don-demo.gag': [
    { id: 'sky.bu-d1', when: BU, turns: [
      don("Teams must row out to the middle of the lake, where these buoys are floating. Some of them hold the numbers that open your briefcase."),
      { beat: 'He leans over the edge of a rowing boat to point at a buoy, and the boat tips him straight into the lake.' },
      don("And the water is... very refreshing. Somebody pull me out. My suit is ruined. My finale suit!"),
    ] },
  ],
  'don-demo.dry': [
    { id: 'sky.bu-d2', when: BU, turns: [
      don("Row out, find the buoys with your numbers, and open your briefcase. Wrong combination? Back out on the water."),
      don("Inside that briefcase are directions to the final Chill Zone, and whoever gets there first wins a million dollars."),
      { beat: 'He pats the side of a rowing boat, very carefully, from a safe distance.' },
    ] },
  ],
  'task-start.any': [
    { id: 'sky.bu-s1', when: BU, turns: [
      { beat: '{a} and {b} throw the briefcase into a rowing boat and push off from the dock.' },
      { by: 'a', say: "You row, I'll look." },
      { by: 'b', ...V("Why do I always row?", "Why do I always row?", "Why am I rowing?", "Why do I ALWAYS ROW?", "Why is it always me rowing?", "Am I the engine of this team?") },
      { by: 'a', say: "Because you're the strong one, and I'm the one who can read numbers." },
    ] },
    { id: 'sky.bu-s2', when: BU, turns: [
      { by: 'b', say: "There are hundreds of them. How do we know which buoys are ours?" },
      { by: 'a', say: "Ours will have a number that fits. We check them all if we have to." },
      { by: 'b', say: "All of them? In a rowing boat?" },
    ] },
    { id: 'sky.bu-s3', when: BU, turns: [
      { beat: 'The lake is calm, the city all around it, and the buoys bob gently in the sun.' },
      { by: 'a', say: "It's so peaceful out here." },
      { by: 'b', say: "It's the least peaceful moment of my life. Row." },
    ] },
    { id: 'sky.bu-s4', when: BU, turns: [
      { by: 'b', say: "Three numbers, and a million dollars. Three numbers." },
      { by: 'a', say: "Don't say a million dollars. My hands start shaking when you say a million dollars." },
      { by: 'b', say: "Okay. Okay. I won't say it. Row." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'sky.bu-f1', when: BU, turns: [
      { beat: '{a} spots the first buoy straight away, then the second, then the third.' },
      { by: 'a', say: "Seven, three, nine. Try it. Try it now." },
      { beat: 'The briefcase clicks open first time.' },
      { by: 'b', ...V("It's open! It's open!", "It's open!", "Open!", "It's OPEN! It's OPEN!", "It's open, it's actually open!", "It has opened! The briefcase has spoken!") },
    ] },
    { id: 'sky.bu-f2', when: BU, turns: [
      { by: 'b', say: "That one! And that one! And there's the last one, by the bridge!" },
      { by: 'a', say: "You've got eyes like an eagle." },
      { by: 'b', say: "I've got eyes like somebody who wants a million dollars." },
    ] },
    { id: 'sky.bu-f3', when: BU, turns: [
      { beat: '{a} and {b} row in a straight line through the buoys, reading each one aloud as they pass.' },
      { by: 'a', say: "Got them. Got all three." },
      { by: 'b', say: "Don't jinx it. Open it first. Then celebrate." },
    ] },
    { id: 'sky.bu-f4', when: BU, turns: [
      { by: 'a', say: "Our numbers are on the buoys by the fountain. I saw them from the bridge on the way in." },
      { by: 'b', say: "You were looking at buoys on the way in?" },
      { by: 'a', say: "I was looking at everything. It's the finale." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'sky.bu-a1', when: BU, turns: [
      { beat: 'The lock won\'t open. {a} spins the numbers again with shaking fingers.' },
      { by: 'b', say: "We've got one wrong. We must have one wrong." },
      { by: 'a', say: "It's the six. I bet it's a nine upside down." },
      { beat: 'It is a nine upside down. The briefcase opens.' },
    ] },
    { id: 'sky.bu-a2', when: BU, turns: [
      { by: 'b', say: "Back out. We missed one. There's one we didn't check by the reeds." },
      { by: 'a', ...V("My arms are going to fall off.", "My arms will fall off.", "Arms. Falling off.", "My ARMS are going to FALL OFF!", "My arms are honestly going to fall off.", "My arms are writing their resignation letter.") },
      { by: 'b', say: "They can fall off on the stage." },
    ] },
    { id: 'sky.bu-a3', when: BU, turns: [
      { by: 'a', say: "Read me the numbers again. Slowly." },
      { by: 'b', say: "Two. Five. Eight." },
      { beat: 'This time, with every number read twice, the lock opens.' },
    ] },
    { id: 'sky.bu-a4', when: BU, turns: [
      { beat: '{a} and {b} have rowed round the whole lake twice.' },
      { by: 'b', say: "We've seen every buoy on this lake." },
      { by: 'a', say: "Then we've seen ours. We just need to remember which ones they were." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'sky.bu-t1', when: BU, turns: [
      { beat: 'Another team\'s briefcase clicks open across the water, and they start rowing for the shore.' },
      { by: 'a', say: "No. No, no, no. They've got it. They've got theirs open." },
      { by: 'b', say: "Then they've still got to run. Keep looking." },
    ] },
    { id: 'sky.bu-t2', when: BU, turns: [
      { by: 'b', say: "We're going round in circles." },
      { by: 'a', ...V("Because you keep rowing with one arm harder than the other.", "You row with one arm harder.", "One arm's stronger.", "Because you keep ROWING with ONE ARM HARDER than the OTHER!", "That's because you keep rowing harder with one arm.", "Your left arm is ambitious. Your right arm isn't.") },
      { by: 'b', say: "My left arm is very tired." },
    ] },
    { id: 'sky.bu-t3', when: BU, turns: [
      { beat: 'The sun is going down over the lake, and the numbers on the buoys are getting harder to read.' },
      { by: 'a', say: "I can't see. Get closer. Closer!" },
      { by: 'b', say: "Any closer and we're in the lake." },
    ] },
  ],
  'task-done.any': [
    { id: 'sky.bu-dn1', when: BU, turns: [
      { beat: 'The briefcase clicks open. Inside is a single tip.' },
      { by: 'a', ...V("The final Chill Zone. The stage. In the park.", "The stage. In the park.", "The stage.", "The FINAL Chill Zone! The STAGE! In the PARK!", "It says the final Chill Zone, the stage in the park.", "The stage. The end. The money.") },
      { by: 'b', say: "Then we row like we've never rowed." },
    ] },
    { id: 'sky.bu-dn2', when: BU, turns: [
      { by: 'b', say: "This is it. This tip is the last tip." },
      { by: 'a', say: "Read it. Read it out loud. I want to hear it." },
      { by: 'b', say: "Run to the stage. First team there wins." },
    ] },
    { id: 'sky.bu-dn3', when: BU, turns: [
      { beat: '{a} and {b} jump out of the boat before it even reaches the dock and wade the last few metres.' },
      { by: 'a', say: "My shoes! I don't care about my shoes! Run!" },
      { by: 'b', say: "I'm running! I'm running in wet shoes!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'sky.bu-x1', when: BU, turns: [
      { beat: '{a} enters the numbers. The lock does nothing.' },
      { by: 'b', say: "No. Which one's wrong? Which one?" },
      { by: 'a', say: "I don't know. Back out. We check them all again." },
    ] },
    { id: 'sky.bu-x2', when: BU, turns: [
      { beat: 'The oar slips out of {b}\'s hands and floats away across the lake.' },
      { by: 'b', ...V("The oar! The oar's getting away!", "The oar's getting away!", "Oar! Going!", "The OAR! The OAR'S getting AWAY!", "The oar! It's getting away from us!", "The oar has escaped! It wants freedom!") },
      { by: 'a', say: "Paddle with your hands! Paddle with anything!" },
    ] },
    { id: 'sky.bu-x3', when: BU, turns: [
      { by: 'a', say: "Is this a three or an eight? It's all smudged." },
      { by: 'b', say: "Try both. Try both, quickly." },
      { beat: 'Neither works. They row on to the next buoy.' },
    ] },
  ],
};

// ── the run to the stage ──
const footrace = {
  'task-start.any': [
    { id: 'sky.fr-s1', when: FR, turns: [
      { beat: '{a} and {b} hit the park path at a sprint. Somewhere ahead, a crowd is cheering.' },
      { by: 'a', say: "Can you hear that? That's the bleachers. That's everybody." },
      { by: 'b', say: "Then run towards the noise. Run!" },
    ] },
    { id: 'sky.fr-s2', when: FR, turns: [
      { by: 'b', say: "Don't stop. Whatever happens, don't stop running." },
      { by: 'a', ...V("I won't stop. I'll never stop. I'll be running in my sleep for a year.", "I won't stop.", "Not stopping.", "I WON'T stop! I'll NEVER stop!", "I won't stop. I'll probably be running in my sleep for a year.", "I'll run until the end of time. Or the stage.") },
      { by: 'b', say: "Good. Neither will I. Go!" },
    ] },
  ],
  'task-done.any': [
    { id: 'sky.fr-dn1', when: FR, turns: [
      { beat: 'The stage comes into view. Every team they ever raced against is in the bleachers, on their feet.' },
      { by: 'b', say: "There it is. There it is!" },
      { by: 'a', say: "Hold my hand. We step on together." },
    ] },
    { id: 'sky.fr-dn2', when: FR, turns: [
      { by: 'a', say: "Everybody's here. All of them." },
      { by: 'b', say: "Wave. Wave at everybody. Then run faster." },
      { by: 'a', say: "Faster than I've ever run in my life." },
    ] },
  ],
};

export default mergePools(place, roads, stairs, buoys, footrace);
