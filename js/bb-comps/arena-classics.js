// ══════════════════════════════════════════════════════════════════════
// bb-comps/arena-classics.js — five more Block Buster games
// ══════════════════════════════════════════════════════════════════════
//
// The arena's first thirteen games came out six mental and five physical, with
// two endurance and nothing else at all — so a house that ran the Block Buster
// every week played a memory game or a scramble almost every time, and the
// nominee whose game was accuracy or nerve never got a night that suited them.
// These five are one puzzle, one quiz, one crapshoot and two precision, chosen
// off the wiki's recurring competition lists.
//
// They keep the arena's shape, which is not the same as an ordinary
// competition's: three nominees, the whole house at the glass, a vote already
// on the schedule and no version of losing that does not end in a chair. The
// scaffolding is shared with arena.js deliberately — the falls, the play-by-
// play coverage and the finish are the arena's voice, and five games written
// with their own versions of it would sound like a different show.
import { pronouns, pStats } from '../players.js';
import { nightForm, scoreField, toResult, beat, vb } from './_shared.js';
import { arenaFinish, arenaFalls, arenaPlayByPlay, arenaGrudge, say } from './arena.js';
import { bond } from '../bb-events/_read.js';

// ── PRECISION ─────────────────────────────────────────────────────────

const PLAY_perfectShot = {
  leader: [
    (n, p) => `${n} has stopped looking at the hoop before the ball leaves ${p.posAdj} hands, which is the tell of somebody who already knows. Six in a row from the deep mark.`,
    (n, p) => `${n} shoots the same way every single time — same set, same release, same follow-through — and the arena cannot find a way to make that interesting or a way to stop it.`,
    (n, p) => `The lights drop to distract ${n} and ${n} sinks the next one in the dark.`,
  ],
  mid: [
    (n, p) => `${n} is hitting from the near marks and nothing from the deep one, which is enough to stay in it and nowhere near enough to win it.`,
    (n, p) => `${n} rushes the shot every time the house makes noise, and the house has worked that out.`,
    (n, p) => `${n} finds ${p.posAdj} range four shots too late.`,
  ],
};

const perfectShot = {
  id: 'bb-arena-perfect-shot',
  name: 'Perfect Shot', category: 'precision', types: ['arena'],
  weight: () => 4,
  desc: 'Three shooting marks are painted at increasing distances from a raised hoop, and each nominee works their way back from the near one with a rack of balls and a clock. A ball sunk from a mark moves that nominee a mark further out; a ball missed sends them back in, so a bad run does not just fail to score, it undoes the ground already made. The deep mark is worth several times the near one and is the only place the game can actually be won from. Whoever is furthest out with the most sunk when the horn goes wins safety.',
  stats: { physical: 0.30, intuition: 0.28, temperament: 0.26, mental: 0.16 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 2.6, context, rng });
    const beats = [];
    beats.push(beat(
      'Three marks, one hoop, and a rule that sends you backwards for every miss. The house is at the glass and has been told it may make as much noise as it likes.',
      participants.slice(0, 3), 'BACK TO THE MARK'));
    const rushed = [...entries].sort((x, y) => x.score - y.score)[0];
    const p = pronouns(rushed.name);
    beats.push(beat(
      `${rushed.name} sinks two from the near mark, gets sent back in on the third, and ${vb(p, 'starts', 'start')} shooting faster — which is the one adjustment this game punishes.`,
      [rushed.name], 'SENT BACK', 'grey'));
    arenaPlayByPlay(entries, rng, beats, PLAY_perfectShot);
    arenaFalls([...entries].reverse(), rng, beats);
    arenaGrudge(entries, api, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown, variant: 'perfectshot' });
  },
};

const PLAY_niagara = {
  leader: [
    (n, p) => `${n} works out that the water is on a cycle and starts moving in the gaps rather than fighting it. Nobody else in the arena has noticed there are gaps.`,
    (n, p) => `${n} carries two at a time under the fall, loses neither, and does it again while the other two are still drying their hands.`,
    (n, p) => `${n} takes the whole weight of it across the shoulders and keeps the ball dead level underneath. It should not be possible to look calm doing that.`,
  ],
  mid: [
    (n, p) => `${n} gets through the fall clean and drops the ball on the dry side, which is somehow worse than dropping it in the water.`,
    (n, p) => `${n} is quick between the falls and slow underneath them, and the falls are most of the course.`,
    (n, p) => `Every time ${n} looks up ${p.sub} ${vb(p, 'takes', 'take')} a face full of it and loses a second.`,
  ],
};

