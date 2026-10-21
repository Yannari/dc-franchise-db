// Great Falls' challenges, stage by stage (js/rr/places/great-falls.js `stages`; director.js stageBeats).
//   the slot machine  the-lever -> three-hearts -> the-rails -> the-minister      (Botch or Watch: a plays, b watches)
//   the tightrope     the-harness -> first-steps -> the-spray -> far-rim              (All-In: both walk it)
// Anything but three hearts means pulling again, and the wrong dress means back to the rails; a fall into the harness
// means being winched back to the start. The chapel's minister is the place's own local.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the slot machine ──
    { id: 'gf.st.lv1', when: at('wedding-slots', 'the-lever'), turns: [
      beat('{a} grabs the lever of the giant slot machine and pulls. The reels spin with a loud clatter.'),
      by('b', "Come on, hearts! Come on!"),
      beat('Heart. Heart. And, after a long wobble, heart.'),
    ] },
    { id: 'gf.st.lv2', when: at('wedding-slots', 'the-lever'), turns: [
      by('a', "Third pull's the lucky one. Everybody knows that."),
      by('b', "Nobody knows that. You made that up."),
      beat('{a} pulls, and the reels click round to three red hearts.'),
    ] },
    { id: 'gf.st.th1', when: at('wedding-slots', 'three-hearts'), turns: [
      beat('Bells ring, lights flash, and the machine prints out a little picture of a wedding dress.'),
      by('a', "Three hearts! We won! What did we win?"),
      by('b', "A picture of a dress. Now you have to find that dress."),
    ] },
    { id: 'gf.st.th2', when: at('wedding-slots', 'three-hearts'), turns: [
      by('b', "Grab the ticket. What's on it?"),
      by('a', "A dress. Long sleeves, big bow at the back."),
      beat('{a} heads for the rails with the picture.'),
    ] },
    { id: 'gf.st.rl1', when: at('wedding-slots', 'the-rails'), turns: [
      beat('On the stage, rails and rails of white wedding dresses stretch off into the dark. {a} flicks through them one by one.'),
      by('a', "They're all white. Why are they all white?"),
      by('b', "Look for the bow! Big bow at the back!"),
    ] },
    { id: 'gf.st.rl2', when: at('wedding-slots', 'the-rails'), turns: [
      by('b', "Hold it up next to the picture."),
      beat('{a} pulls out a dress, holds it up beside the ticket, and checks the sleeves, the collar and the bow.'),
      by('a', "Same. It's the same. I'm sure it's the same."),
    ] },
    { id: 'gf.st.mn1', when: at('wedding-slots', 'the-minister'), turns: [
      beat('{a} holds the dress up in front of the minister, who compares it to the picture very slowly.'),
      by('b', "Please be right. Please be right."),
      beat('The minister smiles, and hands over the tip.'),
    ] },
    { id: 'gf.st.mn2', when: at('wedding-slots', 'the-minister'), turns: [
      by('a', "Tip! We're walking a tightrope over the falls."),
      by('b', "Over the falls? Over those falls?"),
      by('a', "Those are the only falls."),
    ] },

    // ── the tightrope ──
    { id: 'gf.st.ci1', when: at('tightrope', 'the-harness'), turns: [
      beat('At the edge of the gorge, they step into the safety harnesses and clip onto the line above the rope.'),
      by('b', "The harness will catch us. That's what it's for."),
      by('a', "I don't want to find out if it works."),
    ] },
    { id: 'gf.st.ci2', when: at('tightrope', 'the-harness'), turns: [
      by('a', "Is that clipped? Pull on it."),
      beat('{b} tugs on the clip. It holds.'),
      by('b', "Clipped. Grab your pole."),
    ] },
    { id: 'gf.st.fs1', when: at('tightrope', 'first-steps'), turns: [
      beat('{a} steps out onto the rope with the long pole held level, and takes one slow step, then another.'),
      by('b', "Don't look down. Look at the far side."),
      by('a', "I'm looking at the far side. It's so far."),
    ] },
    { id: 'gf.st.fs2', when: at('tightrope', 'first-steps'), turns: [
      by('b', "Heel, toe. Heel, toe."),
      beat('They inch out over the gorge, the poles dipping a little left and right.'),
      by('a', "Okay. Okay. I'm doing it."),
    ] },
    { id: 'gf.st.sp1', when: at('tightrope', 'the-spray'), turns: [
      beat('In the middle of the rope, spray from the falls drifts up over them, cold and wet.'),
      by('b', "I can't see! There's water in my eyes!"),
      by('a', "Keep walking. Just keep your feet on the rope."),
    ] },
    { id: 'gf.st.sp2', when: at('tightrope', 'the-spray'), turns: [
      by('a', "The rope's wet. Go slow."),
      beat('The falls roar under them, but they keep stepping forward through the mist.'),
      by('b', "Halfway! We're more than halfway!"),
    ] },
    { id: 'gf.st.fr1', when: at('tightrope', 'far-rim'), turns: [
      beat('{a} steps off the rope onto solid rock, and turns round to grab the end of {b}\'s pole.'),
      by('a', "Ground! I love the ground!"),
      by('b', "I'm never doing that again. Ever."),
    ] },
    { id: 'gf.st.fr2', when: at('tightrope', 'far-rim'), turns: [
      by('b', "We're soaked. Every bit of us is soaked."),
      by('a', "Tip says the Chill Zone's on the rim. Come on."),
      beat('They wring out their sleeves and run for the rim of the falls.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the slot machine ──
    { id: 'gf.sf.lv1', when: at('wedding-slots', 'the-lever'), turns: [
      beat('The reels slow down. Heart. Heart. Lemon.'),
      by('a', "A lemon! Why is there a lemon on a wedding machine?"),
      by('b', "Pull it again!"),
    ] },
    { id: 'gf.sf.lv2', when: at('wedding-slots', 'the-lever'), turns: [
      by('b', "Was that three?"),
      by('a', "Two hearts and a broken heart. I don't think that counts."),
      beat('The machine makes a sad little noise. {a} pulls again.'),
    ] },
    { id: 'gf.sf.lv3', when: at('wedding-slots', 'the-lever'), turns: [
      beat('{a} pulls the lever so hard it sticks at the bottom. The reels don\'t move.'),
      by('a', "It's stuck. I broke it."),
      by('b', "Let it come back up! Gently!"),
    ] },
    { id: 'gf.sf.rl1', when: at('wedding-slots', 'the-rails'), turns: [
      beat('{a} holds up a dress for the minister, who looks at the picture, looks at the dress, and shakes their head.'),
      by('a', "But it's white! It's got a bow!"),
      by('b', "The bow's on the front! The picture's bow is at the back!"),
    ] },
    { id: 'gf.sf.rl2', when: at('wedding-slots', 'the-rails'), turns: [
      by('a', "This one? This one? This one?"),
      beat('{a} pulls out three dresses at once, and the whole rail tips over.'),
      by('b', "Put them back! You have to put them all back!"),
    ] },

    // ── the tightrope ──
    { id: 'gf.sf.fs1', when: at('tightrope', 'first-steps'), turns: [
      beat('Two steps out, the rope sways, and {a} wobbles back and forth with the pole swinging wildly.'),
      by('a', "Whoa, whoa, whoa!"),
      by('b', "Come back! Come back to the start!"),
    ] },
    { id: 'gf.sf.fs2', when: at('tightrope', 'first-steps'), turns: [
      by('b', "Why are you going backwards?"),
      by('a', "My feet decided. Not me. My feet."),
      beat('{a} shuffles back to the rim and takes a deep breath.'),
    ] },
    { id: 'gf.sf.sp1', when: at('tightrope', 'the-spray'), turns: [
      beat('A gust of spray hits {a} in the face. {a.Sub} slips, and drops off the rope into the harness, dangling over the falls.'),
      by('a', "Help! I'm hanging! I'm just hanging!"),
      by('b', "The harness got you! They're winching you back!"),
    ] },
    { id: 'gf.sf.sp2', when: at('tightrope', 'the-spray'), turns: [
      by('a', "My foot's slipping. My foot's slipping!"),
      beat('{b} drops the pole into the gorge, grabs for the rope, and slides off into the harness.'),
      by('b', "I'm okay! I'm okay! Where's my pole?"),
    ] },
  ],
};
