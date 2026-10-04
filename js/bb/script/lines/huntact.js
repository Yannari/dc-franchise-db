// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/huntact.js — the Hidden Power, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// What houseguests say while a power is hidden in the house (written by
// bb/script/ceremony.js). Nobody is ever told where it is or who has it, so
// nobody says so out loud: the finder only says it in the Diary Room.
// {place} is where somebody looked ("the pantry"); {power} its name.
//
//   hunt.announce  a hears there is something in the house           scene
//   hunt.search    a looks in {place} and finds nothing               scene
//   hunt.seen      a catches b searching                              scene
//   hunt.spread    a starts looking too, because others are           scene
//   hunt.found     a finds {power} in {place} (Diary Room only)        scene
//   hunt.near      a was looking, but somebody got there first          scene

export default {
  'hunt.announce.scene': [
    { id: 'hq.a1', turns: [{ by: 'a', dr: "Something's hidden in this house, and they won't say where. Everyone is going to go mad." }] },
    { id: 'hq.a2', turns: [{ by: 'a', say: "So we just... look? Anywhere?" }] },
    { id: 'hq.a3', turns: [{ by: 'a', dr: "No clue, no map, no competition. Just something, somewhere. I'm already looking at the cupboards." }] },
    { id: 'hq.a4', turns: [{ by: 'a', dr: "Whoever finds it won't tell anyone. So from now on, I trust nobody who looks too relaxed." }] },
    { id: 'hq.a5', turns: [{ by: 'a', say: "Nobody move. Everybody's suspicious now." }] },
    { id: 'hq.a6', turns: [{ by: 'a', dr: "If I go looking, people will see me looking. If I don't, someone else finds it. Great." }] },
  ],
  'hunt.search.scene': [
    { id: 'hq.s1', turns: [{ by: 'a', dr: "I checked {place}. Nothing. Twenty minutes of my life, and I had to make up a reason for being there." }] },
    { id: 'hq.s2', turns: [{ by: 'a', say: "I'm just looking for my phone charger." }, { by: 'a', dr: "I don't have a phone. Nobody in here has a phone." }] },
    { id: 'hq.s3', turns: [{ by: 'a', dr: "Checked {place}. Nothing. Again." }] },
    { id: 'hq.s4', turns: [{ by: 'a', dr: "I waited until everyone was asleep and went through {place}. Not a thing." }] },
    { id: 'hq.s5', turns: [{ by: 'a', dr: "Third time in {place} today. I've stopped pretending I have a reason." }] },
    { id: 'hq.s6', turns: [{ by: 'a', say: "Where are you?" }, { by: 'a', dr: "I'm talking to a power now. That's where I'm at." }] },
    { id: 'hq.s7', turns: [{ by: 'a', dr: "If I were hiding something, I'd put it in {place}. Apparently Big Brother wouldn't." }] },
    { id: 'hq.s8', turns: [{ by: 'a', dr: "I've looked in {place}. That's one place crossed off. Seven to go, probably." }] },
  ],
  'hunt.seen.scene': [
    { id: 'hq.n1', turns: [{ by: 'a', dr: "{b} came out of there with the wrong face on. I'm not saying anything. I'm remembering it." }] },
    { id: 'hq.n2', turns: [{ by: 'a', say: "Lose something?" }, { by: 'b', say: "My mind, mostly." }] },
    { id: 'hq.n3', turns: [{ by: 'a', say: "{b}'s been weird all day." }, { beat: 'By the evening, the whole house is watching {b}.' }] },
    { id: 'hq.n4', turns: [{ beat: '{a} walks in on {b} halfway through a cupboard.' }, { by: 'b', say: "...Hi." }, { by: 'a', say: "Hi." }] },
    { id: 'hq.n5', turns: [{ by: 'a', dr: "I caught {b} searching. So {b} thinks it's real. Now I think it's real." }] },
    { id: 'hq.n6', turns: [{ by: 'a', say: "Find anything?" }, { by: 'b', say: "Find what?" }, { by: 'a', say: "Exactly." }] },
  ],
  'hunt.spread.scene': [
    { id: 'hq.p1', turns: [{ by: 'a', dr: "I didn't believe any of it. Then I saw people looking. Now I'm looking." }] },
    { id: 'hq.p2', turns: [{ by: 'a', dr: "Everyone else is searching. I'm not going to be the only one who didn't." }] },
    { id: 'hq.p3', turns: [{ by: 'a', say: "Fine. I'm looking too. Don't watch me." }] },
    { id: 'hq.p4', turns: [{ by: 'a', dr: "If half the house is searching, there's something to find." }] },
    { id: 'hq.p5', turns: [{ by: 'a', dr: "I've joined the search party. Nobody invited me. Nobody invited anyone." }] },
    { id: 'hq.p6', turns: [{ by: 'a', dr: "It's catching. I've started checking under things." }] },
  ],
  'hunt.found.scene': [
    { id: 'hq.f1', turns: [{ by: 'a', dr: "Found it. {power}. It was in {place} the whole time. Nobody saw. Nobody's going to know." }] },
    { id: 'hq.f2', turns: [{ by: 'a', dr: "I've got it. I put it in my pocket and went back to the washing up like nothing happened." }] },
    { id: 'hq.f3', turns: [{ by: 'a', dr: "{place}. Of course it was. I've walked past it a hundred times." }] },
    { id: 'hq.f4', turns: [{ by: 'a', dr: "I have {power}. The hardest part now is keeping a straight face." }] },
    { id: 'hq.f5', turns: [{ by: 'a', dr: "Everyone's still looking. I'm going to help them look. Very convincingly." }] },
    { id: 'hq.f6', turns: [{ by: 'a', dr: "It's mine. Nobody in this house is ever going to find out from me." }] },
  ],
  'hunt.near.scene': [
    { id: 'hq.r1', turns: [{ by: 'a', dr: "I keep thinking I was close. I'll never know how close." }] },
    { id: 'hq.r2', turns: [{ by: 'a', dr: "There was tape stuck to something I checked. Somebody was there before me. I don't know who." }] },
    { id: 'hq.r3', turns: [{ by: 'a', dr: "I've looked everywhere. Either it doesn't exist, or someone already has it." }] },
    { id: 'hq.r4', turns: [{ by: 'a', dr: "Somebody in this house is smiling a bit too much. I bet they found it." }] },
    { id: 'hq.r5', turns: [{ by: 'a', dr: "A day too late. I can feel it." }] },
    { id: 'hq.r6', turns: [{ by: 'a', dr: "Everyone's still searching. I've got a feeling there's nothing left to find." }] },
  ],
};
