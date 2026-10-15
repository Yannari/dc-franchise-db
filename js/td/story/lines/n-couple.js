// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-couple.js — a couple, between their scenes (td/story/couple.js)
// ══════════════════════════════════════════════════════════════════════
// The user's plan, step 3 (2026-10-12): deeper romance, "competing priorities, vulnerability, awkward disagreements,
// earned reconciliation"; and 2026-10-14, "don't forget romance". a and b are an active showmance.
//   couple.priority  a tribal night where they write different names (their ballots say so): {mine} is a's name,
//                    {other} is b's. Nothing here says how it ends.
//   couple.disagree  a doesn't trust {c}; b is {c}'s friend. Awkward, not a fight: it goes quiet.
//   couple.mend      one to three episodes after an aired disagreement about {friend} (the c of that disagreement):
//                    they make it right, and it costs somebody their pride
//   couple.open      a says something real: a fear, an insecurity
//   couple.daily     a small moment that is only theirs
// No time of day in the words (these air morning or evening). Ids: 'ncp.'.
export default {
  'couple.priority.any': [
    { id: 'ncp.p1', when: { tribal: true, mine: true, other: true }, turns: [
      { by: 'a', say: "I need you on {mine} tonight." },
      { by: 'b', say: "I can't. I already said I'd go {other}." },
      { by: 'a', say: "Said to who?" },
      { by: 'b', say: "To people I can't afford to let down." },
      { by: 'a', say: "And me? Can you afford to let me down?" },
      { by: 'b', say: "That's not fair." },
      { by: 'a', conf: "I asked {b} for one vote. Just one. And {b} picked somebody else's plan over me." },
    ] },
    { id: 'ncp.p2', when: { tribal: true, mine: true, other: true }, turns: [
      { by: 'b', say: "Who are you writing?" },
      { by: 'a', say: "{mine}." },
      { by: 'b', say: "I'm writing {other}." },
      { by: 'a', say: "So we're splitting." },
      { by: 'b', say: "We're not splitting. We're just voting differently." },
      { by: 'a', say: "That's what splitting means." },
      { by: 'b', conf: "I care about {a}. I also came here to play. Tonight those two things don't point the same way." },
    ] },
    { id: 'ncp.p3', when: { tribal: true, mine: true }, turns: [
      { by: 'a', say: "If I asked you to switch to {mine}, would you?" },
      { by: 'b', say: "Are you asking?" },
      { by: 'a', say: "I'm asking." },
      { by: 'b', say: "Then I don't know. Give me until the vote." },
      { by: 'a', conf: "'I don't know' from the person you trust most is the worst answer there is." },
    ] },
    { id: 'ncp.p4', when: { tribal: true, count: true }, turns: [
      { by: 'a', say: "Everybody's going to see we voted different." },
      { by: 'b', say: "Let them." },
      { by: 'a', say: "They'll think we're over." },
      { by: 'b', say: "We're not over. We're playing. It's not the same thing." },
      { by: 'a', conf: "{b} says it's not the same thing. Out here, I'm not sure there's a difference." },
    ] },
  ],
  'couple.disagree.any': [
    { id: 'ncp.d1', turns: [
      { by: 'a', say: "I don't trust {c}." },
      { by: 'b', say: "{c} is my friend." },
      { by: 'a', say: "I know. That's why I'm telling you and not everybody else." },
      { by: 'b', say: "Well, I trust {c}." },
      { by: 'a', say: "Okay." },
      { by: 'b', say: "Okay." },
      { beat: "Neither of them says anything for a while." },
      { by: 'b', conf: "It's the first thing we've really disagreed on, and I hated how quiet it got." },
    ] },
    { id: 'ncp.d2', turns: [
      { by: 'b', say: "You were weird with {c} earlier." },
      { by: 'a', say: "Was I?" },
      { by: 'b', say: "You barely looked at {c}." },
      { by: 'a', say: "I just don't think {c} is as nice as everybody thinks." },
      { by: 'b', say: "{c} has been nothing but good to me." },
      { by: 'a', say: "Then maybe I'm wrong." },
      { by: 'a', conf: "I'm not wrong about {c}. But I'm not going to lose {b} over it either." },
    ] },
    { id: 'ncp.d3', turns: [
      { by: 'a', say: "Can you not tell {c} everything we talk about?" },
      { by: 'b', say: "I don't tell {c} everything." },
      { by: 'a', say: "You tell {c} a lot." },
      { by: 'b', say: "Because {c} is my friend, and you don't get to pick my friends." },
      { by: 'a', say: "That's not what I'm doing." },
      { by: 'b', say: "It kind of is." },
      { by: 'b', conf: "I like {a} a lot. I don't like being told who I can talk to." },
    ] },
    { id: 'ncp.d4', turns: [
      { by: 'a', say: "What do you actually see in {c}?" },
      { by: 'b', say: "What's that supposed to mean?" },
      { by: 'a', say: "Nothing. Forget it." },
      { by: 'b', say: "No, go on." },
      { by: 'a', say: "I think {c} would sell you out the first chance {c} got." },
      { by: 'b', say: "And I think you're wrong." },
      { by: 'a', conf: "We just had our first real argument, and it was about {c}. That's going to be a problem." },
    ] },
  ],
  'couple.mend.any': [
    { id: 'ncp.m1', when: { friend: true }, turns: [
      { by: 'a', say: "About {friend}. I've been thinking about what I said." },
      { by: 'b', say: "And?" },
      { by: 'a', say: "I still don't trust {friend}. But I trust you, and you trust {friend}, so I'll keep my mouth shut." },
      { by: 'b', say: "That's sort of sweet, in a really annoying way." },
      { by: 'a', conf: "I didn't change my mind about {friend}. I just decided {b} matters more than being right." },
    ] },
    { id: 'ncp.m2', when: { friend: true }, turns: [
      { by: 'b', say: "Are we okay? After the {friend} thing?" },
      { by: 'a', say: "We're okay. I was being stubborn." },
      { by: 'b', say: "We were both being stubborn." },
      { by: 'a', say: "Fine. We were both being stubborn." },
      { beat: "{b} bumps {a}'s shoulder, and {a} finally smiles." },
      { by: 'b', conf: "We fixed it. Not perfectly. But it's fixed, and that's more than most people out here manage." },
    ] },
    { id: 'ncp.m3', when: { friend: true }, turns: [
      { by: 'a', say: "I'm sorry about the {friend} stuff." },
      { by: 'b', say: "You don't have to be sorry for having an opinion." },
      { by: 'a', say: "I'm sorry for how I said it." },
      { by: 'b', say: "Okay. That I'll take." },
      { by: 'a', conf: "Saying sorry out here feels like losing. It didn't feel like losing with {b}." },
    ] },
    { id: 'ncp.m4', when: { friend: true }, turns: [
      { by: 'b', say: "{friend} asked me what your problem is." },
      { by: 'a', say: "I don't have a problem with {friend}." },
      { by: 'b', say: "I know. I told {friend} you're just slow to trust people." },
      { by: 'a', say: "That's very generous." },
      { by: 'b', say: "I'm a very generous person." },
      { by: 'a', conf: "{b} smoothed it over with {friend} for me, and I didn't even ask. That's when I knew we were okay." },
    ] },
  ],
  'couple.open.any': [
    { id: 'ncp.o1', turns: [
      { by: 'a', say: "Can I tell you something I haven't told anybody out here?" },
      { by: 'b', say: "Of course." },
      { by: 'a', say: "I'm scared I'm only still here because of you. That people keep me around because they can't get to you without getting me." },
      { by: 'b', say: "That's not true." },
      { by: 'a', say: "You don't know that." },
      { by: 'b', say: "I know I'd be a lot worse at this without you." },
      { by: 'a', conf: "I don't usually say stuff like that out loud. With {b}, it just came out." },
    ] },
    { id: 'ncp.o2', turns: [
      { by: 'a', say: "Do you ever think about what happens when one of us goes home?" },
      { by: 'b', say: "All the time." },
      { by: 'a', say: "I don't want to be the one who has to watch it." },
      { by: 'b', say: "Then let's not talk about it right now." },
      { by: 'a', conf: "{b} changes the subject when it gets real. I get it. I do it too." },
    ] },
    { id: 'ncp.o3', turns: [
      { by: 'a', say: "I'm not good at this. The relationship stuff. Back home I give everybody advice, and I've never taken any of it." },
      { by: 'b', say: "You're doing fine." },
      { by: 'a', say: "I'm doing terribly. But at least I'm doing it with you." },
      { by: 'b', conf: "Nobody's good at this out here. I'd still pick {a}." },
    ] },
    { id: 'ncp.o4', turns: [
      { by: 'a', say: "Have you noticed how everybody looks at us now? Like we're just two votes walking around together." },
      { by: 'b', say: "I mean... we kind of are two votes." },
      { by: 'a', say: "I know, I know. I just want one thing out here that isn't about the game, you know?" },
      { by: 'b', say: "Hey. This isn't about the game. Not for me, anyway." },
      { by: 'a', conf: "I believe {b}. I'm like ninety percent sure I believe {b}. And out here, ninety percent is pretty good." },
    ] },
  ],
  'couple.daily.any': [
    { id: 'ncp.y1', turns: [
      { beat: "{a} and {b} are sharing one blanket, which is far too small for two people." },
      { by: 'b', say: "You're hogging it." },
      { by: 'a', say: "You're on my half." },
      { by: 'b', say: "There are no halves. It's one blanket." },
      { by: 'a', say: "Then it's mine, and you're visiting." },
      { by: 'b', conf: "That's the most romantic thing anyone's ever said to me, and it was about a blanket." },
    ] },
    { id: 'ncp.y2', turns: [
      { by: 'a', say: "Rate my hair. Honestly." },
      { by: 'b', say: "Out of ten?" },
      { by: 'a', say: "Out of ten." },
      { by: 'b', say: "Six." },
      { by: 'a', say: "Six?" },
      { by: 'b', say: "Out here, six is a compliment." },
      { by: 'a', conf: "{b} gave me a six, and I've never been happier about a number." },
    ] },
    { id: 'ncp.y3', turns: [
      { by: 'a', say: "I saved you the good spot." },
      { by: 'b', say: "There's a good spot?" },
      { by: 'a', say: "There is now. I made it." },
      { by: 'b', say: "You made a spot." },
      { by: 'a', say: "Sit down before somebody takes it." },
      { by: 'b', conf: "{a} made me a spot. Nobody's ever made me a spot." },
    ] },
    { id: 'ncp.y4', turns: [
      { by: 'b', say: "Everybody keeps watching us." },
      { by: 'a', say: "Let them watch." },
      { by: 'b', say: "You're not even a little embarrassed?" },
      { by: 'a', say: "A little. Not enough to stop." },
      { by: 'b', conf: "I came here to win a game. I didn't think I'd spend half of it trying not to smile." },
    ] },
  ],
};
