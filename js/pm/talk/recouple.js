// ══════════════════════════════════════════════════════════════════════
// pm/talk/recouple.js — {a} stands up at the recoupling and picks {b}
// ══════════════════════════════════════════════════════════════════════
//
// How the show does it: the islander stands, talks about this person without
// saying who, then gives the name, and the fire pit reacts. Why {a} picks {b}
// is the engine's (`reason`: connection · attraction · safety · loyalty — a
// safety pick never claims a spark). `stoleFrom`: {b} was {c}'s, and {a} took
// {b}; `reclaim`: {a} is taking back {a.posAdj} own partner. `justMet`: one of
// them walked in today. A ceremony: always shown whole (`tiered: false`).
//   stand     {a} gets up
//   speech    why — the long turn, never the name
//   name      the name, and the gap before it
//   react     {b}, and the fire pit
import { build } from './build.js';

const GIRL = { bGender: 'f' };
const BOY = { bGender: 'm' };

export const RECOUPLE_PICK = build('recouple-pick', {
  tiered: false,
  plans: {
    featured: ['stand?', 'speech', 'name', 'react'],
    short: ['speech', 'name', 'react'],
  },
  moves: {
    stand: [
      { turns: [], beat: "{a} stands up, smooths {a.posAdj} outfit down, and takes a long breath." },
      { turns: [], beat: "{a} gets up, and the whole fire pit goes quiet." },
      { turns: [['a', "Right. Okay. Here goes."]], beat: "{a} stands up, hands shaking a little." },
      { turns: [], beat: "{a} stands, looks along the benches, and smiles at someone." },
    ],

    speech: [
      // connection
      { when: { reason: 'connection' }, turns: [
        ['a', "The person I want to couple up with tonight is someone I can be completely myself around. From the first {~proper} chat we had, it was easy. We can talk about anything, we can sit in silence, and I've never once had to pretend to be someone I'm not."],
      ] },
      { when: { reason: 'connection', known: true }, turns: [
        ['a', "We've had our ups and downs in here, I'm not going to lie. There have been days where I didn't know where I stood. But every single time, we've talked it through, and every time I've come out the other side liking this person a bit more than before."],
      ] },
      { when: { reason: 'connection' }, turns: [
        ['a', "This person is the first one I want to talk to in the morning and the last one I want to see before I go to sleep. They make me laugh when I'm having a rubbish day, and they always know when something's wrong, even when I'm pretending it isn't."],
      ] },
      { when: { reason: 'connection' }, turns: [
        ['a', "I came in here not really knowing what I wanted. And then I met someone who just got me, straight away, without me having to explain anything. That doesn't happen very often, and I'm not going to let it go."],
      ] },
      { when: { reason: 'connection', rung: ['exclusive', 'official'] }, turns: [
        ['a', "I don't think I need to say very much, because everyone in this villa already knows. This person has had my heart for a while now, and nothing that's happened in here has changed that. If anything, it's made it stronger."],
      ] },
      { when: { reason: 'connection', reg: 'soft' }, turns: [
        ['a', "I'm going to try not to cry, but I'm not promising anything. This person has looked after me since I walked in. On the days I've been homesick, on the days I've been in my head, they've been there. I don't think they realise how much that's meant to me."],
      ] },
      { when: { reason: 'connection', reg: 'big' }, turns: [
        ['a', "Okay, so, the person I'm picking tonight is my favourite person in this whole villa, and I'm not even sorry to everyone else. We have the best time. We laugh about absolutely nothing. I'd pick this person a hundred times over."],
      ] },
      { when: { reason: 'connection', reg: 'dry' }, turns: [
        ['a', "I'm not very good at speeches, so I'll keep it short. The person I'm picking is the only one in here who laughs at my jokes. Including the bad ones. Especially the bad ones. That's rare, and I'm hanging on to it."],
      ] },
      { when: { reason: 'connection', reg: 'sharp' }, turns: [
        ['a', "I don't do soppy, so I'll just say it straight. The person I'm picking has been honest with me from day one, and in here that's worth more than anything. I trust them, and I don't trust many people."],
      ] },
      { when: { reason: 'connection', feels: 'strong' }, turns: [
        ['a', "I've been thinking about what to say all day, and everything I came up with sounded cheesy. So I'm just going to say it. I'm falling for this person. I didn't think it would happen this fast, and I didn't think it would happen in here, but it has."],
      ] },
      // attraction
      { when: { reason: 'attraction' }, turns: [
        ['a', "I'll be honest. The person I'm picking tonight caught my eye the second I saw them, and I haven't been able to stop looking since. We haven't had loads of deep chats yet, but there's something there, and I want to see where it goes."],
      ] },
      { when: { reason: 'attraction' }, turns: [
        ['a', "I'm going with my gut tonight. There's someone in this villa who gives me butterflies every time they walk past, and I'd be stupid to ignore that. I don't know where it'll go, but I want to find out."],
      ] },
      { when: { reason: 'attraction', reg: 'flirty' }, turns: [
        ['a', "The person I'm picking knows exactly who they are, because I haven't exactly been subtle. Every time we're in the same room, I forget what I'm saying. I think there's a real spark there, and I'm not going to sit on the bench and pretend I don't feel it."],
      ] },
      { when: { reason: 'attraction', early: true }, turns: [
        ['a', "It's early days, and I know that. But I've had one or two chats with this person, and they've stuck with me. I keep thinking about them after we've finished talking, and that's never a bad sign."],
      ] },
      { when: { reason: 'attraction', reg: 'nervy' }, turns: [
        ['a', "I'm so nervous, sorry. Okay. The person I'm picking is someone I really, really like, and I've been too scared to say it properly until now. So I'm saying it in front of everyone, which is probably the worst way to do it, but here we are."],
      ] },
      { when: { reason: 'attraction', reg: 'big' }, turns: [
        ['a', "I'm going to be honest, I've had my eye on this person since the very first day. Everyone knows. I've told everyone. I've told the kettle. So tonight I'm finally doing something about it."],
      ] },
      // safety
      { when: { reason: 'safety' }, turns: [
        ['a', "I'm going to be honest, because I think I owe it to this person. We haven't had that massive spark yet. But they've been nothing but kind to me since I walked in, and I would much rather build on something real than chase something that isn't there."],
      ] },
      { when: { reason: 'safety' }, turns: [
        ['a', "The person I'm picking is someone I trust. In here, that counts for a lot. We get on really well, we have a laugh, and I think, given a bit of time, it could turn into something more. I want to give it that time."],
      ] },
      { when: { reason: 'safety' }, turns: [
        ['a', "This person has been a really good friend to me in here. Probably one of my best friends. I don't know yet if it's anything more than that, but I'd like to find out, and I know I'll be looked after while I do."],
      ] },
      { when: { reason: 'safety', persona: 'game-player' }, turns: [
        ['a', "I think this person and I understand each other. We both know what we want out of this, and we both know how this place works. I think we'd be good together, and I think we'd look after each other."],
      ] },
      { when: { reason: 'safety', reg: 'dry' }, turns: [
        ['a', "I'm not going to stand here and pretend it's been fireworks, because everyone would know I was lying. But this person is the easiest person to be around in this villa, and right now, that's exactly what I need."],
      ] },
      // loyalty
      { when: { reason: 'loyalty' }, turns: [
        ['a', "I don't need to think about this one. People have tried to turn my head since the last recoupling, and it hasn't worked. I'm staying exactly where I am, because I'm happy where I am."],
      ] },
      { when: { reason: 'loyalty' }, turns: [
        ['a', "I said I'd stick by this person, and I meant it. Nothing that's happened in here has changed how I feel. If anything, it's made me more sure. So I'm not going to stand here and make a long speech, because everyone knows who it is."],
      ] },
      { when: { reason: 'loyalty', known: true }, turns: [
        ['a', "We've been through a lot, me and this person. Bombshells, rows, the lot. And every time, we've come back to each other. I'm not going anywhere, and I'm hoping they're not either."],
      ] },
      { when: { reason: 'loyalty', reg: 'soft' }, turns: [
        ['a', "This person makes me feel safe. Every night, no matter what's gone on in the day, I get to go to bed next to them, and everything's okay again. I'm not giving that up for anyone."],
      ] },
      // a steal
      { when: { stoleFrom: true, reclaim: false }, turns: [
        ['a', "I know this is going to cause drama, and I'm sorry for that, I really am. But I came in here to follow my heart, and if I don't do this tonight, I'll regret it for the rest of my life. The person I want is already coupled up, and I'm going to pick them anyway."],
      ] },
      { when: { stoleFrom: true, reclaim: false }, turns: [
        ['a', "I want to start by saying sorry to one person in particular, because they're not going to like this. But I've had a connection with someone in this villa for a while now, and I can't sit here and pretend I haven't. So I'm going to do something about it."],
      ] },
      { when: { stoleFrom: true, reclaim: false, justMet: true }, turns: [
        ['a', "I know I've only just walked in, and I know everyone's coupled up. But I've had a chat today that I can't stop thinking about, and I'd be lying to myself if I didn't take my chance tonight."],
      ] },
      { when: { reclaim: true }, turns: [
        ['a', "Someone tried to take the person I'm with away from me tonight. I'm not having that. I'm not losing them over one recoupling, so I'm taking them back."],
      ] },
      // just met
      { when: { justMet: true, stoleFrom: false }, turns: [
        ['a', "I've only been in this villa for a few hours, so I won't pretend I know everyone. But I had one chat today that made me want to know more. I don't know where it'll go. I just know I want to find out."],
      ] },
      { when: { justMet: true, stoleFrom: false }, turns: [
        ['a', "It's early, I know it's early. But there's someone here I clicked with straight away. We had a laugh, we had a {~proper} chat, and for the first time today I actually relaxed. That's the person I want to get to know."],
      ] },
    ],

    name: [
      { when: GIRL, turns: [['a', "So the girl I want to couple up with tonight is... {b}."]] },
      { when: BOY, turns: [['a', "So the boy I want to couple up with tonight is... {b}."]] },
      { when: GIRL, turns: [['a', "And that girl is {b}."]] },
      { when: BOY, turns: [['a', "And that boy is {b}."]] },
      { turns: [['a', "The person I want to couple up with is {b}."]] },
      { turns: [['a', "So, I want to couple up with... {b}."]] },
      { when: { reason: 'loyalty' }, turns: [['a', "It's {b}. It was always going to be {b}."]] },
      { when: { rung: ['exclusive', 'official'] }, turns: [['a', "{b}, it's you. It's always been you."]] },
      { when: { stoleFrom: true, reclaim: false }, turns: [['a', "The person I want to couple up with is {b}. Sorry, {c}."]] },
      { when: { reg: 'big' }, turns: [['a', "It's {b}! Obviously it's {b}! Come here!"]] },
      { when: { reg: 'nervy' }, turns: [['a', "It's... it's {b}. Sorry. It's {b}."]] },
      { turns: [['a', "{b}, would you come and join me?"]] },
    ],

    react: [
      { when: { stoleFrom: false }, turns: [], beat: "{b} gets up and walks straight into {a.posAdj} arms, and the fire pit cheers." },
      { when: { stoleFrom: false }, turns: [['b', "Stop it. Come here."]], beat: "{b} hugs {a} for a long time before they sit down together." },
      { when: { stoleFrom: false, reason: ['connection', 'loyalty'] }, turns: [['b', "That was so lovely. You're going to make me cry."]], beat: "They sit down together, holding hands." },
      { when: { stoleFrom: false, reason: 'safety' }, turns: [], beat: "{b} smiles, a little politely, and sits down next to {a}." },
      { when: { stoleFrom: false, reason: 'attraction' }, turns: [['b', "I didn't know you felt like that."], ['a', "Well, now you do."]], beat: "{b} laughs and goes red." },
      { when: { stoleFrom: false, rung: ['exclusive', 'official'] }, turns: [], beat: "The fire pit cheers before {a} has even finished saying the name." },
      { when: { stoleFrom: false, justMet: true }, turns: [['b', "I wasn't expecting that."], ['a', "Good surprise?"], ['b', "Very good surprise."]] },
      { when: { stoleFrom: true, reclaim: false }, turns: [], beat: "There's a gasp along the benches. {b} looks at {c}, then gets up and goes to {a}. {c} stares straight ahead." },
      { when: { stoleFrom: true, reclaim: false }, turns: [['c', "Wow. Okay."]], beat: "{b} won't look at {c} as {b} walks over to {a}." },
      { when: { stoleFrom: true, reclaim: false }, turns: [], beat: "The whole fire pit turns to look at {c}. {c} manages a small, tight smile and says nothing." },
      { when: { stoleFrom: true, reclaim: false }, turns: [['c', "You couldn't have told me first?"]], beat: "Nobody answers. {b} sits down next to {a}." },
      { when: { reclaim: true }, turns: [], beat: "{b} practically runs over, and the fire pit erupts." },
      { when: { reclaim: true }, turns: [['b', "I knew you'd come back for me."], ['a', "Always."]] },
    ],
  },
  notes: [],
});
