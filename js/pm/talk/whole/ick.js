// pm/talk/whole/ick.js — {a} gets the ick from {b}, {a.posAdj} partner. One
// talk, start to finish (pm/script.js talkScript `whole`), in their own voices
// (whole/voice.js). The stitched ick ended on a comeback ("That's so much
// worse.", "I'll walk everywhere from now on, then.") and a last line on top
// ("Probably not, no."). Here the ick is small and silly, and how it lands
// isn't: {b} is hurt or embarrassed when {a} says it (`end: said`), and {a}
// feels bad about it when {a.he} keeps it in (`end: kept`).
import { say } from './voice.js';

const SAID = { end: 'said' }, KEPT = { end: 'kept' };

export const ICK_WHOLE = { moves: { whole: [
  // ── the run ──
  { when: SAID, stage: "{b} runs across the lawn to catch a ball, arms everywhere.", turns: [
    ['b', "Did you see that catch?"],
    say('a', "I saw the run. I'm sorry, I didn't know you ran like that. It's given me a bit of an ick.", { bestie: "Babe, I'm sorry, but the run. The run has given me the ick." }),
    ['b', "From how I run? Seriously?"],
    ['a', "I know. It's stupid. I can't help it."],
    say('b', "That's actually really embarrassing. Everyone was watching.", { quiet: "Oh. Okay." }),
  ], beat: "{b} doesn't run for anything else all afternoon." },
  { when: KEPT, stage: "{b} runs across the lawn to catch a ball, arms everywhere.", turns: [
    ['b', "Did you see that catch?"],
    ['a', "Yeah. Amazing."],
    ['b', "You've gone a bit quiet. Are you okay?"],
    ['a', "I'm fine. It's the sun."],
  ], beat: "{a} looks away, and tries very hard not to think about the run." },
  // ── the chewing ──
  { when: SAID, stage: "{b} is eating a bowl of cereal next to {a} at the kitchen counter, very loudly.", turns: [
    ['a', "Can you chew a bit quieter? I'm sorry. It's giving me the ick."],
    ['b', "My eating is giving you the ick?"],
    ['a', "The noise of it. I didn't want to say anything, but it's been five minutes."],
    say('b', "I feel really self-conscious now. Thanks.", { sharp: "Well, I'm not going to stop eating." }),
    ['a', "I'm sorry. I shouldn't have said it like that."],
  ], beat: "{b} finishes the bowl very slowly, and very quietly." },
  { when: KEPT, stage: "{b} is eating a bowl of cereal next to {a} at the kitchen counter, very loudly.", turns: [
    ['b', "Do you want some?"],
    ['a', "No, thanks. I'm going to go and sit outside for a bit."],
    ['b', "I'll come out when I've finished."],
  ], beat: "{a} sits by the pool and feels guilty for wanting to be anywhere else." },
  // ── the nickname ──
  { when: SAID, stage: "{b} calls {a} by a new nickname in front of everyone.", turns: [
    ['b', "Come here, my little sugar bear."],
    say('a', "Please don't call me that. I'm sorry, it gives me the ick.", { sharp: "No. Never that. That's a full ick." }),
    ['b', "I thought it was cute. I was trying to be sweet."],
    ['a', "I know you were. I'm sorry. Just use my name."],
  ], beat: "{b} goes red, and calls {a} by {a.posAdj} name for the rest of the day." },
  { when: KEPT, stage: "{b} calls {a} by a new nickname in front of everyone.", turns: [
    ['b', "Come here, my little sugar bear."],
    ['a', "Hi."],
    ['b', "Do you like it? I made it up for you."],
    ['a', "It's very sweet of you."],
  ], beat: "{a} spends the rest of the afternoon hoping {b} forgets it." },
  // ── the singing ──
  { when: SAID, stage: "{b} starts singing on the daybeds, loudly.", turns: [
    ['b', "Do you want to hear the rest? I'm actually quite good."],
    say('a', "Can you stop? I'm sorry. It's giving me the ick, and I don't want it to.", { bestie: "Babe. Stop. I'm getting the ick, and I don't want the ick." }),
    ['b', "Wow. Okay. I was only having fun."],
    ['a', "I know. That's why I feel bad saying it."],
  ], beat: "{b} goes quiet, and doesn't sing again." },
  { when: KEPT, stage: "{b} starts singing on the daybeds, loudly.", turns: [
    ['b', "Was that good?"],
    ['a', "You're really confident. I like that you don't care."],
    ['b', "So it was good?"],
    ['a', "Yeah. It was really good."],
  ], beat: "{a} smiles, and moves a little further along the daybed." },
  // ── the plate ──
  { when: SAID, stage: "{b} leaves {b.posAdj} plate on the side for somebody else to clear, again.", turns: [
    ['a', "Are you going to wash that?"],
    ['b', "Somebody will do it."],
    say('a', "You mean me. It's always me. A grown adult who doesn't clear up after themselves is a real ick for me.", { sharp: "Somebody. You mean me. It's an ick, and it's not a small one." }),
    ['b', "It's one plate."],
    ['a', "It's not about the plate. It's that you don't notice."],
  ], beat: "{b} washes the plate without a word, and looks hurt for the rest of the afternoon." },
  { when: KEPT, stage: "{b} leaves {b.posAdj} plate on the side for somebody else to clear, again.", turns: [
    ['b', "Leave it. Somebody will do it."],
    ['a', "Yeah. Somebody."],
  ], beat: "{a} washes it up without a word, and thinks about it for the rest of the day." },
  // ── the mirror ──
  { when: SAID, stage: "{b} has been checking {b.ref} out in the mirror for ten minutes.", turns: [
    ['a', "Are you nearly done?"],
    ['b', "I just want to get this bit right."],
    say('a', "I'm going to be honest. Watching you look at yourself like that is giving me the ick.", { quiet: "Sorry. I don't know why, but it's giving me the ick." }),
    ['b', "I'm making an effort for you."],
    ['a', "I know. I'd just rather you made a bit less of one."],
  ], beat: "{b} puts the comb down, and doesn't look in the mirror again until {a} has gone." },
  { when: KEPT, stage: "{b} has been checking {b.ref} out in the mirror for ten minutes.", turns: [
    ['b', "How do I look?"],
    ['a', "You look great. You looked great ten minutes ago as well."],
    ['b', "I just want to look good for you."],
  ], beat: "{a} smiles, and doesn't say what {a.he} is really thinking." },
  // ── the sore loser ──
  { when: SAID, stage: "{b} is sulking on the daybed after losing a game of cards.", turns: [
    ['a', "Are you really sulking about a game of cards?"],
    ['b', "I'm not sulking."],
    say('a', "You are. And I'm sorry, but a sore loser is my biggest ick.", { sharp: "You are. A sore loser is my biggest ick, and you're being one." }),
    ['b', "I just don't like losing. I didn't know it bothered you."],
    ['a', "It does a bit. Can you just laugh it off next time?"],
  ], beat: "{b} nods, and deals another hand without a word." },
  { when: KEPT, stage: "{b} is sulking on the daybed after losing a game of cards.", turns: [
    ['a', "Do you want another game?"],
    ['b', "No."],
  ], beat: "{a} sits a bit further away than usual for the rest of the day." },
  // ── the baby voice ──
  { when: SAID, stage: "{b} talks to {a} in a baby voice.", turns: [
    ['b', "Is my baby tired? Does my baby want a cuddle?"],
    say('a', "Please use your normal voice. I'm sorry, the baby voice is a real ick for me.", { bestie: "Babe, no. Not the baby voice. That's my worst ick." }),
    ['b', "Oh. I thought it was cute."],
    ['a', "I know. It's me, not you. Just your normal voice."],
  ], beat: "{b} laughs, a bit embarrassed, and doesn't do the voice again." },
  { when: KEPT, stage: "{b} talks to {a} in a baby voice.", turns: [
    ['b', "Is my baby tired? Does my baby want a cuddle?"],
    ['a', "I'm okay, thanks."],
  ], beat: "{a} lets {b} hug {a.obj}, and stares into the middle distance." },
  // ── the same day they fought ──
  { when: { ...SAID, rowedToday: true }, stage: "{b} is trying hard to be sweet to {a} after their fight earlier, and calls {a} 'baby' in a silly voice.", turns: [
    ['a', "Please don't do the voice. Not today."],
    ['b', "I'm trying to make it up to you."],
    say('a', "I know. But after earlier, it's giving me the ick, and I don't want to feel like that about you.", { sharp: "I know you are. It's just making it worse." }),
    ['b', "Okay. I'll stop. I'm sorry."],
  ], beat: "{b} goes quiet, and they sit there not quite touching." },
  { when: { ...KEPT, rowedToday: true }, stage: "{b} is trying hard to be sweet to {a} after their fight earlier, and won't stop fussing.", turns: [
    ['b', "Do you want a drink? A blanket? Anything?"],
    ['a', "I'm fine. Honestly."],
  ], beat: "{a} smiles, but after earlier, every bit of fussing makes {a.obj} want to be somewhere else." },
] } };
