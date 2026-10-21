// Jungle Ruins' challenges, stage by stage (js/rr/places/jungle-ruins.js `stages`; director.js stageBeats).
//   the trail  painted-stones -> piranha-log -> caterpillars -> ruins-foot              (All-In: both, to the ruins)
//   the idol   idol-wall -> carvings -> pick-one -> scratch-test -> real-gold            (All-In: one real idol among fakes)
// A fall off the log sends a team back to the bank; a painted clay idol goes back in its niche. The guide is the place's
// own local.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the trail ──
    { id: 'jr.st.ps1', when: at('jungle-trail', 'painted-stones'), turns: [
      beat('The trail through the rainforest is marked with stones painted bright red, one every few steps.'),
      by('a', "Follow the red stones. Don't lose them."),
      by('b', "There's one. And there. This way."),
    ] },
    { id: 'jr.st.ps2', when: at('jungle-trail', 'painted-stones'), turns: [
      by('b', "It's so hot in here. It's like breathing soup."),
      by('a', "Keep your eyes on the stones."),
      beat('They push through the vines from one red stone to the next.'),
    ] },
    { id: 'jr.st.pl1', when: at('jungle-trail', 'piranha-log'), turns: [
      beat('The trail stops at a stream. A fallen log is the only way across, and the water under it is full of little fins.'),
      by('b', "Those are piranhas. Those are actual piranhas."),
      by('a', "Then don't fall in. Arms out. Walk."),
    ] },
    { id: 'jr.st.pl2', when: at('jungle-trail', 'piranha-log'), turns: [
      by('a', "Slowly. Watch my feet."),
      beat('They inch along the log, arms out, while the fins circle underneath.'),
      by('b', "Made it. I'm never doing that again."),
    ] },
    { id: 'jr.st.cp1', when: at('jungle-trail', 'caterpillars'), turns: [
      beat('A caterpillar the size of a dog drops out of a tree onto the path in front of them, and stares.'),
      by('b', "What is that? Why is it so big?"),
      by('a', "It's a caterpillar. It eats leaves. Just walk round it."),
    ] },
    { id: 'jr.st.cp2', when: at('jungle-trail', 'caterpillars'), turns: [
      by('a', "Another one. Above you."),
      by('b', "Don't tell me! Just say run!"),
      beat('They duck under the branch and run past before it drops.'),
    ] },
    { id: 'jr.st.rf1', when: at('jungle-trail', 'ruins-foot'), turns: [
      beat('The trees open up, and the old stone ruins rise out of the jungle in front of them, step after step.'),
      by('b', "Whoa. Look at that."),
      by('a', "We made it. Tip's at the bottom."),
    ] },
    { id: 'jr.st.rf2', when: at('jungle-trail', 'ruins-foot'), turns: [
      by('a', "Find a golden idol. The real one."),
      by('b', "How many fake ones are there?"),
      by('a', "Let's go and find out."),
    ] },

    // ── the idol ──
    { id: 'jr.st.iw1', when: at('golden-idol', 'idol-wall'), turns: [
      beat('The carved stone wall is full of little niches, and in every one sits a small golden idol, all exactly the same.'),
      by('b', "Only one of these is real gold."),
      by('a', "Then the rest are fakes. Look for a difference."),
    ] },
    { id: 'jr.st.iw2', when: at('golden-idol', 'idol-wall'), turns: [
      by('a', "There must be fifty of them."),
      by('b', "The carvings. Maybe the carvings tell you which one."),
      beat('They step closer to the wall and start reading the stone.'),
    ] },
    { id: 'jr.st.cv1', when: at('golden-idol', 'carvings'), turns: [
      beat('{b} runs a hand over the carvings around the niches: suns, snakes, faces, and one sun with its rays pointing down.'),
      by('b', "This one's upside down. Why would it be upside down?"),
      by('a', "Because it's pointing at something. Look under it."),
    ] },
    { id: 'jr.st.cv2', when: at('golden-idol', 'carvings'), turns: [
      by('a', "The face. Every carving has a face looking left, and this one looks right."),
      by('b', "At that niche. It's looking straight at that one."),
      by('a', "Then that's the one. Grab it."),
    ] },
    { id: 'jr.st.pk1', when: at('golden-idol', 'pick-one'), turns: [
      beat('{a} lifts the idol out of its niche. It\'s heavy, much heavier than it looks.'),
      by('a', "Feel that. Feel how heavy it is."),
      by('b', "Gold's heavy. Take it to the guide."),
    ] },
    { id: 'jr.st.pk2', when: at('golden-idol', 'pick-one'), turns: [
      by('b', "This one. I've got a good feeling."),
      beat('{b} takes the idol down and carries it over to the old guide with both hands.'),
      by('a', "Careful. Don't drop it."),
    ] },
    { id: 'jr.st.st1', when: at('golden-idol', 'scratch-test'), turns: [
      beat('The guide scratches the idol with the edge of a coin. Underneath, it shines gold.'),
      by('b', "Is that good? Is gold under there?"),
      by('a', "It's still gold. It's gold all the way through."),
    ] },
    { id: 'jr.st.st2', when: at('golden-idol', 'scratch-test'), turns: [
      by('a', "Please be real. Please be real."),
      beat('The guide scratches, looks, and nods slowly.'),
      by('b', "Yes! Real gold!"),
    ] },
    { id: 'jr.st.rg1', when: at('golden-idol', 'real-gold'), turns: [
      beat('The guide hands the idol back with the tip. It glints in the sun.'),
      by('b', "We found it! The real one!"),
      by('a', "Up the ruins. The Chill Zone's at the top."),
    ] },
    { id: 'jr.st.rg2', when: at('golden-idol', 'real-gold'), turns: [
      by('a', "Can we keep it?"),
      by('b', "No. Put it back. We've got stairs to climb."),
      beat('They run for the ruin steps.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the trail ──
    { id: 'jr.sf.ps1', when: at('jungle-trail', 'painted-stones'), turns: [
      beat('They look around, and there are no red stones anywhere. Just jungle in every direction.'),
      by('a', "Where's the last one? Where did we leave the trail?"),
      by('b', "Back. Go back until we see red."),
    ] },
    { id: 'jr.sf.ps2', when: at('jungle-trail', 'painted-stones'), turns: [
      by('b', "That's a red stone!"),
      by('a', "That's a red flower."),
      beat('They follow the flower for a while before they work it out.'),
    ] },
    { id: 'jr.sf.pl1', when: at('jungle-trail', 'piranha-log'), turns: [
      beat('Halfway across the log, {b}\'s foot slips on the moss, and {b} drops into the stream.'),
      by('b', "Get me out! Get me out!"),
      by('a', "Swim to the bank! Fast!"),
    ] },
    { id: 'jr.sf.pl2', when: at('jungle-trail', 'piranha-log'), turns: [
      by('a', "Don't look down at them."),
      beat('{a} looks down at them, wobbles, and falls in with a big splash.'),
      by('b', "I told you not to look!"),
    ] },
    { id: 'jr.sf.cp1', when: at('jungle-trail', 'caterpillars'), turns: [
      beat('A giant caterpillar lands right on {b}\'s shoulder. {b} screams and runs straight back the way they came.'),
      by('a', "Wrong way! Come back!"),
      by('b', "It touched me! It touched me with its feet!"),
    ] },
    { id: 'jr.sf.cp2', when: at('jungle-trail', 'caterpillars'), turns: [
      by('b', "There's three of them now. On the path."),
      by('a', "Go round. Through the bushes."),
      beat('They go round, through the bushes, and lose the trail.'),
    ] },

    // ── the idol ──
    { id: 'jr.sf.cv1', when: at('golden-idol', 'carvings'), turns: [
      beat('They stare at the carvings for a long time. Suns, snakes, faces. None of it means anything.'),
      by('b', "I've got nothing. Have you got anything?"),
      by('a', "I've got a headache."),
    ] },
    { id: 'jr.sf.cv2', when: at('golden-idol', 'carvings'), turns: [
      by('a', "The snake. It's pointing at the snake."),
      by('b', "They're all snakes. Every carving has a snake."),
      beat('They start again from the top of the wall.'),
    ] },
    { id: 'jr.sf.st1', when: at('golden-idol', 'scratch-test'), turns: [
      beat('The guide scratches the idol with the coin, and grey clay shows through the gold paint.'),
      by('a', "Fake. It's a fake."),
      by('b', "Put it back. Try another one."),
    ] },
    { id: 'jr.sf.st2', when: at('golden-idol', 'scratch-test'), turns: [
      by('b', "This is definitely the one."),
      beat('The guide scratches it. Clay. The guide hands it back without a word.'),
      by('a', "That's the third fake. How many are there?"),
    ] },
  ],
};
