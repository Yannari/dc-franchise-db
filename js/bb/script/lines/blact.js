// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/blact.js — the Bonus Life, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// A power that can undo an eviction on the night (written by
// bb/script/ceremony.js). Kept in a pocket, the holder says so only in the
// Diary Room; played, it is played in front of everybody. The walk back in
// is lines/bkact.js, shared with Battle Back.
//
//   blact.hoard     a keeps it while b is evicted (DR)            scene
//   blact.auto      a, tonight's evictee, gets it by default      scene
//   blact.self      a plays it on themselves                      scene
//   blact.ally      a plays it on b                               scene
//   blact.reentry   a plays the re-entry competition alone        scene
//   blact.won       a beats the standard                          scene
//   blact.lost      a misses it                                   scene

export default {
  'blact.hoard.scene': [
    { id: 'bl7.h1', turns: [{ by: 'a', dr: "I could have saved {b} tonight. I didn't. I need it more later." }] },
    { id: 'bl7.h2', turns: [{ by: 'a', dr: "{b} walked out, and I kept my hand in my pocket. Nobody will ever know." }] },
  ],
  'blact.auto.scene': [
    { id: 'bl7.a1', turns: [{ by: 'a', say: "Wait. What's happening?" }] },
    { id: 'bl7.a2', turns: [{ by: 'a', dr: "I was halfway to the door. Then they told me I had one more chance." }] },
  ],
  'blact.self.scene': [
    { id: 'bl7.s1', turns: [{ by: 'a', say: "Not so fast. I've got a Bonus Life." }] },
    { id: 'bl7.s2', turns: [{ by: 'a', dr: "My name came out, and I'd been carrying this the whole time. Easy decision." }] },
  ],
  'blact.ally.scene': [
    { id: 'bl7.l1', turns: [{ by: 'a', say: "{b}, you're not going yet. I'm using my Bonus Life on you." }, { by: 'b', say: "What?" }] },
    { id: 'bl7.l2', turns: [{ by: 'a', dr: "I could have kept it for myself. {b} is worth it." }] },
  ],
  'blact.reentry.scene': [
    { id: 'bl7.r1', turns: [{ by: 'a', dr: "One competition, just me, against a number. No pressure." }] },
    { id: 'bl7.r2', turns: [{ by: 'a', say: "Okay. One shot." }] },
  ],
  'blact.won.scene': [
    { id: 'bl7.w1', turns: [{ by: 'a', say: "I did it!" }] },
    { id: 'bl7.w2', turns: [{ by: 'a', dr: "Evicted, then not evicted, in the same night." }] },
  ],
  'blact.lost.scene': [
    { id: 'bl7.x1', turns: [{ by: 'a', dr: "I had a second chance, and I couldn't take it. That's worse than the vote." }] },
    { id: 'bl7.x2', turns: [{ by: 'a', say: "That's it, then." }] },
  ],
};
