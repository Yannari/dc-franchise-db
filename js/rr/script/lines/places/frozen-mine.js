// Frozen Mine's own lines (js/rr/places/frozen-mine.js), 1:1 with the real leg ("How Deep Is Your Love"), in our own
// words:
//   the taxi       to the lake: reindeer on the road.
//   the ice yacht  All-In: swimsuits on, one steers, one works the sail, across the frozen lake to the mine; tipped, spun
//                  out or off course and it's back to the start.
//   the borehole   Botch or Watch: one is winched down the borehole into the cavern under the ice to find the one red
//                  ball among the white ones; a white ball means going back down. a goes down, b works the winch.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'frozen-mine' };
const IY = { taskId: 'ice-yacht' };
const BH = { taskId: 'borehole' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'fzm.op1', when: P, turns: [
      beat("Don stands on a frozen lake in a full snowsuit, a scarf wrapped round his face, snow-covered pines on every shore."),
      don("Welcome to the Frozen Mine! Land of lakes, saunas, and the deepest mine on the planet. It's twenty below. I asked for a sauna leg. I got the frozen half."),
      don("Today, teams go sailing. On ice. In swimsuits. I'm not making that up. I wish I was."),
      beat('A gust of wind sends snow across the ice and straight into his face. He doesn\'t move. He just closes his eyes.'),
    ] },
    { id: 'fzm.op2', when: P, turns: [
      don("The Frozen Mine. In winter, the sun is up for four hours. You'll be spending most of them in a hole."),
      don("Racers, taxis to the lake are waiting. Bring a swimsuit. You'll see why. You won't like why."),
      beat('Behind him, a man in nothing but shorts runs out of a sauna, jumps into a hole in the ice, and climbs out smiling.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'fzm.op3', when: P, turns: [
      beat("Don is sitting in a wooden sauna, wrapped in a towel, very pink, very relaxed."),
      don("Frozen Mine. I'm in the sauna. The sauna is the Chill Zone. I'm not leaving it."),
      don("Taxis are outside. Outside is very cold. Good luck."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'fzm.ar1', when: P, turns: [
      beat("The taxi drives out of the forest, and the lake opens up: flat, white, and endless, with sails moving across it like boats on a sea."),
      by('a', "Those are boats. On ice. Sailing on ice."),
      by('b', "It's like the lake forgot to melt and everyone just carried on."),
      by('a', "It's beautiful. I can't feel my nose, but it's beautiful."),
    ] },
    { id: 'fzm.ar2', when: P, turns: [
      by('b', "Look at the trees. Every single one is covered in snow."),
      by('a', "Like a card. A Christmas card."),
      by('b', "A Christmas card that's trying to kill us."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'fzm.ad1', when: P, turns: [
      by('a', "The tip says 'swimsuits'. It's twenty below."),
      by('b', "Maybe it's a typo."),
      by('a', "It's underlined."),
    ] },
    { id: 'fzm.ad2', when: P, turns: [
      by('b', "'Who is not afraid of the dark?' I'm afraid of the dark."),
      by('a', "Since when?"),
      by('b', "Since I read the word 'mine'."),
    ] },
  ],
};

// ── the taxi (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'fzm.tm1', when: { taskId: 'lake-taxi', mishap: 'reindeer-on-the-road' }, turns: [
      beat("The taxi stops in the snowy forest. A herd of reindeer is crossing the road, slowly, one by one."),
      by('a', "Reindeer! Real reindeer!"),
      by('b', "Real reindeer, in our way, for twenty minutes."),
      beat('The last one finally steps off the road, and looks back at them, unbothered.'),
    ] },
  ],
};

