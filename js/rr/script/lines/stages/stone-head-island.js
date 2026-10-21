// Stone Head Island's challenges, stage by stage (js/rr/places/stone-head-island.js `stages`; director.js stageBeats).
//   the eggs     the-heads -> cracks-and-chins -> in-the-sand -> three-eggs                        (All-In: three in their colour)
//   the condor   spire-foot -> up-the-spire -> the-condor -> eggs-in -> climb-down                 (Botch or Watch: a climbs, b watches)
// An egg in another team's colour or a cracked one goes back; a slip, a retreat from the condor or a cracked egg means
// climbing down and starting again. The egg judge is the place's own local.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the eggs ──
    { id: 'shi.st.hd1', when: at('eggs', 'the-heads'), turns: [
      beat('Giant stone heads stand in rows along the beach, taller than a barn, all staring out to sea.'),
      by('b', "Three eggs. In our colour. Somewhere in all of that."),
      by('a', "You take this row. I'll take the next one."),
    ] },
    { id: 'shi.st.hd2', when: at('eggs', 'the-heads'), turns: [
      by('a', "Do you get the feeling they're watching us?"),
      by('b', "They're rocks. Rocks don't watch."),
      beat('{b} glances back at the nearest head anyway.'),
    ] },
    { id: 'shi.st.cc1', when: at('eggs', 'cracks-and-chins'), turns: [
      beat('{a} reaches up under a stone chin and feels around. {a.posAdj} hand comes out holding an egg, painted in their colour.'),
      by('a', "One! Under the chin!"),
      by('b', "Into the basket. Gently."),
    ] },
    { id: 'shi.st.cc2', when: at('eggs', 'cracks-and-chins'), turns: [
      by('b', "Check behind the ears. They're huge ears."),
      beat('{b} climbs onto a shoulder, reaches behind a stone ear, and pulls out a painted egg.'),
      by('a', "Ours! That's ours!"),
    ] },
    { id: 'shi.st.sa1', when: at('eggs', 'in-the-sand'), turns: [
      beat('By a fallen head, {a} digs with both hands until the sand gives up a smooth painted shell.'),
      by('a', "Found one buried. Not a crack on it."),
      by('b', "That's three! That's all three!"),
    ] },
    { id: 'shi.st.sa2', when: at('eggs', 'in-the-sand'), turns: [
      by('a', "Dig slowly. If you hit it, it breaks."),
      beat('They brush the sand away with their fingers like archaeologists until an egg appears.'),
      by('b', "There. Lift it out. Slowly."),
    ] },
    { id: 'shi.st.te1', when: at('eggs', 'three-eggs'), turns: [
      beat('They carry the padded basket to the judge, who lifts each egg and turns it in the sun.'),
      by('b', "Three. Our colour. Not a crack."),
      beat('The judge nods, and hands over the tip.'),
    ] },
    { id: 'shi.st.te2', when: at('eggs', 'three-eggs'), turns: [
      by('a', "Now we have to put them back in a nest?"),
      by('b', "A condor's nest. On top of that."),
      beat('They both look up at the spire.'),
    ] },

    // ── the condor ──
    { id: 'shi.st.sf1', when: at('condor-nest', 'spire-foot'), turns: [
      beat('The spire of rock goes straight up into the sky. Right at the top, a giant nest sticks out over the edge.'),
      by('b', "That nest's the size of a car."),
      by('a', "Then the bird must be the size of a car too."),
    ] },
    { id: 'shi.st.sf2', when: at('condor-nest', 'spire-foot'), turns: [
      by('b', "Eggs in the pouch. Zip it up."),
      by('a', "Zipped. Wish me luck."),
      beat('{a} clips into the harness and grabs the first handhold.'),
    ] },
    { id: 'shi.st.us1', when: at('condor-nest', 'up-the-spire'), turns: [
      beat('{a} climbs hand over hand up the rough rock, the pouch of eggs bumping gently against {a.posAdj} side.'),
      by('b', "Good! There's a ledge just above you!"),
      by('a', "I see it. I see it."),
    ] },
    { id: 'shi.st.us2', when: at('condor-nest', 'up-the-spire'), turns: [
      by('a', "How far is it now?"),
      by('b', "Halfway! Keep going!"),
      beat('{a} keeps climbing, slow and steady, without looking down.'),
    ] },
    { id: 'shi.st.co1', when: at('condor-nest', 'the-condor'), turns: [
      beat('A huge shadow passes over the rock. The condor circles once, twice, and swoops low over {a}\'s head.'),
      by('b', "Don't move! Let it pass!"),
      beat('{a} presses flat against the rock until the condor flies off, then climbs on.'),
    ] },
    { id: 'shi.st.co2', when: at('condor-nest', 'the-condor'), turns: [
      by('a', "We're bringing your eggs back! We're the good guys!"),
      beat('The condor tilts its head, as if it\'s thinking about it, and glides away.'),
      by('b', "I think it understood you!"),
    ] },
    { id: 'shi.st.ei1', when: at('condor-nest', 'eggs-in'), turns: [
      beat('{a} reaches over the edge of the giant nest and sets the three eggs down in the middle, one by one.'),
      by('a', "One. Two. Three. Home."),
      by('b', "Now come down before the bird comes back!"),
    ] },
    { id: 'shi.st.ei2', when: at('condor-nest', 'eggs-in'), turns: [
      by('b', "Are they in? Are they all in?"),
      by('a', "All in. Snug as anything."),
      beat('Far away, the condor gives a loud cry.'),
    ] },
    { id: 'shi.st.cd1', when: at('condor-nest', 'climb-down'), turns: [
      beat('{a} climbs back down the spire, and drops the last few feet onto the grass beside {b}.'),
      by('a', "Both feet on the ground. Both of them."),
      by('b', "You did it! Tip! The Chill Zone's on the dune!"),
    ] },
    { id: 'shi.st.cd2', when: at('condor-nest', 'climb-down'), turns: [
      by('b', "Nearly there. Three more steps."),
      beat('{a} hops off the rock, and {b} grabs {a.obj} in a big hug.'),
      by('a', "Never again. No more birds."),
    ] },
  ],

  'task-stage.fail': [
    // ── the eggs ──
    { id: 'shi.sf.cc1', when: at('eggs', 'cracks-and-chins'), turns: [
      beat('{a} pulls an egg from a crack in a stone cheek. It\'s painted, just not in their colour.'),
      by('a', "Wrong colour. That's somebody else's."),
      by('b', "Put it back. Exactly where you found it."),
    ] },
    { id: 'shi.sf.cc2', when: at('eggs', 'cracks-and-chins'), turns: [
      by('b', "Is that ours? It looks like ours."),
      by('a', "In this light, everything looks like ours."),
      beat('It isn\'t. They put it back and keep looking.'),
    ] },
    { id: 'shi.sf.sa1', when: at('eggs', 'in-the-sand'), turns: [
      beat('{a} digs too fast, and {a.posAdj} fingers crunch straight through a painted shell.'),
      by('a', "Oh no. Oh no, it's cracked."),
      by('b', "A cracked one doesn't count. Keep digging."),
    ] },
    { id: 'shi.sf.sa2', when: at('eggs', 'in-the-sand'), turns: [
      by('b', "Careful with the basket!"),
      beat('{b} trips over a stone nose sticking out of the sand. The basket lands upside down.'),
      by('a', "Check them. Please tell me they're fine."),
    ] },

    // ── the condor ──
    { id: 'shi.sf.us1', when: at('condor-nest', 'up-the-spire'), turns: [
      beat('A handhold crumbles under {a}\'s fingers. {a.Sub} slips, and drops into the harness, swinging.'),
      by('a', "I'm okay! The eggs are okay! I think!"),
      by('b', "Come down and start again!"),
    ] },
    { id: 'shi.sf.us2', when: at('condor-nest', 'up-the-spire'), turns: [
      by('a', "My arms are shaking. Is that normal?"),
      by('b', "Don't stop! Keep moving!"),
      beat('{a} loses {a.posAdj} footing and slides back down to the bottom.'),
    ] },
    { id: 'shi.sf.co1', when: at('condor-nest', 'the-condor'), turns: [
      beat('The condor dives straight at {a}, screeching, its wings as wide as a car.'),
      by('a', "Nope! No! I'm going down!"),
      by('b', "It's just a big bird! Go back up!"),
    ] },
    { id: 'shi.sf.co2', when: at('condor-nest', 'the-condor'), turns: [
      by('b', "Behind you! It's behind you!"),
      beat('The condor flaps so close that {a} lets go with one hand, and has to climb back down.'),
      by('a', "It looked me in the eye. Right in the eye."),
    ] },
    { id: 'shi.sf.ei1', when: at('condor-nest', 'eggs-in'), turns: [
      beat('{a} sets the second egg down a little too hard. There\'s a tiny crack.'),
      by('a', "It cracked. Just a little."),
      by('b', "A little crack is still a crack! Bring it down!"),
    ] },
    { id: 'shi.sf.ei2', when: at('condor-nest', 'eggs-in'), turns: [
      by('a', "Where's the third egg? There were three!"),
      beat('{a} pats the pouch. Empty. The third egg is back on the ground with {b}.'),
      by('b', "It fell out! Halfway up! Come and get it!"),
    ] },
  ],
};
