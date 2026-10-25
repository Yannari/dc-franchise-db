// ══════════════════════════════════════════════════════════════════════
// pm/talk/doubt-end.js — the day after the talk: {a} decides about {b}
// ══════════════════════════════════════════════════════════════════════
//
// The end of a doubt (pm/threads.js): {a} has been going off {b}, they had
// it out yesterday, and today {a} says where it lands. `of`:
//   recommit  {a} wants to give it a real go
//   friends   {a} is ending it: better as friends
//   open    {a} finds {b}
//   say     what {a} has decided — the long turn
//   answer  how {b} takes it
//   close   how they leave it
import { build } from './build.js';

export const DOUBT_END = build('doubt-end', {
  stages: [
    { stage: "{a} sits down next to {b} on the swing seat, and this time {a} is the one who asked for the chat." },
  ],
  plans: {
    featured: ['open', 'say', 'answer', 'close'],
    short: ['say', 'answer'],
  },
  moves: {
    open: [
      { stage: "{a} finds {b} by the pool and asks if they can talk. {b} gets up straight away.", turns: [
        ['b', "Is this the chat?"],
        ['a', "It's a chat. I've been thinking about what we said yesterday. All night, basically."],
        ['b', "Me too."],
      ] },
      { stage: "{a} brings {b} a drink and sits down next to {b.obj} on the daybed.", turns: [
        ['b', "A drink. That's either really good or really bad."],
        ['a', "Just listen, okay? I've worked out what I want to say."],
      ] },
    ],
    say: [
      { when: { of: 'recommit' }, turns: [
        ['a', "I'm sorry I've been so in my head. I lay there last night and I thought about what it would be like if I woke up tomorrow and you'd moved on. And I hated it. Really hated it. So I want to give this a real go. Not half in. All of it."],
        ['b', "Do you mean that? Because I can't do the last few days again."],
        ['a', "I mean it. You won't have to."],
      ] },
      { when: { of: 'recommit' }, turns: [
        ['a', "I think I got scared. Things were going well, and that scared me, because in here it never lasts. So I pulled away before it could go wrong. Which is stupid, because pulling away was the thing that made it go wrong."],
        ['b', "That's actually really honest."],
        ['a', "I'm trying. I want to be better at this. With you."],
      ] },
      { when: { of: 'friends' }, turns: [
        ['a', "I don't think it's there for me. I've tried. I really have. I wanted it to be there, because you're one of the best people in this villa, and you deserve someone who looks at you the way you look at me. And I don't. I'm so sorry."],
        ['b', "So that's it, then."],
        ['a', "I'd really like us to still be friends. I know that sounds like a line. It's not."],
      ] },
      { when: { of: 'friends' }, turns: [
        ['a', "I'm not going to drag this out, because you deserve better than that. I think we're better as friends. I've known for a couple of days, and I've been too scared to say it."],
        ['b', "A couple of days."],
        ['a', "I know. I should have said it sooner. That's on me."],
      ] },
    ],
    answer: [
      { when: { of: 'recommit' }, turns: [
        ['b', "Okay. Okay. Then I'm in too. But you have to talk to me. If you're feeling something, you tell me, before it turns into days of silence."],
        ['a', "Deal. No more silence."],
        ['b', "No more silence."],
      ] },
      { when: { of: 'recommit' }, turns: [
        ['b', "I didn't want to say it yesterday, but I thought I was losing you. I really did. I've been sick about it."],
        ['a', "You're not losing me."],
        ['b', "Then come here."],
      ] },
      { when: { of: 'friends' }, turns: [
        ['b', "I'm not going to pretend I'm fine. I'm not. I really liked you. I thought we were going somewhere. But I'd rather know than keep hoping."],
        ['a', "I'm sorry."],
        ['b', "Stop saying sorry. Just give me a bit of space, yeah?"],
      ] },
      { when: { of: 'friends' }, turns: [
        ['b', "Friends. Right. I've got enough friends in here. I didn't come in for friends."],
        ['a', "I know you didn't."],
        ['b', "Then don't expect me to sit next to you at dinner tonight and laugh at your jokes."],
      ] },
    ],
    close: [
      { when: { of: 'recommit' }, turns: [], beat: "They kiss, a real one, for the first time in days, and somebody on the daybeds starts clapping." },
      { when: { of: 'recommit' }, turns: [['a', "Come on. Let's go and annoy everyone by being happy."]], beat: "{b} laughs, and lets {a} pull {b.obj} up off the swing seat." },
      { when: { of: 'friends' }, turns: [], beat: "{b} gets up and walks back into the villa. {a} stays where {a} is for a long time." },
      { when: { of: 'friends' }, turns: [['b', "I'm going to go and find the others."]], beat: "{a} nods, and watches {b} go." },
    ],
  },
  notes: [
    { stage: "{a} tells {b} where {a} has landed, after yesterday's talk." },
  ],
});