// ── the ice yacht (All-In) ──
const yacht = {
  'don-demo.gag': [
    { id: 'fzm.iy-d1', when: IY, turns: [
      don("In this All-In, change into your swimsuits, climb on an ice yacht, and sail it across the lake to the mine. One steers, one works the sail."),
      beat('He unzips the top of his snowsuit to show them his swimsuit underneath, shivers violently, and zips it straight back up.'),
      don("I'm wearing mine. Under everything. I'm committed. Spiritually."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'fzm.iy-d2', when: IY, turns: [
      don("Tip over, spin out, or sail the wrong way, and you drag your yacht back to the start and try again."),
      don("Pull up at the mine gate, still in your swimsuits, and the next tip is yours. Your skin will thank you later. Much later."),
      beat('An ice yacht shoots past behind him, so fast it whistles.'),
    ] },
  ],
  'task-start.any': [
    { id: 'fzm.iy-s1', when: IY, turns: [
      beat("{a} and {b} come out of the changing hut in their swimsuits, and the cold hits them like a slap."),
      by('a', "I can't. I can't do this. My skin is screaming."),
      by('b', "Get on the yacht! The faster we go, the sooner it's over!"),
    ] },
    { id: 'fzm.iy-s2', when: IY, turns: [
      by('b', "You steer. I'll do the sail. Pull the rope when I say."),
      by('a', "Which rope?"),
      by('b', "The only rope. There's one rope."),
    ] },
    { id: 'fzm.iy-s3', when: IY, turns: [
      beat("The sail fills with wind, and the yacht jerks forward, skates screeching on the ice."),
      by('a', "We're moving! We're actually moving!"),
      by('b', "Steer! Steer away from the other yacht!"),
    ] },
    { id: 'fzm.iy-s4', when: IY, turns: [
      by('a', "Which way is the mine?"),
      by('b', "Towards the big tower with the wheel on it."),
      by('a', "There are three towers with wheels on them."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'fzm.iy-f1', when: IY, turns: [
      beat("The yacht flies across the lake, faster and faster, and slides to a stop right at the mine gate."),
      by('a', "We did it! First go!"),
      by('b', "Where's the tip? Where are my clothes? In that order!"),
    ] },
    { id: 'fzm.iy-f2', when: IY, turns: [
      by('b', "That was the fastest I've ever gone in my life. In a swimsuit."),
      by('a', "My eyelashes froze. Look at them."),
      by('b', "Grab the tip. Admire your eyelashes inside."),
    ] },
    { id: 'fzm.iy-f3', when: IY, turns: [
      beat("{a} and {b} steer the yacht in a perfect line across the lake, the sail tight, and pull up at the gate."),
      by('a', "That was beautiful. That was like flying."),
      by('b', "Flying, but very, very cold."),
    ] },
    { id: 'fzm.iy-f4', when: IY, turns: [
      by('a', "Have you sailed before?"),
      by('b', "Never. Have you?"),
      by('a', "Never. And we just crossed a whole lake."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fzm.iy-a1', when: IY, turns: [
      by('b', "We keep tipping on the turn. So don't turn. Go straight, then stop, then point it, then go."),
      beat('Straight, stop, point, go. It is slow, but they don\'t tip once, and pull up at the mine.'),
      by('a', "Slow and straight! We did it!"),
    ] },
    { id: 'fzm.iy-a2', when: IY, turns: [
      beat("Second try, {b} lets the sail out a little, and the yacht glides instead of racing, all the way to the gate."),
      by('b', "Less wind! Less wind was better!"),
      by('a', "Less wind is always better in a swimsuit."),
    ] },
    { id: 'fzm.iy-a3', when: IY, turns: [
      by('a', "Follow that yacht. That one knows where it's going."),
      beat('They follow the other yacht across the whole lake, right up to the mine gate.'),
      by('b', "We used them! We used them as a map!"),
    ] },
    { id: 'fzm.iy-a4', when: IY, turns: [
      beat("Third time across the ice, frozen to the bone, {a} and {b} finally reach the mine gate still upright."),
      by('a', "Third time! I can't feel my legs, but third time!"),
      by('b', "Clothes! Clothes now!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'fzm.iy-t1', when: IY, turns: [
      beat("The yacht is spinning in slow circles in the middle of the lake, the sail flapping."),
      by('a', "Why are we spinning?"),
      by('b', "Because you're steering one way, and the wind wants the other!"),
    ] },
    { id: 'fzm.iy-t2', when: IY, turns: [
      by('b', "I can't feel my fingers. I can't pull the rope."),
      by('a', "Pull it with your teeth!"),
      by('b', "My teeth are frozen too!"),
    ] },
    { id: 'fzm.iy-t3', when: IY, turns: [
      beat("The wind drops completely. The yacht stops dead in the middle of the ice."),
      by('a', "No wind. There's no wind."),
      by('b', "Then we push it! Get out and push!"),
    ] },
  ],
  'task-done.any': [
    { id: 'fzm.iy-dn1', when: IY, turns: [
      by('a', "I'm never wearing a swimsuit again. Not even at the beach."),
      by('b', "Not even at a hot beach?"),
      by('a', "Especially not at a hot beach. It'll remind me."),
    ] },
    { id: 'fzm.iy-dn2', when: IY, turns: [
      beat("{a} and {b} sprint into the mine office, where their clothes are waiting, and pull on everything at once."),
      by('b', "Two jumpers. I'm wearing two jumpers."),
      by('a', "I'm wearing three, and your scarf."),
    ] },
    { id: 'fzm.iy-dn3', when: IY, turns: [
      by('b', "The tip says 'borehole'. What's a borehole?"),
      by('a', "A very deep, very narrow hole."),
      by('b', "Why did I ask?"),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'fzm.iy-x1', when: IY, turns: [
      beat("A gust catches the sail, the yacht tips onto one skate, and {a} and {b} slide off onto the ice."),
      by('a', "Ow! Ow, cold! Cold, ow!"),
      by('b', "Back to the start! Drag it!"),
    ] },
    { id: 'fzm.iy-x2', when: IY, turns: [
      beat("The yacht sails beautifully, straight, fast, and right past the mine to the wrong side of the lake."),
      by('b', "That was the mine! We just sailed past the mine!"),
      by('a', "Back to the start, then. Of course."),
    ] },
    { id: 'fzm.iy-x3', when: IY, turns: [
      beat("{b} jumps off the yacht to grab a coat from the bank. The judge blows a whistle and points them back to the start."),
      by('b', "It was one coat!"),
      by('a', "It has to be swimsuits! All the way! Back!"),
    ] },
  ],
};

// ── the borehole (Botch or Watch: a goes down, b works the winch) ──
const borehole = {
  'don-demo.gag': [
    { id: 'fzm.bh-d1', when: BH, turns: [
      don("In this Botch or Watch, one of you is lowered down this borehole into a cavern under the ice, with a headlamp, to find a red ball."),
      beat('He leans over the borehole, drops a pebble down it, and waits. He is still waiting when the crew moves on.'),
      don("It's deep. I'm told it's very deep. I'm told that by the pebble."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'fzm.bh-d2', when: BH, turns: [
      don("There are hundreds of white balls down there, and one red one. Bring up a white one, and you go back down."),
      don("The other one of you works the winch at the top, and can only shout. The red ball at the surface gets you the next tip."),
      beat('The winch creaks as a racer disappears down the hole. A very faint scream rises up after them.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'fzm.bh-w1', when: BH, turns: [
      by('b', "You're smaller. You fit in the harness. You go down."),
      by('a', "I'm not smaller. I'm the same size as you."),
      by('b', "You're smaller in spirit. Go."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'fzm.bh-w2', when: BH, turns: [
      by('a', "I'll go. I love caves. I went potholing once."),
      by('b', "How did it go?"),
      by('a', "I got stuck. But I loved it."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'fzm.bh-w3', when: BH, turns: [
      by('b', "Not me. I'm the strong one. I'll work the winch."),
      by('a', "You're not stronger than me."),
      by('b', "I'm stronger at winching. You're stronger at going down holes."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'fzm.bh-w4', when: BH, turns: [
      by('a', "'Who is not afraid of the dark?' You sleep with a night light."),
      by('b', "It's a mood lamp."),
      by('a', "Then I'm going."),
    ] },
  ],
  'task-start.any': [
    { id: 'fzm.bh-s1', when: BH, turns: [
      beat("{a} is strapped into the harness and swings over the borehole, headlamp on, looking down into black nothing."),
      by('a', "How deep is it?"),
      by('b', "Don't ask. Just look for red."),
    ] },
    { id: 'fzm.bh-s2', when: BH, turns: [
      by('b', "Shout when you get to the bottom. Shout when you see red. Shout if anything's wrong."),
      by('a', "So just shout the whole time."),
      by('b', "Yes. Shout the whole time."),
    ] },
    { id: 'fzm.bh-s3', when: BH, turns: [
      beat("The winch turns, and {a} sinks into the hole, the headlamp getting smaller and smaller."),
      by('b', "Can you hear me?"),
      by('a', "Barely! It's so dark down here!"),
    ] },
    { id: 'fzm.bh-s4', when: BH, turns: [
      by('a', "What if I see something down there? Something that isn't a ball?"),
      by('b', "Then you don't bring it up."),
      by('a', "That's not the comfort I wanted."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'fzm.bh-f1', when: BH, turns: [
      beat("Far below, a shout. {b} winches as fast as possible, and {a} rises out of the hole holding a red ball."),
      by('a', "Red! It's red! Look!"),
      by('b', "First try! In the dark! You're amazing!"),
    ] },
    { id: 'fzm.bh-f2', when: BH, turns: [
      by('a', "It was right there! Right under the hole! Like it was waiting for me!"),
      by('b', "Was it scary down there?"),
      by('a', "Terrifying. But I got the ball."),
    ] },
    { id: 'fzm.bh-f3', when: BH, turns: [
      beat("{a}'s headlamp swings across hundreds of white balls, and stops on one red one."),
      by('a', "Found it! Pull me up! Pull me up now!"),
      beat("{b} winches. {a} rises out of the dark, holding up the red ball."),
    ] },
    { id: 'fzm.bh-f4', when: BH, turns: [
      by('b', "That was so quick. Did you even reach the bottom?"),
      by('a', "I reached the bottom, grabbed it, and screamed to come up."),
      by('b', "Efficient."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fzm.bh-a1', when: BH, turns: [
      by('b', "Turn your headlamp off and back on. Red looks different when your eyes adjust."),
      beat("{a} turns the lamp off, then on again, and the red ball is right there by {a.posAdj} foot."),
      by('a', "It worked! It's red! Pull!"),
    ] },
    { id: 'fzm.bh-a2', when: BH, turns: [
      beat("Third trip down. {a} searches for a long time, and finally the winch pulls up a red ball."),
      by('a', "Third time! Finally the right colour!"),
      by('b', "You're shaking. Are you cold, or excited?"),
    ] },
    { id: 'fzm.bh-a3', when: BH, turns: [
      by('a', "Every ball I picked was in the middle. So this time I go to the edge."),
      beat("At the edge of the cavern, half hidden behind a rock, is the red ball."),
      by('b', "The edge! It was at the edge!"),
    ] },
    { id: 'fzm.bh-a4', when: BH, turns: [
      beat("{a} feels every ball by hand, one by one, until finding one that's slightly smaller. It's the red one."),
      by('a', "It's smaller! The red one's smaller than the others!"),
      by('b', "Bring it up! Bring it up now!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'fzm.bh-t1', when: BH, turns: [
      beat("{a}'s voice drifts up the borehole, small and echoing."),
      by('a', "They're all white! Every single one is white!"),
      by('b', "One of them isn't! Keep looking!"),
    ] },
    { id: 'fzm.bh-t2', when: BH, turns: [
      by('b', "Is your headlamp still working?"),
      by('a', "Barely! It's getting dimmer!"),
      by('b', "Then look faster!"),
    ] },
    { id: 'fzm.bh-t3', when: BH, turns: [
      beat("{b} is cranking the winch for the fourth time, arms shaking."),
      by('b', "My arms are gone. My arms have left the race."),
      by('a', "Keep winching! I'm nearly at the top!"),
    ] },
  ],
  'task-done.any': [
    { id: 'fzm.bh-dn1', when: BH, turns: [
      by('a', "The sauna. The tip says the sauna. The Chill Zone is in a sauna."),
      by('b', "A hot room? A warm, hot room?"),
      by('a', "Run. Run now."),
    ] },
    { id: 'fzm.bh-dn2', when: BH, turns: [
      beat("{a} climbs out of the harness, shaking, and hugs {b} for a long time."),
      by('b', "Was it that bad?"),
      by('a', "It was dark, and deep, and full of white balls. It was exactly that bad."),
    ] },
    { id: 'fzm.bh-dn3', when: BH, turns: [
      by('b', "You went down the deepest hole on earth."),
      by('a', "And came back up."),
      by('b', "That's the important part."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'fzm.bh-x1', when: BH, turns: [
      beat("{a} comes up out of the hole holding a ball proudly. It's white."),
      by('a', "It looked red down there!"),
      by('b', "It's white! Everything looks red with that lamp! Back down!"),
    ] },
    { id: 'fzm.bh-x2', when: BH, turns: [
      beat("{a} grabs the red ball, and drops it on the way up. It bounces back down into the dark."),
      by('a', "I dropped it! I had it and I dropped it!"),
      by('b', "Back down! Same spot!"),
    ] },
    { id: 'fzm.bh-x3', when: BH, turns: [
      beat("{a} comes up holding a red ball. The judge looks at it, and turns it over. It's white on the other side."),
      by('a', "Half red counts! Half red is red!"),
      by('b', "It doesn't count! Again!"),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'fzm.bh-v1', when: BH, turns: [
      by('b', "You can do it! You're the bravest person in this mine!"),
      by('a', "I'm the only person in this hole!"),
      by('b', "Then you're the bravest by far!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'fzm.bh-v2', when: BH, turns: [
      beat("{b} leans over the borehole, staring down into the dark, both hands on the winch."),
      by('b', "Say something. Please say something."),
      by('a', "Something! I'm fine! It's just very dark!"),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'fzm.bh-v3', when: BH, turns: [
      beat("{b} drops a torch down the borehole so {a} can see better."),
      by('b', "Use that! It's brighter!"),
      beat('The mine guide shakes her head and writes something down. A penalty.'),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'fzm.bh-v4', when: BH, turns: [
      beat("{b} holds the winch handle without a word, eyes fixed on the rope as it slowly moves."),
      by('a', "Are you still up there?"),
      by('b', "I'm here. I'm just not breathing until you come up."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'fzm.bh-h1', when: BH, turns: [
      beat("While the guide is busy with another team, {b} shouts a description down the hole: the red one's by the north wall."),
      by('a', "How do you know that?"),
      by('b', "The last team said it. Loudly. On the way out."),
    ] },
  ],
};

export default mergePools(place, roads, yacht, borehole);
