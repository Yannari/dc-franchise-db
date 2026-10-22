// ══════════════════════════════════════════════════════════════════════
// pm/talk/ladder.js — a couple's turning points (pm/ladder.js, villa-day.js)
// ══════════════════════════════════════════════════════════════════════
//
// {a} is the one who moves (closes off, asks, says it); {b} is the one it is
// said to. The engine has decided the answer: exclusive-ask and official-ask
// are a yes, `ask-declined` is the no (`of`: which ask), love-said is said
// back, love-hanging is not. `bFeels` is how much {b} feels for {a} (strong ·
// some · little), so a "not yet" comes from somebody who cares and a real no
// from somebody who doesn't. {b.gf} is girlfriend / boyfriend / partner from
// the roster. All the couple's big moments: always shown whole.
import { build } from './build.js';

export const CLOSE_OFF = build('close-off', {
  tiered: false,
  plans: { featured: ['lead', 'say', 'answer', 'close'], short: ['say', 'answer'] },
  moves: {
    lead: [
      { stage: "{a} takes {b} up to the terrace, away from everyone.", turns: [
        ['a', "Can I talk to you about something? It's a good thing, I promise. Stop looking at me like that."],
        ['b', "Like what?"],
        ['a', "Like I'm about to dump you."],
      ] },
      { stage: "{a} and {b} lie on the daybed after everyone else has gone in.", turns: [
        ['a', "I've been thinking about something all day, and I want to say it before I lose my nerve."],
        ['b', "That sounds serious."],
        ['a', "It is serious. Good serious."],
      ] },
      { stage: "{a} sits {b} down on the swing seat.", turns: [
        ['b', "Why are you being weird?"],
        ['a', "I'm not being weird. I'm being nervous. They look the same on me."],
      ] },
    ],
    say: [
      { turns: [
        ['a', "I'm closing myself off. I don't want to get to know anyone else. I don't want to go for chats, I don't want to look at whoever walks through those doors next. It's you. I want to see where this goes, properly, with nobody else in the way."],
      ] },
      { turns: [
        ['a', "I've had a lot of people ask me where my head's at, and I keep saying I'm open. And it's not true anymore. I haven't been open for days. I just hadn't said it out loud. So I'm saying it. I'm closed off, for you."],
      ] },
      { when: { reg: 'sharp' }, turns: [
        ['a', "I'm not one for big speeches, so here it is. I'm done looking. Whoever walks in next, I'm not interested. It's you, and I'm telling you so you know where you stand."],
      ] },
      { when: { reg: 'nervy' }, turns: [
        ['a', "Okay. I'm just going to say it, and you don't have to say anything back. I'm closing myself off. To everyone else, I mean. Not to you. Obviously not to you. That came out wrong. I'm closed off for you."],
      ] },
    ],
    answer: [
      { when: { bFeels: 'strong' }, turns: [
        ['b', "I was going to say the same thing. I swear I was. I've been trying to find the right moment for two days, and you've beaten me to it."],
        ['a', "So you're closed off too?"],
        ['b', "I've been closed off since the day you asked me how I take my tea."],
      ] },
      { when: { bFeels: 'strong' }, turns: [
        ['b', "I don't want anyone else either. I haven't for a while."],
        ['a', "Really?"],
        ['b', "Really. Come here."],
      ] },
      { when: { bFeels: 'some' }, turns: [
        ['b', "That's a really big thing to say. And I love that you said it. I'm getting there. I really am. I just want to make sure that when I say it back, I mean every word."],
        ['a', "That's fair. I'll wait."],
      ] },
      { when: { bFeels: 'little' }, turns: [
        ['b', "Okay. Wow. That's a lot."],
        ['a', "Is it too much?"],
        ['b', "No. No, it's lovely. I just need a bit of time to catch up with you."],
      ] },
    ],
    close: [
      { turns: [], beat: "{b} pulls {a} in and kisses {a.obj}, and {a} finally breathes out." },
      { turns: [['a', "So that's that, then."], ['b', "That's that."]], beat: "They sit there grinning at each other like idiots." },
      { when: { bFeels: 'little' }, turns: [], beat: "{a} smiles, but keeps looking at {b}, waiting for more." },
    ],
  },
  notes: [],
});

