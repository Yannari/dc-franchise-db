// ══════════════════════════════════════════════════════════════════════
// pm/talk/arrivals.js — the first night, and every new face after it
// ══════════════════════════════════════════════════════════════════════
//
// Rewritten 2026-10-22 (the user: "redo the 11%"). First impressions are the
// whole point of these scenes ("the arrivals meeting be a little longer …
// this is where first impressions are made"), so they talk long enough for one.
//   arrival-chat    [a, b, (c)]  a has just walked in; b (and c) were already here.
//                   `of`: nerves · looking · compliment · type · same-type · clash
//   first-toast     [a, b, c]    a raises the glass.
//   bombshell-text  [a, (b)]     a reads the text out; the first line IS the text. `another`: the night's second.
//   bombshell-guess [a, (b)]     who is it? coupled a worries to partner b; single a hopes to friend b.
//   entrance        [a]          the walk in. `of: 'bombshell'` down the steps · `split` into Casa Amor.
//   bombshell-react [a, b, (c)]  `of`: stunned (a can't look away from new b; c is a's partner) ·
//                                worried (a watches partner b stare at new c) · unbothered (a shrugs at b)
import { build } from './build.js';

const C3 = { cast: 3 };

export const ARRIVAL_CHAT = build('arrival-chat', {
  tiered: false,
  plans: { featured: ['open', 'talk', 'more?', 'land'], short: ['open', 'talk'] },
  stages: [
    { stage: "The daybeds, the first evening, everybody still in their arrival outfits.", turns: [] },
    { stage: "{a} sits down next to {b} on the terrace, drink in hand, and lets out a breath.", turns: [] },
  ],
  moves: {
    open: [
      { when: { of: 'nerves' }, stage: "{a} sits down next to {b} and lets out a very long breath.", turns: [
        ['b', "Are you as nervous as I am?"],
        ['a', "More. Honestly, more. My hands haven't stopped shaking since the car. Look at them."],
        ['b', "Mine too. Look. We're a pair."],
      ] },
      { when: { of: 'nerves' }, turns: [
        ['a', "I nearly didn't get out of the car. I sat there for a second and thought, I could just ask them to drive me home."],
        ['b', "Honestly, same. The steps felt like a mile."],
      ] },
      { when: { of: 'looking' }, turns: [
        ['b', "So come on, then. What are you actually here for? And don't say 'to have fun', everyone says that."],
        ['a', "I was literally about to say that."],
      ] },
      { when: { of: 'compliment' }, stage: "{a} has barely sat down when {b} leans over.", turns: [
        ['b', "Can I just say, you walked down those steps like you'd done it a hundred times. I nearly fell down them."],
        ['a', "Stop. I was terrified. I was holding the rail the whole way down like it owed me money."],
      ] },
      { when: { of: 'type' }, turns: [
        ['b', "Right, first question, the important one. What's your type?"],
        ['a', "Straight in. I like it."],
      ] },
      { when: { of: 'same-type' }, turns: [
        ['b', "Who's caught your eye, then? You've been looking round since you walked in."],
        ['a', "Have I? Is it that obvious? Fine. You go first."],
      ] },
      { when: { of: 'clash' }, turns: [
        ['b', "So, what's your deal? You came in looking very sure of yourself."],
        ['a', "My deal? I'm just being me. Is that a problem already? It's been ten minutes."],
      ] },
      { when: { of: 'nerves', ...C3 }, turns: [
        ['a', "Please tell me you two are nervous as well. Please. I need to hear it."],
        ['b', "Terrified."],
        ['c', "I've been to the bathroom three times already. I don't even need to go."],
      ] },
    ],
    talk: [
      { when: { of: 'nerves' }, turns: [
        ['a', "Is it bad that I've forgotten everything I planned to say? I had lines. I practised in the mirror."],
        ['b', "I planned a whole speech. It's completely gone."],
        ['a', "Good. Then we can just talk like normal people."],
        ['b', "Normal people in a villa, with microphones on."],
      ] },
      { when: { of: 'nerves' }, turns: [
        ['b', "First one's always the hardest."],
        ['a', "First what?"],
        ['b', "I don't know. First anything. First night. First hello. First drink."],
        ['a', "Then we'd better have the first drink and get it over with."],
      ] },
      { when: { of: 'looking', intent: 'love' }, turns: [
        ['a', "Honestly? I want to meet someone I'd still like in a year. That's it. I'm done with things that fizzle out after a month."],
        ['b', "That's a good answer. That's a really good answer."],
        ['a', "What's yours?"],
        ['b', "Same, mostly. With a bit of fun along the way."],
      ] },
      { when: { of: 'looking', intent: ['fun', 'fame', 'stir', 'money', 'win'] }, turns: [
        ['a', "I'm here for a good time. If love turns up, it's very welcome to join in. I'm not going to chase it round the garden."],
        ['b', "I respect that. I respect the honesty."],
      ] },
      { when: { of: 'looking' }, turns: [
        ['a', "Someone who makes me laugh. Honestly, that's the main thing. I can put up with almost anything if someone makes me laugh."],
        ['b', "Almost anything?"],
        ['a', "Almost. Not bad chat. Never bad chat."],
      ] },
      { when: { of: 'compliment' }, turns: [
        ['a', "And you look incredible, by the way. I meant to say it when I walked in, and I panicked and said 'hiya' instead."],
        ['b', "'Hiya' was lovely. 'Hiya' was a great start."],
      ] },
      { when: { of: 'type' }, turns: [
        ['a', "Honestly, I always say tall and funny, and then I end up with someone who's neither. So I've stopped having a type. I'm open."],
        ['b', "Open. Everyone in here's open on night one."],
        ['a', "Ask me again in a week."],
      ] },
      { when: { of: 'type' }, turns: [
        ['a', "Confident, but not arrogant. There's a line, and most people fall straight over it."],
        ['b', "Am I over the line?"],
        ['a', "Not yet. I'll let you know."],
      ] },
      { when: { of: 'same-type' }, turns: [
        ['b', "I think we might like the same kind of person, you and me."],
        ['a', "Oh no. Have we just become rivals? Ten minutes in?"],
        ['b', "No. Friends who are going to have a very awkward chat at some point."],
      ] },
      { when: { of: 'same-type', ...C3 }, turns: [
        ['c', "Wait, you both just said the same thing. Word for word."],
        ['a', "Did we?"],
        ['b', "We did. That's going to be a problem by Thursday."],
      ] },
      { when: { of: 'clash' }, turns: [
        ['b', "No problem. I'm just saying, you might want to read the room a bit."],
        ['a', "I've read it. It's lovely. Big room."],
        ['b', "Okay."],
        ['a', "Okay."],
      ] },
      { when: { of: 'clash' }, turns: [
        ['b', "No offence, but you've been looking round like you're marking everyone out of ten."],
        ['a', "And you've been looking at me like I've already lost points."],
        ['b', "That's just my face."],
        ['a', "Right. Well, it's a very judgemental face."],
      ] },
    ],
    more: [
      { turns: [
        ['b', "Where are you from, anyway? I can't place the accent."],
        ['a', "Everyone says that. I'm not telling you. You've got to earn it."],
      ] },
      { turns: [
        ['a', "Can I ask you something? Do you get the feeling everyone's watching everyone? Like, right now?"],
        ['b', "Because they are. That's the whole thing."],
      ] },
      { turns: [
        ['b', "I think you're going to be trouble."],
        ['a', "Good trouble or bad trouble?"],
        ['b', "Too early to tell."],
      ] },
    ],
    land: [
      { turns: [], beat: "They clink glasses, and something about the night gets easier." },
      { turns: [], beat: "They both laugh, and it helps." },
      { when: { of: 'clash' }, turns: [], beat: "Somebody else comes over and very deliberately changes the subject." },
    ],
  },
});

