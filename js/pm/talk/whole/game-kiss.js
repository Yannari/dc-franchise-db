// pm/talk/whole/game-kiss.js — one kiss in a kissing game (pm/kiss-round.js).
// The walk over, the kiss, a line or two, and the faces, written as one beat
// (pm/script.js talkScript `whole`) so what's said fits why {a} chose {b}.
// The stitched one could open on the walk past {pa} and close on "The villa
// groans, the way it always does at the safe ones."
//   of     partner · crush · stir · fun
//   game   snogger: {b} is blindfolded and gives a score; what {b} says is the
//          score the board reads out later (pm/challenges.js), so those are
//          written per score. Every other game plays the general ones.
//   {pa} is {a}'s partner (taken), {pb} is {b}'s (bTaken).
import { say } from './voice.js';

const GAMES = ['suck-blow', 'lip-service', 'course', 'sports', 'truth-dare', 'heart-rate'];
const G = { game: GAMES };
const HIGH = [8, 9, 10], MID = [5, 6, 7], LOW = [1, 2, 3, 4];

const GENERAL = [
  // ── {a} goes to {b}, {a.posAdj} partner ──
  { when: { ...G, of: 'partner' }, stage: "{a} doesn't even look round. Straight to {b}.", turns: [
    ['b', "I knew you'd come to me."],
    say('a', "There was nobody else I wanted to kiss.", { romantic: "There's only one person in here I want to kiss. It was always going to be you.", lad: "Of course I came to you. Who else?" }),
  ], beat: "The villa groans at the safe pick, and neither of them cares." },
  { when: { ...G, of: 'partner' }, stage: "{a} takes {b} by the hand first, then kisses {b.obj}.", turns: [
    ['b', "You didn't even stop to think about it."],
    ['a', "I didn't need to."],
  ], beat: "{b} is still smiling when {a} gets back to the line." },
  { when: { ...G, of: 'partner' }, stage: "{a} walks over to {b} and gives {b.obj} a shy kiss.", turns: [
    ['b', "You've gone red."],
    say('a', "Everyone's watching. I'm not used to it.", { quiet: "I don't like everyone looking. I only wanted to kiss you." }),
  ], beat: "Somebody watching says 'aww', and {a} goes redder." },
  { when: { ...G, of: 'partner', rowedToday: true }, stage: "{a} walks over to {b}, still a bit stiff after their fight earlier.", turns: [
    ['b', "Are we okay?"],
    say('a', "We're okay. Come here.", { soft: "We're okay. I'm sorry about earlier." }),
  ], beat: "They kiss, and it's softer than anyone expected." },
  // ── {a} goes for who {a.he} really wants ──
  { when: { ...G, of: 'crush', taken: true }, stage: "{a} walks right past {pa} and kisses {b}, and it goes on for a long time.", turns: [
    say('a', "It's a game. That's the challenge.", { lad: "It's the game, {~bro}. I'm just playing the game." }),
  ], beat: "The whole villa turns to look at {pa}, who has stopped smiling." },
  { when: { ...G, of: 'crush', taken: true }, stage: "{a} stops, looks at {pa}, and then goes to {b} anyway.", turns: [
    ['b', "I didn't think you'd pick me."],
    ['a', "I've wanted to for a while."],
  ], beat: "{pa} gets up and goes inside." },
  { when: { ...G, of: 'crush', taken: false }, stage: "{a} goes straight for {b}, and doesn't hold back.", turns: [
    ['b', "Where did that come from?"],
    say('a', "I've wanted to do that since the first day.", { romantic: "I've been thinking about that for days.", lad: "I've wanted to do that all week, if I'm honest." }),
  ], beat: "Everyone watching screams, and {b} goes pink." },
  { when: { ...G, of: 'crush', taken: false }, stage: "{a} takes {b}'s face in both hands and kisses {b.obj}.", turns: [
    ['b', "Wow. Okay."],
    ['a', "Was that okay?"],
    ['b', "More than okay."],
  ], beat: "{a} walks back to the line, smiling to {a.ref}." },
  { when: { ...G, of: 'crush', bTaken: true, taken: false }, stage: "{a} goes straight to {b}, even though {pb} is sitting right there.", turns: [
    ['b', "You know {pb} is watching."],
    ['a', "I know. I still wanted to."],
  ], beat: "{pb} stares very hard at the floor." },
  // ── {a} does it to get a reaction ──
  { when: { ...G, of: 'stir', bTaken: true }, stage: "{a} looks straight at {pb}, and then kisses {b}. Slowly.", turns: [
    say('a', "It's only a game. Nobody needs to get upset.", { sharp: "What? It's the challenge. Everyone's so sensitive." }),
  ], beat: "{pb} isn't laughing, or saying anything at all." },
  { when: { ...G, of: 'stir', bTaken: true }, stage: "{a} takes {a.posAdj} time choosing, and stops in front of {b}.", turns: [
    ['a', "I'm picking {b}. Sorry, {pb}. Rules are rules."],
  ], beat: "There's a gasp from everyone watching, and {pb} gets up and walks off." },
  { when: { ...G, of: 'stir' }, stage: "{a} sits on {b}'s lap for the kiss, and stays there afterwards.", turns: [
    ['b', "What are you doing?"],
    ['a', "The challenge. Same as everyone else."],
  ], beat: "{a} is smiling. Nobody else is." },
  // ── just for a laugh ──
  { when: { ...G, of: 'fun' }, stage: "{a} plants a big, silly kiss on {b}.", turns: [
    ['b', "That was the least romantic kiss I've ever had."],
    ['a', "Good. We're friends. I wanted everyone to see that."],
  ], beat: "They both burst out laughing, and the villa laughs with them." },
  { when: { ...G, of: 'fun' }, stage: "{a} walks over to {b} and holds up both hands.", turns: [
    say('a', "{b}, you're my friend, so come here. This means nothing.", { lad: "Come here, {~bro}. This means nothing. Everyone hear that?" }),
    ['b', "Nothing at all."],
  ], beat: "They kiss, and everyone watching cheers anyway." },
  { when: { ...G, of: 'fun' }, stage: "{a} gives {b} a quick peck and runs straight back to the line.", turns: [
    ['b', "Was that it?"],
    ['a', "It's a game. I'm not making it weird."],
  ], beat: "{b} laughs, and gives {a} a thumbs up." },
  { when: { ...G, of: 'fun', bTaken: true }, stage: "{a} goes over to {b}, and waves at {pb} first.", turns: [
    ['a', "Don't worry, {pb}. It's only {b}. I'll give {b.obj} back."],
  ], beat: "{pb} laughs and waves back, and {a} kisses {b} on the cheek." },
  // ── more of each, so a season's thirty-odd kisses don't repeat ──
  { when: { ...G, of: 'partner' }, stage: "{a} walks over to {b} with a big smile, and kisses {b.obj} like nobody else is there.", turns: [
    ['b', "Everyone's going to say we're boring."],
    say('a', "Let them. I'd rather kiss you than anyone else in here.", { bestie: "Let them, babe. You're the only one I want." }),
  ], beat: "The villa groans, and somebody shouts 'get a room'." },
  { when: { ...G, of: 'partner' }, stage: "{a} looks along the line, and goes straight to {b}.", turns: [
    ['b', "You didn't even look at anyone else."],
    ['a', "I don't need to look at anyone else."],
  ], beat: "{b} goes red, and {a} squeezes {b.posAdj} hand on the way back to the line." },
  { when: { ...G, of: 'partner', taken: true }, stage: "{a} goes to {b}, and holds on a little longer than the game needs.", turns: [
    say('a', "Just so everyone knows where I stand.", { lad: "Just so everyone knows, {~bro}. This one's mine." }),
  ], beat: "{b} can't stop smiling, and neither can {a}." },
  { when: { ...G, of: 'partner' }, stage: "{a} walks over to {b} and gives {b.obj} a long kiss.", turns: [
    ['b', "I wasn't sure you'd pick me with everyone watching."],
    ['a', "Why wouldn't I? I'm proud of us."],
  ], beat: "{b} is smiling all the way back to the line." },
  { when: { ...G, of: 'partner' }, stage: "{a} goes to {b} and kisses {b.obj} quickly, a bit embarrassed.", turns: [
    ['b', "That's all I get?"],
    say('a', "The rest is for when nobody's watching.", { flirty: "You'll get a real one later. Not in front of everyone." }),
  ], beat: "The villa whoops, and {a} covers {a.posAdj} face." },
  { when: { ...G, of: 'crush', taken: true }, stage: "{a} looks at {pa} for a second, then walks the other way, to {b}.", turns: [
    ['b', "Are you sure about this?"],
    say('a', "No. But I've been thinking about it for days.", { lad: "Not really, {~bro}. But I've wanted to for days." }),
  ], beat: "{pa} watches every second of it, and doesn't move." },
  { when: { ...G, of: 'crush', taken: true }, stage: "{a} goes to {b}, and the kiss lasts much longer than the others.", turns: [
    ['b', "That was a lot more than a game kiss."],
    ['a', "I know. I'm sorry. I didn't plan it."],
  ], beat: "Nobody cheers. Everyone is looking at {pa}." },
  { when: { ...G, of: 'crush', taken: true }, stage: "{a} hesitates at the end of the line, and then picks {b}.", turns: [
    ['a', "I'm going to get into trouble for this."],
    ['b', "Then why did you do it?"],
    ['a', "Because I wanted to."],
  ], beat: "{pa} gets up and walks off to the kitchen." },
  { when: { ...G, of: 'crush', taken: false }, stage: "{a} walks over to {b}, nervous, and kisses {b.obj} gently.", turns: [
    ['b', "I didn't know you liked me."],
    say('a', "I've liked you since I walked in. I just didn't know how to say it.", { nervy: "I was too scared to say it. So I'm doing this instead." }),
  ], beat: "{b} smiles all the way back to the line." },
  { when: { ...G, of: 'crush', taken: false }, stage: "{a} doesn't hesitate. Straight to {b}.", turns: [
    ['b', "Okay. That was a good kiss."],
    ['a', "I've been waiting for an excuse."],
  ], beat: "The whole villa whistles, and {a} doesn't even pretend to be embarrassed." },
  { when: { ...G, of: 'crush', taken: false, bTaken: true }, stage: "{a} picks {b}, and doesn't look at {pb} once.", turns: [
    ['b', "{pb} is going to kill me."],
    ['a', "I'm sorry. I couldn't pick anybody else."],
  ], beat: "{pb} folds {pb.posAdj} arms and doesn't clap." },
  { when: { ...G, of: 'stir', bTaken: true }, stage: "{a} walks up to {b}, but looks at {pb} the whole way.", turns: [
    ['b', "Why me?"],
    ['a', "Why not you? It's only a game."],
  ], beat: "{pb} doesn't take {pb.posAdj} eyes off {a} for the rest of the round." },
  { when: { ...G, of: 'stir', bTaken: true }, stage: "{a} kisses {b}, and then turns round and smiles at {pb}.", turns: [
    say('a', "Don't look at me like that. Everyone's doing it.", { sharp: "What? It's a challenge. Nobody else is complaining." }),
  ], beat: "{pb} turns away, and the people either side of {pb.obj} go very quiet." },
  { when: { ...G, of: 'stir' }, stage: "{a} picks {b} and makes a show of it, slowly, for everyone watching.", turns: [
    ['b', "Was that for me, or for everyone else?"],
    ['a', "Does it matter?"],
  ], beat: "{b} doesn't answer, and walks back to the line looking confused." },
  { when: { ...G, of: 'fun' }, stage: "{a} grabs {b}'s hand and pulls {b.obj} into the middle like it's a dance.", turns: [
    ['b', "What are you doing?"],
    ['a', "Making it fun. Someone has to."],
  ], beat: "They kiss with their eyes wide open, and everyone falls about laughing." },
  { when: { ...G, of: 'fun' }, stage: "{a} picks {b}, and they both start laughing before the kiss even happens.", turns: [
    ['b', "I can't do this with a straight face."],
    say('a', "Neither can I. Just do it quickly.", { lad: "Me neither, {~bro}. Quick, get it over with." }),
  ], beat: "It's over in a second, and the villa cheers anyway." },
];

