// ══════════════════════════════════════════════════════════════════════
// td/script/lines/pitch-turn.js — pitches away from the vote: turning someone on a friend, and poaching
// ══════════════════════════════════════════════════════════════════════
//
// pitch.turn.<took|refused|warned> — camp-events.js checkTurnFriendPitches. {a} schemes, {b} is the one
//   being worked on, {friend} is b's close friend, whom a wants gone. took: b starts to come round;
//   refused: b won't hear it; warned: b won't, and goes straight to {c} (the friend, on stage only here).
// recruit.join.poach — camp-events.js recruitment when {b} comes out of another alliance ({from}) into
//   {a}'s ({group}).
// Plain, spoken English: a's case is concrete (what the friend has said, done, would do), b answers it.
// Ids: 'ptf.'.

const TOOK = [
  { id: 'ptf.t1', turns: [
    { by: 'a', say: "Can I ask you something? Does {friend} ever talk about you when you're not around?" },
    { by: 'b', say: "What? No. Why would {friend} do that?" },
    { by: 'a', say: "I'm just saying, I've heard your name come up, and it wasn't nice." },
    { by: 'b', say: "{friend} wouldn't do that to me." },
    { by: 'a', say: "Maybe. But {friend} is a lot closer to everybody else than you think." },
    { by: 'b', say: "...I'll watch {friend} for a bit. That's all I'm saying." },
    { by: 'a', conf: "I didn't tell a single lie. I just let {b} finish the thought." },
  ] },
  { id: 'ptf.t2', turns: [
    { by: 'a', say: "Be honest with me. If it came down to you or {friend}, who do you think {friend} picks?" },
    { by: 'b', say: "Me. Obviously." },
    { by: 'a', say: "Are you sure? Because I'm not." },
    { by: 'b', say: "Why are you saying this?" },
    { by: 'a', say: "Because somebody should, before it's too late." },
    { by: 'b', say: "...I hadn't really thought about it like that." },
    { by: 'b', conf: "I trust {friend}. I think. I trusted {friend} more an hour ago." },
  ] },
  { id: 'ptf.t3', turns: [
    { by: 'a', say: "You know {friend} is the biggest threat out here, right? Everybody loves {friend}." },
    { by: 'b', say: "That's why I like {friend} too." },
    { by: 'a', say: "Sure. And at the end, who do you think everybody votes for? You, or {friend}?" },
    { by: 'b', say: "...{friend}." },
    { by: 'a', say: "So you can be {friend}'s best friend, or you can win. Not both." },
    { by: 'b', say: "I need to think." },
    { by: 'a', conf: "{b} said \"I need to think.\" That's how every yes I've ever gotten started." },
  ] },
  { id: 'ptf.t4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I'll keep this simple. {friend} is going to get you voted out, and {friend} won't even mean to." },
    { by: 'b', say: "How?" },
    { by: 'a', say: "Because everybody knows you two are a pair. And pairs go together." },
    { by: 'b', say: "So what, I just cut {friend} loose?" },
    { by: 'a', say: "I'm saying be ready to, if it's you or {friend}. That's all." },
    { by: 'b', say: "...Okay. If it's me or {friend}. Okay." },
    { by: 'a', conf: "Nobody likes to hear it, but every pair out here has an expiry date. I just told {b} the date." },
  ] },
  { id: 'ptf.t5', turns: [
    { by: 'a', say: "Did {friend} tell you about the conversation this morning?" },
    { by: 'b', say: "What conversation?" },
    { by: 'a', say: "Oh. I figured {friend} would have told you. Never mind." },
    { by: 'b', say: "No, wait. What conversation?" },
    { by: 'a', say: "Ask {friend}. I don't want to get in the middle of it." },
    { by: 'b', conf: "{a} wouldn't tell me what it was about. Which means it was about me. And {friend} didn't say a word." },
  ] },
  { id: 'ptf.t6', turns: [
    { by: 'a', say: "Can I tell you what I see? I see you doing everything for {friend}, and {friend} doing nothing for you." },
    { by: 'b', say: "That's not true." },
    { by: 'a', say: "Who carried water this morning? Who saved {friend} a seat? Who's ever saved you one?" },
    { by: 'b', say: "...Huh." },
    { by: 'a', say: "I'm not telling you what to do. I just think you deserve better." },
    { by: 'b', conf: "I hate that {a} is kind of right. I'm going to pay a lot more attention to {friend} now." },
  ] },
];

