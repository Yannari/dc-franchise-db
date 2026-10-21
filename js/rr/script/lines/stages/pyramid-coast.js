// Pyramid Coast's challenge, stage by stage (js/rr/places/pyramid-coast.js `stages`; director.js stageBeats).
//   the pepper and the jump  pick-pepper -> eat-pepper -> the-ledge -> cliff-jump -> milk-swim -> milk-delivered
//   (All-In: a eats the pepper, b jumps for the milk; the hotter the pepper, the lower the ledge)
// A pepper left unfinished or a jump refused means picking again. The pepper vendor is the place's own local.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });
const T = 'pepper-cliff';

export default {
  'task-stage.ok': [
    { id: 'pc.st.pp1', when: at(T, 'pick-pepper'), turns: [
      beat('At the chilli cart, there are three baskets of peppers: green for mild, orange for hot, red for fiery.'),
      by('a', "Mild means you jump from the top. Fiery means you jump from the bottom."),
      by('b', "So it's your mouth or my legs."),
      by('a', "Pretty much."),
    ] },
    { id: 'pc.st.pp2', when: at(T, 'pick-pepper'), turns: [
      by('b', "Which one are you picking?"),
      by('a', "The orange one. Middle pepper, middle ledge. Nobody gets hurt too much."),
      beat('The vendor hands {a} an orange pepper and a matching orange flag.'),
    ] },
    { id: 'pc.st.ep1', when: at(T, 'eat-pepper'), turns: [
      beat('{a} bites the pepper in half and chews. For a second, nothing. Then {a}\'s eyes go very wide.'),
      by('a', "Oh. Oh no. Oh, that's hot."),
      by('b', "Finish it! You have to eat all of it!"),
    ] },
    { id: 'pc.st.ep2', when: at(T, 'eat-pepper'), turns: [
      by('b', "How is it?"),
      beat('{a} can\'t answer. {a} just swallows the last bit, waves the flag over {a.posAdj} head and points at the cliff.'),
      by('b', "Going! I'm going!"),
    ] },
    { id: 'pc.st.ld1', when: at(T, 'the-ledge'), turns: [
      beat('{b} climbs down to the ledge with the matching flag. The sea is a long way below, crashing against the rocks.'),
      by('b', "Okay. That's high. That's really high."),
      by('a', "Jump! My mouth is on fire!"),
    ] },
    { id: 'pc.st.ld2', when: at(T, 'the-ledge'), turns: [
      by('a', "Hurry up! Please hurry up!"),
      by('b', "I'm going! Just let me find the deep bit."),
      beat('{b} picks a spot, backs up two steps, and runs at the edge.'),
    ] },
    { id: 'pc.st.cj1', when: at(T, 'cliff-jump'), turns: [
      beat('{b} jumps, arms and legs everywhere, and hits the water with a huge splash.'),
      by('a', "Did you get it? Find the milk!"),
      by('b', "Give me a second! I just jumped off a cliff!"),
    ] },
    { id: 'pc.st.cj2', when: at(T, 'cliff-jump'), turns: [
      by('b', "Here I go! Don't watch!"),
      beat('{b} jumps feet first, holding {b.posAdj} nose, and drops straight down into the sea.'),
      by('a', "Milk! Get the milk!"),
    ] },
    { id: 'pc.st.ms1', when: at(T, 'milk-swim'), turns: [
      beat('Under the water, {b} spots the canteen of milk tied to a rock, grabs it and kicks for the surface.'),
      by('b', "Got it! Got the milk!"),
      by('a', "Bring it! Bring it now!"),
    ] },
    { id: 'pc.st.ms2', when: at(T, 'milk-swim'), turns: [
      by('b', "I'm coming! It's heavy!"),
      beat('{b} swims back to the rocks with the canteen held up out of the water, and starts the climb back up.'),
      by('a', "Faster! It's getting worse!"),
    ] },
    { id: 'pc.st.md1', when: at(T, 'milk-delivered'), turns: [
      beat('{b} runs back to the cart, soaking wet, and holds out the canteen. {a} drinks the whole thing in one go.'),
      by('a', "Oh, that's so much better. Thank you. Thank you so much."),
      by('b', "You owe me. I jumped off a cliff for that."),
    ] },
    { id: 'pc.st.md2', when: at(T, 'milk-delivered'), turns: [
      by('a', "I'm never eating a pepper again."),
      by('b', "You say that every time we eat something."),
      beat('The vendor hands over the tip, and they head for the burros.'),
    ] },
  ],

  'task-stage.fail': [
    { id: 'pc.sf.ep1', when: at(T, 'eat-pepper'), turns: [
      beat('{a} takes one bite of the red pepper, spits it straight out, and fans {a.posAdj} mouth with both hands.'),
      by('a', "No! No! I can't! That's not food!"),
      by('b', "Okay. Okay. Pick a different one."),
    ] },
    { id: 'pc.sf.ep2', when: at(T, 'eat-pepper'), turns: [
      by('b', "You have to eat the whole thing. Even the stalk end."),
      beat('{a} eats most of it, then puts the last bit down on the cart and refuses to pick it back up.'),
      by('a', "That's enough. That's plenty."),
    ] },
    { id: 'pc.sf.ld1', when: at(T, 'the-ledge'), turns: [
      beat('{b} walks to the edge, looks down at the waves, and walks straight back again.'),
      by('b', "I can't. It's too high. Pick a hotter one."),
      by('a', "A hotter one? Are you serious?"),
    ] },
    { id: 'pc.sf.ld2', when: at(T, 'the-ledge'), turns: [
      by('a', "Why are you just standing there?"),
      by('b', "I'm waiting for a wave. You're supposed to jump on a wave."),
      beat('{b} waits for the wave, then the next one, then the next one, and doesn\'t jump.'),
    ] },
    { id: 'pc.sf.ms1', when: at(T, 'milk-swim'), turns: [
      beat('A wave hits {b} right in the face, and the canteen slips out of {b.posAdj} hand and sinks.'),
      by('b', "I lost it! I lost the milk!"),
      by('a', "Go back down! Go get it!"),
    ] },
    { id: 'pc.sf.ms2', when: at(T, 'milk-swim'), turns: [
      by('b', "Which one's mine? There are loads of canteens!"),
      beat('{b} swims up with a canteen, and it\'s the wrong colour. Back under {b.sub} goes.'),
      by('a', "The orange one! Ours is orange!"),
    ] },
  ],
};
