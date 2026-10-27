// ══════════════════════════════════════════════════════════════════════
// pm/talk/challenges.js — the scenes inside the villa's named challenges
// (pm/challenges.js, challenges-more.js)
// ══════════════════════════════════════════════════════════════════════
//
// Rewritten 2026-10-22 (the user: "redo the 11%"). Each scene is the moment
// the game makes (a card, a board, a score), then what it does to the two
// people it lands on. The game's own words (a card, a headline, a question)
// are kept exactly as the old pools had them: they say what the game is.
//
//   receipt        [a, b, c, (d)] a reads a card about c and kisses b as the guess
//                                 (`guessed`: b is c). `of`: secret · pull · head-turned ·
//                                 ick · row · love. d is c's partner (`cast` 4).
//   look-who       [a, b, c]  a reads {quote}, which b said in the beach hut about c.
//                             `guessed`; `of`: two-faced · warm · cold · plain
//   snogger-kiss   [a, b]     blindfolded b scores a's kiss best. `of`: ten · nine · high
//   snogger-win    [a, b]     a wins; b came second
//   snogger-row    [a, b, c]  a's partner b scored c's kiss higher. `of`: big · small
//   couple-goals   [a, b, c, d] couple a and b wrote couple c and d. `of`: marry · fake · break; `guessed`: most boards agreed
//   couple-goals-row [a, b, c] a (partner c) confronts b, who wrote them down. `of`: fake · break
//   knowing-me     [a, b]     a couple's score. `of`: high · mid · low
//   knowing-row    [a, b]     a wrote b as the one more likely to stray. `of`: guilty · hurt
//   talent-act     [a] / [a, b] `of`: flop (a alone) · duet
//   talent-win     [a, (b)]   a wins; b is a's partner (`coupled`)
//   talent-snub    [a, b, c]  a's partner b voted for c's act
//   baby-doll      [a, b]     `of`: team · left-it (a did it all) · lost
//   sorts-podium   [a, b]     `of`: top · wrong · least; `guessed`
//   grafties-award [a, (b)]   `of`: couple · grafter · least; b is a's partner (`coupled`)
//   blow-slip      [a, b]     lips touch mid-pass; not a couple
//   blow-dare      [a, b, (c)] a dropped the card. `of`: kiss-other (b fancied, c a's partner) · kiss-partner · forfeit
//   lip-race       [a, b]     a couple. `of`: win · row · laugh
//   lip-watch      [a, b, c]  a, who wants b, watches b win with c
//   tower-q        [a, b, (c)] b, a's partner, pulled the block and asked a. `of`: other-honest (c) ·
//                             dodge · dodge-seen · rate-high · rate-mid · rate-low · ick · no-ick
//   course-run     [a]        `of`: strong · flop
//   course-pick    [a, b, (c)] a rescues b. `of`: partner · other (c is a's partner) · single
//   course-win     [a, (b)]   the other side picked a; b is a's partner
//   blind-run      [a, b]     a guides blindfolded b. `of`: win · crash-row · crash-laugh
//   sports-captains [a, b]    `of`: clash · banter
//   sports-win     [a, ...]   a's team won
//   sports-sore    [a, (b)]   a takes the loss badly; b a teammate
//   headline       [a, b, c, (d)] a reads a headline about c and soaks b (b is c when `guessed`);
//                             d is c's partner. `of`: pull · row · ick · love · clown · jealous
import { build } from './build.js';

const G = { guessed: true }, NG = { guessed: false };

// ── Receipts ──────────────────────────────────────────────────────────
const CARD = {
  secret: "This islander has kissed someone behind their partner's back.",
  pull: "This islander has pulled someone for a chat while they were coupled up.",
  'head-turned': "This islander has said their head has been turned.",
  ick: "This islander has had the ick about someone in the villa.",
  row: "This islander has had a huge fight in the villa this week.",
  love: "This islander has said 'I love you' to someone in here.",
};
const card = (of, extra = {}) => ({ when: { of, ...extra } });

// The card is always turned over: that is the game (season read 2026-10-26).
export const RECEIPT = build('receipt', {
  plans: { featured: ['read', 'answer', 'land'], short: ['read', 'land'] },
  moves: {
    read: [
      ...Object.entries(CARD).flatMap(([of, text]) => [
        { ...card(of, G), stage: `{a} reads the card out loud: "${text}" {a} doesn't even look at anyone else, and walks straight over to {c}.`, turns: [['a', "I'm sorry. I've just got a feeling about you."]] },
        { ...card(of, NG), stage: `{a} reads the card: "${text}" {a} thinks for a long time, then kisses {b}.`, turns: [] },
      ]),
    ],
    answer: [
      { when: { of: 'secret', ...G }, turns: [['c', "Yeah. It's me. I'm not going to stand here and lie about it on top of everything."]] },
      { when: { of: 'secret', ...G, knows: true }, turns: [['c', "Why me? Why would you pick me?"], ['a', "Because I saw it."]] },
      { when: { of: 'pull', ...G }, turns: [['c', "Okay, fine. I had a chat. Everyone has chats. It was a chat!"], ['a', "That's what the card says, isn't it."]] },
      { when: { of: 'head-turned', ...G }, turns: [['c', "I said I was confused. That's not the same thing."], ['a', "It's kind of the same thing."]] },
      { when: { of: 'ick', ...G }, turns: [['c', "Okay, yes. It's one little thing. I'm not saying who it's about."], ['a', "Everyone is going to ask you who."]] },
      { when: { of: 'row', ...G }, turns: [['c', "One fight. One! Every couple has one."], ['a', "The whole villa heard your one."]] },
      { when: { of: 'love', ...G }, turns: [['c', "Okay, yes, it's me, and I meant it, and I'm not embarrassed."], ['a', "You're bright red."], ['c', "I'm not embarrassed!"]] },
      { when: NG, turns: [['a', "Then who was it? Because it's somebody, and they're very quiet right now."]] },
      { when: NG, turns: [['b', "It wasn't me. I promise you it wasn't me."], ['a', "Sorry! Worth a try."]] },
    ],
    land: [
      { when: { ...G, cast: 4 }, turns: [], beat: "{d} goes very quiet for the rest of the game." },
      { when: { ...NG, cast: 4 }, turns: [], beat: "The card is turned over. It says {c}. {d} looks at {c}, and {c} can't look back." },
      { when: { ...NG, cast: 3 }, turns: [], beat: "The card is turned over, and it says {c}, who stares at the floor." },
      { when: G, turns: [], beat: "The card is turned over. It says {c}. The villa gasps anyway." },
    ],
  },
});

