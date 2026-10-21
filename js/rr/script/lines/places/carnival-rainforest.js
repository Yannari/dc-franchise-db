// Carnival Rainforest's own lines (js/rr/places/carnival-rainforest.js), 1:1 with the real leg ("Brazilian Pain
// Forest"), in our own words:
//   the ants       Botch or Watch: a hand in a mitten of bullet ants, feeling for the tip; empty-handed, back in it
//                  goes. a's hand, b watches.
//   the gorge      All-In: over the gorge on the vines (a miss is the river and the climb), then a mountain of coconuts
//                  and only one with the tip.
//   the costume    All-In: a carnival costume, a headpiece and a tailpiece, paraded for a judge who wants it big.
//   the glider     down to the beach: landing in the sea.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'carnival-rainforest' };
const AN = { taskId: 'ants' };
const GO = { taskId: 'gorge' };
const CO = { taskId: 'costume' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'cvr.op1', when: P, turns: [
      beat('Don stands in a jungle clearing, slapping at a mosquito on his neck, then another, then another.'),
      don("Welcome to Carnival Rainforest! Home of the loudest party on earth, the biggest rainforest on earth, and every mosquito on earth."),
      don("Today, teams meet some very angry ants, fly over a gorge, and dress up for carnival. Not in that order. Actually, in that order."),
      beat('A mosquito lands on his nose. He goes cross-eyed looking at it.'),
    ] },
    { id: 'cvr.op2', when: P, turns: [
      don("Carnival Rainforest. It's hot, it's wet, and somewhere out there a drum is playing, and it hasn't stopped since we landed."),
      don("Racers, your first Don Box is on the forest floor. Bring gloves. Actually, don't. Gloves aren't allowed."),
      beat('Somewhere in the trees, the drum gets faster. Don starts, very slightly, to dance.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'cvr.op3', when: P, turns: [
      beat('Don is lying in a hammock between two trees, fanning himself with a giant leaf.'),
      don("Carnival Rainforest. Too hot to stand up. Too hot to host. You know where the Don Box is."),
      don("It's on the ground. Near the ants. Good luck. Don't wake me up."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'cvr.ar1', when: P, turns: [
      beat('The trail opens onto a view of rainforest that goes on, green and endless, all the way to the sea.'),
      by('a', "That's all trees. Every bit of that is trees."),
      by('b', "And something in there is singing. Listen."),
      by('a', "That's a bird. Or a monkey. Or a very good drummer."),
    ] },
    { id: 'cvr.ar2', when: P, turns: [
      beat('A parrot lands on a branch right next to them, looks at {a}, and says something that sounds like a word.'),
      by('b', "Did that parrot just talk to you?"),
      by('a', "I think it said 'hurry'."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'cvr.ad1', when: P, turns: [
      by('a', "It says 'ants' on the tip. Why does it say ants?"),
      by('b', "Maybe they're friendly ants."),
      by('a', "There's a picture of a man crying next to the word."),
    ] },
    { id: 'cvr.ad2', when: P, turns: [
      by('b', "I'm sweating in places I didn't know could sweat."),
      by('a', "We've been here four minutes."),
      by('b', "Four very long minutes."),
    ] },
  ],
};

// ── the glider (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'cvr.tm1', when: { taskId: 'glide', mishap: 'lands-in-the-sea' }, turns: [
      beat('The hang glider swoops over the beach, overshoots the sand completely, and lands with a splash in the sea.'),
      by('a', "That was the beach! The beach was right there!"),
      by('b', "We were going too fast for the beach!"),
      beat('Fifteen minutes later, they drag the glider out of the waves, soaked and laughing.'),
    ] },
  ],
};

