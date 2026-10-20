// Grass Savanna's own lines (js/rr/places/grass-savanna.js), in our own words:
//   the jeep      onto the plains: elephants crossing.
//   the plums     All-In: a woven basket filled from the plum trees while the village children kick footballs at them;
//                 a knocked basket spills, and every plum has to be picked up or picked again.
//   the gourds    Botch or Watch: ten gourds on ten posts, one swing of a cricket bat each, in order; a miss or a wobble
//                 and the row goes back up. a swings, b watches.
//   the safari    All-In: tracks, broken stalks and the ranger's whistles through the tall grass to an animal the
//                 rangers need to tag; a sleepy-dart so it naps; a miss, a spook or the wrong animal and it's tracked again.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'grass-savanna' };
const PL = { taskId: 'plums' };
const GD = { taskId: 'gourds' };
const SF = { taskId: 'safari' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'gsv.op1', when: P, turns: [
      beat("Don stands on the roof of a safari jeep in a khaki shirt and a pith helmet, the golden grass stretching to the horizon, a lone acacia tree behind him."),
      don("Welcome to the Grass Savanna! Lions, elephants, giraffes, and the biggest sky you'll ever see. I've been here two hours and I've already been charged by a warthog."),
      don("Today, teams pick fruit, swing a bat, and go on safari. The real kind. Where the animals are real and this is their home. Not yours. Theirs."),
      beat('A giraffe walks slowly past behind the jeep, bends its long neck down, and sniffs Don\'s helmet.'),
    ] },
    { id: 'gsv.op2', when: P, turns: [
      don("The Grass Savanna. It's beautiful at sunrise, beautiful at sunset, and absolutely boiling in between."),
      don("Racers, jeeps leave from the camp. Stay in the jeep. Don't feed anything. Don't pet anything. Don't wave at the lions."),
      beat('In the distance, a lion lifts its head, yawns enormously, and lies back down.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'gsv.op3', when: P, turns: [
      beat("Don lies in a hammock strung between two jeeps, a fan clipped to his helmet, a cold drink in hand."),
      don("Grass Savanna. Too hot to move. Jeeps are at the camp."),
      don("Off you go. Watch out for anything with teeth. Which is everything."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'gsv.ar1', when: P, turns: [
      beat("The jeep bumps out onto the open plain, and a herd of zebras gallops alongside, then an elephant lifts its trunk in the distance."),
      by('a', "Zebras! Real zebras! Running next to us!"),
      by('b', "And an elephant! Look, there's a baby one!"),
      by('a', "This is the best moment of my whole life."),
    ] },
    { id: 'gsv.ar2', when: P, turns: [
      by('b', "The sky's so big. It goes all the way down to the ground."),
      by('a', "There's nothing in the way. Just grass and sky."),
      by('b', "And a giraffe. Grass, sky and a giraffe."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'gsv.ad1', when: P, turns: [
      by('a', "The tip says 'safari'. On foot. Not in the jeep."),
      by('b', "On foot? With the lions?"),
      by('a', "There's a ranger. It says there's a ranger."),
    ] },
    { id: 'gsv.ad2', when: P, turns: [
      by('b', "'Who can swing a bat?' I've never played anything with a bat."),
      by('a', "You've swung at a fly with a newspaper."),
      by('b', "That's not the same."),
    ] },
  ],
};

// ── the jeep (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'gsv.tm1', when: { taskId: 'safari-jeep', mishap: 'elephants-crossing' }, turns: [
      beat("The jeep stops. A whole family of elephants is crossing the track, slowly, the babies holding on to the tails in front."),
      by('a', "We have to wait, don't we?"),
      by('b', "You always wait for elephants. Always."),
      beat('Twenty minutes later, the last baby elephant trots across, and the jeep rumbles on.'),
    ] },
  ],
};