export const LOOK_WHO = build('look-who', {
  plans: { featured: ['read', 'guess', 'land'], short: ['read', 'guess', 'land'] },
  moves: {
    read: [
      { stage: "{a} picks a card out of the box and reads it out: \"{quote}\"", turns: [] },
      { stage: "The next card. {a} reads it slowly: \"{quote}\" Everyone looks around.", turns: [] },
    ],
    guess: [
      { when: { of: 'two-faced', ...G }, turns: [['a', "That's {b}. That's so obviously {b}."], ['b', "Okay. Yes. That was me. It sounds worse out loud."], ['c', "Hang on. That's about me."]] },
      { when: { of: 'two-faced', ...NG }, turns: [['a', "I genuinely have no idea who said that."], ['c', "Hang on. That's about me. Who said that about me?"], ['b', "It sounds worse than it was."]] },
      { when: { of: 'warm', ...G }, turns: [['a', "That's {b}. Has to be."], ['b', "Guilty. And I meant every word."]] },
      { when: { of: 'warm', ...NG }, turns: [['a', "No idea. Someone who likes {c} a lot, apparently."], ['b', "That was me, actually."]] },
      { when: { of: 'cold', ...G }, turns: [['a', "That's {b}. Nobody else talks like that."], ['b', "I'm not taking it back."], ['c', "Nobody asked you to."]] },
      { when: { of: 'cold', ...NG }, turns: [['a', "I've got no idea, and I'm scared to guess."], ['c', "Whoever it was, say it to my face next time."], ['b', "Fine. It was me."]] },
      { when: { of: 'plain', ...G }, turns: [['a', "That's {b}. I'd know that anywhere."], ['b', "It's true, though. I stand by it."]] },
      { when: { of: 'plain', ...NG }, turns: [['a', "No idea. Could be anyone."], ['b', "It was me. It's not even that bad."]] },
    ],
    land: [
      { when: { of: 'two-faced' }, turns: [], beat: "{c} turns round very slowly to look at {b}, and doesn't turn back." },
      { when: { of: 'warm' }, turns: [], beat: "{c} smiles, and {b} goes a bit red." },
      { when: { of: 'cold' }, turns: [], beat: "Nobody says anything for a moment, and then everyone talks at once." },
      { when: { of: 'plain' }, turns: [], beat: "The villa laughs, and the next card comes out." },
    ],
  },
});

export const SNOGGER_KISS = build('snogger-kiss', {
  plans: { featured: ['kiss', 'score'], short: ['score'] },
  stages: [{ stage: "Sauciest Snogger. {b} is blindfolded on the stool, with a scorecard.", turns: [] }],
  moves: {
    kiss: [
      { stage: "{b} is blindfolded on the stool. {a} walks over very quietly, and goes for it.", turns: [] },
      { stage: "It's {a}'s turn. The girls on the lawn are already screaming before {a} gets there.", turns: [] },
    ],
    score: [
      { when: { of: 'ten' }, turns: [['b', "Ten. That's a ten. Whoever that was, that's a ten."]] },
      { when: { of: 'ten', taken: true }, turns: [['b', "Ten. Easy ten."]], beat: "{pa} claps, slowly, and very hard." },
      { when: { of: 'nine' }, turns: [['b', "Nine. Only because I'm saving the ten for later."]] },
      { when: { of: 'nine', taken: true }, turns: [['b', "Nine. Wow. Nine."]], beat: "{pa} has stopped clapping." },
      { when: { of: 'high' }, turns: [['b', "Eight? That was nice. That was very nice. Eight."]] },
      { when: { of: 'high', bTaken: true }, turns: [['b', "Eight. Solid eight."]], beat: "{pb} would like to know who that was. {pb} is told. {pb} doesn't love it." },
    ],
  },
});

export const SNOGGER_WIN = build('snogger-win', {
  plans: { featured: ['win', 'answer?'], short: ['win'] },
  moves: {
    win: [
      { stage: "The scores are added up. The Sauciest Snogger is {a}, just ahead of {b}.", turns: [['a', "I'd like to thank my lips. And my parents, for the lips."]] },
      { when: { persona: 'wallflower' }, stage: "The scores are added up, and nobody expected it: {a} wins, ahead of {b}.", turns: [['a', "Me? Are you sure? Check again. Somebody check again."]] },
      { stage: "{a} takes the crown, and {b} takes second, very loudly.", turns: [['b', "It was rigged. Somebody rigged it. I want a recount."]] },
    ],
    answer: [
      { turns: [['b', "Second. Fine. Second's still a medal."], ['a', "There aren't medals."], ['b', "There should be."]] },
    ],
  },
});

export const SNOGGER_ROW = build('snogger-row', {
  plans: { featured: ['catch', 'row', 'land?'], short: ['catch', 'row'] },
  moves: {
    catch: [
      // {mine}/{top}: what {b} really gave {a} and {c} (pm/challenges.js snogger), with the article.
      { when: { of: 'big' }, stage: "The scores are read out. {b} gave {a} {mine}, and {c} {top}. Everyone does the maths.", turns: [['a', "{Mine}? I got {mine}? And {c} got {top}?"]] },
      // 'small' is a gap of two: a row needs two points at least.
      { when: { of: 'small' }, stage: "The scores are read out. {b} gave {c} two more points than {a}. Two.", turns: [['a', "Just so I'm clear. You gave {c} more than me."]] },
    ],
    row: [
      { when: { of: 'big' }, turns: [['b', "I was blindfolded! I didn't know it was you!"], ['a', "You should know what I kiss like. That's the whole point. That's the whole point of us."]] },
      { when: { of: 'small' }, turns: [['b', "It's two points."], ['a', "It's two points to {c}. That's what it is."], ['b', "You're being mad."]] },
    ],
    land: [
      { turns: [], beat: "{c} is trying very hard not to look pleased with {c.ref}." },
      { turns: [], beat: "The rest of the villa decides this is the best part of the game." },
    ],
  },
});

