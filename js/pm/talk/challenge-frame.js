// ══════════════════════════════════════════════════════════════════════
// pm/talk/challenge-frame.js — a challenge's day around the game (pm/challenge-frame.js)
// ══════════════════════════════════════════════════════════════════════
//
//   chal-buzz   [a, b, (c)]  after the text, a to a friend. `of`:
//                              worried   coupled; c is who a's jealous of, {pa} the partner
//                              hoping    single; c is who a wants a kiss from
//                              dread     a quiz; c is a's partner, who feels less than a does
//                              fired-up  a game to win
//   chal-watch  [a, b, c]    a watches partner b kiss or pick c. `of`: fine · fuming · laughs
//   chal-prize  [a, (b)]     the winners' prize. `of`: date · treat · party
//   chal-row    [a, b, c]    that evening, a brings it up with b; c was the one in the game.
//                            `of`: just-a-game · sorry · storm; `watched`: how a took it at the time
//   chal-spark  [a, b, c]    that evening, a to friend b: the kiss with c did something
// No line says what the game was beyond a kiss or a pick: the game's own rounds say that.
import { build } from './build.js';

export const CHAL_BUZZ = build('chal-buzz', {
  tiered: false,
  plans: { featured: ['talk', 'land?'], short: ['talk'] },
  moves: {
    talk: [
      { when: { of: 'worried', taken: true }, stage: "In the dressing room, {a} is getting ready faster than anyone, and saying nothing.", turns: [['b', "You've gone quiet."], ['a', "Watch {c} go straight for {pa}. Just watch. I'm calling it now."], ['b', "And if {c} does?"], ['a', "Then I'll smile, and I'll clap, and I'll deal with it later."]] },
      { when: { of: 'worried', taken: true }, turns: [['a', "I'm dreading this one. Every time there's a game, {c} finds a way to end up next to {pa}."], ['b', "Then don't take your eyes off {pa}."], ['a', "I never do. That's the problem."]] },
      { when: { of: 'worried', taken: true }, turns: [['a', "If {pa} kisses {c} today, I want you to tell me I'm not allowed to be annoyed."], ['b', "You're allowed to be annoyed."], ['a', "That's not helping."]] },
      { when: { of: 'hoping' }, turns: [['a', "Today's my chance. I'm not wasting it on a peck on the cheek."], ['b', "Who?"], ['a', "You know who."], ['b', "{c}? With everyone watching?"], ['a', "Especially with everyone watching."]] },
      { when: { of: 'hoping' }, stage: "{a} is doing {a.posAdj} hair for the third time.", turns: [['b', "Who's that for?"], ['a', "Nobody. Everybody. {c}."], ['b', "{c} is coupled up."], ['a', "{c} is coupled up today."]] },
      { when: { of: 'dread' }, turns: [['a', "A game about how well we know each other. Brilliant. What if {c} gets every single one wrong?"], ['b', "Then you'll know where you stand."], ['a', "That's exactly what I'm scared of."]] },
      { when: { of: 'dread' }, turns: [['a', "I know everything about {c}. Everything. I'm not sure {c} could tell you what I do for a living."], ['b', "Have you told {c}?"], ['a', "Twice."]] },
      { when: { of: 'dread' }, turns: [['a', "Every question in that game is going to be about us. And I don't know what {c}'s going to say."], ['b', "Then you'll find out together."], ['a', "In front of everyone."]] },
      { when: { of: 'dread' }, stage: "{a} is sitting on the end of the bed while everybody else gets changed.", turns: [['b', "What's wrong?"], ['a', "What if I find out today that {c} doesn't feel the same?"], ['b', "Then at least you'll know."]] },
      { when: { of: 'worried', taken: true }, turns: [['a', "I know it's a game. I know. But {c} has been looking at {pa} all week, and today {c} gets to do something about it."], ['b', "And {pa} gets to say no."]] },
      { when: { of: 'hoping' }, turns: [['a', "I've been waiting for a game like this since I walked in."], ['b', "Because of {c}?"], ['a', "I'm not saying anything. I'm just saying watch."]] },
      { when: { of: 'fired-up', game: 'sports-day' }, turns: [['a', "Right. Who's on my side? Because I'm not carrying anybody today."], ['b', "You've carried nobody, ever."], ['a', "And I'm not starting now."]] },
      { when: { of: 'fired-up' }, turns: [['a', "I've lost every game in here so far. Every one. Today that changes."], ['b', "What's different about today?"], ['a', "I'm angry now."]] },
      { when: { of: 'fired-up' }, stage: "{a} is stretching on the lawn like it's a world final.", turns: [['b', "What are you doing?"], ['a', "Warming up. Some of us take this seriously."]] },
      { when: { of: 'fired-up' }, turns: [['a', "I don't care what it is. I'm winning it."], ['b', "You don't even know what the prize is."], ['a', "I'll find out when I've won it."]] },
      { when: { of: 'fired-up', game: 'sports-day' }, turns: [['a', "Have you seen the other side? I'm not losing to that lot."], ['b', "Be nice."], ['a', "I'll be nice after."]] },
    ],
    land: [
      { turns: [], beat: "Somebody shouts that they're starting, and everyone runs out to the lawn in their costumes." },
      { when: { of: ['worried', 'dread'] }, turns: [], beat: "{a} takes a breath before walking out, and doesn't let it go." },
    ],
  },
});

