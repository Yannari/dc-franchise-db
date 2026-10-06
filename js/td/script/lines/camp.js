// ══════════════════════════════════════════════════════════════════════
// td/script/lines/camp.js — rumours, nerves, loyalty, and the person nobody fears
// ══════════════════════════════════════════════════════════════════════
//
// rumor.heard.<confront|stew|shrug> — word got back to {a} that {b} has been
//   floating {a}'s name. 'confront': {a} says it to {b}'s face; 'stew' and
//   'shrug': {a} tells the camera (rattled, or playing it cool).
// conf.overplay.<everywhere|overtime|nervous> — {a} is working far too hard,
//   and doesn't see how it looks.
// conf.paranoia.<unraveling|watching> — {a} is getting into {a.posAdj} own head.
// conf.readroom.<expert|quiet> — {a} has read the camp without being told.
// talk.checkin.<rock|steady|quiet> — {a}, a loyal player, checks in with {b}.
// goat.kept.<happy|drifting> — {a} doesn't see how the camp sees {a.obj};
//   {b}, a strategist, wants {a} kept exactly like that. Only {b}'s
//   confessional says why.
// goat.alone.<happy|drifting> — {a} alone with the camera.
// Ids: 'cp.'.
const RUMOR_CONFRONT = [
  { id: 'cp.r1', turns: [
    { by: 'a', say: "So I hear you've been throwing my name around." },
    { by: 'b', say: "What? Who told you that?" },
    { by: 'a', say: "Doesn't matter who. Is it true?" },
    { by: 'b', say: "I was just talking. Everybody's talking." },
    { by: 'a', say: "Well, stop talking about me." },
  ] },
  { id: 'cp.r2', turns: [
    { by: 'a', say: "Hey! Yeah, you. Got something you want to say to my face?" },
    { by: 'b', say: "Whoa. What's your problem?" },
    { by: 'a', say: "My problem is you telling people to vote for me!" },
    { by: 'b', say: "I never said that." },
    { by: 'a', say: "Funny, because three people say you did." },
  ] },
  { id: 'cp.r3', turns: [
    { by: 'a', say: "I know what you're doing." },
    { by: 'b', say: "I'm eating." },
    { by: 'a', say: "You know what I mean. My name. You've been floating it." },
    { by: 'b', say: "Okay, maybe I mentioned it once." },
    { by: 'a', say: "Once is enough." },
  ] },
  { id: 'cp.r4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "You want me gone?! Then say it! Say it right now!" },
    { by: 'b', say: "Calm down, everyone's looking!" },
    { by: 'a', say: "GOOD! Let them look!" },
  ] },
  { id: 'cp.r5', turns: [
    { by: 'a', say: "Next time you want me out, at least have the guts to tell me." },
    { by: 'b', say: "I don't know what you heard—" },
    { by: 'a', say: "I heard enough." },
    { beat: '{a} walks off before {b} can finish.' },
  ] },
  { id: 'cp.r6', when: { rival: true }, turns: [
    { by: 'a', say: "First {rival}, now you? Is everybody coming after me today?" },
    { by: 'b', say: "I don't know what you're talking about." },
    { by: 'a', say: "Sure you don't." },
  ] },
];
const RUMOR_STEW = [
  { id: 'cp.s1', turns: [
    { by: 'a', conf: "Apparently {b} has been saying my name. For the vote." },
    { by: 'a', conf: "I smiled at {b} at lunch like nothing happened. Inside, I'm rethinking everything." },
  ] },
  { id: 'cp.s2', turns: [
    { by: 'a', conf: "I found out people are talking about me. And {b} is the one doing the talking." },
    { by: 'a', conf: "Great. Fantastic. I'm fine. I'm totally fine." },
  ] },
  { id: 'cp.s3', turns: [
    { by: 'a', conf: "{b} floated my name. I thought we were okay. Clearly not." },
  ] },
  { id: 'cp.s4', turns: [
    { by: 'a', conf: "I can't stop thinking about it. {b}, of all people. Pushing my name." },
    { by: 'a', conf: "Now every conversation I'm not in feels like it's about me." },
  ] },
  { id: 'cp.s5', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "Somebody told me {b} wants me gone. I don't even know what I did." },
  ] },
  { id: 'cp.s6', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{b} is coming for me. Cute. I'll let {b} think I don't know." },
  ] },
];
const RUMOR_SHRUG = [
  { id: 'cp.h1', turns: [
    { by: 'a', conf: "So {b} threw my name out there. Whatever. Names get thrown out all the time." },
    { by: 'a', conf: "I'm just going to keep a closer eye on {b} from now on." },
  ] },
  { id: 'cp.h2', turns: [
    { by: 'a', conf: "Somebody let it slip that {b} mentioned me for the vote." },
    { by: 'a', conf: "I'm not going to freak out. I'm just going to remember it." },
  ] },
  { id: 'cp.h3', turns: [
    { by: 'a', conf: "{b} said my name. Okay. Noted." },
  ] },
  { id: 'cp.h4', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "{b} floating my name tells me {b} is scared of me. That's actually good news." },
  ] },
  { id: 'cp.h5', turns: [
    { by: 'a', conf: "I heard what {b} said. I'm not going to say anything. Yet." },
  ] },
  { id: 'cp.h6', when: { register: 'competitor' }, turns: [
    { by: 'a', conf: "{b} wants me out? Good luck. I'll just win the next challenge." },
  ] },
];

