// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/nomthird.js — the reason for every nominee past the first two
// ══════════════════════════════════════════════════════════════════════
//
// The nomination speech (noms.speech) is written for a target and a pawn. On a week with
// three on the block (the Block Buster, a third seat), the third heard nothing at all (the
// user, 2026-10-06: "the nomination ceremony with three people doesn't let the HOH give the
// reasoning for the third"). a = the HOH, b = the nominee. Chosen in bb/script/ceremony.js:
//
//   noms.third.blockbuster   a Block Buster week: b has a way off the block
//   noms.third.close         b is somebody the HOH likes: a seat to fill, not personal
//   noms.third.threat        b has won competitions
//   noms.third.wary          the HOH does not trust b
//   noms.third.any           none of those

const S = (id, say) => ({ id, turns: [{ by: 'a', say }] });

export default {
  'noms.third.blockbuster': [
    S('nt.bb1', "{b}, three of you are up there, and one of you gets to save yourself. I think you can win that Block Buster."),
    S('nt.bb2', "{b}, I needed a third name. You've got a way off this block that the other two would love. Use it."),
    S('nt.bb3', "{b}, you're the third chair. Win the Block Buster and none of this matters."),
    S('nt.bb4', "{b}, I'm not going to pretend there's a big reason. Three chairs. One of them is yours. Go and win your way out."),
    S('nt.bb5', "{b}, you're up as a third. That's not where I want this week to end for you."),
    S('nt.bb6', "{b}, the Block Buster is your best friend this week. I'd make good use of it."),
  ],
  'noms.third.close': [
    S('nt.c1', "{b}, this one is hard. I had to fill a third chair and I trusted you to understand."),
    S('nt.c2', "{b}, you're not who I'm after. I need you to believe that."),
    S('nt.c3', "{b}, I'd rather it was anybody else in that chair. I'll explain everything upstairs."),
    S('nt.c4', "{b}, I put you there because I know you won't panic. That's a compliment, I promise."),
    S('nt.c5', "{b}, you're safe with me. You're just sitting in the wrong chair for a few days."),
    S('nt.c6', "{b}, I hate this. You know I hate this."),
  ],
  'noms.third.threat': [
    S('nt.t1', "{b}, you win things. That's why you're sitting there."),
    S('nt.t2', "{b}, nobody in this house has won as much as you. Somebody had to do this eventually."),
    S('nt.t3', "{b}, you're a competitor, and I'd rather face you now than later."),
    S('nt.t4', "{b}, it's not personal. You're just very, very good at this game."),
    S('nt.t5', "{b}, every week you win, the rest of us lose a week. I'm sorry."),
    S('nt.t6', "{b}, take it as a compliment. I'm scared of you in a competition."),
  ],
  'noms.third.wary': [
    S('nt.w1', "{b}, I don't know where I stand with you, and that's the problem."),
    S('nt.w2', "{b}, you and I have never had a real conversation. I can't keep somebody off the block I don't know."),
    S('nt.w3', "{b}, I've heard things. I don't know if they're true. I'm not willing to find out the hard way."),
    S('nt.w4', "{b}, I don't trust you yet. Maybe this changes that."),
    S('nt.w5', "{b}, I think you'd put me up in a heartbeat. So here we are."),
    S('nt.w6', "{b}, you know why. I don't need to say it out loud."),
  ],
  'noms.third.any': [
    S('nt.a1', "{b}, you're up there because I needed a third name, and yours is the one I could live with."),
    S('nt.a2', "{b}, I don't have a big reason. It's a numbers week, and you were in the numbers."),
    S('nt.a3', "{b}, this isn't about anything you did. It's about the shape of the house right now."),
    S('nt.a4', "{b}, I've thought about this all week. It came down to you."),
    S('nt.a5', "{b}, I'll be honest: you're the third name, not the first."),
    S('nt.a6', "{b}, I hope you understand when the week plays out."),
  ],
};
