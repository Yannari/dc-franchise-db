// Torch Statue Harbour's challenges, stage by stage (js/rr/places/torch-statue-harbour.js `stages`; director.js stageBeats).
//   the statue     statue-foot -> the-climb -> haul-carriage -> rope-ride -> the-landing   (All-In: both climb, both ride)
//   the sewers     into-drain -> the-tunnels -> the-gator -> the-ladder                   (Botch or Watch: a pushes, b rides)
//   the big apple  wade-in -> mouth-only -> load-up -> push-it -> the-fountain             (All-In: one fetches, both push)
// A partner who lets go of the rope goes back up to the crown; a wrong turn in the sewer ends at a grate; an apple carried
// by hand goes back in the pond.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the statue ──
    { id: 'tsh.st.sf1', when: at('statue-climb', 'statue-foot'), turns: [
      beat('The boat drops them at the foot of the giant statue. It\'s even bigger up close, green and enormous, with ropes hanging down from the crown.'),
      by('b', "We're climbing that? All of it?"),
      by('a', "To the crown. Then we ride down on a baby carriage."),
      by('b', "I'm sorry, on a what?"),
    ] },
    { id: 'tsh.st.sf2', when: at('statue-climb', 'statue-foot'), turns: [
      by('a', "Look at the size of her hand."),
      by('b', "Look at the size of everything. Let's go before I think about it."),
      beat('They grab the first handhold and start up.'),
    ] },
    { id: 'tsh.st.cl1', when: at('statue-climb', 'the-climb'), turns: [
      beat('They climb up the statue, hand over hand, past the folds of her robe and up towards the crown.'),
      by('b', "Don't look down. The water's a long way down."),
      by('a', "Why do you always say that? Now I've looked."),
    ] },
    { id: 'tsh.st.cl2', when: at('statue-climb', 'the-climb'), turns: [
      by('a', "Nearly at the crown. Keep going."),
      beat('{a} pulls {a.ref} up onto the edge of the crown and reaches back down for {b}.'),
      by('b', "Got you. Up we come."),
    ] },
    { id: 'tsh.st.hc1', when: at('statue-climb', 'haul-carriage'), turns: [
      beat('A line of baby carriages hangs on ropes out of the crown\'s windows. They haul one up and look at it.'),
      by('b', "We ride down on this? Both of us?"),
      by('a', "It's a sturdy carriage. Probably."),
    ] },
    { id: 'tsh.st.hc2', when: at('statue-climb', 'haul-carriage'), turns: [
      by('a', "Pull. Hand over hand."),
      beat('The carriage swings up to the window, and they clip it onto the rope line.'),
      by('b', "Okay. That's ours. Get in."),
    ] },
    { id: 'tsh.st.rr1', when: at('statue-climb', 'rope-ride'), turns: [
      beat('They squeeze into the baby carriage and push off, and it zips down the rope towards the harbour with both of them screaming.'),
      by('a', "Hold on! Hold on!"),
      by('b', "I am holding on! There's nothing else to do!"),
    ] },
    { id: 'tsh.st.rr2', when: at('statue-climb', 'rope-ride'), turns: [
      by('b', "This is actually amazing."),
      by('a', "Look at the city! You can see everything!"),
      beat('The carriage whizzes down the line, over the water, towards the boats.'),
    ] },
    { id: 'tsh.st.ld1', when: at('statue-climb', 'the-landing'), turns: [
      beat('The carriage bumps down onto the dock beside the boats, and they climb out, a bit dizzy.'),
      by('b', "Can we do that again?"),
      by('a', "No. We have to push it now. Read the tip."),
    ] },
    { id: 'tsh.st.ld2', when: at('statue-climb', 'the-landing'), turns: [
      by('a', "We keep the carriage?"),
      by('b', "We keep the carriage. Something tells me we'll need it."),
      beat('They grab the tip and wheel the carriage away.'),
    ] },

    // ── the sewers ──
    { id: 'tsh.st.dr1', when: at('sewer', 'into-drain'), turns: [
      beat('The way into the sewers is a big round drain in the harbour wall, with water trickling out of it. {b} sits in the carriage.'),
      by('b', "It smells. It really smells."),
      by('a', "Hold your nose. I'm pushing."),
    ] },
    { id: 'tsh.st.dr2', when: at('sewer', 'into-drain'), turns: [
      by('a', "Ready?"),
      by('b', "No. But go."),
      beat('{a} pushes the carriage into the dark tunnel, the wheels splashing through the water.'),
    ] },
    { id: 'tsh.st.tn1', when: at('sewer', 'the-tunnels'), turns: [
      beat('The tunnel splits left and right. Both ways are dark and dripping.'),
      by('b', "Left. There's a breeze from the left. Breeze means outside."),
      by('a', "Left it is."),
    ] },
    { id: 'tsh.st.tn2', when: at('sewer', 'the-tunnels'), turns: [
      by('a', "This thing is so hard to push in water."),
      by('b', "You're doing great. Push. Push. Splash."),
      beat('{a} pushes on through the ankle-deep water, round one bend and then another.'),
    ] },
    { id: 'tsh.st.gt1', when: at('sewer', 'the-gator'), turns: [
      beat('Something long and dark slides through the water ahead of them, then sinks out of sight.'),
      by('b', "What was that?"),
      by('a', "Nothing. A log. Keep going. Don't look at it."),
    ] },
    { id: 'tsh.st.gt2', when: at('sewer', 'the-gator'), turns: [
      by('b', "Faster. Please push faster."),
      beat('{a} pushes the carriage at a run, splashing past the spot where the water moved.'),
      by('a', "Don't look back. Just don't."),
    ] },
    { id: 'tsh.st.ld3', when: at('sewer', 'the-ladder'), turns: [
      beat('Light shines down from a ladder at the end of the tunnel. They climb up, carriage and all, and come out in the park.'),
      by('b', "Air! Fresh air!"),
      by('a', "I'm never going down a drain again."),
    ] },
    { id: 'tsh.st.ld4', when: at('sewer', 'the-ladder'), turns: [
      by('a', "Out. We're out."),
      by('b', "We smell terrible. Read the tip."),
      beat('They lift the carriage out of the pipe and onto the grass.'),
    ] },

    // ── the big apple ──
    { id: 'tsh.st.wi1', when: at('big-apple', 'wade-in'), turns: [
      beat('Giant apples bob in the park pond, each one bigger than a person\'s head. {a} takes off {a.posAdj} shoes and wades in.'),
      by('a', "No hands. Just teeth."),
      by('b', "Just teeth. Good luck."),
    ] },
    { id: 'tsh.st.wi2', when: at('big-apple', 'wade-in'), turns: [
      by('b', "Which one?"),
      by('a', "The one closest to the edge. Less swimming."),
      beat('{a} wades out to the nearest apple and puts both hands behind {a.posAdj} back.'),
    ] },
    { id: 'tsh.st.mo1', when: at('big-apple', 'mouth-only'), turns: [
      beat('{a} opens wide and bites into the side of the giant apple. It bobs away. {a} follows it and bites again.'),
      by('b', "Bite the stalk! Bite the stalk!"),
      beat('{a} gets the stalk between {a.posAdj} teeth and drags the apple back towards the bank.'),
    ] },
    { id: 'tsh.st.mo2', when: at('big-apple', 'mouth-only'), turns: [
      by('b', "You've got it! Keep coming!"),
      beat('{a} wades out of the pond with a giant apple clamped in {a.posAdj} jaws, unable to say anything.'),
      by('a', "Mmmph!"),
    ] },
    { id: 'tsh.st.lu1', when: at('big-apple', 'load-up'), turns: [
      beat('{a} drops the apple into the baby carriage, and {b} tucks the blanket round it.'),
      by('b', "Look at our big apple baby."),
      by('a', "Don't. My jaw hurts. Push."),
    ] },
    { id: 'tsh.st.lu2', when: at('big-apple', 'load-up'), turns: [
      by('a', "Is it in? Is it safe?"),
      by('b', "It's in. Let's go."),
      beat('They turn the carriage towards the fountain.'),
    ] },
    { id: 'tsh.st.pi1', when: at('big-apple', 'push-it'), turns: [
      beat('They push the carriage through the park as fast as they can, the apple wobbling in the blanket.'),
      by('b', "Not too fast! Not over the bumps!"),
      by('a', "I'm being careful! Mostly!"),
    ] },
    { id: 'tsh.st.pi2', when: at('big-apple', 'push-it'), turns: [
      by('a', "There's the fountain!"),
      beat('They run the last stretch, both hands on the handle, steering round a man walking his dog.'),
      by('b', "Sorry! Big apple coming through!"),
    ] },
    { id: 'tsh.st.ft1', when: at('big-apple', 'the-fountain'), turns: [
      beat('They roll the carriage up to the fountain, apple and all, and the Chill Zone is right there.'),
      by('b', "We made it. With the apple."),
      by('a', "My teeth are never going to be the same."),
    ] },
    { id: 'tsh.st.ft2', when: at('big-apple', 'the-fountain'), turns: [
      by('a', "Still in there? The apple?"),
      by('b', "Still in there. Go, go!"),
      beat('They run onto the mat with the carriage.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the statue ──
    { id: 'tsh.sf.cl1', when: at('statue-climb', 'the-climb'), turns: [
      beat('{b}\'s foot slips on the smooth green copper, and {b} slides back down a whole section of the statue.'),
      by('a', "Are you okay?"),
      by('b', "I'm fine. I just have to climb all of that again."),
    ] },
    { id: 'tsh.sf.cl2', when: at('statue-climb', 'the-climb'), turns: [
      by('a', "I need a break. My arms are shaking."),
      beat('{a} hangs on to a fold of the statue\'s robe and stops climbing for a long minute.'),
      by('b', "Come on. Another team just passed us."),
    ] },
    { id: 'tsh.sf.hc1', when: at('statue-climb', 'haul-carriage'), turns: [
      beat('The rope tangles round the carriage wheels, and it swings and spins on the line and won\'t come up.'),
      by('a', "It's stuck! It's all tangled!"),
      by('b', "Let it down and pull it up again. Slowly."),
    ] },
    { id: 'tsh.sf.hc2', when: at('statue-climb', 'haul-carriage'), turns: [
      by('b', "Pull! You're not pulling!"),
      by('a', "I'm pulling! It's heavy!"),
      beat('The carriage slips and drops back down to the bottom of the rope.'),
    ] },
    { id: 'tsh.sf.rr1', when: at('statue-climb', 'rope-ride'), turns: [
      beat('Halfway down the rope, {b} panics and grabs the line with both hands, and the carriage stops dead and swings.'),
      by('a', "Let go of the rope! Let go!"),
      by('b', "I can't! My hands won't let go!"),
    ] },
    { id: 'tsh.sf.rr2', when: at('statue-climb', 'rope-ride'), turns: [
      by('a', "Hang on tight!"),
      beat('{a} lets go of the carriage instead, and has to climb all the way back up to the crown for another go.'),
      by('b', "Where did you go? You were right here!"),
    ] },

    // ── the sewers ──
    { id: 'tsh.sf.dr1', when: at('sewer', 'into-drain'), turns: [
      beat('{b} takes one look at the drain, and the smell, and climbs straight out of the carriage.'),
      by('b', "No. I'm not going in there."),
      by('a', "You have to! You have to stay in the carriage!"),
    ] },
    { id: 'tsh.sf.dr2', when: at('sewer', 'into-drain'), turns: [
      by('a', "Why won't it go?"),
      beat('The carriage\'s front wheels are stuck on the lip of the drain. It takes them a long time to lift it over.'),
      by('b', "Lift! Both ends! Lift!"),
    ] },
    { id: 'tsh.sf.tn1', when: at('sewer', 'the-tunnels'), turns: [
      beat('The tunnel ends at a locked iron grate. Daylight shows through it, but there\'s no way out.'),
      by('b', "Dead end. Back. All the way back."),
      by('a', "Pushing this thing backwards is even harder."),
    ] },
    { id: 'tsh.sf.tn2', when: at('sewer', 'the-tunnels'), turns: [
      by('a', "Have we been past this pipe before?"),
      by('b', "Yes. Twice. We're going in circles."),
      beat('{a} turns the carriage round, and they try the other tunnel.'),
    ] },
    { id: 'tsh.sf.gt1', when: at('sewer', 'the-gator'), turns: [
      beat('The water ahead ripples, and a pair of eyes rises out of it. Then a snout. Then teeth.'),
      by('b', "Back! Back! Go back!"),
      by('a', "I'm going! I'm going backwards!"),
    ] },
    { id: 'tsh.sf.gt2', when: at('sewer', 'the-gator'), turns: [
      by('a', "It's an alligator. There's an actual alligator."),
      beat('They back away, very slowly, and wait at the last bend until it swims off.'),
      by('b', "Can we go now? Please?"),
    ] },

    // ── the big apple ──
    { id: 'tsh.sf.wi1', when: at('big-apple', 'wade-in'), turns: [
      beat('{a} steps into the pond, and the water is so cold that {a} jumps straight back out.'),
      by('a', "It's freezing!"),
      by('b', "It's a pond! Get in!"),
    ] },
    { id: 'tsh.sf.wi2', when: at('big-apple', 'wade-in'), turns: [
      by('b', "Something just bit your shorts."),
      by('a', "What? What bit my shorts?"),
      beat('A snapping turtle swims away from the bank. {a} climbs out and checks {a.posAdj} shorts.'),
    ] },
    { id: 'tsh.sf.mo1', when: at('big-apple', 'mouth-only'), turns: [
      beat('The apple keeps bobbing away, and in the end {a} grabs it with both hands.'),
      by('b', "Hands! You used your hands!"),
      by('a', "It kept running away!"),
    ] },
    { id: 'tsh.sf.mo2', when: at('big-apple', 'mouth-only'), turns: [
      by('a', "It's too big! I can't get my mouth round it!"),
      beat('{a} bites, slips, and the apple floats back out into the middle of the pond.'),
      by('b', "Go after it! Teeth only!"),
    ] },
    { id: 'tsh.sf.lu1', when: at('big-apple', 'load-up'), turns: [
      beat('{a} drops the apple towards the carriage, misses, and it rolls back down the bank into the pond.'),
      by('b', "No! Back in!"),
      by('a', "I can't open my jaw anymore!"),
    ] },
    { id: 'tsh.sf.lu2', when: at('big-apple', 'load-up'), turns: [
      by('b', "That's not our carriage."),
      beat('There\'s a real baby in that carriage. They give it back to a very surprised mother and find their own.'),
      by('a', "I'm so sorry! It looked just like ours!"),
    ] },
    { id: 'tsh.sf.pi1', when: at('big-apple', 'push-it'), turns: [
      beat('The carriage hits a bump, the apple bounces out, and rolls away across the grass.'),
      by('a', "The apple! Get the apple!"),
      by('b', "It has to go back in the pond! We have to start again!"),
    ] },
    { id: 'tsh.sf.pi2', when: at('big-apple', 'push-it'), turns: [
      by('b', "Slow down on the corner!"),
      beat('{a} doesn\'t slow down. The carriage tips, and the apple rolls into a flower bed.'),
      by('a', "Back to the pond. I know. I know."),
    ] },
  ],
};
