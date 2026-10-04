// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/pwact.js — a power, played in front of the house (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// The shared moments when somebody spends a power (written by
// bb/script/ceremony.js). Big Brother names the power; these are the people
// in the room. {who} is the name the power lands on.
//
//   pwact.lobby    a asks b (the Relic holder) for a place          target | vote | safety | plea | loyalty | no
//   pwact.broken   a was promised a place by b and is left out       scene
//   pwact.relic    a names the four who may play for HOH             self | notself
//   pwact.cloud    a plays the Cloud and cannot be nominated         scene
//   pwact.buyoff   a pays b (the HOH) to come off; {who} goes up    scene
//   pwact.coup     a overrules b (the HOH) at the veto meeting       scene

export default {
  'pwact.lobby.target': [
    { id: 'pw7.t1', turns: [{ by: 'a', say: "Put me in, and I'll go after whoever you want." }, { by: 'b', say: "Deal." }] },
    { id: 'pw7.t2', turns: [{ by: 'a', say: "Let me play. If I win, I'll put up your target." }, { by: 'b', say: "You're in." }] },
  ],
  'pwact.lobby.vote': [
    { id: 'pw7.v1', turns: [{ by: 'a', say: "Pick me, and you've got my vote. Any week, no questions." }, { by: 'b', say: "Okay. You're in." }] },
    { id: 'pw7.v2', turns: [{ by: 'a', say: "One vote, whenever you need it. That's my offer." }, { by: 'b', say: "I'll take it." }] },
  ],
  'pwact.lobby.safety': [
    { id: 'pw7.s1', turns: [{ by: 'a', say: "If I win, you're safe. I promise." }, { by: 'b', say: "Then you're playing." }] },
    { id: 'pw7.s2', turns: [{ by: 'a', say: "Put me in. If I'm HOH, you won't go up." }, { by: 'b', say: "Deal." }] },
  ],
  'pwact.lobby.plea': [
    { id: 'pw7.p1', turns: [{ by: 'a', say: "I don't have anything to offer. I'm just asking." }, { by: 'b', say: "That's honest. Okay." }] },
    { id: 'pw7.p2', turns: [{ by: 'a', say: "Please. I really want to play." }, { by: 'b', say: "Fine. You're in." }] },
  ],
  'pwact.lobby.loyalty': [
    { id: 'pw7.l1', turns: [{ by: 'a', say: "All I've got is loyalty. You'll have it." }, { by: 'b', say: "Then you're in." }] },
    { id: 'pw7.l2', turns: [{ by: 'a', say: "I'll be on your side. That's what I'm offering." }, { by: 'b', say: "Okay." }] },
  ],
  'pwact.lobby.no': [
    { id: 'pw7.n1', turns: [{ by: 'a', say: "So? Am I playing?" }, { by: 'b', say: "I'll think about it." }, { by: 'a', dr: "'I'll think about it' means no." }] },
    { id: 'pw7.n2', turns: [{ by: 'a', say: "I'd really like to play." }, { by: 'b', say: "I hear you." }, { by: 'a', dr: "That's not a yes." }] },
    { id: 'pw7.n3', turns: [{ by: 'a', dr: "I made my case to {b}. {b} just nodded. I don't like nodding." }] },
    { id: 'pw7.n4', turns: [{ by: 'a', say: "Can I count on you?" }, { by: 'b', say: "We'll see." }] },
    { id: 'pw7.n5', turns: [{ by: 'a', dr: "I asked {b} straight out. I didn't get a straight answer." }] },
    { id: 'pw7.n6', turns: [{ by: 'a', say: "Think about me, okay?" }, { by: 'b', say: "I'm thinking about everyone." }] },
  ],
  'pwact.broken.scene': [
    { id: 'pw7.b1', turns: [{ by: 'a', say: "You told me yes." }, { by: 'b', say: "I know. I'm sorry." }] },
    { id: 'pw7.b2', turns: [{ by: 'a', dr: "{b} promised me a place, then read out four names without mine. On night one." }] },
    { id: 'pw7.b3', turns: [{ by: 'a', say: "Wow. Okay." }, { by: 'a', dr: "I'll remember that, {b}." }] },
  ],
  'pwact.relic.self': [
    { id: 'pw7.r1', turns: [{ by: 'a', dr: "I put myself in. Why would I hand the HOH to someone else if I can win it?" }] },
    { id: 'pw7.r2', turns: [{ by: 'a', say: "And the fourth name is... me." }] },
    { id: 'pw7.r3', turns: [{ by: 'a', dr: "I picked three people I think I can beat. And me." }] },
  ],
  'pwact.relic.notself': [
    { id: 'pw7.o1', turns: [{ by: 'a', dr: "I left myself out. I'd rather pick a friendly HOH than try to win it myself." }] },
    { id: 'pw7.o2', turns: [{ by: 'a', dr: "Whoever wins out of those four owes me. That's better than winning." }] },
    { id: 'pw7.o3', turns: [{ by: 'a', say: "That's my four. I'm not playing." }] },
  ],
  'pwact.cloud.scene': [
    { id: 'pw7.c1', turns: [{ by: 'a', dr: "I knew my name was going up. Not this week." }] },
    { id: 'pw7.c2', turns: [{ by: 'a', say: "Sorry, {b}. You'll have to pick someone else." }] },
    { id: 'pw7.c3', turns: [{ by: 'a', dr: "It only protects me at the nominations. The veto meeting is a different problem. One thing at a time." }] },
  ],
  'pwact.buyoff.scene': [
    { id: 'pw7.y1', turns: [{ by: 'a', say: "Here's ten thousand dollars, {b}. I'm coming off." }, { by: 'b', say: "You're joking." }] },
    { id: 'pw7.y2', turns: [{ by: 'a', dr: "That money I won? It was never about the money." }, { by: 'b', dr: "I had no say. I had to put {who} up on the spot." }] },
    { id: 'pw7.y3', turns: [{ by: 'a', say: "I'm buying my way off the block." }, { beat: '{who} looks at {b}, then at the empty chair.' }] },
  ],
  'pwact.coup.scene': [
    { id: 'pw7.u1', turns: [{ by: 'a', say: "Sorry, {b}. This week's nominations are mine now." }] },
    { id: 'pw7.u2', turns: [{ by: 'b', dr: "I'm Head of Household, and {a} just took my whole week apart. In front of everyone." }] },
    { id: 'pw7.u3', turns: [{ by: 'a', dr: "{b} did all the work. I just changed the ending." }] },
  ],
};
