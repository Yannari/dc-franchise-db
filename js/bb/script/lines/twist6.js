// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/twist6.js — veto variants, Safety Suite, Coin of Destiny (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/veto-variants.js, safety-suite.js and coin-of-destiny.js.
//
//   vv.courted     b pitches a, who secretly holds the second veto          scene
//   vv.medallions  a, the HOH, had the block changed again by b ({replacement} went up)   scene
//   vv.box         the second veto stayed shut; nominee a suspects b         right | wrong
//   vv.forced      a was named by b under a forced veto; c was saved         scene; third
//   suite.plusone  b named a as the plus-one; c watches ({bill})             scene
//   suite.wasted   a spent the entry and lost; b watches                     scene
//   suite.held     a kept the pass and is on the block; b sees              scene; intent seen
//   suite.count    a counts who has no entry left, starting with b           scene ({spent}, {left})
//   suite.when     a and b talk about when to spend it                       scene
//   coin.dethroned a lost the HOH to a coin; {group} paid ({buyers} of them; b is one)   scene
//   coin.paid      a paid for the coin in public; b watches                  scene
//   coin.kept      a did not pay; b reads it                                 scene
//   coin.seated    a was nominated through the coin; suspects b              scene
//   coin.winner    a won the coin (never said); b watches                    overplayed | quiet

