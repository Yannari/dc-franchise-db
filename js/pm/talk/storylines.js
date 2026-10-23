// ══════════════════════════════════════════════════════════════════════
// pm/talk/storylines.js — the triangle, the villa's sides, exes at war, the game
// ══════════════════════════════════════════════════════════════════════
//
// Each storyline is the engine's (pm/triangle.js, pm/rivalry.js stepCamp and
// stepFeud, pm/game.js). Every scene names its thread in its first lines, so a
// reader always knows who wants whom and why this is happening now.
//
// triangle-torn       [a, b]     a, in the middle, tells friend b about both
// triangle-rivals     [a, b, c]  a and b, both after c. `of`: clash · size-up
// triangle-case       [a, b, c]  a makes the case to b; c is the other one
// triangle-ultimatum  [a, b, c]  a tells b to choose. `of`: chose-x (a) · chose-y (c) · not-yet
// triangle-teams      [a, b, c]  the villa splits over a: Team b, Team c
// triangle-choice     [a, b, c]  a ended up with b, not c. `of`: pick · default
// camp-rally          [a, b, c]  b rallies round a after rival c went for a
// camp-confront       [a, b, c]  a goes at b on friend c's behalf. `of`: hot · calm
// camp-clash          [a, b, c, d] a (d's side) and b (c's side) go at it over c and d
// camp-lobby          [a, b, c]  a talks to b (in the middle) about c. `of`: for · against
// camp-split          [a, b, c]  rivals a and b over c: the villa divided at dinner
// camp-switch         [a, b, c]  a has come over to b's side, from c's
// camp-after          [a, b, c]  c won; b is there for a. `of`: comfort · snipe
// feud-confront       [a, b, c]  a was left; b left a for c. `of`: hurt · furious
// feud-interrupt      [a, b, c]  a walks in on b and c
// feud-shade          [a, b, c]  a on b, the new one; c is a's ex. `of`: catty · civil
// feud-ick            [a, b, c]  a tells friend b about ex c: the ick, moving on
// feud-closure        [a, b]     a and ex b talk it out. `of`: peace · refused
// game-plan           [a, b]     a tells friend b the plan. `of`: ally · shocked
// game-latch          [a, b]     a works b, the one the villa likes
// game-two-faced      [a, b, c]  a says something about c to b, behind c's back
// game-suspect        [a, b, c]  a tells b: c is playing a game
// game-called         [a, b, c]  a calls b out in front of the villa; c is being played.
//                                `of`: denies · owns · turns
// game-fallout        [a, b]     a (played) and b (the player), after. `of`: ends · stays · unsure
// game-end            [a, b]     a the player, b the one played. `of`: real · amends · doubles-down
// {d} is named, never a speaker. Nothing names a past the engine didn't record.
import { build } from './build.js';

const S = { tiered: false };

// ── the love triangle ────────────────────────────────────────────────
export const TRIANGLE_TORN = build('triangle-torn', { ...S,
  plans: { featured: ['say', 'friend', 'land'], short: ['say', 'friend'] },
  moves: {
    say: [
      { stage: "{a} sits on the end of the bed with {b}, head in {a.posAdj} hands.", turns: [
        ['a', "I feel awful. I've got two people after me in here, and I like them both, and I can see what it's doing to them. Every time I talk to one, the other one goes quiet. I'm not trying to lead anyone on. I just don't know what I want yet."],
      ] },
      { stage: "{a} drags {b} up to the terrace.", turns: [
        ['a', "Can I talk to you about the whole situation? Because I'm losing my mind. One of them makes me laugh all the time. The other one makes me feel safe. And everyone keeps asking me to pick, like it's easy."],
      ] },
    ],
    friend: [
      { turns: [
        ['b', "You don't have to decide today. But you do have to be honest with both of them, because the longer this goes on, the worse it's going to be for whoever you don't pick."],
        ['a', "I know. I know you're right. I just hate it."],
      ] },
      { turns: [
        ['b', "Can I ask you something? When you imagine walking out of here, who's next to you? Don't think about it. Just say it."],
        ['a', "I don't know. That's the problem. I genuinely don't know."],
      ] },
      { turns: [
        ['b', "Honestly? I think you already know. I think you're just scared of hurting the other one."],
        ['a', "Maybe. Maybe I am."],
      ] },
    ],
    land: [
      { turns: [], beat: "{a} lies back on the bed and stares at the ceiling." },
      { turns: [], beat: "Down by the pool, both of them are looking up at the terrace." },
    ],
  },
});

