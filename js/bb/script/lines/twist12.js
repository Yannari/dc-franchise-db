// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/twist12.js — the Hacker (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/hacker.js. The Hacker is never named as the Hacker —
// not in a Diary Room either. A guess being right shows only on the badge.
//
//   hack.benefit   a says b, who came off the block, must be the Hacker    scene
//   hack.hunt      a was swapped onto the block and blames b; c is told    scene; third
//   hack.disown    a, the HOH, says the block is not a's; b went up        believed | doubted
//   hack.seat      the Hacker drew b into the veto; a watches b            scene
//   hack.missing   a counts last week's vote one short and blames b        scene
//   hack.silenced  a's vote was cancelled; b is a's closest friend        tells | keeps
//   hack.table     a and b work out who the Hacker is and land on c        scene
//   hack.alibi     a and b agree to vouch for each other                   scene
//   hack.claim     a hints to b that a is the Hacker (a is not)            scene
//   hack.perform   a is the Hacker (never said); b watches a               overplayed | quiet

export default {
  'hack.benefit.scene': [
    { id: 'hk12.b1', turns: [{ by: 'a', say: "Work out who gained. One person walked off that block without campaigning." }, { beat: 'Everyone looks at {b}.' }] },
    { id: 'hk12.b2', turns: [{ by: 'a', say: "Nobody hands out a favour like that for free." }, { by: 'b', say: "I didn't ask for it!" }, { by: 'a', say: "Then you owe someone. Or you did it yourself." }] },
    { id: 'hk12.b3', turns: [{ by: 'a', dr: "The block changed. {b} is the reason it changed. And {b} is the one who benefits." }] },
    { id: 'hk12.b4', turns: [{ by: 'b', dr: "I came off the block and now everyone thinks I'm the hacker. Being saved has never felt worse." }] },
    { id: 'hk12.b5', turns: [{ by: 'a', say: "Lucky you, coming off the block like that." }, { by: 'b', say: "Lucky me." }, { by: 'a', dr: "Luck has nothing to do with it." }] },
    { id: 'hk12.b6', turns: [{ by: 'a', dr: "Follow the benefit. It leads straight to {b}." }] },
  ],
  'hack.hunt.scene': [
    { id: 'hk12.h1', turns: [{ by: 'a', dr: "I wasn't on the block an hour ago. Now I am. Nobody's name is on it, so I'm picking one. {b}." }] },
    { id: 'hk12.h2', when: { third: true }, turns: [{ by: 'a', say: "Somebody in this house typed my name in." }, { by: 'c', say: "Who?" }, { by: 'a', say: "{b}." }] },
    { id: 'hk12.h3', turns: [{ by: 'a', dr: "I went over the whole morning. Who was missing, who came back quiet. It all points at {b}." }] },
    { id: 'hk12.h4', turns: [{ by: 'a', dr: "I've stopped asking who did it. I'm asking who to make pay. That's {b}." }] },
    { id: 'hk12.h5', when: { third: true }, turns: [{ by: 'c', dr: "{a} has a whole case against {b}. It's mostly about where people sat at breakfast." }] },
    { id: 'hk12.h6', turns: [{ by: 'b', dr: "{a} has decided I put {a} on the block. I don't know how to argue with that." }] },
  ],
  'hack.disown.believed': [
    { id: 'hk12.d1', turns: [{ by: 'a', say: "That wasn't me. That's not the block I made." }, { by: 'b', say: "I believe you." }, { by: 'b', dr: "Doesn't help. {a} can't take me down either." }] },
    { id: 'hk12.d2', turns: [{ by: 'a', dr: "My one week with the power, and somebody else used it." }] },
    { id: 'hk12.d3', turns: [{ by: 'b', dr: "{a} didn't put me up. So what's the point of talking to {a} about it?" }] },
    { id: 'hk12.d4', turns: [{ by: 'a', say: "Did anyone actually see me name {b}?" }, { beat: 'Nobody did.' }] },
    { id: 'hk12.d5', turns: [{ by: 'a', dr: "I'm the HOH in name only this week. Everyone knows it." }] },
    { id: 'hk12.d6', turns: [{ by: 'b', say: "It's not your fault." }, { by: 'a', say: "Then whose is it?" }] },
  ],
  'hack.disown.doubted': [
    { id: 'hk12.u1', turns: [{ by: 'a', say: "That wasn't me." }, { by: 'b', say: "That's what you'd say." }] },
    { id: 'hk12.u2', turns: [{ by: 'a', dr: "I keep explaining that this isn't my block. It's true. It makes me sound like I'm covering." }] },
    { id: 'hk12.u3', turns: [{ by: 'b', dr: "An HOH saying the nominations aren't theirs. Of course {a} would say that." }] },
    { id: 'hk12.u4', turns: [{ by: 'a', say: "Did anyone actually see me name {b}?" }, { beat: 'Nobody did.' }, { by: 'b', dr: "Nobody had to." }] },
    { id: 'hk12.u5', turns: [{ by: 'b', say: "You're the HOH. It's your block." }, { by: 'a', say: "It's not!" }] },
    { id: 'hk12.u6', turns: [{ by: 'a', dr: "{b} doesn't believe a word I say. I don't blame {b}. I'd think the same." }] },
  ],
  'hack.seat.scene': [
    { id: 'hk12.s1', turns: [{ by: 'a', dr: "{b} walked into that veto competition with no chip and no name. I didn't look at the bag. I looked at {b}'s face." }] },
    { id: 'hk12.s2', turns: [{ by: 'a', say: "Who picked you?" }, { by: 'b', say: "I don't know!" }, { by: 'a', dr: "Nobody does. That's the problem." }] },
    { id: 'hk12.s3', turns: [{ by: 'a', dr: "Someone wants {b} playing for the veto. Whoever it is, {b} is their ally." }] },
    { id: 'hk12.s4', turns: [{ by: 'a', dr: "{b} is the only person we know for sure the hacker chose. That's not proof. It's the closest thing we've got." }] },
    { id: 'hk12.s5', turns: [{ by: 'b', dr: "Somebody picked me for the veto and won't say who. Now everyone's looking at me." }] },
    { id: 'hk12.s6', turns: [{ by: 'a', say: "Must be nice having a secret friend." }, { by: 'b', say: "I wish I knew who it was." }] },
  ],
  'hack.missing.scene': [
    { id: 'hk12.m1', turns: [{ by: 'a', dr: "I've counted Thursday's vote all week. More people say they voted than there were votes. I think {b} is lying." }] },
    { id: 'hk12.m2', turns: [{ by: 'a', say: "One of us didn't vote." }, { beat: '{a} watches the table. {b} looks away.' }] },
    { id: 'hk12.m3', turns: [{ by: 'a', dr: "We went back through the eviction out loud. The count is one short. {b} is at the top of my list." }] },
    { id: 'hk12.m4', turns: [{ by: 'a', say: "How did you vote on Thursday?" }, { by: 'b', say: "Same as everyone." }, { by: 'a', dr: "That's not a real answer." }] },
    { id: 'hk12.m5', turns: [{ by: 'b', dr: "{a} keeps asking how I voted. I'm starting to feel like I'm on trial." }] },
    { id: 'hk12.m6', turns: [{ by: 'a', dr: "A ballot went missing. Somebody got cancelled. I think it was {b}." }] },
  ],
  'hack.silenced.tells': [
    { id: 'hk12.t1', turns: [{ by: 'a', say: "I need to tell you something. My vote on Thursday was cancelled." }, { by: 'b', say: "What?" }, { by: 'a', say: "I was told not to say anything." }] },
    { id: 'hk12.t2', turns: [{ by: 'a', say: "I didn't not vote. I wasn't allowed to vote." }, { by: 'b', say: "Who stopped you?" }, { by: 'a', say: "I don't know." }] },
    { id: 'hk12.t3', turns: [{ by: 'a', say: "They called me in, told me my vote didn't count, and sent me back out." }, { by: 'b', say: "And you just sat there?" }, { by: 'a', say: "What else could I do?" }] },
    { id: 'hk12.t4', turns: [{ by: 'a', dr: "Everyone thinks I'm a liar about my vote. I told {b} the truth. I couldn't carry it alone any more." }] },
    { id: 'hk12.t5', turns: [{ by: 'b', dr: "{a}'s vote was cancelled and {a} couldn't tell anyone. That explains so much." }] },
    { id: 'hk12.t6', turns: [{ by: 'b', say: "Why didn't you tell me sooner?" }, { by: 'a', say: "Would you have believed me?" }] },
  ],
  'hack.silenced.keeps': [
    { id: 'hk12.k1', turns: [{ by: 'a', dr: "If I say my vote was cancelled, people will ask who chose me. I don't know. So I'm saying nothing." }] },
    { id: 'hk12.k2', turns: [{ by: 'b', say: "How did you vote on Thursday?" }, { by: 'a', say: "Same as everyone. Anyway, slop again tonight." }] },
    { id: 'hk12.k3', turns: [{ by: 'a', dr: "'My vote was cancelled' sounds like an excuse. I'm keeping it to myself." }] },
    { id: 'hk12.k4', turns: [{ by: 'b', dr: "{a} changed the subject when I asked about the vote. That's not like {a}." }] },
    { id: 'hk12.k5', turns: [{ by: 'a', dr: "The safest thing I can do with the truth is nothing." }] },
    { id: 'hk12.k6', turns: [{ by: 'b', say: "You okay?" }, { by: 'a', say: "Fine. Why?" }, { by: 'b', say: "No reason." }] },
  ],
  'hack.table.scene': [
    { id: 'hk12.r1', turns: [{ by: 'a', say: "Motive, opportunity, who was quiet at breakfast." }, { by: 'b', say: "{c}." }, { by: 'a', say: "{c}." }] },
    { id: 'hk12.r2', turns: [{ by: 'a', say: "The block changed. The draw changed. Who's been relaxed about both?" }, { by: 'b', say: "{c}." }] },
    { id: 'hk12.r3', turns: [{ by: 'b', say: "I'm not accusing anyone." }, { by: 'a', say: "But?" }, { by: 'b', say: "But it's {c}." }] },
    { id: 'hk12.r4', turns: [{ by: 'a', dr: "We put three theories together and got one answer. {c}. We don't have one fact." }] },
    { id: 'hk12.r5', turns: [{ by: 'b', dr: "The room needed it to be someone. It's {c} now." }] },
    { id: 'hk12.r6', turns: [{ by: 'a', say: "Has anyone actually asked {c}?" }, { by: 'b', say: "Why would we? {c} would just lie." }] },
  ],
  'hack.alibi.scene': [
    { id: 'hk12.a1', turns: [{ by: 'a', say: "Neither of us left the room during the competition. Agreed?" }, { by: 'b', say: "Agreed." }] },
    { id: 'hk12.a2', turns: [{ by: 'a', say: "You know it wasn't me, right?" }, { by: 'b', say: "And you know it wasn't me." }, { by: 'a', say: "Deal." }] },
    { id: 'hk12.a3', turns: [{ by: 'b', dr: "{a} and I agreed to vouch for each other. If anyone notices, it'll look terrible." }] },
    { id: 'hk12.a4', turns: [{ by: 'a', dr: "Being suspected is worse than being nominated. So {b} and I are saying it loudly. Together." }] },
    { id: 'hk12.a5', turns: [{ by: 'a', say: "If anyone asks—" }, { by: 'b', say: "We were together. I know." }] },
    { id: 'hk12.a6', turns: [{ by: 'b', dr: "Our stories match because we went over them first. Now the truth sounds rehearsed." }] },
  ],
  'hack.claim.scene': [
    { id: 'hk12.c1', turns: [{ by: 'b', say: "Was it you?" }, { beat: '{a} shrugs.' }, { by: 'b', dr: "{a} didn't say no." }] },
    { id: 'hk12.c2', turns: [{ by: 'a', say: "Let's just say the block ended up how I wanted it." }, { by: 'b', dr: "By dinner, I'd told three people to check with {a} before making plans." }] },
    { id: 'hk12.c3', turns: [{ by: 'a', dr: "I never said I was the hacker. I just didn't say I wasn't. People are scared of me now. I'll take it." }] },
    { id: 'hk12.c4', turns: [{ by: 'a', say: "Watch the veto. Think about who benefits." }, { by: 'b', say: "Meaning what?" }, { by: 'a', say: "Just watch." }] },
    { id: 'hk12.c5', turns: [{ by: 'b', dr: "{a} keeps hinting it was {a}. Either it's true, or {a} wants the credit without the risk." }] },
    { id: 'hk12.c6', turns: [{ by: 'a', say: "You'll work it out." }, { by: 'b', say: "Work what out?" }, { by: 'a', say: "Exactly." }] },
  ],
  'hack.perform.overplayed': [
    { id: 'hk12.o1', turns: [{ by: 'a', say: "Okay, I've got a theory. Actually, two. And a timeline." }, { by: 'b', dr: "Nobody confused does this much homework." }] },
    { id: 'hk12.o2', turns: [{ by: 'b', dr: "{a} is the loudest person in the investigation. That's the easiest place to hide. {a} isn't hiding well." }] },
    { id: 'hk12.o3', turns: [{ by: 'b', say: "I heard the hacker had to confirm the swap twice." }, { beat: '{a} doesn\'t react.' }, { by: 'b', dr: "I made that up. Everyone else looked confused. {a} didn't." }] },
    { id: 'hk12.o4', turns: [{ by: 'a', say: "But who do you think it was?" }, { by: 'b', dr: "Fifth time today {a} has asked me that. I've stopped answering." }] },
    { id: 'hk12.o5', turns: [{ by: 'a', say: "Whoever did this is really clever." }, { by: 'b', say: "Clever?" }, { by: 'a', say: "I mean sneaky. Really sneaky." }] },
    { id: 'hk12.o6', turns: [{ by: 'b', dr: "{a} keeps steering every conversation about the hack. I want to know where to." }] },
  ],
  'hack.perform.quiet': [
    { id: 'hk12.q1', turns: [{ by: 'a', say: "Whoever did this, I hope they're happy." }, { by: 'b', say: "Same." }] },
    { id: 'hk12.q2', turns: [{ by: 'b', say: "Who do you think it was?" }, { by: 'a', say: "Honestly? Probably whoever everyone's saying." }, { beat: 'The conversation moves on.' }] },
    { id: 'hk12.q3', turns: [{ by: 'b', say: "Was it you?" }, { by: 'a', say: "Me? I can't even work the microwave." }, { beat: 'Everyone laughs.' }] },
    { id: 'hk12.q4', turns: [{ by: 'a', dr: "This hack has ruined everyone's week. Mine included." }] },
    { id: 'hk12.q5', turns: [{ by: 'b', dr: "{a} has no idea who the hacker is. Join the club." }] },
    { id: 'hk12.q6', turns: [{ by: 'a', say: "This whole week is a mess." }, { by: 'b', say: "Tell me about it." }] },
  ],
};