export default {
  'vv.courted.scene': [
    { id: 'vv6.c1', turns: [{ by: 'b', say: "This week doesn't have to go the way it looks." }, { by: 'a', say: "Go on." }, { by: 'a', dr: "I've got the answer in my pocket. I'm letting {b} finish." }] },
    { id: 'vv6.c2', turns: [{ by: 'b', say: "You're the only person in here I can actually talk to." }, { by: 'a', dr: "I could end this conversation with one sentence. I'm not going to." }] },
    { id: 'vv6.c3', turns: [{ by: 'a', dr: "I'm asking {b} questions I already know the answers to. The answers tell me what {b} is worth." }] },
    { id: 'vv6.c4', turns: [{ by: 'b', dr: "{a} is really listening to me. I think it's going well." }] },
    { id: 'vv6.c5', turns: [{ by: 'b', say: "If you could change one thing about this week, what would it be?" }, { by: 'a', say: "Interesting question." }] },
    { id: 'vv6.c6', turns: [{ by: 'a', dr: "Nobody knows I came out of that competition with something. {b} is pitching to the right person without knowing it." }] },
  ],
  'vv.medallions.scene': [
    { id: 'vv6.m1', turns: [{ by: 'a', dr: "I set the block. It changed twice. {b} made the second change after the first one was already over." }] },
    { id: 'vv6.m2', turns: [{ by: 'a', say: "I had one week." }, { beat: '{a} says it again later. And again.' }, { by: 'a', dr: "{b} rewrote it in front of everyone." }] },
    { id: 'vv6.m3', turns: [{ by: 'a', dr: "Two medallions came out. Now {replacement} is in a chair I didn't put {replacement} in." }] },
    { id: 'vv6.m4', turns: [{ by: 'b', say: "Want to play cards?" }, { by: 'a', say: "No." }, { beat: 'The conversation lasts about a minute and a half.' }] },
    { id: 'vv6.m5', turns: [{ by: 'b', dr: "I used my veto. {a} is taking it very personally." }] },
    { id: 'vv6.m6', turns: [{ by: 'a', say: "Was that necessary?" }, { by: 'b', say: "It was for me." }] },
  ],
  'vv.box.right': [
    { id: 'vv6.r1', turns: [{ by: 'a', dr: "There was a second medallion in that meeting and it never came out. I think {b} was sitting on it." }] },
    { id: 'vv6.r2', turns: [{ by: 'a', dr: "Somebody looked at me on that block and decided I could stay there." }] },
    { id: 'vv6.r3', turns: [{ by: 'a', say: "Somebody chose this." }, { beat: '{b} is in the room the second time {a} says it.' }] },
    { id: 'vv6.r4', turns: [{ by: 'b', dr: "{a} has worked out it was me. I'm not going to confirm it." }] },
    { id: 'vv6.r5', turns: [{ by: 'a', say: "Did you have the other veto?" }, { by: 'b', say: "What other veto?" }, { by: 'b', dr: "Yes, I had the other veto. And I'm not telling anybody, because it's the only insurance I've got." }] },
    { id: 'vv6.r6', turns: [{ by: 'a', dr: "The veto that wasn't used is the loudest thing that happened at that meeting." }] },
  ],
  'vv.box.wrong': [
    { id: 'vv6.w1', turns: [{ by: 'a', dr: "There was a second medallion in that meeting and it never came out. I'm pretty sure it was {b}." }] },
    { id: 'vv6.w2', turns: [{ by: 'a', dr: "Somebody decided I could stay on the block. I can't stop thinking about it." }] },
    { id: 'vv6.w3', turns: [{ by: 'a', say: "Somebody chose this." }, { by: 'b', say: "Don't look at me." }, { by: 'a', say: "I'm not." }, { beat: '{a} is.' }] },
    { id: 'vv6.w4', turns: [{ by: 'b', dr: "{a} thinks I had the second veto. I didn't. I can't prove it." }] },
    { id: 'vv6.w5', turns: [{ by: 'a', say: "Did you have the other veto?" }, { by: 'b', say: "No!" }, { by: 'a', dr: "That's what anyone would say." }] },
    { id: 'vv6.w6', turns: [{ by: 'a', dr: "The veto that wasn't used is the loudest thing that happened at that meeting." }] },
  ],
  'vv.forced.scene': [
    { id: 'vv6.f1', turns: [{ by: 'a', dr: "The rule said {b} had to use it and name someone. I know that. It's still {b}'s mouth my name came out of." }] },
    { id: 'vv6.f2', when: { third: true }, turns: [{ by: 'c', say: "You could have picked me, you know." }, { by: 'b', say: "Don't." }, { by: 'a', dr: "It's a joke for {c}. Not for me." }] },
    { id: 'vv6.f3', turns: [{ by: 'b', say: "I had to use it. Those were the rules." }, { by: 'a', say: "I know." }, { by: 'a', dr: "I know {b} had to. It doesn't help. I'm still the one sitting on the block." }] },
    { id: 'vv6.f4', turns: [{ by: 'b', dr: "I'm the only person who didn't get a choice this week, and everyone's angry with me." }] },
    { id: 'vv6.f5', turns: [{ by: 'a', say: "You named me." }, { by: 'b', say: "I had to name someone." }, { by: 'a', say: "You picked me." }] },
    { id: 'vv6.f6', when: { third: true }, turns: [{ by: 'c', say: "Thank you." }, { by: 'b', say: "Don't thank me where {a} can hear." }] },
  ],
  'suite.plusone.scene': [
    { id: 'su6.p1', turns: [{ by: 'a', say: "Thank you. Really." }, { by: 'b', say: "Any time." }, { by: 'c', dr: "{b} had one of those to give and gave it to {a}. Now I know where those two stand." }] },
    { id: 'su6.p2', turns: [{ by: 'a', say: "You could have just not picked me." }, { by: 'b', say: "You'd be on the block." }, { by: 'a', dr: "I don't have an answer to that." }] },
    { id: 'su6.p3', turns: [{ by: 'a', dr: "I'm safe, and I'm paying for it with {bill}. Strange thing to thank someone for." }] },
    { id: 'su6.p4', turns: [{ by: 'c', dr: "{a} and {b}. That's a pair. I've written it down." }] },
    { id: 'su6.p5', turns: [{ by: 'c', say: "Nice of {b} to pick you." }, { by: 'a', say: "Yeah, it was." }, { by: 'c', dr: "Very nice. Very telling." }] },
    { id: 'su6.p6', turns: [{ by: 'b', dr: "I picked {a}. Everyone saw. I'd do it again." }] },
  ],
  'suite.wasted.scene': [
    { id: 'su6.w1', turns: [{ by: 'a', dr: "My one entry went on a week I lost. Every week from now on, I'm playing without a net." }] },
    { id: 'su6.w2', turns: [{ by: 'b', dr: "{a} spent it and lost. That's someone who can't buy their way off the block any more." }] },
    { id: 'su6.w3', turns: [{ by: 'a', say: "At least I tried." }, { by: 'b', say: "Course you did." }, { by: 'b', dr: "And now {a} has nothing left." }] },
    { id: 'su6.w4', turns: [{ by: 'a', dr: "I keep acting like I'm fine about it. I'm not." }] },
    { id: 'su6.w5', turns: [{ by: 'b', say: "Unlucky." }, { by: 'a', say: "Thanks." }] },
    { id: 'su6.w6', turns: [{ by: 'a', dr: "The entry's gone and the safety never came. That's the worst way it can go." }] },
  ],
  'suite.held.scene': [
    { id: 'su6.h1', turns: [{ by: 'a', dr: "I kept the pass because I didn't think it was my week. It's my week." }] },
    { id: 'su6.h2', turns: [{ by: 'a', dr: "I'm on the block holding a pass that's worth nothing on the block. Worst read I've made all season." }] },
    { id: 'su6.h3', when: { intent: 'seen' }, turns: [{ by: 'a', say: "I didn't think it was me." }, { by: 'b', say: "Nobody does." }] },
    { id: 'su6.h4', when: { intent: 'seen' }, turns: [{ by: 'b', dr: "{a} skipped the Safety Suite. That's exactly what it was for." }] },
    { id: 'su6.h5', turns: [{ by: 'a', dr: "I could have been safe. I bet on myself and lost, in front of everyone." }] },
    { id: 'su6.h6', when: { intent: 'seen' }, turns: [{ by: 'b', say: "Why didn't you go in?" }, { by: 'a', say: "Please don't." }] },
  ],
  'suite.count.scene': [
    { id: 'su6.c1', turns: [{ by: 'a', dr: "I keep the count in my head. {spent} people have nothing left. That's where next week's nominations come from." }] },
    { id: 'su6.c2', turns: [{ by: 'a', dr: "I can name everyone who can't buy safety any more. Starting with {b}." }] },
    { id: 'su6.c3', turns: [{ by: 'b', say: "Who's still got one?" }, { by: 'a', say: "Not you." }] },
    { id: 'su6.c4', turns: [{ by: 'a', dr: "{b} is out of entries, and that's not going to change. I've built a plan on it." }] },
    { id: 'su6.c5', when: { intent: 'many' }, turns: [{ by: 'a', dr: "There are {left} people who can still use the suite. The rest of us are fair game." }] },
    { id: 'su6.c6', turns: [{ by: 'b', dr: "{a} knows I've got no entry left. I can feel {a} counting." }] },
  ],
  'suite.when.scene': [
    { id: 'su6.n1', turns: [{ by: 'a', say: "When are you going to use yours?" }, { by: 'b', say: "When are you?" }, { beat: 'Neither of them says a number.' }] },
    { id: 'su6.n2', turns: [{ by: 'b', say: "If we both go in, one of us wastes it." }, { by: 'a', dr: "{b} has been thinking of us as a pair. Good to know." }] },
    { id: 'su6.n3', turns: [{ by: 'a', say: "You should go first. For your own sake." }, { by: 'b', dr: "{a} got very warm before getting to the point." }] },
    { id: 'su6.n4', turns: [{ by: 'a', say: "It's worth more every week we don't use it." }, { by: 'b', say: "And nothing if we get evicted holding it." }] },
    { id: 'su6.n5', turns: [{ by: 'a', dr: "The question isn't whether to use it. It's when." }] },
    { id: 'su6.n6', turns: [{ by: 'b', dr: "{a} really wants me to go in first. I'm not sure why." }] },
  ],
  'coin.dethroned.scene': [
    { id: 'co6.d1', when: { intent: 'many' }, turns: [{ by: 'a', dr: "I've lost my week and I can't even say who to. {buyers} people paid. One of them took it." }] },
    { id: 'co6.d2', turns: [{ by: 'a', dr: "At least a coup gives you a name. This gave me a list. {group}." }] },
    { id: 'co6.d3', turns: [{ by: 'a', say: "One of you is sitting there knowing." }, { beat: 'Everyone who paid looks equally innocent.' }] },
    { id: 'co6.d4', turns: [{ by: 'a', dr: "I won a competition, ran my week, and had it taken by someone I'll never be able to name." }] },
    { id: 'co6.d5', turns: [{ by: 'a', say: "Was it you, {b}?" }, { by: 'b', say: "No." }, { by: 'a', dr: "That's what they'd all say." }] },
    { id: 'co6.d6', turns: [{ by: 'b', dr: "{a} looks at all of us who paid like we're all guilty." }] },
  ],
  'coin.paid.scene': [
    { id: 'co6.p1', turns: [{ by: 'b', dr: "Nobody knows if {a} won the power. Everyone knows {a} wanted it badly enough to pay." }] },
    { id: 'co6.p2', turns: [{ by: 'b', dr: "Paying for the coin only means one thing. {a} isn't happy with this week." }] },
    { id: 'co6.p3', turns: [{ by: 'b', say: "{a} wanted it enough to pay." }, { beat: '{b} leaves it there.' }] },
    { id: 'co6.p4', turns: [{ by: 'a', dr: "I paid for a chance at the power, in front of everyone. I don't care who saw." }] },
    { id: 'co6.p5', turns: [{ by: 'b', say: "Feeling unsafe?" }, { by: 'a', say: "Just being careful." }] },
    { id: 'co6.p6', turns: [{ by: 'b', dr: "Everyone who paid told us how safe they feel. {a} was the loudest." }] },
  ],
  'coin.kept.scene': [
    { id: 'co6.k1', turns: [{ by: 'b', dr: "{a} didn't buy in. You only skip a chance at the whole week if you think the week can't touch you." }] },
    { id: 'co6.k2', turns: [{ by: 'b', say: "You didn't want it?" }, { by: 'a', say: "Not really." }, { by: 'b', dr: "I'm keeping that answer." }] },
    { id: 'co6.k3', turns: [{ by: 'b', dr: "{a} watched the whole thing from the sofa and paid nothing. Either very calm, or very comfortable." }] },
    { id: 'co6.k4', turns: [{ by: 'a', dr: "I kept my money. I didn't need the coin this week." }] },
    { id: 'co6.k5', turns: [{ by: 'b', say: "Saving up for something?" }, { by: 'a', say: "Maybe." }] },
    { id: 'co6.k6', turns: [{ by: 'b', dr: "Everyone who paid was worried. {a} didn't pay. What does {a} know?" }] },
  ],
  'coin.seated.scene': [
    { id: 'co6.s1', turns: [{ by: 'a', dr: "The HOH didn't put me on the block. The person who did is in this room and isn't going to tell me." }] },
    { id: 'co6.s2', turns: [{ by: 'a', dr: "I can't campaign against anyone. All I've got is a list of who paid." }] },
    { id: 'co6.s3', turns: [{ by: 'a', dr: "I've decided it was {b}. Only because {b} paid. It's all I've got." }] },
    { id: 'co6.s4', turns: [{ by: 'a', say: "Was it you, {b}?" }, { by: 'b', say: "I'm not telling you either way." }] },
    { id: 'co6.s5', turns: [{ by: 'a', dr: "Being nominated by nobody is strange. I don't know who to be angry with." }] },
    { id: 'co6.s6', turns: [{ by: 'b', dr: "{a} keeps looking at me. I paid for the coin. That doesn't mean I won it." }] },
  ],
  'coin.winner.overplayed': [
    { id: 'co6.o1', turns: [{ by: 'b', dr: "{a} has very complete opinions about the new nominations. For someone who found out when we did." }] },
    { id: 'co6.o2', turns: [{ by: 'a', say: "Whoever did it must have had their reasons." }, { by: 'b', dr: "{a} said that very warmly. Nobody else is warm about it." }] },
    { id: 'co6.o3', turns: [{ by: 'b', say: "I heard you had to pick the names on the phone." }, { by: 'a', say: "Yeah, that's right." }, { by: 'b', dr: "I made that up." }] },
    { id: 'co6.o4', turns: [{ by: 'b', dr: "{a} keeps saying 'whoever did it' like {a} knows exactly who did it." }] },
    { id: 'co6.o5', turns: [{ by: 'a', say: "Honestly, the new block makes sense." }, { by: 'b', say: "Does it?" }] },
    { id: 'co6.o6', turns: [{ by: 'b', dr: "{a} is a bit too interested in the coin. I'm watching." }] },
  ],
  'coin.winner.quiet': [
    { id: 'co6.q1', turns: [{ by: 'b', say: "How did the call go?" }, { by: 'a', say: "They don't tell you anything in there." }] },
    { id: 'co6.q2', turns: [{ by: 'a', dr: "Everyone who paid is being careful. I'm being just as careful." }] },
    { id: 'co6.q3', turns: [{ by: 'b', say: "Any idea who won it?" }, { by: 'a', say: "None. Could be anyone." }] },
    { id: 'co6.q4', turns: [{ by: 'b', dr: "{a} is as blank about the coin as everyone else." }] },
    { id: 'co6.q5', turns: [{ by: 'a', dr: "I'm not talking about the coin. Not to anyone." }] },
    { id: 'co6.q6', turns: [{ by: 'b', say: "Did you win it?" }, { by: 'a', say: "Did you?" }, { beat: 'They both laugh.' }] },
  ],
};