export const KEEPING_OPEN = build('keeping-open', {
  tiered: false,
  plans: { featured: ['lead', 'say', 'answer'], short: ['say', 'answer'] },
  moves: {
    lead: [
      { stage: "{b} asks {a} for a chat on the daybeds.", turns: [
        ['b', "Can I ask you something? Where's your head at? With us, I mean."],
      ] },
      { stage: "{a} and {b} are lying by the pool.", turns: [
        ['b', "Everyone keeps asking me where we're at, and I don't know what to say. Where are we at?"],
      ] },
    ],
    say: [
      { turns: [
        ['a', "Honestly? I like you. I really do. But it's still early, and I don't want to close myself off before I'm sure. I want to keep my options open, just for a bit. I'd rather be honest about that than lie to you."],
      ] },
      { turns: [
        ['a', "I'm not going to pretend I'm closed off, because I'm not. I'm still getting to know people. That doesn't mean you're not my first choice. It just means I'm not ready to say you're my only one."],
      ] },
      { when: { reg: 'dry' }, turns: [
        ['a', "Where's my head at? Somewhere between here and the door, if I'm honest. I like what we've got. I'm just not ready to stop looking. Not yet."],
      ] },
    ],
    answer: [
      { when: { bFeels: 'strong' }, turns: [
        ['b', "Right. Okay. I suppose I thought we were further along than that."],
        ['a', "We're not nowhere. I'm just being honest."],
        ['b', "I know. I appreciate that. It still stings a bit."],
      ] },
      { when: { bFeels: ['some', 'little'] }, turns: [
        ['b', "That's fair, actually. I'm kind of the same, if I'm honest."],
        ['a', "Really?"],
        ['b', "Really. Let's just see what happens."],
      ] },
      { turns: [
        ['b', "Okay. Thank you for telling me. I'd rather know than find out at a recoupling."],
      ], beat: "{b} smiles, but goes quiet for the rest of the afternoon." },
    ],
  },
  notes: [],
});

export const OPEN_BACK_UP = build('open-back-up', {
  tiered: false,
  plans: { featured: ['lead', 'say', 'answer', 'after'], short: ['say', 'answer'] },
  moves: {
    lead: [
      { stage: "{a} asks {b} for a chat by the fire pit.", turns: [
        ['b', "You've been off with me for days. What's going on?"],
        ['a', "I need to tell you something, and it's not easy."],
      ] },
      { stage: "{a} sits down next to {b} and doesn't take {b.posAdj} hand.", turns: [
        ['b', "That's not a good face."],
        ['a', "No. It's not."],
      ] },
    ],
    say: [
      { turns: [
        ['a', "I said I was closed off, and I meant it at the time. But I've been in my head for days, and I can't keep pretending. I need to open myself back up. I don't know if this is right, and I'm not sure it's going anywhere, and I'd rather tell you now than lie to you."],
      ] },
      { turns: [
        ['a', "I don't want to hurt you. I really don't. But my head's been turned, and I'm not going to sneak around behind your back. I'm opening myself back up, and I wanted you to hear it from me first."],
      ] },
    ],
    answer: [
      { when: { bFeels: 'strong' }, turns: [
        ['b', "You closed off for me. You stood in front of me and said it was me. And now it's not?"],
        ['a', "I'm sorry."],
        ['b', "Sorry doesn't change it. I believed you. I closed myself off because of you."],
      ] },
      { turns: [
        ['b', "Is it someone else? Just tell me if it's someone else."],
        ['a', "I don't know yet. That's the honest answer."],
        ['b', "That's a yes, then."],
      ] },
      { when: { bFeels: 'little' }, turns: [
        ['b', "Okay. I'm not going to lie, I'm not that surprised. It's not been the same for a while."],
        ['a', "No. It hasn't."],
      ] },
    ],
    after: [
      { turns: [], beat: "{b} gets up and walks off without another word. {a} doesn't follow." },
      { turns: [['b', "Thanks for being honest, I suppose."]], beat: "{b} goes back to the bedroom, and {a} sits alone at the fire pit for a long time." },
    ],
  },
  notes: [],
});

