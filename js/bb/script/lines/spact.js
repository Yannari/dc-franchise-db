// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/spact.js — the Secret Power Competition, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// A Head of Household competition where some of the field is secretly playing
// for a power instead (written by bb/script/ceremony.js). Everything a power
// winner says is in the Diary Room: the house never learns who won one, so
// nobody says it where anybody can hear.
//
//   spact.open     a, before the start, has made a private choice    scene
//   spact.barred   a is the outgoing HOH and cannot win it back      scene
//   spact.won      a won a power in secret                           alone | beat
//   spact.price    a had the best score and is not HOH by choice     scene
//   spact.handed   a won HOH; others were not playing for it         scene

export default {
  'spact.open.scene': [
    { id: 'sp7.o1', turns: [{ by: 'a', dr: "Everybody out there has picked what they're playing for. Nobody's saying." }] },
    { id: 'sp7.o2', turns: [{ by: 'a', dr: "I know what I'm going for. You'll find out when everybody else does. Or never." }] },
    { id: 'sp7.o3', turns: [{ by: 'a', dr: "Head of Household or a secret. You can't have both. I've made my choice." }] },
    { id: 'sp7.o4', turns: [{ by: 'a', dr: "I keep looking at the doors. I'm trying not to look at the doors." }] },
    { id: 'sp7.o5', turns: [{ by: 'a', dr: "This is the strangest competition I've ever stood in. Half of us might not even be in it." }] },
    { id: 'sp7.o6', turns: [{ by: 'a', dr: "If I lose, nobody will know if I was really trying. I like that." }] },
  ],
  'spact.barred.scene': [
    { id: 'sp7.b1', turns: [{ by: 'a', dr: "I can't win HOH again, so for once I've got nothing to lose. Doors it is." }] },
    { id: 'sp7.b2', turns: [{ by: 'a', dr: "Everyone's fighting for my old room. I'm fighting for something else." }] },
    { id: 'sp7.b3', turns: [{ by: 'a', dr: "Outgoing HOH, so I can't play for the crown. Fine. There's more than one prize out here." }] },
    { id: 'sp7.b4', turns: [{ by: 'a', dr: "Nobody's watching me today. I'm not a threat to win. That's useful." }] },
  ],
  'spact.won.alone': [
    { id: 'sp7.a1', turns: [{ by: 'a', dr: "Nobody else went for my door. I walked in and took it." }] },
    { id: 'sp7.a2', turns: [{ by: 'a', dr: "I gave up HOH for this. Nobody else even tried for it. That's either genius or luck." }] },
    { id: 'sp7.a3', turns: [{ by: 'a', dr: "I've got a power and nobody in this house knows. I'm going to keep it that way." }] },
    { id: 'sp7.a4', turns: [{ by: 'a', dr: "Easiest win of my life, and I can't tell a single person about it." }] },
  ],
  'spact.won.beat': [
    { id: 'sp7.w1', turns: [{ by: 'a', dr: "Somebody else wanted the same door. I got there first." }] },
    { id: 'sp7.w2', turns: [{ by: 'a', dr: "I've got a secret power now. Someone else went for it. They'll never know it was me." }] },
    { id: 'sp7.w3', turns: [{ by: 'a', dr: "I could have played for HOH. I played for this, and I won it." }] },
    { id: 'sp7.w4', turns: [{ by: 'a', dr: "I've got something nobody else in the house has. I just have to not smile about it." }] },
    { id: 'sp7.w5', turns: [{ by: 'a', dr: "I won. Out there, it looks like I lost. That's exactly how I want it to look." }] },
    { id: 'sp7.w6', turns: [{ by: 'a', dr: "It's got an expiry date, so I can't sit on it for ever. But I've got it." }] },
  ],
  'spact.price.scene': [
    { id: 'sp7.p1', turns: [{ by: 'a', dr: "I had the best score out there. I could have been HOH. I chose this instead." }] },
    { id: 'sp7.p2', turns: [{ by: 'a', dr: "Everyone thinks I just lost. I didn't lose. I wasn't playing for that." }] },
    { id: 'sp7.p3', turns: [{ by: 'a', dr: "Watching someone else get the key I could have had is hard. I'll live." }] },
    { id: 'sp7.p4', turns: [{ by: 'a', dr: "If this power doesn't pay off, that's the most expensive mistake I'll ever make in here." }] },
  ],
  'spact.handed.scene': [
    { id: 'sp7.h1', turns: [{ by: 'a', dr: "I won HOH. I'm not sure everybody out there was really trying, though." }] },
    { id: 'sp7.h2', turns: [{ by: 'a', dr: "I'll take the win. But some people stopped way too early, and I want to know why." }] },
    { id: 'sp7.h3', turns: [{ by: 'a', say: "I won!" }, { by: 'a', dr: "Now I need to work out who wasn't playing for the same thing as me." }] },
    { id: 'sp7.h4', turns: [{ by: 'a', dr: "Head of Household. Whatever anyone else was doing out there, I've got the key." }] },
  ],
};
