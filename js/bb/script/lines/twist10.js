// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/twist10.js — the Split House (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/split-house.js.
//
//   split.picked   a was picked last; b picked everyone else first        scene
//   split.missing  a's closest ally {gone} is on the other side; b is here   deep | unfinished; intent told
//   split.small    a talks, b hears every word in a small half-house       scene
//   split.wall     a listens through the wall ({named} are over there)    scene (alone)
//   split.odd      a and b team up because nobody else is on this side    scene
//   split.reunion  a plans what to tell {target} when the wall comes down  scene (alone)
//   split.compare  a asks b about the other side's week                   spun | caught

export default {
  'split.picked.scene': [
    { id: 'sp10.p1', turns: [{ by: 'a', say: "Doesn't matter that I went last." }, { beat: 'Nobody had asked.' }, { by: 'a', dr: "It matters." }] },
    { id: 'sp10.p2', turns: [{ by: 'a', dr: "{b} picked everybody else first. Now we're stuck in a very small house together." }] },
    { id: 'sp10.p3', turns: [{ by: 'a', say: "Last pick! Saving the best for last, right?" }, { beat: '{a} laughs, then looks at {b}.' }] },
    { id: 'sp10.p4', turns: [{ by: 'a', dr: "Nobody's mentioned the picking order. That's how I know everyone remembers it." }] },
    { id: 'sp10.p5', turns: [{ by: 'b', say: "It wasn't personal." }, { by: 'a', say: "Last is personal." }] },
    { id: 'sp10.p6', turns: [{ by: 'b', dr: "I picked {a} last. {a} hasn't let it go." }] },
  ],
  'split.missing.deep': [
    { id: 'sp10.d1', turns: [{ by: 'a', dr: "I keep starting sentences meant for {gone}. The person I need to talk to is on the other side of a wall." }] },
    { id: 'sp10.d2', turns: [{ by: 'a', dr: "Every plan I've made in this house had {gone} in it. None of them work this week." }] },
    { id: 'sp10.d3', turns: [{ by: 'a', dr: "I counted the people on this side twice. {gone} still isn't one of them." }] },
    { id: 'sp10.d4', when: { intent: 'told' }, turns: [{ by: 'a', say: "I don't have a single person in here." }, { by: 'b', say: "You've got me." }, { by: 'a', say: "...Right. Sorry." }] },
    { id: 'sp10.d5', when: { intent: 'told' }, turns: [{ by: 'b', say: "You miss {gone}, don't you?" }, { by: 'a', say: "Is it that obvious?" }] },
    { id: 'sp10.d6', turns: [{ by: 'a', dr: "Five days without {gone}. I don't know who I am in this game without {gone}." }] },
  ],
  'split.missing.unfinished': [
    { id: 'sp10.u1', turns: [{ by: 'a', dr: "{gone} and I had three days. Now we find out if three days was enough." }] },
    { id: 'sp10.u2', turns: [{ by: 'a', dr: "The one person I'd started to trust went with the other side. I'm starting again, from nothing." }] },
    { id: 'sp10.u3', turns: [{ by: 'a', dr: "I watched {gone} walk off with the other half. I don't have much game left in this room." }] },
    { id: 'sp10.u4', when: { intent: 'told' }, turns: [{ by: 'b', say: "You and {gone} were getting close." }, { by: 'a', say: "Were. Past tense, for this week." }] },
    { id: 'sp10.u5', turns: [{ by: 'a', dr: "Everything I was in the middle of is on the wrong side of a wall." }] },
    { id: 'sp10.u6', when: { intent: 'told' }, turns: [{ by: 'a', say: "Want to be friends? I'm short of them this week." }, { by: 'b', say: "Go on, then." }] },
  ],
  'split.small.scene': [
    { id: 'sp10.s1', turns: [{ by: 'a', say: "Can we talk somewhere private?" }, { by: 'b', say: "There isn't anywhere private." }, { by: 'a', say: "Right." }] },
    { id: 'sp10.s2', turns: [{ by: 'b', dr: "I can hear every word {a} says from the next room. I'm not pretending I can't." }] },
    { id: 'sp10.s3', turns: [{ by: 'a', dr: "There are {size} of us, a few rooms, and no such thing as a private word." }] },
    { id: 'sp10.s4', turns: [{ by: 'b', dr: "{a} whispers louder than most people talk." }] },
    { id: 'sp10.s5', turns: [{ by: 'b', dr: "I've stopped leaving the room when people talk strategy. In a house this small, leaving says something too." }] },
    { id: 'sp10.s6', turns: [{ by: 'a', dr: "Every alliance on this side is public. Everyone knows everyone else's." }] },
  ],
  'split.wall.scene': [
    { id: 'sp10.w1', turns: [{ beat: 'A horn sounds through the wall. Then shouting. Then nothing.' }, { by: 'a', dr: "I stood under the vent for ten minutes. I learned nothing." }] },
    { id: 'sp10.w2', turns: [{ by: 'a', dr: "I can hear the other side's doors. I've started timing them. Doors aren't information. I listen anyway." }] },
    { id: 'sp10.w3', turns: [{ beat: 'A cheer comes through the wall.' }, { by: 'a', say: "Was that {named}?" }, { beat: 'Nobody knows.' }] },
    { id: 'sp10.w4', turns: [{ by: 'a', say: "I think that was a competition." }, { beat: 'The room takes it as fact.' }, { by: 'a', dr: "It was a guess." }] },
    { id: 'sp10.w5', turns: [{ by: 'a', dr: "Whatever's going on over there, it's loud. I wish I knew what it was." }] },
    { id: 'sp10.w6', turns: [{ by: 'a', dr: "Half the house is behind that wall. I'm going mad not knowing what they're saying." }] },
    { id: 'sp10.w7', turns: [{ beat: 'Laughter comes through the wall.' }, { by: 'a', say: "What are they laughing at?" }, { beat: 'Nobody on this side knows.' }] },
    { id: 'sp10.w8', turns: [{ by: 'a', dr: "I've got my ear against the wall like a spy in a film. Still nothing." }] },
    { id: 'sp10.w9', turns: [{ by: 'a', dr: "The other side went quiet an hour ago. Quiet is worse than shouting." }] },
  ],
  'split.odd.scene': [
    { id: 'sp10.o1', turns: [{ by: 'a', dr: "{b} and I would never have talked with a full house to choose from. This week there's no full house." }] },
    { id: 'sp10.o2', turns: [{ by: 'a', say: "So. We should probably talk." }, { by: 'b', say: "Probably." }, { by: 'b', dr: "First real conversation we've ever had." }] },
    { id: 'sp10.o3', turns: [{ by: 'a', dr: "A majority on this side needs {b}. So I'm going to get {b}." }] },
    { id: 'sp10.o4', turns: [{ by: 'b', dr: "Last week I'd have laughed at {a}'s offer. This week I said yes. We both know why." }] },
    { id: 'sp10.o5', turns: [{ by: 'a', say: "Work with me this week." }, { by: 'b', say: "Just this week?" }, { by: 'a', say: "Let's start with this week." }] },
    { id: 'sp10.o6', turns: [{ by: 'b', dr: "{a} and I aren't friends. It works like we are, for now." }] },
    { id: 'sp10.o7', turns: [{ by: 'b', say: "I didn't think you liked me." }, { by: 'a', say: "I don't know you. That's different." }] },
    { id: 'sp10.o8', turns: [{ by: 'a', dr: "With half the house gone, I need numbers. {b} is a number." }] },
    { id: 'sp10.o9', turns: [{ by: 'a', say: "Truce for the week?" }, { by: 'b', say: "Truce for the week." }] },
    { id: 'sp10.o10', turns: [{ by: 'b', dr: "{a} came to me because there was nobody else. I'll take it. I'd have done the same." }] },
  ],
  'split.reunion.scene': [
    { id: 'sp10.r1', turns: [{ by: 'a', dr: "I'm not playing this week. I'm planning the first five minutes after the wall comes down." }] },
    { id: 'sp10.r2', turns: [{ by: 'a', say: "When we're all back together, nobody on this side says anything about what happened in here." }, { beat: 'People nod.' }] },
    { id: 'sp10.r3', turns: [{ by: 'a', dr: "I know what I'm going to tell {target} about this week. I'm making sure it's almost true." }] },
    { id: 'sp10.r4', turns: [{ by: 'a', dr: "When the wall comes down, everyone has to explain themselves. I'm going to explain first." }] },
    { id: 'sp10.r5', turns: [{ by: 'a', dr: "{target} is going to ask what happened over here. I'm practising my answer." }] },
    { id: 'sp10.r6', turns: [{ by: 'a', dr: "The real game this week is the story we tell next week." }] },
  ],
  'split.compare.spun': [
    { id: 'sp10.n1', turns: [{ by: 'a', say: "What happened on your side?" }, { by: 'b', say: "Honestly? Not much. Let me tell you the important bits." }, { by: 'b', dr: "The bits that make me look good." }] },
    { id: 'sp10.n2', turns: [{ by: 'b', dr: "Everything I told {a} was true. I just told it in the right order." }] },
    { id: 'sp10.n3', turns: [{ by: 'a', say: "And then what?" }, { by: 'b', say: "You had to be there." }, { by: 'a', dr: "{b} keeps saying that." }] },
    { id: 'sp10.n4', turns: [{ by: 'a', dr: "{b} told me everything about the other side. It all made sense. I believe it." }] },
    { id: 'sp10.n5', turns: [{ by: 'b', say: "It was all very boring, honestly." }, { by: 'a', say: "Really?" }, { by: 'b', say: "Really." }] },
    { id: 'sp10.n6', turns: [{ by: 'b', dr: "{a} asked about last week. I gave {a} the official version." }] },
  ],
  'split.compare.caught': [
    { id: 'sp10.c1', turns: [{ by: 'a', say: "Hang on. You said something different about that earlier." }, { by: 'b', say: "Did I?" }, { by: 'a', say: "You did." }] },
    { id: 'sp10.c2', turns: [{ by: 'a', dr: "Our side's notes and their side's notes don't match. Nobody can prove which is wrong." }] },
    { id: 'sp10.c3', turns: [{ by: 'a', dr: "I asked {b} the same two questions in reverse order. One answer changed. I'm not saying anything yet." }] },
    { id: 'sp10.c4', turns: [{ by: 'b', dr: "{a} keeps asking me about the other side. I'm getting my story mixed up." }] },
    { id: 'sp10.c5', turns: [{ by: 'a', say: "Who decided that?" }, { by: 'b', say: "Everyone, kind of." }, { by: 'a', dr: "Everyone kind of is nobody." }] },
    { id: 'sp10.c6', turns: [{ by: 'a', dr: "There's a gap in {b}'s story. I'm going to find out what's in it." }] },
  ],
};
