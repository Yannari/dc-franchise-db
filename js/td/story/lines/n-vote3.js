// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-vote3.js — the vote talked through: solo decisions and full huddles
// ══════════════════════════════════════════════════════════════════════
//
// director.js shapeFor decides how the person running a plan works: 'group' (the people they
// trust, together: b, c and d when there are four), 'duo' (one person aside: n-vote.js and
// n-vote2.js) or 'solo' (nobody: a decides and tells the camera). Same keys and slots as
// n-vote.js. Ids: 'nu.'.

const S = (id, when, lines, v) => ({ id, place: 'confessional', when: { cast: 'solo', ...(when || {}) }, turns: lines.map((conf, i) => ({ by: 'a', conf, ...(i === 0 && v ? { v } : {}) })) });

export default {
  // ── solo: a has made up a mind alone ──
  'story.vote.plan.plan': [
    S('nu.sp1', null, ["I haven't talked to anybody about tonight. I don't need to.", "I've been watching who sits with who. Everybody's drifting toward {target}. So I'm writing {target}, and I'm keeping my mouth shut."], { loud: "Normally I'd be yelling about tonight. Not this time. I don't need to." }),
    S('nu.sp2', null, ["People keep coming up to me asking what I'm doing tonight. I keep saying I don't know.", "I know. It's {target}. That's where the votes are going, and I'm going with them."]),
    S('nu.sp3', null, ["I'm not in the big conversations. That's fine. You don't have to be in them to hear them.", "It's {target}. {votes} people, at least. I'll be one of them."], { anxious: "I'm not in the big conversations. I just listen and hope I'm hearing it right." }),
    S('nu.sp4', { other: true }, ["Everybody was saying {other} this morning. By lunch, it was {target}.", "I don't know who changed it. I don't need to. I'm writing {target}."]),
    {
      id: 'nu.gp1', place: 'secret', when: { fourth: true }, turns: [
        { beat: "{a} gets {b}, {c} and {d} together at {place}, away from everyone else." },
        { by: 'a', say: "Okay. Everybody's here. Let's do this fast." },
        { by: 'd', say: "Do what fast?" },
        { by: 'a', say: "Tonight. I think it should be {target}." },
        { by: 'b', say: "Why {target}?" },
        { by: 'a', say: "Because {target} doesn't have anybody. Nobody fights for {target}. We can do it without a mess." },
        { by: 'c', say: "I kind of like {target}, though." },
        { by: 'a', say: "So do I. Would you rather it was one of us?" },
        { by: 'c', say: "...No." },
        { by: 'd', say: "Okay. Then {target}. All four of us?" },
        { by: 'b', say: "All four." },
        { by: 'a', say: "Good. Nobody says anything to anybody. We walk back separately." },
        { by: 'd', conf: "Four people behind a tree, deciding somebody's whole game in two minutes. That's this place." },
      ],
    },
    {
      id: 'nu.gp2', place: 'sleep', when: { fourth: true }, turns: [
        { beat: "The {quarters}, while the others are out. {a}, {b}, {c} and {d} sit on the {bed}s." },
        { by: 'b', say: "We have maybe ten minutes before somebody walks in." },
        { by: 'a', say: "Then I'll be quick. Who's everyone thinking?" },
        { by: 'c', say: "I've heard {target}." },
        { by: 'd', say: "Me too." },
        { by: 'a', say: "{target} works for me. Anybody hate it?" },
        { by: 'b', say: "I don't hate it. I just want to know we're not walking into something." },
        { by: 'a', say: "If we're all on it, that's {votes}. It's not close." },
        { by: 'c', say: "Then it's {target}." },
        { beat: "Footsteps outside. Everyone suddenly gets very interested in their stuff." },
        { by: 'b', conf: "That's how votes happen here. Nobody gives a speech. Somebody says a name and nobody argues." },
      ],
    },
    {
      id: 'nu.gp3', place: 'fire', when: { fourth: true, voice: ['bossy', 'loud', 'competitive', 'tough'] }, turns: [
        { by: 'a', say: "Huddle. Now. You three." },
        { by: 'c', say: "Subtle." },
        { by: 'a', say: "I don't have time for subtle. Tonight's {target}. That's the plan." },
        { by: 'd', say: "Do we get a say?" },
        { by: 'a', say: "You get a say. Say yes." },
        { by: 'b', say: "Why {target}?" },
        { by: 'a', say: "Because I've counted, and {target} is the only name we can get {votes} on. Anybody got a better one?" },
        { beat: "Nobody does." },
        { by: 'a', say: "Great. Meeting over." },
        { by: 'c', conf: "{a} runs our group like a coach. Most of the time that's annoying. Tonight it means I know exactly what I'm doing." },
      ],
    },
    {
      id: 'nu.gp4', place: 'secret', when: { fourth: true, voice: ['warm', 'earnest', 'emotional', 'anxious'] }, turns: [
        { by: 'a', say: "I hate this part. I just want us to decide together, so nobody feels like it was them." },
        { by: 'b', say: "That's very fair." },
        { by: 'a', say: "So. Names. Be honest." },
        { by: 'c', say: "{target}. Sorry. It's {target}." },
        { by: 'd', say: "Yeah. I was going to say {target} too." },
        { by: 'b', say: "Same." },
        { by: 'a', say: "Okay. {target}. Then it's all of us. Nobody did it alone." },
        { by: 'd', conf: "{a} made it a group decision so nobody has to carry it. That's kind, actually. It's still {target}'s game ending." },
      ],
    },
  ],
  'story.vote.plan.weak': [
    S('nu.sw1', null, ["I'm not going to make a big plan. We lost, and {target} was the weakest one out there today.", "I'm writing {target}. I'd bet most of the team is too."], { cruel: "We lost. I don't need a meeting to figure out why." }),
    S('nu.sw2', { sank: true }, ["{target} came last today. Everybody saw it.", "I don't need anyone to tell me what to do tonight. I already know."]),
    {
      id: 'nu.gw1', place: 'work', when: { fourth: true }, turns: [
        { beat: "{a}, {b}, {c} and {d} are stacking wood {here}, voices low." },
        { by: 'a', say: "So. Tonight. We all know who it is." },
        { by: 'c', say: "Do we?" },
        { by: 'b', say: "{target}." },
        { by: 'a', say: "{target}. We need to win, and we're not winning with {target}." },
        { by: 'd', say: "It feels kind of mean." },
        { by: 'a', say: "It feels mean. It's still right. If we lose again, it's one of us four." },
        { by: 'c', say: "...Fine. {target}." },
        { by: 'd', move: 'agree.reluctant' },
        { by: 'b', conf: "It wasn't even a discussion. We lost, {target} was last, and four of us nodded. That's how it goes before the merge." },
      ],
    },
    {
      id: 'nu.gw2', place: 'aside', when: { fourth: true, sank: true }, turns: [
        { by: 'd', say: "Are we going to talk about it?" },
        { by: 'a', say: "We're talking about it. {target} came last." },
        { by: 'b', say: "Again." },
        { by: 'c', say: "Everyone has a bad day." },
        { by: 'a', say: "Sure. But we can't keep losing people who are good at this because of somebody's bad days." },
        { by: 'c', say: "Okay. I get it." },
        { by: 'a', say: "So that's four of us on {target}. {votes} counting the others." },
        { by: 'c', conf: "I said I get it. I do. I just don't love being the kind of person who gets it." },
      ],
    },
  ],
  'story.vote.plan.threat': [
    S('nu.st1', null, ["Nobody's said it out loud yet, so I will. To you, anyway.", "{target} is the biggest threat here. If I don't vote {target} out now, I'm going to be voting against {target} at the end."], { schemer: "Everybody's pretending there's no big threat left here. I'm not pretending." }),
    S('nu.st2', { merged: true }, ["{target} has friends on both of the old teams. Nobody else does.", "I'm not making speeches about it. I'm writing {target} and hoping enough people see what I see."]),
    {
      id: 'nu.gt1', place: 'secret', when: { fourth: true }, turns: [
        { beat: "{a} has waited until {target} went to the water. {b}, {c} and {d} are {here}." },
        { by: 'a', say: "Can I say a name, and nobody freaks out?" },
        { by: 'd', say: "That's a great start." },
        { by: 'a', say: "{target}." },
        { by: 'b', say: "{target}? {target} hasn't done anything." },
        { by: 'a', say: "That's the point. {target} doesn't have to do anything. Everybody already likes {target}. If {target} gets to the end, {target} wins." },
        { by: 'c', say: "And you think we can do it?" },
        { by: 'a', say: "Us four, plus who we've talked to. {votes}. Tonight's the night, because nobody sees it coming." },
        { by: 'd', move: 'agree.reluctant' },
        { by: 'c', say: "In." },
        { by: 'b', conf: "We just agreed to vote out the nicest person here. It's the smartest thing we've done. I feel terrible." },
      ],
    },
    {
      id: 'nu.gt2', place: 'aside', when: { fourth: true, voice: ['competitive', 'tough', 'proud'] }, turns: [
        { by: 'a', say: "Be honest. Can anybody here beat {target} in a challenge?" },
        { by: 'c', say: "No." },
        { by: 'd', say: "Not really." },
        { by: 'b', say: "On a good day, maybe." },
        { by: 'a', say: "Then we don't beat {target} in a challenge. We beat {target} tonight." },
        { by: 'c', say: "Because tonight {target} can't win immunity." },
        { by: 'a', say: "Exactly. {votes} of us. Write {target}." },
        { by: 'a', conf: "I don't like losing to anybody. I really don't like losing to {target} every single week." },
      ],
    },
  ],
  'story.vote.plan.grudge': [
    S('nu.sg1', null, ["I'm not going to pretend this one's about strategy.", "{target} has been awful to me since day one. Tonight I get to write that down."], { warm: "I'm not proud of this one. I want to say that first." }),
    {
      id: 'nu.gg1', place: 'aside', when: { fourth: true }, turns: [
        { by: 'a', say: "Is it just me, or is everyone done with {target}?" },
        { by: 'b', say: "It's not just you." },
        { by: 'c', say: "I've been done since day two." },
        { by: 'd', say: "Day one." },
        { by: 'a', say: "Then why are we pretending tonight's complicated?" },
        { by: 'b', say: "Because it's mean?" },
        { by: 'a', say: "It's not mean. It's honest. {target} made this whole camp miserable. {votes} of us want some peace." },
        { by: 'd', conf: "Nobody's voting for {target} for strategy reasons. We just want to sleep without hearing {target} complain." },
      ],
    },
  ],
  'story.vote.plan.strike': [
    S('nu.ss1', null, ["Somebody told me {target} has been saying my name.", "I didn't go running to anyone. I just quietly made sure my name isn't the one that comes out tonight. {target}'s is."]),
    {
      id: 'nu.gs1', place: 'secret', when: { fourth: true }, turns: [
        { by: 'a', say: "Okay, everybody listen. {target} is trying to flip the vote. Onto one of us." },
        { by: 'c', say: "Which one?" },
        { by: 'a', say: "Does it matter? If {target} gets the numbers, one of us four is gone." },
        { by: 'd', say: "So we get there first." },
        { by: 'a', say: "We get there first. {target}. {votes} of us, if everyone holds." },
        { by: 'b', say: "And {target} doesn't know we know?" },
        { by: 'a', say: "{target} has no idea. Keep it that way. Smile at dinner." },
        { by: 'c', conf: "An hour ago I thought tonight was boring. Now we're voting out the person trying to vote us out. Nothing here stays boring." },
      ],
    },
  ],
  'story.vote.plan.shield': [
    S('nu.sh1', null, ["My closest ally's name was out there this morning.", "I didn't hold a meeting. I just talked to people one at a time and moved it. Now it's {target}."]),
  ],

  // ── the other side ──
  'story.vote.other.boot': [
    S('nu.so1', null, ["I haven't really talked to anyone today. I don't need to.", "It's {target}. Obviously it's {target}. I'll write it and go to bed."], { anxious: "I haven't talked to anyone today. Should I have? No. It's fine. It's fine." }),
    S('nu.so2', null, ["Everybody's been running around whispering. Not me.", "I already know how tonight goes. {target}."]),
    {
      id: 'nu.go1', place: 'fire', when: { third: true }, turns: [
        { by: 'a', say: "So we're all on {target}, right?" },
        { by: 'b', say: "That's what we said." },
        { by: 'c', say: "Has anybody actually checked with the others?" },
        { by: 'a', say: "I don't need to. Look at {target}. {target} knows." },
        { by: 'c', say: "{target} looks pretty relaxed to me." },
        { by: 'a', say: "That's {target} trying to look relaxed." },
        { by: 'b', say: "Okay. {target}." },
        { by: 'c', conf: "{a} is so sure. I really hope sure is the same thing as right tonight." },
      ],
    },
    {
      id: 'nu.go2', place: 'secret', when: { third: true, group: true }, turns: [
        { by: 'a', say: "{group} is on {target}. All of us. Good?" },
        { by: 'b', say: "Good." },
        { by: 'c', say: "Good. Is it weird that it's so quiet today?" },
        { by: 'a', say: "Quiet means nobody's fighting it." },
        { by: 'c', say: "Or it means they're fighting it somewhere we can't hear." },
        { by: 'a', say: "You worry too much." },
        { by: 'c', conf: "I've got a bad feeling about tonight. I can't explain it. {a} won't listen to it." },
      ],
    },
  ],
  'story.vote.other.losing': [
    S('nu.sl1', null, ["I'm writing {target}. I know I'm probably on my own.", "I'd rather lose the vote than write a name I don't believe in."]),
    {
      id: 'nu.gl1', place: 'aside', when: { third: true }, turns: [
        { by: 'a', say: "Count it with me. Who's on {target}?" },
        { by: 'b', say: "Us three." },
        { by: 'c', say: "And maybe one more." },
        { by: 'a', say: "Maybe isn't a vote." },
        { by: 'b', say: "So do we switch?" },
        { by: 'a', say: "And vote with the people who've been lying to us all day? No." },
        { by: 'c', say: "Then we're three votes on the wrong side." },
        { by: 'a', say: "Three votes that everybody will see. That's something too." },
        { by: 'b', conf: "We're going to lose the vote tonight. At least it's the three of us losing it together." },
      ],
    },
  ],
};
