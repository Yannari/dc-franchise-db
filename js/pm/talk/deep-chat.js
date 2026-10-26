// ══════════════════════════════════════════════════════════════════════
// pm/talk/deep-chat.js — a couple's real conversation: {a} and {b}
// ══════════════════════════════════════════════════════════════════════
//
// The one where somebody asks the question that matters and the other one
// answers it properly. `end` is the engine's: open ({b} lets {a} in) or
// guarded ({b} keeps {a} out, in proportion to how much {b} keeps people out).
// No invented backstory (docs/pm-dialogue-style.md §3): feelings, fears and
// what they want, never a sister or a divorce the character doesn't have.
//   open      somewhere quiet, a change of tone
//   question  the real question
//   answer    {b}'s answer — the long one, or the deflection
//   mine      {a}'s own answer
//   meaning   what it means for the two of them
//   close     how they leave it
import { build } from './build.js';

export const DEEP_CHAT = build('deep-chat', {
  stages: [
    { stage: "{a} and {b} sit up on the terrace, away from everyone." },
    { stage: "{a} and {b} lie on the daybed, talking quietly." },
    { stage: "{a} and {b} sit on the edge of the pool, feet in the water." },
  ],
  after: ['told', 'pull'],
  leads: ['rowedToday'],
  plans: {
    featured: ['open', 'question', 'answer', 'mine?', 'meaning', 'close'],
    short: ['question', 'answer', 'close'],
  },
  moves: {
    open: [
      { stage: "{a} and {b} sit up on the terrace, away from the noise of the pool.", turns: [
        ['a', "Can we have a {~proper} chat? Not a villa chat. A real one."],
        ['b', "That sounds serious."],
        ['a', "It's not serious. I just want to know you. Like, really know you."],
      ] },
      { when: { phase: 'evening' }, stage: "{a} and {b} lie in the dark on the daybeds after everyone's gone in.", turns: [
        ['b', "I love it when it's like this. Just us."],
        ['a', "Me too. It's the only time it feels real in here."],
      ] },
      { stage: "{a} and {b} sit on the edge of the pool, talking quietly.", turns: [
        ['a', "Can I ask you something a bit deep?"],
        ['b', "Go on. I'm in a deep mood."],
      ] },
      { when: { rowedToday: true }, stage: "{a} and {b} sit together after their fight.", turns: [
        ['a', "Can we actually talk? Not about what happened. About why it happened."],
        ['b', "Yeah. I think we need to."],
      ] },
      { when: { reg: 'soft' }, stage: "{a} takes {b}'s hand on the swing seat.", turns: [
        ['a', "I feel like we have a laugh all the time, which I love. But I want to know the stuff underneath, too."],
        ['b', "The stuff underneath. Okay. That's scary."],
        ['a', "It's only me."],
      ] },
      { when: { reg: 'dry' }, stage: "{a} and {b} sit on the terrace steps.", turns: [
        ['a', "I'm going to ask you a serious question, and you're not allowed to make a joke."],
        ['b', "That's most of my personality gone."],
        ['a', "I know. Brace yourself."],
      ] },
      { when: { reg: 'big' }, stage: "{a} sits {b} down on the daybed and goes uncharacteristically quiet.", turns: [
        ['b', "You've gone quiet. You never go quiet."],
        ['a', "I know. I want to talk about something real for once."],
      ] },
    ],

    question: [
      { when: { rowedToday: true }, turns: [
        ['a', "Can I ask you something, now we've both calmed down? Why do we keep ending up there? Shouting at each other over things that don't matter?"],
        ['b', "Honestly? I think we're both scared. And when I'm scared, I get defensive."],
        ['a', "Me too. I didn't realise until today."],
      ] },
      { turns: [
        ['a', "What are you actually scared of? In here, I mean. With us."],
        ['b', "That's a big question."],
        ['a', "I know it is. You don't have to answer straight away."],
      ] },
      { turns: [
        ['a', "Why do you think it's never worked out for you before? Honestly. Not the villa answer."],
        ['b', "The villa answer's easier."],
        ['a', "I know. I want the real one."],
      ] },
      { turns: [
        ['b', "Can I ask you something? What do you actually want? Not in here. In life. Like, in five years."],
        ['a', "You first."],
        ['b', "No, I asked. But fine. Me first."],
      ] },
      { when: { intent: ['love', 'settle-down', 'first-love'] }, turns: [
        ['a', "Do you see yourself settling down? Like, properly. Moving in with someone, all of that."],
        ['b', "With someone? Or with you?"],
        ['a', "I'm asking generally. Mostly."],
      ] },
      { turns: [
        ['a', "Have you ever been really hurt by someone?"],
        ['b', "Hasn't everyone?"],
        ['a', "Probably. But I'm asking about you."],
      ] },
      { turns: [
        ['a', "What's the one thing someone could do that would make you trust them? Because I want to know, so I can do it."],
        ['b', "That's really sweet."],
        ['a', "I'm serious. Tell me."],
      ] },
      { when: { known: true }, turns: [
        ['a', "Do you think you've changed since you came in here?"],
        ['b', "Do you?"],
        ['a', "I think so. But I want to know what you think."],
      ] },
      { when: { after: 'told' }, turns: [
        ['a', "After everything that's gone on today, can I ask you something? Do you trust me?"],
        ['b', "Why are you asking?"],
        ['a', "Because I need to know where we are."],
      ] },
      { when: { after: 'pull', afterBy: 'b' }, turns: [
        ['a', "When you went off with {x} earlier, I got a feeling in my stomach I didn't like. And I want to understand it. So can I ask, what do you actually feel about us?"],
        ['b', "That's what this is about?"],
        ['a', "Partly. Mostly it's about us."],
      ] },
      { when: { mood: ['stressed', 'lonely', 'heartbroken'] }, turns: [
        ['b', "You've not been yourself today. What's actually going on in your head?"],
        ['a', "Honestly? I don't know. I think I'm just scared of getting my hopes up."],
        ['b', "About us?"],
        ['a', "About everything. But yeah. About us."],
      ] },
    ],

    answer: [
      { when: { end: 'open' }, turns: [
        ['b', "Honestly? I'm scared of getting it wrong. I've been in situations before where I gave everything and got nothing back, and I told myself I'd never do that again. And then I came in here, and I met you, and I'm doing it again. I'm all in. And that's terrifying."],
        ['a', "Why's it terrifying?"],
        ['b', "Because if it goes wrong, it's on {~telly}. And it's on me."],
      ] },
      { when: { end: 'open' }, turns: [
        ['b', "I think I've always gone for people who aren't good for me. The ones who keep you guessing. And I used to think that was exciting, but it's not, it's just exhausting. I'd spend all my time trying to work out where I stood. With you, I know where I stand. It's the first time I've had that."],
        ['a', "That means a lot."],
        ['b', "It's true. I'm not just saying it."],
      ] },
      { when: { end: 'open' }, turns: [
        ['b', "I want the boring stuff. Is that weird? I want someone to do the food shop with. I want someone who knows how I take my tea and doesn't have to ask. I want Sunday mornings with nothing to do. Everyone thinks I'm all about going out and having fun, and I am, but at the end of the day, I just want my person."],
        ['a', "That's not boring."],
        ['b', "It's a little bit boring."],
        ['a', "It's the best kind of boring."],
      ] },
      { when: { end: 'open' }, turns: [
        ['b', "I find it really hard to let people in. Like, really hard. I'll be the life and soul with everyone, and then when someone actually tries to get close, I shut down. I don't even mean to, I just do. So if I go quiet on you, it's not you. It's me trying not to run."],
        ['a', "Thank you for telling me that."],
        ['b', "I've never said that to anyone before."],
      ] },
      { when: { end: 'open' }, turns: [
        ['b', "Trust, for me, is just consistency. Being the same person on a Tuesday as you are on a Saturday. Doing what you say you're going to do. Not saying one thing to my face and another thing behind my back. It sounds simple, but you'd be amazed how few people manage it."],
        ['a', "I can do that."],
        ['b', "I know you can. I've watched you do it."],
      ] },
      { when: { end: 'open' }, turns: [
        ['b', "I think I'm scared that people only like the version of me that's fun. The one who's always up for a laugh. And I'm scared that if I show them the other bits, the bits where I'm sad or worried or whatever, they'll leave. So I just keep being fun."],
        ['a', "You don't have to be fun all the time with me."],
        ['b', "I'm starting to realise that."],
      ] },
      { when: { end: 'guarded' }, turns: [
        ['b', "I don't know. I don't really do the deep stuff, if I'm honest. It's not that I don't want to tell you, I just don't really know how to say it."],
        ['a', "You can try."],
        ['b', "Maybe another time. Is that all right?"],
        ['a', "Yeah. Of course it is."],
      ] },
      { when: { end: 'guarded' }, turns: [
        ['b', "That's a lot to ask on a sunny afternoon."],
        ['a', "I know. I'm sorry."],
        ['b', "Don't be sorry. I just... I'm not ready to go there yet. I will be. Just not today."],
      ] },
      { when: { end: 'guarded' }, turns: [
        ['b', "Honestly? I'm fine. I'm just a pretty easy-going person, I don't really have deep stuff."],
        ['a', "Everyone has deep stuff."],
        ['b', "Well, mine's very shallow, then. It's a paddling pool."],
        ['a', "You're deflecting."],
        ['b', "I'm a little bit deflecting."],
      ] },
      { when: { end: 'guarded' }, turns: [
        ['b', "Why do you want to know?"],
        ['a', "Because I care about you, and I want to know you properly."],
        ['b', "You do know me. You know me better than most people in here."],
        ['a', "That's not the same thing."],
      ] },
      { when: { end: 'guarded', reg: 'dry' }, turns: [
        ['b', "What am I scared of? Spiders. Small talk. Running out of crisps."],
        ['a', "Be serious."],
        ['b', "I am being serious. You've never seen me run out of crisps."],
      ] },
      { when: { end: 'open', bReg: 'nervy' }, turns: [
        ['b', "I overthink everything. Like, everything. I'll replay a conversation in bed for hours. I'll wonder if I said the wrong thing at dinner. And with you, I've been terrified that one day you're just going to wake up and not like me anymore, and I won't know why."],
        ['a', "That's not going to happen."],
        ['b', "You can't know that."],
        ['a', "I can know that I'm not going anywhere without telling you first."],
      ] },
      { when: { end: 'open', bReg: 'sharp' }, turns: [
        ['b', "Fine. You want the truth? I'm hard on people because I'm harder on myself. I don't let things go, I don't forgive easily, and I know that's not always a good thing. But when I'm in, I'm in. Completely. And I'm in with you."],
        ['a', "That's the most you've ever said to me in one go."],
        ['b', "Don't get used to it."],
      ] },
    ],

    mine: [
      { turns: [
        ['a', "Can I tell you mine? I've always been the one who cares more. In every relationship. I'd be the one making the effort, planning the dates, sending the long texts. And I came in here thinking, this time, I'm going to hold back a bit. And then I met you, and I've not held back at all."],
        ['b', "I'm glad you haven't."],
      ] },
      { turns: [
        ['a', "For me, I think I'm scared of being boring. Of someone getting to know me properly and thinking, oh, is that it? I put on a bit of a show, I know I do. But with you I don't feel like I have to."],
        ['b', "You're not boring. You're the least boring person in this villa."],
        ['a', "That's a low bar, to be fair."],
      ] },
      { turns: [
        ['a', "I've never really said this to anyone, but I've always wanted what my friends have. The settled thing. Someone to go home to. I always pretended I didn't care, because it was easier than admitting I wanted it and didn't have it."],
        ['b', "And now?"],
        ['a', "And now I'm sitting here with you, and I don't have to pretend."],
      ] },
      { when: { reg: 'soft' }, turns: [
        ['a', "Can I be really honest? I get scared that I'm too much. That I care too much, feel too much, talk about it too much. People have told me that before, and it's stuck with me."],
        ['b', "You're not too much. You're just enough."],
        ['a', "You can't say things like that, I'm going to cry."],
      ] },
      { when: { reg: 'sharp' }, turns: [
        ['a', "I'll be honest with you, because you've been honest with me. I don't trust easily either. I've been let down, and I built a wall, and I'm not great at taking it down. But I'm trying. With you, I'm actually trying."],
        ['b', "I can tell."],
      ] },
    ],

    meaning: [
      { when: { end: 'open' }, turns: [
        ['a', "I'm really glad you told me that. It makes me feel closer to you. Like I actually know you now, not just the villa version."],
        ['b', "Me too. That's the most I've opened up to anyone in a long time."],
        ['a', "I'll look after it. I promise."],
      ] },
      { when: { end: 'open' }, turns: [
        ['b', "Do you know what? I've never had a conversation like this in here. With anyone. Everyone's always talking about who's pulled who, and who said what at the fire pit. This is the first time I've felt like I'm talking to a real person."],
        ['a', "I'm very real."],
        ['b', "You are. That's why I like you."],
      ] },
      { when: { end: 'open', feels: 'strong' }, turns: [
        ['a', "Can I say something without you freaking out?"],
        ['b', "That depends what it is."],
        ['a', "I think I'm falling for you. Not fallen. Falling. I just wanted you to know."],
        ['b', "I'm not freaking out."],
        ['a', "You're freaking out a little bit."],
        ['b', "I'm freaking out in a good way."],
      ] },
      { when: { end: 'open' }, turns: [
        ['a', "I feel like this changes things. In a good way. Like we're not just a villa couple anymore."],
        ['b', "What are we, then?"],
        ['a', "I don't know yet. Something real, I think."],
      ] },
      { when: { end: 'guarded' }, turns: [
        ['a', "I just want you to know, whenever you're ready to talk, I'm here. I'm not going to push."],
        ['b', "Thank you. I mean that. It's not you, I promise."],
        ['a', "I know."],
      ] },
      { when: { end: 'guarded' }, turns: [
        ['a', "It feels a bit like you're keeping me at arm's length. Is that fair?"],
        ['b', "Maybe. A bit. I don't mean to."],
        ['a', "I know you don't. I just don't want to be in this on my own."],
        ['b', "You're not on your own. I'm just slower than you."],
      ] },
      { when: { end: 'guarded' }, turns: [
        ['b', "I know I'm hard work. I know I don't open up like other people do. But I'm here, and I'm not going anywhere. Can that be enough for now?"],
        ['a', "For now. Yeah."],
      ] },
    ],

    close: [
      { when: { end: 'open' }, turns: [
        ['b', "Come here."],
      ], beat: "{b} pulls {a} into a long hug, and neither of them says anything for a while." },
      { when: { end: 'open' }, turns: [
        ['a', "Thank you for trusting me with that."],
        ['b', "Thank you for asking."],
      ], beat: "They sit there a while longer, {b}'s head on {a}'s shoulder." },
      { when: { end: 'guarded' }, turns: [
        ['b', "Shall we go back to the others?"],
        ['a', "Yeah. Go on."],
      ], beat: "{b} goes first. {a} follows a minute later, quieter than before." },
      { when: { end: 'guarded' }, turns: [
        ['a', "Kiss?"],
        ['b', "Kiss."],
      ], beat: "They kiss, and it's sweet, but {a} still looks a little lost." },
      { when: { end: 'open', phase: 'evening' }, turns: [
        ['a', "Bed?"],
        ['b', "Bed. But I'm not ready to stop talking yet."],
        ['a', "Then we'll talk in bed."],
      ] },
      { turns: [
        ['b', "Right, before I start crying, I'm getting a drink."],
        ['a', "Get me one."],
      ], beat: "{b} wipes {b.posAdj} eyes on the way to the kitchen." },
    ],
  },

  notes: [
    { when: { rowedToday: true }, stage: "After their fight, {a} and {b} talk it all through, properly." },
    { when: { end: 'open' }, stage: "{a} and {b} have a deep chat on the terrace about what they really want." },
    { when: { end: 'open' }, stage: "{b} opens up to {a} about being hurt before." },
    { when: { end: 'guarded' }, stage: "{a} tries to get {b} to open up. {b} changes the subject." },
    { when: { end: 'guarded' }, stage: "{a} and {b} talk late into the evening, but {b} keeps it light." },
  ],
});