export const COUPLE_GOALS = build('couple-goals', {
  plans: { featured: ['board', 'react', 'land?'], short: ['board', 'react'] },
  moves: {
    board: [
      { when: { of: 'marry' }, stage: "Couple Goals. The question: \"Which couple is most likely to get married?\" {a} and {b} turn their board round. It says {c} and {d}.", turns: [] },
      { when: { of: 'fake' }, stage: "Next question: \"Which couple is the fakest?\" {a} and {b} have written {c} and {d}.", turns: [] },
      { when: { of: 'break' }, stage: "\"Which couple will be the first to break up on the outside?\" {a} and {b}'s board says {c} and {d}.", turns: [] },
      { when: { of: 'marry', ...G }, stage: "\"Which couple is most likely to get married?\" Almost every board says {c} and {d}.", turns: [] },
      { when: { of: 'fake', ...G }, stage: "\"Which couple is the fakest?\" Board after board turns round, and they all say {c} and {d}.", turns: [] },
      { when: { of: 'break', ...G }, stage: "\"First to break up on the outside?\" Most of the boards agree: {c} and {d}.", turns: [] },
    ],
    react: [
      { when: { of: 'marry' }, turns: [['c', "Stop it! That's so nice. I think I'm going to cry."], ['a', "It's obvious. Everyone can see it."]] },
      { when: { of: 'fake' }, turns: [['c', "Us? Are you joking? Fake?"], ['a', "It's just how it looks from where we're sitting."], ['d', "Then you're sitting in the wrong place."]] },
      { when: { of: 'break' }, turns: [['d', "First to break up? Based on what?"], ['b', "Just a feeling. Sorry. It's a game."], ['c', "It doesn't feel like a game."]] },
      { when: { of: ['fake', 'break'], ...G }, turns: [['c', "All of you? Every single one of you?"], ['a', "It's not personal."], ['c', "It's literally our names on a board."]] },
    ],
    land: [
      { when: { of: 'marry' }, turns: [], beat: "{c} and {d} hold hands, and the villa goes 'aww'." },
      { when: { of: ['fake', 'break'] }, turns: [], beat: "{c} and {d} look at each other, and then at the boards, and then at each other again." },
    ],
  },
});

export const COUPLE_GOALS_ROW = build('couple-goals-row', {
  plans: { featured: ['open', 'answer'], short: ['open', 'answer'] },
  moves: {
    open: [
      { stage: "After Couple Goals. {a} finds {b} by the kitchen, and {c} isn't far behind.", turns: [['a', "You wrote us down. You. I thought you were our friend."]] },
      { when: { of: 'fake' }, stage: "{a} catches {b} on the daybeds.", turns: [['a', "Fake? You think {c} and I are fake? You've watched us every day."]] },
    ],
    answer: [
      { turns: [['b', "It was a game. I had to write somebody."], ['a', "You didn't have to write us."], ['b', "I'm sorry. I didn't think you'd take it like this."]] },
      { when: { of: 'break' }, turns: [['b', "I just meant it's early for you two. That's all. It wasn't meant to be nasty."], ['c', "It sounded nasty."]] },
      { when: { of: 'fake' }, turns: [['b', "It's how it looks sometimes. I'm being honest."], ['a', "Then be honest to our faces. Not on a board."]] },
    ],
  },
});

export const KNOWING_ME = build('knowing-me', {
  plans: { featured: ['score', 'after'], short: ['score'] },
  moves: {
    score: [
      { when: { of: 'high' }, stage: "Knowing Me, Knowing You. {a} and {b} turn their boards round, and they match. Again. And again.", turns: [['a', "Every single one. I told you I pay attention."], ['b', "I'm actually a bit scared of you."]] },
      { when: { of: 'mid' }, stage: "{a} and {b} get about half of them right.", turns: [['b', "Half. That's fine. Half is a start."], ['a', "You put my favourite food as pasta."], ['b', "It's not pasta?"]] },
      { when: { of: 'low' }, stage: "The boards go round, and {a} and {b} get almost nothing right.", turns: [['a', "You don't know my middle name?"], ['b', "You've never told me your middle name!"], ['a', "I have. I have told you twice."]] },
    ],
    after: [
      { when: { of: 'high' }, turns: [['b', "Is it weird that that's the most romantic thing that's happened to me all week?"], ['a', "It's a bit weird. I love it."]] },
      { when: { of: 'mid' }, turns: [['a', "We'll work on it. I'll make you a quiz."], ['b', "Please don't make me a quiz."]] },
      { when: { of: 'low' }, turns: [['b', "Maybe we've been doing more kissing than talking."], ['a', "Maybe. That's not the worst problem to have."]] },
    ],
  },
});

export const KNOWING_ROW = build('knowing-row', {
  plans: { featured: ['board', 'answer'], short: ['board', 'answer'] },
  moves: {
    board: [
      { stage: "The last question: \"Which of you is more likely to stray?\" {a} turns the board round. It says {b}.", turns: [['b', "Me? You think it's me?"]] },
      { stage: "\"Who's more likely to stray?\" {a} hesitates, then holds up the board with {b}'s name on it.", turns: [['b', "Seriously?"]] },
      { stage: "The final card. {a} writes for a long time, and then turns it round. {b}'s name, in capitals.", turns: [['b', "In capitals? You wrote it in capitals?"]] },
    ],
    answer: [
      { when: { of: 'hurt' }, turns: [['a', "It's just a feeling. You get a lot of attention in here."], ['b', "And I've turned all of it down. All of it. And you still wrote my name."]] },
      { when: { of: 'hurt' }, turns: [['b', "I've never given you one reason. Not one."], ['a', "I know. I'm sorry. It was my head, not you."]] },
      { when: { of: 'hurt' }, turns: [['b', "What have I done to make you think that?"], ['a', "Nothing. That's the honest answer. Nothing."], ['b', "Then why is my name on that board?"]] },
      { when: { of: 'hurt' }, turns: [['a', "I'm not saying you would. I'm saying if one of us did, I think it'd be you."], ['b', "That's the same thing."]] },
      { when: { of: 'guilty' }, turns: [['b', "Wow. Okay. Thanks for that."], ['a', "Can you look at me and tell me I'm wrong?"], ['b', "Not here. Not in front of everybody."]] },
      { when: { of: 'guilty' }, turns: [['a', "Is there a reason I shouldn't have?"], ['b', "No. Why would there be?"], ['a', "You answered that very quickly."]] },
      { when: { of: 'guilty' }, turns: [['b', "Why would you write that?"], ['a', "Because I've got eyes."], ['b', "What's that supposed to mean?"]] },
    ],
  },
});

