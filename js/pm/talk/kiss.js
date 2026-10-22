// ══════════════════════════════════════════════════════════════════════
// pm/talk/kiss.js — a couple kiss: {a} and {b}, partners
// ══════════════════════════════════════════════════════════════════════
//
// `end` is the engine's: first (their first real kiss) · warm · easy · off
// (one of them isn't feeling it). The kiss itself is a BEAT with the word
// "kiss" in it: the viewer's kiss animation lands on that step (vp-pm/steps.js).
//   open    where they are, the moment building
//   lead    the talk that leads into it
//   kiss    the kiss
//   after   what they say after — the engine's ending
//   close   how they leave it
import { build } from './build.js';

export const KISS = build('kiss', {
  after: ['game-kiss', 'recoupling'],
  leads: ['rowedToday'],
  plans: {
    featured: ['open', 'lead', 'kiss', 'after', 'close?'],
    short: ['lead', 'kiss', 'after'],
  },
  moves: {
    open: [
      { stage: "{a} and {b} sit together on the swing seat, away from everyone.", turns: [
        ['a', "It's nice up here, isn't it? You can actually hear yourself think."],
        ['b', "I can't hear myself think. I'm too busy looking at you."],
        ['a', "Smooth."],
      ] },
      { when: { phase: 'evening' }, stage: "{a} and {b} lie on the daybeds, looking up at the sky.", turns: [
        ['b', "You can see so many stars here. You never see them at home."],
        ['a', "That one's yours."],
        ['b', "Which one?"],
        ['a', "The bright one. I've just decided."],
      ] },
      { when: { phase: 'morning' }, stage: "{a} brings {b} breakfast on the terrace.", turns: [
        ['b', "You made me breakfast?"],
        ['a', "I made you toast. Let's not get carried away."],
        ['b', "It's still the nicest thing anyone's done for me in here."],
      ] },
      { stage: "{a} and {b} are lying in the sun by the pool.", turns: [
        ['a', "You've got freckles coming through."],
        ['b', "Don't. I hate them."],
        ['a', "I love them. I'm going to count them."],
        ['b', "Please don't count them."],
      ] },
      { stage: "{a} pulls {b} into the hot tub while everyone else is inside.", turns: [
        ['b', "We've got the whole thing to ourselves."],
        ['a', "Finally. I thought everyone would never leave."],
      ] },
      { when: { firstKiss: true }, stage: "{a} and {b} end up alone on the terrace for the first time.", turns: [
        ['a', "It's weird, isn't it? We're coupled up and we've barely been on our own."],
        ['b', "There's always someone around."],
        ['a', "There isn't now."],
      ] },
      { when: { rowedToday: true }, stage: "{a} finds {b} on the terrace after their row.", turns: [
        ['a', "I hate this. I hate it when we're like this."],
        ['b', "Me too. I don't even remember what we were arguing about now."],
        ['a', "Neither do I. Something stupid."],
      ] },
      { when: { after: 'recoupling', afterBy: 'both' }, stage: "{a} and {b} sit together after the recoupling.", turns: [
        ['b', "I can't believe you picked me."],
        ['a', "Who else was I going to pick?"],
        ['b', "I don't know. I was so nervous."],
      ] },
      { when: { reg: 'big' }, stage: "{a} grabs {b} by the hand and drags {b.obj} to the swing seat.", turns: [
        ['a', "Right, sit down. I need you for something very important."],
        ['b', "What?"],
        ['a', "You'll see."],
      ] },
      { when: { end: 'off' }, stage: "{a} and {b} sit together on the daybeds. It's a bit quiet.", turns: [
        ['a', "You all right?"],
        ['b', "Yeah. Just tired."],
        ['a', "Come here, then."],
      ] },
    ],

    lead: [
      { turns: [
        ['a', "Can I tell you something?"],
        ['b', "Go on."],
        ['a', "I've been thinking about kissing you all day. Like, all day. During lunch, during the chat with everyone, during literally everything. It's been very distracting."],
        ['b', "Then why haven't you?"],
      ] },
      { when: { firstKiss: true }, turns: [
        ['b', "Can I ask you something? Why haven't you kissed me yet?"],
        ['a', "Honestly? I didn't want to rush it. I wanted it to be the right moment, not just because everyone else is doing it."],
        ['b', "And is this the right moment?"],
        ['a', "I think it might be."],
      ] },
      { when: { firstKiss: true }, turns: [
        ['a', "I've been so nervous about this, you know."],
        ['b', "About what?"],
        ['a', "About our first kiss. I didn't want it to be in a challenge or in front of everyone. I wanted it to be just us, and I wanted it to be good."],
        ['b', "No pressure, then."],
      ] },
      { turns: [
        ['b', "You keep looking at my lips."],
        ['a', "Do I?"],
        ['b', "You've done it about five times."],
        ['a', "Well, they're right there. What am I supposed to do?"],
      ] },
      { when: { reg: 'flirty' }, turns: [
        ['a', "You look really good right now. Like, really good. I can't concentrate on anything you're saying."],
        ['b', "I was talking about sun cream."],
        ['a', "I know. I didn't hear a word of it."],
      ] },
      { when: { reg: 'nervy' }, turns: [
        ['a', "Can I — sorry. I was going to ask if I could kiss you, and then I realised that's a weird thing to ask, and now I've said it out loud, so."],
        ['b', "It's not weird. It's sweet."],
        ['a', "Is it?"],
        ['b', "It is. Ask me properly."],
      ] },
      { when: { reg: 'sharp' }, turns: [
        ['a', "Come here."],
        ['b', "Why?"],
        ['a', "Because I want to kiss you, and I'm not going to ask twice."],
      ] },
      { when: { reg: 'dry' }, turns: [
        ['b', "What are you thinking about?"],
        ['a', "Honestly? Whether it'd be weird if I kissed you right now, in the middle of a conversation about laundry."],
        ['b', "It'd be a bit weird."],
        ['a', "I'm going to risk it."],
      ] },
      { when: { end: 'off' }, turns: [
        ['a', "Can I have a kiss?"],
        ['b', "Now?"],
        ['a', "Yeah, now. Why not?"],
        ['b', "No reason. Go on, then."],
      ] },
      { when: { rowedToday: true }, turns: [
        ['b', "I'm sorry about earlier. I didn't mean half of what I said."],
        ['a', "I know you didn't. I'm sorry too. I hate fighting with you."],
        ['b', "Kiss and make up?"],
        ['a', "Kiss and make up."],
      ] },
      { when: { after: 'game-kiss' }, turns: [
        ['b', "I didn't like watching that challenge, by the way."],
        ['a', "It was a game. Everyone was kissing everyone."],
        ['b', "I know. I just want you to know that I'm the only one you're allowed to kiss now. Properly, I mean."],
        ['a', "Then come here and remind me."],
      ] },
      { turns: [
        ['a', "You know what I like about you?"],
        ['b', "What?"],
        ['a', "Everything. Is that too much? It's too much. I was going to say something cool, and I've just said everything."],
        ['b', "It's not too much. Come here."],
      ] },
      { when: { feels: 'strong' }, turns: [
        ['b', "I don't think I've ever felt like this about someone this quickly. It's a bit scary."],
        ['a', "Scary bad?"],
        ['b', "Scary good. Scary like I don't want it to stop."],
      ] },
    ],

    kiss: [
      { turns: [['a', "Come here, you."]], beat: "{a} pulls {b} in and kisses {b.obj}." },
      { turns: [['b', "Just shut up and kiss me."]], beat: "{a} doesn't need telling twice. They kiss." },
      { turns: [['a', "Close your eyes."], ['b', "Why?"], ['a', "Just do it."]], beat: "{a} kisses {b}, and {b} laughs into it." },
      { when: { firstKiss: true }, turns: [['a', "Okay. Here goes."]], beat: "Their first kiss is slow and a little bit nervous, and when it ends they're both grinning." },
      { when: { firstKiss: true }, turns: [], beat: "{a} leans in, stops for a second to check, and then {b} closes the gap. Their first kiss." },
      { when: { end: 'warm' }, turns: [], beat: "They kiss, and it goes on long enough that someone on the daybeds starts clapping." },
      { when: { end: 'easy' }, turns: [], beat: "They kiss, easy and unhurried." },
      { when: { end: 'off' }, turns: [], beat: "They kiss. It's quick, and {b} pulls back first." },
      { when: { end: 'off' }, turns: [], beat: "{a} kisses {b}. {b} kisses {a.obj} back, but it's over quickly." },
      { when: { reg: 'big' }, turns: [['a', "Right, I'm going in!"]], beat: "{a} kisses {b} so enthusiastically they nearly fall off the seat." },
    ],

    after: [
      { when: { end: 'first', known: true }, turns: [
        ['b', "Well. That was worth the wait."],
        ['a', "Was it?"],
        ['b', "Don't fish. You know it was."],
        ['a', "I just wanted to hear you say it. I've been waiting days for that."],
      ] },
      { when: { end: 'first' }, turns: [
        ['a', "Okay, I'm going to be honest, I was so nervous then. My hands are actually shaking."],
        ['b', "Mine too. Look."],
        ['a', "We're ridiculous."],
        ['b', "We're a bit ridiculous."],
      ] },
      { when: { end: 'first' }, turns: [
        ['b', "That was our first kiss."],
        ['a', "I know. I'm going to remember it forever. The swing seat, the sun, you with sun cream on your nose."],
        ['b', "Have I got sun cream on my nose?"],
        ['a', "Loads."],
      ] },
      { when: { end: 'warm' }, turns: [
        ['a', "I could do that all day, you know."],
        ['b', "We'd never get anything done."],
        ['a', "What have we got to get done? We're in a villa. There's nothing to do except this."],
        ['b', "Fair point."],
      ] },
      { when: { end: 'warm' }, turns: [
        ['b', "Every time you kiss me, I get butterflies. Still. Is that normal?"],
        ['a', "I hope it is, because same."],
        ['b', "Good. I'd hate to be the only one."],
      ] },
      { when: { end: 'warm' }, turns: [
        ['a', "You're a very good kisser, do you know that?"],
        ['b', "I've had no complaints."],
        ['a', "Well, you're not getting any from me. Ever."],
      ] },
      { when: { end: 'easy' }, turns: [
        ['b', "That was nice."],
        ['a', "It was. I like this. Just us."],
        ['b', "Me too. It's the best bit of the day."],
      ] },
      { when: { end: 'easy' }, turns: [
        ['a', "Have you got any idea how much I like you?"],
        ['b', "A bit, maybe."],
        ['a', "More than a bit."],
        ['b', "Good. Same here."],
      ] },
      { when: { end: 'off' }, turns: [
        ['a', "What's wrong?"],
        ['b', "Nothing. Nothing's wrong."],
        ['a', "It doesn't feel like nothing."],
        ['b', "I'm just in my head today. It's not you. I promise it's not you."],
      ] },
      { when: { end: 'off' }, turns: [
        ['b', "Sorry. I'm just a bit tired."],
        ['a', "You're always a bit tired lately."],
        ['b', "Am I?"],
        ['a', "A bit. Is everything okay with us?"],
        ['b', "Everything's fine. Don't overthink it."],
      ] },
      { when: { end: 'off' }, turns: [
        ['a', "Was that weird? That felt weird."],
        ['b', "It wasn't weird. It was just a kiss."],
        ['a', "Just a kiss."],
        ['b', "You know what I mean."],
      ] },
    ],

    close: [
      { when: { end: ['first', 'warm'] }, turns: [
        ['b', "Everyone's looking over."],
        ['a', "Let them look."],
      ], beat: "{a} kisses {b} again, just to make the point." },
      { when: { end: ['first', 'warm', 'easy'] }, turns: [
        ['a', "Come on. Let's go and get a drink before someone comes and finds us."],
        ['b', "One more."],
        ['a', "One more."],
      ] },
      { when: { end: 'off' }, turns: [
        ['b', "I'm going to go and get changed."],
        ['a', "Okay."],
      ], beat: "{b} goes inside. {a} stays on the seat, frowning." },
      { when: { end: 'first' }, turns: [
        ['b', "I'm going to have to tell everyone, you know. They'll want details."],
        ['a', "Tell them it was amazing."],
        ['b', "I'll tell them it was all right."],
      ] },
    ],
  },

  notes: [
    { when: { rowedToday: true }, stage: "{a} and {b} kiss and make up after their row." },
    { when: { end: ['warm', 'easy'] }, stage: "{a} and {b} share a long kiss on the swing seat." },
    { when: { end: ['warm', 'easy'] }, stage: "{a} and {b} sneak a kiss by the pool." },
    { when: { end: 'warm' }, stage: "{a} and {b} can't keep their hands off each other on the daybeds." },
    { when: { end: 'easy' }, stage: "{a} gives {b} a kiss on the way past." },
    { when: { end: 'off' }, stage: "{a} goes in for a kiss. {b} gives {a.obj} a quick one and moves away." },
    { when: { end: 'first' }, stage: "{a} and {b} have their first kiss on the terrace." },
  ],
});
