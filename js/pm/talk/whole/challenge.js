// pm/talk/whole/challenge.js — a challenge's day around the game
// (pm/challenge-frame.js). One talk each, start to finish (pm/script.js
// talkScript `whole`), in their own voices (whole/voice.js). The stitched
// scenes were built on a comeback ("{c} is coupled up today." "I'm angry now."):
// here they say what they're hoping for or scared of, and why.
//   chal-buzz   [a, b, (c)]  before. of: worried ({c} might go for {pa}) · hoping
//               ({a} wants a kiss from {c}) · dread (a quiz; {c} is {a}'s partner,
//               who feels less) · fired-up (a game to win)
//   chal-watch  [a, b, c]    {a} watches partner {b} kiss or pick {c}. of: fine · fuming · laughs
//   chal-prize  [a, (b)]     of: date · treat · party
//   chal-row    [a, b, c]    that evening, {a} brings it up with {b}; {c} was the one in
//               the game. watched: how {a} took it then · of: just-a-game · sorry · storm
//   chal-spark  [a, b, c]    that evening, {a} to friend {b}: the kiss with {c} did something
// No line says what the game was beyond a kiss or a pick: the game's own rounds say that.
import { say } from './voice.js';

export const CHAL_BUZZ_WHOLE = { moves: { whole: [
  // ── {a} is scared {c} goes for {pa} ──
  { when: { of: 'worried', taken: true }, stage: "In the dressing room, {a} is getting ready faster than anyone, and saying nothing.", turns: [
    ['b', "You've gone quiet. What's wrong?"],
    say('a', "It's a kissing game. And {c} has been all over {pa} all week.", { nervy: "I can't stop thinking about it. What if {c} picks {pa}? In front of everyone?" }),
    ['b', "It's a game. It doesn't mean anything."],
    ['a', "It does if {pa} enjoys it."],
    ['b', "Then you'll talk about it after. Don't let {c} see you worried."],
  ], beat: "{a} nods, puts on a smile, and walks out to the lawn." },
  { when: { of: 'worried', taken: true }, stage: "{a} and {b} are on the daybeds while everybody gets ready.", turns: [
    say('a', "I know it's only a game. But {c} keeps looking at {pa}, and today {c} gets an excuse.", { lad: "I'm telling you, {~bro}, {c} is going to go straight for {pa}. I can feel it." }),
    ['b', "And {pa} can say no."],
    ['a', "Can {pa}, though? It's a game. Nobody says no in a game."],
    say('b', "Just trust {pa}. {pa} picked you.", { sharp: "If {pa} kisses {c} like it means something, then you've learned something." }),
  ], beat: "Somebody shouts that they're starting, and {a} gets up first." },
  { when: { of: 'worried', taken: true }, stage: "{a} is sitting on the end of the bed while everybody else gets changed.", turns: [
    ['b', "Are you okay?"],
    ['a', "If {pa} kisses {c} today, I want you to tell me I'm allowed to be upset."],
    ['b', "You're allowed to be upset. You're allowed to feel however you feel."],
    ['a', "Thank you. I just needed someone to say it."],
  ], beat: "{b} gives {a} a hug, and they go out together." },
  { when: { of: 'worried', taken: false }, stage: "{a} and {b} are on the daybeds while everybody gets ready.", turns: [
    ['a', "I know who {c} is going to go for today. The one person I actually like."],
    ['b', "You don't know that."],
    say('a', "I do. I've watched {c} all week. And I can't even say anything, because we're not a couple.", { nervy: "What if it happens and I have to stand there and clap?" }),
    ['b', "Then tell them how you feel before somebody else does."],
  ], beat: "{a} nods, and doesn't take {a.posAdj} eyes off {c} all the way out to the lawn." },
  // ── {a} wants a kiss from {c} ──
  { when: { of: 'hoping' }, stage: "{a} is doing {a.posAdj} hair for the third time.", turns: [
    ['b', "Who's that for?"],
    say('a', "{c}. If there's a kiss in this game, I want it to be {c}.", { lad: "{c}, {~bro}. If there's a kiss going, I'm going for {c}.", bestie: "Babe, if there's a kiss, I'm going straight to {c}. I've decided." }),
    ['b', "With everyone watching?"],
    ['a', "I've been too nervous to do anything about it. A game makes it easier."],
    ['b', "Then go for it. You'll only regret not doing it."],
  ], beat: "{a} takes one last look in the mirror and heads out." },
  { when: { of: 'hoping' }, stage: "{a} and {b} are walking out to the lawn.", turns: [
    ['a', "Can I tell you something? I've been waiting for a game like this."],
    ['b', "Because of {c}?"],
    ['a', "Because of {c}. I've liked {c} for days, and I've never had the nerve to do anything."],
    say('b', "Then today's the day.", { soft: "I hope it goes how you want it to." }),
  ], beat: "{a} looks over at {c}, and quickly looks away again." },
  { when: { of: 'worried', taken: true }, stage: "{a} and {b} are brushing their teeth side by side.", turns: [
    ['b', "You've been really quiet."],
    say('a', "I keep picturing {pa} kissing {c} in front of everyone. And me having to smile.", { soft: "I'm scared, that's all. I really like {pa}, and {c} really likes {pa} too." }),
    ['b', "You don't know it'll happen."],
    ['a', "No. But I know {c} wants it to."],
  ], beat: "{a} rinses {a.posAdj} mouth, and goes out to find {pa} before the game starts." },
  { when: { of: 'worried', taken: true }, stage: "{a} grabs {b} on the way out to the lawn.", turns: [
    ['a', "Stand next to me today. Please."],
    ['b', "Why? What's wrong?"],
    ['a', "If {pa} goes for {c}, I don't want to be standing on my own."],
    ['b', "I'll be right there. Whatever happens."],
  ], beat: "They walk out arm in arm, and {a} doesn't let go until the game starts." },
  { when: { of: 'worried', taken: true }, stage: "{a} and {b} are sitting on the steps, waiting for the others.", turns: [
    say('a', "I trust {pa}. I do. It's {c} I don't trust.", { lad: "I trust {pa}, {~bro}. It's {c} I'm worried about." }),
    ['b', "What's {c} done?"],
    ['a', "Nothing yet. But you can see it. {c} is always just there, next to {pa}."],
    ['b', "Then let {pa} show you. You'll know by the end of the game."],
  ], beat: "{a} nods, and doesn't say anything else." },
  { when: { of: 'hoping' }, stage: "{a} and {b} are in the kitchen, waiting for the game to start.", turns: [
    say('a', "Can I tell you a secret? I really like {c}. And I think today I'm going to do something about it.", { romantic: "I think I'm falling for {c}. And today I'm going to show it." }),
    ['b', "In the game?"],
    ['a', "In the game. It's the only time I'll have the nerve."],
    ['b', "Then I'll be cheering for you."],
  ], beat: "{a} grins, and goes out to the lawn first." },
  { when: { of: 'hoping' }, stage: "{a} is changing outfits for the second time.", turns: [
    ['b', "You look great. What's the occasion?"],
    ['a', "There might be a kiss in this game. I want to look nice if it's {c}."],
    ['b', "Does {c} know you like {c.obj}?"],
    ['a', "Not yet. Maybe after today."],
  ], beat: "{b} helps {a} with the zip, and they go out together." },
  { when: { of: 'hoping' }, stage: "{a} and {b} are walking out to the lawn.", turns: [
    ['b', "Who are you hoping for?"],
    say('a', "Honestly? {c}. I've been too shy to say anything for days.", { lad: "{c}, {~bro}. I've been waiting all week for a chance." }),
    ['b', "Then make the most of it."],
  ], beat: "{a} looks across the lawn at {c}, and takes a deep breath." },
  // ── a quiz, and {a} is scared of the answers ──
  { when: { of: 'dread' }, stage: "{a} is sitting on the end of the bed while everybody else gets changed.", turns: [
    ['b', "What's wrong?"],
    ['a', "It's a game about how well we know each other. What if {c} gets every single one wrong?"],
    ['b', "Then you'll know where you stand."],
    say('a', "That's what I'm scared of. I know everything about {c}. I don't know if {c} knows anything about me.", { nervy: "I don't want to find out like that. In front of everyone." }),
    ['b', "{c} likes you. I've seen it."],
    ['a', "Not as much as I like {c}. I know that already."],
  ], beat: "{b} squeezes {a}'s hand, and they go out to the lawn." },
  { when: { of: 'dread' }, stage: "{a} and {b} are on the daybeds while everybody gets ready.", turns: [
    ['a', "Every question today is going to be about me and {c}. And I don't know what {c} is going to say."],
    ['b', "Are you worried {c} doesn't know you?"],
    ['a', "I'm worried {c} hasn't tried to."],
    say('b', "Then this will tell you. Better now than later.", { soft: "Whatever happens, you'll be okay. I promise." }),
  ], beat: "{a} takes a deep breath before walking out." },
  { when: { of: 'dread' }, stage: "{a} and {b} are walking out to the lawn.", turns: [
    ['a', "If {c} doesn't know my favourite food, I'm going to cry. In front of everyone."],
    ['b', "{c} knows. You talk about it all the time."],
    ['a', "I talk about it. I don't know if {c} listens."],
  ], beat: "{a} takes a deep breath, and goes to stand next to {c}." },
  { when: { of: 'dread' }, stage: "{a} and {b} are doing each other's make-up before the game.", turns: [
    ['b', "Why are you so nervous? It's just questions."],
    ['a', "Questions about me and {c}. What if {c} gets them wrong and everyone sees it?"],
    ['b', "Then you talk about it after. It's only a game."],
    ['a', "It doesn't feel like only a game."],
  ], beat: "{b} finishes {a}'s make-up, and gives {a.obj} a hug." },
  { when: { of: 'dread' }, stage: "{a} is pacing the bedroom while {b} gets dressed.", turns: [
    say('a', "I've told {c} so much about me. If none of it went in, I don't know what I'll do.", { nervy: "What if {c} doesn't know anything about me? What if I've been talking to myself all week?" }),
    ['b', "Stop. {c} likes you. Everyone can see it."],
    ['a', "I hope you're right."],
  ], beat: "{a} sits down on the bed, takes a breath, and gets ready." },
  // ── a game to win ──
  { when: { of: 'fired-up' }, stage: "{a} is stretching on the lawn while everyone else is still getting dressed.", turns: [
    ['b', "You're taking this very seriously."],
    say('a', "I've lost every game in here so far. I want to win one. Just one.", { lad: "I'm winning this one, {~bro}. I'm done losing." }),
    ['b', "What happens if you lose this one too?"],
    ['a', "Then I'll be annoyed for an hour. But I'm not going to lose."],
  ], beat: "Somebody shouts that they're starting, and {a} is first on the lawn." },
  { when: { of: 'fired-up' }, stage: "{a} and {b} are getting changed for the challenge.", turns: [
    ['a', "I love this. I've been bored all week, and finally there's something to win."],
    ['b', "You're very competitive."],
    say('a', "I've always been like this. Board games at home end in tears.", { sharp: "I'm not here to come second. In anything." }),
  ], beat: "{a} runs out to the lawn before {b} has finished tying {b.posAdj} shoes." },
  { when: { of: 'fired-up' }, stage: "{a} and {b} are first out on the lawn.", turns: [
    say('a', "I need this one. I want something to go right for me in here.", { sharp: "I don't care what it is. I'm winning it." }),
    ['b', "Then let's win it."],
  ], beat: "{a} high-fives {b}, and they wait for the others." },
] } };

