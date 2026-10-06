// ══════════════════════════════════════════════════════════════════════
// td/script/lines/threat.js — the one who keeps winning, and who has noticed
// ══════════════════════════════════════════════════════════════════════
//
// threat.self.<ending>   — {a}, who keeps doing well in challenges, to the camera.
// threat.notice.<ending> — {a}, a strategist, to the camera about {b}, the threat.
// ending 'wins': {count} individual wins now; 'podiums': {count} top finishes;
// 'merge': at the merge, {count} top finishes before it (and {wins} wins, when
// there were any). Ids: 'th.'.
const SELF_WINS = [
  { id: 'th.w1', turns: [
    { by: 'a', conf: "That's {count} wins. I'm not going to pretend I'm not proud of that." },
    { by: 'a', conf: "I'm also not going to pretend it doesn't put a target on my back." },
  ] },
  { id: 'th.w2', turns: [
    { by: 'a', conf: "Winning feels amazing. Until you get back to camp and everyone's looking at you funny." },
  ] },
  { id: 'th.w3', turns: [
    { by: 'a', conf: "Every time I win, I can see people doing the maths in their heads. Fine. Let them do maths. I'll keep winning." },
  ] },
  { id: 'th.w4', when: { register: 'competitor' }, turns: [
    { by: 'a', conf: "{count} wins. People keep telling me to lose one on purpose. Not happening." },
  ] },
  { id: 'th.w5', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "I didn't think I'd win anything out here. Now I've won {count}. It's kind of scary, honestly." },
  ] },
  { id: 'th.w6', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "Let them be scared of my challenge wins. While they're watching my wins, they're not watching my game." },
  ] },
];
const SELF_PODIUMS = [
  { id: 'th.p1', turns: [
    { by: 'a', conf: "I keep finishing near the top. Not first, but near it. Every time." },
    { by: 'a', conf: "That's the sweet spot. Good enough to be useful, not scary enough to be a target. I hope." },
  ] },
  { id: 'th.p2', turns: [
    { by: 'a', conf: "{count} top finishes. Nobody's said anything yet. But I've noticed people noticing." },
  ] },
  { id: 'th.p3', turns: [
    { by: 'a', conf: "I'm consistent. That's my thing. I just hope consistent doesn't become dangerous." },
  ] },
  { id: 'th.p4', when: { register: 'competitor' }, turns: [
    { by: 'a', conf: "Near the top isn't the top. Next time, I'm winning the whole thing." },
  ] },
  { id: 'th.p5', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "I'm doing well in challenges, quietly. I'd like to keep the 'quietly' part going as long as possible." },
  ] },
  { id: 'th.p6', turns: [
    { by: 'a', conf: "I don't go looking for attention in challenges. It just keeps finding me." },
  ] },
  { id: 'th.p7', turns: [
    { by: 'a', conf: "I'm pulling my weight in challenges. More than pulling it, actually." },
    { by: 'a', conf: "I just hope that's what people remember, and not that I'm hard to beat." },
  ] },
  { id: 'th.p8', when: { merged: false }, turns: [
    { by: 'a', conf: "Every time we win, I'm part of it. That should keep me safe. Should." },
  ] },
  { id: 'th.p9', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "I keep carrying people in challenges, and then they whisper about me at camp? Unbelievable." },
  ] },
];
const SELF_MERGE = [
  { id: 'th.m1', turns: [
    { by: 'a', conf: "I was great in the team challenges. {count} top finishes. Now there are no teams, and that makes me a target." },
  ] },
  { id: 'th.m2', when: { wins: true }, turns: [
    { by: 'a', conf: "I won {wins} before the merge. Everybody knows it. I can feel them looking at me." },
  ] },
  { id: 'th.m3', turns: [
    { by: 'a', conf: "Before the merge, being strong kept my team safe. Now it just makes everyone nervous." },
  ] },
  { id: 'th.m4', when: { register: 'competitor' }, turns: [
    { by: 'a', conf: "Now it's every person for themselves. Good. That's how I like it." },
    { by: 'a', conf: "Now I just have to win immunity every single time. No pressure." },
  ] },
  { id: 'th.m5', turns: [
    { by: 'a', conf: "Everybody here walked into the merge knowing my name. I'd rather they didn't." },
  ] },
  { id: 'th.m6', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "I know I'm a challenge threat. So I'm going to need a bigger threat standing in front of me. Time to find one." },
  ] },
];
const NOTICE_WINS = [
  { id: 'th.n1', turns: [
    { by: 'a', conf: "{b} has won {count} challenges now. That's not luck. That's a problem." },
  ] },
  { id: 'th.n2', turns: [
    { by: 'a', conf: "Everyone's clapping for {b}. I'm clapping too. And I'm thinking about how to get rid of {b.obj}." },
  ] },
  { id: 'th.n3', turns: [
    { by: 'a', conf: "If {b} keeps winning, {b} wins the whole game. Somebody has to stop that. Probably me." },
  ] },
  { id: 'th.n4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{b} is the strongest person here. Which means {b} is the most useful person to get rid of." },
  ] },
  { id: 'th.n5', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "Another win for {b}? Seriously? Somebody take {b} out before {b} takes all of us out!" },
  ] },
  { id: 'th.n6', turns: [
    { by: 'a', conf: "I'm not going to say anything yet. But {b}'s name just went to the top of my list." },
  ] },
];
const NOTICE_PODIUMS = [
  { id: 'th.q1', turns: [
    { by: 'a', conf: "{b} keeps finishing near the top. Quietly. Nobody's talking about it. I am." },
  ] },
  { id: 'th.q2', turns: [
    { by: 'a', conf: "{count} top finishes for {b}. Not scary yet. But give it a week." },
  ] },
  { id: 'th.q3', turns: [
    { by: 'a', conf: "{b} isn't loud about it. {b} just keeps doing well. That's the dangerous kind." },
  ] },
  { id: 'th.q4', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "I keep track of who finishes where. {b} is always near the top. Always." },
  ] },
  { id: 'th.q5', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{b} is a quiet threat. Quiet threats are the easiest ones to vote out, as long as you do it early." },
  ] },
  { id: 'th.q6', turns: [
    { by: 'a', conf: "Nobody's worried about {b} yet. That's exactly why I am." },
  ] },
  { id: 'th.q7', turns: [
    { by: 'a', conf: "I've been watching the challenges closely. {b} keeps showing up. I don't like it." },
  ] },
  { id: 'th.q8', when: { merged: false }, turns: [
    { by: 'a', conf: "{b} is great for the team right now. But one day there won't be a team, and then {b} is a problem." },
  ] },
  { id: 'th.q9', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "Does {b} ever have a bad day? Seriously? Ever?" },
  ] },
];
const NOTICE_MERGE = [
  { id: 'th.r1', turns: [
    { by: 'a', conf: "{b} was one of the best in the team challenges. {count} top finishes. Now there are no teams to hide behind." },
  ] },
  { id: 'th.r2', when: { wins: true }, turns: [
    { by: 'a', conf: "{b} won {wins} before the merge. If we don't do something, {b} wins immunity every week." },
  ] },
  { id: 'th.r3', turns: [
    { by: 'a', conf: "Everybody's saying hi to everybody. I'm counting. And the first name I count is {b}." },
  ] },
  { id: 'th.r4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{b} kept {b.posAdj} team alive. Very noble. Now {b} has to go before {b} keeps {b.ref} alive." },
  ] },
  { id: 'th.r5', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "The merge is here, and {b} is still walking around like {b} owns the place. Not for long." },
  ] },
  { id: 'th.r6', turns: [
    { by: 'a', conf: "If I had to bet on who wins this game right now, it's {b}. So {b} can't be here much longer." },
  ] },
];

export default {
  'threat.self.wins': SELF_WINS,
  'threat.self.podiums': SELF_PODIUMS,
  'threat.self.merge': SELF_MERGE,
  'threat.notice.wins': NOTICE_WINS,
  'threat.notice.podiums': NOTICE_PODIUMS,
  'threat.notice.merge': NOTICE_MERGE,
};
