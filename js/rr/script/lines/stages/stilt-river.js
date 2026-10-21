// Stilt River's challenges, stage by stage (js/rr/places/stilt-river.js `stages`; director.js stageBeats).
//   the catfish  wade-in -> feel-around -> the-basket -> six-fish                    (Superteam: teams together, bare hands)
//   the tunnels  in-the-dark -> the-traps -> tunnel-ends -> map-box -> daylight       (All-In: one torch between them)
// A catfish that wriggles out of the basket has to be caught again; a sprung trap or a wrong turn sends a team back to
// the last junction. The fisherman is the place's own local.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the catfish ──
    { id: 'sr.st.wi1', when: at('catfish', 'wade-in'), turns: [
      beat('The teams wade into the brown shallows together, mud squelching up between their toes.'),
      by('a', "It's warm. Why is it warm?"),
      by('b', "Don't think about why. Just look for fish."),
    ] },
    { id: 'sr.st.wi2', when: at('catfish', 'wade-in'), turns: [
      by('b', "Six fish. Between all of us. That's not so bad."),
      by('a', "With our hands, though. No nets."),
      beat('Everyone spreads out across the shallows, bent over, peering into the murky water.'),
    ] },
    { id: 'sr.st.fa1', when: at('catfish', 'feel-around'), turns: [
      beat('{a} sticks both arms into the mud under the bank, feels around, and goes very still.'),
      by('a', "There's something here. Something big. It's moving."),
      by('b', "Grab it! Grab it!"),
    ] },
    { id: 'sr.st.fa2', when: at('catfish', 'feel-around'), turns: [
      by('b', "Got one! I've got one! Oh, it's slimy!"),
      beat('{b} stands up out of the water with a fat, whiskered catfish wriggling in both arms.'),
      by('a', "Don't let go! Basket! Get it to the basket!"),
    ] },
    { id: 'sr.st.fa3', when: at('catfish', 'feel-around'), turns: [
      beat('{a} ducks right under the water and comes up a few seconds later, spluttering, with a catfish in a bear hug.'),
      by('a', "It's so strong! It's all muscle!"),
      by('b', "Don't let go! Walk it to the basket!"),
    ] },
    { id: 'sr.st.bk1', when: at('catfish', 'the-basket'), turns: [
      beat('{b} drops the catfish into the fisherman\'s basket and slams the lid down on it.'),
      by('b', "That's one! How many is that?"),
      by('a', "Four, I think. Two more."),
    ] },
    { id: 'sr.st.bk2', when: at('catfish', 'the-basket'), turns: [
      by('a', "Hold the lid. Hold it down."),
      beat('The basket bumps and thumps with angry fish, and {b} sits on the lid to keep it shut.'),
      by('b', "They really don't want to be in here."),
    ] },
    { id: 'sr.st.sx1', when: at('catfish', 'six-fish'), turns: [
      beat('The fisherman lifts the lid, counts the fish with one finger, and nods: six.'),
      by('b', "Six! That's six!"),
      by('a', "We did it. All of us. I need a shower."),
    ] },
    { id: 'sr.st.sx2', when: at('catfish', 'six-fish'), turns: [
      by('a', "Is that six? Count again."),
      beat('The fisherman counts again. Still six. Every team gets a tip.'),
      by('b', "Good. Let's get out of this mud."),
    ] },

    // ── the tunnels ──
    { id: 'sr.st.dk1', when: at('tunnels', 'in-the-dark'), turns: [
      beat('The tunnel mouth is low and dark, and the air coming out of it is cold and smells of old earth.'),
      by('b', "One torch. For both of us."),
      by('a', "Then stay close. Really close."),
    ] },
    { id: 'sr.st.dk2', when: at('tunnels', 'in-the-dark'), turns: [
      by('a', "You go first. You've got the torch."),
      by('b', "Why do I have the torch?"),
      beat('{b} ducks into the tunnel, and {a} follows, holding onto the back of {b.posAdj} shirt.'),
    ] },
    { id: 'sr.st.tr1', when: at('tunnels', 'the-traps'), turns: [
      beat('The torch beam catches a thin wire stretched across the tunnel at ankle height.'),
      by('b', "Wire. Step over it. Big step."),
      beat('{a} steps over it, very carefully, and nothing happens.'),
    ] },
    { id: 'sr.st.tr2', when: at('tunnels', 'the-traps'), turns: [
      by('a', "That bit of floor looks different."),
      by('b', "Different how?"),
      by('a', "Like it's not floor. Go round it."),
      beat('They squeeze round the edge, and the patch of floor they skipped wobbles.'),
    ] },
    { id: 'sr.st.te1', when: at('tunnels', 'tunnel-ends'), turns: [
      beat('The tunnel splits three ways. The torch shows three black holes, all exactly the same.'),
      by('b', "Left?"),
      by('a', "There's a breeze coming from the left. Left."),
    ] },
    { id: 'sr.st.te2', when: at('tunnels', 'tunnel-ends'), turns: [
      by('a', "Have we been here before?"),
      by('b', "No. That rock's new. Keep going."),
      beat('They shuffle on into the dark, the torch beam bouncing off the walls.'),
    ] },
    { id: 'sr.st.mb1', when: at('tunnels', 'map-box'), turns: [
      beat('Round the next corner, the torch lands on a Don Box sitting in the dirt. Inside it is a folded map.'),
      by('b', "The map! The way out!"),
      by('a', "Read it fast. I want to see the sun."),
    ] },
    { id: 'sr.st.mb2', when: at('tunnels', 'map-box'), turns: [
      by('a', "Right, right, left, straight. That's it."),
      by('b', "That's all? We've been wandering around for ages."),
      beat('They follow the map, turning right, right, left, and straight on.'),
    ] },
    { id: 'sr.st.dl1', when: at('tunnels', 'daylight'), turns: [
      beat('The tunnel slopes up, and suddenly there\'s green light ahead, and then they\'re out in the jungle, blinking.'),
      by('b', "Daylight! Oh, I missed you, daylight!"),
      by('a', "Come on. Temple path. We're nearly done."),
    ] },
    { id: 'sr.st.dl2', when: at('tunnels', 'daylight'), turns: [
      by('a', "We made it out. I can't believe we made it out."),
      by('b', "You've got mud all down your face."),
      by('a', "So do you."),
    ] },
  ],

  'task-stage.fail': [
    // ── the catfish ──
    { id: 'sr.sf.wi1', when: at('catfish', 'wade-in'), turns: [
      beat('{a} takes one step into the shallows, the mud slides out from under {a.posAdj} feet, and {a} sits down in the water.'),
      by('b', "Are you okay?"),
      by('a', "I'm fine. I'm just wet. Very wet."),
    ] },
    { id: 'sr.sf.wi2', when: at('catfish', 'wade-in'), turns: [
      by('b', "My shoe! The mud took my shoe!"),
      beat('{b} spends a whole minute digging in the mud for a shoe while everyone else looks for fish.'),
      by('a', "Leave the shoe! We'll buy you a new shoe!"),
    ] },
    { id: 'sr.sf.fa1', when: at('catfish', 'feel-around'), turns: [
      beat('{a} grabs a catfish, holds it up, and it slips straight out of {a.posAdj} hands and back into the water.'),
      by('a', "It's too slippery! It's like holding soap!"),
      by('b', "Hold it by the gills! Not the tail!"),
    ] },
    { id: 'sr.sf.fa2', when: at('catfish', 'feel-around'), turns: [
      by('b', "Did you get one?"),
      by('a', "I got a stick. And some weed. And a boot."),
      beat('{a} throws the boot back. It is not a fish.'),
    ] },
    { id: 'sr.sf.bk1', when: at('catfish', 'the-basket'), turns: [
      beat('{b} lifts the lid to put a fish in, and the one already inside flops straight out, over the edge, and back into the river.'),
      by('b', "No! Come back!"),
      by('a', "That one counts again. We need another one."),
    ] },
    { id: 'sr.sf.bk2', when: at('catfish', 'the-basket'), turns: [
      by('a', "Who left the lid open?"),
      beat('Nobody admits it. Two catfish are already halfway back to the middle of the river.'),
      by('b', "Okay. Back in the water."),
    ] },

    // ── the tunnels ──
    { id: 'sr.sf.dk1', when: at('tunnels', 'in-the-dark'), turns: [
      beat('{a} gets two steps into the tunnel, hears something skitter in the dark, and walks straight back out.'),
      by('a', "Something's in there."),
      by('b', "Everything's in there. It's a tunnel. Come on."),
    ] },
    { id: 'sr.sf.dk2', when: at('tunnels', 'in-the-dark'), turns: [
      by('b', "The torch won't turn on."),
      beat('{b} shakes it, bangs it, and finally finds the switch, which was already on. The bulb was just loose.'),
      by('a', "Okay. Now we can go."),
    ] },
    { id: 'sr.sf.tr1', when: at('tunnels', 'the-traps'), turns: [
      beat('{a} steps on a loose board, and a bucket of sand pours down from the ceiling right on top of {a.obj}.'),
      by('a', "Ugh! It's in my ears! It's everywhere!"),
      by('b', "Back to the junction. We have to start again."),
    ] },
    { id: 'sr.sf.tr2', when: at('tunnels', 'the-traps'), turns: [
      by('b', "Careful, there's a...!"),
      beat('{a} walks straight through the tripwire. The floor drops away, and {a} lands in a pit of mud up to {a.posAdj} waist.'),
      by('a', "Thanks for the warning."),
    ] },
    { id: 'sr.sf.te1', when: at('tunnels', 'tunnel-ends'), turns: [
      beat('The tunnel ends in a wall of rock. A dead end.'),
      by('b', "Back. Back the way we came."),
      by('a', "Which way did we come?"),
    ] },
    { id: 'sr.sf.te2', when: at('tunnels', 'tunnel-ends'), turns: [
      by('a', "The torch is dying. It's going orange."),
      beat('The torch flickers out, and for a long minute they feel their way along the wall in total darkness.'),
      by('b', "That's my face. You're touching my face."),
    ] },
  ],
};
