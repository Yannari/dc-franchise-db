// Haunted Castle's challenges, stage by stage (js/rr/places/haunted-castle.js `stages`; director.js stageBeats).
//   the coffin  find-coffin -> climb-in -> the-push -> graveyard-gate -> grave-digger   (All-In: one pushes, one lies in it)
//   the gym     warm-up -> the-split -> the-vault -> coach-nods                         (Botch or Watch: a performs, b on the bench)
// A coffin that tips or loses its lid goes back to the castle gate; a wobble on the beam starts the routine again. The
// coach is the place's own local (the avatar stands there: js/vp-rr-ep/locals.js).
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the coffin ──
    { id: 'hcs.st.fc1', when: at('coffin', 'find-coffin'), turns: [
      beat('The coffin hall is long and cold and lit by candles, and there are coffins everywhere: on stands, on the floor, leaning against the walls.'),
      by('a', "They've all got names on them. We need ours."),
      by('b', "This is so creepy."),
    ] },
    { id: 'hcs.st.fc2', when: at('coffin', 'find-coffin'), turns: [
      beat('{b} wipes the dust off a brass plate on a coffin lid and reads it out loud.'),
      by('b', "It's us. It's got both our names on it. That's horrible."),
      by('a', "That's ours. That's so weird."),
    ] },
    { id: 'hcs.st.fc3', when: at('coffin', 'find-coffin'), turns: [
      by('a', "Split up. You take the left side, I'll take the right."),
      by('b', "Split up? In a haunted castle? No way."),
      beat('They search the coffins together, side by side, holding hands, which is much better.'),
    ] },
    { id: 'hcs.st.ci1', when: at('coffin', 'climb-in'), turns: [
      by('a', "I've got the tip, so I push. You get in."),
      by('b', "Why do you always get the tip?"),
      beat('{b} climbs into the coffin, lies down, and crosses {b.posAdj} arms over {b.posAdj} chest.'),
      by('b', "How do I look?"),
    ] },
    { id: 'hcs.st.ci2', when: at('coffin', 'climb-in'), turns: [
      beat('{b} lies down in the coffin, which is lined with old red velvet and smells of a very old attic.'),
      by('b', "It's actually kind of comfy. That's bad, right?"),
      by('a', "Close the lid? Or leave it open?"),
      by('b', "Open. Definitely open."),
    ] },
    { id: 'hcs.st.pu1', when: at('coffin', 'the-push'), turns: [
      beat('{a} pushes the coffin out of the castle gate and onto the hill road, and gravity takes over almost straight away.'),
      by('b', "Slow down! We're going too fast!"),
      by('a', "I'm not even pushing! I'm just chasing it!"),
    ] },
    { id: 'hcs.st.pu2', when: at('coffin', 'the-push'), turns: [
      by('a', "How is it in there?"),
      by('b', "Bumpy. Really bumpy."),
      beat('{a} steers the coffin round a pothole and down the dark, winding road, its little wheels squeaking.'),
    ] },
    { id: 'hcs.st.pu3', when: at('coffin', 'the-push'), turns: [
      beat('A bat swoops down out of the dark and flaps right over the open coffin.'),
      by('b', "Bat! There's a bat!"),
      by('a', "It's fine. Keep your arms in."),
    ] },
    { id: 'hcs.st.gg1', when: at('coffin', 'graveyard-gate'), turns: [
      beat('The graveyard gate creaks open in the rain, and the lamps on the posts throw long, wobbly shadows over the gravestones.'),
      by('b', "I really don't like lying in a coffin in a graveyard."),
      by('a', "Nearly there. Hang on."),
    ] },
    { id: 'hcs.st.gg2', when: at('coffin', 'graveyard-gate'), turns: [
      by('a', "Which way? There are three paths."),
      by('b', "Follow the lights."),
      beat('They follow the lights, and they lead straight to an open grave with a shovel stuck in the dirt beside it.'),
    ] },
    { id: 'hcs.st.gd1', when: at('coffin', 'grave-digger'), turns: [
      beat('A grave digger leans on a shovel next to an open grave, looks at the coffin, looks at {b} inside it, and hands over the tip.'),
      by('b', "Can I get out now? Please?"),
      by('a', "You can get out now."),
    ] },
    { id: 'hcs.st.gd2', when: at('coffin', 'grave-digger'), turns: [
      by('a', "\"Ride a horse to the gym.\" A horse!"),
      by('b', "Anything's better than a coffin."),
      beat('{b} climbs out of the coffin and stretches, and every bone in {b.posAdj} back cracks at once.'),
    ] },

    // ── the gym ──
    { id: 'hcs.st.wu1', when: at('gym', 'warm-up'), turns: [
      beat('In the old gymnastics hall, the coach points {b} to the bench by the stairs and points {a} at the balance beam.'),
      by('a', "I haven't done the splits since I was eight."),
      by('b', "Then stretch. Stretch everything."),
    ] },
    { id: 'hcs.st.wu2', when: at('gym', 'warm-up'), turns: [
      by('b', "Touch your toes."),
      beat('{a} bends forward and gets about as far as both knees.'),
      by('a', "I can't reach them."),
    ] },
    { id: 'hcs.st.sp1', when: at('gym', 'the-split'), turns: [
      beat('{a} climbs up onto the beam, wobbles, steadies, and slides slowly, slowly down into a full split.'),
      by('b', "You're doing it! You're actually doing it!"),
      by('a', "I'm doing it! Somebody's going to have to help me up, though."),
    ] },
    { id: 'hcs.st.sp2', when: at('gym', 'the-split'), turns: [
      by('b', "Arms out! Like a swan!"),
      beat('{a} throws both arms out wide and holds the split on the beam, perfectly still, while the coach watches without blinking.'),
      by('a', "This really hurts."),
    ] },
    { id: 'hcs.st.va1', when: at('gym', 'the-vault'), turns: [
      beat('{a} runs at the vault, hits the springboard, flips over in mid-air, and somehow lands on both feet.'),
      by('b', "What was that? Where did that come from?"),
      by('a', "I have no idea. It just happened."),
    ] },
    { id: 'hcs.st.va2', when: at('gym', 'the-vault'), turns: [
      by('b', "Run fast, push hard, tuck your knees in!"),
      beat('{a} runs fast, pushes hard, tucks both knees in, and rolls right over the vault and onto the mat.'),
      by('a', "Did that count? Tell me that counted."),
    ] },
    { id: 'hcs.st.cn1', when: at('gym', 'coach-nods'), turns: [
      beat('The coach stares at {a} for a long, terrible moment, then gives one short nod and holds out the tip.'),
      by('a', "A nod! That's a nod! I got a nod!"),
      by('b', "I don't think that coach nods at anyone."),
    ] },
    { id: 'hcs.st.cn2', when: at('gym', 'coach-nods'), turns: [
      by('b', "\"Make your way on foot to the Chill Zone.\" Can you walk?"),
      by('a', "Sort of. My legs don't feel right."),
      beat('{b} doesn\'t carry {a.obj}, but {a} limps along beside {b} as fast as possible.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the coffin ──
    { id: 'hcs.sf.fc1', when: at('coffin', 'find-coffin'), turns: [
      beat('{a} heaves open a heavy coffin lid, and a skeleton inside sits up and stares at {a.obj}.'),
      by('a', "Aaaaah! Not ours! Not ours!"),
      beat('{a} slams the lid shut again. It is a prop. It is still not their coffin.'),
    ] },
    { id: 'hcs.sf.fc2', when: at('coffin', 'find-coffin'), turns: [
      by('b', "This is it! This has our names on it!"),
      by('a', "That's not even our names."),
      by('b', "It's dark! They look the same!"),
    ] },
    { id: 'hcs.sf.ci1', when: at('coffin', 'climb-in'), turns: [
      beat('{b} puts one leg in the coffin, then takes it out again.'),
      by('b', "I'm not getting in a coffin."),
      by('a', "You have to. Please just get in."),
    ] },
    { id: 'hcs.sf.ci2', when: at('coffin', 'climb-in'), turns: [
      by('a', "Why aren't you lying down?"),
      by('b', "Because something in here just moved."),
      beat('It was a moth. It takes them a while to find it and get it out.'),
    ] },
    { id: 'hcs.sf.pu1', when: at('coffin', 'the-push'), turns: [
      beat('The coffin hits a rock, tips over sideways, and {b} rolls out onto the road in a heap.'),
      by('b', "Ow! You tipped me out!"),
      by('a', "Back to the gate. We have to start the push again."),
    ] },
    { id: 'hcs.sf.pu2', when: at('coffin', 'the-push'), turns: [
      by('a', "Whoa, whoa, whoa!"),
      beat('The coffin gets away from {a}, rattles off down the hill on its own, and the lid flies off into a hedge.'),
      by('b', "I'm still in here! Where are you?"),
    ] },
    { id: 'hcs.sf.pu3', when: at('coffin', 'the-push'), turns: [
      beat('One of the coffin\'s little wheels pops off and goes rolling away down the hill without them.'),
      by('a', "That's a problem."),
      by('b', "Now we're scraping along the ground. Great."),
    ] },
    { id: 'hcs.sf.gg1', when: at('coffin', 'graveyard-gate'), turns: [
      by('a', "Left or right?"),
      by('b', "I can only see the sky! Left?"),
      beat('Left leads to a wall. They have to turn the coffin round, which takes a very long time.'),
    ] },
    { id: 'hcs.sf.gg2', when: at('coffin', 'graveyard-gate'), turns: [
      beat('{a} pushes the coffin right through the graveyard and out the back gate on the other side, missing the grave digger completely.'),
      by('b', "Why are we leaving? We're leaving the graveyard!"),
      by('a', "I thought this was the way!"),
    ] },

    // ── the gym ──
    { id: 'hcs.sf.sp1', when: at('gym', 'the-split'), turns: [
      beat('{a} slides down into the split, wobbles left, wobbles right, and falls off the beam onto the mat with a thump.'),
      by('a', "I was so close."),
      beat('The coach points at the start of the beam. Again, from the beginning.'),
    ] },
    { id: 'hcs.sf.sp2', when: at('gym', 'the-split'), turns: [
      by('b', "Go lower! All the way!"),
      by('a', "This is all the way! This is it!"),
      beat('The coach looks at the gap between {a} and the beam, which is quite big, and shakes their head.'),
    ] },
    { id: 'hcs.sf.sp3', when: at('gym', 'the-split'), turns: [
      beat('{a} gets halfway down into the split, and something in {a.posAdj} trousers rips very loudly.'),
      by('a', "That was just my trousers. I'm fine."),
      by('b', "Keep going! Forget the trousers!"),
    ] },
    { id: 'hcs.sf.va1', when: at('gym', 'the-vault'), turns: [
      beat('{a} runs at the vault, hits the springboard, and goes straight into the side of it instead of over the top.'),
      by('b', "Oh no. Are you okay?"),
      by('a', "I'm okay. I just need a second."),
    ] },
    { id: 'hcs.sf.va2', when: at('gym', 'the-vault'), turns: [
      by('a', "This time. I'm doing it this time."),
      beat('{a} runs at the vault, stops dead right in front of it, and pats it nervously.'),
      by('b', "You have to jump over it!"),
    ] },
  ],
};