// Acts added 2026-10-26 (solo-good · solo-mid · poem [a, b] · impression-laugh / impression-sore [a, b]).
export const TALENT_ACT = build('talent-act', {
  plans: { featured: ['act', 'after?'], short: ['act'] },
  // (b's lines in an impression are the one being impersonated.)
  moves: {
    act: [
      { when: { of: 'flop' }, stage: "The talent show. {a} gets up on the terrace to sing, and forgets every word after the first line.", turns: [['a', "Hang on. Hang on. It's coming back. It's not coming back."]] },
      { when: { of: 'flop' }, stage: "{a} attempts a backflip on the lawn. The lawn wins.", turns: [['a', "I'm fine! I'm fine. That was the routine. That was all part of it."]] },
      { when: { of: 'flop' }, stage: "{a}'s magic trick involves a card, a glass, and a lot of confidence. The card ends up in the pool.", turns: [['a', "Okay. So that's not where it was meant to end up."]] },
      { when: { of: 'solo-good' }, stage: "{a} gets up on the terrace with a hairbrush for a microphone, and is actually good.", turns: [['a', "Thank you. Thank you. I'll be here all summer."]] },
      { when: { of: 'solo-good' }, stage: "{a} does a dance routine on the lawn, every step of it, and the villa goes silent and then goes mad.", turns: [['a', "I've been practising that in the bathroom for a week."]] },
      { when: { of: 'solo-good' }, stage: "{a} juggles three oranges, then four, then throws one at the daybeds.", turns: [['a', "That last one was a gift."]] },
      { when: { of: 'solo-mid' }, stage: "{a} tells jokes. Two of them land. One of them really doesn't.", turns: [['a', "Tough crowd. Tough villa."]] },
      { when: { of: 'solo-mid' }, stage: "{a} sings a song from school. Nobody else knows it, and {a} sings it anyway, all the way through.", turns: [['a', "That's three minutes none of you are getting back."]] },
      { when: { of: 'solo-mid' }, stage: "{a}'s act is press-ups. Lots of press-ups. The villa counts along until it gets bored.", turns: [['a', "Forty! I said I'd get to forty!"]] },
      { when: { of: 'poem' }, stage: "{a} unfolds a piece of paper and reads a poem, out loud, to {b}.", turns: [['a', "'I came in here thinking I knew what I wanted. Then you sat down next to me, and I stopped wanting anything else.'"], ['b', "Stop it. Stop it, I'm going to cry."]] },
      { when: { of: 'poem' }, stage: "{a} has written {b} a poem. It doesn't rhyme. {a} reads it anyway, shaking.", turns: [['a', "'You're the first thing I look for in the morning, and the last thing I look at at night.'"], ['b', "That's the nicest thing anyone's ever said to me."]] },
      { when: { of: ['impression-laugh', 'impression-sore'] }, stage: "{a}'s act is an impression of {b}. The walk, the voice, the hair flick. All of it.", turns: [['a', "'Oh my God, babe, I'm literally so loyal.'"]] },
      { when: { of: ['impression-laugh', 'impression-sore'] }, stage: "{a} announces an impression, and then does {b}, perfectly, down to the way {b} sits.", turns: [['a', "'No, I'm not angry. I'm just disappointed. In all of you.'"]] },
      { when: { of: 'duet' }, stage: "{a} and {b} do a duet, with dance moves, and absolutely no rehearsal.", turns: [['b', "You were meant to come in on the second verse!"], ['a', "There was a second verse?"]] },
    ],
    after: [
      { when: { of: 'flop' }, turns: [['a', "Can I have a do-over? No? Right. I'm going to go and lie face down in the pool."]] },
      { when: { of: 'duet' }, turns: [['a', "I think we nailed it."], ['b', "We did not nail it. We did not even find it."]] },
      { when: { of: 'impression-laugh' }, turns: [['b', "That's horrible. That's so horrible. Do it again."]] },
      { when: { of: 'impression-sore' }, turns: [['b', "Is that meant to be funny?"], ['a', "Everyone else is laughing."], ['b', "I'm not."]] },
      { when: { of: 'poem' }, turns: [], beat: "Half the villa says 'aww'. The other half pretends to be sick." },
    ],
  },
});

export const TALENT_WIN = build('talent-win', {
  plans: { featured: ['win', 'after?'], short: ['win'] },
  moves: {
    win: [
      { stage: "The hands go up, and it's not even close: {a} wins the talent show.", turns: [['a', "Thank you! Thank you. I've been working on that for years. Well, since breakfast."]] },
      { when: { coupled: true }, stage: "{a} wins the talent show, and {b} is the loudest one cheering.", turns: [['b', "That's my partner! Did everyone see that? That's mine!"]] },
    ],
    after: [
      { turns: [['a', "I'd like to thank everyone who voted. And the people who didn't, I've written your names down."]] },
    ],
  },
});