const niagaraBalls = {
  id: 'bb-arena-niagara-balls',
  name: 'Niagara Balls', category: 'precision', types: ['arena'],
  weight: () => 4,
  desc: 'A course of narrow beams runs beneath a row of falling water, with a rack of balls at one end and a scoring cradle at the other. Each nominee carries the balls across one or two at a time, and the falls come down hard enough on the shoulders to take a ball out of somebody\'s arms or take them off the beam entirely. A ball that goes in the water is gone for the round and has to be replaced from the rack, which costs the whole trip. The fullest cradle when the horn goes wins safety.',
  stats: { physical: 0.32, temperament: 0.26, endurance: 0.22, intuition: 0.20 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 2.9, context, rng });
    const beats = [];
    beats.push(beat(
      'Narrow beams, a wall of falling water and a cradle on the far side. The house has been let out to watch this one from the rail, and it is loud.',
      participants.slice(0, 3), 'UNDER THE FALL'));
    const soaked = entries[entries.length - 1];
    const p = pronouns(soaked.name);
    beats.push(beat(
      `${soaked.name} goes into the water on the second crossing and comes up holding nothing. ${p.Sub} ${vb(p, 'has', 'have')} to go back to the rack and start the trip again, and the clock does not care.`,
      [soaked.name], 'IN THE WATER', 'red'));
    arenaPlayByPlay(entries, rng, beats, PLAY_niagara);
    arenaFalls([...entries].reverse(), rng, beats);
    arenaGrudge(entries, api, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown, variant: 'niagara' });
  },
};

// ── PUZZLE ────────────────────────────────────────────────────────────

const PLAY_knightMoves = {
  leader: [
    (n, p) => `${n} walks the board like the shape is already drawn on it, and never once has to step backwards to prove a square was legal.`,
    (n, p) => `${n} plans four squares ahead and then stops planning and just moves, which is the only way anybody finishes this.`,
    (n, p) => `${n} takes the long way round a corner nobody else avoided and it turns out to be the only route through.`,
  ],
  mid: [
    (n, p) => `${n} gets most of the way across and finds ${p.ref} on a square with no legal move out of it. Back to the start.`,
    (n, p) => `${n} counts every move out loud — two forward, one across — and is still faster than thinking about it silently would have been.`,
    (n, p) => `${n} keeps trying to move like a piece the board does not have.`,
  ],
};

const knightMoves = {
  id: 'bb-arena-knight-moves',
  name: 'Knight Moves', category: 'puzzle', types: ['arena'],
  weight: () => 4,
  desc: 'The arena floor is laid out as a giant chequered board and each nominee has to cross it from one corner to the opposite one moving only the way a knight moves — two squares one way and one square across, every time, no exceptions. Squares already stepped on go dark and cannot be used again, so a route that felt safe three moves ago can strand somebody with no legal square to jump to, and being stranded means walking back and starting the crossing over. Nothing here is about speed. First nominee to reach the far corner wins safety.',
  stats: { mental: 0.36, strategic: 0.26, intuition: 0.22, temperament: 0.16 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 4.0, context, rng });
    const beats = [];
    beats.push(beat(
      'A chequered floor, one legal move, and every square that has been used going dark behind them. The house can see the whole board from the glass and is not allowed to say a word.',
      participants.slice(0, 3), 'ONE LEGAL MOVE'));
    const stranded = [...entries].sort((x, y) => x.score - y.score)[0];
    beats.push(beat(
      `${stranded.name} is nine squares in with nothing legal left in any direction. The walk back across the dark squares is the longest thirty seconds of the night.`,
      [stranded.name], 'STRANDED', 'red'));
    arenaPlayByPlay(entries, rng, beats, PLAY_knightMoves);
    arenaFalls([...entries].reverse(), rng, beats);
    arenaGrudge(entries, api, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown, variant: 'knightmoves' });
  },
};

// ── QUIZ ──────────────────────────────────────────────────────────────

