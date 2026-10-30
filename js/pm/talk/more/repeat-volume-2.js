// pm/talk/more/repeat-volume-2.js — the second round of pools one episode heard
// twice (measured 2026-10-25 after more/repeat-volume.js: 4.1 a episode).

// The baby challenge: every couple gets a night of it.
export const BABY_DOLL_VOLUME = {
  moves: {
    baby: [
      { when: { of: 'team' }, stage: "The doll goes off in the middle of the night. {a} is up before {b} has even opened {b.posAdj} eyes.", turns: [['a', "Go back to sleep. I've got this one."], ['b', "We'll take turns. Wake me for the next one."]] },
      { when: { of: 'team' }, stage: "{a} rocks the doll while {b} reads the instructions out loud, very seriously.", turns: [['b', "It says she likes being walked."], ['a', "Then we walk. Round the pool. Twice."]] },
      { when: { of: 'left-it' }, stage: "The doll has been crying for ten minutes. {b} is on the daybed with a drink.", turns: [['a', "Can you hear that?"], ['b', "Hear what?"], ['a', "Our child."]] },
      { when: { of: 'left-it' }, stage: "{a} is changing the doll on the kitchen counter. {b} is watching from the sofa.", turns: [['a', "You could help, you know."], ['b', "You're doing such a good job, though."]] },
      { when: { of: 'lost' }, stage: "Everyone is getting ready for dinner when somebody asks where the baby is.", turns: [['a', "She's on the… she was on the…"], ['b', "Was she with you or with me?"]] },
    ],
    after: [
      { when: { of: 'team' }, turns: [['a', "We're actually good at this."], ['b', "We're good at a doll. Let's not get carried away."]] },
      { when: { of: 'left-it' }, turns: [['b', "I said sorry."], ['a', "You said sorry while you were still lying down."]] },
      { when: { of: 'lost' }, turns: [['b', "In our defence, she's very small."], ['a', "That's not a defence. That's the problem."]] },
    ],
  },
};

// The Casa photos: one photo each, round the whole fire pit.
export const PHOTOS_VOLUME = {
  moves: {
    look: [
      { stage: "{a} turns the photo over slowly, like it might bite.", turns: [['a', "Okay. Okay. I need a second."]] },
      { stage: "{a} looks at the photo of {b}, then up at {b}, then back at the photo.", turns: [['a', "So that's what you were doing."]] },
      { stage: "The photo of {b} shakes a little in {a}'s hand.", turns: [['a', "I don't even know what I'm looking at. Yes, I do. I know exactly what I'm looking at."]] },
      { stage: "{a} laughs when {a} sees the photo of {b}, and it isn't a happy laugh.", turns: [['a', "Wow. Wow. Good to know."]] },
    ],
    answer: [
      { turns: [['b', "Let me explain before you decide anything."], ['a', "I think the photo's explained it."]] },
      { turns: [['b', "That was one moment. One. It doesn't mean what you think."], ['a', "Then tell me what it means."], ['b', "Not here."]] },
      { turns: [['b', "I don't know what to say."], ['a', "Funny. You didn't have that problem over there."]] },
    ],
  },
};

export const PHOTO_ROW_VOLUME = {
  moves: {
    open: [
      { stage: "{a} finds {b} on the stairs, the photo still in {a.posAdj} hand.", turns: [['a', "We're doing this now. Not tomorrow. Now."]] },
      { stage: "The terrace, after the fire pit. {a} puts the photo on the table between them.", turns: [['a', "Explain it. Go on. I'm listening."]] },
      { stage: "{a} and {b} are in the dressing room. Nobody else dares come in.", turns: [['a', "Every night I defended you over here. Every single night."]] },
    ],
    answer: [
      { when: { of: 'own-it' }, turns: [['b', "It happened. I'm not going to insult you by pretending it didn't."], ['a', "That's the first honest thing you've said since you walked back in."]] },
      { when: { of: 'deny' }, turns: [['b', "You're reading it all wrong. You weren't there."], ['a', "No. I wasn't. That's the whole point."]] },
      { when: { of: 'walk-off' }, turns: [['b', "Can we at least talk tomorrow?"], ['a', "Ask me tomorrow."]] },
    ],
  },
};

// The final's films, the Casa chapter and the opening.
export const JOURNEY_REACT_VOLUME_2 = {
  moves: {
    watch: [
      { when: { of: 'casa' }, turns: [['b', "I thought about you every single day in there."], ['a', "I know. It's on the film. They showed it."]] },
      { when: { of: 'casa' }, stage: "Neither of them says anything until the Casa bit is over.", turns: [['a', "Okay. We're past it."], ['b', "We're past it."]] },
    ],
  },
};
export const JOURNEY_OPEN_VOLUME = {
  moves: {
    screen: [
      { when: { of: ['rocky', 'way-back', 'survivors'] }, stage: "A screen lights up with their names on it. {a} grabs {b}'s hand before it's even started.", turns: [['a', "Whatever's on this, we're still here at the end of it."], ['b', "Press play before I lose my nerve."]] },
      { when: { of: ['steady', 'slow-burn', 'held'] }, stage: "The lights go down on the table, and their faces come up on the screen.", turns: [['b', "We look so young."], ['a', "It was a few weeks ago."], ['b', "We look so young."]] },
    ],
  },
};

