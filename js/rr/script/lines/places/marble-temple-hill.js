// Marble Temple Hill's own lines (js/rr/places/marble-temple-hill.js), in our own words:
//   the taxi           up the marble hill: a street too narrow for it.
//   the hurdles        All-In: ten hurdles in the old stadium, side by side, every one cleared; a knock, a fall or a
//                      partner left behind and it's back to the start.
//   the high jump      Botch or Watch: a bar higher than most heads, any way over it, no touch. a jumps, b watches.
//   chariot / wrestle  Either/Or: a full lap in a two-horse chariot without tipping or losing a wheel, or three falls out
//                      of five against the champion in the sand circle.
// Gated on place / taskId / side / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'marble-temple-hill' };
const HU = { taskId: 'hurdles' };
const HJ = { taskId: 'high-jump' };
const AG = { taskId: 'ancient-games' };
const CH = { taskId: 'ancient-games', side: 'chariot' };
const WR = { taskId: 'ancient-games', side: 'wrestle' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'mth.op1', when: P, turns: [
      beat("Don stands among broken white columns on a hilltop, in a toga and a laurel wreath, the sun blazing off the marble."),
      don("Welcome to Marble Temple Hill! Birthplace of the games, of theatre, of democracy, and, I'm told, of the very first argument about whose turn it was."),
      don("Today, teams compete in the ancient games. Running, jumping, chariots, wrestling. Togas are optional. Mine is not."),
      beat('A gust of wind catches the toga. Don grabs it with both hands and holds it very firmly in place.'),
    ] },
    { id: 'mth.op2', when: P, turns: [
      don("Marble Temple Hill. Everything here is three thousand years old, except the gift shop, and the gift shop is somehow more expensive."),
      don("Racers, taxis to the old stadium. The roads are narrow. The drivers are not worried about that. You should be."),
      beat('A taxi squeezes past behind him with about a finger\'s width to spare on each side.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'mth.op3', when: P, turns: [
      beat("Don reclines on a marble step in the shade of a column, eating grapes from a bowl, one at a time."),
      don("Marble Temple Hill. I'm living like an ancient emperor. Taxis are at the bottom of the hill."),
      don("Off you go. Win me some games. I'll be here. Grapes."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'mth.ar1', when: P, turns: [
      beat("The taxi climbs out of the city, and at the top of the hill, the temple appears: great white columns against a perfectly blue sky."),
      by('a', "It's still standing. After all these years."),
      by('b', "Most of it. Look, half the roof's gone."),
      by('a', "I'd be missing half my roof after three thousand years too."),
    ] },
    { id: 'mth.ar2', when: P, turns: [
      by('b', "The sea's so blue. Bluer than any sea I've ever seen."),
      by('a', "Everything here is blue and white. The sea, the sky, the walls."),
      by('b', "It's like the whole place is wearing the same outfit."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'mth.ad1', when: P, turns: [
      by('a', "Hurdles. High jump. Wrestling. It's a sports day."),
      by('b', "I was always last at sports day."),
      by('a', "Me too. We're going to be last at sports day together."),
    ] },
    { id: 'mth.ad2', when: P, turns: [
      by('b', "It's so hot. The marble's too hot to touch."),
      by('a', "And we have to run on it."),
      by('b', "Why does every challenge happen in the hottest place?"),
    ] },
  ],
};

// ── the taxi (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'mth.tm1', when: { taskId: 'stadium-taxi', mishap: 'narrow-street' }, turns: [
      beat("The taxi turns into a street so narrow that both wing mirrors scrape the walls, and then it stops. Completely stuck."),
      by('a', "We're wedged. We're actually wedged."),
      by('b', "The driver's backing out. Very, very slowly."),
      beat('Twenty minutes and one folded wing mirror later, they find another way up the hill.'),
    ] },
  ],
};

