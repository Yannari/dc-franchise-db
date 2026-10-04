// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/bkact.js — Battle Back, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// Evicted houseguests fight for one place back in the house (written by
// bb/script/ceremony.js). Also the return through the same door after a Bonus
// Life. Votes are secret: a returnee may know HOW MANY voted them out, never
// who, so no line names a voter.
//
//   bkact.open       a, an evictee, sees the house again           scene
//   bkact.heat       a finishes in the top two                     scene
//   bkact.duel       a beats b                                     scene
//   bkact.out        a is out, for good                            scene
//   bkact.champion   a defends the door against b                  scene
//   bkact.held       a held the door; b does not come back         scene
//   bkact.back       a walks back in                               voted | clean

export default {
  'bkact.open.scene': [
    { id: 'bk7.o1', turns: [{ by: 'a', say: "I never thought I'd see this place again." }] },
    { id: 'bk7.o2', turns: [{ by: 'a', dr: "They told us we were done. Turns out we're not. Only one of us gets back in, though." }] },
    { id: 'bk7.o3', turns: [{ by: 'a', say: "Hello again, everybody." }, { beat: 'Nobody in the yard quite knows where to look.' }] },
  ],
  'bkact.heat.scene': [
    { id: 'bk7.h1', turns: [{ by: 'a', dr: "Top two. One more to beat, and I'm back." }] },
    { id: 'bk7.h2', turns: [{ by: 'a', say: "Still alive!" }] },
  ],
  'bkact.duel.scene': [
    { id: 'bk7.d1', turns: [{ by: 'a', say: "Yes!" }, { by: 'b', say: "Good game." }] },
    { id: 'bk7.d2', turns: [{ by: 'a', dr: "{b} had me for most of it. I took it right at the end." }] },
    { id: 'bk7.d3', turns: [{ by: 'b', say: "That was close." }, { by: 'a', say: "Too close." }] },
    { id: 'bk7.d4', turns: [{ by: 'a', dr: "I wasn't going home twice. Not to {b}." }] },
  ],
  'bkact.out.scene': [
    { id: 'bk7.x1', turns: [{ by: 'a', dr: "Evicted, and now beaten for the second chance too. That one hurts." }] },
    { id: 'bk7.x2', turns: [{ by: 'a', say: "That's me done. Properly done." }] },
    { id: 'bk7.x3', turns: [{ by: 'a', dr: "I'd rather have gone out in the house than out here." }] },
    { id: 'bk7.x4', turns: [{ by: 'a', say: "Go get them." }, { beat: '{a} shakes hands and walks off without looking back.' }] },
  ],
  'bkact.champion.scene': [
    { id: 'bk7.c1', turns: [{ by: 'a', dr: "The house picked me to keep {b} out. No pressure." }] },
    { id: 'bk7.c2', turns: [{ by: 'a', say: "Sorry, {b}. You're not coming back in." }, { by: 'b', say: "We'll see." }] },
  ],
  'bkact.held.scene': [
    { id: 'bk7.e1', turns: [{ by: 'a', say: "I held the door!" }, { by: 'b', dr: "One round. I was one round away." }] },
    { id: 'bk7.e2', turns: [{ by: 'b', dr: "I beat everyone else to get here, and {a} sent me home anyway." }] },
  ],
  'bkact.back.voted': [
    { id: 'bk7.v1', turns: [{ by: 'a', say: "Miss me?" }, { by: 'a', dr: "Some of you voted me out. I don't know which of you. Yet." }] },
    { id: 'bk7.v2', turns: [{ by: 'a', dr: "I'm back with no safety at all. And a pretty good idea of who wanted me gone." }] },
    { id: 'bk7.v3', turns: [{ by: 'a', say: "Surprise." }, { beat: 'Half the house cheers. The other half smiles very hard.' }] },
  ],
  'bkact.back.clean': [
    { id: 'bk7.n1', turns: [{ by: 'a', say: "I'm back!" }, { beat: 'The house cheers.' }] },
    { id: 'bk7.n2', turns: [{ by: 'a', dr: "Nobody's going to make it easy for me. But I'm back in the game." }] },
  ],
};
