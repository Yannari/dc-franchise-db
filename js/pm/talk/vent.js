// ══════════════════════════════════════════════════════════════════════
// pm/talk/vent.js — {a} has a moan about {pa} to {b}, a friend
// ══════════════════════════════════════════════════════════════════════
//
// Said out loud, in front of a witness: it can travel (events.js vent makes it
// a secret {b} holds). `myRung` is how far {a} and {pa} have come.
//   open      they find a quiet spot
//   moan      what's getting to {a} — the long turn
//   answer    what {b} says
//   close     how they leave it
import { build } from './build.js';

export const VENT = build('vent', {
  stages: [
    { stage: "{a} sits down next to {b} on the daybed and lets out a long sigh." },
    { stage: "{a} and {b} are doing the washing-up together." },
    { stage: "{a} and {b} are on their own in the dressing room." },
  ],
  plans: {
    featured: ['open', 'moan', 'answer', 'close'],
    short: ['moan', 'answer'],
  },
  moves: {
    open: [
      { stage: "{a} flops down next to {b} on the daybed and groans.", turns: [
        ['b', "What's that noise for?"],
        ['a', "Don't. I need to moan, and you're the only one I can moan to."],
        ['b', "Go on, then. Moan."],
      ] },
      { stage: "{a} drags {b} into the dressing room and shuts the door.", turns: [
        ['b', "What's happened?"],
        ['a', "Nothing's happened. That's sort of the problem."],
      ] },
      { stage: "{a} and {b} do the washing-up together, and {a} is scrubbing very hard.", turns: [
        ['b', "That pan's clean. You've been scrubbing it for five minutes."],
        ['a', "I'm taking it out on the pan."],
        ['b', "Taking what out on the pan?"],
      ] },
    ],
    moan: [
      { turns: [
        ['a', "It's {pa}. I just feel like it's the same chat every single day. What did you have for breakfast, how was the sun, are you all right. I want someone to surprise me, and {pa} never surprises me. I'm bored. Is that awful? That's awful, isn't it?"],
        ['b', "It's not awful. It's honest."],
      ] },
      { turns: [
        ['a', "Can I be honest? {pa} is starting to do my head in. Everything I say, {pa} has to have an opinion on. Everything I do, {pa} wants to know about. I can't breathe. I came in here to meet someone, not to get a shadow."],
        ['b', "A shadow. Wow."],
        ['a', "I know. I'd never say it to {pa}'s face."],
      ] },
      { turns: [
        ['a', "I don't think {pa} actually listens to me. I'll be telling a story, and I can see {pa} just waiting for me to finish so {pa} can talk. It's like having a conversation with a wall that nods."],
        ['b', "A wall that nods."],
        ['a', "A very good-looking wall. But still a wall."],
      ] },
      { turns: [
        ['a', "I'm not saying I don't like {pa}. I do. I just don't know if I like {pa} enough. And every day we're together, it gets harder to say that, because everyone's already decided we're a couple."],
        ['b', "You are a couple."],
        ['a', "On paper."],
      ] },
      { when: { myRung: ['closed-off', 'exclusive', 'official'] }, turns: [
        ['a', "I closed off with {pa}, and I meant it at the time. But now I'm sitting here thinking, did I rush it? Did I just panic because everyone else was doing it? I don't want to be with someone because it's easier than not."],
        ['b', "That's a big thing to say."],
        ['a', "I know. Please don't repeat it."],
      ] },
      { turns: [
        ['a', "{pa} is so clingy. I went to get a drink, and {pa} followed me. To the kitchen. Ten steps. I'm not going anywhere. I'm in a villa. Where am I going to go?"],
        ['b', "Maybe {pa} just likes being near you."],
        ['a', "Maybe {pa} could like being near me from a bit further away."],
      ] },
    ],
    answer: [
      { turns: [
        ['b', "Look, you have to say something to {pa}, or you're going to end up resenting it. And then it'll come out at the worst possible moment, like at a recoupling, in front of everyone."],
        ['a', "You're right. I know you're right."],
      ] },
      { turns: [
        ['b', "I hear you. I do. But are you sure it's {pa}, and not just this place? Everyone gets fed up in here. You're with someone every minute of every day."],
        ['a', "Maybe. I don't know. Maybe it's both."],
      ] },
      { turns: [
        ['b', "Honestly? If you're feeling like this already, it's not a good sign. I'm not saying end it. I'm saying be honest with yourself."],
        ['a', "That's the scary bit."],
      ] },
      { turns: [
        ['b', "I'm not going to say anything, but you need to be careful who else you say this to. If it gets back to {pa}, it's going to be a whole thing."],
        ['a', "I know. That's why I'm only saying it to you."],
      ] },
    ],
    close: [
      { turns: [['a', "Thanks for listening. I feel better for saying it."], ['b', "Any time."]] },
      { turns: [], beat: "{a} goes back out to {pa}, all smiles, as if nothing was said." },
      { turns: [['b', "Go on. Go and be nice to {pa}."], ['a', "I'm always nice."], ['b', "Go and be nicer."]] },
    ],
  },
  notes: [
    { stage: "{a} has a moan about {pa} to {b} in the dressing room." },
    { stage: "{a} vents to {b} about {pa}, a little too loudly." },
  ],
});