export const EXCLUSIVE_ASK = build('exclusive-ask', {
  tiered: false,
  plans: { featured: ['lead', 'ask', 'yes', 'close'], short: ['ask', 'yes'] },
  moves: {
    lead: [
      { stage: "{a} takes {b} for a walk round the garden.", turns: [
        ['a', "Can I ask you something? It's a bit of a big one."],
        ['b', "Go on. You're making me nervous."],
      ] },
      { stage: "{a} and {b} sit on the terrace as the sun goes down.", turns: [
        ['a', "I've been thinking about us a lot."],
        ['b', "Good thinking or bad thinking?"],
        ['a', "Good thinking. Mostly good."],
      ] },
    ],
    ask: [
      { turns: [
        ['a', "I don't want to be with anyone else in here. I'm not interested in anyone else, and I don't want to be. So I suppose what I'm asking is, do you want to be exclusive? Just us. No more chats, no more wondering."],
      ] },
      { turns: [
        ['a', "Every time a bombshell walks in, I get this horrible feeling in my stomach that you might go off with them. And I don't want to feel like that anymore. So, will you be exclusive with me? You and me, and nobody else?"],
      ] },
      { when: { reg: 'sharp' }, turns: [
        ['a', "I'm asking you straight. Exclusive. Yes or no?"],
      ] },
    ],
    yes: [
      { turns: [
        ['b', "Yes. Obviously yes. I've been waiting for you to ask for days."],
        ['a', "You could have asked me."],
        ['b', "I wanted you to ask. I wanted to know you wanted it as much as I did."],
      ] },
      { turns: [
        ['b', "Are you being serious? Of course I want to be exclusive. I haven't looked at anyone else since the first week."],
        ['a', "Really?"],
        ['b', "Really. Come here."],
      ] },
      { when: { bFeels: 'some' }, turns: [
        ['b', "Yeah. Yeah, let's do it. I'm scared, but let's do it."],
        ['a', "Scared?"],
        ['b', "Scared because it means it matters."],
      ] },
    ],
    close: [
      { turns: [], beat: "They kiss, and somebody on the lawn starts clapping." },
      { turns: [['a', "We're exclusive."], ['b', "We're exclusive. Say it again."], ['a', "We're exclusive."]] },
    ],
  },
  notes: [],
});

export const OFFICIAL_ASK = build('official-ask', {
  tiered: false,
  plans: { featured: ['setup', 'speech', 'ask', 'yes', 'close'], short: ['speech', 'ask', 'yes'] },
  moves: {
    setup: [
      { stage: "{a} has covered the terrace in candles and fairy lights, with help from half the villa. {b} is led up blindfolded.", turns: [
        ['b', "What is going on? Why can I smell candles?"],
        ['a', "Take it off."],
      ], beat: "{b} takes the blindfold off and covers {b.posAdj} mouth." },
      { stage: "{a} has spelled out {b}'s name in rose petals on the lawn.", turns: [
        ['b', "Oh my God. Did you do this?"],
        ['a', "I had some help. Most of it was me, though."],
      ] },
      { stage: "{a} has written {b} a letter, and reads it out by the fire pit.", turns: [] },
    ],
    speech: [
      { turns: [
        ['a', "When I walked into this villa, I didn't think I'd find anything real. I thought I'd have a laugh, make some friends, and go home. And then I met you. You've made me laugh every single day, you've looked after me on the bad ones, and you've made me feel like I'm the only person in the room, even when there are twenty of us."],
      ] },
      { turns: [
        ['a', "I've been trying to work out how to say this for days. I wrote it down, I practised it on the boys, I practised it on the girls. And now I've completely forgotten all of it. So I'm just going to tell you how I feel. I've never been this happy with anyone. Not in here, not on the outside. Never."],
      ] },
      { when: { known: true }, turns: [
        ['a', "We've been through so much in here. The recouplings, the bombshells, all of it. And every single time, it's been you and me at the end of it. I don't want that to stop when we walk out of here. I want it to be the start."],
      ] },
    ],
    ask: [
      { turns: [['a', "So, {b}. Will you be my {b.gf}?"]] },
      { turns: [['a', "Will you be my {b.gf}? Officially?"]] },
    ],
    yes: [
      { turns: [
        ['b', "Yes! Oh my God, yes! Of course I will!"],
        ['a', "Really?"],
        ['b', "Really! Come here, you idiot!"],
      ] },
      { turns: [
        ['b', "I can't believe you did all this. Yes. Yes, a hundred times."],
      ] },
      { when: { reg: 'soft' }, turns: [
        ['b', "I'm crying. I'm actually crying. Yes. Of course yes. I love you so much."],
      ] },
    ],
    close: [
      { turns: [], beat: "{b} jumps into {a}'s arms, and the whole villa runs over cheering." },
      { turns: [], beat: "They kiss for a long time, and when they finally come up for air, everyone is clapping." },
    ],
  },
  notes: [],
});

