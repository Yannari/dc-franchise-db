// Treasure Isles, second batch of challenge lines. Same rules as places/treasure-isles.js: a dives for the
// doubloons, b waits in the boat.
import { V, mergePools } from '../_kit.js';

const PM = { taskId: 'pirate-map' };
const JS = { taskId: 'jet-ski' };
const DB = { taskId: 'doubloons' };

const museum = {
  'task-start.any': [
    { id: 'tri2.pm-s1', when: PM, turns: [
      { beat: 'A recorded pirate voice booms through the museum: "Arrr, welcome, landlubbers!"' },
      { by: 'b', say: "That made me jump out of my skin." },
      { by: 'a', say: "Come on. Find the map." },
      { by: 'b', say: "Okay. Looking." },
    ] },
    { id: 'tri2.pm-s2', when: PM, turns: [
      { by: 'a', say: "Split up. You do the ship. I'll do the cannons." },
      { by: 'b', say: "There's a ship? Inside the museum?" },
      { by: 'a', say: "Half a ship. Go." },
    ] },
    { id: 'tri2.pm-s3', when: PM, turns: [
      { beat: '{b} opens a treasure chest. It\'s full to the top with rolled-up maps.' },
      { by: 'b', say: "Why are there so many maps?" },
      { by: 'a', say: "Just look at the corners. Quick." },
    ] },
    { id: 'tri2.pm-s4', when: PM, turns: [
      { by: 'a', say: "Gently. Some of these are really old. Don't tear any." },
      { by: 'b', say: "We're on a race. I'm going to tear some." },
      { by: 'a', say: "Just be careful." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tri2.pm-f1', when: PM, turns: [
      { beat: '{a} pulls a map out of a waxwork pirate\'s boot. The logo is right in the middle.' },
      { by: 'a', say: "His boot! It was in his boot!" },
      { by: 'b', say: "How did you think of that?" },
      { by: 'a', say: "I don't know. It looked like something was in there." },
    ] },
    { id: 'tri2.pm-f2', when: PM, turns: [
      { by: 'b', say: "This one's tied with a ribbon. None of the others have ribbons." },
      { beat: '{b} pulls the ribbon. The map unrolls, and there\'s the logo.' },
      { by: 'a', say: "The ribbon! That's it!" },
    ] },
    { id: 'tri2.pm-f3', when: PM, turns: [
      { beat: '{a} and {b} grab the same map from opposite ends of a barrel, and look at each other.' },
      { by: 'a', say: "Is it?" },
      { by: 'b', say: "It is! It's got the logo!" },
      { by: 'a', say: "Yes! Let's go!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tri2.pm-a1', when: PM, turns: [
      { by: 'b', say: "We keep picking the big maps. Try the little ones." },
      { by: 'a', say: "The little ones look like nothing." },
      { by: 'b', say: "That's why nobody's checking them." },
      { beat: 'The fourth little map has the logo.' },
    ] },
    { id: 'tri2.pm-a2', when: PM, turns: [
      { beat: '{a} stops in the middle of the room and reads a sign on the wall out loud.' },
      { by: 'a', say: "'The captain kept his finest map close to his heart.'" },
      { by: 'b', say: "The captain! Which one's the captain?" },
      { beat: 'The waxwork captain has a map tucked inside his coat. It has the logo.' },
    ] },
    { id: 'tri2.pm-a3', when: PM, turns: [
      { by: 'a', ...V("We've checked this barrel twice. Stop checking this barrel.", "We've done this barrel.", "Done it. Twice.", "We've checked this barrel TWICE! STOP checking it!", "We've checked this barrel twice already, so let's stop.", "This barrel has told us everything it knows.") },
      { by: 'b', say: "Then where?" },
      { by: 'a', say: "Anywhere we haven't been. Up the stairs. Go." },
      { beat: 'At the top of the stairs, the first map they open is the right one.' },
    ] },
    { id: 'tri2.pm-a4', when: PM, turns: [
      { beat: 'A museum guard coughs and nods at a cannon.' },
      { by: 'b', say: "Is he helping us? I think he's helping us." },
      { by: 'a', say: "Check the cannon." },
      { beat: 'A map is rolled up inside the barrel of the cannon.' },
    ] },
  ],
  'task-done.any': [
    { id: 'tri2.pm-dn1', when: PM, turns: [
      { by: 'b', say: "We've left the museum in a terrible state." },
      { by: 'a', say: "Somebody's going to have to clean that up." },
      { by: 'b', say: "Not us. Come on." },
    ] },
    { id: 'tri2.pm-dn2', when: PM, turns: [
      { beat: '{a} and {b} sprint out of the museum and down to the jetty, where the jet skis bob in a row.' },
      { by: 'a', say: "I'm driving." },
      { by: 'b', say: "You've never driven one." },
      { by: 'a', say: "How hard can it be?" },
    ] },
    { id: 'tri2.pm-dn3', when: PM, turns: [
      { by: 'a', say: "Hold the map up. Let me look at it." },
      { by: 'b', say: "It's a sea, some islands and an X." },
      { by: 'a', say: "That's all I need to know." },
    ] },
    { id: 'tri2.pm-dn4', when: PM, turns: [
      { beat: 'The recorded pirate voice booms one last time as they leave: "Farewell, landlubbers!"' },
      { by: 'b', say: "Bye, pirate." },
      { by: 'a', say: "Don't talk back to it. Run." },
    ] },
    { id: 'tri2.pm-dn5', when: PM, turns: [
      { by: 'b', say: "I've got dust in my eyes." },
      { by: 'a', say: "Me too. Keep running." },
      { by: 'b', say: "I can't see anything." },
    ] },
  ],
};

const jetSki = {
  'ride.any': [
    { id: 'tri2.js-r1', when: JS, turns: [
      { beat: 'The jet ski hits a wave and leaves the water completely for a second.' },
      { by: 'b', say: "Whoa! Hold on!" },
      { by: 'a', say: "I'm holding on!" },
    ] },
    { id: 'tri2.js-r2', when: JS, turns: [
      { by: 'a', say: "Is that our island, or that one?" },
      { by: 'b', say: "The one with the palm tree." },
      { by: 'a', say: "They all have palm trees!" },
    ] },
    { id: 'tri2.js-r3', when: JS, turns: [
      { beat: 'Another team\'s jet ski races past, soaking {a} and {b} with its spray.' },
      { by: 'b', say: "They did that on purpose!" },
      { by: 'a', say: "Then let's do it back. Hold on." },
    ] },
    { id: 'tri2.js-r4', when: JS, turns: [
      { by: 'b', say: "The water's so clear. I can see the bottom." },
      { by: 'a', say: "Don't look at the bottom. Look at where we're going." },
      { by: 'b', say: "Is that a shark? No, it's a rock." },
    ] },
  ],
};

const doubloons = {
  'task-start.any': [
    { id: 'tri2.db-s1', when: DB, turns: [
      { by: 'b', say: "Thumbs up means you're okay. Thumbs down means you're not." },
      { by: 'a', say: "And what does this mean?" },
      { beat: '{a} wobbles one hand from side to side.' },
      { by: 'b', say: "That means come up. Okay?" },
    ] },
    { id: 'tri2.db-s2', when: DB, turns: [
      { beat: '{a} sits on the side of the boat, flippers on, looking at the water.' },
      { by: 'a', say: "How deep is it?" },
      { by: 'b', say: "Not that deep. You'll be fine." },
      { by: 'a', say: "Okay. I'm going." },
    ] },
    { id: 'tri2.db-s3', when: DB, turns: [
      { by: 'a', say: "Say the turns one more time." },
      { by: 'b', say: "Left, right, right, big cave." },
      { by: 'a', say: "Left, right, right, big cave. Okay. Okay. I'm going." },
      { beat: '{a} goes over the side backwards with a big splash.' },
    ] },
    { id: 'tri2.db-s4', when: DB, turns: [
      { beat: 'A fish swims right up to {a}\'s mask before {a.sub} is even under.' },
      { by: 'a', say: "There's a fish looking at me." },
      { by: 'b', say: "It's fine. Go." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'tri2.db-f1', when: DB, turns: [
      { beat: '{b} watches the bubbles move along under the water, turn, turn again, and stop.' },
      { by: 'b', say: "Come on. Come on. Come on." },
      { beat: '{a} bursts up through the surface holding the bag of doubloons over {a.posAdj} head.' },
      { by: 'b', say: "YES! Get in the boat!" },
    ] },
    { id: 'tri2.db-f2', when: DB, turns: [
      { by: 'a', say: "It was easy. It was so easy. The cave was right where you said." },
      { by: 'b', say: "I did say it, didn't I?" },
      { by: 'a', say: "You did." },
    ] },
    { id: 'tri2.db-f3', when: DB, turns: [
      { beat: '{a} comes up with the gold and a big piece of seaweed stuck to {a.posAdj} head.' },
      { by: 'b', say: "You've got seaweed on your head." },
      { by: 'a', say: "I don't care. I've got the gold." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'tri2.db-a1', when: DB, turns: [
      { by: 'a', say: "There's two big caves. Nobody said there were two big caves." },
      { by: 'b', say: "Then it's the other one. The one you didn't go in." },
      { beat: 'Back down, into the other big cave. The bag of doubloons is sitting on a rock.' },
    ] },
    { id: 'tri2.db-a2', when: DB, turns: [
      { beat: '{a} surfaces next to the boat and pulls off the mask, breathing hard.' },
      { by: 'a', say: "The mask keeps fogging up. I can't see a thing." },
      { by: 'b', say: "Spit in it. Divers spit in the mask." },
      { by: 'a', say: "Gross. Okay." },
      { beat: '{a} spits in the mask. On the next dive, {a.sub} can see the gold.' },
    ] },
    { id: 'tri2.db-a3', when: DB, turns: [
      { by: 'b', ...V("Slow down in there. You're swimming like you're late for something.", "Slow down in there.", "Slower.", "SLOW down! You're swimming like you're LATE!", "You need to slow down a little in there.", "Swim like a turtle, not like a dropped phone.") },
      { by: 'a', say: "I'm nervous! I can't help it!" },
      { beat: 'Swimming slowly, {a} finds every turn, and the gold.' },
    ] },
    { id: 'tri2.db-a4', when: DB, turns: [
      { beat: '{a} sits on the edge of the boat with a fresh tank, eyes shut, breathing slowly.' },
      { by: 'b', say: "What are you doing?" },
      { by: 'a', say: "Swimming it in my head first." },
      { beat: 'Second time round, the real swim goes exactly like the one in {a.posAdj} head.' },
    ] },
  ],
  'task-done.any': [
    { id: 'tri2.db-dn1', when: DB, turns: [
      { by: 'b', say: "Can we open the bag? Just to see?" },
      { by: 'a', say: "It's chocolate. Gold-wrapped chocolate." },
      { by: 'b', say: "Then can we eat it?" },
      { by: 'a', say: "Not until we're on the beach." },
    ] },
    { id: 'tri2.db-dn2', when: DB, turns: [
      { beat: '{b} hauls {a} into the boat by the back of the wetsuit.' },
      { by: 'a', say: "Thank you. My legs are so tired." },
      { by: 'b', say: "Sit down. I'll drive." },
    ] },
    { id: 'tri2.db-dn3', when: DB, turns: [
      { by: 'a', say: "There was a whole world down there. I'd go back. Not today, though." },
      { by: 'b', say: "Not today. Today you go to the beach." },
      { by: 'a', say: "The beach. Yes. The beach is a good idea." },
    ] },
    { id: 'tri2.db-dn4', when: DB, turns: [
      { beat: '{a} holds up the bag of doubloons and shakes it. It jingles.' },
      { by: 'a', say: "We found pirate treasure." },
      { by: 'b', say: "Chocolate pirate treasure." },
      { by: 'a', say: "Still counts." },
    ] },
    { id: 'tri2.db-dn5', when: DB, turns: [
      { by: 'b', say: "I was so worried. You were down there for ages." },
      { by: 'a', say: "Were you really worried?" },
      { by: 'b', say: "So worried. I'm so glad you're okay." },
    ] },
  ],
};

export default mergePools(museum, jetSki, doubloons);
