// Prairie Ranch's own lines (js/rr/places/prairie-ranch.js), 1:1 with the real leg ("Little Bull on the Prairie"), in
// our own words:
//   the pickup     to the ranch: cattle crossing.
//   the beans      All-In: a whole iron pot of pork and beans, to the tip taped at the bottom; beans left (or brought
//                  back up) and the cook tops it up.
//   the bull       Botch or Watch: eight seconds on the mechanical bull, one hand on the rope; off before eight and
//                  it's back on. a rides, b watches from the rail.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'prairie-ranch' };
const BE = { taskId: 'beans' };
const BU = { taskId: 'bull' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'prr.op1', when: P, turns: [
      beat('Don stands at the ranch gate in a cowboy hat two sizes too big, the prairie flat and golden behind him to the edge of the world.'),
      don("Welcome to Prairie Ranch! Big sky, big hats, and big portions. Today, you'll find out exactly how big."),
      don("Teams will eat a whole pot of beans, and then ride a bull. Not a real bull. A real bull wasn't insured."),
      beat('He tips his hat. It falls down over his eyes. He pushes it back up with dignity.'),
    ] },
    { id: 'prr.op2', when: P, turns: [
      don("Prairie Ranch. There's nothing for a hundred miles in any direction except wheat, cows, and one diner that only serves beans."),
      don("Racers, there's a pickup truck by the fence. Get in the back. Hold on to something."),
      beat('A tumbleweed rolls across the road behind him, slowly, as if it has somewhere to be.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'prr.op3', when: P, turns: [
      beat("Don is leaning on a fence post, chewing on a piece of straw, looking out at the horizon."),
      don("Prairie Ranch. It's very flat. You can see tomorrow from here. Pickup's at the gate."),
      don("Go on, partner. Yeehaw. I'm not saying it again."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'prr.ar1', when: P, turns: [
      beat('The pickup crests a rise, and the prairie spreads out below them: gold grass, a red barn, and horses running along the fence.'),
      by('a', "It's like a cowboy film. It's exactly like a cowboy film."),
      by('b', "Look at the horses. They're running alongside us."),
      by('a', "They're racing us. And they're winning."),
    ] },
    { id: 'prr.ar2', when: P, turns: [
      by('b', "I've never seen this much sky. Where does it end?"),
      by('a', "It doesn't. That's the point of a prairie."),
      by('b', "I feel very small."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'prr.ad1', when: P, turns: [
      by('a', "It says 'eat the whole pot'. How big is the pot?"),
      by('b', "It doesn't say. That's what scares me."),
      by('a', "There's a picture. It's a big pot."),
    ] },
    { id: 'prr.ad2', when: P, turns: [
      by('b', "'Who can hang on?' Hang on to what?"),
      by('a', "Something that's going to try to throw us off."),
      by('b', "I don't like any of this."),
    ] },
  ],
};

// ── the pickup (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'prr.tm1', when: { taskId: 'ranch-pickup', mishap: 'cattle-crossing' }, turns: [
      beat('The pickup stops at a cattle crossing. A herd of cows is wandering across the road, very, very slowly.'),
      by('a', "How many cows are there?"),
      by('b', "All of them. Every cow in the world is crossing this road."),
      beat('Twenty minutes later, the last cow ambles off, and the pickup roars on.'),
    ] },
  ],
};

