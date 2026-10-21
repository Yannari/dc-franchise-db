// Swamp Prison's challenges, stage by stage (js/rr/places/swamp-prison.js `stages`; director.js stageBeats).
//   the escape  locked-in -> way-out -> the-dig -> the-gate -> fence-tip         (All-In: both locked in, both get out)
//   the raft    the-junk -> lash-it -> launch -> downriver -> the-dock           (All-In: build it, sail it)
// A wrong way out means starting on another; a raft that sinks or comes apart means swimming back and building again.
// The guard is the place's own local (the avatar stands there: js/vp-rr-ep/locals.js).
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the escape ──
    { id: 'sp.st.li1', when: at('prison-cell', 'locked-in'), turns: [
      beat('The guard walks them into a cell, steps out, and slams the barred door shut with a clang that echoes all down the corridor.'),
      by('b', "Well. We're in jail."),
      by('a', "I always thought it would be for something cooler than a reality show."),
    ] },
    { id: 'sp.st.li2', when: at('prison-cell', 'locked-in'), turns: [
      by('a', "Four ways out. A spoon, the guard, a key and the vent."),
      by('b', "Key, then. Keys are easy. You just find them."),
      beat('They look round the cell: a bunk bed, a tiny window, a toilet, a crack in the wall. No key in sight.'),
    ] },
    { id: 'sp.st.wo1', when: at('prison-cell', 'way-out'), turns: [
      beat('{a} runs a hand over the wall and finds a long crack, with crumbly plaster round it.'),
      by('a', "This bit's soft. Feel it. This is our way out."),
      by('b', "Through a wall? Like in the films?"),
    ] },
    { id: 'sp.st.wo2', when: at('prison-cell', 'way-out'), turns: [
      by('b', "Excuse me, officer. My partner is very, very sick."),
      beat('{a} lies on the bunk, groaning. The guard looks at them, sighs, and unlocks the door just to make the groaning stop.'),
      by('a', "I'm better! It's a miracle!"),
    ] },
    { id: 'sp.st.wo3', when: at('prison-cell', 'way-out'), turns: [
      beat('{b} lifts the thin mattress off the bottom bunk, and there, taped to the springs underneath, is a big iron key.'),
      by('b', "Key! Key! I said key!"),
      by('a', "You did say key. I'll never doubt you again."),
    ] },
    { id: 'sp.st.dg1', when: at('prison-cell', 'the-dig'), turns: [
      beat('{a} scrapes at the soft wall with a spoon, and chunks of plaster fall away, faster than either of them expected.'),
      by('b', "Is it working? It's working!"),
      by('a', "I'm a natural. I should've been digging out of things my whole life."),
    ] },
    { id: 'sp.st.dg2', when: at('prison-cell', 'the-dig'), turns: [
      by('a', "Your turn. My arm's dead."),
      beat('{b} takes the spoon and digs like a dog after a bone, until a hole opens up to daylight on the other side.'),
      by('b', "Light! There's light! We're getting out!"),
    ] },
    { id: 'sp.st.gt1', when: at('prison-cell', 'the-gate'), turns: [
      beat('They squeeze out into the prison yard, keep low along the wall, and run for the big front gate.'),
      by('b', "Act natural. We're just two people walking out of a prison."),
      by('a', "That's the least natural thing two people can do."),
    ] },
    { id: 'sp.st.gt2', when: at('prison-cell', 'the-gate'), turns: [
      by('a', "Is the guard looking?"),
      beat('The guard is not looking. The guard is eating a sandwich. They tiptoe past and through the gate.'),
      by('b', "That was the easiest jailbreak in history."),
    ] },
    { id: 'sp.st.ft1', when: at('prison-cell', 'fence-tip'), turns: [
      beat('The tip is tucked into the wire fence outside the gate.'),
      by('a', "\"Build a raft and sail to the Chill Zone.\" Out of what?"),
      by('b', "Out of whatever's lying around. We're escapees now. We improvise."),
    ] },
    { id: 'sp.st.ft2', when: at('prison-cell', 'fence-tip'), turns: [
      by('b', "We broke out of prison. Actual prison."),
      by('a', "Don't tell anyone. Especially not my mum."),
      beat('They grab the tip off the fence and run for the swamp.'),
    ] },

    // ── the raft ──
    { id: 'sp.st.jk1', when: at('swamp-raft', 'the-junk'), turns: [
      beat('On the swamp bank lies a mountain of junk: barrels, old doors, planks, ropes, a bathtub and one rubber duck.'),
      by('a', "Barrels float. We need barrels."),
      by('b', "And the bathtub. I want the bathtub."),
    ] },
    { id: 'sp.st.jk2', when: at('swamp-raft', 'the-junk'), turns: [
      by('b', "Grab the flattest door you can find. That's our deck."),
      beat('{a} drags an old wooden door out of the pile and stands it up proudly, like it\'s a surfboard.'),
      by('a', "This is our ship now. I'm calling her the Door."),
    ] },
    { id: 'sp.st.ls1', when: at('swamp-raft', 'lash-it'), turns: [
      beat('{a} and {b} roll four barrels into a square, lay the door across the top and tie the whole thing together with every piece of rope they can find.'),
      by('b', "Tighter! Pull it tighter!"),
      by('a', "Any tighter and the rope's going to snap."),
    ] },
    { id: 'sp.st.ls2', when: at('swamp-raft', 'lash-it'), turns: [
      by('a', "Knots. Do you know any knots?"),
      by('b', "I know one knot. I just do it lots of times."),
      beat('{b} ties the one knot, over and over, until the raft is more knot than raft.'),
    ] },
    { id: 'sp.st.la1', when: at('swamp-raft', 'launch'), turns: [
      beat('They push the raft into the brown water and climb on board. It wobbles, sinks a little, and then floats.'),
      by('b', "It floats! It floats!"),
      by('a', "Don't jump up and down on it!"),
    ] },
    { id: 'sp.st.la2', when: at('swamp-raft', 'launch'), turns: [
      by('a', "On three, we push off together."),
      beat('On three, they push off the bank with a plank each, and the raft glides out onto the swamp as smoothly as a real boat.'),
      by('b', "Look at us! We're a navy!"),
    ] },
    { id: 'sp.st.dr1', when: at('swamp-raft', 'downriver'), turns: [
      beat('The raft drifts down the slow river between the cypress trees, moss hanging from the branches overhead.'),
      by('b', "This is actually lovely. This is peaceful."),
      by('a', "Don't look to the left. There's an alligator looking at us."),
    ] },
    { id: 'sp.st.dr2', when: at('swamp-raft', 'downriver'), turns: [
      by('a', "Paddle on the right. The river's going left."),
      beat('They paddle with their planks, steering round a sunken log and past a heron standing on one leg.'),
      by('b', "We're sailors. We're real sailors now."),
    ] },
    { id: 'sp.st.dk1', when: at('swamp-raft', 'the-dock'), turns: [
      beat('The dock comes into view round the bend, and the raft bumps against it, still in one piece.'),
      by('a', "We made it! The Door made it!"),
      by('b', "I'm going to miss her. She was a good door."),
    ] },
    { id: 'sp.st.dk2', when: at('swamp-raft', 'the-dock'), turns: [
      by('b', "Jump! Jump for the dock!"),
      beat('They leap off the raft onto the dock just as one of the barrels pops free and floats away.'),
      by('a', "Just in time. She gave her life for us."),
    ] },
  ],

  'task-stage.fail': [
    // ── the escape ──
    { id: 'sp.sf.wo1', when: at('prison-cell', 'way-out'), turns: [
      by('b', "Officer, we're innocent! Let us out!"),
      beat('The guard looks at them, shakes their head, and goes back to the newspaper.'),
      by('a', "Okay. The guard isn't buying it. Try something else."),
    ] },
    { id: 'sp.sf.wo2', when: at('prison-cell', 'way-out'), turns: [
      beat('{a} climbs up onto the top bunk and squeezes into the air vent, and about a metre in, it ends in a solid wall.'),
      by('a', "Dead end! It's a dead end! And I'm stuck!"),
      by('b', "Wiggle backwards! Wiggle!"),
    ] },
    { id: 'sp.sf.wo3', when: at('prison-cell', 'way-out'), turns: [
      by('a', "Where's the key? Where would you hide a key?"),
      beat('They look in the toilet, under the pillow, behind the window bars and inside each other\'s shoes. There is no key.'),
      by('b', "We've wasted ten minutes looking at our shoes."),
    ] },
    { id: 'sp.sf.dg1', when: at('prison-cell', 'the-dig'), turns: [
      beat('{a} digs and digs through the soft plaster, and then the spoon hits something hard and goes clang.'),
      by('a', "Rock. It's solid rock behind here."),
      by('b', "So the soft bit was only the first inch. Great."),
    ] },
    { id: 'sp.sf.dg2', when: at('prison-cell', 'the-dig'), turns: [
      by('b', "Dig faster!"),
      beat('{b} digs so hard that the spoon bends in half and goes flying across the cell.'),
      by('a', "Now we've got a bent spoon. Which is worse than a spoon."),
    ] },
    { id: 'sp.sf.gt1', when: at('prison-cell', 'the-gate'), turns: [
      beat('They\'re halfway across the yard when the guard steps out from round a corner, folds their arms, and points back at the cell.'),
      by('a', "We were just stretching our legs!"),
      by('b', "Back in the cell. We'll have to find another way out."),
    ] },
    { id: 'sp.sf.gt2', when: at('prison-cell', 'the-gate'), turns: [
      by('b', "Run for it!"),
      beat('They run for the gate. The gate is locked. The guard catches up, and walks them all the way back to the cell.'),
      by('a', "We should have checked the gate first."),
    ] },

    // ── the raft ──
    { id: 'sp.sf.jk1', when: at('swamp-raft', 'the-junk'), turns: [
      beat('{b} drags the bathtub all the way over to the water, then realises it has a hole in the bottom.'),
      by('b', "Why would there be a bathtub with a hole in it?"),
      by('a', "Because it's junk! It's a pile of junk!"),
    ] },
    { id: 'sp.sf.jk2', when: at('swamp-raft', 'the-junk'), turns: [
      by('a', "These barrels are full. Full of what?"),
      beat('{a} opens a barrel, and the smell makes both of them stagger backwards. They roll it far away and look for empty ones.'),
      by('b', "Never open a swamp barrel. That's a life lesson."),
    ] },
    { id: 'sp.sf.ls1', when: at('swamp-raft', 'lash-it'), turns: [
      beat('{a} pulls the last knot tight, and the whole raft springs apart, barrels rolling off in four different directions.'),
      by('b', "What happened? What did you pull?"),
      by('a', "The one knot that was holding everything together."),
    ] },
    { id: 'sp.sf.ls2', when: at('swamp-raft', 'lash-it'), turns: [
      by('b', "Stand on it. Test it."),
      beat('{a} stands on the raft. The door cracks down the middle.'),
      by('a', "Maybe a different door."),
    ] },
    { id: 'sp.sf.la1', when: at('swamp-raft', 'launch'), turns: [
      beat('They push the raft into the water, climb on, and it sinks quietly underneath them until they\'re standing up to their waists in the swamp.'),
      by('b', "Is it supposed to do that?"),
      by('a', "It is not. Swim back. Build again."),
    ] },
    { id: 'sp.sf.la2', when: at('swamp-raft', 'launch'), turns: [
      by('a', "One, two, three, push!"),
      beat('They push. The raft floats away without them, all on its own, and they both fall in the water.'),
      by('b', "Get it! It's escaping! Everything here keeps escaping!"),
    ] },
    { id: 'sp.sf.dr1', when: at('swamp-raft', 'downriver'), turns: [
      beat('The current pushes the raft sideways into the reeds, and it sticks there, and won\'t move.'),
      by('a', "Push off! Push off the bottom!"),
      by('b', "The bottom is mud! I'm pushing mud!"),
    ] },
    { id: 'sp.sf.dr2', when: at('swamp-raft', 'downriver'), turns: [
      by('b', "Is that log moving?"),
      beat('The log is an alligator. {b} paddles away from it so fast that the raft spins round and comes apart.'),
      by('a', "Back to the bank. We're building another one."),
    ] },
  ],
};
