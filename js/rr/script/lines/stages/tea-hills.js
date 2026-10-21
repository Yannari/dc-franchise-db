// Tea Hills' challenges, stage by stage (js/rr/places/tea-hills.js `stages`; director.js stageBeats).
//   the tea basket  baskets-on -> picking -> fill-up -> the-check -> tea-tip                     (All-In: both pick)
//   the steam train catch-train -> back-carriage -> squeeze-through -> front-carriage -> off-train (All-In: both, to the front)
// Old leaves or a basket not full means back up the terraces; the wrong stop means walking back for the next train.
// The tea picker is the place's own local.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the tea basket ──
    { id: 'th.st.bo1', when: at('tea-basket', 'baskets-on'), turns: [
      beat('At the bottom of the terraces, they strap big wicker baskets onto their backs. The hill goes up and up in green steps.'),
      by('b', "We fill this whole thing? With leaves?"),
      by('a', "With the right leaves. The top two and the bud."),
    ] },
    { id: 'th.st.bo2', when: at('tea-basket', 'baskets-on'), turns: [
      by('a', "How does it look on me?"),
      by('b', "Like a very tired snail. Come on."),
      beat('They start up the first terrace.'),
    ] },
    { id: 'th.st.pk1', when: at('tea-basket', 'picking'), turns: [
      beat('{a} pinches off the top of a tea bush, two small leaves and a bud, and drops it over {a.posAdj} shoulder into the basket.'),
      by('a', "Like that. Just the soft new bits."),
      by('b', "Got it. Two leaves, one bud."),
    ] },
    { id: 'th.st.pk2', when: at('tea-basket', 'picking'), turns: [
      by('b', "This is so slow. They're so small."),
      by('a', "Use both hands. Pick, pick, throw."),
      beat('They work along the row side by side, picking with both hands.'),
    ] },
    { id: 'th.st.fu1', when: at('tea-basket', 'fill-up'), turns: [
      beat('By the third terrace, the leaves in {b}\'s basket are piled right up past the rim.'),
      by('b', "Is it full? Feel how heavy it is."),
      by('a', "It's full. Let's take it down."),
    ] },
    { id: 'th.st.fu2', when: at('tea-basket', 'fill-up'), turns: [
      by('a', "Push them down. Pack them in. Then add more on top."),
      beat('{a} presses the leaves down in the basket and they pick until it\'s heaped up again.'),
      by('b', "Okay. Now it's full."),
    ] },
    { id: 'th.st.ck1', when: at('tea-basket', 'the-check'), turns: [
      beat('The old tea picker tips the basket out onto a cloth and runs a hand through the leaves.'),
      by('b', "Please be good. Please be good."),
      beat('The picker nods, and smiles.'),
    ] },
    { id: 'th.st.ck2', when: at('tea-basket', 'the-check'), turns: [
      by('a', "All top leaves. We checked every one."),
      beat('The picker picks out one single stalk, holds it up, and then shrugs and lets it go.'),
      by('b', "That's a pass, right? That's a pass."),
    ] },
    { id: 'th.st.tt1', when: at('tea-basket', 'tea-tip'), turns: [
      beat('The picker hands over the tip.'),
      by('b', "Steam train! To the front carriage!"),
      by('a', "Finally, something where we sit down."),
    ] },
    { id: 'th.st.tt2', when: at('tea-basket', 'tea-tip'), turns: [
      by('a', "My fingers are green. They're actually green."),
      by('b', "Mine too. Let's go."),
      beat('They run down the hill towards the railway.'),
    ] },

    // ── the steam train ──
    { id: 'th.st.ct1', when: at('toy-train', 'catch-train'), turns: [
      beat('The little blue steam train puffs into the platform, already packed, people hanging out of every door.'),
      by('a', "Get on! Anywhere! Just get on!"),
      beat('They jump onto the last carriage as the train starts to move.'),
    ] },
    { id: 'th.st.ct2', when: at('toy-train', 'catch-train'), turns: [
      by('b', "It's leaving! It's leaving!"),
      by('a', "It's going at walking speed. We're fine."),
      beat('They jog alongside it and climb aboard the back.'),
    ] },
    { id: 'th.st.bc1', when: at('toy-train', 'back-carriage'), turns: [
      beat('The back carriage is full: people, sacks, baskets of chickens, and a goat standing in the aisle chewing a newspaper.'),
      by('b', "We have to get to the front. Through all of this."),
      by('a', "Excuse me! Sorry! Coming through!"),
    ] },
    { id: 'th.st.bc2', when: at('toy-train', 'back-carriage'), turns: [
      by('a', "How many carriages are there?"),
      by('b', "Six, I think. Maybe seven."),
      beat('They look down the packed aisle and take a deep breath.'),
    ] },
    { id: 'th.st.sq1', when: at('toy-train', 'squeeze-through'), turns: [
      beat('{a} squeezes past a man with a sack of rice on his lap, and {b} climbs carefully over a crate of chickens.'),
      by('b', "Sorry! Sorry! So sorry!"),
      by('a', "Keep saying sorry. It's working."),
    ] },
    { id: 'th.st.sq2', when: at('toy-train', 'squeeze-through'), turns: [
      by('b', "The goat. The goat won't move."),
      beat('{a} pulls a leaf out of {a.posAdj} pocket, left over from the tea, and the goat follows it to one side.'),
      by('a', "Go! Quick, while it's eating!"),
    ] },
    { id: 'th.st.fc1', when: at('toy-train', 'front-carriage'), turns: [
      beat('They push through the last door into the front carriage, right behind the engine, sweaty and out of breath.'),
      by('b', "We made it. The front. Now we just get off at the right stop."),
      by('a', "Which one's the right stop?"),
    ] },
    { id: 'th.st.fc2', when: at('toy-train', 'front-carriage'), turns: [
      by('a', "Read the tip again. Which station?"),
      by('b', "The one with the clock tower."),
      beat('They watch out of the window, and a station with a clock tower comes round the bend.'),
    ] },
    { id: 'th.st.ot1', when: at('toy-train', 'off-train'), turns: [
      beat('The train hisses to a stop, and they step off the front carriage onto the platform.'),
      by('b', "Chill Zone! I can see it!"),
      by('a', "Run. Before the train leaves with us on it."),
    ] },
    { id: 'th.st.ot2', when: at('toy-train', 'off-train'), turns: [
      by('a', "I've still got chicken feathers on me."),
      by('b', "You've got goat hair too. Go."),
      beat('They run down the platform to the mat.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the tea basket ──
    { id: 'th.sf.pk1', when: at('tea-basket', 'picking'), turns: [
      beat('{b} grabs whole handfuls of leaves at once, old ones, big ones, bits of stalk, everything.'),
      by('a', "Just the top two! Not the whole bush!"),
      by('b', "It's faster this way!"),
    ] },
    { id: 'th.sf.pk2', when: at('tea-basket', 'picking'), turns: [
      by('a', "Are those the right ones?"),
      by('b', "They're green. They're leaves."),
      beat('They are the big tough old leaves from the bottom of the bush. They have to tip them out and start again.'),
    ] },
    { id: 'th.sf.fu1', when: at('tea-basket', 'fill-up'), turns: [
      beat('{a} carries the basket down, and the picker looks inside and shakes their head. It\'s only half full.'),
      by('a', "It felt full! It felt so heavy!"),
      by('b', "Back up the hill."),
    ] },
    { id: 'th.sf.fu2', when: at('tea-basket', 'fill-up'), turns: [
      by('b', "Why is the basket getting lighter?"),
      beat('There\'s a hole in the bottom of the basket. A trail of tea leaves runs all the way back up the terraces.'),
      by('a', "Grab another basket. Quick."),
    ] },
    { id: 'th.sf.ck1', when: at('tea-basket', 'the-check'), turns: [
      beat('The picker tips the basket out, pulls out a handful of stalks and old leaves, and points back up the hill.'),
      by('a', "But it's full!"),
      by('b', "It's full of the wrong stuff. Come on."),
    ] },
    { id: 'th.sf.ck2', when: at('tea-basket', 'the-check'), turns: [
      by('b', "Is it okay? Is it good?"),
      beat('The picker holds up a leaf with a big bite out of it, then a caterpillar, then a twig.'),
      by('a', "Okay. We'll pick more carefully."),
    ] },

    // ── the steam train ──
    { id: 'th.sf.ct1', when: at('toy-train', 'catch-train'), turns: [
      beat('They get to the platform just as the last carriage pulls away down the line.'),
      by('b', "No! Run for it!"),
      by('a', "It's too far. We'll have to wait for the next one."),
    ] },
    { id: 'th.sf.ct2', when: at('toy-train', 'catch-train'), turns: [
      by('a', "Is this our train? Read the board."),
      beat('They read the board, argue about it, and the train leaves while they\'re still arguing.'),
      by('b', "That was our train, wasn't it?"),
    ] },
    { id: 'th.sf.sq1', when: at('toy-train', 'squeeze-through'), turns: [
      beat('{a} tries to squeeze between two sacks of rice and gets completely stuck, one leg in the air.'),
      by('a', "I'm stuck. I'm properly stuck."),
      by('b', "Breathe in! Breathe in and push!"),
    ] },
    { id: 'th.sf.sq2', when: at('toy-train', 'squeeze-through'), turns: [
      by('b', "Excuse me, can we just... sorry..."),
      beat('Nobody moves. The carriage is too full, and they are stuck at the door for two whole stops.'),
      by('a', "We're never getting to the front."),
    ] },
    { id: 'th.sf.fc1', when: at('toy-train', 'front-carriage'), turns: [
      beat('They jump off at the first station they see, and the train puffs away. There is no Chill Zone, just a sign with a different name on it.'),
      by('b', "This isn't it."),
      by('a', "Back to the line. Next train."),
    ] },
    { id: 'th.sf.fc2', when: at('toy-train', 'front-carriage'), turns: [
      by('a', "This one? Is it this one?"),
      by('b', "I don't know! Get off!"),
      beat('They get off. It is the wrong one. They watch the train leave without them.'),
    ] },
  ],
};
