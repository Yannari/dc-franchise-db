// ══════════════════════════════════════════════════════════════════════
// bb/story/lines/hohweek3.js — the HOH's plan on a three-chair week
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-07: "it doesn't take into account that with the Block Buster there are
// three nominees." Three go up, the three play the Block Buster, the winner comes down, and the
// veto can still take one more off. The plan has to survive two competitions, and the HOH says so.
// Roles: {a} the HOH, {b} their closest person, {c} the real target, {d} and {f} the other two
// chairs (on a pawn week {d} is the pawn), {e} a backdoor target kept off all three.

export default {
  'talk.hohweek.plan3.pawn': [
    { id: 'hw3.p1', room: 'hoh-room', turns: [
      { beat: 'HOH room. {a} has three keys out on the bed instead of two.' },
      { by: 'b', say: "Three this week. Who's the third?" },
      { by: 'a', say: "{c} is the target. {d} goes up as a pawn. And {f}." },
      { by: 'b', say: "Why {f}?" },
      { by: 'a', say: "Because one of the three wins the Block Buster and comes straight off. If that's {c}, I need somebody else up there I'd be happy to see go." },
      { by: 'b', say: "So {f} is your backup target." },
      { by: 'a', say: "{f} is my backup target. {d} is just there to fill the chair safely." },
      { by: 'a', dr: "With three on the block, one of them always saves themselves. If it's {c}, I still want somebody worth evicting sitting next to {d}. That's {f}." },
    ] },
    { id: 'hw3.p2', room: 'hoh-room', turns: [
      { beat: 'HOH room, door shut. {b} is counting the chairs on one hand.' },
      { by: 'b', say: "Three chairs. That's a lot of enemies." },
      { by: 'a', say: "Two enemies and a friend. {c} and {f} are the real names. {d} is a pawn." },
      { by: 'b', say: "And if {d} wins the Block Buster?" },
      { by: 'a', say: "Then {d} is safe and I've lost nothing. That's the best version." },
      { by: 'b', say: "And if {c} wins it?" },
      { by: 'a', say: "Then it's {f} and {d} on the block, and the house votes out {f}." },
      { by: 'b', dr: "{a} has a plan for every way the Block Buster can go. I just hope the veto doesn't wreck it." },
    ] },
    { id: 'hw3.p3', room: 'hoh-room', turns: [
      { beat: 'HOH room. {a} is pacing between the bed and the window.' },
      { by: 'a', say: "Three on the block means I can't just put up a target and a pawn." },
      { by: 'b', say: "So who?" },
      { by: 'a', say: "{c}, because {c} is the one I want gone. {f}, in case {c} wins the Block Buster. And {d}, who's agreed to sit there for me." },
      { by: 'b', say: "That's two people angry with you." },
      { by: 'a', say: "Two people who were already angry with me." },
      { by: 'b', say: "And {d}?" },
      { by: 'a', dr: "The Block Buster takes one of my nominees off whatever I do. So I'm putting up two people I'd evict, and one friend who should be safe whatever happens." },
    ] },
  ],
  'talk.hohweek.plan3.targets': [
    { id: 'hw3.t1', room: 'hoh-room', turns: [
      { beat: 'HOH room. {a} lines up three keys on the dresser.' },
      { by: 'b', say: "Who gets them?" },
      { by: 'a', say: "{c}, {d} and {f}." },
      { by: 'b', say: "No pawn?" },
      { by: 'a', say: "No pawn. One of them wins the Block Buster and walks away. I want the other two to be people I'd be glad to see go." },
      { by: 'b', say: "And {c}?" },
      { by: 'a', say: "{c} is the one I really want. But if {c} wins, I can live with either of the others." },
      { by: 'a', dr: "Three on the block means one always gets away. So I've put up three people who are all good for my game to lose." },
    ] },
    { id: 'hw3.t2', room: 'hoh-room', turns: [
      { beat: 'HOH room. {b} is lying on the bed. {a} is sitting on the floor with the HOH letter.' },
      { by: 'b', say: "Three names. Go." },
      { by: 'a', say: "{c} first. {c} is the biggest threat to me in here." },
      { by: 'b', say: "And the other two?" },
      { by: 'a', say: "{d} and {f}. If {c} wins the Block Buster, I still want somebody worth sending home." },
      { by: 'b', say: "That's three enemies in one go." },
      { by: 'a', say: "Three people who were never going to vote for me anyway." },
      { by: 'b', dr: "{a} isn't taking chances this week. Whoever wins the Block Buster, somebody {a} wants gone is still sitting on the block." },
    ] },
    { id: 'hw3.t3', room: 'hoh-room', turns: [
      { beat: 'HOH room. {a} is drawing three circles on a notepad and crossing one out.' },
      { by: 'b', say: "What are you doing?" },
      { by: 'a', say: "Working out what happens when one of them wins the Block Buster." },
      { by: 'b', say: "And?" },
      { by: 'a', say: "If {c} wins, {d} or {f} goes. If either of them wins, {c} is still up there. Every way works." },
      { by: 'b', say: "Until the veto." },
      { by: 'a', say: "Until the veto. I can't plan for everything." },
      { by: 'a', dr: "{c}, {d} and {f}. Any two of them on the block on eviction night is a good week for me." },
    ] },
  ],
  'talk.hohweek.plan3.backdoor': [
    { id: 'hw3.b1', room: 'hoh-room', turns: [
      { beat: 'HOH room, door locked. {a} is whispering.' },
      { by: 'a', say: "{e} isn't going up. Not at the ceremony." },
      { by: 'b', say: "{e} is the one you want!" },
      { by: 'a', say: "Exactly. Three go up: {c}, {d} and {f}. One of them wins the Block Buster, and the veto takes another one off." },
      { by: 'b', say: "And then you need a replacement." },
      { by: 'a', say: "And the replacement is {e}, with no Block Buster and no veto left to play for." },
      { by: 'b', say: "That needs a lot to go right." },
      { by: 'a', dr: "If {e} sits on the block, {e} gets two chances to win their way off. If {e} goes up as a replacement, {e} gets none. That's the whole plan." },
    ] },
    { id: 'hw3.b2', room: 'hoh-room', turns: [
      { beat: 'HOH room. {a} and {b} are sitting on the floor behind the bed, out of sight of the door.' },
      { by: 'b', say: "So none of the three is the real target." },
      { by: 'a', say: "None of them. {c}, {d} and {f} are there to fill chairs." },
      { by: 'b', say: "And {e}?" },
      { by: 'a', say: "{e} relaxes all week, thinks they're safe, and goes up when the veto is used." },
      { by: 'b', say: "What if nobody uses the veto?" },
      { by: 'a', say: "Then I make sure somebody does." },
      { by: 'b', dr: "Three nominees, and the real target isn't one of them. If this works, it's the biggest move of the season. If it doesn't, {a} has made three enemies for nothing." },
    ] },
    { id: 'hw3.b3', room: 'hoh-room', turns: [
      { beat: 'HOH room. {b} is eating the HOH snacks and listening.' },
      { by: 'a', say: "Everybody thinks the Block Buster makes a backdoor impossible." },
      { by: 'b', say: "Doesn't it?" },
      { by: 'a', say: "No. It just means more people come off the block. {c}, {d} and {f} go up, and only two of them will still be there on eviction night." },
      { by: 'b', say: "And the empty chair goes to..." },
      { by: 'a', say: "{e}." },
      { by: 'b', say: "That's cold." },
      { by: 'a', dr: "{e} wins competitions. So {e} doesn't get to play in any of them this week." },
    ] },
  ],
};