export const FIRST_TOAST = build('first-toast', {
  tiered: false,
  plans: { featured: ['raise', 'answer', 'land'], short: ['raise', 'land'] },
  moves: {
    raise: [
      { turns: [
        ['a', "Right, everyone. Glasses up. Come on, all of you, up. I'm going to do a speech."],
        ['b', "Oh no."],
        ['a', "A short speech. To the summer of our lives, and to not falling out by Wednesday."],
      ] },
      { turns: [
        ['a', "Can I just say something? I'm so glad it's you lot. I know we've known each other about an hour. I've just got a really good feeling."],
        ['b', "We haven't done anything yet."],
        ['a', "That's what I mean. We haven't messed anything up yet."],
      ] },
      { turns: [
        ['c', "Toast! Somebody do a toast."],
        ['a', "Fine, me. To whoever walks in next, and to us, whatever happens. Whatever happens."],
      ] },
      { turns: [
        ['a', "Before anything happens, let's all promise we won't fall out over anyone. Hand on heart."],
        ['b', "Promise."],
        ['c', "Mostly promise."],
      ] },
    ],
    answer: [
      { turns: [['b', "To being brave."], ['c', "And to looking this good while we do it."]] },
      { turns: [['b', "To us. Whatever happens."], ['c', "Whatever happens. Mostly the good bits, please."]] },
      { turns: [['c', "One toast, and then I'm going to have a little cry."], ['b', "Already?"], ['c', "It's a happy cry. Leave me alone."]] },
    ],
    land: [
      { turns: [], beat: "Everyone clinks glasses a bit too hard, and somebody spills theirs." },
      { turns: [], beat: "Everybody drinks to it. Nobody quite believes it, and nobody minds." },
    ],
  },
});

