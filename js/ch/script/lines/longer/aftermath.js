// ══════════════════════════════════════════════════════════════════════
// longer/aftermath.js — coming back from the Arena, and the morning after
// ══════════════════════════════════════════════════════════════════════
//
// return: a won and walked back in; b and x, y are people who voted a in (the
// engine files the winner with the voters). morning-after: a and b miss the one
// who went home (mourning), or a is alone with it; an extra in that scene could
// be relieved instead, so the extras never grieve. A one-person ending gets a
// beat and a second word to the camera, not a conversation it does not have.
export default {
  // ── return: faced the people who voted them in ──
  'rt.f1': [0, 1,
    { by: 'x', opt: 1, say: "Welcome back." },
    2, 3,
    { by: 'b', say: "It was a vote. It wasn't personal." },
    { by: 'a', say: "It's always personal when it's your name." },
    { by: 'y', opt: 1, say: "Can we not do this tonight? Everybody's tired." },
    { by: 'a', opt: 'y', say: "You voted for me too. You don't get to tell me when to talk about it." },
    { by: 'b', say: "Okay. Say what you need to say." },
    { by: 'a', say: "I already did. I'm going to bed." },
    4],
  'rt.f2': [
    { beat: '{a} is back from the Arena. The room goes quiet.' },
    0,
    { by: 'x', opt: 1, say: "Welcome back. You were amazing in there." },
    1, 2,
    { by: 'b', say: "I voted. Everybody voted. You'd have done the same thing." },
    { by: 'a', say: "Maybe. But I didn't. You did." },
    { by: 'x', opt: 1, say: "Come on. Let's just leave it for tonight." },
    { by: 'a', opt: 'x', say: "You said my name too. I heard it." },
    3,
    { by: 'a', conf: "Everybody who voted for me is being extra nice tonight. That's how I know they're scared." }],
  'rt.f3': [0, 1, 2,
    { by: 'a', say: "That's it?" },
    { by: 'b', say: "What do you want me to say? I'm glad you're okay." },
    { by: 'a', say: "You're glad I'm okay. You put me in there." },
    { by: 'y', opt: 1, say: "A lot of us did. It was the vote." },
    { by: 'a', opt: 'y', say: "I know. I'm keeping a list." },
    { by: 'b', say: "Okay. I hear you." },
    3],
  // ── return: nobody who voted for them is around ──
  'rt.q1': [0, 1,
    { beat: '{a} sits on the edge of the bed and pulls off {a.posAdj} shoes. There is still sand in them.' },
    { by: 'a', conf: "Tomorrow I'll start working out who put me in there. Tonight I'm just glad I'm not packing." }],
  'rt.q2': [0,
    { beat: 'Nobody comes over. Somebody turns the TV down.' },
    1,
    { by: 'a', conf: "Half the people in this house were happy to see my name go up. I'm going to find out which half." }],
  'rt.q3': [0, 1,
    { by: 'a', conf: "I'm not going to pretend that clapping meant anything. Some of the people clapping wanted me gone." }],
  // ── return: volunteered and won ──
  'rt.v1': [0, 1,
    { beat: 'A few people clap. {a} drops onto the couch and closes {a.posAdj} eyes.' },
    2],
  'rt.v2': [0, 1, 2,
    { by: 'a', conf: "Nobody's going to say I took the easy way. I walked in there because I wanted to." }],
  'rt.v3': [0,
    { beat: 'Somebody hands {a} a drink. {a} drinks half of it in one go.' },
    1],
  // ── return: called out, and sent the caller home ──
  'rt.c1': [0, 1,
    { by: 'b', opt: 1, say: "Welcome back. Seriously." },
    { by: 'a', opt: 'b', say: "Thanks. You voted for me, but thanks." },
    { by: 'b', opt: 1, say: "I did. I'm not going to lie about it." },
    { by: 'x', opt: 1, say: "That was the best I've seen anybody play that game." },
    { by: 'a', opt: 'x', say: "Thanks. I didn't feel good in there. I just didn't stop." },
    2],
  'rt.c2': [
    { beat: "{a} is back, and {gone}'s bed is empty." },
    { by: 'b', opt: 1, say: "Hey. You did it." },
    { by: 'a', opt: 'b', say: "I did it." },
    0],
  'rt.c3': [0, 1,
    { by: 'b', opt: 1, say: "How do you feel?" },
    { by: 'a', opt: 'b', say: "Tired. Happy. I don't know yet." },
    { by: 'a', conf: "{gone} picked me because {gone} thought I was the easy one. Now everybody knows I'm not." }],

  // ── the morning after: two of them miss the one who went ──
  'ma.m1': [0, 1, 2,
    { by: 'a', say: "Who do you think put {gone} in there? Really?" },
    { by: 'b', say: "Everybody who said {gone}'s name. But somebody started it." },
    { by: 'a', say: "I want to know who." },
    { by: 'b', say: "Be careful. If you go around asking, they'll know you're coming." },
    { by: 'a', say: "Let them know." },
    3],
  'ma.m2': [
    { beat: '{a} and {b} sit a little apart from everybody else.' },
    0, 1,
    { by: 'a', say: "Do you think we could have done something? Talked to people?" },
    { by: 'b', say: "I don't know. The votes were there before either of us knew." },
    { by: 'a', say: "Then next time we need to know where the votes are before they're there." },
    { by: 'b', say: "Yeah. We do." },
    2],
  'ma.m3': [0, 1,
    { by: 'a', say: "I didn't even hug {gone}. I just stood there." },
    { by: 'b', say: "Everybody just stood there. That's what that place does to you." },
    { by: 'a', say: "I hate it." },
    { by: 'b', say: "Me too. Come on. Let's go eat something." },
    2],
  // ── the morning after: alone with it ──
  'ma.a1': [0, 1,
    { by: 'b', opt: 1, say: "Hey. Do you want some company?" },
    { by: 'a', opt: 'b', say: "No. I'm fine." },
    { by: 'b', opt: 1, say: "Okay. I'm around if you change your mind." },
    { by: 'a', conf: "Everybody's being nice to me this morning. Some of those same people were happy to see {gone} go. I haven't forgotten." }],
  'ma.a2': [
    { beat: '{a} is the last one out of bed.' },
    0,
    { by: 'b', opt: 1, say: "Are you coming to breakfast?" },
    { by: 'a', opt: 'b', say: "In a minute." },
    { by: 'a', conf: "I'll get up. I'll eat. I'll smile at people. But I'm going to be thinking about {gone} all day." }],
  'ma.a3': [0, 1,
    { by: 'a', conf: "{gone} and I had a plan for the end of this game. I still have the plan. I just don't have {gone}." }],
  // ── the morning after: glad they're gone ──
  'ma.r1': [
    { beat: '{a} is up early and in a good mood, and is trying not to show it.' },
    0,
    { by: 'a', conf: "I'll say the nice things when people are around. I'm just not going to fake being sad." }],
  'ma.r2': [0, 1,
    { by: 'a', say: "Why not? Everybody's thinking it." },
    { by: 'b', say: "Not everybody. Some people are really upset." },
    { by: 'a', say: "Okay. I'll keep it down." },
    2],
  'ma.r3': [
    { beat: 'Everybody is quiet this morning. {a} is quiet too, on purpose.' },
    0],
};
