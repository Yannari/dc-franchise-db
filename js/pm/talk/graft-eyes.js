// ══════════════════════════════════════════════════════════════════════
// pm/talk/graft-eyes.js — {a} tells {b}: "I'm going to go for {c}"
// ══════════════════════════════════════════════════════════════════════
//
// The first beat of a graft (pm/threads.js): {a} wants {c}, who is coupled
// with {d}, and says so to a friend before doing anything about it. The real
// show opens a storyline exactly like this ("Alana, she's beautiful, man" —
// "but would she be enough to turn your head?"). `of` is the friend's line:
// go-for-it or careful. `theirs`: whether {c} has given {a} anything back yet.
// `fresh`: {a} walked in today or yesterday (a bombshell's first move).
//   open    where they are, and {a} bringing it up
//   want    what {a} wants, and why {c}
//   reply   what {b} makes of it, {d} included
//   plan    how {a} is going to go about it
//   close   how they leave it
import { build } from './build.js';

export const GRAFT_EYES = build('graft-eyes', {
  stages: [
    { stage: "{a} and {b} are on the swing seat, watching the pool." },
    { stage: "{a} and {b} are lying on the sunbeds at the far end of the garden." },
    { stage: "{a} finds {b} on the roof terrace, alone for once." },
  ],
  plans: {
    featured: ['open', 'want', 'reply', 'plan', 'close'],
    short: ['want', 'reply', 'close'],
  },
  moves: {
    open: [
      { stage: "{a} and {b} are on the swing seat. {a} has been watching the daybeds for a while.", turns: [
        ['b', "You've been staring at the same spot for about ten minutes."],
        ['a', "Have I? I haven't."],
        ['b', "You have. And I know exactly who's sitting in that spot."],
        ['a', "Okay. Fine. Can I tell you something, and you don't make a big deal out of it?"],
      ] },
      { stage: "{a} drags {b} down to the end of the garden, out of earshot.", turns: [
        ['b', "Why are we all the way down here? What have you done?"],
        ['a', "I haven't done anything. Yet. That's what I want to talk to you about."],
        ['b', "Oh, no. I don't like the sound of yet."],
      ] },
      { stage: "{a} and {b} are making drinks in the kitchen, and {a} keeps looking over at the pool.", turns: [
        ['b', "That's the third time you've looked over there."],
        ['a', "I'm just looking."],
        ['b', "At what?"],
        ['a', "Can we talk about it somewhere that isn't the middle of the kitchen?"],
      ] },
      { when: { fresh: true }, stage: "{a}, still new in the villa, sits down next to {b} on the daybeds.", turns: [
        ['b', "So go on, then. You've had a good look round now. What do you think?"],
        ['a', "Honestly? I knew before I'd even put my bag down."],
        ['b', "Already? Who?"],
      ] },
      { stage: "{a} and {b} are lying on the sunbeds. {a} sits up suddenly.", turns: [
        ['a', "Right. I need to say something out loud, or I'm going to go mad."],
        ['b', "That sounds dramatic."],
        ['a', "It is a bit dramatic."],
      ] },
    ],
    want: [
      { turns: [
        ['a', "It's {c}. I can't stop thinking about {c.obj}. I know {c}'s with {d}, I'm not stupid, I've got eyes. But every time {c} laughs at something, I just want to be the one making {c.obj} laugh."],
        ['b', "{c}? Like, {d}'s {c}?"],
        ['a', "Is there another one?"],
      ] },
      { turns: [
        ['a', "Okay, so. {c}."],
        ['b', "No."],
        ['a', "I haven't even said anything yet!"],
        ['b', "You don't have to. Your face is saying it. {c} is coupled up with {d}, in case you missed that bit."],
        ['a', "I didn't miss it. I just don't think it's as solid as everyone thinks it is."],
      ] },
      { when: { fresh: true }, turns: [
        ['a', "{c}. The second I walked down those steps, I saw {c.obj}, and I thought, that's who I'm here for."],
        ['b', "You know {c}'s with {d}, though."],
        ['a', "Everyone keeps telling me that. But I didn't come in here to sit on a sunbed and wait for someone to be single. That's not what a bombshell does."],
      ] },
      { when: { theirs: 'yes' }, turns: [
        ['a', "Can I be honest? I think there's something between me and {c}. Every time we're in the same conversation, {c} looks at me. Like, properly looks. And {c} doesn't look at {d} like that."],
        ['b', "That's a big thing to say."],
        ['a', "I know. But I'm not making it up. You've seen it too, haven't you?"],
        ['b', "I might have seen something."],
      ] },
      { when: { theirs: 'no' }, turns: [
        ['a', "I like {c}. Like, I really like {c.obj}. And I know {c} probably hasn't even noticed me. Every time I look over, {d} is wrapped round {c.obj}."],
        ['b', "So what are you going to do about it?"],
        ['a', "I don't know. That's why I'm telling you. Talk me out of it, or talk me into it."],
      ] },
      { when: { taken: true }, turns: [
        ['a', "I know how this sounds, because I'm with {pa}. But {pa} and I are just not there, and I can't keep pretending I'm not looking at {c}."],
        ['b', "And {c} is with {d}."],
        ['a', "I know. It's a mess. That's why I'm telling you and not anyone else."],
      ] },
    ],
    reply: [
      { when: { of: 'go-for-it' }, turns: [
        ['b', "Look, if you like {c.obj}, go and find out. That's what this place is. {d} doesn't own {c.obj}, and if it's as strong as they think, a chat isn't going to break it."],
        ['a', "That's what I was thinking."],
        ['b', "Just do it to {c.posAdj} face. Don't do anything sneaky. Pull {c.obj} in front of everyone."],
      ] },
      { when: { of: 'go-for-it' }, turns: [
        ['b', "Honestly? Go for it. You'll regret it more if you don't. Worst case, {c} says no, and you've lost nothing."],
        ['a', "Apart from my dignity."],
        ['b', "You lost that on day one."],
      ] },
      { when: { of: 'careful' }, turns: [
        ['b', "I'm not going to tell you what to do. But {d} is my friend, and if you go steaming in, I'm the one who's going to be sitting up with {d.obj} all night."],
        ['a', "I'm not trying to hurt anyone."],
        ['b', "I know you're not. Just be careful how you do it. Be honest with {c}, and don't play games."],
      ] },
      { when: { of: 'careful' }, turns: [
        ['b', "Hmm. I just think you need to know what you're walking into. {c} and {d} have been together a while. You go for {c}, and the whole villa is going to have an opinion."],
        ['a', "The whole villa always has an opinion."],
        ['b', "Yeah, but this time it'll be about you."],
      ] },
      { turns: [
        ['b', "Okay. Say it's real. Say {c} feels it as well. Are you ready for what happens next? Because {d} is not going to just smile and step aside."],
        ['a', "I'm not asking {d} to step aside. I just want to have one conversation with {c} and see."],
      ] },
    ],
    plan: [
      { turns: [
        ['a', "I'm going to pull {c.obj} later. Just a chat. Nothing crazy."],
        ['b', "When you say nothing crazy…"],
        ['a', "I mean a chat. With words. Maybe a bit of eye contact."],
        ['b', "Oh, God."],
      ] },
      { turns: [
        ['a', "I'm not going to creep around. When I go for it, I'll go for it properly, in front of everyone. I'd rather {d} hates me for being honest than for being sneaky."],
        ['b', "That's actually quite mature of you."],
        ['a', "Don't sound so surprised."],
      ] },
      { when: { fresh: true }, turns: [
        ['a', "I'm going to get {c.obj} on my own before the end of the day. I haven't got time to wait around."],
        ['b', "You've been in here five minutes."],
        ['a', "Exactly. And I've already wasted four of them."],
      ] },
      { turns: [
        ['a', "Do you think I should wait? Like, see if anything happens with {c} and {d} first?"],
        ['b', "If you wait for them to fall out, you could be waiting all summer."],
        ['a', "Right. So, today, then."],
        ['b', "I didn't say today!"],
      ] },
    ],
    close: [
      { turns: [['b', "Just promise me you'll tell me how it goes."], ['a', "You'll be the first to know."]] },
      { turns: [['b', "I can't believe you're doing this."], ['a', "Neither can I, to be honest."]], beat: "They both look over at the daybeds at the same time, and quickly look away." },
      { turns: [['a', "Don't say anything to anyone."], ['b', "Who am I going to tell?"], ['a', "Everyone. You'll tell everyone."]] },
      { turns: [], beat: "{a} gets up, takes a breath, and heads back towards the pool." },
    ],
  },
  notes: [
    { stage: "{a} admits to {b} that {a.posAdj} eyes are on {c}, who is with {d}." },
  ],
});
