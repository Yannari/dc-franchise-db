// Iron Tower City's challenges, stage by stage (js/rr/places/iron-tower-city.js `stages`; director.js stageBeats).
//   the caricature  the-easel -> the-pose -> sketch -> four-things -> artist-laughs  (Botch or Watch: a draws, b sits)
//   the catacombs   manhole -> tunnels -> dead-end -> the-cheese -> way-out           (All-In: both, following their noses)
// A drawing the artist won't take is torn up and started again on a fresh sheet; a dead end sends a team back the way it
// came. The artist is the place's own local (the avatar stands there: js/vp-rr-ep/locals.js).
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the caricature ──
    { id: 'itc.st.ea1', when: at('caricature', 'the-easel'), turns: [
      beat('At the foot of the iron tower, the artist hands {a} a stick of charcoal and taps the blank sheet on the easel.'),
      by('a', "A caricature. So, a drawing of you, but worse."),
      by('b', "Why does it have to be worse?"),
      by('a', "Because that's the rule. And because I'm drawing it."),
    ] },
    { id: 'itc.st.ea2', when: at('caricature', 'the-easel'), turns: [
      beat('The artist holds up four fingers and points at {b}\'s face, one feature at a time: the nose, the ears, the chin, the hair.'),
      by('a', "Four exaggerations. Okay. So I make the big things bigger."),
      by('b', "What big things? I don't have any big things."),
      by('a', "Sit down, please."),
    ] },
    { id: 'itc.st.po1', when: at('caricature', 'the-pose'), turns: [
      beat('{b} sits on the little stool, lifts {b.posAdj} chin, and gazes off into the distance like a statue of someone important.'),
      by('a', "What is that face?"),
      by('b', "It's my good side."),
      by('a', "There's no good side in a caricature."),
    ] },
    { id: 'itc.st.po2', when: at('caricature', 'the-pose'), turns: [
      by('a', "Just sit still and look normal."),
      beat('{b} tries to look normal, which turns out to be very hard when someone is staring at you with a stick of charcoal.'),
      by('b', "Is this normal? This feels weird. Is my mouth weird?"),
      by('a', "It is now."),
    ] },
    { id: 'itc.st.sk1', when: at('caricature', 'sketch'), turns: [
      beat('{a} draws fast, glancing up and down, the charcoal squeaking on the paper.'),
      by('b', "Can I see it?"),
      by('a', "No. You can see it when it's done."),
    ] },
    { id: 'itc.st.sk2', when: at('caricature', 'sketch'), turns: [
      by('a', "Okay. Big round head, tiny little body."),
      by('b', "Why am I a bean?"),
      by('a', "That's how caricatures work. Big head, tiny body."),
      beat('Over {a}\'s shoulder, the artist gives a small, interested nod.'),
    ] },
    { id: 'itc.st.sk3', when: at('caricature', 'sketch'), turns: [
      beat('{a} rubs out a line with a thumb, smudges charcoal across {a.posAdj} cheek without noticing, and keeps drawing.'),
      by('b', "You've got charcoal on your face."),
      by('a', "Good. That means I'm working."),
    ] },
    { id: 'itc.st.ft1', when: at('caricature', 'four-things'), turns: [
      by('a', "Big nose. That's one. Giant ears, that's two."),
      by('b', "My ears are a perfectly normal size."),
      by('a', "Not anymore. Three, eyebrows. And four... the hair. Huge hair."),
      beat('{a} draws the hair so big that it runs right off the top of the sheet.'),
    ] },
    { id: 'itc.st.ft2', when: at('caricature', 'four-things'), turns: [
      beat('{a} holds the drawing up next to {b}\'s actual face and squints at the two of them.'),
      by('a', "The chin needs to be bigger. Much bigger. Like a shovel."),
      by('b', "I'm right here. I can hear you."),
      by('a', "Good. Stick it out a bit more."),
    ] },
    { id: 'itc.st.ft3', when: at('caricature', 'four-things'), turns: [
      by('b', "You're enjoying this way too much."),
      by('a', "Honestly? A little bit, yeah."),
      beat('{a} adds a fourth exaggeration, a pair of teeth like piano keys, and steps back.'),
    ] },
    { id: 'itc.st.al1', when: at('caricature', 'artist-laughs'), turns: [
      beat('The artist studies the drawing for a long moment, then snorts, then laughs out loud and slaps the easel.'),
      by('a', "Is that good? That's good, right?"),
      beat('The artist hands over the tip, still laughing, and points at {b} as if to say: that\'s exactly you.'),
    ] },
    { id: 'itc.st.al2', when: at('caricature', 'artist-laughs'), turns: [
      beat('The artist looks at the drawing, then at {b}, then at the drawing again, and laughs so hard that a pigeon takes off.'),
      by('b', "Why is everyone laughing? Let me see it. Oh. Oh no."),
      by('a', "It's art. You can't argue with art."),
    ] },

    // ── the catacombs ──
    { id: 'itc.st.mh1', when: at('catacombs', 'manhole'), turns: [
      beat('In the park, the manhole cover is off, and an iron ladder runs down into total darkness.'),
      by('b', "We're going down there? On purpose?"),
      by('a', "The tip says follow your nose. My nose says down there."),
      beat('{a} climbs down first, and the darkness swallows {a.obj} up.'),
    ] },
    { id: 'itc.st.mh2', when: at('catacombs', 'manhole'), turns: [
      by('a', "It's just a ladder. Ladders are fine."),
      by('b', "It's a ladder into a hole full of skeletons."),
      by('a', "Okay, don't say it like that. Just climb."),
    ] },
    { id: 'itc.st.tu1', when: at('catacombs', 'tunnels'), turns: [
      beat('The tunnels are narrow and cold, and the walls are stacked from the floor to the ceiling with old bones and rows of grinning skulls.'),
      by('b', "They're all looking at me."),
      by('a', "They don't have eyes. They can't look at you."),
      by('b', "Then why does it feel like they are?"),
    ] },
    { id: 'itc.st.tu2', when: at('catacombs', 'tunnels'), turns: [
      by('a', "Stop. Smell that?"),
      beat('They both sniff. Somewhere under the damp stone smell there is something else, something sharp and cheesy and very, very old.'),
      by('b', "That's either the cheese or a very old sock."),
      by('a', "Either way, we follow it."),
    ] },
    { id: 'itc.st.tu3', when: at('catacombs', 'tunnels'), turns: [
      beat('{a} and {b} walk with their noses in the air, turning left whenever the smell gets stronger and right whenever it gets weaker.'),
      by('b', "We look like two dogs sniffing for a sandwich."),
      by('a', "A million-dollar sandwich. Keep sniffing."),
    ] },
    { id: 'itc.st.de1', when: at('catacombs', 'dead-end'), turns: [
      beat('The tunnel ends in a solid wall of skulls.'),
      by('a', "Dead end."),
      by('b', "Like, actually dead. Look at all the skulls."),
      beat('They turn around straight away and take the other tunnel, which smells much more strongly of cheese.'),
    ] },
    { id: 'itc.st.de2', when: at('catacombs', 'dead-end'), turns: [
      by('b', "Left or right?"),
      beat('{a} sniffs the left tunnel, then the right one, then the left one again.'),
      by('a', "Right. Left just smells like bones."),
      beat('Right is the correct choice.'),
    ] },
    { id: 'itc.st.ch1', when: at('catacombs', 'the-cheese'), turns: [
      beat('The tunnel opens into a little chamber, and there, stacked up against the bones, is a pile of huge golden cheese wheels.'),
      by('b', "Cheese! Oh, I've never been so happy to see cheese."),
      by('a', "It's so strong. My eyes are watering."),
    ] },
    { id: 'itc.st.ch2', when: at('catacombs', 'the-cheese'), turns: [
      by('a', "One wheel each. The tip's tucked in the middle of the pile."),
      beat('{a} pulls the tip out from between two wheels, and {b} tries to lift one, which turns out to weigh about as much as {b} does.'),
      by('b', "How do you carry a cheese this size?"),
      by('a', "You roll it. It's a wheel."),
    ] },
    { id: 'itc.st.ch3', when: at('catacombs', 'the-cheese'), turns: [
      beat('{b} reads the tip by the light of a wall lamp.'),
      by('b', "\"Ride your cheese down the river to the museum.\" Ride it? It's a cheese."),
      by('a', "I guess it's a boat now. Come on, start rolling."),
    ] },
    { id: 'itc.st.wo1', when: at('catacombs', 'way-out'), turns: [
      beat('{a} and {b} roll their wheels up a ramp and out into the night air, right on the stone quay beside the river.'),
      by('b', "Fresh air! Finally!"),
      by('a', "Not really. I think it's us. We smell like the cheese now."),
    ] },
    { id: 'itc.st.wo2', when: at('catacombs', 'way-out'), turns: [
      by('a', "There's the river. And look, the museum, all lit up."),
      beat('{b} gives {b.posAdj} cheese wheel a little pat, as if it were a horse.'),
      by('b', "Okay, cheese. Please don't sink."),
    ] },
  ],

  'task-stage.fail': [
    // ── the caricature: torn up, a fresh sheet ──
    { id: 'itc.sf.sk1', when: at('caricature', 'sketch'), turns: [
      beat('{a} turns the easel round proudly. The artist looks at the drawing for one second and tears it in half.'),
      by('a', "What? Why? That looks just like {b}!"),
      beat('The artist nods, points at the word on the rules card, REALISTIC, crosses it out, and clips a fresh sheet to the easel.'),
    ] },
    { id: 'itc.sf.sk2', when: at('caricature', 'sketch'), turns: [
      by('b', "Why does it look like a potato?"),
      by('a', "It's not a potato. It's you."),
      beat('The artist agrees with neither of them, tears the potato off the easel, and hands {a} a clean sheet.'),
    ] },
    { id: 'itc.sf.sk3', when: at('caricature', 'sketch'), turns: [
      beat('{a} has drawn {b} as a beautiful, glowing portrait, with sparkling eyes and perfect hair.'),
      by('b', "Aw. That's really sweet. I love it."),
      beat('The artist does not love it. The artist tears it up, because a caricature is not supposed to be flattering.'),
    ] },
    { id: 'itc.sf.ft1', when: at('caricature', 'four-things'), turns: [
      beat('The artist counts the exaggerations on the drawing out loud, on one hand: the nose, the ears, the chin. Then stops at three.'),
      by('a', "The eyebrows! The eyebrows are bigger too!"),
      beat('They aren\'t, really. The drawing is torn up, and {a} starts again from the top.'),
    ] },
    { id: 'itc.sf.ft2', when: at('caricature', 'four-things'), turns: [
      by('b', "Don't make the nose that big. My mum's going to see this."),
      beat('{a} feels bad and shrinks the nose back down to normal, and the artist rips the whole drawing up on the spot.'),
      by('a', "Okay, sorry. Big nose it is."),
    ] },

    // ── the catacombs ──
    { id: 'itc.sf.mh1', when: at('catacombs', 'manhole'), turns: [
      beat('{b} gets three rungs down the ladder, looks down into the dark, and climbs straight back up again.'),
      by('b', "Nope. I need a minute."),
      by('a', "Quick minute. There's another team coming."),
    ] },
    { id: 'itc.sf.mh2', when: at('catacombs', 'manhole'), turns: [
      by('b', "What if the ladder breaks? What if there's a rat?"),
      beat('A rat runs out of the bushes, right across {b}\'s foot.'),
      by('b', "There's a rat! I said there'd be a rat!"),
    ] },
    { id: 'itc.sf.tu1', when: at('catacombs', 'tunnels'), turns: [
      beat('{a} stops in front of a skull with a chip out of its forehead.'),
      by('a', "I know this skull. We've passed this skull."),
      by('b', "How many times?"),
      by('a', "Three. We've been going in circles."),
    ] },
    { id: 'itc.sf.tu2', when: at('catacombs', 'tunnels'), turns: [
      by('b', "I can't smell the cheese anymore. I can't smell anything."),
      beat('They stand at a fork in the tunnel, sniffing hopelessly, while the faint sound of another team\'s footsteps fades away somewhere ahead.'),
      by('a', "Then follow the footsteps."),
    ] },
    { id: 'itc.sf.tu3', when: at('catacombs', 'tunnels'), turns: [
      beat('The wall lamps run out, and for a few long, horrible steps, it is completely dark.'),
      by('b', "Something just touched my hand."),
      by('a', "That was my hand."),
      by('b', "Then why was it so bony?"),
    ] },
    { id: 'itc.sf.de1', when: at('catacombs', 'dead-end'), turns: [
      beat('The smell gets stronger and stronger, and then the tunnel ends in a wall of skulls.'),
      by('b', "But the cheese smell is right here!"),
      by('a', "It's behind the wall. We have to go all the way round."),
      beat('They turn back the way they came.'),
    ] },
    { id: 'itc.sf.de2', when: at('catacombs', 'dead-end'), turns: [
      by('a', "Dead end. Again."),
      by('b', "That's three. I swear these walls keep moving."),
      beat('They walk all the way back to the last fork and try again.'),
    ] },
    { id: 'itc.sf.de3', when: at('catacombs', 'dead-end'), turns: [
      beat('{a} runs round a corner at full speed, straight into a wall of bones, and bounces off.'),
      by('a', "Who puts a wall at the end of a tunnel?"),
      by('b', "That's... kind of what a dead end is."),
    ] },
  ],
};
