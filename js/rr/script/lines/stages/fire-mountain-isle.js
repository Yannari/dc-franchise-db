// Fire-Mountain Isle's challenges, stage by stage (js/rr/places/fire-mountain-isle.js `stages`; director.js stageBeats).
//   Lava or Falls   lava: lava-bank -> stepping-stones -> lava-clearing
//                   falls: river-raft -> behind-the-falls -> falls-clearing
//   the lagoon      lagoon-wade -> the-mine -> far-rocks                         (Botch or Watch: a swims, b watches)
//   the offering    log-pile -> the-statue -> up-the-volcano -> the-crater       (All-In: build it, carry it up)
// A slip off the stones means the bank again; touching the mine means swimming back to the beach; a statue that falls
// apart on the way up is rebuilt at the bottom.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── Lava ──
    { id: 'fm.st.lb1', when: at('lava-falls', 'lava-bank'), turns: [
      beat('At the edge of the canyon, a river of glowing lava runs past. A line of flat black stones crosses it.'),
      by('b', "That's real lava. That's actual, real lava."),
      by('a', "So we don't touch it. Simple."),
    ] },
    { id: 'fm.st.lb2', when: at('lava-falls', 'lava-bank'), turns: [
      by('a', "It's so hot. My eyebrows are hot."),
      by('b', "Then let's be quick about it."),
      beat('They step up to the first stone.'),
    ] },
    { id: 'fm.st.ss1', when: at('lava-falls', 'stepping-stones'), turns: [
      beat('{a} hops from stone to stone, arms out, the lava bubbling on both sides.'),
      by('a', "Don't stop on any of them! They're hot!"),
      by('b', "Hot, hot, hot, hot!"),
    ] },
    { id: 'fm.st.ss2', when: at('lava-falls', 'stepping-stones'), turns: [
      by('b', "Big jump to the next one. Ready?"),
      beat('They leap together and land on the same stone, wobbling, then jump again.'),
      by('a', "Last one! Go!"),
    ] },
    { id: 'fm.st.lc1', when: at('lava-falls', 'lava-clearing'), turns: [
      beat('They jump off the last stone into a jungle clearing, where a Don Box waits by a carved tiki.'),
      by('b', "My shoes are smoking. Are my shoes smoking?"),
      by('a', "A little. Grab the tip."),
    ] },
    { id: 'fm.st.lc2', when: at('lava-falls', 'lava-clearing'), turns: [
      by('a', "Across lava. We crossed lava."),
      by('b', "Nobody back home is going to believe this."),
      beat('{b} pulls the tip out of the box.'),
    ] },

    // ── Falls ──
    { id: 'fm.st.rr1', when: at('lava-falls', 'river-raft'), turns: [
      beat('They push a log raft into the river channel and ride it down, bumping off the rocks.'),
      by('b', "Paddle left! Left!"),
      by('a', "I am paddling left! The river's going right!"),
    ] },
    { id: 'fm.st.rr2', when: at('lava-falls', 'river-raft'), turns: [
      by('a', "Hold on to the sides."),
      beat('The raft spins round once, straightens out, and slides up onto the bank by the falls.'),
      by('b', "We meant to do that."),
    ] },
    { id: 'fm.st.bf1', when: at('lava-falls', 'behind-the-falls'), turns: [
      beat('A narrow path runs behind the waterfall, wet and shiny. They shuffle along it with their backs to the rock.'),
      by('b', "It's so loud back here!"),
      by('a', "What?"),
    ] },
    { id: 'fm.st.bf2', when: at('lava-falls', 'behind-the-falls'), turns: [
      by('a', "Small steps. Hold the rock."),
      beat('Spray soaks them through, but they inch their way out the other side.'),
      by('b', "Slower than the lava. But my shoes are fine."),
    ] },
    { id: 'fm.st.fc1', when: at('lava-falls', 'falls-clearing'), turns: [
      beat('Dripping wet, they come out into the jungle clearing. The Don Box sits by a carved tiki.'),
      by('a', "There's the box! Grab the tip!"),
      by('b', "Can I wring out my socks first?"),
    ] },
    { id: 'fm.st.fc2', when: at('lava-falls', 'falls-clearing'), turns: [
      by('b', "The lava teams look like they had a worse time."),
      by('a', "Their shoes are on fire. We're just wet."),
      beat('{a} pulls the tip out of the box.'),
    ] },

    // ── the lagoon ──
    { id: 'fm.st.lw1', when: at('lagoon', 'lagoon-wade'), turns: [
      beat('{a} wades into the warm lagoon. Out in the middle, an old rusty sea mine bobs on the water.'),
      by('b', "Swim round it. Way round it."),
      by('a', "I wasn't going to swim into it!"),
    ] },
    { id: 'fm.st.lw2', when: at('lagoon', 'lagoon-wade'), turns: [
      by('a', "How far is it to the rocks?"),
      by('b', "Not far. Just keep away from the spiky ball."),
      beat('{a} takes a breath and pushes off.'),
    ] },
    { id: 'fm.st.mn1', when: at('lagoon', 'the-mine'), turns: [
      beat('{a} swims wide of the mine, keeping one eye on its rusty spikes the whole way.'),
      by('b', "That's it! Wide! Keep wide!"),
      by('a', "Is it moving? It feels like it's moving."),
    ] },
    { id: 'fm.st.mn2', when: at('lagoon', 'the-mine'), turns: [
      by('b', "Past it! You're past it!"),
      beat('{a} kicks hard and leaves the mine bobbing behind {a.obj}.'),
      by('a', "Don't follow me. Please don't follow me."),
    ] },
    { id: 'fm.st.fr1', when: at('lagoon', 'far-rocks'), turns: [
      beat('{a} hauls {a.ref} up onto the far rocks and slaps the Don Box.'),
      by('a', "Got it! Tip!"),
      by('b', "You made it! Not a spike on you!"),
    ] },
    { id: 'fm.st.fr2', when: at('lagoon', 'far-rocks'), turns: [
      by('a', "Logs and pineapples. We're building a statue."),
      by('b', "Of who?"),
      by('a', "Of one of us. Pick a good side."),
    ] },

    // ── the offering ──
    { id: 'fm.st.lp1', when: at('statue', 'log-pile'), turns: [
      beat('On the beach lies a pile of logs and a heap of pineapples. The statue has to look like one of them.'),
      by('b', "It's going to be you. You've got the more pineapple-shaped head."),
      by('a', "Thanks. I think."),
    ] },
    { id: 'fm.st.lp2', when: at('statue', 'log-pile'), turns: [
      by('a', "Logs for the body. Pineapple for the head."),
      by('b', "And a shell for the face. Like the tip says."),
      beat('They start rolling logs into place.'),
    ] },
    { id: 'fm.st.sb1', when: at('statue', 'the-statue'), turns: [
      beat('Log by log, a little wooden figure takes shape, with a pineapple head and a face carved with a shell.'),
      by('b', "It looks just like you. Look at the frown."),
      by('a', "I don't frown like that."),
    ] },
    { id: 'fm.st.sb2', when: at('statue', 'the-statue'), turns: [
      by('a', "Tie the arms on tight. It has to go up a volcano."),
      beat('{b} lashes the log arms on with vines, double knots, then triple.'),
      by('b', "It's not going anywhere. Except up."),
    ] },
    { id: 'fm.st.uv1', when: at('statue', 'up-the-volcano'), turns: [
      beat('They carry the statue up the steep volcano path, past a stream of lava hissing beside it.'),
      by('a', "Don't let the head roll off!"),
      by('b', "I'm holding the head! I'm holding the whole head!"),
    ] },
    { id: 'fm.st.uv2', when: at('statue', 'up-the-volcano'), turns: [
      by('b', "Step. Step. Rest."),
      beat('Every few steps they stop, swap hands, and keep going up.'),
      by('a', "I can see the top! There's smoke coming out of it!"),
    ] },
    { id: 'fm.st.cr1', when: at('statue', 'the-crater'), turns: [
      beat('At the rim, they swing the statue back, and throw it into the glowing crater.'),
      by('a', "Goodbye, me."),
      beat('The volcano rumbles. Taped to a rock at the rim is the tip.'),
    ] },
    { id: 'fm.st.cr2', when: at('statue', 'the-crater'), turns: [
      by('b', "One, two, three!"),
      beat('The statue sails into the crater and vanishes in a puff of sparks.'),
      by('a', "Tip! The Chill Zone's right up here!"),
    ] },
  ],

  'task-stage.fail': [
    // ── Lava ──
    { id: 'fm.sf.ss1', when: at('lava-falls', 'stepping-stones'), turns: [
      beat('{b} lands on a stone, wobbles, and has to jump back to the one behind. Then all the way back to the bank.'),
      by('b', "Too far! That one was too far!"),
      by('a', "Back to the start. Again."),
    ] },
    { id: 'fm.sf.ss2', when: at('lava-falls', 'stepping-stones'), turns: [
      by('a', "My shoe! My shoe's melting!"),
      beat('{a} hops back to the bank on one foot, holding the other in the air.'),
      by('b', "Put it out! Put your shoe out!"),
    ] },

    // ── Falls ──
    { id: 'fm.sf.rr1', when: at('lava-falls', 'river-raft'), turns: [
      beat('The raft hits a rock, tips up, and dumps them both in the river.'),
      by('a', "Grab the raft! Grab it!"),
      by('b', "It's going without us!"),
    ] },
    { id: 'fm.sf.rr2', when: at('lava-falls', 'river-raft'), turns: [
      by('b', "Why are we going backwards?"),
      beat('The raft spins round and round in an eddy, and won\'t come out.'),
      by('a', "Paddle! Both sides! No, not both at once!"),
    ] },
    { id: 'fm.sf.bf1', when: at('lava-falls', 'behind-the-falls'), turns: [
      beat('{a}\'s foot slips on the wet rock. {a.Sub} grabs {b}, and they both slide back down to where they started.'),
      by('b', "Why did you grab me?"),
      by('a', "Because you were there!"),
    ] },
    { id: 'fm.sf.bf2', when: at('lava-falls', 'behind-the-falls'), turns: [
      by('a', "I can't see the path. There's water everywhere."),
      beat('A gush from the falls pushes them both off the ledge into the pool.'),
      by('b', "From the top. Again."),
    ] },

    // ── the lagoon ──
    { id: 'fm.sf.mn1', when: at('lagoon', 'the-mine'), turns: [
      beat('A wave nudges the mine straight towards {a}. {a.Sub} bumps it with an elbow, and it lets out a long, loud BEEP.'),
      by('b', "You touched it! Back to the beach!"),
      by('a', "It touched me! It came at me!"),
    ] },
    { id: 'fm.sf.mn2', when: at('lagoon', 'the-mine'), turns: [
      by('b', "Too close! Too close!"),
      beat('{a} turns to look, and swims right into it with {a.posAdj} foot.'),
      by('a', "Ow. Spiky. I'm going back."),
    ] },

    // ── the offering ──
    { id: 'fm.sf.sb1', when: at('statue', 'the-statue'), turns: [
      beat('They stand the statue up. It wobbles, and the pineapple head rolls off into the sand.'),
      by('a', "My head! You knocked my head off!"),
      by('b', "It's not your head! It's a pineapple!"),
    ] },
    { id: 'fm.sf.sb2', when: at('statue', 'the-statue'), turns: [
      by('b', "Is it supposed to lean like that?"),
      beat('The whole statue slowly tips over and falls apart into a pile of logs.'),
      by('a', "From the bottom. Again."),
    ] },
    { id: 'fm.sf.uv1', when: at('statue', 'up-the-volcano'), turns: [
      beat('Halfway up, an arm comes off, then the other, then the statue slips and tumbles all the way back down.'),
      by('b', "No! Not after all that!"),
      by('a', "Down we go. Rebuild it at the bottom."),
    ] },
    { id: 'fm.sf.uv2', when: at('statue', 'up-the-volcano'), turns: [
      by('a', "My hands are slipping. It's so heavy."),
      beat('The statue slides out of their arms and rolls down the path, losing logs as it goes.'),
      by('b', "It's falling apart! Catch the head!"),
    ] },
  ],
};