// ── the ant mitten (Botch or Watch: a's hand, b watches) ──
const ants = {
  'don-demo.gag': [
    { id: 'cvr.an-d1', when: AN, turns: [
      don("In this Botch or Watch, one of you puts a hand into this mitten, full of bullet ants, and pulls out the tip at the bottom."),
      beat('A local holds the mitten up to him. It is moving. Don takes three steps back.'),
      don("They're called bullet ants because their sting feels like being shot. I did not volunteer to demonstrate."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'cvr.an-d2', when: AN, turns: [
      don("Pull your hand out empty, and it goes straight back in. The other partner can only watch. And maybe hold a cold drink."),
      don("I've been told the pain lasts a day. I've been told that by a man who is still crying."),
      beat('Off to the side, a crew member is holding his hand in a bucket of ice.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'cvr.an-w1', when: AN, turns: [
      by('b', "You've got the tougher hands. You do manual work."),
      by('a', "I work in an office. I type."),
      by('b', "That's manual. Your hands are very used to working. Go."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'cvr.an-w2', when: AN, turns: [
      by('a', "I'll do it. I've been stung by everything. Wasps, bees, a jellyfish. What's one more?"),
      by('b', "These are supposed to be the worst."),
      by('a', "Then I'll have the full set."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'cvr.an-w3', when: AN, turns: [
      by('b', "Not me. Absolutely not me. You."),
      by('a', "Why me?"),
      by('b', "Because I asked first, and asking first is the rule."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'cvr.an-w4', when: AN, turns: [
      by('a', "'Who has a high pain threshold?' That's not a question. That's a warning."),
      by('b', "You do. You walked on that nail and didn't even notice for an hour."),
      by('a', "I noticed. I just didn't say anything."),
    ] },
  ],
  'task-start.any': [
    { id: 'cvr.an-s1', when: AN, turns: [
      beat('{a} stares at the mitten. It ripples, as if the ants inside are waving.'),
      by('a', "They're moving. Why are they moving like that?"),
      by('b', "They're excited to meet you."),
    ] },
    { id: 'cvr.an-s2', when: AN, turns: [
      by('b', "Fast in, grab, fast out. Don't feel around. Just grab the paper."),
      by('a', "How will I know it's the paper?"),
      by('b', "It's the only thing in there that isn't an ant."),
    ] },
    { id: 'cvr.an-s3', when: AN, turns: [
      beat('{a} rolls up one sleeve, very slowly, like a surgeon about to operate.'),
      by('a', "If I scream, it's fine. It's part of the process."),
      by('b', "Scream away. Nobody here is judging you."),
    ] },
    { id: 'cvr.an-s4', when: AN, turns: [
      by('a', "Count me down. Count me down so I can't back out."),
      by('b', "Three, two..."),
      beat('{a} goes in on two, and lets out a sound that echoes through the trees.'),
    ] },
  ],
  'task-try.first-try': [
    { id: 'cvr.an-f1', when: AN, turns: [
      beat('{a} plunges a hand in, grabs, and pulls out the tip in one move, shaking off three ants.'),
      by('a', "Got it! Got it! Ow, ow, ow, I got it!"),
      by('b', "That was so fast! Did they even get you?"),
      by('a', "Every single one of them got me!"),
    ] },
    { id: 'cvr.an-f2', when: AN, turns: [
      by('a', "It's out. It's out, and I'm never doing that again."),
      by('b', "You didn't even scream!"),
      by('a', "I'm screaming on the inside. It's very loud in there."),
    ] },
    { id: 'cvr.an-f3', when: AN, turns: [
      beat('{a} pulls out the tip, hands it to {b} without a word, and walks very calmly to the bucket of ice.'),
      by('b', "Are you okay?"),
      by('a', "Don't talk to me for ten minutes."),
    ] },
    { id: 'cvr.an-f4', when: AN, turns: [
      by('b', "First try! First try in a mitten full of ants!"),
      by('a', "Put that on my gravestone."),
      by('b', "You're not going to die."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'cvr.an-a1', when: AN, turns: [
      by('b', "It's at the very bottom. Go deeper. Right to the fingertips of the mitten."),
      beat('{a} goes in again, all the way, and comes out holding the tip, and a lot of ants.'),
      by('a', "Deeper was worse. But deeper worked."),
    ] },
    { id: 'cvr.an-a2', when: AN, turns: [
      beat('Third time in, {a} stops flinching, finds the paper, and pulls it out.'),
      by('a', "Got it. I've stopped feeling my hand, so it was easy."),
      by('b', "That's not how it's supposed to work, but I'll take it."),
    ] },
    { id: 'cvr.an-a3', when: AN, turns: [
      by('a', "I keep pulling out leaves. Why are there leaves in here?"),
      by('b', "To trick you! Feel for the smooth one!"),
      beat('{a} feels for the smooth one, and pulls out the tip at last.'),
    ] },
    { id: 'cvr.an-a4', when: AN, turns: [
      by('b', "Don't think. Thinking is what's slowing you down."),
      beat('{a} stops thinking, goes in, and comes out with the tip.'),
      by('a', "Not thinking is my best skill."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'cvr.an-t1', when: AN, turns: [
      beat('{a} has a hand halfway into the mitten and has been frozen like that for a full minute.'),
      by('b', "In or out! You've got to go in or out!"),
      by('a', "They're on my wrist. They know I'm here."),
    ] },
    { id: 'cvr.an-t2', when: AN, turns: [
      by('a', "I can't feel the paper. I can only feel ants."),
      by('b', "The paper's in there. I promise."),
      by('a', "Then why can't I find it?"),
    ] },
    { id: 'cvr.an-t3', when: AN, turns: [
      beat("{a}'s hand is red and swollen, and {a} is staring at the mitten like it's a bomb."),
      by('a', "One more time. Just one more time."),
      by('b', "You said that two times ago."),
    ] },
  ],
  'task-done.any': [
    { id: 'cvr.an-dn1', when: AN, turns: [
      by('a', "My hand is twice the size of my other hand."),
      by('b', "It'll go down."),
      by('a', "When? When will it go down?"),
    ] },
    { id: 'cvr.an-dn2', when: AN, turns: [
      beat('{a} jogs down the trail, holding one hand up in the air like a waiter carrying a tray.'),
      by('b', "Why are you holding it like that?"),
      by('a', "It hurts less up here. Don't ask me why."),
    ] },
    { id: 'cvr.an-dn3', when: AN, turns: [
      by('b', "You were so brave. Honestly. So brave."),
      by('a', "Then you're doing the next one."),
      by('b', "We'll see what the next one is."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'cvr.an-x1', when: AN, turns: [
      beat('{a} yanks a hand out of the mitten, holding nothing but an angry ant.'),
      by('a', "That's not the tip! That's an ant!"),
      by('b', "Shake it off! Back in!"),
    ] },
    { id: 'cvr.an-x2', when: AN, turns: [
      beat('{a} pulls a hand out the second it goes in, with a yelp.'),
      by('b', "You didn't even get to the bottom!"),
      by('a', "There's no bottom! It's just ants all the way down!"),
    ] },
    { id: 'cvr.an-x3', when: AN, turns: [
      beat("{a} grabs the tip, but drops it back into the mitten on the way out."),
      by('a', "I had it! I had it in my hand!"),
      by('b', "Then go and get it again!"),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'cvr.an-v1', when: AN, turns: [
      by('b', "You're the bravest person I know! The bravest! Grab it!"),
      by('a', "Stop shouting! It's upsetting them!"),
      by('b', "I'm cheering! Ants don't understand cheering!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'cvr.an-v2', when: AN, turns: [
      beat('{b} has both hands over {b.posAdj} mouth, watching through {b.posAdj} fingers.'),
      by('b', "I can't look. Is it over? Tell me when it's over."),
      by('a', "It's not over! I'm in it right now!"),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'cvr.an-v3', when: AN, turns: [
      beat('{b} reaches over and holds the mitten open wider to help {a} see inside.'),
      by('b', "Look, there, I can see it!"),
      beat('The local pulls the mitten back and wags a finger. The judge marks it down. A penalty.'),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'cvr.an-v4', when: AN, turns: [
      beat("{b} stands perfectly still and silent, fists clenched, watching every move."),
      by('a', "Why aren't you saying anything?"),
      by('b', "Because I'm scared that if I talk, they'll hear me."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'cvr.an-h1', when: AN, turns: [
      beat("While the local looks away, {b} blows into the mitten to try to calm the ants down."),
      by('a', "Did you just blow on them? Why would you blow on them?"),
      by('b', "It works on bees. I panicked."),
    ] },
  ],
};

// ── over the gorge (All-In) ──
const gorge = {
  'don-demo.gag': [
    { id: 'cvr.go-d1', when: GO, turns: [
      don("In this All-In, teams cross the gorge by any means necessary. Most people use the vines. I'd use a helicopter."),
      beat('He grabs a vine, tests it with a tug, and it comes away from the tree and falls on his head.'),
      don("Use a different vine than that one."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'cvr.go-d2', when: GO, turns: [
      don("Miss your swing, and you'll land in the river, and you'll climb back up and try again."),
      don("On the other side is a mountain of coconuts. Only one of them has your next tip. Start shaking."),
      beat('He picks up a coconut, shakes it next to his ear, and throws it over his shoulder.'),
    ] },
  ],
  'task-start.any': [
    { id: 'cvr.go-s1', when: GO, turns: [
      beat('{a} stands on the edge of the gorge, holding a vine, looking down at the river far below.'),
      by('a', "How do I know it'll hold me?"),
      by('b', "You don't. That's the fun part."),
    ] },
    { id: 'cvr.go-s2', when: GO, turns: [
      by('b', "Run, jump, hold on, let go on the other side. Four things."),
      by('a', "Which is the hard one?"),
      by('b', "All four. Equally."),
    ] },
    { id: 'cvr.go-s3', when: GO, turns: [
      beat('{b} grabs a vine, backs up as far as it will go, and runs.'),
      by('b', "Like a superhero! Like a jungle superhero!"),
      by('a', "Superheroes don't scream like that!"),
    ] },
    { id: 'cvr.go-s4', when: GO, turns: [
      by('a', "There are about a thousand coconuts over there."),
      by('b', "Then we'd better get across fast. Lots of shaking to do."),
      by('a', "I've never shaken a thousand coconuts."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'cvr.go-f1', when: GO, turns: [
      beat('{a} swings out over the gorge, perfectly, and lets go at exactly the right moment to land on the far side.'),
      by('a', "I'm a natural! I was born in a jungle!"),
      by('b', "You were born in a hospital next to a car park."),
    ] },
    { id: 'cvr.go-f2', when: GO, turns: [
      by('b', "This one! This one sloshes differently!"),
      beat('{b} cracks it open on a rock. Inside, rolled up neatly, is the tip.'),
      by('a', "You found it with your ears! You're a coconut genius!"),
    ] },
    { id: 'cvr.go-f3', when: GO, turns: [
      beat('Both of them swing across on their first try, one after the other, and land in a heap on the far side.'),
      by('a', "Did we just do that? First time?"),
      by('b', "We did it! Now the coconuts!"),
    ] },
    { id: 'cvr.go-f4', when: GO, turns: [
      by('a', "Third coconut I've shaken, and it's this one! Listen!"),
      beat('It rattles. It rattles like paper. They crack it, and the tip falls out.'),
      by('b', "Third coconut! Out of a thousand!"),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'cvr.go-a1', when: GO, turns: [
      by('b', "Swing higher. Back up further and swing higher."),
      beat('{a} backs up to the very edge, runs, and swings so high {a} clears the gorge with room to spare.'),
      by('a', "Too high! But I'm across!"),
    ] },
    { id: 'cvr.go-a2', when: GO, turns: [
      beat("After a long search through the pile, {a} finally holds up a coconut that sounds different."),
      by('a', "This one. I'm sure this time. This one."),
      beat('{b} smashes it open. The tip is inside.'),
    ] },
    { id: 'cvr.go-a3', when: GO, turns: [
      by('a', "Second climb up from the river. Second swing. It's going to work."),
      beat("It works. {a} lands on the far side, soaked, and punches the air."),
      by('b', "Now the coconuts! Quick!"),
    ] },
    { id: 'cvr.go-a4', when: GO, turns: [
      by('b', "We've checked this whole side. It has to be on that side."),
      beat('On that side, the very first coconut {b} picks up rattles. Inside is the tip.'),
      by('a', "It's always the last place you look."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'cvr.go-t1', when: GO, turns: [
      beat('{a} is hanging from the vine in the middle of the gorge, no longer swinging, just dangling.'),
      by('a', "I've stopped! I'm just hanging here! What do I do?"),
      by('b', "Swing! Wiggle! Do something!"),
    ] },
    { id: 'cvr.go-t2', when: GO, turns: [
      by('b', "That's fifty coconuts. Fifty coconuts, and nothing."),
      by('a', "There are nine hundred and fifty to go."),
      by('b', "Okay, I didn't need to hear that."),
    ] },
    { id: 'cvr.go-t3', when: GO, turns: [
      beat('{a} climbs out of the river for the third time, dripping, covered in leaves.'),
      by('a', "I'm part of the river now. The river and I are one."),
      by('b', "Climb back up and be part of the other side instead."),
    ] },
  ],
  'task-done.any': [
    { id: 'cvr.go-dn1', when: GO, turns: [
      by('a', "Can we keep the coconut? The one that had the tip?"),
      by('b', "It's broken in half."),
      by('a', "Then we keep both halves."),
    ] },
    { id: 'cvr.go-dn2', when: GO, turns: [
      beat('{a} and {b} jog away from the gorge, both still dripping from the river.'),
      by('b', "My shoes are full of water."),
      by('a', "My shoes are full of river. There's a difference."),
    ] },
    { id: 'cvr.go-dn3', when: GO, turns: [
      by('b', "I swung on a vine over a gorge. I'm basically an action hero."),
      by('a', "You fell in twice."),
      by('b', "Action heroes fall in all the time."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'cvr.go-x1', when: GO, turns: [
      beat("{a} lets go of the vine too early, and drops straight down into the river with a huge splash."),
      by('b', "Are you okay? Are you alive?"),
      by('a', "I'm alive! I'm wet, but I'm alive!"),
    ] },
    { id: 'cvr.go-x2', when: GO, turns: [
      beat('{b} cracks open a coconut. Inside is nothing but coconut.'),
      by('b', "Nothing. Just coconut. Why is it just coconut?"),
      by('a', "Because it's a coconut. Next one."),
    ] },
    { id: 'cvr.go-x3', when: GO, turns: [
      beat("{a} swings out over the gorge, then all the way back to the side {a} started from."),
      by('a', "I'm back. Why am I back?"),
      by('b', "You didn't let go!"),
    ] },
  ],
};

// ── the carnival costume (All-In) ──
const costume = {
  'don-demo.gag': [
    { id: 'cvr.co-d1', when: CO, turns: [
      don("In this All-In, teams make a full carnival costume: a headpiece for one of you, a tailpiece for the other. Feathers, sequins, the works."),
      beat('He puts on a giant feathered headpiece. It is taller than he is. He has to hold it up with both hands.'),
      don("This is the right size. Anything smaller is a hat."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'cvr.co-d2', when: CO, turns: [
      don("Then you parade it for the judge. If it sags, sheds feathers, or just stands there, it's back to the table."),
      don("She wants big. She wants bright. She wants you to dance. Mostly she wants you to dance."),
      beat('The judge, behind him, is already dancing. She has not stopped since the cameras came on.'),
    ] },
  ],
  'task-start.any': [
    { id: 'cvr.co-s1', when: CO, turns: [
      beat("{a} and {b} stand over a table piled with feathers, glitter, wire and glue."),
      by('a', "Where do we even start?"),
      by('b', "With the biggest feathers. Big feathers first. Always big feathers first."),
    ] },
    { id: 'cvr.co-s2', when: CO, turns: [
      by('b', "I'm doing the headpiece. You're doing the tail."),
      by('a', "Why do you get the head?"),
      by('b', "Because you have a better bottom for a tail."),
    ] },
    { id: 'cvr.co-s3', when: CO, turns: [
      beat("{a} glues a feather to the wire, and immediately glues {a.posAdj} own hand to it too."),
      by('a', "I'm stuck. I'm part of the costume now."),
      by('b', "Then make it a good costume."),
    ] },
    { id: 'cvr.co-s4', when: CO, turns: [
      by('a', "Do you know how to sew?"),
      by('b', "I know how to glue. Glue is basically sewing for people in a hurry."),
      by('a', "Let's go with glue."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'cvr.co-f1', when: CO, turns: [
      beat('{a} and {b} sweep out in front of the judge, the headpiece towering and the tail fanning out behind them, and dance.'),
      beat('The judge throws her arms in the air and screams with joy.'),
      by('b', "She loves it! She actually loves it!"),
    ] },
    { id: 'cvr.co-f2', when: CO, turns: [
      by('a', "Spin! Spin so she can see the tail!"),
      beat('{a} spins. The tail spins with {a.obj}. The judge cheers, and hands over the tip.'),
      by('b', "We're carnival people now! We live here now!"),
    ] },
    { id: 'cvr.co-f3', when: CO, turns: [
      beat("The judge walks slowly all the way around them, touches one feather, and nods."),
      by('a', "Was that a nod?"),
      by('b', "That was a nod! Dance! Dance while she nods!"),
    ] },
    { id: 'cvr.co-f4', when: CO, turns: [
      by('b', "Bigger! Make it bigger!"),
      by('a', "It can't get any bigger, it's already touching the tent!"),
      beat('It is, it turns out, the perfect size. The judge gives them the tip.'),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'cvr.co-a1', when: CO, turns: [
      by('a', "She said it wasn't big enough. Every feather. Use every single feather on the table."),
      beat("They use every single feather. The headpiece now reaches the roof. The judge squeals and hands over the tip."),
      by('b', "More is more. Write that down."),
    ] },
    { id: 'cvr.co-a2', when: CO, turns: [
      beat('{a} and {b} come back out, and this time they dance like nobody is watching, even though everybody is.'),
      by('b', "She wanted dancing! Give her dancing!"),
      beat('The judge joins in, dancing with them, and presses the tip into {a}\'s hand.'),
    ] },
    { id: 'cvr.co-a3', when: CO, turns: [
      by('b', "The tail kept falling off. So we glue it to you."),
      by('a', "To me? To my actual body?"),
      beat('The tail stays on. The judge is delighted. The tip is theirs.'),
    ] },
    { id: 'cvr.co-a4', when: CO, turns: [
      beat('{b} adds one last enormous pink feather to the very top of the headpiece.'),
      by('b', "That's the one. That's the feather that finishes it."),
      beat('It is. The judge cheers the moment she sees it.'),
    ] },
  ],
  'task-try.struggling': [
    { id: 'cvr.co-t1', when: CO, turns: [
      beat('Half the feathers on their headpiece slide off and drift to the ground.'),
      by('a', "It's moulting! The costume is moulting!"),
      by('b', "More glue! Use all the glue!"),
    ] },
    { id: 'cvr.co-t2', when: CO, turns: [
      by('b', "She said 'more'. Just 'more'. More what?"),
      by('a', "More everything, I think."),
      by('b', "We used everything!"),
    ] },
    { id: 'cvr.co-t3', when: CO, turns: [
      beat("{a} is tangled in the wire frame of the tail, and can't get out."),
      by('a', "I'm trapped in the tail!"),
      by('b', "Stand still! Every time you move, it gets worse!"),
    ] },
  ],
  'task-done.any': [
    { id: 'cvr.co-dn1', when: CO, turns: [
      by('a', "Can we wear them to the Chill Zone?"),
      by('b', "Yes. Absolutely yes. I'm wearing this forever."),
      by('a', "Don's going to be so jealous."),
    ] },
    { id: 'cvr.co-dn2', when: CO, turns: [
      beat('{a} and {b} jog out of the tent, still shedding feathers, leaving a trail of pink behind them.'),
      by('b', "We look ridiculous."),
      by('a', "We look magnificent and ridiculous."),
    ] },
    { id: 'cvr.co-dn3', when: CO, turns: [
      by('b', "I think I want to be a costume designer now."),
      by('a', "You glued your hand to a feather."),
      by('b', "Every designer starts somewhere."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'cvr.co-x1', when: CO, turns: [
      beat('The judge takes one look at their costume, and points back at the tent without a word.'),
      by('a', "She didn't even look at the tail!"),
      by('b', "She didn't need to. Back to the table."),
    ] },
    { id: 'cvr.co-x2', when: CO, turns: [
      beat('Halfway through their parade, the headpiece tips over and falls off completely.'),
      by('b', "No! Not now! Not in front of her!"),
      by('a', "Pick it up! Keep dancing!"),
    ] },
    { id: 'cvr.co-x3', when: CO, turns: [
      beat("{a} and {b} stand in front of the judge in their costume, and just stand there."),
      by('a', "What do we do now?"),
      by('b', "We were supposed to dance! She's shaking her head! Back!"),
    ] },
  ],
};

export default mergePools(place, roads, ants, gorge, costume);
