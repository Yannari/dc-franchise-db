// Rock North's challenges, stage by stage (js/rr/places/rock-north.js `stages`; director.js stageBeats).
//   the sauna        sauna-door -> the-heat -> the-melt -> timer-rings          (All-In: ten minutes, coats on)
//   the frozen river river-bank -> floe-hop -> the-gap -> far-bank-box          (All-In: both reach the far bank)
//   air guitar       backstage -> the-riff -> the-meter -> encore               (Botch or Watch: a plays, b watches)
// Stepping out of the sauna starts the ten minutes again; a tipped floe sends a racer back to the near bank; a meter that
// isn't full means waiting for the next song.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the sauna ──
    { id: 'rn.st.sd1', when: at('sauna', 'sauna-door'), turns: [
      beat('The sauna hut sits in the snow by the river, puffing steam out of every crack in the door.'),
      by('b', "We go in with our coats on? And our hats?"),
      by('a', "Everything on. Coats, hats, all of it. Ten minutes."),
    ] },
    { id: 'rn.st.sd2', when: at('sauna', 'sauna-door'), turns: [
      by('a', "It's so cold out here. This might actually be nice."),
      beat('{a} opens the door, and a wall of heat comes out and hits them both in the face.'),
      by('a', "Nope. I take it back."),
    ] },
    { id: 'rn.st.ht1', when: at('sauna', 'the-heat'), turns: [
      beat('They sit on the wooden bench in their winter coats while the stove roars and the timer on the wall counts up very, very slowly.'),
      by('b', "How long has it been?"),
      by('a', "Forty seconds."),
    ] },
    { id: 'rn.st.ht2', when: at('sauna', 'the-heat'), turns: [
      by('b', "Don't move. It's worse when you move."),
      beat('They sit perfectly still, side by side, sweating through every layer they own.'),
      by('a', "My socks are wet. How are my socks wet?"),
    ] },
    { id: 'rn.st.ht3', when: at('sauna', 'the-heat'), turns: [
      beat('Another team squeezes onto the bench beside them, and now four people in winter coats are melting together in silence.'),
      by('a', "Hi."),
      by('b', "Don't talk. Save your air."),
    ] },
    { id: 'rn.st.ml1', when: at('sauna', 'the-melt'), turns: [
      beat('Eight minutes in. {a}\'s face is bright red, {b}\'s hair is stuck flat to {b.posAdj} head, and there is a bucket at their feet.'),
      by('b', "Is that water? Pour it on me."),
      by('a', "I don't think that's water."),
    ] },
    { id: 'rn.st.ml2', when: at('sauna', 'the-melt'), turns: [
      by('a', "Two more minutes. Think about something cold."),
      by('b', "I'm trying. It's not working."),
      beat('They hold on, counting the seconds out loud together.'),
    ] },
    { id: 'rn.st.tr1', when: at('sauna', 'timer-rings'), turns: [
      beat('The timer rings. They burst out of the sauna door in a huge cloud of steam, and both of them fall face first into the snow.'),
      by('b', "Snow! Oh, that feels so good!"),
      by('a', "I'm staying here. I'm not moving."),
    ] },
    { id: 'rn.st.tr2', when: at('sauna', 'timer-rings'), turns: [
      by('a', "Ten minutes! Out! Go, go!"),
      beat('They stagger out into the cold, steaming like two baked potatoes, and the next tip is pinned to the door.'),
      by('b', "You're actually steaming."),
    ] },

    // ── the frozen river ──
    { id: 'rn.st.rb1', when: at('ice-river', 'river-bank'), turns: [
      beat('Still steaming from the sauna, they reach the river bank, where flat chunks of ice drift slowly past on the black water.'),
      by('b', "Boiling hot, then freezing. We're going to get sick."),
      by('a', "Worry about it later. Go."),
    ] },
    { id: 'rn.st.rb2', when: at('ice-river', 'river-bank'), turns: [
      by('a', "Pick the big flat ones. Not the wobbly ones."),
      beat('{a} points out a path across the floes, one big chunk of ice after another, all the way to the Don Box on the other side.'),
      by('b', "That's not a path. You're just guessing."),
    ] },
    { id: 'rn.st.fh1', when: at('ice-river', 'floe-hop'), turns: [
      beat('{a} jumps onto the first floe. It rocks, settles, and holds. {b} lands beside {a.obj} a second later.'),
      by('b', "We're on the ice! It's holding!"),
      by('a', "Don't stop. Next one."),
    ] },
    { id: 'rn.st.fh2', when: at('ice-river', 'floe-hop'), turns: [
      by('a', "Small jumps. Land soft."),
      beat('They hop across the river from floe to floe, arms out for balance, like two people crossing a room full of toys.'),
      by('b', "Okay, this is actually kind of fun."),
    ] },
    { id: 'rn.st.fh3', when: at('ice-river', 'floe-hop'), turns: [
      beat('{b} hops onto a floe so small that both {b.posAdj} feet only just fit on it.'),
      by('b', "This one's really small."),
      by('a', "Don't stop on it! Keep going!"),
    ] },
    { id: 'rn.st.gp1', when: at('ice-river', 'the-gap'), turns: [
      beat('The last floe is too far to jump to. There is nothing for it: they slide into the water and swim.'),
      by('b', "It's so cold! It's so cold!"),
      by('a', "Just swim!"),
    ] },
    { id: 'rn.st.gp2', when: at('ice-river', 'the-gap'), turns: [
      by('a', "On three, we jump in and swim. One, two..."),
      beat('They jump in on two, gasp at the cold, and swim the last gap faster than either of them has ever swum anything.'),
      by('b', "I can't feel my legs!"),
    ] },
    { id: 'rn.st.fb1', when: at('ice-river', 'far-bank-box'), turns: [
      beat('They crawl up onto the far bank, dripping and shaking, and pull the tip out of the Don Box with frozen fingers.'),
      by('b', "My fingers don't work. You open it."),
      by('a', "Mine don't either. Hang on."),
    ] },
    { id: 'rn.st.fb2', when: at('ice-river', 'far-bank-box'), turns: [
      by('a', "\"Take a cab downtown.\" A warm cab. Yes."),
      by('b', "I'm sitting right next to the heater."),
      beat('They run for the road, leaving two wet trails in the snow.'),
    ] },

    // ── air guitar ──
    { id: 'rn.st.bs1', when: at('air-guitar', 'backstage'), turns: [
      beat('Backstage, the crowd outside is roaring, and {a} is pacing up and down between the speaker boxes.'),
      by('b', "You've got this. You're a rock star."),
      by('a', "I've never even played guitar."),
      by('b', "It's air guitar. Nobody has."),
    ] },
    { id: 'rn.st.bs2', when: at('air-guitar', 'backstage'), turns: [
      by('a', "I need a rock name."),
      by('b', "Thunder. You're Thunder."),
      beat('{a} nods slowly, stands up straighter, and walks out onto the stage as Thunder.'),
    ] },
    { id: 'rn.st.rf1', when: at('air-guitar', 'the-riff'), turns: [
      beat('The music blasts out of the speakers. {a} drops to one knee, throws back {a.posAdj} head and shreds an invisible guitar like {a.posAdj} life depends on it.'),
      by('b', "Yes! Yes! Go, Thunder!"),
      beat('The crowd starts to cheer, and the appeal meter starts to climb.'),
    ] },
    { id: 'rn.st.rf2', when: at('air-guitar', 'the-riff'), turns: [
      by('b', "Use the whole stage! Run around!"),
      beat('{a} runs from one side of the stage to the other, playing a solo the whole way, and slides across the floor on {a.posAdj} knees.'),
      by('b', "Knee slide! The crowd loves a knee slide!"),
    ] },
    { id: 'rn.st.mt1', when: at('air-guitar', 'the-meter'), turns: [
      beat('The meter beside the stage is climbing: halfway, two-thirds, nearly at the top.'),
      by('b', "One more big move! Come on!"),
      beat('{a} leaps off the drum riser, lands it, and windmills the air guitar so hard that the front row ducks.'),
    ] },
    { id: 'rn.st.mt2', when: at('air-guitar', 'the-meter'), turns: [
      by('b', "Make them clap! Get them clapping!"),
      beat('{a} claps above {a.posAdj} head, and the whole crowd claps along, and the meter jumps right up.'),
      by('b', "It's working! Keep going!"),
    ] },
    { id: 'rn.st.en1', when: at('air-guitar', 'encore'), turns: [
      beat('The meter hits the top, the lights flash, and the crowd screams. {a} throws the invisible guitar into the crowd, and somebody catches it.'),
      by('a', "Thank you! You've been amazing!"),
      by('b', "Come on, Thunder. Time to go."),
    ] },
    { id: 'rn.st.en2', when: at('air-guitar', 'encore'), turns: [
      by('a', "Did you see that? Did you see them?"),
      by('b', "I saw. They loved you. Okay, let's go before it goes to your head."),
      beat('It has already gone to {a}\'s head. {a} signs an autograph on the way off the stage.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the sauna ──
    { id: 'rn.sf.ht1', when: at('sauna', 'the-heat'), turns: [
      beat('{b} lasts four minutes, then stands up, says "nope" and walks straight out of the door into the snow.'),
      by('a', "No! The timer! You've reset the timer!"),
      by('b', "I don't care! I was dying in there!"),
    ] },
    { id: 'rn.sf.ht2', when: at('sauna', 'the-heat'), turns: [
      by('a', "I'm just opening the door a little bit."),
      beat('{a} opens the door a crack, and the timer goes straight back to zero.'),
      by('b', "No! That counts!"),
    ] },
    { id: 'rn.sf.ml1', when: at('sauna', 'the-melt'), turns: [
      beat('Nine minutes in, {a} pours the bucket over {a.posAdj} head, finds out what was in it, and runs out of the sauna screaming.'),
      by('b', "Nine minutes! We were at nine minutes!"),
      by('a', "It was sweat! Everybody's sweat!"),
    ] },
    { id: 'rn.sf.ml2', when: at('sauna', 'the-melt'), turns: [
      by('b', "I'm dizzy. I need air."),
      beat('{b} stumbles outside to lie in the snow, and the ten minutes start all over again.'),
      by('a', "It's okay. Breathe. We'll do it again."),
    ] },

    // ── the frozen river ──
    { id: 'rn.sf.rb1', when: at('ice-river', 'river-bank'), turns: [
      beat('{b} puts one foot on the first floe, and it dips into the water, and {b} pulls the foot straight back.'),
      by('b', "It moved. It sank."),
      by('a', "It's ice! It's supposed to do that! Jump!"),
    ] },
    { id: 'rn.sf.rb2', when: at('ice-river', 'river-bank'), turns: [
      by('a', "Why are you just standing there?"),
      by('b', "I'm cooling down first. I don't want a heart attack."),
      beat('{b} is still standing on the bank, steaming, while another team hops past.'),
    ] },
    { id: 'rn.sf.fh1', when: at('ice-river', 'floe-hop'), turns: [
      beat('{a} lands on the edge of a floe. It tips up like a seesaw, and {a} slides straight off into the freezing river.'),
      by('a', "Aaaah! So cold!"),
      by('b', "Get out! Back to the bank!"),
    ] },
    { id: 'rn.sf.fh2', when: at('ice-river', 'floe-hop'), turns: [
      by('b', "Wait for me on that one!"),
      beat('{b} jumps onto the same floe as {a}. It is not big enough for two, and it sinks under both of them with a gentle gurgle.'),
      by('a', "Why would you jump on mine?"),
    ] },
    { id: 'rn.sf.gp1', when: at('ice-river', 'the-gap'), turns: [
      beat('{b} slides into the water to swim the last gap, gasps, and scrambles straight back out onto the ice.'),
      by('b', "I can't. I can't breathe."),
      by('a', "You can. It's the shock. Try again."),
    ] },
    { id: 'rn.sf.gp2', when: at('ice-river', 'the-gap'), turns: [
      by('a', "Swim! You're nearly there!"),
      beat('Halfway across, {b}\'s arms go stiff with the cold, and {b} has to grab a floe and haul back to the near side.'),
      by('b', "My arms won't move."),
    ] },

    // ── air guitar ──
    { id: 'rn.sf.bs1', when: at('air-guitar', 'backstage'), turns: [
      beat('{a} walks out onto the stage, sees the size of the crowd, turns round and walks straight back off again.'),
      by('b', "What are you doing? You have to go out there!"),
      by('a', "There are so many people!"),
    ] },
    { id: 'rn.sf.bs2', when: at('air-guitar', 'backstage'), turns: [
      by('a', "I need the bathroom. Right now."),
      by('b', "No you don't. You're just scared."),
      beat('The song starts without {a}, and they have to wait for the next one.'),
    ] },
    { id: 'rn.sf.rf1', when: at('air-guitar', 'the-riff'), turns: [
      beat('{a} plays the air guitar very carefully and very politely, like someone playing a cello at a wedding.'),
      beat('Somebody in the crowd boos, and then everybody boos.'),
      by('b', "Harder! Rock harder!"),
    ] },
    { id: 'rn.sf.rf2', when: at('air-guitar', 'the-riff'), turns: [
      by('b', "Do the knee slide!"),
      beat('{a} tries the knee slide, gets about half a metre, and stops dead on a sticky patch of the stage.'),
      beat('The crowd laughs, and not in a good way. The meter drops.'),
    ] },
    { id: 'rn.sf.mt1', when: at('air-guitar', 'the-meter'), turns: [
      beat('The song ends with the meter just under the top. The crowd claps politely, and nothing happens.'),
      by('a', "So close! It was so close!"),
      by('b', "Next song. Do it again, but bigger."),
    ] },
    { id: 'rn.sf.mt2', when: at('air-guitar', 'the-meter'), turns: [
      by('a', "Why is the meter going down? I'm still playing!"),
      by('b', "It's the slow bit! Do something!"),
      beat('The song runs out before the meter can climb back up again.'),
    ] },
  ],
};
