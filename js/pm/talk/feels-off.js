// ══════════════════════════════════════════════════════════════════════
// pm/talk/feels-off.js — {a} asks {b}: "has {c} said anything to you?"
// ══════════════════════════════════════════════════════════════════════
//
// A doubt's second beat (pm/threads.js): {c}, {a}'s partner, has been going
// off {a}, and {a} feels it. {a} asks a friend. `of`:
//   told    {b} heard {c} moan about {a} (events.js vent) and says so
//   covers  {b} heard it, and keeps {c}'s secret
//   unsure  {b} knows nothing, and says what {b} has seen
//   open    {a} brings it up
//   ask     the question
//   answer  {b}'s answer
//   close   how it leaves {a}
import { build } from './build.js';

export const FEELS_OFF = build('feels-off', {
  stages: [
    { stage: "{a} and {b} are folding towels in the bedroom." },
    { stage: "{a} sits down next to {b} on the steps by the pool." },
  ],
  plans: {
    featured: ['open', 'ask', 'answer', 'close'],
    short: ['ask', 'answer'],
  },
  moves: {
    open: [
      { stage: "{a} and {b} are playing cards in the dressing room. {a} has gone quiet.", turns: [
        ['b', "You've stopped talking. You never stop talking."],
        ['a', "I'm just thinking."],
        ['b', "About {c}?"],
        ['a', "Is it that obvious?"],
      ] },
      { stage: "{a} and {b} are on the sunbeds. {a} keeps glancing over at {c}, who is laughing with somebody else across the pool.", turns: [
        ['a', "Can I ask you something, and you be honest with me?"],
        ['b', "Always."],
      ] },
      { stage: "{a} catches {b} on the stairs.", turns: [
        ['a', "Have you got two minutes? I need a second opinion."],
        ['b', "On what?"],
        ['a', "On whether I'm going mad."],
      ] },
    ],
    ask: [
      { turns: [
        ['a', "Has {c} said anything to you? About me? About us? Because something's off, and I can't work out what, and you're closer to {c} than anyone."],
        ['b', "Like what?"],
        ['a', "Like anything. Like, is {c} going off me?"],
      ] },
      { turns: [
        ['a', "{c} has been weird with me for two days. Not horrible. Just, like, half there. And I keep asking if everything's okay and {c} keeps saying it's fine. And it's not fine. I know it's not fine."],
        ['b', "Have you actually asked {c} straight out?"],
        ['a', "I'm asking you first. In case I'm about to make a fool of myself."],
      ] },
      { turns: [
        ['a', "Be honest. From the outside, what do me and {c} look like right now?"],
        ['b', "What do you mean?"],
        ['a', "I mean, do we look like a couple who's into each other? Because from the inside it doesn't feel like it."],
      ] },
    ],
    answer: [
      { when: { of: 'told' }, turns: [
        ['b', "Okay. I really didn't want to be the one to say this. {c} did talk to me. About you. {c} said {c} isn't sure any more. That it's not what it was. I didn't know whether to tell you, and I've felt sick about it all day."],
        ['a', "{c} said that? To you?"],
        ['b', "I'm sorry. I'd want to know, if it was me."],
      ] },
      { when: { of: 'told' }, turns: [
        ['b', "I'm going to tell you, because you're my friend and you're asking me straight. {c} had a moan to me. About feeling bored, and not being sure. I'm not saying it's over. I'm saying {c} has doubts, and you deserve to hear that."],
        ['a', "Right. Okay. Wow."],
        ['b', "Please don't tell {c} it came from me."],
      ] },
      { when: { of: 'covers' }, turns: [
        ['b', "I don't think it's my place to say. You need to ask {c}, not me."],
        ['a', "That's a yes, then."],
        ['b', "That's not a yes. That's a talk to {c}."],
        ['a', "That's absolutely a yes."],
      ] },
      { when: { of: 'covers' }, turns: [
        ['b', "Honestly, I think you're overthinking it. Everyone gets a bit flat in here after a few days. I wouldn't read into it."],
        ['a', "You'd tell me, though? If you knew something?"],
        ['b', "Of course I would."],
      ], beat: "{b} looks away as {b} says it." },
      { when: { of: 'unsure' }, turns: [
        ['b', "{c} hasn't said anything to me. But I'll be honest, I've noticed it too. You're doing all the work. You go over, you start the chats, you sit next to {c.obj}. I can't remember the last time {c} came to find you."],
        ['a', "Thanks. That's really reassuring."],
        ['b', "You asked me to be honest!"],
      ] },
      { when: { of: 'unsure' }, turns: [
        ['b', "I genuinely don't know. {c} hasn't said a word to me. But if you're feeling it, you're probably not making it up. You need to talk to {c}, not me."],
        ['a', "I know. I'm scared of what the answer is."],
        ['b', "Better to know, though, isn't it?"],
      ] },
    ],
    close: [
      { turns: [['a', "I'm going to talk to {c} tonight."], ['b', "Do you want me to come?"], ['a', "Yeah, and hold my hand the whole time."], ['b', "Ha. I'll be on the daybeds if you need me."]] },
      { turns: [], beat: "{a} looks across at {c} for a long moment, then looks away." },
      { turns: [['b', "Whatever happens, you're going to be fine."], ['a', "I know. I just wish I didn't have to find out."]] },
    ],
  },
  notes: [
    { stage: "{a} asks {b} whether {c} has said anything about {a.obj}." },
  ],
});
