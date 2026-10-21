// Glass Pyramid City's challenges, stage by stage (js/rr/places/glass-pyramid-city.js `stages`; director.js stageBeats).
//   the statue  the-plinth -> galleries -> the-bear -> fit-it -> curator-nod          (All-In: both search and rebuild)
//   the runway  the-outfit -> the-walk -> the-pose -> walk-back -> applause          (Botch or Watch: a walks, b watches)
// A real exhibit carried back, or a piece on upside down, means more searching; a trip, a wobble or a giggle on the
// runway means a new outfit and another walk.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the statue ──
    { id: 'gpc.st.pl1', when: at('broken-statue', 'the-plinth'), turns: [
      beat('In the middle of the hall, behind a red rope, lies a marble statue in pieces, and the head, the body and the legs are all missing.'),
      by('b', "We have to find the pieces? In this whole museum?"),
      by('a', "Head, body, legs. Let's split up. No, let's not. Let's stay together."),
    ] },
    { id: 'gpc.st.pl2', when: at('broken-statue', 'the-plinth'), turns: [
      by('a', "Look at the plinth. It shows where each piece goes."),
      by('b', "Then we just need the pieces. Come on."),
      beat('They set off into the first gallery.'),
    ] },
    { id: 'gpc.st.gl1', when: at('broken-statue', 'galleries'), turns: [
      beat('They walk the long galleries, past paintings and mummy cases, looking for anything made of white marble.'),
      by('b', "There! A head. A marble head, on that shelf."),
      by('a', "Grab it. Carefully. Very carefully."),
    ] },
    { id: 'gpc.st.gl2', when: at('broken-statue', 'galleries'), turns: [
      by('a', "The legs were in the mummy room. Leaning on a coffin."),
      by('b', "Who hides statue legs next to a mummy?"),
      beat('They carry the legs back between them, shuffling like movers with a sofa.'),
    ] },
    { id: 'gpc.st.br1', when: at('broken-statue', 'the-bear'), turns: [
      beat('A brown bear from a travelling show wanders round the corner, sniffs the air, and sits down in the middle of the gallery.'),
      by('b', "There's a bear. In the museum."),
      by('a', "Walk past it slowly. Don't look at it."),
    ] },
    { id: 'gpc.st.br2', when: at('broken-statue', 'the-bear'), turns: [
      by('a', "It's sitting on the body. It's sitting right on our piece."),
      beat('{b} waves a museum map, and the bear gets bored and wanders off into the next room.'),
      by('b', "Grab it! Quick!"),
    ] },
    { id: 'gpc.st.fi1', when: at('broken-statue', 'fit-it'), turns: [
      beat('They set the legs on the plinth, lift the body on top of them, and lower the head into place.'),
      by('b', "Is it straight? Does it look right?"),
      by('a', "It looks like a statue. A whole statue."),
    ] },
    { id: 'gpc.st.fi2', when: at('broken-statue', 'fit-it'), turns: [
      by('a', "On three. Lift. One, two, three."),
      beat('The body clicks onto the legs, and the head sits neatly on top.'),
      by('b', "Like it never broke."),
    ] },
    { id: 'gpc.st.cn1', when: at('broken-statue', 'curator-nod'), turns: [
      beat('The curator walks round the statue twice, adjusts the head a tiny bit, and nods.'),
      by('b', "We fixed a statue. In a real museum."),
      by('a', "Don't touch it. Read the tip."),
    ] },
    { id: 'gpc.st.cn2', when: at('broken-statue', 'curator-nod'), turns: [
      by('a', "\"Walk the runway.\" A fashion runway?"),
      by('b', "In here? In the museum?"),
      beat('They follow the music towards the grand hall.'),
    ] },

    // ── the runway ──
    { id: 'gpc.st.ou1', when: at('runway', 'the-outfit'), turns: [
      beat('Backstage, the designer hands {a} an outfit: a huge feathered collar, a skirt like a lampshade and shoes that are mostly heel.'),
      by('a', "I'm supposed to walk in this?"),
      by('b', "You're supposed to strut in it."),
    ] },
    { id: 'gpc.st.ou2', when: at('runway', 'the-outfit'), turns: [
      by('b', "How does it feel?"),
      by('a', "Heavy. And tall. I'm taller than everyone now."),
      beat('{a} wobbles to the bottom of the runway and stands up straight.'),
    ] },
    { id: 'gpc.st.wk1', when: at('runway', 'the-walk'), turns: [
      beat('The music starts, the lights come up, and {a} walks down the runway, one foot in front of the other.'),
      by('b', "Chin up! Hips! Use your hips!"),
      by('a', "I'm using everything I've got!"),
    ] },
    { id: 'gpc.st.wk2', when: at('runway', 'the-walk'), turns: [
      by('b', "Slow. Slow and serious. Don't smile."),
      beat('{a} walks with a face like stone, and the feathers bounce at every step.'),
      by('b', "Yes. Like that. Exactly like that."),
    ] },
    { id: 'gpc.st.po1', when: at('runway', 'the-pose'), turns: [
      beat('At the end of the runway, {a} stops, puts a hand on one hip, and turns slowly to the designer.'),
      by('b', "Hold it. Hold it. And turn."),
      beat('{a} turns on one heel, perfectly, and the designer writes something down.'),
    ] },
    { id: 'gpc.st.po2', when: at('runway', 'the-pose'), turns: [
      by('b', "Big pose! Give her a big pose!"),
      beat('{a} throws both arms up, freezes, and doesn\'t even blink while the cameras flash.'),
      by('a', "Did that look good? I couldn't see."),
    ] },
    { id: 'gpc.st.wb1', when: at('runway', 'walk-back'), turns: [
      beat('{a} turns and walks back up the runway without a wobble, feathers swishing.'),
      by('b', "Nearly there! Don't get excited! Keep it serious!"),
      by('a', "I'm so serious. I've never been this serious."),
    ] },
    { id: 'gpc.st.wb2', when: at('runway', 'walk-back'), turns: [
      by('a', "These shoes. These shoes are so hard to walk in."),
      by('b', "Nobody can tell. You look like you were born in them."),
      beat('{a} makes it all the way back to the start.'),
    ] },
    { id: 'gpc.st.ap1', when: at('runway', 'applause'), turns: [
      beat('The designer stands up in the front row and claps, and hands over the tip.'),
      by('b', "She loved it! She actually loved it!"),
      by('a', "Get me out of these shoes. Please."),
    ] },
    { id: 'gpc.st.ap2', when: at('runway', 'applause'), turns: [
      by('a', "Can I keep the collar?"),
      by('b', "No. Give it back. Chill Zone."),
      beat('They run for the glass pyramid.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the statue ──
    { id: 'gpc.sf.gl1', when: at('broken-statue', 'galleries'), turns: [
      beat('{a} carries a marble head all the way back to the plinth, and the curator points at the label on it. It\'s a real exhibit.'),
      by('a', "Oh. It's somebody else's head."),
      by('b', "Put it back. Put it back exactly where it was."),
    ] },
    { id: 'gpc.sf.gl2', when: at('broken-statue', 'galleries'), turns: [
      by('b', "We've been past these paintings four times."),
      by('a', "Then the legs aren't in this room. Try upstairs."),
      beat('They search the whole floor again.'),
    ] },
    { id: 'gpc.sf.br1', when: at('broken-statue', 'the-bear'), turns: [
      beat('The bear stands up on its back legs and growls, and they run straight back the way they came.'),
      by('b', "It doesn't like us! It doesn't like us!"),
      by('a', "We'll go round. The long way."),
    ] },
    { id: 'gpc.sf.br2', when: at('broken-statue', 'the-bear'), turns: [
      by('a', "Just walk past it."),
      beat('The bear follows them. All the way down the gallery. They have to hide in the mummy room until it leaves.'),
      by('b', "Is it gone? Look. You look."),
    ] },
    { id: 'gpc.sf.fi1', when: at('broken-statue', 'fit-it'), turns: [
      beat('The curator looks at the finished statue, then turns the head round. It was facing backwards.'),
      by('b', "Backwards. We put the head on backwards."),
      by('a', "From the start. Take it off."),
    ] },
    { id: 'gpc.sf.fi2', when: at('broken-statue', 'fit-it'), turns: [
      by('b', "Careful! Careful with the head!"),
      beat('The head slips out of {a}\'s hands and rolls across the floor. It\'s fine. It\'s still the wrong way up.'),
      by('a', "Sorry. Sorry. It's fine. Nobody saw."),
    ] },

    // ── the runway ──
    { id: 'gpc.sf.ou1', when: at('runway', 'the-outfit'), turns: [
      beat('{a} tries to put on the shoes, gets one foot in, and can\'t get the other one in at all.'),
      by('a', "These are for someone with tiny feet!"),
      by('b', "Ask for another outfit!"),
    ] },
    { id: 'gpc.sf.ou2', when: at('runway', 'the-outfit'), turns: [
      by('b', "Why are you wearing the skirt on your head?"),
      by('a', "Isn't it a hat?"),
      beat('It isn\'t a hat. They start again.'),
    ] },
    { id: 'gpc.sf.wk1', when: at('runway', 'the-walk'), turns: [
      beat('Three steps down the runway, {a}\'s heel catches, and {a} goes down in a heap of feathers.'),
      by('b', "Are you okay? Get up!"),
      by('a', "I'm fine. I need another outfit. This one's broken now."),
    ] },
    { id: 'gpc.sf.wk2', when: at('runway', 'the-walk'), turns: [
      by('b', "You're wobbling. Stop wobbling."),
      beat('{a} wobbles left, then right, then grabs a spotlight stand to stay up. The designer sighs.'),
      by('a', "Another outfit. I know. I know."),
    ] },
    { id: 'gpc.sf.po1', when: at('runway', 'the-pose'), turns: [
      beat('At the end of the runway, {a} strikes a pose, catches {b}\'s eye, and bursts out laughing.'),
      by('b', "Don't laugh! You can't laugh!"),
      by('a', "You made a face! You made a face at me!"),
    ] },
    { id: 'gpc.sf.po2', when: at('runway', 'the-pose'), turns: [
      by('a', "What do I do with my hands?"),
      beat('{a} stands at the end of the runway, flapping both hands, not knowing where to put them. The designer shakes her head.'),
      by('b', "Hip! Put one on your hip!"),
    ] },
    { id: 'gpc.sf.wb1', when: at('runway', 'walk-back'), turns: [
      beat('On the way back, the giant collar tips forward over {a}\'s eyes, and {a} walks off the side of the runway.'),
      by('a', "I couldn't see! The feathers were in my eyes!"),
      by('b', "That's not the runway! That's the floor!"),
    ] },
    { id: 'gpc.sf.wb2', when: at('runway', 'walk-back'), turns: [
      by('a', "I made it! I made it all the way!"),
      by('b', "You did a little skip at the end. You can't skip."),
      beat('The designer agrees. Another outfit, and another walk.'),
    ] },
  ],
};
