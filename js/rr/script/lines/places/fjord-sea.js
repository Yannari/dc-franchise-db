// Fjord Sea's own lines (js/rr/places/fjord-sea.js), in our own words:
//   the taxi            to the shore: a moose in the road.
//   the longship        All-In: planks, oars, shields and a striped sail in a heap with picture-only instructions; built,
//                       rowed and sailed to the far shore; a leak, a fallen mast or an upside-down sail and it's back.
//   the meatball cannon Botch or Watch: pack the old cannon with meatballs and hit the floating target; a miss feeds the
//                       fish. a fires, b watches from the oars.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'fjord-sea' };
const LS = { taskId: 'longship' };
const MC = { taskId: 'meatball-cannon' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'fjs.op1', when: P, turns: [
      beat("Don stands on a rocky shore in a horned helmet and a fur cloak, a dark blue fjord behind him and red wooden cabins on the hillside."),
      don("Welcome to Fjord Sea! Land of longships, meatballs, flat-pack furniture and the most organised people on earth. I've been here a day and I already feel messy."),
      don("Today, teams build a longship from a pile of parts, and then fire meatballs out of a cannon. That's two of the four things. I'm working on the others."),
      beat('The horned helmet slides down over his eyes. He pushes it back up. It slides down again.'),
    ] },
    { id: 'fjs.op2', when: P, turns: [
      don("Fjord Sea. Everything here comes in a flat box with a tiny key and instructions that are only pictures. Even the boats."),
      don("Racers, taxis to the shore. Your longship is waiting. In pieces. Lots of pieces."),
      beat('A moose walks slowly across the road behind him, stops, and looks at the camera.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'fjs.op3', when: P, turns: [
      beat("Don sits in a wooden cabin by the fire, a plate of meatballs on his knee, wrapped in a woolly blanket."),
      don("Fjord Sea. I'm eating meatballs. The good ones. Not the cannon ones. Taxis are outside."),
      don("Off you go. Build something. Don't lose the little key."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'fjs.ar1', when: P, turns: [
      beat("The taxi comes over the top of a hill, and the fjord opens up below: deep blue water between steep green cliffs, waterfalls pouring down the sides."),
      by('a', "It's so deep. The water's almost black."),
      by('b', "And the cliffs go straight down into it."),
      by('a', "It's like the mountains split in half to make room for the sea."),
    ] },
    { id: 'fjs.ar2', when: P, turns: [
      by('b', "Everything is red. Little red cabins, everywhere."),
      by('a', "With white windows. They all match."),
      by('b', "Everything here matches. It's so tidy."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'fjs.ad1', when: P, turns: [
      by('a', "The tip says 'build a longship'. From scratch?"),
      by('b', "From a kit. There's a picture of a kit."),
      by('a', "I can't even build a shelf from a kit."),
    ] },
    { id: 'fjs.ad2', when: P, turns: [
      by('b', "'Who is good with a cannon?' Nobody is good with a cannon."),
      by('a', "Somebody must be. Pirates were."),
      by('b', "We're not pirates."),
    ] },
  ],
};

// ── the taxi (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'fjs.tm1', when: { taskId: 'shore-taxi', mishap: 'moose-on-the-road' }, turns: [
      beat("The taxi stops for a moose standing in the middle of the road. It is enormous. It does not move."),
      by('a', "Is it going to move?"),
      by('b', "The driver says moose move when moose want to move."),
      beat('Twenty minutes later, the moose decides it wants to move, and wanders off into the trees.'),
    ] },
  ],
};

