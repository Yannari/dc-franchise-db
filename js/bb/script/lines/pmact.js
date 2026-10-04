// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/pmact.js — premiere night, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// The host and the relic are gone; two groups hunt the house on night one
// (written by bb/script/ceremony.js). These people have known each other for
// a few hours: nobody has history, and nobody talks as if they do. {room} is
// a place in the house ("the storeroom"), always mid-sentence.
//
//   pmact.warm       a, searching, feels close in {room}            scene
//   pmact.together   a and b meet in {room} and actually talk       scene
//   pmact.collide    a and b search {room} around each other        scene
//   pmact.withheld   a keeps a lead from b                          scene
//   pmact.found      a finds it                                     relic | host
//   pmact.night      a has the relic; b has the host and the money  scene
//   pmact.secret     a learns the money is a power (DR)             scene

export default {
  'pmact.warm.scene': [
    { id: 'pm7.w1', turns: [{ by: 'a', dr: "There's something in {room}. I just can't find it yet." }] },
    { id: 'pm7.w2', turns: [{ by: 'a', say: "Has anyone checked {room} properly?" }] },
    { id: 'pm7.w3', turns: [{ by: 'a', dr: "I keep ending up in {room}. That has to mean something." }] },
    { id: 'pm7.w4', turns: [{ by: 'a', say: "Hang on. Something's off in here." }] },
    { id: 'pm7.w5', turns: [{ by: 'a', dr: "I'm not saying anything yet, but I'm going back to {room}." }] },
    { id: 'pm7.w6', turns: [{ by: 'a', say: "Is it me, or is {room} weirdly tidy?" }] },
  ],
  'pmact.together.scene': [
    { id: 'pm7.t1', turns: [{ by: 'a', say: "Find anything?" }, { by: 'b', say: "Nothing. Where are you from, anyway?" }] },
    { id: 'pm7.t2', turns: [{ by: 'a', say: "I think we're the only two not panicking." }, { by: 'b', say: "Give it an hour." }] },
    { id: 'pm7.t3', turns: [{ by: 'b', dr: "{a} and I stopped searching and just talked. First real conversation I've had in here." }] },
  ],
  'pmact.collide.scene': [
    { id: 'pm7.c1', turns: [{ by: 'a', say: "Oh. You're in here too." }, { by: 'b', say: "Looks like it." }, { beat: 'Neither of them leaves.' }] },
    { id: 'pm7.c2', turns: [{ by: 'b', dr: "{a} kept searching right next to me and didn't say a word. Noted." }] },
  ],
  'pmact.withheld.scene': [
    { id: 'pm7.k1', turns: [{ by: 'b', say: "Have you checked {room}?" }, { by: 'a', say: "Not really." }, { by: 'a', dr: "I've checked it twice." }] },
    { id: 'pm7.k2', turns: [{ by: 'a', dr: "I think I know where it is. I'm not telling anyone. Not on night one." }] },
  ],
  'pmact.found.relic': [
    { id: 'pm7.r1', turns: [{ by: 'a', say: "I've got it! I've got the relic!" }] },
    { id: 'pm7.r2', turns: [{ by: 'a', dr: "Night one, and I'm picking who plays for HOH. No pressure." }] },
  ],
  'pmact.found.host': [
    { id: 'pm7.h1', turns: [{ by: 'a', say: "I found her! She's in here!" }] },
    { id: 'pm7.h2', turns: [{ by: 'a', say: "Everyone! Over here!" }] },
  ],
  'pmact.night.scene': [
    { id: 'pm7.n1', turns: [{ by: 'b', say: "Ten thousand dollars? On night one?" }, { by: 'a', dr: "Everyone's looking at the money. Nobody's looking at the relic. Good." }] },
    { id: 'pm7.n2', turns: [{ by: 'a', dr: "I get to pick who plays for HOH. That's going to make me some friends and some enemies." }] },
  ],
  'pmact.secret.scene': [
    { id: 'pm7.s1', turns: [{ by: 'a', dr: "It's not just money. It's a way off the block. Nobody else knows that." }] },
    { id: 'pm7.s2', turns: [{ by: 'a', dr: "Everyone thinks I won ten thousand dollars. I won a lot more than that." }] },
  ],
};