export const BOMBSHELL_TEXT = build('bombshell-text', {
  tiered: false,
  leads: ['another'],
  plans: { featured: ['text', 'react', 'land?'], short: ['text', 'land?'] },
  moves: {
    text: [
      { stage: "{a}'s phone buzzes, and the whole villa goes silent.", turns: [['a', "I got a text! Everybody shush. 'Islanders, get ready. Someone new is on their way to the villa tonight. #HeadsWillTurn.'"]] },
      { stage: "{a} shouts it across the garden.", turns: [['a', "Text! 'Islanders, prepare yourselves. A new arrival is about to walk in, and they already know who they want to get to know. #EyesOnTheSteps.'"]] },
      { stage: "Everybody crowds round {a} and the phone.", turns: [['a', "Okay, okay. 'Islanders, it's time to welcome a new face. Somebody's couple is about to be tested. #WatchThisSpace.'"]] },
      { stage: "The phone buzzes on the kitchen counter, and {a} gets to it first.", turns: [['a', "'Islanders, the villa is about to get one more resident. #NoOneIsSafe.' No one is safe. Brilliant. Love that."]] },
      { when: { another: true }, stage: "{a}'s phone goes off again, and nobody can believe it.", turns: [['a', "It's another one. 'Islanders, one new arrival wasn't enough. Someone else is about to walk in. #HereWeGoAgain.'"]] },
      { when: { another: true }, turns: [['a', "You're not going to believe this. 'Islanders, the villa isn't done yet. Another new islander is on the way. #DoubleTrouble.'"]] },
    ],
    react: [
      { when: { cast: 2 }, turns: [['b', "No. No, no, no. Tonight? As in right now? I haven't even done my hair."]] },
      { when: { cast: 2 }, turns: [['b', "Why does it always say that? Why can't it just once say, everyone's safe, have a nice night?"]] },
      { when: { cast: 2, another: true }, turns: [['b', "Two in one night? Somebody's head is definitely getting turned. Not mine. Somebody's."]] },
      { when: { cast: 2 }, turns: [['b', "Right. Everyone act normal. Everyone stand near their partner. Casually."]] },
    ],
    land: [
      { turns: [], beat: "The whole villa runs to the lawn at once." },
      { turns: [], beat: "Two couples look at each other. Neither says anything." },
      { turns: [], beat: "Somebody screams. Somebody else drops a glass." },
    ],
  },
});

