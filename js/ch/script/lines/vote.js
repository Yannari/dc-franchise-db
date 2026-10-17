// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/vote.js — the vote, said out loud
// ══════════════════════════════════════════════════════════════════════
//
// TJ opens it, asks every player in turn, and reads the result. A ballot is
// a = the voter, b = the name, and its ending is the engine's reason
// (ceremony.js): plan (the alliance's name), word (kept a promise to a
// recruiter), own (their own read), falseyes (said yes to a plan, votes
// otherwise), broke (broke from the plan in front of it), changed (told the
// house one name, said another).
//
// A ceremony is twenty ballots in one day, and the picker never lets a line
// be heard twice in a day, so these pools are deep: every reason pool merges
// with ballot.any. Ballots are short — on the real show most people say the
// name and one sentence — and the long ones are the moments: a friend voting
// a friend, a flip, a betrayal said to someone's face.

export default {
  'cer-open.m': [
    { id: 'co.m1', turns: [{ by: 'tj', say: "Guys' week, people! One of you fellas is going into the Arena, and the house decides who. Let's hear it." }] },
    { id: 'co.m2', turns: [{ by: 'tj', say: "Alright, it's a men's vote. Everybody's going to say a name, out loud, to my face. No take-backs, no whispering. Let's go." }] },
    { id: 'co.m3', turns: [{ by: 'tj', say: "Fellas, look around. One of you is about to have a very bad week. Ladies, you're voting too, so don't get comfortable." }] },
  ],
  'cer-open.f': [
    { id: 'co.f1', turns: [{ by: 'tj', say: "Ladies' week! One of you queens is going into the Arena, and the whole house gets a say. Who's it gonna be?" }] },
    { id: 'co.f2', turns: [{ by: 'tj', say: "It's a women's vote, people. One name each, said nice and loud. I love this part. I'm not supposed to love this part, but I love this part." }] },
    { id: 'co.f3', turns: [{ by: 'tj', say: "Ladies, one of you is going into the Arena. Fellas, you're voting, so think hard. Let's go around the room." }] },
  ],
  'cer-open.all': [
    { id: 'co.a1', turns: [{ by: 'tj', say: "Here we go, people. One name each, out loud. Whoever gets the most is going into the Arena." }] },
    { id: 'co.a2', turns: [{ by: 'tj', say: "Deliberation's over. Time to put your money where your mouth is. Who's going in?" }] },
    { id: 'co.a3', turns: [{ by: 'tj', say: "I want names, and I want reasons, and I want drama. Mostly the drama. Let's do it." }] },
  ],

  // ── any ballot ──────────────────────────────────────────────────────
  'ballot.any': [
    { id: 'bl.1', turns: [{ by: 'a', say: '{b}.' }] },
    { id: 'bl.2', turns: [{ by: 'a', say: "I'm voting for {b}." }] },
    { id: 'bl.3', turns: [{ by: 'a', say: "{b}. Nothing personal." }] },
    { id: 'bl.4', turns: [{ by: 'a', say: "I'm going to say {b}." }] },
    { id: 'bl.5', turns: [{ by: 'a', say: "{b}, because I think it's time." }] },
    { id: 'bl.6', turns: [{ by: 'a', say: "My vote is {b}." }] },
    { id: 'bl.7', turns: [{ by: 'a', say: "It's {b} for me." }] },
    { id: 'bl.8', turns: [{ by: 'a', say: "{b}. I think we all saw this coming." }] },
    { id: 'bl.9', turns: [{ by: 'a', say: "I'm going {b}. Let's see what {b.sub} can do in there." }] },
    { id: 'bl.10', turns: [{ by: 'tj', say: '{a}?' }, { by: 'a', say: '{b}.' }] },
    { id: 'bl.11', turns: [{ by: 'tj', say: "{a}, my friend, who you got?" }, { by: 'a', say: "{b}, TJ." }] },
    { id: 'bl.12', turns: [{ by: 'tj', say: "{a}, your turn." }, { by: 'a', say: "I'm voting {b}." }] },
    { id: 'bl.13', turns: [{ by: 'a', say: "{b}. Sorry." }] },
    { id: 'bl.14', turns: [{ by: 'a', say: "I'll say {b}." }] },
    { id: 'bl.15', turns: [{ by: 'a', say: "{b}, and I'll stand by it." }] },
    { id: 'bl.16', turns: [{ by: 'tj', say: "Who's it gonna be, {a}?" }, { by: 'a', say: "{b}." }] },
    { id: 'bl.17', turns: [{ by: 'a', say: "Honestly? {b}." }] },
    { id: 'bl.18', turns: [{ by: 'a', say: "{b}. Good luck in there." }] },
    { id: 'bl.19', when: { band: 'friends' }, turns: [{ by: 'a', say: "This one hurts, but... {b}." }] },
    { id: 'bl.20', when: { band: 'friends' }, turns: [{ by: 'a', say: "{b}. I'm sorry. I'll explain later." }, { by: 'b', say: 'Wow.' }] },
    { id: 'bl.21', when: { band: 'enemies', early: false }, turns: [{ by: 'a', say: "{b}. Obviously." }] },
    { id: 'bl.22', when: { band: 'enemies', early: false }, turns: [{ by: 'a', say: "{b}. And I'd do it every week if they let me." }] },
    { id: 'bl.23', when: { band: 'cold', early: false }, turns: [{ by: 'a', say: "{b}. We both know why." }] },
    { id: 'bl.24', when: { register: 'fiery' }, turns: [{ by: 'a', say: "{b}! Next question." }] },
    { id: 'bl.25', when: { register: 'shy' }, turns: [{ by: 'a', say: "Um... {b}." }] },
    { id: 'bl.26', when: { register: 'sweet' }, turns: [{ by: 'a', say: "I really like you, {b}, but I'm voting for you. I'm sorry." }] },
    { id: 'bl.27', when: { register: 'cool' }, turns: [{ by: 'a', say: "{b}. It's the right move." }] },
    { id: 'bl.28', when: { register: 'competitor' }, turns: [{ by: 'a', say: "{b}. If you want to stay, go win." }] },
    { id: 'bl.29', when: { register: 'schemer' }, turns: [{ by: 'a', say: "{b}. And I'm sure you understand." }] },
  ],
  // ── a ballot that says why: the voter's own reason (vote.js reasonOf), one short line, out loud ──
  'ballot-why.threat': [
    { id: 'bwy.t1', when: { proven: true }, turns: [{ by: 'a', say: "{b}. You're winning too much, and somebody has to stop it now." }] },
    { id: 'bwy.t2', turns: [{ by: 'a', say: "{b}. If you get to the final, none of us win. That's it." }] },
    { id: 'bwy.t3', turns: [{ by: 'a', say: "I'm saying {b}. You're the best player in this house, and that's a compliment." }] },
    { id: 'bwy.t4', turns: [{ by: 'a', say: "{b}. I'd rather face you now than in the final." }] },
    { id: 'bwy.t5', turns: [{ by: 'a', say: "{b}. Every week you're still here, you get harder to beat." }] },
  ],
  'ballot-why.grudge': [
    { id: 'bwy.g1', turns: [{ by: 'a', say: "{b}. You know exactly why." }] },
    { id: 'bwy.g2', turns: [{ by: 'a', say: "{b}. You came after me, so I'm coming after you." }] },
    { id: 'bwy.g3', turns: [{ by: 'a', say: "It's {b}. I haven't forgotten, and I'm not going to." }] },
    { id: 'bwy.g4', turns: [{ by: 'a', say: "{b}. This one's personal, and I'm fine with everybody knowing it." }] },
    { id: 'bwy.g5', turns: [{ by: 'a', say: "{b}. You started this. I'm finishing it." }] },
  ],
  'ballot-why.easy': [
    { id: 'bwy.e1', turns: [{ by: 'a', say: "{b}. Honestly, I think whoever you pick can beat you in there." }] },
    { id: 'bwy.e2', turns: [{ by: 'a', say: "I'm saying {b}. It's the safest vote for the rest of us." }] },
    { id: 'bwy.e3', turns: [{ by: 'a', say: "{b}. Nothing personal. I just think you go home." }] },
    { id: 'bwy.e4', turns: [{ by: 'a', say: "{b}. I want this week to be over without any surprises." }] },
    { id: 'bwy.e5', turns: [{ by: 'a', say: "{b}. You're not at your best right now, and everybody can see it." }] },
  ],
  'ballot-why.strategy': [
    { id: 'bwy.s1', turns: [{ by: 'a', say: "{b}. Whatever happens in that Arena, it's good for me. Sorry." }] },
    { id: 'bwy.s2', turns: [{ by: 'a', say: "{b}. I've thought about it all day, and it's the move." }] },
    { id: 'bwy.s3', turns: [{ by: 'a', say: "{b}. Win or lose in there, somebody I'm worried about leaves." }] },
    { id: 'bwy.s4', turns: [{ by: 'a', say: "I'm going {b}. It's a chess move. Don't take it personally." }] },
  ],
  'ballot-why.floater': [
    { id: 'bwy.f1', when: { neverIn: true }, turns: [{ by: 'a', say: "{b}. You've never been in. It's time." }] },
    { id: 'bwy.f2', when: { neverIn: true }, turns: [{ by: 'a', say: "{b}. Everybody else has had to fight. Your turn." }] },
    { id: 'bwy.f3', when: { early: false }, turns: [{ by: 'a', say: "{b}. You've been hiding all season, and I'm done carrying you." }] },
    { id: 'bwy.f4', turns: [{ by: 'a', say: "{b}. Let's see what you can actually do." }] },
  ],
  'ballot-why.power': [
    { id: 'bwy.p1', turns: [{ by: 'a', say: "{b}. Your group runs this house, and somebody has to break it up." }] },
    { id: 'bwy.p2', turns: [{ by: 'a', say: "{b}. If I don't go at your alliance now, we never will." }] },
    { id: 'bwy.p3', turns: [{ by: 'a', say: "{b}. You've got too many friends in here. That's the reason." }] },
    { id: 'bwy.p4', turns: [{ by: 'a', say: "{b}. Somebody has to take a shot at the big group. Might as well be me." }] },
  ],
  'ballot-why.room': [
    { id: 'bwy.r1', turns: [{ by: 'a', say: "Looks like it's going {b}. I'm not going to fight the room." }] },
    { id: 'bwy.r2', turns: [{ by: 'a', say: "{b}. I heard the count. I'm not throwing my vote away." }] },
    { id: 'bwy.r3', turns: [{ by: 'a', say: "{b}. I'll go where the votes are." }] },
    { id: 'bwy.r4', turns: [{ by: 'a', say: "{b}. I wasn't sure walking in. Now I am." }] },
  ],
  'ballot-why.money': [
    { id: 'bwy.m1', when: { richest: true }, turns: [{ by: 'a', say: "{b}. You've got the biggest bank in here. Somebody needs to take half of it." }] },
    { id: 'bwy.m2', turns: [{ by: 'a', say: "{b}. All that money makes you a target. Sorry." }] },
    { id: 'bwy.m3', turns: [{ by: 'a', say: "{b}. Whoever beats you gets rich. I like those odds for somebody." }] },
    { id: 'bwy.m4', when: { early: false }, turns: [{ by: 'a', say: "{b}. You've been winning money all season. Time somebody else got some." }] },
  ],
  'ballot.plan': [
    { id: 'bp.1', turns: [{ by: 'a', say: "{b}. I'm sticking with my people." }] },
    { id: 'bp.2', turns: [{ by: 'a', say: "{b}. I think we all know how this one's going." }] },
    { id: 'bp.3', turns: [{ by: 'a', say: "I'm voting {b}, because I think it's best for the people I'm working with." }] },
    { id: 'bp.4', turns: [{ by: 'a', say: "{b}. That's where I'm at." }, { by: 'a', conf: "I didn't pick {b}. My alliance did. I just said it out loud." }] },
    { id: 'bp.5', turns: [{ by: 'a', say: "{b}. I'm not going rogue this week." }] },
    { id: 'bp.6', when: { band: 'friends' }, turns: [{ by: 'a', say: "{b}... I'm sorry. My hands are kind of tied." }, { by: 'a', conf: "Voting for {b} was the worst thing I've done in here. I did it for the group." }] },
  ],
  'ballot.word': [
    { id: 'bw.1', turns: [{ by: 'a', say: "{b}. I gave my word to somebody, and I keep my word." }] },
    { id: 'bw.2', turns: [{ by: 'a', say: "{b}. I said I would, so I am." }] },
    { id: 'bw.3', turns: [{ by: 'a', say: "{b}. A promise is a promise." }] },
  ],
  'ballot.own': [
    { id: 'bo.1', turns: [{ by: 'a', say: "{b}. Nobody told me to. This one's all me." }] },
    { id: 'bo.2', turns: [{ by: 'a', say: "{b}. I'm voting with my gut." }] },
    { id: 'bo.3', turns: [{ by: 'a', say: "{b}, because I think that's the biggest threat to me in this house." }] },
    { id: 'bo.4', turns: [{ by: 'a', say: "I'm not in anybody's group, so I'll just say it. {b}." }] },
    { id: 'bo.5', turns: [{ by: 'a', say: "{b}. I make my own decisions." }] },
  ],
  'ballot.falseyes': [
    { id: 'bf.1', turns: [
      { by: 'a', say: '{b}.' },
      { beat: "A couple of heads snap around. That wasn't the name {a} promised." },
      { by: 'a', conf: "Yes, I said I'd vote with them. I lied. Welcome to The Challenge." },
    ] },
    { id: 'bf.2', turns: [
      { by: 'a', say: "{b}." },
      { by: 'tj', say: "Ooh! Was that a surprise? I feel like that was a surprise. Somebody's face just did a thing." },
      { by: 'a', conf: "They'll be mad. They'll get over it, or they won't. Either way, I did what I needed to." },
    ] },
    { id: 'bf.3', turns: [
      { by: 'a', say: "I'm voting {b}." },
      { beat: 'Somebody across the room mouths "what?"' },
      { by: 'a', conf: "I had to look them in the eye this morning and agree with them. Tonight I didn't have to pretend anymore." },
    ] },
  ],
  'ballot.broke': [
    { id: 'bb.1', turns: [
      { by: 'a', say: "{b}. I know that's not what we said. I'm sorry." },
      { by: 'a', conf: "I went back and forth all day. In the end I couldn't do what they wanted, so I did what I wanted." },
    ] },
    { id: 'bb.2', turns: [
      { by: 'a', say: "I'm going {b}, and I know some of you are going to be mad at me." },
      { beat: "Somebody in {a}'s alliance shakes their head slowly." },
    ] },
    { id: 'bb.3', turns: [
      { by: 'a', say: "{b}. I had to break from the group this week." },
      { by: 'a', conf: "Following the plan would have been easier. It also would have put me next in line." },
    ] },
  ],
  'ballot.changed': [
    { id: 'bc.1', turns: [
      { by: 'a', say: "I... {b}. I'm going {b}." },
      { by: 'a', conf: "I came in planning to vote for somebody else. Then I heard where everybody was going, and I changed my mind." },
    ] },
    { id: 'bc.2', turns: [
      { by: 'a', say: "{b}." },
      { by: 'tj', say: "Ooh, I did not see that one coming. Keep going." },
    ] },
    { id: 'bc.3', turns: [
      { by: 'a', say: "I changed my mind. {b}." },
      { by: 'a', conf: "When I saw where the votes were going, I wasn't going to be the one person on the wrong side of it." },
    ] },
  ],

  // ── the house talks it out, in front of everybody, before the vote ──────
  // a proposes the name, b is the name, c objects, d backs a. Said to each other's faces, the way the real
  // show's deliberation goes ("You guys are monsters." "This is the game.").
  'house-debate.one': [
    { id: 'hd.o1', turns: [
      { beat: 'Before the vote, the whole house ends up in the common room to talk it out. Nobody sits down.' },
      { by: 'a', say: "Okay. We all know why we're here. Somebody has to start, so I will." },
      { by: 'x', opt: 1, say: "Go on, then." },
      { by: 'a', say: "I think it should be {b}. {case}." },
      { by: 'b', say: "Wow. Okay. And everybody's just nodding?" },
      { by: 'c', say: "I'm not nodding. I think this is a mistake." },
      { by: 'a', say: "Then give me another name. A real one." },
      { by: 'c', say: "I'm not going to throw somebody else under the bus just to save {b}." },
      { by: 'd', say: "Then it's {b}. That's where the numbers are." },
      { by: 'b', say: "Fine. If it's me, it's me. But remember who started this." },
      { by: 'b', conf: "I walked into that room thinking I was one of them, and I walked out as the name." },
    ] },
    { id: 'hd.o2', turns: [
      { beat: 'After dinner, somebody turns the music off. Everybody knows what that means: time to talk about the vote.' },
      { by: 'a', say: "I'm not going to dance around it. I'm voting {b}." },
      { by: 'b', say: "Why?" },
      { by: 'a', say: "Honestly? {case}." },
      { by: 'b', say: "That's your reason?" },
      { by: 'd', say: "It's my reason too, for what it's worth." },
      { by: 'y', opt: 1, say: "Same. Sorry, {b}." },
      { by: 'c', say: "I'm not voting {b}. I want that on the record." },
      { by: 'a', say: "That's fine. You're allowed. It's still {b}." },
      { by: 'c', conf: "It was decided before anybody walked in. The meeting was just so they could say they asked." },
    ] },
    { id: 'hd.o3', turns: [
      { beat: 'The house sits around the fire pit in the common room. {a} stays standing.' },
      { by: 'a', say: "Can we talk about tonight? Openly. No whispering in corners." },
      { by: 'c', say: "Sure. Who are you thinking?" },
      { by: 'a', say: "{b}." },
      { by: 'b', say: "Of course you are." },
      { by: 'a', say: "It's not personal. {case}." },
      { by: 'c', say: "You could say that about half the people in this room." },
      { by: 'd', say: "But half the people in this room aren't eligible. {b} is." },
      { by: 'x', opt: 1, say: "I don't love it, but I get it." },
      { by: 'b', conf: "They call it a conversation. It wasn't. It was an announcement with a few questions at the end." },
    ] },
    { id: 'hd.o4', turns: [
      { beat: 'Everybody ends up in the kitchen. {b} is the last one to walk in, and the talking stops.' },
      { by: 'b', say: "You can keep going. I know you're talking about me." },
      { by: 'a', say: "We are. I'm not going to lie to you." },
      { by: 'b', say: "Then tell me why." },
      { by: 'a', say: "{case}. That's it. That's the whole reason." },
      { by: 'c', say: "For the record, I think we're making it way too easy for ourselves." },
      { by: 'd', say: "Easy is fine. Easy keeps us safe." },
      { by: 'b', say: "Okay. I'll see whoever I pick in the Arena." },
      { by: 'a', conf: "Somebody has to say the name first. It might as well be me, and it might as well be to {b}'s face." },
    ] },
  ],
  'house-debate.split': [
    { id: 'hd.s1', turns: [
      { beat: 'Before the vote, the house gathers in the common room to talk it through. There are two names in the air.' },
      { by: 'a', say: "Let's not waste time. I think it's {b} this week. {case}." },
      { by: 'c', say: "I don't agree. I think it should be {alt}." },
      { by: 'a', say: "Why {alt}?" },
      { by: 'c', say: "Because {altcase}." },
      { by: 'b', say: "Thank you. Somebody's finally saying it." },
      { by: 'd', say: "Maybe. But {b} is the vote that's already there." },
      { by: 'x', opt: 1, say: "I could go either way, honestly." },
      { by: 'c', say: "Then go the right way." },
      { by: 'c', conf: "I said {alt}'s name out loud in front of everybody. If this goes {b}'s way, I've just made an enemy for nothing." },
    ] },
    { id: 'hd.s2', turns: [
      { beat: 'After dinner nobody leaves the table. {a} clears their throat.' },
      { by: 'a', say: "I'll say it. I'm voting {b}." },
      { by: 'b', say: "Of course you are." },
      { by: 'a', say: "{case}. I'm not going to pretend otherwise." },
      { by: 'c', say: "And what about {alt}?" },
      { by: 'a', say: "What about {alt}?" },
      { by: 'c', say: "{altcase}. If we're being honest, that's who should go." },
      { by: 'd', say: "So now there are two names. Great." },
      { by: 'y', opt: 1, say: "Two names is better than one name nobody chose." },
      { by: 'b', conf: "There was a real argument in that room. I don't know yet if it was enough." },
    ] },
    { id: 'hd.s3', turns: [
      { beat: 'The whole house is in the common room. The TV is off. Nobody is pretending this is anything but the vote.' },
      { by: 'a', say: "I think it has to be {b}. I'm sorry." },
      { by: 'b', say: "Don't be sorry. Just tell me why." },
      { by: 'a', say: "{case}." },
      { by: 'c', say: "I hear that. But I'm saying {alt}." },
      { by: 'd', say: "Why {alt}?" },
      { by: 'c', say: "{altcase}." },
      { by: 'x', opt: 1, say: "That's actually a fair point." },
      { by: 'a', say: "Fair or not, {b} is where the votes are." },
      { by: 'c', conf: "Maybe I changed one mind in there. Maybe none. At least I said it." },
    ] },
    { id: 'hd.s4', turns: [
      { beat: 'Everybody is out on the deck after dinner. {c} stands up before anybody else can.' },
      { by: 'c', say: "Before we all just say {b}, can I make a case for somebody else?" },
      { by: 'a', say: "Go ahead." },
      { by: 'c', say: "{alt}. {altcase}." },
      { by: 'a', say: "And I'd say {case}." },
      { by: 'b', say: "I'm standing right here, you know." },
      { by: 'd', say: "Split the vote and nobody knows who's going in. That's how people get blindsided." },
      { by: 'c', say: "Good. I'd rather it be close than easy." },
      { by: 'b', conf: "{c} stood up for me. I'll remember that. I'll remember who didn't, too." },
    ] },
  ],

  // ── the day of the Arena: the one going in, thinking the pick through (never saying it) ──
  'pick-talk.any': [
    { id: 'pick.1', turns: [
      { beat: '{a} and {b} sit apart from everybody else.' },
      { by: 'b', say: "Have you decided?" },
      { by: 'a', say: "Not yet. It's between {opt1} and {opt2}." },
      { by: 'b', say: "Who do you beat?" },
      { by: 'a', say: "That's the thing. I think I beat both of them. I just don't know which one I want gone more." },
      { by: 'b', say: "Then pick the one who'd pick you." },
      { by: 'a', say: "{opt1} would pick me in a heartbeat." },
      { by: 'b', say: "So?" },
      { by: 'a', say: "So I'm still thinking." },
      { by: 'a', conf: "I know who I'm picking. I'm not saying it out loud until I'm standing in that Arena." },
    ] },
    { id: 'pick.2', turns: [
      { by: 'b', say: "So who is it?" },
      { by: 'a', say: "I'm not saying. Not even to you." },
      { by: 'b', say: "Come on. It's me." },
      { by: 'a', say: "If I tell you and it gets out, they've got all day to get in my head." },
      { by: 'b', say: "Okay. Then just tell me it's not {opt1}. {opt1} is good in there." },
      { by: 'a', say: "{opt1} is good. So is {opt2}. Everybody left is good." },
      { by: 'b', say: "That's not making me feel any better." },
      { by: 'a', say: "You'll hear it when everybody else does." },
      { by: 'a', conf: "{b} wants a name. Nobody gets a name. The first person to hear it is the person I pick." },
    ] },
    { id: 'pick.3', turns: [
      { by: 'a', say: "Can I think out loud for a minute?" },
      { by: 'b', say: "Go." },
      { by: 'a', say: "{opt1} is stronger. {opt2} has more friends in this house." },
      { by: 'b', say: "So if you send {opt2} home, half the house is angry with you." },
      { by: 'a', say: "And if I pick {opt1}, I might be the one going home." },
      { by: 'b', say: "Then it comes down to whether you're thinking about tonight or next week." },
      { by: 'a', say: "Next week. I'm always thinking about next week." },
      { by: 'b', say: "Then you already know." },
      { by: 'a', conf: "I've gone back and forth all night. I know who it is. I just needed to hear myself say the reasons." },
    ] },
    { id: 'pick.4', turns: [
      { by: 'b', say: "You look like you didn't sleep." },
      { by: 'a', say: "I didn't." },
      { by: 'b', say: "Because of the pick?" },
      { by: 'a', say: "Because of the pick. {opt1}, {opt2}, {opt1}, {opt2}. All night." },
      { by: 'b', say: "Whoever it is, you go in there and you don't look back." },
      { by: 'a', say: "I won't." },
      { by: 'b', say: "And whatever happens, I'm right there in the stand." },
      { by: 'b', conf: "{a} won't tell me who it is. I think {a} knows. I think {a} is just scared of saying it." },
    ] },
  ],
  // ── the day of the Arena: the people who could be picked, waiting ──
  'pick-guess.any': [
    { id: 'guess.1', turns: [
      { by: 'a', say: "Who do you think {target} picks?" },
      { by: 'b', say: "Honestly? Could be any of us." },
      { by: 'c', opt: 1, say: "It's not me. {target} and I are fine." },
      { by: 'a', opt: 'c', say: "That's what everybody says right before they get picked." },
      { by: 'b', say: "If it's me, I'm ready. I've been ready all week." },
      { by: 'a', say: "Me too. I just hate waiting." },
      { by: 'b', conf: "Everybody in that room was doing the same math. Whose name is {target} going to say tonight." },
    ] },
    { id: 'guess.2', turns: [
      { beat: 'Nobody talks much today. Every few minutes somebody looks over at {target}.' },
      { by: 'a', say: "Has {target} said anything to you?" },
      { by: 'b', say: "Not a word. Has {target} said anything to you?" },
      { by: 'a', say: "No. Which means it could be me." },
      { by: 'c', opt: 1, say: "Or me." },
      { by: 'b', say: "Or me. Great. So we're all scared." },
      { by: 'a', say: "I'm not scared. I just want to know." },
      { by: 'a', conf: "The worst part isn't the Arena. It's the day before, waiting to find out if it's you." },
    ] },
    { id: 'guess.3', turns: [
      { by: 'a', say: "If {target} picks me, I want you screaming in the stand." },
      { by: 'b', say: "And if {target} picks me?" },
      { by: 'a', say: "Then I'm screaming for you." },
      { by: 'c', opt: 1, say: "And if it's me, both of you scream." },
      { by: 'b', say: "Deal." },
      { by: 'b', conf: "Only one of us is going in tonight. We all know it. Nobody's saying who they hope it is." },
    ] },
    { id: 'guess.4', turns: [
      { by: 'a', say: "I walked past {target} this morning." },
      { by: 'b', say: "And?" },
      { by: 'a', say: "And {target} wouldn't look at me. Not once." },
      { by: 'b', say: "That doesn't mean anything." },
      { by: 'a', say: "It means something. Nobody looks at the person they're about to pick." },
      { by: 'c', opt: 1, say: "{target} didn't look at me either. Maybe {target} isn't looking at anybody." },
      { by: 'b', say: "Then go in there tonight and win, whoever it is." },
      { by: 'a', conf: "I'm not going to beg {target}. If it's me, it's me. I'll be ready." },
    ] },
  ],

  // ── after the vote: the one going in, and the friend who comes to find them ──
  'after-vote.any': [
    { id: 'av.1', turns: [
      { beat: '{b} finds {a} sitting outside by the pool, alone.' },
      { by: 'b', say: "Hey. Are you okay?" },
      { by: 'a', say: "No. I really thought I was safe this week." },
      { by: 'b', say: "You're going to win in there. I mean it." },
      { by: 'a', conf: "I really thought I had more friends in this house than that." },
    ] },
    { id: 'av.2', turns: [
      { by: 'b', say: "I didn't say your name. I want you to know that." },
      { by: 'a', say: "I know. I heard. Thank you." },
      { by: 'b', say: "Go in there and come back. Then we deal with the rest of them." },
      { by: 'a', conf: "I know exactly who's still with me. It's a shorter list than I thought." },
    ] },
    { id: 'av.3', turns: [
      { beat: '{a} goes straight to the bedroom. {b} follows a minute later.' },
      { by: 'b', say: "Can I sit?" },
      { by: 'a', say: "Yeah. I just didn't want to be in there with all of them." },
      { by: 'b', say: "You can win in there. I've watched you all season." },
      { by: 'a', say: "I know. I just hate that it was this easy for them." },
      { by: 'a', conf: "{count} votes. They didn't even have to argue about it." },
    ] },
    { id: 'av.4', turns: [
      { beat: '{b} brings {a} a glass of water and sits down on the step next to {a}.' },
      { by: 'b', say: "Drink this. You're shaking." },
      { by: 'a', say: "I'm not scared. I'm angry." },
      { by: 'b', say: "Good. Angry wins Arenas." },
      { by: 'a', say: "Who do I even pick?" },
      { by: 'b', say: "Sleep on it. You'll know in the morning." },
      { by: 'a', conf: "{b} didn't say anything clever. {b} just sat with me. Right now that's worth more than any alliance." },
    ] },
    { id: 'av.5', turns: [
      { by: 'a', say: "Don't tell me it'll be fine." },
      { by: 'b', say: "I wasn't going to." },
      { by: 'a', say: "Then what were you going to say?" },
      { by: 'b', say: "That I'd rather it was anybody else in there. And that I'll be in the stands." },
      { by: 'a', say: "Okay. That I can take." },
      { by: 'a', conf: "{count} people stood up and said my name. One person came to find me after. I'll remember both." },
    ] },
    { id: 'av.6', turns: [
      { beat: '{a} is in the gym, hitting the bag, when {b} walks in.' },
      { by: 'b', say: "Want me to hold it?" },
      { by: 'a', say: "Sure." },
      { by: 'b', say: "Harder. Pretend it's whoever you're picking." },
      { by: 'a', say: "I haven't decided yet." },
      { by: 'b', say: "Then pretend it's all of them." },
      { by: 'a', conf: "I came in here to be alone. {b} didn't let me, and I'm glad." },
    ] },
  ],
  'after-vote.stung': [
    { id: 'av.s1', turns: [
      { by: 'a', say: "{c} said my name. Did you hear that? {c}!" },
      { by: 'b', say: "I heard. I don't get it either." },
      { by: 'a', say: "I would have never said {c}'s name. Never." },
      { by: 'a', conf: "Of everybody in that room, {c} is the one I didn't see coming." },
    ] },
    { id: 'av.s2', turns: [
      { beat: '{a} walks out of the common room without looking at anybody.' },
      { by: 'b', say: "Hey, wait. Talk to me." },
      { by: 'a', say: "{c} looked me in the eye and said my name. After everything." },
      { by: 'b', say: "I know. I'm so sorry." },
      { by: 'a', conf: "I'll beat whoever I call out. Then I'm coming back for {c}." },
    ] },
  ],

  // ── the result ──────────────────────────────────────────────────────
  'cer-result.clear': [
    { id: 'cr.c1', turns: [
      { by: 'tj', say: "With {count} votes, {a}, you're going into the Arena tomorrow night. And when you get there, you pick who goes in with you." },
      { by: 'a', conf: "I knew it was coming. Hearing it said out loud is still a punch in the stomach." },
    ] },
    { id: 'cr.c2', turns: [
      { by: 'tj', say: "The house has spoken, with {count} votes. {a}, buddy, it's you." },
      { by: 'a', say: "Yeah. I figured." },
    ] },
    { id: 'cr.c3', turns: [
      { by: 'tj', say: "And that's {count} for {a}! You're going in, my friend. Tomorrow night, at the Arena, you choose your fighter." },
      { by: 'a', conf: "I'm not going to cry about it. I'm going to go in there and win." },
    ] },
    // no count (a single vote has no count line: roles.js)
    { id: 'cr.c4', turns: [
      { by: 'tj', say: "That's the vote. {a}, you're going into the Arena tomorrow night, and you get to pick who goes in with you." }, 
      { by: 'a', conf: "It's done. Now I get to choose, and I'm going to choose well." },
    ] },
    { id: 'cr.c5', turns: [
      { by: 'tj', say: "The votes are in. {a}, it's you. Tomorrow night, the Arena." },
      { by: 'a', say: "Fine. Then I'll make tomorrow count." },
    ] },
  ],
  'cer-result.tie': [
    { id: 'ct.1', turns: [
      { by: 'tj', say: "Oh, we've got a TIE! And you know what that means. Today's winners break it. Winners, who's it gonna be?" },
      { beat: 'The daily winners look at each other. It takes them a long time.' },
      { by: 'tj', say: "The tiebreakers have decided. {a}, you're going in." },
      { by: 'a', conf: "It came down to two people choosing between me and somebody else, and they chose me. I'm going to remember that." },
    ] },
    { id: 'ct.2', turns: [
      { by: 'tj', say: "A tie! My favorite! Winners, the decision is all yours. No pressure. Actually, a lot of pressure." },
      { by: 'tj', say: "And it's {a}! You're going into the Arena." },
    ] },
    { id: 'ct.3', turns: [
      { by: 'tj', say: "Dead even, people. Our daily winners have to settle it." },
      { beat: 'A long pause. Somebody coughs.' },
      { by: 'tj', say: "{a}. The tiebreakers picked you. Sorry, buddy." },
    ] },
  ],
  // the volunteer, confirmed: nobody voted, so TJ says it to the room and the volunteer says why (season.js volunteer-in)
  'volunteer-in.any': [
    { id: 'vin.1', turns: [
      { by: 'tj', say: "No vote tonight, people! {a} asked for it, and {a} gets it. {a}, you're going into the Arena." },
      { by: 'a', say: "Good. That's what I wanted.",
        v: { sharp: "Good. That's what I wanted.", dry: "Good.", loud: "GOOD! That's EXACTLY what I wanted!", soft: "Good. That's what I wanted.", odd: "Good. I ordered the Arena, and it arrived." } },
      { by: 'a', conf: "Everybody else waits to find out if they're going in. I decided. That's the difference between me and them.",
        v: { sharp: "Everybody else waits. I decided. That's the difference.", dry: "They wait. I decided.", loud: "EVERYBODY else waits to find out! I DECIDED! That's the DIFFERENCE!", soft: "Everyone else waits to find out if they're going in. I chose it. I think that's the difference.", odd: "Everybody else waits for the Arena like the bus. I walked." } },
    ] },
    { id: 'vin.2', turns: [
      { by: 'tj', say: "Well, that saves us a lot of time! {a} volunteered, so {a} goes in. Nobody else has to say a name tonight." },
      { beat: 'A few people let out a breath they did not know they were holding.' },
      { by: 'a', conf: "I'd rather choose my own fight than let a room full of people choose it for me.",
        v: { sharp: "I'd rather pick my fight than let the room pick it.", dry: "I picked my own fight.", loud: "I'd RATHER choose my OWN fight than let a ROOM full of people choose it!", soft: "I'd rather choose my own fight than have a room full of people choose it for me.", odd: "I'd rather choose my own fight. The room has terrible taste in fights." } },
    ] },
  ],
};