export const TALENT_SNUB = build('talent-snub', {
  plans: { featured: ['vote', 'answer'], short: ['vote', 'answer'] },
  moves: {
    vote: [
      { stage: "The vote is by show of hands. {b}'s hand goes up for {c}'s act. Not {a}'s.", turns: [['a', "Really? Really?"]] },
      { stage: "{a} counts the hands for {a.posAdj} act, and one is missing. It's {b}'s, and it's up for {c}.", turns: [['a', "I can see you, you know."]] },
    ],
    answer: [
      { turns: [['b', "It was better! It was objectively better!"], ['a', "Objectively. Right. I'll remember that."]] },
      { turns: [['b', "I'm being honest! You'd want me to be honest."], ['a', "Not with your hand. Not in front of everyone."]] },
    ],
  },
});

export const BABY_DOLL = build('baby-doll', {
  plans: { featured: ['baby', 'after'], short: ['baby'] },
  moves: {
    baby: [
      { when: { of: 'team' }, stage: "Three in the morning, and the doll starts crying. {a} and {b} both get up at the same time.", turns: [['a', "I've got her."], ['b', "No, I've got her. You did the last one."]] },
      { when: { of: 'left-it' }, stage: "The doll is screaming. {b} is asleep. {a} is not.", turns: [['a', "Are you joking? Are you actually asleep?"], ['b', "Five more minutes."]] },
      { when: { of: 'lost' }, stage: "{a} and {b} come back from the pool. The doll does not come back from the pool with them.", turns: [['b', "Where's the baby?"], ['a', "I thought you had the baby."]] },
    ],
    after: [
      { when: { of: 'team' }, turns: [['b', "Is it weird that this is the moment I thought, I could actually do this with you?"], ['a', "With a real one, I hope. Not the doll."]] },
      { when: { of: 'left-it' }, turns: [['a', "I've changed it four times. Four. You haven't changed it once."], ['b', "It's a doll."], ['a', "That's not the point, and you know it's not the point."]] },
      { when: { of: 'lost' }, turns: [['a', "We are never telling anyone about this."], ['b', "The whole villa saw."], ['a', "Then we're never telling anyone at home."]] },
    ],
  },
});

export const SORTS_PODIUM = build('sorts-podium', {
  plans: { featured: ['podium', 'after?'], short: ['podium'] },
  moves: {
    podium: [
      { when: { of: 'top', ...G }, stage: "Couple of Sorts. The public's favourite couple: {a} and {b}, who stood on first place and were right.", turns: [['a', "We knew it! We stood on first and everything!"], ['b', "Thank you! Thank you, everyone at home!"]] },
      { when: { of: 'top', ...NG }, stage: "The public's favourite couple is {a} and {b}, who were standing somewhere else entirely.", turns: [['a', "Us? Really? Us?"], ['b', "They like us! The public actually like us!"]] },
      { when: { of: 'wrong' }, stage: "{a} and {b} stood on the first-place podium. The public put them at the very bottom.", turns: [['a', "Oh. Okay. That's embarrassing."], ['b', "Can we just get down now? Quietly?"]] },
      { when: { of: 'least' }, stage: "The last category: least likely to last on the outside. The public have picked {a} and {b}.", turns: [['a', "That's harsh. That's really harsh."], ['b', "They don't know us. Not really."]] },
    ],
    after: [
      { when: { of: 'least' }, turns: [['b', "Do you think they're right?"], ['a', "I don't know. Do you?"]] },
      { when: { of: 'wrong' }, turns: [['b', "I really thought we'd be higher than that."], ['a', "Me too. I need to stop reading my own reviews."]] },
    ],
  },
});

export const GRAFTIES_AWARD = build('grafties-award', {
  plans: { featured: ['award'], short: ['award'] },
  moves: {
    award: [
      { when: { of: 'couple' }, stage: "The Grafties. Couple of the summer, voted by the public: {a} and {b}.", turns: [['a', "We're putting this on the fridge."], ['b', "We don't have a fridge. We have a villa."]] },
      { when: { of: 'grafter' }, stage: "Biggest grafter of the summer: {a}.", turns: [['a', "I'm choosing to take that as a compliment. I'm choosing very hard."]] },
      { when: { of: 'grafter', coupled: true }, stage: "Biggest grafter of the summer: {a}. {b} laughs the loudest.", turns: [['b', "It worked, though, didn't it? It worked on me."]] },
      { when: { of: 'least' }, stage: "The award nobody wants: least likely to be getting a text at the final. It goes to {a}.", turns: [['a', "Thank you. I'd like to thank nobody."]] },
      { when: { of: 'least', coupled: true }, stage: "The award nobody wants goes to {a} and {b}.", turns: [['b', "We're going to frame it. Out of spite."]] },
    ],
  },
});

// ── Suck and Blow, Lip Service ────────────────────────────────────────
export const BLOW_SLIP = build('blow-slip', {
  plans: { featured: ['slip', 'after'], short: ['slip'] },
  moves: {
    slip: [
      { stage: "Suck and Blow. The card drops halfway between {a} and {b}, and their lips meet instead.", turns: [['b', "Oh."], ['a', "That wasn't the card."]] },
      { stage: "The card slips. For a second, {a} and {b} are just kissing, in front of everyone.", turns: [['a', "Sorry! Sorry. The card fell."], ['b', "I noticed."]] },
    ],
    after: [
      { turns: [['b', "Should we go again?"], ['a', "With the card this time."]] },
      { turns: [['a', "That was an accident."], ['b', "Was it?"], ['a', "Mostly."]] },
    ],
  },
});

export const BLOW_DARE = build('blow-dare', {
  plans: { featured: ['drop', 'dare', 'land?'], short: ['drop', 'dare'] },
  moves: {
    drop: [
      { stage: "{a} drops the card. The forfeit: a kiss with anyone in the villa.", turns: [['a', "Anyone? Anyone at all? Right."]] },
      { stage: "The card hits the floor between {a}'s lips and the next person's. The villa starts chanting.", turns: [['a', "Okay, okay. I know what I'm doing. I think."]] },
    ],
    dare: [
      { when: { of: 'kiss-other', taken: true }, turns: [['a', "{b}. Sorry, {c}. It's the forfeit."], ['c', "The forfeit said anyone. You picked {b}."]] },
      { when: { of: 'kiss-other', taken: false }, turns: [['a', "{b}. Come here. It's the rules."], ['b', "Since when do you follow rules?"]] },
      { when: { of: 'kiss-partner' }, turns: [['a', "Easiest forfeit I've ever done. {b}, come here."]] },
      { when: { of: 'forfeit' }, turns: [['a', "I'll take the forfeit. I'm not kissing somebody because a card fell on the floor."]] },
    ],
    land: [
      { when: { of: 'kiss-other', taken: true }, turns: [], beat: "{c} watches every second of it, and counts." },
      { when: { of: 'kiss-partner' }, turns: [], beat: "The villa groans, and {b} grins." },
      { when: { of: 'forfeit' }, turns: [], beat: "The forfeit is a bucket of slime. {a} stands there and takes it." },
    ],
  },
});

