// Iron Tower City, second batch of challenge lines. Same rules as places/iron-tower-city.js: a draws the
// caricature, b poses.
import { V, mergePools } from '../_kit.js';

const CA = { taskId: 'caricature' };
const CT = { taskId: 'catacombs' };
const CR = { taskId: 'cheese-raft' };

const caricature = {
  'task-start.any': [
    { id: 'itc2.ca-s1', when: CA, turns: [
      { beat: '{b} sits very straight on the stool and pulls a serious, noble face.' },
      { by: 'a', say: "What's that face?" },
      { by: 'b', say: "My portrait face. For history." },
      { by: 'a', say: "It's a cartoon. History doesn't want it." },
    ] },
    { id: 'itc2.ca-s2', when: CA, turns: [
      { by: 'a', say: "I can't draw. You know I can't draw." },
      { by: 'b', say: "That's good. A bad drawing is a caricature." },
      { by: 'a', say: "Then I'm about to be brilliant." },
    ] },
    { id: 'itc2.ca-s3', when: CA, turns: [
      { beat: 'The artist leans over {a}\'s shoulder before {a.sub} has drawn a single line.' },
      { by: 'a', ...V("Can you not watch? I can't draw when people watch.", "Please don't watch.", "Don't watch.", "Can you NOT watch? I CAN'T draw when people WATCH!", "Would you mind not watching? I can't draw when people watch.", "My art is shy. It needs privacy.") },
      { by: 'b', say: "That's the judge. The judge has to watch." },
    ] },
    { id: 'itc2.ca-s4', when: CA, turns: [
      { by: 'b', say: "Whatever you draw, I'm going to love it." },
      { by: 'a', say: "Really?" },
      { by: 'b', say: "No. But I'll say I do." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'itc2.ca-f1', when: CA, turns: [
      { beat: '{a} draws a head the shape of an egg, with {b}\'s hair piled on top like a bird\'s nest.' },
      { by: 'b', say: "My hair doesn't look like that." },
      { by: 'a', say: "It does from up here." },
      { beat: 'The artist nods once and stamps it.' },
    ] },
    { id: 'itc2.ca-f2', when: CA, turns: [
      { by: 'a', say: "Smile. Bigger. Bigger. Show me every tooth." },
      { beat: '{a} draws every tooth, all of them the size of piano keys. The artist claps.' },
      { by: 'b', say: "I look like a horse." },
      { by: 'a', say: "A happy horse." },
    ] },
    { id: 'itc2.ca-f3', when: CA, turns: [
      { beat: 'The artist holds the drawing up next to {b}\'s face and laughs so hard he has to sit down.' },
      { by: 'b', say: "Is it that funny?" },
      { by: 'a', say: "It's that good. Thank you for having such a funny face." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'itc2.ca-a1', when: CA, turns: [
      { by: 'b', say: "Make my ears big. Really big. I don't care any more." },
      { by: 'a', say: "Are you sure?" },
      { by: 'b', say: "We've been here an hour. Make them enormous." },
      { beat: 'Enormous ears, and the artist finally smiles.' },
    ] },
    { id: 'itc2.ca-a2', when: CA, turns: [
      { beat: '{a} looks at the other teams\' drawings pinned up on the easels nearby.' },
      { by: 'a', say: "Theirs are all terrible. Really, really terrible." },
      { by: 'b', say: "And they passed?" },
      { by: 'a', say: "Then I have to draw worse." },
      { beat: 'Drawing worse works.' },
    ] },
    { id: 'itc2.ca-a3', when: CA, turns: [
      { by: 'a', ...V("Pull a face. Any face. I'll draw the face you pull.", "Pull a face.", "Face. Now.", "PULL a FACE! ANY face!", "Just pull a face, any face, and I'll draw it.", "Make your face do something it's never done.") },
      { beat: '{b} pulls a cross-eyed, tongue-out face. {a} draws it exactly.' },
      { by: 'b', say: "Did it pass?" },
      { by: 'a', say: "It passed. You're famous now." },
    ] },
    { id: 'itc2.ca-a4', when: CA, turns: [
      { beat: 'The artist takes the charcoal from {a} and draws one huge circle in the air, then hands it back.' },
      { by: 'a', say: "Bigger. He wants everything bigger." },
      { by: 'b', say: "Then make my head the size of the page." },
      { beat: 'A head the size of the page passes.' },
    ] },
  ],
  'task-done.any': [
    { id: 'itc2.ca-dn1', when: CA, turns: [
      { by: 'b', say: "Let me see it. Let me see what you did to me." },
      { beat: '{a} turns the drawing round. {b} stares at it for a long time.' },
      { by: 'b', say: "I'm framing this. And then I'm hiding it." },
    ] },
    { id: 'itc2.ca-dn2', when: CA, turns: [
      { by: 'a', say: "Do you forgive me?" },
      { by: 'b', say: "For the chin?" },
      { by: 'a', say: "For the chin." },
      { by: 'b', say: "Never. Let's go." },
    ] },
    { id: 'itc2.ca-dn3', when: CA, turns: [
      { beat: 'A small crowd of tourists has gathered behind the easel. They clap as {a} and {b} leave.' },
      { by: 'a', say: "They liked it!" },
      { by: 'b', say: "They liked laughing at me." },
    ] },
    { id: 'itc2.ca-dn4', when: CA, turns: [
      { by: 'b', say: "My turn next time. I'm going to draw you." },
      { by: 'a', say: "Be kind." },
      { by: 'b', say: "I'm going to give you a nose like a parsnip." },
    ] },
    { id: 'itc2.ca-dn5', when: CA, turns: [
      { beat: '{a} rolls up the drawing and tucks it under {a.posAdj} arm like a diploma.' },
      { by: 'a', say: "I'm an artist now. In a famous city." },
      { by: 'b', say: "You drew my head like a potato." },
      { by: 'a', say: "A famous potato." },
    ] },
  ],
};

const catacombs = {
  'task-start.any': [
    { id: 'itc2.ct-s1', when: CT, turns: [
      { beat: 'Water drips somewhere in the dark. Every drip echoes down the tunnels.' },
      { by: 'b', say: "Drip. Drip. Drip. That's going to drive me mad." },
      { by: 'a', say: "Follow the drips. Maybe they're near the cheese." },
    ] },
    { id: 'itc2.ct-s2', when: CT, turns: [
      { by: 'a', say: "Don't touch the walls." },
      { by: 'b', say: "Why not?" },
      { by: 'a', say: "Look at what the walls are made of." },
      { by: 'b', say: "I'm never touching anything again." },
    ] },
    { id: 'itc2.ct-s3', when: CT, turns: [
      { beat: '{a}\'s torch flickers and goes out. Total darkness.' },
      { by: 'a', ...V("I can't see. I can't see anything. Where are you?", "I can't see you!", "Where are you?", "I CAN'T see! I can't see ANYTHING!", "I can't see anything at all, where are you?", "I've gone blind and the skulls are winning.") },
      { by: 'b', say: "Right here. Bang it on your hand." },
      { beat: '{a} bangs it. The light comes back on.' },
    ] },
    { id: 'itc2.ct-s4', when: CT, turns: [
      { by: 'b', say: "If a skeleton moves, I'm going home. I don't care about the money." },
      { by: 'a', say: "Skeletons don't move." },
      { by: 'b', say: "That's what they want you to think." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'itc2.ct-f1', when: CT, turns: [
      { beat: 'A strong, sharp smell drifts round a corner. {a} and {b} look at each other and grin.' },
      { by: 'a', say: "Old socks." },
      { by: 'b', say: "Cheese! That's cheese! Old-sock cheese!" },
      { beat: 'They find the cheese round the next corner.' },
    ] },
    { id: 'itc2.ct-f2', when: CT, turns: [
      { by: 'b', say: "Wait. Listen. Somebody's rolling something." },
      { by: 'a', say: "A cheese! Somebody's rolling a cheese!" },
      { beat: 'They follow the rumbling sound straight to the pile of cheese wheels.' },
    ] },
    { id: 'itc2.ct-f3', when: CT, turns: [
      { beat: '{a} and {b} turn left, right, left again, and walk straight into a room full of cheese.' },
      { by: 'b', say: "Just like that?" },
      { by: 'a', say: "Just like that. Don't question it. Grab a wheel." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'itc2.ct-a1', when: CT, turns: [
      { by: 'a', say: "Draw a map. On your arm. With a pen." },
      { by: 'b', say: "I haven't got a pen." },
      { by: 'a', say: "Then remember. Left at the big skull, right at the small one." },
      { beat: 'Left at the big skull, right at the small one, and there\'s the cheese.' },
    ] },
    { id: 'itc2.ct-a2', when: CT, turns: [
      { beat: '{a} and {b} come round a corner and find another team standing still, sniffing.' },
      { by: 'b', say: "They're lost too." },
      { by: 'a', say: "Then they're no use. Go the way they didn't." },
      { beat: 'The way they didn\'t go leads to the cheese.' },
    ] },
    { id: 'itc2.ct-a3', when: CT, turns: [
      { by: 'b', ...V("We're going round in circles. We're definitely going round in circles.", "We're going in circles.", "Circles.", "We're going round in CIRCLES! DEFINITELY circles!", "I'm pretty sure we're going round in circles.", "We've become part of the catacombs. We live here now.") },
      { by: 'a', say: "Then let's go round in a different circle." },
      { beat: 'The different circle has cheese in it.' },
    ] },
    { id: 'itc2.ct-a4', when: CT, turns: [
      { beat: '{a} stops dead and shines the torch on the floor. There\'s a trail of cheese crumbs.' },
      { by: 'a', say: "Crumbs! Somebody dropped crumbs!" },
      { by: 'b', say: "Like in the fairy tale!" },
      { beat: 'The crumbs lead them to the cheese.' },
    ] },
  ],
  'task-done.any': [
    { id: 'itc2.ct-dn1', when: CT, turns: [
      { by: 'b', say: "I'm going to smell like this cheese for the rest of my life." },
      { by: 'a', say: "Good. Then I'll always be able to find you." },
      { by: 'b', say: "That's sweet. Disgusting, but sweet." },
    ] },
    { id: 'itc2.ct-dn2', when: CT, turns: [
      { beat: '{a} and {b} roll their cheese wheels up the steps, one step at a time.' },
      { by: 'a', say: "Who decided cheese should be round?" },
      { by: 'b', say: "Someone who never had to carry it up stairs." },
    ] },
    { id: 'itc2.ct-dn3', when: CT, turns: [
      { by: 'a', say: "Say goodbye to the skeletons." },
      { by: 'b', say: "Goodbye, skeletons. Thank you for not moving." },
      { by: 'a', say: "Now run before they do." },
    ] },
    { id: 'itc2.ct-dn4', when: CT, turns: [
      { beat: 'At the top of the steps, {a} and {b} blink in the daylight, holding their cheese wheels.' },
      { by: 'b', say: "People are staring at us." },
      { by: 'a', say: "We just came out of a tomb with cheese. I'd stare too." },
    ] },
    { id: 'itc2.ct-dn5', when: CT, turns: [
      { by: 'a', say: "Can we eat some? Just a corner?" },
      { by: 'b', say: "It's our boat. You don't eat the boat." },
      { by: 'a', say: "Just a tiny corner of the boat." },
    ] },
  ],
};

const raft = {
  'ride.any': [
    { id: 'itc2.cr-r1', when: CR, turns: [
      { beat: 'A pigeon lands on {b}\'s cheese wheel and starts pecking at it.' },
      { by: 'b', say: "Get off! That's my boat! Shoo!" },
      { by: 'a', say: "It's a stowaway. Let it ride." },
    ] },
    { id: 'itc2.cr-r2', when: CR, turns: [
      { by: 'a', say: "Paddle together. Left, then right." },
      { by: 'b', say: "We're spinning. Why are we spinning?" },
      { by: 'a', say: "Because you're paddling left when I'm paddling left." },
    ] },
    { id: 'itc2.cr-r3', when: CR, turns: [
      { beat: 'The cheese wheels drift under a long stone bridge. Everybody on the bridge leans over to look.' },
      { by: 'b', say: "Hello! Hi! Hello!" },
      { by: 'a', say: "Don't encourage them." },
    ] },
    { id: 'itc2.cr-r4', when: CR, turns: [
      { by: 'b', say: "Is the cheese getting softer? Mine feels softer." },
      { by: 'a', say: "Don't say that. Don't ever say that." },
      { by: 'b', say: "Paddle faster, then." },
    ] },
  ],
};

export default mergePools(caricature, catacombs, raft);
