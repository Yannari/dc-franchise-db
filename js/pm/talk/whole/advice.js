// pm/talk/whole/advice.js — {b} asks {a}, a friend, what {a} really thinks of
// {c}, {b}'s partner. One talk, start to finish (pm/script.js talkScript
// `whole`), in their own voices (whole/voice.js). What {a} says is {a}'s real
// read of {c}, the engine's (`verdict`: good · bad · unsure), and it moves {b}.
import { say } from './voice.js';

const SHORT = ['short', 'note'];

export const ADVICE_WHOLE = { moves: { whole: [
  // ── good ──
  { when: { verdict: 'good' }, stage: "{a} and {b} sit together on the edge of the pool.", turns: [
    ['b', "Can I ask you something, and you have to be honest? What do you think of {c}?"],
    say('a', "Honestly? I think {c} is really good for you.", { lad: "Honestly, {~bro}? {c} is a good one. I like {c.obj}.", bestie: "Babe. Honestly? I love {c} for you." }),
    ['b', "Really? You're not just saying that?"],
    ['a', "I'm not. You're calmer with {c}. You laugh more."],
    say('b', "I didn't know anyone else could see it.", { nervy: "I keep waiting for something to go wrong." }),
    ['a', "Everyone can see it."],
  ], beat: "{b} smiles, and looks over at {c}." },
  { when: { verdict: 'good' }, stage: "{b} finds {a} in the dressing room.", turns: [
    ['b', "Be straight with me. Is {c} the real thing?"],
    ['a', "I think so. {c} looks at you like there's nobody else here."],
    ['b', "You'd tell me if you thought otherwise?"],
    ['a', "In a heartbeat. I'm not telling you."],
  ], beat: "{b} hugs {a}, and goes off to find {c}." },
  { when: { verdict: 'good', tier: SHORT }, stage: "{a} and {b} sit on the swing seat.", turns: [
    ['b', "What do you think of me and {c}?"],
    ['a', "I think you're great together. Honestly."],
  ], beat: "{b} beams." },
  // ── bad ──
  { when: { verdict: 'bad' }, stage: "{a} and {b} sit together on the edge of the pool.", turns: [
    ['b', "What do you really think of {c}? And don't be nice about it."],
    ['a', "Do you actually want to know?"],
    ['b', "Yes."],
    say('a', "I don't trust {c}. I don't think {c.he} is as into you as you are into {c.obj}.", {
      sharp: "I don't trust {c}. I think {c.he}'s keeping {c.posAdj} options open, and you deserve better.",
      soft: "I'm sorry. I just don't think {c.he} treats you the way you deserve to be treated.",
      lad: "Honestly? I don't trust {c}, {~bro}. Something's off.",
    }),
    ['b', "Why didn't you say anything before?"],
    ['a', "Because you looked happy. I didn't want to be the one to ruin it."],
  ], beat: "{b} goes quiet, and doesn't look at {c} for the rest of the day." },
  { when: { verdict: 'bad' }, stage: "{b} finds {a} in the dressing room.", turns: [
    ['b', "Do you like {c}? Like, as a person?"],
    ['a', "Can I be honest?"],
    ['b', "That's a no, then."],
    ['a', "It's not a no. I just don't think {c} is the one for you."],
    say('b', "That's not what I wanted to hear.", { sharp: "Well, it's not your choice." }),
    ['a', "I know. I'd rather be honest than nice."],
  ], beat: "{b} leaves without saying anything else." },
  { when: { verdict: 'bad', tier: SHORT }, stage: "{a} and {b} sit on the swing seat.", turns: [
    ['b', "Do you think {c} is right for me?"],
    ['a', "Honestly? No. I'm sorry."],
  ], beat: "{b} looks away." },
  // ── unsure ──
  { when: { verdict: 'unsure' }, stage: "{a} and {b} sit together on the edge of the pool.", turns: [
    ['b', "What do you make of {c}? Honestly."],
    say('a', "I don't know {c.obj} well enough yet. I can't tell what {c.he}'s thinking.", { dry: "Honestly? I can't read {c.obj}. And I can read most people." }),
    ['b', "That's what worries me. Neither can I."],
    ['a', "Then ask {c.obj}. Don't wait for me to work it out."],
  ], beat: "{b} nods slowly, and looks over at {c}." },
  { when: { verdict: 'unsure' }, stage: "{b} finds {a} in the dressing room.", turns: [
    ['b', "Do you think {c} actually likes me?"],
    ['a', "I think so. Most days."],
    ['b', "Most days?"],
    say('a', "Some days {c.he}'s all over you, and some days {c.he}'s somewhere else. I don't know what that means.", { soft: "I'm not sure. I don't want to say the wrong thing." }),
    ['b', "Neither do I."],
  ], beat: "They sit there, both looking at {c} across the garden." },
  { when: { verdict: 'unsure', tier: SHORT }, stage: "{a} and {b} sit on the swing seat.", turns: [
    ['b', "What do you think of {c}?"],
    ['a', "I can't work {c.obj} out yet."],
  ], beat: "{b} nods. Neither can {b.he}." },
  // ── more of each (season read: the advice pool was three a verdict) ──
  { when: { verdict: 'good' }, stage: "{a} and {b} are lying on the sunbeds.", turns: [
    ['b', "Can I ask you something? Do you like {c}?"],
    ['a', "I do. Why?"],
    ['b', "Because I really like {c}, and I want my friends to as well."],
    say('a', "Then you can stop worrying. {c} is lovely to you, and lovely to everyone else.", { lad: "Then stop worrying, {~bro}. {c} is great with everyone." }),
    ['b', "That means a lot."],
  ], beat: "{b} relaxes back onto the sunbed, smiling." },
  { when: { verdict: 'good' }, stage: "{a} and {b} are making drinks in the kitchen.", turns: [
    ['b', "Do you think I'm mad, getting this into {c} this fast?"],
    say('a', "No. I think you've found someone who's actually into you. That's not mad.", { bestie: "Babe, no. You've found someone who's into you. Enjoy it." }),
    ['b', "I keep waiting for it to go wrong."],
    ['a', "Then stop waiting. It's going right."],
  ], beat: "{b} laughs, and takes the drinks out to {c}." },
  { when: { verdict: 'bad' }, stage: "{a} and {b} are lying on the sunbeds.", turns: [
    ['b', "You've gone quiet every time I mention {c}. Why?"],
    ['a', "Because I don't want to fall out with you."],
    ['b', "You won't. Just tell me."],
    say('a', "I've seen how {c} is when you're not around. It's not the same person.", { soft: "I just worry about you. {c} is different when you're not there." }),
    say('b', "Different how?", { sharp: "Different how? Say it." }),
    ['a', "Less interested. That's all I'm going to say."],
  ], beat: "{b} looks over at {c}, and keeps looking." },
  { when: { verdict: 'bad' }, stage: "{a} and {b} are making drinks in the kitchen.", turns: [
    ['b', "Be honest. Would you be with {c}?"],
    ['a', "No."],
    ['b', "Why not?"],
    say('a', "Because I don't think {c} would ever put you first.", { lad: "Because I don't think {c} would ever put you first, {~bro}." }),
    ['b', "You don't know {c} like I do."],
    ['a', "Maybe not. You asked."],
  ], beat: "{b} picks up the drinks and walks off without another word." },
  { when: { verdict: 'unsure' }, stage: "{a} and {b} are lying on the sunbeds.", turns: [
    ['b', "What's your honest opinion of {c}?"],
    ['a', "I haven't made my mind up yet."],
    ['b', "That's not very reassuring."],
    say('a', "It's not meant to be bad. I just haven't seen enough of {c.obj} yet.", { dry: "It's not bad. It's just not finished." }),
    ['b', "Then watch, and tell me."],
  ], beat: "{a} promises to keep an eye out, and means it." },
  { when: { verdict: 'unsure' }, stage: "{a} and {b} are making drinks in the kitchen.", turns: [
    ['b', "Can I ask you about {c}?"],
    ['a', "Go on."],
    ['b', "Is it just me, or is {c} hard to read?"],
    say('a', "It's not just you. One minute {c.he}'s really warm, and the next {c.he}'s miles away.", { soft: "It's not just you. I don't think {c.he} means anything by it. But it's not just you." }),
    ['b', "So what do I do?"],
    ['a', "Ask {c.obj} where {c.posAdj} head's at. It's the only way to know."],
  ], beat: "{b} carries the drinks out, and goes looking for {c}." },
] } };
