// ══════════════════════════════════════════════════════════════════════
// pm/talk/graft-turn.js — how a graft ends, either way
// ══════════════════════════════════════════════════════════════════════
//
// graft-shut [a, b]  {a}, coupled with {pa}, tells {b} to back off: turned
//   down twice, or closed off (pm/threads.js). `of` is how {b} takes it:
//   graceful · sore.
// graft-turn [a, b, c]  {a} tells {b}, the partner, that {a} wants to get to
//   know {c}. `of` is how {b} takes it: angry · hurt · calm.
import { build } from './build.js';

export const GRAFT_SHUT = build('graft-shut', {
  stages: [
    { stage: "{a} finds {b} by the pool, and sits down at the other end of the sunbed." },
  ],
  plans: {
    featured: ['open', 'shut', 'answer', 'close'],
    short: ['shut', 'answer'],
  },
  moves: {
    open: [
      { stage: "{a} waits for {b} by the kitchen island, arms folded.", turns: [
        ['b', "Is this the chat I think it is?"],
        ['a', "It probably is. Can we just do it quickly?"],
      ] },
      { stage: "{a} asks {b} for a chat this time, and walks {b.obj} to the bench by the gym.", turns: [
        ['b', "Well, this is a turn-up. You pulling me."],
        ['a', "Don't get excited. It's not that kind of chat."],
      ] },
      { stage: "{a} sits down next to {b} on the daybed, but not too close.", turns: [
        ['a', "I need to say something, and I need you to actually listen this time."],
        ['b', "Okay. I'm listening."],
      ] },
    ],
    shut: [
      { when: { taken: true }, turns: [
        ['a', "I've been really flattered, honestly. You've been nothing but nice to me. But I'm with {pa}, and I'm happy with {pa}, and every time you pull me it makes things harder for us. So I need you to stop."],
        ['b', "Stop talking to you?"],
        ['a', "No. Stop pulling me for chats. We can be friends. But that's all it's going to be."],
      ] },
      { when: { taken: true }, turns: [
        ['a', "I don't know how else to say this, so I'm just going to say it. I'm not interested. Not like that. I've told you twice now, and I don't want to have to tell you a third time in front of {pa}."],
        ['b', "That's harsh."],
        ['a', "It's not meant to be harsh. It's meant to be clear."],
      ] },
      { when: { taken: true, myRung: ['closed-off', 'exclusive', 'official'] }, turns: [
        ['a', "I've closed off with {pa}. You know that. Everyone knows that. So I need you to respect it, because right now it feels like you don't."],
        ['b', "I do respect it."],
        ['a', "Then stop asking me for chats."],
      ] },
    ],
    answer: [
      { when: { of: 'graceful', taken: true }, turns: [
        ['b', "Okay. That's fair. I had to try, you know? But I'm not going to be that person who doesn't take no for an answer. I hope it works out with {pa}. I mean that."],
        ['a', "Thank you. That actually means a lot."],
      ] },
      { when: { of: 'graceful' }, turns: [
        ['b', "I get it. Honestly, I'd rather know where I stand than keep hoping. No hard feelings."],
        ['a', "No hard feelings."],
        ['b', "Still friends?"],
        ['a', "Still friends."],
      ] },
      { when: { of: 'sore' }, turns: [
        ['b', "Fine. But don't sit there and act like you weren't enjoying it. You came on every chat I asked you for. You laughed at everything I said."],
        ['a', "Because I was being polite!"],
        ['b', "Polite. Right. Okay."],
      ] },
      { when: { of: 'sore', taken: true }, turns: [
        ['b', "Wow. Okay. You could have just said that the first time, instead of leading me on for two days."],
        ['a', "I didn't lead you on. I told you I was with {pa} from the start."],
        ['b', "Yeah, while you were smiling at me."],
      ] },
    ],
    close: [
      { when: { of: 'graceful' }, turns: [], beat: "They hug. {b} walks off first, and doesn't look back." },
      { when: { of: 'graceful', taken: true }, turns: [['b', "Go on. Go back to {pa}."]], beat: "{a} smiles, a little sadly, and goes." },
      { when: { of: 'sore' }, turns: [], beat: "{b} gets up and walks off without another word." },
      { when: { of: 'sore' }, turns: [['b', "Enjoy your perfect couple."]], beat: "{a} watches {b} go, and lets out a long breath." },
    ],
  },
  notes: [
    { stage: "{a} tells {b} to back off. {a} is with {pa}." },
  ],
});