export const BOMBSHELL_GUESS = build('bombshell-guess', {
  leads: ['another'],
  plans: { featured: ['worry', 'answer', 'land?'], short: ['worry', 'answer'] },
  moves: {
    worry: [
      { when: { coupled: true, cast: 2 }, stage: "On the lawn, everyone waiting. {a} has {b}'s hand in a very firm grip.", turns: [
        ['a', "Whoever it is, I'm not worried. I'm genuinely, completely not worried."],
        ['b', "You're holding my hand really tight."],
      ] },
      { when: { coupled: true, cast: 2 }, turns: [
        ['a', "Promise me you won't get your head turned. Promise me right now, before they walk in."],
        ['b', "I promise. We don't even know who it is yet."],
      ] },
      { when: { coupled: true, cast: 2 }, turns: [
        ['b', "Are you nervous?"],
        ['a', "Me? No. Why? Are you? Why are you asking? Do you know something?"],
      ] },
      { when: { coupled: false, cast: 2 }, stage: "{a} has fixed {a.posAdj} hair three times in the last minute.", turns: [
        ['a', "This could be it. This could actually be my person. I've been waiting for this since I walked in."],
        ['b', "Or it could be somebody you can't stand."],
      ] },
      { when: { coupled: false, cast: 2 }, turns: [
        ['b', "Who do you think it is?"],
        ['a', "I don't know. I don't care. I just need it to be somebody for me. Is that so much to ask?"],
      ] },
      { when: { another: true, coupled: true, cast: 2 }, turns: [
        ['a', "I'd only just calmed down from the first one. My heart can't take this."],
        ['b', "Stay next to me."],
      ] },
      { when: { another: true, coupled: false, cast: 2 }, turns: [
        ['a', "The first one wasn't for me. Maybe this one is. Maybe it's my turn."],
        ['b', "You don't know that."],
      ] },
    ],
    answer: [
      { when: { coupled: true, cast: 2 }, turns: [
        ['a', "That's what worries me. We don't know who it is. It could be anyone. It could be exactly your type."],
        ['b', "You're my type."],
        ['a', "Good answer. Keep saying that. Say it again when they walk in."],
      ] },
      { when: { coupled: true, cast: 2 }, turns: [
        ['a', "Okay. Okay, so I'm a bit nervous. A tiny bit. Don't let go."],
        ['b', "I'm not going anywhere."],
      ] },
      { when: { coupled: false, cast: 2 }, turns: [
        ['a', "Let me have this. Let me have one minute of hope before it all goes wrong."],
        ['b', "Fine. One minute."],
      ] },
      { when: { coupled: false, cast: 2, gender: 'f' }, turns: [
        ['b', "You've got your hopes up."],
        ['a', "I have not."],
        ['b', "You've put lipstick on in the last thirty seconds."],
        ['a', "That's just good preparation."],
      ] },
      { when: { coupled: false, cast: 2, gender: 'm' }, turns: [
        ['b', "You've got your hopes up."],
        ['a', "I have not."],
        ['b', "You've fixed your hair in the pool reflection three times."],
        ['a', "That's just good preparation."],
      ] },
    ],
    land: [
      { turns: [], beat: "{a} moves a little closer to {b}, and doesn't say why." },
      { turns: [], beat: "Every head turns to the top of the steps." },
    ],
  },
});

export const ENTRANCE = build('entrance', {
  tiered: false,
  plans: { featured: ['walk', 'hello', 'land'], short: ['walk', 'hello'] },
  moves: {
    walk: [
      { when: { of: 'bombshell' }, stage: "Everybody is lined up on the lawn, staring at the top of the steps. Nobody is breathing. Then {a} appears.", turns: [] },
      { when: { of: 'bombshell' }, stage: "A shadow at the top of the steps. Then {a} walks down, slowly, taking every face in.", turns: [] },
      { when: { of: 'bombshell' }, stage: "The music stops. {a} walks in like the villa already belongs to {a.obj}.", turns: [] },
      { when: { of: 'bombshell' }, stage: "For a moment there's only the sound of a suitcase on the steps. Then {a}.", turns: [] },
      { when: { of: 'bombshell' }, stage: "{a} comes down the steps holding the rail, a little nervous, and every couple holds hands a little tighter.", turns: [] },
      { when: { split: true }, stage: "The door opens, and {a} walks in with a suitcase and a very big smile.", turns: [] },
      { when: { split: true }, stage: "A new face walks out onto the terrace, and the whole room goes quiet: {a}.", turns: [] },
      { when: { split: false, of: null }, stage: "{a} walks into the garden, and every conversation stops halfway through a word.", turns: [] },
    ],
    hello: [
      { when: { of: 'bombshell' }, turns: [['a', "Hi, everyone! I'm {a}. Don't all look so worried. I don't bite. Well. Depends who's asking."]] },
      { when: { of: 'bombshell' }, turns: [['a', "Hello! I've been watching, so I already know who I want to talk to. I'm not going to say. Yet."]] },
      { when: { of: 'bombshell' }, turns: [['a', "Evening, everyone. I'm {a}. Right. Who's going to give me the tour? Not all at once."]] },
      { when: { of: 'bombshell', persona: 'wallflower' }, turns: [['a', "Hi. I'm {a}. That's it. That's my speech. I had a longer one, and it's gone."]] },
      { when: { of: 'bombshell', persona: 'fuckboy' }, turns: [['a', "Don't worry, everyone. I'm only here to steal one or two of you. Maybe three."]] },
      { when: { split: true }, turns: [['a', "Hi! I'm {a}. So which of you are the ones with partners back at the other villa? Hands up. Don't be shy."]] },
      { when: { split: true }, turns: [['a', "Right. I'm {a}, I'm single, and I'm told you all have somebody waiting for you. That's fine. I like a challenge."]] },
      { when: { split: false, of: null }, turns: [['a', "Hello! I'm {a}. Sorry, did I interrupt something? I feel like I've interrupted something."]] },
    ],
    land: [
      { when: { of: 'bombshell' }, turns: [], beat: "Nobody says anything for a second. Then everybody says hello at once." },
      { when: { of: 'bombshell' }, turns: [], beat: "Three hands go up for the tour. One of them is pulled back down by its partner." },
      { when: { of: 'bombshell' }, turns: [], beat: "Two couples shuffle a little closer together." },
      { when: { split: true }, turns: [], beat: "Every hand goes up, slowly, and somebody laughs too loudly." },
      { when: { split: false }, turns: [], beat: "Everyone gets up to say hello, some faster than others." },
    ],
  },
});

