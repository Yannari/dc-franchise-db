// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-tqa3.js — the host opens the vote by asking about the day
// ══════════════════════════════════════════════════════════════════════
// td/story/tribal.js tribalQA's opener, before the sharp questions. h the host; a answers first
// (who carried the challenge, else the most social), b adds to it.
//   tqa.open.lost.any    a team that just lost the challenge ({sank}: who struggled, when sank)
//   tqa.open.merged.any  the merged tribe: how camp feels today
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
    { id: 'nto.m3', turns: [
      { by: 'h', say: "So, how was today? Give me one word, {a}." },
      { by: 'a', say: "Busy.", v: { dry: "Suspicious.", loud: "Chaos!", anxious: "Scary." } },
      { by: 'h', say: "How so?" },
      { by: 'a', say: "Like everybody had somewhere to be, and none of it was chores." },
      { by: 'b', say: "That's the nicest way I've ever heard anybody describe a scramble." },
    ] },
  ],
};
