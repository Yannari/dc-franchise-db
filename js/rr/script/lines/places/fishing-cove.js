// Fishing Cove's own lines (js/rr/places/fishing-cove.js), in our own words:
//   the rowboat      in from the open sea: an oar goes overboard.
//   the welcome rite All-In: a full glass of something that tastes like vinegar, a sentence in the cove's thick dialect
//                    said back word for word, and a kiss full on the lips for a very large, very dead cod; spit, a wrong
//                    word or a flinch from the fish and the rite starts again.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'fishing-cove' };
const WR = { taskId: 'welcome-rite' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'fsc.op1', when: P, turns: [
      beat("Don stands on a wooden jetty in a yellow raincoat and hat, rain pouring off the brim, a row of brightly painted fishing shacks behind him."),
      don("Welcome to Fishing Cove! The friendliest people in the world, the worst weather in the world, and more fish than anywhere else on the planet."),
      don("Today, teams row ashore and become honorary locals. There's a ceremony. It involves a fish. And your lips. I'll say no more."),
      beat('A wave crashes over the end of the jetty and soaks him from the knees down. He keeps smiling. Barely.'),
    ] },
    { id: 'fsc.op2', when: P, turns: [
      don("Fishing Cove. Rocks, fog, little painted cottages, and an accent so thick I've understood about one word in four since we landed."),
      don("Racers, your rowboats are out at sea. Row to the cove. The cove is that way. Probably. In the fog."),
      beat('A fisherman walks past and says a long, friendly sentence to Don. Don nods and smiles. He has no idea what was said.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'fsc.op3', when: P, turns: [
      beat("Don sits in a cosy kitchen with a mug of tea and a plate of fried fish, the rain beating on the window."),
      don("Fishing Cove. It's raining. I'm inside. The rowboats are outside. With you."),
      don("Off you go. Mind the waves."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'fsc.ar1', when: P, turns: [
      beat("The fog lifts as the rowboat comes round the headland, and there's the cove: little cottages painted red, yellow and blue, stacked up the rocks."),
      by('a', "It's like a box of crayons. On a cliff."),
      by('b', "Every cottage is a different colour."),
      by('a', "So the fishermen can find their way home in the fog."),
    ] },
    { id: 'fsc.ar2', when: P, turns: [
      beat("A whale surfaces in the bay beside them, blows a spout of mist into the air, and slides back under."),
      by('b', "A whale! A real whale! Right there!"),
      by('a', "Keep rowing! But that was amazing!"),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'fsc.ad1', when: P, turns: [
      by('a', "The tip says 'kiss a cod'. What does that mean?"),
      by('b', "I think it means exactly that."),
      by('a', "I was afraid you'd say that."),
    ] },
    { id: 'fsc.ad2', when: P, turns: [
      beat("{a} and {b} look out at the grey, choppy sea, and the tiny rowboat bobbing in it."),
      by('b', "We're rowing in that?"),
      by('a', "Apparently we're rowing in that."),
    ] },
  ],
};

// ── the rowboat (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'fsc.tm1', when: { taskId: 'rowboat', mishap: 'oar-overboard' }, turns: [
      beat("A wave knocks the boat sideways, and one of {a}'s oars slips out of its holder and floats away."),
      by('a', "The oar! The oar's escaping!"),
      by('b', "Paddle with your hands! Get it!"),
      beat('Twenty minutes of hand-paddling and lunging later, they have the oar back.'),
    ] },
  ],
};

