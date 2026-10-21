// Badlands' challenges, stage by stage (js/rr/places/badlands.js `stages`; director.js stageBeats).
//   the dinosaur   bone-dig -> carry-bones -> the-frame -> inspection          (All-In: dig it up, build it)
//   the barrel     old-map -> digging -> barrel-stuck -> rolled-out            (Botch or Watch: a digs, b watches)
// A bone in the wrong place, a missing bone or a skeleton that collapses means more digging or rebuilding; an empty hole
// means filling it in and picking another square. The palaeontologist has no face on the screen yet, so speaks in beats.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the dinosaur ──
    { id: 'bl.st.bd1', when: at('dino', 'bone-dig'), turns: [
      beat('{a} chips at the hard ground with a pickaxe until the end of a long brown bone pokes out.'),
      by('a', "Bone! I've got a bone!"),
      by('b', "Brush, don't pull. Brush the dirt off first."),
    ] },
    { id: 'bl.st.bd2', when: at('dino', 'bone-dig'), turns: [
      by('b', "There's a skull here. A whole skull. With teeth."),
      beat('{b} brushes the dirt away from a row of very big, very sharp teeth.'),
      by('a', "I'm glad that one's been dead for a while."),
    ] },
    { id: 'bl.st.cb1', when: at('dino', 'carry-bones'), turns: [
      beat('They carry the bones back to the frame in armfuls, a leg bone over each shoulder.'),
      by('b', "How heavy was this thing?"),
      by('a', "Heavy. Keep walking. Don't drop the ribs."),
    ] },
    { id: 'bl.st.cb2', when: at('dino', 'carry-bones'), turns: [
      by('a', "You take the tail. I've got the spine."),
      beat('They shuffle across the plain with half a dinosaur between them.'),
      by('b', "Last trip. I think that's all of it."),
    ] },
    { id: 'bl.st.fr1', when: at('dino', 'the-frame'), turns: [
      beat('On the frame, the skeleton takes shape: the spine first, then the ribs, then the legs.'),
      by('b', "Thigh bone goes into the hip bone. Like the song."),
      by('a', "That's people, not dinosaurs. But fine."),
    ] },
    { id: 'bl.st.fr2', when: at('dino', 'the-frame'), turns: [
      by('a', "Lift the skull. Careful. On three."),
      beat('They heave the skull up onto the end of the neck, and it slots into place.'),
      by('b', "It's looking at me. It's actually looking at me."),
    ] },
    { id: 'bl.st.in1', when: at('dino', 'inspection'), turns: [
      beat('The palaeontologist walks all the way round the skeleton, counting bones under their breath.'),
      by('b', "Every bone. In the right place. I promise."),
      beat('The palaeontologist nods, and hands over the tip.'),
    ] },
    { id: 'bl.st.in2', when: at('dino', 'inspection'), turns: [
      by('a', "We built a dinosaur. We actually built a dinosaur."),
      by('b', "Tip says barrels next. Buried ones."),
      by('a', "We're just going to dig all day, aren't we?"),
    ] },

    // ── the barrel ──
    { id: 'bl.st.om1', when: at('oil-barrel', 'old-map'), turns: [
      beat('By the old drilling rig, a patch of ground is staked out in squares. {a} unfolds a faded map.'),
      by('a', "X marks the spot. There's an X. Kind of."),
      by('b', "That's a coffee stain."),
    ] },
    { id: 'bl.st.om2', when: at('oil-barrel', 'old-map'), turns: [
      by('b', "Three squares from the rig. Two to the left."),
      by('a', "Left from where? From the map, or from us?"),
      beat('They turn the map round twice, and pick a square.'),
    ] },
    { id: 'bl.st.dg1', when: at('oil-barrel', 'digging'), turns: [
      beat('{a} digs and digs, and the shovel hits something with a hollow metal clang.'),
      by('a', "Metal! I hit metal!"),
      by('b', "That's it! Dig around it!"),
    ] },
    { id: 'bl.st.dg2', when: at('oil-barrel', 'digging'), turns: [
      by('b', "Keep going. It's down there. I can feel it."),
      by('a', "You can feel it? You're standing over there!"),
      beat('A few more shovelfuls, and the top of a barrel shows through the dirt.'),
    ] },
    { id: 'bl.st.bs1', when: at('oil-barrel', 'barrel-stuck'), turns: [
      beat('{a} grabs the rim of the barrel and pulls. It shifts, then slides up out of the dirt.'),
      by('a', "It's got our name on it! It's ours!"),
      by('b', "Roll it out! Roll it!"),
    ] },
    { id: 'bl.st.bs2', when: at('oil-barrel', 'barrel-stuck'), turns: [
      by('b', "Rock it side to side. Loosen it."),
      beat('{a} rocks the barrel back and forth until it comes free with a slurp.'),
      by('a', "Out! It's out!"),
    ] },
    { id: 'bl.st.ro1', when: at('oil-barrel', 'rolled-out'), turns: [
      beat('{a} rolls the barrel up out of the pit and over to the rig. Taped to the lid is the tip.'),
      by('b', "The Chill Zone! The campfire!"),
      by('a', "I'm never digging again. Not even in a garden."),
    ] },
    { id: 'bl.st.ro2', when: at('oil-barrel', 'rolled-out'), turns: [
      by('a', "Tip's on the lid."),
      by('b', "Read it! Read it out!"),
      beat('{a} peels it off, filthy and grinning, and they run.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the dinosaur ──
    { id: 'bl.sf.bd1', when: at('dino', 'bone-dig'), turns: [
      beat('{a} swings the pickaxe a little too hard. There\'s a crack, and the bone breaks in two.'),
      by('a', "It was like that! It was already broken!"),
      by('b', "It was not. Find another one."),
    ] },
    { id: 'bl.sf.bd2', when: at('dino', 'bone-dig'), turns: [
      by('b', "Is this a bone or a rock?"),
      by('a', "A rock. That's a rock. You've been brushing a rock."),
      beat('{b} looks at the rock for a long time, then puts down the brush.'),
    ] },
    { id: 'bl.sf.cb1', when: at('dino', 'carry-bones'), turns: [
      beat('Halfway to the frame, {b} trips, and an armful of ribs scatters across the ground.'),
      by('b', "I'm okay! The ribs are less okay."),
      by('a', "Pick them up. Count them. All of them."),
    ] },
    { id: 'bl.sf.cb2', when: at('dino', 'carry-bones'), turns: [
      by('a', "Where's the other leg?"),
      by('b', "I thought you had it."),
      beat('They go back to the dig to look for it.'),
    ] },
    { id: 'bl.sf.fr1', when: at('dino', 'the-frame'), turns: [
      beat('They stand back. The skeleton has its tail sticking out of its head.'),
      by('a', "That's not right."),
      by('b', "Maybe it was a weird dinosaur?"),
    ] },
    { id: 'bl.sf.fr2', when: at('dino', 'the-frame'), turns: [
      by('b', "Why are there so many leg bones?"),
      by('a', "Because those are arms. Those are tiny arms."),
      beat('They take the legs off and start again.'),
    ] },
    { id: 'bl.sf.in1', when: at('dino', 'inspection'), turns: [
      beat('The palaeontologist points at a gap in the ribs, and shakes their head. One bone is missing.'),
      by('a', "One bone! Out of all of them!"),
      by('b', "Back to the dig. Find the rib."),
    ] },
    { id: 'bl.sf.in2', when: at('dino', 'inspection'), turns: [
      by('a', "Don't touch it. Nobody touch it."),
      beat('The palaeontologist touches it. The whole skeleton folds up into a heap of bones.'),
      by('b', "We have to build it again. The whole thing."),
    ] },

    // ── the barrel ──
    { id: 'bl.sf.dg1', when: at('oil-barrel', 'digging'), turns: [
      beat('{a} digs a deep, neat hole, right down to the bedrock. There\'s nothing in it.'),
      by('a', "Empty. A whole hole of nothing."),
      by('b', "Fill it in. Pick another square."),
    ] },
    { id: 'bl.sf.dg2', when: at('oil-barrel', 'digging'), turns: [
      by('b', "Wrong square. Wrong square! The map's upside down!"),
      by('a', "Now you tell me? I'm up to my knees!"),
      beat('{a} climbs out, fills the hole back in, and moves over.'),
    ] },
    { id: 'bl.sf.dg3', when: at('oil-barrel', 'digging'), turns: [
      beat('The shovel hits something hard. {a} digs it out. It\'s a very old boot.'),
      by('a', "That's not a barrel."),
      by('b', "Next square. Leave the boot."),
    ] },
    { id: 'bl.sf.bs1', when: at('oil-barrel', 'barrel-stuck'), turns: [
      beat('{a} pulls and pulls on the barrel. It doesn\'t move an inch.'),
      by('a', "It's stuck! It's like it grew roots!"),
      by('b', "Dig round the sides more. You've only done the top."),
    ] },
    { id: 'bl.sf.bs2', when: at('oil-barrel', 'barrel-stuck'), turns: [
      by('b', "Pull! Pull!"),
      beat('The handle comes off in {a}\'s hand, and {a.sub} sits down hard in the dirt.'),
      by('a', "I've got the handle. The barrel's still in there."),
    ] },
  ],
};
