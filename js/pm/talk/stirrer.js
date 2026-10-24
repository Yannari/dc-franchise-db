// ══════════════════════════════════════════════════════════════════════
// pm/talk/stirrer.js — going after the one who told (pm/events.js callOutStirrer)
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-24: "like they could confront the stirrer of their
// partner/coupled up if they care enough".
//   stirrer-confront [a, b, c]  {a} has it out with {b}, who told {c}. {c} is
//                               talked about, never in the room.
//   `side`  them     {a} is the one it was about; {c} is {a}'s partner
//           partner  {a} is the one {b} told, and believes {c} over {b}
//   `why`   asked    {a} knows because of a conversation with {c}
//           heard    it got back round the villa
//   `of`    {b}'s answer: stands · sorry · denies (only when `heard`) · back
//   `end`   cleared · cold · feud
//   open     {a} finds {b}
//   charge   what {a} says {b} did
//   answer   {b}'s answer
//   push     {a} presses
//   close    how they leave it
import { build } from './build.js';

const W = (when, ...turns) => ({ when, turns });
const S = (when, stage, ...turns) => ({ when, stage, turns });

export const STIRRER_CONFRONT = build('stirrer-confront', {
  tiered: false,
  plans: {
    featured: ['open', 'charge', 'answer', 'push?', 'close'],
    short: ['open', 'answer', 'close'],
  },
  moves: {
    open: [
      S({}, "{a} walks straight past everyone and stops in front of {b}.", ['a', "You and me need a chat."], ['b', "Do we?"], ['a', "Yeah. We do."]),
      S({}, "{a} finds {b} by the pool and sits down without being asked.", ['b', "Hi?"], ['a', "Don't 'hi' me. You know why I'm here."]),
      S({}, "{a} catches {b} on the stairs.", ['a', "Got a minute? Actually, I don't care if you've got a minute."], ['b', "Okay. Wow."]),
      S({ reg: 'big' }, "{a} marches across the lawn, and the others go very quiet.", ['a', "{b}! A word. Now."], ['b', "Here we go."]),
      S({ reg: 'sharp' }, "{a} pulls up a sunbed next to {b} and doesn't lie down on it.", ['a', "I'll be quick, because I'm not in the mood."], ['b', "Go on, then."]),
      S({ reg: 'soft' }, "{a} sits down next to {b} on the daybed, very calmly. Too calmly.", ['a', "Can I ask you something? And can you be honest with me?"], ['b', "Depends what it is."]),
      S({ reg: 'dry' }, "{a} walks up to {b} and smiles. It is not a nice smile.", ['a', "So. Busy day?"], ['b', "What's that supposed to mean?"]),
      S({ reg: 'nervy' }, "{a} hovers next to {b} for a second before sitting down.", ['a', "I don't like doing this. But I've got to say something."], ['b', "Okay. What's up?"]),
      W({}, ['a', "I want to talk to you. Seriously. No laughing it off."], ['b', "Fine. Talk."]),
      S({ side: 'them' }, "{a} has clearly been working up to this for a while.", ['a', "I'm only going to ask once, so I'd like an honest answer."], ['b', "About what?"], ['a', "You know about what."]),
      S({ side: 'partner' }, "{a} finds {b} in the dressing room and closes the door.", ['a', "I've spoken to {c}."], ['b', "Right."], ['a', "So now I'm speaking to you."]),
      W({ side: 'partner' }, ['a', "Remember what you came and told me earlier? I want to talk about that."], ['b', "I knew this was coming."]),
    ],

    charge: [
      // About {a}: {b} told {a}'s partner.
      W({ side: 'them', why: 'asked' }, ['a', "{c} came and had it out with me. And funnily enough, your name came up."], ['b', "Did it."]),
      W({ side: 'them', why: 'asked' }, ['a', "You went running to {c} about me. Why? What's in it for you?"]),
      W({ side: 'them', why: 'asked' }, ['a', "I've just had the worst conversation of my life with {c}. And I've got you to thank for it."], ['b', "Don't put that on me."]),
      W({ side: 'them', why: 'asked' }, ['a', "{c} told me who said it. So don't sit there and look surprised."]),
      W({ side: 'them', why: 'heard' }, ['a', "I hear you've been talking to {c} about me."], ['b', "Who said that?"], ['a', "Everyone in this villa says everything. You should know. You're the worst for it."]),
      W({ side: 'them', why: 'heard' }, ['a', "Word gets round in here. And the word is, you've been filling {c}'s head with stuff about me."]),
      W({ side: 'them', why: 'heard' }, ['a', "Three different people have told me you've had a chat with {c}. About me. Behind my back."]),
      W({ side: 'them', sec: 'kiss' }, ['a', "You told {c} about the kiss. Before I'd even had a chance to."]),
      W({ side: 'them', sec: 'pull' }, ['a', "It was a chat. One chat. And you made it sound like I'd run off with someone."]),
      W({ side: 'them', sec: 'said' }, ['a', "You repeated what I said to {c}. Word for word, apparently. Do you know how that made me look?"]),
      W({ side: 'them' }, ['a', "Whatever I did, it was mine to tell {c}. Not yours."]),
      W({ side: 'them' }, ['a', "If you had a problem with me, you could have come to me. You went to {c} instead."]),
      W({ side: 'them', reg: 'big' }, ['a', "You don't get to decide what {c} hears about me! That's not your job!"]),
      // The one told, back at {b}.
      W({ side: 'partner' }, ['a', "I've talked to {c}. I believe {c}. So either you got it badly wrong, or you made it up."]),
      W({ side: 'partner' }, ['a', "You came to me with all that about {c}, and it's not true. Do you know what you nearly did?"]),
      W({ side: 'partner' }, ['a', "I nearly ended things with {c} because of you. Because of something you think you saw."]),
      W({ side: 'partner', reg: 'sharp' }, ['a', "Next time you've got something to say about {c}, make sure it's true first."]),
      W({ side: 'partner', reg: 'soft' }, ['a', "I know you thought you were helping. You weren't. {c} didn't do it."]),
    ],

    answer: [
      // Stands by it.
      W({ of: 'stands', side: 'them' }, ['b', "I told {c} because {c} deserved to know. I'd do it again."], ['a', "Of course you would."]),
      W({ of: 'stands', side: 'them' }, ['b', "Don't make me the bad guy. I'm not the one who did it. You are."]),
      W({ of: 'stands', side: 'them' }, ['b', "If I was in {c}'s shoes, I'd want somebody to tell me. So I did."], ['a', "You're not in {c}'s shoes, though, are you?"]),
      W({ of: 'stands', side: 'them', bReg: 'sharp' }, ['b', "Everything I said was true. If you didn't want it said, you shouldn't have done it."]),
      W({ of: 'stands', side: 'partner' }, ['b', "I know what I saw. You can believe what you like."], ['a', "I will, thanks."]),
      W({ of: 'stands', side: 'partner' }, ['b', "I'm not going to say sorry for looking out for you. I told you what I saw."]),
      W({ of: 'stands', side: 'partner', bReg: 'soft' }, ['b', "I really hope I'm wrong. I do. But I'm not going to pretend I didn't see it."]),
      // Says sorry.
      W({ of: 'sorry' }, ['b', "Okay. You're right. I should have kept out of it. I'm sorry."], ['a', "Are you, though?"], ['b', "Yeah. I am."]),
      W({ of: 'sorry', side: 'them' }, ['b', "I thought I was doing the right thing for {c}. I didn't think about what it would do to you."]),
      W({ of: 'sorry', side: 'them' }, ['b', "I shouldn't have gone to {c} before coming to you. That was wrong. I know that."]),
      W({ of: 'sorry', side: 'partner' }, ['b', "Maybe I got it wrong. If I did, I'm really sorry. To you and to {c}."]),
      W({ of: 'sorry', side: 'partner' }, ['b', "I didn't want to cause trouble. I honestly thought you'd want to know."], ['a', "I'd want to know the truth."]),
      W({ of: 'sorry', bReg: 'nervy' }, ['b', "I'm sorry. I'm really sorry. I didn't think it would turn into all this."]),
      // Denies telling at all.
      W({ of: 'denies' }, ['b', "I haven't said a word to {c} about you. Not one."], ['a', "That's funny, because that's not what I've heard."]),
      W({ of: 'denies' }, ['b', "Whoever told you that is stirring. It wasn't me."], ['a', "So it's someone else stirring now?"]),
      W({ of: 'denies', bReg: 'sharp' }, ['b', "No. Wasn't me. Next."], ['a', "There is no next."]),
      // Fires back.
      W({ of: 'back' }, ['b', "Do you know what? Don't come over here having a go at me. Look at yourself first."]),
      W({ of: 'back', side: 'them' }, ['b', "Oh, so it's my fault now? You did it, and I'm the one getting shouted at?"], ['a', "I'm not shouting."], ['b', "You're about to."]),
      W({ of: 'back', side: 'them' }, ['b', "You're only angry because you got caught. That's all this is."]),
      W({ of: 'back', side: 'partner' }, ['b', "You're so blind, it's unbelievable. Fine. Believe {c}. See where it gets you."]),
      W({ of: 'back', bReg: 'big' }, ['b', "Don't you dare point at me like that! I did you a favour!"]),
    ],

    push: [
      W({ side: 'them', why: 'asked' }, ['a', "What did you think would happen? Honestly? What did you think {c} would do?"]),
      W({ side: 'them', why: 'heard' }, ['a', "Did you think it wouldn't get back to me? In here?"]),
      W({ side: 'them' }, ['a', "You've never once come and talked to me. Not once. But you'll talk about me."]),
      W({ side: 'them' }, ['a', "Do you like {c}? Is that what this is?"], ['b', "Don't be ridiculous."]),
      W({ side: 'partner' }, ['a', "Have you ever thought that maybe you didn't see what you think you saw?"]),
      W({ side: 'partner' }, ['a', "I trusted you. I listened to you over {c}. I'm not doing that again."]),
      W({}, ['a', "Stay out of my relationship. That's all I'm asking."]),
      W({ reg: 'dry' }, ['a', "Next time you want to tell someone something, try a diary."]),
      W({ reg: 'big' }, ['a', "Everyone's sick of it! The whispering, the little chats. Everyone!"]),
    ],

    close: [
      // Cleared.
      W({ end: 'cleared' }, ['a', "Fine. Just come to me next time."], ['b', "I will. Promise."]),
      W({ end: 'cleared' }, ['a', "Okay. I appreciate you saying sorry. I do."], ['b', "We're alright?"], ['a', "We're alright."]),
      S({ end: 'cleared' }, "They sit there in silence for a moment, then {b} holds out a hand. {a} shakes it.", ['a', "Clean slate."]),
      W({ end: 'cleared', reg: 'dry' }, ['a', "Right. Truce. But I'm watching you."], ['b', "Fair."]),
      // Cold.
      W({ end: 'cold' }, ['a', "I've said what I wanted to say."], ['b', "Great. Are we done?"], ['a', "We're done."]),
      S({ end: 'cold' }, "{a} gets up and walks off. {b} stays put, staring at the pool.", ['b', "Brilliant."]),
      W({ end: 'cold' }, ['a', "I'm not going to fall out with you. But I'm not going to trust you, either."]),
      S({ end: 'cold' }, "Neither of them says anything else. After a while, {a} just leaves."),
      W({ end: 'cold', reg: 'sharp' }, ['a', "Just keep my name out of your mouth. That's all."]),
      // Feud.
      S({ end: 'feud' }, "{a} storms off. {b} shouts something after {a.obj}, and half the villa turns round.", ['b', "Yeah, walk away! You always do!"]),
      W({ end: 'feud' }, ['a', "Don't speak to me. Seriously. Don't come near me."], ['b', "Happy to."]),
      W({ end: 'feud' }, ['b', "You know what? Go and cry to {c}. You're good at that."], ['a', "Unbelievable."]),
      S({ end: 'feud' }, "It ends with both of them on their feet, both talking at once, and neither listening.", ['a', "This isn't over."], ['b', "Good."]),
      S({ end: 'feud', reg: 'big' }, "{a} kicks a cushion off the daybed on the way past.", ['a', "Stay away from me! And stay away from {c}!"]),
    ],
  },
  notes: [
    { when: { side: 'them' }, stage: "{a} has it out with {b} for telling {c}." },
    { when: { side: 'partner' }, stage: "{a} tells {b} that {c} didn't do it, and that {b} should stay out of it." },
    { stage: "{a} goes and finds {b} about what {b} said to {c}." },
  ],
});
