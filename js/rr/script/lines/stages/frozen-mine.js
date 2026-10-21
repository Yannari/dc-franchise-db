// Frozen Mine's challenges, stage by stage (js/rr/places/frozen-mine.js `stages`; director.js stageBeats).
//   the ice yacht  swimsuits -> push-off -> across-ice -> mine-gate                  (All-In: both, in swimsuits)
//   the borehole   the-harness -> going-down -> ball-search -> winch-up -> red-ball   (Botch or Watch: a goes down, b on the winch)
// A yacht that spins out or tips is dragged back to the start; a white ball brought up means going back down.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the ice yacht ──
    { id: 'fm.st.sw1', when: at('ice-yacht', 'swimsuits'), turns: [
      beat('On the edge of the frozen lake, in the snow, they take off their coats and change into swimsuits.'),
      by('b', "This is the coldest I've ever been. Ever."),
      by('a', "Move fast and it won't be as bad."),
    ] },
    { id: 'fm.st.sw2', when: at('ice-yacht', 'swimsuits'), turns: [
      by('a', "Why swimsuits? Why on a frozen lake?"),
      by('b', "Because it's funny. For Don."),
      beat('They change as fast as they possibly can, teeth chattering the whole time.'),
    ] },
    { id: 'fm.st.po1', when: at('ice-yacht', 'push-off'), turns: [
      beat('They push the yacht across the ice, run alongside it, and jump on as the wind fills the sail.'),
      by('a', "It's moving! We're moving!"),
      by('b', "Steer! Somebody steer!"),
    ] },
    { id: 'fm.st.po2', when: at('ice-yacht', 'push-off'), turns: [
      by('b', "You steer, I'll do the sail."),
      by('a', "Which rope is the sail?"),
      by('b', "The one that's not attached to the steering."),
      beat('The sail snaps tight and the yacht slides off across the ice.'),
    ] },
    { id: 'fm.st.ai1', when: at('ice-yacht', 'across-ice'), turns: [
      beat('The yacht picks up speed, faster and faster, skating across the lake with the wind howling past.'),
      by('b', "This is so fast! Why is it so fast?"),
      by('a', "Don't let go of the rope!"),
    ] },
    { id: 'fm.st.ai2', when: at('ice-yacht', 'across-ice'), turns: [
      by('a', "Lean! Lean into the turn!"),
      beat('They both lean out over the ice, and the yacht swings round in a long smooth curve towards the mine.'),
      by('b', "We're actually good at this!"),
    ] },
    { id: 'fm.st.mg1', when: at('ice-yacht', 'mine-gate'), turns: [
      beat('The yacht skids to a stop beside the mine, and they climb off, blue all over.'),
      by('b', "Clothes. Please. Where are our clothes?"),
      by('a', "Tip first. Then clothes."),
    ] },
    { id: 'fm.st.mg2', when: at('ice-yacht', 'mine-gate'), turns: [
      by('a', "I can't feel my legs. Are my legs still there?"),
      by('b', "They're there. They're just purple."),
      beat('They grab the tip and run for their coats.'),
    ] },

    // ── the borehole ──
    { id: 'fm.st.hn1', when: at('borehole', 'the-harness'), turns: [
      beat('At the edge of the borehole, a worker clips {a} into a harness hanging from the winch, and switches on {a.posAdj} headlamp.'),
      by('a', "How deep is it?"),
      by('b', "The sign says it's the deepest hole on earth. So, deep."),
    ] },
    { id: 'fm.st.hn2', when: at('borehole', 'the-harness'), turns: [
      by('b', "I'll be right here. I'll wind you back up."),
      by('a', "Promise you won't let go of the handle."),
      by('b', "I promise. Go."),
    ] },
    { id: 'fm.st.gd1', when: at('borehole', 'going-down'), turns: [
      beat('The winch creaks, and {a} drops slowly down into the dark, the headlamp lighting up wet rock on every side.'),
      by('a', "It's so dark. It's so quiet."),
      by('b', "Talk to me! Keep talking so I know you're okay!"),
    ] },
    { id: 'fm.st.gd2', when: at('borehole', 'going-down'), turns: [
      by('b', "Are you at the bottom yet?"),
      by('a', "No! Keep going! It just keeps going!"),
      beat('Far below, {a}\'s feet finally touch the cavern floor.'),
    ] },
    { id: 'fm.st.bs1', when: at('borehole', 'ball-search'), turns: [
      beat('The floor of the cavern is covered in white balls, hundreds of them, and {a} sweeps the headlamp slowly across them.'),
      by('a', "White. White. White. Everything's white."),
      by('b', "Look for the red one! Just the red one!"),
    ] },
    { id: 'fm.st.bs2', when: at('borehole', 'ball-search'), turns: [
      by('a', "There! In the corner! Red!"),
      beat('{a} wades through the white balls and grabs the one red ball half buried in the corner.'),
      by('b', "Got it? Hold on tight! I'm winding!"),
    ] },
    { id: 'fm.st.wu1', when: at('borehole', 'winch-up'), turns: [
      beat('{b} winds the handle round and round, arms burning, and {a} rises slowly back up the shaft.'),
      by('b', "You're so heavy!"),
      by('a', "I'm holding a ball! It's one ball!"),
    ] },
    { id: 'fm.st.wu2', when: at('borehole', 'winch-up'), turns: [
      by('a', "I can see daylight!"),
      beat('{a}\'s head comes up out of the hole, then the rest of {a.obj}, with the red ball held up high.'),
      by('b', "You did it! I'm never letting go of this handle again!"),
    ] },
    { id: 'fm.st.rb1', when: at('borehole', 'red-ball'), turns: [
      beat('The worker takes the red ball, checks it, and hands over the tip.'),
      by('a', "Never again. Never going down a hole again."),
      by('b', "The Chill Zone's in a sauna. A warm sauna."),
    ] },
    { id: 'fm.st.rb2', when: at('borehole', 'red-ball'), turns: [
      by('b', "How was it down there?"),
      by('a', "Dark. Cold. Full of balls. I don't want to talk about it."),
      beat('They run for the sauna.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the ice yacht ──
    { id: 'fm.sf.sw1', when: at('ice-yacht', 'swimsuits'), turns: [
      beat('{b} changes into a swimsuit, feels the wind, and pulls the coat straight back on.'),
      by('a', "You can't wear the coat!"),
      by('b', "Just for one more minute! It's so cold!"),
    ] },
    { id: 'fm.sf.sw2', when: at('ice-yacht', 'swimsuits'), turns: [
      by('a', "Where's my swimsuit? I put it right here."),
      beat('The wind has blown {a}\'s swimsuit halfway across the lake. They have to go and get it.'),
      by('b', "Run! Before it goes any further!"),
    ] },
    { id: 'fm.sf.po1', when: at('ice-yacht', 'push-off'), turns: [
      beat('They push and push, but the skates are frozen to the ice and the yacht won\'t move.'),
      by('a', "Kick it! Kick the skates!"),
      by('b', "I'm in bare feet! I'm not kicking anything!"),
    ] },
    { id: 'fm.sf.po2', when: at('ice-yacht', 'push-off'), turns: [
      by('b', "Jump on! Jump on now!"),
      beat('{a} jumps, misses the yacht completely, and slides across the ice on {a.posAdj} stomach.'),
      by('b', "Get up! I'm leaving without you!"),
    ] },
    { id: 'fm.sf.ai1', when: at('ice-yacht', 'across-ice'), turns: [
      beat('A gust of wind catches the sail sideways, and the yacht spins round and round across the ice.'),
      by('b', "We're spinning! Make it stop!"),
      by('a', "I can't! Let go of the rope!"),
    ] },
    { id: 'fm.sf.ai2', when: at('ice-yacht', 'across-ice'), turns: [
      by('a', "Are we going the right way?"),
      beat('They are not. They are heading straight back to where they started.'),
      by('b', "Turn it round! We have to start again!"),
    ] },

    // ── the borehole ──
    { id: 'fm.sf.hn1', when: at('borehole', 'the-harness'), turns: [
      beat('{a} sits on the edge of the hole, looks down into the black, and shuffles back from it.'),
      by('a', "I can't see the bottom. Why can't I see the bottom?"),
      by('b', "Because it's really deep! That's the whole point!"),
    ] },
    { id: 'fm.sf.hn2', when: at('borehole', 'the-harness'), turns: [
      by('b', "Go on. I've got you."),
      by('a', "Have you, though? Show me your arms."),
      beat('{a} makes {b} prove the winch works twice before going near the edge.'),
    ] },
    { id: 'fm.sf.bs1', when: at('borehole', 'ball-search'), turns: [
      beat('{a} grabs a ball, gets winched up, and holds it out. In the daylight, it\'s white.'),
      by('a', "It was red down there! It looked red!"),
      by('b', "It's the headlamp! Go back down!"),
    ] },
    { id: 'fm.sf.bs2', when: at('borehole', 'ball-search'), turns: [
      by('b', "Have you found it?"),
      by('a', "My headlamp's flickering! I can't see anything!"),
      beat('{a} has to feel around in the dark, picking up ball after ball, none of them red.'),
    ] },
    { id: 'fm.sf.wu1', when: at('borehole', 'winch-up'), turns: [
      beat('Halfway up the shaft, the red ball slips out of {a}\'s cold fingers and drops back down into the dark.'),
      by('a', "I dropped it!"),
      by('b', "No! Back down! I'm sorry, back down!"),
    ] },
    { id: 'fm.sf.wu2', when: at('borehole', 'winch-up'), turns: [
      by('b', "My arms! I can't wind any more!"),
      beat('{b} lets go of the handle for one second, and {a} drops back down the shaft.'),
      by('a', "Why am I going down? Why am I going down?"),
    ] },
  ],
};
