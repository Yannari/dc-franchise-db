// Geyser Island's own lines (js/rr/places/geyser-island.js), 1:1 with the real leg ("Bjorken Telephone"), in our own
// words:
//   the bus        to the park: it breaks down on the mountain road.
//   the telephone  All-In: Don's recorded phrase in the local language, a sprint through the geysers, the phrase said
//                  word for word to a local; one word wrong and it's back to the speaker box.
//   feast/fossil   Either/Or: eat the whole traditional meal (fermented shark, sheep's head, the rest), or chip a fossil
//                  out of the ice cave without cracking it.
// Gated on place / taskId / side / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'geyser-island' };
const TP = { taskId: 'telephone' };
const FF = { taskId: 'feast-fossil' };
const FEAST = { taskId: 'feast-fossil', side: 'feast' };
const FOSSIL = { taskId: 'feast-fossil', side: 'fossil' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'gyi.op1', when: P, turns: [
      beat('Don stands in front of a steaming geyser in a huge fur-lined parka, shivering.'),
      don("Welcome to Geyser Island! Land of ice, fire, and wind that goes straight through your soul. And your parka. Mostly your parka."),
      beat('Behind him, the geyser erupts with a roar. Don does not turn around, but he does flinch.'),
      don("That happens every eight minutes. You'll stop jumping. I haven't."),
    ] },
    { id: 'gyi.op2', when: P, turns: [
      don("Geyser Island. Glaciers, volcanoes, and the hot springs I was promised and have not yet been allowed to sit in."),
      don("Teams, the bus to the park leaves from right here. Today, you'll be learning a new language. Fast."),
      beat('He tries to say the name of the bus stop, gives up halfway, and points instead.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'gyi.op3', when: P, turns: [
      beat('Don is sitting in a steaming hot spring, up to his chin, a towel on his head.'),
      don("Geyser Island. I finally got my hot spring. I'm not getting out. You can't make me."),
      don("Racers, there's a bus. Get on it. I'll be right here, being warm."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'gyi.ar1', when: P, turns: [
      beat('The bus climbs out of the clouds onto a black plain where steam rises from a hundred cracks in the ground.'),
      by('a', "It looks like the moon. If the moon was having a bath."),
      by('b', "The ground is smoking. The actual ground."),
      by('a', "Don't step on the smoking bits."),
    ] },
    { id: 'gyi.ar2', when: P, turns: [
      beat('A geyser bursts out of the ground beside the road, a white column of water taller than a house.'),
      by('b', "Did you see that? It just went whoosh!"),
      by('a', "Everybody on this bus saw that. The driver didn't even look."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'gyi.ad1', when: P, turns: [
      by('a', "Read the tip again. Does it say 'run through'? Through the geysers?"),
      by('b', "It says 'through'. I've read it four times. It keeps saying 'through'."),
      by('a', "Maybe they mean 'near'."),
    ] },
    { id: 'gyi.ad2', when: P, turns: [
      by('b', "It's freezing and boiling at the same time. How is that even possible?"),
      by('a', "This place breaks the rules of weather."),
      by('b', "I don't like a place that breaks the rules of weather."),
    ] },
  ],
};

// ── the bus (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'gyi.tm1', when: { taskId: 'park-bus', mishap: 'bus-breaks-down' }, turns: [
      beat('Halfway up the mountain road, the bus shudders, groans, and stops. The driver gets out and opens the bonnet.'),
      by('a', "Is it bad? It looks bad. He's taking his hat off."),
      by('b', "When a driver takes his hat off, it's always bad."),
      beat('Twenty-five minutes, one rope and a passing farmer later, the bus starts again.'),
    ] },
  ],
};

