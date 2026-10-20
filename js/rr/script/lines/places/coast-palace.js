// Coast Palace's own lines (js/rr/places/coast-palace.js), 1:1 with the real leg ("Mediterranean Homesick Blues"),
// in our own words:
//   the train      along the coast: the wrong carriage.
//   the shark      Botch or Watch: grab the tip off a great white's fin as it swims past; too early, too late or back
//                  up the ladder, and wait for it to come round again. a is in the water, b on the boat.
//   the palace     All-In: a sand replica of the palace for a little surfer boy who is very, very strict.
//   the motorboat  out to the Chill Zone: the engine cuts out.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'coast-palace' };
const SH = { taskId: 'shark' };
const SP = { taskId: 'sand-palace' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'cpl.op1', when: P, turns: [
      beat('Don stands on a yacht in the harbour, in a white suit, holding a tiny cup of coffee.'),
      don("Welcome to Coast Palace! Home of yachts, casinos, a royal palace, and people who are richer than me. I hate it."),
      don("Today, teams take a tip off a shark, and build a palace out of sand for the toughest critic on the coast."),
      beat('A gull lands on the rail and stares at his coffee.'),
      don("Not the coffee. That coffee cost more than your flights."),
    ] },
    { id: 'cpl.op2', when: P, turns: [
      don("Coast Palace. The sea is blue, the cars are fast, and the sharks are, I'm told, mostly friendly."),
      don("Mostly. Racers, your train leaves in five minutes. Try not to fall in love with the view. It's mine."),
      beat('A yacht in the background sounds its horn. Don waves at it like an old friend.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'cpl.op3', when: P, turns: [
      beat('Don is lying on a sunlounger on a private beach, sunglasses on, not moving.'),
      don("Coast Palace. I'm on holiday. They're on a race. One of us is having a better day."),
      don("Your tip is on a shark. Off you go. Don't splash me."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'cpl.ar1', when: P, turns: [
      beat('The train comes out of a tunnel, and the whole coast is suddenly there: blue water, white yachts, a palace on the cliff.'),
      by('a', "Look at the water. Look at the colour of it. That's not a real colour."),
      by('b', "Every boat down there is worth more than my whole street."),
      by('a', "Then don't touch any of them."),
    ] },
    { id: 'cpl.ar2', when: P, turns: [
      by('b', "There's a palace. On the cliff. With actual guards outside."),
      by('a', "Do you think the challenge is in the palace?"),
      by('b', "Look at us. They are not letting us in the palace."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'cpl.ad1', when: P, turns: [
      by('a', "I just read the word 'shark' on the tip. Just the word. That's all I needed."),
      by('b', "Maybe it's a boat called The Shark."),
      by('a', "It has a picture of a fin on it."),
    ] },
    { id: 'cpl.ad2', when: P, turns: [
      beat('A cyclist in head-to-toe designer clothing sweeps past them on the promenade.'),
      by('b', "Everybody here is dressed better than us."),
      by('a', "We've been in the same clothes for four days."),
      by('b', "Exactly my point."),
    ] },
  ],
};

// ── the train and the motorboat (mishaps) ──
const roads = {
  'travel-mishap.any': [
    { id: 'cpl.tm1', when: { taskId: 'coast-train', mishap: 'wrong-carriage' }, turns: [
      beat('At the second stop, the back half of the train uncouples and goes the other way. {a} and {b} are in the back half.'),
      by('a', "Why are we going backwards?"),
      by('b', "We're not going backwards. We're going somewhere else. Completely somewhere else."),
      beat('Fifteen minutes and one very fast change of trains later, they are back on the coast line.'),
    ] },
    { id: 'cpl.tm2', when: { taskId: 'motorboat', mishap: 'engine-cuts-out' }, turns: [
      beat('Halfway across the harbour, the motorboat coughs twice and goes silent.'),
      by('b', "It stopped. Why did it stop?"),
      by('a', "I don't know. I've driven a boat once, and it was a pedalo."),
      beat('{b} pulls the cord eleven times. On the twelfth, it roars back to life.'),
    ] },
  ],
};

// ── the shark (Botch or Watch: a is in the water, b is on the boat) ──
const shark = {
  'don-demo.gag': [
    { id: 'cpl.sh-d1', when: SH, turns: [
      don("In this Botch or Watch, one of you gets in the water with a great white shark, and takes the tip off its dorsal fin."),
      beat('He holds up a laminated picture of a shark and points at the fin.'),
      don("This bit. Not the mouth bit. I cannot stress enough how much you want this bit."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'cpl.sh-d2', when: SH, turns: [
      don("Miss the fin, grab too early, or climb back up the ladder screaming, and you wait for it to come round again."),
      don("It always comes round again. That's what sharks do. That's the whole problem with sharks."),
      beat('Behind him, the fin slides past the boat. He takes one very large step away from the rail.'),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'cpl.sh-w1', when: SH, turns: [
      by('b', "You're the swimmer. You've always been the swimmer."),
      by('a', "I swim in pools. Pools don't have sharks."),
      by('b', "This is just a big pool. With a shark."),
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'cpl.sh-w2', when: SH, turns: [
      by('a', "I'll do it. If I think about it for one more second, I won't, so I'm doing it now."),
      by('b', "Are you sure?"),
      by('a', "No. Hold my shoes."),
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'cpl.sh-w3', when: SH, turns: [
      by('b', "It's your turn. I did the last one."),
      by('a', "The last one was a crossword."),
      by('b', "And I did it beautifully. Off you go."),
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'cpl.sh-w4', when: SH, turns: [
      by('a', "'Who's scared of sharks?' Everybody. Everybody is scared of sharks. That's the answer."),
      by('b', "Then it's you. You're the least scared of everything."),
      by('a', "That is not a compliment right now."),
    ] },
  ],
  'task-start.any': [
    { id: 'cpl.sh-s1', when: SH, turns: [
      beat('{a} stands on the bottom rung of the ladder, up to the knees in the sea. A grey fin cuts through the water a few metres away.'),
      by('a', "It's right there. It's right there."),
      by('b', "That's good! That's where the tip is!"),
      by('a', "That's where the shark is!"),
    ] },
    { id: 'cpl.sh-s2', when: SH, turns: [
      by('b', "Wait for it to come past, then grab. Don't chase it. Let it come to you."),
      by('a', "Let the shark come to me. Great. Brilliant advice."),
      by('b', "I'm a great coach. Go."),
    ] },
    { id: 'cpl.sh-s3', when: SH, turns: [
      beat('{a} lowers into the water, eyes huge behind the mask.'),
      by('a', "It's cold. Why is it cold? It's sunny."),
      by('b', "Focus on the fin, not the temperature!"),
    ] },
    { id: 'cpl.sh-s4', when: SH, turns: [
      by('a', "If I don't come back, tell everybody I was brave."),
      by('b', "You're getting in a sea, not going to war."),
      by('a', "A sea with a shark in it is basically a war."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'cpl.sh-f1', when: SH, turns: [
      beat('The shark glides past. {a} reaches out, unclips the tip off the fin in one smooth move, and is back on the ladder before it turns.'),
      by('b', "That was amazing! You didn't even flinch!"),
      by('a', "I flinched on the inside. A lot."),
    ] },
    { id: 'cpl.sh-f2', when: SH, turns: [
      by('a', "Got it! I touched a shark! I touched a shark and it didn't care!"),
      by('b', "Get out of the water before it starts caring!"),
      beat('{a} is up the ladder so fast the crew member has to step back.'),
    ] },
    { id: 'cpl.sh-f3', when: SH, turns: [
      beat('{a} waits, perfectly still, and grabs at exactly the right moment. The tip comes away clean.'),
      by('b', "How were you so calm?"),
      by('a', "I wasn't. I just couldn't move."),
    ] },
    { id: 'cpl.sh-f4', when: SH, turns: [
      by('a', "First go. First go! Write it down!"),
      by('b', "I'm writing it down. In my heart. Now climb."),
      by('a', "Climbing! Climbing very fast!"),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'cpl.sh-a1', when: SH, turns: [
      by('b', "Don't grab at the fin. Grab where the fin is going to be."),
      by('a', "That's physics. I can't do physics in a sea."),
      beat('On the next pass, {a} reaches ahead of the fin, and the tip comes away in {a.posAdj} hand.'),
      by('a', "Physics! I did physics!"),
    ] },
    { id: 'cpl.sh-a2', when: SH, turns: [
      beat('Third time round, {a} finally stops thinking about it, grabs, and holds on.'),
      by('b', "You've got it! Up the ladder! Up!"),
      by('a', "I'm never getting in the sea again. Ever."),
    ] },
    { id: 'cpl.sh-a3', when: SH, turns: [
      by('a', "It keeps going the other way!"),
      by('b', "Then wait on the other side!"),
      beat('{a} paddles round to the other side of the boat. The shark comes past. The tip comes off.'),
    ] },
    { id: 'cpl.sh-a4', when: SH, turns: [
      by('b', "Count it. It comes round every thirty seconds."),
      by('a', "Twenty-eight. Twenty-nine. Now!"),
      beat('{a} grabs on thirty, and the tip is in {a.posAdj} hand.'),
    ] },
  ],
  'task-try.struggling': [
    { id: 'cpl.sh-t1', when: SH, turns: [
      beat('{a} has climbed back up the ladder for the third time without touching the fin.'),
      by('a', "I can't. Every time it gets close, my arm just doesn't go."),
      by('b', "Your arm will go. Your arm is very brave. It's the rest of you."),
    ] },
    { id: 'cpl.sh-t2', when: SH, turns: [
      by('a', "It looked at me. It actually looked at me."),
      by('b', "Sharks don't look at people."),
      by('a', "This one does. This one has opinions."),
    ] },
    { id: 'cpl.sh-t3', when: SH, turns: [
      beat("{a} is clinging to the ladder, half in the water, half out. The fin goes past again, untouched."),
      by('b', "That's the fifth time it's gone past!"),
      by('a', "I know! I counted! I'm aware!"),
    ] },
  ],
  'task-done.any': [
    { id: 'cpl.sh-dn1', when: SH, turns: [
      beat('{a} hauls up onto the deck, dripping, tip held high.'),
      by('a', "I want it known that I touched a shark."),
      by('b', "It's known. Everybody on this boat knows."),
    ] },
    { id: 'cpl.sh-dn2', when: SH, turns: [
      by('b', "Read it. What does it say?"),
      by('a', "It's wet. It's very wet. It says... beach. Something about a beach."),
      by('b', "Good. Beaches don't have sharks. Mostly."),
    ] },
    { id: 'cpl.sh-dn3', when: SH, turns: [
      by('a', "My legs are shaking."),
      by('b', "You were treading water for twenty minutes. Of course they're shaking."),
      by('a', "No, they're shaking because of the shark."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'cpl.sh-x1', when: SH, turns: [
      beat('{a} grabs too early, gets a handful of sea, and the shark glides off into the blue.'),
      by('a', "Missed! It's going! It's gone!"),
      by('b', "It'll be back! It always comes back!"),
    ] },
    { id: 'cpl.sh-x2', when: SH, turns: [
      beat('The fin turns towards {a}, and {a} is up the ladder before anyone sees {a.obj} move.'),
      by('b', "Where are you going? The tip's down there!"),
      by('a', "So is the shark!"),
    ] },
    { id: 'cpl.sh-x3', when: SH, turns: [
      beat("{a}'s fingers brush the tip, and it slips free and stays on the fin as the shark swims on."),
      by('a', "I touched it! It counts if I touched it!"),
      by('b', "It does not count if you touched it!"),
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'cpl.sh-v1', when: SH, turns: [
      by('b', "You can do it! It's just a big fish! A big, friendly fish!"),
      by('a', "Friendly fish don't have that many teeth!"),
      by('b', "Don't look at the teeth! Look at the tip!"),
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'cpl.sh-v2', when: SH, turns: [
      beat('{b} is gripping the rail of the boat so hard {b.posAdj} knuckles have gone white.'),
      by('b', "I can't watch. Tell me when it's over. No, don't, I'm watching."),
      by('a', "Stop talking to yourself and talk to me!"),
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'cpl.sh-v3', when: SH, turns: [
      beat('{b} leans over the side and slaps the water to draw the shark closer.'),
      by('b', "Here, sharky! Over here!"),
      beat('The crew member shakes his head and taps his watch. A penalty.'),
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'cpl.sh-v4', when: SH, turns: [
      beat("{b} doesn't say a word, watching the fin circle, holding {b.posAdj} breath."),
      by('a', "Say something! Anything!"),
      by('b', "I'm being quiet so the shark doesn't notice you."),
    ] },
  ],
  'helped-botch.any': [
    { id: 'cpl.sh-h1', when: SH, turns: [
      beat("When the crew member looks away, {b} reaches over the side and grabs at the fin too."),
      by('a', "You can't help! You're not allowed to touch it!"),
      by('b', "I'm not touching it, I'm pointing at it very closely!"),
    ] },
  ],
};

// ── the sand palace (All-In) ──
const palace = {
  'don-demo.gag': [
    { id: 'cpl.sp-d1', when: SP, turns: [
      don("In this All-In, teams build a replica of the palace up there, out of sand. Every tower, every wall, every window."),
      beat('A small boy in surf shorts, about eight years old, stands beside him with his arms folded.'),
      don("And this is your judge. He has never liked anything. He didn't like me."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'cpl.sp-d2', when: SP, turns: [
      don("A tower missing, a wall that slumps, or a wave that gets it, and you rebuild what he points at."),
      beat('The boy points at Don. Don looks down at himself.'),
      don("What? What's wrong with me? Don't answer that."),
    ] },
  ],
  'task-start.any': [
    { id: 'cpl.sp-s1', when: SP, turns: [
      beat('{a} and {b} kneel in the sand with two buckets, a spade and a photo of the palace.'),
      by('a', "How many towers is that? Is that four? Five?"),
      by('b', "It's six. Two of them are hiding behind the others."),
      by('a', "Sneaky palace."),
    ] },
    { id: 'cpl.sp-s2', when: SP, turns: [
      by('b', "The trick is wet sand. Wet sand holds. Dry sand just sort of gives up."),
      by('a', "Like us at the end of every leg."),
      by('b', "Get water. Lots of water."),
    ] },
    { id: 'cpl.sp-s3', when: SP, turns: [
      beat('The little judge walks past slowly, looking at their empty patch of beach.'),
      by('a', "He's judging us already. We haven't even started."),
      by('b', "Then let's give him something to judge."),
    ] },
    { id: 'cpl.sp-s4', when: SP, turns: [
      by('a', "I made sandcastles every summer as a kid."),
      by('b', "And?"),
      by('a', "And they were terrible. But I made a lot of them."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'cpl.sp-f1', when: SP, turns: [
      beat('The little judge walks all the way around their palace twice, very slowly, hands behind his back. Then he nods once.'),
      by('b', "Was that a nod? Did he nod?"),
      by('a', "He nodded! Don't move, don't breathe, take the tip!"),
    ] },
    { id: 'cpl.sp-f2', when: SP, turns: [
      by('a', "Six towers, the gate, the gardens, and the little flag on top."),
      beat('The boy looks at the flag, which is a sweet wrapper on a stick, for a long time. He hands over the tip.'),
      by('b', "The flag sold it. I knew the flag would sell it."),
    ] },
    { id: 'cpl.sp-f3', when: SP, turns: [
      beat('{a} and {b} step back from their palace. It is, honestly, beautiful.'),
      by('b', "We should be architects."),
      by('a', "We should be sand architects. That's a job, right?"),
    ] },
    { id: 'cpl.sp-f4', when: SP, turns: [
      by('b', "He's smiling. Is he smiling? I think that's a smile."),
      by('a', "Take the tip before he changes his mind!"),
      beat('The boy hands it over, then immediately goes back to frowning at everybody else.'),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'cpl.sp-a1', when: SP, turns: [
      by('a', "He said the towers were too short. So we make them taller. Much taller."),
      beat('Their sixth tower is now taller than the little judge. He looks at it, then up at it, and nods.'),
      by('b', "Size matters to him. Noted."),
    ] },
    { id: 'cpl.sp-a2', when: SP, turns: [
      beat('{b} smooths the last wall with the edge of the photo, perfectly flat, and stands back.'),
      by('a', "That's the one. That's palace quality."),
      beat('The boy hands over the tip without a word, already walking to the next team.'),
    ] },
    { id: 'cpl.sp-a3', when: SP, turns: [
      by('b', "Third time. We've built this palace three times."),
      by('a', "Then this one should be the best one."),
      beat('It is. The little judge points at it, then at himself, and gives them a thumbs up.'),
    ] },
    { id: 'cpl.sp-a4', when: SP, turns: [
      by('a', "He wanted windows. Fine. Windows."),
      beat('{a} pokes a neat row of windows into every wall with a straw. The boy inspects each one and finally nods.'),
      by('b', "It was the windows. It was always going to be the windows."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'cpl.sp-t1', when: SP, turns: [
      beat('A wave rolls up the beach, further than any wave has gone all day, and takes two of their towers with it.'),
      by('a', "No! No, no, no!"),
      by('b', "The sea did it on purpose. I saw it look at us."),
    ] },
    { id: 'cpl.sp-t2', when: SP, turns: [
      by('b', "He said no again. That's three no's."),
      by('a', "What was wrong with it this time?"),
      by('b', "He just pointed at the whole thing."),
    ] },
    { id: 'cpl.sp-t3', when: SP, turns: [
      beat("The sun has dried their palace out, and the walls are cracking and sliding down, one grain at a time."),
      by('a', "It's melting. Why is it melting?"),
      by('b', "It's not melting, it's drying. Get the water!"),
    ] },
  ],
  'task-done.any': [
    { id: 'cpl.sp-dn1', when: SP, turns: [
      by('a', "Can we take a picture of it before we go? It's the best thing I've ever made."),
      by('b', "Quickly. Then run."),
      beat('{a} takes one photo, then a second, then a third from a better angle, and {b} drags {a.obj} away by the arm.'),
    ] },
    { id: 'cpl.sp-dn2', when: SP, turns: [
      beat('As they run for the harbour, a dog trots up to their sand palace and sits on it.'),
      by('b', "Don't look back. Just don't look back."),
      by('a', "Why? What's happening behind us?"),
    ] },
    { id: 'cpl.sp-dn3', when: SP, turns: [
      by('a', "That kid is going to be a judge on a cooking show one day."),
      by('b', "He's going to make a lot of chefs cry."),
      by('a', "He's going to be brilliant at it."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'cpl.sp-x1', when: SP, turns: [
      beat('The little judge looks at their palace, then pokes one tower with his finger. It falls over.'),
      by('a', "He pushed it! He pushed it over!"),
      by('b', "That's the test. If it falls when he pokes it, it's not good enough."),
    ] },
    { id: 'cpl.sp-x2', when: SP, turns: [
      beat('The boy shakes his head, points at the photo, then at their palace, then shakes his head again.'),
      by('b', "What does that mean? What's missing?"),
      by('a', "Everything, apparently."),
    ] },
    { id: 'cpl.sp-x3', when: SP, turns: [
      beat('{a} steps back to admire their work, and treads straight through the gardens.'),
      by('a', "That was... that wasn't part of the palace, was it?"),
      by('b', "It was the whole of the gardens."),
    ] },
  ],
};

export default mergePools(place, roads, shark, palace);
