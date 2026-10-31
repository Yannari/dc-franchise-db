// pm/talk/whole/arrival.js — the first chat after {a} walks in (pm/moments.js
// arrivals): {b} (and {c}) were already here. One talk, start to finish
// (pm/script.js talkScript `whole`), in their own voices (whole/voice.js). The
// stitched one went from nerves to "First what?" to "everyone's watching
// everyone": three subjects in one chat. Each of these keeps to its own.
//   of  nerves · looking (what {a} is here for; intent) · compliment · type ·
//       same-type (they like the same kind of person) · clash
import { say } from './voice.js';

const C3 = { cast: 3 };

export const ARRIVAL_CHAT_WHOLE = { moves: { whole: [
  // ── nerves ──
  { when: { of: 'nerves' }, stage: "{a} sits down next to {b} on the terrace, drink in hand, and lets out a long breath.", turns: [
    ['b', "Are you as nervous as I am?"],
    say('a', "More. My hands haven't stopped shaking since the car. Look.", { lad: "Honestly, {~bro}? I'm shaking. Don't tell anyone." }),
    ['b', "Mine too. I nearly asked the driver to take me home."],
    ['a', "I'm glad it's not just me. Everyone else looks so calm."],
    ['b', "They're not. They're just better at hiding it."],
  ], beat: "They clink glasses, and the night feels a little easier." },
  { when: { of: 'nerves' }, stage: "{a} sits down next to {b} on the daybeds, still holding {a.posAdj} bag.", turns: [
    ['a', "I had a whole speech planned for when I walked in, and it's gone. Completely gone."],
    ['b', "Same. I practised in the mirror and everything."],
    say('a', "I just don't want to say something stupid on the first night.", { nervy: "What if I say something stupid and that's what everyone remembers about me?" }),
    ['b', "You won't. And if you do, I'll say something worse straight after."],
  ], beat: "{a} laughs, and finally puts the bag down." },
  { when: { of: 'nerves', ...C3 }, stage: "{a} sits down with {b} and {c} on the daybeds.", turns: [
    ['a', "Please tell me you two are nervous as well. I need to hear it."],
    ['b', "Terrified."],
    ['c', "I've been to the bathroom three times already, and I don't even need to go."],
    ['a', "Thank you. I feel so much better."],
  ], beat: "The three of them laugh, and the nerves go a little." },
  // ── what are you here for ──
  { when: { of: 'looking', intent: 'love' }, stage: "{a} sits down next to {b} on the terrace.", turns: [
    ['b', "So what are you actually here for? And don't say to have fun. Everyone says that."],
    say('a', "Honestly? I want to meet someone I'd still like in a year. I'm tired of things that fizzle out after a month.", { romantic: "I want to fall in love. Properly. I know that sounds a lot for the first night." }),
    ['b', "That's a really good answer."],
    ['a', "What's yours?"],
    ['b', "The same, really. I'm just more scared to say it."],
  ], beat: "They look at each other for a second, and both smile." },
  { when: { of: 'looking', intent: ['fun', 'fame', 'stir', 'money', 'win'] }, stage: "{a} sits down next to {b} on the terrace.", turns: [
    ['b', "So what are you actually here for?"],
    say('a', "A good time. If love turns up, it's welcome. But I'm not going to chase it.", { lad: "A good summer, {~bro}. If I meet someone, great. If not, I'll still have a laugh." }),
    ['b', "I like that you're honest about it."],
    ['a', "No point pretending. Everyone finds out what you're like in here."],
  ], beat: "{b} raises a glass to that, and so does {a}." },
  { when: { of: 'looking' }, stage: "{a} sits down next to {b} on the daybeds.", turns: [
    ['b', "What are you looking for in here?"],
    ['a', "Someone who makes me laugh. I can put up with a lot if someone makes me laugh."],
    ['b', "Have you seen anyone yet?"],
    ['a', "Maybe. It's too early to say."],
  ], beat: "{a} glances across the terrace, and {b} follows the look." },
  // ── a compliment ──
  { when: { of: 'compliment' }, stage: "{a} has barely sat down when {b} leans over.", turns: [
    ['b', "Can I just say, you walked down those steps like you'd done it a hundred times."],
    say('a', "Stop. I was terrified. I was holding the rail the whole way down.", { bestie: "Babe, no. I was holding on to that rail for my life." }),
    ['b', "Well, it didn't look like it. You looked amazing."],
    ['a', "Thank you. Honestly, that's made my night. And you look incredible, by the way."],
  ], beat: "They both laugh, and it helps." },
  // ── your type ──
  { when: { of: 'type' }, stage: "{a} sits down next to {b} on the daybeds.", turns: [
    ['b', "First question, the important one. What's your type?"],
    say('a', "I always say tall and funny, and then I end up with someone who's neither. So I'm keeping an open mind.", { lad: "Honestly? Someone who doesn't take themselves too seriously. That's it." }),
    ['b', "Do you see anyone like that here?"],
    ['a', "I've only been here ten minutes. Ask me tomorrow."],
  ], beat: "{b} laughs, and promises to ask tomorrow." },
  { when: { of: 'type' }, stage: "{a} sits down next to {b} on the terrace.", turns: [
    ['b', "Go on, then. What's your type?"],
    ['a', "Confident, but kind. I've been with too many people who were only one of those."],
    ['b', "That's a good answer. Has anyone caught your eye?"],
    ['a', "Maybe. I'm not saying who on the first night."],
  ], beat: "{a} looks round the terrace, and doesn't give anything away." },
  // ── the same type ──
  { when: { of: 'same-type' }, stage: "{a} sits down next to {b} on the daybeds.", turns: [
    ['b', "Who's caught your eye, then? You've been looking round since you walked in."],
    ['a', "You go first."],
    ['b', "Okay. I'll say it if you say it."],
    ['a', "I think we might like the same kind of person."],
    say('b', "That could be awkward. Let's just be honest with each other if it happens.", { bestie: "Okay. Girl code. Whatever happens, we tell each other first." }),
  ], beat: "They shake on it, and both of them mean it." },
  { when: { of: 'same-type', ...C3 }, stage: "{a} sits down with {b} and {c} on the daybeds.", turns: [
    ['c', "Who do you two like? Go on."],
    ['a', "I'm not saying. You first."],
    ['b', "I think I know who you like. Because it's the same person I like."],
    ['a', "Oh no. Really?"],
    ['c', "Well, this is going to be interesting."],
  ], beat: "{a} and {b} look at each other, and nobody quite knows whether to laugh." },
  // ── off on the wrong foot ──
  { when: { of: 'clash' }, stage: "{a} sits down next to {b} on the terrace.", turns: [
    ['b', "You came in looking very sure of yourself."],
    ['a', "Is that a problem? I've been here ten minutes."],
    ['b', "No. I'm just saying, you might want to slow down a bit."],
    say('a', "I'm just being myself. I'm not going to make myself smaller for anyone.", { sharp: "I didn't come here to be quiet. You'll get used to me." }),
    ['b', "Okay. We'll see."],
  ], beat: "Somebody else comes over and very deliberately changes the subject." },
  { when: { of: 'clash' }, stage: "{a} sits down next to {b} on the daybeds.", turns: [
    ['b', "You've been looking round like you're marking everyone out of ten."],
    ['a', "And you've been looking at me like I've already lost points."],
    ['b', "I just don't know what to make of you yet."],
    ['a', "Then talk to me, instead of deciding from over there."],
  ], beat: "{b} doesn't answer, and goes to get another drink." },
] } };