// ── the longship (All-In) ──
const longship = {
  'don-demo.gag': [
    { id: 'fjs.ls-d1', when: LS, turns: [
      don("In this All-In, build a longship. Hull, mast, sail, oars. Then row and sail it across the fjord. The instructions are all pictures."),
      beat('He holds up the instruction sheet. It shows a smiling stick man and a finished ship, and nothing in between.'),
      don("That's step one, and that's the last step. You'll have to work out the middle."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'fjs.ls-d2', when: LS, turns: [
      don("If it leaks, if the mast falls, or if you put the sail on upside down, you row back and rebuild."),
      don("Land on the far shore, both of you, in your own longship, and the next tip is yours. There's one spare screw. Nobody knows what it's for."),
      beat('A half-built longship on the shore behind him sinks slowly into the shallows. Its team watches in silence.'),
    ] },
  ],
  'task-start.any': [
    { id: 'fjs.ls-s1', when: LS, turns: [
      beat("{a} and {b} stand over a huge heap of planks, oars, shields and a rolled-up sail, holding the instruction sheet upside down."),
      by('a', "Which way up is this?"),
      by('b', "The ship's pointing up. So this way. Probably."),
    ] },
    { id: 'fjs.ls-s2', when: LS, turns: [
      by('b', "Hull first. Then the mast. Then everything else."),
      by('a', "Which bit is the hull?"),
      by('b', "The big curvy bit. The bit that's a boat."),
    ] },
    { id: 'fjs.ls-s3', when: LS, turns: [
      beat("{a} fits two planks together with a satisfying click, and holds them up in triumph."),
      by('a', "They click! Everything clicks!"),
      by('b', "Two down. About four hundred to go."),
    ] },
    { id: 'fjs.ls-s4', when: LS, turns: [
      by('a', "What are the shields for?"),
      by('b', "Decoration. And looking cool."),
      by('a', "We're definitely putting the shields on."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'fjs.ls-f1', when: LS, turns: [
      beat("{a} and {b} snap the last oar into place, push the longship into the fjord, and row it all the way across without a leak."),
      by('b', "It floats! It floats, and we built it!"),
      by('a', "We're shipbuilders! Real ones!"),
    ] },
    { id: 'fjs.ls-f2', when: LS, turns: [
      by('a', "Sail up! Catch the wind!"),
      beat("The striped sail fills with wind, and the longship glides across the fjord to the far shore."),
      by('b', "We're sailing! We're actually sailing a longship!"),
    ] },
    { id: 'fjs.ls-f3', when: LS, turns: [
      beat("{a} reads every picture carefully, {b} builds, and the ship goes together perfectly the first time."),
      by('b', "How did you understand the pictures?"),
      by('a', "I stopped trying to understand them and just copied them."),
    ] },
    { id: 'fjs.ls-f4', when: LS, turns: [
      by('b', "First try. Not one leak."),
      by('a', "And the spare screw?"),
      by('b', "Still spare. We'll keep it forever."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fjs.ls-a1', when: LS, turns: [
      by('b', "It leaked because we skipped a step. This time, every single picture. In order."),
      beat("Every single picture, in order. The new longship doesn't leak a drop on the way across."),
      by('a', "In order! Instructions work when you follow them!"),
    ] },
    { id: 'fjs.ls-a2', when: LS, turns: [
      beat("Second ship. This time {a} and {b} put the mast in last, after the hull is finished, and it stays up."),
      by('a', "Mast last! The mast goes last!"),
      by('b', "The pictures never said that!"),
    ] },
    { id: 'fjs.ls-a3', when: LS, turns: [
      by('a', "The sail was upside down. The dragon goes at the top. Not the bottom."),
      beat("With the dragon at the top, the sail catches the wind perfectly, and carries them across."),
      by('b', "The dragon was upside down the whole time!"),
    ] },
    { id: 'fjs.ls-a4', when: LS, turns: [
      beat("After one sinking and one collapse, {a} and {b} finally row a longship all the way to the far shore."),
      by('a', "Third ship! The third ship is the one!"),
      by('b', "We could start a business."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'fjs.ls-t1', when: LS, turns: [
      beat("{a} and {b} sit among the planks, holding a piece that doesn't seem to fit anywhere."),
      by('a', "Where does this go?"),
      by('b', "It doesn't go anywhere. It's extra."),
      by('a', "Nothing's extra. That's the rule."),
    ] },
    { id: 'fjs.ls-t2', when: LS, turns: [
      by('b', "We've been building for an hour, and it's still mostly a pile."),
      by('a', "It's a pile with a shape now."),
      by('b', "It's a pile with a sad shape."),
    ] },
    { id: 'fjs.ls-t3', when: LS, turns: [
      beat("The longship is in the water, but it's going round and round in a circle."),
      by('a', "Why are we going round?"),
      by('b', "Because you're rowing and I'm not! Row together!"),
    ] },
  ],
  'task-done.any': [
    { id: 'fjs.ls-dn1', when: LS, turns: [
      by('a', "We built a whole ship. From a box."),
      by('b', "I'm never scared of flat-pack furniture again."),
      by('a', "We're unstoppable."),
    ] },
    { id: 'fjs.ls-dn2', when: LS, turns: [
      beat("{a} and {b} step off the longship onto the far shore, and look back at it, bobbing proudly in the water."),
      by('b', "Goodbye, ship."),
      by('a', "We're not leaving it. The cannon's on it."),
    ] },
    { id: 'fjs.ls-dn3', when: LS, turns: [
      by('b', "Cannon next. Meatballs."),
      by('a', "Out of a cannon?"),
      by('b', "That's what the tip says."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'fjs.ls-x1', when: LS, turns: [
      beat("{a} and {b} push the longship into the water, climb in, and feel their feet getting wet."),
      by('a', "Is that water? Inside the boat?"),
      by('b', "It's leaking! Back to the shore!"),
    ] },
    { id: 'fjs.ls-x2', when: LS, turns: [
      beat("The mast wobbles, creaks, and falls slowly over the side into the fjord with a splash."),
      by('b', "The mast! There goes the mast!"),
      by('a', "Back to the shore! Rebuild!"),
    ] },
    { id: 'fjs.ls-x3', when: LS, turns: [
      beat("{a} and {b} hoist the sail, and it hangs there, the dragon upside down, catching no wind at all."),
      by('a', "Why isn't it working?"),
      by('b', "The dragon's on its head! Back to the shore!"),
    ] },
  ],
};

// ── the meatball cannon (Botch or Watch: a fires, b watches from the oars) ──
const cannon = {
  'don-demo.gag': [
    { id: 'fjs.mc-d1', when: MC, turns: [
      don("In this Botch or Watch, pack this old cannon with meatballs and fire them at the target floating out on the fjord."),
      beat('He lights the fuse to show them. The cannon goes off with a boom, and a meatball sails away into the distance, nowhere near the target.'),
      don("That one was a warning shot. A delicious warning shot."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'fjs.mc-d2', when: MC, turns: [
      don("Miss, and you reload, re-aim, and fire again. The other one of you stays at the oars and watches."),
      don("A meatball through the middle of the target gets you the next tip. The fish get everything else. The fish are having a wonderful day."),
      beat('Out on the fjord, the water around the target boils with fish fighting over meatballs.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'fjs.mc-w1', when: MC, turns: [
      by('b', "You did the last one? No, that was me. So it's you."),
      by('a', "I've never fired a cannon."),
      by('b', "Nobody's ever fired a cannon. Go."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'fjs.mc-w2', when: MC, turns: [
      by('a', "I'll fire it. I've always wanted to fire a cannon."),
      by('b', "Really? Since when?"),
      by('a', "Since about ten seconds ago."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'fjs.mc-w3', when: MC, turns: [
      by('b', "Not me. Loud things scare me. You do it."),
      by('a', "Loud things scare me too!"),
      by('b', "Less than me. Go."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'fjs.mc-w4', when: MC, turns: [
      by('a', "'Who is good with a cannon?' You're good at darts."),
      by('b', "Darts aren't cannons."),
      by('a', "They're both about aiming."),
    ] },
  ],
  'task-start.any': [
    { id: 'fjs.mc-s1', when: MC, turns: [
      beat("{a} packs the cannon with meatballs, pushes them down with a long rod, and squints out at the target."),
      by('a', "Is it pointing at the target?"),
      by('b', "It's pointing at a cloud."),
    ] },
    { id: 'fjs.mc-s2', when: MC, turns: [
      by('b', "Lower. A bit lower. A bit to the left."),
      by('a', "Your left or my left?"),
      by('b', "The cannon's left!"),
    ] },
    { id: 'fjs.mc-s3', when: MC, turns: [
      beat("{a} lights the fuse, covers {a.posAdj} ears, and steps back."),
      by('a', "Is it going? Is it going?"),
      beat('BOOM. A meatball sails out across the fjord.'),
    ] },
    { id: 'fjs.mc-s4', when: MC, turns: [
      by('a', "How many meatballs do I put in?"),
      by('b', "Enough to hit the target."),
      by('a', "That's not a number."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'fjs.mc-f1', when: MC, turns: [
      beat("BOOM. A meatball flies out across the fjord and smacks right through the middle of the target."),
      by('b', "Bullseye! First shot! A meatball bullseye!"),
      by('a', "I'm a cannon person now. That's who I am."),
    ] },
    { id: 'fjs.mc-f2', when: MC, turns: [
      by('a', "Up a bit. Left a bit. Now!"),
      beat("The meatball arcs high over the water and drops straight through the centre of the target."),
      by('b', "It went right through! Right through the middle!"),
    ] },
    { id: 'fjs.mc-f3', when: MC, turns: [
      beat("{a} fires without aiming at all, just points it roughly at the target, and hits it dead centre."),
      by('b', "You didn't even aim!"),
      by('a', "I aimed with my heart."),
    ] },
    { id: 'fjs.mc-f4', when: MC, turns: [
      by('b', "First shot! That's the best shot anyone's done all day!"),
      by('a', "The fish look disappointed."),
      by('b', "The fish can have the next team's meatballs."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fjs.mc-a1', when: MC, turns: [
      by('b', "Every shot is going too far. Fewer meatballs. Less push."),
      beat("{a} packs fewer meatballs. The next shot drops neatly through the middle of the target."),
      by('a', "Less is more! Less meatball is more meatball!"),
    ] },
    { id: 'fjs.mc-a2', when: MC, turns: [
      beat("Fourth shot. {a} has worked out the wind, leans the cannon a little to the right, and fires. Bullseye."),
      by('a', "The wind! You have to aim for the wind!"),
      by('b', "You're a sailor now as well as a cannon person!"),
    ] },
    { id: 'fjs.mc-a3', when: MC, turns: [
      by('a', "I keep shooting short. So I aim higher. Much higher. Like a rainbow."),
      beat("The meatball goes up in a rainbow shape, and drops right through the middle of the target."),
      by('b', "A rainbow shot! Beautiful!"),
    ] },
    { id: 'fjs.mc-a4', when: MC, turns: [
      beat("After half the meatballs in the pile, {a} finally lands one through the centre of the target."),
      by('a', "Finally! The target is mine!"),
      by('b', "The fish are full, at least."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'fjs.mc-t1', when: MC, turns: [
      beat("Meatball after meatball splashes into the fjord, every one of them short."),
      by('a', "Why do they keep falling in the water?"),
      by('b', "Because they're meatballs, not missiles!"),
    ] },
    { id: 'fjs.mc-t2', when: MC, turns: [
      by('b', "That's ten meatballs. Ten."),
      by('a', "The fish are getting fat."),
      by('b', "The fish are having the best day of their lives."),
    ] },
    { id: 'fjs.mc-t3', when: MC, turns: [
      beat("{a}'s ears are ringing so loudly from the cannon that {a} can't hear anything {b} says."),
      by('b', "AIM LEFT!"),
      by('a', "WHAT?"),
    ] },
  ],
  'task-done.any': [
    { id: 'fjs.mc-dn1', when: MC, turns: [
      by('a', "My ears are still ringing."),
      by('b', "WHAT?"),
      by('a', "I said my ears are still... never mind."),
    ] },
    { id: 'fjs.mc-dn2', when: MC, turns: [
      beat("{a} and {b} row the longship out towards the buoy, leaving a cloud of happy fish behind them."),
      by('b', "We fed a whole fjord."),
      by('a', "We're very generous people."),
    ] },
    { id: 'fjs.mc-dn3', when: MC, turns: [
      by('b', "That was the most fun I've had all race."),
      by('a', "Firing meatballs?"),
      by('b', "Firing meatballs. I want a cannon at home."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'fjs.mc-x1', when: MC, turns: [
      beat("BOOM. The meatball flies way over the target and lands somewhere on the far shore."),
      by('a', "Too far! Way too far!"),
      by('b', "Reload! Again!"),
    ] },
    { id: 'fjs.mc-x2', when: MC, turns: [
      beat("{a} lights the fuse. It fizzles. Nothing happens. Then, just as {a} leans in to look, BOOM."),
      by('a', "I can't see! I've got meatball on my face!"),
      by('b', "Clean up and reload!"),
    ] },
    { id: 'fjs.mc-x3', when: MC, turns: [
      beat("The meatball clips the edge of the target, bounces off, and plops into the water."),
      by('a', "It hit it! It hit the edge!"),
      by('b', "The edge isn't the middle! Again!"),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'fjs.mc-v1', when: MC, turns: [
      by('b', "Fire! Fire the meatballs! You're a meatball captain!"),
      by('a', "Stop it, I'm concentrating!"),
      by('b', "Concentrate like a captain!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'fjs.mc-v2', when: MC, turns: [
      beat("{b} grips the oars and flinches every single time the cannon goes off."),
      by('b', "Warn me. Warn me before you fire it."),
      by('a', "I'm firing it now!"),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'fjs.mc-v3', when: MC, turns: [
      beat("{b} leaves the oars, grabs the back of the cannon and swings it round to aim it better."),
      by('b', "There! That's straight now!"),
      beat("A judge on the shore blows a horn and points at {b}. A penalty."),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'fjs.mc-v4', when: MC, turns: [
      beat("{b} sits perfectly still at the oars, fingers in both ears, eyes closed."),
      by('a', "Are you watching?"),
      by('b', "I'm listening for the bullseye. Silently."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'fjs.mc-h1', when: MC, turns: [
      beat("While the judge on the shore looks at another ship, {b} rows the longship a few strokes closer to the target."),
      by('a', "Is the target closer?"),
      by('b', "The tide moved us. Fire."),
    ] },
  ],
};

export default mergePools(place, roads, longship, cannon);