export const CHAL_WATCH_WHOLE = { moves: { whole: [
  { when: { of: 'fine' }, stage: "{a} is clapping along with everyone else, and {a.posAdj} smile hasn't moved for a whole minute.", turns: [
    ['b', "Are you okay?"],
    say('a', "Yeah. It's a game. I'm fine.", { nervy: "I'm fine. Honestly. It's just a game. I'm fine." }),
  ], beat: "{a} keeps clapping. {a.PosAdj} smile still hasn't moved." },
  { when: { of: 'fine' }, stage: "{b} comes back to the line, grinning, and squeezes {a}'s hand.", turns: [
    ['b', "That was only the game. You know that."],
    ['a', "I know. It's fine."],
  ], beat: "{a} squeezes back, but doesn't look at {c}." },
  { when: { of: 'fine' }, stage: "{b} and {c} are still kissing. {a} looks at the sky, then the pool, then anything else.", turns: [
    ['a', "Is it my turn yet? I'd like to move on, please."],
  ], beat: "Somebody laughs. {a} doesn't." },
  { when: { of: 'fine' }, stage: "{a} watches {b} kiss {c}, and then looks down at {a.posAdj} feet.", turns: [
    ['b', "You okay?"],
    say('a', "Yeah. Just a game.", { soft: "I'm okay. It's just weird watching it." }),
  ], beat: "{a} smiles when {b} looks over, and stops when {b} looks away." },
  { when: { of: 'fine' }, stage: "{a} gives {b} a little wave as {b} comes back from {c}.", turns: [
    ['a', "Well done. Very good."],
    ['b', "You don't mind?"],
    ['a', "It's a game. I don't mind."],
  ], beat: "{a} keeps smiling, but it doesn't reach {a.posAdj} eyes." },
  { when: { of: 'fuming' }, stage: "{a} is staring straight at {c}, and not at {b}.", turns: [
    ['b', "Are you angry with me?"],
    ['a', "I'll talk to you later. Not here."],
  ], beat: "{b} goes back to {b.posAdj} place, and the next round starts." },
  { when: { of: 'laughs' }, stage: "{a} is laughing so hard {a.he} has to sit down.", turns: [
    ['b', "It wasn't that funny."],
    ['a', "Your face. You looked terrified."],
    ['b', "I was terrified. You were watching."],
  ], beat: "{b} sits down next to {a}, and they laugh together." },
  { when: { of: 'laughs' }, stage: "{a} gives {b} a round of applause as {b} comes back.", turns: [
    say('a', "I'm not jealous. I know where you're sleeping tonight.", { bestie: "Not jealous, babe. I know who you're coming home to." }),
  ], beat: "{b} laughs, and kisses {a} on the cheek on the way past." },
  { when: { of: 'fine' }, stage: "{a} smiles and nods when {b} looks over after the kiss with {c}.", turns: [
    ['a', "It's fine. Go on, it's your turn again."],
  ], beat: "{a} keeps nodding long after {b} has looked away." },
  { when: { of: 'laughs' }, stage: "{a} claps as {b} comes back to the line.", turns: [
    ['a', "Was that the best you could do?"],
    ['b', "I was saving the good ones for you."],
  ], beat: "{a} laughs, and pulls {b} in close." },
  { when: { of: 'fuming' }, stage: "When {b} comes back to the line, {a} steps away before {b} can put an arm round {a.obj}.", turns: [
    ['a', "Don't. Not now."],
    ['b', "It was a game. That's all."],
    say('a', "Then why did you pick {c}? Out of everyone?", { sharp: "You had a choice, and you chose {c}." }),
  ], beat: "The next round starts, and they stand at opposite ends of the line." },
  { when: { of: 'fuming' }, stage: "{a} doesn't clap. Everyone notices that {a} doesn't clap.", turns: [
    ['b', "Come on. It didn't mean anything."],
    ['a', "It didn't look like nothing from here."],
  ], beat: "{b} goes to say something else, and then doesn't." },
  { when: { of: 'laughs' }, stage: "{a} cheers louder than anyone, and pulls {b} in for a kiss the second {b} gets back.", turns: [
    ['a', "I'm not worried. I know who you're going home with."],
    ['b', "Good. Because it's you."],
  ], beat: "{c} laughs along, and {a} keeps hold of {b}'s hand." },
  { when: { of: 'laughs' }, stage: "{a} is laughing as {b} comes back to the line.", turns: [
    ['a', "That was awful. I've seen you kiss better than that."],
    ['b', "I wasn't trying. You know that."],
    ['a', "I know. That's why I'm laughing."],
  ], beat: "{b} puts an arm round {a}, and they watch the next round together." },
  { when: { of: 'fine', rowedToday: true }, stage: "{a} watches {b} kiss {c}, and doesn't clap.", turns: [
    ['b', "It was only the game."],
    ['a', "I know. After earlier, I just didn't need to see it."],
  ], beat: "They stand next to each other, not touching, for the rest of the round." },
  { when: { of: 'fuming', rowedToday: true }, stage: "When {b} comes back to the line, {a} won't look at {b.obj}.", turns: [
    ['a', "We fought earlier, and then you go and do that with {c}? In front of everyone?"],
    ['b', "It's a game. It's got nothing to do with earlier."],
    ['a', "It's got everything to do with earlier."],
  ], beat: "{a} walks to the other end of the line." },
  { when: { of: 'laughs', rowedToday: true }, stage: "{a} laughs as {b} comes back to the line, a bit too loudly.", turns: [
    ['a', "Well, that was awful. You're lucky I'm still speaking to you after earlier."],
    ['b', "Are you?"],
    ['a', "Just about."],
  ], beat: "{b} takes {a}'s hand, and this time {a} lets {b.obj}." },
] } };

