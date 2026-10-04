// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/hexact.js — the Halting Hex, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// A power that cancels the eviction, played after the result is read (written
// by bb/script/ceremony.js). Votes are secret: nobody learns who voted which
// way, so no line claims to.
//
//   hexact.stop    a stops the eviction (b is the evictee)     self | other
//   hexact.after   a, a nominee, takes in a night nobody left   scene

export default {
  'hexact.stop.self': [
    { id: 'hx7.s1', turns: [{ by: 'a', say: "Not tonight. I'm playing the Halting Hex." }, { beat: 'Nobody in the room moves.' }] },
    { id: 'hx7.s2', turns: [{ by: 'a', say: "Sorry, everyone. I'm not going anywhere." }] },
  ],
  'hexact.stop.other': [
    { id: 'hx7.o1', turns: [{ by: 'a', say: "Wait. I have the Halting Hex, and I'm using it." }, { by: 'b', say: "You're saving me?" }] },
    { id: 'hx7.o2', turns: [{ by: 'a', say: "{b} isn't leaving tonight." }, { beat: 'The whole house turns to look at {a}.' }] },
  ],
  'hexact.after.scene': [
    { id: 'hx7.a1', turns: [{ by: 'a', dr: "Nobody went home tonight. I'm still trying to work out what that means for me." }] },
    { id: 'hx7.a2', turns: [{ by: 'a', dr: "All those votes, and none of them counted. Whoever voted for me is still in here, though." }] },
  ],
};