export const CHAL_WATCH = build('chal-watch', {
  tiered: false,
  plans: { featured: ['face', 'land?'], short: ['face'] },
  moves: {
    face: [
      { when: { of: 'fine' }, stage: "{a} is clapping along with everyone else, and {a.posAdj} smile hasn't moved for a whole minute.", turns: [['a', "No, it's fine. It's a game. Honestly. I'm fine."]] },
      { when: { of: 'fine' }, stage: "{b} and {c} are still at it. {a} looks at the sky, then the pool, then anything else.", turns: [['a', "Is it my turn yet? Can we move on?"]] },
      { when: { of: 'fine' }, stage: "{b} comes back to the line, grinning, and squeezes {a}'s hand.", turns: [['b', "You okay?"], ['a', "Yeah. Of course. Why wouldn't I be?"]] },
      { when: { of: 'fuming' }, stage: "When {b} comes back to the line, {a} steps away before {b} can put an arm round {a.obj}.", turns: [['a', "Don't. Not now."], ['b', "It's a game!"], ['a', "Then go and play it with {c}."]] },
      { when: { of: 'fuming' }, stage: "{a} doesn't clap. Everyone notices that {a} doesn't clap.", turns: [['a', "Lovely. Really. Well done, {c}."]] },
      { when: { of: 'laughs' }, turns: [['a', "Is that it? Is that all you've got?"], ['b', "Stop it!"], ['a', "I'm just saying, I've seen you do better."]] },
      { when: { of: 'laughs' }, stage: "{a} cheers louder than anyone, and pulls {b} in for a kiss the second {b} gets back.", turns: [['a', "Just reminding everyone whose you are."]] },
    ],
    land: [
      { when: { of: 'fine' }, turns: [], beat: "{a} says it's fine twice more before the next round. Nobody believes it either time." },
      { when: { of: 'fuming' }, turns: [], beat: "The next round starts, and {a} and {b} stand at opposite ends of the line." },
      { when: { of: 'laughs' }, turns: [], beat: "{c} laughs too, a bit too late." },
    ],
  },
});

export const CHAL_PRIZE = build('chal-prize', {
  tiered: false,
  plans: { featured: ['prize', 'talk'], short: ['prize'] },
  moves: {
    prize: [
      { when: { of: 'date' }, stage: "The winners' prize arrives by text: dinner for two on the terrace, tonight, away from everybody.", turns: [['a', "We actually won something!"], ['b', "I told you we would."]] },
      { when: { of: 'treat' }, stage: "The prize is a hamper and the hot tub to themselves for the afternoon.", turns: [['a', "Nobody else is allowed in. Those are the rules."], ['b', "I love these rules."]] },
      { when: { of: 'treat' }, stage: "The prize arrives: a cake, a bottle of something fizzy, and the terrace to themselves until dinner.", turns: [['a', "Is that a whole cake? For us?"], ['b', "We earned the whole cake."]] },
      { when: { of: 'date' }, stage: "The winners get a text: a picnic on the hill above the villa, just the two of them.", turns: [['b', "A picnic! We're going on an actual date!"], ['a', "Our first one. I'll take it."]] },
      { when: { of: 'party' }, stage: "The prize is a party by the pool, and {a} gets carried round it on everybody's shoulders.", turns: [['a', "This is the best day I've had in here. I mean that."]] },
    ],
    talk: [
      { when: { of: ['date', 'treat'] }, turns: [['a', "Do you know what I liked about today? You never once looked at anyone else."], ['b', "Why would I? I was busy winning."]] },
      { when: { of: ['date', 'treat'] }, turns: [['b', "Can we stay out here all night?"], ['a', "Somebody will come and get us."], ['b', "Let them try."]] },
      { when: { of: ['date', 'treat'] }, turns: [['a', "Everyone's going to be watching us from the kitchen."], ['b', "Good. Let them be jealous for once."]] },
      { when: { of: ['date', 'treat'] }, turns: [['b', "This is the first time we've been on our own all week."], ['a', "I know. I'd forgotten what you sound like when you're not shouting over the music."]] },
      { when: { of: ['date', 'treat'] }, turns: [['a', "Can I tell you something? I was really proud of you today."], ['b', "For winning?"], ['a', "For trying that hard. You actually meant it."]] },
      { when: { of: 'party' }, turns: [], beat: "For one afternoon, nobody in the villa is fighting about anything." },
    ],
  },
});

