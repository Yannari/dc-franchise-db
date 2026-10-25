// ══════════════════════════════════════════════════════════════════════
// pm/talk/kiss-games.js — the kisses a kissing challenge is made of, and
// Truth or Dare's truths (pm/kiss-round.js, challenges-more.js)
// ══════════════════════════════════════════════════════════════════════
//
// Rewritten 2026-10-22 (the user: "redo the 11%"). A game kiss is quick: the
// walk over, the kiss, and the faces. The faces are the scene.
//   game-kiss [a, b]  a kisses b. `of`: partner · crush · stir · fun.
//             `game`: snogger (b blindfolded) · suck-blow · lip-service · truth-dare.
//             {pa} is a's partner (taken), {pb} is b's (bTaken).
//   tod-truth `of`: named-coupled [a, b, c] a names b, with partner c listening ·
//             named-single [a, b] · dodge [a, b] (b is a's partner) ·
//             partner-only [a, b] (b is a's partner) · nobody [a]
import { build } from './build.js';

export const GAME_KISS = build('game-kiss', {
  plans: { featured: ['walk', 'kiss', 'faces'], short: ['kiss', 'faces'] },
  moves: {
    walk: [
      { when: { game: 'truth-dare' }, stage: "{a} picks dare. The card says: kiss the islander you're most attracted to.", turns: [['a', "Right. Okay. No pressure, then."]] },
      { when: { game: 'truth-dare', of: 'stir' }, stage: "{a} picks dare, and reads it out slowly: kiss somebody else's partner.", turns: [['a', "Oh, I know exactly who."]] },
      { when: { game: 'snogger' }, stage: "{b} is blindfolded on the stool, and has no idea who's walking over.", turns: [] },
      { when: { of: 'partner' }, stage: "{a} doesn't even look round. Straight to {b}.", turns: [] },
      { when: { of: 'crush' }, stage: "{a} takes a second, and then walks right past everyone else to {b}.", turns: [] },
      { when: { of: 'stir' }, stage: "{a} takes {a.posAdj} time choosing. Everyone is watching, which is the point.", turns: [] },
      { when: { of: 'fun' }, stage: "{a} cracks {a.posAdj} knuckles and marches over to {b} like it's a job.", turns: [] },
    ],
    kiss: [
      { when: { of: 'partner' }, turns: [['b', "Took you long enough."], ['a', "About two seconds. Sorry, everyone. I'm boring."], ['b', "You're not boring. You're mine."]] },
      { when: { of: 'partner' }, stage: "{a} takes {b} by the hand first, then kisses {b.obj}.", turns: [['a', "Safe choice?"], ['b', "Best choice."]] },
      // What he says is the score he gives (pm/challenges.js snogger): the board reads it out later.
      { when: { of: 'partner', game: 'snogger', score: 10 }, stage: "{a} kisses {b}, and {b} breaks into a grin under the blindfold.", turns: [['b', "I knew it was you. I'd know that anywhere. Ten. Easily ten."]] },
      { when: { of: 'partner', game: 'snogger', score: [8, 9] }, stage: "{a} kisses {b}, and {b} sits back on the stool, smiling.", turns: [['b', "Okay. That was good. That was really good."]] },
      { when: { of: 'partner', game: 'snogger', score: [1, 2, 3, 4, 5, 6, 7] }, stage: "{a} kisses {b}, and {b} doesn't react much under the blindfold.", turns: [['b', "Nice. Yeah. Nice."], ['a', "Nice?"]] },
      { when: { of: 'crush', taken: true }, stage: "{a} walks right past {pa} and kisses {b}. For quite a long time.", turns: [['a', "What? It's a game. It's a game! That's the challenge."]] },
      { when: { of: 'crush', taken: false }, stage: "{a} goes for {b}, and doesn't hold back.", turns: [['b', "Well. Hello."], ['a', "I've been waiting all day to do that. All week, actually."]] },
      { when: { of: 'crush' }, stage: "{a} takes {b}'s face in both hands and kisses {b.obj}.", turns: [['b', "Wow."], ['a', "I'm not going to lie. I've wanted to do that for a while."], ['b', "I could tell."]] },
      { when: { of: 'crush' }, stage: "{a} pulls {b} in by the waist, and it goes on well past the whistle.", turns: [['a', "Was that the challenge?"], ['b', "I don't care."]] },
      { when: { of: 'crush', game: 'snogger', score: [7, 8, 9, 10] }, stage: "{b} is blindfolded and doesn't know who it is. Everyone else does.", turns: [['b', "Whoever that was... wow. Can I have that one again?"]] },
      { when: { of: 'stir', bTaken: true }, stage: "{a} looks straight at {pb}, and then kisses {b}. Slowly.", turns: [['a', "What? It's only a game. Everyone's so sensitive."]] },
      { when: { of: 'stir', bTaken: true }, turns: [['a', "I'm picking {b}. Sorry, {pb}. Not sorry."]] },
      { when: { of: 'stir' }, stage: "{a} sits on {b}'s lap for the kiss, and stays there afterwards.", turns: [['a', "I think I'll go with {b}. What? It's the challenge. I'm doing the challenge."]] },
      { when: { of: 'fun' }, stage: "{a} plants a big, silly kiss on {b}.", turns: [['b', "Was that a kiss or a headbutt?"], ['a', "Bit of both. You're welcome."]] },
      { when: { of: 'fun' }, turns: [['a', "{b}, you're my friend, so come here. This means nothing, and I want everyone to know it means nothing."], ['b', "Nothing at all."]] },
      { when: { of: 'fun' }, stage: "{a} gives {b} a quick peck and runs straight back to the line.", turns: [['b', "That's it? That's all I get?"], ['a', "That's all anyone gets."]] },
      { when: { of: 'fun', game: 'snogger' }, stage: "{a} kisses blindfolded {b} on the forehead.", turns: [['b', "Who does that? Who kisses a forehead? What is this, a blessing?"]] },
    ],
    faces: [
      { when: { of: 'partner' }, turns: [], beat: "The villa groans, the way it always does at the safe ones." },
      { when: { of: 'partner' }, turns: [], beat: "The villa cheers, and somebody shouts 'boring' with love." },
      { when: { of: 'crush', taken: true }, turns: [], beat: "The whole villa turns to look at {pa}, who has stopped smiling." },
      { when: { of: 'crush', bTaken: true }, turns: [], beat: "{pb} is staring very hard at the floor." },
      { when: { of: 'crush' }, turns: [], beat: "The lawn screams. Somebody fans themselves with a scorecard." },
      { when: { of: 'crush' }, turns: [], beat: "{a} walks back to the line not looking at anyone, and that says more than the kiss did." },
      { when: { of: 'stir', bTaken: true }, turns: [], beat: "{pb} isn't laughing, or saying anything at all." },
      { when: { of: 'stir', bTaken: true }, turns: [], beat: "There's a gasp from the benches, and {pb} gets up and walks off." },
      { when: { of: 'stir' }, turns: [], beat: "{a} is smiling. Nobody else is." },
      { when: { of: 'fun' }, turns: [], beat: "The villa is in stitches, and so are they." },
      { when: { of: 'fun' }, turns: [], beat: "They both burst out laughing halfway through, and that's the end of that." },
    ],
  },
});

