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
      by('b', "Those are bullet ants. Apparently the sting feels like getting shot."),
      by('a', "Why would you tell me that right now?"),
    ] },
    { id: 'cr.st.mi2', when: at('ants', 'the-mitten'), turns: [
      by('a', "Okay. It's just a glove. I can do this."),
      by('b', "You can totally do this."),
      beat('{a} rolls up a sleeve, takes three very fast breaths, and holds out a shaking hand.'),
    ] },
    { id: 'cr.st.hi1', when: at('ants', 'hand-in'), turns: [
      beat('{a}\'s hand goes into the mitten. For one second, nothing happens. Then {a}\'s whole face changes.'),
      by('a', "Ow! Ow, ow, ow!"),
      by('b', "Find the tip! Feel for the paper!"),
    ] },
    { id: 'cr.st.hi2', when: at('ants', 'hand-in'), turns: [
      by('b', "Don't think about the ants. Think about something nice."),
      by('a', "I can't think about anything else!"),
      beat('{a} keeps the hand in, feeling around at the bottom of the mitten, eyes squeezed shut.'),
    ] },
    { id: 'cr.st.hi3', when: at('ants', 'hand-in'), turns: [
      beat('{a} pushes a hand all the way in up to the wrist, without a single sound, jaw clenched so hard it creaks.'),
      by('b', "Why aren't you screaming? You're scaring me."),
      by('a', "If I start, I won't stop. Let me find the tip."),
    ] },
    { id: 'cr.st.at1', when: at('ants', 'ant-tip'), turns: [
      beat('{a}\'s fingers close on something flat and papery at the very bottom of the mitten, and the hand comes out holding the tip, with three ants still hanging on.'),
      by('a', "Got it! Get them off! Get them off me!"),
      by('b', "I'm not allowed to touch you! I'm not allowed to help!"),
    ] },
    { id: 'cr.st.at2', when: at('ants', 'ant-tip'), turns: [
      by('a', "I can feel it. It's right at the bottom."),
      beat('{a} pinches the tip between two fingers and draws it out, very slowly, so it doesn\'t tear.'),
      by('b', "Not even a rip. Nice."),
    ] },
    { id: 'cr.st.sw1', when: at('ants', 'swollen'), turns: [
      beat('{a}\'s hand has swollen up so much that it looks like a cartoon hand in a big puffy glove.'),
      by('a', "Look at it. It's twice the size."),
      by('b', "You were so brave. I'll hold the tip."),
    ] },
    { id: 'cr.st.sw2', when: at('ants', 'swollen'), turns: [
      by('b', "How does it feel?"),
      by('a', "Like it's on fire. But I'd do it again for a million dollars."),
      beat('They read the tip and run, {a} holding the swollen hand up in the air like a trophy.'),
    ] },

    // ── the gorge ──
    { id: 'cr.st.ge1', when: at('gorge', 'gorge-edge'), turns: [
      beat('The trail ends at the edge of a gorge so deep that the river at the bottom looks like a piece of blue string.'),
      by('a', "There's no bridge. Why is there no bridge?"),
      by('b', "Look. Vines. We swing across."),
    ] },
    { id: 'cr.st.ge2', when: at('gorge', 'gorge-edge'), turns: [
      by('b', "Don't look down."),
      beat('{a} looks down.'),
      by('a', "I looked down. Why do people say that? It just makes you look."),
    ] },
    { id: 'cr.st.vi1', when: at('gorge', 'the-swing'), turns: [
      beat('{a} grabs a vine, runs, and swings out over the gorge, screaming the whole way, and lands on the far side in a heap.'),
      by('a', "I'm alive! I'm over! Your turn!"),
      beat('{b} swings next, and lands on top of {a}.'),
    ] },
    { id: 'cr.st.vi2', when: at('gorge', 'the-swing'), turns: [
      by('b', "Okay. Here I go."),
      beat('{b} swings out over the gorge, does a little yodel in the middle of it, and lets go at exactly the right moment.'),
      by('a', "Did you just yodel?"),
      by('b', "You have to yodel on a vine. Everyone knows that."),
    ] },
    { id: 'cr.st.vi3', when: at('gorge', 'the-swing'), turns: [
      beat('They hold the same vine and swing across together, the two of them clinging on like a pair of koalas.'),
      by('a', "Are we allowed to both go on one?"),
      by('b', "Nobody said we can't."),
    ] },
    { id: 'cr.st.cp1', when: at('gorge', 'coconut-pile'), turns: [
      beat('On the far side waits a mountain of coconuts, taller than both of them, and only one of them has the tip inside.'),
      by('b', "How are we supposed to find one coconut in all that?"),
      by('a', "Shake them. If it rattles, there's paper inside."),
    ] },
    { id: 'cr.st.cp2', when: at('gorge', 'coconut-pile'), turns: [
      by('a', "Slosh. Slosh. Slosh. They all slosh."),
      beat('{a} and {b} work through the pile, shaking every coconut next to their ears like two people listening to seashells.'),
      by('b', "Wait. This one doesn't. Listen."),
    ] },
    { id: 'cr.st.cp3', when: at('gorge', 'coconut-pile'), turns: [
      beat('{b} starts at the bottom of the pile and {a} starts at the top, and the whole mountain shifts and rolls under them.'),
      by('a', "Avalanche!"),
      beat('Coconuts bounce everywhere. One of them, rolling past {b}\'s foot, rattles.'),
    ] },
    { id: 'cr.st.cc1', when: at('gorge', 'the-coconut'), turns: [
      beat('{a} smashes the coconut on a rock. It splits open, and inside, rolled up and dry, is the travel tip.'),
      by('b', "Yes! Yes, yes, yes!"),
      by('a', "I'm keeping this coconut. I earned it."),
    ] },
    { id: 'cr.st.cc2', when: at('gorge', 'the-coconut'), turns: [
      by('b', "\"Make a carnival costume.\" A costume! With feathers!"),
      by('a', "Finally. Something I'm actually good at."),
      beat('They run off down the trail, {a} drinking the coconut on the way.'),
    ] },

    // ── the costume ──
    { id: 'cr.st.fe1', when: at('costume', 'feathers'), turns: [
      beat('The costume table is piled with feathers in every colour, sequins, wire and a lot of glue.'),
      by('b', "We need it big. The judge wants it big."),
      by('a', "Then we use every feather on this table."),
    ] },
    { id: 'cr.st.fe2', when: at('costume', 'feathers'), turns: [
      by('a', "Purple and blue? Or gold?"),
      by('b', "All of it. It's carnival. More is better."),
      beat('They start gluing feathers on, layer after layer, faster and faster.'),
    ] },
    { id: 'cr.st.hp1', when: at('costume', 'headpiece'), turns: [
      beat('{a} bends a wire frame into a tall fan shape and starts sticking feathers to it, one by one, until it\'s taller than {a} is.'),
      by('b', "Put it on! Put it on!"),
      by('a', "It's so heavy. But I look amazing, right?"),
    ] },
    { id: 'cr.st.hp2', when: at('costume', 'headpiece'), turns: [
      by('b', "More sparkle. It needs more sparkle."),
      beat('{b} pours a whole pot of sequins over the headpiece, and most of them stick.'),
      by('a', "Okay, now it really sparkles."),
    ] },
    { id: 'cr.st.tp1', when: at('costume', 'tailpiece'), turns: [
      beat('{b} builds the tailpiece, a great sweeping fan of feathers that clips onto a belt.'),
      by('b', "How does it look from behind?"),
      by('a', "Amazing. Like a peacock."),
    ] },
    { id: 'cr.st.tp2', when: at('costume', 'tailpiece'), turns: [
      by('a', "Turn round. Wiggle it."),
      beat('{b} wiggles. The tailpiece wiggles too, and sheds only one feather.'),
      by('b', "It's staying on! It works!"),
    ] },
    { id: 'cr.st.pa1', when: at('costume', 'the-parade'), turns: [
      beat('They parade in front of the carnival judge, headpiece swaying, tailpiece swishing, dancing to music only they can hear.'),
      by('a', "Smile! Wave! Shake it!"),
      by('b', "I am! This is all I've got!"),
    ] },
    { id: 'cr.st.pa2', when: at('costume', 'the-parade'), turns: [
      by('b', "Bigger! Go bigger!"),
      beat('{a} and {b} samba up and down in front of the judge, feathers flying, sequins catching the sun.'),
      by('a', "This is actually so much fun."),
    ] },
    { id: 'cr.st.jc1', when: at('costume', 'judge-cheers'), turns: [
      beat('The carnival judge throws both arms in the air, lets out a whoop, and dances with them for a moment before handing over the tip.'),
      by('b', "We did it! The judge danced with us!"),
      by('a', "Best challenge ever. Can I keep the headpiece?"),
    ] },
    { id: 'cr.st.jc2', when: at('costume', 'judge-cheers'), turns: [
      by('a', "\"Hang glide down to the beach.\" Hang glide? In these?"),
      by('b', "We're going to look amazing up there."),
      beat('They run for the cliffs, still in their feathers.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the ant mitten ──
    { id: 'cr.sf.mi1', when: at('ants', 'the-mitten'), turns: [
      beat('{a} reaches towards the mitten, sees an ant climb out over the edge, and snatches the hand back.'),
      by('a', "Not yet. I just need a second."),
      by('b', "Staring at them won't help!"),
    ] },
    { id: 'cr.sf.mi2', when: at('ants', 'the-mitten'), turns: [
      by('a', "What if I just used my elbow?"),
      by('b', "It has to be your hand. Come on."),
      beat('{a} is still standing in front of the mitten, not putting a hand in it.'),
    ] },
    { id: 'cr.sf.hi1', when: at('ants', 'hand-in'), turns: [
      beat('{a}\'s hand goes in. The first sting lands. The hand comes straight back out, empty, at about a hundred miles an hour.'),
      by('a', "That was one ant! One!"),
      by('b', "And you have to go back in."),
    ] },
    { id: 'cr.sf.hi2', when: at('ants', 'hand-in'), turns: [
      by('b', "Do you have it? Do you have it?"),
      beat('{a} pulls out a fist, opens it, and finds only ants.'),
      by('a', "I thought it was the tip! It was a really big ant!"),
    ] },
    { id: 'cr.sf.at1', when: at('ants', 'ant-tip'), turns: [
      beat('{a} gets the tip halfway out, gets stung on the thumb, and lets go. The tip drops back to the bottom of the mitten.'),
      by('a', "No! I had it! It was right in my fingers!"),
      by('b', "Back in. I'm so sorry. Back in."),
    ] },
    { id: 'cr.sf.at2', when: at('ants', 'ant-tip'), turns: [
      by('a', "I can feel it, but I can't grab it. My fingers are too puffy."),
      beat('The tip slips through {a}\'s puffy fingers, twice.'),
      by('b', "Use your other hand."),
      by('a', "That's my only good hand left!"),
    ] },

    // ── the gorge ──
    { id: 'cr.sf.ge1', when: at('gorge', 'gorge-edge'), turns: [
      beat('{b} takes hold of the vine, walks to the edge, looks over, and walks straight back again.'),
      by('b', "Give me a minute. It's really far down."),
      by('a', "It's not going to get any closer!"),
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
      by('a', "I'm fine! Just wet!"),
    ] },
    { id: 'cr.sf.vi3', when: at('gorge', 'the-swing'), turns: [
      beat('The vine {b} picks turns out not to be tied to anything. It is just a vine lying over a branch.'),
      by('b', "Uh oh."),
      beat('{b} lands in the river at the bottom of the gorge, still holding the vine.'),
    ] },
    { id: 'cr.sf.cp1', when: at('gorge', 'coconut-pile'), turns: [
      by('a', "This one! This one rattles!"),
      beat('{a} smashes it open on a rock. It is full of coconut milk, which goes all over {b}.'),
      by('b', "That was a slosh, not a rattle."),
    ] },
    { id: 'cr.sf.cp2', when: at('gorge', 'coconut-pile'), turns: [
      beat('{a} and {b} have cracked eleven coconuts, and every single one of them was just coconut.'),
      by('b', "I'm so sick of coconut."),
      by('a', "Keep shaking. It's in here somewhere."),
    ] },

    // ── the costume ──
    { id: 'cr.sf.fe1', when: at('costume', 'feathers'), turns: [
      beat('{a} knocks over the pot of glue, and when {a} picks up the feathers, they all stick to {a} instead of the costume.'),
      by('b', "You look like a chicken."),
      by('a', "I know. Just help me get them off."),
    ] },
    { id: 'cr.sf.fe2', when: at('costume', 'feathers'), turns: [
      by('b', "Why are none of them sticking?"),
      by('a', "Because you're using the glitter, not the glue."),
      beat('Every feather they put on in the last five minutes slides slowly off onto the floor.'),
    ] },
    { id: 'cr.sf.hp1', when: at('costume', 'headpiece'), turns: [
      beat('The headpiece gets taller and taller and taller, and then the wire frame bends in the middle and the whole thing folds in half.'),
      by('a', "Why is it bending? It's bending!"),
      by('b', "It's too tall. Do it again, but shorter."),
    ] },
    { id: 'cr.sf.hp2', when: at('costume', 'headpiece'), turns: [
      by('a', "Try it on. Let's see it on you."),
      beat('{b} puts it on, and it slides straight down over {b.posAdj} face.'),
      by('b', "I can't see anything."),
    ] },
    { id: 'cr.sf.tp1', when: at('costume', 'tailpiece'), turns: [
      beat('{b} turns round to show off the tailpiece, and it falls off the belt and lands on the floor.'),
      by('a', "Again. With more wire."),
      by('b', "All the wire. All of it."),
    ] },
    { id: 'cr.sf.tp2', when: at('costume', 'tailpiece'), turns: [
      by('a', "Why are there feathers all over the floor?"),
      beat('With every step {b} takes, the tailpiece drops a feather. There is a trail of them all the way round the table.'),
      by('b', "It's falling apart!"),
    ] },
    { id: 'cr.sf.pa1', when: at('costume', 'the-parade'), turns: [
      beat('They stand in front of the carnival judge in their costumes, and sort of sway a little bit, side to side.'),
      beat('The judge shakes their head, does a huge, wild samba to show what dancing is, and waves them back to the table.'),
      by('a', "Oh. Okay. So, more."),
    ] },
    { id: 'cr.sf.pa2', when: at('costume', 'the-parade'), turns: [
      by('b', "Dance! Dance big!"),
      beat('{a} dances big, spins round, and the tailpiece knocks the judge\'s drink out of their hand.'),
      by('a', "Sorry! So sorry! We'll fix it!"),
    ] },
    { id: 'cr.sf.pa3', when: at('costume', 'the-parade'), turns: [
      beat('The judge walks all the way round them, points at the bare patch on the headpiece, and holds up a single feather.'),
      by('b', "One feather? We need one more feather?"),
      by('a', "I think that means a lot more feathers."),
    ] },
  ],
};
