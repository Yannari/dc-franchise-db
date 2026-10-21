// Secret Base Desert's challenges, stage by stage (js/rr/places/secret-base-desert.js `stages`; director.js stageBeats).
//   sneak in      off-the-road -> searchlights -> the-fence -> hangar-door          (All-In: both, unseen)
//   the artifact  the-hangar -> the-crates -> lift-it -> past-guards -> the-agent   (All-In: find it, carry it out)
// Being spotted or touching the fence means being marched back to the road; a dropped artifact or getting caught on the
// way out means putting it back. The agent in dark glasses is the place's own local.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── sneak in ──
    { id: 'sbd.st.or1', when: at('sneak-in', 'off-the-road'), turns: [
      beat('They leave the road and crouch in the dark. Ahead, past a field of warning signs, the base glows behind its fence.'),
      by('b', "Every sign says keep out. In big letters."),
      by('a', "Then we'll be very quiet about it."),
    ] },
    { id: 'sbd.st.or2', when: at('sneak-in', 'off-the-road'), turns: [
      by('a', "Stay low. Move when I move."),
      by('b', "Why are you whispering? There's nobody here."),
      by('a', "That's what they want you to think."),
    ] },
    { id: 'sbd.st.sl1', when: at('sneak-in', 'searchlights'), turns: [
      beat('A searchlight sweeps slowly across the sand. They flatten themselves behind a sign until it passes.'),
      by('b', "Now. Go, go."),
      beat('They scuttle forward, then drop flat again as the light swings back.'),
    ] },
    { id: 'sbd.st.sl2', when: at('sneak-in', 'searchlights'), turns: [
      by('a', "There's a soldier. Walking this way."),
      by('b', "Don't move. Don't breathe."),
      beat('The soldier walks right past them, looks the other way, and keeps going.'),
    ] },
    { id: 'sbd.st.fn1', when: at('sneak-in', 'the-fence'), turns: [
      beat('The fence hums. There\'s a gap at the bottom, just big enough to crawl through.'),
      by('a', "Don't touch the wire. Not even a little."),
      by('b', "I'm not touching anything. I'm the flattest I've ever been."),
    ] },
    { id: 'sbd.st.fn2', when: at('sneak-in', 'the-fence'), turns: [
      by('b', "You first. I'll hold up the bottom of it."),
      by('a', "Don't hold anything! It buzzes!"),
      beat('They wriggle under the fence one at a time, without touching it.'),
    ] },
    { id: 'sbd.st.hd1', when: at('sneak-in', 'hangar-door'), turns: [
      beat('They reach the hangar door and press their backs against the cold metal wall.'),
      by('b', "We made it. Nobody saw us."),
      by('a', "Tip's taped to the keypad. Grab it."),
    ] },
    { id: 'sbd.st.hd2', when: at('sneak-in', 'hangar-door'), turns: [
      by('a', "We're spies. We're actual spies now."),
      by('b', "Spies don't say that out loud."),
      beat('{a} peels the tip off the keypad, and they slip inside.'),
    ] },

    // ── the artifact ──
    { id: 'sbd.st.hg1', when: at('artifact', 'the-hangar'), turns: [
      beat('Inside, the hangar is full of crates, strange machines and lumpy things hidden under sheets.'),
      by('b', "An alien artifact. In here somewhere."),
      by('a', "It glows, the tip says. Look for something glowing."),
    ] },
    { id: 'sbd.st.hg2', when: at('artifact', 'the-hangar'), turns: [
      by('a', "What's under that sheet?"),
      by('b', "I don't want to know. I really don't."),
      beat('They start lifting sheets anyway.'),
    ] },
    { id: 'sbd.st.cr1', when: at('artifact', 'the-crates'), turns: [
      beat('{a} prises the lid off a crate, and a soft green glow spills out over {a.posAdj} face.'),
      by('a', "Found it. It's in here."),
      by('b', "Is it safe to touch?"),
    ] },
    { id: 'sbd.st.cr2', when: at('artifact', 'the-crates'), turns: [
      by('b', "This one's humming. Listen."),
      beat('They lean an ear against the crate. Something inside it hums.'),
      by('a', "That's it. Open it."),
    ] },
    { id: 'sbd.st.lf1', when: at('artifact', 'lift-it'), turns: [
      beat('They lift the artifact out together. It\'s heavy, smooth and warm, and it glows brighter when they touch it.'),
      by('b', "It likes us."),
      by('a', "Don't drop it. Whatever it is, don't drop it."),
    ] },
    { id: 'sbd.st.lf2', when: at('artifact', 'lift-it'), turns: [
      by('a', "One end each. On three."),
      beat('They lift it out of the crate and hold it between them like a very precious, very strange cake.'),
      by('b', "Okay. Got it. Walk slowly."),
    ] },
    { id: 'sbd.st.pg1', when: at('artifact', 'past-guards'), turns: [
      beat('They carry the glowing artifact back across the base, ducking behind a jeep as a soldier walks past.'),
      by('b', "It's glowing! They'll see it glowing!"),
      by('a', "Put your coat over it. Quick."),
    ] },
    { id: 'sbd.st.pg2', when: at('artifact', 'past-guards'), turns: [
      by('a', "Slowly. Don't trip."),
      beat('Step by step, they creep back to the fence with the artifact between them.'),
      by('b', "Nearly there. I can see the fence."),
    ] },
    { id: 'sbd.st.ag1', when: at('artifact', 'the-agent'), turns: [
      beat('At the fence, an agent in dark glasses takes the artifact, looks it over for scratches, and nods.'),
      by('b', "Not a scratch. We were so careful."),
      by('a', "What is it, though? What does it do?"),
      beat('The agent says nothing, hands over the tip, and walks away.'),
    ] },
    { id: 'sbd.st.ag2', when: at('artifact', 'the-agent'), turns: [
      by('a', "Tip! Chill Zone's out in the desert."),
      by('b', "I'm never going to know what that thing was."),
      beat('They run off into the dark desert.'),
    ] },
  ],

  'task-stage.fail': [
    // ── sneak in ──
    { id: 'sbd.sf.sl1', when: at('sneak-in', 'searchlights'), turns: [
      beat('The searchlight swings round and lands right on them. A whistle blows.'),
      by('b', "We've been spotted!"),
      beat('A soldier marches them all the way back out to the road.'),
    ] },
    { id: 'sbd.sf.sl2', when: at('sneak-in', 'searchlights'), turns: [
      by('a', "Wait for the light to pass."),
      beat('{b} doesn\'t wait, runs straight into the beam, and freezes like a rabbit.'),
      by('b', "Sorry! I thought it had gone!"),
    ] },
    { id: 'sbd.sf.fn1', when: at('sneak-in', 'the-fence'), turns: [
      beat('{a}\'s backpack catches the wire. There\'s a loud buzz, and an alarm starts wailing across the base.'),
      by('a', "That wasn't me! That was my bag!"),
      by('b', "Run! Back to the road!"),
    ] },
    { id: 'sbd.sf.fn2', when: at('sneak-in', 'the-fence'), turns: [
      by('b', "Is it actually electric?"),
      beat('{b} touches it, just to check. It is.'),
      by('a', "Why would you touch it? Why?"),
    ] },

    // ── the artifact ──
    { id: 'sbd.sf.cr1', when: at('artifact', 'the-crates'), turns: [
      beat('They open a crate, then another, then another. Packing straw. Old boots. A box of forks.'),
      by('b', "Forks. Why would a secret base need forks?"),
      by('a', "Keep looking. It glows. Look for the glow."),
    ] },
    { id: 'sbd.sf.cr2', when: at('artifact', 'the-crates'), turns: [
      by('a', "This one's glowing!"),
      beat('It\'s a lamp. Somebody left a lamp on in the crate.'),
      by('b', "Next crate."),
    ] },
    { id: 'sbd.sf.lf1', when: at('artifact', 'lift-it'), turns: [
      beat('The artifact slips out of {b}\'s hands and hits the floor with a heavy thud. It flickers, and the glow goes dim.'),
      by('b', "Is it broken? Did I break it?"),
      by('a', "Put it back. We'll have to try again."),
    ] },
    { id: 'sbd.sf.lf2', when: at('artifact', 'lift-it'), turns: [
      by('a', "It's so heavy! Why is it so heavy?"),
      beat('They lift it halfway out, and it slides back into the crate.'),
      by('b', "Lift with your legs! Not your back!"),
    ] },
    { id: 'sbd.sf.pg1', when: at('artifact', 'past-guards'), turns: [
      beat('A soldier steps out from behind a jeep right in front of them, and looks straight at the glowing artifact.'),
      by('a', "It's a lamp. We're just moving a lamp."),
      beat('The soldier is not convinced. They have to take it back to the hangar.'),
    ] },
    { id: 'sbd.sf.pg2', when: at('artifact', 'past-guards'), turns: [
      by('b', "Duck!"),
      beat('They duck, the artifact bumps the jeep, and a car alarm goes off.'),
      by('a', "Back. Back to the hangar. Quick."),
    ] },
  ],
};
