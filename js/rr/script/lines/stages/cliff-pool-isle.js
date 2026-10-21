// Cliff Pool Isle's challenges, stage by stage (js/rr/places/cliff-pool-isle.js `stages`; director.js stageBeats).
//   the falls    the-edge -> the-jump -> the-bottom -> cliff-path -> chest-up     (Botch or Watch: a dives, b at the top)
//   the bobsled  push-off -> run-one -> the-loop -> run-three -> the-board        (All-In: three runs against the clock)
// A refused jump, an empty-handed dive or a dropped chest means back to the edge; three runs too slow means a fresh three.
// The cliff guide is the place's own local.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the falls ──
    { id: 'cpi.st.ed1', when: at('falls-dive', 'the-edge'), turns: [
      beat('At the top of the waterfall, the water rushes past {a}\'s feet and drops away into the green lagoon far below.'),
      by('b', "That's high. That's really high."),
      by('a', "Don't say it. Just count me down."),
    ] },
    { id: 'cpi.st.ed2', when: at('falls-dive', 'the-edge'), turns: [
      by('a', "Feet first, arms in, right?"),
      by('b', "Feet first, arms in, and don't scream with your mouth open."),
      beat('{a} steps right up to the edge.'),
    ] },
    { id: 'cpi.st.jp1', when: at('falls-dive', 'the-jump'), turns: [
      beat('{a} jumps, falls for what feels like forever, and hits the lagoon with a huge splash.'),
      by('b', "Are you okay? Come up! Come up!"),
      beat('{a}\'s head pops up out of the water, grinning.'),
    ] },
    { id: 'cpi.st.jp2', when: at('falls-dive', 'the-jump'), turns: [
      by('b', "Three, two, one!"),
      beat('{a} jumps off the falls with a whoop and drops straight into the lagoon.'),
      by('b', "That was amazing! Now find a chest!"),
    ] },
    { id: 'cpi.st.bt1', when: at('falls-dive', 'the-bottom'), turns: [
      beat('On the bottom of the lagoon, between the rocks, little wooden treasure chests sit half buried in the sand.'),
      beat('{a} grabs one by the handle and kicks for the surface.'),
      by('b', "Got one? Hold it up!"),
    ] },
    { id: 'cpi.st.bt2', when: at('falls-dive', 'the-bottom'), turns: [
      by('b', "Can you see them?"),
      beat('{a} comes up for air, nods, takes a big breath, and goes straight back down for the nearest chest.'),
      by('b', "Go on! Grab one!"),
    ] },
    { id: 'cpi.st.cp1', when: at('falls-dive', 'cliff-path'), turns: [
      beat('{a} climbs the slippery cliff path back up, the chest under one arm, one hand on the rock.'),
      by('b', "Careful! The rocks are wet!"),
      by('a', "Everything's wet! I'm wet! The chest is wet!"),
    ] },
    { id: 'cpi.st.cp2', when: at('falls-dive', 'cliff-path'), turns: [
      by('a', "This chest is heavier than it looks."),
      by('b', "Nearly there. A few more steps."),
      beat('{a} hauls {a.ref} up the last rocks to the top.'),
    ] },
    { id: 'cpi.st.cu1', when: at('falls-dive', 'chest-up'), turns: [
      beat('{a} sets the chest down at the top of the falls and collapses next to it.'),
      by('b', "You did it! Open it! What's in it?"),
      by('a', "The tip. It's just the tip. I was hoping for gold."),
    ] },
    { id: 'cpi.st.cu2', when: at('falls-dive', 'chest-up'), turns: [
      by('b', "Bobsled next. On a tropical island."),
      by('a', "Of course it is. Let me drip for a minute first."),
      beat('{a} wrings out {a.posAdj} shirt, and they head for the track.'),
    ] },

    // ── the bobsled ──
    { id: 'cpi.st.po1', when: at('bobsled', 'push-off'), turns: [
      beat('At the top of the homemade track, they push the sled together, run three steps, and jump in.'),
      by('a', "Go, go, go! In!"),
      by('b', "I'm in! Hold on!"),
    ] },
    { id: 'cpi.st.po2', when: at('bobsled', 'push-off'), turns: [
      by('b', "Three runs. All three together have to beat the board."),
      by('a', "Then we push hard every time."),
      beat('They shove the sled off and leap in.'),
    ] },
    { id: 'cpi.st.r11', when: at('bobsled', 'run-one'), turns: [
      beat('The sled rattles down the wooden track, round one bend, then another, faster and faster.'),
      by('b', "Lean! Lean into it!"),
      by('a', "I'm leaning! Everything's leaning!"),
    ] },
    { id: 'cpi.st.r12', when: at('bobsled', 'run-one'), turns: [
      by('a', "That felt fast. Was that fast?"),
      by('b', "It felt fast. Let's do it faster."),
      beat('They drag the sled back up for run two.'),
    ] },
    { id: 'cpi.st.lp1', when: at('bobsled', 'the-loop'), turns: [
      beat('The track goes into a full loop. The sled goes up, upside down for one second, and comes round the other side.'),
      by('b', "We went upside down! We were upside down!"),
      by('a', "My stomach is still up there!"),
    ] },
    { id: 'cpi.st.lp2', when: at('bobsled', 'the-loop'), turns: [
      by('a', "Here comes the loop. Hold on tight."),
      beat('They hold on, the sled whips round the loop, and they come out of it still in their seats.'),
      by('b', "Again! That was the best part!"),
    ] },
    { id: 'cpi.st.r31', when: at('bobsled', 'run-three'), turns: [
      beat('On the last run, the sled shoots off the end of the track and skims across the lagoon at the bottom.'),
      by('b', "Was it enough? Did we beat it?"),
      by('a', "Look at the board!"),
    ] },
    { id: 'cpi.st.r32', when: at('bobsled', 'run-three'), turns: [
      by('a', "Last one. Everything we've got."),
      beat('They push off harder than ever, and the sled flies down the track.'),
      by('b', "That was the fastest one! That was so fast!"),
    ] },
    { id: 'cpi.st.bd1', when: at('bobsled', 'the-board'), turns: [
      beat('Their three times add up on the board, and the total comes in just under the target. It flashes green.'),
      by('a', "We did it! Just under!"),
      by('b', "Just under counts. Tip!"),
    ] },
    { id: 'cpi.st.bd2', when: at('bobsled', 'the-board'), turns: [
      by('b', "Under the target! We're under!"),
      by('a', "Chill Zone's by the pool. Let's go."),
      beat('They leave the sled and run for the resort.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the falls ──
    { id: 'cpi.sf.ed1', when: at('falls-dive', 'the-edge'), turns: [
      beat('{a} walks up to the edge, looks down, and walks straight back again.'),
      by('a', "Nope. Not yet. Give me a minute."),
      by('b', "You've had a minute! Jump!"),
    ] },
    { id: 'cpi.sf.ed2', when: at('falls-dive', 'the-edge'), turns: [
      by('b', "Go on. On three."),
      beat('{b} counts to three. {a} doesn\'t move. {b} counts again.'),
      by('a', "Count slower. Count much slower."),
    ] },
    { id: 'cpi.sf.bt1', when: at('falls-dive', 'the-bottom'), turns: [
      beat('{a} comes up from the bottom gasping, with nothing in {a.posAdj} hands.'),
      by('a', "Couldn't reach it! Ran out of air!"),
      by('b', "Back to the edge. You have to jump again."),
    ] },
    { id: 'cpi.sf.bt2', when: at('falls-dive', 'the-bottom'), turns: [
      by('b', "Have you got a chest?"),
      beat('{a} holds up a rock. It\'s a chest-shaped rock.'),
      by('a', "It looked like a chest from up close."),
    ] },
    { id: 'cpi.sf.cp1', when: at('falls-dive', 'cliff-path'), turns: [
      beat('Halfway up the cliff path, {a}\'s foot slips, and the chest tumbles all the way back down into the lagoon.'),
      by('b', "No!"),
      by('a', "Back to the edge. I know. I know."),
    ] },
    { id: 'cpi.sf.cp2', when: at('falls-dive', 'cliff-path'), turns: [
      by('a', "Can you take it from here?"),
      by('b', "I'm not allowed! You have to bring it all the way!"),
      beat('{a} puts the chest down for a rest, and it slides off the path and splashes into the water.'),
    ] },

    // ── the bobsled ──
    { id: 'cpi.sf.po1', when: at('bobsled', 'push-off'), turns: [
      beat('They push the sled, it starts rolling, and {b} only gets one leg in before it leaves without {b.obj}.'),
      by('a', "Where are you?"),
      by('b', "Still at the top! Come back!"),
    ] },
    { id: 'cpi.sf.po2', when: at('bobsled', 'push-off'), turns: [
      by('b', "Push! Push harder!"),
      beat('They push too hard, trip over each other, and the empty sled goes down the track on its own.'),
      by('a', "That run doesn't count, does it?"),
    ] },
    { id: 'cpi.sf.r11', when: at('bobsled', 'run-one'), turns: [
      beat('The sled hits the first bend and nearly stops, scraping along the wooden wall.'),
      by('a', "That's slow. That's so slow."),
      by('b', "We'll make it up on the next two."),
    ] },
    { id: 'cpi.sf.r12', when: at('bobsled', 'run-one'), turns: [
      by('b', "Why did you brake?"),
      by('a', "I didn't brake! I just put my foot down!"),
      beat('A foot down is a brake.'),
    ] },
    { id: 'cpi.sf.lp1', when: at('bobsled', 'the-loop'), turns: [
      beat('The sled goes into the loop too slow, stalls at the top, and falls off sideways.'),
      by('a', "Ow. Ow. That's a lot of wood to fall on."),
      by('b', "Back to the top. Fresh set of three."),
    ] },
    { id: 'cpi.sf.lp2', when: at('bobsled', 'the-loop'), turns: [
      by('b', "Lean in! Lean in!"),
      beat('They lean out instead, and the sled tips over on the bend before the loop.'),
      by('a', "In means in! Towards the track!"),
    ] },
    { id: 'cpi.sf.r31', when: at('bobsled', 'run-three'), turns: [
      beat('The total comes up on the board. It\'s over the target by two seconds. It flashes red.'),
      by('b', "Two seconds! Just two!"),
      by('a', "Three more runs. From the start."),
    ] },
    { id: 'cpi.sf.r32', when: at('bobsled', 'run-three'), turns: [
      by('a', "Did we make it?"),
      beat('They did not. The board flashes red, and the man with the clipboard points at the top of the hill.'),
      by('b', "My legs. My poor legs."),
    ] },
  ],
};
