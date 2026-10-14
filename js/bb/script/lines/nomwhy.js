// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/nomwhy.js — the HOH's reason for each nominee, said at the ceremony
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-14: "the nomination ceremony is made really boring, short and vague". On the
// show, the Head of Household turns to each nominee and says why. These are the reasons the house
// gets to hear, chosen in bb/script/ceremony.js from what the game holds between the two of them.
// On a backdoor week they are the cover story: the real plan stays in the Diary Room. a = the HOH,
// b = the nominee.
//
//   noms.why.pawn       b agreed to sit there (said kindly, without saying "pawn" to the room)
//   noms.why.pair       b's closest person in the house is in the next chair
//   noms.why.grudge     b and the HOH clash
//   noms.why.threat     b has won competitions
//   noms.why.distance   b and the HOH have barely spoken
//   noms.why.game       none of those: the shape of the house

const S = (id, say) => ({ id, turns: [{ by: 'a', say }] });

export default {
  'noms.why.pawn': [
    S('nw.p1', "{b}, you and I talked before this. You know why you're sitting there, and I'm grateful."),
    S('nw.p2', "{b}, I asked you something hard this week, and you said yes. I won't forget that."),
    S('nw.p3', "{b}, you already know my reasons. I'm not going to say them in front of everybody."),
    S('nw.p4', "{b}, we've had our conversation. I meant every word of it."),
    S('nw.p5', "{b}, you went into this with your eyes open. Thank you for that."),
    S('nw.p6', "{b}, I told you upstairs what this is. That hasn't changed."),
  ],
  'noms.why.pair': [
    S('nw.r1', "{b}, the two of you on this block have been joined at the hip since day one. I can't let a pair that close walk to the end together."),
    S('nw.r2', "{b}, everybody in this room knows who you'd do anything for. That person is sitting next to you. That's the reason."),
    S('nw.r3', "{b}, I'm splitting up the strongest pair in the house. One of you will be on your own next week."),
    S('nw.r4', "{b}, you two never vote apart. I'm not going to wait and see what two votes that never split can do."),
    S('nw.r5', "{b}, it's not you on your own I'm worried about. It's the two of you together."),
    S('nw.r6', "{b}, if one of you wins next week, the other one is safe. I can't give you that."),
  ],
  'noms.why.grudge': [
    S('nw.g1', "{b}, you and I don't get on. Everybody here has seen it. I'd rather deal with that now than wait for you to get the key."),
    S('nw.g2', "{b}, you've said things about me in this house. I heard every one of them."),
    S('nw.g3', "{b}, I don't trust you, and I know you don't trust me. At least now it's out in the open."),
    S('nw.g4', "{b}, if you'd won HOH, I'd be in that chair. We both know it."),
    S('nw.g5', "{b}, you and I have been heading for this for a long time. Here it is."),
    S('nw.g6', "{b}, you came after me first. This is me answering."),
  ],
  'noms.why.threat': [
    S('nw.t1', "{b}, you've won more in this house than anybody. I'd rather face you now than in a final."),
    S('nw.t2', "{b}, every competition, you're the one to beat. Somebody had to try and stop that eventually."),
    S('nw.t3', "{b}, you're a competitor. That's a compliment, and it's also why you're up there."),
    S('nw.t4', "{b}, if you get to the end, you win. I'm not willing to let that happen."),
    S('nw.t5', "{b}, it's not personal. You're just very good at winning things."),
    S('nw.t6', "{b}, every week you win, somebody else in here loses a week. I'm sorry it's you."),
  ],
  'noms.why.distance': [
    S('nw.d1', "{b}, you and I have barely had a conversation in this house. I can't keep somebody safe I don't know."),
    S('nw.d2', "{b}, I don't know where I stand with you. Nobody who comes up to that room tells me either."),
    S('nw.d3', "{b}, you never once came up to my room this week. I noticed."),
    S('nw.d4', "{b}, I don't have anything against you. I just don't have anything for you, either."),
    S('nw.d5', "{b}, I couldn't tell you who you're working with. That's exactly the problem."),
    S('nw.d6', "{b}, we've never really talked. Maybe this week we will."),
  ],
  'noms.why.game': [
    S('nw.a1', "{b}, this is a game decision. It's about the numbers in this house right now, not about you."),
    S('nw.a2', "{b}, I went through every name in this house, more than once. It came out at yours."),
    S('nw.a3', "{b}, I don't have a big reason, and I'm not going to invent one. It's the move that keeps my game alive."),
    S('nw.a4', "{b}, I've thought about this all week. This is where I landed."),
    S('nw.a5', "{b}, it's nothing you did. It's who's on which side right now."),
    S('nw.a6', "{b}, I hope one day you understand why. I think you will."),
  ],
};