export const CHAL_PRIZE_WHOLE = { moves: { whole: [
  { when: { of: 'date' }, stage: "The winners' prize arrives by text: dinner for two on the terrace, away from everybody.", turns: [
    ['a', "We actually won something."],
    ['b', "I told you we would."],
    say('a', "I'm just glad I get you to myself for a bit. It never happens in here.", { romantic: "Dinner, just us. I've wanted this all week." }),
    ['b', "Me too. I've missed talking to you without everyone listening."],
  ], beat: "They walk up to the terrace hand in hand, and the villa cheers them off." },
  { when: { of: 'date' }, stage: "The winners get a text: a picnic on the hill above the villa, just the two of them.", turns: [
    ['b', "A picnic. We're going on an actual date."],
    ['a', "Do you know what I liked about today? You never once looked at anyone else."],
    ['b', "Why would I? I was trying to win it for us."],
  ], beat: "{a} doesn't stop smiling for the whole walk up the hill." },
  { when: { of: 'treat' }, stage: "The prize is a hamper and the hot tub to themselves for the afternoon.", turns: [
    ['a', "Nobody else is allowed in. That's the rule."],
    ['b', "This is the first time we've been on our own all week."],
    say('a', "I know. I didn't realise how much I needed it.", { soft: "I've missed this. Just us." }),
  ], beat: "The others watch from the kitchen window, and {a} and {b} don't notice." },
  { when: { of: 'treat' }, stage: "The prize arrives: a cake, a bottle of something fizzy, and the terrace to themselves until dinner.", turns: [
    ['b', "Can I tell you something? I was really proud of you today."],
    ['a', "For winning?"],
    ['b', "For trying that hard. You really meant it."],
    ['a', "I wanted to win it with you. That's why."],
  ], beat: "They cut the cake, and save a slice for nobody." },
  { when: { of: ['date', 'treat'], rowedToday: true }, stage: "{a} and {b} win the prize: time on their own, away from everybody, after a fight earlier.", turns: [
    ['b', "Well, this is good timing."],
    say('a', "I'm glad. I didn't like how we left it earlier.", { soft: "I hated fighting with you. I'm so glad we get this." }),
    ['b', "Me neither. Can we start the day again?"],
    ['a', "I'd like that."],
  ], beat: "By the time they come back, they're holding hands again." },
  { when: { of: 'party' }, stage: "The prize is a party by the pool, and {a} gets carried round it on everybody's shoulders.", turns: [
    say('a', "This is the best day I've had in here. I mean that.", { lad: "Best day in here, {~bro}. Easily." }),
  ], beat: "For one afternoon, nobody in the villa is fighting about anything." },
] } };

