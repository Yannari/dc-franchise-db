// Savanna Falls' challenges, stage by stage (js/rr/places/savanna-falls.js `stages`; director.js stageBeats).
//   the selfie  into-raft -> the-edge -> over-falls -> the-check -> selfie-tip           (All-In: both in the raft, both in the shot)
//   the rhino   the-ranger -> creep-up -> rhino-pose -> the-photo -> rhino-tip           (Botch or Watch: a poses, b shoots)
// A bad selfie means hauling the raft back up the path and going over again; a rhino that charges sends the poser running.
// The ranger is the place's own local (the avatar stands there: js/vp-rr-ep/locals.js).
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the selfie ──
    { id: 'sf.st.ir1', when: at('falls-selfie', 'into-raft'), turns: [
      beat('Upriver, a little yellow raft bobs at the bank. Somewhere ahead, out of sight, there is a very loud roaring sound.'),
      by('b', "What's that noise?"),
      by('a', "That's the waterfall. The one we're going over."),
    ] },
    { id: 'sf.st.ir2', when: at('falls-selfie', 'into-raft'), turns: [
      by('a', "You hold the camera. I'll hold you."),
      by('b', "Who's holding the paddle?"),
      beat('Nobody is holding the paddle. They push off into the current anyway.'),
    ] },
    { id: 'sf.st.ed1', when: at('falls-selfie', 'the-edge'), turns: [
      beat('The current grabs the raft and pulls it faster and faster towards the place where the river simply stops.'),
      by('b', "Get the camera ready!"),
      by('a', "Get both of us in!"),
    ] },
    { id: 'sf.st.ed2', when: at('falls-selfie', 'the-edge'), turns: [
      by('a', "Keep it straight! Front first!"),
      beat('{a} paddles hard on one side, and the raft swings round so it\'s pointing straight at the edge.'),
      by('b', "I don't know if that's better!"),
    ] },
    { id: 'sf.st.of1', when: at('falls-selfie', 'over-falls'), turns: [
      beat('The raft tips over the edge, and for one long second they are falling through the spray, and {b} holds the camera out at arm\'s length and presses the button.'),
      by('a', "Smiiiiiiile!"),
      by('b', "Aaaaaaaah!"),
    ] },
    { id: 'sf.st.of2', when: at('falls-selfie', 'over-falls'), turns: [
      by('b', "Squeeze in! Squeeze in!"),
      beat('They squeeze their faces together, cheek to cheek, mouths wide open, as the raft drops down the face of the falls.'),
      beat('Click.'),
    ] },
    { id: 'sf.st.ch1', when: at('falls-selfie', 'the-check'), turns: [
      beat('At the bottom, a crew member pulls the raft in, takes the camera, and looks at the picture for a long time.'),
      by('a', "Well? Are we in it?"),
      beat('The crew member turns the screen round. Two faces, mid-scream, perfectly in focus, and a rainbow behind them.'),
    ] },
    { id: 'sf.st.ch2', when: at('falls-selfie', 'the-check'), turns: [
      by('b', "Is it good? Please say it's good."),
      beat('The crew member nods and shows them the photo. {b}\'s eyes are shut and {a} looks like a startled fish, but both faces are there.'),
      by('a', "It's perfect. I'm framing this."),
    ] },
    { id: 'sf.st.st1', when: at('falls-selfie', 'selfie-tip'), turns: [
      by('b', "\"Take a photo with a white rhino.\" A rhino! A real one?"),
      by('a', "I really hope it's a friendly one."),
      beat('They wring out their clothes and run for the national park.'),
    ] },
    { id: 'sf.st.st2', when: at('falls-selfie', 'selfie-tip'), turns: [
      beat('They climb out of the basin, soaked to the skin and grinning, and the crew hands over the tip.'),
      by('a', "Can we keep the photo?"),
      by('b', "We're keeping it. That's going on my wall."),
    ] },

    // ── the rhino ──
    { id: 'sf.st.rg1', when: at('rhino', 'the-ranger'), turns: [
      beat('At the edge of the waterhole, the ranger stops them at a rope and points: a huge white rhino is grazing on the far side, flicking its ears.'),
      by('b', "You go up to it. I'll take the picture from here."),
      by('a', "Why do I always get the dangerous part?"),
    ] },
    { id: 'sf.st.rg2', when: at('rhino', 'the-ranger'), turns: [
      by('a', "What do I do if it charges?"),
      beat('The ranger thinks about it for a second, and then mimes running away, very fast.'),
      by('a', "Great. Thanks. Really helpful."),
    ] },
    { id: 'sf.st.cu1', when: at('rhino', 'creep-up'), turns: [
      beat('{a} creeps through the long yellow grass, bent double, one slow step at a time.'),
      by('b', "Closer! You're tiny!"),
      by('a', "I'm close enough!"),
    ] },
    { id: 'sf.st.cu2', when: at('rhino', 'creep-up'), turns: [
      by('a', "Hi. Hi, big guy. Easy."),
      beat('The rhino lifts its head, chews, looks at {a}, and goes back to eating. {a} takes another step.'),
      by('b', "I think it likes you!"),
    ] },
    { id: 'sf.st.rp1', when: at('rhino', 'rhino-pose'), turns: [
      beat('{a} stands beside the rhino, as close as {a.sub} dares, and holds up two fingers in a peace sign.'),
      by('b', "Smile! Look like you're having fun!"),
      by('a', "I'm next to a rhino! This is the scariest thing I've ever done!"),
    ] },
    { id: 'sf.st.rp2', when: at('rhino', 'rhino-pose'), turns: [
      by('b', "Put your arm round it!"),
      by('a', "I'm not touching it! It's the size of a car!"),
      beat('{a} pats the air very near the rhino instead, which counts as a hug from a distance.'),
    ] },
    { id: 'sf.st.ph1', when: at('rhino', 'the-photo'), turns: [
      beat('{b} lifts the camera, frames the shot, and clicks: {a} with a terrified smile, and the rhino behind with a mouthful of grass.'),
      by('b', "Got it! Both of you! It's perfect!"),
      by('a', "Can I walk away now? Slowly?"),
    ] },
    { id: 'sf.st.ph2', when: at('rhino', 'the-photo'), turns: [
      by('b', "Okay, smile! Three, two, one!"),
      beat('The camera flashes. The rhino blinks. {a} grins. All three of them are in the picture.'),
      by('a', "Did you get it? I think it smiled."),
    ] },
    { id: 'sf.st.rt1', when: at('rhino', 'rhino-tip'), turns: [
      beat('The ranger looks at the photo, laughs, and hands over the tip.'),
      by('a', "I was this close to a rhino."),
      by('b', "It's the best picture I've ever taken of you."),
    ] },
    { id: 'sf.st.rt2', when: at('rhino', 'rhino-tip'), turns: [
      by('b', "\"Run to the Chill Zone in the village.\" Run! Let's go!"),
      by('a', "Quietly. I don't want it following us."),
      beat('They tiptoe away from the waterhole, and then they run.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the selfie ──
    { id: 'sf.sf.ed1', when: at('falls-selfie', 'the-edge'), turns: [
      beat('The raft hits a rock, spins round, and goes towards the edge backwards.'),
      by('b', "We're backwards! We can't see where we're going!"),
      by('a', "Turn us round! Paddle!"),
    ] },
    { id: 'sf.sf.ed2', when: at('falls-selfie', 'the-edge'), turns: [
      by('a', "Paddle! Left side!"),
      beat('They both paddle on the left side, which makes the raft go round and round in a little circle.'),
      by('b', "We're just going round in circles!"),
    ] },
    { id: 'sf.sf.of1', when: at('falls-selfie', 'over-falls'), turns: [
      beat('Halfway down the falls, {b} presses the button, and the camera takes a perfect picture of the inside of {b}\'s thumb.'),
      by('a', "Did you get it?"),
      by('b', "I got my thumb. We have to go again."),
    ] },
    { id: 'sf.sf.of2', when: at('falls-selfie', 'over-falls'), turns: [
      by('b', "Now! Now! Smile now!"),
      beat('{b} takes the picture, but the spray is so thick that the photo is just white mist with one eyebrow in it.'),
      by('a', "Back up the path. We're going again."),
    ] },
    { id: 'sf.sf.ch1', when: at('falls-selfie', 'the-check'), turns: [
      beat('The crew member looks at the photo and shakes their head. It shows {b}\'s face, perfectly, and a little bit of {a}\'s ear.'),
      by('a', "My ear's in it! That's me!"),
      beat('An ear is not a face. They carry the raft all the way back up the path.'),
    ] },
    { id: 'sf.sf.ch2', when: at('falls-selfie', 'the-check'), turns: [
      by('b', "Where's the camera?"),
      by('a', "You had the camera."),
      beat('The camera is floating away down the river. They have to fish it out and go over the falls again.'),
    ] },

    // ── the rhino ──
    { id: 'sf.sf.cu1', when: at('rhino', 'creep-up'), turns: [
      beat('{a} steps on a dry stick. It cracks like a gunshot. The rhino\'s head comes up, and it snorts.'),
      by('b', "Freeze! Don't move!"),
      beat('{a} is a tree for a full minute before the rhino goes back to eating, then has to start creeping all over again.'),
    ] },
    { id: 'sf.sf.cu2', when: at('rhino', 'creep-up'), turns: [
      by('a', "Here, rhino. Come here."),
      by('b', "Don't call it over! It's not a dog!"),
      beat('The rhino snorts and turns to face {a}, and {a} backs off all the way to the rope.'),
    ] },
    { id: 'sf.sf.rp1', when: at('rhino', 'rhino-pose'), turns: [
      beat('{a} stands next to the rhino and smiles. The rhino lowers its head, scrapes the ground with one foot, and charges.'),
      by('b', "Run! Run! Run!"),
      by('a', "I'm running!"),
    ] },
    { id: 'sf.sf.rp2', when: at('rhino', 'rhino-pose'), turns: [
      by('a', "Ugh. It really smells."),
      beat('The rhino understands tone, if not words. It snorts, and comes at {a} at a thundering trot.'),
      by('b', "Say sorry! Run!"),
    ] },
    { id: 'sf.sf.ph1', when: at('rhino', 'the-photo'), turns: [
      beat('{b} takes the picture. {a} is in it, smiling. The rhino has wandered off and is just a grey bottom at the edge of the frame.'),
      by('b', "Does a bottom count?"),
      by('a', "No. Wait for it to turn round."),
    ] },
    { id: 'sf.sf.ph2', when: at('rhino', 'the-photo'), turns: [
      by('a', "Did you get us both?"),
      beat('{b} looks at the screen. {b} has taken a lovely picture of a rhino, and of {a}\'s shoes.'),
      by('b', "I got your feet. And its bum."),
    ] },
  ],
};
