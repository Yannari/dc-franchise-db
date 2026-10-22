// ══════════════════════════════════════════════════════════════════════
// pm/talk/advice.js — {b} asks {a}, a friend, what {a} thinks of {c}
// ══════════════════════════════════════════════════════════════════════
//
// {c} is {b}'s partner. What {a} says is {a}'s real read of {c}, the engine's
// (`verdict`: good · bad · unsure), and it moves {b} (villa-day.js advice).
//   open     they find a quiet spot
//   ask      {b} asks
//   verdict  {a}'s honest read — the long turn
//   push     {b} pushes back, or agrees
//   close    how they leave it
import { build } from './build.js';

export const ADVICE = build('advice', {
  stages: [
    { stage: "{a} and {b} sit together on the edge of the pool." },
    { stage: "{b} finds {a} in the dressing room." },
    { stage: "{a} and {b} sit on the swing seat." },
  ],
  plans: {
    featured: ['open', 'ask', 'verdict', 'push?', 'close'],
    short: ['ask', 'verdict'],
  },
  moves: {
    open: [
      { stage: "{a} and {b} sit together on the edge of the pool.", turns: [
        ['b', "Can I ask you something, and you'll be honest with me?"],
        ['a', "Always. You know I will."],
      ] },
      { stage: "{b} finds {a} in the dressing room.", turns: [
        ['b', "Have you got five minutes? I need your opinion on something."],
        ['a', "My opinion's free. Sit down."],
      ] },
      { stage: "{a} and {b} sit on the terrace with a cup of tea each.", turns: [
        ['a', "Go on. You've had that face on all morning. What's going on?"],
        ['b', "Is it that obvious?"],
        ['a', "To me it is."],
      ] },
      { when: { phase: 'evening' }, stage: "{a} and {b} sit by the fire pit after the others have gone in.", turns: [
        ['b', "Can I talk to you about something before bed?"],
        ['a', "Of course. What's up?"],
      ] },
    ],
    ask: [
      { turns: [
        ['b', "What do you actually think of {c}? Not the nice answer. The real one. I feel like everyone tells me what I want to hear, and I need someone to just be straight with me."],
        ['a', "You want the real one?"],
        ['b', "I want the real one."],
      ] },
      { turns: [
        ['b', "Do you think {c} is right for me? Like, honestly. You know me better than anyone in here."],
        ['a', "That's a big question."],
        ['b', "I know. That's why I'm asking you."],
      ] },
      { turns: [
        ['b', "I keep going back and forth about {c}. One day I think it's amazing, the next day I don't know. And I can't tell if it's {c} or if it's me. What do you see, from the outside?"],
        ['a', "From the outside?"],
        ['b', "From the outside."],
      ] },
      { turns: [
        ['b', "Be honest. Am I mad for being with {c}?"],
        ['a', "Why would you be mad?"],
        ['b', "I don't know. People keep giving me looks."],
      ] },
    ],
    verdict: [
      { when: { verdict: 'good' }, turns: [
        ['a', "Honestly? I think {c} is really good for you. I've watched {c} with you, and {c} looks at you like you're the only person in the villa. And you're calmer since you've been together. You don't spiral like you used to. That counts for a lot."],
        ['b', "Do you really think so?"],
        ['a', "I wouldn't say it if I didn't."],
      ] },
      { when: { verdict: 'good' }, turns: [
        ['a', "I'll be straight with you. When you two first got together, I wasn't sure. But {c}'s proved me wrong. Every time something's kicked off, {c}'s been there for you. That's the person you want."],
        ['b', "That actually means a lot, coming from you."],
      ] },
      { when: { verdict: 'good' }, turns: [
        ['a', "Can I tell you what I see? I see you laughing more. I see you not checking where {c} is every five minutes, because you don't need to. That's what a good one looks like. Don't overthink it."],
        ['b', "I always overthink it."],
        ['a', "I know. Stop it."],
      ] },
      { when: { verdict: 'bad' }, turns: [
        ['a', "Okay, the real answer. I don't think {c} is as into it as you are. I've seen {c} looking round when you're not there. I've seen {c} light up for other people in a way {c} doesn't for you. I'm sorry. I'd rather you heard it from me."],
        ['b', "You think so?"],
        ['a', "I think you think so too, or you wouldn't be asking."],
      ] },
      { when: { verdict: 'bad' }, turns: [
        ['a', "Honestly? I think you deserve more. You give everything, and I don't see {c} giving it back. You shouldn't have to work this hard to feel wanted."],
        ['b', "That's hard to hear."],
        ['a', "I know it is. I'm sorry."],
      ] },
      { when: { verdict: 'bad' }, turns: [
        ['a', "I don't trust {c}. There, I've said it. I can't put my finger on it, but something about how {c} talks to everyone else, and then talks to you, doesn't add up. Just keep your eyes open."],
        ['b', "You're scaring me."],
        ['a', "I'm not trying to scare you. I'm trying to look after you."],
      ] },
      { when: { verdict: 'unsure' }, turns: [
        ['a', "Honestly? I don't know yet. {c}'s lovely, I like {c}, but I don't feel like I've seen the real {c}. I don't know if you have either. I'd give it a bit more time before you put all your eggs in that basket."],
        ['b', "That's fair. That's actually really fair."],
      ] },
      { when: { verdict: 'unsure' }, turns: [
        ['a', "I can't tell you if {c} is right for you. Only you know that. But I can tell you that if you're asking me, there's a reason you're asking. Listen to that."],
        ['b', "So you think there's something wrong?"],
        ['a', "I think there's a question. That's not the same thing."],
      ] },
      { when: { verdict: 'unsure' }, turns: [
        ['a', "I like you two together. I just don't know if I love you two together, if that makes sense. It's nice. I want more than nice for you."],
        ['b', "More than nice."],
        ['a', "You deserve more than nice."],
      ] },
    ],
    push: [
      { when: { verdict: 'good' }, turns: [
        ['b', "So I should stop worrying."],
        ['a', "You should stop worrying and enjoy it. How often do you find someone who actually makes you happy? Don't ruin it by looking for the catch."],
      ] },
      { when: { verdict: 'bad' }, turns: [
        ['b', "But we're happy. Mostly. We have a really good time together."],
        ['a', "Having a good time and being happy aren't the same. I'm not telling you what to do. I'm just telling you what I see."],
        ['b', "I'll think about it."],
      ] },
      { when: { verdict: 'unsure' }, turns: [
        ['b', "How do I know, then? How am I meant to know?"],
        ['a', "You'll know. Honestly. When it's right, you won't have to ask anyone."],
      ] },
      { turns: [
        ['b', "Don't tell anyone I asked, will you?"],
        ['a', "Of course not. This stays between us."],
      ] },
    ],
    close: [
      { turns: [['b', "Thank you. I mean it. I needed that."], ['a', "Come here."]], beat: "They hug." },
      { when: { verdict: 'good' }, turns: [], beat: "{b} goes back to {c}, looking a lot lighter." },
      { when: { verdict: 'bad' }, turns: [], beat: "{b} sits there a long time after {a} has gone, watching {c} across the garden." },
      { when: { verdict: 'unsure' }, turns: [['b', "I'm going to have a think."], ['a', "Good. Have a think."]] },
    ],
  },
  notes: [
    { when: { verdict: 'good' }, stage: "{a} tells {b} that {c} is good for {b.obj}." },
    { when: { verdict: 'bad' }, stage: "{a} tells {b} some hard truths about {c}." },
    { when: { verdict: 'unsure' }, stage: "{b} asks {a} about {c}. {a} isn't sure yet." },
  ],
});
