// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/team-moments.js — staying with the team that voted you in, and a bloc inside a team
// ══════════════════════════════════════════════════════════════════════
//
// teams.js files them: the Arena winner who stays with the team that voted them in (the switch is in teams.js), a bloc
// forming inside a team. Both teams after a daily and the losers' vote talk are in team-reactions.js.
//
// Rewritten 2026-10-18 the way team-reactions.js is (the user: "it always so robotic, where's the emotion, where's the
// personality"): a voice is a different thing to say, on the turns where somebody shows who they are.

export default {
  // ── staying with the team that voted you in. a: the winner; b: their captain; c: the other team's captain; d:
  // somebody who voted them in; x: a teammate who didn't. {count}: how many of their team said the name ──
  'team-stay.statement': [
    { id: 'tsy.s1', turns: [
      { by: 'tj', say: "{a}, {count} of your own team said your name last night, and you just won. You can go back to {from}, or you can switch to {to}. Your call." },
      { by: 'a', say: "I'm staying with {from}." },
      { beat: 'Nobody on {from} knows where to look.' },
      { by: 'd', opt: 1, say: "Even after we voted you in?" },
      { by: 'a', opt: 'd', say: "Especially after that. You get to look at me every day now, {d}.",
        v: { sharp: "Especially after that. Every breakfast, {d}. Right across from you.", soft: "Especially after that, {d}. I want you to have to see me every day.", loud: "Especially after that! You're going to have to look at me every single day, {d}!" } },
      { by: 'c', opt: 1, say: "Our door was open, {a}. Remember that." },
      { by: 'x', opt: 1, say: "Welcome back. I mean that." },
      { by: 'a', conf: "Switching would've been the easy way out. Staying means the people who voted for me have to see me every day.",
        v: { dry: "I could have switched. Instead the people who voted me in get to pass me the salt for weeks. That's my revenge.", soft: "Part of me wanted to switch so badly. But I'm not letting them push me out of my own team." } },
      { by: 'x', opt: 1, conf: "That's {count} of us who said {a}'s name, and {a} came back anyway. Either {a} is really loyal, or {a} is planning something.",
        v: { sharp: "{count} of us voted {a} in, and {a} came back. Loyal, or planning something. I'll find out." } },
    ] },
    { id: 'tsy.s2', turns: [
      { by: 'tj', say: "{a}! Stay with {from}, or switch to {to}? Everybody's waiting, buddy." },
      { by: 'a', say: "I'm not switching. {from} is still my team, even after last night." },
      { by: 'b', opt: 1, say: "Thank you. I know we didn't deserve that." },
      { by: 'a', opt: 'b', say: "No, you didn't. Win the next daily and we'll call it even." },
      { by: 'c', opt: 1, say: "Your loss. We'd have been good to you." },
      { by: 'b', opt: 1, conf: "{a} could have walked over to {to} with everything we've ever talked about. {a} didn't, and I won't forget it.",
        v: { soft: "{a} knows all our plans and could have taken them to {to}. {a} came home instead. I owe {a} so much." } },
      { by: 'a', conf: "I'm not leaving my team because they panicked for one night. They're going to have to earn my trust back, though.",
        v: { sharp: "One night of panic doesn't make me leave. They still owe me, and they know it." } },
    ] },
    { id: 'tsy.s3', turns: [
      { by: 'tj', say: "{a}, your own team sent you here, and you're still standing. {from}, or {to}?" },
      { by: 'a', say: "{from}. And I want everybody who said my name to know I heard every one of them." },
      { beat: 'Somebody on {from} coughs. Nobody else moves.' },
      { by: 'd', opt: 1, say: "That's fair." },
      { by: 'a', conf: "I came back to the team that voted me in, and I told them I heard every name. Now they have to live with me knowing.",
        v: { loud: "I came back and told them I heard every name! Now they have to live with that!", dry: "I've returned to my team, with a list. They seem nervous. Good." } },
    ] },
  ],
  'team-stay.quiet': [
    { id: 'tsy.q1', turns: [
      { by: 'tj', say: "{a}, you can go back to {from} or join {to}. What's it going to be?" },
      { by: 'a', say: "{from}. I'm going back." },
      { by: 'x', opt: 1, say: "Yes! Get back over here." },
      { by: 'd', opt: 1, say: "So, no hard feelings about the vote?" },
      { by: 'a', opt: 'd', say: "Ask me again after the next one." },
      { by: 'c', opt: 1, say: "The offer stands, {a}. Any time." },
      { by: 'a', conf: "Not even half of {from} said my name. The rest have been good to me, and I'm not walking out on them over a few votes.",
        v: { soft: "Most of {from} didn't say my name. I'm not punishing them for what the others did." } },
    ] },
    { id: 'tsy.q2', turns: [
      { by: 'tj', say: "Okay, {a}, decision time. Stay, or switch to {to}?" },
      { by: 'a', say: "I'm staying. Was that even a question?" },
      { by: 'b', opt: 1, say: "That's what I like to hear. Welcome back." },
      { by: 'c', opt: 1, say: "Can't blame us for asking." },
      { by: 'a', conf: "I didn't even think about it. My team made a call, I won, and now we move on together.",
        v: { sharp: "My team made a call. I won. We move on. I didn't need to think.", soft: "It hurt that they voted me in. But they're my team. I wasn't going to leave." } },
    ] },
  ],

  // ── a bloc inside a team. a: who starts it; b, c, d: the first in ──
  'team-bloc.lost': [
    { id: 'tbl.l1', turns: [
      { by: 'a', say: "Listen. If we lose again, the vote stays inside this team again, so we need to be the ones deciding it." },
      { by: 'b', say: "You mean a group inside the team?" },
      { by: 'a', say: "{alliance}. Just us. We never vote for each other, and we decide who the team goes after." },
      { by: 'c', say: "I'm in. I'd rather be the one counting the votes than the one getting voted." },
      { by: 'a', conf: "Right now the other team isn't the danger. It's everybody on {team} who isn't in {alliance}.",
        v: { dry: "The other team is the least of my worries. My actual problem is everybody on {team} outside {alliance}, and they sleep in the next bunk." } },
    ] },
    { id: 'tbl.l2', turns: [
      { beat: '{a}, {b} and {c} stay at the table after everybody else has gone to bed.' },
      { by: 'a', say: "We lost, and one of us gets voted in tomorrow unless we decide who first." },
      { by: 'b', say: "So we decide." },
      { by: 'a', say: "We decide every time. The three of us. Call it {alliance}." },
      { by: 'c', say: "And nobody else on {team} knows." },
      { by: 'b', conf: "We lost the daily, and an hour later I was in an alliance. This place moves fast when you're scared.",
        v: { soft: "I've never joined anything so quickly. I think we were all just scared of being the name." } },
    ] },
  ],
  'team-bloc.won': [
    { id: 'tbl.w1', turns: [
      { by: 'a', say: "We're winning right now, but it won't last. When we lose, I want to already know where my votes are." },
      { by: 'b', say: "So, us." },
      { by: 'a', say: "{alliance}. We stick together, and when that day comes, we vote together." },
      { by: 'c', say: "Planning for a loss we haven't even had yet. I like it." },
      { by: 'a', conf: "Every winning team thinks it's safe. When we lose one, I'll already have a plan, and everybody else will be scrambling.",
        v: { dry: "We keep winning, so nobody on my team is thinking about the vote. Except me. I've been thinking about nothing else." } },
    ] },
    { id: 'tbl.w2', turns: [
      { by: 'a', say: "Can I ask you two something, while everybody's happy?" },
      { by: 'b', say: "That sounds like a trick." },
      { by: 'a', say: "The day this team loses, I want to know I've got the two of you." },
      { by: 'c', say: "You've got me." },
      { by: 'b', say: "And me. What are we calling it?" },
      { by: 'a', say: "{alliance}." },
      { by: 'c', conf: "Everybody else was celebrating, and {a} was building an alliance in the corner. I'm glad I was in the corner.",
        v: { sharp: "Everybody partied. {a} recruited. I'm glad I got recruited." } },
    ] },
  ],
};
