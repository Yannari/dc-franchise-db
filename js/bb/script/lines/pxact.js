// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/pxact.js — Prizes and Punishments, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// What houseguests say at the box table (written by bb/script/ceremony.js).
// {item} is what is in a box ("$5,000", "a call home", "the red unitard");
// {gave} is the box somebody handed over in a swap.
//
//   pxact.open     a opens a box                                   veto | prize | punish
//   pxact.swap     a takes b's box, handing over {gave}             veto | prize
//   pxact.robbed   a, on the block, lost the veto to b              scene
//   pxact.soldout  a is on the block, holding {item} (Diary Room)   scene

export default {
  'pxact.open.veto': [
    { id: 'px7.v1', turns: [{ by: 'a', say: "It's the veto!" }, { beat: 'Everyone still to pick looks straight at {a}.' }] },
    { id: 'px7.v2', turns: [{ by: 'a', say: "Oh. Oh, it's the veto." }, { by: 'a', dr: "And there are still people left to pick. Great." }] },
    { id: 'px7.v3', turns: [{ by: 'a', say: "Got it. Now please nobody take it off me." }] },
    { id: 'px7.v4', turns: [{ by: 'a', dr: "I've got the veto, and everyone after me can steal it. I've never held anything so tightly." }] },
    { id: 'px7.v5', turns: [{ by: 'a', say: "The veto. Nobody look at me." }] },
    { id: 'px7.v6', turns: [{ by: 'a', say: "Well, that's mine. For now." }] },
  ],
  'pxact.open.prize': [
    { id: 'px7.p1', turns: [{ by: 'a', say: "It's {item}!" }] },
    { id: 'px7.p2', turns: [{ by: 'a', say: "I got {item}? I'll take that." }] },
    { id: 'px7.p3', turns: [{ by: 'a', dr: "I got {item}. Nice. Not the veto, but nice." }] },
    { id: 'px7.p4', turns: [{ by: 'a', say: "Ooh. {item}." }, { beat: 'The room makes a noise.' }] },
    { id: 'px7.p5', turns: [{ by: 'a', say: "Not bad. Not bad at all." }] },
    { id: 'px7.p6', turns: [{ by: 'a', dr: "It's {item}. I'm keeping it unless something better comes along." }] },
  ],
  'pxact.open.punish': [
    { id: 'px7.u1', turns: [{ by: 'a', say: "No. No, no, no." }, { beat: 'It is {item}. The room laughs.' }] },
    { id: 'px7.u2', turns: [{ by: 'a', say: "It's {item}. Of course it is." }] },
    { id: 'px7.u3', turns: [{ by: 'a', dr: "I got {item}. Everyone finds this a lot funnier than I do." }] },
    { id: 'px7.u4', turns: [{ by: 'a', say: "Does anyone want to swap? Anyone?" }, { beat: 'Nobody wants to swap.' }] },
    { id: 'px7.u5', turns: [{ by: 'a', say: "Brilliant. Just brilliant." }] },
    { id: 'px7.u6', turns: [{ by: 'a', dr: "I opened my box and got {item}. There's no putting it back." }] },
  ],
  'pxact.swap.veto': [
    { id: 'px7.s1', turns: [{ by: 'a', say: "{b}, I'll take the veto. Have this." }, { by: 'b', say: "You're joking." }, { by: 'a', say: "I'm not." }] },
    { id: 'px7.s2', turns: [{ by: 'a', say: "I'm swapping with {b}." }, { beat: '{a} hands over {gave} and takes the veto.' }] },
    { id: 'px7.s3', turns: [{ by: 'a', dr: "I didn't come here for prizes. I came for the veto. So I took it." }] },
    { id: 'px7.s4', turns: [{ by: 'a', say: "Sorry, {b}. I need that more than you do." }, { by: 'b', say: "Do you, though?" }] },
    { id: 'px7.s5', turns: [{ by: 'b', dr: "I had the veto for about two minutes. {a} took it and gave me {gave}." }] },
    { id: 'px7.s6', turns: [{ by: 'a', say: "Veto, please." }, { by: 'b', say: "Fine." }] },
  ],
  'pxact.swap.prize': [
    { id: 'px7.t1', turns: [{ by: 'a', say: "{b}, I'll have {item}. You can have {gave}." }, { by: 'b', say: "Thanks a lot." }] },
    { id: 'px7.t2', turns: [{ by: 'a', say: "I'm swapping with {b}." }, { beat: '{a} takes {item} and hands over {gave}.' }] },
    { id: 'px7.t3', turns: [{ by: 'a', dr: "Why keep {gave} when {b} has {item}? Easy decision." }] },
    { id: 'px7.t4', turns: [{ by: 'b', say: "Really? You're taking mine?" }, { by: 'a', say: "Really." }] },
    { id: 'px7.t5', turns: [{ by: 'a', say: "Sorry, {b}. {item} is coming with me." }] },
    { id: 'px7.t6', turns: [{ by: 'b', dr: "I had {item}. Now I've got {gave}. Cheers, {a}." }] },
  ],
  'pxact.robbed.scene': [
    { id: 'px7.r1', turns: [{ by: 'a', say: "You knew I was on the block." }, { by: 'b', say: "I know." }, { by: 'a', say: "And you took it anyway." }] },
    { id: 'px7.r2', turns: [{ by: 'a', dr: "I'm on the block. I had the veto in my hands. {b} took it. I won't forget that." }] },
    { id: 'px7.r3', turns: [{ by: 'a', say: "That was my way off the block." }, { by: 'b', say: "It's a game." }] },
    { id: 'px7.r4', turns: [{ by: 'a', dr: "Everyone watched {b} take the veto from a nominee. Everyone." }] },
    { id: 'px7.r5', turns: [{ by: 'b', dr: "{a} had the veto and was on the block. I took it anyway. I'll have to live with that." }] },
    { id: 'px7.r6', turns: [{ by: 'a', say: "Enjoy it, {b}." }, { beat: '{b} does not answer.' }] },
  ],
  'pxact.soldout.scene': [
    { id: 'px7.o1', turns: [{ by: 'a', dr: "I'm on the block, holding {item}. I'll be explaining that to a jury one day." }] },
    { id: 'px7.o2', turns: [{ by: 'a', dr: "I could have gone for the veto. I kept {item}. Was that stupid? Maybe." }] },
    { id: 'px7.o3', turns: [{ by: 'a', dr: "Holding {item} won't keep me in this house. I know that. I kept it anyway." }] },
    { id: 'px7.o4', turns: [{ by: 'a', dr: "Everyone saw me pick {item} over the veto. That's going to follow me." }] },
    { id: 'px7.o5', turns: [{ by: 'a', dr: "If I go home on Thursday, at least I go home with {item}." }] },
    { id: 'px7.o6', turns: [{ by: 'a', dr: "On the block with {item} in my hand. Great look." }] },
  ],
};