const REFUSED = [
  { id: 'ptf.r1', turns: [
    { by: 'a', say: "Can I ask you something about {friend}?" },
    { by: 'b', say: "Depends. Is it something nice?" },
    { by: 'a', say: "I just think {friend} is playing a much bigger game than you know." },
    { by: 'b', say: "And you're telling me this because you care about me so much?" },
    { by: 'a', say: "I'm telling you because I think you should know." },
    { by: 'b', say: "Well, now I know. And I don't believe you." },
    { by: 'b', conf: "{a} wants me to turn on {friend}. That tells me a lot more about {a} than about {friend}." },
  ] },
  { id: 'ptf.r2', turns: [
    { by: 'a', say: "If you had to vote out {friend}, could you?" },
    { by: 'b', say: "No. Next question." },
    { by: 'a', say: "Even if {friend} would do it to you?" },
    { by: 'b', say: "{friend} wouldn't. And honestly, I'd rather lose with {friend} than win with you." },
    { by: 'a', say: "...Okay. Forget I asked." },
    { by: 'b', say: "Already forgotten." },
    { by: 'a', conf: "{b} is loyal. That's sweet. It's also going to get {b} voted out." },
  ] },
  { id: 'ptf.r3', turns: [
    { by: 'a', say: "Don't take this the wrong way, but {friend} is using you." },
    { by: 'b', say: "Is there a right way to take that?" },
    { by: 'a', say: "Just think about it. Everybody can see it but you." },
    { by: 'b', say: "Everybody, or just you?" },
    { by: 'a', say: "I'm trying to help you." },
    { by: 'b', say: "No, you're trying to help yourself. Nice try, though." },
    { by: 'b', conf: "People keep trying to get me away from {friend}. It just makes me want to stay closer." },
  ] },
  { id: 'ptf.r4', turns: [
    { by: 'a', say: "So, you and {friend}. That's pretty serious, huh?" },
    { by: 'b', say: "Yeah. Why?" },
    { by: 'a', say: "No reason. I just think it'd be smart to keep your options open." },
    { by: 'b', say: "My options are fine. {friend} is my option." },
    { by: 'a', say: "Okay. Just don't say I didn't warn you." },
    { by: 'b', say: "I won't. Because you didn't. You just tried to get rid of {friend}." },
  ] },
  { id: 'ptf.r5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Here's my offer. You help me get rid of {friend}, and I take you to the end." },
    { by: 'b', say: "That's a big offer." },
    { by: 'a', say: "It's a real one." },
    { by: 'b', say: "It's also exactly what you'd say to {friend} about me, if it was the other way round." },
    { by: 'a', say: "...Maybe. But I'm saying it to you." },
    { by: 'b', say: "No deal." },
    { by: 'a', conf: "{b} didn't bite. Fine. Plenty of people out here will." },
  ] },
  { id: 'ptf.r6', turns: [
    { by: 'a', say: "Can I be honest? I don't think {friend} is as good a friend as you think." },
    { by: 'b', say: "And you are?" },
    { by: 'a', say: "I'm just looking out for you." },
    { by: 'b', say: "You've talked to me twice. {friend} has talked to me every day." },
    { by: 'a', say: "Okay. Fair." },
    { by: 'b', conf: "I don't know what {a} gets out of me and {friend} falling out, but I know it's something." },
  ] },
];

const WARNED = [
  { id: 'ptf.w1', turns: [
    { by: 'a', say: "I'll be quick. {friend} is going to cost you this game." },
    { by: 'b', say: "Funny. I was just thinking you might cost me this game." },
    { beat: "{b} walks straight over to {c}.", goes: true },
    { by: 'b', say: "{a} just tried to get me to turn on you." },
    { by: 'c', say: "Seriously? What did {a} say?" },
    { by: 'b', say: "That you'd cost me the game. I told {a} where to go." },
    { by: 'c', conf: "{a} went after me through my best friend. Okay. Now I know exactly who I'm dealing with." },
  ] },
  { id: 'ptf.w2', turns: [
    { by: 'a', say: "You've seen how {friend} talks to everybody, right? Like, everybody." },
    { by: 'b', say: "Yeah. It's called being nice." },
    { by: 'a', say: "Or it's called playing. Think about it." },
    { beat: "Later, {b} finds {c} alone.", goes: true },
    { by: 'b', say: "Watch out for {a}. {a} is trying to split us up." },
    { by: 'c', say: "I knew it. I knew {a} was up to something." },
    { by: 'c', conf: "{a} picked the wrong person to try that with. {b} would never." },
  ] },
  { id: 'ptf.w3', turns: [
    { by: 'a', say: "If {friend} goes, you're free to play your own game." },
    { by: 'b', say: "I am playing my own game. With {friend}." },
    { by: 'a', say: "Just think about it." },
    { by: 'b', say: "I don't need to." },
    { beat: "{b} goes and sits down right next to {c}, and tells {c} everything.", goes: true },
    { by: 'c', say: "{a} said that? To you?" },
    { by: 'b', say: "To my face." },
    { by: 'c', conf: "I was going to leave {a} alone. Not anymore." },
  ] },
  { id: 'ptf.w4', turns: [
    { by: 'a', say: "I'll keep it between us, but {friend} has been asking around about you." },
    { by: 'b', say: "Has {friend}? Let's ask." },
    { by: 'a', say: "Wait, you don't have to..." },
    { beat: "{b} calls {c} over.", comes: 'c' },
    { by: 'b', say: "{a} says you've been asking around about me." },
    { by: 'c', say: "What? I haven't said a word about you. {a}, what are you doing?" },
    { by: 'c', conf: "{a} got caught lying in front of both of us. I don't think {a} is going to try that again." },
  ] },
  { id: 'ptf.w5', turns: [
    { by: 'a', say: "Can I give you some advice? Don't go to the end with {friend}." },
    { by: 'b', say: "Why not?" },
    { by: 'a', say: "Because {friend} beats you. Everybody likes {friend} more." },
    { by: 'b', say: "Thanks for that." },
    { beat: "That evening, {b} tells {c} every word.", goes: true },
    { by: 'c', say: "So {a} wants you to cut me loose." },
    { by: 'b', say: "And I told {a} no." },
    { by: 'c', conf: "{a} thinks {b} and I can be split up with a few nice words. {a} has no idea." },
  ] },
  { id: 'ptf.w6', turns: [
    { by: 'a', say: "I'm just saying, you'd go further without {friend}." },
    { by: 'b', say: "And with you, I suppose?" },
    { by: 'a', say: "Maybe." },
    { by: 'b', say: "Okay. Thanks for telling me who you are." },
    { beat: "{b} finds {c} and pulls {c} aside.", goes: true },
    { by: 'b', say: "Just so you know, {a} is coming for you. Through me." },
    { by: 'c', say: "Then {a} is going to have a really bad week." },
    { by: 'c', conf: "Funny how the people who scheme the hardest never think they'll get told on." },
  ] },
];

