// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/evictvote.js — what each voter says in the Diary Room on eviction night
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-06: "the vote is not really personalised, it's always 'I vote to evict'".
// On the real show most voters say something first — to the person going, to the person
// staying, or to the camera — and then the formula. The formula stays (it is the show), and
// what comes before it is what is true of that voter (bb/script/ceremony.js chooses):
//
//   evict.vote.flip     a told the house they were voting the other way
//   evict.vote.friend   a is close to b, who is going
//   evict.vote.enemy    a has no time for b
//   evict.vote.loyal    a is protecting c, the nominee who stays
//   evict.vote.hard     a nearly voted the other way
//   evict.vote.plain    none of those
//
// a = the voter, b = who a votes to evict, c = the other nominee. Every entry ends on the
// formula, so the count on screen is never in doubt.

const V = (id, dr) => ({ id, turns: [{ by: 'a', dr }] });

export default {
  'evict.vote.flip': [
    V('ev.f1', "{b}, I'm sorry. I know what I told you. This is game, not personal. I vote to evict {b}."),
    V('ev.f2', "I said one thing in the kitchen. I'm doing another thing in here. That's the game. I vote to evict {b}."),
    V('ev.f3', "{b}, you're going to find out I lied to you. I hope you understand why one day. I vote to evict {b}."),
    V('ev.f4', "This is the hardest thing I've done in here. {b}, I'm sorry. I vote to evict {b}."),
    V('ev.f5', "{c}, you owe me one. {b}, please don't hate me. I vote to evict {b}."),
    V('ev.f6', "I changed my mind this morning. Nobody knows yet. Sorry, {b}. I vote to evict {b}."),
    V('ev.f7', "{b}, I promised you. I'm breaking it. I'll explain at the jury house. I vote to evict {b}."),
  ],
  'evict.vote.friend': [
    V('ev.r1', "{b}, I love you. I'll see you on the outside. I'm so sorry. I vote to evict {b}."),
    V('ev.r2', "This one hurts. {b}, you're one of my favourite people in here. I vote to evict {b}."),
    V('ev.r3', "{b}, save me a seat out there. Hug your people for me. I vote to evict {b}."),
    V('ev.r4', "I don't want to do this. I really don't. {b}, I'm sorry. I vote to evict {b}."),
    V('ev.r5', "{b}, it's not you. It's never been you. It's the numbers. I vote to evict {b}."),
    V('ev.r6', "Sorry, babe. I'll miss you so much. I vote to evict {b}."),
    V('ev.r7', "{b}, you made this place feel like home. I hate this. I vote to evict {b}."),
  ],
  'evict.vote.enemy': [
    V('ev.e1', "Easiest vote I've had in here. I vote to evict {b}."),
    V('ev.e2', "{b}, bye. I vote to evict {b}."),
    V('ev.e3', "Nothing personal, {b}. Okay, it's a little personal. I vote to evict {b}."),
    V('ev.e4', "I've been waiting for this one. I vote to evict {b}."),
    V('ev.e5', "{b}, enjoy the jury house. I vote to evict {b}."),
    V('ev.e6', "No speech. I vote to evict {b}."),
    V('ev.e7', "{b}, you made it very easy. I vote to evict {b}."),
  ],
  'evict.vote.loyal': [
    V('ev.l1', "{c}, I've got you. Always. I vote to evict {b}."),
    V('ev.l2', "{c}, this one's for you. {b}, sorry. I vote to evict {b}."),
    V('ev.l3', "I keep my word. {c}, I want you here next week. I vote to evict {b}."),
    V('ev.l4', "{c}, I told you I'd be there. I'm there. I vote to evict {b}."),
    V('ev.l5', "{b}, I like you. But I'm with {c}. I vote to evict {b}."),
    V('ev.l6', "{c}, see you on the other side of this. I vote to evict {b}."),
  ],
  'evict.vote.hard': [
    V('ev.h1', "I've gone back and forth all week. I'm still not sure. I vote to evict {b}."),
    V('ev.h2', "{b}, {c}, I'm sorry to whichever of you this hurts more. I vote to evict {b}."),
    V('ev.h3', "This could have gone either way right up until I sat down. I vote to evict {b}."),
    V('ev.h4', "I changed my mind three times walking in here. Final answer. I vote to evict {b}."),
    V('ev.h5', "Honestly? Coin toss. {b}, it landed on you. I vote to evict {b}."),
    V('ev.h6', "I hate this vote. I hate it. I vote to evict {b}."),
  ],
  'evict.vote.plain': [
    V('ev.p1', "Sorry, {b}. I vote to evict {b}."),
    V('ev.p2', "I vote to evict {b}."),
    V('ev.p3', "{b}, it's been fun. I vote to evict {b}."),
    V('ev.p4', "Good luck, {b}. I vote to evict {b}."),
    V('ev.p5', "{c}, {b}, you both played hard. I vote to evict {b}."),
    V('ev.p6', "With the house. I vote to evict {b}."),
    V('ev.p7', "{b}, no hard feelings. I vote to evict {b}."),
  ],
};
