// Fjord Peaks' Either/Or, stage by stage (js/rr/places/fjord-peaks.js `stages`; director.js stageBeats).
//   Jump Down    harness -> the-leap -> the-grab -> reel-up -> fish-tip                 (off the bridge, a fish bare-handed)
//   Jump Around  dance-lesson -> the-chant -> for-the-elders -> elders-nod              (the challenge dance for the elders)
// An empty hand at the bottom means another jump; a dance the elders won't accept means more practice. The elder is the
// place's own local.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });
const T = 'jump-dance';

export default {
  'task-stage.ok': [
    // ── Jump Down ──
    { id: 'fp.st.ha1', when: at(T, 'harness'), turns: [
      beat('On the old iron bridge, the jump master straps {a} into a harness and clips the bungee cord round {a.posAdj} ankles.'),
      by('b', "How far down is it?"),
      by('a', "Far. Really far. I can see the river, but I can't see any fish."),
    ] },
    { id: 'fp.st.ha2', when: at(T, 'harness'), turns: [
      by('a', "Is it tight enough? Check it again."),
      by('b', "It's fine. They've checked it three times."),
      beat('{a} shuffles out to the edge of the platform, toes hanging over the drop.'),
    ] },
    { id: 'fp.st.lp1', when: at(T, 'the-leap'), turns: [
      beat('{a} spreads both arms, leans forward, and drops off the bridge.'),
      by('a', "Aaaaaaaah!"),
      by('b', "Get a fish!"),
    ] },
    { id: 'fp.st.lp2', when: at(T, 'the-leap'), turns: [
      by('b', "Three, two, one, go!"),
      beat('{a} dives off in a near-perfect swan dive, and the cord unrolls behind {a.obj} all the way down the gorge.'),
      by('b', "Okay, that actually looked really cool."),
    ] },
    { id: 'fp.st.gr1', when: at(T, 'the-grab'), turns: [
      beat('At the bottom of the drop, {a}\'s arms go into the river and come up with a big, flapping fish.'),
      by('a', "I've got one! Oh, it's slippery!"),
      beat('The cord snaps {a} back up into the air, still hugging it.'),
    ] },
    { id: 'fp.st.gr2', when: at(T, 'the-grab'), turns: [
      by('b', "Did you get one?"),
      beat('Far below, {a} dips into the water up to the shoulders, and there\'s a flash of silver as {a.sub} comes back up.'),
      by('b', "Yes! There's a fish!"),
    ] },
    { id: 'fp.st.ru1', when: at(T, 'reel-up'), turns: [
      beat('The crew winches {a} back up to the bridge, upside down, both arms wrapped round the fish.'),
      by('a', "Grab it off me before I drop it."),
      by('b', "No way, it's all yours. I'm not touching it."),
    ] },
    { id: 'fp.st.ru2', when: at(T, 'reel-up'), turns: [
      by('a', "All the blood's gone to my head."),
      beat('{a} comes up over the rail, red in the face and dripping, and drops the fish in a bucket.'),
      by('b', "You did it! You actually did it!"),
    ] },
    { id: 'fp.st.ft1', when: at(T, 'fish-tip'), turns: [
      beat('The jump master looks in the bucket, nods, and hands over the tip.'),
      by('b', "Chill Zone by the lake. Come on."),
      by('a', "Give me a second. My legs still think I'm upside down."),
    ] },
    { id: 'fp.st.ft2', when: at(T, 'fish-tip'), turns: [
      by('a', "I caught a fish with my bare hands. Off a bridge."),
      by('b', "I know. You smell like it, too."),
      beat('They run off the bridge, {a} still a little wobbly.'),
    ] },

    // ── Jump Around ──
    { id: 'fp.st.dl1', when: at(T, 'dance-lesson'), turns: [
      beat('On the stage in the valley, an elder shows them the dance: stamping feet, bent knees, slapping arms, and a fierce face with the tongue out.'),
      by('b', "We have to do the face too?"),
      by('a', "Pretty sure the face is the main part."),
    ] },
    { id: 'fp.st.dl2', when: at(T, 'dance-lesson'), turns: [
      by('a', "Stamp, stamp, slap, slap. Okay. Again."),
      beat('They copy the elder step by step, the stamps first, then the slaps, then both together.'),
      by('b', "Hey, we're getting it."),
    ] },
    { id: 'fp.st.ch1', when: at(T, 'the-chant'), turns: [
      beat('The elder teaches them the chant line by line, and they shout it back, a little louder every time.'),
      by('b', "My throat's already sore."),
      by('a', "Good. I think that means we're doing it right."),
    ] },
    { id: 'fp.st.ch2', when: at(T, 'the-chant'), turns: [
      by('a', "Bigger eyes. Look angry."),
      beat('{b} pulls the fiercest face {b.sub} can, eyes wide and tongue out, and the elder gives a small grunt.'),
      by('b', "Was that a good grunt?"),
      by('a', "I think so. Keep doing that."),
    ] },
    { id: 'fp.st.fe1', when: at(T, 'for-the-elders'), turns: [
      beat('In front of the elders, they stamp, slap, chant and pull their faces, in time, right to the end.'),
      beat('Their last shout echoes off the valley walls, and the elders sit very still.'),
      by('b', "Was that okay?"),
    ] },
    { id: 'fp.st.fe2', when: at(T, 'for-the-elders'), turns: [
      by('b', "Loud and together. Ready? Go."),
      beat('They get through the whole dance without a mistake and finish frozen, tongues out, eyes wide.'),
      by('a', "Don't move. Let them look."),
    ] },
    { id: 'fp.st.en1', when: at(T, 'elders-nod'), turns: [
      beat('The oldest elder stands, looks at them for a long moment, and nods. Then all the elders stamp their feet back at them.'),
      by('b', "They did it back! Did you see that?"),
      by('a', "That gave me goosebumps."),
    ] },
    { id: 'fp.st.en2', when: at(T, 'elders-nod'), turns: [
      by('a', "Thank you so much. Really."),
      beat('The elder hands over the tip and pats {a} on the shoulder.'),
      by('b', "I'm doing that dance at every party from now on."),
    ] },
  ],

  'task-stage.fail': [
    // ── Jump Down ──
    { id: 'fp.sf.ha1', when: at(T, 'harness'), turns: [
      beat('{a} looks over the edge at the river, a very long way down, and steps back.'),
      by('a', "Hang on. I just need a minute."),
      by('b', "You've had a minute! Just go!"),
    ] },
    { id: 'fp.sf.ha2', when: at(T, 'harness'), turns: [
      by('b', "Just lean forward. That's all you have to do."),
      beat('{a} leans forward, then back, then forward again, and doesn\'t jump.'),
      by('a', "I'm going. I'm going. Okay, not yet."),
    ] },
    { id: 'fp.sf.gr1', when: at(T, 'the-grab'), turns: [
      beat('{a} hits the river at the bottom, grabs at everything, and comes up holding a handful of weed.'),
      by('a', "Does weed count?"),
      by('b', "No! Go again!"),
    ] },
    { id: 'fp.sf.gr2', when: at(T, 'the-grab'), turns: [
      by('b', "Did you get one?"),
      beat('{a} bounces back up into the air with nothing, yelling about a fish that swam right past {a.posAdj} hand.'),
      by('b', "Up you come. You're jumping again."),
    ] },
    { id: 'fp.sf.ru1', when: at(T, 'reel-up'), turns: [
      beat('Halfway back up, the fish gives one big wriggle, slips out of {a}\'s arms, and drops back into the river.'),
      by('a', "No! I had it!"),
      by('b', "I know. You've got to go again."),
    ] },
    { id: 'fp.sf.ru2', when: at(T, 'reel-up'), turns: [
      by('a', "Look! I've got it!"),
      beat('{a} holds the fish up over {a.posAdj} head to show {b}, and it shoots straight out of {a.posAdj} hands.'),
      by('b', "Why would you wave it around?"),
    ] },

    // ── Jump Around ──
    { id: 'fp.sf.dl1', when: at(T, 'dance-lesson'), turns: [
      beat('{a} stamps with the left foot when everyone else stamps with the right, and bumps straight into {b}.'),
      by('b', "Other foot!"),
      by('a', "Sorry, sorry. Which one's the other foot?"),
    ] },
    { id: 'fp.sf.dl2', when: at(T, 'dance-lesson'), turns: [
      by('b', "Wait, is it slap then stamp, or stamp then slap?"),
      beat('The elder sighs and shows them the steps again from the start.'),
      by('a', "Stamp then slap. I think."),
    ] },
    { id: 'fp.sf.ch1', when: at(T, 'the-chant'), turns: [
      beat('They chant the words politely, about as loud as someone ordering a coffee.'),
      beat('The elder shakes their head and cups a hand to one ear.'),
      by('a', "Louder. Way louder."),
    ] },
    { id: 'fp.sf.ch2', when: at(T, 'the-chant'), turns: [
      by('b', "Do the face."),
      beat('{a} tries the fierce face and starts giggling halfway through, then {b} starts giggling, and they have to begin the chant again.'),
      by('a', "Don't look at me. I can't do it if you look at me."),
    ] },
    { id: 'fp.sf.fe1', when: at(T, 'for-the-elders'), turns: [
      beat('Halfway through, {b} forgets what comes next and just stands there, slapping {b.posAdj} legs.'),
      by('a', "Keep going! Do anything!"),
      beat('The elders shake their heads. More practice.'),
    ] },
    { id: 'fp.sf.fe2', when: at(T, 'for-the-elders'), turns: [
      by('a', "From the top. Ready?"),
      beat('They start together, but by the end {a} is two beats ahead of {b}, and the elders send them back to practise.'),
      by('b', "We were close. We were sort of close."),
    ] },
  ],
};
