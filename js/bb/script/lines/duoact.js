// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/duoact.js — Duo Week ("You Go, They Go"), spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// What houseguests say during the one-week pairs twist (written by
// bb/script/ceremony.js). Big Brother's rules are the viewer's own lines.
//
//   duoact.pair     a and b are chained together            close | easy | unsure | tense | enemies
//   duoact.hoh      a is HOH and has no partner (DR)        scene
//   duoact.solo     a has no partner and cannot be nominated    scene
//   duoact.event    the week, for one pair a and b           package (on the block) | team (package, off it) | sell-out (a sells b out) | drag ({target}) |
//                                                            shield (a hides behind b) | thaw | blowup | pact (with {others}) | solo (a)
//   duoact.taken    a is evicted as b's partner              zero | some ({votes} against a)

export default {
  'duoact.pair.close': [
    { id: 'dw7.c1', turns: [{ by: 'a', say: "Well, that's easy." }, { by: 'b', say: "We were already a pair." }] },
    { id: 'dw7.c2', turns: [{ by: 'a', dr: "If I had to be chained to anyone, it'd be {b}. Now everyone knows it." }] },
    { id: 'dw7.c3', turns: [{ beat: '{a} and {b} high-five.' }, { by: 'b', say: "Partners." }] },
    { id: 'dw7.c4', turns: [{ by: 'b', dr: "{a} and I were always going to vote together. Now we have to." }] },
    { id: 'dw7.c5', turns: [{ by: 'a', say: "Best pair in the house." }, { by: 'b', say: "Obviously." }] },
    { id: 'dw7.c6', turns: [{ by: 'a', dr: "{b} and me. Nobody's surprised." }] },
  ],
  'duoact.pair.easy': [
    { id: 'dw7.e1', turns: [{ by: 'a', say: "Could be worse." }, { by: 'b', say: "Thanks a lot." }] },
    { id: 'dw7.e2', turns: [{ by: 'a', dr: "{b} and I get on fine. Now our games are tied together. Fine is going to have to do." }] },
    { id: 'dw7.e3', turns: [{ by: 'b', say: "We've got this." }, { by: 'a', say: "Have we?" }] },
    { id: 'dw7.e4', turns: [{ by: 'b', dr: "{a} is a good partner to have. I think." }] },
    { id: 'dw7.e5', turns: [{ by: 'a', say: "Don't get us nominated." }, { by: 'b', say: "You don't get us nominated." }] },
    { id: 'dw7.e6', turns: [{ by: 'a', dr: "I'll take {b}. There were worse options in this room." }] },
  ],
  'duoact.pair.unsure': [
    { id: 'dw7.u1', turns: [{ beat: '{a} and {b} look at each other and do the maths in silence.' }, { by: 'a', say: "Hi, partner." }] },
    { id: 'dw7.u2', turns: [{ by: 'a', dr: "I barely know {b}. Now if {b} goes, I go. Great." }] },
    { id: 'dw7.u3', turns: [{ by: 'b', say: "So. Us." }, { by: 'a', say: "Us." }] },
    { id: 'dw7.u4', turns: [{ by: 'b', dr: "I have no idea what {a} is going to do this week. And it's my week too." }] },
    { id: 'dw7.u5', turns: [{ by: 'a', say: "We should probably talk." }, { by: 'b', say: "Probably." }] },
    { id: 'dw7.u6', turns: [{ by: 'a', dr: "{b} and I have to trust each other now. We've never had to before." }] },
  ],
  'duoact.pair.tense': [
    { id: 'dw7.t1', turns: [{ by: 'a', say: "You're joking." }, { by: 'b', say: "I wish." }] },
    { id: 'dw7.t2', turns: [{ by: 'a', dr: "{b} and I have been circling each other for weeks. Now we're a unit. Brilliant." }] },
    { id: 'dw7.t3', turns: [{ beat: 'The room laughs before {a} or {b} can say anything.' }, { by: 'b', say: "Very funny." }] },
    { id: 'dw7.t4', turns: [{ by: 'b', dr: "If {a} goes home, I go home. I have never wanted {a} to win anything so much." }] },
    { id: 'dw7.t5', turns: [{ by: 'a', say: "Just don't do anything stupid." }, { by: 'b', say: "Same to you." }] },
    { id: 'dw7.t6', turns: [{ by: 'a', dr: "Of all the people in this house. {b}." }] },
  ],
  'duoact.pair.enemies': [
    { id: 'dw7.x1', turns: [{ by: 'a', say: "Absolutely not." }, { by: 'b', say: "Feeling's mutual." }] },
    { id: 'dw7.x2', turns: [{ by: 'a', dr: "I can't stand {b}. Now {b} is my whole game this week." }] },
    { id: 'dw7.x3', turns: [{ beat: 'The whole room turns to look at {a} and {b}.' }, { by: 'a', say: "Nobody say anything." }] },
    { id: 'dw7.x4', turns: [{ by: 'b', dr: "Of course they paired me with {a}. Of course they did." }] },
    { id: 'dw7.x5', turns: [{ by: 'a', say: "Stay out of my way." }, { by: 'b', say: "We're chained together. That's not how it works." }] },
    { id: 'dw7.x6', turns: [{ by: 'a', dr: "If {b} sinks, I sink. I'm going to have to keep {b} afloat. I hate this." }] },
  ],
  'duoact.hoh.scene': [
    { id: 'dw7.h1', turns: [{ by: 'a', dr: "I'm HOH, so I'm not in a pair. Nobody standing next to me to lose." }] },
    { id: 'dw7.h2', turns: [{ by: 'a', dr: "I get to put up two pairs. Four people, two keys each. This week is going to be a lot." }] },
    { id: 'dw7.h3', turns: [{ by: 'a', dr: "Everyone's chained to someone except me. I've never felt so free." }] },
    { id: 'dw7.h4', turns: [{ by: 'a', dr: "If I nominate one of a pair, I nominate both. I need to think about that." }] },
    { id: 'dw7.h5', turns: [{ by: 'a', dr: "Two people go home this week, and I choose which pairs sit on the block." }] },
    { id: 'dw7.h6', turns: [{ by: 'a', dr: "No partner for the HOH. Thank goodness." }] },
  ],
  'duoact.solo.scene': [
    { id: 'dw7.s1', turns: [{ by: 'a', dr: "Nobody was paired with me. Normally that would be the worst thing in here. This week it means I can't be nominated." }] },
    { id: 'dw7.s2', turns: [{ by: 'a', dr: "The odd one out. For once, it's the safest place in the house." }] },
    { id: 'dw7.s3', turns: [{ by: 'a', say: "No partner? Shame." }, { by: 'a', dr: "Not a shame. Best thing that's happened to me all season." }] },
    { id: 'dw7.s4', turns: [{ by: 'a', dr: "I'm on my own this week, which means nobody can put me up. I'll take it." }] },
    { id: 'dw7.s5', turns: [{ by: 'a', dr: "Everyone's going to want my vote this week. I can't be nominated. I'm the only free one." }] },
    { id: 'dw7.s6', turns: [{ by: 'a', dr: "Left over, and untouchable. Funny how that works." }] },
  ],
  'duoact.event.package': [
    { id: 'dw7.p1', turns: [{ by: 'a', say: "We're a package. Vote for one of us, you're voting for both." }, { by: 'b', say: "So don't." }] },
    { id: 'dw7.p2', turns: [{ by: 'a', dr: "{b} and I stopped campaigning separately on Tuesday. We walk into every conversation together now." }] },
    { id: 'dw7.p3', turns: [{ by: 'a', say: "You talk, I'll listen." }, { by: 'b', say: "Deal." }, { by: 'a', dr: "Between us we worked the whole house in a day." }] },
    { id: 'dw7.p4', turns: [{ by: 'b', dr: "Saying 'we' out loud changes things. {a} and I really are a team now." }] },
    { id: 'dw7.p5', turns: [{ by: 'a', say: "Keep both of us." }, { by: 'b', say: "Two votes for the price of one." }] },
    { id: 'dw7.p6', turns: [{ by: 'a', dr: "If one of us talks the house round and the other doesn't, it's no use. So we go together." }] },
  ],
  // the same deal, made by a pair NOT on the block: they have nothing to plead for
  'duoact.event.team': [
    { id: 'dw7.t1', turns: [{ by: 'a', dr: "{b} and I aren't on the block, and we want to keep it that way. We vote together, all week." }] },
    { id: 'dw7.t2', turns: [{ by: 'a', say: "Whoever we vote for, we vote for together." }, { by: 'b', say: "Agreed." }] },
    { id: 'dw7.t3', turns: [{ by: 'b', dr: "{a} and I have started finishing each other's pitches. It's a bit scary." }] },
    { id: 'dw7.t4', turns: [{ by: 'a', dr: "Two votes that always land in the same place. People notice that. Good." }] },
    { id: 'dw7.t5', turns: [{ by: 'a', say: "We go to every conversation together this week." }, { by: 'b', say: "Every one." }] },
    { id: 'dw7.t6', turns: [{ by: 'b', dr: "I didn't pick {a}, but I'd pick {a} now." }] },
  ],
  'duoact.event.sell-out': [
    { id: 'dw7.o1', turns: [{ by: 'a', say: "Vote out {b}, not me." }, { beat: 'Somebody points out that it is the same vote.' }, { by: 'b', dr: "It got back to me before dinner." }] },
    { id: 'dw7.o2', turns: [{ by: 'b', dr: "{a} has been telling people to vote me out. We're chained together. It's the same vote, {a}." }] },
    { id: 'dw7.o3', turns: [{ by: 'a', dr: "I've been making a case against {b} all week. Even if it doesn't work, it makes me look better." }] },
    { id: 'dw7.o4', turns: [{ by: 'b', say: "I heard what you said about me." }, { by: 'a', say: "It's not what it sounds like." }, { by: 'b', say: "It's exactly what it sounds like." }] },
    { id: 'dw7.o5', turns: [{ by: 'b', dr: "My own partner tried to sell me out. On a week where we go home together." }] },
    { id: 'dw7.o6', turns: [{ by: 'a', dr: "If one of us has to look bad, it's going to be {b}." }] },
  ],
  'duoact.event.drag': [
    { id: 'dw7.d1', turns: [{ by: 'a', say: "We vote {target}." }, { by: 'b', say: "I can't vote {target}." }, { by: 'a', say: "Why not?" }] },
    { id: 'dw7.d2', turns: [{ by: 'a', dr: "I want {target} gone. {b} won't write that name down. We're supposed to be a team." }] },
    { id: 'dw7.d3', turns: [{ by: 'b', dr: "{target} is my friend. {a} wants {target} out. We can't both get what we want." }] },
    { id: 'dw7.d4', turns: [{ by: 'a', say: "It has to be {target}." }, { by: 'b', say: "It doesn't have to be anything." }] },
    { id: 'dw7.d5', turns: [{ by: 'b', dr: "{a} and I spent an hour on the vote. We came out agreeing on nothing." }] },
    { id: 'dw7.d6', turns: [{ by: 'a', dr: "Two votes, one pair, and {target} right in the middle of us." }] },
  ],
  'duoact.event.shield': [
    { id: 'dw7.i1', turns: [{ by: 'a', dr: "Nobody's coming for me this week. Coming for me means taking a shot at {b}, and nobody's ready for that." }] },
    { id: 'dw7.i2', turns: [{ by: 'a', say: "They'd have to be willing to lose {b} too." }, { by: 'a', dr: "That sounded good. I'm keeping it." }] },
    { id: 'dw7.i3', turns: [{ by: 'a', dr: "{b} is the reason I'm in danger and the reason I'm safe. I'm going with grateful." }] },
    { id: 'dw7.i4', turns: [{ by: 'b', dr: "{a} is hiding behind me this week. Fine. Just this week." }] },
    { id: 'dw7.i5', turns: [{ by: 'a', say: "Thanks for being scary, {b}." }, { by: 'b', say: "Any time." }] },
    { id: 'dw7.i6', turns: [{ by: 'a', dr: "Being chained to {b} is the safest I've been in this house." }] },
  ],
  'duoact.event.thaw': [
    { id: 'dw7.w1', turns: [{ by: 'a', dr: "{b} and I hadn't had a civil conversation since week one. It took two days to become something like allies." }] },
    { id: 'dw7.w2', turns: [{ by: 'a', say: "Truce?" }, { by: 'b', say: "Truce." }] },
    { id: 'dw7.w3', turns: [{ by: 'b', dr: "Nothing fixes a grudge like a shared problem. {a} and I are fine now. Who knew." }] },
    { id: 'dw7.w4', turns: [{ by: 'a', say: "You're not as bad as I thought." }, { by: 'b', say: "Neither are you." }] },
    { id: 'dw7.w5', turns: [{ by: 'a', dr: "I came into this week hating {b}. I'm leaving it on {b}'s side. Didn't see that coming." }] },
    { id: 'dw7.w6', turns: [{ by: 'b', dr: "One long night and {a} and I sorted everything out. We had to." }] },
  ],
  'duoact.event.blowup': [
    { id: 'dw7.b1', turns: [{ by: 'a', say: "I can't do this with you!" }, { by: 'b', say: "You don't have a choice!" }, { beat: 'The kitchen goes quiet.' }] },
    { id: 'dw7.b2', turns: [{ by: 'a', dr: "{b} and I made it to Wednesday. Then it all went up in front of everyone. We're still chained together." }] },
    { id: 'dw7.b3', turns: [{ by: 'b', say: "Every time you open your mouth, you make us a target." }, { by: 'a', say: "Then stop listening." }] },
    { id: 'dw7.b4', turns: [{ by: 'b', dr: "Being tied to someone you can't stand doesn't make you stand them. It just makes everyone watch." }] },
    { id: 'dw7.b5', turns: [{ by: 'a', say: "We are not a team." }, { by: 'b', say: "The house says we are." }] },
    { id: 'dw7.b6', turns: [{ by: 'a', dr: "I shouted at my own partner in front of the whole house. Not my best week." }] },
  ],
  'duoact.event.pact': [
    { id: 'dw7.a1', turns: [{ by: 'a', say: "Neither pair votes for the other. Deal?" }, { by: 'b', say: "Deal." }, { by: 'a', dr: "In a week where everyone counts in twos, four of us is most of a majority." }] },
    { id: 'dw7.a2', turns: [{ by: 'a', dr: "{b}'s pair and mine made a deal: neither of us writes down a name from the other." }] },
    { id: 'dw7.a3', turns: [{ by: 'b', say: "Four as one?" }, { by: 'a', say: "Four as one." }] },
    { id: 'dw7.a4', turns: [{ by: 'b', dr: "Two pairs, one agreement. Four votes, all going the same way." }] },
    { id: 'dw7.a5', turns: [{ by: 'a', say: "We look after you, you look after us." }, { by: 'b', say: "Done." }] },
    { id: 'dw7.a6', turns: [{ by: 'a', dr: "My pair and {b}'s pair are a four now. That's a lot of votes." }] },
  ],
  'duoact.event.solo': [
    { id: 'dw7.l1', turns: [{ by: 'a', dr: "I can't be nominated, and everyone knows it. I've been offered three deals I didn't ask for." }] },
    { id: 'dw7.l2', turns: [{ by: 'a', dr: "For one week, being alone in this house is the safest thing anyone's got. People can't decide whether to resent me for it." }] },
    { id: 'dw7.l3', turns: [{ by: 'a', dr: "Most popular person in the house this week. Least trusted, too." }] },
    { id: 'dw7.l4', turns: [{ by: 'a', dr: "Everybody wants my vote. Nobody can touch me. I'm enjoying this." }] },
    { id: 'dw7.l5', turns: [{ by: 'a', dr: "The odd one out gets a week off. Next week I'm just alone again." }] },
    { id: 'dw7.l6', turns: [{ by: 'a', dr: "I'm voting like a free person this week. Nobody's chained to me." }] },
  ],
  'duoact.taken.zero': [
    { id: 'dw7.z1', turns: [{ by: 'a', say: "Not one vote. And I'm going home." }, { by: 'b', say: "I'm so sorry." }] },
    { id: 'dw7.z2', turns: [{ by: 'a', dr: "Nobody wrote my name down. Not one person. I'm leaving anyway." }] },
    { id: 'dw7.z3', turns: [{ by: 'a', say: "Zero votes. Zero." }, { by: 'b', say: "It should have been just me." }] },
    { id: 'dw7.z4', turns: [{ beat: '{a} stands up next to {b}. There is nothing else to do.' }, { by: 'a', say: "Come on, then." }] },
    { id: 'dw7.z5', turns: [{ by: 'a', say: "The house didn't vote for me. The house voted for {b}." }, { by: 'b', say: "I know." }] },
    { id: 'dw7.z6', turns: [{ by: 'a', dr: "I'm evicted on no votes at all. That's this twist." }] },
  ],
  'duoact.taken.some': [
    { id: 'dw7.m1', turns: [{ by: 'a', dr: "I had {votes} against me. I'd have survived that. I'm going because of {b}." }] },
    { id: 'dw7.m2', turns: [{ by: 'a', say: "Well, we go together." }, { by: 'b', say: "I'm sorry." }] },
    { id: 'dw7.m3', turns: [{ by: 'a', dr: "{b} lost the vote. I lost the week." }] },
    { id: 'dw7.m4', turns: [{ beat: '{a} stands up next to {b}.' }, { by: 'a', say: "Let's go." }] },
    { id: 'dw7.m5', turns: [{ by: 'a', say: "It wasn't my vote." }, { by: 'b', say: "I know. It's still your door." }] },
    { id: 'dw7.m6', turns: [{ by: 'a', dr: "Only {votes} people wanted me out. That didn't matter in the end." }] },
  ],
};
