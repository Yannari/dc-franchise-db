// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/expact.js — a power that was never played (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// A note to the viewer only: the house never knew the power existed, so the
// holder talks about it in the Diary Room and nowhere else (written by
// bb/script/ceremony.js). The power's name is on the card, not in the line.
//
//   expact.gone   a's power ran out of time, unplayed      expired
//                 a was evicted still holding it            evicted

export default {
  'expact.gone.expired': [
    { id: 'ex7.e1', turns: [{ by: 'a', dr: "My power ran out tonight. I never used it. I kept waiting for the right week, and it never came." }] },
    { id: 'ex7.e2', turns: [{ by: 'a', dr: "I carried that thing around in secret. Now it's gone, and nobody will ever know I had it." }] },
    { id: 'ex7.e5', turns: [{ by: 'a', dr: "Gone. I never even came close to using it." }] },
    { id: 'ex7.e6', turns: [{ by: 'a', dr: "I kept telling myself next week. Then there wasn't a next week." }] },
    { id: 'ex7.e7', turns: [{ by: 'a', dr: "It's expired. Honestly, I'd forgotten I had it some days." }] },
    { id: 'ex7.e3', turns: [{ by: 'a', dr: "I was saving it for an emergency. I guess I never had one. That's a good thing. I think." }] },
    { id: 'ex7.e4', turns: [{ by: 'a', dr: "It expired. I'm a bit annoyed with myself. Only a bit." }] },
  ],
  'expact.gone.evicted': [
    { id: 'ex7.v1', turns: [{ by: 'a', dr: "I walked out with my power still in my pocket. That's going to haunt me." }] },
    { id: 'ex7.v2', turns: [{ by: 'a', dr: "I had a power the whole time, and I didn't use it to save myself. I really thought I was safe." }] },
    { id: 'ex7.v3', turns: [{ by: 'a', dr: "Nobody in there ever knew what I had. Now they never will." }] },
    { id: 'ex7.v4', turns: [{ by: 'a', dr: "I should have played it. I know that now." }] },
  ],
};
