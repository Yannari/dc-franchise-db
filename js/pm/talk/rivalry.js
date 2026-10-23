// ══════════════════════════════════════════════════════════════════════
// pm/talk/rivalry.js — two after the same one, and the crush that isn't returned
// ══════════════════════════════════════════════════════════════════════
//
// The storyline is the engine's (pm/rivalry.js); every scene names it first,
// so nobody reading has to guess who wants whom (season read, 2026-10-22:
// seven four-line scraps under "Wanting the same one", none saying what it was).
//   rival-shade     [a, b, c]  a throws shade at rival b over c. `of`: behind · face
//   rival-play      [a, b, c]  a goes for b in front of rival c. `of`: interrupt · play · fair
//   code-call       [a, b, c]  a calls b out for going after c's partner
//   rival-row       [a, b, c]  rivals a and b, over c. `of`: row · clear-air
//   rival-step-back [a, b, c]  a stops competing for c. `of`: friend (b a friend) · to-rival (b the rival)
//   rival-won       [a, b, c]  c chose a over b. `of`: gracious · bitter
//   crush-confide   [a, b, c]  a tells friend b about c. `of`: go-for-it · careful
//   crush-watch     [a, b, c]  a watches b with b's partner c. `of`: hurt · catty
//   crush-move      [a, b]     a goes for b. `of`: let-down · friend-zone · leads-on · maybe
//   crush-plea      [a, b]     a is b's partner, and asks for more. `of`: warmer · colder
//   crush-over      [a, b]     a is done waiting for b. `of`: moving-on · led-on
// Plain words: catty is catty, never clever. Nothing names a past the engine
// didn't record ("the way you are with {c}", never "last night").
import { build } from './build.js';

const STORY = { tiered: false };

export const RIVAL_SHADE = build('rival-shade', {
  ...STORY,
  plans: { featured: ['dig', 'answer', 'land'], short: ['dig', 'land'] },
  moves: {
    dig: [
      { when: { of: 'behind' }, stage: "{a} is on the daybeds with the others, not keeping {a.posAdj} voice down.", turns: [
        ['a', "Has anyone else noticed how hard {b} is trying with {c}? Like, every time {c} sits down, {b} appears. It's a bit much, isn't it? I'm not being funny, but it's a bit embarrassing."],
        ['b', "I can hear you, you know."],
        ['a', "Good."],
      ] },
      { when: { of: 'behind' }, stage: "In the kitchen, {a} leans over to the others while {b} is at the fridge.", turns: [
        ['a', "I just think some people need to realise {c} isn't interested. It's been days. You'd think they'd have got the message by now."],
        ['b', "Is that about me?"],
        ['a', "If it was about you, I'd say your name."],
        ['b', "You basically did."],
      ] },
      { when: { of: 'behind', archetype: ['villain', 'mastermind', 'schemer'] }, stage: "{a} sits down with the others and smiles.", turns: [
        ['a', "I think it's sweet, honestly. {b} following {c} round like a puppy. Someone should tell {b.obj} it's not working, but it's not going to be me."],
        ['b', "Someone should tell you to mind your own business."],
        ['a', "Touchy."],
      ] },
      { when: { of: 'face' }, stage: "{a} walks straight up to {b} on the lawn.", turns: [
        ['a', "Can I be honest with you? I like {c}. I've liked {c} since I walked in, and I'm not going to pretend I don't just because you've decided you like {c} too."],
        ['b', "I'm not pretending either. I like {c}."],
        ['a', "Then at least we both know where we stand."],
      ] },
      { when: { of: 'face' }, stage: "{a} catches {b} on the way back from talking to {c}.", turns: [
        ['a', "You know I'm getting to know {c}, right? Like, properly. It's not a secret."],
        ['b', "I know. So am I."],
        ['a', "I'm just saying. I'm not going anywhere."],
        ['b', "Neither am I."],
      ] },
      { when: { of: 'face' }, stage: "{a} sits down right next to {b}.", turns: [
        ['a', "Do you actually like {c}, or do you just like the attention of everyone watching the two of us go for the same person?"],
        ['b', "Wow."],
        ['a', "It's a fair question."],
        ['b', "It's a rude question."],
      ] },
    ],
    answer: [
      { when: { of: 'behind' }, turns: [
        ['b', "If you've got something to say about me and {c}, say it to my face. Not to everyone else, loud enough for me to hear. That's just cowardly."],
        ['a', "I'm not saying anything. I'm having a conversation."],
        ['b', "About me."],
      ] },
      { when: { of: 'face' }, turns: [
        ['b', "Look, {c} can make up {c.posAdj} own mind. I'm not going to stop talking to {c} because you got there first. That's not how it works in here."],
        ['a', "It's how it should work."],
      ] },
      { turns: [
        ['b', "I'm not doing this with you. Honestly, it's not worth it. Whatever happens with {c} happens."],
        ['a', "Easy for you to say."],
      ] },
    ],
    land: [
      { turns: [], beat: "Nobody on the daybeds knows where to look." },
      { turns: [], beat: "{b} walks off. Across the garden, {c} has seen all of it." },
      { turns: [], beat: "They stare at each other, then go off in opposite directions." },
      { turns: [['a', "Whatever."]], beat: "{a} goes back to {a.posAdj} drink as if nothing happened." },
    ],
  },
});