export const BOMBSHELL_REACT = build('bombshell-react', {
  plans: { featured: ['look', 'answer?', 'land'], short: ['look', 'land'] },
  moves: {
    look: [
      { when: { of: 'stunned', cast: 2 }, turns: [['a', "Oh my God. Okay. Okay, I need a minute. That is exactly my type, walking down the stairs. That's my type on legs."]] },
      { when: { of: 'stunned', cast: 2 }, turns: [['a', "I've just forgotten my own name. What's my name? Somebody tell me my name before I go over there."]] },
      { when: { of: 'stunned', cast: 2 }, turns: [['a', "Well. Tonight just got a lot more interesting. A lot."]] },
      { when: { of: 'stunned', ...C3 }, turns: [['a', "Wow."], ['c', "Wow what?"], ['a', "Nothing. It's just a nice evening. Lovely evening. The sky's nice."]] },
      { when: { of: 'stunned', ...C3 }, turns: [['c', "You can close your mouth now."], ['a', "I wasn't. I'm not. I was just saying hello with my face."]] },
      { when: { of: 'stunned', ...C3 }, stage: "{a}'s eyes follow {b} across the entire lawn.", turns: [['c', "Hello? I'm right here. I'm standing right here."], ['a', "I know. Sorry. I know you are."]] },
      { when: { of: 'stunned', ...C3 }, turns: [['a', "{b} seems nice."], ['c', "{b} has said one word."], ['a', "It was a nice word."]] },
      { when: { of: 'worried', ...C3 }, turns: [['a', "Why is {b} staring at {c} like that? Has {b} blinked? I don't think {b} has blinked."]] },
      { when: { of: 'worried', ...C3 }, turns: [['a', "{b} hasn't looked at me once since {c} walked in. Not once. I've been counting."]] },
      { when: { of: 'worried' }, turns: [['a', "I saw that. I saw that look. Everybody saw that look."]] },
      { when: { of: 'unbothered' }, turns: [['a', "Everyone's losing it. Calm down. It's one person. {b} seems lovely. I'm going back to my drink."]] },
      { when: { of: 'unbothered' }, turns: [['a', "Not my type. Honestly, not my type at all. Good luck to everyone else."]] },
    ],
    answer: [
      { when: { of: 'worried' }, turns: [['a', "I'm not going to say anything. I'm not going to be that person on the first night. I'm just going to stand here. Watching."]] },
      { when: { of: 'stunned', ...C3 }, turns: [['c', "Go on, then. Go and say hello. I'll wait here."], ['a', "I'm not going anywhere."]] },
      { when: { of: 'unbothered' }, turns: [['a', "You lot are going to be up all night about this. I'm going to sleep like a baby."]] },
    ],
    land: [
      { when: { of: 'stunned' }, turns: [], beat: "{a} fixes {a.posAdj} hair without even realising." },
      { when: { of: 'stunned', ...C3 }, turns: [], beat: "{c} isn't buying a single word of it." },
      { when: { of: 'worried' }, turns: [], beat: "{a} crosses {a.posAdj} arms, and doesn't uncross them all night." },
      { when: { of: 'worried' }, turns: [], beat: "{a} goes to get a drink, and takes a very long time about it." },
      { when: { of: 'unbothered' }, turns: [], beat: "{a} is the only person on the lawn still sitting down." },
    ],
  },
});