// ── the welcome rite (All-In) ──
const rite = {
  'don-demo.gag': [
    { id: 'fsc.wr-d1', when: WR, turns: [
      don("In this All-In, become honorary locals. Drink a glass of the local drink. Repeat what the fisherman says, word for word. Then kiss the cod."),
      beat('He picks up the glass, sniffs it, and his eyes water instantly. He puts it straight back down.'),
      don("It tastes exactly like vinegar. I'm told it isn't vinegar. I'm told that by people who've drunk a lot of it."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'fsc.wr-d2', when: WR, turns: [
      don("Spit it out, get a word wrong, or pull away from the fish, and you start the rite again from the beginning."),
      don("When the fisherman says you're locals, you get the next tip. And the fish gets nothing. The fish never gets anything."),
      beat('The old fisherman lifts the cod off the table and holds it up. It stares at the camera with dead, glassy eyes.'),
    ] },
  ],
  'task-start.any': [
    { id: 'fsc.wr-s1', when: WR, turns: [
      beat("{a} and {b} sit down at the table opposite the old fisherman, with two full glasses and one very large cod between them."),
      by('a', "Drink first? Or fish first?"),
      by('b', "Drink first. We might need it for the fish."),
    ] },
    { id: 'fsc.wr-s2', when: WR, turns: [
      by('b', "Hold your nose. Drink it in one go. Don't stop."),
      by('a', "What if it comes back up?"),
      by('b', "Then we drink another one. Hold your nose."),
    ] },
    { id: 'fsc.wr-s3', when: WR, turns: [
      beat("The fisherman says a long sentence in the cove's dialect, smiling, and waits."),
      by('a', "Could you say that again? Slower?"),
      beat('He says it again. It is not slower. It is somehow faster.'),
    ] },
    { id: 'fsc.wr-s4', when: WR, turns: [
      by('a', "How long do you have to kiss it?"),
      by('b', "Long enough that he says yes."),
      by('a', "That's not a length of time."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'fsc.wr-f1', when: WR, turns: [
      beat("{a} and {b} drink the whole glass, repeat the sentence perfectly, and kiss the cod without a flinch. The fisherman cheers."),
      by('a', "He's cheering! We're locals!"),
      by('b', "I just kissed a fish, and I've never been prouder."),
    ] },
    { id: 'fsc.wr-f2', when: WR, turns: [
      by('b', "Say it back like he does. Sing it, almost."),
      beat("{b} sings the sentence back, and gets every word. The fisherman slaps the table with joy."),
      by('a', "You sounded exactly like him!"),
    ] },
    { id: 'fsc.wr-f3', when: WR, turns: [
      beat("{a} takes the cod in both hands, closes {a.posAdj} eyes, and plants a big kiss right on its lips. The fisherman laughs and claps."),
      by('b', "That was very committed."),
      by('a', "If you're going to kiss a fish, kiss it properly."),
    ] },
    { id: 'fsc.wr-f4', when: WR, turns: [
      by('a', "First try. Drink, words, fish. All of it."),
      by('b', "We're honorary locals now."),
      by('a', "Do we get a cottage? A little painted one?"),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fsc.wr-a1', when: WR, turns: [
      by('b', "We keep getting the middle word wrong. He's saying 'b'y', not 'boy'."),
      beat("{a} says 'b'y', and the rest of the sentence. The fisherman grins and nods."),
      by('a', "B'y! It was b'y all along!"),
    ] },
    { id: 'fsc.wr-a2', when: WR, turns: [
      beat("Second glass. This time {a} drinks it in one go without breathing, slams down the glass, and doesn't flinch."),
      by('a', "It's down! It's staying down!"),
      beat('The cod kiss goes smoothly after that. The fisherman declares them locals.'),
    ] },
    { id: 'fsc.wr-a3', when: WR, turns: [
      by('a', "I keep pulling away from the fish. So you hold my head."),
      beat("{b} holds {a}'s head, gently, and {a} kisses the cod all the way through. The fisherman applauds."),
      by('b', "Teamwork! Disgusting teamwork, but teamwork!"),
    ] },
    { id: 'fsc.wr-a4', when: WR, turns: [
      beat("Third time through the whole rite, and {a} and {b} finally get every part right."),
      by('a', "Locals! We're finally locals!"),
      by('b', "I've kissed that cod three times. We're basically married."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'fsc.wr-t1', when: WR, turns: [
      beat("{a} has the glass at {a.posAdj} lips and has been holding it there for a minute without drinking."),
      by('a', "It smells so strong. It smells like a salad that went wrong."),
      by('b', "Just drink it! One gulp!"),
    ] },
    { id: 'fsc.wr-t2', when: WR, turns: [
      by('b', "I don't understand a single word he's saying."),
      by('a', "He's very friendly about it, though."),
      by('b', "He's friendly, and I'm lost."),
    ] },
    { id: 'fsc.wr-t3', when: WR, turns: [
      beat("{a} and {b} are both staring at the cod. The cod is staring back."),
      by('a', "It's looking at me. Why is it looking at me?"),
      by('b', "It's dead. It's not looking at anything."),
    ] },
  ],
  'task-done.any': [
    { id: 'fsc.wr-dn1', when: WR, turns: [
      by('a', "I kissed a cod."),
      by('b', "We both kissed a cod."),
      by('a', "We're never telling anyone about this."),
    ] },
    { id: 'fsc.wr-dn2', when: WR, turns: [
      beat("{a} and {b} walk out of the shack wiping their mouths, and the fisherman shakes both their hands at the door."),
      by('b', "He hugged me. The fisherman hugged me."),
      by('a', "We're family now. Locals are family."),
    ] },
    { id: 'fsc.wr-dn3', when: WR, turns: [
      by('b', "What did that sentence even mean?"),
      by('a', "I'm scared to ask."),
      by('b', "Then let's never ask."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'fsc.wr-x1', when: WR, turns: [
      beat("{b} takes a sip, and sprays it straight back out across the table."),
      by('b', "It's vinegar! It's definitely vinegar!"),
      by('a', "Start again! New glass!"),
    ] },
    { id: 'fsc.wr-x2', when: WR, turns: [
      beat("{a} repeats the sentence with total confidence. The fisherman laughs, and shakes his head."),
      by('a', "What did I say? What did I actually say?"),
      by('b', "Something wrong! Something very funny and wrong! Again!"),
    ] },
    { id: 'fsc.wr-x3', when: WR, turns: [
      beat("{a} leans in to kiss the cod, and pulls away at the very last second with a shriek."),
      by('a', "I can't! It's too fishy!"),
      by('b', "It's a fish! Of course it's fishy! Again!"),
    ] },
  ],
};

export default mergePools(place, roads, rite);