// ── the plums (All-In) ──
const plums = {
  'don-demo.gag': [
    { id: 'gsv.pl-d1', when: PL, turns: [
      don("In this All-In, fill a basket with plums from these trees. While the village children kick footballs at you. For fun. Their fun."),
      beat('A football flies past and hits Don squarely on the helmet. A crowd of children cheers.'),
      don("Good shot. Very good shot. That's the level you're dealing with."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'gsv.pl-d2', when: PL, turns: [
      don("If a ball knocks your basket over, you pick up every plum, or you pick new ones. A full basket, carried to the elder, gets you the next tip."),
      don("The children have been practising all week. They're very, very good. You will be hit."),
      beat('A row of grinning children stands by the trees, each with a football at their feet.'),
    ] },
  ],
  'task-start.any': [
    { id: 'gsv.pl-s1', when: PL, turns: [
      beat("{a} reaches up for the first plum, and a football bounces off {a.posAdj} back."),
      by('a', "Ow! It's started! They've started!"),
      by('b', "Pick faster! Pick faster!"),
    ] },
    { id: 'gsv.pl-s2', when: PL, turns: [
      by('b', "I'll guard the basket. You pick. Throw them to me."),
      by('a', "What if you drop them?"),
      by('b', "I won't drop them. Probably."),
    ] },
    { id: 'gsv.pl-s3', when: PL, turns: [
      beat("{a} ducks a ball, reaches for a plum, ducks another, and grabs it."),
      by('a', "Got one! Got one!"),
      by('b', "Only about a hundred to go!"),
    ] },
    { id: 'gsv.pl-s4', when: PL, turns: [
      by('a', "Why are they so good at kicking?"),
      by('b', "Because they play every single day."),
      by('a', "And we're the targets today."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'gsv.pl-f1', when: PL, turns: [
      beat("{a} picks, {b} guards the basket with {b.posAdj} whole body, and the basket fills without a single spill."),
      by('b', "Full! It's full!"),
      by('a', "And you took about fifty footballs for it!"),
    ] },
    { id: 'gsv.pl-f2', when: PL, turns: [
      by('a', "Kick it back! Kick one back!"),
      beat("{b} kicks a ball back to the children. They cheer, kick it back, and a game breaks out while {a} fills the basket."),
      by('b', "They're playing with me! Fill it! Fill it now!"),
    ] },
    { id: 'gsv.pl-f3', when: PL, turns: [
      beat("{a} and {b} carry the brimming basket to the village elder, who laughs, and hands over the tip."),
      by('b', "First try! Not one spill!"),
      by('a', "Covered in bruises, but not one spill."),
    ] },
    { id: 'gsv.pl-f4', when: PL, turns: [
      by('b', "The children are clapping!"),
      by('a', "For us or for their aim?"),
      by('b', "Let's say for us."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gsv.pl-a1', when: PL, turns: [
      by('b', "We keep getting knocked over because we're in the open. Pick from the trees by the wall. They can't reach."),
      beat("By the wall, the footballs can't reach them, and the basket fills in no time."),
      by('a', "The wall! We should have used the wall from the start!"),
    ] },
    { id: 'gsv.pl-a2', when: PL, turns: [
      beat("Second basket. This time {b} sits on the basket lid between every handful, so nothing can knock it over."),
      by('b', "Sitting on it! Can't spill if I'm sitting on it!"),
      by('a', "Full! Take it to the elder!"),
    ] },
    { id: 'gsv.pl-a3', when: PL, turns: [
      by('a', "Let's teach them a game. If they're playing, they're not kicking at us."),
      beat("{a} starts a game of keepy-uppy with the children. While they're busy, {b} fills the basket."),
      by('b', "Genius! You're a genius!"),
    ] },
    { id: 'gsv.pl-a4', when: PL, turns: [
      beat("After two spilled baskets and a lot of bruises, {a} and {b} finally carry a full basket to the elder."),
      by('a', "Third basket! Finally!"),
      by('b', "I'm going to dream about footballs."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'gsv.pl-t1', when: PL, turns: [
      beat("{a} and {b} are pinned behind a tree, footballs bouncing off it from every direction."),
      by('a', "We're surrounded!"),
      by('b', "They're just children!"),
      by('a', "They're very, very good children!"),
    ] },
    { id: 'gsv.pl-t2', when: PL, turns: [
      by('b', "That's the third time they've knocked it over."),
      by('a', "There are plums everywhere."),
      by('b', "Pick them up! All of them!"),
    ] },
    { id: 'gsv.pl-t3', when: PL, turns: [
      beat("A football hits the basket out of {b}'s arms just as it's nearly full."),
      by('b', "No! It was nearly full!"),
      by('a', "The children are cheering. That's not fair."),
    ] },
  ],
  'task-done.any': [
    { id: 'gsv.pl-dn1', when: PL, turns: [
      by('a', "I've been hit by more footballs today than in my whole life."),
      by('b', "And you never once played football."),
      by('a', "Exactly."),
    ] },
    { id: 'gsv.pl-dn2', when: PL, turns: [
      beat("{a} and {b} wave goodbye to the village children, who wave back, then kick one last ball at them."),
      by('b', "They're lovely."),
      by('a', "They're lovely and deadly."),
    ] },
    { id: 'gsv.pl-dn3', when: PL, turns: [
      by('b', "Can we eat a plum?"),
      by('a', "They're the elder's plums now."),
      by('b', "He gave me one. Look."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gsv.pl-x1', when: PL, turns: [
      beat("A football slams into the basket, and plums go rolling in every direction across the dust."),
      by('a', "No! The plums!"),
      by('b', "Pick them up! Every single one!"),
    ] },
    { id: 'gsv.pl-x2', when: PL, turns: [
      beat("The elder looks into the basket, and shakes his head. It's not full enough."),
      by('a', "It's nearly full!"),
      by('b', "Nearly isn't full! More plums!"),
    ] },
    { id: 'gsv.pl-x3', when: PL, turns: [
      beat("{b} trips over a football while carrying the basket, and the plums go flying."),
      by('b', "That ball wasn't there a second ago!"),
      by('a', "The children put it there! Pick them up!"),
    ] },
  ],
};

// ── the gourds (Botch or Watch: a swings, b watches) ──
const gourds = {
  'don-demo.gag': [
    { id: 'gsv.gd-d1', when: GD, turns: [
      don("In this Botch or Watch, smash ten gourds off ten posts with this cricket bat. One swing each. In order. No misses."),
      beat('He swings the bat at the first gourd, misses completely, spins round, and sits down in the dust.'),
      don("Like that, but the opposite of that."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'gsv.gd-d2', when: GD, turns: [
      don("Miss one, or leave one wobbling on its post, and all ten go back up and you start the row again. The other one of you watches."),
      don("Ten gourds, ten swings, and the next tip is yours. The gourds are very hard. Swing like you mean it."),
      beat('A racer behind him smashes a gourd so hard it flies off into the grass and startles a family of birds.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'gsv.gd-w1', when: GD, turns: [
      by('b', "You did the last one? No, that was me. So you're swinging."),
      by('a', "I've never held a cricket bat."),
      by('b', "It's like a flat stick. You've held a stick."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'gsv.gd-w2', when: GD, turns: [
      by('a', "I'll swing. I played rounders at school."),
      by('b', "Were you good?"),
      by('a', "I hit the teacher once. By accident. Very hard."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'gsv.gd-w3', when: GD, turns: [
      by('b', "My arms are dead from the plums. You."),
      by('a', "My arms are dead too!"),
      by('b', "Less dead than mine. Go."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'gsv.gd-w4', when: GD, turns: [
      by('a', "'Who can swing a bat?' You can. You've got a great swing."),
      by('b', "That's golf. That's a golf swing."),
      by('a', "A swing's a swing."),
    ] },
  ],
  'task-start.any': [
    { id: 'gsv.gd-s1', when: GD, turns: [
      beat("{a} stands in front of the first post, cricket bat raised, a hard round gourd balanced on top."),
      by('a', "Ten in a row. No misses."),
      by('b', "One at a time. Just this one."),
    ] },
    { id: 'gsv.gd-s2', when: GD, turns: [
      by('b', "Eye on the gourd. Don't look at the next one. Just the one in front."),
      by('a', "What if I hit the post?"),
      by('b', "Then you'll have a very sore arm."),
    ] },
    { id: 'gsv.gd-s3', when: GD, turns: [
      beat("{a} swings. CRACK. The first gourd flies off its post into the grass."),
      by('a', "One! One down!"),
      by('b', "Nine to go! Keep going!"),
    ] },
    { id: 'gsv.gd-s4', when: GD, turns: [
      by('a', "How hard do I hit them?"),
      by('b', "Hard enough that they fall off."),
      by('a', "That's very helpful."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'gsv.gd-f1', when: GD, turns: [
      beat("CRACK, CRACK, CRACK, down the whole row, ten swings, ten gourds, not one miss."),
      by('b', "Ten! All ten! First go!"),
      by('a', "I'm a cricketer! I'm a gourd cricketer!"),
    ] },
    { id: 'gsv.gd-f2', when: GD, turns: [
      by('a', "Swing, step, swing, step."),
      beat("{a} works down the row like a machine, and the last gourd explodes off its post."),
      by('b', "That was beautiful. That was poetry."),
    ] },
    { id: 'gsv.gd-f3', when: GD, turns: [
      beat("The tenth gourd flies so far off its post that it disappears into the tall grass, and a bird squawks somewhere."),
      by('b', "Sorry, bird! But that's ten!"),
      by('a', "First try! Ten for ten!"),
    ] },
    { id: 'gsv.gd-f4', when: GD, turns: [
      by('b', "First go, not a single miss."),
      by('a', "My arms are buzzing."),
      by('b', "That's the feeling of winning."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gsv.gd-a1', when: GD, turns: [
      by('b', "You keep missing because you're swinging too early. Wait until you're right in front of it."),
      beat("{a} waits until right in front of each post, swings, and clears all ten."),
      by('a', "Wait, then swing! That's the secret!"),
    ] },
    { id: 'gsv.gd-a2', when: GD, turns: [
      beat("Third row. {a} swings slower this time, but harder, and every gourd drops off its post."),
      by('a', "Slow and hard! Slow and hard!"),
      by('b', "Ten! That's ten!"),
    ] },
    { id: 'gsv.gd-a3', when: GD, turns: [
      by('a', "The last one always wobbles. So I hit it from below. Up and over."),
      beat("{a} swings up at the last gourd, and it flies clean off the post."),
      by('b', "Up and over! Brilliant!"),
    ] },
    { id: 'gsv.gd-a4', when: GD, turns: [
      beat("After two broken rows, {a} finally clears all ten gourds in ten swings."),
      by('a', "Finally! Ten for ten!"),
      by('b', "The posts look relieved."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'gsv.gd-t1', when: GD, turns: [
      beat("{a} has hit the post three times in a row instead of the gourd, and is shaking out {a.posAdj} hands."),
      by('a', "That hurts. That really hurts."),
      by('b', "Aim higher! The gourd's on top!"),
    ] },
    { id: 'gsv.gd-t2', when: GD, turns: [
      by('b', "That's the fifth time we've got to number eight."),
      by('a', "Number eight hates me."),
      by('b', "Number eight is a gourd. It doesn't hate anyone."),
    ] },
    { id: 'gsv.gd-t3', when: GD, turns: [
      beat("{a} swings, hits the gourd, and it wobbles, and wobbles, and stays on the post."),
      by('a', "Fall! Fall off! Please fall!"),
      by('b', "It's not falling! Back to the start!"),
    ] },
  ],
  'task-done.any': [
    { id: 'gsv.gd-dn1', when: GD, turns: [
      by('a', "I never knew I had it in me."),
      by('b', "Gourd-smashing?"),
      by('a', "Gourd-smashing. It's my hidden talent."),
    ] },
    { id: 'gsv.gd-dn2', when: GD, turns: [
      beat("{a} and {b} walk away from the row of empty posts, {a} still swinging the bat at the air."),
      by('b', "You can put the bat down now."),
      by('a', "I'm keeping it. In case of gourds."),
    ] },
    { id: 'gsv.gd-dn3', when: GD, turns: [
      by('b', "Safari next. On foot."),
      by('a', "Can I bring the bat?"),
      by('b', "No."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gsv.gd-x1', when: GD, turns: [
      beat("{a} swings at the sixth gourd and misses it completely, spinning round in a circle."),
      by('a', "Where did it go? It was right there!"),
      by('b', "It's still there! You missed! Back to the start!"),
    ] },
    { id: 'gsv.gd-x2', when: GD, turns: [
      beat("{a} clips the ninth gourd. It spins on the post, wobbles, and settles back down."),
      by('a', "It moved! It definitely moved!"),
      by('b', "It's still on! All ten back up!"),
    ] },
    { id: 'gsv.gd-x3', when: GD, turns: [
      beat("The bat slips out of {a}'s sweaty hands on the backswing and flies off into the grass."),
      by('a', "I let go! Why did I let go?"),
      by('b', "Go and get it! Start again!"),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'gsv.gd-v1', when: GD, turns: [
      by('b', "Smash it! Smash it! You're a gourd destroyer!"),
      by('a', "I'm trying to concentrate!"),
      by('b', "Concentrate on destroying!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'gsv.gd-v2', when: GD, turns: [
      beat("{b} counts every gourd under {b.posAdj} breath, flinching every time the bat swings."),
      by('b', "Seven. Eight. Please, nine."),
      by('a', "Stop counting out loud!"),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'gsv.gd-v3', when: GD, turns: [
      beat("{b} runs over and steadies the next gourd on its post with one hand."),
      by('b', "Now it won't wobble! Swing!"),
      beat("A ranger whistles and waves {b} away from the posts. A penalty."),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'gsv.gd-v4', when: GD, turns: [
      beat("{b} stands perfectly still at the end of the row, nodding along with every swing."),
      by('a', "You're very quiet."),
      by('b', "I don't want to jinx it."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'gsv.gd-h1', when: GD, turns: [
      beat("While the ranger looks out at the plain, {b} quietly pushes a wobbly gourd a little further off its post."),
      by('a', "That one looks easier."),
      by('b', "Does it? Lucky you. Swing."),
    ] },
  ],
};

// ── the safari (All-In) ──
const safari = {
  'don-demo.gag': [
    { id: 'gsv.sf-d1', when: SF, turns: [
      don("In this All-In, follow the ranger into the tall grass, track an animal the rangers need to tag, and hit it with a sleepy-dart so it naps."),
      beat('He raises a blowpipe to show them, blows, and the dart drops out of the end at his feet.'),
      don("Don't do that. Blow harder than that. Much, much harder."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'gsv.sf-d2', when: SF, turns: [
      don("Miss, spook it, or creep up on the wrong animal entirely, and you fall back and track it again."),
      don("A tagged, sleeping animal gets you the next tip. It wakes up in ten minutes, feeling great. Don't be there when it does."),
      beat("Somewhere in the tall grass, something large moves, and the grass parts, and closes again."),
    ] },
  ],
  'task-start.any': [
    { id: 'gsv.sf-s1', when: SF, turns: [
      beat("{a} and {b} creep into the tall grass behind the ranger, the grass so high it closes over their heads."),
      by('a', "I can't see anything. Just grass."),
      by('b', "Follow the ranger's whistles."),
    ] },
    { id: 'gsv.sf-s2', when: SF, turns: [
      by('b', "Tracks. Big ones. It went this way."),
      by('a', "How big?"),
      by('b', "Bigger than both our feet together."),
    ] },
    { id: 'gsv.sf-s3', when: SF, turns: [
      beat("{a} crouches low, blowpipe ready, and peers through a gap in the grass."),
      by('a', "There's something there. Something brown."),
      by('b', "Is it our animal?"),
    ] },
    { id: 'gsv.sf-s4', when: SF, turns: [
      by('a', "What happens if it wakes up?"),
      by('b', "We run."),
      by('a', "That's the whole plan?"),
    ] },
  ],
  'task-try.first-try': [
    { id: 'gsv.sf-f1', when: SF, turns: [
      beat("{a} creeps close, raises the blowpipe, and puffs. The dart lands perfectly. The animal yawns, lies down, and starts to snore."),
      by('b', "It's asleep! First dart!"),
      by('a', "It's snoring! I made it snore!"),
    ] },
    { id: 'gsv.sf-f2', when: SF, turns: [
      by('a', "Shh. Don't move. It hasn't seen us."),
      beat("{b} raises the blowpipe, blows, and the dart hits home. The ranger tags the sleeping animal's ear."),
      by('b', "We tracked it! We actually tracked it!"),
    ] },
    { id: 'gsv.sf-f3', when: SF, turns: [
      beat("The ranger whistles twice, {a} and {b} freeze, and the animal walks right past them, close enough to touch."),
      by('a', "Now! From behind! Now!"),
      beat("One dart. One sleepy animal. The ranger gives them a thumbs up."),
    ] },
    { id: 'gsv.sf-f4', when: SF, turns: [
      by('b', "First try! Real safari! Real animal!"),
      by('a', "It looked so peaceful asleep."),
      by('b', "Let's go before it isn't."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gsv.sf-a1', when: SF, turns: [
      by('b', "We keep spooking it because we talk. No talking. Not one word."),
      beat("Not one word. They creep up in total silence, and the dart lands. The animal naps."),
      by('a', "Silence works! It works!"),
    ] },
    { id: 'gsv.sf-a2', when: SF, turns: [
      beat("Second try. This time {a} stays downwind, like the ranger said, and gets close enough for an easy dart."),
      by('a', "Downwind! It couldn't smell us!"),
      by('b', "And it's asleep! Tag it!"),
    ] },
    { id: 'gsv.sf-a3', when: SF, turns: [
      by('a', "That was the wrong animal. Ours has a white patch. Look for the patch."),
      beat("They look for the patch, find the right animal by a watering hole, and dart it."),
      by('b', "The patch! It was all about the patch!"),
    ] },
    { id: 'gsv.sf-a4', when: SF, turns: [
      beat("After two missed darts and a long chase through the grass, {a} finally puts their animal to sleep."),
      by('a', "Finally! Nap time!"),
      by('b', "I've walked about ten miles in this grass."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'gsv.sf-t1', when: SF, turns: [
      beat("{a} and {b} are lost in the tall grass, turning in circles, the ranger's whistle nowhere."),
      by('a', "Which way was the whistle?"),
      by('b', "Everywhere. It came from everywhere."),
    ] },
    { id: 'gsv.sf-t2', when: SF, turns: [
      by('b', "That's three darts in the grass."),
      by('a', "It keeps moving!"),
      by('b', "That's what animals do!"),
    ] },
    { id: 'gsv.sf-t3', when: SF, turns: [
      beat("Something huge and grey steps out of the grass in front of them. It is definitely not the animal they're looking for."),
      by('a', "That's an elephant. That's a whole elephant."),
      by('b', "Back away. Slowly. Very slowly."),
    ] },
  ],
  'task-done.any': [
    { id: 'gsv.sf-dn1', when: SF, turns: [
      by('a', "We went on a real safari. On foot."),
      by('b', "And we're still alive."),
      by('a', "That's the best part."),
    ] },
    { id: 'gsv.sf-dn2', when: SF, turns: [
      beat("{a} and {b} walk out of the tall grass onto the open plain, the sun going down, gold and orange."),
      by('b', "Look at that sunset."),
      by('a', "Look at it quickly. Then run."),
    ] },
    { id: 'gsv.sf-dn3', when: SF, turns: [
      by('b', "It's going to wake up and wonder why its ear has a tag."),
      by('a', "And it'll never know it was us."),
      by('b', "Our secret."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gsv.sf-x1', when: SF, turns: [
      beat("{a} steps on a dry branch. Crack. The animal's head jerks up, and it bolts off through the grass."),
      by('a', "Sorry! The branch was there!"),
      by('b', "It's gone! Track it again!"),
    ] },
    { id: 'gsv.sf-x2', when: SF, turns: [
      beat("{a} blows the dart. It sails over the animal's back and into a bush."),
      by('a', "Too high! Too high!"),
      by('b', "It's running! After it!"),
    ] },
    { id: 'gsv.sf-x3', when: SF, turns: [
      beat("They creep up on a large brown shape in the grass, and it turns out to be a rock."),
      by('a', "We've been stalking a rock."),
      by('b', "For ten minutes. Back to the tracks."),
    ] },
  ],
};

export default mergePools(place, roads, plums, gourds, safari);