export const TRIANGLE_RIVALS = build('triangle-rivals', { ...S,
  plans: { featured: ['open', 'talk', 'land'], short: ['talk', 'land'] },
  moves: {
    open: [
      { stage: "{a} and {b} end up alone in the kitchen. Both of them know why it's awkward.", turns: [] },
      { stage: "{a} sits down next to {b} on the daybeds, where {c} can't hear.", turns: [] },
    ],
    talk: [
      { when: { of: 'clash' }, turns: [
        ['a', "Can we stop pretending? We both like {c}. Everyone knows we both like {c}. And every time I sit with {c}, you find a reason to walk past."],
        ['b', "I'm allowed to walk past. It's a villa."],
        ['a', "You know what I mean."],
        ['b', "Then stop sitting with {c} like you own {c.obj}."],
      ] },
      { when: { of: 'clash' }, turns: [
        ['b', "I heard what you said about me to {c}."],
        ['a', "I didn't say anything that wasn't true."],
        ['b', "You said I'm only in it for the attention. That's not true, and you know it."],
        ['a', "Then prove it."],
      ] },
      { when: { of: 'size-up' }, turns: [
        ['a', "So. You and {c}."],
        ['b', "Me and {c}. And you and {c}."],
        ['a', "Weird, isn't it?"],
        ['b', "Very weird. May the best one win, I suppose."],
        ['a', "Yeah. May the best one win."],
      ] },
      { when: { of: 'size-up' }, turns: [
        ['b', "No hard feelings, whatever happens with {c}."],
        ['a', "No hard feelings."],
        ['b', "You don't mean that."],
        ['a', "Neither do you."],
      ] },
    ],
    land: [
      { turns: [], beat: "They both reach for the same glass, and both let go." },
      { turns: [], beat: "Across the garden, {c} catches them both looking over, and looks away fast." },
    ],
  },
});

export const TRIANGLE_CASE = build('triangle-case', { ...S,
  plans: { featured: ['open', 'case', 'answer', 'land'], short: ['case', 'answer'] },
  moves: {
    open: [
      { stage: "{a} takes {b} for a walk round the garden.", turns: [['a', "Can I say my bit? Then I'll leave you alone, I promise."]] },
      { stage: "{a} finds {b} on {b.posAdj} own by the fire pit.", turns: [['a', "I know you've got a lot going on. I just want five minutes."]] },
    ],
    case: [
      { turns: [
        ['a', "I know {c} is in the picture. I'm not going to slag {c} off, because that's not who I am. But I want you to know that I'm not going anywhere. Whatever you decide, I've been myself with you since day one, and I'm not going to change that to win."],
      ] },
      { turns: [
        ['a', "Can I just say what I see? When you're with me, you laugh. Properly laugh. When you're with {c}, you're polite. I'm not saying that to be nasty. I just think you should notice it."],
      ] },
      { turns: [
        ['a', "I'm not asking you to choose today. I'm asking you to think about who you'd want next to you on a bad day. Not a good one. A bad one. That's the person."],
      ] },
    ],
    answer: [
      { turns: [
        ['b', "I hear you. I really do. And I'm sorry this is taking so long. I just don't want to get it wrong, for either of you."],
        ['a', "Then don't. Take your time. I'll be here."],
      ] },
      { turns: [
        ['b', "That's not fair on {c}."],
        ['a', "Maybe not. But it's true."],
        ['b', "I know it's true. That's what makes it hard."],
      ] },
    ],
    land: [
      { turns: [], beat: "{a} walks off without looking back. {b} watches {a.obj} go for a long time." },
      { turns: [], beat: "{b} sits there afterwards, turning it over and over." },
    ],
  },
});

