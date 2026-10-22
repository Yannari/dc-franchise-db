// ══════════════════════════════════════════════════════════════════════
// pm/talk/ick.js — {a} gets the ick from {b}, {a.posAdj} partner
// ══════════════════════════════════════════════════════════════════════
//
// The ick is one specific thing, so each entry is the whole scene: the thing
// {b} does and what {a} does about it, together. The engine decides whether
// {a} says it (`end`: said, and it stings) or keeps it in (`end`: kept).
//   ick     the moment and what follows
//   after   a last line, now and then
import { build } from './build.js';

export const ICK = build('ick', {
  plans: {
    featured: ['ick', 'after?'],
    short: ['ick'],
  },
  moves: {
    ick: [
      { when: { end: 'said' }, stage: "{b} runs across the lawn to catch a ball, arms flailing.", turns: [
        ['b', "Did you see that? Did you see that catch?"],
        ['a', "I saw the run."],
        ['b', "What's wrong with the run?"],
        ['a', "Nothing. It's just... I didn't know you ran like that. With your arms like that. It's given me a bit of an ick, if I'm honest."],
        ['b', "An ick? From how I run?"],
        ['a', "I'm sorry! I can't help it! You can't choose your icks!"],
        ['b', "Wow. Okay. I'll walk everywhere from now on, then."],
      ] },
      { when: { end: 'kept' }, stage: "{b} runs across the lawn to catch a ball, arms flailing.", turns: [
        ['b', "Did you see that? Did you see that catch?"],
        ['a', "Yeah. Amazing. Really... amazing."],
        ['b', "You okay? You've gone a bit funny."],
        ['a', "I'm fine! Sun. It's the sun."],
      ], beat: "{a} looks away and very carefully doesn't think about the run." },
      { when: { end: 'said' }, stage: "{b} eats a bowl of cereal next to {a} at the kitchen counter, very loudly.", turns: [
        ['a', "Can you... chew a bit quieter?"],
        ['b', "What?"],
        ['a', "The crunching. It's really loud. I'm sorry, I didn't want to say anything, but it's been going on for five minutes, and I'm getting the ick."],
        ['b', "You're getting the ick from my cereal?"],
        ['a', "From the noise of your cereal."],
        ['b', "That's so much worse."],
      ] },
      { when: { end: 'kept' }, stage: "{b} eats a bowl of cereal next to {a} at the kitchen counter, very loudly.", turns: [
        ['b', "Do you want some?"],
        ['a', "No, I'm all right. Thanks, though. I'm going to... I'm going to go and sit outside."],
        ['b', "Okay. I'll come out when I've finished."],
        ['a', "No rush. Honestly. Take your time."],
      ] },
      { when: { end: 'said' }, stage: "{b} calls {a} by a new nickname in front of everyone.", turns: [
        ['b', "Come here, my little sugar bear."],
        ['a', "Please don't call me that."],
        ['b', "Why not? It's cute."],
        ['a', "It's not cute. It's given me the ick. Like, a {~proper} ick. I need you to never say it again."],
        ['b', "Sugar bear?"],
        ['a', "Stop it."],
      ] },
      { when: { end: 'kept' }, stage: "{b} calls {a} by a new nickname in front of everyone.", turns: [
        ['b', "Come here, my little sugar bear."],
        ['a', "Ha. Yeah. Hi."],
        ['b', "Do you like it? I've been working on it."],
        ['a', "It's... it's very you."],
      ], beat: "{a} spends the rest of the afternoon trying not to be called anything." },
      { when: { end: 'said' }, stage: "{b} does a little dance while waiting for the kettle to boil.", turns: [
        ['a', "What are you doing?"],
        ['b', "My kettle dance. I always do it. It makes it boil faster."],
        ['a', "Can you not?"],
        ['b', "Why?"],
        ['a', "Because about ten seconds ago I was really into you, and now I'm not sure. It's the ick. You've given me the ick with a kettle."],
        ['b', "That's harsh."],
      ] },
      { when: { end: 'kept' }, stage: "{b} does a little dance while waiting for the kettle to boil.", turns: [
        ['b', "Do you like my kettle dance?"],
        ['a', "Love it. Yeah. Very... rhythmic."],
        ['b', "I'll teach you."],
        ['a', "Maybe another time."],
      ], beat: "{a} makes {a.posAdj} own tea for the rest of the week." },
      { when: { end: 'said' }, stage: "{b} tries to show off {b.posAdj} singing voice on the daybeds.", turns: [
        ['b', "Do you want to hear me sing? I'm actually really good."],
        ['a', "Go on, then."],
        ['b', "La la la laaa..."],
        ['a', "Okay, stop. Stop. I'm sorry, I can't. You've just given me a massive ick."],
        ['b', "I was warming up!"],
        ['a', "Please don't warm up any more."],
      ] },
      { when: { end: 'kept' }, stage: "{b} tries to show off {b.posAdj} singing voice on the daybeds.", turns: [
        ['b', "Do you want to hear me sing? I'm actually really good."],
        ['a', "Go on, then."],
        ['b', "La la la laaa..."],
        ['a', "Wow. Yeah. That's... you're really confident, aren't you?"],
        ['b', "Was it good?"],
        ['a', "It was very loud."],
      ] },
      { when: { end: 'said' }, stage: "{b} leaves {b.posAdj} plate on the side for someone else to clear, again.", turns: [
        ['a', "Are you going to wash that?"],
        ['b', "Someone'll do it."],
        ['a', "Someone. You mean me. You always mean me. Honestly, a grown adult who doesn't clear up after themselves is a massive ick for me."],
        ['b', "It's one plate."],
        ['a', "It's never one plate."],
      ] },
      { when: { end: 'kept' }, stage: "{b} leaves {b.posAdj} plate on the side for someone else to clear, again.", turns: [
        ['b', "Leave it, someone'll do it."],
        ['a', "Yeah. Someone."],
      ], beat: "{a} washes it up without a word, and thinks about it for the rest of the day." },
      { when: { end: 'said' }, stage: "{b} spends ten minutes checking {b.ref} out in the mirror.", turns: [
        ['a', "Are you done?"],
        ['b', "Nearly. I just need to get this bit right."],
        ['a', "You've been doing that bit for ten minutes. I'm going to be honest, watching you look at yourself like that is giving me the ick."],
        ['b', "I'm just making an effort for you."],
        ['a', "You're making an effort for the mirror."],
      ] },
      { when: { end: 'kept' }, stage: "{b} spends ten minutes checking {b.ref} out in the mirror.", turns: [
        ['b', "How do I look?"],
        ['a', "You look great. You looked great ten minutes ago as well."],
        ['b', "I just wanted to get it right."],
        ['a', "Right. Yeah. Of course."],
      ] },
      { when: { end: 'said' }, stage: "{b} laughs at {b.posAdj} own joke, very loudly, for a long time.", turns: [
        ['b', "Get it? Get it? Because the hot tub was hot!"],
        ['a', "I get it."],
        ['b', "Oh my God, I'm so funny."],
        ['a', "Can I say something? When you laugh at your own jokes like that, it gives me the ick. A bit. I'm sorry."],
        ['b', "So I can't laugh now?"],
        ['a', "You can laugh. Just maybe at other people's jokes."],
      ] },
      { when: { end: 'kept' }, stage: "{b} laughs at {b.posAdj} own joke, very loudly, for a long time.", turns: [
        ['b', "Get it? Because the hot tub was hot!"],
        ['a', "Yeah. Good one."],
        ['b', "You're not laughing."],
        ['a', "I'm laughing on the inside."],
      ] },
      { when: { end: 'said' }, stage: "{b} sulks on the daybed after losing a game of cards.", turns: [
        ['a', "Are you seriously sulking about a game of cards?"],
        ['b', "I'm not sulking."],
        ['a', "You are. You've got your arms folded and you won't look at anyone. Honestly, a sore loser is my biggest ick, and you're being a really sore loser."],
        ['b', "I just don't like losing."],
        ['a', "Nobody likes losing. Most people don't make a whole thing of it."],
      ] },
      { when: { end: 'kept' }, stage: "{b} sulks on the daybed after losing a game of cards.", turns: [
        ['a', "Do you want another game?"],
        ['b', "No."],
        ['a', "Okay."],
      ], beat: "{a} sits a bit further away than usual for the rest of the day." },
      { when: { end: 'said' }, stage: "{b} talks to {a} in a baby voice.", turns: [
        ['b', "Is my baby tired? Does my baby want a cuddle?"],
        ['a', "Stop. Please. Use your normal voice."],
        ['b', "What's wrong with this voice?"],
        ['a', "Everything. It's the ick. It's the worst ick I've ever had. Please never do that voice again."],
      ] },
      { when: { end: 'kept' }, stage: "{b} talks to {a} in a baby voice.", turns: [
        ['b', "Is my baby tired? Does my baby want a cuddle?"],
        ['a', "I'm all right, thanks."],
        ['b', "Come here, baby."],
      ], beat: "{a} lets {b} hug {a.obj}, and stares into the middle distance." },
    ],

    after: [
      { when: { end: 'said' }, turns: [['b', "I'm never going to live that down, am I?"], ['a', "Probably not, no."]] },
      { when: { end: 'said' }, turns: [], beat: "{b} goes off to tell the others, who think it's the funniest thing they've ever heard." },
      { when: { end: 'kept' }, turns: [], beat: "{a} decides to say nothing. For now." },
      { when: { end: 'said' }, turns: [['b', "Can you get un-icked?"], ['a', "Sometimes. Give it time. And never do it again."]] },
    ],
  },

  notes: [
    { when: { end: 'said' }, stage: "{a} tells {b} about the ick. {b} takes it badly." },
    { when: { end: 'kept' }, stage: "{a} gets the ick from {b}, and keeps it to {a.ref}." },
  ],
});
