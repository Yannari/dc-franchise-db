// Tomb Sands' challenges, stage by stage (js/rr/places/tomb-sands.js `stages`; director.js stageBeats).
//   Over      pyramid-foot -> the-steps -> the-top -> down-the-side -> over-tip     (both climb)
//   Under     tomb-door -> three-doors -> dart-trap -> scarab-room -> way-out        (both through the tomb)
//   the reeds the-reeds -> tie-it -> cast-off -> the-crocs -> far-bank              (All-In: build it, paddle it)
// A slip sends a climber back to the bottom; the wrong doorway ends in a dead end or a trap; a boat that sinks means
// swimming back past the crocodiles to build another.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── Over ──
    { id: 'ts.st.pf1', when: at('pyramid', 'pyramid-foot'), turns: [
      beat('At the foot of the great pyramid, each step is as tall as their waist, and there are hundreds of them.'),
      by('b', "We climb all of that? Then down the other side?"),
      by('a', "Up and over. Come on. One step at a time."),
    ] },
    { id: 'ts.st.pf2', when: at('pyramid', 'pyramid-foot'), turns: [
      by('a', "We picked over. Why did we pick over?"),
      by('b', "Because under has mummies in it."),
      by('a', "Right. Good choice. Let's climb."),
    ] },
    { id: 'ts.st.st1', when: at('pyramid', 'the-steps'), turns: [
      beat('They haul themselves up the stone blocks, one after another, pulling each other up the high ones.'),
      by('b', "Give me your hand. Up you come."),
      by('a', "Thanks. Don't look down. Seriously, don't."),
    ] },
    { id: 'ts.st.st2', when: at('pyramid', 'the-steps'), turns: [
      by('a', "The stone's so hot. It's burning my hands."),
      by('b', "Keep moving. It's only hot if you stop."),
      beat('They climb on, the desert getting smaller and smaller below them.'),
    ] },
    { id: 'ts.st.tp1', when: at('pyramid', 'the-top'), turns: [
      beat('They pull themselves onto the very top of the pyramid. The whole desert spreads out around them.'),
      by('b', "We're on top of a pyramid. An actual pyramid."),
      by('a', "Take a second. Okay, second's over. Down we go."),
    ] },
    { id: 'ts.st.tp2', when: at('pyramid', 'the-top'), turns: [
      by('a', "Look. The river. That's where we're going next."),
      by('b', "It's so far away."),
      beat('They turn round and look down the other side.'),
    ] },
    { id: 'ts.st.ds1', when: at('pyramid', 'down-the-side'), turns: [
      beat('Going down is worse than going up. They lower themselves step by step, backwards, like climbing down a ladder.'),
      by('b', "My legs are shaking."),
      by('a', "Mine too. Slowly. Nearly there."),
    ] },
    { id: 'ts.st.ds2', when: at('pyramid', 'down-the-side'), turns: [
      by('a', "Sit down and slide off each one. Like stairs for babies."),
      beat('They bump down the far side on their bottoms, one huge step at a time.'),
      by('b', "This is so undignified. It's working, though."),
    ] },
    { id: 'ts.st.ot1', when: at('pyramid', 'over-tip'), turns: [
      beat('They drop off the last step onto the sand on the far side, and the tip is waiting in the Don Box.'),
      by('b', "Over. We went over a pyramid."),
      by('a', "Camels next. Let's go."),
    ] },
    { id: 'ts.st.ot2', when: at('pyramid', 'over-tip'), turns: [
      by('a', "Did anyone go under? Are we first?"),
      by('b', "Don't know. Don't care. Read the tip."),
      beat('{b} reads it, and they head off across the sand.'),
    ] },

    // ── Under ──
    { id: 'ts.st.td1', when: at('pyramid', 'tomb-door'), turns: [
      beat('The tomb entrance is a dark doorway between two stone pillars covered in carvings. Cold air drifts out of it.'),
      by('b', "It's so dark in there."),
      by('a', "It's a tomb. It's supposed to be dark. Come on."),
    ] },
    { id: 'ts.st.td2', when: at('pyramid', 'tomb-door'), turns: [
      by('a', "Hold my hand."),
      by('b', "For you or for me?"),
      by('a', "Both. Let's go."),
    ] },
    { id: 'ts.st.dr1', when: at('pyramid', 'three-doors'), turns: [
      beat('The passage ends in three doorways. A symbol is carved above each one: a bird, an eye, a snake.'),
      by('b', "Which one?"),
      by('a', "The eye. The eye watches over you. That's a good one."),
    ] },
    { id: 'ts.st.dr2', when: at('pyramid', 'three-doors'), turns: [
      by('b', "The bird. Birds fly out. Out is where we want to go."),
      by('a', "That's actually smart."),
      beat('They step through the doorway with the bird, and the passage goes on into the dark.'),
    ] },
    { id: 'ts.st.dt1', when: at('pyramid', 'dart-trap'), turns: [
      beat('The corridor walls are full of little holes. {a} steps carefully on the stones that look worn and avoids the clean ones.'),
      by('a', "Only step where I step."),
      by('b', "Right behind you. Exactly where you step."),
    ] },
    { id: 'ts.st.dt2', when: at('pyramid', 'dart-trap'), turns: [
      by('b', "Duck!"),
      beat('A dart whistles over their heads and sticks in the wall. They keep low and hurry to the end of the corridor.'),
      by('a', "That was so close. That was right over my head."),
    ] },
    { id: 'ts.st.sc1', when: at('pyramid', 'scarab-room'), turns: [
      beat('The next room is full of beetles, a crunching, clicking heap of them, all over the floor.'),
      by('b', "No. No, no, no."),
      by('a', "They're just beetles. Walk fast and don't stop."),
    ] },
    { id: 'ts.st.sc2', when: at('pyramid', 'scarab-room'), turns: [
      by('a', "Hold your breath and go."),
      beat('They wade through the scarabs to the far side, high-stepping the whole way.'),
      by('b', "One's on my shoe! Get it off!"),
    ] },
    { id: 'ts.st.wo1', when: at('pyramid', 'way-out'), turns: [
      beat('Past the painted mummy on the wall, sunlight shines in through a gap. They climb out onto the sand on the far side.'),
      by('b', "We made it! Out!"),
      by('a', "And nothing grabbed us. I'm so happy nothing grabbed us."),
    ] },
    { id: 'ts.st.wo2', when: at('pyramid', 'way-out'), turns: [
      by('a', "Daylight. Real daylight."),
      by('b', "Tip's in the box. Camels next."),
      beat('They shake the sand and the beetles out of their clothes and run.'),
    ] },

    // ── the reed boat ──
    { id: 'ts.st.rd1', when: at('reed-boat', 'the-reeds'), turns: [
      beat('On the riverbank, there are piles of reed bundles and coils of rope. Out in the water, something with a lot of teeth is lying very still.'),
      by('b', "Is that a crocodile?"),
      by('a', "Build fast and don't look at it."),
    ] },
    { id: 'ts.st.rd2', when: at('reed-boat', 'the-reeds'), turns: [
      by('a', "Grab the biggest bundles. The fatter it is, the better it floats."),
      beat('They drag the reed bundles down to the water\'s edge.'),
      by('b', "These are so light. Is that good?"),
    ] },
    { id: 'ts.st.ti1', when: at('reed-boat', 'tie-it'), turns: [
      beat('They lash the bundles together with rope, tight at both ends, until they have something that looks a bit like a canoe.'),
      by('b', "It's a boat. It actually looks like a boat."),
      by('a', "Let's see if it floats."),
    ] },
    { id: 'ts.st.ti2', when: at('reed-boat', 'tie-it'), turns: [
      by('b', "Tighter. Pull the rope tighter."),
      beat('{a} pulls, and the bundles squeeze together into a solid little raft.'),
      by('a', "That's not going anywhere."),
    ] },
    { id: 'ts.st.co1', when: at('reed-boat', 'cast-off'), turns: [
      beat('They push the reed boat into the river and climb on. It sits low in the water, but it floats.'),
      by('a', "Paddle. Both sides. Together."),
      by('b', "Left, right, left, right."),
    ] },
    { id: 'ts.st.co2', when: at('reed-boat', 'cast-off'), turns: [
      by('b', "Is it leaking? My feet are wet."),
      by('a', "It's reeds. Everything's a bit wet. Keep paddling."),
      beat('The far bank gets slowly closer.'),
    ] },
    { id: 'ts.st.cr1', when: at('reed-boat', 'the-crocs'), turns: [
      beat('A crocodile slides off the bank into the water, right beside them. Only its eyes show above the surface.'),
      by('b', "Paddle faster. Paddle so much faster."),
      by('a', "Don't splash. Smooth and quiet."),
    ] },
    { id: 'ts.st.cr2', when: at('reed-boat', 'the-crocs'), turns: [
      by('a', "It's following us."),
      by('b', "It's not following us. It's going the same way."),
      beat('The crocodile loses interest and sinks out of sight.'),
    ] },
    { id: 'ts.st.fb1', when: at('reed-boat', 'far-bank'), turns: [
      beat('The reed boat bumps into the far bank, and they jump out onto the sand, still in one piece.'),
      by('b', "We made it! Nobody got eaten!"),
      by('a', "Chill Zone. By the pyramid. Run."),
    ] },
    { id: 'ts.st.fb2', when: at('reed-boat', 'far-bank'), turns: [
      by('a', "Look at our boat. It held."),
      by('b', "Leave it. Let's go before it sinks out of spite."),
      beat('They run up the bank towards the pyramid.'),
    ] },
  ],

  'task-stage.fail': [
    // ── Over ──
    { id: 'ts.sf.st1', when: at('pyramid', 'the-steps'), turns: [
      beat('Halfway up, {b}\'s foot slips on a loose stone, and {b} slides and bumps all the way back down to the bottom.'),
      by('a', "Are you okay?"),
      by('b', "I'm fine! I'm at the bottom! I have to start again!"),
    ] },
    { id: 'ts.sf.st2', when: at('pyramid', 'the-steps'), turns: [
      by('a', "I can't reach the next one. It's too high."),
      beat('{a} tries to jump for it, misses, and slides down three steps.'),
      by('b', "Use me. Climb on my back."),
    ] },
    { id: 'ts.sf.ds1', when: at('pyramid', 'down-the-side'), turns: [
      beat('Going down too fast, {a} loses balance and tumbles down a whole row of steps.'),
      by('b', "Stop! Slow down!"),
      by('a', "I wasn't trying to go fast!"),
    ] },
    { id: 'ts.sf.ds2', when: at('pyramid', 'down-the-side'), turns: [
      by('b', "I can't look down. I can't."),
      beat('{b} freezes near the top, and it takes a long time and a lot of talking to get {b.obj} moving again.'),
      by('a', "One step. Just one. Then another one."),
    ] },

    // ── Under ──
    { id: 'ts.sf.td1', when: at('pyramid', 'tomb-door'), turns: [
      beat('{b} takes one step into the tomb, hears something drip in the dark, and walks straight back out.'),
      by('b', "Something's in there."),
      by('a', "Water. It's water. Come on."),
    ] },
    { id: 'ts.sf.td2', when: at('pyramid', 'tomb-door'), turns: [
      by('a', "Ladies first."),
      by('b', "No. You first. It was your idea."),
      beat('They argue in the doorway while another team walks past them into the tomb.'),
    ] },
    { id: 'ts.sf.dr1', when: at('pyramid', 'three-doors'), turns: [
      beat('They take the snake door. Twenty steps in, it ends in a solid wall.'),
      by('a', "Dead end."),
      by('b', "Back. Try another one."),
    ] },
    { id: 'ts.sf.dr2', when: at('pyramid', 'three-doors'), turns: [
      by('b', "The eye one. Definitely the eye one."),
      beat('Behind the eye door, the floor tips, and they slide down a chute back to the start.'),
      by('a', "Not the eye one, then."),
    ] },
    { id: 'ts.sf.dt1', when: at('pyramid', 'dart-trap'), turns: [
      beat('{a} steps on a stone that clicks, and darts shoot out of the wall from both sides.'),
      by('a', "Back! Back!"),
      beat('They scramble back to the start of the corridor.'),
    ] },
    { id: 'ts.sf.dt2', when: at('pyramid', 'dart-trap'), turns: [
      by('b', "Which stones are safe?"),
      by('a', "The worn ones. Or the clean ones. I forget."),
      beat('{b} steps on a clean one. It clicks. They run.'),
    ] },
    { id: 'ts.sf.sc1', when: at('pyramid', 'scarab-room'), turns: [
      beat('{b} puts one foot in the scarab room, feels them crunch, and turns right round.'),
      by('b', "I can't. I can't walk on them."),
      by('a', "Close your eyes. I'll lead you."),
    ] },
    { id: 'ts.sf.sc2', when: at('pyramid', 'scarab-room'), turns: [
      by('a', "Why are you climbing on me?"),
      by('b', "Because they're on the floor and you're not!"),
      beat('{b} has to climb back down before they can go anywhere.'),
    ] },

    // ── the reed boat ──
    { id: 'ts.sf.ti1', when: at('reed-boat', 'tie-it'), turns: [
      beat('{a} pulls the last knot tight, and the whole boat springs apart into separate bundles again.'),
      by('b', "What did you do?"),
      by('a', "I don't know! I just pulled!"),
    ] },
    { id: 'ts.sf.ti2', when: at('reed-boat', 'tie-it'), turns: [
      by('b', "Does it float? Test it."),
      beat('They push it into the water. One end floats and the other end sinks.'),
      by('a', "Half a boat. We built half a boat."),
    ] },
    { id: 'ts.sf.co1', when: at('reed-boat', 'cast-off'), turns: [
      beat('Halfway across the river, the reeds come loose and the boat starts to sink underneath them.'),
      by('b', "We're sinking! We're sinking!"),
      by('a', "Swim back! Swim back to the bank!"),
    ] },
    { id: 'ts.sf.co2', when: at('reed-boat', 'cast-off'), turns: [
      by('a', "Why is the water getting higher?"),
      by('b', "Because we're getting lower!"),
      beat('They swim back to the bank, very fast, past the crocodiles, to build another.'),
    ] },
    { id: 'ts.sf.cr1', when: at('reed-boat', 'the-crocs'), turns: [
      beat('A crocodile bumps the side of the boat, and they both scream and paddle in the wrong direction.'),
      by('a', "Other way! The bank's the other way!"),
      by('b', "The crocodile's the other way!"),
    ] },
    { id: 'ts.sf.cr2', when: at('reed-boat', 'the-crocs'), turns: [
      by('b', "It's coming! Paddle! Paddle!"),
      beat('They paddle so hard on one side that the boat spins round in circles in the middle of the river.'),
      by('a', "Stop! Both sides! Both sides!"),
    ] },
  ],
};
