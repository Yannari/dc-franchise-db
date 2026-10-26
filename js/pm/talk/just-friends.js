// ══════════════════════════════════════════════════════════════════════
// pm/talk/just-friends.js — after "better as friends": {a} ended it, {b} was told
// ══════════════════════════════════════════════════════════════════════
//
// Two who were a couple and are friends now (pm/just-friends.js), until they
// rekindle. `of`, the engine's read of where they are:
//   bed     still coupled for the villa's sake, sharing a bed as mates
//   raw     the day after, and {b} still feels it
//   torch   {b} still has feelings, a while on
//   easy    it has settled into a friendship
// Never a kiss, never "babe": they are not a couple, whatever the villa says.
//   open    they end up together
//   topic   where things are now
//   close   how they leave it
import { build } from './build.js';

export const JUST_FRIENDS = build('just-friends', {
  stages: [
    { stage: "{a} and {b} are on the daybeds, a careful foot of cushion between them." },
    { stage: "{a} and {b} end up on washing-up duty together." },
  ],
  plans: {
    featured: ['open', 'topic', 'close'],
    short: ['topic', 'close'],
  },
  moves: {
    open: [
      { when: { of: 'bed' }, stage: "{a} and {b} get ready for bed on opposite sides of the same mattress.", turns: [
        ['a', "Pillow wall?"],
        ['b', "Pillow wall."],
      ] },
      { when: { of: 'bed', phase: 'morning' }, stage: "{a} wakes up first and finds {b} already staring at the ceiling.", turns: [
        ['a', "Morning. Sleep all right on your side?"],
        ['b', "Don't. It's weird enough as it is."],
      ] },
      { when: { of: 'raw' }, stage: "{a} hovers by the kitchen counter while {b} makes a tea, and doesn't know whether to sit down.", turns: [
        ['a', "Is it all right if I sit here?"],
        ['b', "It's a kitchen. You can sit where you want."],
      ] },
      { when: { of: 'torch' }, stage: "{b} is on the swing seat. {a} sits down at the other end of it.", turns: [
        ['a', "Can I join you, or is this a private swing?"],
        ['b', "Go on. There's room."],
      ] },
      { when: { of: 'easy' }, stage: "{a} drops onto the beanbag next to {b} with two drinks.", turns: [
        ['a', "One for you. Don't say I never do anything for you."],
        ['b', "You never do anything for me."],
        ['a', "I literally just did."],
      ] },
      { when: { of: 'easy', phase: 'morning' }, stage: "{a} and {b} are the first two at the breakfast table.", turns: [
        ['b', "You look like you slept in a hedge."],
        ['a', "Thanks. Love you too."],
      ] },
      { stage: "{a} finds {b} by the pool.", turns: [
        ['a', "All right?"],
        ['b', "All right."],
      ] },
    ],
    topic: [
      { when: { of: 'bed' }, turns: [
        ['b', "Everyone thinks we're still a couple, you know. Someone asked me this morning if we'd made up."],
        ['a', "What did you say?"],
        ['b', "I said we're just sharing a bed until the next recoupling. Two friends sharing a room. Very cosy friends."],
        ['a', "We are very good at sharing, to be fair."],
      ] },
      { when: { of: 'bed' }, turns: [
        ['a', "Is it strange, still sleeping next to me?"],
        ['b', "Strange is one word for it. It's fine. I just don't want you thinking it means anything."],
        ['a', "I don't. I promise. You're safe on your side."],
      ] },
      { when: { of: 'bed' }, turns: [
        ['b', "So when the next recoupling comes, we pick other people. That's the deal, yeah?"],
        ['a', "That's the deal. Unless nobody picks either of us, and then we're stuck with each other."],
        ['b', "Don't. Don't even put that out there."],
      ] },
      { when: { of: 'raw' }, turns: [
        ['a', "I hated how yesterday went. I didn't want to hurt you."],
        ['b', "I know you didn't. It still hurt. Both things are true."],
        ['a', "Is there anything I can do?"],
        ['b', "Just don't be weird around me. That would help."],
      ] },
      { when: { of: 'raw' }, turns: [
        ['b', "I'm not going to pretend I'm over it by lunchtime."],
        ['a', "I'm not asking you to."],
        ['b', "Good. Because I'm not. But I don't want to fall out with you either."],
      ] },
      { when: { of: 'raw' }, turns: [
        ['a', "Are we okay?"],
        ['b', "We will be. Give it a few days. I just need to stop looking at you like you're mine."],
      ] },
      { when: { of: 'torch' }, turns: [
        ['b', "Can I be honest? I'm still not completely over you. I'm working on it."],
        ['a', "You don't have to tell me that."],
        ['b', "I do, though. Otherwise I'll keep laughing too hard at your jokes and you'll get the wrong idea."],
      ] },
      { when: { of: 'torch' }, turns: [
        ['a', "Have you got your eye on anyone yet?"],
        ['b', "Are you really asking me that?"],
        ['a', "I'm asking as a friend."],
        ['b', "Then as a friend: not yet. Give me a minute."],
      ] },
      { when: { of: 'torch' }, turns: [
        ['b', "Every time you laugh at something, there's a bit of me that still goes, oh. And then I remember."],
        ['a', "I'm sorry."],
        ['b', "Stop saying sorry. It's not something you did. It's just where I'm at."],
      ] },
      { when: { of: 'easy' }, turns: [
        ['a', "So who are you into now? Go on. I'll help."],
        ['b', "You'll help? You were rubbish at being my partner, and now you want to be my wingman?"],
        ['a', "I'm a much better wingman. Trust me."],
      ] },
      { when: { of: 'easy' }, turns: [
        ['b', "Honestly, I think we're better like this."],
        ['a', "Me too. We were fine as a couple. We're great as friends."],
        ['b', "Fine. Thanks for that. Very romantic."],
      ] },
      { when: { of: 'easy' }, turns: [
        ['a', "Do you remember our first real chat?"],
        ['b', "When you told me you'd never had a serious relationship, and then asked me what my favourite cheese was?"],
        ['a', "It's an important question."],
        ['b', "It's really not."],
      ] },
      { when: { of: 'easy' }, turns: [
        ['b', "Weirdly, you're the person I talk to most in here now."],
        ['a', "Because I know all your stuff already. You don't have to explain anything."],
        ['b', "Exactly. It saves a lot of time."],
      ] },
    ],
    close: [
      { when: { of: 'bed' }, turns: [['a', "Night, friend."], ['b', "Night."]], beat: "They turn over, back to back, and somebody across the room giggles." },
      { when: { of: 'bed' }, turns: [], beat: "{b} rolls over to face the wall. {a} doesn't take it personally." },
      { when: { of: 'raw' }, turns: [], beat: "{b} picks up the tea and goes outside. {a} doesn't follow, which is the right call." },
      { when: { of: 'raw' }, turns: [['b', "We're all right. Just not yet."]], beat: "{a} nods, and lets {b} go first." },
      { when: { of: 'torch' }, turns: [['a', "You'll find someone who's sure. You deserve that."], ['b', "I know. I just wish it was you."]], beat: "They sit there a minute longer, not saying anything." },
      { when: { of: 'torch' }, turns: [], beat: "{b} laughs at something {a} says, then catches it, and looks away." },
      { when: { of: 'easy' }, turns: [['b', "Go on, then. Go and find me someone."], ['a', "Leave it with me."]], beat: "{a} heads off towards the pool with a plan and no idea what it is." },
      { when: { of: 'easy' }, turns: [], beat: "They end up in fits about nothing, and the villa watches them, confused." },
    ],
  },
  notes: [
    { stage: "{a} and {b}, friends now, since {a} called it off." },
  ],
});