export const TRIANGLE_ULTIMATUM = build('triangle-ultimatum', { ...S,
  plans: { featured: ['demand', 'answer', 'land'], short: ['demand', 'answer'] },
  moves: {
    demand: [
      { stage: "{a} sits {b} down on the terrace. No smile.", turns: [
        ['a', "I can't do this anymore. I can't keep watching you go back and forth between me and {c}. It's killing me. So I need you to decide. Tonight. Me, or {c}."],
      ] },
      { stage: "{a} stops {b} by the pool.", turns: [
        ['a', "I'm not going to be anyone's maybe. Not in here, not anywhere. You've had long enough. It's me or it's {c}, and I need to hear it from you now."],
      ] },
    ],
    answer: [
      { when: { of: 'chose-x' }, turns: [
        ['b', "It's you. It's been you for a while, if I'm honest. I was just too scared to say it, because I didn't want to hurt {c}."],
        ['a', "Say it again."],
        ['b', "It's you."],
      ] },
      { when: { of: 'chose-y' }, turns: [
        ['b', "I'm so sorry. It's {c}. I didn't want it to come out like this. I didn't want it to be today. But you asked me, and I'm not going to lie to you."],
        ['a', "Right. Okay. Thank you for being honest."],
      ] },
      { when: { of: 'not-yet' }, turns: [
        ['b', "I can't. Not tonight. I'm not going to say a name just because you've told me to. That's not fair on any of us."],
        ['a', "Then I've got my answer, haven't I?"],
        ['b', "No. You haven't. That's the point."],
      ] },
    ],
    land: [
      { when: { of: 'chose-x' }, turns: [], beat: "{a} pulls {b} into a kiss. Somewhere inside, {c} is about to find out." },
      { when: { of: 'chose-y' }, turns: [], beat: "{a} walks away fast, before anyone can see {a.posAdj} face." },
      { when: { of: 'not-yet' }, turns: [], beat: "They walk back to the villa separately. Nobody asks how it went." },
    ],
  },
});

export const TRIANGLE_TEAMS = build('triangle-teams', { ...S,
  plans: { featured: ['split'], short: ['split'] },
  moves: {
    split: [
      { stage: "Dinner. The villa has picked sides over {a}: one end of the table is Team {b}, the other is Team {c}.", turns: [], beat: "Nobody says it out loud. Nobody needs to." },
      { stage: "On the daybeds, the villa argues about {a}. Half of them think it should be {b}. The other half think it should be {c}.", turns: [], beat: "{a} sits in the middle of it, wishing everyone would stop." },
      { stage: "By the pool, everyone has an opinion on who {a} should pick, {b} or {c}, and none of them are being quiet about it.", turns: [], beat: "{a} gets up and goes inside." },
    ],
  },
});

export const TRIANGLE_CHOICE = build('triangle-choice', { ...S,
  plans: { featured: ['moment', 'talk', 'land'], short: ['moment', 'land'] },
  moves: {
    moment: [
      { when: { of: 'pick' }, stage: "It's done. {a} chose {b}, and {c} is the one left looking.", turns: [] },
      { when: { of: 'default' }, stage: "{a} ended up with {b}. Not because {a} chose. Because {c} stopped waiting.", turns: [] },
    ],
    talk: [
      { when: { of: 'pick' }, turns: [
        ['b', "Are you sure? Because I need you to be sure. I can't do another week of wondering."],
        ['a', "I'm sure. I'm sorry it took so long. I'm sorry for all of it. But I'm sure."],
      ] },
      { when: { of: 'default' }, turns: [
        ['b', "Can I ask you something? If {c} hadn't walked away, would you be here with me?"],
        ['a', "I'm here now."],
        ['b', "That's not an answer."],
      ] },
    ],
    land: [
      { turns: [], beat: "Across the garden, {c} is pretending to be fine, and nobody believes it." },
      { turns: [], beat: "{a} takes {b}'s hand. {b} lets {a.obj}, but doesn't squeeze back." },
    ],
  },
});

// ── the villa takes sides ────────────────────────────────────────────
export const CAMP_RALLY = build('camp-rally', { ...S,
  plans: { featured: ['find', 'rally', 'land'], short: ['rally', 'land'] },
  moves: {
    find: [
      { stage: "{b} finds {a} on the terrace after what {c} did.", turns: [['b', "Are you okay? I saw all of that."]] },
      { stage: "{b} sits down next to {a} on the swing seat.", turns: [['b', "I've heard what {c} has been saying. Talk to me."]] },
    ],
    rally: [
      { turns: [
        ['a', "I'm fine. I'm just tired of it. Every day it's something with {c}. A look, a comment, a little dig at dinner. I haven't done anything to deserve it."],
        ['b', "You haven't. And you're not on your own. Everyone can see what {c} is doing, and nobody's buying it."],
      ] },
      { turns: [
        ['b', "Listen to me. You don't need to rise to it. That's what {c} wants. You keep being yourself, and let {c} be the one who looks bad."],
        ['a', "It's hard not to rise to it."],
        ['b', "I know. That's why I'm here. When you want to rise to it, come and find me instead."],
      ] },
    ],
    land: [
      { turns: [], beat: "{b} puts an arm round {a}, and for the first time all day, {a} smiles." },
      { turns: [['a', "Thank you. Honestly."], ['b', "Always."]] },
    ],
  },
});

