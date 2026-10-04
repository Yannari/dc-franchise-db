// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/coinact.js — the Coin of Destiny, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// Pay in, play, and call a coin toss in private (written by
// bb/script/ceremony.js). Buying in is public. Who won the game, and whether
// they called it right, is not: the winner only speaks in the Diary Room, and
// the house never learns who rewrote the block.
//
//   coinact.buyin       a pays in, in front of the house            scene
//   coinact.declined    a keeps out of it                           scene
//   coinact.short       a wants in and cannot pay                   scene
//   coinact.empty       a: nobody could pay                         scene
//   coinact.holds       a won the game and holds the coin (DR)      scene
//   coinact.wrong       a called the toss wrong (DR)                scene
//   coinact.rewritten   a is nominated; b, the HOH, did not do it    scene

export default {
  'coinact.buyin.scene': [
    { id: 'co7.b1', turns: [{ by: 'a', say: "I'm in." }, { beat: 'The room watches {a} pay.' }] },
    { id: 'co7.b2', turns: [{ by: 'a', dr: "Everyone saw me buy in. Now everyone knows I want something. That's the price." }] },
    { id: 'co7.b3', turns: [{ by: 'a', say: "Why not? It's only a coin." }] },
    { id: 'co7.b4', turns: [{ by: 'a', dr: "I waited to see who else would pay first. Then I paid." }] },
    { id: 'co7.b5', turns: [{ by: 'a', say: "Count me in." }, { by: 'a', dr: "If I win this, the HOH isn't the HOH any more." }] },
    { id: 'co7.b6', turns: [{ by: 'a', dr: "Buying in tells the whole house I'm worried. I am worried." }] },
  ],
  'coinact.declined.scene': [
    { id: 'co7.d1', turns: [{ by: 'a', dr: "I'm keeping my money. If I buy in, everyone thinks I'm scared." }] },
    { id: 'co7.d2', turns: [{ by: 'a', say: "Not for me. Good luck, though." }] },
    { id: 'co7.d3', turns: [{ by: 'a', dr: "A coin toss? With my game? No, thank you." }] },
  ],
  'coinact.short.scene': [
    { id: 'co7.s1', turns: [{ by: 'a', say: "I'm short." }, { beat: '{a} counts it again. Still short.' }] },
    { id: 'co7.s2', turns: [{ by: 'a', dr: "I wanted in, and I couldn't afford it. In front of everybody." }] },
    { id: 'co7.s3', turns: [{ by: 'a', say: "How much? I don't have that." }] },
    { id: 'co7.s4', turns: [{ by: 'a', dr: "I should have saved my money. I know that now." }] },
  ],
  'coinact.empty.scene': [
    { id: 'co7.e1', turns: [{ by: 'a', dr: "Nobody in this house can afford it. We spent it all already." }] },
    { id: 'co7.e2', turns: [{ by: 'a', say: "So nobody's playing? Great." }] },
  ],
  'coinact.holds.scene': [
    { id: 'co7.h1', turns: [{ by: 'a', dr: "I won the game. Now it all comes down to one coin toss, and nobody's watching." }] },
    { id: 'co7.h2', turns: [{ by: 'a', dr: "I've got the coin. Heads or tails decides this whole week." }] },
    { id: 'co7.h3', turns: [{ by: 'a', dr: "Out there, nobody knows I won. In here, I've got the coin in my hand." }] },
  ],
  'coinact.wrong.scene': [
    { id: 'co7.w1', turns: [{ by: 'a', dr: "I called it wrong. All that for nothing." }] },
    { id: 'co7.w2', turns: [{ by: 'a', dr: "Fifty-fifty, and I lost. At least nobody knows I got that far." }] },
    { id: 'co7.w3', turns: [{ by: 'a', dr: "Wrong side. I paid, I won the game, and I still lost." }] },
  ],
  'coinact.rewritten.scene': [
    { id: 'co7.r1', turns: [{ by: 'a', say: "Who did this?" }, { by: 'b', say: "It wasn't me. I promise you, it wasn't me." }] },
    { id: 'co7.r2', turns: [{ by: 'b', dr: "I'm the Head of Household, and I didn't pick these nominees. Somebody who bought in did." }] },
    { id: 'co7.r3', turns: [{ by: 'a', dr: "One of the people who paid in put me here. I'm going to find out which one." }] },
    { id: 'co7.r4', turns: [{ by: 'a', say: "You must know who it was." }, { by: 'b', say: "I don't. Nobody does." }] },
  ],
};
