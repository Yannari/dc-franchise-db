// ══════════════════════════════════════════════════════════════════════
// pm/talk/where-head.js — {a} asks {b}: "what was that?" / "where's your head at?"
// ══════════════════════════════════════════════════════════════════════
//
// The turn of two stories (pm/threads.js whereHead). `story`:
//   graft  {b} went off with {c} for a chat, and {a} saw it or was told.
//   doubt  {b} has been off with {a}, and {a} has felt it. `why` is what's
//          really behind it (ick · eyes · behind · cooling); {a} doesn't know
//          that, only {b} does. {c}, when there is one, is who {b} looks at.
// `of` is {b}'s answer, decided by the engine from what {b} feels and how
// honest {b} is built to be: reassure · honest · deflect · lie (a lie only
// ever about a kiss, and only from somebody who may scheme). `kissed`: {b}
// really did kiss {c}, and {a} doesn't know.
//   open    {a} gets {b} on their own
//   ask     {a} puts it to {b}
//   answer  {b}'s answer — the long turn
//   push    {a} on the answer
//   close   how they leave it
import { build } from './build.js';

export const WHERE_HEAD = build('where-head', {
  stages: [
    { stage: "{a} and {b} sit down on the end of the bed in the empty bedroom." },
    { stage: "{a} takes {b} up to the roof terrace, where it's quiet." },
  ],
  plans: {
    featured: ['open', 'ask', 'answer', 'push', 'close'],
    short: ['ask', 'answer', 'close'],
  },
  moves: {
    open: [
      { stage: "{a} waits until {b} is on {b.posAdj} own by the pool, then walks over.", turns: [
        ['a', "Can I grab you for a minute?"],
        ['b', "Of course. What's up?"],
        ['a', "Not here. Somewhere we can actually talk."],
      ] },
      { stage: "{a} finds {b} in the dressing room and shuts the door behind {a.obj}.", turns: [
        ['b', "That's a serious door shut."],
        ['a', "It's a serious chat."],
        ['b', "Okay. Sit down, then."],
      ] },
      { stage: "{a} and {b} are on the daybeds. Everyone else has gone inside, and {a} hasn't said a word for a while.", turns: [
        ['b', "You're quiet."],
        ['a', "Yeah. I've been thinking."],
        ['b', "That sounds bad."],
        ['a', "It depends what you say next."],
      ] },
      { stage: "{a} sits down next to {b} on the swing seat and doesn't lean in like usual.", turns: [
        ['b', "Hello, you. You all right?"],
        ['a', "I don't know. That's sort of why I wanted to talk."],
      ] },
    ],
    ask: [
      // {b} went after {c} this time ({a} is the chaser's partner, threads.js).
      { when: { story: 'graft', chaser: true }, turns: [
        ['a', "I'm just going to say it. Why did you pull {c}?"],
        ['b', "It was a chat."],
        ['a', "You walked across the whole garden to get {c}, in front of everyone. In front of me. That's not a chat. That's a statement."],
      ] },
      { when: { story: 'graft', chaser: true }, turns: [
        ['a', "Everyone in this villa knew before I did. Do you know how that feels? Being the last one to find out you went and got {c}?"],
        ['b', "I was going to tell you."],
        ['a', "When?"],
      ] },
      { when: { story: 'graft', chaser: false }, turns: [
        ['a', "I'm just going to say it, because I've been stewing on it all day and I can't do it any more. What was that with {c}?"],
        ['b', "What was what?"],
        ['a', "Don't. You know what. {c} pulled you, and you went, and you were gone for ages. And then you came back and didn't say a word to me about it."],
      ] },
      { when: { story: 'graft' }, turns: [
        ['a', "So. You and {c}."],
        ['b', "Me and {c} what?"],
        ['a', "That's what I'm asking. Everyone saw you go off together. I'm not stupid, and I'm not going to sit here pretending I didn't see it."],
      ] },
      { when: { story: 'graft', chaser: false }, turns: [
        ['a', "I want to ask you something, and I want you to be honest, even if I'm not going to like it."],
        ['b', "Okay…"],
        ['a', "When {c} pulled you earlier. What did {c} say? And what did you say back?"],
      ] },
      { when: { story: 'doubt' }, turns: [
        ['a', "You've been off with me. Not massively. Just, like, a bit. You're not looking at me the same, you're not sitting next to me at dinner, and when I put my arm round you earlier, you basically shrugged it off."],
        ['b', "I didn't shrug it off."],
        ['a', "You did. And I'm not having a go. I just want to know what's going on in your head."],
      ] },
      { when: { story: 'doubt' }, turns: [
        ['a', "Where's your head at? Honestly. Because I feel like I'm trying really hard and you're somewhere else."],
        ['b', "Where's this come from?"],
        ['a', "From the last couple of days. I'm not making it up. I can feel it."],
      ] },
      { when: { story: 'doubt', cast: 3 }, turns: [
        ['a', "Can I ask you something? Is it {c}?"],
        ['b', "Is what {c}?"],
        ['a', "The reason you've gone cold on me. Because I see where you look when you think I'm not looking, and it isn't at me."],
      ] },
    ],
    answer: [
      // ── graft ──
      { when: { story: 'graft', of: 'reassure', kissed: false, chaser: true }, turns: [
        ['b', "I pulled {c} because I wanted to see if there was anything there. And there wasn't. I sat there the whole time thinking about you, and I'm sorry I had to go over there to work that out."],
        ['a', "You had to pull somebody else to work out you liked me?"],
        ['b', "When you say it like that it sounds awful."],
        ['a', "It is awful."],
      ] },
      { when: { story: 'graft', of: 'honest', kissed: false, chaser: true }, turns: [
        ['b', "I'm going to be honest, because you deserve that. I went over to {c} because I've been thinking about {c}. I don't know what it means yet. But I wasn't going to lie to you about it."],
        ['a', "So you've been thinking about {c}. While you've been with me."],
        ['b', "I know. I'm sorry."],
      ] },
      { when: { story: 'graft', of: 'reassure', kissed: false, chaser: false }, turns: [
        ['b', "Okay. Honestly? {c} pulled me, and I went, because I'm not going to be rude to someone. {c} said {c} likes me, and wanted to get to know me. And I said I'm with you, and I'm happy with you, and that's it. That's the whole chat."],
        ['a', "That's it?"],
        ['b', "That's it. I didn't tell you straight away because I didn't want to make it into a thing. I didn't think it was a thing."],
      ] },
      { when: { story: 'graft', of: 'reassure', kissed: false, chaser: false }, turns: [
        ['b', "Look at me. It was a chat. {c} asked me questions, I answered them, and the whole time I was thinking about getting back to you. I know how it looked. But I'm not going anywhere."],
        ['a', "You promise?"],
        ['b', "I promise. I'm exactly where I want to be."],
      ] },
      { when: { story: 'graft', of: 'reassure', kissed: true }, turns: [
        ['b', "I'm here, aren't I? I'm sitting here with you. Not with {c}. Whatever you think you saw, it doesn't change that."],
        ['a', "That's not really an answer."],
        ['b', "It's the only answer that matters. Come here."],
      ] },
      { when: { story: 'graft', of: 'honest', kissed: false, chaser: false }, turns: [
        ['b', "I'm going to be honest with you, because you deserve that. I enjoyed talking to {c}. I didn't expect to, and I'm not saying I'm going to do anything about it, but there's something there, and I want to see what it is."],
        ['a', "Wow."],
        ['b', "I know. I'm sorry. I'd rather say it to your face now than have you find out some other way."],
      ] },
      { when: { story: 'graft', of: 'honest', kissed: true }, turns: [
        ['b', "Okay. I'm going to tell you everything, and then you can be as angry as you want. {c} and I kissed. Earlier, when we went off. It wasn't planned. It just happened, and I've felt sick about it ever since."],
        ['a', "You kissed {c}?"],
        ['b', "Yes. And I'm telling you because I'd rather you hated me for being honest than found out from someone else."],
      ] },
      { when: { story: 'graft', of: 'deflect' }, turns: [
        ['b', "I don't know what you want me to say. It was a chat. Everyone has chats. You talk to people all the time and I don't drag you into a room about it."],
        ['a', "That's not the same and you know it."],
        ['b', "Why isn't it? Because it's me?"],
      ] },
      { when: { story: 'graft', of: 'deflect', chaser: false }, turns: [
        ['b', "Honestly, I think you're reading way too much into this. {c} wanted a chat. I had a chat. Can we not turn it into a whole thing?"],
        ['a', "It's already a thing. That's why I'm asking."],
      ] },
      { when: { story: 'graft', of: 'lie', chaser: true }, turns: [
        ['b', "Nothing happened. I wanted to clear the air with {c} about something, that's all. I'm actually a bit hurt you'd think anything else."],
        ['a', "So nothing happened?"],
        ['b', "Nothing happened. I swear on my life."],
      ] },
      { when: { story: 'graft', of: 'lie', chaser: false }, turns: [
        ['b', "Nothing happened. We talked. {c} asked how things were with us, and I said they're good. That was literally it. I'm actually a bit hurt you'd think anything else."],
        ['a', "So nothing happened?"],
        ['b', "Nothing happened. I swear on my life."],
      ] },
      // ── doubt ──
      { when: { story: 'doubt', of: 'reassure' }, turns: [
        ['b', "It's not you. I promise it's not you. I've just been in my head about everything in here, the recouplings, the public, all of it. I've been off with everyone, not just you."],
        ['a', "Really?"],
        ['b', "Really. And I'm sorry I made you feel like that. I didn't realise it was coming across."],
      ] },
      { when: { story: 'doubt', of: 'reassure' }, turns: [
        ['b', "I've been tired and grumpy and rubbish company, and you've been lovely, and I've been taking it for granted. That's on me. I'm not going anywhere. I'm just having a bad couple of days."],
        ['a', "You can tell me when you're having a bad couple of days, you know."],
        ['b', "I know. I will."],
      ] },
      { when: { story: 'doubt', of: 'honest', why: 'ick' }, turns: [
        ['b', "Okay. I'm just going to be honest. Something's changed for me, and I don't know how to explain it. Nothing massive happened. It's just, one moment I was really into this, and then something small switched, and I haven't been able to switch it back."],
        ['a', "Something small. Like what?"],
        ['b', "That's the worst part. I can't even put my finger on it. I just don't feel what I felt."],
      ] },
      { when: { story: 'doubt', of: 'honest', why: 'eyes', cast: 3 }, turns: [
        ['b', "I'm not going to lie to you. I've been getting on really well with {c}, and it's got me questioning things. I haven't done anything. But I'd be lying if I said my head wasn't turned a bit."],
        ['a', "Turned by {c}."],
        ['b', "A bit. I'm sorry. I didn't want it to be like this."],
      ] },
      { when: { story: 'doubt', of: 'honest', why: 'behind' }, turns: [
        ['b', "Honestly? I think you're further in than I am. Like, you're talking about the outside and meeting families, and I'm still trying to work out if I even want to wake up next to you tomorrow. And every time you say something big, I panic, because I can't say it back."],
        ['a', "So I'm too much."],
        ['b', "No. You're not too much. I'm just not there yet. And I don't know if I'm going to get there."],
      ] },
      { when: { story: 'doubt', of: 'honest', why: ['cooling', 'eyes'] }, turns: [
        ['b', "I think I'm just not as into this as I was. I keep waiting for it to come back, and it isn't. And I hate saying that to you, because you've done nothing wrong."],
        ['a', "Then why?"],
        ['b', "I don't know. Sometimes it just goes, doesn't it?"],
      ] },
      { when: { story: 'doubt', of: ['deflect', 'lie'] }, turns: [
        ['b', "Can we not do this right now? I'm fine. We're fine. You're making it into something it isn't."],
        ['a', "I'm not making it into anything. I'm asking a question."],
        ['b', "And I've answered it. I'm fine."],
      ] },
      { when: { story: 'doubt', of: ['deflect', 'lie'] }, turns: [
        ['b', "I don't know what you want me to say. I've been a bit quiet. Is that a crime now?"],
        ['a', "No. But it's not just quiet. You've been somewhere else."],
        ['b', "I've been right here. I've been here the whole time."],
      ] },
    ],
    push: [
      { when: { of: 'reassure' }, turns: [
        ['a', "Okay. I believe you. I just needed to hear you say it, because my head was going to some dark places."],
        ['b', "You should have just asked me straight away."],
        ['a', "I'm asking now."],
      ] },
      { when: { of: 'reassure' }, turns: [
        ['a', "I'm sorry. I feel stupid now."],
        ['b', "Don't. I'd have been the same if it was the other way round. Probably worse."],
      ] },
      { when: { of: 'honest' }, turns: [
        ['a', "I appreciate you being honest. I really do. But I'm not going to pretend that didn't just hurt, because it did."],
        ['b', "I know. I'd rather you were hurt now than lied to."],
        ['a', "Would you? Because from where I'm sitting, it feels the same."],
      ] },
      { when: { of: 'honest' }, turns: [
        ['a', "So what does that mean for us? Because I need to know where I stand. I'm not going to sit in this bed every night wondering."],
        ['b', "I don't know yet. I'm not going to make you a promise I can't keep."],
        ['a', "That's not an answer."],
        ['b', "It's the only honest one I've got."],
      ] },
      { when: { of: 'deflect' }, turns: [
        ['a', "You're doing that thing where you turn it round on me, so I end up feeling like the crazy one. I'm not crazy. Something's going on, and you won't tell me."],
        ['b', "Nothing is going on."],
        ['a', "Then why won't you look at me?"],
      ] },
      { when: { of: 'deflect' }, turns: [
        ['a', "I'm not asking for a speech. I just want you to tell me I've got nothing to worry about. That's all. And you can't even do that."],
        ['b', "You've got nothing to worry about. Happy?"],
        ['a', "No. Because you said it like that."],
      ] },
      { when: { of: 'lie' }, turns: [
        ['a', "Okay. If you say nothing happened, then nothing happened. I trust you."],
        ['b', "Good. Because you can."],
      ] },
    ],
    close: [
      { when: { of: 'reassure' }, turns: [], beat: "{b} pulls {a} in for a hug, and {a} holds on a bit longer than usual." },
      { when: { of: 'reassure' }, turns: [['b', "Are we good?"], ['a', "We're good."], ['b', "Come here, then."]], beat: "They kiss, and {a} finally relaxes." },
      { when: { of: 'honest' }, turns: [['a', "I need a minute."], ['b', "Take as long as you need."]], beat: "{a} gets up and walks off towards the dressing room, and {b} sits there on {b.posAdj} own." },
      { when: { of: 'honest' }, turns: [], beat: "Neither of them says anything for a long time. Then {a} gets up and goes back inside." },
      { when: { of: 'deflect' }, turns: [['a', "Forget it. Just forget I asked."]], beat: "{a} walks off. {b} watches {a.obj} go, and doesn't follow." },
      { when: { of: 'deflect' }, turns: [['b', "I'm going to get a drink."], ['a', "Of course you are."]], beat: "{b} leaves {a} sitting there on {a.posAdj} own." },
      { when: { of: 'lie' }, turns: [], beat: "{b} kisses {a} on the forehead. Over {a}'s shoulder, {b}'s face gives nothing away." },
    ],
  },
  notes: [
    { stage: "{a} asks {b} straight out what's going on, and doesn't love the answer." },
  ],
});