export const CAMP_CONFRONT = build('camp-confront', { ...S,
  plans: { featured: ['open', 'go', 'answer', 'land'], short: ['go', 'answer'] },
  moves: {
    open: [
      { when: { of: 'hot' }, stage: "{a} marches across the garden to {b}.", turns: [] },
      { when: { of: 'calm' }, stage: "{a} walks with {b} down to the pool.", turns: [] },
    ],
    go: [
      { when: { of: 'hot' }, turns: [
        ['a', "Can you leave {c} alone? Seriously. What you've been doing to {c} all week is out of order, and I'm not going to sit there and watch it any more."],
        ['b', "This has got nothing to do with you."],
        ['a', "{c} is my friend. It's got everything to do with me."],
      ] },
      { when: { of: 'calm' }, turns: [
        ['a', "You and {c} need to sort this out. I don't care who started it. It's making the whole villa miserable, and {c} is really upset."],
        ['b', "{c} started it."],
        ['a', "I don't care who started it. I care that it stops."],
      ] },
    ],
    answer: [
      { when: { of: 'hot' }, turns: [
        ['b', "You don't know the half of it."],
        ['a', "I know enough."],
      ] },
      { when: { of: 'calm' }, turns: [
        ['b', "Okay. Okay. I'll talk to {c}."],
        ['a', "Properly. Not just a sorry on the way past."],
        ['b', "Properly."],
      ] },
    ],
    land: [
      { when: { of: 'hot' }, turns: [], beat: "Half the garden has gone quiet to listen." },
      { when: { of: 'calm' }, turns: [], beat: "{b} looks over at {c}, and something softens." },
    ],
  },
});

export const CAMP_CLASH = build('camp-clash', { ...S,
  plans: { featured: ['clash', 'land'], short: ['clash', 'land'] },
  moves: {
    clash: [
      { stage: "It kicks off between {a} and {b}, about {c} and {d}, like everyone knew it would.", turns: [
        ['b', "You need to stop defending {d}. Honestly. {d} has been out of order with {c} all week."],
        ['a', "{d} has been out of order? Have you heard what {c} says when {d} leaves the room?"],
        ['b', "That's not the same thing."],
        ['a', "It's exactly the same thing. You just don't want to see it because {c} is your friend."],
      ] },
      { stage: "At dinner, {a} and {b} start on each other across the table.", turns: [
        ['a', "Why are you always taking {c}'s side?"],
        ['b', "Why are you always taking {d}'s?"],
        ['a', "Because {d} is right!"],
        ['b', "Nobody in this is right. That's the whole problem."],
      ] },
    ],
    land: [
      { turns: [], beat: "{c} and {d} sit at opposite ends of the table, saying nothing, while their friends fight it out for them." },
      { turns: [], beat: "Someone suggests they all calm down. Nobody does." },
    ],
  },
});

export const CAMP_LOBBY = build('camp-lobby', { ...S,
  plans: { featured: ['open', 'lobby', 'answer', 'land'], short: ['lobby', 'answer'] },
  moves: {
    open: [
      { stage: "In the dressing room, {a} does {b}'s hair, and gets to the point.", turns: [] },
      { stage: "{a} sits down next to {b} and lowers {a.posAdj} voice.", turns: [] },
    ],
    lobby: [
      { when: { of: 'against' }, turns: [
        ['a', "Can I say something, and you don't take it the wrong way? I'd be careful with {c}. I've watched how {c} talks about people when they're not there, and I just don't think {c} is being genuine with you."],
      ] },
      { when: { of: 'against' }, turns: [
        ['a', "Do you actually trust {c}? Because I don't. {c} is very good at saying the right thing at the right time, and I'd hate for you to find that out the hard way."],
      ] },
      { when: { of: 'for' }, turns: [
        ['a', "I know there's a lot of noise about {c} at the moment. But I've spent a lot of time with {c}, and {c} is a good person. I just think you should hear it from someone who actually knows."],
      ] },
      { when: { of: 'for' }, turns: [
        ['a', "Whatever people are saying about {c}, don't listen to it. {c} has been nothing but kind to me since I walked in. Make up your own mind."],
      ] },
    ],
    answer: [
      { when: { of: 'against' }, turns: [
        ['b', "Why are you telling me this?"],
        ['a', "Because I care about you. That's it."],
        ['b', "Now I'm worried."],
      ] },
      { when: { of: 'for' }, turns: [
        ['b', "That's actually really nice to hear. Everyone's been so negative."],
        ['a', "Everyone's got their own reasons for being negative."],
      ] },
    ],
    land: [
      { when: { of: 'against' }, turns: [], beat: "{b} watches {c} for the rest of the night, differently." },
      { when: { of: 'for' }, turns: [], beat: "{b} goes and sits with {c} at dinner, which says enough." },
    ],
  },
});

