// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/capact.js — the Time Capsule, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// America's favourite goes into the capsule alone (written by
// bb/script/ceremony.js). Inside, they talk to themselves; nobody else can
// hear. A power that comes out is the holder's secret, so it is never named
// and only talked about in the Diary Room.
//
//   capact.entry    a is sent into the capsule                 scene
//   capact.stage    a, inside, after one stage                 good | near | bad
//   capact.won      a beat it and holds a secret power         scene
//   capact.lost     a lost it and comes out with a punishment  costume | slop
//   capact.tether   a is tethered to b by a's punishment       scene

export default {
  'capact.entry.scene': [
    { id: 'cp7.e1', turns: [{ by: 'a', say: "America picked me? Really?" }] },
    { id: 'cp7.e2', turns: [{ by: 'a', dr: "Being America's favourite sounds great until they lock you in a room." }] },
    { id: 'cp7.e3', turns: [{ by: 'a', say: "Okay. Wish me luck." }, { beat: 'The capsule door seals behind {a}.' }] },
    { id: 'cp7.e4', turns: [{ by: 'a', dr: "I'm either coming out with a power or wearing something awful. No pressure." }] },
    { id: 'cp7.e5', turns: [{ by: 'a', say: "Thank you, America. I think." }] },
    { id: 'cp7.e6', turns: [{ by: 'a', dr: "Everyone watched me walk in. Now they have to wait and see what I come out with." }] },
  ],
  'capact.stage.good': [
    { id: 'cp7.g1', turns: [{ by: 'a', say: "Yes. Next." }] },
    { id: 'cp7.g2', turns: [{ by: 'a', say: "Got it. Keep going, keep going." }] },
    { id: 'cp7.g3', turns: [{ by: 'a', say: "That's one I knew." }] },
    { id: 'cp7.g4', turns: [{ by: 'a', say: "Okay, I'm good at this." }] },
    { id: 'cp7.g5', turns: [{ by: 'a', say: "Clean. Don't celebrate. Next one." }] },
  ],
  'capact.stage.near': [
    { id: 'cp7.n1', turns: [{ by: 'a', say: "No, wait. Yes. Yes, that one." }] },
    { id: 'cp7.n2', turns: [{ by: 'a', say: "Come on, come on." }] },
    { id: 'cp7.n3', turns: [{ by: 'a', say: "That took too long." }] },
    { id: 'cp7.n4', turns: [{ by: 'a', say: "Got there. Just." }] },
    { id: 'cp7.n5', turns: [{ by: 'a', say: "Second try. Fine. Faster now." }] },
  ],
  'capact.stage.bad': [
    { id: 'cp7.b1', turns: [{ by: 'a', say: "No! No, no, no." }] },
    { id: 'cp7.b2', turns: [{ by: 'a', say: "That was wrong. I knew it was wrong." }] },
    { id: 'cp7.b3', turns: [{ by: 'a', say: "Why did I do that?" }] },
    { id: 'cp7.b4', turns: [{ by: 'a', say: "Okay. Breathe. There's still time." }] },
    { id: 'cp7.b5', turns: [{ by: 'a', say: "Seriously?" }, { beat: '{a} stares at the clock.' }] },
  ],
  'capact.won.scene': [
    { id: 'cp7.w1', turns: [{ by: 'a', dr: "I beat it, and I came out holding something. I'm not telling a single person what." }] },
    { id: 'cp7.w2', turns: [{ by: 'a', say: "I did it!" }, { by: 'a', dr: "Everyone's going to ask what I got. Everyone's going to get a different answer." }] },
    { id: 'cp7.w3', turns: [{ by: 'a', dr: "A power from a past season, in my pocket. America, thank you." }] },
    { id: 'cp7.w4', turns: [{ by: 'a', dr: "They know I won. They don't know what I won. That's going to drive them crazy." }] },
  ],
  'capact.lost.costume': [
    { id: 'cp7.c1', turns: [{ by: 'a', say: "Don't. Don't say anything." }, { beat: 'The house says something anyway.' }] },
    { id: 'cp7.c2', turns: [{ by: 'a', dr: "America's favourite, and I'm dressed like this for a week. Thanks, America." }] },
    { id: 'cp7.c3', turns: [{ by: 'a', say: "Yes, I lost. Yes, this is my outfit now." }] },
    { id: 'cp7.c4', turns: [{ by: 'a', dr: "Nobody is going to take me seriously this week. I'll have to work twice as hard." }] },
    { id: 'cp7.c5', turns: [{ by: 'a', say: "Go on. Get the laughing out of the way." }] },
  ],
  'capact.lost.slop': [
    { id: 'cp7.s1', turns: [{ by: 'a', dr: "I lost, so it's slop for me this week. Being America's favourite tastes terrible." }] },
    { id: 'cp7.s2', turns: [{ by: 'a', say: "Slop. A whole week of slop." }] },
    { id: 'cp7.s3', turns: [{ by: 'a', dr: "Everybody else gets to eat in front of me for seven days. Great." }] },
  ],
  'capact.tether.scene': [
    { id: 'cp7.t1', turns: [{ by: 'a', say: "Why am I attached to this?" }, { by: 'b', say: "I'm sorry. I'm really sorry." }] },
    { id: 'cp7.t2', turns: [{ by: 'a', dr: "{b} lost the capsule, and I'm the one tied to {b} for a week. I didn't even play." }] },
    { id: 'cp7.t3', turns: [{ by: 'a', say: "We go everywhere together now, don't we?" }, { by: 'b', say: "Everywhere." }] },
    { id: 'cp7.t4', turns: [{ by: 'a', dr: "No private conversations for a week. Not with anybody. Not even with {b}." }] },
  ],
};
