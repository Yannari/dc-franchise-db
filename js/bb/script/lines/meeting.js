// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/meeting.js — a house meeting, in four parts (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// Written by bb/script/meeting.js for house-life.js and reign.js. a called
// it; b is who it is about; c is somebody else in the room. All in the living
// room.
//
//   meeting.call      a calls everybody in                     scene
//   meeting.case      a makes the case                         lie | desperate | grudge | power
//   meeting.answer    b answers, or the room does              lands | backfires | silent | fizzles
//   meeting.verdict   how it ends                              lands | backfires | silent | fizzles

export default {
  'meeting.call.scene': [
    { id: 'mt.c1', turns: [{ by: 'a', say: "House meeting! Everyone in the living room. Now." }, { beat: 'Doors start opening all over the house.' }] },
    { id: 'mt.c2', turns: [{ by: 'a', say: "Everybody, living room, please." }, { beat: 'Conversations stop halfway through. The house files in.' }] },
    { id: 'mt.c3', turns: [{ beat: '{a} goes from room to room.' }, { by: 'a', say: "Living room. Everyone. Five minutes." }] },
    { id: 'mt.c4', turns: [{ by: 'a', say: "Can everyone come to the living room? It's important." }, { beat: 'Half the house thinks the meeting is about them.' }] },
    { id: 'mt.c5', turns: [{ beat: 'The house gathers. {b} takes the seat nearest the door.' }, { by: 'a', say: "Thanks for coming." }] },
    { id: 'mt.c6', turns: [{ by: 'a', say: "Sit down, everyone. This won't take long." }, { beat: 'It takes a long time.' }] },
  ],
  'meeting.case.lie': [
    { id: 'mt.l1', turns: [{ by: 'a', say: "Somebody in this room has been telling people I made deals I never made." }, { beat: '{a} turns to {b}.' }] },
    { id: 'mt.l2', turns: [{ by: 'a', say: "{b}, tell everyone what you've been saying about me. Go on. Say it again, here." }] },
    { id: 'mt.l3', turns: [{ by: 'a', say: "I've heard the same story from three different people. Every one of them got it from {b}." }] },
    { id: 'mt.l4', turns: [{ by: 'a', say: "Where did you hear that I offered a deal, {b}? Because I never did." }] },
    { id: 'mt.l5', turns: [{ by: 'a', say: "I'm not angry. I just want the truth. {b}, where did that story come from?" }] },
    { id: 'mt.l6', turns: [{ by: 'a', say: "Let's clear this up. {b} has been telling people something about me that isn't true." }] },
  ],
  'meeting.case.desperate': [
    { id: 'mt.d1', turns: [{ by: 'a', say: "I'm on the block. I've got nothing to lose. So let's talk about the promises people made me." }] },
    { id: 'mt.d2', turns: [{ by: 'a', say: "If I'm leaving, you all deserve to know what's been said in private." }] },
    { id: 'mt.d3', turns: [{ by: 'a', say: "If you've already decided, at least own it in front of me." }] },
    { id: 'mt.d4', turns: [{ by: 'a', say: "{b} promised me a vote. Didn't you, {b}?" }] },
    { id: 'mt.d5', turns: [{ by: 'a', say: "I'm done protecting conversations that never protected me." }] },
    { id: 'mt.d6', turns: [{ by: 'a', say: "Let's be honest for once. All of us. Starting with {b}." }] },
  ],
  'meeting.case.grudge': [
    { id: 'mt.g1', turns: [{ by: 'a', say: "I tried to keep this private. {b} didn't. So now we're doing it in front of everyone." }] },
    { id: 'mt.g2', turns: [{ by: 'a', say: "This is about respect. And it's about {b}." }] },
    { id: 'mt.g3', turns: [{ by: 'a', say: "Let me tell it from the start, {b}. Including the bit you keep leaving out." }] },
    { id: 'mt.g4', turns: [{ by: 'a', say: "I'm not attacking anyone. But {b} needs to hear this." }] },
    { id: 'mt.g5', turns: [{ by: 'a', say: "{b}, you've been talking about this all over the house. So let's talk about it here." }] },
    { id: 'mt.g6', turns: [{ by: 'a', say: "I've let it go for days. I'm not letting it go any more." }] },
  ],
  'meeting.case.power': [
    { id: 'mt.p1', turns: [{ by: 'a', say: "This is not a dictatorship." }, { beat: 'It is the only line anybody will remember.' }] },
    { id: 'mt.p2', turns: [{ by: 'a', say: "I want to know where everyone stands. One at a time." }] },
    { id: 'mt.p3', turns: [{ by: 'a', say: "I'm the HOH, and I want honesty. Who's with me and who isn't?" }] },
    { id: 'mt.p4', turns: [{ by: 'a', say: "Nobody should take the nominations personally. But I want to hear from all of you." }] },
    { id: 'mt.p5', turns: [{ by: 'a', say: "I've called you all here because I'm tired of hearing things second-hand." }] },
    { id: 'mt.p6', turns: [{ by: 'a', say: "Let's clear the air. As HOH, I think I've earned that." }] },
  ],
  'meeting.answer.silent': [
    { id: 'mt.s1', turns: [{ by: 'b', say: "Anyone?" }, { beat: 'Nobody says anything.' }] },
    { id: 'mt.s2', turns: [{ by: 'a', say: "Come on. Somebody say it." }, { beat: 'Nobody says it.' }] },
    { id: 'mt.s3', turns: [{ by: 'b', say: "Does anyone else want to speak first?" }, { beat: 'Nobody does.' }] },
    { id: 'mt.s4', turns: [{ by: 'a', say: "You all said it to me in private!" }, { beat: 'Everyone suddenly remembers less.' }] },
    { id: 'mt.s5', when: { third: true }, turns: [{ by: 'c', dr: "I agreed with {a} in the bedroom. With {b} sitting right there? I said nothing." }] },
    { id: 'mt.s6', turns: [{ by: 'b', say: "I'm happy to answer. Who's asking?" }, { beat: 'The room stays silent.' }] },
  ],
  'meeting.answer.lands': [
    { id: 'mt.a1', turns: [{ by: 'b', say: "I never said that." }, { beat: 'Then {b} explains it again, slightly differently.' }] },
    { id: 'mt.a2', turns: [{ by: 'b', say: "Who else has a problem with me?" }, { beat: 'Two hands go up.' }] },
    { id: 'mt.a3', when: { third: true }, turns: [{ by: 'b', say: "That's not true." }, { by: 'c', say: "It is. You told me the same thing." }] },
    { id: 'mt.a4', turns: [{ by: 'b', say: "It was just game talk." }, { beat: 'Two people describe separate promises that back {a} up.' }] },
    { id: 'mt.a5', turns: [{ by: 'b', say: "I... okay. Maybe I said something like that." }] },
    { id: 'mt.a6', turns: [{ by: 'b', dr: "{a} came with receipts. I didn't see that coming." }] },
  ],
  'meeting.answer.backfires': [
    { id: 'mt.b1', turns: [{ by: 'b', say: "Are you finished?" }, { beat: 'Someone on the sofa mutters, "Let {b} answer."' }] },
    { id: 'mt.b2', turns: [{ by: 'b', say: "Can I answer now?" }, { beat: 'It gets the biggest reaction of the meeting.' }] },
    { id: 'mt.b3', turns: [{ by: 'b', say: "I wasn't even in the room when you say I said that. Ask anyone." }, { beat: 'People start checking {a}\'s story instead.' }] },
    { id: 'mt.b4', turns: [{ by: 'a', say: "And another thing..." }, { by: 'b', say: "That's a different complaint." }, { beat: 'The room turns.' }] },
    { id: 'mt.b5', when: { third: true }, turns: [{ by: 'c', say: "Let {b} speak, {a}." }, { by: 'a', say: "I'm just saying..." }, { by: 'c', say: "We know what you're saying." }] },
    { id: 'mt.b6', turns: [{ by: 'b', dr: "I barely had to defend myself. {a} did all the damage alone." }] },
  ],
  'meeting.answer.fizzles': [
    { id: 'mt.f1', when: { third: true }, turns: [{ by: 'c', say: "Can we talk about the kitchen instead? It's disgusting." }, { beat: 'Enough people laugh that the meeting is over.' }] },
    { id: 'mt.f2', when: { third: true }, turns: [{ by: 'c', say: "Why didn't you just talk to {b} in private?" }, { beat: 'Several people nod.' }] },
    { id: 'mt.f3', turns: [{ by: 'b', say: "Fine. Noted." }, { beat: '{b} leaves. Everyone follows.' }] },
    { id: 'mt.f4', turns: [{ beat: 'Two side arguments start before {a} has finished.' }, { by: 'a', say: "Can everyone just... listen?" }] },
    { id: 'mt.f5', turns: [{ by: 'a', say: "So we all agree to communicate better?" }, { beat: 'Everybody nods. Nobody means it.' }] },
    { id: 'mt.f6', turns: [{ by: 'b', say: "I'm sorry if anyone was upset." }, { by: 'a', say: "That's not what this was about." }] },
  ],
  'meeting.verdict.lands': [
    { id: 'mt.vl1', turns: [{ beat: 'The meeting breaks up. Two people stop {b} at the door to ask why the story changed.' }, { by: 'a', dr: "That went exactly how I needed it to." }] },
    { id: 'mt.vl2', turns: [{ by: 'a', dr: "I didn't have to shout. The truth did the work." }] },
    { id: 'mt.vl3', turns: [{ by: 'b', dr: "I walked into that meeting fine. I walked out with a target on my back." }] },
    { id: 'mt.vl4', turns: [{ by: 'a', dr: "Everyone heard it from {b}'s own mouth. That's all I wanted." }] },
    { id: 'mt.vl5', turns: [{ beat: 'Nobody says the meeting is over. People just start leaving.' }, { by: 'b', dr: "That went badly. Really badly." }] },
    { id: 'mt.vl6', turns: [{ by: 'a', dr: "For once, the whole house saw what I've been seeing all week." }] },
  ],
  'meeting.verdict.backfires': [
    { id: 'mt.vb1', turns: [{ beat: 'People leave in pairs. Every pair is talking about {a}.' }, { by: 'a', dr: "That didn't go how I planned." }] },
    { id: 'mt.vb2', turns: [{ by: 'a', dr: "I wanted the room on my side. I lost the room." }] },
    { id: 'mt.vb3', turns: [{ by: 'b', dr: "{a} called a meeting about me and made it all about {a}." }] },
    { id: 'mt.vb4', turns: [{ by: 'b', dr: "I didn't have to say much. {a} said more than enough for both of us." }] },
    { id: 'mt.vb5', turns: [{ by: 'a', dr: "Note to self: never call a house meeting angry." }] },
    { id: 'mt.vb6', turns: [{ beat: 'The room empties. {a} is left standing on {a.posAdj} own.' }, { by: 'a', dr: "Well. That backfired." }] },
  ],
  'meeting.verdict.silent': [
    { id: 'mt.vs1', turns: [{ by: 'a', dr: "Nothing got decided. Except that nobody in this house will say {b}'s name out loud." }] },
    { id: 'mt.vs2', turns: [{ by: 'b', dr: "Nobody said a word against me. That tells everyone who runs this house." }] },
    { id: 'mt.vs3', turns: [{ by: 'a', dr: "Everyone backed me up in private. In the room, nobody." }] },
    { id: 'mt.vs4', turns: [{ by: 'a', dr: "I'll remember who stayed quiet today." }] },
    { id: 'mt.vs5', turns: [{ by: 'b', dr: "{a} wanted a trial. {a} got a room full of people looking at the floor." }] },
    { id: 'mt.vs6', turns: [{ beat: 'Everyone leaves without a word.' }, { by: 'a', dr: "So that's how it is." }] },
  ],
  'meeting.verdict.fizzles': [
    { id: 'mt.vf1', turns: [{ by: 'a', dr: "Everyone promised to do better. Nothing will change." }] },
    { id: 'mt.vf2', turns: [{ by: 'b', dr: "That meeting was about nothing. {a} and I didn't even look at each other." }] },
    { id: 'mt.vf3', turns: [{ by: 'a', dr: "I called a house meeting and we ended up talking about the dishes." }] },
    { id: 'mt.vf4', turns: [{ beat: '{a} and {b} leave through different doors.' }, { by: 'a', dr: "Well. At least I said it." }] },
    { id: 'mt.vf5', turns: [{ by: 'b', dr: "{a} made a speech. Everyone nodded. Everyone forgot it by dinner." }] },
    { id: 'mt.vf6', turns: [{ by: 'a', dr: "I don't know what I expected from that meeting. Not this." }] },
  ],
};
