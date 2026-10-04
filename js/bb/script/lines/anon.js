// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/anon.js — the veto week when nobody knows who the HOH is (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The power.js scenes are played with the HOH. On a week the HOH is secret (the
// Invisible HOH, a Coin week) there is nobody to face, so these are the same
// moments without one. Nobody in them names an HOH.
//
//   power.replaced.anon        a went up as the replacement; nobody knows who chose   scene
//   power.saved-self.anon      a won the veto and used it on a.ref                    scene
//   power.replaced-reacts.anon a reacts to being the replacement                      scene
//   power.veto-fallout.anon    a used the veto on b                                   scene
//   power.no-surprise.alone    the veto changed nothing; a watched it                scene
//   power.no-surprise.nominee  the veto changed nothing; a is still on the block      scene

export default {
  'power.replaced.anon': [
    { id: 'an3.r1', turns: [{ by: 'a', dr: "Someone put me on the block, and I don't even know who to be angry with." }] },
    { id: 'an3.r2', turns: [{ by: 'a', dr: "I'm the replacement. Whoever chose me is in this house, smiling at me." }] },
    { id: 'an3.r3', turns: [{ by: 'a', dr: "No face to look at. No one to ask why. Just my name, up there." }] },
    { id: 'an3.r4', turns: [{ by: 'a', dr: "I sat down in the empty chair. I'll find out who put me there." }] },
    { id: 'an3.r5', turns: [{ by: 'a', dr: "Being nominated is bad. Being nominated by nobody I can name is worse." }] },
    { id: 'an3.r6', turns: [{ by: 'a', dr: "Somebody had a choice, and they chose me. I'd like to know who." }] },
  ],
  'power.saved-self.anon': [
    { id: 'an3.s1', turns: [{ by: 'a', dr: "I won the veto and I took myself off. Simple." }] },
    { id: 'an3.s2', turns: [{ by: 'a', dr: "Whoever put me up, I hope they were watching that." }] },
    { id: 'an3.s3', turns: [{ by: 'a', dr: "I don't know who nominated me. I don't need to. I'm off the block." }] },
    { id: 'an3.s4', turns: [{ by: 'a', dr: "Someone's plan just fell apart. I'd love to know whose." }] },
    { id: 'an3.s5', turns: [{ by: 'a', dr: "Best feeling in this house: pulling your own name off that wall." }] },
    { id: 'an3.s6', turns: [{ by: 'a', dr: "I saved myself. Now somebody else is sitting in my chair." }] },
  ],
  'power.replaced-reacts.anon': [
    { id: 'an3.t1', turns: [{ by: 'a', dr: "An hour ago I was safe. Now I'm on the block, and I can't even ask who did it." }] },
    { id: 'an3.t2', turns: [{ by: 'a', dr: "I keep looking round the room for a guilty face. Everyone looks the same." }] },
    { id: 'an3.t3', turns: [{ by: 'a', dr: "I'm angry. I just don't know who at." }] },
    { id: 'an3.t4', turns: [{ by: 'a', dr: "Fine. I'll campaign to everyone. One of them put me here." }] },
    { id: 'an3.t5', turns: [{ by: 'a', dr: "Somebody in this house thinks I'm the easiest one to send home. They're wrong." }] },
    { id: 'an3.t6', turns: [{ by: 'a', dr: "I was safe this morning. I'm not now. That's all I know." }] },
  ],
  'power.veto-fallout.anon': [
    { id: 'an3.f1', turns: [{ by: 'a', say: "You're off." }, { by: 'b', say: "Thank you. I mean it." }] },
    { id: 'an3.f2', turns: [{ by: 'a', dr: "I used the veto on {b}. Whoever made those nominations won't be happy. I don't even know who that is." }] },
    { id: 'an3.f3', turns: [{ by: 'b', dr: "{a} took me off the block. I owe {a} now." }] },
    { id: 'an3.f4', turns: [{ by: 'a', dr: "Somebody's plan just changed. I'll find out whose when they come after me." }] },
    { id: 'an3.f5', turns: [{ by: 'b', say: "Why me?" }, { by: 'a', say: "Because I wanted you here." }] },
    { id: 'an3.f6', turns: [{ by: 'a', dr: "I saved {b} in front of everyone. Now everyone knows where I stand." }] },
  ],
  'power.no-surprise.alone': [
    { id: 'an3.n1', turns: [{ by: 'a', dr: "The veto meeting changed nothing. Nobody's surprised." }] },
    { id: 'an3.n2', turns: [{ by: 'a', dr: "Same block as before. Thursday was decided days ago." }] },
    { id: 'an3.n3', turns: [{ by: 'a', dr: "Nothing happened at the veto meeting. Which means something will happen on Thursday." }] },
    { id: 'an3.n4', turns: [{ by: 'a', dr: "The veto stayed in the box. I could have told you that on Monday." }] },
    { id: 'an3.n5', turns: [{ by: 'a', dr: "Quietest veto meeting of the summer. Nobody moved, nobody spoke." }] },
    { id: 'an3.n6', turns: [{ by: 'a', dr: "No changes. Now it's just counting votes." }] },
  ],
  'power.no-surprise.nominee': [
    { id: 'an3.m1', turns: [{ by: 'a', dr: "Nobody used the veto on me. I wasn't expecting them to." }] },
    { id: 'an3.m2', turns: [{ by: 'a', dr: "Still on the block. Same as this morning. Now I campaign." }] },
    { id: 'an3.m3', turns: [{ by: 'a', dr: "The veto meeting was over in two minutes. I'm still sitting here." }] },
    { id: 'an3.m4', turns: [{ by: 'a', dr: "No changes. I knew there wouldn't be." }] },
    { id: 'an3.m5', turns: [{ by: 'a', dr: "That was my last chance to come off the block without a vote. It's gone." }] },
    { id: 'an3.m6', turns: [{ by: 'a', dr: "Same chairs, same names. It comes down to Thursday now." }] },
  ],
};
