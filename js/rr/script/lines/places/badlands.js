// Badlands' own lines (js/rr/places/badlands.js), in our own words:
//   the pickup       into the hoodoos: a flat tyre in the canyon.
//   the dinosaur     All-In: bones dug out of the striped hills with pickaxes and brushes, built into a whole skeleton on a
//                    frame for the palaeontologist; a bone in the wrong place, one missing, or a collapse and it's back.
//   the buried barrel Botch or Watch: an old map, a staked-out grid by a drilling rig, a square picked and dug; an empty
//                    hole is filled in and another square picked. a digs, b watches from the rig.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'badlands' };
const DN = { taskId: 'dino' };
const OB = { taskId: 'oil-barrel' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'bdl.op1', when: P, turns: [
      beat("Don stands among strange striped hills and tall rock towers like giant mushrooms, a dinosaur skeleton standing behind him."),
      don("Welcome to the Badlands! Seventy-five million years ago, dinosaurs walked here. Today, you'll be digging them up. Gently. They've waited a long time."),
      don("Then you'll dig for buried barrels. It's a very diggy leg. Bring your back. You'll need it."),
      beat('He leans on the dinosaur skeleton. A rib falls off. He picks it up and puts it back, very, very quickly.'),
    ] },
    { id: 'bdl.op2', when: P, turns: [
      don("The Badlands. It looks like another planet. It's hot in the day, freezing at night, and full of bones."),
      don("Racers, the pickups are at the gate. Drive into the hoodoos. Those are the rock towers. They're called hoodoos. I love saying hoodoos."),
      beat('A tumbleweed rolls past behind him, catches on a rock tower, and stays there.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'bdl.op3', when: P, turns: [
      beat("Don sits in a camping chair in the shade of a hoodoo, a cold drink in one hand and a tiny brush in the other, dusting a fossil."),
      don("Badlands. I'm doing some light palaeontology. Pickups are at the gate."),
      don("Go dig something up. Not me. Something old."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'bdl.ar1', when: P, turns: [
      beat("The pickup drives down into a valley of striped hills, red, grey and gold, and rock towers standing like giant mushrooms."),
      by('a', "It's like being on another planet."),
      by('b', "Look at the stripes. Every stripe is millions of years."),
      by('a', "That's a lot of years."),
    ] },
    { id: 'bdl.ar2', when: P, turns: [
      beat("A giant model dinosaur stands at the side of the road, its mouth open, towering over the pickup."),
      by('b', "That's not real, is it?"),
      by('a', "It's a model. But the bones in the ground are real."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'bdl.ad1', when: P, turns: [
      by('a', "The tip says 'build a dinosaur'. A whole one?"),
      by('b', "From bones. From real bones."),
      by('a', "I can't even build a model aeroplane."),
    ] },
    { id: 'bdl.ad2', when: P, turns: [
      by('b', "'Who can dig?' Everybody can dig."),
      by('a', "Can everybody dig for an hour in this heat?"),
      by('b', "Okay, maybe not everybody."),
    ] },
  ],
};

// ── the pickup (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'bdl.tm1', when: { taskId: 'hoodoo-pickup', mishap: 'flat-in-the-canyon' }, turns: [
      beat("At the bottom of a dusty canyon, a sharp rock punctures a tyre with a bang, and the pickup lurches to a stop."),
      by('a', "Flat tyre. In a canyon. In the middle of nowhere."),
      by('b', "Is there a spare?"),
      beat('There is a spare. Twenty hot, dusty minutes later, they are back on the road.'),
    ] },
  ],
};

