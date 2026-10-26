// ══════════════════════════════════════════════════════════════════════
// pm/talk/bed-chat.js — lights out: {a} and {b} go over the day
// ══════════════════════════════════════════════════════════════════════
//
// The end of a villa night (pm/threads.js bedChats): a couple whose story
// moved today, in bed, in the dark, whispering. `story` is which story it was
// (graft: somebody went for one of them; doubt: one of them has been off;
// progress: they're getting serious). `of` is how the day left them:
//   warm       good — or mended
//   after-row  they had it out today, and it isn't settled
//   distant    nothing said, and it's there between them anyway
//   open    lights out, the first whisper
//   talk    the day, and the two of them — the long turn
//   close   how they fall asleep
import { build } from './build.js';

export const BED_CHAT = build('bed-chat', {
  stages: [
    { stage: "Lights out. {a} and {b} are lying in bed, whispering." },
  ],
  plans: {
    featured: ['open', 'talk', 'close'],
    short: ['talk', 'close'],
  },
  moves: {
    open: [
      { stage: "Lights out. The villa is dark, apart from the glow from the garden. {a} and {b} are lying face to face.", turns: [
        ['a', "Are you awake?"],
        ['b', "No."],
        ['a', "You are."],
        ['b', "I am now."],
      ] },
      { stage: "Lights out. Somebody across the bedroom is already snoring. {a} turns over to face {b}.", turns: [
        ['a', "Can I say something?"],
        ['b', "Whisper it. Everyone's asleep."],
      ] },
      { when: { of: ['after-row', 'distant'] }, stage: "Lights out. {a} and {b} are lying in the same bed, with a gap down the middle that wasn't there last night.", turns: [
        ['a', "Are you still angry with me?"],
        ['b', "I'm not angry. I'm tired."],
      ] },
    ],
    talk: [
      // Back together: they remember the first time round.
      { when: { backNow: true }, turns: [
        ['a', "Is it weird that this feels like the first night all over again?"],
        ['b', "A bit. A good bit."],
        ['a', "I honestly didn't think I'd be lying here with you again."],
        ['b', "Neither did I. So let's not waste it this time."],
      ] },
      { when: { backNow: true }, turns: [
        ['a', "Can I ask you something? Are we actually okay? Or are we just back in the same bed?"],
        ['b', "We're okay. We're not the same as before. But I think that might be a good thing."],
        ['a', "Not the same as before. I can live with that."],
      ] },
      { when: { backNow: true, of: ['after-row', 'distant'] }, turns: [
        ['a', "We've been back together five minutes, and we're already lying here not talking. That's what happened last time."],
        ['b', "I know. I don't want it to be like last time."],
        ['a', "Then talk to me. That's all I'm asking."],
      ] },
      { when: { again: true, backNow: false, of: 'warm' }, turns: [
        ['a', "Do you ever think about when we split up?"],
        ['b', "Sometimes. Mostly I think about how stupid it was."],
        ['a', "I don't think it was stupid. I think we needed it."],
        ['b', "Don't make me agree with that. Not at this time of night."],
      ] },
      { when: { again: true, backNow: false, of: ['after-row', 'distant'] }, turns: [
        ['a', "Every time we go quiet like this, I think, here we go. It's going to end like last time."],
        ['b', "It's not last time."],
        ['a', "Then tell me what's going on in your head. Because last time you didn't."],
      ] },
      { when: { story: 'graft', of: 'warm' }, turns: [
        ['a', "Today was a lot."],
        ['b', "Today was a lot."],
        ['a', "I just want you to know, whatever anyone says, and whoever pulls who for whatever chat, this is where I want to be. Right here."],
        ['b', "In a bed with a broken slat and someone snoring two feet away?"],
        ['a', "Especially with the broken slat."],
      ] },
      { when: { story: 'graft', of: 'after-row' }, turns: [
        ['a', "I don't want to fall asleep like this."],
        ['b', "Then don't. Talk to me."],
        ['a', "I just need to know I'm not going to wake up tomorrow and find you on a swing seat with someone else."],
        ['b', "You're not. But I can't keep proving it to you every five minutes either."],
        ['a', "I know. I know you can't."],
      ] },
      { when: { story: 'graft', of: 'distant' }, turns: [
        ['a', "You've not said a word since dinner."],
        ['b', "I've just got a lot going on in my head."],
        ['a', "About what?"],
        ['b', "About today. About everything. Can we not, tonight?"],
      ] },
      { when: { story: 'doubt', of: 'warm' }, turns: [
        ['a', "I'm glad we talked. I was really scared I was losing you."],
        ['b', "I know. I'm sorry I made you feel like that. I've been in my own head, and I let it come out on you."],
        ['a', "Just talk to me next time. Before it gets to that."],
        ['b', "I will. I promise."],
      ] },
      { when: { story: 'doubt', of: ['after-row', 'distant'] }, turns: [
        ['a', "Do you still want to share a bed with me?"],
        ['b', "What kind of question is that?"],
        ['a', "An honest one."],
        ['b', "I'm here, aren't I?"],
        ['a', "That's not what I asked."],
      ] },
      { when: { story: 'progress' }, turns: [
        ['a', "Can I tell you something embarrassing?"],
        ['b', "Always."],
        ['a', "At dinner, when everyone was talking, I wasn't listening to a single word. I was just watching you laugh."],
        ['b', "That's not embarrassing. That's cute."],
        ['a', "It's embarrassing when I say it out loud."],
      ] },
      { when: { story: 'progress' }, turns: [
        ['a', "Do you ever think about the outside? Like, what this would look like at home?"],
        ['b', "All the time. Is that mad?"],
        ['a', "No. I do it too. I picture you meeting my friends, and them loving you."],
        ['b', "They'd love me?"],
        ['a', "They'd love you more than they love me, probably."],
      ] },
      { when: { of: 'warm' }, turns: [
        ['a', "What was your favourite bit of today?"],
        ['b', "This bit. Right now."],
        ['a', "That's so cheesy."],
        ['b', "You asked!"],
      ] },
    ],
    close: [
      { when: { of: 'warm', phase: 'evening' }, turns: [['b', "Goodnight, you."], ['a', "Goodnight."]], beat: "{a} rests {a.posAdj} head on {b}'s chest, and they're both asleep in minutes." },
      { when: { of: 'warm' }, turns: [], beat: "They kiss, and {b} pulls the cover up over both of them." },
      { when: { of: ['after-row', 'distant'], phase: 'evening' }, turns: [['b', "Goodnight."]], beat: "{b} turns over to face the wall. {a} lies awake, looking at the ceiling." },
      { when: { of: ['after-row', 'distant'] }, turns: [], beat: "Neither of them says anything else. Neither of them sleeps for a long time." },
    ],
  },
  notes: [
    { stage: "Lights out. {a} and {b} whisper about the day." },
  ],
});
