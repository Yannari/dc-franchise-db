// Treasure Isles' challenges, stage by stage (js/rr/places/treasure-isles.js `stages`; director.js stageBeats).
//   the map         the-museum -> unroll-maps -> tug-of-war -> logo-map                  (All-In: both search)
//   the doubloons   tank-on -> going-under -> the-tunnels -> the-gold -> surface          (Botch or Watch: a dives, b in the boat)
// A plain map goes back on the pile; a diver low on air comes back up for a fresh tank. The pirate captain is the place's
// own local.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the map ──
    { id: 'ti.st.mu1', when: at('pirate-map', 'the-museum'), turns: [
      beat('The pirate museum is packed with old chests, ship\'s wheels, cannons, and rolled-up maps stuffed into every barrel.'),
      by('b', "There are hundreds of them."),
      by('a', "We need one with the race logo. Start with the barrels."),
    ] },
    { id: 'ti.st.mu2', when: at('pirate-map', 'the-museum'), turns: [
      by('a', "Look at the ceiling. It's one huge map."),
      by('b', "We can't take the ceiling. Find a small one."),
      beat('They split up and start pulling maps out of the nearest barrels.'),
    ] },
    { id: 'ti.st.um1', when: at('pirate-map', 'unroll-maps'), turns: [
      beat('{a} unrolls a map across the glass case. Islands, a compass, a dotted line. No logo.'),
      by('a', "Not this one."),
      by('b', "Next. Keep going."),
    ] },
    { id: 'ti.st.um2', when: at('pirate-map', 'unroll-maps'), turns: [
      by('b', "Check the corners. The logo would be small."),
      beat('{a} turns the map over, and there in the bottom corner is the race\'s little logo.'),
      by('a', "That's it! That's the one!"),
    ] },
    { id: 'ti.st.tw1', when: at('pirate-map', 'tug-of-war'), turns: [
      beat('{a} grabs the map at the same moment as somebody from another team, and they both pull.'),
      by('a', "I saw it first!"),
      by('b', "Let go! Let go of our map!"),
      beat('The other team lets go, and {a} stumbles backwards holding the map.'),
    ] },
    { id: 'ti.st.tw2', when: at('pirate-map', 'tug-of-war'), turns: [
      by('b', "Hold it with both hands. Don't let anyone near it."),
      beat('{a} rolls the map up tight and tucks it under {a.posAdj} arm like a rugby ball.'),
      by('a', "Nobody's touching this. Let's go."),
    ] },
    { id: 'ti.st.lm1', when: at('pirate-map', 'logo-map'), turns: [
      beat('They unroll the map one last time to check: the logo, the islands, and an X in the middle of the sea.'),
      by('b', "X marks the spot. Of course it does."),
      by('a', "Jet skis. Let's go."),
    ] },
    { id: 'ti.st.lm2', when: at('pirate-map', 'logo-map'), turns: [
      by('a', "Read the tip. Where do we go?"),
      by('b', "Jet skis to the islands. Then we dive for treasure."),
      by('a', "Real treasure? I'm in."),
    ] },

    // ── the doubloons ──
    { id: 'ti.st.to1', when: at('doubloons', 'tank-on'), turns: [
      beat('On the dock, {a} straps on an air tank and pulls a mask down over {a.posAdj} face.'),
      by('b', "I'll be right here. In the boat. Watching the bubbles."),
      by('a', "Watch them really closely. Please."),
    ] },
    { id: 'ti.st.to2', when: at('doubloons', 'tank-on'), turns: [
      by('a', "Breathe through the mouth, not the nose. Right?"),
      by('b', "Right. And don't panic."),
      by('a', "I'll try not to."),
    ] },
    { id: 'ti.st.gu1', when: at('doubloons', 'going-under'), turns: [
      beat('{a} rolls backwards off the boat and sinks down past the coral, a trail of bubbles going up behind.'),
      by('b', "Bubbles. I see bubbles. Good."),
      beat('The bubbles drift slowly away from the boat, towards the reef.'),
    ] },
    { id: 'ti.st.gu2', when: at('doubloons', 'going-under'), turns: [
      beat('Underwater, everything is quiet and blue. Fish drift past {a}\'s mask, and the reef drops away into dark tunnels below.'),
      by('b', "Where are you? I can't see you anymore."),
      beat('{a} checks the map and swims down towards the tunnels.'),
    ] },
    { id: 'ti.st.tn1', when: at('doubloons', 'the-tunnels'), turns: [
      beat('{a} checks the map, waterproof and wrinkled, and swims into the left tunnel.'),
      by('b', "Come on. Come on. Where are you?"),
      beat('The bubbles move slowly along the surface, the way the map says.'),
    ] },
    { id: 'ti.st.tn2', when: at('doubloons', 'the-tunnels'), turns: [
      beat('The tunnel narrows, and {a} has to squeeze through sideways, one hand on the rock.'),
      by('b', "The bubbles stopped. Why did the bubbles stop?"),
      beat('A second later, they start again, a little further along.'),
    ] },
    { id: 'ti.st.gd1', when: at('doubloons', 'the-gold'), turns: [
      beat('At the end of the tunnel, half buried in the sand, is a leather bag. {a} opens it, and gold coins catch the light.'),
      beat('{a} ties the bag to {a.posAdj} belt and kicks for the surface.'),
      by('b', "Here they come! The bubbles are coming back!"),
    ] },
    { id: 'ti.st.gd2', when: at('doubloons', 'the-gold'), turns: [
      by('b', "Hurry up. The tank won't last forever."),
      beat('{a} grabs the bag, checks the gauge, and heads straight back up.'),
      by('b', "There! The bubbles are coming back!"),
    ] },
    { id: 'ti.st.sf1', when: at('doubloons', 'surface'), turns: [
      beat('{a} bursts up out of the water next to the boat and holds up the bag of gold.'),
      by('a', "Gold! Real gold!"),
      by('b', "It's chocolate. It's chocolate coins in gold paper."),
      by('a', "I don't care. It's still treasure."),
    ] },
    { id: 'ti.st.sf2', when: at('doubloons', 'surface'), turns: [
      by('b', "Did you find it? Tell me you found it."),
      by('a', "Found it. And a lot of very confused fish."),
      beat('{b} pulls {a} back into the boat, and they head for the harbour.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the map ──
    { id: 'ti.sf.um1', when: at('pirate-map', 'unroll-maps'), turns: [
      beat('{b} unrolls ten maps in a row. Not one of them has the logo.'),
      by('b', "How many maps can one museum have?"),
      by('a', "All of them, apparently. Keep looking."),
    ] },
    { id: 'ti.sf.um2', when: at('pirate-map', 'unroll-maps'), turns: [
      by('a', "This one! It's got a logo!"),
      by('b', "That's the museum's logo. Not ours."),
      beat('{a} rolls it back up and throws it on the pile.'),
    ] },
    { id: 'ti.sf.tw1', when: at('pirate-map', 'tug-of-war'), turns: [
      beat('{a} and somebody from another team both grab the same map and pull. The other team pulls harder.'),
      by('a', "No! That was ours!"),
      by('b', "Forget it. There are more. Keep looking."),
    ] },
    { id: 'ti.sf.tw2', when: at('pirate-map', 'tug-of-war'), turns: [
      by('b', "Pull! Pull harder!"),
      beat('They pull. The other team pulls. The map tears in half down the middle.'),
      by('a', "Well. Now nobody has it."),
    ] },

    // ── the doubloons ──
    { id: 'ti.sf.to1', when: at('doubloons', 'tank-on'), turns: [
      beat('{a} sits on the edge of the boat with the tank on, looks down at the dark water, and doesn\'t move.'),
      by('a', "What's down there?"),
      by('b', "Fish! Gold! Just go!"),
    ] },
    { id: 'ti.sf.to2', when: at('doubloons', 'tank-on'), turns: [
      by('b', "Why are you breathing like that?"),
      by('a', "I'm testing the tank. I'm making sure it works."),
      beat('{a} tests it for a long time.'),
    ] },
    { id: 'ti.sf.tn1', when: at('doubloons', 'the-tunnels'), turns: [
      beat('{a} takes the right tunnel instead of the left, ends up in a dead end, and checks the air gauge. It\'s low.'),
      beat('{a} has to swim all the way back up for a fresh tank.'),
      by('b', "What happened? You were gone for ages!"),
    ] },
    { id: 'ti.sf.tn2', when: at('doubloons', 'the-tunnels'), turns: [
      by('b', "Why are the bubbles coming straight up?"),
      beat('{a} pops up out of the water, gasping.'),
      by('a', "Too tight. The tunnel was too tight. I couldn't do it."),
    ] },
    { id: 'ti.sf.gd1', when: at('doubloons', 'the-gold'), turns: [
      beat('{a} is reaching for the bag when the air gauge starts to blink. {a} has to leave it and go straight up.'),
      by('a', "I touched it! I touched the bag!"),
      by('b', "Fresh tank. Go again."),
    ] },
    { id: 'ti.sf.gd2', when: at('doubloons', 'the-gold'), turns: [
      by('b', "Have you got it?"),
      beat('{a} comes up holding a bag. It\'s full of sand and one very small crab.'),
      by('a', "Wrong bag. It's still down there."),
    ] },
  ],
};