export const RIVAL_PLAY = build('rival-play', {
  ...STORY,
  plans: { featured: ['move', 'talk', 'land'], short: ['move', 'land'] },
  moves: {
    move: [
      { when: { of: 'interrupt' }, stage: "{c} is on the daybed with {b}. {a} walks straight over.", turns: [
        ['a', "Sorry, can I borrow {b} for a minute?"],
        ['c', "We're in the middle of something."],
        ['a', "It won't take long. I promise I'll give {b.obj} back."],
        ['b', "Yeah, go on. Two minutes."],
      ] },
      { when: { of: 'interrupt' }, stage: "{a} sits down between {b} and {c} on the swing seat.", turns: [
        ['a', "What are we talking about?"],
        ['c', "We were talking. Just us."],
        ['a', "Well, now it's the three of us. Isn't this nice?"],
        ['b', "This is very awkward."],
      ] },
      { when: { of: 'interrupt' }, stage: "{a} walks up with two drinks while {c} is mid-conversation with {b}.", turns: [
        ['a', "I got you one. The way you like it."],
        ['c', "I was literally just about to get {b} a drink."],
        ['a', "Too late."],
      ] },
      { when: { of: 'play' }, stage: "On the lawn, where {c} can see, {a} sits down close to {b}.", turns: [
        ['a', "I'll be honest with you, because I think you deserve that. You're the one I'm here for. I know {c} likes you too. I don't care. I'm not backing off."],
        ['b', "That's a lot."],
        ['a', "I don't do things by halves."],
      ] },
      { when: { of: 'play' }, stage: "{a} brings {b} breakfast on the daybed while {c} is still in the kitchen.", turns: [
        ['b', "What's this for?"],
        ['a', "Nothing. I wanted to. Is that allowed?"],
        ['b', "It's allowed. It's just very obvious."],
        ['a', "Good. I'm trying to be obvious."],
      ] },
      { when: { of: 'fair' }, stage: "{a} asks {b} for a chat, right in front of everyone.", turns: [
        ['a', "I know {c} likes you too. Everyone knows. I'm not going to go behind anyone's back, and I'm not going to slag {c} off to get you. But I'm not going to hide how I feel either."],
        ['b', "I appreciate that. Honestly."],
      ] },
      { when: { of: 'fair' }, stage: "On the swing seat, {a} and {b} talk while {c} does lengths in the pool.", turns: [
        ['a', "Whatever happens with me and {c}, I want you to pick whoever makes you happy. Even if it isn't me."],
        ['b', "Even if it isn't you?"],
        ['a', "Even if it isn't me. I'd just really rather it was."],
      ] },
    ],
    talk: [
      { turns: [
        ['b', "Can I ask you something? Is this about me, or is this about beating {c}?"],
        ['a', "It's about you. I promise. {c} just happens to be in the way."],
        ['b', "That's not a great way of putting it."],
        ['a', "I know. I'm nervous."],
      ] },
      { turns: [
        ['b', "You know this is going to cause drama, right?"],
        ['a', "Everything in here causes drama. I'd rather cause it for something I actually want."],
      ] },
      { turns: [
        ['a', "What do you like about {c}? Honestly. I want to know what I'm up against."],
        ['b', "{c} makes me laugh. {c} is easy to be around."],
        ['a', "I make you laugh."],
        ['b', "You do. That's the problem."],
      ] },
    ],
    land: [
      { turns: [], beat: "From across the lawn, {c} has been watching every second of it." },
      { turns: [], beat: "{c} gets up and goes inside. Nobody needs to ask why." },
      { turns: [], beat: "{b} looks from {a} to {c}, and doesn't know what to do with {b.posAdj} face." },
      { turns: [['c', "Unbelievable."]], beat: "{c} says it to nobody in particular, and everybody hears." },
    ],
  },
});

