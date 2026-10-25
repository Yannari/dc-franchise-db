// ══════════════════════════════════════════════════════════════════════
// pm/talk/secret-burden.js — {a} saw what {c} did behind {d}'s back
// ══════════════════════════════════════════════════════════════════════
//
// A secret's first beat (pm/threads.js): {a} is carrying something about
// {c}, who is coupled with {d}, and tells a friend, {b} (who now knows too).
// `sec` is what {a} saw: pull (a chat with someone else that went on and on),
// kiss, promise (plans for the outside with someone else). `of` is {b}'s
// advice: tell · leave. What happens next is the telling (talk/gossip.js).
//   open    {a} can't hold it in
//   say     what {a} saw
//   react   {b} takes it in
//   advice  tell {d}, or stay out of it
//   close   how they leave it
import { build } from './build.js';

export const SECRET_BURDEN = build('secret-burden', {
  stages: [
    { stage: "{a} and {b} are on their own in the dressing room." },
  ],
  plans: {
    featured: ['open', 'say', 'react', 'advice', 'close'],
    short: ['say', 'advice'],
  },
  moves: {
    open: [
      { stage: "{a} pulls {b} into the bathroom and locks the door.", turns: [
        ['b', "Why are we in the bathroom?"],
        ['a', "Because it's the only room in this villa with a lock. I need to tell you something and I need you to not react."],
        ['b', "Now I'm definitely going to react."],
      ] },
      { stage: "{a} and {b} are in the kitchen. {a} has been stirring the same pot for a long time.", turns: [
        ['b', "That's not going to cook any faster."],
        ['a', "Can I tell you something? I've been holding it in and I think I'm going to explode."],
        ['b', "Go on."],
      ] },
      { stage: "{a} sits down heavily next to {b} on the end of the bed.", turns: [
        ['b', "What's that face for?"],
        ['a', "I saw something. And now I can't unsee it."],
      ] },
    ],
    say: [
      { when: { sec: 'kiss', hasWith: true }, turns: [
        ['a', "I saw {c} kiss {about}. Not {d}. {about}. I was going to get my sunglasses, and I came round the corner, and there they were. They didn't see me. I just turned round and walked straight back out."],
        ['b', "Stop it. Are you sure?"],
        ['a', "I'm sure. I know what a kiss looks like."],
      ] },
      { when: { sec: 'kiss', hasWith: true }, turns: [
        ['a', "Okay. You know how {c} and {d} are supposed to be really solid? I saw {c} kissing {about}. Earlier, when everyone was by the pool."],
        ['b', "No."],
        ['a', "Yes. And I've been sitting at dinner with {d} pretending everything's normal."],
      ] },
      { when: { sec: 'promise', hasWith: true }, turns: [
        ['a', "So I overheard {c} in a chat with {about}. Not {d}. {about}. And they were talking about the outside. Like, going on holiday together, meeting each other's families. That kind of chat."],
        ['b', "That's not just a flirt, then."],
        ['a', "No. That's plans."],
      ] },
      { when: { sec: 'pull', hasWith: true }, turns: [
        ['a', "{c} was off with {about} for ages earlier. Like, a really long one, and when I walked past they went quiet. {c} looked at me like I'd caught them doing something."],
        ['b', "Maybe it was just a chat?"],
        ['a', "Maybe. But if it was just a chat, why did they stop talking?"],
      ] },
    ],
    react: [
      { turns: [
        ['b', "Oh my God. Poor {d}. Does {d} have any idea?"],
        ['a', "None. {d} was telling me this morning how happy {d} is."],
        ['b', "Oh, that makes it so much worse."],
      ] },
      { turns: [
        ['b', "Right. Okay. I'm not going to lie, I'm not even that surprised. {c} has been a bit off for a few days."],
        ['a', "Have you noticed it too?"],
        ['b', "I've noticed something. I just thought I was being paranoid."],
      ] },
      { turns: [
        ['b', "Why are you telling me this? Now I know as well. Now I have to sit at dinner with it too."],
        ['a', "Because I can't carry it on my own any more. I needed someone to tell me what to do."],
      ] },
    ],
    advice: [
      { when: { of: 'tell' }, turns: [
        ['b', "You have to tell {d}. You have to. If it was you, you'd want to know. And if {d} finds out later that you knew all along and said nothing, {d} is going to be more upset with you than with {c}."],
        ['a', "I know. I know you're right. I just don't want to be the one who blows it all up."],
        ['b', "You didn't blow it up. {c} did."],
      ] },
      { when: { of: 'tell' }, turns: [
        ['b', "Honestly? I'd tell {d}. Today. Before it comes out some other way. Things always come out in here."],
        ['a', "What if {d} doesn't believe me?"],
        ['b', "Then at least you've done the right thing."],
      ] },
      { when: { of: 'leave' }, turns: [
        ['b', "I'd stay out of it. Honestly. It's not your relationship. And you know what happens to the messenger in here. Everyone ends up hating the person who told."],
        ['a', "So I just say nothing?"],
        ['b', "You let {c} sort out {c.posAdj} own mess. If it comes out, it comes out."],
      ] },
      { when: { of: 'leave' }, turns: [
        ['b', "Wait. Just wait a day. See if {c} says something to {d}. If {c} doesn't, then you think about it."],
        ['a', "And if I wait and it comes out, and {d} finds out I knew?"],
        ['b', "That's the risk. I'm not saying it's easy."],
      ] },
    ],
    close: [
      { turns: [['a', "This place, honestly."], ['b', "I know."]], beat: "They both sit there in silence for a moment." },
      { turns: [['b', "Whatever you do, I've got your back."], ['a', "Thank you. I think I'm going to need it."]] },
      { turns: [], beat: "{a} takes a deep breath, and puts a smile back on before going back out." },
    ],
  },
  notes: [
    { stage: "{a} tells {b} what {a} saw {c} doing behind {d}'s back." },
  ],
});
