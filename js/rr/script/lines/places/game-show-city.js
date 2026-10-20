// Game Show City's own lines (js/rr/places/game-show-city.js), in our own words:
//   the bullet train  into the city: the wrong platform.
//   human pinball     All-In: in a padded suit, launched from the plunger, bounced off bumpers to light five targets
//                     before the timer runs out while the partner works the flippers; a man in a panda suit "helps";
//                     a drained ball or a dead timer is a new ball.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'game-show-city' };
const PB = { taskId: 'pinball' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'gsc.op1', when: P, turns: [
      beat("Don stands in the middle of a giant crossing under a hundred flashing screens, as a sea of people walks round him in every direction."),
      don("Welcome to Game Show City! Where the trains are on time, the vending machines sell everything, and the game shows are completely, beautifully insane."),
      don("Today, one of you becomes a pinball. I'm not explaining it any further. I don't think I can."),
      beat('One of the giant screens behind him shows a man being launched into a pool of custard. The crowd cheers.'),
    ] },
    { id: 'gsc.op2', when: P, turns: [
      don("Game Show City. I came here once to host a show. I lasted one episode. There was a crab involved. We don't talk about it."),
      don("Racers, take the bullet train into the city. It leaves at exactly the time it says. Not one second later."),
      beat('A bullet train flashes past behind him with a whoosh that messes up his hair completely.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'gsc.op3', when: P, turns: [
      beat("Don sits in a tiny capsule hotel room, only his head poking out, eating noodles from a cup."),
      don("Game Show City. I'm in a pod. It's very cosy. Train's at the station."),
      don("Go be a pinball. I'll be here. In my pod."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'gsc.ar1', when: P, turns: [
      beat("The bullet train glides into the city at night, and every building is covered in lights, screens, and giant moving signs."),
      by('a', "It's so bright. It's brighter at night than in the day."),
      by('b', "There's a giant robot on that building. A moving giant robot."),
      by('a', "This is the best place I've ever been."),
    ] },
    { id: 'gsc.ar2', when: P, turns: [
      by('b', "That vending machine sells hot soup. In a can."),
      by('a', "This one sells umbrellas. And socks. And an egg?"),
      by('b', "I love it here. I want to live in a vending machine."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'gsc.ad1', when: P, turns: [
      by('a', "The tip says 'you are the ball'. What does that mean?"),
      by('b', "I think it means we're the ball."),
      by('a', "That's what I was afraid of."),
    ] },
    { id: 'gsc.ad2', when: P, turns: [
      beat("They walk past a studio window where a contestant in a giant foam suit is being bounced off a wall by a machine."),
      by('b', "Is that what we're doing?"),
      by('a', "Please say it isn't."),
    ] },
  ],
};

// ── the bullet train (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'gsc.tm1', when: { taskId: 'bullet-train', mishap: 'wrong-platform' }, turns: [
      beat("{a} and {b} sprint up the stairs to the platform just as a sleek white train glides away. It was the right train. They were on the wrong platform."),
      by('a', "That was ours! That was our train!"),
      by('b', "The next one's in twenty minutes. Exactly twenty."),
      beat('Exactly twenty minutes later, the next train arrives, and they get on it.'),
    ] },
  ],
};

