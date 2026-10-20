// Fjord Peaks' own lines (js/rr/places/fjord-peaks.js), 1:1 with the real leg ("Maori or Less"), in our own words:
//   the train      to the junction: sheep on the line.
//   jump / dance   Either/Or: bungee off the gorge bridge and snatch a fish out of the river at the bottom, or learn the
//                  islanders' challenge dance (stamps, chants, faces) and perform it for the elders.
// Gated on place / taskId / side / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'fjord-peaks' };
const JD = { taskId: 'jump-dance' };
const JU = { taskId: 'jump-dance', side: 'jump' };
const DA = { taskId: 'jump-dance', side: 'dance' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'fjp.op1', when: P, turns: [
      beat('Don stands on a mountainside above a deep blue fjord, wind whipping his hair, a sheep chewing grass right beside him.'),
      don("Welcome to Fjord Peaks! Mountains, lakes, waterfalls, and more sheep than people. Thirty to one. I counted. It took a while."),
      don("Today, teams either throw themselves off a bridge, or learn to dance. Both are terrifying. One is more terrifying for me to watch."),
      beat('The sheep bleats loudly in his ear. Don closes his eyes and waits for it to finish.'),
    ] },
    { id: 'fjp.op2', when: P, turns: [
      don("Fjord Peaks. Every single view here looks like a film about wizards. I keep expecting a tiny man with a ring."),
      don("Racers, the train to the junction leaves from the station. Don't miss it. The next one is tomorrow."),
      beat('A train whistle sounds far below. Don checks his watch, then waves them off with both hands.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'fjp.op3', when: P, turns: [
      beat('Don is sitting on a rock by the lake, feeding bread to a duck, a flask of hot chocolate beside him.'),
      don("Fjord Peaks. It's very peaceful. Please don't ruin it. Train's at the station."),
      don("The duck and I will be here. Go on."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'fjp.ar1', when: P, turns: [
      beat('The train winds round the side of a mountain, and below them a fjord opens up, deep blue between green cliffs.'),
      by('a', "Look at that. That can't be real. That's a painting."),
      by('b', "There's a waterfall coming off the cliff. Straight into the sea."),
      by('a', "I'm going to live here. I've decided."),
    ] },
    { id: 'fjp.ar2', when: P, turns: [
      by('b', "Every hill has sheep on it. Every single hill."),
      by('a', "Every hill, and every road, and that one's on the platform."),
      by('b', "Is it getting on the train?"),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'fjp.ad1', when: P, turns: [
      by('a', "It says 'bridge'. And 'bungee'. And 'gorge'."),
      by('b', "Or 'dance'. It also says 'dance'."),
      by('a', "Both of those sound bad for different reasons."),
    ] },
    { id: 'fjp.ad2', when: P, turns: [
      beat('The wind comes off the mountain so cold and sudden that {a} staggers sideways.'),
      by('a', "Where did that come from? It was sunny a minute ago!"),
      by('b', "It's still sunny. It's sunny and freezing."),
    ] },
  ],
};

// ── the train (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'fjp.tm1', when: { taskId: 'junction-train', mishap: 'sheep-on-the-line' }, turns: [
      beat('The train brakes with a long squeal and stops in the middle of a valley. A flock of sheep is standing on the tracks.'),
      by('a', "Sheep. We're stopped for sheep."),
      by('b', "There must be two hundred of them. They're not moving."),
      beat('Twenty minutes, one farmer and one very busy dog later, the line is clear.'),
    ] },
  ],
};

