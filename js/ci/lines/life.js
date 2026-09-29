// Parties, apartment life, videos from home, and the host over them (Plan 3a).
// Data only. `party.open`: a opens the door; {game} is the theme's name and
// {q} the props that arrived. `party.nhie`: a asks {q} in Circle Chat and b
// admits it; `.none`: nobody does. `life.<habit>`: a alone in the apartment.
// `home.video`: a watches a message from home — the family speak in the
// staging, never by name.
export const LIFE_LINES = {
  'party.open': [
    { id: 'party.open.01', turns: [
      { by: 'a', react: "'Tonight, it's the {game}!' Wait. There's a delivery at my door." },
      { by: 'a', react: "{q}? Oh, we are doing this!" },
    ], beat: '{a} has the music on before the door is even closed.' },
    { id: 'party.open.02', turns: [
      { by: 'a', react: "A party! The {game}! Circle, what did you send me?" },
      { by: 'a', say: "{q}. Okay. I'm wearing all of it." },
    ] },
    { id: 'party.open.03', turns: [
      { by: 'a', react: "We got {q}. Yeah, buddy!" },
    ], beat: '{a} dances alone in the middle of the living room.' },
    { id: 'party.open.04', turns: [
      { by: 'a', react: "The {game}? I was born for the {game}." },
      { by: 'a', say: "Parties are where people slip. Have fun, but keep your eyes open." },
    ] },
    { id: 'party.open.05', turns: [
      { by: 'a', react: "There's a box at the door. {q}. The Circle knows me." },
    ], beat: '{a} tries everything on at once in front of the mirror.' },
    { id: 'party.open.06', turns: [
      { by: 'a', react: "It's party time in the Circle!" },
      { by: 'a', say: "Nobody can see me dance. That has never stopped me." },
    ], beat: '{a} turns the volume all the way up.' },
    { id: 'party.open.07', turns: [
      { by: 'a', react: "'{game}.' Okay, I didn't pack for this, but the Circle did." },
    ] },
    { id: 'party.open.08', turns: [
      { by: 'a', say: "A party means people talk. And people talking means I learn things.", react: "{q}. Let's go." },
    ] },
  ],
  'party.nhie': [
    { id: 'party.nhie.01', turns: [
      { by: 'a', send: "{q} {e:devil}" },
      { by: 'b', react: "Oh, I have.", send: "Guilty as charged {e:grimace}" },
    ] },
    { id: 'party.nhie.02', turns: [
      { by: 'a', send: "Okay next one. {q}" },
      { by: 'b', react: "I have to answer honestly. I have to.", send: "Lol I plead the fifth. But yes" },
    ], beat: 'Two apartments over, someone screams at the screen.' },
    { id: 'party.nhie.03', turns: [
      { by: 'a', send: "{q}" },
      { by: 'b', send: "I have!!!" },
      { by: 'a', react: "{b}! No way!" },
    ] },
    { id: 'party.nhie.04', turns: [
      { by: 'a', send: "{q} {e:eyes}" },
      { by: 'b', react: "Oh no. Oh, I've done that.", send: "Me. It was me. Next question please" },
    ] },
    { id: 'party.nhie.05', turns: [
      { by: 'a', say: "Let's see who's honest.", send: "{q}" },
      { by: 'b', send: "Yup. No regrets {e:cool}" },
      { by: 'a', react: "{b} has lived." },
    ] },
    { id: 'party.nhie.06', turns: [
      { by: 'a', send: "{q}" },
      { by: 'b', react: "Do I tell them? I'm telling them.", send: "Okay fine. I have {e:sweat}" },
    ] },
    { id: 'party.nhie.07', when: { flirty: true }, turns: [
      { by: 'a', send: "{q} {e:wink}" },
      { by: 'b', send: "Maybe {e:wink}" },
      { by: 'a', react: "Maybe? Maybe means yes." },
    ] },
    { id: 'party.nhie.08', turns: [
      { by: 'a', send: "{q}" },
      { by: 'b', send: "Guilty lol. Don't judge me" },
      { by: 'a', react: "Oh, I'm judging. A little." },
    ] },
    { id: 'party.nhie.09', turns: [
      { by: 'a', send: "Alright Circle. {q}" },
      { by: 'b', react: "Of course that's the one they ask.", send: "Yes. Moving on {e:laugh}" },
    ] },
    { id: 'party.nhie.10', turns: [
      { by: 'a', send: "{q}" },
      { by: 'b', send: "Hand up. Both hands up {e:clap}" },
    ], beat: '{b} actually puts both hands up, alone in the apartment.' },
  ],
  'party.nhie.none': [
    { id: 'party.nhie.none.01', turns: [
      { by: 'a', send: "{q}" },
      { by: 'b', send: "Nope, not me {e:halo}" },
      { by: 'a', react: "Nobody? Liars. All of them." },
    ] },
    { id: 'party.nhie.none.02', turns: [
      { by: 'a', send: "{q} {e:devil}" },
      { by: 'b', send: "Never! I'm an angel lol" },
    ] },
    { id: 'party.nhie.none.03', turns: [
      { by: 'a', send: "{q}" },
      { by: 'b', react: "Not me. Honestly, not me.", send: "Not yet lol" },
      { by: 'a', react: "Not yet. I like that answer." },
    ] },
    { id: 'party.nhie.none.04', turns: [
      { by: 'a', send: "{q}" },
      { by: 'b', send: "Wow you all are boring {e:laugh}" },
    ] },
  ],

  // ── alone in the apartment ─────────────────────────────────────────────
  'life.workout': [
    { id: 'life.workout.01', stage: '{a} is on the small treadmill, going nowhere fast.', turns: [
      { by: 'a', say: "Twenty more minutes. Then I'm allowed to check the Circle." },
    ] },
    { id: 'life.workout.02', stage: '{a} does push-ups in front of the TV.', turns: [
      { by: 'a', say: "Forty-eight. Forty-nine. Fifty. Nobody saw that. Great." },
    ] },
    { id: 'life.workout.03', stage: '{a} is doing squats while holding a water jug.', turns: [
      { by: 'a', say: "You gotta stay sharp in here. Body and mind." },
    ] },
    { id: 'life.workout.04', stage: '{a} jumps rope in the kitchen.', turns: [
      { by: 'a', say: "Keep moving. If I stop, I start thinking about the ratings." },
    ] },
  ],
  'life.skincare': [
    { id: 'life.skincare.01', stage: '{a} is on step six of a ten-step skincare routine.', turns: [
      { by: 'a', say: "Nobody can see me. Doesn't matter. The skin knows." },
    ] },
    { id: 'life.skincare.02', stage: '{a} has a green face mask on and cucumber slices on {a.posAdj} eyes.', turns: [
      { by: 'a', say: "Circle, read me my messages. I can't open my eyes right now." },
    ] },
    { id: 'life.skincare.03', stage: '{a} is doing {a.posAdj} nails at the kitchen table.', turns: [
      { by: 'a', say: "If I'm gonna get blocked, I'm getting blocked with nice nails." },
    ] },
    { id: 'life.skincare.04', stage: '{a} is in a bathrobe with a towel on {a.posAdj} head.', turns: [
      { by: 'a', say: "Self-care day. The game can wait ten minutes." },
    ] },
  ],
  'life.cooking': [
    { id: 'life.cooking.01', stage: '{a} is making pancakes. The first one lands on the floor.', turns: [
      { by: 'a', say: "The first one never counts." },
    ] },
    { id: 'life.cooking.02', stage: 'The smoke alarm goes off in {a}\'s kitchen.', turns: [
      { by: 'a', say: "It's fine! Everything's fine! It's supposed to be crispy!" },
    ], beat: '{a} fans the alarm with a dish towel.' },
    { id: 'life.cooking.03', stage: '{a} is eating cereal out of a mixing bowl.', turns: [
      { by: 'a', say: "There's a full kitchen here, and I'm eating cereal for dinner. Again." },
    ] },
    { id: 'life.cooking.04', stage: '{a} is making an elaborate omelet, talking to it the whole time.', turns: [
      { by: 'a', say: "You're gonna be beautiful. Don't break on me." },
    ] },
    { id: 'life.cooking.05', stage: '{a} is cooking pasta for one, enough for six.', turns: [
      { by: 'a', say: "I'm used to cooking for my whole family. I don't know how to make less." },
    ] },
  ],
  'life.reading': [
    { id: 'life.reading.01', stage: '{a} is on the couch with a book and a notepad.', turns: [
      { by: 'a', say: "One chapter, then back to work." },
    ] },
    { id: 'life.reading.02', stage: '{a} is going over the notes on {a.posAdj} notepad.', turns: [
      { by: 'a', say: "Who said what, when. If you don't write it down, you forget it." },
    ] },
    { id: 'life.reading.03', stage: '{a} is doing a crossword at the kitchen counter.', turns: [
      { by: 'a', say: "Seven letters, 'deceive.' Catfish. That's eight. Hm." },
    ] },
    { id: 'life.reading.04', stage: '{a} has a book open on {a.posAdj} chest and is staring at the ceiling.', turns: [
      { by: 'a', say: "I've read the same page four times. I keep thinking about the ratings." },
    ] },
  ],
  'life.singing': [
    { id: 'life.singing.01', stage: '{a} is singing into a hairbrush.', turns: [
      { by: 'a', say: "If they only knew I had these vocals." },
    ] },
    { id: 'life.singing.02', stage: '{a} is performing a full concert for the couch.', turns: [
      { by: 'a', say: "Thank you, thank you. I'll be here all week. Hopefully." },
    ] },
    { id: 'life.singing.03', stage: '{a} is singing loudly in the shower.', turns: [
      { by: 'a', say: "The acoustics in here are incredible." },
    ] },
    { id: 'life.singing.04', stage: '{a} is making up a song about the other players.', turns: [
      { by: 'a', say: "Nobody's gonna hear it. That's the best part." },
    ] },
  ],
  'life.plushie': [
    { id: 'life.plushie.01', stage: '{a} is talking to a stuffed animal on the couch.', turns: [
      { by: 'a', say: "You're the only one in here I trust. You know that, right?" },
    ] },
    { id: 'life.plushie.02', stage: '{a} has set a place at the table for a stuffed bear.', turns: [
      { by: 'a', say: "Dinner with a friend. Best company I've had all week." },
    ] },
    { id: 'life.plushie.03', stage: '{a} is holding a stuffed animal up to the screen.', turns: [
      { by: 'a', say: "What do you think? Should I trust them? Yeah. Me neither." },
    ] },
    { id: 'life.plushie.04', stage: '{a} is hugging a stuffed animal very tightly.', turns: [
      { by: 'a', say: "It gets lonely in here. Don't tell anybody." },
    ] },
  ],
  'life.praying': [
    { id: 'life.praying.01', stage: '{a} is sitting quietly on the edge of the bed, eyes closed.', turns: [
      { by: 'a', say: "Just give me the strength to stay myself in here." },
    ] },
    { id: 'life.praying.02', stage: '{a} is kneeling by the bed.', turns: [
      { by: 'a', say: "Watch over my family. And maybe the ratings, a little." },
    ] },
    { id: 'life.praying.03', stage: '{a} lights a candle in the corner of the room.', turns: [
      { by: 'a', say: "Whatever happens, I'm grateful to be here." },
    ] },
    { id: 'life.praying.04', stage: '{a} is reading a small worn book with a lot of notes in the margins.', turns: [
      { by: 'a', say: "This is how I stay calm. Every morning, no matter what." },
    ] },
  ],
  'life.pacing': [
    { id: 'life.pacing.01', stage: '{a} is pacing the length of the apartment.', turns: [
      { by: 'a', say: "If I'm in the bottom, who put me there? Who? Think." },
    ] },
    { id: 'life.pacing.02', stage: '{a} walks from the kitchen to the window and back again.', turns: [
      { by: 'a', say: "Everybody's being nice to me. That's what scares me." },
    ] },
    { id: 'life.pacing.03', stage: '{a} is making a chart of the other players on the fridge.', turns: [
      { by: 'a', say: "Alliances here, rivals here, question marks everywhere." },
    ] },
    { id: 'life.pacing.04', stage: '{a} cannot sit still on the couch.', turns: [
      { by: 'a', say: "Somebody's lying to me. I can feel it. I just can't prove it." },
    ] },
  ],

  // ── a video from home, private to the apartment ─────────────────────────
  'home.video': [
    { id: 'home.video.01', stage: 'The screen opens on a kitchen and a woman waving: "Hi, baby! We love you so much! We are so proud of you!"', turns: [
      { by: 'a', react: "Mom! Oh my God, that's my mom!" },
      { by: 'a', say: "I'm being such a baby right now. I don't care." },
    ] },
    { id: 'home.video.02', stage: 'Three friends crowd into one frame, screaming: "We miss you! Come back! You can do it!"', turns: [
      { by: 'a', react: "My friends! That's my best friend in the middle!" },
    ], beat: '{a} wipes {a.posAdj} eyes and laughs at the same time.' },
    { id: 'home.video.03', stage: 'An older man sits stiffly in front of the camera: "Hey, kid. Everybody at home is watching. Go get it."', turns: [
      { by: 'a', react: "Dad. He never talks like that. Oh, man." },
    ] },
    { id: 'home.video.04', stage: 'A dog runs into the frame and licks the camera while someone laughs behind it.', turns: [
      { by: 'a', react: "My baby! Look at my baby!" },
      { by: 'a', say: "Okay. I needed that more than I knew." },
    ] },
    { id: 'home.video.05', stage: 'A grandmother leans very close to the camera: "Can they hear me? Hello! We love you!"', turns: [
      { by: 'a', react: "Grandma! She's too close to the camera! I love her." },
    ] },
    { id: 'home.video.06', stage: 'A little brother holds up a sign: "WIN IT!"', turns: [
      { by: 'a', react: "He made a sign. He made a sign!" },
      { by: 'a', say: "That's who I'm doing this for." },
    ] },
    { id: 'home.video.07', when: { catfish: true }, stage: 'A partner holds a baby up to the camera: "Hey, babe. We miss you. We are so proud of you."', turns: [
      { by: 'a', react: "Oh no. Oh, I miss them so much." },
      { by: 'a', say: "Everybody in here thinks I'm somebody else. I'm doing all this for them." },
    ], beat: '{a} sits with the frozen last frame for a long time.' },
    { id: 'home.video.08', when: { catfish: true }, stage: 'A family waves from a backyard: "We know what you\'re doing in there. We\'re with you."', turns: [
      { by: 'a', react: "They know. They know who I'm playing." },
      { by: 'a', say: "I feel a little guilty. And a little more determined." },
    ] },
    { id: 'home.video.09', stage: 'A best friend talks fast into the camera: "Okay, I only have a minute. Don\'t trust anybody. Love you. Bye!"', turns: [
      { by: 'a', react: "That is exactly my best friend. Exactly." },
    ] },
  ],

  // ── the host over games and life ───────────────────────────────────────
  'host.game': [
    { id: 'host.game.01', turns: [{ by: 'host', say: "Ooh, a game. And like everything in here, it's not just for fun." }] },
    { id: 'host.game.02', turns: [{ by: 'host', say: "Game time in the Circle! Somebody's about to say something they can't take back." }] },
    { id: 'host.game.03', turns: [{ by: 'host', say: "And of course, everybody gets to see everybody's answers. We love a little transparency." }] },
    { id: 'host.game.04', turns: [{ by: 'host', say: "{a} has never looked so focused. It's a game, {a}. Mostly." }] },
    { id: 'host.game.05', turns: [{ by: 'host', say: "Let the games begin. Or, as the Circle calls it, let the drama begin." }] },
    { id: 'host.game.06', turns: [{ by: 'host', say: "A game in the Circle is never just a game. Ask anybody who's been blocked after one." }] },
  ],
  'host.life': [
    { id: 'host.life.01', turns: [{ by: 'host', say: "Meanwhile, {a} is making the most of some alone time." }] },
    { id: 'host.life.02', turns: [{ by: 'host', say: "And while the Circle is quiet, {a} is keeping busy. Very busy." }] },
    { id: 'host.life.03', turns: [{ by: 'host', say: "Over in the next apartment, {a} has found a way to pass the time." }] },
    { id: 'host.life.04', turns: [{ by: 'host', say: "No phone, no friends in the room, no problem. {a} has a routine." }] },
    { id: 'host.life.05', turns: [{ by: 'host', say: "It's a quiet moment in the Circle, and {a} is filling it." }] },
    { id: 'host.life.06', turns: [{ by: 'host', say: "Meanwhile, {a} is living {a.posAdj} best life, alone, on camera, for millions of people." }], when: { catfish: false } },
    { id: 'host.life.07', turns: [{ by: 'host', say: "And upstairs, {a} is proving you can have a full social life with nobody else there." }] },
    { id: 'host.life.08', turns: [{ by: 'host', say: "While everybody else stresses about the ratings, {a} has other plans." }] },
  ],
};
