// The last day (spec §15): the final ratings, the finalists meeting one by
// one, and the placements. Data only. `final.rate.<reason>`: a puts b in
// first place for the last time, for the ballot's own reason. `meet.*`: a
// walks in and b is already in the room. `reveal.*`: a is the finalist whose
// place is being read out.
export const FINALE = {
  'final.rate.affection': [
    { id: 'final.rate.affection.01', turns: [{ by: 'a', say: "Last rating ever. My heart says {b}. First place." }] },
    { id: 'final.rate.affection.02', turns: [{ by: 'a', say: "{b} has been my person since the start. Circle, put {b} in first position." }] },
    { id: 'final.rate.affection.03', turns: [{ by: 'a', say: "This one's with my heart. {b}, first." }] },
    { id: 'final.rate.affection.04', turns: [{ by: 'a', say: "Every hard day in here, {b} was there. {b} gets my first place." }] },
    { id: 'final.rate.affection.05', turns: [{ by: 'a', say: "I don't even have to think about it. {b}. First." }], beat: '{a} smiles at the screen.' },
    { id: 'final.rate.affection.06', turns: [{ by: 'a', say: "Circle, first position: {b}. My best friend in this whole building." }] },
  ],
  'final.rate.trust': [
    { id: 'final.rate.trust.01', turns: [{ by: 'a', say: "{b} never lied to me. Not once. First place." }] },
    { id: 'final.rate.trust.02', turns: [{ by: 'a', say: "The person I trust most in here should win. That's {b}." }] },
    { id: 'final.rate.trust.03', turns: [{ by: 'a', say: "Circle, put {b} in first. {b} was real with me the whole way." }] },
  ],
  'final.rate.obligation': [
    { id: 'final.rate.obligation.01', turns: [{ by: 'a', say: "I wouldn't be here without {b}. First place. It's the least I can do." }] },
    { id: 'final.rate.obligation.02', turns: [{ by: 'a', say: "{b} saved me when it counted. Now I'm returning the favor. First." }] },
    { id: 'final.rate.obligation.03', turns: [{ by: 'a', say: "I owe {b} this one. Circle, put {b} in first position." }] },
  ],
  'final.rate.pact': [
    { id: 'final.rate.pact.01', turns: [{ by: 'a', say: "{b} and I made a promise. I'm keeping it to the end. First place." }] },
    { id: 'final.rate.pact.02', turns: [{ by: 'a', say: "We said we'd ride this out together. {b}, first." }] },
    { id: 'final.rate.pact.03', turns: [{ by: 'a', say: "A deal's a deal, even on the last day. Circle, put {b} in first." }] },
  ],
  'final.rate.protection': [
    { id: 'final.rate.protection.01', turns: [{ by: 'a', say: "Nobody can block anybody anymore. So this is just about who played. {b}, first." }] },
    { id: 'final.rate.protection.02', turns: [{ by: 'a', say: "{b} kept me safe more than once. First place." }] },
    { id: 'final.rate.protection.03', turns: [{ by: 'a', say: "{b} had my back when I needed it. Circle, put {b} in first." }] },
  ],
  'final.rate.threat': [
    { id: 'final.rate.threat.01', turns: [{ by: 'a', say: "Everybody's been scared of {b} all game. For a reason. First place." }] },
    { id: 'final.rate.threat.02', turns: [{ by: 'a', say: "{b} was the biggest threat in this game, and {b} survived all of it. First." }] },
    { id: 'final.rate.threat.03', turns: [{ by: 'a', say: "I have to respect it. {b} goes first." }] },
  ],
  'final.rate.suspicion': [
    { id: 'final.rate.suspicion.01', turns: [{ by: 'a', say: "Real or not, {b} played the best game. First place." }] },
    { id: 'final.rate.suspicion.02', turns: [{ by: 'a', say: "I still have questions about {b}. But I'm putting {b} first." }] },
    { id: 'final.rate.suspicion.03', turns: [{ by: 'a', say: "If {b} is a catfish, {b} is a really good one. First." }] },
  ],
  'final.rate.grudge': [
    { id: 'final.rate.grudge.01', turns: [{ by: 'a', say: "{b} and I didn't always get along. But {b} played this game. First place." }] },
    { id: 'final.rate.grudge.02', turns: [{ by: 'a', say: "This isn't about liking somebody. It's about who earned it. {b}." }] },
    { id: 'final.rate.grudge.03', turns: [{ by: 'a', say: "I'm putting it all behind me. {b}, first position." }] },
  ],
  'final.rate.deserves': [
    { id: 'final.rate.deserves.01', turns: [{ by: 'a', say: "Who deserves to win? It's {b}. It's been {b} for a while." }] },
    { id: 'final.rate.deserves.02', turns: [{ by: 'a', say: "Circle, put {b} in first position. {b} played the best game." }] },
    { id: 'final.rate.deserves.03', turns: [{ by: 'a', say: "{b} deserves it more than anyone. Including me." }] },
  ],
  'meet.arrive.real': [
    { id: 'meet.arrive.real.01', turns: [
      { by: 'a', react: "Hi! Hi, everybody!" },
      { by: 'b', react: "{a}! You're real! You look exactly like your pictures!" },
    ], beat: '{a} and {b} hug like they have known each other for years.' },
    { id: 'meet.arrive.real.02', turns: [
      { by: 'b', react: "Oh my God, it's {a}!" },
      { by: 'a', react: "It's me! It's really me!" },
    ], beat: 'Everyone already in the room gets up at once.' },
    { id: 'meet.arrive.real.03', turns: [
      { by: 'a', react: "Okay, this is so weird. You all have voices." },
      { by: 'b', react: "{a}! Come here!" },
    ] },
  ],
  'meet.arrive.catfish': [
    { id: 'meet.arrive.catfish.01', stage: '{a.real} walks in, not the face from the profile.', turns: [
      { by: 'b', react: "Wait. Who's this?" },
      { by: 'a', react: "Hi, everybody. It's {a}." },
      { by: 'b', react: "Shut up. Shut UP!" },
    ] },
    { id: 'meet.arrive.catfish.02', stage: '{a.real} stops in the doorway and waves.', turns: [
      { by: 'a', react: "So. Surprise." },
      { by: 'b', react: "No way. You're {a}? The whole time?" },
    ], beat: 'The room goes quiet, and then everyone talks at once.' },
    { id: 'meet.arrive.catfish.03', stage: 'The door opens on {a.real}.', turns: [
      { by: 'b', react: "Okay, I don't know you. Do I know you?" },
      { by: 'a', react: "You know me. I'm {a}." },
      { by: 'b', react: "Oh my God!" },
    ] },
  ],
  // a walks in; b was first into the room, alone, and b's profile was not b.
  'meet.found': [
    { id: 'meet.found.01', stage: '{b.real} is the only one in the room, and it is not the face {a} expected.', turns: [
      { by: 'a', react: "Hi! Wait. Who are you?" },
      { by: 'b', react: "Hi. It's {b}." },
      { by: 'a', react: "Stop it. You're {b}?" },
    ] },
    { id: 'meet.found.02', stage: '{b.real} stands up from the couch as {a.real} walks in.', turns: [
      { by: 'b', react: "Before you say anything. Yes. It's me. {b}." },
      { by: 'a', react: "Oh my God. I need to sit down." },
    ] },
    { id: 'meet.found.03', stage: '{b.real} waves from across the room.', turns: [
      { by: 'a', react: "Hi? I'm sorry, I don't think we've met." },
      { by: 'b', react: "We've talked every day. I'm {b}." },
      { by: 'a', react: "No. No way!" },
    ] },
  ],
  // a walks in; b was first into the room; neither profile was real.
  'meet.both': [
    { id: 'meet.both.01', stage: '{a.real} walks in, and {b.real} is waiting. Neither of them looks like a profile picture.', turns: [
      { by: 'b', react: "Hi. I'm {b}. Who are you?" },
      { by: 'a', react: "I'm {a}. Apparently we both had a secret." },
    ], beat: '{a} and {b} laugh until they have to sit down.' },
    { id: 'meet.both.02', stage: '{b.real} looks up as {a.real} comes through the door.', turns: [
      { by: 'a', react: "Okay. You're not who I thought." },
      { by: 'b', react: "Neither are you." },
    ] },
    { id: 'meet.both.03', stage: '{a.real} and {b.real} stare at each other across the room.', turns: [
      { by: 'b', react: "Let me guess. {a}?" },
      { by: 'a', react: "And you must be {b}. Wow." },
    ] },
  ],
  'meet.explain.strategic': [
    { id: 'meet.explain.strategic.01', turns: [
      { by: 'a', say: "My name is {a.real}. I thought a different face would get me further in this game." },
      { by: 'b', say: "I mean, it worked. You're in the final." },
    ] },
    { id: 'meet.explain.strategic.02', turns: [
      { by: 'b', say: "Why? Just tell me why." },
      { by: 'a', say: "Strategy. That's all it was. Everything I said to you, I meant." },
    ] },
    { id: 'meet.explain.strategic.03', turns: [
      { by: 'a', say: "I'm {a.real}. {a} was a game plan, and I'm sorry if it hurt anybody." },
      { by: 'b', say: "It's a game. I'm just shook." },
    ] },
  ],
  'meet.explain.protective': [
    { id: 'meet.explain.protective.01', turns: [
      { by: 'a', say: "I'm {a.real}. I was scared you'd judge me before you knew me." },
      { by: 'b', say: "I wouldn't have. But I get it." },
    ], beat: '{b} pulls {a} into a hug.' },
    { id: 'meet.explain.protective.02', turns: [
      { by: 'b', say: "Why didn't you just come as yourself?" },
      { by: 'a', say: "Because people decide who I am before I open my mouth. In here, they couldn't." },
    ] },
    { id: 'meet.explain.protective.03', turns: [
      { by: 'a', say: "My name is {a.real}. I wanted you to meet the real me first. The inside me." },
      { by: 'b', say: "Well, I like the inside you a lot." },
    ] },
  ],
  'meet.explain.experimental': [
    { id: 'meet.explain.experimental.01', turns: [
      { by: 'a', say: "I'm {a.real}. I wanted to see if you'd treat me differently as {a}." },
      { by: 'b', say: "And did we?" },
      { by: 'a', say: "Honestly? Yes." },
    ] },
    { id: 'meet.explain.experimental.02', turns: [
      { by: 'b', say: "So what was the point?" },
      { by: 'a', say: "I wanted to know if looks matter as much as I thought. They do." },
    ] },
    { id: 'meet.explain.experimental.03', turns: [
      { by: 'a', say: "My name is {a.real}. {a} was an experiment, and you were all very nice to {a}." },
      { by: 'b', say: "Would we have been nice to you?" },
      { by: 'a', say: "That's what I wanted to find out." },
    ] },
  ],
  'meet.explain.family': [
    { id: 'meet.explain.family.01', turns: [
      { by: 'a', say: "I'm {a.real}. Those pictures are someone in my family. I played as them." },
      { by: 'b', say: "That's actually really sweet." },
    ] },
    { id: 'meet.explain.family.02', turns: [
      { by: 'b', say: "So who's in the pictures?" },
      { by: 'a', say: "Someone I love. I know them better than anybody, so I could play them." },
    ] },
    { id: 'meet.explain.family.03', turns: [
      { by: 'a', say: "My name is {a.real}, and {a} is real. {a} is at home, watching." },
      { by: 'b', say: "Wait, so we're gonna meet the real {a} too?" },
      { by: 'a', say: "Maybe. If you're lucky." },
    ] },
  ],
  'reveal.place': [
    { id: 'reveal.place.01', turns: [
      { by: 'host', say: "Finishing next, it's {a.aka}!" },
      { by: 'a', react: "That's okay. I made it this far." },
    ] },
    { id: 'reveal.place.02', turns: [
      { by: 'host', say: "The next name on the board is {a.aka}." },
      { by: 'a', react: "Oh! Okay. Wow. Thank you, everybody." },
    ], beat: '{a} claps along with everyone else.' },
    { id: 'reveal.place.03', turns: [
      { by: 'host', say: "Let's see where {a.aka} finished!" },
      { by: 'a', react: "I'm just happy to be here. Really." },
    ] },
    { id: 'reveal.place.04', turns: [
      { by: 'host', say: "Taking the next spot on the board, {a.aka}!" },
      { by: 'a', react: "Okay. I'll take it. I had the best time." },
    ] },
  ],
  'reveal.winner': [
    { id: 'reveal.winner.01', turns: [
      { by: 'host', say: "And the winner of The Circle is... {a.aka}!" },
      { by: 'a', react: "Me? No. No way. Me?" },
    ], beat: '{a} drops to the floor, and everyone piles on.' },
    { id: 'reveal.winner.02', turns: [
      { by: 'host', say: "The Player who finishes first, and takes home the prize, is {a.aka}!" },
      { by: 'a', react: "Oh my God! Oh my God!" },
    ], beat: 'Confetti comes down over the whole room.' },
    { id: 'reveal.winner.03', turns: [
      { by: 'host', say: "Your winner... {a.aka}!" },
      { by: 'a', react: "I did it! I actually did it!" },
    ], beat: '{a} covers {a.posAdj} face with both hands.' },
  ],
};