// ── human pinball (All-In) ──
const pinball = {
  'don-demo.gag': [
    { id: 'gsc.pb-d1', when: PB, turns: [
      don("In this All-In, one of you is the ball. Strap into this padded suit, get launched onto the table, and bounce off the bumpers to light all five targets."),
      beat('A contestant in a padded suit is fired across the table behind him, bounces off three bumpers, and lands in a heap.'),
      don("The other one works the flippers. Keep your ball on the table. Your ball is your partner. Treat them gently."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'gsc.pb-d2', when: PB, turns: [
      don("If your ball drains past the flippers, or the timer runs out, you get a new ball. Same partner. Slightly more bruised."),
      don("Light all five targets, and you get the next tip. And watch out for the panda. He likes to help. He never helps."),
      beat('A man in a panda suit waves at the camera from the middle of the table, then gets hit by a bouncing contestant.'),
    ] },
  ],
  'task-start.any': [
    { id: 'gsc.pb-s1', when: PB, turns: [
      beat("{a} stands at the plunger in a huge padded suit, looking like a marshmallow with arms."),
      by('a', "I can't see my feet. I can't see anything below my chin."),
      by('b', "You don't need to see. You need to bounce."),
    ] },
    { id: 'gsc.pb-s2', when: PB, turns: [
      by('b', "I'll flip you up to the left. That's where the targets are."),
      by('a', "Flip me gently."),
      by('b', "There's no gentle. It's a flipper."),
    ] },
    { id: 'gsc.pb-s3', when: PB, turns: [
      beat("The plunger fires, and {a} shoots up the table, screaming, straight into the first bumper."),
      by('a', "Ow! Ding! Ow! Ding!"),
      by('b', "You lit one! You lit one!"),
    ] },
    { id: 'gsc.pb-s4', when: PB, turns: [
      by('a', "What do I do about the panda?"),
      by('b', "Avoid the panda. Whatever happens, avoid the panda."),
      by('a', "He's walking towards me."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'gsc.pb-f1', when: PB, turns: [
      beat("{a} bounces off bumper after bumper, and {b} flips perfectly every time. Five targets light up. The whole studio erupts."),
      by('b', "Five! All five! First ball!"),
      by('a', "Can somebody stop me spinning? I'm still spinning!"),
    ] },
    { id: 'gsc.pb-f2', when: PB, turns: [
      by('b', "Flip! Flip! Up you go!"),
      beat("{a} flies up the table, hits the last target dead centre, and the lights go mad. The host shouts something nobody understands."),
      by('a', "Did we win? I think we won something!"),
    ] },
    { id: 'gsc.pb-f3', when: PB, turns: [
      beat("{a} bounces off the panda, into a bumper, and straight into the last target."),
      by('b', "The panda helped! The panda actually helped!"),
      by('a', "First time in history!"),
    ] },
    { id: 'gsc.pb-f4', when: PB, turns: [
      by('a', "Are all five lit? I can't see. I'm upside down."),
      by('b', "All five! You did it, upside-down person!"),
      by('a', "Turn me the right way up, and I'll celebrate."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gsc.pb-a1', when: PB, turns: [
      by('b', "I keep flipping too early. This time, I wait until you touch the flipper."),
      beat("{b} waits. {a} rolls onto the flipper. {b} flips. {a} flies up and lights the last two targets."),
      by('a', "Wait and then flip! Perfect!"),
    ] },
    { id: 'gsc.pb-a2', when: PB, turns: [
      beat("Third ball. {a} tucks into a tight ball this time, and bounces twice as fast."),
      by('a', "Tuck! Tuck makes you faster!"),
      beat("Five targets light. The bell rings. The host throws confetti."),
    ] },
    { id: 'gsc.pb-a3', when: PB, turns: [
      by('a', "Swap! You be the ball. I'll do the flippers."),
      beat("{b} is a natural ball. Five bounces, five targets, and the whole table lights up."),
      by('b', "I was born to be a ball!"),
    ] },
    { id: 'gsc.pb-a4', when: PB, turns: [
      beat("After two drains and one long conversation with the panda, {a} finally lights the fifth target."),
      by('a', "Five! Finally five!"),
      by('b', "Was the panda nice, at least?"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'gsc.pb-t1', when: PB, turns: [
      beat("{a} is lying in the middle of the table, not moving, while the timer counts down."),
      by('b', "Are you okay? Can you roll?"),
      by('a', "I've been bounced too much. I'm just lying here now."),
    ] },
    { id: 'gsc.pb-t2', when: PB, turns: [
      by('b', "The panda keeps getting in the way!"),
      by('a', "Tell him to move!"),
      by('b', "He doesn't understand! He just waves!"),
    ] },
    { id: 'gsc.pb-t3', when: PB, turns: [
      beat("{a} bounces off the same bumper over and over and over, and can't get away from it."),
      by('a', "I'm stuck! I'm stuck on this one!"),
      by('b', "Tilt! Tilt the table!"),
    ] },
  ],
  'task-done.any': [
    { id: 'gsc.pb-dn1', when: PB, turns: [
      by('a', "I'm going to be dizzy for a week."),
      by('b', "But you were the best ball in the history of balls."),
      by('a', "I'll take it."),
    ] },
    { id: 'gsc.pb-dn2', when: PB, turns: [
      beat("{a} waddles out of the studio in the padded suit, refusing to take it off."),
      by('b', "You can take it off now."),
      by('a', "Never. It's my suit now. I've earned it."),
    ] },
    { id: 'gsc.pb-dn3', when: PB, turns: [
      by('b', "That was the strangest thing we've ever done."),
      by('a', "And the most fun."),
      by('b', "Strange and fun. That's this whole city."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gsc.pb-x1', when: PB, turns: [
      beat("{a} rolls straight down the middle, between the flippers, and drops into the drain with a thud."),
      by('a', "Did I drain? I drained, didn't I?"),
      by('b', "New ball! Back to the plunger!"),
    ] },
    { id: 'gsc.pb-x2', when: PB, turns: [
      beat("The timer buzzes. Four targets lit. One still dark."),
      by('b', "Four! We had four!"),
      by('a', "Four isn't five. New ball."),
    ] },
    { id: 'gsc.pb-x3', when: PB, turns: [
      beat("The panda steps into {a}'s path, and {a} bounces off him, backwards, and straight down the drain."),
      by('a', "The panda! The panda did that!"),
      by('b', "He's waving! He doesn't even know! New ball!"),
    ] },
  ],
};

export default mergePools(place, roads, pinball);
