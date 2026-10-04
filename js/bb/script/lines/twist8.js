// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/twist8.js — the Invisible HOH and the Nightmare power (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/invisible.js and nightmare.js.
//
// The Invisible HOH is never named as the HOH — not in a Diary Room either.
// Whether a guess is right shows only on the badge.
//
//   inv.circle     a and b work out who the secret HOH is and land on c      scene
//   inv.accuse     a accuses b to b's face                                   scene
//   inv.credit     a hints to b that a made the nominations (a did not)      scene
//   inv.innocence  a is the secret HOH; b watches a                          overplayed | quiet
//   inv.alibi      a and b agree an alibi for nomination morning             scene
//   inv.detective  a is sure it was b; c is told                             scene; third
//   nm.down        the Nightmare took a off the block; b watches             uneasy | delighted (b may be absent)
//   nm.up          the Nightmare put a on the block; b is the HOH            reads | blames
//   nm.count       a lists who played for the power: {group} (b is first)   scene
//   nm.hoh         a, the HOH, lost the block to the Nightmare; b listens    steady (alone) | cracked

export default {
  'inv.circle.scene': [
    { id: 'iv8.c1', turns: [{ by: 'a', say: "Who had the best reason to put those two up?" }, { by: 'b', say: "Honestly? {c}." }, { by: 'a', say: "That's what I keep coming back to." }] },
    { id: 'iv8.c2', turns: [{ by: 'a', say: "Who disappeared on nomination morning?" }, { by: 'b', say: "{c} was gone for ages." }, { by: 'a', say: "Exactly." }] },
    { id: 'iv8.c3', turns: [{ by: 'b', say: "Okay. Who was where, who said what." }, { beat: '{b} draws it out on the back of a cereal box.' }, { by: 'a', say: "It points at {c}." }, { by: 'b', say: "It has to point at someone." }] },
    { id: 'iv8.c4', turns: [{ by: 'a', dr: "We went through every motive and every alibi. Every time, we ended up at {c}." }] },
    { id: 'iv8.c5', turns: [{ by: 'a', say: "Did {c} seem to know the nominations early?" }, { by: 'b', say: "Now you mention it..." }] },
    { id: 'iv8.c6', turns: [{ by: 'b', dr: "We've got no proof. We've got a feeling about {c}, and that's enough for this house." }] },
  ],
  'inv.accuse.scene': [
    { id: 'iv8.a1', turns: [{ by: 'a', say: "It was you." }, { by: 'b', say: "It wasn't." }, { by: 'a', say: "It was." }] },
    { id: 'iv8.a2', turns: [{ by: 'a', say: "I've got a list of reasons it was you." }, { by: 'b', say: "That's a list of feelings." }] },
    { id: 'iv8.a3', turns: [{ by: 'a', say: "Just admit it and I'll respect you more." }, { by: 'b', say: "There's nothing to admit." }] },
    { id: 'iv8.a4', turns: [{ by: 'a', say: "{b} is the Invisible HOH. The nominations prove it." }, { by: 'b', say: "I didn't make them!" }, { beat: 'The kitchen has to pick a side.' }] },
    { id: 'iv8.a5', turns: [{ by: 'b', dr: "{a} has decided it was me. Nothing I say is going to change that." }] },
    { id: 'iv8.a6', turns: [{ by: 'a', dr: "I said it to {b}'s face. I wanted to see the reaction." }] },
  ],
  'inv.credit.scene': [
    { id: 'iv8.r1', turns: [{ by: 'a', say: "Some moves are better made quietly." }, { beat: '{a} looks at the nominees on the memory wall.' }, { by: 'b', dr: "{a} as good as told me {a} won HOH." }] },
    { id: 'iv8.r2', turns: [{ by: 'a', say: "All I'll say is, the block looks exactly how I wanted it to look." }, { by: 'b', say: "Wait. Was it you?" }, { by: 'a', say: "I didn't say that." }] },
    { id: 'iv8.r3', turns: [{ by: 'a', say: "Everyone keeps asking who did it. Nobody's asking who benefits." }, { by: 'b', dr: "{a} wants me to think it was {a}." }] },
    { id: 'iv8.r4', turns: [{ by: 'a', say: "Watch what happens at the veto." }, { by: 'b', say: "What happens at the veto?" }, { by: 'a', say: "Just watch." }] },
    { id: 'iv8.r5', turns: [{ by: 'a', dr: "I didn't make those nominations. But if people think I did, they'll be scared of me. I'll take it." }] },
    { id: 'iv8.r6', turns: [{ by: 'b', dr: "{a} keeps hinting it was {a}. Either it's true, or {a} wants the credit." }] },
  ],
  'inv.innocence.overplayed': [
    { id: 'iv8.o1', turns: [{ by: 'a', say: "My theory is it's someone in the back bedroom, and they did it Thursday night." }, { by: 'b', dr: "That's a lot of detail. Nobody innocent does that much homework." }] },
    { id: 'iv8.o2', turns: [{ by: 'b', dr: "{a} is the loudest one in every conversation about the mystery. That's a good place to hide. {a} isn't hiding well." }] },
    { id: 'iv8.o3', turns: [{ by: 'b', say: "Who do you think it was?" }, { by: 'a', say: "Who do YOU think it was?" }, { by: 'b', dr: "That's the fourth time {a} has turned the question round." }] },
    { id: 'iv8.o4', turns: [{ by: 'b', say: "I heard the HOH had to hand the nominations in at midnight." }, { beat: 'Everyone looks confused. {a} keeps very still.' }, { by: 'b', dr: "I made that up. {a} didn't react at all. Interesting." }] },
    { id: 'iv8.o5', turns: [{ by: 'a', say: "Could be anyone, honestly. Anyone at all." }, { by: 'b', dr: "{a} said that a bit too fast." }] },
    { id: 'iv8.o6', turns: [{ by: 'b', dr: "{a} has an answer for everything about the nominations. I'm keeping an eye on that." }] },
  ],
  'inv.innocence.quiet': [
    { id: 'iv8.q1', turns: [{ by: 'a', say: "This mystery is driving me mad." }, { by: 'b', say: "Same." }] },
    { id: 'iv8.q2', turns: [{ by: 'b', say: "Who do you think it is?" }, { by: 'a', say: "Honestly? I'd go with whoever everyone else is saying." }, { beat: 'The conversation moves on.' }] },
    { id: 'iv8.q3', turns: [{ by: 'b', say: "Was it you?" }, { by: 'a', say: "Me? I can't even win a game of cards." }, { beat: 'The room laughs.' }] },
    { id: 'iv8.q4', turns: [{ by: 'a', dr: "I'm just as confused as everyone else. I'm going to stay that way." }] },
    { id: 'iv8.q5', turns: [{ by: 'b', dr: "{a} is as lost as the rest of us. Crossing {a} off the list." }] },
    { id: 'iv8.q6', turns: [{ by: 'a', say: "I've got no idea. Anyone want tea?" }, { by: 'b', say: "Yes, please." }] },
  ],
  'inv.alibi.scene': [
    { id: 'iv8.l1', turns: [{ by: 'a', say: "Where were you nomination morning?" }, { by: 'b', say: "I don't really remember." }, { by: 'a', say: "Then we were together. Okay?" }, { by: 'b', say: "Okay." }] },
    { id: 'iv8.l2', turns: [{ by: 'a', say: "You vouch for me, I vouch for you." }, { by: 'b', say: "Deal." }, { by: 'b', dr: "I didn't ask if {a} was telling the truth. {a} didn't ask me either." }] },
    { id: 'iv8.l3', turns: [{ by: 'a', say: "Kitchen first, then the backyard." }, { by: 'b', say: "Kitchen, then backyard. Together." }, { by: 'a', say: "Together." }] },
    { id: 'iv8.l4', turns: [{ by: 'a', say: "It can't have been {b}. We were together all morning." }, { by: 'b', say: "And it can't have been {a}." }, { beat: 'Now people are looking at both of them.' }] },
    { id: 'iv8.l5', turns: [{ by: 'b', dr: "{a} and I have an alibi. It just isn't true." }] },
    { id: 'iv8.l6', turns: [{ by: 'a', dr: "If anyone asks, {b} and I were together all morning. That's the story." }] },
  ],
  'inv.detective.scene': [
    { id: 'iv8.d1', turns: [{ by: 'a', dr: "I've stopped asking who did it. Now I'm asking how to prove it was {b}." }] },
    { id: 'iv8.d2', when: { third: true }, turns: [{ by: 'a', say: "It was {b}. I'm sure of it." }, { by: 'c', say: "How sure?" }, { by: 'a', say: "Very." }] },
    { id: 'iv8.d3', turns: [{ by: 'a', say: "I know when the HOH handed in the nominations." }, { beat: '{a} watches {b} for a reaction.' }, { by: 'a', dr: "That look told me everything." }] },
    { id: 'iv8.d4', when: { third: true }, turns: [{ by: 'c', dr: "{a} has a whole case against {b}. By the end of it, I was convinced too." }] },
    { id: 'iv8.d5', turns: [{ by: 'b', dr: "{a} keeps watching me across the kitchen. I don't like it." }] },
    { id: 'iv8.d6', turns: [{ by: 'a', dr: "{b} is the Invisible HOH. I'd bet my game on it." }] },
  ],
  'nm.down.uneasy': [
    { id: 'nm8.u1', turns: [{ by: 'a', dr: "I was on the block at midnight and off it by four. Somebody spent that on me. So somebody thinks I owe them." }] },
    { id: 'nm8.u2', turns: [{ by: 'a', dr: "Whoever took me down didn't do it for free. I'm watching faces instead of eating." }] },
    { id: 'nm8.u3', when: { intent: 'seen' }, turns: [{ by: 'a', say: "I didn't ask anyone to save me." }, { by: 'b', say: "Nobody said you did." }, { by: 'a', say: "I'm just saying." }] },
    { id: 'nm8.u4', when: { intent: 'seen' }, turns: [{ by: 'b', dr: "{a} came off the block and looks more worried than before. That tells me something." }] },
    { id: 'nm8.u5', turns: [{ by: 'a', dr: "Saved by someone I can't name. I don't like owing people I can't see." }] },
    { id: 'nm8.u6', turns: [{ by: 'a', dr: "I should be happy. I'm not. I want to know who did it and what they want." }] },
  ],
  'nm.down.delighted': [
    { id: 'nm8.d1', turns: [{ by: 'a', dr: "I came off that wall at three in the morning. I've been cooking for everyone since eight. Whoever did it, breakfast is my thank-you." }] },
    { id: 'nm8.d2', turns: [{ by: 'a', dr: "I don't care whose hand it was. Alive is alive." }] },
    { id: 'nm8.d3', turns: [{ by: 'a', say: "Best night's sleep I've had in this house." }, { beat: '{a} got four hours.' }] },
    { id: 'nm8.d4', turns: [{ by: 'a', say: "Pancakes, anyone?" }, { beat: 'Everyone wants pancakes.' }] },
    { id: 'nm8.d5', turns: [{ by: 'a', dr: "Last night I was on the block. Today I'm not. I'm not asking questions." }] },
    { id: 'nm8.d6', turns: [{ by: 'a', dr: "Somebody up there likes me. Or somebody in here does. Either way, thank you." }] },
  ],
  'nm.up.reads': [
    { id: 'nm8.r1', turns: [{ by: 'a', say: "I know that wasn't your list." }, { by: 'b', say: "It wasn't." }, { by: 'a', say: "So who was in that room?" }] },
    { id: 'nm8.r2', turns: [{ by: 'a', say: "You got played same as me. So who played us?" }, { by: 'b', dr: "{a} isn't angry with me. That's more unsettling than shouting." }] },
    { id: 'nm8.r3', turns: [{ by: 'a', dr: "{b} said my name, but {b} didn't pick it. I'm being nice to {b}. I still need the votes." }] },
    { id: 'nm8.r4', turns: [{ by: 'a', dr: "Somebody forced {b}'s hand. I want to know who." }] },
    { id: 'nm8.r5', turns: [{ by: 'b', say: "I'm sorry. I didn't choose this." }, { by: 'a', say: "I know you didn't." }] },
    { id: 'nm8.r6', turns: [{ by: 'a', dr: "The person who put me here isn't the person who said my name." }] },
  ],
  'nm.up.blames': [
    { id: 'nm8.b1', turns: [{ by: 'a', dr: "I don't care whose power it was. {b} said my name. {b} turned the key." }] },
    { id: 'nm8.b2', turns: [{ by: 'a', say: "Your mouth. My name." }, { by: 'b', say: "It wasn't my choice—" }, { by: 'a', say: "I don't care." }] },
    { id: 'nm8.b3', turns: [{ beat: '{a} slams a cupboard. Everyone leaves the kitchen except {b}.' }, { by: 'b', say: "That wasn't my idea, you know." }, { by: 'a', say: "You still did it." }] },
    { id: 'nm8.b4', turns: [{ by: 'b', dr: "{a} won't listen. I've explained it three times." }] },
    { id: 'nm8.b5', turns: [{ by: 'a', say: "Don't explain it to me." }, { by: 'b', say: "But—" }, { by: 'a', say: "Don't." }] },
    { id: 'nm8.b6', turns: [{ by: 'a', dr: "Power or no power, {b}'s name is on this." }] },
  ],
  'nm.count.scene': [
    { id: 'nm8.c1', turns: [{ by: 'a', say: "{group} played for that power. One of them just used it." }, { beat: 'Nobody answers. Three people stop chewing.' }] },
    { id: 'nm8.c2', turns: [{ by: 'a', dr: "Everyone watched who went through that door. I'm the one who remembers." }] },
    { id: 'nm8.c3', turns: [{ by: 'a', say: "We all saw who went in." }, { beat: '{a} leaves it there.' }] },
    { id: 'nm8.c4', turns: [{ by: 'b', dr: "{a} just listed everyone who played for the power. My name was first." }] },
    { id: 'nm8.c5', turns: [{ by: 'a', say: "It was one of them. {group}." }, { by: 'b', say: "Could have been anyone." }, { by: 'a', say: "No. It couldn't." }] },
    { id: 'nm8.c6', turns: [{ by: 'a', dr: "I'm not accusing anyone. I'm just reminding people who was in that room." }] },
  ],
  'nm.hoh.steady': [
    { id: 'nm8.s1', turns: [{ by: 'a', dr: "I'm counting votes for a block I didn't choose. By nine, I'll have a new plan." }] },
    { id: 'nm8.s2', turns: [{ by: 'a', dr: "Somebody spent a whole power to change my week. That means my week was worth a power." }] },
    { id: 'nm8.s3', turns: [{ by: 'a', dr: "It's nobody's fault and everybody's problem. I'll work with the block I've got." }] },
    { id: 'nm8.s4', turns: [{ by: 'a', dr: "Plan B. I always have a plan B." }] },
    { id: 'nm8.s5', turns: [{ by: 'a', dr: "I'm not going to cry about it. I'm going to win the vote anyway." }] },
    { id: 'nm8.s6', turns: [{ by: 'a', dr: "My plan died at four in the morning. The new one was ready by breakfast." }] },
  ],
  'nm.hoh.cracked': [
    { id: 'nm8.k1', turns: [{ by: 'a', say: "They woke me up at four in the morning to tell me." }, { by: 'b', say: "I know. You said." }] },
    { id: 'nm8.k2', turns: [{ by: 'a', say: "What is the point of winning anything in this house?" }, { by: 'b', say: "I don't know." }] },
    { id: 'nm8.k3', turns: [{ by: 'b', dr: "{a} is slamming doors and giving one-word answers. Now we know what {a} is like when a plan dies." }] },
    { id: 'nm8.k4', turns: [{ by: 'a', dr: "I won HOH. Somebody else made my nominations. I'm furious." }] },
    { id: 'nm8.k5', turns: [{ by: 'b', say: "Do you want to talk about it?" }, { by: 'a', say: "No." }, { by: 'a', say: "Yes." }] },
    { id: 'nm8.k6', turns: [{ by: 'b', dr: "{a} has told the story four times before lunch. It gets angrier every time." }] },
  ],
};
