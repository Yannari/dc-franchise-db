// ══════════════════════════════════════════════════════════════════════
// pm/talk/gossip.js — {a} tells {b} what {b}'s partner {c} did
// ══════════════════════════════════════════════════════════════════════
//
// {a} saw it (or heard it said, `heard`); {b} is the partner; {c} did it, with
// {x} (behind `hasWith`). What it was is the secret's own kind (`sec`): pull ·
// kiss · bed · promise · said. A telling names it exactly: "kissed" only for a
// kiss. `light` is a day-one chat that barely counts; `casa` while the villas
// are split. How {b} takes it is the engine's (`end`: angry · quiet · thanks).
//   open       {a} gets {b} on {b.posAdj} own
//   hesitate   {a} isn't sure {a} should say
//   tell       what {a} saw
//   ask        {b} wants the detail
//   react      how {b} takes it — the engine's ending
//   close      how they leave it
import { build } from './build.js';
import { stepOf } from '../ladder.js';

const CLOSED = ['closed-off', 'exclusive', 'official'];

const secretOf = (state, ev) => (state.secrets || []).find(s => s.id === ev.extra?.secret) || null;

export const GOSSIP = build('gossip', {
  after: [],
  facts: (state, ev) => {
    const s = secretOf(state, ev);
    return { hasWith: !!s?.with, seen: !!s?.witnesses?.includes(ev.players[0]) && !s?.said,
      casa: !!s?.casa, light: (s?.severity ?? 1) < 0.6,
      // {b} had closed off with {c}: only then is it "I closed myself off for you".
      closedOff: CLOSED.includes(stepOf(state, ev.players[1], ev.players[2])) };
  },
  slots: (state, ev) => {
    const s = secretOf(state, ev);
    return s?.with ? { x: s.with } : {};
  },
  plans: {
    featured: ['open', 'hesitate', 'tell', 'ask?', 'react', 'close'],
    short: ['open', 'tell', 'react'],
  },
  moves: {
    open: [
      { stage: "{a} finds {b} on {b.posAdj} own in the dressing room.", turns: [
        ['a', "Have you got a sec? Just us?"],
        ['b', "Yeah, of course. What's wrong? You've got a face on."],
        ['a', "Sit down a minute."],
      ] },
      { stage: "{a} pulls {b} away from the daybeds and up to the terrace.", turns: [
        ['b', "What's going on? You're being weird."],
        ['a', "I'm not being weird. I just need to talk to you, and I don't want anyone else hearing."],
        ['b', "Okay. Now you're scaring me."],
      ] },
      { stage: "{a} waits until {c} is in the pool, then sits down next to {b}.", turns: [
        ['a', "Can I talk to you about something?"],
        ['b', "Of course. Is everything okay?"],
        ['a', "I don't know. That's sort of the problem."],
      ] },
      { when: { phase: 'evening' }, stage: "{a} catches {b} on the way to bed.", turns: [
        ['a', "Before you go in, can I grab you for two minutes?"],
        ['b', "Now? I'm shattered."],
        ['a', "I know. It's important. I wouldn't ask if it wasn't."],
      ] },
      { when: { reg: 'big' }, stage: "{a} practically drags {b} into the bathroom.", turns: [
        ['b', "What are you doing?"],
        ['a', "Shh. Sit. I need to tell you something, and I need you not to scream."],
        ['b', "Why would I scream?"],
      ] },
      { when: { reg: 'nervy' }, stage: "{a} hovers by {b} for a long moment before speaking.", turns: [
        ['a', "Hey. Can I — sorry. Can I talk to you? Privately?"],
        ['b', "You're shaking. What's happened?"],
        ['a', "Nothing's happened to me. Just come with me."],
      ] },
      { when: { reg: 'sharp' }, stage: "{a} sits down opposite {b} on the terrace.", turns: [
        ['a', "I'm going to tell you something, and you're not going to like it, but you'd want to know."],
        ['b', "Okay. Go on."],
      ] },
      { stage: "{a} sits on the end of {b}'s bed while the others are outside.", turns: [
        ['b', "What's up? You've been looking at me funny all afternoon."],
        ['a', "Have I? Yeah. I probably have. I need to tell you something."],
      ] },
    ],

    hesitate: [
      { turns: [
        ['a', "I've gone back and forth about whether to say anything. Like, I've been sitting on it for hours, and I kept thinking, it's not my business, it's not my place. But if it was me, I'd want to know. I'd want someone to tell me."],
        ['b', "Just say it."],
      ] },
      { turns: [
        ['a', "Promise me you won't shoot the messenger."],
        ['b', "That depends on the message."],
        ['a', "That's what I'm worried about."],
        ['b', "Just tell me. Please."],
      ] },
      { when: { reg: 'soft' }, turns: [
        ['a', "I care about you, and that's the only reason I'm saying this. I'm not trying to cause drama, I'm not trying to get involved. I just couldn't sit at dinner tonight and look at you knowing what I know."],
        ['b', "What do you know?"],
      ] },
      { when: { reg: 'dry' }, turns: [
        ['a', "There's no good way of saying this, and I've tried about four different ways in my head, and they were all terrible."],
        ['b', "Try the fifth."],
      ] },
      { when: { reg: 'sharp' }, turns: [
        ['a', "I'm not going to dress it up. I don't do that, and you wouldn't thank me for it."],
        ['b', "Then don't."],
      ] },
      { when: { heard: true }, turns: [
        ['a', "Look, I wasn't going to say anything, because it's not something I saw. It's something I heard. But it's been eating at me all day."],
        ['b', "Heard from who?"],
        ['a', "I'll get to that."],
      ] },
      { when: { light: true }, turns: [
        ['a', "It's probably nothing. Honestly, it's probably nothing at all. But I'd hate for you to hear it from someone else and think I kept it from you."],
        ['b', "If it's nothing, why do you look so worried?"],
      ] },
    ],

    tell: [
      { when: { sec: 'pull', hasWith: true }, turns: [
        ['a', "{c} pulled {x} for a chat earlier. On the swing seats. And it didn't look like a friendly chat, if I'm honest. They were sitting really close, and {c} couldn't stop laughing at everything {x} said."],
        ['b', "When was this?"],
        ['a', "While you were inside."],
      ] },
      { when: { sec: 'pull', hasWith: true }, turns: [
        ['a', "I saw {c} with {x} earlier, by the pool. They were having a really flirty chat, laughing and touching each other's arms and all of that. And when I walked past, they both went quiet."],
        ['b', "They went quiet?"],
        ['a', "Straight away. Like they'd been caught."],
      ] },
      { when: { sec: 'pull', hasWith: true, light: true }, turns: [
        ['a', "{c} had a chat with {x} on the daybeds. It was early on, and it might have been nothing, everyone was talking to everyone. But it looked a bit flirty, and I thought you should know."],
        ['b', "Flirty how?"],
        ['a', "Just... lots of laughing. Lots of eye contact."],
      ] },
      { when: { sec: 'kiss', hasWith: true }, turns: [
        ['a', "{c} kissed {x}. I saw it. On the terrace, when everyone else was at the pool. It wasn't a peck, either. It was a {~proper} kiss."],
        ['b', "You're joking."],
        ['a', "I wish I was. I'm so sorry."],
      ] },
      { when: { sec: 'kiss', hasWith: true }, turns: [
        ['a', "I walked round the corner by the Hideaway, and {c} and {x} were kissing. They jumped apart when they saw me, and {c} looked at me like, please don't. And I've been sitting with that ever since."],
        ['b', "{c} looked at you?"],
        ['a', "Right at me."],
      ] },
      { when: { sec: 'bed', hasWith: true }, turns: [
        ['a', "Last night, {c} shared a bed with {x}. I know because I was in the bed next to them. And it wasn't just sleeping, there was a lot of whispering and giggling and moving about."],
        ['b', "Shared a bed?"],
        ['a', "Shared a bed."],
      ] },
      { when: { sec: 'promise', hasWith: true }, turns: [
        ['a', "I overheard {c} and {x} talking earlier. {c} was saying stuff like, when we get out of here, I'll take you out properly. Plans for the outside. With {x}. Not with you."],
        ['b', "Plans for the outside?"],
        ['a', "Dinner. Weekends away. All of it."],
      ] },
      { when: { sec: 'said', heard: true }, turns: [
        ['a', "{c} was talking about you earlier. Not nicely. Saying you're too much, saying {c}'s bored, saying {c} doesn't know if {c} even {~fancies} you anymore. In front of a few people."],
        ['b', "{c} said that? About me?"],
        ['a', "I'm so sorry."],
      ] },
      { when: { sec: 'said' }, turns: [
        ['a', "{c} was having a moan about you earlier. Saying you're clingy, saying {c} needs space, saying it's like being stuck with someone. And it wasn't a joke. {c} meant it."],
        ['b', "Clingy?"],
        ['a', "That was the word."],
      ] },
      { when: { casa: true, hasWith: true }, turns: [
        ['a', "While you were in the other villa, {c} got really close to {x}. Like, really close. They were together all the time, on the daybeds, in the pool, everywhere. I'm not going to say anything happened, because I don't know. But it didn't look like nothing."],
        ['b', "The whole time I was away?"],
        ['a', "Pretty much the whole time."],
      ] },
      { when: { hasWith: true }, turns: [
        ['a', "It's about {c} and {x}. There's something going on there, and I think you need to keep your eyes open, because everyone else has noticed, and you're the only one who hasn't."],
        ['b', "What do you mean, everyone's noticed?"],
        ['a', "I mean people are talking."],
      ] },
    ],

    ask: [
      { turns: [
        ['b', "And you're sure? You're absolutely sure that's what you saw?"],
        ['a', "I'm sure. I wouldn't be telling you if I wasn't. I'm not going to come over here and blow up your couple on a maybe."],
        ['b', "Who else knows?"],
        ['a', "I don't know. A couple of people, maybe."],
      ] },
      { turns: [
        ['b', "Why are you telling me this? What's in it for you?"],
        ['a', "Nothing's in it for me. Honestly. I just know that if it was me, I'd want someone to tell me, and I'd be {~gutted} if I found out everyone knew and nobody said anything."],
        ['b', "Okay."],
      ] },
      { when: { hasWith: true }, turns: [
        ['b', "{x}? Of all people?"],
        ['a', "I know."],
        ['b', "I've been sitting next to {x} at dinner every night. I've been nice to {x}. I've been nice."],
        ['a', "I know you have."],
      ] },
      { turns: [
        ['b', "How long has this been going on?"],
        ['a', "I don't know. I only know what I saw. It could have been a one-off. It could be more. I didn't want to guess."],
        ['b', "That's worse. Not knowing is worse."],
      ] },
    ],

    react: [
      { when: { end: 'angry' }, turns: [
        ['b', "No. No, I'm not having that. I've been sitting here thinking we were good. I've been telling everyone how happy I am. And the whole time, {c}'s been doing that behind my back? I'm going to go and find {c}."],
        ['a', "Maybe calm down first."],
        ['b', "I'm not calming down."],
      ] },
      { when: { end: 'angry', closedOff: true }, turns: [
        ['b', "I'm so angry. I'm actually shaking. I trusted {c}. I closed myself off for {c}, I told {c} things I've never told anyone. And this is what I get? I'm done. I'm actually done."],
        ['a', "Don't do anything right now. Sleep on it."],
        ['b', "I don't need to sleep on it."],
      ] },
      { when: { end: 'angry', hasWith: true }, turns: [
        ['b', "And {x} knew we were together. {x} sat there and smiled at me. Both of them, actually. I want to talk to both of them. Now."],
        ['a', "One at a time."],
        ['b', "Fine. {c} first."],
      ] },
      { when: { end: 'quiet' }, turns: [
        ['b', "Okay."],
        ['a', "Okay?"],
        ['b', "I don't know what to say. I'm just... I need a minute. I thought I knew where I stood, and I clearly don't. I clearly don't know anything."],
        ['a', "Take as long as you need."],
      ] },
      { when: { end: 'quiet' }, turns: [
        ['b', "I'm not even surprised. That's the worst part. I'm not surprised at all. I think I knew. I just didn't want to know."],
        ['a', "You didn't deserve that."],
        ['b', "No. I didn't."],
      ] },
      { when: { end: 'quiet' }, turns: [
        ['b', "Can you just... not tell anyone you told me? I don't want everyone looking at me at dinner. I'll deal with it. I just need to work out how."],
        ['a', "I won't say a word."],
      ] },
      { when: { end: 'thanks' }, turns: [
        ['b', "Thank you. Honestly. Thank you for telling me. I know that wasn't easy, and I know half the villa would have kept quiet."],
        ['a', "I just thought you deserved to know."],
        ['b', "I did. I do. I owe you."],
      ] },
      { when: { end: 'thanks' }, turns: [
        ['b', "I'm glad it was you who told me. Not someone at the fire pit. Not in front of everyone. You."],
        ['a', "I'd never let you find out like that."],
        ['b', "I know. That's why I trust you."],
      ] },
      { when: { end: 'thanks', light: true }, turns: [
        ['b', "Honestly, I'm not even that bothered. A chat's a chat. But I'm glad you said something, because I'd rather know than not."],
        ['a', "That's what I thought."],
      ] },
    ],

    close: [
      { when: { end: 'angry' }, turns: [], beat: "{b} gets up and goes straight down the stairs, looking for {c}." },
      { when: { end: 'angry' }, turns: [
        ['a', "Where are you going?"],
        ['b', "Where do you think?"],
      ], beat: "{a} watches {b} go, already wondering if telling {b.obj} was the right thing." },
      { when: { end: 'quiet' }, turns: [], beat: "{b} stays on the bed long after {a} leaves, staring at the wall." },
      { when: { end: 'quiet' }, turns: [
        ['a', "Do you want me to stay?"],
        ['b', "No. I need to be on my own for a bit."],
      ], beat: "{a} goes. {b} doesn't come out for dinner." },
      { when: { end: 'thanks' }, turns: [], beat: "{b} hugs {a} for a long time before either of them lets go." },
      { when: { end: 'thanks' }, turns: [
        ['b', "Right. I'm going to have a think. Don't say anything to anyone."],
        ['a', "I won't."],
      ] },
    ],
  },

  notes: [
    { stage: "{a} takes {b} aside and tells {b.obj} about {c}." },
    { when: { hasWith: true }, stage: "{a} tells {b} what {c} has been doing with {x}." },
  ],
});