export const LIP_RACE = build('lip-race', {
  plans: { featured: ['race', 'after?'], short: ['race'] },
  moves: {
    race: [
      { when: { of: 'win' }, stage: "Lip Service. {a} and {b} pass the card mouth to mouth all the way down the line and never drop it once.", turns: [['b', "We won! We actually won!"], ['a', "I've never concentrated so hard in my life."]] },
      { when: { of: 'laugh' }, stage: "{a} and {b} drop the card every single time, because they can't stop laughing.", turns: [['a', "Stop looking at me!"], ['b', "I have to look at you, that's the game!"]] },
      { when: { of: 'row' }, stage: "{a} and {b} drop the card for the fourth time, and it turns into a fight.", turns: [['a', "You keep moving!"], ['b', "You keep breathing on it!"]] },
    ],
    after: [
      { when: { of: 'row' }, turns: [['a', "We've managed to have a fight in the middle of a kissing race."], ['b', "That's us, isn't it? That's us in one game."]] },
      { when: { of: 'laugh' }, turns: [['b', "We came last."], ['a', "We came last having the best time."]] },
    ],
  },
});

export const LIP_WATCH = build('lip-watch', {
  plans: { featured: ['watch'], short: ['watch'] },
  moves: {
    watch: [
      { stage: "{b} and {c} win Lip Service. {a} claps along with everyone else, slower than everyone else.", turns: [['a', "Lovely. Well done. Really lovely teamwork."]] },
      { stage: "{a} watches {b} and {c} pass the card all the way down the line, and stops watching halfway.", turns: [['a', "Is it over yet? Tell me when it's over."]] },
    ],
  },
});

// ── Tower of Truth ────────────────────────────────────────────────────
export const TOWER_Q = build('tower-q', {
  plans: { featured: ['pull', 'answer', 'land?'], short: ['answer'] },
  moves: {
    pull: [
      { stage: "{b} pulls a block out of the tower, and reads the question on it.", turns: [] },
      { stage: "The tower wobbles. {b} slides a block out carefully, and reads it to {a}.", turns: [] },
    ],
    answer: [
      { when: { of: 'other-honest' }, turns: [['b', "'Who would you go for in here, if you weren't with me?'"], ['a', "Do you want the truth?"], ['b', "That's the game."], ['a', "{c}."]] },
      { when: { of: 'other-honest' }, turns: [['b', "'Who else in here do you find attractive?'"], ['a', "I'm not going to lie. {c}."], ['b', "At least you said it."]] },
      { when: { of: 'dodge' }, turns: [['b', "'Who would you go for in here, if you weren't with me?'"], ['a', "Nobody. It's you, obviously. That's a trick question."], ['b', "Good answer."]] },
      { when: { of: 'dodge' }, turns: [['b', "'If you weren't with me, who would you pick?'"], ['a', "I'd pick you again. Next block."], ['b', "Smooth."]] },
      { when: { of: 'dodge' }, turns: [['b', "'Who else in here are you into?'"], ['a', "No one. I'm not even going to pretend to think about it."], ['b', "Okay. I'll take that."]] },
      { when: { of: 'dodge' }, turns: [['b', "'Who would you go for, if you were single tomorrow?'"], ['a', "I wouldn't be single tomorrow. That's my answer."]] },
      { when: { of: 'dodge-seen' }, turns: [['b', "'Who would you go for in here, if you weren't with me?'"], ['a', "Nobody. You."], ['b', "You looked somewhere before you said that."]] },
      { when: { of: 'rate-high' }, turns: [['b', "'Out of ten, how happy are you with me?'"], ['a', "Ten. Easy."], ['b', "You didn't even think about it."], ['a', "I didn't have to."]] },
      { when: { of: 'rate-mid' }, turns: [['b', "'Out of ten, how happy are you with me?'"], ['a', "Honestly? A solid six. Maybe a seven. It's early."], ['b', "I'll take a solid six. For now."]] },
      { when: { of: 'rate-low' }, turns: [['b', "'Out of ten, how happy are you with me?'"], ['a', "Can I pass?"], ['b', "No."], ['a', "Four."]] },
      { when: { of: 'ick' }, turns: [['b', "'What's your ick about me?'"], ['a', "Do you really want to know?"], ['b', "Now I do."], ['a', "When you check yourself out in every mirror you walk past."]] },
      { when: { of: 'no-ick' }, turns: [['b', "'What's your ick about me?'"], ['a', "I haven't got one yet."], ['b', "Yet?"], ['a', "Give me time."]] },
    ],
    land: [
      { when: { of: ['other-honest', 'rate-low'] }, turns: [], beat: "The tower falls over, which feels about right." },
      { when: { of: 'other-honest' }, turns: [], beat: "{c} looks up from across the lawn, and quickly looks back down." },
      { when: { of: 'dodge-seen' }, turns: [], beat: "{a} has no answer to that." },
      { when: { of: 'ick' }, turns: [], beat: "{b} checks {b.ref} out in the pool while denying it." },
    ],
  },
});