// ── the broken telephone (All-In) ──
const telephone = {
  'don-demo.gag': [
    { id: 'gyi.tp-d1', when: TP, turns: [
      don("In this All-In, you'll listen to me say a phrase in the local language on this speaker box."),
      beat('He presses play. A recording of Don says something long and very confidently mispronounced.'),
      don("Then you run through that geyser field and say it, word for word, to the man on the other side. Easy. I learned it in a day."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'gyi.tp-d2', when: TP, turns: [
      don("One word wrong, and he'll shake his head, and you'll run back through the geysers to listen again."),
      don("The geysers go off every few minutes. You don't know when. Neither do I. It's very exciting for me."),
      beat('A geyser erupts right next to the speaker box. Don, standing well back, smiles.'),
    ] },
  ],
  'task-start.any': [
    { id: 'gyi.tp-s1', when: TP, turns: [
      beat('{a} and {b} crouch by the speaker box, listening for the tenth time.'),
      by('a', "Is that a word or two words? It sounds like a sneeze."),
      by('b', "I think it's three words, and one of them is a sneeze."),
    ] },
    { id: 'gyi.tp-s2', when: TP, turns: [
      by('b', "You remember the first half, I remember the second half."),
      by('a', "What if I forget my half?"),
      by('b', "Then we're saying half a sentence to a very confused man."),
    ] },
    { id: 'gyi.tp-s3', when: TP, turns: [
      beat('{a} mouths the phrase over and over, eyes closed, as steam drifts across the field.'),
      by('a', "Something something... fjord... something."),
      by('b', "That's not even close. Listen again."),
    ] },
    { id: 'gyi.tp-s4', when: TP, turns: [
      by('a', "We could sing it. Things stick when you sing them."),
      by('b', "Fine. To what tune?"),
      by('a', "Anything. Happy birthday. Just go."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'gyi.tp-f1', when: TP, turns: [
      beat('{a} and {b} skid to a stop in front of the local, steaming, and recite the phrase perfectly, in perfect time with each other.'),
      beat('The man blinks, then nods, and hands over the tip.'),
      by('b', "We sang it in our heads. The whole way. It worked!"),
    ] },
    { id: 'gyi.tp-f2', when: TP, turns: [
      by('a', "Say it slowly. Say every bit of it slowly."),
      beat('{b} says it very slowly. The local smiles, says it back properly, and gives them the tip anyway.'),
      by('b', "He said it better than us. But he gave us the tip!"),
    ] },
    { id: 'gyi.tp-f3', when: TP, turns: [
      beat('A geyser goes off right behind them as they reach the local. They don\'t even turn round.'),
      by('a', "We're here, we've got it, listen."),
      beat('{a} says the phrase in one breath. The local nods, impressed. The tip is theirs.'),
    ] },
    { id: 'gyi.tp-f4', when: TP, turns: [
      by('b', "First try. Did we just learn a language?"),
      by('a', "We learned one sentence."),
      by('b', "One sentence of a whole language. I'm putting it on my CV."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gyi.tp-a1', when: TP, turns: [
      by('a', "It's 'brúin', not 'brown'. We kept saying 'brown'."),
      beat('Back at the local, {a} says it with the right word. He nods, and hands over the tip.'),
      by('b', "Brúin. I'm going to dream about brúin."),
    ] },
    { id: 'gyi.tp-a2', when: TP, turns: [
      beat('Third run through the field. {b} is soaked from a geyser, but word perfect.'),
      by('b', "Say it with me. Together. Now."),
      beat('They say it together, the local laughs, and the tip is finally in their hands.'),
    ] },
    { id: 'gyi.tp-a3', when: TP, turns: [
      by('a', "We'll split it. You say the first bit, I say the second bit, nobody panics."),
      beat('Nobody panics. The local listens to both halves, nods slowly, and gives them the tip.'),
      by('b', "Teamwork! Teamwork across a whole language!"),
    ] },
    { id: 'gyi.tp-a4', when: TP, turns: [
      by('b', "We kept losing the end. So we say the end first, then the start."),
      by('a', "That's not how sentences work."),
      beat('It is, apparently, how this sentence works. The local hands over the tip.'),
    ] },
  ],
  'task-try.struggling': [
    { id: 'gyi.tp-t1', when: TP, turns: [
      beat('{a} stands in front of the local, mouth open, nothing coming out.'),
      by('a', "It was right there. It was right there in my head."),
      by('b', "Where did it go?"),
      by('a', "The geyser scared it out of me."),
    ] },
    { id: 'gyi.tp-t2', when: TP, turns: [
      by('b', "Fourth time. He shook his head four times."),
      by('a', "Maybe he just doesn't like us."),
      by('b', "He liked the team before us. He smiled at them."),
    ] },
    { id: 'gyi.tp-t3', when: TP, turns: [
      beat("Halfway across the field, a geyser erupts right in front of {a}, and {a} forgets the whole phrase at once."),
      by('a', "Gone. It's gone. The steam took it."),
      by('b', "Back to the box. Again."),
    ] },
  ],
  'task-done.any': [
    { id: 'gyi.tp-dn1', when: TP, turns: [
      by('a', "I never want to hear that sentence again."),
      by('b', "We're going to hear it in our sleep for a year."),
      by('a', "Probably in my sleep tonight."),
    ] },
    { id: 'gyi.tp-dn2', when: TP, turns: [
      beat('{a} and {b} jog away from the geyser field, both still muttering the phrase under their breath.'),
      by('b', "Stop saying it. We passed. You can stop."),
      by('a', "I can't. It's stuck. It lives in me now."),
    ] },
    { id: 'gyi.tp-dn3', when: TP, turns: [
      by('b', "What does the phrase actually mean? Did anybody ask him?"),
      by('a', "I'm scared to ask."),
      by('b', "Me too. Let's never ask."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gyi.tp-x1', when: TP, turns: [
      beat('{b} says the phrase with total confidence. The local listens politely, and slowly shakes his head.'),
      by('b', "Which bit? Which bit was wrong?"),
      by('a', "From his face? All the bits."),
    ] },
    { id: 'gyi.tp-x2', when: TP, turns: [
      beat("A geyser goes off beside {a}, soaking {a.obj} from head to toe, halfway across the field."),
      by('a', "I'm wet! I'm boiling wet! What was the second word?"),
      by('b', "Back to the box!"),
    ] },
    { id: 'gyi.tp-x3', when: TP, turns: [
      beat('{a} gets every word right, but in the wrong order. The local shakes his head.'),
      by('a', "That's all of them! They're all there!"),
      by('b', "He wants them in the right order, apparently."),
    ] },
  ],
};

// ── feast or fossil (Either/Or) ──
const feastFossil = {
  'don-demo.gag': [
    { id: 'gyi.ff-d1', when: FF, turns: [
      don("In this Either/Or, Feast: eat a whole traditional meal. Fermented shark, a sheep's head, and some other things I'm not going to describe on television."),
      beat('He lifts the lid off a platter, looks at the sheep\'s head, and puts the lid back very quickly.'),
      don("Or Fossil: go into the ice cave and dig a fossil out of the wall without cracking it. Choose wisely. Or choose the cave."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'gyi.ff-d2', when: FF, turns: [
      don("Leave food on the plate, and you get a new plate. Crack the fossil, and you dig another one. You may switch sides at any time."),
      don("Bring me an empty platter or a fossil at the Chill Zone. Not the sheep's head. Never the sheep's head."),
      beat('Behind him, an assistant carries a tray of sheep\'s heads past. Don turns away.'),
    ] },
  ],
  'decide-side.agree': [
    { id: 'gyi.ff-c1', when: FF, turns: [
      by('a', "Fossil. We're doing the fossil. I am not eating a sheep's face."),
      by('b', "Agreed. Completely agreed. Never been so sure of anything."),
      by('a', "To the cave!"),
    ] },
    { id: 'gyi.ff-c2', when: FF, turns: [
      by('b', "Feast. How bad can it be? It's food."),
      by('a', "It's fermented shark. It's been buried for months."),
      by('b', "And then dug up again. So it's fine now."),
    ] },
  ],
  'decide-side.overruled': [
    { id: 'gyi.ff-c3', when: FF, turns: [
      by('a', "I want the cave."),
      by('b', "The cave is slow. We're eating."),
      by('a', "If I throw up, I'm throwing up on you."),
    ] },
  ],
  'task-start.any': [
    { id: 'gyi.ff-s1', when: FEAST, turns: [
      beat('A plate lands in front of {a} and {b}: grey cubes, a curled sheep\'s head, and a small, burning shot glass.'),
      by('a', "Which one first? Which one is the least bad?"),
      by('b', "There isn't a least bad. Pick one and go."),
    ] },
    { id: 'gyi.ff-s2', when: FEAST, turns: [
      by('b', "Hold your nose. You can't taste it if you can't smell it."),
      by('a', "I can smell it from here. I could smell it from the bus."),
      by('b', "Hold it harder."),
    ] },
    { id: 'gyi.ff-s3', when: FOSSIL, turns: [
      beat('{a} and {b} squeeze into the ice cave. Everything is blue, and every breath turns to fog.'),
      by('a', "It's beautiful. It's freezing, but it's beautiful."),
      by('b', "Find a fossil. Admire it after."),
    ] },
    { id: 'gyi.ff-s4', when: FOSSIL, turns: [
      by('b', "Small taps. If we hit it too hard, it cracks."),
      by('a', "Small taps. In a freezing cave. With frozen hands."),
      by('b', "Very small taps."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'gyi.ff-f1', when: FEAST, turns: [
      beat('{a} eats everything on the plate, one thing after the other, without stopping, then drinks the shot.'),
      by('b', "How? How did you do that?"),
      by('a', "I didn't chew. I didn't breathe. I didn't think about it once."),
    ] },
    { id: 'gyi.ff-f2', when: FEAST, turns: [
      by('b', "Last bite. Last one. On three."),
      beat('{b} swallows the last cube of shark on two, and slams the empty plate down.'),
      by('a', "That was two! You went on two!"),
    ] },
    { id: 'gyi.ff-f3', when: FOSSIL, turns: [
      beat('With one perfect tap, a whole fossil fish comes away from the ice in {a}\'s hands, not a crack on it.'),
      by('a', "Look at it. It's millions of years old, and it's perfect."),
      by('b', "It's perfect and it's ours. Don't drop it."),
    ] },
    { id: 'gyi.ff-f4', when: FOSSIL, turns: [
      by('b', "Got it! Got it, it's out, it's whole!"),
      by('a', "Wrap it in your scarf! Don't let it touch anything!"),
      beat('{b} wraps the fossil in a scarf like a newborn and carries it out of the cave very slowly.'),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'gyi.ff-a1', when: FEAST, turns: [
      by('a', "Second plate. We're going to finish this one. Both of us. Together."),
      beat('Bite for bite, they work through the second plate, and push it back clean.'),
      by('b', "I'm never eating again. But we're done."),
    ] },
    { id: 'gyi.ff-a2', when: FEAST, turns: [
      beat('{b} washes the shark down with water, then more water, then the shot.'),
      by('b', "Gone! Plate's empty! Get it to the Chill Zone!"),
      by('a', "Carry it carefully. It still smells."),
    ] },
    { id: 'gyi.ff-a3', when: FOSSIL, turns: [
      by('b', "The last one cracked because we went too fast. Go slow. Slower than slow."),
      beat('It takes twenty minutes, but the next fossil comes out of the ice in one piece.'),
      by('a', "Slower than slow works."),
    ] },
    { id: 'gyi.ff-a4', when: FOSSIL, turns: [
      beat('{a} chips round the edge of a fossil shell, millimetre by millimetre, and lifts it out whole.'),
      by('a', "Third time. Third fossil. Finally, a whole one."),
      by('b', "Don't sneeze. Do not sneeze."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'gyi.ff-t1', when: FEAST, turns: [
      beat('{a} has a piece of fermented shark in {a.posAdj} mouth and has been holding it there for two minutes.'),
      by('b', "Swallow it! Just swallow!"),
      by('a', "Mmf mmf mmf!"),
    ] },
    { id: 'gyi.ff-t2', when: FOSSIL, turns: [
      by('a', "My fingers don't work any more. I can't feel the hammer."),
      by('b', "Then hit it with the hammer you can't feel. Gently."),
      by('a', "How do I hit it gently with a hand I can't feel?"),
    ] },
    { id: 'gyi.ff-t3', when: FF, turns: [
      by('b', "Should we switch? The other side might be faster."),
      by('a', "We've done too much of this side to switch now."),
      by('b', "We've done almost none of this side."),
    ] },
  ],
  'task-done.any': [
    { id: 'gyi.ff-dn1', when: FF, turns: [
      by('a', "To the Chill Zone. With the proof."),
      by('b', "And nothing else. Nothing else from this canyon is coming with us."),
      by('a', "Except the smell. The smell is coming."),
    ] },
    { id: 'gyi.ff-dn2', when: FF, turns: [
      beat('{a} and {b} run along the river towards the rock wall, holding their prize out in front of them.'),
      by('b', "Don's going to ask how it was."),
      by('a', "And I'm going to lie."),
    ] },
    { id: 'gyi.ff-dn3', when: FF, turns: [
      by('b', "Was that the worst thing we've done on this race?"),
      by('a', "Top three. Easily top three."),
      by('b', "What are the other two?"),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'gyi.ff-x1', when: FEAST, turns: [
      beat('{b} takes one bite of fermented shark, goes very pale, and runs outside.'),
      by('a', "Are you okay? Do you need water?"),
      by('b', "I need a new mouth."),
    ] },
    { id: 'gyi.ff-x2', when: FOSSIL, turns: [
      beat('Crack. A fossil splits in two in {a}\'s hands.'),
      by('a', "No. No, no, no. It was nearly out."),
      by('b', "It was a hundred million years old, and it lasted until you."),
    ] },
    { id: 'gyi.ff-x3', when: FF, turns: [
      beat('The judge looks at what they brought him, and points back at the hut and the cave.'),
      by('a', "It's not enough?"),
      by('b', "Apparently not. Back we go."),
    ] },
  ],
};

export default mergePools(place, roads, telephone, feastFossil);
