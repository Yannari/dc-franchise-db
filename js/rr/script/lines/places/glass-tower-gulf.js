// Glass Tower Gulf's own lines (js/rr/places/glass-tower-gulf.js), 1:1 with the real leg ("Hello and Dubai"), in our
// own words:
//   the taxis      to the tower (a sandstorm) and to the gold market (the wrong market).
//   squeegee/serve Either/Or: wash a whole column of windows from a swaying platform on the outside of the tower, or
//                  return a serve from the toughest tennis launcher in the world, in the lines.
// Gated on place / taskId / side / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'glass-tower-gulf' };
const SS = { taskId: 'squeegee-serve' };
const SQ = { taskId: 'squeegee-serve', side: 'squeegee' };
const SV = { taskId: 'squeegee-serve', side: 'serve' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'gtg.op1', when: P, turns: [
      beat('Don stands in front of a glittering tower shaped like a sail, in sunglasses that cost more than a car.'),
      don("Welcome to Glass Tower Gulf! The tallest buildings, the shiniest cars, and a hotel so fancy they wouldn't let me in. Me."),
      don("Today, teams either clean that hotel's windows, from the outside, or play tennis against a machine that has never lost."),
      beat('A sports car roars past behind him. He watches it go with real longing.'),
    ] },
    { id: 'gtg.op2', when: P, turns: [
      don("Glass Tower Gulf. It's forty-five degrees, everything is made of gold or glass, and I've been here an hour and I'm already broke."),
      don("Racers, your taxi is waiting. Bring water. Bring a lot of water."),
      beat('Don sips from a bottle of water. A man in a suit immediately hands him a fresh one on a silver tray.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'gtg.op3', when: P, turns: [
      beat("Don is in a pool on a rooftop, floating on an inflatable swan, wearing a gold watch."),
      don("Glass Tower Gulf. I'm living my best life. You're living yours. Yours involves a squeegee."),
      don("Off you go. Don't splash the swan."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'gtg.ar1', when: P, turns: [
      beat('The taxi pulls onto the bridge, and the tower rises out of the sea ahead of them, blinding white in the sun.'),
      by('a', "It looks like a sail. A building that looks like a sail."),
      by('b', "It looks expensive. Everything here looks expensive."),
      by('a', "We can't afford to look at it."),
    ] },
    { id: 'gtg.ar2', when: P, turns: [
      by('b', "That car's made of gold. That car is actually covered in gold."),
      by('a', "Why would you cover a car in gold?"),
      by('b', "Because you can, I suppose."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'gtg.ad1', when: P, turns: [
      by('a', "The tip says 'windows'. And 'outside'. In the same sentence."),
      by('b', "Outside of what?"),
      by('a', "The tallest hotel I've ever seen."),
    ] },
    { id: 'gtg.ad2', when: P, turns: [
      beat('The heat hits them the moment they step out of the airport, like opening an oven.'),
      by('b', "It's like breathing soup. Hot soup."),
      by('a', "Don't say soup. I can't think about soup in this heat."),
    ] },
  ],
};

// ── the taxis (mishaps) ──
const roads = {
  'travel-mishap.any': [
    { id: 'gtg.tm1', when: { taskId: 'tower-taxi', mishap: 'sandstorm' }, turns: [
      beat('The sky turns orange, and a wall of sand rolls across the highway. The taxi crawls to a stop.'),
      by('a', "I can't see anything. Is that a sandstorm?"),
      by('b', "Either that, or the whole desert is moving."),
      beat('Twenty minutes later, the sand settles, and the tower appears again, gleaming.'),
    ] },
    { id: 'gtg.tm2', when: { taskId: 'market-taxi', mishap: 'wrong-market' }, turns: [
      beat("The taxi stops outside a market full of spices, not gold. The driver points proudly."),
      by('a', "This is a spice market. We said gold."),
      by('b', "Gold! Gold market! Shiny!"),
      beat('The driver nods, laughs, and takes them the other way across the city. Twenty minutes.'),
    ] },
  ],
};

// ── squeegee or serve (Either/Or) ──
const tower = {
  'don-demo.gag': [
    { id: 'gtg.ss-d1', when: SS, turns: [
      don("In this Either/Or, Squeegee: ride a platform down the outside of the tower and wash a whole column of windows until they sparkle."),
      beat('He holds up a squeegee, then looks very, very far up at the tower.'),
      don("Or Serve: return one ball from the world's toughest tennis launcher. It fires at a hundred and fifty miles an hour. I'm told it's never been beaten."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'gtg.ss-d2', when: SS, turns: [
      don("Streaky windows get washed again. A ball that goes out, or doesn't come back at all, means another serve. You may switch sides."),
      don("A clean column, or a ball returned inside the lines, gets you the next tip."),
      beat('Behind him, the tennis launcher fires a ball so hard it dents the back fence. Don flinches.'),
    ] },
  ],
  'decide-side.agree': [
    { id: 'gtg.ss-c1', when: SS, turns: [
      by('a', "Serve. One ball. How hard can one ball be?"),
      by('b', "It dented the fence."),
      by('a', "Then we don't stand where the fence is."),
    ] },
    { id: 'gtg.ss-c2', when: SS, turns: [
      by('b', "Squeegee. Slow but sure. Windows can't fire back at you."),
      by('a', "Windows are on the outside of the tallest hotel in the world."),
      by('b', "They still can't fire back."),
    ] },
  ],
  'decide-side.overruled': [
    { id: 'gtg.ss-c3', when: SS, turns: [
      by('a', "I want to do the tennis."),
      by('b', "You've never played tennis. We're cleaning windows."),
      by('a', "I've watched a lot of tennis."),
    ] },
  ],
  'task-start.any': [
    { id: 'gtg.ss-s1', when: SQ, turns: [
      beat('{a} and {b} clip into the platform, and it lurches out over the edge, hundreds of metres above the sea.'),
      by('a', "It's swinging. Why is it swinging?"),
      by('b', "Because it's a platform hanging off a building! Grab a squeegee!"),
    ] },
    { id: 'gtg.ss-s2', when: SQ, turns: [
      by('b', "Top to bottom. One stroke. Don't go back over it, you'll make streaks."),
      by('a', "Have you done this before?"),
      by('b', "I watched a video in the taxi."),
    ] },
    { id: 'gtg.ss-s3', when: SV, turns: [
      beat("{a} takes a racket and stands on the baseline. The launcher whirs as it warms up."),
      by('a', "It's making a noise. Why is it making a noise?"),
      by('b', "That's the sound of it getting ready to beat you."),
    ] },
    { id: 'gtg.ss-s4', when: SV, turns: [
      by('b', "Just get the racket in the way. Don't swing. Just let it bounce off."),
      by('a', "That's not tennis."),
      by('b', "It is today."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'gtg.ss-f1', when: SQ, turns: [
      beat('{a} and {b} work down the column in perfect rhythm, and every window they leave behind them shines.'),
      by('a', "Look at it. You can see the whole sea in it."),
      by('b', "We're very good at windows. Who knew?"),
    ] },
    { id: 'gtg.ss-f2', when: SQ, turns: [
      by('b', "Last window. Last one, and the man is checking."),
      beat('The inspector runs a white glove down the last pane, looks at it, and nods. The tip is theirs.'),
      by('a', "A white glove! We passed the white glove!"),
    ] },
    { id: 'gtg.ss-f3', when: SV, turns: [
      beat('The ball fires. {a} throws the racket in front of it, and it pings back over the net and lands in.'),
      by('a', "Was that in? That was in!"),
      by('b', "You beat the machine! First ball!"),
    ] },
    { id: 'gtg.ss-f4', when: SV, turns: [
      by('a', "I closed my eyes. I closed my eyes and swung."),
      beat('The ball clips the net, drops over and lands right on the line.'),
      by('b', "On the line counts! On the line is in!"),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gtg.ss-a1', when: SQ, turns: [
      by('a', "He keeps finding streaks. So we go over every window twice. Slowly."),
      beat('They go over every window twice, slowly, as the platform sways. The inspector finally nods.'),
      by('b', "Twice was the answer. Twice is always the answer."),
    ] },
    { id: 'gtg.ss-a2', when: SQ, turns: [
      beat("This time {b} dries every pane with a cloth after the squeegee, all the way down the column."),
      by('b', "No streaks. Not a single one. Check it."),
      beat('The inspector checks. He nods, and hands over the tip.'),
    ] },
    { id: 'gtg.ss-a3', when: SV, turns: [
      by('b', "Stand further back. Give yourself more time."),
      beat("{a} stands right at the back of the court. The ball comes, {a} gets the racket to it, and it lands in."),
      by('a', "More time! I just needed more time!"),
    ] },
    { id: 'gtg.ss-a4', when: SV, turns: [
      beat('Ball after ball has gone into the fence. This one, {a} gets the racket square on, and it sails back in.'),
      by('a', "Finally! The machine can be beaten!"),
      by('b', "And you beat it! Eventually!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'gtg.ss-t1', when: SQ, turns: [
      beat('A gust of wind swings the platform out from the building, and both of them grab the rail.'),
      by('a', "I'm not cleaning anything until it stops swinging."),
      by('b', "It's not going to stop swinging! We're hanging off a building!"),
    ] },
    { id: 'gtg.ss-t2', when: SV, turns: [
      by('a', "I haven't even seen the ball yet. Has it fired?"),
      by('b', "Five times. It's fired five times."),
      by('a', "I've seen none of them."),
    ] },
    { id: 'gtg.ss-t3', when: SS, turns: [
      by('b', "Should we switch? The other side might be easier."),
      by('a', "We've done too much of this one to switch."),
      by('b', "We've done almost none of this one."),
    ] },
  ],
  'task-done.any': [
    { id: 'gtg.ss-dn1', when: SS, turns: [
      by('a', "To the gold market. Where we can't afford anything."),
      by('b', "We can afford to look."),
      by('a', "Only just."),
    ] },
    { id: 'gtg.ss-dn2', when: SS, turns: [
      beat("{a} and {b} jog back to the street, squinting in the glare off the tower."),
      by('b', "I'm never cleaning my own windows again."),
      by('a', "You never cleaned them before."),
    ] },
    { id: 'gtg.ss-dn3', when: SS, turns: [
      by('b', "Was that the hardest thing we've done?"),
      by('a', "It was the shiniest thing we've done."),
      by('b', "That's not an answer."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gtg.ss-x1', when: SQ, turns: [
      beat('The inspector holds up a white glove, now grey, and shakes his head.'),
      by('a', "Grey? How is it grey? We cleaned it!"),
      by('b', "Back up the column. Again."),
    ] },
    { id: 'gtg.ss-x2', when: SV, turns: [
      beat('The ball fires. {a} swings, misses completely, and the ball smacks into the back fence.'),
      by('a', "I didn't even see it!"),
      by('b', "Nobody sees it! That's the problem!"),
    ] },
    { id: 'gtg.ss-x3', when: SV, turns: [
      beat("{a} gets the racket to the ball, and it flies straight up into the sky, and out of the court."),
      by('a', "I hit it! I hit it!"),
      by('b', "You hit it into the sea! Again!"),
    ] },
  ],
};

export default mergePools(place, roads, tower);
