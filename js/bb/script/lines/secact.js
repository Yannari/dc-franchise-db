// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/secact.js — the second veto, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// A Double, Secret or found veto, used (or not) after the first meeting has
// ended (written by bb/script/ceremony.js). An anonymous medallion's holder
// never speaks about it out loud; the room does not know whose it was.
//
//   secact.still    a, a nominee, waits on a second veto nobody uses      scene
//   secact.kept     a keeps the second veto in their pocket (DR)          scene
//   secact.stand    a stands up after the meeting ended                   public | anon
//   secact.used     a uses it on b (or on themselves)                     public | anon | found | self | selfanon
//   secact.chair    a goes up as the replacement, named by b              hoh | holder
//   secact.cost     a is off the block because of b                       public | anon

export default {
  'secact.still.scene': [
    { id: 'sv8.s1', turns: [{ by: 'a', dr: "There's a second veto in this room. Nobody's moving. That's bad for me." }] },
    { id: 'sv8.s2', turns: [{ by: 'a', dr: "I kept waiting for someone to stand up. Nobody did." }] },
    { id: 'sv8.s3', turns: [{ by: 'a', say: "So that's it?" }, { beat: 'Nobody answers.' }] },
  ],
  'secact.kept.scene': [
    { id: 'sv8.k1', turns: [{ by: 'a', dr: "I'm keeping it. The block is exactly where I want it." }] },
    { id: 'sv8.k2', turns: [{ by: 'a', dr: "Everybody's looking at me. They can keep looking. I'm not using it this week." }] },
    { id: 'sv8.k3', turns: [{ by: 'a', dr: "Using it now would just make enemies. I can wait." }] },
  ],
  'secact.stand.public': [
    { id: 'sv8.p1', turns: [{ by: 'a', say: "Before everyone gets up, I'm not done." }] },
    { id: 'sv8.p2', turns: [{ by: 'a', say: "Sit back down. There's one more thing." }] },
    { id: 'sv8.p3', turns: [{ by: 'a', say: "I've got the other veto, and I'd like to use it." }] },
  ],
  'secact.stand.anon': [
    { id: 'sv8.a1', turns: [{ beat: 'The meeting is over. Then the screen lights up again.' }] },
    { id: 'sv8.a2', turns: [{ beat: 'Everyone is getting up when the screen comes back on.' }] },
  ],
  'secact.used.public': [
    { id: 'sv8.u1', turns: [{ by: 'a', say: "{b}, I'm using this on you. Come off the block." }] },
    { id: 'sv8.u2', turns: [{ by: 'a', say: "I've decided to use the veto on {b}." }, { by: 'b', say: "Thank you. Thank you." }] },
    { id: 'sv8.u3', turns: [{ by: 'a', say: "{b}, you're coming down." }] },
  ],
  'secact.used.anon': [
    { id: 'sv8.n1', turns: [{ beat: "{b}'s face comes off the block on the screen. Nobody can tell who did it." }, { by: 'b', say: "Who did that?" }] },
    { id: 'sv8.n2', turns: [{ by: 'b', say: "Me? Somebody saved me?" }, { by: 'a', dr: "Nobody will ever know it was me." }] },
  ],
  'secact.used.found': [
    { id: 'sv8.f1', turns: [{ by: 'a', say: "I found this in the house. And I'm using it on {b}." }] },
    { id: 'sv8.f2', turns: [{ by: 'a', say: "You didn't know there was another veto. Neither did I, until I found it. {b}, come down." }] },
  ],
  'secact.used.self': [
    { id: 'sv8.m1', turns: [{ by: 'a', say: "I'm using it on myself." }] },
    { id: 'sv8.m2', turns: [{ by: 'a', say: "I'm taking myself off the block." }, { by: 'a', dr: "Nobody else was going to do it for me." }] },
  ],
  'secact.used.selfanon': [
    { id: 'sv8.q1', turns: [{ beat: "{a}'s face comes off the block on the screen." }, { by: 'a', say: "I don't know who did that." }, { by: 'a', dr: "I know exactly who did that." }] },
  ],
  'secact.chair.hoh': [
    { id: 'sv8.c1', turns: [{ by: 'b', say: "I have to name a replacement. {a}, I'm sorry." }, { by: 'a', say: "You're not sorry." }] },
    { id: 'sv8.c2', turns: [{ by: 'b', say: "{a}, you're going up." }, { by: 'a', dr: "I walked into that meeting safe. I'm walking out nominated." }] },
    { id: 'sv8.c3', turns: [{ by: 'a', dr: "The meeting was over. I was safe. Then I wasn't." }] },
  ],
  'secact.chair.holder': [
    { id: 'sv8.h1', turns: [{ by: 'b', say: "And I'm naming {a} to take that seat." }, { by: 'a', say: "You're kidding me." }] },
    { id: 'sv8.h2', turns: [{ by: 'a', dr: "{b} saved someone and put me up in one go. I didn't see it coming." }] },
  ],
  'secact.cost.public': [
    { id: 'sv8.x1', turns: [{ by: 'a', say: "I owe you, {b}." }, { by: 'b', say: "You do." }] },
    { id: 'sv8.x2', turns: [{ by: 'a', dr: "{b} used a whole veto on me. I won't forget that." }] },
    { id: 'sv8.x3', turns: [{ by: 'a', say: "Thank you." }, { by: 'b', dr: "That cost me with half the house. I hope it was worth it." }] },
  ],
  'secact.cost.anon': [
    { id: 'sv8.y1', turns: [{ by: 'a', dr: "Somebody in this house saved me, and I have no idea who. I'd like to thank them." }] },
    { id: 'sv8.y2', turns: [{ by: 'a', dr: "I'm off the block. I don't know who to thank, or who to watch." }] },
  ],
};
