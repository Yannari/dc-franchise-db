// Lei Island's challenges, stage by stage (js/rr/places/lei-island.js `stages`; director.js stageBeats).
//   the wedding ring  the-pier -> dive-down -> search-sand -> ring-up -> ring-tip   (Botch or Watch: a dives, b on the pier)
//   the fire walk     grass-skirts -> the-lift -> the-coals -> fire-dancer          (All-In: one carries the other)
// A shell or a bottle cap is not a ring: back down. A stop on the coals, a step off or a dropped partner: back to the
// start. The fire dancer is the place's own local (the avatar stands there: js/vp-rr-ep/locals.js).
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the wedding ring ──
    { id: 'li.st.pi1', when: at('ring-dive', 'the-pier'), turns: [
      beat('The old pier creaks over a bay of clear green water. Newlyweds throw their wedding rings in here for luck, which seems like very bad luck for the rings.'),
      by('b', "You dive, and I'll shout directions from up here."),
      by('a', "What directions? You won't be able to see anything."),
      by('b', "I'll shout them with confidence."),
    ] },
    { id: 'li.st.pi2', when: at('ring-dive', 'the-pier'), turns: [
      by('a', "How deep is it?"),
      beat('{b} drops a pebble off the edge of the pier. It takes a long time to stop sinking.'),
      by('b', "Medium deep. Big breath."),
    ] },
    { id: 'li.st.dd1', when: at('ring-dive', 'dive-down'), turns: [
      beat('{a} takes a huge breath, pinches {a.posAdj} nose, and jumps off the pier feet first.'),
      by('b', "Go down! Down is where the rings are!"),
      beat('{a} kicks down through the water, past the barnacled legs of the pier, towards the pale sand at the bottom.'),
    ] },
    { id: 'li.st.dd2', when: at('ring-dive', 'dive-down'), turns: [
      by('a', "Here goes. If I don't come back, tell my mum I was brave."),
      by('b', "You're diving in a bay, not going to war."),
      beat('{a} dives in with a perfect, tiny splash and disappears under the surface.'),
    ] },
    { id: 'li.st.ss1', when: at('ring-dive', 'search-sand'), turns: [
      beat('At the bottom, {a} sweeps a hand through the sand. Shells, pebbles, a fork. Then something small and round catches the light.'),
      by('b', "Anything? Have you got anything?"),
      beat('{b} is asking the water. The water does not answer.'),
    ] },
    { id: 'li.st.ss2', when: at('ring-dive', 'search-sand'), turns: [
      by('b', "Left! Go left! No, my left!"),
      beat('Under the water, {a} cannot hear a word, and searches in a slow circle round the bottom of a wooden post instead, which is exactly where the ring is.'),
      by('b', "See? My directions are working!"),
    ] },
    { id: 'li.st.ss3', when: at('ring-dive', 'search-sand'), turns: [
      beat('{a} brushes the sand away from a little gold glint and there it is: a wedding ring, half buried, shining like a coin.'),
      beat('{a} grabs it, clenches a fist round it, and kicks for the surface.'),
      by('b', "Bubbles! I see bubbles! You're coming up!"),
    ] },
    { id: 'li.st.ru1', when: at('ring-dive', 'ring-up'), turns: [
      beat('{a} bursts up out of the water, gasping, with one fist held high in the air.'),
      by('a', "I've got it! It's a real one! It's gold!"),
      by('b', "Don't wave it around! Pass it up! Carefully!"),
    ] },
    { id: 'li.st.ru2', when: at('ring-dive', 'ring-up'), turns: [
      by('b', "Give it here. Slowly. Slowly."),
      beat('{a} treads water and reaches up, {b} leans down off the pier, and the ring goes from hand to hand without a wobble.'),
      by('b', "Got it! Oh, it's beautiful. Someone's going to want this back."),
    ] },
    { id: 'li.st.rt1', when: at('ring-dive', 'ring-tip'), turns: [
      beat('{a} climbs up the ladder and drips all over the pier while {b} swaps the ring for the tip.'),
      by('a', "Did anyone ever have a wedding this good? We found a ring in the sea."),
      by('b', "We're not married. Please read the tip."),
    ] },
    { id: 'li.st.rt2', when: at('ring-dive', 'ring-tip'), turns: [
      by('b', "\"Put on a grass skirt and carry your partner over hot coals.\" Over what?"),
      by('a', "Hot coals. Oh, good. I was getting cold."),
      beat('They run off up the jungle path.'),
    ] },

    // ── the fire walk ──
    { id: 'li.st.gs1', when: at('fire-walk', 'grass-skirts'), turns: [
      beat('In a clearing on the jungle path, there are grass skirts and flower leis hanging on a rope, and a long bed of coals glowing orange beyond them.'),
      by('a', "I've always wanted to wear one of these."),
      by('b', "Not like this, though. Not right before walking on fire."),
    ] },
    { id: 'li.st.gs2', when: at('fire-walk', 'grass-skirts'), turns: [
      by('b', "How does it look?"),
      beat('{b} gives a little twirl. The grass skirt swishes, the lei bounces, and a flower falls off.'),
      by('a', "You look like a holiday postcard. Now pick me up."),
    ] },
    { id: 'li.st.lf1', when: at('fire-walk', 'the-lift'), turns: [
      by('a', "Piggyback or in my arms?"),
      by('b', "In your arms. I want to be carried like a bride."),
      beat('{a} scoops {b} up, staggers once, and finds {a.posAdj} balance.'),
    ] },
    { id: 'li.st.lf2', when: at('fire-walk', 'the-lift'), turns: [
      beat('{b} jumps up onto {a}\'s back and wraps both arms round {a.posAdj} neck.'),
      by('a', "You're strangling me. Loosen up a bit."),
      by('b', "If I loosen up, I'll fall in the fire."),
    ] },
    { id: 'li.st.co1', when: at('fire-walk', 'the-coals'), turns: [
      beat('{a} steps onto the coals and starts walking, quickly and steadily, with {b} in both arms and the heat rising round them both.'),
      by('b', "Don't stop! Whatever you do, don't stop!"),
      by('a', "I'm not stopping! Stopping is the worst idea I've ever heard!"),
    ] },
    { id: 'li.st.co2', when: at('fire-walk', 'the-coals'), turns: [
      by('a', "It's warm. It's actually not that bad. It's just very warm."),
      beat('{a} walks across the glowing coals like someone crossing a hot beach, quick little steps all the way.'),
      by('b', "You're amazing! You're like a fire wizard!"),
    ] },
    { id: 'li.st.co3', when: at('fire-walk', 'the-coals'), turns: [
      beat('Halfway across, sparks pop up round {a}\'s feet, and {a} speeds up into a sort of hot-footed jog.'),
      by('b', "Faster! The faster you go, the less it burns!"),
      by('a', "Is that true?"),
      by('b', "I really hope so!"),
    ] },
    { id: 'li.st.fd1', when: at('fire-walk', 'fire-dancer'), turns: [
      beat('At the far end of the coals, the fire dancer spins a burning torch over their head, nods, and hands over the tip.'),
      by('a', "My feet! Are my feet okay? Look at my feet."),
      by('b', "Your feet are fine. They're just a bit black."),
    ] },
    { id: 'li.st.fd2', when: at('fire-walk', 'fire-dancer'), turns: [
      by('b', "\"Run to the Chill Zone at the tiki hut.\" Can you run?"),
      by('a', "After that, I can do anything. I'm fireproof now."),
      beat('They run for the beach, grass skirts swishing.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the wedding ring ──
    { id: 'li.sf.dd1', when: at('ring-dive', 'dive-down'), turns: [
      beat('{a} dives in, gets about halfway down, runs out of breath, and shoots straight back up to the surface.'),
      by('a', "It's so deep! It's much deeper than it looks!"),
      by('b', "Bigger breath! Fill everything up!"),
    ] },
    { id: 'li.sf.dd2', when: at('ring-dive', 'dive-down'), turns: [
      by('b', "Why are you still floating?"),
      by('a', "I don't know! I keep trying to go down and I just bob!"),
      beat('{a} kicks and kicks, and stays exactly where {a.sub} is, like a cork in a bath.'),
    ] },
    { id: 'li.sf.ss1', when: at('ring-dive', 'search-sand'), turns: [
      beat('{a} comes up out of the water holding something shiny high in the air.'),
      by('a', "I got one!"),
      by('b', "That's a bottle cap. That's a bottle cap from a fizzy drink. Back down."),
    ] },
    { id: 'li.sf.ss2', when: at('ring-dive', 'search-sand'), turns: [
      by('a', "Is this one?"),
      beat('{a} holds up a perfectly round little shell with a hole in the middle.'),
      by('b', "It's a shell. It's a nice shell. It's not a ring. Go down again."),
    ] },
    { id: 'li.sf.ss3', when: at('ring-dive', 'search-sand'), turns: [
      beat('{a} stirs up so much sand on the bottom that the water turns into a brown cloud, and comes back up empty-handed and blinking.'),
      by('a', "I can't see anything down there anymore. I made a sandstorm."),
      by('b', "Wait for it to settle, and go again."),
    ] },
    { id: 'li.sf.ru1', when: at('ring-dive', 'ring-up'), turns: [
      beat('{a} reaches up to pass the ring to {b}, their fingers touch, and the ring slips between them and falls back into the bay with a tiny plop.'),
      by('b', "No! Why? Why would the sea do this?"),
      by('a', "The sea didn't do it. We did it. Together."),
    ] },
    { id: 'li.sf.ru2', when: at('ring-dive', 'ring-up'), turns: [
      by('a', "Catch!"),
      beat('{a} throws the ring up at the pier. It bounces off a plank and drops straight back into the water.'),
      by('b', "Why would you throw it? Who throws a ring?"),
    ] },

    // ── the fire walk ──
    { id: 'li.sf.gs1', when: at('fire-walk', 'grass-skirts'), turns: [
      beat('{a} ties on the grass skirt, takes one step, and the whole skirt drops down round {a.posAdj} ankles.'),
      by('b', "Tie it tighter!"),
      by('a', "It's grass! You can't tie grass tight!"),
    ] },
    { id: 'li.sf.gs2', when: at('fire-walk', 'grass-skirts'), turns: [
      by('a', "Where's your lei?"),
      beat('{b} looks down. The lei is not there. It is hanging off a bush on the path behind them.'),
      by('b', "Hang on. I'll get it. Nobody move."),
    ] },
    { id: 'li.sf.lf1', when: at('fire-walk', 'the-lift'), turns: [
      beat('{a} tries to lift {b}, gets {b} about an inch off the ground, and puts {b.obj} straight back down.'),
      by('a', "Just a second. My arms are just warming up."),
      by('b', "Try the piggyback. Backs are stronger than arms."),
    ] },
    { id: 'li.sf.lf2', when: at('fire-walk', 'the-lift'), turns: [
      by('b', "Jump on, then!"),
      beat('{a} jumps on {b}\'s back with a bit too much enthusiasm, and they both fall over into the grass.'),
      by('a', "Again. Gently this time."),
    ] },
    { id: 'li.sf.co1', when: at('fire-walk', 'the-coals'), turns: [
      beat('Halfway across the coals, {a} stops dead, because {b}\'s grass skirt is tickling {a.posAdj} nose.'),
      by('a', "I'm going to sneeze."),
      by('b', "Don't stop! Don't stop! Oh, you stopped."),
      beat('The fire dancer points them back to the start.'),
    ] },
    { id: 'li.sf.co2', when: at('fire-walk', 'the-coals'), turns: [
      by('a', "Hot, hot, hot, hot, hot!"),
      beat('{a} dances sideways off the edge of the coals and onto the grass, which is much cooler and completely against the rules.'),
      by('b', "That's off the side! We have to start again!"),
    ] },
    { id: 'li.sf.co3', when: at('fire-walk', 'the-coals'), turns: [
      beat('{b} starts to slide down {a}\'s back, lower and lower, until {b.posAdj} feet touch the coals.'),
      by('b', "Ow! Ow! I'm on the fire! I'm on the fire!"),
      by('a', "Then that doesn't count. Back to the start."),
    ] },
  ],
};
