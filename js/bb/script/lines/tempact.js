// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/tempact.js — the Den of Temptation, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// One houseguest alone in a red room, offered a power for free; taking it
// curses somebody else (written by bb/script/ceremony.js). The house is never
// told who took it, so the taker speaks about it only in the Diary Room, and
// a suspicion is said quietly, never as an accusation to a face.
//
//   tempact.offer      a is in the Den, hearing the offer (DR)          scene
//   tempact.accepted   a took it (DR)                                   scene
//   tempact.declined   a turned it down (DR)                            scene
//   tempact.suspect    a thinks b took it                               right | wrong (the viewer knows; a does not)
//   tempact.cursed     a must nominate themselves                       scene
//   tempact.missed     a, the taker, watches the curse miss (DR)        scene
//   tempact.reads      a works out b did it, from c's block             scene

export default {
  'tempact.offer.scene': [
    { id: 'tp7.o1', turns: [{ by: 'a', dr: "A power, for free. The only catch is that somebody else pays for it." }] },
    { id: 'tp7.o2', turns: [{ by: 'a', dr: "The room is red and it's just me and a screen. Ninety seconds to decide." }] },
    { id: 'tp7.o3', turns: [{ by: 'a', dr: "I came in expecting a competition. It's just a chair and an offer." }] },
  ],
  'tempact.accepted.scene': [
    { id: 'tp7.a1', turns: [{ by: 'a', dr: "I took it. Somebody else is going to pay, and I can live with that." }] },
    { id: 'tp7.a2', turns: [{ by: 'a', dr: "I asked if the house would know. They said no. So I said yes." }] },
    { id: 'tp7.a3', turns: [{ by: 'a', dr: "Yes. I didn't even think about it. That's the part that worries me." }] },
    { id: 'tp7.a4', turns: [{ by: 'a', dr: "I've got a power and a secret now. I have to walk out there like nothing happened." }] },
  ],
  'tempact.declined.scene': [
    { id: 'tp7.d1', turns: [{ by: 'a', dr: "I said no. I'm not having somebody else go on the block for my power." }] },
    { id: 'tp7.d2', turns: [{ by: 'a', dr: "I turned it down. Nobody will ever know I did. That's fine." }] },
    { id: 'tp7.d3', turns: [{ by: 'a', dr: "Was it the smart move? Maybe not. I'd still say no again." }] },
  ],
  'tempact.suspect.right': [
    { id: 'tp7.r1', turns: [{ by: 'a', dr: "Somebody took a temptation. My money's on {b}." }] },
    { id: 'tp7.r2', turns: [{ by: 'a', say: "Keep an eye on {b}." }, { by: 'a', dr: "{b} has looked far too relaxed today." }] },
    { id: 'tp7.r3', turns: [{ by: 'a', dr: "It's {b}. I can't prove it. I'm just sure." }] },
  ],
  'tempact.suspect.wrong': [
    { id: 'tp7.w1', turns: [{ by: 'a', dr: "I'd bet anything it was {b}." }] },
    { id: 'tp7.w2', turns: [{ by: 'a', say: "Has anyone else noticed {b} is in a really good mood?" }] },
    { id: 'tp7.w3', turns: [{ by: 'a', dr: "{b} took it. Who else would?" }] },
  ],
  'tempact.cursed.scene': [
    { id: 'tp7.c1', turns: [{ by: 'a', say: "I have to nominate myself? I didn't do anything!" }] },
    { id: 'tp7.c2', turns: [{ by: 'a', dr: "Somebody in this room took something, and I'm the one paying for it. I want to know who." }] },
    { id: 'tp7.c3', turns: [{ by: 'a', say: "Great. Just great." }, { beat: '{a} sits down in the third chair.' }] },
    { id: 'tp7.c4', turns: [{ by: 'a', dr: "I'm on the block because of somebody's greed. I'll find out whose." }] },
  ],
  'tempact.missed.scene': [
    { id: 'tp7.m1', turns: [{ by: 'a', dr: "Everyone was protected, so the curse had nowhere to go. I got it for free." }] },
    { id: 'tp7.m2', turns: [{ by: 'a', dr: "No curse. Nobody pays. Nobody ever finds out. Lucky me." }] },
  ],
  'tempact.reads.scene': [
    { id: 'tp7.x1', turns: [{ by: 'a', dr: "{c} is up because somebody took a temptation. Who's closest to {c}? {b}. That's my answer." }] },
    { id: 'tp7.x2', turns: [{ by: 'a', dr: "Work it backwards. Who gains from {c} being up? {b} keeps coming to mind." }] },
  ],
};