// Carrying a secret, told to a friend: the "off with someone for ages" line, for every pull.
export const SECRET_BURDEN_VOLUME = {
  moves: {
    say: [
      { when: { sec: 'pull', hasWith: true }, turns: [
        ['a', "I saw {c} with {about} on the daybeds. Heads right together. And the second {d} walked past, {c} sat up like nothing was happening."],
        ['b', "Like nothing was happening? That's never nothing."],
        ['a', "That's what I thought."],
      ] },
      { when: { sec: 'pull', hasWith: true }, turns: [
        ['a', "{c} took {about} up to the terrace earlier. They were up there for ages. And when they came down, {c} went straight over and gave {d} a kiss. Like a cover."],
        ['b', "A cover kiss. Oh, I hate a cover kiss."],
      ] },
    ],
  },
};

// Casa's return: the ones on the bench.
export const CASA_RETURN_VOLUME_2 = {
  moves: {
    walk: [
      { when: { of: 'stayed', choice: 'stick', taken: true }, stage: "{a} is on the bench, eyes on the steps, one knee bouncing.", turns: [['a', "I can't watch. Tell me when it's {pa}. No, don't. I'll watch."]] },
      { when: { of: 'stayed', choice: 'stick', taken: true }, stage: "{a} sits very still on the bench, the way people sit when they've decided not to cry.", turns: [['a', "I did my bit. I stayed. Now it's {pa}'s turn to have done the same."]] },
    ],
  },
};

// Casa's return, the whole ceremony: several stayers and several walk-ins a night.
export const CASA_RETURN_VOLUME_3 = {
  moves: {
    walk: [
      { when: { of: 'returned', choice: 'twist', taken: false }, stage: "{a} comes down the steps with {b}, and doesn't even try to hide the smile.", turns: [['a', "Surprise. I've brought a friend. A very good friend."]] },
      { when: { of: 'returned', choice: 'twist', taken: false }, stage: "{a} walks back in hand in hand with {b}, already waving at everyone.", turns: [['a', "Don't all look so shocked. I went single, and I came back happy."]] },
      { when: { of: 'stayed', choice: 'twist', withB: true }, stage: "{a} is on the bench with {b}, sitting a little too straight.", turns: [['a', "Whatever walks down those steps, I chose this. I have to own it."]] },
      { when: { of: 'stayed', choice: 'twist', withB: true }, stage: "{b} keeps a hand on {a}'s knee. {a} keeps looking at the steps anyway.", turns: [['a', "I'm not nervous. I'm just very aware of where everyone is standing."]] },
    ],
    words: [
      { when: { of: 'returned', choice: 'twist', taken: false }, turns: [['b', "Hello, everyone. I promise I'm nicer than I look."], ['a', "That's not true. You're exactly as nice as you look."]] },
      { when: { of: 'returned', choice: 'twist', taken: false }, turns: [['b', "So this is the famous villa."], ['a', "Don't get comfortable. They all bite."]] },
      { when: { of: 'stayed', choice: 'twist', withB: true }, turns: [['b', "Do you want me to move?"], ['a', "No. Stay. If I'm doing this, I'm doing it properly."]] },
      { when: { of: 'stayed', choice: 'twist', withB: true }, turns: [['b', "Breathe."], ['a', "I am breathing. Just not very well."]] },
    ],
    land: [
      { when: { of: 'returned', choice: 'twist', taken: false }, turns: [], beat: "A few people cheer. A few people look at each other." },
      { when: { of: 'returned', choice: 'twist', taken: false }, turns: [], beat: "Somebody on the bench shuffles up, and the newest couple in the villa sits down." },
      { when: { of: 'stayed' }, turns: [], beat: "The music drops. Somebody appears at the top of the steps." },
      { when: { of: 'stayed' }, turns: [], beat: "Nobody on the bench is breathing." },
      { when: { of: 'stayed' }, turns: [], beat: "Two people on the bench grab each other's hands without looking." },
      { when: { of: 'stayed' }, turns: [], beat: "The next shadow appears at the top of the steps, and the whole fire pit leans forward." },
    ],
  },
};

// The debrief's friend, when somebody twisted: one line said twice in one night.
export const DEBRIEF_TWIST_VOLUME = {
  moves: {
    friend: [
      { when: { of: 'twisted' }, turns: [['b', "It was always going to hurt someone tonight. At least you were honest about who you want."]] },
      { when: { of: 'twisted' }, turns: [['b', "You did it in front of everyone. That takes more guts than sneaking around."]] },
      { when: { of: 'twisted' }, turns: [['b', "Tomorrow's going to be hard. Just don't hide from {c}. Talk to {c} first thing."]] },
    ],
  },
};
