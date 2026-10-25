// pm/talk/more/group-chat-story.js — the group chats that say exactly what happened.
// Season read, 2026-10-25: Chloe's partner had just told her he wants Jess, and
// her chat said "I asked Ryan a simple question"; Theo "was told something
// about Jess". Each of these names it: {x} is the partner, {about} who it was with.
//   turned     {x} told {a} that {x} wants to get to know {about}
//   honest     {a} asked, and {x} told the truth (story graft: about {about}; kissed: a kiss)
//   dodged     {a} asked, and {x} wouldn't give a straight answer
//   found-out  {a} was told what {x} did with {about}; `sec`: pull · kiss · promise
// `hasWith` is whether there is an {about} to name.
export const GROUP_CHAT_STORY = {
  moves: {
    gather: [
      { when: { subj: ['turned', 'honest', 'dodged'] }, stage: "{a} comes back from the roof terrace and sits down on the daybed without a word. {b} takes one look at {a.obj} and moves closer.", turns: [
        ['b', "What's happened? Talk to me."],
        ['a', "Give me a second. I'm still processing it."],
      ] },
      { when: { subj: ['turned', 'honest', 'dodged'] }, stage: "{a} walks into the dressing room and shuts the door. {b} and the others stop doing their hair.", turns: [
        ['b', "Uh oh. What did {x} say?"],
        ['a', "How do you know it's about {x}?"],
        ['b', "Because it's always about {x}."],
      ] },
    ],
    tell: [
      { when: { subj: 'turned', hasWith: true }, turns: [
        ['a', "{x} wants to get to know {about}. That's it. That's the chat. {x} sat me down on the bed and said {x} has tried to ignore it but can't. Like it's a cold {x} caught. Like {x} had no choice in it."],
        ['b', "{about}? Are you being serious?"],
        ['a', "I couldn't make it up if I tried."],
      ] },
      { when: { subj: 'turned', hasWith: true }, turns: [
        ['a', "So I'm single, basically. Not officially. But {x} just told me {x}'s head's been turned by {about}, and {x} wants to see where it goes. And I sat there and nodded like an idiot, because what else do you do?"],
        ['b', "You don't nod! You don't nod at that!"],
        ['a', "I know that now!"],
      ] },
      { when: { subj: 'honest', story: 'graft', kissed: true, hasWith: true }, turns: [
        ['a', "{x} kissed {about}. Earlier, when they went off for that chat. {x} told me straight out, sitting on the roof terrace, like it was a weather report."],
        ['b', "Stop. {x} actually told you?"],
        ['a', "Told me. Said sorry. Said {x} would rather I heard it from {x.obj}. As if that makes it better."],
        ['b', "I mean, it does make it a bit better?"],
        ['a', "It does not make it a bit better."],
      ] },
      { when: { subj: 'honest', story: 'graft', kissed: false, hasWith: true }, turns: [
        ['a', "I asked {x} about the chat with {about}. And {x} didn't even try to pretend. Just said {x} enjoyed it, and there's something there, and {x} wants to see what it is."],
        ['b', "Wow. Okay. At least {x} was honest?"],
        ['a', "Everyone keeps saying that like honest is a present. It's not a present. It's a slap with a bow on it."],
      ] },
      { when: { subj: 'honest', story: 'doubt' }, turns: [
        ['a', "I asked {x} where {x.posAdj} head's at. And {x} told me. {x} isn't feeling it like {x} was. Just like that. I'd been worrying for two days that something was off, and it turns out I wasn't mad. I almost wish I was."],
        ['b', "Oh, I'm so sorry."],
        ['a', "Don't be nice to me. I'll go."],
      ] },
      { when: { subj: 'dodged' }, turns: [
        ['a', "I asked {x} one simple question. One. And {x} turned it round so I'm the problem for asking. I came out of there apologising, and I still don't know what for."],
        ['b', "That's such a classic move."],
        ['a', "Is it?"],
        ['b', "It's the oldest move in the villa. You ask a question, they make you feel crazy for asking it."],
      ] },
      { when: { subj: 'dodged' }, turns: [
        ['a', "I don't even know what that was. I asked {x} if I had anything to worry about, and {x} just said I was reading into things. Didn't say no. Didn't say yes. Just, stop reading into things."],
        ['b', "That's not an answer."],
        ['a', "That's what I said! And then {x} went to get a drink."],
      ] },
      { when: { subj: 'found-out', sec: 'kiss', hasWith: true }, turns: [
        ['a', "{x} kissed {about}. Behind my back. And I had to hear it from someone else, sitting in the kitchen like an idiot, while {x} was out by the pool acting like everything was normal."],
        ['b', "{about}? I'm going to be sick."],
        ['a', "Join the queue."],
      ] },
      { when: { subj: 'found-out', sec: 'promise', hasWith: true }, turns: [
        ['a', "{x} has been making plans with {about}. For the outside. Holidays, meeting families, all of it. While sitting next to me every night. I've just been told every word of it."],
        ['b', "Plans? Actual plans?"],
        ['a', "Actual plans. I didn't even know we were allowed to make plans."],
      ] },
      { when: { subj: 'found-out', sec: 'pull', hasWith: true }, turns: [
        ['a', "Apparently {x} was off with {about} for ages yesterday. Like, heads together, for an hour. And everyone saw it except me."],
        ['b', "An hour?"],
        ['a', "An hour! I can't get {x} to talk to me for twenty minutes without {x} looking at the pool."],
      ] },
    ],
    react: [
      { when: { subj: 'turned' }, turns: [
        ['b', "Do you know what? Let {x} go. Honestly. If {x} can sit you down and say that to your face after everything, {x} isn't the one. You deserve someone who doesn't need to think about it."],
        ['a', "I know. I know that. It just hurts."],
        ['b', "Of course it hurts. It's meant to hurt. That means it was real for you."],
      ] },
      { when: { subj: 'turned', hasWith: true }, turns: [
        ['b', "I'll be honest, I saw it coming. The way {x} has been around {about}. I just didn't want to be the one to say it."],
        ['a', "You should have said it!"],
        ['b', "Would you have listened?"],
        ['a', "No."],
      ] },
      { when: { subj: 'honest' }, turns: [
        ['b', "It's horrible, but at least now you know. You're not lying in bed every night wondering. You can make your decision with the full picture."],
        ['a', "I didn't want the full picture. I wanted the nice picture."],
      ] },
      { when: { subj: 'honest', kissed: true }, turns: [
        ['b', "I'm sorry, but I don't care how honest {x} was about it afterwards. A kiss is a kiss. You don't get points for confessing something you shouldn't have done."],
        ['a', "Thank you. That's what I keep thinking."],
      ] },
      { when: { subj: 'dodged' }, turns: [
        ['b', "Listen to me. If {x} had nothing to hide, {x} would have just said no. It's one word. No. It's not hard."],
        ['a', "So you think there's something?"],
        ['b', "I think you need to keep your eyes open."],
      ] },
      { when: { subj: 'dodged' }, turns: [
        ['b', "Maybe {x} was just caught off guard. Some people go really defensive when they feel attacked, even when they've done nothing wrong."],
        ['a', "I didn't attack!"],
        ['b', "I know you didn't. I'm saying maybe it felt like that to {x}."],
      ] },
    ],
    react2: [
      { when: { subj: ['turned', 'honest'], cast: [3, 4], hasWith: true }, turns: [
        ['c', "And {about} has been sitting there all day smiling at everyone like butter wouldn't melt. I've got a few words for {about.obj}, honestly."],
        ['a', "Please don't. I don't want a scene."],
        ['c', "It wouldn't be a scene. It'd be a conversation. A loud one."],
      ] },
      { when: { subj: 'dodged', cast: [3, 4] }, turns: [
        ['c', "If it was me, I'd go back over there right now and ask again. Calm. Clear. And don't let {x} change the subject this time."],
        ['a', "I don't have the energy for round two."],
      ] },
    ],
    verdict: [
      { when: { subj: 'turned' }, turns: [
        ['a', "I'm not going to beg. I'm not that person. If {x} wants to go, {x} can go."],
        ['b', "That's the spirit. And tomorrow you're going to look incredible, and {x} is going to notice."],
      ] },
      { when: { subj: 'honest' }, turns: [
        ['a', "I need to sleep on it. I can't make any decisions tonight. I'll just make the wrong one."],
        ['b', "Sleep on it. We'll be right here."],
      ] },
      { when: { subj: 'dodged' }, turns: [
        ['a', "I'm going to leave it tonight. But I'm not letting it go. I want a real answer."],
        ['b', "Good. You deserve one."],
      ] },
    ],
    close: [
      { when: { subj: ['turned', 'honest', 'dodged'] }, turns: [], beat: "{b} wraps an arm round {a}. Across the villa, {x} is laughing at something, and all of them notice." },
    ],
  },
};