// ── jump down or jump around (Either/Or) ──
const gorge = {
  'don-demo.gag': [
    { id: 'fjp.jd-d1', when: JD, turns: [
      don("In this Either/Or, Jump Down: one of you bungee jumps off this bridge and grabs a fish out of the river at the bottom. With your hands. Before the cord pulls you back up."),
      beat('He looks over the railing at the river, very far below, and steps back from the edge.'),
      don("Or Jump Around: learn the islanders' traditional challenge dance and perform it for the elders. Stamping, chanting, and the faces. Especially the faces."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'fjp.jd-d2', when: JD, turns: [
      don("Come up without a fish, and you jump again. A dance the elders won't accept, and you practise again. You may switch sides."),
      don("A fish in hand, or a nod from the elders, gets you the next tip. The fish does not get a tip. The fish goes back."),
      beat('Behind him, the elders stand in a line, arms folded, watching a dance rehearsal with no expression at all.'),
    ] },
  ],
  'decide-side.agree': [
    { id: 'fjp.jd-c1', when: JD, turns: [
      by('a', "Jump. One jump, one fish, done. Fastest way."),
      by('b', "You'd jump off a bridge for a fish?"),
      by('a', "I'd jump off a bridge for the money. The fish is just in the way."),
    ] },
    { id: 'fjp.jd-c2', when: JD, turns: [
      by('b', "Dance. Nobody's falling off anything if we dance."),
      by('a', "We can't dance."),
      by('b', "We can't fly either, and that's the other choice."),
    ] },
  ],
  'decide-side.overruled': [
    { id: 'fjp.jd-c3', when: JD, turns: [
      by('a', "I really want to do the dance."),
      by('b', "We're jumping. It's faster. You'll be fine."),
      by('a', "Fine, but if I die, you're doing my eulogy, and it had better be good."),
    ] },
  ],
  'task-start.any': [
    { id: 'fjp.jd-s1', when: JU, turns: [
      beat("{a} stands on the edge of the bridge platform, harness on, toes over the edge, staring down at the river."),
      by('a', "That's a long way down."),
      by('b', "It's a long way up, too. Look at the view instead."),
    ] },
    { id: 'fjp.jd-s2', when: JU, turns: [
      by('b', "Arms out. Grab the fish the second you touch water. Don't think about it."),
      by('a', "How do you grab a fish?"),
      by('b', "Fast. Very, very fast."),
    ] },
    { id: 'fjp.jd-s3', when: DA, turns: [
      beat('{a} and {b} stand in front of the dance teacher, trying to copy her stamp. Neither of them is even close.'),
      by('a', "Left foot? Right foot? Both feet?"),
      by('b', "Both feet, really hard, like you mean it."),
    ] },
    { id: 'fjp.jd-s4', when: DA, turns: [
      by('b', "And then the face. She says you do the face."),
      beat("{a} tries the face: tongue out, eyes wide. The teacher laughs out loud."),
      by('a', "Is that good laughing or bad laughing?"),
    ] },
  ],
  'task-try.first-try': [
    { id: 'fjp.jd-f1', when: JU, turns: [
      beat("{a} dives off the bridge, falls all the way down to the river, plunges both arms in and comes back up holding a fish."),
      by('a', "Fish! I got a fish! First try!"),
      by('b', "You're a bear! You're basically a bear!"),
    ] },
    { id: 'fjp.jd-f2', when: JU, turns: [
      by('a', "I screamed the whole way down. Did you hear me?"),
      by('b', "The whole valley heard you. But look what's in your hand."),
      beat('{a} looks down. A fish, flapping. {a} screams again, this time in joy.'),
    ] },
    { id: 'fjp.jd-f3', when: DA, turns: [
      beat("{a} and {b} stamp, chant and pull the face in perfect time. The elders look at each other, then nod."),
      by('b', "They nodded! They actually nodded!"),
      by('a', "Keep doing the face till they give us the tip!"),
    ] },
    { id: 'fjp.jd-f4', when: DA, turns: [
      by('b', "First time through, and they accepted it. We're dancers."),
      by('a', "We're dancers who can do one dance."),
      by('b', "That's more dances than I knew this morning."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fjp.jd-a1', when: JU, turns: [
      by('b', "Keep your eyes open on the way down this time. You can't catch what you can't see."),
      beat("{a} jumps with eyes wide open, sees the fish, and snatches it out of the river."),
      by('a', "Eyes open! Eyes open was the whole secret!"),
    ] },
    { id: 'fjp.jd-a2', when: JU, turns: [
      beat('Third jump. {a} drops, sinks both arms into the river, and comes back up clutching a silver fish.'),
      by('a', "Got it! Finally! Get me down!"),
      by('b', "Hold it tight! Don't let it go on the way up!"),
    ] },
    { id: 'fjp.jd-a3', when: DA, turns: [
      by('a', "They want it louder. So we shout. We shout like we mean it."),
      beat("They shout like they mean it, stamp so hard the stage shakes, and the elders finally nod."),
      by('b', "Louder! Louder was the whole thing!"),
    ] },
    { id: 'fjp.jd-a4', when: DA, turns: [
      beat("This time {a} and {b} stop looking at each other's feet and just look at the elders, and the whole dance clicks."),
      by('b', "We did it! We did the whole thing!"),
      beat('The eldest of the elders stands up, nods, and hands over the tip.'),
    ] },
  ],
  'task-try.struggling': [
    { id: 'fjp.jd-t1', when: JU, turns: [
      beat("{a} has been standing at the edge of the bridge platform for five minutes and has not jumped."),
      by('a', "I'm going. I'm going now. In a minute."),
      by('b', "You've said that eleven times."),
    ] },
    { id: 'fjp.jd-t2', when: DA, turns: [
      by('a', "Which bit comes after the stamp? The chant or the slap?"),
      by('b', "The slap. No, the chant. Then the slap."),
      by('a', "We've been doing it backwards this whole time."),
    ] },
    { id: 'fjp.jd-t3', when: JD, turns: [
      by('b', "Should we switch? The other side looks faster."),
      by('a', "Everything looks faster when you're losing."),
      by('b', "We're not losing. We're just not winning yet."),
    ] },
  ],
  'task-done.any': [
    { id: 'fjp.jd-dn1', when: JD, turns: [
      by('a', "That was one of the best things I've ever done. And one of the worst."),
      by('b', "Both at the same time?"),
      by('a', "Exactly at the same time."),
    ] },
    { id: 'fjp.jd-dn2', when: JD, turns: [
      beat('{a} and {b} jog off the bridge towards the lake, still buzzing.'),
      by('b', "I'm going to remember that forever."),
      by('a', "I'm going to remember the fish forever."),
    ] },
    { id: 'fjp.jd-dn3', when: JD, turns: [
      by('b', "To the lake! The Chill Zone's by the lake!"),
      by('a', "Can we swim in it?"),
      by('b', "It's glacier water. You'll turn into a popsicle."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'fjp.jd-x1', when: JU, turns: [
      beat("{a} plunges into the river, grabs, and comes back up with nothing but two handfuls of water."),
      by('a', "It was right there! It swam away!"),
      by('b', "Fish do that! Again!"),
    ] },
    { id: 'fjp.jd-x2', when: JU, turns: [
      beat("{a} gets a fish, holds it up in triumph, and it slips out of {a.posAdj} hands on the way back up."),
      by('a', "No! I had it! It was in my hands!"),
      by('b', "It's a fish! They're slippery! Go again!"),
    ] },
    { id: 'fjp.jd-x3', when: DA, turns: [
      beat("{a} and {b} finish the dance, out of breath. The elders look at each other, and shake their heads."),
      by('a', "What was wrong? Which bit was wrong?"),
      by('b', "I think all the bits. Back to practice."),
    ] },
  ],
};

export default mergePools(place, roads, gorge);