// ── snogger: {b} is blindfolded, and gives the kiss a score ──
const SAYS = {
  high: [
    ['b', "Whoever that was, that was amazing."],
    ['b', "Okay. That was really good. Can I have that one again?"],
  ],
  mid: [
    ['b', "That was nice. Yeah. Nice."],
    ['b', "Not bad. Not bad at all."],
  ],
  low: [
    ['b', "Okay. That was a bit awkward."],
    ['b', "I don't think that one was for me."],
  ],
};
const SCORE = { high: HIGH, mid: MID, low: LOW };
let snogN = 0;
function snog(when, stage, beats) {
  return Object.entries(SCORE).map(([band, score]) => ({
    when: { ...when, game: 'snogger', score }, stage,
    turns: [SAYS[band][snogN++ % SAYS[band].length]], beat: beats[band],
  }));
}
const SNOGGER = [
  ...snog({ of: 'partner' }, "{b} is blindfolded on the stool, and {a} walks straight over and kisses {b.obj}.", {
    high: "{b} is grinning before {a} has even stepped back. {a} walks back to the line very pleased.",
    mid: "{a} walks back to the line, hoping {b} knew it was {a.obj}.",
    low: "{a} walks back to the line looking a bit hurt that {b} didn't know it was {a.obj}.",
  }),
  ...snog({ of: 'partner' }, "{a} tiptoes over to the stool, so {b} won't guess who it is.", {
    high: "The girls on the bench say 'aww', and {a} goes pink.",
    mid: "{a} shrugs at the bench, and goes back to the line.",
    low: "The bench goes 'ooh', and {a} pulls a face at them.",
  }),
  ...snog({ of: 'partner', rowedToday: true }, "{b} is blindfolded on the stool. {a} goes over, even after their fight earlier, and kisses {b.obj}.", {
    high: "{a} walks back to the line, and the fight from earlier feels a long way off.",
    mid: "{a} walks back to the line, not sure if that helped.",
    low: "{a} walks back to the line, and looks like {a.he} wishes {a.he} hadn't bothered.",
  }),
  ...snog({ of: 'crush' }, "{b} is blindfolded on the stool, and has no idea who's walking over. {a} takes {a.posAdj} time.", {
    high: "The bench screams, and {b} still has no idea who it was.",
    mid: "{a} walks back to the line, wishing {b} had said more.",
    low: "{a} walks back to the line and doesn't look at anyone.",
  }),
  ...snog({ of: 'crush', taken: true }, "{a} walks past {pa} on the bench and up to the stool where {b} is waiting.", {
    high: "Everyone turns to look at {pa}, who isn't smiling any more.",
    mid: "{pa} watches {a} all the way back to the line.",
    low: "{pa} looks relieved, and then annoyed at being relieved.",
  }),
  ...snog({ of: 'stir' }, "{a} takes {a.posAdj} time choosing, and makes sure everybody sees who {a.he} goes to.", {
    high: "{a} walks back to the line looking very pleased with {a.ref}.",
    mid: "{a} walks back to the line, smiling at the bench.",
    low: "{a} walks back to the line, laughing it off.",
  }),
  ...snog({ of: 'fun' }, "{a} skips over to the stool and kisses blindfolded {b} quickly.", {
    high: "{a} laughs all the way back to the line.",
    mid: "{a} gives the bench a bow.",
    low: "The bench is in stitches, and so is {a}.",
  }),
];

export const GAME_KISS_WHOLE = { moves: { whole: [...GENERAL, ...SNOGGER] } };
