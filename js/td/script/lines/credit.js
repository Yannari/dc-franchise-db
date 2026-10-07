// ══════════════════════════════════════════════════════════════════════
// td/script/lines/credit.js — a stolen big move (camp-events.js checkStolenCredit)
// ══════════════════════════════════════════════════════════════════════
//
// Written in two parts (scriptEventParts): what happened, then how the other one took it.
//
//   credit.steal.any    a takes credit for b's move at the last vote. reason: loud | quiet
//   credit.sting.any    a, whose move it was, reacts to b. reason: calm | hot | mid
//   credit.callout.any  a calls b out for it. reason: hot | bold | cracked
//   credit.answer.any   how it ends. ending: won (a gets the move back) | lost (b talks
//                       a down). a is the one who made the move, b the one who took it.
//
// Ids: 'cr.'.

const STEAL = [
  { id: 'cr.s1', when: { reason: 'loud' }, turns: [
    { by: 'a', say: "That was the biggest move of the season, and I'm not afraid to say I made it." },
    { beat: '{b} stares at the ground.' },
  ] },
  { id: 'cr.s2', when: { reason: 'loud' }, turns: [
    { by: 'a', say: "I saw the opening and I took it. Simple as that." },
    { beat: '{b} was there. {b} MADE the opening. But {a} is louder.' },
  ] },
  { id: 'cr.s3', when: { reason: 'loud' }, turns: [
    { by: 'a', say: "Okay, so here's how I pulled off that blindside..." },
    { by: 'b', conf: "{a} pulled off nothing. I pulled it off. {a} just voted where I told {a.obj} to." },
  ] },
  { id: 'cr.s4', when: { reason: 'quiet' }, turns: [
    { by: 'a', say: "Yeah, so I talked to everyone first, and then the rest of us got on board." },
    { by: 'b', conf: "I talked to everyone first. {a} talked to me." },
  ] },
  { id: 'cr.s5', when: { reason: 'quiet' }, turns: [
    { by: 'a', say: "I've been thinking about my game, and honestly? That last vote was my best move." },
    { beat: '{b} almost chokes on {b.posAdj} dinner.' },
  ] },
  { id: 'cr.s6', when: { reason: 'quiet' }, turns: [
    { by: 'a', say: "We really pulled that one off, huh? Well. I did most of it. But we." },
    { by: 'b', say: "...Sure. We." },
  ] },
  { id: 'cr.s7', turns: [
    { by: 'a', say: "Honestly, I'm a little surprised nobody saw that vote coming. It was so obvious to me." },
    { by: 'b', say: "Was it." },
    { by: 'a', say: "From the very start." },
  ] },
  { id: 'cr.s8', turns: [
    { beat: 'Every time somebody brings up the last vote, {a} tells it again. The story gets a little bigger each time.' },
    { by: 'b', conf: "Every version, I'm in it less." },
  ] },
  { id: 'cr.s9', turns: [
    { by: 'a', say: "Somebody had to make the call. So I made it." },
    { by: 'b', say: "You made the call?" },
    { by: 'a', say: "Somebody had to." },
  ] },
];

const STING = [
  { id: 'cr.t1', when: { reason: 'calm' }, turns: [
    { by: 'a', conf: "I'm watching somebody take credit for MY move, and I can't even—" },
    { by: 'a', conf: "...Okay. Breathe. This isn't over." },
  ] },
  { id: 'cr.t2', when: { reason: 'calm' }, turns: [
    { by: 'a', conf: "I know the truth. The question is whether anybody else does. And whether I want to start a fight over it." },
  ] },
  { id: 'cr.t3', when: { reason: 'calm' }, turns: [
    { beat: '{a} keeps a straight face the whole time {b} is talking.' },
    { by: 'a', conf: "Let {b} have the story. I'll have the jury." },
  ] },
  { id: 'cr.t4', when: { reason: 'hot' }, turns: [
    { beat: '{a} gets up from the fire and walks off without a word. Everybody notices.' },
    { by: 'a', conf: "If I'd stayed, I would have said something I'd regret. Then again, maybe I wouldn't regret it." },
  ] },
  { id: 'cr.t5', when: { reason: 'hot' }, turns: [
    { beat: '{a} throws a log on the fire hard enough to send sparks everywhere.' },
    { by: 'a', conf: "MY move. MY plan. And {b} is standing there taking a bow." },
  ] },
  { id: 'cr.t6', when: { reason: 'hot' }, turns: [
    { by: 'a', say: "Wow. Okay." },
    { by: 'b', say: "What?" },
    { by: 'a', say: "Nothing. Keep going. It's a great story." },
  ] },
  { id: 'cr.t7', when: { reason: 'mid' }, turns: [
    { by: 'a', conf: "If {b} wants to tell people that was {b.posAdj} move, fine. The jury will know the truth. I hope." },
  ] },
  { id: 'cr.t8', when: { reason: 'mid' }, turns: [
    { beat: '{a} rolls {a.posAdj} eyes and looks away.' },
    { by: 'a', conf: "I don't trust myself to say anything right now. Not yet. But soon." },
  ] },
  { id: 'cr.t9', when: { reason: 'mid' }, turns: [
    { by: 'a', conf: "I'm not even mad. Okay, I'm a little mad. I'm mostly mad." },
  ] },
];

