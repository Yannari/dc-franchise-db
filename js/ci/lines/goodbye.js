// The goodbye video (spec §11.3), played on every screen the morning after a
// blocking. Data only. `goodbye.guess`: a, watching, guesses before it plays;
// b is the blocked Player. `goodbye.video.*`: a is the blocked Player, on
// video. `goodbye.warning.*`: a warns everyone about c. `goodbye.react.*`: a
// reacts to b's video — guilty (a blocked b), warned (a is the one b named),
// vindicated (a suspected b, and b was a catfish), surprised (anyone else).
export const GOODBYE = {
  'goodbye.guess': [
    { id: 'goodbye.guess.01', turns: [
      { by: 'a', react: "'Players, {b} has left a goodbye message.' Here we go. Moment of truth." },
      { by: 'a', say: "Please be real. Please be real." },
    ] },
    { id: 'goodbye.guess.02', turns: [
      { by: 'a', react: "Okay, I'm calling it now. {b} is not who {b.sub} said {b.sub} was." },
    ], when: { suspects: true } },
    { id: 'goodbye.guess.03', turns: [
      { by: 'a', react: "I'm scared to press play. What if {b} says my name?" },
    ], beat: '{a} holds a cushion in front of {a.posAdj} face.' },
    { id: 'goodbye.guess.04', turns: [
      { by: 'a', react: "A goodbye message. Okay. Everybody find out together." },
    ], beat: 'In every apartment, someone turns up the volume.' },
    { id: 'goodbye.guess.05', turns: [
      { by: 'a', react: "Real or catfish? Real. No, catfish. No. I have no idea." },
    ] },
  ],
  'goodbye.video.honest': [
    { id: 'goodbye.video.honest.01', turns: [
      { by: 'a', video: "Hey, Circle! It's me, {a}, and yes, this is really me. What you saw is what you got." },
      { by: 'a', video: "I came in here being myself, and I'm leaving the same way. Good luck, everybody." },
    ] },
    { id: 'goodbye.video.honest.02', turns: [
      { by: 'a', video: "Hi, everybody. Surprise, no surprise. I'm {a}. I was always {a}." },
      { by: 'a', video: "I played with my heart, and maybe that's why I'm out. I'd do it again." },
    ] },
    { id: 'goodbye.video.honest.03', turns: [
      { by: 'a', video: "So this is me. Same face, same name, same everything." },
      { by: 'a', video: "I'm gonna miss talking to you all through a TV. Love you. Bye!" },
    ] },
  ],
  'goodbye.video.polished': [
    { id: 'goodbye.video.polished.01', turns: [
      { by: 'a', video: "Hey, Circle! It's {a}. Yes, those were my real pictures. Just my good-lighting pictures." },
      { by: 'a', video: "It was a crazy ride. Be good to each other." },
    ] },
    { id: 'goodbye.video.polished.02', turns: [
      { by: 'a', video: "Hi, everybody. It's really me. Maybe with a little less makeup than my profile." },
      { by: 'a', video: "I had the best time. Good luck. You'll need it." },
    ] },
    { id: 'goodbye.video.polished.03', turns: [
      { by: 'a', video: "It's {a}, the real deal. I showed you my best side. That's all anybody does, right?" },
      { by: 'a', video: "Take care of each other. Bye!" },
    ] },
  ],
  'goodbye.video.edited': [
    { id: 'goodbye.video.edited.01', turns: [
      { by: 'a', video: "Hey, Circle. It's really me, {a}. But I left a couple of things out of my profile." },
      { by: 'a', video: "It was my face and my name. The rest, I kept for myself. I hope you understand." },
    ] },
    { id: 'goodbye.video.edited.02', turns: [
      { by: 'a', video: "Okay. Confession time. That job on my profile? Not exactly my job." },
      { by: 'a', video: "I wanted you to know me before you knew that. Good luck, everybody." },
    ] },
    { id: 'goodbye.video.edited.03', turns: [
      { by: 'a', video: "Hi, everybody. I'm {a}, that part was true. Some of the details weren't." },
      { by: 'a', video: "Everything I said to you in the chats, though? That was all me." },
    ] },
  ],
  'goodbye.video.shared': [
    { id: 'goodbye.video.shared.01', turns: [
      { by: 'a', video: "Hi, Circle! So, funny story. There were two of us the whole time." },
      { by: 'a', video: "Every message you got, two people argued about it first. Love you all!" },
    ], beat: 'Two faces crowd into one camera frame.' },
    { id: 'goodbye.video.shared.02', turns: [
      { by: 'a', video: "Surprise! {a} was a team. We're two people, and we loved every second." },
      { by: 'a', video: "Good luck, everybody. From both of us." },
    ] },
    { id: 'goodbye.video.shared.03', turns: [
      { by: 'a', video: "Hey, everybody. You've been talking to two people this whole time." },
      { by: 'a', video: "We never said 'we' once. You're welcome." },
    ] },
  ],
  'goodbye.video.catfish.strategic': [
    { id: 'goodbye.video.catfish.strategic.01', turns: [
      { by: 'a', video: "Hey, Circle. My name is {a.real}, and I've been playing as {a}." },
      { by: 'a', video: "I thought a different face would get me further. It got me this far. No regrets." },
    ] },
    { id: 'goodbye.video.catfish.strategic.02', turns: [
      { by: 'a', video: "Surprise! I'm not {a}. I'm {a.real}." },
      { by: 'a', video: "It was a strategy, and it almost worked. Good luck, everybody." },
    ] },
    { id: 'goodbye.video.catfish.strategic.03', turns: [
      { by: 'a', video: "Hi, everybody. I'm {a.real}. {a} was my game plan." },
      { by: 'a', video: "The face was fake. Everything else I said to you was real. Well, most of it." },
    ] },
  ],
  'goodbye.video.catfish.protective': [
    { id: 'goodbye.video.catfish.protective.01', turns: [
      { by: 'a', video: "Hi. I'm {a.real}. I played as {a} because I was scared you'd judge me before you knew me." },
      { by: 'a', video: "You got to know me first. That means more than I can say. Thank you." },
    ] },
    { id: 'goodbye.video.catfish.protective.02', turns: [
      { by: 'a', video: "My real name is {a.real}. People have made up their minds about me my whole life." },
      { by: 'a', video: "In here, for once, they didn't. I'm sorry I lied about my face. I'm not sorry about the rest." },
    ] },
    { id: 'goodbye.video.catfish.protective.03', turns: [
      { by: 'a', video: "Hi, everybody. This is the real me. I'm {a.real}." },
      { by: 'a', video: "I wanted to be liked for who I am inside. And you did. So, thank you." },
    ] },
  ],
  'goodbye.video.catfish.experimental': [
    { id: 'goodbye.video.catfish.experimental.01', turns: [
      { by: 'a', video: "Hey, Circle. I'm {a.real}. I wanted to see if you'd treat me differently as {a}." },
      { by: 'a', video: "You did. That's all I'm gonna say. Good luck." },
    ] },
    { id: 'goodbye.video.catfish.experimental.02', turns: [
      { by: 'a', video: "Hi. I'm not {a}. I'm {a.real}. I came in here to test a theory." },
      { by: 'a', video: "The theory is right. Looks matter way too much. Be nice to each other." },
    ] },
    { id: 'goodbye.video.catfish.experimental.03', turns: [
      { by: 'a', video: "Surprise. {a.real} here. {a} was an experiment." },
      { by: 'a', video: "I learned a lot about all of you. And about me. Bye, everybody." },
    ] },
  ],
  'goodbye.video.catfish.family': [
    { id: 'goodbye.video.catfish.family.01', turns: [
      { by: 'a', video: "Hi, everybody. I'm {a.real}. {a} is real. {a} is someone I love, and I played as {a.obj}." },
      { by: 'a', video: "I hope I made them proud. Good luck, everybody." },
    ] },
    { id: 'goodbye.video.catfish.family.02', turns: [
      { by: 'a', video: "My name is {a.real}. Those pictures are of someone in my family." },
      { by: 'a', video: "I know that person better than anyone. I hope you liked them as much as I do." },
    ] },
    { id: 'goodbye.video.catfish.family.03', turns: [
      { by: 'a', video: "Hey, Circle. I'm {a.real}, not {a}. But {a} is waiting at home, and {a} is really cool." },
      { by: 'a', video: "I played this one for family. Bye, everybody." },
    ] },
  ],
  'goodbye.warning.catfish': [
    { id: 'goodbye.warning.catfish.01', turns: [
      { by: 'a', video: "One more thing. {c}? I don't think {c} is real. Be careful." },
    ] },
    { id: 'goodbye.warning.catfish.02', turns: [
      { by: 'a', video: "And a warning. Keep an eye on {c}. I think that profile is a catfish." },
    ] },
    { id: 'goodbye.warning.catfish.03', turns: [
      { by: 'a', video: "Before I go. {c}, I don't believe you. Everybody else, don't either." },
    ] },
  ],
  // a KNOWS c's profile was not c: met at the visit, or told by c in a chat.
  'goodbye.warning.seen': [
    { id: 'goodbye.warning.seen.01', turns: [
      { by: 'a', video: "And I have to tell you this. {c} is a catfish. I don't think it. I know it." },
    ] },
    { id: 'goodbye.warning.seen.02', turns: [
      { by: 'a', video: "One more thing. {c} is not who you think. I know that for a fact." },
    ] },
    { id: 'goodbye.warning.seen.03', turns: [
      { by: 'a', video: "Before I go. {c}, I know who you are now. Everybody else, it's time you did too." },
    ] },
  ],
  'goodbye.warning.distrusts': [
    { id: 'goodbye.warning.distrusts.01', turns: [
      { by: 'a', video: "One last thing. Don't trust {c}. That's all I'll say." },
    ] },
    { id: 'goodbye.warning.distrusts.02', turns: [
      { by: 'a', video: "And a piece of advice. Watch {c}. {c} is not as nice as the messages." },
    ] },
    { id: 'goodbye.warning.distrusts.03', turns: [
      { by: 'a', video: "Before I go. {c}, I see you. Everybody else, watch your backs." },
    ] },
  ],
  'goodbye.react.guilty': [
    { id: 'goodbye.react.guilty.01', turns: [
      { by: 'a', react: "Oh, that hurts. That really hurts. I did that." },
    ], beat: '{a} rubs {a.posAdj} face with both hands.' },
    { id: 'goodbye.react.guilty.02', turns: [
      { by: 'a', react: "Now I feel terrible. I really do." },
      { by: 'a', say: "It was a game decision. It doesn't feel like one right now." },
    ] },
    { id: 'goodbye.react.guilty.03', turns: [
      { by: 'a', react: "I'm sorry, {b}. I really am." },
    ], beat: '{a} stares at the frozen last frame of the video.' },
    { id: 'goodbye.react.guilty.04', turns: [
      { by: 'a', react: "Please don't hate me. Please don't hate me." },
    ], beat: '{a} watches through {a.posAdj} fingers.' },
    { id: 'goodbye.react.guilty.05', turns: [
      { by: 'a', react: "That was so classy. And I'm the one who blocked {b}. Great." },
    ] },
    { id: 'goodbye.react.guilty.06', turns: [
      { by: 'a', react: "Okay. I made my choice. I have to live with it." },
      { by: 'a', say: "It still doesn't feel good." },
    ] },
  ],
  'goodbye.react.warned': [
    { id: 'goodbye.react.warned.01', turns: [
      { by: 'a', react: "Me? {b} said my name? In front of everybody?" },
      { by: 'a', say: "Great. Now I have to do damage control." },
    ], beat: '{a} starts pacing the apartment.' },
    { id: 'goodbye.react.warned.02', turns: [
      { by: 'a', react: "Oh, come on! Why me?" },
    ], beat: '{a} throws a pillow across the room.' },
    { id: 'goodbye.react.warned.03', turns: [
      { by: 'a', react: "Wow. Okay. Thanks for that, {b}. Really helpful." },
      { by: 'a', say: "Everybody's gonna look at me differently now." },
    ] },
    { id: 'goodbye.react.warned.04', turns: [
      { by: 'a', react: "Did {b} just say my name? On the way out the door?" },
    ], beat: '{a} freezes with a spoon halfway to {a.posAdj} mouth.' },
    { id: 'goodbye.react.warned.05', turns: [
      { by: 'a', react: "Oh, great. Now everybody's looking at me." },
      { by: 'a', say: "I need to get in the chats. Right now." },
    ] },
    { id: 'goodbye.react.warned.06', turns: [
      { by: 'a', react: "Wow. On the way out the door? Really?" },
    ], beat: '{a} stands up and sits right back down.' },
  ],
  'goodbye.react.vindicated': [
    { id: 'goodbye.react.vindicated.01', turns: [
      { by: 'a', react: "I knew it! I KNEW it!" },
    ], beat: '{a} jumps off the couch and points at the screen.' },
    { id: 'goodbye.react.vindicated.02', turns: [
      { by: 'a', react: "Catfish! I called it! Did everybody hear me call it?" },
    ] },
    { id: 'goodbye.react.vindicated.03', turns: [
      { by: 'a', react: "My gut was right the whole time. Wow." },
      { by: 'a', say: "I'm never doubting myself again." },
    ] },
  ],
  'goodbye.react.surprised': [
    { id: 'goodbye.react.surprised.01', turns: [
      { by: 'a', react: "Bye, {b}. That video got me." },
    ] },
    { id: 'goodbye.react.surprised.02', turns: [
      { by: 'a', react: "I can't believe {b} is gone already." },
    ], beat: '{a} sits back and lets the video play out.' },
    { id: 'goodbye.react.surprised.03', turns: [
      { by: 'a', react: "Okay. That's one less person in here. Wow." },
    ] },
    { id: 'goodbye.react.surprised.04', when: { outed: true }, turns: [
      { by: 'a', react: "A catfish? {b}? I had no idea. None." },
      { by: 'a', say: "If {b} was fake, who else is?" },
    ] },
    { id: 'goodbye.react.surprised.05', when: { outed: false, suspects: true }, turns: [
      { by: 'a', react: "Real. {b} was real the whole time. And I didn't believe a word." },
    ], beat: '{a} covers {a.posAdj} face.' },
    { id: 'goodbye.react.surprised.06', when: { outed: false }, turns: [
      { by: 'a', react: "Aw. That's really {b}. I'm gonna miss {b}." },
    ] },
  ],
};