export const CAMP_SPLIT = build('camp-split', { ...S,
  plans: { featured: ['split'], short: ['split'] },
  moves: {
    split: [
      { stage: "Dinner is two tables tonight. One is {a}'s side, one is {b}'s. It's all about {c}, and nobody says so.", turns: [], beat: "{c} sits in between, and eats very quickly." },
      { stage: "The villa has split down the middle over {a}, {b} and {c}. You can see it in who sits where.", turns: [], beat: "Every so often someone glances across at the other side." },
    ],
  },
});

export const CAMP_SWITCH = build('camp-switch', { ...S,
  plans: { featured: ['say', 'land'], short: ['say', 'land'] },
  moves: {
    say: [
      { stage: "{a} sits down next to {b} at the kitchen table, and the whole table notices.", turns: [
        ['a', "I owe you an apology. I took {c}'s side without hearing yours, and I've realised I got it wrong. I'm sorry."],
        ['b', "That means a lot. Honestly."],
      ] },
      { stage: "{a} finds {b} on the terrace.", turns: [
        ['a', "I've been watching how {c} has been this week, and I can't defend it anymore. I'm not on anyone's side. But if I was, it'd be yours."],
        ['b', "What changed?"],
        ['a', "I listened properly."],
      ] },
    ],
    land: [
      { turns: [], beat: "Across the garden, {c} sees them sitting together, and understands." },
    ],
  },
});

export const CAMP_AFTER = build('camp-after', { ...S,
  plans: { featured: ['say', 'land'], short: ['say', 'land'] },
  moves: {
    say: [
      { when: { of: 'comfort' }, stage: "{b} finds {a} on {a.posAdj} own after it's all over.", turns: [
        ['b', "{c} won. I know. But you held your head up the whole time, and everyone saw that. You didn't play dirty. That counts for something."],
        ['a', "Does it?"],
        ['b', "It does to me."],
      ] },
      { when: { of: 'snipe' }, stage: "{b} sits down next to {a} and looks across at {c}.", turns: [
        ['b', "Honestly? {c} is welcome to it. Give it a week, and the villa will see what {c} is really like."],
        ['a', "Don't. I don't want to be bitter about it."],
        ['b', "Then I'll be bitter for you."],
      ] },
    ],
    land: [
      { turns: [], beat: "{a} rests {a.posAdj} head on {b}'s shoulder." },
    ],
  },
});

// ── exes at war ──────────────────────────────────────────────────────
export const FEUD_CONFRONT = build('feud-confront', { ...S,
  plans: { featured: ['open', 'say', 'answer', 'land'], short: ['say', 'answer'] },
  moves: {
    open: [
      { stage: "{a} finally gets {b} on {b.posAdj} own, away from {c}.", turns: [['a', "I think we need to talk. Don't you?"]] },
      { stage: "{a} stops {b} on the stairs.", turns: [['a', "You're not walking past me again. Not today."]] },
    ],
    say: [
      { when: { of: 'hurt' }, turns: [
        ['a', "You told me I had nothing to worry about. You looked me in the eye and said it. And then you went off with {c}, like none of it meant anything. I'm not angry. I'm just really hurt."],
      ] },
      { when: { of: 'furious' }, turns: [
        ['a', "How long were you going to keep pretending? Days? Weeks? Everyone knew about you and {c} before I did. Everyone! Do you know how stupid I feel?"],
      ] },
    ],
    answer: [
      { turns: [
        ['b', "I never meant for it to happen like this. I didn't plan to fall for {c}. It just happened."],
        ['a', "Things don't just happen. You let it happen."],
      ] },
      { turns: [
        ['b', "I'm sorry. I really am. I should have told you myself, and I didn't, and that's on me."],
        ['a', "It is on you."],
      ] },
    ],
    land: [
      { turns: [], beat: "{a} walks off. {c}, watching from the pool, looks away." },
      { turns: [], beat: "{b} stands there for a long time after {a} has gone." },
    ],
  },
});

