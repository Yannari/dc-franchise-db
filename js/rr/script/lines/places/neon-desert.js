// Neon Desert's own lines (js/rr/places/neon-desert.js), 1:1 with the real leg ("Dude Buggies"), in our own words:
//   the taxi       off the strip: stuck behind a queue of wedding limousines.
//   buggy / magic  Either/Or: one works a remote control while the other rides the dune buggy and grabs three flags in a
//                  minute, or one is locked in a cage with a sleeping lion and the other pulls the lever that makes them
//                  vanish before it wakes.
// Gated on place / taskId / side / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'neon-desert' };
const BM = { taskId: 'buggy-magic' };
const BG = { taskId: 'buggy-magic', side: 'buggy' };
const MG = { taskId: 'buggy-magic', side: 'magic' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'nde.op1', when: P, turns: [
      beat('Don stands in front of a wall of flashing neon signs, a slot machine ringing behind him, in a gold jacket.'),
      don("Welcome to the Neon Desert! The city that never sleeps, in the middle of a desert that never rains. I've been here a day. I've lost two hundred dollars and a shoe."),
      don("Today, teams either drive a toy car or disappear in front of a lion. Both are things I've seen happen here at four in the morning."),
      beat('Behind him, a man in a sequinned suit walks past carrying a small dog in a tiny tuxedo. Don watches them go.'),
    ] },
    { id: 'nde.op2', when: P, turns: [
      don("The Neon Desert. Everything here is too bright, too loud, and open all night. I feel very at home."),
      don("Racers, grab a taxi off the strip. Do not stop to play anything. Do not get married. It happens fast here."),
      beat('A wedding chapel across the street flashes a sign: DRIVE-THROUGH, NO WAITING. Don points at it, warningly.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'nde.op3', when: P, turns: [
      beat("Don is sitting at an empty card table, shuffling a deck of cards, very slowly, in sunglasses."),
      don("Neon Desert. I'm on a winning streak. Of sitting here. Taxis are outside."),
      don("Go on. Don't bet anything you can't afford to lose. Like the race."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'nde.ar1', when: P, turns: [
      beat('The taxi crawls down the strip at night, and every building on both sides is lit up: castles, towers, a pyramid, a giant guitar.'),
      by('a', "Is that a pyramid? Next to a castle? Next to a guitar?"),
      by('b', "It's like somebody built every city in the world on one street."),
      by('a', "And then plugged it all in."),
    ] },
    { id: 'nde.ar2', when: P, turns: [
      by('b', "A fountain just started dancing. To music. Look at it."),
      by('a', "Even the water here is showing off."),
      by('b', "I love it. I love all of it."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'nde.ad1', when: P, turns: [
      by('a', "The tip says 'lion'. In capital letters."),
      by('b', "Or a toy car. It also says toy car."),
      by('a', "The capital letters are on 'lion'."),
    ] },
    { id: 'nde.ad2', when: P, turns: [
      beat('They step out of the air conditioning into the desert heat, and the air feels like a hairdryer.'),
      by('b', "It's night. Why is it this hot at night?"),
      by('a', "Because it's a desert pretending to be a city."),
    ] },
  ],
};

// ── the taxi (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'nde.tm1', when: { taskId: 'strip-taxi', mishap: 'wedding-chapel-traffic' }, turns: [
      beat("The taxi is stuck behind a line of white limousines, all waiting to pull into the same wedding chapel."),
      by('a', "Is everybody getting married today?"),
      by('b', "The driver says every day is like this. Every single day."),
      beat('Twenty minutes and four weddings later, the road clears.'),
    ] },
  ],
};