const CALLOUT = [
  { id: 'cr.c1', when: { reason: 'hot' }, turns: [
    { by: 'a', say: "You sat there and did NOTHING, and then you told everyone it was YOUR move? Say it to my face, {b}." },
    { beat: 'The camp goes dead silent.' },
  ] },
  { id: 'cr.c2', when: { reason: 'hot' }, turns: [
    { by: 'a', say: "You want to know who ACTUALLY flipped that vote? Because it wasn't {b}!" },
    { by: 'b', say: "Whoa. Calm down." },
    { by: 'a', say: "Don't tell me to calm down!" },
  ] },
  { id: 'cr.c3', when: { reason: 'hot' }, turns: [
    { by: 'a', say: "I am DONE watching {b} walk around like {b} runs this game. That was MY move. MINE." },
    { beat: '{b} doesn\'t even blink.' },
  ] },
  { id: 'cr.c4', when: { reason: 'bold' }, turns: [
    { by: 'a', say: "We both know what happened at that vote. You didn't plan anything. I did." },
    { by: 'a', say: "Keep telling people otherwise, and I'll make sure the jury hears exactly who did what." },
  ] },
  { id: 'cr.c5', when: { reason: 'bold' }, turns: [
    { by: 'a', say: "Hey, {b}, tell everybody again how you planned that blindside. I love that story. Especially the part where I came to YOU with the plan." },
    { beat: '{b}\'s smile freezes.' },
  ] },
  { id: 'cr.c6', when: { reason: 'bold' }, turns: [
    { by: 'a', say: "I know what you're doing. Taking credit for my game." },
    { by: 'b', say: "I don't know what you mean." },
    { by: 'a', say: "Then let me be clear. It stops now, or I tell everybody how that vote really happened." },
  ] },
  { id: 'cr.c7', when: { reason: 'cracked' }, turns: [
    { by: 'a', say: "That was MY move. You know it was my move. Why are you doing this?" },
    { beat: '{a}\'s voice cracks. Everybody is caught off guard.' },
  ] },
  { id: 'cr.c8', when: { reason: 'cracked' }, turns: [
    { by: 'a', say: "I just... I can't listen to this anymore. {b} didn't do anything. I did." },
    { by: 'b', say: "{a}, come on." },
    { by: 'a', say: "No. I'm tired of pretending." },
  ] },
  { id: 'cr.c9', when: { reason: 'cracked' }, turns: [
    { by: 'a', say: "You took the one thing I did in this game that mattered, and you put your name on it." },
    { by: 'a', say: "I can't just let that go." },
  ] },
];

const ANSWER = [
  { id: 'cr.a1', when: { ending: 'won' }, turns: [
    { by: 'b', say: "That's not how it—" },
    { by: 'a', say: "Who did you talk to first? What did you say? When?" },
    { beat: '{b} has no answers. Everybody can see it.' },
  ] },
  { id: 'cr.a2', when: { ending: 'won' }, turns: [
    { by: 'b', say: "Whatever. Believe what you want." },
    { beat: 'Everybody already does. And it isn\'t {b}\'s version.' },
    { by: 'a', conf: "Finally. That move has my name back on it." },
  ] },
  { id: 'cr.a3', when: { ending: 'won' }, turns: [
    { by: 'b', say: "I was part of it too!" },
    { by: 'a', say: "You were part of it. I MADE it. There's a difference." },
    { beat: 'A couple of people nod. Not at {b}.' },
  ] },
  { id: 'cr.a4', when: { ending: 'lost' }, turns: [
    { by: 'b', say: "I don't know what {a} is talking about. We all saw what happened. I'm sorry {a} feels that way." },
    { beat: 'It\'s so smooth it almost sounds sincere. People nod along. {a} looks like the petty one.' },
  ] },
  { id: 'cr.a5', when: { ending: 'lost' }, turns: [
    { by: 'b', say: "If it was really your move, why didn't you say so at the time? Why now?" },
    { beat: 'Everybody looks at {a}. {a} doesn\'t have an answer.' },
  ] },
  { id: 'cr.a6', when: { ending: 'lost' }, turns: [
    { by: 'b', say: "I'm not going to argue about who did what. The game speaks for itself." },
    { by: 'a', conf: "And somehow I'm the one who looks desperate." },
  ] },
];

export default {
  'credit.steal.any': STEAL, 'credit.sting.any': STING, 'credit.callout.any': CALLOUT, 'credit.answer.any': ANSWER,
};
