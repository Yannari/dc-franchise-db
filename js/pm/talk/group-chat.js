// ══════════════════════════════════════════════════════════════════════
// pm/talk/group-chat.js — {a} tells the others what just happened
// ══════════════════════════════════════════════════════════════════════
//
// The villa reacting (pm/threads.js reactions): the one something happened
// to, with two or three friends, telling it and hearing what they think. The
// friends take a side, and now they know. {x} is who it is about. `subj`:
//   pulled        {x} pulled {a}, who is with {pa}: "what did {x} want?"
//   found-out     {a} has just been told what {x}, {a}'s partner, did
//   row           {a} has just had it out with {x}
//   knocked-back  {a} asked {x} for more (exclusive, official, "I love you") and didn't get it
//   shut-down     {x} told {a} to back off
//   celebrate     {a} and {x} have just gone exclusive, official, or said it
//   progress      {a} and {x} are getting serious, and the friends want details
// `cast` is how many are in it (2-4): {c} and {d} speak only when they're there.
//   gather  where they are, and the first question
//   tell    {a} tells it — the long turn
//   react   {b}'s take
//   react2  {c}'s take, a different one
//   verdict where they land
//   close   how they leave it
import { build } from './build.js';

const THREE = [3, 4];

export const GROUP_CHAT = build('group-chat', {
  stages: [
    { stage: "{a}, {b} and the others are on the daybeds, heads together." },
    { stage: "{a} and the others are crowded round the end of a bed in the bedroom." },
  ],
  plans: {
    featured: ['gather', 'tell', 'react', 'react2?', 'verdict', 'close'],
    short: ['tell', 'react'],
  },
  moves: {
    gather: [
      { stage: "{a} walks back to the daybeds, and the others shuffle up to make room before {a} has even sat down.", turns: [
        ['b', "Sit. Sit down. Tell us everything."],
        ['a', "Give me a second to breathe."],
        ['b', "No. Everything. Now."],
      ] },
      { stage: "{a} comes into the dressing room. The others stop what they're doing.", turns: [
        ['b', "Well?"],
        ['a', "How do you know something happened?"],
        ['b', "Because your face is doing that thing."],
      ] },
      { stage: "On the roof terrace, {b} and the others are waiting for {a}.", turns: [
        ['b', "There {a} is. Come on. We've been dying up here."],
        ['a', "You lot are worse than the cameras."],
      ] },
      { when: { subj: ['found-out', 'row'] }, stage: "{a} comes back from the garden with red eyes. {b} is up off the daybed straight away.", turns: [
        ['b', "Hey. Hey. Come here. What's happened?"],
        ['a', "I'm fine. I'm fine. I just need to sit down."],
      ] },
      { when: { subj: 'celebrate' }, stage: "{a} walks back into the villa with the biggest smile, and the others start screaming before anyone has said anything.", turns: [
        ['b', "No! No way! Did it happen?"],
        ['a', "Let me get in the door!"],
      ] },
    ],
    tell: [
      // pulled
      { when: { subj: 'pulled', taken: true }, turns: [
        ['a', "Okay, so. {x} pulls me, right, and I'm thinking it's just going to be a get-to-know-you chat, because I'm with {pa} and everyone knows that. And {x} just comes straight out with it. Says {x} likes me. Says {x} has liked me since the first day, and {x} wants to see where it goes."],
        ['b', "Shut up. With {pa} right there in the villa?"],
        ['a', "With {pa} right there in the villa."],
      ] },
      { when: { subj: 'pulled', taken: true }, turns: [
        ['a', "I don't even know how to explain it. {x} was really nice. Like, really nice. Asked loads of questions, actually listened to the answers. And I'm sitting there going, this is lovely, but I'm in a couple. What am I doing?"],
        ['b', "And what did you say?"],
        ['a', "I said I'm with {pa}. But I didn't exactly get up and leave, did I?"],
      ] },
      { when: { subj: 'pulled', taken: true }, turns: [
        ['a', "So that was awkward. {x} basically told me {x} is going to go for it, whether I'm with {pa} or not. Like, a warning. A nice warning, but a warning."],
        ['b', "That's actually quite bold."],
        ['a', "It's very bold. I didn't know where to look."],
      ] },
      // found-out
      { when: { subj: 'found-out', hasWith: false }, turns: [
        ['a', "I've just been told something about {x}. Something {x} did behind my back. And everyone else apparently knew before me. I'm sitting there being all lovey-dovey, and the whole villa is looking at me like I'm the last to know. Because I was."],
        ['b', "I didn't know. I swear I didn't know."],
        ['a', "I know you didn't. I can tell by your face."],
      ] },
      { when: { subj: 'found-out' }, turns: [
        ['a', "I feel sick. I actually feel sick. I trusted {x}. I told {x} things I haven't told anyone in here. And the whole time, {x} was doing that."],
        ['b', "Have you spoken to {x} yet?"],
        ['a', "Not yet. I don't trust myself to be calm."],
      ] },
      // row
      { when: { subj: 'row' }, turns: [
        ['a', "So that went well."],
        ['b', "What happened? We could hear raised voices from the kitchen."],
        ['a', "I asked {x} a simple question, and {x} made it all about me. Like I'm the problem for asking. I came out of it apologising, and I don't even know what for."],
      ] },
      { when: { subj: 'row' }, turns: [
        ['a', "I can't even, honestly. I sat down with {x} to have a calm chat, and it just went from nothing to everything. I said one thing, {x} said another, and now we're not speaking."],
        ['b', "Do you want us to go and talk to {x}?"],
        ['a', "No. God, no. Please don't make it worse."],
      ] },
      // knocked-back
      { when: { subj: 'knocked-back' }, turns: [
        ['a', "So I asked {x}. I actually did it. And {x} said not yet. Not yet. I put myself out there, in front of everyone, and got a not yet."],
        ['b', "Oh, babe."],
        ['a', "Don't oh-babe me. I'll cry."],
      ] },
      { when: { subj: 'knocked-back' }, turns: [
        ['a', "I feel like such an idiot. I really thought we were on the same page. I was so sure. And then {x} just looked at me, and I knew before {x} even said anything."],
        ['b', "You're not an idiot. You were honest. That's the opposite of an idiot."],
      ] },
      // shut-down
      { when: { subj: 'shut-down' }, turns: [
        ['a', "Well, that's that, then. {x} told me to back off. Very nicely. Very politely. Which somehow makes it worse."],
        ['b', "Ah. I'm sorry."],
        ['a', "It's fine. I knew it was a long shot. I just didn't think it would be this short."],
      ] },
      { when: { subj: 'shut-down' }, turns: [
        ['a', "So {x} has made it very clear. Not interested. Happy where {x} is. Please stop asking for chats."],
        ['b', "Ouch."],
        ['a', "Yeah. Ouch is right."],
      ] },
      // celebrate
      { when: { subj: 'celebrate', of: ['exclusive', 'official'] }, turns: [
        ['a', "It happened. Me and {x}. We're actually doing this. {x} looked at me, and I swear my heart stopped, and I just said yes before {x} had even finished the question."],
        ['b', "I'm going to cry. I'm actually going to cry."],
        ['a', "Don't, or I'll start!"],
      ] },
      { when: { subj: 'celebrate', of: 'official' }, turns: [
        ['a', "Okay, so. You know how I said I wasn't going to get attached in here?"],
        ['b', "Oh no."],
        ['a', "Me and {x}. It's official."],
        ['b', "Oh, YES!"],
      ] },
      { when: { subj: 'celebrate', of: 'exclusive' }, turns: [
        ['a', "So. You know how I've been saying I'm keeping my options open?"],
        ['b', "Yes…"],
        ['a', "I'm not any more. {x} asked me to be exclusive, and I said yes."],
        ['b', "Stop it. Come here!"],
      ] },
      { when: { subj: 'celebrate', of: 'love' }, turns: [
        ['a', "{x} said it. We were lying on the daybeds, and {x} just looked at me and said it. I love you. Out of nowhere."],
        ['b', "No. And did you say it back?"],
        ['a', "I said it back before I'd even thought about it. And I meant it."],
      ] },
      { when: { subj: 'celebrate', of: 'love' }, turns: [
        ['a', "I need to tell you something and you have to promise not to scream. {x} told me {x} loves me. And I said it back."],
        ['b', "I'm screaming. I'm sorry, I'm screaming."],
      ] },
      // progress
      { when: { subj: 'progress' }, turns: [
        ['b', "So. You and {x}. Don't think we haven't noticed."],
        ['a', "Noticed what?"],
        ['b', "The looks. The hand-holding at dinner. The way you two disappear for a chat every time there's a free minute."],
        ['a', "We don't disappear!"],
      ] },
      { when: { subj: 'progress' }, turns: [
        ['b', "Can we talk about the fact that you've basically moved into {x}'s side of the bed?"],
        ['a', "That's not true."],
        ['b', "Your pillow is on {x}'s side."],
        ['a', "Okay, that's true."],
      ] },
    ],
    react: [
      { when: { subj: 'pulled', taken: true }, turns: [
        ['b', "Okay, but how did you feel? Not what you said. How did you feel?"],
        ['a', "That's the problem. I don't know."],
        ['b', "That's an answer, though, isn't it?"],
      ] },
      { when: { subj: 'pulled', taken: true }, turns: [
        ['b', "Right. You need to tell {pa} before someone else does. You know how this place works. If {pa} hears it from anyone but you, it's going to look ten times worse."],
        ['a', "But nothing happened."],
        ['b', "Doesn't matter. It's how it looks."],
      ] },
      { when: { subj: 'found-out' }, turns: [
        ['b', "You don't deserve that. You've been nothing but loyal. And {x} has been walking around here like butter wouldn't melt."],
        ['a', "That's what hurts. The face. The whole time, that face."],
      ] },
      { when: { subj: 'found-out' }, turns: [
        ['b', "Do not let {x} talk you round. I know what you're like. {x} will cry, and say sorry, and you'll be back on the daybed by dinner."],
        ['a', "I won't."],
        ['b', "You will. I've seen you."],
      ] },
      { when: { subj: 'row' }, turns: [
        ['b', "You're allowed to ask questions. That doesn't make you the problem. If {x} can't handle a simple question, that's {x}'s problem."],
        ['a', "Then why do I feel so bad?"],
        ['b', "Because you care. That's all."],
      ] },
      { when: { subj: 'row' }, turns: [
        ['b', "Honestly, I think you both just need to sleep on it. You're both wound up. Nothing good gets said when you're both like that."],
        ['a', "Maybe. I just hate going to bed on a row."],
      ] },
      { when: { subj: 'knocked-back' }, turns: [
        ['b', "Not yet isn't no. Not yet means {x} is still in it, just slower than you. Some people are slow. Doesn't mean they're not coming."],
        ['a', "You think?"],
        ['b', "I think. Give it a few days."],
      ] },
      { when: { subj: 'knocked-back' }, turns: [
        ['b', "Honestly? I'd be careful. You've been all in from the start, and I've been waiting for {x} to match it. I'm not sure {x} is going to."],
        ['a', "Thanks. Really making me feel better."],
        ['b', "I'm not here to make you feel better. I'm here to stop you getting hurt."],
      ] },
      { when: { subj: 'shut-down' }, turns: [
        ['b', "You tried. That's more than most people in here would have done. Plenty more fish."],
        ['a', "In a villa this size? There are about four fish."],
      ] },
      { when: { subj: 'shut-down' }, turns: [
        ['b', "Honestly, it's better to know. Now you're not wasting days on someone who's not looking back at you."],
        ['a', "I know. I know. It still stings."],
      ] },
      { when: { subj: 'celebrate' }, turns: [
        ['b', "I'm so happy for you. Like, genuinely. When you two first got together, I wasn't sure, but {x} looks at you like you're the only one in the villa."],
        ['a', "Stop it. You're going to set me off."],
      ] },
      { when: { subj: 'celebrate' }, turns: [
        ['b', "How did {x} do it? Tell me exactly. Word for word."],
        ['a', "I can't remember word for word. I was too busy trying not to cry."],
        ['b', "Useless. Absolutely useless."],
      ] },
      { when: { subj: 'progress' }, turns: [
        ['b', "I love it. I love it for you. It's so nice seeing you actually happy in here, instead of stressing about every recoupling."],
        ['a', "I am happy. Is that mad?"],
        ['b', "It's not mad. It's the point."],
      ] },
      { when: { subj: 'progress' }, turns: [
        ['b', "So when's {x} asking you, then? Because it's coming. We can all see it coming."],
        ['a', "Don't. You'll jinx it."],
      ] },
    ],
    react2: [
      { when: { subj: 'pulled', cast: THREE }, turns: [
        ['c', "Can I just say? I've seen how {x} looks at you. This isn't a one-off chat. {x} is going to keep coming back."],
        ['a', "Great. Thanks. Love that for me."],
      ] },
      { when: { subj: 'found-out', cast: THREE }, turns: [
        ['c', "I'm going to say what everyone's thinking. I never fully trusted {x}. There was always something."],
        ['b', "That's not helping."],
        ['c', "I'm not trying to help. I'm being honest."],
      ] },
      { when: { subj: 'row', cast: THREE }, turns: [
        ['c', "I'm going to play devil's advocate for a second. Is there any chance {x} was just caught off guard? Like, you went in quite hot."],
        ['a', "Whose side are you on?"],
        ['c', "Yours. Always yours. That's why I'm saying it."],
      ] },
      { when: { subj: ['knocked-back', 'shut-down'], cast: THREE }, turns: [
        ['c', "For what it's worth, I think {x} is going to regret it. You're a catch. {x} just hasn't realised yet."],
        ['a', "You have to say that. You're my friend."],
        ['c', "I don't have to say anything. I'm saying it because it's true."],
      ] },
      { when: { subj: ['celebrate', 'progress'], cast: THREE }, turns: [
        ['c', "I called it. Day one, I said those two. Didn't I say it?"],
        ['b', "You said it about everyone."],
        ['c', "And this time I was right."],
      ] },
    ],
    verdict: [
      { when: { subj: 'pulled', taken: true }, turns: [
        ['a', "Right. I'm going to find {pa}, and I'm going to tell {pa} everything, before anyone else does."],
        ['b', "Good. That's the right thing."],
      ] },
      { when: { subj: 'pulled', taken: true }, turns: [
        ['a', "I'm not going to do anything. I'm with {pa}. It was one chat."],
        ['b', "Okay. Just be honest with yourself, though."],
      ] },
      { when: { subj: 'found-out' }, turns: [
        ['a', "I'm not going to cry over {x} tonight. I'm going to get dressed, I'm going to look amazing, and I'm going to let {x} sweat."],
        ['b', "That's the spirit."],
      ] },
      { when: { subj: 'found-out' }, turns: [
        ['a', "I need to hear it from {x}. I need {x} to look me in the eye and say it."],
        ['b', "And if {x} lies?"],
        ['a', "Then I'll know exactly who I'm dealing with."],
      ] },
      { when: { subj: 'row' }, turns: [
        ['a', "I'll talk to {x} in the morning. When we've both calmed down."],
        ['b', "Sleep on it. It always looks different in the morning."],
      ] },
      { when: { subj: ['knocked-back', 'shut-down'] }, turns: [
        ['a', "Okay. I'm allowed to be sad about it for one night. Then I'm done."],
        ['b', "One night. Then we go again."],
      ] },
      { when: { subj: ['celebrate', 'progress'] }, turns: [
        ['a', "Can we please talk about someone else now? I'm going bright red."],
        ['b', "Absolutely not. We're talking about this all night."],
      ] },
    ],
    close: [
      { turns: [], beat: "{b} pulls {a} into a hug, and the others pile on." },
      { turns: [['b', "Whatever happens, you've got us."], ['a', "I know. I love you lot."]] },
      { when: { subj: ['celebrate', 'progress'] }, turns: [], beat: "The others start chanting, and {a} hides {a.posAdj} face in a pillow." },
      { when: { subj: ['found-out', 'row', 'knocked-back', 'shut-down'] }, turns: [], beat: "Nobody says anything for a moment. {b} just keeps an arm round {a}." },
    ],
  },
  notes: [
    { stage: "{a} tells the others about {x}, and they all have something to say." },
  ],
});