// ── buggy or magic (Either/Or) ──
const desert = {
  'don-demo.gag': [
    { id: 'nde.bm-d1', when: BM, turns: [
      don("In this Either/Or, Buggy: one of you drives a remote-control dune buggy round the course, and the other one rides on it and grabs three flags. In a minute."),
      beat('He presses a button on the remote. The buggy shoots off, hits a dune, and flips over onto its back.'),
      don("Or Magic: one of you gets locked in a cage with a sleeping lion, and the other pulls the lever that makes you disappear. Before it wakes up. Ideally."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'nde.bm-d2', when: BM, turns: [
      don("Miss a flag, or run out of time, and the buggy goes back to the start. Pull the wrong lever, and the lion wakes up, and the act starts again."),
      don("Three flags, or a clean disappearance, and the next tip is yours. You may switch sides. The lion may not."),
      beat("In the theatre behind him, a lion yawns. It is a very, very big yawn."),
    ] },
  ],
  'decide-side.agree': [
    { id: 'nde.bm-c1', when: { ...BM, side: 'buggy' }, turns: [
      by('a', "Buggy. Definitely buggy. A toy car has never eaten anybody."),
      by('b', "Not that we know of."),
      by('a', "Buggy."),
    ] },
    { id: 'nde.bm-c2', when: { ...BM, side: 'magic' }, turns: [
      by('b', "Magic. The lion's asleep. It's basically a big cat having a nap."),
      by('a', "A big cat that eats people."),
      by('b', "Only when it's awake."),
    ] },
  ],
  'decide-side.overruled': [
    { id: 'nde.bm-c3', when: { ...BM, side: 'magic' }, turns: [
      by('a', "I really, really don't want to be in a cage with a lion."),
      by('b', "It's faster. And you're the one who fits in the cage."),
      by('a', "That's the worst reason I've ever heard."),
    ] },
  ],
  'task-start.any': [
    { id: 'nde.bm-s1', when: BG, turns: [
      beat("{b} climbs onto the dune buggy and holds on. {a} takes the remote control and stares at all the buttons."),
      by('a', "Which one is forward?"),
      by('b', "You don't know which one is forward?"),
    ] },
    { id: 'nde.bm-s2', when: BG, turns: [
      by('b', "Slow round the corners. I need time to grab the flags."),
      by('a', "We've got a minute. There is no slow."),
      by('b', "Then grab-speed. Go grab-speed."),
    ] },
    { id: 'nde.bm-s3', when: MG, turns: [
      beat("{a} steps into the cage. In the corner, the lion is asleep, its tail twitching."),
      by('a', "It's twitching. Why is it twitching?"),
      by('b', "It's dreaming. Don't be in its dream."),
    ] },
    { id: 'nde.bm-s4', when: MG, turns: [
      by('b', "The magician said it's the third lever. Or the fourth. There are six levers."),
      by('a', "Pick the right one, please. Pick it fast."),
      by('b', "No pressure, then."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'nde.bm-f1', when: BG, turns: [
      beat("The buggy tears round the course, {b} leaning out, and snatches one flag, two flags, three, with seconds to spare."),
      by('b', "Three! I got all three!"),
      by('a', "First go! We're a racing team!"),
    ] },
    { id: 'nde.bm-f2', when: BG, turns: [
      by('a', "Left, left, now right, now straight!"),
      beat("{b} grabs the last flag as the buggy flies over the top of a dune. The clock reads fifty-two seconds."),
      by('b', "Fifty-two! We had eight seconds left over!"),
    ] },
    { id: 'nde.bm-f3', when: MG, turns: [
      beat("{b} pulls the lever. Smoke fills the cage, a drum rolls, and when it clears, {a} is gone. The lion sleeps on."),
      by('b', "It worked! Where are you?"),
      by('a', "I'm under the stage! I don't know how I got here!"),
    ] },
    { id: 'nde.bm-f4', when: MG, turns: [
      by('a', "Did I vanish? Did it work?"),
      beat('The magician bows to the empty seats. The lion has not moved. The tip is theirs.'),
      by('b', "You vanished! You vanished beautifully!"),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'nde.bm-a1', when: BG, turns: [
      by('b', "You keep driving past the flags. Slow down just before each one."),
      beat("{a} brakes just before each flag. {b} grabs all three. The clock reads fifty-eight."),
      by('a', "Fifty-eight! Two seconds to spare! That counts!"),
    ] },
    { id: 'nde.bm-a2', when: BG, turns: [
      beat("Third run. {a} has finally worked out which button is forward, and the buggy flies round the course."),
      by('a', "I know the buttons now! I know all the buttons!"),
      by('b', "Three flags! Stop the clock!"),
    ] },
    { id: 'nde.bm-a3', when: MG, turns: [
      by('b', "It's not the third lever. It's not the fourth. So it's the fifth."),
      beat("{b} pulls the fifth lever. The smoke rises, and {a} vanishes. The lion doesn't even stir."),
      by('a', "It was the fifth one! Write that down for next time!"),
    ] },
    { id: 'nde.bm-a4', when: MG, turns: [
      beat("This time {a} stands perfectly still in the cage, barely breathing, and {b} pulls the lever in one smooth move."),
      by('b', "Gone! Clean! Completely gone!"),
      beat('The magician nods, and hands over the tip.'),
    ] },
  ],
  'task-try.struggling': [
    { id: 'nde.bm-t1', when: BG, turns: [
      beat("The buggy is upside down on top of a dune. {b} is lying in the sand next to it."),
      by('a', "Is it broken? Are you broken?"),
      by('b', "Neither of us is broken. Both of us are upside down."),
    ] },
    { id: 'nde.bm-t2', when: MG, turns: [
      by('a', "Its eye just opened. Its eye is open. Pull something!"),
      by('b', "I'm trying! They all look the same!"),
      by('a', "Pull any of them!"),
    ] },
    { id: 'nde.bm-t3', when: BM, turns: [
      by('b', "Should we switch? Maybe the other one's easier."),
      by('a', "The other one has a lion."),
      by('b', "That's a no, then."),
    ] },
  ],
  'task-done.any': [
    { id: 'nde.bm-dn1', when: BM, turns: [
      by('a', "I want to go home and tell everyone about this."),
      by('b', "Nobody will believe you."),
      by('a', "There are cameras. They'll have to."),
    ] },
    { id: 'nde.bm-dn2', when: BM, turns: [
      beat("{a} and {b} jog towards the theatre doors, under the flashing lights."),
      by('b', "Everything's so bright. My eyes hurt."),
      by('a', "Close them and follow my voice."),
    ] },
    { id: 'nde.bm-dn3', when: BM, turns: [
      by('b', "Was that the strangest thing we've done in this race?"),
      by('a', "So far. There's still time."),
      by('b', "Don't say that."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'nde.bm-x1', when: BG, turns: [
      beat("{b} reaches for the last flag, misses it by a finger, and the buzzer goes. One minute."),
      by('b', "Back to the start?"),
      by('a', "Back to the start. Hold on tighter."),
    ] },
    { id: 'nde.bm-x2', when: MG, turns: [
      beat("{b} pulls a lever. A trapdoor opens, under the magician. He drops out of sight. The lion opens one eye."),
      by('a', "That's the wrong person! Wrong person!"),
      by('b', "Everybody out! We start the act again!"),
    ] },
    { id: 'nde.bm-x3', when: MG, turns: [
      beat("{b} pulls a lever. Confetti falls on {a}. The lion sneezes, and wakes up."),
      by('a', "Get me out! Get me out now!"),
      by('b', "Not that one! Start again!"),
    ] },
  ],
};

export default mergePools(place, roads, desert);
