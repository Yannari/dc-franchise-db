// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/life.js — ordinary days in the house (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/house-life.js. Plain talk: people in a house,
// bored, tired, homesick, fond of each other, annoyed with each other.
//
//   life.prank      life-prank              a pranks b
//                   funny | misfire
//   life.chores     life-chores             a cleans up after b
//                   boils (a says something) | quiet (a doesn't)
//   life.diary      life-diary-room         a in the Diary Room, about b (not there)
//                   scheming | honest
//   life.sleepless  life-sleepless          a can't sleep
//                   company (b is up too) | alone
//   life.homesick   life-homesick           a misses home
//                   helped (b notices) | alone
//   life.table      life-kitchen-table      a, b and c at the kitchen table
//                   talk
//   life.couple     life-showmance-domestic a and b, a couple
//                   sweet | strained

export default {
  // ── a prank ───────────────────────────────────────────────────────
  'life.prank.funny': [
    { id: 'lp.f1', turns: [
      { beat: '{b} opens the drawer. Everything in it has been rearranged.' },
      { by: 'b', say: "{a}!" },
      { by: 'a', say: "I don't know what you're talking about." },
      { by: 'b', say: "You're laughing!" },
      { by: 'a', say: "I'm always laughing." },
    ] },
    { id: 'lp.f2', when: { room: ['bedroom'] }, turns: [
      { beat: '{a} has filled {b}\'s bed with every cushion in the house.' },
      { by: 'b', say: "Where am I supposed to sleep?" },
      { by: 'a', say: "On the cushions. Obviously." },
      { by: 'b', say: "I'm getting you back for this." },
    ] },
    { id: 'lp.f3', turns: [
      { by: 'b', say: "Who put salt in the sugar?" },
      { beat: 'Nobody answers. {a} is very busy looking at the ceiling.' },
      { by: 'b', say: "{a}, I know it was you." },
      { by: 'a', say: "You'll never prove it." },
    ] },
    { id: 'lp.f4', turns: [
      { by: 'b', dr: "{a} got me. Properly got me. I'm annoyed and I'm laughing, and I can't stop doing either." },
    ] },
    { id: 'lp.f5', turns: [
      { beat: '{a} jumps out from behind the bathroom door. {b} screams.' },
      { by: 'b', say: "I hate you!" },
      { by: 'a', say: "You love me." },
      { by: 'b', say: "...I love you. But I hate you." },
    ] },
    { id: 'lp.f6', turns: [
      { by: 'b', say: "Okay, that was actually really good." },
      { by: 'a', say: "Thank you. I've been planning it for two days." },
      { by: 'b', say: "Next time, let me help." },
    ] },
    { id: 'lp.f7', turns: [
      { by: 'a', dr: "Nothing happened in the game today, so I hid all of {b}'s socks. It's the best thing I've done all week." },
    ] },
    { id: 'lp.f8', turns: [
      { beat: 'Every one of {b}\'s shoes has been turned to face the wall.' },
      { by: 'b', say: "Why? Why would anyone do this?" },
      { by: 'a', say: "Because it's funny." },
      { by: 'b', say: "...It is quite funny." },
    ] },
    { id: 'lp.f9', turns: [{ by: 'b', say: "Why does my toothbrush have googly eyes on it?" }, { by: 'a', say: "No idea." }, { by: 'b', say: "There's only one person in this house with googly eyes, {a}." }] },
    { id: 'lp.f10', turns: [{ by: 'a', say: "Don't open the fridge." }, { by: 'b', say: "Why not?" }, { beat: '{b} opens the fridge. Everything inside has been labelled with {b}\'s name.' }, { by: 'b', say: "...Okay, that's quite good." }] },
    { id: 'lp.f11', turns: [{ by: 'b', dr: "I've been pranked three times this week. I'm not even angry. I'm just impressed." }] },
    { id: 'lp.f12', turns: [{ beat: '{a} has wrapped {b}\'s chair in toilet paper.' }, { by: 'b', say: "How long did this take you?" }, { by: 'a', say: "Forty minutes. Worth it." }] },
    { id: 'lp.f13', turns: [{ by: 'a', say: "I have to tell you something. I swapped your shampoo for conditioner." }, { by: 'b', say: "That's why my hair feels like this!" }, { by: 'a', say: "You look great, though." }] },
    { id: 'lp.f14', turns: [{ by: 'b', say: "Right. That's it. War." }, { by: 'a', say: "Bring it on." }, { by: 'b', dr: "{a} has no idea what's coming. Neither do I yet, but it's going to be good." }] },
  ],
  'life.prank.misfire': [
    { id: 'lp.m1', turns: [
      { beat: 'Everyone laughs at the prank except {b}.' },
      { by: 'a', say: "Come on, it was a joke." },
      { by: 'b', say: "It wasn't funny." },
      { beat: '{b} walks out. Nobody laughs after that.' },
    ] },
    { id: 'lp.m2', turns: [
      { by: 'b', say: "Where's my suitcase?" },
      { by: 'a', say: "What suitcase?" },
      { by: 'b', say: "{a}. I'm not in the mood." },
      { by: 'a', say: "Okay, okay. It's in the yard." },
      { by: 'b', dr: "{a} thought that was funny. It wasn't. Not this week." },
    ] },
    { id: 'lp.m3', turns: [
      { by: 'a', say: "Oh, come on. You're not even going to smile?" },
      { by: 'b', say: "No. I'm not." },
      { by: 'a', dr: "I got that one wrong. I thought {b} would laugh. {b} really didn't." },
    ] },
    { id: 'lp.m4', turns: [
      { by: 'b', dr: "Everyone thought it was hilarious. I didn't. It felt like the whole house was laughing at me, not with me." },
    ] },
    { id: 'lp.m5', turns: [
      { by: 'b', say: "Was that meant to be funny?" },
      { by: 'a', say: "...Yes?" },
      { by: 'b', say: "Well, it wasn't." },
    ] },
    { id: 'lp.m6', turns: [
      { by: 'a', say: "Sorry. I didn't think you'd take it like that." },
      { by: 'b', say: "How did you think I'd take it?" },
      { by: 'a', say: "I don't know. Better." },
    ] },
    { id: 'lp.m7', turns: [{ by: 'b', say: "Can you just leave my stuff alone?" }, { by: 'a', say: "It was a joke." }, { by: 'b', say: "I know. Leave it alone anyway." }] },
    { id: 'lp.m8', turns: [{ by: 'a', dr: "I thought {b} would laugh. {b} didn't laugh. Now it's awkward, and it's my fault." }] },
    { id: 'lp.m9', turns: [{ by: 'b', say: "Do you think it's funny to make me look stupid in front of everybody?" }, { by: 'a', say: "That's not what I was doing." }, { by: 'b', say: "That's what it felt like." }] },
    { id: 'lp.m10', turns: [{ beat: '{b} finds the prank, says nothing at all and walks away.' }, { by: 'a', dr: "No reaction. That's worse than shouting." }] },
  ],

  // ── chores ───────────────────────────────────────────────────────
  'life.chores.boils': [
    { id: 'lc.b1', turns: [
      { by: 'a', say: "I've cleaned up after you every day this week." },
      { by: 'b', say: "Nobody asked you to." },
      { by: 'a', say: "Somebody has to!" },
    ] },
    { id: 'lc.b2', turns: [
      { by: 'a', say: "That's it. I'm not cleaning up after you any more." },
      { by: 'b', say: "Fine." },
      { by: 'a', dr: "I'll be cleaning up after {b} again by Thursday. I know I will." },
    ] },
    { id: 'lc.b3', turns: [
      { by: 'a', say: "I'm not your mum, {b}." },
      { by: 'b', say: "I never said you were." },
      { by: 'a', say: "Then stop leaving your stuff everywhere!" },
    ] },
    { id: 'lc.b4', turns: [
      { beat: 'The same dirty pan is back in the sink. {a} puts it, still dirty, on {b}\'s pillow.' },
      { by: 'b', say: "Really?" },
      { by: 'a', say: "Really." },
    ] },
    { id: 'lc.b5', turns: [
      { by: 'a', say: "Do you know how many times I've cleaned that counter today?" },
      { by: 'b', say: "No." },
      { by: 'a', say: "Four. Four times." },
    ] },
    { id: 'lc.b6', turns: [
      { by: 'a', dr: "It's not really about the mess. It's that {b} doesn't even notice. Nobody notices who does the work in here." },
    ] },
    { id: 'lc.b7', turns: [
      { by: 'b', say: "Why are you so angry about a few plates?" },
      { by: 'a', say: "Because it's never a few plates!" },
    ] },
    { id: 'lc.b8', turns: [{ by: 'a', say: "Whose towel is this on the floor?" }, { by: 'b', say: "Mine. Why?" }, { by: 'a', say: "Because it's been there since yesterday!" }] },
    { id: 'lc.b9', turns: [{ by: 'a', say: "Can you please put the milk back in the fridge? It's not hard." }, { by: 'b', say: "I was going to." }, { by: 'a', say: "When? It's warm!" }] },
    { id: 'lc.b10', turns: [{ by: 'b', say: "You're making a big deal out of nothing." }, { by: 'a', say: "It's not nothing if I'm the one cleaning it up every day." }] },
    { id: 'lc.b11', turns: [{ by: 'a', dr: "I've asked {b} nicely four times. Today I didn't ask nicely." }] },
    { id: 'lc.b12', turns: [{ by: 'a', say: "There's a rota on the fridge, {b}. Have you ever looked at it?" }, { by: 'b', say: "There's a rota?" }, { by: 'a', say: "There's been a rota since week one!" }] },
    { id: 'lc.b13', turns: [{ by: 'a', say: "I'm not cleaning the bathroom again. It's your turn." }, { by: 'b', say: "I did it last week." }, { by: 'a', say: "You did not do it last week." }] },
  ],
  'life.chores.quiet': [
    { id: 'lc.q1', turns: [
      { beat: '{a} does the dishes again, without saying anything.' },
      { by: 'a', dr: "I don't say anything. I just do it. I'm keeping track, though." },
    ] },
    { id: 'lc.q2', turns: [
      { by: 'b', say: "Thanks for cleaning up." },
      { beat: '{b} puts another plate on the counter and walks away.' },
      { by: 'a', dr: "{b} thanked me and then left another plate. I didn't say a word." },
    ] },
    { id: 'lc.q3', when: { room: ['kitchen'] }, turns: [
      { beat: 'It is one in the morning. {a} is cleaning the kitchen on {a.posAdj} own.' },
      { by: 'a', dr: "It's the only time it's quiet in here. And the only thing in this house I can control." },
    ] },
    { id: 'lc.q4', turns: [
      { by: 'a', dr: "Somebody has to do it. It's always me. I've decided I don't mind. Mostly." },
    ] },
    { id: 'lc.q5', turns: [
      { by: 'b', say: "You don't have to do all that, you know." },
      { by: 'a', say: "I know." },
      { beat: '{a} keeps doing it. {b} doesn\'t offer to help.' },
    ] },
    { id: 'lc.q6', turns: [
      { by: 'a', dr: "I'm not going to start a fight about the dishes. I'm just going to remember who never does them." },
    ] },
    { id: 'lc.q7', turns: [{ beat: '{a} wipes down the counter for the third time today. {b} walks past and doesn\'t notice.' }, { by: 'a', dr: "Third time today. {b} hasn't noticed once." }] },
    { id: 'lc.q8', turns: [{ by: 'a', dr: "Cleaning keeps me busy. If I'm busy, I'm not worrying about the vote." }] },
    { id: 'lc.q9', turns: [{ by: 'b', say: "This place looks great." }, { by: 'a', say: "Thanks." }, { by: 'a', dr: "{b} has never picked up a single thing in here." }] },
    { id: 'lc.q10', turns: [{ by: 'a', dr: "I'm not going to make a scene about the dishes. It's not worth it. I just wish somebody else would do them for once." }] },
    { id: 'lc.q11', turns: [{ beat: '{a} quietly takes {b}\'s plate off the table and washes it.' }, { by: 'b', say: "Oh, cheers." }] },
    { id: 'lc.q12', turns: [{ by: 'a', dr: "You can tell a lot about people by how they leave a kitchen. I'm learning a lot about {b}." }] },
  ],

  // ── the Diary Room ──────────────────────────────────────────────
  'life.diary.scheming': [
    { id: 'ld.s1', turns: [{ by: 'a', dr: "Everyone in this house thinks they know what I'm doing. They have no idea." }] },
    { id: 'ld.s2', turns: [{ by: 'a', dr: "{b} trusts me completely. That's going to be a problem for {b} later on." }] },
    { id: 'ld.s3', turns: [{ by: 'a', dr: "I've got a plan for the next three weeks. I haven't told a single person in the house." }] },
    { id: 'ld.s4', turns: [{ by: 'a', dr: "Out there I'm everybody's friend. In here, I can say what I actually think. And what I think is that most of them are going home soon." }] },
    { id: 'ld.s5', turns: [{ by: 'a', dr: "{b} thinks we're close. We are, for now. That'll change when I need it to." }] },
    { id: 'ld.s6', turns: [{ by: 'a', dr: "I'm enjoying this a lot more than I let anyone see." }] },
    { id: 'ld.s7', turns: [{ by: 'a', dr: "People keep telling me their secrets. I keep every single one." }] },
    { id: 'ld.s8', turns: [{ by: 'a', dr: "Everyone thinks I'm just here to have fun. That's exactly what I want them to think." }] },
    { id: 'ld.s9', turns: [{ by: 'a', dr: "I've worked out who's with who in this house. Nobody else has, as far as I can tell." }] },
    { id: 'ld.s10', turns: [{ by: 'a', dr: "{b} told me something today that {b} shouldn't have. I'll use it when the time's right." }] },
    { id: 'ld.s11', turns: [{ by: 'a', dr: "I'm playing a much bigger game than people realise. I'd like to keep it that way." }] },
    { id: 'ld.s12', turns: [{ by: 'a', dr: "I smile at everyone. I mean it about two of them." }] },
  ],
  'life.diary.honest': [
    { id: 'ld.h1', turns: [{ by: 'a', dr: "Honestly? I'm tired. I'm so tired. Out there I keep smiling, but in here I can admit it." }] },
    { id: 'ld.h2', turns: [{ by: 'a', dr: "I don't know if I'm playing this right. I really don't." }] },
    { id: 'ld.h3', turns: [{ by: 'a', dr: "I've been talking about {b} for ages. I think I'm actually talking about myself." }] },
    { id: 'ld.h4', turns: [{ by: 'a', dr: "I don't want to write {b}'s name down. I probably will. I hate that." }] },
    { id: 'ld.h5', turns: [{ by: 'a', dr: "Some days I love this place. Today isn't one of them." }] },
    { id: 'ld.h6', turns: [{ by: 'a', dr: "{b} is the closest thing I've got to a real friend in here. I hope that's still true next week." }] },
    { id: 'ld.h7', turns: [{ by: 'a', dr: "I came in with a plan. It lasted about two days. Now I'm just trying to stay." }] },
    { id: 'ld.h8', turns: [{ by: 'a', dr: "I'm not sure anyone in this house really knows me yet. Maybe that's my fault." }] },
    { id: 'ld.h9', turns: [{ by: 'a', dr: "I miss home more than I thought I would. I don't say it out there. I can say it in here." }] },
    { id: 'ld.h10', turns: [{ by: 'a', dr: "I think {b} likes me. I hope so. I really like {b}." }] },
    { id: 'ld.h11', turns: [{ by: 'a', dr: "I'm scared I'm going home this week. Nobody's said anything. I just have a feeling." }] },
    { id: 'ld.h12', turns: [{ by: 'a', dr: "I'm proud of myself today. I didn't do anything big. I just got through it." }] },
    { id: 'ld.h13', turns: [{ by: 'a', dr: "I keep second-guessing everything. Every conversation, every look. It's exhausting." }] },
    { id: 'ld.h14', turns: [{ by: 'a', dr: "Can I just sit here for a minute? It's the only quiet room in the house." }] },
    { id: 'ld.h15', turns: [{ by: 'a', dr: "I said something to {b} today that I shouldn't have. I hope it doesn't come back on me." }] },
  ],

  // ── a sleepless night ───────────────────────────────────────────
  'life.sleepless.alone': [
    { id: 'ls.a1', turns: [{ by: 'a', dr: "I can't sleep. I keep going over the same names, in the same order, over and over." }] },
    { id: 'ls.a2', when: { room: ['kitchen'] }, turns: [{ beat: 'Three in the morning. {a} stands in the dark kitchen, not eating anything.' }, { by: 'a', dr: "It's the only room where nobody asks me if I'm okay." }] },
    { id: 'ls.a3', turns: [{ by: 'a', dr: "I've been awake so long the plan doesn't make sense any more. I'll fix it in the morning." }] },
    { id: 'ls.a4', turns: [{ beat: 'Everyone else is asleep. {a} lies on {a.posAdj} back, staring at the ceiling.' }, { by: 'a', dr: "A house full of people, and I've never felt more on my own." }] },
    { id: 'ls.a5', turns: [{ by: 'a', dr: "Every time I close my eyes, I'm back at the nomination ceremony." }] },
    { id: 'ls.a6', turns: [{ by: 'a', dr: "I counted the votes four times tonight. I got three different answers." }] },
    { id: 'ls.a7', turns: [{ by: 'a', dr: "Everyone's snoring. I'm wide awake, thinking about Thursday." }] },
    { id: 'ls.a8', turns: [{ beat: '{a} gets up, walks around the house in the dark, and goes back to bed. Twice.' }, { by: 'a', dr: "I just can't switch my brain off." }] },
    { id: 'ls.a9', turns: [{ by: 'a', dr: "It's four in the morning, and I've just realised I might have said the wrong thing to someone yesterday. Great." }] },
    { id: 'ls.a10', turns: [{ by: 'a', dr: "I haven't slept properly in three days. I'm starting to forget what day it is." }] },
  ],
  'life.sleepless.company': [
    { id: 'ls.c1', turns: [{ by: 'b', say: "You can't sleep either?" }, { by: 'a', say: "Not a chance." }, { by: 'b', say: "Tea?" }, { by: 'a', say: "Tea." }] },
    { id: 'ls.c2', when: { room: ['kitchen'] }, turns: [{ beat: '{a} finds {b} sitting at the kitchen table in the dark.' }, { by: 'a', say: "What are you doing up?" }, { by: 'b', say: "Same as you. Thinking too much." }] },
    { id: 'ls.c3', turns: [{ by: 'a', say: "Is it bad that I'm scared?" }, { by: 'b', say: "No. Everyone's scared. They just don't say it." }] },
    { id: 'ls.c4', turns: [{ by: 'b', say: "Want to talk about it?" }, { by: 'a', say: "Not really." }, { by: 'b', say: "Okay. I'll just sit here, then." }, { beat: 'They sit together until it starts to get light.' }] },
    { id: 'ls.c5', turns: [{ by: 'a', say: "What time is it?" }, { by: 'b', say: "Nearly four." }, { by: 'a', say: "We should sleep." }, { by: 'b', say: "We should." }, { beat: 'Neither of them moves.' }] },
    { id: 'ls.c6', turns: [{ by: 'a', dr: "I couldn't sleep, and neither could {b}. We talked until it got light. I feel a lot better." }] },
    { id: 'ls.c7', turns: [{ by: 'b', say: "Are you awake?" }, { by: 'a', say: "Yeah." }, { by: 'b', say: "Me too. This house is too quiet at night." }, { by: 'a', say: "Or too loud. Someone's snoring." }] },
    { id: 'ls.c8', turns: [{ by: 'a', say: "I can't stop thinking about the vote." }, { by: 'b', say: "Then don't think about it. Tell me something else." }, { by: 'a', say: "Like what?" }, { by: 'b', say: "Anything. Tell me about your first job." }] },
    { id: 'ls.c9', turns: [{ beat: '{a} and {b} whisper in the dark so they don\'t wake anybody.' }, { by: 'b', say: "We should really sleep." }, { by: 'a', say: "Five more minutes." }] },
    { id: 'ls.c10', turns: [{ by: 'b', say: "Do you want a hot chocolate?" }, { by: 'a', say: "At three in the morning?" }, { by: 'b', say: "Best time for it." }] },
  ],

  // ── homesick ─────────────────────────────────────────────────────
  'life.homesick.helped': [
    { id: 'lh.h1', turns: [{ by: 'b', say: "You've gone quiet. What's up?" }, { by: 'a', say: "I just miss home." }, { by: 'b', say: "Come here." }, { beat: '{b} gives {a} a long hug.' }] },
    { id: 'lh.h2', turns: [{ by: 'a', say: "I'm fine. I'm just having a moment." }, { by: 'b', say: "Have it with me, then." }] },
    { id: 'lh.h3', turns: [{ by: 'b', say: "Tell me what you'd be doing right now if you were at home." }, { by: 'a', say: "Honestly? Nothing. Sitting on the sofa." }, { by: 'b', say: "Sounds perfect." }, { by: 'a', say: "It really does." }] },
    { id: 'lh.h4', turns: [{ by: 'a', dr: "I was really missing home today. {b} noticed and just sat with me. I didn't even have to explain." }] },
    { id: 'lh.h5', turns: [{ by: 'b', say: "It gets easier." }, { by: 'a', say: "Does it?" }, { by: 'b', say: "No. But you get better at it." }] },
    { id: 'lh.h6', turns: [{ by: 'a', say: "I keep thinking about everyone watching at home." }, { by: 'b', say: "They're proud of you." }, { by: 'a', say: "You don't know that." }, { by: 'b', say: "I do. I'd be." }] },
    { id: 'lh.h7', turns: [{ beat: '{a} is sitting on the steps outside. {b} comes out and sits next to {a.obj} without saying anything.' }, { by: 'a', say: "Thanks." }, { by: 'b', say: "For what? I'm just sitting." }] },
    { id: 'lh.h8', turns: [{ by: 'b', say: "You okay? You've been quiet all day." }, { by: 'a', say: "Just missing everyone at home." }, { by: 'b', say: "Me too. Want to talk about them?" }, { by: 'a', say: "...Yeah. I'd like that." }] },
    { id: 'lh.h9', turns: [{ by: 'a', say: "Sorry. I don't know why I'm crying." }, { by: 'b', say: "You don't have to know why. Just cry." }] },
    { id: 'lh.h10', turns: [{ by: 'b', say: "What do you miss most?" }, { by: 'a', say: "My own bed. And being able to go outside whenever I want." }, { by: 'b', say: "We've got a yard." }, { by: 'a', say: "It's not the same." }] },
    { id: 'lh.h11', turns: [{ by: 'b', dr: "I could see {a} was having a hard day. So I made {a.obj} a tea and sat with {a.obj}. That's all you can do in here." }] },
    { id: 'lh.h12', turns: [{ by: 'a', say: "Do you ever wonder what's happening outside?" }, { by: 'b', say: "All the time." }, { by: 'a', say: "It's strange, isn't it? Everyone's just living their lives." }] },
    { id: 'lh.h13', turns: [{ by: 'b', say: "Not long now." }, { by: 'a', say: "You don't know that." }, { by: 'b', say: "Fine. Not long for one of us." }, { by: 'a', say: "...Thanks. That really helped." }] },
  ],
  'life.homesick.alone': [
    { id: 'lh.a1', turns: [{ by: 'a', dr: "I tried to count how many days I've been in here. I stopped halfway. I didn't want to know." }] },
    { id: 'lh.a2', turns: [{ by: 'a', dr: "I miss my own bed. I miss my own food. I miss being able to go for a walk." }] },
    { id: 'lh.a3', turns: [{ beat: '{a} goes outside and stands on {a.posAdj} own for a while.' }, { by: 'a', dr: "It just hit me out of nowhere. One minute I was fine, and the next I really wanted to go home." }] },
    { id: 'lh.a4', turns: [{ by: 'a', dr: "I've stopped talking about home. If I talk about it, I'll cry, and I don't want to cry in front of everyone." }] },
    { id: 'lh.a5', turns: [{ by: 'a', dr: "Someone mentioned a song from home today, and I had to leave the room." }] },
    { id: 'lh.a6', turns: [{ by: 'a', dr: "I came here to play a game. Nobody told me how much I'd miss everything else." }] },
    { id: 'lh.a7', turns: [{ by: 'a', dr: "I keep imagining what everyone at home is doing right now. Probably eating something better than this." }] },
    { id: 'lh.a8', turns: [{ beat: '{a} sits alone, staring at nothing, for a long time.' }, { by: 'a', dr: "I'm fine. I'm just tired of being in here today." }] },
    { id: 'lh.a9', turns: [{ by: 'a', dr: "I didn't think I'd get homesick. I'm a grown adult. Apparently that doesn't matter." }] },
    { id: 'lh.a10', turns: [{ by: 'a', dr: "Some days I forget I'm in a competition. Today I just wanted to go home." }] },
  ],

  // ── the kitchen table ────────────────────────────────────────────
  'life.table.talk': [
    { id: 'lt.t1', turns: [{ by: 'a', say: "Okay, worst job you've ever had. Go." }, { by: 'b', say: "I sold mattresses door to door." }, { by: 'c', say: "Door to door? Mattresses?" }, { by: 'b', say: "I didn't sell a single one." }, { beat: 'The table is in tears.' }] },
    { id: 'lt.t2', when: { room: ['kitchen'] }, turns: [{ beat: '{a}, {b} and {c} sit at the kitchen table long after dinner.' }, { by: 'b', say: "We haven't talked about the game once tonight." }, { by: 'c', say: "Good. Let's keep it that way." }] },
    { id: 'lt.t3', turns: [{ by: 'a', say: "If you could eat one thing right now, what would it be?" }, { by: 'c', say: "Pizza." }, { by: 'b', say: "A proper roast dinner." }, { by: 'a', say: "You're both making me hungry. I regret asking." }] },
    { id: 'lt.t4', turns: [{ by: 'a', say: "So I'm telling this story, and I completely lose track of it." }, { by: 'b', say: "You always do that." }, { by: 'c', say: "Just get to the end!" }, { by: 'a', say: "I can't remember the end!" }] },
    { id: 'lt.t5', turns: [{ by: 'c', say: "Who do you think is the funniest person in here?" }, { by: 'a', say: "Me." }, { by: 'b', say: "Definitely not you." }] },
    { id: 'lt.t6', turns: [{ by: 'b', dr: "We sat at that table for two hours, just talking about nothing. It's the most normal I've felt since I got here." }] },
    { id: 'lt.t7', turns: [{ by: 'a', say: "What's the first thing you're doing when you get out?" }, { by: 'b', say: "Sleeping for two days." }, { by: 'c', say: "Seeing my friends." }, { by: 'a', say: "Same. But food first." }] },
    { id: 'lt.t8', turns: [{ by: 'a', say: "Has anyone else noticed how quiet it's been today?" }, { by: 'c', say: "Too quiet." }, { by: 'b', say: "Don't say that. Something's going to happen now." }] },
    { id: 'lt.t9', turns: [{ by: 'c', say: "Tell us an embarrassing story." }, { by: 'b', say: "Why me?" }, { by: 'a', say: "Because you've got the most." }] },
    { id: 'lt.t10', turns: [{ beat: 'The three of them stay at the table until the lights go down around them.' }, { by: 'a', dr: "I learned more about those two tonight than in two weeks of game talk." }] },
    { id: 'lt.t11', turns: [{ by: 'b', say: "This is nice. Just sitting." }, { by: 'a', say: "Don't jinx it." }, { by: 'c', say: "Too late. Someone's going to start a fight in the next five minutes." }] },
    { id: 'lt.t12', turns: [{ by: 'a', say: "Be honest. Who here can actually cook?" }, { by: 'c', say: "Not me." }, { by: 'b', say: "Definitely not me." }, { by: 'a', say: "Great. We're all going to starve." }] },
    { id: 'lt.t13', turns: [{ by: 'b', say: "Who's the worst cook in the house?" }, { by: 'c', say: "You." }, { by: 'b', say: "That's fair, actually." }] },
    { id: 'lt.t14', turns: [{ by: 'a', say: "What would you spend the money on if you won?" }, { by: 'c', say: "Pay off my debts." }, { by: 'b', say: "Holiday. A long one." }, { by: 'a', say: "Both of those sound amazing." }] },
    { id: 'lt.t15', turns: [{ by: 'c', say: "Okay, best film ever. Go." }, { beat: 'Forty minutes later, nobody has agreed on anything.' }] },
    { id: 'lt.t16', turns: [{ by: 'a', say: "Do you think they can hear us right now?" }, { by: 'b', say: "They can always hear us." }, { by: 'c', say: "Hello, Big Brother." }] },
    { id: 'lt.t17', turns: [{ by: 'b', say: "I'm going to miss this when one of us goes home." }, { by: 'a', say: "Don't. It's too early to get sad." }, { by: 'c', say: "Never too early to get sad in here." }] },
    { id: 'lt.t18', turns: [{ by: 'c', say: "What did you think of me when you first met me?" }, { by: 'a', say: "Honestly? I thought you'd be really annoying." }, { by: 'c', say: "And?" }, { by: 'a', say: "You are. But I like you." }] },
    { id: 'lt.t19', turns: [{ by: 'a', say: "Bet I can make you laugh in ten seconds." }, { by: 'b', say: "Go on, then." }, { beat: 'It takes four seconds.' }] },
    { id: 'lt.t20', turns: [{ by: 'b', dr: "No game talk, no plotting. Just three people at a table, laughing. I needed that more than I knew." }] },
  ],

  // ── a couple, day to day ─────────────────────────────────────────
  'life.couple.sweet': [
    { id: 'lu.s1', turns: [{ beat: '{a} and {b} spend the whole afternoon on the hammock, doing nothing.' }, { by: 'b', say: "We should probably go and talk to people." }, { by: 'a', say: "Five more minutes." }] },
    { id: 'lu.s2', turns: [{ by: 'a', say: "I made you a plate." }, { by: 'b', say: "You didn't have to." }, { by: 'a', say: "I know. I wanted to." }] },
    { id: 'lu.s3', turns: [{ by: 'b', say: "People keep saying we're joined at the hip." }, { by: 'a', say: "Are we?" }, { by: 'b', say: "...Yeah. A bit." }] },
    { id: 'lu.s4', turns: [{ by: 'a', dr: "{b} is the best part of being in here. I didn't expect that. I'm not complaining." }] },
    { id: 'lu.s5', turns: [{ by: 'b', say: "You saved me a seat again." }, { by: 'a', say: "I always save you a seat." }, { by: 'b', say: "I know. I like it." }] },
    { id: 'lu.s6', turns: [{ by: 'a', say: "Can I be honest? I don't think about the game when I'm with you." }, { by: 'b', say: "Is that a good thing?" }, { by: 'a', say: "For me, yes. For my game, probably not." }] },
    { id: 'lu.s7', turns: [{ beat: '{b} falls asleep on {a}\'s shoulder on the couch. {a} doesn\'t move for an hour.' }, { by: 'a', dr: "My arm went completely numb. I didn't care." }] },
    { id: 'lu.s8', turns: [{ by: 'b', say: "Everyone's going to come after us, you know." }, { by: 'a', say: "Let them. At least we've got each other." }] },
    { id: 'lu.s9', turns: [{ by: 'a', say: "Morning." }, { by: 'b', say: "Morning. I made you breakfast." }, { by: 'a', say: "You're too good to me." }] },
    { id: 'lu.s10', turns: [{ by: 'b', say: "Everyone's watching us." }, { by: 'a', say: "Let them watch." }, { beat: '{a} takes {b}\'s hand anyway.' }] },
    { id: 'lu.s11', turns: [{ by: 'b', dr: "{a} makes this place feel a bit less like a game. That's dangerous, I know. I don't care." }] },
    { id: 'lu.s12', turns: [{ by: 'a', say: "What are you thinking about?" }, { by: 'b', say: "Nothing. Just this." }, { by: 'a', say: "Good answer." }] },
    { id: 'lu.s13', turns: [{ by: 'a', say: "Can we just stay here and not talk about the vote?" }, { by: 'b', say: "That's my favourite plan you've ever had." }] },
  ],
  'life.couple.strained': [
    { id: 'lu.t1', turns: [{ by: 'b', say: "Can we talk?" }, { by: 'a', say: "Not here." }, { by: 'b', say: "Then where?" }, { by: 'a', say: "I don't know. Somewhere with no cameras." }, { by: 'b', say: "There isn't anywhere with no cameras." }] },
    { id: 'lu.t2', turns: [{ by: 'a', say: "Being a couple in here makes us a target. You know that." }, { by: 'b', say: "So what are you saying?" }, { by: 'a', say: "I don't know what I'm saying." }] },
    { id: 'lu.t3', turns: [{ by: 'b', say: "You've been quiet with me all day." }, { by: 'a', say: "I'm just stressed." }, { by: 'b', say: "About the game, or about us?" }, { by: 'a', say: "...Both." }] },
    { id: 'lu.t4', when: { room: ['bedroom'] }, turns: [{ beat: '{a} and {b} have a quiet argument in the bedroom. They stop when somebody walks in.' }, { by: 'b', dr: "We're fine. We're just not fine today." }] },
    { id: 'lu.t5', turns: [{ by: 'a', dr: "I keep thinking about the week one of us has to vote the other out. I don't want to, but I can't stop thinking about it." }] },
    { id: 'lu.t6', turns: [{ by: 'b', say: "Do you want to talk about the vote?" }, { by: 'a', say: "No. I want to not be in this house for five minutes." }, { by: 'b', say: "Okay. Fine." }] },
    { id: 'lu.t7', turns: [{ beat: '{a} and {b} spend the afternoon on opposite sides of the house.' }, { by: 'a', dr: "We needed some space. That's all. That's what I keep telling myself." }] },
    { id: 'lu.t8', turns: [{ by: 'b', say: "Who were you talking to all morning?" }, { by: 'a', say: "Just people. It's a game, {b}." }, { by: 'b', say: "I know it's a game. I'd just like to be in it with you." }] },
    { id: 'lu.t9', turns: [{ by: 'a', say: "Can we not do this right now?" }, { by: 'b', say: "When, then?" }, { by: 'a', say: "Later. Please." }] },
    { id: 'lu.t10', turns: [{ by: 'b', dr: "I like {a} a lot. But being a couple in here is hard. Everyone sees us as a pair, and pairs get split up." }] },
    { id: 'lu.t11', turns: [{ by: 'a', say: "I need you to not tell anyone about us talking strategy." }, { by: 'b', say: "Why would I?" }, { by: 'a', say: "I don't know. I'm just worried." }] },
    { id: 'lu.t12', turns: [{ beat: '{a} sits on one couch, {b} on the other. They haven\'t spoken since lunch.' }, { by: 'b', dr: "We'll sort it out. I just don't want to be the one who goes over first." }] },
  ],

  // ── a workout ── a and b
  'life.workout.scene': [
    { id: 'lw.1', turns: [{ by: 'a', say: "Ten more." }, { by: 'b', say: "I can't do ten more." }, { by: 'a', say: "Yes, you can. Go." }, { beat: '{b} does twelve.' }] },
    { id: 'lw.2', turns: [{ by: 'b', say: "Same time tomorrow?" }, { by: 'a', say: "Nine o'clock. Don't be late." }, { by: 'b', say: "Where would I be late from?" }] },
    { id: 'lw.3', when: { room: ['backyard'] }, turns: [{ by: 'b', say: "How do you do that?" }, { by: 'a', say: "Let me show you." }, { beat: '{a} shows {b}. It goes badly. They both end up laughing on the grass.' }] },
    { id: 'lw.4', turns: [{ by: 'a', dr: "Working out with {b} every morning has become the best part of my day. We don't even talk about the game." }] },
    { id: 'lw.5', turns: [{ by: 'b', say: "My legs don't work any more." }, { by: 'a', say: "That means it's working." }, { by: 'b', say: "I hate you." }] },
    { id: 'lw.6', turns: [{ by: 'a', say: "Race you to the end of the yard." }, { by: 'b', say: "It's a very small yard." }, { by: 'a', say: "Then it'll be a very short race." }] },
    { id: 'lw.7', turns: [{ by: 'b', dr: "I'm only working out because there's nothing else to do. And because {a} won't stop asking." }] },
    { id: 'lw.8', turns: [{ by: 'a', say: "You're getting stronger." }, { by: 'b', say: "Really?" }, { by: 'a', say: "No. But you're trying." }] },
    { id: 'lw.9', when: { room: ['backyard'] }, turns: [{ beat: '{a} and {b} stretch on the grass and talk about their old injuries for half an hour.' }, { by: 'b', dr: "That's the nicest conversation I've had all week." }] },
    { id: 'lw.10', turns: [{ by: 'b', say: "Do you ever skip a day?" }, { by: 'a', say: "Never." }, { by: 'b', say: "Can we skip today?" }, { by: 'a', say: "No." }] },
  ],
  // ── cooking for the house ── a cooks, b is fed
  'life.cook.scene': [
    { id: 'lk.1', turns: [{ by: 'a', say: "Dinner's ready! Everyone, come and eat!" }, { by: 'b', say: "You cooked for all of us?" }, { by: 'a', say: "Somebody had to." }] },
    { id: 'lk.2', turns: [{ by: 'b', say: "This is actually really good." }, { by: 'a', say: "Don't sound so surprised." }] },
    { id: 'lk.3', turns: [{ by: 'a', dr: "I like cooking for everyone. It's the only time we all sit down together." }] },
    { id: 'lk.4', turns: [{ by: 'b', say: "How did you make this out of what we've got?" }, { by: 'a', say: "Magic. And a lot of rice." }] },
    { id: 'lk.5', turns: [{ beat: 'For once, everyone in the house is at the table at the same time.' }, { by: 'b', say: "Thank you, {a}. Really." }, { by: 'a', say: "Just eat it while it's hot." }] },
    { id: 'lk.6', turns: [{ by: 'b', dr: "{a} feeds this whole house. That's going to count for something when we're voting." }] },
    { id: 'lk.7', turns: [{ by: 'b', say: "Can I help?" }, { by: 'a', say: "You can chop the onions." }, { by: 'b', say: "I'll be crying in thirty seconds." }, { by: 'a', say: "Welcome to the kitchen." }] },
    { id: 'lk.8', turns: [{ by: 'a', say: "Seconds?" }, { by: 'b', say: "Thirds, please." }] },
  ],
  // ── a game somebody invented ── a, b, c play
  'life.game.scene': [
    { id: 'lg.1', turns: [{ by: 'a', say: "Okay, new rule. If you drop the ball, you have to sing." }, { by: 'b', say: "That's a terrible rule." }, { by: 'a', say: "It's my game. My rules." }] },
    { id: 'lg.2', turns: [{ by: 'b', say: "That's not in the rules!" }, { by: 'a', say: "It is now." }, { by: 'b', say: "You can't just make up rules when you're losing!" }] },
    { id: 'lg.3', turns: [{ by: 'a', say: "I'm winning. Just so everyone knows." }, { by: 'b', say: "We know. You've told us four times." }] },
    { id: 'lg.4', turns: [{ beat: 'The card game has a scoreboard now. It is stuck to the fridge.' }, { by: 'a', dr: "I've won six games in a row. I'm not letting anyone forget it." }] },
    { id: 'lg.5', when: { third: true }, turns: [{ by: 'c', say: "Who invented this game?" }, { by: 'b', say: "Nobody remembers." }, { by: 'a', say: "Me. I invented it." }, { by: 'c', say: "You definitely didn't." }] },
    { id: 'lg.6', turns: [{ by: 'b', say: "How are you so good at pool?" }, { by: 'a', say: "Years of practice." }, { by: 'b', say: "You told me you'd never played!" }] },
    { id: 'lg.7', when: { third: true }, turns: [{ by: 'a', say: "Best of five?" }, { by: 'c', say: "We said that an hour ago." }, { by: 'b', say: "Best of nine, then." }] },
    { id: 'lg.8', turns: [{ by: 'b', dr: "We've been playing the same silly game for two hours. It's the most fun I've had in this house." }] },
    { id: 'lg.9', turns: [{ by: 'a', say: "Rematch." }, { by: 'b', say: "You've lost five times." }, { by: 'a', say: "Which is why I need a rematch." }] },
    { id: 'lg.10', when: { third: true }, turns: [{ beat: '{a}, {b} and {c} are taking the game far too seriously.' }, { by: 'c', say: "That's cheating!" }, { by: 'a', say: "It's strategy!" }] },
    { id: 'lg.11', turns: [{ by: 'a', say: "Loser does the dishes." }, { by: 'b', say: "Deal." }, { beat: '{b} loses. {b} does the dishes, complaining the whole time.' }] },
    { id: 'lg.12', turns: [{ by: 'b', say: "I don't even understand the rules any more." }, { by: 'a', say: "Nobody does. Just play." }] },
  ],
  // ── a real conversation ── a opens up to b
  'life.real.scene': [
    { id: 'll.1', turns: [{ by: 'a', say: "Can I tell you something I've never told anyone in here?" }, { by: 'b', say: "Of course." }, { by: 'a', say: "This year's been really hard. Coming here was me trying to start again." }, { by: 'b', say: "I'm really glad you're here." }] },
    { id: 'll.2', turns: [{ by: 'a', say: "I haven't said this out loud in years." }, { by: 'b', say: "You don't have to say it now." }, { by: 'a', say: "I want to." }, { beat: '{b} listens without interrupting.' }] },
    { id: 'll.3', turns: [{ by: 'b', dr: "{a} told me something tonight that nobody else in this house knows. I'm not going to use it. I'd never use it." }] },
    { id: 'll.4', turns: [{ by: 'a', say: "Sorry. I didn't mean to get this deep." }, { by: 'b', say: "Don't be sorry. I'm glad you told me." }] },
    { id: 'll.5', turns: [{ by: 'a', dr: "We didn't talk about the game once. We talked about real life. I didn't realise how much I needed that." }] },
    { id: 'll.6', turns: [{ by: 'b', say: "What do you want to do when you get out?" }, { by: 'a', say: "Honestly? Be kinder to myself." }, { by: 'b', say: "That's a good answer." }] },
    { id: 'll.7', turns: [{ by: 'a', say: "Do you ever feel like nobody in here actually knows you?" }, { by: 'b', say: "All the time." }, { by: 'a', say: "I feel like you might." }] },
    { id: 'll.8', turns: [{ by: 'a', say: "I've had a hard year. That's why I'm here, really." }, { by: 'b', say: "Do you want to tell me about it?" }, { by: 'a', say: "...Yeah. I think I do." }] },
    { id: 'll.9', turns: [{ by: 'b', dr: "It's strange. We're in a game where everyone lies. And tonight {a} was more honest with me than anyone's been in years." }] },
    { id: 'll.10', turns: [{ by: 'a', say: "Thanks for listening." }, { by: 'b', say: "Thanks for telling me." }] },
    { id: 'll.11', turns: [{ by: 'a', say: "This is going to sound strange, but I'm scared of going home." }, { by: 'b', say: "Why?" }, { by: 'a', say: "Because in here I've worked out who I am." }] },
    { id: 'll.12', turns: [{ by: 'a', dr: "I don't normally open up. {b} just made it easy." }] },
  ],
  // ── grooming ── a and b
  'life.grooming.scene': [
    { id: 'lm.1', turns: [{ by: 'b', say: "Sit still. I'm nearly done." }, { by: 'a', say: "You said that twenty minutes ago." }, { by: 'b', say: "Braids take time." }] },
    { id: 'lm.2', turns: [{ by: 'a', say: "How does it look?" }, { by: 'b', say: "...Good. It looks good." }, { by: 'a', say: "You paused." }, { by: 'b', say: "It'll grow back." }] },
    { id: 'lm.3', turns: [{ by: 'b', dr: "I've never done anyone's nails before. {a} doesn't need to know that." }] },
    { id: 'lm.4', turns: [{ by: 'a', say: "Can you do my hair tomorrow too?" }, { by: 'b', say: "Only if you stop moving your head." }] },
    { id: 'lm.5', turns: [{ beat: '{b} braids {a}\'s hair for an hour. They talk the whole time.' }, { by: 'a', dr: "It's the longest I've sat still since I got here. It was really nice." }] },
    { id: 'lm.6', turns: [{ by: 'a', say: "Are you sure you know how to use those clippers?" }, { by: 'b', say: "Absolutely." }, { by: 'a', say: "You're holding them upside down." }] },
    { id: 'lm.7', turns: [{ by: 'b', say: "Hold still. I'm going to give you the best haircut in the house." }, { by: 'a', say: "It's the only haircut in the house." }, { by: 'b', say: "Then it's definitely the best." }] },
    { id: 'lm.8', turns: [{ by: 'a', dr: "{b} and I barely spoke before today. An hour doing each other's hair, and now we're friends." }] },
  ],
  // ── talking about home ── a and b
  'life.home-talk.scene': [
    { id: 'lo.1', turns: [{ by: 'a', say: "Describe your kitchen at home." }, { by: 'b', say: "Why?" }, { by: 'a', say: "I just want to imagine being somewhere else." }] },
    { id: 'lo.2', turns: [{ by: 'a', say: "It's Sunday at home. Everyone will be having lunch." }, { by: 'b', say: "Please stop. I'm starving." }] },
    { id: 'lo.3', turns: [{ by: 'a', say: "What's the first thing you'll eat when you get out?" }, { by: 'b', say: "A proper sandwich. With everything on it." }, { by: 'a', say: "That's so specific." }, { by: 'b', say: "I've been thinking about it for weeks." }] },
    { id: 'lo.4', turns: [{ by: 'a', say: "I'm missing a really big day at home this week." }, { by: 'b', say: "I'm sorry." }, { by: 'a', say: "It's okay. They know I'd be there if I could." }] },
    { id: 'lo.5', turns: [{ by: 'b', dr: "We talked about home for an hour. It was lovely and it made me really sad at the same time." }] },
    { id: 'lo.6', turns: [{ by: 'a', say: "Tell me about where you grew up." }, { by: 'b', say: "Honestly? Nowhere special." }, { by: 'a', say: "Tell me anyway." }, { by: 'b', say: "Okay. But it's a boring story." }] },
    { id: 'lo.7', turns: [{ by: 'a', say: "Do you think about what everyone's doing outside?" }, { by: 'b', say: "Every day." }, { by: 'a', say: "Me too." }] },
    { id: 'lo.8', turns: [{ by: 'a', say: "My friends are going to be screaming at the TV right now." }, { by: 'b', say: "Mine too. Probably at me." }] },
    { id: 'lo.9', turns: [{ by: 'b', say: "What do you miss most?" }, { by: 'a', say: "Just walking. Anywhere, as long as it's away from everybody for five minutes." }, { by: 'b', say: "I never thought I'd miss walking." }] },
    { id: 'lo.10', turns: [{ by: 'a', dr: "{b} and I talked about home for ages. I'd forgotten there's a whole world out there." }] },
  ],
  // ── boredom ── a and b
  'life.boredom.scene': [
    { id: 'lb.1', turns: [{ by: 'a', say: "I'm so bored." }, { by: 'b', say: "Me too." }, { by: 'a', say: "Want to do something?" }, { by: 'b', say: "Like what?" }, { by: 'a', say: "...Nothing. There's nothing." }] },
    { id: 'lb.2', turns: [{ by: 'a', say: "There are 412 tiles in the bathroom." }, { by: 'b', say: "You counted them?" }, { by: 'a', say: "Twice." }] },
    { id: 'lb.3', turns: [{ beat: '{a} and {b} lie in the sun all afternoon, saying almost nothing.' }, { by: 'b', dr: "Best day I've had in two weeks. Nothing happened. That's why." }] },
    { id: 'lb.4', turns: [{ by: 'a', say: "Let's read the back of the washing-up liquid." }, { by: 'b', say: "We did that yesterday." }, { by: 'a', say: "Let's do it again." }] },
    { id: 'lb.5', turns: [{ by: 'a', dr: "Nothing has happened today. Literally nothing. I've never been this bored in my life." }] },
    { id: 'lb.6', turns: [{ by: 'b', say: "What time is it?" }, { by: 'a', say: "Two." }, { by: 'b', say: "It was two an hour ago." }, { by: 'a', say: "That's how it feels in here." }] },
    { id: 'lb.7', turns: [{ by: 'a', say: "Wake me up when something happens." }, { by: 'b', say: "Nothing's going to happen." }, { by: 'a', say: "Then don't wake me up." }] },
    { id: 'lb.8', turns: [{ by: 'b', say: "Do you want to play I spy?" }, { by: 'a', say: "We've spied everything in this house." }] },
    { id: 'lb.9', turns: [{ by: 'a', say: "I've cleaned everything twice and it's not even lunchtime." }, { by: 'b', say: "Clean it a third time." }] },
    { id: 'lb.10', turns: [{ by: 'b', dr: "I slept for fourteen hours. Nobody woke me up, because there was nothing to wake up for." }] },
  ],
  // ── an inside joke ── a, b, c are in on it
  'life.inside-joke.scene': [
    { id: 'li.1', turns: [{ by: 'a', say: "Banana." }, { beat: '{b} and {c} burst out laughing. Nobody else in the room has any idea why.' }] },
    { id: 'li.2', turns: [{ by: 'b', say: "Should I tell them?" }, { by: 'a', say: "No. You had to be there." }, { by: 'c', say: "You really did have to be there." }] },
    { id: 'li.3', turns: [{ by: 'a', dr: "Something silly happened at breakfast, and now it's the funniest thing in the world. I can't even explain why." }] },
    { id: 'li.4', turns: [{ beat: '{c} says it at exactly the wrong moment, in the middle of a serious conversation. {a} and {b} have to leave the room.' }, { by: 'a', dr: "We couldn't stop laughing. It wasn't even that funny." }] },
    { id: 'li.5', turns: [{ beat: 'Somebody asks what is so funny.' }, { by: 'a', say: "Nothing." }, { by: 'c', say: "Absolutely nothing." }, { beat: '{a}, {b} and {c} start laughing again.' }] },
    { id: 'li.6', turns: [{ by: 'a', dr: "We've got a joke nobody else understands. It's stupid. I love it." }] },
    { id: 'li.7', turns: [{ by: 'c', say: "Do you remember how it even started?" }, { by: 'a', say: "No idea." }, { by: 'b', say: "Doesn't matter." }] },
    { id: 'li.8', turns: [{ by: 'b', dr: "Everyone else thinks we're mad. We probably are. It's still funny." }] },
  ],
};