export const GRAFT_TURN = build('graft-turn', {
  stages: [
    { stage: "{a} asks {b} for a chat on the roof terrace. {b} already knows something is wrong." },
  ],
  plans: {
    featured: ['open', 'say', 'react', 'push', 'close'],
    short: ['say', 'react', 'close'],
  },
  moves: {
    open: [
      { stage: "{a} sits {b} down on the end of their bed.", turns: [
        ['b', "You've been weird all day. What's going on?"],
        ['a', "I need to be honest with you about something, and I don't know how to start."],
        ['b', "Just start."],
      ] },
      { stage: "{a} finds {b} on the swing seat and sits down next to {b.obj}.", turns: [
        ['a', "Can we talk?"],
        ['b', "That's never good."],
        ['a', "No. It's probably not."],
      ] },
    ],
    say: [
      { turns: [
        ['a', "I want to get to know {c}. I've tried to ignore it. I've tried really hard, because you've been nothing but good to me. But I can't keep pretending I'm not interested, and I'd rather tell you myself than have you watch it happen."],
        ['b', "{c}."],
        ['a', "Yeah."],
      ] },
      { turns: [
        ['a', "My head's been turned. By {c}. I know how that sounds after everything we said to each other. But I'm not going to lie to you and carry on like everything's the same, because it isn't."],
        ['b', "How long have you felt like this?"],
        ['a', "A couple of days. Since the first chat."],
      ] },
    ],
    react: [
      { when: { of: 'angry' }, turns: [
        ['b', "Are you being serious right now? {c} has been after you since the second {c} walked in, and you've known it, and you let it happen. And now you're sitting here telling me like you're being brave?"],
        ['a', "I'm trying to be honest!"],
        ['b', "Honest would have been two days ago!"],
      ] },
      { when: { of: 'angry' }, turns: [
        ['b', "Wow. Wow. I defended you. When people said {c} was getting to you, I said no, not my {a}. I actually defended you."],
        ['a', "I know you did."],
        ['b', "And I look like an idiot now."],
      ] },
      { when: { of: 'hurt' }, turns: [
        ['b', "Okay. Okay. I knew it. I think I knew it before you even sat down. I just didn't want to be right."],
        ['a', "I'm so sorry."],
        ['b', "Don't. Please don't say sorry. It makes it worse."],
      ] },
      { when: { of: 'hurt' }, turns: [
        ['b', "I thought we were building something. I really did. I was telling everyone how happy I was."],
        ['a', "You did make me happy."],
        ['b', "Just not happy enough."],
      ] },
      { when: { of: 'calm' }, turns: [
        ['b', "Right. Thank you for telling me. I mean it. I'd much rather hear it from you."],
        ['a', "You're not angry?"],
        ['b', "I'm a lot of things. But I'm not going to scream at you on a swing seat. That's not who I am."],
      ] },
    ],
    push: [
      { turns: [
        ['b', "So what happens now? Do I just sit next to you at dinner and watch you flirt with {c}?"],
        ['a', "I don't know. I don't want to hurt you any more than I already have."],
        ['b', "Bit late for that."],
      ] },
      { turns: [
        ['b', "Is there anything I could have done?"],
        ['a', "No. Honestly, no. It's not about anything you did. This isn't about you."],
        ['b', "It feels like it's about me."],
      ] },
    ],
    close: [
      { when: { of: 'angry' }, turns: [['b', "Do whatever you want. You're going to anyway."]], beat: "{b} storms off down the stairs, and the whole villa goes quiet as {b} passes." },
      { when: { of: 'hurt' }, turns: [], beat: "{b} gets up and goes into the dressing room. A few seconds later, two of {b.posAdj} friends follow." },
      { when: { of: 'hurt' }, turns: [['b', "I need to be on my own for a bit."]], beat: "{a} sits on the swing seat alone, staring at the floor." },
      { when: { of: 'calm' }, turns: [['b', "Go and talk to {c}, then. Just don't do it in front of me tonight."], ['a', "I won't."]], beat: "{b} squeezes {a}'s hand once, and walks away." },
    ],
  },
  notes: [
    { stage: "{a} tells {b} that {a.posAdj} head has been turned by {c}." },
  ],
});
