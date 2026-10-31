// pm/talk/whole/loyalty.js — {b} tries to pull {a}, and {a} says no, for {pa}.
// One talk, start to finish (pm/script.js talkScript `whole`), in their own
// voices (whole/voice.js). The pull turned down before it starts (pm/events.js:
// a coupled islander who cares about their couple). {pb} is {b}'s own partner,
// behind bTaken. myRung: how far {a} and {pa} have come.
import { say } from './voice.js';

const CLOSED = ['closed-off', 'exclusive', 'official'];
const NO = { taken: true, rebuffed: [true, false] };
const SHORT = ['short', 'note'];

export const LOYALTY_WHOLE = { moves: { whole: [
  { when: { ...NO, bTaken: false }, stage: "{b} catches {a} by the kitchen island.", turns: [
    ['b', "Can I grab you for a chat? Somewhere quieter?"],
    ['a', "Here's fine."],
    say('b', "Okay. I like you. I've liked you for a while, and I wanted you to know.", { lad: "Alright. I'll just say it. I like you. I wanted you to know.", nervy: "Okay. This is really awkward. I like you. That's it. That's what I wanted to say." }),
    say('a', "That's really kind. But I'm with {pa}, and I'm happy.", {
      lad: "I appreciate that. But I'm with {pa}. I'm not going anywhere.",
      romantic: "That's sweet of you. But my heart's with {pa}. It has been for a while.",
      sharp: "I'm with {pa}. I'm not interested. Sorry.",
    }),
    ['b', "You can't blame me for trying."],
    ['a', "I don't. But that's my answer."],
  ], beat: "{b} nods and walks off. {a} goes straight to find {pa}." },
  { when: { ...NO, bTaken: false }, stage: "{b} sits down next to {a} on the daybed.", turns: [
    ['b', "Can I ask you something? Are you actually happy with {pa}?"],
    ['a', "Yes. Why?"],
    ['b', "Because if you're not, I'd like to take you for a chat."],
    say('a', "I'm happy. Really happy. So I'm going to say no.", { soft: "That's really nice of you. But I am happy. I'm sorry." }),
    say('b', "You don't always look it.", { flirty: "You don't always look it. Just saying." }),
    ['a', "You don't see all of it. I do."],
  ], beat: "{a} gets up, and goes to sit with {pa}." },
  { when: { ...NO, myRung: CLOSED }, stage: "{b} catches {a} on the way out of the dressing room.", turns: [
    ['b', "Have you got a minute? I wanted to talk to you."],
    ['a', "If it's what I think it is, I'm going to stop you."],
    ['b', "I just think there's something between us."],
    say('a', "There isn't. I'm with {pa}, and I mean it. I'm not even going to have this conversation.", {
      lad: "There's not, {~bro}. Me and {pa} are solid. I'm not even having this chat.",
      romantic: "I'm sorry, but there isn't. {pa} is it for me. I've never been more sure.",
    }),
    ['b', "Fair enough."],
  ], beat: "{a} walks past {b}, and doesn't look back." },
  { when: { ...NO, bTaken: true }, stage: "{b} sits down next to {a} by the pool.", turns: [
    ['b', "Can we talk? Just us."],
    ['a', "About what?"],
    ['b', "About us. I think there's something here."],
    say('a', "You're with {pb}. I'm with {pa}. Why are we even talking about this?", { sharp: "You're with {pb}. Go and talk to {pb.obj}, not me." }),
    say('b', "Because I can't stop thinking about you.", { lad: "Because I can't stop thinking about you, and I'm not going to pretend." }),
    ['a', "Then you need to sort that out with {pb}. Not with me."],
  ], beat: "{a} gets up and goes back to {pa} on the daybeds." },
  { when: { ...NO, known: true }, stage: "{b} asks {a} for a chat on the swing seat.", turns: [
    ['b', "I wanted to ask you something. If you weren't with {pa}, would you go for me?"],
    ['a', "But I am with {pa}."],
    ['b', "I said if."],
    say('a', "There's no if. I've been with {pa} a while now. I know what I want.", { soft: "I'm not going to answer that. It's not fair on {pa}." }),
    ['b', "Okay. I had to ask."],
  ], beat: "{a} stands up, and the swing seat rocks back without {a.obj}." },
  { when: { ...NO, tier: SHORT }, stage: "{b} tries to pull {a} for a chat.", turns: [
    ['b', "Can I borrow you for a minute?"],
    say('a', "Sorry. I'm with {pa}. I don't think that's a good idea.", { lad: "Sorry, {~bro}. I'm with {pa}." }),
  ], beat: "{b} shrugs and walks off." },
  { when: { ...NO, tier: SHORT }, stage: "{b} sits down next to {a}.", turns: [
    ['b', "I like you. That's all."],
    ['a', "Thank you. But I'm with {pa}, and that's not changing."],
  ], beat: "{b} nods, and leaves {a} alone." },
] } };