// ── build a dinosaur (All-In) ──
const dino = {
  'don-demo.gag': [
    { id: 'bdl.dn-d1', when: DN, turns: [
      don("In this All-In, dig dinosaur bones out of the ground with pickaxes and brushes, and build them into a whole skeleton on this frame. Skull, spine, ribs, legs, tail."),
      beat('He picks up a bone, looks at it, and puts it on the frame where the head should go. It is clearly a leg.'),
      don("That's wrong. I know it's wrong. Don't do what I did."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'bdl.dn-d2', when: DN, turns: [
      don("A bone in the wrong place, a missing bone, or a skeleton that falls over, and you keep digging or start rebuilding."),
      don("When the palaeontologist approves your dinosaur, the next tip is yours. She's very strict. She once failed a museum."),
      beat('The palaeontologist, in a wide hat, stands by the frames with a clipboard, frowning at a skeleton with its head on backwards.'),
    ] },
  ],
  'task-start.any': [
    { id: 'bdl.dn-s1', when: DN, turns: [
      beat("{a} swings the pickaxe into the striped ground, and something white shows through the dirt."),
      by('a', "A bone! There's a bone!"),
      by('b', "Brush now! Gently! Don't break it!"),
    ] },
    { id: 'bdl.dn-s2', when: DN, turns: [
      by('b', "You dig, I'll build. Bring me everything that looks like a bone."),
      by('a', "Everything here looks like a bone."),
      by('b', "Then bring me everything."),
    ] },
    { id: 'bdl.dn-s3', when: DN, turns: [
      beat("{a} and {b} lay out the bones they've found on the ground, and stare at them, trying to work out what goes where."),
      by('a', "Is this a leg or a rib?"),
      by('b', "It's curved. Ribs are curved. Probably."),
    ] },
    { id: 'bdl.dn-s4', when: DN, turns: [
      by('a', "What kind of dinosaur is it?"),
      by('b', "A big one."),
      by('a', "That narrows it down."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'bdl.dn-f1', when: DN, turns: [
      beat("{a} and {b} put the last bone, the tip of the tail, onto the frame, and step back. A whole dinosaur stands in front of them."),
      by('b', "It's a dinosaur! We built a dinosaur!"),
      beat("The palaeontologist walks round it twice, nods, and hands over the tip."),
    ] },
    { id: 'bdl.dn-f2', when: DN, turns: [
      by('a', "Head at the front, tail at the back, legs underneath."),
      beat("Every bone in its place, the skeleton stands tall. The palaeontologist actually smiles."),
      by('b', "She smiled! She never smiles!"),
    ] },
    { id: 'bdl.dn-f3', when: DN, turns: [
      beat("{a} finds a huge skull, brushes off the dirt, and it grins up at them with a mouth full of teeth."),
      by('a', "Found the head! Look at its teeth!"),
      by('b', "Put it on the top! It's finished!"),
    ] },
    { id: 'bdl.dn-f4', when: DN, turns: [
      by('b', "First try. A whole dinosaur."),
      by('a', "I've wanted to do this since I was five."),
      by('b', "Five-year-old you would be so proud."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'bdl.dn-a1', when: DN, turns: [
      by('b', "She said the legs were on backwards. The knees go the other way. Like a bird."),
      beat("They turn the legs round so the knees bend like a bird's. The palaeontologist nods."),
      by('a', "Like a bird! Dinosaurs are birds!"),
    ] },
    { id: 'bdl.dn-a2', when: DN, turns: [
      beat("Second try. {a} digs in the darker stripe, where the bones are thickest, and finds the missing piece of the spine."),
      by('a', "That's the bit! That was the missing bit!"),
      by('b', "It's whole now! It's standing!"),
    ] },
    { id: 'bdl.dn-a3', when: DN, turns: [
      by('a', "Look at hers. The skeleton by the tent. Copy hers."),
      beat("Copying the skeleton by the tent bone by bone, they build theirs perfectly. The palaeontologist approves."),
      by('b', "Copying! Copying is allowed!"),
    ] },
    { id: 'bdl.dn-a4', when: DN, turns: [
      beat("After one collapse and one head on backwards, {a} and {b} finally build a dinosaur the palaeontologist accepts."),
      by('a', "Third time! A real dinosaur!"),
      by('b', "It took seventy-five million years and three tries."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'bdl.dn-t1', when: DN, turns: [
      beat("{a} and {b} have a skeleton on the frame with a tail at both ends and no head at all."),
      by('a', "Something's wrong."),
      by('b', "Something's very wrong. It looks like a sausage."),
    ] },
    { id: 'bdl.dn-t2', when: DN, turns: [
      by('b', "We've been digging for an hour. We've got half a dinosaur."),
      by('a', "The other half is still in the ground somewhere."),
      by('b', "Then dig!"),
    ] },
    { id: 'bdl.dn-t3', when: DN, turns: [
      beat("{a} has a leftover bone in each hand, and no idea where either of them goes."),
      by('a', "Where do these go?"),
      by('b', "Maybe it had extra legs?"),
    ] },
  ],
  'task-done.any': [
    { id: 'bdl.dn-dn1', when: DN, turns: [
      by('a', "We built a dinosaur. A real dinosaur."),
      by('b', "We should name it."),
      by('a', "We're calling it Don. It's old, and it's bony."),
    ] },
    { id: 'bdl.dn-dn2', when: DN, turns: [
      beat("{a} and {b} walk away from their dinosaur, looking back at it every few steps."),
      by('b', "It looks so proud."),
      by('a', "It looks so finished."),
    ] },
    { id: 'bdl.dn-dn3', when: DN, turns: [
      by('b', "Barrels next. More digging."),
      by('a', "My arms are already dug out."),
      by('b', "One more dig."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'bdl.dn-x1', when: DN, turns: [
      beat("{b} puts the skull on top, and the whole skeleton wobbles, sways, and collapses into a heap of bones."),
      by('b', "No! It was nearly done!"),
      by('a', "Start again! From the feet!"),
    ] },
    { id: 'bdl.dn-x2', when: DN, turns: [
      beat("The palaeontologist looks at their skeleton, tilts her head, and points: the ribs are on upside down."),
      by('a', "Upside down? Ribs have an upside?"),
      by('b', "Apparently! Rebuild!"),
    ] },
    { id: 'bdl.dn-x3', when: DN, turns: [
      beat("The palaeontologist counts the bones on the frame, and holds up one finger. One bone is missing."),
      by('a', "One? Just one?"),
      by('b', "Just one! Back to the dig!"),
    ] },
  ],
};

// ── the buried barrel (Botch or Watch: a digs, b watches from the rig) ──
const barrel = {
  'don-demo.gag': [
    { id: 'bdl.ob-d1', when: OB, turns: [
      don("In this Botch or Watch, read the old map, pick a square in this grid, and dig for the oil barrel with your name on it."),
      beat('He jabs a shovel into one square, hits something hard, and lifts it out triumphantly. It is a rock.'),
      don("That's a rock. The barrels are bigger than rocks. And they have names on them."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'bdl.ob-d2', when: OB, turns: [
      don("If the hole's empty, you fill it back in and pick a new square. The other one of you watches from the drilling rig."),
      don("Dig up your barrel and roll it out of the pit, and the next tip is yours. The map is very old. Some of it is coffee stains."),
      beat('Behind him, a racer stands in a hole up to the shoulders, holding up nothing but a shovel full of dirt.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'bdl.ob-w1', when: OB, turns: [
      by('b', "You did the last one? No, that was me. So you're digging."),
      by('a', "More digging. Of course."),
      by('b', "You're very good at it now."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'bdl.ob-w2', when: OB, turns: [
      by('a', "I'll dig. I'm already covered in dirt. Might as well finish the job."),
      by('b', "That's very noble."),
      by('a', "It's very dirty."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'bdl.ob-w3', when: OB, turns: [
      by('b', "My back's gone from the dinosaur. You."),
      by('a', "My back's gone too!"),
      by('b', "Your back's younger than mine. Go."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'bdl.ob-w4', when: OB, turns: [
      by('a', "'Who can dig?' You dug the whole garden last summer."),
      by('b', "I dug one hole. For a tree."),
      by('a', "And it was a great hole."),
    ] },
  ],
  'task-start.any': [
    { id: 'bdl.ob-s1', when: OB, turns: [
      beat("{a} unfolds the old map and holds it up against the staked-out grid, squinting."),
      by('a', "There's an X. But the X is a coffee stain."),
      by('b', "Ignore the coffee. Look for the real marks."),
    ] },
    { id: 'bdl.ob-s2', when: OB, turns: [
      by('b', "The map says near the rig. Pick a square near the rig."),
      by('a', "There are six squares near the rig."),
      by('b', "Then pick the nearest one."),
    ] },
    { id: 'bdl.ob-s3', when: OB, turns: [
      beat("{a} drives the shovel into the dry ground and starts digging, dirt flying over {a.posAdj} shoulder."),
      by('a', "How deep is it?"),
      by('b', "Keep going till you hit metal."),
    ] },
    { id: 'bdl.ob-s4', when: OB, turns: [
      by('a', "What if it's not in this square?"),
      by('b', "Then you fill it in and pick another."),
      by('a', "I was afraid you'd say that."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'bdl.ob-f1', when: OB, turns: [
      beat("CLANG. The shovel hits metal in the very first square. {a} digs round it, and there's a barrel with their names on it."),
      by('b', "First square! First try!"),
      by('a', "I'm a genius! Or very lucky! Either way!"),
    ] },
    { id: 'bdl.ob-f2', when: OB, turns: [
      by('a', "The map's upside down. Turn it round. There. That square."),
      beat("{a} digs in the square, and hits the barrel first time."),
      by('b', "The map was upside down? And you still found it?"),
    ] },
    { id: 'bdl.ob-f3', when: OB, turns: [
      beat("{a} heaves the barrel out of the hole and rolls it, rumbling, across the dirt to the rig."),
      by('b', "That's ours! It's got our names on!"),
      by('a', "First go! Not a single empty hole!"),
    ] },
    { id: 'bdl.ob-f4', when: OB, turns: [
      by('b', "First try! You found buried treasure!"),
      by('a', "It's an oil barrel."),
      by('b', "It's buried treasure to us."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'bdl.ob-a1', when: OB, turns: [
      by('b', "The ground's softer in that corner. Someone dug there recently. Dig there."),
      beat("{a} digs where the ground is soft, and a few shovels down, hits the barrel."),
      by('a', "Soft ground! Of course! Someone buried it there!"),
    ] },
    { id: 'bdl.ob-a2', when: OB, turns: [
      beat("Third square. {a} digs deeper this time, much deeper, and the shovel finally clangs on metal."),
      by('a', "Deeper! It was just deeper!"),
      by('b', "Dig it out! Roll it to the rig!"),
    ] },
    { id: 'bdl.ob-a3', when: OB, turns: [
      by('a', "The coffee stain isn't a coffee stain. It's a little drawing of the rig. The barrel's right under its shadow."),
      beat("{a} digs right where the rig's shadow falls, and hits the barrel."),
      by('b', "Under the shadow! You read the coffee!"),
    ] },
    { id: 'bdl.ob-a4', when: OB, turns: [
      beat("After three empty holes, {a} finally strikes the barrel in the fourth square."),
      by('a', "Fourth hole! Finally!"),
      by('b', "We've dug up half the badlands."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'bdl.ob-t1', when: OB, turns: [
      beat("{a} is standing in a hole so deep only {a.posAdj} head shows above the ground."),
      by('a', "Anything? Can you see anything from up there?"),
      by('b', "I can see your head. That's all."),
    ] },
    { id: 'bdl.ob-t2', when: OB, turns: [
      by('b', "That's four empty holes."),
      by('a', "Four holes, and four times filling them back in."),
      by('b', "That's eight holes' worth of digging."),
    ] },
    { id: 'bdl.ob-t3', when: OB, turns: [
      beat("{a} hits something hard, gets excited, and digs it out. It's another rock."),
      by('a', "Rock. Again. Why is everything a rock?"),
      by('b', "It's the badlands! It's mostly rocks!"),
    ] },
  ],
  'task-done.any': [
    { id: 'bdl.ob-dn1', when: OB, turns: [
      by('a', "I've dug more today than in my whole life."),
      by('b', "Dinosaurs and barrels."),
      by('a', "The two great buried treasures."),
    ] },
    { id: 'bdl.ob-dn2', when: OB, turns: [
      beat("{a} and {b} walk towards the glow of the campfire, as the sun goes down over the striped hills."),
      by('b', "Look at the sky. It's purple."),
      by('a', "Everything here is a different colour. Even the sky."),
    ] },
    { id: 'bdl.ob-dn3', when: OB, turns: [
      by('b', "Campfire. Chill Zone's at the campfire."),
      by('a', "A fire. A warm fire. Somewhere to sit."),
      by('b', "We've earned the fire."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'bdl.ob-x1', when: OB, turns: [
      beat("{a} digs, and digs, and digs, and hits nothing but more dirt at the bottom of an empty hole."),
      by('a', "Nothing! There's nothing down here!"),
      by('b', "Fill it in! Pick another square!"),
    ] },
    { id: 'bdl.ob-x2', when: OB, turns: [
      beat("{a} digs up a barrel, hauls it out, and reads the name on the side. It's another team's."),
      by('a', "It's not ours! It's theirs!"),
      by('b', "Put it back! Gently! Dig somewhere else!"),
    ] },
    { id: 'bdl.ob-x3', when: OB, turns: [
      beat("{a} misreads the map, digs in the wrong row entirely, and finds only an old boot."),
      by('a', "A boot? Who buries a boot?"),
      by('b', "Wrong row! Fill it in! Again!"),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'bdl.ob-v1', when: OB, turns: [
      by('b', "Dig! Dig! You're a digging machine!"),
      by('a', "I'm a very tired digging machine!"),
      by('b', "Tired machines still dig!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'bdl.ob-v2', when: OB, turns: [
      beat("{b} leans over the edge of the rig platform, watching every shovelful, holding {b.posAdj} breath."),
      by('b', "Is that metal? Was that a clang?"),
      by('a', "That was a rock! Stop getting excited!"),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'bdl.ob-v3', when: OB, turns: [
      beat("{b} climbs down off the rig and starts digging in the next square with bare hands."),
      by('b', "I'll do this one! Two holes at once!"),
      beat("The rig foreman blows a whistle and points {b} back up. A penalty."),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'bdl.ob-v4', when: OB, turns: [
      beat("{b} sits on the edge of the rig without a word, studying the old map over and over."),
      by('a', "Are you helping?"),
      by('b', "I'm thinking very hard. Silently. It's the same thing."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'bdl.ob-h1', when: OB, turns: [
      beat("While the foreman checks the rig, {b} quietly taps the ground over one square with a boot, and it sounds hollow."),
      by('a', "What was that?"),
      by('b', "Nothing. Dig there. No reason."),
    ] },
  ],
};

export default mergePools(place, roads, dino, barrel);