// ── the hurdles (All-In) ──
const hurdles = {
  'don-demo.gag': [
    { id: 'mth.hu-d1', when: HU, turns: [
      don("In this All-In, run the hurdles. Ten of them. Both of you, side by side, and every hurdle still standing when you're done."),
      beat('He steps over the first hurdle very carefully, one leg at a time, like climbing over a garden fence.'),
      don("That's not how you're supposed to do it. That's how I do it. I'm not racing."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'mth.hu-d2', when: HU, turns: [
      don("Knock a hurdle, fall, or leave your partner behind, and you walk back to the start and run it again."),
      don("Both of you over the line with ten hurdles still standing gets you the next tip. People ran on this track three thousand years ago. No pressure."),
      beat('A racer behind him clips a hurdle, and it falls, and the next one, and the next, like dominoes.'),
    ] },
  ],
  'task-start.any': [
    { id: 'mth.hu-s1', when: HU, turns: [
      beat("{a} and {b} stand on the start line of the ancient track, looking down a long row of white hurdles."),
      by('a', "They're higher than they look."),
      by('b', "Everything is higher than it looks. Run."),
    ] },
    { id: 'mth.hu-s2', when: HU, turns: [
      by('b', "Same pace. Together. If you go faster, I'll fall behind."),
      by('a', "Then keep up."),
      by('b', "That's not how together works."),
    ] },
    { id: 'mth.hu-s3', when: HU, turns: [
      beat("{a} runs at the first hurdle, panics, and slows to step over it."),
      by('a', "Can I step over them?"),
      by('b', "It's a race! Jump!"),
    ] },
    { id: 'mth.hu-s4', when: HU, turns: [
      by('a', "Count the steps. Three steps between each one."),
      by('b', "Three? I've got short legs. I need four."),
      by('a', "Then you do four and I'll wait."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'mth.hu-f1', when: HU, turns: [
      beat("{a} and {b} fly down the track side by side, clearing every hurdle in step, and cross the line together. Not one hurdle down."),
      by('b', "Ten! All ten standing!"),
      by('a', "We were in perfect time! Like synchronised swimmers! On land!"),
    ] },
    { id: 'mth.hu-f2', when: HU, turns: [
      by('a', "Jump! Land! Run! Jump!"),
      beat("{a} calls every hurdle out loud, and they clear all ten without touching one."),
      by('b', "You were like a coach! A shouty coach!"),
    ] },
    { id: 'mth.hu-f3', when: HU, turns: [
      beat("{a} clips the last hurdle with a heel. It wobbles. It wobbles again. It stays up."),
      by('a', "Is it standing? Please tell me it's standing."),
      by('b', "It's standing! We did it!"),
    ] },
    { id: 'mth.hu-f4', when: HU, turns: [
      by('b', "First go! Clean!"),
      by('a', "Where were we at sports day? Where was this?"),
      by('b', "We were saving it for today."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'mth.hu-a1', when: HU, turns: [
      by('b', "We keep knocking them because we're going too fast. Slower. Higher jumps."),
      beat("Slower and higher, they clear every hurdle, and cross the line side by side."),
      by('a', "Slow and high! That's the answer!"),
    ] },
    { id: 'mth.hu-a2', when: HU, turns: [
      beat("Third run. {a} and {b} hold hands between the hurdles to keep in step, and let go to jump."),
      by('a', "Hold, let go, jump, hold!"),
      beat('All ten hurdles stand. The tip is theirs.'),
    ] },
    { id: 'mth.hu-a3', when: HU, turns: [
      by('a', "I keep leaving you behind. So I run behind you this time. You set the pace."),
      beat("{b} sets the pace. {a} follows. They cross the line together, every hurdle up."),
      by('b', "I'm the pace setter! I've never been the pace setter!"),
    ] },
    { id: 'mth.hu-a4', when: HU, turns: [
      beat("After two runs with hurdles everywhere, {a} and {b} finally make it down the track without knocking one."),
      by('a', "Finally! All of them standing!"),
      by('b', "My shins are covered in bruises, but all of them standing!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'mth.hu-t1', when: HU, turns: [
      beat("{a} is sitting on the track next to a fallen hurdle, holding a shin."),
      by('a', "It came out of nowhere."),
      by('b', "It's been there for three thousand years. It didn't come out of nowhere."),
    ] },
    { id: 'mth.hu-t2', when: HU, turns: [
      by('b', "That's the fourth time. We knock one every single time."),
      by('a', "Always the seventh one. Why is it always the seventh?"),
      by('b', "The seventh one hates us."),
    ] },
    { id: 'mth.hu-t3', when: HU, turns: [
      beat("{a} clears the hurdles beautifully, and looks back to find {b} three hurdles behind."),
      by('a', "Come on! I'm waiting!"),
      by('b', "You're not supposed to be waiting! We're supposed to be together!"),
    ] },
  ],
  'task-done.any': [
    { id: 'mth.hu-dn1', when: HU, turns: [
      by('a', "We ran where the ancient runners ran."),
      by('b', "And we were slower than all of them."),
      by('a', "But we ran there."),
    ] },
    { id: 'mth.hu-dn2', when: HU, turns: [
      beat("{a} and {b} jog over to the high jump, still breathing hard, rubbing their shins."),
      by('b', "High jump now."),
      by('a', "Just one of us, though."),
    ] },
    { id: 'mth.hu-dn3', when: HU, turns: [
      by('b', "My legs feel like jelly."),
      by('a', "Ancient jelly. Very historic jelly."),
      by('b', "That doesn't help."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'mth.hu-x1', when: HU, turns: [
      beat("{b} catches a toe on the fifth hurdle, and it clatters to the ground."),
      by('b', "Sorry! Sorry! It jumped at me!"),
      by('a', "Back to the start!"),
    ] },
    { id: 'mth.hu-x2', when: HU, turns: [
      beat("{a} trips over the third hurdle and goes down in a heap, taking the hurdle with {a.obj}."),
      by('a', "I'm fine! The hurdle isn't!"),
      by('b', "Back to the start! Again!"),
    ] },
    { id: 'mth.hu-x3', when: HU, turns: [
      beat("{a} crosses the line, turns round, and sees {b} still back at hurdle eight."),
      by('a', "We were supposed to finish together!"),
      by('b', "I know! Back to the start!"),
    ] },
  ],
};

// ── the high jump (Botch or Watch: a jumps, b watches) ──
const highJump = {
  'don-demo.gag': [
    { id: 'mth.hj-d1', when: HJ, turns: [
      don("In this Botch or Watch, one of you clears this high jump bar. It's higher than most people's heads. Any way you like, as long as you don't touch it."),
      beat('He runs at the bar, gets to it, and walks underneath it instead.'),
      don("That's the one way you can't do it. Under. Under is not allowed."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'mth.hj-d2', when: HJ, turns: [
      don("Knock the bar, or stop at it, and the bar goes back up and you try again. The other one of you can only watch."),
      don("Clear it clean, and the next tip is yours. The mat is soft. Mostly. Land on the middle bit."),
      beat('A racer behind him flops over the bar backwards and lands perfectly. Don looks impressed against his will.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'mth.hj-w1', when: HJ, turns: [
      by('b', "You're taller. Tall people jump higher. It's science."),
      by('a', "That's not science."),
      by('b', "It's science enough. Go."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'mth.hj-w2', when: HJ, turns: [
      by('a', "I'll jump. I did high jump at school."),
      by('b', "Were you any good?"),
      by('a', "I was there. I was always there."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'mth.hj-w3', when: HJ, turns: [
      by('b', "My legs are gone from the hurdles. You."),
      by('a', "My legs are gone too!"),
      by('b', "Yours are less gone. Go."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'mth.hj-w4', when: HJ, turns: [
      by('a', "'Who can jump?' You jumped over that puddle yesterday."),
      by('b', "I landed in the puddle yesterday."),
      by('a', "But you jumped."),
    ] },
  ],
  'task-start.any': [
    { id: 'mth.hj-s1', when: HJ, turns: [
      beat("{a} stands at the end of the run-up, staring at the bar, which seems to get higher every second."),
      by('a', "Is it getting higher? It's getting higher."),
      by('b', "It's not moving. Just run."),
    ] },
    { id: 'mth.hj-s2', when: HJ, turns: [
      by('b', "Go over backwards. Like the professionals. Head first, arch your back."),
      by('a', "I can't arch my back. I can barely bend."),
      by('b', "Then go forwards. Just go."),
    ] },
    { id: 'mth.hj-s3', when: HJ, turns: [
      beat("{a} runs at the bar, takes off, and flies up, legs kicking."),
      by('b', "Higher! Higher!"),
      by('a', "This is as high as I go!"),
    ] },
    { id: 'mth.hj-s4', when: HJ, turns: [
      by('a', "Which foot do I take off on?"),
      by('b', "The one that's not the other one."),
      by('a', "That's not helpful."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'mth.hj-f1', when: HJ, turns: [
      beat("{a} runs, leaps, twists in mid-air and sails over the bar backwards without touching it."),
      by('b', "You cleared it! First jump!"),
      by('a', "Did I? I had my eyes shut!"),
    ] },
    { id: 'mth.hj-f2', when: HJ, turns: [
      by('a', "Run, jump, fly!"),
      beat("{a} flies over the bar, by a hair, and lands on the mat. The bar doesn't even wobble."),
      by('b', "It didn't move! Not even a wobble!"),
    ] },
    { id: 'mth.hj-f3', when: HJ, turns: [
      beat("{a} takes a huge run-up, jumps forwards like a hurdler, and just clears the bar with both legs tucked."),
      by('b', "That's not a proper high jump!"),
      by('a', "It's over the bar! It counts!"),
    ] },
    { id: 'mth.hj-f4', when: HJ, turns: [
      by('b', "First try! You're an athlete!"),
      by('a', "I've never been called an athlete before."),
      by('b', "Well, now you have."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'mth.hj-a1', when: HJ, turns: [
      by('b', "You keep slowing down before the bar. Run faster. Faster all the way."),
      beat("{a} runs faster all the way, takes off at full speed, and clears the bar easily."),
      by('a', "Speed! Speed was the answer!"),
    ] },
    { id: 'mth.hj-a2', when: HJ, turns: [
      beat("Fourth jump. {a} goes over backwards this time, arching high, and clears the bar."),
      by('a', "Backwards works! I'm a backwards jumper!"),
      by('b', "You're a backwards genius!"),
    ] },
    { id: 'mth.hj-a3', when: HJ, turns: [
      by('a', "I keep clipping it with my heel. So I kick my legs up at the end. Like a frog."),
      beat("{a} jumps, kicks both legs up like a frog at the top, and clears the bar."),
      by('b', "Frog jump! It worked!"),
    ] },
    { id: 'mth.hj-a4', when: HJ, turns: [
      beat("After three knocks, {a} finally soars over the bar without touching it."),
      by('a', "Clean! Finally clean!"),
      by('b', "The bar was getting tired of falling."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'mth.hj-t1', when: HJ, turns: [
      beat("{a} runs up to the bar, and stops dead in front of it, for the third time."),
      by('a', "I can't do it. My legs stop."),
      by('b', "Tell your legs to keep going!"),
    ] },
    { id: 'mth.hj-t2', when: HJ, turns: [
      by('b', "That's five times the bar has fallen."),
      by('a', "It doesn't like me."),
      by('b', "It's a bar. It doesn't like anybody."),
    ] },
    { id: 'mth.hj-t3', when: HJ, turns: [
      beat("{a} lies on the mat after another knocked bar, staring up at the sky."),
      by('a', "I'm just going to lie here for a bit."),
      by('b', "You can lie there after you clear it!"),
    ] },
  ],
  'task-done.any': [
    { id: 'mth.hj-dn1', when: HJ, turns: [
      by('a', "I cleared a high jump. Me."),
      by('b', "You did. I'm so proud."),
      by('a', "My old sports teacher would never believe it."),
    ] },
    { id: 'mth.hj-dn2', when: HJ, turns: [
      beat("{a} and {b} walk towards the temple columns, where a Don Box waits."),
      by('b', "Chariots or wrestling. Which one?"),
      by('a', "Whichever one doesn't involve jumping."),
    ] },
    { id: 'mth.hj-dn3', when: HJ, turns: [
      by('b', "You flew. You actually flew."),
      by('a', "For about a second."),
      by('b', "That's still flying."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'mth.hj-x1', when: HJ, turns: [
      beat("{a} jumps, and the bar comes down with {a.obj} onto the mat."),
      by('a', "It touched me! It came with me!"),
      by('b', "Put it back up! Again!"),
    ] },
    { id: 'mth.hj-x2', when: HJ, turns: [
      beat("{a} runs at the bar, and runs straight underneath it."),
      by('a', "That was an accident!"),
      by('b', "Under isn't over! Again!"),
    ] },
    { id: 'mth.hj-x3', when: HJ, turns: [
      beat("{a} clears the bar with everything except one elbow, which knocks it off on the way down."),
      by('a', "My elbow! My stupid elbow!"),
      by('b', "Tuck your elbows in! Again!"),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'mth.hj-v1', when: HJ, turns: [
      by('b', "Fly! Fly like a bird! Fly like an eagle!"),
      by('a', "Stop saying fly! I can't fly!"),
      by('b', "You can today!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'mth.hj-v2', when: HJ, turns: [
      beat("{b} covers {b.posAdj} eyes every time {a} runs at the bar, and peeks through {b.posAdj} fingers."),
      by('b', "Did it fall? Tell me if it fell."),
      by('a', "Open your eyes and see!"),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'mth.hj-v3', when: HJ, turns: [
      beat("{b} walks over and lowers the bar a notch while {a} is lining up."),
      by('b', "That looks better. That's much fairer."),
      beat('The official puts the bar back up, and writes something on a clipboard. A penalty.'),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'mth.hj-v4', when: HJ, turns: [
      beat("{b} watches from the side in silence, arms folded, nodding along with every step of {a}'s run-up."),
      by('a', "You're very quiet."),
      by('b', "I'm concentrating for both of us."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'mth.hj-h1', when: HJ, turns: [
      beat("While the official looks away, {b} drags the landing mat a little closer to the bar."),
      by('a', "Is the mat closer?"),
      by('b', "Has it always been there? I think it's always been there."),
    ] },
  ],
};

// ── chariot or wrestle (Either/Or) ──
const games = {
  'don-demo.gag': [
    { id: 'mth.ag-d1', when: AG, turns: [
      don("In this Either/Or, the ancient games. Chariot: one of you drives a two-horse chariot round the track, the other holds on in the back. A full lap. No tipping."),
      beat('He pats one of the chariot horses. It turns and looks at him. He stops patting.'),
      don("Or Wrestle: step into the sand circle with the reigning champion, and win three falls out of five. He's undefeated. He's also very oily."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'mth.ag-d2', when: AG, turns: [
      don("Tip the chariot, lose a wheel, or lose the bout, and you try again. You may switch sides. The horses may not."),
      don("A full lap, or three falls, and you win the laurel wreath and the next tip. Wear the wreath. You'll look fantastic."),
      beat('The champion steps into the sand circle behind him, rolls his shoulders, and cracks his neck.'),
    ] },
  ],
  'decide-side.agree': [
    { id: 'mth.ag-c1', when: { ...AG, side: 'chariot' }, turns: [
      by('a', "Chariot. Horses don't hit back."),
      by('b', "Horses kick."),
      by('a', "Horses don't wrestle. Chariot."),
    ] },
    { id: 'mth.ag-c2', when: { ...AG, side: 'wrestle' }, turns: [
      by('b', "Wrestle. It's just pushing. How hard can pushing be?"),
      by('a', "Look at him. He's built like a door."),
      by('b', "Doors can be pushed."),
    ] },
  ],
  'decide-side.overruled': [
    { id: 'mth.ag-c3', when: { ...AG, side: 'wrestle' }, turns: [
      by('a', "I really don't want to wrestle that man."),
      by('b', "The chariot horses look angry. We're wrestling."),
      by('a', "He looks angrier than the horses."),
    ] },
  ],
  'task-start.any': [
    { id: 'mth.ag-s1', when: CH, turns: [
      beat("{a} grabs the reins, {b} grabs the back of the chariot, and the horses lurch forward."),
      by('a', "Which one's the brake?"),
      by('b', "There is no brake! It's a chariot!"),
    ] },
    { id: 'mth.ag-s2', when: CH, turns: [
      by('b', "Take the corners wide. If we go too tight, we tip."),
      by('a', "How wide?"),
      by('b', "Wide. As wide as the track lets you."),
    ] },
    { id: 'mth.ag-s3', when: WR, turns: [
      beat("{a} steps into the sand circle opposite the champion, who smiles, and spreads his arms."),
      by('a', "Hello. I'm going to push you now."),
      beat('The champion laughs, very loudly, very deeply.'),
    ] },
    { id: 'mth.ag-s4', when: WR, turns: [
      by('b', "Go low. Get under him. Push from the legs."),
      by('a', "Have you ever wrestled?"),
      by('b', "My brother. Every Christmas."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'mth.ag-f1', when: CH, turns: [
      beat("{a} drives the chariot round the whole track, taking every corner wide, and crosses the line still on two wheels."),
      by('b', "A full lap! We did it!"),
      by('a', "I'm a charioteer! An actual charioteer!"),
    ] },
    { id: 'mth.ag-f2', when: CH, turns: [
      by('a', "Easy, horses. Easy. Nice and steady."),
      beat("The horses trot round the lap perfectly, calm as anything, and stop exactly at the line."),
      by('b', "You talked to them! They listened!"),
    ] },
    { id: 'mth.ag-f3', when: WR, turns: [
      beat("{a} ducks low, gets under the champion, and pushes him clean out of the circle, three times in a row."),
      by('b', "Three falls! You beat the champion!"),
      by('a', "I can't believe that worked!"),
    ] },
    { id: 'mth.ag-f4', when: WR, turns: [
      by('a', "He was so slippery! But I got him!"),
      beat("The champion picks himself up out of the sand, laughs, and puts the laurel wreath on {a}'s head."),
      by('b', "He gave you the wreath! He's a good loser!"),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'mth.ag-a1', when: CH, turns: [
      by('b', "We tipped on the corner. So slow down for the corner. Then speed up."),
      beat("Slow for the corner, fast for the straight, and the chariot makes it all the way round."),
      by('a', "Slow, then fast! Like a real race!"),
    ] },
    { id: 'mth.ag-a2', when: CH, turns: [
      beat("Second lap. {b} leans into every corner from the back, and the chariot stays on both wheels the whole way."),
      by('b', "I'm the balance! I'm the official balance!"),
      by('a', "A full lap! We did it!"),
    ] },
    { id: 'mth.ag-a3', when: WR, turns: [
      by('a', "He keeps throwing me. So this time, I let him come to me, and step aside."),
      beat("The champion charges. {a} steps aside. He stumbles out of the circle. Again. And again."),
      by('b', "You used his own strength! Like a wise old master!"),
    ] },
    { id: 'mth.ag-a4', when: WR, turns: [
      beat("After losing the first two falls, {a} wins the next three in a row, to everybody's surprise, especially the champion's."),
      by('a', "Three! Three in a row!"),
      by('b', "He looks so confused!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'mth.ag-t1', when: CH, turns: [
      beat("The horses have stopped halfway round the track and are eating grass by the side."),
      by('a', "Go! Go, horses! Please go!"),
      by('b', "They're on a break! Horses take breaks!"),
    ] },
    { id: 'mth.ag-t2', when: WR, turns: [
      by('a', "He's so oily. I can't hold on to anything."),
      by('b', "Grab his belt! He has a belt!"),
      by('a', "The belt's oily too!"),
    ] },
    { id: 'mth.ag-t3', when: AG, turns: [
      by('b', "Should we switch? Maybe the other one's easier."),
      by('a', "The other one has a giant oily man."),
      by('b', "The other one has angry horses. Neither is easy."),
    ] },
  ],
  'task-done.any': [
    { id: 'mth.ag-dn1', when: AG, turns: [
      by('a', "We've got the laurel wreath. We're champions of the ancient games."),
      by('b', "Can we wear it to the Chill Zone?"),
      by('a', "We're wearing it forever."),
    ] },
    { id: 'mth.ag-dn2', when: AG, turns: [
      beat("{a} and {b} jog to the finish line by the ruins, laurel wreaths on their heads, waving to nobody."),
      by('b', "We look like ancient heroes."),
      by('a', "We look like two very sweaty people in leaves."),
    ] },
    { id: 'mth.ag-dn3', when: AG, turns: [
      by('b', "That was the best sports day ever."),
      by('a', "Better than school?"),
      by('b', "We won something this time."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'mth.ag-x1', when: CH, turns: [
      beat("The chariot takes the corner too fast, lifts up onto one wheel, and tips {a} and {b} into the sand."),
      by('a', "Ow! The horses kept going!"),
      by('b', "Catch them! Start again!"),
    ] },
    { id: 'mth.ag-x2', when: WR, turns: [
      beat("The champion lifts {a} off the ground like a bag of shopping and sets {a.obj} down outside the circle."),
      by('a', "He picked me up! He just picked me up!"),
      by('b', "That's a fall! Again!"),
    ] },
    { id: 'mth.ag-x3', when: CH, turns: [
      beat("A wheel comes off the chariot halfway round, and rolls off across the track on its own."),
      by('b', "The wheel! The wheel's leaving!"),
      by('a', "Get it back on! We have to start again!"),
    ] },
  ],
};

export default mergePools(place, roads, hurdles, highJump, games);
