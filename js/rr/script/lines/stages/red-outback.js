// Red Outback's challenges, stage by stage (js/rr/places/red-outback.js `stages`; director.js stageBeats).
//   the emus      the-corral -> emu-chase -> the-halter -> mounted                 (All-In: an emu each)
//   the bungee    the-platform -> the-drop -> sheep-grab -> pulled-up             (Botch or Watch: a jumps, b watches)
//   the shearing  hold-still -> the-clippers -> bald-sheep -> the-brand           (All-In: shear until a brand shows)
// An emu that bolts with its halter on has to be caught again; an empty-handed jump means jumping again; a bald sheep
// with no brand means another sheep.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the emus ──
    { id: 'ro.st.cr1', when: at('emu-catch', 'the-corral'), turns: [
      beat('In the dusty corral, a flock of emus runs round and round in circles, kicking up red dirt.'),
      by('b', "We have to ride those?"),
      by('a', "We have to catch them first. Then ride them."),
    ] },
    { id: 'ro.st.cr2', when: at('emu-catch', 'the-corral'), turns: [
      by('a', "Pick a calm one."),
      by('b', "None of them are calm. Look at their eyes."),
      beat('They climb over the fence with a halter each.'),
    ] },
    { id: 'ro.st.ch1', when: at('emu-catch', 'emu-chase'), turns: [
      beat('{a} chases an emu round the corral, arms out, and slowly steers it into a corner.'),
      by('b', "You've got it trapped! Easy now!"),
      by('a', "Easy. Easy, big bird."),
    ] },
    { id: 'ro.st.ch2', when: at('emu-catch', 'emu-chase'), turns: [
      by('b', "Go slow. Don't run at it."),
      beat('{b} walks slowly towards an emu, humming, and the emu stops and stares.'),
      by('a', "It likes the humming. Keep humming."),
    ] },
    { id: 'ro.st.ht1', when: at('emu-catch', 'the-halter'), turns: [
      beat('{a} slips the halter over the emu\'s head in one smooth move. The emu blinks, and stands still.'),
      by('a', "Got it! It's on!"),
      by('b', "Now do mine. Please do mine."),
    ] },
    { id: 'ro.st.ht2', when: at('emu-catch', 'the-halter'), turns: [
      by('b', "Hold its head. I'll do the strap."),
      beat('They work together, one holding, one buckling, until both emus are haltered.'),
      by('b', "Done. Both on. Don't let go of yours."),
    ] },
    { id: 'ro.st.mt1', when: at('emu-catch', 'mounted'), turns: [
      beat('They climb onto their emus\' backs. The birds wobble, settle, and stand up tall.'),
      by('b', "I'm riding a bird. I'm actually riding a bird."),
      by('a', "Tip says the hanging rock. Point them that way."),
    ] },
    { id: 'ro.st.mt2', when: at('emu-catch', 'mounted'), turns: [
      by('a', "Which way is forward on an emu?"),
      by('b', "The pointy end. Hold on."),
      beat('The emus take off across the plain at a wobbly run.'),
    ] },

    // ── the bungee ──
    { id: 'ro.st.pf1', when: at('sheep-bungee', 'the-platform'), turns: [
      beat('On the edge of the hanging rock, a bungee rope is tied round a stone pillar. Far below is a pen full of sheep.'),
      by('b', "You jump. Grab a sheep. Come back up."),
      by('a', "You make it sound so easy."),
    ] },
    { id: 'ro.st.pf2', when: at('sheep-bungee', 'the-platform'), turns: [
      by('a', "Is the rope tied on properly?"),
      by('b', "It's tied round a rock. Rocks don't move."),
      beat('{a} steps up to the edge.'),
    ] },
    { id: 'ro.st.dr1', when: at('sheep-bungee', 'the-drop'), turns: [
      beat('{a} jumps, and drops straight down the red face of the rock, yelling all the way.'),
      by('b', "Arms out! Get ready to grab!"),
      by('a', "Aaaaah! The sheep! Where are the sheep?"),
    ] },
    { id: 'ro.st.dr2', when: at('sheep-bungee', 'the-drop'), turns: [
      by('b', "Three, two, one, go!"),
      beat('{a} dives off the rock, and the rope unrolls behind {a.obj} down the cliff.'),
      by('a', "Aaaaaaah!"),
    ] },
    { id: 'ro.st.sg1', when: at('sheep-bungee', 'sheep-grab'), turns: [
      beat('At the bottom of the drop, {a} swoops down over the pen and grabs a sheep around the middle.'),
      by('a', "Got one! Got a sheep!"),
      beat('The sheep says nothing. It just looks very surprised.'),
    ] },
    { id: 'ro.st.sg2', when: at('sheep-bungee', 'sheep-grab'), turns: [
      by('b', "Grab! Grab now!"),
      beat('{a} reaches down at exactly the right moment and scoops up a fluffy sheep in both arms.'),
      by('b', "Yes! Don't drop it!"),
    ] },
    { id: 'ro.st.pu1', when: at('sheep-bungee', 'pulled-up'), turns: [
      beat('The rope pulls {a} back up the rock face, still hugging the sheep.'),
      by('b', "Hold on to it! Don't let go!"),
      by('a', "It's so fluffy! It's like holding a cloud!"),
    ] },
    { id: 'ro.st.pu2', when: at('sheep-bungee', 'pulled-up'), turns: [
      by('a', "Take it. Take the sheep."),
      beat('{a} is winched up onto the platform and hands the sheep to {b}, who holds it like a baby.'),
      by('b', "Hello, sheep. You're coming with us."),
    ] },

    // ── the shearing ──
    { id: 'ro.st.hs1', when: at('shearing', 'hold-still'), turns: [
      beat('In the shearing shed, {b} sits the sheep on its bottom and holds it still between {b.posAdj} knees.'),
      by('b', "Okay. It's calm. I think it's calm."),
      by('a', "Keep it like that. I'm getting the clippers."),
    ] },
    { id: 'ro.st.hs2', when: at('shearing', 'hold-still'), turns: [
      by('a', "Talk to it. Keep it happy."),
      by('b', "Hello, sheep. You're a lovely sheep. This won't hurt."),
      beat('The sheep blinks, and stays still.'),
    ] },
    { id: 'ro.st.cl1', when: at('shearing', 'the-clippers'), turns: [
      beat('{a} runs the old clippers down the sheep\'s side, and a thick blanket of wool peels away.'),
      by('a', "It's working! Look at that!"),
      by('b', "Keep going. Look for a mark on the skin."),
    ] },
    { id: 'ro.st.cl2', when: at('shearing', 'the-clippers'), turns: [
      by('b', "Gently round the legs."),
      beat('{a} clips round the legs, very carefully, while wool piles up on the floor.'),
      by('b', "Nearly bald. Keep going."),
    ] },
    { id: 'ro.st.bs1', when: at('shearing', 'bald-sheep'), turns: [
      beat('The last of the wool comes off. On the sheep\'s back, right in the middle, is the race\'s brand.'),
      by('b', "There! The brand!"),
      by('a', "First sheep! First try!"),
    ] },
    { id: 'ro.st.bs2', when: at('shearing', 'bald-sheep'), turns: [
      by('a', "Anything on its back?"),
      by('b', "Turn it over. Yes! There it is!"),
      beat('A little mark, burned into the skin: the race\'s brand.'),
    ] },
    { id: 'ro.st.br1', when: at('shearing', 'the-brand'), turns: [
      beat('The shearer checks the brand, nods, and hands over the tip.'),
      by('b', "Bye, sheep. Sorry about your coat."),
      by('a', "It'll grow back. Chill Zone, top of the rock."),
    ] },
    { id: 'ro.st.br2', when: at('shearing', 'the-brand'), turns: [
      by('a', "We have so much wool on us."),
      by('b', "We look like sheep now. Let's go."),
      beat('They run out of the shed, shaking wool off their clothes.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the emus ──
    { id: 'ro.sf.ch1', when: at('emu-catch', 'emu-chase'), turns: [
      beat('{a} dives at an emu, misses, and lands face first in the red dirt.'),
      by('b', "Are you okay?"),
      by('a', "I've got dirt in my teeth. The emu's fine, though."),
    ] },
    { id: 'ro.sf.ch2', when: at('emu-catch', 'emu-chase'), turns: [
      by('b', "It's coming back! It's chasing me now!"),
      beat('The emu chases {b} round the corral twice before giving up.'),
      by('a', "That's not how it's supposed to go."),
    ] },
    { id: 'ro.sf.ht1', when: at('emu-catch', 'the-halter'), turns: [
      beat('{a} gets the halter half on, and the emu bolts, halter flapping, all the way to the other side of the corral.'),
      by('a', "Come back! That's my halter!"),
      by('b', "Now we have to catch it again."),
    ] },
    { id: 'ro.sf.ht2', when: at('emu-catch', 'the-halter'), turns: [
      by('b', "Why is it on its foot?"),
      by('a', "It moved its head! It moved it at the last second!"),
      beat('The emu kicks the halter off and runs away.'),
    ] },

    // ── the bungee ──
    { id: 'ro.sf.pf1', when: at('sheep-bungee', 'the-platform'), turns: [
      beat('{a} stands on the edge of the rock, looks down, and steps back.'),
      by('a', "That's a long way down."),
      by('b', "It's a long way down to the sheep! That's where they are!"),
    ] },
    { id: 'ro.sf.pf2', when: at('sheep-bungee', 'the-platform'), turns: [
      by('b', "Just lean forward."),
      beat('{a} leans forward, then grabs the pillar and doesn\'t let go.'),
      by('a', "Give me a minute. Just one."),
    ] },
    { id: 'ro.sf.sg1', when: at('sheep-bungee', 'sheep-grab'), turns: [
      beat('{a} swoops down over the pen, grabs, and comes back up with a handful of wool and no sheep.'),
      by('a', "It came off! The wool came off in my hand!"),
      by('b', "Back up. Jump again."),
    ] },
    { id: 'ro.sf.sg2', when: at('sheep-bungee', 'sheep-grab'), turns: [
      by('b', "Now! Grab now!"),
      beat('{a} grabs a second too late. The sheep trots off, and {a} bounces back up empty-handed.'),
      by('a', "Missed it. Pull me up. I'm going again."),
    ] },
    { id: 'ro.sf.pu1', when: at('sheep-bungee', 'pulled-up'), turns: [
      beat('Halfway up the cliff, the sheep wriggles free and drops gently back into the pen.'),
      by('a', "It escaped! It jumped!"),
      by('b', "Sheep can't jump that far!"),
    ] },
    { id: 'ro.sf.pu2', when: at('sheep-bungee', 'pulled-up'), turns: [
      by('a', "It's kicking me! It's kicking!"),
      beat('{a} lets go to block a hoof, and the sheep falls back into the pen with a soft thud.'),
      by('b', "Up you come. Try another one."),
    ] },

    // ── the shearing ──
    { id: 'ro.sf.hs1', when: at('shearing', 'hold-still'), turns: [
      beat('The sheep kicks out, wriggles free, and trots off across the shed, bleating.'),
      by('b', "It's getting away!"),
      by('a', "Catch it! Grab its back legs!"),
    ] },
    { id: 'ro.sf.hs2', when: at('shearing', 'hold-still'), turns: [
      by('a', "Why is it on top of you?"),
      by('b', "It sat on me! It sat on me on purpose!"),
      beat('The sheep gets up, shakes, and wanders off. They have to catch it again.'),
    ] },
    { id: 'ro.sf.cl1', when: at('shearing', 'the-clippers'), turns: [
      beat('The clippers jam in the thick wool and stop.'),
      by('a', "Stuck. They're stuck."),
      by('b', "Pull them out. Gently. Gently!"),
    ] },
    { id: 'ro.sf.cl2', when: at('shearing', 'the-clippers'), turns: [
      by('b', "You've only done one side."),
      by('a', "It keeps turning round!"),
      beat('The sheep is half bald and very unimpressed.'),
    ] },
    { id: 'ro.sf.bs1', when: at('shearing', 'bald-sheep'), turns: [
      beat('The last of the wool comes off, and the sheep is completely bald, completely pink, and completely blank.'),
      by('a', "No brand. No brand anywhere."),
      by('b', "Back to the pen. Another sheep."),
    ] },
    { id: 'ro.sf.bs2', when: at('shearing', 'bald-sheep'), turns: [
      by('b', "Check the legs. Check under the chin."),
      beat('They check everywhere. Nothing. Just a very cold, very bald sheep.'),
      by('a', "Sorry, sheep. Next one."),
    ] },
  ],
};
