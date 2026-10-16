// More scenes for more than two (the user, 2026-10-16: "we need more 3+ people conversation"). The moments the
// house lives through together: an Arena winner walking back in, the morning after somebody leaves, TJ's list read
// out, half a bank changing hands in front of the stand; and a second group version of the public scenes that come
// up most. x and y are whoever else is there (a voter or a friend, a mourner or not): their lines say what anybody
// in the room could say. Every entry needs a crowd (facts.js crowd: x is there); y is optional.
const C = { crowd: true };
export default {
  // ── an Arena winner walks back in: a is back; b said a's name; {gone} is the one a beat ──
  'return.faced': [
    { id: 'cw2.rf1', when: C, turns: [
      { beat: 'The door opens, and the whole living room goes quiet. {a} is back.' },
      { by: 'x', say: "Well. Look who it is." },
      { by: 'a', say: "Surprised? Some of you look surprised." },
      { by: 'b', say: "Welcome back, {a}. Congratulations." },
      { by: 'a', say: "Thank you, {b}. That's very big of you, considering." },
      { by: 'y', opt: 1, say: "Okay, it's going to be one of those weeks." },
      { by: 'x', say: "{gone} put up a real fight, though." },
      { by: 'a', say: "{gone} did. I just fought harder. Everybody let that sink in." },
      { by: 'b', conf: "I said {a}'s name, and now I have to sit across from {a} at dinner. The whole room was watching to see how I'd take it." },
    ] },
    { id: 'cw2.rf2', when: C, turns: [
      { beat: '{a} walks into the kitchen, still in the Arena clothes, and pours a glass of water like nothing happened.' },
      { by: 'x', say: "Are we not going to talk about it?" },
      { by: 'a', say: "Talk about what? I went to work. I came home." },
      { by: 'b', say: "You know what we mean." },
      { by: 'a', say: "You mean you said my name and it didn't work. I know. I was there." },
      { by: 'y', opt: 1, say: "This is so awkward. I'm going to go stand somewhere else." },
      { by: 'x', say: "For what it's worth, that was a good win." },
      { by: 'a', say: "It was. Remember it the next time somebody asks you for my name." },
      { by: 'a', conf: "I didn't yell, I didn't gloat. I drank my water and let the whole kitchen do the math." },
    ] },
  ],
  'return.quiet': [
    { id: 'cw2.rq1', when: C, turns: [
      { beat: '{a} comes back through the door, and the people closest jump up off the sofa.' },
      { by: 'x', say: "You did it! You actually did it!" },
      { by: 'a', say: "I did it. I can't feel my arms, but I did it." },
      { by: 'y', opt: 1, say: "Sit down before you fall down. I'll get you some ice." },
      { by: 'x', say: "I couldn't watch the end. I had my hands over my face." },
      { by: 'a', say: "You missed the best part, then." },
      { by: 'a', conf: "Walking back in and seeing people actually happy to see me? That's the part nobody tells you about. That's better than winning." },
    ] },
  ],
  // ── the morning after: a and b miss {gone}; x is somebody else in the kitchen ──
  'morning-after.mourning': [
    { id: 'cw2.mm1', when: C, turns: [
      { beat: 'Breakfast. Somebody has made coffee for the whole house, and nobody is drinking it.' },
      { by: 'a', say: "It's too quiet without {gone}. The kitchen feels wrong." },
      { by: 'b', say: "I keep looking at the door." },
      { by: 'x', say: "Do you two want me to leave you alone for a bit?" },
      { by: 'a', say: "No. Stay. It's better with people around." },
      { by: 'y', opt: 1, say: "I'll make some eggs. Everybody needs to eat something." },
      { by: 'b', say: "{gone} would make fun of us for being this sad over breakfast." },
      { by: 'a', conf: "The whole house was quiet this morning. Some of them were sad. Some of them were just being polite. I could tell which was which." },
    ] },
    { id: 'cw2.mm2', when: { crowd: true, how: 'calledout' }, turns: [
      { beat: 'The morning after the Arena, a few of them sit out on the deck with their coffee.' },
      { by: 'a', say: "{gone} wasn't even voted in. {caller} just decided." },
      { by: 'b', say: "I know. That's what makes it so hard." },
      { by: 'x', say: "That's how the Arena works, though. Whoever goes in gets to pick." },
      { by: 'a', say: "I know how it works. I'm still allowed to hate it." },
      { by: 'y', opt: 1, say: "{caller} is inside, by the way. In case anybody's planning anything." },
      { by: 'b', say: "Nobody's planning anything. Yet." },
      { by: 'b', conf: "Everybody on that deck heard us. By lunch, {caller} is going to know exactly how we feel." },
    ] },
  ],
  // ── TJ's list: a is at the top, b at the bottom; x and y heard it with them ──
  'power-rankings.any': [
    { id: 'cw2.pr1', when: C, turns: [
      { beat: 'TJ leaves, and the screen with his list stays on. Nobody moves.' },
      { by: 'x', say: "So is anybody going to say it, or should I?" },
      { by: 'a', say: "Say what? It's a list." },
      { by: 'x', say: "It's a list with your name at the top, {a}. That's a target." },
      { by: 'b', say: "And mine at the bottom. Which is somehow also a target." },
      { by: 'y', opt: 1, say: "The middle is looking really comfortable right now." },
      { by: 'a', say: "Everybody stop looking at me. I didn't write it." },
      { by: 'b', conf: "Everybody in that room read the list and did the math. Top gets voted in because they're dangerous. Bottom gets voted in because it's easy. I'm the easy one." },
    ] },
  ],
  // ── half a bank changes hands in front of the stand: a won it, b lost it ──
  'bank-taken.any': [
    { id: 'cw2.bt1', when: C, turns: [
      { by: 'tj', say: "{a}, you won. You know the rule. Half of {b}'s bank is yours: {amount}." },
      { by: 'x', say: "Oh, that hurts." },
      { by: 'b', say: "Take it. You earned it." },
      { by: 'a', say: "I'm sorry, {b}. I really am." },
      { by: 'y', opt: 1, say: "Don't be sorry. Buy everybody dinner." },
      { by: 'x', say: "I'd be happy for you if I wasn't so sad for {b}." },
      { by: 'b', conf: "Losing the Arena is bad enough. Watching my money go to {a} with the whole house in the stand is worse." },
    ] },
  ],

  // ── a second group version of the public scenes that come up most ──
  'leverage-threat.credible': [
    { id: 'cw2.lc2', when: C, turns: [
      { beat: 'On the deck, a few of them are lying in the sun when {a} sits up and points at {b}.' },
      { by: 'a', say: "Everybody, a little announcement. If they put me in this week, it's {b}." },
      { by: 'b', say: "Why are you telling everybody?" },
      { by: 'a', say: "So nobody can say they didn't know." },
      { by: 'x', say: "That's terrifying. I love it." },
      { by: 'y', opt: 1, say: "I'm just glad it isn't my name." },
      { by: 'b', say: "Fine. Then I guess I'd better make sure you don't go in." },
      { by: 'b', conf: "{a} said it out loud on purpose. Now my vote isn't just a vote. It's a fight I'd have to finish." },
    ] },
  ],
  'receipts.owns': [
    { id: 'cw2.ro2', when: C, turns: [
      { beat: 'At dinner, {a} sets down a fork and looks across at {b}.' },
      { by: 'a', say: "Can I ask you something in front of everybody?" },
      { by: 'b', say: "You're going to anyway." },
      { by: 'a', say: "Why my name? At the vote. Why me?" },
      { by: 'b', say: "Because I thought you were the right name. I still do." },
      { by: 'x', say: "Wow. No sugarcoating at all." },
      { by: 'y', opt: 1, say: "Can somebody pass the salt? I need something to do with my hands." },
      { by: 'a', say: "Okay. Now I know." },
      { by: 'a', conf: "{b} looked me in the eye and said it again, with the whole table listening. At least I'm not guessing any more." },
    ] },
  ],
  'receipts.denies': [
    { id: 'cw2.rd2', when: C, turns: [
      { beat: '{a} finds {b} by the bar with two other people.' },
      { by: 'a', say: "Can I borrow {b} for a second? Actually, no. You can all hear this." },
      { by: 'x', say: "Uh oh." },
      { by: 'a', say: "You said my name at the vote. I'd like to hear why." },
      { by: 'b', say: "It was a vote, {a}. Everybody says somebody's name. It's not personal." },
      { by: 'a', say: "It's my name. It's personal." },
      { by: 'y', opt: 1, say: "I'm going to get another drink. A big one." },
      { by: 'a', conf: "{b} acted like it was nothing in front of everybody. That's how I know it was something." },
    ] },
  ],
  'party-callout.firesback': [
    { id: 'cw2.pf2', when: C, turns: [
      { beat: 'Half the house is on the dance floor when {a} stops dancing.' },
      { by: 'a', say: "{b}! You want to know what everybody here thinks of you?" },
      { by: 'x', say: "Nope. Nope. Not doing this." },
      { by: 'b', say: "Go on. Tell me. I can't wait." },
      { by: 'a', say: "Nobody trusts you. Not one person on this dance floor." },
      { by: 'b', say: "And you're the one shouting it at a club. Who do you think they trust less?" },
      { by: 'y', opt: 1, say: "Can we turn the music back up?" },
      { by: 'x', conf: "I have never wanted to leave a dance floor so badly in my life." },
    ] },
  ],
  'trash-talk.bites': [
    { id: 'cw2.tb2', when: C, turns: [
      { beat: 'A few of them are in the gym when {a} starts on {b}.' },
      { by: 'a', say: "Lift all you want, {b}. It won't help." },
      { by: 'x', say: "Can you not, {a}? Some of us are trying to work out." },
      { by: 'a', say: "And {b} is already losing." },
      { by: 'b', say: "Can you leave me alone for one morning?" },
      { by: 'y', opt: 1, say: "{b}, ignore it. That's what {a} wants." },
      { by: 'b', conf: "I tried to ignore it. I couldn't. And everybody standing there watched me not be able to." },
    ] },
  ],
  'trash-talk.shrugs': [
    { id: 'cw2.ts2', when: C, turns: [
      { beat: 'At lunch, {a} leans back and says it to the whole table.' },
      { by: 'a', say: "Let's be real, if {b} is in the final, it's because somebody carried {b} there." },
      { by: 'x', say: "That's rough." },
      { by: 'b', say: "If I'm in the final, you'll be watching it from home, so I don't really care what you think." },
      { by: 'y', opt: 1, say: "Okay, that was good." },
      { by: 'a', say: "We'll see." },
      { by: 'b', conf: "{a} wanted me to get angry in front of everybody. I didn't give {a} the satisfaction." },
    ] },
  ],
  'fight.any': [
    { id: 'cw2.f3', when: C, turns: [
      { beat: 'It starts on the deck and pulls in everybody nearby.' },
      { by: 'a', say: "You want to say it? Say it here, where everybody can hear it." },
      { by: 'b', say: "Fine. I don't trust you. Nobody should." },
      { by: 'x', say: "Can we not do this in front of the whole house?" },
      { by: 'a', say: "Why not? They should hear it. Then they can decide." },
      { by: 'y', opt: 1, say: "I've decided I'm going inside." },
      { by: 'b', say: "Decide whatever you want. I said what I said." },
      { by: 'a', conf: "{b} said it in front of everybody, so now everybody's thinking about it. Good. They can think about why {b} needed an audience." },
    ] },
  ],
  'deal-broken.vote': [
    { id: 'cw2.dv2', when: C, turns: [
      { beat: 'In the kitchen, {b} doesn\'t care who is listening.' },
      { by: 'b', say: "Everybody should know this. {a} and I had a deal, and {a} said my name anyway." },
      { by: 'a', say: "Do we really need to do this here?" },
      { by: 'b', say: "Yes. Here. So nobody else makes the same mistake I did." },
      { by: 'x', say: "Is that true, {a}?" },
      { by: 'a', say: "Things changed. That's all I'm going to say." },
      { by: 'y', opt: 1, say: "That sounds like a yes." },
      { by: 'b', conf: "I can't take back the vote. But I can make sure everybody in that kitchen thinks twice before they shake {a}'s hand." },
    ] },
  ],
  'vet-dismisses.any': [
    { id: 'cw2.vd3', when: C, turns: [
      { beat: 'Around the fire pit, {b} starts telling a story about the last daily.' },
      { by: 'a', say: "Rookie stories. Wake me up when something happens." },
      { by: 'x', say: "Let {b} finish. It was a good story." },
      { by: 'b', say: "It's fine. {a} has heard every story already. {a} told us. Twice." },
      { by: 'y', opt: 1, say: "Three times, actually." },
      { by: 'a', say: "Laugh all you want. I'll still be here when you're all on the plane." },
      { by: 'b', conf: "I didn't need to fight {a}. I just needed the fire pit to laugh. It did." },
    ] },
  ],
  'kitchen-blowup.any': [
    { id: 'cw2.kb3', when: C, turns: [
      { beat: 'Dinner is almost ready when {a} opens the oven and finds it off.' },
      { by: 'a', say: "Who turned the oven off? Who turned it off?" },
      { by: 'b', say: "I needed the space for my chicken. Yours can go back in." },
      { by: 'x', say: "So nobody is eating for another hour. Great." },
      { by: 'a', say: "You could have asked, {b}. Literally anybody in this kitchen could have told you it was on." },
      { by: 'y', opt: 1, say: "I'm ordering an imaginary pizza." },
      { by: 'b', say: "Fine. Everybody can blame me. I'm used to it." },
      { by: 'x', conf: "Everybody is hungry, everybody is tired, and the vote is coming. The oven never stood a chance." },
    ] },
  ],
};
