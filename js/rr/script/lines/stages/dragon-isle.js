// Dragon Isle's challenges, stage by stage (js/rr/places/dragon-isle.js `stages`; director.js stageBeats).
//   the drool  the-ranger -> distraction -> the-sponge -> fill-vial -> vial-tip    (All-In: b holds its eye, a goes in with the sponge)
//   the rugs   rug-mountain -> dig-in -> unroll -> the-weaver -> rug-tip           (All-In: both dig)
// A lizard that wakes up sends the team running; the wrong rug at the weaver's feet sends them back to the pile. The
// ranger is the place's own local.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the drool ──
    { id: 'di.st.rg1', when: at('venom', 'the-ranger'), turns: [
      beat('The ranger hands them a long forked stick, a sponge on a pole and a tiny glass vial, and points under the stilt huts.'),
      by('b', "Are those... lizards? They're the size of crocodiles."),
      by('a', "They're dragons. Real ones. And we need their spit."),
    ] },
    { id: 'di.st.rg2', when: at('venom', 'the-ranger'), turns: [
      by('a', "You do the stick, I'll do the sponge."),
      by('b', "Why do I get the stick?"),
      by('a', "Because the stick's further away from the mouth."),
      by('b', "Okay. I'll take the stick."),
    ] },
    { id: 'di.st.ds1', when: at('venom', 'distraction'), turns: [
      beat('{b} waves the forked stick slowly in front of the biggest lizard. Its eyes follow it, left, right, left.'),
      by('b', "It's watching. It's watching the stick."),
      by('a', "Keep it there. Don't stop moving it."),
    ] },
    { id: 'di.st.ds2', when: at('venom', 'distraction'), turns: [
      by('b', "Hey. Hey, big guy. Look at the stick."),
      beat('The lizard turns its head towards the stick, and its long forked tongue flicks out.'),
      by('a', "Good. Keep it busy."),
    ] },
    { id: 'di.st.sp1', when: at('venom', 'the-sponge'), turns: [
      beat('{a} creeps in from the side with the sponge on its pole, as slowly as possible, and dabs the lizard on the lip.'),
      by('a', "Got some. It's dripping. It's so gross."),
      by('b', "Don't talk to me! Get out of there!"),
    ] },
    { id: 'di.st.sp2', when: at('venom', 'the-sponge'), turns: [
      by('b', "Slowly. Slowly."),
      beat('The sponge touches the lizard\'s mouth. A long string of drool stretches off it as {a} pulls it back.'),
      by('a', "That's disgusting. That's perfect."),
    ] },
    { id: 'di.st.fv1', when: at('venom', 'fill-vial'), turns: [
      beat('{a} squeezes the sponge over the vial, and the drool drips in, slow and thick.'),
      by('b', "Is it full?"),
      by('a', "Nearly. One more squeeze."),
    ] },
    { id: 'di.st.fv2', when: at('venom', 'fill-vial'), turns: [
      by('a', "Hold it steady. Don't shake."),
      beat('{b} holds the vial while {a} squeezes, and the drool fills it right up to the line.'),
      by('b', "Full! Put the lid on! Put the lid on!"),
    ] },
    { id: 'di.st.vt1', when: at('venom', 'vial-tip'), turns: [
      beat('The ranger holds the vial up to the light, nods, and hands over the tip.'),
      by('b', "I'm going to wash my hands for a week."),
      by('a', "Read the tip first. Then wash."),
    ] },
    { id: 'di.st.vt2', when: at('venom', 'vial-tip'), turns: [
      by('a', "We milked a dragon."),
      by('b', "We did not milk it. Please don't call it that."),
      beat('They run off into the jungle, away from the lizards as fast as they can.'),
    ] },

    // ── the rugs ──
    { id: 'di.st.rm1', when: at('rugs', 'rug-mountain'), turns: [
      beat('In a clearing in the jungle, there is a mountain of woven rugs, every colour and every pattern, taller than a house.'),
      by('b', "One of these has the race mark on it?"),
      by('a', "One. Just one. Let's start at the bottom."),
    ] },
    { id: 'di.st.rm2', when: at('rugs', 'rug-mountain'), turns: [
      by('a', "Okay, you start that side, I'll start this side."),
      by('b', "And we meet in the middle?"),
      by('a', "And we meet in the middle."),
    ] },
    { id: 'di.st.dg1', when: at('rugs', 'dig-in'), turns: [
      beat('They pull rugs off the pile one after another, coughing in the dust, and toss them behind them.'),
      by('b', "These all look the same."),
      by('a', "Look for the race mark. Just the mark."),
    ] },
    { id: 'di.st.dg2', when: at('rugs', 'dig-in'), turns: [
      by('a', "Grab the edge and pull."),
      beat('{a} and {b} pull a huge rug out from the middle of the pile, and the rugs above it slide down in a slow, soft avalanche.'),
      by('b', "Well, now they're easier to reach."),
    ] },
    { id: 'di.st.ur1', when: at('rugs', 'unroll'), turns: [
      beat('{a} unrolls a rug across the dirt. Red, gold, a pattern of birds. No mark.'),
      by('a', "Not this one."),
      by('b', "Next. Keep going."),
    ] },
    { id: 'di.st.ur2', when: at('rugs', 'unroll'), turns: [
      by('b', "Wait. What's that in the corner?"),
      beat('{b} flips the corner of a blue rug over, and there, woven into the edge, is the race\'s mark.'),
      by('a', "That's it! That's it!"),
    ] },
    { id: 'di.st.wv1', when: at('rugs', 'the-weaver'), turns: [
      beat('They carry the rug over to the weaver at the loom and unroll it at the weaver\'s feet.'),
      by('b', "Is this the one? Please say it's the one."),
      beat('The weaver runs a finger over the mark and smiles.'),
    ] },
    { id: 'di.st.wv2', when: at('rugs', 'the-weaver'), turns: [
      by('a', "Here. This one. We found it."),
      beat('The weaver looks at the mark, then up at them, and nods.'),
      by('b', "Yes!"),
    ] },
    { id: 'di.st.rt1', when: at('rugs', 'rug-tip'), turns: [
      beat('The weaver hands over the tip, and points them up the hill.'),
      by('a', "Chill Zone. Up the hill. Let's go."),
      by('b', "I'm going to dream about rugs tonight."),
    ] },
    { id: 'di.st.rt2', when: at('rugs', 'rug-tip'), turns: [
      by('b', "How many did we unroll? Fifty?"),
      by('a', "Don't count. Just run."),
      beat('They run for the hill as the sun starts to go down.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the drool ──
    { id: 'di.sf.ds1', when: at('venom', 'distraction'), turns: [
      beat('{b} waves the stick, and the lizard hisses, loud and long, with its mouth wide open.'),
      by('b', "Nope! Nope! Back up!"),
      by('a', "Back off. Wait. Try again in a minute."),
    ] },
    { id: 'di.sf.ds2', when: at('venom', 'distraction'), turns: [
      by('b', "It's not looking at the stick. It's looking at me."),
      by('a', "Then look somewhere else!"),
      beat('{b} looks somewhere else. The lizard keeps looking at {b.obj}. They back away and start over.'),
    ] },
    { id: 'di.sf.sp1', when: at('venom', 'the-sponge'), turns: [
      beat('The sponge touches the lizard\'s lip, and its eyes snap open. It lunges forward.'),
      by('b', "Run! Run!"),
      by('a', "I'm running!"),
    ] },
    { id: 'di.sf.sp2', when: at('venom', 'the-sponge'), turns: [
      by('a', "It's awake. It's definitely awake."),
      beat('The lizard turns round and starts waddling straight at {a}, faster than anything that size should move.'),
      by('b', "Leave the sponge! Just run!"),
    ] },
    { id: 'di.sf.fv1', when: at('venom', 'fill-vial'), turns: [
      beat('{a} squeezes the sponge, the vial slips out of {b}\'s fingers, and it all ends up in the sand.'),
      by('b', "No! It was nearly full!"),
      by('a', "Back in. We need more."),
    ] },
    { id: 'di.sf.fv2', when: at('venom', 'fill-vial'), turns: [
      by('b', "Is that drool or is that just water?"),
      beat('They look closely. It\'s mostly just water from the sponge. The ranger shakes their head.'),
      by('a', "Great. Back to the dragon."),
    ] },

    // ── the rugs ──
    { id: 'di.sf.dg1', when: at('rugs', 'dig-in'), turns: [
      beat('{b} pulls one rug too many, and the whole side of the mountain slides down on top of them.'),
      by('a', "Where are you?"),
      by('b', "Under here! I'm under the rugs!"),
    ] },
    { id: 'di.sf.dg2', when: at('rugs', 'dig-in'), turns: [
      by('a', "Have we done this one already?"),
      by('b', "I don't know. They all look the same."),
      beat('They have done it already. Twice. They start again from the other side.'),
    ] },
    { id: 'di.sf.ur1', when: at('rugs', 'unroll'), turns: [
      beat('{a} unrolls rug after rug. Flowers, birds, stripes, squares. No mark on any of them.'),
      by('a', "How many are there?"),
      by('b', "Hundreds. Keep going."),
    ] },
    { id: 'di.sf.ur2', when: at('rugs', 'unroll'), turns: [
      by('b', "This one! It's got a mark!"),
      by('a', "That's a stain."),
      by('b', "Oh. Yeah. That's a stain."),
    ] },
    { id: 'di.sf.wv1', when: at('rugs', 'the-weaver'), turns: [
      beat('They unroll the rug at the weaver\'s feet. The weaver looks at it, then shakes their head.'),
      by('a', "But it's got the mark!"),
      beat('It has a mark. It\'s not the race\'s mark. They carry it back to the pile.'),
    ] },
    { id: 'di.sf.wv2', when: at('rugs', 'the-weaver'), turns: [
      by('b', "This is the one. I'm sure this time."),
      beat('The weaver looks at it for one second and points back at the mountain.'),
      by('a', "Back to the pile."),
    ] },
  ],
};
