// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/quietact.js — No Eviction and Dead Last, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// Two small rule changes to a week (written by bb/script/ceremony.js).
//
//   quietact.none   a hears there is no eviction this week          scene
//   quietact.idle   a is HOH with nobody to nominate (DR)           scene
//   quietact.last   a came last in the HOH comp and is nominated    plain | threw

export default {
  'quietact.none.scene': [
    { id: 'qe7.n1', turns: [{ by: 'a', say: "Nobody's going home this week? I'll take it." }] },
    { id: 'qe7.n2', turns: [{ by: 'a', dr: "A week with no eviction. Everyone's relaxed. I don't trust it." }] },
    { id: 'qe7.n3', turns: [{ by: 'a', say: "So we just... live here this week?" }] },
  ],
  'quietact.idle.scene': [
    { id: 'qe7.i1', turns: [{ by: 'a', dr: "I'm Head of Household, and there's nobody to nominate. Best week ever, or worst. I can't decide." }] },
    { id: 'qe7.i2', turns: [{ by: 'a', dr: "Nice room. No power. I'll enjoy the room." }] },
  ],
  'quietact.last.plain': [
    { id: 'qe7.l1', turns: [{ by: 'a', say: "Last place, and that puts me on the block? Great." }] },
    { id: 'qe7.l2', turns: [{ by: 'a', dr: "I came last, so I'm nominated before the HOH even opens their mouth." }] },
    { id: 'qe7.l3', turns: [{ by: 'a', dr: "Of all the weeks to come last." }] },
  ],
  'quietact.last.threw': [
    { id: 'qe7.t1', turns: [{ by: 'a', dr: "Yes, I threw it. No, I didn't think it through." }] },
    { id: 'qe7.t2', turns: [{ by: 'a', dr: "I threw the competition in the one week where last place goes on the block. Not my finest moment." }] },
  ],
};