export const FEUD_INTERRUPT = build('feud-interrupt', { ...S,
  plans: { featured: ['walk', 'land'], short: ['walk', 'land'] },
  moves: {
    walk: [
      { stage: "{a} walks round the corner and straight into {b} and {c}, mid-kiss.", turns: [
        ['a', "Oh. Great. Don't stop on my account."],
        ['b', "{a}, wait."],
        ['a', "No, honestly. Carry on. You clearly were."],
      ] },
      { stage: "{a} sits down on the daybed right next to {b} and {c}.", turns: [
        ['c', "Can we help you?"],
        ['a', "I'm just sitting down. It's a free villa."],
        ['b', "Seriously?"],
      ] },
    ],
    land: [
      { turns: [], beat: "{a} walks off. {b} and {c} look at each other, and the moment is gone." },
    ],
  },
});

export const FEUD_SHADE = build('feud-shade', { ...S,
  plans: { featured: ['say', 'land'], short: ['say', 'land'] },
  moves: {
    say: [
      { when: { of: 'catty' }, stage: "{a} walks past {b} by the pool, and stops.", turns: [
        ['a', "Good luck with {c}. You'll need it. I'd keep an eye on {c} if I were you. I know what {c} is like."],
        ['b', "Thanks for the advice."],
        ['a', "Any time."],
      ] },
      { when: { of: 'civil' }, stage: "{a} and {b} end up alone in the kitchen.", turns: [
        ['a', "Look, this isn't your fault. Whatever happened between me and {c}, you weren't part of it. I'm not going to be weird with you."],
        ['b', "Thank you. I appreciate that."],
      ] },
    ],
    land: [
      { turns: [], beat: "{b} goes straight to find {c}." },
      { turns: [], beat: "It's polite. It's very, very polite." },
    ],
  },
});

export const FEUD_ICK = build('feud-ick', { ...S,
  plans: { featured: ['say', 'land'], short: ['say', 'land'] },
  moves: {
    say: [
      { stage: "{a} and {b} sit on the sunbeds, watching {c} across the pool.", turns: [
        ['a', "Do you know what? I'm completely over {c}. I watched {c} laughing at nothing at dinner, and it gave me the ick. A {~proper} ick. And I thought, why was I ever upset about that?"],
        ['b', "That's growth, that is."],
        ['a', "That's the ick. But I'll take growth."],
      ] },
      { stage: "{a} lies back on the daybed with {b}.", turns: [
        ['a', "I've stopped caring about what {c} is doing. Honestly. A week ago I'd have been in bits. Now I just think, good luck to whoever's next."],
        ['b', "Look at you, moving on."],
      ] },
    ],
    land: [
      { turns: [], beat: "{a} doesn't look over at {c} once for the rest of the afternoon. Mostly." },
    ],
  },
});

export const FEUD_CLOSURE = build('feud-closure', { ...S,
  plans: { featured: ['open', 'talk', 'land'], short: ['talk', 'land'] },
  moves: {
    open: [
      { stage: "{a} asks {b} for a chat by the fire pit. It's the first time they've been alone in days.", turns: [] },
    ],
    talk: [
      { when: { of: 'peace' }, turns: [
        ['a', "I don't want us to be like this until the end. We were something, once. I don't want the last thing to be us not looking at each other across the kitchen."],
        ['b', "Me neither. I'm sorry for how it ended. I really am."],
        ['a', "I'm sorry too. Friends?"],
        ['b', "Friends."],
      ] },
      { when: { of: 'refused' }, turns: [
        ['a', "Can we just clear the air? For both our sakes?"],
        ['b', "I don't think I'm ready for that. I'm sorry. It's still too raw."],
        ['a', "Okay. Whenever you are, then."],
      ] },
    ],
    land: [
      { when: { of: 'peace' }, turns: [], beat: "They hug, and it lasts a little longer than either of them expected." },
      { when: { of: 'refused' }, turns: [], beat: "{b} walks back to the villa. {a} stays by the fire." },
    ],
  },
});