export const CODE_CALL = build('code-call', {
  ...STORY,
  plans: { featured: ['call', 'answer', 'land'], short: ['call', 'land'] },
  moves: {
    call: [
      { when: { gender: 'f' }, stage: "{a} marches over to {b} on the lawn.", turns: [
        ['a', "What happened to girl code? Honestly. You've been all over {c}'s partner all day, and you know exactly what you're doing. I'd never do that to another girl. Never."],
        ['b', "I haven't done anything. We were talking."],
        ['a', "Talking? Right."],
      ] },
      { when: { gender: 'm' }, stage: "{a} pulls {b} away from the others by the gym.", turns: [
        ['a', "{~Mate}, that's {c}'s partner. You know that, right? {c} is one of the boys. You don't do that to one of the boys."],
        ['b', "We were just chatting."],
        ['a', "It didn't look like just chatting from over there."],
      ] },
      { stage: "{a} sits down next to {b}, very calm.", turns: [
        ['a', "I'm not having a go. I just think you should know how it looks from the outside. You've been going after {c}'s partner, and {c} has seen every bit of it."],
        ['b', "How does it look?"],
        ['a', "Like you don't care who gets hurt."],
      ] },
    ],
    answer: [
      { turns: [
        ['b', "They're not married. If someone's interested in me, I'm allowed to talk to them. That's literally what we're all here for."],
        ['a', "There's a way to do it, though. And that wasn't it."],
      ] },
      { turns: [
        ['b', "That's not fair. I haven't done anything behind anyone's back."],
        ['a', "Then prove it. Go and talk to {c}."],
      ] },
      { turns: [
        ['c', "It's fine. Honestly. I'd rather know who people really are."],
        ['b', "That's not fair either."],
      ] },
    ],
    land: [
      { turns: [], beat: "{b} walks off. {a} doesn't take {a.posAdj} eyes off {b.obj}." },
      { turns: [], beat: "The garden goes quiet. Everyone heard." },
      { turns: [], beat: "{c} gives {a} a grateful look across the garden." },
    ],
  },
});

export const RIVAL_ROW = build('rival-row', {
  ...STORY,
  plans: { featured: ['open', 'row', 'end'], short: ['row', 'end'] },
  moves: {
    open: [
      { when: { of: 'row' }, stage: "It starts by the pool and gets louder, about {c}, like it was always going to.", turns: [] },
      { when: { of: 'row' }, stage: "In the kitchen, {a} slams a cupboard shut as {b} walks in.", turns: [] },
      { when: { of: 'clear-air' }, stage: "{a} finds {b} by the pool, away from everyone.", turns: [] },
      { when: { of: 'clear-air' }, stage: "{a} sits down next to {b} with two cups of tea.", turns: [] },
    ],
    row: [
      { when: { of: 'row' }, turns: [
        ['a', "You've been stirring things with {c} all day. Everyone's told me what you've been saying."],
        ['b', "I haven't said a word about you."],
        ['a', "Then everyone's lying. All of them?"],
        ['b', "Maybe they're stirring too. Have you thought about that?"],
        ['a', "Don't turn this round. You know what you've been doing."],
      ] },
      { when: { of: 'row' }, turns: [
        ['b', "Is there a problem?"],
        ['a', "You're the problem. Every time I sit with {c}, you appear. Every time. Like you've been waiting."],
        ['b', "Because {c} sat with me at dinner? Is that what this is?"],
        ['a', "Because you smirked at me the whole way through dinner."],
        ['b', "I wasn't smirking."],
        ['a', "You're smirking now!"],
      ] },
      { when: { of: 'row', known: true }, turns: [
        ['a', "I've been nice to you since day one. Since day one."],
        ['b', "Nice? You've been talking about me to everyone for days."],
        ['a', "Because of how you've been with {c}."],
        ['b', "{c} can make up {c.posAdj} own mind."],
        ['a', "Not with you in {c.posAdj} ear all day, {c} can't."],
      ] },
      { when: { of: 'clear-air' }, turns: [
        ['a', "Can we talk? Properly, without everyone watching? I'm sorry for how I've been about {c}. It's got nothing to do with you as a person. It's just a weird situation."],
        ['b', "It is a weird situation. We both like the same person. That's always going to be weird."],
        ['a', "I don't want to fall out over it."],
        ['b', "Me neither. It's not worth it."],
      ] },
      { when: { of: 'clear-air' }, turns: [
        ['b', "This is stupid, isn't it? Us not talking."],
        ['a', "Completely stupid."],
        ['b', "Truce?"],
        ['a', "Truce. But I'm still not giving up on {c}."],
        ['b', "I wouldn't expect you to. May the best one win."],
      ] },
    ],
    end: [
      { when: { of: 'row' }, turns: [], beat: "Two of the others have to step in. {c} walks away from both of them." },
      { when: { of: 'row' }, turns: [['b', "I'm not doing this."], ['a', "Good. Don't."]], beat: "The door bangs. The garden goes very quiet." },
      { when: { of: 'clear-air' }, turns: [], beat: "They hug, awkwardly at first, and then properly." },
      { when: { of: 'clear-air' }, turns: [['a', "Whatever {c} decides, we're fine. Yeah?"], ['b', "Yeah. We're fine."]] },
    ],
  },
});

