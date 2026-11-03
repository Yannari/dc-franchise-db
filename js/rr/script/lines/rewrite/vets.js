// Veterans, whatever the team is now (rr/past.js; the user, 2026-11-03: "how can i make them reference their show while
// their relationship is not reality tv"). Facts: aVet / bVet (been on a show), aBest ('won', 'final'), metOn (what a and
// b were to each other on a show both were on), pastX (a and c were on one together: 'ahead', 'behind', 'even').
// Slots: {show} a's last show, {showB} b's, {showX} the one a and c were on together. A line that names a slot airs only
// where the slot is there (write.js needs), and every entry here is gated on the fact that makes it true.
export default {
  retire: [],
  pools: {
    // ── interviews: how they know each other, why they're here ──
    'int-backstory.how-we-met': [
      { id: 'vet.hm1', when: { metOn: 'showmance' }, turns: [
        { by: 'a', conf: "We met on {show}. You might have seen it. A lot of people saw it." },
        { by: 'b', conf: "We were a couple on that show before we really knew each other." },
        { by: 'a', conf: "And now we're doing this. Together. Voluntarily." },
      ] },
      { id: 'vet.hm2', when: { metOn: ['cast', 'allies'] }, turns: [
        { by: 'a', conf: "We were on {show} together. Same season." },
        { by: 'b', conf: "We didn't think we'd ever see each other again after that." },
        { by: 'a', conf: "And then this came up, and there was only one person I wanted to call." },
      ] },
      { id: 'vet.hm3', when: { metOn: 'rivals' }, turns: [
        { by: 'a', conf: "We were on {show} together, and we did not get along. At all." },
        { by: 'b', conf: "That's a nice way of putting it." },
        { by: 'a', conf: "We're on the same side this time. We'll see how long that lasts." },
      ] },
    ],
    'int-backstory.why-we-race': [
      { id: 'vet.wr1', when: { aVet: true, bVet: false }, turns: [
        { by: 'a', conf: "I've been on {show}, so I know what this is like. Kind of. Not the running part." },
        { by: 'b', conf: "I've never done anything like this. I've watched {a.obj} on television, and that's it." },
        { by: 'a', conf: "That's why I wanted to bring {b.obj}. I wanted somebody who'd see it all for the first time." },
      ] },
      { id: 'vet.wr2', when: { aBest: 'won' }, turns: [
        { by: 'a', conf: "I won {show}. People keep asking why I'd risk that, doing another one." },
        { by: 'a', conf: "Honestly? I miss it. I miss having something to win." },
        { by: 'b', conf: "{a.Sub} talks about {show} every single day. This was always going to happen." },
      ] },
      { id: 'vet.wr3', when: { aVet: true, bVet: true }, turns: [
        { by: 'a', conf: "I did {show}. {b} did {showB}. We've both been on television before." },
        { by: 'b', conf: "Which means we both know how this goes. You run, you cry, and they film it." },
        { by: 'a', conf: "This time we'd like to win." },
      ] },
    ],

    // ── the partners ──
    'plan-the-leg.strategy': [
      { id: 'vet.pl1', when: { aVet: true }, turns: [
        { by: 'a', say: "Okay. On {show}, what I learned is that the first hour decides everything." },
        { by: 'b', say: "This isn't {show}, though." },
        { by: 'a', say: "No, but people are people. They panic early, and we don't." },
        { by: 'b', say: "So what's the plan?" },
        { by: 'a', say: "We stay calm, we read everything twice, and we let them make the mistakes." },
        { by: 'b', say: "Fine. That actually sounds smart." },
      ] },
      { id: 'vet.pl2', when: { aVet: true }, turns: [
        { by: 'a', say: "Can I say something I learned the hard way on {show}?" },
        { by: 'b', say: "Go on." },
        { by: 'a', say: "Don't make friends with the team you'll need to beat at the end." },
        { by: 'b', say: "That's a bit cold." },
        { by: 'a', say: "It's honest. I got too close to people last time, and it cost me." },
        { by: 'b', say: "Okay. We'll be friendly. Just not too friendly." },
      ] },
    ],
    'pep-talk.works': [
      { id: 'vet.pt1', when: { aVet: true, bVet: false }, turns: [
        { by: 'b', say: "I don't know if I can do this." },
        { by: 'a', say: "Listen to me. On {show}, I felt exactly like this, every single day." },
        { by: 'b', say: "And?" },
        { by: 'a', say: "And I got through it, and so will you. You just keep going one step at a time." },
        { by: 'b', say: "Okay. One step." },
        { by: 'b', conf: "{a.Sub}'s done this before. If {a.sub} says I can do it, I'm going to believe {a.obj}." },
      ] },
      { id: 'vet.pt2', when: { aVet: true, bVet: false }, turns: [
        { by: 'a', say: "Hey. Look at me. Everybody struggles. I struggled on {show} more than anybody." },
        { by: 'b', say: "You did not." },
        { by: 'a', say: "I did. Watch it back sometime. It's not pretty." },
        { by: 'b', say: "That actually helps a little." },
        { by: 'a', say: "Good. Now try again." },
        { by: 'b', conf: "I don't know if that was true, but it worked." },
      ] },
    ],
    'bond-moment.memory': [
      { id: 'vet.bm1', when: { metOn: ['showmance', 'allies', 'cast'] }, turns: [
        { by: 'a', say: "Do you remember the first day of {show}?" },
        { by: 'b', say: "I remember you not saying a single word to me." },
        { by: 'a', say: "I was nervous." },
        { by: 'b', say: "You were rude." },
        { by: 'a', say: "Nervous and rude. Look at us now, though." },
        { by: 'b', say: "Look at us now." },
      ] },
      { id: 'vet.bm2', when: { metOn: ['showmance', 'allies', 'cast'] }, turns: [
        { by: 'b', say: "Is it weird that this feels a bit like {show}?" },
        { by: 'a', say: "Not weird. Same cameras, same no sleep." },
        { by: 'b', say: "Same you." },
        { by: 'a', say: "Same me. A little better at it, I hope." },
        { by: 'b', say: "A little." },
        { by: 'a', conf: "We went through {show} together. Nobody else really gets what that was like, except {b}." },
      ] },
    ],

    // ── two teams who were on a show together ──
    'small-talk.click': [
      { id: 'vet.sc1', when: { pastX: ['ahead', 'behind', 'even'] }, turns: [
        { by: 'a', say: "Wait. We were on {showX} together." },
        { by: 'c', say: "We were! I didn't know if you'd remember me." },
        { by: 'a', say: "Of course I remember you. How have you been?" },
        { by: 'c', say: "Better than on {showX}, that's for sure." },
        { by: 'b', say: "You two know each other?" },
        { by: 'a', say: "From a long time ago. It's a whole thing." },
      ] },
      { id: 'vet.sc2', when: { pastX: ['ahead', 'behind', 'even'] }, turns: [
        { by: 'c', say: "Is this a {showX} reunion now?" },
        { by: 'a', say: "Looks like it. It's good to see a face I know." },
        { by: 'c', say: "Same. Everybody else here is a stranger." },
        { by: 'a', say: "Good luck out there. I mean it." },
        { by: 'c', say: "You too. Mostly." },
        { by: 'b', conf: "Apparently they were on television together. I've been told nothing else." },
      ] },
    ],
    'trash-talk.exchange': [
      { id: 'vet.tt1', when: { pastX: 'ahead' }, turns: [
        { by: 'a', say: "I lasted longer than you on {showX}, if I remember right." },
        { by: 'c', say: "You remember wrong." },
        { by: 'a', say: "I remember perfectly. I was there when you left." },
        { by: 'c', say: "This isn't {showX}." },
        { by: 'a', say: "No. But I'd still put money on the same ending." },
        { by: 'c', conf: "{a} has been waiting all race to bring that up. I'd like to send {a.obj} home first, just this once." },
      ] },
      { id: 'vet.tt2', when: { pastX: 'behind' }, turns: [
        { by: 'c', say: "Didn't you go out before me on {showX}?" },
        { by: 'a', say: "That was a long time ago." },
        { by: 'c', say: "Not that long." },
        { by: 'a', say: "This is a different show, with different rules. Watch me this time." },
        { by: 'c', say: "I'll be watching from the front." },
        { by: 'a', conf: "{c} beat me once. That's not going to happen twice." },
      ] },
    ],
  },
};
