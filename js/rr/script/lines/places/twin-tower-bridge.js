// Twin Tower Bridge's own lines (js/rr/places/twin-tower-bridge.js), in our own words:
//   the bus         a red double-decker to the fortress: stuck in traffic.
//   the kidnapper   All-In: a masked kidnapper's riddle notes through the fortress, the cobbled lanes and the dungeon by
//                   lantern, to the one royal guard in a tall fur hat holding the tip; the guards never move, speak or
//                   smile; a misread note or the wrong guard and it's back to the last clue.
//   the crown jewel Botch or Watch: twenty glittering crowns, rings and sceptres on velvet, one real; the keeper holds
//                   each up to the light. a picks, b watches from the rope.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'twin-tower-bridge' };
const KD = { taskId: 'kidnapper' };
const CJ = { taskId: 'crown-jewel' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'ttb.op1', when: P, turns: [
      beat("Don stands on a great stone bridge between two towers, fog rolling up from the river, an umbrella over his head even though it isn't raining. Yet."),
      don("Welcome to Twin Tower Bridge! Home of fog, tea, queues, and a lot of men in very tall furry hats who are not allowed to laugh at my jokes."),
      don("Tonight, teams hunt a masked kidnapper through an old fortress. I didn't write that. I wish I had. It's very dramatic."),
      beat('It starts to rain. Don, already under the umbrella, looks smug.'),
    ] },
    { id: 'ttb.op2', when: P, turns: [
      don("Twin Tower Bridge. It rains here three hundred days a year. The other sixty-five, it's thinking about it."),
      don("Racers, the red double-decker bus to the fortress leaves from the end of the bridge. Sit upstairs. The view is better. The rain is the same."),
      beat('A red double-decker bus splashes through a puddle behind him, soaking the bottom of his trousers.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'ttb.op3', when: P, turns: [
      beat("Don sits in a cosy pub by the fire, a cup of tea in one hand and a biscuit in the other."),
      don("Twin Tower Bridge. I'm having tea. It's very civilised. The bus is outside."),
      don("Off you go. Don't spill anything. And mind the fog."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'ttb.ar1', when: P, turns: [
      beat("The red bus crosses the great bridge at dusk, the two stone towers lit up gold, and the old city glowing all along the river."),
      by('a', "It's like a storybook. A big, foggy storybook."),
      by('b', "Look at the clock tower! Look at the castle!"),
      by('a', "Everything here is very old and very lit up."),
    ] },
    { id: 'ttb.ar2', when: P, turns: [
      beat("They pass a palace gate where a row of guards in red coats and tall black fur hats stand perfectly still."),
      by('b', "Are they real? They're not moving at all."),
      by('a', "They're real. They're just very, very good at standing still."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'ttb.ad1', when: P, turns: [
      by('a', "The tip says 'masked kidnapper'. Is somebody actually kidnapped?"),
      by('b', "I hope not. I hope it's pretend."),
      by('a', "It says 'dungeon' too."),
    ] },
    { id: 'ttb.ad2', when: P, turns: [
      by('b', "The fog's so thick. I can't see the end of the street."),
      by('a', "Stay close. Don't get lost in a foggy city at night."),
      by('b', "That's how every scary story starts."),
    ] },
  ],
};

// ── the bus (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'ttb.tm1', when: { taskId: 'double-decker', mishap: 'stuck-in-traffic' }, turns: [
      beat("The double-decker crawls into a jam of black cabs and red buses that stretches all the way to the next bridge."),
      by('a', "We're not moving. We've not moved for ten minutes."),
      by('b', "Everyone here seems very calm about it. They're all reading."),
      beat('Twenty minutes later, the traffic finally starts to move, slowly, politely.'),
    ] },
  ],
};