export const RIVAL_STEP_BACK = build('rival-step-back', {
  ...STORY,
  plans: { featured: ['say', 'answer', 'land'], short: ['say', 'land'] },
  moves: {
    say: [
      { when: { of: 'friend' }, stage: "{a} sits down next to {b} on the swing seat.", turns: [
        ['a', "I'm done. With the whole {c} thing. I'm not going to compete with someone for a person. If {c} wants me, {c} knows where I am. I'm not running after anyone."],
      ] },
      { when: { of: 'friend' }, stage: "In the dressing room, {a} sits on the edge of the bench, not getting ready.", turns: [
        ['a', "I'm stepping back from {c}. I've thought about it all afternoon. {c} hasn't picked me, and I think that tells me enough."],
      ] },
      { when: { of: 'to-rival' }, stage: "{a} goes over to {b}.", turns: [
        ['a', "I'm not going to get in your way with {c} any more. I've realised it's not worth us falling out, and honestly, I don't think {c} was ever going to choose me."],
      ] },
      { when: { of: 'to-rival' }, stage: "{a} catches {b} alone in the kitchen.", turns: [
        ['a', "You can have {c}. I mean it. I'm out. I'd rather walk away now with a bit of dignity than drag it out for another week."],
      ] },
    ],
    answer: [
      { when: { of: 'friend' }, turns: [
        ['b', "Are you sure? You really like {c}."],
        ['a', "I do. But I like myself more. And I don't like who I'm being, chasing someone round the villa."],
        ['b', "Good for you. Honestly."],
      ] },
      { when: { of: 'to-rival' }, turns: [
        ['b', "Really? I didn't expect that."],
        ['a', "Neither did I, to be fair."],
        ['b', "Thank you. I mean that. It can't have been easy."],
      ] },
    ],
    land: [
      { when: { of: 'friend' }, turns: [], beat: "{b} puts an arm round {a}, and they sit there for a while." },
      { when: { of: 'to-rival' }, turns: [], beat: "{a} walks off before {b} can say anything else." },
      { turns: [], beat: "Across the garden, {c} has no idea any of this just happened." },
    ],
  },
});

