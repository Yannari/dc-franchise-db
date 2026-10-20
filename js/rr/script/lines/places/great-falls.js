// Great Falls' own lines (js/rr/places/great-falls.js), in our own words:
//   the swan boat      away from the falls to the landing: it spins in the current.
//   the wedding slots  Botch or Watch: pull the giant slot machine until three hearts, then find the dress on the rails
//                      that matches the printed picture; anything but three hearts is another pull, the wrong dress is
//                      back to the rails. a plays, b watches from the pews.
//   the tightrope      All-In: across the gorge above the falls in the spray, with a balance pole, one after the other;
//                      a fall into the harness and it's the winch back to the start.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'great-falls' };
const WS = { taskId: 'wedding-slots' };
const TR = { taskId: 'tightrope' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'grf.op1', when: P, turns: [
      beat("Don stands at a railing in a plastic poncho, the thunder of the falls behind him, spray soaking him from every direction."),
      don("Welcome to the Great Falls! The most romantic waterfall in the world. People come here to get married. I came here to get wet."),
      don("Today, teams pedal a swan, play a wedding slot machine, and walk across the falls on a rope. One of those is much worse than the others."),
      beat('A wave of spray hits him full in the face. He wipes it off with the poncho, which is also wet.'),
    ] },
    { id: 'grf.op2', when: P, turns: [
      don("The Great Falls. Millions of litres of water a second, a hundred wedding chapels, and a gift shop that sells snow globes with a waterfall in them."),
      don("Racers, your swan boats are at the foot of the falls. Pedal away from the falls. That's very important. Away."),
      beat('A swan boat drifts past behind him, going the wrong way, its passengers pedalling frantically.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'grf.op3', when: P, turns: [
      beat("Don sits in a heart-shaped hot tub in a honeymoon suite, a view of the falls through the window."),
      don("The Great Falls. I got the honeymoon suite. By myself. Don't ask."),
      don("Swan boats are at the bottom. Off you go."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'grf.ar1', when: P, turns: [
      beat("The swan boat bobs out of the mist, and the falls appear: a wall of white water, roaring, rainbows hanging in the spray."),
      by('a', "Look at it. Just look at it."),
      by('b', "There's a rainbow. There are two rainbows."),
      by('a', "This is the loudest beautiful thing I've ever heard."),
    ] },
    { id: 'grf.ar2', when: P, turns: [
      by('b', "Everybody here is getting married. That's the third wedding we've seen."),
      by('a', "There's a bride on that boat. In a poncho."),
      by('b', "That's love, right there."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'grf.ad1', when: P, turns: [
      by('a', "The tip says 'tightrope'. Over the falls. Over the actual falls."),
      by('b', "There's a harness. It says there's a harness."),
      by('a', "There'd better be a very good harness."),
    ] },
    { id: 'grf.ad2', when: P, turns: [
      by('b', "'Who is feeling lucky?' I've never been lucky in my life."),
      by('a', "Then today's the day it changes."),
      by('b', "Or the day it stays exactly the same."),
    ] },
  ],
};

// ── the swan boat (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'grf.tm1', when: { taskId: 'swan-boat', mishap: 'swan-boat-spins' }, turns: [
      beat("The current catches the swan boat and spins it round and round, closer to the roar of the falls."),
      by('a', "Pedal! Pedal harder!"),
      by('b', "I am pedalling! The swan doesn't care!"),
      beat('Twenty minutes of furious pedalling later, they reach the landing, soaked and dizzy.'),
    ] },
  ],
};