// ── The obstacle courses, sports day ──────────────────────────────────
export const COURSE_RUN = build('course-run', {
  plans: { featured: ['run'], short: ['run'] },
  moves: {
    run: [
      { when: { of: 'strong' }, stage: "{a} flies round the obstacle course, over the wall and through the foam, without a single slip.", turns: [['a', "Did anyone time that? Somebody time that. I want it on record."]] },
      { when: { of: 'strong' }, stage: "{a} hits the finish line first, arms in the air, covered in foam and grinning.", turns: [['a', "I've been waiting all summer to be good at something in here!"]] },
      { when: { of: 'flop' }, stage: "{a} slips on the first obstacle, then the second, then the first one again on the way back.", turns: [['a', "I'm fine! I'm fine. Is my dignity still back there? Somebody fetch it."]] },
      { when: { of: 'flop' }, stage: "{a} gets stuck at the top of the wall, and stays there for a very long time.", turns: [['a', "I live here now. This is my home. Go on without me."]] },
    ],
  },
});

export const COURSE_PICK = build('course-pick', {
  plans: { featured: ['pick', 'react?'], short: ['pick'] },
  moves: {
    pick: [
      { when: { of: 'partner' }, stage: "{a} reaches the end of the course and has to pick someone to rescue. No hesitation: {b}.", turns: [['b', "Took you long enough."], ['a', "I was literally running."]] },
      { when: { of: 'partner' }, stage: "{a} picks {b} to rescue, of course.", turns: [['a', "Was there ever going to be anyone else?"], ['b', "There'd better not have been."]] },
      // (Two lines for up to three partner picks a course: the same exchange three times running, read 2026-10-26.)
      { when: { of: 'partner' }, stage: "{a} comes off the last obstacle soaking wet and runs straight to {b}.", turns: [['b', "You're dripping on me."], ['a', "That's what you get for being picked."]] },
      { when: { of: 'partner' }, stage: "{a} stops in front of the line, pretends to think about it for a second, then grabs {b}'s hand.", turns: [['b', "Don't ever do that pause again."], ['a', "You loved it."]] },
      { when: { of: 'partner' }, stage: "{a} doesn't even slow down. {b} is picked before {a} has caught {a.posAdj} breath.", turns: [['a', "Come on. We're going."], ['b', "Where are we going?"], ['a', "Anywhere. You're rescued."]] },
      { when: { of: 'partner' }, stage: "{a} points at {b} from halfway down the course, before even finishing it.", turns: [['b', "You haven't finished yet!"], ['a', "I'm just letting you know now, so you don't worry."]] },
      { when: { of: 'partner' }, stage: "{a} reaches the line and picks {b} without a word, and the villa says 'aww' at the same time.", turns: [['b', "Everyone's looking at us."], ['a', "Let them."]] },
      { when: { of: 'other' }, stage: "{a} runs past {c} and keeps going, all the way to {b}.", turns: [['c', "Oh. Okay. Right."], ['b', "I wasn't expecting that."], ['a', "Neither was I, to be fair."]] },
      { when: { of: 'other' }, stage: "{a} hesitates at the end of the course, looks at {c}, then picks {b}.", turns: [['c', "You looked at me first. I saw you look at me first."]] },
      { when: { of: 'single' }, stage: "{a} has nobody to rescue, so {a} picks the one {a} wants to.", turns: [['a', "{b}. Come on. You're mine for the afternoon."], ['b', "Am I?"], ['a', "You are now."]] },
      { when: { of: 'single' }, stage: "{a} is single, takes a breath at the end of the course, and goes straight for {b}.", turns: [['b', "Me? Really?"], ['a', "I've been waiting all week for an excuse."]] },
      { when: { of: 'other' }, stage: "{a} gets to the end of the course and picks {b}. Not {c}.", turns: [['b', "Me? Okay! Okay, me."], ['c', "Interesting."]] },
      { when: { of: 'other' }, stage: "{a} doesn't look at {c}. {a} goes straight for {b}.", turns: [['a', "Strategy. It's all strategy."], ['c', "Is it?"]] },
      { when: { of: 'single' }, stage: "{a} is single, and picks {b}, and doesn't explain.", turns: [['b', "Why me?"], ['a', "Why not you?"]] },
    ],
    react: [
      { when: { of: 'other' }, turns: [['a', "It's a game. It's just a game."], ['c', "Then you won't mind explaining it later."]] },
      { when: { of: 'single' }, turns: [['b', "I'm choosing to be flattered."], ['a', "Good. You should be."]] },
    ],
  },
});

export const COURSE_WIN = build('course-win', {
  plans: { featured: ['win'], short: ['win'] },
  moves: {
    win: [
      { stage: "The whistle goes, and it's {a}'s side that wins.", turns: [['a', "We did it! Did everyone see that? We did it!"]] },
      { when: { withB: true }, stage: "{a} crosses the line first, and {b} is the first one there with a hug.", turns: [['b', "That's my partner! Nobody can tell me anything!"]] },
    ],
  },
});

