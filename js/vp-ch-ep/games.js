// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/games.js — where each game is played, its rules card, how it moves
// ══════════════════════════════════════════════════════════════════════
//
// One table for the stepped viewer (manual §18.4 step 1: TD's VENUES). A game's
// rules come from the engine's own `desc` (js/ch/dailies.js, js/ch/arena.js:
// set-up, mechanic, what goes wrong, win condition), so the card and the game
// can never disagree. The final's checkpoints have no desc in the engine; theirs
// are written here, in the same four parts.
//
// The words the engine does not write (TJ's opening line, what the camera sees
// while a game is played) come from the small pools below, picked by a seeded
// hash, and name only what the record says happened (§18.3 "render, never
// invent"). Plain spoken English, said once.
import { DAILIES } from '../ch/dailies.js';
import { ARENA_GAMES } from '../ch/arena.js';

// The daily's place on the island and how the stage plays it:
//   hang  under the pier (Hang On): everyone hangs, drops into the water
//   last  last one standing: knocked off, towers falling
//   race  a race or a total: a progress board, then the finish
export const DAILY_STAGE = {
  'cliff-relay': { plate: 'cliff', hour: 'day', show: 'race', place: 'The Cliff', spot: 'cliff-jump', verb: 'jump', water: true },
  'reef-dash': { plate: 'beach', hour: 'day', show: 'race', place: 'The Reef', spot: 'beach', verb: 'swim', water: true },
  'truck-tug': { plate: 'truck', hour: 'day', show: 'race', place: 'The Truck Track', spot: 'beach-field', verb: 'pull' },
  'lagoon-quiz': { plate: 'gorge', hour: 'day', show: 'played', place: 'The Gorge', spot: 'gorge', verb: 'quiz', water: true },
  'pole-truth': { plate: 'poles', hour: 'day', show: 'played', place: 'The Poles', spot: 'beach', verb: 'stand', water: true },
  // the betrayal dailies (js/ch/daily/betrayal.js)
  'raft-king': { plate: 'poles', hour: 'day', show: 'played', place: 'The Raft', spot: 'beach', verb: 'push', water: true },
  'cut-rope': { plate: 'dock', hour: 'day', show: 'played', place: 'The Dock', spot: 'dock', verb: 'hang', water: true },
  'double-cross': { plate: 'beach', hour: 'day', show: 'race', place: 'The Reef', spot: 'beach', verb: 'swim', water: true },
  'trust-fall': { plate: 'cliff', hour: 'day', show: 'played', place: 'The Cliff', spot: 'cliff-jump', verb: 'jump', water: true },
  'who-said-it': { plate: 'club', hour: 'night', show: 'played', place: 'The Beach Club', spot: 'club', verb: 'quiz' },
  'jungle-maze': { plate: 'maze', hour: 'day', show: 'race', place: 'The Jungle Maze', spot: 'tiki-path', verb: 'maze' },
  'hang-on': { plate: 'dock', hour: 'day', show: 'hang', place: 'The Dock', spot: 'dock', verb: 'hang', water: true },
  demolition: { plate: 'derby', hour: 'day', show: 'last', place: 'The Derby Ring', spot: 'beach-field', verb: 'smash' },
  'night-swim': { plate: 'beach', hour: 'night', show: 'race', place: 'The Point', spot: 'lagoon', verb: 'swim', water: true },
  'balance-beam': { plate: 'beam', hour: 'day', show: 'race', place: 'The Beam', spot: 'beach', verb: 'beam', water: true },
  'gauntlet-run': { plate: 'field', hour: 'day', show: 'race', place: 'The Field', spot: 'beach-field', verb: 'run' },
};