export const TOD_TRUTH = build('tod-truth', {
  plans: { featured: ['card', 'answer', 'faces'], short: ['answer', 'faces'] },
  stages: [{ stage: "Truth or Dare, on the lawn. {a} picks truth.", turns: [] }],
  moves: {
    card: [
      { when: { of: ['named-coupled', 'dodge', 'partner-only'] }, stage: "{a} picks truth. The card: who in here, apart from your partner, would you most like to kiss?", turns: [['a', "Oh, come on. Who writes these?"]] },
      { when: { of: ['named-single', 'nobody'] }, stage: "{a} picks truth. The card: who would you most like to couple up with?", turns: [['a', "Okay. Okay. Give me a second."]] },
      { when: { of: 'named-coupled' }, stage: "{a}'s card asks who {a} would pull if {a} was single.", turns: [['a', "This is a trap. This whole game is a trap."]] },
    ],
    answer: [
      { when: { of: 'named-coupled' }, turns: [['a', "Honestly? {b}. Sorry. It's the truth. It's truth or dare. You asked."], ['c', "Wow. Okay. Thanks for that."]] },
      { when: { of: 'named-coupled' }, turns: [['a', "Who would I go for, apart from {c}? It's got to be {b}."], ['b', "Oh."], ['c', "Oh, indeed."]] },
      { when: { of: 'named-single' }, turns: [['a', "{b}. I've never hidden it. Everybody knows. Now it's official."], ['b', "Oh. Okay, then."]] },
      { when: { of: 'named-single', known: true }, turns: [['a', "You want the truth? It's {b}. It has been for days. Everyone in this villa knows it."]] },
      { when: { of: 'dodge' }, stage: "{a} reads the card for a very long time.", turns: [['a', "Can I take a dare instead?"], ['b', "Why can't you answer it?"], ['a', "I can. I just don't want to."]] },
      { when: { of: 'dodge' }, turns: [['a', "Who would I kiss other than my partner? Nobody. Obviously."], ['b', "You took a long time to say 'obviously'."]] },
      { when: { of: 'dodge' }, turns: [['a', "I'm not answering that."], ['b', "It's truth or dare. You have to answer."], ['a', "Then I'm not answering it very well."]] },
      { when: { of: 'partner-only' }, turns: [['a', "Nobody. It's {b}. It's only ever been {b}. Next question."], ['b', "Good answer."]] },
      { when: { of: 'partner-only' }, turns: [['a', "Easy. {b}. That's not even a question. Give me a harder one."]] },
      { when: { of: 'nobody' }, turns: [['a', "Who do I like in here? Honestly? Nobody's grabbed me yet. I'm still looking. Hard."]] },
      { when: { of: 'nobody' }, stage: "{a} reads the card, and shrugs.", turns: [['a', "Nobody. That's the truth. Sorry, everyone. Next."]] },
    ],
    faces: [
      { when: { of: 'named-coupled' }, turns: [], beat: "The villa gasps. {c} puts {c.posAdj} drink down and doesn't pick it up again." },
      { when: { of: 'named-coupled' }, turns: [], beat: "{b} looks pleased, and then sees {c}'s face, and stops looking pleased." },
      { when: { of: 'named-single' }, turns: [], beat: "The villa whoops, and {b} goes pink." },
      { when: { of: 'dodge' }, turns: [], beat: "{b} notices. Everybody notices that, too." },
      { when: { of: 'partner-only' }, turns: [], beat: "{b} kisses {a} before anyone can say anything, and the villa groans." },
      { when: { of: 'nobody' }, turns: [], beat: "Somebody on the benches shouts 'yet!', and everyone laughs." },
    ],
  },
});
