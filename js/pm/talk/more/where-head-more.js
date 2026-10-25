// pm/talk/more/where-head-more.js — the rest of the conversation.
// Real villa talks run 30-60 lines (Love Island USA S3E21: Cashay and Charlie,
// the morning after); ours stopped after the answer. Two more movements:
//   feel    what this has done to {a}, said out loud — the long turn
//   decide  what happens now, from {b}'s answer (`of`)
export const WHERE_HEAD_PLANS = {
  featured: ['open', 'ask', 'answer', 'feel', 'push', 'decide', 'close'],
  short: ['ask', 'answer', 'decide?', 'close'],
};

export const WHERE_HEAD_MORE = {
  moves: {
    feel: [
      { when: { of: 'reassure' }, turns: [
        ['a', "I'm not normally like this. Honestly, on the outside I'm the chilled one. But in here you can't go anywhere, you can't switch off, and every little thing gets ten times bigger. And then I see you walk off with somebody, and my brain just goes to the worst place."],
        ['b', "I know. It's this place. It does it to everyone."],
        ['a', "It's not just this place. It's because it's you. If I didn't care, I wouldn't have sat in that kitchen for an hour watching the door."],
      ] },
      { when: { of: 'reassure' }, turns: [
        ['a', "Can I be really honest? I've been building it up all day. I had a whole speech in my head. And now you've said that, and I feel a bit stupid."],
        ['b', "Don't feel stupid. I'd rather you asked."],
        ['a', "You would?"],
        ['b', "Of course. I'd rather you asked me than asked everyone else."],
      ] },
      { when: { of: 'honest' }, turns: [
        ['a', "Do you know what the worst bit is? I'd started telling people about you. Not the villa, the cameras. In the beach hut. I'd started saying your name like it meant something. And now I've got to go in there tomorrow and say this."],
        ['b', "It did mean something. It still does."],
        ['a', "Just not as much as I thought."],
      ] },
      { when: { of: 'honest' }, turns: [
        ['a', "I keep thinking back over the last few days, trying to work out when it changed. And I can't find it. Was I just not paying attention?"],
        ['b', "You didn't do anything wrong. It's not something you missed."],
        ['a', "Then what is it?"],
        ['b', "I don't know. I wish I did. It would be easier if I did."],
      ] },
      { when: { of: 'deflect' }, turns: [
        ['a', "I'm not trying to start a row. I swear I'm not. I just want to know where I stand, because right now I don't, and it's horrible. I'm lying in bed at night next to someone I don't know how to read."],
        ['b', "You can read me."],
        ['a', "I can't, though. That's what I'm telling you."],
      ] },
      { when: { of: 'deflect' }, turns: [
        ['a', "Every time I try to talk to you about anything real, you make a joke, or you go and get a drink, or you say I'm overthinking. And maybe I am. But that's not an answer to anything."],
        ['b', "What do you want me to say?"],
        ['a', "The truth. That's all. Whatever it is."],
      ] },
      { when: { of: 'lie' }, turns: [
        ['a', "Okay. I'm sorry. I just got in my head. Everyone was looking at me when you went off, and I could feel them feeling sorry for me, and I hated it."],
        ['b', "Nobody needs to feel sorry for you. You've got nothing to worry about."],
        ['a', "Promise?"],
        ['b', "Promise."],
      ] },
    ],
    decide: [
      { when: { of: 'reassure', story: 'graft' }, turns: [
        ['a', "Can we make a deal? If {c} pulls you again, you tell me first. Not after. First."],
        ['b', "Deal. And if anyone pulls you, same."],
        ['a', "Nobody's pulling me. Have you seen me today? I've been a wreck."],
        ['b', "You've been a lovely wreck."],
      ] },
      { when: { of: 'reassure', story: 'doubt' }, turns: [
        ['a', "Then let's actually spend some time together tomorrow. Not just sitting next to each other at dinner. Actually together."],
        ['b', "I'd like that. I mean it."],
      ] },
      { when: { of: 'honest', story: 'graft' }, turns: [
        ['a', "So what now? Are you going to keep talking to {c}?"],
        ['b', "I think I have to. I need to know if it's real. If I don't, I'll always wonder."],
        ['a', "And I'm supposed to just sit there and watch."],
        ['b', "I'm not asking you to do anything. I'm telling you the truth."],
      ] },
      { when: { of: 'honest', story: 'doubt' }, turns: [
        ['a', "So what do we do? Do we just carry on? Sleep in the same bed and pretend this chat didn't happen?"],
        ['b', "I don't know. Maybe we just take it one day at a time and see."],
        ['a', "One day at a time. Right. In a villa where people get dumped every other night."],
      ] },
      { when: { of: 'deflect' }, turns: [
        ['a', "I'm going to leave it. Not because I'm okay with it. Because I'm not getting anywhere tonight. But when you're ready to talk to me, properly talk, I'll be here."],
        ['b', "Fine."],
        ['a', "Fine."],
      ] },
      { when: { of: 'lie' }, turns: [
        ['a', "Okay. Let's forget about it. Fresh start tomorrow."],
        ['b', "Fresh start."],
      ] },
    ],
  },
};
