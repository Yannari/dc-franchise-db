// Haunted Castle's own lines (js/rr/places/haunted-castle.js), 1:1 with the real leg ("A Tisket, a Casket, I'm Gonna
// Blow a Gasket"), in our own words:
//   the road       a taxi up the pass: fog.
//   the coffin     All-In: find the coffin with your names on it; a pushes, b lies inside, out of the castle and down
//                  to the graveyard; tip it, lose the lid or take the wrong path and it's back to the castle gate.
//   the ride       on horseback to the gym: the horse wanders off.
//   the gym        Botch or Watch: a full split on the beam, a somersault onto the vault, for a coach who is never
//                  pleased. a performs, b watches.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'haunted-castle' };
const CF = { taskId: 'coffin' };
const GY = { taskId: 'gym' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'hcs.op1', when: P, turns: [
      beat('Don stands at the gates of a dark castle on a hill. Thunder rolls. A bat flies past his head and he ducks.'),
      don("Welcome to the Haunted Castle! Home of vampires, legends, and a gift shop that sells plastic fangs for forty dollars."),
      don("Today, one of you climbs into a coffin. The other one pushes. Nobody asked me if that was a good idea."),
      beat('Lightning flashes. For a second, Don seems to have no reflection in the puddle. He checks. He does.'),
    ] },
    { id: 'hcs.op2', when: P, turns: [
      don("The Haunted Castle. Built six hundred years ago, haunted for about five hundred and ninety-nine of them."),
      don("Racers, the castle is up there. Your coffins are waiting. Try not to get too comfortable in them."),
      beat('Somewhere in the castle, an organ starts playing. Nobody on the crew knows who is playing it.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'hcs.op3', when: P, turns: [
      beat('Don is sitting in a velvet chair in the castle hall, wearing a cape, sipping something red from a goblet.'),
      don("It's tomato juice. Relax. The Haunted Castle. Coffins, a graveyard, a gym. In that order."),
      don("Off you go. I'll be here. In my chair. Being mysterious."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'hcs.ar1', when: P, turns: [
      beat('The taxi comes round the last bend, and the castle appears above the trees, black against the sky, every window dark.'),
      by('a', "That's a real castle. A real, actual, spooky castle."),
      by('b', "I've seen this castle in films. Every time, somebody goes in and doesn't come out."),
      by('a', "That's just films."),
    ] },
    { id: 'hcs.ar2', when: P, turns: [
      beat('A long row of coffins stands in the great hall, each one with a name painted on the lid.'),
      by('b', "That one's got our names on it."),
      by('a', "That's the creepiest thing I've ever seen with my name on it."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'hcs.ad1', when: P, turns: [
      by('a', "It says 'coffin'. Then 'graveyard'. Then 'gym'. What is this leg?"),
      by('b', "A very strange day out."),
      by('a', "A very strange day out that ends in a gym."),
    ] },
    { id: 'hcs.ad2', when: P, turns: [
      beat('A crow lands on the castle gate and caws, very loudly, right at {a}.'),
      by('a', "It's warning us. That's a warning crow."),
      by('b', "It's a crow. Crows just do that."),
    ] },
  ],
};

// ── the road and the ride (mishaps) ──
const roads = {
  'travel-mishap.any': [
    { id: 'hcs.tm1', when: { taskId: 'castle-road', mishap: 'fog-on-the-pass' }, turns: [
      beat('Halfway up the pass, the fog rolls in so thick the driver slows to walking pace.'),
      by('a', "I can't see the road. Can he see the road?"),
      by('b', "He's driving with his head out of the window. I don't think he can see the road."),
      beat('Twenty minutes later, the fog lifts, and the castle is right in front of them.'),
    ] },
    { id: 'hcs.tm2', when: { taskId: 'ride', mishap: 'horse-wanders-off' }, turns: [
      beat("{a}'s horse stops in the middle of the road, turns round, and starts walking back to the graveyard."),
      by('a', "Wrong way! Wrong way, horse!"),
      by('b', "Pull on the reins! The left one! No, the other left!"),
      beat('It takes twenty minutes and an apple to convince the horse to go towards the gym.'),
    ] },
  ],
};

// ── the coffin (All-In: a pushes, b lies inside) ──
const coffin = {
  'don-demo.gag': [
    { id: 'hcs.cf-d1', when: CF, turns: [
      don("In this All-In, find the coffin with your names on it. Then one of you lies in it, and the other pushes it all the way to the graveyard."),
      beat('He lies down in an open coffin to show them, crosses his arms over his chest, and the lid slams shut.'),
      don("...Can someone open this? Hello? This isn't funny. Okay, it's a little funny. Open it."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'hcs.cf-d2', when: CF, turns: [
      don("Tip it over, lose the lid, or take the wrong path, and you go back to the castle gate and start pushing again."),
      don("The grave digger at the graveyard has your next tip. He doesn't talk much. He doesn't need to."),
      beat('Down the hill, the grave digger leans on his shovel and stares up at the castle, unblinking.'),
    ] },
  ],
  'task-start.any': [
    { id: 'hcs.cf-s1', when: CF, turns: [
      beat('{b} lies down in the coffin, arms crossed, very still. {a} looks down at {b.obj}.'),
      by('a', "This is the strangest thing I've ever done."),
      by('b', "Just push. And don't close the lid. Never close the lid."),
    ] },
    { id: 'hcs.cf-s2', when: CF, turns: [
      by('b', "Why am I the one in the coffin?"),
      by('a', "Because I'm holding the tip. Tip holder pushes. Those are the rules."),
      by('b', "I want it noted that I'm not happy about this."),
    ] },
    { id: 'hcs.cf-s3', when: CF, turns: [
      beat('{a} and {b} walk along the row of coffins, reading the names painted on every lid.'),
      by('a', "Not us. Not us. Not us. Somebody who is definitely not us."),
      by('b', "Here! This one! It's got our names, spelled wrong."),
    ] },
    { id: 'hcs.cf-s4', when: CF, turns: [
      by('a', "It's on little wheels. Why is it on little wheels?"),
      by('b', "So you can push it. Obviously."),
      by('a', "Obviously. Every coffin has wheels."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'hcs.cf-f1', when: CF, turns: [
      beat('{a} pushes the coffin out of the gate and down the hill in one long, careful run, and stops it right at the graveyard.'),
      by('b', "Are we there? Can I get out?"),
      by('a', "We're there. You can rise from the dead now."),
    ] },
    { id: 'hcs.cf-f2', when: CF, turns: [
      by('b', "That was smooth. That was actually smooth. Have you done this before?"),
      by('a', "I've pushed a lot of shopping trolleys."),
      beat('The grave digger hands over the tip without a word.'),
    ] },
    { id: 'hcs.cf-f3', when: CF, turns: [
      beat("{a} steers the coffin down the path through the gravestones like a professional, never touching a single one."),
      by('b', "I can't see anything. Are we hitting graves? Tell me we're not hitting graves."),
      by('a', "We're not hitting graves. We're nearly there."),
    ] },
    { id: 'hcs.cf-f4', when: CF, turns: [
      by('a', "First try. Nothing tipped, nothing fell, nobody screamed."),
      by('b', "I screamed a little."),
      by('a', "Nobody screamed loudly."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'hcs.cf-a1', when: CF, turns: [
      by('b', "Slower down the hill this time. The hill is where it always goes wrong."),
      beat('{a} takes the hill at a crawl, and the coffin rolls into the graveyard without a wobble.'),
      by('a', "Slow and steady. Like a funeral."),
    ] },
    { id: 'hcs.cf-a2', when: CF, turns: [
      beat('This time, {b} holds the lid on from inside, and {a} pushes all the way down without stopping.'),
      by('b', "Is the lid still on?"),
      by('a', "The lid is on, you're in, and we're at the graveyard. Out you come."),
    ] },
    { id: 'hcs.cf-a3', when: CF, turns: [
      by('a', "Left at the big angel. Not right. Left."),
      beat('Left at the big angel takes them straight to the grave digger, who hands over the tip.'),
      by('b', "The angel knew all along."),
    ] },
    { id: 'hcs.cf-a4', when: CF, turns: [
      beat('Third push from the castle gate. {a} is sweating, but the coffin reaches the graveyard upright.'),
      by('a', "We did it. Third time. My arms are gone."),
      by('b', "You can have a turn in the coffin next time."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'hcs.cf-t1', when: CF, turns: [
      beat('The coffin is stuck in a rut on the hill, one wheel spinning in the mud.'),
      by('a', "It won't move. It's stuck."),
      by('b', "Then I'm getting out to help."),
      by('a', "You can't! You have to stay in the coffin!"),
    ] },
    { id: 'hcs.cf-t2', when: CF, turns: [
      by('b', "Is it me, or are we going in circles?"),
      by('a', "Every path looks the same. Every grave looks the same."),
      by('b', "That's because it's a graveyard."),
    ] },
    { id: 'hcs.cf-t3', when: CF, turns: [
      beat('{a} has to stop every few metres to catch {a.posAdj} breath, leaning on the coffin.'),
      by('b', "Are we there yet?"),
      by('a', "Ask me that one more time and I'm closing the lid."),
    ] },
  ],
  'task-done.any': [
    { id: 'hcs.cf-dn1', when: CF, turns: [
      by('b', "I'm alive! I've come back from the dead!"),
      by('a', "You were never dead. You were having a nap in a box."),
      by('b', "A very spooky nap."),
    ] },
    { id: 'hcs.cf-dn2', when: CF, turns: [
      beat('{b} climbs out of the coffin and stretches, as the grave digger watches without a word.'),
      by('b', "Thank you. That was a lovely coffin."),
      by('a', "Don't thank the grave digger. It's weird."),
    ] },
    { id: 'hcs.cf-dn3', when: CF, turns: [
      by('a', "Horses. The tip says horses. To the gym."),
      by('b', "Horses to a gym. In a haunted castle. This leg makes no sense."),
      by('a', "None of them make sense. That's the race."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'hcs.cf-x1', when: CF, turns: [
      beat('The coffin hits a stone halfway down the hill and tips over, rolling {b} out onto the grass.'),
      by('b', "Ow! I've fallen out of my own coffin!"),
      by('a', "Back to the gate! We have to start again!"),
    ] },
    { id: 'hcs.cf-x2', when: CF, turns: [
      beat('The lid slides off on a bump and clatters away down the hill without them.'),
      by('a', "The lid! Where's the lid going?"),
      by('b', "Faster than us, apparently."),
    ] },
    { id: 'hcs.cf-x3', when: CF, turns: [
      beat('{a} pushes the coffin proudly up to a grave digger, who points at a completely different graveyard on the next hill.'),
      by('a', "There are two graveyards?"),
      by('b', "In a haunted castle? There are probably six."),
    ] },
  ],
};

// ── the gym (Botch or Watch: a performs, b watches) ──
const gym = {
  'don-demo.gag': [
    { id: 'hcs.gy-d1', when: GY, turns: [
      don("In this Botch or Watch, one of you does a full split on the balance beam, then a somersault onto the vaulting horse."),
      beat('He puts one foot on the beam, considers it, and takes his foot off again.'),
      don("I would show you, but this suit is not designed for splits. Neither am I."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'hcs.gy-d2', when: GY, turns: [
      don("The coach must approve. A wobble, a fall, or a lazy split, and you start the routine again. The other partner may only cheer."),
      don("She has trained champions. She has never smiled. Don't take it personally."),
      beat('The coach stands by the beam, arms folded, looking at nothing, and absolutely does not smile.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'hcs.gy-w1', when: GY, turns: [
      by('b', "You're more flexible. You can touch your toes."),
      by('a', "Touching my toes isn't a split."),
      by('b', "It's the start of one. Go."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'hcs.gy-w2', when: GY, turns: [
      by('a', "I'll do it. I did gymnastics when I was seven."),
      by('b', "For how long?"),
      by('a', "One lesson. But I was very good in that lesson."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'hcs.gy-w3', when: GY, turns: [
      by('b', "Not me. My legs don't go that way. You."),
      by('a', "My legs don't go that way either."),
      by('b', "Then yours are about to learn."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'hcs.gy-w4', when: GY, turns: [
      by('a', "'Who's flexible?' Is it yoga? Please let it be yoga."),
      by('b', "In a castle? It's going to be something worse than yoga."),
      by('a', "There's nothing worse than yoga."),
    ] },
  ],
  'task-start.any': [
    { id: 'hcs.gy-s1', when: GY, turns: [
      beat('{a} climbs onto the balance beam and wobbles immediately.'),
      by('a', "It's so thin. Why is it so thin?"),
      by('b', "It's a balance beam. Thin is the whole point."),
    ] },
    { id: 'hcs.gy-s2', when: GY, turns: [
      by('b', "Stretch first. You have to stretch first, or you'll snap something."),
      by('a', "I'm stretching. This is me stretching."),
      by('b', "That's you bending over a little bit."),
    ] },
    { id: 'hcs.gy-s3', when: GY, turns: [
      beat("{a} lowers slowly into a split on the beam, gritting {a.posAdj} teeth."),
      by('a', "Further. I can go further. I think."),
      by('b', "Don't think! Just go!"),
    ] },
    { id: 'hcs.gy-s4', when: GY, turns: [
      by('a', "The vault's the scary bit. Run, jump, roll. And land."),
      by('b', "The landing is very important."),
      by('a', "Thank you. Very helpful."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'hcs.gy-f1', when: GY, turns: [
      beat('{a} drops into a perfect split on the beam, holds it, then runs, flips over the vault, and lands on both feet.'),
      beat('The coach stares for a long moment, then nods once.'),
      by('b', "She nodded! You made her nod!"),
    ] },
    { id: 'hcs.gy-f2', when: GY, turns: [
      by('a', "Did I land it? I had my eyes closed. Did I land it?"),
      by('b', "You landed it! You landed it like a cat!"),
      by('a', "I've never felt more like a cat."),
    ] },
    { id: 'hcs.gy-f3', when: GY, turns: [
      beat("{a} finishes the routine, arms up, and the coach slowly, very slowly, starts to clap."),
      by('b', "She's clapping. Two claps. That's a standing ovation for her."),
      by('a', "Don't spoil it. Let me have the claps."),
    ] },
    { id: 'hcs.gy-f4', when: GY, turns: [
      by('a', "First try. Split, vault, landing. All of it."),
      by('b', "You did one gymnastics lesson when you were seven."),
      by('a', "And it all came back to me."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'hcs.gy-a1', when: GY, turns: [
      by('b', "She keeps saying the split's not low enough. Go lower. All the way."),
      beat('{a} goes all the way down, all the way to the beam, and stays there. The coach nods.'),
      by('a', "Something tore. But she nodded."),
    ] },
    { id: 'hcs.gy-a2', when: GY, turns: [
      beat("This time {a} runs at the vault without slowing down, and the somersault is clean."),
      by('b', "That's it! That's the one!"),
      beat('The coach nods, once, and points at the door. They can go.'),
    ] },
    { id: 'hcs.gy-a3', when: GY, turns: [
      by('a', "I wobbled every time, because I looked down. So I'm looking up."),
      beat('{a} looks up at the ceiling the whole way through the split, and doesn\'t wobble once.'),
      by('b', "The ceiling saved you!"),
    ] },
    { id: 'hcs.gy-a4', when: GY, turns: [
      beat("Fourth attempt. {a} nails the split, flies over the vault, and lands perfectly."),
      by('a', "Fourth time's the charm!"),
      by('b', "Nobody says that! But you did it!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'hcs.gy-t1', when: GY, turns: [
      beat("{a} is halfway into a split on the beam, and absolutely cannot go any further down."),
      by('a', "This is it. This is as far as I go. My body has decided."),
      by('b', "Tell your body to try harder!"),
    ] },
    { id: 'hcs.gy-t2', when: GY, turns: [
      by('b', "That's the fourth time she's sent you back."),
      by('a', "I know. I can count. My legs can count too."),
      by('b', "What are your legs saying?"),
    ] },
    { id: 'hcs.gy-t3', when: GY, turns: [
      beat("{a} runs at the vault, gets to it, and stops dead, hands on top of it, unable to go over."),
      by('a', "I can't make myself flip. I just can't."),
      by('b', "Don't think about flipping. Think about the money."),
    ] },
  ],
  'task-done.any': [
    { id: 'hcs.gy-dn1', when: GY, turns: [
      by('a', "I can't walk. I did a split, and now I can't walk."),
      by('b', "Then hop. The Chill Zone isn't far."),
      by('a', "Hopping is also walking."),
    ] },
    { id: 'hcs.gy-dn2', when: GY, turns: [
      beat('{a} and {b} run out of the gym into the night, towards the lights of the Chill Zone.'),
      by('b', "She didn't smile once."),
      by('a', "She nodded. For her, a nod is a smile."),
    ] },
    { id: 'hcs.gy-dn3', when: GY, turns: [
      by('b', "You were amazing. You were actually amazing."),
      by('a', "I was a bit amazing. Mostly I was scared."),
      by('b', "Scared and amazing. That's the best kind."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'hcs.gy-x1', when: GY, turns: [
      beat("{a} wobbles on the beam, windmills both arms, and falls off onto the mat."),
      by('a', "I'm fine! I'm fine! The mat was soft!"),
      by('b', "Back on the beam!"),
    ] },
    { id: 'hcs.gy-x2', when: GY, turns: [
      beat('{a} somersaults onto the vault and keeps going, right off the other side, and lands flat on {a.posAdj} back.'),
      by('a', "Did that count? Please tell me that counted."),
      by('b', "The coach is shaking her head. It didn't count."),
    ] },
    { id: 'hcs.gy-x3', when: GY, turns: [
      beat('The coach looks at {a}\'s split, which is mostly a crouch, and points back at the start.'),
      by('a', "That was a split!"),
      by('b', "That was a squat. Again."),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'hcs.gy-v1', when: GY, turns: [
      by('b', "You've got this! You're a gymnast! You're a champion!"),
      by('a', "I'm a person on a very thin piece of wood!"),
      by('b', "A champion person on a very thin piece of wood!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'hcs.gy-v2', when: GY, turns: [
      beat('{b} winces every single time {a} wobbles, as if {b} is the one on the beam.'),
      by('b', "I can't watch. I can feel it in my own legs."),
      by('a', "Then stop watching!"),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'hcs.gy-v3', when: GY, turns: [
      beat('{b} rushes over to hold {a} steady on the beam.'),
      by('b', "I've got you, I've got you!"),
      beat('The coach blows a sharp whistle and points at {b}. A penalty.'),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'hcs.gy-v4', when: GY, turns: [
      beat("{b} sits on the bench in total silence, hands pressed together, not making a sound."),
      by('a', "Are you praying?"),
      by('b', "Yes. For your hamstrings."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'hcs.gy-h1', when: GY, turns: [
      beat("While the coach writes on her clipboard, {b} quietly pushes the crash mat closer to the vault."),
      by('a', "Did you just move the mat?"),
      by('b', "It moved itself. It's a haunted castle."),
    ] },
  ],
};

export default mergePools(place, roads, coffin, gym);
