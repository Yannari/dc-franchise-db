// pm/talk/whole/bed-chat.js — lights out: {a} and {b} go over the day, in the
// dark, whispering. One talk, start to finish (pm/script.js talkScript `whole`),
// in their own voices (whole/voice.js). The couple whose story moved today
// (pm/threads.js bedChats):
//   story graft     somebody went for {b} today
//   story doubt     {b} has been off with {a}
//   story progress  they're getting serious
// `of` is how the day left them: warm (good, or mended) · after-row (they had it
// out, and it isn't settled) · distant (nothing said, and it's there anyway).
import { say } from './voice.js';

const NO_ROW = { rowedToday: false };
const ANY_ROW = { rowedToday: [true, false] };

export const BED_CHAT_WHOLE = { moves: { whole: [
  // ── graft: somebody went for {b} today ──
  { when: { phase: 'evening', story: 'graft', of: 'warm', ...NO_ROW }, stage: "Lights out. {a} and {b} are lying in bed, whispering.", turns: [
    ['a', "Can I say something? Today was hard."],
    ['b', "I know. I'm sorry."],
    say('a', "You don't have to be sorry. I just needed you to know it got to me.", { romantic: "You don't need to be sorry. I just got scared I was going to lose you." }),
    say('b', "Nobody's taking me anywhere. I'm here.", { lad: "Nobody's taking me anywhere. You're stuck with me.", quiet: "I'm here." }),
    ['a', "Promise?"],
    ['b', "Promise."],
  ], beat: "{a} moves closer, and {b} puts an arm round {a.obj}." },
  { when: { phase: 'evening', story: 'graft', of: 'warm', ...NO_ROW }, stage: "Lights out. {a} and {b} are lying face to face in the dark.", turns: [
    ['b', "Are you still thinking about today?"],
    ['a', "A bit."],
    say('b', "You don't need to. It's you I want. I told you that, and I meant it.", { sharp: "Then stop. I chose you. That's the end of it." }),
    ['a', "I believe you. It's just nice to hear it again."],
    ['b', "Then I'll keep saying it."],
  ], beat: "{a} smiles in the dark, and closes {a.posAdj} eyes." },
  { when: { phase: 'evening', story: 'graft', of: 'after-row', ...ANY_ROW }, stage: "Lights out. {a} and {b} are lying in bed with a gap between them.", turns: [
    ['b', "Are you awake?"],
    ['a', "Yeah."],
    ['b', "Are you still angry with me?"],
    say('a', "I'm not angry. I'm hurt. There's a difference.", { sharp: "Yes. I'm still angry.", nervy: "I don't know what I am. I just can't sleep." }),
    ['b', "Nothing happened. I keep telling you."],
    ['a', "I know what you keep telling me."],
  ], beat: "Neither of them moves to close the gap." },
  { when: { phase: 'evening', story: 'graft', of: 'distant', ...NO_ROW }, stage: "Lights out. {a} and {b} are lying back to back.", turns: [
    ['a', "Goodnight."],
    ['b', "Goodnight."],
    ['a', "Are we okay?"],
    say('b', "We're fine. Go to sleep.", { soft: "We're okay. I'm just tired." }),
  ], beat: "{a} lies awake for a long time, looking at the ceiling." },

  // ── doubt: {b} has been off with {a} ──
  { when: { phase: 'evening', story: 'doubt', of: 'warm', ...NO_ROW }, stage: "Lights out. {a} and {b} are lying in bed, whispering.", turns: [
    ['b', "I'm sorry I've been off lately."],
    ['a', "I noticed."],
    say('b', "I know. I've been in my own head. It's not you.", { lad: "I've been in my head. That's on me, not you.", soft: "I've been in my own head, and I didn't think about how it felt for you. I'm sorry." }),
    ['a', "I just want us to be okay."],
    ['b', "We are. I promise."],
  ], beat: "{b} reaches for {a.posAdj} hand under the covers." },
  { when: { phase: 'evening', story: 'doubt', of: 'warm', rowedToday: true }, stage: "Lights out. {a} and {b} are lying in bed, whispering.", turns: [
    ['b', "I hate going to sleep after a day like today."],
    ['a', "Me too."],
    ['b', "I'm glad we talked."],
    say('a', "Me too. I feel like I've got you back.", { romantic: "Me too. I really thought I was losing you." }),
  ], beat: "{a} falls asleep with {a.posAdj} head on {b}'s chest." },
  { when: { phase: 'evening', story: 'doubt', of: 'after-row', ...ANY_ROW }, stage: "Lights out. {a} and {b} are lying in bed, not touching.", turns: [
    ['a', "Can I ask you something?"],
    ['b', "It's late."],
    ['a', "Do you still want to be with me?"],
    say('b', "I don't know. I'm sorry. I don't know.", { sharp: "Don't ask me that now.", soft: "I'm trying to work it out. I'm sorry." }),
    ['a', "Okay."],
  ], beat: "{a} turns over to face the wall. {b} stares at the ceiling." },
  { when: { phase: 'evening', story: 'doubt', of: 'distant', ...NO_ROW }, stage: "Lights out. {a} and {b} are lying in bed, an arm's length apart.", turns: [
    ['a', "You've been quiet with me all day."],
    ['b', "Have I?"],
    ['a', "You know you have."],
    say('b', "I'm just tired. Can we talk tomorrow?", { lad: "I'm just {~knackered}. Tomorrow, yeah?" }),
  ], beat: "{b} rolls over. {a} doesn't sleep for a long time." },

  // ── progress: getting serious ──
  { when: { phase: 'evening', story: 'progress', of: 'warm', ...NO_ROW }, stage: "Lights out. {a} and {b} are lying in bed, whispering.", turns: [
    ['b', "Can I tell you something?"],
    ['a', "Always."],
    say('b', "This is my favourite part of the day. Just you and me.", { lad: "This is the best bit of the day. Just us.", romantic: "Every night I lie here and think how lucky I am that it's you." }),
    say('a', "Mine too.", { quiet: "Me too." }),
  ], beat: "{a} kisses {b} goodnight, and they fall asleep wrapped round each other." },
  { when: { phase: 'evening', story: 'progress', of: 'warm', ...NO_ROW }, stage: "Lights out. {a} and {b} are lying face to face.", turns: [
    ['a', "I keep thinking about what it'll be like on the outside."],
    ['b', "What do you think it'll be like?"],
    say('a', "Normal. Us, making dinner. Going for walks. No cameras.", { lad: "Us. A takeaway on the sofa. No cameras. Sounds perfect." }),
    ['b', "That sounds really nice."],
    ['a', "It does, doesn't it?"],
  ], beat: "They fall asleep still whispering about it." },
  { when: { phase: 'evening', story: 'progress', of: ['after-row', 'distant'], ...ANY_ROW }, stage: "Lights out. {a} and {b} are lying in bed.", turns: [
    ['a', "Today was weird."],
    ['b', "Yeah."],
    ['a', "Are we okay?"],
    say('b', "We're okay. Let's just sleep, and start again tomorrow.", { soft: "We're okay. I promise. I'm sorry about today." }),
  ], beat: "{b} reaches for {a.posAdj} hand, and {a} lets {b.obj} take it." },
  { when: { phase: 'evening', story: 'doubt', of: 'distant', rowedToday: false }, stage: "Lights out. {a} and {b} are lying in bed. {b} has {b.posAdj} back to {a}.", turns: [
    ['a', "Can I have a cuddle?"],
    ['b', "I'm really hot. Sorry."],
    ['a', "Okay."],
  ], beat: "{a} turns over, and pretends to go to sleep." },
  { when: { phase: 'evening', story: 'graft', of: 'distant', rowedToday: false }, stage: "Lights out. {a} and {b} are lying in bed, not touching.", turns: [
    ['a', "Did you have a good day?"],
    ['b', "It was fine."],
    ['a', "Just fine?"],
    say('b', "Just fine. Night.", { soft: "It was a long day. I'm sorry. Night." }),
  ], beat: "{a} lies awake, listening to {b} breathe." },

] } };
