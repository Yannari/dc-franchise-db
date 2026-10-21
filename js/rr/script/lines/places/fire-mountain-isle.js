// Fire-Mountain Isle's own lines (js/rr/places/fire-mountain-isle.js), written in our own words:
//   lava or falls   Either/Or: hop the stepping stones over the lava (slip and it's back to the bank), or raft the
//                   river and climb the slippery path behind the waterfall.
//   the lagoon      Botch or Watch: swim across to the Don Box on the rocks; an old sea mine floats in the middle,
//                   and touching it means swimming back to the beach.
//   the statue      All-In: a statue of logs and pineapples that looks like one of them, carried up the volcano past
//                   the lava, thrown into the crater (World Tour's island finale, adapted for two).
// Gated on place / taskId / side. a does the Botch, b watches.
import { V, mergePools } from './_kit.js';

const P = { place: 'fire-mountain-isle' };
const LF = { taskId: 'lava-falls' };
const LV = { taskId: 'lava-falls', side: 'lava' };
const FL = { taskId: 'lava-falls', side: 'falls' };
const LG = { taskId: 'lagoon' };
const SU = { taskId: 'statue' };
const don = say => ({ by: 'don', say });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'fmi.op1', when: P, turns: [
      { beat: 'Smoke drifts off the volcano behind Don. He keeps glancing back at it.' },
      don("Fire-Mountain Isle! Home of white beaches, a beautiful lagoon, and a volcano that nobody will promise me isn't going to go off today."),
      don("I asked three people. One of them laughed. Teams must cross the island, swim the lagoon, and make an offering to the mountain."),
      { beat: 'The ground rumbles. Don grips the nearest palm tree.' },
      don("I'll be at the Chill Zone. Which is on the volcano. Who planned this?"),
    ] },
    { id: 'fmi.op2', when: P, turns: [
      { beat: 'Don lounges on a beach towel in a flowered shirt, a drink with an umbrella in his hand.' },
      don("Aloha, racers! Welcome to Fire-Mountain Isle, home of sun, surf, and a very hot mountain."),
      don("Today's leg takes our teams over lava, under a waterfall and up the volcano itself. I'll be here. Tanning."),
      { beat: 'A coconut drops from the palm above and lands on his drink.' },
    ] },
  ],
  'don-opener.bored': [
    { id: 'fmi.op3', when: P, turns: [
      { beat: 'Don is having his hair blown dry by the hot wind coming off the volcano, and looks delighted about it.' },
      don("Fire-Mountain Isle. Natural heat, natural styling. I may never leave."),
      don("Teams, your Don Box is in the jungle. Good luck, and watch your step. Some of these rocks are on fire."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'fmi.ar1', when: P, turns: [
      { beat: 'The boat pulls into a bay of turquoise water, palm trees right down to the sand.' },
      { by: 'a', ...V("It's paradise. We're in actual paradise.", "Actual paradise.", "Paradise.", "It's PARADISE! We're in ACTUAL PARADISE!", "It's paradise, we're honestly in paradise.", "It's a screensaver. We're inside a screensaver.") },
      { by: 'b', say: "There's a volcano. Paradise has a volcano." },
      { by: 'a', say: "Every paradise has a catch." },
    ] },
    { id: 'fmi.ar2', when: P, turns: [
      { by: 'b', say: "Smell the air. Flowers and salt." },
      { by: 'a', say: "And sulphur. That's the volcano." },
      { by: 'b', say: "Flowers, salt and a little bit of doom." },
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'fmi.ad1', when: P, turns: [
      { beat: 'The top of the volcano glows faintly red, even in daylight.' },
      { by: 'a', say: "Is it supposed to be glowing? Volcanoes aren't supposed to glow in the day." },
      { by: 'b', ...V("I think that means it's awake.", "It's awake.", "Means it's awake.", "I THINK that means it's AWAKE!", "I think that means it's awake, doesn't it?", "It's awake. And it's looking at us.") },
    ] },
    { id: 'fmi.ad2', when: P, turns: [
      { by: 'b', say: "I can't swim very well. If there's swimming, it's you." },
      { by: 'a', say: "It's an island. There's going to be swimming." },
      { by: 'b', say: "Then it's you. All the swimming is you." },
    ] },
  ],
};

// ── lava or falls ──
const lavaFalls = {
  'don-demo.gag': [
    { id: 'fmi.lf-d1', when: LF, turns: [
      don("In this Either/Or, teams choose. Lava: hop across these stepping stones over a river of hot lava. Falls: raft the river, then climb up behind the waterfall."),
      { beat: 'He steps onto the first stepping stone to demonstrate, and immediately hops back off.' },
      don("Hot. The stones are hot. Nobody told me the stones would be hot."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'fmi.lf-d2', when: LF, turns: [
      don("Lava is the fast way. One slip, though, and it's back to the bank to start again, with very warm shoes."),
      don("Falls is slower, wetter, and a lot less likely to set you on fire. Your next Don Box is on the far side of the island."),
      { beat: 'Behind him, a bubble of lava pops. He doesn\'t flinch, but his eyebrows do.' },
    ] },
  ],
  'decide-side.agree': [
    { id: 'fmi.lf-dc1', when: { ...LF, side: 'falls' }, turns: [
      { by: 'a', say: "Lava or falls?" },
      { by: 'b', ...V("Falls. I'm not hopping over lava. I'm not a frog.", "Falls. I'm not a frog.", "Falls.", "FALLS! I'm NOT hopping over LAVA! I'm not a FROG!", "Falls, please. I'm not hopping over lava like a frog.", "Falls. Lava is for dragons and fools.") },
      { by: 'a', say: "Falls it is. Wet is better than on fire." },
    ] },
  ],
  'decide-side.overruled': [
    { id: 'fmi.lf-dc2', when: { ...LF, side: 'lava' }, turns: [
      { by: 'b', say: "Falls. Please. Falls." },
      { by: 'a', say: "Lava's faster. We're doing lava." },
      { by: 'b', say: "If I fall in, I'm haunting you. Forever." },
    ] },
  ],
  'decide-side.swayed-by-watching': [
    { id: 'fmi.lf-dc3', when: { ...LF, side: 'falls' }, turns: [
      { beat: 'A team ahead of them slips off a stepping stone and has to scramble back to the bank, their shoes smoking.' },
      { by: 'a', say: "Their shoes are smoking. Actual smoke." },
      { by: 'b', say: "Falls. We're doing the falls." },
    ] },
  ],
  'task-start.any': [
    { id: 'fmi.lv-s1', when: LV, turns: [
      { beat: '{a} and {b} stand at the edge of the lava river. The heat makes the air shimmer.' },
      { by: 'a', say: "Small jumps. Don't stop on a stone. Never stop on a stone." },
      { by: 'b', ...V("Why not stop?", "Why not?", "Why not stop?", "Why NOT stop?", "Why can't I stop on one?", "What happens if I pause?") },
      { by: 'a', say: "Because your shoes will melt." },
    ] },
    { id: 'fmi.lv-s2', when: LV, turns: [
      { by: 'b', say: "I'll go first. If I make it, you follow me exactly." },
      { by: 'a', say: "And if you don't make it?" },
      { by: 'b', say: "Then you go the other way." },
    ] },
    { id: 'fmi.fl-s1', when: FL, turns: [
      { beat: '{a} and {b} climb into a raft at the top of the river channel.' },
      { by: 'a', say: "Paddle left. No, the other left. The left that goes forwards." },
      { by: 'b', ...V("Left doesn't go forwards! Nothing goes forwards on a river!", "Left doesn't go forwards!", "Nothing goes forwards!", "LEFT doesn't go FORWARDS! NOTHING goes forwards on a RIVER!", "Left doesn't go forwards, nothing goes forwards on a river!", "Rivers don't have forwards! Rivers have downwards!") },
    ] },
    { id: 'fmi.fl-s2', when: FL, turns: [
      { beat: 'At the bottom of the river, the path goes up behind the waterfall, slick with spray.' },
      { by: 'b', say: "We have to climb behind that? It's a wall of water." },
      { by: 'a', say: "Behind it. Not through it. Behind it is dry. Mostly." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'fmi.lv-f1', when: LV, turns: [
      { beat: '{a} hops across the stones without stopping once, {b} right behind, jumping into the same footprints.' },
      { by: 'a', say: "Made it! Feet still attached!" },
      { by: 'b', say: "My heart's still on the other side, but my feet made it." },
    ] },
    { id: 'fmi.lv-f2', when: LV, turns: [
      { by: 'b', say: "Just like hopscotch. Hopscotch, but lava." },
      { beat: 'They skip across, laughing, like it really is hopscotch.' },
      { by: 'a', say: "Best hopscotch of my life." },
    ] },
    { id: 'fmi.fl-f1', when: FL, turns: [
      { beat: '{a} and {b} ride the rapids perfectly and scramble up the path behind the waterfall without a slip.' },
      { by: 'a', say: "That was beautiful. It's like being inside a rainbow back there." },
      { by: 'b', say: "A very wet rainbow." },
    ] },
    { id: 'fmi.fl-f2', when: FL, turns: [
      { by: 'b', say: "We did the river and we didn't fall out!" },
      { by: 'a', ...V("I can't believe we didn't fall out. We always fall out of things.", "We didn't fall out!", "Didn't fall out.", "I can't BELIEVE we DIDN'T fall out! We ALWAYS fall out of things!", "I can't believe we didn't fall out. We always fall out of things.", "We stayed in a boat. Mark the calendar.") },
      { beat: 'Behind the waterfall, the next Don Box is waiting in the clearing.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fmi.lv-a1', when: LV, turns: [
      { beat: '{a} slips, lands on the bank, and has to start again, shoes steaming.' },
      { by: 'b', say: "Are your feet okay?" },
      { by: 'a', say: "My feet are fine. My shoes are having a very bad day." },
      { beat: 'The second time, {a} doesn\'t look down once, and makes it.' },
    ] },
    { id: 'fmi.lv-a2', when: LV, turns: [
      { by: 'b', say: "You keep landing on the wobbly one. The third one wobbles." },
      { by: 'a', say: "Then I'll skip the third one." },
      { beat: '{a} skips the third stone with an enormous leap, and makes it across.' },
    ] },
    { id: 'fmi.fl-a1', when: FL, turns: [
      { beat: 'The raft flips on the rapids, and {a} and {b} have to drag it back to the top.' },
      { by: 'b', say: "Lean in this time. Lean into the turn." },
      { by: 'a', say: "Lean in. Got it." },
      { beat: 'They lean into the turn, and the raft stays upright all the way down.' },
    ] },
    { id: 'fmi.fl-a2', when: FL, turns: [
      { by: 'a', ...V("The path's too slippery. We keep sliding back down.", "We keep sliding down.", "Too slippery.", "The PATH'S too SLIPPERY! We keep SLIDING back DOWN!", "The path's just too slippery, we keep sliding back down.", "The path is made of soap and betrayal.") },
      { by: 'b', say: "Hold on to the roots. Climb on the roots." },
      { beat: 'Root by root, they finally get to the top.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'fmi.lv-t1', when: LV, turns: [
      { beat: '{b} is frozen on the bank, staring at the lava.' },
      { by: 'a', say: "Come on. I'm right here. Jump to me." },
      { by: 'b', say: "I can feel the heat from here. It's coming through my shoes." },
    ] },
    { id: 'fmi.fl-t1', when: FL, turns: [
      { by: 'b', say: "I can't see. The spray's in my eyes. I can't see the path." },
      { by: 'a', say: "Hold my belt. I'll go first. Follow the belt." },
      { by: 'b', say: "I'm following the belt." },
    ] },
    { id: 'fmi.fl-t2', when: FL, turns: [
      { beat: 'Behind the waterfall, the roar is so loud that {a} and {b} can only shout.' },
      { by: 'a', ...V("Which way?", "Which way?", "Where now?", "WHICH WAY?", "Which way do we go?", "Where does the path go?") },
      { by: 'b', say: "What?" },
    ] },
  ],
  'task-done.any': [
    { id: 'fmi.lf-dn1', when: LF, turns: [
      { beat: '{a} and {b} reach the far side of the island and grab the tip from the Don Box.' },
      { by: 'a', say: "The lagoon. One of us has to swim the lagoon." },
      { by: 'b', ...V("Not it.", "Not it.", "Not it!", "NOT it!", "Not it, not it.", "I call not it. Officially.") },
    ] },
    { id: 'fmi.lf-dn2', when: LF, turns: [
      { by: 'b', say: "We're through. We're actually through." },
      { by: 'a', say: "And nobody caught fire. That's a good leg so far." },
      { by: 'b', say: "So far." },
    ] },
    { id: 'fmi.lf-dn3', when: LF, turns: [
      { beat: '{a} reads the tip, dripping and singed in equal measure.' },
      { by: 'a', say: "Next stop, the lagoon." },
      { by: 'b', say: "At least it's not lava." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'fmi.lv-x1', when: LV, turns: [
      { beat: '{a} wobbles on a stone, windmills {a.posAdj} arms, and jumps back to the bank.' },
      { by: 'a', say: "Nope. Nope. Back to the start." },
      { by: 'b', say: "You were so close." },
    ] },
    { id: 'fmi.lv-x2', when: LV, turns: [
      { beat: 'A stone tips under {b}\'s foot, and {b} has to leap back to the bank.' },
      { by: 'b', ...V("That stone moved! That stone moved on purpose!", "That stone moved!", "It moved!", "That STONE MOVED! That stone moved on PURPOSE!", "That stone moved, it moved on purpose!", "That stone betrayed me!") },
      { by: 'a', say: "Stones don't have purposes." },
    ] },
    { id: 'fmi.fl-x1', when: FL, turns: [
      { beat: 'The raft spins on the rapids and tips {a} and {b} into the river.' },
      { by: 'a', say: "Back to the top! Grab the raft!" },
      { by: 'b', say: "I've got a paddle! I've only got a paddle!" },
    ] },
  ],
};

// ── the lagoon (Botch or Watch) ──
const lagoon = {
  'don-demo.gag': [
    { id: 'fmi.lg-d1', when: LG, turns: [
      don("In this Botch or Watch, one partner swims across the lagoon to the Don Box on those rocks. The other watches from the beach and can only shout."),
      { beat: 'He points at a rusty, spiky ball bobbing in the middle of the lagoon.' },
      don("That's an old sea mine. Touch it, and you swim back to the beach. Don't worry, it's probably not live. Probably."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'fmi.lg-d2', when: LG, turns: [
      don("Swim the lagoon, slap the Don Box, grab the tip. Avoid the sea mine. Avoid the jellyfish. Avoid my reflection, it's beautiful and distracting."),
      { beat: 'He checks his reflection in the water, just to be sure.' },
      { beat: 'Satisfied, he turns back to the camera and flashes a dazzling smile.' },
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'fmi.lg-w1', when: LG, turns: [
      { by: 'b', say: "It's swimming. You're the swimmer. You've got medals." },
      { by: 'a', ...V("They're from when I was nine.", "They're from when I was nine.", "I was nine.", "They're from when I was NINE!", "Those medals are from when I was nine.", "I peaked at nine. But I peaked.") },
      { by: 'b', say: "Nine-year-old you would've done it. Go." },
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'fmi.lg-w2', when: LG, turns: [
      { by: 'a', say: "I'll swim it. I want to swim it." },
      { by: 'b', say: "There's a mine in it." },
      { by: 'a', say: "I'll swim round the mine. Round is easy." },
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'fmi.lg-w3', when: LG, turns: [
      { by: 'a', say: "You're swimming. I did the lava." },
      { by: 'b', ...V("We did the lava together!", "We did it together!", "Together!", "We did the lava TOGETHER!", "We did the lava together, though!", "The lava was a team effort!") },
      { by: 'a', say: "I did it more. Swim." },
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'fmi.lg-w4', when: LG, turns: [
      { by: 'b', say: "'Who's ready to get wet?' It's the lagoon. It's obviously the lagoon." },
      { by: 'a', say: "Then it's you. You love being wet." },
      { by: 'b', say: "Nobody loves being wet." },
    ] },
  ],
  'task-start.any': [
    { id: 'fmi.lg-s1', when: LG, turns: [
      { beat: '{a} wades into the lagoon up to the waist and looks out at the rocks.' },
      { by: 'a', say: "It's further than it looks. Why is everything further than it looks?" },
      { by: 'b', say: "Swim, and stop looking." },
    ] },
    { id: 'fmi.lg-s2', when: LG, turns: [
      { by: 'b', say: "Go wide round the mine. Wide!" },
      { by: 'a', ...V("How wide?", "How wide?", "Wide how?", "HOW wide?", "How wide is wide?", "Wide like a ship, or wide like a whale?") },
      { by: 'b', say: "Wider than you think." },
    ] },
    { id: 'fmi.lg-s3', when: LG, turns: [
      { beat: '{a} dives in and comes up spluttering.' },
      { by: 'a', say: "It's salty! Nobody said it'd be salty!" },
      { by: 'b', say: "It's the sea! Of course it's salty!" },
    ] },
    { id: 'fmi.lg-s4', when: LG, turns: [
      { by: 'a', say: "Hold my shoes. Hold my sunglasses. Hold my dignity." },
      { by: 'b', say: "I'll hold the shoes and the sunglasses." },
      { by: 'a', say: "I'll get my dignity back on the far side." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'fmi.lg-f1', when: LG, turns: [
      { beat: '{a} cuts across the lagoon in a perfect line, well clear of the mine, and slaps the Don Box.' },
      { by: 'b', ...V("Yes! Look at you! Look at you go!", "Look at you go!", "Yes!", "YES! LOOK at you! Look at you GO!", "Yes! Look at you, look at you go!", "Yes! Like a dolphin, a very focused dolphin!") },
      { by: 'a', say: "Nine-year-old me is so proud right now." },
    ] },
    { id: 'fmi.lg-f2', when: LG, turns: [
      { by: 'b', say: "Left of the mine! Keep left!" },
      { beat: '{a} keeps left, swims hard, and grabs the tip from the rocks.' },
      { by: 'a', say: "Got it! I've got it!" },
    ] },
    { id: 'fmi.lg-f3', when: LG, turns: [
      { beat: '{a} floats on {a.posAdj} back for half of it, very relaxed, and still gets there before half the teams.' },
      { by: 'b', say: "Were you floating? Did you just float there?" },
      { by: 'a', say: "Floating is swimming, slowly." },
    ] },
    { id: 'fmi.lg-f4', when: LG, turns: [
      { by: 'a', say: "That was easy! The water's warm!" },
      { by: 'b', say: "Why is it warm?" },
      { by: 'a', say: "I don't want to know why it's warm. I just got the tip." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fmi.lg-a1', when: LG, turns: [
      { beat: '{a} drags {a.ref} back onto the beach after brushing the mine, and goes again straight away.' },
      { by: 'b', say: "Wider this time! Go wider!" },
      { beat: 'This time {a} goes so wide that {a.sub} nearly swims out to sea, but gets there.' },
      { by: 'a', say: "Wide enough?" },
    ] },
    { id: 'fmi.lg-a2', when: LG, turns: [
      { by: 'a', say: "I keep drifting. The current keeps pushing me towards the mine." },
      { by: 'b', ...V("Then aim away from it, and let the current bring you back.", "Aim away. Let it bring you back.", "Aim away from it.", "Then AIM AWAY from it, and let the CURRENT bring you BACK!", "Then aim away from it, and let the current bring you back.", "Use the current. Make it your servant.") },
      { beat: '{a} aims away, lets the current carry {a.obj} in, and reaches the rocks.' },
    ] },
    { id: 'fmi.lg-a3', when: LG, turns: [
      { beat: '{a} gets halfway, panics at a piece of seaweed, and swims back.' },
      { by: 'b', say: "It was seaweed! Just seaweed!" },
      { by: 'a', say: "It touched my leg. Seaweed shouldn't touch legs." },
    ] },
    { id: 'fmi.lg-a4', when: LG, turns: [
      { by: 'b', say: "Breaststroke! You're better at breaststroke!" },
      { by: 'a', say: "Breaststroke. Okay. Okay." },
      { beat: 'Slow but steady, {a} breaststrokes all the way across and grabs the tip.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'fmi.lg-t1', when: LG, turns: [
      { beat: '{a} has been in the water a long time, and is barely moving now.' },
      { by: 'b', say: "You're nearly there! Nearly there!" },
      { by: 'a', ...V("You've been saying that for ten minutes!", "You keep saying that!", "Ten minutes of nearly!", "You've been SAYING that for TEN MINUTES!", "You've been saying nearly there for ten minutes!", "Nearly is a lie you tell swimmers!") },
    ] },
    { id: 'fmi.lg-t2', when: LG, turns: [
      { by: 'a', say: "I'm so tired. My arms won't lift." },
      { by: 'b', say: "Float! Float for a bit, then go again!" },
      { beat: '{a} floats, catches {a.posAdj} breath, and kicks on.' },
    ] },
    { id: 'fmi.lg-t3', when: LG, turns: [
      { beat: 'Every other swimmer has reached the rocks. {a} is still out in the middle.' },
      { by: 'b', say: "Don't look at them. Look at the rocks!" },
      { by: 'a', say: "I can't see the rocks! I can only see the sea!" },
    ] },
  ],
  'task-done.any': [
    { id: 'fmi.lg-dn1', when: LG, turns: [
      { beat: '{a} pulls the tip out of the Don Box and holds it up for {b} to see from the beach.' },
      { by: 'b', ...V("Swim back! No, wait, run round! There's a path!", "Run round! There's a path!", "Path! Run round!", "Swim BACK! No, WAIT, run ROUND! There's a PATH!", "Swim back! No, wait, run round, there's a path!", "Come back by land, the land is right there!") },
      { by: 'a', say: "There was a path the whole time?" },
    ] },
    { id: 'fmi.lg-dn2', when: LG, turns: [
      { by: 'a', say: "The tip says build a statue and take it up the volcano." },
      { by: 'b', say: "Up the volcano. Of course it's up the volcano." },
      { by: 'a', say: "At least it's dry up there." },
    ] },
    { id: 'fmi.lg-dn3', when: LG, turns: [
      { beat: '{a} staggers out of the water and collapses on the sand.' },
      { by: 'b', say: "You did it! Get up! You did it!" },
      { by: 'a', say: "Give me a second. The sand is very comfortable." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'fmi.lg-x1', when: LG, turns: [
      { beat: '{a} drifts too close, and {a.posAdj} hand brushes the rusty mine. A whistle blows from the beach.' },
      { by: 'b', say: "You touched it! Back! You have to come back!" },
      { by: 'a', ...V("I barely touched it! I tapped it!", "I barely touched it!", "I tapped it!", "I BARELY touched it! I TAPPED it!", "I barely touched it, I just tapped it!", "That was a greeting! A polite tap!") },
    ] },
    { id: 'fmi.lg-x2', when: LG, turns: [
      { beat: 'A wave picks {a} up and puts {a.obj} right back on the beach.' },
      { by: 'a', say: "The sea doesn't want me." },
      { by: 'b', say: "Then make it want you! Go again!" },
    ] },
    { id: 'fmi.lg-x3', when: LG, turns: [
      { beat: '{a} swims to the wrong rocks and has to swim all the way round.' },
      { by: 'b', say: "Those are the wrong rocks! The Don Box is on the other rocks!" },
      { by: 'a', say: "They're all rocks! They all look like rocks!" },
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'fmi.lg-v1', when: LG, turns: [
      { by: 'b', say: "Go! Go! You've got this! Swim like there's a shark behind you!" },
      { by: 'a', say: "Is there a shark behind me?" },
      { by: 'b', say: "No! But swim like there is!" },
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'fmi.lg-v2', when: LG, turns: [
      { beat: '{b} paces up and down the beach, chewing {b.posAdj} nails, watching every stroke.' },
      { by: 'b', say: "Why is it taking so long? Is that normal? Should it take this long?" },
      { by: 'a', say: "I can hear you from out here! Stop panicking!" },
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'fmi.lg-v3', when: LG, turns: [
      { beat: '{b} wades in up to the knees to shout directions.' },
      { by: 'b', say: "Left! Go left! I'll come and show you!" },
      { beat: 'A crew member pulls {b} back to the sand. Watchers watch. From the beach.' },
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'fmi.lg-v4', when: LG, turns: [
      { beat: '{b} sits on the sand, hugging {b.posAdj} knees, saying nothing at all.' },
      { by: 'a', say: "Say something! It's lonely out here!" },
      { by: 'b', say: "I'm concentrating! I'm swimming with my mind!" },
    ] },
  ],
  'helped-botch.any': [
    { id: 'fmi.lg-h1', when: LG, turns: [
      { beat: '{b} swims out to meet {a} halfway and gives {a.obj} a push towards the rocks.' },
      { by: 'a', say: "You're not supposed to be in here!" },
      { by: 'b', say: "I'm not here. I'm a dolphin. Keep going." },
    ] },
  ],
};

// ── the statue offering ──
const statue = {
  'don-demo.gag': [
    { id: 'fmi.su-d1', when: SU, turns: [
      don("Teams must build a statue out of these logs and pineapples. It has to look like one of you. Then you carry it up the volcano and throw it in!"),
      { beat: 'He holds up his own statue: a log with a pineapple head and sunglasses. It looks a lot like him.' },
      don("The mountain gets an offering. I get a souvenir. I'm keeping this one."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'fmi.su-d2', when: SU, turns: [
      don("Build it, carry it, throw it. If your statue falls apart on the way up, you go back to the beach and build it again."),
      don("The volcano only takes offerings in one piece. It's very particular. Like me."),
      { beat: 'He tosses a pineapple into the air, fails to catch it, and pretends that was the plan.' },
    ] },
  ],
  'task-start.any': [
    { id: 'fmi.su-s1', when: SU, turns: [
      { beat: '{a} and {b} stand in front of a pile of logs and a mountain of pineapples.' },
      { by: 'a', say: "Which one of us is it going to look like?" },
      { by: 'b', ...V("You. You've got the bigger head.", "You. Bigger head.", "You. Your head.", "YOU! You've got the BIGGER HEAD!", "You, obviously. You've got the bigger head.", "You. Your head is very pineapple-shaped.") },
      { by: 'a', say: "I'm choosing to take that as a compliment." },
    ] },
    { id: 'fmi.su-s2', when: SU, turns: [
      { by: 'b', say: "Logs for the body, pineapple for the head, coconuts for the eyes." },
      { by: 'a', say: "What about the hair?" },
      { by: 'b', say: "Leaves. Palm leaves. You'll look amazing." },
    ] },
    { id: 'fmi.su-s3', when: SU, turns: [
      { beat: '{a} lifts a log, staggers, and puts it straight back down.' },
      { by: 'a', say: "These are heavier than they look." },
      { by: 'b', say: "Everything on this island is heavier than it looks." },
    ] },
    { id: 'fmi.su-s4', when: SU, turns: [
      { by: 'a', say: "Does it have to be good? Or does it just have to be a statue?" },
      { by: 'b', say: "It has to make it up the volcano. That's all." },
      { by: 'a', say: "Then we're building it strong, not pretty." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'fmi.su-f1', when: SU, turns: [
      { beat: '{a} and {b} carry their statue up the path together, one at each end, without losing a single pineapple.' },
      { by: 'b', say: "It's holding! It's actually holding!" },
      { by: 'a', ...V("Don't look at it. If you look at it, it'll fall apart.", "Don't look at it.", "Don't look.", "DON'T look at it! If you LOOK at it, it'll FALL APART!", "Don't look at it, or it'll fall apart.", "Don't make eye contact with the statue.") },
    ] },
    { id: 'fmi.su-f2', when: SU, turns: [
      { beat: 'At the rim, {a} and {b} swing the statue back and throw it into the crater.' },
      { by: 'b', say: "Goodbye, statue! You were beautiful!" },
      { by: 'a', say: "It looked exactly like me. I feel weird about this." },
    ] },
    { id: 'fmi.su-f3', when: SU, turns: [
      { by: 'a', say: "Tie it with vines. Lots of vines." },
      { beat: 'They tie it so tightly it could survive an earthquake, and carry it all the way up.' },
      { by: 'b', say: "That's the strongest thing we've ever made." },
    ] },
    { id: 'fmi.su-f4', when: SU, turns: [
      { beat: 'Their statue has {b}\'s exact hairstyle, made from palm leaves.' },
      { by: 'b', say: "That's a very good likeness." },
      { by: 'a', say: "Then it's a shame we're throwing it in a volcano." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fmi.su-a1', when: SU, turns: [
      { beat: 'The pineapple head rolls off halfway up the path, bounces twice and disappears into the jungle.' },
      { by: 'a', say: "Back to the beach. Build it again. Glue the head on this time." },
      { by: 'b', say: "We don't have glue." },
      { by: 'a', say: "Then we'll use more vines. A lot more vines." },
    ] },
    { id: 'fmi.su-a2', when: SU, turns: [
      { by: 'b', say: "Smaller. Make it smaller this time. The big one was too heavy." },
      { by: 'a', ...V("A smaller statue of me?", "A smaller me?", "Smaller me?", "A SMALLER statue of ME?", "So, a smaller statue of me?", "A miniature me? A pocket me?") },
      { by: 'b', say: "A travel-sized you." },
      { beat: 'The travel-sized statue makes it all the way to the rim.' },
    ] },
    { id: 'fmi.su-a3', when: SU, turns: [
      { beat: 'This time they carry it slowly, step by step, past the stream of lava.' },
      { by: 'a', say: "Slow. Slow. Don't trip near the lava." },
      { by: 'b', say: "I'm not tripping near the lava. I'm not tripping anywhere near the lava." },
    ] },
    { id: 'fmi.su-a4', when: SU, turns: [
      { by: 'a', say: "The legs keep falling off. Why do the legs keep falling off?" },
      { by: 'b', say: "Then it doesn't need legs. We'll carry it. Statues don't walk." },
      { beat: 'A legless statue, it turns out, travels much better.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'fmi.su-t1', when: SU, turns: [
      { beat: 'The path up the volcano is steep, and the statue is very, very heavy.' },
      { by: 'b', say: "How much further?" },
      { by: 'a', ...V("To the top. It's always to the top.", "To the top.", "The top.", "To the TOP! It's ALWAYS to the TOP!", "All the way to the top, as always.", "To the summit. Where the fire lives.") },
    ] },
    { id: 'fmi.su-t2', when: SU, turns: [
      { by: 'a', say: "My hands are full of splinters." },
      { by: 'b', say: "My hands are full of pineapple." },
      { by: 'a', say: "Swap with me. Pineapple sounds nicer." },
    ] },
    { id: 'fmi.su-t3', when: SU, turns: [
      { beat: 'Other teams carry their statues past {a} and {b}, who are rebuilding theirs for the third time.' },
      { by: 'b', say: "Their statue doesn't even look like anyone." },
      { by: 'a', say: "Their statue's in one piece, though." },
    ] },
  ],
  'task-done.any': [
    { id: 'fmi.su-dn1', when: SU, turns: [
      { beat: 'The statue goes over the rim, and a puff of smoke comes up from the crater.' },
      { by: 'b', ...V("The volcano accepted it!", "It accepted it!", "Accepted!", "The VOLCANO ACCEPTED it!", "The volcano actually accepted it!", "The mountain is pleased with our offering!") },
      { by: 'a', say: "The volcano liked me." },
    ] },
    { id: 'fmi.su-dn2', when: SU, turns: [
      { by: 'a', say: "Tip. Where's the tip?" },
      { by: 'b', say: "On the rim. It says the Chill Zone, the last climb. We're nearly done!" },
      { by: 'a', say: "Then let's run before the mountain changes its mind." },
    ] },
    { id: 'fmi.su-dn3', when: SU, turns: [
      { beat: '{a} and {b} stand at the rim for a second, looking down at the island far below.' },
      { by: 'a', say: "We climbed all that." },
      { by: 'b', say: "Carrying a statue of you. Don't forget that part." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'fmi.su-x1', when: SU, turns: [
      { beat: 'Halfway up, the statue splits clean in two.' },
      { by: 'b', say: "It broke. It broke in half." },
      { by: 'a', say: "Back down. Back to the beach. Start again." },
    ] },
    { id: 'fmi.su-x2', when: SU, turns: [
      { beat: '{a} trips on a root, and the whole statue tumbles back down the path.' },
      { by: 'a', ...V("Statue! Come back!", "Come back!", "Statue!", "STATUE! COME BACK!", "Statue, come back!", "My likeness! Fleeing down the mountain!") },
      { by: 'b', say: "It's not coming back. It's in pieces." },
    ] },
    { id: 'fmi.su-x3', when: SU, turns: [
      { beat: 'They reach the rim, and the pineapple head rolls off at the very last second.' },
      { by: 'b', say: "No! It has to be in one piece!" },
      { by: 'a', say: "It was one piece until just now!" },
    ] },
  ],
};

export default mergePools(place, lavaFalls, lagoon, statue);
