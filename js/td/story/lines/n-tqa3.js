// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-tqa3.js — the host opens the vote by asking about the day
// ══════════════════════════════════════════════════════════════════════
// td/story/tribal.js tribalQA's opener, before the sharp questions. h the host; a answers first
// (who carried the challenge, else the most social), b adds to it.
//   tqa.open.lost.any    a team that just lost the challenge ({sank}: who struggled, when sank)
//   tqa.open.merged.any  the merged tribe: how camp feels today ({imm}: tonight's immunity, when imm;
//                        {lastBoot}: who went home last time, when lastBoot)
// Ids: 'nto.'.

export default {
  'tqa.open.lost.any': [
    { id: 'nto.l1', turns: [
      { by: 'h', say: "So. You lost today. {a}, how does camp feel when you get back from a loss like that?" },
      { by: 'a', say: "Quiet. Really quiet. Nobody wanted to look at anybody.", v: { loud: "Awful! Everybody was snapping at everybody!", calm: "Tense. People went off in pairs, which is never a good sign." } },
      { by: 'h', say: "{b}, is that how you saw it?" },
      { by: 'b', say: "Pretty much. And then everybody started whispering, which is how you know it's a vote day." },
    ] },
    { id: 'nto.l2', when: { sank: true }, turns: [
      { by: 'h', say: "Tough day out there. {a}, walk me through it. Where did it go wrong?" },
      { by: 'a', say: "Honestly? We were fine until about halfway, and then it just fell apart." },
      { by: 'h', say: "Fell apart, or fell apart because of somebody?" },
      { by: 'a', say: "I'm not going to point fingers.", v: { blunt: "Everybody saw. I don't need to say a name.", cruel: "I'm not going to point fingers. I'm just going to look in a direction." } },
      { by: 'b', say: "We all know what happened. That's the problem." },
      { beat: "Nobody looks at {sank}. {sank} looks at the fire." },
    ] },
    { id: 'nto.l3', turns: [
      { by: 'h', say: "{b}, you look exhausted." },
      { by: 'b', say: "I am exhausted. We lost, and then we spent the whole afternoon trying to figure out who's going home." },
      { by: 'h', say: "And did you figure it out?" },
      { by: 'b', say: "I think so. I hope so." },
      { by: 'a', say: "Everybody thinks so. That's what makes it scary.", v: { dry: "Everybody thinks they figured it out. Somebody's about to find out they didn't." } },
    ] },
  ],
  'tqa.open.merged.any': [
    { id: 'nto.m4', when: { imm: true }, turns: [
      { by: 'h', say: "{imm} has immunity tonight, which means everybody else is fair game. {a}, how does that feel?" },
      { by: 'a', say: "Annoying, honestly. {imm} was the name a lot of people were thinking about, and now we all have to think again.", v: {"tough":"It doesn't bother me, because I'll beat {imm} next time.","warm":"I'm happy for {imm}, I really am. It just makes tonight scarier for the rest of us.","dry":"Thrilled. Can't you tell?","anxious":"It's scary, because if it's not {imm}, it could be anybody, and anybody includes me."} },
      { by: 'h', say: "{b}?" },
      { by: 'b', say: "Honestly, I'm just glad it narrows it down. Narrows it down to everybody but {imm}, but still." },
    ] },
    { id: 'nto.m5', when: { imm: true }, turns: [
      { by: 'h', say: "{a}, did it hurt watching {imm} win today?" },
      { by: 'a', say: "A little. I wanted that win more than I've wanted anything out here." },
      { by: 'h', say: "And now?" },
      { by: 'a', say: "Now I'm hoping I don't need it." },
    ] },
    { id: 'nto.m6', when: { lastBoot: true }, turns: [
      { by: 'h', say: "Last time we were here, {lastBoot} walked out. {a}, did camp change after that?" },
      { by: 'a', say: "Yeah, it did. People are a lot more careful about who they talk to now.", v: {"warm":"It did. I miss {lastBoot}, honestly, and camp feels emptier without {lastBoot}.","tough":"Not really. Somebody went home, and that's the game.","dry":"A little. There's one less person to share the rice with, so I'm not complaining.","anxious":"Yes, everybody's on edge now. Every time somebody whispers, I think it's about me.","loud":"Totally! Everybody's suddenly being super nice to each other, and it's creepy!"} },
      { by: 'h', say: "{b}, do you agree?" },
      { by: 'b', say: "I think it changed who people talk to. Everybody had to find a new person." },
    ] },
    { id: 'nto.m7', when: { lastBoot: true }, turns: [
      { by: 'h', say: "{b}, anybody miss {lastBoot}?" },
      { by: 'b', say: "Some of us do. Some of us are doing a very good job of pretending." },
      { by: 'h', say: "Which one are you?" },
      { by: 'b', say: "I'm not answering that." },
    ] },
    { id: 'nto.m8', turns: [
      { by: 'h', say: "{a}, at this point in the game, do you sleep?" },
      { by: 'a', say: "Barely. Every time somebody gets up in the night, I wonder where they're going." },
      { by: 'h', say: "{b}, do you get up in the night?" },
      { by: 'b', say: "Only to go to the bathroom. Probably." },
    ] },
    { id: 'nto.m9', turns: [
      { by: 'h', say: "Let's start easy. {b}, is there anybody here you'd trust with your vote?" },
      { by: 'b', say: "With my vote? Maybe one person. With my food, nobody." },
      { by: 'h', say: "{a}, same?" },
      { by: 'a', say: "I trust people with my vote. I just double-check afterwards." },
    ] },
    { id: 'nto.m10', turns: [
      { by: 'h', say: "{a}, I hear there was some walking around camp this afternoon." },
      { by: 'a', say: "There's always walking around camp." },
      { by: 'h', say: "This walking was in pairs. Very quiet pairs." },
      { by: 'a', say: "Then it sounds like you know more than I do." },
      { by: 'b', say: "Honestly, I don't think anybody here knows for sure what's happening tonight.", v: {"dry":"If anybody knows what's going on tonight, they haven't told me.","anxious":"I don't know anything. I really, really hope somebody does."} },
    ] },
    { id: 'nto.m1', turns: [
      { by: 'h', say: "{a}, there are fewer of you every time I see you. What's camp like now?" },
      { by: 'a', say: "Smaller. Meaner. Everybody's nice to your face and then goes off for a walk.", v: { warm: "Strange. You can be laughing with somebody at lunch and wondering about them by dinner." } },
      { by: 'h', say: "{b}, would you agree?" },
      { by: 'b', say: "I'd say everybody's just a lot more careful about who they're seen talking to." },
    ] },
    { id: 'nto.m2', turns: [
      { by: 'h', say: "Every vote from here on out is personal. {b}, does it feel personal yet?" },
      { by: 'b', say: "It's felt personal for days.", v: { tough: "It's always been personal. Some people are just finally admitting it." } },
      { by: 'h', say: "{a}?" },
      { by: 'a', say: "It feels like everybody's counting. All the time. Even when we're just eating." },
    ] },
  ],
};