export const RIVAL_WON = build('rival-won', {
  ...STORY,
  plans: { featured: ['open', 'talk', 'land'], short: ['talk', 'land'] },
  moves: {
    open: [
      { when: { of: 'gracious' }, stage: "After the recoupling, {b} goes over to {a} and {c}.", turns: [] },
      { when: { of: 'gracious' }, stage: "On the way back from the fire pit, {b} catches {a}.", turns: [] },
      { when: { of: 'bitter' }, stage: "After the recoupling, {b} walks straight past {a}.", turns: [] },
      { when: { of: 'bitter' }, stage: "In the kitchen, {b} watches {a} and {c} together.", turns: [] },
    ],
    talk: [
      { when: { of: 'gracious' }, turns: [
        ['b', "Congratulations. Honestly. {c} chose you, and that's that. I'm not going to be weird about it."],
        ['a', "Are you okay, though?"],
        ['b', "I will be. I'm upset, I'm not going to lie. But I'd have done exactly the same as {c}, if I'm honest. You two look good together."],
        ['a', "That means a lot, coming from you."],
      ] },
      { when: { of: 'gracious' }, turns: [
        ['b', "No hard feelings."],
        ['a', "Really?"],
        ['b', "Really. Look after {c}. If you don't, you'll have me to deal with."],
        ['a', "I will. I promise."],
      ] },
      { when: { of: 'bitter' }, turns: [
        ['a', "Can we talk?"],
        ['b', "There's nothing to talk about. You won."],
        ['a', "It wasn't a competition."],
        ['b', "It was to you. It was always a competition to you."],
      ] },
      { when: { of: 'bitter' }, turns: [
        ['b', "Give it a week."],
        ['a', "Sorry?"],
        ['b', "Give it a week, and {c} will be looking at someone else. That's all I'm saying."],
        ['a', "Is that what you're hoping?"],
        ['b', "It's what I'm expecting."],
      ] },
    ],
    land: [
      { when: { of: 'gracious' }, turns: [], beat: "They hug, and {c} watches it with a relieved smile." },
      { when: { of: 'bitter' }, turns: [], beat: "{b} goes to bed early, and doesn't say goodnight to anyone." },
      { when: { of: 'bitter' }, turns: [], beat: "{a} squeezes {c}'s hand and keeps looking at the fire." },
    ],
  },
});

export const CRUSH_CONFIDE = build('crush-confide', {
  ...STORY,
  plans: { featured: ['tell', 'advice', 'land'], short: ['tell', 'advice'] },
  moves: {
    tell: [
      { stage: "On the swing seat, {a} leans into {b}.", turns: [
        ['a', "Can I tell you something, and you don't laugh? I really like {c}. Like, really like {c}. I've been trying to talk myself out of it for days, and it's not working."],
        ['b', "I know. It's obvious."],
        ['a', "Is it?"],
        ['b', "So obvious. You go red every time {c} walks past."],
      ] },
      { stage: "In the dressing room, {b} catches {a} staring out of the window at {c}.", turns: [
        ['b', "You're doing it again."],
        ['a', "Doing what?"],
        ['b', "Looking at {c} like {c} is the last biscuit in the tin."],
        ['a', "Okay. Fine. I like {c}. I've liked {c} for ages."],
      ] },
      { stage: "{a} and {b} are on the sunbeds, and {a} keeps sighing.", turns: [
        ['b', "What's with all the sighing?"],
        ['a', "{c}. That's what's with all the sighing. I think I've got a thing for {c}, and I don't think {c} even knows I exist."],
      ] },
    ],
    advice: [
      { when: { of: 'go-for-it' }, turns: [
        ['b', "Then go and talk to {c}! What are you waiting for? Worst case, you know where you stand. Best case, you've got someone. You can't lose."],
        ['a', "I can lose. I can lose very badly, in front of everyone."],
        ['b', "Go. Now. Before I drag you over there myself."],
      ] },
      { when: { of: 'go-for-it' }, turns: [
        ['b', "You'll never know if you don't ask. And if {c} says no, then {c} is mad, and we move on, and I'll get you an ice cream."],
        ['a', "There's no ice cream in the villa."],
        ['b', "I'll find some. Go."],
      ] },
      { when: { of: 'careful' }, turns: [
        ['b', "Listen. I love you, and I don't want you to get hurt. I just don't know if {c} sees you like that. I haven't seen {c} look at you the way you look at {c}."],
        ['a', "That's a horrible thing to hear."],
        ['b', "I'd rather you heard it from me."],
      ] },
      { when: { of: 'careful' }, turns: [
        ['b', "Just be careful. Don't put all your eggs in one basket. Not in here. Talk to {c}, sure, but talk to other people too."],
        ['a', "I know. I know. My head knows."],
        ['b', "And the rest of you doesn't."],
      ] },
    ],
    land: [
      { turns: [], beat: "{a} looks over at {c} across the garden, and quickly looks away again." },
      { when: { of: 'go-for-it' }, turns: [], beat: "{b} pushes {a} off the sunbed. {a} goes, very slowly, in the wrong direction." },
      { when: { of: 'careful' }, turns: [], beat: "{a} goes quiet for the rest of the afternoon." },
    ],
  },
});