// ── the game player ──────────────────────────────────────────────────
export const GAME_PLAN = build('game-plan', { ...S,
  plans: { featured: ['say', 'answer', 'land'], short: ['say', 'answer'] },
  moves: {
    say: [
      { stage: "The roof terrace, late. {a} and {b} are on their own.", turns: [
        ['a', "Can I be honest with you, because you're the only one in here I trust? I'm not here to fall in love. I'm here to get to the final. And I know exactly how to get there."],
      ] },
      { stage: "{a} pulls {b} into the dressing room and shuts the door.", turns: [
        ['a', "Everyone in here is so busy falling for each other that they've forgotten there's a public voting. I haven't. I know who the public love, and I know who I need to be next to."],
      ] },
    ],
    answer: [
      { when: { of: 'ally' }, turns: [
        ['b', "Go on, then. Who?"],
        ['a', "The one everybody likes. Stand next to them, and some of it rubs off."],
        ['b', "That's actually clever. Horrible, but clever."],
      ] },
      { when: { of: 'shocked' }, turns: [
        ['b', "Are you being serious? You're going to use someone?"],
        ['a', "I'm going to win. There's a difference."],
        ['b', "Is there?"],
      ] },
    ],
    land: [
      { when: { of: 'ally' }, turns: [], beat: "They go back down to the others, all smiles." },
      { when: { of: 'shocked' }, turns: [], beat: "{b} goes downstairs and watches {a} for the rest of the night." },
    ],
  },
});

export const GAME_LATCH = build('game-latch', { ...S,
  plans: { featured: ['work', 'land'], short: ['work', 'land'] },
  moves: {
    work: [
      { stage: "{a} brings {b} a drink and sits down very close.", turns: [
        ['a', "Do you know what everyone says about you? That you're the nicest person in here. And they're right. I've never met anyone like you."],
        ['b', "Stop it. That's so sweet."],
        ['a', "I mean it. I want to spend more time with you. Is that okay?"],
        ['b', "Of course it's okay."],
      ] },
      { stage: "{a} helps {b} make lunch for everyone, laughing at every one of {b}'s jokes.", turns: [
        ['a', "You're so funny. Why does nobody talk about how funny you are?"],
        ['b', "Everyone thinks I'm the sensible one."],
        ['a', "Well, I think you're the best one."],
      ] },
    ],
    land: [
      { turns: [], beat: "{b} beams. Across the kitchen, someone watching {a} raises an eyebrow." },
    ],
  },
});

export const GAME_TWO_FACED = build('game-two-faced', { ...S,
  plans: { featured: ['say', 'land'], short: ['say', 'land'] },
  moves: {
    say: [
      { stage: "As soon as {c} goes inside, {a} leans over to {b}.", turns: [
        ['a', "Between you and me, I'd be careful with {c}. All smiles to your face, and then I've heard what gets said when you're not there. I'm only telling you because I care."],
        ['b', "Really? {c} has always been lovely to me."],
        ['a', "That's what worries me."],
      ] },
      { stage: "{a} sits down with {b} on the sunbeds.", turns: [
        ['a', "Can I tell you something about {c}? Don't say I said anything. I just don't think {c} is as genuine as everyone thinks."],
        ['b', "What do you mean?"],
        ['a', "Just watch. You'll see it."],
      ] },
    ],
    land: [
      { turns: [], beat: "When {c} comes back, {a} is the first to say how nice it is to see {c.obj}." },
    ],
  },
});

export const GAME_SUSPECT = build('game-suspect', { ...S,
  plans: { featured: ['say', 'answer', 'land'], short: ['say', 'answer'] },
  moves: {
    say: [
      { stage: "On the sunbeds, {a} keeps {a.posAdj} voice down.", turns: [
        ['a', "Can I tell you what I think? I think {c} is playing a game. I watch {c} all day, and every move {c} makes is a move. Who {c} sits with. Who {c} laughs at. It's all planned."],
      ] },
      { stage: "{a} and {b} are on washing-up duty, watching {c} across the garden.", turns: [
        ['a', "Have you noticed {c} only ever goes for whoever's doing best with the public? It's not a coincidence. I'm telling you."],
      ] },
    ],
    answer: [
      { turns: [
        ['b', "Maybe it's real. People do actually fall for each other in here."],
        ['a', "Maybe. I just don't buy it. Not from {c}."],
      ] },
      { turns: [
        ['b', "You're not the first person to say that, you know."],
        ['a', "Then I'm not mad, am I?"],
      ] },
    ],
    land: [
      { turns: [], beat: "They both watch {c} for the rest of the afternoon." },
    ],
  },
});