// chal-row: how {a} took it at the time opens it; how {b} answers decides the end.
const ROW_OPEN = {
  fine: [
    { stage: "{a} sits down next to {b} on the daybeds, after everyone else has gone to the fire pit.", turns: [
      ['a', "I need to tell you something, and I need you to just listen."],
      ['b', "Okay. I'm listening."],
      ['a', "When you kissed {c} today, I clapped. But I felt sick. I'm not fine with it."],
    ] },
    { stage: "The terrace, after dinner. {a} has been quiet all evening.", turns: [
      ['a', "I said I was fine today. I wasn't. I'm not."],
      ['b', "Is this about the challenge?"],
      ['a', "It's about you and {c}. I've been smiling about it for hours, and I can't any more."],
    ] },
    { stage: "{a} waits until everyone else has gone in.", turns: [
      ['a', "Can we talk about today? I didn't want to make a scene in front of everyone."],
      ['b', "About the kiss?"],
      ['a', "About the kiss with {c}. It hurt more than I let on."],
    ] },
  ],
  fuming: [
    { stage: "{a} pulls {b} up to the roof terrace the second dinner is over.", turns: [
      ['a', "I've been waiting all day to say this. You and {c}. In front of everyone."],
      ['b', "It was the game. You know it was the game."],
      ['a', "It was you. The game didn't make you do anything."],
    ] },
    { stage: "{a} doesn't even wait until they're alone.", turns: [
      ['a', "Do you want to explain what that was with {c}? Because everybody saw it."],
      ['b', "I knew you'd be like this."],
      ['a', "Like what? Hurt? Yes. I'm hurt."],
    ] },
    { stage: "{b} sits down next to {a} at the fire pit. {a} moves along.", turns: [
      ['b', "Are you still angry about the game?"],
      ['a', "I'm angry about {c}. The game was just where it happened."],
    ] },
  ],
  laughs: [
    { stage: "{a} and {b} are brushing their teeth before bed.", turns: [
      ['a', "Can I be honest about something? I laughed at the game. I didn't really find it funny."],
      ['b', "The kiss with {c}?"],
      ['a', "Yes. I've been thinking about it all evening."],
    ] },
    { stage: "In bed, {a} turns over to face {b}.", turns: [
      ['a', "I laughed today, I know. But the kiss with {c}. That wasn't just for the game, was it?"],
      ['b', "Where's this come from? You were fine."],
      ['a', "I was fine in front of everyone. I've been thinking about it since."],
    ] },
  ],
};
const ROW_END = {
  'just-a-game': [
    { turns: [['b', "It was a challenge. Everybody kissed everybody. I can't believe we're having this conversation."], ['a', "Out of everyone in that line, you chose {c}. That's what I can't stop thinking about."], ['b', "I didn't choose anything. It was a game."]], beat: "They go to bed without saying another word." },
    { turns: [['b', "You're making it into something it's not."], ['a', "Then tell me it meant nothing, and look at me when you say it."], ['b', "It meant nothing."]], beat: "{a} looks at {b} for a long time, and doesn't look convinced." },
  ],
  sorry: [
    { turns: [['b', "You're right. I got carried away, and I didn't think about how it looked from where you were. I'm sorry."], ['a', "Thank you. That's all I wanted."]], beat: "{a} lets {b} hold {a.posAdj} hand. It takes a minute." },
    { turns: [['b', "I should have come to you. I know that. I'm sorry."], ['a', "Why didn't you?"], ['b', "I wasn't thinking. That's the truth. It won't happen again."]], beat: "{a} leans into {b}, and the worst of it goes." },
  ],
  storm: [
    { turns: [['b', "Can you just listen to me for one second?"], ['a', "I listened all afternoon. I watched it, too."]], beat: "{a} walks out to the garden. {b} goes after {a.obj}, and comes back alone." },
    { turns: [['b', "I'm not going to keep saying sorry for a game."], ['a', "Then don't. I'm going inside."]], beat: "{a} walks off, and {b} stays at the fire pit on {b.posAdj} own." },
  ],
};
let rowN = 0;
const CHAL_ROW = [];
for (const [watched, opens] of Object.entries(ROW_OPEN)) for (const o of opens) for (const [of, ends] of Object.entries(ROW_END)) {
  const t = ends[rowN++ % ends.length];
  CHAL_ROW.push({ when: { watched, of }, stage: o.stage, turns: [...o.turns, ...t.turns], beat: t.beat });
}
// …and a second fight the same day.
CHAL_ROW.push(...Object.entries(ROW_END).map(([of, ends]) => {
  const t = ends[rowN++ % ends.length];
  return { when: { of, rowedToday: true }, stage: "The terrace, after dinner. It's the second time today.", turns: [
    ['a', "We already fought earlier. And then you did that with {c}, in front of everyone."],
    ['b', "So this is about earlier?"],
    ['a', "It's about all of it. I'm tired."],
    ...t.turns], beat: t.beat };
}));
export const CHAL_ROW_WHOLE = { moves: { whole: CHAL_ROW } };