export const CRUSH_WATCH = build('crush-watch', {
  ...STORY,
  plans: { featured: ['watch', 'words', 'land'], short: ['watch', 'words'] },
  moves: {
    watch: [
      { stage: "{a} watches {b} and {c} kissing on the daybed, and tries to look somewhere else.", turns: [] },
      { stage: "{b} and {c} are laughing by the pool. {a} is sitting on {a.posAdj} own on the steps.", turns: [] },
      { stage: "At the fire pit, {c} puts an arm round {b}. {a} looks away.", turns: [] },
    ],
    words: [
      { when: { of: 'hurt' }, turns: [
        ['b', "Come and join us!"],
        ['a', "I'm all right here, thanks."],
        ['b', "Are you okay? You've been quiet all day."],
        ['a', "Just tired. Honestly. Carry on."],
      ] },
      { when: { of: 'hurt' }, turns: [
        ['c', "You all right over there?"],
        ['a', "Yeah. Fine. Never better."],
        ['c', "You sure?"],
        ['a', "I'm going to go to bed, I think."],
      ] },
      { when: { of: 'catty' }, turns: [
        ['a', "Cute. Very cute. You two."],
        ['c', "Thanks?"],
        ['a', "It won't last, but it's cute."],
        ['b', "What's your problem?"],
        ['a', "I don't have a problem. I've got eyes."],
      ] },
      { when: { of: 'catty' }, turns: [
        ['a', "Must be nice, being somebody's second choice."],
        ['c', "I'm not anybody's second choice."],
        ['a', "If you say so."],
        ['b', "Leave it, {a}. Seriously."],
      ] },
    ],
    land: [
      { when: { of: 'hurt' }, turns: [], beat: "{a} goes inside, and {b} watches {a.obj} go without understanding why." },
      { when: { of: 'catty' }, turns: [], beat: "{c} goes straight to tell the others. {a} doesn't care who hears." },
    ],
  },
});

export const CRUSH_MOVE = build('crush-move', {
  ...STORY,
  plans: { featured: ['lead', 'say', 'answer', 'land'], short: ['say', 'answer'] },
  moves: {
    lead: [
      { stage: "{a} finally asks {b} for a chat on the swing seat.", turns: [
        ['a', "Can I talk to you about something? It's been on my mind for a while, and if I don't say it now, I never will."],
        ['b', "That sounds serious."],
      ] },
      { stage: "{a} brings {b} a drink and sits down on the terrace.", turns: [
        ['b', "What's this for?"],
        ['a', "Courage, mostly. Mine, not yours."],
      ] },
      { stage: "By the pool, {a} takes a deep breath before speaking.", turns: [] },
    ],
    say: [
      { turns: [
        ['a', "I like you. I really like you. Not as a friend, though you're one of my best friends in here. As more than that. I've felt it for days, and I've been too scared to say anything, because I didn't want to ruin what we've got."],
      ] },
      { turns: [
        ['a', "Do you ever think about us? Like, as more than this? Because I do. All the time. More than I probably should."],
      ] },
      { turns: [
        ['a', "Would you ever go for someone like me? You don't have to answer straight away. I just needed to ask, because it's been eating me up."],
      ] },
    ],
    answer: [
      { when: { of: 'let-down' }, turns: [
        ['b', "That's really sweet. Honestly, it is. But I don't feel the same. I'm sorry. I didn't want to lie to you and let you think there was something there."],
        ['a', "No. It's fine. I needed to know."],
      ] },
      { when: { of: 'friend-zone' }, turns: [
        ['b', "You're one of my best friends in here. That's the thing. I love you. Just not like that. And I don't want to lose what we've got."],
        ['a', "You won't. I just wanted you to know."],
      ] },
      { when: { of: 'leads-on' }, turns: [
        ['b', "I'm not saying no."],
        ['a', "So you're saying yes?"],
        ['b', "I'm saying let's see what happens. Just keep being you."],
        ['a', "Okay. I can do that."],
      ] },
      { when: { of: 'maybe' }, turns: [
        ['b', "I didn't know you felt like that. I honestly had no idea."],
        ['a', "Now you do."],
        ['b', "Now I do. And I think I need to look at you a bit differently now."],
        ['a', "In a good way?"],
        ['b', "Maybe in a good way."],
      ] },
    ],
    land: [
      { when: { of: ['let-down', 'friend-zone'] }, turns: [], beat: "{a} holds it together until {b} has gone, and then lets out a long breath." },
      { when: { of: 'leads-on' }, turns: [], beat: "{b} kisses {a} on the cheek and walks off. {a} is grinning. Nobody else is." },
      { when: { of: 'maybe' }, turns: [], beat: "{b} can't stop smiling for the rest of the afternoon." },
    ],
  },
});

