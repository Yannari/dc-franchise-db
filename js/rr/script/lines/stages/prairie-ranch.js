// Prairie Ranch's challenges, stage by stage (js/rr/places/prairie-ranch.js `stages`; director.js stageBeats).
//   the beans  the-pot -> first-half -> bean-wall -> the-bottom -> beans-tip     (All-In: both eat to the bottom of the pot)
//   the bull   saddle-up -> slow-start -> full-buck -> eight-seconds             (Botch or Watch: a rides, b behind the rail)
// Beans that come back up get topped up again; a fall before eight seconds means climbing back on. The cook and the
// cowboy at the controls are the place's own locals.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the beans ──
    { id: 'pr.st.po1', when: at('beans', 'the-pot'), turns: [
      beat('On the long table at the top of the cliff, the cook drops a big iron pot in front of them. It is full to the brim with pork and beans.'),
      by('b', "That's for both of us, right? Not each?"),
      by('a', "Both of us. Still. That's a lot of beans."),
    ] },
    { id: 'pr.st.po2', when: at('beans', 'the-pot'), turns: [
      by('a', "The tip's at the bottom. Taped to the pot."),
      by('b', "So we just keep eating till we hit metal."),
      beat('They pick up a spoon each and look at each other.'),
      by('a', "Okay. Go."),
    ] },
    { id: 'pr.st.fh1', when: at('beans', 'first-half'), turns: [
      beat('The first few spoonfuls go down fast. The beans are warm and sweet and honestly not bad.'),
      by('b', "These are actually good."),
      by('a', "Don't say that. Ask me again in ten minutes."),
    ] },
    { id: 'pr.st.fh2', when: at('beans', 'first-half'), turns: [
      by('a', "Same pace. Spoon, swallow, spoon."),
      beat('They eat side by side, in rhythm, and the level in the pot slowly starts to drop.'),
      by('b', "It's going down. It's actually going down."),
    ] },
    { id: 'pr.st.bw1', when: at('beans', 'bean-wall'), turns: [
      beat('Halfway down the pot, they both slow right down. Every spoonful takes longer than the last.'),
      by('b', "I'm so full. I'm so, so full."),
      by('a', "Me too. Small spoons. Keep going."),
    ] },
    { id: 'pr.st.bw2', when: at('beans', 'bean-wall'), turns: [
      by('a', "Stand up. It makes more room."),
      beat('{a} and {b} stand up and keep eating, leaning over the pot, chewing with their eyes closed.'),
      by('b', "I never want to see a bean again."),
    ] },
    { id: 'pr.st.bt1', when: at('beans', 'the-bottom'), turns: [
      beat('{a}\'s spoon hits metal with a clink.'),
      by('a', "Bottom! I hit the bottom!"),
      by('b', "Scrape it. Get every bit. The cook's going to check."),
    ] },
    { id: 'pr.st.bt2', when: at('beans', 'the-bottom'), turns: [
      by('b', "I can see the tape. I can see the tip."),
      beat('They scrape the last beans off the bottom of the pot, round and round, until it shines.'),
      by('a', "Is that all of it? Check the corners."),
    ] },
    { id: 'pr.st.tp1', when: at('beans', 'beans-tip'), turns: [
      beat('The cook tips the pot towards the light, nods, and lets {a} peel the tip off the bottom.'),
      by('a', "\"Ride the mechanical bull in the barn.\" Oh no. Not after all that."),
      by('b', "Not me. You're riding it. I'm full."),
    ] },
    { id: 'pr.st.tp2', when: at('beans', 'beans-tip'), turns: [
      by('b', "We did it. We ate a whole pot of beans."),
      by('a', "Please don't make me laugh. I'll explode."),
      beat('They walk very carefully towards the barn.'),
    ] },

    // ── the bull ──
    { id: 'pr.st.su1', when: at('bull', 'saddle-up'), turns: [
      beat('In the barn, a mechanical bull stands on a pile of hay, and a cowboy waits at the controls with a hand on the lever.'),
      by('b', "One hand on the rope. Hold on with your legs."),
      by('a', "How do you know that?"),
      by('b', "I watch a lot of TV."),
    ] },
    { id: 'pr.st.su2', when: at('bull', 'saddle-up'), turns: [
      by('a', "Okay. I'm on. I'm on the bull."),
      beat('{a} grips the rope with one hand and holds the other one up in the air, the way the cowboys do.'),
      by('b', "You look great! You look like you know what you're doing!"),
    ] },
    { id: 'pr.st.ss1', when: at('bull', 'slow-start'), turns: [
      beat('The cowboy pushes the lever. The bull rocks forward, then back, slow and gentle.'),
      by('a', "Oh, this is fine. This is easy."),
      by('b', "Don't say that! It speeds up!"),
    ] },
    { id: 'pr.st.ss2', when: at('bull', 'slow-start'), turns: [
      by('b', "Move with it! Let your hips go!"),
      beat('{a} rocks with the bull, back and forth, and starts to get the rhythm.'),
      by('a', "Okay. Okay. I think I've got it."),
    ] },
    { id: 'pr.st.fb1', when: at('bull', 'full-buck'), turns: [
      beat('The cowboy pushes the lever all the way. The bull bucks, spins, and kicks, and {a} hangs on with everything.'),
      by('b', "Hold on! Five! Six!"),
      by('a', "I'm holding! I'm holding!"),
    ] },
    { id: 'pr.st.fb2', when: at('bull', 'full-buck'), turns: [
      by('b', "Squeeze with your legs!"),
      beat('The bull spins one way and then the other, and {a} slides halfway off and somehow drags {a.ref} back on.'),
      by('b', "How are you still on?"),
    ] },
    { id: 'pr.st.es1', when: at('bull', 'eight-seconds'), turns: [
      beat('The clock on the wall hits eight, a buzzer goes, and the bull slows down and stops.'),
      by('a', "Eight! Was that eight?"),
      by('b', "That was eight! You did it!"),
    ] },
    { id: 'pr.st.es2', when: at('bull', 'eight-seconds'), turns: [
      by('b', "You did it! Get off, get off! Here's the tip!"),
      beat('{a} slides off the bull and lands in the hay, and stays there for a second.'),
      by('a', "Give me a second. I can still feel the beans."),
    ] },
  ],

  'task-stage.fail': [
    // ── the beans ──
    { id: 'pr.sf.fh1', when: at('beans', 'first-half'), turns: [
      beat('{b} eats too fast, stops, goes pale, and makes a run for the edge of the cliff.'),
      by('a', "Oh no. Not already."),
      beat('When {b} comes back, the cook has already topped the pot back up.'),
    ] },
    { id: 'pr.sf.fh2', when: at('beans', 'first-half'), turns: [
      by('a', "Why is it full again? We just ate all that."),
      by('b', "Because of me. Sorry. They came back."),
      beat('The cook pours another ladle of beans into the pot, and they start again.'),
    ] },
    { id: 'pr.sf.bw1', when: at('beans', 'bean-wall'), turns: [
      beat('{a} stops eating, sits very still, and then the beans come back up.'),
      by('b', "It's okay. It's okay. Breathe."),
      beat('The cook tops the pot back up. Almost to where it started.'),
    ] },
    { id: 'pr.sf.bw2', when: at('beans', 'bean-wall'), turns: [
      by('b', "I can't. I literally can't fit any more in."),
      by('a', "You have to. Just one more spoon."),
      beat('One more spoon is one too many. The pot gets topped up again.'),
    ] },
    { id: 'pr.sf.bt1', when: at('beans', 'the-bottom'), turns: [
      beat('They hand the pot to the cook. The cook looks in it, points at a few beans stuck to the side, and hands it back.'),
      by('a', "That's like six beans!"),
      by('b', "Just eat them. Quick."),
    ] },
    { id: 'pr.sf.bt2', when: at('beans', 'the-bottom'), turns: [
      by('a', "Done! It's empty!"),
      beat('The cook tips the pot, and a puddle of bean sauce slides out of the corner.'),
      by('b', "The sauce counts? The sauce counts."),
    ] },

    // ── the bull ──
    { id: 'pr.sf.su1', when: at('bull', 'saddle-up'), turns: [
      beat('{a} swings a leg over the bull, misses, and slides straight off the other side into the hay.'),
      by('b', "It's not even moving yet!"),
      by('a', "I know! It's slippery!"),
    ] },
    { id: 'pr.sf.su2', when: at('bull', 'saddle-up'), turns: [
      by('b', "Why are you sitting backwards?"),
      beat('{a} looks down, realises {a.sub} is facing the bull\'s tail, and has to climb off and get on again.'),
      by('a', "Don't tell anyone."),
    ] },
    { id: 'pr.sf.ss1', when: at('bull', 'slow-start'), turns: [
      beat('The bull rocks forward once, very gently, and {a} falls off sideways.'),
      by('b', "That was the slowest setting!"),
      by('a', "I wasn't ready! Again!"),
    ] },
    { id: 'pr.sf.ss2', when: at('bull', 'slow-start'), turns: [
      by('a', "This is fine. This is fine. Oh no."),
      beat('{a} leans too far forward, and the bull tips {a.obj} off over its head.'),
      by('b', "Are you okay? Get back on!"),
    ] },
    { id: 'pr.sf.fb1', when: at('bull', 'full-buck'), turns: [
      beat('At six seconds, the bull spins hard, and {a} flies off and lands flat in the hay.'),
      by('b', "Six! You got to six!"),
      by('a', "Six isn't eight. Put me back on."),
    ] },
    { id: 'pr.sf.fb2', when: at('bull', 'full-buck'), turns: [
      by('b', "Hold on! Hold on!"),
      beat('{a} holds on with both hands, which is against the rules, and the cowboy stops the bull and points at the start.'),
      by('a', "One hand. Right. Sorry."),
    ] },
  ],
};