// The final, in the order it is run (js/ch/final.js playFinal).
export const FINAL_STAGE = {
  start: { plate: 'field', hour: 'day', place: 'The Final', spot: 'beach-field' },
  cp1: { plate: 'beach', hour: 'day', place: 'Checkpoint One', spot: 'beach', name: 'The Beach Haul',
    rules: ['Every finalist starts with a sandbag twice the weight of a carry-on, at the far end of the beach.',
      'They haul it the length of the sand, drop it at the flag, and run back for the next one, five times.',
      'A bag that splits has to be refilled before it counts, and nobody can help anybody.',
      'The order they finish in counts toward the final, and the slowest of each division faces an instant elimination.'] },
  instant: { plate: 'tiki', hour: 'day', place: 'The Tiki Path', spot: 'tiki-path' },
  overnight: { plate: 'camp', hour: 'night', place: 'The Overnight', spot: 'overnight-camp' },
  cp2: { plate: 'ridge', hour: 'day', place: 'Checkpoint Two', spot: 'summit', name: 'The Ridge Puzzle',
    rules: ['A table waits for each finalist on the ridge, with a puzzle frame and a pile of loose pieces.',
      'They fit every piece into the frame, after a night with no sleep, while the wind takes anything left loose.',
      'A piece in the wrong place means the frame will not lock, and they have to find it themselves.',
      'Their time on the puzzle goes on the total, and the race up the mountain starts the moment it locks.'] },
  cp3: { plate: 'trail', hour: 'day', place: 'Checkpoint Three', spot: 'summit', name: 'The Summit Run',
    rules: ['The last leg is a run up the jungle trail to the summit, where TJ waits at the finish arch.',
      'They climb, run and keep going on whatever their legs have left.',
      'Nobody is carried, and anybody who stops for too long has their time stopped for them.',
      'The fastest total over the whole final wins: the first man and the first woman are the champions.'] },
  finish: { plate: 'summit', hour: 'day', place: 'The Summit', spot: 'summit' },
};

export const ARENA_STAGE = { plate: 'arena', hour: 'night', place: 'The Arena', spot: 'arena' };

const firstUp = s => s.charAt(0).toUpperCase() + s.slice(1);
/** The rules card's four lines, from a desc: one sentence each. */
export function rulesOf(desc) {
  const parts = String(desc || '').match(/[^.!?]+[.!?]+/g) || [];
  return parts.map(p => firstUp(p.trim()));
}
export const dailyDef = id => DAILIES.find(d => d.id === id) || null;
export const arenaDef = id => ARENA_GAMES.find(g => g.id === id) || null;

