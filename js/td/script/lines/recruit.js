// ══════════════════════════════════════════════════════════════════════
// td/script/lines/recruit.js — bringing someone into an alliance (camp-events.js recruitment)
// ══════════════════════════════════════════════════════════════════════
//
// recruit.join.<scenario> — {a} brings {b} into {group}, and {b} says yes. The
//   scenario is the engine's reason: 'swap-outsider' ({b} is new on this tribe
//   after a swap), 'post-quit' ({b} just walked out of an old alliance),
//   'blindside-swing' ({b} was the swing vote last time), 'free-agent' ({b} had
//   nobody), 'post-betrayal' ({b}'s old alliance turned on {b}), 'power-couple'
//   (they've been close all along), 'idol-shield' ({a} holds an advantage and
//   wants {b} as a shield — only {a}'s confessional says so), 'other'.
// recruit.refuse.<hostile|friendly|neutral> — {b} turns {a} down; how depends on
//   what {b} thinks of {a}.
// Ids: 'rc.'.
const SWAP = [
  { id: 'rc.s1', turns: [
    { by: 'a', say: "So. New tribe. How's that going for you?" },
    { by: 'b', say: "Everybody's nice to my face. That's it." },
    { by: 'a', say: "Then let me be nice behind your back too. Join {group}. You need people, we need numbers." },
    { by: 'b', say: "Just like that?" },
    { by: 'a', say: "Just like that." },
    { by: 'b', say: "...Okay. I'm in." },
  ] },
  { id: 'rc.s2', turns: [
    { by: 'b', say: "I know I'm the new one here. You don't have to pretend I'm not." },
    { by: 'a', say: "I'm not pretending. I'm recruiting." },
    { by: 'b', say: "Recruiting?" },
    { by: 'a', say: "{group}. We could use somebody who isn't stuck in the old drama." },
    { by: 'b', say: "Okay. Yeah. I'd like that." },
  ] },
  { id: 'rc.s3', turns: [
    { beat: '{a} sits down next to {b}, who has been sitting alone since the swap.' },
    { by: 'a', say: "You look lonely." },
    { by: 'b', say: "Thanks for noticing." },
    { by: 'a', say: "Don't be. Be with us. {group}." },
    { by: 'b', say: "Seriously? Yes. Please. Yes." },
  ] },
  { id: 'rc.s4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "You're new here, so let me save you some time. {group} runs this tribe." },
    { by: 'b', say: "Does it?" },
    { by: 'a', say: "It will, once you join." },
    { by: 'b', say: "That's a confident sales pitch." },
    { by: 'a', say: "It's a confident alliance. In or out?" },
    { by: 'b', say: "In." },
  ] },
  { id: 'rc.s5', turns: [
    { by: 'a', say: "Your old tribe isn't here to protect you anymore." },
    { by: 'b', say: "I know. Trust me, I know." },
    { by: 'a', say: "So let us. {group} needs one more." },
    { by: 'b', say: "Okay. Okay, I'll take it." },
  ] },
  { id: 'rc.s6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I know it's scary, being new. I want you to feel welcome." },
    { by: 'b', say: "That's really kind." },
    { by: 'a', say: "I mean it. Join {group}. You'll be safe with us." },
    { by: 'b', say: "Thank you. Really. I'm in." },
  ] },
];
const POSTQUIT = [
  { id: 'rc.q1', turns: [
    { by: 'a', say: "I heard you walked away from your old group." },
    { by: 'b', say: "Word travels fast." },
    { by: 'a', say: "It does. So does this: {group} has a spot for you." },
    { by: 'b', say: "That was quick." },
    { by: 'a', say: "Good people don't stay free for long. You in?" },
    { by: 'b', say: "I'm in." },
  ] },
  { id: 'rc.q2', turns: [
    { by: 'b', say: "If you're here to tell me I made a mistake leaving, don't." },
    { by: 'a', say: "I'm here to tell you you did the right thing. And that you can come with us." },
    { by: 'b', say: "Us?" },
    { by: 'a', say: "{group}. We saw how they treated you. That won't happen with us." },
    { by: 'b', say: "Okay. Let's do it." },
  ] },
  { id: 'rc.q3', turns: [
    { by: 'a', say: "You're on your own now, right?" },
    { by: 'b', say: "Don't remind me." },
    { by: 'a', say: "Then don't be. Join {group}." },
    { by: 'b', say: "You really want me?" },
    { by: 'a', say: "Wouldn't be asking if I didn't." },
  ] },
  { id: 'rc.q4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Forget your old group. They didn't deserve you." },
    { by: 'b', say: "Right?! Thank you! Finally, somebody gets it!" },
    { by: 'a', say: "So come with us. {group}." },
    { by: 'b', say: "Done. Let's go." },
  ] },
  { id: 'rc.q5', turns: [
    { by: 'b', say: "Everyone's staring at me since I left." },
    { by: 'a', say: "Let them stare. You've got a new home now, if you want it." },
    { by: 'b', say: "Where?" },
    { by: 'a', say: "{group}." },
    { by: 'b', say: "Yeah. Okay. I want it." },
  ] },
  { id: 'rc.q6', when: { register: 'cool' }, turns: [
    { by: 'a', say: "Leaving your alliance was a bold move. I respect that." },
    { by: 'b', say: "And?" },
    { by: 'a', say: "And {group} could use somebody bold." },
    { by: 'b', say: "Fine. I'm listening. I'm in, actually." },
  ] },
];
const SWING = [
  { id: 'rc.w1', turns: [
    { by: 'a', say: "You made the right call last vote." },
    { by: 'b', say: "I hope so. Some people aren't happy with me." },
    { by: 'a', say: "Then come be with the people who are. {group}." },
    { by: 'b', say: "Okay. That actually sounds good." },
  ] },
  { id: 'rc.w2', turns: [
    { by: 'a', say: "Everyone's talking about how you swung the vote." },
    { by: 'b', say: "Great. Just what I wanted. Attention." },
    { by: 'a', say: "Then let's make sure the attention works for you. Join {group}." },
    { by: 'b', say: "Protection?" },
    { by: 'a', say: "Protection." },
    { by: 'b', say: "Deal." },
  ] },
  { id: 'rc.w3', turns: [
    { by: 'b', say: "Are you here to thank me or yell at me?" },
    { by: 'a', say: "Thank you. And recruit you." },
    { by: 'b', say: "Recruit me?" },
    { by: 'a', say: "You were the deciding vote. I'd rather have you deciding with {group} from now on." },
    { by: 'b', say: "Okay. I'm in." },
  ] },
  { id: 'rc.w4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "The swing vote is the most powerful person in the game. Until everyone gangs up on them." },
    { by: 'b', say: "Is that a threat?" },
    { by: 'a', say: "It's advice. Join {group} before that happens." },
    { by: 'b', say: "...Fine. You make a good point." },
  ] },
  { id: 'rc.w5', turns: [
    { by: 'a', say: "You flipped last time. I liked it." },
    { by: 'b', say: "You're one of the only ones." },
    { by: 'a', say: "Then stick with the ones who liked it. {group}." },
    { by: 'b', say: "Fair enough. I'm in." },
  ] },
  { id: 'rc.w6', turns: [
    { by: 'a', say: "You're in demand right now. Everybody wants your vote." },
    { by: 'b', say: "It's exhausting, honestly." },
    { by: 'a', say: "So pick a side and rest. Pick {group}." },
    { by: 'b', say: "That's the best pitch I've heard all day. Okay." },
  ] },
];
const FREE = [
  { id: 'rc.f1', turns: [
    { by: 'a', say: "You've been doing this alone for a while, huh?" },
    { by: 'b', say: "Is it that obvious?" },
    { by: 'a', say: "A little. You don't have to anymore. {group} wants you." },
    { by: 'b', say: "Wait, really?" },
    { by: 'a', say: "Really." },
    { by: 'b', say: "Then yes. Obviously yes." },
  ] },
  { id: 'rc.f2', turns: [
    { by: 'b', say: "I need people." },
    { by: 'a', say: "And we need numbers. So let's help each other." },
    { by: 'b', say: "That's not very romantic." },
    { by: 'a', say: "It's an alliance, not a date. {group}. Yes or no?" },
    { by: 'b', say: "Yes." },
  ] },
  { id: 'rc.f3', turns: [
    { beat: '{a} catches up with {b} after the challenge.' },
    { by: 'a', say: "People are talking about you. Not in a good way." },
    { by: 'b', say: "Great." },
    { by: 'a', say: "So come with us. {group}. Nobody touches you if you're with us." },
    { by: 'b', say: "You'd do that?" },
    { by: 'a', say: "I'm doing it." },
  ] },
  { id: 'rc.f4', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Hey. Do you want to be in an alliance? With us?" },
    { by: 'b', say: "Me? Are you sure?" },
    { by: 'a', say: "Very sure. {group} would be lucky to have you." },
    { by: 'b', say: "Okay. Wow. Okay, yes." },
  ] },
  { id: 'rc.f5', turns: [
    { by: 'a', say: "Why don't you have an alliance yet?" },
    { by: 'b', say: "Nobody asked." },
    { by: 'a', say: "Well, I'm asking. {group}." },
    { by: 'b', say: "Then I'm saying yes." },
  ] },
  { id: 'rc.f6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Stop playing solo. It's not working." },
    { by: 'b', say: "Wow, thanks for the review." },
    { by: 'a', say: "I'm serious. Join {group}. You'd actually have a chance." },
    { by: 'b', say: "Fine. FINE. I'm in." },
  ] },
  { id: 'rc.f7', when: { lastBoot: true }, turns: [
    { by: 'a', say: "Did you see what happened to {lastBoot}? No alliance, no protection." },
    { by: 'b', say: "Thanks. Very comforting." },
    { by: 'a', say: "I'm not trying to scare you. I'm trying to stop it happening to you. Join {group}." },
    { by: 'b', say: "...Okay. Yeah. I'm in." },
  ] },
  { id: 'rc.f8', turns: [
    { beat: '{a} and {b} are the last two left cleaning up after dinner.' },
    { by: 'a', say: "Can I ask you something? Who've you got in this game?" },
    { by: 'b', say: "Honestly? Nobody." },
    { by: 'a', say: "Now you've got {group}. If you want it." },
    { by: 'b', say: "I want it." },
  ] },
  { id: 'rc.f9', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Floating is a nice strategy. Right up until it isn't." },
    { by: 'b', say: "Meaning?" },
    { by: 'a', say: "Meaning the floaters go home the second the big alliances need a vote. Join {group} and you won't be a floater." },
    { by: 'b', say: "Fine. You've convinced me." },
  ] },
  { id: 'rc.f10', turns: [
    { by: 'b', say: "Why are you smiling at me like that?" },
    { by: 'a', say: "Because I've got good news. {group} wants you." },
    { by: 'b', say: "Me? Since when?" },
    { by: 'a', say: "Since about five minutes ago. We voted. You won." },
    { by: 'b', say: "Ha! Okay. I'm in." },
  ] },
  { id: 'rc.f11', when: { rival: true }, turns: [
    { by: 'a', say: "You've seen how {rival} treats me, right?" },
    { by: 'b', say: "Everybody's seen it." },
    { by: 'a', say: "{group} is how I stop it. And with you in it, {rival} can't push either of us around." },
    { by: 'b', say: "Okay. You've got yourself a new member." },
  ] },
];
const BETRAYED = [
  { id: 'rc.b1', turns: [
    { by: 'a', say: "I saw what your old alliance did to you. That was low." },
    { by: 'b', say: "Yeah. It was." },
    { by: 'a', say: "{group} doesn't do that. Come with us." },
    { by: 'b', say: "How do I know you won't do the same thing?" },
    { by: 'a', say: "You don't. But you know they will." },
    { by: 'b', say: "...Okay. I'm in." },
  ] },
  { id: 'rc.b2', turns: [
    { by: 'b', say: "I don't want to talk about it." },
    { by: 'a', say: "Then don't. Just listen. {group} has your back now." },
    { by: 'b', say: "Why?" },
    { by: 'a', say: "Because they threw you away, and that was stupid of them." },
    { by: 'b', say: "Okay. Thank you." },
  ] },
  { id: 'rc.b3', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "You want payback?" },
    { by: 'b', say: "More than anything." },
    { by: 'a', say: "Then join {group}. We'll get you payback." },
    { by: 'b', say: "Where do I sign?" },
  ] },
  { id: 'rc.b4', turns: [
    { by: 'a', say: "They stabbed you in the back. I'd never do that." },
    { by: 'b', say: "That's what they said too." },
    { by: 'a', say: "Then let me prove it. {group}. Give me one week." },
    { by: 'b', say: "One week. Okay." },
  ] },
  { id: 'rc.b5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Are you okay? After everything?" },
    { by: 'b', say: "Not really. I trusted them." },
    { by: 'a', say: "Trust us instead. {group} will look after you." },
    { by: 'b', say: "I'd like that. A lot." },
  ] },
  { id: 'rc.b6', turns: [
    { by: 'b', say: "If you're here to gloat, go away." },
    { by: 'a', say: "I'm here to offer you a spot in {group}." },
    { by: 'b', say: "Oh. Okay. That's different." },
    { by: 'a', say: "So?" },
    { by: 'b', say: "So yes." },
  ] },
];
const COUPLE = [
  { id: 'rc.c1', turns: [
    { by: 'a', say: "Everyone already thinks we're a team." },
    { by: 'b', say: "We are a team." },
    { by: 'a', say: "Then come be in {group} with me. Make it official." },
    { by: 'b', say: "Official. I like that." },
  ] },
  { id: 'rc.c2', turns: [
    { by: 'b', say: "I heard you're in an alliance now." },
    { by: 'a', say: "I am. And it's missing somebody. {group} wants you too." },
    { by: 'b', say: "Then I'm in. Obviously." },
  ] },
  { id: 'rc.c3', turns: [
    { by: 'a', say: "I'm not going anywhere in this game without you. So: {group}?" },
    { by: 'b', say: "Wherever you go, I go." },
    { by: 'a', say: "That's a yes, then." },
    { by: 'b', say: "That's a yes." },
  ] },
  { id: 'rc.c4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Okay, you're joining {group}. Don't argue." },
    { by: 'b', say: "I wasn't going to argue!" },
    { by: 'a', say: "Good! Then welcome!" },
  ] },
  { id: 'rc.c5', turns: [
    { by: 'a', say: "We're stronger together. We both know that." },
    { by: 'b', say: "We do." },
    { by: 'a', say: "So let's be together in {group}." },
    { by: 'b', say: "Deal." },
  ] },
  { id: 'rc.c6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I'd feel so much better if you were in {group} with me." },
    { by: 'b', say: "Then I'm in. I'd feel better too." },
    { beat: 'They hug.' },
  ] },
];
const SHIELD = [
  { id: 'rc.h1', turns: [
    { by: 'a', say: "You're strong. People notice you. {group} could use that." },
    { by: 'b', say: "Wow, okay. Sure. I'm in." },
    { by: 'a', conf: "With {b} next to me, all eyes are on {b}. Nobody's looking at me. Or at what I've got hidden." },
  ] },
  { id: 'rc.h2', turns: [
    { by: 'a', say: "I want you in {group}. You'd be our leader, practically." },
    { by: 'b', say: "Really? Me?" },
    { by: 'a', say: "You." },
    { by: 'a', conf: "If people are busy targeting {b}, they're not busy searching me." },
  ] },
  { id: 'rc.h3', turns: [
    { by: 'a', say: "Stick with me and {group}, and we'll keep you safe." },
    { by: 'b', say: "How can you promise that?" },
    { by: 'a', say: "Trust me." },
    { by: 'b', say: "Okay. I trust you." },
    { by: 'a', conf: "I've got a secret in my pocket that keeps me safe. {b} is the extra layer of padding." },
  ] },
  { id: 'rc.h4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "You'd be a great addition to {group}." },
    { by: 'b', say: "Thanks! I'm in." },
    { by: 'a', conf: "With {b} standing next to me, every vote goes {b}'s way first. That's why I asked." },
  ] },
  { id: 'rc.h5', turns: [
    { by: 'a', say: "Everybody's scared of you. Let's use that. {group}." },
    { by: 'b', say: "Everybody's scared of me?" },
    { by: 'a', say: "Little bit. Join us." },
    { by: 'b', say: "Okay!" },
    { by: 'a', conf: "If everyone's scared of {b}, nobody's looking at me." },
  ] },
  { id: 'rc.h6', turns: [
    { by: 'a', say: "I need someone I can count on. {group}. You in?" },
    { by: 'b', say: "I'm in." },
    { by: 'a', conf: "{b} doesn't know what I've got hidden. {b} doesn't need to. {b} just needs to be standing in front of me." },
  ] },
];
const OTHER = [
  { id: 'rc.o1', turns: [
    { by: 'a', say: "Want to join {group}? We could use you." },
    { by: 'b', say: "Seriously? Yeah. Yes." },
    { by: 'a', say: "Welcome aboard." },
  ] },
  { id: 'rc.o2', turns: [
    { by: 'a', say: "I've got an offer for you. {group}. You'd be our newest member." },
    { by: 'b', say: "What's the catch?" },
    { by: 'a', say: "You vote with us. That's it." },
    { by: 'b', say: "I can do that. I'm in." },
  ] },
  { id: 'rc.o3', turns: [
    { by: 'b', say: "Why are you being so nice to me today?" },
    { by: 'a', say: "Because I want you in {group}." },
    { by: 'b', say: "Oh. Well. Okay, then. Yes." },
  ] },
  { id: 'rc.o4', turns: [
    { by: 'a', say: "{group} needs one more. I think it should be you." },
    { by: 'b', say: "Why me?" },
    { by: 'a', say: "Because you're the only one I'd actually trust with it." },
    { by: 'b', say: "Okay. I'm in." },
  ] },
  { id: 'rc.o5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "You're joining {group}. Yes?" },
    { by: 'b', say: "Is that a question?" },
    { by: 'a', say: "Barely." },
    { by: 'b', say: "Fine. Yes." },
  ] },
  { id: 'rc.o6', turns: [
    { by: 'a', say: "The numbers are shifting, and I want you on our side when they do. {group}." },
    { by: 'b', say: "Our side. Okay. Count me in." },
  ] },
];

