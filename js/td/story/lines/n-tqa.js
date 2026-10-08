// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-tqa.js — the host's questions at the vote, about what happened today
// ══════════════════════════════════════════════════════════════════════
//
// td/story/tribal.js tribalQA (header there). h is the host, a the one asked, b who cuts in.
//   tqa.fight.any      a and b had it out at camp today, in front of everybody. aVoted: 'b' when a
//                      is writing b's name tonight (a never says so)
//   tqa.scramble.any   a is going home and knows it; a goes after {target}, the name a wants instead
//   tqa.confident.any  a is going home and has no idea; b is writing a's name (close: they're friends)
//   tqa.sank.any       a cost the team the challenge; b cuts in (defends: b likes a)
//   tqa.leader.any     a is running tonight's plan; b is on the side that's losing
//   tqa.burned.any     a's plan failed at the last vote, when {lastBoot} went home
//   tqa.pair.any       a and b always seem to vote together
// Nobody says how they're voting. Nobody says what they couldn't know.
// Ids: 'ntq.'.

export default {
  'tqa.fight.any': [
    { id: 'ntq.f1', turns: [
      { by: 'h', say: "So, {a} and {b}, I heard it got pretty loud between you two today." },
      { by: 'a', say: "It wasn't a big deal.", v: { loud: "Oh, it was a big deal. I meant every word.", warm: "It got out of hand. I feel bad about it, honestly.", schemer: "People get tired and things get said, but it's handled." } },
      { by: 'b', say: "It was a big deal to me.", v: { tough: "You don't get to decide that, {a}.", quiet: "...It was a big deal." } },
      { by: 'h', say: "{b}, does that change how you vote tonight?" },
      { by: 'b', say: "It changes how I sleep tonight. I'll let you figure out the rest." },
    ] },
    { id: 'ntq.f2', turns: [
      { by: 'h', say: "{a}, the cameras caught your little speech at camp today. Want to tell everybody what you said?" },
      { by: 'a', say: "Everybody was there. They know what I said." },
      { by: 'h', say: "Do you regret it?" },
      { by: 'a', say: "Maybe the way I said it. Not what I said.", v: { cruel: "No. Next question.", emotional: "Yes, okay? Yes, I've felt sick about it all afternoon." } },
      { by: 'b', say: "That's the closest thing to an apology I'm going to get, isn't it?" },
    ] },
    { id: 'ntq.f3', when: { aVoted: 'b' }, turns: [
      { by: 'h', say: "{a}, after today, is it fair to say you and {b} aren't friends?" },
      { by: 'a', say: "We're not enemies. We just don't see things the same way.", v: { blunt: "Fair to say, yeah." } },
      { by: 'b', say: "That's a nice way of putting it." },
      { by: 'h', say: "Is it the true way?" },
      { by: 'a', say: "You'll see when you read the votes." },
    ] },
  ],
  'tqa.scramble.any': [
    { id: 'ntq.s1', turns: [
      { by: 'h', say: "{a}, you look like somebody who's been running around all afternoon." },
      { by: 'a', say: "Because I have been. I know my name is out there tonight, and I'm not going to sit here and pretend it isn't.", v: { anxious: "I have. I know my name's out there, and I'm terrified, and I'm not going to pretend I'm not.", tough: "I know my name's out there. I'm not hiding from it." } },
      { by: 'h', say: "So who should go instead?" },
      { by: 'a', say: "{target}. {target} has been playing everybody here, and if you keep {target} tonight, you're next." },
      { by: 'b', say: "Wow. Okay, that's what we're doing?", v: { cruel: "That's adorable. Keep going.", calm: "I'm not going to argue. People can decide for themselves." } },
    ] },
    { id: 'ntq.s2', turns: [
      { by: 'h', say: "{a}, if you could say one thing to this tribe before they vote, what would it be?" },
      { by: 'a', say: "That I'm not the one you should be worried about. Look at who's been in every conversation today, and it isn't me." },
      { by: 'h', say: "Who is it?" },
      { by: 'a', say: "Ask {target} where {target} was all afternoon." },
      { by: 'b', say: "I was at camp. Like everybody else.", v: { anxious: "I was at camp! I was literally at camp!" } },
    ] },
  ],
  'tqa.confident.any': [
    { id: 'ntq.c1', turns: [
      { by: 'h', say: "{a}, how are you feeling tonight?" },
      { by: 'a', say: "Honestly? Pretty good, I think I know where I stand.", v: { anxious: "Better than I thought I would. I think I'm okay tonight.", loud: "Great, never better! Can we just vote?", dry: "Hungry, mostly. But safe, I think." } },
      { by: 'h', say: "{b}, does {a} know where {a.sub} stands?" },
      { beat: "{b} looks down at the fire for a second too long." },
      { by: 'b', say: "I think we all feel pretty good tonight.", v: { warm: "I hope everybody here feels okay tonight. I really do." } },
    ] },
    { id: 'ntq.c2', when: { close: true }, turns: [
      { by: 'h', say: "{a}, who's got your back out here?" },
      { by: 'a', say: "{b}, for sure. Since day one." },
      { by: 'h', say: "{b}, is that true?" },
      { by: 'b', say: "{a} knows how I feel about {a.obj}.", v: { emotional: "...Yeah. {a} knows I care about {a.obj}." } },
      { beat: "{a} smiles. {b} doesn't." },
    ] },
  ],
  'tqa.sank.any': [
    { id: 'ntq.k1', when: { defends: true }, turns: [
      { by: 'h', say: "{a}, the challenge today. What happened?" },
      { by: 'a', say: "I messed up, I know I messed up, and I don't need anybody to tell me.", v: { tough: "I had a bad day. It happens.", anxious: "I froze. I just froze, and I'm so sorry, everybody." } },
      { by: 'b', say: "We all messed up. It wasn't only {a}." },
      { by: 'h', say: "Interesting, {b} is defending you, {a}. Should that make you feel better or worse?" },
      { by: 'a', say: "Better, I think. Ask me after the votes." },
    ] },
    { id: 'ntq.k2', when: { defends: false }, turns: [
      { by: 'h', say: "{b}, if you had to name one reason your tribe lost today?" },
      { by: 'b', say: "I'm not going to name anybody.", v: { blunt: "We all saw who struggled. I don't have to say it.", cruel: "Do I have to say it, or can I just look at {a}?" } },
      { by: 'a', say: "Just say it. Everybody's thinking it." },
      { by: 'b', say: "Fine. You had a rough one, {a}." },
      { by: 'a', say: "I know. And tomorrow I won't." },
    ] },
  ],
  'tqa.leader.any': [
    { id: 'ntq.l1', turns: [
      { by: 'h', say: "{a}, there's a rumour you've been running things around here. Any truth to that?" },
      { by: 'a', say: "Running things? No, I talk to people, and that's not a crime.", v: { schemer: "I just listen a lot. People mistake that for running things.", bossy: "Somebody has to make decisions. If that's running things, then sure." } },
      { by: 'b', say: "You talk to people a lot. Like, a lot." },
      { by: 'a', say: "So do you, {b}." },
      { by: 'h', say: "Ooh. I love it when you guys get honest." },
    ] },
    { id: 'ntq.l2', turns: [
      { by: 'h', say: "{b}, who's the most dangerous person sitting here?" },
      { by: 'b', say: "{a}. And I think {a} knows it." },
      { by: 'a', say: "Dangerous? I'm just sitting here.", v: { calm: "I'll take that as a compliment, {b}.", anxious: "Me? I'm the least dangerous person here, look at me!" } },
      { by: 'h', say: "You didn't deny it." },
      { by: 'a', say: "I didn't think I had to." },
    ] },
  ],
  'tqa.burned.any': [
    { id: 'ntq.b1', turns: [
      { by: 'h', say: "{a}, last time you were here, you didn't see {lastBoot} going home. Are you seeing it coming tonight?" },
      { by: 'a', say: "I'd like to think I learned something.", v: { tough: "I got caught once. It won't happen again.", anxious: "I hope so. I really, really hope so." } },
      { by: 'h', say: "Do you trust the people around you?" },
      { by: 'a', say: "I trust them about as much as they trust me, and I think that's the honest answer for everybody here." },
    ] },
    { id: 'ntq.b2', turns: [
      { by: 'h', say: "{a}, you were on the wrong side of the {lastBoot} vote. How did that feel?" },
      { by: 'a', say: "Like getting punched in the stomach. I didn't sleep that night.", v: { dry: "Fantastic, ten out of ten, would recommend.", schemer: "Educational. I found out a lot about a lot of people." } },
      { by: 'h', say: "And are you on the right side tonight?" },
      { by: 'a', say: "Ask me in ten minutes." },
    ] },
  ],
  'tqa.pair.any': [
    { id: 'ntq.p1', turns: [
      { by: 'h', say: "{a} and {b}, you two are always together. Are you a voting bloc?" },
      { by: 'a', say: "We're friends. Is that allowed?", v: { schemer: "We're friends. Friends sometimes agree on things." } },
      { by: 'b', say: "We don't even agree on what to have for breakfast.", v: { goofy: "We don't even agree on which side of the shelter is the front." } },
      { by: 'h', say: "That's not a no." },
      { by: 'a', say: "It's not a yes either." },
    ] },
    { id: 'ntq.p2', turns: [
      { by: 'h', say: "{b}, if {a} went home tonight, what would you do?" },
      { by: 'b', say: "Honestly? I'd be lost.", v: { tough: "I'd be angry, really angry, at a lot of people." } },
      { by: 'a', say: "Well, now everybody knows you'd be lost, so thanks for that." },
      { by: 'b', say: "Sorry! He asked!" },
    ] },
  ],
};
