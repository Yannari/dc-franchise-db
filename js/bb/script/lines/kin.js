// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/kin.js — the people who knew each other before the door (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/kinship.js. Only the declared relation is ever named
// ({kinword}: "sibling", "spouse", "ex"); nobody invents a mother, a child or a
// dog that the cast does not have.
//
//   kin.relapse     a and b, exes, get back together                       scene
//   kin.unrequited  a is still into b; b has moved on                      scene; third (c noticed)
//   kin.coldwar     a and b, exes or ex-friends, are not speaking          scene
//   kin.estranged   a reaches out to b                                     thaw | same
//   kin.shield      a protects b, a's {kinword}                            scene
//   kin.compared    a keeps being compared with b, a's {kinword}           scene
//   kin.strain      a and b came in together and count as one vote        scene
//   kin.break       b ends it with a, b's {kinword}                         scene
//   kin.apology     a apologises to b, an old friend                       lands | fails
//   kin.known       the house learns a and b knew each other ({how}); c is wary   scene; third
//   kin.blood       c asks a: would you cut b, your {kinword}?             scene; third

export default {
  'kin.relapse.scene': [
    { id: 'kz.r1', turns: [{ by: 'a', say: "We said we weren't going to do this." }, { by: 'b', say: "I know." }, { beat: 'Neither of them moves away.' }] },
    { id: 'kz.r2', turns: [{ by: 'a', dr: "{b} and I were the last two awake. We didn't go to bed. Everyone could tell in the morning." }] },
    { id: 'kz.r3', turns: [{ by: 'a', dr: "All the reasons we broke up are outside this house. All the reasons we got together are in here." }] },
    { id: 'kz.r4', turns: [{ by: 'b', say: "Is this a terrible idea?" }, { by: 'a', say: "Probably." }, { by: 'b', say: "Okay. Good." }] },
    { id: 'kz.r5', turns: [{ by: 'b', dr: "Everyone's been waiting for {a} and me to get back together. Well. Now they can stop waiting." }] },
    { id: 'kz.r6', turns: [{ by: 'a', dr: "I made a decision tonight I haven't thought through. I don't care." }] },
  ],
  'kin.unrequited.scene': [
    { id: 'kz.u1', turns: [{ by: 'b', dr: "{a} keeps turning up in whatever room I'm in. I've started leaving." }] },
    { id: 'kz.u2', when: { third: true }, turns: [{ by: 'a', say: "{b} didn't mean it like that." }, { by: 'c', say: "I think {b} did." }, { by: 'c', dr: "That's the third time this week {a} has covered for {b}. Family always does, and the house is starting to notice." }] },
    { id: 'kz.u3', turns: [{ by: 'a', dr: "{b} is being so nice to me. I'd rather {b} argued with me." }] },
    { id: 'kz.u4', turns: [{ beat: '{b} walks out of the room without looking back.' }, { by: 'a', dr: "I watched the door for a second too long. Again." }] },
    { id: 'kz.u5', turns: [{ by: 'a', say: "Want to sit with me?" }, { by: 'b', say: "I'm okay here, thanks." }] },
    { id: 'kz.u6', when: { third: true }, turns: [{ by: 'c', dr: "{a} still isn't over {b}. Everyone can see it except {a}." }] },
  ],
  'kin.coldwar.scene': [
    { id: 'kz.c1', turns: [{ by: 'a', dr: "{b} and I haven't been alone in a room since the first night. It takes real work in a house this small." }] },
    { id: 'kz.c2', turns: [{ beat: 'Somebody asks how they know each other. Both answer at once, with two different stories.' }, { by: 'a', say: "...It's a long story." }] },
    { id: 'kz.c3', turns: [{ by: 'a', say: "I'm not going to talk about it." }, { by: 'b', dr: "{a} has said that to everyone. Now everyone's talking about it." }] },
    { id: 'kz.c4', turns: [{ by: 'b', dr: "When {a} walks into the kitchen, I walk out. Nobody planned it. It just happens." }] },
    { id: 'kz.c5', turns: [{ by: 'a', say: "Pass the salt, please." }, { by: 'b', say: "It's right next to you." }, { beat: 'That is the whole conversation.' }] },
    { id: 'kz.c6', turns: [{ by: 'a', dr: "{b} and I have history. I'm not discussing it on television." }] },
    { id: 'kz.c7', turns: [{ by: 'b', dr: "Everyone keeps asking about me and {a}. I keep changing the subject." }] },
    { id: 'kz.c8', turns: [{ by: 'a', say: "Morning." }, { by: 'b', say: "Morning." }, { beat: 'That is all either of them says before lunch.' }] },
    { id: 'kz.c9', turns: [{ by: 'a', dr: "I came here to play a game, not to sort out what happened with {b}." }] },
    { id: 'kz.c10', turns: [{ by: 'b', dr: "{a} and I are being very polite. Polite is how we fight." }] },
  ],
  'kin.estranged.thaw': [
    { id: 'kz.t1', turns: [{ by: 'a', say: "I've missed you. I should have said that years ago." }, { by: 'b', say: "..." }, { by: 'b', dr: "I didn't say it back. I did stay, though." }] },
    { id: 'kz.t2', turns: [{ by: 'a', dr: "It's not a reunion. We just agreed we don't have to carry this around a house on television." }] },
    { id: 'kz.t3', turns: [{ by: 'b', say: "How long has it been?" }, { by: 'a', say: "Too long." }, { beat: 'They work out the number together, then go quiet.' }] },
    { id: 'kz.t4', turns: [{ by: 'b', dr: "{a} and I talked until it got light. First proper conversation in years." }] },
    { id: 'kz.t5', turns: [{ by: 'a', say: "Can we try?" }, { by: 'b', say: "We can try." }] },
    { id: 'kz.t6', turns: [{ by: 'a', dr: "I didn't come in here expecting this. I'll take it." }] },
  ],
  'kin.estranged.same': [
    { id: 'kz.s1', turns: [{ by: 'a', say: "Can we talk?" }, { by: 'b', say: "About what? The same thing as always?" }, { beat: '{b} walks away.' }] },
    { id: 'kz.s2', turns: [{ by: 'b', say: "I didn't come here to do this." }, { by: 'a', dr: "I spent the rest of the night in the garden." }] },
    { id: 'kz.s3', turns: [{ by: 'a', dr: "It took about ninety seconds to get back to the same argument we always have." }] },
    { id: 'kz.s4', turns: [{ by: 'b', dr: "{a} tried. I know {a} tried. I'm not ready." }] },
    { id: 'kz.s5', turns: [{ by: 'a', say: "Please." }, { by: 'b', say: "Not here." }, { by: 'a', say: "Then where?" }] },
    { id: 'kz.s6', turns: [{ by: 'a', dr: "It went wrong in the first sentence. Everyone in the next room pretended not to hear." }] },
  ],
  'kin.shield.scene': [
    { id: 'kz.h1', turns: [{ by: 'a', say: "You can talk about anybody in this house except one person." }, { beat: 'Everyone knows who {a} means.' }] },
    { id: 'kz.h2', turns: [{ by: 'a', dr: "Somebody said {b}'s name the wrong way in front of me. They won't do it again." }] },
    { id: 'kz.h3', turns: [{ by: 'b', dr: "{a} took a hit for me in a conversation I wasn't even in. I found out anyway." }] },
    { id: 'kz.h4', turns: [{ by: 'a', dr: "{b} is my {kinword}. If you come for {b}, you're coming for me." }] },
    { id: 'kz.h5', turns: [{ by: 'b', say: "You didn't have to do that." }, { by: 'a', say: "Yes, I did." }] },
    { id: 'kz.h6', turns: [{ by: 'a', dr: "Everyone knows the fastest way to lose me is to go after {b}. Good." }] },
    { id: 'kz.h7', turns: [{ by: 'a', say: "Leave {b} out of it." }, { beat: 'The conversation changes direction.' }] },
    { id: 'kz.h8', turns: [{ by: 'b', dr: "{a} keeps looking out for me. It's nice. It also makes us both a target." }] },
    { id: 'kz.h9', turns: [{ by: 'a', dr: "I'll play this game hard. I won't play it against {b}." }] },
    { id: 'kz.h10', turns: [{ by: 'a', say: "Is someone coming after {b}?" }, { by: 'b', say: "Calm down. Nobody's said anything." }, { by: 'a', say: "Good. Keep it that way." }] },
  ],
  'kin.compared.scene': [
    { id: 'kz.p1', turns: [{ by: 'a', dr: "\"You're nothing like {b}.\" It's meant kindly. I've heard it four times this week." }] },
    { id: 'kz.p2', turns: [{ by: 'a', dr: "Someone compared me and {b} in front of both of us. {b} didn't notice. I did." }] },
    { id: 'kz.p3', turns: [{ by: 'a', dr: "The house has decided which of us is the dangerous one. It isn't me." }] },
    { id: 'kz.p4', turns: [{ by: 'b', say: "They don't mean anything by it." }, { by: 'a', say: "I know. It still adds up." }] },
    { id: 'kz.p5', turns: [{ by: 'a', dr: "Being someone's {kinword} in here means being the other one." }] },
    { id: 'kz.p6', turns: [{ by: 'a', say: "Which one of us is the smart one?" }, { by: 'b', say: "Don't." }, { by: 'a', dr: "It was a joke. Sort of." }] },
    { id: 'kz.p7', turns: [{ by: 'a', dr: "Everyone in here met {b} and me on the same day. They already like {b} more." }] },
    { id: 'kz.p8', turns: [{ by: 'b', dr: "People keep comparing {a} and me. I can see it getting to {a}." }] },
    { id: 'kz.p9', turns: [{ by: 'a', say: "Just once, can somebody ask me something without mentioning {b}?" }, { beat: 'Nobody answers.' }] },
    { id: 'kz.p10', turns: [{ by: 'a', dr: "I'm my own person in here. I keep having to say it." }] },
  ],
  'kin.strain.scene': [
    { id: 'kz.g1', turns: [{ by: 'a', dr: "Nobody has to guess where my vote is going. That's the whole problem with coming in with {b}." }] },
    { id: 'kz.g2', turns: [{ by: 'a', say: "I don't agree with you on that." }, { by: 'b', say: "Fine." }, { by: 'b', dr: "We're disagreeing in public on purpose. Nobody's buying it." }] },
    { id: 'kz.g3', turns: [{ by: 'b', dr: "Someone said you can't be in an alliance with your {kinword}, it's just being a couple. Nobody laughed." }] },
    { id: 'kz.g4', turns: [{ by: 'a', dr: "I spent all day not looking at {b} across the room. That looked stranger than looking would have." }] },
    { id: 'kz.g5', turns: [{ by: 'a', say: "We need to split up a bit." }, { by: 'b', say: "In here?" }, { by: 'a', say: "In the game. Not in life." }] },
    { id: 'kz.g6', turns: [{ by: 'b', dr: "To everyone else, {a} and I are one vote. That makes us one target." }] },
  ],
  'kin.break.scene': [
    { id: 'kz.b1', turns: [{ by: 'b', say: "I didn't want to do this in here." }, { by: 'a', say: "Do what?" }, { by: 'b', say: "You know what." }] },
    { id: 'kz.b2', turns: [{ by: 'b', dr: "I've been done with this for longer than {a} realised. I said it in two sentences." }] },
    { id: 'kz.b3', turns: [{ by: 'a', dr: "I worked it out halfway through. Not from what {b} said. From how {b} said it." }] },
    { id: 'kz.b4', turns: [{ beat: 'It ends in the bedroom, with everyone else pretending to be asleep.' }, { by: 'a', say: "Okay." }] },
    { id: 'kz.b5', turns: [{ by: 'b', say: "I'm sorry." }, { by: 'a', say: "Don't." }] },
    { id: 'kz.b6', turns: [{ by: 'a', dr: "My {kinword} ended it with me on television. I don't know what to do with that." }] },
  ],
  'kin.apology.lands': [
    { id: 'kz.l1', turns: [{ by: 'a', say: "I'm sorry. Not the version where I explain. Just sorry." }, { by: 'b', say: "...Okay." }, { by: 'b', dr: "It took me four seconds. Then I took it." }] },
    { id: 'kz.l2', turns: [{ by: 'a', dr: "We didn't talk about what happened. We talked about before it, for two hours. Something got put down." }] },
    { id: 'kz.l3', turns: [{ by: 'b', say: "This used to be easy, didn't it?" }, { by: 'a', say: "It did." }, { beat: 'They are still talking an hour later.' }] },
    { id: 'kz.l4', turns: [{ by: 'b', dr: "{a} apologised properly. I didn't think {a} had it in {a.obj}." }] },
    { id: 'kz.l5', turns: [{ by: 'a', say: "Friends?" }, { by: 'b', say: "Getting there." }] },
    { id: 'kz.l6', turns: [{ by: 'a', dr: "I've waited years to say sorry to {b}. It went better than I hoped." }] },
  ],
  'kin.apology.fails': [
    { id: 'kz.f1', turns: [{ by: 'a', say: "I'm sorry." }, { by: 'b', say: "It's fine." }, { by: 'a', dr: "It isn't fine. It's never going to be fine." }] },
    { id: 'kz.f2', turns: [{ by: 'b', dr: "It was a good apology. I've heard it before. That's the problem." }] },
    { id: 'kz.f3', turns: [{ by: 'a', say: "Can we start again?" }, { by: 'b', say: "We've tried that." }] },
    { id: 'kz.f4', turns: [{ by: 'a', dr: "I said sorry. {b} said thanks. Then {b} went back inside." }] },
    { id: 'kz.f5', turns: [{ by: 'b', say: "I appreciate it." }, { beat: '{b} does not say anything else.' }] },
    { id: 'kz.f6', turns: [{ by: 'a', dr: "Some things don't get fixed in a backyard. I know that now." }] },
  ],
  'kin.known.scene': [
    { id: 'kz.k1', turns: [{ by: 'a', dr: "It came out that {b} and I knew each other before this. The whole house decided we're a pair in about a second." }] },
    { id: 'kz.k2', when: { third: true }, turns: [{ by: 'c', say: "How did nobody know this?" }, { by: 'a', say: "Nobody asked." }] },
    { id: 'kz.k3', when: { third: true }, turns: [{ by: 'c', dr: "{a} and {b} say they're not an alliance. I've written them down as a pair anyway." }] },
    { id: 'kz.k4', turns: [{ by: 'b', say: "We've never even talked about the vote." }, { beat: 'Nobody believes {b}.' }] },
    { id: 'kz.k5', turns: [{ by: 'a', say: "We're {how}. That's all." }, { by: 'b', say: "That's all." }] },
    { id: 'kz.k6', turns: [{ by: 'b', dr: "Being {how} with {a} used to be nice. In here, it makes us a target." }] },
  ],
  'kin.blood.scene': [
    { id: 'kz.q1', when: { third: true }, turns: [{ by: 'c', say: "Final two. Half a million. Do you take {b}?" }, { by: 'a', say: "Obviously." }, { by: 'c', dr: "{a} answered very fast. That's what I'll remember." }] },
    { id: 'kz.q2', when: { third: true }, turns: [{ by: 'c', say: "Could you write {b}'s name down?" }, { by: 'a', say: "Of course." }, { by: 'c', dr: "Nobody believed that. Not even {a}." }] },
    { id: 'kz.q3', turns: [{ by: 'a', dr: "Everyone wants to know if I'd cut my {kinword}. I'd rather never find out." }] },
    { id: 'kz.q4', turns: [{ by: 'b', dr: "Someone asked {a} if {a} would vote me out. {a} said yes too quickly." }] },
    { id: 'kz.q5', when: { third: true }, turns: [{ by: 'c', say: "Would you cut {b}?" }, { by: 'a', say: "Would you cut your {kinword}?" }, { by: 'c', say: "I don't have one in here." }] },
    { id: 'kz.q6', turns: [{ by: 'a', dr: "It's a game. {b} is my {kinword}. I'll cross that bridge if I get there." }] },
    { id: 'kz.q7', when: { third: true }, turns: [{ by: 'c', say: "If it came down to you and {b}..." }, { by: 'a', say: "It won't." }, { by: 'c', say: "But if it did?" }] },
    { id: 'kz.q8', turns: [{ by: 'a', dr: "People keep asking if I'd vote out my {kinword}. I keep saying it's a game. I don't sound sure." }] },
    { id: 'kz.q9', when: { third: true }, turns: [{ by: 'c', dr: "Nobody in here will ever really trust {a}. Not with {b} in the house." }] },
    { id: 'kz.q10', turns: [{ by: 'b', say: "You'd pick me, right? At the end?" }, { by: 'a', say: "Of course I would." }, { by: 'b', dr: "{a} said it. I'm not sure {a} meant it." }] },
  ],
};