// ── seeded picks ──────────────────────────────────────────────────────
export function hashOf(str) {
  let h = 2166136261;
  for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export const pickBy = (arr, key) => arr[hashOf(key) % arr.length];
const and = list => list.length <= 1 ? (list[0] || '') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
export const nameList = and;

// ── TJ opens a game ───────────────────────────────────────────────────
export const TJ_DAILY_OPEN = [
  'Good morning, everybody! Today\'s daily is {game}. Let me tell you how it works.',
  'Rise and shine, people! This is {game}, and somebody is winning safety today.',
  'Welcome to today\'s daily! It\'s called {game}. Listen up, because I\'m only saying this once.',
  'Everybody here? Good. Today you\'re playing {game}.',
];
export const TJ_DAILY_NIGHT = [
  'Surprise! Today\'s daily is tonight. It\'s {game}, and it\'s dark out there.',
  'Good evening, everybody! Tonight\'s daily is {game}. Let me tell you how it works.',
];
export const TJ_WELCOME = [
  'Welcome to Blue Lagoon, everybody! I\'m TJ Maxx, and for the next few weeks this island is your home.',
  'What\'s up, everybody! Welcome to Blue Lagoon. Look around, because some of you won\'t be here very long.',
  'Welcome to Blue Lagoon! Vets, welcome back. Rookies, welcome to the hardest show on television.',
];
// TJ meets the plane, then the welcome speech (the real premiere: "Welcome back to The Challenge... you have
// no idea what's in store for you... only one person is walking out of here... go get moved in").
export const TJ_LANDING = [
  'There they are! Come on down, everybody! Welcome to Blue Lagoon!',
  'Welcome, welcome, welcome! Watch your step, that last one is a big one!',
];
export const TJ_SPEECH = [
  ['Alright, everybody, gather round.',
   '{vets} of you have done this before. {rookies} of you have never seen a daily in your life. Out here, none of that matters. Everybody starts at zero.',
   'Some of you came with friends. Some of you came with enemies. Those relationships could help you, or they could take you out.',
   'Every week, the house decides who goes into the Arena. Win in there, you come back. Lose, and you go home.',
   "Only the champions walk out of here with the money. So make your friends, make your enemies, and don't get comfortable."],
  ['Okay, look at me, everybody. Welcome to The Challenge.',
   "You're on an island in the middle of nowhere, and for the next few weeks this is your whole world.",
   "{vets} vets, {rookies} rookies. The vets think they know what's coming. They don't.",
   'You win dailies, you stay safe. You lose friends, you go to the Arena. You lose in the Arena, you go home.',
   'Last ones standing run the final. Everybody else watches from home. Got it?'],
];
export const TJ_FIRST_DAILY = [
  'Bags down. Your first daily starts right now, right here.',
  'Don\'t get comfortable. Your first daily starts right now.',
  'You didn\'t think you were going to the villa first, did you? Your first daily starts now.',
];
export const TJ_GO = ['Go!', 'Three, two, one... GO!', 'Let\'s GO!', 'And GO!'];
export const TJ_ARENA_ASK = [
  '{a}, it\'s your call now. Who are you bringing in here with you?',
  '{a}, the floor is yours. Who are you calling out?',
];
export const TJ_ARENA_RULES = [
  'Tonight you\'re playing {game}. Here\'s how it works.',
  'Tonight\'s elimination is {game}. Listen up.',
];
export const TJ_ARENA_OUT = [
  '{b}, you\'ve been eliminated. You can head out.',
  '{b}, I\'m sorry, buddy. You\'re done. Head on out.',
];

// ── what the camera sees during a daily ───────────────────────────────
// Each pool takes {who} (one or more names) and is said in the plain present tense.
export const PLAY = {
  hang: {
    start: ['Everybody climbs down and grabs the net under the pier.'],
    sag: ['The crew lets the net down. Their feet are just above the water now.', 'The net drops again, and the tide is coming in.'],
    drop1: ['{who} lets go and drops into the water.', '{who} can\'t hold on any longer and lets go.', '{who}\'s foot touches the water. That\'s out.'],
    dropN: ['{who} drop into the water, one after another.', '{who} let go at almost the same time.'],
  },
  last: {
    start: { quiz: ['Everybody climbs onto a platform. TJ has a stack of questions about the house.'],
      smash: ['Every side runs to its tower and picks up a ram.'] },
    drop1: { quiz: ['{who} gets one wrong and gets knocked in.', '{who} falls in without anybody touching them.'],
      smash: ['{who}\'s tower comes down.', 'A ram hits {who}\'s tower, and it falls.'] },
    dropN: { quiz: ['{who} go into the water.', 'Wrong answers from {who}. They\'re all in the water.'],
      smash: ['{who} lose their towers.', 'Two more towers fall: {who}.'] },
  },
  race: {
    start: { jump: ['The first climbers start up the ladder on the cliff face.'], swim: ['Everybody runs into the water.'],
      pull: ['They lean into the harnesses, and the trucks start to move.'], maze: ['Everybody runs into the maze.'],
      beam: ['The first ones step onto the beam with full buckets.'], run: ['Everybody takes off for the tyres.'] },
    lead: ['{who} is out in front.', '{who} has the lead.', 'Right now it\'s {who} in front.'],
    leadN: ['{who} are out in front.', 'Right now it\'s {who} in front.'],
    back: ['{who} is falling behind.', '{who} is struggling.'],
    backN: ['{who} are falling behind.', '{who} are struggling.'],
    close: ['It\'s close at the front.', 'Nobody is pulling away yet.'],
  },
  thrown: ['{who} isn\'t really trying.'],
  hurt: ['{who} goes down hard and gets up slowly.'],
  hurtWet: ['{who} gets a cramp and has to stop for a minute.', '{who} swallows a mouthful of water and stops to cough.'],
  clutch: ['{who} finds another gear right at the end.'],
  choke: ['{who} can\'t get going today.', 'This isn\'t {who}\'s day.'],
};

// ── the Arena, round by round ─────────────────────────────────────────
export const DUEL = {
  rounds: {
    win: ['{w} takes round {n}.', 'Round {n} goes to {w}.', '{w} wins round {n}.'],
    close: ['Round {n} is close, but it goes to {w}.'],
  },
  stage: {
    ahead: ['{w} is ahead.', '{w} pulls in front.', '{w} has the lead.'],
    close: ['It\'s neck and neck, but {w} is just in front.'],
    swap: ['{w} takes the lead.', 'And now {w} is in front.'],
  },
  hold: {
    hold: ['They\'re both still hanging. {w} looks stronger.', 'The bar goes down a notch. {w} is holding better.'],
    close: ['They\'re both shaking now.'],
  },
};
export const fill = (t, o) => String(t).replace(/\{(\w+)\}/g, (m, k) => (o[k] != null ? o[k] : m));