// ── the masked kidnapper (All-In) ──
const kidnapper = {
  'don-demo.gag': [
    { id: 'ttb.kd-d1', when: KD, turns: [
      don("In this All-In, a masked kidnapper has hidden notes all over this fortress. Each one is a riddle that points to the next. Follow them by lantern."),
      beat('A figure in a black mask and cape darts across the courtyard behind him and vanishes into a doorway. Don jumps.'),
      don("That's him. That's the kidnapper. He's an actor. I think. I hope. I didn't hire him."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'ttb.kd-d2', when: KD, turns: [
      don("The last note tells you which royal guard is holding your tip. The guards will not move, speak, or smile. Choose the wrong one, or misread a note, and you go back to the last clue."),
      don("I've been trying to make one laugh for an hour. Nothing. Not a twitch. It's the hardest crowd I've ever had."),
      beat('A guard in a tall fur hat stands behind him, staring straight ahead, absolutely still.'),
    ] },
  ],
  'task-start.any': [
    { id: 'ttb.kd-s1', when: KD, turns: [
      beat("{a} and {b} unfold the first note by lantern light in the dark fortress courtyard."),
      by('a', "'Where the iron mouth roars but never eats.'"),
      by('b', "A cannon! It's a cannon!"),
    ] },
    { id: 'ttb.kd-s2', when: KD, turns: [
      by('b', "Hold the lantern higher. I can't read his handwriting."),
      by('a', "He writes like he's in a hurry."),
      by('b', "He's a kidnapper. He is in a hurry."),
    ] },
    { id: 'ttb.kd-s3', when: KD, turns: [
      beat("{a} and {b} creep down narrow stone steps into the dungeon, the lantern throwing long shadows on the walls."),
      by('a', "Did you hear that?"),
      by('b', "I'm trying very hard not to hear anything."),
    ] },
    { id: 'ttb.kd-s4', when: KD, turns: [
      by('a', "Should we split up?"),
      by('b', "In a dark fortress? With a kidnapper? Absolutely not."),
      by('a', "Fair point."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'ttb.kd-f1', when: KD, turns: [
      beat("Note by note, riddle by riddle, {a} and {b} solve every clue, and walk straight up to the right guard. He hands over the tip without a word."),
      by('a', "We did it! We're detectives!"),
      by('b', "He didn't even blink. Not once."),
    ] },
    { id: 'ttb.kd-f2', when: KD, turns: [
      by('b', "'The guard who stands where the ravens sleep.' The tower! The one by the ravens!"),
      beat("They run to the guard by the raven tower. He holds out the tip, still staring straight ahead."),
      by('a', "First try! We solved the whole mystery!"),
    ] },
    { id: 'ttb.kd-f3', when: KD, turns: [
      beat("{a} reads the last note, thinks for a second, and points at one guard in a row of five."),
      by('a', "Him. It's him. The one with the button undone."),
      beat('The guard looks down at his button for the first time all night, and hands over the tip.'),
    ] },
    { id: 'ttb.kd-f4', when: KD, turns: [
      by('b', "First go. Every riddle."),
      by('a', "I've always wanted to solve a mystery."),
      by('b', "And now you have. In a dungeon."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'ttb.kd-a1', when: KD, turns: [
      by('b', "We misread the last note. It doesn't say 'gate'. It says 'great'. 'The great door.'"),
      beat("They find the great door, the last note, and the right guard. The tip is theirs."),
      by('a', "One letter! One letter sent us the wrong way!"),
    ] },
    { id: 'ttb.kd-a2', when: KD, turns: [
      beat("Back at the cannon for the second time, {a} finally notices a second note tucked inside the barrel."),
      by('a', "There were two notes! We only read one!"),
      by('b', "And this one leads to the guard! Run!"),
    ] },
    { id: 'ttb.kd-a3', when: KD, turns: [
      by('a', "The wrong guard didn't blink. The right guard won't either. So look at the boots. Ours has muddy boots. The note said so."),
      beat("They check every guard's boots. Only one has mud on them. He hands over the tip."),
      by('b', "Boots! It was in the boots!"),
    ] },
    { id: 'ttb.kd-a4', when: KD, turns: [
      beat("After two wrong guards and one very long walk back through the dungeon, {a} and {b} find the right guard at last."),
      by('a', "Third guard. Third time. Finally."),
      by('b', "I never want to see a fur hat again."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'ttb.kd-t1', when: KD, turns: [
      beat("{a} and {b} stand in the dark dungeon, reading the same note over and over, getting nowhere."),
      by('a', "'Where the light dies twice.' What does that mean?"),
      by('b', "I don't know. I'm not a kidnapper."),
    ] },
    { id: 'ttb.kd-t2', when: KD, turns: [
      by('b', "The lantern's going out. It's flickering."),
      by('a', "Read faster!"),
      by('b', "I can't read faster in the dark!"),
    ] },
    { id: 'ttb.kd-t3', when: KD, turns: [
      beat("{a} is standing very close to a guard, pulling faces, trying to make him react."),
      by('a', "Are you the one? Blink twice if you're the one."),
      by('b', "They don't blink! Stop it! Read the note!"),
    ] },
  ],
  'task-done.any': [
    { id: 'ttb.kd-dn1', when: KD, turns: [
      by('a', "Who was the kidnapper, though? We never found out."),
      by('b', "Maybe it was Don."),
      by('a', "It was definitely not Don. He's scared of the dark."),
    ] },
    { id: 'ttb.kd-dn2', when: KD, turns: [
      beat("{a} and {b} climb out of the fortress into the foggy street, blinking in the lamplight."),
      by('b', "We survived a dungeon."),
      by('a', "And a kidnapper. And a lot of very serious hats."),
    ] },
    { id: 'ttb.kd-dn3', when: KD, turns: [
      by('b', "The tip says 'treasure'. Crown jewels."),
      by('a', "Real crown jewels?"),
      by('b', "One real one. The rest are fake."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'ttb.kd-x1', when: KD, turns: [
      beat("{a} walks up to a guard and holds out a hand for the tip. The guard doesn't move. He has no tip."),
      by('a', "Wrong one. Definitely the wrong one."),
      by('b', "Back to the last note!"),
    ] },
    { id: 'ttb.kd-x2', when: KD, turns: [
      beat("{a} and {b} follow the riddle into a dead end in the dungeon. Just a stone wall and a very old rat."),
      by('b', "Is the rat the clue?"),
      by('a', "The rat is not the clue! We read it wrong! Back!"),
    ] },
    { id: 'ttb.kd-x3', when: KD, turns: [
      beat("The lantern goes out in the middle of the dungeon. Total darkness."),
      by('a', "Who turned the light off?"),
      by('b', "The light turned itself off! Back to the courtyard!"),
    ] },
  ],
};

// ── the crown jewel (Botch or Watch: a picks, b watches from the rope) ──
const jewel = {
  'don-demo.gag': [
    { id: 'ttb.cj-d1', when: CJ, turns: [
      don("In this Botch or Watch, one of you picks the one real crown jewel from this table. Twenty treasures. Nineteen are glass and paint."),
      beat('He reaches for a crown to try it on. The keeper of the jewels slaps his hand away without looking up.'),
      don("Not allowed to try them on. Noted. Very noted."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'ttb.cj-d2', when: CJ, turns: [
      don("Pick one, and the keeper holds it up to the light. A fake goes back, and you choose again. The other one of you watches from behind the rope."),
      don("The real crown jewel gets you the next tip. Do not drop anything. The keeper is a very serious person."),
      beat('The keeper of the jewels, in white gloves, holds a magnifying glass up to one eye and does not smile.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'ttb.cj-w1', when: CJ, turns: [
      by('b', "You did the last one? No. That was me. So, you."),
      by('a', "I don't know anything about jewels."),
      by('b', "You know about sparkly things. You love sparkly things."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'ttb.cj-w2', when: CJ, turns: [
      by('a', "I'll do it. I watch all the antiques shows."),
      by('b', "Do you ever guess right?"),
      by('a', "Sometimes. Once. But I watch them."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'ttb.cj-w3', when: CJ, turns: [
      by('b', "Not me. If I touch anything worth that much, I'll drop it. You."),
      by('a', "What if I drop it?"),
      by('b', "Then at least it wasn't me."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'ttb.cj-w4', when: CJ, turns: [
      by('a', "'Who has an eye for sparkle?' That's you. You can spot a sale from a mile away."),
      by('b', "That's a different kind of sparkle."),
      by('a', "Same eye. Go."),
    ] },
  ],
  'task-start.any': [
    { id: 'ttb.cj-s1', when: CJ, turns: [
      beat("{a} stands in front of the velvet table, twenty glittering treasures under the lights, every one of them dazzling."),
      by('a', "They're all beautiful. They all look real."),
      by('b', "One of them is real. Look closely."),
    ] },
    { id: 'ttb.cj-s2', when: CJ, turns: [
      by('b', "Real jewels sparkle in colours. Glass sparkles white. That's what I heard."),
      by('a', "Where did you hear that?"),
      by('b', "On a show. About diamonds."),
    ] },
    { id: 'ttb.cj-s3', when: CJ, turns: [
      beat("{a} leans in close to a crown, nose almost touching it, squinting at the stones."),
      by('a', "This one has a tiny scratch."),
      by('b', "Is that good or bad?"),
    ] },
    { id: 'ttb.cj-s4', when: CJ, turns: [
      by('a', "Real gold is heavy. If it's light, it's fake."),
      by('b', "Then pick them up."),
      by('a', "Am I allowed to pick them up?"),
    ] },
  ],
  'task-try.first-try': [
    { id: 'ttb.cj-f1', when: CJ, turns: [
      beat("{a} picks a small, plain-looking ring from the very end of the table. The keeper holds it to the light, and nods."),
      by('b', "That one? The plainest one?"),
      by('a', "The real thing doesn't need to show off."),
    ] },
    { id: 'ttb.cj-f2', when: CJ, turns: [
      by('a', "This crown. It's heavier than the others. Feel."),
      beat("The keeper holds the crown up to the light, turns it slowly, and nods. Real."),
      by('b', "First try! You found the crown jewels!"),
    ] },
    { id: 'ttb.cj-f3', when: CJ, turns: [
      beat("{a} watches the light on every stone, then chooses a sceptre whose jewel throws tiny rainbows on the wall."),
      by('a', "Colours. Real stones make colours."),
      beat('The keeper nods. Real. The tip is theirs.'),
    ] },
    { id: 'ttb.cj-f4', when: CJ, turns: [
      by('b', "First pick. A real crown jewel."),
      by('a', "I held a real crown jewel."),
      by('b', "For about four seconds."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'ttb.cj-a1', when: CJ, turns: [
      by('b', "The fakes are all too shiny. Pick the one that's a bit dull. Old things are dull."),
      beat("{a} picks the dullest crown on the table. The keeper holds it up. Real."),
      by('a', "Dull was right! Dull was real!"),
    ] },
    { id: 'ttb.cj-a2', when: CJ, turns: [
      beat("Third pick. {a} weighs every piece in turn, puts back every light one, and hands over the heaviest."),
      by('a', "The heaviest. It has to be."),
      beat('It is. The keeper nods, and gives them the tip.'),
    ] },
    { id: 'ttb.cj-a3', when: CJ, turns: [
      by('a', "The keeper looked at one ring twice when I picked the wrong ones. That one."),
      beat("{a} picks the ring the keeper glanced at. The keeper holds it up, and smiles very, very slightly."),
      by('b', "She smiled! She actually smiled!"),
    ] },
    { id: 'ttb.cj-a4', when: CJ, turns: [
      beat("After two fakes, {a} finally holds up a crown that throws colour all over the vault walls."),
      by('a', "This is it. I can feel it."),
      by('b', "And the keeper's nodding!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'ttb.cj-t1', when: CJ, turns: [
      beat("{a} has been staring at the table for ten minutes, holding two rings, one in each hand."),
      by('a', "This one or this one?"),
      by('b', "Pick one! Any one!"),
    ] },
    { id: 'ttb.cj-t2', when: CJ, turns: [
      by('b', "That's four fakes. Four."),
      by('a', "They're very good fakes."),
      by('b', "They're very good at being wrong."),
    ] },
    { id: 'ttb.cj-t3', when: CJ, turns: [
      beat("{a} picks up a sceptre, and it's so much heavier than expected that it nearly drops."),
      by('a', "Heavy! Heavy! Very heavy!"),
      by('b', "Don't drop it! Whatever it is, don't drop it!"),
    ] },
  ],
  'task-done.any': [
    { id: 'ttb.cj-dn1', when: CJ, turns: [
      by('a', "I touched a crown jewel."),
      by('b', "You touched about six fake ones too."),
      by('a', "I only remember the real one."),
    ] },
    { id: 'ttb.cj-dn2', when: CJ, turns: [
      beat("{a} and {b} walk out of the vault into the foggy night, towards the glow of the Chill Zone."),
      by('b', "I feel like a royal."),
      by('a', "You look like somebody who's been in a dungeon."),
    ] },
    { id: 'ttb.cj-dn3', when: CJ, turns: [
      by('b', "The keeper smiled at you at the end."),
      by('a', "She did. A tiny bit."),
      by('b', "That's more than the guards did."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'ttb.cj-x1', when: CJ, turns: [
      beat("The keeper holds the crown up to the light, taps a stone with her fingernail, and shakes her head. Glass."),
      by('a', "It looked so real!"),
      by('b', "They all look real! Pick again!"),
    ] },
    { id: 'ttb.cj-x2', when: CJ, turns: [
      beat("{a} picks up a ring, and a little painted stone falls right out of it onto the velvet."),
      by('a', "Oops. That's definitely a fake."),
      by('b', "Put it back! Gently! Choose again!"),
    ] },
    { id: 'ttb.cj-x3', when: CJ, turns: [
      beat("The keeper looks at the sceptre {a} has chosen, and doesn't even hold it up. She just points at the table."),
      by('a', "She didn't even check!"),
      by('b', "She didn't need to. Again!"),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'ttb.cj-v1', when: CJ, turns: [
      by('b', "You've got a royal eye! A royal eye!"),
      by('a', "Shh! You're making the keeper nervous!"),
      by('b', "Nothing makes the keeper nervous!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'ttb.cj-v2', when: CJ, turns: [
      beat("{b} grips the rope barrier with both hands, watching {a} hover over every jewel."),
      by('b', "Not that one. Or that one. Oh, I don't know."),
      by('a', "Then stop saying 'not that one'!"),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'ttb.cj-v3', when: CJ, turns: [
      beat("{b} leans over the rope and points straight at a crown."),
      by('b', "That one! The big one!"),
      beat('The keeper looks up, raises one white-gloved finger, and marks something in her book. A penalty.'),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'ttb.cj-v4', when: CJ, turns: [
      beat("{b} stands perfectly still behind the rope, as still as a royal guard, not saying a word."),
      by('a', "Are you okay?"),
      by('b', "I'm being a guard. Guards don't talk."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'ttb.cj-h1', when: CJ, turns: [
      beat("While the keeper writes in her book, {b} tilts a lamp so the light falls across the whole table."),
      by('a', "Oh! That one's throwing rainbows now!"),
      by('b', "The lamp moved on its own. Pick it."),
    ] },
  ],
};

export default mergePools(place, roads, kidnapper, jewel);