const PLAY_crossword = {
  leader: [
    (n, p) => `${n} fills the long across clue from two letters and the rest of the grid opens underneath it.`,
    (n, p) => `${n} answers a clue about a conversation ${p.sub} ${vb(p, 'was', 'were')} not even in, correctly, and does not explain how.`,
    (n, p) => `${n} works the grid rather than the clues — counting boxes, guessing shapes — and it is beating everybody who is reading properly.`,
  ],
  mid: [
    (n, p) => `${n} has a whole corner of the grid built out of one wrong answer and has not realised yet.`,
    (n, p) => `${n} gets the down clues and none of the across ones, which leaves a grid full of holes and a lot of time gone.`,
    (n, p) => `${n} knows the answer and cannot make it fit the boxes, which in here is the same as not knowing it.`,
  ],
};

const instantCrossword = {
  id: 'bb-arena-instant-crossword',
  name: 'Instant Crossword', category: 'quiz', types: ['arena'],
  weight: () => 4,
  desc: 'Each nominee stands at a floor-sized crossword grid with the clues read aloud over the speakers, every one of them about something that has happened in this house — who said what, who voted how, which day somebody went on slop. Answers are built by carrying lettered blocks to the grid and dropping them in the boxes, so a wrong answer is not just wrong, it is a corner of the grid that has to be pulled apart again before anything crossing it will fit. Whoever has the most correctly filled squares when the horn goes wins safety.',
  stats: { mental: 0.34, intuition: 0.26, social: 0.22, temperament: 0.18 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 3.6, context, rng });
    const beats = [];
    beats.push(beat(
      'Three floor-sized grids and a voice reading clues about the last four weeks of this house. Everything in the puzzle happened in front of them.',
      participants.slice(0, 3), 'CLUES FROM THE HOUSE'));
    // A clue about the block, read out to the people standing on it.
    const noms = (context.nominees || participants).filter(Boolean);
    if (noms.length >= 2) {
      const p = pronouns(noms[0]);
      beats.push(beat(
        `One of the across clues is the name of the houseguest who put these three up. All three of them fill it in without hesitating, and none of them look up while ${vb(p, 'does', 'do')}.`,
        [...noms.slice(0, 3)], 'EVERYBODY KNEW THAT ONE', 'grey'));
    }
    arenaPlayByPlay(entries, rng, beats, PLAY_crossword);
    arenaFalls([...entries].reverse(), rng, beats);
    arenaGrudge(entries, api, beats);
    arenaFinish(entries, api, rng, beats);
    return toResult(entries, { beats, breakdown, variant: 'crossword' });
  },
};

// ── LUCK ──────────────────────────────────────────────────────────────

const PLAY_onTilt = {
  leader: [
    (n, p) => `${n} nudges the table exactly as hard as it can be nudged and not a fraction harder, over and over, and the ball keeps finding the lit lanes.`,
    (n, p) => `${n} stops trying to steer it and starts trying to keep it alive, which is the only strategy this table respects.`,
    (n, p) => `The ball does something on ${n}'s table that the arena has probably never seen and does not have a rule for. It counts.`,
  ],
  mid: [
    // No TILT line in here. The tilt is a real event with real consequences
    // further down — a coverage line that says the light came on and then
    // changes nothing is the decorative version of the only rule this table has.
    (n, p) => `${n} traps the ball on a flipper, holds it, and cannot think of a single thing to do with it that is better than letting go.`,
    (n, p) => `${n} plays it clean and gets nothing for it, because the table does not care how clean anybody is.`,
    (n, p) => `${n} has the best hands in the arena and the worst table in it.`,
  ],
};