const REFUSE_HOSTILE = [
  { id: 'rc.x1', turns: [
    { by: 'a', say: "I want you in {group}." },
    { by: 'b', say: "After what you did? No." },
    { by: 'a', say: "That was a while ago." },
    { by: 'b', say: "Not to me." },
    { beat: '{b} walks off.' },
  ] },
  { id: 'rc.x2', turns: [
    { by: 'a', say: "Hear me out. {group}." },
    { by: 'b', say: "I don't trust you, and I'm not going to pretend I do." },
    { by: 'a', say: "Fair enough." },
  ] },
  { id: 'rc.x3', turns: [
    { by: 'a', say: "Join us. {group} is the safest place in this game." },
    { by: 'b', say: "Not with you in it, it isn't." },
  ] },
  { id: 'rc.x4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Come on. {group}. Let's just bury the hatchet." },
    { by: 'b', say: "The only place I'd bury a hatchet is in your back!" },
    { by: 'a', say: "Okay, wow. That's a no, then." },
  ] },
  { id: 'rc.x5', turns: [
    { by: 'a', say: "I know we've had problems. But {group} could really use you." },
    { by: 'b', say: "And I could really use you leaving me alone." },
  ] },
  { id: 'rc.x6', when: { register: 'cool' }, turns: [
    { by: 'a', say: "I'm offering you a spot in {group}." },
    { by: 'b', say: "I know exactly why you're offering. The answer's no." },
  ] },
];
const REFUSE_FRIENDLY = [
  { id: 'rc.y1', turns: [
    { by: 'a', say: "Join {group}. Please?" },
    { by: 'b', say: "I like you. I really do. But I don't like where {group} is going." },
    { by: 'a', say: "That's... fair, I guess." },
    { by: 'b', say: "Don't take it personally." },
  ] },
  { id: 'rc.y2', turns: [
    { by: 'a', say: "There's a spot in {group} with your name on it." },
    { by: 'b', say: "I can't. Not right now. I need to see how the next vote goes." },
    { by: 'a', say: "The offer won't last forever." },
    { by: 'b', say: "I know. I'm sorry." },
  ] },
  { id: 'rc.y3', turns: [
    { by: 'a', say: "You'd fit right in with {group}." },
    { by: 'b', say: "I know I would. That's kind of the problem. I'd be one more face, not a real part of it." },
    { by: 'a', say: "That's not true." },
    { by: 'b', say: "Maybe. But I'm going to say no for now." },
  ] },
  { id: 'rc.y4', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Please join {group}. It'd mean a lot to me." },
    { by: 'b', say: "Oh, I hate saying no to you. But I have to. I'm sorry." },
    { by: 'a', say: "It's okay. I get it." },
  ] },
  { id: 'rc.y5', turns: [
    { by: 'a', say: "Come on. You and me, in {group}." },
    { by: 'b', say: "You and me, yes. {group}, no." },
    { by: 'a', say: "Why not?" },
    { by: 'b', say: "Because I don't trust everyone else in it." },
  ] },
  { id: 'rc.y6', turns: [
    { by: 'a', say: "I thought for sure you'd say yes." },
    { by: 'b', say: "I would, if it was just you. But it's not just you." },
    { by: 'a', say: "Okay. The door's open if you change your mind." },
  ] },
];
const REFUSE_NEUTRAL = [
  { id: 'rc.z1', turns: [
    { by: 'a', say: "Want to join {group}?" },
    { by: 'b', say: "I'm not ready to lock in with anyone yet." },
    { by: 'a', say: "You might not get another chance." },
    { by: 'b', say: "I'll take that risk." },
  ] },
  { id: 'rc.z2', turns: [
    { by: 'a', say: "{group} has a spot for you." },
    { by: 'b', say: "I'll think about it." },
    { by: 'a', conf: "'I'll think about it' means no. Everybody knows that." },
  ] },
  { id: 'rc.z3', turns: [
    { by: 'a', say: "I'm offering you a spot in {group}." },
    { by: 'b', say: "I appreciate it. But I need to play my own game right now." },
    { by: 'a', say: "Your own game is going to get you voted out." },
    { by: 'b', say: "Maybe. It'll be my own fault, though." },
  ] },
  { id: 'rc.z4', turns: [
    { by: 'a', say: "Join us. {group}." },
    { by: 'b', say: "Not right now." },
    { by: 'a', say: "When, then?" },
    { by: 'b', say: "I don't know. Not right now." },
  ] },
  { id: 'rc.z5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "{group} could really use you." },
    { by: 'b', say: "I bet it could. But I'm more useful to myself on my own." },
    { by: 'a', say: "For now." },
    { by: 'b', say: "Then let's talk again in a few days." },
  ] },
  { id: 'rc.z6', turns: [
    { by: 'a', say: "So? {group}? You in?" },
    { by: 'b', say: "Ask me again next week." },
    { by: 'a', say: "Next week you might not be here." },
    { by: 'b', say: "Then I guess it won't matter." },
  ] },
];

export default {
  'recruit.join.swap-outsider': SWAP,
  'recruit.join.post-quit': POSTQUIT,
  'recruit.join.blindside-swing': SWING,
  'recruit.join.free-agent': FREE,
  'recruit.join.post-betrayal': BETRAYED,
  'recruit.join.power-couple': COUPLE,
  'recruit.join.idol-shield': SHIELD,
  'recruit.join.other': OTHER,
  'recruit.refuse.hostile': REFUSE_HOSTILE,
  'recruit.refuse.friendly': REFUSE_FRIENDLY,
  'recruit.refuse.neutral': REFUSE_NEUTRAL,
};

export const GUARANTEED = Object.fromEntries(Object.keys({
  'recruit.join.swap-outsider': 1, 'recruit.join.post-quit': 1, 'recruit.join.blindside-swing': 1, 'recruit.join.free-agent': 1,
  'recruit.join.post-betrayal': 1, 'recruit.join.power-couple': 1, 'recruit.join.idol-shield': 1, 'recruit.join.other': 1,
  'recruit.refuse.hostile': 1, 'recruit.refuse.friendly': 1, 'recruit.refuse.neutral': 1,
}).map(k => [k, ['group']]));