const POACH = [
  { id: 'ptf.p1', turns: [
    { by: 'a', say: "How are things in {from}? Honestly." },
    { by: 'b', say: "Fine. Why?" },
    { by: 'a', say: "Because from where I'm sitting, you're the one they'd cut first." },
    { by: 'b', say: "...You think?" },
    { by: 'a', say: "I know. Come to {group}. We need you, and we'd actually keep you." },
    { by: 'b', say: "If I do this, there's no going back." },
    { by: 'a', say: "There was never going to be a going back. Not out here." },
    { by: 'b', say: "...Okay. I'm in." },
  ] },
  { id: 'ptf.p2', turns: [
    { by: 'a', say: "Can I make you an offer? You won't like where it comes from." },
    { by: 'b', say: "Try me." },
    { by: 'a', say: "Leave {from}. Come to {group}." },
    { by: 'b', say: "That's a big ask. They're my people." },
    { by: 'a', say: "Are they? When did they last ask you what you wanted?" },
    { by: 'b', say: "...They didn't." },
    { by: 'a', say: "We will." },
    { by: 'b', conf: "I just switched sides. I feel sick. I also feel safer than I have in days." },
  ] },
  { id: 'ptf.p3', turns: [
    { by: 'a', say: "Everybody in {from} is talking about the next vote. Have they told you who it is?" },
    { by: 'b', say: "No." },
    { by: 'a', say: "Doesn't that worry you?" },
    { by: 'b', say: "It does now." },
    { by: 'a', say: "Then come with us. {group} tells each other everything." },
    { by: 'b', say: "Okay. But if {from} finds out..." },
    { by: 'a', say: "They'll find out when it's too late to do anything about it." },
    { by: 'a', conf: "{b} was the weak spot in {from}. Now {b} is a strong spot in {group}." },
  ] },
  { id: 'ptf.p4', turns: [
    { by: 'b', say: "Why are you being so nice to me? I'm in {from}." },
    { by: 'a', say: "For now." },
    { by: 'b', say: "What does that mean?" },
    { by: 'a', say: "It means {group} has room for one more, and I'd rather it was you." },
    { by: 'b', say: "And what do I tell {from}?" },
    { by: 'a', say: "Nothing. Not yet." },
    { by: 'b', say: "...Okay. I'll think about it. Actually, no. I'm in." },
  ] },
  { id: 'ptf.p5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Let's not pretend. {from} is going to lose the numbers, and you know it." },
    { by: 'b', say: "Maybe." },
    { by: 'a', say: "So be on the winning side when it happens. {group}. Today." },
    { by: 'b', say: "And if I say no?" },
    { by: 'a', say: "Then you go down with {from}. Your choice." },
    { by: 'b', say: "...Fine. {group}." },
    { by: 'b', conf: "I didn't switch because I like {a}. I switched because {a} was right." },
  ] },
  { id: 'ptf.p6', turns: [
    { by: 'a', say: "I've been watching you in {from}. You do all the work and they make all the decisions." },
    { by: 'b', say: "Is it that obvious?" },
    { by: 'a', say: "To me it is. In {group}, you'd have a real say." },
    { by: 'b', say: "That's what {from} told me at the start." },
    { by: 'a', say: "Then judge us by what we do, not what we say. Come and see." },
    { by: 'b', say: "...Okay. I'll come and see." },
    { by: 'b', conf: "I don't know if I'm smart or a traitor. Probably both." },
  ] },
];

export default {
  'pitch.turn.took': TOOK,
  'pitch.turn.refused': REFUSED,
  'pitch.turn.warned': WARNED,
  'recruit.join.poach': POACH,
};
export const GUARANTEED = {
  'pitch.turn.took': ['friend'], 'pitch.turn.refused': ['friend'], 'pitch.turn.warned': ['friend'],
  'recruit.join.poach': ['group', 'from'],
};
