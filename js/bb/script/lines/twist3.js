// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/twist3.js — Wildcard, the returned houseguest, White Locust (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/wildcard.js, returned.js and white-locust.js.
//
//   wild.serving      a serves {bill}, the punishment b took safety for    needles | smiles
//   wild.refusal      b turned the deal down; a reads it                    suspects | admired
//   wild.wearing      a took safety and wears {bill}; b watches             owns | hates; intent seen
//   returned.morning  a is back; b voted a out                              gracious | ledger
//   returned.repriced a re-ranks b, who came back                           urgent | miracle
//   returned.door     a lost the fight at the door                          owns (b came back) | blamed (b blames a; {target} came back)
//   locust.called     b called a out in the White Locust ({limit} seconds)  scene
//   locust.close      a made it by {margin} seconds; b hears it             scene; intent told
//   locust.novote     a and b, the morning after the clock sent {gone} home  scene
//   locust.asterisk   b doubts a, the HOH the clock made                     scene

export default {
  'wild.serving.needles': [
    { id: 'tw3.n1', turns: [{ by: 'a', say: "Don't look away, {b}. This is yours. We're just the ones paying for it." }] },
    { id: 'tw3.n2', turns: [{ by: 'a', dr: "I'm keeping a tally on the fridge. Every time we sit through {bill}, another mark. {b}'s name is at the top." }] },
    { id: 'tw3.n3', turns: [{ by: 'a', say: "Comfortable, {b}?" }, { beat: '{b} does not answer.' }] },
    { id: 'tw3.n4', turns: [{ by: 'a', dr: "{b} took the deal, and the whole house is paying for it. I'm making sure {b} sees every minute." }] },
    { id: 'tw3.n5', turns: [{ by: 'b', dr: "{a} makes sure I'm in the room every single time. I get the message." }] },
    { id: 'tw3.n6', turns: [{ by: 'a', say: "Enjoying your safety?" }, { by: 'b', say: "...Yes?" }, { by: 'a', say: "Good. We're all enjoying {bill}." }] },
  ],
  'wild.serving.smiles': [
    { id: 'tw3.m1', turns: [{ by: 'a', say: "Good move. I'd have done the same." }, { by: 'a', dr: "And I'll remember it the same way, too." }] },
    { id: 'tw3.m2', turns: [{ beat: '{a} takes a bow every time the punishment goes off.' }, { by: 'b', dr: "{a} is turning it into a joke. I still can't relax." }] },
    { id: 'tw3.m3', turns: [{ by: 'a', dr: "Respect to {b}. But somebody who spends the whole house once will do it again." }] },
    { id: 'tw3.m4', turns: [{ by: 'a', say: "No hard feelings, {b}." }, { by: 'b', say: "Thanks." }, { by: 'a', dr: "Some hard feelings." }] },
    { id: 'tw3.m5', turns: [{ by: 'a', dr: "I'll do {bill} with a smile. And I'll vote with a long memory." }] },
    { id: 'tw3.m6', turns: [{ by: 'b', dr: "{a} is being really nice about the punishment. That's what worries me." }] },
  ],
  'wild.refusal.suspects': [
    { id: 'tw3.s1', turns: [{ by: 'a', say: "Nobody turns down safety unless they've already got it. So who's protecting {b}?" }, { beat: 'The question goes round the house by evening.' }] },
    { id: 'tw3.s2', turns: [{ by: 'a', dr: "The punishment was survivable. The block isn't. {b} said no anyway. That's not brave. That's someone who has counted." }] },
    { id: 'tw3.s3', turns: [{ by: 'a', dr: "I'm watching who {b} eats with. Somewhere in there is the reason {b} could afford to say no." }] },
    { id: 'tw3.s4', turns: [{ by: 'a', say: "Why did you turn it down?" }, { by: 'b', say: "Didn't need it." }, { by: 'a', dr: "Exactly." }] },
    { id: 'tw3.s5', turns: [{ by: 'b', dr: "I said no to the deal. Now everyone wants to know why." }] },
    { id: 'tw3.s6', turns: [{ by: 'a', dr: "Turning down safety tells me {b} feels safe. I want to know who's behind that." }] },
  ],
  'wild.refusal.admired': [
    { id: 'tw3.a1', turns: [{ by: 'b', dr: "I looked at that deal and said no thanks. People seem to think that was cool. I'll take it." }] },
    { id: 'tw3.a2', turns: [{ by: 'a', say: "I'd have taken it, no shame." }, { by: 'b', say: "Didn't feel like owing anyone." }, { beat: 'A few people nod.' }] },
    { id: 'tw3.a3', turns: [{ by: 'a', dr: "{b} turned down free safety. That takes guts. I respect it." }] },
    { id: 'tw3.a4', turns: [{ by: 'a', say: "You've got a spine, I'll give you that." }, { by: 'b', say: "Thanks." }] },
    { id: 'tw3.a5', turns: [{ by: 'b', dr: "Half the house looks at me differently since I said no. In a good way." }] },
    { id: 'tw3.a6', turns: [{ by: 'a', dr: "Everyone's talking about {b} saying no. {b} doesn't even seem bothered." }] },
  ],
  'wild.wearing.owns': [
    { id: 'tw3.o1', turns: [{ by: 'a', dr: "I've decided {bill} is a bit. I'm committing. Encores available on request." }] },
    { id: 'tw3.o2', when: { intent: 'seen' }, turns: [{ beat: '{a} poses for the memory wall in the punishment.' }, { by: 'b', dr: "It's impossible to plot against someone this ridiculous." }] },
    { id: 'tw3.o3', turns: [{ by: 'a', say: "Safe AND fabulous." }, { beat: 'The house laughs. Again.' }] },
    { id: 'tw3.o4', turns: [{ by: 'a', dr: "Paying for safety in public is fine if you make it funny." }] },
    { id: 'tw3.o5', when: { intent: 'seen' }, turns: [{ by: 'b', say: "Do it again!" }, { by: 'a', say: "Every time." }] },
    { id: 'tw3.o6', turns: [{ by: 'a', dr: "The sillier I look, the less anyone thinks I'm a threat. Suits me." }] },
  ],
  'wild.wearing.hates': [
    { id: 'tw3.h1', turns: [{ by: 'a', dr: "I'm safe. I hate every minute of the price." }] },
    { id: 'tw3.h2', when: { intent: 'seen' }, turns: [{ by: 'b', dr: "{a} flinches every time the punishment goes off. Imagine what a nomination would do." }] },
    { id: 'tw3.h3', turns: [{ by: 'a', dr: "The safety was the easy part. Doing {bill} in front of everyone is the hard part." }] },
    { id: 'tw3.h4', turns: [{ by: 'a', say: "Is it over yet?" }, { beat: 'It is not over yet.' }] },
    { id: 'tw3.h5', turns: [{ by: 'a', dr: "I bought this week. I'm still paying for it." }] },
    { id: 'tw3.h6', when: { intent: 'seen' }, turns: [{ by: 'b', say: "You okay?" }, { by: 'a', say: "Ask me when it stops." }] },
  ],
  'returned.morning.gracious': [
    { id: 'tr3.g1', turns: [{ beat: '{a} makes coffee for the people who voted {a.obj} out, and hands the first cup to {b}.' }, { by: 'a', say: "Relax. If I held grudges, I'd have unpacked angrier." }] },
    { id: 'tr3.g2', turns: [{ by: 'a', say: "Clean slate." }, { by: 'b', say: "Really?" }, { by: 'a', say: "Really." }, { by: 'b', dr: "{a} means it. I think. I'm still watching." }] },
    { id: 'tr3.g3', turns: [{ by: 'a', dr: "I told the story of my eviction like it happened to someone else. Everyone laughed. Everyone's still watching me." }] },
    { id: 'tr3.g4', turns: [{ by: 'a', say: "Morning, {b}! Sleep well?" }, { by: 'b', say: "...Yes." }, { by: 'a', say: "Good." }] },
    { id: 'tr3.g5', turns: [{ by: 'b', dr: "{a} came back being so nice. Nobody is relaxing." }] },
    { id: 'tr3.g6', turns: [{ by: 'a', dr: "I'm not going to waste my second chance on grudges." }] },
  ],
  'returned.morning.ledger': [
    { id: 'tr3.l1', turns: [{ by: 'a', say: "Sleep well, {b}?" }, { beat: 'That is all {a} says. Nobody else in the kitchen says anything either.' }] },
    { id: 'tr3.l2', turns: [{ by: 'a', dr: "I know exactly who voted me out. I can say the count from memory. I've said it twice today." }] },
    { id: 'tr3.l3', turns: [{ by: 'b', dr: "{a} is perfectly polite and doesn't blink. {a} hasn't forgiven anything." }] },
    { id: 'tr3.l4', turns: [{ by: 'a', say: "Funny to be back, isn't it, {b}?" }, { by: 'b', say: "...Yeah." }] },
    { id: 'tr3.l5', turns: [{ by: 'a', dr: "The eviction isn't forgiven. It's written down." }] },
    { id: 'tr3.l6', turns: [{ by: 'b', dr: "{a} came back counting. I'm on the list." }] },
  ],
  'returned.repriced.urgent': [
    { id: 'tr3.u1', turns: [{ by: 'a', dr: "We beat {b} once, and it didn't stick. What's the plan for someone an eviction doesn't work on?" }] },
    { id: 'tr3.u2', turns: [{ by: 'a', dr: "I want {b} back on the block before {b} finishes unpacking." }] },
    { id: 'tr3.u3', turns: [{ by: 'a', dr: "Every week {b} is here, {b} knows more than the last person we sent home." }] },
    { id: 'tr3.u4', turns: [{ by: 'a', say: "We need to deal with {b}. Now." }, { beat: 'Nobody argues.' }] },
    { id: 'tr3.u5', turns: [{ by: 'a', dr: "{b} came back at the top of my list. We showed {b} our whole hand and then let {b} back in." }] },
    { id: 'tr3.u6', turns: [{ by: 'b', dr: "I've been back a day and people are already counting votes against me." }] },
  ],
  'returned.repriced.miracle': [
    { id: 'tr3.m1', turns: [{ by: 'a', dr: "Half the house thinks {b} coming back means something. Being nice to {b} costs nothing." }] },
    { id: 'tr3.m2', turns: [{ by: 'a', say: "They came back with nothing. No safety, no friends." }, { beat: '{b} is making friends in the next room while {a} says it.' }] },
    { id: 'tr3.m3', turns: [{ by: 'a', dr: "I can't decide if {b} is a threat or a miracle. So I'm being nice." }] },
    { id: 'tr3.m4', turns: [{ by: 'b', dr: "I haven't eaten alone once since I came back. People are being very kind." }] },
    { id: 'tr3.m5', turns: [{ by: 'a', say: "Welcome back, {b}." }, { by: 'b', say: "Thanks. It's good to be back." }] },
    { id: 'tr3.m6', turns: [{ by: 'a', dr: "{b} beat the odds once. I'd rather be on {b}'s side." }] },
  ],
  'returned.door.owns': [
    { id: 'tr3.d1', turns: [{ by: 'a', say: "You sent me to hold a door and I dropped it. Blame me, not the door." }] },
    { id: 'tr3.d2', turns: [{ by: 'a', dr: "I lost at the door. I'm owning it. That's the only way to come back from it." }] },
    { id: 'tr3.d3', turns: [{ by: 'a', say: "Next time, send somebody better." }, { beat: 'The room laughs.' }] },
    { id: 'tr3.d4', turns: [{ by: 'b', dr: "{a} lost the fight that let me back in. {a} has been very gracious about it." }] },
    { id: 'tr3.d5', turns: [{ by: 'a', say: "Sorry, everyone. My fault." }, { by: 'b', say: "Not sorry over here." }] },
    { id: 'tr3.d6', turns: [{ by: 'a', dr: "I'm taking the jokes about the door with a smile. Better than taking them badly." }] },
  ],
  'returned.door.blamed': [
    { id: 'tr3.b1', turns: [{ by: 'b', say: "The house picked {a} to keep {target} out. {target} is eating cereal in the kitchen." }, { beat: '{a} hears every word.' }] },
    { id: 'tr3.b2', turns: [{ by: 'a', dr: "I've spent all day explaining what went wrong at that door. Nobody's listening." }] },
    { id: 'tr3.b3', turns: [{ beat: '{target} walks through the room. Someone looks at {a}.' }, { by: 'a', dr: "Nobody says anything. Nobody has to." }] },
    { id: 'tr3.b4', turns: [{ by: 'b', dr: "{a} had one job. {target} is back. I'm not letting it go." }] },
    { id: 'tr3.b5', turns: [{ by: 'a', say: "It wasn't my fault." }, { by: 'b', say: "It was, a bit." }] },
    { id: 'tr3.b6', turns: [{ by: 'a', dr: "Every time {target} walks past, I feel the room look at me." }] },
  ],
  'locust.called.scene': [
    { id: 'tl2.c1', turns: [{ by: 'a', say: "You gave me {limit} seconds." }, { by: 'b', say: "I know." }, { by: 'a', say: "{limit} seconds, {b}." }] },
    { id: 'tl2.c2', turns: [{ by: 'b', say: "It had to be somebody." }, { by: 'a', say: "It didn't have to be me." }] },
    { id: 'tl2.c3', turns: [{ by: 'a', dr: "{b} didn't even look at me when {b} called my name. That's the part I can't let go." }] },
    { id: 'tl2.c4', turns: [{ by: 'b', dr: "I've explained three times why I picked {a}. {a} hasn't said a word back." }] },
    { id: 'tl2.c5', turns: [{ by: 'b', say: "You'd have done the same." }, { by: 'a', say: "Maybe. But I didn't." }] },
    { id: 'tl2.c6', turns: [{ by: 'a', dr: "I made it. Just. And I don't owe {b} anything now." }] },
  ],
  'locust.close.scene': [
    { id: 'tl2.k1', turns: [{ by: 'a', dr: "I worked it out afterwards. {margin} seconds. I wish I hadn't." }] },
    { id: 'tl2.k2', when: { intent: 'told' }, turns: [{ by: 'a', say: "Forget I told you the number." }, { by: 'b', say: "What number?" }, { by: 'a', say: "Exactly." }] },
    { id: 'tl2.k3', turns: [{ by: 'a', dr: "{margin} seconds between me and going home. I'm not sleeping much." }] },
    { id: 'tl2.k4', turns: [{ by: 'a', dr: "Now I count everything out loud. Everyone hates it." }] },
    { id: 'tl2.k5', when: { intent: 'told' }, turns: [{ by: 'a', say: "It was fine." }, { by: 'b', say: "It was {margin} seconds from not being fine." }] },
    { id: 'tl2.k6', turns: [{ by: 'a', dr: "That was the closest call of my life. I'm still shaking." }] },
  ],
  'locust.novote.scene': [
    { id: 'tl2.v1', turns: [{ by: 'a', say: "{gone} didn't even get a vote." }, { by: 'b', say: "Nobody did." }, { beat: 'They stop there. There is no one to be angry with.' }] },
    { id: 'tl2.v2', turns: [{ by: 'a', dr: "Normally the morning after, we'd be working out who did it. There's no one. The clock did it." }] },
    { id: 'tl2.v3', turns: [{ by: 'b', say: "There's nothing to be angry about." }, { by: 'a', say: "That's the worst part." }] },
    { id: 'tl2.v4', turns: [{ beat: '{a} and {b} talk about the carpet for twenty minutes.' }, { by: 'b', dr: "Anything to avoid talking about {gone}." }] },
    { id: 'tl2.v5', turns: [{ by: 'a', say: "Who packed {gone}'s things?" }, { by: 'b', say: "I don't know." }, { by: 'a', dr: "That's the only decision anyone made all day." }] },
    { id: 'tl2.v6', turns: [{ by: 'b', dr: "There's no name to blame for {gone}. I don't know what to do with that." }] },
  ],
  'locust.asterisk.scene': [
    { id: 'tl2.a1', turns: [{ by: 'b', dr: "{a} became HOH by being fast with a stopwatch. I'm not saying it to {a}. I'm saying it to everyone else." }] },
    { id: 'tl2.a2', turns: [{ by: 'b', say: "So, how was winning HOH?" }, { by: 'a', say: "Great, thanks." }, { by: 'b', dr: "There was no competition. There was a stopwatch." }] },
    { id: 'tl2.a3', turns: [{ by: 'a', say: "When I won HOH..." }, { beat: '{b} does not correct {a}. Very loudly.' }] },
    { id: 'tl2.a4', turns: [{ by: 'b', dr: "This reign is on loan. I've said so. {a} found out an hour before nominations." }] },
    { id: 'tl2.a5', turns: [{ by: 'a', dr: "{b} keeps calling my HOH lucky. I don't care. I've still got the key." }] },
    { id: 'tl2.a6', turns: [{ by: 'b', say: "Enjoy it. It's borrowed." }, { by: 'a', say: "Everything in here is borrowed." }] },
  ],
};
