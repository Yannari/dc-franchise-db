// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/mvact.js — the Mystery Competitor and the Mystery Veto (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// Two secret powers that rewrite the veto (written by bb/script/ceremony.js).
// The Mystery Competitor: a former houseguest walks in and plays the veto for
// the holder. The Mystery Veto: one houseguest plays a second veto alone, and
// can use it after the meeting has already ended. Nobody in the house knows
// who summoned the guest, so only the holder and the guest ever say it, in
// private or in the Diary Room.
//
//   mvact.announce   a, the holder, before the door opens (DR)          scene
//   mvact.door       a, the guest, walks in                             native | visiting
//   mvact.bumped     a loses a veto spot to b                           scene
//   mvact.handoff    b (holder) and a (guest), a quiet word              scene
//   mvact.diary      a, the guest, in the Diary Room                    scene
//   mvact.stranger   a, the guest, before the competition (DR)          scene
//   mvact.guestwon   a won the veto for b                               scene
//   mvact.guestlost  a lost it                                          scene
//   mvact.goodbye    a, the guest, leaves                               scene
//   mvact.second     a, holding the Mystery Veto, after the meeting (DR) scene
//   mvact.alone      a plays it alone (DR)                              scene
//   mvact.solo       a's result                                         won | lost
//   mvact.called     a is called back to the living room                scene
//   mvact.used       a uses it on b                                     other | self
//   mvact.pair       a comes down too, as half of a pair                scene
//   mvact.chair      a (HOH) names b                                    scene
//   mvact.empty      a (HOH) has nobody left to name                    scene

export default {
  'mvact.announce.scene': [
    { id: 'mv7.a1', turns: [{ by: 'a', dr: "I know exactly who's about to walk through that door. Nobody else in here does." }] },
    { id: 'mv7.a2', turns: [{ by: 'a', dr: "I've been waiting for this all week. Try not to smile. Try not to smile." }] },
  ],
  'mvact.door.native': [
    { id: 'mv7.d1', turns: [{ by: 'a', say: "Hi, everybody! Did you miss me?" }, { beat: 'The living room screams.' }] },
    { id: 'mv7.d2', turns: [{ by: 'a', say: "I'm back. Only for a day, though." }, { beat: 'Everybody gets up at once.' }] },
  ],
  'mvact.door.visiting': [
    { id: 'mv7.v1', turns: [{ by: 'a', say: "Hello! You don't know me, but I'm playing your veto." }] },
    { id: 'mv7.v2', turns: [{ by: 'a', dr: "I've never lived in this house. I've watched it on television. That's it." }] },
  ],
  'mvact.bumped.scene': [
    { id: 'mv7.b1', turns: [{ by: 'a', say: "I was drawn for the veto! Now I'm not?" }] },
    { id: 'mv7.b2', turns: [{ by: 'a', dr: "I got bumped out of the veto by someone who doesn't even live here." }] },
  ],
  'mvact.handoff.scene': [
    { id: 'mv7.h1', turns: [{ by: 'b', say: "I need you to win this." }, { by: 'a', say: "That's why I'm here." }] },
    { id: 'mv7.h2', turns: [{ by: 'b', say: "Thank you for coming. Seriously." }, { by: 'a', say: "Thank me if I win." }] },
  ],
  'mvact.diary.scene': [
    { id: 'mv7.y1', turns: [{ by: 'a', dr: "I got a phone call a few days ago, and now I'm playing a veto for somebody I barely know." }] },
    { id: 'mv7.y2', turns: [{ by: 'a', dr: "No bed, no vote, no say. Just one competition. Best day I've had in a year." }] },
  ],
  'mvact.stranger.scene': [
    { id: 'mv7.s1', turns: [{ by: 'a', dr: "Let's see if I've still got it." }] },
    { id: 'mv7.s2', turns: [{ by: 'a', dr: "Everybody out here is looking at me like I'm the threat. I am." }] },
  ],
  'mvact.guestwon.scene': [
    { id: 'mv7.w1', turns: [{ by: 'a', say: "That one's for you, {b}." }, { by: 'b', say: "I can't believe you did it." }] },
    { id: 'mv7.w2', turns: [{ by: 'a', dr: "I came in for one afternoon and won the veto. I've still got it." }] },
  ],
  'mvact.guestlost.scene': [
    { id: 'mv7.l1', turns: [{ by: 'a', dr: "I came all this way and I lost. Sorry, {b}." }] },
    { id: 'mv7.l2', turns: [{ by: 'a', say: "I gave it everything." }, { by: 'b', say: "I know you did." }] },
  ],
  'mvact.goodbye.scene': [
    { id: 'mv7.g1', turns: [{ by: 'a', say: "Good luck, everyone. Seriously." }, { beat: '{a} walks back out of the front door.' }] },
    { id: 'mv7.g2', turns: [{ by: 'a', say: "That was fun. Bye!" }] },
  ],
  'mvact.second.scene': [
    { id: 'mv7.c1', turns: [{ by: 'a', dr: "Everyone thinks the veto meeting is over. Not for me." }] },
    { id: 'mv7.c2', turns: [{ by: 'a', dr: "There's one more competition tonight, and I'm the only one playing it." }] },
  ],
  'mvact.alone.scene': [
    { id: 'mv7.o1', turns: [{ by: 'a', dr: "No one to beat. Just a number. Somehow that's worse." }] },
    { id: 'mv7.o2', turns: [{ by: 'a', say: "Okay. Just me." }] },
  ],
  'mvact.solo.won': [
    { id: 'mv7.x1', turns: [{ by: 'a', say: "Yes!" }, { by: 'a', dr: "A real veto, and the house has no idea it's coming." }] },
    { id: 'mv7.x2', turns: [{ by: 'a', dr: "I beat it. Now I get to change the block everybody thinks is settled." }] },
  ],
  'mvact.solo.lost': [
    { id: 'mv7.z1', turns: [{ by: 'a', dr: "Nobody was even playing against me, and I still lost." }] },
    { id: 'mv7.z2', turns: [{ by: 'a', say: "No. No!" }] },
  ],
  'mvact.called.scene': [
    { id: 'mv7.k1', turns: [{ by: 'a', say: "Why are we back in here? The meeting's over." }] },
    { id: 'mv7.k2', turns: [{ by: 'a', say: "What now?" }, { beat: 'Everybody sits down again, slowly.' }] },
  ],
  'mvact.used.other': [
    { id: 'mv7.u1', turns: [{ by: 'a', say: "I have another veto. And I'm using it on {b}." }, { by: 'b', say: "What?" }] },
    { id: 'mv7.u2', turns: [{ by: 'a', say: "{b}, come off the block." }] },
  ],
  'mvact.used.self': [
    { id: 'mv7.f1', turns: [{ by: 'a', say: "I have another veto, and I'm using it on myself." }] },
  ],
  'mvact.pair.scene': [
    { id: 'mv7.p1', turns: [{ by: 'a', say: "I'm off too? Because of the pair?" }] },
  ],
  'mvact.chair.scene': [
    { id: 'mv7.r1', turns: [{ by: 'a', say: "I have to name a replacement. {b}, take a seat." }, { by: 'b', say: "You're kidding." }] },
    { id: 'mv7.r2', turns: [{ by: 'a', dr: "My block was settled. Now I'm picking again in the middle of the night." }] },
  ],
  'mvact.empty.scene': [
    { id: 'mv7.e1', turns: [{ by: 'a', say: "There's nobody left I can put up." }] },
  ],
};