export const CRUSH_PLEA = build('crush-plea', {
  ...STORY,
  plans: { featured: ['ask', 'answer', 'land'], short: ['ask', 'answer'] },
  moves: {
    ask: [
      { stage: "On the daybed, {a} takes {b}'s hand.", turns: [
        ['a', "Can I ask you for something? Can you show me a bit more affection? I'm not trying to be needy. I just don't always know where I stand with you, and in here, that's scary."],
      ] },
      { stage: "{a} sits with {b} on the swing seat.", turns: [
        ['a', "Sometimes I feel like I'm the only one trying. I'm always the one who comes and finds you. I'm always the one who says goodnight first. And I just need to know you're in this too."],
      ] },
      { stage: "In the bedroom, {a} turns to {b} before the lights go out.", turns: [
        ['a', "Do you actually like me? Because you never say it, and I'm starting to wonder."],
      ] },
    ],
    answer: [
      { when: { of: 'warmer' }, turns: [
        ['b', "I didn't realise you felt like that. I'm really sorry. I'm just not very good at showing it, but that's not fair on you, is it? I'll make sure you know. Every day."],
        ['a', "Promise?"],
        ['b', "Promise. Come here."],
      ] },
      { when: { of: 'warmer' }, turns: [
        ['b', "Of course I like you. Why would you even ask that? I like you so much I don't know what to do with it. I'll say it more. I'll say it until you're sick of hearing it."],
      ] },
      { when: { of: 'colder' }, turns: [
        ['b', "I'm just not a very touchy person."],
        ['a', "You're touchy with other people."],
        ['b', "That's different."],
        ['a', "How is it different?"],
      ] },
      { when: { of: 'colder' }, turns: [
        ['b', "I'm just taking things slowly."],
        ['a', "Slowly, or backwards?"],
        ['b', "That's not fair."],
        ['a', "It's how it feels."],
      ] },
    ],
    land: [
      { when: { of: 'warmer' }, turns: [], beat: "{b} kisses {a}, properly, and {a} finally relaxes." },
      { when: { of: 'colder' }, turns: [], beat: "{b} doesn't answer. {a} stares at the ceiling for a long time." },
    ],
  },
});

export const CRUSH_OVER = build('crush-over', {
  ...STORY,
  plans: { featured: ['say', 'answer', 'land'], short: ['say', 'answer'] },
  moves: {
    say: [
      { when: { of: 'moving-on' }, stage: "{a} finds {b} by the pool.", turns: [
        ['a', "I'm going to stop waiting for you. I've thought about it, and I can't keep hoping something's going to change when it isn't. So I'm going to get to know other people."],
      ] },
      { when: { of: 'moving-on' }, stage: "In the kitchen, {a} makes {b} a tea.", turns: [
        ['b', "What's this for?"],
        ['a', "A peace offering. I'm over it. Over you, I mean. Properly this time."],
      ] },
      { when: { of: 'led-on' }, stage: "{a} walks straight up to {b} on the terrace.", turns: [
        ['a', "You knew how I felt about you, and you let me keep hoping. Every time I nearly gave up, you'd smile at me, or sit next to me, and I'd be right back where I started."],
      ] },
    ],
    answer: [
      { when: { of: 'moving-on' }, turns: [
        ['b', "I never asked you to wait."],
        ['a', "I know. That's why I'm stopping."],
        ['b', "Are we still good?"],
        ['a', "We'll be good. Give me a few days."],
      ] },
      { when: { of: 'led-on' }, turns: [
        ['b', "I never promised you anything."],
        ['a', "You didn't have to. You just kept smiling at me."],
        ['b', "I'm allowed to smile."],
        ['a', "Not like that, you're not."],
      ] },
    ],
    land: [
      { when: { of: 'moving-on' }, turns: [], beat: "{a} walks back to the daybeds looking a lot lighter." },
      { when: { of: 'led-on' }, turns: [], beat: "{a} walks off, and {b} has nothing to say." },
    ],
  },
});