// ── the pot of beans (All-In) ──
const beans = {
  'don-demo.gag': [
    { id: 'prr.be-d1', when: BE, turns: [
      don("In this All-In, eat a whole pot of pork and beans. At the bottom of the pot is your tip. That's the only way to reach it."),
      beat('A cook drops a full iron pot onto the table with a thud that shakes the planks. Don leans over and sniffs.'),
      don("They're actually quite good. I had three bowls. I'm not doing well."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'prr.be-d2', when: BE, turns: [
      don("Leave beans in the pot, and the cook tops it up. Bring them back up, and the cook tops it up. Pace yourselves."),
      don("A clean pot and the tip in your hand. That's it. That's the whole challenge."),
      beat('Behind him, the cook ladles more beans into a pot that was nearly empty. A racer somewhere groans.'),
    ] },
  ],
  'task-start.any': [
    { id: 'prr.be-s1', when: BE, turns: [
      beat('{a} and {b} sit down at the long table in front of a pot of beans almost as big as a bucket.'),
      by('a', "That's not a pot. That's a bath."),
      by('b', "Grab a spoon. We eat until we see the bottom."),
    ] },
    { id: 'prr.be-s2', when: BE, turns: [
      by('b', "Small spoonfuls. Steady. Like a marathon, not a sprint."),
      by('a', "I've never run a marathon."),
      by('b', "Then this is your first one."),
    ] },
    { id: 'prr.be-s3', when: BE, turns: [
      beat("{a} takes one spoonful, then another, and stops to stare at how full the pot still is."),
      by('a', "It hasn't gone down. It hasn't gone down at all."),
      by('b', "Don't look at the pot. Look at the spoon."),
    ] },
    { id: 'prr.be-s4', when: BE, turns: [
      by('a', "Do you like beans?"),
      by('b', "I did this morning."),
      by('a', "Me too."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'prr.be-f1', when: BE, turns: [
      beat("Spoon after spoon, {a} and {b} work through the pot without stopping, until a spoon scrapes metal, and paper."),
      by('b', "The tip! I can see the tip!"),
      by('a', "Peel it off! Before I see another bean!"),
    ] },
    { id: 'prr.be-f2', when: BE, turns: [
      by('a', "Last bean. Who wants the last bean?"),
      by('b', "You have it. You've earned it."),
      beat('{a} eats the last bean, peels the tip off the bottom of the pot and waves it in the air.'),
    ] },
    { id: 'prr.be-f3', when: BE, turns: [
      beat("{a} and {b} eat in a steady rhythm, one spoon each, turn and turn about, and the pot empties."),
      by('b', "Turn and turn about. Works every time."),
      by('a', "Never tell anyone how many beans I just ate."),
    ] },
    { id: 'prr.be-f4', when: BE, turns: [
      by('b', "We did it! Whole pot! In one go!"),
      by('a', "Don't shout. Shouting moves the beans."),
      by('b', "Sorry. Whispering. We did it."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'prr.be-a1', when: BE, turns: [
      by('b', "Slower this time. We went too fast and look what happened."),
      beat('Slower this time, spoonful by spoonful, and they reach the bottom of the pot.'),
      by('a', "Slower works. Slower stays down."),
    ] },
    { id: 'prr.be-a2', when: BE, turns: [
      beat("The cook tops up the pot one last time. {a} and {b} look at each other, pick up their spoons, and finish it."),
      by('a', "That's the end. That's the bottom. I can see the tip."),
      by('b', "Grab it before he tops it up again!"),
    ] },
    { id: 'prr.be-a3', when: BE, turns: [
      by('a', "Drink water between every spoonful. Every single one."),
      beat('Water, beans, water, beans, all the way down to the bottom of the pot, and the tip.'),
      by('b', "Water was the secret. Water's always the secret."),
    ] },
    { id: 'prr.be-a4', when: BE, turns: [
      beat("{b} stands up to make more room in {b.posAdj} stomach, and eats the last of the pot standing up."),
      by('b', "Standing up works! There's more room standing up!"),
      by('a', "That can't be how stomachs work. But we're done."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'prr.be-t1', when: BE, turns: [
      beat("{a} sits back from the table, holding {a.posAdj} stomach, a spoon still in one hand."),
      by('a', "I can't. I can't do another one. I'm full of beans."),
      by('b', "We're halfway! You can do half a pot!"),
    ] },
    { id: 'prr.be-t2', when: BE, turns: [
      by('b', "Every time we get close, he tops it up."),
      by('a', "Because you keep leaving beans in it."),
      by('b', "I'm leaving them for you."),
    ] },
    { id: 'prr.be-t3', when: BE, turns: [
      beat('{a} and {b} have both stopped eating, staring at the pot, as if it might empty itself.'),
      by('a', "Maybe if we look at it long enough."),
      by('b', "It's not going to empty itself. Pick up your spoon."),
    ] },
  ],
  'task-done.any': [
    { id: 'prr.be-dn1', when: BE, turns: [
      by('a', "I'm never eating a bean again as long as I live."),
      by('b', "You said that about the last thing we ate."),
      by('a', "And I meant it then, too."),
    ] },
    { id: 'prr.be-dn2', when: BE, turns: [
      beat("{a} and {b} walk very carefully away from the table towards the barn, holding their stomachs."),
      by('b', "Slowly. Walk slowly."),
      by('a', "And the next challenge is a bull. A bucking bull."),
    ] },
    { id: 'prr.be-dn3', when: BE, turns: [
      by('b', "That was the most beans anybody has ever eaten."),
      by('a', "The cook looked impressed."),
      by('b', "The cook looked worried."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'prr.be-x1', when: BE, turns: [
      beat("{b} turns green, gets up from the table, and runs behind the barn."),
      by('a', "Oh no. Oh no, that's going to cost us."),
      beat('The cook sighs and ladles another helping into their pot.'),
    ] },
    { id: 'prr.be-x2', when: BE, turns: [
      beat("{a} holds up the pot to show the cook. He looks in, points at one corner, and tops it up again."),
      by('a', "It was three beans! Three!"),
      by('b', "He doesn't care. Spoon up."),
    ] },
    { id: 'prr.be-x3', when: BE, turns: [
      beat("{a} knocks the pot with an elbow, and a whole wave of beans slops onto the table."),
      by('a', "Can we eat them off the table?"),
      by('b', "He's already filling it back up. Start again."),
    ] },
  ],
};

// ── the mechanical bull (Botch or Watch: a rides, b watches from the rail) ──
const bull = {
  'don-demo.gag': [
    { id: 'prr.bu-d1', when: BU, turns: [
      don("In this Botch or Watch, the one of you not holding the tip rides this mechanical bull for eight seconds. One hand on the rope."),
      beat('He climbs on, nods to the cowboy at the controls, and is thrown off onto the hay before the timer reaches one.'),
      don("That was a demonstration of what not to do. You're welcome."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'prr.bu-d2', when: BU, turns: [
      don("Fall off before eight seconds, and you climb back on and start again. The other partner stays behind the rail and watches."),
      don("The cowboy at the controls starts it slow. He does not finish it slow."),
      beat('The cowboy at the controls grins and cracks his knuckles.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'prr.bu-w1', when: BU, turns: [
      by('b', "You're holding nothing. I'm holding the tip. You ride."),
      by('a', "Can't I hold the tip?"),
      by('b', "Too late. It's in my hand. Saddle up."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'prr.bu-w2', when: BU, turns: [
      by('a', "I'll ride. I rode a donkey on holiday once."),
      by('b', "A donkey isn't a bull."),
      by('a', "It bucked. A bit. When I sneezed."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'prr.bu-w3', when: BU, turns: [
      by('b', "I ate more beans than you. If I get on that thing, they're coming back out."),
      by('a', "That's disgusting."),
      by('b', "That's why you're riding."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'prr.bu-w4', when: BU, turns: [
      by('a', "'Who can hang on?' It's going to be something that bucks. I know it."),
      by('b', "You've got the strongest grip. You opened that jar."),
      by('a', "One jar. One time."),
    ] },
  ],
  'task-start.any': [
    { id: 'prr.bu-s1', when: BU, turns: [
      beat("{a} climbs onto the mechanical bull and grabs the rope with one hand."),
      by('a', "It's just sitting here. It doesn't look so bad."),
      by('b', "That's because it's off."),
    ] },
    { id: 'prr.bu-s2', when: BU, turns: [
      by('b', "Squeeze with your knees. Lean back. Arm up in the air."),
      by('a', "Where did you learn that?"),
      by('b', "Films. Every single film."),
    ] },
    { id: 'prr.bu-s3', when: BU, turns: [
      beat('The bull starts to rock, slowly, then a bit faster. {a} grips the rope with white knuckles.'),
      by('a', "This is fine. This is fine. This is fine."),
      by('b', "It hasn't even started yet!"),
    ] },
    { id: 'prr.bu-s4', when: BU, turns: [
      by('a', "Eight seconds. Anybody can do anything for eight seconds."),
      by('b', "Say that again when you're on it."),
      by('a', "I'm on it now. I'm saying it now."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'prr.bu-f1', when: BU, turns: [
      beat("The bull bucks and spins, faster and faster, and {a} hangs on, one arm in the air, all the way to eight."),
      by('b', "Eight! Eight seconds! You did it!"),
      by('a', "Can somebody stop it? Please stop it now!"),
    ] },
    { id: 'prr.bu-f2', when: BU, turns: [
      by('a', "Yeehaw! Yeehaw!"),
      beat('The timer hits eight. The cowboy stops the bull. {a} slides off and waves the hat in the air.'),
      by('b', "Where did you even get a hat?"),
    ] },
    { id: 'prr.bu-f3', when: BU, turns: [
      beat("{a} grips the bull with both knees and doesn't move at all, as if glued to it, for the full eight seconds."),
      by('b', "You didn't even wobble!"),
      by('a', "I was too scared to wobble."),
    ] },
    { id: 'prr.bu-f4', when: BU, turns: [
      by('b', "First try! The cowboy's clapping!"),
      by('a', "The cowboy is clapping for me?"),
      by('b', "For you! On the bull! First try!"),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'prr.bu-a1', when: BU, turns: [
      by('b', "You keep leaning forward. Lean back. Way back."),
      beat("{a} leans way back, and rides the bull all the way to eight."),
      by('a', "Back! Leaning back was the answer!"),
    ] },
    { id: 'prr.bu-a2', when: BU, turns: [
      beat('Fourth ride. {a} is covered in hay, but hangs on through every buck and spin, and the timer hits eight.'),
      by('a', "Eight! Finally eight!"),
      by('b', "You've got hay in your ears! But you did it!"),
    ] },
    { id: 'prr.bu-a3', when: BU, turns: [
      by('a', "I'm going to count out loud this time. It helps."),
      beat("One, two, three, all the way to eight, shouting every number, and {a} is still on."),
      by('b', "You counted that bull into submission!"),
    ] },
    { id: 'prr.bu-a4', when: BU, turns: [
      beat("{a} climbs back on for the third time, jaw set, and this time just refuses to fall off."),
      by('a', "Not today, bull. Not today."),
      beat('Eight seconds. The cowboy nods. The tip is theirs.'),
    ] },
  ],
  'task-try.struggling': [
    { id: 'prr.bu-t1', when: BU, turns: [
      beat("{a} lies on the hay where the bull threw {a.obj}, staring up at the barn roof."),
      by('a', "How long was that?"),
      by('b', "Two seconds."),
      by('a', "It felt like a year."),
    ] },
    { id: 'prr.bu-t2', when: BU, turns: [
      by('b', "That's the fifth time. Is your arm okay?"),
      by('a', "Which one? They both hurt now."),
      by('b', "The one you hold on with."),
    ] },
    { id: 'prr.bu-t3', when: BU, turns: [
      beat("The bull spins left. {a} goes right. The hay gets {a} again."),
      by('a', "It knows! It knows which way I'm going to lean!"),
      by('b', "It's a machine! It doesn't know anything!"),
    ] },
  ],
  'task-done.any': [
    { id: 'prr.bu-dn1', when: BU, turns: [
      by('a', "I'm a cowboy now. A real one."),
      by('b', "You're a person who rode a machine for eight seconds."),
      by('a', "That's what a cowboy is."),
    ] },
    { id: 'prr.bu-dn2', when: BU, turns: [
      beat("{a} and {b} walk out of the barn, {a} walking a little bowlegged."),
      by('b', "Why are you walking like that?"),
      by('a', "Don't ask me questions you know the answer to."),
    ] },
    { id: 'prr.bu-dn3', when: BU, turns: [
      by('b', "You were so good! Honestly! Like a rodeo star!"),
      by('a', "Did the beans stay down?"),
      by('b', "Every single one. I'm so proud."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'prr.bu-x1', when: BU, turns: [
      beat("The bull bucks once, hard, and {a} flies off sideways into the hay."),
      by('a', "How long was that?"),
      by('b', "Not eight. Back on!"),
    ] },
    { id: 'prr.bu-x2', when: BU, turns: [
      beat("{a} makes it to seven, then the bull spins, and {a} slides slowly off the side."),
      by('a', "Seven! I got to seven!"),
      by('b', "Seven doesn't count! It has to be eight!"),
    ] },
    { id: 'prr.bu-x3', when: BU, turns: [
      beat("{a} grabs the rope with both hands. The cowboy stops the bull and wags a finger."),
      by('a', "Both hands isn't allowed?"),
      by('b', "One hand! Start again!"),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'prr.bu-v1', when: BU, turns: [
      by('b', "Ride it! Ride it! You're a cowboy! You're the best cowboy!"),
      by('a', "I'm not a cowboy!"),
      by('b', "You are right now!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'prr.bu-v2', when: BU, turns: [
      beat("{b} grips the rail so tight {b.posAdj} knuckles go white, wincing at every buck."),
      by('b', "Hold on. Hold on. Please hold on."),
      by('a', "I'm holding on!"),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'prr.bu-v3', when: BU, turns: [
      beat("{b} climbs over the rail to steady {a} on the bull."),
      by('b', "I'll just hold the back of it!"),
      beat('The cowboy kills the power and points {b} back behind the rail. A penalty.'),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'prr.bu-v4', when: BU, turns: [
      beat("{b} leans on the rail without a word, chewing on a piece of straw, eyes never leaving {a}."),
      by('a', "Say something!"),
      by('b', "I'm concentrating for both of us."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'prr.bu-h1', when: BU, turns: [
      beat("While the cowboy fiddles with the timer, {b} kicks a big pile of hay right under where {a} keeps landing."),
      by('a', "That landing was much softer."),
      by('b', "Was it? Strange. Get back on."),
    ] },
  ],
};

export default mergePools(place, roads, beans, bull);