export const CHAL_ROW = build('chal-row', {
  tiered: false,
  plans: { featured: ['open', 'answer', 'push?', 'land'], short: ['open', 'answer', 'land'] },
  moves: {
    open: [
      { when: { watched: 'fine' }, stage: "The terrace, after dinner. {a} has been quiet all evening.", turns: [['a', "I said I was fine. I wasn't fine. I'm not fine."], ['b', "Is this about the challenge?"], ['a', "What do you think it's about?"]] },
      { when: { watched: 'fine' }, stage: "{a} waits until everyone else has gone in.", turns: [['a', "Can we talk about today? Because I've been smiling about it for six hours, and I'm done."]] },
      { when: { watched: 'fuming' }, stage: "{a} doesn't even wait until they're alone.", turns: [['a', "Do you want to explain what that was with {c}? Because everybody saw it."]] },
      { when: { watched: 'fuming' }, stage: "{b} sits down next to {a} at the fire pit. {a} moves along.", turns: [['b', "Are you still angry about the game?"], ['a', "I'm angry about {c}. The game was just where it happened."]] },
      { when: { watched: 'laughs' }, stage: "Later, in bed, {a} turns over to face {b}.", turns: [['a', "Can I say something? I laughed today. But the kiss with {c}… that wasn't for the game, was it?"]] },
    ],
    answer: [
      { when: { of: 'just-a-game' }, turns: [['b', "It was a challenge. Everybody kissed everybody. I can't believe we're having this conversation."], ['a', "You chose {c}. Out of everyone in that line, you chose {c}."]] },
      { when: { of: 'just-a-game' }, turns: [['b', "You're making it into something it's not. It was a game."], ['a', "It didn't look like a game from where I was standing."]] },
      { when: { of: 'sorry' }, turns: [['b', "You're right. I got carried away, and I didn't think about how it looked from where you were. I'm sorry."], ['a', "Thank you. That's all I wanted."]] },
      { when: { of: 'sorry' }, turns: [['b', "I should have gone to you. I know that. I'm sorry."], ['a', "Why didn't you?"], ['b', "Because I wasn't thinking. That's the truth."]] },
      { when: { of: 'storm' }, turns: [['b', "Can you just listen to me for one second?"], ['a', "I listened all afternoon. I watched it, too."]] },
    ],
    push: [
      { when: { of: 'just-a-game' }, turns: [['a', "If it was me and somebody you couldn't stand, would it just be a game then?"], ['b', "That's different."], ['a', "How?"]] },
      { when: { of: 'storm' }, turns: [['b', "Where are you going?"], ['a', "Somewhere I don't have to look at you for a bit."]] },
    ],
    land: [
      { when: { of: 'just-a-game', phase: 'evening' }, turns: [], beat: "They go to bed without saying goodnight." },
      { when: { of: 'sorry' }, turns: [], beat: "{a} lets {b} hold {a.posAdj} hand. It takes a minute." },
      { when: { of: 'storm' }, turns: [], beat: "{a} walks out to the garden. {b} goes after {a.obj}, and comes back alone." },
    ],
  },
});

export const CHAL_SPARK = build('chal-spark', {
  tiered: false,
  plans: { featured: ['say', 'answer', 'land?'], short: ['say', 'answer'] },
  moves: {
    say: [
      { turns: [['a', "Can I tell you something, and you don't look at me like that? The kiss with {c} today. I felt it."], ['b', "In a challenge?"], ['a', "I know. I know how it sounds."]] },
      { when: { taken: true }, turns: [['a', "I've been thinking about one kiss all day, and it wasn't with {pa}."], ['b', "{c}?"], ['a', "Don't say it out loud."]] },
      { when: { taken: false }, turns: [['a', "That kiss with {c}. Was that just me, or was there something there?"], ['b', "It wasn't just you. Everyone saw it."]] },
    ],
    answer: [
      { when: { taken: true }, turns: [['b', "So what are you going to do? Because {pa} saw it too."], ['a', "Nothing. Probably nothing. I don't know."]] },
      { turns: [['b', "Then do something about it. Properly. Not in a game."], ['a', "Maybe I will."]] },
    ],
    land: [
      { when: { started: true }, turns: [], beat: "{a} looks across the garden at {c}, and {c} is already looking back." },
      { turns: [], beat: "{a} spends the rest of the evening trying very hard not to look at {c}." },
    ],
  },
});
CHAL_SPARK.facts = (state, ev) => ({ started: !!ev.extra?.started });
CHAL_ROW.facts = (state, ev) => ({ watched: ev.extra?.watched || null });
