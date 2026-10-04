// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/vfall.js — what the veto ceremony costs (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb/veto-fallout.js, said at or just after the ceremony.
//
//   vfall.debt      b used the veto on a; a owes b now                    scene
//   vfall.leftup    a stayed on the block; b held the veto and kept it    friend | plain
//   vfall.seated    a was named as the replacement by b, the HOH; c came down   scene; intent hoh; third
//   vfall.overruled a, the HOH, watched b's veto take {saved} off the block   scene
//   vfall.shrug     a, the HOH, does not mind that b's veto saved {saved}      scene

export default {
  'vfall.debt.scene': [
    { id: 'vf.d1', turns: [{ by: 'a', say: "Thank you. I mean it." }, { by: 'b', say: "I know you do." }, { by: 'b', dr: "And I'll remember it." }] },
    { id: 'vf.d2', turns: [{ by: 'a', dr: "{b} took me off the block. That's not a favour. That's a debt, and {b} will want it paid." }] },
    { id: 'vf.d3', turns: [{ by: 'b', dr: "I used the veto on {a}. Everyone saw. Now they all think we're working together." }] },
    { id: 'vf.d4', turns: [{ by: 'a', say: "I owe you." }, { by: 'b', say: "You do." }] },
    { id: 'vf.d5', turns: [{ by: 'a', dr: "Off the block, thanks to {b}. Whatever {b} asks for next, I'll have to think very hard about saying no." }] },
    { id: 'vf.d6', turns: [{ by: 'b', say: "Don't make me regret it." }, { by: 'a', say: "I won't." }] },
    { id: 'vf.d7', turns: [{ by: 'a', dr: "{b} saved me in front of the whole house. There's no hiding that we're close now." }] },
    { id: 'vf.d8', turns: [{ by: 'b', dr: "I saved {a} because I needed to. {a} will pay me back. One way or another." }] },
  ],
  'vfall.leftup.friend': [
    { id: 'vf.f1', turns: [{ by: 'a', dr: "{b} had the one thing that could have saved me and kept it. I thought we were together in this." }] },
    { id: 'vf.f2', turns: [{ by: 'a', say: "You could have used it." }, { by: 'b', say: "I know." }, { by: 'a', say: "You just didn't." }] },
    { id: 'vf.f3', turns: [{ by: 'a', dr: "All week I was told this was handled. {b} handled it by doing nothing." }] },
    { id: 'vf.f4', turns: [{ by: 'b', dr: "I left {a} up there. I had my reasons. {a} won't want to hear them." }] },
    { id: 'vf.f5', turns: [{ by: 'a', say: "Thanks for nothing." }, { beat: '{a} says it quietly, on the way out of the room. It is not a joke.' }] },
    { id: 'vf.f6', turns: [{ by: 'a', dr: "If I survive Thursday, {b} is going to find out what that cost." }] },
    { id: 'vf.f7', turns: [{ by: 'a', say: "Were you ever going to use it on me?" }, { by: 'b', say: "It wasn't that simple." }, { by: 'a', say: "It was, though." }] },
    { id: 'vf.f8', turns: [{ by: 'b', dr: "{a} won't look at me. I don't blame {a}. I'd be the same." }] },
  ],
  'vfall.leftup.plain': [
    { id: 'vf.p1', turns: [{ by: 'a', dr: "{b} kept the veto. I wasn't really expecting it. It still stings." }] },
    { id: 'vf.p2', turns: [{ beat: '{b} puts the veto back in the box.' }, { by: 'a', dr: "I watched {b} do it. I didn't look away once." }] },
    { id: 'vf.p3', turns: [{ by: 'a', dr: "{b} didn't owe me anything. I know that. I'm still keeping a note." }] },
    { id: 'vf.p4', turns: [{ by: 'a', say: "No hard feelings." }, { by: 'b', say: "Really?" }, { by: 'a', say: "Some." }] },
    { id: 'vf.p5', turns: [{ by: 'a', dr: "I said nothing at the ceremony. People noticed that more than if I'd shouted." }] },
    { id: 'vf.p6', turns: [{ by: 'b', dr: "{a} was hoping I'd use it. I could see it. I didn't." }] },
    { id: 'vf.p7', turns: [{ by: 'a', dr: "Still on the block. {b} could have changed that. Now I campaign." }] },
    { id: 'vf.p8', turns: [{ by: 'a', say: "Fair enough." }, { by: 'a', dr: "It isn't fair enough. But what else do you say?" }] },
  ],
  'vfall.seated.scene': [
    { id: 'vf.s1', when: { intent: 'hoh' }, turns: [{ by: 'b', say: "It's not personal." }, { by: 'a', say: "I've heard that before." }] },
    { id: 'vf.s2', turns: [{ by: 'a', dr: "I wasn't on anyone's list this morning. I'm on the block by the afternoon." }] },
    { id: 'vf.s3', when: { intent: 'hoh' }, turns: [{ by: 'b', say: "You're just a pawn. That's all it is." }, { by: 'a', say: "Pawn. Right." }, { by: 'a', dr: "Pawns go home in this game. Everyone knows that." }] },
    { id: 'vf.s4', when: { third: true }, turns: [{ by: 'a', dr: "I'm sitting in the chair {c} was in an hour ago. I can't even look at {c}." }] },
    { id: 'vf.s5', when: { intent: 'hoh' }, turns: [{ by: 'a', dr: "Somebody had to go up, and {b} thought about it for about four seconds." }] },
    { id: 'vf.s6', turns: [{ by: 'a', dr: "Replacement nominee. I didn't do anything. I'm up there anyway." }] },
    { id: 'vf.s7', when: { intent: 'hoh' }, turns: [{ by: 'a', say: "Why me?" }, { by: 'b', say: "Someone had to go up." }, { by: 'a', say: "That's not an answer." }] },
    { id: 'vf.s8', turns: [{ by: 'a', dr: "I'm going to fight this. I'm not going home as somebody's pawn." }] },
  ],
  'vfall.overruled.scene': [
    { id: 'vf.o1', turns: [{ by: 'a', dr: "I spent three days building that block. {b} took {saved} off it in front of everyone." }] },
    { id: 'vf.o2', turns: [{ by: 'a', say: "Great move." }, { by: 'b', say: "Thanks." }, { by: 'a', dr: "I didn't mean it." }] },
    { id: 'vf.o3', turns: [{ by: 'a', dr: "My whole week was pointed at {saved}. Not any more. And {b} is on my list now." }] },
    { id: 'vf.o4', turns: [{ by: 'b', dr: "{a} didn't react at the ceremony. Forty minutes later, I heard {a} reacting in the next room." }] },
    { id: 'vf.o5', turns: [{ by: 'a', say: "You didn't have to do that." }, { by: 'b', say: "I did, actually." }] },
    { id: 'vf.o6', turns: [{ by: 'a', dr: "I've got one more nomination to make, and {b} just made it very easy." }] },
    { id: 'vf.o7', turns: [{ by: 'b', dr: "I wrecked {a}'s week. I knew I would. I'd do it again." }] },
    { id: 'vf.o8', turns: [{ by: 'a', dr: "{b} used the veto against my week. I'll remember that when it's {b}'s turn." }] },
  ],
  'vfall.shrug.scene': [
    { id: 'vf.h1', turns: [{ by: 'a', dr: "{saved} comes down. Fine. The name I wanted up there is still up there." }] },
    { id: 'vf.h2', turns: [{ by: 'a', dr: "The veto changed a face. It didn't change the plan." }] },
    { id: 'vf.h3', turns: [{ by: 'b', say: "No hard feelings?" }, { by: 'a', say: "None. Honestly." }] },
    { id: 'vf.h4', turns: [{ by: 'a', dr: "{b} saved {saved}. I don't care. {saved} was never the target." }] },
    { id: 'vf.h5', turns: [{ by: 'b', dr: "I thought {a} would be angry. {a} just shrugged." }] },
    { id: 'vf.h6', turns: [{ by: 'a', say: "Good for {saved}." }, { by: 'b', say: "You're not mad?" }, { by: 'a', say: "Why would I be?" }] },
    { id: 'vf.h7', turns: [{ by: 'a', dr: "A swapped chair isn't a ruined week. My week is fine." }] },
    { id: 'vf.h8', turns: [{ by: 'a', dr: "Everyone's waiting for me to be upset. I'm not. The plan still works." }] },
  ],
};
