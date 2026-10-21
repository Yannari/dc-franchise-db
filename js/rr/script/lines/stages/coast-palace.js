// Coast Palace's challenges, stage by stage (js/rr/places/coast-palace.js `stages`; director.js stageBeats).
//   the shark        suit-up -> in-the-water -> the-pass -> back-aboard                  (Botch or Watch: a in the water, b on the boat)
//   the sand palace  the-plan -> walls -> towers -> the-verdict -> the-nod                (All-In: both build; the surfer boy judges)
// A missed grab means treading water until the shark comes round again; a palace the surfer boy won't pass is rebuilt
// where he points. He is the place's own local (the avatar stands there: js/vp-rr-ep/locals.js).
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the shark ──
    { id: 'cp.st.su1', when: at('shark', 'suit-up'), turns: [
      beat('On the deck of the boat, {a} pulls on a mask and snorkel and stands at the top of the ladder, staring down into the deep blue water.'),
      by('b', "You've got this. It's just a fish."),
      by('a', "It's a great white shark. It's not just a fish."),
      beat('{a} climbs down the ladder anyway, one rung at a time.'),
    ] },
    { id: 'cp.st.su2', when: at('shark', 'suit-up'), turns: [
      by('a', "Do I look brave? Tell me I look brave."),
      by('b', "Very brave. Your mask's upside down, though."),
      beat('{a} turns the mask the right way up, takes a huge breath, and lowers {a.ref} into the sea.'),
    ] },
    { id: 'cp.st.wa1', when: at('shark', 'in-the-water'), turns: [
      beat('{a} treads water beside the boat. Out in the blue, a grey fin cuts slowly through the waves, going round in a big lazy circle.'),
      by('b', "Stay calm! Don't splash!"),
      by('a', "I'm trying! I'm really trying!"),
    ] },
    { id: 'cp.st.wa2', when: at('shark', 'in-the-water'), turns: [
      by('a', "I can see the tip! It's clipped right onto the fin!"),
      by('b', "Okay! When it comes past, grab the tip. Just the tip!"),
      by('a', "Yeah, I wasn't going to grab the shark!"),
    ] },
    { id: 'cp.st.wa3', when: at('shark', 'in-the-water'), turns: [
      beat('{a} floats as still as a log while the fin circles closer, and closer, and closer.'),
      by('b', "It's coming round! Get ready!"),
      by('a', "I've been ready for ten minutes! My legs are dying!"),
    ] },
    { id: 'cp.st.pa1', when: at('shark', 'the-pass'), turns: [
      beat('The fin sweeps past, close enough to touch. {a} lunges, grabs, and comes up out of the water with the tip held high.'),
      by('b', "You got it! You actually got it!"),
      by('a', "I touched a shark! I touched a shark and it didn't eat me!"),
    ] },
    { id: 'cp.st.pa2', when: at('shark', 'the-pass'), turns: [
      by('b', "Now! Now! Grab it now!"),
      beat('{a} reaches out at exactly the right moment and plucks the tip off the fin as neatly as picking an apple.'),
      by('a', "Got it! Oh my god, I got it!"),
    ] },
    { id: 'cp.st.pa3', when: at('shark', 'the-pass'), turns: [
      beat('The shark glides past {a} so slowly that it almost seems polite, and the tip comes away in {a.posAdj} hand with a little click.'),
      by('a', "Thank you! Sorry! Thank you!"),
      by('b', "Did you just say thank you to a shark?"),
    ] },
    { id: 'cp.st.ab1', when: at('shark', 'back-aboard'), turns: [
      beat('{a} scrambles up the ladder faster than anyone has ever climbed a ladder, and flops onto the deck like a landed fish.'),
      by('b', "I'm so proud of you! How was it?"),
      by('a', "Never again. Just read the tip."),
    ] },
    { id: 'cp.st.ab2', when: at('shark', 'back-aboard'), turns: [
      by('b', "\"Build a replica of the palace in sand.\" We're going to the beach!"),
      by('a', "Good. Shallow water. I love shallow water."),
      beat('The boat turns for the shore.'),
    ] },

    // ── the sand palace ──
    { id: 'cp.st.pl1', when: at('sand-palace', 'the-plan'), turns: [
      beat('The beach below the palace is covered with lines scratched in the sand: other teams\' plans, all towers and gates and arrows.'),
      by('a', "Okay, look at the photo. Four towers, a wall, a gate in the middle."),
      by('b', "That's a lot of palace for two people and a bucket."),
    ] },
    { id: 'cp.st.pl2', when: at('sand-palace', 'the-plan'), turns: [
      by('b', "We should draw it out first. A plan."),
      beat('{b} takes a stick and scratches a careful outline into the sand, with four little circles for the towers.'),
      by('a', "Nice. Now we just have to actually build it."),
    ] },
    { id: 'cp.st.wl1', when: at('sand-palace', 'walls'), turns: [
      beat('{a} fills the bucket with wet sand, flips it over, and pats the bottom. A perfect block slides out.'),
      by('a', "One down. About four hundred to go."),
      by('b', "Keep the sand wet. Dry sand just falls down."),
    ] },
    { id: 'cp.st.wl2', when: at('sand-palace', 'walls'), turns: [
      by('b', "The walls have to be straight. He's going to check."),
      beat('{b} lies down on the sand and squints along the top of the wall like a builder with a spirit level.'),
      by('b', "Yep. That's straight."),
    ] },
    { id: 'cp.st.tw1', when: at('sand-palace', 'towers'), turns: [
      beat('{a} carves the first tower with a plastic spoon, scraping out little windows, one at a time.'),
      by('b', "That looks amazing."),
      by('a', "Don't breathe on it."),
    ] },
    { id: 'cp.st.tw2', when: at('sand-palace', 'towers'), turns: [
      by('a', "Four towers. One on each corner."),
      by('b', "And a flag on top of each one, like the photo."),
      beat('{b} sticks a little twig on top of each tower. It is the finishing touch, and it is perfect.'),
    ] },
    { id: 'cp.st.tw3', when: at('sand-palace', 'towers'), turns: [
      beat('A wave runs up the beach, stops a hand\'s width from the palace wall, and slides back down again.'),
      by('a', "Did you see that? Did you see how close that was?"),
      by('b', "Build faster. The tide's coming in."),
    ] },
    { id: 'cp.st.vd1', when: at('sand-palace', 'the-verdict'), turns: [
      beat('The surfer boy walks all the way round the palace with his hands behind his back, like a very small army general.'),
      by('a', "Why am I so nervous? He's like seven."),
      by('b', "Seven-year-olds are brutal, though."),
    ] },
    { id: 'cp.st.vd2', when: at('sand-palace', 'the-verdict'), turns: [
      beat('The surfer boy crouches down and counts the towers, then the windows, then the steps up to the gate.'),
      by('b', "We did the steps. Please tell me we did the steps."),
      by('a', "We did the steps."),
      beat('The surfer boy finishes counting and stands up.'),
    ] },
    { id: 'cp.st.nd1', when: at('sand-palace', 'the-nod'), turns: [
      beat('The surfer boy looks at the palace for a long moment, then gives one single, serious nod and hands over the tip.'),
      by('b', "He nodded! We got a nod!"),
      by('a', "That's the best nod I've ever had."),
    ] },
    { id: 'cp.st.nd2', when: at('sand-palace', 'the-nod'), turns: [
      by('a', "Is that a yes? I think that's a yes."),
      beat('The surfer boy gives them a thumbs-up, holds out the tip, and walks off to judge the next team without another word.'),
      by('b', "He's so cool. I kind of want to be him."),
    ] },
  ],

  'task-stage.fail': [
    // ── the shark ──
    { id: 'cp.sf.su1', when: at('shark', 'suit-up'), turns: [
      beat('{a} gets three rungs down the ladder, sees a dark shape glide under the boat, and comes straight back up.'),
      by('a', "Nope. It's right there. It's right under us."),
      by('b', "That's where it's supposed to be!"),
    ] },
    { id: 'cp.sf.su2', when: at('shark', 'suit-up'), turns: [
      by('a', "Give me a second. I'm getting ready."),
      beat('{a} has been psyching {a.ref} up at the top of the ladder for a long time now, while another team\'s boat pulls up alongside.'),
      by('b', "Get ready faster!"),
    ] },
    { id: 'cp.sf.wa1', when: at('shark', 'in-the-water'), turns: [
      beat('The fin turns towards {a} and starts coming in a straight line.'),
      by('a', "It's looking at me! It's looking right at me!"),
      beat('{a} panics, splashes back to the ladder, and hauls {a.ref} out of the water before the shark is anywhere near.'),
    ] },
    { id: 'cp.sf.wa2', when: at('shark', 'in-the-water'), turns: [
      by('b', "Stop splashing! You look like food!"),
      by('a', "I can't help it! I'm scared!"),
      beat('The fin veers away and disappears, and they have to wait for it to come round again.'),
    ] },
    { id: 'cp.sf.pa1', when: at('shark', 'the-pass'), turns: [
      beat('The fin sweeps past. {a} grabs, a second too late, and comes up with a fistful of seawater.'),
      by('b', "Too late! You were too late!"),
      by('a', "I know! I was there!"),
    ] },
    { id: 'cp.sf.pa2', when: at('shark', 'the-pass'), turns: [
      by('b', "Wait for it... wait for it..."),
      beat('{a} doesn\'t wait for it, lunges far too early, and grabs at empty water a whole body length in front of the shark.'),
      by('a', "You said wait like you meant now!"),
    ] },
    { id: 'cp.sf.pa3', when: at('shark', 'the-pass'), turns: [
      beat('As the shark goes past, {a} closes {a.posAdj} eyes, reaches out blindly, and pats it gently on the side.'),
      by('b', "Did you just stroke it?"),
      by('a', "I panicked! It's coming round again, isn't it?"),
    ] },

    // ── the sand palace ──
    { id: 'cp.sf.wl1', when: at('sand-palace', 'walls'), turns: [
      beat('The sun dries the top of the wall, and the whole long side of it slowly slumps into a soft brown heap.'),
      by('b', "No, no, no. I said keep it wet!"),
      by('a', "I was! The sun's drying it out!"),
    ] },
    { id: 'cp.sf.wl2', when: at('sand-palace', 'walls'), turns: [
      by('a', "Pass me the bucket."),
      beat('{b} passes the bucket by tossing it, and it lands right on top of the new wall, flattening it.'),
      by('b', "Sorry, sorry. I'll fix it."),
    ] },
    { id: 'cp.sf.tw1', when: at('sand-palace', 'towers'), turns: [
      beat('A wave comes further up the beach than all the others, and the front tower simply melts into the sea.'),
      by('a', "My tower! I did windows on that!"),
      by('b', "Build it further back this time."),
    ] },
    { id: 'cp.sf.tw2', when: at('sand-palace', 'towers'), turns: [
      by('b', "Just one more spoonful off the top, to make it pointy."),
      beat('{b} takes one more spoonful off the top, and the whole tower leans, cracks, and falls over sideways.'),
      by('a', "That's three now. Stop making them pointy."),
    ] },
    { id: 'cp.sf.vd1', when: at('sand-palace', 'the-verdict'), turns: [
      beat('The surfer boy walks round the palace once, then points at the left side, shakes his head, and holds up three fingers.'),
      by('b', "Three? Three what?"),
      by('a', "Three towers. There should be four. We forgot a tower."),
    ] },
    { id: 'cp.sf.vd2', when: at('sand-palace', 'the-verdict'), turns: [
      by('a', "So? What do you think? It's good, right?"),
      beat('The surfer boy points at the gate, which is lopsided, then at the gardens, which are just a flat patch of sand, and shakes his head.'),
      by('b', "He's so tough. I'm kind of scared of him."),
    ] },
    { id: 'cp.sf.vd3', when: at('sand-palace', 'the-verdict'), turns: [
      beat('The surfer boy crouches, pokes the main wall with one finger, and a big chunk of it falls off.'),
      by('a', "Hey! Anything falls down if you poke it!"),
      beat('The surfer boy shrugs and points at the gap. They start patching.'),
    ] },
  ],
};