const OVER_EVERYWHERE = [
  { id: 'cp.o1', turns: [
    { by: 'a', conf: "I've talked to every single person today. Some of them twice. I'm crushing it." },
    { by: 'a', conf: "Why does everyone keep giving me weird looks, though?" },
  ] },
  { id: 'cp.o2', turns: [
    { by: 'a', conf: "Every conversation is an opportunity. So I'm having all of them." },
  ] },
  { id: 'cp.o3', turns: [
    { by: 'a', conf: "I made four deals before lunch. Is that too many? It's probably fine." },
  ] },
  { id: 'cp.o4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "I'm working every angle in this camp. Nobody can keep up with me." },
    { by: 'a', conf: "Nobody's trying to keep up, actually. They're mostly just watching me. That's fine." },
  ] },
  { id: 'cp.o5', turns: [
    { by: 'a', conf: "Is it suspicious to pull five people aside in an hour? I hope not, because I did." },
  ] },
  { id: 'cp.o6', turns: [
    { by: 'a', conf: "I'm everywhere today. I'm in every conversation. Strategy never sleeps." },
    { by: 'a', conf: "I should probably sleep at some point." },
  ] },
];
const OVER_OVERTIME = [
  { id: 'cp.v1', turns: [
    { by: 'a', conf: "I've checked in with everybody. Then I checked in again, just in case." },
  ] },
  { id: 'cp.v2', turns: [
    { by: 'a', conf: "People keep going quiet when I walk up. I'm sure that's nothing." },
  ] },
  { id: 'cp.v3', turns: [
    { by: 'a', conf: "I just want to make sure everyone's on the same page. Every hour. Is that weird?" },
  ] },
  { id: 'cp.v4', turns: [
    { by: 'a', conf: "I've had about ten secret conversations today. They're not very secret anymore." },
  ] },
  { id: 'cp.v5', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "Why is everybody acting like I'm too much? I'm just playing the game! HARD!" },
  ] },
  { id: 'cp.v6', turns: [
    { by: 'a', conf: "I keep pulling people aside. I know it looks bad. I can't stop." },
  ] },
];
const OVER_NERVOUS = [
  { id: 'cp.n1', turns: [
    { by: 'a', conf: "I keep bringing up the vote. Nobody else does. I don't know why I can't stop." },
  ] },
  { id: 'cp.n2', turns: [
    { by: 'a', conf: "I asked everyone who they're voting for. Twice. They all went quiet. That's bad, right?" },
  ] },
  { id: 'cp.n3', turns: [
    { by: 'a', conf: "I'm so nervous I can't sit still. So I just keep talking to people." },
  ] },
  { id: 'cp.n4', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "I tried to play the game today. I think I tried too hard. Everyone looked at me funny." },
  ] },
  { id: 'cp.n5', turns: [
    { by: 'a', conf: "I don't think I'm being very subtle. Somebody actually told me to calm down." },
  ] },
  { id: 'cp.n6', turns: [
    { by: 'a', conf: "It's way too early to be this stressed. I'm this stressed anyway." },
  ] },
];
const PARA_UNRAVEL = [
  { id: 'cp.u1', turns: [
    { by: 'a', conf: "Everybody's whispering. About me. I know it's about me." },
    { by: 'a', conf: "Okay, maybe not everybody. But definitely some of them." },
  ] },
  { id: 'cp.u2', turns: [
    { by: 'a', conf: "I've pulled three people aside this hour. None of them told me anything. That means they're hiding something." },
  ] },
  { id: 'cp.u3', turns: [
    { by: 'a', conf: "I can't think about anything except the vote. Every conversation comes back to it." },
  ] },
  { id: 'cp.u4', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "If one more person stops talking when I walk up, I'm going to scream." },
  ] },
  { id: 'cp.u5', turns: [
    { by: 'a', conf: "I haven't slept. I can't sleep. Every noise sounds like someone plotting." },
  ] },
  { id: 'cp.u6', when: { rival: true }, turns: [
    { by: 'a', conf: "{rival} is behind all of it. I'm sure of it. I just can't prove it." },
  ] },
];
const PARA_WATCH = [
  { id: 'cp.w1', turns: [
    { by: 'a', conf: "Two people were laughing across camp today. I'm pretty sure it was about me." },
    { by: 'a', conf: "It probably wasn't. But it might have been." },
  ] },
  { id: 'cp.w2', turns: [
    { by: 'a', conf: "I keep watching everyone. Who's talking to who. Who stops when I walk up." },
  ] },
  { id: 'cp.w3', turns: [
    { by: 'a', conf: "I'm in my own head today. I know I am. I can't get out of it." },
  ] },
  { id: 'cp.w4', turns: [
    { by: 'a', conf: "Someone said 'morning' to me differently today. Different how? I don't know. But different." },
  ] },
  { id: 'cp.w5', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "I'm not paranoid. I'm careful. There's a difference, and I'm on the right side of it. I think." },
  ] },
  { id: 'cp.w6', turns: [
    { by: 'a', conf: "Something's off today. I can't say what. Something." },
  ] },
];
const READ_EXPERT = [
  { id: 'cp.e1', turns: [
    { by: 'a', conf: "I wasn't in any of the conversations today. I still know what was said in all of them." },
  ] },
  { id: 'cp.e2', turns: [
    { by: 'a', conf: "I know exactly who's in trouble at the next vote. Nobody had to tell me." },
  ] },
  { id: 'cp.e3', turns: [
    { by: 'a', conf: "Who sits where. Who goes quiet. Who suddenly offers to get water. It all tells you something." },
  ] },
  { id: 'cp.e4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "I can read this camp like a book. And I know who's going next." },
  ] },
  { id: 'cp.e5', turns: [
    { by: 'a', conf: "I put three conversations together that I wasn't part of. The picture is very clear." },
  ] },
  { id: 'cp.e6', when: { threat: true }, turns: [
    { by: 'a', conf: "Everyone's pretending they aren't scared of {threat}. Everyone's scared of {threat}." },
  ] },
];
const READ_QUIET = [
  { id: 'cp.q1', turns: [
    { by: 'a', conf: "I noticed something today nobody else did. I'm keeping it to myself for now." },
  ] },
  { id: 'cp.q2', turns: [
    { by: 'a', conf: "I watched two people talk across camp. I couldn't hear a word. I didn't need to." },
  ] },
  { id: 'cp.q3', turns: [
    { by: 'a', conf: "People don't realise how much I pay attention. That's kind of the point of being quiet." },
  ] },
  { id: 'cp.q4', turns: [
    { by: 'a', conf: "I have a better picture of this game than anyone thinks. I'm just not showing it yet." },
  ] },
  { id: 'cp.q5', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "I don't talk much. But I listen. A lot." },
  ] },
  { id: 'cp.q6', when: { lastBoot: true }, turns: [
    { by: 'a', conf: "I knew {lastBoot} was going before anyone said it out loud. You could see it." },
  ] },
];
const CHECK_ROCK = [
  { id: 'cp.k1', turns: [
    { by: 'a', say: "Hey. Just so you know, we're good. I'm not going anywhere." },
    { by: 'b', say: "I know. You never do." },
    { by: 'a', say: "Good. That's all." },
  ] },
  { id: 'cp.k2', turns: [
    { by: 'b', say: "Is everything okay? You came all the way over here." },
    { by: 'a', say: "Everything's fine. Same plan, same people. I just wanted you to hear it." },
    { by: 'b', say: "Thanks. I needed that." },
  ] },
  { id: 'cp.k3', turns: [
    { by: 'a', say: "Whatever you hear today, I'm with you." },
    { by: 'b', say: "What am I going to hear?" },
    { by: 'a', say: "Doesn't matter. I'm with you." },
  ] },
  { id: 'cp.k4', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I just wanted to say, I've got your back. No matter what." },
    { by: 'b', say: "You're the best, you know that?" },
    { by: 'a', say: "I know." },
  ] },
  { id: 'cp.k5', turns: [
    { by: 'a', say: "People are going to try to split us up. It's not going to work." },
    { by: 'b', say: "You sound very sure." },
    { by: 'a', say: "I am." },
  ] },
  { id: 'cp.k6', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Team check. Are we solid?" },
    { by: 'b', say: "Solid." },
    { by: 'a', say: "Then let's keep it that way." },
  ] },
];
const CHECK_STEADY = [
  { id: 'cp.t1', turns: [
    { by: 'a', say: "Nothing's changed, by the way. Just thought you should know." },
    { by: 'b', say: "Good. I was starting to worry." },
    { by: 'a', say: "Don't." },
  ] },
  { id: 'cp.t2', turns: [
    { by: 'a', say: "You okay? I haven't seen you all day." },
    { by: 'b', say: "I'm fine. Just thinking." },
    { by: 'a', say: "Well, think with me next time. We're a team." },
  ] },
  { id: 'cp.t3', turns: [
    { by: 'b', say: "Are we still okay?" },
    { by: 'a', say: "Still okay. Always okay." },
    { by: 'b', say: "Thanks. Everyone else is so weird today." },
  ] },
  { id: 'cp.t4', turns: [
    { by: 'a', say: "I'm not bringing news. I'm just here. In case you needed someone." },
    { by: 'b', say: "I kind of did. Thanks." },
  ] },
  { id: 'cp.t5', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Um, I just wanted to check we're still friends. In the game, I mean." },
    { by: 'b', say: "Of course we are." },
    { by: 'a', say: "Okay. Good." },
  ] },
  { id: 'cp.t6', turns: [
    { by: 'a', say: "Same plan as yesterday?" },
    { by: 'b', say: "Same plan as yesterday." },
    { by: 'a', say: "Great." },
  ] },
];
const CHECK_QUIET = [
  { id: 'cp.c1', turns: [
    { beat: '{a} catches {b}\'s eye across camp and gives a small nod.' },
    { by: 'b', say: "We good?" },
    { by: 'a', say: "We're good." },
  ] },
  { id: 'cp.c2', turns: [
    { by: 'a', say: "Need a hand with that?" },
    { by: 'b', say: "Sure. Thanks." },
    { beat: 'They work side by side for a while without saying much. They don\'t need to.' },
  ] },
  { id: 'cp.c3', turns: [
    { by: 'a', say: "I saved you some." },
    { by: 'b', say: "You didn't have to." },
    { by: 'a', say: "I know." },
  ] },
  { id: 'cp.c4', turns: [
    { by: 'b', say: "Why are you always helping me out?" },
    { by: 'a', say: "Because you'd do the same." },
    { by: 'b', say: "...Yeah. I would." },
  ] },
  { id: 'cp.c5', turns: [
    { by: 'a', say: "Hey. You okay?" },
    { by: 'b', say: "Better now." },
  ] },
  { id: 'cp.c6', turns: [
    { by: 'a', say: "Whatever happens today, I've got you." },
    { by: 'b', say: "I know. Me too." },
  ] },
];
const GOAT_KEPT_HAPPY = [
  { id: 'cp.g1', turns: [
    { by: 'a', say: "Isn't today great? I feel like everyone really likes me." },
    { by: 'b', say: "They do. Everyone loves you." },
    { by: 'a', say: "I think I'm in a really good spot!" },
    { by: 'b', conf: "{a} is in a great spot. Right next to me, at the end, where I can beat {a.obj}." },
  ] },
  { id: 'cp.g2', turns: [
    { by: 'a', say: "Do you think I'm playing a good game?" },
    { by: 'b', say: "The best. Don't change a thing." },
    { by: 'b', conf: "Please, {a}, don't change a thing. I need you exactly like this." },
  ] },
  { id: 'cp.g3', turns: [
    { by: 'a', say: "Somebody was going to tell me something about the vote, but you pulled me away." },
    { by: 'b', say: "Trust me, it was boring. Come help me with this." },
    { by: 'b', conf: "{a} almost heard something that would've changed everything. Can't have that." },
  ] },
  { id: 'cp.g4', turns: [
    { by: 'a', say: "I think I could actually win this, you know?" },
    { by: 'b', say: "You totally could." },
    { by: 'b', conf: "{a} could not win this. That's exactly why I'm taking {a.obj} to the end." },
  ] },
  { id: 'cp.g5', turns: [
    { by: 'a', say: "Nobody's even talking about me for the vote! Isn't that great?" },
    { by: 'b', say: "It's amazing." },
    { by: 'b', conf: "Nobody's voting for {a} because everybody wants to sit next to {a} at the end. Including me." },
  ] },
  { id: 'cp.g6', turns: [
    { by: 'a', say: "I made everyone breakfast! Do you think they liked it?" },
    { by: 'b', say: "They loved it." },
    { by: 'b', conf: "I hope {a} keeps making breakfast all the way to the finale. And then loses." },
  ] },
];
const GOAT_KEPT_DRIFT = [
  { id: 'cp.d1', turns: [
    { by: 'a', say: "I'm not really playing hard. Is that okay?" },
    { by: 'b', say: "That's perfect. Keep doing exactly that." },
    { by: 'b', conf: "{a} not playing is the best thing that could happen to my game." },
  ] },
  { id: 'cp.d2', turns: [
    { by: 'b', say: "How are you feeling about everything?" },
    { by: 'a', say: "Pretty relaxed, honestly." },
    { by: 'b', say: "Good. Stay relaxed." },
    { by: 'b', conf: "A relaxed {a} is a {a} who never makes a move. I'll take it." },
  ] },
  { id: 'cp.d3', turns: [
    { by: 'a', say: "Should I be doing more? Strategy-wise?" },
    { by: 'b', say: "Nah. You're doing great." },
    { by: 'b', conf: "{a} should definitely be doing more. I'm just not going to be the one to say so." },
  ] },
  { id: 'cp.d4', turns: [
    { by: 'b', say: "You're one of the good ones, you know." },
    { by: 'a', say: "Aw, thanks." },
    { by: 'b', conf: "Nice people don't usually win this game. But {a} doesn't need to know that." },
  ] },
  { id: 'cp.d5', turns: [
    { by: 'a', say: "I don't really get all the whispering. I'm just enjoying myself." },
    { by: 'b', say: "Keep enjoying yourself." },
    { by: 'b', conf: "Everyone's whispering about who they'd take to the end. It's always {a}." },
  ] },
  { id: 'cp.d6', turns: [
    { by: 'b', say: "Want to sit with me at dinner?" },
    { by: 'a', say: "Sure!" },
    { by: 'b', conf: "I'm keeping {a} close. Not because I need {a.posAdj} vote. Because I need {a} at the end." },
  ] },
];
const GOAT_ALONE_HAPPY = [
  { id: 'cp.a1', turns: [
    { by: 'a', conf: "I think I'm in a really good spot! Everyone's so nice to me." },
  ] },
  { id: 'cp.a2', turns: [
    { by: 'a', conf: "Nobody's said my name for the vote even once. I must be doing something right!" },
  ] },
  { id: 'cp.a3', turns: [
    { by: 'a', conf: "I'm having the best time. Is it weird that I'm having the best time?" },
  ] },
  { id: 'cp.a4', turns: [
    { by: 'a', conf: "I don't really need a big strategy. People just like me. That's my strategy." },
  ] },
  { id: 'cp.a5', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "Everyone here is my friend. I really think I could make it to the end." },
  ] },
  { id: 'cp.a6', turns: [
    { by: 'a', conf: "People keep telling me they'd love to sit next to me at the end. That's so nice!" },
  ] },
];
const GOAT_ALONE_DRIFT = [
  { id: 'cp.l1', turns: [
    { by: 'a', conf: "I'm not really playing hard right now. I'm just kind of... here." },
  ] },
  { id: 'cp.l2', turns: [
    { by: 'a', conf: "People don't seem worried about me at all. I'm not sure if that's good or bad." },
  ] },
  { id: 'cp.l3', turns: [
    { by: 'a', conf: "I keep meaning to make a move. Then I don't. Then I think about it again tomorrow." },
  ] },
  { id: 'cp.l4', turns: [
    { by: 'a', conf: "I feel safe. I don't totally know why I feel safe. But I do." },
  ] },
  { id: 'cp.l5', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "Nobody's really talking to me about the game. Is that bad? It feels bad." },
  ] },
  { id: 'cp.l6', turns: [
    { by: 'a', conf: "I'm just going with the flow. The flow seems to be going fine. For now." },
  ] },
];

export default {
  'rumor.heard.confront': RUMOR_CONFRONT,
  'rumor.heard.stew': RUMOR_STEW,
  'rumor.heard.shrug': RUMOR_SHRUG,
  'conf.overplay.everywhere': OVER_EVERYWHERE,
  'conf.overplay.overtime': OVER_OVERTIME,
  'conf.overplay.nervous': OVER_NERVOUS,
  'conf.paranoia.unraveling': PARA_UNRAVEL,
  'conf.paranoia.watching': PARA_WATCH,
  'conf.readroom.expert': READ_EXPERT,
  'conf.readroom.quiet': READ_QUIET,
  'talk.checkin.rock': CHECK_ROCK,
  'talk.checkin.steady': CHECK_STEADY,
  'talk.checkin.quiet': CHECK_QUIET,
  'goat.kept.happy': GOAT_KEPT_HAPPY,
  'goat.kept.drifting': GOAT_KEPT_DRIFT,
  'goat.alone.happy': GOAT_ALONE_HAPPY,
  'goat.alone.drifting': GOAT_ALONE_DRIFT,
};