const onTilt = {
  id: 'bb-arena-on-tilt',
  name: 'On Tilt', category: 'luck', types: ['arena'],
  weight: () => 4,
  desc: 'Each nominee plays a pinball table the size of a car, with the lit lanes scoring and the flippers barely able to reach the ball once it is loose. The table can be nudged with the hips to steer a ball away from the drain, but nudge it too hard and a TILT light comes on that wipes everything scored on that ball, so the useful move and the disastrous one are the same move at slightly different strengths. Three balls each and no way to earn another. The highest total when the last ball drains wins safety.',
  // A crapshoot, on purpose. The arena is where somebody's game ends, and it
  // should not always end because they were the worst player in it.
  stats: { intuition: 0.30, temperament: 0.28, physical: 0.22, boldness: 0.20 },
  simulate(participants, context, api, rng) {
    const { entries, breakdown } = scoreField(participants, { mix: this.stats, luck: 4.2, context, rng });
    const beats = [];
    beats.push(beat(
      'Three tables, three balls each, and a tilt light that takes everything the ball has earned if anybody leans on it too hard.',
      participants.slice(0, 3), 'THREE BALLS'));
    // The arena's cruellest possibility, said out loud: this one is not about
    // who is better.
    const unlucky = entries[entries.length - 1];
    const p = pronouns(unlucky.name);
    beats.push(beat(
      `${unlucky.name} loses the first ball down the middle without touching a flipper. There is nothing to learn from it and nothing ${p.sub} could have done, and ${p.sub} ${vb(p, 'is', 'are')} now playing two balls against three.`,
      [unlucky.name], 'STRAIGHT DOWN THE MIDDLE', 'red'));
    arenaPlayByPlay(entries, rng, beats, PLAY_onTilt);

    // ── THE TILT ──
    //
    // The light the whole competition is named after, and it was only ever
    // arriving as one line in the random play-by-play pool — so most nights
    // nobody tilted at all and the table's one real rule never came up.
    //
    // It is a temperament read now. Leaning on the table is what somebody does
    // when they have stopped playing and started arguing with it, so the least
    // even-tempered player in the arena is the likeliest to do it, and the
    // consequences are the point: a tilt is loud, it is funny from the glass,
    // and it is watched by three people who have to sit in a house with them
    // afterwards.
    const tiltPull = entries.map(e => {
      const st = pStats(e.name);
      return { e, pull: (10 - (st.temperament || 5)) * 0.09 + (st.boldness || 5) * 0.03 };
    }).sort((x, y) => y.pull - x.pull);
    const tiltCandidate = tiltPull[0];
    if (tiltCandidate && rng() < Math.min(0.72, tiltCandidate.pull)) {
      const who = tiltCandidate.e.name;
      const tp = pronouns(who);
      beats.push(beat(
        `${who} loses a ball to the left outlane and hits the table with both hips at once. The TILT light comes on, everything that ball earned goes back to zero, and the flippers die under ${tp.posAdj} hands for the rest of it. ${tp.Sub} ${vb(tp, 'stands', 'stand')} there with nothing to hit and nowhere to put it.`,
        [who], 'TILT', 'red'));
      // Great television, poor composure — and the house saw both.
      api.popDelta(who, 2);
      api.record(who, 'tilted', { competition: 'On Tilt' });
      // Somebody at the glass laughs before they can stop themselves. It is not
      // cruelty and it costs them anyway, because it was not their night to
      // find funny.
      const glass = (context.house || []).filter(n => n && !participants.includes(n));
      if (glass.length) {
        const laugher = glass[Math.floor(rng() * glass.length)];
        beats.push(beat(
          `${laugher} laughs at it from behind the glass, once, and loudly enough to carry. ${who} does not look over, which is worse than looking over.`,
          [laugher, who], 'HEARD THAT', 'red'));
        api.addBond(who, laugher, -0.8);
        api.popDelta(laugher, -1);
      }
    }

    arenaFalls([...entries].reverse(), rng, beats);
    arenaGrudge(entries, api, beats);
    arenaFinish(entries, api, rng, beats);
    // Losing the arena to a bad bounce is a different grievance from losing it
    // to a better player, and the house talks about it differently.
    const last = entries[entries.length - 1];
    const winner = entries[0];
    if (last && winner && bond(last.name, winner.name) <= 0) api.addBond(last.name, winner.name, -0.3);
    // ...and the flipside nobody writes down: winning a crapshoot earns you
    // nothing with the room. The house does not credit luck, so the winner
    // takes none of the respect a real competition win carries.
    if (winner) api.record(winner.name, 'won-on-luck', { competition: 'On Tilt' });
    return toResult(entries, { beats, breakdown, variant: 'ontilt' });
  },
};

export const ARENA_CLASSIC_COMPS = [
  perfectShot, niagaraBalls, knightMoves, instantCrossword, onTilt,
];

export default ARENA_CLASSIC_COMPS;
