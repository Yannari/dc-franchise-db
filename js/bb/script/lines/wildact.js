// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/wildact.js — the Wildcard, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// What houseguests say when three names come out of a hat, play for safety,
// and the winner is offered it at a price (written by bb/script/ceremony.js).
// Big Brother names the price on its own line; these lines never do, because
// "Hamazon" and "a week on slop" do not fit the same sentence. Nothing here
// assumes the price is a costume.
//
//   wildact.drawn     a's name comes out of the hat              first | next
//   wildact.missed    a was not drawn                            scene
//   wildact.played    a plays the puzzle                         best | rest
//   wildact.took      a, the winner, takes safety                solo | house
//   wildact.bill      a pays for b's safety ({count} pay)        scene
//   wildact.refused   a, the winner, turns safety down           scene
//   wildact.blocked   a turned it down while on the block        scene

export default {
  'wildact.drawn.first': [
    { id: 'wc7.f1', turns: [{ by: 'a', say: "Me? First?" }] },
    { id: 'wc7.f2', turns: [{ by: 'a', dr: "First name out of the hat, and it's mine. I wasn't ready for that." }] },
    { id: 'wc7.f3', turns: [{ by: 'a', say: "Of course it's me." }, { beat: 'The room laughs. {a} does not.' }] },
    { id: 'wc7.f4', turns: [{ by: 'a', dr: "I didn't ask to play. That's the whole point of a hat, I suppose." }] },
    { id: 'wc7.f5', turns: [{ by: 'a', say: "Okay. Okay. I'm in." }] },
    { id: 'wc7.f6', turns: [{ by: 'a', dr: "My name came out first. I'm taking that as a good sign." }] },
  ],
  'wildact.drawn.next': [
    { id: 'wc7.n1', turns: [{ by: 'a', say: "Oh, come on." }] },
    { id: 'wc7.n2', turns: [{ by: 'a', dr: "I was having a quiet week. Not any more." }] },
    { id: 'wc7.n3', turns: [{ by: 'a', say: "Fine. Let's play." }] },
    { id: 'wc7.n4', turns: [{ by: 'a', dr: "I'm already thinking about what I'd say if I win and they offer me something." }] },
    { id: 'wc7.n5', turns: [{ by: 'a', say: "Right, then." }, { beat: '{a} stands up and walks over to the others.' }] },
    { id: 'wc7.n6', turns: [{ by: 'a', dr: "Out of everybody in the house, it's me. I'll take the chance." }] },
  ],
  'wildact.missed.scene': [
    { id: 'wc7.m1', turns: [{ by: 'a', dr: "My name didn't come out. I'd have won it, though. Easy to say now." }] },
    { id: 'wc7.m2', turns: [{ by: 'a', dr: "Not drawn. Honestly? I'm relieved. I don't want to be offered anything with a price on it." }] },
    { id: 'wc7.m3', turns: [{ by: 'a', say: "Good luck, all of you." }, { by: 'a', dr: "I meant about half of that." }] },
    { id: 'wc7.m4', turns: [{ by: 'a', dr: "I get to sit and watch someone else make a hard choice. That's a nice change." }] },
    { id: 'wc7.m5', turns: [{ by: 'a', dr: "I wanted my name to come out. I need safety this week more than any of them." }] },
    { id: 'wc7.m6', turns: [{ by: 'a', say: "Not me. Fine." }] },
  ],
  'wildact.played.best': [
    { id: 'wc7.b1', turns: [{ by: 'a', dr: "I saw the pattern straight away. After that it was just about not panicking." }] },
    { id: 'wc7.b2', turns: [{ by: 'a', say: "Done! Is that right? Tell me that's right." }] },
    { id: 'wc7.b3', turns: [{ by: 'a', dr: "I got it wrong once, then everything clicked." }] },
    { id: 'wc7.b4', turns: [{ by: 'a', say: "Yes! Yes!" }, { beat: '{a} slams the last piece down.' }] },
    { id: 'wc7.b5', turns: [{ by: 'a', dr: "I took my time, and it was worth it." }] },
    { id: 'wc7.b6', turns: [{ by: 'a', dr: "I don't know how I did that. I'll take it." }] },
  ],
  'wildact.played.rest': [
    { id: 'wc7.r1', turns: [{ by: 'a', say: "Nope. Nope. Wrong again." }] },
    { id: 'wc7.r2', turns: [{ by: 'a', dr: "I was close. Close doesn't get you anything in this house." }] },
    { id: 'wc7.r3', turns: [{ by: 'a', dr: "I panicked halfway through and never got it back." }] },
    { id: 'wc7.r4', turns: [{ by: 'a', say: "I give up. No, I don't. Yes, I do." }] },
    { id: 'wc7.r5', turns: [{ by: 'a', dr: "I knew it wasn't going to be me as soon as I looked at the board." }] },
    { id: 'wc7.r6', turns: [{ by: 'a', dr: "I kept moving the same two pieces around. That's not a strategy." }] },
  ],
  'wildact.took.solo': [
    { id: 'wc7.s1', turns: [{ by: 'a', say: "Yes. I'll take it." }, { by: 'a', dr: "Safe for a week. I'll pay whatever it costs." }] },
    { id: 'wc7.s2', turns: [{ by: 'a', dr: "I'm not going on the block this week. That's worth anything they want to throw at me." }] },
    { id: 'wc7.s3', turns: [{ by: 'a', say: "Safety? Yes. Easy." }] },
    { id: 'wc7.s4', turns: [{ by: 'a', dr: "This week is going to cost me something. A week on the block would have cost more." }] },
    { id: 'wc7.s5', turns: [{ by: 'a', say: "I'll do it." }, { beat: 'The room cheers.' }] },
    { id: 'wc7.s6', turns: [{ by: 'a', dr: "Is it going to be a long week? Yes. Am I safe? Also yes." }] },
  ],
  'wildact.took.house': [
    { id: 'wc7.h1', turns: [{ by: 'a', say: "I'm taking it." }, { beat: 'Nobody in the room says anything.' }] },
    { id: 'wc7.h2', turns: [{ by: 'a', dr: "Everybody else pays so I'm safe. I know how that looks. I'm still safe." }] },
    { id: 'wc7.h3', turns: [{ by: 'a', say: "Sorry, everyone." }, { by: 'a', dr: "I'm not really sorry." }] },
    { id: 'wc7.h4', turns: [{ by: 'a', dr: "I just made the whole house pay for my week. I'll have to fix that before the vote." }] },
    { id: 'wc7.h5', turns: [{ by: 'a', say: "Yes." }, { beat: 'The house groans.' }] },
    { id: 'wc7.h6', turns: [{ by: 'a', dr: "If they were in my place, they'd have done the same. Most of them, anyway." }] },
  ],
  'wildact.bill.scene': [
    { id: 'wc7.x1', turns: [{ by: 'a', say: "So one person is safe and {count} of us pay for it?" }, { by: 'b', say: "I didn't make the rules." }] },
    { id: 'wc7.x2', turns: [{ by: 'a', dr: "{b} chose this for all of us. I'll remember that on Thursday." }] },
    { id: 'wc7.x3', turns: [{ by: 'a', say: "Hope it was worth it, {b}." }, { by: 'b', say: "It was." }] },
    { id: 'wc7.x4', turns: [{ by: 'a', dr: "There are {count} of us paying so {b} can relax this week. Count the votes, {b}." }] },
    { id: 'wc7.x5', turns: [{ by: 'a', say: "Thanks a lot, {b}." }, { beat: '{b} looks at the floor.' }] },
    { id: 'wc7.x6', turns: [{ by: 'a', dr: "I'm not angry. I'm keeping score." }] },
  ],
  'wildact.refused.scene': [
    { id: 'wc7.d1', turns: [{ by: 'a', say: "No, thank you. I'll take my chances." }] },
    { id: 'wc7.d2', turns: [{ by: 'a', dr: "I don't need saving this week. Now everybody knows I think that." }] },
    { id: 'wc7.d3', turns: [{ by: 'a', say: "Not worth it." }, { beat: 'Half the room looks surprised. The other half looks worried.' }] },
    { id: 'wc7.d4', turns: [{ by: 'a', dr: "If I'd taken it, everyone would wonder why I needed it. This way, they wonder why I don't." }] },
    { id: 'wc7.d5', turns: [{ by: 'a', say: "I'm good, thanks." }] },
    { id: 'wc7.d6', turns: [{ by: 'a', dr: "Maybe that was a mistake. I'll find out on Thursday." }] },
  ],
  'wildact.blocked.scene': [
    { id: 'wc7.k1', turns: [{ by: 'a', dr: "I'm on the block and I said no to safety. Either I have the votes, or I just made the worst choice of my life." }] },
    { id: 'wc7.k2', turns: [{ by: 'a', dr: "People think I'm crazy for saying no. I've counted. I'm fine." }] },
    { id: 'wc7.k3', turns: [{ by: 'a', dr: "Yes, I'm nominated. Yes, I turned it down. I'm not paying for something I don't need." }] },
  ],
};
