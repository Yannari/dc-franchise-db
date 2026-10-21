// Pampas Ranch's challenges, stage by stage (js/rr/places/pampas-ranch.js `stages`; director.js stageBeats).
//   the dance  lesson -> practice -> routine -> verdict          (All-In: both dance; the instructor judges)
//   the emu    bolas -> ride-out -> throw -> lead-back            (Botch or Watch: a rides out, b watches at the fence)
// The instructor and the rancher are the place's own locals (their avatars stand there: js/vp-rr-ep/locals.js).
import { V } from '../places/_kit.js';

const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the dance ──
    { id: 'pmp.st.ls1', when: at('tango', 'lesson'), turns: [
      beat('The instructor walks across the academy floor without a sound, takes a rose from between his teeth, and points it at {a}.'),
      by('a', "Me? What did I do?"),
      by('b', "I think that means you lead."),
      beat('He shows them the steps once: slow, slow, quick-quick, turn, and a dip so low his hair touches the floor.'),
      by('a', "Once? We get to see it once?"),
    ] },
    { id: 'pmp.st.ls2', when: at('tango', 'lesson'), turns: [
      beat('The gramophone crackles. The instructor claps twice, sharply, and the lesson begins.'),
      by('b', "Chest up. Chin up. Look like you hate me."),
      by('a', "That's easy. You stepped on my foot in the taxi."),
      by('b', "Perfect. Use that."),
    ] },
    { id: 'pmp.st.ls3', when: at('tango', 'lesson'), turns: [
      by('a', "It's basically just walking, right?"),
      beat('The instructor demonstrates. It is not walking. It is something legs are not usually asked to do.'),
      by('b', "That's not walking."),
      by('a', "Okay. Angry walking."),
    ] },
    { id: 'pmp.st.pr1', when: at('tango', 'practice'), turns: [
      beat('At the barre in front of the mirrors, {a} and {b} practise the steps over and over, counting under their breath.'),
      by('a', "Slow, slow, quick-quick..."),
      by('b', "...turn. And we didn't fall over."),
      by('a', "We didn't fall over! That's a first!"),
    ] },
    { id: 'pmp.st.pr2', when: at('tango', 'practice'), turns: [
      by('b', "Watch the mirror. We look good. We actually look good."),
      by('a', "We look like two people trying not to look at their feet."),
      beat('{a} looks at their feet. {b} gently lifts {a}\'s chin.'),
      by('b', "Eyes on me. Feet will follow."),
    ] },
    { id: 'pmp.st.pr3', when: at('tango', 'practice'), turns: [
      beat('Across the room, another team is practising too. {a} and {b} watch them in the mirror and speed up, just a little.'),
      by('a', "We're better than them."),
      by('b', "Don't say that. Dance it."),
    ] },
    { id: 'pmp.st.rt1', when: at('tango', 'routine'), turns: [
      beat('The music starts. {a} and {b} cross the floor in a close embrace, faces fierce, every step sharp.'),
      by('a', "Turn."),
      by('b', "Turning."),
      beat('The turn is clean. The leg flick is clean. The dip goes low, and comes back up again, which is the important part.'),
    ] },
    { id: 'pmp.st.rt2', when: at('tango', 'routine'), turns: [
      by('b', "Whatever happens, don't stop."),
      beat('Something happens: {a} forgets a whole bar. They don\'t stop. They improvise a dramatic stare that lasts exactly as long.'),
      by('a', "Was that in it?"),
      by('b', "It is now."),
    ] },
    { id: 'pmp.st.rt3', when: at('tango', 'routine'), turns: [
      beat('{a} and {b} dance the routine all the way through, nose to nose, and finish on the dip, frozen, breathing hard.'),
      by('a', "Is he clapping? I can't see him. I'm upside down."),
      by('b', "Hold the dip. Don't move until he claps."),
    ] },
    { id: 'pmp.st.vd1', when: at('tango', 'verdict'), turns: [
      beat('Silence. The instructor walks slowly round them, twice. Then he claps, once, and hands over the tip.'),
      by('b', "One clap. Is one clap good?"),
      by('a', "One clap is a tip. One clap is perfect."),
    ] },
    { id: 'pmp.st.vd2', when: at('tango', 'verdict'), turns: [
      beat('The instructor takes the rose from his teeth and gives it to {b}.'),
      by('b', "For me? Thank you!"),
      beat('He takes it back and gives them the tip instead.'),
      by('a', "That's fair. The tip's more useful."),
    ] },
    { id: 'pmp.st.vd3', when: at('tango', 'verdict'), turns: [
      beat('The instructor nods, very slightly, and something in his face nearly becomes a smile.'),
      by('a', "Did you see that? He almost smiled."),
      by('b', "That's as close as he gets. Take the tip. Let's go."),
    ] },
    // ── the emu ──
    { id: 'pmp.st.bl1', when: at('emu', 'bolas'), turns: [
      beat('The rancher hands {a} the boleadoras: three leather balls on long cords, knotted in the middle.'),
      by('a', "So I spin it, and throw it, and it wraps round its legs."),
      by('b', "Gently. Wraps round its legs gently."),
      beat('{a} gives it a practice spin. It whistles. The horses at the fence all take a step back.'),
    ] },
    { id: 'pmp.st.bl2', when: at('emu', 'bolas'), turns: [
      by('b', "You've done this before, right?"),
      by('a', "No. But how hard can it be?"),
      beat('{a} spins the bolas over their head, slowly at first, then faster, and doesn\'t let go of it. Progress.'),
    ] },
    { id: 'pmp.st.bl3', when: at('emu', 'bolas'), turns: [
      beat('The rancher shows {a} the throw once, wraps a fence post in one smooth swing, and walks off.'),
      by('a', "He made it look easy."),
      by('b', "He's been doing this for forty years."),
    ] },
    { id: 'pmp.st.ro1', when: at('emu', 'ride-out'), turns: [
      beat('{a} climbs onto the horse, which turns its head and looks at {a} with deep suspicion.'),
      by('b', "It likes you! I think it likes you!"),
      by('a', "It does not like me."),
      beat('The horse sets off across the grass at a trot, and {a} holds on with everything.'),
    ] },
    { id: 'pmp.st.ro2', when: at('emu', 'ride-out'), turns: [
      beat('Out on the plain, the emu stands in the long grass, chewing, watching {a} ride towards it.'),
      by('b', "Go slow! Don't scare it!"),
      by('a', "I'm not scaring it! It's scaring me!"),
    ] },
    { id: 'pmp.st.ro3', when: at('emu', 'ride-out'), turns: [
      by('b', "You're riding! You're actually riding!"),
      by('a', "The horse is doing all of it! I'm just holding on!"),
      beat('{a} and the horse thunder across the grass towards the emu, which starts to run.'),
    ] },
    { id: 'pmp.st.th1', when: at('emu', 'throw'), turns: [
      beat('{a} spins the bolas, once, twice, and lets go. The cords wrap round the emu\'s legs, and it sits down in the grass, offended.'),
      by('b', "You got it! You got the emu!"),
      by('a', "Sorry, emu. It's nothing personal."),
    ] },
    { id: 'pmp.st.th2', when: at('emu', 'throw'), turns: [
      by('b', "Now! Throw it now!"),
      beat('{a} throws. The bolas sail through the air and tangle neatly round both legs.'),
      by('a', "Did you see that? Did everybody see that?"),
      by('b', "The whole fence saw that!"),
    ] },
    { id: 'pmp.st.th3', when: at('emu', 'throw'), turns: [
      beat('{a} leans out of the saddle and throws. It\'s a perfect throw. Even the rancher nods.'),
      by('a', "Who knew I was good at catching birds?"),
      by('b', "Not me."),
    ] },
    { id: 'pmp.st.lb1', when: at('emu', 'lead-back'), turns: [
      beat('{a} leads the emu back to the fence on a rope. It walks beside the horse like it planned the whole thing.'),
      by('b', "It's so tall! Why is it so tall?"),
      by('a', "Don't make eye contact. It knows what I did."),
    ] },
    { id: 'pmp.st.lb2', when: at('emu', 'lead-back'), turns: [
      by('b', "Bring it here! Bring it to the rancher!"),
      beat('The rancher looks at the emu, looks at {a}, and hands over the tip.'),
      by('a', "That's it? He just nods?"),
      by('b', "That's a big nod round here."),
    ] },
    { id: 'pmp.st.lb3', when: at('emu', 'lead-back'), turns: [
      beat('The emu leans over and pecks {b} on the hat as {a} hands over the rope.'),
      by('b', "Why me? I didn't throw anything!"),
      by('a', "It doesn't know that. It just knows you're here."),
    ] },
  ],

  'task-stage.fail': [
    // ── the dance ──
    { id: 'pmp.sf.pr1', when: at('tango', 'practice'), turns: [
      beat('Quick-quick turns into quick-quick-ow. {a} has stepped on {b}\'s foot for the fourth time.'),
      by('b', "Same foot! Every time, the same foot!"),
      by('a', "It's right there! It's always right there!"),
      beat('The instructor taps the floor with his cane. Back to the barre. From the beginning.'),
    ] },
    { id: 'pmp.sf.pr2', when: at('tango', 'practice'), turns: [
      beat('{a} and {b} try the turn at full speed and go round one and a half times instead of once.'),
      beat('They end up facing the mirror, then each other, then the floor, in that order.'),
      by('b', "We turned too much."),
      by('a', "We were feeling it."),
    ] },
    { id: 'pmp.sf.pr3', when: at('tango', 'practice'), turns: [
      by('a', "I can't do the leg flick. My leg won't do it."),
      by('b', "Just kick a bit. Kick softly."),
      beat('{a} kicks softly. It still knocks over the instructor\'s little table. The gramophone stops.'),
    ] },
    { id: 'pmp.sf.rt1', when: at('tango', 'routine'), turns: [
      beat('Everything goes right until the dip. {b} dips. {a} doesn\'t hold. {b} ends up on the floor, looking at the ceiling.'),
      by('b', "You let go!"),
      by('a', "You were heavier than in practice!"),
      beat('The instructor stops the music. More lessons.'),
    ] },
    { id: 'pmp.sf.rt2', when: at('tango', 'routine'), turns: [
      beat('Halfway through the routine, {a} and {b} start doing completely different dances, both of them with total confidence.'),
      by('b', "What are you doing?"),
      by('a', "The routine! What are YOU doing?"),
      beat('The instructor lifts the needle off the record. Silence. They go back to the barre.'),
    ] },
    { id: 'pmp.sf.rt3', when: at('tango', 'routine'), turns: [
      beat('{a} gets the giggles in the close embrace. Then {b} gets them. They dance the rest of the routine shaking.'),
      by('a', "Stop laughing. He's watching."),
      by('b', "I can't stop. Your face is so serious."),
      beat('The instructor does not laugh. He points at the barre.'),
    ] },
    // ── the emu ──
    { id: 'pmp.sf.bl1', when: at('emu', 'bolas'), turns: [
      beat('{a} spins the bolas for a practice throw. The cords wrap round {a}\'s own legs, neatly, and {a} sits down in the grass.'),
      by('b', "You caught yourself!"),
      by('a', "I know! I tripped over the rope!"),
    ] },
    { id: 'pmp.sf.bl2', when: at('emu', 'bolas'), turns: [
      by('b', "Careful, careful..."),
      beat('{a} lets go too early. The bolas fly backwards over the fence and land in the rancher\'s hat.'),
      by('a', "Does that count?"),
      beat('The rancher hands them back without a word.'),
    ] },
    { id: 'pmp.sf.ro1', when: at('emu', 'ride-out'), turns: [
      beat('The horse stops dead at the edge of the long grass. {a} doesn\'t. {a} goes over its head into the grass.'),
      by('b', "Are you okay?"),
      by('a', "The horse is fine! I'm in a bush!"),
      beat('{a} walks the horse back to the fence to start again.'),
    ] },
    { id: 'pmp.sf.ro2', when: at('emu', 'ride-out'), turns: [
      by('b', "Left! The emu went left!"),
      beat('{a} pulls left. The horse goes right, all the way back to the fence, and stops by the water trough.'),
      by('a', "I think the horse is on a break."),
    ] },
    { id: 'pmp.sf.th1', when: at('emu', 'throw'), turns: [
      beat('{a} throws. The bolas miss the emu by a mile and wrap round a fence post instead.'),
      by('b', "You caught a post!"),
      by('a', "It was standing still! It looked like an emu!"),
      beat('{a} rides back for the ropes. The emu watches, chewing.'),
    ] },
    { id: 'pmp.sf.th2', when: at('emu', 'throw'), turns: [
      by('b', "Throw it! Throw it now!"),
      beat('{a} throws a little too hard. The bolas land in the long grass and tangle into one big knot.'),
      by('a', "Is that bad?"),
      by('b', "That's a bird's nest. You made a bird's nest."),
      beat('{a} rides back to untangle them and start again.'),
    ] },
    { id: 'pmp.sf.th3', when: at('emu', 'throw'), turns: [
      beat('The emu runs in a perfect circle round {a}\'s horse while {a} spins the bolas, waiting for a clean throw.'),
      by('a', "It won't stop moving!"),
      by('b', "It's an emu! That's what they do!"),
      beat('{a} throws at the wrong moment. Miss. Back for the ropes.'),
    ] },
    { id: 'pmp.sf.lb1', when: at('emu', 'lead-back'), turns: [
      beat('Halfway back, the emu shakes off the cords, gives {a} a look, and sprints off across the plain.'),
      by('b', "It's escaping! Your emu is escaping!"),
      by('a', "It doesn't want to come!"),
      beat('{a} rides after it to catch it all over again.'),
    ] },
    { id: 'pmp.sf.lb2', when: at('emu', 'lead-back'), turns: [
      by('a', "Come on. Nice and slow. Good emu."),
      beat('The emu sits down in the grass and refuses to move another step.'),
      by('b', "Talk to it! Be nice!"),
      by('a', "I've been nice! I've been nice for ten minutes!"),
    ] },
  ],
};