export const ASK_DECLINED = build('ask-declined', {
  tiered: false,
  plans: { featured: ['ask', 'no', 'after'], short: ['ask', 'no'] },
  moves: {
    ask: [
      { when: { of: 'exclusive-ask' }, stage: "{a} takes {b} up to the terrace.", turns: [
        ['a', "I want us to be exclusive. I don't want to be with anyone else in here, and I want to know if you feel the same."],
      ] },
      { when: { of: 'official-ask' }, stage: "{a} has set up the terrace with candles and fairy lights.", turns: [
        ['a', "I wanted to do this properly. You mean the world to me, and I want to make it official. Will you be my {b.gf}?"],
      ] },
    ],
    no: [
      { when: { bFeels: ['strong', 'some'] }, turns: [
        ['b', "I care about you so much. I really do. But I'm not there yet. I don't want to say yes just because it's the right moment, and then not mean it. You deserve someone who's completely sure."],
        ['a', "And you're not sure."],
        ['b', "Not yet. I'm sorry. Not yet doesn't mean never."],
      ] },
      { when: { bFeels: 'little' }, turns: [
        ['b', "I'm really sorry. I can't. I like you, I do, but I don't feel the same way, and I'm not going to pretend I do just because everyone's watching."],
        ['a', "Right. Okay."],
        ['b', "I'm so sorry."],
      ] },
      { when: { of: 'official-ask', bFeels: ['strong', 'some'] }, turns: [
        ['b', "This is so beautiful. And I hate that I'm about to say this. But I don't want to rush it. Can we wait until we're out? Until we've had a chance to do this in the real world?"],
        ['a', "So it's a no."],
        ['b', "It's a not yet. Please hear the difference."],
      ] },
    ],
    after: [
      { turns: [], beat: "{a} nods, and smiles, and walks inside before anyone can see {a.posAdj} face." },
      { turns: [['a', "It's fine. Honestly. It's fine."]], beat: "It is not fine. The candles burn down with nobody watching." },
    ],
  },
  notes: [],
});

export const LOVE_SAID = build('love-said', {
  tiered: false,
  plans: { featured: ['lead', 'say', 'back', 'close'], short: ['say', 'back'] },
  moves: {
    lead: [
      { stage: "{a} and {b} lie in the dark on the daybed after everyone has gone in.", turns: [
        ['a', "Can I tell you something?"],
        ['b', "Always."],
        ['a', "Promise you won't laugh."],
        ['b', "I promise. Unless it's funny."],
      ] },
      { stage: "{a} and {b} sit on the swing seat, {b}'s head on {a}'s shoulder.", turns: [
        ['a', "I've been holding something in for a few days."],
        ['b', "Go on."],
      ] },
    ],
    say: [
      { turns: [
        ['a', "I love you. I know it's mad, I know we're in a villa and it's only been a few weeks. But I've never been so sure of anything. I love you."],
      ] },
      { turns: [
        ['a', "I've been trying to work out if it's too soon to say it, and I've decided I don't care. I'm in love with you. There. I've said it."],
      ] },
      { when: { reg: 'nervy' }, turns: [
        ['a', "Okay, I'm going to say something, and then I'm going to need you to say something back really quickly, because I'm going to panic. I love you."],
      ] },
    ],
    back: [
      { turns: [
        ['b', "I love you too. I've loved you for days. I was just too scared to say it first."],
        ['a', "You were scared?"],
        ['b', "Terrified. You beat me to it."],
      ] },
      { turns: [
        ['b', "Say it again."],
        ['a', "I love you."],
        ['b', "I love you too. I love you so much."],
      ] },
    ],
    close: [
      { turns: [], beat: "They lie there in the dark, and neither of them stops smiling for a long time." },
      { turns: [], beat: "{b} kisses {a}, and somewhere inside, someone pretends they didn't hear." },
    ],
  },
  notes: [],
});

export const LOVE_HANGING = build('love-hanging', {
  tiered: false,
  plans: { featured: ['say', 'silence', 'after'], short: ['say', 'silence'] },
  moves: {
    say: [
      { stage: "{a} and {b} are lying on the daybed in the dark.", turns: [
        ['a', "I love you. I know that's a lot. But I do."],
      ] },
      { stage: "On the swing seat, {a} takes {b}'s hand.", turns: [
        ['a', "I think I'm falling in love with you. Actually, I don't think. I am."],
      ] },
    ],
    silence: [
      { turns: [
        ['b', "That's... wow. Thank you."],
        ['a', "Thank you?"],
        ['b', "I mean it means a lot. It really does. I just... I'm not there yet. I don't want to say it back unless I mean it."],
      ] },
      { turns: [
        ['b', "Come here."],
      ], beat: "{b} hugs {a}, and doesn't say it back. {a} notices." },
      { turns: [
        ['b', "I really, really like you."],
        ['a', "Right. Like."],
        ['b', "Don't do that. Like is a lot for me."],
      ] },
    ],
    after: [
      { turns: [], beat: "{a} stares at the sky for a long time after {b} has fallen asleep." },
      { turns: [['a', "It's fine. Forget I said anything."], ['b', "I'm not going to forget it."]] },
    ],
  },
  notes: [],
});
