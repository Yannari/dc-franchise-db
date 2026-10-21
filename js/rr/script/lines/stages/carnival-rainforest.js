// Carnival Rainforest's challenges, stage by stage (js/rr/places/carnival-rainforest.js `stages`; director.js stageBeats).
//   the ant mitten  the-mitten -> hand-in -> ant-tip -> swollen                          (Botch or Watch: a's hand, b watches)
//   the gorge       gorge-edge -> the-swing -> coconut-pile -> the-coconut               (All-In: both swing, both dig)
//   the costume     feathers -> headpiece -> tailpiece -> the-parade -> judge-cheers     (All-In: a headpiece and a tailpiece)
// A missed swing drops a racer in the river at the bottom of the gorge; a costume that just stands there is sent back.
// The carnival judge is the place's own local (the avatar stands there: js/vp-rr-ep/locals.js).
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the ant mitten ──
    { id: 'cr.st.mi1', when: at('ants', 'the-mitten'), turns: [
      beat('A local holds out a woven mitten. The inside of it is moving. The inside of it is entirely ants, big black ones, about an inch long each.'),
      by('b', "Those are bullet ants. They call them that because a sting feels like getting shot."),
      by('a', "Why would you tell me that? Why would you tell me that right now?"),
    ] },
    { id: 'cr.st.mi2', when: at('ants', 'the-mitten'), turns: [
      by('a', "Okay. It's just a glove. A glove full of angry ants. I can do a glove."),
      by('b', "You can totally do a glove."),
      beat('{a} rolls up a sleeve, takes three very fast breaths, and holds out a shaking hand.'),
    ] },
    { id: 'cr.st.hi1', when: at('ants', 'hand-in'), turns: [
      beat('{a}\'s hand goes into the mitten. For one second, nothing happens. Then {a}\'s whole face changes.'),
      by('a', "Ow. Ow. Ow ow ow ow ow!"),
      by('b', "Find the tip! Feel for the paper!"),
    ] },
    { id: 'cr.st.hi2', when: at('ants', 'hand-in'), turns: [
      by('b', "Don't think about the ants. Think about something nice. Think about puppies."),
      by('a', "The puppies are stinging me! All the puppies are stinging me!"),
      beat('{a} keeps the hand in, feeling around at the bottom of the mitten, eyes squeezed shut.'),
    ] },
    { id: 'cr.st.hi3', when: at('ants', 'hand-in'), turns: [
      beat('{a} pushes a hand all the way in up to the wrist, without a single sound, jaw clenched so hard it creaks.'),
      by('b', "Why aren't you screaming? Are you okay? Scream a bit, you're scaring me."),
      by('a', "If I open my mouth, I'll never stop screaming, so let me find the tip first."),
    ] },
    { id: 'cr.st.at1', when: at('ants', 'ant-tip'), turns: [
      beat('{a}\'s fingers close on something flat and papery at the very bottom of the mitten, and the hand comes out holding the tip, with three ants still hanging on.'),
      by('a', "Got it! Get them off! Get them off me!"),
      by('b', "I'm not allowed to touch you! I'm not allowed to help!"),
    ] },
    { id: 'cr.st.at2', when: at('ants', 'ant-tip'), turns: [
      by('a', "I can feel it. It's at the very bottom, under all of them."),
      beat('{a} pinches the tip between two fingers and draws it out, very slowly, so it doesn\'t tear.'),
      by('b', "Not one rip. You're a surgeon."),
    ] },
    { id: 'cr.st.sw1', when: at('ants', 'swollen'), turns: [
      beat('{a}\'s hand has swollen up so much that it looks like a cartoon hand in a big puffy glove.'),
      by('a', "Look at it. It looks like it belongs to a much bigger person."),
      by('b', "You were so brave. I'll read the tip, because you can't hold it."),
    ] },
    { id: 'cr.st.sw2', when: at('ants', 'swollen'), turns: [
      by('b', "How does it feel?"),
      by('a', "Like I high-fived a cactus that was on fire, and I'd do it again for a million dollars."),
      beat('They read the tip and run, {a} holding the swollen hand up in the air like a trophy.'),
    ] },

    // ── the gorge ──
    { id: 'cr.st.ge1', when: at('gorge', 'gorge-edge'), turns: [
      beat('The trail ends at the edge of a gorge so deep that the river at the bottom looks like a piece of blue string.'),
      by('a', "There's no bridge. Why is there no bridge?"),
      by('b', "Because there are vines. Look. We swing."),
    ] },
    { id: 'cr.st.ge2', when: at('gorge', 'gorge-edge'), turns: [
      by('b', "Don't look down."),
      beat('{a} looks down.'),
      by('a', "I looked down. Why does everyone say don't look down? It makes you look down."),
    ] },
    { id: 'cr.st.vi1', when: at('gorge', 'the-swing'), turns: [
      beat('{a} grabs a vine, runs, and swings out over the gorge, screaming the whole way, and lands on the far side in a heap.'),
      by('a', "I'm alive! I'm over! Your turn!"),
      beat('{b} swings next, and lands on top of {a}.'),
    ] },
    { id: 'cr.st.vi2', when: at('gorge', 'the-swing'), turns: [
      by('b', "Like a superhero. Like a jungle superhero."),
      beat('{b} swings out over the gorge, does a little yodel in the middle of it, and lets go at exactly the right moment.'),
      by('a', "Did you just yodel?"),
      by('b', "You have to yodel on a vine. It's the law."),
    ] },
    { id: 'cr.st.vi3', when: at('gorge', 'the-swing'), turns: [
      beat('They hold the same vine and swing across together, the two of them clinging on like a pair of koalas.'),
      by('a', "Is this allowed? Is two on one vine allowed?"),
      by('b', "It's allowed if we don't fall."),
    ] },
    { id: 'cr.st.cp1', when: at('gorge', 'coconut-pile'), turns: [
      beat('On the far side waits a mountain of coconuts, taller than both of them, and only one of them has the tip inside.'),
      by('b', "How are we supposed to find one coconut in a mountain of coconuts?"),
      by('a', "Shake them. If it rattles, it's paper."),
    ] },
    { id: 'cr.st.cp2', when: at('gorge', 'coconut-pile'), turns: [
      by('a', "This one sloshes. This one sloshes. This one... sloshes."),
      beat('{a} and {b} work through the pile, shaking every coconut next to their ears like two people listening to seashells.'),
      by('b', "Wait. This one doesn't slosh. This one rustles."),
    ] },
    { id: 'cr.st.cp3', when: at('gorge', 'coconut-pile'), turns: [
      beat('{b} starts at the bottom of the pile and {a} starts at the top, and the whole mountain shifts and rolls under them.'),
      by('a', "Avalanche!"),
      beat('Coconuts bounce everywhere. One of them, rolling past {b}\'s foot, rattles.'),
    ] },
    { id: 'cr.st.cc1', when: at('gorge', 'the-coconut'), turns: [
      beat('{a} smashes the coconut on a rock. It splits open, and inside, rolled up and dry, is the travel tip.'),
      by('b', "Yes! Yes, yes, yes!"),
      by('a', "I'm keeping the coconut too. I've earned this coconut."),
    ] },
    { id: 'cr.st.cc2', when: at('gorge', 'the-coconut'), turns: [
      by('b', "\"Make a carnival costume.\" A costume! With feathers!"),
      by('a', "Finally. Something I was born to do."),
      beat('They run off down the trail, {a} drinking the coconut on the way.'),
    ] },

    // ── the costume ──
    { id: 'cr.st.fe1', when: at('costume', 'feathers'), turns: [
      beat('The costume table is piled with feathers in every colour, sequins, wire and a lot of glue.'),
      by('b', "We need it big. The judge wants it big."),
      by('a', "Then we use every single feather on this table."),
    ] },
    { id: 'cr.st.fe2', when: at('costume', 'feathers'), turns: [
      by('a', "Purple and blue. Or gold. Or purple and blue and gold."),
      by('b', "All of them. Carnival isn't about choosing. Carnival is about more."),
      beat('They start gluing feathers on, layer after layer, faster and faster.'),
    ] },
    { id: 'cr.st.hp1', when: at('costume', 'headpiece'), turns: [
      beat('{a} bends a wire frame into a tall fan shape and starts sticking feathers to it, one by one, until it\'s taller than {a} is.'),
      by('b', "Put it on! Put it on!"),
      by('a', "It's so heavy. I look amazing and my neck hates me."),
    ] },
    { id: 'cr.st.hp2', when: at('costume', 'headpiece'), turns: [
      by('b', "More sparkle. It needs more sparkle."),
      beat('{b} pours a whole pot of sequins over the headpiece, and most of them stick.'),
      by('a', "Now it sparkles. Now it really sparkles."),
    ] },
    { id: 'cr.st.tp1', when: at('costume', 'tailpiece'), turns: [
      beat('{b} builds the tailpiece, a great sweeping fan of feathers that clips onto a belt.'),
      by('b', "How does it look from behind?"),
      by('a', "Like a peacock and a firework had a baby."),
    ] },
    { id: 'cr.st.tp2', when: at('costume', 'tailpiece'), turns: [
      by('a', "Turn round. Wiggle it."),
      beat('{b} wiggles. The tailpiece wiggles too, and sheds only one feather.'),
      by('b', "It works! It's attached! It's a tail!"),
    ] },
    { id: 'cr.st.pa1', when: at('costume', 'the-parade'), turns: [
      beat('They parade in front of the carnival judge, headpiece swaying, tailpiece swishing, dancing to music only they can hear.'),
      by('a', "Smile! Wave! Shake it!"),
      by('b', "I am shaking it! This is all the shaking I've got!"),
    ] },
    { id: 'cr.st.pa2', when: at('costume', 'the-parade'), turns: [
      by('b', "Go big. Bigger than you think. Big!"),
      beat('{a} and {b} samba up and down in front of the judge, feathers flying, sequins catching the sun.'),
      by('a', "This is the most fun I've ever had in a challenge."),
    ] },
    { id: 'cr.st.jc1', when: at('costume', 'judge-cheers'), turns: [
      beat('The carnival judge throws both arms in the air, lets out a whoop, and dances with them for a moment before handing over the tip.'),
      by('b', "We did it! The judge danced with us!"),
      by('a', "Best day ever. Can I keep the headpiece?"),
    ] },
    { id: 'cr.st.jc2', when: at('costume', 'judge-cheers'), turns: [
      by('a', "\"Hang glide down to the beach.\" Hang glide? In these?"),
      by('b', "We'll be the most beautiful thing in the sky."),
      beat('They run for the cliffs, still in their feathers.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the ant mitten ──
    { id: 'cr.sf.mi1', when: at('ants', 'the-mitten'), turns: [
      beat('{a} reaches towards the mitten, sees an ant climb out over the edge, and snatches the hand back.'),
      by('a', "Nope. Not yet. I need to look at them a bit longer."),
      by('b', "Looking at them doesn't make them smaller!"),
    ] },
    { id: 'cr.sf.mi2', when: at('ants', 'the-mitten'), turns: [
      by('a', "What if I just used my elbow?"),
      by('b', "You can't do it with your elbow. Your elbow can't read."),
      beat('{a} is still standing in front of the mitten, not putting a hand in it.'),
    ] },
    { id: 'cr.sf.hi1', when: at('ants', 'hand-in'), turns: [
      beat('{a}\'s hand goes in. The first sting lands. The hand comes straight back out, empty, at about a hundred miles an hour.'),
      by('a', "That was one ant! That was one ant, and it hurt that much!"),
      by('b', "And you have to go back in."),
    ] },
    { id: 'cr.sf.hi2', when: at('ants', 'hand-in'), turns: [
      by('b', "Do you have it? Do you have it?"),
      beat('{a} pulls out a fist, opens it, and finds only ants.'),
      by('a', "I thought it was the tip! It was a big ant! It was a really flat ant!"),
    ] },
    { id: 'cr.sf.at1', when: at('ants', 'ant-tip'), turns: [
      beat('{a} gets the tip halfway out, gets stung on the thumb, and lets go. The tip drops back to the bottom of the mitten.'),
      by('a', "No! It was right there! It was in my fingers!"),
      by('b', "Back in. I'm so sorry. Back in."),
    ] },
    { id: 'cr.sf.at2', when: at('ants', 'ant-tip'), turns: [
      by('a', "I can feel it, but I can't get hold of it. My fingers are too swollen."),
      beat('The tip slips through {a}\'s puffy fingers, twice.'),
      by('b', "Use your other hand."),
      by('a', "My other hand is my last good hand!"),
    ] },

    // ── the gorge ──
    { id: 'cr.sf.ge1', when: at('gorge', 'gorge-edge'), turns: [
      beat('{b} takes hold of the vine, walks to the edge, looks over, and walks straight back again.'),
      by('b', "I need a minute. It's very far down."),
      by('a', "Every minute you take, it stays exactly the same distance down."),
    ] },
    { id: 'cr.sf.ge2', when: at('gorge', 'gorge-edge'), turns: [
      by('a', "On three, we run and jump. One... two..."),
      beat('On three, {a} runs, and {b} doesn\'t. {a} skids to a stop with one foot over the edge.'),
      by('a', "That's not how three works!"),
    ] },
    { id: 'cr.sf.vi1', when: at('gorge', 'the-swing'), turns: [
      beat('{a} swings out over the gorge, lets go a second too early, and drops like a stone into the river far below.'),
      by('a', "Aaaaaaaaah!"),
      beat('There is a long fall and a very big splash. Then a long, wet climb back up to the start.'),
    ] },
    { id: 'cr.sf.vi2', when: at('gorge', 'the-swing'), turns: [
      by('b', "Grab the next vine! The next vine!"),
      beat('{a} reaches for the next vine, misses it by a finger, and goes down into the river with a scream that echoes off both walls.'),
      by('b', "Are you okay?"),
      by('a', "I'm wet! I'm alive and I'm wet!"),
    ] },
    { id: 'cr.sf.vi3', when: at('gorge', 'the-swing'), turns: [
      beat('The vine {b} picks turns out not to be tied to anything. It is just a vine lying over a branch.'),
      by('b', "Uh oh."),
      beat('{b} lands in the river at the bottom of the gorge, still holding the vine.'),
    ] },
    { id: 'cr.sf.cp1', when: at('gorge', 'coconut-pile'), turns: [
      by('a', "This one! This one rattles!"),
      beat('{a} smashes it open on a rock. It is full of coconut milk, which goes all over {b}.'),
      by('b', "That's not a rattle. That's a slosh. You need to learn the difference."),
    ] },
    { id: 'cr.sf.cp2', when: at('gorge', 'coconut-pile'), turns: [
      beat('{a} and {b} have cracked eleven coconuts, and every single one of them was just coconut.'),
      by('b', "I'm so full of coconut. I'm never eating coconut again."),
      by('a', "Keep shaking. It's in here somewhere."),
    ] },

    // ── the costume ──
    { id: 'cr.sf.fe1', when: at('costume', 'feathers'), turns: [
      beat('{a} knocks over the pot of glue, and when {a} picks up the feathers, they all stick to {a} instead of the costume.'),
      by('b', "You look like a chicken."),
      by('a', "I know I look like a chicken. Help me un-chicken."),
    ] },
    { id: 'cr.sf.fe2', when: at('costume', 'feathers'), turns: [
      by('b', "Why are none of them sticking?"),
      by('a', "Because you're using the glitter, not the glue."),
      beat('Every feather they put on in the last five minutes slides slowly off onto the floor.'),
    ] },
    { id: 'cr.sf.hp1', when: at('costume', 'headpiece'), turns: [
      beat('The headpiece gets taller and taller and taller, and then the wire frame bends in the middle and the whole thing folds in half.'),
      by('a', "It's broken. It's bowing. Why is it bowing?"),
      by('b', "Because it's too tall. Build it again, but less tall."),
    ] },
    { id: 'cr.sf.hp2', when: at('costume', 'headpiece'), turns: [
      by('a', "Try it on. Let's see it on you."),
      beat('{b} puts it on, and it slides straight down over {b.posAdj} face.'),
      by('b', "I can't see. I'm a feather duster now."),
    ] },
    { id: 'cr.sf.tp1', when: at('costume', 'tailpiece'), turns: [
      beat('{b} turns round to show off the tailpiece, and it falls off the belt and lands on the floor.'),
      by('a', "Again. With more wire."),
      by('b', "With all the wire. Every piece of wire in this tent."),
    ] },
    { id: 'cr.sf.tp2', when: at('costume', 'tailpiece'), turns: [
      by('a', "Why are there feathers all over the floor?"),
      beat('With every step {b} takes, the tailpiece drops a feather. There is a trail of them all the way round the table.'),
      by('b', "It's moulting! My tail is moulting!"),
    ] },
    { id: 'cr.sf.pa1', when: at('costume', 'the-parade'), turns: [
      beat('They stand in front of the carnival judge in their costumes, and sort of sway a little bit, side to side.'),
      beat('The judge shakes their head, does a huge, wild samba to show what dancing is, and waves them back to the table.'),
      by('a', "Oh. Okay. So, more."),
    ] },
    { id: 'cr.sf.pa2', when: at('costume', 'the-parade'), turns: [
      by('b', "Dance! Dance big!"),
      beat('{a} dances big, spins round, and the tailpiece knocks the judge\'s drink out of their hand.'),
      by('a', "Sorry! So sorry! We'll go and fix it."),
    ] },
    { id: 'cr.sf.pa3', when: at('costume', 'the-parade'), turns: [
      beat('The judge walks all the way round them, points at the bare patch on the headpiece, and holds up a single feather.'),
      by('b', "One feather? We need one more feather?"),
      by('a', "We need about a hundred more feathers. That's what the one feather means."),
    ] },
  ],
};