export const BLIND_RUN = build('blind-run', {
  plans: { featured: ['run', 'after?'], short: ['run'] },
  moves: {
    run: [
      // Every couple runs now, the slowest first (challenges-more.js blindCourse): `steady` and `shout` are the middle.
      { when: { of: 'steady' }, stage: "{b} is blindfolded, and {a} talks {b.obj} round the course one step at a time.", turns: [['a', "Small step. Smaller. There's a tyre. Lift your foot. Good."], ['b', "Are we winning?"], ['a', "We're not losing. That's the main thing."]] },
      { when: { of: 'steady' }, stage: "{a} guides {b} round so carefully that the next couple has to wait.", turns: [['b', "Why is everyone laughing?"], ['a', "Because we're very slow. But nobody's fallen in the pool."]] },
      { when: { of: 'steady' }, stage: "{b} has the blindfold on, and holds {a}'s voice like a rope.", turns: [['a', "Trust me. Three steps forward, then stop."], ['b', "I'm trusting you. Don't make me regret it."]] },
      { when: { of: 'shout' }, stage: "{a} starts off calm. By the second obstacle, {a} is shouting.", turns: [['a', "Left! No, your left! LEFT!"], ['b', "Stop shouting at me! I can't see anything!"], ['a', "That's the whole game!"]] },
      { when: { of: 'shout' }, stage: "{b} stops dead in the middle of the course and refuses to move.", turns: [['b', "I'm not taking another step until you say it nicely."], ['a', "Please. Walk. Forward."], ['b', "Nicer than that."]] },
      { when: { of: 'win' }, stage: "{b} is blindfolded, and {a} doesn't raise {a.posAdj} voice once. They're round in no time.", turns: [['a', "Last one. Reach out. That's the flag."], ['b', "Have we done it? Have we actually done it?"]] },
      { when: { of: 'crash-laugh' }, stage: "{b} walks straight past the finish line and keeps going towards the hot tub.", turns: [['a', "Stop! You've finished, you can stop walking!"], ['b', "Then why are you laughing?"]] },
      { when: { of: 'crash-row' }, stage: "{a} says go left, {b} goes right, and {b} ends up in the pool fully dressed.", turns: [['b', "You meant my right! You always mean my right!"], ['a', "I did not say right!"]] },
      { when: { of: 'win' }, stage: "{b} is blindfolded. {a} shouts directions, and somehow, they win.", turns: [['a', "Left! Left! Your other left!"], ['b', "We won? We won!"]] },
      { when: { of: 'crash-laugh' }, stage: "{a} is meant to be guiding blindfolded {b}. {b} walks straight into a post.", turns: [['b', "You said straight on!"], ['a', "I'm sorry! I'm laughing too hard to say anything!"]] },
      { when: { of: 'crash-row' }, stage: "{b} walks into the pool. Blindfolded. On {a}'s instructions.", turns: [['b', "You did that on purpose!"], ['a', "I said stop! I definitely said stop!"]] },
    ],
    after: [
      { when: { of: 'win' }, turns: [['b', "I trusted you completely."], ['a', "That's the scariest thing anyone's ever said to me."]] },
      { when: { of: 'win' }, turns: [], beat: "{a} and {b} are the fastest couple by a long way. The others are still arguing about whose left it was." },
      { when: { of: 'steady' }, turns: [], beat: "They finish, slowly, to a round of applause that's mostly sarcastic." },
      { when: { of: 'shout' }, turns: [['b', "We're never doing that again."], ['a', "We finished, didn't we?"], ['b', "I don't care."]] },
      { when: { of: 'crash-laugh' }, turns: [], beat: "{b} pulls the blindfold off, sees where {b} has ended up, and can't stop laughing either." },
      { when: { of: 'crash-row' }, turns: [['b', "I'm not speaking to you until I'm dry."], ['a', "That could be hours."], ['b', "Good."]] },
    ],
  },
});

export const SPORTS_CAPTAINS = build('sports-captains', {
  plans: { featured: ['pick'], short: ['pick'] },
  moves: {
    pick: [
      { when: { of: 'clash' }, stage: "Sports day. {a} and {b} are the captains, and they've already fallen out over the coin toss.", turns: [['a', "That was heads!"], ['b', "It was tails, and you know it was tails."]] },
      { when: { of: 'clash' }, stage: "{a} and {b} pick their teams like it's the final of something.", turns: [['b', "You're going down."], ['a', "It's an egg and spoon race."], ['b', "You're still going down."]] },
      { when: { of: 'banter' }, stage: "Sports day. {a} and {b} are captains, and they're having far too much fun with it.", turns: [['a', "I'll take my partner, obviously."], ['b', "And I'll take the one who can actually run."]] },
    ],
  },
});

export const SPORTS_WIN = build('sports-win', {
  plans: { featured: ['win'], short: ['win'] },
  moves: {
    win: [
      { stage: "{a}'s team crosses the line first, and the celebrating goes on far longer than the race did.", turns: [['a', "Champions! Sports day champions! Nobody can take this off us!"]] },
      { stage: "It comes down to the last race, and {a}'s team takes it.", turns: [['a', "I peaked. That was it. That was the peak of my life."]] },
    ],
  },
});

export const SPORTS_SORE = build('sports-sore', {
  plans: { featured: ['sulk'], short: ['sulk'] },
  moves: {
    sulk: [
      { stage: "{a}'s team loses, and {a} takes it very, very badly.", turns: [['a', "It was rigged. The sack was broken. My sack had a hole in it."]] },
      { when: { withB: true }, stage: "{a} sits on the lawn with {a.posAdj} arms folded. {b} tries to help.", turns: [['b', "It's sports day. It doesn't matter."], ['a', "It matters to me."]] },
    ],
  },
});

// ── Headlines ─────────────────────────────────────────────────────────
const HEAD = {
  pull: "'Loved-up islander not so loved-up after late-night chat.'",
  row: "'Villa hothead kicks off. Again.'",
  ick: "'Islander goes cold on partner over the smallest thing.'",
  love: "'Islander drops the L-bomb, and the villa can't cope.'",
  clown: "'Villa joker can't take anything seriously. Not even love.'",
  jealous: "'Green-eyed islander can't stand to see partner chatting.'",
};
export const HEADLINE = build('headline', {
  plans: { featured: ['read', 'soak', 'land?'], short: ['read', 'soak'] },
  moves: {
    read: Object.entries(HEAD).map(([of, h]) => ({ when: { of }, stage: "{a} picks up the next headline, and reads it out to the whole villa.", turns: [['a', h]] })),
    soak: [
      { when: G, turns: [['c', "Why is everyone looking at me?"]], beat: "The drink hits {c} before {c} has finished the sentence. Right first time." },
      { when: G, turns: [['c', "That's so unfair."]], beat: "Nobody else thinks it's unfair. {c} is wearing the drink." },
      { when: NG, turns: [['b', "Me? Why me?"]], beat: "{b} is soaked, and furious. {c} laughs a bit too hard." },
      { when: { of: 'row', ...NG }, turns: [['b', "I'm the calmest person in here!"]], beat: "{a} soaks {b} anyway. Everyone turns to look at {c}, who doesn't argue." },
      { when: NG, turns: [['b', "That's not me! That's not even close to me!"]], beat: "{b} wipes the drink off. Across the circle, {c} has gone very still." },
    ],
    land: [
      { when: { ...G, cast: 4 }, turns: [], beat: "{d} doesn't laugh." },
      { when: { ...NG, cast: 4 }, turns: [], beat: "{d} turns to look at {c}, and keeps looking." },
    ],
  },
});