export const CHAL_SPARK_WHOLE = { moves: { whole: [
  { when: { taken: true, started: true }, stage: "{a} pulls {b} onto the swing seat after dinner.", turns: [
    ['a', "Can I tell you something, and you won't look at me like that? The kiss with {c} today. I felt something."],
    ['b', "In a challenge?"],
    say('a', "I know how it sounds. But I've been thinking about it all day, and it wasn't {pa} I was thinking about.", { lad: "I know, {~bro}. But I can't stop thinking about it. And I'm with {pa}." }),
    ['b', "{pa} saw it too, you know."],
    ['a', "I know. That's the worst part."],
  ], beat: "{a} looks across the garden at {c}, and {c} is already looking back." },
  { when: { taken: true, started: false }, stage: "{a} and {b} are on the daybeds, keeping their voices down.", turns: [
    ['a', "I've been thinking about one kiss all day, and it wasn't with {pa}."],
    ['b', "{c}?"],
    ['a', "Please don't say it out loud. I don't know what it means yet."],
    say('b', "What are you going to do?", { sharp: "Then work out what it means before {pa} works it out for you." }),
    ['a', "Nothing. Probably nothing. I don't know."],
  ], beat: "{a} spends the rest of the evening trying very hard not to look at {c}." },
  { when: { taken: false, started: true }, stage: "{a} pulls {b} onto the swing seat after dinner.", turns: [
    ['a', "That kiss with {c}. Was it just me, or was there something there?"],
    ['b', "It wasn't just you. Everyone saw it."],
    say('a', "I didn't expect it. I thought it would just be a game.", { romantic: "I felt it. Properly felt it. I haven't felt that in ages." }),
    ['b', "Then do something about it. Not in a game. For real."],
  ], beat: "{a} looks across the garden at {c}, and {c} is already looking back." },
  { when: { taken: false, started: false }, stage: "{a} and {b} are on the daybeds after dinner.", turns: [
    ['a', "Can I tell you something? The kiss with {c} today. I can't stop thinking about it."],
    ['b', "Have you talked to {c} since?"],
    ['a', "No. I don't know if {c} felt it too."],
    say('b', "There's only one way to find out.", { soft: "Go and talk to {c}. What's the worst that can happen?" }),
  ], beat: "{a} spends the rest of the evening trying to work up the nerve." },
  { when: { taken: true, started: false }, stage: "{a} finds {b} in the kitchen, making tea.", turns: [
    ['a', "Can I ask you something? Is it normal to feel something from a game kiss?"],
    ['b', "Depends who it was with."],
    ['a', "{c}. And I'm with {pa}. So no, it's probably not normal."],
    say('b', "Do you think it meant something to {c} as well?", { soft: "Oh. That's a lot to be carrying round. Are you okay?" }),
    ['a', "I don't know. I'm scared to find out."],
  ], beat: "{b} hands {a} a tea, and {a} holds it without drinking any." },
  { when: { taken: true, started: false }, stage: "{a} sits down next to {b} at the fire pit, before anyone else comes out.", turns: [
    ['a', "I need to say something before I go mad. The kiss with {c} today felt real."],
    ['b', "Real how?"],
    say('a', "Real like it wasn't a game. And I came out of it feeling guilty about {pa}.", { nervy: "I don't know. Real. And now I can't look {pa} in the eye." }),
    ['b', "Guilty is a sign, you know."],
    ['a', "I know. I just don't know what it's a sign of yet."],
  ], beat: "The others start coming out, and {a} stops talking." },
  { when: { taken: true, started: false }, stage: "{a} and {b} are lying on the sunbeds, watching the sky go dark.", turns: [
    ['b', "You're miles away."],
    ['a', "I keep going back to the game. To {c}."],
    ['b', "And {pa}?"],
    ['a', "{pa} hasn't noticed anything. That almost makes it worse."],
  ], beat: "{b} reaches over and squeezes {a}'s hand, and they lie there quietly." },
  { when: { taken: true, started: true }, stage: "{a} and {b} are on their own in the dressing room.", turns: [
    ['a', "{c} came and found me after the game. We talked for ages."],
    ['b', "About the kiss?"],
    say('a', "About everything. And it felt easy, in a way it hasn't with {pa} for a while.", { romantic: "It felt like the start of something. And I'm with {pa}. I feel awful." }),
    ['b', "Then you need to be honest with yourself about {pa}."],
  ], beat: "{a} looks at {a.ref} in the mirror for a long time." },
  { when: { taken: false, started: false }, stage: "{a} finds {b} on the roof terrace.", turns: [
    ['a', "I think I like {c}. I didn't even know until the game."],
    ['b', "That's sweet. What are you going to do?"],
    say('a', "Talk to {c}, I think. Before somebody else does.", { lad: "Go for it, I think. Before I lose my nerve." }),
  ], beat: "{b} cheers quietly, and {a} laughs." },
] } };