export const GAME_CALLED = build('game-called', { ...S,
  plans: { featured: ['call', 'answer', 'land'], short: ['call', 'answer'] },
  moves: {
    call: [
      { stage: "At the fire pit, in front of everyone, {a} says it.", turns: [
        ['a', "I'm sorry, but someone has to say it. {b}, you're playing a game. You've been playing {c} since the day you walked in, and everyone in this villa can see it except {c}."],
      ] },
      { stage: "On the lawn, in front of the whole villa, {a} turns to {b}.", turns: [
        ['a', "Admit it. You went for {c} because everybody likes {c}. Not because you like {c}. Because of what it does for you."],
      ] },
    ],
    answer: [
      { when: { of: 'denies' }, turns: [
        ['b', "That's ridiculous. That's actually outrageous. I'm with {c} because I like {c}. End of."],
        ['c', "Is that true?"],
        ['b', "Of course it's true."],
      ] },
      { when: { of: 'owns' }, turns: [
        ['b', "And? I'm still here, aren't I? This is a game. Some of us just admit it."],
        ['c', "Wow. Okay."],
      ] },
      { when: { of: 'turns' }, turns: [
        ['b', "You want to talk about games? Let's talk about yours. Everyone knows why you're really saying this."],
        ['a', "This isn't about me."],
        ['b', "It's always about you."],
      ] },
    ],
    land: [
      { turns: [], beat: "The fire pit goes dead quiet. {c} looks from one to the other." },
      { turns: [], beat: "{c} gets up and walks off, and nobody follows straight away." },
    ],
  },
});

export const GAME_FALLOUT = build('game-fallout', { ...S,
  plans: { featured: ['open', 'talk', 'land'], short: ['talk', 'land'] },
  moves: {
    open: [
      { stage: "{a} finds {b} on the terrace after everything that was said.", turns: [] },
    ],
    talk: [
      { when: { of: 'ends' }, turns: [
        ['a', "Was any of it real? Be honest with me, for once."],
        ['b', "Some of it."],
        ['a', "Some of it isn't enough. I'm done."],
      ] },
      { when: { of: 'stays' }, turns: [
        ['a', "I don't care what anyone says. I know what we've got. Tell me I'm right."],
        ['b', "You're right."],
        ['a', "Then that's all that matters."],
      ] },
      { when: { of: 'unsure' }, turns: [
        ['a', "I don't know what to believe anymore. Everyone's telling me one thing, and you're telling me another."],
        ['b', "Then believe me."],
        ['a', "I'm trying. I really am."],
      ] },
    ],
    land: [
      { when: { of: 'ends' }, turns: [], beat: "{a} goes back downstairs alone." },
      { when: { of: ['stays', 'unsure'] }, turns: [], beat: "{a} takes {b}'s hand, but doesn't look at {b.obj}." },
    ],
  },
});

export const GAME_END = build('game-end', { ...S,
  plans: { featured: ['say', 'land'], short: ['say', 'land'] },
  moves: {
    say: [
      { when: { of: 'real' }, stage: "{a} sits down next to {b}, without the usual smile.", turns: [
        ['a', "I'm going to say something, and you might not believe it. When I came in here, I had a plan. And somewhere along the way, I stopped following it, because I actually fell for you. That part wasn't a game."],
        ['b', "How am I supposed to know that?"],
        ['a', "I'll show you. Every day, until you do."],
      ] },
      { when: { of: 'amends' }, stage: "{a} finds {b} by the pool.", turns: [
        ['a', "I owe you an apology. I wasn't fair to you. I was thinking about the game, and you were thinking about me, and that's not okay."],
        ['b', "No. It isn't."],
        ['a', "I'm sorry. Truly."],
      ] },
      { when: { of: 'doubles-down' }, stage: "{a} doesn't even look up when {b} sits down.", turns: [
        ['b', "Have you got nothing to say to me?"],
        ['a', "What do you want me to say? It's a game. You knew that when you walked in."],
        ['b', "I didn't know you'd play it on me."],
      ] },
    ],
    land: [
      { turns: [], beat: "{b} doesn't say anything for a long time." },
    ],
  },
});
