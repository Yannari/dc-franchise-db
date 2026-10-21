// Ice Floe's challenges, stage by stage (js/rr/places/ice-floe.js `stages`; director.js stageBeats).
//   the narwhal  dig-ring -> the-line -> the-throw -> ringed                            (Botch or Watch: a throws, b watches)
//   the igloo    saw-blocks -> first-ring -> the-dome -> local-test -> igloo-tip         (All-In: both saw and build)
// A ring that misses sinks, so a miss means digging for another; an igloo with a gap or a sag is pulled down and built
// again. The local who inspects it is the place's own.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the narwhal ──
    { id: 'if.st.dr1', when: at('narwhal', 'dig-ring'), turns: [
      beat('At the edge of the ice, {a} drops to {a.posAdj} knees and starts digging through the snow with both hands.'),
      by('b', "Anything?"),
      by('a', "Snow. More snow. Wait. Got one!"),
    ] },
    { id: 'if.st.dr2', when: at('narwhal', 'dig-ring'), turns: [
      by('b', "Over there. Something shiny."),
      beat('{a} digs where {b} is pointing and pulls out a gold ring, cold and wet.'),
      by('a', "Good eye."),
    ] },
    { id: 'if.st.li1', when: at('narwhal', 'the-line'), turns: [
      beat('{a} stands at the line, ring in hand, and stares at the dark water. Nothing happens for a long time.'),
      by('b', "Where are they?"),
      by('a', "Just wait. They'll come up."),
      beat('A long spiral tusk rises out of the water, then another.'),
    ] },
    { id: 'if.st.li2', when: at('narwhal', 'the-line'), turns: [
      by('a', "That's a real narwhal. I thought they were made up."),
      by('b', "They're real. Now throw a ring at one."),
      beat('{a} grips the ring and waits for the next tusk.'),
    ] },
    { id: 'if.st.th1', when: at('narwhal', 'the-throw'), turns: [
      beat('{a} takes a breath, waits for the tusk to come up straight, and throws.'),
      by('b', "Go on, go on..."),
      beat('The ring spins through the air and drops right over the tusk.'),
    ] },
    { id: 'if.st.th2', when: at('narwhal', 'the-throw'), turns: [
      by('b', "Underarm. Soft. Like a horseshoe."),
      beat('{a} throws it underarm, nice and soft, and it loops down onto the tusk with a little clink.'),
      by('a', "Did that go on? It went on!"),
    ] },
    { id: 'if.st.rg1', when: at('narwhal', 'ringed'), turns: [
      beat('The narwhal sinks back under with the ring still on its tusk, and a local hands over the tip.'),
      by('b', "You ringed a narwhal!"),
      by('a', "I ringed a narwhal. I can't believe that's a thing I just said."),
    ] },
    { id: 'if.st.rg2', when: at('narwhal', 'ringed'), turns: [
      by('a', "Build an igloo. Okay. How hard can that be?"),
      by('b', "Please stop saying that before every challenge."),
      beat('They run for the igloo village.'),
    ] },

    // ── the igloo ──
    { id: 'if.st.sb1', when: at('igloo', 'saw-blocks'), turns: [
      beat('In the igloo village, they take a saw each and start cutting blocks out of the hard-packed snow.'),
      by('a', "Same size every time. Like bricks."),
      by('b', "My arm's already tired and we've done two."),
    ] },
    { id: 'if.st.sb2', when: at('igloo', 'saw-blocks'), turns: [
      by('b', "Is this one too big?"),
      by('a', "It's fine. Just get it out in one piece."),
      beat('{b} levers the block out of the snow and carries it over, very carefully.'),
    ] },
    { id: 'if.st.fr1', when: at('igloo', 'first-ring'), turns: [
      beat('They set the first ring of blocks in a circle on the snow, each one leaning in a little.'),
      by('a', "Lean them in. Just a bit."),
      by('b', "It's actually looking like an igloo."),
    ] },
    { id: 'if.st.fr2', when: at('igloo', 'first-ring'), turns: [
      by('b', "Pack the gaps with snow."),
      beat('{a} stuffs snow into the cracks between the blocks and pats it smooth.'),
      by('a', "Nothing's getting through that."),
    ] },
    { id: 'if.st.dm1', when: at('igloo', 'the-dome'), turns: [
      beat('Ring by ring, the walls curve in, until there is only a small hole left at the top.'),
      by('a', "Last block. You do it."),
      beat('{b} lowers the last block into the hole, and it fits.'),
      by('b', "It fits! It actually fits!"),
    ] },
    { id: 'if.st.dm2', when: at('igloo', 'the-dome'), turns: [
      by('b', "Slowly. If one goes, they all go."),
      beat('They build the dome together, one holding each block while the other packs it in.'),
      by('a', "Okay. Let go. Slowly."),
    ] },
    { id: 'if.st.lt1', when: at('igloo', 'local-test'), turns: [
      beat('The local walks round the igloo once, taps a few blocks, and crawls in through the door.'),
      by('a', "Is it going to hold?"),
      by('b', "It has to hold. Please hold."),
    ] },
    { id: 'if.st.lt2', when: at('igloo', 'local-test'), turns: [
      by('a', "Don't lean on it. Don't touch it."),
      beat('From inside the igloo comes a long silence, and then a happy sigh.'),
      by('b', "That's good, right? That sounded good."),
    ] },
    { id: 'if.st.it1', when: at('igloo', 'igloo-tip'), turns: [
      beat('The local pokes a hand out through the door with the tip, and doesn\'t come out.'),
      by('b', "I think they're staying."),
      by('a', "Then it's a good igloo. Let's go."),
    ] },
    { id: 'if.st.it2', when: at('igloo', 'igloo-tip'), turns: [
      by('a', "We built a house. Out of snow."),
      by('b', "And someone's living in it already."),
      beat('They run across the ice towards the Chill Zone.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the narwhal ──
    { id: 'if.sf.dr1', when: at('narwhal', 'dig-ring'), turns: [
      beat('{a} digs a hole so deep {a.posAdj} whole arm disappears, and finds nothing but more snow.'),
      by('a', "There's nothing here."),
      by('b', "Try somewhere else. Over by the rocks."),
    ] },
    { id: 'if.sf.dr2', when: at('narwhal', 'dig-ring'), turns: [
      by('a', "Got one!"),
      beat('{a} holds it up. It\'s a bottle cap.'),
      by('b', "That's not a ring. Keep digging."),
    ] },
    { id: 'if.sf.th1', when: at('narwhal', 'the-throw'), turns: [
      beat('{a} throws. The ring hits the tusk, bounces off, and sinks into the dark water.'),
      by('a', "It hit it! It hit it and fell off!"),
      by('b', "Doesn't count. Go dig another one."),
    ] },
    { id: 'if.sf.th2', when: at('narwhal', 'the-throw'), turns: [
      by('b', "Wait for it to come up!"),
      beat('{a} throws too early. The narwhal comes up just after the ring has already sunk.'),
      by('a', "It was right there a second ago!"),
    ] },
    { id: 'if.sf.th3', when: at('narwhal', 'the-throw'), turns: [
      beat('{a}\'s throw goes way left and lands in the water nowhere near any of the tusks.'),
      by('b', "What were you aiming at?"),
      by('a', "My hands are frozen! I can't feel what I'm throwing!"),
    ] },

    // ── the igloo ──
    { id: 'if.sf.sb1', when: at('igloo', 'saw-blocks'), turns: [
      beat('{b} lifts a block out of the snow, and it cracks in half.'),
      by('b', "No. That was a good one."),
      by('a', "Cut another. Thicker this time."),
    ] },
    { id: 'if.sf.sb2', when: at('igloo', 'saw-blocks'), turns: [
      by('a', "Why are your blocks all different sizes?"),
      by('b', "I don't know! I'm cutting them the same!"),
      beat('They are not the same. Half of them have to be cut again.'),
    ] },
    { id: 'if.sf.fr1', when: at('igloo', 'first-ring'), turns: [
      beat('{a} sets the last block of the first ring, and the whole ring slowly leans outwards and falls over.'),
      by('b', "In! They're supposed to lean in!"),
      by('a', "I know which way in is!"),
    ] },
    { id: 'if.sf.fr2', when: at('igloo', 'first-ring'), turns: [
      by('b', "Is that circle a bit... oval?"),
      beat('It is very oval. They have to knock it down and start the circle again.'),
      by('a', "Use the saw handle. Draw a circle in the snow first."),
    ] },
    { id: 'if.sf.dm1', when: at('igloo', 'the-dome'), turns: [
      beat('{b} sets the last block on top, and the whole dome caves in with a soft whump.'),
      by('a', "No. No, no, no."),
      by('b', "From the bottom. Again."),
    ] },
    { id: 'if.sf.dm2', when: at('igloo', 'the-dome'), turns: [
      by('a', "Just one more block. Hold it there."),
      beat('{a} pushes the block in, and three others slide out of the wall and land in the snow.'),
      by('b', "Why did you push it?"),
    ] },
    { id: 'if.sf.lt1', when: at('igloo', 'local-test'), turns: [
      beat('The local crawls inside, then pokes a finger straight out through a gap in the wall and wiggles it at them.'),
      by('a', "Oh. There's a gap."),
      by('b', "There's a big gap. We have to fix it."),
    ] },
    { id: 'if.sf.lt2', when: at('igloo', 'local-test'), turns: [
      by('b', "Is it holding?"),
      beat('The local crawls in, and the back of the igloo slowly sags down onto them. They crawl back out, shaking their head.'),
      by('a', "Sorry! So sorry! We'll build it again!"),
    ] },
  ],
};