// ── the wedding slot machine (Botch or Watch: a plays, b watches from the pews) ──
const slots = {
  'don-demo.gag': [
    { id: 'grf.ws-d1', when: WS, turns: [
      don("In this Botch or Watch, pull this slot machine until you get three hearts. Then find the wedding dress on the rails that matches the picture it prints out."),
      beat('He pulls the lever. It lands on a lemon, a horseshoe and a sad face. He pulls it again. Three sad faces.'),
      don("I've never had luck with machines. Or weddings. Off you go."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'grf.ws-d2', when: WS, turns: [
      don("Anything but three hearts, pull again. The wrong dress, back to the rails. The other one of you sits in the pews and watches."),
      don("The right dress, held up for the minister, gets you the next tip. There are three hundred dresses. Many of them look the same. Some of them are terrifying."),
      beat('The minister, in a white suit, stands by the altar, beaming, and tosses rice at nobody in particular.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'grf.ws-w1', when: WS, turns: [
      by('b', "You did the last one? No, that was me. So you're playing."),
      by('a', "I've never played a slot machine in my life."),
      by('b', "It's one lever. You'll be fine."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'grf.ws-w2', when: WS, turns: [
      by('a', "I'll do it. I'm the lucky one. I once found a tenner in a hedge."),
      by('b', "That was one time."),
      by('a', "It was a very lucky time."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'grf.ws-w3', when: WS, turns: [
      by('b', "Not me. I lose at everything. Rock, paper, scissors. Everything."),
      by('a', "So that's why it's me?"),
      by('b', "That's exactly why it's you."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'grf.ws-w4', when: WS, turns: [
      by('a', "'Who is feeling lucky?' You won the raffle at the fair."),
      by('b', "I won a tin of beans."),
      by('a', "Still a win."),
    ] },
  ],
  'task-start.any': [
    { id: 'grf.ws-s1', when: WS, turns: [
      beat("{a} grabs the giant lever on the slot machine with both hands, and pulls."),
      by('a', "Heart. Heart. Bell."),
      by('b', "So close! Pull again!"),
    ] },
    { id: 'grf.ws-s2', when: WS, turns: [
      by('b', "Pull it slowly. Slow pulls are lucky pulls."),
      by('a', "Is that true?"),
      by('b', "I don't know. Pull it slowly anyway."),
    ] },
    { id: 'grf.ws-s3', when: WS, turns: [
      beat("{a} walks along the long rails of wedding dresses, holding the printed picture up next to every one."),
      by('a', "Lace. Lace. More lace. Why is everything lace?"),
      by('b', "It's a wedding! Everything is lace!"),
    ] },
    { id: 'grf.ws-s4', when: WS, turns: [
      by('a', "The picture has a big bow on the back."),
      by('b', "Look for bows. Just bows."),
      by('a', "Half of them have bows!"),
    ] },
  ],
  'task-try.first-try': [
    { id: 'grf.ws-f1', when: WS, turns: [
      beat("Heart. Heart. Heart. The machine flashes and plays a wedding march, and a picture prints out. {a} finds the dress on the first rail."),
      by('b', "First pull! First rail!"),
      by('a', "I'm the luckiest person alive!"),
    ] },
    { id: 'grf.ws-f2', when: WS, turns: [
      by('a', "This one. Same bow. Same buttons. Same weird puffy sleeves."),
      beat("The minister compares the dress to the picture, smiles, and hands over the tip."),
      by('b', "The sleeves gave it away!"),
    ] },
    { id: 'grf.ws-f3', when: WS, turns: [
      beat("{a} pulls the lever, gets three hearts, spins round, and walks straight to the one dress that matches, without looking at the others."),
      by('b', "How did you know?"),
      by('a', "It was the only one I'd have picked for myself."),
    ] },
    { id: 'grf.ws-f4', when: WS, turns: [
      by('b', "First go! Three hearts and the right dress!"),
      by('a', "Should we get married now?"),
      by('b', "We've got a race to run."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'grf.ws-a1', when: WS, turns: [
      by('b', "That dress had a bow, but the bow was red. The picture's bow is white. White bows only."),
      beat("{a} checks only the dresses with white bows, and finds the match on the next rail."),
      by('a', "The colour of the bow! It was always the colour of the bow!"),
    ] },
    { id: 'grf.ws-a2', when: WS, turns: [
      beat("Pull after pull after pull, until finally the reels stop on three hearts, and the wedding march plays."),
      by('a', "Three hearts! Finally three hearts!"),
      by('b', "Now find the dress! Quick!"),
    ] },
    { id: 'grf.ws-a3', when: WS, turns: [
      by('a', "Every dress I bring is too long. So the one in the picture must be short."),
      beat("{a} finds the only short dress on the rails. It matches the picture exactly."),
      by('b', "A short wedding dress! For running weddings!"),
    ] },
    { id: 'grf.ws-a4', when: WS, turns: [
      beat("After two wrong dresses and a lot of pulls, {a} finally hands the minister the right dress."),
      by('a', "That's it! That's the one!"),
      by('b', "The minister's crying! She's so happy!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'grf.ws-t1', when: WS, turns: [
      beat("{a} has pulled the lever twenty times. The reels keep landing on lemons."),
      by('a', "Why lemons? What do lemons have to do with weddings?"),
      by('b', "Nothing! Keep pulling!"),
    ] },
    { id: 'grf.ws-t2', when: WS, turns: [
      by('b', "That's the fourth dress she's sent back."),
      by('a', "They all look exactly the same!"),
      by('b', "Look closer! One of them is different!"),
    ] },
    { id: 'grf.ws-t3', when: WS, turns: [
      beat("{a} is lost in the middle of the rails, completely surrounded by white dresses on every side."),
      by('a', "I can't find my way out! It's all dresses!"),
      by('b', "Follow my voice! This way!"),
    ] },
  ],
  'task-done.any': [
    { id: 'grf.ws-dn1', when: WS, turns: [
      by('a', "I've never seen so many wedding dresses in my life."),
      by('b', "And you found the right one."),
      by('a', "Eventually."),
    ] },
    { id: 'grf.ws-dn2', when: WS, turns: [
      beat("{a} and {b} walk out of the chapel, the minister throwing rice after them."),
      by('b', "Why is she throwing rice at us?"),
      by('a', "She throws rice at everybody. It's her thing."),
    ] },
    { id: 'grf.ws-dn3', when: WS, turns: [
      by('b', "Tightrope next."),
      by('a', "Over the falls?"),
      by('b', "Over the falls."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'grf.ws-x1', when: WS, turns: [
      beat("Heart. Heart. Lemon. The machine plays a sad trombone noise."),
      by('a', "So close! One more heart!"),
      by('b', "Pull again!"),
    ] },
    { id: 'grf.ws-x2', when: WS, turns: [
      beat("The minister holds the dress up next to the picture, frowns, and shakes her head. The sleeves are wrong."),
      by('a', "The sleeves? Nobody looks at sleeves!"),
      by('b', "She does! Back to the rails!"),
    ] },
    { id: 'grf.ws-x3', when: WS, turns: [
      beat("{a} grabs a dress that looks right, and it turns out to be a tablecloth on a hanger."),
      by('a', "That's not a dress."),
      by('b', "That's very much not a dress. Again!"),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'grf.ws-v1', when: WS, turns: [
      by('b', "Three hearts! Three hearts! You can do it!"),
      by('a', "Shh! This is a chapel!"),
      by('b', "Weddings are for cheering!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'grf.ws-v2', when: WS, turns: [
      beat("{b} sits in the front pew, hands clasped tightly, watching every spin of the reels."),
      by('b', "Come on, hearts. Please, hearts."),
      by('a', "Stop praying to the slot machine!"),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'grf.ws-v3', when: WS, turns: [
      beat("{b} leaves the pews and starts searching the dress rails too."),
      by('b', "I'll take this rail, you take that one!"),
      beat('The minister stops smiling, and points {b} firmly back to the pews. A penalty.'),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'grf.ws-v4', when: WS, turns: [
      beat("{b} sits silently in the pews, like a guest at a very tense wedding."),
      by('a', "You're so quiet."),
      by('b', "It's a chapel. I'm being respectful."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'grf.ws-h1', when: WS, turns: [
      beat("While the minister fixes her flowers, {b} nods very hard towards one particular rail."),
      by('a', "Why are you nodding at that rail?"),
      by('b', "I'm not nodding. I've got a stiff neck. Look at that rail."),
    ] },
  ],
};

// ── the tightrope (All-In) ──
const rope = {
  'don-demo.gag': [
    { id: 'grf.tr-d1', when: TR, turns: [
      don("In this All-In, walk across the falls on a tightrope. One at a time, with a balance pole. You're clipped to a safety line. You're perfectly safe."),
      beat('He puts one foot on the rope, feels it wobble, and takes the foot straight back off.'),
      don("Perfectly safe for you. I've decided I'm not going."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'grf.tr-d2', when: TR, turns: [
      don("Fall off, and the harness catches you, and the winch brings you back to the start. Then you walk it again."),
      don("Both of you on the far rim, and the next tip is yours. The spray makes the rope wet. The wind makes it wobble. Enjoy."),
      beat('A racer halfway across slips, drops into the harness, and dangles over the falls, screaming, as the winch hauls them back.'),
    ] },
  ],
  'task-start.any': [
    { id: 'grf.tr-s1', when: TR, turns: [
      beat("{a} steps onto the tightrope, holding the long balance pole, the falls roaring below."),
      by('a', "It's wobbling. It's wobbling a lot."),
      by('b', "Look at the other side! Not down! The other side!"),
    ] },
    { id: 'grf.tr-s2', when: TR, turns: [
      by('b', "Small steps. Heel to toe. Like walking on a line in the playground."),
      by('a', "The playground wasn't over a waterfall."),
      by('b', "Pretend it is."),
    ] },
    { id: 'grf.tr-s3', when: TR, turns: [
      beat("The spray drifts over the rope, and {a} disappears into a cloud of mist for a second."),
      by('b', "Are you still there?"),
      by('a', "Still here! I can't see anything, but still here!"),
    ] },
    { id: 'grf.tr-s4', when: TR, turns: [
      by('a', "Who goes first?"),
      by('b', "Whoever's less scared."),
      by('a', "Then neither of us is going."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'grf.tr-f1', when: TR, turns: [
      beat("{a} walks the whole tightrope without a wobble, then {b} does the same, and they hug on the far rim."),
      by('b', "We did it! Over the falls!"),
      by('a', "I'm never doing it again, but we did it!"),
    ] },
    { id: 'grf.tr-f2', when: TR, turns: [
      by('a', "Breathe. Step. Breathe. Step."),
      beat("{a} breathes and steps all the way across, then calls {b} over the same way, step by step."),
      by('b', "Breathe and step! It works!"),
    ] },
    { id: 'grf.tr-f3', when: TR, turns: [
      beat("{b} walks the rope with eyes half shut, humming a song, and reaches the far side without a single wobble."),
      by('a', "Were you humming?"),
      by('b', "It stops me thinking about the falls."),
    ] },
    { id: 'grf.tr-f4', when: TR, turns: [
      by('b', "First try! Both of us!"),
      by('a', "My legs are still shaking."),
      by('b', "Mine haven't stopped shaking since the swan boat."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'grf.tr-a1', when: TR, turns: [
      by('b', "You hold the pole too high. Hold it low. Right down by your waist."),
      beat("{a} holds the pole low, steadies at once, and walks all the way across."),
      by('a', "Low pole! It works!"),
    ] },
    { id: 'grf.tr-a2', when: TR, turns: [
      beat("Second try. {a} goes slower this time, much slower, and makes it to the far rim."),
      by('a', "Slower! Slower is everything!"),
      by('b', "My turn! Slowly!"),
    ] },
    { id: 'grf.tr-a3', when: TR, turns: [
      by('a', "I keep looking down at the falls. So I'll look at you. Stand on the far side and wave."),
      beat("{b} waves from the far rim. {a} looks only at {b}, and walks across without a slip."),
      by('b', "Just look at me! That's all it took!"),
    ] },
    { id: 'grf.tr-a4', when: TR, turns: [
      beat("After a fall into the harness each, {a} and {b} finally both make it across."),
      by('a', "Third time! Both of us!"),
      by('b', "I got to see the falls from underneath. Twice."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'grf.tr-t1', when: TR, turns: [
      beat("{a} is frozen in the middle of the tightrope, the pole wobbling, not moving forward or back."),
      by('a', "I can't move. If I move, I'll fall."),
      by('b', "If you don't move, you'll be there forever!"),
    ] },
    { id: 'grf.tr-t2', when: TR, turns: [
      by('b', "That's the third time you've fallen."),
      by('a', "The harness is very comfortable."),
      by('b', "Stop enjoying the harness!"),
    ] },
    { id: 'grf.tr-t3', when: TR, turns: [
      beat("A gust of wind blows across the gorge, and the rope swings, and {a} sways wildly with the pole."),
      by('a', "Wind! Wind! Too much wind!"),
      by('b', "Wait for it to stop! Wait!"),
    ] },
  ],
  'task-done.any': [
    { id: 'grf.tr-dn1', when: TR, turns: [
      by('a', "We walked across a waterfall."),
      by('b', "Over a waterfall."),
      by('a', "Over it. Across it. Same thing."),
    ] },
    { id: 'grf.tr-dn2', when: TR, turns: [
      beat("{a} and {b} unclip from the harness on the far rim and stand looking back at the falls, dripping."),
      by('b', "Look how far we came."),
      by('a', "On a piece of string."),
    ] },
    { id: 'grf.tr-dn3', when: TR, turns: [
      by('b', "That's the bravest thing I've ever done."),
      by('a', "Me too."),
      by('b', "And I did it in a poncho."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'grf.tr-x1', when: TR, turns: [
      beat("{a} wobbles, overbalances, and drops off the rope into the harness, dangling over the roaring falls."),
      by('a', "I'm dangling! I'm dangling over the falls!"),
      by('b', "They're winching you back! Hold on!"),
    ] },
    { id: 'grf.tr-x2', when: TR, turns: [
      beat("{b} drops the balance pole, and it tumbles down into the falls."),
      by('b', "My pole! My pole's gone!"),
      by('a', "Back to the start! Get a new one!"),
    ] },
    { id: 'grf.tr-x3', when: TR, turns: [
      beat("{a} gets three steps from the end, slips on the wet rope, and falls into the harness."),
      by('a', "Three steps! I was three steps away!"),
      by('b', "Back to the start! Again!"),
    ] },
  ],
};

export default mergePools(place, roads, slots, rope);
