// pm/talk/more/group-chat-ended.js — {x} has just told {a} they're better as friends.
// The end of a doubt (pm/threads.js, talk/doubt-end.js `friends`), told by the
// one it was done to.
export const GROUP_CHAT_ENDED = {
  moves: {
    gather: [
      { when: { subj: 'ended' }, stage: "{a} walks into the bedroom and lies face down on the nearest bed. {b} sits down on the edge of it.", turns: [
        ['b', "Do you want to talk, or do you want me to just sit here?"],
        ['a', "Both."],
      ] },
    ],
    tell: [
      { when: { subj: 'ended' }, turns: [
        ['a', "{x} ended it. Better as friends. That's what I got. Better as friends, after everything. And the worst bit is, I could see it coming for days, and I still wasn't ready."],
        ['b', "Oh, come here. I'm so sorry."],
        ['a', "Don't be nice to me. If you're nice to me I'll cry, and I've done enough crying."],
      ] },
      { when: { subj: 'ended' }, turns: [
        ['a', "So that's me and {x} done. {x} sat me down, all calm, like it had been rehearsed. Said I deserve someone who looks at me the way I look at {x.obj}. Which is a lovely thing to say to someone while you're dumping them."],
        ['b', "That's such a line."],
        ['a', "I know it's a line! I could hear it was a line!"],
      ] },
    ],
    react: [
      { when: { subj: 'ended' }, turns: [
        ['b', "Listen. I know it doesn't feel like it now, but you've just got your time back. You're not sitting next to someone who's only half there any more. That's a good thing, even if it hurts."],
        ['a', "It doesn't feel like a good thing."],
        ['b', "It will. Give it a day or two."],
      ] },
      { when: { subj: 'ended' }, turns: [
        ['b', "Honestly? {x} has done you a favour. I wasn't going to say it while you were together, but you were always the one trying."],
        ['a', "Was it that obvious?"],
        ['b', "To everyone except you."],
      ] },
    ],
    react2: [
      { when: { subj: 'ended', cast: [3, 4] }, turns: [
        ['c', "The recoupling's coming, and you're going to walk in there and choose for yourself this time. Not because you're stuck. Because you want to."],
        ['a', "When you put it like that, it sounds almost exciting."],
        ['c', "It is exciting. You're single in a villa. That's literally the point of the show."],
      ] },
    ],
    verdict: [
      { when: { subj: 'ended' }, turns: [
        ['a', "Okay. One night of feeling sorry for myself. Then I'm getting dressed up and I'm going to have the best time in here."],
        ['b', "That's my favourite thing you've ever said."],
      ] },
    ],
    close: [
      { when: { subj: 'ended' }, turns: [], beat: "{b} pulls the cover over both of them, and stays there until {a} has stopped crying." },
    ],
  },
};
